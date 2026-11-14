import Link from "next/link";
import { BookOpen, FlaskConical, Layers } from "lucide-react";
import { products } from "@/lib/data/catalog";
import { labGuides, recipes } from "@/lib/data/learning";
import { cn } from "@/lib/utils";
import { AnimatedLink } from "./animated-link";

const deptTone = ["bg-tile-yellow text-ink", "bg-tile-teal text-ink", "bg-tile-lime text-ink", "bg-tile-pink text-ink", "bg-tile-orange text-ink", "bg-tile-sky text-ink"];

const steps = ["Pick a project", "Get the exact parts", "Build it step by step"];

export function EduHub() {
  const stats = [
    { icon: FlaskConical, value: recipes.length, label: "Circuit recipes" },
    { icon: BookOpen, value: labGuides.length, label: "Department lab guides" },
    { icon: Layers, value: products.length, label: "Lab-ready parts" },
  ];
  return (
    <section aria-label="Education Hub" className="container-x reveal grid gap-4 py-10 sm:py-12 lg:grid-cols-[1.3fr_1fr]">
      {/* Education Hub */}
      <div className="relative isolate overflow-hidden rounded-2xl bg-tile-ink p-6 text-white sm:p-9">
        <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-size-[28px_28px]" />
        <span aria-hidden className="absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-brand/30 blur-3xl" />
        <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1] font-extrabold tracking-tight">
          Education <span className="text-accent-yellow">Hub</span>
        </h2>
        <p className="mt-3 max-w-md text-[14px] text-white/80">
          Circuit recipes, sessional lab guides and the exact parts for every experiment — in one place.
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-xl bg-white/8 p-3.5 ring-1 ring-white/10 sm:p-4">
              <Icon className="size-5 text-accent-yellow" />
              <p className="mt-2 text-[clamp(1.4rem,2.6vw,2rem)] leading-none font-extrabold tabular-nums">{value}</p>
              <p className="mt-1 text-[11px] leading-tight text-white/70 sm:text-[12px]">{label}</p>
            </div>
          ))}
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {labGuides.map((g, i) => (
            <li key={g.department}>
              <Link href={`/learn#lab-${g.department.toLowerCase()}`} className={cn("inline-block rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold transition-transform hover:-translate-y-0.5", deptTone[i % deptTone.length])}>
                {g.department}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <AnimatedLink href="/learn" icon="sparkles" className="btn-pill h-11 bg-accent-yellow px-6 text-ink hover:bg-white">
            Explore the Hub
          </AnimatedLink>
          <Link href="/learn#lab-guides" className="btn-pill h-11 px-6 text-white ring-1 ring-white/30 hover:bg-white/10">
            Lab Guides
          </Link>
        </div>
      </div>

      {/* Make Your Recipe */}
      <div className="relative isolate flex flex-col overflow-hidden rounded-2xl bg-tile-yellow p-6 text-ink sm:p-9">
        <span aria-hidden className="absolute -right-20 -bottom-20 -z-10 size-64 rounded-full bg-white/30" />
        <h2 className="text-[clamp(1.9rem,3.6vw,2.9rem)] leading-[1] font-extrabold tracking-tight">
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
        <ul className="mt-6 flex flex-wrap gap-2">
          {recipes.slice(0, 4).map((r) => (
            <li key={r.slug}>
              <Link href={`/learn/${r.slug}`} className="inline-block rounded-full bg-white/65 px-3 py-1.5 text-[11.5px] font-semibold transition-colors hover:bg-white">
                {r.title}
              </Link>
            </li>
          ))}
        </ul>
        <AnimatedLink href={`/learn/${recipes[0].slug}`} icon="rocket" className="btn-pill mt-auto h-12 w-fit bg-ink px-8 text-[13px] text-white hover:bg-brand-strong max-lg:mt-7">
          Start
        </AnimatedLink>
      </div>
    </section>
  );
}
