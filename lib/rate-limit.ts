import "server-only";

/**
 * Client IP for rate limiting. Only headers written by the hosting edge are trusted:
 * - Vercel: `x-vercel-forwarded-for` / `x-real-ip` (the platform overwrites client values).
 * - Elsewhere: the header named in `CLIENT_IP_HEADER` (e.g. `x-real-ip` from nginx `proxy_set_header
 *   X-Real-IP $remote_addr`, or `cf-connecting-ip` behind Cloudflare), otherwise the LAST X-Forwarded-For
 *   entry — the one our own proxy appended. The first entry is whatever the client typed and is never used.
 * With no proxy in front at all, every header is client-controlled: per-IP limits can then be dodged, and the
 * site-wide caps in each action are what holds. Run behind Vercel or a proxy in production.
 */
export function clientIp(h: Headers): string {
  const pick = (v: string | null) => v?.split(",").map((s) => s.trim()).filter(Boolean).at(-1);
  const named = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  const ip =
    (process.env.VERCEL ? (pick(h.get("x-vercel-forwarded-for")) ?? pick(h.get("x-real-ip"))) : undefined) ??
    (named ? pick(h.get(named)) : undefined) ??
    pick(h.get("x-forwarded-for")) ??
    "local";
  return ip.slice(0, 64);
}

type Hit = { n: number; until: number };
const store = ((globalThis as { __mbRate?: Map<string, Map<string, Hit>> }).__mbRate ??= new Map());
const MAX_KEYS = 20_000;

/**
 * Fixed-window counter, per server instance. A full table drops expired entries first, then the oldest —
 * never the whole table, so flooding it with fake keys can't reset someone else's limit.
 */
export function limiter(name: string, max: number, windowMs: number) {
  const table = store.get(name) ?? new Map<string, Hit>();
  store.set(name, table);
  const live = (key: string, now: number) => {
    const h = table.get(key);
    return h && h.until > now ? h : undefined;
  };
  return {
    /** True when `key` has used its allowance in the current window. */
    blocked: (key: string, now = Date.now()) => (live(key, now)?.n ?? 0) >= max,
    /** Counts one use; returns false (and does not count) when already over the limit. */
    take(key: string, now = Date.now()) {
      const h = live(key, now);
      if (h && h.n >= max) return false;
      if (h) h.n++;
      else {
        table.delete(key);
        table.set(key, { n: 1, until: now + windowMs });
      }
      if (table.size > MAX_KEYS) {
        for (const [k, v] of table) if (v.until <= now) table.delete(k);
        for (const k of table.keys()) {
          if (table.size <= MAX_KEYS * 0.9) break;
          table.delete(k);
        }
      }
      return true;
    },
    reset: (key: string) => void table.delete(key),
  };
}
