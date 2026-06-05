/**
 * Named scroll destinations the user can deep-link to from the top nav
 * (or from cross-page navigation via URL hash). Each value is the
 * ABSOLUTE vh position from the top of the home page where the section
 * begins.
 *
 * IMPORTANT: when ScrollSequence's timing constants change, the values
 * here may drift out of sync. Update by reading the relevant constant
 * out of `components/sections/ScrollSequence.tsx`:
 *
 *   howItWorks (moment 13 — top-left "HOW IT WORKS" menu fully formed,
 *               tags start scaling in) =
 *     LINE_END (step1Progress)
 *       × STEP1_LIMIT × (TOTAL_VH − 100)
 */
export const SCROLL_TARGETS = {
  howItWorks: 1360,
  // Testimonials cards visible + dwell. Lands the user roughly midway
  // between cards-flicker-reveal completion (TEST_CARDS_END ≈ 4473 vh)
  // and the progress bar finishing (PROGRESS_BAR_END ≈ 4617 vh), so
  // all six cards are on screen and readable.
  testimonials: 4500,
} as const;

/**
 * Absolute vh position for the START of each of the six HOW IT WORKS
 * steps. Used by the menu labels in `HowItWorksSteps` (each label is a
 * button that scrolls to its step). The order matches the LABELS array
 * in `HowItWorksSteps.tsx`.
 *
 * Derivations (current constants: STEP1_LIMIT=0.3316, scrollable=5169,
 * step1_total=1714 vh):
 *   STEP[0] INTERACT WITH REDPRINT TAGS  — COLLAPSE_END × step1_total
 *   STEP[1] TAP-TO-TRACK                 — STEP2_TRANSITION_END × scrollable
 *   STEP[2] ON-DEMAND LEARNING           — STEP3_TRANSITION_END × scrollable
 *   STEP[3] GYM-SPECIFIC AI              — STEP4_TRANSITION_END × scrollable
 *   STEP[4] COMPETE/COMMUNITY            — STEP5_TRANSITION_END × scrollable
 *   STEP[5] VISUALIZE PROGRESS           — STEP6_TRANSITION_END × scrollable
 */
export const STEP_TARGETS: readonly number[] = [
  1473,
  2030,
  2466,
  2836,
  3241,
  3625,
];

/**
 * Map of URL hash → vh target. Used by the HashScrollTarget client
 * component on the home page so links like `/#hiw` from other routes
 * deep-link straight to the matching moment.
 */
export const HASH_TARGETS: Record<string, number> = {
  "#hiw": SCROLL_TARGETS.howItWorks,
  "#testimonials": SCROLL_TARGETS.testimonials,
};
