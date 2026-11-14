"use client";

import { useActionState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { subscribe } from "@/app/actions";
import { cn } from "@/lib/utils";

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, null);
  return (
    <form action={action} className="flex h-full flex-col justify-center rounded-2xl border border-line bg-white px-6 py-8 text-center">
      <h2 className="text-[13px] font-semibold text-brand-strong">Subscribe To Our Newsletter!</h2>
      <p className="mx-auto mt-2 max-w-56 text-[17px] leading-snug font-bold text-ink">Get the latest kits, lab guides and offers</p>
      <label className="mt-6 block">
        <span className="sr-only">Email address</span>
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="Your Email"
          className="h-10 w-full rounded-sm border border-line px-3 text-center text-[12.5px] outline-none focus:border-brand"
        />
      </label>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <button type="submit" disabled={pending} className="btn-cta mt-3 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <>Subscribe <ChevronRight className="size-3.5" /></>}
      </button>
      <p role="status" className={cn("mt-3 min-h-4 text-[11px]", state?.ok ? "text-brand-strong" : "text-sale")}>
        {state?.message}
      </p>
    </form>
  );
}
