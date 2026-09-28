import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { frameT } from "../motion";
import { C } from "../theme";
import { FPS, kickPulse, rnd } from "../timing";

export type Cues = {
  strobes?: number[]; // ink-negative for 2 frames: the downbeat of a hook
  flashes?: number[]; // blood-red frame: AMPUTATE / OPERATE / BLOOD
  glitches?: number[]; // slice displacement for 3 frames: a rupture (the tear)
  punch?: number; // kick-driven zoom punch; 0 = off (default)
};

/**
 * Accents over a scene. Nothing here runs on its own: every hit is a cue the
 * scene declares for a reason (see each scene's `cues`).
 */
export const FX: React.FC<Cues & { children: React.ReactNode }> = ({ strobes = [], flashes = [], glitches = [], punch = 0, children }) => {
  const t = useT();
  const f = Math.round(t * FPS);
  const zoom = 1 + 0.06 * punch * kickPulse(t);
  const within = (list: number[], frames: number) =>
    list.some((x) => f >= Math.round(frameT(x) * FPS) && f < Math.round(frameT(x) * FPS) + frames);
  const strobe = within(strobes, 2);
  const glitch = within(glitches, 3);
  const flash = flashes.map((x) => t - frameT(x)).filter((d) => d >= 0 && d < 0.35);

  const inner = (
    <AbsoluteFill
      style={{
        transform: zoom !== 1 ? `scale(${zoom})` : undefined,
        filter: strobe ? "invert(1) sepia(1) saturate(1.6) contrast(1.5) brightness(0.85)" : undefined,
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
            return (
              <AbsoluteFill key={i} style={{ clipPath: `inset(${top}% 0 ${100 - top - 100 / 9}% 0)`, transform: `translateX(${(rnd("g", f, i) - 0.5) * 220}px)` }}>
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
