import React from "react";
import { C } from "../theme";
import { F } from "../fonts";

/**
 * The paper's nameplate, after Marat's own: "L'AMI DU PEUPLE, ou le Publiciste
 * parisien … Par M. Marat", motto "Vitam impendere vero", set in Fell types.
 */
export const Masthead: React.FC<{ issue: string; date: string; style?: React.CSSProperties }> = ({ issue, date, style }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: 40, color: C.ink, textAlign: "center", ...style }}>
    <div style={{ margin: "0 110px", borderTop: `3px solid ${C.ink}`, borderBottom: `1px solid ${C.ink}`, height: 5 }} />
    <div style={{ display: "flex", justifyContent: "space-between", margin: "8px 116px 0", fontFamily: F.fell, fontStyle: "italic", fontSize: 26 }}>
      <span>{issue}</span>
      <span style={{ fontFamily: F.fellSC, fontStyle: "normal", letterSpacing: "0.2em", fontSize: 22 }}>Vitam impendere vero</span>
      <span>{date}</span>
    </div>
    <div style={{ fontFamily: F.fellSC, fontSize: 132, lineHeight: 1.05, letterSpacing: "0.03em" }}>L'Ami du Peuple</div>
    <div style={{ fontFamily: F.fell, fontStyle: "italic", fontSize: 26, letterSpacing: "0.06em" }}>
      ou le Publiciste parisien, journal politique et impartial, par M. Marat
    </div>
    <div style={{ margin: "10px 110px 0", borderTop: `1px solid ${C.ink}`, borderBottom: `3px solid ${C.ink}`, height: 5 }} />
  </div>
);
