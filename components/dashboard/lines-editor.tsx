"use client";

import { X } from "lucide-react";
import { Icon } from "./icon";
import { bdt, cn } from "@/lib/utils";
import { Btn, input } from "./kit";

export type PickProduct = { slug: string; name: string; sku: string; price: number; stock?: number };
export type Line = { key: number; slug: string; name: string; sku: string; qty: number; price: number };

/** Item lines for orders, invoices and quotations: pick catalog products (with stock), or add custom lines. */
export function LinesEditor({ lines, setLines, products, free }: { lines: Line[]; setLines: (l: Line[]) => void; products: PickProduct[]; free?: boolean }) {
  const add = (slug: string) => {
    const p = products.find((x) => x.slug === slug);
    if (!p) return;
    const existing = lines.findIndex((l) => l.slug === slug);
    if (existing >= 0) setLines(lines.map((l, i) => (i === existing ? { ...l, qty: l.qty + 1 } : l)));
    else setLines([...lines, { key: Date.now(), slug: p.slug, name: p.name, sku: p.sku, qty: 1, price: p.price }]);
  };
  const set = (i: number, patch: Partial<Line>) => setLines(lines.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="space-y-2">
      {lines.length > 0 && (
        <div className="hidden grid-cols-[1fr_70px_110px_96px_32px] gap-2 px-1 text-[10.5px] font-black tracking-wide text-subtle uppercase sm:grid">
          <span>Item</span><span>Qty</span><span>Unit price</span><span className="text-right">Amount</span><span />
        </div>
      )}
      {lines.map((l, i) => (
        <div key={l.key} className="grid grid-cols-[1fr_64px_96px_32px] items-center gap-2 sm:grid-cols-[1fr_70px_110px_96px_32px]">
          <input value={l.name} readOnly={!free && l.slug !== "custom"} onChange={(e) => set(i, { name: e.target.value })} placeholder="Item name" aria-label="Item" className={cn(input, !free && l.slug !== "custom" && "bg-white")} />
          <input type="number" min={1} value={l.qty} onChange={(e) => set(i, { qty: Math.max(1, Math.trunc(Number(e.target.value)) || 1) })} aria-label="Quantity" className={input} />
          <input type="number" min={0} value={l.price} onChange={(e) => set(i, { price: Math.max(0, Math.trunc(Number(e.target.value)) || 0) })} aria-label="Unit price" className={input} />
          <span className="hidden text-right text-[13px] font-black text-ink tabular-nums sm:block">{bdt(l.qty * l.price)}</span>
          <button type="button" aria-label="Remove line" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-sale hover:bg-tile-coral/10"><X className="size-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <select value="" onChange={(e) => add(e.target.value)} aria-label="Add a product" className={cn(input, "min-w-0 flex-1")}>
          <option value="">+ Add a product…</option>
          {products.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {bdt(p.price)}{p.stock !== undefined ? ` · ${p.stock} in stock` : ""}</option>)}
        </select>
        <Btn onClick={() => setLines([...lines, { key: Date.now(), slug: "custom", name: "", sku: "", qty: 1, price: 0 }])}><Icon name="plus" className="size-4" /> Custom line</Btn>
      </div>
    </div>
  );
}
