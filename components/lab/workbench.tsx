"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileUp, FlaskConical, History, Maximize, Minus, MonitorSmartphone, Plus, Redo2, RotateCcw, ShoppingCart, Square, Play, Undo2 } from "lucide-react";
import { KINDS, pinKey, pinPos, pinsOf, simulateDc, switchClosed, simulateTransient, validate, fmt, sampleAt, type Circuit, type Part, type PartKind, type PinRef, type Prop, type Rot, type TransientResult } from "@/lib/lab/engine";
import { getExperiment, withinTol, type ObsRow } from "@/lib/lab/experiments";
import { defaults, MODELS, worldBox } from "@/lib/lab/models";
import { buildBom } from "@/lib/lab/bom";
import { exportProject, importProject, newId, projects, useProjects, type Project } from "@/lib/lab/projects";
import { downloadReport } from "@/lib/lab/report";
import { cart, cartCount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CircuitPreview, circuitBounds, drawOrder, G, PartArt, wireEnds, wirePath, WireArt } from "./circuit-art";
import { CodePanel, ExperimentPanel, Inspector, IssueList, Library, Measurements, PartsList, tbGhost, WaveChart, type LabProduct, type Tab } from "./bench-panels";

const BASE = "/learn/lab-kitchen/workspace";

/** Resolves ?p= (open), ?x= (start an experiment) or nothing (blank project), then mounts the editor. */
export function Workbench({ products }: { products: Record<string, LabProduct> }) {
  const sp = useSearchParams();
  const router = useRouter();
  const list = useProjects();
  const pid = sp.get("p");
  const x = sp.get("x");
  const creating = useRef(false);
  const project = list && pid ? list.find((p) => p.id === pid) : undefined;

  useEffect(() => {
    if (list === null || pid || creating.current) return;
    creating.current = true;
    const e = x ? getExperiment(x) : undefined;
    const p = projects.create({ name: e ? e.title : "Untitled project", circuit: e ? structuredClone(e.circuit) : { parts: [], wires: [] }, experiment: e?.slug });
    router.replace(`${BASE}?p=${p.id}`);
  }, [list, pid, x, router]);

  if (list === null || !pid) return <Shell><p className="m-auto text-[13px] font-bold text-white/70">Opening the bench…</p></Shell>;
  if (!project) return (
    <Shell>
      <div className="m-auto max-w-sm rounded-2xl bg-white p-6 text-center">
        <p className="text-[15px] font-black text-ink">Project not found on this device</p>
        <p className="mt-1 text-[12.5px] text-subtle">Projects are saved in this browser. Import the project file, or start a new one.</p>
        <Link href={`${BASE}`} className="mt-4 inline-flex rounded-lg bg-tile-navy px-4 py-2 text-[12.5px] font-bold text-tile-yellow">New project</Link>
      </div>
    </Shell>
  );
  return <Editor key={project.id} project={project} products={products} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh flex-col bg-tile-midnight">{children}</div>;
}

// ——— History ———

type H = { c: Circuit; past: Circuit[]; future: Circuit[] };
type Act = { t: "do"; f: (c: Circuit) => Circuit } | { t: "live"; f: (c: Circuit) => Circuit } | { t: "mark"; before: Circuit } | { t: "undo" } | { t: "redo" } | { t: "load"; c: Circuit };
function reducer(h: H, a: Act): H {
  switch (a.t) {
    case "do": {
      const c = a.f(h.c);
      return c === h.c ? h : { c, past: [...h.past.slice(-80), h.c], future: [] };
    }
    case "live": return { ...h, c: a.f(h.c) };
    case "mark": return { ...h, past: [...h.past.slice(-80), a.before], future: [] };
    case "undo": return h.past.length ? { c: h.past[h.past.length - 1], past: h.past.slice(0, -1), future: [h.c, ...h.future] } : h;
    case "redo": return h.future.length ? { c: h.future[0], past: [...h.past, h.c], future: h.future.slice(1) } : h;
    case "load": return { c: a.c, past: [...h.past.slice(-80), h.c], future: [] };
  }
}

function nextLabel(c: Circuit, kind: PartKind) {
  const prefix = MODELS[kind].prefix;
  if (kind === "ground") return "GND";
  const used = c.parts.filter((p) => p.kind === kind).map((p) => Number(p.label.slice(prefix.length)) || 0);
  return `${prefix}${Math.max(0, ...used) + 1}`;
}

/**
 * A click-added part goes to the first spot near (x, y) where its body doesn't overlap another part, so it
 * never lands on (and silently connects to) an existing pin. Dragged parts go exactly where they're dropped.
 */
function freeSpot(c: Circuit, kind: PartKind, x: number, y: number): [number, number] {
  const probe = (px: number, py: number): Part => ({ id: "_", kind, label: "", x: px, y: py, rot: 0, props: {} });
  const hit = (a: [number, number, number, number], b: [number, number, number, number]) => a[0] < b[0] + b[2] + 0.5 && b[0] < a[0] + a[2] + 0.5 && a[1] < b[1] + b[3] + 0.5 && b[1] < a[1] + a[3] + 0.5;
  const others = c.parts.map(worldBox);
  for (let ring = 0; ring < 12; ring++) for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    if (ring === 0 && (dx || dy)) continue;
    const px = x + dx * ring * 4, py = y + dy * ring * 4;
    const box = worldBox(probe(px, py));
    if (!others.some((o) => hit(box, o))) return [px, py];
  }
  return [x, y];
}

type Sel = { kind: "part" | "wire"; id: string } | null;
type Drag = { ids: string[]; sx: number; sy: number; orig: Map<string, [number, number]>; before: Circuit; moved: boolean; id: string } | null;
type Pan = { sx: number; sy: number; vx: number; vy: number } | null;

function Editor({ project, products }: { project: Project; products: Record<string, LabProduct> }) {
  const [h, dispatch] = useReducer(reducer, { c: project.circuit, past: [], future: [] });
  const c = h.c;
  const experiment = project.experiment ? getExperiment(project.experiment) : undefined;
  const [name, setName] = useState(project.name);
  const [savedC, setSavedC] = useState(project.circuit);
  const saved: "saved" | "saving" = c === savedC ? "saved" : "saving";
  const [sel, setSel] = useState<Sel>(null);
  const [live, setLive] = useState(false);
  const [tr, setTr] = useState<{ c: Circuit; r: TransientResult } | null>(null);
  const [duration, setDuration] = useState(experiment?.duration ?? 1);
  const [tab, setTab] = useState<Tab>(experiment ? "experiment" : "validation");
  const [panelOpen, setPanelOpen] = useState(true);
  const [wiring, setWiring] = useState<{ from: PinRef; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
  const [view, setView] = useState({ x: 40, y: 40, k: 1 });
  const [toast, setToast] = useState("");
  const [obsMsg, setObsMsg] = useState("");
  const [versionsOpen, setVersionsOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag>(null);
  const pan = useRef<Pan>(null);
  const count = useStore(cartCount);
  const router = useRouter();

  const say = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((t) => (t === m ? "" : t)), 3200);
  }, []);

  // ——— Derived state ———
  const issues = useMemo(() => validate(c), [c]);
  const dc = useMemo(() => (live ? simulateDc(c) : null), [live, c]);
  const trFresh = tr && tr.c === c ? tr.r : null;
  const result = dc ?? trFresh?.final ?? null;
  const bom = useMemo(() => buildBom(c), [c]);
  const shownIssues = dc ? dc.issues : trFresh ? trFresh.issues : issues;

  // ——— Autosave ———
  useEffect(() => {
    if (c === savedC) return;
    const t = window.setTimeout(() => {
      projects.update(project.id, { circuit: c });
      setSavedC(c);
    }, 450);
    return () => window.clearTimeout(t);
  }, [c, savedC, project.id]);

  // ——— View ———
  const fit = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const [bx, by, bw, bh] = circuitBounds(c, 2);
    const W = el.clientWidth, Hh = el.clientHeight;
    const k = Math.min(1.6, Math.max(0.3, Math.min(W / bw, Hh / bh)));
    setView({ k, x: (W - bw * k) / 2 - bx * k, y: (Hh - bh * k) / 2 - by * k });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.parts.length]);
  useEffect(() => {
    fit();
    // fit once on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      setView((v) => {
        const k = Math.min(3, Math.max(0.25, v.k * Math.exp(-e.deltaY * 0.0015)));
        return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  const zoom = (f: number) => {
    const el = wrap.current;
    const cx = (el?.clientWidth ?? 800) / 2, cy = (el?.clientHeight ?? 500) / 2;
    setView((v) => {
      const k = Math.min(3, Math.max(0.25, v.k * f));
      return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
    });
  };
  const world = (clientX: number, clientY: number) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: (clientX - r.left - view.x) / view.k / G, y: (clientY - r.top - view.y) / view.k / G };
  };

  // ——— Edits ———
  const addPart = (kind: PartKind, x?: number, y?: number) => {
    const el = wrap.current;
    const cx = x ?? Math.round(((el?.clientWidth ?? 800) / 2 - view.x) / view.k / G);
    const cy = y ?? Math.round(((el?.clientHeight ?? 500) / 2 - view.y) / view.k / G);
    const id = newId("p");
    const placed = x === undefined ? freeSpot(c, kind, cx, cy) : [cx, cy];
    dispatch({ t: "do", f: (cc) => ({ ...cc, parts: [...cc.parts, { id, kind, label: nextLabel(cc, kind), x: placed[0], y: placed[1], rot: 0, props: defaults(kind) }] }) });
    setSel({ kind: "part", id });
  };
  const setProp = (id: string, key: string, v: Prop) => dispatch({ t: "do", f: (cc) => ({ ...cc, parts: cc.parts.map((p) => (p.id === id ? { ...p, props: { ...p.props, [key]: v } } : p)) }) });
  const remove = () => {
    if (!sel) return;
    if (sel.kind === "part") dispatch({ t: "do", f: (cc) => ({ parts: cc.parts.filter((p) => p.id !== sel.id), wires: cc.wires.filter((w) => w.a.part !== sel.id && w.b.part !== sel.id) }) });
    else dispatch({ t: "do", f: (cc) => ({ ...cc, wires: cc.wires.filter((w) => w.id !== sel.id) }) });
    setSel(null);
  };
  const rotateSel = () => {
    if (sel?.kind !== "part") return;
    dispatch({ t: "do", f: (cc) => ({ ...cc, parts: cc.parts.map((p) => (p.id === sel.id && MODELS[p.kind].rotatable ? { ...p, rot: ((p.rot + 1) % 4) as Rot } : p)) }) });
  };
  const duplicate = () => {
    if (sel?.kind !== "part") return;
    const id = newId("p");
    dispatch({ t: "do", f: (cc) => {
      const src = cc.parts.find((p) => p.id === sel.id);
      return src ? { ...cc, parts: [...cc.parts, { ...src, id, label: nextLabel(cc, src.kind), x: src.x + 2, y: src.y + 2, props: { ...src.props } }] } : cc;
    } });
    setSel({ kind: "part", id });
  };
  const addWire = (a: PinRef, b: PinRef) => {
    if (a.part === b.part && a.pin === b.pin) return;
    dispatch({ t: "do", f: (cc) => (cc.wires.some((w) => (w.a.part === a.part && w.a.pin === a.pin && w.b.part === b.part && w.b.pin === b.pin) || (w.a.part === b.part && w.a.pin === b.pin && w.b.part === a.part && w.b.pin === a.pin)) ? cc : { ...cc, wires: [...cc.wires, { id: newId("w"), a, b, color: "blue" }] }) });
  };
  const addToCart = (items: { slug: string; qty: number }[]) => {
    let n = 0;
    for (const { slug, qty } of items) {
      const p = products[slug];
      if (!p || p.stock <= 0) continue;
      cart.add({ slug: p.slug, name: p.name, price: p.price, image: p.image }, Math.min(qty, p.stock));
      n += qty;
    }
    say(n ? `Added ${n} item${n === 1 ? "" : "s"} to your cart` : "Nothing in stock to add");
  };

  // ——— Keyboard (listener attached once; it calls the latest handlers through a ref) ———
  const keys = useRef({ sel, remove, rotateSel, duplicate });
  useEffect(() => {
    keys.current = { sel, remove, rotateSel, duplicate };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); dispatch({ t: e.shiftKey ? "redo" : "undo" }); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); dispatch({ t: "redo" }); }
      else if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); keys.current.duplicate(); }
      else if (e.key === "Delete" || e.key === "Backspace") { if (keys.current.sel) { e.preventDefault(); keys.current.remove(); } }
      else if (e.key.toLowerCase() === "r" && !mod) keys.current.rotateSel();
      else if (e.key === "Escape") { setWiring(null); setSel(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ——— Pointer ———
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = (e.target as Element).closest("[data-pin],[data-part],[data-wire]");
    const w = world(e.clientX, e.clientY);
    if (target?.hasAttribute("data-pin")) {
      const [part, pin] = target.getAttribute("data-pin")!.split("|");
      if (wiring) {
        addWire(wiring.from, { part, pin });
        setWiring(null);
      } else setWiring({ from: { part, pin }, x: w.x, y: w.y });
      return;
    }
    if (wiring) { setWiring(null); return; }
    if (target?.hasAttribute("data-part")) {
      const id = target.getAttribute("data-part")!;
      setSel({ kind: "part", id });
      const p = c.parts.find((x) => x.id === id)!;
      const ids = [id];
      if (p.kind === "breadboard") {
        const holes = new Set(pinsOf("breadboard").map((pin) => pinPos(p, pin).join(",")));
        for (const o of c.parts) if (o.id !== id && o.kind !== "breadboard" && pinsOf(o.kind).every((pin) => holes.has(pinPos(o, pin).join(",")))) ids.push(o.id);
      }
      if (p.kind === "button") dispatch({ t: "live", f: (cc) => ({ ...cc, parts: cc.parts.map((x) => (x.id === id ? { ...x, props: { ...x.props, pressed: true } } : x)) }) });
      drag.current = { id, ids, sx: w.x, sy: w.y, orig: new Map(c.parts.filter((x) => ids.includes(x.id)).map((x) => [x.id, [x.x, x.y]])), before: c, moved: false };
      svg.current?.setPointerCapture(e.pointerId);
      return;
    }
    if (target?.hasAttribute("data-wire")) { setSel({ kind: "wire", id: target.getAttribute("data-wire")! }); return; }
    setSel(null);
    pan.current = { sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    svg.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const w = world(e.clientX, e.clientY);
    if (wiring) setWiring({ ...wiring, x: w.x, y: w.y });
    const d = drag.current;
    if (d) {
      const dx = Math.round(w.x - d.sx), dy = Math.round(w.y - d.sy);
      const first = d.orig.get(d.id)!;
      const cur = c.parts.find((p) => p.id === d.id);
      if (cur && (cur.x !== first[0] + dx || cur.y !== first[1] + dy)) {
        d.moved = true;
        dispatch({ t: "live", f: (cc) => ({ ...cc, parts: cc.parts.map((p) => (d.orig.has(p.id) ? { ...p, x: d.orig.get(p.id)![0] + dx, y: d.orig.get(p.id)![1] + dy } : p)) }) });
      }
      return;
    }
    if (pan.current) {
      const pn = pan.current;
      setView((v) => ({ ...v, x: pn.vx + e.clientX - pn.sx, y: pn.vy + e.clientY - pn.sy }));
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (d) {
      const p = c.parts.find((x) => x.id === d.id);
      if (p?.kind === "button") dispatch({ t: "live", f: (cc) => ({ ...cc, parts: cc.parts.map((x) => (x.id === p.id ? { ...x, props: { ...x.props, pressed: false } } : x)) }) });
      if (d.moved) dispatch({ t: "mark", before: d.before });
      else if (p?.kind === "switch") setProp(p.id, "closed", !switchClosed(p));
    }
    drag.current = null;
    pan.current = null;
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData("application/x-mb-part") as PartKind;
    if (!(KINDS as string[]).includes(kind)) return;
    const w = world(e.clientX, e.clientY);
    addPart(kind, Math.round(w.x), Math.round(w.y));
  };

  // ——— Experiment ———
  const record = (row: ObsRow) => {
    if (!experiment) return;
    if (row.set) {
      const p = c.parts.find((x) => x.id === row.set!.part);
      if (!p || Number(p.props[row.set.prop]) !== row.set.value) { setObsMsg(`${row.set.text} first (or press it to apply).`); return; }
    }
    const values: Record<string, number> = {};
    for (const rd of row.readings) {
      if (rd.at !== undefined) {
        const t = trFresh?.traces.find((x) => x.id === rd.part);
        if (!trFresh || !t) { setObsMsg("Run the transient analysis in Waveforms first."); setTab("waveforms"); return; }
        values[rd.part] = sampleAt(trFresh.times, t.values, rd.at);
      } else {
        const v = dc?.parts[rd.part]?.reading;
        if (v === undefined) { setObsMsg("Run the circuit first, then record."); return; }
        values[rd.part] = v;
      }
    }
    projects.update(project.id, { observations: { ...project.observations, [row.id]: values } });
    setObsMsg(`Recorded ${row.label}.`);
  };
  const apply = (row: ObsRow) => row.set && setProp(row.set.part, row.set.prop, row.set.value);
  const totalReadings = experiment?.rows.reduce((n, r) => n + r.readings.length, 0) ?? 0;
  const matched = experiment?.rows.reduce((n, r) => n + r.readings.filter((rd) => { const v = project.observations[r.id]?.[rd.part]; return v !== undefined && withinTol(rd, v); }).length, 0) ?? 0;

  // ——— Status ———
  const errors = issues.filter((i) => i.level === "error").length, warnings = issues.filter((i) => i.level === "warning").length;
  const meters = result ? Object.values(result.parts).filter((r) => r.reading !== undefined).length : 0;
  const status = [
    { label: "Validation", value: errors ? `failed · ${errors} error${errors > 1 ? "s" : ""}` : warnings ? `passed · ${warnings} warning${warnings > 1 ? "s" : ""}` : "passed", tone: errors ? "bad" : warnings ? "warn" : "good" },
    { label: "Simulation", value: dc ? (dc.ok ? "running live" : "stopped — see problems") : trFresh ? (trFresh.ok ? "transient completed" : "transient failed") : "not run", tone: dc ? (dc.ok ? "good" : "bad") : trFresh ? (trFresh.ok ? "good" : "bad") : "idle" },
    { label: "Measurements", value: result ? `${meters} meter reading${meters === 1 ? "" : "s"}${trFresh ? ` · ${trFresh.traces.length} trace${trFresh.traces.length === 1 ? "" : "s"}` : ""}` : "none yet", tone: result ? "good" : "idle" },
    ...(experiment ? [{ label: "Expected values", value: `${matched} / ${totalReadings} matched`, tone: matched === totalReadings && totalReadings ? "good" : "idle" }] : []),
  ];

  const report = () => downloadReport(projects.get(project.id) ?? project, experiment, status.map(({ label, value }) => ({ label, value })), bom.rows);

  const tabs: [Tab, string][] = [
    ...(experiment ? ([["experiment", "Experiment"]] as [Tab, string][]) : []),
    ["validation", `Problems${shownIssues.length ? ` · ${shownIssues.length}` : ""}`],
    ["measurements", "Measurements"],
    ["waveforms", "Waveforms"],
    ["parts", `Parts list · ${bom.rows.reduce((n, r) => n + r.qty, 0)}`],
    ["log", "Log"],
    ["code", "Code"],
  ];

  // Holes in use (a lead or a wire end sits there) get a ring so you can see what's plugged in.
  const usedHoles = useMemo(() => {
    const leads = new Set<string>();
    for (const o of c.parts) if (o.kind !== "breadboard") for (const pin of pinsOf(o.kind)) leads.add(pinPos(o, pin).join(","));
    const ends = new Set(c.wires.flatMap((w) => [pinKey(w.a.part, w.a.pin), pinKey(w.b.part, w.b.pin)]));
    const out: [number, number][] = [];
    for (const b of c.parts) if (b.kind === "breadboard") for (const pin of pinsOf("breadboard")) {
      const pos = pinPos(b, pin);
      if (leads.has(pos.join(",")) || ends.has(pinKey(b.id, pin.id))) out.push(pos);
    }
    return out;
  }, [c]);

  const hoverInfo = hover && (() => {
    const [partId, pinId] = hover.key.split(":");
    const p = c.parts.find((x) => x.id === partId);
    if (!p) return null;
    const v = result?.pinV[hover.key];
    const rowName = p.kind === "breadboard" ? `Hole ${pinId}` : `${p.label} · ${MODELS[p.kind].pinNames[pinId] ?? pinId}`;
    return { rowName, v };
  })();

  const pinsLayer = drawOrder(c).map((p) =>
    pinsOf(p.kind).map((pin) => {
      const [x, y] = pinPos(p, pin);
      const key = pinKey(p.id, pin.id);
      const hole = p.kind === "breadboard";
      return (
        <circle
          key={key}
          data-pin={`${p.id}|${pin.id}`}
          cx={x * G}
          cy={y * G}
          r={hole ? 4.5 : 5}
          onPointerEnter={() => setHover({ key, x: x * G * view.k + view.x, y: y * G * view.k + view.y })}
          onPointerLeave={() => setHover((hv) => (hv?.key === key ? null : hv))}
          className={cn("cursor-crosshair fill-transparent", hole ? "hover:fill-brand/40" : "fill-white/0 stroke-transparent hover:fill-tile-yellow hover:stroke-tile-navy", wiring && !hole && "fill-tile-yellow/70 stroke-tile-navy")}
          strokeWidth={1.5}
        />
      );
    }),
  );

  const from = wiring && (() => {
    const p = c.parts.find((x) => x.id === wiring.from.part);
    const pin = p && pinsOf(p.kind).find((q) => q.id === wiring.from.pin);
    return p && pin ? pinPos(p, pin) : null;
  })();

  return (
    <>
      {/* Phones and small tablets: viewing only — the editor needs room */}
      <div className="flex min-h-dvh flex-col bg-soft lg:hidden">
        <TopBar name={name} saved={saved} count={count} compact />
        <div className="space-y-4 p-4">
          <div className="rounded-2xl bg-tile-navy p-5 text-white">
            <MonitorSmartphone className="size-7 text-tile-yellow" />
            <p className="mt-3 text-[17px] font-black">Open the bench on a larger screen</p>
            <p className="mt-1 text-[13px] text-white/75">Assembling and wiring needs a screen at least 1024 px wide. Here you can view the project and its parts list.</p>
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-line"><CircuitPreview c={c} result={result ?? undefined} title={`${name} circuit`} className="h-auto w-full" /></div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-line"><PartsList rows={bom.rows} picks={bom.picks} products={products} onAdd={addToCart} /></div>
        </div>
      </div>

      <div className="hidden h-dvh flex-col bg-soft lg:flex">
        <TopBar name={name} saved={saved} count={count}>
          <input value={name} onChange={(e) => { setName(e.target.value.slice(0, 60)); projects.update(project.id, { name: e.target.value.slice(0, 60) || "Untitled project" }); }} aria-label="Project name" className="h-8 w-56 rounded-lg bg-white/10 px-2.5 text-[13px] font-bold text-white outline-none placeholder:text-white/50 focus:bg-white/15 focus:ring-2 focus:ring-tile-yellow" />
          <span className="w-16 text-[11px] font-bold text-white/60" aria-live="polite">{saved === "saving" ? "Saving…" : "Saved"}</span>
          <span className="mx-1 h-5 w-px bg-white/15" />
          <button className={tbGhost} onClick={() => dispatch({ t: "undo" })} disabled={!h.past.length} title="Undo (Ctrl+Z)" aria-label="Undo"><Undo2 className="size-4" /></button>
          <button className={tbGhost} onClick={() => dispatch({ t: "redo" })} disabled={!h.future.length} title="Redo (Ctrl+Shift+Z)" aria-label="Redo"><Redo2 className="size-4" /></button>
          <button className={tbGhost} onClick={() => zoom(1 / 1.2)} title="Zoom out" aria-label="Zoom out"><Minus className="size-4" /></button>
          <span className="w-10 text-center text-[11px] font-bold text-white/70 tabular-nums">{Math.round(view.k * 100)}%</span>
          <button className={tbGhost} onClick={() => zoom(1.2)} title="Zoom in" aria-label="Zoom in"><Plus className="size-4" /></button>
          <button className={tbGhost} onClick={fit} title="Fit to screen" aria-label="Fit to screen"><Maximize className="size-4" /></button>
          <span className="mx-1 h-5 w-px bg-white/15" />
          <div className="relative">
            <button className={tbGhost} onClick={() => setVersionsOpen((o) => !o)} aria-expanded={versionsOpen}><History className="size-4" /> Versions</button>
            {versionsOpen && <Versions project={project} onRestore={(cc) => { dispatch({ t: "load", c: structuredClone(cc) }); setVersionsOpen(false); say("Version restored — undo brings your work back"); }} onClose={() => setVersionsOpen(false)} />}
          </div>
          <button className={tbGhost} onClick={() => exportProject({ ...project, name, circuit: c })} title="Download the project file to share or back up"><Download className="size-4" /> Export</button>
          <label className={cn(tbGhost, "cursor-pointer")} title="Open a project file">
            <FileUp className="size-4" /> Import
            <input type="file" accept="application/json,.json" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; const r = await importProject(f); if (typeof r === "string") say(r); else router.push(`${BASE}?p=${r.id}`); }} />
          </label>
          <button className={tbGhost} onClick={() => { if (window.confirm(experiment ? "Reset the bench to the experiment's starting circuit?" : "Clear the bench? You can undo this.")) dispatch({ t: "load", c: experiment ? structuredClone(experiment.circuit) : { parts: [], wires: [] } }); }} title="Reset the bench"><RotateCcw className="size-4" /> Reset</button>
          <span className="flex-1" />
          <button onClick={() => { setLive((l) => !l); setTab((t) => (t === "experiment" ? t : live ? "validation" : "measurements")); }} className={cn("inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-black shadow-[0_4px_0_0_rgb(0_0_0/0.25)] transition active:translate-y-0.5 active:shadow-none", live ? "bg-tile-coral text-white" : "bg-tile-yellow text-tile-navy")}>
            {live ? <><Square className="size-3.5 fill-current" /> Stop</> : <><Play className="size-4 fill-current" /> Run</>}
          </button>
        </TopBar>

        {/* Status strip: each stage reported separately — a completed run is not proof of a correct design */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-line bg-white px-3 text-[11.5px]">
          {status.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5 rounded-full bg-soft px-2.5 py-1 ring-1 ring-line">
              <span className={cn("size-2 rounded-full", s.tone === "good" ? "bg-brand" : s.tone === "warn" ? "bg-tile-yellow" : s.tone === "bad" ? "bg-tile-coral" : "bg-line")} />
              <b className="text-ink">{s.label}</b> <span className="text-subtle">{s.value}</span>
            </span>
          ))}
          {experiment && <Link href={`/learn/lab-kitchen/experiments/${experiment.slug}`} className="ml-auto flex items-center gap-1 font-bold text-brand-strong hover:underline"><FlaskConical className="size-3.5" /> {experiment.title} guide</Link>}
        </div>

        <div className="flex min-h-0 flex-1">
          <Library onAdd={(k) => addPart(k)} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={wrap} className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle,rgb(26_73_175/0.16)_1px,transparent_1.2px)] bg-white" style={{ backgroundSize: `${G * view.k}px ${G * view.k}px`, backgroundPosition: `${view.x}px ${view.y}px` }} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
              <svg
                ref={svg}
                className={cn("absolute inset-0 size-full touch-none select-none", wiring ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing")}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                role="application"
                aria-label="Circuit bench. Drag parts to move them, click a pin then another pin to wire them."
              >
                <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
                  {drawOrder(c).map((p) => (
                    <g key={p.id} className={p.kind === "switch" || p.kind === "button" ? "cursor-pointer" : "cursor-move"}>
                      <PartArt p={p} r={result?.parts[p.id]} selected={sel?.kind === "part" && sel.id === p.id} />
                      <HitBox p={p} />
                    </g>
                  ))}
                  {usedHoles.map(([x, y]) => <circle key={`${x},${y}`} cx={x * G} cy={y * G} r={4.2} className="pointer-events-none fill-none stroke-tile-navy/50" strokeWidth={1.2} />)}
                  {c.wires.map((w) => <WireArt key={w.id} c={c} w={w} selected={sel?.kind === "wire" && sel.id === w.id} />)}
                  {c.wires.map((w) => {
                    const e = wireEnds(c, w);
                    return e && <path key={`hit-${w.id}`} data-wire={w.id} d={wirePath(...e)} fill="none" className="cursor-pointer stroke-transparent" strokeWidth={12} />;
                  })}
                  {pinsLayer}
                  {from && wiring && <path d={wirePath(from[0] * G, from[1] * G, wiring.x * G, wiring.y * G)} fill="none" className="pointer-events-none stroke-brand" strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />}
                </g>
              </svg>

              {!c.parts.length && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
                  <div>
                    <p className="text-[18px] font-black text-ink">Your bench is empty</p>
                    <p className="mt-1 text-[13px] text-subtle">Drag a breadboard, a battery or an Arduino from the library to start cooking.</p>
                  </div>
                </div>
              )}
              {hover && hoverInfo && (
                <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap text-white shadow-lg" style={{ left: hover.x, top: hover.y }}>
                  {hoverInfo.rowName}
                  <span className="ml-2 text-tile-yellow tabular-nums">{hoverInfo.v !== undefined ? fmt(hoverInfo.v, "V") : result ? "floating" : "run to measure"}</span>
                </div>
              )}
              {wiring && <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-tile-navy px-3 py-1.5 text-[12px] font-bold text-tile-yellow shadow-lg">Click another pin or hole to connect · Esc to cancel</p>}
              {toast && <p role="status" className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[12.5px] font-bold text-white shadow-lg">{toast} {/cart/.test(toast) && <Link href="/checkout" className="ml-1 text-tile-yellow underline">Checkout</Link>}</p>}
            </div>

            {/* Bottom panel */}
            <section aria-label="Results" className="flex shrink-0 flex-col border-t border-line bg-white">
              <div role="tablist" className="flex items-center gap-1 overflow-x-auto px-2 pt-1.5 [scrollbar-width:none]">
                {tabs.map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setTab(k); setPanelOpen(true); }} className={cn("h-8 shrink-0 rounded-t-lg px-3 text-[12px] font-bold", tab === k && panelOpen ? "bg-soft text-ink" : "text-subtle hover:text-ink")}>{l}</button>
                ))}
                <button onClick={() => setPanelOpen((o) => !o)} className="ml-auto h-8 shrink-0 px-2 text-[11.5px] font-bold text-subtle hover:text-ink">{panelOpen ? "Hide" : "Show"}</button>
              </div>
              {panelOpen && (
                <div className="h-56 overflow-y-auto bg-soft/60 p-4 [scrollbar-width:thin]">
                  {tab === "validation" && <IssueList issues={shownIssues} onSelect={(id) => setSel({ kind: "part", id })} />}
                  {tab === "measurements" && <Measurements c={c} result={result} />}
                  {tab === "waveforms" && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-ink">
                        Transient run from 0 to
                        <input type="number" min={0.001} max={60} step={0.1} value={duration} onChange={(e) => setDuration(Math.min(60, Math.max(0.001, Number(e.target.value) || 1)))} className="h-8 w-20 rounded-lg bg-white px-2 ring-1 ring-line" aria-label="Duration in seconds" /> s
                        <button onClick={() => setTr({ c, r: simulateTransient(c, duration) })} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-tile-navy px-3 text-tile-yellow"><Play className="size-3.5 fill-current" /> Run transient</button>
                        <span className="font-semibold text-subtle">Capacitors start discharged; switches keep their current position.</span>
                      </div>
                      {tr && tr.c !== c && <p className="text-[12px] font-bold text-tile-navy">The circuit changed since this run — run it again for fresh results.</p>}
                      {tr && (tr.r.ok || tr.r.traces.length ? <WaveChart tr={tr.r} /> : <IssueList issues={tr.r.issues} onSelect={(id) => setSel({ kind: "part", id })} />)}
                    </div>
                  )}
                  {tab === "parts" && <PartsList rows={bom.rows} picks={bom.picks} products={products} onAdd={addToCart} />}
                  {tab === "log" && <pre className="text-[11.5px] leading-relaxed whitespace-pre-wrap text-ink">{[...(dc?.log ?? []), ...(trFresh?.log ?? [])].join("\n") || "Run the circuit to see the solver log."}</pre>}
                  {tab === "code" && <CodePanel />}
                  {tab === "experiment" && experiment && (
                    <ExperimentPanel
                      e={experiment}
                      rows={experiment.rows}
                      observations={project.observations}
                      onRecord={record}
                      onApply={apply}
                      live={live}
                      onRun={() => setLive(true)}
                      student={project.student}
                      conclusion={project.conclusion}
                      onNotes={(patch) => projects.update(project.id, patch)}
                      onReport={report}
                      message={obsMsg}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
          <Inspector
            c={c}
            sel={sel}
            result={result}
            products={products}
            onProp={setProp}
            onRotate={rotateSel}
            onDuplicate={duplicate}
            onDelete={remove}
            onWireColor={(id, color) => dispatch({ t: "do", f: (cc) => ({ ...cc, wires: cc.wires.map((w) => (w.id === id ? { ...w, color } : w)) }) })}
            onAddProduct={(slug, qty) => addToCart([{ slug, qty }])}
            overview={<Overview c={c} experiment={experiment} />}
          />
        </div>
      </div>
    </>
  );
}

/** Invisible hit area over a part's body so it can be grabbed anywhere. */
function HitBox({ p }: { p: Part }) {
  const m = MODELS[p.kind];
  const [x, y, w, h] = m.box;
  return (
    <g transform={`translate(${p.x * G} ${p.y * G}) rotate(${p.rot * 90})`}>
      <rect data-part={p.id} x={x * G} y={y * G} width={w * G} height={h * G} className="fill-transparent" />
    </g>
  );
}

function TopBar({ name, saved, count, compact, children }: { name: string; saved: "saved" | "saving"; count: number; compact?: boolean; children?: React.ReactNode }) {
  return (
    <header className="flex h-13 shrink-0 items-center gap-1.5 bg-tile-midnight px-3 text-white">
      <Link href="/learn/lab-kitchen" className="mr-2 flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-white/10" title="Back to Lab Kitchen">
        <ArrowLeft className="size-4 text-white/70" />
        <span className="grid size-7 place-items-center rounded-lg bg-tile-yellow text-tile-navy"><FlaskConical className="size-4" /></span>
        <span className="text-[13.5px] font-black tracking-tight">Lab Kitchen</span>
      </Link>
      {compact ? <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-white/80">{name}{saved === "saving" ? " · saving" : ""}</span> : children}
      <Link href="/checkout" className="relative ml-1.5 grid size-9 place-items-center rounded-xl bg-white/10 hover:bg-white/15" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
        <ShoppingCart className="size-4" />
        {count > 0 && <span className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-tile-yellow px-1 text-[10px] font-black text-tile-navy">{count}</span>}
      </Link>
    </header>
  );
}

function Versions({ project, onRestore, onClose }: { project: Project; onRestore: (c: Circuit) => void; onClose: () => void }) {
  const [label, setLabel] = useState("");
  return (
    <div className="absolute top-10 left-0 z-30 w-80 rounded-2xl bg-white p-3 text-ink shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] ring-1 ring-line">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); projects.snapshot(project.id, label); setLabel(""); }}>
        <input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder="Name this version" aria-label="Version name" className="h-8 min-w-0 flex-1 rounded-lg bg-soft px-2.5 text-[12.5px] font-semibold ring-1 ring-line outline-none focus:ring-2 focus:ring-brand" />
        <button className="h-8 rounded-lg bg-tile-navy px-3 text-[12px] font-bold text-tile-yellow">Save</button>
      </form>
      <p className="mt-2 text-[11px] text-subtle">A saved version never changes. Restoring one replaces the bench (undo brings your work back).</p>
      <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
        {project.versions.map((v) => (
          <li key={v.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-soft">
            <span className="min-w-0 flex-1">
              <b className="block truncate text-[12.5px]">{v.label}</b>
              <span className="text-[11px] text-subtle">{new Date(v.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {v.circuit.parts.length} parts</span>
            </span>
            <button onClick={() => onRestore(v.circuit)} className="rounded-md px-2 py-1 text-[11.5px] font-bold text-brand-strong hover:bg-tile-sky/50">Restore</button>
          </li>
        ))}
        {!project.versions.length && <li className="px-2 py-3 text-[12px] text-subtle">No saved versions yet.</li>}
      </ul>
      <button onClick={onClose} className="mt-2 w-full rounded-lg py-1.5 text-[12px] font-bold text-subtle hover:bg-soft">Close</button>
    </div>
  );
}

function Overview({ c, experiment }: { c: Circuit; experiment?: ReturnType<typeof getExperiment> }) {
  return (
    <div className="space-y-5">
      {experiment ? (
        <section>
          <p className="text-[11px] font-bold text-subtle">Guided experiment · {experiment.level}</p>
          <h2 className="text-[17px] leading-tight font-black text-ink">{experiment.title}</h2>
          <p className="mt-1.5 text-[12px] leading-relaxed text-subtle">{experiment.summary}</p>
          <ol className="mt-3 space-y-2">
            {experiment.steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-snug text-ink">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-tile-yellow text-[10.5px] font-black text-tile-navy">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg bg-tile-sky/40 px-3 py-2 text-[12px] font-bold text-tile-navy">{experiment.formula}</p>
        </section>
      ) : (
        <section>
          <h2 className="text-[17px] font-black text-ink">Project bench</h2>
          <p className="mt-1 text-[12px] text-subtle">{c.parts.length} part{c.parts.length === 1 ? "" : "s"} · {c.wires.length} wire{c.wires.length === 1 ? "" : "s"}. Select a part to edit it.</p>
        </section>
      )}
      <section>
        <h3 className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">How to build</h3>
        <ul className="space-y-1.5 text-[12px] leading-snug text-ink">
          <li><b>Add</b> — drag from the library, or click a part.</li>
          <li><b>Plug in</b> — drop leads onto breadboard holes; each half-column of five is joined.</li>
          <li><b>Wire</b> — click a pin or hole, then another.</li>
          <li><b>Run</b> — values update live as you edit; click switches to flip them, hold push buttons down.</li>
          <li><b>Signals</b> — function generator and oscilloscope traces need a transient run (Waveforms tab).</li>
        </ul>
      </section>
      <section>
        <h3 className="mb-2 text-[11px] font-black tracking-wider text-subtle uppercase">Shortcuts</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11.5px]">
          {[["R", "Rotate"], ["Del", "Delete"], ["Ctrl Z / Ctrl ⇧ Z", "Undo / redo"], ["Ctrl D", "Duplicate"], ["Esc", "Cancel wire"], ["Wheel", "Zoom"], ["Drag empty space", "Pan"]].map(([k, v]) => (
            <div key={k} className="contents"><dt className="font-mono font-bold text-ink">{k}</dt><dd className="text-subtle">{v}</dd></div>
          ))}
        </dl>
      </section>
    </div>
  );
}

