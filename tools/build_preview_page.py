"""Build the review page (HTML with the preview clips embedded) for the Artifact.

Usage: python3 tools/build_preview_page.py <out.html> <chorus720.mp4> <sync720.mp4> <silhouettes.jpg>
"""
import base64, sys

out, chorus, sync, sil = sys.argv[1:5]
b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()

html = f"""<title>Marat Chorus Preview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=swap">
<style>
  :root {{ color-scheme: dark; --ground:#15100b; --paper:#e8d8b4; --muted:#b09c78; --blood:#b3150f; --rule:#3b3025; }}
  body {{ background:var(--ground); color:var(--paper); font:18px/1.55 "IM Fell English", Georgia, serif; }}
  main {{ max-width:1100px; margin:0 auto; padding:32px 16px 56px; display:grid; gap:28px; }}
  header {{ display:grid; gap:6px; border-bottom:1px solid var(--rule); padding-bottom:16px; }}
  .sc {{ font-family:"IM Fell English SC", Georgia, serif; letter-spacing:.12em; color:var(--muted); font-size:15px; }}
  h1 {{ margin:0; font-weight:400; font-size:clamp(30px,5vw,54px); line-height:1.05; text-wrap:balance; }}
  h1 em {{ color:var(--blood); }}
  h2 {{ margin:0; font-weight:400; font-size:26px; }}
  section {{ display:grid; gap:10px; }}
  video, img {{ width:100%; max-width:100%; display:block; border:1px solid var(--rule); background:#000; }}
  video {{ aspect-ratio:16/9; }}
  p {{ margin:0; color:var(--muted); max-width:65ch; }}
  ol {{ margin:0; padding-left:1.3em; display:grid; gap:4px; max-width:70ch; color:var(--muted); }}
  .t {{ font-variant-numeric:tabular-nums; color:var(--paper); }}
</style>
<main>
  <header>
    <span class="sc">L'Ami du peuple · second pass</span>
    <h1>Gonna Need a Tub <em>(For All This Blood)</em></h1>
    <span class="sc">Chorus 1 · 1:07 – 1:25 of the song</span>
  </header>
  <section>
    <h2>Chorus 1, redesigned</h2>
    <video id="chorus" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(chorus)}"></video>
    <ol>
      <li><span class="t">0:00</span> Pre-chorus in the print shop: the press platen strikes on every sung word.</li>
      <li><span class="t">0:05</span> On “FIVE” the page tears open onto the crowd; the engraved 500 lands.</li>
      <li><span class="t">0:06</span> The hook builds word by word; (AMPUTATE!) and (OPERATE!) stamp in blood.</li>
      <li><span class="t">0:10</span> The guillotine blade drops on “blade” and cuts the board in two.</li>
      <li><span class="t">0:12</span> The headline slams in; BLOOD bleeds down from its letters.</li>
      <li><span class="t">0:15</span> The page turns to verse 2.</li>
    </ol>
  </section>
  <section>
    <h2>Sync check</h2>
    <p>The same stretch of song with each word flashing red on the frame the video treats as its onset. Every flash should land on the start of the sung word. Note any word that looks early or late.</p>
    <video id="sync" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(sync)}"></video>
  </section>
  <section>
    <h2>Silhouettes</h2>
    <p>Drawn in the cover's paper-cut style: the hand press, the guillotine and its blade, and the crowd with bonnets rouges, tricornes and pikes. Marat and Corday come next, as profile busts.</p>
    <img alt="Silhouette sheet: printing press, guillotine, blade, crowd with pikes" src="data:image/jpeg;base64,{b64(sil)}">
  </section>
</main>
"""
open(out, "w").write(html)
print(out, len(html) // 1024, "KB")
