"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { MagicLink } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

export type Offer = {
  label: string;
  words: [string, string];
  sticker: { big: string; small: string } | null;
  note: string;
  name: string;
  text: string;
  price: string;
  oldPrice?: string;
  href: string;
  image: string;
  bg: string;
  dark: boolean;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function PromoSlides({ offers }: { offers: Offer[] }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (offers.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % offers.length);
    }, 4500);
    return () => clearInterval(t);
  }, [offers.length]);

  const o = offers[i];
  if (!o) return null;
  const fg = o.dark ? "text-white" : "text-ink";

  return (
    <MotionConfig reducedMotion="user">
      <div
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        className={cn("relative rounded-2xl transition-colors duration-700 ease-out", o.bg, fg)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={o.href}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative grid min-h-52 grid-cols-[1fr_42%] items-center gap-4 px-5 py-6 sm:min-h-48 sm:px-8 md:grid-cols-[1fr_minmax(0,1.1fr)_1fr] md:gap-6 lg:px-12"
          >
            {/* Left: big type */}
            <motion.div initial={{ opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5, ease }}>
              <p className="text-[13px] font-black tracking-wide tabular-nums">
                {o.price} {o.oldPrice && <s className="ml-1 font-bold opacity-55">{o.oldPrice}</s>}
              </p>
              <p className="mt-1 text-[clamp(2.1rem,6.2vw,4.4rem)] leading-[0.84] font-black tracking-tight uppercase">
                <span className="block">{o.words[0]}</span>
                <span className="block">{o.words[1]}</span>
              </p>
              <p className="mt-2.5 text-[11.5px] font-bold tracking-wide uppercase opacity-75">{o.note}</p>
            </motion.div>

            {/* Centre: product breaking out of the top edge */}
            <div className="relative h-full min-h-40 md:min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 36, rotate: -6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotate: -3, scale: 1 }}
                exit={{ opacity: 0, y: -20, rotate: 3, scale: 0.95 }}
                transition={{ duration: 0.6, ease }}
                className="absolute inset-x-[6%] -top-12 bottom-0 sm:-top-16 md:-top-20"
              >
                <Image src={o.image} alt={o.name} fill sizes="(min-width:768px) 380px, 42vw" quality={85} className="cutout-shadow object-contain object-bottom" />
              </motion.div>
              {o.sticker && (
                <motion.p
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: -12 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.25 }}
                  className={cn(
                    "absolute -top-14 left-0 z-10 grid size-[4.6rem] place-content-center rounded-full text-center leading-none shadow-[0_10px_24px_-8px_rgb(0_0_0/0.45)] sm:-top-16 sm:size-24 md:-top-20",
                    o.dark ? "bg-accent-yellow text-ink" : "bg-tile-coral text-white",
                  )}
                >
                  <span className="text-[1.45rem] font-black tracking-tight tabular-nums sm:text-[1.9rem]">{o.sticker.big}</span>
                  <span className="mt-0.5 text-[0.7rem] font-black tracking-[0.2em] uppercase sm:text-[0.8rem]">{o.sticker.small}</span>
                </motion.p>
              )}
            </div>

            {/* Right: details + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease, delay: 0.08 }}
              className="relative z-10 col-span-2 md:col-span-1"
            >
              <p className="text-[12px] font-black tracking-wide uppercase opacity-80">{o.label}</p>
              <p className="mt-1 line-clamp-2 text-[clamp(1.2rem,2vw,1.6rem)] leading-tight font-black tracking-tight">{o.name}</p>
              <p className="mt-1.5 line-clamp-2 max-w-sm text-[12.5px] leading-relaxed opacity-90">{o.text}</p>
              <div className="mt-4">
                <MagicLink href={o.href} variant={o.dark ? "accent" : "light"} size="sm">
                  Shop now <ChevronRight className="size-3.5" />
                </MagicLink>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
