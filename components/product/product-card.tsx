import Link from "next/link";
import type { Product } from "@/lib/data/catalog";
import { getCategory, toRef } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { bdt, cn, discount } from "@/lib/utils";
import { BuyNow, QuickAdd, WishlistButton } from "./product-actions";
import { ProductVisual } from "./product-visual";

export function Price({ price, oldPrice, className }: { price: number; oldPrice?: number; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span className="font-extrabold text-ink">{bdt(price)}</span>
      {oldPrice ? <s className="text-[0.75em] font-medium text-subtle">{bdt(oldPrice)}</s> : null}
    </p>
  );
}

export function StockCue({ stock }: { stock: number }) {
  if (stock <= 0) return <span className="text-[10.5px] font-semibold text-sale">Out of stock</span>;
  return (
    <span className={cn("shrink-0 text-[10.5px] font-semibold whitespace-nowrap", stock < 10 ? "text-warn" : "text-brand-strong")}>
      {stock < 10 ? `Only ${stock} left` : "In stock"}
    </span>
  );
}

export function ProductCard({ product, className, sizes = "(min-width:1024px) 220px, (min-width:640px) 30vw, 45vw" }: {
  product: Product;
  className?: string;
  sizes?: string;
}) {
  const off = discount(product.price, product.oldPrice);
  const ref = toRef(product);
  const href = `/products/${product.slug}`;
  const tone = categoryTone(product.category);
  return (
    <article className={cn("group relative flex flex-col bg-white p-2.5 sm:p-3", className)}>
      <div className={cn("relative aspect-square overflow-hidden rounded-lg", tone.bg)}>
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgb(255_255_255/0.38),transparent_62%)]" />
        <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
          <ProductVisual slug={product.slug} alt={product.name} sizes={sizes} className="transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
        </Link>
        {off > 0 && (
          <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-extrabold text-sale shadow-sm">-{off}%</span>
        )}
        {!off && product.isNew && (
          <span className="absolute top-2 left-2 rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-extrabold text-white">NEW</span>
        )}
        <WishlistButton product={ref} className="absolute top-2 right-2 shadow-sm" />
        <div className="absolute right-2 bottom-2 translate-y-1 opacity-100 transition-[opacity,translate] duration-200 sm:opacity-0 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <QuickAdd product={ref} disabled={product.stock <= 0} />
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1 px-0.5">
        <Price price={product.price} oldPrice={product.oldPrice} className="text-[14.5px]" />
        <h3 className="line-clamp-2 min-h-[2.6em] text-[13px] leading-[1.3] font-semibold text-ink">
          <Link href={href} className="transition-colors hover:text-brand-strong">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-subtle">{getCategory(product.category)?.name}</span>
          <StockCue stock={product.stock} />
        </div>
        <BuyNow product={ref} disabled={product.stock <= 0} className="mt-2.5" />
      </div>
    </article>
  );
}
