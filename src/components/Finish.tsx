import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";

/**
 * The finishing pass that sits over everything: film grain that changes
 * every frame (offsets derived from the frame number, never random), a
 * printed-paper tooth, and a lens vignette. `weave` adds a sub-pixel gate
 * weave, the slight unsteadiness of film in a projector.
 */
export const Finish: React.FC<{ grain?: number; vignette?: number; children: React.ReactNode }> = ({ grain = 0.22, vignette = 0.55, children }) => {
  const f = useCurrentFrame();
  // deterministic per-frame offsets for the grain plate and the weave
  const h = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const gx = Math.floor(h(f) * 512),
    gy = Math.floor(h(f + 17) * 512);
  const wx = (h(f + 3) - 0.5) * 1.2,
    wy = (h(f + 5) - 0.5) * 1.6;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${wx}px, ${wy}px)` }}>{children}</AbsoluteFill>
      {/* paper tooth, multiplied in: everything reads as printed on the same sheet */}
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("tex/paper.jpg")})`, backgroundSize: "cover", mixBlendMode: "multiply", opacity: 0.35 }} />
      {/* grain */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${staticFile("tex/speckle.png")})`,
          backgroundSize: "512px 512px",
          backgroundPosition: `${gx}px ${gy}px`,
          mixBlendMode: "overlay",
          opacity: grain,
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,5,3,${vignette}) 100%)` }} />
    </AbsoluteFill>
  );
};
