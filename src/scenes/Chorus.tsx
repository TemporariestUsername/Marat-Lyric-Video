import React from "react";
import { AbsoluteFill } from "remotion";
import { TimeProvider, useT } from "../time";
import { Paper, cutShadow } from "../components/Paper";
import { KineticLine, engraved, layoutLine, wordBoxes } from "../components/Kinetic";
import { Stamp } from "../components/Stamp";
import { BloodDrips } from "../components/Blood";
import { Crowd } from "../silhouettes/Crowd";
import { Blade } from "../silhouettes/Guillotine";
import { arrive, camera, cameraTransform, depart, frameT } from "../motion";
import { FPS, Line, beatPulse, barPulse, easeIn, easeOut, prog, rnd, sectionLines, shake } from "../timing";
import { C, H, W } from "../theme";
import { F } from "../fonts";
import { SceneDef, SceneProps } from "./types";

// ---------------------------------------------------------------------------
// Tear-in: the previous page, frozen, rips down a jagged line and the halves
// are flung apart on the first shout.
const tearLine = (seed: string) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const y = (i / 14) * H;
    pts.push([W / 2 + (rnd(seed, i) - 0.5) * 140 + (i % 2 ? 22 : -22), y]);
  }
  return pts;
};

const TearIn: React.FC<{ prev: SceneDef; at: number; seed: string }> = ({ prev, at, seed }) => {
  const t = useT();
  const o = frameT(at);
  if (t >= o + 0.5) return null;
  const e = t < o ? 0 : easeOut(prog(t, o, 0.45));
  const pts = tearLine(seed);
  const left = [[0, 0], ...pts, [0, H]].map((p) => `${p[0]}px ${p[1]}px`).join(",");
  const right = [[W, 0], ...pts, [W, H]].map((p) => `${p[0]}px ${p[1]}px`).join(",");
  const Prev = prev.Comp;
  const half = (clip: string, dir: 1 | -1) => (
    <AbsoluteFill
      style={{
        clipPath: `polygon(${clip})`,
        transform: `translate(${dir * e * 1150}px, ${e * e * 260}px) rotate(${dir * e * 14}deg)`,
        transformOrigin: dir < 0 ? "0% 100%" : "100% 100%",
        filter: "drop-shadow(0 0 14px rgba(0,0,0,0.6))",
      }}
    >
      <TimeProvider t={Math.min(t, o - 1 / FPS)}>
        <Prev scene={prev} />
      </TimeProvider>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill>
      {half(left, -1)}
      {half(right, 1)}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
const splitStamp = (l: Line) => {
  const i = l.words.findIndex((w) => w.text.startsWith("("));
  return { main: i < 0 ? l.words.map((_, k) => k) : l.words.map((_, k) => k).slice(0, i), stamp: i < 0 ? null : l.words.slice(i) };
};

const shout = { family: F.didone, size: 150, weight: 900 };
const halo: React.CSSProperties = { textShadow: `0 0 22px ${C.paperLight}, 0 0 8px ${C.paperLight}` };

/**
 * Chorus: the page tears open onto the crowd. A giant engraved numeral lands on
 * the first shout and pumps with the bar; the hook builds word by word, the
 * (AMPUTATE!)/(OPERATE!) calls stamp in blood; the guillotine blade drops on
 * "blade" and cuts the board in two; the headline lands and bleeds.
 *
 * opts: section, numeral, heaviness (1..3), prev (SceneDef to tear)
 */
export const Chorus: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const o = scene.opts;
  const [l1, l2, l3, l4] = sectionLines(o.section);
  const heavy: number = o.heaviness;
  const t0 = l1.start;
  const s1 = splitStamp(l1),
    s2 = splitStamp(l2);
  const bladeWord = l3.words.find((w) => /blade/i.test(w.text)) ?? l3.words[0];
  const cut = frameT(bladeWord.start);
  const bloodWord = l4.words[l4.words.length - 1];

  // Every shouted word is a hit: camera kick + crowd thrust.
  const shoutHits = [...l1.words, ...l2.words, ...l4.words].map((w) => w.start);
  const sh = shake(t, [...shoutHits, cut], 14 + heavy * 4, 0.12);
  const cam = camera(t, t0, 1.6);
  const kick = Math.max(0, ...shoutHits.map((h) => arrive(t, h).hit));

  // crowd: arms pump on each beat (staggered), thrust on every shout
  const pump = (ph: number) => Math.min(1, beatPulse(t - ph * 0.1, 0.22) * 0.7 + kick * (0.6 + 0.4 * ph));
  const bob = (ph: number) => beatPulse(t - ph * 0.12, 0.2);

  // numeral: lands on the first shout, re-hits on line 2, pumps on the bar
  const na = arrive(t, t0, 0.14, 0.5);
  const reHit = arrive(t, l2.start, 0.1, 0.4);
  const numScale = (na.shown ? 1 + (1 - na.p) * 2.2 + na.ring * 0.05 : 0) * (1 + 0.05 * barPulse(t, t0, 0.3) + 0.1 * reHit.hit);
  const numSize = Math.min(620, 1800 / (o.numeral.length * 0.62));

  // the blade: its edge crosses frame centre ON the word "blade"
  const bladeY = (tt: number) => -900 + ((tt - (cut - 0.18)) / 0.36) * (H + 1400);
  const bladeOn = t > cut - 0.2 && t < cut + 0.25;
  const fall = t >= cut ? easeIn(prog(t, cut, 0.9)) : 0;

  // when line 3 starts the board steps back to make room
  const recede = easeOut(prog(t, l3.start - 0.12, 0.3));
  const cutLayer = (children: React.ReactNode, key: string) => {
    // after the cut the board splits along the blade's diagonal and the halves drop away
    if (t < cut) return <AbsoluteFill key={key}>{children}</AbsoluteFill>;
    const a = `polygon(0 0, 100% 0, 100% 38%, 0 62%)`;
    const b = `polygon(0 62%, 100% 38%, 100% 100%, 0 100%)`;
    return (
      <React.Fragment key={key}>
        <AbsoluteFill style={{ clipPath: a, transform: `translate(${-fall * 300}px, ${-fall * 120}px) rotate(${-fall * 8}deg)`, opacity: 1 - fall }}>
          {children}
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: b, transform: `translate(${fall * 260}px, ${fall * 900}px) rotate(${fall * 10}deg)`, opacity: 1 - fall * 0.6 }}>
          {children}
        </AbsoluteFill>
      </React.Fragment>
    );
  };

  const board = (
    <>
      {na.shown ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 560 - numSize * 0.7,
            textAlign: "center",
            fontFamily: F.didone,
            fontWeight: 900,
            fontSize: numSize,
            lineHeight: 1,
            transform: `scale(${numScale})`,
            opacity: Math.min(1, na.p * 2) * 0.92,
            ...engraved({ tint: C.paperDark, tile: 2, stroke: 6, tileSize: 56 }),
          }}
        >
          {o.numeral}
        </div>
      ) : null}
      {t < frameT(l2.start) + 0.25 ? (
        <KineticLine line={l1} words={s1.main} face={shout} styleFor={() => halo} entrance="slam" cx={960} cy={300} fitW={1500} maxScale={1.6} exitAt={l2.start} exit="left" seed={o.section} />
      ) : null}
      {t >= frameT(l2.start) - 0.14 ? (
        <KineticLine line={l2} words={s2.main} face={shout} styleFor={() => halo} entrance="slam" cx={960} cy={300} fitW={1500} maxScale={1.6} seed={o.section} />
      ) : null}
      {s1.stamp && t < l2.start ? (
        <Stamp at={s1.stamp[0].start} text={s1.stamp.map((w) => w.text).join(" ")} x={1330} y={470} rot={-8} size={100} seed={`${o.section}a`} />
      ) : null}
      {s2.stamp ? (
        <Stamp at={s2.stamp[0].start} text={s2.stamp.map((w) => w.text).join(" ")} x={600} y={480} rot={6} size={100} seed={`${o.section}b`} />
      ) : null}
    </>
  );

  const l4Rows = (() => {
    const f = l4.words.findIndex((w) => w.text === "FOR");
    return [f > 0 ? f : Math.ceil(l4.words.length / 2)];
  })();
  const L4 = { face: { ...shout, size: 150 }, rows: l4Rows, lineHeight: 1.02, fitW: 1680, fitH: 420, maxScale: 1.9 };
  const L4_CY = 330;
  const l4Out = depart(t, scene.end - 0.05, 0.2);
  // drips hang from the bottom of the second headline row; heaviest under BLOOD
  const boxes = wordBoxes(layoutLine(l4, L4), frameT(bloodWord.start) + 0.3, 960, L4_CY);
  const row2 = boxes.filter((b) => b.i >= l4Rows[0]);
  const bloodBox = boxes[boxes.length - 1];

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: cameraTransform({ ...cam, x: cam.x + sh.x, y: cam.y + sh.y, rot: cam.rot + sh.r, zoom: cam.zoom * (1 + kick * 0.025) }) }}>
        <Paper hatch={1.5} tint={C.paperDark} tintOpacity={0.35} drift={{ x: -cam.x * 0.4, y: -cam.y * 0.4 }} />

        {/* the board: numeral, the hook, the stamps — cut in two by the blade */}
        {t < cut + 0.9 ? (
          <AbsoluteFill style={{ transform: `translateY(${-recede * 110}px) scale(${1 - recede * 0.22})`, opacity: 1 - recede * 0.35 }}>
            {cutLayer(board, "board")}
          </AbsoluteFill>
        ) : null}

        {/* crowd, three depths */}
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x * 0.3}px, 0)` }}>
          <Crowd seed={`${o.section}-back`} width={2600} count={22} scale={0.5} color="rgba(23,18,13,0.42)" style={{ left: -220, top: H - 470 }} pump={pump} bob={bob} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-cam.x * 0.6}px, 0)` }}>
          <Crowd seed={`${o.section}-mid`} width={2600} count={17} scale={0.62} color="rgba(23,18,13,0.72)" style={{ left: -300, top: H - 560 }} pump={pump} bob={bob} />
        </div>
        <div style={{ position: "absolute", inset: 0, filter: cutShadow, transform: `translate(${-cam.x}px, 0)` }}>
          <Crowd seed={`${o.section}-front`} width={2400} count={11} scale={0.8} style={{ left: -200, top: H - 720 }} pump={pump} bob={bob} />
        </div>

        {/* line 3 falls in over the cut */}
        {t >= l3.start - 0.2 && t < l4.start + 0.3 ? (
          <KineticLine
            line={l3}
            face={{ family: F.fell, size: 104, italic: true }}
            styleFor={() => halo}
            entrance="drop"
            cx={960}
            cy={520}
            fitW={1500}
            maxScale={1.4}
            exitAt={l4.start}
            exit="up"
            seed={o.section}
          />
        ) : null}

        {/* the headline, and the blood */}
        <div style={{ position: "absolute", inset: 0, opacity: 1 - l4Out }}>
          <BloodDrips
            start={frameT(bloodWord.start)}
            x0={row2[0].x0 + 20}
            x1={bloodBox.x0 - 10}
            y={row2[0].baseline + 4}
            heaviness={heavy * 0.5}
            seed={`${o.section}-row`}
            reach={200}
            bar={false}
          />
          <BloodDrips
            start={frameT(bloodWord.start)}
            x0={bloodBox.x0 + 10}
            x1={bloodBox.x1 - 10}
            y={bloodBox.baseline + 4}
            heaviness={heavy + 1}
            seed={`${o.section}-h`}
            reach={380}
            bar={false}
          />
          {heavy >= 2 ? <BloodDrips start={frameT(bloodWord.start)} x0={0} x1={W} y={0} heaviness={heavy - 1} seed={`${o.section}-top`} reach={240 * heavy} color={C.bloodDark} bar={false} /> : null}
          <KineticLine
            line={l4}
            {...L4}
            styleFor={(w) => (/BLOOD/.test(w.text) ? { ...engraved({ tint: C.bloodBright, ink: C.bloodDark, tile: 1, stroke: 3 }), textShadow: "none" } : halo)}
            entrance="slam"
            cx={960}
            cy={L4_CY}
            seed={o.section}
          />
        </div>

        {bladeOn ? (
          <div style={{ position: "absolute", inset: 0, filter: cutShadow }}>
            <Blade width={760} gleam={0.7} style={{ left: 960 - 380, top: bladeY(t) - 760 * 1.3 * 0.8 }} />
          </div>
        ) : null}
      </AbsoluteFill>
      {o.prev ? <TearIn prev={o.prev} at={t0} seed={o.section} /> : null}
    </AbsoluteFill>
  );
};
