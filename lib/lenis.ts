import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenisInstance(l: Lenis | null) {
  instance = l;
}

export function getLenisInstance(): Lenis | null {
  return instance;
}

/**
 * Smooth-scroll to the top of the page. Routes through the Lenis
 * instance when available so the existing smooth-scroll easing carries
 * the motion; falls back to the native `window.scrollTo` with smooth
 * behavior when Lenis hasn't initialised yet (e.g., before client hydration).
 */
export function scrollToTop(opts?: { immediate?: boolean }) {
  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(0, opts);
    return;
  }
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: opts?.immediate ? "auto" : "smooth" });
  }
}

/**
 * Smooth-scroll to an absolute vh position in the document. Converts
 * vh → px using the current viewport height, then defers to Lenis.
 *
 * `absVh` is measured relative to the top of the page (not the sticky
 * frame), matching the scroll-timeline coordinate system: absVh = 0
 * is the top, absVh = TOTAL_VH − 100 is the very bottom of scrollable
 * range.
 */
export function scrollToVh(absVh: number, opts?: { immediate?: boolean }) {
  if (typeof window === "undefined") return;
  const px = (absVh * window.innerHeight) / 100;
  const lenis = getLenisInstance();
  if (lenis) {
    lenis.scrollTo(px, opts);
    return;
  }
  window.scrollTo({ top: px, behavior: opts?.immediate ? "auto" : "smooth" });
}
