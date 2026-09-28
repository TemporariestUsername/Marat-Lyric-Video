import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { frameT } from "../motion";
import { C } from "../theme";
import { FPS, energyAt, kickPulse, rnd, snarePulse } from "../timing";

/**
 * The energy layer over a scene. Everything is driven by the drum stem and the
 * lyric timing:
 *   kick   -> camera punch (zoom) and a jolt
 *   snare  -> shake
 *   strobe -> ink negative for 2 frames (shouted words)
 *   glitch -> the frame slices into offset strips for 3 frames (line changes)
 *   flash  -> a blood-red frame (blood words)
 * plus a constant gate-weave and exposure flicker. `amount` scales it all.
 */
export const FX: React.FC<{
  amount: number;
  strobes?: number[];
  glitches?: number[];
  flashes?: number[];
  children: React.ReactNode;
}> = ({ amount, strobes = [], glitches = [], flashes = [], children }) => {
  const t = useT();
  const f = Math.round(t * FPS);
  const e = 0.5 + energyAt(t);
  const k = kickPulse(t) * amount * e;
  const s = snarePulse(t) * amount * e;
  const zoom = 1 + 0.07 * k;
  const jx = (rnd("jx", f) - 0.5) * 26 * s + (rnd("wx", Math.floor(f / 2)) - 0.5) * 3 * amount;
  const jy = (rnd("jy", f) - 0.5) * 26 * s - 10 * k + (rnd("wy", Math.floor(f / 2)) - 0.5) * 3 * amount;
  const rot = (rnd("jr", f) - 0.5) * 1.6 * s;
  const within = (list: number[], frames: number) => list.some((x) => f >= Math.round(frameT(x) * FPS) && f < Math.round(frameT(x) * FPS) + frames);
  const strobe = amount > 0 && within(strobes, 2);
  const glitch = amount > 0 && within(glitches, 3);
  const flash = flashes.map((x) => t - frameT(x)).filter((d) => d >= 0 && d < 0.35);
  const flicker = 1 + (rnd("fl", f) - 0.5) * 0.06 * amount;

  const inner = (
    <AbsoluteFill
      style={{
        transform: `translate(${jx}px, ${jy}px) rotate(${rot}deg) scale(${zoom})`,
        filter: `brightness(${flicker})${strobe ? " invert(1) sepia(1) saturate(1.6) contrast(1.5) brightness(0.85)" : ""}`,
      }}
    >
      {children}
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: C.night }}>
      {glitch
        ? Array.from({ length: 9 }, (_, i) => {
            const top = (i / 9) * 100;
            const off = (rnd("g", f, i) - 0.5) * 220 * amount;
            return (
              <AbsoluteFill key={i} style={{ clipPath: `inset(${top}% 0 ${100 - top - 100 / 9}% 0)`, transform: `translateX(${off}px)` }}>
                {inner}
              </AbsoluteFill>
            );
          })
        : inner}
      {flash.length ? (
        <AbsoluteFill style={{ backgroundColor: C.bloodBright, mixBlendMode: "multiply", opacity: 0.85 * Math.exp(-Math.min(...flash) / 0.12) }} />
      ) : null}
    </AbsoluteFill>
  );
};
