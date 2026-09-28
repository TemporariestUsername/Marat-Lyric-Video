import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper } from "../components/Paper";
import { Shot, Key, impactsOf } from "../components/Shot";
import { Headline } from "../components/Headline";
import { Cutout } from "../components/Cutout";
import { engraved } from "../components/Kinetic";
import { arrive, frameT, keyed } from "../motion";
import { easeIn, isShout, prog, sectionLines, shake } from "../timing";
import { BOX, MARAT_EYES, img } from "../images";
import { C, W } from "../theme";
import { F } from "../fonts";
import { SceneProps, SceneComp } from "./types";

const onPaper: React.CSSProperties = { color: C.paperLight, textShadow: `0 0 16px ${C.ink}, 0 0 5px ${C.ink}` };
const shoutStyle = { ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }), textShadow: "none" };

/**
 * Pre-chorus, two shots.
 *
 * 1. "I am the anger — the JUST anger — of the people,"
 *    The people: one slow dolly left to right along the crowd in the tribunal
 *    print; the words slide in with the dolly. On JUST, the only accent in the
 *    line, the dolly stops dead with a single shake; "of the people" carries
 *    it on to the thickest part of the crowd.
 * 2. "that's why they listen... that's why they BELIEVE..."
 *    Hard cut to Marat. Every word is one step closer to his face (a step
 *    zoom landing on each onset). On BELIEVE his head jerks back once; the room
 *    darkens and the camera pushes into his eye, into the tear of the chorus.
 */
export const PressRoom: SceneComp = ({ scene }) => {
  const t = useT();
  const [l1, l2] = sectionLines(scene.opts.section);
  const just = l1.words.find((w) => w.text === "JUST") ?? l1.words[0];
  const believe = l2.words[l2.words.length - 1];

  // shot 1: the dolly along the crowd
  const keys1: Key[] = [
    { at: scene.start, box: BOX.crowd.left },
    { at: just.start, box: BOX.crowd.mid, ease: "dolly", impact: true },
    { at: l1.words[l1.words.length - 1].start, box: BOX.crowd.right, ease: "glide" },
  ];

  // shot 2: step closer on every word, then into the eye
  const cutTo2 = frameT(l2.start);
  const steps = l2.words.map((w, i) => ({ t: w.start, v: Math.pow(1.12, i + 1) }));
  // the steps land on the words; underneath, a steady push keeps the tension building
  const zoom = keyed(t, [{ t: cutTo2 - 1, v: 1 }, ...steps], 0.12) * (1 + 0.05 * Math.max(0, t - cutTo2));
  const dive = easeIn(prog(t, frameT(believe.start) + 0.35, scene.end - (frameT(believe.start) + 0.35)));
  const jerk = arrive(t, believe.start, 0.05, 0.4);
  const eyesX = 470,
    eyesY = 400;
  const cutH = 1080;
  const c = img("marat_geneve").cut!;
  const cutW = (c.w / c.h) * cutH;

  const sh = shake(t, [...impactsOf(keys1), believe.start], 20, 0.12);

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        {t < cutTo2 ? (
          <>
            <Shot id="fouquier_tribunal" keys={keys1} dim={0.35} creep={0.045} />
            <Headline
              line={l1}
              face={{ family: F.fell, size: 110 }}
              faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 150 } : undefined)}
              styleFor={(w) => (isShout(w.text) ? shoutStyle : onPaper)}
              rows={[l1.words.findIndex((w) => w.text === "the" && l1.words.indexOf(w) > 3)]}
              cx={W / 2}
              cy={250}
              fitW={1700}
              fitH={380}
              dir={[1, 0]}
            />
          </>
        ) : (
          <>
            <Paper hatch={1.8} tint={C.ink} tintOpacity={0.55} />
            {/* Marat, scaled about his eyes: the step zoom and the dive */}
            <AbsoluteFill
              style={{
                transform: `scale(${zoom * (1 + dive * 5)})`,
                transformOrigin: `${eyesX}px ${eyesY}px`,
              }}
            >
              <Cutout
                id="marat_geneve"
                height={cutH}
                x={eyesX - (MARAT_EYES.x - 0.5) * cutW}
                y={eyesY + (1 - MARAT_EYES.y) * cutH}
                nod={jerk.shown ? 7 * jerk.hit : 0}
              />
            </AbsoluteFill>
            <AbsoluteFill style={{ backgroundColor: C.night, opacity: 0.15 + 0.3 * prog(t, cutTo2, believe.start - cutTo2) + 0.55 * dive }} />
            <div style={{ opacity: 1 - dive }}>
              <Headline
                line={l2}
                face={{ family: F.fell, size: 130 }}
                faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 190 } : undefined)}
                styleFor={(w) => (isShout(w.text) ? shoutStyle : onPaper)}
                rows={[4, l2.words.length - 1]}
                lineHeight={1.05}
                cx={1370}
                cy={600}
                fitW={1050}
                fitH={640}
                dir={[-1, 0]}
              />
            </div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

PressRoom.cues = () => ({});

