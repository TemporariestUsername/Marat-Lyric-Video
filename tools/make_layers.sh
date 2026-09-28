#!/bin/sh
# Rebuild the parallax layers (public/img/layers/, not committed) from the graded prints.
# Parallax is ONLY for clear, single human figures, lifted off their background.
set -e
cd "$(dirname "$0")/.."
for k in boze_marat corday_portrait; do python3 tools/layers.py $k cut u2net_human_seg; done
