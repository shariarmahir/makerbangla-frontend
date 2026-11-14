"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  label: string;
  /** Tailwind classes for each slide's width, e.g. "basis-1/2 lg:basis-1/4" */
  item: string;
  className?: string;
  arrows?: "sides" | "none";
  /** Vertical position of the side arrows (centre of the slide artwork). */
  arrowTop?: string;
  dots?: boolean;
  autoplay?: number;
  /** Render arrow buttons into an external slot (e.g. a section header). */
  headerArrows?: boolean;
};

export function Carousel({ children, label, item, className, arrows = "sides", arrowTop = "top-1/2", dots, autoplay, headerArrows }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [edges, setEdges] = useState({ start: true, end: false });
  const slides = Children.toArray(children);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max });
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const go = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    if (dir === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }, []);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync]);

  useEffect(() => {
    if (!autoplay || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    let paused = false;
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el?.addEventListener("pointerenter", pause);
    el?.addEventListener("pointerleave", resume);
    el?.addEventListener("focusin", pause);
    el?.addEventListener("focusout", resume);
    const t = setInterval(() => !paused && !document.hidden && go(1), autoplay);
    return () => {
      clearInterval(t);
      el?.removeEventListener("pointerenter", pause);
      el?.removeEventListener("pointerleave", resume);
      el?.removeEventListener("focusin", pause);
      el?.removeEventListener("focusout", resume);
    };
  }, [autoplay, go]);


  // Frosted arrows sit over the middle of the slides, hidden until the pointer (or keyboard focus) is on the rail.
  // Touch screens without hover always show them.
  const sideBtn =
    "absolute z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/45 text-tile-navy shadow-[0_10px_24px_-8px_rgb(14_31_77/0.45)] ring-1 ring-white/70 backdrop-blur-md transition-[opacity,translate,background-color,scale] duration-300 ease-out sm:grid opacity-0 group-hover/rail:translate-x-0 group-hover/rail:opacity-100 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-100 hover:scale-110 hover:bg-tile-yellow active:scale-95 disabled:invisible";

  return (
    <div className={cn("group/rail relative", className)} role="region" aria-roledescription="carousel" aria-label={label}>
      {headerArrows && (
        <div className="absolute -top-[3.4rem] right-2 flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label="Previous" className="grid size-9 place-items-center rounded-full text-tile-navy ring-1 ring-line transition-[opacity,background-color] hover:bg-soft disabled:pointer-events-none disabled:opacity-35">
            <ArrowLeft className="size-4" strokeWidth={2.4} />
          </button>
          {/* Always-on "explore next" cue: brand-coloured, a soft pulse ring and a nudging arrow */}
          <button type="button" onClick={() => go(1)} aria-label="Next" className="group/next relative grid size-11 place-items-center rounded-full bg-tile-navy text-tile-yellow shadow-[0_10px_22px_-8px_rgb(26_73_175/0.75)] transition-[scale,background-color] duration-300 hover:scale-105 hover:bg-tile-blue active:scale-95">
            <span aria-hidden className="absolute inset-0 rounded-full ring-2 ring-tile-blue motion-safe:animate-pulse-ring" />
            <ArrowRight className="relative size-5 motion-safe:animate-nudge-r" strokeWidth={2.6} />
          </button>
        </div>
      )}

      <div ref={ref} onScroll={sync} className="rail scroll-smooth">
        {slides.map((s, i) => (
          <div key={i} className={cn("shrink-0 snap-start", item)} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
            {s}
          </div>
        ))}
      </div>

      {arrows === "sides" && !headerArrows && (
        <>
          <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label="Previous" className={cn(sideBtn, arrowTop, "left-1 translate-x-3 sm:left-2")}>
            <ArrowLeft className="size-5 motion-safe:animate-nudge-l" strokeWidth={2.5} />
          </button>
          <button type="button" onClick={() => go(1)} disabled={edges.end} aria-label="Next" className={cn(sideBtn, arrowTop, "right-1 -translate-x-3 sm:right-2")}>
            <ArrowRight className="size-5 motion-safe:animate-nudge-r" strokeWidth={2.5} />
          </button>
        </>
      )}

      {dots && slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: "smooth" })}
              className={cn("h-1.5 rounded-full bg-ink/25 transition-[width,background-color] duration-300", i === index ? "w-6 bg-ink" : "w-1.5")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
