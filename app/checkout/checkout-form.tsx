"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { Banknote, Check, Loader2, Lock, MapPin, ShoppingCart, Store, Truck } from "lucide-react";
import { placeOrder } from "./actions";
import type { PlaceOrderState } from "@/lib/order";
import { saveOrder } from "@/lib/orders-store";
import { deliveryOptions, site, type DeliveryId } from "@/lib/site";
import { cart, cartTotal, useStore } from "@/lib/store";
import { bdt, cn } from "@/lib/utils";

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

const deliveryIcon = { "inside-dhaka": Truck, "outside-dhaka": MapPin, pickup: Store } as const;

const input = "h-11 w-full rounded-lg border border-line bg-white px-3.5 text-[13.5px] outline-none transition-[border-color,box-shadow] placeholder:text-subtle/70 focus:border-brand focus:ring-3 focus:ring-brand/15 aria-invalid:border-sale";
const label = "mb-1.5 block text-[12px] font-bold text-ink";

function Field({ name, title, error, optional, children }: { name: string; title: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className={label}>
        {title} {optional && <span className="font-medium text-subtle">(optional)</span>}
      </label>
      {children}
      {error && <p id={`${name}-error`} className="mt-1.5 text-[11.5px] font-semibold text-sale">{error}</p>}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-[16px] font-extrabold tracking-tight">
        <span className="grid size-7 place-items-center rounded-full bg-ink text-[12px] text-accent-yellow">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm() {
  const mounted = useMounted();
  const router = useRouter();
  const lines = useStore((s) => s.cart);
  const subtotal = useStore(cartTotal);
  const [delivery, setDelivery] = useState<DeliveryId>("inside-dhaka");
  const [state, dispatch, pending] = useActionState<PlaceOrderState, FormData>(placeOrder, null);

  const fee = deliveryOptions.find((d) => d.id === delivery)!.fee;
  const errors = state && !state.ok ? state.errors : undefined;

  useEffect(() => {
    if (!state?.ok) return;
    saveOrder(state.order);
    cart.clear();
    router.replace(`/checkout/success?order=${encodeURIComponent(state.order.id)}`);
  }, [state, router]);

  if (!mounted) return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-soft" />;

  if (lines.length === 0 && !state?.ok) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-16 text-center">
        <ShoppingCart className="mx-auto size-10 text-subtle/50" strokeWidth={1.4} />
        <p className="mt-4 text-[14px] font-semibold">Your cart is empty.</p>
        <Link href="/shop" className="btn-pill mt-5 h-11 bg-ink px-6 text-white hover:bg-brand-strong">Browse the shop</Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        // Dispatch manually so React doesn't reset the fields when validation fails.
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        data.set("items", JSON.stringify(lines.map(({ slug, qty }) => ({ slug, qty }))));
        startTransition(() => dispatch(data));
      }}
      className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start"
    >
      <div className="space-y-4">
        <Step n={1} title="Contact details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" title="Full name" error={errors?.name}>
              <input id="name" name="name" required minLength={2} maxLength={80} autoComplete="name" aria-invalid={!!errors?.name} className={input} />
            </Field>
            <Field name="phone" title="Mobile number" error={errors?.phone}>
              <input id="phone" name="phone" type="tel" inputMode="tel" required maxLength={20} autoComplete="tel" placeholder="01XXX-XXXXXX" aria-invalid={!!errors?.phone} className={input} />
            </Field>
            <div className="sm:col-span-2">
              <Field name="email" title="Email" optional error={errors?.email}>
                <input id="email" name="email" type="email" maxLength={254} autoComplete="email" aria-invalid={!!errors?.email} className={input} />
              </Field>
            </div>
          </div>
        </Step>

        <Step n={2} title="Delivery option">
          <fieldset className="grid gap-3 sm:grid-cols-3">
            <legend className="sr-only">Delivery option</legend>
            {deliveryOptions.map((d) => {
              const Icon = deliveryIcon[d.id];
              const on = delivery === d.id;
              return (
                <label
                  key={d.id}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border-2 p-4 transition-colors",
                    on ? "border-brand bg-brand/8" : "border-line hover:border-ink/30",
                  )}
                >
                  <input type="radio" name="delivery" value={d.id} checked={on} onChange={() => setDelivery(d.id)} className="sr-only" />
                  <span className="flex items-center justify-between">
                    <Icon className={cn("size-5", on ? "text-brand-strong" : "text-ink-2")} />
                    <span className={cn("grid size-5 place-items-center rounded-full border-2", on ? "border-brand bg-brand text-white" : "border-line")}>
                      {on && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="text-[13.5px] font-extrabold">{d.label}</span>
                  <span className="text-[11.5px] leading-snug text-subtle">{d.note}</span>
                  <span className="mt-auto pt-1 text-[13px] font-extrabold tabular-nums">{d.fee ? bdt(d.fee) : "Free"}</span>
                </label>
              );
            })}
          </fieldset>
        </Step>

        {delivery !== "pickup" ? (
          <Step n={3} title="Delivery address">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field name="address" title="Address" error={errors?.address}>
                  <input id="address" name="address" required minLength={5} maxLength={200} autoComplete="street-address" placeholder="House, road, block" aria-invalid={!!errors?.address} className={input} />
                </Field>
              </div>
              <Field name="city" title="City / District" error={errors?.city}>
                <input id="city" name="city" required minLength={2} maxLength={60} autoComplete="address-level2" defaultValue={delivery === "inside-dhaka" ? "Dhaka" : ""} key={delivery} aria-invalid={!!errors?.city} className={input} />
              </Field>
              <Field name="area" title="Area / Thana" optional>
                <input id="area" name="area" maxLength={60} autoComplete="address-level3" className={input} />
              </Field>
            </div>
          </Step>
        ) : (
          <Step n={3} title="Pickup point">
            <p className="flex items-start gap-2.5 text-[13.5px]">
              <Store className="mt-0.5 size-4 shrink-0 text-brand-strong" />
              <span>
                <span className="font-bold">{site.name}</span>, {site.address.street}, {site.address.city}. We’ll call you on your mobile number when the order is ready.
              </span>
            </p>
          </Step>
        )}

        <Step n={4} title="Payment">
          <div className="flex items-center gap-3 rounded-xl border-2 border-brand bg-brand/8 p-4">
            <Banknote className="size-5 text-brand-strong" />
            <div>
              <p className="text-[13.5px] font-extrabold">{delivery === "pickup" ? "Pay at pickup" : "Cash on delivery"}</p>
              <p className="text-[11.5px] text-subtle">Pay in cash when you receive your parts.</p>
            </div>
          </div>
          <div className="mt-4">
            <Field name="note" title="Order note" optional>
              <textarea id="note" name="note" maxLength={300} rows={3} placeholder="Delivery instructions, project deadline…" className={cn(input, "h-auto py-2.5")} />
            </Field>
          </div>
          <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        </Step>
      </div>

      {/* Summary */}
      <aside className="rounded-2xl border border-line bg-white p-5 sm:p-6 lg:sticky lg:top-4">
        <h2 className="text-[16px] font-extrabold tracking-tight">Order summary</h2>
        <ul className="mt-4 max-h-80 divide-y divide-line overflow-y-auto">
          {lines.map((l) => (
            <li key={l.slug} className="flex items-center gap-3 py-3">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-soft">
                <Image src={l.image} alt="" fill sizes="56px" className="object-contain p-1" />
                <span className="absolute -top-0 -right-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[10px] font-bold text-white tabular-nums">{l.qty}</span>
              </span>
              <span className="line-clamp-2 flex-1 text-[12.5px] leading-snug font-semibold">{l.name}</span>
              <span className="text-[13px] font-extrabold tabular-nums">{bdt(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-4 text-[13px]">
          <div className="flex justify-between"><dt className="text-subtle">Subtotal</dt><dd className="font-bold tabular-nums">{bdt(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-subtle">Delivery</dt><dd className="font-bold tabular-nums">{fee ? bdt(fee) : "Free"}</dd></div>
          <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="text-[14px] font-extrabold">Total</dt><dd className="text-[20px] font-black tabular-nums">{bdt(subtotal + fee)}</dd></div>
        </dl>

        {errors?.items && <p className="mt-3 text-[12px] font-semibold text-sale">{errors.items}</p>}
        {state && !state.ok && <p role="alert" className="mt-3 rounded-lg bg-sale/10 p-3 text-[12px] font-semibold text-sale">{state.message}</p>}

        <button
          type="submit"
          disabled={pending || state?.ok}
          className="btn-pill mt-5 h-12 w-full bg-linear-to-r from-sale to-tile-orange text-[14px] text-white shadow-[0_10px_24px_-10px_var(--color-sale)] disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Place Order
        </button>
        <p className="mt-3 text-center text-[11px] text-subtle">
          Prices are checked again when you place the order. Need help? <a href={`tel:${site.phoneIntl}`} className="font-bold text-ink hover:underline">{site.phone}</a>
        </p>
      </aside>
    </form>
  );
}
