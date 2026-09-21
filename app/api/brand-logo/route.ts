import { NextResponse } from "next/server";
import { BrandLookupError, normalizeUrl, readCapped, safeFetch } from "@/lib/brand/lookup";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * GET /api/brand-logo?url=<https://gym.example/logo.png>
 *
 * Same-origin proxy for a gym's logo. Two reasons it exists:
 *   1. The tag studio judges logo contrast from pixel data, and a
 *      canvas can't read a cross-origin image. Served from here, it can.
 *   2. Many sites hotlink-protect their assets; a server-side fetch
 *      with a browser UA gets through where a bare <img> fails.
 *
 * Same SSRF guard as the page scrape: public hosts only, redirects
 * re-validated per hop, size capped.
 */

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 3_000_000;

const LIMIT = { limit: 60, windowMs: 60_000 };

export async function GET(req: Request) {
  const retry = checkRateLimit(`logo:${clientIp(req)}`, LIMIT);
  if (retry !== null) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retry) } },
    );
  }

  const raw = new URL(req.url).searchParams.get("url");
  if (!raw || raw.length > 2000) {
    return NextResponse.json({ error: "invalid_url" }, { status: 400 });
  }

  try {
    const { res } = await safeFetch(normalizeUrl(raw), "image/*");
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "not_an_image" }, { status: 415 });
    }
    const bytes = await readCapped(res, MAX_LOGO_BYTES);
    // Hand Response an ArrayBuffer sliced to the view, not the (possibly
    // larger) backing buffer.
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    if (err instanceof BrandLookupError) {
      return NextResponse.json({ error: err.code }, { status: 400 });
    }
    console.error("[brand-logo] proxy failed", err);
    return NextResponse.json({ error: "proxy_failed" }, { status: 502 });
  }
}
