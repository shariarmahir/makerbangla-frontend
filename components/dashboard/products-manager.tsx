"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, FileUp, ImageOff, Pencil, Plus, Search, Upload } from "lucide-react";
import { deleteProducts, importProducts, resetProducts, saveProduct, setStock } from "@/lib/admin/actions/catalog";
import type { CatalogItem } from "@/lib/admin/types";
import { bdt, cn, discount } from "@/lib/utils";
import { ImagePicker } from "./image-picker";
import { Btn, ConfirmButton, download, Field, input, Modal, textarea, toast, toCsv, useAction } from "./kit";
import { Card, Empty, Pill } from "./ui";

type Cat = { slug: string; name: string };

/** Minimal CSV parser (quotes, commas, newlines) for bulk import. */
function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function ProductsManager({ products, categories, isAdmin }: { products: CatalogItem[]; categories: Cat[]; isAdmin: boolean }) {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [view, setView] = useState(params.get("stock") === "low" ? "low" : "all");
  const [picked, setPicked] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<Partial<CatalogItem> | null>(params.get("new") === "1" ? { active: true, isNew: true, stock: 10 } : null);
  const [importing, setImporting] = useState(false);
  const { pending, exec } = useAction();
  const catName = (s: string) => categories.find((c) => c.slug === s)?.name ?? s;

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (view === "all" || (view === "low" && p.stock > 0 && p.stock <= 5) || (view === "out" && p.stock === 0) || (view === "offer" && p.oldPrice) || (view === "hidden" && !p.active)) &&
        (!s || `${p.name} ${p.sku}`.toLowerCase().includes(s)),
    );
  }, [products, q, cat, view]);
  const pages = Math.max(1, Math.ceil(shown.length / 20));
  const pg = Math.min(page, pages - 1);
  const rows = shown.slice(pg * 20, pg * 20 + 20);
  const allPicked = rows.length > 0 && rows.every((p) => picked.includes(p.slug));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Btn tone="primary" onClick={() => setEdit({ active: true, isNew: true, stock: 10 })}><Plus className="size-4" /> Add product</Btn>
        <Btn onClick={() => setImporting(true)}><FileUp className="size-4 text-brand" /> Bulk import</Btn>
        <Btn onClick={() => download("products.csv", toCsv([["Name", "SKU", "Category", "Price", "Regular price", "Stock", "Active", "Summary"], ...shown.map((p) => [p.name, p.sku, p.category, p.price, p.oldPrice ?? "", p.stock, p.active ? "yes" : "no", p.summary])]))}><Download className="size-4 text-brand" /> Export CSV</Btn>
        {isAdmin && <ConfirmButton icon={false} label="Reset to site catalog" confirm="Reset all products" onConfirm={() => exec(() => resetProducts(), "Products reset to the site catalog")} className="ml-auto h-10 px-4" />}
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {[["all", "All"], ["offer", "On offer"], ["low", "Low stock"], ["out", "Out of stock"], ["hidden", "Hidden"]].map(([v, l]) => (
            <button key={v} onClick={() => (setView(v), setPage(0))} className={cn("h-8 rounded-full px-3 text-[12px] font-black", view === v ? "bg-tile-navy text-tile-yellow" : "bg-soft text-subtle hover:text-ink")}>{l}</button>
          ))}
          <select value={cat} onChange={(e) => (setCat(e.target.value), setPage(0))} aria-label="Category" className={cn(input, "ml-auto w-auto min-w-40")}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <label className="relative w-full sm:w-60">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand" />
            <input value={q} onChange={(e) => (setQ(e.target.value), setPage(0))} placeholder="Search name or SKU" aria-label="Search products" className={cn(input, "pl-9")} />
          </label>
        </div>

        {picked.length > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-tile-sky/50 px-3 py-2 text-[12.5px] font-bold text-tile-navy">
            {picked.length} selected
            <ConfirmButton label="Delete selected" confirm={`Delete ${picked.length}`} onConfirm={() => exec(() => deleteProducts({ slugs: picked }), "Products deleted").then((r) => r.ok && setPicked([]))} className="ml-auto" />
            <Btn size="sm" onClick={() => setPicked([])}>Clear</Btn>
          </div>
        )}

        {shown.length === 0 ? (
          <Empty>No products match.</Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-[11px] font-black tracking-wide text-subtle uppercase [&>th]:px-2 [&>th]:pb-2.5">
                  <th className="w-8 !pl-0"><input type="checkbox" aria-label="Select all" checked={allPicked} onChange={() => setPicked(allPicked ? [] : rows.map((p) => p.slug))} className="size-4 accent-[var(--color-tile-navy)]" /></th>
                  <th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th className="text-right">Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.slug} className="border-b border-line/70 last:border-0 hover:bg-soft/50 [&>td]:px-2 [&>td]:py-2.5">
                    <td className="!pl-0"><input type="checkbox" aria-label={`Select ${p.name}`} checked={picked.includes(p.slug)} onChange={() => setPicked((s) => (s.includes(p.slug) ? s.filter((x) => x !== p.slug) : [...s, p.slug]))} className="size-4 accent-[var(--color-tile-navy)]" /></td>
                    <td>
                      <span className="flex items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-stage">
                          {/* eslint-disable-next-line @next/next/no-img-element -- small local thumbnails */}
                          {p.image ? <img src={p.image} alt="" loading="lazy" className="size-full object-contain p-1" /> : <ImageOff className="size-4 text-subtle" />}
                        </span>
                        <span className="min-w-0">
                          <b className="line-clamp-1 text-ink">{p.name}</b>
                          <span className="text-[11px] font-semibold text-subtle">{p.sku}</span>
                        </span>
                      </span>
                    </td>
                    <td className="font-semibold text-subtle">{catName(p.category)}</td>
                    <td className="tabular-nums">
                      <b className="text-ink">{bdt(p.price)}</b>
                      {p.oldPrice && (
                        <span className="block text-[11px]">
                          <s className="font-bold text-sale decoration-2">{bdt(p.oldPrice)}</s> <span className="font-black text-tile-navy">−{discount(p.price, p.oldPrice)}%</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        defaultValue={p.stock}
                        key={p.stock}
                        aria-label={`Stock for ${p.name}`}
                        onBlur={(e) => Number(e.target.value) !== p.stock && exec(() => setStock({ slug: p.slug, stock: Number(e.target.value) }), "Stock updated")}
                        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                        className={cn(input, "h-8 w-20 text-center tabular-nums", p.stock === 0 ? "text-sale ring-tile-coral/50" : p.stock <= 5 && "ring-tile-yellow")}
                      />
                    </td>
                    <td className="space-x-1">
                      <Pill tone={p.active ? "confirmed" : "neutral"}>{p.active ? "Live" : "Hidden"}</Pill>
                      {p.isNew && <Pill tone="pending">New</Pill>}
                    </td>
                    <td className="text-right">
                      <span className="inline-flex gap-1">
                        <Btn size="icon" tone="soft" aria-label={`Edit ${p.name}`} onClick={() => setEdit(p)}><Pencil className="size-3.5" /></Btn>
                        <ConfirmButton size="icon" label={`Delete ${p.name}`} onConfirm={() => exec(() => deleteProducts({ slugs: [p.slug] }), "Product deleted")} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex items-center gap-1.5 text-[12.5px] font-bold text-subtle">
            <Btn size="sm" tone="soft" disabled={pg === 0} onClick={() => setPage(pg - 1)}>Previous</Btn>
            <span className="px-2 tabular-nums">Page {pg + 1} of {pages} · {shown.length} products</span>
            <Btn size="sm" tone="soft" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)}>Next</Btn>
          </nav>
        )}
      </Card>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.slug ? "Edit product" : "Add product"} wide>
        {edit && <ProductForm key={edit.slug ?? "new"} item={edit} categories={categories} pending={pending} onSave={(data) => exec(() => saveProduct(data), edit.slug ? "Product updated" : "Product added").then((r) => r.ok && setEdit(null))} onCancel={() => setEdit(null)} />}
      </Modal>
      <Modal open={importing} onOpenChange={setImporting} title="Bulk import products" wide>
        <ImportForm categories={categories} pending={pending} onImport={(rows) => exec(() => importProducts({ rows })).then((r) => r.ok && (setImporting(false), alertResult(r.data)))} />
      </Modal>
    </div>
  );
}

const alertResult = (d: { added: number; skipped: number; firstError?: string }) => toast(`${d.added} added${d.skipped ? `, ${d.skipped} skipped (${d.firstError})` : ""}`);

function ProductForm({ item, categories, pending, onSave, onCancel }: { item: Partial<CatalogItem>; categories: Cat[]; pending: boolean; onSave: (d: unknown) => void; onCancel: () => void }) {
  const [image, setImage] = useState(item.image ?? "");
  const [regular, setRegular] = useState(String(item.oldPrice ?? item.price ?? ""));
  const [offer, setOffer] = useState(item.oldPrice ? String(item.price) : "");
  const off = discount(Number(offer), Number(regular));
  return (
    <form
      className="grid gap-4 md:grid-cols-[1fr_220px]"
      onSubmit={(e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget));
        onSave({ ...f, slug: item.slug, isNew: f.isNew === "on", active: f.active === "on" });
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product image" className="sm:col-span-2"><ImagePicker name="image" value={image} onChange={setImage} /></Field>
        <Field label="Name" className="sm:col-span-2"><input name="name" required maxLength={120} defaultValue={item.name} className={input} /></Field>
        <Field label="SKU"><input name="sku" required maxLength={40} defaultValue={item.sku} className={cn(input, "uppercase")} /></Field>
        <Field label="Category">
          <select name="category" defaultValue={item.category ?? categories[0]?.slug} className={input}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        </Field>
        <Field label="Regular price (BDT)"><input name="regular" type="number" min={1} required value={regular} onChange={(e) => setRegular(e.target.value)} className={input} /></Field>
        <Field label="Offer price (optional)" hint="Leave empty for no offer."><input name="offer" type="number" min={0} value={offer} onChange={(e) => setOffer(e.target.value)} className={input} /></Field>
        <Field label="Stock"><input name="stock" type="number" min={0} required defaultValue={item.stock ?? 0} className={input} /></Field>
        <div className="flex items-end gap-4 pb-2.5 text-[12.5px] font-bold text-ink">
          <label className="flex items-center gap-1.5"><input name="active" type="checkbox" defaultChecked={item.active ?? true} className="size-4 accent-[var(--color-tile-navy)]" /> Live</label>
          <label className="flex items-center gap-1.5"><input name="isNew" type="checkbox" defaultChecked={item.isNew} className="size-4 accent-[var(--color-tile-navy)]" /> New arrival</label>
        </div>
        <Field label="Summary" className="sm:col-span-2"><textarea name="summary" maxLength={400} defaultValue={item.summary} className={textarea} /></Field>
      </div>

      {/* Live card preview in the storefront style */}
      <div>
        <p className="mb-1.5 text-[11.5px] font-black tracking-wide text-subtle uppercase">Card preview</p>
        <div className="relative rounded-[20px] bg-tile-yellow p-4 pt-3 text-tile-navy">
          {off > 0 && <span className="absolute -top-3 -left-2 grid size-14 -rotate-12 place-content-center rounded-full bg-tile-coral text-center leading-none text-white shadow-lg"><b className="text-[15px]">{off}%</b><span className="text-[8px] font-black tracking-widest">OFF</span></span>}
          <div className="grid aspect-[1/0.84] place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- preview */}
            {image ? <img src={image} alt="" className="max-h-full object-contain drop-shadow-xl" /> : <ImageOff className="size-8 opacity-40" />}
          </div>
          <p className="mt-2 line-clamp-2 text-[14px] leading-tight font-black">{item.name || "Product name"}</p>
          <p className="mt-2 text-[17px] font-black tabular-nums">{bdt(Number(offer) || Number(regular) || 0)}</p>
          {off > 0 && <s className="text-[12px] font-black text-sale decoration-2">{bdt(Number(regular))}</s>}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={onCancel}>Cancel</Btn>
          <Btn type="submit" tone="primary" disabled={pending}>Save</Btn>
        </div>
      </div>
    </form>
  );
}

function ImportForm({ categories, pending, onImport }: { categories: Cat[]; pending: boolean; onImport: (rows: string[][]) => void }) {
  const [text, setText] = useState("");
  const rows = parseCsv(text);
  const data = rows[0]?.[0]?.toLowerCase().trim() === "name" ? rows.slice(1) : rows;
  return (
    <div className="space-y-3">
      <p className="text-[12.5px] leading-relaxed text-subtle">
        Columns: <b className="text-ink">name, sku, category, regular price, offer price, stock, summary</b>. Category is one of: {categories.map((c) => c.slug).join(", ")}. Add photos afterwards from each product&apos;s edit form.
      </p>
      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => download("product-import-template.csv", toCsv([["name", "sku", "category", "regular price", "offer price", "stock", "summary"], ["Arduino Nano V3", "MB-MCU-099", "microcontrollers", "650", "590", "25", "Compact ATmega328P board for breadboards."]]))}><Download className="size-4 text-brand" /> Template</Btn>
        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-4 text-[13px] font-bold text-tile-navy ring-1 ring-line hover:bg-soft">
          <Upload className="size-4 text-brand" /> Choose CSV
          <input type="file" accept=".csv,text/csv" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f && f.size < 1_000_000) setText(await f.text()); }} />
        </label>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="…or paste CSV rows here" className={cn(textarea, "min-h-40 font-mono text-[12px]")} />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-subtle">{data.length} row{data.length === 1 ? "" : "s"} ready</span>
        <Btn tone="primary" disabled={pending || !data.length || data.length > 1000} onClick={() => onImport(data.map((r) => r.slice(0, 7)))}><Upload className="size-4" /> Import</Btn>
      </div>
    </div>
  );
}
