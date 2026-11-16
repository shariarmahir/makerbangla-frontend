import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Banknote, Mail, MapPin, MessageCircle, Phone, Send, Store, Truck } from "lucide-react";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { categories, departmentNames, departments } from "@/lib/data/catalog";
import { deliveryOptions, site, whatsappLink } from "@/lib/site";

async function buildYear() {
  "use cache";
  return new Date().getFullYear();
}

const head = "text-[12px] font-black tracking-[0.14em] text-tile-yellow uppercase";
const link = "group/l relative inline-flex items-center py-0.5 text-[13.5px] text-white/70 transition-colors hover:text-white focus-visible:text-white";
const mark = <span aria-hidden className="h-px w-0 bg-tile-yellow transition-[width,margin] duration-300 group-hover/l:mr-2 group-hover/l:w-3 group-focus-visible/l:mr-2 group-focus-visible/l:w-3" />;

const company = [
  { href: "/learn", label: "Learning Hub" },
  { href: "/learn/lab-kitchen", label: "Lab Kitchen" },
  { href: "/learn#lab-guides", label: "Lab Guides" },
  { href: "/blog", label: "Tech Insights" },
  { href: "/brands", label: "Brands" },
  { href: "/wishlist", label: "Wishlist" },
];
const help = [
  { href: "/info#how-to-order", label: "How to order" },
  { href: "/info#delivery", label: "Delivery" },
  { href: "/info#payment", label: "Payment" },
  { href: "/info#quotation", label: "Lab quotations" },
  { href: "/track", label: "Track your order" },
  { href: "/contact", label: "Contact us" },
];

// Straight from the checkout options in lib/site.ts — no claims beyond what checkout offers.
const pickup = deliveryOptions.find((d) => d.id === "pickup");
const facts = [
  { icon: Truck, title: "Courier to every district", text: "Inside and outside Dhaka" },
  { icon: Banknote, title: "Cash on delivery", text: "Pay when your parts arrive" },
  { icon: Store, title: "Store pickup", text: pickup?.note ?? `${site.address.street}, ${site.address.city}` },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="space-y-4">
      <h2 className={head}>{title}</h2>
      <ul className="space-y-2">
        {links.map((l) => <li key={l.href}><Link href={l.href} className={link}>{mark}{l.label}</Link></li>)}
      </ul>
    </nav>
  );
}

export async function SiteFooter() {
  const year = await buildYear();
  return (
    <footer id="contact" className="relative isolate mt-auto overflow-hidden bg-tile-midnight text-white print:hidden">
      {/* Atmosphere: brand glows and a faint grid fading down from the top */}
      <span aria-hidden className="absolute -top-48 -left-32 -z-10 size-[34rem] rounded-full bg-brand/30 blur-3xl" />
      <span aria-hidden className="absolute top-1/3 -right-40 -z-10 size-[30rem] rounded-full bg-tile-navy/70 blur-3xl" />
      <span aria-hidden className="absolute -bottom-40 left-1/3 -z-10 size-[24rem] rounded-full bg-tile-yellow/10 blur-3xl" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />

      <div className="container-x pt-14 sm:pt-20">
        {/* Call-to-action card with a slowly moving brand-colour edge */}
        <div className="footer-edge rounded-[30px] p-px shadow-[0_40px_90px_-50px_rgb(0_0_0/0.9)]">
          <div className="relative overflow-hidden rounded-[29px] bg-tile-midnight/95 p-6 sm:p-9">
            <span aria-hidden className="absolute -top-24 right-10 size-64 rounded-full bg-brand/25 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.05] font-black tracking-tight text-balance text-tile-yellow">{site.tagline}</p>
                <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-white/75">Parts, lab equipment and project help for engineering students and makers across Bangladesh.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <MagicAnchor href={`tel:${site.phoneIntl}`} variant="accent" rainbow><Phone className="size-4" /> {site.phone}</MagicAnchor>
                <MagicAnchor href={whatsappLink(`Hello ${site.name}!`)} target="_blank" rel="noopener noreferrer" variant="light"><MessageCircle className="size-4" /> WhatsApp</MagicAnchor>
                <MagicLink href="/contact" variant="brand"><Send className="size-4" /> Message us</MagicLink>
              </div>
            </div>
          </div>
        </div>

        {/* What every order gets */}
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {facts.map(({ icon: I, title, text }) => (
            <li key={title} className="flex items-center gap-3.5 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tile-yellow text-tile-navy shadow-[0_10px_24px_-12px_var(--color-tile-yellow)]"><I className="size-5" /></span>
              <span className="min-w-0">
                <b className="block text-[13.5px] text-white">{title}</b>
                <span className="block truncate text-[12px] text-white/65">{text}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 sm:grid-cols-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
          <div className="col-span-2 space-y-6 sm:col-span-4 lg:col-span-1">
            <Link href="/" aria-label={`${site.name} home`} className="inline-block transition-transform duration-300 hover:-translate-y-0.5">
              <Image src="/brand/logo.png" alt={site.name} width={416} height={144} sizes="180px" className="h-14 w-auto drop-shadow-[0_10px_28px_rgb(0_158_255/0.35)]" />
            </Link>
            <address className="grid gap-2.5 text-[13px] text-white/75 not-italic sm:grid-cols-3 lg:grid-cols-1">
              <p className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-tile-yellow ring-1 ring-white/10"><MapPin className="size-4" /></span><span className="pt-2">{site.address.street}, {site.address.city}</span></p>
              <a href={`tel:${site.phoneIntl}`} className="group/c flex items-center gap-3 hover:text-white"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-tile-yellow ring-1 ring-white/10 transition-colors group-hover/c:bg-tile-yellow group-hover/c:text-tile-navy"><Phone className="size-4" /></span>{site.phone}</a>
              <a href={`mailto:${site.email}`} className="group/c flex items-center gap-3 break-all hover:text-white"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-tile-yellow ring-1 ring-white/10 transition-colors group-hover/c:bg-tile-yellow group-hover/c:text-tile-navy"><Mail className="size-4" /></span>{site.email}</a>
            </address>
          </div>

          <Column title="Shop" links={categories.slice(0, 7).map((c) => ({ href: `/shop?category=${c.slug}`, label: c.name }))} />
          <Column title="Departments" links={departments.map((d) => ({ href: `/shop?department=${d}`, label: departmentNames[d] }))} />
          <Column title="Makerbangla" links={company} />
          <Column title="Help" links={help} />
        </div>
      </div>

      {/* Outlined wordmark sitting on the bottom bar */}
      <p aria-hidden className="pointer-events-none -mb-[0.2em] text-center text-[clamp(3rem,13.5vw,12.5rem)] leading-none font-black tracking-tighter text-transparent select-none [-webkit-text-stroke:1px_rgb(255_255_255/0.14)] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]">
        makerbangla
      </p>

      <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container-x flex flex-col items-center gap-4 py-5 text-center text-[12.5px] text-white/65 md:flex-row md:justify-between md:text-left">
          <p>© {year} <span className="font-semibold text-white">{site.domain}</span>. All rights reserved.</p>
          <p className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-tile-yellow">Privacy</Link>
            <span aria-hidden className="size-1 rounded-full bg-white/25" />
            <Link href="/terms" className="hover:text-tile-yellow">Terms</Link>
          </p>
          <p className="flex items-center gap-2.5">
            <span>Built by</span>
            <span className="relative inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1 pr-3.5 pl-2.5 ring-1 ring-white/15">
              <span aria-hidden className="kandari-dot size-2 rounded-full bg-tile-yellow shadow-[0_0_12px_var(--color-tile-yellow)]" />
              <span className="kandari text-[17px] tracking-tight">{site.builder}</span>
            </span>
            <a href="#top" aria-label="Back to top" className="ml-1 grid size-10 place-items-center rounded-full bg-tile-yellow text-tile-navy shadow-[0_10px_24px_-10px_var(--color-tile-yellow)] transition-transform hover:-translate-y-1"><ArrowUp className="size-4" /></a>
          </p>
        </div>
      </div>
    </footer>
  );
}
