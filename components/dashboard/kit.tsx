"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CheckCircle2, LoaderCircle, Trash2, TriangleAlert, X } from "lucide-react";
import type { Result } from "@/lib/admin/action";
import { cn } from "@/lib/utils";

/** Client-side kit for dashboard forms: modal, fields, buttons, toasts and an action runner. */

export const input =
  "h-10 w-full rounded-xl bg-soft px-3 text-[13px] font-semibold text-ink ring-1 ring-line outline-none transition-shadow placeholder:font-medium placeholder:text-subtle/70 focus:bg-white focus:ring-2 focus:ring-brand disabled:opacity-60";
export const textarea = cn(input, "h-auto min-h-20 py-2.5 leading-relaxed");

export function Field({ label, children, className, hint }: { label: string; children: React.ReactNode; className?: string; hint?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1.5 block text-[11.5px] font-black tracking-wide text-subtle uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-subtle">{hint}</span>}
    </label>
  );
}

const btnTones = {
  primary: "bg-tile-navy text-tile-yellow hover:bg-tile-midnight",
  accent: "bg-tile-yellow text-tile-navy hover:brightness-105",
  blue: "bg-brand text-white hover:brightness-110",
  ghost: "bg-white text-tile-navy ring-1 ring-line hover:bg-soft",
  soft: "bg-soft text-tile-navy hover:bg-tile-sky/60",
  danger: "bg-tile-coral/10 text-sale hover:bg-tile-coral hover:text-white",
} as const;
export type BtnTone = keyof typeof btnTones;

export function Btn({ tone = "ghost", size = "md", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone; size?: "sm" | "md" | "icon" }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl font-bold whitespace-nowrap transition-[background-color,color,filter,translate] active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-[12px]" : size === "icon" ? "size-8 text-[12px]" : "h-10 px-4 text-[13px]",
        btnTones[tone],
        className,
      )}
    />
  );
}

// ——— Toasts ———
type Toast = { id: number; text: string; ok: boolean };
const EVENT = "mb-toast";
export const toast = (text: string, ok = true) => window.dispatchEvent(new CustomEvent<Omit<Toast, "id">>(EVENT, { detail: { text, ok } }));

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<Omit<Toast, "id">>).detail, id: Date.now() + Math.random() };
      setItems((s) => [...s.slice(-3), t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 3800);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 left-1/2 z-[70] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2">
      {items.map((t) => (
        <p key={t.id} className={cn("dash-rise pointer-events-auto flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13px] font-bold shadow-2xl", t.ok ? "bg-tile-midnight text-white" : "bg-tile-coral text-white")}>
          {t.ok ? <CheckCircle2 className="size-4.5 shrink-0 text-tile-yellow" /> : <TriangleAlert className="size-4.5 shrink-0" />}
          {t.text}
        </p>
      ))}
    </div>
  );
}

/** Runs a server action with a pending state, shows a toast, and returns the result. */
export function useAction() {
  const [pending, start] = useTransition();
  const exec = <T,>(fn: () => Promise<Result<T>>, success?: string) =>
    new Promise<Result<T>>((resolve) =>
      start(async () => {
        const r = await fn().catch(() => ({ ok: false as const, error: "Network error. Please try again." }));
        if (!r.ok) toast(r.error, false);
        else if (success) toast(success);
        resolve(r);
      }),
    );
  return { pending, exec };
}

/** Two-step delete: first click arms it, second click confirms. Disarms after 3 s. */
export function ConfirmButton({ onConfirm, label = "Delete", confirm = "Confirm", size = "sm", className, icon = true }: { onConfirm: () => void; label?: string; confirm?: string; size?: "sm" | "icon"; className?: string; icon?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      tone="danger"
      size={armed ? "sm" : size}
      aria-label={label}
      className={cn(armed && "bg-tile-coral text-white", className)}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
    >
      {icon && <Trash2 className="size-3.5" />}
      {armed ? confirm : size === "icon" ? null : label}
    </Btn>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={cn("size-4 animate-spin", className)} />;
}

/** Centered modal dialog. Controlled with `open`/`onOpenChange`. */
export function Modal({ open, onOpenChange, title, children, wide }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-tile-midnight/40 backdrop-blur-[2px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-[61] max-h-[min(88dvh,820px)] w-[min(94vw,520px)] -translate-1/2 overflow-y-auto rounded-[22px] bg-white p-5 shadow-2xl transition-[opacity,scale] duration-200 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 sm:p-6",
            wide && "w-[min(94vw,820px)]",
          )}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <Dialog.Title className="text-[17px] font-black tracking-tight text-ink">{title}</Dialog.Title>
            <Dialog.Close className="grid size-8 place-items-center rounded-full text-subtle hover:bg-soft hover:text-ink" aria-label="Close">
              <X className="size-4.5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Reads a FormData into a plain object (strings only; checkboxes become "on"). */
export const formObject = (form: HTMLFormElement) => Object.fromEntries(new FormData(form).entries()) as Record<string, string>;

/** Downloads text as a file (CSV/JSON exports). */
export function download(name: string, text: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** CSV with quoting; also neutralises spreadsheet formula injection (=, +, -, @). */
export function toCsv(rows: (string | number | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = String(v ?? "");
          if (/^[=+\-@]/.test(s) && !/^-?\d/.test(s)) s = `'${s}`;
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
