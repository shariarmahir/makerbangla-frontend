import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms for ordering from and using ${site.domain}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="14 November 2026"
      sections={[
        {
          heading: "Using this website",
          body: <p>By using {site.domain} you agree to these terms. If you do not agree, please do not use the site.</p>,
        },
        {
          heading: "Orders and prices",
          body: <p>Prices are shown in Bangladeshi Taka (BDT). An order is confirmed only after we reply with the final price, availability and delivery charge. We may decline or cancel an order if an item is unavailable or a price was listed in error.</p>,
        },
        {
          heading: "Product information",
          body: <p>We aim to describe every product accurately. Photos may be representative and specifications can vary between manufacturing batches — check the datasheet or ask us before using a part in a critical design.</p>,
        },
        {
          heading: "Returns and warranty",
          body: <p>Return and warranty conditions depend on the product and are confirmed with each order before payment. Contact us as soon as possible if an item arrives damaged or incorrect.</p>,
        },
        {
          heading: "Learning content",
          body: <p>Circuit recipes and lab guides are provided for education. Work under supervision where appropriate, follow the safety notes, and take particular care with mains electricity, batteries and soldering equipment. {site.name} is not liable for damage or injury caused by misuse.</p>,
        },
        {
          heading: "Intellectual property",
          body: <p>The {site.name} name and logo belong to {site.domain}. Third-party product photos are credited on each product page under their respective licences.</p>,
        },
        {
          heading: "Governing law",
          body: <p>These terms are governed by the laws of Bangladesh. Questions? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call {site.phone}.</p>,
        },
      ]}
    />
  );
}
