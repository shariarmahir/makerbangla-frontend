import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { CircuitPreview } from "@/components/lab/circuit-art";
import { card, JoinBand, SectionHead, ToneStage } from "@/components/learn/hub";
import { MagicLink } from "@/components/ui/magic-button";
import { getProduct, toRef } from "@/lib/catalog";
import { pinsOf, type Part } from "@/lib/lab/engine";
import { CATEGORIES, defaults, MODELS } from "@/lib/lab/models";
import { bdt, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lab Kitchen Component Library",
  description: "Every part and instrument on the Lab Kitchen bench: pinout, ratings, how the simulator models it, and the matching Makerbangla product.",
  alternates: { canonical: "/learn/lab-kitchen/components" },
};

const matchText = { exact: "Exact match", kit: "In a kit", compatible: "Compatible" } as const;

export default function ComponentsPage() {
  const count = Object.keys(MODELS).length;
  return (
    <div className="container-x pt-6 pb-20 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/learn" className="hover:text-ink">Learning Hub</Link><span aria-hidden>/</span>
        <Link href="/learn/lab-kitchen" className="hover:text-ink">Lab Kitchen</Link><span aria-hidden>/</span>
        <span className="text-ink">Components</span>
      </nav>

      <header className="grid items-center gap-10 pt-4 md:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <h1 className="text-[clamp(2.3rem,5vw,4rem)] leading-[1.02] font-black tracking-tight text-ink">
            {count} parts and <span className="text-brand">instruments</span>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2">How each one is wired, what it’s rated for, how the simulator models it — and the real part in the store.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagicLink href="/learn/lab-kitchen/workspace" variant="brand" size="lg"><FlaskConical className="size-4" /> Open the bench</MagicLink>
            <MagicLink href="/learn/lab-kitchen#experiments" variant="light" size="lg">Experiments</MagicLink>
          </div>
        </div>
        <ToneStage product="digital-oscilloscope" tone="sky" alt="Digital storage oscilloscope" preload className="mx-auto max-w-lg" />
      </header>

      {CATEGORIES.map((cat) => {
        const models = Object.values(MODELS).filter((m) => m.category === cat);
        if (!models.length) return null;
        return (
          <section key={cat} aria-labelledby={`cat-${cat}`} className="mt-20">
            <SectionHead id={`cat-${cat}`} title={cat} />
            <ul className="grid gap-6 md:grid-cols-2">
              {models.map((m) => {
                const sample: Part = { id: "x", kind: m.kind, label: "", x: 0, y: 0, rot: 0, props: defaults(m.kind) };
                const link = m.product(sample);
                const product = link ? getProduct(link.slug) : undefined;
                const pins = pinsOf(m.kind);
                return (
                  <li key={m.kind} id={m.kind} className={cn(card, "grid scroll-mt-28 gap-5 p-5 sm:grid-cols-[160px_1fr]")}>
                    <div className="grid place-items-center rounded-[20px] bg-soft p-3">
                      <CircuitPreview c={{ parts: [sample], wires: [] }} title={m.name} className="h-28 w-full" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-black text-ink">{m.name}</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{m.blurb}</p>
                      <dl className="mt-3 space-y-1.5 text-[12.5px]">
                        <div><dt className="inline font-bold text-ink">Model: </dt><dd className="inline text-subtle">{m.model}</dd></div>
                        {m.ratings.length > 0 && <div><dt className="inline font-bold text-ink">Ratings: </dt><dd className="inline text-subtle">{m.ratings.join(" · ")}</dd></div>}
                        <div>
                          <dt className="inline font-bold text-ink">Pins: </dt>
                          <dd className="inline text-subtle">{m.kind === "breadboard" ? `${pins.length} holes — rows a–j in 30 columns, plus four rails` : m.kind === "arduino" ? "D0–D13, A0–A5, 5V, 3V3, three GND (VIN, AREF, IOREF, RESET not modelled)" : pins.map((p) => m.pinNames[p.id] ?? p.id).join(" · ")}</dd>
                        </div>
                      </dl>
                      {product && link ? (
                        <Link href={`/products/${product.slug}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-soft p-2.5 ring-1 ring-line transition hover:ring-brand">
                          <Image src={toRef(product).image} alt="" width={44} height={44} className="size-11 shrink-0 object-contain" />
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-1 text-[12.5px] font-bold text-ink">{product.name}</span>
                            <span className="line-clamp-2 text-[11px] text-subtle">{matchText[link.match]} · {link.note}</span>
                          </span>
                          <span className="text-[12.5px] font-black text-brand-strong tabular-nums">{bdt(product.price)}</span>
                        </Link>
                      ) : (
                        <p className="mt-4 text-[12px] font-semibold text-subtle">{m.kind === "ground" ? "A reference symbol, not a part you buy." : "Not stocked in the store yet — no substitute is suggested."}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <JoinBand top="Lab" bottom="Kitchen" left="function-generator" right="bench-power-supply">
        <MagicLink href="/learn/lab-kitchen/workspace" variant="accent" size="lg" rainbow>Open the bench!</MagicLink>
      </JoinBand>
    </div>
  );
}
