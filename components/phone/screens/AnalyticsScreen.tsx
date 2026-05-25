import { type Org } from "@/lib/content/orgs";

/**
 * Back fan phone: workout analytics / chart view (placeholder).
 */
export function AnalyticsScreen({ org }: { org: Org }) {
  const accent = org.primaryColor;

  return (
    <div className="flex h-full flex-col bg-neutral-950 px-3 pb-3 text-white">
      <div className="mt-2 text-[10px] font-medium text-white/80">What&apos;s your rival</div>
      <div className="text-[10px] font-medium text-white/80">time today?</div>

      <div className="mt-2 text-[8px] uppercase tracking-wide" style={{ color: accent }}>
        Here&apos;s your latest
      </div>
      <div className="text-[8px] text-white/60">90 minutes of run</div>
      <div className="text-[8px] text-white/60">your pace was</div>

      <div className="mt-2 text-[9px] font-semibold text-white">Chest Day</div>
      <div className="mt-1 space-y-0.5 text-[7.5px] text-white/70">
        <div>1. Barbell Bench Press</div>
        <div>135 lbs</div>
        <div>2. Banded Pull-up</div>
        <div>3. Dumbbell Curl</div>
        <div>4.</div>
      </div>

      <div className="mt-auto h-16 w-full rounded-md" style={{ backgroundColor: `${accent}55` }}>
        <div className="h-full w-full rounded-md bg-gradient-to-tr from-amber-500/40 via-transparent to-transparent" />
      </div>
    </div>
  );
}
