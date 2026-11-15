import { cacheTag } from "next/cache";
import { readDb } from "@/lib/admin/db";
import { toOffer } from "@/lib/promos";
import { PromoSlides } from "./promo-slides";

/** Banners are managed in Dashboard → Promotions; saving there expires the "promos" tag so the home page updates. */
async function activeOffers() {
  "use cache";
  cacheTag("promos");
  const db = await readDb();
  return db.promos.filter((p) => p.active).map(toOffer);
}

export async function PromoRotator() {
  const offers = await activeOffers();
  if (!offers.length) return null;
  return (
    // Sits between the category rows on the same soft background, so it reads as a break in one flow.
    <section aria-label="Offers" className="bg-soft">
      <div className="container-x reveal pt-14 pb-10 sm:pt-16 sm:pb-12">
        <PromoSlides offers={offers} />
      </div>
    </section>
  );
}
