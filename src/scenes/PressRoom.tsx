import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper, cutShadow } from "../components/Paper";
import { KineticLine, engraved } from "../components/Kinetic";
import { Press } from "../silhouettes/Press";
import { Marat } from "../silhouettes/Marat";
import { arrive, camera, cameraTransform, frameT, mouth } from "../motion";
import { easeIn, easeInOut, energyAt, isShout, kickPulse, prog, sectionLines, shake } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

/**
 * Pre-chorus in the print shop. Marat, in silhouette, spits the lines; the hand
 * press behind him slams on every kick and every word; the room shakes harder
 * bar by bar and the last beat rushes the camera into the page.
 *
 * opts: section
 */
export const PressRoom: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const lines = sectionLines(scene.opts.section);
  const words = lines.flatMap((l) => l.words);

  // Platen: bottoms out on each word onset and on each kick.
  let down = 0.6 * kickPulse(t, 0.12);
  for (const w of words) {
    const o = frameT(w.start);
    if (t >= o - 0.08 && t < o) down = Math.max(down, Math.pow((t - (o - 0.08)) / 0.08, 2));
    else if (t >= o && t < o + 0.22) down = Math.max(down, 1 - (t - o) / 0.22);
  }

  const build = easeInOut(prog(t, scene.start, scene.end - scene.start));
  const rush = easeIn(prog(t, scene.end - 0.45, 0.45)); // into the chorus
  const cam = camera(t, lines[0].start, 1.5 + build * 1.5);
  const hits = words.filter((w) => isShout(w.text)).map((w) => w.start);
  const sh = shake(t, hits, 26, 0.12);
  const quake = (3 + build * build * 14) * energyAt(t);
  const tx = cam.x + sh.x + Math.sin(t * 67) * quake;
  const ty = cam.y + sh.y + Math.cos(t * 59) * quake;
  const zoom = cam.zoom * (1 + 0.1 * build + 0.6 * rush);

  const cur = lines.findIndex((l, k) => l.start - 0.2 <= t && (k + 1 >= lines.length || lines[k + 1].start - 0.2 > t));
  const wordHit = Math.max(0, ...words.map((w) => arrive(t, w.start).hit));
  const k = kickPulse(t, 0.14);

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cameraTransform({ ...cam, x: tx, y: ty, zoom, rot: cam.rot + sh.r + rush * 6 }),
          transformOrigin: "50% 50%",
          filter: rush > 0.05 ? `blur(${rush * 10}px)` : undefined,
        }}
      >
        <Paper hatch={1.2 + 0.5 * build} drift={{ x: -tx * 0.3, y: -ty * 0.3 }} />
        {/* the press, farther back, paler ink */}
        <div style={{ position: "absolute", inset: 0, transform: `translate(${-tx * 0.15}px, ${-ty * 0.15 + wordHit * 8}px)`, opacity: 0.55 }}>
          <Press down={down} width={760} style={{ left: 1180, top: 230 }} />
        </div>
        {/* Marat, singing his own words */}
        <div style={{ position: "absolute", inset: 0, filter: cutShadow, transform: `translate(${-tx * 0.4}px, ${k * 14}px)` }}>
          <Marat width={820} nod={10 * k + 8 * wordHit} jaw={mouth(t, words)} style={{ left: -120, top: 260 }} />
        </div>
        {cur >= 0 ? (
          <KineticLine
            key={lines[cur].id}
            line={lines[cur]}
            face={{ family: F.fell, size: 120 }}
            faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 170 } : undefined)}
            styleFor={(w) => (isShout(w.text) ? { ...engraved({ tint: C.ink, tile: 1, stroke: 2 }), textShadow: "none" } : { textShadow: `0 0 18px ${C.paperLight}` })}
            entrance="slam"
            entranceFor={(w, i) => (isShout(w.text) ? "slam" : i % 2 ? "drop" : "rise")}
            cx={1180}
            cy={460}
            fitW={1250}
            fitH={620}
            maxScale={2.2}
            maxRowWidth={900}
            lineHeight={1.08}
            exitAt={lines[cur + 1]?.start}
            exit="zoom"
            seed="pre"
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
