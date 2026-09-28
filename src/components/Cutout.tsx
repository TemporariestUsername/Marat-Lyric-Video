import React from "react";
import { Img, staticFile } from "remotion";
import { img } from "../images";
import { cutShadow } from "./Paper";

/** A figure cut out of a print. It pivots at the bottom centre (headbang = `nod` degrees). */
export const Cutout: React.FC<{
  id: string;
  height: number;
  x: number;
  y: number; // bottom edge
  nod?: number;
  scale?: number;
  flip?: boolean;
  style?: React.CSSProperties;
}> = ({ id, height, x, y, nod = 0, scale = 1, flip = false, style }) => {
  const c = img(id).cut!;
  const w = (c.w / c.h) * height;
  return (
    <Img
      src={staticFile(`img/${id}_cut.png`)}
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - height,
        width: w,
        height,
        transformOrigin: "50% 100%",
        transform: `rotate(${nod}deg) scale(${flip ? -scale : scale}, ${scale})`,
        filter: cutShadow,
        ...style,
      }}
    />
  );
};
