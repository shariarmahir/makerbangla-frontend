"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { Bell, ExternalLink, LogOut, PanelLeftClose, PanelLeftOpen, Settings, X } from "lucide-react";
import { signOut } from "@/lib/admin/auth-actions";
import type { Section, User } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import { Chat } from "./chat";
import { Toaster } from "./kit";
import { dashNav } from "./nav";
import { Avatar } from "./ui";

export type Alert = { text: string; href: string; tone: "warn" | "info" };

const KEY = "mb-dash-collapsed";
const allowed = (user: User, area: Section | "admin" | null) => area === null || user.role === "admin" || (area !== "admin" && user.access.includes(area));

/** Dashboard frame: collapsible sidebar (remembered per device), topbar, alerts, team chat and toasts. */
export function Shell({ user, alerts, children }: { user: User; alerts: Alert[]; children: React.ReactNode }) {
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

  const nav = (compact: boolean) => (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          title={compact ? label : undefined}
          aria-current={active(href) ? "page" : undefined}
          className={cn(
            "group flex h-11 items-center gap-3 rounded-xl px-3 text-[13.5px] font-bold transition-colors",
            compact && "justify-center px-0",
            active(href) ? "bg-tile-navy text-tile-yellow shadow-[0_10px_20px_-12px_rgb(26_73_175/0.8)]" : "text-ink-2 hover:bg-soft hover:text-tile-navy",
          )}
        >
          <Icon className={cn("size-[19px] shrink-0", !active(href) && "text-brand")} />
          {!compact && <span className="truncate">{label}</span>}
        </Link>
      ))}
    </nav>
  );

  const brand = (compact: boolean) => (
    <Link href="/" aria-label="Makerbangla home" className={cn("flex h-16 shrink-0 items-center border-b border-line", compact ? "justify-center" : "px-5")}>
      {compact ? (
        <Image src="/brand/mark.png" alt="" width={256} height={256} className="size-9" />
      ) : (
        <Image src="/brand/logo.png" alt="Makerbangla" width={416} height={144} sizes="130px" className="h-10 w-auto" preload />
      )}
    </Link>
  );

  return (
    <div className="flex min-h-dvh bg-soft">
      {/* Desktop sidebar */}
      <aside className={cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white transition-[width] duration-300 lg:flex", collapsed ? "w-[76px]" : "w-64")}>
        {brand(collapsed)}
        {nav(collapsed)}
        <div className={cn("border-t border-line p-3", collapsed && "flex justify-center")}>
          <form action={signOut}>
            <button className={cn("flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-bold text-sale hover:bg-tile-coral/10", collapsed && "w-auto justify-center")} title="Sign out">
              <LogOut className="size-[18px]" />
              {!collapsed && "Sign out"}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-tile-midnight/40 backdrop-blur-[2px]" onClick={() => setMobile(false)} />
          <aside className="dash-rise absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between pr-3">
              {brand(false)}
              <button aria-label="Close menu" onClick={() => setMobile(false)} className="grid size-9 place-items-center rounded-full hover:bg-soft"><X className="size-5" /></button>
            </div>
            {nav(false)}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-line bg-white/85 px-3 backdrop-blur-md sm:px-5">
          <button onClick={toggle} aria-label={collapsed ? "Show menu" : "Hide menu"} className="hidden size-10 place-items-center rounded-xl text-tile-navy hover:bg-soft lg:grid">
            {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
          </button>
          <button onClick={() => setMobile(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-xl text-tile-navy hover:bg-soft lg:hidden">
            <PanelLeftOpen className="size-5" />
          </button>
          <Link href="/" className="lg:hidden" aria-label="Makerbangla home">
            <Image src="/brand/mark.png" alt="" width={256} height={256} className="size-8" />
          </Link>
          <p className="ml-1 hidden truncate text-[13px] font-semibold text-subtle sm:block">
            <Today />
          </p>

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/" className="hidden h-9 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold text-tile-navy hover:bg-soft md:flex">
              <ExternalLink className="size-4 text-brand" /> View store
            </Link>
            <Alerts alerts={alerts} />
            <Menu.Root>
              <Menu.Trigger className="flex items-center gap-2.5 rounded-full py-1 pr-1 pl-1 hover:bg-soft sm:pr-3">
                <Avatar name={user.name} photo={user.photo} size={36} />
                <span className="hidden text-left sm:block">
                  <span className="block max-w-36 truncate text-[13px] leading-tight font-black text-ink">{user.name}</span>
                  <span className="block max-w-36 truncate text-[11px] leading-tight font-semibold text-subtle">{user.role === "admin" ? "Super admin" : user.title}</span>
                </span>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner sideOffset={8} align="end" className="z-50">
                  <Menu.Popup className="w-56 rounded-2xl bg-white p-1.5 text-[13px] font-bold text-ink shadow-2xl ring-1 ring-line transition-[opacity,scale] data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                    <Menu.Item render={<Link href="/dashboard/settings" />} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 outline-none data-highlighted:bg-soft">
                      <Settings className="size-4 text-brand" /> Profile & settings
                    </Menu.Item>
                    <Menu.Item render={<Link href="/" />} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 outline-none data-highlighted:bg-soft">
                      <ExternalLink className="size-4 text-brand" /> View store
                    </Menu.Item>
                    <Menu.Item onClick={() => signOut()} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sale outline-none data-highlighted:bg-tile-coral/10">
                      <LogOut className="size-4" /> Sign out
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1 px-3 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Chat me={user.id} />
      <Toaster />
    </div>
  );
}

function Today() {
  const [s, setS] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date avoids a hydration mismatch
    setS(new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" }).format(new Date()));
  }, []);
  return <>{s}</>;
}

function Alerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`Notifications (${alerts.length})`} className="relative grid size-10 place-items-center rounded-xl text-tile-navy hover:bg-soft">
        <Bell className="size-5" />
        {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 grid min-w-4.5 place-items-center rounded-full bg-sale px-1 text-[10px] leading-4.5 font-black text-white ring-2 ring-white">{alerts.length}</span>}
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
