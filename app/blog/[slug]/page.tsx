import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { ArticleCard, TopicChip } from "@/components/home/tech-insights";
import { JsonLd } from "@/components/json-ld";
import { ProductCard } from "@/components/product/product-card";
import { articles, formatDate, getArticle } from "@/lib/data/articles";
import { getProduct } from "@/lib/catalog";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/blog/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.excerpt, url: `/blog/${a.slug}`, publishedTime: a.date, images: [{ url: a.image }] },
  };
}

async function ArticleBody({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const parts = (a.products ?? []).map(getProduct).filter((p) => p !== undefined);
  const more = articles.filter((x) => x.slug !== a.slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          description: a.excerpt,
          datePublished: a.date,
          image: `${site.url}${a.image}`,
          author: { "@type": "Organization", name: site.name },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/brand/mark.png` } },
        }}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap gap-1.5 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link><span aria-hidden>/</span>
        <Link href="/blog" className="hover:text-ink">Tech Insights</Link><span aria-hidden>/</span>
        <span className="line-clamp-1 text-ink">{a.title}</span>
      </nav>

      <article className="mx-auto max-w-3xl">
        <TopicChip topic={a.topic} />
        <h1 className="mt-3 text-[clamp(1.7rem,3.6vw,2.6rem)] leading-tight font-black tracking-tight">{a.title}</h1>
        <p className="mt-3 flex items-center gap-3 text-[12.5px] text-subtle">
          <time dateTime={a.date}>{formatDate(a.date)}</time>
          <span className="flex items-center gap-1"><Clock className="size-3.5" /> {a.minutes} min read</span>
          <span>{site.name} Team</span>
        </p>
        <div className="relative mt-6 aspect-16/9 overflow-hidden rounded-2xl">
          <Image src={a.image} alt="" fill preload sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        </div>
        <p className="mt-8 text-[17px] leading-relaxed font-semibold text-ink">{a.excerpt}</p>
        <div className="mt-5 space-y-5 text-[15px] leading-[1.75] text-ink-2">
          {a.body.map((para) => <p key={para.slice(0, 40)}>{para}</p>)}
        </div>
      </article>

      {parts.length > 0 && (
        <section className="mt-12" aria-labelledby="parts-title">
          <h2 id="parts-title" className="section-title mb-5">Parts used in this article</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-14 pt-12 sm:grid-cols-4 sm:gap-x-5">
            {parts.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}

      <section className="mt-12" aria-labelledby="more-title">
        <h2 id="more-title" className="section-title mb-5">Keep reading</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {more.map((x) => <ArticleCard key={x.slug} a={x} />)}
        </div>
      </section>
    </>
  );
}

export default function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <div className="container-x py-6 sm:py-8">
      <Suspense fallback={<div className="mx-auto h-[36rem] max-w-3xl animate-pulse rounded-2xl bg-soft" />}>
        <ArticleBody params={params} />
      </Suspense>
    </div>
  );
}
