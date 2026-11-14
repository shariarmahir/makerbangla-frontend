import Link from "next/link";
import { brands } from "@/lib/catalog";
import { BrandLogo } from "@/components/brand/brand-logo";

function Row({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-14 pr-14 sm:gap-20 sm:pr-20">
      {brands.map((b, i) => (
        <li key={b.slug}>
          <Link
            href={`/shop?brand=${b.slug}`}
            tabIndex={hidden ? -1 : undefined}
            aria-label={`${b.name} products`}
            className="block transition-transform duration-300 hover:scale-110"
          >
            <BrandLogo slug={b.slug} name={b.name} size="lg" index={i} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function BrandStrip() {
  return (
    <section aria-label="Brands we stock" className="reveal py-10 sm:py-14">
      <div className="group relative overflow-hidden mask-x-from-92% mask-x-to-100%">
        <div className="flex w-max items-center py-2 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
