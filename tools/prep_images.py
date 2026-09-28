"""Crop, grade and cut out the period images for the video.

  crop   Library scans carry colour bars and wide margins. Each image is
         cropped to its printed area: automatically (the largest block of
         ink detail, ignoring saturated colour-target strips), or by a manual
         "crop": [x0, y0, x1, y1] (fractions) in the manifest when auto fails.
  grade  Luminance is mapped onto a duotone between engraving ink and sepia
         paper; strong reds in the original (hand-coloured prints) are kept and
         pushed toward the blood palette, so blood stays the only colour.
  cutout Figures marked "cutout" get a transparent background (rembg;
         "cutmodel" picks the model, "cut_exclude" polygons clear background
         the model keeps), saved as PNG.

Outputs public/img/<id>.jpg (plates) and public/img/<id>_cut.png (cut-outs),
plus public/img/index.json with sizes for the Remotion side.

Usage: python3 tools/prep_images.py [id ...]
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "images", "raw")
OUT = os.path.join(ROOT, "public", "img")
os.makedirs(OUT, exist_ok=True)
manifest = json.load(open(os.path.join(ROOT, "assets", "images", "manifest.json")))
index_path = os.path.join(OUT, "index.json")
index = json.load(open(index_path)) if os.path.exists(index_path) else {}

INK = np.array([23, 18, 13], float)
PAPER = np.array([219, 199, 158], float)
BLOOD = np.array([150, 16, 12], float)


def auto_crop(rgb):
    """Bounding box of the printed area: dense detail, not paper, not colour targets."""
    a = rgb.astype(float)
    g = a.mean(2)
    small = 600 / max(g.shape)
    gs = ndimage.zoom(g, small, order=1)
    ss = ndimage.zoom(a.max(2) - a.min(2), small, order=1)  # saturation-ish
    grad = np.hypot(ndimage.sobel(gs, 0), ndimage.sobel(gs, 1))
    detail = ndimage.uniform_filter(grad, 9) > np.percentile(grad, 70)
    # colour targets: saturated blocks at the edges
    target = ndimage.uniform_filter((ss > 90).astype(float), 15) > 0.5
    mask = ndimage.binary_closing(detail & ~target, iterations=6)
    lab, n = ndimage.label(mask)
    if n == 0:
        return (0, 0, 1, 1)
    sizes = ndimage.sum(mask, lab, range(1, n + 1))
    keep = lab == (np.argmax(sizes) + 1)
    ys, xs = np.where(keep)
    h, w = gs.shape
    pad = 0.01
    return (max(0, xs.min() / w - pad), max(0, ys.min() / h - pad), min(1, xs.max() / w + pad), min(1, ys.max() / h + pad))


def grade(rgb):
    a = rgb.astype(float) / 255.0
    lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
    # normalise the print's own paper/ink range, then a gentle S-curve
    lo, hi = np.percentile(lum, 1.5), np.percentile(lum, 97)
    l = np.clip((lum - lo) / max(1e-3, hi - lo), 0, 1)
    l = l * l * (3 - 2 * l) * 0.6 + l * 0.4
    duo = INK[None, None] * (1 - l[..., None]) + PAPER[None, None] * l[..., None]
    # keep reds
    r, gch, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / (mx + 1e-6)
    redness = np.clip((r - np.maximum(gch, b)) / (mx + 1e-6), 0, 1)
    m = np.clip((sat - 0.3) / 0.3, 0, 1) * np.clip((redness - 0.35) / 0.3, 0, 1)
    m = ndimage.gaussian_filter(m, 1.2)
    red = BLOOD[None, None] * (0.55 + 0.6 * l[..., None])
    out = duo * (1 - m[..., None]) + red * m[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


session = None
want = set(sys.argv[1:])
for e in manifest["images"]:
    k = e["id"]
    if want and k not in want:
        continue
    src = os.path.join(RAW, e.get("raw", k) + ".png")
    if not os.path.exists(src):
        print("missing", k)
        continue
    im = Image.open(src).convert("RGB")
    rgb = np.array(im)
    box = e.get("crop") or auto_crop(rgb)
    W, H = im.size
    im = im.crop((int(box[0] * W), int(box[1] * H), int(box[2] * W), int(box[3] * H)))
    im.thumbnail((4200, 4200) if e.get("hires") else (2400, 2400), Image.LANCZOS)
    g = Image.fromarray(grade(np.array(im)))
    g.save(os.path.join(OUT, k + ".jpg"), quality=88)
    entry = {"w": g.size[0], "h": g.size[1], "crop": [round(v, 3) for v in box]}
    if e.get("cutout"):
        model = e.get("cutmodel", "isnet-general-use")
        if session is None or session[0] != model:
            from rembg import new_session
            session = (model, new_session(model))
        from rembg import remove
        cut = remove(im, session=session[1])  # alpha from the ungraded crop
        alpha = np.array(cut)[..., 3].copy()
        # manual exclusions (polygons in fractions of the crop) for background the model keeps
        if e.get("cut_exclude"):
            from PIL import ImageDraw
            mk = Image.new("L", cut.size, 255)
            dr = ImageDraw.Draw(mk)
            for poly in e["cut_exclude"]:
                dr.polygon([(x * cut.size[0], y * cut.size[1]) for x, y in poly], fill=0)
            alpha = (alpha.astype(float) * np.array(mk) / 255).astype(np.uint8)
        ga = np.dstack([np.array(g), alpha])
        ys, xs = np.where(alpha > 20)
        ci = Image.fromarray(ga).crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        ci.save(os.path.join(OUT, k + "_cut.png"), optimize=True)
        entry["cut"] = {"w": ci.size[0], "h": ci.size[1]}
    index[k] = entry
    print(k, entry)
json.dump(index, open(index_path, "w"), indent=1)
