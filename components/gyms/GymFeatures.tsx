"use client";

import { PhoneFrame } from "@/components/phone/PhoneFrame";
import { AIChatbotView } from "@/components/phone/screens/AIChatbotView";
import { CommunityView } from "@/components/phone/screens/CommunityView";
import { ExerciseRedprintView } from "@/components/phone/screens/ExerciseRedprintView";
import { GroupChallengeDetailView } from "@/components/phone/screens/GroupChallengeDetailView";
import { TierAchievementCongratulationsView } from "@/components/phone/screens/TierAchievementCongratulationsView";
import { DashboardPanel } from "@/components/gyms/DashboardPanel";
import { Reveal } from "@/components/gyms/GymUI";
import { forGyms, type GymFeature, type PhoneScreenKey } from "@/lib/content/for-gyms";
import { orgs, type Org } from "@/lib/content/orgs";

const SHOWCASE_ORG = orgs.find((o) => o.id === "swarthmore") ?? orgs[0];

const PHONE_SCREENS: Record<PhoneScreenKey, (org: Org) => React.ReactNode> = {
  community: (org) => <CommunityView org={org} />,
  groupChallenge: (org) => <GroupChallengeDetailView org={org} />,
  tierAchievement: (org) => <TierAchievementCongratulationsView org={org} />,
  aiChatbot: (org) => <AIChatbotView org={org} />,
  exerciseRedprint: (org) => <ExerciseRedprintView org={org} />,
};

/**
 * The eight things a gym gets, as a two-column grid of identical cards.
 * Card size is fixed rather than content-driven so every box matches.
 * The text block has a minimum height so the media area is the same in
 * every card at desktop widths; if copy wraps further, the media area
 * gives way rather than the text overflowing.
 */
export function GymFeatures() {
  return (
    <section id="features" className="gym-defer relative px-6 py-24 sm:px-10 md:py-28">
      <div className="mx-auto max-w-[1160px]">
        {/* Same treatment as the consumer side's "Make every session
            count." — one centered line, no eyebrow, no typewriter. */}
        <Reveal className="text-center">
          <h2
            className="text-[2.75rem] font-black leading-[1.05] tracking-tight"
            style={{ fontWeight: 900, color: "var(--gym-fg)" }}
          >
            {forGyms.features.heading}
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {forGyms.featureList.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

const CARD_H = 600;
const TEXT_H = 140;
/* 156 wide → 338 tall, inside the ~376px the text leaves at CARD_H. */
const PHONE_W = 156;
const DASH_W = 420;

function FeatureCard({ feature, index }: { feature: GymFeature; index: number }) {
  return (
    <Reveal delay={(index % 2) * 0.08}>
      <div
        className="flex flex-col overflow-hidden rounded-3xl bg-black p-7 light:bg-white"
        style={{ height: CARD_H, border: "1px solid var(--gym-border)" }}
      >
        <div className="shrink-0" style={{ minHeight: TEXT_H }}>
          <div className="font-body flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span className="tabular-nums" style={{ color: "var(--gym-accent)" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ color: "var(--gym-muted)" }}>{feature.label}</span>
          </div>
          <h3
            className="mt-3 text-[24px] font-extrabold leading-[1.12] tracking-[-0.025em]"
            style={{ color: "var(--gym-fg)" }}
          >
            {feature.title}
          </h3>
          <p
            className="font-body mt-3 text-[14.5px] leading-relaxed"
            style={{ color: "var(--gym-muted)" }}
          >
            {feature.description}
          </p>
        </div>

        {/* Media sits whole inside the card, centered in whatever height
            the text leaves, so there's always breathing room beneath it.
            Sizes are chosen to fit the tallest case (a phone) at the
            fixed card height. */}
        <div className="mt-5 flex flex-1 items-center justify-center">
          {feature.media.kind === "phone" ? (
            <PhoneFrame width={PHONE_W}>
              {PHONE_SCREENS[feature.media.screen](SHOWCASE_ORG)}
            </PhoneFrame>
          ) : (
            <DashboardPanel
              org={SHOWCASE_ORG}
              variant={feature.media.variant}
              width={DASH_W}
              className="max-w-full"
            />
          )}
        </div>
      </div>
    </Reveal>
  );
}
