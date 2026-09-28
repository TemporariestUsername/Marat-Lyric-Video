import React from "react";

export type SceneProps = { scene: SceneDef };
export type SceneDef = {
  id: string;
  start: number;
  end: number;
  Comp: React.FC<SceneProps>;
  /** free-form per-scene settings (sections, numerals, dates…) */
  opts: Record<string, any>;
};
