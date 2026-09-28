import React from "react";
import { AbsoluteFill } from "remotion";
import "./fonts";
import { Paper, cutShadow } from "./components/Paper";
import { Crowd } from "./silhouettes/Crowd";
import { Press } from "./silhouettes/Press";
import { Blade, GuillotineFrame } from "./silhouettes/Guillotine";
import { Marat } from "./silhouettes/Marat";

/** Review sheet: every silhouette on the paper, for approving the drawings. */
export const SilhouetteSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div style={{ filter: cutShadow }}>
      <Marat width={520} style={{ left: 40, top: 60 }} />
      <Marat width={520} jaw={1} nod={14} style={{ left: 560, top: 60 }} />
      <Press down={0.3} width={420} style={{ left: 1120, top: 60 }} />
      <Blade width={200} style={{ left: 1600, top: 460 }} />
      <Crowd seed="sheet" width={2400} count={16} scale={0.8} style={{ left: 0, top: 1080 - 800 }} pump={(p) => (p > 0.5 ? 1 : 0)} />
    </div>
  </AbsoluteFill>
);
