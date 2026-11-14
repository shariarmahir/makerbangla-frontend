"use client";

import { useActionState } from "react";
import { BookOpen, ChevronRight, Loader2, Mail, Package, Tag } from "lucide-react";
import { subscribe } from "@/app/actions";
import { MagicButton } from "@/components/ui/magic-button";
import { cn } from "@/lib/utils";

const perks = [
  { icon: Package, label: "New kits" },
  { icon: BookOpen, label: "Lab guides" },
  { icon: Tag, label: "Offers" },
] as const;

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, null);
  return (
    <form
      action={action}
      className="relative isolate flex h-full flex-col overflow-hidden rounded-[22px] bg-tile-navy px-6 pt-6 pb-4 text-white shadow-[0_26px_36px_-28px_rgb(14_31_77/0.6)]"
    >
      <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <span aria-hidden className="absolute -top-20 -right-16 -z-10 size-56 rounded-full bg-brand/50 blur-3xl" />

      {/* Envelope mark */}
      <span aria-hidden className="relative grid size-12 place-items-center rounded-2xl bg-tile-yellow text-tile-navy shadow-[0_12px_24px_-10px_rgb(0_0_0/0.5)] -rotate-6">
        <Mail className="size-6" strokeWidth={2.2} />
        <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-tile-blue ring-2 ring-tile-navy" />
      </span>

      <h2 className="mt-4 text-[21px] leading-[1.1] font-black tracking-tight text-tile-yellow">Subscribe to our newsletter</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-white/80">The latest kits, lab guides and offers — straight to your inbox.</p>

      <ul className="mt-3.5 flex flex-wrap gap-x-4 gap-y-2 text-[11.5px] font-bold text-white/90">
        {perks.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <Icon className="size-3.5 text-tile-yellow" /> {label}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-5">
        <label className="relative block">
          <span className="sr-only">Email address</span>
          <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@university.edu"
            className="h-11 w-full rounded-xl bg-white pr-3 pl-10 text-[13px] text-ink outline-none placeholder:text-subtle/70 focus:ring-2 focus:ring-tile-yellow"
          />
        </label>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <MagicButton type="submit" disabled={pending} variant="accent" rainbow={false} className="mt-3 w-full">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <>Subscribe <ChevronRight className="size-3.5" /></>}
        </MagicButton>
        <p role="status" className={cn("mt-2 min-h-4 text-[11px]", state?.ok ? "text-tile-yellow" : "text-white/85")}>
          {state?.message}
        </p>
      </div>
    </form>
  );
}
