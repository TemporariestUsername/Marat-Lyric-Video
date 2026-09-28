# Gonna Need a Tub (For All This Blood) — lyric video

Kinetic-typography video set inside Marat's *L'Ami du peuple*. Built with Remotion; every
animation is driven by `timing.json` (line/word times + beat grid). No timestamps are typed by hand in `src/`.

## Layout
- `assets/lyrics.txt` — lyrics (source of truth for text & capitalisation)
- `public/song.mp3` — the track; `public/tex/` — generated paper/stamp textures (`tools/gen_textures.py`)
- `timing/` — timing pipeline
  - `beats.py` → `timing/beats.json` (librosa beat tracking)
  - `align.py` → `timing/raw_alignment.json` (stable-ts forced alignment against a Demucs vocal stem)
  - `realign_line.py` — re-align one line inside a window when the global pass slips
  - `overrides.json` — manual line fixes (also what the tap tool exports)
  - `build_timing.py` → `timing.json` + `timing/TIMING.md` (the spot-check table)
- `tools/tap-sync.html` — open in a browser, load song + lyrics, press Space on each line start, export `overrides.json`
- `src/` — Remotion project; `src/scenes/index.ts` lists scenes (boundaries derived from line times)

## Regenerating timing
```
pip install librosa soundfile stable-ts demucs
python3 -m demucs --two-stems=vocals -n htdemucs -o /tmp/sep public/song.mp3
python3 timing/beats.py public/song.mp3
python3 timing/align.py /tmp/sep/htdemucs/song/vocals.wav medium
python3 timing/build_timing.py
```

**Beat grid note:** tempo averages ~129.2 BPM, but a single rigid grid drifts up to ~0.2 s off
the beat in places (the phase wanders between sections), so the grid uses librosa's tracked beats
instead. Word onsets snap to the nearest half-beat only when within 90 ms.

## Rendering
```
npm install
npm run studio                 # interactive preview
npm run render:chorus1         # out/chorus1-preview.mp4
npx remotion render src/index.ts Scene-<id> out/<id>.mp4   # one scene
npm run render                 # full video, 1920x1080 @ 30fps with audio
```
