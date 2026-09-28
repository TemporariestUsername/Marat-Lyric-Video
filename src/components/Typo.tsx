import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Line, Word, easeIn, easeOut, isShout, kickPulse, prog, rnd } from "../timing";
import { arrive, frameT } from "../motion";
import { Face, engraved, widthOf } from "./Kinetic";
import { C, H, W } from "../theme";
import { F } from "../fonts";

/**
 * The type toolkit (see TYPESCORE.md). Each behaviour takes a lyric line and
 * the time, and draws the words itself. Every motion is keyed to a word
 * onset, a kick or a snare; nothing is random except deterministic hashes.
 */

export type TypoProps = { ln: Line; t: number };

const onDark: React.CSSProperties = { color: C.paperLight, textShadow: `0 0 18px ${C.ink}, 0 0 6px ${C.ink}, 0 0 2px ${C.ink}` };
const inkOnPaper: React.CSSProperties = { color: C.ink, textShadow: `0 0 1px rgba(23,18,13,0.6)` };

// words laid out on one row: x offsets (px, at scale 1) and the row's width
const row = (words: Word[], face: (w: Word) => Face) => {
  const sp = (f: Face) => f.size * 0.28;
  let x = 0;
  const xs = words.map((w, i) => {
    const f = face(w);
    const at = x;
    x += widthOf(w.text, f) + (i < words.length - 1 ? sp(f) : 0);
    return at;
  });
  return { xs, width: x };
};

const Txt: React.FC<{ face: Face; x: number; y: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ face, x, y, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - face.size * 0.8,
      whiteSpace: "pre",
      fontFamily: face.family,
      fontSize: face.size,
      fontWeight: face.weight ?? 400,
      fontStyle: face.italic ? "italic" : "normal",
      lineHeight: 1,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Deterministic heat haze / ripple as an SVG filter; the seed moves with the frame. */
const Haze: React.FC<{ id: string; scale: number; freq?: string }> = ({ id, scale, freq = "0.012 0.06" }) => {
  const f = useCurrentFrame();
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <filter id={id} x="-10%" y="-30%" width="120%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={(f % 97) + 1} />
        <feDisplacementMap in="SourceGraphic" scale={scale} />
      </filter>
    </svg>
  );
};

// ---------------------------------------------------------------- T1 SET + PRINT
/**
 * "Born again nightly in the printed word": the line is set letter by letter
 * in a compositor's stick, mirrored (type is set backwards), each word as it
 * is sung. On `printAt` the platen slams: the line prints the right way round
 * on a fresh sheet. Words after that print directly.
 */
export const SetPrint: React.FC<TypoProps & { printWord?: number; y?: number }> = ({ ln, t, printWord, y = 560 }) => {
  const words = ln.words;
  const pw = printWord ?? words.findIndex((w) => /print/i.test(w.text));
  const printT = frameT(words[Math.max(0, pw)].start);
  const face: Face = { family: F.fell, size: 150 };
  const { xs, width } = row(words, () => face);
  const s = Math.min(1.2, 1760 / width);
  const x0 = W / 2 - (width * s) / 2;
  const printed = t >= printT;
  const slam = printed ? Math.exp(-(t - printT) / 0.09) : 0;
  const lead = { background: "linear-gradient(180deg, #8f8a80 0%, #cfc9bb 45%, #6d685f 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } as React.CSSProperties;
  return (
    <AbsoluteFill style={{ transform: `translateY(${slam * 18}px)` }}>
      {!printed ? (
        <>
          {/* the stick: a steel tray the letters drop into */}
          <div style={{ position: "absolute", left: x0 - 50, width: width * s + 100, top: y - face.size * s * 0.95, height: face.size * s * 1.25, background: "linear-gradient(180deg, #3b3833, #1d1b18)", borderBottom: "6px solid #8a857c", boxShadow: "0 18px 40px rgba(0,0,0,0.6)" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${y}px`, transform: `scale(${s})` }}>
            {words.map((w, i) => {
              // mirrored: the whole line reads right-to-left, each letter flipped
              const letters = [...w.text];
              let lx = 0;
              return letters.map((ch, k) => {
                const at = frameT(w.start) + k * 0.022;
                if (t < at - 0.08) return null;
                const d = easeOut(prog(t, at - 0.08, 0.08));
                const cw = widthOf(ch, face);
                const xx = W / 2 + (W / 2 - (W / 2 - (width) / 2 + xs[i] + lx)) - cw;
                lx += cw;
                return (
                  <Txt key={`${i}-${k}`} face={face} x={xx} y={y - (1 - d) * 70} style={{ ...lead, transform: "scaleX(-1)", opacity: d }}>
                    {ch}
                  </Txt>
                );
              });
            })}
          </div>
        </>
      ) : (
        <>
          {/* the sheet, just pulled: the line prints the right way round */}
          <div style={{ position: "absolute", left: x0 - 70, width: width * s + 140, top: y - face.size * s * 1.25, height: face.size * s * 1.9, background: C.paperLight, boxShadow: `0 20px 50px rgba(0,0,0,0.55)`, transform: `rotate(-0.6deg)` }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: `${W / 2}px ${y}px`, transform: `scale(${s})` }}>
            {words.map((w, i) => {
              if (i > pw && t < frameT(w.start)) return null;
              // uneven inking: each word a touch lighter or heavier
              const ink = 0.82 + 0.18 * rnd("ink", ln.id, i);
              return (
                <Txt key={i} face={face} x={W / 2 - width / 2 + xs[i]} y={y} style={{ ...inkOnPaper, opacity: ink }}>
                  {w.text}
                </Txt>
              );
            })}
          </div>
          {/* the platen: a flash of paper-white as it lifts */}
          {slam > 0.05 ? <AbsoluteFill style={{ backgroundColor: C.paperLight, opacity: slam * 0.55 }} /> : null}
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- T13 COLUMN (torch)
/** The line typeset as a newspaper column; `torch` catches fire, `column` draws the rules. */
export const TorchColumn: React.FC<TypoProps> = ({ ln, t }) => {
  const face: Face = { family: F.fell, size: 120 };
  const colX = 1060,
    colW = 780,
    top = 230;
  // greedy lines inside the column
  const lines: { w: Word; x: number; y: number }[] = [];
  let x = 0,
    y = 0;
  ln.words.forEach((w) => {
    const ww = widthOf(w.text, face);
    if (x > 0 && x + ww > colW) ((x = 0), (y += face.size * 1.12));
    lines.push({ w, x, y });
    x += ww + face.size * 0.28;
  });
  const colWord = ln.words.find((w) => /column/i.test(w.text));
  const rule = colWord ? easeOut(prog(t, frameT(colWord.start) - 0.05, 0.3)) : 1;
  const h = y + face.size * 1.4;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(14,10,7,0) 45%, rgba(14,10,7,0.78) 58%)" }} />
      {[colX - 40, colX + colW + 30].map((rx, i) => (
        <div key={i} style={{ position: "absolute", left: rx, top: top - 60, width: 4, height: (h + 60) * rule, background: C.paperLight, opacity: 0.85 }} />
      ))}
      {lines.map(({ w, x: lx, y: ly }, i) => {
        const a = arrive(t, w.start, 0.08, 0.3);
        if (!a.shown) return null;
        const torch = /torch/i.test(w.text);
        const fl = 0.75 + 0.25 * Math.sin(t * 31 + i) * Math.sin(t * 13);
        const style: React.CSSProperties = torch
          ? { color: "#ffcf7a", textShadow: `0 0 ${14 + 10 * fl}px rgba(255,140,40,${0.9 * fl}), 0 -${8 + 8 * fl}px ${24 + 16 * fl}px rgba(220,60,10,${0.7 * fl}), 0 0 3px ${C.ink}` }
          : onDark;
        return (
          <Txt key={i} face={face} x={colX + lx} y={top + ly + (1 - a.p) * 40} style={{ ...style, opacity: a.p }}>
            {w.text}
          </Txt>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- T2 NAMES
/** The header of the proscription list: the line set small-caps between rules. */
export const ListHeader: React.FC<TypoProps & { y?: number }> = ({ ln, t, y = 170 }) => {
  const face: Face = { family: F.fellSC, size: 84 };
  const { xs, width } = row(ln.words, () => face);
  const s = Math.min(1, 1600 / width);
  const rule = easeOut(prog(t, frameT(ln.words[0].start) - 0.1, 0.5));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,10,7,0.8) 0%, rgba(14,10,7,0.35) 35%, rgba(14,10,7,0) 60%)" }} />
      {[y - 70, y + 26].map((ry, i) => (
        <div key={i} style={{ position: "absolute", left: W / 2 - (width * s) / 2 - 40, top: ry, width: (width * s + 80) * rule, height: i ? 2 : 5, background: C.paperLight }} />
      ))}
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${W / 2}px ${y}px`, transform: `scale(${s})` }}>
        {ln.words.map((w, i) => {
          const a = arrive(t, w.start, 0.06, 0.3);
          return a.shown ? (
            <Txt key={i} face={face} x={W / 2 - width / 2 + xs[i]} y={y} style={{ ...onDark, opacity: a.p }}>
              {w.text}
            </Txt>
          ) : null;
        })}
      </div>
    </AbsoluteFill>
  );
};

/** hoarders! deserters! royalists! suspects!: each name joins the list, the ☞ points, red ink strikes it. */
export const NameList: React.FC<TypoProps & { header?: Line }> = ({ ln, t, header }) => {
  const face: Face = { family: F.didone, size: 124, weight: 900 };
  const x0 = 620,
    y0 = 360,
    step = 162;
  const cur = ln.words.reduce((k, w, i) => (t >= frameT(w.start) - 0.04 ? i : k), -1);
  const hand = cur >= 0 ? easeOut(prog(t, frameT(ln.words[cur].start) - 0.04, 0.08)) : 0;
  const prevY = cur > 0 ? y0 + (cur - 1) * step : y0;
  const handY = cur >= 0 ? prevY + (y0 + cur * step - prevY) * hand : y0;
  return (
    <AbsoluteFill>
      {header ? <ListHeader ln={header} t={Math.max(t, frameT(header.words[header.words.length - 1].start) + 1)} /> : null}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(14,10,7,0.1) 20%, rgba(14,10,7,0.7) 32%, rgba(14,10,7,0.7) 80%, rgba(14,10,7,0.1) 92%)" }} />
      {cur >= 0 ? (
        <Txt face={{ family: "DejaVu Sans, sans-serif", size: 110 }} x={x0 - 170} y={handY + 6} style={{ color: C.paperLight, textShadow: `0 0 8px ${C.ink}` }}>
          ☞
        </Txt>
      ) : null}
      {ln.words.map((w, i) => {
        const a = arrive(t, w.start, 0.05, 0.3);
        if (!a.shown) return null;
        const ww = widthOf(w.text, face);
        const strike = easeOut(prog(t, frameT(w.start) + 0.1, 0.16));
        const yy = y0 + i * step;
        return (
          <React.Fragment key={i}>
            <Txt face={face} x={x0} y={yy} style={{ ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }), filter: `drop-shadow(0 0 8px ${C.ink})`, transform: `scale(${1 + (1 - a.p) * 0.6})`, transformOrigin: "0% 60%", opacity: Math.min(1, a.p * 2) }}>
              {w.text}
            </Txt>
            {strike > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: x0 - 20,
                  top: yy - face.size * 0.36,
                  width: (ww + 40) * strike,
                  height: 16,
                  background: C.bloodBright,
                  borderRadius: 8,
                  transform: `rotate(${-2 + 3 * rnd("strike", i)}deg)`,
                  transformOrigin: "0% 50%",
                  boxShadow: `0 0 2px ${C.bloodDark}`,
                  opacity: 0.93,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- FALL ("so I went below")
/** The line lands along the top; on `below` it drops out of the frame, word by word, with the camera. */
export const Fall: React.FC<TypoProps> = ({ ln, t }) => {
  const face: Face = { family: F.fell, size: 130 };
  const { xs, width } = row(ln.words, () => face);
  const s = Math.min(1, 1780 / width);
  const below = ln.words.find((w) => /below/i.test(w.text)) ?? ln.words[ln.words.length - 1];
  const fallT = frameT(below.start) + 0.12;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,10,7,0.75) 0%, rgba(14,10,7,0) 40%)" }} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${W / 2}px 200px`, transform: `scale(${s})` }}>
        {ln.words.map((w, i) => {
          const a = arrive(t, w.start, 0.07, 0.3);
          if (!a.shown) return null;
          const d = Math.max(0, t - fallT - (ln.words.length - 1 - i) * 0.035);
          const fy = 0.5 * 5200 * d * d;
          const isBelow = w === below;
          return (
            <Txt
              key={i}
              face={isBelow ? { ...face, italic: true } : face}
              x={W / 2 - width / 2 + xs[i]}
              y={200 + (1 - a.p) * -40 + fy}
              style={{ ...onDark, opacity: a.p, transform: `rotate(${d * (rnd("fall", i) - 0.5) * 60}deg)` }}
            >
              {w.text}
            </Txt>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- T4 SEWER
/** Candlelit words on black water, with their reflection; the last word sinks. */
export const Sewer: React.FC<TypoProps & { waterY?: number }> = ({ ln, t, waterY = 620 }) => {
  const face: Face = { family: F.fell, size: 128, italic: true };
  const { xs, width } = row(ln.words, () => face);
  const s = Math.min(1, 1760 / width);
  const x0 = W / 2 - (width * s) / 2;
  const last = ln.words[ln.words.length - 1];
  const sink = easeIn(prog(t, frameT(last.start) + 0.35, 1.3));
  const id = `ripple-${ln.id}`;
  const words = (dim: boolean) =>
    ln.words.map((w, i) => {
      const a = arrive(t, w.start, 0.08, 0.3);
      if (!a.shown) return null;
      const dy = w === last ? sink * 150 : 0;
      return (
        <Txt key={i} face={face} x={x0 + xs[i] * s} y={waterY - 24 + dy} style={{ ...(dim ? { color: "#6b5536" } : onDark), fontSize: face.size * s, opacity: a.p }}>
          {w.text}
        </Txt>
      );
    });
  return (
    <AbsoluteFill>
      <Haze id={id} scale={14} freq="0.004 0.09" />
      {/* the water */}
      <div style={{ position: "absolute", left: 0, top: waterY, width: W, height: H - waterY, background: "linear-gradient(180deg, rgba(10,8,5,0.55), rgba(10,8,5,0.9))" }} />
      <div style={{ position: "absolute", left: 0, top: waterY - 1, width: W, height: 2, background: "rgba(255,200,130,0.35)" }} />
      {/* above the surface */}
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${H - waterY}px 0)` }}>{words(false)}</AbsoluteFill>
      {/* under it: the sinking word goes dark and soft */}
      <AbsoluteFill style={{ clipPath: `inset(${waterY}px 0 0 0)`, filter: "blur(2.5px)", opacity: 0.7 }}>{words(true)}</AbsoluteFill>
      {/* the reflection, rippling */}
      <AbsoluteFill style={{ clipPath: `inset(${waterY}px 0 0 0)` }}>
        <AbsoluteFill style={{ transform: `translateY(${2 * waterY}px) scaleY(-1)`, transformOrigin: "50% 0%", opacity: 0.32, filter: `url(#${id}) blur(1px)` }}>
          <AbsoluteFill style={{ clipPath: `inset(0 0 ${H - waterY}px 0)` }}>{words(false)}</AbsoluteFill>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- T3 FEVER (rising)
/** "came up burning": words rise out of the water, steaming; `sores` blots. */
export const Rise: React.FC<TypoProps & { waterY?: number }> = ({ ln, t, waterY = 700 }) => {
  const face: Face = { family: F.fell, size: 130 };
  const { xs, width } = row(ln.words, () => face);
  const s = Math.min(1, 1780 / width);
  const id = `heat-${ln.id}`;
  const sores = ln.words.find((w) => /sore/i.test(w.text));
  return (
    <AbsoluteFill>
      <Haze id={id} scale={9 + 8 * kickPulse(t, 0.2)} />
      <div style={{ position: "absolute", left: 0, top: waterY, width: W, height: H - waterY, background: "linear-gradient(180deg, rgba(10,8,5,0.5), rgba(10,8,5,0.9))" }} />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${W / 2}px ${waterY}px`, transform: `scale(${s})`, filter: `url(#${id})` }}>
        {ln.words.map((w, i) => {
          if (t < frameT(w.start) - 0.1) return null;
          const r = easeOut(prog(t, frameT(w.start) - 0.1, 0.45));
          const burn = /burn/i.test(w.text);
          const glow = burn ? `0 0 22px rgba(255,120,30,0.85), 0 -10px 30px rgba(200,40,10,0.6), 0 0 3px ${C.ink}` : onDark.textShadow;
          return (
            <Txt key={i} face={face} x={W / 2 - width / 2 + xs[i]} y={waterY - 40 + (1 - r) * 170} style={{ color: burn ? "#ffd08a" : C.paperLight, textShadow: glow as string, filter: `blur(${(1 - r) * 6}px)`, opacity: Math.min(1, r * 1.6) }}>
              {w.text}
            </Txt>
          );
        })}
        {/* sores: ink blots bloom around the word */}
        {sores && t >= frameT(sores.start)
          ? Array.from({ length: 7 }, (_, k) => {
              const i = ln.words.indexOf(sores);
              const bx = W / 2 - width / 2 + xs[i] + widthOf(sores.text, face) * rnd("blot", k);
              const by = waterY - 90 + 110 * rnd("bloty", k);
              const r = (18 + 40 * rnd("blotr", k)) * easeOut(prog(t, frameT(sores.start) + k * 0.05, 0.25));
              return <div key={k} style={{ position: "absolute", left: bx - r, top: by - r, width: 2 * r, height: 2 * r, borderRadius: "50%", background: `radial-gradient(circle, ${C.ink} 55%, rgba(23,18,13,0) 72%)`, opacity: 0.85 }} />;
            })
          : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- T3 FEVER (YOURS)
/** The fever builds as heat haze; the shouted word comes straight at the lens and fills the frame. */
export const Lens: React.FC<TypoProps & { heroY?: number; restY?: number; heroW?: number }> = ({ ln, t, heroY = 540, restY = 880, heroW = 0.98 }) => {
  const face: Face = { family: F.fell, size: 116 };
  const hero = ln.words.find((w) => isShout(w.text)) ?? ln.words[ln.words.length - 1];
  const rest = ln.words.filter((w) => w !== hero);
  const { xs, width } = row(rest, () => face);
  const s = Math.min(1, 1760 / width);
  const heroT = frameT(hero.start);
  const fever = prog(t, frameT(ln.words[0].start), heroT - frameT(ln.words[0].start));
  const id = `fever-${ln.id}`;
  const hit = t >= heroT;
  const hz = hit ? easeOut(prog(t, heroT - 0.02, 0.18)) : 0;
  const hf: Face = { family: F.didone, size: 300, weight: 900 };
  const hw = widthOf(hero.text, hf);
  const target = (W * heroW) / hw;
  return (
    <AbsoluteFill>
      <Haze id={id} scale={4 + 22 * fever * fever} />
      <Haze id={`${id}-hero`} scale={5 + 4 * kickPulse(t, 0.15)} freq="0.006 0.04" />
      <div style={{ position: "absolute", inset: 0, transformOrigin: `${W / 2}px ${restY}px`, transform: `scale(${s})`, filter: `url(#${id})`, opacity: 1 - hz }}>
        {rest.map((w, i) => {
          const a = arrive(t, w.start, 0.07, 0.3);
          return a.shown ? (
            <Txt key={i} face={face} x={W / 2 - width / 2 + xs[i]} y={restY} style={{ ...onDark, opacity: a.p }}>
              {w.text}
            </Txt>
          ) : null;
        })}
      </div>
      {hit ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${heroY - H / 2}px)` }}>
          <div
            style={{
              fontFamily: hf.family,
              fontWeight: 900,
              fontSize: hf.size,
              lineHeight: 1,
              whiteSpace: "nowrap",
              transform: `scale(${0.3 + (target - 0.3) * hz + 0.06 * kickPulse(t, 0.12)})`,
              ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }),
              filter: `drop-shadow(0 0 14px ${C.ink}) url(#${id}-hero)`,
            }}
          >
            {hero.text}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
