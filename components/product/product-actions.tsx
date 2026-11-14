"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Heart, Minus, Plus, ShoppingCart, Zap } from "lucide-react";
import { MagicButton, type MagicButtonSize, type MagicButtonVariant } from "@/components/ui/magic-button";
import { cart, recent, useStore, wishlist, type ProductRef } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Bare heart — no background chip; colour follows the surface it sits on. */
export function WishlistButton({ product, className }: { product: ProductRef; className?: string }) {
  const saved = useStore((s) => s.wishlist.some((w) => w.slug === product.slug));
  return (
    <button
      type="button"
      onClick={() => wishlist.toggle(product)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={cn("grid size-9 place-items-center transition-[color,transform] hover:scale-110 active:scale-95", saved ? "text-sale" : "text-current", className)}
    >
      <Heart className={cn("size-[21px] drop-shadow-[0_1px_1px_rgb(0_0_0/0.15)]", saved && "fill-current")} strokeWidth={2} />
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

export function QuickAdd({ product, disabled, className }: { product: ProductRef; disabled?: boolean; className?: string }) {
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
      className={cn("grid size-9 place-items-center transition-[color,transform] hover:scale-110 active:scale-95 disabled:opacity-40", className)}
    >
      {added ? <Check className="size-5" strokeWidth={2.4} /> : <ShoppingCart className="size-5" strokeWidth={2} />}
    </button>
  );
}

/** Adds the item and goes straight to checkout. */
export function BuyNow({ product, qty = 1, disabled, className, variant = "default", size = "sm", rainbow = false }: {
  product: ProductRef;
  qty?: number;
  disabled?: boolean;
  className?: string;
  variant?: MagicButtonVariant;
  size?: MagicButtonSize;
  rainbow?: boolean;
}) {
  const router = useRouter();
  return (
    <MagicButton
      type="button"
      disabled={disabled}
      variant={variant}
      size={size}
      rainbow={rainbow}
      onClick={() => {
        cart.add(product, qty);
        router.push("/checkout");
      }}
      className={className}
    >
      <Zap className="size-3.5 fill-current" /> {disabled ? "Out of stock" : "Buy Now"}
    </MagicButton>
  );
}

export function BuyBox({ product, inStock }: { product: ProductRef; inStock: boolean }) {
  const [qty, setQty] = useState(1);
  const [added, flash] = useAdded();
  const step = (d: number) => setQty((q) => Math.min(99, Math.max(1, q + d)));
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex h-11 items-center rounded-xl border border-line">
        <button type="button" onClick={() => step(-1)} aria-label="Decrease quantity" className="grid h-full w-10 place-items-center rounded-l-xl hover:bg-soft">
          <Minus className="size-3.5" />
        </button>
        <output aria-live="polite" className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</output>
        <button type="button" onClick={() => step(1)} aria-label="Increase quantity" className="grid h-full w-10 place-items-center rounded-r-xl hover:bg-soft">
          <Plus className="size-3.5" />
        </button>
      </div>
      <MagicButton
        type="button"
        disabled={!inStock}
        variant="default"
        rainbow={false}
        onClick={() => {
          cart.add(product, qty);
          flash();
        }}
      >
        {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
        {added ? "Added to cart" : "Add to cart"}
      </MagicButton>
      <BuyNow product={product} qty={qty} disabled={!inStock} variant="accent" size="md" rainbow />
      <WishlistButton product={product} className="size-11 rounded-xl border border-line text-ink" />
    </div>
  );
}

export function TrackRecent({ product }: { product: ProductRef }) {
  useEffect(() => recent.push(product), [product]);
  return null;
}

/** Adds a whole parts list (recipe or lab kit) to the cart in one tap. */
export function AddAllToCart({ products, label = "Add all parts to cart", className, variant = "default" }: {
  products: ProductRef[];
  label?: string;
  className?: string;
  variant?: MagicButtonVariant;
}) {
  const [added, flash] = useAdded();
  return (
    <MagicButton
      type="button"
      disabled={products.length === 0}
      variant={variant}
      rainbow={false}
      onClick={() => {
        products.forEach((p) => cart.add(p));
        flash();
      }}
      className={className}
    >
      {added ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
      {added ? "Added to cart" : label}
    </MagicButton>
  );
}
