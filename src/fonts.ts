import { continueRender, delayRender } from "remotion";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/bodoni-moda/400-italic.css";
import "@fontsource/bodoni-moda/700.css";
import "@fontsource/bodoni-moda/900.css";
import "@fontsource/bodoni-moda/900-italic.css";
import "@fontsource/libre-caslon-text/400.css";
import "@fontsource/libre-caslon-text/400-italic.css";
import "@fontsource/libre-caslon-text/700.css";
import "@fontsource/anton/400.css";
import "@fontsource/petit-formal-script/400.css";

export const F = {
  didone: "'Bodoni Moda', serif",
  caslon: "'Libre Caslon Text', serif",
  condensed: "'Anton', sans-serif",
  hand: "'Petit Formal Script', cursive",
};

// Block rendering until every face/weight we use is loaded, so no frame is
// ever rendered with a fallback font.
const handle = delayRender("fonts");
Promise.all(
  [
    "400 40px 'Bodoni Moda'",
    "italic 400 40px 'Bodoni Moda'",
    "700 40px 'Bodoni Moda'",
    "900 40px 'Bodoni Moda'",
    "italic 900 40px 'Bodoni Moda'",
    "400 40px 'Libre Caslon Text'",
    "italic 400 40px 'Libre Caslon Text'",
    "700 40px 'Libre Caslon Text'",
    "400 40px 'Anton'",
    "400 40px 'Petit Formal Script'",
  ].map((f) => document.fonts.load(f, "AÇaé1")),
).then(() => continueRender(handle));
