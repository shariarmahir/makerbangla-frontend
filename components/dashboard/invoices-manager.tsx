"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "./icon";
import { addPayment } from "@/lib/admin/actions/orders";
import { mailto } from "@/lib/admin/pdf";
import type { DashOrder } from "@/lib/admin/types";
import { bdt, cn } from "@/lib/utils";
import { Btn, download, input, Modal, toCsv, useAction } from "./kit";
import type { PickProduct } from "./lines-editor";
import { addressOf, challanNo, challanPdf, dueOf, invoiceNo, invoicePdf, paidOf, payState, receiptNo, receiptPdf, type PayState } from "./order-docs";
import { OrderForm, type KnownCustomer } from "./order-form";
import { Avatar, Card, Empty, Pill, type PillTone } from "./ui";

const stateTone: Record<PayState, PillTone> = { paid: "delivered", partial: "pending", unpaid: "warn", void: "neutral" };
const stateLabel: Record<PayState, string> = { paid: "Paid", partial: "Part paid", unpaid: "Unpaid", void: "Cancelled" };
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dhaka" });
const PER = 20;

function Pager({ page, pages, total, unit, set }: { page: number; pages: number; total: number; unit: string; set: (n: number) => void }) {
  if (pages < 2) return null;
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center gap-1.5 text-[12.5px] font-bold text-subtle">
      <Btn size="sm" tone="soft" disabled={page === 0} onClick={() => set(page - 1)}>Previous</Btn>
      <span className="px-2 tabular-nums">Page {page + 1} of {pages} · {total} {unit}</span>
      <Btn size="sm" tone="soft" disabled={page >= pages - 1} onClick={() => set(page + 1)}>Next</Btn>
    </nav>
  );
}

function SearchBox({ value, set, placeholder }: { value: string; set: (s: string) => void; placeholder: string }) {
  return (
    <label className="relative ml-auto w-full sm:w-72">
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
      <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(input, "pl-9")} />
    </label>
  );
}

const match = (o: DashOrder, q: string) => !q || `${o.id} ${invoiceNo(o)} ${o.customer.name} ${o.customer.phone}`.toLowerCase().includes(q.trim().toLowerCase());

/** Invoices, payment receipts and delivery challans in one place, plus "Create invoice" for counter or billed sales. */
export function InvoicesManager({ orders, products, customers }: { orders: DashOrder[]; products: PickProduct[]; customers: KnownCustomer[] }) {
  const params = useSearchParams();
  const [tab, setTab] = useState<"invoices" | "receipts" | "challans">("invoices");
  const [creating, setCreating] = useState(params.get("new") === "1");
  const [collect, setCollect] = useState<DashOrder | null>(null);
  const { pending, exec } = useAction();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap rounded-xl bg-white p-1 ring-1 ring-line">
          {([["invoices", "Invoices", "file-text"], ["receipts", "Receipts", "receipt-text"], ["challans", "Delivery challans", "truck"]] as const).map(([t, l, ic]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-black", tab === t ? "bg-tile-navy text-tile-yellow" : "text-subtle hover:text-ink")}>
              <Icon name={ic} className="size-4" /> {l}
            </button>
          ))}
        </div>
        <Btn tone="primary" className="ml-auto" onClick={() => setCreating(true)}><Icon name="file-pen-line" className="size-4" /> Create invoice</Btn>
      </div>

      {tab === "invoices" && <Invoices orders={orders} onCollect={setCollect} />}
      {tab === "receipts" && <Receipts orders={orders} />}
      {tab === "challans" && <Challans orders={orders} />}

      <Modal open={creating} onOpenChange={setCreating} title="Create invoice" wide>
        <OrderForm mode="invoice" products={products} customers={customers} onDone={() => setCreating(false)} />
      </Modal>
      <Modal open={!!collect} onOpenChange={(o) => !o && setCollect(null)} title={collect ? `Collect payment · ${invoiceNo(collect)}` : ""}>
        {collect && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const amount = Number(f.get("amount")), method = String(f.get("method"));
              const r = await exec(() => addPayment({ id: collect.id, amount, method }), "Payment recorded");
              if (!r.ok) return;
              if (f.get("print") === "on") await receiptPdf({ ...collect, payments: [...collect.payments, { amount, method, at: new Date().toISOString() }] }, collect.payments.length);
              setCollect(null);
            }}
          >
            <p className="rounded-xl bg-soft px-3 py-2.5 text-[13px] font-bold text-ink">{collect.customer.name} · Total {bdt(collect.total)} · <span className="text-sale">Due {bdt(dueOf(collect))}</span></p>
            <div className="flex gap-2">
              <input name="amount" type="number" min={1} max={dueOf(collect)} defaultValue={dueOf(collect)} required aria-label="Amount" className={cn(input, "flex-1")} />
              <select name="method" aria-label="Method" className={cn(input, "w-36")}>{["Cash", "bKash", "Nagad", "Rocket", "Bank transfer", "Card"].map((m) => <option key={m}>{m}</option>)}</select>
            </div>
            <label className="flex items-center gap-2 text-[12.5px] font-bold text-ink"><input name="print" type="checkbox" defaultChecked className="size-4 accent-[var(--color-tile-navy)]" /> Download the receipt</label>
            <div className="flex justify-end gap-2"><Btn onClick={() => setCollect(null)}>Cancel</Btn><Btn type="submit" tone="primary" disabled={pending}><Icon name="circle-dollar-sign" className="size-4" /> Record payment</Btn></div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Invoices({ orders, onCollect }: { orders: DashOrder[]; onCollect: (o: DashOrder) => void }) {
  const [state, setState] = useState<PayState | "all">("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    orders.forEach((o) => (c[payState(o)] = (c[payState(o)] ?? 0) + 1));
    return c;
  }, [orders]);
  const shown = orders.filter((o) => (state === "all" || payState(o) === state) && match(o, q));
  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const pg = Math.min(page, pages - 1);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "unpaid", "partial", "paid", "void"] as const).map((s) => (
          <button key={s} onClick={() => (setState(s), setPage(0))} className={cn("h-8 rounded-full px-3 text-[12px] font-black", state === s ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
            {s === "all" ? "All" : stateLabel[s]} <span className="tabular-nums opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
        <Btn size="sm" onClick={() => download("invoices.csv", toCsv([["Invoice", "Order", "Date", "Customer", "Phone", "Total", "Discount", "Paid", "Due", "Status"], ...shown.map((o) => [invoiceNo(o), o.id, o.createdAt.slice(0, 10), o.customer.name, o.customer.phone, o.total, o.discount ?? 0, paidOf(o), dueOf(o), stateLabel[payState(o)]])]))}>
          <Icon name="download" className="size-3.5 text-brand" /> CSV
        </Btn>
        <SearchBox value={q} set={(v) => (setQ(v), setPage(0))} placeholder="Invoice, order, name or phone" />
      </div>
      {shown.length === 0 ? (
        <Empty>No invoices match.</Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[860px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-black tracking-wide text-subtle uppercase [&>th]:px-2 [&>th]:pb-2.5 [&>th:first-child]:pl-0">
                <th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th className="text-right">Documents</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(pg * PER, pg * PER + PER).map((o) => {
                const st = payState(o);
                return (
                  <tr key={o.id} className="border-b border-line/70 last:border-0 hover:bg-soft/50 [&>td]:px-2 [&>td]:py-3 [&>td:first-child]:pl-0">
                    <td><b className="block text-tile-navy">{invoiceNo(o)}</b><span className="text-[11px] font-semibold text-subtle">{day(o.createdAt)} · {o.id}</span></td>
                    <td><span className="flex items-center gap-2"><Avatar name={o.customer.name} size={28} /><span><b className="block text-ink">{o.customer.name}</b><span className="text-[11px] text-subtle">{o.customer.phone}</span></span></span></td>
                    <td className="font-black text-ink tabular-nums">{bdt(o.total)}{!!o.discount && <span className="block text-[11px] font-semibold text-subtle">−{bdt(o.discount)} off</span>}</td>
                    <td className="font-semibold tabular-nums">{bdt(paidOf(o))}</td>
                    <td className={cn("font-black tabular-nums", dueOf(o) ? "text-sale" : "text-subtle")}>{bdt(dueOf(o))}</td>
                    <td><Pill tone={stateTone[st]}>{stateLabel[st]}</Pill></td>
                    <td className="text-right">
                      <span className="inline-flex flex-wrap justify-end gap-1">
                        {dueOf(o) > 0 && <Btn size="sm" tone="accent" onClick={() => onCollect(o)}><Icon name="circle-dollar-sign" className="size-3.5" /> Collect</Btn>}
                        <Btn size="sm" tone="soft" onClick={() => invoicePdf(o)}><Icon name="file-text" className="size-3.5" /> PDF</Btn>
                        {o.payments.length > 0 && <Btn size="sm" tone="soft" onClick={() => receiptPdf(o)} aria-label="Receipt PDF"><Icon name="receipt-text" className="size-3.5" /></Btn>}
                        {o.customer.email && (
                          <a
                            href={mailto(o.customer.email, `Invoice ${invoiceNo(o)} from Makerbangla`, `Dear ${o.customer.name},\n\nPlease find invoice ${invoiceNo(o)} for order ${o.id} attached.\nTotal: ${bdt(o.total)}\nPaid: ${bdt(paidOf(o))}\nDue: ${bdt(dueOf(o))}\n\nThank you,\nMakerbangla`)}
                            aria-label={`Email ${invoiceNo(o)}`}
                            className="grid size-8 place-items-center rounded-xl bg-soft text-tile-navy hover:bg-tile-sky/60"
                          >
                            <Icon name="mail-check" className="size-3.5" />
                          </a>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={pg} pages={pages} total={shown.length} unit="invoices" set={setPage} />
    </Card>
  );
}

function Receipts({ orders }: { orders: DashOrder[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const all = useMemo(() => orders.flatMap((o) => o.payments.map((p, i) => ({ o, p, i }))).sort((a, b) => b.p.at.localeCompare(a.p.at)), [orders]);
  const shown = all.filter((r) => match(r.o, q));
  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const pg = Math.min(page, pages - 1);
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-bold text-ink">{shown.length} receipts · <span className="text-tile-navy">{bdt(shown.reduce((n, r) => n + r.p.amount, 0))}</span></p>
        <Btn size="sm" onClick={() => download("receipts.csv", toCsv([["Receipt", "Date", "Order", "Customer", "Method", "Amount"], ...shown.map((r) => [receiptNo(r.o, r.i), r.p.at.slice(0, 10), r.o.id, r.o.customer.name, r.p.method, r.p.amount])]))}>
          <Icon name="download" className="size-3.5 text-brand" /> CSV
        </Btn>
        <SearchBox value={q} set={(v) => (setQ(v), setPage(0))} placeholder="Order, name or phone" />
      </div>
      {shown.length === 0 ? (
        <Empty>No payments recorded yet.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {shown.slice(pg * PER, pg * PER + PER).map(({ o, p, i }) => (
            <li key={`${o.id}-${i}`} className="flex flex-wrap items-center gap-3 py-3 text-[12.5px]">
              <span className="grid size-9 place-items-center rounded-xl bg-tile-yellow text-tile-navy"><Icon name="receipt-text" className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <b className="block text-ink">{receiptNo(o, i)} <span className="font-semibold text-subtle">· {o.customer.name}</span></b>
                <span className="text-[11.5px] text-subtle">{day(p.at)} · {p.method} · order {o.id}</span>
              </span>
              <b className="text-[14px] text-tile-navy tabular-nums">{bdt(p.amount)}</b>
              <Btn size="sm" tone="soft" onClick={() => receiptPdf(o, i)}><Icon name="download" className="size-3.5" /> PDF</Btn>
            </li>
          ))}
        </ul>
      )}
      <Pager page={pg} pages={pages} total={shown.length} unit="receipts" set={setPage} />
    </Card>
  );
}

function Challans({ orders }: { orders: DashOrder[] }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const list = orders.filter((o) => o.delivery.id !== "pickup" && ["confirmed", "packed", "shipped", "delivered"].includes(o.status) && match(o, q));
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const pg = Math.min(page, pages - 1);
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <p className="text-[12.5px] font-semibold text-subtle">A challan goes with the parcel; the receiver signs it on delivery. Prices are not shown.</p>
        <SearchBox value={q} set={(v) => (setQ(v), setPage(0))} placeholder="Order, name or phone" />
      </div>
      {list.length === 0 ? (
        <Empty>No orders are waiting for delivery.</Empty>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.slice(pg * PER, pg * PER + PER).map((o) => (
            <li key={o.id} className="flex items-start gap-3 rounded-2xl p-3.5 ring-1 ring-line">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tile-navy text-tile-yellow"><Icon name="truck" className="size-5" /></span>
              <span className="min-w-0 flex-1 text-[12.5px]">
                <b className="block text-ink">{challanNo(o)} <Pill tone={o.status} className="ml-1 align-middle">{o.status}</Pill></b>
                <span className="block truncate text-subtle">{o.customer.name} · {o.customer.phone}</span>
                <span className="block truncate text-subtle">{addressOf(o) || o.delivery.label}</span>
                <span className="text-[11.5px] font-bold text-ink">{o.lines.reduce((n, l) => n + l.qty, 0)} items · {o.delivery.label}</span>
              </span>
              <Btn size="sm" tone="soft" onClick={() => challanPdf(o)}><Icon name="download" className="size-3.5" /> PDF</Btn>
            </li>
          ))}
        </ul>
      )}
      <Pager page={pg} pages={pages} total={list.length} unit="challans" set={setPage} />
    </Card>
  );
}
