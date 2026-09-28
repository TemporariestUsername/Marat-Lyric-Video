import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper } from "../components/Paper";
import { KineticLine } from "../components/Kinetic";
import { TIMING } from "../timing";
import { F } from "../fonts";
import { SceneProps } from "./types";

/** Stand-in for scenes not designed yet: each line, one at a time, printed on the page. */
export const Plain: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const lines = TIMING.lines.filter((l) => l.start >= scene.start - 0.01 && l.start < scene.end);
  const i = lines.findIndex((l, k) => l.start - 0.2 <= t && (k + 1 >= lines.length || lines[k + 1].start - 0.2 > t));
  const cur = lines[i];
  return (
    <AbsoluteFill>
      <Paper />
      {cur ? (
        <KineticLine
          key={cur.id}
          line={cur}
          face={{ family: F.fell, size: 96 }}
          entrance="print"
          exitAt={lines[i + 1]?.start}
          fitW={1400}
          maxScale={1.3}
        />
      ) : null}
    </AbsoluteFill>
  );
};
