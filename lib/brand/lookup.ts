import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Server-side brand extraction for the /for-gyms tag studio.
 *
 * Given a gym's website we want three things: a name, a logo, and the
 * brand colors — enough to render a believable Redprint tag before the
 * gym has spoken to anyone. Extraction runs in two stages:
 *
 *   1. Deterministic scrape of the markup (meta tags, icons, manifest,
 *      declared colors). Costs nothing and handles most sites.
 *   2. Optional Claude pass that picks the real brand colors and the
 *      best logo out of stage 1's candidates.
 *
 * Stage 2 is skipped when ANTHROPIC_API_KEY is unset, so the endpoint
 * degrades to the heuristic result instead of failing.
 */

/** Where a logo candidate came from; decides how much it looks like a logo. */
export type LogoKind = "logo-img" | "touch-icon" | "icon" | "og-image";

export type LogoCandidate = {
  url: string;
  kind: LogoKind;
  /** Pixel size read from the file's header. Null for SVG (scales freely) or unknown. */
  width: number | null;
  height: number | null;
  svg: boolean;
  /** A JPEG: photographs are JPEGs, logos almost never are. */
  jpeg: boolean;
};

export type BrandCandidates = {
  siteName: string | null;
  title: string | null;
  description: string | null;
  /** Logo candidates, best first: logo-ness, then SVG, then resolution. */
  logos: LogoCandidate[];
  /** Same order, URLs only. */
  images: string[];
  /** Colors declared in metadata (theme-color, mask-icon, tile color). */
  declaredColors: string[];
  /** Colors scraped from markup/CSS, most frequent first. */
  frequentColors: string[];
  /**
   * How colorful the site is. `saturated` and `total` count every hex color
   * mention in the page and its own stylesheets; `top` is how often the
   * leading brand candidate appears. A black-and-white brand has a handful
   * of stray accent colors and nothing else.
   */
  colorStats: { saturated: number; total: number; top: number };
  finalUrl: string;
};

export type BrandResult = {
  name: string | null;
  logoUrl: string | null;
  primary: string | null;
  secondary: string | null;
  /**
   * The brand reads as black / white / grey. The studio then leads with a
   * black tag rather than promoting a stray link color to brand color
   * (Oct 9 2026 review: a black brand came back blue).
   */
  monochrome: boolean;
  /** Other plausible brand colors, best first; Regenerate cycles through them. */
  palette: string[];
  source: "ai" | "heuristic";
  finalUrl: string;
};

const FETCH_TIMEOUT_MS = 9000;
const MAX_BYTES = 2_000_000;
const MAX_REDIRECTS = 4;

/* ------------------------------------------------------------------ */
/* URL safety                                                          */
/* ------------------------------------------------------------------ */

export class BrandLookupError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Accepts "acmegym.com", "www.acmegym.com/pricing", "https://..." */
export function normalizeUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) throw new BrandLookupError("missing_url", "No URL provided.");
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProto);
  } catch {
    throw new BrandLookupError("invalid_url", "That doesn't look like a website address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BrandLookupError("invalid_url", "Only http and https addresses are supported.");
  }
  if (!url.hostname.includes(".")) {
    throw new BrandLookupError("invalid_url", "That doesn't look like a website address.");
  }
  return url;
}

/**
 * Reject addresses that resolve into private / loopback / link-local
 * space. Without this the endpoint is an SSRF pivot into anything the
 * deploy target can reach.
 *
 * Note: this is a resolve-then-fetch check, so a hostile DNS server
 * could in principle rebind between the check and the fetch. Closing
 * that window entirely requires pinning the resolved IP for the
 * connection, which `fetch` does not expose; the check below stops the
 * realistic cases (localhost, metadata endpoints, RFC1918 hosts).
 */
async function assertPublicHost(hostname: string): Promise<void> {
  const literal = isIP(hostname);
  const addresses = literal
    ? [{ address: hostname, family: literal }]
    : await dnsLookup(hostname, { all: true }).catch(() => {
        throw new BrandLookupError("unreachable", "We couldn't find that website.");
      });

  if (!addresses.length) {
    throw new BrandLookupError("unreachable", "We couldn't find that website.");
  }
  for (const { address } of addresses) {
    if (isBlockedAddress(address)) {
      throw new BrandLookupError("blocked_host", "That address can't be looked up.");
    }
  }
}

function isBlockedAddress(address: string): boolean {
  const v = isIP(address);
  if (v === 4) return isBlockedV4(address);
  if (v === 6) return isBlockedV6(address);
  return true;
}

function isBlockedV4(address: string): boolean {
  const p = address.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  if (a === 0 || a === 127) return true; // this-host, loopback
  if (a === 10) return true; // RFC1918
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
  if (a === 192 && b === 168) return true; // RFC1918
  if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0) return true; // IETF protocol assignments
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

function isBlockedV6(address: string): boolean {
  const a = address.toLowerCase().split("%")[0];
  if (a === "::" || a === "::1") return true;
  // IPv4-mapped (::ffff:1.2.3.4) — judge by the embedded v4 address.
  const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedV4(mapped[1]);
  const head = parseInt(a.split(":")[0] || "0", 16);
  if ((head & 0xfe00) === 0xfc00) return true; // fc00::/7 unique-local
  if ((head & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((head & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  return false;
}

/* ------------------------------------------------------------------ */
/* Fetching                                                            */
/* ------------------------------------------------------------------ */

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 RedprintTagPreview/1.0";

/**
 * Fetch with a timeout, manual redirects, and the host re-validated on
 * every hop so a redirect can't bounce us into private address space.
 * Shared by the page scrape and the logo proxy.
 */
export async function safeFetch(
  startUrl: URL,
  accept: string,
): Promise<{ res: Response; finalUrl: URL }> {
  let url = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        // Some sites serve a stub to unknown agents; a plain desktop UA
        // gets us the real markup with the real branding.
        headers: { "User-Agent": BROWSER_UA, Accept: accept },
      });
    } catch {
      throw new BrandLookupError("unreachable", "We couldn't reach that website.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) break;
      url = new URL(location, url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new BrandLookupError("blocked_host", "That address can't be looked up.");
      }
      continue;
    }

    if (!res.ok) {
      throw new BrandLookupError("unreachable", `That website returned an error (${res.status}).`);
    }

    return { res, finalUrl: url };
  }

  throw new BrandLookupError("too_many_redirects", "That website redirected too many times.");
}

async function safeFetchText(startUrl: URL): Promise<{ html: string; finalUrl: URL }> {
  const { res, finalUrl } = await safeFetch(startUrl, "text/html,application/xhtml+xml");
  const bytes = await readCapped(res, MAX_BYTES);
  return { html: new TextDecoder("utf-8").decode(bytes), finalUrl };
}

/** Read a response body up to `max` bytes, then cancel the stream. */
export async function readCapped(res: Response, max: number): Promise<Uint8Array> {
  const reader = res.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < max) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => {});
  const size = Math.min(total, max);
  const buf = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    const n = Math.min(c.length, size - offset);
    buf.set(c.subarray(0, n), offset);
    offset += n;
    if (offset >= size) break;
  }
  return buf;
}

/* ------------------------------------------------------------------ */
/* Markup scraping                                                     */
/* ------------------------------------------------------------------ */

const META_RE = /<meta\b[^>]*>/gi;
const LINK_RE = /<link\b[^>]*>/gi;
const IMG_RE = /<img\b[^>]*>/gi;
const HEX_RE = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? null) : null;
}

function absolutize(href: string | null, base: URL): string | null {
  if (!href) return null;
  const v = href.trim();
  if (!v || v.startsWith("data:") || v.startsWith("javascript:")) return null;
  try {
    const u = new URL(v, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Colors that CMS and framework stylesheets inject into every page they
 * render, regardless of brand. Frequency ranking would otherwise crown
 * them: three unrelated gyms (Gold's, GymIt, Waverley Oaks) all "had"
 * #003388 as their primary color before this list existed.
 */
const CMS_DEFAULT_COLORS = new Set([
  // WordPress core / Gutenberg palette
  "#003388", "#003399", "#007cba", "#00d084", "#0693e3", "#8ed1fc", "#7bdcb5",
  "#f78da7", "#cf2e2e", "#ff6900", "#fcb900", "#9b51e0", "#abb8c3", "#0073aa",
  // Divi, Elementor, Bootstrap defaults
  "#2ea3f2", "#6ec1e4", "#61ce70", "#007bff", "#0d6efd", "#337ab7", "#0d47a1",
  // Bootstrap 5 body text and focus ring
  "#212529", "#86b7fe",
]);

function expandHex(hex: string): string {
  const x = hex.slice(1);
  return x.length === 3 ? `#${x.split("").map((c) => c + c).join("")}` : hex;
}

/** Relative luminance of a #rrggbb / #rgb color, 0..1. */
function brightness(hex: string): number {
  const h = expandHex(hex);
  const ch = (i: number) => {
    const c = parseInt(h.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(0) + 0.7152 * ch(1) + 0.0722 * ch(2);
}

/** Colors too close to white/black/grey to be anyone's brand color. */
function isPlausibleBrandColor(hex: string): boolean {
  if (CMS_DEFAULT_COLORS.has(expandHex(hex.toLowerCase()))) return false;
  const h = hex.length === 4
    ? `#${hex.slice(1).split("").map((c) => c + c).join("")}`
    : hex;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  // Near-greyscale, or so dark/light it reads as ink or paper.
  if (saturation < 0.18) return false;
  if (max < 26 || min > 236) return false;
  return true;
}

export async function scrapeCandidates(startUrl: URL): Promise<BrandCandidates> {
  const { html, finalUrl } = await safeFetchText(startUrl);

  const metas = html.match(META_RE) ?? [];
  const links = html.match(LINK_RE) ?? [];
  const imgs = html.match(IMG_RE) ?? [];

  const metaBy = (key: string): string | null => {
    for (const tag of metas) {
      const prop = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
      if (prop === key) return attr(tag, "content");
    }
    return null;
  };

  const titleMatch = html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : null;

  // Logo candidates, with where each came from. Ranked below, after their
  // real pixel sizes are known.
  const found: { url: string; kind: LogoKind; hint: number }[] = [];
  const add = (u: string | null, kind: LogoKind, hint = 0) => {
    if (u && !found.some((f) => f.url === u)) found.push({ url: u, kind, hint });
  };

  // Images with "logo" in the markup are the strongest signal. Lazy-loaded
  // themes keep the real file in data-src, and srcset often carries a 2x
  // or larger version of the same logo: take the biggest.
  for (const tag of imgs) {
    // Judge the file name and the tag's own labels, not the whole path: a
    // photo under /masterbrand-homepage/ is not a logo (Life Time).
    const fileName = (attr(tag, "src") ?? "").split("?")[0].split("/").pop() ?? "";
    const labels = `${attr(tag, "alt") ?? ""} ${attr(tag, "class") ?? ""} ${attr(tag, "id") ?? ""}`;
    if (!/logo|wordmark/i.test(fileName) && !/logo|brand|wordmark/i.test(labels)) continue;
    const srcset = attr(tag, "srcset") ?? attr(tag, "data-srcset");
    add(absolutize(largestFromSrcset(srcset), finalUrl), "logo-img");
    add(absolutize(attr(tag, "data-src") ?? attr(tag, "data-lazy-src"), finalUrl), "logo-img");
    add(absolutize(attr(tag, "src"), finalUrl), "logo-img");
  }
  for (const tag of links) {
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    // mask-icon is a single-color silhouette meant to be tinted by Safari;
    // it prints as a flat blob, so it is never a logo candidate.
    if (/apple-touch-icon/.test(rel)) {
      add(absolutize(attr(tag, "href"), finalUrl), "touch-icon", sizesHint(attr(tag, "sizes")));
    } else if (/^icon$|shortcut icon/.test(rel)) {
      add(absolutize(attr(tag, "href"), finalUrl), "icon", sizesHint(attr(tag, "sizes")));
    }
  }
  // Most sites serve a 180px touch icon at the conventional path even when
  // the markup doesn't link it. A miss is dropped by the probe below.
  add(absolutize("/apple-touch-icon.png", finalUrl), "touch-icon", 180);
  add(absolutize(metaBy("og:image"), finalUrl), "og-image");
  add(absolutize(metaBy("twitter:image"), finalUrl), "og-image");

  const logos = await rankLogos(found.slice(0, 10));

  const declaredColors: string[] = [];
  const pushColor = (c: string | null) => {
    const raw = c?.trim().toLowerCase();
    if (!raw || !/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(raw)) return;
    const v = expandHex(raw);
    if (!declaredColors.includes(v)) declaredColors.push(v);
  };
  pushColor(metaBy("theme-color"));
  pushColor(metaBy("msapplication-tilecolor"));
  for (const tag of links) {
    if ((attr(tag, "rel") ?? "").toLowerCase().includes("mask-icon")) pushColor(attr(tag, "color"));
  }

  // Most sites keep their colors in a stylesheet, not the page, so the
  // site's own CSS is read too (not CDN frameworks, which carry their own
  // palettes and would drown the brand).
  const css = await fetchOwnStylesheets(links, finalUrl);

  // Frequency-rank every hex in the markup and CSS, dropping greys and CMS
  // defaults. Then, among the candidates that are roughly tied at the
  // top, prefer the brightest: when the count can't separate two brand
  // colors, the brighter one is the better tag background and gives a
  // logo more room to contrast.
  const counts = new Map<string, number>();
  let total = 0;
  let saturated = 0;
  for (const m of `${html}\n${css}`.matchAll(HEX_RE)) {
    const hex = expandHex(m[0].toLowerCase());
    total++;
    if (!isPlausibleBrandColor(hex)) continue;
    saturated++;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const top = ranked[0]?.[1] ?? 0;
  const contenders = ranked.filter(([, n]) => n >= top * 0.35);
  const rest = ranked.filter(([, n]) => n < top * 0.35);
  const frequentColors = [
    ...contenders.sort((a, b) => brightness(b[0]) - brightness(a[0])),
    ...rest,
  ].map(([hex]) => hex);

  const dec = (v: string | null) => (v ? decodeEntities(v).trim() : null);
  return {
    siteName: dec(metaBy("og:site_name") ?? metaBy("application-name")),
    title,
    description: dec(metaBy("og:description") ?? metaBy("description")),
    logos,
    images: logos.map((l) => l.url),
    declaredColors,
    frequentColors,
    colorStats: { saturated, total, top },
    finalUrl: finalUrl.toString(),
  };
}

/** "logo.png 1x, logo@2x.png 2x" or "a.png 300w, b.png 600w" → the biggest entry's URL. */
function largestFromSrcset(srcset: string | null): string | null {
  if (!srcset) return null;
  let best: { url: string; size: number } | null = null;
  for (const part of srcset.split(",")) {
    const [url, descriptor = "1x"] = part.trim().split(/\s+/);
    if (!url) continue;
    const size = parseFloat(descriptor) * (descriptor.endsWith("w") ? 1 : 1000);
    if (!best || size > best.size) best = { url, size };
  }
  return best?.url ?? null;
}

/** sizes="180x180" / "32x32 64x64" / "any" → the largest edge it promises. */
function sizesHint(sizes: string | null): number {
  if (!sizes) return 0;
  if (/any/i.test(sizes)) return 1024;
  return Math.max(0, ...[...sizes.matchAll(/(\d+)x(\d+)/gi)].map((m) => Math.max(+m[1], +m[2])));
}

const KIND_RANK: Record<LogoKind, number> = { "logo-img": 3, "touch-icon": 2, icon: 1, "og-image": 0 };
// Below this, a raster "logo" prints soft on a tag; a large touch icon beats it.
const MIN_SHARP_PX = 150;

/**
 * Measure each candidate (header bytes only) and order them for printing:
 * real logos before icons before social images; within a kind, SVG first,
 * then the most pixels. A small raster logo drops behind a big touch icon
 * (Oct 9 2026 review: the logo came through low-res). Candidates that
 * don't load are dropped.
 */
async function rankLogos(found: { url: string; kind: LogoKind; hint: number }[]): Promise<LogoCandidate[]> {
  const probed = await Promise.all(
    found.map(async (f) => {
      const size = await probeImageSize(f.url);
      if (!size) return null;
      return {
        url: f.url,
        kind: f.kind,
        width: size.svg ? null : size.width,
        height: size.svg ? null : size.height,
        svg: size.svg,
        jpeg: !!size.jpeg,
      } satisfies LogoCandidate;
    }),
  );
  const ok = probed.filter((c): c is LogoCandidate => c !== null);
  const edge = (c: LogoCandidate) => (c.svg ? Infinity : Math.max(c.width ?? 0, c.height ?? 0));
  const rank = (c: LogoCandidate) => {
    let r = KIND_RANK[c.kind];
    if (c.kind === "logo-img" && !c.svg && edge(c) < MIN_SHARP_PX) r = 1.5; // below a sharp touch icon
    if (c.jpeg) r = Math.min(r, 0.25); // a photo, whatever it was labelled
    if (c.kind === "touch-icon" && edge(c) < MIN_SHARP_PX) r = 0.5;
    return r;
  };
  return ok.sort((a, b) => rank(b) - rank(a) || edge(b) - edge(a));
}

const PROBE_BYTES = 64_000;
const PROBE_TIMEOUT_MS = 3500;

/** Width/height from an image's header. SVG reports svg:true. Null if it isn't an image. */
async function probeImageSize(
  url: string,
): Promise<{ width: number; height: number; svg: boolean; jpeg?: boolean } | null> {
  const attempt = (async () => {
    try {
      const { res } = await safeFetch(new URL(url), "image/*");
      const type = (res.headers.get("content-type") ?? "").toLowerCase();
      if (type.includes("svg") || /\.svg(\?|$)/i.test(url)) {
        await res.body?.cancel().catch(() => {});
        return { width: 0, height: 0, svg: true };
      }
      if (!type.startsWith("image/")) {
        await res.body?.cancel().catch(() => {});
        return null;
      }
      const bytes = await readCapped(res, PROBE_BYTES);
      const dims = imageDimensions(bytes);
      const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
      return dims ? { ...dims, svg: false, jpeg } : { width: 0, height: 0, svg: false, jpeg };
    } catch {
      return null;
    }
  })();
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), PROBE_TIMEOUT_MS));
  return Promise.race([attempt, timeout]);
}

/** PNG / GIF / WebP / JPEG / ICO dimensions from the first bytes of the file. */
export function imageDimensions(b: Uint8Array): { width: number; height: number } | null {
  const be16 = (i: number) => (b[i] << 8) | b[i + 1];
  const le16 = (i: number) => b[i] | (b[i + 1] << 8);
  const be32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const ascii = (i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length < 24) return null;

  if (b[0] === 0x89 && ascii(1, 3) === "PNG") return { width: be32(16), height: be32(20) };
  if (ascii(0, 4) === "GIF8") return { width: le16(6), height: le16(8) };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const chunk = ascii(12, 4);
    if (chunk === "VP8X") {
      return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    }
    if (chunk === "VP8 ") return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
    if (chunk === "VP8L") {
      return {
        width: 1 + (((b[22] & 0x3f) << 8) | b[21]),
        height: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)),
      };
    }
    return null;
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) return { width: be16(i + 7), height: be16(i + 5) };
      i += 2 + be16(i + 2);
    }
    return null;
  }
  if (b[0] === 0 && b[1] === 0 && b[2] === 1 && b[3] === 0) {
    const count = le16(4);
    let best = 0;
    for (let n = 0; n < count && 6 + n * 16 + 1 < b.length; n++) {
      best = Math.max(best, b[6 + n * 16] || 256);
    }
    return best ? { width: best, height: best } : null;
  }
  return null;
}

const STYLESHEET_BYTES = 400_000;
// Third-party frameworks and plugin bundles: their palettes are not the gym's.
// Many sites serve their own CSS from a CDN host (Crunch: cloudfront), so the
// host isn't the test; public library CDNs and known bundles are.
const VENDOR_CSS =
  /bootstrap|font-?awesome|fontawesome|wp-includes|elementor\/assets|woocommerce|jquery|vendor|swiper|slick|animate\.|googleapis|gstatic|cdnjs|jsdelivr|unpkg|typekit|ajax\.cloudflare/i;

/** Up to three of the site's own stylesheets, concatenated. Failures are ignored. */
async function fetchOwnStylesheets(links: string[], base: URL): Promise<string> {
  const hrefs: string[] = [];
  for (const tag of links) {
    if (!/stylesheet/i.test(attr(tag, "rel") ?? "")) continue;
    const href = absolutize(attr(tag, "href"), base);
    if (!href || VENDOR_CSS.test(href)) continue;
    hrefs.push(href);
    if (hrefs.length === 3) break;
  }
  const sheets = await Promise.all(
    hrefs.map(async (href) => {
      const attempt = (async () => {
        try {
          const { res } = await safeFetch(new URL(href), "text/css,*/*;q=0.1");
          return new TextDecoder("utf-8").decode(await readCapped(res, STYLESHEET_BYTES));
        } catch {
          return "";
        }
      })();
      const timeout = new Promise<string>((r) => setTimeout(() => r(""), PROBE_TIMEOUT_MS));
      return Promise.race([attempt, timeout]);
    }),
  );
  return sheets.join("\n");
}

/**
 * How sure the markup is about a brand color.
 *
 *   brand        declared in metadata, or one saturated color recurs and color
 *                is a real share of the palette
 *   monochrome   plenty of colors on the site, almost all of them black, white
 *                or grey: the saturated ones are a stray link-blue or plugin
 *                accent, not the brand
 *   unsure       too few colors to tell (styles we couldn't read)
 *
 * Only "brand" puts a color on the tag. The other two leave it to the logo's
 * own color in the studio, then a black tag.
 */
function colorConfidence(c: BrandCandidates): "brand" | "monochrome" | "unsure" {
  if (c.declaredColors.some(isPlausibleBrandColor)) return "brand";
  const { saturated, total, top } = c.colorStats;
  if (total >= 20 && saturated / total < 0.12) return "monochrome";
  if (top >= 3) return "brand";
  return total >= 20 ? "monochrome" : "unsure";
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/* ------------------------------------------------------------------ */
/* Resolution                                                          */
/* ------------------------------------------------------------------ */

/** Heuristic fallback used when Claude is unavailable or errors. */
export function resolveHeuristically(c: BrandCandidates): BrandResult {
  const colors = [...new Set([...c.declaredColors, ...c.frequentColors])].filter(isPlausibleBrandColor);
  const name = c.siteName ?? (c.title ? c.title.split(/[|–—\-·]/)[0].trim() : null);
  const confidence = colorConfidence(c);
  return {
    name: name || null,
    logoUrl: c.images[0] ?? null,
    // No color unless the site clearly has one: a guessed color is how a
    // black brand came back blue. The studio fills in from the logo.
    primary: confidence === "brand" ? (colors[0] ?? null) : null,
    monochrome: confidence === "monochrome",
    palette: colors.slice(0, 6),
    // Deliberately null. Frequency ranking cannot tell a real second
    // brand color from a CMS theme default (Divi blue, Bootstrap blue),
    // and pairing crimson with a stray #003399 produces a tag no gym
    // would order. A null secondary makes the renderer fall back to a
    // darkened primary, which always reads as intentional. The Claude
    // pass, which can actually judge, is free to return a real pair.
    secondary: null,
    source: "heuristic",
    finalUrl: c.finalUrl,
  };
}

/**
 * Ask Claude to pick the gym's real brand colors and best logo out of
 * the scraped candidates. Returns null when the key is absent or the
 * call fails, so the caller can fall back to the heuristic result.
 */
export async function resolveWithClaude(c: BrandCandidates): Promise<BrandResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const [{ default: Anthropic }, { z }, { zodOutputFormat }] = await Promise.all([
      import("@anthropic-ai/sdk"),
      import("zod"),
      import("@anthropic-ai/sdk/helpers/zod"),
    ]);

    const Schema = z.object({
      name: z.string().describe("The gym or organization's display name, e.g. 'Waverley Oaks Athletic Club'."),
      logo_url: z.string().describe("The best logo URL from the candidates. Empty string if none are a real logo."),
      primary_color: z.string().describe("Primary brand color as a #rrggbb hex."),
      secondary_color: z.string().describe("A complementary second brand color as #rrggbb. May equal a darker primary."),
      monochrome: z
        .boolean()
        .describe(
          "True when the brand itself is black, white and/or grey (e.g. Equinox), so any saturated colors on the site are incidental. The colors above are then ignored.",
        ),
    });

    const client = new Anthropic();
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { format: zodOutputFormat(Schema), effort: "low" },
      system:
        "You identify a gym's visual brand from scraped website metadata so it can be printed onto a physical NFC tag. " +
        "Pick saturated, on-brand colors that would look good as a gradient behind a logo — never near-white, near-black, or grey. " +
        "Ignore colors that are CMS or framework defaults rather than the brand (WordPress/Gutenberg palette blues and greens, Bootstrap blue, Divi blue): " +
        "they appear in the markup of every site built on that platform. " +
        "If you are unsure which of two colors should be the background, always choose the brighter one. " +
        "The logo will be printed on top of the primary color, so make sure a typical logo (usually dark, white, or the brand's own accent) will contrast against it. " +
        "Prefer a logo candidate that is an actual wordmark or emblem over a generic favicon or a photographic social-share image. " +
        "Among real logos, prefer SVG, then the one with the most pixels: it will be printed, and a small image prints blurry. " +
        "Many gyms have a black-and-white identity. If the metadata declares no brand color and saturated colors are a small share of all colors on the site " +
        "(see color_stats), the brand is probably monochrome: say so rather than promoting a stray link or plugin color to brand color.",
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            site: c.finalUrl,
            site_name: c.siteName,
            title: c.title,
            description: c.description,
            logo_candidates: c.logos.map((l) => ({
              url: l.url,
              found_as: l.kind,
              format: l.svg ? "svg" : "raster",
              size: l.svg ? "scalable" : l.width ? `${l.width}x${l.height}` : "unknown",
            })),
            colors_declared_in_metadata: c.declaredColors,
            colors_by_frequency_in_markup: c.frequentColors,
            color_stats: {
              saturated_color_mentions: c.colorStats.saturated,
              all_color_mentions: c.colorStats.total,
              top_color_mentions: c.colorStats.top,
            },
          }),
        },
      ],
    });

    const out = response.parsed_output;
    if (!out) return null;

    const primary = out.primary_color?.trim().toLowerCase() || null;
    const secondary = out.secondary_color?.trim().toLowerCase() || null;
    const heuristic = resolveHeuristically(c);
    return {
      name: out.name?.trim() || null,
      logoUrl: out.logo_url?.trim() || null,
      primary: out.monochrome ? null : primary,
      secondary: out.monochrome ? null : secondary,
      monochrome: !!out.monochrome,
      // Claude's pick first, then whatever else the site uses.
      palette: [...new Set([primary, secondary, ...heuristic.palette].filter((x): x is string => !!x))].slice(0, 6),
      source: "ai",
      finalUrl: c.finalUrl,
    };
  } catch (err) {
    console.error("[brand-lookup] claude resolution failed", err);
    return null;
  }
}
