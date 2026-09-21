import { luminance } from "@/lib/gyms/tag";

/**
 * What the studio needs to know about a logo before putting it on a tag.
 */
export type LogoAnalysis = {
  /** Mean relative luminance of the logo's visible pixels, 0..1. */
  meanLuminance: number;
  /** Share of pixels that are visible at all (alpha above threshold). */
  coverage: number;
  /**
   * True when the image has a solid background of its own (an app icon,
   * a boxed wordmark). Recoloring one of those turns the whole rectangle
   * into a block, so they're always shown as-is.
   */
  opaqueBackground: boolean;
};

export type LogoTreatment = "original" | "white" | "dark";

const SAMPLE = 48;
const ALPHA_MIN = 40;

/**
 * Sample a same-origin logo through a small canvas. Returns null when
 * the image can't be read (cross-origin taint, SVG without intrinsic
 * size), in which case the caller falls back to showing it unchanged.
 */
export function analyzeLogo(src: string): Promise<LogoAnalysis | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") return resolve(null);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

        let visible = 0;
        let lumSum = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < ALPHA_MIN) continue;
          visible++;
          lumSum += luminance(rgbToHex(data[i], data[i + 1], data[i + 2]));
        }
        if (visible === 0) return resolve(null);

        const corner = (x: number, y: number) => data[(y * SAMPLE + x) * 4 + 3];
        const opaqueBackground =
          corner(0, 0) > 250 &&
          corner(SAMPLE - 1, 0) > 250 &&
          corner(0, SAMPLE - 1) > 250 &&
          corner(SAMPLE - 1, SAMPLE - 1) > 250;

        resolve({
          meanLuminance: lumSum / visible,
          coverage: visible / (SAMPLE * SAMPLE),
          opaqueBackground,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Pick how to render a logo so it reads against the tag.
 *
 * A dark logo on a dark tag (Equinox's black mark on a black tag) gets
 * knocked out to white; a pale logo on a pale tag gets knocked to dark.
 * Anything that already contrasts, or that carries its own background,
 * is left alone.
 */
export function pickTreatment(
  tagLuminance: number,
  logo: LogoAnalysis | null,
): LogoTreatment {
  if (!logo || logo.opaqueBackground) return "original";
  const tagDark = tagLuminance < 0.3;
  const tagLight = tagLuminance > 0.6;
  if (tagDark && logo.meanLuminance < 0.35) return "white";
  if (tagLight && logo.meanLuminance > 0.65) return "dark";
  return "original";
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
