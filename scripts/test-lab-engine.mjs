// Lab Kitchen engine acceptance tests: `npm run test:lab` (Node ≥ 22.18 runs the TypeScript sources directly).
// Every experiment's expected value is a textbook calculation; the engine must land inside its tolerance.
import assert from "node:assert/strict";
import { test } from "node:test";
import { connect, fmt, sampleAt, simulateDc, simulateTransient } from "../lib/lab/engine.ts";
import { experiments, withinTol } from "../lib/lab/experiments.ts";

const clone = (c) => JSON.parse(JSON.stringify(c));
const P = (id, kind, x, y, props = {}, rot = 0) => ({ id, kind, label: id.toUpperCase(), x, y, rot, props });
const W = (a, b) => { const [ap, apin] = a.split(":"), [bp, bpin] = b.split(":"); return { id: `${a}-${b}`, a: { part: ap, pin: apin }, b: { part: bp, pin: bpin } }; };
const errors = (r) => r.issues.filter((i) => i.level === "error");

for (const e of experiments) {
  for (const row of e.rows) {
    test(`${e.title} — ${row.label}`, () => {
      const c = clone(e.circuit);
      if (row.set) c.parts.find((p) => p.id === row.set.part).props[row.set.prop] = row.set.value;
      if (e.analysis === "transient") {
        const r = simulateTransient(c, e.duration);
        assert.equal(errors(r).length, 0, JSON.stringify(r.issues));
        for (const rd of row.readings) {
          const tr = r.traces.find((t) => t.id === rd.part);
          const got = sampleAt(r.times, tr.values, rd.at);
          assert.ok(withinTol(rd, got), `${rd.label}: got ${fmt(got, rd.unit, 5)}, expected ${fmt(rd.expected, rd.unit, 5)} ±${rd.tol * 100}%`);
        }
      } else {
        const r = simulateDc(c);
        assert.equal(errors(r).length, 0, JSON.stringify(r.issues));
        for (const rd of row.readings) {
          const got = r.parts[rd.part].reading;
          assert.ok(withinTol(rd, got), `${rd.label}: got ${fmt(got, rd.unit, 5)}, expected ${fmt(rd.expected, rd.unit, 5)} ±${rd.tol * 100}%`);
        }
      }
    });
  }
}

test("Ohm's law: 9 V / 1 kΩ = 9 mA, plus the voltmeter's 10 MΩ loading (0.9 µA)", () => {
  const r = simulateDc(experiments[0].circuit);
  assert.ok(Math.abs(r.parts.a1.reading - (0.009 + 9 / 10e6)) < 1e-9, String(r.parts.a1.reading));
});

test("LED experiment: the LED is on and glowing", () => {
  const r = simulateDc(experiments.find((e) => e.slug === "led-current-limiting").circuit);
  assert.equal(r.parts.d1.on, true);
  assert.ok(r.parts.d1.glow > 0.5);
});

test("battery terminals wired together → short-circuit error", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("r", "resistor", 0, 4)], wires: [W("b:+", "b:-")] });
  assert.ok(errors(r).some((i) => /short circuit/i.test(i.message)));
});

test("battery shorted through a closed switch → overload error", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("s", "switch", 0, 4, { closed: true })], wires: [W("b:+", "s:1"), W("s:2", "b:-")] });
  assert.ok(errors(r).some((i) => /would have to deliver/.test(i.message)));
});

test("ammeter straight across an ideal battery → unsolvable short", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("m", "ammeter", 0, 4)], wires: [W("b:+", "m:+"), W("m:COM", "b:-")] });
  assert.equal(r.ok, false);
  assert.ok(errors(r).some((i) => /short circuit/i.test(i.message)));
});

test("LED straight from 5 V without a resistor → burn-out error", () => {
  const r = simulateDc({ parts: [P("u", "arduino", 0, 10), P("d", "led", 0, 0)], wires: [W("u:5V", "d:A"), W("d:K", "u:GND2")] });
  assert.ok(errors(r).some((i) => /burn out/.test(i.message)));
});

test("LED reversed stays off", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("r", "resistor", 0, 4, { r: 470 }), P("d", "led", 6, 4)], wires: [W("b:+", "r:1"), W("r:2", "d:K"), W("d:A", "b:-")] });
  assert.equal(r.parts.d.on, false);
  assert.ok(Math.abs(r.parts.d.i) < 1e-6);
});

test("resistor with both leads in one breadboard column → shorted warning", () => {
  const r = simulateDc({ parts: [P("bb", "breadboard", 0, 0), P("r", "resistor", 2, 3, {}, 1), P("b", "battery", -6, 4)], wires: [W("b:+", "bb:a3"), W("b:-", "bb:j3")] });
  // rotated resistor: (2,3) → (2,7) = a3 and e3, same strip
  assert.ok(r.issues.some((i) => /shorted out/.test(i.message)));
});

test("loose lead → warning, circuit still solves", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("r", "resistor", 0, 6)], wires: [W("b:+", "r:1")] });
  assert.ok(r.issues.some((i) => i.level === "warning" && /not connected/.test(i.message)));
  assert.equal(errors(r).length, 0);
});

test("over-power resistor → warning", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0, { v: 12 }), P("r", "resistor", 0, 6, { r: 330, watt: 0.25 })], wires: [W("b:+", "r:1"), W("r:2", "b:-")] });
  assert.ok(r.issues.some((i) => /rating/.test(i.message)));
});

test("potentiometer at 25 % divides 10 V to 7.5 V on the wiper (measured to −)", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0, { v: 10 }), P("p", "pot", 0, 6, { r: 10000, pos: 25 }), P("v", "voltmeter", 0, 12)], wires: [W("b:+", "p:A"), W("p:B", "b:-"), W("p:W", "v:+"), W("v:COM", "b:-")] });
  assert.ok(Math.abs(r.parts.v.reading - 7.5) < 0.01, String(r.parts.v.reading));
});

test("same input → identical output (deterministic)", () => {
  const c = experiments[4].circuit;
  assert.deepEqual(simulateDc(clone(c)).parts, simulateDc(clone(c)).parts);
});

test("save / reload keeps exact pin connectivity", () => {
  for (const e of experiments) {
    const a = connect(e.circuit), b = connect(JSON.parse(JSON.stringify(e.circuit)));
    assert.deepEqual([...a.netOf], [...b.netOf]);
  }
});

test("fmt uses engineering prefixes", () => {
  assert.equal(fmt(0.00409, "A"), "4.09 mA");
  assert.equal(fmt(4700, "Ω"), "4.7 kΩ");
  assert.equal(fmt(9, "V"), "9 V");
});

// ——— Non-linear and instrument models against independent references ———
import { BC547, D1N4007, ldrOhms } from "../lib/lab/engine.ts";

test("1N4007 + 1 kΩ from 9 V matches the diode equation solved by bisection", () => {
  const nvt = D1N4007.n * 0.025852;
  const f = (i) => 9 - i * (1000 + D1N4007.rs) - nvt * Math.log(i / D1N4007.is + 1);
  let lo = 1e-9, hi = 0.009;
  for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("r", "resistor", 0, 6), P("d", "diode", 6, 6)], wires: [W("b:+", "r:1"), W("r:2", "d:A"), W("d:K", "b:-")] });
  assert.ok(Math.abs(r.parts.d.i - lo) / lo < 1e-6, `${r.parts.d.i} vs ${lo}`);
});

test("BC547 in the active region: Ic / Ib ≈ βF", () => {
  const r = simulateDc({ parts: [P("b", "battery", 0, 0), P("rb", "resistor", 0, 6, { r: 1e6 }), P("rc", "resistor", 0, 10, { r: 1000 }), P("q", "npn", 8, 8)], wires: [W("b:+", "rb:1"), W("rb:2", "q:B"), W("b:+", "rc:1"), W("rc:2", "q:C"), W("q:E", "b:-")] });
  assert.equal(r.parts.q.mode, "active");
  assert.ok(Math.abs(r.parts.q.i / r.parts.q.pins.Ib - BC547.bf) / BC547.bf < 0.01, String(r.parts.q.i / r.parts.q.pins.Ib));
});

test("bench supply current-limits (CC) into a heavy load", () => {
  const r = simulateDc({ parts: [P("ps", "supply", 0, 0, { v: 12, limit: 0.1 }), P("r", "resistor", 0, 4, { r: 10 })], wires: [W("ps:+", "r:1"), W("r:2", "ps:-")] });
  assert.equal(r.parts.ps.mode, "CC");
  assert.ok(Math.abs(r.parts.ps.i - 0.1) < 1e-9 && Math.abs(r.parts.ps.v - 1) < 1e-6, `${r.parts.ps.i} A, ${r.parts.ps.v} V`);
});

test("function generator sine (2 Vpp, 50 Ω) into 1 kΩ peaks at 1 × 1000/1050 V", () => {
  const r = simulateTransient({ parts: [P("fg", "fgen", 0, 0, { wave: "sine", freq: 1000, vpp: 2 }), P("r", "resistor", 0, 4), P("v", "voltmeter", 0, 10)], wires: [W("fg:+", "r:1"), W("r:2", "fg:-"), W("r:1", "v:+"), W("r:2", "v:COM")] }, 0.002, 2000);
  const peak = Math.max(...r.traces.find((t) => t.id === "v").values);
  assert.ok(Math.abs(peak - 1000 / 1050) < 0.002, String(peak));
});

test("LDR follows R = 15 kΩ · (lux / 10)^−0.6", () => {
  assert.ok(Math.abs(ldrOhms(10) - 15000) < 1e-6);
  assert.ok(Math.abs(ldrOhms(1000) - 15000 * 100 ** -0.6) < 1e-6);
  assert.ok(Math.abs(ldrOhms(0.1) - 15000 * 0.01 ** -0.6) < 1e-6); // ≈ 238 kΩ, still under the 1 MΩ dark limit
});

test("push button conducts only while pressed", () => {
  const c = (pressed) => ({ parts: [P("b", "battery", 0, 0), P("k", "button", 0, 4, { pressed }), P("r", "resistor", 0, 8)], wires: [W("b:+", "k:1"), W("k:2", "r:1"), W("r:2", "b:-")] });
  assert.ok(Math.abs(simulateDc(c(false)).parts.r.i) < 1e-9);
  assert.ok(Math.abs(simulateDc(c(true)).parts.r.i - 0.009) < 1e-6);
});
