"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Offer = {
  label: string;
  words: [string, string];
  badge: string;
  note: string;
  name: string;
  text: string;
  price: string;
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
              <p className="text-[12px] font-extrabold tracking-wider uppercase opacity-90">{o.badge}</p>
              <p className="mt-1 text-[clamp(2.1rem,6.2vw,4.4rem)] leading-[0.84] font-black tracking-tight uppercase">
                <span className="block">{o.words[0]}</span>
                <span className="block">{o.words[1]}</span>
              </p>
              <p className="mt-2.5 text-[11.5px] font-semibold opacity-85">{o.note}</p>
            </motion.div>

            {/* Centre: product breaking out of the top edge */}
            <div className="relative h-full min-h-40 md:min-h-0">
              <motion.div
                initial={{ opacity: 0, y: 36, rotate: -8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }}
                exit={{ opacity: 0, y: -20, rotate: 4, scale: 0.95 }}
                transition={{ duration: 0.6, ease }}
                className="absolute inset-x-0 -top-14 -bottom-4 sm:-top-20 md:-top-24 md:-bottom-2"
              >
                <Image src={o.image} alt={o.name} fill sizes="(min-width:768px) 380px, 42vw" className="cutout-shadow object-contain" />
              </motion.div>
            </div>

            {/* Right: details + CTA */}
            <motion.div
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease, delay: 0.08 }}
              className="col-span-2 md:col-span-1"
            >
              <p className="text-[12px] font-bold opacity-90">{o.label}</p>
              <p className="mt-1 text-[clamp(1.25rem,2.2vw,1.75rem)] leading-tight font-extrabold tracking-tight">{o.name}</p>
              <p className="mt-1.5 line-clamp-2 max-w-sm text-[12.5px] leading-relaxed opacity-90">{o.text}</p>
              <Link href={o.href} className="btn-pill mt-4 h-9 bg-white px-5 text-ink shadow-sm hover:shadow-md">
                Shop · {o.price} <ChevronRight className="size-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
