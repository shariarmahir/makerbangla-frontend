import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderReceipt } from "./order-receipt";

export const metadata: Metadata = {
  title: "Order Placed",
  robots: { index: false, follow: false },
};

export default function OrderSuccessPage() {
  return (
    <div className="container-x py-8 sm:py-12">
      <Suspense fallback={<div className="mx-auto h-[32rem] max-w-3xl animate-pulse rounded-2xl bg-soft" />}>
        <OrderReceipt />
      </Suspense>
    </div>
  );
}
