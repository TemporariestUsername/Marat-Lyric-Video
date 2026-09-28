import React from "react";
import { C } from "../theme";

/**
 * The falling part of the guillotine in silhouette: the weighted mouton with its
 * rope ring and bolts, and the oblique blade. viewBox 0..400 x 0..520; the
 * cutting edge runs from (20,500) up to (380,340).
 */
export const Blade: React.FC<{ width?: number; style?: React.CSSProperties; gleam?: number }> = ({
  width = 600,
  style,
  gleam = 0,
}) => (
  <svg width={width} height={width * 1.3} viewBox="0 0 400 520" style={{ position: "absolute", overflow: "visible", ...style }}>
    <g fill={C.ink}>
      {/* rope ring */}
      <path d="M200,0 a26,26 0 1 1 -0.1,0 Z M200,14 a12,12 0 1 0 0.1,0 Z" fillRule="evenodd" />
      <rect x={193} y={44} width={14} height={40} />
      {/* mouton (weight) */}
      <rect x={40} y={80} width={320} height={110} rx={6} />
      <rect x={26} y={92} width={14} height={86} />
      <rect x={360} y={92} width={14} height={86} />
      {/* blade: tall, with the oblique edge */}
      <path d="M30,190 H370 V330 L20,500 L20,190 Z" />
    </g>
    {/* bolts, cut through */}
    <g fill={C.paper} opacity={0.85}>
      {[80, 160, 240, 320].map((x) => (
        <circle key={x} cx={x} cy={215} r={8} />
      ))}
    </g>
    {/* a glint along the edge */}
    {gleam > 0 ? <path d="M20,500 L370,330" stroke={C.paperLight} strokeWidth={6} opacity={gleam} /> : null}
  </svg>
);

/** The uprights and cross-beam (static frame), viewBox 0..500 x 0..1200. */
export const GuillotineFrame: React.FC<{ width?: number; style?: React.CSSProperties }> = ({ width = 500, style }) => (
  <svg width={width} height={width * 2.4} viewBox="0 0 500 1200" style={{ position: "absolute", overflow: "visible", ...style }}>
    <g fill={C.ink}>
      <rect x={40} y={0} width={420} height={60} />
      <rect x={60} y={60} width={50} height={1100} />
      <rect x={390} y={60} width={50} height={1100} />
      <path d="M60,900 H440 V1000 H60 Z M250,950 m-45,0 a45,45 0 1 0 90,0 a45,45 0 1 0 -90,0" fillRule="evenodd" />
      <rect x={0} y={1150} width={500} height={50} />
    </g>
  </svg>
);
