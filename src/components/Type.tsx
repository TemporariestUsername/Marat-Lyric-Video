import React from "react";
import { staticFile } from "remotion";
import { useT } from "../time";
import { Line, Word, easeIn, easeOut, isShout, prog, rnd, wordEnd } from "../timing";
import { C } from "../theme";
import { F } from "../fonts";

export type WordMode = "print" | "slam" | "fade" | "write" | "cold";

/**
 * One word that appears at its sung time. Before that it is laid out but
 * invisible, so lines never reflow as words arrive.
 */
export const TimedWord: React.FC<{
  w: Word;
  end?: number;
  mode?: WordMode;
  style?: React.CSSProperties;
  seed?: string;
  children?: React.ReactNode;
}> = ({ w, end, mode = "print", style, seed = "", children }) => {
  const t = useT();
  const text = children ?? w.text;
  const base: React.CSSProperties = { display: "inline-block", whiteSpace: "pre", ...style };
  if (t < w.start - 0.001) return <span style={{ ...base, opacity: 0 }}>{text}</span>;
  const d = t - w.start;
  const jitter = (rnd(seed, w.text, w.start) - 0.5) * 1.6;

  if (mode === "print") {
    // Pressed onto the page: a fast drop in with a little ink bleed.
    const a = easeOut(prog(d, 0, 0.11));
    return (
      <span
        style={{
          ...base,
          opacity: a,
          transform: `translateY(${(1 - a) * -8}px) scale(${1.18 - 0.18 * a}) rotate(${jitter * (1 - a)}deg)`,
          filter: a < 1 ? `blur(${(1 - a) * 3}px)` : undefined,
        }}
      >
        {text}
      </span>
    );
  }
  if (mode === "slam") {
    // Comes from huge and hits the page; slight squash on impact.
    const inP = prog(d, 0, 0.09);
    const s = inP < 1 ? 2.8 - 1.8 * easeIn(inP) : 1 + 0.06 * Math.exp(-(d - 0.09) / 0.05) * Math.cos((d - 0.09) * 60);
    return (
      <span style={{ ...base, opacity: Math.min(1, inP * 3), transform: `scale(${s}) rotate(${jitter * 0.6}deg)` }}>
        {text}
      </span>
    );
  }
  if (mode === "fade") {
    const a = easeOut(prog(d, 0, 0.7));
    return (
      <span style={{ ...base, opacity: a, transform: `translateY(${(1 - a) * 14}px)`, filter: a < 1 ? `blur(${(1 - a) * 5}px)` : undefined }}>
        {text}
      </span>
    );
  }
  if (mode === "write") {
    // Quill: revealed left-to-right across the time it takes to say it.
    const dur = Math.min(0.9, Math.max(0.25, (end ?? w.start + 0.4) - w.start));
    const a = prog(d, 0, dur);
    return (
      <span
        style={{
          ...base,
          clipPath: `inset(-40% ${(1 - a) * 100}% -40% -5%)`,
        }}
      >
        {text}
      </span>
    );
  }
  // cold: no motion at all, just there.
  return <span style={{ ...base }}>{text}</span>;
};

/**
 * A lyric line as a flow of TimedWords. `shoutStyle` is applied to all-caps
 * tokens (the lyrics' caps mark shouted words); `wordStyle` can override per token.
 */
export const TimedLine: React.FC<{
  line: Line;
  mode?: WordMode;
  shoutMode?: WordMode;
  style?: React.CSSProperties;
  shoutStyle?: React.CSSProperties;
  wordStyle?: (tok: string, i: number) => React.CSSProperties | undefined;
  gap?: string;
}> = ({ line, mode = "print", shoutMode, style, shoutStyle, wordStyle, gap = "0.26em" }) => (
  <div style={{ display: "flex", flexWrap: "wrap", columnGap: gap, ...style }}>
    {line.words.map((w, i) => {
      const shout = isShout(w.text);
      return (
        <TimedWord
          key={i}
          w={w}
          end={wordEnd(line, i)}
          mode={shout && shoutMode ? shoutMode : mode}
          seed={line.id}
          style={{ ...(shout ? shoutStyle : undefined), ...(wordStyle ? wordStyle(w.text, i) : undefined) }}
        />
      );
    })}
  </div>
);

/** Rubber stamp: bordered, rotated, grunge-masked red ink that thumps down. */
export const Stamp: React.FC<{
  at: number;
  text: React.ReactNode;
  x: number;
  y: number;
  rot: number;
  size: number;
  color?: string;
  font?: string;
  border?: boolean;
  seed?: string;
  blend?: React.CSSProperties["mixBlendMode"];
}> = ({ at, text, x, y, rot, size, color = C.blood, font = F.condensed, border = true, seed = "", blend = "multiply" }) => {
  const t = useT();
  if (t < at) return null;
  const d = t - at;
  const inP = prog(d, 0, 0.08);
  const s = inP < 1 ? 1.9 - 0.9 * easeIn(inP) : 1;
  const mx = Math.floor(rnd(seed, "mx") * 600);
  const my = Math.floor(rnd(seed, "my") * 300);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        opacity: Math.min(1, inP * 2.5) * 0.93,
        color,
        fontFamily: font,
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: "0.02em",
        padding: border ? `${size * 0.12}px ${size * 0.22}px ${size * 0.08}px` : 0,
        border: border ? `${Math.max(4, size * 0.07)}px solid ${color}` : undefined,
        borderRadius: size * 0.08,
        whiteSpace: "nowrap",
        WebkitMaskImage: `url(${staticFile("tex/grunge.png")})`,
        WebkitMaskSize: "1024px 512px",
        WebkitMaskPosition: `-${mx}px -${my}px`,
        mixBlendMode: blend,
      }}
    >
      {text}
    </div>
  );
};
