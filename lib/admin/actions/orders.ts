"use server";

import { z } from "zod";
import { normalizeBdPhone } from "@/lib/order";
import { deliveryOptions } from "@/lib/site";
import { idOf, money, run, str, UserError } from "../action";
import { log, mutate } from "../db";
import type { DashOrder } from "../types";

const flow = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;
const byId = (db: { orders: DashOrder[] }, id: string) => {
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new UserError("That order no longer exists.");
  return o;
};

/** One click: move an order to its next step (pending → confirmed → packed → shipped → delivered). */
export async function advanceOrder(input: { id: string }) {
  return run("orders", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      const o = byId(db, id);
      if (o.status === "cancelled") throw new UserError("This order was cancelled.");
      const next = flow[flow.indexOf(o.status as (typeof flow)[number]) + 1];
      if (!next) throw new UserError("This order is already complete.");
      o.status = next;
      o.history.push({ status: next, at: new Date().toISOString(), by: user.name });
      // Cash on delivery: delivering settles whatever is still due.
      const paid = o.payments.reduce((n, p) => n + p.amount, 0);
      if (next === "delivered" && paid < o.total) o.payments.push({ amount: o.total - paid, method: "Cash on delivery", at: new Date().toISOString() });
      log(db, user.name, `marked ${o.id} as ${next}`);
      return next;
    }),
  );
}

/** Cancels an open order (delivered orders stay delivered — record a refund as an expense instead). */
export async function cancelOrder(input: { id: string }) {
  return run("orders", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      const o = byId(db, id);
      if (o.status === "delivered" || o.status === "cancelled") throw new UserError(`This order is already ${o.status}.`);
      const status = "cancelled" as const;
      o.status = status;
      o.history.push({ status, at: new Date().toISOString(), by: user.name });
      log(db, user.name, `set ${o.id} to ${status}`);
      return null;
    }),
  );
}

export async function addPayment(input: { id: string; amount: number; method: string }) {
  return run("orders", z.object({ id: idOf, amount: money.min(1, "Enter an amount."), method: str(40, 1, "Method") }), input, ({ id, amount, method }, user) =>
    mutate((db) => {
      const o = byId(db, id);
      const due = o.total - o.payments.reduce((n, p) => n + p.amount, 0);
      if (amount > due) throw new UserError(`Only BDT ${due.toLocaleString("en-IN")} is due on this order.`);
      o.payments.push({ amount, method, at: new Date().toISOString() });
      log(db, user.name, `recorded BDT ${amount.toLocaleString("en-IN")} (${method}) on ${o.id}`);
      return null;
    }),
  );
}

/** Deleting changes the books, so only the super admin can do it. */
export async function deleteOrders(input: { ids: string[] }) {
  return run("admin", z.object({ ids: z.array(idOf).min(1).max(500) }), input, ({ ids }, user) =>
    mutate((db) => {
      const before = db.orders.length;
      db.orders = db.orders.filter((o) => !ids.includes(o.id));
      log(db, user.name, `deleted ${before - db.orders.length} order(s)`);
      return null;
    }),
  );
}

export async function clearCancelled() {
  return run("admin", z.null(), null, (_, user) =>
    mutate((db) => {
      const n = db.orders.filter((o) => o.status === "cancelled").length;
      db.orders = db.orders.filter((o) => o.status !== "cancelled");
      log(db, user.name, `cleared ${n} cancelled order(s)`);
      return n;
    }),
  );
}

const newOrder = z.object({
  name: str(80, 2, "Customer name"),
  phone: z.string().transform((s, ctx) => normalizeBdPhone(s) ?? (ctx.addIssue({ code: "custom", message: "Enter a valid Bangladeshi mobile number." }), z.NEVER)),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]).optional(),
  delivery: z.enum(deliveryOptions.map((d) => d.id) as [string, ...string[]]),
  address: str(200).optional(),
  city: str(60).optional(),
  source: z.enum(["phone", "whatsapp", "facebook", "walk-in", "website"]),
  note: str(300).optional(),
  lines: z.array(z.object({ name: str(120, 1, "Item"), sku: str(40), slug: str(80), qty: z.coerce.number().int().min(1).max(999), price: money })).min(1, "Add at least one item.").max(50),
});

/** Manual order (phone, WhatsApp, Facebook or walk-in). */
export async function createOrder(input: unknown) {
  return run("orders", newOrder, input, (d, user) =>
    mutate((db) => {
      const delivery = deliveryOptions.find((x) => x.id === d.delivery)!;
      const subtotal = d.lines.reduce((n, l) => n + l.price * l.qty, 0);
      const now = new Date();
      const id = `MB-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
      db.orders.unshift({
        id, createdAt: now.toISOString(),
        customer: { name: d.name, phone: d.phone, ...(d.email ? { email: d.email } : {}) },
        delivery: { id: delivery.id, label: delivery.label, fee: delivery.fee, ...(delivery.id === "pickup" ? {} : { address: d.address, city: d.city }) },
        payment: delivery.id === "pickup" ? "Pay at pickup" : "Cash on delivery",
        ...(d.note ? { note: d.note } : {}),
        lines: d.lines, subtotal, total: subtotal + delivery.fee, demo: false,
        status: "confirmed", payments: [], source: d.source,
        history: [{ status: "confirmed", at: now.toISOString(), by: user.name }],
      });
      log(db, user.name, `created order ${id}`);
      return id;
    }),
  );
}

// ——— Quotations ———
const quoteSchema = z.object({
  name: str(80, 2, "Customer name"),
  phone: str(20, 6, "Phone"),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]).optional(),
  note: str(400).optional(),
  lines: z.array(z.object({ name: str(120, 1, "Item"), qty: z.coerce.number().int().min(1).max(9999), price: money })).min(1, "Add at least one line.").max(60),
});

export async function createQuote(input: unknown) {
  return run("orders", quoteSchema, input, (d, user) =>
    mutate((db) => {
      const n = Math.max(1000, ...db.quotes.map((q) => Number(q.id.slice(2)) || 0)) + 1;
      const id = `Q-${n}`;
      db.quotes.unshift({ id, createdAt: new Date().toISOString(), customer: { name: d.name, phone: d.phone, ...(d.email ? { email: d.email } : {}) }, lines: d.lines, status: "draft", ...(d.note ? { note: d.note } : {}) });
      log(db, user.name, `created quotation ${id}`);
      return id;
    }),
  );
}

export async function setQuoteStatus(input: { id: string; status: string }) {
  return run("orders", z.object({ id: idOf, status: z.enum(["draft", "sent", "accepted"]) }), input, ({ id, status }, user) =>
    mutate((db) => {
      const q = db.quotes.find((x) => x.id === id);
      if (!q) throw new UserError("That quotation no longer exists.");
      q.status = status;
      log(db, user.name, `marked quotation ${id} as ${status}`);
      return null;
    }),
  );
}

export async function deleteQuote(input: { id: string }) {
  return run("orders", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      db.quotes = db.quotes.filter((q) => q.id !== id);
      log(db, user.name, `deleted quotation ${id}`);
      return null;
    }),
  );
}
