"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Ban, Check, CircleDollarSign, Download, FileText, Mail, PackageCheck, Plus, Receipt, Search, Truck, X } from "lucide-react";
import { addPayment, advanceOrder, cancelOrder, clearCancelled, createOrder, createQuote, deleteOrders, deleteQuote, setQuoteStatus } from "@/lib/admin/actions/orders";
import { documentPdf, mailto } from "@/lib/admin/pdf";
import { orderStatuses, type DashOrder, type OrderStatus, type Quote } from "@/lib/admin/types";
import { deliveryOptions } from "@/lib/site";
import { bdt, cn } from "@/lib/utils";
import { Btn, ConfirmButton, download, Field, input, Modal, textarea, toCsv, useAction } from "./kit";
import { Avatar, Card, Empty, Pill } from "./ui";

type Product = { slug: string; name: string; sku: string; price: number };

const next: Partial<Record<OrderStatus, { label: string; icon: typeof Check }>> = {
  pending: { label: "Confirm", icon: Check },
  confirmed: { label: "Pack", icon: PackageCheck },
  packed: { label: "Ship", icon: Truck },
  shipped: { label: "Delivered", icon: Check },
};
const PER_PAGE = 20;
const paid = (o: DashOrder) => o.payments.reduce((n, p) => n + p.amount, 0);
const date = (iso: string, time = false) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", ...(time ? { hour: "2-digit", minute: "2-digit" } : { year: "2-digit" }), timeZone: "Asia/Dhaka" });
const addr = (o: DashOrder) => [o.delivery.address, o.delivery.area, o.delivery.city].filter(Boolean).join(", ");

function orderDoc(o: DashOrder, kind: "Invoice" | "Receipt") {
  return documentPdf({ kind, ref: o.id, date: o.createdAt, customer: o.customer, address: addr(o), lines: o.lines, delivery: { label: o.delivery.label, fee: o.delivery.fee }, paid: paid(o), note: o.note });
}

export function OrdersManager({ orders, quotes, products, isAdmin }: { orders: DashOrder[]; quotes: Quote[]; products: Product[]; isAdmin: boolean }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<"orders" | "quotes">("orders");
  const [status, setStatus] = useState<OrderStatus | "all">((orderStatuses as readonly string[]).includes(params.get("status") ?? "") ? (params.get("status") as OrderStatus) : "all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [quoting, setQuoting] = useState(false);
  const { pending, exec } = useAction();

  const counts = useMemo(() => Object.fromEntries(orderStatuses.map((s) => [s, orders.filter((o) => o.status === s).length])), [orders]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders.filter((o) => (status === "all" || o.status === status) && (!s || `${o.id} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(s)));
  }, [orders, status, q]);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const pg = Math.min(page, pages - 1);
  const rows = shown.slice(pg * PER_PAGE, pg * PER_PAGE + PER_PAGE);
  const detail = orders.find((o) => o.id === open);
  const allPicked = rows.length > 0 && rows.every((o) => picked.includes(o.id));

  const exportCsv = () =>
    download(`orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([["Order", "Date", "Customer", "Phone", "Delivery", "Items", "Total", "Paid", "Due", "Status", "Source"], ...shown.map((o) => [o.id, o.createdAt.slice(0, 10), o.customer.name, o.customer.phone, o.delivery.label, o.lines.map((l) => `${l.qty}x ${l.name}`).join("; "), o.total, paid(o), o.status === "cancelled" ? 0 : o.total - paid(o), o.status, o.source])]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex rounded-xl bg-white p-1 ring-1 ring-line">
          {(["orders", "quotes"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("h-9 rounded-lg px-4 text-[13px] font-black", tab === t ? "bg-tile-navy text-tile-yellow" : "text-subtle hover:text-ink")}>
              {t === "orders" ? `Orders (${orders.length})` : `Quotations (${quotes.length})`}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {tab === "orders" ? (
            <>
              <Btn onClick={exportCsv}><Download className="size-4 text-brand" /> Export CSV</Btn>
              <Btn tone="primary" onClick={() => setCreating(true)}><Plus className="size-4" /> New order</Btn>
            </>
          ) : (
            <Btn tone="primary" onClick={() => setQuoting(true)}><Plus className="size-4" /> New quotation</Btn>
          )}
        </div>
      </div>

      {tab === "orders" ? (
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {(["all", ...orderStatuses] as const).map((s) => (
              <button key={s} onClick={() => (setStatus(s), setPage(0))} className={cn("h-8 rounded-full px-3 text-[12px] font-black capitalize transition-colors", status === s ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
                {s} <span className="tabular-nums opacity-70">{s === "all" ? orders.length : counts[s]}</span>
              </button>
            ))}
            <label className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
              <input value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} placeholder="Search order, name, phone" aria-label="Search orders" className={cn(input, "pl-9")} />
            </label>
          </div>

          {isAdmin && picked.length > 0 && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-tile-sky/50 px-3 py-2 text-[12.5px] font-bold text-tile-navy">
              {picked.length} selected
              <ConfirmButton label="Delete selected" confirm={`Delete ${picked.length}`} onConfirm={() => exec(() => deleteOrders({ ids: picked }), "Orders deleted").then((r) => r.ok && setPicked([]))} className="ml-auto" />
              <Btn size="sm" onClick={() => setPicked([])}>Clear</Btn>
            </div>
          )}

          {shown.length === 0 ? (
            <Empty>No orders match.</Empty>
          ) : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full min-w-[860px] text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-[11px] font-black tracking-wide text-subtle uppercase [&>th]:px-2 [&>th]:pb-2.5">
                    <th className="w-8 !pl-0">{isAdmin && <input type="checkbox" aria-label="Select all" checked={allPicked} onChange={() => setPicked(allPicked ? [] : rows.map((o) => o.id))} className="size-4 accent-[var(--color-tile-navy)]" />}</th>
                    <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const p = paid(o), pct = o.total ? Math.min(100, (p / o.total) * 100) : 0;
                    const step = next[o.status];
                    return (
                      <tr key={o.id} className="border-b border-line/70 last:border-0 hover:bg-soft/50 [&>td]:px-2 [&>td]:py-3">
                        <td className="!pl-0">{isAdmin && <input type="checkbox" aria-label={`Select ${o.id}`} checked={picked.includes(o.id)} onChange={() => setPicked((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))} className="size-4 accent-[var(--color-tile-navy)]" />}</td>
                        <td><button onClick={() => setOpen(o.id)} className="text-left font-black text-tile-navy hover:underline">{o.id}</button><span className="block text-[11px] font-semibold text-subtle">{date(o.createdAt, true)}</span></td>
                        <td><span className="flex items-center gap-2"><Avatar name={o.customer.name} size={28} /><span><b className="block text-ink">{o.customer.name}</b><span className="text-[11px] text-subtle">{o.customer.phone}</span></span></span></td>
                        <td className="max-w-48 truncate text-subtle" title={o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}>{o.lines.reduce((n, l) => n + l.qty, 0)} · {o.lines[0]?.name}</td>
                        <td className="font-black text-ink tabular-nums">{bdt(o.total)}</td>
                        <td className="min-w-28">
                          <span className="text-[11.5px] font-bold tabular-nums">{bdt(p)}</span>
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-soft"><span className={cn("block h-full rounded-full", pct >= 100 ? "bg-tile-navy" : "bg-tile-yellow")} style={{ width: `${pct}%` }} /></span>
                        </td>
                        <td><Pill tone={o.status}>{o.status}</Pill></td>
                        <td className="text-right">
                          <span className="inline-flex gap-1">
                            {step && <Btn size="sm" tone={o.status === "shipped" ? "primary" : "accent"} disabled={pending} onClick={() => exec(() => advanceOrder({ id: o.id }), `${o.id} → ${step.label.toLowerCase()}`)}><step.icon className="size-3.5" /> {step.label}</Btn>}
                            <Btn size="sm" tone="soft" onClick={() => setOpen(o.id)}>Open</Btn>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-1.5 text-[12.5px] font-bold text-subtle">
                <Btn size="sm" tone="soft" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Previous</Btn>
                <span className="px-2 tabular-nums">Page {pg + 1} of {pages} · {shown.length} orders</span>
                <Btn size="sm" tone="soft" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Btn>
              </nav>
            )}
            {isAdmin && counts.cancelled > 0 && <ConfirmButton label={`Clear ${counts.cancelled} cancelled`} confirm="Clear cancelled" onConfirm={() => exec(() => clearCancelled(), "Cancelled orders cleared")} className="ml-auto" />}
          </div>
        </Card>
      ) : (
        <Quotes quotes={quotes} exec={exec} />
      )}

      <Modal open={!!detail} onOpenChange={(o) => !o && setOpen(null)} title={detail ? `Order ${detail.id}` : ""} wide>
        {detail && <OrderDetail o={detail} exec={exec} pending={pending} isAdmin={isAdmin} onDeleted={() => setOpen(null)} />}
      </Modal>
      <Modal open={creating} onOpenChange={setCreating} title="New order" wide>
        <NewOrder products={products} exec={exec} pending={pending} onDone={() => setCreating(false)} />
      </Modal>
      <Modal open={quoting} onOpenChange={setQuoting} title="New quotation" wide>
        <NewQuote products={products} exec={exec} pending={pending} onDone={() => setQuoting(false)} />
      </Modal>
    </div>
  );
}

type Exec = ReturnType<typeof useAction>["exec"];

function OrderDetail({ o, exec, pending, isAdmin, onDeleted }: { o: DashOrder; exec: Exec; pending: boolean; isAdmin: boolean; onDeleted: () => void }) {
  const p = paid(o), due = o.status === "cancelled" ? 0 : o.total - p;
  const flow = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;
  const reached = (s: OrderStatus) => o.history.some((h) => h.status === s) || flow.indexOf(o.status as (typeof flow)[number]) >= flow.indexOf(s as (typeof flow)[number]);
  return (
    <div className="space-y-5">
      {/* Live tracking */}
      <ol className="grid grid-cols-5 gap-1">
        {flow.map((s, i) => (
          <li key={s} className="text-center">
            <span className={cn("relative mx-auto grid size-9 place-items-center rounded-full text-[12px] font-black", o.status === "cancelled" ? "bg-soft text-subtle" : reached(s) ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle")}>
              {i + 1}
            </span>
            <span className="mt-1.5 block text-[11px] font-bold text-ink capitalize">{s}</span>
          </li>
        ))}
      </ol>
      {o.status === "cancelled" && <p className="rounded-xl bg-tile-coral/10 px-3 py-2 text-[12.5px] font-bold text-sale">This order was cancelled.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-soft p-4 text-[12.5px]">
          <p className="mb-1 text-[11px] font-black tracking-wide text-subtle uppercase">Customer</p>
          <p className="font-black text-ink">{o.customer.name}</p>
          <p className="text-subtle">{o.customer.phone}{o.customer.email && ` · ${o.customer.email}`}</p>
          <p className="mt-2 text-subtle">{o.delivery.label}{addr(o) && ` — ${addr(o)}`}</p>
          {o.note && <p className="mt-2 text-ink-2"><b>Note:</b> {o.note}</p>}
        </div>
        <div className="rounded-2xl bg-soft p-4 text-[12.5px]">
          <p className="mb-1 text-[11px] font-black tracking-wide text-subtle uppercase">History</p>
          <ul className="space-y-1">
            {o.history.map((h, i) => <li key={i} className="flex justify-between gap-2"><span className="font-bold text-ink capitalize">{h.status} <span className="font-semibold text-subtle normal-case">by {h.by}</span></span><span className="text-subtle">{date(h.at, true)}</span></li>)}
          </ul>
        </div>
      </div>

      <ul className="divide-y divide-line rounded-2xl ring-1 ring-line">
        {o.lines.map((l) => (
          <li key={l.slug + l.name} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
            <span className="min-w-0 flex-1 truncate font-bold text-ink">{l.name} <span className="font-semibold text-subtle">· {l.sku}</span></span>
            <span className="text-subtle tabular-nums">{l.qty} × {bdt(l.price)}</span>
            <span className="w-24 text-right font-black tabular-nums">{bdt(l.qty * l.price)}</span>
          </li>
        ))}
        <li className="flex justify-between px-4 py-2.5 text-[12.5px] text-subtle"><span>Delivery</span><span className="tabular-nums">{bdt(o.delivery.fee)}</span></li>
        <li className="flex justify-between px-4 py-3 text-[14px] font-black text-ink"><span>Total</span><span className="tabular-nums">{bdt(o.total)}</span></li>
      </ul>

      <div className="rounded-2xl bg-tile-sky/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] font-bold text-tile-navy">
          <span>Paid <b className="tabular-nums">{bdt(p)}</b> · Due <b className="tabular-nums">{bdt(due)}</b></span>
          <span className="text-[11.5px] font-semibold">{o.payments.map((x) => `${bdt(x.amount)} ${x.method}`).join(" · ")}</span>
        </div>
        {due > 0 && (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              exec(() => addPayment({ id: o.id, amount: Number(f.get("amount")), method: String(f.get("method")) }), "Payment recorded");
            }}
          >
            <input name="amount" type="number" min={1} max={due} defaultValue={due} required aria-label="Amount" className={cn(input, "w-36 bg-white")} />
            <select name="method" aria-label="Method" className={cn(input, "w-40 bg-white")}>
              {["Cash", "bKash", "Nagad", "Rocket", "Bank transfer", "Card"].map((m) => <option key={m}>{m}</option>)}
            </select>
            <Btn type="submit" tone="primary" disabled={pending}><CircleDollarSign className="size-4" /> Record payment</Btn>
          </form>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => orderDoc(o, "Invoice")}><FileText className="size-4 text-brand" /> Invoice PDF</Btn>
        <Btn onClick={() => orderDoc(o, "Receipt")}><Receipt className="size-4 text-brand" /> Receipt PDF</Btn>
        {o.customer.email && (
          <a href={mailto(o.customer.email, `Your Makerbangla order ${o.id}`, `Hi ${o.customer.name},\n\nThank you for your order ${o.id}.\nTotal: ${bdt(o.total)} · Paid: ${bdt(p)} · Due: ${bdt(due)}\nStatus: ${o.status}\n\nYour invoice is attached.\n\n— Makerbangla`)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-tile-navy ring-1 ring-line hover:bg-soft">
            <Mail className="size-4 text-brand" /> Email customer
          </a>
        )}
        <span className="ml-auto flex gap-2">
          {o.status !== "cancelled" && o.status !== "delivered" && <Btn tone="danger" onClick={() => exec(() => cancelOrder({ id: o.id }), "Order cancelled")}><Ban className="size-4" /> Cancel order</Btn>}
          {isAdmin && <ConfirmButton label="Delete" onConfirm={() => exec(() => deleteOrders({ ids: [o.id] }), "Order deleted").then((r) => r.ok && onDeleted())} />}
        </span>
      </div>
    </div>
  );
}

type Line = { key: number; slug: string; name: string; sku: string; qty: number; price: number };

function LinesEditor({ lines, setLines, products, free }: { lines: Line[]; setLines: (l: Line[]) => void; products: Product[]; free?: boolean }) {
  const add = (slug: string) => {
    const p = products.find((x) => x.slug === slug);
    if (p) setLines([...lines, { key: Date.now(), slug: p.slug, name: p.name, sku: p.sku, qty: 1, price: p.price }]);
  };
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={l.key} className="grid grid-cols-[1fr_70px_100px_32px] items-center gap-2">
          <input value={l.name} readOnly={!free} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Item" className={cn(input, !free && "bg-white")} />
          <input type="number" min={1} value={l.qty} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x)))} aria-label="Quantity" className={input} />
          <input type="number" min={0} value={l.price} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, price: Math.max(0, Number(e.target.value)) } : x)))} aria-label="Unit price" className={input} />
          <button type="button" aria-label="Remove line" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="grid size-8 place-items-center rounded-lg text-sale hover:bg-tile-coral/10"><X className="size-4" /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <select value="" onChange={(e) => add(e.target.value)} aria-label="Add a product" className={cn(input, "flex-1")}>
          <option value="">+ Add a product…</option>
          {products.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {bdt(p.price)}</option>)}
        </select>
        {free && <Btn onClick={() => setLines([...lines, { key: Date.now(), slug: "custom", name: "", sku: "", qty: 1, price: 0 }])}><Plus className="size-4" /> Custom line</Btn>}
      </div>
      <p className="text-right text-[13px] font-black text-ink tabular-nums">Items total {bdt(lines.reduce((n, l) => n + l.qty * l.price, 0))}</p>
    </div>
  );
}

function NewOrder({ products, exec, pending, onDone }: { products: Product[]; exec: Exec; pending: boolean; onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [delivery, setDelivery] = useState<string>(deliveryOptions[0].id);
  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await exec(() => createOrder({ ...f, lines: lines.map((l) => ({ slug: l.slug, name: l.name, sku: l.sku, qty: l.qty, price: l.price })) }), "Order created");
        if (r.ok) onDone();
      }}
    >
      <Field label="Customer name"><input name="name" required maxLength={80} className={input} /></Field>
      <Field label="Mobile"><input name="phone" required inputMode="tel" placeholder="01XXXXXXXXX" className={input} /></Field>
      <Field label="Email (optional)"><input name="email" type="email" className={input} /></Field>
      <Field label="Order came from">
        <select name="source" className={input}>{[["phone", "Phone call"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["walk-in", "Walk-in"], ["website", "Website"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Field>
      <Field label="Delivery">
        <select name="delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} className={input}>{deliveryOptions.map((d) => <option key={d.id} value={d.id}>{d.label} — {bdt(d.fee)}</option>)}</select>
      </Field>
      {delivery !== "pickup" && <Field label="City"><input name="city" maxLength={60} className={input} /></Field>}
      {delivery !== "pickup" && <Field label="Address" className="sm:col-span-2"><input name="address" maxLength={200} className={input} /></Field>}
      <div className="sm:col-span-2"><p className="mb-1.5 text-[11.5px] font-black tracking-wide text-subtle uppercase">Items</p><LinesEditor lines={lines} setLines={setLines} products={products} /></div>
      <Field label="Note" className="sm:col-span-2"><textarea name="note" maxLength={300} className={textarea} /></Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn onClick={onDone}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending || !lines.length}>Create order</Btn>
      </div>
    </form>
  );
}

function NewQuote({ products, exec, pending, onDone }: { products: Product[]; exec: Exec; pending: boolean; onDone: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  return (
    <form
      className="grid gap-3 sm:grid-cols-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        const r = await exec(() => createQuote({ ...f, lines: lines.map(({ name, qty, price }) => ({ name, qty, price })) }), "Quotation created");
        if (r.ok) onDone();
      }}
    >
      <Field label="Customer / organisation"><input name="name" required maxLength={80} className={input} /></Field>
      <Field label="Phone"><input name="phone" required maxLength={20} className={input} /></Field>
      <Field label="Email (optional)"><input name="email" type="email" className={input} /></Field>
      <div className="sm:col-span-3"><p className="mb-1.5 text-[11.5px] font-black tracking-wide text-subtle uppercase">Lines</p><LinesEditor lines={lines} setLines={setLines} products={products} free /></div>
      <Field label="Terms / note" className="sm:col-span-3"><textarea name="note" maxLength={400} className={textarea} placeholder="e.g. Delivery within 5 working days. 50% advance." /></Field>
      <div className="flex justify-end gap-2 sm:col-span-3">
        <Btn onClick={onDone}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending || !lines.length}>Save quotation</Btn>
      </div>
    </form>
  );
}

function Quotes({ quotes, exec }: { quotes: Quote[]; exec: Exec }) {
  if (!quotes.length) return <Card><Empty>No quotations yet. Create one for labs, clubs and bulk buyers.</Empty></Card>;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {quotes.map((q) => {
        const total = q.lines.reduce((n, l) => n + l.qty * l.price, 0);
        return (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-black text-ink">{q.id}</p>
                <p className="text-[12px] font-semibold text-subtle">{date(q.createdAt)} · {q.customer.name}</p>
              </div>
              <Pill tone={q.status === "accepted" ? "delivered" : q.status === "sent" ? "confirmed" : "pending"}>{q.status}</Pill>
            </div>
            <ul className="my-3 space-y-1 text-[12.5px]">
              {q.lines.slice(0, 4).map((l, i) => <li key={i} className="flex justify-between gap-2"><span className="truncate text-ink-2">{l.qty} × {l.name}</span><span className="tabular-nums">{bdt(l.qty * l.price)}</span></li>)}
              {q.lines.length > 4 && <li className="text-subtle">+ {q.lines.length - 4} more</li>}
            </ul>
            <p className="border-t border-line pt-2 text-right text-[15px] font-black text-ink tabular-nums">{bdt(total)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Btn size="sm" onClick={() => documentPdf({ kind: "Quotation", ref: q.id, date: q.createdAt, customer: q.customer, lines: q.lines, note: q.note })}><FileText className="size-3.5 text-brand" /> PDF</Btn>
              {q.customer.email && <a href={mailto(q.customer.email, `Quotation ${q.id} from Makerbangla`, `Dear ${q.customer.name},\n\nPlease find our quotation ${q.id} attached. Total: ${bdt(total)}.\n\n— Makerbangla`)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 text-[12px] font-bold text-tile-navy ring-1 ring-line hover:bg-soft"><Mail className="size-3.5 text-brand" /> Email</a>}
              {q.status !== "sent" && q.status !== "accepted" && <Btn size="sm" tone="soft" onClick={() => exec(() => setQuoteStatus({ id: q.id, status: "sent" }), "Marked as sent")}>Mark sent</Btn>}
              {q.status !== "accepted" && <Btn size="sm" tone="accent" onClick={() => exec(() => setQuoteStatus({ id: q.id, status: "accepted" }), "Marked as accepted")}>Accepted</Btn>}
              <ConfirmButton size="icon" label="Delete quotation" onConfirm={() => exec(() => deleteQuote({ id: q.id }), "Quotation deleted")} className="ml-auto" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
