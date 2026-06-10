"use client";

import { useState } from "react";
import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { HomeWorkoutView } from "@/components/phone/screens/HomeWorkoutView";
import { AIChatbotView } from "@/components/phone/screens/AIChatbotView";
import { CommunityView } from "@/components/phone/screens/CommunityView";
import { ExerciseRedprintView } from "@/components/phone/screens/ExerciseRedprintView";
import { WorkoutHistoryAnalysisView } from "@/components/phone/screens/WorkoutHistoryAnalysisView";
import { orgs, type Org } from "@/lib/content/orgs";
import { TESTIMONIALS } from "@/components/sections/TestimonialsLayer";
import { RequestGymModal } from "@/components/RequestGymModal";
import { ContactModal } from "@/components/ContactModal";
import { DownloadModal } from "@/components/DownloadModal";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * Mobile home page. Replaces the desktop ScrollSequence on viewports
 * below the md breakpoint (768px). Same brand and content as desktop
 * but rendered as a normal vertically-scrolling page with stacked
 * sections — no scroll-driven choreography.
 */
export function MobileHome() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <>
      <main className="bg-bg-base text-fg-base relative">
        <MobileHero
          onDownload={() => setDownloadOpen(true)}
          onRequest={() => setRequestOpen(true)}
        />
        <MobileHowItWorks />
        <MobilePillars />
        <MobileTestimonials />
        <MobileFinalCTA
          onDownload={() => setDownloadOpen(true)}
          onRequest={() => setRequestOpen(true)}
          onContact={() => setContactOpen(true)}
        />
      </main>
      <SiteFooter />
      <RequestGymModal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
      />
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
      <DownloadModal
        open={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />
    </>
  );
}

/* ============================================================
   HERO
   ============================================================ */

function MobileHero({
  onDownload,
  onRequest,
}: {
  onDownload: () => void;
  onRequest: () => void;
}) {
  // Use the first org for the in-phone-screen theming so the screenshot
  // looks alive without needing the desktop's rotating carousel.
  const featuredOrg: Org = orgs[0];
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-start px-5 pb-12 pt-24">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <h1 className="text-[2.5rem] font-black leading-[1.05] tracking-tight">
          Fitness AI that knows your gym
        </h1>
        <p className="font-body text-fg-base/70 mt-4 text-base leading-relaxed">
          Built for every machine in the building. Made for the people lifting
          on them.
        </p>

        {/* CTAs above the phone so they're the first thing thumbs reach. */}
        <div className="mt-7 flex w-full flex-col items-stretch gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold transition"
          >
            Download the app
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRequest}
            className="border-fg-base/30 text-fg-base hover:bg-fg-base/10 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition"
          >
            My gym isn&apos;t on Redprint
          </button>
        </div>

        {/* Featured phone screenshot — single static phone, not a fan.
            Capped at 260px wide so it always fits within the page
            padding even on the narrowest viewports. */}
        <div className="mt-10">
          <PhoneFrame width={260}>
            <HomeWorkoutView org={featuredOrg} />
          </PhoneFrame>
        </div>

        <div className="border-fg-base/20 bg-fg-base/[0.06] text-fg-base/80 font-body mt-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em]">
          <span className="relative flex h-2 w-2">
            <span className="bg-fg-base/40 absolute inset-0 animate-ping rounded-full" />
            <span className="bg-fg-base/80 relative h-2 w-2 rounded-full" />
          </span>
          Redprint 2.0 coming soon
        </div>

        <OrgMarquee />
      </div>
    </section>
  );
}

/** Auto-scrolling horizontal strip of org logos. CSS-only loop, no JS. */
function OrgMarquee() {
  return (
    <div className="mt-10 w-full overflow-hidden">
      <p className="font-body text-fg-base/45 mb-3 text-center text-[10px] uppercase tracking-[0.18em]">
        Trusted at
      </p>
      <div className="relative flex w-full overflow-hidden">
        <div
          className="flex shrink-0 items-center gap-10 pr-10"
          style={{
            animation: "redprint-marquee 28s linear infinite",
          }}
        >
          {[...orgs, ...orgs].map((org, i) => (
            <div
              key={`${org.id}-${i}`}
              className="font-body text-fg-base/55 shrink-0 text-sm font-semibold uppercase tracking-[0.12em]"
            >
              {org.name}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes redprint-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   HOW IT WORKS — 6 stacked steps
   ============================================================ */

type Step = {
  number: string;
  label: string;
  headline: string;
  description: string;
  visual: React.ReactNode;
};

function MobileHowItWorks() {
  const featuredOrg = orgs[0];
  const steps: Step[] = [
    {
      number: "01",
      label: "INTERACT WITH REDPRINT TAGS",
      headline: "Tap a tag. Track a set.",
      description:
        "Redprint tags sit on every piece of equipment in your gym. Tap your phone to the tag to log a set without thinking.",
      visual: <TagBadge />,
    },
    {
      number: "02",
      label: "TAP-TO-TRACK",
      headline: "Faster than writing it down.",
      description:
        "Sets, reps, and weight log themselves. The clock starts when you tap, stops when you tap again.",
      visual: (
        <PhoneFrame width={220}>
          <HomeWorkoutView org={featuredOrg} />
        </PhoneFrame>
      ),
    },
    {
      number: "03",
      label: "ON-DEMAND LEARNING",
      headline: "Standing at the machine, not staring at it.",
      description:
        "Every exercise is one tap from a demo video and clear instructions. Beginners stop guessing; veterans stop reinventing.",
      visual: (
        <PhoneFrame width={220}>
          <ExerciseRedprintView org={featuredOrg} />
        </PhoneFrame>
      ),
    },
    {
      number: "04",
      label: "GYM-SPECIFIC AI",
      headline: "The AI knows what your gym actually has.",
      description:
        "Ask for a chest workout and it builds one from the machines that exist at your gym. No suggestions for equipment you can't use.",
      visual: (
        <PhoneFrame width={220}>
          <AIChatbotView org={featuredOrg} />
        </PhoneFrame>
      ),
    },
    {
      number: "05",
      label: "COMPETE / COMMUNITY",
      headline: "Your gym vs. the world.",
      description:
        "Leaderboards, group challenges, and tier rewards. Members lift more when their gym is on the board.",
      visual: (
        <PhoneFrame width={220}>
          <CommunityView org={featuredOrg} />
        </PhoneFrame>
      ),
    },
    {
      number: "06",
      label: "VISUALIZE PROGRESS",
      headline: "Watch yourself improve.",
      description:
        "Volume, intensity, consistency. Track what you actually moved this month, this year, ever.",
      visual: (
        <PhoneFrame width={220}>
          <WorkoutHistoryAnalysisView org={featuredOrg} />
        </PhoneFrame>
      ),
    },
  ];
  return (
    <section
      id="mobile-hiw"
      className="border-fg-base/10 border-t px-5 py-16"
    >
      <header className="mx-auto max-w-md text-center">
        <p className="font-body text-fg-base/45 text-[10px] uppercase tracking-[0.2em]">
          How it works
        </p>
        <h2 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight">
          Six things Redprint does.
        </h2>
      </header>
      <div className="mt-10 flex flex-col gap-14">
        {steps.map((s) => (
          <StepBlock key={s.number} step={s} />
        ))}
      </div>
    </section>
  );
}

function StepBlock({ step }: { step: Step }) {
  return (
    <article className="mx-auto flex w-full max-w-md flex-col items-center text-center">
      <div className="font-body text-fg-base/40 mb-3 text-[11px] font-medium uppercase tracking-[0.2em]">
        {step.number} · {step.label}
      </div>
      <h3 className="text-[1.5rem] font-black leading-tight tracking-tight">
        {step.headline}
      </h3>
      <p className="font-body text-fg-base/70 mt-3 max-w-sm text-[15px] leading-relaxed">
        {step.description}
      </p>
      <div className="mt-7 flex items-center justify-center">{step.visual}</div>
    </article>
  );
}

function TagBadge() {
  // Simple hex-tag illustration. Uses the page's currentColor (text-fg-base)
  // via the SVG so it stays theme-aware without an image swap.
  return (
    <div className="relative flex h-[180px] w-[180px] items-center justify-center">
      <div
        aria-hidden
        className="border-fg-base/25 absolute inset-0 rounded-full border-2 border-dashed"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tags/generic.png"
        alt=""
        className="dark:invert-0 h-28 w-28 object-contain light:invert"
        draggable={false}
      />
    </div>
  );
}

/* ============================================================
   PILLARS — three sticky-style cards stacked
   ============================================================ */

function MobilePillars() {
  return (
    <section className="border-fg-base/10 border-t px-5 py-16">
      <header className="mx-auto max-w-md text-center">
        <p className="font-body text-fg-base/45 text-[10px] uppercase tracking-[0.2em]">
          The three pillars
        </p>
        <h2 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight">
          Plan. Guide. Compete.
        </h2>
      </header>
      <div className="mx-auto mt-10 flex max-w-md flex-col gap-6">
        <PillarCard
          index="01"
          label="PLAN"
          title="A week built around your gym."
          description="Workouts the AI knows you can actually do at the equipment you have access to."
        />
        <PillarCard
          index="02"
          label="GUIDE"
          title="Standing at the machine, not staring at it."
          description="Every exercise, one tap from a demo. No more memorizing setups or asking the staff."
        />
        <PillarCard
          index="03"
          label="COMPETE"
          title="Your gym vs. the world."
          description="Every gym on Redprint, ranked by who's lifting most. Earn tier rewards as you climb."
        />
      </div>
    </section>
  );
}

function PillarCard({
  index,
  label,
  title,
  description,
}: {
  index: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-fg-base/15 bg-fg-base/[0.03] rounded-2xl border p-6">
      <div className="font-body text-fg-base/45 text-[11px] font-medium tracking-[0.14em]">
        {index} — {label}
      </div>
      <h3 className="mt-2 text-[1.35rem] font-medium leading-[1.2] tracking-tight">
        {title}
      </h3>
      <p className="font-body text-fg-base/65 mt-3 text-[14px] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   TESTIMONIALS — horizontal snap carousel
   ============================================================ */

function MobileTestimonials() {
  return (
    <section
      id="mobile-testimonials"
      className="border-fg-base/10 border-t px-5 py-16"
    >
      <header className="mx-auto max-w-md text-center">
        <p className="font-body text-fg-base/45 text-[10px] uppercase tracking-[0.2em]">
          What members say
        </p>
        <h2 className="mt-2 text-[2rem] font-black leading-[1.05] tracking-tight">
          From real gyms.
        </h2>
      </header>
      {/* Horizontal scroll with scroll-snap so each card lands center.
          -mx-5 + px-5 lets the snap container bleed to the viewport
          edges while keeping internal padding. */}
      <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-3">
        <div className="flex snap-x snap-mandatory gap-4">
          {TESTIMONIALS.map((t, i) => (
            <article
              key={`${t.firstName}-${i}`}
              className="snap-center shrink-0"
              style={{ width: "78vw", maxWidth: 320 }}
            >
              <div
                className="border-fg-base/15 bg-fg-base/[0.04] flex h-full flex-col rounded-2xl border p-5"
                style={{
                  borderColor: `${t.accent}55`,
                  backgroundColor: `${t.accent}10`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.logoSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold">{t.firstName}</div>
                    <div
                      className="font-body text-[11px] font-medium tracking-wider"
                      style={{ color: t.accent }}
                    >
                      {t.gym.toUpperCase()}
                    </div>
                  </div>
                </div>
                <p className="font-body text-fg-base/85 mt-4 text-[15px] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA — get the app or talk to us
   ============================================================ */

function MobileFinalCTA({
  onDownload,
  onRequest,
  onContact,
}: {
  onDownload: () => void;
  onRequest: () => void;
  onContact: () => void;
}) {
  return (
    <section className="border-fg-base/10 relative border-t px-5 py-20">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <h2 className="text-[2.25rem] font-black leading-[1.05] tracking-tight">
          Bring Redprint to your gym.
        </h2>
        <p className="font-body text-fg-base/70 mt-4 text-base leading-relaxed">
          Free to download. Works at any gym, with or without Redprint tags
          installed.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onDownload}
            className="bg-fg-base text-bg-base hover:bg-fg-base/90 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-base font-semibold transition"
          >
            Download the app
          </button>
          <button
            type="button"
            onClick={onRequest}
            className="border-fg-base/30 text-fg-base hover:bg-fg-base/10 inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition"
          >
            Request your gym
          </button>
          <button
            type="button"
            onClick={onContact}
            className="text-fg-base/65 hover:text-fg-base font-body mt-1 text-sm font-medium underline-offset-4 transition hover:underline"
          >
            Or get in touch
          </button>
        </div>
      </div>
    </section>
  );
}
