import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { brands } from "@/lib/catalog";
import { BrandLogo } from "@/components/brand/brand-logo";

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-12 pr-12 sm:gap-16 sm:pr-16">
      {brands.map((b) => (
        <li key={b.slug}>
          <Link
            href={`/shop?brand=${b.slug}`}
            tabIndex={hidden ? -1 : undefined}
            aria-label={`${b.name} products`}
            className="block text-ink-2 opacity-75 grayscale transition-[opacity,filter,color] duration-300 hover:text-ink hover:opacity-100 hover:grayscale-0"
          >
            <BrandLogo slug={b.slug} name={b.name} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function BrandStrip() {
  return (
    <section aria-labelledby="brands-title" className="container-x reveal py-10 sm:py-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="brands-title" className="section-title">Shop By Brand</h2>
        <Link href="/brands" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-strong hover:underline">
          All brands <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <div className="group relative overflow-hidden mask-x-from-90% mask-x-to-100%">
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
