# Redprint Marketing Site — Plan & State

Last updated: 2026-06-05 (Steps 3 / 4 / 5 / 6 / testimonials / request-gym-form / silhouettes all built; mobile responsive page; modals + Resend email; legal pages; favicon + system-theme default; Vercel deployed at tapredprint.com)

This document is the single source of truth for the Redprint marketing site — both the scroll-driven landing page and the surrounding surface (mobile page, modals, legal pages, deployment). Read this first to pick up where the last session left off.

---

## 1. TL;DR

The marketing site is a Next.js 16 App Router project. The home page is a giant scroll-driven sequence below the `md` breakpoint cutoff, and a vertically-scrolling stacked page on phones.

**Current desktop scroll sequence (Steps 1–6 all built):**

1. Hero opening (rotating wheel, panel takeover, "Fitness AI…" headline)
2. Pillars stage (three boxes morphed from the wheel)
3. Six dots fly to a top-left column ("How it works" menu); dots 1–5 collapse to a bottom stack
4. **Step 1 — INTERACT WITH REDPRINT TAGS** (tags scale in, description types, lat-pulldown silhouette zooms 1×→16×, phone slides up + taps, beacon ripples)
5. **Step 2 — TAP-TO-TRACK** (phone repositions to (40%, 50%), shows HomeWorkoutView with float + parallax; three SPEED / MEMORY / DEPTH tracking cards reveal on the right with dashed connector lines drawn from phone UI anchors)
6. **Step 3 — ON-DEMAND LEARNING** (phone shows ExerciseRedprintView, three learning cards on the right)
7. **Step 4 — GYM-SPECIFIC AI** (equipment cluster appears, then phone shows AIChatbotView)
8. **Step 5 — COMPETE/COMMUNITY** (phone cycles through CommunityView → GroupChallengeDetailView → TierAchievementCongratulationsView with three captions: Monthly gym leaderboard / Form groups with friends / Earn rewards from your gym)
9. **Step 6 — VISUALIZE PROGRESS** (phone fans into multiple workout-history phones; final WorkoutHistoryAnalysisView)
10. **Testimonials layer** (testimonials hidden inside a dot-matrix sentence that resolves into individual quote cards)
11. **Request-your-gym form** (full RequestGymForm rendered at the end with a 3-silhouette bouncy bottom)
12. **Footer auto-play** (formation animation runs once it starts — NOT scroll-tied — six dots converge into "Fitness AI that knows your gym")
13. **SiteFooter** below the section (Product / Company / Connect link columns + QR/store-pill column)

**Mobile (< md / 768px)** swaps to `<MobileHome />` — a stacked Hero / How it works / Pillars / Testimonials / FinalCTA scroll, no scroll-tied animations. Server-side UA detection picks the right tree at SSR so neither viewport sees a flash of the wrong layout.

**Live deployments:**
- Production: `https://tapredprint.com` (Vercel, auto-deploys from `main`)
- Preview: `redprint-web.vercel.app`
- `redprintfit.com` is still on Wix; not migrated (see §15)

---

## 2. Tech stack

- **Next.js 16** App Router, React 19, Turbopack dev
- **Tailwind v4** with custom `@custom-variant light` (theme switched by `data-theme` attribute on `<html>`)
- **Framer Motion 12** — `useScroll`, `useTransform`, `useSpring`, `useMotionValue`, `useTime`, `motion.div`
- **GSAP** — Hero entrance + Lenis ticker
- **Lenis** smooth scroll via `LenisProvider` (with a `ResizeObserver` on `document.body` to call `lenis.resize()` whenever page height changes — fixes stale `maxScroll` cache). Also handles popstate-reload (force reload on back-nav so stale scroll state doesn't render a broken page)
- **Resend** for transactional email (Contact form, Request-Gym form)
- Fonts: Outfit (display), Inter (body), Bitcount Grid Single (pixel font used by the testimonial dot-matrix). All loaded via `next/font`

Dev: `pnpm dev` (server at `http://localhost:3000`)
Type-check / build: `pnpm build`

---

## 3. Project surface (all routes)

| Route | Purpose | Component |
|---|---|---|
| `/` | Home — scroll sequence (desktop) or mobile home (phone). SSR picks via User-Agent | `app/page.tsx` → `HomePageSwitcher` → `ScrollSequence + SiteFooter` or `MobileHome` |
| `/privacy` | Privacy Policy (full canonical text + GDPR + CCPA sections) | `app/privacy/page.tsx` → `LegalPage` |
| `/terms` | Terms of Use (29 sections, canonical) | `app/terms/page.tsx` → `LegalPage` |
| `/email-preview` | Dev-only preview of Resend email templates | `app/email-preview/page.tsx` |
| `/for-gyms` | Stub | `app/for-gyms/page.tsx` |
| `/api/contact` | POST endpoint that sends Contact form via Resend | `app/api/contact/route.ts` |
| `/api/request-gym` | POST endpoint that sends Request-Gym form via Resend + auto-reply | `app/api/request-gym/route.ts` |
| `/api/email-preview` | Returns rendered HTML for the various email templates (`?t=owner`, etc.) | `app/api/email-preview/route.ts` |

---

## 4. File map

### Scroll-sequence components

| File | Lines | Purpose |
|---|---|---|
| `components/sections/ScrollSequence.tsx` | 3004 | **The orchestrator.** Owns `scrollYProgress`, every phase constant, every MotionValue, and every render |
| `components/sections/Hero.tsx` | 368 | Initial logo + headline scene; GSAP opening; phone fan with click-to-promote; Contact us + Request your gym CTAs |
| `components/LoadingRing.tsx` | — | The 6-dot wheel — spin, 6→3 merge, 3 boxes, reverse, line formation, collapse, post-collapse dot opacity |
| `components/sections/Pillars.tsx` | 527 | The 3-pillar info cards rendered into the boxes. Now includes per-pillar highlights (day-swap, play-button press, leaderboard swap) |
| `components/sections/HowItWorksSteps.tsx` | 521 | Left-side menu — labels, dashed connectors, vertical connectors, solid progress overlay. Steps 1–6 with per-dot activation `step{N}TransitionP` props |
| `components/sections/RedprintTags.tsx` | 415 | The 7 Redprint hex tags (6 orgs + generic centre) |
| `components/sections/TrackingCards.tsx` | 360 | Step-2 SPEED / MEMORY / DEPTH cards on the right + SVG dashed connectors. Phone-side endpoint re-measured each rAF via `data-tracking-anchor` selectors |
| `components/sections/EquipmentCluster.tsx` | 386 | Step-4 GYM-SPECIFIC AI equipment cluster (the cluster of equipment images that gathers, gets queried by the chatbot) |
| `components/sections/TestimonialsLayer.tsx` | 1028 | Testimonials section: testimonials hidden in a Bitcount-Grid dot field, dots route to per-letter targets, then collapse to individual quote cards. **Exports `TESTIMONIALS` array** consumed by `MobileHome` |
| `components/sections/RequestGymForm.tsx` | 121 | End-of-page Request-Your-Gym form (wraps `RequestGymModal`'s form fields into a full-section layout) |
| `components/sections/BottomSilhouettes.tsx` | 221 | Three fitness silhouettes that bounce up from below with overshoot at the very end of the section |
| `components/sections/OrgCarousel.tsx` | 152 | Horizontal "wheel picker" of org logos. Now `<motion.button type="button">` (was `<motion.div onClick>` — type=button kills Chrome's email-autofill misfire) |
| `components/animations/TypewriterText.tsx` | — | Char-by-char reveal tied to a 0→1 progress MV (or a time-based start). Supports `reverse` prop (unused) |
| `components/effects/Grain.tsx`, `Glow.tsx` | — | Visual textures |
| `components/InfoCard.tsx` | — | Reusable row card (number + label header, dashed divider, headline, description). Used by TrackingCards and elsewhere |

### Phone shell + screens (rendered inside `<PhoneFrame>` throughout)

| File | Purpose |
|---|---|
| `components/phone/PhoneFrame.tsx` | iPhone shell — status bar, dynamic island, screen. Scales children via `transform: scale(width/260)` so design-px values stay proportional |
| `components/phone/screens/HomeWorkoutView.tsx` | Active workout screen (Step 2). Has `data-tracking-anchor` markers on set-row, last-time, and toolbar |
| `components/phone/screens/ExerciseRedprintView.tsx` | Exercise detail with video + instructions (Step 3) |
| `components/phone/screens/AIChatbotView.tsx` | AI chatbot conversation (Step 4) |
| `components/phone/screens/CommunityView.tsx` | Gym leaderboard + activity feed (Step 5a) |
| `components/phone/screens/GroupChallengeDetailView.tsx` | Group challenge (Step 5b) |
| `components/phone/screens/TierAchievementCongratulationsView.tsx` | Tier reward unlock (Step 5c) |
| `components/phone/screens/WorkoutHistoryAnalysisView.tsx` | History analytics view (Step 6) |
| `components/phone/screens/ExerciseHistoryAnalysisView.tsx` | Older exercise-specific history view |
| `components/phone/screens/FinishedWorkoutSummaryView.tsx` | Finished workout summary modal |

### Mobile responsive

| File | Purpose |
|---|---|
| `components/HomePageSwitcher.tsx` | Picks `<ScrollSequence + SiteFooter>` or `<MobileHome>` based on `initialView` prop. `useState(initialView)` is hydrated by SSR; client `matchMedia` listener still runs to handle window-resize edge cases |
| `components/mobile/MobileHome.tsx` (492 lines) | All mobile sections inline: `MobileHero`, `MobileHowItWorks` (6 stacked steps with phone screenshots), `MobilePillars`, `MobileTestimonials`, `MobileFinalCTA`. Mounts the three modals (Request/Contact/Download) |
| `components/MobileMenuDrawer.tsx` | Full-screen overlay opened by the mobile-nav hamburger; surfaces How it works / Testimonials / Contact / Download / Sign in |

### Modals (mounted from Nav, Hero, SiteFooter, and MobileHome — anywhere CTAs live)

| File | Purpose |
|---|---|
| `components/RequestGymModal.tsx` | "Bring Redprint to your gym" form. Member/Owner toggle ("I represent a gym" — was "I'm a gym owner"). Honeypot. Posts to `/api/request-gym` |
| `components/ContactModal.tsx` | Generic Contact form. Posts to `/api/contact` |
| `components/DownloadModal.tsx` | App Store / Google Play QR codes + clickable store pills. Real URLs live in `lib/constants.ts` |

### Legal

| File | Purpose |
|---|---|
| `components/legal/LegalPage.tsx` (51 lines) | Shared layout for `/privacy` and `/terms` — centered narrow column, title + "Last updated" header, prose styling via descendant arbitrary variants, `SiteFooter` below |
| `app/privacy/page.tsx` | Full Privacy Policy text (canonical from old redprintfit.com/privacy) with fixes: full Buffalo address, "United States" instead of "New York, United States", `info@redprintfit.com`. Adds GDPR + CCPA sections that were missing |
| `app/terms/page.tsx` | Full Terms of Use (29 sections, canonical from old redprintfit.com/termsofuse) with fixes: email → info@, formatted phone, `/privacy` relative link in §15, "one (1) year" grammar fix, NY venue phrasing |

### Email + API

| File | Purpose |
|---|---|
| `app/api/contact/route.ts` (104 lines) | Validates Contact form, sends notification to `REQUEST_GYM_CONTACT_EMAIL` with `Reply-To: submitter`. No auto-reply |
| `app/api/request-gym/route.ts` (156 lines) | Validates Request-Gym form. Sends founder notification (`REQUEST_GYM_FOUNDER_EMAIL`) and an auto-reply to the submitter. Branches member vs owner templates. Honeypot drops bot submissions silently. Optional Slack webhook |
| `app/api/email-preview/route.ts` (67 lines) | Returns rendered HTML for any template via `?t=member|owner|founder|contact|contact-owner` query — used by `/email-preview` dev page |
| `lib/email/templates.ts` (249 lines) | `founderNotifyTemplate`, `memberAutoReplyTemplate`, `ownerAutoReplyTemplate`, `contactNotifyTemplate`. Helper `storeButton` for Apple / Google Play pills. Logo set to 160×32 (matches natural 5.04:1 aspect — earlier 140×32 was squishing it) |

### Layout / chrome

| File | Purpose |
|---|---|
| `app/layout.tsx` | Root layout. Mounts `<LenisProvider>` + `<Nav>` + `<main>{children}</main>`. Sets `data-theme` via pre-paint inline script; defaults to OS `prefers-color-scheme` if no localStorage override. Wires the favicon `<link>` tags with `media` queries — `/favicon-light.svg` for light, `/favicon-dark.svg` for dark |
| `app/page.tsx` | Reads `User-Agent` server-side via `next/headers`; passes `initialView="mobile"` or `"desktop"` to `HomePageSwitcher` — eliminates first-paint flash of the wrong layout |
| `components/layout/Nav.tsx` | Fixed-top nav. Desktop: How it works / Testimonials / Download / Sign in / ThemeToggle. Mobile (< md): Download pill + hamburger. Hosts `<DownloadModal>`, `<ContactModal>`, `<MobileMenuDrawer>` |
| `components/layout/SiteFooter.tsx` | Footer with Product / Company / Connect columns + QR/store-pill column. "How it works" / "Testimonials" use path-aware smart-scroll (same pattern as Nav). Contact opens `ContactModal`. Privacy Policy → `/privacy`, Terms of Service → `/terms`. Real social URLs (Instagram tapredprint, TikTok redprintfit, LinkedIn company/redprint-inc). Store pills link to the real App Store / Play Store |
| `components/layout/ThemeToggle.tsx` | Two-state moon/sun toggle. Writes `localStorage.theme` on click — this is the signal that user has manually overridden the OS preference |
| `components/animations/LenisProvider.tsx` | Provides Lenis context, `ResizeObserver` on body, and `popstate` listener that force-reloads on back-nav |
| `components/HashScrollTarget.tsx` | On home page mount, reads `location.hash` and scrolls to `#hiw` / `#testimonials` via `scrollToVh` |
| `lib/scrollTargets.ts` | `SCROLL_TARGETS.howItWorks = 1360`, `SCROLL_TARGETS.testimonials = 4500` — absolute vh targets used by Nav and SiteFooter |
| `lib/lenis.ts` | `scrollToVh`, `scrollToTop` helpers |
| `lib/constants.ts` | `APP_STORE_URL = https://apps.apple.com/.../id1539200045`, `PLAY_STORE_URL = .../com.redprint.fitness`, `WEB_APP_URL = https://app.redprintfit.com` |
| `lib/content/orgs.ts` | The 6 orgs (Marist, Niagara, Oswego, Swarthmore, Waverley Oaks, YMCA) + Generic. Each has `id`, `name`, `primaryColor`, `logoSrc`, glow color |
| `lib/blobAvatar.ts` | Procedural blob avatars for testimonials |

### Public assets (highlights)

- `public/favicon-light.svg`, `public/favicon-dark.svg` — circular SVG favicons wrapping the source PNG with a `clipPath`. Picked via `prefers-color-scheme` media query
- `public/tags/{...}.png` — the 7 Redprint hex tags
- `public/exercises/lat_pulldown_elevation.png` — equipment silhouette (CSS-masked so tints with currentColor)
- `public/devices/phone_template.png` — phone line drawing (light-mode authored; inverted via `filter: invert(1)` in dark mode)
- `public/qr/redprint_app_store_qr.png`, `public/qr/redprint_play_store_qr.png` — QR codes for the store pills
- `public/silhouettes/fitness_silhouette_{1,2,3}.png` — bottom-bouncing silhouettes
- `public/screens/exercise-pushup.jpg`, `public/screens/exercise-situp.jpg` — exercise demo stills
- `public/logos/gym_logos/` — gym partner logos for the OrgCarousel
- `public/grain/`, `public/icons/trophy.png`, `public/tags/`, `public/avatars/` — supporting assets

---

## 5. Scroll architecture

`useScroll({ target: sectionRef, offset: ["start start", "end end"] })` gives a raw `scrollYProgress` (0→1). All Step-1 phases are 0–1 fractions inside `step1Progress`, which is a remap:

```ts
const step1Progress = useTransform(scrollYProgress, [0, STEP1_LIMIT], [0, 1]);
```

The remap exists so the ~20 step-1 phase constants didn't need rescaling each time we added scroll at the end. Steps 2–6 + transitions + cards + testimonials + request-gym-form all run on **raw `scrollYProgress`** past `STEP1_LIMIT`.

Adding a new phase after Step N:
1. Reduce `STEP1_LIMIT` and/or increase `TOTAL_VH` so the absolute vh for already-built phases stays the same
2. Define the new phase on RAW `scrollYProgress` using values in `[STEP{N}_END, 1.0]`
3. Existing transforms keep working unchanged

---

## 6. Timeline (all phases with absolute vh)

`TOTAL_VH = 5269` (was 5525 — trimmed across many vh-reduction passes). Scrollable = `TOTAL_VH - 100 = 5169`. Absolute vh below = raw `scrollYProgress × 5169`.

`STEP1_LIMIT = 0.3316` (was 0.875 — dramatically smaller because Steps 2–6 + extras dominate the timeline).

### Step 1 sub-timeline (operates on `step1Progress` 0→1, which spans 0 → ~1714 vh of raw scroll)

Same internal phases as before: rest → panel grow → wheel move → 6→3 merge → 3→boxes → pillars stage → reverse → line formation → collapse → step-1 breathe → tag-description un-type → surround-tags collapse → lat-pulldown fade-in. See git history of `ScrollSequence.tsx` for the full list of step-1 phase constants — they're stable from before 2026-05-29.

### Raw-scroll timeline (Steps 2–6 + testimonials + request-form)

All values below are raw `scrollYProgress`.

| Phase | Range | Absolute vh | What happens |
|---|---|---|---|
| Tap rise + type | `TAP_START` (= `STEP1_LIMIT` = 0.3316) → `TAP_RISE_END` 0.3525 | 1714 → 1822 | Phone rises, "Tap your phone…" types in |
| Tap impact | 0.3525 → `TAP_END` 0.3595 | 1822 → 1859 | Phone scales 1 → 0.93; beacon ripples |
| Tap breathe | 0.3595 → `STEP2_TRANSITION_START` 0.3732 | 1859 → 1930 | Hold |
| Step 1 → 2 transition | 0.3732 → `STEP2_TRANSITION_END` 0.3927 | 1930 → 2031 | Dot 1 ramps to 100%, equipment fades, phone repositions to (40%, 50%) and shrinks 10%, shows HomeWorkoutView |
| **Step 2 cards** (SPEED → MEMORY → DEPTH) | `CARDS_START` 0.3927 → `CARDS_END` 0.4301 | 2031 → 2224 | Three dashed connector lines + flicker reveals |
| Step 2 → 3 transition | 0.4301 → `STEP3_TRANSITION_END` 0.4771 | 2224 → 2467 | Dot 2 activates; phone screen swaps to ExerciseRedprintView |
| **Step 3 cards** (LEARN) | `LEARN_START` 0.4771 → `LEARN_END` 0.5152 | 2467 → 2664 | Three learning cards reveal on the right (stagger via `LEARN_WINDOW` / `LEARN_STAGGER`) |
| Step 3 → 4 transition | 0.5293 → `STEP4_TRANSITION_END` 0.5487 | 2735 → 2836 | Dot 3 activates |
| **Step 4 — Equipment cluster** | `EQUIP_START` 0.5487 → `EQUIP_END` 0.5765 | 2836 → 2979 | `<EquipmentCluster>` gathers; phone shows AIChatbotView |
| **Step 4 — Chat** | `CHAT_START` 0.5765 → `CHAT_END` 0.5938 | 2979 → 3069 | Chatbot conversation animates |
| Step 4 → 5 transition | `STEP5_TRANSITION_START` 0.6076 → `STEP5_TRANSITION_END` 0.6270 | 3140 → 3240 | Dot 4 activates |
| **Step 5 — Compete title** | 0.6270 → `COMPETE_TITLE_END` 0.6543 | 3240 → 3381 | "Your gym vs. the world" + caption swaps as the screen cycles `CommunityView → GroupChallengeDetailView → TierAchievementCongratulationsView` |
| Step 5 → 6 transition | `STEP6_TRANSITION_START` 0.6820 → `STEP6_TRANSITION_END` 0.7013 | 3525 → 3625 | Dot 5 activates |
| **Step 6 — Phone fan** | 0.7013 → `FAN_END` 0.7290 | 3625 → 3768 | Phone fans into multiple phone instances showing WorkoutHistoryAnalysisView variations |
| **Step 6 — Progress visualization** | 0.7290 → `PROGRESS_END` 0.7483 | 3768 → 3868 | Charts/data reveal |
| Step 6 exit | 0.7483 → `EXIT_END` 0.8114 | 3868 → 4194 | Phones exit, dots / menu fade |
| **Testimonials** | 0.8114 → `TEST_CARDS_END` 0.8653 | 4194 → 4473 | `TestimonialsLayer`: wheel extra spin → dot field spread → dot-matrix line-drawing of testimonial sentence → individual quote cards |
| **Request-Your-Gym form** | 0.8653 → ~ 0.95 | 4473 → ~4910 | `<RequestGymForm>` rendered. `<BottomSilhouettes>` bouncy entrance |
| **Footer auto-play** | once the latch trips at ~0.95+ | — | 6 dots converge into "Fitness AI that knows your gym" sentence. **Time-based, NOT scroll-tied** (uses `useTime` past the latch). Wheel keeps spinning post-latch |

### Path-aware nav anchors (`lib/scrollTargets.ts`)

- `SCROLL_TARGETS.howItWorks = 1360 vh` (lands user roughly at moment 13 — top-left menu fully formed)
- `SCROLL_TARGETS.testimonials = 4500 vh` (lands inside the testimonials phase)
- Nav + SiteFooter use these via `scrollToVh()`. On mobile, they first try `document.getElementById("mobile-hiw" / "mobile-testimonials")` and fall back to the vh target

---

## 7. MotionValues registry (current — additions since 2026-05-29 in **bold**)

Listed in render order in `ScrollSequence.tsx`.

| Name | Source | Range | Drives |
|---|---|---|---|
| `step1Progress` | raw | `[0, STEP1_LIMIT] → [0, 1]` | All step-1 transforms |
| `ringRotRad`, `logoRotation`, `mergeP`, `boxP`, `pillarsP`, `lineP`, `howItWorksTypeP`, `collapseP`, `tagTextTypeP`, `step1ProgressP`, `step1FadeOutP`, `latPullP`, `placeP` | step1 / raw | various | Step-1 visuals (same as before 2026-05-29) |
| `tapTypeP`, `phoneRiseP`, `phoneTapP`, `step2TransitionP`, `tapTextFadeP`, `tapTextDisplayP` | raw | various | Tap phase + Step 1→2 transition |
| `card1P`, `card2P`, `card3P` | raw | each 0→1 over its sub-phase | TrackingCards line draw (first 60%) + flicker reveal (last 40%) |
| **`step3TransitionP`** | raw | 0→1 over `[CARDS_END, STEP3_TRANSITION_END]` | Dot 2 activation + phone screen swap to ExerciseRedprintView |
| **`learn1P / learn2P / learn3P`** | raw | each 0→1 over its sub-phase inside `[LEARN_START, LEARN_END]` | Step-3 learning cards stagger reveal |
| **`step4TransitionP`** | raw | 0→1 over `[LEARN_END, STEP4_TRANSITION_END]` | Dot 3 activation |
| **`equipP`** | raw | 0→1 over `[EQUIP_START, EQUIP_END]` | EquipmentCluster gather + AIChatbotView swap-in |
| **`chatP`** | raw | 0→1 over `[CHAT_START, CHAT_END]` | Chatbot conversation animation |
| **`step5TransitionP`** | raw | 0→1 over `[CHAT_END, STEP5_TRANSITION_END]` | Dot 4 activation |
| **`competeP`** | raw | 0→1 over `[STEP5_TRANSITION_END, COMPETE_TITLE_END]` | "Your gym vs. the world" title + screen cycle through Community/GroupChallenge/TierAchievement |
| **`step6TransitionP`** | raw | 0→1 over `[COMPETE_TITLE_END, STEP6_TRANSITION_END]` | Dot 5 activation |
| **`fanP`** | raw | 0→1 over `[STEP6_TRANSITION_END, FAN_END]` | Phone fans into multiple history phones |
| **`progressP`** | raw | 0→1 over `[FAN_END, PROGRESS_END]` | WorkoutHistory analytics reveal |
| **`exitP`** | raw | 0→1 over `[PROGRESS_END, EXIT_END]` | Phones exit; left menu fades |
| **`testWheelExtraP`, `testDotSpreadP`, `testLinesP`, `testCardsP`** | raw | over the testimonials phase | TestimonialsLayer choreography |
| **`footerAutoP`** | **time-based** | latches to 0→1 over its own duration once scroll passes a threshold | Footer "Fitness AI that knows your gym" formation. After the latch trips, `footerSpinDriverP` (also time-based) keeps the wheel spinning |
| **`formTextP`** | time-based, derived from `footerAutoP` | `(v - 0.80) / 0.18` | The sentence text-reveal portion of the footer formation |

---

## 8. Components & props (scroll sequence — incremental changes since 2026-05-29)

### `<LoadingRing>`
- Step-2 / step-3 `…TransitionP` props from before. Now also accepts: `step4TransitionP`, `step5TransitionP`, `step6TransitionP` (each ramps the corresponding dot's opacity 0.5 → 1.0 and lerps it back to its lineY slot)
- Footer-form mode: `footerFormP` prop drives the 6-dot "Fitness AI that knows your gym" formation
- `exitP` prop fades the whole ring during the Step-6 exit

### `<HowItWorksSteps>`
- Same per-dot `step{N}TransitionP` props
- `exitP` fades labels + connectors at end of section

### `<Pillars>`
- Added per-pillar highlight animations:
  - **Tracking pillar**: day-swap (animated day-of-week indicator cycling)
  - **AI pillar**: play-button press animation
  - **Community pillar**: leaderboard row-swap

### `<TrackingCards>` (Step 2)
- Unchanged structurally — props are still `card1P / card2P / card3P`
- Now uses `LEARN_WINDOW` / `LEARN_STAGGER` pattern that's been replicated for Step 3 (likely a sibling `LearnCards` component; check ScrollSequence.tsx for the actual JSX layout — it might be inline)

### `<EquipmentCluster>` (Step 4, new)
- The "gym-specific AI" visualization. A cluster of equipment cards/icons gathers as the user scrolls. The phone next to it shows `AIChatbotView` querying the cluster

### `<TestimonialsLayer>` (new)
- Dot-matrix text reveal: the Bitcount Grid Single font + Canvas character-to-coordinates trick. A field of small dots resolves into a testimonial sentence, then into per-quote cards
- Exports `TESTIMONIALS` — consumed by `MobileHome` for the mobile testimonials section

### `<RequestGymForm>` (new)
- End-of-page full-section form. Posts to `/api/request-gym`. Shares submission handler shape with `RequestGymModal`

### `<BottomSilhouettes>` (new)
- Three fitness silhouettes that bounce up from below the viewport with `easeOutBack` overshoot. There was an outstanding plan to extend the foreground silhouette downward with a solid color rectangle to cover the overshoot-gap that briefly reveals the red footer panel — see `.claude/plans/when-the-silhouettes-pop-crispy-bee.md`. Not implemented yet

### `<OrgCarousel>`
- Wrapper changed from `<motion.div onClick>` → `<motion.button type="button">` to neutralize Chrome's email-autofill heuristic. `aria-label`, `tabIndex`, `disabled` wired so keyboard nav matches visual interactivity

### `<PhoneTap>` (helper in ScrollSequence.tsx)
- Same composite transform approach as 2026-05-29
- Screen content now swaps based on scroll phase — `HomeWorkoutView` → `ExerciseRedprintView` → `AIChatbotView` → `CommunityView` → `GroupChallengeDetailView` → `TierAchievementCongratulationsView` → `WorkoutHistoryAnalysisView`

### `<Hero>` (significant change since last update)
- "Redprint for gyms" CTA renamed to "Contact us" — opens `<ContactModal>`
- "Request your gym" CTA opens `<RequestGymModal>`
- GSAP-controlled elements (front phones, logo mark, org carousel, CTAs) now start at `opacity: 0` from first paint — kills the flash of "scene at rest" between hydration and the opening timeline starting
- Below 680px viewport, switches to a stacked layout (phones on top, text below). `isNarrow` matchMedia listener at `(max-width: 679px)`. Phone width drops from 260px → 170px

---

## 9. Mobile responsive home page (`components/mobile/MobileHome.tsx`)

Below the `md` breakpoint, `<HomePageSwitcher>` renders `<MobileHome>` instead of `<ScrollSequence>`. Pure vertical scroll, no scroll-tied animations.

Sections (in order):
1. **MobileHero** — "Fitness AI that knows your gym" headline, body, Download / Request CTAs, a single featured PhoneFrame (HomeWorkoutView at 260px), org marquee
2. **MobileHowItWorks** — 6 stacked steps (matching the desktop "How it works" labels). Each step has a number, label, headline, description, and a small visual (tag badge or a PhoneFrame at 220px showing the relevant screen)
3. **MobilePillars** — vertical stack of the three pillars
4. **MobileTestimonials** — vertical stack of testimonial cards. Reads `TESTIMONIALS` array from `TestimonialsLayer`
5. **MobileFinalCTA** — Download / Request / Contact buttons
6. **SiteFooter** (shared)

Modals: `<RequestGymModal>`, `<ContactModal>`, `<DownloadModal>` are mounted at the `<MobileHome>` level — any inner button can open them by calling `setRequestOpen(true)` etc.

`MobileMenuDrawer` is opened by the Nav hamburger (NOT MobileHome's responsibility). It surfaces How it works, Testimonials, Contact, Download, Sign in.

### First-paint flash elimination

`app/page.tsx` reads `User-Agent` server-side via `next/headers` and passes `initialView` to `<HomePageSwitcher>`. SSR ships the correct tree — no flash of desktop on mobile or vice versa. Client `matchMedia` listener still runs to handle browser-resize.

This makes the home page dynamically rendered (not statically cached) because `headers()` opts out of static. Acceptable for a marketing site at current traffic.

---

## 10. Modals + Resend email integration

### Modal shape (all three follow the same template)
- `<motion.div>` backdrop + `<motion.div>` card with `stopPropagation()`
- `pointer-events-auto` on the outer container — defensive against `pointer-events-none` parents (Nav uses `pointer-events-none` to let scroll through)
- Backdrop is a `<div>` (not a `<button>`) — dismissal gesture, not button activation
- Close X has explicit `stopPropagation()` + `type="button"`
- ESC handler + body scroll lock via `useEffect`

### `<RequestGymModal>`
- Member/Owner toggle. Owner label is **"I represent a gym"** (was "I'm a gym owner")
- Three required fields: gym name, location, email
- Honeypot input named `company`, visually hidden, treated as bot signal server-side
- Posts to `/api/request-gym`
- All em-dashes removed from copy ("48 hours. No demo decks…", "Thanks. We'll be in touch.", "keep scrolling. There's more…")

### `<ContactModal>`
- Name, email, message
- Posts to `/api/contact`
- The label was corrected from "You message" → "Your message"

### `<DownloadModal>`
- Two QR codes (App Store, Play Store) above two clickable store pills
- Pills link to the real URLs from `lib/constants.ts`:
  - `APP_STORE_URL = https://apps.apple.com/us/app/redprint/id1539200045`
  - `PLAY_STORE_URL = https://play.google.com/store/apps/details?id=com.redprint.fitness`

### API routes

`/api/request-gym` and `/api/contact` are server-only POST handlers. Validate, honeypot-check, fire Resend send, optional Slack webhook.

**Required env vars** (set on Vercel for Production + Preview, Sensitive ON for API_KEY only):

```
RESEND_API_KEY              re_… (sending-access key scoped to tapredprint.com)
REQUEST_GYM_FROM_EMAIL      Redprint <hello@tapredprint.com>
REQUEST_GYM_REPLY_TO_EMAIL  mheitz@redprintfit.com
REQUEST_GYM_CONTACT_EMAIL   mheitz@redprintfit.com
REQUEST_GYM_FOUNDER_EMAIL   mheitz@redprintfit.com
```

The site sends From `@tapredprint.com` (the only domain Resend can verify — see §15 for why redprintfit.com couldn't be used), with Reply-To set to `@redprintfit.com` so replies land in the real inbox.

### Email templates (`lib/email/templates.ts`)

- `founderNotifyTemplate(submission)` → sent to `REQUEST_GYM_FOUNDER_EMAIL` when a submission comes in
- `memberAutoReplyTemplate(submission)` → auto-reply when role = member
- `ownerAutoReplyTemplate(submission)` → auto-reply when role = owner
- `contactNotifyTemplate(submission)` → sent to `REQUEST_GYM_CONTACT_EMAIL` for Contact form submissions

All em-dashes removed across templates. Logo dimensions set to 160×32 (was 140×32 which compressed the natural 5.04:1 aspect ratio). Calendly URL is `https://calendly.com/mikeheitz/30min`.

### Dev preview

`/email-preview` (page) + `/api/email-preview` (route) — visit `/email-preview?t=owner` etc. to render any template in the browser.

---

## 11. Legal pages (`/privacy`, `/terms`)

Shared layout component: `components/legal/LegalPage.tsx`. Centered narrow column, title + "Last updated" header, prose styling via descendant arbitrary variants on a single wrapper div, `SiteFooter` below.

### `/privacy` (`app/privacy/page.tsx`)
- Source: the canonical Privacy Policy from `https://www.redprintfit.com/privacy` (the live URL had real text in the rendered page even though raw HTML scrape was empty)
- Fixes applied:
  - Company address: `1576 Sweet Home Rd Suite 209#7` → `1576 Sweet Home Rd, Suite 209 #7, Buffalo, NY 14228`
  - Country definition: `New York, United States` → `United States` (NY is a state)
  - Contact email: `redprintfit@gmail.com` → `info@redprintfit.com`
  - Last updated: bumped to June 5, 2026 (material change due to new sections)
- **New sections added:**
  - "Your Rights Under the GDPR" — 8 enumerated rights, legal-basis paragraph, international-transfers paragraph (Standard Contractual Clauses)
  - "Your Rights Under the CCPA" — 6 enumerated rights, explicit "we do not sell" statement, categories of PI collected in last 12 months, request submission instructions (45-day response window)

### `/terms` (`app/terms/page.tsx`)
- Source: canonical Terms of Use from old `https://www.redprintfit.com/termsofuse`
- Fixes:
  - Email → `info@redprintfit.com` (5 occurrences)
  - Address → full with Buffalo NY 14228
  - Phone → `(518) 925-4051` (was `5189254051`)
  - §15 Privacy URL → relative `/privacy` link
  - §20 grammar: `more than one (1) years` → `more than one (1) year`
  - §20 venue: `United States of America, New York` → `the State of New York, United States`
  - Table of contents removed (29 H2 headings serve the same nav purpose)
  - Last updated → June 5, 2026

### Source-of-truth markdown files

On the user's desktop:
- `/Users/michaelheitz/Desktop/Redprint Privacy Policy.md` — canonical markdown for in-app porting
- `/Users/michaelheitz/Desktop/Redprint Terms of Service.md` — canonical markdown for in-app porting

Each has a "Source of truth" preamble + "Changelog vs. previous version" trailer (notes for the iOS-team Claude window, NOT user-facing content). Companion prompt was prepared to hand to the iOS Claude window so it can replace the in-app `TermsAndConditionsView` and create a new `PrivacyPolicyView`.

---

## 12. Nav + Footer (`components/layout/`)

### `<Nav>`
- Fixed top, `pointer-events-none` so scroll passes through, with interactive children setting `pointer-events-auto`
- **Desktop (≥ md):** Redprint wordmark (CSS-masked PNG so it flips with theme via currentColor) → How it works / Testimonials / Download / Sign in / ThemeToggle. Gap is `gap-6` for outer items, `gap-3` for Download/Sign-in/Theme cluster
- **Mobile (< md):** Download pill + hamburger
- "How it works" and "Testimonials" use the path-aware smart-scroll pattern:
  - On `/`: `document.getElementById("mobile-hiw" / "mobile-testimonials")` if present (mobile anchors), else `scrollToVh(SCROLL_TARGETS.howItWorks / .testimonials)` (desktop vh targets)
  - On other routes: `router.push("/#hiw" / "/#testimonials")` — handled by `HashScrollTarget` on home mount
- Mounts `<DownloadModal>`, `<ContactModal>`, `<MobileMenuDrawer>`

### `<SiteFooter>`
- Now a client component (was server) — `"use client"` because it owns modal state + smart-scroll handlers
- **PRODUCT column**: How it works → smart-scroll; Testimonials → smart-scroll; Web app (still points at dead `#web-app` anchor — open question for follow-up)
- **COMPANY column**: Contact → opens `<ContactModal>`
- **CONNECT column** (social): Instagram → `https://www.instagram.com/tapredprint/`, TikTok → `https://www.tiktok.com/@redprintfit`, LinkedIn → `https://www.linkedin.com/company/redprint-inc/`. All open in new tab (`target="_blank" rel="noopener noreferrer"`)
- **QR/store pills** on the right: each `<StoreColumn>` now wraps in an `<a>` linking to the real store URL (was a non-interactive `<div>`)
- **Bottom row**: © 2026 Redprint, Inc. + Privacy Policy `/privacy` + Terms of Service `/terms`

---

## 13. Favicon + theme defaults

### Circular SVG favicons (`public/favicon-{light,dark}.svg`)
- Source: `Redprint Files/Marketing/New Wesbite Design/Redprint logos bw/redprint_logo_{light,dark}.png` (1156×1156 RGBA PNGs)
- SVG wraps the source PNG (embedded as base64) with a `<clipPath>` circle → corners become transparent, browser-side
- File size: ~32KB each (base64 overhead ~33% over the source PNG). Browsers cache favicons forever — one-time cost
- Wired via `metadata.icons` in `app/layout.tsx` with `media: "(prefers-color-scheme: {light,dark})"` so the browser picks the right one based on the OS theme
- Old `app/favicon.ico` (Next default) removed

### System-theme default

`noFlashScript` in `app/layout.tsx` runs before any markup paints:
- If `localStorage.theme` is `'light'` or `'dark'` → use it (user has manually overridden via ThemeToggle)
- Else read `matchMedia('(prefers-color-scheme: dark)').matches` and use that
- If both throw (private mode, etc.) → fall back to `'dark'`

ThemeToggle still writes `localStorage.theme` on click. So:
- New visitor in dark-mode OS → dark site
- New visitor in light-mode OS → light site
- Returning visitor who clicked the toggle → their stored choice always wins

**Note:** the site does NOT currently re-evaluate the OS preference live (would need a `matchMedia` listener gated on "no localStorage override"). If the user changes their OS theme while the tab is open, the site doesn't update until refresh. Acceptable for now; ~10 lines to add live-update later.

---

## 14. Deployment & DNS state

### Vercel project: `redprint-web`
- GitHub repo: `https://github.com/redprintfit/redprint-web`
- Auto-deploys from `main`
- Production URL: `https://www.tapredprint.com` (also `https://tapredprint.com`, `https://redprint-web.vercel.app`)
- Environment variables: see §10 list above. All five are configured on Production + Preview

### DNS for `tapredprint.com` (GoDaddy)
- Pointed at Vercel via the standard A / CNAME setup
- Resend auto-configured the DNS via GoDaddy OAuth — domain is **verified** in Resend (DKIM TXT + MX `send` + SPF TXT + optional DMARC TXT all green)

### DNS for `redprintfit.com` (Wix — still primary)
- Nameservers `ns14.wixdns.net`, `ns15.wixdns.net` — not migrated
- **Wix DNS does not support MX records on subdomains**, which Resend requires. So Resend could not be verified against `redprintfit.com` while it's hosted on Wix
- Long-term options if the user wants emails to come from `@redprintfit.com`:
  1. Transfer the domain registration out of Wix (Cloudflare Registrar, Porkbun, etc.), then manage DNS at the new registrar. Wix site can stay live by adding A records pointing at Wix's IPs
  2. Subdomain delegation: NS-delegate a subdomain (e.g. `mail.redprintfit.com`) to Cloudflare in Wix's DNS panel. From address becomes `team@mail.redprintfit.com` — workable but ugly
- For now: From address is `Redprint <hello@tapredprint.com>` with `Reply-To: mheitz@redprintfit.com` so replies still go to the real inbox

---

## 15. Theme system (unchanged from 2026-05-29 except where noted)

- `<html data-theme="dark|light">` toggled by `ThemeToggle`
- Tailwind v4 `@custom-variant light` defined in `app/globals.css`
- Color tokens: `--color-bg-base`, `--color-fg-base`
- `useTheme()` hook in `lib/useTheme.ts` reads the attribute
- **New:** `data-theme` initial value now respects OS `prefers-color-scheme` instead of always defaulting to dark (see §13)

---

## 16. Session history (everything new since 2026-05-29)

Roughly chronological. The bulk of this was multiple sessions before the most recent one; the most recent session was email/DNS/deploy/legal/favicon polish.

### Scroll sequence (Steps 3 → 6 + post)

1. **Step 3 (ON-DEMAND LEARNING) built.** `step3TransitionP`, `learn{1,2,3}P`, `LEARN_START / LEARN_END`. Phone screen swap to `ExerciseRedprintView`. Three learning cards on the right
2. **Step 4 (GYM-SPECIFIC AI) built.** Two sub-phases (`equipP`, `chatP`). New `<EquipmentCluster>` component. Phone shows `AIChatbotView`
3. **Step 5 (COMPETE/COMMUNITY) built.** `competeP` cycles the phone through `CommunityView` → `GroupChallengeDetailView` → `TierAchievementCongratulationsView`. Captions: "Monthly gym leaderboard", "Form groups with friends", "Earn rewards from your gym"
4. **Step 6 (VISUALIZE PROGRESS) built.** Phone fan → multiple `WorkoutHistoryAnalysisView` instances + chart reveals
5. **Exit phase added.** `EXIT_END = 0.8114`. Phones + left menu fade out
6. **Testimonials section built.** `<TestimonialsLayer>`. Bitcount Grid Single dot-matrix font + canvas character-to-coordinates trick. Dots route to per-letter targets, then collapse to per-quote cards. Exports `TESTIMONIALS` array
7. **Request-Your-Gym form section built.** End-of-page `<RequestGymForm>` rendered at scroll bottom
8. **Bottom silhouettes added.** Three fitness silhouettes bouncing up from below with `easeOutBack` overshoot
9. **Footer auto-play "latch".** Once scroll crosses the threshold, the formation animation runs on time (NOT scroll-tied) via `useTime`. Wheel keeps spinning post-latch via `footerSpinDriverP`. `formTextP = (v - 0.80) / 0.18` (was 0.58/0.241 — tightened the text-reveal window)
10. **Pillar highlight system.** Per-pillar animations: day-swap, play-button press, leaderboard swap
11. **Many vh-reduction passes across moments 1–39.** `TOTAL_VH` shrunk 5525 → 5269. Per memory: when reducing vh in ScrollSequence, the saved vh must shrink TOTAL_VH — never flow into another phase (especially not the trailing footer). The CSV at `~/Desktop/redprint_scroll_sequence.csv` is NOT auto-updated after timing changes — only update it when explicitly asked

### Marketing-site infrastructure (entirely new for this doc)

12. **Modals built.** `<RequestGymModal>`, `<ContactModal>`, `<DownloadModal>`. All with backdrop + stopPropagation pattern. `pointer-events-auto` override to defeat Nav's `pointer-events-none`
13. **Resend wired.** `/api/contact`, `/api/request-gym`. Honeypot, validation, founder notification, auto-reply, optional Slack webhook. Templates in `lib/email/templates.ts`. Dev preview at `/email-preview`
14. **`tapredprint.com` set up.** GoDaddy DNS → Vercel. Auto-configured DNS for Resend via GoDaddy OAuth. Domain verified, sending live
15. **Wix → Cloudflare DNS migration attempted for `redprintfit.com`, abandoned.** Wix wouldn't allow nameserver edits while the domain is assigned to a site; user needs to keep it assigned. Even adding records in Wix directly was blocked because Wix doesn't support subdomain MX (Resend requirement). Pivot: use `tapredprint.com` as the sending domain, set Reply-To to `mheitz@redprintfit.com` so replies still land in the real inbox
16. **App store URLs corrected.** `lib/constants.ts`. Apple: `apps.apple.com/us/app/redprint/id1539200045`. Play: `play.google.com/store/apps/details?id=com.redprint.fitness`
17. **Mobile responsive home page built.** `MobileHome` (5 sections), `HomePageSwitcher` (viewport gate), `MobileMenuDrawer` (hamburger overlay)
18. **Mobile-only HomePageSwitcher SSR fix.** First implementation returned `null` from SSR; iPhone showed a blank body. Switched to default `"mobile"` so SSR ships content. Later, switched again to server-side UA detection in `app/page.tsx` so desktop visitors don't see a flash of mobile and vice versa
19. **Nav rewrite.** Added Download pill before Sign in. Mobile variant added (Download + hamburger). Spacing tightened. Wordmark click → smooth scroll-to-top via Lenis
20. **Footer rewrite.** Removed "For gyms" and "Pricing". Added "Testimonials". Smart-scroll for How it works + Testimonials. Contact → opens `ContactModal`. Real Instagram / TikTok / LinkedIn URLs. QR pills + store badges now clickable
21. **Force-reload on back-navigation.** `popstate` listener in `LenisProvider` — reloads the page so the user doesn't land mid-scroll-state on a previously-scrolled-through home page
22. **OrgCarousel autofill fix.** `<motion.div onClick>` → `<motion.button type="button">`. Chrome was popping up email-autofill suggestions when the user clicked logos. `type="button"` neutralizes the heuristic. `aria-label`, `tabIndex`, `disabled` wired up
23. **Hero `Redprint for gyms` → `Contact us`.** Now opens `ContactModal`
24. **RequestGymModal: "I'm a gym owner" → "I represent a gym".** Em-dashes removed across modal copy
25. **Legal pages built.** `/privacy` and `/terms` with shared `<LegalPage>` layout. Privacy Policy ported from old `redprintfit.com/privacy` with three fixes + new GDPR + CCPA sections. Terms ported from old `redprintfit.com/termsofuse` with multiple fixes. Source-of-truth markdown files on the user's desktop for the iOS team
26. **Favicon: circular SVGs with media queries.** Replaces Next default. Light/dark variants picked via `prefers-color-scheme`
27. **System-theme default.** `noFlashScript` now reads OS preference if no localStorage override. ThemeToggle still wins
28. **First-paint flash fixes.**
    - HomePageSwitcher: UA-based SSR initial view → no flash of wrong layout
    - Hero GSAP-controlled elements: `initial={{ opacity: 0 }}` on motion phones + `opacity-0` class on logo mark / org carousel / CTAs wrappers → no flash of "scene at rest" before GSAP timeline starts

### Deploy

29. **Vercel deployment configured.** Production = `tapredprint.com`. Env vars set. Auto-deploys from `main`
30. **Multiple successful pushes:**
    - `ad3a8aa` mobile responsive
    - `0a0a6e9` modals + Resend + footer rewrite + content fixes
    - `164fd97` legal pages
    - `b8be928` OrgCarousel TS fix (autoComplete prop removed)
    - `8b69d7d` circular favicon + system-theme default
    - `d50ba8b` Hero/HomePageSwitcher flash fixes

---

## 17. Where we left off

Last action: pushed `8b69d7d` + `d50ba8b` to `main`. Vercel auto-deployed. Site is live at `tapredprint.com` with:
- Circular SVG favicons responding to OS theme
- Site default theme follows OS preference (manual ThemeToggle override wins)
- No flash of mobile-on-desktop or desktop-on-mobile (UA-based SSR)
- No flash of Hero "scene at rest" before GSAP opening animation

**What's working:**
- All 6 scroll-sequence steps
- Mobile responsive page
- Contact + Request-Gym forms (Resend verified, sending from `hello@tapredprint.com`)
- Legal pages (`/privacy`, `/terms`)
- Footer (smart scroll, real social URLs, clickable store pills)

**What's NOT done:**
- `redprintfit.com` DNS is still on Wix → emails will continue coming from `tapredprint.com` until that's resolved
- "Web app" footer link still points at dead `#web-app` anchor
- iOS app legal text still references old EULA — handoff prompt is ready, needs to be pasted into the iOS-team Claude window
- The silhouette-overshoot gap (plan at `.claude/plans/when-the-silhouettes-pop-crispy-bee.md`) is not yet applied
- CCPA/GDPR sections in Privacy Policy should be reviewed by counsel before relying on them
- No live-update listener for OS theme change while the tab is open

---

## 18. Known issues / things to revisit

1. **Web app footer link** — `<a href="#web-app">` is a dead anchor. Likely should point at `https://app.redprintfit.com` (= `WEB_APP_URL` in `lib/constants.ts`) or be removed entirely
2. **Silhouette bounce-in gap** — at the end of the section, the foreground fitness silhouette overshoots its rest position via `easeOutBack`, briefly revealing the red footer panel underneath. Plan exists in `.claude/plans/when-the-silhouettes-pop-crispy-bee.md` — wrap the silhouette img in a motion.div that includes a 200px tall extension below it, colored `bg-black light:bg-white`. Glued to the silhouette's bottom edge so it moves with the bounce
3. **`headers()` in `app/page.tsx` opts out of static rendering.** Acceptable now; if traffic grows and TTFB matters, consider middleware-based viewport hint cookies or pre-rendering both trees with CSS-driven swap
4. **`TypewriterText` `reverse` mode** is unused — kept in the component for future use
5. **Composite transform order in `<PhoneTap>`** is fragile (works but conflicts if anything else touches `x`/`y` directly)
6. **No accessibility pass.** No aria audit, no focus management on modals beyond ESC + backdrop, no `prefers-reduced-motion` honoring
7. **Hydration mismatch on `data-theme`** — harmless, pre-existing. Logs only show in dev

---

## 19. Tunable knobs

### Scroll sequence
| To change… | Edit |
|---|---|
| Total scroll length | `TOTAL_VH` in `ScrollSequence.tsx`. Remember to shrink (never grow into the footer) per memory |
| Step-1 share of timeline | `STEP1_LIMIT` |
| Step 2 cards stagger | `CARDS_START / CARDS_END` |
| Step 3 cards stagger | `LEARN_WINDOW`, `LEARN_STAGGER` |
| Step 4 split between equipment + chat | `EQUIP_END` (also = `CHAT_START`) |
| Step 5 caption swap timing | `COMPETE_TITLE_END` |
| Step 6 fan-vs-progress split | `FAN_END` (also = `PROGRESS_START`) |
| Section exit duration | `EXIT_END` |
| Testimonials phase | `TEST_WHEEL_EXTRA_END`, `TEST_DOT_SPREAD_END`, `TEST_LINES_END`, `TEST_CARDS_END` |
| Footer formation text-reveal window | `formTextP = (v - 0.80) / 0.18` |
| Anchor targets (Nav / Footer scroll) | `SCROLL_TARGETS` in `lib/scrollTargets.ts` |
| Phone post-transition x/y/scale | `<PhoneTap>` composite transform in ScrollSequence.tsx |
| Card-line vs card-flicker split | `CARD_LINE_FRAC` (default 0.6) |
| Card horizontal position | `right: 5vw` / `width: min(440px, 36vw)` in `<CardSlot>` |
| Centre tag target on equipment | `placeTarget={{x:"73.8%", y:"51%"}}` |
| Order of menu steps | `LABELS` array in `HowItWorksSteps.tsx` |

### Email + modals
| To change… | Edit |
|---|---|
| From address | `REQUEST_GYM_FROM_EMAIL` Vercel env var |
| Reply-To target | `REQUEST_GYM_REPLY_TO_EMAIL` Vercel env var |
| Where notifications go | `REQUEST_GYM_CONTACT_EMAIL` + `REQUEST_GYM_FOUNDER_EMAIL` |
| Email body / styling | `lib/email/templates.ts` |
| Calendly link in owner auto-reply | `https://calendly.com/mikeheitz/30min` in `templates.ts` |
| Modal copy | Respective `…Modal.tsx` |
| App store URLs | `lib/constants.ts` |

### Theme + favicon
| To change… | Edit |
|---|---|
| Default theme behavior | `noFlashScript` in `app/layout.tsx` |
| Favicon images | `public/favicon-{light,dark}.svg` (regenerate via the base64-embed pattern) |
| Mobile breakpoint for HomePageSwitcher | `(max-width: 767px)` in `HomePageSwitcher` and the UA regex in `app/page.tsx` |

---

## 20. Next steps (proposed scope)

1. **Resolve the `redprintfit.com` DNS situation** — transfer registrar out of Wix so Resend can be verified there and emails can come from `@redprintfit.com` instead of `@tapredprint.com`
2. **Hand the legal-docs prompt to the iOS Claude window** to update the in-app `TermsAndConditionsView` and create the new `PrivacyPolicyView` — both pulling text from the canonical markdown files on the desktop
3. **Decide on the "Web app" footer link** — point at `https://app.redprintfit.com` or remove
4. **Apply the silhouette-overshoot gap fix** per `.claude/plans/when-the-silhouettes-pop-crispy-bee.md`
5. **Counsel review of GDPR + CCPA sections** before relying on them
6. **Optional polish:**
   - Live OS-theme listener (re-evaluate on `(prefers-color-scheme)` change when no localStorage override)
   - Open Graph image (`<meta property="og:image">`) so link previews on Slack / iMessage / Twitter show a real preview rather than generic
   - Accessibility audit + `prefers-reduced-motion` honoring
   - Smoke-test the deploy: submit Contact + Request-Gym forms from `tapredprint.com`, verify emails land in `mheitz@redprintfit.com` and auto-replies fire

---

## 21. Quick scroll-through reference

| Phase to inspect | scrollY (raw) |
|---|---|
| Hero static | top |
| Pillars cards | inside step1 |
| Line forms in top-left | inside step1 |
| Tags appear / "Interactive Redprint…" typed | inside step1 |
| Lat-pulldown peak zoom | inside step1 |
| Tap text + impact | 0.33 → 0.36 |
| Step 1 → 2 transition (phone reposition) | 0.37 → 0.39 |
| Step 2 cards (SPEED / MEMORY / DEPTH) | 0.39 → 0.43 |
| Step 3 cards (LEARN) | 0.48 → 0.52 |
| Step 4 equipment + chat | 0.55 → 0.59 |
| Step 5 compete | 0.63 → 0.65 |
| Step 6 fan + progress | 0.70 → 0.75 |
| Section exit | 0.75 → 0.81 |
| Testimonials | 0.81 → 0.87 |
| Request-Gym form + silhouettes | 0.87 → 0.95 |
| Footer auto-play | 0.95 + |
| End of scroll | bottom |

Inspect actual scroll fraction in DevTools console:
```js
document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight)
```
