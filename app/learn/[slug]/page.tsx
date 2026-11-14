import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, Clock, Package, ShieldAlert, Target } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { AddAllToCart } from "@/components/product/product-actions";
import { Price } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { getProduct, toRef } from "@/lib/catalog";
import { getRecipe, recipes } from "@/lib/data/learning";
import { site } from "@/lib/site";
import { categoryTone, levelTone, tones } from "@/lib/tones";
import { bdt, cn } from "@/lib/utils";


export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const r = getRecipe((await params).slug);
  if (!r) return {};
  return {
    title: `${r.title} — Circuit Recipe`,
    description: `${r.outcome} ${r.level}, about ${r.hours} hours. Full parts list and step-by-step guide.`,
    alternates: { canonical: `/learn/${r.slug}` },
  };
}

async function Recipe({ params }: Pick<PageProps<"/learn/[slug]">, "params">) {
  const r = getRecipe((await params).slug);
  if (!r) notFound();
  const parts = r.parts.map(getProduct).filter((p) => p !== undefined);
  const cost = parts.reduce((n, p) => n + p.price, 0);
  const tone = tones[r.tone];
  const next = recipes[(recipes.indexOf(r) + 1) % recipes.length];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: r.title,
          description: r.outcome,
          totalTime: `PT${r.hours}H`,
          supply: parts.map((p) => ({ "@type": "HowToSupply", name: p.name })),
          step: r.steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
          publisher: { "@type": "Organization", name: site.name },
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/learn" className="hover:text-ink">Learning Hub</Link><span aria-hidden>/</span>
        <span className="text-ink">{r.title}</span>
      </nav>

      {/* Header */}
      <header className={cn("relative isolate grid overflow-hidden rounded-2xl md:grid-cols-[1.2fr_1fr]", tone.bg, tone.text)}>
        <span aria-hidden className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-white/20" />
        <div className="p-6 sm:p-10">
          <span className={cn("inline-block rounded-full px-3 py-1 text-[11px] font-extrabold", tone.dark ? "bg-white/20" : "bg-white/60")}>{r.level}</span>
          <h1 className="mt-3 text-[clamp(1.9rem,4.4vw,3.2rem)] leading-[1] font-black tracking-tight">{r.title}</h1>
          <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed opacity-90">{r.outcome}</p>
          <ul className="mt-6 flex flex-wrap gap-2 text-[12px] font-bold">
            <li className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", tone.dark ? "bg-white/15" : "bg-white/55")}><Clock className="size-3.5" /> About {r.hours} h</li>
            <li className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", tone.dark ? "bg-white/15" : "bg-white/55")}><Package className="size-3.5" /> {parts.length} parts</li>
            <li className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", tone.dark ? "bg-white/15" : "bg-white/55")}><Target className="size-3.5" /> {r.steps.length} steps</li>
          </ul>
        </div>
        <div className="relative min-h-56 md:min-h-0">
          <ProductVisual slug={r.product} alt="" preload sizes="(min-width:768px) 480px, 100vw" inset="p-[12%]" plate="inset-[14%_18%]" className="motion-safe:animate-float" />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Steps */}
        <section aria-labelledby="steps-title">
          <h2 id="steps-title" className="section-title">Build it step by step</h2>
          <ol className="mt-5 space-y-3">
            {r.steps.map((s, i) => (
              <li key={s} className="flex gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-black", tone.bg, tone.text)}>{i + 1}</span>
                <p className="pt-1.5 text-[14px] leading-relaxed text-ink-2">{s}</p>
              </li>
            ))}
          </ol>
          {r.safety && (
            <p className="mt-4 flex gap-3 rounded-2xl bg-sale/10 p-4 text-[13px] leading-relaxed font-medium text-sale">
              <ShieldAlert className="size-5 shrink-0" /> {r.safety}
            </p>
          )}
        </section>

        {/* Parts */}
        <aside aria-labelledby="parts-title" className="rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-4">
          <h2 id="parts-title" className="text-[16px] font-extrabold tracking-tight">Parts list</h2>
          <ul className="mt-3 divide-y divide-line">
            {parts.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="group flex items-center gap-3 py-2.5">
                  <span className={cn("relative size-12 shrink-0 overflow-hidden rounded-lg", categoryTone(p.category).bg)}>
                    <ProductVisual slug={p.slug} alt="" sizes="48px" inset="p-1" plate="inset-1" />
                  </span>
                  <span className="line-clamp-2 flex-1 text-[12.5px] leading-snug font-semibold group-hover:text-brand-strong">{p.name}</span>
                  <Price price={p.price} className="text-[12.5px]" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-3 text-[13px]">
            <span className="font-bold">Parts total</span>
            <span className="text-[18px] font-black tabular-nums">{bdt(cost)}</span>
          </p>
          <AddAllToCart products={parts.map(toRef)} className="mt-4 w-full" />
        </aside>
      </div>

      <Link href={`/learn/${next.slug}`} className="group mt-10 flex items-center justify-between gap-4 rounded-2xl bg-soft p-5 sm:p-6">
        <span>
          <span className="block text-[11px] font-extrabold tracking-wider text-subtle uppercase">Next recipe</span>
          <span className="mt-1 block text-[16px] font-extrabold">{next.title}</span>
        </span>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full transition-transform group-hover:translate-x-1", levelTone[next.level])}>
          <ArrowRight className="size-4" />
        </span>
      </Link>
    </>
  );
}

export default function RecipePage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <div className="container-x py-6 sm:py-8">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-soft" />}>
        <Recipe params={params} />
      </Suspense>
    </div>
  );
}
