"use client";

import { useEffect, useRef } from "react";
import {
  N_BLOBS,
  dotRadii,
  easeInOut,
  idlePositions,
  idleRadii,
  renderBlob,
  ringPositions,
} from "@/lib/blobAvatar";
import { useTheme } from "@/lib/useTheme";

type Mode = "idle" | "loading";

type Props = {
  mode?: Mode;
  /** Pixel size of the avatar (assumed square). */
  size?: number;
  className?: string;
  /**
   * If provided, overrides the internal time-driven ring rotation with an
   * externally controlled value (radians). Used by the scroll sequence so
   * the loading wheel only spins as the user scrolls.
   */
  ringRot?: number;
  /**
   * Override the loading-mode ring radius fraction (default 0.28). Used
   * to make the 6 dots sit at the same radius as the redprint emblem's
   * outer circles.
   */
  ringRadiusFrac?: number;
  /**
   * Override the loading-mode dot radius fraction (default 0.06). Used
   * to make the 6 dots the same size as the emblem's filled circles.
   */
  dotRadiusFrac?: number;
};

/**
 * Generative metaball avatar — direct port of BlobAvatarView.swift.
 * Renders to a <canvas> at devicePixelRatio resolution. The color follows
 * the marketing site's theme (white in dark mode, dark in light mode).
 */
export function BlobAvatar({
  mode = "idle",
  size = 200,
  className,
  ringRot: externalRingRot,
  ringRadiusFrac,
  dotRadiusFrac,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = useTheme() === "dark";
  const color = isDark ? "#ffffff" : "#1a0e0d";

  // Drive everything in a ref so the render loop sees the latest values
  // without re-creating itself on each prop change.
  const stateRef = useRef({
    mode,
    color,
    size,
    t: 0,
    ringRot: 0,
    transStart: 0,
    transP: 1.0,
    currentMode: mode,
    targetMode: mode,
    snapPos: [] as { x: number; y: number }[],
    snapRadii: [] as number[],
    lastNow: 0,
    externalRingRot: externalRingRot as number | undefined,
    ringRadiusFrac: ringRadiusFrac as number | undefined,
    dotRadiusFrac: dotRadiusFrac as number | undefined,
  });
  stateRef.current.color = color;
  stateRef.current.size = size;
  stateRef.current.externalRingRot = externalRingRot;
  stateRef.current.ringRadiusFrac = ringRadiusFrac;
  stateRef.current.dotRadiusFrac = dotRadiusFrac;

  // Detect mode changes to begin a transition.
  useEffect(() => {
    const s = stateRef.current;
    if (mode === s.targetMode) return;

    // Snapshot current positions/radii so the transition starts smoothly.
    const cx = s.size / 2;
    const cy = s.size / 2;
    const curRingRot = s.externalRingRot ?? s.ringRot;
    s.snapPos =
      s.targetMode === "idle"
        ? idlePositions(s.t, s.size, cx, cy)
        : ringPositions(curRingRot, s.size, cx, cy, s.ringRadiusFrac);
    s.snapRadii =
      s.targetMode === "idle"
        ? idleRadii(s.t, s.size)
        : dotRadii(s.size, s.dotRadiusFrac);

    s.currentMode = s.targetMode;
    s.targetMode = mode;
    s.transStart = s.t;
    s.transP = 0.0;
  }, [mode]);

  // Animation loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    let rafId = 0;
    const ROT_SPEED = 1.2;
    const TRANS_DUR = 0.65;

    const loop = (now: number) => {
      const s = stateRef.current;
      const t = now / 1000;
      const dt = s.lastNow === 0 ? 0 : Math.min(t - s.lastNow, 0.1);
      s.lastNow = t;
      s.t += dt;
      // External control wins — when an external ringRot is supplied the
      // wheel only turns as that value moves (e.g. tied to scroll). The
      // internal time-driven advance still runs so the idle blob keeps
      // breathing if mode flips back.
      if (s.externalRingRot === undefined) s.ringRot += ROT_SPEED * dt;

      if (s.transP < 1.0) {
        s.transP = Math.min((s.t - s.transStart) / TRANS_DUR, 1.0);
        if (s.transP >= 1.0) s.currentMode = s.targetMode;
      }

      // Resize canvas to actual size × dpr.
      const cw = s.size;
      const ch = s.size;
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const cx = cw / 2;
      const cy = ch / 2;

      // Compute current positions + radii (interpolating if mid-transition).
      let positions: { x: number; y: number }[];
      let radii: number[];

      const ringRotNow = s.externalRingRot ?? s.ringRot;
      const idleP = idlePositions(s.t, s.size, cx, cy);
      const idleR = idleRadii(s.t, s.size);
      const ringP = ringPositions(
        ringRotNow,
        s.size,
        cx,
        cy,
        s.ringRadiusFrac,
      );
      const ringR = dotRadii(s.size, s.dotRadiusFrac);

      if (s.transP >= 1.0) {
        if (s.targetMode === "idle") {
          positions = idleP;
          radii = idleR;
        } else {
          positions = ringP;
          radii = ringR;
        }
      } else {
        const toPos = s.targetMode === "idle" ? idleP : ringP;
        const toRad = s.targetMode === "idle" ? idleR : ringR;
        const fi = s.snapPos.length ? s.snapPos : toPos;
        const fr = s.snapRadii.length ? s.snapRadii : toRad;
        const p = easeInOut(s.transP);
        positions = [];
        radii = [];
        for (let k = 0; k < N_BLOBS; k++) {
          positions.push({
            x: fi[k].x + (toPos[k].x - fi[k].x) * p,
            y: fi[k].y + (toPos[k].y - fi[k].y) * p,
          });
          radii.push(fr[k] + (toRad[k] - fr[k]) * p);
        }
      }

      renderBlob(ctx, positions, radii, cw, ch, s.color, s.size);

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}
