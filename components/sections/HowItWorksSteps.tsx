"use client";

import { useEffect, useState } from "react";
import { type MotionValue } from "framer-motion";
import { scrollToVh } from "@/lib/lenis";
import { STEP_TARGETS } from "@/lib/scrollTargets";

/**
 * Per-dot dashed line + label, plus vertical connectors between dots.
 * All positions are computed each tick from `progress` and `collapseP`
 * so the elements track the dots through both:
 *
 *   Line phase  (progress 0 → 1):
 *     each dot's label + horizontal dash + the connector below it
 *     reveal in lockstep with the dot's arrival from the wheel
 *
 *   Collapse phase  (collapseP 0 → 1):
 *     dot 0 stays at the top; dots 1..5 slide down to a stack at the
 *     bottom of the viewport. The vertical connector between dots 0
 *     and 1 stretches to keep them attached. Labels + connectors fade
 *     to ~25% opacity (dot 0's stays full-strength).
 *
 * Constants here MUST match the same names in LoadingRing.
 */

const N = 6;

// --- Must mirror LoadingRing -----------------------------------------
const LINE_STAGGER = 0.07;
const LINE_DURATION = 0.25;
const DOT_SPACING = 50; // = LoadingRing's LINE_DOT_SPACING
const BOTTOM_MARGIN = 80; // = LoadingRing's BOTTOM_MARGIN
// --- Per-step sub-timing ---------------------------------------------
const LINE_DRAW_LEN = 0.05;
const TEXT_REVEAL_LEN = 0.1;
// --- Geometry (top-left target — must match ScrollSequence) ----------
const DOT_LEFT_X = 32;
const DOT_TOP_Y = 160;
const DOT_RADIUS = 8;
const LINE_GAP = 0;
const LINE_LEN = 28;
const LABEL_GAP = 12;
// Fade targets at collapseP = 1 — labels go down further than dashes.
const COLLAPSED_TEXT_OPACITY = 0.25;
const COLLAPSED_LINE_OPACITY = 0.4;

const LABELS = [
  "INTERACT WITH REDPRINT TAGS",
  "TAP-TO-TRACK",
  "ON-DEMAND LEARNING",
  "GYM-SPECIFIC AI",
  "COMPETE/COMMUNITY",
  "VISUALIZE PROGRESS",
];

type Props = {
  progress: MotionValue<number>;
  collapseP: MotionValue<number>;
  /** 0 → 1 across the post-collapse dwell. Fills the solid progress
   *  overlay inside the 0→1 vertical connector. */
  step1ProgressP?: MotionValue<number>;
  /** 0 → 1 across the cards (tap-to-track content) phase. Fills the
   *  solid progress overlay inside the 1→2 vertical connector. */
  step2ProgressP?: MotionValue<number>;
  /** 0 → 1 across the on-demand-learning phase. Fills the solid
   *  progress overlay inside the 2→3 vertical connector. */
  step3ProgressP?: MotionValue<number>;
  /** 0 → 1 across the gym-specific-AI phase. Fills the solid
   *  progress overlay inside the 3→4 vertical connector. */
  step4ProgressP?: MotionValue<number>;
  /** 0 → 1 across the compete/community phase. Fills the solid
   *  progress overlay inside the 4→5 vertical connector. */
  step5ProgressP?: MotionValue<number>;
  /** 0 → 1 across the visualize-progress fan phase. Fills the solid
   *  progress overlay inside the trailing dashed line from dot 5
   *  (VISUALIZE PROGRESS) down to the horizontal section-end marker. */
  step6ProgressP?: MotionValue<number>;
  /** 0 → 1: step 2 transition. Pulls dot 1 (the second visual dot)
   *  back up from the collapsed stack to its `lineY` slot right
   *  underneath dot 0, and ramps its label + dashed-line opacity from
   *  the collapsed-floor (0.25 / 0.4) up to 1 — matching dot 0. */
  step2TransitionP?: MotionValue<number>;
  /** 0 → 1: step 3 transition. Same wiring as step 2 but for dot 2
   *  (the third visual dot — TAP-TO-TRACK), which rises into its
   *  `lineY` slot under dot 1 as the tracking cards reveal. */
  step3TransitionP?: MotionValue<number>;
  /** 0 → 1: step 4 transition. Same wiring but for dot 3 (the fourth
   *  visual dot — GYM-SPECIFIC AI). */
  step4TransitionP?: MotionValue<number>;
  /** 0 → 1: step 5 transition. Same wiring but for dot 4 (the fifth
   *  visual dot — COMPETE/COMMUNITY). */
  step5TransitionP?: MotionValue<number>;
  /** 0 → 1: step 6 transition. Same wiring but for dot 5 (the sixth
   *  visual dot — VISUALIZE PROGRESS). */
  step6TransitionP?: MotionValue<number>;
  /** 0 → 1 across the exit-wheel phase. Used to fade the trailing
   *  dashed line + horizontal section-end marker BEFORE slot 5
   *  begins its reverse-animation back to the loading wheel. */
  exitWheelP?: MotionValue<number>;
};

export function HowItWorksSteps({
  progress,
  collapseP,
  step1ProgressP,
  step2ProgressP,
  step3ProgressP,
  step4ProgressP,
  step5ProgressP,
  step6ProgressP,
  step2TransitionP,
  step3TransitionP,
  step4TransitionP,
  step5TransitionP,
  step6TransitionP,
  exitWheelP,
}: Props) {
  const [p, setP] = useState(() => progress.get());
  const [cP, setCP] = useState(() => collapseP.get());
  const [sp, setSP] = useState(() => step1ProgressP?.get() ?? 0);
  const [sp2, setSP2] = useState(() => step2ProgressP?.get() ?? 0);
  const [sp3, setSP3] = useState(() => step3ProgressP?.get() ?? 0);
  const [sp4, setSP4] = useState(() => step4ProgressP?.get() ?? 0);
  const [sp5, setSP5] = useState(() => step5ProgressP?.get() ?? 0);
  const [sp6, setSP6] = useState(() => step6ProgressP?.get() ?? 0);
  const [s2P, setS2P] = useState(() => step2TransitionP?.get() ?? 0);
  const [s3P, setS3P] = useState(() => step3TransitionP?.get() ?? 0);
  const [s4P, setS4P] = useState(() => step4TransitionP?.get() ?? 0);
  const [s5P, setS5P] = useState(() => step5TransitionP?.get() ?? 0);
  const [s6P, setS6P] = useState(() => step6TransitionP?.get() ?? 0);
  const [ewP, setEwP] = useState(() => exitWheelP?.get() ?? 0);
  const [vh, setVh] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.clientHeight
      : 0,
  );

  useEffect(() => progress.on("change", setP), [progress]);
  useEffect(() => collapseP.on("change", setCP), [collapseP]);
  useEffect(() => {
    if (!step1ProgressP) return;
    return step1ProgressP.on("change", setSP);
  }, [step1ProgressP]);
  useEffect(() => {
    if (!step2ProgressP) return;
    return step2ProgressP.on("change", setSP2);
  }, [step2ProgressP]);
  useEffect(() => {
    if (!step3ProgressP) return;
    return step3ProgressP.on("change", setSP3);
  }, [step3ProgressP]);
  useEffect(() => {
    if (!step4ProgressP) return;
    return step4ProgressP.on("change", setSP4);
  }, [step4ProgressP]);
  useEffect(() => {
    if (!step5ProgressP) return;
    return step5ProgressP.on("change", setSP5);
  }, [step5ProgressP]);
  useEffect(() => {
    if (!step6ProgressP) return;
    return step6ProgressP.on("change", setSP6);
  }, [step6ProgressP]);
  useEffect(() => {
    if (!step2TransitionP) return;
    return step2TransitionP.on("change", setS2P);
  }, [step2TransitionP]);
  useEffect(() => {
    if (!step3TransitionP) return;
    return step3TransitionP.on("change", setS3P);
  }, [step3TransitionP]);
  useEffect(() => {
    if (!step4TransitionP) return;
    return step4TransitionP.on("change", setS4P);
  }, [step4TransitionP]);
  useEffect(() => {
    if (!step5TransitionP) return;
    return step5TransitionP.on("change", setS5P);
  }, [step5TransitionP]);
  useEffect(() => {
    if (!step6TransitionP) return;
    return step6TransitionP.on("change", setS6P);
  }, [step6TransitionP]);
  useEffect(() => {
    if (!exitWheelP) return;
    return exitWheelP.on("change", setEwP);
  }, [exitWheelP]);
  useEffect(() => {
    const update = () => setVh(document.documentElement.clientHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Current Y of each dot (linePos i → viewport y).
  // Dot 1 (the second dot) additionally lerps from its collapsed
  // resting position BACK up to its `lineY` slot (right under dot 0)
  // when `step2TransitionP` rises during the step 2 transition.
  const dotY = (i: number) => {
    const lineY = DOT_TOP_Y + i * DOT_SPACING;
    if (i === 0 || cP === 0) return lineY;
    const collapseY = vh - BOTTOM_MARGIN - (N - 1 - i) * DOT_SPACING;
    const baseY = lineY + (collapseY - lineY) * cP;
    if (i === 1 && s2P > 0) {
      return baseY + (lineY - baseY) * s2P;
    }
    if (i === 2 && s3P > 0) {
      return baseY + (lineY - baseY) * s3P;
    }
    if (i === 3 && s4P > 0) {
      return baseY + (lineY - baseY) * s4P;
    }
    if (i === 4 && s5P > 0) {
      return baseY + (lineY - baseY) * s5P;
    }
    if (i === 5 && s6P > 0) {
      return baseY + (lineY - baseY) * s6P;
    }
    return baseY;
  };

  // Opacity fade: dot 0's bits stay at 1; everything else fades.
  // Labels and dashed lines drop to different floors so the text
  // recedes more than the connectors do.
  const textFadeOpacity = 1 - cP * (1 - COLLAPSED_TEXT_OPACITY);
  const lineFadeOpacity = 1 - cP * (1 - COLLAPSED_LINE_OPACITY);

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Vertical connectors between consecutive dots. Drawing
          animation runs during the line phase; once drawn, the
          connector's geometry tracks the dots' current positions. */}
      {Array.from({ length: N - 1 }).map((_, i) => {
        const startP = LINE_STAGGER * i + LINE_DURATION;
        const endP = LINE_STAGGER * (i + 1) + LINE_DURATION;
        const localP =
          p <= startP ? 0 : p >= endP ? 1 : (p - startP) / (endP - startP);
        const upperY = dotY(i);
        const lowerY = dotY(i + 1);
        const top = upperY + DOT_RADIUS;
        const maxHeight = lowerY - DOT_RADIUS - top;
        return (
          <div
            key={`vline-${i}`}
            className="text-fg-base/50 absolute"
            style={{
              top,
              left: DOT_LEFT_X - 0.5,
              width: 1,
              height: maxHeight * localP,
              backgroundImage:
                "repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px)",
              opacity: lineFadeOpacity,
            }}
          />
        );
      })}
      {/* Solid progress overlay over the 0→1 vertical connector.
          Fills downward as the user scrolls through the post-
          description dwell, showing how close they are to step 2.
          Anchored to dot 0's bottom (fixed) and extends toward dot 1
          (collapsed to the bottom of the viewport). */}
      {sp > 0 &&
        (() => {
          const top = dotY(0) + DOT_RADIUS;
          const maxHeight = dotY(1) - DOT_RADIUS - top;
          return (
            <div
              className="bg-fg-base absolute"
              style={{
                top,
                left: DOT_LEFT_X - 0.5,
                width: 1,
                height: Math.max(0, maxHeight) * sp,
              }}
            />
          );
        })()}
      {/* Step 2 progress overlay — 1→2 vertical connector. Starts
          filling the moment dot 1 (TAP-TO-TRACK) arrives at the top
          and runs through the tracking cards phase. */}
      {sp2 > 0 &&
        (() => {
          const top = dotY(1) + DOT_RADIUS;
          const maxHeight = dotY(2) - DOT_RADIUS - top;
          return (
            <div
              className="bg-fg-base absolute"
              style={{
                top,
                left: DOT_LEFT_X - 0.5,
                width: 1,
                height: Math.max(0, maxHeight) * sp2,
              }}
            />
          );
        })()}
      {/* Step 3 progress overlay — 2→3 vertical connector. Starts
          filling the moment dot 2 (ON-DEMAND LEARNING) arrives at
          the top and runs through the learning cards phase. */}
      {sp3 > 0 &&
        (() => {
          const top = dotY(2) + DOT_RADIUS;
          const maxHeight = dotY(3) - DOT_RADIUS - top;
          return (
            <div
              className="bg-fg-base absolute"
              style={{
                top,
                left: DOT_LEFT_X - 0.5,
                width: 1,
                height: Math.max(0, maxHeight) * sp3,
              }}
            />
          );
        })()}
      {/* Step 4 progress overlay — 3→4 vertical connector. Starts
          filling the moment dot 3 (GYM-SPECIFIC AI) arrives at the
          top and runs through the equipment cluster reveal. */}
      {sp4 > 0 &&
        (() => {
          const top = dotY(3) + DOT_RADIUS;
          const maxHeight = dotY(4) - DOT_RADIUS - top;
          return (
            <div
              className="bg-fg-base absolute"
              style={{
                top,
                left: DOT_LEFT_X - 0.5,
                width: 1,
                height: Math.max(0, maxHeight) * sp4,
              }}
            />
          );
        })()}
      {/* Step 5 progress overlay — 4→5 vertical connector. Starts
          filling the moment dot 4 (COMPETE/COMMUNITY) arrives at the
          top (and the "Your gym is a team now" title starts typing),
          then runs through to the end of the sequence. */}
      {sp5 > 0 &&
        (() => {
          const top = dotY(4) + DOT_RADIUS;
          const maxHeight = dotY(5) - DOT_RADIUS - top;
          return (
            <div
              className="bg-fg-base absolute"
              style={{
                top,
                left: DOT_LEFT_X - 0.5,
                width: 1,
                height: Math.max(0, maxHeight) * sp5,
              }}
            />
          );
        })()}
      {/* Trailing dashed vertical line + horizontal bottom marker that
          appears as dot 5 (VISUALIZE PROGRESS) rises during the step 6
          transition. The vertical line traces the dot's path from its
          original collapsed-stack position (vh - BOTTOM_MARGIN) up to
          its current y. The horizontal line at the bottom marks the
          end of the How It Works section. */}
      {s6P > 0 &&
        (() => {
          const top = dotY(5) + DOT_RADIUS;
          const bottom = vh - BOTTOM_MARGIN;
          const height = Math.max(0, bottom - top);
          // Fade the trailing dashed line + horizontal marker out
          // over exitWheelP ∈ [0.33, 0.40] — finishing just as slot 5
          // (the dot they're anchored to) begins its reverse-animation
          // to the wheel.
          const exitTrailFade = Math.max(
            0,
            Math.min(1, (ewP - 0.33) / 0.07),
          );
          const trailVisible = 1 - exitTrailFade;
          return (
            <>
              <div
                className="text-fg-base/50 absolute"
                style={{
                  top,
                  left: DOT_LEFT_X - 0.5,
                  width: 1,
                  height: height * trailVisible,
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, currentColor 0 3px, transparent 3px 6px)",
                  opacity: lineFadeOpacity,
                }}
              />
              {sp6 > 0 && (
                <div
                  className="bg-fg-base absolute"
                  style={{
                    top,
                    left: DOT_LEFT_X - 0.5,
                    width: 1,
                    height: height * sp6 * trailVisible,
                  }}
                />
              )}
              <div
                className="bg-fg-base absolute"
                style={{
                  top: bottom,
                  left: DOT_LEFT_X - 10,
                  width: 20,
                  height: 1,
                  opacity: lineFadeOpacity * trailVisible,
                }}
              />
            </>
          );
        })()}
      {LABELS.map((label, i) => {
        const arrivalEnd = LINE_STAGGER * i + LINE_DURATION;
        const lineDrawEnd = arrivalEnd + LINE_DRAW_LEN;
        const textRevealEnd = lineDrawEnd + TEXT_REVEAL_LEN;

        const linePLocal =
          p <= arrivalEnd
            ? 0
            : p >= lineDrawEnd
              ? 1
              : (p - arrivalEnd) / LINE_DRAW_LEN;
        const textPLocal =
          p <= lineDrawEnd
            ? 0
            : p >= textRevealEnd
              ? 1
              : (p - lineDrawEnd) / TEXT_REVEAL_LEN;
        const textRevealOpacity = flicker(textPLocal);
        // Dot 0's label + dashed line stay at full opacity. Dots 1-5
        // fade with the collapse — labels go to 25%, dashes to 40%.
        // Dot 1 additionally ramps BACK to 1 as `step2TransitionP`
        // rises, matching dot 0 at the end of the transition.
        let labelCollapseOpacity: number;
        let dashCollapseOpacity: number;
        if (i === 0) {
          labelCollapseOpacity = 1;
          dashCollapseOpacity = 1;
        } else if (i === 1) {
          labelCollapseOpacity =
            textFadeOpacity + (1 - textFadeOpacity) * s2P;
          dashCollapseOpacity =
            lineFadeOpacity + (1 - lineFadeOpacity) * s2P;
        } else if (i === 2) {
          labelCollapseOpacity =
            textFadeOpacity + (1 - textFadeOpacity) * s3P;
          dashCollapseOpacity =
            lineFadeOpacity + (1 - lineFadeOpacity) * s3P;
        } else if (i === 3) {
          labelCollapseOpacity =
            textFadeOpacity + (1 - textFadeOpacity) * s4P;
          dashCollapseOpacity =
            lineFadeOpacity + (1 - lineFadeOpacity) * s4P;
        } else if (i === 4) {
          labelCollapseOpacity =
            textFadeOpacity + (1 - textFadeOpacity) * s5P;
          dashCollapseOpacity =
            lineFadeOpacity + (1 - lineFadeOpacity) * s5P;
        } else if (i === 5) {
          labelCollapseOpacity =
            textFadeOpacity + (1 - textFadeOpacity) * s6P;
          dashCollapseOpacity =
            lineFadeOpacity + (1 - lineFadeOpacity) * s6P;
        } else {
          labelCollapseOpacity = textFadeOpacity;
          dashCollapseOpacity = lineFadeOpacity;
        }
        const finalLabelOpacity = textRevealOpacity * labelCollapseOpacity;
        const finalDashOpacity = linePLocal > 0 ? dashCollapseOpacity : 0;

        const currentY = dotY(i);
        const lineLeft = DOT_LEFT_X + DOT_RADIUS + LINE_GAP;
        const labelLeft = lineLeft + LINE_LEN + LABEL_GAP;

        return (
          <div key={i}>
            <div
              className="text-fg-base/50 absolute"
              style={{
                top: currentY - 0.5,
                left: lineLeft,
                height: 1,
                width: LINE_LEN * linePLocal,
                backgroundImage:
                  "repeating-linear-gradient(to right, currentColor 0 3px, transparent 3px 6px)",
                opacity: finalDashOpacity,
              }}
            />
            <button
              type="button"
              aria-label={`Go to step ${i + 1}: ${label}`}
              onClick={() => scrollToVh(STEP_TARGETS[i])}
              className="font-body text-fg-base hover:text-fg-base/70 pointer-events-auto absolute cursor-pointer whitespace-nowrap bg-transparent p-0 text-left text-[11px] font-medium uppercase tracking-[0.14em] transition-colors focus:outline-none focus-visible:underline"
              style={{
                top: currentY,
                left: labelLeft,
                transform: "translateY(-50%)",
                opacity: finalLabelOpacity,
              }}
            >
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function flicker(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 0.2) return 0.4;
  if (t < 0.35) return 0.1;
  if (t < 0.55) return 0.7;
  if (t < 0.7) return 0.3;
  const r = (t - 0.7) / 0.3;
  return 0.3 + r * 0.7;
}
