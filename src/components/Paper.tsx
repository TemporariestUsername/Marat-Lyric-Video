import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";

/**
 * Sepia plate paper with an engraved (line-hatched) vignette, like the cover.
 * `hatch` scales the vignette's darkness; `tint` is multiplied over the paper.
 * `drift` offsets the textures (parallax against the type layers).
 */
export const Paper: React.FC<{
  hatch?: number;
  tint?: string;
  tintOpacity?: number;
  drift?: { x: number; y: number };
  style?: React.CSSProperties;
}> = ({ hatch = 1, tint, tintOpacity = 1, drift = { x: 0, y: 0 }, style }) => (
  <AbsoluteFill style={{ backgroundColor: C.paper, overflow: "hidden", ...style }}>
    <Img
      src={staticFile("tex/paper.jpg")}
      style={{ position: "absolute", left: -192 + drift.x, top: -108 + drift.y, width: 2304, height: 1296 }}
    />
    {tint ? <AbsoluteFill style={{ backgroundColor: tint, mixBlendMode: "multiply", opacity: tintOpacity }} /> : null}
    {hatch > 0 ? (
      <Img
        src={staticFile("tex/hatch_vignette.png")}
        style={{ position: "absolute", left: -192 + drift.x * 1.4, top: -108 + drift.y * 1.4, width: 2304, height: 1296, opacity: Math.min(1, hatch) }}
      />
    ) : null}
    <Img src={staticFile("tex/speckle.png")} style={{ position: "absolute", inset: 0, opacity: 0.7 }} />
  </AbsoluteFill>
);

/** Paper-cut drop shadow for cut-out figures. */
export const cutShadow = "drop-shadow(5px 7px 3px rgba(20,12,4,0.38))";
