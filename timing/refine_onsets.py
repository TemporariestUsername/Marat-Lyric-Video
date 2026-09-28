"""Choose final word onsets, line by line, with a small dynamic program.

For each word we start from a prior:
  * CTC forced alignment (timing/ctc_alignment.json) where its score is >= CTC_OK
    (tight prior, sigma 80 ms), else
  * the manual override (timing/overrides.json) if the line has one (sigma 100 ms), else
  * stable-ts minus its measured systematic lag (sigma 200 ms).
Candidates are peaks of the vocal-stem onset envelope. Each candidate scores
  onset strength (normalised per line)
  + grid bonus for landing on a 16th note of the tracked beat grid (sung sections)
  - squared distance from the prior / sigma.
Words must stay in order, at least 70 ms apart, and inside the line's window.
Letterless tokens ("—") take the time of the word before.

Usage: python3 timing/refine_onsets.py <vocals.wav>
Writes timing/refined_onsets.json {line id: [start per token]}; then run build_timing.py.
"""
import json, os, re, sys, unicodedata
import numpy as np
import librosa
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
CTC_OK = 0.3
FREE_RHYTHM = {"spoken", "tribunal", "answer"}  # no grid bonus: spoken, not sung on the beat
MIN_GAP = 0.07

timing = json.load(open(P("timing.json")))
ctc = json.load(open(P("timing/ctc_alignment.json")))
overrides = json.load(open(P("timing/overrides.json"))) if os.path.exists(P("timing/overrides.json")) else {}
beats = np.array(json.load(open(P("timing/beats.json")))["beats"])
# 16th-note grid between consecutive tracked beats
grid = np.concatenate([beats[:-1] + k * np.diff(beats) / 4 for k in range(4)] + [beats[-1:]])

y, sr = librosa.load(sys.argv[1], sr=22050)
HOP = 256
env = gaussian_filter1d(librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP), 1.0)
et = librosa.times_like(env, sr=sr, hop_length=HOP)
peaks, _ = find_peaks(env, distance=3)
pt, pv = et[peaks], env[peaks]


def has_letters(tok):
    s = unicodedata.normalize("NFKD", tok)
    return bool(re.search(r"[A-Za-z]", s))


# systematic stable-ts lag, measured on confident CTC words
lag = np.median([ctc[l["id"]][i]["start"] - w["rawStart"]
                 for l in timing["lines"] for i, w in enumerate(l["words"])
                 if ctc[l["id"]][i]["score"] is not None and ctc[l["id"]][i]["score"] >= 0.6])
print(f"stable-ts lag vs confident CTC: {lag*1000:+.0f} ms")

lines = timing["lines"]
priors = {}
for l in lines:
    ov = overrides.get(l["id"])
    ov_words = ov.get("words") if isinstance(ov, dict) else None
    pr = []
    for i, w in enumerate(l["words"]):
        c = ctc[l["id"]][i]
        if c["score"] is not None and c["score"] >= CTC_OK:
            pr.append((c["start"], 0.08))
        elif ov_words and len(ov_words) == len(l["words"]):
            pr.append((ov_words[i], 0.10))
        else:
            pr.append((w["rawStart"] + lag, 0.20))
    priors[l["id"]] = pr

# Repeated lines share one rhythm: fit both occurrences jointly (the second is
# the first shifted by the cross-correlated offset). Doubles the evidence in the
# choral hooks, where either occurrence alone has weak onsets.
PAIRS = {"chorus1.1": "chorus1.2", "chorus2.1": "chorus2.2", "chorus3.1": "chorus3.2",
         "caira_intro.1": "caira_intro.3", "caira_reprise.1": "caira_reprise.3"}
SECOND = {b: a for a, b in PAIRS.items()}
shift_of = {}


def env_at(t):
    return np.interp(t, et, env)


def dp(idx, pr, cand, cv, section):
    cv = cv / (np.percentile(cv, 90) + 1e-9)
    gd = np.abs(cand[:, None] - grid[None, :]).min(1)
    gridb = 0.0 if section in FREE_RHYTHM else 0.6 * np.exp(-(gd / 0.03) ** 2)
    base = np.minimum(cv, 1.5) + gridb
    n, k = len(idx), len(cand)
    NEG = -1e9
    score = np.full((n, k), NEG)
    back = np.zeros((n, k), int)
    for a, wi in enumerate(idx):
        p, sg = pr[wi]
        unary = base - 0.5 * ((cand - p) / sg) ** 2
        if a == 0:
            score[0] = unary
            continue
        best, arg, j0 = NEG, -1, 0
        for j in range(k):
            while j0 < k and cand[j0] <= cand[j] - MIN_GAP:  # predecessor strictly earlier
                if score[a - 1, j0] > best:
                    best, arg = score[a - 1, j0], j0
                j0 += 1
            if arg >= 0:
                score[a, j] = best + unary[j]
                back[a, j] = arg
    j = int(np.argmax(score[-1]))
    if score[-1, j] <= NEG / 2:
        return None
    chosen = [0] * n
    for a in range(n - 1, -1, -1):
        chosen[a] = j
        j = back[a, j]
    return [float(cand[c]) for c in chosen]


out, report = {}, []
for li, l in enumerate(lines):
    lid = l["id"]
    idx = [i for i, w in enumerate(l["words"]) if has_letters(w["text"])]
    starts = [None] * len(l["words"])
    if lid in SECOND:
        a_id = SECOND[lid]
        for i in idx:
            starts[i] = round(out[a_id][i] + shift_of[a_id], 3)
    else:
        pr = list(priors[lid])
        lo = pr[idx[0]][0] - 0.35
        if li > 0:
            lo = max(lo, max(out[lines[li - 1]["id"]]) + MIN_GAP)
        hi = priors[lines[li + 1]["id"]][0][0] - 0.05 if li + 1 < len(lines) else timing["duration"]
        e = env.copy()
        if lid in PAIRS:
            b_id = PAIRS[lid]
            d0 = priors[b_id][0][0] - pr[idx[0]][0]
            m = (et >= lo) & (et <= hi)
            shifts = np.arange(d0 - 0.3, d0 + 0.3, 0.005)
            xc = [np.dot(env[m], env_at(et[m] + sh)) for sh in shifts]
            sh = float(shifts[int(np.argmax(xc))])
            shift_of[lid] = sh
            e = env + env_at(et + sh)
            # merge priors of both occurrences
            prb = priors[b_id]
            for i in idx:
                (pa, sa), (pb, sb) = pr[i], prb[i]
                w_a, w_b = 1 / sa ** 2, 1 / sb ** 2
                pr[i] = ((pa * w_a + (pb - sh) * w_b) / (w_a + w_b), min(sa, sb))
            report.append(f"{lid} + {b_id}: fitted jointly, offset {sh:.3f} s")
        pk, _ = find_peaks(e, distance=3)
        m = (et[pk] >= lo) & (et[pk] <= hi)
        cand, cv = et[pk][m], e[pk][m]
        res = dp(idx, pr, cand, cv, l["section"]) if len(cand) >= len(idx) else None
        if res is None:
            res = [pr[i][0] for i in idx]
            report.append(f"{lid}: kept priors")
        for i, t in zip(idx, res):
            starts[i] = round(t, 3)
    for i in range(len(starts)):
        if starts[i] is None:
            starts[i] = starts[i - 1] if i > 0 else next(x for x in starts if x is not None)
    out[lid] = starts

# Voice entries: when the voice comes in from silence well before a line's
# first word (and the previous line is finished), the first word starts there.
# CTC's leading wildcard sometimes swallows a held first syllable.
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
rdb = 20 * np.log10(rms / rms.max() + 1e-9)
for li, l in enumerate(lines):
    st = out[l["id"]]
    idx = [i for i, w in enumerate(l["words"]) if has_letters(w["text"])]
    first = st[idx[0]]
    prev_last = max(out[lines[li - 1]["id"]]) if li > 0 else -1.0
    m = (et >= first - 1.0) & (et <= first - 0.2)
    ents = [et[m][i] for i in range(1, m.sum())
            if rdb[m][i] > -22 and rdb[m][max(0, i - 6):i].min() < -32 and et[m][i] > prev_last + 0.25]
    if ents and (len(idx) < 2 or st[idx[1]] - ents[-1] > MIN_GAP):
        new = round(float(ents[-1]), 3)
        report.append(f"{l['id']}: first word moved to voice entry {first:.2f} -> {new:.2f}")
        for i in range(len(st)):
            if st[i] == first:
                st[i] = new

json.dump(out, open(P("timing/refined_onsets.json"), "w"), indent=1)
d = [out[l["id"]][i] - pr[0] for l in lines for i, pr in enumerate(priors[l["id"]])]
print(f"moved from prior: median {np.median(np.abs(d))*1000:.0f} ms, 90th pct {np.percentile(np.abs(d), 90)*1000:.0f} ms")
for r in report:
    print(r)
