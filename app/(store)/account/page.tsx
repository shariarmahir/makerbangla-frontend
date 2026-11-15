import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, LayoutDashboard, ShieldCheck, ShoppingBag, UserRoundCheck } from "lucide-react";
import { SignInForm } from "@/components/account/sign-in-form";
import { MagicButton, MagicLink } from "@/components/ui/magic-button";
import { getUser } from "@/lib/admin/auth";
import { demoSignIn } from "@/lib/admin/auth-actions";
import { demoEmployee } from "@/lib/admin/demo";
import { readDb } from "@/lib/admin/db";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${site.name}.`,
  alternates: { canonical: "/account" },
  robots: { index: false, follow: true },
};

/** Already signed in? Offer the way back to the dashboard. */
async function SessionHint() {
  const user = await getUser();
  if (!user) return null;
  return (
    <Link href="/dashboard" className="mb-6 flex items-center gap-3 rounded-2xl bg-tile-sky/50 p-3.5 text-[13px] font-bold text-tile-navy ring-1 ring-tile-sky hover:bg-tile-sky">
      <LayoutDashboard className="size-5 shrink-0" />
      <span className="flex-1">Signed in as {user.name} — open your dashboard</span>
      <ArrowRight className="size-4" />
    </Link>
  );
}

/** One-click employee demo, offered only while the store is pure sample data (see `lib/admin/demo.ts`). */
async function DemoAccess() {
  const db = await readDb();
  const e = demoEmployee(db);
  if (!e) return null;
  return (
    <form action={demoSignIn} className="mt-6 rounded-2xl bg-tile-butter/60 p-4 ring-1 ring-tile-yellow">
      <p className="text-[12px] font-black tracking-wide text-tile-navy uppercase">Demo employee</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-tile-navy text-[15px] font-black text-tile-yellow">{e.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
        <span className="min-w-0 flex-1">
          <b className="block text-[14px] text-ink">{e.name}</b>
          <span className="text-[12px] font-semibold text-subtle">{e.designation} · sample profile</span>
        </span>
        <MagicButton type="submit" variant="brand" size="sm" rainbow={false}><UserRoundCheck className="size-4" /> Enter employee dashboard</MagicButton>
      </div>
    </form>
  );
}

export default function AccountPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[26px] bg-white shadow-[0_30px_60px_-40px_rgb(14_31_77/0.5)] ring-1 ring-line md:grid-cols-[1fr_1.15fr]">
        <div className="relative isolate flex flex-col justify-between gap-10 overflow-hidden bg-tile-navy p-8 text-white sm:p-10">
          <span aria-hidden className="absolute -top-20 -left-16 -z-10 size-64 rounded-full bg-brand/45 blur-3xl" />
          <span aria-hidden className="absolute -right-10 -bottom-16 -z-10 size-56 rounded-full bg-tile-yellow/25 blur-3xl" />
          <span className="grid size-14 place-items-center rounded-2xl bg-tile-yellow text-tile-navy"><ShieldCheck className="size-7" /></span>
          <div>
            <h1 className="text-[clamp(1.8rem,3.4vw,2.4rem)] leading-none font-black tracking-tight text-tile-yellow">Sign in</h1>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/80">Team and admin access to the Makerbangla dashboard — orders, stock, offers, finance and tasks.</p>
          </div>
          <p className="flex items-start gap-2.5 rounded-2xl bg-white/8 p-3.5 text-[12.5px] leading-relaxed text-white/80 ring-1 ring-white/10">
            <ShoppingBag className="mt-0.5 size-4 shrink-0 text-tile-yellow" />
            Shopping? Customer accounts are coming soon — you can check out as a guest today.
          </p>
        </div>
        <div className="p-8 sm:p-10">
          <Suspense>
            <SessionHint />
          </Suspense>
          <SignInForm />
          <Suspense>
            <DemoAccess />
          </Suspense>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[12px] text-subtle">
            <span>Forgot your password? Ask the super admin to reset it.</span>
            <MagicLink href="/shop" variant="light" size="sm">Continue shopping</MagicLink>
          </div>
        </div>
      </div>
    </div>
  );
}
