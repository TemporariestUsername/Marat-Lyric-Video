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

/** Camera state (image point at screen anchor, log scale) at time t. */
export const cameraAt = (id: string, keys: Key[], t: number): Cam => {
  let c = camFor(id, keys[0]);
  for (let i = 1; i < keys.length; i++) {
    const p = progress(t, keys[i], frameT(keys[i - 1].at));
    if (p <= 0) break;
    const n = camFor(id, keys[i]);
    c = {
      u: c.u + (n.u - c.u) * p,
      v: c.v + (n.v - c.v) * p,
      ls: c.ls + (n.ls - c.ls) * p,
      sx: c.sx + (n.sx - c.sx) * p,
      sy: c.sy + (n.sy - c.sy) * p,
    };
  }
  return c;
};

export const impactsOf = (keys: Key[]) => keys.filter((k) => k.impact).map((k) => k.at);

/**
 * A period print shot with an authored camera. `creep` is a slow, steady push
 * (fraction per second) that keeps a held frame alive without wandering.
 */
export const Shot: React.FC<{ id: string; keys: Key[]; creep?: number; dim?: number; children?: React.ReactNode }> = ({
  id,
  keys,
  creep = 0.012,
  dim = 0,
  children,
}) => {
  const t = useT();
  const e = img(id);
  const c = cameraAt(id, keys, t);
  const since = Math.max(0, t - frameT(keys[0].at));
  const s = Math.exp(c.ls) * (1 + creep * since);
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const x = clamp(c.sx * W - c.u * s, W - e.w * s, 0);
  const y = clamp(c.sy * H - c.v * s, H - e.h * s, 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.paper }}>
      <Img src={staticFile(`img/${id}.jpg`)} style={{ position: "absolute", left: x, top: y, width: e.w * s, height: e.h * s }} />
      {dim > 0 ? <AbsoluteFill style={{ backgroundColor: C.ink, opacity: dim }} /> : null}
      {children}
    </AbsoluteFill>
  );
};
