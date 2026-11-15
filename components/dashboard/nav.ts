import type { Section } from "@/lib/admin/types";
import type { IconName } from "./icon";

/** Sidebar entries, grouped. `area` decides who sees it: a section key, "admin" (super admin only) or null (everyone). */
export const dashNav: { href: string; label: string; icon: IconName; area: Section | "admin" | null; group: string }[] = [
  { href: "/dashboard", label: "Overview", icon: "layout-grid", area: null, group: "" },
  { href: "/dashboard/orders", label: "Orders", icon: "cart", area: "orders", group: "Sales" },
  { href: "/dashboard/invoices", label: "Invoices & receipts", icon: "receipt-text", area: "orders", group: "Sales" },
  { href: "/dashboard/products", label: "Products & stock", icon: "boxes", area: "products", group: "Catalog" },
  { href: "/dashboard/promotions", label: "Promotions", icon: "sparkles", area: "promotions", group: "Catalog" },
  { href: "/dashboard/clients", label: "Clients & leads", icon: "users-round", area: "clients", group: "Customers" },
  { href: "/dashboard/inbox", label: "Inbox & email", icon: "mail-check", area: "clients", group: "Customers" },
  { href: "/dashboard/finance", label: "Finance & reports", icon: "wallet", area: "finance", group: "Money" },
  { href: "/dashboard/calculator", label: "Calculator", icon: "badge-percent", area: "finance", group: "Money" },
  { href: "/dashboard/tasks", label: "Tasks & calendar", icon: "calendar-check-2", area: null, group: "Team" },
  { href: "/dashboard/team", label: "Team & access", icon: "user-round-cog", area: "admin", group: "Team" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings", area: null, group: "Team" },
];
