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
    <span class="sc">L'Ami du peuple · sixth pass</span>
    <h1>Gonna Need a Tub <em>(For All This Blood)</em></h1>
    <span class="sc">Pre-chorus + chorus 1 · 1:03 – 1:25 of the song</span>
  </header>
  <section>
    <h2>Every move has a reason, and now the drums push them</h2>
    <video id="chorus" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(chorus)}"></video>
    <ol>
      <li><span class="t">0:00</span> “I am the anger… of the people”: the dolly along the crowd at the Revolutionary Tribunal. Each snare shoves it forward. It stops dead on JUST, and every word that lands knocks the ones already standing.</li>
      <li><span class="t">0:05</span> “that's why they listen… BELIEVE”: Marat nods on the kick while the camera steps closer on every word. The push speeds up bar by bar. His head jerks back on BELIEVE and the camera dives into his eye.</li>
      <li><span class="t">0:09</span> FIVE HUNDRED HEADS!: the camera counts the heads on pikes. The moves overshoot and spring back, leaving a speed trail. The tally rolls up like a counter (5 … 500) and pumps on every kick. While a frame holds, it cuts on the kick between wide and tight on the same heads.</li>
      <li><span class="t">0:11</span> (AMPUTATE!) throws the top half of the picture up and away. The wound breathes open on each kick.</li>
      <li><span class="t">0:12</span> The repeat counts again, mirrored, on the 1789 heads. (OPERATE!) slams the halves shut, and the stitches go in one per drum hit.</li>
      <li><span class="t">0:14</span> “Apply the blade”: the camera falls with the blade and stops dead with a flash of steel. The flood rises in surges on the kick.</li>
      <li><span class="t">0:16</span> “WE'RE GONNA NEED A TUB”: Marat's bath, cutting on the kick, then BLOOD floods it.</li>
    </ol>
    <p>Nothing here is random. Every added motion is either a sung word, a kick or snare from the separated drum track, or the momentum of a camera move already under way.</p>
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
