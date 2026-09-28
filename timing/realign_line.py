"""Re-align a single lyric line inside a time window and store the result in
timing/overrides.json (used when the global alignment stretched a line over an
instrumental gap).

Usage: python3 timing/realign_line.py <vocals.wav> <line id> <window start s> <window end s>
Then:  python3 timing/build_timing.py
"""
import json, os, sys, tempfile
import numpy as np
import soundfile as sf
import librosa
import stable_whisper

vocals, lid, w0, w1 = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
timing = json.load(open(os.path.join(root, "timing.json")))
line = next(l for l in timing["lines"] if l["id"] == lid)

y, sr = librosa.load(vocals, sr=16000, offset=w0, duration=w1 - w0)
tmp = os.path.join(tempfile.mkdtemp(), "clip.wav")
sf.write(tmp, y, sr)
model = stable_whisper.load_model("medium", device="cpu")
res = model.align(tmp, line["text"], language="en", vad=False, regroup=False)
words = [w for s in res.segments for w in s.words]
print([(w.word, round(w.start + w0, 2), round(w.probability, 2)) for w in words])

# Map whisper words back to whitespace tokens by accumulated character count.
tokens = line["text"].split()
ends, acc = [], 0
for w in words:
    acc += len(w.word.strip()); ends.append(acc)
starts, acc, wi = [], 0, 0
for t in tokens:
    while wi < len(words) - 1 and ends[wi] <= acc:
        wi += 1
    starts.append(round(words[wi].start + w0, 3))
    acc += len(t)

path = os.path.join(root, "timing", "overrides.json")
ov = json.load(open(path)) if os.path.exists(path) else {}
ov[lid] = {"start": starts[0], "words": starts, "note": f"re-aligned in window {w0}-{w1}s"}
json.dump(ov, open(path, "w"), indent=1)
print(lid, starts)
