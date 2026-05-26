"use client";

import { darken, lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens from iOS ColorExtension.swift ---------- */
const REDPRINT_BLUE = "rgb(10, 125, 250)";
const REDPRINT_GREEN = "rgb(0, 210, 85)";
const REDPRINT_MID_GRAY = "rgb(176, 176, 176)";
const REDPRINT_DARK_GRAY = "rgb(50, 50, 50)";

/**
 * HomeView + WorkoutTracking — active workout session.
 * Faithful port of `workoutInfoView`, `workoutActionsView`, and the
 * expanded `WDDRViewTracking` card from
 * Redprint5/Views/Track Page Files/HomeView+WorkoutTracking.swift.
 *
 * Org-color theming (mirrors iOS usage):
 *   - Page background          → darken(orgColor, 65%) @ 25% opacity
 *   - Workout-info card bg     → lighten(orgColor, 60%) — produces the
 *                                 peach/pink seen in the Swarthmore shot
 *   - NFC cluster button       → orgColor (full)
 *   - Set-row "Last" highlight → redprint blue (constant, not org)
 */
export function HomeWorkoutView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const orgDark65 = darken(orgColor, 65);
  const orgLight60 = lighten(orgColor, 60);
  const isDark = useTheme() === "dark";

  // iOS workout-info card flips formula:
  //   dark -> lighten(orgColor, 60%) — soft peach/pink against dark bg
  //   light -> darken(orgColor, 65%) — deep, saturated org color on cream
  // Label color inverts to keep contrast.
  const infoCardBg = isDark ? orgLight60 : darken(orgColor, 65);
  const infoLabelColor = isDark ? "#1a1a1a" : "#ffffff";

  // Page tint matches iOS: darken(orgColor, 65) @ 25% dark / 10% light.
  const tintAlpha = isDark ? "40" : "1A";

  return (
    <div
      className="light:bg-white light:text-black relative flex h-full flex-col overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `linear-gradient(180deg, ${orgDark65}${tintAlpha} 0%, ${orgDark65}${isDark ? "1f" : "0d"} 100%)`,
      }}
    >

      <div className="flex-1 overflow-hidden px-2 pt-7">
        {/* ---------- Workout info card ---------- */}
        <div
          className="rounded-[14px] px-1.5 pb-1.5 pt-1.5"
          style={{ backgroundColor: infoCardBg, color: infoLabelColor }}
        >
          {/* Name + timer row */}
          <div className="flex items-center gap-1.5 px-0.5">
            <div
              className="h-[26px] w-[26px] flex-shrink-0 rounded-full border bg-zinc-700"
              style={{ borderColor: `${infoLabelColor}33` }}
            />
            <div
              className="flex-1 text-[10px] font-bold leading-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Chest Power Session
            </div>
            <div
              className="text-[8.5px] font-semibold"
              style={{ color: `${infoLabelColor}a6` }}
            >
              00:00:06
            </div>
            <button className="px-1 text-[10px]" style={{ color: infoLabelColor }}>
              ✕
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-1.5 flex gap-1">
            <InfoStatCell value="21.9k" unit="lbs" icon={<Dumbbell />} labelColor={infoLabelColor} />
            <InfoStatCell value="23" unit="sets" icon={<Refresh />} labelColor={infoLabelColor} />
            <InfoStatCell value="11.5" unit="reps" icon={<Divide />} labelColor={infoLabelColor} />
          </div>

          {/* Chevron */}
          <div
            className="mt-0.5 flex justify-center pb-0.5"
            style={{ color: `${infoLabelColor}80` }}
          >
            <ChevronDown />
          </div>
        </div>

        {/* ---------- Action buttons row ---------- */}
        <div className="mt-1.5 flex gap-1">
          <FinishButton />
          <AllExercisesButton />
          <WrenchButton />
        </div>

        {/* ---------- Exercises section header ---------- */}
        <div className="mt-2 flex items-center justify-between px-1 opacity-50">
          <div className="text-[10px] font-semibold">
            Exercises
            <span> (7)</span>
          </div>
          <button className="border-fg-base/25 rounded-[5px] border px-1.5 py-0.5 text-[7.5px] font-semibold">
            Collapse all
          </button>
        </div>

        {/* ---------- Expanded exercise card (Barbell Bench Press) ---------- */}
        <ExerciseCard org={org} orgDark65={orgDark65} isDark={isDark} />
      </div>

      {/* ---------- Floating NFC cluster button (peeks at bottom) ---------- */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <div
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full shadow-[0_2px_3px_rgba(0,0,0,0.25),0_-2px_3px_rgba(255,255,255,0.08)]"
          style={{ backgroundColor: orgColor }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/redprint-emblem.png"
            alt="Redprint"
            className="h-[55%] w-[55%]"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Workout-info card
   ============================================================ */

function InfoStatCell({
  value,
  unit,
  icon,
  labelColor,
}: {
  value: string;
  unit: string;
  icon: React.ReactNode;
  labelColor: string;
}) {
  return (
    <div
      className="flex flex-1 items-end justify-between rounded-[8px] px-1.5 py-1"
      style={{
        backgroundColor: `${labelColor}1F`,
        border: `1px solid ${labelColor}33`,
        color: labelColor,
      }}
    >
      <div className="flex items-baseline gap-0.5">
        <span
          className="text-[12px] leading-none"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {value}
        </span>
        <span className="text-[6.5px]" style={{ color: `${labelColor}80` }}>
          {unit}
        </span>
      </div>
      <span style={{ color: `${labelColor}73` }}>{icon}</span>
    </div>
  );
}

/* ============================================================
   Action buttons
   ============================================================ */

function FinishButton() {
  return (
    <button
      className="flex h-[34px] flex-1 flex-col justify-center rounded-[8px] px-1.5 text-left"
      style={{
        background: "linear-gradient(to top right, #2563eb, #22d3ee)",
        boxShadow: "0 3px 0 0 rgb(29, 78, 216)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Finish
        </span>
        <CheckeredFlag />
      </div>
      <span className="text-[6.5px] text-white/75 leading-tight">
        Complete workout
      </span>
    </button>
  );
}

function AllExercisesButton() {
  return (
    <button
      className="flex h-[34px] flex-1 flex-col justify-center rounded-[8px] px-1.5 text-left"
      style={{
        background: "linear-gradient(to top right, #047857, #22c55e)",
        boxShadow: "0 3px 0 0 rgb(20, 83, 45)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold text-white"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          All Exercises
        </span>
        <PlusIcon />
      </div>
      <span className="text-[6.5px] text-white/75 leading-tight">
        Browse exercise database
      </span>
    </button>
  );
}

function WrenchButton() {
  return (
    <button
      className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px]"
      style={{
        backgroundColor: REDPRINT_MID_GRAY,
        boxShadow: `0 3px 0 0 ${darken(REDPRINT_MID_GRAY, 25)}`,
      }}
    >
      <WrenchIcon />
    </button>
  );
}

/* ============================================================
   Exercise card (expanded)
   ============================================================ */

function ExerciseCard({
  org,
  orgDark65,
  isDark,
}: {
  org: Org;
  orgDark65: string;
  isDark: boolean;
}) {
  // iOS pageBackground(for: orgColor) — dark uses darken@40% opacity, light
  // uses a much lighter wash so the card reads on cream.
  const cardBg = isDark
    ? `${orgDark65}66`
    : `${darken(org.primaryColor, 50)}18`;

  return (
    <div
      className="light:text-black mt-1.5 rounded-t-[18px] rounded-b-[11px] px-1.5 pt-2 text-white"
      style={{
        backgroundColor: cardBg,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      {/* Top: name + chevron */}
      <div className="flex items-start justify-between px-1">
        <span
          className="text-[14px] leading-tight"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          Barbell Bench Press
        </span>
        <ChevronUp />
      </div>

      {/* Action buttons row — 4 circles */}
      <div className="mt-1.5 flex items-center justify-around">
        <CircleActionButton filled>
          <PlayIcon />
        </CircleActionButton>
        <CircleActionButton>
          <PencilSquare />
        </CircleActionButton>
        <CircleActionButton>
          <ExpandIcon />
        </CircleActionButton>
        <CircleActionButton outlined>
          <EllipsisHorizontal />
        </CircleActionButton>
      </div>

      {/* Stats row */}
      <div className="mt-2 grid grid-cols-3 gap-2 px-3 pb-1">
        <StatCell value="4.32k" subtitle="Current volume" />
        <StatCell value="3.04k" subtitle="Last" />
        <StatCell value="3.34k" subtitle="Average" />
      </div>

      {/* Input section — set rows */}
      <div className="space-y-1 py-1">
        {/* Column headers (rendered as ZStack-offset labels in iOS over set 1) */}
        <div className="flex items-center gap-1 px-0.5 pb-0.5 text-[7px] font-semibold opacity-50">
          <div className="w-[26px]" />
          <div className="flex-1 text-center">Repetitions</div>
          <div className="flex-1 text-center">Weight</div>
          <div className="w-[14px]" />
        </div>

        <SetRow num={1} lastImported reps="8" weight="135" />
        <SetRow num={2} lastImported reps="8" weight="135" />
        <SetRow num={3} reps="8" weight="135" />
        <SetRow num={4} reps="8" weight="135" />
      </div>

      {/* Add set */}
      <button
        className="mb-1 flex w-full items-center justify-between rounded-[8px] px-2 py-1.5 text-[10px] font-semibold"
        style={{
          color: REDPRINT_GREEN,
        }}
      >
        <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}>
          Add set
        </span>
        <PlusIcon color={REDPRINT_GREEN} />
      </button>
    </div>
  );
}

function CircleActionButton({
  filled,
  outlined,
  children,
}: {
  /** Purple solid fill (matches the iOS play button). */
  filled?: boolean;
  /** Stroked circle with the same icon tint. */
  outlined?: boolean;
  children: React.ReactNode;
}) {
  if (filled) {
    return (
      <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-purple-500 text-white">
        {children}
      </div>
    );
  }
  return (
    <div
      className={`light:text-black flex h-[26px] w-[26px] items-center justify-center rounded-full text-white ${
        outlined
          ? "light:border-black/35 border-[1.2px] border-white/35"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

function StatCell({ value, subtitle }: { value: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="light:text-black text-[12px] text-white"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
      >
        {value}
      </span>
      <span className="light:text-black/50 text-[6.5px] text-white/50">
        {subtitle}
      </span>
    </div>
  );
}

function SetRow({
  num,
  lastImported,
  reps,
  weight,
}: {
  num: number;
  lastImported?: boolean;
  reps: string;
  weight: string;
}) {
  return (
    <div className="flex items-center gap-1 px-0.5">
      {/* Set number cell */}
      <div
        className="flex h-[24px] w-[26px] flex-col items-center justify-center rounded-[5px]"
        style={{
          backgroundColor: lastImported ? `${REDPRINT_BLUE}33` : "transparent",
        }}
      >
        <span
          className="light:text-black text-[10px] leading-none text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
        >
          {num}
        </span>
        {lastImported && (
          <span
            className="text-[5.5px] leading-none"
            style={{ color: REDPRINT_BLUE }}
          >
            Last
          </span>
        )}
      </div>

      {/* Reps cell */}
      <div
        className={`flex h-[24px] flex-1 items-center justify-center rounded-[5px] ${
          lastImported ? "" : "light:bg-black/[0.04] bg-white/[0.04]"
        }`}
        style={
          lastImported ? { backgroundColor: `${REDPRINT_BLUE}14` } : undefined
        }
      >
        <span
          className="light:text-black text-[12px] text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {reps}
        </span>
      </div>

      {/* Weight cell */}
      <div
        className={`relative flex h-[24px] flex-1 items-center justify-center rounded-[5px] ${
          lastImported ? "" : "light:bg-black/[0.04] bg-white/[0.04]"
        }`}
        style={
          lastImported ? { backgroundColor: `${REDPRINT_BLUE}14` } : undefined
        }
      >
        <span
          className="light:text-black text-[12px] text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {weight}
        </span>
        <span className="light:text-black/50 absolute right-1 top-1/2 -translate-y-1/2 text-[5.5px] text-white/50">
          lbs
        </span>
      </div>

      {/* Delete */}
      <button className="light:text-black/55 w-[14px] text-[9px] text-white/55">
        ✕
      </button>
    </div>
  );
}

/* ============================================================
   Icons
   ============================================================ */

function Dumbbell() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor">
      <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
      <rect x="3" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="5.5" y="7" width="5" height="2" rx="0.5" />
      <rect x="11" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="13.5" y="6" width="2.5" height="4" rx="0.5" />
    </svg>
  );
}

function Refresh() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 8 a5 5 0 0 1 9 -3" />
      <polyline points="12,2 12,5 9,5" />
      <path d="M13 8 a5 5 0 0 1 -9 3" />
      <polyline points="4,14 4,11 7,11" />
    </svg>
  );
}

function Divide() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor">
      <circle cx="8" cy="3" r="1.4" />
      <rect x="2" y="7" width="12" height="1.5" rx="0.5" />
      <circle cx="8" cy="13" r="1.4" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,6 8,10 12,6" />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-white/65" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,10 8,6 12,10" />
    </svg>
  );
}

function CheckeredFlag() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="white">
      <rect x="3" y="2" width="1" height="11" />
      <rect x="4" y="3" width="2" height="2" />
      <rect x="6" y="3" width="2" height="2" fill="black" />
      <rect x="8" y="3" width="2" height="2" />
      <rect x="10" y="3" width="2" height="2" fill="black" />
      <rect x="4" y="5" width="2" height="2" fill="black" />
      <rect x="6" y="5" width="2" height="2" />
      <rect x="8" y="5" width="2" height="2" fill="black" />
      <rect x="10" y="5" width="2" height="2" />
      <rect x="4" y="7" width="2" height="2" />
      <rect x="6" y="7" width="2" height="2" fill="black" />
      <rect x="8" y="7" width="2" height="2" />
      <rect x="10" y="7" width="2" height="2" fill="black" />
    </svg>
  );
}

function PlusIcon({ color = "white" }: { color?: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="rgba(255,255,255,0.7)">
      <path d="M14 2 L11 5 L11 7 L9 7 L4 12 L4 14 L6 14 L11 9 L13 9 L14 8 Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="white">
      <polygon points="5,3 13,8 5,13" />
    </svg>
  );
}

function PencilSquare() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="1.4">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 10 L10 5 L11 6 L6 11 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="1.4" strokeLinecap="round">
      <polyline points="3,6 3,3 6,3" />
      <line x1="3" y1="3" x2="7" y2="7" />
      <polyline points="13,10 13,13 10,13" />
      <line x1="13" y1="13" x2="9" y2="9" />
    </svg>
  );
}

function EllipsisHorizontal() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="currentColor">
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  );
}

