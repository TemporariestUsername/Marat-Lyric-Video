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
