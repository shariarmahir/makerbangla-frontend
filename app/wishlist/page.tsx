import type { Metadata } from "next";
import Link from "next/link";
import { WishlistGrid } from "./wishlist-grid";

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Wishlist</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Your Wishlist</h1>
      <WishlistGrid />
    </div>
  );
}
