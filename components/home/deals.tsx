import Link from "next/link";
import { deals, toRef } from "@/lib/catalog";
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
    <section aria-labelledby="deals-title" className="container-x reveal grid gap-5 py-10 sm:py-12 lg:grid-cols-[1fr_300px] lg:gap-6">
      <div className="min-w-0">
        <h2 id="deals-title" className="section-title mb-5 flex items-center gap-4 after:mr-28 after:h-px after:flex-1 after:bg-line">
          Deals Of The Month
        </h2>
        <Carousel label="Deals of the month" item="basis-full md:basis-1/2" headerArrows className="-mx-2">
          {deals().map((p) => {
            const ref = toRef(p);
            const tone = categoryTone(p.category);
            const off = discount(p.price, p.oldPrice);
            const soldOut = p.stock <= 0;
            return (
              <article
                key={p.slug}
                className={cn("relative mx-2 flex h-full flex-col gap-4 rounded-[22px] p-4 shadow-[0_26px_36px_-28px_rgb(14_31_77/0.55)] sm:p-5", tone.bg, tone.text)}
              >
                <div className="grid grid-cols-[42%_1fr] gap-x-4">
                  <Link href={`/products/${p.slug}`} tabIndex={-1} aria-hidden className="group relative aspect-square">
                    <span className="absolute inset-[10%] rounded-full bg-white/25 blur-2xl" />
                    <ProductVisual slug={p.slug} alt={p.name} sizes="(min-width:768px) 200px, 40vw" inset="p-[6%]" className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2" />
                    {off > 0 && (
                      // Same round sticker as the offer banner, scaled down
                      <span
                        className={cn(
                          "absolute -top-1 -left-1 grid size-14 -rotate-12 place-content-center rounded-full text-center leading-none shadow-[0_8px_18px_-6px_rgb(0_0_0/0.45)] motion-safe:animate-sticker-pop sm:size-16",
                          tone.dark ? "bg-accent-yellow text-tile-navy" : "bg-tile-coral text-white",
                        )}
                      >
                        <span className="text-[1.05rem] font-black tracking-tight tabular-nums sm:text-[1.2rem]">{off}%</span>
                        <span className="mt-0.5 text-[0.55rem] font-black tracking-[0.2em] uppercase">Off</span>
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col pt-1">
                    <div className="flex items-start gap-2">
                      <h3 className="line-clamp-2 flex-1 text-[15.5px] leading-[1.22] font-black tracking-tight sm:text-[16.5px]">
                        <Link href={`/products/${p.slug}`} className="hover:underline hover:decoration-2 hover:underline-offset-4">{p.name}</Link>
                      </h3>
                      <WishlistButton product={ref} className="-mt-1.5 -mr-2 shrink-0" />
                    </div>
                    <p className={cn("mt-2 line-clamp-3 text-[12px] leading-snug", tone.muted)}>{p.summary}</p>
                    <Price price={p.price} oldPrice={p.oldPrice} className="mt-auto pt-3 text-[19px] sm:text-[21px]" />
                  </div>
                </div>

                {/* Countdown with the actions beside it */}
                <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-3 border-t border-current/15 pt-4">
                  <Countdown dark={tone.dark} />
                  <div className="flex items-center gap-1">
                    <BuyNow product={ref} disabled={soldOut} variant={tone.button} />
                    <QuickAdd product={ref} disabled={soldOut} className="size-10" />
                  </div>
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
