"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { productVisual } from "@/lib/catalog";
import { categories, products } from "@/lib/data/catalog";
import { tones, type ToneName } from "@/lib/tones";
import { slugify } from "@/lib/utils";
import { idOf, mediaOrPath, money, run, str, UserError } from "../action";
import { log, mutate, uid } from "../db";
import type { CatalogItem } from "../types";

const categorySlugs = categories.map((c) => c.slug) as [string, ...string[]];
const optionalMoney = z.union([z.literal(""), z.null(), money]).transform((v) => (v === "" || v === null ? undefined : v));

/** "Regular price" and optional "Offer price" in the form → price / oldPrice in the catalog. */
const productSchema = z
  .object({
    slug: z.string().max(80).optional(),
    name: str(120, 2, "Name"),
    sku: str(40, 2, "SKU"),
    category: z.enum(categorySlugs, "Pick a category."),
    regular: money.min(1, "Enter the regular price."),
    offer: optionalMoney,
    stock: z.coerce.number().int().min(0).max(1_000_000),
    summary: str(400),
    image: z.union([z.literal(""), mediaOrPath]),
    isNew: z.boolean(),
    active: z.boolean(),
  })
  .refine((d) => d.offer === undefined || d.offer < d.regular, { message: "The offer price must be lower than the regular price.", path: ["offer"] });

const toItem = (d: z.infer<typeof productSchema>, slug: string): CatalogItem => ({
  slug, name: d.name, sku: d.sku.toUpperCase(), category: d.category, stock: d.stock, summary: d.summary,
  price: d.offer ?? d.regular, oldPrice: d.offer !== undefined ? d.regular : undefined,
  image: d.image, isNew: d.isNew, active: d.active,
});

export async function saveProduct(input: unknown) {
  return run("products", productSchema, input, (d, user) =>
    mutate((db) => {
      const existing = d.slug ? db.products.findIndex((p) => p.slug === d.slug) : -1;
      if (db.products.some((p) => p.sku.toUpperCase() === d.sku.toUpperCase() && p.slug !== d.slug)) throw new UserError("Another product already uses that SKU.");
      if (existing >= 0) {
        db.products[existing] = toItem(d, d.slug!);
        log(db, user.name, `updated product ${d.name}`);
      } else {
        let slug = slugify(d.name) || uid("p");
        while (db.products.some((p) => p.slug === slug)) slug = `${slugify(d.name)}-${Math.floor(Math.random() * 900 + 100)}`;
        db.products.unshift(toItem(d, slug));
        log(db, user.name, `added product ${d.name}`);
      }
      return null;
    }),
  );
}

export async function deleteProducts(input: { slugs: string[] }) {
  return run("products", z.object({ slugs: z.array(z.string().max(80)).min(1).max(2000) }), input, ({ slugs }, user) =>
    mutate((db) => {
      const before = db.products.length;
      db.products = db.products.filter((p) => !slugs.includes(p.slug));
      log(db, user.name, `deleted ${before - db.products.length} product(s)`);
      return null;
    }),
  );
}

export async function setStock(input: { slug: string; stock: number }) {
  return run("products", z.object({ slug: z.string().max(80), stock: z.coerce.number().int().min(0).max(1_000_000) }), input, ({ slug, stock }, user) =>
    mutate((db) => {
      const p = db.products.find((x) => x.slug === slug);
      if (!p) throw new UserError("That product no longer exists.");
      p.stock = stock;
      log(db, user.name, `set stock of ${p.name} to ${stock}`);
      return null;
    }),
  );
}

/** Bulk add from CSV rows: name, sku, category, regular price, offer price, stock, summary. */
export async function importProducts(input: { rows: string[][] }) {
  return run("products", z.object({ rows: z.array(z.array(z.string().max(400)).max(12)).min(1, "The file has no rows.").max(1000, "Import up to 1,000 rows at a time.") }), input, ({ rows }, user) =>
    mutate((db) => {
      let added = 0;
      const errors: string[] = [];
      rows.forEach((r, i) => {
        const [name, sku, category, regular, offer, stock, summary] = r.map((c) => c.trim());
        const parsed = productSchema.safeParse({ name, sku, category: slugify(category ?? ""), regular, offer: offer || "", stock: stock || 0, summary: summary ?? "", image: "", isNew: true, active: true });
        if (!parsed.success) return void errors.push(`Row ${i + 1}: ${parsed.error.issues[0]?.message}`);
        if (db.products.some((p) => p.sku.toUpperCase() === parsed.data.sku.toUpperCase())) return void errors.push(`Row ${i + 1}: SKU ${parsed.data.sku} already exists`);
        let slug = slugify(parsed.data.name);
        while (db.products.some((p) => p.slug === slug)) slug = `${slugify(parsed.data.name)}-${Math.floor(Math.random() * 900 + 100)}`;
        db.products.unshift(toItem(parsed.data, slug));
        added++;
      });
      if (!added) throw new UserError(errors[0] ?? "Nothing was imported.");
      log(db, user.name, `imported ${added} product(s)`);
      return { added, skipped: errors.length, firstError: errors[0] };
    }),
  );
}

/** Puts the product list back to the site catalog (removes added items, undoes edits). */
export async function resetProducts() {
  return run("admin", z.null(), null, (_, user) =>
    mutate((db) => {
      db.products = products.map((p) => ({ slug: p.slug, name: p.name, sku: p.sku, category: p.category, price: p.price, oldPrice: p.oldPrice, stock: p.stock, isNew: p.isNew, summary: p.summary, image: productVisual(p.slug).src, active: true }));
      log(db, user.name, "reset products to the site catalog");
      return null;
    }),
  );
}

// ——— Promo banners (live on the home page) ———
const promoSchema = z
  .object({
    id: z.string().max(40).optional(),
    label: str(28, 2, "Offer label"),
    word1: str(10, 1, "First big word"),
    word2: str(10, 1, "Second big word"),
    title: str(32, 2, "Title"),
    text: str(160, 2, "Description"),
    regular: money.min(1, "Enter the price."),
    offer: optionalMoney,
    href: z.string().regex(/^\/(?![/\\])[\w\-/?=&.%]{0,160}$/, "Use a site link that starts with /, e.g. /products/arduino-uno-r3."), // never "//host" (off-site)
    image: mediaOrPath,
    tone: z.enum(Object.keys(tones) as [string, ...string[]]),
    active: z.boolean(),
  })
  .refine((d) => d.offer === undefined || d.offer < d.regular, { message: "The offer price must be lower than the price.", path: ["offer"] });

export async function savePromo(input: unknown) {
  return run("promotions", promoSchema, input, (d, user) =>
    mutate((db) => {
      const promo = {
        id: d.id && db.promos.some((p) => p.id === d.id) ? d.id : uid("promo"),
        label: d.label, words: [d.word1.toUpperCase(), d.word2.toUpperCase()] as [string, string], title: d.title, text: d.text,
        price: d.offer ?? d.regular, oldPrice: d.offer !== undefined ? d.regular : undefined,
        href: d.href, image: d.image, tone: d.tone as ToneName, active: d.active,
      };
      const i = db.promos.findIndex((p) => p.id === promo.id);
      if (i >= 0) db.promos[i] = promo;
      else db.promos.push(promo);
      log(db, user.name, `${i >= 0 ? "updated" : "added"} banner “${d.title}”`);
      updateTag("promos");
      return null;
    }),
  );
}

export async function movePromo(input: { id: string; dir: number }) {
  return run("promotions", z.object({ id: idOf, dir: z.union([z.literal(-1), z.literal(1)]) }), input, ({ id, dir }) =>
    mutate((db) => {
      const i = db.promos.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= db.promos.length) return null;
      [db.promos[i], db.promos[j]] = [db.promos[j], db.promos[i]];
      updateTag("promos");
      return null;
    }),
  );
}

export async function togglePromo(input: { id: string }) {
  return run("promotions", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      const p = db.promos.find((x) => x.id === id);
      if (!p) throw new UserError("That banner no longer exists.");
      p.active = !p.active;
      log(db, user.name, `${p.active ? "showed" : "hid"} banner “${p.title}”`);
      updateTag("promos");
      return null;
    }),
  );
}

export async function deletePromo(input: { id: string }) {
  return run("promotions", z.object({ id: idOf }), input, ({ id }, user) =>
    mutate((db) => {
      db.promos = db.promos.filter((p) => p.id !== id);
      log(db, user.name, "deleted a banner");
      updateTag("promos");
      return null;
    }),
  );
}
