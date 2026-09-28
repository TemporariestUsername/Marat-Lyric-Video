import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useT } from "../time";
import { Box, img } from "../images";
import { C, H, W } from "../theme";

/**
 * A period print filling the frame. The camera frames `focus` (fractions of
 * the image) and keeps creeping in over the shot (`t0`..`t1`); `push` adds a
 * punch-in, `drift` a sideways travel. `dim` darkens it under type.
 */
export const Plate: React.FC<{
  id: string;
  focus?: Box;
  t0: number;
  t1: number;
  push?: number;
  drift?: number;
  dim?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}> = ({ id, focus = [0, 0, 1, 1], t0, t1, push = 0, drift = 0, dim = 0, flip = false, style }) => {
  const t = useT();
  const e = img(id);
  const p = Math.min(1, Math.max(0, (t - t0) / Math.max(0.2, t1 - t0)));
  const fw = (focus[2] - focus[0]) * e.w;
  const fh = (focus[3] - focus[1]) * e.h;
  const cover = Math.max(W / e.w, H / e.h);
  const s = Math.max(cover, Math.max(W / fw, H / fh)) * (1 + 0.1 * p + push);
  const cx = ((focus[0] + focus[2]) / 2) * e.w;
  const cy = ((focus[1] + focus[3]) / 2) * e.h;
  // keep the image covering the frame while centring the focus
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const x = clamp(W / 2 - cx * s + drift * (p - 0.5) * 120, W - e.w * s, 0);
  const y = clamp(H / 2 - cy * s, H - e.h * s, 0);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.paper, ...style }}>
      <Img
        src={staticFile(`img/${id}.jpg`)}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: e.w * s,
          height: e.h * s,
          transform: flip ? "scaleX(-1)" : undefined,
        }}
      />
      {dim > 0 ? <AbsoluteFill style={{ backgroundColor: C.ink, opacity: dim }} /> : null}
    </AbsoluteFill>
  );
};
