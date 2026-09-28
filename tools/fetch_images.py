"""Download the period images listed in assets/images/manifest.json and record
their metadata and rights in assets/images/sources.json and CREDITS.md.

Sources: Library of Congress (master TIFF, "No known restrictions"), Art Institute
of Chicago (IIIF, public domain only). Raw files go to assets/images/raw/ (not
committed); run tools/prep_images.py afterwards.

Usage: python3 tools/fetch_images.py [id ...]
"""
import io, json, os, sys, time, urllib.request
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "assets", "images", "raw")
os.makedirs(RAW, exist_ok=True)
UA = {"User-Agent": "MaratLyricVideo/1.0 (lyric video; public-domain period prints)"}
manifest = json.load(open(os.path.join(ROOT, "assets", "images", "manifest.json")))
src_path = os.path.join(ROOT, "assets", "images", "sources.json")
sources = json.load(open(src_path)) if os.path.exists(src_path) else {}


def get(url, tries=4):
    for k in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
        except Exception as e:
            if k == tries - 1:
                raise
            time.sleep(2 ** (k + 1))


def fetch_loc(ref):
    d = json.loads(get(f"https://www.loc.gov/pictures/item/{ref}/?fo=json"))
    it = d["item"]
    res = d["resources"][0]
    url = next((res[k] for k in ("larger", "large", "medium") if res.get(k) and "notdig" not in res[k]), None)
    meta = {
        "title": it.get("title"),
        "date": it.get("created_published_date"),
        "creator": ", ".join(c.get("title", "") for c in (it.get("creators") or [])) or None,
        "medium": it.get("medium") or ", ".join(it.get("medium_brief") or []) or None,
        "rights": it.get("rights_information"),
        "page": f"https://www.loc.gov/pictures/item/{ref}/",
        "image": url,
    }
    return meta, get(url)


def fetch_aic(ref):
    d = json.loads(get(f"https://api.artic.edu/api/v1/artworks/{ref}?fields=id,title,date_display,artist_display,medium_display,is_public_domain,image_id"))["data"]
    assert d["is_public_domain"], f"AIC {ref} is not public domain"
    url = f"https://www.artic.edu/iiif/2/{d['image_id']}/full/2400,/0/default.jpg"
    meta = {
        "title": d["title"],
        "date": d["date_display"],
        "creator": d["artist_display"],
        "medium": d["medium_display"],
        "rights": "Public domain (Art Institute of Chicago, CC0)",
        "page": f"https://www.artic.edu/artworks/{ref}",
        "image": url,
    }
    return meta, get(url)


want = set(sys.argv[1:])
for e in manifest["images"]:
    if (want and e["id"] not in want) or e.get("raw"):
        continue
    out = os.path.join(RAW, e["id"] + ".png")
    if os.path.exists(out) and e["id"] in sources:
        continue
    try:
        meta, data = (fetch_loc if e["src"] == "loc" else fetch_aic)(e["ref"])
        im = Image.open(io.BytesIO(data))
        im = im.convert("RGB")
        cap = 6000 if e.get("hires") else 3000  # storyboarded prints get close-ups
        if max(im.size) > cap:
            im.thumbnail((cap, cap), Image.LANCZOS)
        im.save(out)
        sources[e["id"]] = {**meta, "use": e["use"], "size": im.size}
        print(f"ok   {e['id']:24} {im.size} {meta['date']} | {meta['title'][:60]} | {meta['rights'][:40] if meta['rights'] else ''}")
    except Exception as ex:
        print(f"FAIL {e['id']:24} {ex}")
    json.dump(sources, open(src_path, "w"), indent=1, ensure_ascii=False)
    time.sleep(1)

# CREDITS.md
lines = ["# Image credits", "", "All images are period prints or paintings in the public domain / with no known "
         "restrictions on publication. Colour grading, cropping and cut-outs are ours.", ""]
for e in manifest["images"]:
    s = sources.get(e.get("raw", e["id"]))
    if not s:
        continue
    by = f" — {s['creator']}" if s.get("creator") else ""
    lines.append(f"- **{s['title']}**{by}, {s.get('date') or 'n.d.'}. {s.get('rights') or ''} Source: {s['page']}")
open(os.path.join(ROOT, "CREDITS.md"), "w").write("\n".join(lines) + "\n")
