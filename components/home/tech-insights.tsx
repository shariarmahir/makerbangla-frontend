import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock } from "lucide-react";
import { MagicFace, MagicLink } from "@/components/ui/magic-button";
import { articles, formatDate, type Article, type Topic } from "@/lib/data/articles";
import { tones, type ToneName } from "@/lib/tones";
import { cn } from "@/lib/utils";

export const topicTone: Record<Topic, string> = {
  Innovation: "bg-tile-blue text-white",
  "Future Tech": "bg-tile-navy text-tile-yellow",
  Learning: "bg-tile-yellow text-tile-navy",
  Research: "bg-tile-sky text-tile-navy",
};

/** Card surface per topic (used where no explicit tone is passed, e.g. /blog). */
const topicCard: Record<Topic, ToneName> = { Innovation: "blue", "Future Tech": "navy", Learning: "yellow", Research: "sky" };

export function TopicChip({ topic, className }: { topic: Topic; className?: string }) {
  return <span className={cn("inline-block rounded-full px-2.5 py-1 text-[10.5px] font-extrabold tracking-wide uppercase", topicTone[topic], className)}>{topic}</span>;
}

/** Whole-card link: the title's link stretches over the card, with the focus ring drawn on the card. */
const cover = "outline-none after:absolute after:inset-0 after:z-10 focus-visible:after:ring-4";

export function ArticleCard({ a, tone, className, sizes = "(min-width:1024px) 320px, (min-width:640px) 50vw, 80vw" }: { a: Article; tone?: ToneName; className?: string; sizes?: string }) {
  const t = tones[tone ?? topicCard[a.topic]];
  return (
    <article className={cn("group relative flex flex-col rounded-[24px] p-2 transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgb(14_31_77/0.7)]", t.bg, className)}>
      <div className="relative aspect-16/10 overflow-hidden rounded-[18px] bg-black/10">
        <Image src={a.image} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        <span aria-hidden className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-black/10" />
        <TopicChip topic={a.topic} className="absolute top-3 left-3 shadow-[0_6px_16px_-6px_rgb(0_0_0/0.5)]" />
        <span aria-hidden className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white text-tile-navy shadow-[0_8px_20px_-8px_rgb(0_0_0/0.6)] transition-[rotate,background-color] duration-300 group-hover:rotate-45 group-hover:bg-tile-yellow">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-4 pb-3">
        <h3 className={cn("line-clamp-2 text-[15px] leading-snug font-extrabold text-balance", t.text)}>
          <Link href={`/blog/${a.slug}`} className={cn(cover, "after:rounded-[24px] focus-visible:after:ring-brand/60")}>{a.title}</Link>
        </h3>
        <p className={cn("mt-auto flex items-center justify-between gap-3 pt-4 text-[11.5px] font-semibold", t.muted)}>
          <time dateTime={a.date}>{formatDate(a.date)}</time>
          <span className="flex items-center gap-1 tabular-nums"><Clock aria-hidden className="size-3.5" /> {a.minutes} min read</span>
        </p>
      </div>
    </article>
  );
}

const rhythm: ToneName[] = ["yellow", "blue", "sky", "navy"];

export function TechInsights() {
  const [lead, ...rest] = articles;
  return (
    <section aria-labelledby="insights-title" className="bg-soft py-12 sm:py-16">
      <div className="container-x">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <h2 id="insights-title" className="section-title">Tech Insights &amp; Innovation</h2>
          <MagicLink href="/blog" variant="brand" size="sm">
            All articles <span className="tabular-nums opacity-80">· {articles.length}</span> <ArrowRight className="size-4" />
          </MagicLink>
        </div>

        <div className="reveal grid gap-4 lg:grid-cols-12">
          {/* Feature story: duotone photo on midnight, glass meta, 3D read button */}
          <article className="group/lead relative isolate flex min-h-[27rem] flex-col overflow-hidden rounded-[28px] bg-tile-midnight p-6 text-white shadow-[0_40px_80px_-50px_rgb(14_31_77/0.9)] sm:p-8 lg:col-span-6 lg:min-h-0">
            <Image src={lead.image} alt="" fill sizes="(min-width:1024px) 640px, 100vw" className="-z-20 object-cover saturate-[0.85] transition-transform duration-[1200ms] ease-out group-hover/lead:scale-[1.05]" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-tile-midnight via-tile-midnight/80 to-tile-midnight/5" />
            <span aria-hidden className="absolute -top-28 -right-24 -z-10 size-80 rounded-full bg-brand/45 blur-3xl" />
            <span aria-hidden className="absolute -bottom-32 -left-20 -z-10 size-72 rounded-full bg-tile-yellow/15 blur-3xl" />
            <span aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_top,black,transparent_70%)]" />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <TopicChip topic={lead.topic} className="shadow-[0_6px_18px_-6px_rgb(0_0_0/0.6)]" />
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white/90 ring-1 ring-white/20 backdrop-blur-md">
                <time dateTime={lead.date}>{formatDate(lead.date)}</time>
                <span aria-hidden className="size-1 rounded-full bg-tile-yellow" />
                <span className="flex items-center gap-1 tabular-nums"><Clock aria-hidden className="size-3.5" /> {lead.minutes} min read</span>
              </span>
            </div>

            <div className="mt-auto pt-24">
              <h3 className="max-w-xl text-[clamp(1.55rem,2.7vw,2.35rem)] leading-[1.1] font-black tracking-tight text-balance text-tile-yellow">
                <Link href={`/blog/${lead.slug}`} className={cn(cover, "after:rounded-[28px] focus-visible:after:ring-tile-yellow")}>{lead.title}</Link>
              </h3>
              <p className="mt-3 line-clamp-2 max-w-lg text-[14px] leading-relaxed text-white/80">{lead.excerpt}</p>
              <MagicFace variant="light" size="sm" className="mt-6">
                Read article <ArrowUpRight className="size-4 transition-transform group-hover/lead:translate-x-0.5 group-hover/lead:-translate-y-0.5" />
              </MagicFace>
            </div>
          </article>

          {/* Four more: snap rail on phones, 2×2 tiles from sm */}
          <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:p-0 lg:col-span-6 [&::-webkit-scrollbar]:hidden">
            {rest.slice(0, 4).map((a, i) => (
              <ArticleCard key={a.slug} a={a} tone={rhythm[i]} className="w-[80%] shrink-0 snap-start sm:w-auto" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
