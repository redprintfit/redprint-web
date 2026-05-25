import { type Org } from "@/lib/content/orgs";

/**
 * Community leaderboard. Highlighted org swaps to whichever org the
 * landing-page carousel currently has active.
 */
export function CommunityView({ org }: { org: Org }) {
  const accent = org.primaryColor;

  return (
    <div className="flex h-full flex-col bg-[#1c0d0e] text-white">
      {/* Top bar */}
      <div className="flex items-center gap-1.5 px-2.5 pb-2 pt-7">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[8px] text-white/60">
          ?
        </div>
        <div className="flex h-5 flex-1 items-center gap-1 rounded-full bg-white/5 px-2 text-[8px] text-white/40">
          <span>⌕</span>
          <span>Search people…</span>
        </div>
        <div className="rounded-full bg-emerald-500/90 px-2 py-[3px] text-[8px] font-medium text-white">
          Create +
        </div>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-around px-2 pt-1">
        <Podium
          rank="2"
          rankColor="bg-zinc-400"
          letter="N"
          fill="#4B2A6B"
          name="Niagara"
          place="Niagara, NY"
          amount="-480.3k lbs"
          height="h-[100px]"
        />
        <Podium
          rank="1"
          rankColor="bg-amber-400"
          letter={org.shortName}
          fill={accent}
          name={org.name}
          place={`${org.name.split(" ")[0]}, PA`}
          amount="-360.2k lbs"
          height="h-[115px]"
          active
        />
        <Podium
          rank="3"
          rankColor="bg-amber-700"
          letter="W"
          fill="#7a6a3a"
          name="Waverley O…"
          place="Waltham, MA"
          amount="-563.6k lbs"
          height="h-[100px]"
        />
      </div>

      {/* List rows */}
      <div className="mt-2 space-y-1 px-2.5">
        <ListRow
          rank="4"
          name="University of Missouri-S…"
          sub="St. Louis, MO"
          amount="-695.9k"
          dotBg="#dde2e8"
        />
        <ListRow
          rank="5"
          name="Clemson University"
          sub="Clemson, SC"
          amount="-828.9k"
          dotBg="#7B4F2C"
        />
      </div>

      {/* Activity */}
      <div className="mt-2 flex-1 overflow-hidden px-2.5">
        <div className="text-[8px] text-white/40">Activity at {org.name}</div>

        <div className="mt-1 space-y-1">
          <div className="rounded-md bg-black/40 p-2">
            <div
              className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              <span>⚐ Workout Completed</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-[9px] italic text-white/50">
                Untitled workout
              </span>
              <span className="flex gap-1">
                <MuscleDot />
                <MuscleDot />
                <MuscleDot />
                <span className="text-[7px] text-white/40">›</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[7px] text-white/40">
              <span>•))</span>
              <span>Self-tracked</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-md bg-black/30 px-2 py-1.5">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: accent }}
            />
            <span className="text-[9px] text-white/80">dan.p</span>
            <span className="ml-auto flex gap-1.5 text-[8px] text-white/40">
              <span>♡</span>
              <span>💬</span>
              <span>⋯</span>
            </span>
          </div>

          <div className="rounded-md bg-black/40 p-2">
            <div
              className="flex items-center justify-between text-[7.5px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              <span>⚐ Workout Completed</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between">
              <span className="text-[9px] font-semibold text-white">Push</span>
              <span className="flex gap-1">
                <MuscleDot />
                <MuscleDot />
                <MuscleDot />
                <span className="text-[7px] text-white/40">›</span>
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[7px] text-white/40">
              <span>☐</span>
              <span>Pre-planned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div
        className="relative flex items-end justify-around px-2 pb-2 pt-3"
        style={{ backgroundColor: `${accent}55` }}
      >
        <Tab label="Track" icon="↗" />
        <Tab label="Workouts" icon="🏋" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-md"
            style={{ backgroundColor: accent }}
          >
            ✶
          </div>
        </div>
        <div className="w-7" />
        <Tab label="Community" icon="✶" active />
        <Tab label="Profile" icon="●" />
      </div>
    </div>
  );
}

function Podium({
  rank,
  rankColor,
  letter,
  fill,
  name,
  place,
  amount,
  height,
  active,
}: {
  rank: string;
  rankColor: string;
  letter: string;
  fill: string;
  name: string;
  place: string;
  amount: string;
  height: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center rounded-xl ${active ? "ring-1 ring-emerald-400/80" : ""} px-1 pb-1 ${height} justify-between`}
      style={{
        background: active
          ? "linear-gradient(180deg, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.04) 100%)"
          : "rgba(0,0,0,0.5)",
        width: 62,
      }}
    >
      {/* Rank badge */}
      <div className="absolute -top-1 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center">
        <div
          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border border-white/40 text-[7px] font-bold text-white ${rankColor}`}
        >
          {rank}
        </div>
      </div>

      {/* Logo disc */}
      <div className="mt-3 flex flex-col items-center">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-sm"
          style={{ backgroundColor: fill }}
        >
          {letter}
        </div>
        <div className="mt-1 text-[7.5px] font-semibold leading-tight">
          {name}
        </div>
        <div className="text-[6.5px] text-white/50 leading-tight">{place}</div>
      </div>

      <div className="text-[7.5px] font-semibold">
        {amount.split(" ")[0]}{" "}
        <span className="text-white/50">{amount.split(" ")[1]}</span>
      </div>
    </div>
  );
}

function ListRow({
  rank,
  name,
  sub,
  amount,
  dotBg,
}: {
  rank: string;
  name: string;
  sub: string;
  amount: string;
  dotBg: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-black/40 px-2 py-1">
      <span className="w-3 text-center text-[8px] text-white/40">{rank}</span>
      <div
        className="h-4 w-4 rounded-full"
        style={{ backgroundColor: dotBg }}
      />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-[8.5px] text-white/90">{name}</span>
        <span className="text-[6.5px] text-white/40">{sub}</span>
      </div>
      <span className="text-[8px] text-white/80">
        {amount}
        <span className="text-white/40"> lbs</span>
      </span>
    </div>
  );
}

function MuscleDot() {
  return <div className="h-3 w-3 rounded-full bg-white/10" />;
}

function Tab({
  label,
  icon,
  active,
}: {
  label: string;
  icon: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${active ? "text-white" : "text-white/40"}`}
    >
      <span className="text-[10px]">{icon}</span>
      <span className="text-[6.5px]">{label}</span>
    </div>
  );
}
