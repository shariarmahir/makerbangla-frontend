"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cart, cartCount, cartTotal, useStore } from "@/lib/store";
import { site } from "@/lib/site";
import { bdt } from "@/lib/utils";

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-sale px-1 text-[9px] leading-none font-bold text-white tabular-nums">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function WishlistLink() {
  const n = useStore((s) => s.wishlist.length);
  return (
    <Link href="/wishlist" aria-label={`Wishlist, ${n} items`} className="relative grid size-9 place-items-center text-ink transition-colors hover:text-brand-strong">
      <Heart className="size-[22px]" strokeWidth={1.6} />
      {n > 0 && <Badge n={n} />}
    </Link>
  );
}

export function CartButton() {
  const [open, setOpen] = useState(false);
  const count = useStore(cartCount);
  const total = useStore(cartTotal);
  const lines = useStore((s) => s.cart);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2.5 text-left" aria-label={`Open cart, ${count} items`}>
        <span className="relative grid size-9 place-items-center text-ink">
          <ShoppingCart className="size-[22px]" strokeWidth={1.6} />
          {count > 0 && <Badge n={count} />}
        </span>
        <span className="hidden leading-tight xl:block">
          <span className="text-gradient block text-[12px] font-black tracking-tight">Shopping Cart</span>
          <span className="block text-[13px] font-extrabold tabular-nums">{bdt(total)}</span>
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md" showCloseButton={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <SheetTitle className="text-xl font-black tracking-tight"><span className="text-gradient">Shopping Cart</span> <span className="text-[13px] font-bold text-subtle tabular-nums">({count})</span></SheetTitle>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close cart" className="grid size-8 place-items-center rounded-full hover:bg-soft">
              <X className="size-4" />
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="grid flex-1 place-content-center gap-4 px-6 text-center">
              <ShoppingCart className="mx-auto size-10 text-line" strokeWidth={1.4} />
              <p className="text-sm text-subtle">Your cart is empty.</p>
              <MagicLink href="/shop" onClick={() => setOpen(false)} variant="accent" className="mx-auto">Browse the shop</MagicLink>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {lines.map((l) => (
                  <li key={l.slug} className="flex gap-3 py-4">
                    <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-soft">
                      <Image src={l.image} alt="" fill sizes="64px" className="object-contain p-1.5" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${l.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-[13px] leading-snug font-medium hover:text-brand-strong">
                        {l.name}
                      </Link>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex h-8 items-center rounded-sm border border-line">
                          <button type="button" onClick={() => cart.setQty(l.slug, l.qty - 1)} aria-label="Decrease" className="grid h-full w-8 place-items-center hover:bg-soft">
                            <Minus className="size-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">{l.qty}</span>
                          <button type="button" onClick={() => cart.setQty(l.slug, l.qty + 1)} aria-label="Increase" className="grid h-full w-8 place-items-center hover:bg-soft">
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-[13px] font-bold tabular-nums">{bdt(l.price * l.qty)}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => cart.remove(l.slug)} aria-label={`Remove ${l.name}`} className="self-start p-1 text-subtle hover:text-sale">
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t border-line bg-soft p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-subtle">Subtotal</span>
                  <span className="text-lg font-bold tabular-nums">{bdt(total)}</span>
                </div>
                <p className="text-[11.5px] text-subtle">Choose delivery and see the final total at checkout.</p>
                <MagicLink href="/checkout" onClick={() => setOpen(false)} variant="accent" size="lg" rainbow className="w-full">
                  Proceed to Checkout
                </MagicLink>
                <button type="button" onClick={cart.clear} className="w-full text-center text-[11px] font-semibold text-subtle underline-offset-2 hover:underline">
                  Clear cart
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function MobileMenu({ nav, categories }: { nav: readonly { label: string; href: string }[]; categories: { slug: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="-ml-2 grid size-10 place-items-center lg:hidden">
        <Menu className="size-6" strokeWidth={1.6} />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[86%] max-w-sm gap-0 overflow-y-auto p-0" showCloseButton={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Image src="/brand/logo.png" alt={site.name} width={116} height={40} className="h-10 w-auto" />
            <button type="button" onClick={close} aria-label="Close menu" className="grid size-9 place-items-center rounded-full hover:bg-soft">
              <X className="size-5" />
            </button>
          </div>
          <nav aria-label="Mobile" className="px-5 py-3">
            {nav.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className="block border-b border-line py-3 text-[13px] font-semibold tracking-wide uppercase">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="px-5 pt-2 pb-6">
            <p className="mb-2 text-[11px] font-bold tracking-wider text-subtle uppercase">Categories</p>
            <ul className="grid grid-cols-2 gap-x-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`} onClick={close} className="block py-2 text-[13px] hover:text-brand-strong">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <MagicAnchor href={`tel:${site.phoneIntl}`} className="mt-6 w-full">Call {site.phone}</MagicAnchor>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
