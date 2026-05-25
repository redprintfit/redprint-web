import { type Org } from "@/lib/content/orgs";

/**
 * Front-and-center phone: community / leaderboard view.
 * Placeholder layout based on the target screenshot. Real layout fills in
 * once iOS source code is shared.
 */
export function CommunityScreen({ org }: { org: Org }) {
  const accent = org.primaryColor;

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-white">
      {/* Top bar: search + create */}
      <div className="flex items-center gap-2 px-3 pb-3 pt-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[9px] text-white/60">
          <span>⌕</span>
          <span>Search people…</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-medium text-white">
          Create +
        </div>
      </div>

      {/* Podium row */}
      <div className="flex items-end justify-around px-3 pb-3">
        <PodiumBadge place="3" letter="W" color="#7a6a3a" label="Waverley O…" amount="-452.4k lbs" />
        <PodiumBadge place="1" letter={org.shortName} color={accent} label={org.name} amount="-360.2k lbs" tall />
        <PodiumBadge place="2" letter="N" color="#4B2A6B" label="Niagara" amount="-360.2k lbs" />
      </div>

      {/* List rows */}
      <div className="space-y-1.5 px-3">
        <LeaderRow rank="4" name="University of Missouri-S…" amount="-556.7k lbs" />
        <LeaderRow rank="5" name="Clemson University" amount="-740.6k lbs" />
      </div>

      {/* Activity section */}
      <div className="mt-3 flex-1 overflow-hidden px-3">
        <div className="text-[9px] text-white/50">Activity at {org.name}</div>
        <div
          className="mt-1.5 flex items-center justify-between rounded-md px-2 py-1.5"
          style={{ backgroundColor: `${accent}33` }}
        >
          <span className="text-[8.5px] font-medium uppercase tracking-wide" style={{ color: accent }}>
            ⚐ New to Redprint
          </span>
          <span className="text-[10px] text-white/40">›</span>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
          <div className="h-5 w-5 rounded-full bg-white/20" />
          <span className="text-[9px] text-white/80">stmiller</span>
          <span className="ml-auto flex gap-1 text-white/40">
            <span>♡</span>
            <span>💬</span>
            <span>⊕</span>
          </span>
        </div>
        <div className="mt-1.5 flex flex-col rounded-md px-2 py-1.5" style={{ backgroundColor: `${accent}22` }}>
          <span className="text-[8.5px] font-medium uppercase tracking-wide" style={{ color: accent }}>
            ⚐ Workout Completed
          </span>
          <span className="mt-0.5 text-[9px] italic text-white/60">Untitled workout</span>
        </div>
      </div>

      {/* Bottom tab bar — accent tinted */}
      <div
        className="flex items-center justify-around px-2 pb-3 pt-2"
        style={{ backgroundColor: `${accent}55` }}
      >
        <TabIcon label="Trainer" />
        <TabIcon label="Track" />
        <div
          className="-mt-3 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          ✶
        </div>
        <TabIcon label="Community" active />
        <TabIcon label="Profile" />
      </div>
    </div>
  );
}

function PodiumBadge({
  place,
  letter,
  color,
  label,
  amount,
  tall,
}: {
  place: string;
  letter: string;
  color: string;
  label: string;
  amount: string;
  tall?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex items-center justify-center rounded-md text-[14px] font-bold text-white ${tall ? "h-14 w-14" : "h-12 w-12"}`}
        style={{ backgroundColor: color }}
      >
        {letter}
        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-400 text-[7px] font-bold text-black">
          {place}
        </span>
      </div>
      <span className="mt-1 text-[8px] text-white/80">{label}</span>
      <span className="text-[7.5px] text-white/40">{amount}</span>
    </div>
  );
}

function LeaderRow({ rank, name, amount }: { rank: string; name: string; amount: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-white/5 px-2 py-1.5">
      <span className="w-3 text-center text-[9px] text-white/50">{rank}</span>
      <div className="h-4 w-4 rounded-full bg-white/15" />
      <span className="text-[9px] text-white/80">{name}</span>
      <span className="ml-auto text-[8.5px] text-white/50">{amount}</span>
    </div>
  );
}

function TabIcon({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${active ? "text-white" : "text-white/40"}`}>
      <div className="h-3 w-3 rounded-sm bg-current opacity-70" />
      <span className="text-[7px]">{label}</span>
    </div>
  );
}
