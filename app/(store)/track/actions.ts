"use server";

import { headers } from "next/headers";
import { readDb } from "@/lib/admin/db";
import { statusLabel, type OrderStatus } from "@/lib/admin/types";
import { normalizeBdPhone } from "@/lib/order";
import { clientIp, limiter } from "@/lib/rate-limit";

export type Tracked = {
  id: string;
  status: OrderStatus;
  label: string;
  placed: string;
  steps: { label: string; at?: string; done: boolean }[];
  courier?: { name: string; tracking?: string };
  delivery: string;
  items: number;
  total: number;
  due: number;
};
export type TrackState = { order?: Tracked; error?: string; id?: string; phone?: string } | null;

// 20 lookups per IP per 10 minutes, 600 site-wide: order ids + phone numbers can't be guessed in bulk.
const hits = limiter("track", 20, 10 * 60_000);
const siteWide = limiter("track-all", 600, 10 * 60_000);

/** Public order tracking: needs the order number and the phone it was placed with. Shows status only — no address or staff names. */
export async function trackOrder(_: TrackState, form: FormData): Promise<TrackState> {
  const id = String(form.get("id") ?? "").trim().toUpperCase().slice(0, 24);
  const phoneRaw = String(form.get("phone") ?? "").slice(0, 20);
  if (!hits.take(clientIp(await headers())) || !siteWide.take("all")) return { id, phone: phoneRaw, error: "Too many lookups. Please try again in a few minutes." };

  const phone = normalizeBdPhone(phoneRaw);
  if (!/^MB-[A-Z0-9-]{4,20}$/.test(id) || !phone) return { id, phone: phoneRaw, error: "Enter your order number (MB-…) and the mobile number you ordered with." };

  const o = (await readDb()).orders.find((x) => x.id === id && normalizeBdPhone(x.customer.phone) === phone);
  if (!o) return { id, phone: phoneRaw, error: "We couldn't find that order. Check the number, or call us and we'll help." };

  const at = (s: OrderStatus) => o.history.findLast((x) => x.status === s)?.at;
  const pickup = o.delivery.id === "pickup";
  const flow: OrderStatus[] = pickup ? ["pending", "confirmed", "packed", "delivered"] : ["pending", "confirmed", "packed", "shipped", "delivered"];
  const reached = o.status === "cancelled" ? -1 : flow.indexOf(o.status);
  const words: Partial<Record<OrderStatus, string>> = { pending: "Order placed", confirmed: "Confirmed", packed: pickup ? "Ready for pickup" : "Packed", shipped: "With the courier", delivered: pickup ? "Collected" : "Delivered" };
  const paid = o.payments.reduce((n, p) => n + p.amount, 0);

  return {
    id,
    phone: phoneRaw,
    order: {
      id: o.id,
      status: o.status,
      label: o.status === "cancelled" ? "Cancelled" : (words[o.status] ?? statusLabel[o.status]),
      placed: o.createdAt,
      steps: flow.map((s, i) => ({ label: words[s] ?? statusLabel[s], at: i <= reached ? at(s) : undefined, done: i <= reached })),
      ...(o.courier ? { courier: o.courier } : {}),
      delivery: o.delivery.label,
      items: o.lines.reduce((n, l) => n + l.qty, 0),
      total: o.total,
      due: o.status === "cancelled" ? 0 : Math.max(0, o.total - paid),
    },
  };
}
