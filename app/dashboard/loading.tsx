/** Instant navigation between dashboard pages: the frame stays, this skeleton streams while the page loads. */
export default function DashboardLoading() {
  const block = "animate-pulse rounded-[20px] bg-white ring-1 ring-line";
  return (
    <div aria-busy="true" aria-label="Loading" className="space-y-5">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-line/70" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`${block} h-36`} />)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div className={`${block} h-80`} />
        <div className={`${block} h-80`} />
      </div>
      <div className={`${block} h-64`} />
    </div>
  );
}
