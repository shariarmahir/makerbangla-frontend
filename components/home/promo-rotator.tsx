import { getCategory, getProduct, productVisual } from "@/lib/catalog";
import { tones, type ToneName } from "@/lib/tones";
import { bdt, discount } from "@/lib/utils";
import { PromoSlides, type Offer } from "./promo-slides";

const plan: { label: string; words: [string, string]; slug: string; tone: ToneName }[] = [
  { label: "Latest Offer", words: ["Board", "Deals"], slug: "arduino-uno-r3", tone: "yellow" },
  { label: "Best Offer", words: ["Solder", "Saver"], slug: "soldering-iron-kit", tone: "navy" },
  { label: "This Week's Offer", words: ["Measure", "Right"], slug: "vernier-caliper", tone: "blue" },
  { label: "New Arrival", words: ["Just", "Landed"], slug: "raspberry-pi-4", tone: "midnight" },
  { label: "Top Of The Week", words: ["Motion", "Pick"], slug: "nema17-stepper-motor", tone: "sky" },
];

const offers: Offer[] = plan.flatMap(({ label, words, slug, tone }) => {
  const p = getProduct(slug);
  if (!p) return [];
  const off = discount(p.price, p.oldPrice);
  return [{
    label,
    words,
    sticker: off ? { big: `${off}%`, small: "Off" } : p.isNew ? { big: "New", small: "In" } : null,
    note: getCategory(p.category)?.name ?? "",
    name: p.name,
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
    <section aria-label="Offers" className="container-x reveal pt-16 pb-4 sm:pt-20">
      <PromoSlides offers={offers} />
    </section>
  );
}
