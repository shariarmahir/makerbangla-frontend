import { applications, categories, interfaces, products, voltages } from "@/lib/data/catalog";
import { FinderForm, type FinderField, type FinderRow } from "./finder-form";

const fields: FinderField[] = [
  { name: "category", label: "Select Category", options: categories.map((c) => [c.slug, c.name]) },
  { name: "voltage", label: "Voltage / Rating", options: voltages.map((v) => [v, v]) },
  { name: "interface", label: "Interface / Protocol", options: interfaces.map((v) => [v, v]) },
  { name: "application", label: "Application", options: applications.map((v) => [v, v]) },
];

// Compact index so the client can count matches live without shipping the catalog.
const index: FinderRow[] = products.map((p) => [p.category, p.voltage ? [p.voltage] : [], p.interfaces ?? [], p.applications]);

export function ComponentFinder() {
  return (
    <section aria-labelledby="finder-title" className="relative overflow-hidden bg-accent-yellow text-ink">
      <span aria-hidden className="absolute inset-y-0 right-0 w-1/3 bg-[repeating-linear-gradient(-45deg,rgb(0_0_0/0.045)_0_14px,transparent_14px_28px)]" />
      <FinderForm fields={fields} index={index} />
    </section>
  );
}
