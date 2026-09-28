import React from "react";
import { C } from "../theme";
import { F } from "../fonts";

/**
 * The paper's nameplate, after Marat's own: "L'AMI DU PEUPLE, ou le Publiciste
 * parisien … Par M. Marat", motto "Vitam impendere vero".
 * `reveal` 0..1 prints the title letter by letter; `issue`/`date` change per section.
 */
export const Masthead: React.FC<{
  reveal?: number;
  issue: string;
  date: string;
  y?: number;
  scale?: number;
  color?: string;
}> = ({ reveal = 1, issue, date, y = 40, scale = 1, color = C.ink }) => {
  const title = "L'AMI DU PEUPLE";
  const shown = Math.floor(title.length * Math.min(1, reveal) + 0.0001);
  const sub = reveal >= 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: "50% 0",
        color,
        textAlign: "center",
      }}
    >
      <div style={{ margin: "0 90px", borderTop: `3px solid ${color}`, borderBottom: `1px solid ${color}`, height: 5, opacity: reveal > 0 ? 1 : 0 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "8px 96px 0",
          fontFamily: F.caslon,
          fontStyle: "italic",
          fontSize: 22,
          opacity: sub ? 1 : 0,
        }}
      >
        <span>{issue}</span>
        <span style={{ fontStyle: "normal", letterSpacing: "0.25em", fontSize: 18 }}>VITAM IMPENDERE VERO</span>
        <span>{date}</span>
      </div>
      <div style={{ fontFamily: F.didone, fontWeight: 900, fontSize: 128, lineHeight: 1.02, letterSpacing: "0.04em", marginTop: 2 }}>
        {title.split("").map((ch, i) => (
          <span key={i} style={{ opacity: i < shown ? 1 : 0 }}>
            {ch}
          </span>
        ))}
      </div>
      <div style={{ fontFamily: F.caslon, fontSize: 21, letterSpacing: "0.18em", opacity: sub ? 1 : 0, marginTop: 2 }}>
        OU LE PUBLICISTE PARISIEN · JOURNAL POLITIQUE ET IMPARTIAL · PAR M. MARAT
      </div>
      <div style={{ margin: "10px 90px 0", borderTop: `1px solid ${color}`, borderBottom: `3px solid ${color}`, height: 5, opacity: sub ? 1 : 0 }} />
    </div>
  );
};
