import type { MetadataRoute } from "next";
import { articles } from "@/lib/data/articles";
import { categories, products } from "@/lib/data/catalog";
import { recipes } from "@/lib/data/learning";
import { brands } from "@/lib/catalog";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => `${site.url}${path}`;
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: url("/brands"), changeFrequency: "weekly", priority: 0.7 },
    { url: url("/learn"), changeFrequency: "weekly", priority: 0.8 },
    { url: url("/blog"), changeFrequency: "weekly", priority: 0.7 },
    ...categories.map((c) => ({ url: url(`/shop?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...brands.map((b) => ({ url: url(`/shop?brand=${b.slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.8, images: [url(`/images/products/${p.slug}.webp`)] })),
    ...recipes.map((r) => ({ url: url(`/learn/${r.slug}`), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...articles.map((a) => ({ url: url(`/blog/${a.slug}`), lastModified: a.date, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: url("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];
}
