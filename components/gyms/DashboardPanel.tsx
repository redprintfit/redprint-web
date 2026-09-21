"use client";

import { darken, lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/**
 * A facsimile of the Redprint gym analytics dashboard, drawn in markup
 * rather than shipped as screenshots — it stays sharp at any DPI,
 * re-tints to whichever org is on screen, and follows the site theme.
 *
 * Laid out at a canonical 560x400 and scaled with a single transform,
 * the same trick `PhoneFrame` uses, so every fixed pixel value inside
 * stays proportional at any rendered width. The third row is allowed
 * to run off the bottom, the way a real window crops.
 */

const DESIGN_W = 560;
const DESIGN_H = 400;
/** width / height — used by the hero to lay the cluster out. */
export const DASHBOARD_ASPECT = DESIGN_W / DESIGN_H;

export type DashboardVariant = "overview" | "usage" | "messages" | "maintenance";

export function DashboardPanel({
  org,
  variant = "overview",
  width = 560,
  className,
}: {
  org: Org;
  variant?: DashboardVariant;
  width?: number;
  className?: string;
}) {
  const isDark = useTheme() === "dark";
  const scale = width / DESIGN_W;
  const accent = org.primaryColor;

  const t: Tone = {
    accent,
    isDark,
    // Main surface is a tint of the org color: blush in light, ink in dark.
    page: isDark ? darken(accent, 86) : lighten(accent, 90),
    card: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
    cardBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(23,18,15,0.05)",
    fg: isDark ? "#f6f2f0" : "#2b2426",
    muted: isDark ? "rgba(246,242,240,0.55)" : "rgba(43,36,38,0.55)",
    track: isDark ? "rgba(255,255,255,0.08)" : "#efeeee",
    pillBorder: isDark ? "rgba(255,255,255,0.14)" : "rgba(43,36,38,0.14)",
  };

  return (
    <div
      className={className}
      style={{ width, height: width / DASHBOARD_ASPECT }}
      aria-hidden
      data-dash
    >
      <div
        className="origin-top-left overflow-hidden"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          borderRadius: 14,
          background: t.page,
          boxShadow: isDark
            ? "0 30px 70px -30px rgba(0,0,0,0.9)"
            : "0 30px 70px -30px rgba(23,18,15,0.35)",
          display: "flex",
        }}
      >
        <Sidebar t={t} />
        <div style={{ flex: 1, minWidth: 0, padding: "10px 12px 0" }}>
          <Header org={org} t={t} />
          {variant === "overview" && <Overview t={t} />}
          {variant === "usage" && <Usage t={t} />}
          {variant === "messages" && <Messages t={t} />}
          {variant === "maintenance" && <Maintenance t={t} />}
        </div>
      </div>
    </div>
  );
}

type Tone = {
  accent: string;
  isDark: boolean;
  page: string;
  card: string;
  cardBorder: string;
  fg: string;
  muted: string;
  track: string;
  pillBorder: string;
};

/* ---------------------------------------------------------------- */
/* Chrome                                                            */
/* ---------------------------------------------------------------- */

function Sidebar({ t }: { t: Tone }) {
  // Glyphs in the order the real app shows them; the bar chart is the
  // active "Analytics" page.
  const glyphs: [string, boolean][] = [
    ["M6 3v3M6 6H3v3M6 6h3v3", false], // org tree
    ["M2.5 9.5V6M5 9.5V3M7.5 9.5V5M10 9.5V7", true], // analytics
    ["M2 8l1.5-4 2.5 3 2.5-3L10 8z", false], // crown
    ["M6 2.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM5 4.5v3l2.5-1.5z", false], // play
    ["M2.5 3h7v4.5H6L4 9V7.5H2.5z", false], // chat
    ["M4 2.5h4v2.5a2 2 0 01-4 0zM6 7v2M4.5 9.5h3", false], // trophy
    ["M2.5 6l3.5-3.5H9.5v3.5L6 9.5z", false], // tag
    ["M3 9l3.5-3.5M7 3l2 2-1.5 1.5-2-2z", false], // tools
    ["M6 4a2 2 0 110 4 2 2 0 010-4zM6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1", false], // gear
  ];
  return (
    <div
      style={{
        width: 30,
        flexShrink: 0,
        background: t.accent,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 7,
        gap: 9,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: "rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            backgroundColor: "#fff",
            WebkitMaskImage: "url(/logos/redprint-emblem.png)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskImage: "url(/logos/redprint-emblem.png)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
          }}
        />
      </div>
      {glyphs.map(([d, active], i) => (
        <div
          key={i}
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: active ? "rgba(255,255,255,0.22)" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width={12}
            height={12}
            viewBox="0 0 12 12"
            fill="none"
            stroke="#fff"
            strokeWidth={1.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={active ? 1 : 0.85}
          >
            <path d={d} />
          </svg>
        </div>
      ))}
    </div>
  );
}

function Header({ org, t }: { org: Org; t: Tone }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
      <div
        style={{
          width: 19,
          height: 19,
          borderRadius: 999,
          background: t.accent,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={org.logoSrc}
          alt=""
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
        />
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: t.fg, letterSpacing: "-0.02em" }}>
        {org.name}
      </div>
      <div style={{ flex: 1 }} />
      <Pill t={t} accent="#3b82f6" icon>
        Reporting
      </Pill>
      <Pill t={t}>September 2026 ▾</Pill>
    </div>
  );
}

function Pill({
  children,
  t,
  accent,
  icon,
}: {
  children: React.ReactNode;
  t: Tone;
  accent?: string;
  icon?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 6.5,
        fontWeight: 600,
        color: accent ?? t.fg,
        background: accent ? `${accent}14` : t.card,
        border: `1px solid ${accent ? `${accent}55` : t.pillBorder}`,
        borderRadius: 5,
        padding: "3.5px 6px",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      {icon && (
        <svg width={6} height={6} viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth={1}>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <path d="M2.5 5.5V4M4 5.5V2.5M5.5 5.5V3.5" />
        </svg>
      )}
      {children}
    </div>
  );
}

function Card({
  children,
  t,
  title,
  right,
  style,
}: {
  children?: React.ReactNode;
  t: Tone;
  title?: string;
  right?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: t.card,
        border: `1px solid ${t.cardBorder}`,
        borderRadius: 8,
        padding: 9,
        minWidth: 0,
        boxShadow: t.isDark ? "none" : "0 1px 3px rgba(23,18,15,0.04)",
        ...style,
      }}
    >
      {title && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: 7 }}>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: t.muted }}>{title}</div>
          <div style={{ flex: 1 }} />
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function Select({ children, t }: { children: React.ReactNode; t: Tone }) {
  return (
    <div
      style={{
        fontSize: 5.5,
        color: t.fg,
        border: `1px solid ${t.pillBorder}`,
        borderRadius: 3,
        padding: "2px 5px",
        background: t.isDark ? "rgba(255,255,255,0.04)" : "#f7f6f6",
      }}
    >
      {children} ▾
    </div>
  );
}

/** Stat card with a delta pill. Sign decides the pill color: green up,
 *  red down, neutral grey for zero. */
function Stat({
  value,
  delta,
  deltaLabel,
  label,
  glyph,
  t,
}: {
  value: string;
  delta: number;
  deltaLabel: string;
  label: string;
  glyph: string;
  t: Tone;
}) {
  const up = delta > 0;
  const zero = delta === 0;
  const pillBg = zero ? t.track : up ? "#e6f6ea" : "#fde8ea";
  const pillFg = zero ? t.muted : up ? "#2a9d4a" : "#c8323f";
  return (
    <Card t={t} style={{ flex: 1, position: "relative", padding: "8px 8px 7px" }}>
      <svg
        width={9}
        height={9}
        viewBox="0 0 12 12"
        fill="none"
        stroke={t.muted}
        strokeWidth={1}
        strokeLinecap="round"
        style={{ position: "absolute", top: 8, right: 8 }}
      >
        <path d={glyph} />
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.fg, letterSpacing: "-0.03em" }}>
          {value}
        </div>
        <div
          style={{
            fontSize: 5.5,
            fontWeight: 700,
            color: pillFg,
            background: pillBg,
            borderRadius: 999,
            padding: "1.5px 4px",
          }}
        >
          {zero ? "0" : `${up ? "+" : ""}${delta}`}
        </div>
      </div>
      <div style={{ fontSize: 5.5, color: t.muted, marginTop: 1 }}>{deltaLabel}</div>
      <div style={{ fontSize: 6, color: t.fg, opacity: 0.8, marginTop: 4 }}>{label}</div>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Overview — mirrors the live analytics page                        */
/* ---------------------------------------------------------------- */

function Overview({ t }: { t: Tone }) {
  return (
    <>
      <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
        <Stat
          value="204"
          delta={14}
          deltaLabel="new this month"
          label="Total Redprint Members"
          glyph="M6 6a2 2 0 100-4 2 2 0 000 4zM2.5 10.5a3.5 3.5 0 017 0"
          t={t}
        />
        <Stat
          value="38"
          delta={-12}
          deltaLabel="vs. August"
          label="Workouts Tracked"
          glyph="M2 5v2M10 5v2M3.5 4v4M8.5 4v4M3.5 6h5"
          t={t}
        />
        <Stat
          value="0"
          delta={0}
          deltaLabel="vs. August"
          label="Video Views"
          glyph="M1.5 6s1.8-3 4.5-3 4.5 3 4.5 3-1.8 3-4.5 3S1.5 6 1.5 6zM6 7.2a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"
          t={t}
        />
        <Stat
          value="102"
          delta={46}
          deltaLabel="vs. August"
          label="App Visits"
          glyph="M4 1.5h4a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1zM5.5 9h1"
          t={t}
        />
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
        <Card
          t={t}
          title="Total User Demographics"
          right={<Select t={t}>Class Level</Select>}
          style={{ flex: 1, height: 132 }}
        >
          <Donut t={t} />
        </Card>
        <Card
          t={t}
          title="Engagement"
          right={<Select t={t}>Workouts</Select>}
          style={{ flex: 1.15, height: 132 }}
        >
          <Bars t={t} />
        </Card>
      </div>

      {/* Third row runs off the bottom of the panel on purpose. */}
      <div style={{ display: "flex", gap: 7 }}>
        <Card t={t} title="Top Instructional Videos" style={{ flex: 1, height: 120 }}>
          <NoVideos t={t} />
        </Card>
        <Card
          t={t}
          title="Top Exercises"
          right={<div style={{ fontSize: 5.5, color: t.fg }}>See more &gt;</div>}
          style={{ flex: 1.15, height: 120 }}
        >
          <TopExercises t={t} />
        </Card>
      </div>
    </>
  );
}

function Donut({ t }: { t: Tone }) {
  const slices: [string, number][] = [
    ["Freshman", 0.27],
    ["Sophomore", 0.2],
    ["Junior", 0.13],
    ["Senior", 0.17],
    ["Faculty/Staff", 0.19],
    ["Other", 0.04],
  ];
  const R = 27;
  const C = 2 * Math.PI * R;
  const GAP = 2.2;
  let offset = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, height: 100 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4.5, minWidth: 0, flex: 1 }}>
        {slices.map(([label, share], i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: t.accent,
                opacity: 1 - i * 0.15,
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 6, color: i === 0 ? t.fg : t.muted, fontWeight: i === 0 ? 700 : 400 }}>
              {label}
            </div>
            <div style={{ fontSize: 6, color: t.muted, marginLeft: 2 }}>{Math.round(share * 100)}%</div>
          </div>
        ))}
      </div>
      <div style={{ position: "relative", width: 82, height: 82, flexShrink: 0 }}>
        <svg width={82} height={82} viewBox="0 0 82 82">
          <g transform="rotate(-90 41 41)">
            {slices.map(([label, share], i) => {
              const dash = Math.max(0, share * C - GAP);
              const el = (
                <circle
                  key={label}
                  cx={41}
                  cy={41}
                  r={R}
                  fill="none"
                  stroke={t.accent}
                  strokeOpacity={1 - i * 0.15}
                  strokeWidth={12}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += share * C;
              return el;
            })}
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 6.5, fontWeight: 700, color: t.fg }}>Freshman</div>
          <div style={{ fontSize: 5.5, color: t.muted }}>27%</div>
        </div>
      </div>
    </div>
  );
}

function Bars({ t }: { t: Tone }) {
  const data: [string, number][] = [
    ["Freshman", 0.47],
    ["Sophomore", 0.47],
    ["Junior", 1],
    ["Senior", 0.2],
    ["Graduate", 0],
    ["Faculty/Staff", 0.33],
    ["Alumni", 0],
    ["Other", 0],
  ];
  return (
    <div style={{ height: 100, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 5, paddingTop: 2 }}>
        {data.map(([label, v], i) => (
          <div
            key={label}
            style={{
              flex: 1,
              position: "relative",
              borderRadius: 3,
              background: t.track,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${v * 100}%`,
                background: t.accent,
                opacity: i === 5 ? 0.78 : 1,
                borderRadius: 3,
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 5, height: 18, marginTop: 3 }}>
        {data.map(([label]) => (
          <div key={label} style={{ flex: 1, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 3,
                fontSize: 5,
                color: t.muted,
                whiteSpace: "nowrap",
                transform: "translateX(-60%) rotate(-28deg)",
                transformOrigin: "left top",
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoVideos({ t }: { t: Tone }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: 88,
      }}
    >
      <svg width={54} height={34} viewBox="0 0 54 34" fill="none">
        <rect
          x="10"
          y="2"
          width="34"
          height="30"
          rx="6"
          transform="skewX(-16) rotate(-8 27 17)"
          fill={t.isDark ? "rgba(255,255,255,0.07)" : "#f3f2f2"}
          stroke={t.isDark ? "rgba(255,255,255,0.14)" : "#e2e0e0"}
        />
        <path d="M25 14l6 3-6 3z" fill={t.isDark ? "rgba(255,255,255,0.3)" : "#d0cdcd"} />
      </svg>
      <div style={{ fontSize: 6.5, color: t.muted }}>No data yet</div>
    </div>
  );
}

function TopExercises({ t }: { t: Tone }) {
  const chips = [
    "Barbell Bench Press",
    "Cable Row",
    "Leg Press Machine",
    "Dumbbell Incline Bench Press",
    "Hip Abduction",
    "Chest Fly Machine",
  ];
  return (
    <div style={{ display: "flex", gap: 8, height: 88 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
        {chips.map((c) => (
          <div
            key={c}
            style={{
              fontSize: 5.5,
              color: t.fg,
              background: t.isDark ? "rgba(255,255,255,0.06)" : "#f3f2f2",
              borderRadius: 3,
              padding: "2.5px 5px",
              alignSelf: "flex-start",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {c}
          </div>
        ))}
      </div>
      <Radar t={t} />
    </div>
  );
}

function Radar({ t }: { t: Tone }) {
  const axes = ["Abs", "Back", "Biceps", "Chest", "Legs", "Shoulders", "Triceps"];
  const values = [0.35, 0.55, 0.4, 0.5, 0.95, 0.6, 0.3];
  const cx = 44;
  const cy = 44;
  const R = 30;
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const ring = (f: number) =>
    axes.map((_, i) => pt(i, R * f).join(",")).join(" ");
  const shape = values.map((v, i) => pt(i, R * v).join(",")).join(" ");
  const grid = t.isDark ? "rgba(255,255,255,0.12)" : "#e4e2e2";

  return (
    <svg width={88} height={88} viewBox="0 0 88 88" style={{ flexShrink: 0 }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke={grid} strokeWidth={0.6} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={grid} strokeWidth={0.6} />;
      })}
      <polygon points={shape} fill={t.accent} fillOpacity={0.18} stroke={t.accent} strokeWidth={1} />
      {values.map((v, i) => {
        const [x, y] = pt(i, R * v);
        return <circle key={i} cx={x} cy={y} r={1.4} fill={t.accent} />;
      })}
      {axes.map((label, i) => {
        const [x, y] = pt(i, R + 8);
        return (
          <text
            key={label}
            x={x}
            y={y}
            fontSize={4.5}
            fill={t.muted}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ---------------------------------------------------------------- */
/* Feature variants                                                  */
/* ---------------------------------------------------------------- */

function SimpleStat({ value, label, delta, t }: { value: string; label: string; delta?: string; t: Tone }) {
  return (
    <Card t={t} style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: t.fg, letterSpacing: "-0.03em" }}>
          {value}
        </div>
        {delta && (
          <div
            style={{
              fontSize: 6,
              fontWeight: 700,
              color: "#2a9d4a",
              background: "#e6f6ea",
              borderRadius: 999,
              padding: "1.5px 4px",
            }}
          >
            {delta}
          </div>
        )}
      </div>
      <div style={{ fontSize: 6, color: t.muted, marginTop: 2 }}>{label}</div>
    </Card>
  );
}

function Usage({ t }: { t: Tone }) {
  const rows: [string, number, string][] = [
    ["Cable crossover", 0.94, "412 taps"],
    ["Leg press", 0.81, "356 taps"],
    ["Lat pulldown", 0.72, "318 taps"],
    ["Chest press", 0.55, "241 taps"],
    ["Rowing erg", 0.31, "137 taps"],
    ["Hack squat", 0.12, "52 taps"],
  ];
  return (
    <>
      <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
        <SimpleStat value="1,516" label="Machine taps this month" delta="+24%" t={t} />
        <SimpleStat value="6:40p" label="Peak floor hour" t={t} />
        <SimpleStat value="3" label="Machines under-used" t={t} />
      </div>
      <Card t={t} title="Equipment usage" right={<Select t={t}>Last 30 days</Select>} style={{ height: 190 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {rows.map(([name, pct, count]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ fontSize: 6.5, color: t.fg, width: 78, flexShrink: 0 }}>{name}</div>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: t.track, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${pct * 100}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: t.accent,
                    opacity: 0.45 + pct * 0.55,
                  }}
                />
              </div>
              <div style={{ fontSize: 6, color: t.muted, width: 40, textAlign: "right" }}>{count}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ListRows({
  items,
  t,
  dim,
}: {
  items: [string, string, string][];
  t: Tone;
  dim?: (status: string) => boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 3 }}>
      {items.map(([title, sub, status]) => {
        const off = dim?.(status) ?? false;
        return (
          <div
            key={title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              border: `1px solid ${t.cardBorder}`,
              borderRadius: 6,
              padding: "7px 8px",
              opacity: off ? 0.55 : 1,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: 999, background: off ? t.muted : t.accent }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: t.fg }}>{title}</div>
              <div style={{ fontSize: 6, color: t.muted, marginTop: 1 }}>{sub}</div>
            </div>
            <div style={{ fontSize: 6, color: t.muted }}>{status}</div>
          </div>
        );
      })}
    </div>
  );
}

function Messages({ t }: { t: Tone }) {
  return (
    <>
      <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
        <SimpleStat value="1,204" label="Reachable members" t={t} />
        <SimpleStat value="62%" label="Average open rate" delta="+9%" t={t} />
      </div>
      <Card t={t} title="Announcements" right={<Select t={t}>This month</Select>} style={{ height: 190 }}>
        <ListRows
          t={t}
          items={[
            ["Holiday hours", "Sent to 1,204 members", "98% delivered"],
            ["New squat racks are live", "Sent to 1,204 members", "62% opened"],
            ["Spring challenge starts Monday", "Scheduled for Mar 1", "Draft"],
          ]}
        />
      </Card>
    </>
  );
}

function Maintenance({ t }: { t: Tone }) {
  return (
    <>
      <div style={{ display: "flex", gap: 7, marginBottom: 7 }}>
        <SimpleStat value="4" label="Open reports" t={t} />
        <SimpleStat value="1.4d" label="Median time to fix" delta="-38%" t={t} />
      </div>
      <Card t={t} title="Maintenance queue" right={<Select t={t}>Tap-reported</Select>} style={{ height: 190 }}>
        <ListRows
          t={t}
          dim={(s) => s === "Closed"}
          items={[
            ["Treadmill 4: belt slipping", "Reported by 3 members", "Open"],
            ["Cable crossover: frayed cable", "Reported by 1 member", "In progress"],
            ["Bench 2: torn upholstery", "Reported by 6 members", "Open"],
            ["Leg press: pin missing", "Resolved yesterday", "Closed"],
          ]}
        />
      </Card>
    </>
  );
}
