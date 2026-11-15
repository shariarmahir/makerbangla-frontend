"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { palette, seriesColors } from "./palette";

/**
 * Hand-built SVG/CSS charts in the brand palette (no chart library). Each one draws or grows in on mount
 * (`chart-*` classes in globals.css, off for reduced motion) and the line/bar charts show a tooltip on hover.
 */


type Series = { name: string; color: string; values: number[] };
/** Number formats by name (functions can't be passed from server to client components). */
const formats = {
  plain: (n: number) => new Intl.NumberFormat("en-IN", { notation: n >= 100_000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(n),
  compact: (n: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n),
};
type Fmt = keyof typeof formats;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / p / (v / p > 5 ? 2 : 1)) * p * (v / p > 5 ? 2 : 1);
}

export function Legend({ items, className }: { items: { name: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] font-semibold text-subtle", className)}>
      {items.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

/** Multi-series line chart with soft area fill, grid, and a hover guide + tooltip. */
export function LineChart({ labels, series, height = 240, format: fmt = "plain", area = true }: { labels: string[]; series: Series[]; height?: number; format?: Fmt; area?: boolean }) {
  const format = formats[fmt];
  const id = useId();
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 220, n = labels.length;
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  const x = (i: number) => (n < 2 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => H - (v / max) * H;
  const path = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  return (
    <div className="flex gap-2" style={{ height }}>
      <div className="flex flex-col justify-between pb-6 text-right text-[10.5px] font-semibold text-subtle tabular-nums">
        {[1, 0.75, 0.5, 0.25, 0].map((f) => <span key={f}>{format(max * f)}</span>)}
      </div>
      <div className="relative min-w-0 flex-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-1.5 h-[calc(100%-1.5rem-0.375rem)] w-full overflow-visible"
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
          }}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={series.map((s) => `${s.name}: ${s.values.map(format).join(", ")}`).join(". ")}
        >
          <defs>
            {series.map((s, k) => (
              <linearGradient key={k} id={`${id}-g${k}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--color-line)" strokeDasharray="4 6" vectorEffect="non-scaling-stroke" />
          ))}
          {area && series.map((s, k) => <path key={k} className="chart-fade" d={`${path(s.values)} L${x(n - 1)},${H} L${x(0)},${H} Z`} fill={`url(#${id}-g${k})`} />)}
          {series.map((s, k) => (
            <path key={k} className="chart-draw" pathLength={1} d={path(s.values)} fill="none" stroke={s.color} strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ animationDelay: `${k * 0.15}s` }} />
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--color-tile-navy)" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />}
        </svg>
        {hover !== null &&
          series.map((s, k) => (
            <span key={k} className="pointer-events-none absolute size-3 -translate-1/2 rounded-full border-2 border-white shadow" style={{ background: s.color, left: `${(x(hover) / W) * 100}%`, top: `calc(0.375rem + ${(y(s.values[hover]) / H)} * (100% - 1.875rem))` }} />
          ))}
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 min-w-32 -translate-x-1/2 rounded-xl bg-tile-midnight px-3 py-2 text-[11.5px] text-white shadow-xl"
            style={{ left: `clamp(4rem, ${(x(hover) / W) * 100}%, calc(100% - 4rem))` }}
          >
            <p className="mb-1 font-bold text-tile-yellow">{labels[hover]}</p>
            {series.map((s) => (
              <p key={s.name} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: s.color }} />{s.name}</span>
                <b className="tabular-nums">{format(s.values[hover])}</b>
              </p>
            ))}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10.5px] font-semibold text-subtle">
          {labels.map((l, i) => <span key={i} className={cn(n > 8 && i % 2 && "invisible sm:visible", n > 14 && i % 3 && "sm:invisible")}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

/** Grouped or stacked bar chart; bars grow up in sequence. */
export function BarChart({ labels, series, height = 240, format: fmt = "plain", stacked = false }: { labels: string[]; series: Series[]; height?: number; format?: Fmt; stacked?: boolean }) {
  const format = formats[fmt];
  const [hover, setHover] = useState<number | null>(null);
  const totals = labels.map((_, i) => series.reduce((n, s) => n + s.values[i], 0));
  const max = niceMax(Math.max(1, ...(stacked ? totals : series.flatMap((s) => s.values))));
  return (
    <div className="flex gap-2" style={{ height }}>
      <div className="flex flex-col justify-between pb-6 text-right text-[10.5px] font-semibold text-subtle tabular-nums">
        {[1, 0.75, 0.5, 0.25, 0].map((f) => <span key={f}>{format(max * f)}</span>)}
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-1.5 bottom-6 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className="border-t border-dashed border-line" />)}
        </div>
        <div className="relative flex flex-1 items-end gap-[3%] pt-1.5">
          {labels.map((l, i) => (
            <div key={i} className="relative flex h-full flex-1 items-end justify-center gap-[8%]" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              {stacked ? (
                <div className="chart-grow-y flex h-full w-full max-w-9 flex-col-reverse" style={{ animationDelay: `${i * 0.04}s` }}>
                  {series.map((s, k) => (
                    <span key={k} className={cn("w-full first:rounded-b-md last:rounded-t-md", hover === i && "brightness-110")} style={{ height: `${(s.values[i] / max) * 100}%`, background: s.color }} />
                  ))}
                </div>
              ) : (
                series.map((s, k) => (
                  <span key={k} className={cn("chart-grow-y w-full max-w-7 rounded-t-md transition-[filter]", hover === i && "brightness-110")} style={{ height: `${(s.values[i] / max) * 100}%`, background: s.color, animationDelay: `${i * 0.04 + k * 0.08}s` }} />
                ))
              )}
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-1 min-w-28 rounded-xl bg-tile-midnight px-3 py-2 text-[11.5px] whitespace-nowrap text-white shadow-xl">
                  <p className="mb-1 font-bold text-tile-yellow">{l}</p>
                  {series.map((s) => (
                    <p key={s.name} className="flex justify-between gap-3"><span>{s.name}</span><b className="tabular-nums">{format(s.values[i])}</b></p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex h-6 items-end gap-[3%] text-[10.5px] font-semibold text-subtle">
          {labels.map((l, i) => <span key={i} className={cn("flex-1 truncate text-center", labels.length > 8 && i % 2 && "invisible sm:visible")}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

/** Donut with centre label; each slice sweeps in. */
export function Donut({ data, size = 180, thickness = 18, center, sub }: { data: { label: string; value: number; color: string }[]; size?: number; thickness?: number; center?: string; sub?: string }) {
  const total = data.reduce((n, d) => n + d.value, 0) || 1;
  const r = 50 - thickness / 2 / (size / 100);
  const pcts = data.map((d) => (d.value / total) * 100);
  const starts = pcts.map((_, i) => pcts.slice(0, i).reduce((a, b) => a + b, 0));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={data.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(", ")}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-soft)" strokeWidth={thickness / (size / 100)} />
        {data.map((d, i) => {
          const pct = pcts[i];
          return (
            <circle
              key={i}
              className="chart-arc"
              cx="50" cy="50" r={r} fill="none" pathLength={100}
              stroke={d.color} strokeWidth={thickness / (size / 100)}
              strokeDasharray={`${Math.max(0, pct - 0.6)} ${100 - Math.max(0, pct - 0.6)}`}
              strokeDashoffset={-starts[i]}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          );
        })}
      </svg>
      {center && (
        <div className="absolute inset-0 grid place-content-center text-center">
          <p className="text-[clamp(1.1rem,2vw,1.5rem)] leading-none font-black text-ink tabular-nums">{center}</p>
          {sub && <p className="mt-1 text-[11px] font-semibold text-subtle">{sub}</p>}
        </div>
      )}
    </div>
  );
}

/** Small ring with a percentage, as in KPI tiles. */
export function Ring({ value, color = palette.blue, size = 64, label }: { value: number; color?: string; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? ""} ${Math.round(v)}%`}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--color-soft)" strokeWidth="4" />
        <circle className="chart-arc" cx="18" cy="18" r="15.5" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${v} ${100 - v}`} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[12px] font-black text-ink tabular-nums">{Math.round(v)}%</span>
    </div>
  );
}

/** Half-circle gauge with a value in the middle. */
export function Gauge({ value, max = 100, label, color = palette.blue, display }: { value: number; max?: number; label: string; color?: string; display?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className="flex flex-col items-center">
      <div className="relative aspect-2/1 w-full max-w-36">
        <svg viewBox="0 0 100 52" className="size-full overflow-visible" role="img" aria-label={`${label}: ${display ?? Math.round(pct) + "%"}`}>
          <path d="M8,50 A42,42 0 0 1 92,50" fill="none" stroke="var(--color-soft)" strokeWidth="11" strokeLinecap="round" />
          <path className="chart-arc" d="M8,50 A42,42 0 0 1 92,50" fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" pathLength={100} strokeDasharray={`${pct} 100`} />
        </svg>
        <p className="absolute inset-x-0 bottom-0 text-center text-[clamp(1.05rem,1.8vw,1.35rem)] leading-none font-black text-ink tabular-nums">{display ?? `${Math.round(pct)}%`}</p>
      </div>
      <p className="mt-2 text-center text-[11.5px] font-bold text-subtle">{label}</p>
    </div>
  );
}

/** Labelled horizontal progress bars (e.g. "Text 90%"). */
export function Bars({ items, format: fmt = "plain" }: { items: { label: string; value: number; max?: number; color?: string; note?: string }[]; format?: Fmt }) {
  const format = formats[fmt];
  const top = Math.max(1, ...items.map((i) => i.max ?? i.value));
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const pct = (it.value / (it.max ?? top)) * 100;
        return (
          <li key={it.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[12px]">
              <span className="truncate font-bold text-ink">{it.label}</span>
              <span className="shrink-0 font-semibold text-subtle tabular-nums">{it.note ?? format(it.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-soft">
              <div className="chart-grow-x h-full rounded-full" style={{ width: `${Math.max(2, pct)}%`, background: it.color ?? seriesColors[i % seriesColors.length], animationDelay: `${i * 0.08}s` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Tiny trend line for stat cards. */
export function Sparkline({ values, color = palette.blue, className }: { values: number[]; color?: string; className?: string }) {
  const id = useId();
  const max = Math.max(1, ...values), min = Math.min(...values, 0);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 26}`);
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-10 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="chart-fade" d={`M${pts.join(" L")} L100,32 L0,32 Z`} fill={`url(#${id})`} />
      <path className="chart-draw" pathLength={1} d={`M${pts.join(" L")}`} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
