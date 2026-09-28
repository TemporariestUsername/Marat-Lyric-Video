import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import { TimeProvider } from "./time";
import { sceneAt } from "./scenes";

/** The whole video, or a window of it starting at `startSec` (for previews). */
export const MaratVideo: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = startSec + frame / fps;
  const scene = sceneAt(t);
  const Comp = scene.Comp;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Audio src={staticFile("song.mp3")} trimBefore={Math.round(startSec * fps)} />
      <TimeProvider t={t}>
        <Comp scene={scene} />
      </TimeProvider>
    </AbsoluteFill>
  );
};
