"use client";

import { darken, lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens (mirrors iOS ColorExtension.swift) ---------- */
const REDPRINT_GREEN = "rgb(0, 210, 85)";
const REDPRINT_DARK_GRAY = "rgb(50, 50, 50)";

/* ---------- Placeholder tier-achievement data ---------- */
const ACHIEVEMENT = {
  challengeTitle: "March Push Challenge",
  tierIndex: 1, // 0-indexed: "Tier 2"
  tierGoal: 50,
  userProgress: 50,
  rewardName: "$20 Marist Gym Credit",
  rewardLink: "#",
  hasNextTier: true,
  nextTierGoal: 100,
};

/**
 * Tier achievement congratulations — celebration screen after the user
 * hits a tier goal in an org challenge. Faithfully ported from
 * Redprint5/Views/Track Page Files/InteractionView.swift (struct
 * TierAchievementCongratulationsView).
 *
 * Visual structure (top → bottom):
 *   1. Trophy icon + "Congratulations" + tier subtitle + challenge title
 *   2. Progress bar (green, with checkmark + "Tier Complete!" when full)
 *   3. Reward section (header + reward button + redeem note)
 *   4. Next-tier or "Challenge Complete" card (white-tinted)
 *   5. Close button
 *
 * Background is an org-gradient overlay; in this port we synthesise the
 * gradient from `orgColor` (= primaryColor) and a lightened variant
 * since the marketing-site `Org` type only carries a single colour.
 */
export function TierAchievementCongratulationsView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const orgLight = lighten(orgColor, 30);
  const isDark = useTheme() === "dark";
  // Mirror iOS gradientColors[0..1] @ 0.4 opacity. We append `66`
  // (≈ 0.4 alpha) to the hex codes from `lighten`/`primaryColor`.
  const bgGradient = `linear-gradient(135deg, ${orgColor}66 0%, ${orgLight}66 100%)`;
  // iOS uses .redprintDarkGray everywhere because the view paints over
  // a light system background. Our marketing site has both themes — so
  // we invert text to a light-cream in dark mode where the dark-gray
  // would otherwise be invisible against the dark+org-tinted backdrop.
  const fgText = isDark ? "rgb(245, 241, 234)" : REDPRINT_DARK_GRAY;
  // Background base: white in light mode, near-black in dark mode.
  // The org gradient lays on top of this at 40% alpha.
  const baseBg = isDark ? "#0a0a0a" : "#f8f5f0";

  const progressPct = Math.min(
    1,
    ACHIEVEMENT.userProgress / ACHIEVEMENT.tierGoal,
  );
  const tierComplete = progressPct >= 1;

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: baseBg, backgroundImage: bgGradient }}
    >
      {/* The pt-7 reserves space for the status bar / dynamic island.
          A top + bottom flex spacer brackets the content so the cluster
          centres itself vertically in the remaining screen area. */}
      <div className="flex flex-1 flex-col overflow-hidden px-3 pt-7">
        <div className="flex-1" />
        <div className="flex flex-col gap-7">
        {/* ---------- Congratulations header ---------- */}
        <div className="flex flex-col items-center gap-1 pb-1 pt-2">
          <div className="mb-1 flex h-12 w-12 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/trophy.png"
              alt="Trophy"
              className="h-full w-full object-contain"
              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
              draggable={false}
            />
          </div>
          <div
            className="text-[15px] leading-none"
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              color: fgText,
            }}
          >
            Congratulations
          </div>
          <div
            className="text-[11px] font-semibold leading-none"
            style={{ color: fgText }}
          >
            You&apos;ve reached Tier {ACHIEVEMENT.tierIndex + 1}!
          </div>
          <div
            className="text-center text-[8px] leading-tight opacity-50"
            style={{ color: fgText }}
          >
            {ACHIEVEMENT.challengeTitle}
          </div>
        </div>

        {/* ---------- Progress bar ---------- */}
        <div className="flex flex-col gap-1">
          <div
            className="px-1 text-[9.5px] font-semibold opacity-65"
            style={{ color: fgText }}
          >
            Progress: {ACHIEVEMENT.userProgress}/{ACHIEVEMENT.tierGoal}
          </div>
          <div
            className="relative h-[32px] w-full overflow-hidden rounded-[6px]"
            style={{
              backgroundColor: isDark
                ? "rgba(245, 241, 234, 0.15)"
                : "rgba(255, 255, 255, 0.5)",
            }}
          >
            <div
              className="absolute inset-y-0 left-0 flex items-center justify-between px-1.5"
              style={{
                width: `${progressPct * 100}%`,
                backgroundColor: REDPRINT_GREEN,
              }}
            >
              {tierComplete && (
                <div className="flex items-center gap-0.5">
                  <CheckmarkIcon />
                  <span
                    className="text-[7px] font-semibold text-white"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    Tier Complete!
                  </span>
                </div>
              )}
              <span
                className="ml-auto text-[8.5px] font-semibold text-white"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {ACHIEVEMENT.userProgress}
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Reward section ---------- */}
        {ACHIEVEMENT.rewardName && (
          <div className="mt-1 flex flex-col gap-1">
            <div
              className="pl-1 text-[9.5px] font-semibold opacity-65"
              style={{ color: fgText }}
            >
              Your Reward
            </div>
            <button
              className="flex items-center justify-between rounded-[5px] px-2 py-1.5"
              style={{
                color: fgText,
                backgroundColor: isDark
                  ? "rgba(245, 241, 234, 0.12)"
                  : "rgba(255, 255, 255, 0.4)",
              }}
            >
              <span
                className="text-[9px] font-semibold"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {ACHIEVEMENT.rewardName}
              </span>
              <ExternalLinkIcon />
            </button>
            <div
              className="pl-1 text-[7px] font-semibold"
              style={{ color: fgText }}
            >
              Go to your gym to redeem your reward
            </div>
          </div>
        )}

        </div>

        {/* Bottom spacer balances the top spacer so the cluster sits
            vertically centred in the remaining screen area. */}
        <div className="flex-1" />

        {/* ---------- Close button (stays anchored to the bottom) ---------- */}
        <button
          className="pb-3 pt-2 text-center text-[10px] font-semibold"
          style={{
            fontFamily: "Outfit, sans-serif",
            color: fgText,
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Icons
   ============================================================ */

function CheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-2 w-2 fill-none stroke-white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3,8 7,12 13,4" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-2.5 w-2.5 fill-none stroke-current"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6,3 13,3 13,10" />
      <line x1="13" y1="3" x2="6" y2="10" />
      <path d="M11 9 v3 a1 1 0 0 1 -1 1 H4 a1 1 0 0 1 -1 -1 V6 a1 1 0 0 1 1 -1 h3" />
    </svg>
  );
}

// `darken` kept in the import surface so future reward-pill tints can
// pull from the org palette without re-importing.
void darken;
