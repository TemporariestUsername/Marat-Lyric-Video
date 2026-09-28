import React from "react";
import { rnd } from "../timing";
import { C } from "../theme";

// A strip of sans-culottes in paper-cut silhouette: heads and shoulders, bonnets
// rouges (Phrygian caps), tricornes, women's bonnets, queues; pikes and fists
// raised. Everything is generated from a seed, so each figure is different but
// the crowd is identical on every frame.

type Person = {
  x: number;
  h: number;
  facing: 1 | -1;
  hat: "phrygian" | "tricorne" | "bonnet" | "queue";
  arm: "pike" | "fist" | "none";
  pikeLen: number;
  phase: number;
};

const people = (seed: string, width: number, n: number): Person[] =>
  Array.from({ length: n }, (_, i) => {
    const r = (k: string) => rnd(seed, i, k);
    const hats: Person["hat"][] = ["phrygian", "phrygian", "tricorne", "bonnet", "queue"];
    const arm = r("a") < 0.45 ? "pike" : r("a") < 0.62 ? "fist" : "none";
    return {
      x: (i + 0.5 + (r("x") - 0.5) * 0.7) * (width / n),
      h: 250 + r("h") * 70,
      facing: r("f") < 0.5 ? 1 : -1,
      hat: hats[Math.floor(r("hat") * hats.length)],
      arm,
      pikeLen: 360 + r("p") * 260,
      phase: r("ph"),
    };
  });

// Profile head, facing +x, in head-radius units around the skull centre:
// brow, nose, lips, chin, jaw, then round the back of the skull.
const PROFILE: [number, number][] = [
  [-0.95, -0.2], [-0.85, -0.85], [-0.2, -1.12], [0.5, -0.95], [0.78, -0.45], [0.8, -0.18], [1.14, 0.2],
  [0.86, 0.3], [0.94, 0.42], [0.84, 0.54], [0.9, 0.64], [0.76, 0.86], [0.46, 1.0], [0.12, 0.92],
  [-0.3, 0.86], [-0.8, 0.45],
];
const profilePath = (x: number, y: number, r: number, f: number) =>
  "M" + PROFILE.map(([u, v]) => `${x + f * u * r},${y + v * r}`).join(" L") + " Z";

const figure = (p: Person, lift: number, bob: number) => {
  const { x, h, facing: f } = p;
  const y0 = -bob; // baseline 0 is the bottom edge of the strip
  const r = h * 0.14; // head radius
  const hy = y0 - h * 0.76; // head centre
  const sw = h * 0.36; // shoulder half-width
  const parts: React.ReactNode[] = [];
  // torso: sloping shoulders down to the strip
  parts.push(
    <path
      key="b"
      d={`M${x - sw * 1.3},${y0 + 10} C${x - sw * 1.25},${y0 - h * 0.28} ${x - sw * 1.05},${y0 - h * 0.5} ${x - r * 0.5},${y0 - h * 0.56}
          L${x + r * 0.5},${y0 - h * 0.56} C${x + sw * 1.05},${y0 - h * 0.5} ${x + sw * 1.25},${y0 - h * 0.28} ${x + sw * 1.3},${y0 + 10} Z`}
    />,
  );
  // neck and head in profile
  parts.push(<rect key="neck" x={x - r * 0.42} y={hy + r * 0.4} width={r * 0.84} height={h * 0.2} />);
  parts.push(<path key="h" d={profilePath(x, hy, r, f)} />);
  // hats
  if (p.hat === "phrygian") {
    // bonnet rouge: rises off the back of the head and flops forward to a point
    parts.push(
      <path
        key="hat"
        d={`M${x - f * r * 1.02},${hy + r * 0.05} C${x - f * r * 1.15},${hy - r * 1.9} ${x + f * r * 0.9},${hy - r * 2.5} ${x + f * r * 1.5},${hy - r * 1.55}
            C${x + f * r * 1.7},${hy - r * 1.2} ${x + f * r * 1.35},${hy - r * 0.95} ${x + f * r * 1.05},${hy - r * 1.25}
            C${x + f * r * 0.9},${hy - r * 1.05} ${x + f * r * 0.85},${hy - r * 0.7} ${x + f * r * 0.75},${hy - r * 0.5} Z`}
      />,
    );
  } else if (p.hat === "tricorne") {
    parts.push(
      <path
        key="hat"
        d={`M${x - r * 1.85},${hy - r * 0.45} Q${x},${hy - r * 0.05} ${x + r * 1.85},${hy - r * 0.45}
            Q${x + r * 1.5},${hy - r * 0.95} ${x + r * 1.05},${hy - r * 1.45} Q${x},${hy - r * 1.95} ${x - r * 1.05},${hy - r * 1.45}
            Q${x - r * 1.5},${hy - r * 0.95} ${x - r * 1.85},${hy - r * 0.45} Z`}
      />,
    );
  } else if (p.hat === "bonnet") {
    parts.push(<ellipse key="hat" cx={x - f * r * 0.2} cy={hy - r * 0.5} rx={r * 1.3} ry={r * 1.0} />);
    parts.push(<path key="frill" d={`M${x - f * r * 1.5},${hy - r * 0.1} Q${x - f * r * 0.2},${hy - r * 0.55} ${x + f * r * 1.15},${hy - r * 0.2} L${x + f * r * 1.05},${hy + r * 0.05} Q${x - f * r * 0.2},${hy - r * 0.25} ${x - f * r * 1.45},${hy + r * 0.2} Z`} />);
  } else {
    // bare head, hair tied back in a queue with a ribbon
    parts.push(<path key="q" d={`M${x - f * r * 0.85},${hy + r * 0.1} q${-f * r * 0.7},${r * 0.25} ${-f * r * 0.55},${r * 1.35} l${f * r * 0.28},${-r * 0.05} q${-f * r * 0.05},${-r * 0.8} ${f * r * 0.4},${-r * 1.05} z`} />);
  }
  // raised arm: tapered from the shoulder to the hand
  if (p.arm !== "none") {
    const side = f;
    const tilt = (p.phase - 0.5) * 0.45; // pikes lean, not all bolt upright
    const sx = x + side * sw * 0.72;
    const sy = y0 - h * 0.48;
    const len = h * 0.62 + lift * 0.6;
    const hx = sx + side * h * 0.12 + Math.sin(tilt) * len * 0.4;
    const hy2 = sy - len;
    const w0 = h * 0.075,
      w1 = h * 0.045;
    parts.push(<path key="arm" d={`M${sx - w0},${sy + 12} L${hx - w1},${hy2} L${hx + w1},${hy2} L${sx + w0},${sy + 4} Z`} />);
    if (p.arm === "fist") {
      parts.push(<ellipse key="fist" cx={hx} cy={hy2 - r * 0.2} rx={r * 0.42} ry={r * 0.5} />);
    } else {
      const L = p.pikeLen;
      const dx = Math.sin(tilt),
        dy = -Math.cos(tilt);
      const tx = hx + dx * L * 0.72,
        ty = hy2 + dy * L * 0.72; // pike top
      const bx = hx - dx * L * 0.28,
        by = hy2 - dy * L * 0.28;
      const ang = (tilt * 180) / Math.PI;
      parts.push(<line key="shaft" x1={bx} y1={by} x2={tx} y2={ty} stroke={"currentColor"} strokeWidth={9} />);
      parts.push(
        <path
          key="head"
          transform={`rotate(${ang} ${tx} ${ty})`}
          d={`M${tx},${ty - 100} C${tx + 20},${ty - 50} ${tx + 19},${ty - 14} ${tx + 6},${ty + 4} L${tx - 6},${ty + 4} C${tx - 19},${ty - 14} ${tx - 20},${ty - 50} ${tx},${ty - 100} Z
              M${tx - 12},${ty} h24 v9 h-24 Z`}
        />,
      );
      parts.push(<ellipse key="hand" cx={hx} cy={hy2} rx={r * 0.34} ry={r * 0.42} />);
    }
  }
  return parts;
};

/**
 * `pump` 0..1 (e.g. a beat pulse) lifts the arms; `bob` 0..1 bounces bodies.
 * `depth` < 1 draws a farther, paler row (atmosphere in an engraving = lighter ink).
 */
export const Crowd: React.FC<{
  seed: string;
  width: number;
  count: number;
  scale?: number;
  pump?: (p: number) => number; // per-person phase -> 0..1
  bob?: (p: number) => number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ seed, width, count, scale = 1, pump = () => 0, bob = () => 0, color = C.ink, style }) => {
  const ps = people(seed, width, count);
  const hgt = 1000;
  return (
    <svg
      width={width * scale}
      height={hgt * scale}
      viewBox={`0 ${-hgt} ${width} ${hgt}`}
      style={{ position: "absolute", overflow: "visible", ...style }}
    >
      <g fill={color} color={color}>
        {ps.map((p, i) => (
          <g key={i}>{figure(p, pump(p.phase) * 70, bob(p.phase) * 14)}</g>
        ))}
        <rect x={-50} y={-6} width={width + 100} height={60} />
      </g>
    </svg>
  );
};
