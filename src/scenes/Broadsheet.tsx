import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper, Vignette } from "../components/Paper";
import { Masthead } from "../components/Masthead";
import { Stamp, TimedLine } from "../components/Type";
import {
  BEAT,
  Line,
  beatsBetween,
  easeInOut,
  easeOut,
  energyAt,
  isShout,
  prog,
  rnd,
  sectionLines,
  shake,
} from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

const COL_X = [96, 96 + 544 + 48, 96 + 2 * (544 + 48)];
const COL_W = 544;
const COL_TOP = 318;
const COL_BOTTOM = 1040;

/** Split lines into 3 columns, front-loaded: 8 → 3/3/2. */
const toColumns = (lines: Line[]): Line[][] => {
  const per = Math.ceil(lines.length / 3);
  return [lines.slice(0, per), lines.slice(per, 2 * per), lines.slice(2 * per)];
};

/**
 * Verse page: the lyrics are set as broadsheet columns and printed word by word
 * on their sung times. Shouted (all-caps) words slam in red; lines listed in
 * `denounce` also stamp each "name!" across the page. An optional pull-quote
 * section (the pre-chorus) takes over the page centre while the columns recede
 * and the page starts to shake.
 *
 * opts: verse, pull?, issue, date, headline, mastheadIntro?, denounce?, enter?
 */
export const Broadsheet: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const o = scene.opts;
  const verse = sectionLines(o.verse);
  const pull: Line[] = o.pull ? sectionLines(o.pull) : [];
  const cols = toColumns(verse);
  const verseStart = verse[0].start;

  // Masthead printing during an instrumental lead-in: one letter every other beat.
  let reveal = 1;
  let ghostReveal = 1;
  if (o.mastheadIntro) {
    const bs = beatsBetween(scene.start, verseStart);
    const letters = 15;
    const every = Math.max(1, Math.floor((bs.length - 8) / letters));
    const printed = bs.filter((b) => b <= t).length;
    reveal = Math.min(1, Math.floor(printed / every) / letters);
    ghostReveal = prog(t, bs[Math.min(bs.length - 1, letters * every)] ?? verseStart, Math.max(0.5, verseStart - scene.start) * 0.3);
  }

  // Current line → which column the camera leans toward.
  const current = [...verse].reverse().find((l) => l.start <= t);
  const colOf = (l?: Line) => (l ? cols.findIndex((c) => c.includes(l)) : 1);
  const idx = current ? verse.indexOf(current) : -1;
  const prevCol = idx > 0 ? colOf(verse[idx - 1]) : 1;
  const curCol = current ? colOf(current) : 1;
  const lean = current ? easeInOut(prog(t, current.start, 0.6)) : 0;
  const colPos = prevCol + (curCol - prevCol) * lean;

  const pullStart = pull.length ? pull[0].start : Infinity;
  const pullP = easeOut(prog(t, pullStart - BEAT, BEAT * 2));

  // Camera: slow push-in through the verse, harder push through the pull-quote.
  const verseP = prog(t, verseStart, (pull.length ? pullStart : scene.end) - verseStart);
  const zoom = 1.0 + 0.05 * verseP + 0.12 * easeInOut(prog(t, pullStart, scene.end - pullStart));
  const panX = (1 - colPos) * 38 * (1 - pullP);

  // Shake on shouted words and denounced names; trembling during the pull-quote.
  const hits: number[] = [];
  for (const l of [...verse, ...pull]) l.words.forEach((w) => (isShout(w.text) || o.denounce?.includes(l.id)) && hits.push(w.start));
  const sh = shake(t, hits, 9);
  const tremble = pull.length && t > pullStart ? (2 + 7 * prog(t, pullStart, scene.end - pullStart)) * energyAt(t) : 0;
  const tx = sh.x + (tremble ? Math.sin(t * 71) * tremble : 0);
  const ty = sh.y + (tremble ? Math.cos(t * 53) * tremble : 0);

  // Entering on a fresh sheet (after a chorus): slapped down from below.
  const enter = o.enter ? easeOut(prog(t, scene.start, 0.32)) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <AbsoluteFill
        style={{
          transform: `translate(${tx + panX}px, ${ty + (1 - enter) * 1100}px) rotate(${sh.r + (1 - enter) * 4}deg) scale(${zoom})`,
          transformOrigin: "50% 45%",
        }}
      >
        <Paper />
        <Masthead reveal={reveal} issue={o.issue} date={o.date} />
        <div
          style={{
            position: "absolute",
            left: 96,
            right: 96,
            top: 268,
            textAlign: "center",
            fontFamily: F.didone,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: "0.06em",
            color: C.ink,
            opacity: ghostReveal,
          }}
        >
          {o.headline}
        </div>
        {/* columns */}
        <div style={{ opacity: 1 - pullP * 0.72, filter: pullP > 0 ? `blur(${pullP * 2.2}px)` : undefined }}>
          {cols.map((col, ci) => (
            <div
              key={ci}
              style={{
                position: "absolute",
                left: COL_X[ci],
                top: COL_TOP,
                width: COL_W,
                height: COL_BOTTOM - COL_TOP,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {col.map((l) => {
                const past = current && l.start < current.start;
                return (
                  <TimedLine
                    key={l.id}
                    line={l}
                    mode="print"
                    shoutMode="slam"
                    style={{
                      fontFamily: F.caslon,
                      fontSize: 44,
                      lineHeight: 1.3,
                      color: C.ink,
                      marginBottom: 20,
                      textAlign: "left",
                      opacity: past ? 0.62 : 1,
                    }}
                    gap="0.25em"
                    shoutStyle={{ fontFamily: F.didone, fontWeight: 900, color: C.blood, fontSize: "1.18em", lineHeight: 1.1 }}
                    wordStyle={(tok) =>
                      o.denounce?.includes(l.id) && tok.endsWith("!")
                        ? { fontWeight: 700, fontStyle: "italic", color: C.blood }
                        : undefined
                    }
                  />
                );
              })}
              {/* the rest of the column: ghost print */}
              <div
                style={{
                  flex: 1,
                  marginTop: 6,
                  opacity: ghostReveal,
                  backgroundImage: `repeating-linear-gradient(to bottom, ${C.inkGhost} 0 9px, transparent 9px 25px)`,
                  clipPath: `inset(0 0 ${(1 - ghostReveal) * 100}% 0)`,
                }}
              />
            </div>
          ))}
          {/* column rules */}
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: COL_X[i] - 24,
                top: COL_TOP,
                width: 1.5,
                height: (COL_BOTTOM - COL_TOP) * ghostReveal,
                background: C.ink,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        {/* denounced names stamped across the page */}
        {verse
          .filter((l) => o.denounce?.includes(l.id))
          .flatMap((l) =>
            l.words
              .filter((w) => w.text.endsWith("!"))
              .map((w, k) => (
                <Stamp
                  key={l.id + k}
                  at={w.start}
                  text={w.text}
                  x={[400, 1480, 930, 1500][k % 4]}
                  y={[800, 700, 930, 930][k % 4]}
                  rot={(rnd(l.id, k) - 0.5) * 20}
                  size={96}
                  font={F.didone}
                  seed={l.id + k}
                />
              )),
          )}
        {/* pull quote (pre-chorus) */}
        {pull.length ? (
          <div
            style={{
              position: "absolute",
              left: 170,
              right: 170,
              top: 400,
              padding: "38px 60px 44px",
              background: C.paperLight,
              borderTop: `4px double ${C.ink}`,
              borderBottom: `4px double ${C.ink}`,
              boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
              opacity: pullP,
              transform: `scale(${0.94 + 0.06 * pullP})`,
            }}
          >
            {pull.map((l) => (
              <TimedLine
                key={l.id}
                line={l}
                mode="print"
                shoutMode="slam"
                style={{
                  justifyContent: "center",
                  fontFamily: F.didone,
                  fontStyle: "italic",
                  fontSize: 62,
                  lineHeight: 1.25,
                  color: C.ink,
                }}
                shoutStyle={{ fontStyle: "normal", fontWeight: 900, color: C.blood, fontSize: "1.2em" }}
              />
            ))}
          </div>
        ) : null}
      </AbsoluteFill>
      <Vignette strength={0.5 + 0.25 * pullP} />
    </AbsoluteFill>
  );
};
