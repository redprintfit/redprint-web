import { NextResponse } from "next/server";
import {
  BrandLookupError,
  normalizeUrl,
  resolveHeuristically,
  resolveWithClaude,
  scrapeCandidates,
} from "@/lib/brand/lookup";
import { normalizeHex } from "@/lib/gyms/tag";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * POST /api/brand-lookup
 *
 * Body: { url: string }
 * Returns: { name, logoUrl, primary, secondary, source, finalUrl }
 *
 * Powers the /for-gyms tag studio: a gym pastes their website and gets
 * a rendered Redprint tag in their own colors before talking to anyone.
 *
 * Optional env:
 *   ANTHROPIC_API_KEY — enables the Claude pass that picks the real
 *                       brand colors and logo. Without it the route
 *                       still works, using the markup heuristics alone.
 */

export const runtime = "nodejs";
// Brand extraction fetches a third-party site; never cache the result
// at the route level (the studio caches per-URL on the client instead).
export const dynamic = "force-dynamic";

const LIMIT = { limit: 10, windowMs: 60_000 };

export async function POST(req: Request) {
  const retry = checkRateLimit(`lookup:${clientIp(req)}`, LIMIT);
  if (retry !== null) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many lookups. Give it a minute and try again." },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw = (body as Record<string, unknown>)?.url;
  if (typeof raw !== "string" || raw.length > 300) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const url = normalizeUrl(raw);
    const candidates = await scrapeCandidates(url);
    const resolved = (await resolveWithClaude(candidates)) ?? resolveHeuristically(candidates);

    // Claude returns free-form strings; re-validate before they reach
    // the renderer so a malformed hex can't blank out the tag.
    const primary = normalizeHex(resolved.primary);
    const secondary = normalizeHex(resolved.secondary);
    const fallback = resolveHeuristically(candidates);

    return NextResponse.json({
      name: resolved.name ?? fallback.name,
      logoUrl: safeHttpUrl(resolved.logoUrl) ?? safeHttpUrl(fallback.logoUrl),
      primary: primary ?? normalizeHex(fallback.primary),
      secondary: secondary ?? normalizeHex(fallback.secondary),
      source: resolved.source,
      finalUrl: resolved.finalUrl,
    });
  } catch (err) {
    if (err instanceof BrandLookupError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 });
    }
    console.error("[brand-lookup] unexpected failure", err);
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}

/** Only hand http(s) URLs back to the client's <img src>. */
function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
