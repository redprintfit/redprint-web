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
  /** Fired when a non-active visible logo is clicked. The new active
   *  index in the `orgs` array is provided. */
  onSelect?: (newActiveIndex: number) => void;
};

/** Item size in px (matches md:h-14 md:w-14 = 3.5rem = 56px). */
const ITEM_SIZE = 56;
/** Active item is rendered larger than the on-deck ones. Other slots
 *  shift right by the extra width so the gap stays consistent. */
const ACTIVE_SCALE = 1.3;
const ACTIVE_EXTRA = ITEM_SIZE * (ACTIVE_SCALE - 1); // 16.8

/** Cumulative x position (left edge) for each slot. Gaps after each slot
 *  shrink the further from active. The first gap also accounts for the
 *  larger active item. */
const SLOT_X = [
  0,
  ITEM_SIZE + ACTIVE_EXTRA + 18, // ~91
  ITEM_SIZE + ACTIVE_EXTRA + 18 + ITEM_SIZE + 10, // ~157
  ITEM_SIZE + ACTIVE_EXTRA + 18 + ITEM_SIZE + 10 + ITEM_SIZE + 6, // ~219
  ITEM_SIZE + ACTIVE_EXTRA + 18 + ITEM_SIZE + 10 + ITEM_SIZE + 6 + ITEM_SIZE + 4, // ~279
];
const TRACK_WIDTH = SLOT_X[SLOT_X.length - 1] + ITEM_SIZE; // ~335

/** Per-slot visual styling. Indexed by position (0 = active). */
const SLOT_OPACITY = [1, 0.5, 0.3, 0.18, 0.08];
const SLOT_SCALE_X = [ACTIVE_SCALE, 0.85, 0.7, 0.55, 0.4];
const SLOT_SCALE_Y = [ACTIVE_SCALE, 0.94, 0.88, 0.82, 0.75];

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
  visibleCount = 5,
  intervalMs = 5000,
  activeIndex: controlledIndex,
  onActiveChange,
  paused = false,
  onSelect,
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
          const opacity = SLOT_OPACITY[pos] ?? 0;
          const scaleX = SLOT_SCALE_X[pos] ?? 0.3;
          const scaleY = SLOT_SCALE_Y[pos] ?? 0.7;
          const x = SLOT_X[pos] ?? SLOT_X[SLOT_X.length - 1] + 60;

          const clickable = pos > 0 && onSelect;
          return (
            <motion.button
              key={org.id}
              type="button"
              autoComplete="off"
              aria-label={clickable ? `Switch to ${org.name}` : org.name}
              tabIndex={clickable ? 0 : -1}
              disabled={!clickable}
              className={`absolute left-0 top-0 border-0 bg-transparent p-0 ${
                clickable ? "cursor-pointer" : "cursor-default"
              }`}
              onClick={() => {
                if (clickable) {
                  onSelect((activeIndex + pos) % orgs.length);
                }
              }}
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
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Org logo — raw PNG, no disc background, no ring. Logos are expected to
 * carry their own visual mass (transparent or with their own backgrounds).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OrgLogoPlaceholder({ org, active: _active }: { org: Org; active: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={org.logoSrc}
      alt={`${org.name} logo`}
      className="h-full w-full object-contain"
    />
  );
}
