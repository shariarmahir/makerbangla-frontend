import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Presentational building blocks for dashboard pages (server-safe). */

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-[clamp(1.5rem,2.4vw,1.9rem)] leading-tight font-black tracking-tight text-ink">{title}</h1>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, action, children, className, bodyClassName }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("dash-rise flex min-w-0 flex-col rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-34px_rgb(14_31_77/0.6)] ring-1 ring-line", className)}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-black tracking-tight text-ink">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn("min-w-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

const kpiTones = {
  blue: "bg-brand text-white",
  yellow: "bg-tile-yellow text-tile-navy",
  navy: "bg-tile-navy text-tile-yellow",
  coral: "bg-tile-coral text-white",
  sky: "bg-tile-sky text-tile-navy",
} as const;
export type KpiTone = keyof typeof kpiTones;

export function Kpi({ icon: Icon, label, value, delta, tone = "blue", foot, children }: { icon: LucideIcon; label: string; value: string; delta?: number; tone?: KpiTone; foot?: string; children?: React.ReactNode }) {
  return (
    <div className="dash-rise flex min-w-0 flex-col rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-34px_rgb(14_31_77/0.6)] ring-1 ring-line sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", kpiTones[tone])}><Icon className="size-5" /></span>
        {delta !== undefined && Number.isFinite(delta) && (
          <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums", delta >= 0 ? "bg-tile-sky/60 text-tile-navy" : "bg-tile-coral/12 text-sale")}>
            {delta >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-[12px] font-bold text-subtle">{label}</p>
      <p className="mt-0.5 truncate text-[clamp(1.25rem,2vw,1.6rem)] leading-tight font-black tracking-tight text-ink tabular-nums">{value}</p>
      {foot && <p className="mt-1 text-[11.5px] font-semibold text-subtle">{foot}</p>}
      {children}
    </div>
  );
}

const pillTones = {
  pending: "bg-tile-butter text-tile-navy",
  confirmed: "bg-tile-sky text-tile-navy",
  packed: "bg-brand/15 text-brand-strong",
  shipped: "bg-brand text-white",
  delivered: "bg-tile-navy text-tile-yellow",
  cancelled: "bg-tile-coral/12 text-sale",
  neutral: "bg-soft text-subtle",
  warn: "bg-tile-coral text-white",
} as const;
export type PillTone = keyof typeof pillTones;

export function Pill({ tone = "neutral", children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] leading-none font-black tracking-wide whitespace-nowrap uppercase", pillTones[tone], className)}>{children}</span>;
}

const avatarTones = ["bg-tile-yellow text-tile-navy", "bg-brand text-white", "bg-tile-navy text-tile-yellow", "bg-tile-sky text-tile-navy", "bg-tile-coral text-white"];

export function Avatar({ name, photo, size = 36, className }: { name: string; photo?: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  const tone = avatarTones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarTones.length];
  return photo ? (
    // eslint-disable-next-line @next/next/no-img-element -- local uploads, already resized
    <img src={photo} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className={cn("grid shrink-0 place-items-center rounded-full font-black ring-2 ring-white", tone, className)} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials || "?"}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] font-semibold text-subtle">{children}</p>;
}

/** Scrollable table wrapper with consistent header styling. */
export function Table({ head, children, className }: { head: React.ReactNode[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-5 overflow-x-auto px-5", className)}>
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[12.5px]">
        <thead>
          <tr className="text-[11px] font-black tracking-wide text-subtle uppercase">
            {head.map((h, i) => <th key={i} className="border-b border-line px-3 pb-2.5 first:pl-0 last:pr-0">{h}</th>)}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-line/70 [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:pl-0 [&_td:last-child]:pr-0 [&_tr:last-child_td]:border-0">{children}</tbody>
      </table>
    </div>
  );
}
