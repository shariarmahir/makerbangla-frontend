import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, CreditCard, FileText, Mail, MapPin, Phone, ShoppingCart, Truck } from "lucide-react";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { deliveryOptions, site, whatsappLink } from "@/lib/site";
import { bdt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Info — Ordering, Delivery & Payment",
  description: `How to order from ${site.name}: checkout steps, delivery inside and outside Dhaka, cash on delivery and bulk quotations for university labs.`,
  alternates: { canonical: "/info" },
};

const steps = [
  { icon: ShoppingCart, title: "Add your parts", text: "Add products to the cart, or tap Buy Now to go straight to checkout." },
  { icon: ClipboardList, title: "Check out", text: "Enter your name, phone number and address — no account needed." },
  { icon: Truck, title: "Choose delivery", text: "Inside Dhaka, outside Dhaka by courier, or pick up from our store." },
  { icon: FileText, title: "Keep your receipt", text: "Download or print the PDF receipt as soon as the order is placed." },
] as const;

const jump = [
  ["#how-to-order", "How to order"],
  ["#delivery", "Delivery"],
  ["#payment", "Payment"],
  ["#quotation", "Bulk quotation"],
  ["#contact-us", "Contact"],
] as const;

const card = "rounded-[22px] bg-white p-6 ring-1 ring-line sm:p-8";
const h2 = "text-[20px] font-black tracking-tight text-tile-navy";

export default function InfoPage() {
  return (
    <div className="container-x py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Info</span>
      </nav>

      <header className="relative isolate overflow-hidden rounded-[26px] bg-tile-navy px-6 py-9 text-white sm:px-10 sm:py-12">
        <span aria-hidden className="absolute -top-20 -right-20 -z-10 size-72 rounded-full bg-brand/45 blur-3xl" />
        <h1 className="text-[clamp(1.9rem,4vw,2.9rem)] leading-none font-black tracking-tight text-tile-yellow">Ordering made simple</h1>
        <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-[12px] font-bold">
          {jump.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full bg-white/12 px-3.5 py-1.5 ring-1 ring-white/20 transition-colors hover:bg-tile-yellow hover:text-tile-navy">{label}</a>
          ))}
        </nav>
      </header>

      <section id="how-to-order" aria-labelledby="how-title" className="mt-8">
        <h2 id="how-title" className={h2}>How to order</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={card}>
              <span className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-tile-yellow text-tile-navy"><Icon className="size-5" /></span>
                <span className="text-[28px] font-black text-tile-sky tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </span>
              <p className="mt-4 text-[15px] font-black text-tile-navy">{title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section id="delivery" aria-labelledby="delivery-title" className={card}>
          <h2 id="delivery-title" className={h2}>Delivery</h2>
          <ul className="mt-4 divide-y divide-line">
            {deliveryOptions.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                <span>
                  <span className="block text-[14px] font-bold text-ink">{d.label}</span>
                  <span className="block text-[12.5px] text-subtle">{d.note}</span>
                </span>
                <span className="shrink-0 text-[14px] font-black text-tile-navy tabular-nums">{d.fee ? bdt(d.fee) : "Free"}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-subtle">Choose the option at checkout and see the final total before you place the order.</p>
        </section>

        <section id="payment" aria-labelledby="payment-title" className={card}>
          <h2 id="payment-title" className={h2}>Payment</h2>
          <div className="mt-4 flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tile-sky text-tile-navy"><CreditCard className="size-5" /></span>
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Pay <strong className="text-ink">cash on delivery</strong> when your parts arrive, or pay at the counter when you pick up from our store. All prices are in BDT.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section id="quotation" aria-labelledby="quote-title" className="rounded-[22px] bg-tile-yellow p-6 text-tile-navy sm:p-8">
          <h2 id="quote-title" className="text-[20px] font-black tracking-tight">Bulk orders for university labs</h2>
          <p className="mt-2 max-w-md text-[13.5px] leading-relaxed">Equipping a sessional lab or a whole batch? Send us your list and we will prepare a quotation.</p>
          <MagicAnchor href={whatsappLink("Hello Makerbangla, I would like a quotation for a bulk lab order.")} target="_blank" rel="noopener noreferrer" className="mt-5">
            Request a quote
          </MagicAnchor>
        </section>

        <section id="contact-us" aria-labelledby="contact-title" className={card}>
          <h2 id="contact-title" className={h2}>Contact</h2>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            <li className="flex items-center gap-3"><Phone className="size-4 text-brand" /> <a href={`tel:${site.phoneIntl}`} className="font-bold hover:underline">{site.phone}</a></li>
            <li className="flex items-center gap-3"><Mail className="size-4 text-brand" /> <a href={`mailto:${site.email}`} className="font-bold hover:underline">{site.email}</a></li>
            <li className="flex items-center gap-3"><MapPin className="size-4 text-brand" /> {site.address.street}, {site.address.city}</li>
          </ul>
          <MagicLink href="/shop" variant="accent" className="mt-5">Start shopping</MagicLink>
        </section>
      </div>
    </div>
  );
}
