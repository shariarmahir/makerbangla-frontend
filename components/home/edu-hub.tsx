import Link from "next/link";
import { ArrowUpRight, BookOpen, FlaskConical, Layers } from "lucide-react";
import { MagicLink } from "@/components/ui/magic-button";
import { products } from "@/lib/data/catalog";
import { labGuides, recipes } from "@/lib/data/learning";
import { deptTone, tones } from "@/lib/tones";
import { cn } from "@/lib/utils";
import { AnimatedLink } from "./animated-link";

const steps = ["Pick a project", "Get the exact parts", "Build it step by step"];

export function EduHub() {
  const stats = [
    { icon: FlaskConical, value: recipes.length, label: "Circuit recipes" },
    { icon: BookOpen, value: labGuides.length, label: "Department lab guides" },
    { icon: Layers, value: products.length, label: "Lab-ready parts" },
  ];
  return (
    <section aria-label="Education Hub" className="container-x reveal grid gap-5 py-10 sm:py-12 lg:grid-cols-[1.3fr_1fr]">
      {/* Education Hub */}
      <div className="relative isolate flex flex-col overflow-hidden rounded-[26px] bg-tile-ink p-6 text-white sm:p-9">
        <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-size-[28px_28px]" />
        <span aria-hidden className="absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-brand/35 blur-3xl" />
        <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] leading-none font-black tracking-tight">
          Education <span className="text-accent-yellow">Hub</span>
        </h2>
        <p className="mt-3 max-w-md text-[14px] text-white/80">Circuit recipes, sessional lab guides and the exact parts for every experiment — in one place.</p>

        <div className="mt-7 grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl bg-white/[0.06] p-3.5 ring-1 ring-white/10 sm:p-4">
              <Icon className="size-5 text-accent-yellow" />
              <p className="mt-2 text-[clamp(1.4rem,2.6vw,2rem)] leading-none font-black tabular-nums">{value}</p>
              <p className="mt-1 text-[11px] leading-tight text-white/70 sm:text-[12px]">{label}</p>
            </div>
          ))}
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {labGuides.map((g) => {
            const t = tones[deptTone[g.department] ?? "cloud"];
            return (
              <li key={g.department}>
                <Link href={`/learn#lab-${g.department.toLowerCase()}`} className={cn("inline-block rounded-full px-3.5 py-1.5 text-[11.5px] font-black transition-transform hover:-translate-y-0.5", t.bg, t.text)}>
                  {g.department}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-wrap gap-4 lg:mt-auto lg:pt-8">
          <AnimatedLink href="/learn" icon="sparkles" variant="accent" rainbow>Explore the Hub</AnimatedLink>
          <MagicLink href="/learn#lab-guides" variant="light">Lab Guides</MagicLink>
        </div>
      </div>

      {/* Make Your Recipe */}
      <div className="relative isolate flex flex-col overflow-hidden rounded-[26px] bg-tile-yellow p-6 text-ink sm:p-9">
        <span aria-hidden className="absolute -right-20 -bottom-20 -z-10 size-64 rounded-full bg-white/30" />
        <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] leading-none font-black tracking-tight">
          Make Your <span className="block">Recipe</span>
        </h2>
        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3 text-[14px] font-bold">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[12px] text-accent-yellow">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <ul className="mt-6 grid gap-x-5 gap-y-2 border-t border-ink/15 pt-5 sm:grid-cols-2">
          {recipes.slice(0, 4).map((r) => (
            <li key={r.slug}>
              <Link href={`/learn/${r.slug}`} className="group inline-flex items-center gap-1 text-[13px] font-bold">
                <span className="underline-offset-4 group-hover:underline">{r.title}</span>
                <ArrowUpRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 lg:mt-auto lg:pt-8">
          <AnimatedLink href={`/learn/${recipes[0].slug}`} icon="rocket" size="lg" rainbow>Start</AnimatedLink>
        </div>
      </div>
    </section>
  );
}
