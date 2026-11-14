import Link from "next/link";
import { deals, getCategory, toRef } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { cn, discount } from "@/lib/utils";
import { Price } from "@/components/product/product-card";
import { BuyNow, QuickAdd, WishlistButton } from "@/components/product/product-actions";
import { ProductVisual } from "@/components/product/product-visual";
import { Carousel } from "./carousel";
import { Countdown } from "./countdown";
import { Newsletter } from "./newsletter";

export function Deals() {
  return (
    <section aria-labelledby="deals-title" className="container-x reveal grid gap-4 py-10 sm:py-12 lg:grid-cols-[1fr_280px] lg:gap-6">
      <div className="min-w-0">
        <h2 id="deals-title" className="section-title mb-5 flex items-center gap-4 after:h-px after:flex-1 after:bg-line after:mr-20">
          Deals Of The Month
        </h2>
        <Carousel label="Deals of the month" item="basis-full md:basis-1/2" headerArrows className="-mx-2">
          {deals().map((p) => {
            const ref = toRef(p);
            return (
              <article key={p.slug} className="mx-2 grid h-full grid-cols-[42%_1fr] gap-4 rounded-2xl border border-line bg-white p-4">
                <Link href={`/products/${p.slug}`} className={cn("group relative aspect-square overflow-hidden rounded-xl", categoryTone(p.category).bg)}>
                  <ProductVisual slug={p.slug} alt={p.name} sizes="(min-width:768px) 200px, 40vw" className="transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-2 left-2 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-extrabold text-sale shadow-sm">-{discount(p.price, p.oldPrice)}%</span>
                </Link>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Price price={p.price} oldPrice={p.oldPrice} className="text-[15px]" />
                    <WishlistButton product={ref} className="-mt-1 -mr-1 shrink-0" />
                  </div>
                  <h3 className="line-clamp-2 text-[13.5px] leading-snug font-semibold">
                    <Link href={`/products/${p.slug}`} className="hover:text-brand-strong">{p.name}</Link>
                  </h3>
                  <p className="text-[11px] text-subtle">{getCategory(p.category)?.name}</p>
                  <BuyNow product={ref} disabled={p.stock <= 0} className="mt-auto" />
                </div>
                <div className="col-span-2 flex items-end justify-between gap-2">
                  <Countdown />
                  <QuickAdd product={ref} disabled={p.stock <= 0} />
                </div>
              </article>
            );
          })}
        </Carousel>
      </div>
      <Newsletter />
    </section>
  );
}
