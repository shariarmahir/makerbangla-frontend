import { mutate } from "@/lib/admin/db";
import { dayKey } from "@/lib/admin/metrics";
import type { DayVisits } from "@/lib/admin/types";
import { clientIp, limiter } from "@/lib/rate-limit";

/** Country names for the ISO codes hosting platforms put in request headers. */
const names = new Intl.DisplayNames(["en"], { type: "region" });
// 60 views/min per client, 3,000/min site-wide: keeps scripted floods from inflating the traffic report.
const hits = limiter("visit", 60, 60_000);
const siteWide = limiter("visit-all", 3000, 60_000);

// Views are counted in memory and written in one go every few seconds, so a busy page never rewrites the store per hit.
let pending: Record<string, DayVisits> = {};
let timer: ReturnType<typeof setTimeout> | null = null;
function flush() {
  const batch = pending;
  pending = {};
  timer = null;
  mutate((db) => {
    for (const [day, v] of Object.entries(batch)) {
      const d = (db.visits[day] ??= { views: 0, visits: 0, returning: 0, sources: {}, countries: {} });
      d.views += v.views;
      d.visits += v.visits;
      d.returning += v.returning;
      for (const [k, n] of Object.entries(v.sources)) d.sources[k] = (d.sources[k] ?? 0) + n;
      for (const [k, n] of Object.entries(v.countries)) d.countries[k] = (d.countries[k] ?? 0) + n;
    }
  }).catch(() => {});
}

function source(ref: string, utm: string) {
  const s = `${utm} ${ref}`.toLowerCase();
  if (/facebook|fb\.|m\.me|messenger/.test(s)) return "facebook";
  if (/youtube|youtu\.be/.test(s)) return "youtube";
  if (/instagram/.test(s)) return "instagram";
  if (/whatsapp|wa\.me/.test(s)) return "whatsapp";
  if (/google|bing|duckduckgo|yahoo/.test(s)) return "google";
  return s.trim() ? "other" : "direct";
}

/** Receives the storefront's page-view beacon and adds it to today's counters. Stores no IP or identifier. */
export async function POST(req: Request) {
  const now = Date.now();
  if (!hits.take(clientIp(req.headers), now) || !siteWide.take("all", now)) return new Response(null, { status: 204 });

  const text = await req.text().catch(() => "");
  if (text.length > 600) return new Response(null, { status: 204 });
  let body: { p?: unknown; r?: unknown; u?: unknown; f?: unknown; b?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 204 });
  }
  if (typeof body.p !== "string" || !body.p.startsWith("/") || body.p.startsWith("/dashboard")) return new Response(null, { status: 204 });

  const code = (req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? "").toUpperCase();
  let country = "Unknown";
  try {
    if (/^[A-Z]{2}$/.test(code) && code !== "XX") country = names.of(code) ?? "Unknown";
  } catch {}
  const src = source(String(body.r ?? "").slice(0, 100), String(body.u ?? "").slice(0, 40));
  const first = body.f === true;

  const key = dayKey(now);
  const d = (pending[key] ??= { views: 0, visits: 0, returning: 0, sources: {}, countries: {} });
  d.views++;
  if (first) {
    d.visits++;
    if (body.b === true) d.returning++;
    d.sources[src] = (d.sources[src] ?? 0) + 1;
    d.countries[country] = (d.countries[country] ?? 0) + 1;
  }
  timer ??= setTimeout(flush, 5000);
  return new Response(null, { status: 204 });
}
