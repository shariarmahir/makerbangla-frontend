import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Heart, ShoppingBag, UserRound } from "lucide-react";
import { MagicAnchor, MagicLink } from "@/components/ui/magic-button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${site.name} account.`,
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

const perks = [
  { icon: ShoppingBag, text: "Check out as a guest — just your name, phone and address." },
  { icon: FileText, text: "Your order receipts stay on this device and can be downloaded as PDF." },
  { icon: Heart, text: "Your wishlist and cart are kept on this device too." },
] as const;

/** Accounts need the backend; until then this page explains guest checkout honestly. */
export default function AccountPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[26px] bg-white ring-1 ring-line md:grid-cols-[1fr_1.1fr]">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden bg-tile-navy p-8 text-white sm:p-10">
          <span aria-hidden className="absolute -top-20 -left-16 -z-10 size-64 rounded-full bg-brand/45 blur-3xl" />
          <span className="grid size-14 place-items-center rounded-2xl bg-tile-yellow text-tile-navy"><UserRound className="size-7" /></span>
          <div>
            <h1 className="text-[clamp(1.8rem,3.4vw,2.4rem)] leading-none font-black tracking-tight text-tile-yellow">Sign in</h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/80">Customer accounts are opening soon. You don&apos;t need one to order.</p>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <ul className="space-y-4">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3 text-[13.5px] leading-relaxed text-ink-2">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tile-sky text-tile-navy"><Icon className="size-4" /></span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <MagicLink href="/shop" variant="accent">Continue shopping</MagicLink>
            <MagicAnchor href={`tel:${site.phoneIntl}`} variant="light">Call {site.phone}</MagicAnchor>
          </div>
          <p className="mt-6 text-[12px] text-subtle">
            Questions about an order? See <Link href="/info" className="font-bold text-brand-strong hover:underline">ordering info</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
