import Link from "next/link";
import type { Product } from "@/lib/data/catalog";
import { getCategory, toRef } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { bdt, cn, discount } from "@/lib/utils";
import { BuyNow, QuickAdd, WishlistButton } from "./product-actions";
import { ProductVisual } from "./product-visual";

/** Grid for product cards: extra row gap + top padding so products can break out of the card top. */
export const productGrid = "grid grid-cols-2 gap-x-3 gap-y-14 pt-12 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4";

export function Price({ price, oldPrice, className, showOff }: { price: number; oldPrice?: number; className?: string; showOff?: boolean }) {
  const off = discount(price, oldPrice);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span className="font-black">{bdt(price)}</span>
      {oldPrice ? <s className="text-[0.72em] font-semibold opacity-60">{bdt(oldPrice)}</s> : null}
      {showOff && off > 0 ? <span className="text-[0.82em] font-black text-sale">-{off}%</span> : null}
    </p>
  );
}

export function StockCue({ stock, className }: { stock: number; className?: string }) {
  if (stock <= 0) return <span className={cn("text-[10.5px] font-bold text-sale", className)}>Out of stock</span>;
  return (
    <span className={cn("shrink-0 text-[10.5px] font-bold whitespace-nowrap", stock < 10 ? "text-warn" : "text-brand-strong", className)}>
      {stock < 10 ? `Only ${stock} left` : "In stock"}
    </span>
  );
}

export function ProductCard({ product, className, sizes = "(min-width:1280px) 300px, (min-width:640px) 32vw, 48vw" }: {
  product: Product;
  className?: string;
  sizes?: string;
}) {
  const off = discount(product.price, product.oldPrice);
  const ref = toRef(product);
  const href = `/products/${product.slug}`;
  const tone = categoryTone(product.category);
  return (
    <article
      className={cn(
        "group relative isolate flex flex-col rounded-[22px] shadow-[0_28px_40px_-30px_rgb(0_0_0/0.55)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_34px_48px_-30px_rgb(0_0_0/0.6)]",
        tone.bg,
        tone.text,
        className,
      )}
    >
      {/* Product breaks out of the top edge and dissolves into the card colour */}
      <Link href={href} tabIndex={-1} aria-hidden className="relative -mt-11 block aspect-[1/0.92]">
        <ProductVisual
          slug={product.slug}
          alt={product.name}
          sizes={sizes}
          fade
          position="object-bottom"
          inset="px-[7%] pt-0 pb-[4%]"
          className="transition-transform duration-500 ease-out group-hover:scale-[1.05] group-hover:-rotate-2"
        />
      </Link>

      {!off && product.isNew && <span className="absolute top-3.5 left-4 z-10 text-[11px] font-black tracking-[0.14em] uppercase">New</span>}
      <WishlistButton product={ref} className="absolute top-1.5 right-2 z-10" />

      <div className="flex flex-1 flex-col px-4 pb-4 sm:px-5 sm:pb-5">
        <p className={cn("text-[10px] font-extrabold tracking-[0.14em] uppercase", tone.muted)}>{getCategory(product.category)?.name}</p>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] leading-[1.22] font-black tracking-tight sm:text-[16px]">
          <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">{product.name}</Link>
        </h3>
        <p className={cn("mt-1.5 line-clamp-2 text-[11.5px] leading-snug sm:text-[12px]", tone.muted)}>{product.summary}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-2">
            <Price price={product.price} oldPrice={product.oldPrice} showOff className="text-[16px] sm:text-[17px]" />
            <QuickAdd product={ref} disabled={product.stock <= 0} className="-mr-1.5 -mb-1" />
          </div>
          <BuyNow product={ref} disabled={product.stock <= 0} variant={tone.dark ? "accent" : "default"} className="mt-3 w-full" />
        </div>
      </div>
    </article>
  );
}
