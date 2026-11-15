"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { signIn, type SignInState } from "@/lib/admin/auth-actions";
import { MagicButton } from "@/components/ui/magic-button";

const field =
  "h-12 w-full rounded-xl bg-soft pr-11 pl-11 text-[14px] font-semibold text-ink ring-1 ring-line transition-shadow outline-none placeholder:font-medium placeholder:text-subtle/70 focus:bg-white focus:ring-2 focus:ring-brand";

export function SignInForm() {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, null);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4" noValidate>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Email or username</span>
        <span className="relative block">
          <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand" />
          <input key={state?.id} name="id" type="text" autoComplete="username" required maxLength={254} defaultValue={state?.id} placeholder="you@makerbangla.com" className={field} />
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-ink">Password</span>
        <span className="relative block">
          <KeyRound aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-brand" />
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" required maxLength={200} placeholder="••••••••" className={field} />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:bg-tile-sky/50 hover:text-tile-navy"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </span>
      </label>

      <p role="alert" aria-live="polite" className="min-h-5 text-[12.5px] font-bold text-sale">{state?.error}</p>

      <MagicButton type="submit" disabled={pending} rainbow faceClassName="w-full" className="w-full">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        {pending ? "Signing in…" : "Sign in"}
      </MagicButton>
    </form>
  );
}
