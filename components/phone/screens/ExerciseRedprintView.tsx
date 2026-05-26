"use client";

import { darken, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/* ---------- Brand color tokens from ColorExtension.swift ---------- */
const OSWEGO_CG1 = "rgb(4, 130, 0)"; // .oswegoCG1 — Add Exercise gradient start
const ADD_GREEN = "rgb(34, 197, 94)"; // .green — Add Exercise gradient end
const BLOB_BG = "#3a3340"; // BlobAvatarView idle placeholder

/**
 * Exercise detail (Glute Drive) — video hero + bottom sheet.
 * Faithfully ported from
 * Redprint5/Shared SubViews/ExerciseRedprintView.swift.
 *
 * Org-color theming:
 *   - Generate Workout button gradient → [orgColor.darker(25%), orgColor]
 *   - Generate Workout shadow          → orgColor.darker(45%)
 *   - Exercise thumb stroke (when org matches video org) → orgColor 2px
 */
export function ExerciseRedprintView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const orgDarker25 = darken(orgColor, 25);
  const orgDarker45 = darken(orgColor, 45);
  const _isDark = useTheme() === "dark";

  return (
    <div className="flex h-full flex-col bg-black">
      {/* ============================================================
          Video hero (top ~half)
          ============================================================ */}
      <div className="relative h-[58%] overflow-hidden bg-neutral-900">
        {/* Sample iOS video still — gym trainer demonstrating an exercise. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/screens/exercise-video-hero.png"
          alt="Exercise video"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* ExitModalButton (back chevron, top-left) */}
        <button className="absolute left-2.5 top-7 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-[12px] text-white backdrop-blur">
          ‹
        </button>

        {/* "Tap above to play video" prompt */}
        <div className="absolute inset-x-0 bottom-3 text-center text-[8px] text-white/60">
          <div className="text-[10px]">⌃</div>
          Tap above to play video
        </div>
      </div>

      {/* ============================================================
          Bottom sheet (modal at small detent) — pulled up over the
          video so the rounded top clips the video, not the black bg.
          ============================================================ */}
      <div className="light:bg-[#fdf6f0] light:text-black -mt-3 flex flex-1 flex-col rounded-t-2xl bg-[#15090a] text-white">
        {/* Drag indicator */}
        <div className="flex justify-center pt-1.5">
          <div className="light:bg-black/25 h-[3px] w-7 rounded-full bg-white/30" />
        </div>

        {/* ---------- exerciseRow ---------- */}
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <button className="light:text-black/80 text-[12px] text-white/80">
            ‹
          </button>
          {/* Exercise image — circle 32px (scaled from iOS 75px) */}
          <div
            className="light:border-black/25 h-[32px] w-[32px] flex-shrink-0 overflow-hidden rounded-full border-[0.5px] border-white/25"
            style={{
              background:
                "linear-gradient(135deg, #5a4030 0%, #2a1a12 60%, #18100c 100%)",
            }}
          >
            {/* Placeholder of an athlete on equipment — simplified abstract */}
            <div className="relative h-full w-full">
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
              <div className="absolute bottom-0 left-1/2 h-2 w-4 -translate-x-1/2 rounded-t-md bg-white/20" />
            </div>
          </div>
          <span
            className="light:text-black flex-1 text-[12px] leading-tight text-white"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
          >
            Glute Drive
          </span>
          <button className="light:bg-black/10 light:text-black flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] text-white">
            ✕
          </button>
        </div>

        {/* ---------- Action buttons row ---------- */}
        <div className="mt-2 flex items-stretch gap-1.5 px-2">
          {/* Favorite (heart) button — primary/0.15 bg */}
          <button
            className="light:bg-black/15 flex items-center justify-center rounded-[8px] bg-white/15 px-2.5"
            aria-label="Favorite"
          >
            <HeartIcon />
          </button>

          {/* Generate Workout — org-color gradient + shadow */}
          <button
            className="flex flex-1 items-center justify-between gap-1 rounded-[8px] px-1.5 py-1"
            style={{
              background: `linear-gradient(to top right, ${orgDarker25}, ${orgColor})`,
              boxShadow: `0 3px 0 0 ${orgDarker45}`,
            }}
          >
            <span
              className="text-[10px] leading-tight text-white"
              style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
            >
              Generate
              <br />
              Workout
            </span>
            <BlobAvatar />
          </button>

          {/* Add Exercise — oswego/green gradient */}
          <button
            className="flex flex-1 items-center justify-between gap-1 rounded-[8px] px-1.5 py-1"
            style={{
              background: `linear-gradient(to top right, ${OSWEGO_CG1}, ${ADD_GREEN})`,
              boxShadow: `0 3px 0 0 ${darken("#22c55e", 45)}`,
            }}
          >
            <span
              className="text-[10px] leading-tight text-white"
              style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
            >
              Add Exercise
              <br />
              to Workout
            </span>
            <PlusIcon />
          </button>
        </div>

        {/* ---------- Video carousel ---------- */}
        <div className="mt-2 flex flex-1 gap-1 overflow-hidden px-2">
          <VideoThumb src="/screens/exercise-thumb-1.png" />
          <VideoThumb src="/screens/exercise-video-hero.png" active />
          <VideoThumb src="/screens/exercise-thumb-2.png" />
          <VideoThumb src="/screens/exercise-thumb-3.png" />
        </div>

        {/* ---------- Footer hint ---------- */}
        <div className="light:text-black/40 py-1.5 text-center text-[7px] text-white/40">
          Swipe up for more info ⌃
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Video thumbnail (RedprintVideoThumbnail at small detent)
   ============================================================ */

function VideoThumb({ active, src }: { active?: boolean; src: string }) {
  return (
    <div
      className="relative aspect-[2/2.7] flex-1 overflow-hidden rounded-[10px]"
      style={{
        boxShadow: active
          ? "0 0 0 1.5px #3b82f6, 0 0 0 3px transparent"
          : "inset 0 0 0 0.5px rgba(255,255,255,0.25)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark gradient overlay so text reads on any thumbnail */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      {/* "Now playing" label (only on active) */}
      {active && (
        <div className="absolute inset-x-0 top-1 text-center text-[6.5px] font-bold text-orange-400">
          Now playing
        </div>
      )}
      {/* Title at bottom */}
      <div className="absolute inset-x-0 bottom-1 px-1.5">
        <div
          className="text-[8px] leading-tight text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
        >
          How to
        </div>
        {active && (
          <div className="text-[5.5px] text-white/65">@gymitfitne…</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

/**
 * BlobAvatarView idle placeholder. iOS draws a complex blob; this is
 * a simplified equivalent at the small size used in the button (~14px).
 */
function BlobAvatar() {
  return (
    <div
      className="flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full"
      style={{
        background: `radial-gradient(circle at 40% 35%, #d4d4d8 0%, ${BLOB_BG} 90%)`,
      }}
    >
      <div className="h-[6px] w-[6px] rounded-full bg-white/80" />
    </div>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="light:fill-black h-3.5 w-3.5 fill-white"
    >
      <path d="M10 17 C 10 17 2 11.5 2 6.5 A 4 4 0 0 1 10 4.5 A 4 4 0 0 1 18 6.5 C 18 11.5 10 17 10 17 Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3 flex-shrink-0"
      fill="none"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}
