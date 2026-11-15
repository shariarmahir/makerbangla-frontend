"use client";

import { useState } from "react";
import { Icon } from "./icon";
import { createOrder } from "@/lib/admin/actions/orders";
import type { DashOrder } from "@/lib/admin/types";
import { deliveryOptions } from "@/lib/site";
import { bdt, cn } from "@/lib/utils";
import { Btn, Field, input, textarea, useAction } from "./kit";
import { LinesEditor, type Line, type PickProduct } from "./lines-editor";
import { invoicePdf } from "./order-docs";

export type KnownCustomer = { name: string; phone: string; email?: string; city?: string; address?: string };
const methods = ["Cash", "bKash", "Nagad", "Rocket", "Bank transfer", "Card"];

/**
 * One form for "New order" (to deliver later) and "Create invoice" (counter sale or billed order): customer with
 * autofill from past orders, items, delivery, discount, payment taken now and hand-over. Invoices download as PDF on save.
 */
export function OrderForm({ mode, products, customers, onDone }: { mode: "order" | "invoice"; products: PickProduct[]; customers: KnownCustomer[]; onDone: () => void }) {
  const { pending, exec } = useAction();
  const invoice = mode === "invoice";
  const [lines, setLines] = useState<Line[]>([]);
  const [delivery, setDelivery] = useState<string>(invoice ? "pickup" : deliveryOptions[0].id);
  const [c, setC] = useState<KnownCustomer>({ name: "", phone: "" });
  const [discount, setDiscount] = useState(0);
  const [paidNow, setPaidNow] = useState<number | "">("");
  const [method, setMethod] = useState("Cash");
  const [handedOver, setHandedOver] = useState(invoice);
  const [source, setSource] = useState(invoice ? "walk-in" : "phone");
  const [note, setNote] = useState("");

  const fee = deliveryOptions.find((d) => d.id === delivery)?.fee ?? 0;
  const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
  const total = Math.max(0, subtotal - discount) + fee;
  const paid = paidNow === "" ? 0 : paidNow;

  const pickCustomer = (phone: string) => {
    const hit = customers.find((x) => x.phone === phone.replace(/\D/g, "").replace(/^88/, ""));
    setC((s) => (hit ? { ...hit } : { ...s, phone }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: c.name, phone: c.phone, email: c.email ?? "", delivery, city: c.city ?? "", address: c.address ?? "", source, note,
      lines: lines.map((l) => ({ slug: l.slug, name: l.name, sku: l.sku, qty: l.qty, price: l.price })),
      discount, paidNow: paid, method, handedOver,
    };
    const r = await exec(() => createOrder(payload), invoice ? "Invoice created" : "Order created");
    if (!r.ok) return;
    if (invoice) {
      const d = deliveryOptions.find((x) => x.id === delivery)!;
      const now = new Date().toISOString();
      const order: DashOrder = {
        id: r.data, createdAt: now, customer: { name: c.name, phone: c.phone, ...(c.email ? { email: c.email } : {}) },
        delivery: { id: d.id, label: d.label, fee: d.fee, ...(d.id === "pickup" ? {} : { address: c.address, city: c.city }) },
        payment: "", lines: payload.lines, subtotal, total, discount: discount || undefined, demo: false, note: note || undefined,
        status: handedOver ? "delivered" : "confirmed", payments: paid ? [{ amount: paid, method, at: now }] : [], history: [], source,
      };
      await invoicePdf(order);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="grid content-start gap-3 sm:grid-cols-2">
        <Field label="Mobile" hint={customers.length ? "Type a past customer's number to fill their details." : undefined}>
          <input value={c.phone} onChange={(e) => pickCustomer(e.target.value)} required inputMode="tel" placeholder="01XXXXXXXXX" list="known-customers" className={input} />
          <datalist id="known-customers">{customers.slice(0, 300).map((x) => <option key={x.phone} value={x.phone}>{x.name}</option>)}</datalist>
        </Field>
        <Field label="Customer name"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} required maxLength={80} className={input} /></Field>
        <Field label="Email (optional)"><input value={c.email ?? ""} onChange={(e) => setC({ ...c, email: e.target.value })} type="email" className={input} /></Field>
        <Field label="Sale came from">
          <select value={source} onChange={(e) => setSource(e.target.value)} className={input}>{[["walk-in", "Walk-in / counter"], ["phone", "Phone call"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["website", "Website"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label="Delivery">
          <select value={delivery} onChange={(e) => setDelivery(e.target.value)} className={input}>{deliveryOptions.map((d) => <option key={d.id} value={d.id}>{d.label} — {bdt(d.fee)}</option>)}</select>
        </Field>
        {delivery !== "pickup" ? <Field label="City"><input value={c.city ?? ""} onChange={(e) => setC({ ...c, city: e.target.value })} maxLength={60} className={input} /></Field> : <span className="hidden sm:block" />}
        {delivery !== "pickup" && <Field label="Address" className="sm:col-span-2"><input value={c.address ?? ""} onChange={(e) => setC({ ...c, address: e.target.value })} maxLength={200} className={input} /></Field>}
        <div className="sm:col-span-2"><p className="mb-1.5 text-[11.5px] font-black tracking-wide text-subtle uppercase">Items</p><LinesEditor lines={lines} setLines={setLines} products={products} /></div>
        <Field label="Note (printed on the invoice)" className="sm:col-span-2"><textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} className={textarea} /></Field>
      </div>

      {/* Live summary */}
      <aside className="flex flex-col gap-3 self-start rounded-[20px] bg-soft p-4 lg:sticky lg:top-0">
        <dl className="space-y-1.5 text-[13px]">
          <div className="flex justify-between"><dt className="text-subtle">Items</dt><dd className="font-bold tabular-nums">{bdt(subtotal)}</dd></div>
          <div className="flex items-center justify-between gap-2"><dt className="text-subtle">Discount</dt><dd><input type="number" min={0} max={subtotal} value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} placeholder="0" aria-label="Discount" className={cn(input, "h-8 w-28 bg-white text-right")} /></dd></div>
          <div className="flex justify-between"><dt className="text-subtle">Delivery</dt><dd className="font-bold tabular-nums">{bdt(fee)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-[16px] font-black text-ink"><dt>Total</dt><dd className="tabular-nums">{bdt(total)}</dd></div>
        </dl>
        <div className="rounded-2xl bg-white p-3 ring-1 ring-line">
          <p className="mb-2 text-[11px] font-black tracking-wide text-subtle uppercase">Payment received now</p>
          <div className="flex gap-2">
            <input type="number" min={0} max={total} value={paidNow} onChange={(e) => setPaidNow(e.target.value === "" ? "" : Math.max(0, Math.trunc(Number(e.target.value)) || 0))} placeholder="0" aria-label="Amount received" className={cn(input, "min-w-0 flex-1")} />
            <select value={method} onChange={(e) => setMethod(e.target.value)} aria-label="Payment method" className={cn(input, "w-28")}>{methods.map((m) => <option key={m}>{m}</option>)}</select>
          </div>
          <div className="mt-2 flex gap-1.5">
            <Btn size="sm" tone="soft" onClick={() => setPaidNow(total)} className="flex-1">Full</Btn>
            <Btn size="sm" tone="soft" onClick={() => setPaidNow(Math.round(total / 2))} className="flex-1">50%</Btn>
            <Btn size="sm" tone="soft" onClick={() => setPaidNow("")} className="flex-1">None</Btn>
          </div>
          <p className={cn("mt-2 text-right text-[12.5px] font-black tabular-nums", total - paid > 0 ? "text-sale" : "text-tile-navy")}>{total - paid > 0 ? `Due ${bdt(total - paid)}` : "Fully paid"}</p>
        </div>
        <label className="flex items-start gap-2 rounded-2xl bg-white p-3 text-[12.5px] font-bold text-ink ring-1 ring-line">
          <input type="checkbox" checked={handedOver} onChange={(e) => setHandedOver(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-tile-navy)]" />
          <span>Goods handed over now<span className="block text-[11px] font-semibold text-subtle">Marks the order delivered (counter sale or pickup).</span></span>
        </label>
        <div className="flex gap-2">
          <Btn onClick={onDone} className="flex-1">Cancel</Btn>
          <Btn type="submit" tone="primary" disabled={pending || !lines.length || lines.some((l) => !l.name.trim())} className="flex-[2]">
            {invoice ? <Icon name="download" className="size-4" /> : <Icon name="cart" className="size-4" />}
            {invoice ? "Save & download" : "Create order"}
          </Btn>
        </div>
      </aside>
    </form>
  );
}
