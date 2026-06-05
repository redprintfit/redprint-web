"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type MotionValue } from "framer-motion";
import { gsap } from "gsap";
import { orgs, darken, lighten, type Org } from "@/lib/content/orgs";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { ExerciseRedprintView } from "@/components/phone/screens/ExerciseRedprintView";
import { AIChatbotView } from "@/components/phone/screens/AIChatbotView";
import { CommunityView } from "@/components/phone/screens/CommunityView";
import { HomeWorkoutView } from "@/components/phone/screens/HomeWorkoutView";
import { FinishedWorkoutSummaryView } from "@/components/phone/screens/FinishedWorkoutSummaryView";
import { OrgCarousel } from "@/components/sections/OrgCarousel";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { RedprintMark } from "@/components/RedprintMark";
import { RequestGymModal } from "@/components/RequestGymModal";
import { ContactModal } from "@/components/ContactModal";

const HEADLINE = "Fitness AI that knows your gym";
const TICK_ORG_MS = 5000;
const TICK_PHONE_MS = 10000;

/** Single duration + easing reused across bg, carousel, phone slot transitions. */
const ROTATION_DURATION = 0.6;
const ROTATION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SCREENS = [
  { id: "home-workout", Component: HomeWorkoutView },
  { id: "ai-chatbot", Component: AIChatbotView },
  { id: "exercise-redprint", Component: ExerciseRedprintView },
  { id: "workout-summary", Component: FinishedWorkoutSummaryView },
  { id: "community", Component: CommunityView },
] as const;

/**
 * 5 slots — 3 visible (front / mid-fan / back-fan), 2 hidden (off-stage left).
 * Phones cycle through all 5 positions; only the first three are visible.
 */
/**
 * Slot transforms. `narrow` shrinks the fan offsets so they're proportional
 * to the smaller phone width used in the stacked layout (≈200px vs 260px).
 */
function slotTransforms(slide: number, narrow: boolean) {
  const k = narrow ? 0.65 : 1; // 170/260 ≈ 0.65
  // `y: 0` is explicit so the fan phones' GSAP initial `y: 60` (the
  // rise-up offset for the front phone) doesn't carry over to them.
  return [
    { x: -slide, y: 0, rotate: 0, scale: 1, opacity: 1 }, // 0: front
    { x: -slide - 60 * k, y: 0, rotate: -12, scale: 0.9, opacity: 1 }, // 1: mid-fan
    { x: -slide - 115 * k, y: 0, rotate: -24, scale: 0.8, opacity: 1 }, // 2: back-fan
    { x: -slide - 180 * k, y: 0, rotate: -36, scale: 0.7, opacity: 0 }, // 3: hidden
    { x: -slide - 240 * k, y: 0, rotate: -48, scale: 0.6, opacity: 0 }, // 4: hidden
  ];
}
const SLOT_Z = [40, 30, 20, 10, 0];

/**
 * Optional scroll-driven props. When `ScrollSequence` wraps Hero, it pipes
 * MotionValues down for the logo's rotation/opacity (so the logo can spin
 * with the scroll, then fade as a loading-mode BlobAvatar takes over).
 * `logoSlotRef` exposes the logo's DOM node so the parent can measure its
 * on-screen position and place the BlobAvatar overlay exactly on top.
 */
type HeroProps = {
  logoRotation?: MotionValue<number>;
  logoOpacity?: MotionValue<number>;
  logoSlotRef?: React.Ref<HTMLDivElement>;
};

export function Hero({ logoRotation, logoOpacity, logoSlotRef }: HeroProps = {}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frontPhoneRef = useRef<HTMLDivElement>(null);
  const fanLeftRef = useRef<HTMLDivElement>(null);
  const fanRightRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);

  const [orgTick, setOrgTick] = useState(0);
  const [phoneTick, setPhoneTick] = useState(0);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [typingStarted, setTypingStarted] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);

  // The side-by-side text column shrinks as the viewport narrows (its width
  // is `min(580px, calc(50% - 50px))`, so the gap between the front phone
  // and the text never collapses). Below ~680px even the widest word in the
  // headline ("Fitness") no longer fits in that shrinking column — at that
  // point we switch to a stacked layout, phones on top, and recentre the
  // phones (slide=0) so they fan out from the horizontal middle instead of
  // being shifted left.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 679px)");
    const update = () => setIsNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const slide = isNarrow ? 0 : 220;
  const slideRef = useRef(slide);
  const isNarrowRef = useRef(isNarrow);
  useEffect(() => {
    slideRef.current = slide;
    isNarrowRef.current = isNarrow;
  }, [slide, isNarrow]);

  // Active org derived from org tick (5s).
  const activeOrg: Org = orgs[orgTick % orgs.length];

  // Drive page bg from active org. Set both pre-computed tints so CSS can
  // pick the right one based on the user's system color-scheme preference.
  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--org-bg-dark", darken(activeOrg.primaryColor, 75));
    root.setProperty("--org-bg-light", lighten(activeOrg.primaryColor, 80));
    return () => {
      root.removeProperty("--org-bg-dark");
      root.removeProperty("--org-bg-light");
    };
  }, [activeOrg]);

  // Opening sequence: plays once when section enters viewport.
  useEffect(() => {
    if (!sectionRef.current) return;

    let played = false;
    const phoneRefs = [
      frontPhoneRef.current,
      fanLeftRef.current,
      fanRightRef.current,
    ];

    // Initial state — front 3 phones invisible at viewport center, full scale.
    gsap.set(phoneRefs, { opacity: 0, y: 60, x: 0, rotate: 0, scale: 1 });
    gsap.set(markRef.current, { opacity: 0, x: -40 });
    gsap.set(carouselRef.current, { opacity: 0, y: 30 });
    gsap.set(ctasRef.current, { opacity: 0, y: 20 });

    const play = () => {
      if (played) return;
      played = true;

      const targets = slotTransforms(slideRef.current, isNarrowRef.current);
      const tl = gsap.timeline({
        onComplete: () => setOpeningDone(true),
      });

      tl.to(frontPhoneRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
      });
      tl.to({}, { duration: 0.4 });
      tl.to(
        frontPhoneRef.current,
        { ...targets[0], duration: 1, ease: "power3.out" },
        "shift",
      );
      tl.to(
        fanLeftRef.current,
        { ...targets[1], duration: 1, ease: "power3.out" },
        "shift",
      );
      tl.to(
        fanRightRef.current,
        { ...targets[2], duration: 1, ease: "power3.out" },
        "shift",
      );
      tl.to(
        markRef.current,
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out" },
        "shift",
      );
      // Typing kicks off mid-shift.
      tl.call(() => setTypingStarted(true), [], "shift+=0.3");

      // Carousel + CTAs hold off until the headline finishes typing.
      // Typing math: pre-blink (0.6s) + chars × speed (42ms × 31 chars ≈ 1.3s).
      // Start typing at shift+0.3, so typing completes ~shift+2.2s.
      tl.to(
        carouselRef.current,
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        "shift+=2.3",
      );
      tl.to(
        ctasRef.current,
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "<",
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) play();
      },
      { threshold: 0.3 },
    );
    observer.observe(sectionRef.current);

    // Failsafe: on navigation-back (or any case where the observer flow
    // doesn't reach play()), force the final state so the phones don't
    // stay at their default unstyled positions forever.
    const failsafe = window.setTimeout(() => {
      if (!played) {
        played = true;
        setTypingStarted(true);
        setOpeningDone(true);
      }
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Independent ticks — both start after opening completes.
  useEffect(() => {
    if (!openingDone) return;
    const o = setInterval(() => setOrgTick((t) => t + 1), TICK_ORG_MS);
    const p = setInterval(() => setPhoneTick((t) => t + 1), TICK_PHONE_MS);
    return () => {
      clearInterval(o);
      clearInterval(p);
    };
  }, [openingDone]);

  const targets = slotTransforms(slide, isNarrow);

  // Each phone's slot = (screenIndex - phoneTick) mod N (5).
  // Slots 0/1/2 are visible front/mid/back; 3/4 are hidden off-stage.
  const slotForScreen = (screenIndex: number) =>
    (((screenIndex - phoneTick) % SCREENS.length) + SCREENS.length) %
    SCREENS.length;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[var(--paper-opacity)]"
        style={{
          backgroundImage: "url(/textures/paper.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative z-10 mx-auto h-full max-w-7xl">
        {/* Phones — full container at ≥680px, top ~52% of section below
            that, so they always sit above (and never overlap) the text. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[48%] flex items-center justify-center min-[680px]:inset-0">
          {SCREENS.map(({ id, Component }, i) => {
            const slot = slotForScreen(i);
            // Refs only used during opening sequence (slots 0/1/2 get the
            // three refs). After openingDone, Framer drives by slot.
            const ref =
              slot === 0
                ? frontPhoneRef
                : slot === 1
                  ? fanLeftRef
                  : slot === 2
                    ? fanRightRef
                    : null;
            return (
              <motion.div
                key={id}
                ref={openingDone ? undefined : (ref ?? undefined)}
                className={`absolute ${slot < 3 && openingDone ? "pointer-events-auto cursor-pointer" : ""}`}
                onClick={() => {
                  // Click on a visible (non-front) phone promotes it to
                  // the front slot. Slot 0 (already front) is a no-op.
                  if (openingDone && slot > 0 && slot < 3) setPhoneTick(i);
                }}
                // Slots 0/1/2 are managed by GSAP during the opening.
                // Match GSAP's `set()` initial state here so the elements
                // render invisible from first paint — without this, the
                // phones flash in their resting position between
                // hydration and the GSAP timeline starting. Slots 3/4 are
                // off-stage (opacity 0) the whole time.
                initial={slot >= 3 ? targets[slot] : { opacity: 0, y: 60 }}
                animate={openingDone ? targets[slot] : undefined}
                transition={{ duration: ROTATION_DURATION, ease: ROTATION_EASE }}
                style={{ zIndex: SLOT_Z[slot] }}
              >
                <PhoneFrame width={isNarrow ? 170 : 260}>
                  <Component org={activeOrg} />
                </PhoneFrame>
              </motion.div>
            );
          })}
        </div>

        {/* Text column — right side at ≥680px, bottom slab below that. On
            narrow it occupies the lower 48% of the section, mirroring the
            phones' top 52%, so the two never overlap. On wide its width is
            `min(580px, calc(50% - 50px))` — that shrinks the column as the
            viewport narrows, which makes the headline wrap into more lines
            (rather than getting smaller) while preserving a ≥50px gap from
            the front phone. Text and button sizes stay fixed across breakpoints. */}
        <div className="absolute left-4 right-4 top-[52%] bottom-0 flex flex-col items-start justify-start gap-8 min-[680px]:left-auto min-[680px]:right-12 min-[680px]:top-0 min-[680px]:bottom-0 min-[680px]:w-[min(580px,_calc(50%_-_80px))] min-[680px]:justify-center">
          {/* Two-layer wrapper so GSAP (opening fade/slide) and Framer
              Motion (scroll-driven rotate/opacity) don't fight over the
              same inline style. GSAP owns the outer ref; Framer owns the
              inner motion.div. `logoSlotRef` exposes the inner element so
              the scroll-sequence parent can measure where to place a
              BlobAvatar overlay. */}
          <div ref={markRef} className="text-fg-base opacity-0">
            <motion.div
              ref={logoSlotRef}
              style={{ rotate: logoRotation, opacity: logoOpacity }}
            >
              <RedprintMark className="h-16 w-16" />
            </motion.div>
          </div>

          <h1
            className="text-fg-base text-[4.25rem] font-black leading-[1.05] tracking-tight [text-shadow:var(--headline-shadow)]"
            style={{ fontWeight: 900 }}
          >
            <TypewriterText text={HEADLINE} start={typingStarted} />
          </h1>

          <div ref={carouselRef} className="opacity-0">
            <OrgCarousel
              orgs={orgs}
              activeIndex={orgTick % orgs.length}
              onSelect={(newIdx) => setOrgTick(newIdx)}
            />
          </div>

          <div ref={ctasRef} className="mt-6 flex flex-wrap items-center gap-3 opacity-0">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="border-fg-base/30 text-fg-base hover:bg-fg-base/10 inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition"
            >
              Contact us{" "}
              <span className="text-lg leading-none">›</span>
            </button>
            <button
              type="button"
              onClick={() => setRequestModalOpen(true)}
              className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
            >
              Request your gym{" "}
              <span className="text-lg leading-none">›</span>
            </button>
          </div>
        </div>
      </div>
      <RequestGymModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
      <ContactModal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </section>
  );
}
