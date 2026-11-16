import { fmt, ledColor, num, type Circuit, type Part } from "./engine";
import { MODELS, type ProductLink } from "./models";

/**
 * Bill of materials from a circuit: parts grouped by model and value, each mapped to a store product with an
 * honest match label. Nothing is substituted silently — rows without a product say so.
 */

export type BomRow = { key: string; label: string; qty: number; parts: string[]; product: ProductLink | null };
export type CartPick = { slug: string; qty: number; match: ProductLink["match"]; note: string; rows: string[] };

function group(p: Part): { key: string; label: string } {
  switch (p.kind) {
    case "resistor": return { key: `r:${num(p, "r")}:${num(p, "watt")}`, label: `Resistor ${fmt(num(p, "r"), "Ω")}, ${num(p, "watt")} W` };
    case "led": return { key: `led:${ledColor(p)}`, label: `LED 5 mm, ${ledColor(p)}` };
    case "capacitor": return { key: `c:${num(p, "c")}:${num(p, "vmax")}`, label: `Electrolytic capacitor ${fmt(num(p, "c") * 1e-6, "F")}, ${num(p, "vmax")} V` };
    case "battery": return { key: `b:${num(p, "v")}`, label: `Battery ${fmt(num(p, "v"), "V")}` };
    case "supply": return { key: "ps", label: "Bench power supply" };
    case "pot": return { key: `rv:${num(p, "r")}`, label: `Potentiometer ${fmt(num(p, "r"), "Ω")}` };
    default: return { key: p.kind, label: MODELS[p.kind].name };
  }
}

export function buildBom(c: Circuit): { rows: BomRow[]; picks: CartPick[] } {
  const rows = new Map<string, BomRow>();
  for (const p of c.parts) {
    if (p.kind === "ground") continue;
    const g = group(p);
    const row = rows.get(g.key) ?? { ...g, qty: 0, parts: [], product: MODELS[p.kind].product(p) };
    row.qty++;
    row.parts.push(p.label);
    rows.set(g.key, row);
  }
  if (c.wires.length) rows.set("wires", { key: "wires", label: "Jumper wires", qty: c.wires.length, parts: [], product: { slug: "jumper-wire-set", match: "kit", note: "120-piece set (M-M / M-F / F-F) covers these." } });

  // Kits are bought once; exact parts (boards, supplies, meters) once per piece, except one multimeter can be moved between points.
  const picks = new Map<string, CartPick>();
  for (const row of rows.values()) {
    if (!row.product) continue;
    const { slug, match, note } = row.product;
    const pick = picks.get(slug) ?? { slug, qty: 0, match, note, rows: [] };
    pick.rows.push(row.label);
    pick.qty = match === "kit" || slug === "digital-multimeter" ? 1 : pick.qty + row.qty;
    picks.set(slug, pick);
  }
  return { rows: [...rows.values()], picks: [...picks.values()] };
}
