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
    <span class="sc">L'Ami du peuple · fifth pass</span>
    <h1>Gonna Need a Tub <em>(For All This Blood)</em></h1>
    <span class="sc">Pre-chorus + chorus 1 · 1:03 – 1:25 of the song</span>
  </header>
  <section>
    <h2>Every move has a reason</h2>
    <video id="chorus" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(chorus)}"></video>
    <ol>
      <li><span class="t">0:00</span> “I am the anger… of the people”: one dolly along the crowd at the Revolutionary Tribunal. It stops dead on JUST, the line's only accent.</li>
      <li><span class="t">0:05</span> “that's why they listen… BELIEVE”: Marat. Every word is one step closer to his face; his head jerks back on BELIEVE; the camera goes into his eye.</li>
      <li><span class="t">0:09</span> FIVE HUNDRED HEADS!: the page tears open on a parade of heads on pikes, and the camera counts them. FIVE frames the first, HUNDRED snaps to the next, HEADS! pulls back to all eight, while the tally builds 5 → 500.</li>
      <li><span class="t">0:11</span> (AMPUTATE!) cuts the whole picture through below the heads and wrenches the top away.</li>
      <li><span class="t">0:12</span> The repeat is the same count, mirrored, on the 1789 heads, seen through the wound. (OPERATE!) slams the halves together and stitches them in blood.</li>
      <li><span class="t">0:14</span> “Apply the blade”: on the guillotine's crossbeam. On “blade” the camera falls with the blade and stops dead on the king's head. “loose the flood” lets the red in.</li>
      <li><span class="t">0:16</span> “WE'RE GONNA NEED A TUB”: Marat's room, from the 1793 assassination plate. On TUB the camera snaps onto his bath, where he will die. BLOOD floods it.</li>
    </ol>
    <p>What's gone: random tilts, random crops, the constant camera wobble, and strobes and glitches on every line. What's left fires on purpose: one rupture on the tear, a strobe on each downbeat of the hook, and blood on AMPUTATE, OPERATE and BLOOD.</p>
  </section>
  <section>
    <h2>Sync check</h2>
    <p>The same stretch of song with each word flashing red on the frame the video treats as its onset. Every flash should land on the start of the sung word. Watch this one with sound whenever you can and note any word that looks early or late.</p>
    <video id="sync" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(sync)}"></video>
  </section>
  <section>
    <h2>Period images</h2>
    <p>Prints from 1789 to about 1804 (Library of Congress, public domain / no known restrictions), plus a photograph of Boze's 1793 portrait of Marat. Everything is graded to ink and sepia with only the reds kept; red on this sheet marks cut-outs. Full credits are in CREDITS.md in the repository.</p>
    <img alt="Contact sheet of the graded period images and cut-outs" src="data:image/jpeg;base64,{b64(sil)}">
  </section>
</main>
"""
open(out, "w").write(html)
print(out, len(html) // 1024, "KB")
