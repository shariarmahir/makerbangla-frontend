import type { Order } from "@/lib/order";
import { site } from "@/lib/site";

/** jsPDF's built-in fonts are Latin-1 only. */
const latin1 = (s: string) =>
  s.replace(/[–—]/g, "-").replace(/×/g, "x").replace(/≈/g, "~").replace(/Ω/g, "Ohm").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[^\x20-\xff]/g, "");

const money = (n: number) => `BDT ${new Intl.NumberFormat("en-IN").format(n)}`;

export async function downloadReceipt(order: Order) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16;
  let y = 20;

  doc.setFillColor(21, 125, 128);
  doc.rect(0, 0, W, 6, "F");

  doc.setFont("helvetica", "bold").setFontSize(20).setTextColor(32, 33, 36);
  doc.text(site.name, M, y);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(85, 90, 97);
  doc.text(latin1(`${site.address.street}, ${site.address.city} · ${site.phone} · ${site.email}`), M, y + 6);

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(32, 33, 36);
  doc.text("ORDER RECEIPT", W - M, y, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(85, 90, 97);
  doc.text(order.id, W - M, y + 6, { align: "right" });
  doc.text(new Date(order.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }), W - M, y + 11, { align: "right" });

  y += 24;
  doc.setDrawColor(230, 232, 235).line(M, y, W - M, y);
  y += 8;

  const block = (title: string, rows: string[], x: number) => {
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(85, 90, 97).text(title.toUpperCase(), x, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(32, 33, 36);
    rows.forEach((r, i) => doc.text(latin1(r), x, y + 6 + i * 5, { maxWidth: 82 }));
  };
  block("Customer", [order.customer.name, order.customer.phone, order.customer.email ?? ""].filter(Boolean), M);
  block("Delivery", [order.delivery.label, order.delivery.address ?? "", [order.delivery.area, order.delivery.city].filter(Boolean).join(", "), order.payment].filter(Boolean), W / 2 + 4);
  y += 34;

  // Items table
  doc.setFillColor(244, 245, 246).rect(M, y, W - 2 * M, 8, "F");
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(32, 33, 36);
  doc.text("Item", M + 3, y + 5.5);
  doc.text("Qty", 128, y + 5.5, { align: "right" });
  doc.text("Price", 156, y + 5.5, { align: "right" });
  doc.text("Total", W - M - 3, y + 5.5, { align: "right" });
  y += 13;
  doc.setFont("helvetica", "normal").setFontSize(9.5);
  for (const l of order.lines) {
    const name = doc.splitTextToSize(latin1(`${l.name} (${l.sku})`), 92) as string[];
    if (y + name.length * 4.5 > 270) { doc.addPage(); y = 20; }
    doc.text(name, M + 3, y);
    doc.text(String(l.qty), 128, y, { align: "right" });
    doc.text(money(l.price), 156, y, { align: "right" });
    doc.text(money(l.price * l.qty), W - M - 3, y, { align: "right" });
    y += name.length * 4.5 + 3;
  }

  y += 2;
  doc.setDrawColor(230, 232, 235).line(110, y, W - M, y);
  y += 7;
  const total = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(bold ? 12 : 10);
    doc.text(label, 128, y, { align: "right" });
    doc.text(value, W - M - 3, y, { align: "right" });
    y += bold ? 8 : 6;
  };
  total("Subtotal", money(order.subtotal));
  total("Delivery", order.delivery.fee ? money(order.delivery.fee) : "Free");
  total("Total", money(order.total), true);

  if (order.note) {
    y += 4;
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(85, 90, 97).text("NOTE", M, y);
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(32, 33, 36).text(doc.splitTextToSize(latin1(order.note), W - 2 * M), M, y + 5);
  }

  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(85, 90, 97);
  doc.text(latin1(`Thank you for shopping with ${site.name} - ${site.tagline}. ${site.domain}`), W / 2, 285, { align: "center" });

  doc.save(`${order.id}.pdf`);
}
