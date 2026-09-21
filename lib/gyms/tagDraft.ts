import { ORDER_TAGS_URL } from "@/lib/constants";
import { normalizeHex } from "@/lib/gyms/tag";

/**
 * Handoff of a tag draft from the marketing site to the web app's
 * designer. Contract v1.1 — agreed with the web app side, recorded in
 * ~/Desktop/redprint-handoff/TAG_HANDOFF.md. Keep the two in sync.
 *
 * Everything travels as query params on the designer URL, so the link
 * is stateless and the receiver can be tested from a hand-typed URL.
 */

export const TAG_DRAFT_VERSION = "1.1";

export type TagDraft = {
  name?: string | null;
  /** The gym's website after normalization/redirects. */
  site?: string | null;
  /** Exactly the colors the studio rendered — always both. */
  primary: string;
  secondary: string;
  /** The logo at its ORIGINAL host, never our proxy path. */
  logo?: string | null;
  logoTreatment?: "original" | "white" | "dark";
};

/** Designer URL with no draft — hero, nav, and closing CTAs. */
export function designerUrl(): string {
  const u = new URL(ORDER_TAGS_URL);
  u.searchParams.set("v", TAG_DRAFT_VERSION);
  u.searchParams.set("source", "marketing");
  return u.toString();
}

/** Designer URL carrying the studio's draft — the "Edit / save" CTA. */
export function designerUrlWithDraft(draft: TagDraft): string {
  const u = new URL(designerUrl());
  const p = u.searchParams;

  if (draft.name) p.set("name", draft.name.trim().slice(0, 200));
  const site = httpUrl(draft.site);
  if (site) p.set("site", site);

  // The receiver renders primary→secondary as a gradient when both are
  // present, so sending both guarantees it shows what the visitor saw.
  const primary = normalizeHex(draft.primary);
  const secondary = normalizeHex(draft.secondary);
  if (primary) p.set("primary", primary);
  if (secondary) p.set("secondary", secondary);

  const logo = httpUrl(draft.logo);
  if (logo) p.set("logo", logo);
  if (draft.logoTreatment) p.set("logoTreatment", draft.logoTreatment);

  return u.toString();
}

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
