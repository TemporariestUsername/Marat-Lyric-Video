import React from "react";
import { C } from "../theme";

/**
 * Jean-Paul Marat in profile silhouette, in the vinegar-soaked kerchief he
 * wore knotted round his head, knot and tails at the back. Faces right.
 * viewBox 0..700 x 0..900. The head pivots at the neck (`nod`, degrees,
 * + = forward/down, for headbanging); the jaw hinges open at the ear (`jaw`
 * 0..1) to scream. Thin paper-coloured cuts mark the kerchief's edge and the eye.
 */
export const Marat: React.FC<{
  nod?: number;
  jaw?: number;
  width?: number;
  flip?: boolean;
  color?: string;
  cut?: string;
  style?: React.CSSProperties;
}> = ({ nod = 0, jaw = 0, width = 700, flip = false, color = C.ink, cut = C.paper, style }) => (
  <svg
    width={width}
    height={(width * 900) / 700}
    viewBox="0 0 700 900"
    style={{ position: "absolute", overflow: "visible", transform: flip ? "scaleX(-1)" : undefined, ...style }}
  >
    <g fill={color}>
      {/* shoulders and chest, the classic bust cut, with a coat collar */}
      <path d="M60,900 C60,810 110,745 230,712 L300,700 L420,706 C500,730 560,780 590,850 L600,900 Z" />
      {/* neck */}
      <path d="M270,470 C300,560 290,660 275,712 L425,712 C420,670 422,620 440,560 L420,480 Z" />
      <g transform={`rotate(${nod} 350 640)`}>
        {/* skull and face down to the mouth: brow, eye notch, aquiline nose, upper lip */}
        <path
          d="M360,500 L505,488 L532,474 L524,458 C540,455 560,448 568,436
             C560,410 540,380 512,354 L500,346 C508,338 510,326 504,312
             C498,270 488,240 470,220 C430,150 330,120 250,160
             C180,200 160,300 190,400 C205,450 230,520 280,560 L330,570 Z"
        />
        {/* jaw: lower lip, chin, jawline, hinged at the ear */}
        <g transform={`rotate(${jaw * 19} 350 492)`}>
          <path d="M350,492 L505,490 L528,502 L512,516 C526,530 530,552 518,572 C500,596 440,604 400,598 C370,592 340,570 330,540 Z" />
        </g>
        {/* the kerchief: over the skull from above the brow, knotted at the back */}
        <path d="M488,280 C470,190 380,120 280,140 C200,160 160,230 170,320 C220,290 380,262 488,280 Z" />
        <path d="M178,318 C150,300 118,304 104,326 C98,348 118,366 148,358 C160,354 176,344 186,334 Z" />
        <path d="M118,344 C88,392 80,460 94,532 L118,528 C110,468 118,410 142,360 Z" />
        <path d="M140,354 C128,410 132,478 152,540 L174,534 C160,480 158,420 164,364 Z" />
        {/* the kerchief's edge and the eye, cut through to the paper */}
        <path d="M488,282 C380,262 230,286 172,322" fill="none" stroke={cut} strokeWidth={6} strokeLinecap="round" />
        <path d="M466,338 C478,330 492,332 500,342 C488,340 478,342 468,348 Z" fill={cut} />
      </g>
    </g>
  </svg>
);
