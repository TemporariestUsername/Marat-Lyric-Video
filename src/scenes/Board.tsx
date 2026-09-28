import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Shot, Key } from "../components/Shot";
import { Headline } from "../components/Headline";
import { SoakLayer } from "../components/Blood";
import { Face, engraved } from "../components/Kinetic";
import { frameT } from "../motion";
import { DOWNBEATS, Line, Word, easeInOut, isShout, kickPulse, prog, sectionLines, shake } from "../timing";
import { Box } from "../images";
import { C, H, W } from "../theme";
import { F } from "../fonts";
import { SceneComp, SceneDef } from "./types";
import { TypoProps } from "../components/Typo";

/**
 * A storyboarded section as data: one shot per lyric line (or per few bars in
 * an instrumental), each with a print, a camera move and a type treatment.
 * Every time comes from timing.json: line and word onsets, downbeats.
 *
 * ShotSpec
 *   line      [section, index] the lyric this shot carries (its start is the cut)
 *   bars      instead of a line: this shot lasts n bars after the previous shot
 *   img       print id; from/to boxes (fractions of the print); move = dolly|glide|hold
 *   cuts      boxes to cut to on the line's shouted words (one per shout, in order)
 *   dark      0..1 ink over the print; candle = [x, y] screen fractions of the only light
 *   soak      [from, to] blood level across the shot (0..1 of the frame height)
 *   fade      cross-dissolve in from the previous shot (seconds) instead of a cut
 *   type      print | hand | judge | whisper | tricolor | none; place = where the words sit
 *   black     no picture: type on black
 */
export type TypeKind = "print" | "hand" | "judge" | "whisper" | "tricolor" | "none";
export type ShotSpec = {
  line?: [string, number];
  bars?: number;
  img?: string;
  from?: Box;
  to?: Box;
  move?: "dolly" | "glide" | "hold";
  cuts?: Box[];
  cutOn?: "shout" | "bang"; // cut on shouted words (default) or on every word with "!"
  dark?: number;
  candle?: [number, number];
  soak?: [number, number];
  fade?: number;
  type?: TypeKind;
  place?: "top" | "bottom" | "center" | "left" | "right";
  black?: boolean;
  title?: string; // a printed card (the song title), not a lyric
  typo?: React.FC<TypoProps & Record<string, any>>; // a type behaviour draws the line instead of the headline
  typoProps?: Record<string, any>;
  parallax?: number; // depth separation of the print's layers (default 0.45 where layers exist)
  behind?: boolean; // the type sits behind the print's nearest layer
  drift?: [number, number];
};

type Resolved = ShotSpec & { start: number; end: number; ln?: Line };

const resolve = (scene: SceneDef): Resolved[] => {
  const specs: ShotSpec[] = scene.opts.shots;
  const out: Resolved[] = [];
  let t = scene.start;
  specs.forEach((s, i) => {
    let start: number;
    let ln: Line | undefined;
    if (s.line) {
      ln = sectionLines(s.line[0])[s.line[1]];
      start = i === 0 ? scene.start : ln.start - 0.08;
      t = ln.end; // an instrumental shot after this one starts when the line ends
    } else if (s.bars) {
      // cut on the downbeat nearest to `t`, and last n bars
      start = i === 0 ? scene.start : t;
    } else start = t;
    if (s.bars) {
      const k = DOWNBEATS.findIndex((d) => d >= start - 0.05);
      const endBar = DOWNBEATS[Math.min(DOWNBEATS.length - 1, (k < 0 ? DOWNBEATS.length - 1 : k) + s.bars)];
      t = endBar > start ? endBar - 0.02 : start + 2;
    }
    out.push({ ...s, start, end: 0, ln });
  });
  out.forEach((r, i) => (r.end = out[i + 1]?.start ?? scene.end));
  return out;
};

const onPic: React.CSSProperties = { color: C.paperLight, textShadow: `0 0 18px ${C.ink}, 0 0 6px ${C.ink}, 0 0 2px ${C.ink}` };
const shoutStyle = { ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }), textShadow: "none", filter: `drop-shadow(0 0 10px ${C.ink}) drop-shadow(0 0 3px ${C.ink})` };
const TRI = [C.rouge, C.blanc, C.bleu];

const typeFor = (kind: TypeKind): { face: Face; shout: Partial<Face>; style: (w: Word, i: number) => React.CSSProperties } => {
  switch (kind) {
    case "hand":
      return { face: { family: F.hand, size: 92 }, shout: { family: F.didone, weight: 900, size: 120 }, style: (w) => (isShout(w.text) ? shoutStyle : onPic) };
    case "judge":
      return { face: { family: F.pica, size: 84 }, shout: { family: F.pica, size: 84 }, style: () => onPic };
    case "whisper":
      return { face: { family: F.fell, size: 80, italic: true }, shout: { family: F.didone, weight: 900, size: 110 }, style: (w) => (isShout(w.text) ? shoutStyle : { ...onPic, opacity: 0.9 }) };
    case "tricolor":
      return {
        face: { family: F.didone, size: 120, italic: true, weight: 900 },
        shout: {},
        style: (w, i) => (/ça|ira/i.test(w.text) ? { color: TRI[i % 2 ? 0 : 2], textShadow: `0 0 3px ${C.ink}, 0 4px 14px ${C.ink}`, WebkitTextStroke: `2px ${C.paperLight}` } : onPic),
      };
    default:
      return { face: { family: F.fell, size: 104 }, shout: { family: F.didone, weight: 900, size: 150 }, style: (w) => (isShout(w.text) ? shoutStyle : onPic) };
  }
};

const PLACE: Record<string, { cx: number; cy: number; fitW: number; fitH: number }> = {
  bottom: { cx: W / 2, cy: 850, fitW: 1650, fitH: 300 },
  top: { cx: W / 2, cy: 220, fitW: 1650, fitH: 300 },
  center: { cx: W / 2, cy: H / 2, fitW: 1600, fitH: 520 },
  left: { cx: 560, cy: H / 2, fitW: 900, fitH: 700 },
  right: { cx: 1360, cy: H / 2, fitW: 900, fitH: 700 },
};

const accent = (r: ShotSpec) => (w: Word) => (r.cutOn === "bang" ? /!/.test(w.text) : isShout(w.text));

const keysFor = (r: Resolved): Key[] => {
  const from = r.from ?? [0, 0, 1, 1];
  const keys: Key[] = [{ at: r.start, box: from }];
  const shouts = r.ln ? r.ln.words.filter(accent(r)) : [];
  (r.cuts ?? []).forEach((b, i) => {
    const w = shouts[i];
    if (w) keys.push({ at: w.start, box: b, ease: "cut" });
  });
  if (r.to && r.move !== "hold") {
    const lastAt = keys[keys.length - 1].at;
    keys.push({ at: Math.max(lastAt + 0.3, r.end), box: r.to, ease: r.move === "glide" ? "glide" : "dolly" });
  }
  return keys;
};

const ShotView: React.FC<{ r: Resolved; t: number }> = ({ r, t }) => {
  const soak = r.soak ? r.soak[0] + (r.soak[1] - r.soak[0]) * easeInOut(prog(t, r.start, r.end - r.start)) : 0;
  const kind = r.type ?? "print";
  const tp = typeFor(kind);
  const pl = PLACE[r.place ?? "bottom"];
  const typeEl =
    r.ln && r.typo ? (
      <r.typo ln={r.ln} t={t} {...(r.typoProps ?? {})} />
    ) : r.ln && kind !== "none" ? (
      <Headline
        line={r.ln}
        face={tp.face}
        faceFor={(w) => (isShout(w.text) ? tp.shout : undefined)}
        styleFor={tp.style}
        maxRowWidth={pl.fitW * 1.05}
        lineHeight={1.3}
        cx={pl.cx}
        cy={pl.cy}
        fitW={pl.fitW}
        fitH={pl.fitH}
        maxScale={1.15}
        dir={kind === "hand" || kind === "whisper" || kind === "judge" ? [0, 0] : [1, 0]}
        exitAt={r.end}
      />
    ) : null;
  const behind = !!r.behind && !r.black && !!r.img;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      {!r.black && r.img ? (
        <Shot id={r.img} keys={keysFor(r)} dim={r.dark ?? 0.25} creep={0.02} parallax={r.parallax ?? 0.7} drift={r.drift} between={behind ? typeEl : undefined} />
      ) : null}
      {r.candle ? (
        <>
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${r.candle[0] * 100}% ${r.candle[1] * 100}%, rgba(14,10,7,0) 0px, rgba(14,10,7,0.2) 240px, rgba(14,10,7,0.8) 700px, rgba(14,10,7,0.95) 1200px)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(circle at ${r.candle[0] * 100}% ${r.candle[1] * 100}%, rgba(255,196,120,${0.45 + 0.08 * Math.sin(t * 23) * Math.sin(t * 7)}) 0px, rgba(255,170,90,0.14) 170px, rgba(0,0,0,0) 440px)`, mixBlendMode: "screen" }} />
        </>
      ) : null}
      {soak > 0 ? <SoakLayer level={soak} t={t} color={C.bloodBright} opacity={0.9} surge={kickPulse(t, 0.15)} /> : null}
      {r.title ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: Math.min(1, prog(t, r.start + 0.2, 0.6)) }}>
          <div style={{ fontFamily: F.didone, fontWeight: 900, fontSize: 118, color: C.paperLight, textShadow: `0 0 24px ${C.ink}`, textAlign: "center", lineHeight: 1 }}>
            {r.title.split("|")[0]}
            <div style={{ fontFamily: F.fell, fontStyle: "italic", fontWeight: 400, fontSize: 84, color: C.paperLight, marginTop: 22, textShadow: `0 0 20px ${C.bloodDark}, 0 0 6px ${C.ink}` }}>{r.title.split("|")[1]}</div>
          </div>
        </AbsoluteFill>
      ) : null}
      {behind ? null : typeEl}
    </AbsoluteFill>
  );
};

export const Board: SceneComp = ({ scene }) => {
  const t = useT();
  const shots = resolve(scene);
  const i = Math.max(0, shots.findIndex((r) => t >= r.start && t < r.end));
  const r = shots[i];
  const prev = shots[i - 1];
  const fadeK = r.fade && prev ? easeInOut(prog(t, r.start, r.fade)) : 1;
  const shouts = r.ln ? r.ln.words.filter(accent(r)).map((w) => frameT(w.start)) : [];
  const sh = shake(t, shouts, scene.opts.shake ?? 14, 0.1);
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)` }}>
        {fadeK < 1 && prev ? <ShotView r={prev} t={t} /> : null}
        <AbsoluteFill style={{ opacity: fadeK }}>
          <ShotView r={r} t={t} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

Board.cues = (scene) => ({ punch: scene.opts.punch ?? 0 });
