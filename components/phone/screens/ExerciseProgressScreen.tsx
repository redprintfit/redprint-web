import { type Org } from "@/lib/content/orgs";

/**
 * Middle fan phone: Exercise Progress / comparison view (placeholder).
 */
export function ExerciseProgressScreen({ org }: { org: Org }) {
  const accent = org.primaryColor;

  return (
    <div className="flex h-full flex-col bg-neutral-950 px-3 pb-3 text-white">
      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-5 w-5 items-center justify-center rounded-md" style={{ backgroundColor: accent }}>
          <span className="text-[8px]">◎</span>
        </div>
        <span className="text-[11px] font-semibold">Exercise Progress</span>
      </div>
      <p className="mt-1 text-[8px] text-white/50">Compare exercises over time</p>
      <p className="text-[8px] text-white/50">your personal records.</p>

      <div className="mt-3 flex gap-2">
        <Stat label="Total Sessions" value="728" />
        <Stat label="Volume This…" value="121k" />
      </div>

      <div className="mt-3 text-[8.5px] font-medium text-white/80">Exercise Comparison</div>
      <div className="mt-1.5 flex-1 rounded-md bg-white/5 p-2">
        <div className="h-full w-full rounded bg-gradient-to-br from-white/5 to-transparent" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-md bg-white/5 p-2">
      <div className="text-[12px] font-bold text-white">{value}</div>
      <div className="text-[7px] text-white/50">{label}</div>
    </div>
  );
}
