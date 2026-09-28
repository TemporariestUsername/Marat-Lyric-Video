// Scene list. Every boundary is derived from timing.json line times — no
// hand-typed timestamps. A scene runs until the next one starts.
import { DURATION, sectionLines } from "../timing";
import { Chorus } from "./Chorus";
import { PressRoom } from "./PressRoom";
import { Verse } from "./Verse";
import { Plain } from "./Plain";
import { SceneDef } from "./types";

const first = (sid: string) => sectionLines(sid)[0].start;
const lastLineEnd = (sid: string) => {
  const ls = sectionLines(sid);
  return ls[ls.length - 1].end;
};

type Spec = Omit<SceneDef, "end">;
const specs: Spec[] = [
  { id: "intro", start: 0, Comp: Plain, opts: {} },
  {
    id: "verse1",
    start: Math.min(lastLineEnd("caira_intro"), first("verse1") - 1),
    Comp: Verse,
    opts: { section: "verse1", issue: "N° 1", date: "Du samedi 12 septembre 1789", denounce: ["verse1.4"] },
  },
  { id: "prechorus", start: first("prechorus") - 0.25, Comp: PressRoom, opts: { section: "prechorus" } },
  { id: "chorus1", start: first("chorus1") - 0.15, Comp: Chorus, opts: { section: "chorus1", numeral: "500", heaviness: 1, pageTurnOut: true } },
  { id: "verse2", start: first("verse2") - 0.2, Comp: Verse, opts: { section: "verse2", issue: "Paris", date: "Septembre 1792" } },
  { id: "letter", start: first("spoken"), Comp: Plain, opts: {} },
  { id: "chorus2", start: first("chorus2") - 0.15, Comp: Chorus, opts: { section: "chorus2", numeral: "1,000", heaviness: 2, pageTurnOut: true } },
  { id: "tribunal", start: first("tribunal"), Comp: Plain, opts: {} },
  { id: "acquittal", start: first("acquittal"), Comp: Plain, opts: {} },
  { id: "chorus3", start: first("chorus3") - 0.15, Comp: Chorus, opts: { section: "chorus3", numeral: "100,000", heaviness: 3 } },
  { id: "bath", start: first("bath"), Comp: Plain, opts: {} },
  { id: "climax", start: first("climax"), Comp: Plain, opts: {} },
  { id: "reprise", start: first("caira_reprise"), Comp: Plain, opts: {} },
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
