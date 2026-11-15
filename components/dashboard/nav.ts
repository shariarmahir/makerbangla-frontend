import { CalendarCheck2, LayoutDashboard, Megaphone, Package, Settings, ShoppingBag, UserCog, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import type { Section } from "@/lib/admin/types";

/** Sidebar entries. `area` decides who sees it: a section key, "admin" (super admin only) or null (everyone). */
export const dashNav: { href: string; label: string; icon: LucideIcon; area: Section | "admin" | null }[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, area: null },
  { href: "/dashboard/orders", label: "Orders & invoices", icon: ShoppingBag, area: "orders" },
  { href: "/dashboard/products", label: "Products", icon: Package, area: "products" },
  { href: "/dashboard/promotions", label: "Promotions", icon: Megaphone, area: "promotions" },
  { href: "/dashboard/clients", label: "Clients & leads", icon: UsersRound, area: "clients" },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet, area: "finance" },
  { href: "/dashboard/tasks", label: "Tasks & calendar", icon: CalendarCheck2, area: null },
  { href: "/dashboard/team", label: "Team", icon: UserCog, area: "admin" },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, area: null },
];
