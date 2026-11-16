"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal card rail with previous/next arrows (no visible scrollbar), as in the reference's course row. */
export function Rail({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const go = (dir: number) => ref.current?.scrollBy({ left: dir * Math.max(240, ref.current.clientWidth * 0.8), behavior: "smooth" });
  const arrow = "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_10px_24px_-10px_rgb(14_31_77/0.5)] ring-1 ring-line transition hover:text-brand sm:grid";
  return (
    <div className={cn("relative sm:px-12", className)}>
      <button type="button" onClick={() => go(-1)} aria-label={`Previous ${label}`} className={cn(arrow, "left-0")}><ChevronLeft className="size-5" /></button>
      <ul ref={ref} aria-label={label} className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-2 pb-6 [scrollbar-width:none] sm:mx-0 sm:px-1 [&::-webkit-scrollbar]:hidden">
        {children}
      </ul>
      <button type="button" onClick={() => go(1)} aria-label={`Next ${label}`} className={cn(arrow, "right-0")}><ChevronRight className="size-5" /></button>
    </div>
  );
}
