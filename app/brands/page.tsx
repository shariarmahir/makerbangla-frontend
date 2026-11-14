import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { products } from "@/lib/data/catalog";
import { brands } from "@/lib/catalog";
import { slugify } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Brands — Arduino, Espressif, Raspberry Pi, Texas Instruments & More",
  description: `Shop electronics and lab equipment by brand in Bangladesh: ${brands.map((b) => b.name).join(", ")}.`,
  keywords: ["brand", "brands", ...brands.map((b) => `${b.name} Bangladesh`)],
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Brands</span>
      </nav>
      <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black tracking-tight">Shop By Brand</h1>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((b) => {
          const items = products.filter((p) => slugify(p.brand) === b.slug);
          return (
            <li key={b.slug} className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-[0_18px_40px_-24px_rgb(0_0_0/0.4)]">
              <Link href={`/shop?brand=${b.slug}`} className="flex h-12 items-center text-ink">
                <BrandLogo slug={b.slug} name={b.name} />
              </Link>
              <ul className="mt-4 space-y-1 text-[12.5px] text-ink-2">
                {items.slice(0, 3).map((p) => (
                  <li key={p.slug} className="line-clamp-1">
                    <Link href={`/products/${p.slug}`} className="hover:text-brand-strong hover:underline">{p.name}</Link>
                  </li>
                ))}
              </ul>
              <Link href={`/shop?brand=${b.slug}`} className="mt-auto inline-flex items-center gap-1 pt-5 text-[12.5px] font-bold text-brand-strong">
                {b.count} {b.count === 1 ? "product" : "products"} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-[12px] text-subtle">Brand names and logos belong to their respective owners and identify the products we stock.</p>
    </div>
  );
}
