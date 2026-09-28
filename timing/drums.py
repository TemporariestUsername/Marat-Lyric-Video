"""Find kick and snare hits in the Demucs drum stem so the visuals hit the
actual drums (nu-metal riffs are syncopated; the beat grid alone misses them).

Usage: python3 timing/drums.py <drums.wav>
Writes timing/drums.json {"kicks": [[t, strength], ...], "snares": [[t, strength], ...]}
Strength is 0..1 relative to the loudest hits of that kind. Then run build_timing.py.
"""
import json, os, sys
import numpy as np
import librosa
from scipy.signal import find_peaks

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
y, sr = librosa.load(sys.argv[1], sr=22050)
HOP = 256
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
t = librosa.times_like(S[0], sr=sr, hop_length=HOP)


def band_onsets(lo, hi, min_gap, k=1.6, floor=0.08):
    band = librosa.amplitude_to_db(S[(freqs >= lo) & (freqs < hi)], ref=np.max)
    env = librosa.onset.onset_strength(S=band, sr=sr, hop_length=HOP)
    # adaptive threshold: local median + fraction of local max
    med = np.convolve(env, np.ones(87) / 87, mode="same")
    pk, props = find_peaks(env, height=med * k + env.max() * floor, distance=int(min_gap * sr / HOP))
    strength = env[pk] / np.percentile(env[pk], 95)
    return [[round(float(t[i]), 3), round(float(min(1.0, s)), 3)] for i, s in zip(pk, strength)]


kicks = band_onsets(30, 120, 0.09)
snares = band_onsets(1800, 6000, 0.14, k=2.2, floor=0.14)
# a snare hit also has body around 200 Hz; drop high-band peaks that are just hats
body = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[(freqs >= 150) & (freqs < 400)], ref=np.max), sr=sr, hop_length=HOP)
bthr = np.percentile(body, 85)
snares = [s for s in snares if body[int(round(s[0] * sr / HOP))] > bthr]

json.dump({"kicks": kicks, "snares": snares}, open(os.path.join(ROOT, "timing", "drums.json"), "w"))
print(f"{len(kicks)} kicks, {len(snares)} snares")
for a, b in [(72, 76), (250, 256)]:
    print(f"{a}-{b}s kicks:", [k[0] for k in kicks if a <= k[0] < b])
    print(f"{a}-{b}s snares:", [s[0] for s in snares if a <= s[0] < b])
