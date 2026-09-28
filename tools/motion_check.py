"""Report how much the picture moves, to catch static stretches.

Usage: python3 tools/motion_check.py out/clip.mp4
Prints the median frame-to-frame difference, the longest near-static run, and
mean motion per second.
"""
import subprocess, sys
import numpy as np

W, H = 192, 108
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
    capture_output=True, check=True,
).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(float)
d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
print(f"frames {len(f)}  median diff {np.median(d):.2f}  min {d.min():.2f}")
run = worst = at = 0
for i, low in enumerate(d < 0.35):
    run = run + 1 if low else 0
    if run > worst:
        worst, at = run, i
print(f"longest near-static run: {worst} frames ({worst / 30:.2f}s) ending at {at / 30:.2f}s")
print("per-second mean diff:", " ".join(f"{d[i:i + 30].mean():.1f}" for i in range(0, len(d), 30)))
