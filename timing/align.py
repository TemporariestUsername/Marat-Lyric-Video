"""Forced-align lyrics.txt against the Demucs vocal stem with stable-ts.

Usage: python3 timing/align.py <vocals.wav> [model]
Writes timing/raw_alignment.json (word-level, unsnapped).
"""
import json, sys
import stable_whisper

vocals = sys.argv[1]
model_name = sys.argv[2] if len(sys.argv) > 2 else "medium"
lines = [l.strip() for l in open("assets/lyrics.txt", encoding="utf-8")]
text = "\n".join(l for l in lines if l)

model = stable_whisper.load_model(model_name, device="cpu")
res = model.align(vocals, text, language="en", original_split=True, vad=False,
                  regroup=False)
json.dump(res.to_dict(), open("timing/raw_alignment.json", "w"), indent=1, ensure_ascii=False)
for s in res.segments:
    print(f"{s.start:7.2f} {s.end:7.2f}  {s.text.strip()}")
