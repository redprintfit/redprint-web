"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { useTheme } from "@/lib/useTheme";
import { darken, lighten } from "@/lib/content/orgs";

/**
 * Testimonials section overlay. Lives inside ScrollSequence's sticky
 * frame as a SIBLING of the bg-slide wrapper — so as the how-it-works
 * content slides up and out, this layer stays anchored in the viewport
 * and the reformed loading wheel (rendered by LoadingRing) continues
 * to spin at its centre, then physically spreads its 6 dots out to
 * the testimonial slots defined here.
 *
 * Visual layers, back-to-front:
 *   1. Full-screen black/white background (theme-aware), opacity
 *      driven by `bgOpacityP` so it fades in as the how-it-works
 *      content slides up.
 *   2. Hundreds of small hollow stroke-only dots (NO fill). Each is
 *      assigned to one of the 6 main-dot slots; they BURST out from
 *      that slot's current position when that slot's spread crosses
 *      0.5 — like a particle explosion.
 *   3. Dashed connector lines from each testimonial anchor (= where
 *      the LoadingRing dot lands) to its card.
 *   4. 6 testimonial cards (org accent + first name + gym + quote).
 *   5. Title "What the Redprint community has to say" at the top.
 *
 * The 6 MAIN dots are NOT rendered here — LoadingRing renders them
 * (they ARE the wheel's 6 dots, just physically translated out to
 * the testimonial anchors). This component exports TESTIMONIALS so
 * ScrollSequence can hand the anchor positions to LoadingRing.
 */

export type Testimonial = {
  firstName: string;
  gym: string;
  /** Hex of the org's accent color (used to tint the card bg
   *  through `lighten`/`darken` and to fall back on for the
   *  org-logo circle when no image is supplied). */
  accent: string;
  /** Path under `/public/` for the gym's logo PNG. Rendered in the
   *  card's top-left avatar circle (over a white plate so the logo
   *  reads on any tinted card bg). */
  logoSrc: string;
  quote: string;
  /** Viewport-relative anchor in % of (vw, vh). The card floats
   *  randomly around this anchor; the LoadingRing's dot ends here. */
  anchor: { x: number; y: number };
  /** Per-card pseudo-random seed used by the ambient float so the
   *  cards don't all bob in sync. */
  phase: number;
  /** Side the card sits on relative to its dot, so connector lines
   *  always have somewhere readable to draw to. */
  cardSide: "left" | "right" | "above" | "below";
};

// Six testimonials hand-picked from the user's supplied list,
// scattered across the viewport in irregular positions (NOT a
// symmetric oval). Each anchor also doubles as the LoadingRing
// spread target — keeping them in one place stops the dots and
// cards from drifting apart.
export const TESTIMONIALS: Testimonial[] = [
  {
    firstName: "Morrison",
    gym: "Clemson",
    accent: "#F66733",
    logoSrc: "/logos/gym_logos/clemson_logo.jpg",
    quote: "This is the best workout app I've ever used.",
    anchor: { x: 84, y: 50 },
    phase: 0.13,
    cardSide: "left",
  },
  {
    firstName: "Evan",
    gym: "Marist",
    accent: "#ee3232",
    logoSrc: "/logos/gym_logos/marist_logo.jpg",
    quote:
      "As a beginner, having immediate access to instructional videos makes it so easy for me to stay in the gym.",
    anchor: { x: 12, y: 33 },
    phase: 0.41,
    cardSide: "right",
  },
  {
    firstName: "Adam",
    gym: "GymIt",
    // GymIt primary color (matches orgs.ts gym_it.primaryColor).
    accent: "#005fbd",
    logoSrc: "/logos/gym_logos/gymit_logo.jpg",
    quote: "This is going to change how people see gyms.",
    anchor: { x: 45, y: 42 },
    phase: 0.72,
    cardSide: "below",
  },
  {
    firstName: "Linda",
    gym: "YMCA",
    // Teal-tinted YMCA — distinguishes from Jewel's purple YMCA
    // card while still reading as a brand-coded surface.
    accent: "#1e9696",
    logoSrc: "/logos/gym_logos/ymca_middlesex_logo.jpg",
    quote: "This doesn't exist anywhere, this is amazing.",
    anchor: { x: 62, y: 32 },
    phase: 0.27,
    cardSide: "right",
  },
  {
    firstName: "Conor",
    gym: "UT Dallas",
    // UT Dallas secondary brand color (green) instead of the primary
    // orange we previously used.
    accent: "#00b34a",
    logoSrc: "/logos/gym_logos/ut_dallas_logo.jpg",
    quote: "I've been waiting for an app like this — it's really useful.",
    anchor: { x: 22, y: 75 },
    phase: 0.55,
    cardSide: "right",
  },
  {
    firstName: "Jewel",
    gym: "YMCA",
    // Purple-tinted YMCA — pairs with Linda's teal so both YMCA
    // testimonials are visually distinct.
    accent: "#7e3a93",
    logoSrc: "/logos/gym_logos/ymca_middlesex_logo.jpg",
    quote:
      "Redprint isn't just helping engage beginners, but also experienced gym-goers too.",
    anchor: { x: 70, y: 82 },
    phase: 0.88,
    cardSide: "above",
  },
];

const HOLLOW_DOT_RADIUS = 4; // px — outer radius of the hollow circle
const HOLLOW_DOT_STROKE = 1; // px
// Total dot pool — sized so we have ~600 to form the sentence
// PLUS ~400 extras that stay scattered across the screen at all
// times (background field).
const N_SMALL_DOTS = 1000;
// Sentence the dot field morphs into when "Redprint" finishes typing.
const FORMED_TEXT = "Welcome to the future of your gym";
// Render the text in a thin sans-serif (Outfit weight 400) at
// this fontSize, then PAVE the solid letter shapes with a regular
// grid of hollow circles. Weight 400 keeps strokes thin enough
// that the grid catches ONE circle per stroke (not 2–3 like bold),
// giving clean 1-circle-wide letter outlines matching the
// Bitcount-Grid-Single reference look.
const FORMED_TEXT_FONT_SIZE_PX = 100;
const FORMED_TEXT_FONT_WEIGHT = 400;
const FORMED_TEXT_GRID_STEP = 10;
const FORMED_TEXT_ALPHA_THRESHOLD = 128;
// At display time, scale the canvas-pixel coords to viewport pixels
// so the formed sentence spans roughly 80% of the viewport width.
const FORMED_TEXT_TARGET_WIDTH_VW = 80;
const CARD_W = 320;
// Cards auto-size their height to the quote. CARD_H_FALLBACK is
// only used as the initial estimate before the first measure pass
// (and to prevent layout jitter on first paint).
const CARD_H_FALLBACK = 160;
// How far INTO the card the connector line should overshoot from
// the geometrical edge. A small overlap guarantees the dashed line
// visually connects to the card even with anti-aliasing or the
// card's rounded corners cropping the visible edge.
const CARD_LINE_OVERLAP_PX = 8;
// Card ambient float — same family as the dot float but with a
// slightly smaller amplitude and a unique time/phase profile so
// cards and dots don't bob in lockstep. Each card uses its
// testimonial.phase to offset, so all 6 cards drift independently.
const CARD_FLOAT_AMP = 12;
// Card centre offset from the dot anchor as a % of viewport. Tuned
// so the card sits clear of the dot with room for the connector
// line. Larger horizontal step because most cards are left/right.
const CARD_OFFSET_PCT_X = 16;
const CARD_OFFSET_PCT_Y = 14;
// Approximate viewport-radius the dot occupies, in % units. Used
// by the connector to start at the EDGE of the dot, not its centre.
// LoadingRing renders dots at ~16px diameter on a 64px avatar; we
// take half that as the radius and convert to a % via the assumed
// typical viewport width (refined on the client by ConnectorLine).
const DOT_RADIUS_PX = 8;

// Deterministic pseudo-random generator — keeps positions stable
// across SSR / hydration / re-renders.
function mulberry32(seed: number) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SmallDot = {
  /** Final scattered position (% of vw, vh). */
  finalX: number;
  finalY: number;
  /** 0..1 — when (relative to the dot-spread window) this dot starts
   *  fading in. Drives the staggered-appear pattern. */
  appearDelay: number;
  /** Per-dot pseudo-random phase for the ambient float. */
  phase: number;
  ampX: number; // ambient float amplitude in px
  ampY: number;
};

type TextDotOffset = {
  /** Pixel offset from the formed text's centre, in canvas pixels.
   *  Scaled at render-time by the canvas-to-viewport factor. */
  dx: number;
  dy: number;
};

/** Renders FORMED_TEXT to an offscreen canvas in a solid bold
 *  sans-serif, then walks a regular grid (step FORMED_TEXT_GRID_STEP)
 *  and emits one (dx, dy) offset per grid cell whose pixel is
 *  inside the letter shape. Result: each letter is paved with a
 *  uniform grid of touching hollow circles forming continuous
 *  strokes, matching the Bitcount-Grid-Single reference. Called
 *  once after the font finishes loading. */
function sampleFormedTextOffsets(): {
  offsets: TextDotOffset[];
  width: number;
  height: number;
} {
  if (typeof document === "undefined") {
    return { offsets: [], width: 0, height: 0 };
  }
  // Use Bitcount Grid Single for the canvas render so the LETTER
  // SHAPES come from Bitcount (its distinctive blocky/dot-matrix
  // glyph forms — the look the user is targeting). The grid sampler
  // then paves those shapes with a uniform grid of hollow circles.
  const fontVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-bitcount-grid")
    .trim();
  const fontFamily =
    fontVar || '"Bitcount Grid Single", monospace';
  const fontSpec = `${FORMED_TEXT_FONT_WEIGHT} ${FORMED_TEXT_FONT_SIZE_PX}px ${fontFamily}`;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { offsets: [], width: 0, height: 0 };

  ctx.font = fontSpec;
  const metrics = ctx.measureText(FORMED_TEXT);
  const padding = FORMED_TEXT_GRID_STEP * 2;
  const textHeight = FORMED_TEXT_FONT_SIZE_PX * 1.3;
  canvas.width = Math.ceil(metrics.width + padding * 2);
  canvas.height = Math.ceil(textHeight + padding * 2);
  // Canvas state resets when width/height is assigned — re-apply.
  ctx.font = fontSpec;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.fillText(FORMED_TEXT, padding, canvas.height / 2);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const offsets: TextDotOffset[] = [];
  const step = FORMED_TEXT_GRID_STEP;
  // Walk a regular grid offset by step/2 so columns align across
  // the whole sentence (vertical strokes become straight columns
  // of circles, not staggered).
  for (let y = step / 2; y < canvas.height; y += step) {
    for (let x = step / 2; x < canvas.width; x += step) {
      const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
      if (image.data[i + 3] > FORMED_TEXT_ALPHA_THRESHOLD) {
        offsets.push({
          dx: x - canvas.width / 2,
          dy: y - canvas.height / 2,
        });
      }
    }
  }
  return { offsets, width: canvas.width, height: canvas.height };
}

const SMALL_DOTS: SmallDot[] = (() => {
  const rand = mulberry32(20260602);
  const dots: SmallDot[] = [];
  for (let i = 0; i < N_SMALL_DOTS; i++) {
    dots.push({
      finalX: rand() * 100,
      finalY: rand() * 100,
      // Spread the appear-delays uniformly across [0, 0.85] so a
      // handful are visible immediately as the spread begins and
      // others trickle in throughout the wheel→testimonial transit.
      appearDelay: rand() * 0.85,
      phase: rand(),
      ampX: 6 + rand() * 10,
      ampY: 6 + rand() * 10,
    });
  }
  return dots;
})();

type Props = {
  /** 0 → 1: mounts the component + drives the small-dot opacity
   *  ramp. Rises across [EXIT_END → TEST_WHEEL_EXTRA_END]. */
  sectionP: MotionValue<number>;
  /** 0 → 1: drives the background fade-in. Tied to `bgSlideP` so the
   *  black/white bg appears AS the how-it-works content slides up. */
  bgOpacityP: MotionValue<number>;
  /** 0 → 1: drives the 6 main dots' spread to their anchors (handled
   *  by LoadingRing). This component reads it to track each parent
   *  dot's position for the small-dot burst. */
  dotSpreadP: MotionValue<number>;
  /** 0 → 1: dashed connector lines draw from each dot to its card. */
  linesP: MotionValue<number>;
  /** 0 → 1: testimonial cards flicker-reveal. */
  cardsP: MotionValue<number>;
  /** 0 → 1: title typewriter. */
  titleP: MotionValue<number>;
  /** Opacity of the scroll-progress indicator at the bottom. Rises
   *  with the card reveal, holds through the trailing dwell, fades
   *  out in the very last sliver of scroll. */
  indicatorOpacityP: MotionValue<number>;
  /** "0%" → "100%" string MV that drives the indicator's fill bar
   *  width across the trailing dwell. */
  indicatorFillP: MotionValue<string>;
  /** 0 → 1 across the footer reveal. Used to fade out the
   *  cards / lines / small dots / title as the red footer panel
   *  rises from the bottom — so by the time the panel covers the
   *  centre of the viewport, only the reformed loading wheel
   *  remains visible. */
  footerFadeOutP: MotionValue<number>;
  /** 0 → 1 once "Redprint" finishes typing. Drives the morph of
   *  the scattered hollow dot field into the "Welcome to the
   *  future of your gym" sentence (Bitcount Grid Single). */
  formTextP: MotionValue<number>;
};

export function TestimonialsLayer({
  sectionP,
  bgOpacityP,
  dotSpreadP,
  linesP,
  cardsP,
  titleP,
  indicatorOpacityP,
  indicatorFillP,
  footerFadeOutP,
  formTextP,
}: Props) {
  const [s, setS] = useState(() => sectionP.get());
  const [sp, setSp] = useState(() => dotSpreadP.get());
  const [lp, setLp] = useState(() => linesP.get());
  const [cp, setCp] = useState(() => cardsP.get());
  const [bg, setBg] = useState(() => bgOpacityP.get());
  const [footerFade, setFooterFade] = useState(() => footerFadeOutP.get());
  const [formText, setFormText] = useState(() => formTextP.get());
  useEffect(() => sectionP.on("change", setS), [sectionP]);
  useEffect(() => dotSpreadP.on("change", setSp), [dotSpreadP]);
  useEffect(() => linesP.on("change", setLp), [linesP]);
  useEffect(() => cardsP.on("change", setCp), [cardsP]);
  useEffect(() => bgOpacityP.on("change", setBg), [bgOpacityP]);
  useEffect(
    () => footerFadeOutP.on("change", setFooterFade),
    [footerFadeOutP],
  );
  useEffect(() => formTextP.on("change", setFormText), [formTextP]);
  const footerVisible = 1 - footerFade;

  // Cards are auto-sized to their content — we measure each card's
  // rendered height after mount and store it here so the connector
  // line knows where the above/below card edge actually lands.
  const [cardHeights, setCardHeights] = useState<number[]>(
    () => Array(TESTIMONIALS.length).fill(CARD_H_FALLBACK),
  );

  // Sample FORMED_TEXT into per-dot target offsets ONCE after the
  // Bitcount Grid Single font finishes loading. Then nearest-
  // neighbor-match each scatter dot to a text-pixel target so the
  // morph paths don't crisscross. `textAssignments[i]` is the index
  // of the matched offset in `textOffsets`, or null if dot `i` has
  // no target (= excess dots beyond the sampled count).
  const [textOffsets, setTextOffsets] = useState<TextDotOffset[]>([]);
  const [textCanvas, setTextCanvas] = useState({ width: 0, height: 0 });
  const [textAssignments, setTextAssignments] = useState<
    Array<number | null>
  >(() => Array(N_SMALL_DOTS).fill(null));
  useEffect(() => {
    if (typeof document === "undefined") return;
    let cancelled = false;
    const run = async () => {
      // Wait for Bitcount Grid Single to be ready before sampling —
      // otherwise we'd hit the fallback font and the dot positions
      // wouldn't match the visual we want.
      try {
        await document.fonts.ready;
      } catch {
        /* ignore — fall through to sampling with whatever's available */
      }
      if (cancelled) return;
      const { offsets, width, height } = sampleFormedTextOffsets();
      setTextOffsets(offsets);
      setTextCanvas({ width, height });
      // Nearest-neighbor assignment: each scatter dot grabs its
      // closest unassigned text-pixel target so flight paths are
      // short. We compare the dot's scatter position (in viewport %)
      // to the text-pixel's scaled viewport-px position.
      if (offsets.length === 0) {
        setTextAssignments(Array(N_SMALL_DOTS).fill(null));
        return;
      }
      const vw =
        typeof window !== "undefined" ? window.innerWidth : 1440;
      const vh =
        typeof window !== "undefined" ? window.innerHeight : 900;
      const scale =
        width > 0
          ? (FORMED_TEXT_TARGET_WIDTH_VW / 100) * vw / width
          : 1;
      // Pre-compute each text-pixel's viewport position (% of vw/vh).
      const targets = offsets.map((o) => ({
        x: 50 + (o.dx * scale) / vw * 100,
        y: 50 + (o.dy * scale) / vh * 100,
      }));
      const used = new Array(offsets.length).fill(false);
      const assignments = new Array<number | null>(N_SMALL_DOTS).fill(
        null,
      );
      // Order scatter dots by distance to the text centre so the
      // earliest matches pick the most central pixels first.
      const order = SMALL_DOTS.map((d, i) => ({
        i,
        d:
          Math.pow(d.finalX - 50, 2) +
          Math.pow(d.finalY - 50, 2),
      })).sort((a, b) => a.d - b.d);
      for (const { i } of order) {
        const dot = SMALL_DOTS[i];
        let bestJ = -1;
        let bestDist = Infinity;
        for (let j = 0; j < targets.length; j++) {
          if (used[j]) continue;
          const dx = dot.finalX - targets[j].x;
          const dy = dot.finalY - targets[j].y;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            bestDist = dist;
            bestJ = j;
          }
        }
        if (bestJ >= 0) {
          assignments[i] = bestJ;
          used[bestJ] = true;
        }
      }
      setTextAssignments(assignments);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);
  const reportCardHeight = (slot: number, h: number) => {
    setCardHeights((prev) => {
      if (prev[slot] === h) return prev;
      const next = prev.slice();
      next[slot] = h;
      return next;
    });
  };

  const time = useTime();

  // We always render the background once bgOpacityP > 0 so the
  // black/white surface is visible during the bg-slide (before the
  // testimonials section is fully "on stage"). Inner content (dots,
  // cards, title) waits for `s` (sectionP) to rise.
  if (bg <= 0 && s <= 0) return null;

  return (
    <>
      {/* BEHIND the red footer panel (z-40 < panel z-50). Cards,
          connector lines, title, and scroll indicator sit here.
          They no longer fade with the footer reveal — the rising
          red panel covers them naturally. */}
      <div
        className="pointer-events-none absolute inset-0 z-40 overflow-hidden"
        aria-hidden
      >
        {/* Dashed lines from each testimonial anchor to its card.
            Both endpoints track their shapes' ambient float so the
            line stays glued as the dot and card drift. */}
        {s > 0 && (
          <svg className="absolute inset-0 h-full w-full">
            {TESTIMONIALS.map((t, i) => (
              <ConnectorLine
                key={i}
                testimonial={t}
                slotIndex={i}
                linesValue={lp}
                spreadValue={sp}
                cardHeight={cardHeights[i]}
                time={time}
              />
            ))}
          </svg>
        )}

        {/* Testimonial cards — flicker-reveal one by one. */}
        {s > 0 &&
          TESTIMONIALS.map((t, i) => (
            <Card
              key={i}
              testimonial={t}
              slotIndex={i}
              cardsValue={cp}
              time={time}
              reportHeight={reportCardHeight}
            />
          ))}

        {/* Scroll-progress indicator at the bottom. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-[100px] left-1/2 -translate-x-1/2"
          style={{ opacity: indicatorOpacityP }}
        >
          <div className="relative h-[2px] w-[120px]">
            <div className="bg-fg-base/15 absolute inset-0 rounded-full" />
            <motion.div
              className="bg-fg-base absolute left-0 top-0 h-full rounded-full"
              style={{ width: indicatorFillP }}
            />
          </div>
        </motion.div>

        {/* Title — types out alongside the dot spread + line draw. */}
        {s > 0 && (
          <div className="absolute left-1/2 top-[11vh] -translate-x-1/2 whitespace-nowrap text-center">
            <h2
              className="text-fg-base text-[2.25rem] font-black leading-[1.05] tracking-tight"
              style={{ fontWeight: 900 }}
            >
              <TypewriterText
                text="What the Redprint community has to say"
                start={false}
                progress={titleP}
              />
            </h2>
          </div>
        )}
      </div>

      {/* ABOVE the red footer panel (z-55 > panel z-50). The dot
          field paints here so the formed "Welcome to the future of
          your gym" sentence stays readable over the red bg. */}
      <div
        className="pointer-events-none absolute inset-0 z-[55] overflow-hidden"
        aria-hidden
      >
        {s > 0 && (
          <div className="absolute inset-0">
            {SMALL_DOTS.map((d, i) => {
              const targetIdx = textAssignments[i];
              const target =
                targetIdx !== null && textOffsets[targetIdx]
                  ? textOffsets[targetIdx]
                  : null;
              // Drop 20% of "extras" — dots that don't get a text
              // target. Deterministic skip based on index so the
              // visual stays stable across renders. Reduces total
              // animated DOM nodes, easing the per-frame cost during
              // the testimonial→footer transition.
              if (!target && i % 5 === 0) return null;
              return (
                <SmallDotEl
                  key={i}
                  d={d}
                  spreadValue={sp}
                  time={time}
                  footerVisible={footerVisible}
                  formText={formText}
                  target={target}
                  canvasWidth={textCanvas.width}
                  canvasHeight={textCanvas.height}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------- */

function SmallDotEl({
  d,
  spreadValue,
  time,
  footerVisible,
  formText,
  target,
  canvasWidth,
  canvasHeight,
}: {
  d: SmallDot;
  spreadValue: number;
  time: MotionValue<number>;
  footerVisible: number;
  formText: number;
  target: TextDotOffset | null;
  canvasWidth: number;
  canvasHeight: number;
}) {
  // Each dot fades in over a 0.15-wide window starting at its
  // appearDelay — so the field of dots populates gradually across
  // the dot-spread phase rather than all at once.
  const FADE_LEN = 0.15;
  const local = (spreadValue - d.appearDelay) / FADE_LEN;
  const appear = Math.max(0, Math.min(1, local));
  // Per-dot morph progress — heavily staggered so at any single
  // moment of formText the field still LOOKS like a scatter: most
  // dots either haven't started yet OR have already landed. Only
  // a small fraction are in mid-flight, so the visual stays "evenly
  // spread across the screen" rather than collapsing into the
  // sentence's centre as a cluster mid-transition.
  const FORM_STAGGER_SCALE = 0.75; // max start ≈ 0.75 of formText
  const FORM_DURATION = 0.25; // each dot completes its move in ~25% of formText
  const formStart = (d.appearDelay / 0.85) * FORM_STAGGER_SCALE;
  const dotFormProgress = Math.max(
    0,
    Math.min(1, (formText - formStart) / FORM_DURATION),
  );
  // Resolve text-target viewport position (in vw / vh percentages)
  // by scaling the canvas-pixel offset to the configured viewport
  // width target. Returns the scatter pos when there's no target.
  const [viewport, setViewport] = useState<{ vw: number; vh: number }>(
    () => ({
      vw:
        typeof window !== "undefined" ? window.innerWidth : 1440,
      vh:
        typeof window !== "undefined" ? window.innerHeight : 900,
    }),
  );
  useEffect(() => {
    const update = () =>
      setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  let targetXpct = d.finalX;
  let targetYpct = d.finalY;
  if (target && canvasWidth > 0) {
    const scale =
      (FORMED_TEXT_TARGET_WIDTH_VW / 100) * viewport.vw / canvasWidth;
    // Text formation sits BELOW the Redprint logo group (logo at
    // ~20vh from top; sentence at ~35vh).
    targetXpct = 50 + ((target.dx * scale) / viewport.vw) * 100;
    targetYpct = 35 + ((target.dy * scale) / viewport.vh) * 100;
  }
  // Lerp position based on the PER-DOT staggered progress, not the
  // global formText — so the morph paths fan out in time.
  const baseX = d.finalX + (targetXpct - d.finalX) * dotFormProgress;
  const baseY = d.finalY + (targetYpct - d.finalY) * dotFormProgress;
  // Ambient float dies out as the dot reaches its formed position.
  const ambientScale = 1 - dotFormProgress;
  // Targeted dots stay fully visible through the morph. Extras
  // (the leftover scatter beyond what the sentence needs) fade out
  // as formText rises — so once the sentence is fully formed the
  // background field is gone and only the letters remain.
  const visibility = target ? 1 : 1 - formText;
  void footerVisible; // no longer used; kept on the prop signature for now
  // As each dot reaches its sentence position, ramp its opacity
  // from the dim scatter (0.3) up to a more readable 0.85 so the
  // formed sentence has real presence.
  const opacityBoost = target ? 0.55 * dotFormProgress : 0;
  const baseOpacity = (0.3 + opacityBoost) * appear;
  const fx = useTransform(
    time,
    (t) =>
      `calc(${baseX}vw + ${
        Math.sin(t * 0.0006 + d.phase * Math.PI * 2) *
        d.ampX *
        ambientScale
      }px)`,
  );
  const fy = useTransform(
    time,
    (t) =>
      `calc(${baseY}vh + ${
        Math.cos(t * 0.0005 + d.phase * Math.PI * 2) *
        d.ampY *
        ambientScale
      }px)`,
  );
  // Dynamic dot size — scale the circle so adjacent sentence circles
  // never overlap. On-screen spacing between sentence positions =
  // FORMED_TEXT_GRID_STEP * (canvas-to-viewport scale). We size each
  // circle to 90% of that spacing so a small gap stays visible at
  // any viewport width. Clamped so circles don't get too tiny (min)
  // or larger than the original constant on huge monitors (max).
  const screenStepPx =
    canvasWidth > 0
      ? ((FORMED_TEXT_TARGET_WIDTH_VW / 100) * viewport.vw / canvasWidth) *
        FORMED_TEXT_GRID_STEP
      : HOLLOW_DOT_RADIUS * 2;
  const dynamicRadius = Math.max(
    2,
    Math.min(HOLLOW_DOT_RADIUS, screenStepPx * 0.45),
  );
  if (appear <= 0) return null;
  return (
    <motion.div
      className="absolute"
      style={{
        left: fx,
        top: fy,
        width: dynamicRadius * 2,
        height: dynamicRadius * 2,
        marginLeft: -dynamicRadius,
        marginTop: -dynamicRadius,
        opacity: baseOpacity * visibility,
      }}
    >
      <div
        className="text-fg-base h-full w-full rounded-full"
        style={{
          border: `${HOLLOW_DOT_STROKE}px solid currentColor`,
        }}
      />
    </motion.div>
  );
}

// LoadingRing's spread + float constants — MIRROR EXACTLY so the
// connector line's dot-side endpoint tracks the actual float.
const LR_SPREAD_STAGGER = 0.1;
const LR_SPREAD_DURATION = 0.35;
const LR_FLOAT_AMP = 14;

function ConnectorLine({
  testimonial,
  slotIndex,
  linesValue,
  spreadValue,
  cardHeight,
  time,
}: {
  testimonial: Testimonial;
  slotIndex: number;
  linesValue: number;
  spreadValue: number;
  cardHeight: number;
  time: MotionValue<number>;
}) {
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  useEffect(() => {
    const set = () => {
      setVw(document.documentElement.clientWidth);
      setVh(document.documentElement.clientHeight);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);
  // Subscribe to time so the float updates per frame.
  const [tNow, setTNow] = useState(0);
  useEffect(() => time.on("change", setTNow), [time]);
  const STAGGER = 0.1;
  const DURATION = 0.5;
  const local = (linesValue - STAGGER * slotIndex) / DURATION;
  const drawP = Math.max(0, Math.min(1, local));
  // Dot float — replicates LoadingRing's per-slot ambient float so
  // the line endpoint follows the bobbing dot. floatT scales the
  // amplitude from 0 (right after spread completes) up to 1.
  const spreadEnd = LR_SPREAD_STAGGER * slotIndex + LR_SPREAD_DURATION;
  const floatT = Math.max(
    0,
    Math.min(1, (spreadValue - spreadEnd) / 0.15),
  );
  const ph = slotIndex * 0.9 + 0.3;
  const dotFloatX =
    Math.sin(tNow * 0.0006 + ph * Math.PI * 2) * LR_FLOAT_AMP * floatT;
  const dotFloatY =
    Math.cos(tNow * 0.0005 + ph * Math.PI * 2) * LR_FLOAT_AMP * floatT;
  // Resolve dot centre + card centre in viewport pixels — dot
  // includes its float; card is static.
  const dotCx = (testimonial.anchor.x / 100) * (vw || 1440) + dotFloatX;
  const dotCy = (testimonial.anchor.y / 100) * (vh || 900) + dotFloatY;
  const cardOffsetX =
    testimonial.cardSide === "right"
      ? CARD_OFFSET_PCT_X
      : testimonial.cardSide === "left"
        ? -CARD_OFFSET_PCT_X
        : 0;
  const cardOffsetY =
    testimonial.cardSide === "below"
      ? CARD_OFFSET_PCT_Y
      : testimonial.cardSide === "above"
        ? -CARD_OFFSET_PCT_Y
        : 0;
  // Card float — same formula as the Card component so the line's
  // card-side endpoint stays attached to the drifting card edge.
  const cardPh = testimonial.phase * Math.PI * 2;
  const cardFloatX =
    Math.sin(tNow * 0.0004 + cardPh) * CARD_FLOAT_AMP;
  const cardFloatY =
    Math.cos(tNow * 0.00035 + cardPh + 1.4) * CARD_FLOAT_AMP;
  const cardCx =
    ((testimonial.anchor.x + cardOffsetX) / 100) * (vw || 1440) +
    cardFloatX;
  const cardCy =
    ((testimonial.anchor.y + cardOffsetY) / 100) * (vh || 900) +
    cardFloatY;
  // Offset each endpoint to the EDGE of its shape so the line
  // doesn't visibly emerge from a centre point. For the dot, that's
  // a radius along the line direction. For the card, that's a half-
  // dimension along the cardSide axis (the line is always horizontal
  // OR vertical because cardSide is one of L/R/U/D, so we can use
  // the appropriate half-dimension directly).
  let x1 = dotCx;
  let y1 = dotCy;
  let x2 = cardCx;
  let y2 = cardCy;
  // Card endpoint pushes CARD_LINE_OVERLAP_PX INTO the card so the
  // line visibly connects rather than terminating right at the
  // (anti-aliased) edge with a hair-line gap. Above/below cards use
  // the dynamically-measured cardHeight, not a fixed value.
  switch (testimonial.cardSide) {
    case "right":
      x1 = dotCx + DOT_RADIUS_PX;
      x2 = cardCx - CARD_W / 2 + CARD_LINE_OVERLAP_PX;
      break;
    case "left":
      x1 = dotCx - DOT_RADIUS_PX;
      x2 = cardCx + CARD_W / 2 - CARD_LINE_OVERLAP_PX;
      break;
    case "below":
      y1 = dotCy + DOT_RADIUS_PX;
      y2 = cardCy - cardHeight / 2 + CARD_LINE_OVERLAP_PX;
      break;
    case "above":
      y1 = dotCy - DOT_RADIUS_PX;
      y2 = cardCy + cardHeight / 2 - CARD_LINE_OVERLAP_PX;
      break;
  }
  // Progressive extension — the endpoint walks from the dot edge
  // toward the card edge across drawP.
  const drawX = x1 + (x2 - x1) * drawP;
  const drawY = y1 + (y2 - y1) * drawP;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={drawX}
      y2={drawY}
      stroke="currentColor"
      className="text-fg-base/50"
      strokeWidth={1}
      strokeDasharray="3 3"
    />
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

function Card({
  testimonial,
  slotIndex,
  cardsValue,
  time,
  reportHeight,
}: {
  testimonial: Testimonial;
  slotIndex: number;
  cardsValue: number;
  time: MotionValue<number>;
  reportHeight: (slot: number, h: number) => void;
}) {
  const isDark = useTheme() === "dark";
  const ref = useRef<HTMLDivElement>(null);
  // Measure the card's rendered height and bubble it up so the
  // connector line knows where the above/below edge actually is.
  // ResizeObserver fires on first paint AND on any subsequent
  // reflow (e.g. font load, viewport change).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => reportHeight(slotIndex, el.offsetHeight);
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slotIndex, reportHeight]);
  const STAGGER = 0.12;
  const DURATION = 0.4;
  const local = (cardsValue - STAGGER * slotIndex) / DURATION;
  const localClamped = Math.max(0, Math.min(1, local));
  const op = flicker(localClamped);
  // Card sits at the dot's anchor + a fixed offset based on cardSide.
  const a = testimonial.anchor;
  const offsetPctX =
    testimonial.cardSide === "right"
      ? CARD_OFFSET_PCT_X
      : testimonial.cardSide === "left"
        ? -CARD_OFFSET_PCT_X
        : 0;
  const offsetPctY =
    testimonial.cardSide === "below"
      ? CARD_OFFSET_PCT_Y
      : testimonial.cardSide === "above"
        ? -CARD_OFFSET_PCT_Y
        : 0;
  // Ambient float — same family as the dot float, on its own phase
  // so each card drifts independently. Always-on (subtle), since
  // the card's `opacity` already gates whether it's visible.
  const ph = testimonial.phase * Math.PI * 2;
  const fx = useTransform(
    time,
    (t) => `calc(${a.x + offsetPctX}vw + ${
      Math.sin(t * 0.0004 + ph) * CARD_FLOAT_AMP
    }px)`,
  );
  const fy = useTransform(
    time,
    (t) => `calc(${a.y + offsetPctY}vh + ${
      Math.cos(t * 0.00035 + ph + 1.4) * CARD_FLOAT_AMP
    }px)`,
  );
  // Theme-aware tint of the gym's primary color:
  //   LIGHT mode  →  DARKER version of the gym color, white text.
  //   DARK mode   →  LIGHTER version, near-black text.
  // The text-color choice mirrors what the user requested ("text
  // color should then be white in light mode and black in dark
  // mode"); the bg flips with the theme so each card carries its
  // gym's brand identity regardless of theme.
  const bgColor = isDark
    ? lighten(testimonial.accent, 60)
    : darken(testimonial.accent, 50);
  const textColor = isDark ? "#0a0a0a" : "#ffffff";
  // Theme-aware glow + drop shadow — beefier than the phone halo
  // because the cards are smaller and sit on a denser dot field;
  // they need a proper lift to read as floating objects. Stack of
  // two layers: a large soft halo (the "glow") and a tighter drop
  // shadow (the "lift").
  const glowShadow = isDark
    ? [
        "0 0 90px rgba(255, 255, 255, 0.22)",
        "0 24px 60px rgba(0, 0, 0, 0.55)",
      ].join(", ")
    : [
        "0 0 70px rgba(0, 0, 0, 0.15)",
        "0 24px 60px rgba(0, 0, 0, 0.22)",
      ].join(", ");
  return (
    <motion.div
      ref={ref}
      className="absolute"
      style={{
        left: fx,
        top: fy,
        x: "-50%",
        y: "-50%",
        width: CARD_W,
        opacity: op,
        boxShadow: glowShadow,
        borderRadius: 16,
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Quotation glyph in the top-right corner — large, low-alpha
          so it reads as a decorative mark, not a UI element. */}
      <div
        aria-hidden
        className="absolute right-3 top-1 font-serif text-[48px] leading-none"
        style={{ color: textColor, opacity: 0.35 }}
      >
        ”
      </div>
      {/* Content sits in a flex column — header at top, quote
          beneath. Padding alone defines the card's bottom edge,
          so the card auto-sizes to the quote text. */}
      <div className="relative flex w-full flex-col gap-3 p-4">
        <div className="flex items-center gap-2.5">
          {/* Org logo plate — small white circle so each logo (which
              ships with its own colored marks) reads cleanly on top
              of the tinted card background. `object-contain` keeps
              non-square logos from stretching. */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <img
              src={testimonial.logoSrc}
              alt={`${testimonial.gym} logo`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold leading-tight">
              {testimonial.firstName}
            </div>
            <div className="text-[12px] leading-tight" style={{ opacity: 0.7 }}>
              {testimonial.gym}
            </div>
          </div>
        </div>
        <div
          className="text-[17px] font-semibold leading-[1.35]"
          style={{ paddingRight: 32 /* keep quote clear of the ” glyph */ }}
        >
          “{testimonial.quote}”
        </div>
      </div>
    </motion.div>
  );
}
