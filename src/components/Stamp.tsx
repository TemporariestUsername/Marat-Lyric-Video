import React from "react";
import { staticFile } from "remotion";
import { useT } from "../time";
import { arrive } from "../motion";
import { rnd } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";

/**
 * Rubber stamp that thumps down so it lands ON `at`: bordered, rotated,
 * grunge-masked ink, with a few spatter drops thrown on impact.
 */
export const Stamp: React.FC<{
  at: number;
  text: string;
  x: number;
  y: number;
  rot: number;
  size: number;
  color?: string;
  font?: string;
  seed?: string;
}> = ({ at, text, x, y, rot, size, color = C.bloodBright, font = F.didone, seed = "" }) => {
  const t = useT();
  const a = arrive(t, at, 0.1, 0.3);
  if (!a.shown) return null;
  const s = 1 + (1 - a.p) * 1.6 - a.hit * 0.06;
  const mx = Math.floor(rnd(seed, "mx") * 600);
  const my = Math.floor(rnd(seed, "my") * 300);
  const spatter =
    a.p >= 1
      ? Array.from({ length: 14 }, (_, i) => {
          const ang = rnd(seed, i, "a") * Math.PI * 2;
          const dist = size * (1.2 + rnd(seed, i, "d") * 2.4) * Math.min(1, (t - at) / 0.08 + 0.4);
          const r = 3 + rnd(seed, i, "r") * size * 0.09;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: Math.cos(ang) * dist - r,
                top: Math.sin(ang) * dist * 0.55 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: "50%",
                background: color,
                opacity: 0.85,
              }}
            />
          );
        })
      : null;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0 }}>
      {spatter}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
          opacity: Math.min(1, a.p * 2.5) * 0.95,
          color,
          fontFamily: font,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          whiteSpace: "nowrap",
          padding: `${size * 0.14}px ${size * 0.24}px ${size * 0.1}px`,
          border: `${Math.max(4, size * 0.07)}px solid ${color}`,
          borderRadius: size * 0.06,
          WebkitMaskImage: `url(${staticFile("tex/grunge.png")})`,
          WebkitMaskSize: "1024px 512px",
          WebkitMaskPosition: `-${mx}px -${my}px`,
          filter: a.hit > 0.05 ? `blur(${a.hit * 0.6}px)` : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};
