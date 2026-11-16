import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, FlaskConical, Package, ShieldAlert, Target } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { card, JoinBand, Steps, ToneStage } from "@/components/learn/hub";
import { AddAllToCart } from "@/components/product/product-actions";
import { Price } from "@/components/product/product-card";
import { ProductVisual } from "@/components/product/product-visual";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { getProduct, toRef } from "@/lib/catalog";
import { getRecipe, recipes } from "@/lib/data/learning";
import { site } from "@/lib/site";
import { categoryTone, levelTone } from "@/lib/tones";
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
      <header className="grid items-center gap-10 pt-4 md:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <span className={cn("inline-block rounded-full px-3 py-1 text-[11.5px] font-black", levelTone[r.level])}>{r.level}</span>
          <h1 className="mt-5 text-[clamp(2.2rem,4.8vw,3.8rem)] leading-[1.02] font-black tracking-tight text-ink">{r.title}</h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">{r.outcome}</p>
          <ul className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-[13px] font-bold text-ink">
            <li className="flex items-center gap-1.5"><Clock className="size-4 text-brand" /> About {r.hours} h</li>
            <li className="flex items-center gap-1.5"><Package className="size-4 text-brand" /> {parts.length} parts</li>
            <li className="flex items-center gap-1.5"><Target className="size-4 text-brand" /> {r.steps.length} steps</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagicAnchor href="#steps" variant="brand" size="lg">Start building</MagicAnchor>
            <MagicLink href="/learn/lab-kitchen" variant="light" size="lg"><FlaskConical className="size-4" /> Test circuits first</MagicLink>
          </div>
        </div>
        <ToneStage product={r.product} tone={r.tone} preload className="mx-auto max-w-xl" />
      </header>

      <div className="mt-20 grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        {/* Steps */}
        <section id="steps" aria-labelledby="steps-title" className={cn(card, "scroll-mt-28 p-7 sm:p-9")}>
          <h2 id="steps-title" className="mb-8 text-[clamp(1.5rem,2.8vw,2.1rem)] leading-tight font-black tracking-tight text-ink">Build it step by step</h2>
          <Steps items={r.steps.map((s) => ({ title: s }))} />
          {r.safety && (
            <p className="mt-8 flex gap-3 rounded-2xl bg-sale/10 p-4 text-[13.5px] leading-relaxed font-medium text-sale">
              <ShieldAlert className="size-5 shrink-0" /> {r.safety}
            </p>
          )}
        </section>

        {/* Parts */}
        <aside aria-labelledby="parts-title" className={cn(card, "p-6 lg:sticky lg:top-28")}>
          <h2 id="parts-title" className="text-[20px] font-black tracking-tight text-ink">Parts list</h2>
          <ul className="mt-3 divide-y divide-line">
            {parts.map((p) => (
              <li key={p.slug}>
                <Link href={`/products/${p.slug}`} className="group flex items-center gap-3 py-3">
                  <span className={cn("relative size-14 shrink-0 overflow-hidden rounded-2xl", categoryTone(p.category).bg)}>
                    <ProductVisual slug={p.slug} alt="" sizes="56px" inset="p-1" />
                  </span>
                  <span className="line-clamp-2 flex-1 text-[13px] leading-snug font-semibold group-hover:text-brand-strong">{p.name}</span>
                  <Price price={p.price} className="text-[13px]" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-line pt-4 text-[13px]">
            <span className="font-bold">Parts total</span>
            <span className="text-[20px] font-black tabular-nums">{bdt(cost)}</span>
          </p>
          <AddAllToCart products={parts.map(toRef)} className="mt-5 w-full" />
        </aside>
      </div>

      <JoinBand top="Next recipe" bottom={next.title} left={next.product} right={r.product}>
        <MagicLink href={`/learn/${next.slug}`} variant="accent" size="lg" rainbow>Cook it next!</MagicLink>
      </JoinBand>
    </>
  );
}

export default function RecipePage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <div className="container-x pt-6 pb-20 sm:pt-8">
      <Suspense fallback={<div className="h-80 animate-pulse rounded-[32px] bg-soft" />}>
        <Recipe params={params} />
      </Suspense>
    </div>
  );
}
