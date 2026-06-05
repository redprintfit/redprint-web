/**
 * Email templates for the /api/request-gym endpoint.
 *
 * Each builder takes a typed payload + the optional URL config and
 * returns `{ subject, html, text }`. Plain text is sent alongside HTML
 * so inboxes that prefer text (and spam filters that score on text/HTML
 * parity) get a clean version.
 *
 * Styles are inlined because most email clients (Gmail, Outlook desktop,
 * Apple Mail) strip <style> blocks. Keep the markup boring: no flexbox,
 * no grid, no <button> tags that need rendering nuance.
 */

type Payload = {
  gym: string;
  location: string;
  email: string;
  role: "member" | "owner";
};

type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

type Urls = {
  appStoreUrl?: string;
  playStoreUrl?: string;
  calendlyUrl?: string;
  /** Public URL of the Redprint wordmark PNG. Rendered as an <img>
   *  in the email header. The shipped asset is white-on-transparent, so
   *  the header band behind it is intentionally dark to make it pop. */
  logoUrl?: string;
};

const FOUNDER_SIGNATURE = "The Redprint team";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

const baseWrap = (inner: string, logoUrl?: string) => {
  const header = logoUrl
    ? `
    <div style="background:#1a0e0d;border-top-left-radius:14px;border-top-right-radius:14px;padding:22px 32px;text-align:left;">
      <img src="${logoUrl}" alt="Redprint" width="160" height="32" style="display:block;border:0;outline:none;text-decoration:none;height:32px;width:160px;" />
    </div>`
    : "";
  return `
<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f5f1ee;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1a0e0d;line-height:1.55;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid rgba(0,0,0,0.06);overflow:hidden;">
    ${header}
    <div style="padding:32px;">
      ${inner}
    </div>
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6b5d58;text-align:center;">
    Sent by Redprint. You're receiving this because you submitted a request at redprintfit.com.
  </p>
</body>
</html>`;
};

/**
 * Founder-facing notification of a new submission. Reply-to should be
 * set to the submitter's email at the send-site so hitting Reply in
 * the inbox goes straight back to them.
 */
export function founderNotifyTemplate(p: Payload, urls: Urls = {}) {
  const subject = `New gym request: ${p.gym} (${p.role})`;
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;">New gym request</h1>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:15px;">
      <tr><td style="padding:6px 0;color:#6b5d58;width:120px;">Gym</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(p.gym)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b5d58;">Location</td><td style="padding:6px 0;">${escapeHtml(p.location)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b5d58;">Email</td><td style="padding:6px 0;"><a href="mailto:${encodeURIComponent(p.email)}" style="color:#d83a3a;text-decoration:none;">${escapeHtml(p.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#6b5d58;">Role</td><td style="padding:6px 0;">${p.role === "owner" ? "Gym owner" : "Member"}</td></tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:#6b5d58;">Reply to this email to respond directly to the submitter.</p>
  `;
  const text = [
    `New gym request`,
    `Gym: ${p.gym}`,
    `Location: ${p.location}`,
    `Email: ${p.email}`,
    `Role: ${p.role === "owner" ? "Gym owner" : "Member"}`,
    ``,
    `Reply to this email to respond directly to the submitter.`,
  ].join("\n");
  return { subject, html: baseWrap(inner, urls.logoUrl), text };
}

/** Inline-SVG button matching the SiteFooter "Download on the App Store"
 *  / "Get it on Google Play" pills. Cream wordmark + icon on a dark pill.
 *  Outlook 2007-2019 desktop will strip the inline SVG icon but still
 *  render the text. Everyone else (Apple Mail, Gmail web/mobile, Outlook
 *  365, Yahoo) shows the full pill. */
function storeButton(opts: { href: string; store: "app" | "play" }) {
  const iconPath =
    opts.store === "app"
      ? `<path d="M17.564 12.65c-.025-2.62 2.143-3.876 2.241-3.939-1.222-1.785-3.124-2.029-3.802-2.058-1.62-.164-3.16.954-3.984.954-.825 0-2.094-.93-3.443-.905-1.77.026-3.402 1.029-4.314 2.612-1.838 3.183-.471 7.901 1.319 10.488.878 1.269 1.92 2.696 3.279 2.644 1.32-.054 1.815-.854 3.41-.854 1.595 0 2.04.854 3.43.823 1.42-.025 2.318-1.287 3.186-2.566 1.006-1.475 1.422-2.91 1.447-2.985-.032-.014-2.766-1.062-2.794-4.214M14.992 5.07c.73-.886 1.222-2.111 1.087-3.337-1.052.043-2.322.7-3.078 1.585-.677.785-1.27 2.044-1.111 3.244 1.175.09 2.371-.595 3.102-1.492" fill="#F5F1EA"/>`
      : `<path d="M3.609 1.814 13.792 12 3.61 22.186a.997.997 0 0 1-.609-.919V2.733a.997.997 0 0 1 .609-.919Z" fill="#F5F1EA"/><path d="m14.5 11.293 2.886-2.886-12.7-7.21c-.13-.074-.28-.06-.397.025L14.5 11.293Z" fill="#F5F1EA"/><path d="m14.5 12.707 2.886 2.886-12.7 7.21c-.13.074-.28.06-.397-.025L14.5 12.707Z" fill="#F5F1EA"/><path d="m18.299 8.844 2.972 1.688a1 1 0 0 1 0 1.738l-2.972 1.687L15.207 12l3.092-3.156Z" fill="#F5F1EA"/>`;
  const top = opts.store === "app" ? "Download on the" : "Get it on";
  const bottom = opts.store === "app" ? "App Store" : "Google Play";
  return `
    <a href="${opts.href}" style="text-decoration:none;display:inline-block;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#0B0B0D;border-radius:8px;width:160px;">
        <tr>
          <td style="padding:8px 12px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;">
              <tr>
                <td width="22" style="vertical-align:middle;padding-right:8px;">
                  <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;">
                    ${iconPath}
                  </svg>
                </td>
                <td style="vertical-align:middle;line-height:1.1;">
                  <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.05em;color:rgba(245,241,234,0.7);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${top}</div>
                  <div style="font-size:14px;font-weight:600;color:#F5F1EA;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;letter-spacing:-0.01em;">${bottom}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </a>`;
}

/**
 * Member auto-reply: thanks them, says we'll reach out to the gym,
 * pitches starting their own community on Redprint, and links the app.
 */
export function memberAutoReplyTemplate(p: Payload, urls: Urls) {
  const subject = `Thanks for putting ${p.gym} on our radar`;
  // Render the App Store + Play Store pills as a 2-column table so they
  // sit side-by-side with consistent spacing across email clients.
  const appLinks =
    urls.appStoreUrl || urls.playStoreUrl
      ? `
        <p style="margin:24px 0 10px;font-weight:600;">Grab the app and start lifting:</p>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            ${urls.appStoreUrl ? `<td style="padding-right:10px;">${storeButton({ href: urls.appStoreUrl, store: "app" })}</td>` : ""}
            ${urls.playStoreUrl ? `<td>${storeButton({ href: urls.playStoreUrl, store: "play" })}</td>` : ""}
          </tr>
        </table>`
      : `<p style="margin:24px 0 0;color:#6b5d58;">We'll send the download link as soon as the app is live in your store.</p>`;
  const inner = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Thanks for putting ${escapeHtml(p.gym)} on our radar.</h1>
    <p style="margin:0 0 14px;font-size:15px;">Your name is on it. We'll reach out to ${escapeHtml(p.gym)} and try to get Redprint set up there as soon as we can, and we'll keep you posted.</p>
    <p style="margin:0 0 14px;font-size:15px;">In the meantime, you don't have to wait. You can start using Redprint today and even build your own community on the platform: invite training partners and track everything together.</p>
    ${appLinks}
    <p style="margin:24px 0 0;font-size:15px;">Talk soon,<br/>${FOUNDER_SIGNATURE}</p>
  `;
  const text = [
    `Thanks for putting ${p.gym} on our radar.`,
    ``,
    `Your name is on it. We'll reach out to ${p.gym} and try to get Redprint set up there as soon as we can, and we'll keep you posted.`,
    ``,
    `In the meantime, you don't have to wait. You can start using Redprint today and even build your own community on the platform: invite training partners and track everything together.`,
    ``,
    urls.appStoreUrl ? `App Store: ${urls.appStoreUrl}` : "",
    urls.playStoreUrl ? `Google Play: ${urls.playStoreUrl}` : "",
    ``,
    `Talk soon,`,
    FOUNDER_SIGNATURE,
  ]
    .filter(Boolean)
    .join("\n");
  return { subject, html: baseWrap(inner, urls.logoUrl), text };
}

/**
 * Contact-form notification. Sent to the founder when someone submits
 * the Hero "Contact us" modal. Reply-To is set at the send-site to
 * the submitter so hitting Reply in the inbox replies to them.
 */
export function contactNotifyTemplate(p: ContactPayload, urls: Urls = {}) {
  const subject = `Contact form: ${p.name}`;
  const messageHtml = escapeHtml(p.message).replace(/\n/g, "<br/>");
  const inner = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;">New contact form message</h1>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:15px;">
      <tr><td style="padding:6px 0;color:#6b5d58;width:120px;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(p.name)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b5d58;">Email</td><td style="padding:6px 0;"><a href="mailto:${encodeURIComponent(p.email)}" style="color:#d83a3a;text-decoration:none;">${escapeHtml(p.email)}</a></td></tr>
    </table>
    <div style="margin:24px 0 8px;font-weight:600;color:#6b5d58;font-size:13px;text-transform:uppercase;letter-spacing:0.04em;">Message</div>
    <div style="background:#f8f4f0;border-radius:10px;padding:16px 18px;font-size:15px;line-height:1.6;">${messageHtml}</div>
    <p style="margin:24px 0 0;font-size:13px;color:#6b5d58;">Reply to this email to respond directly to the submitter.</p>
  `;
  const text = [
    `New contact form message`,
    `Name: ${p.name}`,
    `Email: ${p.email}`,
    ``,
    `Message:`,
    p.message,
    ``,
    `Reply to this email to respond directly to the submitter.`,
  ].join("\n");
  return { subject, html: baseWrap(inner, urls.logoUrl), text };
}

/**
 * Owner auto-reply: thanks them and routes to a Calendly link to book a
 * call. If no Calendly URL is configured, falls back to "we'll email
 * you with times."
 */
export function ownerAutoReplyTemplate(p: Payload, urls: Urls) {
  const subject = `Let's bring Redprint to ${p.gym}`;
  const cta = urls.calendlyUrl
    ? `<p style="margin:24px 0;font-size:15px;"><a href="${urls.calendlyUrl}" style="display:inline-block;background:#1a0e0d;color:#f5f1ee;padding:12px 22px;border-radius:999px;font-weight:600;text-decoration:none;">Pick a time that works for you →</a></p>`
    : `<p style="margin:24px 0;font-size:15px;color:#6b5d58;">We'll follow up shortly with a few times that work for a call.</p>`;
  const inner = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">Thanks for reaching out about ${escapeHtml(p.gym)}.</h1>
    <p style="margin:0 0 14px;font-size:15px;">Excited to hear from you. We'd love a quick 20-minute call to learn what your members need and walk you through how Redprint fits.</p>
    ${cta}
    <p style="margin:24px 0 0;font-size:15px;">Looking forward to it,<br/>${FOUNDER_SIGNATURE}</p>
  `;
  const text = [
    `Thanks for reaching out about ${p.gym}.`,
    ``,
    `Excited to hear from you. We'd love a quick 20-minute call to learn what your members need and walk you through how Redprint fits.`,
    ``,
    urls.calendlyUrl
      ? `Pick a time: ${urls.calendlyUrl}`
      : `We'll follow up shortly with a few times that work for a call.`,
    ``,
    `Looking forward to it,`,
    FOUNDER_SIGNATURE,
  ].join("\n");
  return { subject, html: baseWrap(inner, urls.logoUrl), text };
}
