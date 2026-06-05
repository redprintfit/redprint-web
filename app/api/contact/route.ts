import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactNotifyTemplate } from "@/lib/email/templates";

/**
 * POST /api/contact
 *
 * Body: { name: string, email: string, message: string, honey?: string }
 *
 * Sends a single email to the founder (REQUEST_GYM_CONTACT_EMAIL, default
 * mheitz@redprintfit.com) with the submission. Reply-To is the submitter
 * so hitting Reply in the inbox goes straight back to them.
 *
 * Shares the Resend setup with /api/request-gym:
 *   - RESEND_API_KEY          required
 *   - REQUEST_GYM_FROM_EMAIL  required (verified sender)
 *   - REQUEST_GYM_CONTACT_EMAIL  optional; defaults to mheitz@redprintfit.com
 *   - REQUEST_GYM_SLACK_WEBHOOK  optional ping
 *   - REQUEST_GYM_LOGO_URL    optional logo for email header
 */

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 120;
const EMAIL_MAX = 200;
const MESSAGE_MAX = 4000;

function cap(s: unknown, max: number): string {
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

  // Honeypot — silent drop on suspicious submissions.
  if (typeof b.honey === "string" && b.honey.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const name = cap(b.name, NAME_MAX);
  const email = cap(b.email, EMAIL_MAX);
  const message = cap(b.message, MESSAGE_MAX);

  if (!name || !email || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REQUEST_GYM_FROM_EMAIL;
  const contactEmail =
    process.env.REQUEST_GYM_CONTACT_EMAIL ?? "mheitz@redprintfit.com";
  if (!apiKey || !from) {
    console.error(
      "[contact] missing env vars — set RESEND_API_KEY and REQUEST_GYM_FROM_EMAIL",
    );
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const urls = {
    logoUrl:
      process.env.REQUEST_GYM_LOGO_URL ??
      "https://www.tapredprint.com/logos/redprint-logo-full.png",
  };

  const resend = new Resend(apiKey);
  const tpl = contactNotifyTemplate({ name, email, message }, urls);

  try {
    await resend.emails.send({
      from,
      to: contactEmail,
      replyTo: email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
    });
  } catch (err) {
    console.error("[contact] email send failed", err);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }

  const slack = process.env.REQUEST_GYM_SLACK_WEBHOOK;
  if (slack) {
    const text = `:envelope: New contact form message — *${name}*\n${email}\n>>> ${message.slice(0, 400)}`;
    fetch(slack, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch((err) => console.error("[contact] slack ping failed", err));
  }

  return NextResponse.json({ ok: true });
}
