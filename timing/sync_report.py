"""Measure how well word times in timing.json line up with the vocals.

For every word, find the nearest onset detected in the Demucs vocal stem and
report the offset (onset minus word time; + means the text would be EARLY).

Usage: python3 timing/sync_report.py <vocals.wav> [--md]
  --md  also rewrite the "Sync report" block at the end of timing/TIMING.md
"""
import json, os, sys
import numpy as np
import librosa

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vocals = sys.argv[1]
d = json.load(open(os.path.join(ROOT, "timing.json")))
y, sr = librosa.load(vocals, sr=22050)
hop = 128
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
on = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=hop, units="time", backtrack=True)

def offset(t):
    i = np.searchsorted(on, t)
    c = [on[j] for j in (i - 1, i) if 0 <= j < len(on)]
    return min(c, key=lambda x: abs(x - t)) - t

rows = [f"| section | words | median | within 60 ms | off > 100 ms |", "|---|---|---|---|---|"]
allv = []
for s in d["sections"]:
    v = np.array([offset(w["start"]) for l in d["lines"] if l["section"] == s["id"] for w in l["words"]])
    allv.append(v)
    rows.append(f"| {s['name']} | {len(v)} | {np.median(v)*1000:+.0f} ms | {np.mean(abs(v) <= 0.06)*100:.0f}% | {np.mean(abs(v) > 0.1)*100:.0f}% |")
a = np.concatenate(allv)
rows.append(f"| **all** | {len(a)} | {np.median(a)*1000:+.0f} ms | {np.mean(abs(a) <= 0.06)*100:.0f}% | {np.mean(abs(a) > 0.1)*100:.0f}% |")
out = "\n".join(rows)
print(out)

if "--md" in sys.argv:
    p = os.path.join(ROOT, "timing", "TIMING.md")
    md = open(p, encoding="utf-8").read().split("\n## Sync report")[0].rstrip()
    md += ("\n\n## Sync report\n\nOffset from each word's time to the nearest onset in the separated vocal "
           "track (positive = text early).\n\n" + out + "\n")
    open(p, "w", encoding="utf-8").write(md)
