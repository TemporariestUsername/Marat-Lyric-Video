// Everything time-related comes from timing.json (built by timing/build_timing.py).
// No timestamps are typed by hand anywhere in src/.
import raw from "../timing.json";

export type Word = { text: string; start: number; rawStart: number; snapped: boolean; beat: number };
export type Line = {
  id: string;
  section: string;
  index: number;
  text: string;
  start: number;
  end: number;
  lastWordEnd: number;
  words: Word[];
};
export type Section = { id: string; name: string; start: number; end: number; lines: string[] };
type Timing = {
  duration: number;
  fps: number;
  bpm: number;
  beatPeriod: number;
  beats: number[];
  energy: { step: number; values: number[] };
  sections: Section[];
  lines: Line[];
};

export const TIMING = raw as unknown as Timing;
export const FPS = TIMING.fps;
export const BEAT = TIMING.beatPeriod;
export const DURATION = TIMING.duration;

const lineMap = new Map(TIMING.lines.map((l) => [l.id, l]));
export const line = (id: string): Line => {
  const l = lineMap.get(id);
  if (!l) throw new Error(`unknown line ${id}`);
  return l;
};
export const sectionLines = (sid: string): Line[] => TIMING.lines.filter((l) => l.section === sid);
export const section = (sid: string): Section => {
  const s = TIMING.sections.find((x) => x.id === sid);
  if (!s) throw new Error(`unknown section ${sid}`);
  return s;
};

/** End time of word i in a line: next word start, or the line's last-word end. */
export const wordEnd = (l: Line, i: number): number =>
  i + 1 < l.words.length ? l.words[i + 1].start : Math.max(l.lastWordEnd, l.words[i].start + BEAT / 2);

const beats = TIMING.beats;
/** Index of the last beat at or before t (-1 if before the first beat). */
export const beatIndexAt = (t: number): number => {
  let lo = 0,
    hi = beats.length - 1;
  if (t < beats[0]) return -1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (beats[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
};
export const beatTime = (i: number): number => beats[Math.max(0, Math.min(beats.length - 1, i))];
/** Beats in [a, b). */
export const beatsBetween = (a: number, b: number): number[] => beats.filter((x) => x >= a && x < b);
/** 1 right on a beat, decaying exponentially until the next one. */
export const beatPulse = (t: number, decay = 0.12): number => {
  const i = beatIndexAt(t);
  if (i < 0) return 0;
  return Math.exp(-(t - beats[i]) / decay);
};
/**
 * Bar pulse counted from an anchor (e.g. a chorus's first word, which lands on
 * a downbeat): 1 on every 4th beat from the anchor's nearest beat.
 */
export const barPulse = (t: number, anchor: number, decay = 0.2): number => {
  const a = beatIndexAt(anchor + BEAT / 2);
  const i = beatIndexAt(t);
  if (i < a) return 0;
  const k = a + Math.floor((i - a) / 4) * 4;
  return Math.exp(-(t - beats[k]) / decay);
};

export const energyAt = (t: number): number => {
  const { step, values } = TIMING.energy;
  const x = t / step;
  const i = Math.max(0, Math.min(values.length - 2, Math.floor(x)));
  const f = Math.min(1, Math.max(0, x - i));
  return values[i] * (1 - f) + values[i + 1] * f;
};

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 progress of t through [a, a+dur]. */
export const prog = (t: number, a: number, dur: number) => clamp01((t - a) / dur);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Deterministic pseudo-random in [0,1) from any number of seeds. */
export const rnd = (...seeds: (number | string)[]): number => {
  let h = 2166136261;
  for (const s of seeds) {
    const str = String(s);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0x9e3779b9;
  }
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= h >>> 16) >>> 0) / 4294967296;
};

/** Camera shake (px) from a list of hit times: decaying, deterministic jitter. */
export const shake = (t: number, hits: number[], amp: number, decay = 0.16): { x: number; y: number; r: number } => {
  let x = 0,
    y = 0,
    r = 0;
  for (const h of hits) {
    const d = t - h;
    if (d < 0 || d > decay * 6) continue;
    const k = amp * Math.exp(-d / decay);
    x += k * Math.sin(d * 97 + h * 13);
    y += k * Math.cos(d * 83 + h * 7);
    r += k * 0.02 * Math.sin(d * 61 + h);
  }
  return { x, y, r };
};

/** "Shouted" token: at least two letters, all caps (the lyrics' caps = shouting). */
export const isShout = (tok: string): boolean => {
  const letters = tok.replace(/[^A-Za-zÀ-ÿ]/g, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
};
