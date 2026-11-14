"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  label: string;
  /** Tailwind classes for each slide's width, e.g. "basis-1/2 lg:basis-1/4" */
  item: string;
  className?: string;
  arrows?: "sides" | "none";
  dots?: boolean;
  autoplay?: number;
  /** Render arrow buttons into an external slot (e.g. a section header). */
  headerArrows?: boolean;
};

export function Carousel({ children, label, item, className, arrows = "sides", dots, autoplay, headerArrows }: Props) {
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

  const arrowBtn = "grid size-8 place-items-center rounded-full border border-line bg-white text-ink shadow-sm transition-[opacity,background-color] hover:bg-accent-yellow disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className={cn("relative", className)} role="region" aria-roledescription="carousel" aria-label={label}>
      {headerArrows && (
        <div className="absolute -top-12 right-0 flex gap-1.5">
          <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label="Previous" className={cn(arrowBtn, "disabled:opacity-40")}><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next" className={arrowBtn}><ChevronRight className="size-4" /></button>
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
          <button type="button" onClick={() => go(-1)} disabled={edges.start} aria-label="Previous" className={cn(arrowBtn, "absolute top-1/2 -left-3 z-10 hidden -translate-y-1/2 sm:grid")}><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => go(1)} disabled={edges.end} aria-label="Next" className={cn(arrowBtn, "absolute top-1/2 -right-3 z-10 hidden -translate-y-1/2 sm:grid")}><ChevronRight className="size-4" /></button>
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
