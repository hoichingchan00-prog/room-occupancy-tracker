import { OccupancyDashboard } from "@/components/OccupancyDashboard";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8 flex flex-col gap-4 border-b border-stone-300/70 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--chalk)]">
            學博教育
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-stone-900 sm:text-5xl">
            Room occupancy
          </h1>
        </div>
        <p className="rounded-full bg-[var(--chalk)] px-4 py-2 text-center text-xs font-medium tracking-wide text-[var(--paper)]">
          Live floor board
        </p>
      </header>

      <OccupancyDashboard />
    </main>
  );
}