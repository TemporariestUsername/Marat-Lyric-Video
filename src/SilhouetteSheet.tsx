import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { Paper, cutShadow } from "./components/Paper";
import { Crowd } from "./silhouettes/Crowd";
import { Press } from "./silhouettes/Press";
import { Blade, GuillotineFrame } from "./silhouettes/Guillotine";

/** Review sheet: every silhouette on the paper, for approving the drawings. */
export const SilhouetteSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div style={{ filter: cutShadow }}>
      <Press down={0.3} width={560} style={{ left: 200, top: 60 }} />
      <GuillotineFrame width={200} style={{ left: 900, top: 90 }} />
      <Blade width={200} style={{ left: 900, top: 150 }} />
      <Blade width={300} style={{ left: 1350, top: 120, transform: "rotate(-8deg)" }} gleam={0.8} />
      <Crowd seed="sheet" width={2400} count={16} scale={0.8} style={{ left: 0, top: 1080 - 800 }} pump={(p) => (p > 0.5 ? 1 : 0)} />
    </div>
  </AbsoluteFill>
);
