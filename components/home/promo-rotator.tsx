import { getProduct, productVisual } from "@/lib/catalog";
import { tones, type ToneName } from "@/lib/tones";
import { bdt } from "@/lib/utils";
import { PromoSlides, type Offer } from "./promo-slides";

/** `title` is the short one-line name shown on the banner (the full name stays in the image alt). */
const plan: { label: string; words: [string, string]; slug: string; title: string; tone: ToneName }[] = [
  { label: "Latest Offer", words: ["Board", "Deals"], slug: "arduino-uno-r3", title: "Arduino Uno R3", tone: "yellow" },
  { label: "Best Offer", words: ["Solder", "Saver"], slug: "soldering-iron-kit", title: "Soldering Iron Kit, 60 W", tone: "navy" },
  { label: "This Week's Offer", words: ["Measure", "Right"], slug: "vernier-caliper", title: "Digital Vernier Caliper", tone: "blue" },
  { label: "New Arrival", words: ["Just", "Landed"], slug: "raspberry-pi-4", title: "Raspberry Pi 4 · 4 GB", tone: "midnight" },
  { label: "Top Of The Week", words: ["Motion", "Pick"], slug: "nema17-stepper-motor", title: "NEMA 17 Stepper Motor", tone: "sky" },
];

const offers: Offer[] = plan.flatMap(({ label, words, slug, title, tone }) => {
  const p = getProduct(slug);
  if (!p) return [];
  return [{
    label,
    words,
    name: p.name,
    title,
    text: p.summary,
    price: bdt(p.price),
    oldPrice: p.oldPrice ? bdt(p.oldPrice) : undefined,
    href: `/products/${p.slug}`,
    image: productVisual(p.slug).src,
    bg: tones[tone].bg,
    dark: tones[tone].dark,
    fg: tones[tone].text,
    muted: tones[tone].muted,
    button: tones[tone].button,
  }];
});

export function PromoRotator() {
  return (
    // Sits between the category rows on the same soft background, so it reads as a break in one flow.
    <section aria-label="Offers" className="bg-soft">
      <div className="container-x reveal pt-14 pb-10 sm:pt-16 sm:pb-12">
        <PromoSlides offers={offers} />
      </div>
    </section>
  );
}
