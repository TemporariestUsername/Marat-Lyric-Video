import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useT } from "../time";
import { Box, img } from "../images";
import { frameT } from "../motion";
import { C, H, W } from "../theme";
import layerIndex from "../../public/img/layers-index.json";

// parallax layers exist only for clear, single human figures (tools/make_layers.sh)
const LAYERS = layerIndex as Record<string, { n: number; method: string }>;

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
  parallax?: number; // depth separation of the print's layers (0 = flat); needs tools/layers.py output
  drift?: [number, number]; // px/s the nearest layer drifts, so depth shows even on a hold
  between?: React.ReactNode; // drawn behind the nearest layer (type the foreground passes in front of)
  children?: React.ReactNode;
}> = ({ id, keys, creep = 0.012, dim = 0, nudge = [0, 0, 0], parallax = 0, drift = [-44, -6], between, children }) => {
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
  const n = parallax > 0 && LAYERS[id]?.method === "cut" ? LAYERS[id].n : 1;
  // parallax reference: the camera as it was at the last cut (a cut resets depth)
  const lastKey = [...keys].reverse().find((k) => frameT(k.at) <= t && (k.ease === "cut" || k === keys[0])) ?? keys[0];
  const t0 = frameT(lastKey.at);
  const ref = place(t0);
  const since = Math.max(0, t - t0);
  const layerBox = (d: number) => {
    // nearer layers move further and scale faster than the camera
    // the separation is small and capped however big the camera move, so a
    // figure never slides out of register with its own picture
    const k = parallax * d;
    const cap = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    const z = Math.max(0.95, Math.min(1.05, Math.pow(now.s / ref.s, k * 0.5)));
    const cx = W / 2,
      cy = H / 2;
    const s2 = now.s * z;
    const x = cx - (cx - now.x) * z + cap((now.x - ref.x) * k + drift[0] * since * d, 70);
    const y = cy - (cy - now.y) * z + cap((now.y - ref.y) * k + drift[1] * since * d, 45);
    return { x, y, s: s2 * (1 + 0.012 * d) };
  };
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.paper }}>
      <AbsoluteFill style={{ transform: roll ? `rotate(${roll}deg) scale(${1 + Math.abs(roll) * 0.012})` : undefined }}>
        {n === 1 ? (
          <>
            {ghosts.map((g, i) => (
              <Img key={i} src={src} style={{ position: "absolute", left: g.x, top: g.y, width: e.w * g.s, height: e.h * g.s, opacity: 0.26 - i * 0.1 }} />
            ))}
            <Img src={src} style={{ position: "absolute", left: now.x, top: now.y, width: e.w * now.s, height: e.h * now.s, opacity: ghosts.length ? 0.86 : 1 }} />
          </>
        ) : (
          Array.from({ length: n }, (_, d) => {
            const b = d === 0 ? now : layerBox(d);
            const file = staticFile(`img/layers/${id}_${d}.${d === 0 ? "jpg" : "png"}`);
            return (
              <React.Fragment key={d}>
                {d === n - 1 && between ? (
                  <AbsoluteFill>
                    {dim > 0 ? <AbsoluteFill style={{ backgroundColor: C.ink, opacity: dim }} /> : null}
                    {between}
                  </AbsoluteFill>
                ) : null}
                <Img
                  src={file}
                  style={{
                    position: "absolute",
                    left: b.x,
                    top: b.y,
                    width: e.w * b.s,
                    height: e.h * b.s,
                    // the nearest layer casts a soft shadow onto what is behind it
                    filter: d > 0 ? `drop-shadow(${10 * d}px ${14 * d}px ${12 * d}px rgba(10,6,3,0.4))${d === n - 1 && between ? ` brightness(${1 - dim * 0.8})` : ""}` : undefined,
                  }}
                />
              </React.Fragment>
            );
          })
        )}
      </AbsoluteFill>
      {dim > 0 && !(n > 1 && between) ? <AbsoluteFill style={{ backgroundColor: C.ink, opacity: dim }} /> : null}
      {children}
    </AbsoluteFill>
  );
};
