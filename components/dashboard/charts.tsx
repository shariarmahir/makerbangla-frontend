"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart as EBar, FunnelChart as EFunnel, GaugeChart as EGauge, HeatmapChart as EHeat, LineChart as ELine, PieChart as EPie } from "echarts/charts";
import { CalendarComponent, GridComponent, MarkLineComponent, PolarComponent, TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { cn } from "@/lib/utils";
import { palette, seriesColors } from "./palette";

echarts.use([EBar, ELine, EPie, EGauge, EFunnel, EHeat, GridComponent, TooltipComponent, PolarComponent, CalendarComponent, VisualMapComponent, MarkLineComponent, CanvasRenderer]);

/**
 * Dashboard charts on Apache ECharts (canvas): glowing gradient lines, rounded gradient bars with tracks,
 * padded donuts, activity rings, counting gauges, a conversion funnel and a calendar heatmap.
 * Brand colours come from CSS tokens, charts animate once when scrolled into view, and motion is off for
 * reduced-motion users. Props stay plain data (formats by name) so server pages can render them.
 */

type Series = { name: string; color: string; values: number[] };
const formats = {
  plain: (n: number) => new Intl.NumberFormat("en-IN", { notation: n >= 100_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n),
  compact: (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n),
  bdt: (n: number) => `BDT ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`,
};
type Fmt = keyof typeof formats;

// ——— Colours: CSS tokens → canvas colours ———
const cache = new Map<string, [number, number, number]>();
function rgb(c: string): [number, number, number] {
  let v = cache.get(c);
  if (!v) {
    const probe = document.createElement("i");
    probe.style.color = c;
    document.body.appendChild(probe);
    const css = getComputedStyle(probe).color;
    probe.remove();
    // "rgb(0, 158, 255)" or, for color-mix(), "color(srgb 0.55 0.8 1)"
    const m = css.replace(/^color\(srgb/, "").match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    const k = css.startsWith("color(") ? 255 : 1;
    v = [Math.round(m[0] * k), Math.round(m[1] * k), Math.round(m[2] * k)];
    cache.set(c, v);
  }
  return v;
}
const col = (c: string, a = 1) => `rgba(${rgb(c).join(",")},${a})`;
const fade = (c: string, top = 0.38, bottom = 0) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: col(c, top) }, { offset: 1, color: col(c, bottom) }]);
const solid = (c: string, from = 1, to = 0.55) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: col(c, from) }, { offset: 1, color: col(c, to) }]);
const sweep = (c: string) => new echarts.graphic.LinearGradient(0, 0, 1, 1, [{ offset: 0, color: col(c, 0.55) }, { offset: 1, color: col(c, 1) }]);

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** One glass tooltip for every chart. */
const tooltip = (fmt: Fmt, trigger: "axis" | "item" = "axis", pointer: "line" | "shadow" | "none" = "line") => ({
  trigger,
  confine: true,
  backgroundColor: "rgba(14,42,107,0.92)",
  borderWidth: 0,
  padding: [10, 14],
  extraCssText: "border-radius:16px;backdrop-filter:blur(10px);box-shadow:0 20px 40px -12px rgba(14,31,77,.55);",
  textStyle: { color: "#fff", fontSize: 12 },
  axisPointer:
    pointer === "shadow"
      ? { type: "shadow", shadowStyle: { color: "rgba(0,158,255,0.07)" } }
      : pointer === "line"
        ? { type: "line", lineStyle: { color: "rgba(26,73,175,0.35)", type: [4, 4], width: 1.5 } }
        : { type: "none" },
  formatter: (raw: unknown) => {
    const list = (Array.isArray(raw) ? raw : [raw]) as { axisValueLabel?: string; name?: string; seriesName?: string; value?: unknown; color?: unknown; data?: { color?: string } }[];
    const head = list[0]?.axisValueLabel ?? (trigger === "item" ? undefined : list[0]?.name);
    const rows = list
      .map((p) => {
        const v = Array.isArray(p.value) ? Number(p.value[1]) : Number(p.value ?? 0);
        const dot = typeof p.color === "string" ? p.color : (p.data?.color ?? "#ffd850");
        const name = trigger === "item" ? (p.name ?? "") : (p.seriesName ?? "");
        return `<div style="display:flex;justify-content:space-between;gap:18px;padding:2px 0"><span style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.8)"><i style="width:8px;height:8px;border-radius:9px;background:${dot}"></i>${esc(name)}</span><b style="font-variant-numeric:tabular-nums">${esc(formats[fmt](v))}</b></div>`;
      })
      .join("");
    return `${head ? `<div style="font-weight:900;color:#ffd850;margin-bottom:6px">${esc(head)}</div>` : ""}${rows}`;
  },
});

const reduceQuery = "(prefers-reduced-motion: reduce)";

/** Mounts one ECharts instance, sizes it with its box, and draws when it first scrolls into view. */
function EChart({ build, deps, className, style, label }: { build: () => echarts.EChartsCoreOption; deps: unknown; className?: string; style?: React.CSSProperties; label?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);
  const [seen, setSeen] = useState(false);
  const sig = JSON.stringify(deps);

  useEffect(() => {
    const node = el.current!;
    const c = echarts.init(node, null, { renderer: "canvas" });
    chart.current = c;
    const ro = new ResizeObserver(() => c.resize());
    ro.observe(node);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin: "0px 0px -8% 0px" });
    io.observe(node);
    return () => (ro.disconnect(), io.disconnect(), c.dispose(), void (chart.current = null));
  }, []);

  useEffect(() => {
    if (!seen || !chart.current) return;
    const still = matchMedia(reduceQuery).matches;
    const font = getComputedStyle(document.body).fontFamily;
    chart.current.setOption({ animation: !still, animationDuration: 1300, animationEasing: "cubicOut", animationDurationUpdate: 700, textStyle: { fontFamily: font }, ...build() }, { notMerge: false, lazyUpdate: true });
    // build is derived from `deps`; redraw only when the data actually changes (not on every live refresh)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, sig]);

  return <div ref={el} role="img" aria-label={label} className={className} style={style} />;
}

const axisLabel = { color: "#4a5679", fontSize: 11, fontWeight: 600 };
const xAxis = (labels: string[], boundaryGap = true) => ({ type: "category", data: labels, boundaryGap, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { ...axisLabel, margin: 12 } });
const yAxis = (fmt: Fmt = "compact") => ({ type: "value", splitNumber: 4, axisLabel: { ...axisLabel, formatter: (v: number) => formats[fmt === "bdt" ? "compact" : fmt](v) }, splitLine: { lineStyle: { color: "#dfe7f2", type: [4, 6] } } });
const grid = { left: 4, right: 8, top: 14, bottom: 4, containLabel: true };
const glowLine = (c: string, width = 3) => ({ width, color: col(c), shadowColor: col(c, 0.45), shadowBlur: 16, shadowOffsetY: 10, cap: "round" });
const hoverDot = (c: string) => ({ symbol: "circle", symbolSize: 10, showSymbol: false, itemStyle: { color: col(c), borderColor: "#fff", borderWidth: 3, shadowColor: col(c, 0.6), shadowBlur: 10 } });

export function Legend({ items, className }: { items: { name: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] font-bold text-subtle", className)}>
      {items.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 0 3px color-mix(in srgb, ${s.color} 18%, transparent)` }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

/** Smooth glowing multi-series area chart. */
export function LineChart({ labels, series, height = 240, format = "plain" }: { labels: string[]; series: Series[]; height?: number; format?: Fmt }) {
  return (
    <EChart
      style={{ height }}
      label={series.map((s) => s.name).join(", ")}
      deps={{ labels, series, format }}
      build={() => ({
        grid,
        tooltip: tooltip(format),
        xAxis: xAxis(labels, false),
        yAxis: yAxis(format),
        series: series.map((s, k) => ({ type: "line", name: s.name, data: s.values, smooth: 0.4, ...hoverDot(s.color), lineStyle: glowLine(s.color), areaStyle: { color: fade(s.color, k ? 0.18 : 0.32) }, animationDelay: k * 180, emphasis: { focus: "series" } })),
      })}
    />
  );
}

/** Rounded gradient bars on soft tracks (grouped or stacked). */
export function BarChart({ labels, series, height = 240, format = "plain", stacked = false }: { labels: string[]; series: Series[]; height?: number; format?: Fmt; stacked?: boolean }) {
  return (
    <EChart
      style={{ height }}
      label={series.map((s) => s.name).join(", ")}
      deps={{ labels, series, format, stacked }}
      build={() => ({
        grid,
        tooltip: tooltip(format, "axis", "shadow"),
        xAxis: xAxis(labels),
        yAxis: yAxis(format),
        series: series.map((s, k) => ({
          type: "bar",
          name: s.name,
          data: s.values,
          stack: stacked ? "all" : undefined,
          barMaxWidth: 18,
          barGap: "30%",
          showBackground: !stacked && k === 0,
          backgroundStyle: { color: "rgba(242,246,252,0.9)", borderRadius: 10 },
          itemStyle: { color: solid(s.color), borderRadius: stacked ? (k === series.length - 1 ? [10, 10, 0, 0] : 0) : [10, 10, 4, 4] },
          emphasis: { itemStyle: { shadowBlur: 18, shadowColor: col(s.color, 0.45) } },
          animationDelay: (i: number) => i * 45 + k * 120,
        })),
      })}
    />
  );
}

/** Revenue analysis: gradient bars, a glowing area and a dashed line with an average marker, 6M / 12M switch. */
export function ComboChart({ labels, bars, area, line, height = 280, format = "bdt" }: { labels: string[]; bars: Series; area: Series; line: Series; height?: number; format?: Fmt }) {
  const [range, setRange] = useState<6 | 12>(12);
  const from = Math.max(0, labels.length - range);
  const cut = (s: Series) => s.values.slice(from);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Legend items={[bars, area, line]} />
        <div className="flex rounded-xl bg-soft p-1">
          {([6, 12] as const).map((r) => (
            <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={cn("h-7 rounded-lg px-3 text-[11.5px] font-black transition-colors", range === r ? "bg-white text-tile-navy shadow-sm" : "text-subtle hover:text-ink")}>
              {r}M
            </button>
          ))}
        </div>
      </div>
      <EChart
        style={{ height }}
        label="Revenue analysis"
        deps={{ labels, bars, area, line, range }}
        build={() => ({
          grid,
          tooltip: tooltip(format, "axis", "shadow"),
          xAxis: xAxis(labels.slice(from)),
          yAxis: yAxis(format),
          series: [
            {
              type: "bar", name: bars.name, data: cut(bars), barMaxWidth: 26, itemStyle: { color: solid(bars.color, 0.95, 0.35), borderRadius: [12, 12, 4, 4] },
              showBackground: true, backgroundStyle: { color: "rgba(242,246,252,0.85)", borderRadius: 12 },
              animationDelay: (i: number) => i * 55,
              markLine: { symbol: "none", silent: true, data: [{ type: "average", name: "Average" }], lineStyle: { color: col(bars.color, 0.55), type: [2, 5], width: 1.5 }, label: { formatter: "avg", color: col(bars.color), fontWeight: 800, fontSize: 10 } },
            },
            { type: "line", name: area.name, data: cut(area), smooth: 0.45, ...hoverDot(area.color), lineStyle: glowLine(area.color, 3.5), areaStyle: { color: fade(area.color, 0.34) }, animationDelay: 250, z: 3 },
            { type: "line", name: line.name, data: cut(line), smooth: 0.45, ...hoverDot(line.color), lineStyle: { ...glowLine(line.color, 2.5), type: [6, 6], shadowBlur: 8 }, animationDelay: 450, z: 4 },
          ],
        })}
      />
    </div>
  );
}

/** Padded, rounded donut; the hovered slice grows. */
export function Donut({ data, size = 180, center, sub, format = "plain" }: { data: { label: string; value: number; color: string }[]; size?: number; center?: string; sub?: string; format?: Fmt }) {
  const shown = data.filter((d) => d.value > 0);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <EChart
        className="absolute inset-0"
        label={data.map((d) => `${d.label} ${d.value}`).join(", ")}
        deps={{ shown, format }}
        build={() => ({
          tooltip: tooltip(format, "item", "none"),
          series: [
            {
              type: "pie", radius: ["66%", "90%"], padAngle: shown.length > 1 ? 3 : 0, startAngle: 90, avoidLabelOverlap: true, label: { show: false },
              itemStyle: { borderRadius: 9 },
              emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 22, shadowColor: "rgba(14,31,77,0.25)" } },
              animationType: "scale", animationEasing: "elasticOut", animationDuration: 1400,
              data: shown.length ? shown.map((d) => ({ name: d.label, value: d.value, itemStyle: { color: sweep(d.color) }, color: col(d.color) })) : [{ name: "No data", value: 1, itemStyle: { color: "#f2f6fc" } }],
            },
          ],
        })}
      />
      {center && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-[clamp(1.1rem,2vw,1.55rem)] leading-none font-black text-ink tabular-nums">{center}</p>
          {sub && <p className="mx-auto mt-1 max-w-[7.5rem] text-[10.5px] leading-tight font-bold text-subtle">{sub}</p>}
        </div>
      )}
    </div>
  );
}

/** Concentric activity rings on a polar axis; each ring is relative to `max` (default: the largest value). */
export function RadialRings({ data, max, center, sub, size = 210 }: { data: { label: string; value: number; color: string }[]; max?: number; center?: string; sub?: string; size?: number }) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <EChart
        className="absolute inset-0"
        label={data.map((d) => `${d.label} ${d.value}`).join(", ")}
        deps={{ data, top }}
        build={() => ({
          tooltip: { ...tooltip("plain", "item", "none"), formatter: (p: { dataIndex: number }) => tooltip("plain", "item", "none").formatter({ name: data[p.dataIndex].label, value: data[p.dataIndex].value, color: col(data[p.dataIndex].color) }) },
          polar: { radius: ["30%", "98%"] },
          angleAxis: { max: top, startAngle: 90, show: false },
          radiusAxis: { type: "category", data: data.map((d) => d.label).reverse(), show: false },
          series: [
            {
              type: "bar", coordinateSystem: "polar", roundCap: true, barWidth: Math.max(9, size / 22), showBackground: true, backgroundStyle: { color: "#f2f6fc" },
              data: [...data].reverse().map((d) => ({ value: d.value ? Math.max(d.value, top * 0.035) : 0, itemStyle: { color: sweep(d.color), shadowColor: col(d.color, 0.4), shadowBlur: 10 } })),
              animationDelay: (i: number) => (data.length - i) * 120,
            },
          ],
        })}
      />
      {center && (
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-[clamp(1.2rem,2.2vw,1.7rem)] leading-none font-black text-ink tabular-nums">{center}</p>
          {sub && <p className="mt-1 text-[10.5px] font-bold text-subtle">{sub}</p>}
        </div>
      )}
    </div>
  );
}

const ringSeries = (v: number, color: string, width: number, start = 90, end = -270) => ({
  type: "gauge", startAngle: start, endAngle: end, min: 0, max: 100, radius: "100%", center: ["50%", "50%"], pointer: { show: false },
  progress: { show: true, roundCap: true, width, itemStyle: { color: sweep(color), shadowColor: col(color, 0.45), shadowBlur: 10 } },
  axisLine: { roundCap: true, lineStyle: { width, color: [[1, "#f2f6fc"]] } },
  splitLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false }, title: { show: false },
  data: [{ value: Math.max(0, Math.min(100, v)) }],
});

/** Small progress ring with the percentage inside. */
export function Ring({ value, color = palette.blue, size = 64, label }: { value: number; color?: string; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <EChart className="absolute inset-0" label={`${label ?? ""} ${Math.round(v)}%`} deps={{ v, color, size }} build={() => ({ series: [{ ...ringSeries(v, color, size / 9), detail: { show: false } }] })} />
      <span className="absolute inset-0 grid place-items-center text-[12px] font-black text-ink tabular-nums">{Math.round(v)}%</span>
    </div>
  );
}

/** 240° gauge with tick marks and a counting value. */
export function Gauge({ value, max = 100, label, color = palette.blue, display }: { value: number; max?: number; label: string; color?: string; display?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="flex flex-col items-center">
      <EChart
        className="aspect-[1.35] w-full max-w-44"
        label={`${label}: ${display ?? Math.round(pct) + "%"}`}
        deps={{ pct, color, display }}
        build={() => ({
          series: [
            {
              ...ringSeries(pct, color, 11, 215, -35),
              radius: "92%", center: ["50%", "58%"],
              axisTick: { show: true, distance: -24, splitNumber: 3, length: 3, lineStyle: { color: "#c9d5e6", width: 1.2 } },
              splitNumber: 6,
              detail: { valueAnimation: !display, offsetCenter: [0, "4%"], fontSize: 20, fontWeight: 900, color: "#0e1f4d", formatter: display ? () => display : "{value}%" },
              data: [{ value: Math.round(pct) }],
            },
          ],
        })}
      />
      <p className="-mt-3 text-center text-[11.5px] font-bold text-subtle">{label}</p>
    </div>
  );
}

/** Conversion funnel (e.g. placed → approved → packed → shipped → delivered). */
export function Funnel({ steps, height = 260 }: { steps: { label: string; value: number; color: string }[]; height?: number }) {
  const first = steps[0]?.value || 1;
  return (
    <EChart
      style={{ height }}
      label={steps.map((s) => `${s.label} ${s.value}`).join(", ")}
      deps={{ steps }}
      build={() => ({
        tooltip: tooltip("plain", "item", "none"),
        series: [
          {
            type: "funnel", sort: "none", left: "4%", right: "4%", top: 6, bottom: 6, minSize: "26%", maxSize: "100%", gap: 5,
            label: { position: "inside", color: "#fff", fontWeight: 800, fontSize: 12, formatter: (p: { name: string; value: number }) => `${p.name}  ${p.value} · ${Math.round((p.value / first) * 100)}%` },
            itemStyle: { borderWidth: 0 },
            emphasis: { label: { fontSize: 13 }, itemStyle: { shadowBlur: 20, shadowColor: "rgba(14,31,77,0.3)" } },
            data: steps.map((s, i) => ({ name: s.label, value: s.value, color: col(s.color), itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: col(s.color, 0.8) }, { offset: 1, color: col(s.color) }]) }, label: i === 0 && s.color === palette.yellow ? { color: "#1a49af" } : undefined })),
            animationDelay: (i: number) => i * 140,
          },
        ],
      })}
    />
  );
}

/** Calendar heatmap of a daily count (Saturday-first weeks). */
export function CalendarHeat({ days, from, to, unit = "orders", height = 170 }: { days: [string, number][]; from: string; to: string; unit?: string; height?: number }) {
  const top = Math.max(1, ...days.map((d) => d[1]));
  return (
    <EChart
      style={{ height }}
      label={`Daily ${unit} from ${from} to ${to}`}
      deps={{ days, from, to }}
      build={() => ({
        tooltip: { ...tooltip("plain", "item", "none"), formatter: (p: { value: [string, number] }) => `<b style="color:#ffd850">${esc(new Date(p.value[0]).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }))}</b><br/>${p.value[1]} ${esc(unit)}` },
        visualMap: { show: false, min: 0, max: top, inRange: { color: [col(palette.sky, 0.35), col(palette.sky), col(palette.blue), col(palette.navy)] } },
        calendar: {
          range: [from, to], top: 26, left: 30, right: 6, bottom: 6, cellSize: ["auto", "auto"], orient: "horizontal",
          splitLine: { show: false }, itemStyle: { color: "#f2f6fc", borderColor: "#fff", borderWidth: 3, borderRadius: 4 },
          dayLabel: { firstDay: 6, nameMap: ["S", "M", "T", "W", "T", "F", "S"], color: "#4a5679", fontSize: 10, fontWeight: 700 },
          monthLabel: { color: "#4a5679", fontSize: 11, fontWeight: 700 }, yearLabel: { show: false },
        },
        series: [{ type: "heatmap", coordinateSystem: "calendar", data: days, itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 3 }, emphasis: { itemStyle: { borderColor: col(palette.yellow), borderWidth: 2 } } }],
      })}
    />
  );
}

/** Labelled horizontal bars with a gradient fill and a soft glow. */
export function Bars({ items, format = "plain" }: { items: { label: string; value: number; max?: number; color?: string; note?: string }[]; format?: Fmt }) {
  const top = Math.max(1, ...items.map((i) => i.max ?? i.value));
  return (
    <ul className="w-full space-y-3.5">
      {items.map((it, i) => {
        const pct = (it.value / (it.max ?? top)) * 100;
        const c = it.color ?? seriesColors[i % seriesColors.length];
        return (
          <li key={it.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[12px]">
              <span className="flex min-w-0 items-center gap-2 font-bold text-ink"><span className="size-2 shrink-0 rounded-full" style={{ background: c }} /><span className="truncate">{it.label}</span></span>
              <span className="shrink-0 font-black text-ink tabular-nums">{it.note ?? formats[format](it.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-soft">
              <div className="chart-grow-x h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${c} 45%, white), ${c})`, boxShadow: `0 4px 12px -4px ${c}`, animationDelay: `${i * 0.07}s` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Tiny glowing trend with an end dot, for KPI cards. */
export function Sparkline({ values, color = palette.blue, className }: { values: number[]; color?: string; className?: string }) {
  const data = useMemo(() => values.map((v) => Math.max(0, v)), [values]);
  return (
    <EChart
      className={cn("h-12 w-full", className)}
      deps={{ data, color }}
      build={() => ({
        grid: { left: 3, right: 6, top: 6, bottom: 3 },
        xAxis: { type: "category", show: false, boundaryGap: false, data: data.map((_, i) => i) },
        yAxis: { type: "value", show: false, min: "dataMin" },
        series: [
          {
            type: "line", data: data.map((v, i) => (i === data.length - 1 ? { value: v, symbol: "circle", symbolSize: 7, itemStyle: { color: col(color), borderColor: "#fff", borderWidth: 2 } } : v)),
            smooth: 0.45, showSymbol: true, symbol: "none", silent: true, lineStyle: glowLine(color, 2.5), areaStyle: { color: fade(color, 0.3) },
          },
        ],
      })}
    />
  );
}
