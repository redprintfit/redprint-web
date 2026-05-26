/**
 * Direct TypeScript/Canvas port of
 * Redprint5/Views/Track Page Files/BlobAvatarView.swift.
 *
 * Generative avatar: 6 sub-blobs whose positions are driven by independent
 * lava-lamp orbits (idle) or a rotating ring (loading). Rendered via a
 * power-4 metaball field, marching squares for the contour, and clamped
 * Catmull-Rom smoothing.
 */

/* ============================================================
   Metaball renderer
   ============================================================ */

const GRID_RES = 72;

type Pt = { x: number; y: number };
type EdgeKey = string; // "h:r:c" or "v:r:c"

function edgeKey(horiz: boolean, r: number, c: number): EdgeKey {
  return `${horiz ? "h" : "v"}:${r}:${c}`;
}

/** Power-4 metaball field: f = Σ (rk²/d²)² */
function buildField(
  positions: Pt[],
  radii: number[],
  w: number,
  h: number,
): Float32Array {
  const g = GRID_RES;
  const nx = g + 1;
  const ny = g + 1;
  const cw = w / g;
  const ch = h / g;
  const out = new Float32Array(nx * ny);

  for (let row = 0; row < ny; row++) {
    const py = row * ch;
    for (let col = 0; col < nx; col++) {
      const px = col * cw;
      let f = 0;
      for (let k = 0; k < positions.length; k++) {
        const dx = px - positions[k].x;
        const dy = py - positions[k].y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01) {
          const r2 = radii[k] * radii[k];
          const c = r2 / d2;
          f += c * c;
        }
      }
      out[row * nx + col] = f;
    }
  }
  return out;
}

type Seg = [EdgeKey, EdgeKey];

function marchSquares(
  field: Float32Array,
  w: number,
  h: number,
): { segs: Seg[]; pts: Map<EdgeKey, Pt> } {
  const g = GRID_RES;
  const nx = g + 1;
  const cw = w / g;
  const ch = h / g;
  const thr = 1.0;
  const segs: Seg[] = [];
  const pts = new Map<EdgeKey, Pt>();

  const lerp = (va: number, vb: number, a: number, b: number) => {
    const t = (thr - va) / (vb - va);
    return a + t * (b - a);
  };

  for (let row = 0; row < g; row++) {
    for (let col = 0; col < g; col++) {
      const tl = field[row * nx + col];
      const tr = field[row * nx + col + 1];
      const bl = field[(row + 1) * nx + col];
      const br = field[(row + 1) * nx + col + 1];

      const idx =
        (tl > thr ? 8 : 0) |
        (tr > thr ? 4 : 0) |
        (br > thr ? 2 : 0) |
        (bl > thr ? 1 : 0);
      if (idx === 0 || idx === 15) continue;

      const x0 = col * cw;
      const y0 = row * ch;
      const x1 = x0 + cw;
      const y1 = y0 + ch;

      const topK = edgeKey(true, row, col);
      const bottomK = edgeKey(true, row + 1, col);
      const leftK = edgeKey(false, row, col);
      const rightK = edgeKey(false, row, col + 1);

      if (!pts.has(topK))
        pts.set(topK, { x: lerp(tl, tr, x0, x1), y: y0 });
      if (!pts.has(bottomK))
        pts.set(bottomK, { x: lerp(bl, br, x0, x1), y: y1 });
      if (!pts.has(leftK))
        pts.set(leftK, { x: x0, y: lerp(tl, bl, y0, y1) });
      if (!pts.has(rightK))
        pts.set(rightK, { x: x1, y: lerp(tr, br, y0, y1) });

      switch (idx) {
        case 1:
          segs.push([leftK, bottomK]);
          break;
        case 2:
          segs.push([bottomK, rightK]);
          break;
        case 3:
          segs.push([leftK, rightK]);
          break;
        case 4:
          segs.push([topK, rightK]);
          break;
        case 5: {
          const ctr = (tl + tr + bl + br) * 0.25;
          if (ctr > thr) {
            segs.push([topK, leftK]);
            segs.push([bottomK, rightK]);
          } else {
            segs.push([topK, rightK]);
            segs.push([leftK, bottomK]);
          }
          break;
        }
        case 6:
          segs.push([topK, bottomK]);
          break;
        case 7:
          segs.push([topK, leftK]);
          break;
        case 8:
          segs.push([topK, leftK]);
          break;
        case 9:
          segs.push([topK, bottomK]);
          break;
        case 10: {
          const ctr = (tl + tr + bl + br) * 0.25;
          if (ctr > thr) {
            segs.push([topK, rightK]);
            segs.push([leftK, bottomK]);
          } else {
            segs.push([topK, leftK]);
            segs.push([bottomK, rightK]);
          }
          break;
        }
        case 11:
          segs.push([topK, rightK]);
          break;
        case 12:
          segs.push([leftK, rightK]);
          break;
        case 13:
          segs.push([bottomK, rightK]);
          break;
        case 14:
          segs.push([leftK, bottomK]);
          break;
      }
    }
  }
  return { segs, pts };
}

function stitch(segs: Seg[]): EdgeKey[][] {
  if (segs.length === 0) return [];
  const adj = new Map<EdgeKey, number[]>();
  for (let i = 0; i < segs.length; i++) {
    const [a, b] = segs[i];
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a)!.push(i);
    adj.get(b)!.push(i);
  }
  const visited = new Array(segs.length).fill(false);
  const chains: EdgeKey[][] = [];

  for (let start = 0; start < segs.length; start++) {
    if (visited[start]) continue;
    visited[start] = true;
    const chain: EdgeKey[] = [segs[start][0]];
    let cur = segs[start][1];
    while (true) {
      chain.push(cur);
      const neighbors = adj.get(cur);
      if (!neighbors) break;
      const next = neighbors.find((i) => !visited[i]);
      if (next === undefined) break;
      visited[next] = true;
      const [na, nb] = segs[next];
      cur = na === cur ? nb : na;
    }
    if (chain.length >= 6) chains.push(chain);
  }
  return chains;
}

/**
 * Catmull-Rom path with clamped tangents (no overshoot at narrow necks).
 * Issues canvas commands directly.
 */
function smoothPathTo(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  const n = pts.length;
  if (n < 3) return;
  const p = (i: number) => pts[((i % n) + n) % n];

  ctx.beginPath();
  ctx.moveTo(p(0).x, p(0).y);
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);

    let t1x = (p2.x - p0.x) / 6;
    let t1y = (p2.y - p0.y) / 6;
    let t2x = (p3.x - p1.x) / 6;
    let t2y = (p3.y - p1.y) / 6;

    const chordX = p2.x - p1.x;
    const chordY = p2.y - p1.y;
    const halfChord = Math.hypot(chordX, chordY) * 0.5;

    const clamp = (dx: number, dy: number): [number, number] => {
      const len = Math.hypot(dx, dy);
      if (len > halfChord && len > 1e-6) {
        const s = halfChord / len;
        return [dx * s, dy * s];
      }
      return [dx, dy];
    };
    [t1x, t1y] = clamp(t1x, t1y);
    [t2x, t2y] = clamp(t2x, t2y);

    const c1x = p1.x + t1x;
    const c1y = p1.y + t1y;
    const c2x = p2.x - t2x;
    const c2y = p2.y - t2y;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }
  ctx.closePath();
}

/** Render the full metaball field for one frame. */
export function renderBlob(
  ctx: CanvasRenderingContext2D,
  positions: Pt[],
  radii: number[],
  w: number,
  h: number,
  color: string,
  size: number,
) {
  const field = buildField(positions, radii, w, h);
  const { segs, pts } = marchSquares(field, w, h);
  const chains = stitch(segs);
  const strokeW = size * 0.01;

  for (const chain of chains) {
    const cgPts: Pt[] = [];
    for (const k of chain) {
      const pt = pts.get(k);
      if (pt) cgPts.push(pt);
    }
    if (cgPts.length < 6) continue;

    // 1. Fill with shadow underneath
    ctx.save();
    ctx.shadowColor = colorWithAlpha(color, 0.35);
    ctx.shadowBlur = size * 0.04;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = size * 0.015;
    ctx.fillStyle = colorWithAlpha(color, 0.5);
    smoothPathTo(ctx, cgPts);
    ctx.fill();
    ctx.restore();

    // 2. Stroke at 100% opacity
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeW;
    smoothPathTo(ctx, cgPts);
    ctx.stroke();
  }
}

function colorWithAlpha(color: string, alpha: number): string {
  // Accepts hex (#rrggbb) or named/rgb strings. For hex, add alpha hex byte.
  if (color.startsWith("#") && color.length === 7) {
    const a = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${a}`;
  }
  // Fallback: assume rgb/named — wrap in rgba via a temporary canvas-style trick.
  // Simpler: use rgba() if user passed rgb(...), else use color and rely on
  // CanvasRenderingContext2D globalAlpha is not used here to keep API clean.
  return color;
}

/* ============================================================
   Blob position generators (lava-lamp + ring)
   ============================================================ */

export const N_BLOBS = 6;

const ORBIT_R = [0.04, 0.14, 0.2, 0.08, 0.18, 0.12];
const ORBIT_SPD = [0.13, 0.27, 0.2, 0.33, 0.23, 0.19];
const ORBIT_PH = [0.0, 1.05, 2.09, 3.14, 4.19, 5.24];
const WOB_SPD = [0.4, 0.52, 0.36, 0.6, 0.46, 0.29];
const WOB_AMP = [0.02, 0.05, 0.06, 0.04, 0.06, 0.04];
const BLOB_R_FRAC = [0.21, 0.17, 0.15, 0.2, 0.14, 0.18];
const SIZE_SPD = [0.38, 0.29, 0.48, 0.34, 0.44, 0.27];
const SIZE_PH = [0.0, 1.2, 2.4, 3.6, 4.8, 6.0];

const RING_R_FRAC = 0.28;
const DOT_R_FRAC = 0.06;

export function idlePositions(
  t: number,
  size: number,
  cx: number,
  cy: number,
): Pt[] {
  const breathe = 1.0 + 0.13 * Math.sin(0.21 * t);
  const out: Pt[] = [];
  for (let k = 0; k < N_BLOBS; k++) {
    const r = size * (ORBIT_R[k] * breathe);
    const angle = ORBIT_PH[k] + ORBIT_SPD[k] * t;
    const wx = size * WOB_AMP[k] * Math.sin(WOB_SPD[k] * t + ORBIT_PH[k] * 1.3);
    const wy =
      size * WOB_AMP[k] * Math.cos(WOB_SPD[k] * t * 1.1 + ORBIT_PH[k] * 0.7);
    const rawX = cx + r * Math.cos(angle) + wx;
    const rawY = cy + r * Math.sin(angle) + wy;

    // Hard radial clamp so the blob never exits the canvas.
    const margin = size * BLOB_R_FRAC[k] * 1.15 + 2;
    const maxDist = size * 0.5 - margin;
    const dx = rawX - cx;
    const dy = rawY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxDist && dist > 0.001) {
      const s = maxDist / dist;
      out.push({ x: cx + dx * s, y: cy + dy * s });
    } else {
      out.push({ x: rawX, y: rawY });
    }
  }
  return out;
}

export function idleRadii(t: number, size: number): number[] {
  const out: number[] = [];
  for (let k = 0; k < N_BLOBS; k++) {
    const pulse = 1.0 + 0.12 * Math.sin(SIZE_SPD[k] * t + SIZE_PH[k]);
    out.push(size * BLOB_R_FRAC[k] * pulse);
  }
  return out;
}

export function ringPositions(
  ringRot: number,
  size: number,
  cx: number,
  cy: number,
): Pt[] {
  const rr = size * RING_R_FRAC;
  const out: Pt[] = [];
  for (let k = 0; k < N_BLOBS; k++) {
    const angle = (2 * Math.PI * k) / N_BLOBS + ringRot;
    out.push({ x: cx + rr * Math.cos(angle), y: cy + rr * Math.sin(angle) });
  }
  return out;
}

export function dotRadii(size: number): number[] {
  return new Array(N_BLOBS).fill(size * DOT_R_FRAC);
}

export function easeInOut(v: number): number {
  return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
}
