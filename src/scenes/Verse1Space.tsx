import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Stage, Obj, Word3D, Plane, Rect, LookKey, lookAt, V3 } from "../components/Space";
import { Face, engraved, widthOf } from "../components/Kinetic";
import { frameT } from "../motion";
import { Line, easeIn, easeOut, isShout, kickPulse, prog, rnd, sectionLines, shake } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneComp } from "./types";

/**
 * Verse 1 as ONE camera move through a world of type (TYPESCORE.md):
 *  A  the composing stick: metal letters tumble in mirrored; the sheet slams on "printed"
 *  B  a newspaper column standing in the dark; "torch" leaps off it burning
 *  C  the proscription list: the names fly in from the dark and are struck through
 *  D  looking straight down a shaft: "so I went below" and the words fall away
 *  E  the sewer: words standing on black water, reflected; "shadow" sinks
 *  F  "came up burning": the words rise out of the water, the camera rises with them
 *  G  a corridor of words to Marat's face; YOURS rushes the lens
 * Every key is a word onset from timing.json.
 */

const L = sectionLines("verse1");
const on = (l: Line, re: RegExp) => l.words.find((w) => re.test(w.text)) ?? l.words[0];
const T = (l: Line, i = 0) => frameT(l.words[Math.min(i, l.words.length - 1)].start);
const inkShadow = `0 0 16px ${C.ink}, 0 0 5px ${C.ink}`;

// world positions of the sets
const A: V3 = [0, 0, 0],
  B: V3 = [0, 0, -7000],
  Cc: V3 = [0, 0, -14000],
  D: V3 = [0, 0, -21000],
  E: V3 = [0, 0, -28000],
  G: V3 = [0, 0, -38000];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---- set A layout: the line in a row, mirrored in the stick
const faceA: Face = { family: F.fell, size: 150 };
const rowA = (() => {
  const l = L[0];
  let x = 0;
  const words = l.words.map((w, i) => {
    const letters = [...w.text].map((ch) => {
      const lx = x;
      x += widthOf(ch, faceA);
      return { ch, x: lx, w: widthOf(ch, faceA) };
    });
    const wx = letters[0].x;
    x += faceA.size * 0.28;
    return { w, i, letters, x: wx, width: x - wx };
  });
  return { words, width: x };
})();
const printWord = L[0].words.findIndex((w) => /print/i.test(w.text));

// ---- set E layout: one row standing on the water
const faceE = (w: { text: string }): Face => ({ family: F.fell, size: /sewer/i.test(w.text) ? 210 : 150, italic: true });
const rowE = (() => {
  let x = 0;
  const xs: number[] = [],
    ws: number[] = [];
  L[5].words.forEach((w) => {
    xs.push(x);
    ws.push(widthOf(w.text, faceE(w)));
    x += widthOf(w.text, faceE(w)) + 46;
  });
  return { xs, ws, width: x };
})();

// ---- the camera, key by key
const cam = (): LookKey[] => {
  const [l0, l1, l2, l3, l4, l5, l6, l7] = L;
  const tp = T(l0, printWord);
  const half = rowA.width / 2;
  const hit = (t: number) => t - 0.34; // leave the previous pose this long before a line lands
  return [
    // A: low and close over the right end of the stick (the mirrored line starts there), tracking left as it is set
    ...rowA.words.slice(0, printWord).map(({ w, x, width }, i) => {
      const mx = rowA.width / 2 - (x + width / 2); // mirrored: the line is set right to left
      return { t: i === 0 ? T(l0) - 0.5 : frameT(w.start) + 0.05, p: [mx + 280, -330, 820] as V3, at: [mx - 140, -110, 0] as V3, roll: i % 2 ? 3 : -3, ease: "inout" as const };
    }),
    // the slam: jolt in, then pull back square to read the sheet
    { t: tp + 0.02, p: [0, -60, 1250], at: [0, 0, 0], ease: "out" },
    { t: hit(T(l1)), p: [0, -20, 1900], at: [0, 0, 0], ease: "out" },
    // B: fly to the column, oblique from the left, dolly across it
    { t: T(l1), p: add(B, [-1100, -350, 1300]), at: add(B, [0, -250, 0]), roll: -6, ease: "inout" },
    { t: hit(T(l2)), p: add(B, [700, -150, 1500]), at: add(B, [0, 0, 0]), roll: 2, ease: "linear" },
    // C: the list, head-on, pushing in; a bank on every name
    { t: T(l2), p: add(Cc, [0, -560, 1500]), at: add(Cc, [0, -480, 0]), ease: "inout" },
    { t: T(l3, 0), p: add(Cc, [-150, -300, 1900]), at: add(Cc, [-150, -150, 0]), roll: -4, ease: "out" },
    { t: T(l3, 1), p: add(Cc, [-100, -200, 1800]), at: add(Cc, [-150, -60, 0]), roll: 4, ease: "out" },
    { t: T(l3, 2), p: add(Cc, [-50, -100, 1700]), at: add(Cc, [-150, 40, 0]), roll: -4, ease: "out" },
    { t: T(l3, 3), p: add(Cc, [0, 0, 1600]), at: add(Cc, [-150, 140, 0]), roll: 3, ease: "out" },
    { t: hit(T(l4)), p: add(Cc, [0, 0, 1350]), at: add(Cc, [-150, 150, 0]), roll: 0, ease: "linear" },
    // D: over the shaft, looking straight down; the camera follows the fall a little
    { t: T(l4), p: add(D, [0, -1500, 1]), at: add(D, [0, 0, 0]), roll: 0, ease: "inout" },
    { t: T(l4, l4.words.length - 1) + 0.1, p: add(D, [0, -1350, 1]), at: add(D, [0, 0, 0]), roll: 8, ease: "linear" },
    { t: hit(T(l5)), p: add(D, [0, -300, 1]), at: add(D, [0, 1000, 0]), roll: 25, ease: "in" },
    // E: skimming the black water beside the words
    ...l5.words.map((w, i) => {
      const x = rowE.xs[i] - rowE.width / 2 + rowE.ws[i] / 2;
      return { t: frameT(w.start) + (i === 0 ? 0 : 0.08), p: add(E, [x - 260, 130, 950]) as V3, at: add(E, [x + 160, 215, 0]) as V3, roll: -2, ease: (i === 0 ? "out" : "inout") as "out" | "inout" };
    }),
    { t: hit(T(l6)), p: add(E, [rowE.width / 2 - 200, 60, 1500]), at: add(E, [rowE.width / 2 - 300, 260, 0]), roll: 0, ease: "linear" },
    // F: rising with the words out of the water
    { t: T(l6), p: add(E, [0, 260, -350]), at: add(E, [0, 160, -1600]), ease: "out" },
    { t: hit(T(l7)), p: add(E, [0, -120, -450]), at: add(E, [0, 20, -1600]), ease: "linear" },
    // G: down the corridor of words, toward his face; YOURS rushes the lens
    { t: T(l7), p: add(G, [0, 0, 5200]), at: add(G, [0, 0, 0]), ease: "out" },
    ...l7.words.slice(0, -1).map((w, i) => ({ t: frameT(w.start), p: add(G, [0, 0, 4600 - i * 480]) as V3, at: add(G, [0, 0, 0]) as V3, roll: i % 2 ? 2 : -2, ease: "linear" as const })),
    { t: T(l7, l7.words.length - 1) + 0.12, p: add(G, [0, 0, 1350]), at: add(G, [0, 0, 0]), ease: "out" },
    { t: T(l7, l7.words.length - 1) + 2.5, p: add(G, [0, 0, 1150]), at: add(G, [0, 0, 0]), ease: "linear" },
  ];
};

// ---- a word flying in: from `from` (offset) and `rot`, landing on its onset
const fly = (t: number, onset: number, lead = 0.16) => {
  const x = prog(t, frameT(onset) - lead, lead);
  return { k: easeOut(x), shown: t >= frameT(onset) - lead, hit: t >= frameT(onset) ? Math.exp(-(t - frameT(onset)) / 0.1) : 0 };
};

const within = (t: number, a: number, b: number) => t >= a - 0.6 && t < b + 0.4;

export const Verse1Space: SceneComp = ({ scene }) => {
  const t = useT();
  const [l0, l1, l2, l3, l4, l5, l6, l7] = L;
  const pose = lookAt(cam(), t);
  const tp = T(l0, printWord);
  const hits = [tp, ...l3.words.map((w) => w.start), ...l7.words.filter((w) => isShout(w.text)).map((w) => w.start)];
  const sh = shake(t, hits, 16, 0.1);
  const end = scene.end;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <Stage cam={pose} shake={[sh.x, sh.y]}>
        {/* ---------------- A: the stick */}
        {within(t, scene.start, T(l1)) ? (
          <>
            <Obj p={add(A, [0, 200, -2600])}>
              <Plane id="encyc_casse" w={7000} crop={[0, 0, 1, 0.37]} dim={0.62} blur={2} />
            </Obj>
            {t < tp ? (
              <>
                <Obj p={add(A, [0, 10, -30])}>
                  <Rect w={rowA.width + 200} h={230} style={{ background: "linear-gradient(180deg, #4a463f, #1d1b18)", borderBottom: "10px solid #8a857c", boxShadow: "0 30px 60px rgba(0,0,0,0.7)" }} />
                </Obj>
                {rowA.words.map(({ w, letters }, i) =>
                  letters.map((lt, k) => {
                    const onset = w.start + k * 0.022;
                    const f = fly(t, onset, 0.12);
                    if (!f.shown) return null;
                    // mirrored: the line reads right to left, each sort flipped
                    const x = rowA.width / 2 - (lt.x + lt.w / 2);
                    return (
                      <Obj key={`${i}-${k}`} p={add(A, [x, -(1 - f.k) * 520, (1 - f.k) * 200])} r={[(1 - f.k) * -110, 0, (1 - f.k) * (rnd("a", i, k) - 0.5) * 60]}>
                        <Word3D text={lt.ch} face={faceA} depth={46} layers={7} mirror color="#d9d3c4" side="#5b564d" style={{ textShadow: "0 -2px 0 #f4f0e6" }} />
                      </Obj>
                    );
                  }),
                )}
              </>
            ) : (
              <>
                {/* the sheet, slammed onto the type: the line prints the right way round */}
                <Obj p={add(A, [0, 0, 20 + Math.exp(-(t - tp) / 0.05) * 900])} r={[0, 0, -0.8]}>
                  <Rect w={rowA.width + 260} h={330} style={{ background: C.paperLight, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }} />
                  {rowA.words.map(({ w, x }, i) =>
                    i > printWord && t < frameT(w.start) ? null : (
                      <Obj key={i} p={[x - rowA.width / 2 + widthOf(w.text, faceA) / 2, 0, 1]}>
                        <Word3D text={w.text} face={faceA} color={C.ink} style={{ opacity: 0.8 + 0.2 * rnd("ink", i) }} />
                      </Obj>
                    ),
                  )}
                </Obj>
              </>
            )}
          </>
        ) : null}

        {/* ---------------- B: the column */}
        {within(t, T(l1), T(l2)) ? (
          <>
            <Obj p={add(B, [600, 0, -2600])}>
              <Plane id="prise_bastille_1789" w={9000} dim={0.45} blur={2} />
            </Obj>
            <Obj p={add(B, [0, 0, -10])} r={[0, 22, 0]}>
              <Rect w={1100} h={1500} style={{ background: "rgba(232,216,180,0.08)", borderLeft: `6px solid ${C.paperLight}`, borderRight: `6px solid ${C.paperLight}`, clipPath: `inset(0 0 ${(1 - easeOut(prog(t, frameT(on(l1, /column/i).start) - 0.1, 0.4))) * 100}% 0)` }} />
              {(() => {
                const face: Face = { family: F.fell, size: 128 };
                let x = 0,
                  y = 0;
                return l1.words.map((w, i) => {
                  const ww = widthOf(w.text, face);
                  if (x > 0 && x + ww > 960) ((x = 0), (y += 150));
                  const px = -480 + x,
                    py = -560 + y;
                  x += ww + 36;
                  const f = fly(t, w.start, 0.14);
                  if (!f.shown) return null;
                  const torch = /torch/i.test(w.text);
                  const fl = 0.75 + 0.25 * Math.sin(t * 31 + i) * Math.sin(t * 13);
                  const lift = torch ? easeOut(prog(t, frameT(w.start), 0.35)) : 0;
                  return (
                    <Obj key={i} p={[px + ww / 2, py, 10 + (1 - f.k) * 900 + lift * 380]} r={[0, (1 - f.k) * -70 - lift * 22, 0]}>
                      <Word3D
                        text={w.text}
                        face={face}
                        depth={torch ? 30 : 16}
                        color={torch ? "#ffd48a" : C.paperLight}
                        side={torch ? "#7a2a08" : "#3a2f22"}
                        style={{ textShadow: torch ? `0 0 ${16 + 12 * fl}px rgba(255,140,40,${0.9 * fl}), 0 -${10 + 8 * fl}px ${30 + 16 * fl}px rgba(220,60,10,${0.75 * fl})` : inkShadow, opacity: Math.min(1, f.k * 2) }}
                      />
                    </Obj>
                  );
                });
              })()}
            </Obj>
          </>
        ) : null}

        {/* ---------------- C: the list */}
        {within(t, T(l2), T(l4)) ? (
          <>
            <Obj p={add(Cc, [0, 200, -2800])}>
              <Plane id="comite_revolutionnaire" w={9500} dim={0.55} blur={3} />
            </Obj>
            {/* the header, ruled in */}
            {(() => {
              const face: Face = { family: F.fellSC, size: 84 };
              let x = 0;
              const xs = l2.words.map((w) => {
                const a = x;
                x += widthOf(w.text, face) + 24;
                return a;
              });
              const wd = x;
              const rule = easeOut(prog(t, T(l2) - 0.1, 0.5));
              return (
                <>
                  {[-600, -480].map((ry, k) => (
                    <Obj key={k} p={add(Cc, [0, ry, 0])}>
                      <Rect w={(wd + 120) * rule} h={k ? 3 : 7} style={{ background: C.paperLight }} />
                    </Obj>
                  ))}
                  {l2.words.map((w, i) => {
                    const f = fly(t, w.start, 0.12);
                    return f.shown ? (
                      <Obj key={i} p={add(Cc, [-wd / 2 + xs[i] + widthOf(w.text, face) / 2, -540, (1 - f.k) * 500])} r={[(1 - f.k) * 90, 0, 0]}>
                        <Word3D text={w.text} face={face} style={{ textShadow: inkShadow }} />
                      </Obj>
                    ) : null;
                  })}
                </>
              );
            })()}
            {/* the names: each flies out of the dark onto its line, a hand points, red ink strikes it */}
            {l3.words.map((w, i) => {
              const face: Face = { family: F.didone, size: 150, weight: 900 };
              const f = fly(t, w.start, 0.2);
              if (!f.shown) return null;
              const y = -300 + i * 190;
              const ww = widthOf(w.text, face);
              const strike = easeOut(prog(t, frameT(w.start) + 0.1, 0.15));
              return (
                <React.Fragment key={i}>
                  <Obj p={add(Cc, [-760 + ww / 2, y, (1 - f.k) * -3000])} r={[(1 - f.k) * -80, (1 - f.k) * 40, 0]} s={1 + f.hit * 0.08}>
                    <Word3D text={w.text} face={face} depth={40} layers={8} style={{ ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }) }} />
                  </Obj>
                  {strike > 0 ? (
                    <Obj p={add(Cc, [-790 + ((ww + 60) * strike) / 2, y - 6, 30])} r={[0, 0, -2 + 4 * rnd("s", i)]}>
                      <Rect w={(ww + 60) * strike} h={22} style={{ background: C.bloodBright, borderRadius: 11 }} />
                    </Obj>
                  ) : null}
                </React.Fragment>
              );
            })}
            {(() => {
              const cur = l3.words.reduce((k, w, i) => (t >= frameT(w.start) - 0.05 ? i : k), -1);
              if (cur < 0) return null;
              const k = easeOut(prog(t, frameT(l3.words[cur].start) - 0.05, 0.1));
              const y = -300 + (cur - 1 + k) * 190;
              return (
                <Obj p={add(Cc, [-930, cur === 0 ? -300 : y, 40])}>
                  <Word3D text="☞" face={{ family: "DejaVu Sans, sans-serif", size: 140 }} depth={20} style={{ textShadow: inkShadow }} />
                </Obj>
              );
            })()}
          </>
        ) : null}

        {/* ---------------- D: the shaft (camera looks straight down) */}
        {within(t, T(l4), T(l5)) ? (
          <>
            <Obj p={add(D, [0, 6000, 0])} r={[90, 0, 0]}>
              <Plane id="carceri_drawbridge" w={11000} dim={0.35} blur={1.5} />
            </Obj>
            {(() => {
              const face: Face = { family: F.fell, size: 140 };
              let x = 0;
              const xs = l4.words.map((w) => {
                const a = x;
                x += widthOf(w.text, face) + 40;
                return a;
              });
              const wd = x;
              const below = on(l4, /below/i);
              const fallT = frameT(below.start) + 0.1;
              return l4.words.map((w, i) => {
                const f = fly(t, w.start, 0.14);
                if (!f.shown) return null;
                const d = Math.max(0, t - fallT - (l4.words.length - 1 - i) * 0.04);
                const fall = 0.5 * 9000 * d * d;
                return (
                  <Obj key={i} p={add(D, [-wd / 2 + xs[i] + widthOf(w.text, face) / 2, fall + (1 - f.k) * -600, 0])} r={[90 + d * 200 * (rnd("f", i) - 0.5), d * 90 * (rnd("g", i) - 0.5), d * 120 * (rnd("h", i) - 0.5)]}>
                    <Word3D text={w.text} face={w === below ? { ...face, italic: true } : face} depth={24} style={{ textShadow: inkShadow, opacity: Math.min(1, f.k * 2) }} />
                  </Obj>
                );
              });
            })()}
          </>
        ) : null}

        {/* ---------------- E + F: the sewer */}
        {within(t, T(l5), T(l7)) ? (
          <>
            <Obj p={add(E, [0, -300, -5200])}>
              <Plane id="carceri_smoke" w={22000} dim={0.55} blur={2} />
            </Obj>
            {/* the candle */}
            <Obj p={add(E, [-900, -80, -200])}>
              <Rect w={900} h={900} style={{ borderRadius: "50%", background: `radial-gradient(circle, rgba(255,210,140,${0.55 + 0.1 * Math.sin(t * 23) * Math.sin(t * 7)}) 0%, rgba(255,160,80,0.18) 30%, rgba(0,0,0,0) 62%)`, mixBlendMode: "screen" }} />
            </Obj>
            {/* black water */}
            <Obj p={add(E, [0, 300, -1500])} r={[90, 0, 0]}>
              <Rect w={9000} h={6000} style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(40,30,18,0.9), rgba(8,6,4,0.97) 60%)" }} />
            </Obj>
            {/* E: the words standing on the water, each reflected; the last sinks */}
            {t < T(l6) + 0.3
              ? l5.words.map((w, i) => {
                  const face = faceE(w);
                  const f = fly(t, w.start, 0.2);
                  if (!f.shown) return null;
                  const last = i === l5.words.length - 1;
                  const sink = last ? easeIn(prog(t, frameT(w.start) + 0.35, 1.1)) * 240 : 0;
                  const p = add(E, [rowE.xs[i] - rowE.width / 2 + rowE.ws[i] / 2, 300 - face.size * 0.45 + sink + (1 - f.k) * 120, 0]);
                  return (
                    <React.Fragment key={i}>
                      <Obj p={p} r={[(1 - f.k) * 70, 0, 0]} opacity={Math.min(1, f.k * 2) * (1 - sink / 360)}>
                        <Word3D text={w.text} face={face} depth={14} style={{ textShadow: `0 0 20px rgba(255,190,110,0.35), ${inkShadow}` }} />
                      </Obj>
                      <Obj p={[p[0], 300 + (300 - p[1]), p[2]]} flipY opacity={0.5 * Math.min(1, f.k * 2) * (1 - sink / 280)}>
                        <Word3D text={w.text} face={face} style={{ filter: `blur(${2 + 1.5 * Math.sin(t * 5 + i)}px)` }} />
                      </Obj>
                    </React.Fragment>
                  );
                })
              : null}
            {/* F: rising out of the water */}
            {t >= T(l6) - 0.5
              ? (() => {
                  // two rows: "came up burning" / "with a skinful of sores —"
                  const bi = l6.words.findIndex((w) => /burn/i.test(w.text));
                  const fOf = (w: { text: string }): Face => ({ family: F.fell, size: /burn/i.test(w.text) ? 240 : 140 });
                  const rows = [l6.words.slice(0, bi + 1), l6.words.slice(bi + 1)];
                  const pos = new Map<number, [number, number]>();
                  rows.forEach((rw, ri) => {
                    const ws = rw.map((w) => widthOf(w.text, fOf(w)));
                    const wd = ws.reduce((a2, b2) => a2 + b2, 0) + 40 * (rw.length - 1);
                    let x = -wd / 2;
                    rw.forEach((w, k) => {
                      pos.set(l6.words.indexOf(w), [x + ws[k] / 2, ri === 0 ? -120 : 110]);
                      x += ws[k] + 40;
                    });
                  });
                  return l6.words.map((w, i) => {
                    const face = fOf(w);
                    const r = easeOut(prog(t, frameT(w.start) - 0.3, 0.55));
                    if (t < frameT(w.start) - 0.3) return null;
                    const burn = /burn/i.test(w.text);
                    const sores = /sore/i.test(w.text);
                    const y = pos.get(i)![1] + (1 - r) * 420;
                    const fl = 0.75 + 0.25 * Math.sin(t * 29 + i) * Math.sin(t * 11);
                    return (
                      <Obj key={i} p={add(E, [pos.get(i)![0], y, -1600])} r={[(1 - r) * 60, 0, 0]}>
                        <Word3D
                          text={w.text}
                          face={face}
                          depth={20}
                          color={burn ? "#ffd48a" : C.paperLight}
                          side={burn ? "#7a2a08" : "#3a2f22"}
                          style={{
                            textShadow: burn ? `0 0 ${18 + 10 * fl}px rgba(255,130,30,0.9), 0 -12px 34px rgba(210,50,10,0.7)` : inkShadow,
                            filter: `blur(${(1 - r) * 8}px)`,
                            opacity: Math.min(1, r * 1.6),
                          }}
                        />
                        {sores
                          ? Array.from({ length: 7 }, (_, k) => {
                              const g = easeOut(prog(t, frameT(w.start) + 0.1 + k * 0.05, 0.25));
                              const rr = (20 + 44 * rnd("b", k)) * g;
                              return (
                                <div key={k} style={{ position: "absolute", left: (rnd("bx", k) - 0.5) * 360 - rr, top: (rnd("by", k) - 0.6) * 160 - rr, width: 2 * rr, height: 2 * rr, borderRadius: "50%", background: `radial-gradient(circle, ${C.ink} 55%, rgba(23,18,13,0) 72%)`, transform: "translateZ(8px)" }} />
                              );
                            })
                          : null}
                      </Obj>
                    );
                  });
                })()
              : null}
          </>
        ) : null}

        {/* ---------------- G: the corridor of words, and YOURS */}
        {within(t, T(l7), end) ? (
          <>
            <Obj p={add(G, [0, 40, -500])}>
              <Plane id="boze_marat" w={6400} crop={[0.05, 0.14, 0.95, 0.66]} dim={0.25} />
            </Obj>
            {l7.words.map((w, i) => {
              const face: Face = { family: F.fell, size: 170 };
              const f = fly(t, w.start, 0.2);
              if (!f.shown) return null;
              const heroW = l7.words.find((x) => isShout(x.text));
              const gone = heroW && !isShout(w.text) ? easeIn(prog(t, frameT(heroW.start) - 0.1, 0.15)) : 0;
              if (gone >= 1) return null;
              if (isShout(w.text)) {
                const hf: Face = { family: F.didone, size: 420, weight: 900 };
                const k = easeOut(prog(t, frameT(w.start) - 0.18, 0.2));
                return (
                  <Obj key={i} p={add(G, [0, 0, 60 + (1 - k) * -6000])} r={[0, (1 - k) * 30, 0]} s={1 + 0.05 * kickPulse(t, 0.12)}>
                    <Word3D text={w.text} face={hf} depth={90} layers={10} side="#2a2118" style={{ ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }) }} />
                  </Obj>
                );
              }
              // the words line the corridor, alternating sides, turned toward the lens
              const side = i % 2 ? 1 : -1;
              return (
                <Obj key={i} p={add(G, [side * (380 + 50 * (i % 3)), (i % 3 - 1) * 150, 4000 - i * 480 + (1 - f.k) * -1200])} r={[0, -side * 28, 0]}>
                  <Word3D text={w.text} face={face} depth={18} style={{ textShadow: inkShadow, opacity: Math.min(1, f.k * 2) * (1 - gone) }} />
                </Obj>
              );
            })}
          </>
        ) : null}
      </Stage>
      {/* dark edges */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,5,3,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};

Verse1Space.cues = () => ({ punch: 0.3 });
