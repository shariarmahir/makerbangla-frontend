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
    <section aria-label="Why Makerbangla" className="container-x reveal pt-4 sm:pt-5">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl border border-line bg-white px-5 py-6 sm:px-8 lg:grid-cols-4 lg:divide-x lg:divide-line lg:px-4">
        {items.map(({ Icon, title, text }, i) => (
          <li
            key={title}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className="flex items-center gap-3.5 lg:justify-center lg:px-4"
          >
            <Icon ref={(h: Handle | null) => { refs.current[i] = h; }} size={34} className="shrink-0 text-sale" aria-hidden />
            <div className="min-w-0">
              <p className="text-[13.5px] leading-tight font-extrabold text-ink">{title}</p>
              <p className="mt-0.5 text-[11.5px] text-subtle">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
