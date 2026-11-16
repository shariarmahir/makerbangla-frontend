import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Clock, Cog, Cpu, Factory, FlaskConical, HeartPulse, Package, PencilRuler, Zap } from "lucide-react";
import { publishedReviews, Stars } from "@/components/home/reviews";
import { card, IconCard, JoinBand, SectionHead, Steps, ToneStage } from "@/components/learn/hub";
import { Rail } from "@/components/learn/rail";
import { AddAllToCart } from "@/components/product/product-actions";
import { ProductVisual } from "@/components/product/product-visual";
import { MagicLink } from "@/components/ui/magic-button";
import { getProduct, productVisual, toRef } from "@/lib/catalog";
import { departmentNames, type Department } from "@/lib/data/catalog";
import { labGuides, recipes } from "@/lib/data/learning";
import { experiments } from "@/lib/lab/experiments";
import { deptTone, levelTone, tones } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Learning Hub — Circuit Recipes, Lab Guides & Lab Kitchen",
  description:
    "Step-by-step circuit recipes with parts lists, lab-by-lab equipment guides for EEE, CSE, Civil, Architecture, Mechanical and Biomedical sessionals, and Lab Kitchen — a virtual electronics bench in your browser.",
  alternates: { canonical: "/learn" },
};

const deptIcon: Record<Department, React.ReactNode> = {
  EEE: <Zap className="size-6" />,
  CSE: <Cpu className="size-6" />,
  CE: <Building2 className="size-6" />,
  ARCH: <PencilRuler className="size-6" />,
  ME: <Cog className="size-6" />,
  BME: <HeartPulse className="size-6" />,
  IPE: <Factory className="size-6" />,
};

async function StudentReviews() {
  const reviews = (await publishedReviews()).slice(0, 3);
  if (!reviews.length) return null;
  return (
    <section aria-labelledby="hub-reviews" className="mt-24">
      <SectionHead id="hub-reviews" title={<>What makers think about<br className="hidden sm:block" /> learning with us</>} href="/#reviews-title" />
      <ul className="grid gap-5 md:grid-cols-3">
        {reviews.map((r, i) => (
          <li key={r.id} className={cn(card, "flex flex-col p-6")}>
            <p className="flex items-center gap-3">
              <span aria-hidden className={cn("grid size-11 place-items-center rounded-full text-[14px] font-black", ["bg-tile-yellow text-tile-navy", "bg-brand text-white", "bg-tile-sky text-tile-navy"][i % 3])}>{r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0">
                <b className="block truncate text-[14px] text-ink">{r.name}</b>
                <Stars value={r.rating} className="text-tile-yellow" />
              </span>
            </p>
            <blockquote className="mt-4 line-clamp-6 text-[13.5px] leading-relaxed text-ink-2">{r.text}</blockquote>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function LearnPage() {
  return (
    <div className="container-x pt-6 pb-20 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Learning Hub</span>
      </nav>

      {/* Hero */}
      <header className="grid items-center gap-10 pt-4 md:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <h1 className="max-w-[13ch] text-[clamp(2.4rem,5.4vw,4.4rem)] leading-[1.02] font-black tracking-tight text-ink">
            Learn engineering by <span className="text-brand">building it</span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagicLink href="#recipes" variant="brand" size="lg">Start a recipe</MagicLink>
            <MagicLink href="/learn/lab-kitchen" variant="light" size="lg"><FlaskConical className="size-4" /> Open Lab Kitchen</MagicLink>
          </div>
        </div>
        <ToneStage product="arduino-starter-kit" tone="blue" alt="Arduino starter kit for students" preload className="mx-auto max-w-xl" />
      </header>

      {/* Departments */}
      <section aria-labelledby="dept-title" className="mt-24">
        <SectionHead id="dept-title" title="Explore by department" href="#lab-guides" />
        <Rail label="departments">
          {labGuides.map((g) => (
            <li key={g.department} className="w-40 shrink-0 snap-start sm:w-44">
              <IconCard href={`#lab-${g.department.toLowerCase()}`} icon={deptIcon[g.department]} title={departmentNames[g.department]} meta={`${g.labs.length} ${g.labs.length === 1 ? "course" : "courses"}`} />
            </li>
          ))}
          <li className="w-40 shrink-0 snap-start sm:w-44">
            <IconCard href="/learn/lab-kitchen" icon={<FlaskConical className="size-6" />} title="Lab Kitchen" meta={`${experiments.length} experiments`} />
          </li>
        </Rail>
      </section>

      {/* Three steps */}
      <section aria-labelledby="steps-title" className="mt-20 grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <ToneStage product="breadboard-830" tone="yellow" className="mx-auto max-w-lg" />
        <div>
          <h2 id="steps-title" className="mb-8 text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight font-black tracking-tight text-ink">Three steps to your project</h2>
          <Steps items={[
            { title: "Pick a circuit recipe or your course's lab guide", text: "Every recipe lists its parts, steps and safety notes." },
            { title: "Build and test it on the Lab Kitchen bench", text: "Wire it in the browser and check it works before you buy anything." },
            { title: "Get the exact parts and make it for real", text: "One click adds the parts list to your cart." },
          ]} />
        </div>
      </section>

      {/* Lab Kitchen offer */}
      <section aria-labelledby="free-title" className="mt-24 grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <div className="md:order-1">
          <h2 id="free-title" className="text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight font-black tracking-tight text-ink">Try Lab Kitchen for free</h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">No account and nothing to install: assemble circuits on a virtual breadboard, run a real simulation and write up {experiments.length} guided experiments.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <MagicLink href="/learn/lab-kitchen/workspace" variant="brand" size="lg">Open the bench</MagicLink>
            <MagicLink href="/learn/lab-kitchen#experiments" variant="light" size="lg">Experiments</MagicLink>
          </div>
        </div>
        <ToneStage product="digital-multimeter" tone="sky" className="mx-auto max-w-lg md:order-2" />
      </section>

      {/* Recipes */}
      <section id="recipes" aria-labelledby="recipes-title" className="mt-24 scroll-mt-24">
        <SectionHead id="recipes-title" title="Circuit recipes" />
        <div className="grid gap-x-5 gap-y-14 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {recipes.map((r) => (
            <article key={r.slug} className={cn(card, "reveal group relative flex flex-col p-3 transition hover:-translate-y-1")}>
              <div className={cn("relative -mt-12 aspect-[1.25/1] rounded-[20px]", tones[r.tone].bg)}>
                <span aria-hidden className="absolute inset-0 rounded-[20px] bg-[radial-gradient(circle_at_50%_40%,rgb(255_255_255/0.35),transparent_62%)]" />
                <ProductVisual slug={r.product} alt="" sizes="(min-width:1024px) 300px, (min-width:640px) 50vw, 100vw" inset="p-[12%]" className="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2" />
                <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold", levelTone[r.level])}>{r.level}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-2 pt-4 pb-2">
                <h3 className="text-[15.5px] leading-snug font-black text-ink">
                  <Link href={`/learn/${r.slug}`} className="after:absolute after:inset-0">{r.title}</Link>
                </h3>
                <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">{r.outcome}</p>
                <p className="mt-auto flex items-center justify-between pt-3 text-[11.5px] font-bold text-subtle">
                  <span className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock className="size-3.5" /> {r.hours} h</span>
                    <span className="flex items-center gap-1"><Package className="size-3.5" /> {r.parts.length} parts</span>
                  </span>
                  <span className="grid size-8 place-items-center rounded-full bg-soft text-ink transition-colors group-hover:bg-tile-yellow"><ArrowRight className="size-4" /></span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Lab guides */}
      <section id="lab-guides" aria-labelledby="lab-guides-title" className="mt-24 scroll-mt-24">
        <SectionHead id="lab-guides-title" title="Lab guides by department" />
        <div className="space-y-14">
          {labGuides.map((g) => {
            const t = tones[deptTone[g.department] ?? "white"];
            return (
              <section key={g.department} id={`lab-${g.department.toLowerCase()}`} aria-labelledby={`lab-${g.department}-title`} className="scroll-mt-24">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h3 id={`lab-${g.department}-title`} className="flex items-center gap-3 text-[20px] font-black tracking-tight text-ink">
                    <span className={cn("grid size-11 place-items-center rounded-2xl", t.bg, t.text)}>{deptIcon[g.department]}</span>
                    {g.title}
                  </h3>
                  <Link href={`/shop?department=${g.department}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-strong">
                    Shop {g.department} equipment <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {g.labs.map((lab, i) => {
                    const kit = lab.kit.map(getProduct).filter((p) => p !== undefined);
                    return (
                      <article key={lab.course} className={cn(card, "flex flex-col p-6")}>
                        <span className="text-[26px] leading-none font-black text-brand tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                        <h4 className="mt-3 text-[16px] leading-snug font-black text-ink">{lab.course}</h4>
                        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{lab.experiments}</p>
                        <ul className="mt-4 flex flex-wrap gap-1.5">
                          {kit.map((p) => (
                            <li key={p.slug}>
                              <Link href={`/products/${p.slug}`} className="flex items-center gap-1.5 rounded-full bg-soft py-0.5 pr-2.5 pl-0.5 text-[11.5px] font-semibold ring-1 ring-line transition-colors hover:text-brand-strong hover:ring-brand">
                                <span className="relative size-6 overflow-hidden rounded-full bg-white">
                                  <Image src={productVisual(p.slug).src} alt="" fill sizes="24px" className="object-contain p-0.5" />
                                </span>
                                <span className="max-w-40 truncate">{p.name}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto pt-5"><AddAllToCart products={kit.map(toRef)} label={`Add lab kit (${kit.length})`} className="h-10 w-full text-[12px]" /></div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <StudentReviews />

      <JoinBand top="Makerbangla" bottom="Learning Hub" left="arduino-uno-r3" right="raspberry-pi-4">
        <MagicLink href="/learn/lab-kitchen" variant="accent" size="lg" rainbow>Start building!</MagicLink>
      </JoinBand>
    </div>
  );
}
