import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
  alternates: { canonical: "/checkout" },
};

export default function CheckoutPage() {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Checkout</span>
      </nav>
      <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black tracking-tight">
        <span className="text-gradient">Checkout</span>
      </h1>
      <CheckoutForm />
    </div>
  );
}
