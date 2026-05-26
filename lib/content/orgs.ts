export type Org = {
  id: string;
  name: string;
  shortName: string;
  /** Hex of the org's primary brand color. Phone screens + bg use this. */
  primaryColor: string;
  /** Path under /public/logos/. */
  logoSrc: string;
};

/**
 * Org set for the hero carousel. Logos lifted from ~/Desktop/Org Logos.
 * Primary colors are the first element of `brandingColors` in
 * Redprint5/Data Models/Gyms/GymsModel.swift, resolved through
 * ColorExtension.swift.
 */
export const orgs: Org[] = [
  {
    id: "az_western",
    name: "AZ Western",
    shortName: "AZW",
    primaryColor: "#42c2cb", // aZWesternCG1
    logoSrc: "/logos/az_western.png",
  },
  {
    id: "champlain_college",
    name: "Champlain",
    shortName: "CC",
    primaryColor: "#1f5592", // champlainCG2 (first in brandingColors order)
    logoSrc: "/logos/champlain_college.png",
  },
  {
    id: "csun",
    name: "CSUN",
    shortName: "CS",
    primaryColor: "#000000", // black (first in brandingColors order)
    logoSrc: "/logos/csun.png",
  },
  {
    id: "gym_it",
    name: "GymIt",
    shortName: "GI",
    primaryColor: "#005fbd", // gymITCG2
    logoSrc: "/logos/gym_it.png",
  },
  {
    id: "marist",
    name: "Marist",
    shortName: "M",
    primaryColor: "#ee3232", // maristCG2
    logoSrc: "/logos/marist.png",
  },
  {
    id: "niagara",
    name: "Niagara",
    shortName: "N",
    primaryColor: "#592d82", // niagaraCG1
    logoSrc: "/logos/niagara.png",
  },
  {
    id: "pepperdine",
    name: "Pepperdine",
    shortName: "P",
    primaryColor: "#ee7625", // pepperdineCG1
    logoSrc: "/logos/pepperdine.png",
  },
  {
    id: "suny_buffalo",
    name: "Buffalo",
    shortName: "UB",
    primaryColor: "#374b9f", // buffaloCG1
    logoSrc: "/logos/suny_buffalo.png",
  },
  {
    id: "suny_oswego",
    name: "Oswego",
    shortName: "O",
    primaryColor: "#00602e", // oswegoCG2
    logoSrc: "/logos/suny_oswego.png",
  },
  {
    id: "swarthmore",
    name: "Swarthmore",
    shortName: "S",
    primaryColor: "#a30c33", // swarthmoreCG1
    logoSrc: "/logos/swarthmore.png",
  },
  {
    id: "umsl",
    name: "UMSL",
    shortName: "U",
    primaryColor: "#a30c33", // umslCG1
    logoSrc: "/logos/umsl.png",
  },
  {
    id: "ut_dallas",
    name: "UT Dallas",
    shortName: "UTD",
    primaryColor: "#e77725", // uTDallasCG2
    logoSrc: "/logos/ut_dallas.png",
  },
  {
    id: "ymca_middlesex",
    name: "YMCA Middlesex",
    shortName: "YM",
    primaryColor: "#3c87c9", // ymcaCG1
    logoSrc: "/logos/ymca_middlesex.png",
  },
];

/** Darken a hex color by a percentage (0-100). Used for dark-mode bg tinting. */
export function darken(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  const dr = Math.max(0, Math.round(r * factor));
  const dg = Math.max(0, Math.round(g * factor));
  const db = Math.max(0, Math.round(b * factor));
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`;
}

/** Lighten a hex color toward white by a percentage (0-100). Used for
 *  light-mode bg tinting. */
export function lighten(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const factor = percent / 100;
  const lr = Math.min(255, Math.round(r + (255 - r) * factor));
  const lg = Math.min(255, Math.round(g + (255 - g) * factor));
  const lb = Math.min(255, Math.round(b + (255 - b) * factor));
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}
