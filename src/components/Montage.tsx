import React from "react";
import { useT } from "../time";
import { Box, FOCUS } from "../images";
import { frameT } from "../motion";
import { kickPulse, rnd } from "../timing";
import { Plate } from "./Plate";

export type Shot = { id: string; focus?: number };

/**
 * Hard-cut montage of period prints. `cuts` are the cut times (drum hits or
 * line starts, from timing.json); each cut advances to the next shot, framing
 * one of that print's focus boxes, with a punch-in on every kick.
 */
export const Montage: React.FC<{ shots: Shot[]; cuts: number[]; start: number; end: number; dim?: number; seed: string }> = ({
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
  const box = boxes[shot.focus ?? Math.floor(rnd(seed, k) * boxes.length)];
  return (
    <Plate
      key={k}
      id={shot.id}
      focus={box}
      t0={cs[k]}
      t1={cs[k + 1] ?? end}
      push={0.05 * kickPulse(t, 0.12)}
      drift={rnd(seed, k, "d") - 0.5}
      flip={rnd(seed, k, "f") < 0.25}
      dim={dim}
    />
  );
};
