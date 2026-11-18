# KickShift — "A car built to score."

Investor-pitch deck for a car-soccer supercar, built as an animated HTML presentation with real-time 3D, physics animations, and video exports for Canva.

## What's here

| Path | What it is |
|---|---|
| `deck/index.html` | **The live presentation.** Double-click to open in Chrome/Edge. Runs fully offline. |
| `../docs/` | The same deck, set up for GitHub Pages: **https://jasonj2609-oss.github.io/Jason-Jimenez/** once Pages is switched on (see below). |
| `export/videos/*.mp4` | One 1080p video per slide, **for Canva** (Upload → drag onto a blank slide → stretch to fill). |
| `export/stills/*.png` | The final frame of every slide (a backup, or for thumbnails/handouts). |
| `SCRIPT.md` | A ~9-minute speaker script plus a physics cheat-sheet for Q&A. |
| `src/` | Source code (3D scene, physics canvases, speaker notes). |

## Presenting the HTML deck

- **→ / Space / click**: next slide · **←**: back · **F**: fullscreen · **N**: speaker notes + timer · **R**: replay the slide's animation · **1–9**: jump to a slide
- Clickers work (they send PageDown/PageUp).
- Use Chrome or Edge on a laptop with a decent GPU for smooth 3D.

## Your own link (GitHub Pages)

1. On github.com open the repository **jasonj2609-oss/Jason-Jimenez** → **Settings** → **Pages**.
2. Under **Build and deployment** pick **Deploy from a branch**, branch **`claude/festive-darwin-vsdtza`**, folder **`/docs`**, then **Save**.
3. After a minute or two the deck is live at **https://jasonj2609-oss.github.io/Jason-Jimenez/**.

## Using it in Canva

Canva can't run HTML, so every slide is exported as an MP4 that keeps all the animation.

1. Create a 1920×1080 Presentation in Canva.
2. Upload all `export/videos/*.mp4` files.
3. Put one video per slide, full-bleed, in order (01 → 13).
4. Each video autoplays when you reach its slide. Preview it once to check how it behaves at the end of the clip.
5. Text is baked into the videos. To change wording, edit `deck/index.html` (or ask for text-free "clean" versions) and add your own Canva text on top.

## Slide list

1. Intro: "Introducing…", then a black screen, then the headlights turn on and the car is revealed
2. The idea
3. Meet the car: 3D turntable with the supercapacitor, receiver coil, boost motors and strike-face nose labelled
4. Wireless charging: coils under the lane, an alternating magnetic field and the induced voltage (Faraday's law), ε = −N dΦ/dt, E = Pt
5. Energy storage: battery against supercapacitor on a log–log plot of energy and power per kilogram, plus E = ½CV²
6. The boost: Newton's third law at the tyre, with the grip limit F ≤ μmg and the power limit F ≤ P/v
7. One pass: 1,000 J collected against the 500 J needed to go from 4 to 6 m/s
8. Energy is a tactic: E = PL/v; slower passes collect more energy but cost time
9. Momentum: the car hits the ball, and total momentum is conserved
10. Operating cost: power over a match, with energy as the area under the curve
11. Roadmap
12. The ask: $250K and the use of funds
13. Close: the car launches the ball at the camera, then the final title

## Rebuilding

```sh
npm install
./build.sh                          # bundles src/ → deck/deck.js
node tools/export.mjs 0,1,2 30      # re-render slide videos (0-based indexes)
node tools/script.mjs               # regenerate SCRIPT.md from src/notes.js
```

## Credits

- The base 3D car model is "Ferrari 458 Italia" by vicent091036 (Sketchfab, CC BY 4.0), distributed with the three.js examples. In this deck it has a silver paint, a carbon rear wing and strike splitter, and no badges. Credited on the final slide.
- three.js (MIT), GSAP.
- Type: Computer Modern (CMU Serif, SIL OFL) and KaTeX (MIT) for equations, as in a LaTeX physics paper.
- Palette: black, silver and white only.
