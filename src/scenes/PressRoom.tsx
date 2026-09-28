import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper, cutShadow } from "../components/Paper";
import { KineticLine, engraved } from "../components/Kinetic";
import { Press } from "../silhouettes/Press";
import { arrive, camera, cameraTransform, frameT } from "../motion";
import { easeInOut, energyAt, isShout, prog, sectionLines, shake } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

/**
 * Pre-chorus in the print shop. The hand press stands at the right; its platen
 * comes down ON every sung word, and the word is struck onto the sheet. The
 * camera creeps in and the room shakes harder toward the chorus.
 *
 * opts: section
 */
export const PressRoom: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const lines = sectionLines(scene.opts.section);
  const words = lines.flatMap((l) => l.words);

  // Platen: travels down so it bottoms out on each onset, springs back up.
  let down = 0;
  for (const w of words) {
    const o = frameT(w.start);
    if (t >= o - 0.1 && t < o) down = Math.max(down, Math.pow((t - (o - 0.1)) / 0.1, 2));
    else if (t >= o && t < o + 0.28) down = Math.max(down, 1 - (t - o) / 0.28);
  }

  const build = easeInOut(prog(t, scene.start, scene.end - scene.start));
  const cam = camera(t, lines[0].start, 1 + build);
  const hits = words.filter((w) => isShout(w.text)).map((w) => w.start);
  const sh = shake(t, hits, 16, 0.14);
  const quake = build * build * 10 * energyAt(t);
  const tx = cam.x + sh.x + Math.sin(t * 67) * quake;
  const ty = cam.y + sh.y + Math.cos(t * 59) * quake;
  const zoom = cam.zoom * (1 + 0.12 * build);

  const cur = lines.findIndex((l, k) => l.start - 0.2 <= t && (k + 1 >= lines.length || lines[k + 1].start - 0.2 > t));
  const wordHit = Math.max(0, ...words.map((w) => arrive(t, w.start).hit));

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `${cameraTransform({ ...cam, x: tx, y: ty, zoom })}`, transformOrigin: "50% 50%" }}>
        <Paper hatch={1.1 + 0.4 * build} drift={{ x: -tx * 0.3, y: -ty * 0.3 }} />
        {/* the press, a little parallax behind the type */}
        <div style={{ position: "absolute", inset: 0, filter: cutShadow, transform: `translate(${-tx * 0.15}px, ${-ty * 0.15}px)` }}>
          <Press down={down} width={720} style={{ left: 1160, top: 250 + wordHit * 4 }} />
        </div>
        {cur >= 0 ? (
          <KineticLine
            key={lines[cur].id}
            line={lines[cur]}
            face={{ family: F.fell, size: 112 }}
            faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 138 } : undefined)}
            styleFor={(w) => (isShout(w.text) ? engraved({ tint: C.ink, tile: 1, stroke: 2 }) : undefined)}
            entrance="print"
            entranceFor={(w) => (isShout(w.text) ? "slam" : undefined)}
            cx={660}
            cy={520}
            fitW={980}
            fitH={560}
            maxScale={1.6}
            maxRowWidth={1100}
            lineHeight={1.12}
            exitAt={lines[cur + 1]?.start}
            exit="up"
            seed="pre"
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
