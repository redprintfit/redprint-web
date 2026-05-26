"use client";

import { darken, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/**
 * AI Chatbot — sample chest-day workout conversation.
 * Faithfully ported from Redprint5/Views/Track Page Files/AIChatbotView.swift.
 *
 * Org-color theming (mirrors iOS `backgroundColor = orgColors[0]`):
 *   - Page tint              → darken(orgColor, 65) @ 25% dark / 10% light
 *   - Send button color      → orgColor (full)
 *   - Suggested chip border  → org-aligned (kept light-red per iOS)
 *
 * Surfaces (`theme.isDark ? black : white`):
 *   - User bubble bg, input field bg, top button bg
 *   - Text color: Color.primary (white in dark, near-black in light)
 */
export function AIChatbotView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";
  // Standard theme.pageBackground(for: orgColor) — iOS constants:
  //   dark  -> darken(orgColor, 80%) @ 50% opacity
  //   light -> darken(orgColor, 65%) @ 15% opacity
  const pageTint = isDark
    ? `${darken(orgColor, 80)}80`
    : `${darken(orgColor, 65)}26`;

  return (
    <div
      className="light:bg-white light:text-black relative flex h-full flex-col overflow-hidden bg-black text-white"
      style={{ backgroundImage: `linear-gradient(${pageTint}, ${pageTint})` }}
    >
      {/* ---------- Top button rack (overlays scroll) ---------- */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-start gap-1.5 px-2.5 pt-7">
        <IconButton>
          <Hamburger />
        </IconButton>
        <IconButton>
          <PlusMessage />
        </IconButton>
        <div className="flex-1" />
        <button className="light:text-black flex h-6 w-6 items-center justify-center text-[10px] text-white">
          ✕
        </button>
      </header>

      {/* ---------- Messages scroll ---------- */}
      <div className="scrollbar-none flex flex-1 flex-col gap-2 overflow-hidden px-2.5 pb-1.5 pt-12">
        {/* User: "Build me a chest day workout" */}
        <UserBubble>Build me a chest day workout</UserBubble>

        {/* Bot: "What's your available time today?" */}
        <BotMessage withActions>
          What&apos;s your available time today?
        </BotMessage>

        {/* User: "1.5 hours" */}
        <UserBubble>1.5 hours</UserBubble>

        {/* Bot: long response */}
        <BotMessage>
          <div>
            Here&apos;s your chest day workout — 90 minutes of voluntarily
            making your pecs very angry:
          </div>
          <div
            className="mt-1.5 font-bold"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
          >
            Chest Power Session
          </div>
          <ol className="mt-1 space-y-0.5">
            <ChestListItem n={1} bold="Barbell Bench Press" rest="— 4x8 @ 135 lbs" />
            <ChestListItem n={2} bold="Barbell Incline Bench Press" rest="— 4x8 @ 115 lbs" />
            <ChestListItem n={3} bold="Dumbbell Incline Bench Press" rest="— 3x10 @ 50 lbs" />
            <ChestListItem n={4} bold="Dumbbell Fly" rest="— 3x12 @ 30 lbs" />
            <ChestListItem n={5} bold="Cable Crossover" rest="— 3x15 @ 30 lbs" />
            <li className="opacity-60">
              <span className="font-bold">6. Cable Fly</span> — 3x15 @ 25 lbs
            </li>
          </ol>
        </BotMessage>
      </div>

      {/* ---------- Input bar ---------- */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-2"
        style={{ backgroundColor: pageTint }}
      >
        <div className="light:bg-white flex-1 rounded-full bg-black px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.12)]">
          <span className="light:text-black/30 text-[10px] text-white/30">
            Ask Redprint...
          </span>
        </div>
        {/* Send button — orgColor when enabled (here we render the "disabled empty" state) */}
        <button
          className="light:bg-white flex h-7 w-7 items-center justify-center rounded-full bg-black"
          aria-label="Send"
        >
          <ArrowUpCircleFill color={`rgba(127,127,127,0.4)`} />
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function IconButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="light:bg-white light:text-black flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]">
      {children}
    </button>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div
        className="light:bg-white light:text-black max-w-[78%] rounded-[10px] bg-black px-2.5 py-1.5 text-[10px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {children}
      </div>
    </div>
  );
}

function BotMessage({
  children,
  withActions,
}: {
  children: React.ReactNode;
  withActions?: boolean;
}) {
  return (
    <div className="flex flex-col items-start">
      <div
        className="light:text-black max-w-[88%] px-1 text-[10px] leading-tight text-white"
        style={{ fontFamily: "Outfit, sans-serif", fontWeight: 500 }}
      >
        {children}
      </div>
      {withActions && (
        <div className="light:text-black/65 mt-0.5 flex items-center gap-1 pl-1 text-white/65">
          <button className="p-1 opacity-65">
            <RegenerateIcon />
          </button>
          <button className="p-1 opacity-65">
            <CopyIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function ChestListItem({
  n,
  bold,
  rest,
}: {
  n: number;
  bold: string;
  rest: string;
}) {
  return (
    <li>
      <span className="font-bold">
        {n}. {bold}
      </span>{" "}
      {rest}
    </li>
  );
}

/* ============================================================
   Icons (SF Symbol approximations)
   ============================================================ */

function Hamburger() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2.5" y1="4" x2="13.5" y2="4" />
      <line x1="2.5" y1="8" x2="13.5" y2="8" />
      <line x1="2.5" y1="12" x2="13.5" y2="12" />
    </svg>
  );
}

function PlusMessage() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M2 4 a2 2 0 0 1 2-2 h8 a2 2 0 0 1 2 2 v5 a2 2 0 0 1 -2 2 h-4 l-3 2.5 v-2.5 h-1 a2 2 0 0 1 -2 -2 z" />
      <line x1="8" y1="4.5" x2="8" y2="8.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="6" y1="6.5" x2="10" y2="6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function RegenerateIcon() {
  // arrow.trianglehead.counterclockwise
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8 a5 5 0 1 0 1.5 -3.5" />
      <polyline points="2,3 4.5,4.5 3,7" />
    </svg>
  );
}

function CopyIcon() {
  // square.on.square
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.3">
      <rect x="2" y="5" width="9" height="9" rx="1.5" />
      <rect x="5" y="2" width="9" height="9" rx="1.5" />
    </svg>
  );
}

function ArrowUpCircleFill({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <circle cx="12" cy="12" r="11" fill={color} />
      <path
        d="M12 6 L12 18 M7 11 L12 6 L17 11"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
