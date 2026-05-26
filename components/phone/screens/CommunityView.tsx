"use client";

import { darken, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens from iOS ColorExtension.swift ---------- */
const REDPRINT_GREEN = "rgb(0, 210, 85)";

/* ---------- Hardcoded leaderboard placeholder data ---------- */
type LeaderRow = {
  shortName: string;
  name: string;
  location: string;
  pointsBehind: string;
  color: string;
  logoSrc?: string;
};

const STATIC_LEADERBOARD: { top3: LeaderRow[]; rows: LeaderRow[] } = {
  top3: [
    {
      shortName: "N",
      name: "Niagara",
      location: "Niagara, NY",
      pointsBehind: "-480.3k",
      color: "#4B2A6B",
      logoSrc: "/logos/niagara.jpg",
    },
    {
      // Center / gold — replaced at render time with the active org
      shortName: "",
      name: "",
      location: "",
      pointsBehind: "",
      color: "",
    },
    {
      shortName: "W",
      name: "Waverley O…",
      location: "Waltham, MA",
      pointsBehind: "-563.6k",
      color: "#7B6E3D",
      logoSrc: "/logos/waverley_oaks.jpg",
    },
  ],
  rows: [
    {
      shortName: "U",
      name: "University of Missouri-S…",
      location: "St. Louis, MO",
      pointsBehind: "-695.9k",
      color: "#dde2e8",
      logoSrc: "/logos/umsl.jpg",
    },
    {
      shortName: "C",
      name: "Clemson University",
      location: "Clemson, SC",
      pointsBehind: "-828.9k",
      color: "#F66733",
      logoSrc: "/logos/clemson.jpg",
    },
  ],
};

/**
 * CommunityView — gym leaderboard + activity feed.
 * Faithfully ported from Redprint5/Views/Gyms Page Files/CommunityView.swift.
 *
 * Org-color theming (mirrors iOS `orgColors[0]` usage):
 *   - Page background tint              → darken(orgColor, 65%) @ 25% opacity
 *   - Workout post headline color       → orgColor (full)
 *   - Workout post card background      → darken(orgColor, 65%) @ 25% opacity
 *   - Workout post inner section bg     → darken(orgColor, 75%) @ 30% opacity
 *   - Tab bar tint                      → orgColor @ low opacity
 */
export function CommunityView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const orgDark65 = darken(orgColor, 65);
  const orgDark50 = darken(orgColor, 50);
  const orgDark75 = darken(orgColor, 75);
  const isDark = useTheme() === "dark";

  // Page tint opacity mirrors iOS: 25% dark, 10% light.
  const pageTintAlpha = isDark ? "40" : "1A";

  return (
    <div
      className="light:bg-white light:text-black flex h-full flex-col bg-black text-white"
      style={{
        background: `
          linear-gradient(180deg, ${orgDark65}${pageTintAlpha} 0%, transparent 50%),
          ${orgDark65}${pageTintAlpha}
        `,
      }}
    >
      {/* ---------- Header (pt-7 reserves the status bar) ---------- */}
      <header className="flex items-center gap-1.5 px-2.5 pb-1.5 pt-7">
        <IconButton>
          <QuestionMarkCircle />
        </IconButton>

        <div className="light:bg-white flex h-[26px] flex-1 items-center gap-1 rounded-full bg-black px-2 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          <MagnifyingGlass />
          <span className="light:text-black/45 text-[8.5px] text-white/35">
            Search people…
          </span>
        </div>

        <button
          className="light:bg-white flex h-[26px] items-center gap-1 rounded-full bg-black px-2 shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
          style={{
            boxShadow: `inset 0 0 0 999px ${REDPRINT_GREEN}40`,
          }}
        >
          <span
            className="text-[8.5px] font-semibold leading-none"
            style={{ color: REDPRINT_GREEN }}
          >
            Create
          </span>
          <PlusIcon color={REDPRINT_GREEN} />
        </button>
      </header>

      {/* ---------- Leaderboard ---------- */}
      <section className="px-3 pt-3">
        {/* Podium row */}
        <div className="flex items-end justify-center gap-1.5">
          {/* 2nd place — silver */}
          <PodiumCell
            org={STATIC_LEADERBOARD.top3[0]}
            place={2}
            heightOffset={20}
            rankDelta={1}
          />
          {/* 1st place — gold, ACTIVE ORG (highlighted green). Uses the
              jpg variant lifted from Redprint5/Assets.xcassets/Gym Logos
              (matches the styling of the static 2nd/3rd positions). */}
          <PodiumCell
            org={{
              shortName: org.shortName,
              name: org.name,
              location: `${org.name.split(" ")[0]}, PA`,
              pointsBehind: "",
              color: orgColor,
              logoSrc: `/logos/${org.id}.jpg`,
            }}
            place={1}
            heightOffset={0}
            isMyGym
          />
          {/* 3rd place — bronze */}
          <PodiumCell
            org={STATIC_LEADERBOARD.top3[2]}
            place={3}
            heightOffset={35}
            rankDelta={-1}
          />
        </div>

        {/* 4th and 5th rows */}
        <div className="mt-2 space-y-1.5">
          {STATIC_LEADERBOARD.rows.map((row, i) => (
            <BottomRow key={row.shortName} rank={i + 4} org={row} />
          ))}
        </div>
      </section>

      {/* ---------- Activity feed (rounded top, offset -y from leaderboard) ---------- */}
      <section className="light:bg-white relative mt-3 flex-1 overflow-hidden rounded-t-2xl bg-black px-2 pb-1 pt-1.5">
        <div className="light:text-black/55 px-1.5 pb-1.5 text-[8.5px] font-semibold text-white/50">
          Activity at {org.name}
        </div>

        <div className="space-y-1.5">
          <WorkoutPostCard
            org={org}
            isDark={isDark}
            orgDark65={orgDark65}
            orgDark50={orgDark50}
            orgDark75={orgDark75}
            title="Untitled workout"
            titleIsItalic
            subType="self-tracked"
            showFooter
            username="dan.p"
          />

          <WorkoutPostCard
            org={org}
            isDark={isDark}
            orgDark65={orgDark65}
            orgDark50={orgDark50}
            orgDark75={orgDark75}
            title="Push"
            subType="pre-planned"
            showFooter={false}
          />
        </div>
      </section>

      {/* ---------- Bottom tab bar (system, not part of CommunityView, but on screen) ---------- */}
      <TabBar org={org} />
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function PodiumCell({
  org,
  place,
  heightOffset,
  isMyGym,
  rankDelta,
}: {
  org: LeaderRow;
  place: 1 | 2 | 3;
  heightOffset: number;
  isMyGym?: boolean;
  rankDelta?: number;
}) {
  return (
    <div
      className="light:bg-white relative flex w-[58px] flex-col items-center rounded-[10px] bg-black pb-1.5 pt-2"
      style={{
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        boxShadow: isMyGym
          ? `inset 0 0 0 1.5px ${REDPRINT_GREEN}, 0 1px 3px rgba(0,0,0,0.25)`
          : "0 1px 3px rgba(0,0,0,0.25)",
        ...(isMyGym && {
          backgroundImage: `linear-gradient(180deg, ${REDPRINT_GREEN}30 0%, transparent 100%)`,
        }),
      }}
    >
      {/* Medal badge (real PNG asset from iOS) */}
      <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            place === 1
              ? "/icons/medal-gold.png"
              : place === 2
                ? "/icons/medal-silver.png"
                : "/icons/medal-bronze.png"
          }
          alt={`${place} medal`}
          className="h-[18px] w-[18px] drop-shadow-md"
        />
      </div>

      {/* Logo (real PNG, fallback to colored initial) */}
      <div
        className="mt-3 flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full shadow-md"
        style={{ backgroundColor: org.logoSrc ? "rgba(0,0,0,0.4)" : org.color }}
      >
        {org.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logoSrc}
            alt={`${org.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span
            className="text-[14px] font-bold text-white"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
          >
            {org.shortName}
          </span>
        )}
      </div>

      {/* Org name */}
      <div
        className="light:text-black mt-1 text-center text-[8px] leading-tight text-white"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
      >
        {org.name}
      </div>
      <div className="light:text-black/65 text-center text-[6px] leading-tight text-white/65">
        {org.location}
      </div>

      {/* Spacer for podium height */}
      <div style={{ height: 32 - heightOffset / 2 }} />

      {/* Rank change indicator */}
      {rankDelta !== undefined && rankDelta !== 0 && (
        <div
          className="flex items-center gap-0.5 text-[7px] font-semibold"
          style={{ color: rankDelta > 0 ? "#22c55e" : "#ef4444" }}
        >
          <Triangle direction={rankDelta > 0 ? "up" : "down"} />
          <span>{Math.abs(rankDelta)}</span>
        </div>
      )}

      {/* Points behind */}
      {org.pointsBehind && (
        <div className="light:text-black mt-1 flex items-baseline gap-0.5 text-[8px] text-white">
          <span
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
          >
            {org.pointsBehind}
          </span>
          <span className="light:text-black/50 text-[6px] text-white/50">lbs</span>
        </div>
      )}
    </div>
  );
}

function BottomRow({ rank, org }: { rank: number; org: LeaderRow }) {
  return (
    <div className="light:bg-white light:text-black flex items-center gap-2 rounded-[10px] bg-black px-2 py-1 text-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]">
      <span
        className="light:text-black/90 w-3 text-center text-[9px] text-white/90"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
      >
        {rank}
      </span>
      <div
        className="flex h-[20px] w-[20px] flex-shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ backgroundColor: org.logoSrc ? "rgba(0,0,0,0.4)" : org.color }}
      >
        {org.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logoSrc}
            alt={`${org.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[9px] font-bold leading-none text-white">
            {org.shortName}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col leading-tight">
        <span
          className="truncate text-[8.5px]"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          {org.name}
        </span>
        <span className="light:text-black/50 truncate text-[6.5px] text-white/50">
          {org.location}
        </span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span
          className="light:text-black text-[9px] text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
        >
          {org.pointsBehind}
        </span>
        <span className="light:text-black/50 text-[6.5px] text-white/50">lbs</span>
      </div>
    </div>
  );
}

function WorkoutPostCard({
  org,
  isDark,
  orgDark65,
  orgDark50,
  orgDark75,
  title,
  titleIsItalic,
  subType,
  showFooter,
  username,
}: {
  org: Org;
  isDark: boolean;
  orgDark65: string;
  orgDark50: string;
  orgDark75: string;
  title: string;
  titleIsItalic?: boolean;
  subType: "self-tracked" | "pre-planned";
  showFooter: boolean;
  username?: string;
}) {
  // iOS post card: dark=darken65@25%, light=darken50@8%
  const cardBg = isDark ? `${orgDark65}40` : `${orgDark50}14`;
  // Inner footer:  dark=darken75@30%, light=darken50@26% (a bit darker so divider reads)
  const footerBg = isDark ? `${orgDark75}50` : `${orgDark50}26`;

  return (
    <div
      className="overflow-hidden rounded-[14px]"
      style={{
        backgroundColor: cardBg,
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    >
      {/* Content (icon + headline + subtype + featured) */}
      <div className="flex items-start gap-2 px-2 pb-1.5 pt-2">
        <div className="flex flex-1 flex-col gap-0.5">
          {/* Headline */}
          <div className="flex items-center gap-1">
            <Dumbbell color={org.primaryColor} />
            <span
              className="text-[7.5px] font-black uppercase tracking-wide"
              style={{ color: org.primaryColor, letterSpacing: "0.06em" }}
            >
              Workout completed
            </span>
          </div>

          {/* Subheadline */}
          <div
            className={`light:text-black text-[11px] leading-tight text-white ${titleIsItalic ? "italic" : ""}`}
            style={{
              fontFamily: "Outfit, sans-serif",
              fontWeight: 700,
              opacity: titleIsItalic ? 0.25 : 1,
            }}
          >
            {title}
          </div>

          {/* Sub-type row */}
          <div className="light:text-black/65 mt-0.5 flex items-center gap-1 text-[7px] text-white/65">
            {subType === "self-tracked" ? <Radio /> : <CheckSquare />}
            <span>
              {subType === "self-tracked" ? "Self-tracked" : "Pre-planned"}
            </span>
          </div>
        </div>

        {/* Featured item: muscle group dots — placeholder */}
        <div className="flex gap-0.5">
          <MuscleDot />
          <MuscleDot />
          <MuscleDot />
        </div>

        <span className="light:text-black/40 text-[10px] leading-none text-white/40">
          ›
        </span>
      </div>

      {/* Footer with username + actions */}
      {showFooter && (
        <div
          className="flex items-center gap-1.5 px-2 py-1.5"
          style={{ backgroundColor: footerBg }}
        >
          <div
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
            style={{ backgroundColor: org.primaryColor }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-white/80" />
          </div>
          <span className="light:text-black/85 text-[8.5px] text-white/85">
            {username}
          </span>
          <span className="light:text-black/55 ml-auto flex items-center gap-2 text-white/55">
            <Heart />
            <Bubble />
            <Ellipsis />
          </span>
        </div>
      )}
    </div>
  );
}

function TabBar({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  return (
    <nav
      className="relative flex h-[44px] items-end justify-around border-t border-white/5 px-3 pb-2 pt-1"
      style={{ backgroundColor: `${orgColor}30` }}
    >
      <TabItem iconSrc="/icons/track_tab_main.png" label="Track" />
      <TabItem iconSrc="/icons/workouts_tab_main.png" label="Workouts" />

      {/* Center floating Redprint cluster button */}
      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
        <div
          className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-white shadow-lg"
          style={{
            background: `radial-gradient(circle, ${darken(orgColor, 40)} 0%, ${darken(orgColor, 60)} 100%)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/redprint-emblem.png"
            alt="Redprint"
            className="h-[60%] w-[60%]"
          />
        </div>
      </div>
      <div className="w-7" />

      <TabItem iconSrc="/icons/community_tab_main.png" label="Community" active />
      <TabItem icon={<ProfileCircle />} label="Profile" />
    </nav>
  );
}

function TabItem({
  iconSrc,
  icon,
  label,
  active,
}: {
  iconSrc?: string;
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${active ? "light:text-black text-white" : "light:text-black/55 text-white/55"}`}
    >
      <div className="h-3.5 w-3.5">
        {iconSrc ? (
          // Render iOS tab icon as a mask over currentColor so it adopts
          // the active/inactive opacity automatically.
          <div
            className="h-full w-full"
            style={{
              backgroundColor: "currentColor",
              WebkitMaskImage: `url(${iconSrc})`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: `url(${iconSrc})`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />
        ) : (
          icon
        )}
      </div>
      <span className="text-[6px] font-medium">{label}</span>
    </div>
  );
}

/* ============================================================
   Icons (inline SVG, matched to SF Symbols)
   ============================================================ */

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      {children}
    </button>
  );
}

function QuestionMarkCircle() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-white/85" strokeWidth="1.3">
      <circle cx="8" cy="8" r="6.5" />
      <text x="8" y="11" textAnchor="middle" fontSize="9" fontWeight="600" fill="rgba(255,255,255,0.85)" stroke="none">?</text>
    </svg>
  );
}

function MagnifyingGlass() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-white/35" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

function Triangle({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className="h-1.5 w-1.5"
      style={{ transform: direction === "down" ? "rotate(180deg)" : "none" }}
    >
      <polygon points="5,0 10,10 0,10" fill="currentColor" />
    </svg>
  );
}

function Dumbbell({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill={color}>
      <rect x="0" y="6" width="2.5" height="4" rx="0.5" />
      <rect x="3" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="5.5" y="7" width="5" height="2" rx="0.5" />
      <rect x="11" y="4.5" width="2" height="7" rx="0.5" />
      <rect x="13.5" y="6" width="2.5" height="4" rx="0.5" />
    </svg>
  );
}

function Radio() {
  return (
    <svg viewBox="0 0 16 16" className="h-2 w-2" fill="currentColor">
      <circle cx="8" cy="8" r="1.5" />
      <path d="M5 5 Q3 8 5 11" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M11 5 Q13 8 11 11" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function CheckSquare() {
  return (
    <svg viewBox="0 0 16 16" className="h-2 w-2 fill-none stroke-current" strokeWidth="1.2">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <polyline points="5,8 7,10 11,5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MuscleDot() {
  return <div className="h-3 w-3 rounded-full bg-white/8" />;
}

function Heart() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="1.2">
      <path d="M8 13.5 C 8 13.5 2 9.5 2 5.5 A 3 3 0 0 1 8 4 A 3 3 0 0 1 14 5.5 C 14 9.5 8 13.5 8 13.5 Z" />
    </svg>
  );
}

function Bubble() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-none stroke-current" strokeWidth="1.2">
      <path d="M3 4 a2 2 0 0 1 2-2 h6 a2 2 0 0 1 2 2 v4 a2 2 0 0 1 -2 2 h-3 l-3 3 v-3 h0 a2 2 0 0 1 -2 -2 z" />
    </svg>
  );
}

function Ellipsis() {
  return (
    <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 fill-current">
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  );
}

function ProfileCircle() {
  return (
    <svg viewBox="0 0 16 16" className="h-full w-full">
      <circle cx="8" cy="8" r="6" fill="rgba(255,255,255,0.15)" />
      <circle cx="8" cy="6.5" r="2" fill="currentColor" />
      <path d="M3 14 a5 5 0 0 1 10 0" fill="currentColor" />
    </svg>
  );
}
