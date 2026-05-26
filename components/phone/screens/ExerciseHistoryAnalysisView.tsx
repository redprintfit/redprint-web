"use client";

import { lighten, type Org } from "@/lib/content/orgs";
import { useTheme } from "@/lib/useTheme";

/**
 * Exercise Progression — analytics view.
 * Faithfully ported from
 * Redprint5/Views/Progress Page Files/Analytics/ExerciseHistoryAnalysisView.swift.
 *
 * Org-color theming (mirrors iOS `accentColor = orgColors[0]`):
 *   - Page background tint        → orgColor darkened 65% @ 25% (dark) / 10% (light)
 *   - Header pin + circle stroke  → orgColor
 *   - Exercise palette (lines)    → [orgColor, orgColor.lighter(40%), ...]
 *   - Y/X axis labels             → primary text @ 50-65% opacity
 */
export function ExerciseHistoryAnalysisView({ org }: { org: Org }) {
  const orgColor = org.primaryColor;
  const isDark = useTheme() === "dark";

  // Exercise palette per iOS:
  // [accentColor, accentColorAlt, accentColor.lighter(40%), accentColorAlt.lighter(40%)]
  // We only have one brand color per org here, so use lighten variants.
  const palette = [
    orgColor,
    lighten(orgColor, 25),
    lighten(orgColor, 50),
  ];

  return (
    <div
      className="light:bg-white light:text-black flex h-full flex-col bg-black text-white"
      style={{
        // Page tint: org darkened 65% @ 25% dark / 10% light
        backgroundImage: `linear-gradient(180deg, ${withAlpha(darkenHex(orgColor, 65), isDark ? 0.25 : 0.1)} 0%, transparent 100%)`,
      }}
    >
      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden px-2.5 pt-7">
        {/* ---------- Header ---------- */}
        <header className="flex items-start gap-2">
          {/* Pin: downward triangle + circle with blob avatar */}
          <div className="relative flex h-[28px] w-[28px] items-center justify-center">
            <div
              className="absolute -bottom-[6px] left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `7px solid ${orgColor}`,
              }}
            />
            <div
              className="light:bg-white relative flex h-[26px] w-[26px] items-center justify-center rounded-full bg-black"
              style={{ boxShadow: `inset 0 0 0 1.5px ${orgColor}` }}
            >
              <div
                className="h-[14px] w-[14px] opacity-75"
                style={{
                  backgroundColor: "currentColor",
                  WebkitMaskImage:
                    "radial-gradient(circle at 40% 40%, black 40%, transparent 60%), radial-gradient(circle at 70% 70%, black 30%, transparent 60%)",
                  maskImage:
                    "radial-gradient(circle at 40% 40%, black 40%, transparent 60%), radial-gradient(circle at 70% 70%, black 30%, transparent 60%)",
                }}
              />
            </div>
          </div>
          <h2
            className="flex-1 pt-0.5 text-[13px] leading-tight"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900 }}
          >
            Exercise
            <br />
            Progression
          </h2>
          <button className="light:bg-black/10 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[8px]">
            ✕
          </button>
        </header>

        {/* Subtitle (iOS uses typed animation; static here) */}
        <p
          className="light:text-black -mt-1 text-[10px] leading-tight text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600 }}
        >
          Compare exercises over time and track your personal records.
        </p>

        {/* ---------- Stats row ---------- */}
        <div className="grid grid-cols-3 gap-1">
          <StatCard
            value="729"
            label="Total Sessions"
            icon={<FigureStrengthIcon />}
          />
          <StatCard
            value="121"
            label="Unique Exercises"
            icon={<FigureStrengthIcon />}
          />
          <StatCard
            value="24.9k"
            unit="lbs"
            label="Volume/Exercise"
            icon={<DivideIcon />}
          />
        </div>

        <Divider />

        {/* ---------- Chart section ---------- */}
        <ChartSection orgColor={orgColor} palette={palette} isDark={isDark} />

        {/* ---------- Stats table ---------- */}
        <StatsTable palette={palette} />
      </div>
    </div>
  );
}

/* ============================================================
   Stat card
   ============================================================ */

function StatCard({
  value,
  unit,
  label,
  icon,
}: {
  value: string;
  unit?: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="light:border-black/25 rounded-[8px] border border-white/25 p-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-0.5">
          <span
            className="light:text-[#323232] text-[11px] leading-none text-white"
            style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
          >
            {value}
          </span>
          {unit && (
            <span className="light:text-[#323232]/50 text-[7px] text-white/50">
              {unit}
            </span>
          )}
        </div>
        <span className="light:text-[#323232]/65 text-white/65">{icon}</span>
      </div>
      <div className="light:text-[#323232]/65 mt-0.5 text-[6.5px] leading-tight text-white/65">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="light:bg-black/15 my-0.5 h-px w-full bg-white/15" />;
}

/* ============================================================
   Chart section
   ============================================================ */

function ChartSection({
  orgColor: _orgColor,
  palette,
  isDark,
}: {
  orgColor: string;
  palette: string[];
  isDark: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {/* Top bar: section title + dropdowns */}
      <div className="flex items-center justify-between">
        <span
          className="light:text-black text-[10.5px] text-white"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
        >
          Exercise Comparison
        </span>
        <div className="flex gap-1">
          <DropdownButton label="Volume" isDark={isDark} />
          <DropdownButton label="Last 10" isDark={isDark} />
        </div>
      </div>

      {/* Y-axis label */}
      <span className="light:text-black/50 mt-0.5 text-[7px] text-white/50">
        Volume (lbs)
      </span>

      {/* Chart — extends past the parent's right padding to the screen edge */}
      <div className="-mr-2.5">
        <Chart palette={palette} />
      </div>

      {/* Pagination */}
      <Pagination isDark={isDark} />
    </div>
  );
}

function DropdownButton({ label, isDark }: { label: string; isDark: boolean }) {
  return (
    <div
      className="light:text-black light:bg-white flex items-center gap-1 rounded-[6px] bg-black px-1.5 py-0.5 text-[8px] font-semibold text-white"
      style={{
        boxShadow: isDark
          ? "0 1px 2px rgba(255,255,255,0.05)"
          : "0 1px 2px rgba(0,0,0,0.12)",
      }}
    >
      <span>{label}</span>
      <span className="text-[7px] opacity-50">⌃⌄</span>
    </div>
  );
}

function Pagination({ isDark }: { isDark: boolean }) {
  return (
    <div className="mt-0.5 flex items-center justify-center gap-2">
      <div
        className="light:bg-white flex h-4 w-4 items-center justify-center rounded-full bg-black text-[7px]"
        style={{
          boxShadow: isDark
            ? "0 1px 2px rgba(255,255,255,0.05)"
            : "0 1px 2px rgba(0,0,0,0.12)",
        }}
      >
        ‹
      </div>
      <span className="light:text-black/55 text-[7.5px] font-medium text-white/55">
        79–88 of 88
      </span>
      <div className="light:text-black/20 flex h-4 w-4 items-center justify-center text-[7px] text-white/20">
        ›
      </div>
    </div>
  );
}

/* ============================================================
   Chart (inline SVG, monotone-cubic style)
   ============================================================ */

function Chart({ palette }: { palette: string[] }) {
  // Y-axis values (5 ticks): 0, 5000, 10000, 15000, 20000
  const yTicks = [0, 5000, 10000, 15000, 20000];
  const yMax = 20000;

  // Three series with sample points (x: 1..10, y: value)
  // Mimics the screenshot: spiky middle line with a peak, flat top, wavy bottom.
  const series = [
    {
      color: palette[0],
      data: [
        [1, 11000],
        [2, 11000],
        [3, 11000],
        [4, 11000],
        [5, 11000],
        [6, 11000],
        [7, 11000],
        [8, 11000],
        [9, 11500],
        [10, 11000],
      ],
    },
    {
      color: palette[1],
      data: [
        [1, 5000],
        [2, 9500],
        [3, 9500],
        [4, 5000],
        [5, 6000],
        [6, 6500],
        [7, 18500], // peak
        [8, 6500],
        [9, 6500],
        [10, 6500],
      ],
    },
    {
      color: palette[2],
      data: [
        [1, 4500],
        [2, 7500],
        [3, 8500],
        [4, 4500],
        [5, 5500],
        [6, 7000],
        [7, 6500],
        [8, 7000],
        [9, 7500],
        [10, 8500],
      ],
    },
  ];

  // Viewbox: 220 x 135
  const W = 220;
  const H = 135;
  const PL = 28; // left padding (y-axis labels)
  const PR = 2; // right padding (minimal — chart extends to screen edge)
  const PT = 6; // top padding
  const PB = 14; // bottom padding (x-axis labels)
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;

  const xToPx = (x: number) => PL + ((x - 1) / 9) * plotW;
  const yToPx = (y: number) => PT + plotH - (y / yMax) * plotH;

  // Monotone cubic Hermite spline — mirrors Swift Charts .monotone
  const toPath = (points: [number, number][]): string => {
    if (points.length < 2) return "";
    const n = points.length;
    const xs = points.map(([x]) => xToPx(x));
    const ys = points.map(([, y]) => yToPx(y));

    // Slopes
    const delta: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = xs[i + 1] - xs[i];
      delta[i] = dx !== 0 ? (ys[i + 1] - ys[i]) / dx : 0;
    }
    const m: number[] = new Array(n).fill(0);
    m[0] = delta[0];
    m[n - 1] = delta[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = (delta[i - 1] + delta[i]) / 2;

    // Adjust to preserve monotonicity
    for (let i = 0; i < n - 1; i++) {
      if (delta[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
      } else {
        const a = m[i] / delta[i];
        const b = m[i + 1] / delta[i];
        const h = Math.hypot(a, b);
        if (h > 3) {
          const t = 3 / h;
          m[i] = t * a * delta[i];
          m[i + 1] = t * b * delta[i];
        }
      }
    }

    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 0; i < n - 1; i++) {
      const dx = xs[i + 1] - xs[i];
      const c1x = xs[i] + dx / 3;
      const c1y = ys[i] + (m[i] * dx) / 3;
      const c2x = xs[i + 1] - dx / 3;
      const c2y = ys[i + 1] - (m[i + 1] * dx) / 3;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${xs[i + 1]} ${ys[i + 1]}`;
    }
    return d;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full">
      {/* Y-axis ticks + grid lines */}
      {yTicks.map((v, i) => {
        const y = yToPx(v);
        return (
          <g key={v}>
            <line
              x1={PL}
              x2={W - PR}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="0.5"
            />
            <text
              x={PL - 3}
              y={y + 2.5}
              textAnchor="end"
              fontSize="6"
              fill="currentColor"
              fillOpacity="0.65"
            >
              {i === 0 ? "0" : v.toLocaleString("en-US")}
            </text>
          </g>
        );
      })}

      {/* X-axis labels — 2, 4, 6, 8 */}
      {[2, 4, 6, 8].map((n) => (
        <text
          key={n}
          x={xToPx(n)}
          y={H - 3}
          textAnchor="middle"
          fontSize="6"
          fill="currentColor"
          fillOpacity="0.5"
        >
          {n}
        </text>
      ))}

      {/* Area fills under each line */}
      <defs>
        {series.map((s, i) => (
          <linearGradient
            key={i}
            id={`area-${i}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0" stopColor={s.color} stopOpacity="0.25" />
            <stop offset="1" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {series.map((s, i) => {
        const path = toPath(s.data as [number, number][]);
        const last = s.data[s.data.length - 1];
        const first = s.data[0];
        const closed = `${path} L ${xToPx(last[0])} ${PT + plotH} L ${xToPx(first[0])} ${PT + plotH} Z`;
        return (
          <path
            key={`fill-${i}`}
            d={closed}
            fill={`url(#area-${i})`}
            opacity="0.6"
          />
        );
      })}

      {/* Lines */}
      {series.map((s, i) => (
        <path
          key={`line-${i}`}
          d={toPath(s.data as [number, number][])}
          fill="none"
          stroke={s.color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* Dots */}
      {series.map((s, i) =>
        s.data.map(([x, y], j) => (
          <circle
            key={`pt-${i}-${j}`}
            cx={xToPx(x)}
            cy={yToPx(y)}
            r="1.6"
            fill={s.color}
            opacity="0.8"
          />
        )),
      )}
    </svg>
  );
}

/* ============================================================
   Stats table
   ============================================================ */

function StatsTable({ palette }: { palette: string[] }) {
  const rows = [
    {
      color: palette[0],
      name: "Push-Up",
      volume: "648.1k",
      sets: "289",
      reps: "5,864",
      orm: "354",
    },
    {
      color: palette[1],
      name: "Pull-up",
      volume: "440.0k",
      sets: "327",
      reps: "3,019",
      orm: "239",
    },
    {
      color: palette[2],
      name: "Bodyweight…",
      volume: "210.8k",
      sets: "88",
      reps: "1,580",
      orm: "392",
    },
  ];

  return (
    <div className="light:border-black/15 overflow-hidden rounded-[8px] border border-white/15">
      {/* Header row */}
      <div className="light:bg-black/[0.05] light:text-black/45 grid grid-cols-[1.4fr_1fr_0.55fr_0.65fr_0.8fr] items-center bg-white/[0.05] text-[7px] font-medium text-white/45">
        <span className="px-1.5 py-1">Exercise</span>
        <Col>Volume</Col>
        <Col>Sets</Col>
        <Col>Reps</Col>
        <Col>1RM</Col>
      </div>
      <div className="light:bg-black/25 h-px bg-white/25" />

      {/* Data rows */}
      {rows.map((row, i) => (
        <div key={row.name}>
          <div className="light:text-black grid grid-cols-[1.4fr_1fr_0.55fr_0.65fr_0.8fr] items-center text-[9px] font-bold text-white">
            <div className="flex items-center gap-1 px-1.5 py-1">
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate" style={{ fontFamily: "system-ui" }}>
                {row.name}
              </span>
            </div>
            <ValCell value={row.volume} unit="lbs" />
            <ValCell value={row.sets} />
            <ValCell value={row.reps} />
            <ValCell value={row.orm} unit="lbs" />
          </div>
          {i < rows.length - 1 && (
            <div className="light:bg-black/12 h-px bg-white/12" />
          )}
        </div>
      ))}
    </div>
  );
}

function Col({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-l border-white/10 px-1 py-1 text-right light:border-black/10">
      {children}
    </span>
  );
}

function ValCell({ value, unit }: { value: string; unit?: string }) {
  return (
    <div className="flex items-baseline justify-end gap-0.5 border-l border-white/10 px-1 py-1 light:border-black/10">
      <span>{value}</span>
      {unit && (
        <span className="light:text-black/45 text-[6px] font-medium text-white/45">
          {unit}
        </span>
      )}
    </div>
  );
}

/* ============================================================
   Icons
   ============================================================ */

function FigureStrengthIcon() {
  // SF Symbol figure.strengthtraining.traditional — simplified person + barbell
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <circle cx="8" cy="3" r="1.4" />
      <rect x="7.5" y="5" width="1" height="6" rx="0.3" />
      <rect x="3.5" y="8" width="9" height="0.8" rx="0.3" />
      <rect x="3" y="7" width="1" height="3" rx="0.3" />
      <rect x="12" y="7" width="1" height="3" rx="0.3" />
      <rect x="6" y="11" width="1" height="3.5" rx="0.3" />
      <rect x="9" y="11" width="1" height="3.5" rx="0.3" />
    </svg>
  );
}

function DivideIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
      <circle cx="8" cy="3" r="1.2" />
      <rect x="2" y="7.25" width="12" height="1.5" rx="0.5" />
      <circle cx="8" cy="13" r="1.2" />
    </svg>
  );
}

/* ============================================================
   Color helpers (local copies to keep this file self-contained)
   ============================================================ */

function darkenHex(hex: string, percent: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const factor = 1 - percent / 100;
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.round(c * factor)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${h}${a}`;
}
