import React from "react";
import { AbsoluteFill } from "remotion";
import { useT } from "../time";
import { Paper } from "../components/Paper";
import { Montage } from "../components/Montage";
import { Cutout } from "../components/Cutout";
import { KineticLine, engraved } from "../components/Kinetic";
import { arrive, camera, cameraTransform } from "../motion";
import { easeIn, easeInOut, energyAt, isShout, kickPulse, kicksBetween, prog, sectionLines, shake } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";
import { SceneProps } from "./types";

/**
 * Pre-chorus: Marat, cut from a 1793 portrait, headbangs in front of engravings
 * of the revolutionary committees; the prints cut on each line and then on
 * every kick; the room shakes harder bar by bar and the last beat rushes the
 * camera into the page.
 *
 * opts: section
 */
export const PressRoom: React.FC<SceneProps> = ({ scene }) => {
  const t = useT();
  const lines = sectionLines(scene.opts.section);
  const words = lines.flatMap((l) => l.words);

  const build = easeInOut(prog(t, scene.start, scene.end - scene.start));
  const rush = easeIn(prog(t, scene.end - 0.45, 0.45)); // into the chorus
  const cam = camera(t, lines[0].start, 1.5 + build * 1.5);
  const hits = words.filter((w) => isShout(w.text)).map((w) => w.start);
  const sh = shake(t, hits, 26, 0.12);
  const quake = (3 + build * build * 14) * energyAt(t);
  const tx = cam.x + sh.x + Math.sin(t * 67) * quake;
  const ty = cam.y + sh.y + Math.cos(t * 59) * quake;
  const zoom = cam.zoom * (1 + 0.1 * build + 0.6 * rush);

  const cur = lines.findIndex((l, k) => l.start - 0.2 <= t && (k + 1 >= lines.length || lines[k + 1].start - 0.2 > t));
  const wordHit = Math.max(0, ...words.map((w) => arrive(t, w.start).hit));
  const k = kickPulse(t, 0.14);

  return (
    <AbsoluteFill style={{ backgroundColor: C.night, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: cameraTransform({ ...cam, x: tx, y: ty, zoom, rot: cam.rot + sh.r + rush * 6 }),
          transformOrigin: "50% 50%",
          filter: rush > 0.05 ? `blur(${rush * 10}px)` : undefined,
        }}
      >
        {/* the committee rooms of the Terror, cutting on each line — and on every kick in the last one */}
        <Montage
          shots={[{ id: "comite_scene_derniere" }, { id: "comite_revolutionnaire" }, { id: "fouquier_tribunal" }, { id: "comite_scene_derniere", focus: 1 }]}
          cuts={[...lines.map((l) => l.start), ...kicksBetween(lines[lines.length - 1].start + 0.5, scene.end)]}
          start={scene.start}
          end={scene.end}
          dim={0.2 + 0.25 * build}
          seed="pre"
        />
        <Paper hatch={1.2 + 0.5 * build} style={{ mixBlendMode: "multiply", opacity: 0.55 }} drift={{ x: -tx * 0.3, y: -ty * 0.3 }} />
        {/* Marat, cut from the 1793 portrait, headbanging */}
        <Cutout id="marat_geneve" height={930 * (1 + 0.04 * wordHit)} x={390 - tx * 0.4} y={1130 + k * 18} nod={-(7 * k + 5 * wordHit)} />
        {cur >= 0 ? (
          <KineticLine
            key={lines[cur].id}
            line={lines[cur]}
            face={{ family: F.fell, size: 120 }}
            faceFor={(w) => (isShout(w.text) ? { family: F.didone, weight: 900, size: 170 } : undefined)}
            styleFor={(w) => (isShout(w.text) ? { ...engraved({ tint: C.paperLight, ink: C.ink, tile: 1, stroke: 3 }), textShadow: "none" } : { color: C.paperLight, textShadow: `0 0 14px ${C.ink}, 0 0 4px ${C.ink}` })}
            entrance="slam"
            entranceFor={(w, i) => (isShout(w.text) ? "slam" : i % 2 ? "drop" : "rise")}
            cx={1180}
            cy={460}
            fitW={1250}
            fitH={620}
            maxScale={2.2}
            maxRowWidth={900}
            lineHeight={1.08}
            exitAt={lines[cur + 1]?.start}
            exit="zoom"
            seed="pre"
          />
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
