"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { orgs, darken, type Org } from "@/lib/content/orgs";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { CommunityScreen } from "@/components/phone/screens/CommunityScreen";
import { ExerciseProgressScreen } from "@/components/phone/screens/ExerciseProgressScreen";
import { AnalyticsScreen } from "@/components/phone/screens/AnalyticsScreen";
import { OrgCarousel } from "@/components/sections/OrgCarousel";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { RedprintMark } from "@/components/RedprintMark";

const HEADLINE = "Fitness AI that knows your gym";
const TICK_ORG_MS = 5000;
const TICK_PHONE_MS = 10000;

/** Single duration + easing reused across bg, carousel, phone slot transitions. */
const ROTATION_DURATION = 0.6;
const ROTATION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const SCREENS = [
  { id: "community", Component: CommunityScreen },
  { id: "exercise", Component: ExerciseProgressScreen },
  { id: "analytics", Component: AnalyticsScreen },
] as const;

/** Per-slot transforms (slot 0 = front 100%, 1 = mid-fan 90%, 2 = back-fan 80%). */
function slotTransforms(slide: number) {
  return [
    { x: -slide, rotate: 0, scale: 1 },
    { x: -slide - 60, rotate: -12, scale: 0.9 },
    { x: -slide - 115, rotate: -24, scale: 0.8 },
  ];
}
const SLOT_Z = [30, 20, 10];

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frontPhoneRef = useRef<HTMLDivElement>(null);
  const fanLeftRef = useRef<HTMLDivElement>(null);
  const fanRightRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);

  const [orgTick, setOrgTick] = useState(0);
  const [phoneTick, setPhoneTick] = useState(0);
  const [typingStarted, setTypingStarted] = useState(false);
  const [openingDone, setOpeningDone] = useState(false);
  const [slide, setSlide] = useState(180);
  // Mirror slide into a ref so the opening sequence can read the current
  // value at play time without re-running its effect on resize.
  const slideRef = useRef(slide);
  useEffect(() => {
    slideRef.current = slide;
  }, [slide]);

  // Active org derived from org tick (5s).
  const activeOrg: Org = orgs[orgTick % orgs.length];

  // Drive page bg from active org primary color (darkened 75%).
  useEffect(() => {
    const tint = darken(activeOrg.primaryColor, 75);
    document.documentElement.style.setProperty("--org-bg", tint);
    return () => {
      document.documentElement.style.removeProperty("--org-bg");
    };
  }, [activeOrg]);

  // Compute slide distance based on viewport. Smaller value = phones sit
  // closer to viewport center (closer to the right-side text).
  useEffect(() => {
    const computeSlide = () =>
      setSlide(Math.min(200, window.innerWidth * 0.12));
    computeSlide();
    window.addEventListener("resize", computeSlide);
    return () => window.removeEventListener("resize", computeSlide);
  }, []);

  // Opening sequence: plays once when section enters viewport.
  useEffect(() => {
    if (!sectionRef.current) return;

    let played = false;
    const phoneRefs = [
      frontPhoneRef.current,
      fanLeftRef.current,
      fanRightRef.current,
    ];

    // Initial state — all phones invisible at viewport center, full scale.
    gsap.set(phoneRefs, { opacity: 0, y: 60, x: 0, rotate: 0, scale: 1 });
    gsap.set(markRef.current, { opacity: 0, x: -40 });
    gsap.set(carouselRef.current, { opacity: 0, y: 30 });
    gsap.set(ctasRef.current, { opacity: 0, y: 20 });

    const play = () => {
      if (played) return;
      played = true;

      // Read latest slide value at play-time (not effect-time) so the
      // opening doesn't have to depend on `slide` and re-run on resize.
      const targets = slotTransforms(slideRef.current);
      const tl = gsap.timeline({
        onComplete: () => setOpeningDone(true),
      });

      // 1. Front phone fades in + rises into center
      tl.to(frontPhoneRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
      });

      // 2. Hold
      tl.to({}, { duration: 0.4 });

      // 3. Phones move to their slot positions in parallel.
      //    Front slides slightly left; fan phones rotate + scale down from behind.
      tl.to(
        frontPhoneRef.current,
        { ...targets[0], duration: 1, ease: "power3.out" },
        "shift",
      );
      tl.to(
        fanLeftRef.current,
        { opacity: 1, ...targets[1], duration: 1, ease: "power3.out" },
        "shift",
      );
      tl.to(
        fanRightRef.current,
        { opacity: 1, ...targets[2], duration: 1, ease: "power3.out" },
        "shift",
      );

      // 4. Logo slides in from behind
      tl.to(
        markRef.current,
        { opacity: 1, x: 0, duration: 0.7, ease: "power2.out" },
        "shift",
      );

      // 5. Typing kicks in partway through the shift
      tl.call(() => setTypingStarted(true), [], "shift+=0.3");

      // 6. Carousel + CTAs settle in
      tl.to(
        carouselRef.current,
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        "+=0.4",
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

    return () => observer.disconnect();
    // Intentionally empty deps: opening should run exactly once on mount.
    // Resize-driven slide updates flow through Framer's animate prop, not
    // through replaying the opening sequence.
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

  const targets = slotTransforms(slide);

  // Each phone's slot = (screenIndex - phoneTick) mod 3
  const slotForScreen = (screenIndex: number) =>
    ((screenIndex - phoneTick) % SCREENS.length + SCREENS.length) % SCREENS.length;

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: "url(/textures/noise.png)",
          backgroundSize: "400px",
        }}
      />

      <div className="relative z-10 h-full w-full">
        {/* Phone stage: full-width absolute, phones centered to viewport. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {SCREENS.map(({ id, Component }, i) => {
            const slot = slotForScreen(i);
            const ref =
              slot === 0
                ? frontPhoneRef
                : slot === 1
                  ? fanLeftRef
                  : fanRightRef;
            // We assign refs by SLOT, not by phone — so GSAP's opening
            // sequence (which targets refs) always hits the right phone.
            // After openingDone, Framer drives transforms per-phone-id.
            return (
              <motion.div
                key={id}
                ref={openingDone ? undefined : ref}
                className="absolute"
                initial={false}
                animate={openingDone ? targets[slot] : undefined}
                transition={{ duration: ROTATION_DURATION, ease: ROTATION_EASE }}
                style={{ zIndex: SLOT_Z[slot] }}
              >
                <PhoneFrame className="w-[260px]">
                  <Component org={activeOrg} />
                </PhoneFrame>
              </motion.div>
            );
          })}
        </div>

        {/* Right-side text column — pulled in from the right edge so it
            sits closer to the phone stack. */}
        <div className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col items-start justify-center gap-8 px-6 md:px-12 lg:right-[12vw]">
          <div ref={markRef} className="text-white">
            <RedprintMark className="h-9 w-9" />
          </div>

          <h1
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
            style={{ fontWeight: 800 }}
          >
            <TypewriterText text={HEADLINE} start={typingStarted} />
          </h1>

          <div ref={carouselRef}>
            <OrgCarousel orgs={orgs} activeIndex={orgTick % orgs.length} />
          </div>

          <div ref={ctasRef} className="mt-6 flex items-center gap-3">
            <a
              href="/for-gyms"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Redprint for gyms <span>›</span>
            </a>
            <a
              href="#request"
              className="bg-brand-red hover:bg-brand-red-hover inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition"
            >
              Request your gym <span>›</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
