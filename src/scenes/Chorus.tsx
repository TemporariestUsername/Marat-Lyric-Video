import React from "react";
import { AbsoluteFill } from "remotion";
import { TimeProvider, useT } from "../time";
import { Shot, Key, impactsOf } from "../components/Shot";
import { Headline } from "../components/Headline";
import { Cut } from "../components/Cut";
import { Stamp } from "../components/Stamp";
import { BloodDrips, SoakLayer } from "../components/Blood";
import { engraved, layoutLine, wordBoxes } from "../components/Kinetic";
import { arrive, frameT } from "../motion";
import { FPS, Line, easeOut, kickPulse, kicksBetween, prog, rnd, sectionLines, shake } from "../timing";
import { BOX, Box } from "../images";
import { C, H, W } from "../theme";
import { F } from "../fonts";
import { SceneDef, SceneComp } from "./types";

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
  return { main: i < 0 ? l.words.map((_, k) => k) : l.words.map((_, k) => k).slice(0, i), stamp: i < 0 ? null : l.words.slice(i) };
};

const shout = { family: F.didone, size: 150, weight: 900 };
const onPrint: React.CSSProperties = { color: C.paperLight, textShadow: `0 0 18px ${C.ink}, 0 0 6px ${C.ink}` };
const bloodStyle: React.CSSProperties = { ...engraved({ tint: C.bloodBright, ink: C.bloodDark, tile: 1, stroke: 3 }), textShadow: "none" };
// once the frame has flooded red, BLOOD goes white-hot so it still reads
const bloodOnRed: React.CSSProperties = { color: C.paperLight, WebkitTextStroke: `3px ${C.bloodDark}`, textShadow: `0 0 24px ${C.bloodBright}` };

/** The prints and regions each chorus uses; later choruses escalate with their own. */
export type ChorusBoards = {
  count1: { id: string; boxes: [Box, Box, Box] }; // three stops: first heads, next heads, all of them
  count2: { id: string; boxes: [Box, Box, Box] }; // the repeat, travelling the other way
  blade: { id: string; top: Box; bottom: Box };
  tub: { id: string; wide: Box; tub: Box };
};
export const CHORUS1_BOARDS: ChorusBoards = {
  count1: { id: "punit_traitres", boxes: [BOX.punit.heads12, BOX.punit.heads34, BOX.punit.all] },
  count2: { id: "heads_on_pikes", boxes: [BOX.pikes1789.right, BOX.pikes1789.mid, BOX.pikes1789.cluster] },
  blade: { id: "hell_broke_loose", top: BOX.guillotine.crossbeam, bottom: BOX.guillotine.lunette },
  tub: { id: "assassinat_marat", wide: BOX.bathroom.wide, tub: BOX.bathroom.tub },
};

/**
 * Chorus, storyboarded line by line. Every move illustrates its word:
 *  1  FIVE HUNDRED HEADS!  the page tears open on the parade of heads on pikes; the
 *     camera counts them (FIVE: the first, HUNDRED: the next, HEADS!: all of them)
 *     while the tally builds 5 -> 500. (AMPUTATE!) cuts the whole frame through at
 *     neck height and wrenches the top away.
 *  2  the same count, mirrored, on the 1789 heads, seen through the wound;
 *     (OPERATE!) slams the halves together and stitches them in blood.
 *  3  Apply the blade: on the guillotine's crossbeam; on "blade" the camera drops
 *     with the blade to the lunette and stops dead; "loose the flood" lets the red in.
 *  4  WE'RE GONNA NEED A TUB: Marat's room (the 1793 assassination plate); on TUB the
 *     camera snaps onto his tub; on BLOOD it floods, and the headline bleeds.
 *
 * opts: section, numeral stages, heaviness (1..3), boards, prev (to tear)
 */
export const Chorus: SceneComp = ({ scene }) => {
  const t = useT();
  const o = scene.opts;
  const B: ChorusBoards = o.boards ?? CHORUS1_BOARDS;
  const [l1, l2, l3, l4] = sectionLines(o.section);
  const heavy: number = o.heaviness;
  const s1 = splitStamp(l1),
    s2 = splitStamp(l2);
  const m1 = s1.main.map((i) => l1.words[i]);
  const m2 = s2.main.map((i) => l2.words[i]);
  const amputate = s1.stamp ? s1.stamp[0].start : l2.start;
  const operate = s2.stamp ? s2.stamp[0].start : l3.start;
  const bladeWord = l3.words.find((w) => /blade/i.test(w.text)) ?? l3.words[0];
  const looseWord = l3.words.find((w) => /loose|spared|flood/i.test(w.text)) ?? l3.words[l3.words.length - 1];
  const tubWord = l4.words.find((w) => /TUB/.test(w.text)) ?? l4.words[0];
  const bloodWord = l4.words[l4.words.length - 1];

  // ---- the count (lines 1 and 2): cut in on the first word, snap to each next stop
  const count = (words: typeof m1, bd: ChorusBoards["count1"], side: number): Key[] => [
    { at: words[0].start, box: bd.boxes[0], ease: "cut", sx: 0.5 + side * 0.13 },
    { at: words[Math.min(1, words.length - 1)].start, box: bd.boxes[1], ease: "snap", sx: 0.5 + side * 0.13, impact: true },
    { at: words[words.length - 1].start, box: bd.boxes[2], ease: "snap", sx: 0.5 + side * 0.1, impact: true },
  ];
  // held frames cut on the kick between the framing and a tighter crop of the SAME subject
  const tighter = (b: Box, f: number): Box => {
    const cx = (b[0] + b[2]) / 2,
      cy = (b[1] + b[3]) / 2,
      hw = ((b[2] - b[0]) / 2) * f,
      hh = ((b[3] - b[1]) / 2) * f;
    return [cx - hw, cy - hh, cx + hw, cy + hh];
  };
  const onKicks = (keys: Key[], from: number, until: number): Key[] => {
    const last = keys[keys.length - 1];
    const ks = kicksBetween(from + 0.14, until - 0.06);
    return [...keys, ...ks.map((k, i) => ({ ...last, at: k, ease: "cut" as const, impact: false, box: i % 2 ? last.box : tighter(last.box, 0.8) }))];
  };
  const keysA = onKicks(count(m1, B.count1, +1), m1[m1.length - 1].start, amputate);
  const keysB = onKicks(count(m2, B.count2, -1), m2[m2.length - 1].start, operate);
  // ---- the blade
  const keysC: Key[] = [
    { at: l3.start, box: B.blade.top, ease: "cut", sx: 0.4 },
    { at: bladeWord.start, box: B.blade.bottom, ease: "drop", sx: 0.4, impact: true },
  ];
  // ---- the tub
  const keysD: Key[] = [
    { at: l4.start, box: B.tub.wide, ease: "cut" },
    { at: tubWord.start, box: B.tub.tub, ease: "snap", impact: true },
  ];
  const keysDk = onKicks(keysD, tubWord.start, bloodWord.start);

  const sh = shake(t, [...impactsOf(keysA), ...impactsOf(keysB), ...impactsOf(keysC), ...impactsOf(keysD), amputate, operate, bloodWord.start], 24 + heavy * 5, 0.11);

  // ---- the tally: builds with the words (5 -> 500), pounds on the kick
  const stages: { word: number; text: string }[] = o.numeral;
  const tally = (words: typeof m1) => {
    let text = "";
    let hitAt = -1;
    let first = true;
    let prevVal = 0;
    for (const s of stages) {
      const at = frameT(words[s.word].start);
      const val = Number(s.text.replace(/,/g, ""));
      if (t >= at) ((text = s.text), (hitAt = words[s.word].start), (first = s === stages[0]));
      else if (t >= at - 0.16 && text) {
        // the counter runs up to the next figure and lands on the word
        const x = (t - (at - 0.16)) / 0.16;
        const v = Math.round(prevVal + (val - prevVal) * x * x);
        text = s.text.includes(",") ? v.toLocaleString("en-US") : String(v);
      }
      if (t >= at) prevVal = val;
    }
    const a = arrive(t, hitAt, 0.06, 0.4);
    return {
      text,
      drop: first ? (1 - a.p) * -320 : 0, // the first figure drops in from above
      scale: (1 + (1 - a.p) * 1.2 + a.ring * 0.05) * (1 + 0.09 * kickPulse(t, 0.12)),
    };
  };

  const countShot = (keys: Key[], bd: ChorusBoards["count1"], side: number) => (
    <AbsoluteFill>
      <Shot id={bd.id} keys={keys} dim={0.3} />
      <AbsoluteFill style={{ background: `linear-gradient(${side > 0 ? 90 : 270}deg, rgba(14,10,7,0.78) 0%, rgba(14,10,7,0.5) 32%, rgba(14,10,7,0) 48%)` }} />
    </AbsoluteFill>
  );
  // the column: the tally over the stacked words, on the side the camera travels away from
  const countType = (line: Line, main: number[], words: typeof m1, side: number) => {
    const tl = tally(words);
    const colX = side > 0 ? 400 : W - 400;
    return (
      <AbsoluteFill>
        {tl.text ? (
          <div
            style={{
              position: "absolute",
              left: colX - 380,
              width: 760,
              top: 70,
              textAlign: "center",
              fontFamily: F.didone,
              fontWeight: 900,
              fontSize: 260,
              lineHeight: 1,
              transform: `translateY(${tl.drop}px) scale(${tl.scale})`,
              ...engraved({ tint: C.paperDark, ink: C.paperLight, tile: 2, stroke: 4, tileSize: 48 }),
            }}
          >
            {tl.text}
          </div>
        ) : null}
        <Headline line={line} words={main} face={shout} styleFor={() => onPrint} rows={main.slice(1)} lineHeight={0.95} cx={colX} cy={660} fitW={700} fitH={560} dir={[side, 0]} />
      </AbsoluteFill>
    );
  };

  // ---- flood: "loose the flood" lets it in; BLOOD fills the tub and the frame
  const floodL3 = t >= frameT(looseWord.start) && t < frameT(l4.start) ? 0.42 * easeOut(prog(t, looseWord.start, 0.5)) : 0;
  const floodL4 = t >= frameT(bloodWord.start) ? 0.9 * easeOut(prog(t, bloodWord.start, 0.45)) : 0;

  // ---- headline 4 geometry, for the bleeding
  const L4 = { face: { ...shout, size: 140 }, rows: [Math.max(1, l4.words.findIndex((w) => w.text === "FOR"))], lineHeight: 1.0, fitW: 1700, fitH: 400, maxScale: 3 };
  const L4_CY = 250;
  const boxes = wordBoxes(layoutLine(l4, L4), bloodWord.start + 5, W / 2, L4_CY);
  const bloodBox = boxes[boxes.length - 1];
  const row2 = boxes.filter((b) => b.i >= L4.rows[0]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px) rotate(${sh.r}deg)` }}>
        {t < frameT(l3.start) ? (
          <>
            {/* the print is the body that gets cut; the type stays whole above it */}
            <Cut at={amputate} joinAt={operate} seam={[560, 500]}>
              {t < frameT(l2.start) ? countShot(keysA, B.count1, +1) : countShot(keysB, B.count2, -1)}
            </Cut>
            {t < frameT(l2.start) ? countType(l1, s1.main, m1, +1) : countType(l2, s2.main, m2, -1)}
            {s1.stamp && t < frameT(l2.start) ? (
              <Stamp at={amputate} text={s1.stamp.map((w) => w.text).join(" ")} x={1260} y={540} rot={-1.8} size={130} seed={`${o.section}a`} />
            ) : null}
            {s2.stamp ? <Stamp at={operate} text={s2.stamp.map((w) => w.text).join(" ")} x={660} y={530} rot={-1.8} size={130} seed={`${o.section}b`} /> : null}
          </>
        ) : t < frameT(l4.start) ? (
          <>
            <Shot id={B.blade.id} keys={keysC} dim={0.25} />
            <SoakLayer level={floodL3} t={t} color={C.bloodBright} opacity={0.92} surge={kickPulse(t, 0.15)} />
            {/* the steel: a white flash on the edge as the blade lands */}
            {t >= frameT(bladeWord.start) && t < frameT(bladeWord.start) + 2 / 30 ? <AbsoluteFill style={{ backgroundColor: C.paperLight, opacity: 0.45, mixBlendMode: "screen" }} /> : null}
            <Headline
              line={l3}
              face={{ family: F.fell, size: 120, italic: true }}
              styleFor={() => onPrint}
              rows={[l3.words.findIndex((w) => /and|now/.test(w.text))]}
              cx={1330}
              cy={330 - floodL3 * 260}
              fitW={1000}
              fitH={420}
              dir={[0, 1]}
            />
          </>
        ) : (
          <>
            <Shot id={B.tub.id} keys={keysDk} dim={0.22} creep={0.03} />
            <SoakLayer level={floodL4} t={t} color={C.blood} opacity={0.88} surge={kickPulse(t, 0.15)} />
            {t >= frameT(bloodWord.start) ? (
              <>
                <BloodDrips start={frameT(bloodWord.start)} x0={row2[0].x0 + 20} x1={bloodBox.x0 - 10} y={row2[0].baseline + 4} heaviness={heavy * 0.6} seed={`${o.section}-row`} reach={200} bar={false} />
                <BloodDrips start={frameT(bloodWord.start) - 0.1} x0={bloodBox.x0 + 10} x1={bloodBox.x1 - 10} y={bloodBox.baseline + 4} heaviness={heavy + 1.5} seed={`${o.section}-h`} reach={380} bar={false} />
              </>
            ) : null}
            <Headline
              line={l4}
              {...L4}
              styleFor={(w) => (/BLOOD/.test(w.text) ? (floodL4 > 0.2 ? bloodOnRed : bloodStyle) : onPrint)}
              cx={W / 2}
              cy={L4_CY}
              dir={[0, -1]}
            />
          </>
        )}
      </AbsoluteFill>
      {o.prev ? <TearIn prev={o.prev} at={l1.start} seed={o.section} /> : null}
    </AbsoluteFill>
  );
};

/** Accents: the kick punch (the hook pounds), the tear (a rupture), the strobe on each hook's downbeat, blood on the calls and on BLOOD. */
Chorus.cues = (scene: SceneDef) => {
  const [l1, l2, , l4] = sectionLines(scene.opts.section);
  const stampOf = (l: Line) => l.words.filter((w) => w.text.startsWith("(")).map((w) => w.start);
  return {
    punch: 0.8, // the hook pounds on the kick
    glitches: [l1.start],
    strobes: [l1.start, l2.start],
    flashes: [...stampOf(l1), ...stampOf(l2), l4.words[l4.words.length - 1].start],
  };
};

