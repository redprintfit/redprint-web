"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { darken, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";
import { TypewriterText } from "@/components/animations/TypewriterText";

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
 *
 * Scroll-driven typewriter: when `progress` is provided, the messages
 * type out in order across the 0 → 1 range — used by the scroll
 * sequence's GYM-SPECIFIC AI step. Defaulting `progress` to a static 1
 * (all messages visible) keeps the Hero carousel usage working
 * unchanged.
 */
export function AIChatbotView({
  org,
  progress,
}: {
  org: Org;
  progress?: MotionValue<number>;
}) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";
  // Standard theme.pageBackground(for: orgColor) — iOS constants:
  //   dark  -> darken(orgColor, 80%) @ 50% opacity
  //   light -> darken(orgColor, 65%) @ 15% opacity
  const pageTint = isDark
    ? `${darken(orgColor, 80)}80`
    : `${darken(orgColor, 65)}26`;

  // Default progress = 1 so unset usages (Hero carousel) render every
  // message fully without any scroll wiring.
  const defaultProgress = useMotionValue(1);
  const p = progress ?? defaultProgress;

  // Per-message + per-list-item sub-progress MVs. Each maps a window
  // of the parent 0→1 progress to its own 0→1 sub-progress. Gaps
  // between messages give the user a small dwell between text blocks.
  const m1 = useSubProgress(p, 0.0, 0.13); // "Build me a chest day workout"
  const m2 = useSubProgress(p, 0.17, 0.32); // "What's your available time today?"
  const m3 = useSubProgress(p, 0.36, 0.43); // "1.5 hours"
  const m4a = useSubProgress(p, 0.47, 0.63); // Intro paragraph
  const m4b = useSubProgress(p, 0.66, 0.71); // "Chest Power Session"
  const m4c = useSubProgress(p, 0.73, 0.78); // Item 1
  const m4d = useSubProgress(p, 0.79, 0.83); // Item 2
  const m4e = useSubProgress(p, 0.84, 0.87); // Item 3
  const m4f = useSubProgress(p, 0.88, 0.91); // Item 4
  const m4g = useSubProgress(p, 0.92, 0.95); // Item 5
  const m4h = useSubProgress(p, 0.96, 1.0); // Item 6

  const m1Started = useStarted(m1);
  const m2Started = useStarted(m2);
  const m3Started = useStarted(m3);
  const m4aStarted = useStarted(m4a);
  const m4bStarted = useStarted(m4b);
  const m4cStarted = useStarted(m4c);
  const m4dStarted = useStarted(m4d);
  const m4eStarted = useStarted(m4e);
  const m4fStarted = useStarted(m4f);
  const m4gStarted = useStarted(m4g);
  const m4hStarted = useStarted(m4h);

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
      <div className="scrollbar-none flex flex-1 flex-col gap-2 overflow-hidden px-2.5 pb-1.5 pt-16">
        {m1Started && (
          <UserBubble>
            <TypewriterText
              text="Build me a chest day workout"
              start={false}
              progress={m1}
            />
          </UserBubble>
        )}

        {m2Started && (
          <BotMessage withActions>
            <TypewriterText
              text="What's your available time today?"
              start={false}
              progress={m2}
            />
          </BotMessage>
        )}

        {m3Started && (
          <UserBubble>
            <TypewriterText
              text="1.5 hours"
              start={false}
              progress={m3}
            />
          </UserBubble>
        )}

        {m4aStarted && (
          <BotMessage>
            <div>
              <TypewriterText
                text={
                  "Here's your chest day workout — 90 minutes of voluntarily making your pecs very angry:"
                }
                start={false}
                progress={m4a}
              />
            </div>
            {m4bStarted && (
              <div
                className="mt-1.5 font-bold"
                style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
              >
                <TypewriterText
                  text="Chest Power Session"
                  start={false}
                  progress={m4b}
                />
              </div>
            )}
            <ol className="mt-1 space-y-0.5">
              {m4cStarted && (
                <TypedListItem
                  progress={m4c}
                  n={1}
                  bold="Barbell Bench Press"
                  rest="— 4x8 @ 135 lbs"
                />
              )}
              {m4dStarted && (
                <TypedListItem
                  progress={m4d}
                  n={2}
                  bold="Barbell Incline Bench Press"
                  rest="— 4x8 @ 115 lbs"
                />
              )}
              {m4eStarted && (
                <TypedListItem
                  progress={m4e}
                  n={3}
                  bold="Dumbbell Incline Bench Press"
                  rest="— 3x10 @ 50 lbs"
                />
              )}
              {m4fStarted && (
                <TypedListItem
                  progress={m4f}
                  n={4}
                  bold="Dumbbell Fly"
                  rest="— 3x12 @ 30 lbs"
                />
              )}
              {m4gStarted && (
                <TypedListItem
                  progress={m4g}
                  n={5}
                  bold="Cable Crossover"
                  rest="— 3x15 @ 30 lbs"
                />
              )}
              {m4hStarted && (
                <TypedListItem
                  progress={m4h}
                  n={6}
                  bold="Cable Fly"
                  rest="— 3x15 @ 25 lbs"
                />
              )}
            </ol>
            {/* Start workout CTA — appears below the list once item 6
                begins typing, fading in alongside it (opacity tied to
                m4h's progress so it's fully visible by the time the
                last list item is done). orgColor solid fill matches
                the app's "primary action" pattern. */}
            {m4hStarted && (
              <motion.button
                className="mt-2 inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[10px] font-bold text-white shadow-[0_2px_0_0_rgba(0,0,0,0.25)]"
                style={{
                  backgroundColor: orgColor,
                  fontFamily: "Outfit, sans-serif",
                  opacity: m4h,
                }}
              >
                <span>Start workout</span>
                <ArrowRight />
              </motion.button>
            )}
          </BotMessage>
        )}
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
   Hooks
   ============================================================ */

/** Map a window of the parent 0→1 progress to its own 0→1. */
function useSubProgress(
  parent: MotionValue<number>,
  start: number,
  end: number,
): MotionValue<number> {
  return useTransform(parent, (v) => {
    if (v <= start) return 0;
    if (v >= end) return 1;
    return (v - start) / (end - start);
  });
}

/** Track whether a sub-progress has started (> 0). Used to gate the
 *  conditional render of each message wrapper. */
function useStarted(mv: MotionValue<number>): boolean {
  const [started, setStarted] = useState(() => mv.get() > 0);
  useEffect(() => mv.on("change", (v) => setStarted(v > 0)), [mv]);
  return started;
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

/** Single list item that types out both the bold prefix and the
 *  regular-weight remainder in sequence based on its progress MV. */
function TypedListItem({
  progress,
  n,
  bold,
  rest,
  dim,
}: {
  progress: MotionValue<number>;
  n: number;
  bold: string;
  rest: string;
  /** Final-item styling — render at 60% opacity to mirror the iOS
   *  "this last one is optional" treatment. */
  dim?: boolean;
}) {
  const fullText = `${n}. ${bold} ${rest}`;
  const boldEnd = `${n}. ${bold}`.length;

  const [shown, setShown] = useState(() =>
    Math.round(fullText.length * progress.get()),
  );
  useEffect(
    () =>
      progress.on("change", (v) =>
        setShown(Math.round(fullText.length * v)),
      ),
    [progress, fullText.length],
  );

  const boldText = fullText.slice(0, Math.min(shown, boldEnd));
  const restText = shown > boldEnd ? fullText.slice(boldEnd, shown) : "";

  return (
    <li className={dim ? "opacity-60" : ""}>
      <span className="font-bold">{boldText}</span>
      {restText}
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

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-2.5 w-2.5 fill-none stroke-current"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="8" x2="13" y2="8" />
      <polyline points="9,4 13,8 9,12" />
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
