import Link from "next/link";

export type LegalSection = { heading: string; body: React.ReactNode };

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <div className="container-x max-w-3xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 text-[11.5px] text-subtle">
        <Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <span className="text-ink">{title}</span>
      </nav>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 text-[12px] text-subtle">Last updated {updated}</p>
      <div className="mt-8 space-y-7 text-[14px] leading-relaxed text-ink-2 [&_a]:text-brand-strong [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:space-y-1">
        {sections.map((s, i) => (
          <section key={s.heading}>
            <h2 className="mb-2 text-[16px] font-bold text-ink">{i + 1}. {s.heading}</h2>
            {s.body}
          </section>
        ))}
      </div>
    </div>
  );
}
