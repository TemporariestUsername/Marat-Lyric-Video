import React from "react";
import { Composition } from "remotion";
import { MaratVideo } from "./Video";
import { DURATION, FPS, sectionLines } from "./timing";
import { SCENES } from "./scenes";

const f = (s: number) => Math.round(s * FPS);

// Chorus 1 preview: from the last pre-chorus line (so the page shatter is in
// frame) to a couple of seconds into verse 2.
const pre = sectionLines("prechorus");
const previewStart = pre[pre.length - 1].start - 0.5;
const previewEnd = sectionLines("verse2")[1].start;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Full"
      component={MaratVideo}
      durationInFrames={f(DURATION)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ startSec: 0 }}
    />
    <Composition
      id="Chorus1"
      component={MaratVideo}
      durationInFrames={f(previewEnd - previewStart)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ startSec: previewStart }}
    />
    {/* one composition per scene, for section-by-section review renders */}
    {SCENES.map((s) => (
      <Composition
        key={s.id}
        id={`Scene-${s.id}`}
        component={MaratVideo}
        durationInFrames={Math.max(1, f(s.end - s.start))}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ startSec: s.start }}
      />
    ))}
  </>
);
