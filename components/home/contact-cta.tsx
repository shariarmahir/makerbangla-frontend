import { Mail, MapPin, Phone } from "lucide-react";
import { MagicAnchor } from "@/components/ui/magic-button";
import { site } from "@/lib/site";

export function ContactCta() {
  return (
    <section aria-labelledby="contact-cta-title" className="container-x reveal py-10 sm:py-12">
      <div className="relative isolate flex flex-col gap-5 overflow-hidden rounded-2xl bg-linear-to-r from-tile-deep via-brand-strong to-brand px-6 py-7 text-white sm:px-10 lg:flex-row lg:items-center lg:justify-between">
        <span aria-hidden className="absolute -top-16 -left-10 -z-10 size-48 rounded-full bg-white/10" />
        <div>
          <h2 id="contact-cta-title" className="text-[clamp(1.35rem,2.4vw,1.9rem)] leading-tight font-extrabold tracking-tight">
            Need parts for your lab or project?
          </h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/90">
            <MapPin className="size-4 shrink-0" /> {site.address.street}, {site.address.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <MagicAnchor href={`tel:${site.phoneIntl}`} variant="accent" rainbow>
            <Phone className="size-4" /> {site.phone}
          </MagicAnchor>
          <MagicAnchor href={`mailto:${site.email}`} variant="light">
            <Mail className="size-4" /> Email us
          </MagicAnchor>
        </div>
      </div>
    </section>
  );
}
