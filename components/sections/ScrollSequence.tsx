"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Hero } from "@/components/sections/Hero";
import { LoadingRing } from "@/components/LoadingRing";
import { RedprintMark } from "@/components/RedprintMark";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { Grain } from "@/components/effects/Grain";
import { Glow } from "@/components/effects/Glow";
import { Pillars } from "@/components/sections/Pillars";
import { HowItWorksSteps } from "@/components/sections/HowItWorksSteps";
import {
  TestimonialsLayer,
  TESTIMONIALS,
} from "@/components/sections/TestimonialsLayer";
import { BottomSilhouettes } from "@/components/sections/BottomSilhouettes";
import { RequestGymForm } from "@/components/sections/RequestGymForm";
import { RedprintTags } from "@/components/sections/RedprintTags";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { HomeWorkoutView } from "@/components/phone/screens/HomeWorkoutView";
import { ExerciseRedprintView } from "@/components/phone/screens/ExerciseRedprintView";
import { AIChatbotView } from "@/components/phone/screens/AIChatbotView";
import { CommunityView } from "@/components/phone/screens/CommunityView";
import { GroupChallengeDetailView } from "@/components/phone/screens/GroupChallengeDetailView";
import { TierAchievementCongratulationsView } from "@/components/phone/screens/TierAchievementCongratulationsView";
import { FinishedWorkoutSummaryView } from "@/components/phone/screens/FinishedWorkoutSummaryView";
import { ExerciseHistoryAnalysisView } from "@/components/phone/screens/ExerciseHistoryAnalysisView";
import { WorkoutHistoryAnalysisView } from "@/components/phone/screens/WorkoutHistoryAnalysisView";
import {
  TrackingCards,
  TRACKING_CARDS,
  LEARNING_CARDS,
} from "@/components/sections/TrackingCards";
import { EquipmentCluster } from "@/components/sections/EquipmentCluster";
import { orgs } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/**
 * Scroll-tied sequence wrapping the Hero:
 *
 *   [0.00 – 0.20]  Logo rotates one full turn. Everything else static.
 *   [0.20 – 0.55]  Bottom panel grows from its resting tab to full-screen
 *                  (alma.food-style: top-radius and side insets shrink).
 *                  Logo crossfades out, loading BlobAvatar fades in behind
 *                  it. Avatar slides from logo's slot to viewport center
 *                  and scales up.
 *   [0.55 – 1.00]  Avatar sits centered on the now-full panel and keeps
 *                  spinning. (Future: 6→3 dot merge, then 3→info boxes.)
 *
 * The Hero itself is pinned via `sticky top-0` so its opening sequence and
 * org/phone rotation stay live while the user scrolls through the panel
 * takeover.
 */
const TOTAL_VH = 5269;
// Buffer scroll runway (in vh) that sits BETWEEN the moment the
// red footer panel reaches the top of the viewport and the moment
// the silhouettes start appearing from the bottom. Lets the user
// settle into the "full-bleed" footer state before the next layer
// of motion arrives.
const SILHOUETTE_DELAY_VH = 100;
// All pre-existing step-1 phase constants are 0-1 fractions of the
// step-1 sub-timeline; we remap scroll via `step1Progress` so they
// keep their existing values and still fire at the same ABSOLUTE vh.
// STEP1_LIMIT = (scrollable_vh_for_step1) / (total_scrollable_vh)
//              = 4249 / 9843 ≈ 0.4317
const STEP1_LIMIT = 0.3316;
// "Tap against a tag" phase — runs on RAW scrollYProgress (not
// step1Progress) from STEP1_LIMIT through STEP2_TRANSITION_START.
//   [TAP_START → TAP_RISE_END]        phone slides up + text types in (150vh)
//   [TAP_RISE_END → TAP_END]          phone scales 1 → ~0.93 = "tap" (50vh)
//   [TAP_END → STEP2_TRANSITION_START] 100vh breathe — nothing moves
//   [STEP2_TRANSITION_START → STEP2_TRANSITION_END] step 2 phone-move (225vh)
//   [CARDS_START → CARDS_END]         three tracking cards reveal (600vh)
//   [CARDS_END → STEP3_TRANSITION_START] 100vh post-cards breathe
//   [STEP3_TRANSITION_START → STEP3_TRANSITION_END] step 2→3 transition (300vh)
//   [LEARN_START → LEARN_END]         two on-demand-learning cards reveal (450vh)
//   [LEARN_END → STEP4_TRANSITION_START] 100vh post-learning breathe
//   [STEP4_TRANSITION_START → 1.0]    step 3→4 transition (300vh): dot 3 rises, learning headline+cards fade out, phone screen crossfades to AIChatbotView
const TAP_START = STEP1_LIMIT;
const TAP_RISE_END = 0.3525;
const TAP_END = 0.3595;
const STEP2_TRANSITION_START = 0.3732;
const STEP2_TRANSITION_END = 0.3927;
const CARDS_START = STEP2_TRANSITION_END;
const CARDS_END = 0.4301;
const STEP3_TRANSITION_START = 0.4577;
const STEP3_TRANSITION_END = 0.4771;
const LEARN_START = STEP3_TRANSITION_END;
const LEARN_END = 0.5152;
const STEP4_TRANSITION_START = 0.5293;
const STEP4_TRANSITION_END = 0.5487;
// Equipment cluster starts scaling in ONLY after both the phone has
// fully arrived at its left resting position AND dot 3 (GYM-SPECIFIC
// AI) has reached the top of the menu — both happen at
// STEP4_TRANSITION_END. The cluster gets 200vh to scale in.
const EQUIP_START = STEP4_TRANSITION_END;
const EQUIP_END = 0.5765;
// Chat-message typewriter sequence — types out the 4 AIChatbotView
// messages (and message 4's sub-parts) one at a time, scroll-tied.
// Starts the moment the equipment cluster reveal finishes. 500vh window.
const CHAT_START = EQUIP_END;
const CHAT_END = 0.5938;
// Step 4 → 5 transition: dot 4 (COMPETE/COMMUNITY) rises, phone
// slides from 37.5% → 77.5% leaving two static "ghost" copies behind
// at 37.5% and 57.5%. All three phones also drop 10vh as the slide
// happens. 300vh transition.
const STEP5_TRANSITION_START = 0.6076;
const STEP5_TRANSITION_END = 0.6270;
// Step-5 title ("Your gym is a team now") types out across 100vh
// after step 5 ends.
const COMPETE_TITLE_END = 0.6543;
// Step 5 → 6 transition: dot 5 (VISUALIZE PROGRESS) rises, the two
// existing ghost phones (L + M) gather to behind the front phone.
// 100vh buffer after compete title, then 300vh transition.
const STEP6_TRANSITION_START = 0.6820;
const STEP6_TRANSITION_END = 0.7013;
// Fan phase: existing 2 ghosts fan outward (mid-fan: ±12°, ±60px,
// scale 0.9); two new smaller phones (slot 2L/2R) fade in and lerp
// out further (back-fan: ±24°, ±115px, scale 0.8). 200vh fan window;
// AFTER the fan finishes, a dedicated 150vh trailing window drives
// `step6ProgressP` — the solid progress line filling the dashed trail
// from dot 5 (VISUALIZE PROGRESS) down to the section-end marker.
const FAN_END = 0.7290;
// Step 6 progress overlay completes at PROGRESS_END (= FAN_END + 150vh).
// Then over the next ~119vh window [PROGRESS_END → EXIT_END] the menu
// collapses BACK into the loading wheel AND the entire sticky-frame
// interior slides up by 100vh — both run in LOCKSTEP (= exitWheelP),
// mirroring the opening "Make every session count" panel takeover.
// AFTER that, the testimonials phase fills the remaining ~1000vh up
// to scroll = 1.0 (see TEST_* constants below).
const PROGRESS_END = 0.7483;
// EXIT_END pushed later to extend the menu → wheel reverse-animation
// from ~119vh to ~232vh — gives the dots room to retract gracefully
// instead of snapping into the wheel.
const EXIT_END = 0.8114;
// Testimonials phase — runs [EXIT_END → 1.0]. The "extra wheel
// rotation" sub-phase has been removed: dot-spread + title typewriter
// + progress-bar fill all kick off the instant the menu→wheel
// transition completes. Sub-phases:
//   [EXIT_END → TEST_DOT_SPREAD_END]   ~200vh: 6 wheel dots PHYSICALLY
//                                              spread out to their
//                                              randomized testimonial
//                                              anchors, staggered.
//                                              Small hollow dots also
//                                              fade in across this
//                                              window with their own
//                                              staggered appear-delays.
//   [TEST_DOT_SPREAD_END → TEST_LINES_END] ~100vh: dashed lines draw
//                                              from each main dot to
//                                              its testimonial card
//   [TEST_LINES_END → TEST_CARDS_END]   ~300vh: testimonial cards
//                                              flicker-reveal one
//                                              by one
//   [TEST_CARDS_END → 1.0]             ~295vh: trailing dwell
// TEST_WHEEL_EXTRA_END is kept as a named alias so the existing
// testWheelExtraP / testTitleP / testIndicator{Opacity,Fill}
// machinery keeps compiling — it just equals EXIT_END so the phase
// is zero-duration and the wheel adds no extra spin.
const TEST_WHEEL_EXTRA_END = 0.8114;
const TEST_DOT_SPREAD_END = 0.8383;
const TEST_LINES_END = 0.8520;
const TEST_CARDS_END = 0.8653;
// Tracking cards reveal with 50% overlap (3 cards). See cards-math
// note for the formula. CARD_WINDOW × N=3 cards ⇒ W = total / 2.
const CARD_WINDOW = (CARDS_END - CARDS_START) / 2;
const CARD_STAGGER = CARD_WINDOW / 2;
const CARD_LINE_FRAC = 0.6;
// Learning cards reveal with 50% overlap (2 cards). Formula:
//   (N-1) × stagger + window = total
//   stagger = window / 2
//   ⇒ window = total / (1 + (N-1)/2)
//   For N=2: window = total × 2/3
const LEARN_WINDOW = ((LEARN_END - LEARN_START) * 2) / 3;
const LEARN_STAGGER = LEARN_WINDOW / 2;

// Resting "tab" geometry — matches the alma.food silhouette: inset from
// the sides with a pronounced top curve, just a sliver peeking above the
// viewport bottom. All three values retract to 0 once the panel takes
// over the full viewport.
const PANEL_BASE_HEIGHT = 64; // px
const PANEL_BASE_RADIUS = 36; // px (top corners only)
const PANEL_BASE_INSET = 120; // px — horizontal margin on each side at rest

// Scroll-progress breakpoints — pinned to the rotation cadence so the
// logo's first full turn ends right as the crossfade begins.
//
//   [0           → REST_END]    static rest; logo spins one full turn
//   [REST_END    → PANEL_END]   bottom panel grows from tab to full vh
//                               crossfade window sits inside this range
//   [PANEL_END   → MOVE_START]  hold — panel is full, wheel still parked
//                               at the logo's old slot (intentional dwell)
//   [MOVE_START  → MOVE_END]    wheel slides to viewport centre
//                               (no scale change — stays at logo size)
//   [MOVE_END    → 1]           wheel idles at centre, keeps spinning
// All breakpoints compressed to free up the [PILLARS_END → 1] tail for
// a much longer dwell on the finished cards. TOTAL_VH bumped from 950
// to 1100 in tandem so each pre-dwell phase keeps approximately the
// same ABSOLUTE scroll distance as before (early-phase pacing stays
// the same; only the dwell grows — from 85vh to ~220vh).
// Pre-COLLAPSE breakpoints — rescaled from their original (TOTAL_VH=4000)
// values by 3900/4200 = 0.929 so each phase keeps approximately the
// same ABSOLUTE vh, even though more dwell + reveal phases now sit
// after the line phase ends.
const REST_END = 0;
const PANEL_END = 0.0700;
const MOVE_START = 0.0245;
const MOVE_END = 0.0543;

const MERGE_END = 0.1103;
const BOX_END = 0.2153;
const PILLARS_END = 0.2824;

const DWELL_END = 0.6325;
const PILLARS_FADE_OUT_END = 0.6452;
const REVERSE_BOX_END = 0.6948;
const REVERSE_MERGE_END = 0.7438;
const ROTATION_RAMP_START = 0.6634;
const EXTRA_TURNS_LATE = 2;
const LINE_START = REVERSE_MERGE_END;
const LINE_END = 0.7935;

// Collapse phase — dot 0 stays at the top; dots 1-5 slide down to a
// stack at the bottom of the viewport. The 0→1 vertical connector
// stretches to keep them tied together. Lines + labels (everywhere
// except dot 0) fade to ~25% opacity.
const COLLAPSE_START = LINE_END;
const COLLAPSE_END = 0.8594;

// Step 1 post-collapse sequence:
//   [COLLAPSE_END → STEP1_BREATHE_END]       breathe (text + tags hold)
//   [STEP1_BREATHE_END → STEP1_TEXT_FADE_END] description text reverses
//                                             the typewriter — chars
//                                             pop off in order
//   [STEP1_BREATHE_END → STEP1_FADE_OUT_END]  6 surround tags collapse
//                                             behind the centre tag,
//                                             then disappear
//   [STEP1_BREATHE_END → STEP1_END]           lat-pulldown image fades
//                                             in (50 vh tall, theme-
//                                             tinted) alongside the
//                                             un-typing
const STEP1_BREATHE_END = 0.9177;
const STEP1_TEXT_FADE_END = 0.9387;
const STEP1_FADE_OUT_END = 0.9597;
const STEP1_END = 1.0;

// Top-left target for the column. DOT_LEFT_X is the dot's CENTRE x
// (= 32 so the dot's left edge lands at x = 24, matching the Redprint
// nav logo's left edge). DOT_TOP_Y is the centre of dot 0.
const DOT_LEFT_X = 32;
const DOT_TOP_Y = 160;

// Crossfade window sits inside [REST_END, PANEL_END].
const FADE_START = 0.0035;
const FADE_END = 0.0193;

// Loading-wheel pixel size — fixed (does NOT grow as it slides to centre).
const AVATAR_SIZE = 64; // matches logo's h-16 w-16

// Vertical offset of the wheel's "centre" target (and the Pillars row
// anchored to it) relative to the viewport centre. Positive = down.
// Composition: title (46) + 40 gap + text block (150) + 8 gap + box
// (220) = 464 total. For true centring on vh/2 the box centre lands at
// title_top + 46 + 40 + 150 + 8 + 110 = title_top + 354. With title
// top at vh/2 - 232, that puts the box centre at vh/2 + 122.
const WHEEL_Y_OFFSET = 122;

// Total rotation through the full scroll range, in turns. With REST_END
// at 0.25 and TOTAL_TURNS = 4, the logo completes exactly one turn at
// REST_END — so the crossfade starts right as the first rotation ends.
const TOTAL_TURNS = 10;

// Loading-wheel geometry — derived directly from the emblem PNG's alpha
// channel (see `tmp/find_blobs.js` for the analysis). The emblem is six
// perfectly hexagonal bulbs at 60° intervals around the PNG centre:
//   - bulb centre distance from PNG centre: 270 / 724 = 0.373
//   - bulb radius:                            91 / 724 = 0.126
//   - PNG centre sits at the box centre — no offset
//   - first bulb is at 0° (east), matching the ring's first dot, so no
//     rotational phase is needed either
const AVATAR_RING_FRAC = 0.373;
const AVATAR_DOT_FRAC = 0.126;
const AVATAR_OFFSET_X = 0;
const AVATAR_OFFSET_Y = 0;

export function ScrollSequence() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const logoSlotRef = useRef<HTMLDivElement>(null);

  // Theme drives the bottom-panel grain configuration:
  //  - Dark mode: panel is black, so `screen` blend lets bright noise
  //    pop and a low opacity (~0.10) reads cleanly.
  //  - Light mode: panel is white. `screen` on white = white, so we
  //    flip to `multiply` (which darkens via the noise) and crank the
  //    opacity higher because multiply needs more strength to be
  //    visible at the same perceived intensity.
  const isDark = useTheme() === "dark";

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Remap raw scroll to a 0→1 sub-timeline that ends at STEP1_LIMIT.
  // All pre-existing step-1 transforms read this instead of
  // scrollYProgress, so they continue to fire at the same ABSOLUTE
  // scroll positions even though more total vh now exists.
  const step1Progress = useTransform(
    scrollYProgress,
    [0, STEP1_LIMIT],
    [0, 1],
  );

  // Window height tracked in JS so we can drive `height` as a pure number
  // of pixels. Framer's keyframe mixer doesn't cleanly interpolate
  // mixed-unit strings like "44px" → "100vh", which is what caused the
  // panel to render at near-full-screen on first paint.
  const [vhPx, setVhPx] = useState(0);
  // Viewport width/height as motion values so any useTransform that
  // reads them gets re-fired on window resize. Without this, the avatar
  // translate stays glued to the OLD vw/2 when the user resizes without
  // scrolling (because anchorX often doesn't change on resize either).
  const vwMV = useMotionValue(0);
  const vhMV = useMotionValue(0);
  useEffect(() => {
    const set = () => {
      setVhPx(window.innerHeight);
      vwMV.set(document.documentElement.clientWidth);
      vhMV.set(document.documentElement.clientHeight);
    };
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [vwMV, vhMV]);

  // --- Shared rotation -------------------------------------------------
  // Rotation: scales with scroll until MERGE_END (logo + wheel locked),
  // FREEZES through the box morph + dwell so the boxes can land at
  // predictable screen positions. Then ramps in with a sine ease-in
  // starting at ROTATION_RAMP_START (well before the box → 3-dot
  // reverse fully completes, so the spin is already visible by the
  // time 3 splits into 6) and CONTINUES smoothly all the way through
  // LINE_END. Total accumulated extra rotation = EXTRA_TURNS_LATE.
  const ringRotRad = useTransform(step1Progress, (p) => {
    const base = Math.min(p, MERGE_END) * TOTAL_TURNS * 2 * Math.PI;
    if (p <= ROTATION_RAMP_START) return base;
    const t = Math.min(
      1,
      (p - ROTATION_RAMP_START) / (LINE_END - ROTATION_RAMP_START),
    );
    // Sine ease-in: starts slow (slope 0), accelerates smoothly.
    const eased = 1 - Math.cos((Math.PI * t) / 2);
    return base + eased * EXTRA_TURNS_LATE * 2 * Math.PI;
  });
  // Logo rotation (degrees) — only the pre-MERGE_END portion of `turns`
  // applies; by the time we'd add the extra rotation, the logo is long
  // gone (faded out during the crossfade).
  const logoRotation = useTransform(step1Progress, (p) => {
    return Math.min(p, MERGE_END) * TOTAL_TURNS * 360;
  });

  // --- Morph stages — all support REVERSE phases ----------------------
  // Forward: 0 at PANEL_END → 1 at MERGE_END. Hold at 1 through the
  // box morph and dwell. Reverse: 1 → 0 during [REVERSE_BOX_END,
  // REVERSE_MERGE_END]. After that, 0 (back to 6-ring positions).
  const mergeP = useTransform(step1Progress, (p) => {
    if (p <= PANEL_END) return 0;
    if (p <= MERGE_END) return (p - PANEL_END) / (MERGE_END - PANEL_END);
    if (p <= REVERSE_BOX_END) return 1;
    if (p <= REVERSE_MERGE_END)
      return 1 - (p - REVERSE_BOX_END) / (REVERSE_MERGE_END - REVERSE_BOX_END);
    return 0;
  });
  // Forward: 0 at MERGE_END → 1 at BOX_END. Hold through pillars + dwell.
  // Reverse: 1 → 0 during [DWELL_END (after pillars fade out) →
  // REVERSE_BOX_END]. After that, 0 (back to merged-dot positions).
  const boxP = useTransform(step1Progress, (p) => {
    if (p <= MERGE_END) return 0;
    if (p <= BOX_END) return (p - MERGE_END) / (BOX_END - MERGE_END);
    if (p <= PILLARS_FADE_OUT_END) return 1;
    if (p <= REVERSE_BOX_END)
      return (
        1 -
        (p - PILLARS_FADE_OUT_END) / (REVERSE_BOX_END - PILLARS_FADE_OUT_END)
      );
    return 0;
  });
  // Pillars fade in over [BOX_END, PILLARS_END], hold through dwell,
  // then fade OUT over [DWELL_END, PILLARS_FADE_OUT_END] so the
  // content vanishes BEFORE the boxes shrink (otherwise text would
  // visibly squish into a shrinking container).
  const pillarsP = useTransform(step1Progress, (p) => {
    if (p <= BOX_END) return 0;
    if (p <= PILLARS_END) return (p - BOX_END) / (PILLARS_END - BOX_END);
    if (p <= DWELL_END) return 1;
    if (p <= PILLARS_FADE_OUT_END)
      return 1 - (p - DWELL_END) / (PILLARS_FADE_OUT_END - DWELL_END);
    return 0;
  });
  // Scroll-progress indicator. Rail fades in with the boxes; fill bar
  // grows 0 → 100% during the dwell window only. Both rail and fill
  // fade out as the boxes start morphing back to circles.
  const indicatorOpacity = useTransform(step1Progress, (p) => {
    if (p <= MERGE_END) return 0;
    if (p <= BOX_END) return (p - MERGE_END) / (BOX_END - MERGE_END);
    if (p <= DWELL_END) return 1;
    if (p <= PILLARS_FADE_OUT_END)
      return 1 - (p - DWELL_END) / (PILLARS_FADE_OUT_END - DWELL_END);
    return 0;
  });
  const indicatorFillPct = useTransform(
    step1Progress,
    [PILLARS_END, DWELL_END],
    ["0%", "100%"],
  );
  // Numeric 0→1 version of the dwell-phase progress bar — drives the
  // sequential pillar-highlight animation in <Pillars/>. Same window as
  // indicatorFillPct but emitted as a number so Pillars can switch which
  // column is "active" at the 33%/66% breakpoints.
  const pillarHighlightP = useTransform(step1Progress, (p) => {
    if (p <= PILLARS_END) return 0;
    if (p >= DWELL_END) return 1;
    return (p - PILLARS_END) / (DWELL_END - PILLARS_END);
  });

  // --- "How it works" — line formation -------------------------------
  // Runs FIRST (before wheel translation). Rotation is still ramping
  // up so the dots ride the spin as they snap into the column.
  // Per-dot stagger inside LoadingRing.
  const lineP = useTransform(step1Progress, (p) => {
    if (p <= LINE_START) return 0;
    if (p >= LINE_END) return 1;
    return (p - LINE_START) / (LINE_END - LINE_START);
  });
  // "How it works:" headline — types out starting the moment dot 0
  // reaches its top-left slot (lineP = LINE_DURATION_LR = 0.25), and
  // finishes by lineP = 0.5 so it's settled before the last dot lands.
  const howItWorksTypeP = useTransform(step1Progress, (p) => {
    const start = LINE_START + 0.25 * (LINE_END - LINE_START);
    const end = LINE_START + 0.5 * (LINE_END - LINE_START);
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // Collapse progress — drives the slide-down of dots 1-5 and the
  // opacity fade of non-active labels + all connectors.
  const collapseP = useTransform(step1Progress, (p) => {
    if (p <= COLLAPSE_START) return 0;
    if (p >= COLLAPSE_END) return 1;
    return (p - COLLAPSE_START) / (COLLAPSE_END - COLLAPSE_START);
  });
  // Tag-description typewriter — single progress value that drives
  // both the type-IN and the un-type-OUT:
  //   [typeInStart   → COLLAPSE_END]         0 → 1  (types in)
  //   [COLLAPSE_END  → STEP1_BREATHE_END]    holds at 1
  //   [STEP1_BREATHE_END → STEP1_TEXT_FADE_END] 1 → 0  (un-types out)
  // Passed to TypewriterText, which rounds chars-shown = len × p.
  const tagTextTypeP = useTransform(step1Progress, (p) => {
    const typeInStart =
      COLLAPSE_START + 0.55 * (COLLAPSE_END - COLLAPSE_START);
    if (p <= typeInStart) return 0;
    if (p < COLLAPSE_END) {
      return (p - typeInStart) / (COLLAPSE_END - typeInStart);
    }
    if (p <= STEP1_BREATHE_END) return 1;
    if (p >= STEP1_TEXT_FADE_END) return 0;
    return (
      1 -
      (p - STEP1_BREATHE_END) / (STEP1_TEXT_FADE_END - STEP1_BREATHE_END)
    );
  });
  // Step 1 progress — fills across the post-collapse window
  // (breathe + lat-pulldown + place + tap + trailing breathe) and
  // reaches 100% at STEP2_TRANSITION_START, the moment the step 2
  // transition begins. Drives the solid overlay inside the 0→1
  // vertical connector.
  const step1ProgressP = useTransform(scrollYProgress, (p) => {
    const fillStart = COLLAPSE_END * STEP1_LIMIT;
    if (p <= fillStart) return 0;
    if (p >= STEP2_TRANSITION_START) return 1;
    return (p - fillStart) / (STEP2_TRANSITION_START - fillStart);
  });
  // Step 2 progress — same pattern as step1ProgressP but one slot
  // lower: fills the dashed connector between dot 1 (TAP-TO-TRACK)
  // and dot 2 (ON-DEMAND LEARNING). Starts when TAP-TO-TRACK arrives
  // at the top (= STEP2_TRANSITION_END), continues filling through
  // the cards phase + trailing breathe, and hits 100% exactly at
  // STEP3_TRANSITION_START — the moment dot 2 starts its rise.
  const step2ProgressP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP2_TRANSITION_END) return 0;
    if (p >= STEP3_TRANSITION_START) return 1;
    return (
      (p - STEP2_TRANSITION_END) /
      (STEP3_TRANSITION_START - STEP2_TRANSITION_END)
    );
  });
  // Step 3 progress — fills the dashed connector between dot 2
  // (ON-DEMAND LEARNING) and dot 3 (GYM-SPECIFIC AI). Starts when
  // ON-DEMAND LEARNING arrives at the top (= STEP3_TRANSITION_END)
  // and runs through the learning cards phase + trailing breathe,
  // hitting 100% exactly at STEP4_TRANSITION_START — the moment
  // dot 3 starts its rise.
  const step3ProgressP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP3_TRANSITION_END) return 0;
    if (p >= STEP4_TRANSITION_START) return 1;
    return (
      (p - STEP3_TRANSITION_END) /
      (STEP4_TRANSITION_START - STEP3_TRANSITION_END)
    );
  });
  // Step 4 progress — fills the dashed connector between dot 3
  // (GYM-SPECIFIC AI) and dot 4 (COMPETE/COMMUNITY). Starts when
  // GYM-SPECIFIC AI arrives at the top (= STEP4_TRANSITION_END) and
  // runs through the equipment cluster + chat reveal, hitting 100%
  // exactly at STEP5_TRANSITION_START — the moment dot 4 starts its
  // rise.
  const step4ProgressP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP4_TRANSITION_END) return 0;
    if (p >= STEP5_TRANSITION_START) return 1;
    return (
      (p - STEP4_TRANSITION_END) /
      (STEP5_TRANSITION_START - STEP4_TRANSITION_END)
    );
  });
  // Step 5 progress — fills the dashed connector between dot 4
  // (COMPETE/COMMUNITY) and dot 5 (VISUALIZE PROGRESS). Starts when
  // COMPETE/COMMUNITY arrives at the top (= STEP5_TRANSITION_END,
  // same moment the "Your gym is a team now" title begins typing)
  // and hits 100% exactly when dot 5 starts rising
  // (= STEP6_TRANSITION_START) — matches the convention used by
  // every preceding step's progress bar.
  const step5ProgressP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP5_TRANSITION_END) return 0;
    if (p >= STEP6_TRANSITION_START) return 1;
    return (
      (p - STEP5_TRANSITION_END) /
      (STEP6_TRANSITION_START - STEP5_TRANSITION_END)
    );
  });
  // Step 6 transition — 0 → 1 over [STEP6_TRANSITION_START → STEP6_TRANSITION_END].
  // Drives: dot 5 (VISUALIZE PROGRESS) rises to its lineY slot; the
  // two existing ghost phones (Ghost L + Ghost M) slide from their
  // 37.5%/57.5% spots to behind the front phone at 77.5%, ready to
  // fan outward.
  const step6TransitionP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP6_TRANSITION_START) return 0;
    if (p >= STEP6_TRANSITION_END) return 1;
    return (
      (p - STEP6_TRANSITION_START) /
      (STEP6_TRANSITION_END - STEP6_TRANSITION_START)
    );
  });
  // Fan reveal — 0 → 1 over [STEP6_TRANSITION_END → FAN_END]. Drives
  // the two existing ghosts fanning out at ±12° / ±60px / scale ×0.9
  // (slot 1 of the Hero deck pattern), AND the two NEW smaller phones
  // fading in at ±24° / ±115px / scale ×0.8 (slot 2).
  const fanP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP6_TRANSITION_END) return 0;
    if (p >= FAN_END) return 1;
    return (
      (p - STEP6_TRANSITION_END) / (FAN_END - STEP6_TRANSITION_END)
    );
  });
  // Step 6 progress overlay — 0 → 1 over [STEP6_TRANSITION_END → PROGRESS_END].
  // Drives the solid progress line that fills the dashed trail from
  // dot 5 (VISUALIZE PROGRESS) down to the section-end horizontal
  // marker. STARTS the moment dot 5 reaches the top (= STEP6_TRANSITION_END)
  // so the line begins filling alongside the fan + headline reveal,
  // then continues filling through a 150vh post-animation breathing
  // window before reaching the bottom marker at PROGRESS_END.
  const step6ProgressP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP6_TRANSITION_END) return 0;
    if (p >= PROGRESS_END) return 1;
    return (p - STEP6_TRANSITION_END) / (PROGRESS_END - STEP6_TRANSITION_END);
  });
  // Exit-wheel phase — 0 → 1 over [PROGRESS_END → EXIT_END]. Mirrors
  // the opening "wheel → line + label reveal" in REVERSE: as this MV
  // rises, lineP / stepsRevealP fade back to 0 (sending the menu's 6
  // dots into a single spinning loading wheel; dashed lines + text
  // labels un-reveal). bgSlideP shares this same window so the entire
  // sticky-frame interior also slides up by 100vh in LOCKSTEP with
  // the wheel reformation — same effect as the opening "Make every
  // session count" panel takeover, minus corner-radius / width work.
  const exitWheelP = useTransform(scrollYProgress, (p) => {
    if (p <= PROGRESS_END) return 0;
    if (p >= EXIT_END) return 1;
    return (p - PROGRESS_END) / (EXIT_END - PROGRESS_END);
  });
  // Background slide-up — DELAYED until the LAST circle (slot 0,
  // INTERACT WITH REDPRINT TAGS at the top of the menu) starts its
  // reverse-animation back to the wheel. Slot 0's reverse window in
  // lineP_menu is [0, 0.25]; since lineP_menu = 1 - exitWheelP, slot
  // 0 starts moving when exitWheelP = 0.75. The slide then runs
  // through to exitWheelP = 1.0, so the bg moves up only while a
  // circle is actually leaving the menu — no awkward "all circles
  // sitting static while the connectors slide up" moment.
  const bgSlideP = useTransform(exitWheelP, (v) => {
    const start = 0.75;
    if (v <= start) return 0;
    return (v - start) / (1 - start);
  });
  // Translation in vh applied to the entire sticky-frame interior
  // wrapper during the BG_SLIDE phase. Lifts everything (background
  // panel + Hero + LoadingRing + HowItWorksSteps + headlines + phones)
  // up by exactly 100vh so the section clears the viewport.
  const bgSlideY = useTransform(bgSlideP, (v) => `${-100 * v}vh`);
  // --- Testimonials phase MVs (all 0 → 1 across their windows) -------
  // Extra wheel rotation — runs [EXIT_END → TEST_WHEEL_EXTRA_END].
  // Drives one full additional turn of the spinning wheel before the
  // dots begin spreading.
  const testWheelExtraP = useTransform(scrollYProgress, (p) => {
    if (p <= EXIT_END) return 0;
    if (p >= TEST_WHEEL_EXTRA_END) return 1;
    return (p - EXIT_END) / (TEST_WHEEL_EXTRA_END - EXIT_END);
  });
  // 6-dot spread — runs [TEST_WHEEL_EXTRA_END → TEST_DOT_SPREAD_END].
  // The 6 main dots travel one-by-one from the wheel's centre out to
  // randomized "testimonial slots" scattered across the viewport.
  // Smaller hollow dots (the user-base scatter) ALSO fade in across
  // this same window.
  const testDotSpreadP = useTransform(scrollYProgress, (p) => {
    if (p <= TEST_WHEEL_EXTRA_END) return 0;
    if (p >= TEST_DOT_SPREAD_END) return 1;
    return (
      (p - TEST_WHEEL_EXTRA_END) /
      (TEST_DOT_SPREAD_END - TEST_WHEEL_EXTRA_END)
    );
  });
  // Line-draw — runs [TEST_DOT_SPREAD_END → TEST_LINES_END]. Dashed
  // connector lines draw from each main dot to its testimonial card,
  // mirroring the tap-to-track line pattern.
  const testLinesP = useTransform(scrollYProgress, (p) => {
    if (p <= TEST_DOT_SPREAD_END) return 0;
    if (p >= TEST_LINES_END) return 1;
    return (p - TEST_DOT_SPREAD_END) / (TEST_LINES_END - TEST_DOT_SPREAD_END);
  });
  // Card flicker-reveal — runs [TEST_LINES_END → TEST_CARDS_END].
  // The 6 testimonial cards appear with the same flicker reveal used
  // for the menu labels + Pillar cards.
  const testCardsP = useTransform(scrollYProgress, (p) => {
    if (p <= TEST_LINES_END) return 0;
    if (p >= TEST_CARDS_END) return 1;
    return (p - TEST_LINES_END) / (TEST_CARDS_END - TEST_LINES_END);
  });
  // Title typewriter — types out "What the Redprint community has to
  // say" alongside the dot spread + line draw, so by the time the
  // cards flicker in the heading is already settled.
  const testTitleP = useTransform(scrollYProgress, (p) => {
    const start = TEST_WHEEL_EXTRA_END;
    const end = TEST_LINES_END;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // Combined "section visible" gate — non-zero across the entire
  // testimonials phase. Used to mount the layer + drive the bg fade-in.
  const testSectionP = useTransform(scrollYProgress, (p) => {
    if (p <= EXIT_END) return 0;
    if (p >= TEST_WHEEL_EXTRA_END) return 1;
    return (p - EXIT_END) / (TEST_WHEEL_EXTRA_END - EXIT_END);
  });
  // Testimonials scroll-progress indicator — mirrors the "Make every
  // session count" pillars indicator. Starts the moment the title
  // "What the Redprint community has to say" begins typing (=
  // TEST_WHEEL_EXTRA_END) and fills 0 → 100% by PROGRESS_BAR_END —
  // BEFORE the end of scroll, so the next-section bottom panel can
  // grow up to cover the screen after the bar completes. Quick
  // opacity fade-in at the start; fade-out as the panel takeover
  // begins (the bar's job is done at that point).
  const PROGRESS_BAR_END = 0.8932;
  const testIndicatorOpacity = useTransform(scrollYProgress, (p) => {
    if (p <= TEST_WHEEL_EXTRA_END) return 0;
    if (p <= TEST_WHEEL_EXTRA_END + 0.003)
      return (p - TEST_WHEEL_EXTRA_END) / 0.003;
    if (p <= PROGRESS_BAR_END) return 1;
    return Math.max(0, 1 - (p - PROGRESS_BAR_END) / 0.005);
  });
  const testIndicatorFillPct = useTransform(
    scrollYProgress,
    [TEST_WHEEL_EXTRA_END, PROGRESS_BAR_END],
    ["0%", "100%"],
  );
  // Opacity for the step-6 content (phones + "Watch yourself improve"
  // headline). Fades to 0 across exitWheelP [0.4, 0.75] — starting
  // when slot 5 begins its reverse and finishing exactly when bg-slide
  // begins (so the fade is the dominant visual effect and isn't
  // muddled by the concurrent translate-up). That window covers ~42vh
  // of scroll: a clearly visible fade rather than an abrupt vanish.
  const exitContentVisibleP = useTransform(exitWheelP, (v) => {
    const start = 0.4;
    const end = 0.75;
    if (v <= start) return 1;
    if (v >= end) return 0;
    return 1 - (v - start) / (end - start);
  });
  // Wheel rotation extended through the exit-wheel, the testimonials
  // dot-spread, AND the footer-return spin. The wheel pauses while
  // the dots are coming back to it, then re-starts spinning the
  // moment the FIRST dot arrives (slot 5 lands at footerReturnP =
  // 0.5, because its un-spread window is [1.0 → 0.5] in effective
  // spread).
  //   - exit-wheel : 0.7 turn over ~81vh  → ~116vh/turn
  //   - dot spread : 2.0 turns over ~200vh → ~100vh/turn
  //   - footer spin: 1.5 turns over the second half of footerReturnP
  //     (DEFINED BELOW — `ringRotFinal` itself is declared further
  //     down, after the testimonials / footer phase MVs are set up,
  //     so it can pull from all of them in one pass.)
  // Step 5 transition — 0 → 1 over [STEP5_TRANSITION_START → STEP5_TRANSITION_END].
  // Drives: dot 4 (COMPETE/COMMUNITY) rises to its lineY slot; the
  // moving phone slides from (37.5%, 50%) to (85%, 50%) leaving two
  // static ghost copies behind at (37.5%, 50%) and (61.25%, 50%).
  const step5TransitionP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP5_TRANSITION_START) return 0;
    if (p >= STEP5_TRANSITION_END) return 1;
    return (
      (p - STEP5_TRANSITION_START) /
      (STEP5_TRANSITION_END - STEP5_TRANSITION_START)
    );
  });
  // Step 4 transition — 0 → 1 over [STEP4_TRANSITION_START → STEP4_TRANSITION_END].
  // Drives: dot 3 (GYM-SPECIFIC AI) rises to its lineY slot; the
  // learning headline + two learning cards fade out; the phone screen
  // crossfades from ExerciseRedprintView to AIChatbotView; the phone
  // slides from (~74%, 50%) back to (40%, 50%) — the tap-to-track
  // resting position.
  const step4TransitionP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP4_TRANSITION_START) return 0;
    if (p >= STEP4_TRANSITION_END) return 1;
    return (
      (p - STEP4_TRANSITION_START) /
      (STEP4_TRANSITION_END - STEP4_TRANSITION_START)
    );
  });
  // Equipment cluster reveal — 0 → 1 over [EQUIP_START → EQUIP_END].
  // Starts ~100vh BEFORE step 4 transition finishes so the cluster
  // bouncy-scales-in as the phone is settling at its left-side resting
  // position. Drives the spring scale-in inside EquipmentCluster.
  const equipP = useTransform(scrollYProgress, (p) => {
    if (p <= EQUIP_START) return 0;
    if (p >= EQUIP_END) return 1;
    return (p - EQUIP_START) / (EQUIP_END - EQUIP_START);
  });
  // Equipment headline ("Build workouts based on your gym's equipment")
  // types in lockstep with the FIRST 60% of the equipment cluster
  // reveal — same pattern as the tracking + learning headlines.
  const equipHeadlineP = useTransform(scrollYProgress, (p) => {
    const start = EQUIP_START;
    const end = EQUIP_START + 0.6 * (EQUIP_END - EQUIP_START);
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // Chat typewriter — 0 → 1 over the entire chat window. AIChatbotView
  // derives per-message + per-list-item sub-progress values from this
  // single MV, so the messages type out one at a time as the user
  // scrolls through [CHAT_START, CHAT_END].
  const chatP = useTransform(scrollYProgress, (p) => {
    if (p <= CHAT_START) return 0;
    if (p >= CHAT_END) return 1;
    return (p - CHAT_START) / (CHAT_END - CHAT_START);
  });
  // Faster fade-out window for the equipment headline + cluster during
  // the step 4→5 transition — they vanish over the FIRST 30% of step 5
  // instead of the full window, so they're gone well before the phone
  // finishes its slide right.
  const equipFadeOutFastP = useTransform(step5TransitionP, (v) =>
    Math.min(1, v / 0.3),
  );
  // Compete-section title ("Your gym is a team now") types out across
  // the 100vh window after step 5 ends. Phone has just settled into
  // its final right-side position; the title appears above.
  const compTitleP = useTransform(scrollYProgress, (p) => {
    const start = STEP5_TRANSITION_END;
    const end = COMPETE_TITLE_END;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // "Watch yourself improve" headline — types out alongside the
  // fan-out, on the LEFT side of the viewport (the fan is centred
  // around 67.5% after the 10% leftward shift, so plenty of room to
  // the left for a section title).
  const watchHeadlineP = useTransform(fanP, (v) => v);
  // Phone-trio vertical position — drops 50% → 60% during the step 5
  // slide, then RISES BACK 60% → 50% during the step 6 gather (while
  // the two ghosts are travelling right to stack behind the front
  // phone), so all three phones move up TOGETHER. Shared MV:
  // applies to the moving phone AND every ghost.
  const phoneTop = useTransform(
    [step5TransitionP, step6TransitionP] as MotionValue<number>[],
    (vals) => {
      const [t5, t6] = vals as unknown as [number, number];
      // Phones used to drop +10% during step 5 then rise back during
      // step 6. Inverted to -8% (phones rise UP during step 5) so the
      // trio sits high enough to leave clear room below for the three
      // view-name captions on shorter laptop viewports. PhoneTap's own
      // `top` formula must match this -8/+8 swing.
      return `${50 + 7 * t5 - 7 * t6}%`;
    },
  );
  // Motion gate — gates the floating + cursor parallax + Z-tilt for
  // the moving phone (PhoneTap). Damps to 0 quickly at the start of
  // the step 5 slide (over ~7.5vh) and stays at 0 thereafter. The
  // ghosts are static — no parallax/float — so they don't take this
  // value.
  const phoneMotionGate = useTransform(step5TransitionP, (v) =>
    Math.max(0, 1 - 40 * v),
  );
  // Step 3 transition — 0 → 1 over [STEP3_TRANSITION_START → STEP3_TRANSITION_END].
  // Drives: dot 2 (ON-DEMAND LEARNING) ramps 0.5 → 1.0 + slides up to
  // its lineY slot under dot 1; the "Tracking made easy" headline +
  // three tracking cards fade out; the phone slides from (40%, 50%)
  // to ~(74%, 50%) — to where the cards just were.
  const step3TransitionP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP3_TRANSITION_START) return 0;
    if (p >= STEP3_TRANSITION_END) return 1;
    return (
      (p - STEP3_TRANSITION_START) /
      (STEP3_TRANSITION_END - STEP3_TRANSITION_START)
    );
  });
  // Learning cards (Step 3 content) — same pattern as the tracking
  // cards but 2 cards instead of 3, on the LEFT of the phone. Each
  // sub-phase: 60% line-draw → 40% card flicker. 50% overlap between
  // consecutive sub-phases.
  const learn1P = useTransform(scrollYProgress, (p) => {
    const start = LEARN_START;
    const end = start + LEARN_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  const learn2P = useTransform(scrollYProgress, (p) => {
    const start = LEARN_START + LEARN_STAGGER;
    const end = start + LEARN_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // Learning headline ("Learn the gym as you use it") types in lockstep
  // with card 1's connector-line draw — same pattern as the tracking
  // headline.
  const learnHeadlineP = useTransform(scrollYProgress, (p) => {
    const start = LEARN_START;
    const end = LEARN_START + CARD_LINE_FRAC * LEARN_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // Tracking-section headline ("Workout tracking made easy") types out
  // in lockstep with card 1's connector-line draw: starts at CARDS_START
  // and finishes exactly when the first line completes its trip from
  // the phone to its card. That way the user reads the headline while
  // watching the first line trace its way across the viewport.
  const headlineP = useTransform(scrollYProgress, (p) => {
    const start = CARDS_START;
    const end = CARDS_START + CARD_LINE_FRAC * CARD_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // 6-tag collapse — continues for the full fade-out window after
  // the text is gone, so the surround tags arrive at centre + vanish
  // even as the lat-pulldown is already coming in alongside.
  const step1FadeOutP = useTransform(step1Progress, (p) => {
    if (p <= STEP1_BREATHE_END) return 0;
    if (p >= STEP1_FADE_OUT_END) return 1;
    return (
      (p - STEP1_BREATHE_END) / (STEP1_FADE_OUT_END - STEP1_BREATHE_END)
    );
  });
  // Lat-pulldown reveal — starts at the SAME scroll as the text fade,
  // so the two cross-fade rather than wait-then-appear. By the time
  // the text is fully gone the lat-pulldown is already partially in.
  const latPullP = useTransform(step1Progress, (p) => {
    if (p <= STEP1_BREATHE_END) return 0;
    if (p >= STEP1_END) return 1;
    return (p - STEP1_BREATHE_END) / (STEP1_END - STEP1_BREATHE_END);
  });
  // "Place tag on equipment" phase — runs AFTER the surround tags
  // have collapsed away, so the only motion left is the centre tag
  // gliding over to the equipment as the equipment zooms in.
  // Drives BOTH the lat-pulldown's 1× → 5× scale-up AND the centre
  // tag's slide from its current position to the equipment's centre.
  const placeP = useTransform(step1Progress, (p) => {
    if (p <= STEP1_FADE_OUT_END) return 0;
    if (p >= STEP1_END) return 1;
    return (p - STEP1_FADE_OUT_END) / (STEP1_END - STEP1_FADE_OUT_END);
  });

  // --- Tap phase ------------------------------------------------------
  // Runs on RAW scrollYProgress so it sits AFTER the step-1 timeline.
  // tapTypeP + phoneRiseP run together over [TAP_START → TAP_RISE_END];
  // phoneTapP fires the final scale-down impact over [TAP_RISE_END → TAP_END].
  const tapTypeP = useTransform(scrollYProgress, (p) => {
    if (p <= TAP_START) return 0;
    if (p >= TAP_RISE_END) return 1;
    return (p - TAP_START) / (TAP_RISE_END - TAP_START);
  });
  const phoneRiseP = useTransform(scrollYProgress, (p) => {
    if (p <= TAP_START) return 0;
    if (p >= TAP_RISE_END) return 1;
    return (p - TAP_START) / (TAP_RISE_END - TAP_START);
  });
  const phoneTapP = useTransform(scrollYProgress, (p) => {
    if (p <= TAP_RISE_END) return 0;
    if (p >= TAP_END) return 1;
    return (p - TAP_RISE_END) / (TAP_END - TAP_RISE_END);
  });
  // Step 2 transition — 0 → 1 over [STEP2_TRANSITION_START → STEP2_TRANSITION_END].
  // Drives all of: dot-1 activation + slide-up, tap-text un-type,
  // equipment fade-out, centre tag fade-out, phone repositioning.
  const step2TransitionP = useTransform(scrollYProgress, (p) => {
    if (p <= STEP2_TRANSITION_START) return 0;
    if (p >= STEP2_TRANSITION_END) return 1;
    return (
      (p - STEP2_TRANSITION_START) /
      (STEP2_TRANSITION_END - STEP2_TRANSITION_START)
    );
  });
  // Fast tap-text fade window — un-types the description in ~25vh
  // at the very START of the step 2 transition (rather than spreading
  // the un-type across the full 225vh window). 25vh / 8575vh scrollable
  // ≈ 0.00292 of scrollYProgress.
  const tapTextFadeP = useTransform(scrollYProgress, (p) => {
    const end = STEP2_TRANSITION_START + 0.00292;
    if (p <= STEP2_TRANSITION_START) return 0;
    if (p >= end) return 1;
    return (p - STEP2_TRANSITION_START) / (end - STEP2_TRANSITION_START);
  });
  // Combined tap-text progress — tapTypeP holds at 1 once typed,
  // tapTextFadeP unwinds it 1 → 0 (the fast 10vh window).
  const tapTextDisplayP = useTransform(
    [tapTypeP, tapTextFadeP] as MotionValue<number>[],
    (vals) => {
      const [t, f] = vals as unknown as [number, number];
      return t * (1 - f);
    },
  );

  // Per-dot reveal progress — feeds the dashed-line + label animation
  // in HowItWorksSteps. Runs ONLY during the line-stagger phase.
  const stepsRevealP = useTransform(step1Progress, (p) => {
    if (p <= LINE_START) return 0;
    if (p >= LINE_END) return 1;
    return (p - LINE_START) / (LINE_END - LINE_START);
  });

  // During the exit-wheel phase we reverse ONLY lineP and stepsRevealP
  // — those drive the wheel→line morph and the dashed-line+label reveal
  // in HowItWorksSteps. collapseP and the step2..6 transitions are
  // LEFT AT 1, so each dot's `lineTargetY` stays anchored at its
  // menu-slot position (lineY[i]) throughout the exit. Reversing those
  // MVs would temporarily drag dots 1-4 back down toward the collapsed
  // stack at the bottom of the viewport before they head up to the
  // wheel — that's the bug we're avoiding here.
  const lineP_menu = useTransform(
    [lineP, exitWheelP] as MotionValue<number>[],
    (vals) => {
      const [v, e] = vals as unknown as [number, number];
      return v * (1 - e);
    },
  );
  const stepsRevealP_menu = useTransform(
    [stepsRevealP, exitWheelP] as MotionValue<number>[],
    (vals) => {
      const [v, e] = vals as unknown as [number, number];
      // Shift the effective stepsReveal value DOWN by 0.07 (= one
      // LINE_STAGGER) during the exit phase so each dashed connector
      // and label finishes retracting BEFORE its lower dot starts
      // travelling back to the wheel. The shift is ramped in fast
      // (full 0.07 by exitWheelP = 0.05) to avoid any visible
      // discontinuity at the boundary.
      const shift = Math.min(1, e / 0.05) * 0.07;
      return Math.max(0, v * (1 - e) - shift);
    },
  );
  // Solid progress overlays (step1..5ProgressP, step6ProgressP) retract
  // BEFORE the slot-K dot that they terminate at starts travelling
  // back to the wheel. Each overlay retracts over a narrow 0.07
  // window in lineP_menu space ending at `trigger = LINE_STAGGER*K +
  // LINE_DURATION` — that's exactly the moment slot K starts its
  // reverse-animation. step6P (the trailing line below dot 5) is
  // anchored to dot 5, so it shares slot 5's trigger. The literals
  // mirror LoadingRing's LINE_STAGGER (0.07) + LINE_DURATION (0.25).
  const step1ProgressP_menu = useTransform(
    [step1ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 1 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );
  const step2ProgressP_menu = useTransform(
    [step2ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 2 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );
  const step3ProgressP_menu = useTransform(
    [step3ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 3 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );
  const step4ProgressP_menu = useTransform(
    [step4ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 4 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );
  const step5ProgressP_menu = useTransform(
    [step5ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 5 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );
  const step6ProgressP_menu = useTransform(
    [step6ProgressP, lineP_menu] as MotionValue<number>[],
    (vals) => {
      const [b, lp] = vals as unknown as [number, number];
      const trigger = 0.07 * 5 + 0.25;
      const upper = trigger + 0.07;
      if (lp >= upper) return b;
      if (lp <= trigger) return 0;
      return b * ((lp - trigger) / 0.07);
    },
  );

  // --- Tracking cards (Step 2 content) ---------------------------------
  // Three card sub-phases, each split internally:
  //   [0  → CARD_LINE_FRAC]  dashed connector line draws from phone → card
  //   [CARD_LINE_FRAC → 1]   card flickers in (same `flicker` curve as
  //                          the left-menu labels)
  // The TrackingCards component does that internal split itself; here we
  // just hand it three 0→1 sub-phase MotionValues.
  const card1P = useTransform(scrollYProgress, (p) => {
    const start = CARDS_START;
    const end = start + CARD_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  const card2P = useTransform(scrollYProgress, (p) => {
    const start = CARDS_START + CARD_STAGGER;
    const end = start + CARD_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  const card3P = useTransform(scrollYProgress, (p) => {
    const start = CARDS_START + CARD_STAGGER * 2;
    const end = start + CARD_WINDOW;
    if (p <= start) return 0;
    if (p >= end) return 1;
    return (p - start) / (end - start);
  });
  // NOTE: the cards phase is the CONTENT of step 2 (TAP-TO-TRACK), not
  // a transition INTO step 3. Dot 1 (TAP-TO-TRACK) was already activated
  // by `step2TransitionP` during the step 1→2 phone-move. Dot 2
  // (ON-DEMAND LEARNING) stays at its 50% un-reached floor through the
  // cards phase and only activates when the user scrolls into the
  // step 2→3 transition (not built yet).

  // Logo fades during the crossfade window. Explicit clamp in a callback
  // so it cannot drift back above 0 once it's fully faded — Framer's
  // built-in keyframe clamping has occasionally let opacity creep back
  // up in v12 (the symptom: the emblem reappearing behind the wheel as
  // the wheel slides to centre).
  const logoOpacity = useTransform(step1Progress, (p) => {
    if (p <= FADE_START) return 1;
    if (p >= FADE_END) return 0;
    return 1 - (p - FADE_START) / (FADE_END - FADE_START);
  });

  // --- Bottom panel ----------------------------------------------------
  const panelHeight = useTransform(
    step1Progress,
    [REST_END, PANEL_END],
    [PANEL_BASE_HEIGHT, vhPx || 0],
  );
  const panelRadius = useTransform(
    step1Progress,
    [REST_END, PANEL_END],
    [PANEL_BASE_RADIUS, 0],
  );
  const panelInset = useTransform(
    step1Progress,
    [REST_END, PANEL_END],
    [PANEL_BASE_INSET, 0],
  );

  // --- Next-section panel reveal --------------------------------------
  // Three-stage life cycle:
  //   1. SLIDE-IN: panel slides up from BELOW the viewport into its
  //      rest tab position as the title "What the Redprint community
  //      has to say" types out. Window: [TEST_WHEEL_EXTRA_END →
  //      TEST_LINES_END] (same as testTitleP).
  //   2. HOLD: panel sits at rest tab until the progress bar fills.
  //   3. TAKEOVER: panel grows up to full viewport over the last
  //      ~150vh after the progress bar completes.
  // Color is theme-aware red (light red in light mode, dark red in
  // dark mode) so it reads as a deliberate "next section" cue.
  const nextPanelAppearP = useTransform(scrollYProgress, (p) => {
    if (p <= TEST_WHEEL_EXTRA_END) return 0;
    if (p >= TEST_LINES_END) return 1;
    return (
      (p - TEST_WHEEL_EXTRA_END) / (TEST_LINES_END - TEST_WHEEL_EXTRA_END)
    );
  });
  const nextPanelSlideY = useTransform(
    nextPanelAppearP,
    (p) => `${(1 - p) * 100}%`,
  );
  const nextSectionP = useTransform(scrollYProgress, (p) => {
    if (p <= PROGRESS_BAR_END) return 0;
    if (p >= 1) return 1;
    return (p - PROGRESS_BAR_END) / (1 - PROGRESS_BAR_END);
  });
  // Footer reveal — as the red panel grows from the bottom, the 6
  // testimonial dots travel BACK to the wheel formation at viewport
  // centre, and the cards / lines / small dots / title fade out so
  // the wheel emerges cleanly just before the panel covers it.
  // `footerReturnP` ramps 0→1 over the first 40% of `nextSectionP`
  // so the dots return to wheel formation in the early portion of
  // the nextSection phase. Compressed (from 0.7) to leave room for
  // the logo fade, sentence formation, and the 100vh silhouette
  // buffer downstream.
  const footerReturnP = useTransform(nextSectionP, (v) =>
    Math.max(0, Math.min(1, v / 0.4)),
  );
  // Effective spread for LoadingRing: tracks testDotSpreadP forward,
  // then multiplies down by (1 - footerReturnP) so the dots un-spread
  // back into the wheel during the footer reveal.
  const effectiveSpreadP = useTransform(
    [testDotSpreadP, footerReturnP] as MotionValue<number>[],
    (vals) => {
      const [tds, fr] = vals as unknown as [number, number];
      return tds * (1 - fr);
    },
  );
  // Logo crossfade — fades the centred Redprint emblem IN only AFTER
  // the wheel has fully reformed (= footerReturnP saturates at
  // nextSectionP = 0.4). Now runs over [0.4 → 0.55] of nextSectionP,
  // also doubling as the "Redprint" typewriter ramp. Compressed and
  // shifted earlier so the sentence formation can fit downstream
  // AFTER the typewriter completes.
  const logoFadeP = useTransform(nextSectionP, (v) =>
    Math.max(0, Math.min(1, (v - 0.4) / 0.15)),
  );
  // Text formation — drives the morph of the scattered hollow dot
  // field into the "Welcome to the future of your gym" sentence
  // (rendered as a Bitcount Grid Single dot-matrix). Starts the
  // moment "Redprint" finishes typing (= logoFadeP saturates at
  // nextSectionP = 0.9) and completes by scroll = 1.0. Each dot's
  // position lerps from its scatter (finalX, finalY) to its
  // assigned text-pixel target as this MV rises.
  // Sentence-formation ramp. Starts AFTER the Redprint logo+text
  // typewriter completes (logoFadeP saturates at nextSectionP 0.55)
  // so the dots don't visually clash with the still-fading emblem.
  //   Start: nextSectionP = 0.58 (= scrollYProgress ≈ 0.9832)
  //   End:   nextSectionP = 0.821 (= scrollYProgress ≈ 0.9929,
  //          which is the start of the SILHOUETTE_DELAY_VH buffer)
  //   Width: 0.241 of nextSectionP ≈ 135vh of scrolling
  // Sentence-formation start now fires LATE in nextSectionP (was
  // 0.58 → 0.821, now 0.80 → 0.98). The visual formation no longer
  // needs scroll runway since it auto-plays once the latch fires — and
  // moving the latch later means much less forced scrolling between
  // "sentence starts forming" and "user can scroll past the section."
  // The window width is narrow on purpose; only the latch threshold
  // matters now, not the value of formTextP itself.
  const formTextP = useTransform(nextSectionP, (v) =>
    Math.max(0, Math.min(1, (v - 0.80) / 0.18)),
  );
  // --- Footer auto-play -------------------------------------------------
  // The dot-sentence formation, request-gym form fade-in, white-floor
  // strip and silhouette bounce-in all USED to scrub directly with
  // scroll. That made the last moments of the page feel jerky if the
  // user wheel-flicked through. We latch on the first time scroll
  // crosses FOOTER_AUTOPLAY_LATCH (a small threshold inside formTextP's
  // range) and then drive everything downstream from a TIME-based ramp
  // that auto-plays to completion over FOOTER_AUTOPLAY_DURATION_MS.
  // Scrolling back ABOVE the latch resets the timer, so the user can
  // rewind by scrolling up and replay by scrolling back down.
  const FOOTER_AUTOPLAY_DURATION_MS = 3000;
  const FOOTER_AUTOPLAY_LATCH = 0.01;
  const time = useTime();
  const footerAutoStartTime = useMotionValue(0);
  // Captures nextSectionP at the moment of latch. The wheel-rotation
  // driver uses this as the "frozen" starting value so the rotation
  // continues smoothly from where scroll left off when control hands
  // over to the auto-play timer (otherwise there'd be a visible jump).
  const nextSectionPAtLatch = useMotionValue(0);
  useEffect(() => {
    const evaluate = () => {
      const scrollVal = formTextP.get();
      const startT = footerAutoStartTime.get();
      if (scrollVal >= FOOTER_AUTOPLAY_LATCH && startT === 0) {
        footerAutoStartTime.set(time.get());
        nextSectionPAtLatch.set(nextSectionP.get());
      } else if (scrollVal < FOOTER_AUTOPLAY_LATCH && startT !== 0) {
        footerAutoStartTime.set(0);
        nextSectionPAtLatch.set(0);
      }
    };
    evaluate();
    return formTextP.on("change", evaluate);
  }, [formTextP, footerAutoStartTime, time, nextSectionP, nextSectionPAtLatch]);
  const footerAutoP = useTransform(
    [time, footerAutoStartTime] as MotionValue<number>[],
    (vals) => {
      const [t, startT] = vals as unknown as [number, number];
      if (startT === 0) return 0;
      const elapsed = t - startT;
      return Math.max(
        0,
        Math.min(1, elapsed / FOOTER_AUTOPLAY_DURATION_MS),
      );
    },
  );
  // Hybrid driver for the footer wheel rotation. Pre-latch it follows
  // nextSectionP (scroll-tied), so the wheel rotates while the user is
  // still scrolling into the footer phase. Post-latch it interpolates
  // smoothly from the latched value to 1 over the auto-play duration,
  // so the remaining ~2.5 turns play out on a timer regardless of
  // whether the user scrolls further. ringRotFinal uses this in place
  // of nextSectionP for the footerSpin + final 70° offset terms.
  const footerSpinDriverP = useTransform(
    [
      nextSectionP,
      footerAutoP,
      footerAutoStartTime,
      nextSectionPAtLatch,
    ] as MotionValue<number>[],
    (vals) => {
      const [ns, auto, startT, latchedNs] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      if (startT === 0) return ns;
      return latchedNs + (1 - latchedNs) * auto;
    },
  );
  // Fade-in for the white floor strip that gives the silhouettes a
  // clean floor to stand on at the end of the sticky scroll-sequence.
  // Derives from the auto-play ramp now (was formTextP) so it tracks
  // the same fixed-duration timeline as the sentence + form + silhouettes.
  const whiteFloorOpacityP = useTransform(footerAutoP, [0.85, 1], [0, 1]);
  const wheelVisibilityP = useTransform(logoFadeP, (v) => 1 - v);
  // Final wheel rotation — see the rotation-rate comment block much
  // earlier in this file for the multiplier rationale. Declared here
  // (rather than alongside `ringRotRad`) because it pulls from MVs
  // defined throughout this component, including the testimonials
  // and footer-return MVs above.
  const ringRotFinal = useTransform(
    [
      ringRotRad,
      exitWheelP,
      testDotSpreadP,
      footerSpinDriverP,
    ] as MotionValue<number>[],
    (vals) => {
      const [base, ew, tds, ns] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      const exitSpinT = Math.max(0, (ew - 0.65) / 0.35);
      // Footer spin uses the hybrid driver (scroll-tied pre-latch,
      // time-driven post-latch) so the wheel rotates continuously
      // through the dot-return phase AND keeps spinning to completion
      // on the auto-play timer once the sentence-formation latch
      // fires, even if the user scrolls past the sticky section.
      // 2.5 turns over the driver's 0→1 sweep.
      const footerSpinT = ns;
      const extraTurns =
        exitSpinT * 0.7 + tds * 2.0 + footerSpinT * 2.5;
      // Final +70° canonical-orientation wind-up also rides the hybrid
      // driver so the wheel and logo land on the same final orientation
      // whether the user scrolled all the way or auto-play completed it.
      const finalOffsetRad = (70 * Math.PI) / 180 * ns;
      return base + extraTurns * 2 * Math.PI + finalOffsetRad;
    },
  );
  // ringRotFinal is in RADIANS (the LoadingRing maths uses sin/cos
  // on it). The centred RedprintMark is a motion.div whose `rotate`
  // expects DEGREES, so we convert. PURE conversion — no extra
  // offset here, because the +70° canonical-orientation wind-up is
  // baked into `ringRotFinal` itself, so the wheel and the emblem
  // share an identical rotation cadence the whole way through.
  const ringRotDeg = useTransform(
    ringRotFinal,
    (r) => (r * 180) / Math.PI,
  );
  // Panel saturates at nextSectionP = 0.642 (= 100vh BEFORE the
  // silhouettes trigger at nextSectionP 0.821 with TOTAL_VH=14000
  // and SILHOUETTE_DELAY_VH=100). After saturation, the panel sits
  // full-bleed while the user keeps scrolling — that's the
  // "100vh between footer-full and silhouettes" window.
  const PANEL_FULL_AT = 0.642;
  const nextPanelHeight = useTransform(
    [nextSectionP, vhMV] as MotionValue<number>[],
    (vals) => {
      const [p, vh] = vals as unknown as [number, number];
      const panelP = Math.min(p / PANEL_FULL_AT, 1);
      return PANEL_BASE_HEIGHT + ((vh || 0) - PANEL_BASE_HEIGHT) * panelP;
    },
  );
  const nextPanelRadius = useTransform(nextSectionP, (p) => {
    const panelP = Math.min(p / PANEL_FULL_AT, 1);
    return PANEL_BASE_RADIUS * (1 - panelP);
  });
  const nextPanelInset = useTransform(nextSectionP, (p) => {
    const panelP = Math.min(p / PANEL_FULL_AT, 1);
    return PANEL_BASE_INSET * (1 - panelP);
  });

  // --- Loading-wheel overlay ------------------------------------------
  // Symmetric explicit clamp on the fade-in. Holds at full opacity for
  // the rest of the scroll.
  const avatarOpacity = useTransform(step1Progress, (p) => {
    if (p <= FADE_START) return 0;
    if (p >= FADE_END) return 1;
    return (p - FADE_START) / (FADE_END - FADE_START);
  });
  // Slide-to-centre progress. Holds at 0 until MOVE_START (so the wheel
  // stays parked on the old logo slot while the panel takes over the
  // screen), then ramps 0→1 by MOVE_END.
  const avatarMoveP = useTransform(step1Progress, (p) => {
    if (p <= MOVE_START) return 0;
    if (p >= MOVE_END) return 1;
    return (p - MOVE_START) / (MOVE_END - MOVE_START);
  });
  // Size is fixed — the wheel keeps the logo's size as it slides to
  // centre. We still expose this as a MotionValue because LoadingRing
  // subscribes to it.
  const avatarSize = useMotionValue(AVATAR_SIZE);
  // LoadingRing's opacity hands off to Pillars: visible while the
  // crossfade-from-logo and morph play, then fades out as Pillars
  // (which renders identical box outlines at the same positions) rises.
  // Net effect: the boxes look like they stay put while the content
  // materializes inside them.
  const loadingRingOpacity = useTransform(
    [avatarOpacity, pillarsP] as unknown as MotionValue<number>[],
    (vals) => {
      const [o, p] = vals as unknown as [number, number];
      // No exit fade — the wheel's 6 dots physically spread out to
      // the testimonial anchors via LoadingRing's `spreadTargets`
      // mechanism, so they STAY visible throughout the testimonials
      // intro (no fade-out + replacement).
      return o * (1 - p);
    },
  );
  // `isFooterShownP` flips 0 → 1 right around `footerReturnP = 1`
  // (= the moment the wheel finishes reforming). Used to HAND OFF
  // the wheel from the old viewport-centred wrapper (used for the
  // line/box/return phases) to a NEW wrapper inside the centred
  // logo+text flex container — so the wheel and the logo share a
  // parent and stay perfectly co-located as the group shifts left
  // with the typing text. Short ramp so the crossover is brief
  // and both versions are visually identical at the boundary
  // (both render the same wheel at viewport centre at that
  // moment), avoiding any pop.
  const isFooterShownP = useTransform(footerReturnP, (v) =>
    Math.max(0, Math.min(1, (v - 0.95) / 0.05)),
  );
  const loadingRingOpacityOld = useTransform(
    [loadingRingOpacity, isFooterShownP] as MotionValue<number>[],
    (vals) => {
      const [base, foot] = vals as unknown as [number, number];
      return base * (1 - foot);
    },
  );
  const loadingRingOpacityFooter = useTransform(
    [isFooterShownP, wheelVisibilityP] as MotionValue<number>[],
    (vals) => {
      const [foot, vis] = vals as unknown as [number, number];
      return foot * vis;
    },
  );


  // Measure the logo slot so the avatar can start from the same on-screen
  // spot and morph to viewport center. We re-measure aggressively because
  // Hero's GSAP intro runs ~3s and shifts the logo's x-offset over that
  // window — caching an early measurement leaves the overlay anchored to
  // a stale mid-animation position, which shows up as the loading wheel
  // sitting above the emblem.
  const anchorX = useMotionValue(0);
  const anchorY = useMotionValue(0);
  const [measured, setMeasured] = useState(false);
  // Footer "Redprint" typewriter — we DON'T use TypewriterText here
  // because that component reserves the full layout width via a
  // visibility:hidden tail span (= the centred group's width would
  // be constant during typing, so the wheel + logo wouldn't shift
  // left). Instead, drive the visible substring directly off
  // logoFadeP state; the layout reflows naturally as characters
  // accumulate, and the centred flex container grows + shifts left.
  const [logoFadeState, setLogoFadeState] = useState(0);
  useEffect(
    () => logoFadeP.on("change", setLogoFadeState),
    [logoFadeP],
  );
  const FOOTER_LOGO_TEXT = "Redprint";
  const footerLogoCharsShown = Math.round(
    FOOTER_LOGO_TEXT.length * logoFadeState,
  );
  // Smooth horizontal offset of the wheel+logo+text group. Instead
  // of letting the flex auto-centering shift the group in DISCRETE
  // steps (one step per character revealed), we drive the group's
  // translateX directly from `logoFadeP` — a continuous value —
  // so the wheel and logo glide smoothly left as the text fills in.
  // -32 centres the 64px wheel/logo box on the viewport at fade=0,
  // and -118 is the additional shift at fade=1 (½ of the typeset
  // "Redprint" + gap, so the FULL group is viewport-centred when
  // the text is fully typed).
  const footerGroupX = useTransform(
    logoFadeP,
    (v) => -32 - 118 * v,
  );
  // Group's vertical position lerps from viewport centre (handoff
  // from the OLD wrapper) UP to top-centre as the logo fades in.
  // logoFadeP = 0  → viewport vertical centre (= matches OLD wheel
  //                  position, no jump at handoff).
  // logoFadeP = 1  → 25vh from top.
  // The -32 offset centres the 64px wheel/logo box on the computed
  // y position.
  const footerGroupY = useTransform(
    [logoFadeP, vhMV] as MotionValue<number>[],
    (vals) => {
      const [fade, vh] = vals as unknown as [number, number];
      const fromCy = vh * 0.5;
      const toCy = vh * 0.20;
      return fromCy + (toCy - fromCy) * fade - 32;
    },
  );
  useEffect(() => {
    const measure = () => {
      const el = logoSlotRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      anchorX.set(r.left + r.width / 2);
      anchorY.set(r.top + r.height / 2);
      setMeasured(true);
    };
    measure();
    // Series of re-measures covering: layout settled, GSAP intro mid-way,
    // GSAP intro complete. The logo is inside a sticky element so once
    // GSAP settles, its viewport position is constant — no need to
    // remeasure on scroll (doing so forces a layout reflow per scroll
    // tick and that's what was making the slide-to-centre choppy).
    const ids = [120, 1500, 3500].map((t) =>
      window.setTimeout(measure, t),
    );
    window.addEventListener("resize", measure);
    return () => {
      ids.forEach(window.clearTimeout);
      window.removeEventListener("resize", measure);
    };
  }, [anchorX, anchorY]);

  // Interpolate the avatar's translate offset (not left/top — transforms
  // are GPU-composited and never trigger layout, where left/top can).
  // The overlay sits at top:0/left:0 absolute; x/y translate it into
  // place. The two-stage Y target lets the wheel slide to true centre
  // first, then drift down to meet the Pillars row during the box morph.
  //
  // Use documentElement.clientWidth/Height (the LAYOUT viewport size,
  // excluding the scrollbar) instead of window.inner{Width,Height}
  // (which INCLUDE the scrollbar). The Pillars container is positioned
  // via CSS `left: 50%`, which resolves against the layout viewport —
  // using innerWidth here was offsetting the wheel by half the
  // scrollbar width (~7-8 px) and causing the LoadingRing boxes to
  // drift right of the Pillars columns at scroll's end.
  // Avatar X — slides from logo position to viewport centre and STAYS
  // there for the duration of the line phase. The wheel never
  // translates; the individual dots fly out to their top-left slots
  // (LoadingRing handles the per-dot trajectories).
  const avatarX = useTransform<number, number>(
    [avatarMoveP, anchorX, avatarSize, vwMV] as unknown as MotionValue<number>[],
    (vals) => {
      const [p, ax, size, vw] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      return ax + (vw / 2 - ax) * p - size / 2;
    },
  );
  // Avatar Y — boxes target shifts down by WHEEL_Y_OFFSET, then the
  // reverse brings the wheel back to viewport centre. No translation
  // after that — the wheel stays put through the line phase.
  const avatarY = useTransform<number, number>(
    [
      avatarMoveP,
      anchorY,
      avatarSize,
      boxP,
      vhMV,
    ] as unknown as MotionValue<number>[],
    (vals) => {
      const [p, ay, size, bp, vh] = vals as unknown as [
        number,
        number,
        number,
        number,
        number,
      ];
      const targetY = vh / 2 + WHEEL_Y_OFFSET * bp;
      return ay + (targetY - ay) * p - size / 2;
    },
  );
  // During the exit-wheel + bg-slide phase the entire sticky-frame
  // interior translates up by 100vh (= bgSlideY in vh). The loading
  // wheel sits inside that wrapper, so without compensation it would
  // ride off the top of the screen with everything else. Adding
  // `vh * bgSlideP` pixels (positive = down) to the wheel's y exactly
  // cancels the wrapper's upward translate, keeping the reformed
  // wheel anchored at viewport centre while the rest of the section
  // slides up around it.
  const avatarYWithExit = useTransform<number, number>(
    [avatarY, bgSlideP, vhMV] as unknown as MotionValue<number>[],
    (vals) => {
      const [ay, bg, vh] = vals as unknown as [number, number, number];
      return ay + vh * bg;
    },
  );

  // Spread targets for LoadingRing — viewport-pixel positions of the
  // 6 testimonial anchors, indexed by LoadingRing's `linePos`.
  // Tracked via React state (NOT a useTransform-returned array)
  // because returning a fresh array reference from useTransform on
  // every render triggers an infinite update loop. Viewport dims
  // only actually change on window resize, so we listen for that
  // explicitly and recompute the stable array.
  const [viewportPx, setViewportPx] = useState(() => ({
    vw:
      typeof document !== "undefined"
        ? document.documentElement.clientWidth
        : 0,
    vh:
      typeof document !== "undefined"
        ? document.documentElement.clientHeight
        : 0,
  }));
  useEffect(() => {
    const update = () =>
      setViewportPx({
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const spreadTargetsArr = TESTIMONIALS.map((t) => ({
    x: (t.anchor.x / 100) * viewportPx.vw,
    y: (t.anchor.y / 100) * viewportPx.vh,
  }));

  return (
    <div
      ref={sectionRef}
      className="relative"
      style={{ height: `${TOTAL_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* All sticky-frame interior content used to translate up via
            `y: bgSlideY` during the bg-slide phase. We're keeping
            this wrapper as-is structurally but no longer translating
            it — the bg-black/light:bg-white panel inside stays put
            and acts as the unified background through both the how-
            it-works AND testimonials sections. Z-30 keeps it below
            TestimonialsLayer (bumped to z-40 below) so the cards +
            lines + title paint on top of the panel + LoadingRing. */}
        <motion.div className="absolute inset-0 z-30">
        <Hero
          logoRotation={logoRotation}
          logoOpacity={logoOpacity}
          logoSlotRef={logoSlotRef}
        />

        {/* Bottom panel — anchored to the bottom of the sticky frame.
            Resting state: inset from the sides with rounded top corners,
            just a sliver peeking up. As the user scrolls past REST_END,
            insets/radius retract to 0 and height grows to fill the view.
            Color is true black (dark) / true white (light) — not the
            bg-base brown — so it reads as a distinct surface against the
            org-tinted page background. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 z-30 overflow-hidden bg-black shadow-[0_-12px_32px_rgba(0,0,0,0.25)] light:bg-white light:shadow-[0_-12px_32px_rgba(0,0,0,0.08)]"
          style={{
            height: panelHeight,
            left: panelInset,
            right: panelInset,
            borderTopLeftRadius: panelRadius,
            borderTopRightRadius: panelRadius,
          }}
        >
          {/* Glow accents — disabled for now, leave wired so they're
              one uncomment away from coming back. Anchored inside the
              panel; clipped via the parent's overflow-hidden. */}
          {false && (
            <>
              <Glow
                color="#A8E635"
                size={900}
                blur={160}
                opacity={0.18}
                position={{ top: "-220px", left: "50%" }}
              />
              <Glow
                color="#5BC5FF"
                size={600}
                blur={140}
                opacity={0.14}
                position={{ bottom: "-120px", right: "8%" }}
              />
            </>
          )}
          {/* Grain — scoped to the panel. `screen` blend mode (not the
              default `overlay`) because the panel is pure black: overlay
              against a #000 base resolves to #000 for every pixel, so
              the noise is mathematically invisible. `screen` lets the
              bright noise pixels show through. Opacity bumped to ~0.22
              so the grain reads at the same density as the reference. */}
          <Grain
            position="absolute"
            zIndex={1}
            opacity={isDark ? 0.1 : 0.1}
            blendMode={isDark ? "screen" : "multiply"}
            isStatic
          />
        </motion.div>

        {/* LoadingRing has been lifted OUT of this bg-slide wrapper —
            see further down, after the footer panel. The wheel needs
            to paint ABOVE the footer panel (z-50) so the reformed
            wheel stays visible as the panel grows up; that's only
            possible if it's at z-60 in the sticky-frame's own
            stacking context, not trapped inside bg-slide's z-30
            stacking context. */}

        {/* Box-stage headline. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-[calc(50%+260px)] whitespace-nowrap text-center">
          <h2
            className="text-fg-base text-[2.75rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Make every session count."
              start={false}
              progress={boxP}
            />
          </h2>
        </div>

        {/* Scroll-progress indicator — two-layer thin bar centred ~32px
            below the bottom edge of the pillar cards row. Under layer:
            ~10% opacity rail; upper layer: opaque fill that grows from
            0 → 100% as the user scrolls the [PILLARS_END, 1] dwell. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-40"
          style={{
            opacity: indicatorOpacity,
            transform: "translate(-50%, calc(-50% + 300px))",
          }}
        >
          <div className="relative h-[2px] w-[120px]">
            <div className="bg-fg-base/15 absolute inset-0 rounded-full" />
            <motion.div
              className="bg-fg-base absolute left-0 top-0 h-full rounded-full"
              style={{ width: indicatorFillPct }}
            />
          </div>
        </motion.div>

        {/* Pillar content — fades in only after the boxes are fully
            formed. Renders its own box outlines at the same position as
            LoadingRing's morphed boxes; LoadingRing fades out as Pillars
            rises (loadingRingOpacity above). */}
        <Pillars
          progress={pillarsP}
          highlightP={pillarHighlightP}
          verticalOffset={WHEEL_Y_OFFSET}
        />

        {/* "How it works:" headline — fixed top-left, aligned with
            the Redprint nav logo's leading edge. Smaller + bold (not
            black). Types out the instant dot 0 reaches its slot. */}
        <div
          className="pointer-events-none absolute z-40 whitespace-nowrap text-left"
          style={{ left: DOT_LEFT_X - 8, top: 100 }}
        >
          <h2 className="text-fg-base font-body text-[14px] font-bold leading-tight tracking-tight uppercase">
            <TypewriterText
              text="How it works:"
              start={false}
              progress={howItWorksTypeP}
            />
          </h2>
        </div>

        {/* Per-dot dashed line + step label — fixed top-left
            positions, revealed when each dot finishes its journey.
            During the collapse phase, dots 1-5 slide to the viewport
            bottom; labels + connectors fade. step1ProgressP drives a
            solid overlay inside the 0→1 vertical connector during
            the post-description dwell. */}
        <HowItWorksSteps
          progress={stepsRevealP_menu}
          collapseP={collapseP}
          step1ProgressP={step1ProgressP_menu}
          step2ProgressP={step2ProgressP_menu}
          step3ProgressP={step3ProgressP_menu}
          step4ProgressP={step4ProgressP_menu}
          step5ProgressP={step5ProgressP_menu}
          step6ProgressP={step6ProgressP_menu}
          step2TransitionP={step2TransitionP}
          step3TransitionP={step3TransitionP}
          step4TransitionP={step4TransitionP}
          step5TransitionP={step5TransitionP}
          step6TransitionP={step6TransitionP}
          exitWheelP={exitWheelP}
        />

        {/* Step 1 visual: six floating Redprint org tags. Bouncy
            scale-in (driven by collapseP), cursor parallax, per-org
            glow. During the fade-out phase the surround tags collapse
            behind the centre tag, then all 7 disappear. */}
        <RedprintTags
          progress={collapseP}
          fadeOutP={step1FadeOutP}
          placeP={placeP}
          placeTarget={{ x: "73.8%", y: "51%" }}
          centreFadeOutP={step2TransitionP}
        />

        {/* Step 1 description — vertically centred at vh/2 ≈ 51%
            (matches the tag cluster's middle row). Same display font
            as the hero "Fitness AI…" headline. Disappears by reversing
            the typewriter (un-type) rather than fading opacity. */}
        <div
          className="pointer-events-none absolute z-40"
          style={{
            left: "60%",
            right: "4%",
            top: "51%",
            transform: "translateY(-50%)",
          }}
        >
          <h2
            className="text-fg-base text-[4.25rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Interactive Redprint tags are placed on gym equipment"
              start={false}
              progress={tagTextTypeP}
            />
          </h2>
        </div>

        {/* Step 1 lat-pulldown silhouette — appears as the surround
            tags + description vanish. Theme-aware fill via CSS mask:
            background = currentColor (= --color-fg-base), the PNG
            acts as the mask. Height = 50 vh. */}
        <LatPullImage
          progress={latPullP}
          scaleP={placeP}
          dimP={tapTypeP}
          fadeOutP={step2TransitionP}
        />

        {/* Tap-phase description — mirrors the previous description
            box but lives on the LEFT side, with right-aligned
            (trailing-edge) multiline text. The typewriter is in
            REVERSE mode: chars appear from the end of the string and
            grow leftward, so they accumulate toward the trailing edge
            instead of the leading edge. The box is shifted right and
            narrowed so the line wraps to 2+ lines. */}
        <div
          className="pointer-events-none absolute z-40"
          style={{
            left: "22%",
            right: "43%",
            top: "51%",
            transform: "translateY(-50%)",
            textAlign: "right",
          }}
        >
          <h2
            className="text-fg-base text-[4.25rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Tap your phone against a tag"
              start={false}
              progress={tapTextDisplayP}
            />
          </h2>
        </div>

        {/* Beacon ripple — fires concurrently with the phone's tap
            impact. Two concentric rings expanding out from the
            contact point and fading to 0, like an NFC scan ping.
            Rendered BEFORE the phone so it sits behind it. */}
        <TapBeacon tapP={phoneTapP} />

        {/* Tap-phase phone — slides up from below the viewport
            (riseP 0 → 1), arrives with its top edge at the tag's
            horizontal mid-line, then the tap impact (tapP 0 → 1)
            scales it down ~7% with the top edge as origin. */}
        {/* Step 5 title — "Your gym is a team now" — types out across
            the 100vh after the phone settles at its final right-side
            position. Centred horizontally above the phone trio. */}
        <div
          className="pointer-events-none absolute z-30"
          style={{
            top: "13vh",
            left: "57.5%",
            transform: "translateX(-50%)",
            width: "min(800px, 70vw)",
            textAlign: "center",
          }}
        >
          <h2
            className="text-fg-base text-center text-[2.75rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900, whiteSpace: "nowrap" }}
          >
            <TypewriterText
              text="Your gym is a team now"
              start={false}
              progress={useTransform(
                [compTitleP, step6TransitionP] as MotionValue<number>[],
                (vals) => {
                  const [c, t6] = vals as unknown as [number, number];
                  // Type IN during the compete-title window
                  // (compTitleP rising), then UN-TYPE during the
                  // gather (step6TransitionP rising) — chars peel
                  // off the trailing end as the two ghosts slide
                  // right to stack behind the front phone.
                  return c * (1 - t6);
                },
              )}
            />
          </h2>
        </div>

        {/* Step 5 view captions — one under each of the 3 phones,
            flicker-reveal in once the corresponding phone is on screen.
            Coordinates match the phone-trio x positions (37.5 / 57.5 /
            77.5). Fade out alongside the rest of the step-5 content via
            exitContentVisibleP, and un-flicker as the ghosts gather
            during step 6. */}
        <Step5Caption
          text="Monthly gym leaderboard"
          leftPct={37.5}
          revealP={compTitleP}
          step6P={step6TransitionP}
          exitP={exitContentVisibleP}
          window={[0.40, 0.70]}
        />
        <Step5Caption
          text="Form groups with friends"
          leftPct={57.5}
          revealP={compTitleP}
          step6P={step6TransitionP}
          exitP={exitContentVisibleP}
          window={[0.60, 0.90]}
        />
        <Step5Caption
          text="Earn rewards from your gym"
          leftPct={77.5}
          revealP={compTitleP}
          step6P={step6TransitionP}
          exitP={exitContentVisibleP}
          window={[0.50, 0.80]}
        />

        {/* "Watch yourself improve" — types out alongside the fan.
            Lives on the LEFT side of the viewport, vertically centred
            with the fan. Tracks fanP so the typing finishes exactly
            when the fan completes. Opacity multiplies in
            `exitContentVisibleP` so it fades out across exitWheelP
            [0.4, 0.75] alongside the phones. */}
        <motion.div
          className="pointer-events-none absolute z-30"
          style={{
            top: "40vh",
            left: "25vw",
            width: "min(280px, 24vw)",
            opacity: exitContentVisibleP,
          }}
        >
          <h2
            className="text-fg-base text-[2.5rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Watch yourself improve"
              start={false}
              progress={watchHeadlineP}
            />
          </h2>
        </motion.div>

        {/* Step 6 — visualize-progress fan layout. Five phones total:
            two back-fan (slot 2L/2R, ±24° / ±115px / scale ×0.8) sit
            behind two mid-fan (slot 1L/1R, ±12° / ±60px / scale ×0.9),
            both flanking the front phone (PhoneTap at 77.5%). The mid
            phones are the existing Ghost L / Ghost M — they gather
            from 37.5/57.5% to 77.5% during step6TransitionP, then fan
            outward during fanP. The back phones are NEW: fade in
            during fanP and lerp to their slot-2 positions.
            JSX order matters (later = on top). z-index 28 keeps slot
            2 behind slot 1 (z-30 default) which sits behind PhoneTap. */}

        {/* Slot L — gathers from 37.5% → 72.5% during step 6, fans
            left during fanP. Screen content CROSSFADES: CommunityView
            during compete → ExerciseHistoryAnalysisView during fan. */}
        <GhostPhone
          left={useTransform(
            step6TransitionP,
            (v) => `${37.5 + (72.5 - 37.5) * v}%`,
          )}
          top={phoneTop}
          opacity={useTransform(
            [step5TransitionP, exitContentVisibleP] as MotionValue<number>[],
            (vals) => {
              const [t5, ev] = vals as unknown as [number, number];
              return (t5 > 0 ? 1 : 0) * ev;
            },
          )}
          glowOpacity={useTransform(step5TransitionP, (v) =>
            Math.max(0, Math.min(1, v / 0.2)),
          )}
          fanX={useTransform(fanP, (v) => -180 * v)}
          fanRotate={useTransform(fanP, (v) => -16 * v)}
          fanScale={useTransform(fanP, (v) => 1 - 0.1 * v)}
        >
          <div className="relative h-full w-full">
            <motion.div
              className="absolute inset-0"
              style={{ opacity: useTransform(fanP, (v) => 1 - v) }}
            >
              <CommunityView org={PHONE_ORG} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{ opacity: fanP }}
            >
              <ExerciseHistoryAnalysisView org={PHONE_ORG} />
            </motion.div>
          </div>
        </GhostPhone>

        {/* Slot R — gathers 57.5% → 72.5%, fans right. Screen content
            CROSSFADES: GroupChallengeDetailView → WorkoutHistoryAnalysisView. */}
        <GhostPhone
          left={useTransform(
            step6TransitionP,
            (v) => `${57.5 + (72.5 - 57.5) * v}%`,
          )}
          top={phoneTop}
          opacity={useTransform(
            [step5TransitionP, exitContentVisibleP] as MotionValue<number>[],
            (vals) => {
              const [t5, ev] = vals as unknown as [number, number];
              return (t5 >= 0.49 ? 1 : 0) * ev;
            },
          )}
          glowOpacity={useTransform(step5TransitionP, (v) =>
            Math.max(0, Math.min(1, (v - 0.49) / 0.2)),
          )}
          fanX={useTransform(fanP, (v) => 180 * v)}
          fanRotate={useTransform(fanP, (v) => 16 * v)}
          fanScale={useTransform(fanP, (v) => 1 - 0.1 * v)}
        >
          <div className="relative h-full w-full">
            <motion.div
              className="absolute inset-0"
              style={{ opacity: useTransform(fanP, (v) => 1 - v) }}
            >
              <GroupChallengeDetailView org={PHONE_ORG} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{ opacity: fanP }}
            >
              <WorkoutHistoryAnalysisView org={PHONE_ORG} />
            </motion.div>
          </div>
        </GhostPhone>

        <PhoneTap
          riseP={phoneRiseP}
          tapP={phoneTapP}
          transitionP={step2TransitionP}
          transition3P={step3TransitionP}
          transition4P={step4TransitionP}
          transition5P={step5TransitionP}
          transition6P={step6TransitionP}
          motionGate={phoneMotionGate}
          fanP={fanP}
          chatP={chatP}
          opacity={exitContentVisibleP}
        />

        {/* Step 2 headline — types out across the last ~100 vh of the
            step 2 phone-move transition so it lands right before card
            1's reveal kicks off. Positioned above the cards' right
            column with the same width clamp + right offset. Fades out
            during the step 2→3 transition alongside the cards. */}
        <motion.div
          className="pointer-events-none absolute z-30"
          style={{
            top: "13vh",
            right: "10vw",
            width: "min(420px, 32vw)",
            opacity: useTransform(step3TransitionP, (v) => 1 - v),
          }}
        >
          <h2
            className="text-fg-base text-[2.5rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Tracking made easy"
              start={false}
              progress={headlineP}
            />
          </h2>
        </motion.div>

        {/* Step 2 content — three explanation cards on the right with
            dashed connector lines back to specific UI elements on the
            phone. Each card's line draws first, then the card flickers
            in. */}
        <TrackingCards
          cards={TRACKING_CARDS}
          progresses={[card1P, card2P, card3P]}
          topVh={[24, 46, 68]}
          side="right"
          cardAnchorPrefix="tracking"
          fadeOutP={step3TransitionP}
        />

        {/* Step 3 headline — types out alongside the first learning
            card's connector line draw. Positioned on the LEFT side
            (cards live on the left, phone is now on the right). Left
            offset is generous (25vw) so it clears the left-menu's
            labels. Fades out during the step 3→4 transition along
            with the learning cards. */}
        <motion.div
          className="pointer-events-none absolute z-30"
          style={{
            top: "13vh",
            left: "25vw",
            width: "min(420px, 32vw)",
            opacity: useTransform(step4TransitionP, (v) => 1 - v),
          }}
        >
          <h2
            className="text-fg-base text-[2.5rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Learn the gym as you use it"
              start={false}
              progress={learnHeadlineP}
            />
          </h2>
        </motion.div>

        {/* Step 3 content — two learning cards on the LEFT side of
            the viewport, with dashed orthogonal connector lines back
            to UI elements on the phone (now on the right). Fades out
            during the step 3→4 transition. */}
        <TrackingCards
          cards={LEARNING_CARDS}
          progresses={[learn1P, learn2P]}
          topVh={[32, 58]}
          side="left"
          sideOffsetVw={25}
          cardAnchorPrefix="learning"
          fadeOutP={step4TransitionP}
        />

        {/* Step 4 headline — types out alongside the equipment
            cluster's reveal. Positioned above the cluster on the
            right side of the viewport. Wider than the other section
            headlines so the longer copy lays out in 2 lines.
            Fades out during the step 4→5 transition alongside the
            cluster. */}
        <motion.div
          className="pointer-events-none absolute z-30"
          style={{
            top: "13vh",
            right: "8vw",
            width: "min(500px, 38vw)",
            opacity: useTransform(equipFadeOutFastP, (v) => 1 - v),
          }}
        >
          <h2
            className="text-fg-base text-[2.5rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText
              text="Build workouts based on your gym's equipment"
              start={false}
              progress={equipHeadlineP}
            />
          </h2>
        </motion.div>

        {/* Step 4 content — seven equipment isometrics scattered on
            the right half of the viewport, connected by dashed lines.
            Same animation pattern as RedprintTags (bouncy spring
            scale-in, ambient float, cursor parallax). Starts scaling
            in just as the phone finishes its slide left. Fades out
            during the step 4→5 transition. */}
        <EquipmentCluster progress={equipP} fadeOutP={equipFadeOutFastP} />
        </motion.div>
        {/* Testimonials overlay — sibling of the bg-slide wrapper so
            it stays anchored in the viewport while the how-it-works
            content slides up and out. The reformed loading wheel
            (above this in z order, counter-translated) continues to
            spin at the centre while the testimonial dots + cards
            spread out around it. */}
        <TestimonialsLayer
          sectionP={testSectionP}
          bgOpacityP={bgSlideP}
          dotSpreadP={testDotSpreadP}
          linesP={testLinesP}
          cardsP={testCardsP}
          titleP={testTitleP}
          indicatorOpacityP={testIndicatorOpacity}
          indicatorFillP={testIndicatorFillPct}
          footerFadeOutP={footerReturnP}
          formTextP={footerAutoP}
        />
        {/* Next-section reveal panel — grows from a bottom tab to
            full viewport after all six testimonial cards have
            appeared. Mirrors the opening rest→panel takeover but
            in red so it reads as a "different section coming" cue.
            Sits above the TestimonialsLayer (z-50) so it covers the
            cards + dots as it grows. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 z-50 overflow-hidden bg-[#3a0a0a] shadow-[0_-12px_32px_rgba(0,0,0,0.35)] light:bg-[#fecaca] light:shadow-[0_-12px_32px_rgba(127,29,29,0.18)]"
          style={{
            height: nextPanelHeight,
            left: nextPanelInset,
            right: nextPanelInset,
            borderTopLeftRadius: nextPanelRadius,
            borderTopRightRadius: nextPanelRadius,
            y: nextPanelSlideY,
          }}
        >
          {/* Paper texture — same /textures/paper.jpg overlay the
              Hero uses, theme-tuned via the --paper-opacity CSS var
              so the crinkle reads at the right density on either
              red surface. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[var(--paper-opacity)]"
            style={{
              backgroundImage: "url(/textures/paper.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </motion.div>
        {/* Bottom silhouettes — three crowd images bouncing up from
            the bottom of the viewport after the sentence finishes
            forming. z-[52] sits above the red panel (z-50) so the
            silhouettes layer ON TOP of it, and below the formed
            sentence's dot field (z-55) so the sentence reads clearly. */}
        {/* Floor strip — sits BEHIND silhouette_1 at z-[51] and
            extends UP behind its body so any upward excursion (bob
            + bounce-in overshoot) reveals MORE floor instead of a
            red-panel gap. Height scales with viewport width so it
            keeps the same proportion of silhouette_1 covered across
            screens. Color is theme-aware to match the SiteFooter's
            bg (white in light mode, near-black in dark mode) so the
            transition from sticky → footer reads as continuous. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[51] bg-black light:bg-white"
          style={{
            height: "15px",
            opacity: whiteFloorOpacityP,
          }}
        />
        <BottomSilhouettes formTextP={footerAutoP} />
        {/* Request-gym form — appears under the formed sentence as
            the user reaches the end of the section. z-[53] sits
            above the silhouettes (z-[52]) so it stays interactive
            and isn't visually crowded by the crowd in front of it. */}
        <RequestGymForm formTextP={footerAutoP} />
        {/* Loading-ring overlay — lifted OUT of the bg-slide wrapper
            so it can render at z-60 in the sticky-frame's own
            stacking context (above the footer panel at z-50). The
            wheel stays visible as the red panel grows up, until
            scroll = 1.0 ends the section. */}
        {measured && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-60"
            style={{
              opacity: loadingRingOpacityOld,
              x: avatarX,
              y: avatarY,
              width: avatarSize,
              height: avatarSize,
              left: 0,
              top: 0,
              willChange: "transform",
            }}
          >
            {/* Wheel layer — fades OUT during the footer crossfade
                as the static emblem takes over at the same
                position + rotation. */}
            <motion.div
              className="absolute inset-0"
              style={{ opacity: wheelVisibilityP }}
            >
              <LoadingRing
                size={avatarSize}
                ringRot={ringRotFinal}
                ringRadiusFrac={AVATAR_RING_FRAC}
                dotRadiusFrac={AVATAR_DOT_FRAC}
                centerOffsetXFrac={AVATAR_OFFSET_X}
                centerOffsetYFrac={AVATAR_OFFSET_Y}
                mergeP={mergeP}
                boxP={boxP}
                lineP={lineP_menu}
                lineTargetLeftX={DOT_LEFT_X}
                lineTargetTopY={DOT_TOP_Y}
                collapseP={collapseP}
                step2TransitionP={step2TransitionP}
                step3TransitionP={step3TransitionP}
                step4TransitionP={step4TransitionP}
                step5TransitionP={step5TransitionP}
                step6TransitionP={step6TransitionP}
                spreadTargets={spreadTargetsArr}
                spreadP={effectiveSpreadP}
              />
            </motion.div>
          </motion.div>
        )}
        {/* Centred logo+text group — the WHEEL is stacked INSIDE
            the same flex container (as the first flex child), so
            the wheel + logo + text share the same parent and
            therefore the same y position. Horizontally, the
            container's translateX is driven directly by logoFadeP
            (a continuous value) via `footerGroupX`, NOT by the
            flex's auto-centering off the text width — that path
            shifted in discrete steps every time a character
            appeared, which the wheel/logo inherited as a choppy
            jump. Now the wheel + logo glide smoothly leftward as
            the text fills in; the text's left edge moves in
            lockstep too because it's inside the same parent. */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-60"
          style={{ x: footerGroupX, y: footerGroupY }}
        >
          <div className="flex items-center gap-4">
            {/* Stacked wheel + logo box — 64×64, occupies the first
                flex slot. Wheel and logo are absolute children that
                overlay each other; their crossfade opacities mean
                only one is visible at a time, but they SHARE this
                parent so they're guaranteed pixel-aligned. */}
            <div className="relative h-16 w-16">
              {measured && (
                <motion.div
                  className="absolute inset-0"
                  style={{ opacity: loadingRingOpacityFooter }}
                >
                  <LoadingRing
                    size={avatarSize}
                    ringRot={ringRotFinal}
                    ringRadiusFrac={AVATAR_RING_FRAC}
                    dotRadiusFrac={AVATAR_DOT_FRAC}
                    centerOffsetXFrac={AVATAR_OFFSET_X}
                    centerOffsetYFrac={AVATAR_OFFSET_Y}
                    spreadTargets={spreadTargetsArr}
                    spreadP={effectiveSpreadP}
                  />
                </motion.div>
              )}
              <motion.div
                className="absolute inset-0"
                style={{ opacity: logoFadeP, rotate: ringRotDeg }}
              >
                <RedprintMark className="h-full w-full" />
              </motion.div>
            </div>
            {/* Visible chars only — no hidden tail span — so the
                flex container's width actually grows as logoFadeP
                rises, and the centred group's translate(-50%)
                naturally shifts the (wheel + logo + text) block
                leftward. Rendered conditionally on char count so the
                gap-4 doesn't show up next to the wheel when there's
                no text yet. */}
            {footerLogoCharsShown > 0 && (
              <h2
                className="text-fg-base whitespace-nowrap text-[2.75rem] font-black leading-none tracking-tight"
                style={{ fontWeight: 900 }}
              >
                {FOOTER_LOGO_TEXT.slice(0, footerLogoCharsShown)}
              </h2>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
 * Step 1 fade-out + lat-pulldown helpers
 * --------------------------------------------------------------------*/

/**
 * Lat-pulldown silhouette. Occupies the same box the description text
 * lived in (right of the tags, vertically centred on the tag cluster).
 * Rendered as a CSS-masked surface that fills with `currentColor`
 * (= --color-fg-base) → white in dark mode, near-black in light mode.
 * Height = 50vh, contained within the text-area box. Opacity is a
 * MotionValue driven directly by Framer so the fade-in is smooth.
 */
function LatPullImage({
  progress,
  scaleP,
  dimP,
  fadeOutP,
}: {
  progress: MotionValue<number>;
  /** 0 → 1: drives the 1× → 5× "zoom into the equipment" scale-up. */
  scaleP: MotionValue<number>;
  /** 0 → 1: dims the image down to 25% opacity. Used during the tap
   *  phase so the equipment recedes while the phone takes focus. */
  dimP?: MotionValue<number>;
  /** 0 → 1: hard fade-out on top of `dimP` — used during the step 2
   *  transition to take the equipment off the stage entirely. */
  fadeOutP?: MotionValue<number>;
}) {
  // 1× → 16× — origin defaults to the element's centre, so the image
  // grows out of its visual centre at (≈74% vw, 51% vh). At max
  // scale the cable bars on either side of the seat are spaced wide
  // enough that the centre tag reads as fitting BETWEEN them rather
  // than spanning across.
  const scale = useTransform(scaleP, (v) => 1 + v * 11);
  // Combined opacity: fade-in (progress) × dim factor (1 - dimP × 0.75).
  // At dimP = 0, opacity = progress (full). At dimP = 1, opacity = 0.25
  // × progress — the equipment recedes to background as the tap text
  // types in and the phone takes focus.
  const zeroDim = useMotionValue(0);
  const zeroFadeOut = useMotionValue(0);
  const dimSrc = dimP ?? zeroDim;
  const fadeOutSrc = fadeOutP ?? zeroFadeOut;
  const opacity = useTransform(
    [progress, dimSrc, fadeOutSrc] as MotionValue<number>[],
    (vals) => {
      const [p, d, f] = vals as unknown as [number, number, number];
      return p * (1 - d * 0.75) * (1 - f);
    },
  );
  return (
    <motion.div
      aria-hidden
      className="text-fg-base pointer-events-none absolute z-30"
      style={{
        left: "56%",
        right: "8%",
        top: "51%",
        y: "-50%",
        height: "80vh",
        opacity,
        scale,
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/exercises/lat_pulldown_elevation_large.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: "url(/exercises/lat_pulldown_elevation_large.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}

/**
 * Phone line-drawing rising from the bottom of the viewport, arriving
 * with its top edge aligned to the tag's horizontal mid-line (51% vh),
 * then "tapping" against the tag by scaling down ~7% with the top
 * edge as the scale origin so the contact point doesn't move.
 *
 * Horizontally aligned with the tag's placed centre (x = 73.8% vw).
 * In dark mode the PNG (authored for light backgrounds) is inverted
 * via a CSS filter so it reads correctly.
 */
// Phone width (px) — fixed; doesn't track viewport so the phone holds
// the same general size as the screen resizes.
const PHONE_WIDTH = 280;
// Org used to colour HomeWorkoutView. Static for the scroll sequence
// (the Hero carousel cycles orgs, but once the user scrolls past the
// opening this stays put for visual stability).
const PHONE_ORG = orgs[0];

/**
 * Static "copy" of the phone — used to leave a trail of stationary
 * AIChatbotView frames behind the moving phone during the step 4→5
 * transition. Matches the moving phone's transform exactly at its
 * final-state values (translateX -50%, translateY -41.85% to keep the
 * SCALED phone's visual centre on y=50%, scale 0.837). The default
 * AIChatbotView progress (1) renders the chat fully revealed.
 */
function GhostPhone({
  left,
  top,
  opacity,
  glowOpacity,
  fanX,
  fanRotate,
  fanScale,
  zIndex = 30,
  children,
}: {
  /** Horizontal position. Accepts a MotionValue<string> so it can
   *  animate (e.g. lerp from 37.5% → 77.5% during the step 6 gather). */
  left: MotionValue<string> | string;
  /** Vertical position. Animated during step 5 so all 3 phones drop
   *  together. */
  top: MotionValue<string>;
  /** Body opacity — the phone itself pops in instantly. */
  opacity: MotionValue<number>;
  /** Glow opacity — fades in independently after the body pops. */
  glowOpacity: MotionValue<number>;
  /** Optional inner-transform fan offset (px). Applied in the inner
   *  wrapper which composes with the outer scale-0.837, so a value
   *  of 60 here translates to ~50px visible. Default 0. */
  fanX?: MotionValue<number>;
  /** Optional inner rotation (deg) — pivots around the phone's
   *  visual centre. Default 0. */
  fanRotate?: MotionValue<number>;
  /** Optional inner scale multiplier. Default 1 — applied ON TOP of
   *  the outer 0.837 phone-size scale, so 0.9 → final visual 0.7533. */
  fanScale?: MotionValue<number>;
  /** Optional z-index override so back-fan phones can sit behind
   *  mid-fan phones. Default 30 (matches PhoneTap). */
  zIndex?: number;
  /** The phone screen content to render inside the PhoneFrame. */
  children: React.ReactNode;
}) {
  // Phone shell height (used to size the glow layer + inner wrapper).
  // PHONE_WIDTH is the canonical 260-px design width; aspect is 19.5/9.
  const PHONE_HEIGHT = (PHONE_WIDTH * 19.5) / 9;
  const isDark = useTheme() === "dark";
  // Theme-matched glow — values EXACTLY mirror PhoneFrame's native
  // box-shadow so the ghost halos blend in identically with the
  // moving phone's natural glow once they've faded in.
  const glowShadow = isDark
    ? "0 0 100px -15px rgba(255, 255, 255, 0.14)"
    : "0 25px 60px -20px rgba(0, 0, 0, 0.6)";

  // Default MVs so the inner transform stays at identity when the
  // caller doesn't pass fan controls.
  const zeroMV = useMotionValue(0);
  const oneMV = useMotionValue(1);
  const fanXSrc = fanX ?? zeroMV;
  const fanRotateSrc = fanRotate ?? zeroMV;
  const fanScaleSrc = fanScale ?? oneMV;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        transform: "translateX(-50%) translateY(-41.85%) scale(0.837)",
        transformOrigin: "50% 0%",
        width: PHONE_WIDTH,
        opacity,
        zIndex,
      }}
    >
      {/* Inner wrapper carries the FAN transform (offset / rotate /
          scale) around the phone's centre. Composes with the outer
          0.837 scale, so a fanScale of 0.9 lands the visible phone at
          ~0.7533 of its design size — matches the Hero deck-fan slot 1. */}
      <motion.div
        style={{
          position: "relative",
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          x: fanXSrc,
          rotate: fanRotateSrc,
          scale: fanScaleSrc,
        }}
      >
        <motion.div
          aria-hidden
          className="absolute left-0 top-0"
          style={{
            width: PHONE_WIDTH,
            height: PHONE_HEIGHT,
            borderRadius: 44,
            boxShadow: glowShadow,
            opacity: glowOpacity,
          }}
        />
        <PhoneFrame width={PHONE_WIDTH} shadowless>
          {children}
        </PhoneFrame>
      </motion.div>
    </motion.div>
  );
}

function PhoneTap({
  riseP,
  tapP,
  transitionP,
  transition3P,
  transition4P,
  transition5P,
  transition6P,
  motionGate,
  fanP,
  chatP,
  opacity,
}: {
  /** 0 → 1: phone slides from below the viewport up to its anchor. */
  riseP: MotionValue<number>;
  /** 0 → 1: phone scales 1 → 0.93 for the tap impact. */
  tapP: MotionValue<number>;
  /** 0 → 1: step 2 transition — phone repositions from the tag's
   *  x = 73.8% / top = 51% (top-aligned) to x = 40% / vertically
   *  centred at 50%. Same scale, no fade. */
  transitionP?: MotionValue<number>;
  /** 0 → 1: step 3 transition — phone slides from its step-2 resting
   *  position (40%, 50%) to (~74%, 50%) — where the three tracking
   *  cards just were. Scale unchanged. */
  transition3P?: MotionValue<number>;
  /** 0 → 1: step 4 transition — drives the third screen crossfade
   *  (ExerciseRedprintView → AIChatbotView). Phone position stays put
   *  on the right; the screen swap does the visual work. */
  transition4P?: MotionValue<number>;
  /** 0 → 1: step 5 transition — phone slides from (37.5%, 50%) to
   *  (85%, 50%), leaving two ghost copies behind at 37.5% and 61.25%. */
  transition5P?: MotionValue<number>;
  /** 0 → 1: step 6 transition — drives the 10% rise (60% → 50% top)
   *  so the front phone moves UP with the two ghosts during the
   *  gather phase. Doesn't affect the front phone's left position
   *  (the ghosts come to it, not the other way around). */
  transition6P?: MotionValue<number>;
  /** 0 → 1: shared motion gate. Gates ambient float + cursor
   *  parallax + Z-tilt. Lifted to ScrollSequence so all three phones
   *  (PhoneTap + both GhostPhones) share one consistent gate. */
  motionGate?: MotionValue<number>;
  /** 0 → 1: fan progress — drives the crossfade from
   *  TierAchievementCongratulationsView → FinishedWorkoutSummaryView
   *  on the front phone, in lockstep with the slot 1/2 phones fanning
   *  outward. */
  fanP?: MotionValue<number>;
  /** 0 → 1: chat typewriter — drives the per-message reveal inside
   *  AIChatbotView once that screen is fully visible. */
  chatP?: MotionValue<number>;
  /** Optional body opacity. Used to fade the front phone out during
   *  the exit-wheel phase. Defaults to 1 (fully visible). */
  opacity?: MotionValue<number>;
}) {
  const zeroT = useMotionValue(0);
  const oneT = useMotionValue(1);
  const tSrc = transitionP ?? zeroT;
  const t3Src = transition3P ?? zeroT;
  const t4Src = transition4P ?? zeroT;
  const t5Src = transition5P ?? zeroT;
  const t6Src = transition6P ?? zeroT;
  const motionGateSrc = motionGate ?? oneT;
  const fanSrc = fanP ?? zeroT;

  // Positional lerps. `left` chains five segments:
  //   step 2 (t2): 73.8% → 40%
  //   step 3 (t3): 40%   → 74%   (centre of right-side cards)
  //   step 4 (t4): 74%   → 37.5% (slightly further left)
  //   step 5 (t5): 37.5% → 77.5% (slide right, leaving ghosts behind)
  //   step 6 (t6): 77.5% → 72.5% (shift LEFT 5% during gather so the
  //                                fan group ends up better centred
  //                                in the viewport)
  const left = useTransform(
    [tSrc, t3Src, t4Src, t5Src, t6Src] as MotionValue<number>[],
    (vals) => {
      const [t2, t3, t4, t5, t6] = vals as unknown as [
        number,
        number,
        number,
        number,
        number,
      ];
      const afterStep2 = 73.8 - (73.8 - 40) * t2;
      const afterStep3 = afterStep2 + (74 - 40) * t3;
      const afterStep4 = afterStep3 + (37.5 - 74) * t4;
      const afterStep5 = afterStep4 + (77.5 - 37.5) * t5;
      return `${afterStep5 - 5 * t6}%`;
    },
  );
  // `top` chains:
  //   step 2 (t2): 51% → 50% (vertical settle)
  //   step 5 (t5): 50% → 60% (drop with the slide)
  //   step 6 (t6): 60% → 50% (rise back up alongside the ghosts as
  //                            they gather behind this phone)
  // Matches the ghosts' shared `phoneTop` MV exactly (minus the
  // step-2 settle term, which only the moving phone has).
  const top = useTransform(
    [tSrc, t5Src, t6Src] as MotionValue<number>[],
    (vals) => {
      const [t2, t5, t6] = vals as unknown as [number, number, number];
      return `${51 - t2 + 7 * t5 - 7 * t6}%`;
    },
  );

  // Composite transform: rise (vh) + transition vertical centring
  // (% of own height) + tap impact scale. Right-to-left order means
  // scale applies first (around top-centre origin), then translates.
  const transform = useTransform(
    [riseP, tSrc, tapP] as MotionValue<number>[],
    (vals) => {
      const [r, t, tp] = vals as unknown as [number, number, number];
      const riseVh = 100 - 100 * r;
      // Scale: tap impact (1 → 0.93) compounded with transition
      // shrink (×1 → ×0.9), giving 0.93 → 0.837 over the transition.
      const s = (1 - 0.07 * tp) * (1 - 0.1 * t);
      // Vertical centring: transform-origin is "50% 0%" so the scale
      // anchors the SCALED phone at the layout-box top, not its centre.
      // To put the VISIBLE phone's centre at the anchor, the translateY
      // (in % of the unscaled layout height) must be halved by `s` —
      // otherwise we pull the layout box up by half its unscaled height
      // and the smaller visual phone ends up well above viewport centre.
      const centreYPct = -50 * t * s;
      return `translateX(-50%) translateY(${riseVh}vh) translateY(${centreYPct}%) scale(${s})`;
    },
  );

  // --- Ambient floating + cursor parallax (applied INSIDE the outer
  // composite transform, so they don't fight with the rise/scale math).
  // Both effects are gated by `tSrc` — they ramp up as the phone enters
  // its new step-2 position and are completely invisible during the
  // rise/tap phases.
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

  // Slow sine waves for the ambient float (same shape as RedprintTags).
  const time = useTime();
  const FLOAT_AMP = 8; // px
  // Motion gate is now lifted to ScrollSequence and passed in so all
  // three phones share the same on/off curve through the step 5 slide
  // and the "Your gym is a team now" title type-out. Composed here as
  // `motionGateSrc × tSrc` so the moving phone ALSO requires step 2
  // to have settled before its parallax kicks in (matches the
  // original gate behavior).
  const ambientX = useTransform(
    [time, tSrc, motionGateSrc] as MotionValue<number>[],
    (vals) => {
      const [t, g, m5] = vals as unknown as [number, number, number];
      return Math.sin(t * 0.00055) * FLOAT_AMP * g * m5;
    },
  );
  const ambientY = useTransform(
    [time, tSrc, motionGateSrc] as MotionValue<number>[],
    (vals) => {
      const [t, g, m5] = vals as unknown as [number, number, number];
      return Math.cos(t * 0.00065) * FLOAT_AMP * g * m5;
    },
  );

  // Cursor parallax + small Z-tilt — gated by tSrc AND motionGateSrc.
  const PARALLAX = 14;
  const xTarget = useTransform(
    [mouseX, ambientX, tSrc, motionGateSrc] as MotionValue<number>[],
    (vals) => {
      const [m, a, g, m5] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      return m * PARALLAX * 2 * g * m5 + a;
    },
  );
  const yTarget = useTransform(
    [mouseY, ambientY, tSrc, motionGateSrc] as MotionValue<number>[],
    (vals) => {
      const [m, a, g, m5] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      return m * PARALLAX * 2 * g * m5 + a;
    },
  );
  const x = useSpring(xTarget, { stiffness: 70, damping: 18, mass: 1 });
  const y = useSpring(yTarget, { stiffness: 70, damping: 18, mass: 1 });
  const rotateTarget = useTransform(
    [mouseX, mouseY, tSrc, motionGateSrc] as MotionValue<number>[],
    (vals) => {
      const [mx, my, g, m5] = vals as unknown as [
        number,
        number,
        number,
        number,
      ];
      return (mx * 0.9 + my * 0.4) * 4 * g * m5;
    },
  );
  const rotate = useSpring(rotateTarget, {
    stiffness: 70,
    damping: 18,
    mass: 1,
  });

  const opacitySrc = opacity ?? oneT;
  return (
    <motion.div
      aria-hidden
      data-tracking-host="phone"
      className="pointer-events-none absolute z-30"
      style={{
        left,
        top,
        transform,
        transformOrigin: "50% 0%",
        width: PHONE_WIDTH,
        opacity: opacitySrc,
      }}
    >
      <motion.div style={{ x, y, rotate }}>
        <PhoneFrame width={PHONE_WIDTH}>
          {/* Two stacked screens crossfade as the section advances:
              - HomeWorkoutView lights up during the step 2 phone-move
                (driven by tSrc = step2TransitionP) and then fades back
                out as the step 2→3 transition rises.
              - ExerciseRedprintView fades in during the step 2→3
                transition (driven by t3Src = step3TransitionP), so it
                fully takes over by the time ON-DEMAND LEARNING has
                reached the top of the menu.
              The wrapping div carries its OWN overflow-hidden + rounded
              clip so the inner views are clipped to the phone's screen
              radius even when their composited opacity layers escape the
              PhoneFrame's outer clip (known border-radius + composited
              child rendering bug). */}
          <div className="relative h-full w-full overflow-hidden rounded-[40px]">
            {/* Three stacked screens crossfade as each section advances:
                - HomeWorkoutView    visible during step 2 (tracking)
                - ExerciseRedprintView  visible during step 3 (learning)
                - AIChatbotView      visible during step 4 (gym-AI)
                Each fades out as the next rises, gated by the
                appropriate step transition MV. */}
            <motion.div
              className="absolute inset-0"
              style={{
                opacity: useTransform(
                  [tSrc, t3Src] as MotionValue<number>[],
                  (vals) => {
                    const [t2, t3] = vals as unknown as [number, number];
                    return t2 * (1 - t3);
                  },
                ),
              }}
            >
              <HomeWorkoutView org={PHONE_ORG} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{
                opacity: useTransform(
                  [t3Src, t4Src] as MotionValue<number>[],
                  (vals) => {
                    const [t3, t4] = vals as unknown as [number, number];
                    return t3 * (1 - t4);
                  },
                ),
              }}
            >
              <ExerciseRedprintView org={PHONE_ORG} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{
                opacity: useTransform(
                  [t4Src, t5Src] as MotionValue<number>[],
                  (vals) => {
                    const [t4, t5] = vals as unknown as [number, number];
                    return t4 * (1 - t5);
                  },
                ),
              }}
            >
              <AIChatbotView org={PHONE_ORG} progress={chatP} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{
                opacity: useTransform(
                  [t5Src, fanSrc] as MotionValue<number>[],
                  (vals) => {
                    const [t5, f] = vals as unknown as [number, number];
                    return t5 * (1 - f);
                  },
                ),
              }}
            >
              <TierAchievementCongratulationsView org={PHONE_ORG} />
            </motion.div>
            <motion.div
              className="absolute inset-0"
              style={{ opacity: fanSrc }}
            >
              <FinishedWorkoutSummaryView org={PHONE_ORG} />
            </motion.div>
          </div>
        </PhoneFrame>
      </motion.div>
    </motion.div>
  );
}

/**
 * NFC-style tap beacon — two concentric rings expanding out from the
 * contact point (tag centre) and fading to 0. Both rings are driven
 * by `tapP` (the phone's impact phase 0 → 1); the inner ring leads,
 * the outer ring trails, giving a layered "ping" feel.
 *
 * Anchored at the tag's centre (left: 73.8%, top: 51%) and rendered
 * in `currentColor` so it stays visible in both themes.
 */
function TapBeacon({ tapP }: { tapP: MotionValue<number> }) {
  // Lead ring: starts immediately, expands and fades over the full
  // window. Trail ring: starts at 30% into the window, same end.
  const leadScale = useTransform(tapP, [0, 1], [0.4, 3]);
  const leadOpacity = useTransform(tapP, [0, 0.1, 1], [0, 0.8, 0]);
  const trailScale = useTransform(tapP, [0.3, 1], [0.4, 2.2]);
  const trailOpacity = useTransform(tapP, [0.3, 0.4, 1], [0, 0.6, 0]);
  return (
    <>
      <motion.div
        aria-hidden
        className="text-fg-base pointer-events-none absolute z-30"
        style={{
          left: "73.8%",
          top: "51%",
          x: "-50%",
          y: "-50%",
          width: 180,
          height: 180,
          borderRadius: "9999px",
          border: "2px solid currentColor",
          scale: leadScale,
          opacity: leadOpacity,
        }}
      />
      <motion.div
        aria-hidden
        className="text-fg-base pointer-events-none absolute z-30"
        style={{
          left: "73.8%",
          top: "51%",
          x: "-50%",
          y: "-50%",
          width: 180,
          height: 180,
          borderRadius: "9999px",
          border: "2px solid currentColor",
          scale: trailScale,
          opacity: trailOpacity,
        }}
      />
    </>
  );
}

/* ============================================================
   Step 5 caption — small label below each phone in the compete
   trio. Flicker-reveals scroll-tied during step 5, un-flickers
   during step 6 so it doesn't linger over the fan layout.
   ============================================================ */

function step5Flicker(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 0.2) return 0.4;
  if (t < 0.35) return 0.1;
  if (t < 0.55) return 0.7;
  if (t < 0.7) return 0.3;
  const r = (t - 0.7) / 0.3;
  return 0.3 + r * 0.7;
}

function Step5Caption({
  text,
  leftPct,
  revealP,
  step6P,
  exitP,
  window,
}: {
  text: string;
  leftPct: number;
  /** Drives the flicker reveal — typically `compTitleP` so captions
   *  appear AFTER the phones are settled and as the title types out. */
  revealP: MotionValue<number>;
  step6P: MotionValue<number>;
  exitP: MotionValue<number>;
  /** [start, end] sub-window on revealP inside which the flicker plays. */
  window: [number, number];
}) {
  const [rev, setRev] = useState(0);
  const [s6, setS6] = useState(0);
  const [exit, setExit] = useState(1);
  useEffect(() => revealP.on("change", setRev), [revealP]);
  useEffect(() => step6P.on("change", setS6), [step6P]);
  useEffect(() => exitP.on("change", setExit), [exitP]);

  const [a, b] = window;
  const local = Math.max(0, Math.min(1, (rev - a) / (b - a)));
  // Reveal opacity (0 → 1) during the reveal window, then un-flicker
  // BACK to 0 during the first 40% of step 6 so the captions disappear
  // before the fan layout takes over.
  const reveal = step5Flicker(local);
  const hideP = Math.max(0, Math.min(1, s6 / 0.4));
  const opacity = reveal * (1 - hideP) * exit;

  return (
    <div
      aria-hidden={opacity < 0.05}
      className="text-fg-base font-body pointer-events-none absolute z-30 text-center"
      style={{
        top: "92vh",
        left: `${leftPct}%`,
        transform: "translateX(-50%)",
        width: "min(220px, 18vw)",
        opacity,
        fontSize: 14,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      {text}
    </div>
  );
}
