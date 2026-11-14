"use client";

import type { Order } from "@/lib/order";

/** Placed orders are kept on this device so the receipt page can be reopened, printed or downloaded. */
const KEY = "mb:orders:v1";
const ID = /^MB-\d{6}-[A-Z0-9]{5}$/;

function isOrder(v: unknown): v is Order {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" && ID.test(o.id) &&
    typeof o.createdAt === "string" &&
    typeof o.total === "number" && Number.isFinite(o.total) &&
    typeof o.subtotal === "number" &&
    Array.isArray(o.lines) && o.lines.length <= 50 &&
    !!o.customer && typeof o.customer === "object" &&
    !!o.delivery && typeof o.delivery === "object"
  );
}

function readAll(): Order[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter(isOrder).slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  try {
    localStorage.setItem(KEY, JSON.stringify([order, ...readAll().filter((o) => o.id !== order.id)].slice(0, 10)));
  } catch {
    /* storage blocked — the receipt still shows for this session via state */
  }
}

export function getOrder(id: string | null) {
  if (!id || !ID.test(id)) return undefined;
  return readAll().find((o) => o.id === id);
}
