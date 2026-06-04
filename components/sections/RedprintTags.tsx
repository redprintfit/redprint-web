"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useTheme } from "@/lib/useTheme";

/**
 * Six Redprint tags (one per org) floating in the right half of the
 * viewport. Behaviour:
 *
 *  - Bouncy scale-in driven by `progress` (= collapseP) with a small
 *    per-tag stagger. Spring overshoot gives the bounce.
 *  - Mouse-tracking float — the cursor's offset from the viewport
 *    centre nudges each tag, with a spring-smoothed lag so the
 *    motion feels organic (per-tag sensitivity varies for parallax).
 *  - A coloured glow behind each tag matches its org's primary
 *    colour (gradients for the two orgs that use them).
 */

type TagConfig = {
  id: string;
  src: string;
  glow: string; // CSS color or gradient
  /** Position in viewport: x (left%), y (top%). */
  position: { x: string; y: string };
  /** Per-tag mouse-track sensitivity in px (max translate). */
  parallax: number;
  /** Tag width in px (hex aspect). */
  size: number;
};

// Generic tag's glow is theme-driven (set per-tick from useTheme).
const GENERIC_GLOW_DARK = "rgba(245, 241, 238, 0.7)";
const GENERIC_GLOW_LIGHT = "rgba(10, 10, 10, 0.7)";

const TAGS: TagConfig[] = [
  {
    id: "waverley_oaks",
    src: "/tags/waverley-oaks.png",
    glow: "#ee5b26",
    position: { x: "30%", y: "33%" },
    parallax: 22,
    size: 100,
  },
  {
    id: "swarthmore",
    src: "/tags/swarthmore.png",
    glow: "#a30c33",
    position: { x: "46%", y: "33%" },
    parallax: 28,
    size: 100,
  },
  {
    id: "gym_it",
    src: "/tags/gym-it.png",
    glow: "#005fbd",
    position: { x: "26%", y: "51%" },
    parallax: 18,
    size: 100,
  },
  {
    id: "generic",
    src: "/tags/generic.png",
    glow: GENERIC_GLOW_DARK, // overridden per-theme inside the Tag
    position: { x: "38%", y: "51%" },
    parallax: 14,
    size: 145,
  },
  {
    id: "niagara",
    src: "/tags/niagara.png",
    glow: "#592d82",
    position: { x: "50%", y: "51%" },
    parallax: 26,
    size: 100,
  },
  {
    id: "ymca_middlesex",
    src: "/tags/ymca.png",
    glow: "linear-gradient(135deg, #592d82 0%, #3c87c9 100%)",
    position: { x: "31%", y: "69%" },
    parallax: 20,
    size: 100,
  },
  {
    id: "suny_oswego",
    src: "/tags/oswego.png",
    glow: "linear-gradient(135deg, #00602e 0%, #fcc31a 100%)",
    position: { x: "45%", y: "69%" },
    parallax: 24,
    size: 100,
  },
];

export function RedprintTags({
  progress,
  fadeOutP,
  placeP,
  placeTarget,
  centreFadeOutP,
}: {
  progress: MotionValue<number>;
  /** 0 → 1: surround tags collapse to the centre and disappear; the
   *  centre tag also fades out at the very end. */
  fadeOutP?: MotionValue<number>;
  /** 0 → 1: drives the centre tag's slide from its current position
   *  to `placeTarget` — used by the "place tag on equipment" phase
   *  that runs after the surround tags have collapsed. */
  placeP?: MotionValue<number>;
  /** Viewport target (x = "NN%", y = "NN%") for the centre tag at
   *  placeP = 1. */
  placeTarget?: { x: string; y: string };
  /** 0 → 1: hard fade-out applied ONLY to the centre tag. Used during
   *  the step 2 transition so the centre tag leaves the stage along
   *  with the equipment. */
  centreFadeOutP?: MotionValue<number>;
}) {
  // Mouse delta from viewport centre, normalised to [-0.5, 0.5].
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  const isDark = useTheme() === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {TAGS.map((tag, i) => {
        // The generic centerpiece flips its glow per theme: white halo
        // in dark mode, black halo in light mode.
        const config =
          tag.id === "generic"
            ? {
                ...tag,
                glow: isDark ? GENERIC_GLOW_DARK : GENERIC_GLOW_LIGHT,
              }
            : tag;
        const generic = TAGS.find((t) => t.id === "generic")!;
        return (
          <Tag
            key={tag.id}
            config={config}
            index={i}
            progress={progress}
            mouseX={mouseX}
            mouseY={mouseY}
            fadeOutP={fadeOutP}
            centerPosition={generic.position}
            isCentre={tag.id === "generic"}
            isDark={isDark}
            placeP={placeP}
            placeTarget={placeTarget}
            centreFadeOutP={centreFadeOutP}
          />
        );
      })}
    </div>
  );
}

function Tag({
  config,
  index,
  progress,
  mouseX,
  mouseY,
  fadeOutP,
  centerPosition,
  isCentre,
  isDark,
  placeP,
  placeTarget,
  centreFadeOutP,
}: {
  config: TagConfig;
  index: number;
  progress: MotionValue<number>;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  fadeOutP?: MotionValue<number>;
  centerPosition: { x: string; y: string };
  isCentre: boolean;
  isDark: boolean;
  placeP?: MotionValue<number>;
  placeTarget?: { x: string; y: string };
  centreFadeOutP?: MotionValue<number>;
}) {
  const { src, glow, position, parallax, size } = config;

  // Bouncy scale-in tied to scroll progress (with small stagger).
  const scaleTarget = useTransform(progress, (p) => {
    const stagger = index * 0.04;
    const localP = Math.max(0, Math.min(1, (p - stagger) / 0.25));
    return localP;
  });
  const scaleIn = useSpring(scaleTarget, {
    stiffness: 220,
    damping: 11,
    mass: 0.9,
  });

  // Ambient floating — slow sine waves with per-tag phase + speed so
  // every tag drifts on its own rhythm even when the cursor is still.
  // `useTime` is a MotionValue of ms since the framer ticker started.
  const time = useTime();
  const phaseX = (index * 1.73) % (Math.PI * 2);
  const phaseY = (index * 2.41) % (Math.PI * 2);
  const speedX = 0.00055 + (index % 3) * 0.00008;
  const speedY = 0.00065 + ((index + 1) % 3) * 0.00007;
  const ambientAmp = 7;
  // Always-defined fade-out source so hooks stay stable; reads from
  // the parent's fadeOutP when provided.
  const zeroFade = useMotionValue(0);
  const fOutSrc = fadeOutP ?? zeroFade;
  // Wobble multiplier — fades all random + cursor-driven motion to 0
  // as the tag travels to the centre. Stays at 1 before fadeOutP rises.
  const wobbleMult = useTransform(fOutSrc, (v) => 1 - v);
  const ambientX = useTransform(
    [time, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [t, m] = vals as unknown as [number, number];
      return Math.sin(t * speedX + phaseX) * ambientAmp * m;
    },
  );
  const ambientY = useTransform(
    [time, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [t, m] = vals as unknown as [number, number];
      return Math.cos(t * speedY + phaseY) * ambientAmp * m;
    },
  );
  // Ambient scale fluctuation — independent sine wave (own phase +
  // speed) so the breathing motion doesn't sync up with the x/y
  // floating. Amp 0.03 = ±3% scale wobble.
  const phaseS = (index * 1.91) % (Math.PI * 2);
  const speedS = 0.00045 + (index % 4) * 0.00006;
  const ambientScaleAmp = 0.03;
  const ambientScale = useTransform(
    time,
    (t) => 1 + Math.sin(t * speedS + phaseS) * ambientScaleAmp,
  );
  // Final scale = bouncy scale-in × ambient wobble. Multiplicative so
  // the wobble is invisible while the tag is still scaling in (mult
  // by ~0 stays ~0); takes over fully once the tag's reached size 1.
  const scale = useTransform(
    [scaleIn, ambientScale] as MotionValue<number>[],
    (vals) => {
      const [s, a] = vals as unknown as [number, number];
      return s * a;
    },
  );

  // Per-tag spring config — varied so the cursor influence doesn't
  // move every card in lockstep. Stiffness/damping deltas give each
  // tag its own response curve.
  const stiff = 65 + ((index * 13) % 25); // 65-89
  const damp = 15 + ((index * 7) % 8); // 15-22

  // Cursor-driven translate, with ambient sine added IN. The sine
  // contributes its own offset on top of the parallax target.
  // `wobbleMult` zeroes the cursor parallax during the fade-out
  // transition so the tag glides cleanly to the centre.
  const xTarget = useTransform(
    [mouseX, ambientX, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [m, a, w] = vals as unknown as [number, number, number];
      return m * parallax * 2 * w + a;
    },
  );
  const yTarget = useTransform(
    [mouseY, ambientY, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [m, a, w] = vals as unknown as [number, number, number];
      return m * parallax * 2 * w + a;
    },
  );
  const x = useSpring(xTarget, { stiffness: stiff, damping: damp, mass: 1 });
  const y = useSpring(yTarget, { stiffness: stiff, damping: damp, mass: 1 });

  // Cursor-driven rotation — small Z-axis tilt that varies per tag.
  // Sign alternation (i % 2) makes adjacent tags tilt opposite, like
  // mobiles reacting to the same wind.
  const rotateSensitivity = 6 + (index % 3) * 1.5;
  const rotateSign = index % 2 === 0 ? 1 : -1;
  const rotateTarget = useTransform(
    [mouseX, mouseY, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [mx, my, w] = vals as unknown as [number, number, number];
      return (mx * 0.9 + my * 0.4) * rotateSensitivity * rotateSign * w;
    },
  );
  const rotate = useSpring(rotateTarget, {
    stiffness: stiff,
    damping: damp,
    mass: 1,
  });

  const glowSize = size * 1.1;
  const halfTag = size / 2;
  const halfGlow = glowSize / 2;

  // Step-1 fade-out: surround tags slide toward the centre position.
  // They hold full opacity through the slide, then drop to 0 over the
  // final 30% — that takes the trailing GLOW halos (which the centre
  // tag can't cover because the blur extends past its bounds) with
  // them. Centre tag stays at 1 throughout.
  //
  // For the centre tag, fOutSrc → 0 (no slide); instead its left/top
  // lerp from its starting position toward `placeTarget`, driven by
  // `placeP`, during the "place on equipment" phase.
  const zeroPlace = useMotionValue(0);
  const placeSrc = placeP ?? zeroPlace;
  const centreTargetX = placeTarget?.x ?? position.x;
  const centreTargetY = placeTarget?.y ?? position.y;
  const left = useTransform(
    [fOutSrc, placeSrc] as MotionValue<number>[],
    (vals) => {
      const [f, pl] = vals as unknown as [number, number];
      return isCentre
        ? lerpPercent(position.x, centreTargetX, pl)
        : lerpPercent(position.x, centerPosition.x, f);
    },
  );
  const top = useTransform(
    [fOutSrc, placeSrc] as MotionValue<number>[],
    (vals) => {
      const [f, pl] = vals as unknown as [number, number];
      return isCentre
        ? lerpPercent(position.y, centreTargetY, pl)
        : lerpPercent(position.y, centerPosition.y, f);
    },
  );
  const zeroCentreFade = useMotionValue(0);
  const centreFadeSrc = centreFadeOutP ?? zeroCentreFade;
  const disappearOpacity = useTransform(
    [fOutSrc, centreFadeSrc] as MotionValue<number>[],
    (vals) => {
      const [v, c] = vals as unknown as [number, number];
      // Centre tag stays at 1 through fOutSrc, then receives its own
      // fade-out from centreFadeOutP during the step 2 transition.
      if (isCentre) return 1 - c;
      if (v <= 0.7) return 1;
      return 1 - (v - 0.7) / 0.3;
    },
  );

  // The generic centerpiece PNG is light-on-dark; in LIGHT mode we
  // invert the colours via a CSS filter so it reads as dark-on-light.
  const invertForLight = isCentre && !isDark;

  return (
    <motion.div
      className="absolute"
      style={{
        left,
        top,
        x,
        y,
        rotate,
        width: size,
        height: size,
        marginLeft: -halfTag,
        marginTop: -halfTag,
        scale,
        opacity: disappearOpacity,
        // Centre tag stacks ABOVE the surround tags so they slide
        // BEHIND it as the fade-out plays out.
        zIndex: isCentre ? 1 : 0,
      }}
    >
      <div
        aria-hidden
        className="absolute"
        style={{
          width: glowSize,
          height: glowSize,
          left: -halfGlow + halfTag,
          top: -halfGlow + halfTag,
          background: glow,
          borderRadius: "50%",
          filter: "blur(48px)",
          opacity: 0.55,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="relative h-full w-full object-contain select-none"
        style={invertForLight ? { filter: "invert(1)" } : undefined}
      />
    </motion.div>
  );
}

/** Parse "NN%" → number, lerp toward the same form, return "NN.NN%". */
function lerpPercent(a: string, b: string, t: number): string {
  const aN = parseFloat(a);
  const bN = parseFloat(b);
  return `${aN + (bN - aN) * t}%`;
}
