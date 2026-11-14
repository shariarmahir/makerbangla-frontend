"use client";

import { useSyncExternalStore } from "react";

/** Minimal snapshot of a product kept client-side (no catalog in the bundle). */
export type ProductRef = { slug: string; name: string; price: number; image: string };
export type CartLine = ProductRef & { qty: number };

type State = { cart: CartLine[]; wishlist: ProductRef[]; recent: ProductRef[] };

const KEY = "mb:store:v1";
const MAX_QTY = 99;
const EMPTY: State = { cart: [], wishlist: [], recent: [] };

let state: State = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

const isRef = (v: unknown): v is ProductRef => {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.slug === "string" && /^[a-z0-9-]{1,80}$/.test(r.slug) &&
    typeof r.name === "string" && r.name.length <= 160 &&
    typeof r.price === "number" && Number.isFinite(r.price) && r.price >= 0 &&
    typeof r.image === "string" && r.image.startsWith("/images/")
  );
};

const toRef = ({ slug, name, price, image }: ProductRef): ProductRef => ({ slug, name, price, image });

/** Treat localStorage as untrusted input: keep only well-formed entries. */
function sanitize(raw: unknown): State {
  if (!raw || typeof raw !== "object") return EMPTY;
  const r = raw as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter(isRef).slice(0, 50) : []);
  return {
    cart: list(r.cart).map((l) => ({
      ...toRef(l),
      qty: Math.min(MAX_QTY, Math.max(1, Math.trunc(Number((l as CartLine).qty)) || 1)),
    })),
    wishlist: list(r.wishlist).map(toRef),
    recent: list(r.recent).map(toRef).slice(0, 12),
  };
}

function read() {
  try {
    state = sanitize(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch {
    state = EMPTY;
  }
}

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — keep in-memory state */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  if (!hydrated) {
    hydrated = true;
    read();
    window.addEventListener("storage", (e) => {
      if (e.key !== KEY) return;
      read();
      listeners.forEach((l) => l());
    });
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(EMPTY));
}

export const cart = {
  add(p: ProductRef, qty = 1) {
    const line = state.cart.find((l) => l.slug === p.slug);
    const lines = line
      ? state.cart.map((l) => (l.slug === p.slug ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l))
      : [...state.cart, { ...toRef(p), qty: Math.min(MAX_QTY, qty) }];
    set({ ...state, cart: lines });
  },
  setQty(slug: string, qty: number) {
    if (qty < 1) return cart.remove(slug);
    set({ ...state, cart: state.cart.map((l) => (l.slug === slug ? { ...l, qty: Math.min(MAX_QTY, qty) } : l)) });
  },
  remove(slug: string) {
    set({ ...state, cart: state.cart.filter((l) => l.slug !== slug) });
  },
  clear() {
    set({ ...state, cart: [] });
  },
};

export const wishlist = {
  toggle(p: ProductRef) {
    const has = state.wishlist.some((w) => w.slug === p.slug);
    set({ ...state, wishlist: has ? state.wishlist.filter((w) => w.slug !== p.slug) : [toRef(p), ...state.wishlist] });
  },
};

export const recent = {
  push(p: ProductRef) {
    set({ ...state, recent: [toRef(p), ...state.recent.filter((r) => r.slug !== p.slug)].slice(0, 12) });
  },
};

export const cartCount = (s: State) => s.cart.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (s: State) => s.cart.reduce((n, l) => n + l.qty * l.price, 0);
