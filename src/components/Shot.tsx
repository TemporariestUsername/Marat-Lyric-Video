import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useT } from "../time";
import { Box, img } from "../images";
import { frameT } from "../motion";
import { C, H, W } from "../theme";

/**
 * How the camera gets to a keyframe. Every move ARRIVES on its time (a word
 * onset), so the frame settles exactly when the word lands.
 *   cut    jump on the onset
 *   snap   fast move in the last ~4 frames before the onset
 *   drop   accelerating fall over 0.3 s, hard stop on the onset (the blade)
 *   glide  eased move from the previous keyframe to this one
 *   dolly  constant-speed move from the previous keyframe (a tracking shot)
 */
export type Ease = "cut" | "snap" | "drop" | "glide" | "dolly";
export type Key = {
  at: number;
  box: Box; // region of the print to frame (fractions of the image)
  ease?: Ease;
  sx?: number; // where the box centre sits on screen (0..1); default centre
  sy?: number;
  impact?: boolean; // the arrival is a hit (scene adds a shake)
};

type Cam = { u: number; v: number; ls: number; sx: number; sy: number };

const camFor = (id: string, k: Key): Cam => {
  const e = img(id);
  const fw = (k.box[2] - k.box[0]) * e.w;
  const fh = (k.box[3] - k.box[1]) * e.h;
  const cover = Math.max(W / e.w, H / e.h);
  const s = Math.max(cover, Math.min(W / fw, H / fh)); // show the whole box, never less than cover
  return {
    u: ((k.box[0] + k.box[2]) / 2) * e.w,
    v: ((k.box[1] + k.box[3]) / 2) * e.h,
    ls: Math.log(s),
    sx: k.sx ?? 0.5,
    sy: k.sy ?? 0.5,
  };
};

const progress = (t: number, k: Key, prevAt: number): number => {
  const at = frameT(k.at);
  switch (k.ease ?? "snap") {
    case "cut":
      return t >= at ? 1 : 0;
    case "snap": {
      const x = Math.min(1, Math.max(0, (t - (at - 0.14)) / 0.14));
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
    case "drop": {
      const x = Math.min(1, Math.max(0, (t - (at - 0.3)) / 0.3));
      return Math.pow(x, 2.6);
    }
    case "dolly":
      return Math.min(1, Math.max(0, (t - prevAt) / Math.max(0.05, at - prevAt)));
    case "glide": {
      const x = Math.min(1, Math.max(0, (t - prevAt) / Math.max(0.05, at - prevAt)));
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
  }
};

const lerpCam = (a: Cam, b: Cam, p: number): Cam => ({
  u: a.u + (b.u - a.u) * p,
  v: a.v + (b.v - a.v) * p,
  ls: a.ls + (b.ls - a.ls) * p,
  sx: a.sx + (b.sx - a.sx) * p,
  sy: a.sy + (b.sy - a.sy) * p,
});

/**
 * Camera state (image point at screen anchor, log scale) at time t.
 * Moves carry weight:
 *  - snap/drop land ~5% past the target on the onset and spring back;
 *  - after any move the camera keeps travelling the same way, decaying,
 *    until the next move takes over (follow-through, never a dead stop,
 *    except the drop, which is meant to stop dead).
 */
export const cameraAt = (id: string, keys: Key[], t: number): Cam => {
  let c = camFor(id, keys[0]);
  let last: { from: Cam; to: Cam; at: number; ease: Ease; dur: number } | null = null;
  for (let i = 1; i < keys.length; i++) {
    const prevAt = frameT(keys[i - 1].at);
    const p = progress(t, keys[i], prevAt);
    if (p <= 0) break;
    const n = camFor(id, keys[i]);
    const ease = keys[i].ease ?? "snap";
    const dur = ease === "snap" ? 0.14 : ease === "drop" ? 0.3 : ease === "cut" ? 0 : Math.max(0.05, frameT(keys[i].at) - prevAt);
    last = { from: c, to: n, at: frameT(keys[i].at), ease, dur };
    c = lerpCam(c, n, p);
  }
  if (last && t > last.at && last.ease !== "cut") {
    const d = t - last.at;
    if (last.ease === "snap" || last.ease === "drop") {
      // overshoot and settle
      const o = 0.06 * Math.exp(-d / 0.09) * Math.cos(d * 22);
      c = lerpCam(c, last.to, 1 + o);
    }
    if (last.ease !== "drop") {
      // follow-through: keep drifting along the travel direction
      const k = (0.18 * (1 - Math.exp(-d / 0.6))) / Math.max(0.3, last.dur * 2);
      c = { ...c, u: c.u + (last.to.u - last.from.u) * k, v: c.v + (last.to.v - last.from.v) * k, ls: c.ls + (last.to.ls - last.from.ls) * k * 0.5 };
    }
  }
  return c;
};

/** Roll into the move: after an impact the frame is tilted toward the travel direction, then rights itself. */
const rollAt = (id: string, keys: Key[], t: number): number => {
  let r = 0;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (!k.impact) continue;
    const d = t - frameT(k.at);
    if (d < -0.1 || d > 0.8) continue;
    const a = camFor(id, keys[i - 1]),
      b = camFor(id, k);
    const dir = Math.sign(b.u - a.u) || Math.sign(b.ls - a.ls) || 1;
    r += dir * 2.4 * (d < 0 ? (d + 0.1) / 0.1 : Math.exp(-d / 0.18));
  }
  return r;
};

export const impactsOf = (keys: Key[]) => keys.filter((k) => k.impact).map((k) => k.at);

/**
 * A period print shot with an authored camera. `creep` is a slow, steady push
 * (fraction per second) that keeps a held frame alive without wandering.
 */
export const Shot: React.FC<{
  id: string;
  keys: Key[];
  creep?: number;
  dim?: number;
  nudge?: [number, number, number]; // external push (px, px, zoom fraction), e.g. a drum surge
  children?: React.ReactNode;
}> = ({ id, keys, creep = 0.012, dim = 0, nudge = [0, 0, 0], children }) => {
  const t = useT();
  const e = img(id);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const place = (tt: number) => {
    const c = cameraAt(id, keys, tt);
    const since = Math.max(0, tt - frameT(keys[0].at));
    const s = Math.exp(c.ls) * (1 + creep * since) * (1 + nudge[2]);
    return {
      s,
      x: clamp(c.sx * W - c.u * s + nudge[0], W - e.w * s, 0),
      y: clamp(c.sy * H - c.v * s + nudge[1], H - e.h * s, 0),
    };
  };
  const now = place(t);
  // speed trails: ghosts of the last two frames, only while the camera is really moving
  const ghosts = [1, 2].map((k) => place(t - k / 30)).filter((g) => Math.hypot(g.x - now.x, g.y - now.y) + Math.abs(g.s / now.s - 1) * 900 > 14);
  const roll = rollAt(id, keys, t);
  const src = staticFile(`img/${id}.jpg`);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.paper }}>
      <AbsoluteFill style={{ transform: roll ? `rotate(${roll}deg) scale(${1 + Math.abs(roll) * 0.012})` : undefined }}>
        {ghosts.map((g, i) => (
          <Img key={i} src={src} style={{ position: "absolute", left: g.x, top: g.y, width: e.w * g.s, height: e.h * g.s, opacity: 0.26 - i * 0.1 }} />
        ))}
        <Img src={src} style={{ position: "absolute", left: now.x, top: now.y, width: e.w * now.s, height: e.h * now.s, opacity: ghosts.length ? 0.86 : 1 }} />
      </AbsoluteFill>
      {dim > 0 ? <AbsoluteFill style={{ backgroundColor: C.ink, opacity: dim }} /> : null}
      {children}
    </AbsoluteFill>
  );
};
