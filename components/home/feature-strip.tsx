"use client";

import { useEffect, useRef, useState } from "react";
import { GraduationCapIcon, type GraduationCapIconHandle } from "@/components/ui/graduation-cap";
import { PhoneCallIcon, type PhoneCallIconHandle } from "@/components/ui/phone-call";
import { TruckIcon, type TruckIconHandle } from "@/components/ui/truck";
import { WalletIcon, type WalletIconHandle } from "@/components/ui/wallet";
import { site } from "@/lib/site";

type Handle = TruckIconHandle | GraduationCapIconHandle | PhoneCallIconHandle | WalletIconHandle;

const items = [
  { Icon: TruckIcon, title: "Inside & Outside Dhaka", text: "Choose delivery at checkout" },
  { Icon: GraduationCapIcon, title: "Built For Students", text: "Kits by department & course" },
  { Icon: PhoneCallIcon, title: "Expert Support", text: `Call ${site.phone}` },
  { Icon: WalletIcon, title: "Cash On Delivery", text: "Pay when your parts arrive" },
] as const;

export function FeatureStrip() {
  const refs = useRef<(Handle | null)[]>([]);
  const [hover, setHover] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Gently cycle the animation across the row so it moves on touch screens too.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setTick((n) => n + 1), 2400);
    return () => clearInterval(t);
  }, []);

  const active = hover ?? tick % items.length;
  useEffect(() => {
    refs.current.forEach((r, i) => (i === active ? r?.startAnimation() : r?.stopAnimation()));
  }, [active]);

  return (
    <section aria-label="Why Makerbangla" className="mt-8 bg-tile-yellow text-tile-navy sm:mt-10">
      <ul className="container-x reveal grid grid-cols-2 gap-x-4 gap-y-6 py-7 sm:py-8 lg:grid-cols-4 lg:divide-x lg:divide-tile-navy/15">
        {items.map(({ Icon, title, text }, i) => (
          <li
            key={title}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className="flex items-center gap-3 sm:gap-4 lg:justify-center lg:px-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tile-navy text-tile-yellow shadow-[0_10px_18px_-10px_rgb(14_31_77/0.7)] sm:size-12">
              <Icon ref={(h: Handle | null) => { refs.current[i] = h; }} size={24} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] leading-tight font-black sm:text-[14.5px]">{title}</p>
              <p className="mt-0.5 text-[11.5px] leading-snug font-medium text-tile-navy/75 sm:text-[12px]">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
