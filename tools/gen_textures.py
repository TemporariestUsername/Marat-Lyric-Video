"""Generate the static textures the video uses (so Chrome never runs per-frame
SVG turbulence over the full frame).

  public/tex/paper.jpg    aged newsprint, slightly larger than the frame for camera moves
  public/tex/grunge.png   alpha mask with ink dropouts, for rubber stamps / heavy type
  public/tex/speckle.png  sparse ink specks + dust on transparent, overlaid on the page

Usage: python3 tools/gen_textures.py
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

rng = np.random.default_rng(1793)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "tex")
os.makedirs(OUT, exist_ok=True)

def fbm(h, w, scales, weights):
    acc = np.zeros((h, w))
    for s, wt in zip(scales, weights):
        n = gaussian_filter(rng.standard_normal((h, w)), s)
        acc += wt * n / (n.std() + 1e-9)
    return acc

# ---------- paper ----------
W, H = 2304, 1296
base = np.array([234, 221, 188], float)
mott = fbm(H, W, [120, 40, 12, 2], [1.0, 0.6, 0.35, 0.25])
img = base[None, None, :] + mott[..., None] * np.array([7.0, 7.5, 8.5])

# foxing: brown blotches
for _ in range(26):
    cx, cy = rng.uniform(0, W), rng.uniform(0, H)
    r = rng.uniform(8, 70)
    yy, xx = np.ogrid[:H, :W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    m = np.exp(-d ** 2) * rng.uniform(0.15, 0.5)
    img -= m[..., None] * np.array([30, 45, 70])

# fibres
fib = np.zeros((H, W))
for _ in range(9000):
    x, y = rng.uniform(0, W), rng.uniform(0, H)
    a = rng.uniform(0, np.pi)
    L = rng.uniform(6, 30)
    v = rng.choice([-1, 1]) * rng.uniform(0.3, 1.0)
    for s in np.linspace(0, L, int(L)):
        xi, yi = int(x + np.cos(a) * s), int(y + np.sin(a) * s)
        if 0 <= xi < W and 0 <= yi < H:
            fib[yi, xi] += v
fib = gaussian_filter(fib, 0.6)
img += fib[..., None] * 10

# folds: one vertical + one horizontal crease
yy, xx = np.mgrid[:H, :W]
for pos, axis in [(W * 0.5, xx), (H * 0.52, yy)]:
    d = axis - pos
    img -= (np.exp(-(d / 3) ** 2) * 14 - np.exp(-((d - 6) / 10) ** 2) * 5)[..., None]

# edge burn / vignette
nx, ny = (xx / W - 0.5) * 2, (yy / H - 0.5) * 2
v = np.clip((nx ** 2 + ny ** 2) ** 1.4 * 0.55, 0, 1) + 0.15 * np.clip(np.abs(nx) ** 8 + np.abs(ny) ** 8, 0, 1)
img = img * (1 - v[..., None] * np.array([0.30, 0.38, 0.52]))

grain = rng.normal(0, 3.2, (H, W))
img += grain[..., None]
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(OUT, "paper.jpg"), quality=90)

# ---------- grunge mask (for stamps) ----------
GW, GH = 1024, 512
n = fbm(GH, GW, [18, 5, 1.2], [1.0, 0.8, 0.9])
holes = (n < -1.35).astype(float)
specks = (rng.random((GH, GW)) < 0.004).astype(float)
specks = gaussian_filter(specks, 1.2) > 0.05
alpha = 1 - np.clip(gaussian_filter(holes, 0.8) * 1.4 + specks * 0.9, 0, 1)
alpha = np.clip(alpha * (0.82 + 0.18 * (fbm(GH, GW, [40], [1.0]) > -0.4)), 0, 1)
rgba = np.zeros((GH, GW, 4), np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(rgba).save(os.path.join(OUT, "grunge.png"))

# ---------- speckle overlay ----------
SW, SH = 1920, 1080
a = np.zeros((SH, SW))
pts = rng.random((SH, SW)) < 0.0009
a[pts] = rng.uniform(0.3, 1.0, pts.sum())
a = gaussian_filter(a, 0.9) * 3
for _ in range(40):  # a few hairlines / scratches
    x0, y0 = rng.uniform(0, SW), rng.uniform(0, SH)
    ang = rng.uniform(0, np.pi); L = rng.uniform(20, 140)
    for s in np.linspace(0, L, int(L * 2)):
        xi, yi = int(x0 + np.cos(ang) * s), int(y0 + np.sin(ang) * s)
        if 0 <= xi < SW and 0 <= yi < SH:
            a[yi, xi] = max(a[yi, xi], 0.35)
rgba = np.zeros((SH, SW, 4), np.uint8)
rgba[..., :3] = [27, 22, 17]
rgba[..., 3] = (np.clip(a, 0, 1) * 200).astype(np.uint8)
Image.fromarray(rgba).save(os.path.join(OUT, "speckle.png"))
print("textures written to", OUT)
