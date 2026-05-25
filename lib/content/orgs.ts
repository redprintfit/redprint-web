export type Org = {
  id: string;
  name: string;
  shortName: string;
  /** Hex of the org's primary brand color. Phone screens + bg use this. */
  primaryColor: string;
  /** Path under /public/logos/ — drop file with this name. */
  logoSrc: string;
};

/**
 * Placeholder org set for the hero carousel. Replace `primaryColor` + drop
 * actual logo SVGs into public/logos/ once assets are provided.
 */
export const orgs: Org[] = [
  {
    id: "swarthmore",
    name: "Swarthmore",
    shortName: "S",
    primaryColor: "#8B1F2F",
    logoSrc: "/logos/swarthmore.svg",
  },
  {
    id: "waverley-oaks",
    name: "Waverley Oaks",
    shortName: "WO",
    primaryColor: "#3E5E3A",
    logoSrc: "/logos/waverley-oaks.svg",
  },
  {
    id: "umsl",
    name: "UMSL",
    shortName: "U",
    primaryColor: "#A8242E",
    logoSrc: "/logos/umsl.svg",
  },
  {
    id: "niagara",
    name: "Niagara",
    shortName: "N",
    primaryColor: "#4B2A6B",
    logoSrc: "/logos/niagara.svg",
  },
  {
    id: "clemson",
    name: "Clemson",
    shortName: "C",
    primaryColor: "#F66733",
    logoSrc: "/logos/clemson.svg",
  },
  {
    id: "kelty-hearts",
    name: "Kelty Hearts",
    shortName: "KH",
    primaryColor: "#7B1E3A",
    logoSrc: "/logos/kelty-hearts.svg",
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
