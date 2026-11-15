import { randomBytes } from "node:crypto";
import { productVisual } from "@/lib/catalog";
import { products } from "@/lib/data/catalog";
import { deliveryOptions } from "@/lib/site";
import { couriers, type CatalogItem, type DashOrder, type Db, type DayVisits, type Expense, type Lead, type Promo } from "./types";

/**
 * First-run data. The catalog and promo banners are real site content. Everything marked `sample` (orders, expenses,
 * leads, team, traffic) is illustrative so the dashboard can be explored; Settings → "Clear sample data" removes it.
 */

const promoPlan: { label: string; words: [string, string]; slug: string; title: string; tone: Promo["tone"] }[] = [
  { label: "Latest Offer", words: ["Board", "Deals"], slug: "arduino-uno-r3", title: "Arduino Uno R3", tone: "yellow" },
  { label: "Best Offer", words: ["Solder", "Saver"], slug: "soldering-iron-kit", title: "Soldering Iron Kit, 60 W", tone: "navy" },
  { label: "This Week's Offer", words: ["Measure", "Right"], slug: "vernier-caliper", title: "Digital Vernier Caliper", tone: "blue" },
  { label: "New Arrival", words: ["Just", "Landed"], slug: "raspberry-pi-4", title: "Raspberry Pi 4 · 4 GB", tone: "midnight" },
  { label: "Top Of The Week", words: ["Motion", "Pick"], slug: "nema17-stepper-motor", title: "NEMA 17 Stepper Motor", tone: "sky" },
];

const customers = [
  "Rafiul Islam", "Sadia Afrin", "Tanjim Ahmed", "Mehedi Hasan", "Nafisa Tabassum", "Arif Chowdhury", "Sumaiya Akter", "Rakib Hossain",
  "Fahim Rahman", "Jannatul Ferdous", "Imran Kabir", "Tasnim Haque", "Shakib Alam", "Mithila Das", "Zarif Mahmud", "Anika Sultana",
  "UAP Robotics Club", "BUET EEE Lab", "Sabbir Hossain", "Lamia Noor", "Nayeem Uddin", "Riya Saha", "Tahmid Karim", "DIU Project Team",
];
const cities = ["Dhaka", "Dhaka", "Dhaka", "Gazipur", "Chattogram", "Rajshahi", "Sylhet", "Khulna", "Narayanganj", "Cumilla"];
const sources = ["facebook", "facebook", "website", "website", "whatsapp", "youtube", "google", "instagram"];
const countries = ["Bangladesh", "Bangladesh", "Bangladesh", "Bangladesh", "India", "United Arab Emirates", "Saudi Arabia", "Malaysia", "United States", "United Kingdom"];

/** Deterministic PRNG so the sample set is stable between installs. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const day = (d: Date) => d.toISOString().slice(0, 10);

export function seed(): Db {
  const r = rng(20261115);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const now = Date.now();
  const DAY = 86_400_000;
  const ago = (days: number) => new Date(now - days * DAY - Math.floor(r() * DAY * 0.6));

  const catalog: CatalogItem[] = products.map((p) => ({
    slug: p.slug, name: p.name, sku: p.sku, category: p.category, price: p.price, oldPrice: p.oldPrice, stock: p.stock,
    isNew: p.isNew, summary: p.summary, image: productVisual(p.slug).src, active: true,
  }));

  const promos: Promo[] = promoPlan.flatMap(({ slug, ...rest }, i) => {
    const p = products.find((x) => x.slug === slug);
    if (!p) return [];
    return [{ id: `promo_${i + 1}`, ...rest, text: p.summary, price: p.price, oldPrice: p.oldPrice, href: `/products/${p.slug}`, image: productVisual(p.slug).src, active: true }];
  });

  // Order journey: website → owner approval → packed and shipped by the assigned team member → delivered.
  const handlers = [["emp_nusrat", "Nusrat Jahan"], ["emp_tanvir", "Tanvir Hasan"]] as const;
  const flow = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;
  const trail = (status: DashOrder["status"], at: Date, pickup: boolean): Pick<DashOrder, "history" | "assignee" | "courier" | "cancelReason"> => {
    if (status === "cancelled") return { history: [{ status: "pending", at: at.toISOString(), by: "Website" }, { status, at: new Date(at.getTime() + DAY / 3).toISOString(), by: "Super Admin", note: "Customer unreachable" }], cancelReason: "Customer unreachable" };
    const steps = flow.slice(0, flow.indexOf(status) + 1).filter((s) => !(pickup && s === "shipped"));
    const gap = Math.min(DAY * 0.45, (now - at.getTime()) / (steps.length + 1));
    const [id, name] = pick(handlers);
    const courier = !pickup && steps.includes("shipped") ? { name: pick(couriers), tracking: `${pick(["PTH", "SFC", "RDX"])}-${4800000 + Math.floor(r() * 99999)}` } : undefined;
    return {
      history: steps.map((s, k) => ({ status: s, at: new Date(at.getTime() + k * gap).toISOString(), by: k === 0 ? "Website" : k === 1 ? "Super Admin" : name, ...(s === "shipped" && courier ? { note: `${courier.name} · ${courier.tracking}` } : {}) })),
      ...(steps.length > 1 ? { assignee: id } : {}),
      ...(courier ? { courier } : {}),
    };
  };

  // Orders: more recent months are busier, so the trend charts have a shape.
  const orders: DashOrder[] = [];
  for (let i = 0; i < 170; i++) {
    const age = Math.floor(Math.pow(r(), 1.6) * 360);
    const at = ago(age);
    const lines = Array.from({ length: 1 + Math.floor(r() * 3) }, () => {
      const p = pick(products);
      return { slug: p.slug, name: p.name, sku: p.sku, qty: 1 + Math.floor(r() * 3), price: p.price };
    }).filter((l, idx, all) => all.findIndex((x) => x.slug === l.slug) === idx);
    const delivery = pick(deliveryOptions);
    const subtotal = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const total = subtotal + delivery.fee;
    let status: DashOrder["status"] =
      age > 9 ? (r() < 0.06 ? "cancelled" : "delivered") : age > 5 ? pick(["shipped", "delivered", "delivered"] as const) : age > 2 ? pick(["confirmed", "packed", "shipped"] as const) : pick(["pending", "pending", "confirmed"] as const);
    if (delivery.id === "pickup" && status === "shipped") status = "packed";
    const paid = status === "delivered" ? total : status === "shipped" && r() < 0.4 ? Math.round(total * 0.3) : 0;
    const name = pick(customers);
    orders.push({
      id: `MB-${day(at).slice(2).replace(/-/g, "")}-${(1000 + i).toString(36).toUpperCase()}`,
      createdAt: at.toISOString(),
      customer: { name, phone: `0170000${String(1000 + i).slice(-4)}`, ...(r() < 0.5 ? { email: `${name.split(" ")[0].toLowerCase()}@example.com` } : {}) },
      delivery: { id: delivery.id, label: delivery.label, fee: delivery.fee, ...(delivery.id === "pickup" ? {} : { address: "House 12, Road 4", city: pick(cities) }) },
      payment: delivery.id === "pickup" ? "Pay at pickup" : "Cash on delivery",
      lines, subtotal, total, demo: false, sample: true,
      status,
      payments: paid ? [{ amount: paid, method: paid === total ? "Cash" : "bKash", at: new Date(at.getTime() + 2 * DAY).toISOString() }] : [],
      ...trail(status, at, delivery.id === "pickup"),
      source: pick(sources),
    });
  }
  orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const expenses: Expense[] = [];
  for (let m = 0; m < 12; m++) {
    const d = (dd: number) => day(new Date(now - (m * 30 + dd) * DAY));
    expenses.push(
      { id: `e_r${m}`, date: d(1), category: "Rent", note: "Store & storage, Adabor", amount: 18000, sample: true },
      { id: `e_s${m}`, date: d(2), category: "Salaries", note: "Team salaries", amount: 42000, sample: true },
      { id: `e_p${m}`, date: d(8), category: "Stock purchase", note: "Component restock", amount: 30000 + Math.round(r() * 45000), sample: true },
      { id: `e_d${m}`, date: d(12), category: "Delivery", note: "Courier settlement", amount: 4000 + Math.round(r() * 5000), sample: true },
      { id: `e_m${m}`, date: d(15), category: "Marketing", note: pick(["Facebook ads", "YouTube promotion", "Campus fair stall"]), amount: 3000 + Math.round(r() * 9000), sample: true },
      { id: `e_u${m}`, date: d(20), category: "Utilities", note: "Electricity & internet", amount: 3500 + Math.round(r() * 1500), sample: true },
    );
  }

  const leads: Lead[] = Array.from({ length: 34 }, (_, i) => {
    const name = pick(customers);
    return {
      id: `l_${i}`, createdAt: ago(Math.floor(r() * 120)).toISOString(), name, phone: `0170001${String(1000 + i).slice(-4)}`,
      email: `${name.split(" ")[0].toLowerCase()}${i}@example.com`, org: pick(["UAP", "BUET", "DIU", "NSU", "AIUB", "BRAC University", "", ""]) || undefined,
      source: pick(["facebook", "facebook", "youtube", "google", "instagram", "whatsapp", "website", "referral"] as const), country: pick(countries),
      status: pick(["new", "new", "contacted", "qualified", "won", "lost"] as const), approved: r() < 0.6, value: 2000 + Math.round(r() * 60) * 500,
      note: pick(["Final-year project kit", "Lab equipment quotation", "Bulk sensors for workshop", "Robotics club order", ""]) || undefined, sample: true as const,
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const sampleVisits: Record<string, DayVisits> = {};
  for (let i = 0; i < 120; i++) {
    const visits = Math.round((90 + (120 - i) * 1.4) * (0.75 + r() * 0.5) * (new Date(now - i * DAY).getUTCDay() === 5 ? 0.7 : 1));
    const share = (keys: readonly string[], weights: number[]) =>
      Object.fromEntries(keys.map((k, j) => [k, Math.round((visits * weights[j]) / weights.reduce((a, b) => a + b, 0) * (0.8 + r() * 0.4))]));
    sampleVisits[day(new Date(now - i * DAY))] = {
      visits, views: Math.round(visits * (2.4 + r())), returning: Math.round(visits * (0.32 + r() * 0.1)),
      sources: share(["facebook", "google", "direct", "youtube", "instagram", "whatsapp", "other"], [34, 24, 18, 11, 6, 5, 2]),
      countries: share(["Bangladesh", "India", "United Arab Emirates", "Saudi Arabia", "Malaysia", "United States", "United Kingdom"], [80, 6, 4, 3, 3, 2, 2]),
    };
  }

  const today = (offset: number) => day(new Date(now + offset * DAY));
  // Sample team members can't sign in until the super admin resets their password.
  const locked = () => `scrypt:${randomBytes(16).toString("hex")}:${randomBytes(32).toString("hex")}`;
  const team = [
    { id: "emp_nusrat", username: "nusrat.mb", name: "Nusrat Jahan", designation: "Sales & Support Executive", access: ["orders", "clients"] as const },
    { id: "emp_tanvir", username: "tanvir.mb", name: "Tanvir Hasan", designation: "Inventory & Dispatch", access: ["orders", "products"] as const },
    { id: "emp_farhan", username: "farhan.mb", name: "Farhan Ahmed", designation: "Content & Marketing", access: ["promotions", "products"] as const },
  ];

  return {
    version: 1,
    profile: { name: "Super Admin", title: "Makerbangla · Kandari Lab" },
    employees: team.map((t, i) => ({
      ...t, access: [...t.access], email: `${t.username.split(".")[0]}@example.com`, phone: `0170002000${i}`,
      passwordHash: locked(), sessionVersion: 1, active: true, createdAt: ago(200 - i * 40).toISOString(), sample: true,
    })),
    orders,
    quotes: [
      { id: "Q-1001", createdAt: ago(3).toISOString(), customer: { name: "UAP Robotics Club", phone: "01700030001" }, lines: [{ name: "Arduino Uno R3", qty: 10, price: 850 }, { name: "HC-SR04 Ultrasonic Sensor", qty: 10, price: 120 }], status: "sent", sample: true },
      { id: "Q-1002", createdAt: ago(9).toISOString(), customer: { name: "BUET EEE Lab", phone: "01700030002" }, lines: [{ name: "Digital Multimeter", qty: 6, price: 1450 }], status: "accepted", sample: true },
      { id: "Q-1003", createdAt: ago(1).toISOString(), customer: { name: "DIU Project Team", phone: "01700030003" }, lines: [{ name: "Raspberry Pi 4 · 4 GB", qty: 2, price: 9500 }], status: "draft", sample: true },
    ],
    expenses,
    leads,
    tasks: [
      { id: "t1", title: "Confirm today's pending orders by phone", priority: "important", status: "doing", assignee: "emp_nusrat", due: today(0) },
      { id: "t2", title: "Pack and hand over Gazipur courier batch", priority: "normal", status: "todo", assignee: "emp_tanvir", due: today(0) },
      { id: "t3", title: "Restock HC-SR04 and SG90 — stock is low", priority: "emergency", status: "todo", assignee: "emp_tanvir", due: today(1) },
      { id: "t4", title: "Shoot product photos for new 3D-printing items", priority: "normal", status: "review", assignee: "emp_farhan", due: today(2), submission: "Photos uploaded to the shared drive." },
      { id: "t5", title: "Prepare BUET lab quotation follow-up", priority: "important", status: "todo", assignee: "admin", due: today(1) },
      { id: "t6", title: "Plan next month's Facebook offer posts", priority: "low", status: "todo", assignee: "emp_farhan", due: today(5) },
      { id: "t7", title: "Reconcile courier COD settlement", priority: "important", status: "done", assignee: "admin", due: today(-1) },
      { id: "t8", title: "Reply to YouTube comment leads", priority: "normal", status: "done", assignee: "emp_nusrat", due: today(-2) },
    ].map((t, i) => ({ ...t, priority: t.priority as Db["tasks"][number]["priority"], status: t.status as Db["tasks"][number]["status"], createdAt: ago(6 - (i % 5)).toISOString(), createdBy: "admin", sample: true as const })),
    notes: [
      { id: "n1", owner: "admin", date: today(0), time: "10:00", title: "Supplier call — sensor restock", color: "yellow" as const, pinned: true },
      { id: "n2", owner: "admin", date: today(2), time: "15:30", title: "UAP robotics club visit", color: "blue" as const, pinned: true },
      { id: "n3", owner: "admin", date: today(4), title: "Pay courier settlement", color: "coral" as const, pinned: false },
      { id: "n4", owner: "admin", date: today(7), time: "11:00", title: "Monthly stock count", color: "navy" as const, pinned: false },
      { id: "n5", owner: "admin", date: today(-3), title: "Campus fair stall setup", color: "sky" as const, pinned: false },
    ].map((n) => ({ ...n, sample: true as const })),
    leaves: [
      { id: "lv1", employeeId: "emp_farhan", from: today(6), to: today(7), reason: "Family programme", status: "pending", createdAt: ago(1).toISOString(), sample: true },
      { id: "lv2", employeeId: "emp_nusrat", from: today(-12), to: today(-12), reason: "Medical appointment", status: "approved", createdAt: ago(15).toISOString(), sample: true },
    ],
    messages: [],
    promos,
    products: catalog,
    visits: {},
    sampleVisits,
    activity: [],
  };
}
