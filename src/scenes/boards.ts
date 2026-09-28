// Storyboards for the Board sections, as data. Boxes are fractions of each
// graded print [x0, y0, x1, y1]. Lines are [section, index] into timing.json.
import { ShotSpec } from "./Board";
import { Box } from "../images";

const FULL: Box = [0, 0, 1, 1];
// L'Ami du peuple No. IV (14 Sept 1789): the paper the whole video is printed on
const PAPER = {
  masthead: [0.0, 0.05, 1.0, 0.33] as Box,
  title: [0.1, 0.08, 0.9, 0.2] as Box,
  marat: [0.05, 0.24, 0.95, 0.34] as Box, // "rédigé par M. Marat"
  motto: [0.25, 0.33, 0.75, 0.39] as Box, // Vitam impendere vero
  date: [0.1, 0.38, 0.9, 0.5] as Box,
  columns: [0.0, 0.52, 1.0, 0.82] as Box,
  foot: [0.0, 0.72, 1.0, 1.0] as Box,
};
// Boze's portrait and the Geneva engraving: measured on grid overlays of the graded plates
const BOZE = { face: [0.1, 0.18, 0.9, 0.62] as Box, eyes: [0.33, 0.33, 0.72, 0.47] as Box, eye: [0.44, 0.33, 0.72, 0.47] as Box };
const GENEVE = { face: [0.15, 0.12, 0.75, 0.6] as Box, eyes: [0.25, 0.3, 0.6, 0.44] as Box, eye: [0.25, 0.32, 0.42, 0.41] as Box };
const SCARF = { head: [0.2, 0.12, 0.85, 0.55] as Box, rag: [0.3, 0.15, 0.75, 0.35] as Box };
const BERTAUX = { friezeL: [0.07, 0.41, 0.52, 0.53] as Box, friezeR: [0.48, 0.41, 0.93, 0.53] as Box, oval: [0.25, 0.06, 0.75, 0.4] as Box };
const DAVID = {
  all: [0.0, 0.0, 1.0, 1.0] as Box,
  face: [0.0, 0.0, 0.5, 0.33] as Box,
  wound: [0.1, 0.18, 0.5, 0.42] as Box,
  letter: [0.35, 0.16, 0.8, 0.4] as Box,
  bath: [0.0, 0.3, 0.7, 0.66] as Box,
  quill: [0.0, 0.62, 0.45, 0.92] as Box,
  inscription: [0.52, 0.6, 1.0, 0.98] as Box,
  dark: [0.1, 0.0, 1.0, 0.25] as Box,
};

// ---- Intro: the song's first bars, then ça ira, then the press starts (instrumental)
export const INTRO: ShotSpec[] = [
  { bars: 2, black: true },
  { line: ["caira_intro", 0], img: "ca_ira_1794", from: [0.3, 0.0, 0.95, 0.7], to: FULL, type: "tricolor", place: "bottom", fade: 0.6 },
  { line: ["caira_intro", 1], img: "vengeance_traitres", from: [0.3, 0.12, 0.85, 0.55], to: [0.1, 0.3, 0.9, 0.9], type: "tricolor" },
  { line: ["caira_intro", 2], img: "prise_bastille_1789", from: FULL, to: [0.2, 0.0, 0.8, 0.7], type: "tricolor" },
  { line: ["caira_intro", 3], img: "punit_traitres", from: [0.0, 0.0, 1.0, 0.66], to: [0.19, 0.05, 0.51, 0.41], type: "tricolor" },
  // instrumental: the press is built, piece by piece, cutting on the bars
  { bars: 2, img: "encyc_casse", from: [0.0, 0.0, 1.0, 0.36], to: [0.3, 0.02, 0.8, 0.3], dark: 0.3 },
  { bars: 2, img: "encyc_presse_dev", from: [0.1, 0.35, 0.9, 0.95], to: [0.2, 0.4, 0.8, 0.75], dark: 0.3 },
  { bars: 2, img: "encyc_presse", from: [0.3, 0.4, 1.0, 0.95], to: [0.45, 0.45, 0.95, 0.8], dark: 0.3 },
  { bars: 2, img: "ami_du_peuple_n4", from: PAPER.foot, to: PAPER.masthead, move: "glide", dark: 0.15 },
  { bars: 3, img: "ami_du_peuple_n4", from: PAPER.title, to: PAPER.masthead, dark: 0.55, title: "GONNA NEED A TUB|(For All This Blood)" },
];

// ---- Verse 1: the paper, the names, the sewer, the fever
export const VERSE1: ShotSpec[] = [
  { line: ["verse1", 0], img: "ami_du_peuple_n4", from: PAPER.masthead, to: PAPER.marat, dark: 0.3 },
  { line: ["verse1", 1], img: "prise_bastille_1789", from: [0.2, 0.0, 0.8, 0.7], to: FULL },
  { line: ["verse1", 2], img: "comite_revolutionnaire", from: FULL, to: [0.1, 0.35, 0.6, 0.95] },
  // hoarders! deserters! royalists! suspects!: each name, a face in the committee's net
  {
    line: ["verse1", 3],
    img: "comite_revolutionnaire",
    from: [0.1, 0.35, 0.6, 0.95],
    cuts: [[0.0, 0.3, 0.35, 0.7], [0.3, 0.3, 0.65, 0.7], [0.6, 0.3, 0.95, 0.7], [0.3, 0.55, 0.7, 0.95]],
    cutOn: "bang",
    move: "hold",
    type: "print",
    place: "top",
  },
  // "so I went below": the camera goes down through Piranesi's prison
  { line: ["verse1", 4], img: "carceri_drawbridge", from: [0.0, 0.0, 1.0, 0.42], to: [0.0, 0.58, 1.0, 1.0], move: "glide", dark: 0.35 },
  { line: ["verse1", 5], img: "carceri_smoke", from: [0.1, 0.3, 0.9, 0.75], to: [0.25, 0.38, 0.75, 0.66], dark: 0.2, candle: [0.4, 0.55], type: "whisper", place: "right" },
  { line: ["verse1", 6], img: "carceri_tower", from: [0.0, 0.55, 1.0, 1.0], to: [0.0, 0.0, 1.0, 0.45], move: "glide", dark: 0.3 },
  { line: ["verse1", 7], img: "boze_marat", from: BOZE.face, to: BOZE.eyes, cuts: [BOZE.eye], place: "bottom" },
];

// ---- Verse 2: September
export const VERSE2: ShotSpec[] = [
  { line: ["verse2", 0], img: "abbaye_massacre", from: [0.0, 0.05, 1.0, 0.95], to: [0.3, 0.45, 1.0, 0.95] },
  { line: ["verse2", 1], img: "septembre_berthault", from: [0.0, 0.1, 1.0, 0.9], cuts: [[0.3, 0.5, 0.6, 0.85]], to: [0.25, 0.45, 0.65, 0.9] },
  { line: ["verse2", 2], img: "septembre_tribunal", from: FULL, to: [0.3, 0.0, 0.75, 1.0] },
  { line: ["verse2", 3], img: "chatelet_bicetre", from: [0.0, 0.05, 0.5, 1.0], to: [0.5, 0.05, 1.0, 1.0], move: "dolly" },
  { line: ["verse2", 4], img: "ami_du_peuple_n4", from: PAPER.date, to: PAPER.columns, dark: 0.3 },
  { line: ["verse2", 5], img: "marat_geneve", from: GENEVE.face, cuts: [GENEVE.eyes], to: GENEVE.eye },
  { line: ["verse2", 6], img: "septembre_episode", from: [0.2, 0.05, 0.85, 0.75], to: [0.05, 0.3, 0.6, 0.95] },
  { line: ["verse2", 7], img: "heads_on_pikes", from: [0, 0, 1, 1], cuts: [[0.3, 0.0, 0.8, 0.5], [0.03, 0.0, 0.45, 0.42]], to: [0.1, 0.05, 0.35, 0.3] },
];

// ---- The spoken section: Marat's own words (1790). The quietest point of the film.
export const SPOKEN: ShotSpec[] = [
  { line: ["spoken", 0], img: "ami_du_peuple_n4", from: PAPER.columns, to: PAPER.motto, dark: 0.55, type: "hand", place: "center", fade: 0.8 },
  { line: ["spoken", 1], img: "carceri_xiv", from: [0.0, 0.2, 1.0, 0.64], to: [0.15, 0.3, 0.85, 0.6], dark: 0.55, type: "hand", place: "center", fade: 0.8 },
  { line: ["spoken", 2], img: "comite_scene_derniere", from: [0.15, 0.15, 0.75, 0.8], to: [0.3, 0.2, 0.65, 0.6], dark: 0.55, type: "hand", place: "center", fade: 0.8 },
  { line: ["spoken", 3], black: true, type: "hand", place: "center", fade: 0.5 },
  { line: ["spoken", 4], img: "hell_broke_loose", from: [0.4, 0.25, 0.85, 0.9], to: FULL, dark: 0.45, type: "hand", place: "center" },
  { line: ["spoken", 5], img: "boze_marat", from: BOZE.face, cuts: [BOZE.eyes, BOZE.eye, BOZE.eyes, BOZE.eye, BOZE.face, BOZE.eyes, BOZE.eye], dark: 0.3, type: "print", place: "bottom" },
];

// ---- The tribunal, and Marat's answer
export const TRIBUNAL: ShotSpec[] = [
  { line: ["tribunal", 0], img: "fouquier_tribunal", from: [0.05, 0.05, 0.95, 0.7], to: [0.2, 0.25, 0.8, 0.6], dark: 0.45, type: "judge", place: "top", fade: 0.6 },
  { line: ["tribunal", 1], img: "fouquier_tribunal", from: [0.3, 0.55, 0.95, 0.95], to: [0.0, 0.55, 0.6, 0.95], dark: 0.45, type: "judge", place: "top" },
  { line: ["answer", 0], img: "boze_marat", from: BOZE.face, cuts: [BOZE.eyes, BOZE.eyes, BOZE.eye, BOZE.eye, BOZE.eye, BOZE.eye], to: BOZE.eye, dark: 0.2 },
  { line: ["answer", 1], img: "marat_geneve", from: GENEVE.face, cuts: [GENEVE.eye], dark: 0.2 },
];

// ---- Acquitted: carried through the streets
export const ACQUITTAL: ShotSpec[] = [
  { line: ["acquittal", 0], img: "triomphe_marat", from: [0.0, 0.25, 0.5, 0.8], cuts: [[0.3, 0.1, 0.66, 0.6], [0.0, 0.25, 0.5, 0.8], [0.5, 0.2, 1.0, 0.8], [0.3, 0.1, 0.66, 0.6], [0.5, 0.2, 1.0, 0.8]], to: [0.25, 0.05, 0.75, 0.55], place: "bottom" },
  { line: ["acquittal", 1], img: "triomphe_acquitte", from: FULL, cuts: [[0.3, 0.0, 0.7, 0.5], FULL, [0.3, 0.0, 0.7, 0.5], [0.0, 0.3, 0.5, 1.0], [0.5, 0.3, 1.0, 1.0]], to: [0.25, 0.0, 0.75, 0.55] },
  { line: ["acquittal", 2], img: "triomphe_bertaux", from: BERTAUX.friezeL, to: BERTAUX.friezeR, move: "dolly" },
  { line: ["acquittal", 3], img: "ami_du_peuple_n4", from: PAPER.marat, to: PAPER.title, dark: 0.3 },
];

// Corday's portrait (framed engraving): her face, and what she holds in her right hand
const CORDAY = {
  hat: { all: [0.02, 0.0, 0.98, 0.72] as Box, face: [0.28, 0.14, 0.72, 0.44] as Box }, // Carnavalet G.42196, the oval
  bonnet: { all: [0.05, 0.0, 0.95, 0.75] as Box, face: [0.3, 0.16, 0.72, 0.48] as Box }, // G.42210
  knife: { all: [0.0, 0.05, 1.0, 0.75] as Box, hand: [0.48, 0.5, 0.9, 0.76] as Box }, // G.42197: the knife in her hand
  hauer: { all: [0.05, 0.08, 0.95, 0.85] as Box, face: [0.22, 0.2, 0.78, 0.6] as Box }, // painted in her cell, 1793
};

// ---- The bath, Corday, the death
export const BATH: ShotSpec[] = [
  { line: ["bath", 0], img: "carceri_smoke", from: [0.25, 0.38, 0.75, 0.66], to: [0.35, 0.45, 0.6, 0.6], dark: 0.35, candle: [0.45, 0.55], type: "whisper", fade: 0.6 },
  { line: ["bath", 1], img: "marat_portrait_b", from: SCARF.head, to: SCARF.rag, dark: 0.3, type: "whisper" },
  { line: ["bath", 2], img: "boze_marat", from: BOZE.face, to: BOZE.eyes, dark: 0.45, candle: [0.3, 0.6], type: "whisper" },
  { line: ["bath", 3], img: "ami_du_peuple_n4", from: PAPER.columns, to: PAPER.foot, dark: 0.4, type: "whisper" },
  // Corday arrives. Marat is alive and singing until her first line: no death on screen before it.
  { line: ["corday", 0], img: "corday_c42196", from: CORDAY.hat.all, to: CORDAY.hat.face, dark: 0.3, type: "whisper", fade: 0.4 },
  { line: ["corday", 1], img: "corday_c42210", from: CORDAY.bonnet.all, to: CORDAY.bonnet.face, dark: 0.3, type: "whisper" },
  { line: ["corday", 2], img: "ami_du_peuple_n4", from: PAPER.columns, to: PAPER.date, dark: 0.4, type: "whisper" },
  { line: ["corday", 3], img: "hell_broke_loose", from: [0.1, 0.0, 0.8, 0.75], to: [0.31, 0.0, 0.52, 0.17], dark: 0.35, type: "whisper" },
  // the knife (instrumental): onto what is in her hand, then black, and the blood rises. Marat is not seen.
  { bars: 2, img: "corday_c42197", from: CORDAY.knife.all, to: CORDAY.knife.hand, dark: 0.35, soak: [0, 0.2] },
  { bars: 3, black: true, soak: [0.2, 0.85] },
  // David: the whole last address, one slow look at the painting
  { line: ["death", 0], img: "david_marat", from: DAVID.dark, to: DAVID.face, dark: 0.35, type: "whisper", fade: 1.2 },
  { line: ["death", 1], img: "david_marat", from: DAVID.face, to: DAVID.bath, dark: 0.3, type: "whisper", fade: 0.8 },
  { line: ["death", 2], img: "david_marat", from: DAVID.letter, to: [0.4, 0.2, 0.7, 0.35], dark: 0.3, type: "whisper", fade: 0.8 },
  // her own words (she said as much at her trial): Hauer's portrait, painted in her cell
  { line: ["death", 3], img: "corday_hauer", from: CORDAY.hauer.all, to: CORDAY.hauer.face, dark: 0.3, type: "whisper", fade: 0.6 },
  { line: ["death", 4], img: "david_marat", from: DAVID.wound, to: [0.2, 0.25, 0.4, 0.38], dark: 0.3, type: "whisper", fade: 0.8 },
  { line: ["death", 5], img: "david_marat", from: DAVID.inscription, to: DAVID.all, dark: 0.3, type: "whisper", fade: 0.8 },
  { bars: 1, black: true },
];

// ---- "You're going to need a tub / for all that blood." Then ça ira, soaked.
export const CLIMAX: ShotSpec[] = [
  { line: ["climax", 0], black: true, type: "whisper", place: "center" },
  { line: ["climax", 1], img: "david_marat", from: DAVID.bath, to: DAVID.all, dark: 0.4, soak: [0.1, 1.0], type: "print", place: "center" },
  { line: ["caira_reprise", 0], img: "ca_ira_1794", from: FULL, to: [0.3, 0.0, 0.95, 0.7], type: "tricolor", soak: [0.2, 0.25] },
  { line: ["caira_reprise", 1], img: "triomphe_marat", from: [0.3, 0.1, 0.66, 0.6], to: FULL, type: "tricolor", soak: [0.25, 0.3] },
  { line: ["caira_reprise", 2], img: "prise_bastille_1789", from: [0.2, 0.0, 0.8, 0.7], to: FULL, type: "tricolor", soak: [0.3, 0.4] },
  { line: ["caira_reprise", 3], img: "ami_du_peuple_n4", from: PAPER.motto, to: PAPER.masthead, type: "tricolor", dark: 0.4, soak: [0.4, 0.55] },
  { bars: 8, img: "ami_du_peuple_n4", from: PAPER.masthead, to: [0.0, 0.0, 1.0, 1.0], dark: 0.6, soak: [0.55, 1.0], fade: 1.5 },
];
