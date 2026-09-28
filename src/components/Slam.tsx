import React from "react";
import { useT } from "../time";
import { Word, rnd } from "../timing";
import { arrive, frameT } from "../motion";
import { Face, widthOf } from "./Kinetic";
import { C } from "../theme";

/**
 * Nu-metal stutter: one word at a time, full frame. Each word slams in so it
 * lands on its onset, drags two outline echoes behind it, then keeps pushing
 * toward the camera until the next word cuts it off.
 */
export const SlamWords: React.FC<{
  words: Word[];
  face: Face;
  styleFor?: (w: Word) => React.CSSProperties | undefined;
  cx?: number;
  cy?: number;
  fitW?: number;
  fitH?: number;
  until?: number;
  seed: string;
  echo?: string;
}> = ({ words, face, styleFor, cx = 960, cy = 470, fitW = 1720, fitH = 620, until = Infinity, seed, echo = C.ink }) => {
  const t = useT();
  if (t >= frameT(until)) return null;
  const lead = 0.07;
  let k = -1;
  words.forEach((w, i) => {
    if (t >= frameT(w.start) - lead) k = i;
  });
  if (k < 0) return null;
  const w = words[k];
  const next = words[k + 1];
  const a = arrive(t, w.start, lead, 0.3);
  const base = widthOf(w.text, face);
  const S = Math.min(fitW / base, fitH / (face.size * 0.8));
  const hold = Math.max(0, t - frameT(w.start));
  const push = 1 + hold * 0.12; // keeps coming at you while it holds
  const s = S * (1 + (1 - a.p) * 1.8 + a.ring * 0.05) * push;
  const rot = (rnd(seed, k, "r") - 0.5) * 14;
  const ox = (rnd(seed, k, "x") - 0.5) * 160;
  const oy = (rnd(seed, k, "y") - 0.5) * 70;
  const txt: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: 0,
    transform: "translate(-50%, -62%)",
    whiteSpace: "pre",
    fontFamily: face.family,
    fontSize: face.size,
    fontWeight: face.weight ?? 400,
    fontStyle: face.italic ? "italic" : "normal",
    lineHeight: 1.2,
    color: C.ink,
  };
  const echoes = [1.25, 1.55].map((m, i) => (
    <div
      key={i}
      style={{
        ...txt,
        color: "transparent",
        WebkitTextStroke: `${3 / s}px ${echo}`,
        transform: `translate(-50%, -62%) scale(${1 + (m - 1) * (0.4 + a.hit)})`,
        opacity: 0.45 - i * 0.18,
      }}
    >
      {w.text}
    </div>
  ));
  const gone = next ? Math.max(0, (t - (frameT(next.start) - lead)) / lead) : 0;
  return (
    <div
      style={{
        position: "absolute",
        left: cx + ox,
        top: cy + oy,
        width: 0,
        height: 0,
        transform: `rotate(${rot * (0.4 + (1 - a.p))}deg) scale(${s})`,
        opacity: Math.min(1, a.p * 3) * (1 - gone),
        filter: a.p < 1 ? `blur(${(1 - a.p) * 5}px)` : undefined,
      }}
    >
      {echoes}
      <div style={{ ...txt, ...(styleFor?.(w) ?? {}) }}>{w.text}</div>
    </div>
  );
};
