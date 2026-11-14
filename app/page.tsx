import { BrandStrip } from "@/components/home/brand-strip";
import { CampaignTiles } from "@/components/home/campaign-tiles";
import { CategoryRail } from "@/components/home/category-rail";
import { CategoryShowcase } from "@/components/home/category-showcase";
import { ComponentFinder } from "@/components/home/component-finder";
import { ContactCta } from "@/components/home/contact-cta";
import { Deals } from "@/components/home/deals";
import { EduHub } from "@/components/home/edu-hub";
import { FeatureStrip } from "@/components/home/feature-strip";
import { Hero } from "@/components/home/hero";
import { PromoBanners } from "@/components/home/promo-banners";
import { PromoRotator } from "@/components/home/promo-rotator";
import { TechInsights } from "@/components/home/tech-insights";
import { JsonLd } from "@/components/json-ld";
import { site } from "@/lib/site";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "Store"],
      "@id": `${site.url}/#org`,
      name: site.name,
      slogan: site.tagline,
      url: site.url,
      logo: `${site.url}/brand/mark.png`,
      email: site.email,
      telephone: site.phoneIntl,
      founder: { "@type": "Person", name: site.owner },
      address: { "@type": "PostalAddress", streetAddress: site.address.street, addressLocality: site.address.city, addressCountry: site.address.country },
      areaServed: "BD",
      currenciesAccepted: "BDT",
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      publisher: { "@id": `${site.url}/#org` },
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${site.url}/shop?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={structuredData} />
      <h1 className="sr-only">{site.name} — engineering components, lab equipment and project kits in Bangladesh</h1>
      <ComponentFinder />
      <Hero />
      <CategoryRail />
      <CampaignTiles />
      <FeatureStrip />
      <Deals />
      <PromoRotator />
      <CategoryShowcase />
      <PromoBanners />
      <BrandStrip />
      <EduHub />
      <CategoryShowcase
        label="More to explore"
        className="bg-white pt-0 sm:pt-0"
        rows={[
          { slug: "test-measurement", image: "usb-logic-analyzer" },
          { slug: "prototyping", image: "breadboard-830" },
        ]}
      />
      <TechInsights />
      <ContactCta />
    </>
  );
}
