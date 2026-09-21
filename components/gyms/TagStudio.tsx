"use client";

import { useEffect, useState } from "react";
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
  source: "ai" | "heuristic";
  finalUrl: string;
};

/** Blank-tag colors used before a gym has been looked up — follow the
 *  theme so the tag isn't the one light object on a dark page. Dark
 *  is a shade above the page so it still reads as a separate surface. */
const BLANK_LIGHT = { primary: "#ffffff", secondary: "#e2dbd0" };
const BLANK_DARK = { primary: "#332f2e", secondary: "#1c1a19" };

/** A brand with no usable color (black/white identities) gets a black tag. */
const INK_PRIMARY = "#1c1c1c";
const INK_SECONDARY = "#000000";

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

  const isDark = useTheme() === "dark";
  const blank = isDark ? BLANK_DARK : BLANK_LIGHT;

  const hasResult = brand !== null;
  const hasColor = hasResult && !!normalizeHex(brand.primary);

  // No brand color found means the brand is essentially black-and-white;
  // a black tag is the right guess, not Redprint red.
  const primary = !hasResult ? blank.primary : hasColor ? brand.primary! : INK_PRIMARY;
  const secondary = !hasResult
    ? blank.secondary
    : hasColor
      ? (brand.secondary ?? darken(normalizeHex(primary) ?? INK_PRIMARY, 34))
      : INK_SECONDARY;

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError(null);
    setLogoFailed(false);
    setAnalysis(null);
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
    } catch {
      setError("Something went wrong reaching our server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const buttonBase =
    "shrink-0 rounded-xl px-5 py-3 text-[15px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45";

  return (
    <section
      id="design-your-tag"
      className="gym-defer relative px-6 py-24 sm:px-10 md:py-32"
    >
      <div className="mx-auto flex max-w-[560px] flex-col items-center text-center">
        <Reveal className="flex w-full flex-col items-center">
          <RedprintTag
            design={design}
            width={272}
            glow={hasResult}
            onLogoError={() => setLogoFailed(true)}
          />
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
                    type="submit"
                    disabled={!url.trim() || loading}
                    aria-label="Regenerate tag"
                    title="Regenerate"
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      background: "transparent",
                      color: "var(--gym-fg)",
                      border: "1px solid var(--gym-border)",
                    }}
                  >
                    <RefreshCw size={18} className={loading ? "animate-spin" : undefined} />
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
              See what your Redprint tag would look like
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
