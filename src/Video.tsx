import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import { TimeProvider } from "./time";
import { SCENES, sceneIndexAt } from "./scenes";
import { easeInOut, prog } from "./timing";
import { FX } from "./components/FX";

const TURN = 0.42;

/** The whole video, or a window of it starting at `startSec` (for previews). */
export const MaratVideo: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = startSec + frame / fps;
  const i = sceneIndexAt(t);
  const scene = SCENES[i];
  const Comp = scene.Comp;
  // Page turn: a scene flagged pageTurnOut peels away (frozen on its last frame)
  // off the left edge, uncovering the next scene already running underneath.
  const prev = i > 0 ? SCENES[i - 1] : null;
  const turning = prev?.opts.pageTurnOut && t < scene.start + TURN;
  const Prev = prev?.Comp;
  const cues = Comp.cues?.(scene) ?? {};
  const k = turning ? easeInOut(prog(t, scene.start, TURN)) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile("song.mp3")} trimBefore={Math.round(startSec * fps)} />
      <TimeProvider t={t}>
        <FX {...cues}>
          <Comp scene={scene} />
        </FX>
      </TimeProvider>
      {turning && Prev && prev ? (
        <AbsoluteFill style={{ perspective: 2200 }}>
          <AbsoluteFill
            style={{
              transform: `rotateY(${-k * 110}deg)`,
              transformOrigin: "0% 50%",
              boxShadow: `${40 * k}px 0 ${60 * k}px rgba(0,0,0,${0.6 * k})`,
              backfaceVisibility: "hidden",
            }}
          >
            <TimeProvider t={scene.start - 1 / fps}>
              <Prev scene={prev} />
            </TimeProvider>
            <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(0,0,0,0) 40%, rgba(0,0,0,${0.45 * k}) 100%)` }} />
          </AbsoluteFill>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
