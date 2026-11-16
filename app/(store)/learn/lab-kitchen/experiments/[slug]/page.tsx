import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, Clock, FlaskConical, Sigma } from "lucide-react";
import { CircuitPreview } from "@/components/lab/circuit-art";
import { card, JoinBand, Steps } from "@/components/learn/hub";
import { AddAllToCart } from "@/components/product/product-actions";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { getProduct, toRef } from "@/lib/catalog";
import { buildBom } from "@/lib/lab/bom";
import { fmt, simulateDc, simulateTransient } from "@/lib/lab/engine";
import { experiments, getExperiment } from "@/lib/lab/experiments";
import { bdt, cn } from "@/lib/utils";

export function generateStaticParams() {
  return experiments.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/lab-kitchen/experiments/[slug]">): Promise<Metadata> {
  const e = getExperiment((await params).slug);
  if (!e) return {};
  return {
    title: `${e.title} — Lab Kitchen Experiment`,
    description: `${e.summary} ${e.level}, about ${e.minutes} minutes, simulated in your browser with an observation table and lab report.`,
    alternates: { canonical: `/learn/lab-kitchen/experiments/${e.slug}` },
  };
}

const matchText = { exact: "Exact match", kit: "In a kit", compatible: "Compatible" } as const;
const stage = ["bg-tile-yellow", "bg-tile-sky", "bg-tile-blue", "bg-tile-navy"];

async function ExperimentView({ params }: Pick<PageProps<"/learn/lab-kitchen/experiments/[slug]">, "params">) {
  const e = getExperiment((await params).slug);
  if (!e) notFound();
  const idx = experiments.indexOf(e);
  const next = experiments[(idx + 1) % experiments.length];
  const result = e.analysis === "transient" ? simulateTransient(e.circuit, e.duration ?? 1).final : simulateDc(e.circuit);
  const { rows, picks } = buildBom(e.circuit);
  const products = picks.flatMap((p) => {
    const pr = getProduct(p.slug);
    return pr ? [{ pick: p, product: pr }] : [];
  });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/learn" className="hover:text-ink">Learning Hub</Link><span aria-hidden>/</span>
        <Link href="/learn/lab-kitchen" className="hover:text-ink">Lab Kitchen</Link><span aria-hidden>/</span>
        <span className="text-ink">{e.title}</span>
      </nav>

      <header className="grid items-center gap-12 pt-4 md:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <p className="flex flex-wrap items-center gap-3 text-[12.5px] font-bold text-subtle">
            <span className="rounded-full bg-tile-yellow px-3 py-1 text-[11.5px] font-black text-tile-navy">{e.level}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> {e.minutes} min</span>
            <span>{e.analysis === "transient" ? "Transient analysis" : "DC analysis"}</span>
          </p>
          <h1 className="mt-5 text-[clamp(2.2rem,4.8vw,3.8rem)] leading-[1.02] font-black tracking-tight text-ink">{e.title}</h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">{e.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagicLink href={`/learn/lab-kitchen/workspace?x=${e.slug}`} variant="brand" size="lg"><FlaskConical className="size-4" /> Start on the bench</MagicLink>
            <MagicAnchor href="#expected" variant="light" size="lg">Expected values</MagicAnchor>
          </div>
        </div>
        <div className="relative pt-10">
          <div className={cn("absolute inset-x-0 top-[22%] bottom-0 -z-10 rounded-[34px]", stage[idx % 4])} />
          <div className="mx-6 rounded-[24px] bg-white p-3 shadow-[0_40px_80px_-40px_rgb(14_31_77/0.75)] ring-1 ring-line motion-safe:animate-float sm:mx-10">
            <CircuitPreview c={e.circuit} result={result} title={`${e.title} circuit, simulated`} className="h-auto w-full" />
          </div>
          <div className="h-8" />
        </div>
      </header>

      <div className="mt-20 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0 space-y-6">
          <section className={cn(card, "p-7")}>
            <h2 className="text-[20px] font-black text-ink">You will</h2>
            <ul className="mt-4 space-y-2.5">
              {e.outcomes.map((o) => <li key={o} className="flex gap-2.5 text-[14px] leading-snug text-ink"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" /> {o}</li>)}
            </ul>
          </section>
          <section className={cn(card, "p-7")}>
            <h2 className="text-[20px] font-black text-ink">Theory</h2>
            {e.theory.map((t) => <p key={t} className="mt-3 text-[14px] leading-relaxed text-ink-2">{t}</p>)}
            <p className="mt-5 flex items-center gap-2 rounded-2xl bg-tile-sky/50 px-4 py-3 text-[14.5px] font-black text-tile-navy"><Sigma className="size-4 shrink-0" /> {e.formula}</p>
          </section>
          <section className={cn(card, "p-7")}>
            <h2 className="mb-6 text-[20px] font-black text-ink">Procedure</h2>
            <Steps items={e.steps.map((s) => ({ title: s }))} />
          </section>
          <section id="expected" className={cn(card, "scroll-mt-28 p-7")}>
            <h2 className="text-[20px] font-black text-ink">Expected values</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-[13.5px]">
                <thead className="text-[11px] tracking-wider text-subtle uppercase"><tr><th className="py-1.5 font-black">Condition</th><th className="font-black">Quantity</th><th className="font-black">Expected</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {e.rows.flatMap((row) => row.readings.map((rd, i) => (
                    <tr key={`${row.id}${rd.part}`}>
                      <td className="py-2.5 font-bold text-ink">{i === 0 ? row.label : ""}</td>
                      <td className="text-ink">{rd.label}{rd.at !== undefined ? ` at ${fmt(rd.at, "s")}` : ""}</td>
                      <td className="font-black text-tile-navy tabular-nums">{fmt(rd.expected, rd.unit, 4)} <span className="font-semibold text-subtle">{rd.abs ? "(≈ 0)" : `±${Math.round(rd.tol * 100)}%`}</span></td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[12.5px] text-subtle">Worked out by hand from the formula above; on the bench you record the simulated readings and the report marks each one as matched or not.</p>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <section className={cn(card, "p-7")}>
            <h2 className="text-[20px] font-black text-ink">Parts for the real bench</h2>
            <ul className="mt-3 divide-y divide-line">
              {rows.map((r) => (
                <li key={r.key} className="flex items-baseline justify-between gap-3 py-2.5 text-[13px]">
                  <span className="text-ink"><b className="tabular-nums">{r.qty}×</b> {r.label}</span>
                  <span className="shrink-0 text-[11px] font-bold text-subtle">{r.product ? matchText[r.product.match] : "Not stocked"}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-4 space-y-3">
              {products.map(({ pick, product }) => (
                <li key={pick.slug} className="flex items-center gap-3">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-soft"><Image src={toRef(product).image} alt="" width={44} height={44} className="size-10 object-contain" /></span>
                  <span className="min-w-0 flex-1">
                    <Link href={`/products/${product.slug}`} className="line-clamp-1 text-[12.5px] font-bold text-ink hover:text-brand-strong">{product.name}</Link>
                    <span className="text-[11px] text-subtle">{matchText[pick.match]}</span>
                  </span>
                  <span className="text-[12.5px] font-black text-brand-strong tabular-nums">{bdt(product.price)}</span>
                </li>
              ))}
            </ul>
            <AddAllToCart products={products.filter(({ product }) => product.stock > 0).map(({ product }) => toRef(product))} label="Add these to cart" className="mt-6 w-full" />
            <p className="mt-3 text-[11.5px] leading-snug text-subtle">Kits are assortments — check the values you need are included. Prices and stock are confirmed at checkout.</p>
          </section>
          <Link href={`/learn/lab-kitchen/experiments/${next.slug}`} className={cn(card, "group flex items-center justify-between gap-4 p-5")}>
            <span>
              <span className="block text-[12px] font-bold text-subtle">Next experiment</span>
              <span className="mt-0.5 block text-[15px] font-black text-ink">{next.title}</span>
            </span>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-tile-yellow text-tile-navy transition-transform group-hover:translate-x-1"><ArrowRight className="size-4" /></span>
          </Link>
        </aside>
      </div>

      <JoinBand top="Lab" bottom="Kitchen" left="breadboard-830" right="digital-multimeter">
        <MagicLink href={`/learn/lab-kitchen/workspace?x=${e.slug}`} variant="accent" size="lg" rainbow>Start the experiment!</MagicLink>
      </JoinBand>
    </>
  );
}

export default function ExperimentPage({ params }: PageProps<"/learn/lab-kitchen/experiments/[slug]">) {
  return (
    <div className="container-x pt-6 pb-20 sm:pt-8">
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-[32px] bg-soft" />}>
        <ExperimentView params={params} />
      </Suspense>
    </div>
  );
}
