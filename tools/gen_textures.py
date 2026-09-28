"""Generate the static textures (so Chrome never runs per-frame SVG turbulence).

Style reference: the track cover, an 18th-century engraving. Sepia paper with
burnt edges and foxing, tone built from line hatching whose line WIDTH carries
the tone, the way a burin engraving does.

  public/tex/paper.jpg          sepia plate paper, larger than the frame for camera moves
  public/tex/hatch_vignette.png transparent ink crosshatch, dense at the edges, open in the centre
  public/tex/hatch_{1,2,3}.png  seamless 512px hatch tiles (light / mid / dense) for fills
  public/tex/grunge.png         alpha mask with ink dropouts, for stamps and heavy type
  public/tex/speckle.png        ink specks + dust on transparent, overlaid on the page

Usage: python3 tools/gen_textures.py
"""
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

rng = np.random.default_rng(1793)
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "tex")
os.makedirs(OUT, exist_ok=True)
INK = np.array([23, 18, 13], float)


def fbm(h, w, scales, weights):
    acc = np.zeros((h, w))
    for s, wt in zip(scales, weights):
        n = gaussian_filter(rng.standard_normal((h, w)), s)
        acc += wt * n / (n.std() + 1e-9)
    return acc


def hatch(h, w, angle_deg, period, width, wobble=None):
    """Ink coverage 0..1 of parallel lines. `width` (px, scalar or array) sets the tone."""
    yy, xx = np.mgrid[:h, :w].astype(float)
    a = np.deg2rad(angle_deg)
    u = xx * np.cos(a) + yy * np.sin(a)
    if wobble is not None:
        u = u + wobble
    d = np.abs(((u / period) % 1.0) - 0.5) * period  # distance to line centre, px
    half = np.maximum(np.asarray(width, float) / 2, 0.0)
    # anti-aliased edge; lines thinner than ~0.4 px fade out instead of leaving a faint screen
    return np.clip(half + 0.5 - d, 0, 1) * np.clip(half * 2.5, 0, 1)


# ---------- paper ----------
W, H = 2304, 1296
yy, xx = np.mgrid[:H, :W]
nx, ny = (xx / W - 0.5) * 2, (yy / H - 0.5) * 2
centre = np.array([219, 199, 158], float)
edge = np.array([140, 108, 66], float)
r = np.clip((nx ** 2 * 0.8 + ny ** 2) ** 0.9, 0, 1.4)
burn = np.clip(r + fbm(H, W, [90, 25], [0.07, 0.03]), 0, 1) ** 2.2
img = centre * (1 - burn[..., None]) + edge * burn[..., None]
img += fbm(H, W, [60, 14, 3], [0.6, 0.45, 0.35])[..., None] * np.array([4.0, 4.5, 5.5])
for _ in range(34):  # foxing
    cx, cy, rad = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(6, 60)
    m = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / rad ** 2)) * rng.uniform(0.15, 0.5)
    img -= m[..., None] * np.array([28, 42, 62])
fib = gaussian_filter((rng.random((H, W)) < 0.002).astype(float), 0.8)
img -= fib[..., None] * 40
img += rng.normal(0, 3.0, (H, W))[..., None]
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(os.path.join(OUT, "paper.jpg"), quality=90)

# ---------- engraved vignette: tone -> line width ----------
tone = np.clip((nx ** 2 * 0.7 + ny ** 2) ** 1.5 * 0.85 - 0.2 + fbm(H, W, [70], [0.07]), 0, 1)
wob = fbm(H, W, [30], [1.2])
cov = np.zeros((H, W))
cov = np.maximum(cov, hatch(H, W, 38, 6.5, 3.4 * np.clip(tone / 0.8, 0, 1), wob))
cov = np.maximum(cov, hatch(H, W, -52, 7.0, 2.8 * np.clip((tone - 0.4) / 0.5, 0, 1), wob * 0.8))
cov = np.maximum(cov, hatch(H, W, 90, 6.0, 2.2 * np.clip((tone - 0.7) / 0.3, 0, 1), wob * 0.6))
rgba = np.zeros((H, W, 4), np.uint8)
rgba[..., :3] = INK
rgba[..., 3] = (np.clip(cov, 0, 1) * 235).astype(np.uint8)
Image.fromarray(rgba).save(os.path.join(OUT, "hatch_vignette.png"))

# ---------- seamless hatch tiles (angles chosen to tile at 512px) ----------
T = 512
for name, layers in {
    "hatch_1": [(45, T / 64, 1.1)],
    "hatch_2": [(45, T / 64, 1.6), (-45, T / 64, 1.0)],
    "hatch_3": [(45, T / 64, 2.2), (-45, T / 64, 1.6), (0, T / 64, 1.0)],
}.items():
    cov = np.zeros((T, T))
    for ang, per, wd in layers:
        # 45/-45/0 degree lines with a period dividing 512*sqrt2 tile cleanly
        p = per * (np.sqrt(2) if ang % 90 else 1)
        cov = np.maximum(cov, hatch(T, T, ang, p, wd))
    rgba = np.zeros((T, T, 4), np.uint8)
    rgba[..., :3] = INK
    rgba[..., 3] = (np.clip(cov, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(rgba).save(os.path.join(OUT, f"{name}.png"))

# ---------- grunge mask (for stamps) ----------
GW, GH = 1024, 512
n = fbm(GH, GW, [18, 5, 1.2], [1.0, 0.8, 0.9])
holes = (n < -1.35).astype(float)
specks = gaussian_filter((rng.random((GH, GW)) < 0.004).astype(float), 1.2) > 0.05
alpha = 1 - np.clip(gaussian_filter(holes, 0.8) * 1.4 + specks * 0.9, 0, 1)
alpha = np.clip(alpha * (0.82 + 0.18 * (fbm(GH, GW, [40], [1.0]) > -0.4)), 0, 1)
rgba = np.zeros((GH, GW, 4), np.uint8)
rgba[..., :3] = 255
rgba[..., 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(rgba).save(os.path.join(OUT, "grunge.png"))

# ---------- speckle overlay ----------
SW, SH = 1920, 1080
a = np.zeros((SH, SW))
pts = rng.random((SH, SW)) < 0.0007
a[pts] = rng.uniform(0.3, 1.0, pts.sum())
a = gaussian_filter(a, 0.9) * 3
rgba = np.zeros((SH, SW, 4), np.uint8)
rgba[..., :3] = INK
rgba[..., 3] = (np.clip(a, 0, 1) * 190).astype(np.uint8)
Image.fromarray(rgba).save(os.path.join(OUT, "speckle.png"))
print("textures written to", OUT)
