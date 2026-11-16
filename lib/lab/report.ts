import { ENGINE, fmt } from "./engine";
import { withinTol, type Experiment } from "./experiments";
import type { BomRow } from "./bom";
import type { Project } from "./projects";
import { site } from "@/lib/site";

/** jsPDF's built-in fonts are Latin-1 only. */
const latin1 = (s: string) =>
  s.replace(/[–—]/g, "-").replace(/×/g, "x").replace(/Ω/g, "Ohm").replace(/µ/g, "u").replace(/τ/g, "tau").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/−/g, "-").replace(/[^\x20-\xff]/g, "");

export type ReportStatus = { label: string; value: string }[];

/** Lab report PDF: experiment, observations against expected values, statuses, conclusion and parts list. */
export async function downloadReport(p: Project, e: Experiment | undefined, status: ReportStatus, bom: BomRow[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16, BOTTOM = 280;
  let y = 20;
  const need = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = 20;
    }
  };
  const para = (text: string, size = 9.5, color: [number, number, number] = [60, 64, 72]) => {
    doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...color);
    for (const line of doc.splitTextToSize(latin1(text), W - 2 * M) as string[]) {
      need(5);
      doc.text(line, M, y);
      y += size * 0.46;
    }
    y += 1.5;
  };
  const heading = (text: string) => {
    need(12);
    y += 3;
    doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(26, 73, 175);
    doc.text(latin1(text), M, y);
    y += 6;
  };

  doc.setFillColor(26, 73, 175).rect(0, 0, W, 7, "F");
  doc.setFillColor(255, 216, 80).rect(0, 7, W, 1.5, "F");
  doc.setFont("helvetica", "bold").setFontSize(19).setTextColor(20, 24, 31);
  doc.text(latin1(e ? e.title : p.name), M, y + 4);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90, 96, 106);
  y += 11;
  doc.text(latin1(`${site.name} Lab Kitchen · lab report · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`), M, y);
  y += 5;
  doc.text(latin1(`Student: ${p.student || "-"}   ·   Project: ${p.name}`), M, y);
  y += 4;

  if (e) {
    heading("Objective");
    for (const o of e.outcomes) para(`• ${o}`);
    heading("Theory");
    for (const t of e.theory) para(t);
    para(`Formula: ${e.formula}`, 9.5, [20, 24, 31]);
    heading("Observations");
    const cols = [M, M + 44, M + 92, M + 122, M + 152];
    need(8);
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(20, 24, 31);
    ["Condition", "Quantity", "Measured", "Expected", "Result"].forEach((h, i) => doc.text(h, cols[i], y));
    y += 2;
    doc.setDrawColor(210, 214, 222).line(M, y, W - M, y);
    y += 4.5;
    doc.setFont("helvetica", "normal");
    for (const row of e.rows) for (const rd of row.readings) {
      need(6);
      const got = p.observations[row.id]?.[rd.part];
      const ok = got !== undefined && withinTol(rd, got);
      doc.setTextColor(60, 64, 72);
      doc.text(latin1(row.label), cols[0], y);
      doc.text(latin1(rd.label), cols[1], y);
      doc.text(latin1(got === undefined ? "not recorded" : fmt(got, rd.unit, 4)), cols[2], y);
      doc.text(latin1(`${fmt(rd.expected, rd.unit, 4)} ±${Math.round(rd.tol * 100)}%`), cols[3], y);
      if (got === undefined) doc.setTextColor(140, 140, 140);
      else if (ok) doc.setTextColor(26, 73, 175);
      else doc.setTextColor(200, 60, 55);
      doc.text(got === undefined ? "-" : ok ? "Matched" : `Off ${(((got - rd.expected) / rd.expected) * 100).toFixed(1)}%`, cols[4], y);
      y += 5.5;
    }
  }

  heading("Status");
  for (const s of status) para(`${s.label}: ${s.value}`);

  heading("Conclusion");
  para(p.conclusion.trim() || "(not written)");

  heading("Parts list");
  for (const r of bom) para(`${r.qty} × ${r.label}${r.parts.length ? ` (${r.parts.join(", ")})` : ""}`);

  need(14);
  y += 4;
  doc.setDrawColor(210, 214, 222).line(M, y, W - M, y);
  y += 5;
  para(`Simulated with ${ENGINE.name} ${ENGINE.version} (${ENGINE.method}). A completed simulation shows how the modelled circuit behaves; it is not proof of a physical measurement, and component models are approximations.`, 8, [120, 124, 132]);

  doc.save(`${latin1(e ? e.slug : p.name).replace(/[^\w-]+/g, "-") || "lab"}-report.pdf`);
}
