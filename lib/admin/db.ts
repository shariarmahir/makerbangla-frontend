import "server-only";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { seed } from "./seed";
import type { Db } from "./types";

/**
 * Tiny JSON file store that stands in for the backend while it is being built (`.data/db.json`, git-ignored).
 * Reads are cached and re-loaded when the file changes; writes are serialised and atomic (temp file + rename).
 * Swap `readDb`/`mutate` for API calls once `../makerbangla-backend` exists — the rest of the dashboard is unaware.
 */
export const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), ".data"));
const file = path.join(dataDir, "db.json");

// One cache and one write queue per server process. Next.js may load this module more than once (route handlers,
// pages, actions), so they live on globalThis — otherwise two copies could write at the same time and lose an update.
const g = globalThis as unknown as { __mbStore?: { cache: { db: Db; mtime: number } | null; queue: Promise<unknown> } };
const store = (g.__mbStore ??= { cache: null, queue: Promise.resolve() });

export async function readDb(): Promise<Db> {
  const mtime = await stat(file).then((s) => s.mtimeMs, () => -1);
  if (store.cache && store.cache.mtime === mtime) return store.cache.db;
  if (mtime < 0) {
    const db = seed();
    await persist(db);
    return db;
  }
  const db = JSON.parse(await readFile(file, "utf8")) as Db;
  store.cache = { db, mtime };
  return db;
}

async function persist(db: Db) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(db));
  for (let i = 0; ; i++) {
    try {
      await rename(tmp, file);
      break;
    } catch (e) {
      if (i > 4) throw e; // Windows can briefly lock a file that is being read
      await new Promise((r) => setTimeout(r, 40));
    }
  }
  store.cache = { db, mtime: (await stat(file)).mtimeMs };
}

/** Serialised read-modify-write. If `fn` throws, nothing is written and the cache is dropped. */
export function mutate<T>(fn: (db: Db) => T): Promise<T> {
  const run = store.queue.then(async () => {
    const db = structuredClone(await readDb());
    const out = fn(db);
    await persist(db);
    return out;
  });
  store.queue = run.catch(() => {
    store.cache = null;
  });
  return run;
}

export const uid = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

export function log(db: Db, who: string, text: string) {
  db.activity.unshift({ id: uid("a"), at: new Date().toISOString(), who, text });
  db.activity.length = Math.min(db.activity.length, 200);
}
