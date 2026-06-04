"use client";

import { cn } from "@/lib/utils";

/**
 * Animated film-grain overlay. Cycles through 5 pre-generated noise PNGs
 * via a CSS keyframe animation with `steps(5)` timing — frames jump
 * between PNGs rather than crossfading, which is what gives authentic
 * film grain its shimmer. PNGs come from `scripts/generate-noise.js`.
 *
 * `position` lets the same component be used globally (default "fixed",
 * pinned to the viewport) or scoped to a container ("absolute", filling
 * its nearest positioned ancestor). Inside our scroll-sequence bottom
 * panel we use the absolute variant so the grain is only visible on the
 * panel's surface, not across the whole page.
 */
type Props = {
  /** 0.03 – 0.08 reads as natural grain; default 0.06. */
  opacity?: number;
  /** Animation duration (full 5-frame cycle). Default "0.5s". */
  speed?: string;
  /** Mix-blend-mode. Default "overlay". */
  blendMode?: "overlay" | "soft-light" | "screen" | "multiply";
  /** Default 50 — above content, below nav/modals. */
  zIndex?: number;
  /** "fixed" (default) for viewport-wide grain, "absolute" for scoped. */
  position?: "fixed" | "absolute";
  /** When true the overlay is a single still frame — no animation. */
  isStatic?: boolean;
  className?: string;
};

export function Grain({
  opacity = 0.06,
  speed = "0.5s",
  blendMode = "overlay",
  zIndex = 50,
  position = "fixed",
  isStatic = false,
  className,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0",
        position === "fixed" ? "fixed" : "absolute",
        className,
      )}
      style={{
        opacity,
        mixBlendMode: blendMode,
        zIndex,
        // Static mode locks to noise-1 and skips the keyframe animation;
        // useful when the grain is more "texture" than "shimmer."
        animation: isStatic ? undefined : `grain ${speed} steps(5) infinite`,
        backgroundImage: "url(/grain/noise-1.png)",
      }}
    />
  );
}
