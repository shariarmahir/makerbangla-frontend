import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { categories, departmentNames, departments } from "@/lib/data/catalog";
import { site, whatsappLink } from "@/lib/site";

async function buildYear() {
  "use cache";
  return new Date().getFullYear();
}

const head = "text-[12px] font-black tracking-[0.14em] text-tile-yellow uppercase";
const link = "group inline-flex items-center gap-1.5 text-[13px] text-white/70 transition-colors hover:text-tile-yellow";
const dot = <span aria-hidden className="size-1 rounded-full bg-white/25 transition-colors group-hover:bg-tile-yellow" />;

const company = [
  { href: "/learn", label: "Learning Hub" },
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

export async function SiteFooter() {
  const year = await buildYear();
  return (
    <footer id="contact" className="relative isolate mt-auto overflow-hidden bg-tile-midnight text-white print:hidden">
      {/* Atmosphere: brand glows, a faint grid and the wordmark watermark */}
      <span aria-hidden className="absolute -top-40 -left-24 -z-10 size-[28rem] rounded-full bg-brand/30 blur-3xl" />
      <span aria-hidden className="absolute -right-20 -bottom-48 -z-10 size-[26rem] rounded-full bg-tile-yellow/12 blur-3xl" />
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
      <p aria-hidden className="pointer-events-none absolute right-0 -bottom-[0.18em] left-0 -z-10 text-center text-[clamp(4rem,15vw,13rem)] leading-none font-black tracking-tighter text-white/[0.035] select-none">makerbangla</p>

      <div className="container-x pt-14 sm:pt-16">
        {/* Call-to-action band */}
        <div className="flex flex-col gap-5 rounded-[26px] bg-white/[0.06] p-6 ring-1 ring-white/10 backdrop-blur-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[clamp(1.5rem,2.8vw,2.2rem)] leading-tight font-black tracking-tight text-tile-yellow">{site.tagline}</p>
            <p className="mt-1.5 max-w-xl text-[13.5px] text-white/75">Parts, lab equipment and project help for engineering students and makers across Bangladesh.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <MagicAnchor href={`tel:${site.phoneIntl}`} variant="accent"><Phone className="size-4" /> {site.phone}</MagicAnchor>
            <MagicAnchor href={whatsappLink(`Hello ${site.name}!`)} target="_blank" rel="noopener noreferrer" variant="light"><MessageCircle className="size-4" /> WhatsApp</MagicAnchor>
            <MagicLink href="/contact" variant="brand"><Send className="size-4" /> Message us</MagicLink>
          </div>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-5">
            <Link href="/" aria-label={`${site.name} home`} className="inline-flex rounded-2xl bg-white px-4 py-2.5 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.6)]">
              <Image src="/brand/logo.png" alt={site.name} width={416} height={144} sizes="140px" className="h-10 w-auto" />
            </Link>
            <address className="space-y-3 text-[13px] text-white/75 not-italic">
              <p className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/8 text-tile-yellow"><MapPin className="size-4" /></span><span className="pt-1.5">{site.address.street}, {site.address.city}</span></p>
              <a href={`tel:${site.phoneIntl}`} className="flex items-center gap-3 hover:text-tile-yellow"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/8 text-tile-yellow"><Phone className="size-4" /></span>{site.phone}</a>
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 break-all hover:text-tile-yellow"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/8 text-tile-yellow"><Mail className="size-4" /></span>{site.email}</a>
            </address>
          </div>

          <nav aria-label="Shop categories" className="space-y-4">
            <h2 className={head}>Shop</h2>
            <ul className="space-y-2.5">
              {categories.slice(0, 7).map((c) => <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={link}>{dot}{c.name}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Departments" className="space-y-4">
            <h2 className={head}>Departments</h2>
            <ul className="space-y-2.5">
              {departments.map((d) => <li key={d}><Link href={`/shop?department=${d}`} className={link}>{dot}{departmentNames[d]}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Makerbangla" className="space-y-4">
            <h2 className={head}>Makerbangla</h2>
            <ul className="space-y-2.5">
              {company.map((l) => <li key={l.href}><Link href={l.href} className={link}>{dot}{l.label}</Link></li>)}
            </ul>
          </nav>

          <nav aria-label="Help" className="space-y-4">
            <h2 className={head}>Help</h2>
            <ul className="space-y-2.5">
              {help.map((l) => <li key={l.href}><Link href={l.href} className={link}>{dot}{l.label}</Link></li>)}
            </ul>
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/15">
        <div className="container-x flex flex-col items-center gap-3 py-5 text-center text-[12.5px] text-white/65 sm:flex-row sm:justify-between sm:text-left">
          <p>© {year} <span className="font-semibold text-white">{site.domain}</span>. All rights reserved.</p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-tile-yellow">Privacy</Link>
            <Link href="/terms" className="hover:text-tile-yellow">Terms</Link>
          </p>
          <p className="flex items-center gap-2.5">
            <span>Built by</span>
            <span className="relative inline-flex items-center gap-2 rounded-full bg-white/[0.07] py-1 pr-3.5 pl-2.5 ring-1 ring-white/15">
              <span aria-hidden className="kandari-dot size-2 rounded-full bg-tile-yellow shadow-[0_0_12px_var(--color-tile-yellow)]" />
              <span className="kandari text-[17px] tracking-tight">{site.builder}</span>
            </span>
            <a href="#top" aria-label="Back to top" className="ml-1 grid size-9 place-items-center rounded-full bg-tile-yellow text-tile-navy transition-transform hover:-translate-y-0.5"><ArrowUp className="size-4" /></a>
          </p>
        </div>
      </div>
    </footer>
  );
}
