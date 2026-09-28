import React from "react";
import { C } from "../theme";

/**
 * An 18th-century wooden common press in silhouette, as in Diderot's
 * Encyclopédie plates: two cheeks, head and winter beams, the screw and platen,
 * the bar, and the carriage running through. `down` 0..1 lowers the platen onto
 * the forme (the bar swings with it). viewBox 0..1000 x 0..1000.
 */
export const Press: React.FC<{ down: number; sheet?: string; style?: React.CSSProperties; width?: number }> = ({
  down,
  sheet = C.paperLight,
  style,
  width = 800,
}) => {
  const platenY = 395 + down * 95;
  const barAngle = -8 + down * 38;
  return (
    <svg width={width} height={width} viewBox="0 0 1000 1000" style={{ position: "absolute", overflow: "visible", ...style }}>
      <g fill={C.ink}>
        {/* cap and head */}
        <rect x={180} y={60} width={640} height={50} rx={8} />
        <path d="M200,110 H800 V230 C760,250 240,250 200,230 Z" />
        {/* cheeks */}
        <rect x={215} y={40} width={80} height={880} />
        <rect x={705} y={40} width={80} height={880} />
        {/* cheek mouldings */}
        <rect x={205} y={300} width={100} height={22} />
        <rect x={695} y={300} width={100} height={22} />
        {/* winter (under the carriage) */}
        <rect x={190} y={640} width={620} height={70} />
        {/* feet */}
        <path d="M150,920 H350 L330,960 H170 Z" />
        <path d="M650,920 H850 L830,960 H670 Z" />
        {/* hose box and screw */}
        <rect x={455} y={230} width={90} height={Math.max(20, platenY - 290)} />
        <rect x={480} y={240} width={40} height={platenY - 240} />
        {/* platen */}
        <rect x={335} y={platenY} width={330} height={42} rx={4} />
        <rect x={355} y={platenY - 18} width={290} height={20} />
        {/* bar: pivots at the screw */}
        <g transform={`rotate(${barAngle} 500 270)`}>
          <rect x={500} y={262} width={420} height={16} rx={6} />
          <circle cx={930} cy={270} r={22} />
        </g>
        {/* carriage, rails, and the tympan frame hinged up at the back */}
        <rect x={-120} y={560} width={1240} height={34} />
        <rect x={-100} y={594} width={1200} height={12} />
        <path d="M-120,560 L-300,300 L-280,288 L-96,556 Z" />
        <path d="M-300,300 L-60,300 L-60,316 L-290,316 Z" />
        {/* legs of the carriage */}
        <rect x={-100} y={606} width={30} height={330} />
        <rect x={1080} y={606} width={30} height={330} />
      </g>
      {/* the sheet on the forme */}
      <rect x={330} y={544} width={340} height={16} fill={sheet} />
    </svg>
  );
};
