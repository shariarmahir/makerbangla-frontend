"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { PromoSlides } from "@/components/home/promo-slides";
import { deletePromo, movePromo, savePromo, togglePromo } from "@/lib/admin/actions/catalog";
import type { CatalogItem, Promo } from "@/lib/admin/types";
import { toOffer } from "@/lib/promos";
import { tones, type ToneName } from "@/lib/tones";
import { bdt, cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";
import { Btn, ConfirmButton, Field, input, Modal, textarea, useAction } from "./kit";
import { Empty, Pill } from "./ui";

const toneNames = Object.keys(tones) as ToneName[];
const blank: Promo = { id: "", label: "Best Offer", words: ["BIG", "DEAL"], title: "", text: "", price: 0, href: "/shop", image: "", tone: "yellow", active: true };

/** Home-page promo banners: live previews, show/hide, reorder, edit with a live preview, delete. */
export function PromosManager({ promos, products }: { promos: Promo[]; products: CatalogItem[] }) {
  const [edit, setEdit] = useState<Promo | null>(null);
  const { pending, exec } = useAction();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Btn tone="primary" onClick={() => setEdit(blank)}><Plus className="size-4" /> New banner</Btn>
        <p className="text-[12.5px] font-semibold text-subtle">{promos.filter((p) => p.active).length} of {promos.length} banners are live on the home page. Changes publish instantly.</p>
      </div>
      {promos.length === 0 && <Empty>No banners yet. The home page hides the section until one is live.</Empty>}
      {promos.map((p, i) => (
        <section key={p.id} className={cn("dash-rise rounded-[22px] bg-white p-4 ring-1 ring-line sm:p-5", !p.active && "opacity-70")}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-black text-ink">{i + 1}. {p.title}</span>
            <Pill tone={p.active ? "delivered" : "neutral"}>{p.active ? "Live" : "Hidden"}</Pill>
            <span className="ml-auto flex gap-1">
              <Btn size="icon" tone="soft" aria-label="Move up" disabled={pending || i === 0} onClick={() => exec(() => movePromo({ id: p.id, dir: -1 }))}><ArrowUp className="size-4" /></Btn>
              <Btn size="icon" tone="soft" aria-label="Move down" disabled={pending || i === promos.length - 1} onClick={() => exec(() => movePromo({ id: p.id, dir: 1 }))}><ArrowDown className="size-4" /></Btn>
              <Btn size="sm" tone="soft" onClick={() => exec(() => togglePromo({ id: p.id }), p.active ? "Banner hidden" : "Banner is live")}>{p.active ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}{p.active ? "Hide" : "Show"}</Btn>
              <Btn size="sm" tone="accent" onClick={() => setEdit(p)}><Pencil className="size-3.5" /> Edit</Btn>
              <ConfirmButton size="icon" label="Delete banner" onConfirm={() => exec(() => deletePromo({ id: p.id }), "Banner deleted")} />
            </span>
          </div>
          <div className="pt-14"><PromoSlides offers={[toOffer(p)]} /></div>
        </section>
      ))}

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title={edit?.id ? "Edit banner" : "New banner"} wide>
        {edit && <PromoForm key={edit.id || "new"} promo={edit} products={products} pending={pending} onSave={(d) => exec(() => savePromo(d), "Banner published").then((r) => r.ok && setEdit(null))} onCancel={() => setEdit(null)} />}
      </Modal>
    </div>
  );
}

function PromoForm({ promo, products, pending, onSave, onCancel }: { promo: Promo; products: CatalogItem[]; pending: boolean; onSave: (d: unknown) => void; onCancel: () => void }) {
  const [p, setP] = useState(promo);
  const regular = p.oldPrice ?? p.price;
  const offer = p.oldPrice ? p.price : undefined;
  const set = (patch: Partial<Promo>) => setP((s) => ({ ...s, ...patch }));
  const setPrices = (reg: number, off?: number) => set(off && off < reg ? { price: off, oldPrice: reg } : { price: reg, oldPrice: undefined });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ id: p.id || undefined, label: p.label, word1: p.words[0], word2: p.words[1], title: p.title, text: p.text, regular, offer: offer ?? "", href: p.href, image: p.image, tone: p.tone, active: p.active });
      }}
    >
      <div className="overflow-hidden pt-14"><PromoSlides offers={[toOffer({ ...p, title: p.title || "Product name", text: p.text || "Short description" })]} /></div>

      <Field label="Fill from a product" hint="Copies the name, description, prices, photo and link — then adjust anything.">
        <select
          defaultValue=""
          className={input}
          onChange={(e) => {
            const x = products.find((y) => y.slug === e.target.value);
            if (x) set({ title: x.name.slice(0, 32), text: x.summary.slice(0, 160), price: x.price, oldPrice: x.oldPrice, image: x.image, href: `/products/${x.slug}` });
          }}
        >
          <option value="">Choose a product…</option>
          {products.map((x) => <option key={x.slug} value={x.slug}>{x.name} — {bdt(x.price)}</option>)}
        </select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Offer label"><input value={p.label} onChange={(e) => set({ label: e.target.value })} maxLength={28} required className={input} /></Field>
        <Field label="Big word 1"><input value={p.words[0]} onChange={(e) => set({ words: [e.target.value, p.words[1]] })} maxLength={10} required className={cn(input, "uppercase")} /></Field>
        <Field label="Big word 2"><input value={p.words[1]} onChange={(e) => set({ words: [p.words[0], e.target.value] })} maxLength={10} required className={cn(input, "uppercase")} /></Field>
        <Field label="Title (one line)" className="sm:col-span-2"><input value={p.title} onChange={(e) => set({ title: e.target.value })} maxLength={32} required className={input} /></Field>
        <Field label="Colour">
          <select value={p.tone} onChange={(e) => set({ tone: e.target.value as ToneName })} className={cn(input, "capitalize")}>{toneNames.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        </Field>
        <Field label="Description" className="sm:col-span-3"><textarea value={p.text} onChange={(e) => set({ text: e.target.value })} maxLength={160} required className={textarea} /></Field>
        <Field label="Price (BDT)"><input type="number" min={1} required value={regular || ""} onChange={(e) => setPrices(Number(e.target.value), offer)} className={input} /></Field>
        <Field label="Offer price (optional)" hint="Shown big; the price above is struck through in red."><input type="number" min={0} value={offer ?? ""} onChange={(e) => setPrices(regular, Number(e.target.value) || undefined)} className={input} /></Field>
        <Field label="Link"><input value={p.href} onChange={(e) => set({ href: e.target.value })} required pattern="/.*" className={input} /></Field>
        <Field label="Banner image" className="sm:col-span-2" hint="A transparent PNG/WebP cut-out looks best."><ImagePicker name="image" value={p.image} onChange={(image) => set({ image })} /></Field>
        <label className="flex items-center gap-2 self-end pb-3 text-[13px] font-bold text-ink"><input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-[var(--color-tile-navy)]" /> Live on the home page</label>
      </div>
      <div className="flex justify-end gap-2">
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" tone="primary" disabled={pending || !p.image}>Publish</Btn>
      </div>
    </form>
  );
}
