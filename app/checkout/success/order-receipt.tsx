"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { Check, Download, Loader2, Printer, ShoppingBag } from "lucide-react";
import { getOrder } from "@/lib/orders-store";
import { site } from "@/lib/site";
import { bdt } from "@/lib/utils";

const noop = () => () => {};

export function OrderReceipt() {
  const id = useSearchParams().get("order");
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const order = mounted ? getOrder(id) : undefined;
  const [busy, setBusy] = useState(false);

  if (!mounted) return <div className="mx-auto h-[32rem] max-w-3xl animate-pulse rounded-2xl bg-soft" />;

  if (!order) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-line px-6 py-16 text-center">
        <p className="text-[15px] font-bold">We couldn’t find this order on this device.</p>
        <p className="mt-2 text-[13px] text-subtle">If you placed it on another phone or browser, open the receipt there — or call {site.phone}.</p>
        <Link href="/shop" className="btn-pill mt-6 h-11 bg-ink px-6 text-white hover:bg-brand-strong">Continue shopping</Link>
      </div>
    );
  }

  const placed = new Date(order.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center print:hidden">
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="mx-auto grid size-16 place-items-center rounded-full bg-tile-green text-white shadow-[0_12px_30px_-10px_var(--color-tile-green)]"
        >
          <Check className="size-8" strokeWidth={3} />
        </motion.span>
        <h1 className="mt-5 text-[clamp(1.6rem,3.4vw,2.4rem)] font-black tracking-tight">
          <span className="text-gradient">Order placed successfully!</span>
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">
          Thank you, {order.customer.name.split(" ")[0]}. We’ll call <span className="font-bold">{order.customer.phone}</span> to confirm delivery.
        </p>
        {order.demo && (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-warn/10 px-4 py-2.5 text-[12px] font-semibold text-warn">
            Preview mode: no order backend is connected yet, so this order was not sent to the store.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await (await import("@/lib/receipt-pdf")).downloadReceipt(order);
              } finally {
                setBusy(false);
              }
            }}
            className="btn-pill h-11 bg-ink px-6 text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Download receipt
          </button>
          <button type="button" onClick={() => window.print()} className="btn-pill h-11 px-6 ring-1 ring-line hover:bg-soft">
            <Printer className="size-4" /> Print
          </button>
          <Link href="/shop" className="btn-pill h-11 px-6 text-brand-strong hover:bg-brand/10">
            <ShoppingBag className="size-4" /> Continue shopping
          </Link>
        </div>
      </div>

      {/* Printable receipt */}
      <article className="mt-8 overflow-hidden rounded-2xl border border-line bg-white print:mt-0 print:border-0">
        <div className="h-1.5 bg-linear-to-r from-brand-strong via-tile-violet to-sale" />
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <Image src="/brand/logo.png" alt={site.name} width={416} height={144} className="h-10 w-auto" />
            <p className="mt-2 text-[11.5px] text-subtle">{site.address.street}, {site.address.city} · {site.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-extrabold tracking-wider text-subtle uppercase">Order receipt</p>
            <p className="mt-1 text-[16px] font-black tabular-nums">{order.id}</p>
            <p className="text-[12px] text-subtle">{placed}</p>
          </div>
        </header>

        <div className="grid gap-6 border-b border-line p-6 text-[13px] sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-extrabold tracking-wider text-subtle uppercase">Customer</p>
            <p className="mt-1.5 font-bold">{order.customer.name}</p>
            <p>{order.customer.phone}</p>
            {order.customer.email && <p className="break-all">{order.customer.email}</p>}
          </div>
          <div>
            <p className="text-[11px] font-extrabold tracking-wider text-subtle uppercase">Delivery</p>
            <p className="mt-1.5 font-bold">{order.delivery.label}</p>
            {order.delivery.address && <p>{order.delivery.address}</p>}
            {(order.delivery.area || order.delivery.city) && <p>{[order.delivery.area, order.delivery.city].filter(Boolean).join(", ")}</p>}
            <p className="mt-1 text-subtle">{order.payment}</p>
          </div>
        </div>

        <table className="w-full text-[13px]">
          <thead className="bg-soft text-left text-[11px] font-extrabold tracking-wider text-subtle uppercase">
            <tr>
              <th className="px-6 py-2.5">Item</th>
              <th className="px-2 py-2.5 text-right">Qty</th>
              <th className="hidden px-2 py-2.5 text-right sm:table-cell">Price</th>
              <th className="px-6 py-2.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {order.lines.map((l) => (
              <tr key={l.slug}>
                <td className="px-6 py-3">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-[11px] text-subtle">{l.sku}</p>
                </td>
                <td className="px-2 py-3 text-right tabular-nums">{l.qty}</td>
                <td className="hidden px-2 py-3 text-right tabular-nums sm:table-cell">{bdt(l.price)}</td>
                <td className="px-6 py-3 text-right font-bold tabular-nums">{bdt(l.price * l.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto max-w-xs space-y-2 border-t border-line p-6 text-[13px]">
          <div className="flex justify-between"><dt className="text-subtle">Subtotal</dt><dd className="font-bold tabular-nums">{bdt(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-subtle">Delivery</dt><dd className="font-bold tabular-nums">{order.delivery.fee ? bdt(order.delivery.fee) : "Free"}</dd></div>
          <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-extrabold">Total</dt><dd className="text-[18px] font-black tabular-nums">{bdt(order.total)}</dd></div>
        </dl>
        {order.note && <p className="border-t border-line px-6 py-4 text-[12.5px]"><span className="font-bold">Note:</span> {order.note}</p>}
      </article>
    </div>
  );
}
