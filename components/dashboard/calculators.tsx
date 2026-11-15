"use client";

import { useState } from "react";
import { Icon, type IconName } from "./icon";
import { bdt, cn } from "@/lib/utils";
import { Field, input } from "./kit";
import { Card } from "./ui";

/** Business calculators for pricing, imports, targets and margins. Everything runs in the browser; nothing is saved. */

const n = (v: number) => (Number.isFinite(v) ? v : 0);
const pct = (v: number) => `${n(v).toFixed(1)}%`;

function useNums<T extends Record<string, number>>(init: T) {
  const [v, setV] = useState(init);
  const field = (k: keyof T, label: string, suffix?: string, step = 1) => (
    <Field label={label} key={String(k)}>
      <span className="relative block">
        <input type="number" min={0} step={step} value={v[k]} onChange={(e) => setV((s) => ({ ...s, [k]: Math.max(0, Number(e.target.value) || 0) }))} className={cn(input, suffix && "pr-14")} />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-black text-subtle">{suffix}</span>}
      </span>
    </Field>
  );
  return { v, field };
}

function Results({ items }: { items: { label: string; value: string; tone?: "navy" | "yellow" | "warn" }[] }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className={cn("rounded-2xl p-3", it.tone === "navy" ? "bg-tile-navy text-tile-yellow" : it.tone === "yellow" ? "bg-tile-yellow text-tile-navy" : it.tone === "warn" ? "bg-tile-coral/12 text-sale" : "bg-soft text-ink")}>
          <dt className="text-[11px] font-bold opacity-80">{it.label}</dt>
          <dd className="text-[15.5px] font-black tabular-nums">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ icon, title, children }: { icon: IconName; title: string; children: React.ReactNode }) {
  return (
    <Card title={<span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-tile-sky text-tile-navy"><Icon name={icon} className="size-4.5" /></span>{title}</span>}>
      {children}
    </Card>
  );
}

export function PricingCalculator() {
  const { v, field } = useNums({ cost: 500, markup: 30, discount: 0, delivery: 70, qty: 10, fixed: 60000 });
  const price = Math.round(v.cost * (1 + v.markup / 100));
  const sale = Math.round(price * (1 - v.discount / 100));
  const unit = sale - v.cost;
  const breakEven = unit > 0 ? Math.ceil(v.fixed / unit) : Infinity;
  return (
    <Panel icon="badge-percent" title="Pricing & profit">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field("cost", "Buying cost", "BDT")}
        {field("markup", "Markup", "%")}
        {field("discount", "Offer discount", "%")}
        {field("qty", "Units to sell")}
        {field("delivery", "Delivery charge", "BDT")}
        {field("fixed", "Monthly fixed costs", "BDT")}
      </div>
      <Results
        items={[
          { label: "Regular price", value: bdt(price) },
          { label: "Offer price", value: bdt(sale), tone: "yellow" },
          { label: "Customer pays", value: bdt(sale + v.delivery) },
          { label: "Profit per unit", value: bdt(unit), tone: unit < 0 ? "warn" : undefined },
          { label: `Profit on ${v.qty} units`, value: bdt(unit * v.qty), tone: unit < 0 ? "warn" : "navy" },
          { label: "Break-even units / month", value: Number.isFinite(breakEven) ? breakEven.toLocaleString("en-IN") : "—" },
        ]}
      />
      <p className="mt-3 text-[12px] font-semibold text-subtle">Margin on the offer price: {pct(sale ? (unit / sale) * 100 : 0)}</p>
    </Panel>
  );
}

export function LandedCostCalculator() {
  const { v, field } = useNums({ price: 2.5, qty: 100, rate: 122, shipping: 4500, duty: 25, vat: 15, other: 1500, margin: 35 });
  const goods = v.price * v.qty * v.rate;
  const duty = (goods + v.shipping) * (v.duty / 100);
  const vat = (goods + v.shipping + duty) * (v.vat / 100);
  const landed = goods + v.shipping + duty + vat + v.other;
  const perUnit = v.qty ? landed / v.qty : 0;
  const sell = v.margin < 100 ? perUnit / (1 - v.margin / 100) : 0;
  return (
    <Panel icon="send" title="Import landed cost">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {field("price", "Unit price", "USD", 0.01)}
        {field("qty", "Quantity")}
        {field("rate", "Exchange rate", "BDT", 0.01)}
        {field("shipping", "Freight", "BDT")}
        {field("duty", "Customs duty", "%", 0.5)}
        {field("vat", "VAT & tax", "%", 0.5)}
        {field("other", "Clearing", "BDT")}
        {field("margin", "Target margin", "%", 0.5)}
      </div>
      <Results
        items={[
          { label: "Goods in BDT", value: bdt(goods) },
          { label: "Duty + VAT", value: bdt(duty + vat) },
          { label: "Total landed cost", value: bdt(landed) },
          { label: "Cost per unit", value: bdt(perUnit), tone: "yellow" },
          { label: "Suggested selling price", value: bdt(Math.ceil(sell / 10) * 10), tone: "navy" },
          { label: "Profit on the batch", value: bdt(Math.ceil(sell / 10) * 10 * v.qty - landed) },
        ]}
      />
    </Panel>
  );
}

export function TargetCalculator({ avgOrder, monthlyFixed }: { avgOrder: number; monthlyFixed: number }) {
  const { v, field } = useNums({ fixed: monthlyFixed || 60000, aov: avgOrder || 2500, margin: 28, profit: 50000, days: 26 });
  const perOrder = v.aov * (v.margin / 100);
  const be = perOrder > 0 ? Math.ceil(v.fixed / perOrder) : Infinity;
  const goal = perOrder > 0 ? Math.ceil((v.fixed + v.profit) / perOrder) : Infinity;
  const fmt = (x: number) => (Number.isFinite(x) ? x.toLocaleString("en-IN") : "—");
  return (
    <Panel icon="circle-gauge" title="Break-even & monthly target">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {field("fixed", "Monthly fixed costs", "BDT")}
        {field("aov", "Average order value", "BDT")}
        {field("margin", "Gross margin", "%", 0.5)}
        {field("profit", "Profit goal / month", "BDT")}
        {field("days", "Working days")}
      </div>
      <Results
        items={[
          { label: "Profit per order", value: bdt(perOrder) },
          { label: "Break-even orders / month", value: fmt(be) },
          { label: "Break-even sales", value: Number.isFinite(be) ? bdt(be * v.aov) : "—" },
          { label: "Orders for the goal", value: fmt(goal), tone: "navy" },
          { label: "Orders per day", value: Number.isFinite(goal) && v.days ? (goal / v.days).toFixed(1) : "—", tone: "yellow" },
          { label: "Sales for the goal", value: Number.isFinite(goal) ? bdt(goal * v.aov) : "—" },
        ]}
      />
      <p className="mt-3 text-[12px] font-semibold text-subtle">Average order value and fixed costs start from your last 30 days.</p>
    </Panel>
  );
}

export function MarginConverter() {
  const { v, field } = useNums({ markup: 40, margin: 25 });
  return (
    <Panel icon="chevrons-left-right" title="Margin ↔ markup">
      <div className="grid grid-cols-2 gap-3">
        {field("markup", "Markup on cost", "%", 0.5)}
        {field("margin", "Margin on price", "%", 0.5)}
      </div>
      <Results
        items={[
          { label: `${v.markup}% markup =`, value: `${pct((v.markup / (100 + v.markup)) * 100)} margin`, tone: "yellow" },
          { label: `${v.margin}% margin =`, value: v.margin < 100 ? `${pct((v.margin / (100 - v.margin)) * 100)} markup` : "—", tone: "navy" },
          { label: "Price for BDT 1,000 cost", value: v.margin < 100 ? bdt(1000 / (1 - v.margin / 100)) : "—" },
        ]}
      />
    </Panel>
  );
}
