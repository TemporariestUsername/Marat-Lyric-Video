import React from "react";
import { useT } from "../time";
import { Line, Word } from "../timing";
import { arrive, depart, frameT } from "../motion";
import { Face, layoutLine } from "./Kinetic";
import { C } from "../theme";

/**
 * A line set as a fixed headline that builds word by word. The layout never
 * moves: each word flies in along `dir` (the direction the camera is
 * travelling, so type and picture move together), lands on its onset, and
 * stays. On `exitAt` the whole headline leaves along the same direction.
 */
export const Headline: React.FC<{
  line: Line;
  words?: number[];
  face: Face;
  faceFor?: (w: Word, i: number) => Partial<Face> | undefined;
  styleFor?: (w: Word, i: number) => React.CSSProperties | undefined;
  rows?: number[];
  maxRowWidth?: number;
  lineHeight?: number;
  cx: number;
  cy: number;
  fitW: number;
  fitH: number;
  maxScale?: number;
  align?: "center" | "left";
  dir?: [number, number]; // entrance direction (unit-ish vector)
  exitAt?: number;
  exitDir?: [number, number];
  lead?: number;
}> = ({
  line,
  words,
  face,
  faceFor,
  styleFor,
  rows,
  maxRowWidth,
  lineHeight = 1.0,
  cx,
  cy,
  fitW,
  fitH,
  maxScale = 3,
  align = "center",
  dir = [0, 0],
  exitAt,
  exitDir,
  lead = 0.07,
}) => {
  const t = useT();
  const L = layoutLine(line, { face, faceFor, rows, maxRowWidth, lineHeight, words, fitW, fitH, minScale: 0.1, maxScale });
  // fixed layout: the final fit of the whole block
  const S = L.scaleKeys[L.scaleKeys.length - 1].v;
  const ox = L.cxKeys[L.cxKeys.length - 1].v;
  const oy = L.cyKeys[L.cyKeys.length - 1].v;
  // left alignment: shift each row so it starts at the block's left edge
  const rowLeft = new Map<number, number>();
  if (align === "left") {
    const minX = Math.min(...L.placed.map((p) => p.x));
    for (const p of L.placed) rowLeft.set(p.y, Math.min(rowLeft.get(p.y) ?? Infinity, p.x));
    for (const [y, x] of rowLeft) rowLeft.set(y, x - minX);
  }
  const e = exitAt !== undefined ? depart(t, exitAt - 0.03, 0.18) : 0;
  if (e >= 1) return null;
  const xd = exitDir ?? dir;
  // recoil: each word that lands knocks the words already standing along its entry direction
  const knock = Math.max(0, ...L.placed.map((p) => (t >= frameT(p.w.start) ? arrive(t, p.w.start, lead, 0.3).hit : 0)));
  return (
    <div
      style={{
        position: "absolute",
        left: cx + xd[0] * e * 1400 - dir[0] * knock * 22,
        top: cy + xd[1] * e * 1000 - dir[1] * knock * 22,
        width: 0,
        height: 0,
        transform: `scale(${S})`,
        filter: e > 0 ? `blur(${e * 8}px)` : undefined,
      }}
    >
      {L.placed.map((p) => {
        const a = arrive(t, p.w.start, lead, 0.3);
        if (!a.shown) return null;
        const q = 1 - a.p;
        const shift = align === "left" ? -(rowLeft.get(p.y) ?? 0) : 0;
        return (
          <div
            key={p.i}
            style={{
              position: "absolute",
              left: p.x + ox + shift,
              top: p.y + oy - p.face.size * 0.62,
              width: p.width,
              whiteSpace: "pre",
              fontFamily: p.face.family,
              fontSize: p.face.size,
              fontWeight: p.face.weight ?? 400,
              fontStyle: p.face.italic ? "italic" : "normal",
              lineHeight: 1.24,
              color: C.ink,
              opacity: Math.min(1, a.p * 2.5),
              transform: `translate(${dir[0] * q * 420}px, ${dir[1] * q * 420}px) scale(${1 + q * 1.2 + a.ring * 0.06})`,
              transformOrigin: "50% 60%",
              filter: q > 0.05 ? `blur(${q * 6}px)` : undefined,
              ...(styleFor?.(p.w, p.i) ?? {}),
            }}
          >
            {p.w.text}
          </div>
        );
      })}
    </div>
  );
};
