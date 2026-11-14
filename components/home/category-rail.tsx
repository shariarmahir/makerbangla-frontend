import Link from "next/link";
import { categories } from "@/lib/data/catalog";
import { categoryTone, tones } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { ProductVisual } from "@/components/product/product-visual";
import { Carousel } from "./carousel";

/** Rail tiles stay colourful: categories whose tone is white take a yellow tile here. */
const tileTone = (slug: string) => {
  const t = categoryTone(slug);
  return t === tones.white ? tones.butter : t;
};

export function CategoryRail() {
  return (
    <section aria-label="Shop by category" className="container-x reveal py-8 sm:py-10">
      <Carousel label="Categories" item="basis-1/3 sm:basis-1/5 lg:basis-1/8" arrowTop="top-[38%]">
        {categories.map((c) => (
          <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group flex flex-col items-center px-1.5 text-center sm:px-2">
            <span
              className={cn(
                "relative mb-3 block aspect-square w-full overflow-hidden rounded-[20px] shadow-[0_18px_26px_-20px_rgb(14_31_77/0.6)] transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_24px_30px_-20px_rgb(14_31_77/0.65)]",
                tileTone(c.slug).bg,
              )}
            >
              <span aria-hidden className="absolute inset-[14%] rounded-full bg-white/30 blur-xl" />
              <ProductVisual slug={c.image} alt="" sizes="(min-width:1024px) 160px, (min-width:640px) 20vw, 33vw" inset="p-[9%]" className="transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-3" />
            </span>
            <span className="text-[13px] leading-[1.2] font-extrabold tracking-tight text-ink [text-wrap:balance] transition-colors group-hover:text-brand-strong sm:text-[13.5px]">{c.name}</span>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
