import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Headphones, LayoutGrid, Search } from "lucide-react";
import { categories } from "@/lib/data/catalog";
import { brands, categoryCount } from "@/lib/catalog";
import { mainNav, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CartButton, MobileMenu, WishlistLink } from "./header-actions";
import { RecentlyViewed } from "./recently-viewed";

/** Hover / focus dropdown — no client JS. */
function Dropdown({ label, children, className, panel }: { label: React.ReactNode; children: React.ReactNode; className?: string; panel?: string }) {
  return (
    <div className={cn("group/dd relative", className)}>
      <button type="button" aria-haspopup="true" className="flex h-full items-center gap-1.5">
        {label}
        <ChevronDown className="size-3 transition-transform duration-200 group-hover/dd:rotate-180" />
      </button>
      <div
        className={cn(
          "invisible absolute top-full left-0 z-40 translate-y-1 border border-line bg-white opacity-0 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.18)] transition-[opacity,translate,visibility] duration-200 group-focus-within/dd:visible group-focus-within/dd:translate-y-0 group-focus-within/dd:opacity-100 group-hover/dd:visible group-hover/dd:translate-y-0 group-hover/dd:opacity-100",
          panel,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CategoryList() {
  return (
    <ul className="py-2">
      {categories.map((c) => (
        <li key={c.slug}>
          <Link href={`/shop?category=${c.slug}`} className="flex items-center justify-between gap-6 px-4 py-2 text-[12.5px] font-medium normal-case tracking-normal text-ink transition-colors hover:bg-soft hover:text-brand-strong">
            {c.name}
            <span className="text-[10px] text-subtle tabular-nums">{categoryCount(c.slug)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BrandList() {
  return (
    <ul className="py-2">
      {brands.map((b) => (
        <li key={b.slug}>
          <Link href={`/shop?brand=${b.slug}`} className="flex items-center justify-between gap-6 px-4 py-2 text-[12.5px] font-medium normal-case tracking-normal text-ink transition-colors hover:bg-soft hover:text-brand-strong">
            {b.name}
            <span className="text-[10.5px] text-subtle tabular-nums">{b.count}</span>
          </Link>
        </li>
      ))}
      <li className="mt-1 border-t border-line px-4 pt-2">
        <Link href="/brands" className="text-[12px] font-bold normal-case tracking-normal text-brand-strong hover:underline">All brands →</Link>
      </li>
    </ul>
  );
}

function SearchBar({ className }: { className?: string }) {
  return (
    <Form action="/shop" role="search" className={cn("flex h-11 w-full items-stretch rounded-sm bg-soft ring-1 ring-transparent transition-shadow focus-within:bg-white focus-within:ring-brand", className)}>
      <label className="relative hidden shrink-0 border-r border-line sm:block">
        <span className="sr-only">Category or brand</span>
        <select name="in" defaultValue="" className="h-full max-w-44 appearance-none bg-transparent py-0 pr-8 pl-4 text-[12px] font-medium text-ink-2 outline-none">
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
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-subtle" />
      </label>
      <label className="flex-1">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Search Arduino, sensors, brands, #iot, SKU…"
          className="h-full w-full bg-transparent px-4 text-[13px] outline-none placeholder:text-subtle"
        />
      </label>
      <button type="submit" aria-label="Search" className="grid w-12 shrink-0 place-items-center text-ink transition-colors hover:text-brand-strong">
        <Search className="size-[18px]" />
      </button>
    </Form>
  );
}

export function SiteHeader() {
  const navCategories = categories.map(({ slug, name }) => ({ slug, name }));
  return (
    <header className="print:hidden">
      {/* Utility strip */}
      <div className="border-b border-line bg-soft text-[11px] text-subtle">
        <div className="container-x flex h-8 items-center justify-between gap-4">
          <p className="truncate">Welcome to {site.name} — parts, kits and lab gear for every engineering student.</p>
          <nav aria-label="Utility" className="hidden shrink-0 items-center gap-5 md:flex">
            <Link href="/shop" className="hover:text-ink">Catalogue</Link>
            <Link href="/learn#lab-guides" className="hover:text-ink">Lab Guides</Link>
            <Link href="#contact" className="hover:text-ink">Contact Us</Link>
            <a href={`tel:${site.phoneIntl}`} className="font-semibold text-ink hover:text-brand-strong">{site.phone}</a>
          </nav>
        </div>
      </div>

      {/* Main header */}
      <div className="container-x grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 py-3 lg:grid-cols-[auto_auto_1fr_auto] lg:gap-x-6 lg:py-4">
        <div className="flex items-center gap-1">
          <MobileMenu nav={mainNav} categories={navCategories} />
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
            <Image src="/brand/logo.png" alt={site.name} width={416} height={144} preload sizes="140px" className="h-10 w-auto sm:h-12" />
          </Link>
        </div>

        <Dropdown
          className="hidden h-11 lg:block"
          panel="grid w-[34rem] grid-cols-[1.2fr_1fr] divide-x divide-line"
          label={
            <span className="flex items-center gap-2 text-[12px] font-bold">
              <LayoutGrid className="size-4" /> Shop by Category
            </span>
          }
        >
          <div>
            <p className="px-4 pt-3 text-[10.5px] font-extrabold tracking-wider text-subtle uppercase">Categories</p>
            <CategoryList />
          </div>
          <div>
            <p className="px-4 pt-3 text-[10.5px] font-extrabold tracking-wider text-subtle uppercase">Brands</p>
            <BrandList />
          </div>
        </Dropdown>

        <SearchBar className="order-last col-span-3 lg:order-none lg:col-span-1" />

        <div className="flex items-center justify-end gap-3 sm:gap-5">
          <a href={`tel:${site.phoneIntl}`} className="hidden items-center gap-2 xl:flex">
            <Headphones className="size-[22px]" strokeWidth={1.6} />
            <span className="leading-tight">
              <span className="block text-[10.5px] font-medium text-subtle">Help Center</span>
              <span className="block text-[12.5px] font-extrabold">{site.phone}</span>
            </span>
          </a>
          <WishlistLink />
          <CartButton />
        </div>
      </div>

      {/* Primary navigation */}
      <div className="hidden border-y border-line lg:block">
        <div className="container-x flex h-11 items-center justify-between">
          <nav aria-label="Primary" className="flex h-full items-center gap-5 text-[11.5px] font-extrabold tracking-wide uppercase xl:gap-7">
            <Link href="/" className="transition-colors hover:text-brand-strong">Home</Link>
            <Link href="/shop" className="transition-colors hover:text-brand-strong">Shop</Link>
            <Dropdown className="h-full" panel="w-72" label="Categories">
              <CategoryList />
            </Dropdown>
            <Dropdown className="h-full" panel="w-64" label="Brands">
              <BrandList />
            </Dropdown>
            <Dropdown className="h-full" panel="w-80" label="Recently Viewed">
              <RecentlyViewed />
            </Dropdown>
            {mainNav.slice(3).map((l) => (
              <Link key={l.href} href={l.href} className="transition-colors hover:text-brand-strong">{l.label}</Link>
            ))}
          </nav>
          <p className="hidden text-[11px] text-subtle xl:block">
            Prices in <span className="font-bold text-ink">BDT</span>
          </p>
        </div>
      </div>
    </header>
  );
}
