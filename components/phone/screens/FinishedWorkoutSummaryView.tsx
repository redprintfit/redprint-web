"use client";

import { darken, lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/**
 * Workout summary — donut chart of muscle-group breakdown + top exercises
 * by volume. Faithful port of the chart section from
 * Redprint5/Views/Track Page Files/Track Page Files/WorkoutSummaryView.swift.
 *
 * Donut: 6 rounded segments (iOS RoundedDonutSegment), inner radius 62 /
 * outer 104 (selected 118), 10px corner radius, 5px gap between segments.
 * Top exercises: filled progress bar = exercise.volume / totalVolume.
 *
 * Org-color theming (iOS uses `currentOrg.brandingColors`):
 *   - Segment palette:
 *       0 = colors[0]
 *       1 = colors[1] (or darken(0))
 *       2 = lighten(colors[0], 0.5)
 *       3 = lighten(colors[1], 0.5)
 *       4 = .gray
 *       5 = .gray.lighter(0.3)
 *   - Top exercise bar fill = colors[0]
 */
export function FinishedWorkoutSummaryView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";

  // Standard theme.pageBackground(for: orgColor) tint.
  const pageTint = isDark
    ? `${darken(orgColor, 80)}80`
    : `${darken(orgColor, 65)}26`;

  // Sample data — distribution from the iOS reference screenshot.
  // Sorted by value desc (as iOS does).
  const muscleData: { label: string; value: number }[] = [
    { label: "Back", value: 27 },
    { label: "Chest", value: 27 },
    { label: "Legs", value: 26 },
    { label: "Arms", value: 12 },
    { label: "Core", value: 8 },
  ];

  // Palette per iOS (using single brand color since web orgs only carry one).
  const c0 = orgColor;
  const c1 = darken(orgColor, 30);
  const palette = [
    c0,
    c1,
    lighten(c0, 50),
    lighten(c1, 50),
    "#9aa3ad",
    "#c1c8d0",
  ];

  const total = muscleData.reduce((a, b) => a + b.value, 0);
  const selectedIdx = 0; // "Back" is shown highlighted in the iOS reference

  // Top exercises by volume — sample data
  const topExercises = [
    { name: "Push-Up", volume: 11500 },
    { name: "Bodyweight Box Squat", volume: 11100 },
    { name: "Pull-up", volume: 8100 },
    { name: "Dips", volume: 5400 },
  ];
  const maxVol = Math.max(...topExercises.map((e) => e.volume));

  // Per-exercise breakdowns for the horizontal card carousel at the bottom.
  // Matches iOS SummaryExercises2: avatar + name, 3 stat pills, set rows.
  const exerciseCards: ExerciseCardData[] = [
    {
      name: "Sit-up",
      image: "/screens/exercise-situp.jpg",
      sets: 2,
      reps: 40,
      volume: 3600,
      rows: [
        { set: 1, reps: 20, weight: "Bodyweight" },
        { set: 2, reps: 20, weight: "Bodyweight" },
      ],
    },
    {
      name: "Push-Up",
      image: "/screens/exercise-pushup.jpg",
      sets: 3,
      reps: 45,
      volume: 11500,
      rows: [
        { set: 1, reps: 15, weight: "Bodyweight" },
        { set: 2, reps: 15, weight: "Bodyweight" },
        { set: 3, reps: 15, weight: "Bodyweight" },
      ],
    },
  ];

  return (
    <div
      className="light:bg-white light:text-black relative flex h-full flex-col overflow-hidden bg-black text-white"
      style={{ backgroundImage: `linear-gradient(${pageTint}, ${pageTint})` }}
    >
      <div className="px-3 pt-8">
        {/* ---------- Donut chart ---------- */}
        <div className="flex justify-center pt-1">
          <DonutChart
            segments={muscleData.map((m, i) => ({
              label: m.label,
              value: m.value,
              color: palette[Math.min(i, palette.length - 1)],
            }))}
            total={total}
            selectedIdx={selectedIdx}
          />
        </div>

        {/* ---------- Legend ---------- */}
        <div className="mt-3 space-y-1 px-4">
          {muscleData.map((m, i) => {
            const pct = Math.round((m.value / total) * 100);
            const isSel = i === selectedIdx;
            return (
              <div
                key={m.label}
                className="light:text-black flex items-center gap-2 text-[9px] text-white"
              >
                <span
                  className="h-[7px] w-[7px] rounded-[1.5px]"
                  style={{
                    backgroundColor:
                      palette[Math.min(i, palette.length - 1)],
                  }}
                />
                <span
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: isSel ? 700 : 500,
                  }}
                >
                  {m.label}
                </span>
                <span className="ml-auto">
                  <span
                    className={
                      isSel
                        ? "opacity-100"
                        : "light:text-black/40 text-white/40"
                    }
                    style={{
                      fontFamily: "Outfit, sans-serif",
                      fontWeight: 600,
                    }}
                  >
                    {pct}%
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* ---------- Top Exercises by Volume ---------- */}
        <div className="mt-3 px-1">
          <div className="light:text-black/65 text-[8px] font-semibold text-white/65">
            Top Exercises by volume
          </div>
          <div className="mt-1.5 space-y-1.5">
            {topExercises.map((ex) => {
              const fraction = ex.volume / maxVol;
              const volStr =
                ex.volume >= 1000
                  ? `${(ex.volume / 1000).toFixed(1)}k`
                  : `${ex.volume}`;
              return (
                <div key={ex.name}>
                  <div className="flex items-baseline justify-between">
                    <span
                      className="light:text-black text-[10px] text-white"
                      style={{
                        fontFamily: "Outfit, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      {ex.name}
                    </span>
                    <div className="flex items-baseline gap-0.5">
                      <span
                        className="light:text-black text-[10px] text-white"
                        style={{
                          fontFamily: "Outfit, sans-serif",
                          fontWeight: 700,
                        }}
                      >
                        {volStr}
                      </span>
                      <span className="light:text-black/45 text-[6.5px] text-white/45">
                        lbs
                      </span>
                    </div>
                  </div>
                  <div
                    className="light:bg-white relative mt-0.5 h-[7px] overflow-hidden rounded-full bg-black"
                    style={{
                      boxShadow: "0 0 0 0.5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${fraction * 100}%`,
                        backgroundColor: orgColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- Horizontal exercise card carousel ---------- */}
      <div className="-mx-3 mt-2 overflow-hidden pb-2">
        <div className="flex items-start gap-2 overflow-x-auto pl-3 pr-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {exerciseCards.map((card) => (
            <ExerciseCard key={card.name} data={card} isDark={isDark} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ExerciseCard — port of iOS SummaryExercises2
   ============================================================ */

type ExerciseCardData = {
  name: string;
  image: string;
  sets: number;
  reps: number;
  volume: number;
  rows: { set: number; reps: number; weight: string }[];
};

function ExerciseCard({
  data,
  isDark,
}: {
  data: ExerciseCardData;
  isDark: boolean;
}) {
  // iOS card width = 75% of screen, but we scale to phone display width here.
  const pillBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const borderColor = isDark
    ? "rgba(255,255,255,0.2)"
    : "rgba(0,0,0,0.2)";
  return (
    <div
      className="light:bg-white light:text-black flex w-[170px] flex-shrink-0 flex-col gap-1.5 rounded-[10px] bg-black p-1.5 text-white"
      style={{ boxShadow: `inset 0 0 0 0.5px ${borderColor}` }}
    >
      {/* Header: avatar + name */}
      <div className="flex items-center gap-1.5">
        <div className="light:bg-black/10 h-[22px] w-[22px] flex-shrink-0 overflow-hidden rounded-full bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt={data.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <span
          className="text-[10px] leading-tight"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {data.name}
        </span>
      </div>

      {/* Stat pills */}
      <div className="flex gap-1">
        <StatPill label="Sets" value={data.sets} bg={pillBg} />
        <StatPill label="Reps" value={data.reps} bg={pillBg} />
        <StatPill label="Volume" value={data.volume} bg={pillBg} />
      </div>

      {/* Set rows */}
      <div className="flex flex-col gap-0.5">
        {data.rows.map((row) => (
          <div
            key={row.set}
            className="flex items-center rounded-[3px] px-1.5 py-0.5"
            style={{ background: pillBg }}
          >
            <span className="light:text-black/50 w-3 text-[8px] text-white/50">
              {row.set}
            </span>
            <div className="flex flex-1 items-baseline justify-center gap-0.5">
              <span
                className="light:text-black text-[11px] text-white"
                style={{
                  fontFamily: "Outfit, sans-serif",
                  fontWeight: 700,
                }}
              >
                {row.reps}
              </span>
              <span className="light:text-black/50 text-[6.5px] text-white/50">
                Reps
              </span>
            </div>
            <span className="light:text-black/50 text-[7px] text-white/50">
              {row.weight}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  bg,
}: {
  label: string;
  value: number;
  bg: string;
}) {
  return (
    <div
      className="flex flex-1 items-center justify-between rounded-[3px] px-1 py-[2px]"
      style={{ background: bg }}
    >
      <span className="light:text-black/65 text-[6.5px] text-white/65">
        {label}:
      </span>
      <span
        className="light:text-black text-[8px] text-white"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   Donut chart — rounded segments with a small gap between them
   ============================================================ */

function DonutChart({
  segments,
  total,
  selectedIdx,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
  selectedIdx: number;
}) {
  // iOS values, scaled for the phone size. iOS: innerR 62, normalOuter 104,
  // selectedOuter 118, cornerRadius 10. Scaled 0.65 fits a 260px phone nicely.
  const SCALE = 0.65;
  const INNER_R = 62 * SCALE; // ~40
  const NORMAL_OUTER = 104 * SCALE; // ~68
  const SELECTED_OUTER = 118 * SCALE; // ~77
  const CORNER = 10 * SCALE; // ~6.5
  const GAP_DEG = 2.5; // small visible gap between segments
  const SIZE = SELECTED_OUTER * 2 + 8;

  // Segment angular ranges, with 0° at the top (-90° in math convention).
  const segAngles: { start: number; end: number }[] = [];
  let acc = 0;
  for (let i = 0; i < segments.length; i++) {
    const start = (acc / total) * 360 - 90;
    acc += segments[i].value;
    const end = (acc / total) * 360 - 90;
    segAngles.push({ start, end });
  }

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0 h-full w-full"
      >
        {segments.map((seg, i) => {
          const isSel = i === selectedIdx;
          const outerR = isSel ? SELECTED_OUTER : NORMAL_OUTER;
          const { start, end } = segAngles[i];
          const d = roundedDonutPath(
            SIZE / 2,
            SIZE / 2,
            INNER_R,
            outerR,
            start + GAP_DEG / 2,
            end - GAP_DEG / 2,
            CORNER,
          );
          return <path key={i} d={d} fill={seg.color} />;
        })}
      </svg>

      {/* Center label */}
      {selectedIdx >= 0 && selectedIdx < segments.length && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="light:text-black text-[15px] text-white"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
          >
            {segments[selectedIdx].label}
          </div>
          <div className="light:text-black/65 text-[11px] font-semibold text-white/65">
            {Math.round((segments[selectedIdx].value / total) * 100)}%
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * SVG path for a donut segment with all 4 corners rounded by radius `corner`.
 *
 * Geometry: each corner is a small arc tangent to both the radial-line side
 * and the inner/outer circular arc. For the outer corner, the corner arc's
 * center sits at distance (outerR - corner) from origin and rC perpendicular
 * to the radial line; that gives angular inset φ = atan2(corner, ρ) and
 * radial-line anchor at distance ρ = √(outerR² − 2·outerR·corner). Inner
 * corners use ρ = √(innerR² + 2·innerR·corner) with the corner outside the
 * inner circle.
 */
function roundedDonutPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
  corner: number,
): string {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const θs = toRad(startDeg);
  const θe = toRad(endDeg);

  // Bail out to a flat (un-rounded) segment if the wedge is too small for
  // the requested corner radius — keeps small slices like "Core" 8% sensible.
  const span = endDeg - startDeg;
  if (span <= 0) return "";

  const ρo = Math.sqrt(Math.max(0, outerR * outerR - 2 * outerR * corner));
  const ρi = Math.sqrt(Math.max(0, innerR * innerR + 2 * innerR * corner));
  const φo = Math.atan2(corner, ρo);
  const φi = Math.atan2(corner, ρi);

  // If corner rounding eats more than the available angular span, fall back
  // to a flat segment so we never produce a degenerate / self-overlapping path.
  if (φo * 2 >= θe - θs || φi * 2 >= θe - θs) {
    const x1 = cx + outerR * Math.cos(θs);
    const y1 = cy + outerR * Math.sin(θs);
    const x2 = cx + outerR * Math.cos(θe);
    const y2 = cy + outerR * Math.sin(θe);
    const x3 = cx + innerR * Math.cos(θe);
    const y3 = cy + innerR * Math.sin(θe);
    const x4 = cx + innerR * Math.cos(θs);
    const y4 = cy + innerR * Math.sin(θs);
    const la = span > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${la} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${la} 0 ${x4} ${y4} Z`;
  }

  // Radial-line anchor points (where corner arcs meet the radial sides).
  const ors_x = cx + ρo * Math.cos(θs);
  const ors_y = cy + ρo * Math.sin(θs);
  const ore_x = cx + ρo * Math.cos(θe);
  const ore_y = cy + ρo * Math.sin(θe);
  const irs_x = cx + ρi * Math.cos(θs);
  const irs_y = cy + ρi * Math.sin(θs);
  const ire_x = cx + ρi * Math.cos(θe);
  const ire_y = cy + ρi * Math.sin(θe);

  // Circular-arc anchor points (where corner arcs meet the outer/inner arcs).
  const oas_θ = θs + φo;
  const oae_θ = θe - φo;
  const ias_θ = θs + φi;
  const iae_θ = θe - φi;
  const oas_x = cx + outerR * Math.cos(oas_θ);
  const oas_y = cy + outerR * Math.sin(oas_θ);
  const oae_x = cx + outerR * Math.cos(oae_θ);
  const oae_y = cy + outerR * Math.sin(oae_θ);
  const ias_x = cx + innerR * Math.cos(ias_θ);
  const ias_y = cy + innerR * Math.sin(ias_θ);
  const iae_x = cx + innerR * Math.cos(iae_θ);
  const iae_y = cy + innerR * Math.sin(iae_θ);

  const outerLA = oae_θ - oas_θ > Math.PI ? 1 : 0;
  const innerLA = iae_θ - ias_θ > Math.PI ? 1 : 0;

  // Traverse clockwise (in SVG, which is math-CCW because y is flipped):
  //   outer-radial-start → outer-corner → outer-arc → outer-corner →
  //   outer-radial-end → straight radial → inner-corner → inner-arc reversed
  //   → inner-corner → close.
  return [
    `M ${ors_x} ${ors_y}`,
    `A ${corner} ${corner} 0 0 1 ${oas_x} ${oas_y}`,
    `A ${outerR} ${outerR} 0 ${outerLA} 1 ${oae_x} ${oae_y}`,
    `A ${corner} ${corner} 0 0 1 ${ore_x} ${ore_y}`,
    `L ${ire_x} ${ire_y}`,
    `A ${corner} ${corner} 0 0 1 ${iae_x} ${iae_y}`,
    `A ${innerR} ${innerR} 0 ${innerLA} 0 ${ias_x} ${ias_y}`,
    `A ${corner} ${corner} 0 0 1 ${irs_x} ${irs_y}`,
    "Z",
  ].join(" ");
}
