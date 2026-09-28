import React from "react";
import { AbsoluteFill } from "remotion";
import { TimeProvider, useT } from "../time";
import { Paper, Vignette } from "../components/Paper";
import { Stamp, TimedLine, TimedWord } from "../components/Type";
import { BloodDrips } from "../components/Blood";
import {
  FPS,
  Line,
  barPulse,
  beatPulse,
  easeIn,
  prog,
  rnd,
  sectionLines,
  shake,
  wordEnd,
} from "../timing";
import { C, H, W } from "../theme";
import { F } from "../fonts";
import { SceneDef, SceneProps } from "./types";

// ---------------------------------------------------------------------------
// Page shatter: the previous scene, frozen on its last frame, cut into a
// jittered grid of shards that blow outward from the centre.
const GX = 5,
  GY = 4;
const vert = (i: number, j: number, seed: string): [number, number] => {
  const x = (i / GX) * W,
    y = (j / GY) * H;
  const edgeX = i === 0 || i === GX,
    edgeY = j === 0 || j === GY;
  return [
    x + (edgeX ? 0 : (rnd(seed, i, j, "x") - 0.5) * (W / GX) * 0.7),
    y + (edgeY ? 0 : (rnd(seed, i, j, "y") - 0.5) * (H / GY) * 0.7),
  ];
};

const Shatter: React.FC<{ prev: SceneDef; at: number; seed: string }> = ({ prev, at, seed }) => {
  const t = useT();
  const p = prog(t, at, 0.85);
  if (p >= 1) return null;
  const frozen = at - 1 / FPS;
  const Prev = prev.Comp;
  const shards = [];
  for (let i = 0; i < GX; i++)
    for (let j = 0; j < GY; j++) {
      const poly = [vert(i, j, seed), vert(i + 1, j, seed), vert(i + 1, j + 1, seed), vert(i, j + 1, seed)];
      const cx = poly.reduce((a, v) => a + v[0], 0) / 4;
      const cy = poly.reduce((a, v) => a + v[1], 0) / 4;
      const dx = cx - W / 2,
        dy = cy - H / 2;
      const len = Math.hypot(dx, dy) || 1;
      const speed = 900 + rnd(seed, i, j, "s") * 900;
      const e = easeIn(p);
      const tx = (dx / len) * speed * e + (rnd(seed, i, j, "jx") - 0.5) * 60 * e;
      const ty = (dy / len) * speed * e + 500 * e * e; // gravity
      const rot = (rnd(seed, i, j, "r") - 0.5) * 70 * e;
      shards.push(
        <AbsoluteFill
          key={`${i}-${j}`}
          style={{
            clipPath: `polygon(${poly.map((v) => `${v[0]}px ${v[1]}px`).join(",")})`,
            transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${1 - 0.25 * e})`,
            transformOrigin: `${cx}px ${cy}px`,
            filter: `drop-shadow(0 0 0 black)`,
          }}
        >
          <TimeProvider t={frozen}>
            <Prev scene={prev} />
          </TimeProvider>
        </AbsoluteFill>,
      );
    }
  return <AbsoluteFill style={{ opacity: 1 - prog(p, 0.75, 0.25) }}>{shards}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
/** Splits "FIVE HUNDRED HEADS! (AMPUTATE!)" into the shout and the (stamp). */
const splitStamp = (l: Line) => {
  const i = l.words.findIndex((w) => w.text.startsWith("("));
  return i < 0 ? { main: l, stamp: null } : { main: { ...l, words: l.words.slice(0, i) }, stamp: l.words.slice(i) };
};

const fitSize = (text: string, max: number, width: number, em = 0.46) => Math.min(max, width / (text.length * em));

/**
 * Chorus: the page breaks apart. A giant numeral slams in on the first
 * downbeat, the (AMPUTATE!)/(OPERATE!) calls stamp in, a blade wipes the
 * board, and red ink bleeds down from the final headline — heavier each chorus.
 *
 * opts: section, numeral, heaviness (1..3), prev (SceneDef to shatter)
 */
export const Chorus: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const o = scene.opts;
  const [l1, l2, l3, l4] = sectionLines(o.section);
  const heavy: number = o.heaviness;
  const t0 = l1.start;

  const s1 = splitStamp(l1),
    s2 = splitStamp(l2);
  const hits = [
    ...s1.main.words.map((w) => w.start),
    ...(s1.stamp ?? []).map((w) => w.start),
    ...s2.main.words.map((w) => w.start),
    ...(s2.stamp ?? []).map((w) => w.start),
    ...l4.words.map((w) => w.start),
  ];
  const sh = shake(t, hits, 10 + heavy * 4, 0.13);

  // Numeral: slams on line 1, re-hits on line 2, breathes on every beat.
  const numIn = prog(t, t0, 0.1);
  const reHit = Math.exp(-Math.max(0, t - l2.start) / 0.15) * (t >= l2.start ? 1 : 0);
  const numScale = (numIn < 1 ? 3.2 - 2.2 * easeIn(numIn) : 1) * (1 + 0.035 * beatPulse(t, 0.15) + 0.12 * reHit);
  const numSize = fitSize(o.numeral, 640, 1780, 0.62);

  // Blade: at line 3 a diagonal cut sweeps across and clears lines 1–2.
  const bladeP = prog(t, l3.start - 0.05, 0.28);
  const cleared = easeIn(prog(t, l3.start + 0.05, 0.35));

  const glow = 0.25 + 0.35 * barPulse(t, t0, 0.35);
  const bigStyle = (l: Line): React.CSSProperties => ({
    justifyContent: "center",
    fontFamily: F.condensed,
    fontSize: fitSize(l.text.replace(/\(.*\)/, ""), 168, 1720),
    lineHeight: 1.0,
    color: C.paperLight,
    textShadow: "0 6px 0 rgba(0,0,0,0.35)",
  });

  const l4Words = l4.words;
  // two rows: "WE'RE GONNA NEED A TUB" / "FOR ALL THIS BLOOD!"
  const forAt = l4Words.findIndex((w) => w.text === "FOR");
  const l4Split = forAt > 0 ? forAt : Math.ceil(l4Words.length / 2);
  const l4Rows = [l4Words.slice(0, l4Split), l4Words.slice(l4Split)];
  const l4Size = 176;
  const L4_TOP = 300;
  // Anton caps average ~0.4em per character (incl. spaces)
  const row2W = l4Rows[1].map((w) => w.text).join(" ").length * l4Size * 0.4;
  const lastWord = l4Words[l4Words.length - 1];

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)` }}>
        {/* dark field with a red pulse from below */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 80% 60% at 50% 70%, rgba(120,12,8,${glow}) 0%, rgba(13,10,8,0) 70%)`,
          }}
        />
        {/* torn paper scraps left on the board */}
        <Paper style={{ clipPath: "polygon(0 0, 22% 0, 17% 9%, 8% 7%, 0 18%)", opacity: 0.9 }} speckle={false} />
        <Paper style={{ clipPath: "polygon(100% 100%, 76% 100%, 83% 90%, 93% 93%, 100% 78%)", opacity: 0.9 }} speckle={false} />

        {/* giant numeral */}
        {t >= t0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: H / 2 - numSize * 0.62,
              textAlign: "center",
              fontFamily: F.didone,
              fontWeight: 900,
              fontSize: numSize,
              lineHeight: 1,
              color: C.bloodDark,
              opacity: Math.min(1, numIn * 2) * (1 - 0.55 * cleared),
              transform: `scale(${numScale})`,
            }}
          >
            {o.numeral}
          </div>
        ) : null}

        {/* lines 1–2 with their stamps, cut away by the blade */}
        <AbsoluteFill
          style={{
            opacity: 1 - cleared,
            transform: `translate(${cleared * -240}px, ${cleared * 160}px) rotate(${cleared * -6}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: 100, right: 100, top: 120 }}>
            <TimedLine line={s1.main} mode="slam" style={bigStyle(l1)} gap="0.22em" />
          </div>
          <div style={{ position: "absolute", left: 100, right: 100, top: 520 }}>
            <TimedLine line={s2.main} mode="slam" style={bigStyle(l2)} gap="0.22em" />
          </div>
          {s1.stamp ? (
            <Stamp at={s1.stamp[0].start} text={s1.stamp.map((w) => w.text).join(" ")} x={1250} y={392} rot={-7} size={104} font={F.didone} color={C.bloodBright} blend="normal" seed={`${o.section}a`} />
          ) : null}
          {s2.stamp ? (
            <Stamp at={s2.stamp[0].start} text={s2.stamp.map((w) => w.text).join(" ")} x={660} y={800} rot={5} size={104} font={F.didone} color={C.bloodBright} blend="normal" seed={`${o.section}b`} />
          ) : null}
        </AbsoluteFill>

        {/* the blade */}
        {bladeP > 0 && bladeP < 1 ? (
          <div
            style={{
              position: "absolute",
              left: -400 + bladeP * (W + 800),
              top: -200,
              width: 10,
              height: H + 400,
              background: C.paperLight,
              boxShadow: `0 0 30px 8px rgba(255,240,220,0.6)`,
              transform: "rotate(24deg)",
            }}
          />
        ) : null}

        {/* the scar it leaves */}
        {bladeP >= 1 ? (
          <div
            style={{
              position: "absolute",
              left: W / 2 - 3,
              top: -200,
              width: 3,
              height: H + 400,
              background: C.blood,
              opacity: 0.8 * (1 - prog(t, l3.start + 0.3, 2.5)),
              transform: "rotate(24deg)",
            }}
          />
        ) : null}

        {/* line 3 */}
        <div style={{ position: "absolute", left: 120, right: 120, top: 150 }}>
          <TimedLine
            line={l3}
            mode="print"
            style={{ justifyContent: "center", fontFamily: F.didone, fontStyle: "italic", fontWeight: 400, fontSize: 76, color: C.paperLight }}
          />
        </div>

        {/* line 4: the headline that bleeds */}
        <div style={{ position: "absolute", left: 60, right: 60, top: L4_TOP }}>
          {l4Rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", justifyContent: "center", columnGap: "0.2em", fontFamily: F.condensed, fontSize: l4Size, lineHeight: 1.02, color: C.paperLight }}>
              {row.map((w) => {
                const i = l4Words.indexOf(w);
                const red = /BLOOD/.test(w.text);
                return (
                  <TimedWord key={i} w={w} end={wordEnd(l4, i)} mode="slam" seed={l4.id} style={{ color: red ? C.bloodBright : undefined }} />
                );
              })}
            </div>
          ))}
        </div>
        <BloodDrips
          start={l4Rows[1][0]?.start ?? l4Words[0].start}
          x0={W / 2 - row2W / 2}
          x1={W / 2 + row2W / 2}
          y={L4_TOP + l4Size * 1.02 * 2 - l4Size * 0.1}
          heaviness={heavy}
          seed={`${o.section}-h`}
          reach={300}
        />
        {heavy >= 2 ? (
          <BloodDrips start={lastWord.start} x0={0} x1={W} y={0} heaviness={heavy - 1} seed={`${o.section}-top`} reach={220 * heavy} color={C.bloodDark} />
        ) : null}
      </AbsoluteFill>

      {o.prev ? <Shatter prev={o.prev} at={t0} seed={o.section} /> : null}
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

