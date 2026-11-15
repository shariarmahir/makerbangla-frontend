import { connection } from "next/server";
import type { DashOrder, DayVisits, Db } from "./types";

/** Pure aggregations for dashboard charts and KPIs. All dates are bucketed in Dhaka time (UTC+6). */

const DHAKA = 6 * 3_600_000;
export const DAY = 86_400_000;
export const dayKey = (ms: number) => new Date(ms + DHAKA).toISOString().slice(0, 10);
export const monthKey = (ms: number) => dayKey(ms).slice(0, 7);
const at = (iso: string) => Date.parse(iso);

export const paidOf = (o: DashOrder) => o.payments.reduce((n, p) => n + p.amount, 0);
export const dueOf = (o: DashOrder) => (o.status === "cancelled" ? 0 : Math.max(0, o.total - paidOf(o)));
const live = (o: DashOrder) => o.status !== "cancelled";

/** Request time for dashboard pages (they render per request, never at build time). */
export async function requestNow() {
  await connection();
  return Date.now();
}

export const delta = (cur: number, prev: number) => (prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0);

/** Last `n` months, oldest first, with short labels ("Nov"). */
export function months(now: number, n = 12) {
  const d = new Date(now + DHAKA);
  return Array.from({ length: n }, (_, i) => {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (n - 1 - i), 1));
    return { key: m.toISOString().slice(0, 7), label: m.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }) };
  });
}

/** Sales (order value), collected cash, expenses and profit per month. */
export function monthly(db: Db, now: number, n = 12) {
  const ms = months(now, n);
  const idx = new Map(ms.map((m, i) => [m.key, i]));
  const z = () => ms.map(() => 0);
  const sales = z(), collected = z(), expenses = z(), orders = z();
  for (const o of db.orders) {
    const i = idx.get(monthKey(at(o.createdAt)));
    if (i !== undefined && live(o)) {
      sales[i] += o.total;
      orders[i]++;
    }
    for (const p of o.payments) {
      const j = idx.get(monthKey(at(p.at)));
      if (j !== undefined) collected[j] += p.amount;
    }
  }
  for (const e of db.expenses) {
    const i = idx.get(e.date.slice(0, 7));
    if (i !== undefined) expenses[i] += e.amount;
  }
  return { labels: ms.map((m) => m.label), keys: ms.map((m) => m.key), sales, collected, expenses, orders, profit: collected.map((c, i) => c - expenses[i]) };
}

/** Totals for a time window [from, to). */
export function totals(db: Db, from: number, to: number) {
  const inRange = (t: number) => t >= from && t < to;
  const os = db.orders.filter((o) => inRange(at(o.createdAt)));
  const collected = db.orders.flatMap((o) => o.payments).filter((p) => inRange(at(p.at))).reduce((n, p) => n + p.amount, 0);
  const expenses = db.expenses.filter((e) => inRange(at(`${e.date}T00:00:00+06:00`))).reduce((n, e) => n + e.amount, 0);
  const sales = os.filter(live).reduce((n, o) => n + o.total, 0);
  return { orders: os.filter(live).length, cancelled: os.length - os.filter(live).length, sales, collected, expenses, profit: collected - expenses, avg: os.filter(live).length ? Math.round(sales / os.filter(live).length) : 0 };
}

/** Real visits plus sample visits (until sample data is cleared). */
export function visits(db: Db): Record<string, DayVisits> {
  const out: Record<string, DayVisits> = structuredClone(db.sampleVisits);
  for (const [k, v] of Object.entries(db.visits)) {
    const t = (out[k] ??= { views: 0, visits: 0, returning: 0, sources: {}, countries: {} });
    t.views += v.views;
    t.visits += v.visits;
    t.returning += v.returning;
    for (const [s, n] of Object.entries(v.sources)) t.sources[s] = (t.sources[s] ?? 0) + n;
    for (const [c, n] of Object.entries(v.countries)) t.countries[c] = (t.countries[c] ?? 0) + n;
  }
  return out;
}

export function traffic(db: Db, now: number, days = 30) {
  const all = visits(db);
  const keys = Array.from({ length: days }, (_, i) => dayKey(now - (days - 1 - i) * DAY));
  const rows = keys.map((k) => all[k] ?? { views: 0, visits: 0, returning: 0, sources: {}, countries: {} });
  const sum = (f: (d: DayVisits) => number) => rows.reduce((n, d) => n + f(d), 0);
  const merge = (pick: (d: DayVisits) => Record<string, number>) => {
    const m: Record<string, number> = {};
    rows.forEach((d) => Object.entries(pick(d)).forEach(([k, v]) => (m[k] = (m[k] ?? 0) + v)));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const prevRows = Array.from({ length: days }, (_, i) => all[dayKey(now - (2 * days - 1 - i) * DAY)]?.visits ?? 0);
  return {
    labels: keys.map((k) => `${Number(k.slice(8))} ${new Date(`${k}T00:00:00Z`).toLocaleString("en-GB", { month: "short", timeZone: "UTC" })}`),
    visits: rows.map((d) => d.visits),
    views: rows.map((d) => d.views),
    totalVisits: sum((d) => d.visits),
    totalViews: sum((d) => d.views),
    returning: sum((d) => d.returning),
    prevVisits: prevRows.reduce((a, b) => a + b, 0),
    sources: merge((d) => d.sources),
    countries: merge((d) => d.countries),
  };
}

export function topProducts(db: Db, from: number, n = 6) {
  const m = new Map<string, { name: string; qty: number; value: number }>();
  for (const o of db.orders) {
    if (!live(o) || at(o.createdAt) < from) continue;
    for (const l of o.lines) {
      const r = m.get(l.slug) ?? { name: l.name, qty: 0, value: 0 };
      r.qty += l.qty;
      r.value += l.qty * l.price;
      m.set(l.slug, r);
    }
  }
  return [...m.values()].sort((a, b) => b.value - a.value).slice(0, n);
}

export function categorySales(db: Db, from: number) {
  const cat = new Map(db.products.map((p) => [p.slug, p.category]));
  const m = new Map<string, number>();
  for (const o of db.orders) {
    if (!live(o) || at(o.createdAt) < from) continue;
    for (const l of o.lines) {
      const c = cat.get(l.slug) ?? "other";
      m.set(c, (m.get(c) ?? 0) + l.qty * l.price);
    }
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function bySource(db: Db, from: number) {
  const m = new Map<string, { orders: number; value: number }>();
  for (const o of db.orders) {
    if (!live(o) || at(o.createdAt) < from) continue;
    const r = m.get(o.source) ?? { orders: 0, value: 0 };
    r.orders++;
    r.value += o.total;
    m.set(o.source, r);
  }
  return [...m.entries()].sort((a, b) => b[1].value - a[1].value);
}

export function customers(db: Db) {
  const m = new Map<string, { name: string; phone: string; email?: string; orders: number; spend: number; last: string; city?: string }>();
  for (const o of db.orders) {
    if (!live(o)) continue;
    const r = m.get(o.customer.phone) ?? { name: o.customer.name, phone: o.customer.phone, email: o.customer.email, orders: 0, spend: 0, last: o.createdAt, city: o.delivery.city };
    r.orders++;
    r.spend += o.total;
    if (o.createdAt > r.last) r.last = o.createdAt;
    m.set(o.customer.phone, r);
  }
  return [...m.values()].sort((a, b) => b.spend - a.spend);
}

/** Latest contact details per phone number, for autofilling order and invoice forms. */
export function knownCustomers(db: Db) {
  const m = new Map<string, { name: string; phone: string; email?: string; city?: string; address?: string }>();
  for (const o of [...db.orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    m.set(o.customer.phone, { name: o.customer.name, phone: o.customer.phone, email: o.customer.email, city: o.delivery.city, address: o.delivery.address });
  }
  return [...m.values()];
}

export const sourceLabel = (s: string) =>
  ({ facebook: "Facebook", youtube: "YouTube", google: "Google", instagram: "Instagram", whatsapp: "WhatsApp", website: "Website", direct: "Direct", referral: "Referral", phone: "Phone", "walk-in": "Walk-in", other: "Other" })[s] ?? s;
