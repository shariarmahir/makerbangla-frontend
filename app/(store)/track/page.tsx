import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrder } from "@/components/track/track-order";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Track your order",
  description: `Check where your ${site.name} order is: confirmed, packed, with the courier or delivered.`,
  alternates: { canonical: "/track" },
};

async function Tracker({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id } = await searchParams;
  const initial = typeof id === "string" && /^MB-[A-Za-z0-9-]{4,20}$/.test(id) ? id.toUpperCase() : undefined;
  return <TrackOrder initialId={initial} />;
}

export default function TrackPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-4xl rounded-[26px] bg-white p-6 shadow-[0_30px_60px_-40px_rgb(14_31_77/0.5)] ring-1 ring-line sm:p-10">
        <h1 className="mb-6 text-[clamp(1.8rem,3.4vw,2.4rem)] leading-none font-black tracking-tight text-tile-navy">Track your order</h1>
        <Suspense fallback={<TrackOrder />}>
          <Tracker searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
