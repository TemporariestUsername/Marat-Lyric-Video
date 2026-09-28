"""Detect the beat grid of the song and save it to timing/beats.json.

A fixed 129 BPM grid does not fit this recording: the tempo averages ~129.2 BPM
but the beat phase wanders by up to ~0.2 s between sections, so a rigid grid
lands visibly off the beat in places. We therefore use librosa's
dynamic-programming beat tracker on the percussive component (which follows
the local phase) and keep its beats as the grid. Downbeats are chosen per
window as the beat phase (mod 4) with the most low-frequency onset energy.

Usage: python3 timing/beats.py [assets/song.mp3]
"""
import json, sys
import numpy as np
import librosa

src = sys.argv[1] if len(sys.argv) > 1 else "assets/song.mp3"
sr, hop = 22050, 256
y, _ = librosa.load(src, sr=sr, mono=True)
dur = len(y) / sr

yp = librosa.effects.percussive(y, margin=3)
onset = librosa.onset.onset_strength(y=yp, sr=sr, hop_length=hop)
ot = librosa.times_like(onset, sr=sr, hop_length=hop)
tempo, bf = librosa.beat.beat_track(onset_envelope=onset, sr=sr, hop_length=hop,
                                    start_bpm=129, tightness=800)
beats = ot[bf]

# extrapolate the grid to cover the whole file (tracker may start late / stop early)
period = float(np.median(np.diff(beats)))
head = np.arange(beats[0] - period, 0, -period)[::-1]
tail = np.arange(beats[-1] + period, dur, period)
beats = np.concatenate([head, beats, tail])

# downbeats: low-band onset energy, choose bar phase per 32-beat window, then
# smooth by majority so the phase only changes when the evidence is strong
S = np.abs(librosa.stft(y, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[freqs < 180]), sr=sr, hop_length=hop)
lowv = np.interp(beats, librosa.times_like(low, sr=sr, hop_length=hop), low)
win = 32
phases = []
for s in range(0, len(beats), win):
    seg = np.arange(s, min(s + win, len(beats)))
    sc = [lowv[seg[(seg % 4) == p]].mean() if np.any((seg % 4) == p) else 0 for p in range(4)]
    phases.append(int(np.argmax(sc)))
glob = int(np.bincount(phases).argmax())
downbeats = [float(beats[i]) for i in range(len(beats)) if i % 4 == glob]

rms = librosa.feature.rms(y=y, hop_length=hop)[0]
rt = librosa.times_like(rms, sr=sr, hop_length=hop)
env_t = np.arange(0, dur, 0.1)
env = np.interp(env_t, rt, rms); env = env / env.max()

out = {
    "source": src,
    "duration": round(dur, 4),
    "bpm": round(60 / period, 3),
    "beatPeriod": round(period, 5),
    "method": "librosa DP beat tracker (percussive), tightness=800",
    "downbeatPhase": glob,
    "downbeatPhasePerWindow": phases,
    "beats": [round(float(t), 4) for t in beats],
    "downbeats": [round(t, 4) for t in downbeats],
    "energy": {"step": 0.1, "values": [round(float(v), 3) for v in env]},
}
json.dump(out, open("timing/beats.json", "w"), indent=1)
print(f"bpm={out['bpm']} beats={len(beats)} downbeatPhase={glob} perWindow={phases}")
