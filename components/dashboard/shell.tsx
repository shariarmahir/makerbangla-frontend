"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGroup, motion, MotionConfig } from "motion/react";
import { Menu } from "@base-ui/react/menu";
import { X } from "lucide-react";
import { signOut } from "@/lib/admin/auth-actions";
import type { Section, User } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Chat } from "./chat";
import { Icon } from "./icon";
import { Toaster } from "./kit";
import { dashNav } from "./nav";
import { Avatar } from "./ui";

export type Alert = { text: string; href: string; tone: "warn" | "info" };

const KEY = "mb-dash-collapsed";
const allowed = (user: User, area: Section | "admin" | null) => area === null || user.role === "admin" || (area !== "admin" && user.access.includes(area));

/** Dashboard frame: floating collapsible sidebar (remembered per device) with live badges, glass topbar, alerts, team chat and toasts. */
export function Shell({ user, alerts, badges, children }: { user: User; alerts: Alert[]; badges: Record<string, number>; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  // The drawer remembers the path it was opened on, so navigating closes it without an effect.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const mobile = drawerPath === path;
  const setMobile = (open: boolean) => setDrawerPath(open ? path : null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch {}
  }, []);

  // Live: re-fetch server data every 20 s while the tab is visible (new orders, tasks, leave requests).
  useEffect(() => {
    const t = setInterval(() => !document.hidden && router.refresh(), 20_000);
    return () => clearInterval(t);
  }, [router]);

  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });

  const items = dashNav.filter((n) => allowed(user, n.area));
  const active = (href: string) => (href === "/dashboard" ? path === href : path.startsWith(href));

  const nav = (compact: boolean, id: string) => (
    <LayoutGroup id={id}>
      <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3 [scrollbar-width:none]">
        {items.map(({ href, label, icon, group }, i) => {
          const on = active(href);
          const badge = badges[href] ?? 0;
          return (
            <div key={href}>
              {group && group !== items[i - 1]?.group && (compact ? <span aria-hidden className="mx-auto my-2.5 block h-px w-8 bg-line" /> : <p className="px-3 pt-4 pb-1 text-[10px] font-black tracking-[0.16em] text-subtle/70 uppercase">{group}</p>)}
              <Link
                href={href}
                title={compact ? label : undefined}
                aria-current={on ? "page" : undefined}
                className={cn("group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-bold transition-colors", compact && "justify-center px-0", on ? "text-tile-yellow" : "text-ink-2 hover:bg-soft hover:text-tile-navy")}
              >
                {on && <motion.span layoutId="nav-pill" transition={{ type: "spring", stiffness: 520, damping: 38 }} className="absolute inset-0 -z-0 rounded-xl bg-linear-to-r from-tile-navy to-tile-midnight shadow-[0_10px_22px_-12px_rgb(26_73_175/0.9)]" />}
                {on && !compact && <motion.span layoutId="nav-dot" className="absolute top-1/2 -left-2.5 h-5 w-1 -translate-y-1/2 rounded-r-full bg-tile-yellow" />}
                <Icon name={icon} className={cn("relative size-4.5", !on && "text-brand")} />
                {!compact && <span className="relative truncate">{label}</span>}
                {badge > 0 && (
                  <span className={cn("relative grid min-w-5 place-items-center rounded-full px-1.5 text-[10.5px] leading-5 font-black tabular-nums", compact ? "absolute top-0.5 right-1 min-w-4 px-1 text-[9.5px] leading-4" : "ml-auto", on ? "bg-tile-yellow text-tile-navy" : "bg-tile-coral text-white")}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>
    </LayoutGroup>
  );

  const profile = (compact: boolean) => (
    <div className={cn("m-2.5 flex items-center gap-2.5 rounded-2xl bg-soft p-2", compact && "flex-col")}>
      <Link href="/dashboard/settings" title="Profile & settings" className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar name={user.name} photo={user.photo} size={34} />
        {!compact && (
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] leading-tight font-black text-ink">{user.name}</span>
            <span className="block truncate text-[10.5px] leading-tight font-semibold text-subtle">{user.role === "admin" ? "Owner · super admin" : user.title}</span>
          </span>
        )}
      </Link>
      <form action={signOut}>
        <button title="Sign out" aria-label="Sign out" className="grid size-8 place-items-center rounded-lg text-sale hover:bg-tile-coral/12">
          <Icon name="logout" className="size-4" />
        </button>
      </form>
    </div>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh bg-soft bg-[radial-gradient(60rem_30rem_at_100%_-10%,color-mix(in_srgb,var(--color-brand)_9%,transparent),transparent),radial-gradient(40rem_24rem_at_0%_110%,color-mix(in_srgb,var(--color-tile-yellow)_12%,transparent),transparent)]">
        {/* Desktop sidebar: a floating panel */}
        <aside className={cn("sticky top-0 hidden h-dvh shrink-0 p-3 pr-0 transition-[width] duration-300 lg:block", collapsed ? "w-[88px]" : "w-[264px]")}>
          <div className="flex h-full flex-col overflow-hidden rounded-[26px] bg-white/95 shadow-[0_24px_60px_-40px_rgb(14_31_77/0.6)] ring-1 ring-line backdrop-blur">
            <div className={cn("flex h-16 shrink-0 items-center gap-2", collapsed ? "flex-col justify-center pt-2" : "px-4")}>
              <Link href="/" aria-label="Makerbangla home" className="shrink-0">
                {collapsed ? <Image src="/brand/mark.png" alt="" width={256} height={256} className="size-9" /> : <Image src="/brand/logo.png" alt="Makerbangla" width={416} height={144} sizes="120px" className="h-9 w-auto" preload />}
              </Link>
              {!collapsed && (
                <button onClick={toggle} aria-label="Hide menu" className="ml-auto grid size-8 place-items-center rounded-lg text-tile-navy hover:bg-soft">
                  <Icon name="panel-left-close" className="size-4.5" />
                </button>
              )}
            </div>
            {collapsed && (
              <button onClick={toggle} aria-label="Show menu" className="mx-auto mt-2 mb-1 grid size-9 place-items-center rounded-xl text-tile-navy hover:bg-soft">
                <Icon name="panel-left-open" className="size-4.5" />
              </button>
            )}
            {nav(collapsed, "desk")}
            {profile(collapsed)}
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobile && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button aria-label="Close menu" className="absolute inset-0 bg-tile-midnight/40 backdrop-blur-[2px]" onClick={() => setMobile(false)} />
            <aside className="dash-rise absolute inset-y-2 left-2 flex w-72 flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl">
              <div className="flex h-16 items-center justify-between px-4">
                <Link href="/" aria-label="Makerbangla home"><Image src="/brand/logo.png" alt="Makerbangla" width={416} height={144} sizes="120px" className="h-9 w-auto" /></Link>
                <button aria-label="Close menu" onClick={() => setMobile(false)} className="grid size-9 place-items-center rounded-full hover:bg-soft"><X className="size-5" /></button>
              </div>
              {nav(false, "drawer")}
              {profile(false)}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center gap-2 rounded-2xl bg-white/75 px-2.5 shadow-[0_16px_40px_-34px_rgb(14_31_77/0.6)] ring-1 ring-line backdrop-blur-xl sm:px-3">
              <button onClick={() => setMobile(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-xl text-tile-navy hover:bg-soft lg:hidden">
                <Icon name="panel-left-open" className="size-5" />
              </button>
              <Link href="/" className="lg:hidden" aria-label="Makerbangla home">
                <Image src="/brand/mark.png" alt="" width={256} height={256} className="size-8" />
              </Link>
              <p className="ml-1 hidden items-center gap-2 truncate text-[12.5px] font-bold text-subtle sm:flex">
                <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-brand/60 motion-reduce:hidden" /><span className="relative size-2 rounded-full bg-brand" /></span>
                Live · <Today />
              </p>
              <div className="ml-auto flex items-center gap-1">
                <Link href="/" className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold text-tile-navy hover:bg-soft md:flex">
                  <Icon name="square-arrow-right" className="size-4 text-brand" /> View store
                </Link>
                <Alerts alerts={alerts} />
                <Menu.Root>
                  <Menu.Trigger className="flex items-center gap-2 rounded-full p-0.5 hover:bg-soft sm:pr-2.5">
                    <Avatar name={user.name} photo={user.photo} size={34} />
                    <span className="hidden text-left sm:block">
                      <span className="block max-w-36 truncate text-[12.5px] leading-tight font-black text-ink">{user.name}</span>
                      <span className="block max-w-36 truncate text-[10.5px] leading-tight font-semibold text-subtle">{user.role === "admin" ? "Super admin" : user.title}</span>
                    </span>
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner sideOffset={8} align="end" className="z-50">
                      <Menu.Popup className="w-56 rounded-2xl bg-white p-1.5 text-[13px] font-bold text-ink shadow-2xl ring-1 ring-line transition-[opacity,scale] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                        <Menu.Item render={<Link href="/dashboard/settings" />} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 outline-none data-highlighted:bg-soft">
                          <Icon name="settings" className="size-4 text-brand" /> Profile & settings
                        </Menu.Item>
                        <Menu.Item render={<Link href="/" />} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 outline-none data-highlighted:bg-soft">
                          <Icon name="square-arrow-right" className="size-4 text-brand" /> View store
                        </Menu.Item>
                        <Menu.Item onClick={() => signOut()} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sale outline-none data-highlighted:bg-tile-coral/10">
                          <Icon name="logout" className="size-4" /> Sign out
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
            </div>
          </header>

          <main id="main" className="min-w-0 flex-1 px-3 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>

        <Chat me={user.id} />
        <Toaster />
      </div>
    </MotionConfig>
  );
}

function Today() {
  const [s, setS] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date avoids a hydration mismatch
    setS(new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dhaka" }).format(new Date()));
  }, []);
  return <>{s}</>;
}

function Alerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`Notifications (${alerts.length})`} className="relative grid size-9 place-items-center rounded-xl text-tile-navy hover:bg-soft">
        <Icon name="bell" className="size-5" />
        {alerts.length > 0 && <span className="absolute top-0.5 right-0.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-[10px] leading-4.5 font-black text-white ring-2 ring-white">{alerts.length}</span>}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end" className="z-50">
          <Menu.Popup className="w-80 rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-line transition-[opacity,scale] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <p className="px-3 pt-2 pb-1.5 text-[11px] font-black tracking-wide text-subtle uppercase">Needs attention</p>
            {alerts.length === 0 && <p className="px-3 py-4 text-[13px] font-semibold text-subtle">All clear.</p>}
            {alerts.map((a) => (
              <Menu.Item key={a.text} render={<Link href={a.href} />} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-ink outline-none data-highlighted:bg-soft">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", a.tone === "warn" ? "bg-sale" : "bg-brand")} />
                {a.text}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
