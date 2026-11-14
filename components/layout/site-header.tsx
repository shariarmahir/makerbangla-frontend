import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Headphones, LayoutGrid, Search, UserRound } from "lucide-react";
import { categories, products } from "@/lib/data/catalog";
import { brands, collections, deals, getProduct } from "@/lib/catalog";
import { deliveryOptions, mainNav, site } from "@/lib/site";
import { bdt, cn, discount } from "@/lib/utils";
import { TopTicker, type TickerItem } from "./top-ticker";
import { CartButton, MobileMenu, WishlistLink } from "./header-actions";
import { RecentlyViewed } from "./recently-viewed";

/** Announcement bar messages, built from live catalog data (no invented sales or shipment figures). */
function tickerItems(): TickerItem[] {
  const items: TickerItem[] = [];
  const featured = getProduct("raspberry-pi-4");
  if (featured) items.push({ icon: "featured", lead: "Featured", text: `${featured.name} — ${bdt(featured.price)}`, href: `/products/${featured.slug}` });
  const best = [...deals()].sort((a, b) => discount(b.price, b.oldPrice) - discount(a.price, a.oldPrice))[0];
  if (best) items.push({ icon: "offer", lead: `${discount(best.price, best.oldPrice)}% off`, text: `${best.name}, now ${bdt(best.price)}`, href: `/products/${best.slug}` });
  const [inside, outside] = deliveryOptions;
  items.push({ icon: "delivery", lead: "Delivery", text: `${inside.label} ${bdt(inside.fee)} · ${outside.label} ${bdt(outside.fee)} · Cash on delivery`, href: "/info#delivery" });
  const fresh = products.filter((p) => p.isNew);
  if (fresh.length) items.push({ icon: "new", lead: "Just landed", text: `${fresh.length} new arrivals — ${fresh.slice(0, 2).map((p) => p.name.split(" (")[0].split(",")[0]).join(", ")} and more`, href: "/shop?collection=new" });
  items.push({ icon: "deadline", lead: "Deals", text: "Monthly deals end in", href: "/shop?collection=deals" });
  const lab = getProduct("digital-oscilloscope");
  if (lab) items.push({ icon: "equipment", lead: "Lab grade", text: `${lab.name} — ${bdt(lab.price)}`, href: `/products/${lab.slug}` });
  return items;
}

/** Hover / focus dropdown — no client JS. */
function Dropdown({ label, children, className, panel }: { label: React.ReactNode; children: React.ReactNode; className?: string; panel?: string }) {
  return (
    <div className={cn("group/dd relative", className)}>
      <button type="button" aria-haspopup="true" className="flex h-full items-center gap-1.5 [text-transform:inherit] transition-colors group-hover/dd:text-brand-strong">
        {label}
        <ChevronDown className="size-3 transition-transform duration-200 group-hover/dd:rotate-180" />
      </button>
      <div
        className={cn(
          "invisible absolute top-full left-0 z-40 translate-y-1 overflow-hidden rounded-b-2xl border border-line bg-white opacity-0 shadow-[0_24px_48px_-20px_rgb(14_31_77/0.35)] transition-[opacity,translate,visibility] duration-200 group-focus-within/dd:visible group-focus-within/dd:translate-y-0 group-focus-within/dd:opacity-100 group-hover/dd:visible group-hover/dd:translate-y-0 group-hover/dd:opacity-100",
          panel,
        )}
      >
        {children}
      </div>
    </div>
  );
}

const menuLink = "flex items-center justify-between gap-6 rounded-lg px-3 py-2 text-[12.5px] font-medium normal-case tracking-normal text-ink transition-colors hover:bg-tile-sky/40 hover:text-brand-strong";

/** Mega menu: every category with its sub-categories, plus the curated collections. */
function CategoryMega() {
  return (
    <div className="grid grid-cols-[1fr_13rem]">
      <ul className="grid max-h-[calc(100dvh-11rem)] grid-cols-3 gap-x-6 gap-y-5 overflow-y-auto overscroll-contain p-6 xl:grid-cols-4">
        {categories.map((c) => (
          <li key={c.slug} className="normal-case tracking-normal">
            <Link href={`/shop?category=${c.slug}`} className="text-[13px] font-black text-tile-navy transition-colors hover:text-brand">{c.name}</Link>
            <ul className="mt-1.5 space-y-1">
              {c.links.map((l) => (
                <li key={l}>
                  <Link href={`/shop?category=${c.slug}&q=${encodeURIComponent(l)}`} className="text-[12px] font-medium text-subtle transition-colors hover:text-brand-strong">{l}</Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 bg-tile-navy p-5 normal-case tracking-normal text-white">
        {(Object.entries(collections) as [keyof typeof collections, string][]).map(([key, label]) => (
          <Link key={key} href={`/shop?collection=${key}`} className="group/c flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-[13px] font-black text-tile-yellow ring-1 ring-white/15 transition-colors hover:bg-tile-yellow hover:text-tile-navy">
            {label} <ArrowRight className="size-4 transition-transform group-hover/c:translate-x-0.5" />
          </Link>
        ))}
        <Link href="/brands" className="mt-auto text-[12px] font-bold text-white/80 hover:text-white hover:underline">All brands →</Link>
      </div>
    </div>
  );
}

function CategoryList() {
  return (
    <ul className="p-2">
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/shop?category=${c.slug}`} className={menuLink}>{c.name}</Link>
        </li>
      ))}
    </ul>
  );
}

function BrandList() {
  return (
    <ul className="p-2">
      {brands.map((b) => (
        <li key={b.slug}>
          <Link href={`/shop?brand=${b.slug}`} className={menuLink}>
            {b.name}
            <span className="text-[10.5px] text-subtle tabular-nums">{b.count}</span>
          </Link>
        </li>
      ))}
      <li className="mt-1 border-t border-line px-3 pt-2 pb-1">
        <Link href="/brands" className="text-[12px] font-bold normal-case tracking-normal text-brand-strong hover:underline">All brands →</Link>
      </li>
    </ul>
  );
}

function SearchBar({ className }: { className?: string }) {
  return (
    <Form
      action="/shop"
      role="search"
      className={cn(
        "flex h-12 w-full items-stretch rounded-2xl bg-tile-sky/35 p-1 ring-1 ring-tile-sky transition-[background-color,box-shadow] focus-within:bg-white focus-within:ring-2 focus-within:ring-brand",
        className,
      )}
    >
      <label className="relative hidden shrink-0 border-r border-tile-sky sm:block">
        <span className="sr-only">Category or brand</span>
        <select name="in" defaultValue="" className="h-full max-w-44 appearance-none bg-transparent py-0 pr-8 pl-3.5 text-[12px] font-semibold text-tile-navy outline-none">
          <option value="">All Categories</option>
          <optgroup label="Categories">
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </optgroup>
          <optgroup label="Brands">
            {brands.map((b) => (
              <option key={b.slug} value={b.slug}>{b.name}</option>
            ))}
          </optgroup>
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-tile-navy/60" />
      </label>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search Arduino, sensors, brands, #iot, SKU…"
          className="h-full w-full bg-transparent px-3.5 text-[13px] text-ink outline-none placeholder:text-tile-navy/45"
        />
      </label>
      <button
        type="submit"
        aria-label="Search"
        className="grid w-11 shrink-0 place-items-center rounded-xl bg-tile-navy text-tile-yellow shadow-[0_6px_14px_-6px_rgb(26_73_175/0.7)] transition-[background-color,scale] hover:bg-tile-blue hover:text-white active:scale-95 sm:w-12"
      >
        <Search className="size-[18px]" strokeWidth={2.4} />
      </button>
    </Form>
  );
}

const navLink = "relative flex h-full items-center transition-colors hover:text-brand-strong after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:origin-left after:scale-x-0 after:rounded-full after:bg-tile-yellow after:transition-transform hover:after:scale-x-100";

export function SiteHeader() {
  const navCategories = categories.map(({ slug, name }) => ({ slug, name }));
  return (
    <>
      {/* Utility strip — scrolls away */}
      <div className="bg-tile-yellow text-[12px] font-bold text-tile-navy sm:text-[12.5px] print:hidden">
        <div className="container-x flex h-9 items-center justify-between gap-6">
          <TopTicker items={tickerItems()} fallback={`Welcome to ${site.name} — parts, kits and lab gear for every engineering student.`} />
          <nav aria-label="Utility" className="hidden shrink-0 items-center gap-5 md:flex">
            <Link href="/shop" className="underline-offset-4 hover:underline">Catalogue</Link>
            <Link href="/learn#lab-guides" className="underline-offset-4 hover:underline">Lab Guides</Link>
            <Link href="/info" className="underline-offset-4 hover:underline">Info</Link>
            <Link href="#contact" className="underline-offset-4 hover:underline">Contact Us</Link>
            <a href={`tel:${site.phoneIntl}`} className="font-black tabular-nums underline-offset-4 hover:underline">{site.phone}</a>
          </nav>
        </div>
      </div>

      {/* Main header + navigation stay pinned while scrolling */}
      <header className="sticky top-0 z-50 border-b border-line bg-white shadow-[0_10px_24px_-20px_rgb(14_31_77/0.45)] print:hidden">
        <div className="container-x grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 py-2.5 lg:grid-cols-[auto_auto_1fr_auto] lg:gap-x-6 lg:py-3">
          <div className="flex items-center gap-1">
            <MobileMenu nav={mainNav} categories={navCategories} />
            <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
              <Image src="/brand/logo.png" alt={site.name} width={416} height={144} preload sizes="140px" className="h-9 w-auto sm:h-11" />
            </Link>
          </div>

          <Dropdown
            className="hidden h-11 lg:block"
            panel="grid w-[34rem] grid-cols-[1.2fr_1fr] divide-x divide-line rounded-2xl"
            label={
              <span className="flex items-center gap-2 text-[12px] font-bold text-tile-navy">
                <span className="grid size-8 place-items-center rounded-lg bg-tile-sky/60"><LayoutGrid className="size-4" /></span> Shop by Category
              </span>
            }
          >
            <div>
              <p className="px-5 pt-4 text-[10.5px] font-extrabold tracking-wider text-subtle uppercase">Categories</p>
              <CategoryList />
            </div>
            <div>
              <p className="px-5 pt-4 text-[10.5px] font-extrabold tracking-wider text-subtle uppercase">Brands</p>
              <BrandList />
            </div>
          </Dropdown>

          <SearchBar className="order-last col-span-3 lg:order-none lg:col-span-1" />

          <div className="flex items-center justify-end gap-2 sm:gap-3.5">
            <a href={`tel:${site.phoneIntl}`} className="group hidden items-center gap-2.5 xl:flex">
              <span className="grid size-10 place-items-center rounded-full bg-tile-navy text-tile-yellow shadow-[0_8px_16px_-8px_rgb(26_73_175/0.8)] transition-transform group-hover:-rotate-12">
                <Headphones className="size-[19px]" strokeWidth={2} />
              </span>
              <span className="leading-tight">
                <span className="block text-[10.5px] font-medium text-subtle">Help Center</span>
                <span className="block text-[12.5px] font-extrabold text-tile-navy">{site.phone}</span>
              </span>
            </a>
            <Link href="/account" aria-label="Sign in" className="grid size-10 place-items-center rounded-full bg-tile-sky/60 text-tile-navy transition-colors hover:bg-tile-sky lg:hidden">
              <UserRound className="size-[19px]" strokeWidth={2} />
            </Link>
            <WishlistLink />
            <CartButton />
          </div>
        </div>

        {/* Primary navigation */}
        <div className="hidden border-t border-line lg:block">
          <div className="container-x flex h-11 items-center justify-between gap-4">
            <nav aria-label="Primary" className="flex h-full items-center gap-4 text-[11.5px] font-extrabold tracking-wide text-tile-navy uppercase xl:gap-6">
              <Link href="/" className={navLink}>Home</Link>
              <Link href="/shop" className={navLink}>Shop</Link>
              <Dropdown className="h-full" panel="w-[50rem] xl:w-[60rem]" label="Categories">
                <CategoryMega />
              </Dropdown>
              <Dropdown className="h-full" panel="w-64" label="Brands">
                <BrandList />
              </Dropdown>
              <Link href="/shop?collection=new" className={navLink}>New Arrivals</Link>
              <Link
                href="/shop?collection=deals"
                className="flex items-center gap-1.5 rounded-full bg-tile-yellow px-3.5 py-1.5 font-black text-tile-navy shadow-[0_6px_14px_-8px_rgb(160_110_0/0.9)] ring-1 ring-tile-navy/10 transition-[translate,box-shadow] hover:-translate-y-px hover:shadow-[0_8px_18px_-8px_rgb(160_110_0/0.9)]"
              >
                <span aria-label="Discount" className="flex">
                  {"Discount".split("").map((ch, i) => (
                    <span key={i} aria-hidden className="letter-zoom" style={{ animationDelay: `${i * 0.09}s` }}>{ch}</span>
                  ))}
                </span>
              </Link>
              <Dropdown className="h-full" panel="w-56" label="Learning Hub">
                <ul className="p-2">
                  <li><Link href="/learn" className={menuLink}>Learning Hub</Link></li>
                  <li><Link href="/learn#lab-guides" className={menuLink}>Lab Guides</Link></li>
                  <li><Link href="/blog" className={menuLink}>Tech Insights</Link></li>
                </ul>
              </Dropdown>
              <Dropdown className="hidden h-full xl:block" panel="w-80" label="Recently Viewed">
                <RecentlyViewed />
              </Dropdown>
              <Link href="/info" className={navLink}>Info</Link>
              <Link href="#contact" className={navLink}>Contact</Link>
            </nav>
            <Link
              href="/account"
              className="group flex shrink-0 items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[12px] font-extrabold text-tile-navy ring-1 ring-tile-sky transition-colors hover:bg-tile-sky/40"
            >
              <span className="grid size-7 place-items-center rounded-full bg-tile-navy text-tile-yellow">
                <UserRound className="size-3.5" strokeWidth={2.4} />
              </span>
              Sign in
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
