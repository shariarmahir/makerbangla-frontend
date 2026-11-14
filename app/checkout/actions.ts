"use server";

import { products } from "@/lib/data/catalog";
import { normalizeBdPhone, type Order, type OrderLine, type PlaceOrderState } from "@/lib/order";
import { deliveryOptions, site } from "@/lib/site";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const SLUG = /^[a-z0-9-]{1,80}$/;

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max);

function parseItems(raw: string): { slug: string; qty: number }[] | null {
  if (raw.length > 4000) return null;
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0 || data.length > 50) return null;
    const items = data.map((d) => ({ slug: String(d?.slug ?? ""), qty: Math.trunc(Number(d?.qty)) }));
    return items.every((i) => SLUG.test(i.slug) && i.qty >= 1 && i.qty <= 99) ? items : null;
  } catch {
    return null;
  }
}

function orderId(now: Date) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
  return `MB-${ymd}-${rand}`;
}

export async function placeOrder(_: PlaceOrderState, form: FormData): Promise<PlaceOrderState> {
  // Honeypot: bots fill every field.
  if (form.get("company")) return { ok: false, message: "Something went wrong. Please try again." };

  const errors: NonNullable<Extract<PlaceOrderState, { ok: false }>["errors"]> = {};

  const name = text(form, "name", 80);
  if (name.length < 2) errors.name = "Please enter your full name.";

  const phone = normalizeBdPhone(text(form, "phone", 20));
  if (!phone) errors.phone = "Enter a valid Bangladeshi mobile number, e.g. 01711-000000.";

  const email = text(form, "email", 254).toLowerCase();
  if (email && !EMAIL.test(email)) errors.email = "Enter a valid email address or leave it empty.";

  const delivery = deliveryOptions.find((d) => d.id === form.get("delivery"));
  if (!delivery) return { ok: false, message: "Please choose a delivery option." };

  const address = text(form, "address", 200);
  const city = text(form, "city", 60);
  const area = text(form, "area", 60);
  if (delivery.id !== "pickup") {
    if (address.length < 5) errors.address = "Please enter your full delivery address.";
    if (city.length < 2) errors.city = "Please enter your city or district.";
  }

  // Never trust client prices: re-price every line from the catalog.
  const items = parseItems(String(form.get("items") ?? ""));
  const lines: OrderLine[] = [];
  for (const item of items ?? []) {
    const p = products.find((x) => x.slug === item.slug);
    if (!p || p.stock <= 0) continue;
    const existing = lines.find((l) => l.slug === p.slug);
    if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
    else lines.push({ slug: p.slug, name: p.name, sku: p.sku, qty: Math.min(item.qty, p.stock), price: p.price });
  }
  if (lines.length === 0) errors.items = "Your cart is empty or the items are no longer available.";

  if (Object.keys(errors).length) return { ok: false, message: "Please check the highlighted fields.", errors };

  const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
  const now = new Date();
  const order: Order = {
    id: orderId(now),
    createdAt: now.toISOString(),
    customer: { name, phone: phone!, ...(email ? { email } : {}) },
    delivery: {
      id: delivery.id,
      label: delivery.label,
      fee: delivery.fee,
      ...(delivery.id === "pickup" ? {} : { address, city, ...(area ? { area } : {}) }),
    },
    payment: delivery.id === "pickup" ? "Pay at pickup" : "Cash on delivery",
    ...(text(form, "note", 300) ? { note: text(form, "note", 300) } : {}),
    lines,
    subtotal,
    total: subtotal + delivery.fee,
    demo: false,
  };

  const api = process.env.API_URL;
  if (!api) {
    // No order backend yet: allow a local preview in development, refuse in production so no order is silently lost.
    if (process.env.NODE_ENV === "production") {
      return { ok: false, message: `Online checkout is opening soon. Please call ${site.phone} to place this order.` };
    }
    return { ok: true, order: { ...order, demo: true } };
  }

  try {
    const res = await fetch(new URL("/orders", api), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    return { ok: true, order };
  } catch {
    return { ok: false, message: `We couldn't place your order right now. Please try again or call ${site.phone}.` };
  }
}
