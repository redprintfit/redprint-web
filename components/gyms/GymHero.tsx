"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { CommunityView } from "@/components/phone/screens/CommunityView";
import { DASHBOARD_ASPECT, DashboardPanel } from "@/components/gyms/DashboardPanel";
import { RedprintTag } from "@/components/gyms/RedprintTag";
import { Eyebrow, TypedHero, OrderTagsButton, Reveal } from "@/components/gyms/GymUI";
import { Grain } from "@/components/effects/Grain";
import { TAG_ASPECT } from "@/lib/gyms/tag";
import { useTheme } from "@/lib/useTheme";
import { orgs, type Org } from "@/lib/content/orgs";
import { forGyms } from "@/lib/content/for-gyms";

/** Same cadence as the consumer hero's org carousel. */
const TICK_ORG_MS = 5000;
/** Open on the org the approved mockup was drawn with. */
const START_INDEX = Math.max(0, orgs.findIndex((o) => o.id === "swarthmore"));

/**
 * Opening view of /for-gyms: the pitch and primary CTA on the left,
 * a cluster showing the three surfaces a gym actually gets — the
 * physical tag, the operator dashboard, and the member app — on the
 * right. The cluster re-brands to a different partner every few
 * seconds, the way the consumer hero cycles its org carousel.
 *
 * Background is the same surface as the consumer How It Works stage:
 * true black / true white under a still film grain — not the page's
 * tinted base.
 */
export function GymHero() {
  const isDark = useTheme() === "dark";

  // The description and CTA wait for the headline to finish typing,
  // so the eye reads the pitch in order instead of all at once.
  const [typed, setTyped] = useState(false);
  const after = {
    initial: { opacity: 0, y: 10 },
    animate: typed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), TICK_ORG_MS);
    return () => clearInterval(id);
  }, []);
  const org = orgs[(START_INDEX + tick) % orgs.length];

  return (
    <section
      className="relative overflow-hidden bg-black px-6 pb-20 pt-28 light:bg-white sm:px-10 md:pb-28 md:pt-36"
      // Hairline between the grain surface and the paper-textured page
      // below — the two dark textures otherwise run into each other.
      style={{ borderBottom: "1px solid var(--gym-border)" }}
    >
      {/* `screen` on black / `multiply` on white — `overlay` resolves to
          nothing against a pure base, so the grain would be invisible. */}
      <Grain
        position="absolute"
        zIndex={0}
        opacity={0.1}
        blendMode={isDark ? "screen" : "multiply"}
        isStatic
      />

      <div className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-10">
        {/* Pitch */}
        <Reveal>
          <Eyebrow>For gym owners and managers</Eyebrow>
          <TypedHero
            className="mt-5"
            lines={forGyms.hero.headline}
            speed={26}
            onComplete={() => setTyped(true)}
          />
          <motion.p
            {...after}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-body mt-6 max-w-[520px] text-[17px] leading-relaxed"
            style={{ color: "var(--gym-muted)" }}
          >
            {forGyms.hero.subhead}
          </motion.p>
          <motion.div
            {...after}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9"
          >
            <OrderTagsButton />
          </motion.div>
        </Reveal>

        {/* Device cluster */}
        <Reveal delay={0.12}>
          <DeviceCluster org={org} />
        </Reveal>
      </div>
    </section>
  );
}

/* Desktop cluster geometry, in px at a 680-wide box.
 *
 * Only three things are chosen: the phone width, the dashboard width,
 * and one gap. Everything else is derived so the alignments are exact
 * by construction rather than tuned by eye:
 *   - phone top    == tag top                (both at y = 0)
 *   - phone bottom == dashboard bottom       (dashboard top = phone h − dash h)
 *   - one equal GAP between phone↔dashboard, phone↔tag, and tag↔dashboard
 *   - the tag fills the height above the dashboard, so its size falls
 *     out of the math; its right edge lands on the dashboard's right edge
 *
 * Devices are then sized from the box's *measured* width, so all of
 * this holds at any column width, not only at 680. */
const BOX_W = 680;
const GAP = 22;
const PHONE_W = 236;
const PHONE_ASPECT = 9 / 19.5; // PhoneFrame's fixed device ratio
const DASH_W = BOX_W - PHONE_W - GAP;

const PHONE_H = PHONE_W / PHONE_ASPECT;
const DASH_H = DASH_W / DASHBOARD_ASPECT;
const TAG_H = PHONE_H - DASH_H - GAP;
const TAG_W = TAG_H * TAG_ASPECT;

const BOX_H = PHONE_H;
const TAG_X = BOX_W - PHONE_W - GAP - TAG_W;
const DASH_Y = PHONE_H - DASH_H;
const PHONE_X = BOX_W - PHONE_W;

function DeviceCluster({ org }: { org: Org }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(BOX_W);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setBoxW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = boxW / BOX_W;
  // Logos render as-is, the way the consumer header shows them.
  const design = { primary: org.primaryColor, logoUrl: org.logoSrc, logoTreatment: "original" as const };

  // The phone screen crossfades between orgs; the tag and dashboard
  // glide their colors on their own.
  const screen = (
    <div className="relative h-full">
      <AnimatePresence initial={false}>
        <motion.div
          key={org.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <CommunityView org={org} />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <>
      {/* Desktop — overlapping composition. */}
      <div
        ref={boxRef}
        className="relative mx-auto hidden w-full max-w-[680px] lg:block"
        style={{ aspectRatio: `${BOX_W} / ${BOX_H}` }}
      >
        <div className="absolute z-20" style={{ left: TAG_X * s, top: 0 }}>
          <RedprintTag design={design} width={TAG_W * s} glow />
        </div>
        <div className="absolute z-10" style={{ left: 0, top: DASH_Y * s }}>
          <DashboardPanel org={org} variant="overview" width={DASH_W * s} />
        </div>
        <div className="absolute z-30" style={{ left: PHONE_X * s, top: 0 }}>
          <PhoneFrame width={PHONE_W * s}>{screen}</PhoneFrame>
        </div>
      </div>

      {/* Below lg — the dashboard's detail is unreadable at phone width,
          so the tag and the app screen carry the composition alone. */}
      <div className="flex items-center justify-center gap-5 lg:hidden">
        <RedprintTag design={design} width={150} glow />
        <PhoneFrame width={168}>{screen}</PhoneFrame>
      </div>
    </>
  );
}
