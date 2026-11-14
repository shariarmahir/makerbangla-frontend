import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { applications, categories, departmentNames, departments, interfaces, voltages } from "@/lib/data/catalog";
import { brands, getBrand, getCategory, parseFilters, searchProducts, sorts, type Filters } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop Engineering Components & Lab Equipment",
  description:
    "Browse sensors, microcontrollers, motors, power modules, ICs, test instruments, civil survey tools and architecture studio supplies. Filter by brand, department, voltage, interface and application.",
  keywords: ["brand", "brands", ...brands.map((b) => b.name), "electronics shop Bangladesh"],
  alternates: { canonical: "/shop" },
};

const filterFields = [
  { name: "brand", label: "Brand", options: brands.map((b) => [b.slug, b.name] as const) },
  { name: "department", label: "Department", options: departments.map((d) => [d, departmentNames[d]] as const) },
  { name: "voltage", label: "Voltage / Rating", options: voltages.map((v) => [v, v] as const) },
  { name: "interface", label: "Interface", options: interfaces.map((v) => [v, v] as const) },
  { name: "application", label: "Application", options: applications.map((v) => [v, v] as const) },
] as const;

function hrefWith(f: Filters, patch: Partial<Filters>) {
  const next = { ...f, ...patch };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(next)) if (v && !(k === "sort" && v === "featured")) qs.set(k, String(v));
  const s = qs.toString();
  return s ? `/shop?${s}` : "/shop";
}

const select = "h-10 w-full rounded-lg border border-line bg-white px-3 text-[12.5px] outline-none focus:border-brand";
const label = "mb-1.5 block text-[11px] font-bold tracking-wider text-subtle uppercase";

async function Results({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const f = parseFilters(await searchParams);
  const list = searchProducts(f);
  const category = f.category ? getCategory(f.category) : undefined;
  const brand = f.brand ? getBrand(f.brand) : undefined;
  const active = (["q", "brand", "department", "voltage", "interface", "application"] as const).filter((k) => f[k]);

  const allCats = [{ slug: undefined, name: "All products" }, ...categories];
  const filterForm = (
    <Form action="/shop" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {f.category && <input type="hidden" name="category" value={f.category} />}
      {f.q && <input type="hidden" name="q" value={f.q} />}
      {filterFields.map((field) => (
        <label key={field.name} className="block">
          <span className={label}>{field.label}</span>
          <select name={field.name} defaultValue={f[field.name] ?? ""} className={select}>
            <option value="">Any</option>
            {field.options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        </label>
      ))}
      <label className="block">
        <span className={label}>Sort by</span>
        <select name="sort" defaultValue={f.sort} className={select}>
          {Object.entries(sorts).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </label>
      <button type="submit" className="btn-dark w-full self-end">Apply filters</button>
    </Form>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr] lg:gap-8">
      {/* Mobile / tablet: category chips + collapsible filters */}
      <div className="min-w-0 space-y-3 lg:hidden">
        <nav aria-label="Categories" className="rail -mx-4 gap-2 px-4">
          {allCats.map((c) => (
            <Link
              key={c.name}
              href={hrefWith(f, { category: c.slug })}
              className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] whitespace-nowrap", f.category === c.slug ? "border-ink bg-ink text-white" : "border-line bg-white")}
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <details className="rounded-2xl border border-line bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12px] font-bold tracking-wider uppercase">
            <SlidersHorizontal className="size-4" /> Filters & sort
          </summary>
          <div className="border-t border-line p-4">{filterForm}</div>
        </details>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden space-y-6 rounded-2xl border border-line bg-white p-5 lg:sticky lg:top-4 lg:block lg:self-start">
        <nav aria-label="Categories">
          <p className={label}>Category</p>
          <ul className="space-y-0.5 text-[12.5px]">
            {allCats.map((c) => (
              <li key={c.name}>
                <Link href={hrefWith(f, { category: c.slug })} className={cn("block py-1 transition-colors hover:text-brand-strong", f.category === c.slug && "font-bold text-brand-strong")}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Brands">
          <p className={label}>Brands</p>
          <ul className="space-y-0.5 text-[12.5px]">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link href={hrefWith(f, { brand: f.brand === b.slug ? undefined : b.slug })} className={cn("flex justify-between py-1 transition-colors hover:text-brand-strong", f.brand === b.slug && "font-bold text-brand-strong")}>
                  {b.name} <span className="text-[11px] text-subtle tabular-nums">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {filterForm}
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {f.q ? <>Results for “{f.q}”</> : [brand?.name, category?.name].filter(Boolean).join(" · ") || "All Products"}
          </h1>
          <p className="text-[12px] text-subtle tabular-nums">{list.length} products</p>
        </div>

        {active.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2">
            {active.map((k) => (
              <li key={k}>
                <Link href={hrefWith(f, { [k]: undefined })} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11.5px] hover:border-sale hover:text-sale">
                  {k === "department" ? departmentNames[f[k] as keyof typeof departmentNames] : k === "brand" ? brand?.name : f[k]} <X className="size-3" />
                </Link>
              </li>
            ))}
            <li><Link href={hrefWith({ q: "", sort: f.sort }, { category: f.category })} className="inline-flex px-2 py-1 text-[11.5px] font-semibold text-subtle underline-offset-2 hover:underline">Clear all</Link></li>
          </ul>
        )}

        {list.length ? (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line sm:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
            <p className="font-semibold">No products match these filters.</p>
            <Link href="/shop" className="btn-cta mt-5">View all products</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsFallback() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
      <div className="hidden h-96 animate-pulse bg-soft lg:block" />
      <div className="grid grid-cols-2 gap-px sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-3/4 animate-pulse bg-soft" />)}
      </div>
    </div>
  );
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Shop</span>
      </nav>
      <Suspense fallback={<ResultsFallback />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
