"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { type Org } from "@/lib/content/orgs";

type Props = {
  orgs: Org[];
  /** How many orgs are visible at once (default 4). */
  visibleCount?: number;
  /** Autoplay interval in ms (default 5000). */
  intervalMs?: number;
  /** Fired when the active (highlighted) org changes. */
  onActiveChange?: (org: Org) => void;
  /** If true, pauses the autoplay. Useful before the carousel is in view. */
  paused?: boolean;
};

/**
 * Horizontal "wheel picker" carousel. Active item is leftmost and fully
 * opaque; subsequent items get progressively more transparent and
 * horizontally compressed. Every `intervalMs`, the active rotates to the
 * back of the queue.
 */
export function OrgCarousel({
  orgs,
  visibleCount = 4,
  intervalMs = 5000,
  onActiveChange,
  paused = false,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % orgs.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [orgs.length, intervalMs, paused]);

  useEffect(() => {
    onActiveChange?.(orgs[activeIndex]);
  }, [activeIndex, orgs, onActiveChange]);

  const visible = Array.from(
    { length: visibleCount },
    (_, i) => orgs[(activeIndex + i) % orgs.length],
  );

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence initial={false}>
        {visible.map((org, pos) => {
          const opacity = pos === 0 ? 1 : Math.max(0.25, 1 - pos * 0.25);
          const scaleX = pos === 0 ? 1 : Math.max(0.5, 1 - pos * 0.15);
          const scaleY = pos === 0 ? 1 : Math.max(0.8, 1 - pos * 0.06);

          return (
            <motion.div
              key={org.id}
              layout
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity, scaleX, scaleY }}
              exit={{ opacity: 0, x: -30 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
              }}
              className="relative h-12 w-12 origin-center md:h-14 md:w-14"
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
 * Placeholder logo: colored disc with the org's short name. Swap to a real
 * <Image src={org.logoSrc}> once SVGs are dropped into public/logos/.
 */
function OrgLogoPlaceholder({ org, active }: { org: Org; active: boolean }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
      style={{
        backgroundColor: org.primaryColor,
        boxShadow: active ? `0 0 0 2px rgba(255,255,255,0.25)` : "none",
      }}
    >
      {org.shortName}
    </div>
  );
}
