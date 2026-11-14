import credits from "@/lib/data/image-credits.json";
import cutouts from "@/lib/data/cutouts.json";
import {
  applications, categories, departments, interfaces, products, voltages,
  type Category, type Product,
} from "@/lib/data/catalog";
import type { ProductRef } from "@/lib/store";
import { slugify } from "@/lib/utils";

/** Original photo — used for Open Graph, JSON-LD and the sitemap. */
export const productImage = (slug: string) => `/images/products/${slug}.webp`;

const cut = new Set<string>(cutouts);

/** Best on-page visual: a transparent cut-out when one exists, otherwise the framed photo. */
export const productVisual = (slug: string) =>
  cut.has(slug) ? { src: `/images/cutouts/${slug}.webp`, cutout: true } : { src: productImage(slug), cutout: false };

export const toRef = (p: Product): ProductRef => ({ slug: p.slug, name: p.name, price: p.price, image: productVisual(p.slug).src });

/* ── Brands ─────────────────────────────────────────────────────────── */

export type Brand = { name: string; slug: string; count: number };

export const brands: Brand[] = Object.entries(
  products.reduce<Record<string, number>>((acc, p) => {
    if (p.brand !== "Generic") acc[p.brand] = (acc[p.brand] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([name, count]) => ({ name, slug: slugify(name), count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

export const getBrand = (slug: string) => brands.find((b) => b.slug === slug);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export const getCategory = (slug: string): Category | undefined => categories.find((c) => c.slug === slug);

export const categoryCount = (slug: string) => products.filter((p) => p.category === slug).length;

export const productsIn = (slug: string, limit = 4) => products.filter((p) => p.category === slug).slice(0, limit);

export const deals = () => products.filter((p) => p.oldPrice);

export const related = (p: Product, limit = 4) =>
  [
    ...(p.worksWith ?? []).map(getProduct).filter((x): x is Product => !!x),
    ...products.filter((x) => x.category === p.category && x.slug !== p.slug),
  ]
    .filter((x, i, all) => all.findIndex((y) => y.slug === x.slug) === i)
    .slice(0, limit);

export function imageCredit(slug: string) {
  return (credits as Record<string, { author: string; license: string; source: string } | undefined>)[slug];
}

/* ── Search ─────────────────────────────────────────────────────────── */

/** Curated collections shown in the navigation. */
export const collections = { new: "New Arrivals", deals: "Discount Deals" } as const;
export type Collection = keyof typeof collections;

export const sorts = { featured: "Featured", "price-asc": "Price: low to high", "price-desc": "Price: high to low", name: "Name" } as const;

export type Filters = {
  q: string;
  category?: string;
  brand?: string;
  department?: string;
  voltage?: string;
  interface?: string;
  application?: string;
  collection?: Collection;
  sort: keyof typeof sorts;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim();
const pick = <T extends string>(v: string | undefined, allowed: readonly T[]) =>
  allowed.includes(v as T) ? (v as T) : undefined;

/** Parse untrusted URL params into a whitelisted filter object. */
export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  // The header search sends one combined "in" field (a category or a brand).
  const scope = one(sp.in);
  const catSlugs = categories.map((c) => c.slug);
  const brandSlugs = brands.map((b) => b.slug);
  return {
    q: (one(sp.q) ?? "").slice(0, 80),
    category: pick(one(sp.category), catSlugs) ?? pick(scope, catSlugs),
    brand: pick(one(sp.brand), brandSlugs) ?? pick(scope, brandSlugs),
    department: pick(one(sp.department), departments),
    voltage: pick(one(sp.voltage), voltages),
    interface: pick(one(sp.interface), interfaces),
    application: pick(one(sp.application), applications),
    collection: pick(one(sp.collection), Object.keys(collections) as Collection[]),
    sort: pick(one(sp.sort), Object.keys(sorts) as (keyof typeof sorts)[]) ?? "featured",
  };
}

const haystack = new Map(
  products.map((p) => [
    p.slug,
    [
      p.name, p.sku, p.brand, p.category, getCategory(p.category)?.name, p.summary,
      ...p.tags, ...(p.colors ?? []), ...(p.interfaces ?? []), p.voltage, ...p.applications, ...p.departments,
      ...p.specs.flat(), p.brand !== "Generic" ? "brand brands" : "",
    ].join(" ").toLowerCase(),
  ]),
);

export function searchProducts(f: Filters) {
  // Every term must match; "#tag" and "tag" both hit hashtags.
  const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = products.filter(
    (p) =>
      (!f.category || p.category === f.category) &&
      (!f.brand || slugify(p.brand) === f.brand) &&
      (!f.department || p.departments.includes(f.department as Product["departments"][number])) &&
      (!f.voltage || p.voltage === f.voltage) &&
      (!f.interface || p.interfaces?.includes(f.interface as never)) &&
      (!f.application || p.applications.includes(f.application as never)) &&
      (!f.collection || (f.collection === "new" ? !!p.isNew : !!p.oldPrice)) &&
      terms.every((t) => {
        const text = haystack.get(p.slug)!;
        return text.includes(t) || text.includes(t.replace(/^#/, ""));
      }),
  );
  const by = {
    featured: () => 0,
    "price-asc": (a: Product, b: Product) => a.price - b.price,
    "price-desc": (a: Product, b: Product) => b.price - a.price,
    name: (a: Product, b: Product) => a.name.localeCompare(b.name),
  }[f.sort];
  return f.sort === "featured" ? list : [...list].sort(by as (a: Product, b: Product) => number);
}
