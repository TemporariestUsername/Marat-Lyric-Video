// Motion primitives. The rule everywhere: an entrance ANTICIPATES its word, so
// the impact frame is the onset frame. Nothing lands late.
import { FPS, beatPulse, barPulse, energyAt, clamp01 } from "./timing";

/** Snap a time to the frame it will be drawn on. */
export const frameT = (t: number) => Math.round(t * FPS) / FPS;

/**
 * Arrival progress for something that must LAND at `onset`.
 * Returns 0 before (onset - lead), rises with an accelerating curve, is exactly
 * 1 on the onset frame, then rings out (damped) for `ring` seconds.
 *   p      0..1 travel (use for position/scale in)
 *   ring   signed overshoot after impact (use for squash/bounce), decays to 0
 *   hit    1 on impact decaying to 0 (use for flashes, shake)
 *   shown  false before the entrance starts
 */
export const arrive = (t: number, onset: number, lead = 0.12, ring = 0.35) => {
  const o = frameT(onset);
  if (t < o - lead) return { p: 0, ring: 0, hit: 0, shown: false };
  if (t < o) {
    const x = clamp01((t - (o - lead)) / lead);
    return { p: x * x * (2.2 - 1.2 * x), ring: 0, hit: 0, shown: true };
  }
  const d = t - o;
  const env = Math.exp(-d / (ring / 3));
  return { p: 1, ring: env * Math.cos(d * 38), hit: Math.exp(-d / 0.12), shown: true };
};

/** Leave: 0 until `at`, then accelerates to 1 over `dur`. */
export const depart = (t: number, at: number, dur = 0.22) => {
  const x = clamp01((t - frameT(at)) / dur);
  return x * x * x;
};

/** Smoothly go between successive keyed values, each settling ON its key time. */
export const keyed = (t: number, keys: { t: number; v: number }[], lead = 0.14): number => {
  if (!keys.length) return 0;
  let v = keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    const s = frameT(k.t) - lead;
    if (t <= s) break;
    const x = clamp01((t - s) / lead);
    const e = x < 1 ? 1 - Math.pow(1 - x, 3) : 1;
    v = v + (k.v - v) * e;
  }
  return v;
};

/** Continuous hand-held camera: slow drift + beat nudges + bar kicks, scaled by song energy. */
export const camera = (t: number, anchor: number, amt = 1) => {
  const e = 0.4 + 0.8 * energyAt(t);
  const bp = beatPulse(t, 0.14);
  const br = barPulse(t, anchor, 0.25);
  return {
    x: (Math.sin(t * 0.37) * 18 + Math.sin(t * 1.13) * 6) * amt,
    y: (Math.cos(t * 0.29) * 12 + Math.sin(t * 0.91) * 5) * amt - bp * 4 * e * amt,
    rot: (Math.sin(t * 0.21) * 0.8 + br * 0.5 * Math.sin(t * 7)) * amt,
    zoom: 1 + (0.012 * bp + 0.03 * br) * e * amt,
  };
};

export const cameraTransform = (c: { x: number; y: number; rot: number; zoom: number }) =>
  `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg) scale(${c.zoom})`;
