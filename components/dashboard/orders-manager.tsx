"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { addOrderNote, addPayment, advanceOrders, approveOrders, assignOrders, cancelOrder, clearCancelled, createQuote, deleteOrders, deleteQuote, setQuoteStatus } from "@/lib/admin/actions/orders";
import { documentPdf, mailto } from "@/lib/admin/pdf";
import { couriers, orderStatuses, statusLabel, type DashOrder, type OrderStatus, type Quote } from "@/lib/admin/types";
import { bdt, cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";
import { Btn, ConfirmButton, download, Field, input, Modal, textarea, toCsv, useAction } from "./kit";
import { LinesEditor, type Line, type PickProduct } from "./lines-editor";
import { addressOf as addr, challanPdf, invoicePdf, paidOf as paid, receiptPdf } from "./order-docs";
import { Avatar, Card, Empty, Pill } from "./ui";

/**
 * Order management, first click to doorstep: website orders land in "New" for the owner to approve or reject;
 * approval assigns a team member, who packs, hands the parcel to a courier (with tracking) and confirms delivery.
 * The server refreshes this page every 20 s, so the board is live.
 */

export type Member = { id: string; name: string; photo?: string };
type Exec = ReturnType<typeof useAction>["exec"];

const flow = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;
const lane: Record<(typeof flow)[number], { dot: string; icon: IconName }> = {
  pending: { dot: "bg-tile-yellow", icon: "bell" },
  confirmed: { dot: "bg-tile-sky", icon: "circle-check" },
  packed: { dot: "bg-brand", icon: "box" },
  shipped: { dot: "bg-tile-navy", icon: "truck" },
  delivered: { dot: "bg-tile-midnight", icon: "check-check" },
};
const nextStep = (o: DashOrder): { label: string; icon: IconName; ship?: boolean } | null =>
  o.status === "confirmed" ? { label: "Pack", icon: "box" } : o.status === "packed" ? (o.delivery.id === "pickup" ? { label: "Handed over", icon: "check-check" } : { label: "Ship", icon: "truck", ship: true }) : o.status === "shipped" ? { label: "Delivered", icon: "check-check" } : null;

const PER_PAGE = 20;
const date = (iso: string, time = false) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", ...(time ? { hour: "2-digit", minute: "2-digit" } : { year: "2-digit" }), timeZone: "Asia/Dhaka" });

// Client clock for "waiting 3h" labels; the server snapshot is null so hydration matches.
const sub = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};
const useNow = () => useSyncExternalStore(sub, () => Math.floor(Date.now() / 60_000) * 60_000, () => null);
const age = (iso: string, now: number | null) => {
  if (now === null) return "";
  const m = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d`;
};

export function OrdersManager({ orders, quotes, products, team, isAdmin, me }: { orders: DashOrder[]; quotes: Quote[]; products: PickProduct[]; team: Member[]; isAdmin: boolean; me: string }) {
  const params = useSearchParams();
  const start = params.get("tab");
  const [tab, setTab] = useState<"board" | "list" | "history" | "quotes">(start === "history" || start === "quotes" || start === "list" ? start : params.get("status") ? "list" : "board");
  const [q, setQ] = useState("");
  const [mine, setMine] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [ship, setShip] = useState<string[] | null>(null);
  const [reject, setReject] = useState<DashOrder | null>(null);
  const [quoting, setQuoting] = useState(false);
  const { pending, exec } = useAction();

  const s = q.trim().toLowerCase();
  const visible = useMemo(() => orders.filter((o) => (!mine || o.assignee === me) && (!s || `${o.id} ${o.customer.name} ${o.customer.phone} ${o.courier?.tracking ?? ""}`.toLowerCase().includes(s))), [orders, mine, me, s]);
  const detail = orders.find((o) => o.id === open);
  const who = (id?: string) => team.find((m) => m.id === id);

  const act: Actions = {
    open: setOpen,
    approve: (ids) => exec(() => approveOrders({ ids }), ids.length > 1 ? `${ids.length} orders approved` : "Order approved"),
    reject: setReject,
    advance: (o) => (nextStep(o)?.ship ? setShip([o.id]) : exec(() => advanceOrders({ ids: [o.id] }), `${o.id} · ${nextStep(o)?.label.toLowerCase()}`)),
    pending,
    isAdmin,
    who,
  };

  const exportCsv = () =>
    download(`orders-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([["Order", "Date", "Customer", "Phone", "Delivery", "Items", "Total", "Paid", "Due", "Status", "Handled by", "Courier", "Tracking", "Source"], ...visible.map((o) => [o.id, o.createdAt.slice(0, 10), o.customer.name, o.customer.phone, o.delivery.label, o.lines.map((l) => `${l.qty}x ${l.name}`).join("; "), o.total, paid(o), o.status === "cancelled" ? 0 : o.total - paid(o), statusLabel[o.status], who(o.assignee)?.name ?? "", o.courier?.name ?? "", o.courier?.tracking ?? "", o.source])]));

  const tabs = [["board", "Live board", "layout-grid"], ["list", `All orders · ${orders.length}`, "clipboard-check"], ["history", "History", "history"], ["quotes", `Quotations · ${quotes.length}`, "file-text"]] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" className="flex flex-wrap rounded-2xl bg-white p-1 ring-1 ring-line">
          {tabs.map(([t, label, icon]) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("flex h-9 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-black transition-colors", tab === t ? "bg-tile-navy text-tile-yellow shadow-[0_8px_18px_-10px_rgb(26_73_175/0.9)]" : "text-subtle hover:text-ink")}>
              <Icon name={icon} className="size-4" /> {label}
            </button>
          ))}
        </div>
        {tab !== "quotes" && tab !== "history" && (
          <>
            <label className="relative ml-auto w-full sm:w-64">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, customer, phone, tracking" aria-label="Search orders" className={cn(input, "bg-white pl-9")} />
            </label>
            {!isAdmin && (
              <Btn tone={mine ? "primary" : "ghost"} aria-pressed={mine} onClick={() => setMine((m) => !m)}><Icon name="user-check" className="size-4" /> Mine</Btn>
            )}
            <Btn onClick={exportCsv}><Icon name="download" className="size-4 text-brand" /> CSV</Btn>
          </>
        )}
        {tab === "quotes" && <Btn tone="primary" className="ml-auto" onClick={() => setQuoting(true)}><Icon name="plus" className="size-4" /> New quotation</Btn>}
      </div>

      {tab === "board" ? (
        <Board orders={visible} act={act} />
      ) : tab === "list" ? (
        <OrderList orders={visible} act={act} exec={exec} team={team} onShip={setShip} initial={params.get("status")} />
      ) : tab === "history" ? (
        <OrderHistory orders={orders} onOpen={setOpen} />
      ) : (
        <Quotes quotes={quotes} exec={exec} />
      )}

      <Modal open={!!detail} onOpenChange={(o) => !o && setOpen(null)} title={detail ? `Order ${detail.id}` : ""} wide>
        {detail && <OrderDetail o={detail} others={orders.filter((x) => x.customer.phone === detail.customer.phone && x.id !== detail.id)} act={act} exec={exec} team={team} onShip={() => setShip([detail.id])} onReject={() => setReject(detail)} onDeleted={() => setOpen(null)} />}
      </Modal>
      <Modal open={!!ship} onOpenChange={(o) => !o && setShip(null)} title={ship && ship.length > 1 ? `Ship ${ship.length} orders` : "Hand over to courier"}>
        {ship && <ShipForm ids={ship} exec={exec} pending={pending} onDone={() => setShip(null)} />}
      </Modal>
      <Modal open={!!reject} onOpenChange={(o) => !o && setReject(null)} title={reject ? `${reject.status === "pending" ? "Reject" : "Cancel"} ${reject.id}` : ""}>
        {reject && <RejectForm o={reject} exec={exec} pending={pending} onDone={() => setReject(null)} />}
      </Modal>
      <Modal open={quoting} onOpenChange={setQuoting} title="New quotation" wide>
        <NewQuote products={products} exec={exec} pending={pending} onDone={() => setQuoting(false)} />
      </Modal>
    </div>
  );
}

type Actions = {
  open: (id: string) => void;
  approve: (ids: string[]) => void;
  reject: (o: DashOrder) => void;
  advance: (o: DashOrder) => void;
  pending: boolean;
  isAdmin: boolean;
  who: (id?: string) => Member | undefined;
};

/** Kanban of live orders. Delivered shows the last 7 days. */
function Board({ orders, act }: { orders: DashOrder[]; act: Actions }) {
  const now = useNow();
  const week = now === null ? 0 : now - 7 * 86_400_000;
  return (
    <div className="-mx-3 overflow-x-auto px-3 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="grid min-w-[1060px] grid-cols-5 gap-2.5">
        {flow.map((st) => {
          const all = orders.filter((o) => o.status === st && (st !== "delivered" || Date.parse(o.history.at(-1)?.at ?? o.createdAt) > week));
          return (
            <section key={st} aria-label={statusLabel[st]} className={cn("flex min-w-0 flex-col rounded-[22px] p-2.5 ring-1", st === "pending" ? "bg-tile-butter/45 ring-tile-yellow/70" : "bg-white/70 ring-line")}>
              <header className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
                <span className={cn("grid size-7 place-items-center rounded-lg", st === "pending" ? "bg-tile-yellow text-tile-navy" : st === "delivered" ? "bg-tile-navy text-tile-yellow" : "bg-tile-sky text-tile-navy")}><Icon name={lane[st].icon} className="size-4" /></span>
                <span className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] leading-tight font-black text-ink">{statusLabel[st]}</h3>
                  <span className="block truncate text-[10.5px] font-bold text-subtle tabular-nums">{bdt(all.reduce((n, o) => n + o.total, 0))}</span>
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-tile-navy tabular-nums ring-1 ring-line">{all.length}</span>
              </header>
              {st === "pending" && act.isAdmin && all.length > 1 && (
                <Btn size="sm" tone="primary" className="mb-2" disabled={act.pending} onClick={() => act.approve(all.map((o) => o.id))}><Icon name="check-check" className="size-3.5" /> Approve all {all.length}</Btn>
              )}
              <ul className="flex max-h-[640px] flex-col gap-2 overflow-y-auto pr-0.5">
                {all.length === 0 && <li className="rounded-2xl border border-dashed border-line px-3 py-6 text-center text-[12px] font-semibold text-subtle">Nothing here</li>}
                {all.slice(0, 40).map((o) => <OrderCard key={o.id} o={o} act={act} now={now} />)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ o, act, now }: { o: DashOrder; act: Actions; now: number | null }) {
  const p = paid(o), pct = o.total ? Math.min(100, (p / o.total) * 100) : 0;
  const step = nextStep(o);
  const waited = now !== null && o.status === "pending" && now - Date.parse(o.createdAt) > 86_400_000;
  const handler = act.who(o.assignee);
  return (
    <li data-anim className="dash-rise group rounded-2xl bg-white p-3 shadow-[0_10px_24px_-20px_rgb(14_31_77/0.7)] ring-1 ring-line transition-[box-shadow,translate] hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgb(14_31_77/0.7)]">
      <div className="flex items-center gap-2">
        <button onClick={() => act.open(o.id)} className="truncate text-[12.5px] font-black text-tile-navy hover:underline">{o.id}</button>
        <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-black tabular-nums", waited ? "bg-tile-coral text-white" : "bg-soft text-subtle")} title="Time since the order came in">
          {age(o.createdAt, now)}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[13px] font-black text-ink">{o.customer.name}</p>
      <p className="truncate text-[11.5px] font-semibold text-subtle">{o.delivery.id === "pickup" ? "Store pickup" : o.delivery.city || o.delivery.label} · {o.lines.reduce((n, l) => n + l.qty, 0)} items</p>
      <div className="mt-2 flex items-center gap-2">
        <b className="text-[13px] text-ink tabular-nums">{bdt(o.total)}</b>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft"><span className={cn("block h-full rounded-full", pct >= 100 ? "bg-tile-navy" : "bg-tile-yellow")} style={{ width: `${pct}%` }} /></span>
      </div>
      {o.courier && <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] font-bold text-tile-navy"><Icon name="map-pin" className="size-3.5 text-brand" />{o.courier.name}{o.courier.tracking && ` · ${o.courier.tracking}`}</p>}
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-line/70 pt-2.5">
        {handler ? <span title={`Handled by ${handler.name}`}><Avatar name={handler.name} photo={handler.photo} size={24} /></span> : <span title="Unassigned" className="grid size-6 place-items-center rounded-full border border-dashed border-line text-[10px] font-black text-subtle">?</span>}
        <span className="ml-auto flex gap-1">
          {o.status === "pending" ? (
            act.isAdmin ? (
              <>
                <Btn size="icon" tone="danger" aria-label={`Reject ${o.id}`} disabled={act.pending} onClick={() => act.reject(o)}><X className="size-4" /></Btn>
                <Btn size="sm" tone="primary" disabled={act.pending} onClick={() => act.approve([o.id])}><Icon name="check" className="size-3.5" /> Approve</Btn>
              </>
            ) : (
              <span className="flex items-center gap-1 text-[10.5px] font-black text-tile-navy"><Icon name="hourglass" className="size-3.5" /> Owner approval</span>
            )
          ) : step ? (
            <Btn size="sm" tone={step.label === "Pack" ? "accent" : "primary"} disabled={act.pending} onClick={() => act.advance(o)}><Icon name={step.icon} className="size-3.5" /> {step.label}</Btn>
          ) : (
            <Pill tone={p >= o.total ? "delivered" : "pending"}>{p >= o.total ? "Paid" : `Due ${bdt(o.total - p)}`}</Pill>
          )}
        </span>
      </div>
    </li>
  );
}

function OrderList({ orders, act, exec, team, onShip, initial }: { orders: DashOrder[]; act: Actions; exec: Exec; team: Member[]; onShip: (ids: string[]) => void; initial: string | null }) {
  const [status, setStatus] = useState<OrderStatus | "all">((orderStatuses as readonly string[]).includes(initial ?? "") ? (initial as OrderStatus) : "all");
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const counts = useMemo(() => Object.fromEntries(orderStatuses.map((s) => [s, orders.filter((o) => o.status === s).length])), [orders]);
  const shown = orders.filter((o) => status === "all" || o.status === status);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const pg = Math.min(page, pages - 1);
  const rows = shown.slice(pg * PER_PAGE, pg * PER_PAGE + PER_PAGE);
  const allPicked = rows.length > 0 && rows.every((o) => picked.includes(o.id));
  const sel = orders.filter((o) => picked.includes(o.id));
  const movable = sel.filter((o) => nextStep(o));
  const toShip = movable.filter((o) => nextStep(o)?.ship);
  const done = () => setPicked([]);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", ...orderStatuses] as const).map((s) => (
          <button key={s} onClick={() => (setStatus(s), setPage(0))} className={cn("h-8 rounded-full px-3 text-[12px] font-black transition-colors", status === s ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>
            {s === "all" ? "All" : statusLabel[s]} <span className="tabular-nums opacity-70">{s === "all" ? orders.length : counts[s]}</span>
          </button>
        ))}
        {act.isAdmin && counts.cancelled > 0 && <ConfirmButton label={`Clear ${counts.cancelled} cancelled`} confirm="Clear cancelled" onConfirm={() => exec(() => clearCancelled(), "Cancelled orders cleared")} className="ml-auto" />}
      </div>

      {picked.length > 0 && (
        <div className="dash-rise mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-tile-navy px-3 py-2 text-[12.5px] font-bold text-white">
          <span className="px-1">{picked.length} selected</span>
          {act.isAdmin && sel.some((o) => o.status === "pending") && <Btn size="sm" tone="accent" disabled={act.pending} onClick={() => exec(() => approveOrders({ ids: sel.filter((o) => o.status === "pending").map((o) => o.id) }), "Approved").then((r) => r.ok && done())}><Icon name="check-check" className="size-3.5" /> Approve</Btn>}
          {movable.length > toShip.length && <Btn size="sm" tone="soft" disabled={act.pending} onClick={() => exec(() => advanceOrders({ ids: movable.filter((o) => !nextStep(o)?.ship).map((o) => o.id) }), "Moved one step on").then((r) => r.ok && done())}><Icon name="box" className="size-3.5" /> Next step · {movable.length - toShip.length}</Btn>}
          {toShip.length > 0 && <Btn size="sm" tone="soft" onClick={() => (onShip(toShip.map((o) => o.id)), done())}><Icon name="truck" className="size-3.5" /> Ship · {toShip.length}</Btn>}
          {act.isAdmin && (
            <select aria-label="Assign selected to" defaultValue="" onChange={(e) => e.target.value && exec(() => assignOrders({ ids: picked, assignee: e.target.value }), "Assigned").then((r) => r.ok && done())} className="h-8 rounded-xl bg-white/10 px-2 text-[12px] font-bold text-white ring-1 ring-white/20 outline-none [&>option]:text-ink">
              <option value="">Assign to…</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          {act.isAdmin && <ConfirmButton label="Delete" confirm={`Delete ${picked.length}`} onConfirm={() => exec(() => deleteOrders({ ids: picked }), "Orders deleted").then((r) => r.ok && done())} className="ml-auto" />}
          <Btn size="sm" tone="ghost" className={cn(!act.isAdmin && "ml-auto")} onClick={done}>Clear</Btn>
        </div>
      )}

      {shown.length === 0 ? (
        <Empty>No orders match.</Empty>
      ) : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[920px] text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-[11px] font-black tracking-wide text-subtle uppercase [&>th]:px-2 [&>th]:pb-2.5">
                <th className="w-8 !pl-0"><input type="checkbox" aria-label="Select all" checked={allPicked} onChange={() => setPicked(allPicked ? [] : rows.map((o) => o.id))} className="size-4 accent-[var(--color-tile-navy)]" /></th>
                <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Handled by</th><th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const p = paid(o), pct = o.total ? Math.min(100, (p / o.total) * 100) : 0;
                const step = nextStep(o);
                const h = act.who(o.assignee);
                return (
                  <tr key={o.id} className="border-b border-line/70 last:border-0 hover:bg-soft/50 [&>td]:px-2 [&>td]:py-3">
                    <td className="!pl-0"><input type="checkbox" aria-label={`Select ${o.id}`} checked={picked.includes(o.id)} onChange={() => setPicked((s) => (s.includes(o.id) ? s.filter((x) => x !== o.id) : [...s, o.id]))} className="size-4 accent-[var(--color-tile-navy)]" /></td>
                    <td><button onClick={() => act.open(o.id)} className="text-left font-black text-tile-navy hover:underline">{o.id}</button><span className="block text-[11px] font-semibold text-subtle">{date(o.createdAt, true)}</span></td>
                    <td><span className="flex items-center gap-2"><Avatar name={o.customer.name} size={28} /><span><b className="block text-ink">{o.customer.name}</b><span className="text-[11px] text-subtle">{o.customer.phone}</span></span></span></td>
                    <td className="max-w-44 truncate text-subtle" title={o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}>{o.lines.reduce((n, l) => n + l.qty, 0)} · {o.lines[0]?.name}</td>
                    <td className="font-black text-ink tabular-nums">{bdt(o.total)}</td>
                    <td className="min-w-28">
                      <span className="text-[11.5px] font-bold tabular-nums">{bdt(p)}</span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-soft"><span className={cn("block h-full rounded-full", pct >= 100 ? "bg-tile-navy" : "bg-tile-yellow")} style={{ width: `${pct}%` }} /></span>
                    </td>
                    <td><Pill tone={o.status}>{statusLabel[o.status]}</Pill></td>
                    <td>{h ? <span className="flex items-center gap-1.5 font-bold text-ink"><Avatar name={h.name} photo={h.photo} size={24} /><span className="max-w-24 truncate">{h.name.split(" ")[0]}</span></span> : <span className="text-subtle">—</span>}</td>
                    <td className="text-right">
                      <span className="inline-flex gap-1">
                        {o.status === "pending" && act.isAdmin ? (
                          <Btn size="sm" tone="primary" disabled={act.pending} onClick={() => act.approve([o.id])}><Icon name="check" className="size-3.5" /> Approve</Btn>
                        ) : step && o.status !== "pending" ? (
                          <Btn size="sm" tone={step.label === "Pack" ? "accent" : "primary"} disabled={act.pending} onClick={() => act.advance(o)}><Icon name={step.icon} className="size-3.5" /> {step.label}</Btn>
                        ) : null}
                        <Btn size="sm" tone="soft" onClick={() => act.open(o.id)}>Open</Btn>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center gap-1.5 text-[12.5px] font-bold text-subtle">
          <Btn size="sm" tone="soft" disabled={pg === 0} onClick={() => setPage(pg - 1)}><Icon name="chevron-left" className="size-3.5" /> Previous</Btn>
          <span className="px-2 tabular-nums">Page {pg + 1} of {pages} · {shown.length} orders</span>
          <Btn size="sm" tone="soft" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next <Icon name="chevron-right" className="size-3.5" /></Btn>
        </nav>
      )}
    </Card>
  );
}

function ShipForm({ ids, exec, pending, onDone }: { ids: string[]; exec: Exec; pending: boolean; onDone: () => void }) {
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await exec(() => advanceOrders({ ids, courier: String(f.get("courier")), tracking: String(f.get("tracking") ?? "").trim() || undefined }), ids.length > 1 ? `${ids.length} orders on the way` : "Parcel on the way");
        if (r.ok) onDone();
      }}
    >
      <Field label="Courier">
        <select name="courier" className={input} defaultValue="Pathao">{couriers.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      {ids.length === 1 && <Field label="Tracking / consignment number" hint="Shown to the customer on the Track order page."><input name="tracking" maxLength={40} className={input} placeholder="e.g. PTH-48210593" /></Field>}
      <div className="flex justify-end gap-2">
        <Btn onClick={onDone}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending}><Icon name="truck" className="size-4" /> Mark on the way</Btn>
      </div>
    </form>
  );
}

const reasons = ["Customer unreachable", "Out of stock", "Duplicate order", "Fake or test order", "Customer asked to cancel"];

function RejectForm({ o, exec, pending, onDone }: { o: DashOrder; exec: Exec; pending: boolean; onDone: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await exec(() => cancelOrder({ id: o.id, reason }), o.status === "pending" ? "Order rejected" : "Order cancelled");
        if (r.ok) onDone();
      }}
    >
      <div className="flex flex-wrap gap-1.5">
        {reasons.map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} className={cn("h-8 rounded-full px-3 text-[12px] font-bold", reason === r ? "bg-tile-navy text-tile-yellow" : "bg-soft text-ink hover:bg-tile-sky/60")}>{r}</button>
        ))}
      </div>
      <Field label="Reason"><textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={2} maxLength={200} className={textarea} /></Field>
      <div className="flex justify-end gap-2">
        <Btn onClick={onDone}>Keep order</Btn>
        <Btn type="submit" tone="danger" disabled={pending || reason.trim().length < 2}><Icon name="ban" className="size-4" /> {o.status === "pending" ? "Reject order" : "Cancel order"}</Btn>
      </div>
    </form>
  );
}

function OrderDetail({ o, others, act, exec, team, onShip, onReject, onDeleted }: { o: DashOrder; others: DashOrder[]; act: Actions; exec: Exec; team: Member[]; onShip: () => void; onReject: () => void; onDeleted: () => void }) {
  const p = paid(o), due = o.status === "cancelled" ? 0 : o.total - p;
  const step = nextStep(o);
  const at = (s: OrderStatus) => o.history.findLast((h) => h.status === s);
  const reachedIdx = flow.indexOf(o.status as (typeof flow)[number]);
  const wa = `https://wa.me/88${o.customer.phone.replace(/\D/g, "").replace(/^88/, "")}`;
  return (
    <div className="space-y-5">
      {/* Live tracking */}
      <ol className="relative grid grid-cols-5 gap-1 before:absolute before:top-[18px] before:right-[10%] before:left-[10%] before:h-0.5 before:bg-line">
        {flow.map((s, i) => {
          const h = at(s);
          const on = o.status !== "cancelled" && (i <= reachedIdx || !!h);
          return (
            <li key={s} className="relative text-center">
              <span className={cn("relative mx-auto grid size-9 place-items-center rounded-full ring-4 ring-white transition-colors", on ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle", o.status === s && "shadow-[0_0_0_6px_rgb(0_158_255/0.18)]")}>
                <Icon name={lane[s].icon} className="size-4" />
              </span>
              <span className="mt-1.5 block text-[11.5px] font-black text-ink">{statusLabel[s]}</span>
              {h && <span className="block text-[10.5px] font-semibold text-subtle">{date(h.at, true)}</span>}
            </li>
          );
        })}
      </ol>
      {o.status === "cancelled" && <p className="rounded-xl bg-tile-coral/10 px-3 py-2 text-[12.5px] font-bold text-sale">Cancelled{o.cancelReason && ` — ${o.cancelReason}`}</p>}

      {/* Next action */}
      {o.status !== "cancelled" && o.status !== "delivered" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-tile-navy p-3 text-white">
          <span className="px-1 text-[12.5px] font-bold text-white/80">{o.status === "pending" ? (act.isAdmin ? "New order — approve to start packing." : "Waiting for the owner's approval.") : `Next: ${step?.label}`}</span>
          <span className="ml-auto flex gap-2">
            {(act.isAdmin || o.status !== "pending") && <Btn size="sm" tone="danger" className="bg-white/10 text-white hover:bg-tile-coral" disabled={!act.isAdmin} title={act.isAdmin ? undefined : "Only the owner can cancel"} onClick={onReject}><Icon name="ban" className="size-3.5" /> {o.status === "pending" ? "Reject" : "Cancel"}</Btn>}
            {o.status === "pending" ? act.isAdmin && <Btn size="sm" tone="accent" disabled={act.pending} onClick={() => act.approve([o.id])}><Icon name="check" className="size-3.5" /> Approve</Btn> : step && <Btn size="sm" tone="accent" disabled={act.pending} onClick={() => (step.ship ? onShip() : act.advance(o))}><Icon name={step.icon} className="size-3.5" /> {step.label}</Btn>}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-soft p-4 text-[12.5px]">
          <p className="mb-1 text-[11px] font-black tracking-wide text-subtle uppercase">Customer</p>
          <p className="font-black text-ink">{o.customer.name}</p>
          <p className="text-subtle">{o.customer.phone}{o.customer.email && ` · ${o.customer.email}`}</p>
          <p className="mt-2 text-subtle">{o.delivery.label}{addr(o) && ` — ${addr(o)}`}</p>
          {o.note && <p className="mt-2 text-ink-2"><b>Customer note:</b> {o.note}</p>}
          <div className="mt-3 flex gap-1.5">
            <a href={`tel:${o.customer.phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 text-[12px] font-bold text-tile-navy ring-1 ring-line hover:bg-tile-sky/50"><Icon name="phone" className="size-3.5 text-brand" /> Call</a>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 text-[12px] font-bold text-tile-navy ring-1 ring-line hover:bg-tile-sky/50"><Icon name="message-circle" className="size-3.5 text-brand" /> WhatsApp</a>
          </div>
        </div>
        <div className="space-y-2 rounded-2xl bg-soft p-4 text-[12.5px]">
          <p className="text-[11px] font-black tracking-wide text-subtle uppercase">Handling</p>
          {act.isAdmin ? (
            <select aria-label="Handled by" value={o.assignee ?? ""} onChange={(e) => e.target.value && exec(() => assignOrders({ ids: [o.id], assignee: e.target.value }), "Assigned")} className={cn(input, "bg-white")}>
              <option value="">Unassigned</option>
              {team.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          ) : (
            <p className="font-bold text-ink">{act.who(o.assignee)?.name ?? "Unassigned"}</p>
          )}
          <p className="text-subtle">Source: <b className="text-ink capitalize">{o.source}</b> · Payment: <b className="text-ink">{o.payment}</b></p>
          {o.courier && <p className="flex items-center gap-1.5 font-bold text-tile-navy"><Icon name="map-pin" className="size-3.5 text-brand" /> {o.courier.name}{o.courier.tracking && ` · ${o.courier.tracking}`}</p>}
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
        {!!o.discount && <li className="flex justify-between px-4 py-2.5 text-[12.5px] text-subtle"><span>Discount</span><span className="tabular-nums">− {bdt(o.discount)}</span></li>}
        <li className="flex justify-between px-4 py-2.5 text-[12.5px] text-subtle"><span>Delivery</span><span className="tabular-nums">{bdt(o.delivery.fee)}</span></li>
        <li className="flex justify-between px-4 py-3 text-[14px] font-black text-ink"><span>Total</span><span className="tabular-nums">{bdt(o.total)}</span></li>
      </ul>

      <div className="rounded-2xl bg-tile-sky/40 p-4">
        <p className="text-[12.5px] font-bold text-tile-navy">Paid <b className="tabular-nums">{bdt(p)}</b> · Due <b className="tabular-nums">{bdt(due)}</b></p>
        {o.payments.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {o.payments.map((x, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-[12px]">
                <Icon name="receipt-text" className="size-4 text-brand" />
                <span className="flex-1 font-bold text-ink">{bdt(x.amount)} <span className="font-semibold text-subtle">· {x.method} · {date(x.at, true)}</span></span>
                <button onClick={() => receiptPdf(o, i)} className="font-black text-brand hover:underline">Receipt</button>
              </li>
            ))}
          </ul>
        )}
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
            <Btn type="submit" tone="primary" disabled={act.pending}><Icon name="circle-dollar-sign" className="size-4" /> Record payment</Btn>
          </form>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => invoicePdf(o)}><Icon name="file-text" className="size-4 text-brand" /> Invoice</Btn>
        {o.payments.length > 0 && <Btn onClick={() => receiptPdf(o)}><Icon name="receipt-text" className="size-4 text-brand" /> Receipt</Btn>}
        {o.status !== "cancelled" && o.delivery.id !== "pickup" && <Btn onClick={() => challanPdf(o)}><Icon name="truck" className="size-4 text-brand" /> Delivery challan</Btn>}
        {o.customer.email && (
          <a href={mailto(o.customer.email, `Your Makerbangla order ${o.id}`, `Hi ${o.customer.name},\n\nThank you for your order ${o.id}.\nTotal: ${bdt(o.total)} · Paid: ${bdt(p)} · Due: ${bdt(due)}\nStatus: ${statusLabel[o.status]}${o.courier ? `\nCourier: ${o.courier.name}${o.courier.tracking ? ` (${o.courier.tracking})` : ""}` : ""}\n\nTrack it any time at makerbangla.com/track\n\n— Makerbangla`)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-tile-navy ring-1 ring-line hover:bg-soft">
            <Icon name="mail-check" className="size-4 text-brand" /> Email customer
          </a>
        )}
        {act.isAdmin && <ConfirmButton label="Delete" onConfirm={() => exec(() => deleteOrders({ ids: [o.id] }), "Order deleted").then((r) => r.ok && onDeleted())} className="ml-auto h-10" />}
      </div>

      {/* Internal notes + timeline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl p-4 ring-1 ring-line">
          <p className="mb-2 text-[11px] font-black tracking-wide text-subtle uppercase">Team notes</p>
          <ul className="max-h-40 space-y-2 overflow-y-auto text-[12.5px]">
            {!o.notes?.length && <li className="text-subtle">No notes yet. Only the team sees these.</li>}
            {o.notes?.map((n, i) => <li key={i} className="rounded-xl bg-soft px-3 py-2"><span className="text-ink">{n.text}</span><span className="block text-[11px] text-subtle">{n.by} · {date(n.at, true)}</span></li>)}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const text = String(new FormData(form).get("text") ?? "").trim();
              if (text && (await exec(() => addOrderNote({ id: o.id, text }))).ok) form.reset();
            }}
          >
            <input name="text" maxLength={300} placeholder="Add a note for the team" aria-label="Note" className={input} />
            <Btn type="submit" tone="primary" size="icon" className="size-10" aria-label="Add note" disabled={act.pending}><Icon name="send" className="size-4" /></Btn>
          </form>
        </div>
        <div className="rounded-2xl p-4 ring-1 ring-line">
          <p className="mb-2 text-[11px] font-black tracking-wide text-subtle uppercase">Timeline</p>
          <ul className="max-h-52 space-y-1.5 overflow-y-auto text-[12.5px]">
            {o.history.map((h, i) => (
              <li key={i} className="flex justify-between gap-2"><span className="min-w-0 font-bold text-ink">{statusLabel[h.status]} <span className="font-semibold text-subtle">· {h.by}{h.note && ` · ${h.note}`}</span></span><span className="shrink-0 text-subtle">{date(h.at, true)}</span></li>
            ))}
          </ul>
        </div>
      </div>

      {others.length > 0 && (
        <div className="rounded-2xl ring-1 ring-line">
          <p className="border-b border-line px-4 py-2.5 text-[11px] font-black tracking-wide text-subtle uppercase">
            {o.customer.name}&apos;s other orders · {others.length} · {bdt(others.filter((x) => x.status !== "cancelled").reduce((n, x) => n + x.total, 0))}
          </p>
          <ul className="max-h-48 divide-y divide-line overflow-y-auto">
            {others.map((x) => (
              <li key={x.id}>
                <button onClick={() => act.open(x.id)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-[12.5px] hover:bg-soft">
                  <b className="text-tile-navy">{x.id}</b>
                  <span className="text-subtle">{date(x.createdAt)}</span>
                  <span className="ml-auto font-bold tabular-nums">{bdt(x.total)}</span>
                  <Pill tone={x.status}>{statusLabel[x.status]}</Pill>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Every step of every order (and every payment), newest first. */
function OrderHistory({ orders, onOpen }: { orders: DashOrder[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "status" | "payment">("all");
  const [page, setPage] = useState(0);
  const events = useMemo(
    () =>
      orders
        .flatMap((o) => [
          ...o.history.map((h) => ({ at: h.at, o, kind: "status" as const, status: h.status, text: statusLabel[h.status], by: h.by, amount: 0 })),
          ...o.payments.map((p) => ({ at: p.at, o, kind: "payment" as const, status: undefined, text: p.method, by: "", amount: p.amount })),
        ])
        .sort((a, b) => b.at.localeCompare(a.at)),
    [orders],
  );
  const s = q.trim().toLowerCase();
  const shown = events.filter((e) => (kind === "all" || e.kind === kind) && (!s || `${e.o.id} ${e.o.customer.name} ${e.o.customer.phone}`.toLowerCase().includes(s)));
  const pages = Math.max(1, Math.ceil(shown.length / 30));
  const pg = Math.min(page, pages - 1);
  return (
    <Card
      icon="history"
      title="Order history"
      action={
        <Btn size="sm" onClick={() => download("order-history.csv", toCsv([["When", "Order", "Customer", "Phone", "Event", "Amount", "By"], ...shown.map((e) => [e.at, e.o.id, e.o.customer.name, e.o.customer.phone, e.kind === "payment" ? `Payment (${e.text})` : e.text, e.amount || "", e.by])]))}>
          <Icon name="download" className="size-3.5 text-brand" /> CSV
        </Btn>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {([["all", "Everything"], ["status", "Status changes"], ["payment", "Payments"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => (setKind(k), setPage(0))} className={cn("h-8 rounded-full px-3 text-[12px] font-black", kind === k ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>{l}</button>
        ))}
        <label className="relative ml-auto w-full sm:w-72">
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
          <input value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} placeholder="Order, customer or phone" aria-label="Search history" className={cn(input, "pl-9")} />
        </label>
      </div>
      {shown.length === 0 ? (
        <Empty>Nothing matches.</Empty>
      ) : (
        <ol className="relative space-y-1 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-line">
          {shown.slice(pg * 30, pg * 30 + 30).map((e, i) => (
            <li key={i}>
              <button onClick={() => onOpen(e.o.id)} className="relative flex w-full items-center gap-3 rounded-xl py-2 pr-2 pl-0 text-left hover:bg-soft">
                <span className={cn("relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-white", e.kind === "payment" ? "bg-tile-yellow text-tile-navy" : e.status === "cancelled" ? "bg-tile-coral text-white" : "bg-tile-navy text-tile-yellow")}>
                  <Icon name={e.kind === "payment" ? "circle-dollar-sign" : e.status === "cancelled" ? "ban" : lane[e.status as (typeof flow)[number]].icon} className="size-4" />
                </span>
                <span className="min-w-0 flex-1 text-[12.5px]">
                  <b className="text-ink">{e.kind === "payment" ? `${bdt(e.amount)} received` : e.text}</b>
                  <span className="text-subtle"> · {e.o.id} · {e.o.customer.name}{e.kind === "payment" ? ` · ${e.text}` : e.by ? ` · by ${e.by}` : ""}</span>
                </span>
                <span className="shrink-0 text-[11.5px] font-semibold text-subtle">{date(e.at, true)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center gap-1.5 text-[12.5px] font-bold text-subtle">
          <Btn size="sm" tone="soft" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Newer</Btn>
          <span className="px-2 tabular-nums">Page {pg + 1} of {pages} · {shown.length} events</span>
          <Btn size="sm" tone="soft" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Older</Btn>
        </nav>
      )}
    </Card>
  );
}

function NewQuote({ products, exec, pending, onDone }: { products: PickProduct[]; exec: Exec; pending: boolean; onDone: () => void }) {
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
              <Btn size="sm" onClick={() => documentPdf({ kind: "Quotation", ref: q.id, date: q.createdAt, customer: q.customer, lines: q.lines, note: q.note })}><Icon name="file-text" className="size-3.5 text-brand" /> PDF</Btn>
              {q.customer.email && <a href={mailto(q.customer.email, `Quotation ${q.id} from Makerbangla`, `Dear ${q.customer.name},\n\nPlease find our quotation ${q.id} attached. Total: ${bdt(total)}.\n\n— Makerbangla`)} className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white px-2.5 text-[12px] font-bold text-tile-navy ring-1 ring-line hover:bg-soft"><Icon name="mail-check" className="size-3.5 text-brand" /> Email</a>}
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
