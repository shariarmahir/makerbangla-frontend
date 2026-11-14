import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, FlaskConical, Layers, Package } from "lucide-react";
import { AddAllToCart } from "@/components/product/product-actions";
import { ProductVisual } from "@/components/product/product-visual";
import { getProduct, productVisual, toRef } from "@/lib/catalog";
import { labGuides, recipes } from "@/lib/data/learning";
import { levelTone, tones, type ToneName } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learning Hub — Circuit Recipes & Lab Guides",
  description:
    "Step-by-step circuit recipes with parts lists, plus lab-by-lab equipment guides for EEE, CSE, Civil, Architecture, Mechanical and Biomedical sessionals in Bangladesh.",
  alternates: { canonical: "/learn" },
};



const deptTone: Record<string, ToneName> = { EEE: "yellow", CSE: "teal", CE: "lime", ARCH: "pink", ME: "orange", BME: "sky" };

export default function LearnPage() {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Learning Hub</span>
      </nav>

      {/* Hub header */}
      <header className="relative isolate overflow-hidden rounded-2xl bg-tile-ink px-6 py-9 text-white sm:px-10 sm:py-12">
        <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-size-[28px_28px]" />
        <span aria-hidden className="absolute -top-20 -right-20 -z-10 size-72 rounded-full bg-tile-violet/40 blur-3xl" />
        <h1 className="text-[clamp(2rem,4.6vw,3.4rem)] leading-none font-black tracking-tight">
          Learning <span className="text-accent-yellow">Hub</span>
        </h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#recipes" className="btn-pill h-11 bg-accent-yellow px-6 text-ink hover:bg-white"><FlaskConical className="size-4" /> {recipes.length} Circuit Recipes</a>
          <a href="#lab-guides" className="btn-pill h-11 px-6 text-white ring-1 ring-white/30 hover:bg-white/10"><Layers className="size-4" /> {labGuides.length} Lab Guides</a>
        </div>
      </header>

      {/* Recipes */}
      <section id="recipes" aria-labelledby="recipes-title" className="mt-12 scroll-mt-4">
        <h2 id="recipes-title" className="section-title">Circuit Recipes</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((r) => (
            <article key={r.slug} className="reveal group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_20px_44px_-26px_rgb(0_0_0/0.45)]">
              <div className={cn("relative aspect-4/3 overflow-hidden", tones[r.tone].bg)}>
                <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgb(255_255_255/0.4),transparent_62%)]" />
                <ProductVisual slug={r.product} alt="" sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw" inset="p-[14%]" plate="inset-[14%_20%]" className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2" />
                <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold", levelTone[r.level])}>{r.level}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="flex items-center gap-3 text-[11.5px] font-semibold text-subtle">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {r.hours} h</span>
                  <span className="flex items-center gap-1"><Package className="size-3.5" /> {r.parts.length} parts</span>
                </p>
                <h3 className="text-[15.5px] leading-snug font-extrabold">
                  <Link href={`/learn/${r.slug}`} className="after:absolute after:inset-0">{r.title}</Link>
                </h3>
                <p className="line-clamp-3 text-[12.5px] text-ink-2">{r.outcome}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[12.5px] font-extrabold text-brand-strong">
                  Open recipe <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Lab guides */}
      <section id="lab-guides" aria-labelledby="lab-guides-title" className="mt-14 scroll-mt-4">
        <h2 id="lab-guides-title" className="section-title">Lab Guides</h2>
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {labGuides.map((g) => {
            const t = tones[deptTone[g.department] ?? "cloud"];
            return (
              <li key={g.department}>
                <a href={`#lab-${g.department.toLowerCase()}`} className={cn("flex h-full flex-col justify-between gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-1", t.bg, t.text)}>
                  <span className="text-[clamp(1.3rem,2.4vw,1.8rem)] leading-none font-black">{g.department}</span>
                  <span className="text-[11px] leading-tight font-semibold opacity-85">{g.labs.length} {g.labs.length === 1 ? "course" : "courses"}</span>
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 space-y-10">
          {labGuides.map((g) => {
            const t = tones[deptTone[g.department] ?? "cloud"];
            return (
              <section key={g.department} id={`lab-${g.department.toLowerCase()}`} aria-labelledby={`lab-${g.department}-title`} className="scroll-mt-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 id={`lab-${g.department}-title`} className="flex items-center gap-3 text-[18px] font-extrabold tracking-tight">
                    <span className={cn("rounded-lg px-2.5 py-1 text-[13px] font-black", t.bg, t.text)}>{g.department}</span>
                    {g.title}
                  </h3>
                  <Link href={`/shop?department=${g.department}`} className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-strong hover:underline">
                    Shop {g.department} equipment <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.labs.map((lab, i) => {
                    const kit = lab.kit.map(getProduct).filter((p) => p !== undefined);
                    return (
                      <article key={lab.course} className="flex flex-col rounded-2xl border border-line bg-white p-5">
                        <p className="text-[11px] font-extrabold tracking-wider text-subtle uppercase">Course {String(i + 1).padStart(2, "0")}</p>
                        <h4 className="mt-1 text-[15px] leading-snug font-extrabold">{lab.course}</h4>
                        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{lab.experiments}</p>
                        <ul className="mt-4 flex flex-wrap gap-1.5">
                          {kit.map((p) => (
                            <li key={p.slug}>
                              <Link href={`/products/${p.slug}`} className="flex items-center gap-1.5 rounded-full border border-line py-0.5 pr-2.5 pl-0.5 text-[11.5px] font-semibold transition-colors hover:border-brand hover:text-brand-strong">
                                <span className="relative size-6 overflow-hidden rounded-full bg-soft">
                                  <Image src={productVisual(p.slug).src} alt="" fill sizes="24px" className="object-contain p-0.5" />
                                </span>
                                <span className="max-w-40 truncate">{p.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <AddAllToCart products={kit.map(toRef)} label={`Add lab kit (${kit.length})`} className="mt-5 h-10 w-full text-[12px]" />
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </div>
  );
}
