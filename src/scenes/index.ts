// Scene list. Every boundary is derived from timing.json line times — no
// hand-typed timestamps. A scene runs until the next one starts.
import { DURATION, line, sectionLines } from "../timing";
import { Broadsheet } from "./Broadsheet";
import { Chorus } from "./Chorus";
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
    id: "broadsheet1",
    start: Math.min(lastLineEnd("caira_intro"), line("verse1.1").start - 1),
    Comp: Broadsheet,
    opts: {
      verse: "verse1",
      pull: "prechorus",
      issue: "N° 1",
      date: "Du samedi 12 septembre 1789",
      headline: "DÉNONCIATION FAITE AU TRIBUNAL DU PUBLIC",
      mastheadIntro: true,
      denounce: ["verse1.4"],
    },
  },
  { id: "chorus1", start: first("chorus1"), Comp: Chorus, opts: { section: "chorus1", numeral: "500", heaviness: 1 } },
  {
    id: "broadsheet2",
    start: first("verse2"),
    Comp: Broadsheet,
    opts: { verse: "verse2", issue: "Paris", date: "Septembre 1792", headline: "LES PRISONS · L'ABBAYE · LA FORCE", enter: true },
  },
  { id: "letter", start: first("spoken"), Comp: Plain, opts: {} },
  { id: "chorus2", start: first("chorus2"), Comp: Chorus, opts: { section: "chorus2", numeral: "1,000", heaviness: 2 } },
  { id: "tribunal", start: first("tribunal"), Comp: Plain, opts: {} },
  { id: "acquittal", start: first("acquittal"), Comp: Plain, opts: {} },
  { id: "chorus3", start: first("chorus3"), Comp: Chorus, opts: { section: "chorus3", numeral: "100,000", heaviness: 3 } },
  { id: "bath", start: first("bath"), Comp: Plain, opts: {} },
  { id: "climax", start: first("climax"), Comp: Plain, opts: {} },
  { id: "reprise", start: first("caira_reprise"), Comp: Plain, opts: {} },
];

export const SCENES: SceneDef[] = specs.map((s, i) => ({ ...s, end: specs[i + 1]?.start ?? DURATION }));
// Choruses shatter whatever page came before them.
SCENES.forEach((s, i) => {
  if (s.Comp === Chorus && i > 0) s.opts.prev = SCENES[i - 1];
});

export const sceneAt = (t: number): SceneDef => SCENES.find((s) => t >= s.start && t < s.end) ?? SCENES[SCENES.length - 1];
export const sceneById = (id: string): SceneDef => SCENES.find((s) => s.id === id)!;
