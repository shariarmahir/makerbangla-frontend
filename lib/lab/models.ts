import { ARDUINO_IO, BB_COLS, BC547, D1N4007, fmt, KINDS, LDR_MODEL, LED, LED_COLORS, ledColor, num, NUM, rotate, switchClosed, WAVES, type Part, type PartKind, type Prop, type Rot } from "./engine";

/**
 * Component library metadata: what each part is, its editable properties, ratings, how the engine models it,
 * and how it maps to a real store product. Matches are labelled honestly: "exact" (the product is this part),
 * "kit" (an assortment that usually contains it — check the value) or "compatible" (works, but not identical).
 */

export type Field = { key: string; label: string; type: "number" | "select" | "toggle" | "slider"; unit?: string; step?: number; options?: { value: string; label: string }[]; presets?: number[] };
export type Match = "exact" | "kit" | "compatible";
export type ProductLink = { slug: string; match: Match; note: string };
export type Category = "Power" | "Passives" | "Semiconductors" | "Indicators" | "Controls" | "Sensors" | "Instruments" | "Boards";

export type Model = {
  kind: PartKind;
  name: string;
  prefix: string;
  category: Category;
  blurb: string;
  fields: Field[];
  ratings: string[];
  model: string;
  pinNames: Record<string, string>;
  /** Body box in grid units, unrotated: [x, y, w, h]. */
  box: [number, number, number, number];
  rotatable: boolean;
  product: (p: Part) => ProductLink | null;
};

const RES_PRESETS = [10, 47, 100, 150, 220, 330, 470, 1000, 2200, 3300, 4700, 10000, 22000, 47000, 100000];
const kitNote = (what: string) => `Assortment — check that ${what} is included before you rely on it.`;

export const MODELS: Record<PartKind, Model> = {
  battery: {
    kind: "battery", name: "Battery", prefix: "B", category: "Power", rotatable: true,
    blurb: "A DC voltage source. Set any voltage from 0.1 to 48 V; internal resistance is optional.",
    fields: [{ key: "v", label: "Voltage", type: "number", unit: "V", step: 0.1, presets: [1.5, 3, 3.7, 5, 9, 12] }, { key: "r", label: "Internal resistance", type: "number", unit: "Ω", step: 0.1 }],
    ratings: ["Overload error above 2 A"], model: "Ideal voltage source with optional series resistance.",
    pinNames: { "+": "Positive (+)", "-": "Negative (−)" }, box: [-0.7, -0.5, 3.4, 5.1],
    product: (p) => { const v = num(p, "v"); return v >= 3 && v <= 4.2 ? { slug: "li-ion-18650-cell", match: "compatible", note: "3.7 V Li-ion cell — needs a holder; voltage sags as it discharges." } : null; },
  },
  supply: {
    kind: "supply", name: "Bench power supply", prefix: "PS", category: "Power", rotatable: false,
    blurb: "Adjustable 0–30 V lab supply with a current limit, as on a sessional bench.",
    fields: [{ key: "v", label: "Output voltage", type: "number", unit: "V", step: 0.1, presets: [3.3, 5, 9, 12, 24] }, { key: "limit", label: "Current limit", type: "number", unit: "A", step: 0.1 }],
    ratings: ["0–30 V", "Current limit 1 mA – 5 A"], model: "Constant voltage until the load asks for more than the limit, then constant current (CV/CC) — like a real bench supply.",
    pinNames: { "+": "Output +", "-": "Output −" }, box: [-0.4, -3.6, 4.8, 4],
    product: (p) => (num(p, "v") <= 30 ? { slug: "bench-power-supply", match: "exact", note: "0–30 V, 0–5 A bench supply." } : null),
  },
  resistor: {
    kind: "resistor", name: "Resistor", prefix: "R", category: "Passives", rotatable: true,
    blurb: "Fixed metal-film resistor. Colour bands update with the value.",
    fields: [{ key: "r", label: "Resistance", type: "number", unit: "Ω", step: 1, presets: RES_PRESETS }, { key: "watt", label: "Power rating", type: "select", unit: "W", options: [{ value: "0.125", label: "1/8 W" }, { value: "0.25", label: "1/4 W" }, { value: "0.5", label: "1/2 W" }, { value: "1", label: "1 W" }] }],
    ratings: ["Warning above the power rating", "Error above twice the rating"], model: "Linear resistor (Ohm's law).",
    pinNames: { "1": "Lead 1", "2": "Lead 2" }, box: [-0.3, -0.45, 4.6, 0.9],
    product: (p) => ({ slug: "resistor-kit", match: "kit", note: kitNote(fmt(num(p, "r"), "Ω")) }),
  },
  led: {
    kind: "led", name: "LED (5 mm)", prefix: "LED", category: "Indicators", rotatable: true,
    blurb: "Light-emitting diode. Glows in proportion to its current; the long leg (A) goes to +. Typical Vf at 20 mA: red 2.0 V, yellow 2.1 V, blue/white 3.2 V.",
    fields: [{ key: "color", label: "Colour", type: "select", options: (Object.keys(LED_COLORS) as (keyof typeof LED_COLORS)[]).map((c) => ({ value: c, label: `${c[0].toUpperCase()}${c.slice(1)} (Vf ${LED_COLORS[c].vf} V @ 20 mA)` })) }],
    ratings: [`${fmt(LED.imax, "A")} continuous`, `${fmt(LED.iabs, "A")} absolute maximum`, `${LED.vrev} V reverse`], model: `Shockley diode equation (n = ${LED.n}) fitted to the typical Vf at 20 mA, plus ${LED.rs} Ω series resistance. Reverse breakdown isn't modelled; real LEDs vary between batches.`,
    pinNames: { A: "Anode (+, long leg)", K: "Cathode (−, flat side)" }, box: [-0.4, -2.2, 1.8, 2.5],
    product: (p) => ({ slug: "led-5mm-assorted", match: "kit", note: kitNote(`a ${ledColor(p)} LED`) }),
  },
  capacitor: {
    kind: "capacitor", name: "Electrolytic capacitor", prefix: "C", category: "Passives", rotatable: true,
    blurb: "Polarised capacitor. Open circuit in DC; charges and discharges in a transient run.",
    fields: [{ key: "c", label: "Capacitance", type: "number", unit: "µF", step: 1, presets: [1, 10, 47, 100, 220, 470, 1000] }, { key: "vmax", label: "Voltage rating", type: "number", unit: "V", step: 1, presets: [16, 25, 50] }],
    ratings: ["Warning above its voltage rating", "Warning when reverse-biased"], model: "Ideal capacitor; backward-Euler companion model in transient.",
    pinNames: { "+": "Positive (+)", "-": "Negative (−, striped)" }, box: [-0.4, -2.9, 1.8, 3.2],
    product: (p) => ({ slug: "capacitor-kit-electrolytic", match: "kit", note: kitNote(`${fmt(num(p, "c") * 1e-6, "F")} / ${num(p, "vmax")} V`) }),
  },
  switch: {
    kind: "switch", name: "Toggle switch (SPST)", prefix: "SW", category: "Controls", rotatable: true,
    blurb: "On/off switch. Click it on the bench to flip it while the circuit runs.",
    fields: [{ key: "closed", label: "Closed (on)", type: "toggle" }],
    ratings: [], model: "1 mΩ when closed, open circuit when open.",
    pinNames: { "1": "Terminal 1", "2": "Terminal 2" }, box: [-0.4, -1.4, 2.8, 1.8],
    product: () => null,
  },
  button: {
    kind: "button", name: "Push button", prefix: "S", category: "Controls", rotatable: true,
    blurb: "Momentary tactile switch: press and hold it on the bench and it conducts only while held.",
    fields: [], ratings: ["Signal level — about 50 mA, 12 V"], model: "1 mΩ while pressed, open otherwise. Shown with two of its four legs (the pairs are joined inside).",
    pinNames: { "1": "Terminal 1", "2": "Terminal 2" }, box: [-0.4, -1.6, 2.8, 2],
    product: () => null,
  },
  ldr: {
    kind: "ldr", name: "Light sensor (LDR)", prefix: "LDR", category: "Sensors", rotatable: true,
    blurb: "Light-dependent resistor: its resistance falls as light rises. Set the light level to test a night-light or a light meter.",
    fields: [{ key: "lux", label: "Light level", type: "number", unit: "lux", step: 1, presets: [1, 10, 100, 500, 1000, 10000] }],
    ratings: ["About 100 mW"], model: `R = ${LDR_MODEL.r10 / 1000} kΩ × (lux / 10)^−${LDR_MODEL.gamma}, limited to ${LDR_MODEL.rdark / 1e6} MΩ in the dark (GL55-series typical).`,
    pinNames: { "1": "Lead 1", "2": "Lead 2" }, box: [-0.4, -1.9, 2.8, 2.2],
    product: () => null,
  },
  diode: {
    kind: "diode", name: "Rectifier diode 1N4007", prefix: "D", category: "Semiconductors", rotatable: true,
    blurb: "Silicon rectifier diode. Conducts from anode to cathode (the striped end) once about 0.6–0.7 V is across it.",
    fields: [], ratings: ["1 A forward", "1000 V reverse"], model: `Shockley equation with published 1N4007 SPICE parameters (Is ${D1N4007.is.toExponential(2)} A, n ${D1N4007.n}, Rs ${D1N4007.rs} Ω). Reverse recovery isn't modelled.`,
    pinNames: { A: "Anode", K: "Cathode (striped end)" }, box: [-0.3, -0.45, 4.6, 0.9],
    product: () => ({ slug: "diode-1n4007-pack", match: "exact", note: "Pack of 50 × 1N4007." }),
  },
  npn: {
    kind: "npn", name: "NPN transistor BC547", prefix: "Q", category: "Semiconductors", rotatable: true,
    blurb: "General-purpose NPN transistor. Pins C–B–E with the flat face towards you. A small base current controls a larger collector current.",
    fields: [], ratings: [`Ic ${BC547.icmax * 1000} mA max`, `Vceo ${BC547.vceo} V`, `${BC547.pmax * 1000} mW`], model: `Ebers–Moll with typical BC547B SPICE parameters (βF ${BC547.bf}, βR ${BC547.br}); no Early effect or capacitances.`,
    pinNames: { C: "Collector", B: "Base", E: "Emitter" }, box: [-0.4, -1.9, 2.8, 2.2],
    product: () => ({ slug: "bjt-transistor-kit", match: "kit", note: "BC547 / 2N2222 kit — note the 2N2222 pinout is E–B–C." }),
  },
  pot: {
    kind: "pot", name: "Potentiometer", prefix: "RV", category: "Controls", rotatable: true,
    blurb: "Variable resistor with a wiper. Turn it with the slider to divide a voltage.",
    fields: [{ key: "r", label: "Total resistance", type: "number", unit: "Ω", step: 100, presets: [1000, 5000, 10000, 50000, 100000] }, { key: "pos", label: "Wiper position", type: "slider", unit: "%", step: 1 }],
    ratings: [], model: "Two resistors split at the wiper (linear taper).",
    pinNames: { A: "End A", W: "Wiper", B: "End B" }, box: [-0.5, -2.6, 3, 2.9],
    product: () => null,
  },
  ammeter: {
    kind: "ammeter", name: "Ammeter", prefix: "A", category: "Instruments", rotatable: true,
    blurb: "Measures current. Connect it in series — current flows in at + and out at COM.",
    fields: [], ratings: [], model: "Ideal 0 Ω meter (a zero-volt source that reports its current).",
    pinNames: { "+": "+ (current in)", COM: "COM (current out)" }, box: [-0.7, -3.6, 3.4, 3.9],
    product: () => ({ slug: "digital-multimeter", match: "exact", note: "Use the multimeter's current range. One meter can take readings one at a time." }),
  },
  voltmeter: {
    kind: "voltmeter", name: "Voltmeter", prefix: "V", category: "Instruments", rotatable: true,
    blurb: "Measures voltage between its probes. Connect it in parallel, across the part.",
    fields: [], ratings: [], model: "10 MΩ input resistance, like a typical digital multimeter.",
    pinNames: { "+": "+ (red probe)", COM: "COM (black probe)" }, box: [-0.7, -3.6, 3.4, 3.9],
    product: () => ({ slug: "digital-multimeter", match: "exact", note: "Use the multimeter's voltage range." }),
  },
  fgen: {
    kind: "fgen", name: "Function generator", prefix: "FG", category: "Instruments", rotatable: false,
    blurb: "Sine, square or triangle signal source for transient runs. A DC run holds it at its offset.",
    fields: [
      { key: "wave", label: "Waveform", type: "select", options: WAVES.map((w) => ({ value: w, label: `${w[0].toUpperCase()}${w.slice(1)}` })) },
      { key: "freq", label: "Frequency", type: "number", unit: "Hz", step: 1, presets: [1, 10, 100, 1000, 10000] },
      { key: "vpp", label: "Amplitude (peak to peak)", type: "number", unit: "V", step: 0.1, presets: [1, 2, 5, 10] },
      { key: "offset", label: "DC offset", type: "number", unit: "V", step: 0.1, presets: [0, 2.5, 5] },
    ],
    ratings: ["0.1 Hz – 100 kHz", "Up to 20 Vpp, ±10 V offset"], model: "Ideal waveform behind a 50 Ω output impedance, as on a real generator.",
    pinNames: { "+": "Output", "-": "COM" }, box: [-0.4, -3.6, 4.8, 4],
    product: () => ({ slug: "function-generator", match: "exact", note: "DDS function / arbitrary waveform generator." }),
  },
  scope: {
    kind: "scope", name: "Oscilloscope (2 channels)", prefix: "SC", category: "Instruments", rotatable: false,
    blurb: "Shows voltages against time. Clip GND to the circuit's ground and probe two points with CH1 and CH2, then run a transient.",
    fields: [], ratings: ["1 MΩ input per channel"], model: "Two 1 MΩ inputs referenced to its GND clip; traces appear in Waveforms after a transient run.",
    pinNames: { CH1: "Channel 1", CH2: "Channel 2", GND: "Ground clip" }, box: [-0.7, -4.4, 5.4, 4.7],
    product: () => ({ slug: "digital-oscilloscope", match: "exact", note: "4-channel 50 MHz digital storage oscilloscope." }),
  },
  ground: {
    kind: "ground", name: "Ground (0 V)", prefix: "GND", category: "Power", rotatable: false,
    blurb: "Reference point for voltages. Without one, voltages are measured from the source's − terminal.",
    fields: [], ratings: [], model: "Defines 0 V. All ground symbols are joined.",
    pinNames: { G: "Ground" }, box: [-0.7, -0.3, 1.4, 1.6],
    product: () => null,
  },
  breadboard: {
    kind: "breadboard", name: "Breadboard (400 holes)", prefix: "BB", category: "Boards", rotatable: false,
    blurb: "Push leads into the holes: each half-column of five (a–e, f–j) is joined, and the four rails run along the edges.",
    fields: [], ratings: [], model: "Ideal connections; dragging the board carries the parts plugged into it.",
    pinNames: {}, box: [-0.9, -0.9, BB_COLS - 1 + 1.8, 17.8],
    product: () => ({ slug: "breadboard-830", match: "compatible", note: "830-point board — larger than this 400-hole model, same layout." }),
  },
  arduino: {
    kind: "arduino", name: "Arduino Uno R3", prefix: "U", category: "Boards", rotatable: false,
    blurb: "Powers circuits from its 5 V and 3.3 V pins. Digital pins can be held HIGH or LOW; running sketches needs a licensed microcontroller engine and is not available yet.",
    fields: [], ratings: ["5V pin: 500 mA (USB)", "3V3 pin: 150 mA", "I/O pin: 20 mA recommended, 40 mA absolute"], model: "5 V and 3.3 V sources; I/O pins as 5 V / 0 V through 25 Ω. No code execution.",
    pinNames: { ...Object.fromEntries(ARDUINO_IO.map((p) => [p, `${p} (I/O)`])), "5V": "5 V supply", "3V3": "3.3 V supply", GND1: "GND", GND2: "GND", GND3: "GND", VIN: "VIN (not modelled)", AREF: "AREF (not modelled)", IOREF: "IOREF (not modelled)", RESET: "RESET (not modelled)" },
    box: [-1, -0.9, 18.6, 10.8],
    product: () => ({ slug: "arduino-uno-r3", match: "exact", note: "The board itself; sketches run on the real board, not in this simulator." }),
  },
};

export const CATEGORIES: Category[] = ["Power", "Passives", "Semiconductors", "Indicators", "Controls", "Sensors", "Instruments", "Boards"];
export const libraryKinds = KINDS;

/** Default props for a new part. */
export function defaults(kind: PartKind): Record<string, Prop> {
  const out: Record<string, Prop> = {};
  for (const [k, [d]] of Object.entries(NUM[kind] ?? {})) out[k] = d;
  if (kind === "led") out.color = "red";
  if (kind === "switch") out.closed = true;
  if (kind === "button") out.pressed = false;
  if (kind === "fgen") out.wave = "sine";
  return out;
}

/** Short value text shown on the bench and in the parts list. */
export function valueText(p: Part): string {
  switch (p.kind) {
    case "battery":
    case "supply": return fmt(num(p, "v"), "V");
    case "resistor": return fmt(num(p, "r"), "Ω");
    case "pot": return fmt(num(p, "r"), "Ω");
    case "capacitor": return `${fmt(num(p, "c") * 1e-6, "F")} ${num(p, "vmax")} V`;
    case "led": return ledColor(p);
    case "switch": return switchClosed(p) ? "on" : "off";
    case "ldr": return `${num(p, "lux")} lux`;
    case "fgen": return `${String(p.props.wave ?? "sine")} ${fmt(num(p, "freq"), "Hz")}`;
    case "diode": return "1N4007";
    case "npn": return "BC547";
    default: return "";
  }
}

/** Bounding box in world grid units (rotation applied). */
export function worldBox(p: Part): [number, number, number, number] {
  const [bx, by, bw, bh] = MODELS[p.kind].box;
  const pts = [[bx, by], [bx + bw, by], [bx, by + bh], [bx + bw, by + bh]].map(([x, y]) => rotate(x, y, p.rot as Rot));
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  return [p.x + Math.min(...xs), p.y + Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
}

// ——— Colour data (standard resistor colour code and LED colours: data, not styling) ———

export const BAND = ["#1b1b1b", "#7b4a24", "#d23c32", "#ef7d1a", "#f5c518", "#2e9e4f", "#2a62d6", "#7d3fb8", "#8a8a8a", "#f4f4f4"];
export const GOLD = "#c9a227";
export const SILVER = "#b8bcc2";
export const RESISTOR_BODY = "#e9d3a9";
export const LED_FILL: Record<string, string> = { red: "#ff4d4d", yellow: "#ffd23f", blue: "#3d8bff", white: "#f5f8ff" };

/** Four-band colour code for a resistance: two digits, multiplier, 5 % gold. */
export function bands(r: number): string[] {
  let exp = Math.floor(Math.log10(r)) - 1;
  let m = Math.round(r / 10 ** exp);
  if (m >= 100) { m = 10; exp += 1; }
  const mult = exp === -1 ? GOLD : exp <= -2 ? SILVER : BAND[Math.min(9, exp)];
  return [BAND[Math.floor(m / 10)], BAND[m % 10], mult, GOLD];
}
