import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/home/tech-insights";
import { articles } from "@/lib/data/articles";

export const metadata: Metadata = {
  title: "Tech Insights — Innovation, Future Tech, Learning & Research",
  description: "Short, practical explainers for engineering students: edge AI, RISC-V, datasheets, oscilloscope measurements, IoT research ideas and wide-bandgap power electronics.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <div className="container-x py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">Tech Insights</span>
      </nav>
      <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black tracking-tight">Tech Insights &amp; Innovation</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => <ArticleCard key={a.slug} a={a} sizes="(min-width:1024px) 420px, (min-width:640px) 50vw, 100vw" />)}
      </div>
    </div>
  );
}
