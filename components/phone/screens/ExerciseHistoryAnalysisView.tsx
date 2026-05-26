import { type Org } from "@/lib/content/orgs";

/**
 * Exercise Progression analytics — stats trio + volume comparison chart
 * + table of recent exercises.
 */
export function ExerciseHistoryAnalysisView(_props: { org: Org }) {
  return (
    <div className="light:bg-white light:text-black flex h-full flex-col bg-black px-2.5 pb-2 pt-7 text-white">
      {/* Header */}
      <div className="flex items-start gap-1.5">
        <div className="mt-0.5 text-[16px] leading-none">📍</div>
        <div className="flex-1 text-[11px] font-bold leading-tight">
          Exercise Progression
        </div>
        <div className="flex h-4 w-4 items-center justify-center rounded-full light:bg-black/10 bg-white/10 text-[7px]">
          ✕
        </div>
      </div>
      <p className="mt-1 text-[8px] leading-tight light:text-black/70 text-white/70">
        Compare exercises over time and track your personal records.
      </p>

      {/* Stats row */}
      <div className="mt-2 flex gap-1">
        <StatCard value="729" label="Total Sessions" icon="🏋" />
        <StatCard value="121" label="Unique Exercises" icon="🏋" />
        <StatCard value="24.9k" unit="lbs" label="Volume/Exercise" icon="÷" />
      </div>

      {/* Comparison header + selectors */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[8.5px] font-semibold">Exercise Comparison</span>
        <div className="flex gap-1">
          <Selector label="Volume" />
          <Selector label="Last 10" />
        </div>
      </div>

      {/* Chart */}
      <div className="mt-1 flex-1 overflow-hidden">
        <div className="text-[7px] light:text-black/40 text-white/40">Volume (lbs)</div>
        <Chart />
      </div>

      {/* Pagination */}
      <div className="mt-1 flex items-center justify-center gap-2 text-[7.5px] light:text-black/60 text-white/60">
        <span className="flex h-4 w-4 items-center justify-center rounded-full light:bg-black/10 bg-white/10">
          ‹
        </span>
        <span>79–88 of 88</span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full light:bg-black/10 bg-white/10">
          ›
        </span>
      </div>

      {/* Table */}
      <div className="mt-1">
        <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.9fr] gap-1 border-b light:border-black/10 light:border-black/10 border-white/10 px-1 pb-0.5 text-[6.5px] light:text-black/40 text-white/40">
          <span>Exercise</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Sets</span>
          <span className="text-right">Reps</span>
          <span className="text-right">1RM</span>
        </div>
        <TableRow
          color="#e63946"
          name="Push-Up"
          volume="648.1k"
          sets="289"
          reps="5,864"
          orm="354"
        />
        <TableRow
          color="#c44a5b"
          name="Pull-up"
          volume="440.0k"
          sets="327"
          reps="3,019"
          orm="239"
        />
        <TableRow
          color="#a93a5a"
          name="Bodyweight…"
          volume="210.8k"
          sets="88"
          reps="1,580"
          orm="392"
        />
      </div>
    </div>
  );
}

function StatCard({
  value,
  unit,
  label,
  icon,
}: {
  value: string;
  unit?: string;
  label: string;
  icon: string;
}) {
  return (
    <div className="flex-1 rounded-md border light:border-black/10 light:border-black/10 border-white/10 p-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-bold">
          {value}
          {unit && <span className="text-[7px] light:text-black/50 text-white/50"> {unit}</span>}
        </span>
        <span className="text-[7px] light:text-black/40 text-white/40">{icon}</span>
      </div>
      <div className="text-[6.5px] light:text-black/50 text-white/50">{label}</div>
    </div>
  );
}

function Selector({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1 rounded-md light:bg-black/8 bg-white/8 px-1.5 py-0.5 text-[7.5px]">
      {label}
      <span className="light:text-black/50 text-white/50">⇅</span>
    </div>
  );
}

function Chart() {
  // Pre-computed sample points across 3 series. Y values are normalized
  // for an SVG viewBox of 200x110 (volume 0-20k mapped vertically).
  const series = [
    {
      color: "#e63946",
      points: [
        [0, 60], [20, 60], [40, 60], [60, 60], [80, 60],
        [100, 60], [120, 60], [140, 60], [160, 60], [180, 60],
      ],
    },
    {
      // Spiky middle line with a big peak
      color: "#d65a6d",
      points: [
        [0, 50], [20, 40], [40, 45], [60, 75], [80, 70],
        [100, 65], [120, 12], [140, 50], [160, 60], [180, 65],
      ],
    },
    {
      // Wavy lower line
      color: "#9b2a40",
      points: [
        [0, 78], [20, 70], [40, 95], [60, 92], [80, 82],
        [100, 78], [120, 78], [140, 78], [160, 82], [180, 90],
      ],
    },
  ];

  const toPath = (pts: number[][]) =>
    pts
      .map((p, i) =>
        i === 0
          ? `M ${p[0]} ${p[1]}`
          : ` L ${p[0]} ${p[1]}`,
      )
      .join("");

  return (
    <svg viewBox="-20 -5 220 115" className="h-full w-full" preserveAspectRatio="none">
      {/* Y axis ticks */}
      {[0, 5000, 10000, 15000, 20000].map((v, i) => {
        const y = 100 - i * 25;
        return (
          <g key={v}>
            <line
              x1="0"
              y1={y}
              x2="200"
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="0.5"
            />
            <text
              x="-3"
              y={y + 2}
              textAnchor="end"
              fill="currentColor"
              fillOpacity="0.5"
              fontSize="5"
            >
              {v === 0 ? "0" : `${v / 1000},000`}
            </text>
          </g>
        );
      })}

      {/* Lines + dots */}
      {series.map((s, idx) => (
        <g key={idx}>
          <path
            d={toPath(s.points)}
            fill="none"
            stroke={s.color}
            strokeWidth="1.2"
          />
          {s.points.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r="1.4" fill={s.color} />
          ))}
        </g>
      ))}

      {/* Area fill under the peak (middle series) */}
      <path
        d={`${toPath(series[1].points)} L 180 100 L 0 100 Z`}
        fill="url(#peakGrad)"
        opacity="0.25"
      />
      <defs>
        <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d65a6d" />
          <stop offset="1" stopColor="#d65a6d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* X axis labels */}
      {[2, 4, 6, 8].map((n, i) => (
        <text
          key={n}
          x={20 + i * 50}
          y="110"
          textAnchor="middle"
          fill="currentColor"
              fillOpacity="0.5"
          fontSize="5"
        >
          {n}
        </text>
      ))}
    </svg>
  );
}

function TableRow({
  color,
  name,
  volume,
  sets,
  reps,
  orm,
}: {
  color: string;
  name: string;
  volume: string;
  sets: string;
  reps: string;
  orm: string;
}) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.9fr] items-center gap-1 border-b light:border-black/5 border-white/5 px-1 py-0.5 text-[7.5px]">
      <div className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{name}</span>
      </div>
      <span className="text-right">
        {volume}
        <span className="text-[5.5px] light:text-black/40 text-white/40"> lbs</span>
      </span>
      <span className="text-right">{sets}</span>
      <span className="text-right">{reps}</span>
      <span className="text-right">
        {orm}
        <span className="text-[5.5px] light:text-black/40 text-white/40"> lbs</span>
      </span>
    </div>
  );
}
