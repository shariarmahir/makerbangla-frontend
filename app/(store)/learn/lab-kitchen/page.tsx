import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Cpu, XCircle } from "lucide-react";
import { CircuitPreview } from "@/components/lab/circuit-art";
import { MyProjects } from "@/components/lab/my-projects";
import { Carousel } from "@/components/home/carousel";
import { SlideView, type Slide } from "@/components/home/hero";
import { card, JoinBand, SectionHead, Steps, ToneStage } from "@/components/learn/hub";
import { Rail } from "@/components/learn/rail";
import { MagicLink } from "@/components/ui/magic-button";
import { ENGINE } from "@/lib/lab/engine";
import { experiments } from "@/lib/lab/experiments";
import { CATEGORIES, defaults, MODELS } from "@/lib/lab/models";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Lab Kitchen — Build and Simulate Circuits in Your Browser",
  description: "Assemble circuits on a virtual breadboard with diodes, transistors, an oscilloscope and a function generator, run a real simulation, follow guided EEE experiments with lab reports, and turn your parts list into a Makerbangla cart.",
  alternates: { canonical: "/learn/lab-kitchen" },
};

const works = [
  "DC analysis of resistor networks, dividers and bridges",
  "Diodes, LEDs and BC547 transistors with the diode equation",
  "Bench supply with a real current limit (CV / CC)",
  "Function generator and two-channel oscilloscope traces",
  "RC charging, filtering and time constants",
  "Switches, push buttons, potentiometers and a light sensor",
];
const notYet = [
  "Running Arduino or ESP32 sketches — needs a licensed microcontroller engine",
  "AC mains, three-phase and motor circuits",
  "Op-amps, logic ICs and MOSFETs",
  "Class accounts, assignments and grading for institutions",
];

const heroSlides = (parts: number): Slide[] => [
  {
    product: "breadboard-830",
    alt: "830-point solderless breadboard",
    kicker: "Lab Kitchen",
    title: <>Cook circuits.<br />Test them live.</>,
    titleWidth: "max-w-none",
    watermark: "Kitchen",
    cta: "Open the bench",
    href: "/learn/lab-kitchen/workspace",
    tone: "yellow",
    description: "A virtual electronics bench in your browser, with a real circuit solver behind every reading.",
  },
  {
    product: "digital-oscilloscope",
    alt: "Digital storage oscilloscope",
    kicker: `${experiments.length} guided experiments`,
    title: "Real Lab Tests",
    watermark: "Sessional",
    cta: "See experiments",
    href: "#experiments",
    tone: "navy",
    description: "Theory, procedure and expected values, an observation table on the bench and a PDF lab report.",
  },
  {
    product: "function-generator",
    alt: "Function generator",
    kicker: `${parts} bench parts`,
    title: "Accurate Parts",
    watermark: "Signals",
    cta: "Component library",
    href: "/learn/lab-kitchen/components",
    tone: "blue",
    description: "Diode-equation LEDs, a BC547 transistor, a current-limited supply, function generator and 2-channel scope.",
  },
  {
    product: "digital-multimeter",
    alt: "Digital multimeter",
    kicker: "Parts to cart",
    title: "Build It For Real",
    watermark: "Measure",
    cta: "Shop test gear",
    href: "/shop?category=test-measurement",
    tone: "sky",
    description: "Your circuit's parts list maps to store products, with exact matches and kits clearly labelled.",
  },
];
const stageTones = ["bg-tile-yellow", "bg-tile-sky", "bg-tile-blue", "bg-tile-navy"];

export default function LabKitchenPage() {
  const library = CATEGORIES.flatMap((cat) => Object.values(MODELS).filter((m) => m.category === cat));

  return (
    <div className="container-x pt-6 pb-20 sm:pt-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/learn" className="hover:text-ink">Learning Hub</Link><span aria-hidden>/</span>
        <span className="text-ink">Lab Kitchen</span>
      </nav>

      {/* Hero: the same slide component as the shop landing page */}
      <header>
        <Carousel label="Lab Kitchen highlights" item="basis-full" arrows="none" dots autoplay={6500}>
          {heroSlides(library.length).map((s, i) => (
            <SlideView key={s.product} s={s} first={i === 0} heading={i === 0 ? "h1" : "h2"} />
          ))}
        </Carousel>
      </header>

      {/* How it works */}
      <section aria-labelledby="how-title" className="mt-24 grid items-center gap-12 md:grid-cols-2 lg:gap-20">
        <ToneStage product="arduino-uno-r3" tone="yellow" className="mx-auto max-w-lg" />
        <div>
          <h2 id="how-title" className="mb-8 text-[clamp(1.7rem,3.4vw,2.6rem)] leading-tight font-black tracking-tight text-ink">Four steps from idea to parts</h2>
          <Steps items={[
            { title: "Assemble", text: "Drag a breadboard, sources, parts and instruments onto the bench." },
            { title: "Wire", text: "Push leads into breadboard holes or click pin to pin — every connection is checked." },
            { title: "Run & check", text: "The solver computes every voltage and current; problems are explained, not hidden." },
            { title: "Parts to cart", text: "Your parts list maps to store products, with exact matches and kits clearly labelled." },
          ]} />
        </div>
      </section>

      <MyProjects />

      {/* Experiments */}
      <section id="experiments" aria-labelledby="experiments-title" className="mt-24 scroll-mt-24">
        <SectionHead id="experiments-title" title="Guided experiments" />
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {experiments.map((e, i) => (
            <li key={e.slug} className={cn(card, "reveal group relative flex flex-col p-3 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-28px_rgb(14_31_77/0.55)]")}>
              <div className={cn("rounded-[18px] p-3", stageTones[i % 4])}>
                <div className="grid aspect-16/9 place-items-center rounded-[14px] bg-white p-2.5">
                  <CircuitPreview c={e.circuit} title={`${e.title} circuit`} className="size-full transition-transform duration-500 group-hover:scale-[1.03]" />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 px-2 pt-4 pb-2">
                <p className="flex items-center gap-3 text-[11.5px] font-bold text-subtle">
                  <span className="rounded-full bg-tile-sky/50 px-2 py-0.5 text-tile-navy">{e.level}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {e.minutes} min</span>
                  <span>{e.analysis === "transient" ? "Transient" : "DC"}</span>
                </p>
                <h3 className="text-[16.5px] leading-snug font-black text-ink"><Link href={`/learn/lab-kitchen/experiments/${e.slug}`} className="after:absolute after:inset-0">{e.title}</Link></h3>
                <p className="line-clamp-2 text-[13px] leading-snug text-ink-2">{e.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Library */}
      <section aria-labelledby="library-title" className="mt-24">
        <SectionHead id="library-title" title="On the bench" href="/learn/lab-kitchen/components" />
        <Rail label="bench parts">
          {library.map((m) => (
            <li key={m.kind} className="w-40 shrink-0 snap-start sm:w-44">
              <Link href={`/learn/lab-kitchen/components#${m.kind}`} className={cn(card, "flex h-full flex-col items-center gap-2 p-4 text-center transition hover:-translate-y-1")}>
                <span className="grid h-20 w-full place-items-center rounded-2xl bg-soft p-2">
                  <CircuitPreview c={{ parts: [{ id: "x", kind: m.kind, label: "", x: 0, y: 0, rot: 0, props: defaults(m.kind) }], wires: [] }} title={m.name} className="size-full" />
                </span>
                <b className="text-[12.5px] leading-tight text-ink">{m.name}</b>
                <span className="text-[11px] font-semibold text-subtle">{m.category}</span>
              </Link>
            </li>
          ))}
        </Rail>
      </section>

      {/* Honest capability statement */}
      <section aria-labelledby="engine-title" className="mt-20 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[28px] bg-tile-navy p-7 text-white sm:p-9">
          <h2 id="engine-title" className="text-[clamp(1.4rem,2.6vw,1.9rem)] leading-tight font-black text-tile-yellow">What the simulator does today</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {works.map((w) => <li key={w} className="flex gap-2 text-[13.5px] leading-snug text-white/85"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-tile-yellow" /> {w}</li>)}
          </ul>
          <p className="mt-7 text-[12px] text-white/60">{ENGINE.name} {ENGINE.version} · {ENGINE.method}. Every guided experiment is checked against hand calculations.</p>
        </div>
        <div className={cn(card, "flex flex-col p-7 sm:p-9")}>
          <h3 className="text-[17px] font-black text-ink">Not available yet</h3>
          <ul className="mt-4 space-y-2.5">
            {notYet.map((w) => <li key={w} className="flex gap-2 text-[13.5px] leading-snug text-subtle"><XCircle className="mt-0.5 size-4 shrink-0 text-line" /> {w}</li>)}
          </ul>
          <p className="mt-5 flex gap-2 rounded-2xl bg-tile-butter/60 p-3.5 text-[12.5px] leading-snug text-tile-navy"><Cpu className="mt-0.5 size-4 shrink-0" /> Lab Kitchen never fakes a run: anything the engine can’t model is marked as unavailable.</p>
          <Link href="/contact" className="mt-auto inline-flex items-center gap-1 pt-5 text-[13px] font-bold text-brand hover:text-brand-strong">Running sessional labs for a department? Talk to us <ArrowRight className="size-3.5" /></Link>
        </div>
      </section>

      <JoinBand top="Lab" bottom="Kitchen" left="digital-multimeter" right="digital-oscilloscope">
        <MagicLink href="/learn/lab-kitchen/workspace" variant="accent" size="lg" rainbow>Open the bench!</MagicLink>
      </JoinBand>
    </div>
  );
}
