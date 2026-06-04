"use client";

import { useEffect, useState } from "react";
import { type MotionValue } from "framer-motion";
import {
  BOX_W,
  BOX_H,
  BOX_GAP,
  BOX_RADIUS,
} from "@/components/LoadingRing";
import { useTheme } from "@/lib/useTheme";

/**
 * Three product pillars laid out as columns. Each column is text on top +
 * a mini-visual inside a styled box on the bottom. Box outlines are
 * rendered HERE (not by LoadingRing), so the box + content can never
 * drift apart — they share one positioning system. Faded in as a unit
 * via `progress` (0 → 1).
 *
 * `highlightP` (0 → 1) drives the sequential "spotlight" pass: pillar 1
 * is highlighted from 0 → 0.33, pillar 2 from 0.33 → 0.66, pillar 3 from
 * 0.66 → 1.0. While highlighted a column scales up to 1.08 / opacity 1;
 * dim columns sit at 0.92 / opacity 0.5. Each pillar also gets a 0 → 1
 * `subP` that runs only inside its own slot — used by the per-pillar
 * mini-visual to scrub its scroll-tied internal animation.
 */

const TEXT_BLOCK_H = 150;
const TEXT_TO_BOX_GAP = 8;
const HIGHLIGHT_SCALE = 1.08;
const DIM_SCALE = 0.92;
const DIM_OPACITY = 0.5;
const SLOT_FADE = 0.04; // width of crossfade around each 33%/66% boundary

type Pillar = {
  index: string;
  label: string;
  title: string;
  description: string;
  Visual: React.ComponentType<{ subP: number }>;
};

const PILLARS: Pillar[] = [
  {
    index: "01",
    label: "PLAN",
    title: "A week built around your gym.",
    description: "Workouts the AI knows you can actually do.",
    Visual: WeekPlannerVisual,
  },
  {
    index: "02",
    label: "GUIDE",
    title: "Standing at the machine, not staring at it.",
    description: "Every exercise, one tap from a demo.",
    Visual: ExerciseDemoVisual,
  },
  {
    index: "03",
    label: "COMPETE",
    title: "Your gym vs. the world.",
    description: "Every gym on Redprint, ranked by who's lifting most.",
    Visual: LeaderboardVisual,
  },
];

const COL_TOTAL_H = TEXT_BLOCK_H + TEXT_TO_BOX_GAP + BOX_H;
const CONTAINER_W = 3 * BOX_W + 2 * BOX_GAP;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function ramp(x: number, a: number, b: number) {
  if (x <= a) return 0;
  if (x >= b) return 1;
  return (x - a) / (b - a);
}

/** Per-pillar highlight intensity (0 = dim, 1 = full) and sub-progress
 *  (0 → 1 across the pillar's slot, used by its mini-visual). */
function pillarStates(h: number) {
  // Highlight intensity: each pillar holds at 1 inside its slot and
  // crossfades to/from neighbours over a narrow SLOT_FADE window.
  const i1 = 1 - ramp(h, 0.33 - SLOT_FADE / 2, 0.33 + SLOT_FADE / 2);
  const i2up = ramp(h, 0.33 - SLOT_FADE / 2, 0.33 + SLOT_FADE / 2);
  const i2down = 1 - ramp(h, 0.66 - SLOT_FADE / 2, 0.66 + SLOT_FADE / 2);
  const i2 = Math.min(i2up, i2down);
  const i3 = ramp(h, 0.66 - SLOT_FADE / 2, 0.66 + SLOT_FADE / 2);

  // Sub-progress: 0 → 1 across each pillar's full slot (no fade in/out
  // — runs the visual animation strictly within its highlighted window).
  const sub1 = clamp01(h / 0.33);
  const sub2 = clamp01((h - 0.33) / 0.33);
  const sub3 = clamp01((h - 0.66) / 0.34);

  return [
    { intensity: i1, subP: sub1 },
    { intensity: i2, subP: sub2 },
    { intensity: i3, subP: sub3 },
  ];
}

export function Pillars({
  progress,
  highlightP,
  verticalOffset = 0,
}: {
  progress: MotionValue<number>;
  highlightP: MotionValue<number>;
  /** Push the whole pillar group down by N px from viewport centre.
   * Must match the same offset applied to LoadingRing's wheel target so
   * the boxes and outlines stay aligned. */
  verticalOffset?: number;
}) {
  const [opacity, setOpacity] = useState(() => progress.get());
  const [highlight, setHighlight] = useState(() => highlightP.get());
  useEffect(() => progress.on("change", setOpacity), [progress]);
  useEffect(() => highlightP.on("change", setHighlight), [highlightP]);
  const isDark = useTheme() === "dark";
  const fillRgb = isDark ? "245, 241, 238" : "26, 14, 13";
  const states = pillarStates(highlight);

  return (
    <div
      aria-hidden={opacity < 0.05}
      className="pointer-events-none absolute left-1/2 top-1/2 z-50 flex"
      style={{
        opacity,
        width: CONTAINER_W,
        gap: BOX_GAP,
        // Centre the BOX (not the column) on the viewport — text block
        // lifts above the centre and the box itself sits dead centre,
        // exactly where LoadingRing positioned it. `verticalOffset`
        // shifts the whole group up/down so it can clear the title.
        transform: `translate(-50%, calc(-50% + ${BOX_H / 2 - COL_TOTAL_H / 2 + verticalOffset}px))`,
      }}
    >
      {PILLARS.map((p, i) => {
        const s = states[i];
        const scale = DIM_SCALE + (HIGHLIGHT_SCALE - DIM_SCALE) * s.intensity;
        const op = DIM_OPACITY + (1 - DIM_OPACITY) * s.intensity;
        return (
          <div
            key={p.index}
            className="flex flex-col"
            style={{
              width: BOX_W,
              height: COL_TOTAL_H,
              transform: `scale(${scale})`,
              transformOrigin: "center center",
              opacity: op,
              willChange: "transform, opacity",
            }}
          >
            {/* Text block — sits above the box. */}
            <div style={{ height: TEXT_BLOCK_H }}>
              <div className="text-fg-muted font-body text-[11px] font-medium tracking-[0.14em]">
                {p.index} — {p.label}
              </div>
              <h3 className="text-fg-base mt-2.5 text-[24px] font-medium leading-[1.15] tracking-tight">
                {p.title}
              </h3>
              <p className="text-fg-muted font-body mt-2 text-[14px] leading-[1.5]">
                {p.description}
              </p>
            </div>
            <div style={{ height: TEXT_TO_BOX_GAP }} />
            {/* Box (matches LoadingRing's final state). Border is at 30%
                opacity so it reads as a soft outline rather than a hard
                frame around the content. Mini-visual wrapper sets
                font-body so every label/value inside is Inter — the only
                Outfit text on this whole component is the pillar h3. */}
            <div
              className="overflow-hidden"
              style={{
                width: BOX_W,
                height: BOX_H,
                borderRadius: BOX_RADIUS,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: `rgba(${fillRgb}, 0.3)`,
                backgroundColor: `rgba(${fillRgb}, 0.05)`,
              }}
            >
              <div className="font-body h-full w-full p-5">
                <p.Visual subP={s.subP} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Mini-visuals — simplified ports of the HTML reference. All
   use the body font for small UI text, the display font for
   numeric callouts. Each accepts subP (0 → 1) which scrubs its
   internal animation while its pillar is highlighted.
   ============================================================ */

function VisualHeader({ left, right }: { left: string; right: string }) {
  return (
    <div className="border-fg-base/12 font-body flex items-center justify-between border-b border-dashed pb-2 text-[9px]">
      <div className="text-fg-muted tracking-[0.12em]">{left}</div>
      <div className="text-fg-base/80 tracking-[0.08em]">{right}</div>
    </div>
  );
}

/**
 * Pillar 1 — scroll-tied transition WED · PULL DAY → FRI · PUSH DAY.
 * Active day cell crossfades from WED to FRI around subP=0.5; the
 * workout panel below crossfades the same way so its title + exercise
 * list match the active day.
 */
function WeekPlannerVisual({ subP }: { subP: number }) {
  // Crossfade WED-active layer → FRI-active layer over [0.40, 0.60].
  const t = ramp(subP, 0.40, 0.60);
  return (
    <div className="flex h-full flex-col gap-2.5">
      <VisualHeader left="YOUR WEEK" right="AI · PLANNED" />
      {/* Week strip — render two layers stacked, crossfade between them. */}
      <div className="relative">
        <div className="grid grid-cols-5 gap-1.5" style={{ opacity: 1 - t }}>
          <WeekCell day="MON" n="4" active={false} />
          <WeekCell day="TUE" n="5" active={false} />
          <WeekCell day="WED" n="6" active={true} />
          <WeekCell day="THU" n="7" active={false} />
          <WeekCell day="FRI" n="8" active={false} />
        </div>
        <div
          className="absolute inset-0 grid grid-cols-5 gap-1.5"
          style={{ opacity: t }}
        >
          <WeekCell day="MON" n="4" active={false} />
          <WeekCell day="TUE" n="5" active={false} />
          <WeekCell day="WED" n="6" active={false} />
          <WeekCell day="THU" n="7" active={false} />
          <WeekCell day="FRI" n="8" active={true} />
        </div>
      </div>
      {/* Workout panel — same crossfade between WED PULL and FRI PUSH. */}
      <div className="border-fg-base/15 relative flex-1 rounded-lg border">
        <WorkoutPanel
          title="WED · PULL DAY"
          rows={[["Barbell row", "4 × 8"], ["Pull-up", "3 × 10"]]}
          opacity={1 - t}
        />
        <WorkoutPanel
          title="FRI · PUSH DAY"
          rows={[["Bench press", "4 × 8"], ["Overhead press", "3 × 10"]]}
          opacity={t}
        />
      </div>
    </div>
  );
}

function WeekCell({ day, n, active }: { day: string; n: string; active: boolean }) {
  return (
    <div
      className={
        active
          ? "bg-fg-base text-bg-base rounded-md py-1.5 text-center"
          : "border-fg-base/20 rounded-md border py-1.5 text-center"
      }
    >
      <div
        className={`font-body text-[8px] tracking-[0.1em] ${active ? "text-bg-base font-semibold" : "text-fg-muted"}`}
      >
        {day}
      </div>
      <div
        className={`text-[13px] font-medium ${active ? "text-bg-base" : "text-fg-base"}`}
      >
        {n}
      </div>
    </div>
  );
}

function WorkoutPanel({
  title,
  rows,
  opacity,
}: {
  title: string;
  rows: [string, string][];
  opacity: number;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-center px-3 py-2"
      style={{ opacity }}
    >
      <div className="font-body mb-1.5 flex items-center justify-between">
        <span className="text-fg-muted text-[10px] tracking-wider">{title}</span>
        <span className="text-fg-base/80 text-[9px]">4 exercises</span>
      </div>
      <div className="font-body flex flex-col gap-1 text-[11px]">
        {rows.map(([name, reps]) => (
          <div key={name} className="flex justify-between">
            <span className="text-fg-base">{name}</span>
            <span className="text-fg-muted tabular-nums">{reps}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Pillar 2 — play-button press-and-release. As subP advances the button
 * compresses (scale + shadow drop), the play glyph crossfades to pause,
 * then the button rebounds and pause crossfades back to play, all before
 * the highlight period ends.
 */
function ExerciseDemoVisual({ subP }: { subP: number }) {
  // Press envelope: rest → press → release.
  //   [0.15, 0.35]  press DOWN (icon Play → Pause)
  //   [0.35, 0.65]  held pressed
  //   [0.65, 0.85]  release UP (icon Pause → Play)
  const pressIn = ramp(subP, 0.15, 0.35);
  const pressOut = ramp(subP, 0.65, 0.85);
  const pressed = Math.max(0, pressIn - pressOut); // 0 → 1 → 0
  const btnScale = 1 - 0.15 * pressed; // 1 → 0.85 → 1
  const shadow = 1 - 0.7 * pressed; // shadow softens when pressed
  // Icon swap: pause visible while button is pressed.
  const pauseOpacity = pressed;
  const playOpacity = 1 - pressed;

  return (
    <div className="flex h-full flex-col gap-2.5">
      <VisualHeader left="IN WORKOUT" right="EXERCISE 3 / 6" />
      <div className="border-fg-base/15 flex items-center gap-2.5 rounded-lg border px-3 py-2">
        <div className="bg-fg-base/15 flex h-6 w-6 shrink-0 items-center justify-center rounded-md">
          <svg viewBox="0 0 24 24" className="text-fg-base h-3 w-3" fill="currentColor">
            <circle cx="12" cy="5" r="2.2" />
            <path d="M9 9h6l-1 5 3 6h-2l-2.5-5L10 20H8l3-6-2-2v-3z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="text-fg-base truncate text-[11px] font-medium">
            Lat pulldown
          </div>
          <div className="text-fg-muted font-body truncate text-[8px]">
            Station 2 · 4 × 10
          </div>
        </div>
      </div>
      <div className="bg-fg-base/8 relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-lg">
        <svg
          viewBox="0 0 200 100"
          className="text-fg-base absolute inset-0 h-full w-full opacity-30"
          preserveAspectRatio="none"
        >
          <rect x="8" y="8" width="56" height="84" rx="6" fill="currentColor" />
          <rect x="136" y="8" width="56" height="84" rx="6" fill="currentColor" />
          <rect x="80" y="10" width="40" height="5" rx="2" fill="currentColor" />
          <path d="M86 90 Q86 74 100 74 Q114 74 114 90 Z" fill="currentColor" />
        </svg>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div
            className="bg-fg-base text-bg-base relative flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              transform: `scale(${btnScale})`,
              boxShadow: `0 ${4 * shadow}px ${12 * shadow}px rgba(0,0,0,${0.35 * shadow})`,
              willChange: "transform",
            }}
          >
            {/* Play glyph */}
            <svg
              viewBox="0 0 24 24"
              className="absolute ml-0.5 h-5 w-5"
              fill="currentColor"
              style={{ opacity: playOpacity }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            {/* Pause glyph — two vertical bars */}
            <svg
              viewBox="0 0 24 24"
              className="absolute h-5 w-5"
              fill="currentColor"
              style={{ opacity: pauseOpacity }}
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          </div>
          <div className="text-fg-base font-body text-[9px] font-medium tracking-[0.1em]">
            WATCH DEMO · 0:22
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pillar 3 — "your gym" climbs from #2 to #1 as its weekly total counts
 * 1.6M → 2.2M. Niagara swaps with it. The right-side header badge
 * RANK #2 → RANK #1 flips at the position-swap midpoint. Ranks 3 / 4
 * stay put.
 */
function LeaderboardVisual({ subP }: { subP: number }) {
  // Position swap envelope — narrower than the full slot so the rows
  // visibly slide instead of drifting the whole time.
  const swap = ramp(subP, 0.20, 0.70);
  // Rank label swap at the geometric midpoint of the slide.
  const rankFlipped = swap > 0.5;

  type Row = {
    code: string;
    name: string;
    you: boolean;
    // Original DOM order (1-indexed) — fixed so React keys + flexbox
    // order never change. Position is driven by translateY only.
    domSlot: number;
    // Target slot under the animation (also 1-indexed): rows 3 / 4
    // never move; rows 1 / 2 swap.
    targetSlot: (swap: number) => number;
    value: (subP: number) => string;
    rank: (flipped: boolean) => number;
  };

  const rows: Row[] = [
    {
      code: "N",
      name: "Niagara",
      you: false,
      domSlot: 1,
      targetSlot: (s) => 1 + s, // 1 → 2
      value: () => "2.1M",
      rank: (f) => (f ? 2 : 1),
    },
    {
      code: "G",
      name: "GymIt",
      you: true,
      domSlot: 2,
      targetSlot: (s) => 2 - s, // 2 → 1
      value: (sp) =>
        `${(1.6 + (2.2 - 1.6) * sp).toFixed(1)}M`,
      rank: (f) => (f ? 1 : 2),
    },
    {
      code: "W",
      name: "Waverley",
      you: false,
      domSlot: 3,
      targetSlot: () => 3,
      value: () => "1.5M",
      rank: () => 3,
    },
    {
      code: "U",
      name: "U. of Missouri",
      you: false,
      domSlot: 4,
      targetSlot: () => 4,
      value: () => "1.3M",
      rank: () => 4,
    },
  ];

  // Row height (px) including the 4px gap. Matches the prior row size
  // (py-1.5 + content ≈ 26px) plus the gap-1 (=4px).
  const ROW_PITCH = 30;

  return (
    <div className="flex h-full flex-col gap-2">
      <VisualHeader
        left="GLOBAL · THIS WEEK"
        right={`RANK #${rankFlipped ? 1 : 2}`}
      />
      <div className="relative flex-1">
        {rows.map((r) => {
          const dy = (r.targetSlot(swap) - r.domSlot) * ROW_PITCH;
          return (
            <div
              key={r.code}
              className={`absolute left-0 right-0 flex items-center gap-2 rounded-md px-2.5 py-1.5 ${
                r.you
                  ? "bg-fg-base/8 border-fg-base/40 border"
                  : "border-fg-base/15 border"
              }`}
              style={{
                top: (r.domSlot - 1) * ROW_PITCH,
                transform: `translateY(${dy}px)`,
                willChange: "transform",
              }}
            >
              <div
                className={`font-body w-3 text-[10px] tabular-nums ${r.you ? "text-fg-base font-semibold" : "text-fg-muted"}`}
              >
                {r.rank(rankFlipped)}
              </div>
              <div
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[8px] ${
                  r.you
                    ? "bg-fg-base text-bg-base font-semibold"
                    : "bg-fg-base/20 text-fg-base"
                }`}
              >
                {r.code}
              </div>
              <div
                className={`font-body min-w-0 flex-1 text-[10px] ${r.you ? "text-fg-base font-semibold" : "text-fg-base"}`}
              >
                {r.name}
              </div>
              <div
                className={`font-body text-[10px] tabular-nums ${r.you ? "text-fg-base font-semibold" : "text-fg-base"}`}
              >
                {r.value(subP)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
