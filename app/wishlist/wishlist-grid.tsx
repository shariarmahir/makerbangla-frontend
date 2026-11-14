"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { QuickAdd, WishlistButton } from "@/components/product/product-actions";
import { useStore } from "@/lib/store";
import { bdt } from "@/lib/utils";

export function WishlistGrid() {
  const items = useStore((s) => s.wishlist);

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-line px-6 py-16 text-center">
        <Heart className="mx-auto size-10 text-line" strokeWidth={1.4} />
        <p className="mt-4 text-sm text-subtle">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn-cta mt-5">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px bg-line ring-1 ring-line sm:grid-cols-3 lg:grid-cols-5">
      {items.map((p) => (
        <article key={p.slug} className="relative flex flex-col bg-white p-4">
          <Link href={`/products/${p.slug}`} className="relative aspect-square overflow-hidden rounded-xl bg-soft">
            <Image src={p.image} alt={p.name} fill sizes="(min-width:1024px) 220px, 45vw" className="object-contain p-3" />
          </Link>
          <WishlistButton product={p} className="absolute top-3 right-3" />
          <p className="mt-3 text-[14px] font-bold tabular-nums">{bdt(p.price)}</p>
          <Link href={`/products/${p.slug}`} className="line-clamp-2 text-[12.5px] font-medium hover:text-brand-strong">{p.name}</Link>
          <div className="mt-auto flex justify-end pt-3"><QuickAdd product={p} /></div>
        </article>
      ))}
    </div>
  );
}
