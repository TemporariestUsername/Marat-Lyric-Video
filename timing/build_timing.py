"""Build timing.json from the forced alignment + beat grid.

Inputs
  assets/lyrics.txt            lyrics, one line per line, blank line between sections
  timing/raw_alignment.json    stable-ts word alignment (timing/align.py)
  timing/beats.json            beat grid (timing/beats.py)
  timing/overrides.json        optional manual fixes: {"<line id>": start_seconds}
                               or {"<line id>": {"start": s, "words": [s, s, ...]}}
                               (the tap-to-sync tool exports this format too)
Outputs
  timing.json                  everything the video needs (src/ imports this)
  timing/TIMING.md             human-readable line -> timestamp table

Snapping: each word onset is moved to the nearest half-beat if it is within
SNAP_TOL seconds of it; otherwise it keeps the aligned time. Line start = first
word start. Line end = next line's start (capped at last word end + 1 beat).

Usage: python3 timing/build_timing.py
"""
import json, os, re
import numpy as np

SNAP_TOL = 0.09
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)

# Section names, in order of the blank-line-separated blocks in lyrics.txt.
SECTIONS = [
    ("caira_intro", "Ça ira (intro)"),
    ("verse1", "Verse 1"),
    ("prechorus", "Pre-chorus"),
    ("chorus1", "Chorus 1"),
    ("verse2", "Verse 2"),
    ("spoken", "Spoken — \"France…\""),
    ("chorus2", "Chorus 2"),
    ("tribunal", "Tribunal"),
    ("answer", "Marat's answer"),
    ("acquittal", "Acquittal"),
    ("chorus3", "Chorus 3"),
    ("bath", "Bath verse"),
    ("corday", "Corday"),
    ("death", "Death"),
    ("climax", "Climax"),
    ("caira_reprise", "Ça ira (reprise)"),
]

raw_lines = open(P("assets/lyrics.txt"), encoding="utf-8").read().split("\n")
blocks, cur = [], []
for l in raw_lines:
    if l.strip():
        cur.append(l.rstrip())
    elif cur:
        blocks.append(cur); cur = []
if cur:
    blocks.append(cur)
assert len(blocks) == len(SECTIONS), f"{len(blocks)} lyric blocks vs {len(SECTIONS)} section names"

beats = json.load(open(P("timing/beats.json")))
bt = np.array(beats["beats"])
half = np.sort(np.concatenate([bt, (bt[:-1] + bt[1:]) / 2]))
period = beats["beatPeriod"]

def snap(t):
    i = int(np.argmin(np.abs(half - t)))
    return (float(half[i]), True) if abs(half[i] - t) <= SNAP_TOL else (float(t), False)

def beat_index(t):
    """Fractional beat index of time t on the tracked grid."""
    i = int(np.searchsorted(bt, t) - 1)
    i = max(0, min(i, len(bt) - 2))
    return i + (t - bt[i]) / (bt[i + 1] - bt[i])

aln = json.load(open(P("timing/raw_alignment.json")))
segs = aln["segments"]
flat_lines = [l for b in blocks for l in b]
assert len(segs) == len(flat_lines), f"{len(segs)} aligned segments vs {len(flat_lines)} lyric lines"

overrides = {}
if os.path.exists(P("timing/overrides.json")):
    overrides = json.load(open(P("timing/overrides.json")))

TOKEN = re.compile(r"\S+")
lines_out, k = [], 0
for (sid, sname), block in zip(SECTIONS, blocks):
    for j, text in enumerate(block):
        seg = segs[k]; k += 1
        lid = f"{sid}.{j + 1}"
        # Map aligned words back onto the exact lyric tokens (whitespace split),
        # so text/capitalisation always comes from lyrics.txt, never from whisper.
        tokens = TOKEN.findall(text)
        aw = seg["words"]
        # Whisper word tokens can split/merge differently from whitespace; walk
        # both sequences by character count.
        wt, ci, acc = [], 0, 0
        aw_chars = []
        for w in aw:
            acc += len(re.sub(r"\s", "", w["word"]))
            aw_chars.append(acc)
        tok_chars, acc = [], 0
        for t in tokens:
            acc += len(t); tok_chars.append(acc)
        ai = 0
        start_char = 0
        for ti, t in enumerate(tokens):
            # first aligned word covering this token's first character
            while ai < len(aw) - 1 and aw_chars[ai] <= start_char:
                ai += 1
            w = aw[ai]
            wt.append({"start": w["start"], "end": w["end"], "p": w.get("probability", 1.0)})
            start_char = tok_chars[ti]
        # word end = last aligned word overlapping token end
        conf = float(np.mean([w.get("probability", 1.0) for w in aw])) if aw else 0.0
        ov = overrides.get(lid)
        words = []
        for ti, (tok, w) in enumerate(zip(tokens, wt)):
            s, snapped = snap(w["start"])
            words.append({"text": tok, "start": round(s, 3), "rawStart": round(w["start"], 3),
                          "snapped": snapped, "beat": round(beat_index(s), 2)})
        source = "aligned"
        if ov is not None:
            source = "manual"
            ov_start = ov if isinstance(ov, (int, float)) else ov["start"]
            ov_words = None if isinstance(ov, (int, float)) else ov.get("words")
            if ov_words and len(ov_words) == len(words):
                for w, s in zip(words, ov_words):
                    w["start"] = round(float(s), 3); w["snapped"] = False
            else:
                # shift the whole line so its first word lands on the override
                shift = ov_start - words[0]["start"]
                for w in words:
                    w["start"] = round(w["start"] + shift, 3)
            for w in words:
                w["beat"] = round(beat_index(w["start"]), 2)
        lines_out.append({
            "id": lid, "section": sid, "index": j, "text": text,
            "start": words[0]["start"], "rawStart": words[0]["rawStart"],
            "lastWordEnd": round(float(seg["end"]), 3),
            "confidence": round(conf, 3), "source": source,
            "words": words,
        })

# Line ends: next line's start, capped at last word end + one beat.
for a, b in zip(lines_out, lines_out[1:]):
    a["end"] = round(min(b["start"], max(a["lastWordEnd"], a["start"] + period) + period), 3)
lines_out[-1]["end"] = round(lines_out[-1]["lastWordEnd"] + period, 3)

# Warnings: suspiciously long lines (alignment stretched over an instrumental) or
# low whisper confidence. These are the ones to spot-check first.
for l in lines_out:
    dur = l["lastWordEnd"] - l["start"]
    n = len(l["words"])
    l["warn"] = []
    if dur > max(6.0, n * 0.9):
        l["warn"].append(f"long ({dur:.1f}s)")
    if l["confidence"] < 0.15 and l["source"] == "aligned":
        l["warn"].append("low-conf")

sections_out = []
for sid, sname in SECTIONS:
    ls = [l for l in lines_out if l["section"] == sid]
    sections_out.append({"id": sid, "name": sname, "start": ls[0]["start"], "end": ls[-1]["end"],
                         "lines": [l["id"] for l in ls]})

out = {
    "song": "Gonna Need a Tub (For All This Blood)",
    "duration": beats["duration"],
    "fps": 30,
    "bpm": beats["bpm"],
    "beatPeriod": period,
    "beats": beats["beats"],
    "downbeats": beats["downbeats"],
    "energy": beats["energy"],
    "sections": sections_out,
    "lines": lines_out,
}
json.dump(out, open(P("timing.json"), "w"), indent=1, ensure_ascii=False)

def mmss(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"

md = ["# Timing spot-check", "",
      f"Tempo ≈ {beats['bpm']} BPM (tracked beats; see README for why not a rigid grid). "
      f"Word onsets snapped to the nearest half-beat when within {int(SNAP_TOL*1000)} ms.", "",
      "`conf` = mean whisper word probability for the line (alignment against the Demucs vocal stem). "
      "⚠ marks lines worth checking by ear.", ""]
for s in sections_out:
    md += [f"## {s['name']}  ({mmss(s['start'])} – {mmss(s['end'])})", "",
           "| id | start | end | conf | line |", "|---|---|---|---|---|"]
    for lid in s["lines"]:
        l = next(x for x in lines_out if x["id"] == lid)
        flag = (" ⚠ " + ", ".join(l["warn"])) if l["warn"] else ""
        conf = "manual" if l["source"] == "manual" else f"{l['confidence']:.2f}{flag}"
        md.append(f"| {lid} | {mmss(l['start'])} | {mmss(l['end'])} | {conf} | {l['text'].replace('|', '/')} |")
    md.append("")
open(P("timing/TIMING.md"), "w", encoding="utf-8").write("\n".join(md))
print("\n".join(md))
