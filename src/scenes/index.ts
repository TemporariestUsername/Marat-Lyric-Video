// Scene list. Every boundary is derived from timing.json line times — no
// hand-typed timestamps. A scene runs until the next one starts.
import { DURATION, sectionLines } from "../timing";
import { Chorus } from "./Chorus";
import { PressRoom } from "./PressRoom";
import { Board } from "./Board";
import { INTRO, VERSE1, VERSE2, SPOKEN, TRIBUNAL, ACQUITTAL, BATH, CLIMAX } from "./boards";
import { SceneDef } from "./types";

const first = (sid: string) => sectionLines(sid)[0].start;

type Spec = Omit<SceneDef, "end">;
const specs: Spec[] = [
  { id: "intro", start: 0, Comp: Board, opts: { shots: INTRO, punch: 0.4 } },
  { id: "verse1", start: first("verse1") - 0.1, Comp: Board, opts: { shots: VERSE1, punch: 0.35 } },
  { id: "prechorus", start: first("prechorus") - 0.25, Comp: PressRoom, opts: { section: "prechorus", fx: 1.0 } },
  { id: "chorus1", start: first("chorus1") - 0.15, Comp: Chorus, opts: { section: "chorus1", numeral: [{ word: 0, text: "5" }, { word: 1, text: "500" }], heaviness: 1, pageTurnOut: true, fx: 1.4 } },
  { id: "verse2", start: first("verse2") - 0.2, Comp: Board, opts: { shots: VERSE2, punch: 0.4, shake: 18 } },
  { id: "letter", start: first("spoken"), Comp: Board, opts: { shots: SPOKEN, shake: 22 } },
  { id: "chorus2", start: first("chorus2") - 0.15, Comp: Chorus, opts: { section: "chorus2", numeral: [{ word: 0, text: "1" }, { word: 1, text: "1,000" }], heaviness: 2, pageTurnOut: true, fx: 1.6 } },
  { id: "tribunal", start: first("tribunal"), Comp: Board, opts: { shots: TRIBUNAL, shake: 20 } },
  { id: "acquittal", start: first("acquittal"), Comp: Board, opts: { shots: ACQUITTAL, punch: 0.6, shake: 18 } },
  { id: "chorus3", start: first("chorus3") - 0.15, Comp: Chorus, opts: { section: "chorus3", numeral: [{ word: 1, text: "100" }, { word: 2, text: "100,000" }], heaviness: 3, fx: 1.8 } },
  { id: "bath", start: first("bath"), Comp: Board, opts: { shots: BATH, shake: 8 } },
  { id: "climax", start: first("climax") - 0.1, Comp: Board, opts: { shots: CLIMAX, punch: 0.3 } },
];

export const SCENES: SceneDef[] = specs.map((s, i) => ({ ...s, end: specs[i + 1]?.start ?? DURATION }));
// Choruses tear open whatever page came before them.
SCENES.forEach((s, i) => {
  if (s.Comp === Chorus && i > 0) s.opts.prev = SCENES[i - 1];
});

export const sceneIndexAt = (t: number): number => {
  const i = SCENES.findIndex((s) => t >= s.start && t < s.end);
  return i < 0 ? SCENES.length - 1 : i;
};
export const sceneAt = (t: number): SceneDef => SCENES[sceneIndexAt(t)];
export const sceneById = (id: string): SceneDef => SCENES.find((s) => s.id === id)!;
