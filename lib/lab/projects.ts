import { useSyncExternalStore } from "react";
import { z } from "zod";
import { KINDS, type Circuit } from "./engine";

/**
 * Lab Kitchen projects, saved on this device (localStorage) until accounts and the backend exist.
 * Everything read back — from storage or an imported file — is validated, so a tampered or corrupt
 * project can't reach the editor or the solver.
 */

const id = z.string().regex(/^[A-Za-z0-9_+-]{1,40}$/);
const prop = z.union([z.number().finite(), z.string().max(24), z.boolean()]);
const part = z.object({
  id,
  kind: z.enum(KINDS as [string, ...string[]]),
  label: z.string().max(12),
  x: z.number().int().min(-500).max(1000),
  y: z.number().int().min(-500).max(1000),
  rot: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  props: z.record(z.string().max(12), prop).refine((o) => Object.keys(o).length <= 40),
});
const pinRef = z.object({ part: id, pin: z.string().regex(/^[A-Za-z0-9+-]{1,8}$/) });
const wire = z.object({ id, a: pinRef, b: pinRef, color: z.enum(["blue", "navy", "yellow", "coral", "ink"]).optional() });
export const circuitSchema = z.object({ parts: z.array(part).max(150), wires: z.array(wire).max(400) }).transform((c) => {
  const ids = new Set(c.parts.map((p) => p.id));
  return { parts: c.parts, wires: c.wires.filter((w) => ids.has(w.a.part) && ids.has(w.b.part)) } as Circuit;
});

const version = z.object({ id, at: z.string().max(40), label: z.string().max(60), circuit: circuitSchema });
const project = z.object({
  id,
  name: z.string().max(60),
  createdAt: z.string().max(40),
  updatedAt: z.string().max(40),
  experiment: z.string().max(60).optional(),
  circuit: circuitSchema,
  versions: z.array(version).max(20).default([]),
  observations: z.record(z.string().max(12), z.record(z.string().max(40), z.number().finite())).default({}),
  student: z.string().max(80).default(""),
  conclusion: z.string().max(2000).default(""),
});
export type Project = z.infer<typeof project>;
export type Version = z.infer<typeof version>;

const KEY = "mb-lab-v1";
const MAX_PROJECTS = 30;
let state: Project[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    state = (Array.isArray(raw) ? raw : []).flatMap((p) => {
      const r = project.safeParse(p);
      return r.success ? [r.data] : [];
    }).slice(0, MAX_PROJECTS);
  } catch {
    state = [];
  }
}
function write(next: Project[]) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked — keep working in memory */
  }
  listeners.forEach((l) => l());
}
/** Loads saved projects once, before the first read or write, so nothing is overwritten unseen. */
function ensure() {
  if (hydrated) return;
  hydrated = true;
  read();
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    read();
    listeners.forEach((x) => x());
  });
}
function subscribe(l: () => void) {
  ensure();
  listeners.add(l);
  return () => listeners.delete(l);
}
const EMPTY: Project[] = [];

/** All projects, newest first. `null` until the browser store has been read (avoids a flash of "no projects"). */
export function useProjects(): Project[] | null {
  const list = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  return ready ? list : null;
}

export const newId = (prefix = "") => `${prefix}${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
const now = () => new Date().toISOString();

export const projects = {
  get(pid: string) {
    ensure();
    return state.find((p) => p.id === pid);
  },
  create(input: { name: string; circuit: Circuit; experiment?: string }): Project {
    ensure();
    const p: Project = { id: newId("lk"), name: input.name.slice(0, 60), createdAt: now(), updatedAt: now(), experiment: input.experiment, circuit: input.circuit, versions: [], observations: {}, student: "", conclusion: "" };
    write([p, ...state].slice(0, MAX_PROJECTS));
    return p;
  },
  update(pid: string, patch: Partial<Omit<Project, "id" | "createdAt">>) {
    ensure();
    write(state.map((p) => (p.id === pid ? { ...p, ...patch, updatedAt: now() } : p)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  },
  remove(pid: string) {
    ensure();
    write(state.filter((p) => p.id !== pid));
  },
  duplicate(pid: string) {
    const src = state.find((p) => p.id === pid);
    if (src) projects.create({ name: `${src.name} (copy)`, circuit: structuredClone(src.circuit), experiment: src.experiment });
  },
  /** Saves an immutable snapshot of the current circuit. */
  snapshot(pid: string, label: string) {
    const p = state.find((x) => x.id === pid);
    if (!p) return;
    const v: Version = { id: newId("v"), at: now(), label: label.slice(0, 60) || `Version ${p.versions.length + 1}`, circuit: structuredClone(p.circuit) };
    projects.update(pid, { versions: [v, ...p.versions].slice(0, 20) });
  },
};

// ——— Import / export ———

const FILE_FORMAT = "makerbangla-lab-kitchen";
const fileSchema = z.object({ format: z.literal(FILE_FORMAT), version: z.literal(1), name: z.string().max(60), experiment: z.string().max(60).optional(), circuit: circuitSchema });

export function exportProject(p: Project) {
  const body = JSON.stringify({ format: FILE_FORMAT, version: 1, name: p.name, experiment: p.experiment, circuit: p.circuit }, null, 2);
  const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${p.name.replace(/[^\w-]+/g, "-").replace(/^-|-$/g, "") || "lab-project"}.mblab.json` });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Reads a project file (max 512 KB). Returns the new project, or an error message. */
export async function importProject(file: File): Promise<Project | string> {
  if (file.size > 512 * 1024) return "That file is too large to be a Lab Kitchen project.";
  try {
    const r = fileSchema.safeParse(JSON.parse(await file.text()));
    if (!r.success) return "That file isn't a valid Lab Kitchen project.";
    return projects.create({ name: r.data.name || "Imported project", circuit: r.data.circuit, experiment: r.data.experiment });
  } catch {
    return "That file couldn't be read as a Lab Kitchen project.";
  }
}
