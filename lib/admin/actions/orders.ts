"use server";

import { z } from "zod";
import { normalizeBdPhone } from "@/lib/order";
import { deliveryOptions } from "@/lib/site";
import { idOf, money, run, str, UserError } from "../action";
import { log, mutate } from "../db";
import { couriers, type DashOrder, type OrderStatus } from "../types";

const byId = (db: { orders: DashOrder[] }, id: string) => {
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new UserError("That order no longer exists.");
  return o;
};
const ids = z.array(idOf).min(1).max(500);
const stamp = (o: DashOrder, status: OrderStatus, by: string, note?: string) => {
  o.status = status;
  o.history.push({ status, at: new Date().toISOString(), by, ...(note ? { note } : {}) });
};
/** Next step after approval. Pickup orders skip "on the way": packed → handed over. */
const nextOf = (o: DashOrder): OrderStatus | null =>
  o.status === "confirmed" ? "packed" : o.status === "packed" ? (o.delivery.id === "pickup" ? "delivered" : "shipped") : o.status === "shipped" ? "delivered" : null;

/** Owner approval: new orders become "Approved" and go to the team member with the fewest open orders. */
export async function approveOrders(input: { ids: string[] }) {
  return run("admin", z.object({ ids }), input, ({ ids }, user) =>
    mutate((db) => {
      const staff = db.employees.filter((e) => e.active && e.access.includes("orders"));
      const load = (id: string) => db.orders.filter((o) => o.assignee === id && ["confirmed", "packed", "shipped"].includes(o.status)).length;
      let n = 0;
      for (const id of ids) {
        const o = db.orders.find((x) => x.id === id);
        if (!o || o.status !== "pending") continue;
        stamp(o, "confirmed", user.name);
        o.assignee ??= staff.length ? staff.reduce((a, b) => (load(b.id) < load(a.id) ? b : a)).id : "admin";
        n++;
      }
      if (!n) throw new UserError("Nothing to approve — those orders were already handled.");
      log(db, user.name, `approved ${n} order${n > 1 ? "s" : ""}`);
      return n;
    }),
  );
}

/** Owner decision: reject a new order, or cancel an open one, with a reason the team can see. */
export async function cancelOrder(input: { id: string; reason: string }) {
  return run("admin", z.object({ id: idOf, reason: str(200, 2, "Reason") }), input, ({ id, reason }, user) =>
    mutate((db) => {
      const o = byId(db, id);
      if (o.status === "delivered" || o.status === "cancelled") throw new UserError(`This order is already ${o.status}.`);
      const verb = o.status === "pending" ? "rejected" : "cancelled";
      o.cancelReason = reason;
      stamp(o, "cancelled", user.name, reason);
      log(db, user.name, `${verb} ${o.id}`);
      return null;
    }),
  );
}

/** One click: move approved orders one step on (packed → on the way → delivered). Shipping needs a courier. */
export async function advanceOrders(input: { ids: string[]; courier?: string; tracking?: string }) {
  const schema = z.object({ ids, courier: z.enum(couriers).optional(), tracking: str(40).optional() });
  return run("orders", schema, input, ({ ids, courier, tracking }, user) =>
    mutate((db) => {
      let n = 0;
      for (const id of ids) {
        const o = byId(db, id);
        if (o.status === "pending") throw new UserError(`${o.id} is waiting for the owner's approval.`);
        const next = nextOf(o);
        if (!next) continue;
        if (next === "shipped") {
          if (!courier) throw new UserError("Choose the courier that's taking the parcel.");
          o.courier = { name: courier, ...(tracking && ids.length === 1 ? { tracking } : {}) };
        }
        stamp(o, next, user.name, next === "shipped" ? `${courier}${o.courier?.tracking ? ` · ${o.courier.tracking}` : ""}` : undefined);
        // Cash on delivery: delivering settles whatever is still due.
        const paid = o.payments.reduce((m, p) => m + p.amount, 0);
        if (next === "delivered" && paid < o.total) o.payments.push({ amount: o.total - paid, method: o.delivery.id === "pickup" ? "Cash at pickup" : "Cash on delivery", at: new Date().toISOString() });
        n++;
      }
      if (!n) throw new UserError("Those orders are already complete.");
      log(db, user.name, n === 1 ? `moved ${ids[0]} to ${db.orders.find((o) => o.id === ids[0])?.status}` : `moved ${n} orders one step on`);
      return n;
    }),
  );
}

/** Owner: hand orders to a team member. */
export async function assignOrders(input: { ids: string[]; assignee: string }) {
  return run("admin", z.object({ ids, assignee: idOf }), input, ({ ids, assignee }, user) =>
    mutate((db) => {
      const e = db.employees.find((x) => x.id === assignee && x.active && x.access.includes("orders"));
      if (assignee !== "admin" && !e) throw new UserError("Pick a team member who has access to orders.");
      for (const id of ids) byId(db, id).assignee = assignee;
      log(db, user.name, `assigned ${ids.length} order${ids.length > 1 ? "s" : ""} to ${e?.name ?? "themself"}`);
      return null;
    }),
  );
}

export async function addOrderNote(input: { id: string; text: string }) {
  return run("orders", z.object({ id: idOf, text: str(300, 1, "Note") }), input, ({ id, text }, user) =>
    mutate((db) => {
      const o = byId(db, id);
      (o.notes ??= []).push({ at: new Date().toISOString(), by: user.name, text });
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
  discount: z.union([z.literal(""), money]).optional().transform((v) => (v === "" || v === undefined ? 0 : v)),
  /** Invoice mode: money taken now and whether the goods were handed over. */
  paidNow: z.union([z.literal(""), money]).optional().transform((v) => (v === "" || v === undefined ? 0 : v)),
  method: str(40).optional(),
  handedOver: z.boolean().optional(),
});

/** Manual order or invoice (phone, WhatsApp, Facebook, walk-in): optional discount, payment taken now, hand-over. */
export async function createOrder(input: unknown) {
  return run("orders", newOrder, input, (d, user) =>
    mutate((db) => {
      const delivery = deliveryOptions.find((x) => x.id === d.delivery)!;
      const subtotal = d.lines.reduce((n, l) => n + l.price * l.qty, 0);
      if (d.discount > subtotal) throw new UserError("The discount can't be more than the items total.");
      const total = subtotal - d.discount + delivery.fee;
      if (d.paidNow > total) throw new UserError("The payment is more than the invoice total.");
      const now = new Date();
      const at = now.toISOString();
      const status: OrderStatus = d.handedOver ? "delivered" : "confirmed";
      const id = `MB-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`;
      db.orders.unshift({
        id, createdAt: now.toISOString(),
        customer: { name: d.name, phone: d.phone, ...(d.email ? { email: d.email } : {}) },
        delivery: { id: delivery.id, label: delivery.label, fee: delivery.fee, ...(delivery.id === "pickup" ? {} : { address: d.address, city: d.city }) },
        payment: delivery.id === "pickup" ? "Pay at pickup" : "Cash on delivery",
        ...(d.note ? { note: d.note } : {}),
        lines: d.lines, subtotal, total, demo: false,
        ...(d.discount ? { discount: d.discount } : {}),
        status, source: d.source,
        payments: d.paidNow ? [{ amount: d.paidNow, method: d.method || "Cash", at }] : [],
        history: [{ status: "confirmed" as const, at, by: user.name }, ...(status === "delivered" ? [{ status, at, by: user.name }] : [])],
      });
      log(db, user.name, `created ${d.handedOver || d.paidNow ? "invoice" : "order"} ${id}`);
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
