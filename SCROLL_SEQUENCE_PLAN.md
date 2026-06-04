# Redprint Marketing Site — Scroll Sequence Plan

Last updated: 2026-05-29 (added Step 2 tracking cards + connector lines, dot-2 activation, phone shows HomeWorkoutView with floating/cursor parallax, viewport-resize fixes)

This document is the single source of truth for the scroll-driven landing-page sequence. Read this first to pick up where the last session left off.

---

## 1. TL;DR

The Redprint marketing site is a single Next.js page with one giant scroll-driven sequence. The user scrolls through `TOTAL_VH = 5525` vh of fake page height (so `≈ 5425` vh of actual scroll, since the sticky frame is 100vh). All animations are driven by `useScroll().scrollYProgress` and per-phase `useTransform()` MotionValues. There are **no time-based animations** in the sequence — everything is scroll-tied so the user can scrub forward and back.

What ships today:
- Hero opening (rotating wheel, panel takeover, "Fitness AI…" headline)
- Pillars stage (three boxes morphed from the wheel)
- "How it works" left-side menu forms by flying 6 dots from the wheel to a column at top-left
- Dots 1–5 collapse to a bottom stack while dot 0 stays at the top
- Step 1 ("INTERACT WITH REDPRINT TAGS"): 7 tags scale in, description types in, surround tags slide behind centre tag, lat-pulldown equipment image fades in + zooms to 16×, phone slides up + taps, beacon ripples
- Step 1 → Step 2 transition: text un-types (25vh), equipment + centre tag fade out, dot 1 ramps from 50% → 100% and slides up under dot 0, phone repositions to (40% vw, vertically centred) and shrinks 10%
- Phone is now a real `<PhoneFrame><HomeWorkoutView /></PhoneFrame>` instance (Marist org), fixed 280px wide, with ambient sine float + cursor parallax + small Z-tilt all gated by `transitionP`. The HomeWorkoutView screen content is wrapped in a `motion.div` with `opacity: transitionP` so the screen stays "off" during the tap (only the PhoneFrame's bg + status bar + dynamic island show) and lights up as the phone moves to its centred position
- **Step 2 ("TAP-TO-TRACK")**: three `<InfoCard>`s (01 SPEED, 02 MEMORY, 03 DEPTH) stacked on the right. Each card has its own 0→1 sub-phase: dashed line draws from a phone UI anchor (`data-tracking-anchor` element) to the card's left edge, then the card flickers in (same `flicker` curve as left-menu labels). Phone-end of each line is re-measured every frame via `getBoundingClientRect()`, so it tracks the phone through cursor parallax / float / scroll. Dot 2 activates on the first card sub-phase (`step3TransitionP = card1P`).

What does NOT ship yet:
- The remaining steps (ON-DEMAND LEARNING, GYM-SPECIFIC AI, COMPETE/COMMUNITY, VISUALIZE PROGRESS) need both content and inter-step transitions.

---

## 2. Tech stack

- **Next.js 15** App Router, React 19
- **Tailwind v4** with custom `@custom-variant light` (theme switched by `data-theme` attribute on `<html>`)
- **Framer Motion 12** — `useScroll`, `useTransform`, `useSpring`, `useMotionValue`, `useTime`, `motion.div`
- **Lenis** smooth scroll wired through `LenisProvider` (with a `ResizeObserver` on `document.body` to call `lenis.resize()` whenever page height changes — this fixed a stale `maxScroll` cache that was breaking the end of the section)
- **GSAP** ticker just for advancing Lenis frames
- Fonts: Outfit (display) and Inter (body), loaded via `next/font`

Dev: `pnpm dev` (server at http://localhost:3000)
Type-check / build: `pnpm build`

---

## 3. File map

Anything under `components/` is what touches the scroll sequence.

| File | Purpose |
|---|---|
| `app/page.tsx` | Renders `<ScrollSequence />` only |
| `components/sections/ScrollSequence.tsx` | **The orchestrator.** Owns `scrollYProgress`, every phase constant, every MotionValue, and every render. ~990 lines |
| `components/sections/Hero.tsx` | Initial logo + headline scene |
| `components/LoadingRing.tsx` | The 6-dot wheel — spin, 6→3 merge, 3 boxes, reverse, line formation, collapse, post-collapse dot opacity |
| `components/sections/Pillars.tsx` | The 3-pillar info cards rendered into the boxes |
| `components/sections/HowItWorksSteps.tsx` | The left-side menu — labels, dashed connectors, vertical connectors, solid progress overlay |
| `components/sections/RedprintTags.tsx` | The 7 Redprint hex tags (6 orgs + generic centre) |
| `components/animations/TypewriterText.tsx` | Char-by-char reveal tied to a 0→1 progress MV (or a time-based start). Supports `reverse` prop |
| `components/effects/Grain.tsx`, `Glow.tsx` | Visual textures |
| `components/sections/TrackingCards.tsx` | The three Step-2 explanation cards on the right + the SVG dashed connector lines. Phone-end re-measured each rAF tick via `data-tracking-anchor` selectors |
| `components/InfoCard.tsx` | The reusable row card (number + label header, dashed divider, headline, description). Used by TrackingCards |
| `components/phone/PhoneFrame.tsx` | iPhone shell — renders status bar, dynamic island, screen. Scales children via single `transform: scale(width/260)` so HomeWorkoutView design-px values stay proportional |
| `components/phone/screens/HomeWorkoutView.tsx` | The screen content shown inside the scroll sequence's phone. Has `data-tracking-anchor` markers on: set row 1 (`"set-row"`, the active TAP row), the "Last time" line (`"last-time"`), and the bottom toolbar (`"toolbar"`) |
| `lib/useTheme.ts` | Reads `data-theme` attribute |

Asset locations:
- `public/tags/{gym-it, niagara, oswego, generic, swarthmore, waverley-oaks, ymca}.png` — the 7 tags
- `public/exercises/lat_pulldown_elevation.png` — equipment silhouette (used as a CSS mask so it tints with currentColor)
- `public/devices/phone_template.png` — phone line drawing (light-mode authored; inverted via `filter: invert(1)` in dark mode)

---

## 4. Scroll architecture

`useScroll({ target: sectionRef, offset: ["start start", "end end"] })` gives a raw `scrollYProgress` MotionValue (0→1). All step-1 phases are 0–1 fractions inside `step1Progress`, which is a remap:

```ts
const step1Progress = useTransform(scrollYProgress, [0, STEP1_LIMIT], [0, 1]);
```

This remap exists so the ~20 step-1 phase constants didn't have to be rescaled every time we added scroll at the end. To add a *new* phase after step 1:
1. Reduce `STEP1_LIMIT` and/or increase `TOTAL_VH` so the absolute vh for step-1 stays the same
2. Define the new phase on RAW `scrollYProgress` using values in `[STEP1_LIMIT, 1.0]`
3. Existing step-1 transforms keep working unchanged

The tap phase + the step-2 transition both run on raw `scrollYProgress`.

---

## 5. Timeline (all phases with absolute vh)

Scrollable vh = `TOTAL_VH − 100 = 4725`. Absolute vh below = raw `scrollYProgress × 4725`.

### Step 1 sub-timeline (operates on `step1Progress` 0→1, which spans 0 → 4200 vh of raw scroll)

| Phase | Range (step1Progress) | What happens |
|---|---|---|
| Rest | 0 → 0.204 (REST_END) | Hero static; logo spins one full turn |
| Panel grow | 0.204 → 0.446 (PANEL_END) | Bottom panel rises from tab → full vh; crossfade window inside |
| Pre-move dwell | 0.446 → 0.390 | (negative — MOVE_START=0.390 sits inside the panel range; intentional overlap) |
| Wheel move to centre | 0.390 → 0.520 (MOVE_END) | Wheel slides from logo slot to viewport centre |
| Centre idle | 0.520 → 0.567 (MERGE_END) | Wheel keeps spinning |
| 6 → 3 merge | up to MERGE_END | Dot pairs converge |
| 3 → boxes | MERGE_END → 0.687 (BOX_END) | Three pillar boxes form |
| Pillars stage | BOX_END → 0.725 (PILLARS_END) | Pillars content reveals |
| Pillars dwell | PILLARS_END → 0.799 (DWELL_END) | Hold on cards |
| Pillars fade-out | DWELL_END → 0.808 (PILLARS_FADE_OUT_END) | |
| Boxes → 3 dots (reverse) | 0.808 → 0.836 (REVERSE_BOX_END) | |
| 3 → 6 dots (reverse) | 0.836 → 0.864 (REVERSE_MERGE_END) | |
| Rotation re-ramp | 0.817 (ROTATION_RAMP_START) → 0.892 (LINE_END) | Extra 2 turns ease in over the line phase |
| Line formation | LINE_START (=REVERSE_MERGE_END) → LINE_END | 6 dots fly from wheel to top-left column. Stagger inside `LoadingRing` |
| Collapse | LINE_END → 0.929 (COLLAPSE_END) | Dots 1–5 slide down to a stack at the bottom; dot 0 stays. Labels/dashes fade to 25% / 40% |
| Step-1 breathe | COLLAPSE_END → 0.953 (STEP1_BREATHE_END) | Hold; tags + description visible |
| Tag-description un-type | STEP1_BREATHE_END → 0.965 (STEP1_TEXT_FADE_END) | "Interactive Redprint tags…" un-types reverse-direction |
| Surround tags collapse | STEP1_BREATHE_END → 0.977 (STEP1_FADE_OUT_END) | The 6 surround tags slide behind the centre tag and fade |
| Lat-pulldown fade-in | STEP1_BREATHE_END → STEP1_END (1.0) | Equipment silhouette fades in (via CSS mask) |

### Tap + transition + tracking cards timeline (operates on RAW `scrollYProgress`)

After the recent total-vh extension for the tracking cards: `TOTAL_VH = 5525`, scrollable = 5425 vh. Step-1 phases still resolve to the same ABSOLUTE vh via the `step1Progress` remap; the raw-scroll constants below were rescaled.

| Phase | Raw range | Absolute vh | What happens |
|---|---|---|---|
| Tap rise + type | 0.7742 (TAP_START = STEP1_LIMIT) → 0.8018 (TAP_RISE_END) | 4200 → 4350 (150 vh) | Phone slides up from below + "Tap your phone…" types in. Equipment dims 100% → 25%. Lat-pulldown scales 1× → 16×, centre tag slides 73.8% → equipment centre |
| Tap impact | 0.8018 → 0.8111 (TAP_END) | 4350 → 4400 (50 vh) | Phone scales 1 → 0.93 (top-centre origin). Two-ring beacon ripples out |
| Tap breathe | 0.8111 → 0.8295 (STEP2_TRANSITION_START) | 4400 → 4500 (100 vh) | Nothing animates. Progress line continues filling |
| Text fade-out | STEP2_TRANSITION_START → +0.00461 | 4500 → 4525 (25 vh) | Tap text un-types fast via `tapTextFadeP`. `tapTextDisplayP = tapTypeP × (1 - tapTextFadeP)` |
| Step 2 transition (phone move) | 0.8295 → 0.8710 (STEP2_TRANSITION_END) | 4500 → 4725 (225 vh) | Dot 1 opacity 0.5 → 1.0, dot 1 slides up to its lineY slot. Equipment + centre tag fade out. Phone repositions to (40%, 50%) at final scale 0.837. Phone shows `<HomeWorkoutView />`; floating + cursor parallax fade in (gated by `step2TransitionP`) |
| **Card 1 (SPEED)** | 0.8710 (CARDS_START) → 0.9079 | 4725 → 4925 (200 vh) | Dashed line draws from active set row (TAP pill) on phone → card 1's left edge. After 60% of phase, card 1 flickers in. (Dot 1 / TAP-TO-TRACK was already activated during the step 1→2 transition; dot 2 stays at its un-reached floor.) |
| **Card 2 (MEMORY)** | 0.9079 → 0.9447 | 4925 → 5125 (200 vh) | Line from "Last time: 135 lb × 8" line on phone → card 2's left edge. Card 2 flickers in after line completes |
| **Card 3 (DEPTH)** | 0.9447 → 0.9816 (CARDS_END) | 5125 → 5325 (200 vh) | Line from bottom toolbar (SUPERSET, DROPSET, 1RM, NOTE, LIBRARY) on phone → card 3's left edge. Card 3 flickers in after line completes |
| Post breathe | 0.9816 → 1.0 | 5325 → 5425 (100 vh) | Nothing — buffer to let the user settle on the fully-revealed Step 2 state before whatever comes next |

`step1ProgressP` (the SOLID overlay inside the 0→1 vertical connector in the left menu) reads raw `scrollYProgress` from `COLLAPSE_END × STEP1_LIMIT` all the way to `STEP2_TRANSITION_START`. So the bar physically reaches dot 1 right when step 2 begins.

---

## 6. MotionValues registry

All inside `ScrollSequence.tsx`. Listed in render order. `step1Progress` is the remap; everything else either reads it or reads raw `scrollYProgress`.

| Name | Source | Range | Drives |
|---|---|---|---|
| `step1Progress` | raw | `[0, STEP1_LIMIT] → [0, 1]` | All step-1 transforms (clamps at 1 past `STEP1_LIMIT`) |
| `ringRotRad` | step1 | 0 → many turns | Wheel rotation |
| `logoRotation` | step1 | 0 → 360 × TOTAL_TURNS deg | Hero logo spin |
| `mergeP` | step1 | 0 → 1 over [MOVE_END, MERGE_END] | 6 → 3 merge |
| `boxP` | step1 | 0 → 1 over [MERGE_END, BOX_END] | 3 → box morph |
| `pillarsP` | step1 | 0 → 1 over [BOX_END, PILLARS_END] | Pillars reveal |
| `indicatorOpacity`, `indicatorFillPct` | step1 | over [PILLARS_END, DWELL_END] | Scroll cue |
| `lineP` | step1 | 0 → 1 over [LINE_START, LINE_END] | Line formation in `LoadingRing` |
| `howItWorksTypeP` | step1 | 0 → 1 around LINE phase | Top-left "HOW IT WORKS:" header typewriter |
| `collapseP` | step1 | 0 → 1 over [COLLAPSE_START, COLLAPSE_END] | Tags scale-in + dots collapse |
| `tagTextTypeP` | step1 | Combined type-in + hold + un-type | "Interactive Redprint tags…" typewriter |
| `step1ProgressP` | **raw** | 0 → 1 over [COLLAPSE_END×STEP1_LIMIT, 1.0] | Solid overlay in 0→1 vertical connector |
| `step1FadeOutP` | step1 | 0 → 1 over [STEP1_BREATHE_END, STEP1_FADE_OUT_END] | 6 surround tags slide behind centre + fade |
| `latPullP` | step1 | 0 → 1 over [STEP1_BREATHE_END, STEP1_END] | Equipment fade-in |
| `placeP` | step1 | 0 → 1 over [STEP1_FADE_OUT_END, STEP1_END] | Equipment 1×→16× zoom + centre tag slide to equipment centre |
| `tapTypeP` | raw | 0 → 1 over [TAP_START, TAP_RISE_END] | "Tap your phone…" typewriter type-in (held at 1) |
| `phoneRiseP` | raw | 0 → 1 over [TAP_START, TAP_RISE_END] | Phone slides up from below |
| `phoneTapP` | raw | 0 → 1 over [TAP_RISE_END, TAP_END] | Phone tap impact + beacon |
| `step2TransitionP` | raw | 0 → 1 over [STEP2_TRANSITION_START, 1.0] | Dot 1 activation/move, equipment fade-out, centre tag fade-out, phone reposition |
| `tapTextFadeP` | raw | 0 → 1 over [STEP2_TRANSITION_START, +0.00529] | Fast 25vh window that un-types the tap text |
| `tapTextDisplayP` | combined | `tapTypeP × (1 - tapTextFadeP)` | Actual progress fed to the tap text typewriter |
| `stepsRevealP` | step1 | 0 → 1 over [LINE_START, LINE_END] | `HowItWorksSteps`' per-dot dashed-line + label reveal |
| `card1P`, `card2P`, `card3P` | raw | 0 → 1 over each card's 200vh sub-phase inside [CARDS_START, CARDS_END] | TrackingCards line draw (first 60%) + card flicker reveal (last 40%) |

Note: dot 2 (ON-DEMAND LEARNING) stays at its un-reached 50% floor through the entire cards phase — the cards are content for the already-active TAP-TO-TRACK step, not a transition into the next. `LoadingRing` and `HowItWorksSteps` still accept a `step3TransitionP` prop for future use, but ScrollSequence does not pass one.
| `logoOpacity`, `avatarOpacity`, `avatarMoveP`, panel mvs | step1 | various | Hero crossfade + panel geometry |

---

## 7. Components and props (current)

### `<LoadingRing>` props
- `size`, `ringRot`, `ringRadiusFrac`, `dotRadiusFrac`, `phase`, `centerOffsetXFrac`, `centerOffsetYFrac`
- `mergeP`, `boxP`, `lineP`, `lineTargetLeftX`, `lineTargetTopY`, `collapseP`
- **`step2TransitionP`** — when `cP > 0`, post-collapse opacity is: dot 0 = 1.0, linePos===1 = `0.5 + 0.5 × s2P`, linePos>2 = 0.5. Eased in via `cP` so there's no snap. Also: when `linePos===1 && s2P > 0`, the dot's collapsed Y target lerps back toward its `lineTargetY` (its original column slot)
- **`step3TransitionP`** — identical wiring as `step2TransitionP` but for `linePos===2` (dot 2 / TAP-TO-TRACK). Used during the tracking cards phase

### `<HowItWorksSteps>` props
- `progress` (= stepsRevealP), `collapseP`, `step1ProgressP`
- **`step2TransitionP`** — same wiring. Modifies `dotY(1)` to lerp back to lineY and ramps dot 1's label opacity (`labelCollapseOpacity`) + dashed-line opacity (`dashCollapseOpacity`) from the collapsed floors (0.25 / 0.4) up to 1.0
- **`step3TransitionP`** — identical, but for dot 2 (TAP-TO-TRACK). Drives `dotY(2)` lerp-back-to-lineY and ramps row 2's label + dashed-line opacities
- **Labels** (current order, AFTER the reorder we did this session):
  1. INTERACT WITH REDPRINT TAGS
  2. TAP-TO-TRACK
  3. ON-DEMAND LEARNING
  4. GYM-SPECIFIC AI
  5. COMPETE/COMMUNITY
  6. VISUALIZE PROGRESS

### `<RedprintTags>` props
- `progress` (= collapseP) — bouncy scale-in with per-tag stagger
- `fadeOutP` — surround tags slide behind centre + fade
- `placeP` + `placeTarget` — centre tag slides toward `placeTarget` (currently `{x: "73.8%", y: "51%"}`)
- **`centreFadeOutP`** — added this session. When set, centre tag opacity multiplies by `(1 - centreFadeOutP)`
- Internally uses `useTime` for ambient floating; mouse delta from window centre for cursor parallax with per-tag spring config variation
- Generic centre tag has theme-aware glow: white halo in dark mode, black in light. PNG is inverted via `filter: invert(1)` in light mode (it's authored for dark)

### `<TypewriterText>` props
- `text`, `start`, `speed`, `className`
- `progress` — scroll-tied 0→1, `shown = round(text.length × p)`
- **`reverse`** — added this session. When true, the visible chars are the SUFFIX (`text.slice(text.length - shown)`) and the hidden chars are the PREFIX (left-side layout reservation). NOTE: we built this but ended up not using it for the tap text — left-to-right typing with `text-align: right` gives the desired "growing from the trailing edge" feel. The `reverse` mode reveals chars in the WRONG semantic order (last char first), which the user didn't want

### `<LatPullImage>` (helper inside `ScrollSequence.tsx`)
- `progress` (= latPullP) — base opacity, also gates whether to render
- `scaleP` (= placeP) — drives the 1× → 16× scale via `scale = 1 + 15 × v`
- `dimP` (= tapTypeP) — dims to 25% during tap text type-in
- **`fadeOutP`** (= step2TransitionP) — hard fade-out during step 2 transition
- Final opacity: `progress × (1 - dimP × 0.75) × (1 - fadeOutP)`
- Positioned `left:56% right:8% top:51% y:"-50%" height:50vh`. Rendered as a CSS-masked surface with `backgroundColor: currentColor`

### `<PhoneTap>` (helper inside `ScrollSequence.tsx`)
- `riseP`, `tapP`, `transitionP`
- `transformOrigin: "50% 0%"` (top centre — so tap impact compresses *into* the contact point)
- Composite transform: `translateX(-50%) translateY(${riseVh}vh) translateY(${centreYPct}%) scale(${s})`
  - `riseVh = 100 - 100 × riseP` (vh units)
  - `s = (1 - 0.07 × tapP) × (1 - 0.1 × transitionP)` → 1 → 0.93 → 0.837
  - **`centreYPct = -50 × transitionP × s`** ← critical: multiplied by `s` so the *visible* (scaled) phone's centre lands on viewport y=50%, not the unscaled-box's centre
- `left` lerps `73.8% → 40%`, `top` lerps `51% → 50%` via separate motion values
- `width: 280px` (fixed pixels — holds same general size as viewport resizes). Renders `<PhoneFrame width={280}><HomeWorkoutView org={PHONE_ORG} /></PhoneFrame>` — same UI as the Hero's active workout screen
- **Floating + cursor parallax** (gated by `transitionP` so it only kicks in at the new step-2 position): inner `<motion.div style={{ x, y, rotate }}>` driven by `useTime` sine waves (`FLOAT_AMP = 8px`) + cursor-tracked spring translate (`PARALLAX = 14px`) + small Z-tilt (max ~4°). Gating is `... * g` where `g = transitionP.get()`, so during the rise/tap phases it's identically zero.
- `PHONE_ORG = orgs[0]` (Marist) — static org choice for the scroll sequence; change here if a different org's colour palette is desired

### `<TrackingCards>` (`components/sections/TrackingCards.tsx`)
- Props: `card1P`, `card2P`, `card3P` (each 0→1 over its own 200vh sub-phase)
- Renders three `<InfoCard>`s stacked on the right at fixed vh positions (`CARD_TOP_VH = [12, 42, 72]`), `right: 5vw`, `width: min(440px, 36vw)`
- `LINE_END = 0.6` — first 60% of each sub-phase draws the connector line; remaining 40% runs the `flicker()` reveal on the card
- `ConnectorLines` is a single SVG layer with `overflow: visible`. A `requestAnimationFrame` loop reads `[data-tracking-anchor="…"]` (phone side) and `[data-card-anchor="…"]` (card side) bounding rects each frame and sets state with the current endpoints. The line draws `from = phone-side rect's right-edge midpoint`, `to = card-side rect's left-edge midpoint`; the visible endpoint lerps along that segment per `drawP`
- Target dot (phone side): 2px circle in `#7A7A80`, drawn as soon as line starts
- Origin dot (card side): 3px circle in `#F5F1EA`, drawn once `drawP >= 1`
- Stroke: 1px `#3A3A42`, `strokeDasharray="3 4"`, round endcaps

### `<InfoCard>` (`components/InfoCard.tsx`)
- Props: `index`, `label`, `title`, `description`
- Static visual — `bg #161618`, `1px solid rgba(255,255,255,0.08)`, `radius 16px`, `padding 28px / 24px`
- Header row: `index` (left, white/45) + `label` (right, tracking-wider, white/85). Below: dashed horizontal divider (`repeating-linear-gradient`, white/18)
- Headline: 28px Outfit Bold. Description: 15px Inter, white/65

### `<TapBeacon>` (helper inside `ScrollSequence.tsx`)
- `tapP` — two `motion.div` concentric rings, both 180×180 circles with 2px solid `currentColor` border, anchored at `(73.8%, 51%)`
- Lead: scale `0.4 → 3`, opacity keyframes `[0, 0.1, 1] → [0, 0.8, 0]`
- Trail: scale `0.4 → 2.2`, opacity keyframes `[0.3, 0.4, 1] → [0, 0.6, 0]`
- Rendered **before** `<PhoneTap>` in JSX so the phone paints on top

---

## 8. Theme system

- `<html data-theme="dark|light">` toggled by user (button somewhere in the layout — not in scope here)
- Tailwind v4 `@custom-variant light` defined in `app/globals.css`
- Color tokens: `--color-bg-base`, `--color-fg-base` (white in dark, near-black in light)
- `useTheme()` hook in `lib/useTheme.ts` reads the attribute
- Theme-aware techniques used:
  - `text-fg-base/50` utility — using currentColor inside `repeating-linear-gradient` for dashed lines so they invert with theme
  - `currentColor` inside `backgroundColor` for CSS-masked silhouettes (lat-pulldown)
  - Inline conditional on `isDark` for the centre tag glow + the phone `filter: invert(1)`
- **Known artifact (pre-existing, NOT from this work):** hydration mismatch warning on `data-theme` because the attribute is applied client-side. Logs are harmless

---

## 9. Session history (chronological)

This is the working log of what we built/changed in the most recent session. Earlier session details (Hero, Pillars, line formation) are in the previous summary.

1. **Tags section built.** 7 tags (6 orgs + generic centre), bouncy scale-in via spring stagger, cursor parallax with per-tag spring config variation, ambient floating via `useTime` + per-tag phase/speed sine waves
2. **Description text "Interactive Redprint tags are placed on gym equipment"** — typed in via `TypewriterText` driven by `tagTextTypeP`, in Outfit Black 4.25rem
3. **Step-1 breathe** added (200vh, later cut to 100vh)
4. **Equipment + place phase.** Lat-pulldown silhouette fades in via CSS mask. `placeP` drives 1× → eventually 16× scale on the equipment AND slides the centre tag from its starting position to the equipment centre (73.8%, 51%)
5. **Description text fade-out fix.** User complained text was disappearing abruptly. After two tries (the second using `useTransform` directly on `motion.div` for smoother opacity), the final solution was: reverse the typewriter (un-type) instead of opacity fade. `tagTextTypeP` now types in, holds, then types out
6. **Lat-pulldown size iterations.** User asked for: 5× → 8× → 15× → 16×. Final: `scale = 1 + 15 × placeP`
7. **Centre tag x-position iterations.** 74% → 72% → 73% → 73.9% → 73.8%. Final: `placeTarget = {x: "73.8%", y: "51%"}`
8. **Tap phase added.** New constants `TAP_START`, `TAP_RISE_END`, `TAP_END` defined on raw `scrollYProgress` past `STEP1_LIMIT`. New text "Tap your phone against a tag" on the LEFT side, right-aligned via `text-align: right`. New `PhoneTap` helper that slides up from 100vh below to top:51% (tag's mid-line). 25vh of tap impact at the end with scale 1 → 0.93
9. **Beacon added.** `TapBeacon` two concentric rings expanding from the contact point. Initially rendered after the phone; later swapped to render *before* it so the phone paints on top
10. **Equipment dims to 25% as tap text types in.** Added `dimP` prop to `LatPullImage`; passed `tapTypeP` for it
11. **Tap text iterations.**
    - Originally "Tap against a tag", changed to "Tap your phone against a tag"
    - Built `TypewriterText` `reverse` prop (chars appear from end first) — user said this was wrong, dropped the prop, kept normal LTR typing with `text-align: right`
    - Position iterations: `left:8% right:56%` → `30%/35%` → `27%/38%` → `22%/43%` (current). Trailing edge ends at ~57% vw
12. **"Interactive Redprint tags…" position nudged** to `left:60% right:4%` (was 56%/8%)
13. **100vh post-tap breathe added.** Bumped TOTAL_VH; the progress line was extended to include this breathe (and later, to include the step-2 transition too — fills up to scroll = 1.0)
14. **"How it works" step order reordered.** "Gym-specific AI" moved from slot 2 to slot 4; Tap-to-track and On-demand learning each moved up one. Final order in `HowItWorksSteps.LABELS`
15. **Step 1 → Step 2 transition built.** Added 300vh (later cut to 225vh, see #18) for the new transition phase. Single `step2TransitionP` drives:
    - Dot 1 opacity 50% → 100% (via `LoadingRing` per-dot opacity rules)
    - Dot 1 slides from collapsed-bottom back to its lineY slot under dot 0
    - Dot 1's label + dashed line ramp 0.25/0.4 → 1.0
    - Equipment fade-out (new `fadeOutP` prop)
    - Centre tag fade-out (new `centreFadeOutP` prop on `RedprintTags`)
    - "Tap your phone…" text un-types (initially over full window; later moved to fast 10vh, then 25vh window via `tapTextFadeP`)
    - Phone repositions to (`left: 40%`, `top: 50%`) and shrinks 10% (compounded scale 0.93 × 0.9)
16. **Un-reached dots @ 50%.** All collapsed dots except dot 0 default to 50% opacity in `LoadingRing`. The dot at linePos 1 ramps up to 100% with `step2TransitionP`
17. **Phone x-position iterations during step-2.** 25% → 35% → 40% → 50% → reverted to 40%
18. **Step-2 transition window cut by 25%.** 300vh → 225vh. Recomputed all dependent constants:
    - `TOTAL_VH 4900 → 4825`
    - `STEP1_LIMIT 0.875 → 0.8889`
    - `TAP_RISE_END 0.90625 → 0.9206`
    - `TAP_END 0.91667 → 0.9312`
    - `STEP2_TRANSITION_START 0.9375 → 0.9524`
    - Step-1 phases keep their original 0-1 fractions (the remap handles it)
19. **Phone vertical centering fix.** With `transform-origin: 50% 0%`, scaling shrinks the visible phone *anchored at the top* of its layout box. `translateY(-50%)` of the layout box was therefore pulling the phone too far up — the visual centre ended up at ~43vh instead of 50vh. Fix: `centreYPct = -50 × transitionP × s` (multiply by current scale `s`). Now visual centre lands on y=50vh

---

## 10. Where we left off

The most recent message exchange ended with:
- Phone target: `left: 73.8% → 40%`, `top: 51% → 50%`
- Composite transform with the `× s` scale-aware Y centring (item #19 above)
- Visual centre of phone now correctly at viewport (40%, 50%)

The phone is still **tall** — at `width: 22vw` × 2.08 aspect × scale 0.837, it's ~38vw tall ≈ 68vh on a 16:9 screen. When vertically centred (centre at 50vh), its top edge is at ~16vh and the bottom at ~84vh. That's a lot of vertical real estate. The user has NOT explicitly asked to shrink it further (yet) — they only complained about *centering*, which is now fixed. If they next ask the phone "doesn't fit" or "is too tall," the two knobs are:
- Bump the transition scale: change `(1 - 0.1 × t)` → e.g. `(1 - 0.35 × t)` for ~60% final scale → ~49vh tall when centred
- Drop base width: `22vw` → `~14vw`

---

## 11. Known issues / things to revisit

1. **Hydration mismatch on `data-theme`** — harmless, pre-existing. Logs only show in dev. Would need a `useEffect` + suppressed hydration warning on `<html>` to silence it
2. **Composite transform order in `<PhoneTap>`** — fragile. The whole `style={{ left, top, transform }}` motion value approach works but if you add anything that touches `x` or `y` directly, it'll conflict with the manual `transform` string. Always edit through the composite
3. **`TypewriterText` `reverse` mode is unused.** Kept in the component for future use but no current caller. Could be deleted if you want a smaller surface
4. **Phone PNG aspect lookup** — we hard-coded width:22vw based on visual judgment. If the PNG is ever swapped, the centering math (which uses `-50 × t × s`) still works because it's purely a fraction of layout height — but the absolute vh footprint changes

---

## 12. Tunable knobs (most likely tweaks)

| To change… | Edit |
|---|---|
| Phone post-transition x position | `73.8 - (73.8 - 40) * v` in `<PhoneTap>` — change `40` |
| Phone post-transition y position | `51 - v` in `<PhoneTap>` — change `51` and `50` (currently lerps 51→50) |
| Phone size in new position | `(1 - 0.1 * t)` in scale formula — bump `0.1` to shrink more |
| Phone width baseline | `width: "280px"` in `<PhoneTap>` — fixed pixel width, no viewport scaling |
| Equipment max zoom | `1 + v * 15` in `<LatPullImage>` |
| Beacon ring size | `width: 180, height: 180` in `<TapBeacon>` |
| Tap text disappear speed | `0.00529` in `tapTextFadeP` window (= 25vh / 4725vh scrollable) |
| Length of step 2 transition | `STEP2_TRANSITION_START` / `STEP2_TRANSITION_END` (and recompute TOTAL_VH + sibling raw-scroll constants to preserve other phases' absolute vh) |
| Tracking cards reveal length | `CARDS_END` (and recompute TOTAL_VH). `CARD_SUBPHASE = (CARDS_END - CARDS_START) / 3` is derived |
| Card-line vs card-flicker split | `LINE_END` constant in `TrackingCards.tsx` (default 0.6) |
| Card vertical stack positions | `CARD_TOP_VH = [12, 42, 72]` in `TrackingCards.tsx` |
| Card horizontal position + width | `right: 5vw` / `width: min(440px, 36vw)` in `<CardSlot>` |
| Centre tag target on equipment | `placeTarget={{x:"73.8%", y:"51%"}}` in `<RedprintTags>` prop |
| Order of menu steps | `LABELS` array in `HowItWorksSteps.tsx` |
| Tag glow colors | `glow` field on each entry in `TAGS` array in `RedprintTags.tsx` |
| Un-reached dot floor opacity | `0.5` in the post-collapse opacity logic in `LoadingRing.tsx` (search "postCollapseOpacity") |

---

## 13. Next steps (proposed scope for next session)

The transition INTO step 2 is built. What still needs to happen:

**Build Step 2 ("TAP-TO-TRACK") content.** The phone is positioned on the left side and ready to receive screen content. Likely needs:
- A "TAP-TO-TRACK" headline somewhere (top? right of phone? — the previous step-1 headlines used right-of-content positioning)
- App UI mockups appearing INSIDE the phone screen (or overlaid)
- Probably a "lookup" animation showing the user tracking a set/rep — the phone shows real interface elements
- Whatever supporting copy describes how tap-to-track works

**Plan inter-step transitions.** The pattern established by Step 1 → Step 2 transition is:
- Old content fades/un-types
- The next un-reached dot moves up + activates (50% → 100%)
- The "persistent" element from the previous step (in this case the phone) repositions/resizes

Step 2 → Step 3 will need: phone moves again? Some new persistent element? TBD. Each step should follow the same dot-activation pattern.

**Things still TODO that aren't step-2-content:**
- Browser-tested only at default viewport. Mobile responsive behavior is unknown / undefined
- No accessibility pass yet (aria, focus management, prefers-reduced-motion)
- The hero opening was tested with the previous TOTAL_VH=4300; the rescale to 4825 should preserve it, but worth a smoke-test scroll-through

---

## 14. Quick scroll-through reference

If you need to jump to a specific phase in the browser, scroll to roughly this fraction of the page:

| Phase to inspect | scrollY |
|---|---|
| Hero static | top |
| Pillars cards | 0.6–0.7 of full scroll |
| Line forms in top-left | 0.78–0.81 |
| Tags appear | 0.83 |
| "Interactive Redprint…" typed | 0.85 |
| Lat-pulldown peak zoom | 0.86 |
| Tap text typing | 0.88–0.91 |
| Tap impact + beacon | 0.916 |
| Step-2 transition (dot 1 moves, phone re-positions) | 0.953–1.0 |
| End of scroll | bottom |

Inspect actual scroll fraction in DevTools console: `document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight)`
