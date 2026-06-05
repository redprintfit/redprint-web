import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  founderNotifyTemplate,
  memberAutoReplyTemplate,
  ownerAutoReplyTemplate,
} from "@/lib/email/templates";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants";

/**
 * POST /api/request-gym
 *
 * Body: { gym: string, location: string, email: string, role: "member" | "owner", honey?: string }
 *
 * Fires three side-effects:
 *   1. Email to founder (REQUEST_GYM_FOUNDER_EMAIL) with the lead.
 *      Reply-To is set to the submitter so hitting Reply goes back to them.
 *   2. Auto-reply to the submitter — role-specific:
 *      - member → thanks + app links + "start your own community"
 *      - owner  → thanks + Calendly link to schedule a call
 *   3. Optional Slack/Discord webhook ping (REQUEST_GYM_SLACK_WEBHOOK) for
 *      an instant notification in chat. Fire-and-forget; failure doesn't
 *      block the response.
 *
 * Required env vars (set in .env.local for dev, Vercel project env for prod):
 *   - RESEND_API_KEY          Resend API key
 *   - REQUEST_GYM_FROM_EMAIL  Verified sender, e.g. "Redprint <founders@redprint.fit>".
 *                             For testing without a verified domain, use
 *                             "Redprint <onboarding@resend.dev>" — emails will only
 *                             deliver to the Resend account owner's address.
 *   - REQUEST_GYM_FOUNDER_EMAIL  Where lead notifications go.
 *
 * Optional:
 *   - REQUEST_GYM_APP_STORE_URL    App Store link for member auto-reply.
 *   - REQUEST_GYM_PLAY_STORE_URL   Google Play link for member auto-reply.
 *   - REQUEST_GYM_CALENDLY_URL     Calendly (or any scheduler) URL for owner auto-reply.
 *   - REQUEST_GYM_SLACK_WEBHOOK    Incoming-webhook URL for Slack or Discord.
 *   - REQUEST_GYM_LOGO_URL         Public URL of the Redprint wordmark for the
 *                                  email header. Defaults to the production CDN
 *                                  path; replace if the asset moves.
 *   - REQUEST_GYM_REPLY_TO_EMAIL   Reply-to header on auto-replies sent to the
 *                                  submitter. Defaults to info@redprintfit.com.
 */

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_MAX = 200;

function cap(s: unknown, max = FIELD_MAX): string {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  // Honeypot — hidden field on the form. Legit users leave it empty; bots
  // happily fill it in. Pretend success so they don't probe further.
  if (typeof b.honey === "string" && b.honey.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const gym = cap(b.gym);
  const location = cap(b.location);
  const email = cap(b.email);
  const role = b.role === "owner" ? "owner" : b.role === "member" ? "member" : null;

  if (!gym || !location || !email || !role) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_GYM_FROM_EMAIL;
  const founderEmail = process.env.REQUEST_GYM_FOUNDER_EMAIL;
  if (!apiKey || !from || !founderEmail) {
    console.error(
      "[request-gym] missing env vars — set RESEND_API_KEY, REQUEST_GYM_FROM_EMAIL, REQUEST_GYM_FOUNDER_EMAIL",
    );
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const urls = {
    appStoreUrl: process.env.REQUEST_GYM_APP_STORE_URL ?? APP_STORE_URL,
    playStoreUrl: process.env.REQUEST_GYM_PLAY_STORE_URL ?? PLAY_STORE_URL,
    calendlyUrl:
      process.env.REQUEST_GYM_CALENDLY_URL ??
      "https://calendly.com/mikeheitz/30min",
    logoUrl:
      process.env.REQUEST_GYM_LOGO_URL ??
      "https://redprintfit.com/logos/redprint-logo-full.png",
  };

  // Auto-replies route their Reply-To here so users replying to a thanks
  // email reach the team inbox, not the no-reply sender address.
  const autoReplyTo =
    process.env.REQUEST_GYM_REPLY_TO_EMAIL ?? "info@redprintfit.com";

  const payload = { gym, location, email, role } as const;
  const resend = new Resend(apiKey);

  try {
    const founderTpl = founderNotifyTemplate(payload, urls);
    const autoTpl =
      role === "owner"
        ? ownerAutoReplyTemplate(payload, urls)
        : memberAutoReplyTemplate(payload, urls);

    // Fire both emails in parallel; Resend has independent rate budgets
    // per send and there's no ordering requirement.
    await Promise.all([
      resend.emails.send({
        from,
        to: founderEmail,
        replyTo: email,
        subject: founderTpl.subject,
        html: founderTpl.html,
        text: founderTpl.text,
      }),
      resend.emails.send({
        from,
        to: email,
        replyTo: autoReplyTo,
        subject: autoTpl.subject,
        html: autoTpl.html,
        text: autoTpl.text,
      }),
    ]);
  } catch (err) {
    console.error("[request-gym] email send failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  // Slack/Discord webhook — fire-and-forget so a webhook outage doesn't
  // delay the response or look like a submission failure to the user.
  const slack = process.env.REQUEST_GYM_SLACK_WEBHOOK;
  if (slack) {
    const text = `:wave: New gym request — *${gym}* (${location}) — _${role}_\n${email}`;
    fetch(slack, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch((err) => console.error("[request-gym] slack ping failed", err));
  }

  return NextResponse.json({ ok: true });
}
