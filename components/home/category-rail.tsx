import Link from "next/link";
import { categories } from "@/lib/data/catalog";
import { categoryCount } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { ProductVisual } from "@/components/product/product-visual";
import { Carousel } from "./carousel";

export function CategoryRail() {
  return (
    <section aria-label="Shop by category" className="container-x reveal py-8 sm:py-10">
      <Carousel label="Categories" item="basis-1/3 sm:basis-1/5 lg:basis-1/8">
        {categories.map((c) => (
          <Link key={c.slug} href={`/shop?category=${c.slug}`} className="group flex flex-col items-center px-1.5 text-center sm:px-2">
            <span className={cn("relative mb-3 block aspect-square w-full max-w-28 overflow-hidden rounded-2xl transition-transform duration-300 ease-out group-hover:-translate-y-1", categoryTone(c.slug).bg)}>
              <ProductVisual slug={c.image} alt="" sizes="112px" inset="p-[14%]" className="transition-transform duration-300 group-hover:scale-110" />
            </span>
            <span className="text-[12.5px] leading-tight font-bold text-ink transition-colors group-hover:text-brand-strong">{c.name}</span>
            <span className="mt-1 text-[11px] text-subtle">{categoryCount(c.slug)} Products</span>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
