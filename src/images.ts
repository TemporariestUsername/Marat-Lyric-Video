// Period images (graded by tools/prep_images.py). Sizes come from the build
// index; focus boxes are fractions of the image [x0, y0, x1, y1] for punch-ins.
import index from "../public/img/index.json";

type Entry = { w: number; h: number; cut?: { w: number; h: number } };
const IDX = index as unknown as Record<string, Entry>;

export type Box = [number, number, number, number];
export const img = (id: string) => {
  const e = IDX[id];
  if (!e) throw new Error(`no image ${id}`);
  return e;
};

export const FOCUS: Record<string, Box[]> = {
  heads_on_pikes: [[0.03, 0.0, 0.45, 0.42], [0.3, 0.0, 0.8, 0.5], [0, 0, 1, 1]],
  punit_traitres: [[0.0, 0.0, 0.55, 0.6], [0.45, 0.0, 1.0, 0.6], [0, 0, 1, 1]],
  vengeance_traitres: [[0.3, 0.12, 0.85, 0.55], [0.1, 0.3, 0.9, 0.9]],
  sansculotte_horreurs: [[0.35, 0.02, 0.95, 0.55], [0.05, 0.1, 0.6, 0.7]],
  corday_trial: [[0.3, 0.1, 0.6, 0.5], [0.55, 0.0, 0.88, 0.75], [0.0, 0.2, 0.4, 0.8]],
  hell_broke_loose: [[0.08, 0.0, 0.45, 0.9], [0.4, 0.25, 0.85, 0.9], [0.3, 0.0, 1.0, 0.4]],
  supplice_louis: [[0.3, 0.3, 0.7, 0.85], [0, 0, 1, 1]],
  guillotine_woodcut: [[0, 0, 1, 1]],
  triomphe_marat: [[0.3, 0.1, 0.66, 0.6], [0.0, 0.25, 0.5, 0.8], [0.5, 0.2, 1.0, 0.8]],
  assassinat_marat: [[0.3, 0.4, 0.78, 0.88], [0, 0, 1, 1]],
  comite_revolutionnaire: [[0.1, 0.35, 0.6, 0.95], [0.5, 0.3, 1.0, 0.9], [0, 0, 1, 1]],
  comite_scene_derniere: [[0.15, 0.15, 0.75, 0.8], [0.4, 0.1, 1.0, 0.8]],
  fouquier_tribunal: [[0.05, 0.55, 0.95, 0.95], [0.2, 0.25, 0.8, 0.6]],
  ca_ira_1794: [[0.3, 0.0, 0.95, 0.7], [0, 0, 1, 1]],
  bombardement_trones: [[0.0, 0.1, 0.55, 0.65], [0.45, 0.0, 1.0, 0.6]],
  prise_bastille_1789: [[0.2, 0.0, 0.8, 0.7], [0, 0, 1, 1]],
  corday_portrait: [[0.2, 0.0, 0.8, 0.45]],
  boze_marat: [[0.15, 0.0, 0.85, 0.45]],
};

/**
 * Named regions of specific prints, measured from the graded images, for
 * storyboarded camera moves ("frame the tub on TUB").
 */
export const BOX = {
  // Punit les traîtres: eight heads on pikes along the top of the parade
  punit: {
    heads12: [0.0, 0.08, 0.32, 0.44] as Box,
    heads34: [0.19, 0.05, 0.51, 0.41] as Box,
    heads56: [0.43, 0.03, 0.75, 0.39] as Box,
    all: [0.0, 0.0, 1.0, 0.66] as Box,
  },
  // 1789: the heads of Delaunay, Flesselles, Berthier, Foulon, with Charon's boat
  pikes1789: {
    right: [0.42, 0.19, 0.66, 0.43] as Box, // the lone head over Charon's boat
    mid: [0.17, 0.17, 0.41, 0.41] as Box, // Foulon, Berthier...
    cluster: [0.06, 0.15, 0.64, 0.64] as Box, // all of them, and the boat
  },
  // Hell broke loose: the guillotine
  guillotine: {
    crossbeam: [0.31, 0.0, 0.52, 0.17] as Box,
    lunette: [0.32, 0.42, 0.6, 0.7] as Box, // the king's head in the lunette
    wide: [0.1, 0.0, 0.8, 0.75] as Box,
  },
  // Assassinat de J.P. Marat: the room, and Marat's tub
  bathroom: {
    wide: [0.02, 0.3, 0.98, 0.98] as Box,
    tub: [0.33, 0.55, 0.61, 0.81] as Box,
  },
  // Fouquier-Tinville before the tribunal: the crowd (the people)
  crowd: {
    left: [0.0, 0.62, 0.4, 0.9] as Box,
    mid: [0.3, 0.62, 0.7, 0.9] as Box,
    right: [0.6, 0.62, 0.98, 0.9] as Box,
  },
};

/** Marat cut-out (marat_geneve): his eyes, as fractions of the cut-out. */
export const MARAT_EYES = { x: 0.35, y: 0.3 };
