import React from "react";
import { Cues } from "../components/FX";

export type SceneProps = { scene: SceneDef };
/** A scene component; `cues` declares its accents (strobes, flashes, glitches) from its own lyric timing. */
export type SceneComp = React.FC<SceneProps> & { cues?: (scene: SceneDef) => Cues };
export type SceneDef = {
  id: string;
  start: number;
  end: number;
  Comp: SceneComp;
  /** free-form per-scene settings (sections, numerals, dates…) */
  opts: Record<string, any>;
};
