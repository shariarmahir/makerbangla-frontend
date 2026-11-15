import { documentPdf } from "@/lib/admin/pdf";
import type { DashOrder } from "@/lib/admin/types";

/** Document numbers and PDFs derived from an order: invoice, payment receipts and delivery challan. */

const core = (o: DashOrder) => o.id.replace(/^MB-/, "");
export const invoiceNo = (o: DashOrder) => `INV-${core(o)}`;
export const receiptNo = (o: DashOrder, i: number) => `RCT-${core(o)}-${i + 1}`;
export const challanNo = (o: DashOrder) => `DC-${core(o)}`;

export const paidOf = (o: DashOrder) => o.payments.reduce((n, p) => n + p.amount, 0);
export const dueOf = (o: DashOrder) => (o.status === "cancelled" ? 0 : Math.max(0, o.total - paidOf(o)));
export const addressOf = (o: DashOrder) => [o.delivery.address, o.delivery.area, o.delivery.city].filter(Boolean).join(", ");

export type PayState = "paid" | "partial" | "unpaid" | "void";
export const payState = (o: DashOrder): PayState => (o.status === "cancelled" ? "void" : paidOf(o) >= o.total ? "paid" : paidOf(o) > 0 ? "partial" : "unpaid");

const base = (o: DashOrder) => ({
  orderRef: o.id,
  customer: o.customer,
  address: addressOf(o),
  lines: o.lines,
  delivery: { label: o.delivery.label, fee: o.delivery.fee },
  discount: o.discount,
  note: o.note,
});

export const invoicePdf = (o: DashOrder) => documentPdf({ ...base(o), kind: "Invoice", ref: invoiceNo(o), date: o.createdAt, paid: paidOf(o) });

/** Receipt for one payment (index), or for everything paid so far when no index is given. */
export function receiptPdf(o: DashOrder, i?: number) {
  if (i === undefined) return documentPdf({ ...base(o), kind: "Receipt", ref: `RCT-${core(o)}`, date: o.payments.at(-1)?.at ?? o.createdAt, paid: paidOf(o) });
  const p = o.payments[i];
  const paidBefore = o.payments.slice(0, i).reduce((n, x) => n + x.amount, 0);
  return documentPdf({ ...base(o), kind: "Receipt", ref: receiptNo(o, i), date: p.at, payment: { ...p, paidBefore } });
}

export const challanPdf = (o: DashOrder) => documentPdf({ ...base(o), kind: "Delivery Challan", ref: challanNo(o), date: o.history.find((h) => h.status === "shipped" || h.status === "packed")?.at ?? o.createdAt });
