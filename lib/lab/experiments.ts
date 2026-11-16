import type { Circuit, Part, PartKind, Prop, Rot, Wire } from "./engine";

/**
 * Guided experiments. Expected values are textbook calculations written out here (never read back from the
 * engine); `scripts/test-lab-engine.mjs` checks the engine against them. Type-only imports keep this file
 * loadable by Node's type stripping.
 */

export type Reading = { part: string; label: string; unit: "A" | "V"; expected: number; tol: number; at?: number; /** Absolute tolerance, for expected values of zero. */ abs?: number };
export type ObsRow = { id: string; label: string; set?: { part: string; prop: string; value: number; text: string }; readings: Reading[] };
export type Experiment = {
  slug: string;
  title: string;
  level: "Beginner" | "Intermediate";
  minutes: number;
  summary: string;
  outcomes: string[];
  theory: string[];
  formula: string;
  steps: string[];
  analysis: "dc" | "transient";
  duration?: number;
  rows: ObsRow[];
  circuit: Circuit;
};

const P = (id: string, kind: PartKind, label: string, x: number, y: number, props: Record<string, Prop> = {}, rot: Rot = 0): Part => ({ id, kind, label, x, y, rot, props });
let n = 0;
const W = (a: string, b: string, color = "blue"): Wire => {
  const [ap, apin] = a.split(":");
  const [bp, bpin] = b.split(":");
  return { id: `w${++n}`, a: { part: ap, pin: apin }, b: { part: bp, pin: bpin }, color };
};

const V = 9;
const par = (a: number, b: number) => (a * b) / (a + b);

export const experiments: Experiment[] = [
  {
    slug: "ohms-law",
    title: "Ohm's Law",
    level: "Beginner",
    minutes: 20,
    summary: "Measure how current through a resistor changes with its resistance at a fixed 9 V.",
    outcomes: ["Connect an ammeter in series and a voltmeter in parallel", "Verify I = V / R for three resistor values", "Read meters with the right units and prefixes"],
    theory: [
      "Ohm's law states that the current through a resistor is proportional to the voltage across it: I = V / R. With the voltage held at 9 V, doubling the resistance halves the current.",
      "An ammeter must be placed in series so the whole current passes through it; a voltmeter is placed in parallel, across the part being measured.",
    ],
    formula: "I = V / R",
    steps: ["Run the circuit and note A1 and V1.", "Record the reading for R1 = 1 kΩ.", "Select R1, change it to 2.2 kΩ, run and record.", "Repeat for 4.7 kΩ and compare each current with V / R."],
    analysis: "dc",
    rows: [1000, 2200, 4700].map((r, i) => ({
      id: `r${i}`,
      label: `R1 = ${r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`}`,
      set: { part: "r1", prop: "r", value: r, text: `Set R1 to ${r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`}` },
      readings: [
        { part: "a1", label: "Current (A1)", unit: "A", expected: V / r, tol: 0.01 },
        { part: "v1", label: "Voltage (V1)", unit: "V", expected: V, tol: 0.01 },
      ],
    })),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("a1", "ammeter", "A1", 7, 2), P("r1", "resistor", "R1", 12, 2, { r: 1000 }), P("v1", "voltmeter", "V1", 13, 11), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "a1:+", "coral"), W("a1:COM", "r1:1"), W("r1:2", "b1:-", "ink"), W("r1:1", "v1:+", "yellow"), W("r1:2", "v1:COM", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "series-resistors",
    title: "Resistors in Series",
    level: "Beginner",
    minutes: 20,
    summary: "Find the equivalent resistance of three series resistors and how the voltage divides between them.",
    outcomes: ["Show that series resistances add: R = R1 + R2 + R3", "Show the same current flows through every series part", "Predict the voltage across one resistor"],
    theory: [
      "In a series circuit there is only one path, so the same current flows through every resistor. The total resistance is the sum of the individual resistances.",
      "Each resistor drops a share of the supply voltage in proportion to its resistance: V2 = I × R2.",
    ],
    formula: "R = R1 + R2 + R3,  I = V / R,  V2 = I × R2",
    steps: ["Run and record A1 and V1 with R2 = 2.2 kΩ.", "Change R2 to 4.7 kΩ, run and record again.", "Check that A1 equals 9 V ÷ (R1 + R2 + R3) each time."],
    analysis: "dc",
    rows: [2200, 4700].map((r2, i) => {
      const total = 1000 + r2 + 4700;
      return {
        id: `s${i}`,
        label: `R2 = ${r2 / 1000} kΩ`,
        set: { part: "r2", prop: "r", value: r2, text: `Set R2 to ${r2 / 1000} kΩ` },
        readings: [
          { part: "a1", label: "Current (A1)", unit: "A" as const, expected: V / total, tol: 0.01 },
          { part: "v1", label: "Voltage across R2 (V1)", unit: "V" as const, expected: (V * r2) / total, tol: 0.01 },
        ],
      };
    }),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("r1", "resistor", "R1", 7, 2, { r: 1000 }), P("r2", "resistor", "R2", 13, 2, { r: 2200 }), P("r3", "resistor", "R3", 19, 2, { r: 4700 }), P("a1", "ammeter", "A1", 25, 6), P("v1", "voltmeter", "V1", 14, 10), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "r1:1", "coral"), W("r1:2", "r2:1"), W("r2:2", "r3:1"), W("r3:2", "a1:+"), W("a1:COM", "b1:-", "ink"), W("r2:1", "v1:+", "yellow"), W("r2:2", "v1:COM", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "parallel-resistors",
    title: "Resistors in Parallel",
    level: "Beginner",
    minutes: 20,
    summary: "Measure the total and branch currents of two parallel resistors.",
    outcomes: ["Show that parallel branches share the same voltage", "Show that branch currents add to the total current", "Calculate equivalent parallel resistance"],
    theory: [
      "Resistors in parallel all have the full supply voltage across them, so each branch current is V / R for that branch.",
      "The total current is the sum of the branch currents, so the equivalent resistance is smaller than the smallest branch: 1/R = 1/R1 + 1/R2.",
    ],
    formula: "1/R = 1/R1 + 1/R2,  I = I1 + I2",
    steps: ["Run and record A1 (total) and A2 (R2 branch).", "Change R2 to 1 kΩ, run and record.", "Check A1 − A2 equals 9 V ÷ R1."],
    analysis: "dc",
    rows: [2200, 1000].map((r2, i) => ({
      id: `p${i}`,
      label: `R2 = ${r2 / 1000} kΩ`,
      set: { part: "r2", prop: "r", value: r2, text: `Set R2 to ${r2 / 1000} kΩ` },
      readings: [
        { part: "a1", label: "Total current (A1)", unit: "A" as const, expected: V / par(1000, r2), tol: 0.01 },
        { part: "a2", label: "R2 branch current (A2)", unit: "A" as const, expected: V / r2, tol: 0.01 },
      ],
    })),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("a1", "ammeter", "A1", 6, 2), P("r1", "resistor", "R1", 12, 2, { r: 1000 }, 1), P("a2", "ammeter", "A2", 15, 2), P("r2", "resistor", "R2", 20, 2, { r: 2200 }, 1), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "a1:+", "coral"), W("a1:COM", "r1:1"), W("a1:COM", "a2:+"), W("a2:COM", "r2:1"), W("r1:2", "b1:-", "ink"), W("r2:2", "r1:2", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "voltage-divider",
    title: "Voltage Divider & KVL",
    level: "Beginner",
    minutes: 25,
    summary: "Build a two-resistor divider and verify Kirchhoff's voltage law around the loop.",
    outcomes: ["Predict a divider's output: Vout = V × R2 / (R1 + R2)", "Verify KVL: the voltage drops add up to the supply", "See how the ratio, not the size, sets the output"],
    theory: [
      "Kirchhoff's voltage law (KVL): around any closed loop the sum of voltage rises equals the sum of voltage drops. Here V(R1) + V(R2) = 9 V.",
      "Two resistors in series form a voltage divider. The output across R2 is the supply scaled by R2 / (R1 + R2).",
    ],
    formula: "Vout = V × R2 / (R1 + R2),  V(R1) + V(R2) = V",
    steps: ["Run and record V2 (across R1) and V1 (across R2).", "Check V1 + V2 = 9 V.", "Change R2 to 10 kΩ — the output should become exactly half the supply."],
    analysis: "dc",
    rows: [4700, 10000].map((r2, i) => ({
      id: `d${i}`,
      label: `R2 = ${r2 / 1000} kΩ`,
      set: { part: "r2", prop: "r", value: r2, text: `Set R2 to ${r2 / 1000} kΩ` },
      readings: [
        { part: "v1", label: "Vout across R2 (V1)", unit: "V" as const, expected: (V * r2) / (10000 + r2), tol: 0.01 },
        { part: "v2", label: "Across R1 (V2)", unit: "V" as const, expected: (V * 10000) / (10000 + r2), tol: 0.01 },
      ],
    })),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("r1", "resistor", "R1", 7, 2, { r: 10000 }), P("r2", "resistor", "R2", 14, 2, { r: 4700 }), P("v2", "voltmeter", "V2", 8, 10), P("v1", "voltmeter", "V1", 15, 10), P("g1", "ground", "GND", 5, 8)],
      wires: [W("b1:+", "r1:1", "coral"), W("r1:2", "r2:1"), W("r2:2", "b1:-", "ink"), W("r1:1", "v2:+", "yellow"), W("r1:2", "v2:COM", "ink"), W("r2:1", "v1:+", "yellow"), W("r2:2", "v1:COM", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "kirchhoff-current-law",
    title: "Kirchhoff's Current Law",
    level: "Intermediate",
    minutes: 30,
    summary: "Measure the current entering a node and the two currents leaving it.",
    outcomes: ["Verify KCL: current into a node equals current out", "Solve a series-parallel network by hand", "Place several ammeters without disturbing the circuit"],
    theory: [
      "Kirchhoff's current law (KCL): the total current flowing into a node equals the total current flowing out, because charge is conserved.",
      "Here the current through R1 splits between R2 and R3. Their parallel resistance is R2R3 / (R2 + R3); the node voltage sets each branch current.",
    ],
    formula: "I1 = I2 + I3",
    steps: ["Run and record A1, A2 and A3.", "Check A1 = A2 + A3.", "Work out the node voltage by hand and compare with I2 × R2."],
    analysis: "dc",
    rows: (() => {
      const rp = par(2200, 4700), i1 = V / (1000 + rp), vn = i1 * rp;
      return [{
        id: "k0",
        label: "R1 = 1 kΩ, R2 = 2.2 kΩ, R3 = 4.7 kΩ",
        readings: [
          { part: "a1", label: "Into the node (A1)", unit: "A" as const, expected: i1, tol: 0.01 },
          { part: "a2", label: "Through R2 (A2)", unit: "A" as const, expected: vn / 2200, tol: 0.01 },
          { part: "a3", label: "Through R3 (A3)", unit: "A" as const, expected: vn / 4700, tol: 0.01 },
        ],
      }];
    })(),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("a1", "ammeter", "A1", 6, 2), P("r1", "resistor", "R1", 10, 2, { r: 1000 }), P("a2", "ammeter", "A2", 16, 2), P("r2", "resistor", "R2", 21, 2, { r: 2200 }, 1), P("a3", "ammeter", "A3", 14, 5, {}, 1), P("r3", "resistor", "R3", 14, 9, { r: 4700 }, 1), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "a1:+", "coral"), W("a1:COM", "r1:1"), W("r1:2", "a2:+"), W("r1:2", "a3:+"), W("a2:COM", "r2:1"), W("a3:COM", "r3:1"), W("r2:2", "r3:2", "ink"), W("r3:2", "b1:-", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "led-current-limiting",
    title: "LED with a Current-Limiting Resistor",
    level: "Beginner",
    minutes: 25,
    summary: "Light an LED from an Arduino's 5 V pin on a breadboard and size its series resistor.",
    outcomes: ["Assemble a circuit on a breadboard using its strips and rails", "Choose a series resistor: R = (Vs − Vf) / I", "See why an LED without a resistor burns out"],
    theory: [
      "Once an LED conducts, its forward voltage stays close to its rated value (typically 2.0 V for a red 5 mm LED at 20 mA), so the current must be limited by a series resistor: I = (Vs − Vf) / R.",
      "5 mm indicator LEDs are rated for 20 mA continuous. The simulator uses the diode equation, so Vf drops slightly at lower currents — the textbook figure is within a few percent, hence the 10 % tolerance.",
      "On a breadboard the five holes in each column (a–e, f–j) are joined, and the long rails along the edges carry the supply.",
    ],
    formula: "R = (Vs − Vf) / I",
    steps: ["Run: the LED lights and A1 shows its current.", "Record the reading with R1 = 220 Ω.", "Change R1 to 330 Ω, run and record — the LED dims.", "Try 100 Ω and read the warning: that is why the resistor matters."],
    analysis: "dc",
    rows: [220, 330].map((r, i) => ({
      id: `l${i}`,
      label: `R1 = ${r} Ω`,
      set: { part: "r1", prop: "r", value: r, text: `Set R1 to ${r} Ω` },
      readings: [{ part: "a1", label: "LED current (A1)", unit: "A" as const, expected: (5 - 2.0) / r, tol: 0.1 }],
    })),
    circuit: {
      parts: [
        P("bb", "breadboard", "BB1", 0, 0),
        P("u1", "arduino", "U1", 3, 20),
        P("r1", "resistor", "R1", 9, 10, { r: 220 }),
        P("d1", "led", "LED1", 13, 11, { color: "red" }),
        P("a1", "ammeter", "A1", 33, 14),
      ],
      wires: [W("u1:5V", "bb:B+5", "coral"), W("u1:GND2", "bb:B-8", "ink"), W("bb:B+10", "bb:j10", "coral"), W("bb:i15", "a1:+", "yellow"), W("a1:COM", "bb:B-29", "ink")],
    },
  },
  {
    slug: "rc-charging",
    title: "RC Charging Curve",
    level: "Intermediate",
    minutes: 30,
    summary: "Watch a capacitor charge through a resistor and measure the time constant.",
    outcomes: ["Run a transient (time-domain) simulation", "Measure the time constant τ = RC from a waveform", "Verify Vc = V(1 − e^(−t/τ))"],
    theory: [
      "When a discharged capacitor is connected to a supply through a resistor, its voltage rises exponentially: Vc = V(1 − e^(−t/RC)).",
      "After one time constant τ = RC the capacitor reaches 63.2 % of the supply; after 5τ it is above 99 % and considered fully charged. With 10 kΩ and 100 µF, τ = 1 s.",
    ],
    formula: "τ = RC,  Vc = V(1 − e^(−t/τ))",
    steps: ["Run the 5-second transient analysis.", "Open Waveforms and read V1 at t = 1 s and t = 5 s.", "Record both rows and compare with 63.2 % and 99.3 % of 9 V."],
    analysis: "transient",
    duration: 5,
    rows: [
      { id: "c0", label: "t = τ = 1 s", readings: [{ part: "v1", label: "Capacitor voltage (V1)", unit: "V", expected: V * (1 - Math.exp(-1)), tol: 0.02, at: 1 }] },
      { id: "c1", label: "t = 5τ = 5 s", readings: [{ part: "v1", label: "Capacitor voltage (V1)", unit: "V", expected: V * (1 - Math.exp(-5)), tol: 0.02, at: 5 }] },
    ],
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("sw1", "switch", "SW1", 7, 2, { closed: true }), P("r1", "resistor", "R1", 11, 2, { r: 10000 }), P("c1", "capacitor", "C1", 18, 6, { c: 100, vmax: 25 }), P("v1", "voltmeter", "V1", 18, 12), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "sw1:1", "coral"), W("sw1:2", "r1:1"), W("r1:2", "c1:+"), W("c1:-", "b1:-", "ink"), W("c1:+", "v1:+", "yellow"), W("c1:-", "v1:COM", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "diode-forward-bias",
    title: "Diode Forward Bias",
    level: "Beginner",
    minutes: 20,
    summary: "Measure the voltage across a forward-biased silicon diode and the current it lets through.",
    outcomes: ["See that a silicon diode drops about 0.6–0.7 V when conducting", "Calculate the current with the diode drop: I = (V − Vd) / R", "Notice how little Vd changes when the current doubles"],
    theory: [
      "A silicon PN junction conducts in the forward direction once about 0.6 V is across it; above that the current rises exponentially (the Shockley diode equation), so the voltage barely changes.",
      "That is why circuits treat a conducting diode as a fixed ~0.7 V drop. Reverse the diode and almost no current flows.",
    ],
    formula: "I = (V − Vd) / R,  Vd ≈ 0.7 V",
    steps: ["Run and record A1 and V1 with R1 = 1 kΩ.", "Change R1 to 470 Ω — the current roughly doubles.", "Compare V1 in both rows: the diode voltage rises only a few tens of millivolts."],
    analysis: "dc",
    rows: [1000, 470].map((r, i) => ({
      id: `df${i}`,
      label: `R1 = ${r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`}`,
      set: { part: "r1", prop: "r", value: r, text: `Set R1 to ${r >= 1000 ? `${r / 1000} kΩ` : `${r} Ω`}` },
      readings: [
        { part: "a1", label: "Diode current (A1)", unit: "A" as const, expected: (V - 0.7) / r, tol: 0.03 },
        { part: "v1", label: "Diode voltage (V1)", unit: "V" as const, expected: 0.7, tol: 0.1 },
      ],
    })),
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 6, { v: 9 }), P("a1", "ammeter", "A1", 6, 2), P("r1", "resistor", "R1", 10, 2, { r: 1000 }), P("d1", "diode", "D1", 16, 2), P("v1", "voltmeter", "V1", 17, 10), P("g1", "ground", "GND", 6, 8)],
      wires: [W("b1:+", "a1:+", "coral"), W("a1:COM", "r1:1"), W("r1:2", "d1:A"), W("d1:K", "b1:-", "ink"), W("d1:A", "v1:+", "yellow"), W("d1:K", "v1:COM", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "transistor-switch",
    title: "Transistor as a Switch",
    level: "Intermediate",
    minutes: 30,
    summary: "Use a small base current through a BC547 to switch a much larger LED current on and off.",
    outcomes: ["Wire an NPN transistor (C–B–E) as a low-side switch", "Size the base resistor so the transistor saturates", "Compare the collector current with and without base current"],
    theory: [
      "With no base current an NPN transistor is cut off and no collector current flows. A base current Ib lets up to β × Ib flow from collector to emitter.",
      "Used as a switch, the transistor is driven hard into saturation: Vce falls to about 0.1–0.2 V and the load sets the current, Ic ≈ (Vcc − Vf − Vce(sat)) / Rc. Here Ib ≈ (9 − 0.7) / 10 kΩ ≈ 0.83 mA — far more than the 0.05 mA the 14 mA LED needs at β ≈ 290.",
    ],
    formula: "Ic ≈ (Vcc − Vf − Vce(sat)) / Rc,  Ib = (Vcc − Vbe) / Rb",
    steps: ["Run with SW1 on: the LED lights — record A1.", "Click SW1 to switch it off and record again: the collector current stops.", "Select Q1 to see its operating region and base current."],
    analysis: "dc",
    rows: [
      { id: "q0", label: "SW1 on", set: { part: "sw1", prop: "closed", value: 1, text: "Switch SW1 on" }, readings: [{ part: "a1", label: "Collector current (A1)", unit: "A", expected: (V - 2.0 - 0.2) / 470, tol: 0.1 }] },
      { id: "q1", label: "SW1 off", set: { part: "sw1", prop: "closed", value: 0, text: "Switch SW1 off" }, readings: [{ part: "a1", label: "Collector current (A1)", unit: "A", expected: 0, tol: 0, abs: 1e-6 }] },
    ],
    circuit: {
      parts: [P("b1", "battery", "B1", 2, 8, { v: 9 }), P("sw1", "switch", "SW1", 7, 4, { closed: 1 }), P("rb", "resistor", "R1", 11, 4, { r: 10000 }), P("rc", "resistor", "R2", 13, 0, { r: 470 }), P("d1", "led", "LED1", 19, 0, { color: "red" }), P("a1", "ammeter", "A1", 22, 4), P("q1", "npn", "Q1", 16, 8), P("g1", "ground", "GND", 6, 12)],
      wires: [W("b1:+", "sw1:1", "coral"), W("sw1:2", "rb:1"), W("rb:2", "q1:B"), W("b1:+", "rc:1", "coral"), W("rc:2", "d1:A"), W("d1:K", "a1:+"), W("a1:COM", "q1:C"), W("q1:E", "b1:-", "ink"), W("b1:-", "g1:G", "ink")],
    },
  },
  {
    slug: "rc-filter-oscilloscope",
    title: "Square Wave through an RC Filter",
    level: "Intermediate",
    minutes: 35,
    summary: "Feed a 0–5 V square wave into an RC low-pass filter and compare input and output on a two-channel oscilloscope.",
    outcomes: ["Set up a function generator (frequency, amplitude, offset)", "Use two oscilloscope channels with a common ground", "Measure how the output charges each half-cycle"],
    theory: [
      "On each rising edge the capacitor charges towards 5 V through R with time constant τ = RC; on each falling edge it discharges. With R = 1 kΩ and C = 1 µF, τ = 1 ms.",
      "The generator's 50 Ω output impedance adds to R, so the real time constant is 1.05 ms — a reminder that instruments are part of the circuit.",
    ],
    formula: "τ = RC,  Vout = V(1 − e^(−t/τ)) on a rising edge",
    steps: ["Run a 20 ms transient analysis.", "Open Waveforms: CH1 is the square wave, CH2 the filter output.", "Record CH2 at t = 1 ms (one τ after the first edge) and t = 4.5 ms, just before the wave falls at 5 ms."],
    analysis: "transient",
    duration: 0.02,
    rows: [
      { id: "f0", label: "t = τ = 1 ms", readings: [{ part: "sc1:CH2", label: "Output (CH2)", unit: "V", expected: 5 * (1 - Math.exp(-1)), tol: 0.05, at: 0.001 }] },
      { id: "f1", label: "t = 4.5 ms", readings: [{ part: "sc1:CH2", label: "Output (CH2)", unit: "V", expected: 5 * (1 - Math.exp(-4.5)), tol: 0.03, at: 0.0045 }] },
    ],
    circuit: {
      parts: [P("fg1", "fgen", "FG1", 1, 8, { wave: "square", freq: 100, vpp: 5, offset: 2.5 }), P("r1", "resistor", "R1", 8, 3, { r: 1000 }), P("c1", "capacitor", "C1", 15, 8, { c: 1, vmax: 16 }), P("sc1", "scope", "SC1", 20, 14), P("g1", "ground", "GND", 2, 12)],
      wires: [W("fg1:+", "r1:1", "coral"), W("r1:2", "c1:+"), W("c1:-", "fg1:-", "ink"), W("fg1:+", "sc1:CH1", "yellow"), W("c1:+", "sc1:CH2", "blue"), W("c1:-", "sc1:GND", "ink"), W("fg1:-", "g1:G", "ink")],
    },
  },
];

export const getExperiment = (slug: string) => experiments.find((e) => e.slug === slug);

/** Whether a reading is within tolerance of its expected value. */
export const withinTol = (r: Reading, value: number) => Number.isFinite(value) && Math.abs(value - r.expected) <= Math.max(Math.abs(r.expected) * r.tol, r.abs ?? 1e-12);
