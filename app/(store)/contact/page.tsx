import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Questions about parts, orders, lab quotations or your project? Message ${site.name} — we reply within a working day.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[26px] bg-white shadow-[0_30px_60px_-40px_rgb(14_31_77/0.5)] ring-1 ring-line md:grid-cols-[1fr_1.6fr]">
        <aside className="relative isolate flex flex-col gap-6 overflow-hidden bg-tile-navy p-8 text-white sm:p-10">
          <span aria-hidden className="absolute -top-20 -left-16 -z-10 size-64 rounded-full bg-brand/45 blur-3xl" />
          <h1 className="text-[clamp(1.8rem,3.4vw,2.4rem)] leading-none font-black tracking-tight text-tile-yellow">Contact us</h1>
          <ul className="space-y-3.5 text-[13.5px] text-white/85">
            <li><a href={`tel:${site.phoneIntl}`} className="flex items-center gap-3 hover:text-tile-yellow"><Phone className="size-4.5 text-tile-yellow" /> {site.phone}</a></li>
            <li><a href={whatsappLink(`Hello ${site.name}!`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-tile-yellow"><MessageCircle className="size-4.5 text-tile-yellow" /> WhatsApp us</a></li>
            <li><a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all hover:text-tile-yellow"><Mail className="size-4.5 shrink-0 text-tile-yellow" /> {site.email}</a></li>
            <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-4.5 shrink-0 text-tile-yellow" /> {site.address.street}, {site.address.city}</li>
          </ul>
        </aside>
        <div className="relative p-8 sm:p-10">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
