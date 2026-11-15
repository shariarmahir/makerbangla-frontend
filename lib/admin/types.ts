import type { Order } from "@/lib/order";
import type { ToneName } from "@/lib/tones";

/** Dashboard areas an employee can be given access to. Everyone has their own tasks, calendar, leave and chat; Team stays with the super admin. */
export const sections = {
  orders: "Orders & invoices",
  products: "Products",
  promotions: "Promotions",
  clients: "Clients & leads",
  finance: "Finance",
} as const;
export type Section = keyof typeof sections;

export type Role = "admin" | "staff";
export type User = { id: string; role: Role; name: string; title: string; email: string; photo?: string; access: Section[] };

export type Sample = { sample?: true };

export const orderStatuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type Payment = { amount: number; method: string; at: string };

export type DashOrder = Order &
  Sample & {
    status: OrderStatus;
    payments: Payment[];
    history: { status: OrderStatus; at: string; by: string }[];
    source: string;
  };

export type Quote = Sample & {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string; email?: string };
  lines: { name: string; qty: number; price: number }[];
  status: "draft" | "sent" | "accepted";
  note?: string;
};

export const expenseCategories = ["Stock purchase", "Delivery", "Rent", "Salaries", "Marketing", "Utilities", "Packaging", "Other"] as const;
export type Expense = Sample & { id: string; date: string; category: (typeof expenseCategories)[number]; note: string; amount: number };

export const leadSources = ["facebook", "youtube", "google", "instagram", "whatsapp", "website", "referral"] as const;
export type LeadSource = (typeof leadSources)[number];
export const leadStatuses = ["new", "contacted", "qualified", "won", "lost"] as const;
export type Lead = Sample & {
  id: string;
  createdAt: string;
  name: string;
  email?: string;
  phone?: string;
  org?: string;
  source: LeadSource;
  country: string;
  status: (typeof leadStatuses)[number];
  approved: boolean;
  value?: number;
  note?: string;
};

export const taskStatuses = ["todo", "doing", "review", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export const priorities = ["low", "normal", "important", "emergency"] as const;
export type Task = Sample & {
  id: string;
  createdAt: string;
  createdBy: string;
  title: string;
  detail?: string;
  priority: (typeof priorities)[number];
  status: TaskStatus;
  assignee: string; // "admin" or an employee id
  due?: string; // yyyy-mm-dd
  submission?: string;
};

export const noteColors = ["yellow", "blue", "navy", "coral", "sky"] as const;
export type Note = Sample & { id: string; owner: string; date: string; time?: string; title: string; color: (typeof noteColors)[number]; pinned: boolean };

export type Leave = Sample & { id: string; employeeId: string; from: string; to: string; reason: string; status: "pending" | "approved" | "rejected"; createdAt: string };

export type Message = { id: string; from: string; name: string; text: string; at: string };

export type Employee = Sample & {
  id: string;
  username: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  photo?: string;
  access: Section[];
  passwordHash: string;
  /** Bumped on password change or reset so older sessions stop working. */
  sessionVersion: number;
  active: boolean;
  createdAt: string;
  lastLogin?: string;
};

export type Promo = {
  id: string;
  label: string;
  words: [string, string];
  title: string;
  text: string;
  price: number;
  oldPrice?: number;
  href: string;
  /** Media id of an uploaded image, or a public path. */
  image: string;
  tone: ToneName;
  active: boolean;
};

export type CatalogItem = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  isNew?: boolean;
  summary: string;
  image: string;
  active: boolean;
};

/** One day of first-party, cookieless traffic counts. No IPs or identifiers are stored. */
export type DayVisits = { views: number; visits: number; returning: number; sources: Record<string, number>; countries: Record<string, number> };

export type Activity = { id: string; at: string; who: string; text: string };

/** Super admin profile. The first password comes from `admin-account.ts`; a changed one is stored (hashed) here. */
export type Profile = { name: string; title: string; photo?: string; passwordHash?: string; sessionVersion?: number };

export type Db = {
  version: 1;
  profile: Profile;
  employees: Employee[];
  orders: DashOrder[];
  quotes: Quote[];
  expenses: Expense[];
  leads: Lead[];
  tasks: Task[];
  notes: Note[];
  leaves: Leave[];
  messages: Message[];
  promos: Promo[];
  products: CatalogItem[];
  visits: Record<string, DayVisits>;
  sampleVisits: Record<string, DayVisits>;
  activity: Activity[];
};
