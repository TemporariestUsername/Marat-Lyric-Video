import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import "./fonts";
import { F } from "./fonts";
import { C, H, W } from "./theme";
import { img } from "./images";
import { Finish } from "./components/Finish";
import { engraved } from "./components/Kinetic";

/**
 * Style frames: finished stills of hero moments, for approval before a
 * section is built. Lyrics are set exactly as in lyrics.txt.
 */

// a plate framed so the image point (u, v) (fractions) sits at screen (sx, sy), at `zoom` x cover
const Plate: React.FC<{ id: string; u: number; v: number; sx: number; sy: number; zoom: number; style?: React.CSSProperties }> = ({ id, u, v, sx, sy, zoom, style }) => {
  const e = img(id);
  const s = Math.max(W / e.w, H / e.h) * zoom;
  const x = Math.min(0, Math.max(W - e.w * s, sx * W - u * e.w * s));
  const y = Math.min(0, Math.max(H - e.h * s, sy * H - v * e.h * s));
  return <Img src={staticFile(`img/${id}.jpg`)} style={{ position: "absolute", left: x, top: y, width: e.w * s, height: e.h * s, ...style }} />;
};

const lit: React.CSSProperties = { color: C.paperLight, textShadow: `0 0 30px rgba(255,190,110,0.35), 0 0 4px ${C.ink}` };

// Verse 1: "wrote by sewer-light in filth and shadow"
const Sewer: React.FC = () => {
  // candle at about (0.37, 0.5) of the plate; we frame it left of centre
  const cx = 0.24 * W,
    cy = 0.5 * H;
  return (
    <Finish grain={0.28} vignette={0.7}>
      <Plate id="sewer_writing" u={0.37} v={0.5} sx={0.24} sy={0.5} zoom={1.12} />
      {/* the only light is the candle: everything else falls into the dark */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(14,10,7,0) 0px, rgba(14,10,7,0.15) 220px, rgba(14,10,7,0.72) 620px, rgba(14,10,7,0.93) 1100px)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(255,196,120,0.55) 0px, rgba(255,170,90,0.18) 160px, rgba(0,0,0,0) 420px)`, mixBlendMode: "screen" }} />
      {/* the line, lit by the candle, falling off into the tunnel */}
      <div style={{ position: "absolute", left: 1180, top: 330, width: 720, fontFamily: F.fell, fontStyle: "italic", lineHeight: 0.95 }}>
        <div style={{ fontSize: 96, ...lit, opacity: 0.9 }}>wrote by</div>
        <div style={{ fontSize: 150, ...lit, marginLeft: -30 }}>sewer-light</div>
        <div style={{ fontSize: 76, marginTop: 40, marginLeft: 120, ...lit, opacity: 0.75 }}>in filth</div>
        <div style={{ fontSize: 76, marginLeft: 280, ...lit, opacity: 0.4 }}>and shadow</div>
      </div>
    </Finish>
  );
};

// Verse 1 opening: "Born again nightly in the printed word,"
const Press: React.FC = () => (
  <Finish grain={0.22} vignette={0.55}>
    <Plate id="press_room" u={0.53} v={0.42} sx={0.5} sy={0.5} zoom={1.25} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(14,10,7,0.1) 0%, rgba(14,10,7,0) 40%, rgba(14,10,7,0.55) 75%, rgba(14,10,7,0.85) 100%)" }} />
    {/* a fresh sheet off the press fills the lower frame, the line printed on it */}
    <div
      style={{
        position: "absolute",
        left: 210,
        top: 650,
        width: 1500,
        height: 360,
        backgroundColor: C.paperLight,
        transform: "rotate(-2.2deg)",
        boxShadow: "0 30px 60px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ fontFamily: F.fellSC, fontSize: 30, letterSpacing: "0.35em", color: C.inkSoft, borderBottom: `2px solid ${C.inkSoft}`, paddingBottom: 6, marginBottom: 14 }}>L'AMI DU PEUPLE · N° 1</div>
      <div style={{ fontFamily: F.fell, fontStyle: "italic", fontSize: 70, color: C.ink, mixBlendMode: "multiply" }}>Born again nightly</div>
      <div
        style={{
          fontFamily: F.didone,
          fontWeight: 900,
          fontSize: 124,
          lineHeight: 1.05,
          whiteSpace: "nowrap",
          ...engraved({ tint: C.ink, ink: C.ink, tile: 1, stroke: 0, tileSize: 40 }),
          // the bite of the type into the sheet
          filter: "drop-shadow(0 -1px 0 rgba(255,255,255,0.35)) drop-shadow(0 2px 1px rgba(0,0,0,0.35))",
        }}
      >
        in the printed word,
      </div>
    </div>
  </Finish>
);

export const StyleFrame: React.FC<{ which: "sewer" | "press" }> = ({ which }) => (which === "sewer" ? <Sewer /> : <Press />);
