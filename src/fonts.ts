import { continueRender, delayRender } from "remotion";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";
import "@fontsource/im-fell-english-sc/400.css";
import "@fontsource/im-fell-dw-pica/400.css";
import "@fontsource/im-fell-dw-pica/400-italic.css";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/bodoni-moda/900.css";
import "@fontsource/bodoni-moda/900-italic.css";
import "@fontsource/petit-formal-script/400.css";

// Faces, after the cover: 18th-century letterpress (IM Fell, cut from the Fell
// types) for printed text, Bodoni for the huge engraved shouts and numerals.
export const F = {
  fell: "'IM Fell English', 'IM Fell DW Pica', Georgia, serif",
  fellSC: "'IM Fell English SC', 'IM Fell English', Georgia, serif",
  pica: "'IM Fell DW Pica', 'IM Fell English', Georgia, serif",
  didone: "'Bodoni Moda', 'IM Fell English', serif",
  hand: "'Petit Formal Script', cursive",
};

// Block rendering until every face we use is loaded, so no frame is rendered
// (or measured) with a fallback font.
const handle = delayRender("fonts");
Promise.all(
  [
    "400 40px 'IM Fell English'",
    "italic 400 40px 'IM Fell English'",
    "400 40px 'IM Fell English SC'",
    "400 40px 'IM Fell DW Pica'",
    "italic 400 40px 'IM Fell DW Pica'",
    "400 40px 'Bodoni Moda'",
    "italic 400 40px 'Bodoni Moda'",
    "900 40px 'Bodoni Moda'",
    "italic 900 40px 'Bodoni Moda'",
    "400 40px 'Petit Formal Script'",
  ].map((f) => document.fonts.load(f, "AÇaé1!")),
).then(() => continueRender(handle));
