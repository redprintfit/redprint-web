/**
 * Geometry + color math for the Redprint hexagon tag.
 *
 * The physical tag is a flat-top hexagon (flat top and bottom edges,
 * vertices at left and right mid-height) with generously rounded
 * corners, filled with a gradient built from the gym's brand colors.
 * A regular flat-top hexagon has width / height = 2 / sqrt(3), which
 * matches the shipped tag art in /public/tags (373 x 340 ~= 1.097).
 */

/** Tag viewBox. 1000 x 866 keeps the 2/sqrt(3) hexagon aspect. */
export const TAG_VB_W = 1000;
export const TAG_VB_H = 866;
export const TAG_ASPECT = TAG_VB_W / TAG_VB_H;

/** Corner rounding, in viewBox units. Tuned against the shipped art. */
const CORNER_R = 96;

type Pt = [number, number];

const HEX_POINTS: Pt[] = [
  [250, 0],
  [750, 0],
  [1000, 433],
  [750, 866],
  [250, 866],
  [0, 433],
];

/**
 * Build an SVG path for a closed polygon with rounded corners.
 *
 * For each vertex we walk `r` back along both adjacent edges and join
 * those two points with a quadratic curve whose control point is the
 * original (sharp) vertex. `r` is clamped per-corner to half of the
 * shorter adjacent edge so tight corners degrade gracefully instead of
 * turning inside out.
 */
export function roundedPolygonPath(points: Pt[], r: number): string {
  const n = points.length;
  const parts: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const toPrev = norm(sub(prev, curr));
    const toNext = norm(sub(next, curr));
    const lenPrev = dist(prev, curr);
    const lenNext = dist(next, curr);
    const rr = Math.min(r, lenPrev / 2, lenNext / 2);

    const p1 = add(curr, scale(toPrev, rr));
    const p2 = add(curr, scale(toNext, rr));

    parts.push(i === 0 ? `M ${fmt(p1)}` : `L ${fmt(p1)}`);
    parts.push(`Q ${fmt(curr)} ${fmt(p2)}`);
  }

  parts.push("Z");
  return parts.join(" ");
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const norm = (a: Pt): Pt => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
const fmt = (p: Pt) => `${round(p[0])} ${round(p[1])}`;
const round = (n: number) => Math.round(n * 100) / 100;

/** The tag silhouette, precomputed — the shape never changes. */
export const TAG_PATH = roundedPolygonPath(HEX_POINTS, CORNER_R);

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

/** Expand #abc -> #aabbcc and validate. Returns null when unparseable. */
export function normalizeHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const h = input.trim().replace(/^#/, "");
  const expanded =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) return null;
  return `#${expanded.toLowerCase()}`;
}

/** WCAG relative luminance, 0 (black) -> 1 (white). */
export function luminance(hex: string): number {
  const h = normalizeHex(hex) ?? "#000000";
  const chan = (i: number) => {
    const c = parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(0) + 0.7152 * chan(1) + 0.0722 * chan(2);
}

/**
 * Foreground color that stays legible on `hex`. The 0.42 threshold sits
 * a little above the usual 0.5 midpoint because the tag's gradient
 * darkens toward its lower-right, so mid-tone brand colors still carry
 * white type comfortably.
 */
export function readableOn(hex: string): "light" | "dark" {
  return luminance(hex) > 0.42 ? "dark" : "light";
}
