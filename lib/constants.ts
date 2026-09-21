export const APP_STORE_URL =
  "https://apps.apple.com/us/app/redprint/id1539200045";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.redprint.fitness";
export const WEB_APP_URL = "https://app.redprintfit.com";
export const CONTACT_EMAIL = "hello@redprintfit.com";

/**
 * The web app's tag designer — destination for every "get tags" CTA on
 * /for-gyms. The studio appends the visitor's draft as query params
 * (see lib/gyms/tagDraft.ts; contract in ~/Desktop/redprint-handoff).
 *
 * Override with NEXT_PUBLIC_ORDER_TAGS_URL to point at a local web app
 * (http://localhost:3002/create-tag) for end-to-end testing.
 */
export const ORDER_TAGS_URL =
  process.env.NEXT_PUBLIC_ORDER_TAGS_URL ?? "https://app.redprintfit.com/create-tag";
