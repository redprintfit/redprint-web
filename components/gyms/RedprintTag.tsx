"use client";

import { useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { darken } from "@/lib/content/orgs";
import {
  TAG_ASPECT,
  TAG_PATH,
  TAG_VB_H,
  TAG_VB_W,
  normalizeHex,
  readableOn,
} from "@/lib/gyms/tag";

const STOP_TRANSITION: React.CSSProperties = {
  transition: "stop-color 900ms cubic-bezier(0.22, 1, 0.36, 1)",
};

export type TagDesign = {
  /** Gradient start — the gym's primary brand color. */
  primary: string;
  /** Gradient end. Defaults to a darkened primary when absent. */
  secondary?: string | null;
  /** Absolute or same-origin URL of the gym's logo. */
  logoUrl?: string | null;
  /** How to treat the logo against the tag fill. */
  logoTreatment?: "original" | "white" | "dark";
  /** Bottom label. The physical tags read "Redprint tag". */
  label?: string;
};

/**
 * A Redprint tag, rendered live from a brand color pair and a logo.
 *
 * Everything inside the hexagon is sized in `em` against a font-size of
 * `width / 100`, so a single `width` prop scales the mark, the logo box,
 * and the label together without a transform.
 */
export function RedprintTag({
  design,
  width = 320,
  glow = false,
  className,
  onLogoError,
}: {
  design: TagDesign;
  width?: number;
  /** Soft colored halo behind the tag — used in the hero. */
  glow?: boolean;
  className?: string;
  /**
   * Fired when the logo fails to load — third-party logos are often
   * hotlink-protected. Callers fall back to the placeholder.
   */
  onLogoError?: () => void;
}) {
  const gradientId = useId();

  const primary = normalizeHex(design.primary) ?? "#d83a3a";
  const secondary = normalizeHex(design.secondary ?? "") ?? darken(primary, 34);
  // Contrast is judged against the gradient's midpoint, since the mark
  // sits near the top and the label near the bottom.
  const tone = readableOn(mix(primary, secondary, 0.5));
  const ink = tone === "dark" ? "#12100f" : "#ffffff";

  const height = width / TAG_ASPECT;
  const treatment = design.logoTreatment ?? "original";
  const logoFilter =
    treatment === "white"
      ? "brightness(0) invert(1)"
      : treatment === "dark"
        ? "brightness(0)"
        : undefined;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        // Drives every `em` below.
        fontSize: width / 100,
      }}
    >
      {glow && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: "-14%",
            background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            filter: "blur(56px)",
            opacity: 0.5,
            borderRadius: "50%",
          }}
        />
      )}

      <svg
        viewBox={`0 0 ${TAG_VB_W} ${TAG_VB_H}`}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          // The tag is a physical object, so it casts a shadow. This is
          // load-bearing in light mode: the blank (white) tag sits on a
          // cream page and would otherwise dissolve into it. drop-shadow
          // follows the hexagon silhouette rather than the bounding box.
          filter: "drop-shadow(0 10px 20px rgba(23,18,15,0.20))",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {/* stop-color transitions so a brand change crossfades
                rather than snapping — the same easing the site uses
                for its org-tinted background. */}
            <stop offset="0%" stopColor={primary} style={STOP_TRANSITION} />
            <stop offset="100%" stopColor={secondary} style={STOP_TRANSITION} />
          </linearGradient>
        </defs>
        <path d={TAG_PATH} fill={`url(#${gradientId})`} />
      </svg>

      {/* Face content — mark, logo, label. Each is placed absolutely so
          the logo sits at the true centre of the tag; the mark and label
          hug the top and bottom edges. */}
      <div style={{ position: "absolute", inset: 0, color: ink }}>
        <div
          role="img"
          aria-label="Redprint"
          style={{
            position: "absolute",
            top: "6.5em",
            left: "50%",
            transform: "translateX(-50%)",
            width: "10.5em",
            height: "10.5em",
            backgroundColor: "currentColor",
            WebkitMaskImage: "url(/logos/redprint-emblem.png)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskImage: "url(/logos/redprint-emblem.png)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
          }}
        />

        {design.logoUrl ? (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "56em",
              height: "36em",
            }}
          >
            {/* Outgoing and incoming logos overlap and crossfade, so a
                brand change never flashes an empty tag. */}
            <AnimatePresence initial={false}>
              <motion.img
                key={design.logoUrl}
                src={design.logoUrl}
                alt=""
                draggable={false}
                onError={onLogoError}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter: logoFilter,
                }}
              />
            </AnimatePresence>
          </div>
        ) : (
          /* Placeholder outline. Drawn as an SVG rect rather than a CSS
             dashed border so the dash length, gap, stroke weight, and
             corner radius are explicit — CSS `dashed` picks its own
             (short) dash length and can't be tuned. The viewBox is in
             the same em units as the box, so it scales with the tag. */
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "52em",
              height: "30em",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <svg
              viewBox="0 0 52 30"
              aria-hidden
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            >
              <rect
                x="0.3"
                y="0.3"
                width="51.4"
                height="29.4"
                rx="4"
                fill="none"
                stroke={tone === "dark" ? "rgba(18,16,15,0.42)" : "rgba(255,255,255,0.5)"}
                strokeWidth="0.5"
                strokeDasharray="3 1.8"
              />
            </svg>
            <span
              style={{
                position: "relative",
                fontSize: "7em",
                lineHeight: 1.15,
                fontStyle: "italic",
                fontWeight: 500,
                opacity: 0.62,
                padding: "0 0.6em",
              }}
            >
              Your gym logo
            </span>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "7em",
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontSize: "5.4em",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              opacity: 0.62,
            }}
          >
            {design.label ?? "Redprint tag"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Linear blend of two hex colors, `t` = 0 -> a, 1 -> b. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const ca = (pa >> shift) & 0xff;
    const cb = (pb >> shift) & 0xff;
    return Math.round(ca + (cb - ca) * t);
  };
  const to2 = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to2(ch(16))}${to2(ch(8))}${to2(ch(0))}`;
}
