import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { frameT } from "../motion";
import { TIMING, easeIn, easeOut, kickPulse, prog } from "../timing";
import { C, W } from "../theme";

/**
 * The frame as a body under the knife. At `at` (AMPUTATE) it is cut clean
 * across along a slightly tilted seam and the upper part (the heads) is
 * wrenched away, leaving a black gap that breathes on the kick. At `exciseAt`
 * (OPERATE) the surgeon takes the diseased part out: the upper part is lifted
 * out of the frame for good, and the body that remains (the people) is
 * cauterised along the margin and sutured on the drum hits.
 * `seam` = [y at left edge, y at right edge] in px.
 */
export const Cut: React.FC<{ at: number; exciseAt?: number; seam: [number, number]; children: React.ReactNode }> = ({
  at,
  exciseAt,
  seam,
  children,
}) => {
  const t = useT();
  const cut = frameT(at);
  if (t < cut) return <AbsoluteFill>{children}</AbsoluteFill>;
  const ex = exciseAt !== undefined ? frameT(exciseAt) : Infinity;
  const open = easeOut(prog(t, cut, 0.14));
  // while the wound is open it breathes on the kick
  const sep = open * (1 + 0.3 * kickPulse(t, 0.12));
  // the excision: a short lift (the surgeon grips it), then pulled clean out of frame
  const lift = t < ex ? 0 : easeIn(prog(t, ex - 0.02, 0.22));
  const [yl, yr] = seam;
  const top = `polygon(0 0, 100% 0, 100% ${yr}px, 0 ${yl}px)`;
  const bot = `polygon(0 ${yl}px, 100% ${yr}px, 100% 100%, 0 100%)`;
  // after the excision the body settles back to where it was, and the margin is closed
  const settle = t < ex ? 1 : 1 - easeOut(prog(t, ex, 0.18));
  const n = 14;
  const drumHits = [...TIMING.kicks, ...TIMING.snares].filter(([h]) => h >= ex && h <= t).length;
  const stitchP = t >= ex ? Math.min(1, (2 + 3 * drumHits) / n + prog(t, ex, 0.9) * 0.3) : 0;
  // the cautery: the margin burns bright on the cut, then cools to blood
  const burn = t >= ex ? Math.exp(-(t - ex) / 0.25) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      {lift < 1 ? (
        <AbsoluteFill
          style={{
            clipPath: top,
            transform: `translate(${-90 * sep - 160 * lift}px, ${-150 * sep - 1200 * lift}px) rotate(${-3.2 * sep - 9 * lift}deg)`,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ clipPath: bot, transform: `translate(${30 * sep * settle}px, ${40 * sep * settle}px)` }}>{children}</AbsoluteFill>
      {t >= ex ? (
        <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
          <line x1={0} y1={yl} x2={W} y2={yr} stroke={burn > 0.05 ? C.paperLight : C.bloodBright} strokeWidth={5 + 10 * burn} opacity={0.9} />
          <line x1={0} y1={yl} x2={W} y2={yr} stroke={C.bloodBright} strokeWidth={5} opacity={0.9} />
          {Array.from({ length: n }, (_, i) => {
            if (i / n > stitchP) return null;
            const x = ((i + 0.5) / n) * W;
            const y = yl + ((yr - yl) * x) / W;
            return (
              <g key={i} stroke={C.bloodBright} strokeWidth={7} strokeLinecap="round">
                <line x1={x - 22} y1={y - 26} x2={x + 22} y2={y + 26} />
                <line x1={x + 22} y1={y - 26} x2={x - 22} y2={y + 26} />
              </g>
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
