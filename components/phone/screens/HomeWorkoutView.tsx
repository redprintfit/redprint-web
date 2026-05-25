import { type Org } from "@/lib/content/orgs";

/**
 * HomeView + workout tracking — active workout session with expandable
 * exercise card showing set details.
 */
export function HomeWorkoutView(_props: { org: Org }) {
  return (
    <div className="flex h-full flex-col bg-black px-2.5 pb-2 pt-7 text-white">
      {/* Workout summary card */}
      <div className="rounded-2xl bg-[#f4c8c2] p-2 text-black">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-[#a37c52]" />
          <div className="flex-1 text-[9.5px] font-bold">Chest Power Session</div>
          <div className="text-[8px] font-semibold">00:00:06</div>
          <div className="text-[9px] text-black/60">✕</div>
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <Stat value="21.9k" unit="lbs" icon="🏋" />
          <Stat value="23" unit="sets" icon="↻" />
          <Stat value="11.5" unit="reps" icon="÷" />
        </div>
        <div className="mt-0.5 text-center text-[8px] text-black/40">⌄</div>
      </div>

      {/* Action buttons */}
      <div className="mt-1.5 flex gap-1">
        <ActionBtn bg="bg-sky-500" title="Finish" sub="Complete workout" icon="🏁" />
        <ActionBtn bg="bg-emerald-500" title="All Exercises" sub="Browse exercise database" icon="+" />
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-700 text-[10px]">
          🔧
        </div>
      </div>

      {/* Exercises header */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[9px] font-semibold">Exercises (7)</span>
        <div className="rounded-md border border-white/15 px-1.5 py-0.5 text-[7.5px] text-white/70">
          Collapse all
        </div>
      </div>

      {/* First exercise card (expanded) */}
      <div className="mt-1.5 flex-1 overflow-hidden rounded-xl bg-zinc-900/80 px-2 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold">Barbell Bench Press</span>
          <span className="text-[8px] text-white/60">⌃</span>
        </div>

        {/* Action icons row */}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600">
            <span className="text-[7px] text-white">▶</span>
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/8 text-[7px]">
            ✎
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/8 text-[7px]">
            ⤡
          </div>
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[7px]">
            ⋯
          </div>
        </div>

        {/* Volume stats */}
        <div className="mt-1.5 flex items-end justify-around text-center">
          <div>
            <div className="text-[10px] font-bold">4.32k</div>
            <div className="text-[6.5px] text-white/40">Current volume</div>
          </div>
          <div>
            <div className="text-[10px] font-bold">3.04k</div>
            <div className="text-[6.5px] text-white/40">Last</div>
          </div>
          <div>
            <div className="text-[10px] font-bold">3.34k</div>
            <div className="text-[6.5px] text-white/40">Average</div>
          </div>
        </div>

        {/* Sets table */}
        <div className="mt-1.5">
          <div className="grid grid-cols-[14px_1fr_1fr_14px] gap-1 px-1 text-center text-[6.5px] text-white/40">
            <span />
            <span>Repetitions</span>
            <span>Weight</span>
            <span />
          </div>
          <div className="mt-0.5 space-y-0.5">
            <SetRow num="1" lastLabel="Last" rep="8" weight="135" highlight />
            <SetRow num="2" lastLabel="Last" rep="8" weight="135" highlight />
            <SetRow num="3" rep="8" weight="135" />
            <SetRow num="4" rep="8" weight="135" />
          </div>

          <div className="mt-1 flex items-center justify-between rounded-md bg-emerald-900/40 px-2 py-1 text-[8px]">
            <span className="text-emerald-400">Add set</span>
            <span className="text-emerald-400">⊕</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  value,
  unit,
  icon,
}: {
  value: string;
  unit: string;
  icon: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-md bg-white/15 px-1.5 py-1 text-[8px]">
      <span>
        <span className="font-bold">{value}</span> <span className="text-black/60">{unit}</span>
      </span>
      <span className="text-[7px] text-black/40">{icon}</span>
    </div>
  );
}

function ActionBtn({
  bg,
  title,
  sub,
  icon,
}: {
  bg: string;
  title: string;
  sub: string;
  icon: string;
}) {
  return (
    <div className={`flex flex-1 items-center justify-between rounded-md ${bg} px-1.5 py-1 text-white`}>
      <div className="leading-tight">
        <div className="text-[8.5px] font-bold">{title}</div>
        <div className="text-[6.5px] opacity-80">{sub}</div>
      </div>
      <span className="text-[9px]">{icon}</span>
    </div>
  );
}

function SetRow({
  num,
  lastLabel,
  rep,
  weight,
  highlight,
}: {
  num: string;
  lastLabel?: string;
  rep: string;
  weight: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[14px_1fr_1fr_14px] items-center gap-1 rounded px-1 py-0.5 text-center text-[8px] ${highlight ? "bg-blue-950/60" : "bg-black/30"}`}
    >
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold">{num}</span>
        {lastLabel && (
          <span className="text-[5.5px] text-sky-400">{lastLabel}</span>
        )}
      </div>
      <div className="text-[9px] font-bold">{rep}</div>
      <div className="text-[9px] font-bold">
        {weight}
        <span className="text-[5.5px] text-white/40"> lbs</span>
      </div>
      <div className="text-[7px] text-white/40">✕</div>
    </div>
  );
}
