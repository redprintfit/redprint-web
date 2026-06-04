"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";

type SilhouetteSpec = {
  src: string;
  opacity: number;
  // Per-silhouette stagger relative to triggerTime (ms).
  delay: number;
  // Resting Y position as a % of the silhouette's own height — how
  // far the image sinks BELOW its bottom-0 anchor at rest. 0 = flush
  // with bottom; positive values sink the image so only its top
  // peeks above the foreground silhouette. Interpolated between
  // `minRestPct` (at SMALL_VW or narrower) and `maxRestPct` (at
  // LARGE_VW or wider). Small viewports → little offset (silhouettes
  // sit close to flush); wide viewports → larger offset (composite
  // stays compact even as images grow taller with viewport width).
  minRestPct: number;
  maxRestPct: number;
  // Ambient vertical bob — amp in px, speed in rad/ms, phase in rad.
  // Foreground silhouette gets the largest amp; backgrounds smaller
  // for a parallax/depth feel. All amps are SUBTLE (≤ 5px).
  bobAmp: number;
  bobSpeed: number;
  bobPhase: number;
  // If true, a solid rectangle (200px tall, black in dark mode /
  // white in light mode) is glued to the image's bottom edge and
  // translates with it. Below viewport at rest; rises into view to
  // fill the gap when `easeOutBack` overshoots and the image bottom
  // lifts above viewport bottom. Only the foreground silhouette
  // needs this — backgrounds sit behind it so their overshoot is
  // never visible through.
  extendBottom?: boolean;
};

const SILHOUETTES: SilhouetteSpec[] = [
  {
    src: "/silhouettes/fitness_silhouette_1.png",
    opacity: 1,
    delay: 0,
    minRestPct: 0,
    maxRestPct: 0,
    bobAmp: 8,
    bobSpeed: 0.00085,
    bobPhase: 0,
    extendBottom: true,
  },
  {
    src: "/silhouettes/fitness_silhouette_2.png",
    opacity: 0.6,
    delay: 380,
    minRestPct: 4,
    maxRestPct: 20,
    bobAmp: 6,
    bobSpeed: 0.0008,
    bobPhase: 1.4,
  },
  {
    src: "/silhouettes/fitness_silhouette_3.png",
    opacity: 0.25,
    delay: 760,
    minRestPct: 12,
    maxRestPct: 40,
    bobAmp: 4,
    bobSpeed: 0.00075,
    bobPhase: 2.7,
  },
];

const BOUNCE_DURATION_MS = 750;
const OFFSCREEN_PCT = 110;
// Viewport-width range the rest offset interpolates over.
const SMALL_VW = 1024;
const LARGE_VW = 2560;
// Sentence is visually complete around here — use 0.95 (not 1.0)
// because scroll progress in Lenis often asymptotes shy of exact 1.
const TRIGGER_THRESHOLD = 0.95;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function BottomSilhouettes({
  formTextP,
}: {
  formTextP: MotionValue<number>;
}) {
  const time = useTime();
  const triggerTime = useMotionValue(0);
  // Track viewport width so the rest offset interpolation reacts
  // to resize events without forcing a re-render of the imgs.
  const viewportW = useMotionValue(
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  useEffect(() => {
    const update = () => viewportW.set(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [viewportW]);

  // Subscribe to formTextP and also evaluate the CURRENT value on
  // mount — Framer's "change" event only fires on subsequent
  // changes, so without this the silhouettes never trigger if the
  // user is already at the end of scroll when the component mounts.
  useEffect(() => {
    const evaluate = () => {
      const v = formTextP.get();
      const tt = triggerTime.get();
      if (v >= TRIGGER_THRESHOLD && tt === 0) {
        triggerTime.set(time.get());
      } else if (v < TRIGGER_THRESHOLD && tt !== 0) {
        triggerTime.set(0);
      }
    };
    evaluate();
    return formTextP.on("change", evaluate);
  }, [formTextP, time, triggerTime]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[52] overflow-hidden"
    >
      {/* DOM order back→front: silhouette 3 paints first (background),
          then 2, then 1 (foreground on top). */}
      {[2, 1, 0].map((i) => (
        <SilhouetteImg
          key={i}
          spec={SILHOUETTES[i]}
          time={time}
          triggerTime={triggerTime}
          viewportW={viewportW}
        />
      ))}
    </div>
  );
}

function SilhouetteImg({
  spec,
  time,
  triggerTime,
  viewportW,
}: {
  spec: SilhouetteSpec;
  time: MotionValue<number>;
  triggerTime: MotionValue<number>;
  viewportW: MotionValue<number>;
}) {
  // y combines two motions:
  //   1. Bounce-in (% of image height) — OFFSCREEN_PCT → restPct
  //      with an easeOutBack overshoot. restPct itself interpolates
  //      between spec.minRestPct (narrow viewports) and
  //      spec.maxRestPct (wide viewports), so the rest offset scales
  //      with viewport width — small screens → little sink, wide
  //      screens → larger sink — keeping the composite compact on
  //      wide monitors without cropping anything.
  //   2. Ambient bob (px) — small sine wave, independent of scroll.
  //      Each silhouette has its own amp / speed / phase so they
  //      drift independently.
  // Mixed via CSS calc() so the % and px coordinates stay distinct.
  const y = useTransform(
    [time, triggerTime, viewportW] as MotionValue<number>[],
    (vals) => {
      const [t, tt, vw] = vals as unknown as [number, number, number];
      const vwT = Math.max(
        0,
        Math.min(1, (vw - SMALL_VW) / (LARGE_VW - SMALL_VW)),
      );
      const restPct =
        spec.minRestPct + (spec.maxRestPct - spec.minRestPct) * vwT;
      let basePct: number;
      if (tt === 0) {
        basePct = OFFSCREEN_PCT;
      } else {
        const elapsed = t - tt - spec.delay;
        if (elapsed < 0) basePct = OFFSCREEN_PCT;
        else if (elapsed >= BOUNCE_DURATION_MS) basePct = restPct;
        else {
          const eased = easeOutBack(elapsed / BOUNCE_DURATION_MS);
          basePct = OFFSCREEN_PCT + eased * (restPct - OFFSCREEN_PCT);
        }
      }
      const bob = Math.sin(t * spec.bobSpeed + spec.bobPhase) * spec.bobAmp;
      return `calc(${basePct}% + ${bob}px)`;
    },
  );

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none"
      style={{ y, opacity: spec.opacity }}
    >
      <img
        src={spec.src}
        alt=""
        aria-hidden
        draggable={false}
        className="block w-full light:invert"
      />
      {spec.extendBottom && (
        <div
          aria-hidden
          className="absolute inset-x-0 bg-black light:bg-white"
          style={{ top: "100%", height: 200 }}
        />
      )}
    </motion.div>
  );
}
