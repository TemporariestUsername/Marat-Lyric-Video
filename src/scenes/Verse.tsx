import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper } from "../components/Paper";
import { Masthead } from "../components/Masthead";
import { KineticLine, engraved } from "../components/Kinetic";
import { Stamp } from "../components/Stamp";
import { camera, cameraTransform } from "../motion";
import { isShout, rnd, sectionLines, shake } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

/**
 * Verse on the front page (first pass): the masthead rides at the top of a
 * drifting sheet, each line is struck onto the page one at a time and thrown
 * off by the next, shouted words slam in engraved Bodoni, and denounced names
 * are rubber-stamped across the sheet in ink.
 *
 * opts: section, issue, date, denounce?: line ids
 */
export const Verse: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const o = scene.opts;
  const lines = sectionLines(o.section);
  const cur = lines.findIndex((l, k) => l.start - 0.2 <= t && (k + 1 >= lines.length || lines[k + 1].start - 0.2 > t));
  const hits = lines.flatMap((l) => l.words.filter((w) => isShout(w.text) || o.denounce?.includes(l.id)).map((w) => w.start));
  const sh = shake(t, hits, 12, 0.14);
  const cam = camera(t, lines[0].start, 1.2);
  // the sheet slides a little with each new line, so the page itself keeps moving
  const lineIdx = Math.max(0, cur);
  const slideX = (rnd(o.section, lineIdx) - 0.5) * 80;
  const slideR = (rnd(o.section, lineIdx, "r") - 0.5) * 2.4;
  const stamps = lines
    .filter((l) => o.denounce?.includes(l.id))
    .flatMap((l) => l.words.filter((w) => w.text.endsWith("!")).map((w, k) => ({ w, k, l })));

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cameraTransform({ x: cam.x + sh.x + slideX * 0.3, y: cam.y + sh.y, rot: cam.rot + sh.r + slideR * 0.3, zoom: cam.zoom * 1.04 }),
        }}
      >
        <Paper drift={{ x: -cam.x * 0.4, y: -cam.y * 0.4 }} />
        <Masthead issue={o.issue} date={o.date} style={{ transform: `translateY(${-8 + Math.sin(t * 0.5) * 6}px) scale(0.9)`, opacity: 0.92 }} />
        {stamps.map(({ w, k, l }) => (
          <Stamp
            key={`${l.id}-${k}`}
            at={w.start}
            text={w.text}
            x={[480, 1440, 760, 1250][k % 4]}
            y={[860, 820, 960, 960][k % 4]}
            rot={(rnd(l.id, k) - 0.5) * 18}
            size={84}
            color={C.ink}
            seed={`${l.id}${k}`}
          />
        ))}
        {cur >= 0 ? (
          <KineticLine
            key={lines[cur].id}
            line={lines[cur]}
            face={{ family: F.fell, size: 108 }}
            faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 132 } : undefined)}
            styleFor={(w) => (isShout(w.text) ? engraved({ tint: C.ink, tile: 1, stroke: 2 }) : undefined)}
            entrance={cur % 2 ? "drop" : "print"}
            entranceFor={(w) => (isShout(w.text) ? "slam" : undefined)}
            cx={960}
            cy={640}
            fitW={1560}
            fitH={480}
            maxScale={1.7}
            maxRowWidth={1400}
            lineHeight={1.1}
            exitAt={lines[cur + 1]?.start}
            exit={cur % 2 ? "left" : "up"}
            seed={o.section}
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
