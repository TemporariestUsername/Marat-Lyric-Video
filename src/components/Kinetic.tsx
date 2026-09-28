import React from "react";
import { staticFile } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { useT } from "../time";
import { Line, Word, isShout } from "../timing";
import { arrive, depart, keyed } from "../motion";
import { C } from "../theme";

export type Entrance = "slam" | "drop" | "print" | "rise" | "whip" | "fade";
export type Exit = "up" | "down" | "left" | "right" | "zoom" | "none";

export type Face = { family: string; size: number; weight?: number; italic?: boolean; spacing?: number };

const cache = new Map<string, number>();
export const widthOf = (text: string, f: Face) => {
  const key = `${text}|${f.family}|${f.size}|${f.weight}|${f.italic}|${f.spacing}`;
  let w = cache.get(key);
  if (w === undefined) {
    w = measureText({
      text,
      fontFamily: f.family,
      fontSize: f.size,
      fontWeight: String(f.weight ?? 400),
      letterSpacing: f.spacing ? `${f.spacing}em` : undefined,
      validateFontIsLoaded: false,
    }).width;
    if (f.italic) w *= 1.02;
    cache.set(key, w);
  }
  return w;
};

/** Engraved lettering: ink outline, hatch-line fill over a tint, like a cut plate. */
export const engraved = (opts: { tint?: string; ink?: string; tile?: 1 | 2 | 3; stroke?: number; tileSize?: number } = {}) => {
  const { tint = C.ink, ink = C.ink, tile = 2, stroke = 3, tileSize = 72 } = opts;
  return {
    color: "transparent",
    backgroundColor: tint,
    backgroundImage: `url(${staticFile(`tex/hatch_${tile}.png`)})`,
    backgroundSize: `${tileSize}px ${tileSize}px`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextStroke: `${stroke}px ${ink}`,
  } as React.CSSProperties;
};

type Placed = { w: Word; i: number; x: number; y: number; width: number; face: Face };

export type LayoutOpts = {
  face: Face;
  faceFor?: (w: Word, i: number) => Partial<Face> | undefined;
  rows?: number[];
  maxRowWidth?: number;
  lineHeight?: number;
  fitW?: number;
  fitH?: number;
  minScale?: number;
  maxScale?: number;
  words?: number[];
};
export type Layout = {
  placed: Placed[];
  scaleKeys: { t: number; v: number }[];
  cxKeys: { t: number; v: number }[];
  cyKeys: { t: number; v: number }[];
};

/** Lay a line out once at base size: rows centred, block centred on (0,0), plus fit keys. */
export const layoutLine = (line: Line, o: LayoutOpts): Layout => {
  const { face, faceFor, rows, maxRowWidth = 1500, lineHeight = 1.0, fitW = 1500, fitH = 700, minScale = 0.35, maxScale = 2.2 } = o;
  const idxs = o.words ?? line.words.map((_, i) => i);
  const faces = idxs.map((i) => ({ ...face, ...(faceFor?.(line.words[i], i) ?? {}) }));
  const widths = idxs.map((i, k) => widthOf(line.words[i].text, faces[k]));
  const space = face.size * 0.3;
  const rowOf: number[] = [];
  let r = 0,
    acc = 0;
  idxs.forEach((i, k) => {
    const brk = rows ? rows.includes(i) && k > 0 : acc > 0 && acc + space + widths[k] > maxRowWidth;
    if (brk) {
      r++;
      acc = 0;
    }
    acc += (acc > 0 ? space : 0) + widths[k];
    rowOf.push(r);
  });
  const nRows = r + 1;
  const rowH = face.size * lineHeight;
  const placed: Placed[] = [];
  for (let row = 0; row < nRows; row++) {
    const ks = idxs.map((_, k) => k).filter((k) => rowOf[k] === row);
    const total = ks.reduce((a2, k, j) => a2 + widths[k] + (j ? space : 0), 0);
    let x = -total / 2;
    for (const k of ks) {
      placed.push({ w: line.words[idxs[k]], i: idxs[k], x, y: (row - (nRows - 1) / 2) * rowH, width: widths[k], face: faces[k] });
      x += widths[k] + space;
    }
  }
  // fit: re-zoom and re-centre onto the words revealed so far, settling on each onset
  const scaleKeys: Layout["scaleKeys"] = [];
  const cxKeys: Layout["cxKeys"] = [];
  const cyKeys: Layout["cyKeys"] = [];
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  [...placed].sort((p, q) => p.w.start - q.w.start).forEach((p) => {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x + p.width);
    y0 = Math.min(y0, p.y - p.face.size / 2);
    y1 = Math.max(y1, p.y + p.face.size / 2);
    const sc = Math.max(minScale, Math.min(maxScale, fitW / (x1 - x0), fitH / (y1 - y0)));
    scaleKeys.push({ t: p.w.start, v: sc });
    cxKeys.push({ t: p.w.start, v: -(x0 + x1) / 2 });
    cyKeys.push({ t: p.w.start, v: -(y0 + y1) / 2 });
  });
  return { placed, scaleKeys, cxKeys, cyKeys };
};

/** Block zoom and centring offset at time t. */
export const fitAt = (L: Layout, t: number) => ({
  S: keyed(t, L.scaleKeys, 0.16),
  ox: keyed(t, L.cxKeys, 0.16),
  oy: keyed(t, L.cyKeys, 0.16),
});

/** Where each word sits on screen at time t (ignoring entrance motion): left, right, baseline. */
export const wordBoxes = (L: Layout, t: number, cx: number, cy: number) => {
  const { S, ox, oy } = fitAt(L, t);
  return L.placed.map((p) => ({
    i: p.i,
    text: p.w.text,
    x0: cx + (p.x + ox) * S,
    x1: cx + (p.x + ox + p.width) * S,
    baseline: cy + (p.y + oy + p.face.size * 0.3) * S,
  }));
};

/**
 * One lyric line, on its own, performing. Words are laid out once (so nothing
 * reflows), each enters so that it LANDS on its sung onset, and the whole block
 * re-zooms as the sentence builds so the newest words always fill the frame.
 * On `exitAt` (normally the next line's first onset) the block leaves.
 */
export const KineticLine: React.FC<{
  line: Line;
  face: Face;
  faceFor?: (w: Word, i: number) => Partial<Face> | undefined;
  styleFor?: (w: Word, i: number) => React.CSSProperties | undefined;
  entrance?: Entrance;
  entranceFor?: (w: Word, i: number) => Entrance | undefined;
  rows?: number[]; // word indices that start a new row
  maxRowWidth?: number; // greedy row breaking (base px) when rows not given
  lineHeight?: number;
  cx?: number;
  cy?: number;
  fitW?: number; // target on-screen width of the revealed words
  fitH?: number;
  minScale?: number;
  maxScale?: number;
  exitAt?: number;
  exit?: Exit;
  lead?: number;
  words?: number[]; // only render these word indices (e.g. hide a stamp handled elsewhere)
  seed?: string;
}> = ({
  line,
  face,
  faceFor,
  styleFor,
  entrance = "slam",
  entranceFor,
  rows,
  maxRowWidth = 1500,
  lineHeight = 1.0,
  cx = 960,
  cy = 540,
  fitW = 1500,
  fitH = 700,
  minScale = 0.35,
  maxScale = 2.2,
  exitAt,
  exit = "up",
  lead = 0.12,
  words: only,
  seed = "",
}) => {
  const t = useT();
  const L = layoutLine(line, { face, faceFor, rows, maxRowWidth, lineHeight, fitW, fitH, minScale, maxScale, words: only });
  const { placed } = L;
  const { S, ox, oy } = fitAt(L, t);

  // ---- exit
  const e = exitAt !== undefined ? depart(t, exitAt - 0.03, 0.2) : 0;
  if (e >= 1) return null;
  let ex = 0,
    ey = 0,
    es = 1;
  if (exit === "up") ey = -e * 900;
  if (exit === "down") ey = e * 900;
  if (exit === "left") ex = -e * 1700;
  if (exit === "right") ex = e * 1700;
  if (exit === "zoom") es = 1 + e * 3;

  return (
    <div
      style={{
        position: "absolute",
        left: cx + ex,
        top: cy + ey,
        width: 0,
        height: 0,
        transform: `scale(${S * es})`,
        filter: e > 0 ? `blur(${e * 12}px)` : undefined,
        opacity: exit === "zoom" ? 1 - e : 1,
      }}
    >
      {placed.map((p) => {
        const a = arrive(t, p.w.start, lead);
        if (!a.shown) return null;
        const mode = entranceFor?.(p.w, p.i) ?? entrance;
        const j = 0; // no random tilt: entrances are straight
        let tf = "";
        let op = 1;
        let blur = 0;
        const q = 1 - a.p;
        if (mode === "slam") {
          tf = `scale(${1 + q * 2.4 + a.ring * 0.05}) rotate(${j * 6 * q}deg)`;
          op = Math.min(1, a.p * 2.5);
          blur = q * 6;
        } else if (mode === "drop") {
          tf = `translateY(${-q * 320}px) rotate(${j * 18 * q}deg) scale(${1 + a.ring * 0.04}, ${1 - a.hit * 0.12})`;
          op = Math.min(1, a.p * 3);
        } else if (mode === "print") {
          tf = `scale(${1 + q * 0.25}, ${1 + q * 0.6 - a.hit * 0.08})`;
          op = a.p;
          blur = q * 8;
        } else if (mode === "rise") {
          tf = `translateY(${q * 260}px) rotate(${j * 10 * q}deg)`;
          op = Math.min(1, a.p * 2);
        } else if (mode === "whip") {
          tf = `translateX(${q * 700}px) skewX(${-q * 25}deg)`; // always from the right, into the reading flow
          op = Math.min(1, a.p * 2);
          blur = q * 10;
        } else {
          op = a.p;
        }
        const f = p.face;
        return (
          <div
            key={p.i}
            style={{
              position: "absolute",
              left: p.x + ox,
              top: p.y + oy - f.size * 0.62,
              width: p.width,
              whiteSpace: "pre",
              fontFamily: f.family,
              fontSize: f.size,
              fontWeight: f.weight ?? 400,
              fontStyle: f.italic ? "italic" : "normal",
              letterSpacing: f.spacing ? `${f.spacing}em` : undefined,
              lineHeight: 1.24,
              color: C.ink,
              transform: tf,
              transformOrigin: "50% 60%",
              opacity: op,
              filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
              ...(styleFor?.(p.w, p.i) ?? undefined),
            }}
          >
            {p.w.text}
          </div>
        );
      })}
    </div>
  );
};

/** Convenience: default per-word style where all-caps (shouted) words get the engraved Bodoni. */
export const shoutFace = (size: number) => (w: Word) =>
  isShout(w.text) ? { family: "'Bodoni Moda', serif", weight: 900, size: size * 1.12 } : undefined;
