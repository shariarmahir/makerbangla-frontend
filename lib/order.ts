import type { DeliveryId } from "@/lib/site";

export type OrderLine = { slug: string; name: string; sku: string; qty: number; price: number };

export type Order = {
  id: string;
  createdAt: string; // ISO
  customer: { name: string; phone: string; email?: string };
  delivery: { id: DeliveryId; label: string; fee: number; address?: string; city?: string; area?: string };
  payment: string;
  note?: string;
  lines: OrderLine[];
  subtotal: number;
  total: number;
  /** True when no order backend is configured (development preview only). */
  demo: boolean;
};

export type PlaceOrderState =
  | { ok: true; order: Order }
  | { ok: false; message: string; errors?: Partial<Record<"name" | "phone" | "email" | "address" | "city" | "items", string>> }
  | null;

/** Bangladeshi mobile number, with or without +88 / 88. Returns 01XXXXXXXXX or null. */
export function normalizeBdPhone(raw: string) {
  const digits = raw.replace(/[\s()-]/g, "").replace(/^\+?88/, "");
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}
