"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { RedprintTag, type TagDesign } from "@/components/gyms/RedprintTag";
import { Eyebrow, Reveal } from "@/components/gyms/GymUI";
import { designerUrlWithDraft } from "@/lib/gyms/tagDraft";
import { luminance, normalizeHex } from "@/lib/gyms/tag";
import { analyzeLogo, pickTreatment, type LogoAnalysis } from "@/lib/gyms/logoContrast";
import { darken } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

type BrandResponse = {
  name: string | null;
  logoUrl: string | null;
  primary: string | null;
  secondary: string | null;
  monochrome?: boolean;
  palette?: string[];
  source: "ai" | "heuristic";
  finalUrl: string;
};

type Variant = { primary: string; secondary: string };

/** Blank-tag colors used before a gym has been looked up — follow the
 *  theme so the tag isn't the one light object on a dark page. Dark
 *  is a shade above the page so it still reads as a separate surface. */
const BLANK_LIGHT = { primary: "#ffffff", secondary: "#e2dbd0" };
const BLANK_DARK = { primary: "#332f2e", secondary: "#1c1a19" };

/** A brand with no usable color (black/white identities) gets a black tag. */
const INK_PRIMARY = "#1c1c1c";
const INK_SECONDARY = "#000000";
/** The light alternative Regenerate ends on: white paper, warm shadow. */
const PAPER = { primary: "#ffffff", secondary: "#e2dbd0" };
const MAX_VARIANTS = 7;
/** How long Regenerate shows its working state before the new tag lands. */
const REGENERATE_MS = 450;

const pair = (hex: string): Variant => ({ primary: hex, secondary: darken(hex, 34) });

const distance = (a: string, b: string) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return Math.hypot(ch(a, 0) - ch(b, 0), ch(a, 1) - ch(b, 1), ch(a, 2) - ch(b, 2));
};

/**
 * Every tag Regenerate can show, in order. Regenerate used to re-run the
 * same lookup and land on the same tag (Oct 9 2026 review); now it walks
 * this list, changing the background each time:
 *
 *   1. The brand pair the lookup chose. When that came from markup
 *      heuristics alone, the logo's own color goes first instead: the logo
 *      is a surer brand signal than CSS frequency. A black-and-white brand
 *      with a black-and-white logo starts on the black tag.
 *   2. The logo's color, if not already used.
 *   3. The site's other plausible brand colors.
 *   4. Black, then white.
 *
 * Near-duplicates are dropped so every press visibly changes the tag.
 */
function buildVariants(brand: BrandResponse, logo: LogoAnalysis | null): Variant[] {
  const out: Variant[] = [];
  const push = (v: Variant | null) => {
    if (!v || out.length >= MAX_VARIANTS) return;
    const p = normalizeHex(v.primary);
    const s = normalizeHex(v.secondary);
    if (!p || !s) return;
    if (out.some((o) => distance(o.primary, p) < 40)) return;
    out.push({ primary: p, secondary: s });
  };

  const brandPrimary = brand.monochrome ? null : normalizeHex(brand.primary);
  const base = brandPrimary
    ? { primary: brandPrimary, secondary: normalizeHex(brand.secondary) ?? darken(brandPrimary, 34) }
    : null;
  const logoColor = logo?.dominantColor && logo.colorShare >= 0.2 ? pair(logo.dominantColor) : null;
  const ink = { primary: INK_PRIMARY, secondary: INK_SECONDARY };

  if (base && brand.source === "ai") {
    push(base);
    push(logoColor);
  } else if (base) {
    push(logoColor);
    push(base);
  } else {
    push(logoColor ?? ink);
  }
  for (const c of brand.palette ?? []) push(pair(c));
  push(ink);
  push(PAPER);
  return out;
}

/**
 * Paste a website, see your tag.
 *
 * Posts the URL to /api/brand-lookup, renders the result live, and
 * judges for itself how the logo should sit on the tag. Fine-tuning
 * (colors, treatments) belongs to the designer in the web app; this is
 * the quick look that makes someone want to go there.
 */
export function TagStudio() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brand, setBrand] = useState<BrandResponse | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const [analysis, setAnalysis] = useState<LogoAnalysis | null>(null);
  const [variantIndex, setVariantIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  // The address the current result came from; Regenerate only cycles
  // colors while the field still says the same thing.
  const lookedUpRef = useRef<string | null>(null);

  const isDark = useTheme() === "dark";
  const blank = isDark ? BLANK_DARK : BLANK_LIGHT;

  const hasResult = brand !== null;

  // Logos go through the same-origin proxy so they can be sampled and
  // so hotlink-protected hosts don't blank the tag.
  const logoSrc = brand?.logoUrl ? `/api/brand-logo?url=${encodeURIComponent(brand.logoUrl)}` : null;

  useEffect(() => {
    if (!logoSrc) return;
    let cancelled = false;
    analyzeLogo(logoSrc).then((a) => {
      if (!cancelled) setAnalysis(a);
    });
    return () => {
      cancelled = true;
    };
  }, [logoSrc]);

  const variants = useMemo(() => (brand ? buildVariants(brand, analysis) : []), [brand, analysis]);
  const variant = variants.length ? variants[variantIndex % variants.length] : null;
  const primary = !hasResult ? blank.primary : (variant?.primary ?? INK_PRIMARY);
  const secondary = !hasResult ? blank.secondary : (variant?.secondary ?? INK_SECONDARY);

  const tagLum = luminance(normalizeHex(primary) ?? INK_PRIMARY) * 0.5 +
    luminance(normalizeHex(secondary) ?? INK_SECONDARY) * 0.5;

  const design: TagDesign = {
    primary,
    secondary,
    logoUrl: logoFailed ? null : logoSrc,
    logoTreatment: pickTreatment(tagLum, analysis),
  };

  // What "Edit / save" hands to the web app: the draft exactly as
  // rendered above, with the logo's original URL (not our proxy).
  const editHref = hasResult
    ? designerUrlWithDraft({
        name: brand.name,
        site: brand.finalUrl,
        primary,
        secondary,
        logo: logoFailed ? null : brand.logoUrl,
        logoTreatment: design.logoTreatment,
      })
    : null;

  const lookup = async () => {
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setLogoFailed(false);
    setAnalysis(null);
    setVariantIndex(0);
    try {
      const res = await fetch("/api/brand-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          typeof json?.message === "string"
            ? json.message
            : "We couldn't read that website. Try the full address.",
        );
        return;
      }
      setBrand(json as BrandResponse);
      lookedUpRef.current = url.trim();
    } catch {
      setError("Something went wrong reaching our server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup();
  };

  // Next background. A different address in the field means a new gym, so
  // that's a fresh lookup instead.
  const regenerate = () => {
    if (loading || regenerating) return;
    if (url.trim() !== lookedUpRef.current) {
      lookup();
      return;
    }
    if (variants.length < 2) return;
    setRegenerating(true);
    window.setTimeout(() => {
      setVariantIndex((i) => (i + 1) % variants.length);
      setRegenerating(false);
    }, REGENERATE_MS);
  };

  const busy = loading || regenerating;

  const buttonBase =
    "shrink-0 rounded-xl px-5 py-3 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <section
      id="design-your-tag"
      className="gym-defer relative px-6 py-24 sm:px-10 md:py-32"
    >
      <div className="mx-auto flex max-w-[560px] flex-col items-center text-center">
        <Reveal className="flex w-full flex-col items-center">
          {/* Dims and softens while Regenerate works, so the press visibly does something. */}
          <div
            aria-busy={busy}
            className="transition-[opacity,filter,transform] duration-300 ease-out"
            style={{
              opacity: busy && hasResult ? 0.35 : 1,
              filter: busy && hasResult ? "blur(3px)" : "none",
              transform: busy && hasResult ? "scale(0.97)" : "none",
            }}
          >
            <RedprintTag
              design={design}
              width={272}
              glow={hasResult}
              onLogoError={() => setLogoFailed(true)}
            />
          </div>
        </Reveal>

        <Reveal delay={0.08} className="w-full">
          <Eyebrow className="mt-14 justify-center">Design your tag</Eyebrow>

          <form onSubmit={submit} className="mt-8 w-full">
            <div
              className="flex items-center gap-2 rounded-2xl p-2"
              style={{
                background: "var(--gym-surface)",
                border: "1px solid var(--gym-border)",
              }}
            >
              <input
                type="text"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Your gym's website"
                aria-label="Your gym's website"
                autoComplete="url"
                className="font-body min-w-0 flex-1 bg-transparent px-4 py-3 text-[16px] focus:outline-none"
                style={{ color: "var(--gym-fg)" }}
              />

              {hasResult ? (
                <>
                  {/* Once there's a tag, generating again is the secondary
                      action and ordering is the primary one. */}
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={!url.trim() || busy}
                    aria-label="Regenerate tag"
                    title="Try another color"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      background: "transparent",
                      color: "var(--gym-fg)",
                      border: "1px solid var(--gym-border)",
                    }}
                  >
                    <RefreshCw size={18} className={busy ? "animate-spin" : undefined} />
                  </button>
                  <a
                    href={editHref ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonBase}
                    style={{ background: "var(--gym-accent)", color: "var(--gym-accent-ink)" }}
                  >
                    Edit / save
                  </a>
                </>
              ) : (
                <button
                  type="submit"
                  disabled={!url.trim() || loading}
                  className={buttonBase}
                  style={{ background: "var(--gym-fg)", color: "var(--gym-bg)" }}
                >
                  {loading ? "Reading…" : "See your tag"}
                </button>
              )}
            </div>

            {error && (
              <p role="alert" className="font-body mt-3 text-[13px] text-[#ff6b63]">
                {error}
              </p>
            )}
            <p className="font-body mt-3 text-[12px]" style={{ color: "var(--gym-muted)" }}>
              {hasResult && variants.length > 1
                ? `Color ${(variantIndex % variants.length) + 1} of ${variants.length} · tap ↻ for another`
                : "See what your Redprint tag would look like"}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
