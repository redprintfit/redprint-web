"use client";

import { useEffect, useRef, useState } from "react";
import { type MotionValue } from "framer-motion";
import { InfoCard } from "@/components/InfoCard";

/**
 * Generic "card column connected to the phone with dashed orthogonal
 * connector lines" section. Used for the tap-to-track section (cards
 * on the RIGHT, phone on the left) AND the on-demand-learning section
 * (cards on the LEFT, phone on the right). Each card runs its own
 * 0 → 1 sub-phase MotionValue:
 *
 *   [0 → LINE_END]   dashed Z-path draws from a phone-side UI anchor
 *                    to the card's near edge (3 orthogonal segments)
 *   [LINE_END → 1]   line is fully drawn; card "flickers in" with the
 *                    same curve as the left-menu labels
 *
 * The line's phone-end is re-measured every animation frame via
 * `getBoundingClientRect()` on `[data-tracking-host="phone"]
 * [data-tracking-anchor="…"]` so it tracks the highlighted UI element
 * as the phone moves (parallax + float). Host scoping is critical:
 * the Hero carousel renders HomeWorkoutView instances with the same
 * anchor markers and querySelector would otherwise grab those instead.
 */

export type CardData = {
  index: string;
  label: string;
  title: string;
  description: string;
  /** `data-tracking-anchor` value on the phone-side UI element. */
  anchor: string;
};

export const TRACKING_CARDS: readonly CardData[] = [
  {
    index: "01",
    label: "DEPTH",
    title: "Every tool you need, built in.",
    description:
      "Supersets, dropsets, 1RM, notes — plus hundreds of exercises in the library.",
    anchor: "depth",
  },
  {
    index: "02",
    label: "MEMORY",
    title: "Remember what you lifted last time.",
    description:
      "Last session's numbers, right where you need them. The AI suggests the next set.",
    anchor: "memory",
  },
  {
    index: "03",
    label: "SPEED",
    title: "Tap to track.",
    description:
      "Log a set in one tap. No menus, no extra screens, no rest-time math.",
    anchor: "speed",
  },
];

export const LEARNING_CARDS: readonly CardData[] = [
  {
    index: "01",
    label: "ACCESS",
    title: "Help, exactly where you're standing",
    description:
      "Tap a tag, get the demo, without leaving the gym floor.",
    anchor: "access",
  },
  {
    index: "02",
    label: "CONFIDENCE",
    title: "No machine feels off-limits",
    description:
      "Demos from your gym's own trainers, not random influencers.",
    anchor: "confidence",
  },
];

// Split between "line drawing" and "card flickering in" inside each
// card's 0→1 sub-phase.
const LINE_END = 0.6;

// Stuttery reveal — identical to HowItWorksSteps.flicker so cards
// match the established left-menu label aesthetic.
function flicker(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 0.2) return 0.4;
  if (t < 0.35) return 0.1;
  if (t < 0.55) return 0.7;
  if (t < 0.7) return 0.3;
  const r = (t - 0.7) / 0.3;
  return 0.3 + r * 0.7;
}

type Props = {
  /** The card data array (e.g. TRACKING_CARDS or LEARNING_CARDS). */
  cards: readonly CardData[];
  /** One MotionValue per card (same length as `cards`). */
  progresses: MotionValue<number>[];
  /** Vertical top in vh of each card (same length as `cards`). */
  topVh: number[];
  /** Which side of the viewport the cards sit on. Default "right".
   *  Determines which edge of the card the connector originates from
   *  and which edge of the phone anchor it terminates at. */
  side?: "right" | "left";
  /** Horizontal offset from the chosen side, in vw. Default 10. */
  sideOffsetVw?: number;
  /** Optional: a unique key per card to identify its DOM node (so
   *  two simultaneous instances — tracking + learning — don't collide
   *  on the same `data-card-anchor`). */
  cardAnchorPrefix?: string;
  /** 0 → 1: fades the whole group (cards + connector lines) out. */
  fadeOutP?: MotionValue<number>;
};

export function TrackingCards({
  cards,
  progresses,
  topVh,
  side = "right",
  sideOffsetVw = 10,
  cardAnchorPrefix = "card",
  fadeOutP,
}: Props) {
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
      {cards.map((card, i) => (
        <CardSlot
          key={card.index}
          card={card}
          progress={progresses[i]}
          topVh={topVh[i]}
          side={side}
          sideOffsetVw={sideOffsetVw}
          cardAnchorPrefix={cardAnchorPrefix}
        />
      ))}
      <ConnectorLines
        cards={cards}
        progresses={progresses}
        side={side}
        cardAnchorPrefix={cardAnchorPrefix}
      />
    </div>
  );
}

function CardSlot({
  card,
  progress,
  topVh,
  side,
  sideOffsetVw,
  cardAnchorPrefix,
}: {
  card: CardData;
  progress: MotionValue<number>;
  topVh: number;
  side: "right" | "left";
  sideOffsetVw: number;
  cardAnchorPrefix: string;
}) {
  const [p, setP] = useState(() => progress.get());
  useEffect(() => progress.on("change", setP), [progress]);
  const localP =
    p <= LINE_END ? 0 : Math.min(1, (p - LINE_END) / (1 - LINE_END));
  const opacity = flicker(localP);

  return (
    <div
      data-card-anchor={`${cardAnchorPrefix}-${card.label}`}
      className="absolute"
      style={{
        top: `${topVh}vh`,
        [side]: `${sideOffsetVw}vw`,
        width: "min(420px, 32vw)",
        opacity,
      }}
    >
      <InfoCard
        index={card.index}
        label={card.label}
        title={card.title}
        description={card.description}
      />
    </div>
  );
}

type Endpoints = {
  from: { x: number; y: number } | null; // card-side origin
  to: { x: number; y: number } | null; // phone-side target
  p: number;
};

function ConnectorLines({
  cards,
  progresses,
  side,
  cardAnchorPrefix,
}: {
  cards: readonly CardData[];
  progresses: MotionValue<number>[];
  side: "right" | "left";
  cardAnchorPrefix: string;
}) {
  // Endpoints recomputed every animation frame — phone anchors move
  // each tick (parallax + float), and the card's bounding rect shifts
  // as it flickers in.
  const [eps, setEps] = useState<Endpoints[]>(() =>
    cards.map(() => ({ from: null, to: null, p: 0 })),
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const next = cards.map((card, i) => {
        const phoneEl = document.querySelector(
          `[data-tracking-host="phone"] [data-tracking-anchor="${card.anchor}"]`,
        );
        const cardEl = document.querySelector(
          `[data-card-anchor="${cardAnchorPrefix}-${card.label}"]`,
        );
        const phoneRect = phoneEl?.getBoundingClientRect();
        const cardRect = cardEl?.getBoundingClientRect();
        return {
          // Card origin: edge facing the phone. For cards on the RIGHT
          // of the phone, that's the card's LEFT edge; for cards on
          // the LEFT, the card's RIGHT edge.
          from: cardRect
            ? {
                x: side === "right" ? cardRect.left : cardRect.right,
                y: cardRect.top + cardRect.height / 2,
              }
            : null,
          // Phone target: edge facing the cards.
          to: phoneRect
            ? {
                x: side === "right" ? phoneRect.right : phoneRect.left,
                y: phoneRect.top + phoneRect.height / 2,
              }
            : null,
          p: progresses[i].get(),
        };
      });
      setEps(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cards, progresses, side, cardAnchorPrefix]);

  return (
    <svg
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ overflow: "visible" }}
    >
      {eps.map(({ from, to, p }, i) => {
        if (!from || !to) return null;
        const drawP = Math.min(1, p / LINE_END);
        if (drawP <= 0) return null;

        // 3-segment orthogonal Z-path from phone anchor → card.
        // Mid-X sits between phone-target and card-origin regardless
        // of which side the cards are on (works symmetrically).
        const midX = (to.x + from.x) / 2;
        const points = [
          { x: to.x, y: to.y }, // 0: phone-side start (target)
          { x: midX, y: to.y }, // 1: first elbow
          { x: midX, y: from.y }, // 2: second elbow
          { x: from.x, y: from.y }, // 3: card-side end (origin)
        ];

        const lens: number[] = [];
        let total = 0;
        for (let j = 1; j < points.length; j++) {
          const dx = points[j].x - points[j - 1].x;
          const dy = points[j].y - points[j - 1].y;
          const l = Math.hypot(dx, dy);
          lens.push(l);
          total += l;
        }
        const drawLen = total * drawP;
        const visible: Array<{ x: number; y: number }> = [points[0]];
        let consumed = 0;
        for (let j = 0; j < lens.length; j++) {
          if (consumed + lens[j] <= drawLen) {
            visible.push(points[j + 1]);
            consumed += lens[j];
          } else {
            const remaining = drawLen - consumed;
            const t = lens[j] === 0 ? 0 : remaining / lens[j];
            visible.push({
              x: points[j].x + (points[j + 1].x - points[j].x) * t,
              y: points[j].y + (points[j + 1].y - points[j].y) * t,
            });
            break;
          }
        }
        const d = visible
          .map((pt, j) =>
            j === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`,
          )
          .join(" ");

        return (
          <g key={cards[i].label}>
            <path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.45}
              strokeWidth={1}
              strokeDasharray="3 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-fg-base"
            />
            {/* Phone-side "target" dot — visible as soon as the line
                starts drawing, glued to the anchor element. Size
                matches the left-menu dots (8px radius). */}
            <circle
              cx={to.x}
              cy={to.y}
              r={8}
              className="fill-fg-base"
              fillOpacity={0.35}
            />
            {/* Card-side "origin" dot — only visible when the line has
                fully reached the card. Same 8px radius. */}
            {drawP >= 1 && (
              <circle
                cx={from.x}
                cy={from.y}
                r={8}
                className="fill-fg-base"
                fillOpacity={0.5}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
