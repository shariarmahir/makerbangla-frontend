"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { cart, recent, useStore, wishlist, type ProductRef } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WishlistButton({ product, className }: { product: ProductRef; className?: string }) {
  const saved = useStore((s) => s.wishlist.some((w) => w.slug === product.slug));
  return (
    <button
      type="button"
      onClick={() => wishlist.toggle(product)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={cn(
        "grid size-8 place-items-center rounded-full bg-white/90 text-ink-2 transition-colors hover:text-sale",
        saved && "text-sale",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} strokeWidth={1.8} />
    </button>
  );
}

function useAdded() {
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);
  return [added, () => setAdded(true)] as const;
}

export function QuickAdd({ product, disabled }: { product: ProductRef; disabled?: boolean }) {
  const [added, flash] = useAdded();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        cart.add(product);
        flash();
      }}
      aria-label={`Add ${product.name} to cart`}
      className="grid size-8 place-items-center rounded-full bg-ink text-white transition-[background-color,transform] duration-200 hover:bg-brand-strong active:scale-95 disabled:opacity-40"
    >
      {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" strokeWidth={1.8} />}
    </button>
  );
}

/** Adds the item and goes straight to checkout. */
export function BuyNow({ product, qty = 1, disabled, className }: { product: ProductRef; qty?: number; disabled?: boolean; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        cart.add(product, qty);
        router.push("/checkout");
      }}
      className={cn(
        "btn-pill h-9 w-full bg-linear-to-r from-sale to-tile-orange px-4 text-[11.5px] text-white shadow-[0_6px_16px_-6px_var(--color-sale)] hover:shadow-[0_10px_22px_-6px_var(--color-sale)] disabled:pointer-events-none disabled:opacity-45",
        className,
      )}
    >
      <Zap className="size-3.5 fill-current" /> {disabled ? "Out of stock" : "Buy Now"}
    </button>
  );
}

export function BuyBox({ product, inStock }: { product: ProductRef; inStock: boolean }) {
  const [qty, setQty] = useState(1);
  const [added, flash] = useAdded();
  const step = (d: number) => setQty((q) => Math.min(99, Math.max(1, q + d)));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-11 items-center rounded-full border border-line">
        <button type="button" onClick={() => step(-1)} aria-label="Decrease quantity" className="grid h-full w-10 place-items-center rounded-l-full hover:bg-soft">
          <Minus className="size-3.5" />
        </button>
        <output aria-live="polite" className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</output>
        <button type="button" onClick={() => step(1)} aria-label="Increase quantity" className="grid h-full w-10 place-items-center rounded-r-full hover:bg-soft">
          <Plus className="size-3.5" />
        </button>
      </div>
      <button
        type="button"
        disabled={!inStock}
        onClick={() => {
          cart.add(product, qty);
          flash();
        }}
        className="btn-pill h-11 min-w-40 flex-1 bg-ink text-white hover:bg-brand-strong sm:flex-none disabled:opacity-50"
      >
        {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
        {added ? "Added to cart" : "Add to cart"}
      </button>
      <BuyNow product={product} qty={qty} disabled={!inStock} className="h-11 min-w-40 flex-1 text-[12.5px] sm:w-auto sm:flex-none" />
      <WishlistButton product={product} className="size-11 border border-line" />
    </div>
  );
}

export function TrackRecent({ product }: { product: ProductRef }) {
  useEffect(() => recent.push(product), [product]);
  return null;
}

/** Adds a whole parts list (recipe or lab kit) to the cart in one tap. */
export function AddAllToCart({ products, label = "Add all parts to cart", className }: { products: ProductRef[]; label?: string; className?: string }) {
  const [added, flash] = useAdded();
  return (
    <button
      type="button"
      disabled={products.length === 0}
      onClick={() => {
        products.forEach((p) => cart.add(p));
        flash();
      }}
      className={cn("btn-pill h-11 bg-ink px-6 text-white hover:bg-brand-strong disabled:opacity-50", className)}
    >
      {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
      {added ? "Added to cart" : label}
    </button>
  );
}
