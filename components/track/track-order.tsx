"use client";

import { useActionState } from "react";
import { Check, LoaderCircle, MapPin, Package, Phone } from "lucide-react";
import { trackOrder, type TrackState } from "@/app/(store)/track/actions";
import { MagicButton } from "@/components/ui/magic-button";
import { bdt, cn } from "@/lib/utils";

const field = "h-12 w-full rounded-xl bg-soft pl-11 pr-4 text-[14px] font-semibold text-ink ring-1 ring-line outline-none transition-shadow placeholder:font-medium placeholder:text-subtle/70 focus:bg-white focus:ring-2 focus:ring-brand";
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });

export function TrackOrder({ initialId }: { initialId?: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, null);
  const o = state?.order;
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <form action={action} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Order number</span>
          <span className="relative block">
            <Package aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand" />
            <input key={state?.id} name="id" required maxLength={24} defaultValue={state?.id ?? initialId} placeholder="MB-261115-AB12C" autoCapitalize="characters" className={cn(field, "uppercase placeholder:normal-case")} />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Mobile number used for the order</span>
          <span className="relative block">
            <Phone aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand" />
            <input key={state?.phone} name="phone" type="tel" inputMode="tel" required maxLength={20} defaultValue={state?.phone} placeholder="01XXXXXXXXX" autoComplete="tel" className={field} />
          </span>
        </label>
        <p role="alert" aria-live="polite" className="min-h-5 text-[12.5px] font-bold text-sale">{state?.error}</p>
        <MagicButton type="submit" disabled={pending} faceClassName="w-full" className="w-full">
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {pending ? "Checking…" : "Track order"}
        </MagicButton>
      </form>

      <div aria-live="polite" className="rounded-[22px] bg-soft p-5 ring-1 ring-line sm:p-6">
        {!o ? (
          <div className="grid h-full place-content-center gap-2 py-8 text-center">
            <MapPin className="mx-auto size-8 text-brand" />
            <p className="text-[14px] font-black text-ink">Your order&apos;s journey shows here</p>
            <p className="text-[12.5px] text-subtle">The order number is on your receipt and confirmation message.</p>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-subtle">Order {o.id}</p>
                <p className={cn("text-[22px] leading-tight font-black", o.status === "cancelled" ? "text-sale" : "text-tile-navy")}>{o.label}</p>
              </div>
              <p className="text-right text-[12px] font-semibold text-subtle">
                {o.items} item{o.items === 1 ? "" : "s"} · {o.delivery}
                <b className="block text-[15px] text-ink tabular-nums">{bdt(o.total)}</b>
                {o.due > 0 && <span className="text-tile-navy">{bdt(o.due)} to pay on delivery</span>}
              </p>
            </div>
            {o.status !== "cancelled" && (
              <ol className="mt-5 space-y-0">
                {o.steps.map((s, i) => (
                  <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < o.steps.length - 1 && <span aria-hidden className={cn("absolute top-8 bottom-0 left-[15px] w-0.5", o.steps[i + 1].done ? "bg-tile-navy" : "bg-line")} />}
                    <span className={cn("relative grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-soft", s.done ? "bg-tile-navy text-tile-yellow" : "bg-white text-subtle ring-line")}>
                      {s.done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-line" />}
                    </span>
                    <span className="pt-1">
                      <b className={cn("block text-[13.5px]", s.done ? "text-ink" : "text-subtle")}>{s.label}</b>
                      {s.at && <span className="text-[12px] text-subtle">{when(s.at)}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {o.courier && (
              <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-[13px] font-semibold text-ink ring-1 ring-line">
                Courier: <b>{o.courier.name}</b>
                {o.courier.tracking && <> · Tracking <b className="tabular-nums">{o.courier.tracking}</b></>}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
