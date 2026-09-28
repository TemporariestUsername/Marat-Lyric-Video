"""Generate engraving-style plates through OpenRouter image models.

Real period prints are passed as style references so the new plates match
them. Every call's cost is appended to assets/images/generated/spend.json,
and the script refuses to run past the budget.

Usage:
  python3 tools/gen_plate.py <id> "<prompt>" [--ref raw_id ...] [--edit raw_id]
                             [--model google/gemini-3-pro-image-preview] [--aspect 16:9]
  python3 tools/gen_plate.py --spend
"""
import argparse, base64, io, json, os, sys, time, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets/images/raw"
OUT = ROOT / "assets/images/generated"
SPEND = OUT / "spend.json"
BUDGET = 20.0  # USD agreed with the user

STYLE = (
    "A hand-made copperplate etching and engraving from Paris, 1789-1794, in the style of the attached period "
    "prints: black ink line on off-white laid paper, cross-hatching and stipple for all tone, no grey wash, no "
    "photographic shading, no colour. Loose, slightly crude revolutionary broadside draughtsmanship, as in the "
    "references. The picture fills the whole frame edge to edge, drawn everywhere, no blank or solid black areas. Figures in period dress (1790s France). No text, no captions, no signatures, no borders, no "
    "modern objects."
)


def spent() -> float:
    return sum(e["cost"] for e in json.loads(SPEND.read_text())) if SPEND.exists() else 0.0


def ref_uri(raw_id: str, max_side: int = 1280) -> str:
    im = Image.open(RAW / f"{raw_id}.png").convert("L")
    im.thumbnail((max_side, max_side))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=85)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def call(model: str, content: list, aspect: str, size: str) -> dict:
    body = {
        "model": model,
        "messages": [{"role": "user", "content": content}],
        "modalities": ["image", "text"],
        "image_config": {"aspect_ratio": aspect, "image_size": size},
        "usage": {"include": True},
    }
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}", "Content-Type": "application/json"},
    )
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            msg = e.read().decode()[:500]
            if e.code in (429, 502, 503) and attempt < 3:
                time.sleep(2 ** (attempt + 2))
                continue
            sys.exit(f"HTTP {e.code}: {msg}")
    sys.exit("gave up")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("id", nargs="?")
    ap.add_argument("prompt", nargs="?")
    ap.add_argument("--ref", nargs="*", default=["comite_revolutionnaire", "fouquier_tribunal"])
    ap.add_argument("--edit", help="raw id of an image to edit (inpaint/extend) instead of generating fresh")
    ap.add_argument("--model", default="google/gemini-3-pro-image-preview")
    ap.add_argument("--aspect", default="16:9")
    ap.add_argument("--n", type=int, default=1, help="variants")
    ap.add_argument("--size", default="2K", help="1K, 2K or 4K (Gemini pro image)")
    ap.add_argument("--likeness", help="raw id of a portrait whose face the main figure must match")
    ap.add_argument("--spend", action="store_true")
    a = ap.parse_args()
    if a.spend:
        print(f"spent ${spent():.3f} of ${BUDGET:.2f}")
        return
    OUT.mkdir(parents=True, exist_ok=True)
    log = json.loads(SPEND.read_text()) if SPEND.exists() else []
    for v in range(a.n):
        if spent() >= BUDGET:
            sys.exit(f"budget reached (${spent():.2f})")
        content = []
        if a.edit:
            content.append({"type": "image_url", "image_url": {"url": ref_uri(a.edit, 2048)}})
            text = f"Edit the first attached image. {a.prompt} Keep its exact drawing style, line quality and paper. "
        else:
            text = f"{STYLE}\n\nScene: {a.prompt}"
        if a.likeness:
            content.append({"type": "image_url", "image_url": {"url": ref_uri(a.likeness)}})
            text += "\nThe main figure's face must be a faithful likeness of the sitter in the portrait attached right after this text (same features, same age), redrawn as an etching."
        for r in a.ref:
            content.append({"type": "image_url", "image_url": {"url": ref_uri(r)}})
        content.insert(0, {"type": "text", "text": text + ("\nThe remaining attached images are style references only; do not copy their compositions." if a.ref else "")})
        res = call(a.model, content, a.aspect, a.size)
        msg = res["choices"][0]["message"]
        imgs = msg.get("images") or []
        cost = float(res.get("usage", {}).get("cost") or 0)
        name = f"{a.id}" + (f"_v{v + 1}" if a.n > 1 else "")
        entry = {"id": name, "model": a.model, "cost": cost, "prompt": a.prompt, "refs": a.ref, "edit": a.edit, "at": time.strftime("%Y-%m-%d %H:%M:%S")}
        if not imgs:
            entry["error"] = (msg.get("content") or "")[:300]
            print("no image returned:", entry["error"])
        else:
            data = base64.b64decode(imgs[0]["image_url"]["url"].split(",", 1)[1])
            p = OUT / f"{name}.png"
            p.write_bytes(data)
            w, h = Image.open(p).size
            entry["size"] = [w, h]
            print(f"{p.relative_to(ROOT)} {w}x{h} ${cost:.3f}")
        log.append(entry)
        SPEND.write_text(json.dumps(log, indent=1))
    print(f"spent ${spent():.3f} of ${BUDGET:.2f}")


if __name__ == "__main__":
    main()
