import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productVisual } from "@/lib/catalog";
import { tones, type ToneName } from "@/lib/tones";
import { cn } from "@/lib/utils";

/**
 * Learning Hub design kit: clean white sections, big confident headings, colour tiles with a product cut-out
 * rising out of the top edge, soft-shadow cards, numbered steps and a closing join band.
 */

export const card = "rounded-[24px] bg-white shadow-[0_22px_48px_-26px_rgb(14_31_77/0.42)] ring-1 ring-line/70";

/** Rounded colour tile with a product cut-out that rises above its top edge. */
export function ToneStage({ product, tone, alt = "", className, size = "(min-width:1024px) 520px, 90vw", preload, children }: { product: string; tone: ToneName; alt?: string; className?: string; size?: string; preload?: boolean; children?: React.ReactNode }) {
  return (
    <div className={cn("relative isolate aspect-[1.32/1] w-full", className)}>
      <div className={cn("absolute inset-x-0 bottom-0 top-[22%] -z-10 overflow-hidden rounded-[34px]", tones[tone].bg)}>
        <span aria-hidden className="absolute -right-10 -bottom-16 size-64 rounded-full bg-white/20 blur-2xl" />
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.35),transparent_55%)]" />
      </div>
      <span aria-hidden className="absolute bottom-[5%] left-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-xl" />
      <div className="absolute inset-x-[9%] top-0 bottom-[4%] motion-safe:animate-float">
        <Image src={productVisual(product).src} alt={alt} fill sizes={size} preload={preload} className="cutout-shadow object-contain object-bottom" />
      </div>
      {children}
    </div>
  );
}

/** Centred section title with an optional "Show all" link on the right (as in the reference layout). */
export function SectionHead({ id, title, href, link = "Show all", className }: { id?: string; title: React.ReactNode; href?: string; link?: string; className?: string }) {
  return (
    <div className={cn("relative mb-8 flex flex-col items-center gap-2 text-center sm:block", className)}>
      <h2 id={id} className="text-[clamp(1.6rem,3.2vw,2.4rem)] leading-tight font-black tracking-tight text-ink">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-brand-strong sm:absolute sm:top-1/2 sm:right-0 sm:-translate-y-1/2">
          {link} <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

/** Numbered steps: big brand-blue 01 / 02 / 03 beside short text. */
export function Steps({ items }: { items: { title: string; text?: string }[] }) {
  return (
    <ol className="space-y-6">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-5">
          <span className="w-12 shrink-0 text-[clamp(1.8rem,3vw,2.4rem)] leading-none font-black text-brand tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <span className="pt-1">
            <b className="block text-[16px] leading-snug text-ink">{s.title}</b>
            {s.text && <span className="mt-1 block text-[13.5px] leading-relaxed text-subtle">{s.text}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** White icon card with a soft shadow (department / course tiles). */
export function IconCard({ href, icon, title, meta, className }: { href: string; icon: React.ReactNode; title: string; meta?: string; className?: string }) {
  return (
    <Link href={href} className={cn(card, "group flex h-full flex-col items-center justify-center gap-3 px-4 py-6 text-center transition hover:-translate-y-1 hover:shadow-[0_28px_56px_-26px_rgb(14_31_77/0.55)]", className)}>
      <span className="grid size-14 place-items-center rounded-2xl bg-tile-sky/50 text-tile-navy transition-colors group-hover:bg-tile-yellow">{icon}</span>
      <span>
        <b className="block text-[14px] leading-tight text-ink">{title}</b>
        {meta && <span className="mt-1 block text-[11.5px] font-semibold text-subtle">{meta}</span>}
      </span>
    </Link>
  );
}

/** Closing band: a two-tone title above a brand tile with cut-outs rising out of both ends and one big call to action. */
export function JoinBand({ top, bottom, left, right, children }: { top: string; bottom: string; left: string; right: string; children: React.ReactNode }) {
  return (
    <section className="mt-24 sm:mt-28">
      <p className="text-center text-[clamp(2rem,5vw,3.6rem)] leading-[0.9] font-black tracking-tight">
        <span className="block text-brand">{top}</span>
        <span className="block text-ink">{bottom}</span>
      </p>
      <div className="relative isolate mt-6 overflow-visible">
        <div className="relative -z-10 grid min-h-56 place-items-center overflow-hidden rounded-[34px] bg-[radial-gradient(ellipse_at_50%_40%,color-mix(in_srgb,var(--color-tile-blue)_75%,white)_0%,var(--color-tile-blue)_45%,var(--color-brand-strong)_100%)] px-6 py-12 sm:min-h-64">
          <span aria-hidden className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-size-[26px_26px]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center px-[24%] sm:px-[28%]">{children}</div>
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-[1%] h-[135%] w-[26%] max-w-72 sm:left-[3%] sm:w-[30%]">
          <Image src={productVisual(left).src} alt="" fill sizes="300px" className="cutout-shadow object-contain object-bottom motion-safe:animate-float" />
        </div>
        <div aria-hidden className="pointer-events-none absolute right-[1%] bottom-0 h-[135%] w-[26%] max-w-72 sm:right-[3%] sm:w-[30%]">
          <Image src={productVisual(right).src} alt="" fill sizes="300px" className="cutout-shadow object-contain object-bottom motion-safe:animate-float [animation-delay:-3s]" />
        </div>
      </div>
    </section>
  );
}
