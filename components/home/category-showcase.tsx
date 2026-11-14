import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryCount, getCategory, productsIn } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";

type Row = { slug: string; image: string };

const defaultRows: Row[] = [
  { slug: "sensors", image: "hc-sr04-ultrasonic-sensor" },
  { slug: "motors", image: "nema17-stepper-motor" },
  { slug: "power", image: "lm2596-buck-converter" },
  { slug: "microcontrollers", image: "arduino-uno-r3" },
];

function HeadTile({ row }: { row: Row }) {
  const category = getCategory(row.slug)!;
  const tone = categoryTone(row.slug);
  const href = `/shop?category=${row.slug}`;
  const chip = tone.dark ? "bg-white/15 hover:bg-white hover:text-ink" : "bg-white/55 hover:bg-white";
  return (
    <div className={cn("relative isolate flex min-h-64 flex-col overflow-hidden rounded-2xl p-6 sm:min-h-72 lg:min-h-full", tone.bg, tone.text)}>
      <span aria-hidden className="absolute -right-16 -bottom-16 -z-10 size-56 rounded-full bg-white/20" />
      <span aria-hidden className="absolute -right-4 -bottom-4 -z-10 size-32 rounded-full bg-white/20" />

      <p className={cn("w-fit rounded-full px-2.5 py-1 text-[10.5px] font-extrabold tracking-wider uppercase", tone.dark ? "bg-white/15" : "bg-white/55")}>
        {categoryCount(row.slug)} Products
      </p>
      <h2 className="mt-3 max-w-[14ch] text-[clamp(1.45rem,2vw,1.75rem)] leading-[1.05] font-extrabold tracking-tight">
        <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">{category.name}</Link>
      </h2>
      <ul className="mt-4 flex max-w-[78%] flex-wrap gap-1.5">
        {category.links.map((l) => (
          <li key={l}>
            <Link href={`${href}&q=${encodeURIComponent(l)}`} className={cn("inline-block rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors", chip)}>
              {l}
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto h-28 lg:h-32">
        <div className="absolute -right-3 -bottom-2 aspect-square w-36 rotate-[-8deg] sm:w-40">
          <ProductVisual slug={row.image} alt="" sizes="160px" inset="p-0" plate="inset-[12%]" />
        </div>
      </div>
      <Link href={href} className="btn-pill relative h-9 w-fit bg-white px-5 text-ink shadow-sm hover:shadow-md">
        View All <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

export function CategoryShowcase({ rows = defaultRows, className, label = "Shop by category" }: { rows?: Row[]; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cn("bg-soft py-8 sm:py-10", className)}>
      <div className="container-x space-y-4 sm:space-y-5">
        {rows.map((row) => (
          <div key={row.slug} className="reveal grid gap-3 lg:grid-cols-[1.1fr_4fr]">
            <HeadTile row={row} />
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-4">
              {productsIn(row.slug).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
