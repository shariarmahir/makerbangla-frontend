"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Copy, Cpu, Info, Play, RotateCw, Search, ShoppingCart, Trash2, XCircle } from "lucide-react";
import { ARDUINO_IO, ENGINE, fmt, num, PIN_LEVELS, pinLevel, pinsOf, sampleAt, type Circuit, type DcResult, type Issue, type Part, type PartKind, type Prop, type TransientResult, type Wire } from "@/lib/lab/engine";
import { withinTol, type Experiment, type ObsRow } from "@/lib/lab/experiments";
import { CATEGORIES, MODELS, type Field } from "@/lib/lab/models";
import type { BomRow, CartPick } from "@/lib/lab/bom";
import { bdt, cn } from "@/lib/utils";
import { CircuitPreview, WIRE_COLORS } from "./circuit-art";

export type LabProduct = { slug: string; name: string; price: number; image: string; stock: number };

export const tb = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition-colors disabled:pointer-events-none disabled:opacity-40";
export const tbGhost = cn(tb, "text-white/80 hover:bg-white/10 hover:text-white");
const btn = "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12px] font-bold transition-colors disabled:pointer-events-none disabled:opacity-40";
const btnSoft = cn(btn, "bg-soft text-ink ring-1 ring-line hover:bg-tile-sky/50");
const btnPrimary = cn(btn, "bg-tile-navy text-tile-yellow hover:bg-brand-strong");
const input = "h-8 w-full rounded-lg bg-white px-2.5 text-[12.5px] font-semibold text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

const matchText = { exact: "Exact match", kit: "In a kit", compatible: "Compatible" } as const;
const matchTone = { exact: "bg-tile-sky text-tile-navy", kit: "bg-tile-butter text-tile-navy", compatible: "bg-soft text-ink ring-1 ring-line" } as const;

// ——— Library ———

export function Library({ onAdd }: { onAdd: (k: PartKind) => void }) {
  const [q, setQ] = useState("");
  const kinds = (Object.keys(MODELS) as PartKind[]).filter((k) => `${MODELS[k].name} ${MODELS[k].category} ${MODELS[k].blurb}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <aside aria-label="Component library" className="flex w-60 shrink-0 flex-col border-r border-line bg-white">
      <div className="border-b border-line p-3">
        <label className="relative block">
          <span className="sr-only">Search components</span>
          <Search aria-hidden className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parts" className={cn(input, "pl-8")} />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
        {CATEGORIES.map((cat) => {
          const items = kinds.filter((k) => MODELS[k].category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} className="mb-4">
              <h3 className="mb-2 text-[10.5px] font-black tracking-[0.12em] text-subtle uppercase">{cat}</h3>
              <ul className="grid grid-cols-2 gap-2">
                {items.map((k) => (
                  <li key={k}>
                    <button
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/x-mb-part", k);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onAdd(k)}
                      title={`${MODELS[k].name} — drag onto the bench or click to add`}
                      className="group flex w-full flex-col items-center gap-1 rounded-xl bg-soft p-2 text-center ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_24px_-16px_rgb(14_31_77/0.6)] hover:ring-brand"
                    >
                      <CircuitPreview c={{ parts: [{ id: "x", kind: k, label: "", x: 0, y: 0, rot: 0, props: {} }], wires: [] }} title="" className="pointer-events-none h-12 w-full" />
                      <span className="text-[10.5px] leading-tight font-bold text-ink">{MODELS[k].name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!kinds.length && <p className="text-[12px] text-subtle">No parts match “{q}”.</p>}
      </div>
    </aside>
  );
}

// ——— Inspector ———

function FieldInput({ f, value, onChange }: { f: Field; value: Prop | undefined; onChange: (v: Prop) => void }) {
  if (f.type === "toggle") {
    const on = value !== false;
    return (
      <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-brand" : "bg-line")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left]", on ? "left-[22px]" : "left-0.5")} />
      </button>
    );
  }
  if (f.type === "select") return <select value={String(value ?? "")} onChange={(e) => onChange(Number.isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))} className={input}>{f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  if (f.type === "slider") return (
    <span className="flex items-center gap-2">
      <input type="range" min={0} max={100} step={f.step ?? 1} value={Number(value ?? 50)} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-brand)]" />
      <span className="w-10 text-right text-[12px] font-bold text-ink tabular-nums">{Number(value ?? 50)}%</span>
    </span>
  );
  return (
    <span className="block space-y-1.5">
      <span className="flex items-center gap-1.5">
        <input type="number" inputMode="decimal" step={f.step ?? "any"} value={String(value ?? "")} onChange={(e) => e.target.value !== "" && Number.isFinite(Number(e.target.value)) && onChange(Number(e.target.value))} className={input} />
        {f.unit && <span className="text-[12px] font-bold text-subtle">{f.unit}</span>}
      </span>
      {f.presets && (
        <span className="flex flex-wrap gap-1">
          {f.presets.map((v) => (
            <button key={v} onClick={() => onChange(v)} className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ring-1", Number(value) === v ? "bg-tile-navy text-tile-yellow ring-tile-navy" : "bg-white text-subtle ring-line hover:text-ink")}>
              {f.unit === "Ω" ? fmt(v, "Ω") : f.unit === "µF" ? `${v} µF` : `${v} ${f.unit ?? ""}`}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

function ProductCard({ product, link, onAdd }: { product: LabProduct; link: { match: keyof typeof matchText; note: string }; onAdd: () => void }) {
  return (
    <div className="rounded-xl bg-soft p-3 ring-1 ring-line">
      <div className="flex items-center gap-3">
        <Image src={product.image} alt="" width={56} height={56} className="size-14 shrink-0 object-contain" />
        <span className="min-w-0">
          <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-black", matchTone[link.match])}>{matchText[link.match]}</span>
          <Link href={`/products/${product.slug}`} target="_blank" className="mt-1 line-clamp-2 block text-[12px] leading-snug font-bold text-ink hover:text-brand-strong">{product.name}</Link>
          <span className="text-[12px] font-black text-brand-strong tabular-nums">{bdt(product.price)}</span>
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-subtle">{link.note}</p>
      <button onClick={onAdd} disabled={product.stock <= 0} className={cn(btnPrimary, "mt-2 w-full")}><ShoppingCart className="size-3.5" /> {product.stock > 0 ? "Add to cart" : "Out of stock"}</button>
    </div>
  );
}

export function Inspector({ c, sel, result, products, onProp, onRotate, onDuplicate, onDelete, onWireColor, onAddProduct, overview }: {
  c: Circuit;
  sel: { kind: "part" | "wire"; id: string } | null;
  result: DcResult | null;
  products: Record<string, LabProduct>;
  onProp: (id: string, key: string, v: Prop) => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onWireColor: (id: string, color: string) => void;
  onAddProduct: (slug: string, qty: number) => void;
  overview: React.ReactNode;
}) {
  const part = sel?.kind === "part" ? c.parts.find((p) => p.id === sel.id) : undefined;
  const wire = sel?.kind === "wire" ? c.wires.find((w) => w.id === sel.id) : undefined;
  return (
    <aside aria-label="Inspector" className="flex w-72 shrink-0 flex-col border-l border-line bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {part ? <PartInspector p={part} c={c} result={result} products={products} onProp={onProp} onRotate={onRotate} onDuplicate={onDuplicate} onDelete={onDelete} onAddProduct={onAddProduct} /> : wire ? <WireInspector w={wire} c={c} onColor={onWireColor} onDelete={onDelete} /> : overview}
      </div>
    </aside>
  );
}

function PartInspector({ p, c, result, products, onProp, onRotate, onDuplicate, onDelete, onAddProduct }: { p: Part; c: Circuit; result: DcResult | null; products: Record<string, LabProduct>; onProp: (id: string, key: string, v: Prop) => void; onRotate: () => void; onDuplicate: () => void; onDelete: () => void; onAddProduct: (slug: string, qty: number) => void }) {
  const m = MODELS[p.kind];
  const r = result?.parts[p.id];
  const link = m.product(p);
  const product = link && products[link.slug];
  const wired = useMemo(() => new Set(c.wires.flatMap((w) => [w.a, w.b]).filter((x) => x.part === p.id).map((x) => x.pin)), [c.wires, p.id]);
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[11px] font-bold text-subtle">{m.category}</p>
        <h2 className="text-[17px] leading-tight font-black text-ink">{p.label} <span className="font-bold text-subtle">· {m.name}</span></h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-subtle">{m.blurb}</p>
        <div className="mt-3 flex gap-1.5">
          {m.rotatable && <button onClick={onRotate} className={btnSoft} title="Rotate (R)"><RotateCw className="size-3.5" /> Rotate</button>}
          <button onClick={onDuplicate} className={btnSoft} title="Duplicate (Ctrl+D)"><Copy className="size-3.5" /> Copy</button>
          <button onClick={onDelete} className={cn(btnSoft, "ml-auto text-sale")} title="Delete (Del)" aria-label="Delete part"><Trash2 className="size-3.5" /></button>
        </div>
      </header>

      {m.fields.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-[11px] font-black tracking-wider text-subtle uppercase">Properties</h3>
          {m.fields.map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="text-[12px] font-bold text-ink">{f.label}</span>
              <FieldInput f={f} value={f.type === "number" ? num(p, f.key) : (p.props[f.key] ?? (f.type === "slider" ? num(p, f.key) : undefined))} onChange={(v) => onProp(p.id, f.key, v)} />
            </label>
          ))}
        </section>
      )}

      {p.kind === "arduino" && (
        <section className="space-y-2">
          <h3 className="text-[11px] font-black tracking-wider text-subtle uppercase">Static pin levels</h3>
          <p className="rounded-lg bg-tile-butter/60 p-2.5 text-[11.5px] leading-snug text-tile-navy"><Cpu className="mr-1 inline size-3.5" /> Sketch simulation needs a licensed microcontroller engine and isn’t available yet. You can hold pins HIGH (5 V) or LOW (0 V) to test what they drive.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {ARDUINO_IO.map((io) => (
              <label key={io} className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                <span className="w-7">{io}</span>
                <select value={pinLevel(p, io)} onChange={(e) => onProp(p.id, io, e.target.value)} className={cn(input, "h-7 px-1.5 text-[11px]")}>
                  {PIN_LEVELS.map((l) => <option key={l} value={l}>{l === "Z" ? "Not driven" : l}</option>)}
                </select>
              </label>
            ))}
          </div>
        </section>
      )}

      {r && p.kind !== "breadboard" && p.kind !== "ground" && (
        <section>
          <h3 className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">Live values</h3>
          <dl className="grid grid-cols-3 gap-1.5 text-center">
            {(p.kind === "scope"
              ? [["CH1", fmt(r.pins?.CH1 ?? 0, "V")], ["CH2", fmt(r.pins?.CH2 ?? 0, "V")]]
              : p.kind === "npn"
                ? [["Ic", fmt(r.i, "A")], ["Ib", fmt(r.pins?.Ib ?? 0, "A")], ["Vce", fmt(r.v, "V")]]
                : r.reading !== undefined
                  ? [["Reading", fmt(r.reading, r.unit!)]]
                  : [["Voltage", fmt(r.v, "V")], ["Current", fmt(r.i, "A")], ["Power", fmt(r.p, "W")]]
            ).map(([k, v], _i, all) => (
              <div key={k} className={cn("rounded-lg bg-tile-sky/40 px-1.5 py-2", all.length === 1 && "col-span-3", all.length === 2 && "first:col-span-2 last:col-span-1")}>
                <dt className="text-[10px] font-bold text-subtle">{k}</dt>
                <dd className="text-[12.5px] font-black text-tile-navy tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
          {p.kind === "led" && <p className="mt-2 text-[11.5px] font-bold text-subtle">{r.on ? `Lit — ${Math.round((r.glow ?? 0) * 100)} % of rated brightness` : "Off — not forward biased"}</p>}
          {p.kind === "diode" && <p className="mt-2 text-[11.5px] font-bold text-subtle">{r.on ? "Conducting (forward biased)" : "Blocking"}</p>}
          {p.kind === "npn" && <p className="mt-2 text-[11.5px] font-bold text-subtle">Region: {r.mode} · Vbe {fmt(r.pins?.Vbe ?? 0, "V")}</p>}
          {p.kind === "supply" && <p className="mt-2 text-[11.5px] font-bold text-subtle">{r.mode === "CC" ? "Constant current — the limit is active" : "Constant voltage"}</p>}
          {p.kind === "ldr" && <p className="mt-2 text-[11.5px] font-bold text-subtle">Resistance at this light level: {r.mode}</p>}
          {p.kind === "scope" && <p className="mt-2 text-[11.5px] font-bold text-subtle">DC values — run a transient to see traces.</p>}
        </section>
      )}

      {p.kind !== "breadboard" && (
        <section>
          <h3 className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">Pins</h3>
          <ul className="divide-y divide-line rounded-lg ring-1 ring-line">
            {pinsOf(p.kind).filter((pin) => p.kind !== "arduino" || wired.has(pin.id) || ["5V", "3V3", "GND1"].includes(pin.id) || pinLevel(p, pin.id) !== "Z").map((pin) => {
              const v = result?.pinV[`${p.id}:${pin.id}`];
              return (
                <li key={pin.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-[11.5px]">
                  <span className="font-bold text-ink">{m.pinNames[pin.id] ?? pin.id}</span>
                  <span className="font-semibold text-subtle tabular-nums">{v === undefined ? (result ? "floating" : "—") : fmt(v, "V")}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(m.ratings.length > 0 || m.model) && (
        <section className="space-y-1.5 text-[11.5px] leading-snug text-subtle">
          <h3 className="text-[11px] font-black tracking-wider text-subtle uppercase">Model &amp; ratings</h3>
          <p>{m.model}</p>
          {m.ratings.map((x) => <p key={x}>• {x}</p>)}
        </section>
      )}

      {link && product ? (
        <section>
          <h3 className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">In the store</h3>
          <ProductCard product={product} link={link} onAdd={() => onAddProduct(product.slug, 1)} />
        </section>
      ) : p.kind !== "ground" && (
        <p className="rounded-lg bg-soft p-2.5 text-[11.5px] text-subtle ring-1 ring-line">Not sold in the store yet — no substitute is suggested.</p>
      )}
    </div>
  );
}

function WireInspector({ w, c, onColor, onDelete }: { w: Wire; c: Circuit; onColor: (id: string, color: string) => void; onDelete: () => void }) {
  const end = (r: { part: string; pin: string }) => {
    const p = c.parts.find((x) => x.id === r.part);
    return p ? `${p.label} · ${MODELS[p.kind].pinNames[r.pin] ?? r.pin}` : r.pin;
  };
  return (
    <div className="space-y-4">
      <h2 className="text-[17px] font-black text-ink">Jumper wire</h2>
      <p className="text-[12px] leading-relaxed text-subtle">{end(w.a)} → {end(w.b)}</p>
      <div>
        <p className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">Colour</p>
        <div className="flex gap-2">
          {Object.keys(WIRE_COLORS).map((k) => (
            <button key={k} onClick={() => onColor(w.id, k)} aria-label={`${k} wire`} aria-pressed={(w.color ?? "blue") === k} className={cn("grid size-8 place-items-center rounded-full ring-2", (w.color ?? "blue") === k ? "ring-ink" : "ring-transparent")}>
              <svg viewBox="0 0 20 20" className="size-6"><circle cx={10} cy={10} r={9} className={cn("fill-none", WIRE_COLORS[k])} strokeWidth={6} /></svg>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-subtle">Convention: coral for +, ink for − / ground.</p>
      </div>
      <button onClick={onDelete} className={cn(btnSoft, "text-sale")}><Trash2 className="size-3.5" /> Delete wire</button>
    </div>
  );
}

// ——— Bottom panel ———

export type Tab = "validation" | "measurements" | "waveforms" | "log" | "parts" | "experiment" | "code";

export function IssueList({ issues, onSelect }: { issues: Issue[]; onSelect: (id: string) => void }) {
  if (!issues.length) return <p className="flex items-center gap-2 text-[12.5px] font-bold text-brand-strong"><CheckCircle2 className="size-4" /> Validation passed — no problems found.</p>;
  return (
    <ul className="space-y-1.5">
      {issues.map((i, n) => (
        <li key={n}>
          <button onClick={() => i.parts[0] && onSelect(i.parts[0])} className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] leading-snug hover:bg-soft">
            {i.level === "error" ? <XCircle className="mt-0.5 size-4 shrink-0 text-sale" /> : i.level === "warning" ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-tile-navy" /> : <Info className="mt-0.5 size-4 shrink-0 text-brand" />}
            <span className="text-ink">{i.message}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function Measurements({ c, result }: { c: Circuit; result: DcResult | null }) {
  if (!result || !Object.keys(result.parts).length) return <p className="text-[12.5px] text-subtle">Run the circuit to see voltages, currents and power for every part.</p>;
  const meters = c.parts.filter((p) => result.parts[p.id]?.reading !== undefined);
  const rows = c.parts.filter((p) => !["breadboard", "ground", "ammeter", "voltmeter"].includes(p.kind) && result.parts[p.id]);
  return (
    <div className="space-y-3">
      {meters.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {meters.map((p) => (
            <li key={p.id} className={cn("rounded-xl px-3 py-2", p.kind === "ammeter" ? "bg-tile-yellow" : "bg-tile-blue text-white")}>
              <span className="block text-[10.5px] font-bold opacity-75">{p.label}</span>
              <span className="text-[16px] font-black tabular-nums">{fmt(result.parts[p.id].reading!, result.parts[p.id].unit!, 4)}</span>
            </li>
          ))}
        </ul>
      )}
      <table className="w-full text-left text-[12px]">
        <thead className="text-[10.5px] tracking-wider text-subtle uppercase"><tr><th className="py-1 font-black">Part</th><th className="font-black">Voltage</th><th className="font-black">Current</th><th className="font-black">Power</th></tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((p) => {
            const r = result.parts[p.id];
            return (
              <tr key={p.id}>
                <td className="py-1.5 font-bold text-ink">{p.label} <span className="font-semibold text-subtle">{MODELS[p.kind].name}</span></td>
                <td className="tabular-nums">{fmt(r.v, "V")}</td>
                <td className="tabular-nums">{fmt(r.i, "A")}</td>
                <td className="tabular-nums">{fmt(r.p, "W")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function WaveChart({ tr }: { tr: TransientResult }) {
  const W = 640, H = 170, L = 48, B = 22;
  if (!tr.traces.length) return <p className="text-[12.5px] text-subtle">Add a voltmeter, ammeter or capacitor to record a waveform.</p>;
  const T = tr.times[tr.times.length - 1];
  const tones = ["stroke-brand", "stroke-tile-coral", "stroke-tile-navy", "stroke-tile-yellow"];
  const fills = ["bg-brand", "bg-tile-coral", "bg-tile-navy", "bg-tile-yellow"];
  return (
    <div className="flex flex-wrap gap-4">
      {(["V", "A"] as const).map((unit) => {
        const traces = tr.traces.filter((t) => t.unit === unit);
        if (!traces.length) return null;
        const all = traces.flatMap((t) => t.values);
        const lo = Math.min(0, ...all), hi = Math.max(...all, lo + 1e-12);
        const sx = (t: number) => L + (t / T) * (W - L - 8), sy = (v: number) => 8 + (1 - (v - lo) / (hi - lo)) * (H - B - 8);
        return (
          <figure key={unit} className="min-w-[320px] flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${unit === "V" ? "Voltage" : "Current"} against time`}>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line x1={L} x2={W - 8} y1={sy(lo + f * (hi - lo))} y2={sy(lo + f * (hi - lo))} className="stroke-line" strokeDasharray="3 4" />
                  <text x={L - 6} y={sy(lo + f * (hi - lo)) + 3} textAnchor="end" className="fill-subtle text-[9px] font-bold">{fmt(lo + f * (hi - lo), unit, 3)}</text>
                  <text x={sx(f * T)} y={H - 6} textAnchor="middle" className="fill-subtle text-[9px] font-bold">{fmt(f * T, "s", 3)}</text>
                </g>
              ))}
              {traces.map((t, i) => (
                <polyline key={t.id} fill="none" className={tones[i % tones.length]} strokeWidth={2.2} strokeLinejoin="round" points={t.values.map((v, k) => `${sx(tr.times[k]).toFixed(1)},${sy(v).toFixed(1)}`).join(" ")} />
              ))}
            </svg>
            <figcaption className="flex flex-wrap gap-3 pl-12 text-[11px] font-bold text-ink">
              {traces.map((t, i) => <span key={t.id} className="flex items-center gap-1.5"><span className={cn("h-1 w-4 rounded-full", fills[i % fills.length])} />{t.label} · end {fmt(t.values[t.values.length - 1], unit, 4)}</span>)}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function PartsList({ rows, picks, products, onAdd }: { rows: BomRow[]; picks: CartPick[]; products: Record<string, LabProduct>; onAdd: (items: { slug: string; qty: number }[]) => void }) {
  const [off, setOff] = useState<Set<string>>(new Set());
  if (!rows.length) return <p className="text-[12.5px] text-subtle">Add parts to the bench to build a parts list.</p>;
  const chosen = picks.filter((p) => !off.has(p.slug) && products[p.slug]?.stock > 0);
  const total = chosen.reduce((n, p) => n + products[p.slug].price * p.qty, 0);
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
      <table className="w-full self-start text-left text-[12px]">
        <thead className="text-[10.5px] tracking-wider text-subtle uppercase"><tr><th className="py-1 font-black">Qty</th><th className="font-black">Part</th><th className="font-black">Store match</th></tr></thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r.key}>
              <td className="py-1.5 font-black text-ink tabular-nums">{r.qty}×</td>
              <td className="font-bold text-ink">{r.label} {r.parts.length > 0 && <span className="font-semibold text-subtle">({r.parts.join(", ")})</span>}</td>
              <td>{r.product ? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-black", matchTone[r.product.match])}>{matchText[r.product.match]}</span> : <span className="text-[11px] font-bold text-subtle">No match in store</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rounded-xl bg-soft p-3 ring-1 ring-line">
        <ul className="space-y-2">
          {picks.map((p) => {
            const pr = products[p.slug];
            if (!pr) return null;
            const out = pr.stock <= 0;
            return (
              <li key={p.slug} className="flex items-start gap-2.5">
                <input type="checkbox" aria-label={`Include ${pr.name}`} disabled={out} checked={!out && !off.has(p.slug)} onChange={() => setOff((s) => { const n = new Set(s); if (n.has(p.slug)) n.delete(p.slug); else n.add(p.slug); return n; })} className="mt-1 size-4 accent-[var(--color-brand)]" />
                <Image src={pr.image} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] leading-snug font-bold text-ink">{p.qty} × {pr.name}</span>
                  <span className="block text-[11px] leading-snug text-subtle">{out ? "Out of stock" : `${matchText[p.match]} — ${p.note}`}</span>
                </span>
                <span className="text-[12px] font-black text-brand-strong tabular-nums">{bdt(pr.price * p.qty)}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
          <span className="text-[12px] font-bold text-subtle">Prices and stock are checked again at checkout.</span>
          <button onClick={() => onAdd(chosen.map((p) => ({ slug: p.slug, qty: p.qty })))} disabled={!chosen.length} className={btnPrimary}><ShoppingCart className="size-3.5" /> Add {bdt(total)} to cart</button>
        </div>
      </div>
    </div>
  );
}

export function ExperimentPanel({ e, rows, observations, onRecord, onApply, live, onRun, student, conclusion, onNotes, onReport, message }: {
  e: Experiment;
  rows: ObsRow[];
  observations: Record<string, Record<string, number>>;
  onRecord: (row: ObsRow) => void;
  onApply: (row: ObsRow) => void;
  live: boolean;
  onRun: () => void;
  student: string;
  conclusion: string;
  onNotes: (patch: { student?: string; conclusion?: string }) => void;
  onReport: () => void;
  message: string;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-[13px] font-black text-ink">Observation table</h3>
          {!live && e.analysis === "dc" && <button onClick={onRun} className={btnSoft}><Play className="size-3.5" /> Run to take readings</button>}
          {message && <span role="status" className="text-[12px] font-bold text-tile-navy">{message}</span>}
        </div>
        <table className="w-full text-left text-[12px]">
          <thead className="text-[10.5px] tracking-wider text-subtle uppercase"><tr><th className="py-1 font-black">Condition</th><th className="font-black">Quantity</th><th className="font-black">Measured</th><th className="font-black">Expected</th><th /></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => row.readings.map((rd, i) => {
              const got = observations[row.id]?.[rd.part];
              const ok = got !== undefined && withinTol(rd, got);
              return (
                <tr key={`${row.id}-${rd.part}`}>
                  {i === 0 && <td rowSpan={row.readings.length} className="py-1.5 pr-2 align-top font-bold text-ink">{row.label}{row.set && <button onClick={() => onApply(row)} className="mt-0.5 block text-[11px] font-bold text-brand-strong hover:underline">{row.set.text}</button>}</td>}
                  <td className="py-1.5 text-ink">{rd.label}{rd.at !== undefined && <span className="text-subtle"> at {fmt(rd.at, "s")}</span>}</td>
                  <td className="font-black tabular-nums">{got === undefined ? <span className="font-semibold text-subtle">—</span> : <span className={ok ? "text-brand-strong" : "text-sale"}>{fmt(got, rd.unit, 4)} {ok ? "✓" : "✗"}</span>}</td>
                  <td className="text-subtle tabular-nums">{fmt(rd.expected, rd.unit, 4)} ±{Math.round(rd.tol * 100)}%</td>
                  {i === 0 && <td rowSpan={row.readings.length} className="align-top"><button onClick={() => onRecord(row)} className={btnSoft}>Record</button></td>}
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-[13px] font-black text-ink">Report</h3>
        <input value={student} onChange={(ev) => onNotes({ student: ev.target.value.slice(0, 80) })} placeholder="Your name and ID" aria-label="Student name and ID" className={input} />
        <textarea value={conclusion} onChange={(ev) => onNotes({ conclusion: ev.target.value.slice(0, 2000) })} rows={3} placeholder="Conclusion — what did the readings show?" aria-label="Conclusion" className={cn(input, "h-auto py-2")} />
        <button onClick={onReport} className={btnPrimary}>Download lab report (PDF)</button>
      </div>
    </div>
  );
}

export function CodePanel() {
  return (
    <div className="max-w-3xl space-y-2 text-[12.5px] leading-relaxed text-ink">
      <p className="flex items-center gap-2 font-black"><Cpu className="size-4 text-brand" /> Microcontroller simulation is not available yet</p>
      <p className="text-subtle">Running Arduino or ESP32 sketches needs a licensed microcontroller simulator. Until that agreement is in place Lab Kitchen won’t pretend to run code. What works today: the Uno’s 5 V and 3.3 V pins power your circuit, and each I/O pin can be held HIGH or LOW from the inspector to check what it drives (LED current, pin limits).</p>
      <p className="text-subtle">Engine in use: {ENGINE.name} {ENGINE.version} — {ENGINE.method}.</p>
    </div>
  );
}

export { sampleAt };
