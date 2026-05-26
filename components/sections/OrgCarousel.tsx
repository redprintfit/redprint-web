"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Org } from "@/lib/content/orgs";

type Props = {
  orgs: Org[];
  /** How many orgs are visible at once (default 4). */
  visibleCount?: number;
  /** Autoplay interval in ms. Ignored when `activeIndex` is provided. */
  intervalMs?: number;
  /** If supplied, the carousel becomes controlled — no internal interval. */
  activeIndex?: number;
  /** Fired when the active (highlighted) org changes. */
  onActiveChange?: (org: Org, index: number) => void;
  /** Pause autoplay (uncontrolled mode only). */
  paused?: boolean;
};

/** Item size in px (matches md:h-14 md:w-14 = 3.5rem = 56px). */
const ITEM_SIZE = 56;
/** Cumulative x position (left edge) for each slot. Gaps after each slot
 *  shrink the further from active: 18 / 10 / 6 px. */
const SLOT_X = [
  0,
  ITEM_SIZE + 18, // 74
  ITEM_SIZE + 18 + ITEM_SIZE + 10, // 140
  ITEM_SIZE + 18 + ITEM_SIZE + 10 + ITEM_SIZE + 6, // 202
];
const TRACK_WIDTH = SLOT_X[SLOT_X.length - 1] + ITEM_SIZE; // 258

/**
 * Horizontal "wheel picker" carousel. Active item is leftmost and fully
 * opaque; subsequent items get progressively more transparent and
 * horizontally compressed. Autoplays in uncontrolled mode; in controlled
 * mode, the parent supplies `activeIndex`.
 *
 * Items are absolutely positioned and tweened via `x` rather than flex +
 * margin + layout animation — that approach was leaving the active item
 * stuck at its `initial.x` because `x` wasn't included in `animate`.
 */
export function OrgCarousel({
  orgs,
  visibleCount = 4,
  intervalMs = 5000,
  activeIndex: controlledIndex,
  onActiveChange,
  paused = false,
}: Props) {
  const controlled = controlledIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlled ? controlledIndex : internalIndex;

  useEffect(() => {
    if (controlled || paused) return;
    const t = setInterval(() => {
      setInternalIndex((i) => (i + 1) % orgs.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [orgs.length, intervalMs, paused, controlled]);

  useEffect(() => {
    onActiveChange?.(orgs[activeIndex], activeIndex);
  }, [activeIndex, orgs, onActiveChange]);

  const visible = Array.from(
    { length: visibleCount },
    (_, i) => orgs[(activeIndex + i) % orgs.length],
  );

  return (
    <div
      className="relative"
      style={{ width: TRACK_WIDTH, height: ITEM_SIZE }}
    >
      <AnimatePresence initial={false}>
        {visible.map((org, pos) => {
          const opacity =
            pos === 0 ? 1 : ([null, 0.5, 0.3, 0.18][pos] ?? 0.15);
          const scaleX = pos === 0 ? 1 : Math.max(0.5, 1 - pos * 0.15);
          const scaleY = pos === 0 ? 1 : Math.max(0.8, 1 - pos * 0.06);
          const x = SLOT_X[pos] ?? SLOT_X[SLOT_X.length - 1] + 60;

          return (
            <motion.div
              key={org.id}
              className="absolute left-0 top-0"
              style={{
                width: ITEM_SIZE,
                height: ITEM_SIZE,
                transformOrigin: "left center",
              }}
              // Entering items start ~80px past their final slot, smaller
              // and invisible — so they slide leftward in sync with the
              // shifting items, "from the back of the rotation".
              initial={{ opacity: 0, x: x + 80, scaleX: 0.5, scaleY: 0.8 }}
              animate={{ opacity, scaleX, scaleY, x }}
              exit={{ opacity: 0, x: x - 60 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <OrgLogoPlaceholder org={org} active={pos === 0} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Org logo. Real PNG (lifted from Redprint5/Assets.xcassets/Gym Photos/Gym Logos),
 * sat on a small dark disc so transparent logos read on both themes.
 */
function OrgLogoPlaceholder({ org, active }: { org: Org; active: boolean }) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black/40 shadow-md"
      style={{
        // Stroke flips with the theme (white in dark mode, dark in light mode).
        boxShadow: active
          ? "0 0 0 2px var(--color-fg-base), 0 4px 12px rgba(0,0,0,0.3)"
          : "none",
      }}
    >
      {/* Using a plain <img> instead of next/image: per-org logos vary in
          dimensions and we don't need Next's optimization at 56px. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={org.logoSrc}
        alt={`${org.name} logo`}
        className="h-[80%] w-[80%] object-contain"
      />
    </div>
  );
}
