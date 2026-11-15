import { site } from "@/lib/site";

/** Client-side PDFs for the dashboard (jsPDF loads on click). Brand colours: navy #1A49AF, yellow #FFD850. */

const latin1 = (s: string) => s.replace(/[–—]/g, "-").replace(/×/g, "x").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/·/g, "-").replace(/→/g, "->").replace(/[^\x20-\xff]/g, "");
const money = (n: number) => `BDT ${new Intl.NumberFormat("en-IN").format(Math.round(n))}`;
const NAVY: [number, number, number] = [26, 73, 175];
const YELLOW: [number, number, number] = [255, 216, 80];
const INK: [number, number, number] = [14, 31, 77];
const SUBTLE: [number, number, number] = [74, 86, 121];

async function start(title: string, ref: string, date: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16;
  doc.setFillColor(...NAVY).rect(0, 0, W, 30, "F");
  doc.setFillColor(...YELLOW).rect(0, 30, W, 1.6, "F");
  doc.setFont("helvetica", "bold").setFontSize(19).setTextColor(...YELLOW).text(site.name, M, 15);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(255, 255, 255);
  doc.text(latin1(`${site.address.street}, ${site.address.city}  |  ${site.phone}  |  ${site.email}`), M, 22);
  doc.setFont("helvetica", "bold").setFontSize(15).setTextColor(255, 255, 255).text(title.toUpperCase(), W - M, 14, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).text(latin1(`${ref}  |  ${date}`), W - M, 21, { align: "right" });
  return { doc, W, M };
}

function footer(doc: import("jspdf").jsPDF, W: number) {
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...SUBTLE);
  doc.text(latin1(`${site.name} - ${site.tagline}  |  ${site.url.replace(/^https?:\/\//, "")}`), W / 2, 288, { align: "center" });
}

export type DocInput = {
  kind: "Invoice" | "Receipt" | "Quotation";
  ref: string;
  date: string; // ISO
  customer: { name: string; phone: string; email?: string };
  address?: string;
  lines: { name: string; qty: number; price: number; sku?: string }[];
  delivery?: { label: string; fee: number };
  paid?: number;
  note?: string;
};

export async function documentPdf(d: DocInput) {
  const date = new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dhaka" });
  const { doc, W, M } = await start(d.kind, d.ref, date);
  let y = 44;
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...SUBTLE).text(d.kind === "Quotation" ? "PREPARED FOR" : "BILL TO", M, y);
  doc.setFont("helvetica", "bold").setFontSize(11.5).setTextColor(...INK).text(latin1(d.customer.name), M, y + 6);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...SUBTLE);
  [d.customer.phone, d.customer.email, d.address].filter(Boolean).forEach((r, i) => doc.text(latin1(String(r)), M, y + 11.5 + i * 5, { maxWidth: 100 }));
  if (d.delivery) {
    doc.setFont("helvetica", "bold").setFontSize(8.5).text("DELIVERY", W - M, y, { align: "right" });
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...INK).text(latin1(d.delivery.label), W - M, y + 6, { align: "right" });
  }

  y += 32;
  doc.setFillColor(242, 246, 252).roundedRect(M, y - 5.5, W - 2 * M, 9, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...SUBTLE);
  doc.text("ITEM", M + 3, y).text("QTY", 132, y, { align: "right" }).text("PRICE", 160, y, { align: "right" }).text("AMOUNT", W - M - 3, y, { align: "right" });
  y += 9;
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...INK);
  for (const l of d.lines) {
    const rows = doc.splitTextToSize(latin1(l.name + (l.sku ? `  (${l.sku})` : "")), 100) as string[];
    doc.text(rows, M + 3, y);
    doc.text(String(l.qty), 132, y, { align: "right" }).text(money(l.price), 160, y, { align: "right" }).text(money(l.qty * l.price), W - M - 3, y, { align: "right" });
    y += rows.length * 5 + 3;
    doc.setDrawColor(223, 231, 242).line(M, y - 3, W - M, y - 3);
    if (y > 250) {
      doc.addPage();
      y = 24;
    }
  }

  const subtotal = d.lines.reduce((n, l) => n + l.qty * l.price, 0);
  const total = subtotal + (d.delivery?.fee ?? 0);
  const rows: [string, string, boolean?][] = [["Subtotal", money(subtotal)]];
  if (d.delivery) rows.push([`Delivery (${d.delivery.label})`, d.delivery.fee ? money(d.delivery.fee) : "Free"]);
  rows.push(["Total", money(total), true]);
  if (d.paid !== undefined) rows.push(["Paid", money(d.paid)], ["Balance due", money(Math.max(0, total - d.paid)), true]);
  y += 3;
  for (const [k, v, bold] of rows) {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 11 : 9.5).setTextColor(...INK);
    doc.text(latin1(k), 150, y, { align: "right" }).text(v, W - M - 3, y, { align: "right" });
    y += bold ? 7 : 5.5;
  }
  if (d.kind === "Receipt" && d.paid !== undefined && d.paid >= total) {
    doc.setDrawColor(...NAVY).setLineWidth(0.8).roundedRect(M, y - 14, 34, 11, 2, 2, "S");
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...NAVY).text("PAID", M + 17, y - 6.5, { align: "center" });
  }
  if (d.note) {
    y += 6;
    doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(...SUBTLE).text("NOTE", M, y);
    doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...INK).text(doc.splitTextToSize(latin1(d.note), W - 2 * M) as string[], M, y + 5.5);
  }
  if (d.kind === "Quotation") {
    doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(...SUBTLE).text("Prices valid for 15 days from the date above. Delivery and taxes as stated.", M, 276);
  } else {
    doc.setFont("helvetica", "italic").setFontSize(9).setTextColor(...SUBTLE).text("Thank you for building with Makerbangla.", M, 276);
  }
  footer(doc, W);
  doc.save(`${d.kind.toLowerCase()}-${d.ref}.pdf`);
}

export type ReportInput = {
  title: string;
  period: string;
  kpis: [string, string][];
  tables: { title: string; head: string[]; rows: (string | number)[][] }[];
};

/** Business summary report (weekly / monthly / yearly). */
export async function reportPdf(r: ReportInput) {
  const { doc, W, M } = await start("Business report", r.title, r.period);
  let y = 44;
  const colW = (W - 2 * M - 9) / 4;
  r.kpis.forEach(([k, v], i) => {
    const x = M + (i % 4) * (colW + 3), yy = y + Math.floor(i / 4) * 22;
    doc.setFillColor(...(i % 2 ? YELLOW : NAVY)).roundedRect(x, yy, colW, 18, 2.5, 2.5, "F");
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...(i % 2 ? INK : ([255, 255, 255] as [number, number, number]))).text(latin1(k), x + 3.5, yy + 6);
    doc.setFont("helvetica", "bold").setFontSize(11.5).text(latin1(v), x + 3.5, yy + 13.5);
  });
  y += Math.ceil(r.kpis.length / 4) * 22 + 8;
  for (const t of r.tables) {
    if (y > 240) {
      doc.addPage();
      y = 24;
    }
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...INK).text(latin1(t.title), M, y);
    y += 6;
    const cw = (W - 2 * M) / t.head.length;
    doc.setFillColor(242, 246, 252).rect(M, y - 4.5, W - 2 * M, 7, "F");
    doc.setFontSize(8).setTextColor(...SUBTLE);
    t.head.forEach((h, i) => doc.text(latin1(h.toUpperCase()), i ? M + cw * (i + 1) - 2 : M + 2, y, { align: i ? "right" : "left" }));
    y += 6;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...INK);
    for (const row of t.rows) {
      row.forEach((c, i) => doc.text(latin1(String(c)).slice(0, 48), i ? M + cw * (i + 1) - 2 : M + 2, y, { align: i ? "right" : "left" }));
      y += 5.5;
      if (y > 275) {
        doc.addPage();
        y = 24;
      }
    }
    y += 6;
  }
  footer(doc, W);
  doc.save(`makerbangla-report-${r.title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

/** Opens the user's email app with a pre-filled message (sending from the server needs the backend). */
export function mailto(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
