import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Face, widthOf } from "./Kinetic";
import { C, H, W } from "../theme";
import { img } from "../images";

/**
 * A real 3D stage in CSS: a perspective camera flying through a world of
 * type and prints. Units are px; y points down, z points at the viewer, the
 * camera looks along -z when its rotation is zero.
 *
 * Camera pose: position p, and rotation r = [pitch, yaw, roll] in degrees
 * (positive pitch looks down, positive yaw looks right, positive roll banks
 * clockwise).
 */
export type V3 = [number, number, number];
export type Pose = { p: V3; r: V3; fov?: number };
export type CamKey = Pose & { t: number; ease?: "inout" | "out" | "in" | "linear" };

const ease = (e: CamKey["ease"], x: number) =>
  e === "linear" ? x : e === "in" ? x * x * x : e === "out" ? 1 - Math.pow(1 - x, 3) : x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/** Camera pose at t: each key is reached at its time, easing from the previous key. */
export const camAt = (keys: CamKey[], t: number): Pose => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1],
      b = keys[i];
    if (t <= b.t) {
      const k = ease(b.ease, (t - a.t) / Math.max(1e-4, b.t - a.t));
      return { p: lerp3(a.p, b.p, k), r: lerp3(a.r, b.r, k), fov: lerp(a.fov ?? 50, b.fov ?? 50, k) };
    }
  }
  return keys[keys.length - 1];
};

/** A camera key authored as "stand here, look at that" (plus roll). */
export type LookKey = { t: number; p: V3; at: V3; roll?: number; fov?: number; ease?: CamKey["ease"] };
const DEG = 180 / Math.PI;
const look = (p: V3, at: V3, roll = 0, fov = 50): Pose => {
  const dx = at[0] - p[0],
    dy = at[1] - p[1],
    dz = at[2] - p[2];
  return { p, r: [Math.atan2(dy, Math.hypot(dx, dz)) * DEG, Math.atan2(dx, -dz) * DEG, roll], fov };
};
/** Camera at t from look-at keys: position and target are eased separately, then aimed. */
export const lookAt = (keys: LookKey[], t: number): Pose => {
  if (t <= keys[0].t) return look(keys[0].p, keys[0].at, keys[0].roll, keys[0].fov);
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1],
      b = keys[i];
    if (t <= b.t) {
      const k = ease(b.ease, (t - a.t) / Math.max(1e-4, b.t - a.t));
      return look(lerp3(a.p, b.p, k), lerp3(a.at, b.at, k), lerp(a.roll ?? 0, b.roll ?? 0, k), lerp(a.fov ?? 50, b.fov ?? 50, k));
    }
  }
  const z = keys[keys.length - 1];
  return look(z.p, z.at, z.roll, z.fov);
};

export const Stage: React.FC<{ cam: Pose; shake?: [number, number]; children: React.ReactNode }> = ({ cam, shake = [0, 0], children }) => {
  const fov = cam.fov ?? 50;
  const persp = H / 2 / Math.tan((fov * Math.PI) / 360);
  const [x, y, z] = cam.p;
  const [pitch, yaw, roll] = cam.r;
  return (
    <AbsoluteFill style={{ perspective: persp, perspectiveOrigin: `${W / 2 + shake[0]}px ${H / 2 + shake[1]}px`, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: H / 2,
          width: 0,
          height: 0,
          transformStyle: "preserve-3d",
          transform: `translateZ(${persp}px) rotateZ(${-roll}deg) rotateX(${-pitch}deg) rotateY(${yaw}deg) translate3d(${-x}px, ${-y}px, ${-z}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** An object placed in the world: position, rotation (deg, X then Y then Z), scale. Children are centred on it. */
export const Obj: React.FC<{ p: V3; r?: V3; s?: number; flipY?: boolean; opacity?: number; children: React.ReactNode }> = ({ p, r = [0, 0, 0], s = 1, flipY, opacity, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      transformStyle: "preserve-3d",
      opacity,
      transform: `translate3d(${p[0]}px, ${p[1]}px, ${p[2]}px) rotateX(${r[0]}deg) rotateY(${r[1]}deg) rotateZ(${r[2]}deg) scale3d(${s}, ${flipY ? -s : s}, ${s})`,
    }}
  >
    {children}
  </div>
);

/**
 * A word with thickness: the glyphs are stacked `layers` deep behind the face
 * (darker toward the back), so turning the word shows its sides, like a
 * piece of type. `anchor` is where (0,0) sits on the word: centre or left.
 */
export const Word3D: React.FC<{
  text: string;
  face: Face;
  depth?: number;
  layers?: number;
  color?: string;
  side?: string;
  style?: React.CSSProperties;
  anchor?: "center" | "left";
  mirror?: boolean;
}> = ({ text, face, depth = 0, layers = 6, color = C.paperLight, side = "#3a2f22", style, anchor = "center", mirror }) => {
  const w = widthOf(text, face);
  const base: React.CSSProperties = {
    position: "absolute",
    left: anchor === "center" ? -w / 2 : 0,
    top: -face.size * 0.62,
    whiteSpace: "pre",
    fontFamily: face.family,
    fontSize: face.size,
    fontWeight: face.weight ?? 400,
    fontStyle: face.italic ? "italic" : "normal",
    lineHeight: 1.24,
    transformOrigin: `${w / 2}px ${face.size * 0.62}px`,
  };
  const n = depth > 0 ? layers : 0;
  return (
    <div style={{ position: "absolute", transformStyle: "preserve-3d", transform: mirror ? "scaleX(-1)" : undefined }}>
      {Array.from({ length: n }, (_, k) => (
        <div key={k} style={{ ...base, color: side, transform: `translateZ(${-depth * ((n - k) / n)}px)`, opacity: 0.95 }}>
          {text}
        </div>
      ))}
      <div style={{ ...base, color, ...style }}>{text}</div>
    </div>
  );
};

/** A print hanging in the world as a plane, `w` px wide, darkened by `dim`. */
export const Plane: React.FC<{ id: string; w: number; dim?: number; blur?: number; crop?: [number, number, number, number] }> = ({ id, w, dim = 0.4, blur = 0, crop }) => {
  const e = img(id);
  const [x0, y0, x1, y1] = crop ?? [0, 0, 1, 1];
  const cw = (x1 - x0) * e.w,
    ch = (y1 - y0) * e.h;
  const s = w / cw;
  const h = ch * s;
  return (
    <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, overflow: "hidden", backgroundColor: C.night }}>
      <Img src={staticFile(`img/${id}.jpg`)} style={{ position: "absolute", left: -x0 * e.w * s, top: -y0 * e.h * s, width: e.w * s, height: e.h * s, filter: blur ? `blur(${blur}px)` : undefined }} />
      {dim > 0 ? <div style={{ position: "absolute", inset: 0, background: C.ink, opacity: dim }} /> : null}
    </div>
  );
};

/** A flat coloured rectangle in the world (a sheet, a rule, a stick, water). */
export const Rect: React.FC<{ w: number; h: number; style?: React.CSSProperties }> = ({ w, h, style }) => (
  <div style={{ position: "absolute", left: -w / 2, top: -h / 2, width: w, height: h, ...style }} />
);
