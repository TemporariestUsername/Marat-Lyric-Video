import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { easeOut, prog, rnd } from "../timing";
import { C, H, W } from "../theme";

/**
 * Red ink bleeding down from a line of type. Drips are thin columns with a bulb
 * at the tip, merged into liquid by a "goo" filter. `heaviness` (1..3) scales
 * drip count, width and reach — each chorus bleeds more than the last.
 */
export const BloodDrips: React.FC<{
  start: number;
  x0: number;
  x1: number;
  y: number;
  heaviness: number;
  seed: string;
  color?: string;
  reach?: number; // max drip length in px at heaviness 1
}> = ({ start, x0, x1, y, heaviness, seed, color = C.blood, reach = 380 }) => {
  const t = useT();
  if (t < start) return null;
  const d = t - start;
  const n = Math.round(10 + heaviness * 12);
  const id = `goo-${seed}`;
  const drips = [];
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd(seed, i, "x") * (x1 - x0);
    const w = (5 + rnd(seed, i, "w") * 14) * (0.8 + heaviness * 0.25);
    const delay = rnd(seed, i, "d") * 0.9;
    const dur = 1.2 + rnd(seed, i, "t") * 2.2;
    const long = rnd(seed, i, "l");
    const maxLen = reach * (0.15 + long * long * 1.1) * (0.6 + heaviness * 0.5);
    // fast initial run, then a slow creep that never quite stops
    const p = easeOut(prog(d, delay, dur));
    const creep = Math.max(0, d - delay - dur) * 6 * heaviness * long;
    const len = Math.min(H - y + 40, maxLen * p + creep);
    if (len <= 0) continue;
    drips.push(
      <g key={i}>
        <rect x={x - w / 2} y={y - 4} width={w} height={len} rx={w / 2} />
        <circle cx={x} cy={y + len} r={w * 0.72} />
      </g>,
    );
  }
  const pool = easeOut(prog(d, 0, 0.5));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id={id}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
          </filter>
        </defs>
        <g filter={`url(#${id})`} fill={color}>
          <rect x={x0} y={y - 6} width={(x1 - x0) * pool} height={4 + heaviness * 3} rx={4} />
          {drips}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/**
 * The page soaking red from the bottom up like bathwater. `level` 0..1 of the
 * frame height; the surface ripples slowly.
 */
export const SoakLayer: React.FC<{ level: number; t: number; color?: string; opacity?: number }> = ({
  level,
  t,
  color = C.blood,
  opacity = 0.88,
}) => {
  if (level <= 0) return null;
  const top = H * (1 - level);
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 40) {
    const yy = top + Math.sin(x / 190 + t * 0.9) * 7 + Math.sin(x / 83 - t * 0.6) * 4;
    pts.push(`${x},${yy.toFixed(1)}`);
  }
  const path = `M0,${H} L${pts.join(" L")} L${W},${H} Z`;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="soak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity={opacity * 0.75} />
            <stop offset="0.12" stopColor={color} stopOpacity={opacity} />
            <stop offset="1" stopColor={C.bloodDark} stopOpacity={opacity} />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#soak)" style={{ mixBlendMode: "multiply" }} />
      </svg>
    </AbsoluteFill>
  );
};

/** Waterline y (px) for a soak level — lets text switch colour below the surface. */
export const soakTop = (level: number) => H * (1 - level);
