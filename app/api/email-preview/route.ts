import { NextResponse } from "next/server";
import {
  founderNotifyTemplate,
  memberAutoReplyTemplate,
  ownerAutoReplyTemplate,
} from "@/lib/email/templates";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

/**
 * GET /api/_email-preview?t=founder|member|owner
 *
 * Returns the raw HTML of one of the three transactional templates,
 * rendered with sample payload + the same env-driven URL config that
 * production uses. Dev-only — returns 404 outside development so it
 * never surfaces in a deployed build.
 *
 * Intended to be loaded inside an <iframe> from /_email-preview so each
 * template paints with its own <html><body> wrappers intact.
 */

export const runtime = "nodejs";

const SAMPLE = {
  gym: "Niagara University",
  location: "Niagara, NY",
  email: "alex.jordan@niagara.edu",
} as const;

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const url = new URL(req.url);
  const t = url.searchParams.get("t") ?? "member";

  const urls = {
    appStoreUrl: process.env.REQUEST_GYM_APP_STORE_URL ?? APP_STORE_URL,
    playStoreUrl: process.env.REQUEST_GYM_PLAY_STORE_URL ?? PLAY_STORE_URL,
    calendlyUrl:
      process.env.REQUEST_GYM_CALENDLY_URL ??
      "https://calendly.com/mikeheitz/30min",
    // For the dev preview the wordmark is served straight out of /public.
    // Production sends use the absolute REQUEST_GYM_LOGO_URL env value.
    logoUrl: "/logos/redprint-logo-full.png",
  };

  const built =
    t === "founder"
      ? founderNotifyTemplate(
          { ...SAMPLE, role: "member" as const },
          urls,
        )
      : t === "owner"
        ? ownerAutoReplyTemplate(
            { ...SAMPLE, role: "owner" as const },
            urls,
          )
        : memberAutoReplyTemplate(
            { ...SAMPLE, role: "member" as const },
            urls,
          );

  return new Response(built.html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
