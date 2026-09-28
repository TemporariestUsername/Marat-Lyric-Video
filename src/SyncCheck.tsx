import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./fonts";
import { TIMING, FPS } from "./timing";
import { C } from "./theme";
import { F } from "./fonts";

/**
 * Sync check: every word flashes on the frame of its onset, with the current
 * line and a burned-in timecode. Judge it by ear: each flash should coincide
 * with the start of the sung word.
 */
export const SyncCheck: React.FC<{ startSec: number }> = ({ startSec }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = startSec + frame / fps;
  const line = [...TIMING.lines].reverse().find((l) => l.start - 0.3 <= t);
  const tc = `${Math.floor(t / 60)}:${(t % 60).toFixed(2).padStart(5, "0")}`;
  return (
    <AbsoluteFill style={{ backgroundColor: C.night, color: C.paperLight, fontFamily: F.fell }}>
      <Audio src={staticFile("song.mp3")} trimBefore={Math.round(startSec * fps)} />
      <div style={{ position: "absolute", left: 60, top: 40, fontSize: 40, fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>
        {tc} · {line?.id}
      </div>
      {line ? (
        <div style={{ position: "absolute", left: 80, right: 80, top: 380, display: "flex", flexWrap: "wrap", gap: "0 28px", justifyContent: "center", fontSize: 86 }}>
          {line.words.map((w, i) => {
            const on = Math.round(w.start * FPS);
            const d = Math.round(t * FPS) - on;
            const flash = d >= 0 && d < 5;
            return (
              <span
                key={i}
                style={{
                  color: flash ? C.night : d >= 0 ? C.paperLight : "rgba(232,216,180,0.25)",
                  background: flash ? C.bloodBright : "transparent",
                  padding: "0 8px",
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
