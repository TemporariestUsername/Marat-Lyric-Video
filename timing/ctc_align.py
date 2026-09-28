"""Precise word timing: CTC forced alignment (torchaudio MMS_FA) against the
Demucs vocal stem, one lyric section at a time.

stable-ts (timing/align.py) is still used for the rough section/line layout,
but its word times come from Whisper's attention and wander by 100-300 ms.
MMS_FA aligns characters on a 20 ms frame grid, so word onsets land where the
consonant actually starts.

Each section is aligned inside a window taken from the current timing.json
(first line start - 1.5 s  ->  next section start + 0.3 s). A "*" wildcard is
placed at both ends and between lines so shouts, breaths and ad-libs that are
not in the lyrics don't drag words around.

Tokens with no letters (e.g. the em dash "—") get the time of the word before.

Usage: python3 timing/ctc_align.py <vocals.wav>
Writes timing/ctc_alignment.json  {line id: [{"start","end","score"} per lyric token]}
Then:  python3 timing/build_timing.py
"""
import json, os, re, sys, unicodedata
import torch
import librosa
from torchaudio.pipelines import MMS_FA as bundle

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
vocals = sys.argv[1]
timing = json.load(open(os.path.join(ROOT, "timing.json")))

SR = bundle.sample_rate
wav = torch.from_numpy(librosa.load(vocals, sr=SR, mono=True)[0]).unsqueeze(0)
model = bundle.get_model(with_star=True)
tokenizer = bundle.get_tokenizer()
aligner = bundle.get_aligner()


def norm(tok: str) -> str:
    s = unicodedata.normalize("NFKD", tok.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z']", "", s).strip("'")


out = {}
sections = timing["sections"]
lines_by_id = {l["id"]: l for l in timing["lines"]}
for si, sec in enumerate(sections):
    lines = [lines_by_id[i] for i in sec["lines"]]
    w0 = max(0.0, lines[0]["start"] - 1.5)
    if si > 0:
        prev = lines_by_id[sections[si - 1]["lines"][-1]]
        w0 = max(w0, prev["start"] + 0.3)
    w1 = sections[si + 1]["start"] + 0.3 if si + 1 < len(sections) else timing["duration"]
    seg = wav[:, int(w0 * SR): int(w1 * SR)]
    with torch.inference_mode():
        emission, _ = model(seg)
    ratio = seg.size(1) / emission.size(1) / SR

    # transcript: * line1 words * line2 words * ... *
    words, index = ["*"], []  # index: (line id, token idx) for each real word
    for l in lines:
        for ti, w in enumerate(l["words"]):
            n = norm(w["text"])
            if n:
                words.append(n)
                index.append((l["id"], ti))
        words.append("*")
    spans = aligner(emission[0], tokenizer(words))
    real = [s for w, s in zip(words, spans) if w != "*"]
    assert len(real) == len(index)

    for l in lines:
        out[l["id"]] = [None] * len(l["words"])
    for (lid, ti), sp in zip(index, real):
        out[lid][ti] = {
            "start": round(w0 + sp[0].start * ratio, 3),
            "end": round(w0 + sp[-1].end * ratio, 3),
            "score": round(float(sum(s.score for s in sp) / len(sp)), 3),
        }
    # letterless tokens ride on the previous word (or the next, at line start)
    for l in lines:
        arr = out[l["id"]]
        for ti in range(len(arr)):
            if arr[ti] is None:
                ref = next((arr[j] for j in range(ti - 1, -1, -1) if arr[j]), None) or next(
                    (arr[j] for j in range(ti + 1, len(arr)) if arr[j]), None)
                arr[ti] = {**ref, "score": None, "inherited": True}
    first = out[lines[0]["id"]][0]["start"]
    print(f"{sec['id']:14s} window {w0:6.1f}-{w1:6.1f}  first word {first:7.2f} (was {lines[0]['start']:7.2f})  "
          f"mean score {sum(x['score'] for l in lines for x in out[l['id']] if x['score'] is not None) / max(1, len(real)):.2f}")

json.dump(out, open(os.path.join(ROOT, "timing", "ctc_alignment.json"), "w"), indent=1)
