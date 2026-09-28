import React from "react";
import { AbsoluteFill } from "remotion";
import { TimeProvider, useT } from "../time";
import { Paper } from "../components/Paper";
import { KineticLine, engraved, layoutLine, wordBoxes } from "../components/Kinetic";
import { SlamWords } from "../components/Slam";
import { Stamp } from "../components/Stamp";
import { BloodDrips } from "../components/Blood";
import { Montage } from "../components/Montage";
import { Cutout } from "../components/Cutout";
import { arrive, camera, cameraTransform, frameT } from "../motion";
import { FPS, Line, barPulse, easeIn, easeOut, kickPulse, kicksBetween, prog, rnd, sectionLines, shake } from "../timing";
import { C, H, W } from "../theme";
import { F } from "../fonts";
import { SceneDef, SceneProps } from "./types";

// ---------------------------------------------------------------------------
// Tear-in: the previous page rips down a jagged line and the halves are flung
// apart on the first shout.
const tearLine = (seed: string) => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 14; i++) pts.push([W / 2 + (rnd(seed, i) - 0.5) * 140 + (i % 2 ? 22 : -22), (i / 14) * H]);
  return pts;
};

const TearIn: React.FC<{ prev: SceneDef; at: number; seed: string }> = ({ prev, at, seed }) => {
  const t = useT();
  const o = frameT(at);
  if (t >= o + 0.4) return null;
  const e = t < o ? 0 : easeOut(prog(t, o, 0.32));
  const pts = tearLine(seed);
  const left = [[0, 0], ...pts, [0, H]].map((p) => `${p[0]}px ${p[1]}px`).join(",");
  const right = [[W, 0], ...pts, [W, H]].map((p) => `${p[0]}px ${p[1]}px`).join(",");
  const Prev = prev.Comp;
  const half = (clip: string, dir: 1 | -1) => (
    <AbsoluteFill
      style={{
        clipPath: `polygon(${clip})`,
        transform: `translate(${dir * e * 1250}px, ${e * e * 300}px) rotate(${dir * e * 18}deg)`,
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
  return { main: i < 0 ? l.words : l.words.slice(0, i), stamp: i < 0 ? null : l.words.slice(i) };
};

const shout = { family: F.didone, size: 200, weight: 900 };
const GORE = [
  { id: "heads_on_pikes", focus: 0 },
  { id: "vengeance_traitres" },
  { id: "punit_traitres", focus: 0 },
  { id: "sansculotte_horreurs" },
  { id: "corday_trial", focus: 0 },
  { id: "heads_on_pikes", focus: 1 },
  { id: "punit_traitres", focus: 1 },
  { id: "prise_bastille_1789" },
];
const BLADE = [
  { id: "hell_broke_loose", focus: 0 },
  { id: "supplice_louis", focus: 0 },
  { id: "guillotine_woodcut" },
  { id: "hell_broke_loose", focus: 1 },
  { id: "heads_on_pikes", focus: 0 },
  { id: "vengeance_traitres" },
  { id: "punit_traitres", focus: 0 },
];
const halo: React.CSSProperties = { textShadow: `0 0 26px ${C.paperLight}, 0 0 10px ${C.paperLight}` };

/**
 * Chorus: the page tears open onto the mob and Marat, headbanging and
 * screaming the hook. Each shouted word slams full-frame on its onset; the
 * (AMPUTATE!)/(OPERATE!) calls stamp across the whole frame in blood; the
 * guillotine blade drops on "blade" and cuts the board in two; the headline
 * slams word by word, BLOOD flashes the frame red, and the assembled headline
 * bleeds. Camera, crowd and Marat all move on the real kick and snare.
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
  const assembled = frameT(bloodWord.start) + 0.38; // cut from the giant BLOOD to the whole headline

  const allWords = [l1, l2, l3, l4].flatMap((l) => l.words);
  const shoutHits = [...l1.words, ...l2.words, ...l4.words].map((w) => w.start);
  const sh = shake(t, [...shoutHits, cut], 22 + heavy * 5, 0.1);
  const cam = camera(t, t0, 2);
  const kick = kickPulse(t, 0.12);
  const hit = Math.max(0, ...shoutHits.map((h) => arrive(t, h).hit));

  // Marat headbangs on the kick
  const nod = 9 * kickPulse(t, 0.14) + 4 * barPulse(t, t0, 0.3);

  // numeral: lands on the first shout, re-hits on line 2, pumps on the kick
  const na = arrive(t, t0, 0.1, 0.5);
  const reHit = arrive(t, l2.start, 0.08, 0.4);
  const numScale = (na.shown ? 1 + (1 - na.p) * 2.6 + na.ring * 0.06 : 0) * (1 + 0.08 * kick + 0.12 * reHit.hit);
  const numSize = Math.min(760, 1850 / (o.numeral.length * 0.6));

  // the blade: its edge crosses frame centre ON the word "blade"
  const bladeY = (tt: number) => -900 + ((tt - (cut - 0.14)) / 0.28) * (H + 1400);
  const bladeOn = t > cut - 0.16 && t < cut + 0.2;
  const fall = t >= cut ? easeIn(prog(t, cut, 0.7)) : 0;
  const recede = easeOut(prog(t, l3.start - 0.1, 0.25));

  const cutLayer = (children: React.ReactNode) => {
    if (t < cut) return <AbsoluteFill>{children}</AbsoluteFill>;
    const a = `polygon(0 0, 100% 0, 100% 38%, 0 62%)`;
    const b = `polygon(0 62%, 100% 38%, 100% 100%, 0 100%)`;
    return (
      <>
        <AbsoluteFill style={{ clipPath: a, transform: `translate(${-fall * 380}px, ${-fall * 160}px) rotate(${-fall * 12}deg)`, opacity: 1 - fall }}>
          {children}
        </AbsoluteFill>
        <AbsoluteFill style={{ clipPath: b, transform: `translate(${fall * 300}px, ${fall * 1000}px) rotate(${fall * 14}deg)`, opacity: 1 - fall * 0.6 }}>
          {children}
        </AbsoluteFill>
      </>
    );
  };

  // lines 1–2: the shout slams, then its stamp takes the whole frame
  const hook = (
    <>
      <SlamWords words={s1.main} face={shout} styleFor={() => halo} until={s1.stamp ? s1.stamp[0].start : l2.start} seed={`${o.section}1`} cy={430} />
      <SlamWords words={s2.main} face={shout} styleFor={() => halo} until={s2.stamp ? s2.stamp[0].start : l3.start} seed={`${o.section}2`} cy={430} />
      {s1.stamp && t < frameT(l2.start) - 0.07 ? (
        <Stamp at={s1.stamp[0].start} text={s1.stamp.map((w) => w.text).join(" ")} x={960} y={440} rot={-9} size={190} seed={`${o.section}a`} />
      ) : null}
      {s2.stamp && t < frameT(l3.start) + 0.3 ? (
        <Stamp at={s2.stamp[0].start} text={s2.stamp.map((w) => w.text).join(" ")} x={960} y={440} rot={7} size={200} seed={`${o.section}b`} />
      ) : null}
    </>
  );

  const numeral = na.shown ? (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 520 - numSize * 0.72,
        textAlign: "center",
        fontFamily: F.didone,
        fontWeight: 900,
        fontSize: numSize,
        lineHeight: 1,
        transform: `scale(${numScale}) rotate(${(kick - 0.3) * 2}deg)`,
        opacity: Math.min(1, na.p * 2) * 0.9,
        ...engraved({ tint: C.paperDark, tile: 2, stroke: 7, tileSize: 56 }),
      }}
    >
      {o.numeral}
    </div>
  ) : null;

  // headline: slam word by word, then the whole thing, bleeding
  const L4 = { face: { ...shout, size: 150 }, rows: [Math.max(1, l4.words.findIndex((w) => w.text === "FOR"))], lineHeight: 1.02, fitW: 1700, fitH: 430, maxScale: 1.9 };
  const L4_CY = 330;
  const boxes = wordBoxes(layoutLine(l4, L4), assembled + 0.3, 960, L4_CY);
  const row2 = boxes.filter((b) => b.i >= L4.rows[0]);
  const bloodBox = boxes[boxes.length - 1];
  const bloodStyle = { ...engraved({ tint: C.bloodBright, ink: C.bloodDark, tile: 1, stroke: 3 }), textShadow: "none" };

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cameraTransform({ ...cam, x: cam.x + sh.x, y: cam.y + sh.y, rot: cam.rot + sh.r, zoom: cam.zoom * (1 + hit * 0.05 + kick * 0.04) }),
        }}
      >
        {/* period prints, cut on every kick: heads on pikes, the lanterne, the dancing sans-culotte;
            the guillotine on the blade line; the heads again under the headline */}
        <Montage shots={GORE} cuts={kicksBetween(t0, l3.start)} start={scene.start} end={l3.start - 0.05} dim={0.3} seed={`${o.section}g`} />
        {t >= frameT(l3.start) - 0.05 ? (
          <Montage shots={BLADE} cuts={[...l3.words.map((w) => w.start), ...l4.words.map((w) => w.start)]} start={l3.start - 0.05} end={scene.end} dim={0.32} seed={`${o.section}b`} />
        ) : null}
        <Paper hatch={1.6} style={{ mixBlendMode: "multiply", opacity: 0.5 }} drift={{ x: -cam.x * 0.4, y: -cam.y * 0.4 }} />

        {t < cut + 0.7 ? (
          <AbsoluteFill style={{ transform: `translateY(${-recede * 90}px) scale(${1 - recede * 0.25})`, opacity: 1 - recede * 0.3 }}>
            {cutLayer(numeral)}
          </AbsoluteFill>
        ) : null}

        {/* Marat, cut from the 1793 portrait, headbanging */}
        <Cutout id="marat_geneve" height={900} x={300 - cam.x * 0.5} y={1150 + kick * 22} nod={-nod} scale={1 + 0.05 * hit} />

        {/* the hook (cut with the board) */}
        {t < cut + 0.7 ? <AbsoluteFill>{cutLayer(hook)}</AbsoluteFill> : null}

        {/* line 3 */}
        {t >= l3.start - 0.2 && t < l4.start + 0.3 ? (
          <KineticLine
            line={l3}
            face={{ family: F.fell, size: 112, italic: true }}
            styleFor={() => halo}
            entrance="drop"
            cx={1000}
            cy={380}
            fitW={1500}
            maxScale={1.5}
            exitAt={l4.start}
            exit="zoom"
            seed={o.section}
          />
        ) : null}

        {/* line 4: slam each word; BLOOD in red; then the whole headline, bleeding */}
        <SlamWords
          words={l4.words}
          face={shout}
          styleFor={(w) => (/BLOOD/.test(w.text) ? bloodStyle : halo)}
          until={assembled}
          seed={`${o.section}4`}
          cy={420}
          echo={C.ink}
        />
        {t >= frameT(bloodWord.start) && t < assembled ? (
          <BloodDrips start={frameT(bloodWord.start)} x0={380} x1={1540} y={560} heaviness={heavy + 1} seed={`${o.section}-giant`} reach={420} bar={false} />
        ) : null}
        {t >= assembled ? (
          <>
            <BloodDrips start={assembled} x0={row2[0].x0 + 20} x1={bloodBox.x0 - 10} y={row2[0].baseline + 4} heaviness={heavy * 0.6} seed={`${o.section}-row`} reach={220} bar={false} />
            <BloodDrips start={assembled - 0.2} x0={bloodBox.x0 + 10} x1={bloodBox.x1 - 10} y={bloodBox.baseline + 4} heaviness={heavy + 1.5} seed={`${o.section}-h`} reach={420} bar={false} />
            {heavy >= 2 ? <BloodDrips start={assembled} x0={0} x1={W} y={0} heaviness={heavy - 1} seed={`${o.section}-top`} reach={240 * heavy} color={C.bloodDark} bar={false} /> : null}
            <div style={{ position: "absolute", inset: 0, transform: `scale(${1.3 - 0.3 * easeOut(prog(t, assembled, 0.12))})` }}>
              <KineticLine line={l4} {...L4} styleFor={(w) => (/BLOOD/.test(w.text) ? bloodStyle : halo)} entrance="fade" cx={960} cy={L4_CY} seed={o.section} />
            </div>
          </>
        ) : null}

        {bladeOn ? (
          <div
            style={{
              position: "absolute",
              left: -300,
              width: W + 600,
              top: bladeY(t) - 700,
              height: 14,
              background: C.paperLight,
              boxShadow: `0 0 40px 14px rgba(255,236,200,0.7)`,
              transform: "rotate(-24deg)",
            }}
          />
        ) : null}
      </AbsoluteFill>
      {o.prev ? <TearIn prev={o.prev} at={t0} seed={o.section} /> : null}
    </AbsoluteFill>
  );
};
