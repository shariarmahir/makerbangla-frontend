import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="14 November 2026"
      sections={[
        {
          heading: "Who we are",
          body: <p>{site.name} ({site.domain}) sells engineering components and lab equipment and publishes learning material. Contact: {site.address.street}, {site.address.city}, Bangladesh · <a href={`mailto:${site.email}`}>{site.email}</a> · {site.phone}.</p>,
        },
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li>Order details you send us by WhatsApp, phone or email: name, phone number, delivery address and the items you want.</li>
              <li>Your email address, only if you subscribe to our newsletter.</li>
              <li>Cart, wishlist and recently viewed items, stored in your own browser (local storage). This data stays on your device and is not sent to us.</li>
              <li>Basic server logs (such as IP address and browser type) kept by our hosting provider for security and reliability.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: <p>To process and deliver orders, answer questions, send newsletters you asked for, prevent fraud and improve the website. We do not sell your personal information and we do not use advertising trackers.</p>,
        },
        {
          heading: "Sharing",
          body: <p>We share only what is necessary with service providers who help us run the business — for example courier companies (name, phone and address for delivery) and our hosting provider. They may use it only to provide that service.</p>,
        },
        {
          heading: "Retention",
          body: <p>Order records are kept as long as needed for accounting, warranty and legal obligations. Newsletter emails are kept until you unsubscribe. You can clear on-device data at any time from your browser settings.</p>,
        },
        {
          heading: "Your rights",
          body: <p>You can ask to access, correct or delete the personal information we hold about you, or withdraw consent to marketing, by emailing <a href={`mailto:${site.email}`}>{site.email}</a>. We respond within 30 days.</p>,
        },
        {
          heading: "Security",
          body: <p>The site is served over HTTPS with strict security headers. No method of transmission is perfectly secure, but we take reasonable measures to protect your information.</p>,
        },
        {
          heading: "Children",
          body: <p>Our store is intended for students and professionals aged 13 and over. Younger learners should use the site with a parent, guardian or teacher.</p>,
        },
        {
          heading: "Changes",
          body: <p>We may update this policy. The date above shows the latest version; significant changes will be highlighted on the website.</p>,
        },
      ]}
    />
  );
}
