import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper, Vignette } from "../components/Paper";
import { TimedLine } from "../components/Type";
import { TIMING } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

/** Stand-in for scenes not designed yet: the current line, centred on the page. */
export const Plain: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const lines = TIMING.lines.filter((l) => l.start >= scene.start - 0.01 && l.start < scene.end);
  const cur = [...lines].reverse().find((l) => l.start <= t);
  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 160 }}>
        {cur ? (
          <TimedLine
            key={cur.id}
            line={cur}
            style={{ justifyContent: "center", fontFamily: F.caslon, fontSize: 64, color: C.ink, textAlign: "center" }}
            shoutStyle={{ color: C.blood, fontWeight: 700 }}
          />
        ) : null}
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};
