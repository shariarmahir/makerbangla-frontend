import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { articles, formatDate, type Article, type Topic } from "@/lib/data/articles";
import { cn } from "@/lib/utils";

export const topicTone: Record<Topic, string> = {
  Innovation: "bg-tile-blue text-white",
  "Future Tech": "bg-tile-navy text-tile-yellow",
  Learning: "bg-tile-yellow text-tile-navy",
  Research: "bg-tile-sky text-tile-navy",
};

export function TopicChip({ topic, className }: { topic: Topic; className?: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide uppercase", topicTone[topic], className)}>{topic}</span>;
}

export function ArticleCard({ a, sizes = "(min-width:1024px) 320px, (min-width:640px) 50vw, 100vw" }: { a: Article; sizes?: string }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-shadow hover:shadow-[0_18px_40px_-22px_rgb(0_0_0/0.35)]">
      <Link href={`/blog/${a.slug}`} tabIndex={-1} aria-hidden className="relative block aspect-16/10 overflow-hidden">
        <Image src={a.image} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        <TopicChip topic={a.topic} className="absolute top-3 left-3" />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-[14.5px] leading-snug font-extrabold text-ink">
          <Link href={`/blog/${a.slug}`} className="hover:text-brand-strong">{a.title}</Link>
        </h3>
        <p className="mt-auto flex items-center gap-3 text-[11.5px] text-subtle">
          <time dateTime={a.date}>{formatDate(a.date)}</time>
          <span className="flex items-center gap-1"><Clock className="size-3" /> {a.minutes} min read</span>
        </p>
      </div>
    </article>
  );
}

export function TechInsights() {
  const [lead, ...rest] = articles;
  return (
    <section aria-labelledby="insights-title" className="bg-soft py-10 sm:py-12">
      <div className="container-x">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 id="insights-title" className="section-title">Tech Insights &amp; Innovation</h2>
          <Link href="/blog" className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-strong hover:underline">
            All articles <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className="group relative isolate flex min-h-80 flex-col justify-end overflow-hidden rounded-2xl bg-tile-navy p-6 text-white sm:col-span-2 lg:row-span-2 lg:min-h-full lg:p-8">
            <Image src={lead.image} alt="" fill sizes="(min-width:1024px) 640px, 100vw" className="-z-10 object-cover opacity-70 transition-transform duration-700 ease-out group-hover:scale-105" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/60 to-ink/0" />
            <TopicChip topic={lead.topic} className="w-fit" />
            <h3 className="mt-3 max-w-xl text-[clamp(1.35rem,2.4vw,2rem)] leading-tight font-extrabold tracking-tight">
              <Link href={`/blog/${lead.slug}`} className="after:absolute after:inset-0">{lead.title}</Link>
            </h3>
            <p className="mt-2 line-clamp-2 max-w-lg text-[13.5px] text-white/80">{lead.excerpt}</p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-bold text-accent-yellow">
              Read article <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </article>
          {rest.slice(0, 4).map((a) => <ArticleCard key={a.slug} a={a} />)}
        </div>
      </div>
    </section>
  );
}
