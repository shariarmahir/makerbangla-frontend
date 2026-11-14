import { getCategory, getProduct, productVisual } from "@/lib/catalog";
import { tones, type ToneName } from "@/lib/tones";
import { bdt, discount } from "@/lib/utils";
import { PromoSlides, type Offer } from "./promo-slides";

const plan: { label: string; words: [string, string]; slug: string; tone: ToneName }[] = [
  { label: "Latest Offer", words: ["Board", "Deals"], slug: "arduino-uno-r3", tone: "red" },
  { label: "Best Offer", words: ["Solder", "Saver"], slug: "soldering-iron-kit", tone: "blue" },
  { label: "This Week's Offer", words: ["Measure", "Right"], slug: "vernier-caliper", tone: "teal" },
  { label: "New Arrival", words: ["Just", "Landed"], slug: "raspberry-pi-4", tone: "violet" },
  { label: "Top Of The Week", words: ["Motion", "Pick"], slug: "nema17-stepper-motor", tone: "yellow" },
];

const offers: Offer[] = plan.flatMap(({ label, words, slug, tone }) => {
  const p = getProduct(slug);
  if (!p) return [];
  const off = discount(p.price, p.oldPrice);
  return [{
    label,
    words,
    badge: off ? `${off}% Off` : p.isNew ? "New In" : bdt(p.price),
    note: getCategory(p.category)?.name ?? "",
    name: p.name,
    text: p.summary,
    price: bdt(p.price),
    href: `/products/${p.slug}`,
    image: productVisual(p.slug).src,
    bg: tones[tone].bg,
    dark: tones[tone].dark,
  }];
});

export function PromoRotator() {
  return (
    <section aria-label="Offers" className="container-x reveal pt-16 pb-4 sm:pt-20">
      <PromoSlides offers={offers} />
    </section>
  );
}
