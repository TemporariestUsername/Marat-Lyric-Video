#!/bin/sh
# Rebuild the parallax layers (public/img/layers/, not committed) from the graded prints.
set -e
cd "$(dirname "$0")/.."
for k in carceri_drawbridge carceri_smoke carceri_tower; do python3 tools/layers.py $k density 3 0.35; done
python3 tools/layers.py comite_revolutionnaire density 3 0.5
python3 tools/layers.py prise_bastille_1789 density 3 0.45
python3 tools/layers.py encyc_casse density 3 0.4
python3 tools/layers.py boze_marat cut u2net_human_seg
