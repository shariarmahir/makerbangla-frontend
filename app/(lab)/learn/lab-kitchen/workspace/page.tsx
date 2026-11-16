import type { Metadata } from "next";
import { Suspense } from "react";
import { Workbench } from "@/components/lab/workbench";
import { labProducts } from "@/lib/lab/store-products";

export const metadata: Metadata = {
  title: "Lab Kitchen bench",
  description: "Assemble, wire and simulate circuits in your browser.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/learn/lab-kitchen" },
};

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-tile-midnight" />}>
      <Workbench products={labProducts()} />
    </Suspense>
  );
}
