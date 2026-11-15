"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { MagicLink, type MagicButtonVariant } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

export type Offer = {
  label: string;
  words: [string, string];
  name: string;
  title: string;
  text: string;
  price: string;
  oldPrice?: string;
  href: string;
  image: string;
  bg: string;
  dark: boolean;
  fg: string;
  muted: string;
  button: MagicButtonVariant;
};

const ease = [0.22, 1, 0.36, 1] as const;
const melt = [0.65, 0, 0.35, 1] as const;

/** Offer note: slanted ribbon, the price, and the old price struck through in red beneath — angled like a print ad. */
function Deal({ o, className }: { o: Offer; className?: string }) {
  return (
    <div className={cn("origin-bottom-left rotate-[-5deg]", className)}>
      <p
        className={cn(
          "relative inline-block -skew-x-12 overflow-hidden px-3.5 py-1.5 shadow-[0_12px_22px_-12px_rgb(0_0_0/0.65)]",
          o.dark ? "bg-linear-to-r from-tile-yellow to-tile-butter text-tile-navy" : "bg-linear-to-r from-tile-navy to-tile-midnight text-tile-yellow",
        )}
      >
        <span className="relative block skew-x-12 text-[clamp(0.85rem,1.25vw,1.05rem)] leading-none font-black tracking-wide whitespace-nowrap uppercase">{o.label}</span>
        <span aria-hidden className="offer-badge-shine absolute inset-y-[-40%] left-0 w-[40%] bg-linear-to-r from-transparent via-white/60 to-transparent" />
      </p>
      <p className="mt-2 pl-1 text-[clamp(1.7rem,2.7vw,2.3rem)] leading-none font-black tracking-tight whitespace-nowrap tabular-nums [text-shadow:0_6px_18px_rgb(0_0_0/0.18)]">
        {o.price}
      </p>
      {o.oldPrice && (
        <p className="mt-2 pl-1">
          <span className="sr-only">Was </span>
          <s className="inline-block rounded-md bg-white px-2 py-0.5 text-[13px] font-black whitespace-nowrap text-sale tabular-nums decoration-2 shadow-[0_8px_16px_-10px_rgb(0_0_0/0.5)]">
            {o.oldPrice}
          </s>
        </p>
      )}
    </div>
  );
}

function Slide({ o }: { o: Offer }) {
  return (
    <div className={cn("relative grid min-h-60 grid-cols-[1fr_44%] items-center gap-4 rounded-2xl px-5 py-6 sm:min-h-56 sm:px-8 md:grid-cols-[0.9fr_minmax(0,1.25fr)_1fr] md:gap-6 lg:px-12", o.bg, o.fg)}>
      {/* Left: big type (+ offer and price on phones, where the right column drops below) */}
      <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease, delay: 0.15 }}>
        <p className="text-[clamp(2.1rem,6.2vw,4.4rem)] leading-[0.84] font-black tracking-tight uppercase">
          <span className="block">{o.words[0]}</span>
          <span className="block">{o.words[1]}</span>
        </p>
        <Deal o={o} className="mt-5 md:hidden" />
      </motion.div>

      {/* Centre: the product, breaking out of the top edge */}
      <div className="relative h-full min-h-44 md:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 26, rotate: -6, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, rotate: -3, scale: 1 }}
          transition={{ duration: 1, ease, delay: 0.1 }}
          className="absolute inset-x-0 -top-12 bottom-0 sm:-top-16 md:-top-20"
        >
          {/* Dashboard uploads (/media) are already resized WebP, so they skip the optimizer. */}
          <Image src={o.image} alt={o.name} fill sizes="(min-width:768px) 340px, 44vw" quality={85} unoptimized={o.image.startsWith("/media/")} className="cutout-shadow object-contain object-bottom" />
        </motion.div>
      </div>

      {/* Right: offer note + price first (its own column, clear of the big type), then product name and CTA */}
      <motion.div
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, ease, delay: 0.22 }}
        className="relative z-10 col-span-2 md:col-span-1"
      >
        <Deal o={o} className="promo-tag mb-5 hidden md:block" />
        <p className="truncate text-[clamp(1.15rem,1.8vw,1.5rem)] leading-tight font-black tracking-tight" title={o.name}>{o.title}</p>
        <p className={cn("mt-1.5 line-clamp-2 max-w-sm text-[12.5px] leading-relaxed", o.muted)}>{o.text}</p>
        <div className="mt-4">
          <MagicLink href={o.href} variant={o.button} size="sm">
            Shop now <ChevronRight className="size-3.5" />
          </MagicLink>
        </div>
      </motion.div>
    </div>
  );
}

export function PromoSlides({ offers }: { offers: Offer[] }) {
  const [i, setI] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (offers.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % offers.length);
    }, 5500);
    return () => clearInterval(t);
  }, [offers.length]);

  const o = offers[i];
  if (!o) return null;

  return (
    <MotionConfig reducedMotion="user">
      {/* Every banner is one complete layer (background + content). Layers share one grid cell and
          cross-dissolve with a soft blur, so colour and content change together like a melt. */}
      <div
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onFocus={() => (paused.current = true)}
        onBlur={() => (paused.current = false)}
        className="grid"
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={o.href}
            className="[grid-area:1/1]"
            initial={{ opacity: 0, filter: "blur(14px)", scale: 0.985 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1, zIndex: 1 }}
            exit={{ opacity: 0, filter: "blur(14px)", scale: 1.015, zIndex: 0 }}
            transition={{ duration: 1.15, ease: melt }}
          >
            <Slide o={o} />
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
