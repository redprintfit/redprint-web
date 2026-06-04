"use client";

import { darken, lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens (mirrors iOS ColorExtension.swift) ---------- */
const REDPRINT_YELLOW = "rgb(255, 196, 20)";
const REDPRINT_LIGHT_RED = "rgb(245, 90, 90)";

/* ---------- Placeholder challenge + leaderboard data ---------- */
type Member = {
  name: string;
  displayName: string;
  score: number; // total volume in lbs (or workout count for "workouts" metric)
  workouts: number;
  isCurrentUser: boolean;
  avatar: string;
};

const CHALLENGE = {
  name: "October lift-off",
  description:
    "Highest total lifting volume in March wins free Redprint merch + bragging rights.",
  goal: 100000, // lbs
  metric: "volume" as const,
  countdown: "05:14:32:08",
};

const MEMBERS: Member[] = [
  {
    name: "Michael G.",
    displayName: "michael.g",
    score: 92450,
    workouts: 23,
    isCurrentUser: true,
    avatar: "/avatars/p1.jpg",
  },
  {
    name: "Sarah K.",
    displayName: "sarahk",
    score: 68210,
    workouts: 18,
    isCurrentUser: false,
    avatar: "/avatars/p2.jpg",
  },
  {
    name: "Tom R.",
    displayName: "tom.r",
    score: 52800,
    workouts: 15,
    isCurrentUser: false,
    avatar: "/avatars/p3.jpg",
  },
  {
    name: "Jess L.",
    displayName: "jess.l",
    score: 41200,
    workouts: 12,
    isCurrentUser: false,
    avatar: "/avatars/p4.jpg",
  },
];

const SELECTED_INDEX = 0; // first member (current user) is centred in the scroll

/**
 * Group challenge detail — leaderboard with progress bars, member scroll
 * w/ profile avatars + scores, stats grid. Faithfully ported from
 * Redprint5/Views/Gyms Page Files/Social/User Groups/GroupChallengeDetailView.swift.
 *
 * Org-color theming (mirrors iOS `schoolColors[0]`):
 *   - Page background tint           → darken(orgColor, 65%) @ 25% dark / 15% light
 *   - Section background             → theme.sectionBg (black/cream)
 *   - Current-user leaderboard bar   → linear gradient [darken(orgColor, 25), orgColor]
 *   - Current-user avatar border     → orgColor gradient
 *   - Selected-member ring           → blue (constant, matches iOS Color.blue)
 */
export function GroupChallengeDetailView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";
  // theme.pageBackground(for: orgColor): darken@65 × 25% dark / 15% light
  const pageTint = isDark
    ? `${darken(orgColor, 65)}40`
    : `${darken(orgColor, 65)}26`;

  const selected = MEMBERS[SELECTED_INDEX];
  const lbsPerWorkout = (selected.score / selected.workouts / 1000).toFixed(1);

  return (
    <div
      className="light:bg-white light:text-black flex h-full flex-col overflow-hidden bg-black text-white"
      style={{
        backgroundImage: `linear-gradient(${pageTint}, ${pageTint})`,
      }}
    >
      {/* ---------- Header (challenge name + description + pills) ---------- */}
      <div className="px-2.5 pt-7">
        <div className="px-1 pt-2">
          {/* Title + goal pill on the same row */}
          <div className="flex items-center gap-2">
            <div
              className="text-[14px] leading-tight"
              style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
            >
              {CHALLENGE.name}
            </div>
            <span
              className="rounded-[3px] px-1 py-0.5 text-[7.5px] font-bold"
              style={{
                color: REDPRINT_YELLOW,
                backgroundColor: `${REDPRINT_YELLOW}26`,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              First to 100k lbs
            </span>
          </div>
          <div className="light:text-black/65 mt-1 text-[8px] leading-snug text-white/65">
            {CHALLENGE.description}
          </div>
        </div>

        {/* ---------- Member scroll (3 visible cards) ---------- */}
        <MemberScroll />

        {/* ---------- 3-cell stats grid ---------- */}
        <div className="mb-1 grid grid-cols-3 gap-1 px-1">
          <StatCell label="Volume" value={`${(selected.score / 1000).toFixed(1)}k`} />
          <StatCell label="Workouts" value={`${selected.workouts}`} />
          <StatCell label="lbs/wrkt" value={`${lbsPerWorkout}k`} />
        </div>
      </div>

      {/* ---------- Leaderboard section (sits on theme.sectionBg) ---------- */}
      <div
        className="flex-1 overflow-hidden px-2.5 pt-2"
        style={{
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="light:text-black/50 px-1 pb-1.5 text-[8px] font-semibold text-white/50">
          Leaderboard
        </div>
        <div className="space-y-2">
          {MEMBERS.map((m, i) => (
            <LeaderboardRow
              key={m.displayName}
              member={m}
              orgColor={orgColor}
              goal={CHALLENGE.goal}
              isSelected={i === SELECTED_INDEX}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Member horizontal scroll cards
   ============================================================ */

function MemberScroll() {
  return (
    <div className="my-2 flex items-center justify-center gap-2 overflow-hidden">
      {MEMBERS.slice(0, 3).map((m, i) => (
        <MemberScrollCell
          key={m.displayName}
          member={m}
          isCentered={i === SELECTED_INDEX}
        />
      ))}
    </div>
  );
}

function MemberScrollCell({
  member,
  isCentered,
}: {
  member: Member;
  isCentered: boolean;
}) {
  const avatarSize = isCentered ? 64 : 44;
  return (
    <div
      className={`flex shrink-0 flex-col items-center py-2 ${
        isCentered ? "" : "opacity-50"
      }`}
      style={{ width: isCentered ? 100 : 70 }}
    >
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-zinc-700"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.avatar}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
        {/* Selected ring (blue, matches iOS) */}
        {isCentered && (
          <div
            className="absolute inset-[-3px] rounded-full"
            style={{ border: "2px solid rgb(10, 125, 250)" }}
          />
        )}
      </div>
      <div className="mt-1.5 flex items-baseline gap-0.5">
        <span
          className="light:text-black text-[12px] leading-none text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {(member.score / 1000).toFixed(1)}k
        </span>
        {isCentered && (
          <span className="light:text-black/50 text-[6.5px] text-white/50">
            lbs
          </span>
        )}
      </div>
      {isCentered && (
        <>
          <div
            className="light:text-black mt-0.5 text-[7.5px] font-semibold leading-tight text-white"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {member.name}
          </div>
          <div className="light:text-black/65 text-[6.5px] leading-tight text-white/65">
            @{member.displayName}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   Stat cell (3-up grid below member scroll)
   ============================================================ */

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="light:bg-black/10 flex items-center justify-between rounded-[4px] bg-white/10 px-1.5 py-1"
      style={{ fontFamily: "Outfit, sans-serif" }}
    >
      <span className="light:text-black/65 text-[6.5px] text-white/65">
        {label}:
      </span>
      <span className="light:text-black text-[7px] font-bold text-white">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   Leaderboard row — avatar + progress bar
   ============================================================ */

function LeaderboardRow({
  member,
  orgColor,
  goal,
  isSelected,
}: {
  member: Member;
  orgColor: string;
  goal: number;
  isSelected: boolean;
}) {
  const progressPct = Math.min(1, member.score / goal);
  const isWinner = member.score >= goal;
  // Bar fill formula mirrors iOS:
  //   winner   → yellow gradient
  //   current  → org gradient
  //   other    → fg-base @ 8% opacity
  const barGradient = isWinner
    ? `linear-gradient(to right, ${darken(REDPRINT_YELLOW, 25)}, ${REDPRINT_YELLOW})`
    : member.isCurrentUser
      ? `linear-gradient(to right, ${darken(orgColor, 25)}, ${orgColor})`
      : "currentColor";
  const barOpacity = isWinner ? 0.5 : member.isCurrentUser ? 0.5 : 0.08;

  return (
    <div className="relative flex h-[36px] items-center">
      {/* Progress bar background (full width) */}
      <div
        className="absolute inset-y-0 left-0"
        style={{
          width: `${Math.max(progressPct * 100, 14)}%`,
          background: barGradient,
          opacity: barOpacity,
          borderTopLeftRadius: 18,
          borderBottomLeftRadius: 18,
          borderTopRightRadius: 5,
          borderBottomRightRadius: 5,
        }}
      />
      {/* Avatar (overlaps the bar's left edge) */}
      <div
        className="relative flex items-center pl-1"
        style={{ zIndex: 1 }}
      >
        <div
          className="relative overflow-hidden rounded-full bg-zinc-700"
          style={{
            width: 32,
            height: 32,
            border: `2px solid ${
              member.isCurrentUser ? orgColor : "rgba(80, 80, 80, 0.8)"
            }`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.avatar}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        {/* Selected blue ring (matches iOS) */}
        {isSelected && (
          <div
            className="absolute rounded-full"
            style={{
              width: 40,
              height: 40,
              left: 0,
              border: "1.5px solid rgb(10, 125, 250)",
            }}
          />
        )}
        {progressPct > 0.2 && (
          <div className="ml-2 flex flex-col leading-tight">
            <span
              className="light:text-black text-[8.5px] font-bold text-white"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {member.name}
            </span>
            <span className="light:text-black/50 text-[7px] text-white/50">
              @{member.displayName}
            </span>
          </div>
        )}
      </div>
      {/* Score on right (when bar is wide enough) OR floating right */}
      <div className="ml-auto flex items-center gap-1 pr-2" style={{ zIndex: 1 }}>
        {isWinner && (
          <>
            <TrophyIcon />
            <span
              className="light:text-black text-[8px] font-semibold text-white"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Winner!
            </span>
          </>
        )}
        {!isWinner && (
          <span
            className="light:text-black text-[8.5px] font-semibold text-white"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {(member.score / 1000).toFixed(1)}k
          </span>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Icons
   ============================================================ */

function TrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-2 w-2 fill-current opacity-65">
      <path d="M4 2 h8 v2 a1 1 0 0 0 1 1 h1 v2 a3 3 0 0 1 -3 3 h-1 v1 h2 v1 h-8 v-1 h2 v-1 h-1 a3 3 0 0 1 -3 -3 v-2 h1 a1 1 0 0 0 1 -1 z M2 5 v1 a2 2 0 0 0 2 2 z M14 5 v1 a2 2 0 0 1 -2 2 z" />
    </svg>
  );
}

// Unused but kept for parity with iOS palette (LIGHT_RED — used by the
// "Ended on …" pill, which we don't render in the placeholder data).
void REDPRINT_LIGHT_RED;
