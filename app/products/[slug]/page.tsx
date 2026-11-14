import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BookOpen, Cable, Lightbulb, Phone, Truck } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { BuyBox, TrackRecent } from "@/components/product/product-actions";
import { Price, ProductCard, StockCue } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { departmentNames, products } from "@/lib/data/catalog";
import { getCategory, getProduct, imageCredit, productImage, productVisual, related, toRef } from "@/lib/catalog";
import { site } from "@/lib/site";
import { categoryTone } from "@/lib/tones";
import { cn, discount, slugify } from "@/lib/utils";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const title = `${p.name} — Price in Bangladesh`;
  return {
    title,
    description: `${p.summary} SKU ${p.sku}. Buy online from ${site.name}, Dhaka.`,
    keywords: [p.name, p.brand, `${p.brand} brand`, "brands", ...p.tags.map((t) => t.replace(/^#/, "")), getCategory(p.category)?.name ?? ""],
    alternates: { canonical: `/products/${p.slug}` },
    openGraph: { title, description: p.summary, url: `/products/${p.slug}`, images: [{ url: productImage(p.slug), alt: p.name }] },
  };
}

const h2 = "mb-4 flex items-center gap-2 text-[16px] font-extrabold tracking-tight";

function ProductSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="aspect-square animate-pulse rounded-2xl bg-soft" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-soft" />
        <div className="h-9 w-4/5 animate-pulse rounded bg-soft" />
        <div className="h-8 w-40 animate-pulse rounded bg-soft" />
        <div className="h-24 animate-pulse rounded bg-soft" />
      </div>
    </div>
  );
}

/** URL-dependent part of the page lives inside Suspense so the App Shell stays instant. */
async function ProductDetails({ params }: Pick<PageProps<"/products/[slug]">, "params">) {
  const p = getProduct((await params).slug);
  if (!p) notFound();

  const category = getCategory(p.category)!;
  const tone = categoryTone(p.category);
  const ref = toRef(p);
  const credit = imageCredit(p.slug);
  const off = discount(p.price, p.oldPrice);
  const companions = (p.worksWith ?? []).map(getProduct).filter((x) => x !== undefined);
  const branded = p.brand !== "Generic";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    image: `${site.url}${productImage(p.slug)}`,
    description: p.summary,
    brand: { "@type": "Brand", name: p.brand },
    category: category.name,
    additionalProperty: p.specs.map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
    offers: {
      "@type": "Offer",
      url: `${site.url}/products/${p.slug}`,
      priceCurrency: "BDT",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <TrackRecent product={ref} />

      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/shop" className="hover:text-ink">Shop</Link><span aria-hidden>/</span>
        <Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link><span aria-hidden>/</span>
        <span className="line-clamp-1 text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <figure className="lg:sticky lg:top-4 lg:self-start">
          <div className={cn("relative aspect-square overflow-hidden rounded-2xl", tone.bg)}>
            <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgb(255_255_255/0.4),transparent_62%)]" />
            <ProductVisual slug={p.slug} alt={p.name} preload sizes="(min-width:1024px) 600px, 100vw" inset="p-[12%]" />
            {!off && p.isNew && <span className="absolute top-5 left-5 text-[13px] font-black tracking-[0.16em] uppercase">New</span>}
          </div>
          {credit ? (
            <figcaption className="mt-2 text-[10.5px] text-subtle">
              Photo{productVisual(p.slug).cutout ? " (background removed)" : ""}: {credit.author} · {credit.license} ·{" "}
              <a href={credit.source} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2">Wikimedia Commons</a>
            </figcaption>
          ) : (
            <figcaption className="mt-2 text-[10.5px] text-subtle">Product illustration</figcaption>
          )}
        </figure>

        <div>
          {branded ? (
            <Link href={`/shop?brand=${slugify(p.brand)}`} className="text-[11.5px] font-extrabold tracking-wider text-brand-strong uppercase hover:underline">{p.brand}</Link>
          ) : (
            <p className="text-[11.5px] font-extrabold tracking-wider text-brand-strong uppercase">{category.name}</p>
          )}
          <h1 className="mt-1 text-[clamp(1.5rem,3vw,2rem)] leading-tight font-extrabold tracking-tight">{p.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-subtle">
            <span>SKU: <span className="font-semibold text-ink">{p.sku}</span></span>
            <StockCue stock={p.stock} />
          </div>

          <Price price={p.price} oldPrice={p.oldPrice} showOff className="mt-5 text-[28px]" />
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">{p.summary}</p>

          <div className="mt-6"><BuyBox product={ref} inStock={p.stock > 0} /></div>

          <ul className="mt-6 grid gap-2 rounded-2xl bg-soft p-4 text-[12.5px] text-ink-2 sm:grid-cols-2">
            <li className="flex items-center gap-2"><Truck className="size-4 text-brand-strong" /> Inside &amp; outside Dhaka delivery</li>
            <li className="flex items-center gap-2"><Phone className="size-4 text-brand-strong" /> Questions? <a href={`tel:${site.phoneIntl}`} className="font-bold text-ink hover:underline">{site.phone}</a></li>
          </ul>

          <section className="mt-8" aria-labelledby="specs">
            <h2 id="specs" className={h2}>Specifications</h2>
            <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line text-[13px]">
              {p.specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[40%_1fr] sm:grid-cols-[180px_1fr]">
                  <dt className="bg-soft px-4 py-2.5 font-semibold text-ink-2">{k}</dt>
                  <dd className="px-4 py-2.5">{v}</dd>
                </div>
              ))}
              {p.interfaces?.length ? (
                <div className="grid grid-cols-[40%_1fr] sm:grid-cols-[180px_1fr]">
                  <dt className="bg-soft px-4 py-2.5 font-semibold text-ink-2">Interfaces</dt>
                  <dd className="px-4 py-2.5">{p.interfaces.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="builds">
          <h2 id="builds" className={h2}><Lightbulb className="size-4 text-accent-yellow" /> What you can build</h2>
          <ul className="space-y-2 text-[13px]">
            {p.builds.map((b) => <li key={b} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />{b}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="connects">
          <h2 id="connects" className={h2}><Cable className="size-4 text-brand-strong" /> Works with</h2>
          {companions.length ? (
            <ul className="space-y-2 text-[13px]">
              {companions.map((c) => (
                <li key={c.slug}><Link href={`/products/${c.slug}`} className="hover:text-brand-strong hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-subtle">A standalone tool — no companion parts needed.</p>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-white p-5" aria-labelledby="labs">
          <h2 id="labs" className={h2}><BookOpen className="size-4 text-sale" /> Used in</h2>
          <ul className="flex flex-wrap gap-2">
            {p.departments.map((d) => (
              <li key={d}>
                <Link href={`/shop?department=${d}`} className="inline-block rounded-full border border-line px-3 py-1 text-[12px] font-semibold hover:border-brand hover:text-brand-strong">{departmentNames[d]}</Link>
              </li>
            ))}
          </ul>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <li key={t}><Link href={`/shop?q=${encodeURIComponent(t)}`} className="text-[12px] text-subtle hover:text-brand-strong">{t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`}</Link></li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-12" aria-labelledby="related">
        <h2 id="related" className="section-title mb-5">You may also need</h2>
        <div className="grid grid-cols-2 gap-x-3 gap-y-14 pt-12 sm:grid-cols-4 sm:gap-x-5">
          {related(p).map((r) => <ProductCard key={r.slug} product={r} />)}
        </div>
      </section>
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <div className="container-x py-6 sm:py-8">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetails params={params} />
      </Suspense>
    </div>
  );
}
