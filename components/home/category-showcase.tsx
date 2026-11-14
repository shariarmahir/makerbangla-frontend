import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { categoryCount, getCategory, productsIn } from "@/lib/catalog";
import { categoryTone } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { MagicLink } from "@/components/ui/magic-button";

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
  return (
    <div className={cn("relative isolate flex min-h-72 flex-col overflow-hidden rounded-[22px] p-6 shadow-[0_28px_40px_-30px_rgb(0_0_0/0.55)] lg:mt-12 lg:min-h-0", tone.bg, tone.text)}>
      <p className={cn("text-[11px] font-extrabold tracking-[0.14em] uppercase tabular-nums", tone.muted)}>{categoryCount(row.slug)} products</p>
      <h2 className="mt-2 text-[clamp(1.4rem,1.75vw,1.65rem)] leading-[1.05] font-black tracking-tight [overflow-wrap:anywhere]">
        <Link href={href} className="hover:underline hover:decoration-2 hover:underline-offset-4">{category.name}</Link>
      </h2>
      <ul className="relative z-10 mt-5 space-y-1.5">
        {category.links.map((l) => (
          <li key={l}>
            <Link href={`${href}&q=${encodeURIComponent(l)}`} className="group/l inline-flex items-center gap-1.5 text-[13.5px] font-bold">
              <span className="underline-offset-4 group-hover/l:underline">{l}</span>
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover/l:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>

      <div aria-hidden className="pointer-events-none absolute -right-3 -bottom-3 aspect-square w-32 -rotate-12 sm:w-36 lg:w-32 xl:w-36">
        <ProductVisual slug={row.image} alt="" sizes="200px" inset="p-0" />
      </div>

      <div className="relative mt-auto pt-8">
        <MagicLink href={href} variant={tone.dark ? "accent" : "default"} size="sm">
          View All <ArrowRight className="size-3.5" />
        </MagicLink>
      </div>
    </div>
  );
}

export function CategoryShowcase({ rows = defaultRows, className, label = "Shop by category" }: { rows?: Row[]; className?: string; label?: string }) {
  return (
    <section aria-label={label} className={cn("bg-soft py-8 sm:py-10", className)}>
      <div className="container-x space-y-8 sm:space-y-10">
        {rows.map((row) => (
          <div key={row.slug} className="reveal grid gap-x-5 gap-y-4 lg:grid-cols-[1fr_4fr]">
            <HeadTile row={row} />
            <div className="grid grid-cols-2 gap-x-3 gap-y-14 pt-12 sm:grid-cols-4 sm:gap-x-4">
              {productsIn(row.slug).map((p) => (
                <ProductCard key={p.slug} product={p} sizes="(min-width:1024px) 250px, (min-width:640px) 24vw, 48vw" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
