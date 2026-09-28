// Render stills of the Full composition at given song times (seconds), one bundle.
// Usage: node tools/stills.mjs out/prefix scale t1 t2 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";

const [prefix, scale, ...times] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const comp = await selectComposition({ serveUrl, id: "Full", inputProps: { startSec: 0 } });
for (const t of times) {
  const frame = Math.min(comp.durationInFrames - 1, Math.round(Number(t) * comp.fps));
  await renderStill({ serveUrl, composition: comp, frame, output: `${prefix}_${t}.jpg`, imageFormat: "jpeg", scale: Number(scale), inputProps: { startSec: 0 } });
  console.log("still", t);
}
