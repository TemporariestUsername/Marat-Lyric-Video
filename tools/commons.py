"""Wikimedia Commons client: search, metadata (licence, author, date) and
downloads, with polite pacing and backoff (Commons rate-limits bursts).

  python3 tools/commons.py search "<query>" [limit]
"""
import json, sys, time, urllib.parse, urllib.request

UA = {"User-Agent": "MaratLyricVideo/1.0 (https://github.com/TemporariestUsername/Marat-Lyric-Video) python-urllib"}
API = "https://commons.wikimedia.org/w/api.php"
_last = [0.0]


def _get(url, tries=6, pace=2.5):
    for k in range(tries):
        wait = _last[0] + pace - time.time()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=180).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and k < tries - 1:
                time.sleep(10 * 2**k)
                continue
            raise
        except Exception:
            if k == tries - 1:
                raise
            time.sleep(5 * 2**k)


def api(tries=5, **params):
    params = {"format": "json", **params}
    for k in range(tries):
        raw = _get(API + "?" + urllib.parse.urlencode(params))
        try:
            return json.loads(raw)
        except json.JSONDecodeError:  # an HTML rate-limit page
            time.sleep(15 * 2**k)
    raise RuntimeError("Commons API kept refusing")


def search(q, limit=12):
    d = api(action="query", generator="search", gsrsearch=q, gsrnamespace=6, gsrlimit=limit, prop="imageinfo", iiprop="size")
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 0))
    return [(p["title"], p["imageinfo"][0]["width"], p["imageinfo"][0]["height"]) for p in pages]


def info(title, width=None):
    """Metadata and a download URL (a thumbnail of `width` px if the original is bigger)."""
    params = dict(action="query", titles=title, prop="imageinfo", iiprop="url|size|extmetadata")
    if width:
        params["iiurlwidth"] = width
    p = next(iter(api(tries=2, **params)["query"]["pages"].values()))
    ii = p["imageinfo"][0]
    m = {k: v.get("value") for k, v in ii.get("extmetadata", {}).items()}
    strip = lambda s: " ".join(__import__("re").sub(r"<[^>]+>", " ", s or "").split()) or None
    url = ii.get("thumburl") if width and ii["width"] > width else ii["url"]
    return {
        "title": strip(m.get("ObjectName")) or title[5:],
        "date": strip(m.get("DateTimeOriginal")),
        "creator": strip(m.get("Artist")),
        "medium": None,
        "rights": strip(m.get("LicenseShortName")),
        "page": ii.get("descriptionurl"),
        "image": url,
    }


def direct_urls(title):
    """upload.wikimedia.org URLs computed from the file name (no API call):
    the standard 3840 and 1920 px thumbnails, then the original."""
    import hashlib

    n = title[5:].replace(" ", "_")
    h = hashlib.md5(n.encode()).hexdigest()
    q = urllib.parse.quote(n)
    base = f"https://upload.wikimedia.org/wikipedia/commons"
    thumb = lambda w: f"{base}/thumb/{h[0]}/{h[:2]}/{q}/{w}px-{q}" + (".jpg" if n.lower().endswith((".djvu", ".pdf", ".tif", ".tiff")) else "")
    if n.lower().endswith((".djvu", ".pdf")):
        thumb = lambda w: f"{base}/thumb/{h[0]}/{h[:2]}/{q}/page1-{w}px-{q}.jpg"
    return [thumb(3840), thumb(1920), f"{base}/{h[0]}/{h[:2]}/{q}"]


def fetch(title, width=6000, with_meta=False):
    """The image, fetched straight from the file server. Metadata comes from the
    API when it answers; otherwise it is left marked for a later check."""
    data = url = None
    for u in direct_urls(title):
        try:
            data, url = _get(u, tries=3, pace=5), u
            break
        except urllib.error.HTTPError as e:
            if e.code not in (400, 404, 429):
                raise
    if data is None:
        raise RuntimeError(f"no downloadable size for {title}")
    try:
        if not with_meta:
            raise RuntimeError("metadata deferred")
        meta = info(title)
    except Exception:
        meta = {"title": title[5:], "date": None, "creator": None, "medium": None, "rights": "UNCHECKED (Commons API unavailable)", "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))}
    meta["image"] = url
    return meta, data


def fill_rights(sources_path):
    """Second pass: licence, author and date for entries downloaded without them."""
    src = json.load(open(sources_path))
    for k, v in src.items():
        if not str(v.get("rights", "")).startswith("UNCHECKED"):
            continue
        title = "File:" + urllib.parse.unquote(v["page"].rsplit("/wiki/", 1)[1]).replace("_", " ")
        try:
            m = info(title)
        except Exception as e:
            print("still unavailable:", k, e)
            break
        v.update({x: m[x] for x in ("title", "date", "creator", "rights") if m.get(x)})
        print("rights", k, v["rights"])
        json.dump(src, open(sources_path, "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    if sys.argv[1] == "rights":
        fill_rights(sys.argv[2])
    elif sys.argv[1] == "search":
        for t, w, h in search(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 12):
            print(f"{w:5d}x{h:<5d} {t[5:]}")
