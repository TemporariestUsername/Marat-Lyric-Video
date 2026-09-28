import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { frameT } from "../motion";
import { easeIn, easeOut, prog } from "../timing";
import { C, W } from "../theme";

/**
 * The frame as a body. At `at` (AMPUTATE) it is cut clean across along a
 * slightly tilted seam and the upper part is wrenched away, leaving a black
 * gap. At `joinAt` (OPERATE) the halves are slammed back together and blood
 * stitches run along the seam, left to right.
 * `seam` = [y at left edge, y at right edge] in px.
 */
export const Cut: React.FC<{ at: number; joinAt?: number; seam: [number, number]; children: React.ReactNode }> = ({
  at,
  joinAt,
  seam,
  children,
}) => {
  const t = useT();
  const cut = frameT(at);
  if (t < cut) return <AbsoluteFill>{children}</AbsoluteFill>;
  const join = joinAt !== undefined ? frameT(joinAt) : Infinity;
  const open = easeOut(prog(t, cut, 0.14));
  const shut = t < join - 0.07 ? 0 : easeIn(prog(t, join - 0.07, 0.07));
  const sep = open * (1 - shut);
  const [yl, yr] = seam;
  const top = `polygon(0 0, 100% 0, 100% ${yr}px, 0 ${yl}px)`;
  const bot = `polygon(0 ${yl}px, 100% ${yr}px, 100% 100%, 0 100%)`;
  const stitchP = t >= join ? prog(t, join, 0.35) : 0;
  const n = 14;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night }}>
      <AbsoluteFill style={{ clipPath: top, transform: `translate(${-50 * sep}px, ${-95 * sep}px) rotate(${-1.6 * sep}deg)` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: bot, transform: `translate(${30 * sep}px, ${40 * sep}px)` }}>{children}</AbsoluteFill>
      {t >= join ? (
        <svg width={W} height={1080} style={{ position: "absolute", inset: 0 }}>
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
