import type { Offer } from "@/components/home/promo-slides";
import type { Promo } from "@/lib/admin/types";
import { tones } from "@/lib/tones";
import { bdt } from "@/lib/utils";

/** Promo banner record → the props the home-page rotator renders (also used for the dashboard preview). */
export function toOffer(p: Promo): Offer {
  const t = tones[p.tone] ?? tones.yellow;
  return {
    label: p.label,
    words: p.words,
    name: p.title,
    title: p.title,
    text: p.text,
    price: bdt(p.price),
    oldPrice: p.oldPrice ? bdt(p.oldPrice) : undefined,
    href: p.href,
    image: p.image,
    bg: t.bg,
    dark: t.dark,
    fg: t.text,
    muted: t.muted,
    button: t.button,
  };
}
