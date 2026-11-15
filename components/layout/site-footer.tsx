import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { categories, departmentNames, departments } from "@/lib/data/catalog";
import { site, whatsappLink } from "@/lib/site";

async function buildYear() {
  "use cache";
  return new Date().getFullYear();
}

const col = "text-[11px] font-bold tracking-wider text-ink uppercase";
const link = "text-[12.5px] text-subtle transition-colors hover:text-brand-strong";

export async function SiteFooter() {
  const year = await buildYear();
  return (
    <footer id="contact" className="mt-auto border-t border-line bg-soft print:hidden">
      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Image src="/brand/logo.png" alt={site.name} width={416} height={144} sizes="150px" className="h-12 w-auto" />
          <p className="max-w-xs text-[12.5px] text-subtle">{site.tagline}. Components, lab equipment and learning for engineering students across Bangladesh.</p>
          <address className="space-y-2.5 text-[12.5px] not-italic">
            <p className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-strong" />{site.address.street}, {site.address.city}</p>
            <a href={`tel:${site.phoneIntl}`} className="flex gap-2.5 hover:text-brand-strong"><Phone className="size-4 text-brand-strong" />{site.phone}</a>
            <a href={whatsappLink(`Hello ${site.name}!`)} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 hover:text-brand-strong"><MessageCircle className="size-4 text-brand-strong" />WhatsApp us</a>
            <a href={`mailto:${site.email}`} className="flex gap-2.5 break-all hover:text-brand-strong"><Mail className="size-4 shrink-0 text-brand-strong" />{site.email}</a>
          </address>
        </div>

        <nav aria-label="Shop categories" className="space-y-3">
          <h2 className={col}>Shop</h2>
          <ul className="space-y-2">
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}><Link href={`/shop?category=${c.slug}`} className={link}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Departments" className="space-y-3">
          <h2 className={col}>By Department</h2>
          <ul className="space-y-2">
            {departments.map((d) => (
              <li key={d}><Link href={`/shop?department=${d}`} className={link}>{departmentNames[d]}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="space-y-3">
          <h2 className={col}>Makerbangla</h2>
          <ul className="space-y-2">
            <li><Link href="/learn" className={link}>Learning Hub</Link></li>
            <li><Link href="/learn#lab-guides" className={link}>Lab Guides</Link></li>
            <li><Link href="/blog" className={link}>Tech Insights</Link></li>
            <li><Link href="/brands" className={link}>Brands</Link></li>
            <li><Link href="/track" className={link}>Track Order</Link></li>
            <li><Link href="/wishlist" className={link}>Wishlist</Link></li>
            <li><Link href="/privacy" className={link}>Privacy Policy</Link></li>
            <li><Link href="/terms" className={link}>Terms of Service</Link></li>
          </ul>
        </nav>
      </div>

      <div className="bg-ink text-[11.5px] text-white/70">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-center sm:flex-row sm:text-left">
          <p>© {year} {site.domain}. All rights reserved.</p>
          <p>
            Built by <span className="font-semibold text-white">{site.builder}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
