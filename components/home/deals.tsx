import Link from "next/link";
import { deals, getCategory, toRef } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { Price } from "@/components/product/product-card";
import { BuyNow, QuickAdd, WishlistButton } from "@/components/product/product-actions";
import { ProductVisual } from "@/components/product/product-visual";
import { Carousel } from "./carousel";
import { Countdown } from "./countdown";
import { Newsletter } from "./newsletter";

export function Deals() {
  return (
    <section aria-labelledby="deals-title" className="container-x reveal grid gap-5 py-10 sm:py-12 lg:grid-cols-[1fr_280px] lg:gap-6">
      <div className="min-w-0">
        <h2 id="deals-title" className="section-title mb-5 flex items-center gap-4 after:mr-20 after:h-px after:flex-1 after:bg-line">
          Deals Of The Month
        </h2>
        <Carousel label="Deals of the month" item="basis-full md:basis-1/2" headerArrows className="-mx-2">
          {deals().map((p) => {
            const ref = toRef(p);
            const tone = categoryTone(p.category);
            return (
              <article key={p.slug} className={cn("relative mx-2 grid h-full grid-cols-[44%_1fr] gap-x-4 gap-y-4 rounded-[22px] p-4 sm:p-5", tone.bg, tone.text)}>
                <Link href={`/products/${p.slug}`} className="group relative aspect-square">
                  <ProductVisual slug={p.slug} alt={p.name} sizes="(min-width:768px) 220px, 40vw" inset="p-[4%]" className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2" />
                </Link>
                <div className="flex min-w-0 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-[10px] font-extrabold tracking-[0.14em] uppercase", tone.muted)}>{getCategory(p.category)?.name}</p>
                    <WishlistButton product={ref} className="-mt-2 -mr-2 shrink-0" />
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-[15px] leading-snug font-black tracking-tight">
                    <Link href={`/products/${p.slug}`} className="hover:underline hover:underline-offset-4">{p.name}</Link>
                  </h3>
                  <Price price={p.price} oldPrice={p.oldPrice} showOff className="mt-2 text-[18px]" />
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <BuyNow product={ref} disabled={p.stock <= 0} variant={tone.dark ? "accent" : "default"} className="flex-1" />
                    <QuickAdd product={ref} disabled={p.stock <= 0} />
                  </div>
                </div>
                <div className="col-span-2">
                  <Countdown />
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
