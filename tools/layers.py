"""Split a graded print into depth layers for parallax. No generated imagery:
every layer is cut from the print itself.

Methods
  density  engravers draw depth with ink: near things are heavier and darker,
           far things lighter and hazier. Depth = smoothed ink density, plus a
           ground-plane prior (lower in the frame = nearer). Sliced into bands.
  cut      a single clear figure lifted out with the same segmentation model
           the cut-outs use (plus the manifest's cut_exclude polygons), as the
           near layer. Parallax is only used for these.

The base plate is the whole print, darkened and softened where a nearer
layer was lifted, so when layers slide apart the gap reads as shadow.

Output: public/img/layers/<id>_0.jpg (base) and <id>_1.png, <id>_2.png ...
(nearer), all the same frame as public/img/<id>.jpg; index in
public/img/layers/index.json.

Usage: python3 tools/layers.py <id> density [n=3] [prior=0.35]
       python3 tools/layers.py <id> cut [model=u2net_human_seg]
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "img")
OUT = os.path.join(SRC, "layers")
INDEX = os.path.join(SRC, "layers-index.json")  # committed; the layer images are rebuilt by tools/make_layers.sh
os.makedirs(OUT, exist_ok=True)
MAXW = 2600


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def density_masks(rgb, n, prior):
    g = rgb.astype(float).mean(2) / 255.0
    h, w = g.shape
    dark = 1 - g
    d = ndimage.gaussian_filter(dark, w * 0.012)
    lo, hi = np.percentile(d, 5), np.percentile(d, 97)
    d = np.clip((d - lo) / (hi - lo + 1e-6), 0, 1)
    ramp = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
    depth = (1 - prior) * d + prior * ramp
    depth = ndimage.gaussian_filter(depth, w * 0.01)
    # band thresholds at depth quantiles: the nearest bands are the smallest
    qs = [np.percentile(depth, q) for q in np.linspace(55, 88, n - 1)]
    masks = []
    for q in qs:
        m = smoothstep(q - 0.03, q + 0.03, depth)
        m = ndimage.binary_closing(m > 0.5, iterations=6).astype(float) * 0.5 + m * 0.5
        masks.append(ndimage.gaussian_filter(m, 3))
    return masks


def cut_mask(rgb, model, exclude=None):
    from rembg import new_session, remove
    from PIL import ImageDraw

    im = Image.fromarray(rgb)
    a = np.array(remove(im, session=new_session(model)))[..., 3].astype(float) / 255.0
    if exclude:  # manual exclusions (manifest cut_exclude: polygons in fractions of the crop)
        mk = Image.new("L", im.size, 255)
        dr = ImageDraw.Draw(mk)
        for poly in exclude:
            dr.polygon([(x * im.width, y * im.height) for x, y in poly], fill=0)
        a *= np.array(mk) / 255.0
    return [ndimage.gaussian_filter(a, 1.2)]


def main():
    k, method = sys.argv[1], sys.argv[2]
    im = Image.open(os.path.join(SRC, k + ".jpg")).convert("RGB")
    if im.width > MAXW:
        im = im.resize((MAXW, round(im.height * MAXW / im.width)), Image.LANCZOS)
    rgb = np.array(im)
    if method == "density":
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 3
        prior = float(sys.argv[4]) if len(sys.argv) > 4 else 0.35
        masks = density_masks(rgb, n, prior)
    else:
        man = {e["id"]: e for e in json.load(open(os.path.join(ROOT, "assets", "images", "manifest.json")))["images"]}
        masks = cut_mask(rgb, sys.argv[3] if len(sys.argv) > 3 else "u2net_human_seg", man.get(k, {}).get("cut_exclude"))
    soft = np.stack([ndimage.gaussian_filter(rgb[..., c].astype(float), 6) for c in range(3)], 2)

    def shadowed(cover):
        # darken and soften the plate wherever a nearer layer was lifted off it
        under = ndimage.gaussian_filter(ndimage.grey_dilation(cover, size=(25, 25)), 12)
        out = rgb.astype(float) * (1 - under[..., None]) + soft * under[..., None]
        return np.clip(out * (1 - 0.35 * under[..., None]), 0, 255).astype(np.uint8)

    Image.fromarray(shadowed(np.clip(masks[0], 0, 1))).save(os.path.join(OUT, f"{k}_0.jpg"), quality=88)
    for i, m in enumerate(masks):
        plate = shadowed(masks[i + 1]) if i + 1 < len(masks) else rgb
        rgba = np.dstack([plate, np.clip(m * 255, 0, 255).astype(np.uint8)])
        Image.fromarray(rgba).save(os.path.join(OUT, f"{k}_{i + 1}.png"), optimize=True)
    idx_path = INDEX
    idx = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    idx[k] = {"n": 1 + len(masks), "method": method}
    json.dump(idx, open(idx_path, "w"), indent=1)
    print(k, method, "layers:", 1 + len(masks), "coverage:", [round(float(m.mean()), 3) for m in masks])


if __name__ == "__main__":
    main()
