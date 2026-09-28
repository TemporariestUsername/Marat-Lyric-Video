import React from "react";
import { useT } from "../time";
import { Box, FOCUS } from "../images";
import { frameT } from "../motion";
import { Plate } from "./Plate";

export type Shot = { id: string; focus?: number };

/**
 * Backdrop montage of period prints for the verses: each cut (a line start)
 * advances to the next print, framed on its authored focus box, and the
 * camera travels left to right across it, the way the lines are read.
 */
export const Montage: React.FC<{ shots: Shot[]; cuts: number[]; start: number; end: number; dim?: number; seed?: string }> = ({
  shots,
  cuts,
  start,
  end,
  dim = 0.25,
  seed,
}) => {
  const t = useT();
  const cs = [start, ...cuts.filter((c) => c > start + 0.05 && c < end)].map(frameT);
  let k = 0;
  cs.forEach((c, i) => {
    if (t >= c) k = i;
  });
  const shot = shots[k % shots.length];
  const boxes: Box[] = FOCUS[shot.id] ?? [[0, 0, 1, 1]];
  const box = boxes[shot.focus ?? 0];
  return (
    <Plate
      key={k}
      id={shot.id}
      focus={box}
      t0={cs[k]}
      t1={cs[k + 1] ?? end}
      drift={-1}
      dim={dim}
    />
  );
};
