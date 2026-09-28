import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C } from "../theme";
import { rnd } from "../timing";

/** Aged newsprint. `tint` is multiplied over it (e.g. candle-light, cold court). */
export const Paper: React.FC<{ tint?: string; tintOpacity?: number; speckle?: boolean; style?: React.CSSProperties }> = ({
  tint,
  tintOpacity = 1,
  speckle = true,
  style,
}) => (
  <AbsoluteFill style={{ backgroundColor: C.paper, overflow: "hidden", ...style }}>
    <Img
      src={staticFile("tex/paper.jpg")}
      style={{ position: "absolute", left: -192, top: -108, width: 2304, height: 1296 }}
    />
    {tint ? <AbsoluteFill style={{ backgroundColor: tint, mixBlendMode: "multiply", opacity: tintOpacity }} /> : null}
    {speckle ? <Img src={staticFile("tex/speckle.png")} style={{ position: "absolute", inset: 0, opacity: 0.8 }} /> : null}
  </AbsoluteFill>
);

/** Soft dark vignette laid over everything. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(12,8,5,${strength}) 100%)`,
    }}
  />
);

/** Faint filler "type" — grey rules standing in for the rest of the page's print. */
export const GhostType: React.FC<{
  x: number;
  y: number;
  w: number;
  rows: number;
  rowH?: number;
  seed: string;
  opacity?: number;
  reveal?: number; // 0..1 how many rows are "printed"
}> = ({ x, y, w, rows, rowH = 22, seed, opacity = 0.14, reveal = 1 }) => {
  const shown = Math.floor(rows * reveal);
  const items = [];
  let indent = false;
  for (let i = 0; i < shown; i++) {
    const r = rnd(seed, i);
    const paraEnd = r < 0.12;
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x + (indent ? 24 : 0),
          top: y + i * rowH,
          width: (w - (indent ? 24 : 0)) * (paraEnd ? 0.3 + r * 4 : 1),
          height: rowH * 0.42,
          background: `rgba(27,22,17,${opacity})`,
          borderRadius: 1,
        }}
      />,
    );
    indent = paraEnd;
  }
  return <>{items}</>;
};
