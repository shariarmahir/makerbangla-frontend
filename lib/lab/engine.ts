/**
 * Makerbangla Lab Kitchen — circuit engine.
 *
 * Modified nodal analysis (MNA) with Newton–Raphson for non-linear parts (SPICE-style junction-voltage
 * limiting), backward-Euler transient with time-varying sources. Pure TypeScript with no runtime imports, so
 * `scripts/test-lab-engine.mjs` can run it in Node against hand-calculated reference values. `ENGINE` is the
 * capability record; a licensed SPICE engine (ngspice) can replace this module without touching the editor.
 *
 * Models: ideal and limited sources, resistors, LDR, Shockley diodes and LEDs (with series resistance),
 * Ebers–Moll NPN transistor, capacitors (transient), switches and push buttons, potentiometers, meters,
 * a 50 Ω function generator, a 1 MΩ two-channel oscilloscope, a breadboard and an Arduino Uno as a
 * 5 V / 3.3 V source with static pin levels. No microcontroller code is executed.
 */

export const ENGINE = {
  id: "mb-basic",
  name: "Makerbangla circuit engine",
  version: "0.2.0",
  method: "Modified nodal analysis with Newton–Raphson; backward Euler for transient",
  analyses: ["dc", "transient"],
} as const;

// ——— Circuit model ———

export type PartKind =
  | "battery" | "supply" | "fgen" | "resistor" | "capacitor" | "pot" | "ldr" | "diode" | "npn" | "led"
  | "switch" | "button" | "ammeter" | "voltmeter" | "scope" | "ground" | "breadboard" | "arduino";
export type Prop = number | string | boolean;
export type Rot = 0 | 1 | 2 | 3;
export type Part = { id: string; kind: PartKind; label: string; x: number; y: number; rot: Rot; props: Record<string, Prop> };
export type PinRef = { part: string; pin: string };
export type Wire = { id: string; a: PinRef; b: PinRef; color?: string };
export type Circuit = { parts: Part[]; wires: Wire[] };
export type Pin = { id: string; x: number; y: number };

export const KINDS: PartKind[] = ["battery", "supply", "fgen", "resistor", "capacitor", "pot", "ldr", "diode", "npn", "led", "switch", "button", "ammeter", "voltmeter", "scope", "ground", "breadboard", "arduino"];

/** Numeric props: default and allowed range. Anything outside is clamped, so stored projects can't break the solver. */
export const NUM: Partial<Record<PartKind, Record<string, [def: number, min: number, max: number]>>> = {
  battery: { v: [9, 0.1, 48], r: [0, 0, 100] },
  supply: { v: [5, 0, 30], limit: [1, 0.001, 5] },
  fgen: { freq: [1000, 0.1, 100000], vpp: [2, 0, 20], offset: [0, -10, 10] },
  resistor: { r: [1000, 0.1, 1e7], watt: [0.25, 0.125, 5] },
  capacitor: { c: [100, 0.001, 10000], vmax: [25, 1, 450] },
  pot: { r: [10000, 10, 1e6], pos: [50, 0, 100] },
  ldr: { lux: [100, 0.1, 10000] },
};

const VT = 0.025852; // thermal voltage at 27 °C

/** 5 mm LEDs: typical forward voltage at 20 mA (datasheet typical values), emission coefficient 2, 5 Ω series. */
export const LED_COLORS = { red: { vf: 2.0 }, yellow: { vf: 2.1 }, blue: { vf: 3.2 }, white: { vf: 3.2 } } as const;
export type LedColor = keyof typeof LED_COLORS;
export const LED = { n: 2, rs: 5, imax: 0.02, iabs: 0.03, vrev: 5 } as const;
const ledIs = (c: LedColor) => LED.imax / Math.exp((LED_COLORS[c].vf - LED.imax * LED.rs) / (LED.n * VT));

/** 1N4007 rectifier — widely published SPICE parameters. */
export const D1N4007 = { is: 7.03e-9, n: 1.81, rs: 0.034, imax: 1, vrrm: 1000 } as const;
/** BC547B small-signal NPN — typical SPICE parameters (no Early effect). */
export const BC547 = { is: 2.39e-14, bf: 294, br: 7.95, icmax: 0.1, vceo: 45, pmax: 0.5 } as const;
/** GL55-series light-dependent resistor: R = R10 · (lux / 10)^−γ, limited by its dark resistance. */
export const LDR_MODEL = { r10: 15000, gamma: 0.6, rdark: 1e6, rmin: 100 } as const;
const FG_R = 50; // function generator output impedance
const SCOPE_R = 1e6; // oscilloscope input impedance

export const ARDUINO_IO = ["D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12", "D13", "A0", "A1", "A2", "A3", "A4", "A5"] as const;
export const ARDUINO_UNMODELED = ["AREF", "IOREF", "RESET", "VIN"];
export const PIN_LEVELS = ["Z", "HIGH", "LOW"] as const;
export const WAVES = ["sine", "square", "triangle"] as const;
const IO_R = 25; // approximate ATmega328P output resistance (Ω)

export function num(p: Part, key: string): number {
  const spec = NUM[p.kind]?.[key];
  if (!spec) return 0;
  const v = Number(p.props[key]);
  return Number.isFinite(v) ? Math.min(spec[2], Math.max(spec[1], v)) : spec[0];
}
export const ledColor = (p: Part): LedColor => (String(p.props.color) in LED_COLORS ? (String(p.props.color) as LedColor) : "red");
/** Switch: closed unless explicitly false/0. Push button: open unless pressed. */
export const switchClosed = (p: Part) => (p.kind === "button" ? p.props.pressed === true || p.props.pressed === 1 : p.props.closed !== false && p.props.closed !== 0);
export const pinLevel = (p: Part, pin: string) => ((PIN_LEVELS as readonly string[]).includes(String(p.props[pin])) ? (String(p.props[pin]) as (typeof PIN_LEVELS)[number]) : "Z");
export const waveOf = (p: Part) => ((WAVES as readonly string[]).includes(String(p.props.wave)) ? (String(p.props.wave) as (typeof WAVES)[number]) : "sine");
export const ldrOhms = (lux: number) => Math.min(LDR_MODEL.rdark, Math.max(LDR_MODEL.rmin, LDR_MODEL.r10 * (lux / 10) ** -LDR_MODEL.gamma));

/** Function generator output voltage at time t (open circuit). */
export function fgenVolts(p: Part, t: number): number {
  const f = num(p, "freq"), a = num(p, "vpp") / 2, off = num(p, "offset");
  const ph = (t * f) % 1;
  switch (waveOf(p)) {
    case "square": return off + (ph < 0.5 ? a : -a);
    case "triangle": return off + a * (ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph);
    default: return off + a * Math.sin(2 * Math.PI * ph);
  }
}

// ——— Geometry (grid units) ———

export const BB_COLS = 30;
export const BB_ROWS: [string, number][] = [["T-", 0], ["T+", 1], ["a", 3], ["b", 4], ["c", 5], ["d", 6], ["e", 7], ["f", 9], ["g", 10], ["h", 11], ["i", 12], ["j", 13], ["B+", 15], ["B-", 16]];

const ARDUINO_TOP = ["AREF", "GND1", "D13", "D12", "D11", "D10", "D9", "D8", "", "D7", "D6", "D5", "D4", "D3", "D2", "D1", "D0"];
const ARDUINO_BOTTOM = ["", "", "IOREF", "RESET", "3V3", "5V", "GND2", "GND3", "VIN", "", "A0", "A1", "A2", "A3", "A4", "A5"];

const two = (a: string, b: string, gap: number): Pin[] => [{ id: a, x: 0, y: 0 }, { id: b, x: gap, y: 0 }];

function buildPins(kind: PartKind): Pin[] {
  switch (kind) {
    case "battery": return two("+", "-", 2);
    case "supply":
    case "fgen": return [{ id: "-", x: 1, y: 0 }, { id: "+", x: 3, y: 0 }];
    case "resistor": return two("1", "2", 4);
    case "diode": return two("A", "K", 4);
    case "led": return two("A", "K", 1);
    case "capacitor": return two("+", "-", 1);
    case "switch":
    case "button":
    case "ldr": return two("1", "2", 2);
    case "pot": return [{ id: "A", x: 0, y: 0 }, { id: "W", x: 1, y: 0 }, { id: "B", x: 2, y: 0 }];
    case "npn": return [{ id: "C", x: 0, y: 0 }, { id: "B", x: 1, y: 0 }, { id: "E", x: 2, y: 0 }];
    case "ammeter":
    case "voltmeter": return two("+", "COM", 2);
    case "scope": return [{ id: "CH1", x: 0, y: 0 }, { id: "CH2", x: 2, y: 0 }, { id: "GND", x: 4, y: 0 }];
    case "ground": return [{ id: "G", x: 0, y: 0 }];
    case "breadboard": return BB_ROWS.flatMap(([row, y]) => Array.from({ length: BB_COLS }, (_, c) => ({ id: `${row}${c + 1}`, x: c, y })));
    case "arduino":
      return [
        ...ARDUINO_TOP.flatMap((id, x) => (id ? [{ id, x, y: 0 }] : [])),
        ...ARDUINO_BOTTOM.flatMap((id, x) => (id ? [{ id, x, y: 9 }] : [])),
      ];
  }
}
const pinCache = new Map<PartKind, Pin[]>();
export function pinsOf(kind: PartKind): Pin[] {
  let p = pinCache.get(kind);
  if (!p) pinCache.set(kind, (p = buildPins(kind)));
  return p;
}

/** Pins that are wired together inside a part (breadboard strips and rails, the Uno's GND pins). */
function internalLinks(kind: PartKind): string[][] {
  if (kind === "arduino") return [["GND1", "GND2", "GND3"]];
  if (kind !== "breadboard") return [];
  const cols = Array.from({ length: BB_COLS }, (_, c) => c + 1);
  return [
    ...cols.map((c) => ["a", "b", "c", "d", "e"].map((r) => `${r}${c}`)),
    ...cols.map((c) => ["f", "g", "h", "i", "j"].map((r) => `${r}${c}`)),
    ...["T-", "T+", "B+", "B-"].map((r) => cols.map((c) => `${r}${c}`)),
  ];
}

export function rotate(x: number, y: number, rot: Rot): [number, number] {
  switch (rot) {
    case 1: return [-y, x];
    case 2: return [-x, -y];
    case 3: return [y, -x];
    default: return [x, y];
  }
}
export function pinPos(part: Part, pin: Pin): [number, number] {
  const [dx, dy] = rotate(pin.x, pin.y, part.rot);
  return [part.x + dx, part.y + dy];
}
export const pinKey = (part: string, pin: string) => `${part}:${pin}`;

// ——— Connectivity ———

export type Netlist = { netOf: Map<string, number>; count: number; pos: Map<string, [number, number]>; members: string[][] };

/** Pins are connected by wires, by sharing a grid point (a lead pushed into a breadboard hole) and by internal links. */
export function connect(c: Circuit): Netlist {
  const keys: string[] = [];
  const index = new Map<string, number>();
  const pos = new Map<string, [number, number]>();
  for (const part of c.parts) for (const pin of pinsOf(part.kind)) {
    const k = pinKey(part.id, pin.id);
    index.set(k, keys.length);
    keys.push(k);
    pos.set(k, pinPos(part, pin));
  }
  const parent = keys.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const join = (a?: number, b?: number) => {
    if (a === undefined || b === undefined) return;
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  const atPoint = new Map<string, number>();
  for (const [k, [x, y]] of pos) {
    const pk = `${x},${y}`;
    const first = atPoint.get(pk);
    if (first === undefined) atPoint.set(pk, index.get(k)!);
    else join(first, index.get(k));
  }
  for (const w of c.wires) join(index.get(pinKey(w.a.part, w.a.pin)), index.get(pinKey(w.b.part, w.b.pin)));
  for (const part of c.parts) for (const group of internalLinks(part.kind)) for (let i = 1; i < group.length; i++) join(index.get(pinKey(part.id, group[0])), index.get(pinKey(part.id, group[i])));

  const netOf = new Map<string, number>();
  const ids = new Map<number, number>();
  const members: string[][] = [];
  keys.forEach((k, i) => {
    const root = find(i);
    let id = ids.get(root);
    if (id === undefined) {
      ids.set(root, (id = members.length));
      members.push([]);
    }
    netOf.set(k, id);
    members[id].push(k);
  });
  return { netOf, count: members.length, pos, members };
}

// ——— Validation (deterministic, before solving) ———

export type Issue = { level: "error" | "warning" | "info"; message: string; parts: string[] };

const SOURCES: PartKind[] = ["battery", "supply", "fgen", "arduino"];

export function validate(c: Circuit, nl = connect(c)): Issue[] {
  const issues: Issue[] = [];
  if (!c.parts.length) return [{ level: "error", message: "The bench is empty — add parts from the library.", parts: [] }];
  if (!c.parts.some((p) => SOURCES.includes(p.kind))) issues.push({ level: "error", message: "No power source — add a battery, a bench supply, a function generator or an Arduino Uno.", parts: [] });

  const byId = new Map(c.parts.map((p) => [p.id, p]));
  const partOfKey = (k: string) => byId.get(k.slice(0, k.indexOf(":")));
  const peers = (k: string) => nl.members[nl.netOf.get(k)!].filter((m) => m !== k && partOfKey(m)?.kind !== "breadboard");
  const net = (p: Part, pin: string) => nl.netOf.get(pinKey(p.id, pin));

  for (const p of c.parts) {
    if (p.kind === "breadboard") continue;
    if (p.kind === "arduino") {
      for (const io of ARDUINO_IO) if (peers(pinKey(p.id, io)).length && pinLevel(p, io) === "Z")
        issues.push({ level: "info", message: `${p.label} ${io} is wired but not driven — code simulation is unavailable, so set a static level (HIGH/LOW) in the inspector.`, parts: [p.id] });
      for (const pin of ARDUINO_UNMODELED) if (peers(pinKey(p.id, pin)).length) issues.push({ level: "info", message: `${p.label} ${pin} is not modelled by this engine and carries no current here.`, parts: [p.id] });
      if (net(p, "5V") === net(p, "GND1") || net(p, "3V3") === net(p, "GND1")) issues.push({ level: "error", message: `${p.label}: a supply pin is wired straight to GND — short circuit.`, parts: [p.id] });
      continue;
    }
    const pins = pinsOf(p.kind);
    // An oscilloscope may use one channel; a potentiometer's wiper may be left open.
    const optional = p.kind === "scope" ? ["CH1", "CH2"] : p.kind === "pot" ? ["W"] : [];
    const loose = pins.filter((pin) => !peers(pinKey(p.id, pin.id)).length);
    const required = loose.filter((pin) => !optional.includes(pin.id));
    if (p.kind === "scope" && loose.length >= 2 && loose.some((x) => x.id === "CH1") && loose.some((x) => x.id === "CH2")) issues.push({ level: "warning", message: `${p.label}: no channel connected.`, parts: [p.id] });
    else if (required.length) issues.push({ level: "warning", message: `${p.label}: ${loose.length === pins.length ? "not connected to anything" : `pin ${required.map((l) => l.id).join(", ")} is not connected`}.`, parts: [p.id] });
    if (pins.length === 2 && !loose.length && net(p, pins[0].id) === net(p, pins[1].id)) {
      if (p.kind === "battery" || p.kind === "supply" || p.kind === "fgen") issues.push({ level: "error", message: `${p.label}: its + and − terminals are connected together — short circuit.`, parts: [p.id] });
      else if (p.kind !== "ammeter") issues.push({ level: "warning", message: `${p.label} is shorted out: both leads are on the same node (same breadboard column?).`, parts: [p.id] });
    }
    if (p.kind === "fgen") issues.push({ level: "info", message: `${p.label}: a DC run holds the generator at its ${fmt(num(p, "offset"), "V")} offset — run a transient analysis to see the waveform.`, parts: [p.id] });
  }
  return issues;
}

// ——— Elements ———

type El =
  | { t: "R"; a: number; b: number; r: number }
  | { t: "V"; p: number; n: number; v: number; tag: string; fg?: Part }
  | { t: "PS"; p: number; n: number; v: number; limit: number; tag: string }
  | { t: "C"; a: number; b: number; c: number; tag: string }
  | { t: "D"; a: number; k: number; is: number; n: number; tag: string }
  | { t: "Q"; c: number; b: number; e: number; tag: string };

type Compiled = { els: El[]; nodes: number; refNets: Set<number>; partNodes: Map<string, Record<string, number>> };

const GMIN = 1e-12;
const R_SWITCH = 1e-3;
const R_VOLTMETER = 10e6;

const terminals = (e: El): number[] => (e.t === "V" || e.t === "PS" ? [e.p, e.n] : e.t === "D" ? [e.a, e.k] : e.t === "Q" ? [e.c, e.b, e.e] : [e.a, e.b]);

/** Turns parts into primitive elements on net ids; nets that only hold breadboard holes are left out. */
function compile(c: Circuit, nl: Netlist): Compiled {
  let next = nl.count; // internal nodes are numbered after the nets
  const els: El[] = [];
  const grounds = new Set<number>();
  const negatives: number[] = [];
  const partNodes = new Map<string, Record<string, number>>();
  const n = (p: Part, pin: string) => nl.netOf.get(pinKey(p.id, pin))!;
  /** A junction with series resistance: anode → Rs → internal node → junction → cathode. */
  const diode = (p: Part, nodes: Record<string, number>, is: number, nn: number, rs: number) => {
    const m = next++;
    nodes._m = m;
    els.push({ t: "R", a: n(p, "A"), b: m, r: rs }, { t: "D", a: m, k: n(p, "K"), is, n: nn, tag: p.id });
  };

  for (const p of c.parts) {
    const nodes: Record<string, number> = {};
    for (const pin of pinsOf(p.kind)) if (p.kind !== "breadboard") nodes[pin.id] = n(p, pin.id);
    partNodes.set(p.id, nodes);
    switch (p.kind) {
      case "battery": {
        const r = num(p, "r");
        if (r > 0) {
          const m = next++;
          nodes._m = m;
          els.push({ t: "V", p: m, n: n(p, "-"), v: num(p, "v"), tag: p.id }, { t: "R", a: m, b: n(p, "+"), r });
        } else els.push({ t: "V", p: n(p, "+"), n: n(p, "-"), v: num(p, "v"), tag: p.id });
        negatives.push(n(p, "-"));
        break;
      }
      case "supply":
        els.push({ t: "PS", p: n(p, "+"), n: n(p, "-"), v: num(p, "v"), limit: num(p, "limit"), tag: p.id });
        negatives.push(n(p, "-"));
        break;
      case "fgen": {
        const m = next++;
        nodes._m = m;
        els.push({ t: "V", p: m, n: n(p, "-"), v: num(p, "offset"), tag: p.id, fg: p }, { t: "R", a: m, b: n(p, "+"), r: FG_R });
        negatives.push(n(p, "-"));
        break;
      }
      case "resistor":
        els.push({ t: "R", a: n(p, "1"), b: n(p, "2"), r: num(p, "r") });
        break;
      case "ldr":
        els.push({ t: "R", a: n(p, "1"), b: n(p, "2"), r: ldrOhms(num(p, "lux")) });
        break;
      case "pot": {
        const r = num(p, "r"), w = num(p, "pos") / 100;
        els.push({ t: "R", a: n(p, "A"), b: n(p, "W"), r: Math.max(r * w, 0.01) }, { t: "R", a: n(p, "W"), b: n(p, "B"), r: Math.max(r * (1 - w), 0.01) });
        break;
      }
      case "switch":
      case "button":
        if (switchClosed(p)) els.push({ t: "R", a: n(p, "1"), b: n(p, "2"), r: R_SWITCH });
        break;
      case "led":
        diode(p, nodes, ledIs(ledColor(p)), LED.n, LED.rs);
        break;
      case "diode":
        diode(p, nodes, D1N4007.is, D1N4007.n, D1N4007.rs);
        break;
      case "npn":
        els.push({ t: "Q", c: n(p, "C"), b: n(p, "B"), e: n(p, "E"), tag: p.id });
        break;
      case "capacitor":
        els.push({ t: "C", a: n(p, "+"), b: n(p, "-"), c: num(p, "c") * 1e-6, tag: p.id });
        break;
      case "ammeter":
        els.push({ t: "V", p: n(p, "+"), n: n(p, "COM"), v: 0, tag: p.id });
        break;
      case "voltmeter":
        els.push({ t: "R", a: n(p, "+"), b: n(p, "COM"), r: R_VOLTMETER });
        break;
      case "scope":
        els.push({ t: "R", a: n(p, "CH1"), b: n(p, "GND"), r: SCOPE_R }, { t: "R", a: n(p, "CH2"), b: n(p, "GND"), r: SCOPE_R });
        break;
      case "ground":
        grounds.add(n(p, "G"));
        break;
      case "arduino": {
        const gnd = n(p, "GND1");
        els.push({ t: "V", p: n(p, "5V"), n: gnd, v: 5, tag: `${p.id}:5V` }, { t: "V", p: n(p, "3V3"), n: gnd, v: 3.3, tag: `${p.id}:3V3` });
        for (const io of ARDUINO_IO) {
          const level = pinLevel(p, io);
          if (level === "HIGH") {
            const m = next++;
            nodes[`_${io}`] = m;
            els.push({ t: "V", p: m, n: gnd, v: 5, tag: `${p.id}:${io}` }, { t: "R", a: m, b: n(p, io), r: IO_R });
          } else if (level === "LOW") els.push({ t: "R", a: n(p, io), b: gnd, r: IO_R });
        }
        negatives.push(gnd);
        break;
      }
    }
  }

  // Reference node per connected island: every ground symbol is 0 V; an island without one is measured from
  // its source's negative terminal (as a student would clip the black probe there).
  const parent = new Map<number, number>();
  const find = (x: number): number => {
    let r = x;
    while (parent.has(r) && parent.get(r) !== r) r = parent.get(r)!;
    parent.set(x, r);
    return r;
  };
  const join = (a: number, b: number) => {
    if (!parent.has(a)) parent.set(a, a);
    if (!parent.has(b)) parent.set(b, b);
    parent.set(find(a), find(b));
  };
  for (const e of els) {
    const ts = terminals(e);
    for (let i = 1; i < ts.length; i++) join(ts[0], ts[i]);
  }
  for (const g of grounds) if (!parent.has(g)) parent.set(g, g);
  const refNets = new Set<number>(grounds);
  const islands = new Map<number, number[]>();
  for (const x of parent.keys()) {
    const r = find(x);
    islands.set(r, [...(islands.get(r) ?? []), x]);
  }
  for (const nodes of islands.values()) {
    if (nodes.some((x) => grounds.has(x))) continue;
    refNets.add(negatives.find((x) => nodes.includes(x)) ?? Math.min(...nodes));
  }
  return { els, nodes: next, refNets, partNodes };
}

// ——— Device equations ———

const MAXEXP = 80;
function expLin(x: number): [number, number] {
  if (x > MAXEXP) {
    const e = Math.exp(MAXEXP);
    return [e * (1 + x - MAXEXP), e];
  }
  const e = Math.exp(x);
  return [e, e];
}
/** Junction current and conductance. */
function junction(v: number, is: number, nvt: number): [i: number, g: number] {
  const [e, de] = expLin(v / nvt);
  return [is * (e - 1), (is * de) / nvt + GMIN];
}
/** SPICE pnjlim: keeps Newton steps on an exponential junction from overshooting. */
function pnjlim(vnew: number, vold: number, nvt: number, vcrit: number): number {
  if (vnew > vcrit && Math.abs(vnew - vold) > 2 * nvt) {
    if (vold > 0) {
      const arg = 1 + (vnew - vold) / nvt;
      return arg > 0 ? vold + nvt * Math.log(arg) : vcrit;
    }
    return nvt * Math.log(vnew / nvt);
  }
  return vnew;
}
const vcrit = (is: number, nvt: number) => nvt * Math.log(nvt / (Math.SQRT2 * is));

/** Ebers–Moll (transport) currents into the collector and base. */
function bjt(vbe: number, vbc: number) {
  const [iF, gF] = junction(vbe, BC547.is, VT);
  const [iR, gR] = junction(vbc, BC547.is, VT);
  const ic = iF - iR * (1 + 1 / BC547.br);
  const ib = iF / BC547.bf + iR / BC547.br;
  return { ic, ib, dIcVbe: gF, dIcVbc: -gR * (1 + 1 / BC547.br), dIbVbe: gF / BC547.bf, dIbVbc: gR / BC547.br };
}

// ——— Solver ———

class Singular extends Error {}
class NoConvergence extends Error {}

function solveLinear(A: Float64Array, z: Float64Array, n: number): Float64Array {
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r * n + col]) > Math.abs(A[piv * n + col])) piv = r;
    if (Math.abs(A[piv * n + col]) < 1e-14) throw new Singular();
    if (piv !== col) {
      for (let k = 0; k < n; k++) {
        const t = A[col * n + k];
        A[col * n + k] = A[piv * n + k];
        A[piv * n + k] = t;
      }
      const t = z[col];
      z[col] = z[piv];
      z[piv] = t;
    }
    const d = A[col * n + col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r * n + col] / d;
      if (!f) continue;
      for (let k = col; k < n; k++) A[r * n + k] -= f * A[col * n + k];
      z[r] -= f * z[col];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = z[r];
    for (let k = r + 1; k < n; k++) s -= A[r * n + k] * x[k];
    x[r] = s / A[r * n + r];
  }
  return x;
}

type CapMode = { kind: "dc" } | { kind: "init"; v: Map<string, number> } | { kind: "step"; dt: number; v: Map<string, number> };
/** Newton state carried between solves (junction voltages, supply modes) so transient steps start close. */
type NLState = { vd: Map<string, number>; vq: Map<string, [number, number]>; cc: Set<string> };
const newState = (): NLState => ({ vd: new Map(), vq: new Map(), cc: new Set() });
type Solution = { V: (net: number) => number; branch: Map<string, number>; iterations: number; state: NLState };

function solveCircuit(cp: Compiled, caps: CapMode, t: number, state: NLState): Solution {
  const index = new Map<number, number>();
  for (const e of cp.els) for (const x of terminals(e)) if (!cp.refNets.has(x) && !index.has(x)) index.set(x, index.size);
  const N = index.size;
  const at = (x: number) => (cp.refNets.has(x) ? -1 : (index.get(x) ?? -1));

  for (let iter = 1; iter <= 200; iter++) {
    const sources: string[] = [];
    for (const e of cp.els) {
      if (e.t === "V") sources.push(e.tag);
      else if (e.t === "PS" && !state.cc.has(e.tag)) sources.push(e.tag);
      else if (e.t === "C" && caps.kind === "init") sources.push(`cap:${e.tag}`);
    }
    const size = N + sources.length;
    const A = new Float64Array(size * size);
    const z = new Float64Array(size);
    const add = (r: number, c: number, v: number) => { if (r >= 0 && c >= 0) A[r * size + c] += v; };
    const g = (a: number, b: number, val: number) => { add(a, a, val); add(b, b, val); add(a, b, -val); add(b, a, -val); };
    const vs = (p: number, n: number, k: number, v: number) => {
      const row = N + k;
      if (p >= 0) { A[p * size + row] += 1; A[row * size + p] += 1; }
      if (n >= 0) { A[n * size + row] -= 1; A[row * size + n] -= 1; }
      z[row] += v;
    };
    /** Current `i` flowing out of node a into node b through a source. */
    const cs = (a: number, b: number, i: number) => { if (a >= 0) z[a] -= i; if (b >= 0) z[b] += i; };
    for (let i = 0; i < N; i++) A[i * size + i] += GMIN;

    let k = 0;
    for (const e of cp.els) {
      switch (e.t) {
        case "R": g(at(e.a), at(e.b), 1 / e.r); break;
        case "V": vs(at(e.p), at(e.n), k++, e.fg && caps.kind !== "dc" ? fgenVolts(e.fg, t) : e.v); break;
        case "PS":
          if (state.cc.has(e.tag)) cs(at(e.n), at(e.p), e.limit); // constant-current: pushes `limit` out of +
          else vs(at(e.p), at(e.n), k++, e.v);
          break;
        case "C":
          if (caps.kind === "init") vs(at(e.a), at(e.b), k++, caps.v.get(e.tag) ?? 0);
          else if (caps.kind === "step") {
            const geq = e.c / caps.dt, v0 = caps.v.get(e.tag) ?? 0;
            g(at(e.a), at(e.b), geq);
            cs(at(e.b), at(e.a), geq * v0);
          }
          break;
        case "D": {
          const vd = state.vd.get(e.tag) ?? 0;
          const [i, gd] = junction(vd, e.is, e.n * VT);
          g(at(e.a), at(e.k), gd);
          cs(at(e.a), at(e.k), i - gd * vd);
          break;
        }
        case "Q": {
          const [vbe, vbc] = state.vq.get(e.tag) ?? [0, 0];
          const d = bjt(vbe, vbc);
          const C = at(e.c), B = at(e.b), E = at(e.e);
          // I_x ≈ a·Vbe + b·Vbc + J, with Vbe = Vb − Ve and Vbc = Vb − Vc; current flows into C and B, out of E.
          const rows: [number, number, number, number][] = [
            [C, d.dIcVbe, d.dIcVbc, d.ic - d.dIcVbe * vbe - d.dIcVbc * vbc],
            [B, d.dIbVbe, d.dIbVbc, d.ib - d.dIbVbe * vbe - d.dIbVbc * vbc],
          ];
          rows.push([E, -(rows[0][1] + rows[1][1]), -(rows[0][2] + rows[1][2]), -(rows[0][3] + rows[1][3])]);
          for (const [row, a, b, J] of rows) {
            add(row, B, a + b);
            add(row, E, -a);
            add(row, C, -b);
            if (row >= 0) z[row] -= J;
          }
          g(B, E, GMIN);
          g(B, C, GMIN);
          break;
        }
      }
    }

    const x = solveLinear(A, z, size);
    const V = (net: number) => (cp.refNets.has(net) ? 0 : index.has(net) ? x[index.get(net)!] : NaN);
    const branch = new Map<string, number>();
    sources.forEach((tag, i) => branch.set(tag, x[N + i]));

    // Newton update with junction limiting; converged when no junction moves more than 1 µV.
    let moved = 0;
    for (const e of cp.els) {
      if (e.t === "D") {
        const nvt = e.n * VT, old = state.vd.get(e.tag) ?? 0;
        const nv = pnjlim(V(e.a) - V(e.k), old, nvt, vcrit(e.is, nvt));
        moved = Math.max(moved, Math.abs(nv - old));
        state.vd.set(e.tag, nv);
      } else if (e.t === "Q") {
        const [ob, oc] = state.vq.get(e.tag) ?? [0, 0];
        const vc = vcrit(BC547.is, VT);
        const nb = pnjlim(V(e.b) - V(e.e), ob, VT, vc), nc = pnjlim(V(e.b) - V(e.c), oc, VT, vc);
        moved = Math.max(moved, Math.abs(nb - ob), Math.abs(nc - oc));
        state.vq.set(e.tag, [nb, nc]);
      }
    }
    // Bench supply: constant voltage until the current limit, then constant current.
    let modeChanged = false;
    for (const e of cp.els) if (e.t === "PS") {
      if (!state.cc.has(e.tag) && -(branch.get(e.tag) ?? 0) > e.limit * (1 + 1e-9)) { state.cc.add(e.tag); modeChanged = true; }
      else if (state.cc.has(e.tag) && V(e.p) - V(e.n) > e.v * (1 + 1e-9)) { state.cc.delete(e.tag); modeChanged = true; }
    }
    if (moved < 1e-7 && !modeChanged) {
      for (const e of cp.els) if (e.t === "PS" && state.cc.has(e.tag)) branch.set(e.tag, -e.limit);
      return { V, branch, iterations: iter, state };
    }
  }
  throw new NoConvergence();
}

// ——— Results ———

export type PartResult = { v: number; i: number; p: number; reading?: number; unit?: "A" | "V"; on?: boolean; glow?: number; mode?: string; pins?: Record<string, number> };
export type DcResult = { ok: boolean; issues: Issue[]; parts: Record<string, PartResult>; pinV: Record<string, number>; log: string[] };

function measure(c: Circuit, cp: Compiled, nl: Netlist, s: Solution, capCurrent: Map<string, number> | null): Pick<DcResult, "parts" | "pinV" | "issues"> {
  const parts: Record<string, PartResult> = {};
  const issues: Issue[] = [];
  const node = (p: Part, pin: string) => cp.partNodes.get(p.id)![pin];
  const nodeV = (p: Part, pin: string) => s.V(node(p, pin));

  for (const p of c.parts) {
    const dv = (a: string, b: string) => (nodeV(p, a) || 0) - (nodeV(p, b) || 0);
    switch (p.kind) {
      case "resistor":
      case "ldr": {
        const v = dv("1", "2"), r = p.kind === "ldr" ? ldrOhms(num(p, "lux")) : num(p, "r"), i = v / r, pw = v * i;
        parts[p.id] = { v, i, p: pw, mode: p.kind === "ldr" ? fmt(r, "Ω") : undefined };
        if (p.kind === "resistor") {
          const watt = num(p, "watt");
          if (pw > 2 * watt) issues.push({ level: "error", message: `${p.label} dissipates ${fmt(pw, "W")} — far over its ${fmt(watt, "W")} rating, it would burn.`, parts: [p.id] });
          else if (pw > watt) issues.push({ level: "warning", message: `${p.label} dissipates ${fmt(pw, "W")}, above its ${fmt(watt, "W")} rating — it will run hot.`, parts: [p.id] });
        } else if (pw > 0.1) issues.push({ level: "warning", message: `${p.label} dissipates ${fmt(pw, "W")} — LDRs are rated around 100 mW.`, parts: [p.id] });
        break;
      }
      case "pot": {
        const r = num(p, "r"), w = num(p, "pos") / 100;
        const i1 = dv("A", "W") / Math.max(r * w, 0.01), i2 = dv("W", "B") / Math.max(r * (1 - w), 0.01);
        parts[p.id] = { v: dv("A", "B"), i: i1, p: dv("A", "W") * i1 + dv("W", "B") * i2, pins: { W: nodeV(p, "W") } };
        break;
      }
      case "battery":
      case "supply":
      case "fgen": {
        const v = dv("+", "-"), i = -(s.branch.get(p.id) ?? 0);
        const cc = p.kind === "supply" && s.state.cc.has(p.id);
        parts[p.id] = { v, i, p: v * i, mode: p.kind === "supply" ? (cc ? "CC" : "CV") : undefined };
        if (p.kind === "battery" && Math.abs(i) > 2) issues.push({ level: "error", message: `${p.label} would have to deliver ${fmt(Math.abs(i), "A")} — short circuit or far too little resistance.`, parts: [p.id] });
        if (cc) issues.push({ level: "warning", message: `${p.label} is current-limiting at ${fmt(num(p, "limit"), "A")} (CC mode): the output has dropped to ${fmt(v, "V")}. Too little resistance on the output?`, parts: [p.id] });
        if (p.kind === "fgen" && Math.abs(i) > 0.2) issues.push({ level: "warning", message: `${p.label} is driving ${fmt(Math.abs(i), "A")} — far more than a signal generator delivers.`, parts: [p.id] });
        if (p.kind !== "fgen" && i < -1e-6) issues.push({ level: "warning", message: `${p.label} is being driven backwards (current flows into its + terminal).`, parts: [p.id] });
        break;
      }
      case "led":
      case "diode": {
        const v = dv("A", "K");
        const nvt = (p.kind === "led" ? LED.n : D1N4007.n) * VT;
        const [i] = junction(s.state.vd.get(p.id) ?? 0, p.kind === "led" ? ledIs(ledColor(p)) : D1N4007.is, nvt);
        const on = i > (p.kind === "led" ? 1e-4 : 1e-6);
        parts[p.id] = { v, i, p: v * i, on, glow: p.kind === "led" ? Math.max(0, Math.min(1, i / LED.imax)) : undefined };
        if (p.kind === "led") {
          if (i > LED.iabs) issues.push({ level: "error", message: `${p.label} carries ${fmt(i, "A")} — above its ${fmt(LED.iabs, "A")} absolute maximum, it would burn out. Add or increase the series resistor.`, parts: [p.id] });
          else if (i > LED.imax * 1.001) issues.push({ level: "warning", message: `${p.label} carries ${fmt(i, "A")}, above the ${fmt(LED.imax, "A")} continuous rating.`, parts: [p.id] });
          if (v < -LED.vrev) issues.push({ level: "warning", message: `${p.label} is reverse-biased by ${fmt(-v, "V")} (max ${LED.vrev} V) — reverse breakdown isn't modelled.`, parts: [p.id] });
        } else {
          if (i > D1N4007.imax) issues.push({ level: "error", message: `${p.label} carries ${fmt(i, "A")} — above the 1N4007's 1 A rating.`, parts: [p.id] });
          if (v < -D1N4007.vrrm) issues.push({ level: "error", message: `${p.label} is reverse-biased beyond 1000 V.`, parts: [p.id] });
        }
        break;
      }
      case "npn": {
        const [vbe, vbc] = s.state.vq.get(p.id) ?? [0, 0];
        const d = bjt(vbe, vbc);
        const vce = dv("C", "E");
        const region = d.ic < 1e-7 ? "cut-off" : vbc > 0.4 ? "saturation" : "active";
        const pw = vce * d.ic + dv("B", "E") * d.ib;
        parts[p.id] = { v: vce, i: d.ic, p: pw, mode: region, pins: { Ib: d.ib, Vbe: dv("B", "E") } };
        if (d.ic > BC547.icmax) issues.push({ level: "error", message: `${p.label} collector current ${fmt(d.ic, "A")} exceeds the BC547's 100 mA maximum.`, parts: [p.id] });
        if (pw > BC547.pmax) issues.push({ level: "warning", message: `${p.label} dissipates ${fmt(pw, "W")}, above the BC547's 500 mW rating.`, parts: [p.id] });
        if (vce > BC547.vceo) issues.push({ level: "warning", message: `${p.label} has ${fmt(vce, "V")} across C–E, above its 45 V rating.`, parts: [p.id] });
        break;
      }
      case "capacitor": {
        const v = dv("+", "-"), i = capCurrent?.get(p.id) ?? 0;
        parts[p.id] = { v, i, p: v * i };
        if (Math.abs(v) > num(p, "vmax")) issues.push({ level: "warning", message: `${p.label} sees ${fmt(Math.abs(v), "V")}, above its ${fmt(num(p, "vmax"), "V")} rating.`, parts: [p.id] });
        if (v < -0.5) issues.push({ level: "warning", message: `${p.label} is electrolytic and connected the wrong way round (reverse polarity).`, parts: [p.id] });
        break;
      }
      case "switch":
      case "button": {
        const v = dv("1", "2"), closed = switchClosed(p);
        parts[p.id] = { v, i: closed ? v / R_SWITCH : 0, p: 0, on: closed };
        break;
      }
      case "ammeter": {
        const i = s.branch.get(p.id) ?? 0;
        parts[p.id] = { v: 0, i, p: 0, reading: i, unit: "A" };
        break;
      }
      case "voltmeter": {
        const v = dv("+", "COM");
        parts[p.id] = { v, i: v / R_VOLTMETER, p: 0, reading: v, unit: "V" };
        break;
      }
      case "scope":
        parts[p.id] = { v: 0, i: 0, p: 0, pins: { CH1: dv("CH1", "GND"), CH2: dv("CH2", "GND") } };
        break;
      case "arduino": {
        const i5 = -(s.branch.get(`${p.id}:5V`) ?? 0), i3 = -(s.branch.get(`${p.id}:3V3`) ?? 0);
        const pins: Record<string, number> = { "5V": i5, "3V3": i3 };
        if (i5 > 0.5) issues.push({ level: "error", message: `${p.label} 5V pin would supply ${fmt(i5, "A")} — more than USB's 500 mA. Short circuit?`, parts: [p.id] });
        if (i3 > 0.15) issues.push({ level: "error", message: `${p.label} 3V3 pin would supply ${fmt(i3, "A")} — above its 150 mA limit.`, parts: [p.id] });
        for (const io of ARDUINO_IO) {
          const level = pinLevel(p, io);
          if (level === "Z") continue;
          const vPin = nodeV(p, io) || 0;
          const i = level === "HIGH" ? (s.V(node(p, `_${io}`)) - vPin) / IO_R : -vPin / IO_R;
          pins[io] = i;
          if (Math.abs(i) > 0.04) issues.push({ level: "error", message: `${p.label} ${io} would carry ${fmt(Math.abs(i), "A")} — above the 40 mA absolute maximum; the pin would be damaged.`, parts: [p.id] });
          else if (Math.abs(i) > 0.02) issues.push({ level: "warning", message: `${p.label} ${io} carries ${fmt(Math.abs(i), "A")}, above the recommended 20 mA.`, parts: [p.id] });
        }
        parts[p.id] = { v: 5, i: i5, p: 5 * i5 + 3.3 * i3, pins };
        break;
      }
      default:
        parts[p.id] = { v: 0, i: 0, p: 0 };
    }
  }

  // Voltage at every pin whose net is part of a solved island (breadboard holes included, for hover readouts).
  const pinV: Record<string, number> = {};
  const solved = new Set<number>();
  for (const e of cp.els) for (const x of terminals(e)) solved.add(x);
  for (const [k, net] of nl.netOf) if (solved.has(net) || cp.refNets.has(net)) {
    const v = s.V(net);
    if (Number.isFinite(v)) pinV[k] = Math.abs(v) < 1e-9 ? 0 : v;
  }
  return { parts, pinV, issues };
}

const failure = (e: unknown): Issue =>
  e instanceof Singular
    ? { level: "error", message: "The circuit can't be solved: a source or ammeter is connected across a zero-resistance path (a wire, closed switch or another source) — that's a short circuit.", parts: [] }
    : { level: "error", message: "The solver did not converge for this circuit. Check for parts in impossible states (e.g. sources fighting each other).", parts: [] };

/** DC operating point (capacitors open, generators at their offset). */
export function simulateDc(c: Circuit): DcResult {
  const t0 = typeof performance === "undefined" ? 0 : performance.now();
  const nl = connect(c);
  const pre = validate(c, nl);
  const log = [`${ENGINE.name} ${ENGINE.version} · DC operating point`];
  if (pre.some((i) => i.level === "error")) return { ok: false, issues: pre, parts: {}, pinV: {}, log: [...log, "Stopped: validation errors."] };
  const cp = compile(c, nl);
  try {
    const s = solveCircuit(cp, { kind: "dc" }, 0, newState());
    const m = measure(c, cp, nl, s, null);
    const issues = [...pre, ...m.issues];
    log.push(`${c.parts.length} parts · ${c.wires.length} wires · ${cp.els.length} elements · ${s.iterations} Newton iteration${s.iterations > 1 ? "s" : ""}`);
    if (typeof performance !== "undefined") log.push(`Solved in ${(performance.now() - t0).toFixed(1)} ms`);
    return { ok: !issues.some((i) => i.level === "error"), issues, parts: m.parts, pinV: m.pinV, log };
  } catch (e) {
    return { ok: false, issues: [...pre, failure(e)], parts: {}, pinV: {}, log: [...log, "Solver stopped."] };
  }
}

export type Trace = { id: string; label: string; unit: "V" | "A"; values: number[] };
export type TransientResult = { ok: boolean; issues: Issue[]; times: number[]; traces: Trace[]; final: DcResult; log: string[] };

/** Time-domain run from t = 0 with discharged capacitors (backward Euler, fixed step). */
export function simulateTransient(c: Circuit, duration: number, steps = 500): TransientResult {
  const nl = connect(c);
  const pre = validate(c, nl).filter((i) => !(i.level === "info" && /DC run holds the generator/.test(i.message)));
  const T = Math.min(60, Math.max(1e-5, duration));
  const n = Math.min(4000, Math.max(50, Math.round(steps)));
  const dt = T / n;
  const log = [`${ENGINE.name} ${ENGINE.version} · transient 0 → ${fmt(T, "s")} · ${n} steps of ${fmt(dt, "s")}`];
  const empty: DcResult = { ok: false, issues: pre, parts: {}, pinV: {}, log };
  if (pre.some((i) => i.level === "error")) return { ok: false, issues: pre, times: [], traces: [], final: empty, log: [...log, "Stopped: validation errors."] };

  const cp = compile(c, nl);
  const caps = c.parts.filter((p) => p.kind === "capacitor");
  const probes = c.parts.filter((p) => p.kind === "voltmeter" || p.kind === "ammeter" || p.kind === "scope");
  const traces: (Trace & { part: Part; ch?: string })[] = [
    ...caps.map((p) => ({ id: p.id, label: `${p.label} voltage`, unit: "V" as const, values: [] as number[], part: p })),
    ...probes.flatMap((p) => (p.kind === "scope" ? ["CH1", "CH2"].map((ch) => ({ id: `${p.id}:${ch}`, label: `${p.label} ${ch}`, unit: "V" as const, values: [] as number[], part: p, ch })) : [{ id: p.id, label: p.label, unit: (p.kind === "voltmeter" ? "V" : "A") as "V" | "A", values: [] as number[], part: p }])),
  ];
  const times: number[] = [];
  const vcap = new Map<string, number>(caps.map((p) => [p.id, 0]));
  const icap = new Map<string, number>();
  const nodes = (p: Part) => cp.partNodes.get(p.id)!;
  const state = newState();
  let last: Solution | null = null;
  try {
    for (let step = 0; step <= n; step++) {
      const t = step * dt;
      const s = step === 0 ? solveCircuit(cp, { kind: "init", v: vcap }, t, state) : solveCircuit(cp, { kind: "step", dt, v: vcap }, t, state);
      for (const p of caps) {
        const v = s.V(nodes(p)["+"]) - s.V(nodes(p)["-"]);
        icap.set(p.id, step === 0 ? (s.branch.get(`cap:${p.id}`) ?? 0) : (num(p, "c") * 1e-6 * (v - vcap.get(p.id)!)) / dt);
        vcap.set(p.id, v);
      }
      times.push(t);
      for (const tr of traces) {
        const p = tr.part, nd = nodes(p);
        if (p.kind === "capacitor") tr.values.push(vcap.get(p.id)!);
        else if (p.kind === "voltmeter") tr.values.push(s.V(nd["+"]) - s.V(nd.COM));
        else if (p.kind === "scope") tr.values.push((s.V(nd[tr.ch!]) || 0) - (s.V(nd.GND) || 0));
        else tr.values.push(s.branch.get(p.id) ?? 0);
      }
      last = s;
    }
  } catch (e) {
    const issue = failure(e);
    return { ok: false, issues: [...pre, issue], times: [], traces: [], final: { ...empty, issues: [...pre, issue] }, log: [...log, "Solver stopped."] };
  }
  const m = measure(c, cp, nl, last!, icap);
  const issues = [...pre, ...m.issues];
  const final: DcResult = { ok: !issues.some((i) => i.level === "error"), issues, parts: m.parts, pinV: m.pinV, log };
  log.push(`${traces.length} trace${traces.length === 1 ? "" : "s"} recorded · values at t = ${fmt(T, "s")} shown on the bench`);
  return { ok: final.ok, issues, times, traces: traces.map(({ id, label, unit, values }) => ({ id, label, unit, values })), final, log };
}

/** Value of a trace at time t (linear interpolation). */
export function sampleAt(times: number[], values: number[], t: number): number {
  if (!times.length) return NaN;
  if (t <= times[0]) return values[0];
  for (let i = 1; i < times.length; i++) if (times[i] >= t) {
    const f = (t - times[i - 1]) / (times[i] - times[i - 1]);
    return values[i - 1] + f * (values[i] - values[i - 1]);
  }
  return values[values.length - 1];
}

// ——— Formatting ———

const PREFIX: [number, string][] = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];

/** Engineering notation: fmt(0.00409, "A") → "4.09 mA". */
export function fmt(v: number, unit: string, digits = 3): string {
  if (!Number.isFinite(v)) return `— ${unit}`;
  if (Math.abs(v) < 1e-15) return `0 ${unit}`;
  const a = Math.abs(v);
  const [f, p] = PREFIX.find(([f]) => a >= f * 0.9995) ?? PREFIX[PREFIX.length - 1];
  return `${Number((v / f).toPrecision(digits)).toString()} ${p}${unit}`;
}
