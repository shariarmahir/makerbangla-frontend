import "server-only";
import { getProduct, productVisual } from "@/lib/catalog";
import type { LabProduct } from "@/components/lab/bench-panels";

/** Store products Lab Kitchen can link to (see `MODELS[*].product` and the jumper-wire row in `bom.ts`). */
const SLUGS = ["li-ion-18650-cell", "bench-power-supply", "diode-1n4007-pack", "bjt-transistor-kit", "function-generator", "digital-oscilloscope", "resistor-kit", "led-5mm-assorted", "capacitor-kit-electrolytic", "digital-multimeter", "breadboard-830", "arduino-uno-r3", "jumper-wire-set"];

export function labProducts(): Record<string, LabProduct> {
  const out: Record<string, LabProduct> = {};
  for (const slug of SLUGS) {
    const p = getProduct(slug);
    if (p) out[slug] = { slug, name: p.name, price: p.price, image: productVisual(slug).src, stock: p.stock };
  }
  return out;
}
