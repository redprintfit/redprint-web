"use client";

import { useEffect, useState } from "react";
import { useTime, type MotionValue } from "framer-motion";
import { useTheme } from "@/lib/useTheme";

/**
 * Six dots arranged in a ring, with two scroll-driven morph stages.
 *
 *   ringRot   (rad)   rotates the whole ring as a group
 *   mergeP    (0-1)   pairs of dots converge to 3 midpoints (6→3 merge)
 *   boxP      (0-1)   the 3 merged spots morph into 3 horizontal rounded
 *                     rectangles, arranged left/centre/right at fixed
 *                     screen positions (the wheel rotation is implicitly
 *                     cancelled here because the boxes lerp to fixed
 *                     coords, not to rotated coords)
 *
 * Rendered as plain HTML so each dot stays pixel-crisp through rotation
 * and morphing — the canvas/metaball path can't survive sub-frame
 * positional changes without producing wavy contour artifacts.
 */
type Props = {
  size: MotionValue<number>;
  ringRot: MotionValue<number>;
  ringRadiusFrac: number;
  dotRadiusFrac: number;
  phase?: number;
  /** Nudge for the ring's centre, as a fraction of `size`. */
  centerOffsetXFrac?: number;
  centerOffsetYFrac?: number;
  /** 0 → 1: pairs of dots converge to 3 midpoints. */
  mergeP?: MotionValue<number>;
  /** 0 → 1: the 3 merged dots morph to 3 horizontal rounded boxes. */
  boxP?: MotionValue<number>;
  /**
   * 0 → 1: 6 ring dots translate to a 6-dot vertical column. Dots
   * animate with a stagger — earlier-indexed dots reach the column
   * first, so the user perceives them snapping into place one at a
   * time. Applied between the rotation step and the box step, so it
   * has no effect when boxP > 0 (boxes still dominate).
   */
  lineP?: MotionValue<number>;
  /**
   * Viewport coords of dot 0's final slot (top of the column). When
   * provided, the line-target offsets are computed in VIEWPORT space
   * (so the dots fly to absolute on-screen positions, not relative
   * to the wheel centre — useful when the wheel itself stays put).
   */
  lineTargetLeftX?: number;
  lineTargetTopY?: number;
  /**
   * 0 → 1: slides dots at linePos 1..5 from the column down to a
   * stacked group at the bottom of the viewport (BOTTOM_MARGIN above
   * the bottom edge). Dot 0 stays put.
   */
  collapseP?: MotionValue<number>;
  /**
   * 0 → 1: step 2 transition. Pulls the dot at linePos 1 BACK UP
   * from the collapsed stack to its `lineY` slot (right under dot 0)
   * and ramps its opacity from the 50% "un-reached" floor to 100%.
   * Dots at linePos 2+ stay at 50% throughout (until their own
   * step transitions in future phases).
   */
  step2TransitionP?: MotionValue<number>;
  /**
   * 0 → 1: step 3 transition. Same as step2 but for the dot at
   * linePos 2 (ON-DEMAND LEARNING).
   */
  step3TransitionP?: MotionValue<number>;
  /**
   * 0 → 1: step 4 transition. Same as step2/step3 but for the dot
   * at linePos 3 (GYM-SPECIFIC AI).
   */
  step4TransitionP?: MotionValue<number>;
  /**
   * 0 → 1: step 5 transition. Same as step2/step3/step4 but for the
   * dot at linePos 4 (COMPETE/COMMUNITY).
   */
  step5TransitionP?: MotionValue<number>;
  /**
   * 0 → 1: step 6 transition. Same as step2..5 but for the dot at
   * linePos 5 (VISUALIZE PROGRESS) — the last menu item.
   */
  step6TransitionP?: MotionValue<number>;
  /**
   * Testimonials-phase spread targets. Array of 6 viewport-pixel
   * positions, indexed by linePos. When provided alongside `spreadP`,
   * each dot blends from its wheel-orbit position out to its slot's
   * target as `spreadP` rises (staggered per slot so the dots emerge
   * one-by-one). The wheel's existing rotation continues to drive the
   * "before" position, so the dots physically travel from orbit to
   * scattered slots — they never fade out or get replaced.
   */
  spreadTargets?: Array<{ x: number; y: number }>;
  /** 0 → 1: drives the spread of the 6 dots to `spreadTargets`. */
  spreadP?: MotionValue<number>;
};

const N = 6;

// Box-stage geometry (px). Three rectangles side-by-side, centred on the
// wheel container (which by this stage is dead centre of the viewport).
// Exported because Pillars renders its own box outlines at the exact
// same positions/sizes — keeping these in one place stops them from
// drifting apart.
export const BOX_W = 320;
export const BOX_H = 220;
export const BOX_GAP = 32;
export const BOX_RADIUS = 28; // corner radius at boxP = 1

// Fill opacity lerps from FILL_ALPHA_CIRCLE → FILL_ALPHA_BOX as boxP rises,
// so the rectangles read as a much softer surface than the lively dots.
const FILL_ALPHA_CIRCLE = 0.5;
const FILL_ALPHA_BOX = 0.05;

// Vertical line geometry: 6 evenly-spaced dots stacked top → bottom,
// total LINE_H tall, centred on the wheel's local origin.
//
// `LINE_START_DOT` picks which ring dot lands at the TOP of the line
// (and animates first). The other dots fill positions 1..5 in ring
// index order, wrapping around. Ring index → angle mapping:
//   0 = 3 o'clock, 1 = 5 o'clock, 2 = 7 o'clock,
//   3 = 9 o'clock, 4 = 11 o'clock, 5 = 1 o'clock.
// Vertical column of 6 dots, TOP-anchored at the wheel centre — dot 0
// sits at the wheel's local origin, each subsequent dot LINE_DOT_SPACING
// below it. (Wheel position itself is animated to viewport top-left
// in ScrollSequence, so the column lands at the page's top-left edge.)
const LINE_DOT_SPACING = 50;
// LINE_STAGGER and LINE_DURATION are duplicated as constants in
// HowItWorksSteps so the per-dot dashed line + label reveal can fire
// EXACTLY when the corresponding dot finishes arriving. If you change
// them here, change them there too. Constraint:
//   LINE_STAGGER × 5 + LINE_DURATION + lineDrawDuration + textDuration ≤ 1
// (so the last dot's full sequence still fits inside `lineP ∈ [0, 1]`).
const LINE_STAGGER = 0.07;
const LINE_DURATION = 0.25;
const LINE_START_DOT = 3; // 9 o'clock leads
// Collapse target — bottom-most dot ends BOTTOM_MARGIN above the
// viewport bottom edge. Must mirror HowItWorksSteps's BOTTOM_MARGIN.
const BOTTOM_MARGIN = 80;

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

/** A single dot rendered as an absolutely positioned div. */
function useTracked<T>(mv: MotionValue<T>, mapper: (v: T) => T = (v) => v): T {
  const [v, setV] = useState(() => mapper(mv.get()));
  useEffect(() => mv.on("change", (next) => setV(mapper(next))), [mv]);
  return v;
}

export function LoadingRing({
  size,
  ringRot,
  ringRadiusFrac,
  dotRadiusFrac,
  phase = 0,
  centerOffsetXFrac = 0,
  centerOffsetYFrac = 0,
  mergeP,
  boxP,
  lineP,
  lineTargetLeftX,
  lineTargetTopY,
  collapseP,
  step2TransitionP,
  step3TransitionP,
  step4TransitionP,
  step5TransitionP,
  step6TransitionP,
  spreadTargets,
  spreadP,
}: Props) {
  const px = useTracked<number>(size, (v) => Math.round(v));
  const rot = useTracked<number>(ringRot);
  // Viewport dims tracked in state — line-target maths below depends on
  // these, and a window resize without scroll wouldn't otherwise trigger
  // a re-render (no MotionValue input changes), leaving the dots glued
  // to their old viewport-relative slots.
  const [viewport, setViewport] = useState(() =>
    typeof document !== "undefined"
      ? {
          vw: document.documentElement.clientWidth,
          vh: document.documentElement.clientHeight,
        }
      : { vw: 0, vh: 0 },
  );
  useEffect(() => {
    const update = () =>
      setViewport({
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // Theme-aware fill RGB so we can drive the alpha inline (Tailwind's
  // `bg-fg-base/NN` is a fixed alpha — can't tween it with a MotionValue).
  const isDark = useTheme() === "dark";
  const fillRgb = isDark ? "245, 241, 238" : "26, 14, 13";
  // Without a MotionValue these default to 0 (no merge / no box stage).
  // Hooks must always run, so we substitute a stable zero-MV when absent.
  const zeroMV = useStableZero();
  const mP = useTracked<number>(mergeP ?? zeroMV);
  const bP = useTracked<number>(boxP ?? zeroMV);
  const lP = useTracked<number>(lineP ?? zeroMV);
  const cP = useTracked<number>(collapseP ?? zeroMV);
  const s2P = useTracked<number>(step2TransitionP ?? zeroMV);
  const s3P = useTracked<number>(step3TransitionP ?? zeroMV);
  const s4P = useTracked<number>(step4TransitionP ?? zeroMV);
  const s5P = useTracked<number>(step5TransitionP ?? zeroMV);
  const s6P = useTracked<number>(step6TransitionP ?? zeroMV);
  const spP = useTracked<number>(spreadP ?? zeroMV);
  // Ambient time for the testimonial-dot float (kicks in only after
  // each dot has completed its spread to its anchor). Tracked the
  // same way as ringRot so per-frame updates re-trigger renders.
  const timeMV = useTime();
  const time = useTracked<number>(timeMV);

  // --- Geometry ---------------------------------------------------------
  const ringR = px * ringRadiusFrac;
  const mergedR = ringR * Math.cos(Math.PI / 6); // = ringR * 0.866
  const dotD = px * dotRadiusFrac * 2;
  const offX = px * centerOffsetXFrac;
  const offY = px * centerOffsetYFrac;
  const strokeW = Math.max(1, px * 0.01);

  // Box screen positions (centre of each box, relative to wheel centre).
  // Indexed by `pairIdx`, so this controls which pair lands in which
  // horizontal slot: pair 0 → right, pair 1 → middle, pair 2 → left.
  const boxes: { x: number; y: number }[] = [
    { x: BOX_W + BOX_GAP, y: 0 }, // pair 0 → right
    { x: 0, y: 0 }, // pair 1 → middle
    { x: -(BOX_W + BOX_GAP), y: 0 }, // pair 2 → left
  ];

  return (
    <div className="relative" style={{ width: px, height: px }}>
      <div
        className="absolute"
        style={{
          left: `calc(50% + ${offX}px)`,
          top: `calc(50% + ${offY}px)`,
          width: 0,
          height: 0,
        }}
      >
        {Array.from({ length: N }).map((_, i) => {
          // Pair index — dots (0,1) form pair 0, (2,3) pair 1, (4,5) pair 2.
          // Each pair's midpoint sits at angle 30° + 120°·pairIdx in the
          // wheel's local (un-rotated) frame.
          const pairIdx = Math.floor(i / 2);
          const a0 = ((Math.PI * 2) / N) * i + phase;
          const aMerged = ((Math.PI * 2) / 3) * pairIdx + Math.PI / 6 + phase;

          // Local (pre-rotation) position — lerp original ↔ merged.
          const r = ringR + (mergedR - ringR) * mP;
          const a = a0 + (aMerged - a0) * mP;
          const lx = Math.cos(a) * r;
          const ly = Math.sin(a) * r;

          // Apply wheel rotation to get screen-frame position.
          const cosR = Math.cos(rot);
          const sinR = Math.sin(rot);
          const rotX = lx * cosR - ly * sinR;
          const rotY = lx * sinR + ly * cosR;

          // Line-formation morph (rotation-frame → vertical line slot).
          // `linePos` re-maps ring index → line position. Subtraction
          // (not addition) walks the ring COUNTER-clockwise from the
          // start dot: ring index decreases as we go down the line.
          // Stagger order follows linePos (top dot animates first).
          //
          // If lineTargetLeftX/TopY are provided, the dot's TARGET is
          // in VIEWPORT coords: subtract the wheel's viewport centre
          // to convert into wheel-local space (the frame this render
          // function operates in).
          const linePos = (LINE_START_DOT - i + N) % N;
          const lineLocalP = Math.max(
            0,
            Math.min(1, (lP - LINE_STAGGER * linePos) / LINE_DURATION),
          );
          const eLineP = easeInOut(lineLocalP);
          let lineTargetX: number;
          let lineTargetY: number;
          if (
            lineTargetLeftX !== undefined &&
            lineTargetTopY !== undefined &&
            typeof document !== "undefined"
          ) {
            const { vw, vh } = viewport;
            lineTargetX = lineTargetLeftX - vw / 2;
            lineTargetY =
              lineTargetTopY + linePos * LINE_DOT_SPACING - vh / 2;
            // Collapse: dots 1..5 slide to a stack at the viewport
            // bottom (BOTTOM_MARGIN above the bottom edge). Dot 0
            // (linePos 0) stays put. cP lerps line-target → bottom.
            // Dot at linePos 1 additionally lerps BACK to its line
            // slot as step2TransitionP rises.
            if (linePos > 0 && cP > 0) {
              const collapseTargetYviewport =
                vh - BOTTOM_MARGIN - (N - 1 - linePos) * LINE_DOT_SPACING;
              const collapseTargetYlocal =
                collapseTargetYviewport - vh / 2;
              let targetLocal = collapseTargetYlocal;
              if (linePos === 1 && s2P > 0) {
                // lineTargetY at this point is the original line slot
                // (in local frame). Lerp from collapsed back toward it.
                targetLocal =
                  collapseTargetYlocal +
                  (lineTargetY - collapseTargetYlocal) * s2P;
              } else if (linePos === 2 && s3P > 0) {
                targetLocal =
                  collapseTargetYlocal +
                  (lineTargetY - collapseTargetYlocal) * s3P;
              } else if (linePos === 3 && s4P > 0) {
                targetLocal =
                  collapseTargetYlocal +
                  (lineTargetY - collapseTargetYlocal) * s4P;
              } else if (linePos === 4 && s5P > 0) {
                targetLocal =
                  collapseTargetYlocal +
                  (lineTargetY - collapseTargetYlocal) * s5P;
              } else if (linePos === 5 && s6P > 0) {
                targetLocal =
                  collapseTargetYlocal +
                  (lineTargetY - collapseTargetYlocal) * s6P;
              }
              lineTargetY =
                lineTargetY + (targetLocal - lineTargetY) * cP;
            }
          } else {
            lineTargetX = 0;
            lineTargetY = linePos * LINE_DOT_SPACING;
          }
          const afterLineX = rotX + (lineTargetX - rotX) * eLineP;
          const afterLineY = rotY + (lineTargetY - rotY) * eLineP;

          // Testimonials spread — when `spreadTargets` + `spreadP` are
          // provided, each dot blends from its current (rotation-frame)
          // position out to its slot's viewport-pixel target. The
          // blend uses a staggered per-slot progress so the dots
          // emerge one-by-one. Identical mechanic to the line-target
          // lerp, just with arbitrary per-dot endpoints. Composes
          // BEFORE the box-stage lerp so spread is invisible whenever
          // boxP is non-zero (= early step-1 phases).
          let afterSpreadX = afterLineX;
          let afterSpreadY = afterLineY;
          if (spreadTargets && spP > 0) {
            const tgt = spreadTargets[linePos];
            if (tgt) {
              const tgtLocalX = tgt.x - viewport.vw / 2;
              const tgtLocalY = tgt.y - viewport.vh / 2;
              const SPREAD_STAGGER = 0.1;
              const SPREAD_DURATION = 0.35;
              const local = (spP - SPREAD_STAGGER * linePos) / SPREAD_DURATION;
              const clamped = Math.max(0, Math.min(1, local));
              // Ease-out cubic — dots launch quickly, settle gently.
              const eSpread = 1 - Math.pow(1 - clamped, 3);
              afterSpreadX = afterLineX + (tgtLocalX - afterLineX) * eSpread;
              afterSpreadY = afterLineY + (tgtLocalY - afterLineY) * eSpread;
              // Ambient float — kicks in ONLY after this slot's spread
              // window has fully closed (otherwise the float would
              // jitter the dot mid-flight). Each slot bobs on its own
              // phase so they don't all wobble in sync.
              const spreadEnd = SPREAD_STAGGER * linePos + SPREAD_DURATION;
              const floatT = Math.max(
                0,
                Math.min(1, (spP - spreadEnd) / 0.15),
              );
              if (floatT > 0) {
                const FLOAT_AMP = 14; // px
                const ph = linePos * 0.9 + 0.3;
                afterSpreadX +=
                  Math.sin(time * 0.0006 + ph * Math.PI * 2) *
                  FLOAT_AMP *
                  floatT;
                afterSpreadY +=
                  Math.cos(time * 0.0005 + ph * Math.PI * 2) *
                  FLOAT_AMP *
                  floatT;
              }
            }
          }

          // Lerp to box target as boxP rises. The two dots in each pair
          // share the same target, so they stack and read as one box.
          const target = boxes[pairIdx];
          const finalX = afterSpreadX + (target.x - afterSpreadX) * bP;
          const finalY = afterSpreadY + (target.y - afterSpreadY) * bP;

          // Size / corner-radius / fill-opacity morph.
          const finalW = dotD + (BOX_W - dotD) * bP;
          const finalH = dotD + (BOX_H - dotD) * bP;
          const finalRadius = (dotD / 2) + (BOX_RADIUS - dotD / 2) * bP;
          const fillAlpha =
            FILL_ALPHA_CIRCLE + (FILL_ALPHA_BOX - FILL_ALPHA_CIRCLE) * bP;

          // Border opacity interpolates: full strength while the dots
          // are dots (so they read as solid circles), then fades to a
          // soft outline as they morph into the larger rectangles —
          // matches the lighter outline Pillars uses for its boxes.
          const borderAlpha = 1.0 + (0.3 - 1.0) * bP;

          // Per-dot opacity multiplier — kicks in only once the dots
          // are in their column. Dot 0 (linePos 0) is always 100%.
          // Dot at linePos 1 ramps from 50% → 100% with s2P.
          // All other linePos > 1 dots hold at 50% as the
          // "un-reached" floor.
          let postCollapseOpacity = 1;
          if (cP > 0) {
            if (linePos === 1) {
              postCollapseOpacity = 0.5 + 0.5 * s2P;
            } else if (linePos === 2) {
              postCollapseOpacity = 0.5 + 0.5 * s3P;
            } else if (linePos === 3) {
              postCollapseOpacity = 0.5 + 0.5 * s4P;
            } else if (linePos === 4) {
              postCollapseOpacity = 0.5 + 0.5 * s5P;
            } else if (linePos === 5) {
              postCollapseOpacity = 0.5 + 0.5 * s6P;
            } else if (linePos > 5) {
              postCollapseOpacity = 0.5;
            }
            // While collapse is still in flight (cP < 1), ease into
            // the post-collapse opacity rather than snapping.
            postCollapseOpacity = 1 + (postCollapseOpacity - 1) * cP;
          }

          return (
            <div
              key={i}
              className="absolute"
              style={{
                width: finalW,
                height: finalH,
                left: finalX - finalW / 2,
                top: finalY - finalH / 2,
                borderRadius: finalRadius,
                borderWidth: strokeW,
                borderStyle: "solid",
                borderColor: `rgba(${fillRgb}, ${borderAlpha * postCollapseOpacity})`,
                backgroundColor: `rgba(${fillRgb}, ${fillAlpha * postCollapseOpacity})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Singleton zero MotionValue, used when a caller doesn't pass `mergeP` /
// `boxP`. Hooks must run unconditionally; substituting this keeps the
// hook count stable without forcing every caller to construct a no-op MV.
let _zero: MotionValue<number> | null = null;
function useStableZero(): MotionValue<number> {
  // Lazily import & construct once; safe in the browser (this module is
  // imported by client components only).
  if (_zero == null) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { motionValue } = require("framer-motion") as typeof import("framer-motion");
    _zero = motionValue(0);
  }
  return _zero;
}
