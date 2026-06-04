"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTime,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useTheme } from "@/lib/useTheme";

/**
 * Seven equipment isometrics scattered on the right side of the viewport,
 * connected by dashed lines. Same animation pattern as `RedprintTags`:
 *   - Bouncy spring scale-in tied to `progress`, with per-item stagger
 *   - useTime-driven ambient sine float (per-item phase + speed)
 *   - Cursor parallax + small Z-tilt, per-item spring config variation
 * The dashed connector lines live in a single SVG overlay; each line's
 * endpoints are re-measured every animation frame via
 * `getBoundingClientRect()` on the items, so they stay glued through
 * the entire scale-in / float / parallax motion.
 *
 * Used as the visual content of the GYM-SPECIFIC AI step, on the right
 * side of the viewport opposite the phone (which sits on the left).
 */

type EquipmentItem = {
  id: string;
  src: string;
  /** Position in viewport: (x, y) in vw / vh as the centre of the
   *  isometric. All items live in the right half (50–95 vw). */
  position: { x: string; y: string };
  /** Cursor-parallax sensitivity in px (max translate). */
  parallax: number;
  /** Size in px. */
  size: number;
};

type Layout = {
  items: EquipmentItem[];
  edges: [string, string][];
};

// Saved layouts — toggle by changing the `ACTIVE = …` assignment below.
// Position 1 = the first iteration after the initial build (kept for
// easy revert). Position 2 = tighter spread, shuffled positions, with
// edges rewired to suit the new neighbour graph.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const POSITION_1: Layout = {
  items: [
    { id: "barbell", src: "/exercises/equipment_barbell.png", position: { x: "64%", y: "24%" }, parallax: 22, size: 95 },
    { id: "preacher_curl", src: "/exercises/equipment_preacher_curl.png", position: { x: "85%", y: "22%" }, parallax: 26, size: 90 },
    { id: "bench_press", src: "/exercises/equipment_bench_press.png", position: { x: "77%", y: "44%" }, parallax: 18, size: 100 },
    { id: "dumbbell_rack", src: "/exercises/equipment_dumbbell_rack.png", position: { x: "60%", y: "52%" }, parallax: 20, size: 95 },
    { id: "stair_master", src: "/exercises/equipment_stair_master.png", position: { x: "87%", y: "62%" }, parallax: 24, size: 95 },
    { id: "smith_machine", src: "/exercises/equipment_smith_machine.png", position: { x: "71%", y: "70%" }, parallax: 16, size: 100 },
    { id: "treadmill", src: "/exercises/equipment_treadmill.png", position: { x: "62%", y: "82%" }, parallax: 22, size: 95 },
  ],
  edges: [
    ["barbell", "preacher_curl"],
    ["barbell", "bench_press"],
    ["preacher_curl", "bench_press"],
    ["bench_press", "dumbbell_rack"],
    ["bench_press", "stair_master"],
    ["dumbbell_rack", "smith_machine"],
    ["stair_master", "smith_machine"],
    ["smith_machine", "treadmill"],
    ["dumbbell_rack", "treadmill"],
  ],
};

// Position 2 — tighter horizontal + vertical spread, with treadmill
// moved to the right of bench_press so the overall shape reads as
// MORE HORIZONTAL than vertical. All y values are 5% lower than the
// first version of this layout so the cluster sits a bit further down
// in the viewport.
const POSITION_2: Layout = {
  items: [
    { id: "preacher_curl", src: "/exercises/equipment_preacher_curl.png", position: { x: "71%", y: "38%" }, parallax: 26, size: 90 },
    { id: "dumbbell_rack", src: "/exercises/equipment_dumbbell_rack.png", position: { x: "84%", y: "44%" }, parallax: 20, size: 95 },
    { id: "barbell", src: "/exercises/equipment_barbell.png", position: { x: "62%", y: "57%" }, parallax: 22, size: 95 },
    { id: "bench_press", src: "/exercises/equipment_bench_press.png", position: { x: "79%", y: "63%" }, parallax: 18, size: 100 },
    { id: "treadmill", src: "/exercises/equipment_treadmill.png", position: { x: "90%", y: "63%" }, parallax: 22, size: 95 },
    { id: "smith_machine", src: "/exercises/equipment_smith_machine.png", position: { x: "68%", y: "76%" }, parallax: 16, size: 100 },
    { id: "stair_master", src: "/exercises/equipment_stair_master.png", position: { x: "85%", y: "81%" }, parallax: 24, size: 95 },
  ],
  // Edges rewired for the new treadmill location (now sits between
  // bench_press and stair_master horizontally).
  edges: [
    ["preacher_curl", "dumbbell_rack"],
    ["preacher_curl", "barbell"],
    ["dumbbell_rack", "bench_press"],
    ["dumbbell_rack", "treadmill"],
    ["barbell", "bench_press"],
    ["barbell", "smith_machine"],
    ["bench_press", "treadmill"],
    ["treadmill", "stair_master"],
    ["smith_machine", "stair_master"],
    ["bench_press", "smith_machine"],
  ],
};

const ACTIVE = POSITION_2;
const ITEMS = ACTIVE.items;
const EDGES = ACTIVE.edges;

export function EquipmentCluster({
  progress,
  fadeOutP,
}: {
  /** 0 → 1: drives the bouncy scale-in and gates ambient/parallax
   *  motion so the items only wobble once they're on screen. */
  progress: MotionValue<number>;
  /** 0 → 1: fades the whole cluster (items + connector lines) out.
   *  Used by the step 4→5 transition. */
  fadeOutP?: MotionValue<number>;
}) {
  // Mouse delta from viewport centre, normalised to [-0.5, 0.5].
  // Same wiring as RedprintTags.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseX.set(e.clientX / window.innerWidth - 0.5);
      mouseY.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", handle);
    return () => window.removeEventListener("mousemove", handle);
  }, [mouseX, mouseY]);

  const isDark = useTheme() === "dark";

  const [fade, setFade] = useState(() => fadeOutP?.get() ?? 0);
  useEffect(() => {
    if (!fadeOutP) return;
    return fadeOutP.on("change", setFade);
  }, [fadeOutP]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30"
      style={{ opacity: 1 - fade }}
    >
      {/* Connector lines FIRST so the equipment items render on top. */}
      <ConnectorLines progress={progress} />
      {ITEMS.map((item, i) => (
        <EquipmentItem
          key={item.id}
          item={item}
          index={i}
          progress={progress}
          mouseX={mouseX}
          mouseY={mouseY}
          isDark={isDark}
        />
      ))}
    </div>
  );
}

function EquipmentItem({
  item,
  index,
  progress,
  mouseX,
  mouseY,
  isDark,
}: {
  item: EquipmentItem;
  index: number;
  progress: MotionValue<number>;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  isDark: boolean;
}) {
  const { id, src, position, parallax, size } = item;

  // Bouncy scale-in with per-item stagger. Per-item duration bumped
  // from 0.25 → 0.4 (and stagger 0.04 → 0.06) to slow the whole
  // cluster's reveal slightly — items arrive over more of the EQUIP
  // window rather than snapping in fast.
  const scaleTarget = useTransform(progress, (p) => {
    const stagger = index * 0.06;
    return Math.max(0, Math.min(1, (p - stagger) / 0.4));
  });
  const scaleIn = useSpring(scaleTarget, {
    stiffness: 220,
    damping: 11,
    mass: 0.9,
  });

  // Ambient floating — slow sine waves with per-item phase + speed.
  const time = useTime();
  const phaseX = (index * 1.73) % (Math.PI * 2);
  const phaseY = (index * 2.41) % (Math.PI * 2);
  const speedX = 0.00055 + (index % 3) * 0.00008;
  const speedY = 0.00065 + ((index + 1) % 3) * 0.00007;
  const ambientAmp = 7;
  // Gate ambient motion + cursor parallax by progress so the items
  // don't wobble before they've appeared.
  const wobbleMult = useTransform(progress, (v) => Math.min(1, v));
  const ambientX = useTransform(
    [time, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [t, m] = vals as unknown as [number, number];
      return Math.sin(t * speedX + phaseX) * ambientAmp * m;
    },
  );
  const ambientY = useTransform(
    [time, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [t, m] = vals as unknown as [number, number];
      return Math.cos(t * speedY + phaseY) * ambientAmp * m;
    },
  );

  // Ambient scale wobble — own sine, ±3% so it doesn't sync with x/y.
  const phaseS = (index * 1.91) % (Math.PI * 2);
  const speedS = 0.00045 + (index % 4) * 0.00006;
  const ambientScale = useTransform(
    time,
    (t) => 1 + Math.sin(t * speedS + phaseS) * 0.03,
  );
  const scale = useTransform(
    [scaleIn, ambientScale] as MotionValue<number>[],
    (vals) => {
      const [s, a] = vals as unknown as [number, number];
      return s * a;
    },
  );

  // Per-item spring config so cursor influence doesn't move every
  // item in lockstep.
  const stiff = 65 + ((index * 13) % 25); // 65-89
  const damp = 15 + ((index * 7) % 8); // 15-22

  const xTarget = useTransform(
    [mouseX, ambientX, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [m, a, w] = vals as unknown as [number, number, number];
      return m * parallax * 2 * w + a;
    },
  );
  const yTarget = useTransform(
    [mouseY, ambientY, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [m, a, w] = vals as unknown as [number, number, number];
      return m * parallax * 2 * w + a;
    },
  );
  const x = useSpring(xTarget, { stiffness: stiff, damping: damp, mass: 1 });
  const y = useSpring(yTarget, { stiffness: stiff, damping: damp, mass: 1 });

  // Cursor-driven rotation — small Z-axis tilt, alternating sign.
  const rotateSensitivity = 6 + (index % 3) * 1.5;
  const rotateSign = index % 2 === 0 ? 1 : -1;
  const rotateTarget = useTransform(
    [mouseX, mouseY, wobbleMult] as MotionValue<number>[],
    (vals) => {
      const [mx, my, w] = vals as unknown as [number, number, number];
      return (mx * 0.9 + my * 0.4) * rotateSensitivity * rotateSign * w;
    },
  );
  const rotate = useSpring(rotateTarget, {
    stiffness: stiff,
    damping: damp,
    mass: 1,
  });

  const half = size / 2;
  // Oval glow — wider than tall (~1.6:1). Theme-aware: white halo on
  // the dark theme so the equipment pops against black; black halo on
  // light theme so the silhouettes get a soft drop-shadow feel.
  const glowW = size * 1.6;
  const glowH = size * 0.85;
  const glowColor = isDark
    ? "rgba(245, 241, 238, 0.28)"
    : "rgba(15, 15, 18, 0.28)";

  return (
    <motion.div
      data-equipment-id={id}
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        x,
        y,
        rotate,
        width: size,
        height: size,
        marginLeft: -half,
        marginTop: -half,
        scale,
      }}
    >
      <div
        aria-hidden
        className="absolute"
        style={{
          width: glowW,
          height: glowH,
          left: half - glowW / 2,
          top: half - glowH / 2,
          background: glowColor,
          borderRadius: "50%",
          filter: "blur(40px)",
          opacity: 0.4,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="relative h-full w-full object-contain select-none"
      />
    </motion.div>
  );
}

function ConnectorLines({ progress }: { progress: MotionValue<number> }) {
  type Pt = { x: number; y: number };
  const [centres, setCentres] = useState<Record<string, Pt | null>>(() =>
    Object.fromEntries(ITEMS.map((i) => [i.id, null])),
  );
  const [p, setP] = useState(() => progress.get());
  const rafRef = useRef<number | null>(null);

  useEffect(() => progress.on("change", setP), [progress]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, Pt | null> = {};
      for (const item of ITEMS) {
        const el = document.querySelector(`[data-equipment-id="${item.id}"]`);
        const r = el?.getBoundingClientRect();
        next[item.id] = r
          ? { x: r.left + r.width / 2, y: r.top + r.height / 2 }
          : null;
      }
      setCentres(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Lines fade in slightly after the items themselves start scaling
  // (offset 0.2) so they don't draw across empty space.
  const lineOpacity = Math.max(0, Math.min(1, (p - 0.2) / 0.4));

  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      {EDGES.map(([fromId, toId]) => {
        const from = centres[fromId];
        const to = centres[toId];
        if (!from || !to) return null;
        return (
          <line
            key={`${fromId}-${toId}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="currentColor"
            strokeOpacity={0.2 * lineOpacity}
            strokeWidth={1}
            strokeDasharray="3 4"
            strokeLinecap="round"
            className="text-fg-base"
          />
        );
      })}
    </svg>
  );
}
