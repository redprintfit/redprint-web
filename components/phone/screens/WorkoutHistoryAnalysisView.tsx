"use client";

import { darken, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens (mirrors iOS ColorExtension.swift) ---------- */
const REDPRINT_DARK_GRAY = "rgb(50, 50, 50)";

/* ---------- Placeholder workout-history data ---------- */
const STATS = {
  totalWorkouts: 47,
  totalVolume: "124.3k",
  volPerWorkout: "2.6k",
};

const CAPTION =
  "You lift more per session than 74% of lifters globally — keep pushing.";

const SCATTER_CAPTION =
  "Conclusion: Longer sessions are translating into more volume — your body uses the extra time well.";

const BAR_CAPTION = "Volume is trending upward across recent sessions.";

// Scatter points — volume (y, lbs) vs duration (x, minutes). 12 points
// spread along a positive correlation, plus a few outliers.
const SCATTER_POINTS = [
  { x: 28, y: 8800 },
  { x: 32, y: 11200 },
  { x: 40, y: 13500 },
  { x: 45, y: 15800 },
  { x: 48, y: 14000 },
  { x: 52, y: 18500 },
  { x: 55, y: 16800 },
  { x: 60, y: 20300 },
  { x: 65, y: 22800 },
  { x: 68, y: 21000 },
  { x: 72, y: 24500 },
  { x: 78, y: 26800 },
];
const SCATTER_GLOBAL_X = 52;
const SCATTER_GLOBAL_Y = 15000;
const SCATTER_X_RANGE = [25, 80];
const SCATTER_Y_RANGE = [5000, 30000];

// Bar entries — 10 most-recent workouts, volume in lbs.
const BAR_ENTRIES = [
  16500, 14200, 17800, 19400, 18600, 21100, 22000, 20800, 24300, 26500,
];
const BAR_GLOBAL_AVG = 15000;
const BAR_USER_AVG = 20120;

/**
 * Workout history analytics — simplified port of
 * Redprint5/Views/Progress Page Files/Analytics/WorkoutHistoryAnalysisView.swift.
 *
 * Visual structure (top → bottom, scrollable inside the phone screen):
 *   1. Header: pinned avatar circle + "Workouts Analysis" + X close.
 *   2. Typed-text caption ("You lift more per session…").
 *   3. 3 stat cards: Total Workouts / Total Volume / Volume per Workout.
 *   4. Scatter chart card: dropdown row (Correlations + range), caption,
 *      and the chart itself with global-average reference lines.
 *   5. Bar chart card: dropdown row, caption, vertical bars w/ user-avg
 *      reference line.
 *
 * The native Swift view uses Apple Charts; we render the equivalent in
 * inline SVG so the layout stays self-contained.
 */
export function WorkoutHistoryAnalysisView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";
  // theme.pageBackground(for: orgColor) — same formula as the other
  // analytics view in this folder.
  const pageTint = isDark
    ? `${darken(orgColor, 65)}40`
    : `${darken(orgColor, 65)}1A`;

  return (
    <div
      className="light:bg-white light:text-black scrollbar-none flex h-full flex-col overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `linear-gradient(180deg, ${pageTint} 0%, transparent 100%)`,
      }}
    >
      <div className="flex flex-1 flex-col gap-3 overflow-hidden px-2.5 pt-7">
        <Header orgColor={orgColor} isDark={isDark} />
        <StatsRow isDark={isDark} />
        <Divider isDark={isDark} />
        <ScatterCard orgColor={orgColor} isDark={isDark} />
        <Divider isDark={isDark} />
        <BarCard orgColor={orgColor} isDark={isDark} />
      </div>
    </div>
  );
}

/* ============================================================
   Header — avatar pin + title + close
   ============================================================ */

function Header({ orgColor, isDark }: { orgColor: string; isDark: boolean }) {
  void isDark;
  return (
    <div className="flex flex-col gap-1.5 px-1">
      <div className="flex items-start gap-1.5">
        {/* Avatar "pin" — downward triangle + circle with org-colored
            stroke. Triangle indicates where the avatar is "anchored". */}
        <div className="relative flex h-[28px] w-[28px] items-center justify-center">
          <div
            className="absolute -bottom-[3px] left-1/2 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: `6px solid ${orgColor}`,
            }}
          />
          <div
            className="light:bg-white relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black"
            style={{
              border: `1.5px solid ${orgColor}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logos/redprint-emblem.png"
              alt=""
              className="h-[60%] w-[60%] opacity-75"
              draggable={false}
              style={{
                filter: "grayscale(1) brightness(1.5)",
              }}
            />
          </div>
        </div>
        <span
          className="flex-1 text-[13px] leading-tight"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
        >
          Workouts Analysis
        </span>
        <button className="light:text-black/65 px-0.5 text-[10px] text-white/65">
          ✕
        </button>
      </div>
      <div
        className="light:text-black/80 px-0.5 text-[8px] leading-snug text-white/80"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
      >
        {CAPTION}
      </div>
    </div>
  );
}

/* ============================================================
   Stats row — 3 cards
   ============================================================ */

function StatsRow({ isDark }: { isDark: boolean }) {
  const stroke = isDark ? "rgba(245, 241, 234, 0.25)" : "rgba(15, 15, 18, 0.25)";
  return (
    <div className="flex gap-1 px-1">
      <StatCard
        value={STATS.totalWorkouts.toString()}
        unit=""
        label="Total Workouts"
        icon={<DumbbellIcon />}
        stroke={stroke}
      />
      <StatCard
        value={STATS.totalVolume}
        unit="lbs"
        label="Total Volume"
        icon={<WeightIcon />}
        stroke={stroke}
      />
      <StatCard
        value={STATS.volPerWorkout}
        unit="lbs"
        label="Vol/Workout"
        icon={<DivideIcon />}
        stroke={stroke}
      />
    </div>
  );
}

function StatCard({
  value,
  unit,
  label,
  icon,
  stroke,
}: {
  value: string;
  unit: string;
  label: string;
  icon: React.ReactNode;
  stroke: string;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-0.5 rounded-[5px] p-1"
      style={{ border: `0.7px solid ${stroke}` }}
    >
      <div className="flex items-baseline justify-between gap-0.5">
        <span
          className="light:text-black text-[10px] leading-none text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {value}
        </span>
        {unit && (
          <span className="light:text-black/50 text-[6px] text-white/50">
            {unit}
          </span>
        )}
        <span className="light:text-black/65 ml-auto h-2 w-2 text-white/65">
          {icon}
        </span>
      </div>
      <div className="light:text-black/65 text-[6px] leading-tight text-white/65">
        {label}
      </div>
    </div>
  );
}

/* ============================================================
   Divider
   ============================================================ */

function Divider({ isDark }: { isDark: boolean }) {
  void isDark;
  return <div className="light:bg-black/15 mx-1 h-px bg-white/15" />;
}

/* ============================================================
   Scatter chart card
   ============================================================ */

function ScatterCard({
  orgColor,
  isDark,
}: {
  orgColor: string;
  isDark: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-1">
      {/* Dropdown row — Correlation + range pills */}
      <div className="flex items-center gap-1">
        <span
          className="light:text-black flex-1 text-[8px] font-semibold text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Correlations
        </span>
        <DropdownPill label="Volume vs Duration" isDark={isDark} />
        <DropdownPill label="Last 10" isDark={isDark} />
      </div>
      {/* Caption */}
      <div className="flex items-start gap-1">
        <div
          className="mt-0.5 w-[1.5px] self-stretch"
          style={{ backgroundColor: orgColor }}
        />
        <div className="light:text-black/65 text-[6.5px] leading-snug text-white/65">
          <span className="font-bold">Conclusion: </span>
          {SCATTER_CAPTION.replace("Conclusion: ", "")}
        </div>
      </div>
      {/* Y-axis label */}
      <div className="light:text-black/50 px-0.5 text-[6px] text-white/50">
        Volume (lbs)
      </div>
      {/* Chart */}
      <ScatterChart orgColor={orgColor} isDark={isDark} />
      {/* X-axis label */}
      <div className="light:text-black/50 text-center text-[6px] text-white/50">
        Duration (minutes)
      </div>
    </div>
  );
}

function ScatterChart({
  orgColor,
  isDark,
}: {
  orgColor: string;
  isDark: boolean;
}) {
  const W = 240;
  const H = 75;
  const PAD = { l: 18, r: 4, t: 4, b: 12 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const xToPx = (x: number) =>
    PAD.l +
    ((x - SCATTER_X_RANGE[0]) / (SCATTER_X_RANGE[1] - SCATTER_X_RANGE[0])) *
      innerW;
  const yToPx = (y: number) =>
    PAD.t +
    innerH -
    ((y - SCATTER_Y_RANGE[0]) / (SCATTER_Y_RANGE[1] - SCATTER_Y_RANGE[0])) *
      innerH;
  const gridColor = isDark
    ? "rgba(245, 241, 234, 0.1)"
    : "rgba(15, 15, 18, 0.1)";
  const refColor = isDark
    ? "rgba(245, 241, 234, 0.25)"
    : "rgba(15, 15, 18, 0.25)";
  const textColor = isDark
    ? "rgba(245, 241, 234, 0.55)"
    : "rgba(15, 15, 18, 0.55)";

  // Y axis tick values
  const yTicks = [5000, 10000, 15000, 20000, 25000, 30000];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
    >
      {/* Grid + y-axis ticks */}
      {yTicks.map((tick) => {
        const y = yToPx(tick);
        return (
          <g key={`y-${tick}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth={0.5}
            />
            <text
              x={PAD.l - 2}
              y={y + 2}
              textAnchor="end"
              fontSize="5"
              fill={textColor}
              fontFamily="system-ui, sans-serif"
            >
              {tick / 1000}K
            </text>
          </g>
        );
      })}
      {/* X-axis ticks */}
      {[30, 45, 60, 75].map((tick) => (
        <text
          key={`x-${tick}`}
          x={xToPx(tick)}
          y={H - 4}
          textAnchor="middle"
          fontSize="5"
          fill={textColor}
          fontFamily="system-ui, sans-serif"
        >
          {tick}
        </text>
      ))}
      {/* Global average vertical reference line */}
      <line
        x1={xToPx(SCATTER_GLOBAL_X)}
        x2={xToPx(SCATTER_GLOBAL_X)}
        y1={PAD.t}
        y2={H - PAD.b}
        stroke={refColor}
        strokeWidth={0.6}
        strokeDasharray="2 1.5"
      />
      {/* Global average horizontal reference line */}
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={yToPx(SCATTER_GLOBAL_Y)}
        y2={yToPx(SCATTER_GLOBAL_Y)}
        stroke={refColor}
        strokeWidth={0.6}
        strokeDasharray="2 1.5"
      />
      <text
        x={W - PAD.r - 1}
        y={yToPx(SCATTER_GLOBAL_Y) - 1.5}
        textAnchor="end"
        fontSize="4"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
      >
        Global avg
      </text>
      {/* Scatter points */}
      {SCATTER_POINTS.map((p, i) => (
        <circle
          key={i}
          cx={xToPx(p.x)}
          cy={yToPx(p.y)}
          r={2}
          fill={orgColor}
        />
      ))}
    </svg>
  );
}

/* ============================================================
   Bar chart card
   ============================================================ */

function BarCard({ orgColor, isDark }: { orgColor: string; isDark: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 px-1">
      <div className="flex items-center gap-1">
        <span
          className="light:text-black flex-1 text-[8px] font-semibold text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Recent Workouts
        </span>
        <DropdownPill label="Volume" isDark={isDark} />
        <DropdownPill label="Last 10" isDark={isDark} />
      </div>
      <div className="flex items-start gap-1">
        <div
          className="mt-0.5 w-[1.5px] self-stretch"
          style={{ backgroundColor: orgColor }}
        />
        <div className="light:text-black/65 text-[6.5px] leading-snug text-white/65">
          {BAR_CAPTION}
        </div>
      </div>
      <BarChart orgColor={orgColor} isDark={isDark} />
    </div>
  );
}

function BarChart({ orgColor, isDark }: { orgColor: string; isDark: boolean }) {
  const W = 240;
  const H = 60;
  const PAD = { l: 18, r: 4, t: 4, b: 8 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxVal = 28000;
  const gridColor = isDark
    ? "rgba(245, 241, 234, 0.1)"
    : "rgba(15, 15, 18, 0.1)";
  const refColor = isDark
    ? "rgba(245, 241, 234, 0.35)"
    : "rgba(15, 15, 18, 0.35)";
  const textColor = isDark
    ? "rgba(245, 241, 234, 0.55)"
    : "rgba(15, 15, 18, 0.55)";

  const barGap = 2;
  const barW = (innerW - barGap * (BAR_ENTRIES.length - 1)) / BAR_ENTRIES.length;
  const yToPx = (v: number) => PAD.t + innerH - (v / maxVal) * innerH;
  const yTicks = [0, 10000, 20000];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
    >
      {/* Y grid + labels */}
      {yTicks.map((tick) => {
        const y = yToPx(tick);
        return (
          <g key={`yb-${tick}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y}
              y2={y}
              stroke={gridColor}
              strokeWidth={0.5}
            />
            <text
              x={PAD.l - 2}
              y={y + 2}
              textAnchor="end"
              fontSize="5"
              fill={textColor}
              fontFamily="system-ui, sans-serif"
            >
              {tick === 0 ? "0" : `${tick / 1000}K`}
            </text>
          </g>
        );
      })}
      {/* Bars */}
      {BAR_ENTRIES.map((v, i) => {
        const x = PAD.l + i * (barW + barGap);
        const y = yToPx(v);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={H - PAD.b - y}
            fill={orgColor}
            rx={1}
          />
        );
      })}
      {/* User average reference line */}
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={yToPx(BAR_USER_AVG)}
        y2={yToPx(BAR_USER_AVG)}
        stroke={refColor}
        strokeWidth={0.6}
        strokeDasharray="2 1.5"
      />
      <text
        x={W - PAD.r - 1}
        y={yToPx(BAR_USER_AVG) - 1.5}
        textAnchor="end"
        fontSize="4"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
      >
        Your avg
      </text>
      {/* X labels — just oldest / newest indicator */}
      <text
        x={PAD.l + barW / 2}
        y={H - 2}
        textAnchor="middle"
        fontSize="4.5"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
      >
        Oldest
      </text>
      <text
        x={W - PAD.r - barW / 2}
        y={H - 2}
        textAnchor="middle"
        fontSize="4.5"
        fill={textColor}
        fontFamily="system-ui, sans-serif"
      >
        Newest
      </text>
    </svg>
  );
}

void BAR_GLOBAL_AVG;

/* ============================================================
   Dropdown pill
   ============================================================ */

function DropdownPill({ label, isDark }: { label: string; isDark: boolean }) {
  void isDark;
  return (
    <button
      className="light:bg-black/[0.05] light:text-black flex items-center gap-0.5 rounded-[4px] bg-white/[0.08] px-1 py-0.5 text-[6.5px] font-semibold text-white"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      <span className="leading-none">{label}</span>
      <svg
        viewBox="0 0 16 16"
        className="h-1.5 w-1.5 fill-current opacity-50"
      >
        <polygon points="3,6 8,3 13,6 13,7 8,4 3,7" />
        <polygon points="3,10 8,13 13,10 13,9 8,12 3,9" />
      </svg>
    </button>
  );
}

/* ============================================================
   Stat-card icons
   ============================================================ */

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full fill-current">
      <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
      <rect x="3" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="5.5" y="7" width="5" height="2" rx="0.5" />
      <rect x="11" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="13.5" y="6" width="2.5" height="4" rx="0.5" />
    </svg>
  );
}

function WeightIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full fill-current">
      <path d="M2 6 H14 L13 13 H3 Z" />
      <path d="M6 4 a2 2 0 0 1 4 0 v2 h-1 v-2 a1 1 0 0 0 -2 0 v2 h-1 z" />
    </svg>
  );
}

function DivideIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full fill-current">
      <circle cx="8" cy="3" r="1.5" />
      <rect x="2" y="7" width="12" height="2" rx="0.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  );
}

// `darken` kept in the import surface for future card-tint customisation;
// REDPRINT_DARK_GRAY likewise retained for parity with the iOS palette.
void darken;
void REDPRINT_DARK_GRAY;
