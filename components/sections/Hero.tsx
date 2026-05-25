"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { orgs, darken, type Org } from "@/lib/content/orgs";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { CommunityScreen } from "@/components/phone/screens/CommunityScreen";
import { ExerciseProgressScreen } from "@/components/phone/screens/ExerciseProgressScreen";
import { AnalyticsScreen } from "@/components/phone/screens/AnalyticsScreen";
import { OrgCarousel } from "@/components/sections/OrgCarousel";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { RedprintMark } from "@/components/RedprintMark";

gsap.registerPlugin(ScrollTrigger);

const HEADLINE = "Fitness AI that knows your gym";

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frontPhoneRef = useRef<HTMLDivElement>(null);
  const fanLeftRef = useRef<HTMLDivElement>(null);
  const fanRightRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const ctasRef = useRef<HTMLDivElement>(null);

  const [activeOrg, setActiveOrg] = useState<Org>(orgs[0]);
  const [typingStarted, setTypingStarted] = useState(false);
  const [carouselReady, setCarouselReady] = useState(false);

  // Drive page bg from active org primary color (darkened 75%).
  useEffect(() => {
    const tint = darken(activeOrg.primaryColor, 75);
    document.documentElement.style.setProperty("--org-bg", tint);
    return () => {
      document.documentElement.style.removeProperty("--org-bg");
    };
  }, [activeOrg]);

  // Scroll-driven opening timeline.
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Initial states.
      gsap.set(frontPhoneRef.current, { opacity: 0, y: 60, x: 0 });
      gsap.set([fanLeftRef.current, fanRightRef.current], {
        opacity: 0,
        x: 0,
        rotate: 0,
      });
      gsap.set(markRef.current, { opacity: 0, x: -40 });
      gsap.set(carouselRef.current, { opacity: 0, y: 30 });
      gsap.set(ctasRef.current, { opacity: 0, y: 20 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=2400",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1. Front phone fades + rises into center
      tl.to(frontPhoneRef.current, { opacity: 1, y: 0, duration: 1 });

      // 2. Brief hold
      tl.to({}, { duration: 0.4 });

      // 3. Front phone slides left + fan phones reveal + logo emerges
      tl.to(frontPhoneRef.current, { x: -180, duration: 1 }, "shift");
      tl.to(
        fanLeftRef.current,
        { opacity: 1, x: -90, rotate: -12, duration: 1 },
        "shift",
      );
      tl.to(
        fanRightRef.current,
        { opacity: 1, x: -260, rotate: -24, duration: 1 },
        "shift",
      );
      tl.to(markRef.current, { opacity: 1, x: 0, duration: 0.8 }, "shift");

      // 4. Trigger headline typing partway through the shift
      tl.call(() => setTypingStarted(true), [], "shift+=0.3");
      // Reverse path: if user scrolls back, reset.
      tl.eventCallback("onReverseComplete", () => setTypingStarted(false));

      // 5. Carousel rises in (after typing has had a beat to begin)
      tl.to(carouselRef.current, { opacity: 1, y: 0, duration: 0.8 }, "+=0.3");
      tl.call(() => setCarouselReady(true), [], ">");

      // 6. CTAs settle in
      tl.to(ctasRef.current, { opacity: 1, y: 0, duration: 0.6 }, "<");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Optional noise texture overlay — drop /public/textures/noise.png */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: "url(/textures/noise.png)",
          backgroundSize: "400px",
        }}
      />

      <div
        ref={stageRef}
        className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 md:px-12"
      >
        {/* Left: phone stack */}
        <div className="relative flex h-full flex-1 items-center justify-center">
          {/* Fan-out phones (rendered first so they sit behind in DOM) */}
          <div ref={fanRightRef} className="absolute">
            <PhoneFrame className="w-[220px]">
              <AnalyticsScreen org={activeOrg} />
            </PhoneFrame>
          </div>
          <div ref={fanLeftRef} className="absolute">
            <PhoneFrame className="w-[230px]">
              <ExerciseProgressScreen org={activeOrg} />
            </PhoneFrame>
          </div>
          {/* Front phone */}
          <div ref={frontPhoneRef} className="absolute">
            <PhoneFrame className="w-[260px]">
              <CommunityScreen org={activeOrg} />
            </PhoneFrame>
          </div>
        </div>

        {/* Right: logo, headline, carousel, CTAs */}
        <div className="flex flex-1 flex-col items-start gap-8">
          <div ref={markRef} className="text-white">
            <RedprintMark className="h-9 w-9" />
          </div>

          <h1
            ref={headlineRef}
            className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
            style={{ fontWeight: 800 }}
          >
            <TypewriterText text={HEADLINE} start={typingStarted} />
          </h1>

          <div ref={carouselRef}>
            <OrgCarousel
              orgs={orgs}
              onActiveChange={setActiveOrg}
              paused={!carouselReady}
            />
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
