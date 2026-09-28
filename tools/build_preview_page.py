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
    <span class="sc">L'Ami du peuple · fourth pass</span>
    <h1>Gonna Need a Tub <em>(For All This Blood)</em></h1>
    <span class="sc">Chorus 1 · 1:07 – 1:25 of the song</span>
  </header>
  <section>
    <h2>Chorus 1, fourth pass: period images</h2>
    <video id="chorus" controls playsinline preload="auto" src="data:video/mp4;base64,{b64(chorus)}"></video>
    <ol>
      <li><span class="t">0:00</span> Marat, cut out of a 1793 portrait in his kerchief, headbangs in front of engravings of the revolutionary committees, which cut on each line and then on every kick.</li>
      <li><span class="t">0:05</span> The page rips open. Heads on pikes (1789), the lanterne, the dancing sans-culotte and Gillray's Corday trial cut on every kick under the slammed words.</li>
      <li><span class="t">0:06</span> (AMPUTATE!) and (OPERATE!) stamp across the frame with a blood flash.</li>
      <li><span class="t">0:10</span> “Apply the blade”: the guillotine prints (the execution of Louis XVI, <em>Hell Broke Loose</em>) cut on each word as a slash of light cuts the board in two.</li>
      <li><span class="t">0:12</span> The headline slams word by word, BLOOD flashes red, and the whole headline bleeds.</li>
      <li><span class="t">0:15</span> Page turn to verse 2: the September prints printed into the newspaper, with Marat's 1793 oval portrait in the corner.</li>
    </ol>
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
