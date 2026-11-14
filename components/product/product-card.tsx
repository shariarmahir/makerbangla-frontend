import Link from "next/link";
import type { Product } from "@/lib/data/catalog";
import { toRef } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { bdt, cn, discount } from "@/lib/utils";
import { BuyNow, QuickAdd, WishlistButton } from "./product-actions";
import { OfferBadge } from "./offer-badge";
import { ProductVisual } from "./product-visual";

/** Grid for product cards: extra row gap + top padding so products can break out of the card top. */
export const productGrid = "grid grid-cols-2 gap-x-3 gap-y-12 pt-9 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4";

export function Price({ price, oldPrice, className, showOff }: { price: number; oldPrice?: number; className?: string; showOff?: boolean }) {
  const off = discount(price, oldPrice);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span className="font-black whitespace-nowrap">{bdt(price)}</span>
      {oldPrice ? <s className="text-[0.72em] font-semibold whitespace-nowrap opacity-60">{bdt(oldPrice)}</s> : null}
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
  const soldOut = product.stock <= 0;
  return (
    <article
      className={cn(
        "group relative isolate flex flex-col rounded-[22px] shadow-[0_26px_36px_-28px_rgb(14_31_77/0.55)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_32px_44px_-28px_rgb(14_31_77/0.6)]",
        tone.bg,
        tone.text,
        className,
      )}
    >
      {/* Same frame on every card: the product rises a fixed amount above the top edge, sits on the
          bottom of the frame and dissolves into the card colour. */}
      <Link href={href} tabIndex={-1} aria-hidden className="relative -mt-8 block aspect-[1/0.84]">
        <ProductVisual
          slug={product.slug}
          alt={product.name}
          sizes={sizes}
          fade
          position="object-bottom"
          inset={off > 0 || product.isNew ? "pl-[25%] pr-[5%] pt-0 pb-[3%]" : "px-[11%] pt-0 pb-[3%]"}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.04] group-hover:-rotate-2"
        />
      </Link>

      {/* Ad-style offer sticker on the top-left corner */}
      {off > 0 ? (
        <OfferBadge off={off} dark={tone.dark} className="absolute -top-3 -left-2 z-20 sm:-top-4 sm:-left-3" />
      ) : product.isNew ? (
        <p className={cn("pointer-events-none absolute top-3.5 left-4 z-10 text-[11px] font-black tracking-[0.18em] uppercase", tone.offer)}>New</p>
      ) : null}

      <div className="flex flex-1 flex-col px-3.5 pt-2 pb-3.5 sm:px-5 sm:pb-5">
        <h3 className="mt-1 line-clamp-2 min-h-[2.44em] text-[14.5px] leading-[1.22] font-black tracking-tight sm:text-[16px]">
          <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">{product.name}</Link>
        </h3>
        <p className={cn("mt-1.5 line-clamp-2 text-[11.5px] leading-snug sm:text-[12px]", tone.muted)}>{product.summary}</p>

        {/* Price + wishlist/cart side by side; on narrow phones the icons drop beside Buy Now */}
        <div className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-1.5 gap-y-2.5 pt-3.5">
          <Price price={product.price} oldPrice={product.oldPrice} className="col-span-2 text-[15px] sm:col-span-1 sm:text-[17px]" />
          <div className="order-3 -mr-1.5 flex items-center sm:order-none">
            <WishlistButton product={ref} className="size-8" />
            <QuickAdd product={ref} disabled={soldOut} className="size-8" />
          </div>
          <BuyNow product={ref} disabled={soldOut} variant={tone.button} className="order-2 w-full sm:order-none sm:col-span-2" />
        </div>
      </div>
    </article>
  );
}
