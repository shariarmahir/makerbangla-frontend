import { Mail, MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";

export function ContactCta() {
  return (
    <section aria-labelledby="contact-cta-title" className="container-x reveal py-10 sm:py-12">
      <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-2xl bg-linear-to-r from-brand-strong via-brand to-tile-sky px-6 py-7 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between">
        <span aria-hidden className="absolute -top-16 -left-10 -z-10 size-48 rounded-full bg-white/10" />
        <div>
          <h2 id="contact-cta-title" className="text-[clamp(1.35rem,2.4vw,1.9rem)] leading-tight font-extrabold tracking-tight">
            Need parts for your lab or project?
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/90">
            <MapPin className="size-4 shrink-0" /> {site.address.street}, {site.address.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`tel:${site.phoneIntl}`} className="btn-pill h-11 bg-white px-6 text-ink shadow-sm hover:shadow-md">
            <Phone className="size-4" /> {site.phone}
          </a>
          <a href={`mailto:${site.email}`} className="btn-pill h-11 px-6 text-white ring-1 ring-white/60 hover:bg-white/10">
            <Mail className="size-4" /> Email us
          </a>
        </div>
      </div>
    </section>
  );
}
