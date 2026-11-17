# KickShift — "A car built to score."

Investor-pitch deck for a car-soccer supercar, built as an animated HTML presentation with real-time 3D, physics animations, and video exports for Canva.

## What's here

| Path | What it is |
|---|---|
| `deck/index.html` | **The live presentation.** Double-click to open in Chrome/Edge. Runs fully offline. |
| `export/videos/*.mp4` | One 1080p video per slide, **for Canva** (Upload → drag onto a blank slide → stretch to fill). |
| `export/stills/*.png` | The final frame of every slide (a backup, or for thumbnails/handouts). |
| `SCRIPT.md` | A ~9-minute speaker script plus a physics cheat-sheet for Q&A. |
| `src/` | Source code (3D scene, physics canvases, speaker notes). |

## Presenting the HTML deck

- **→ / Space / click**: next slide · **←**: back · **F**: fullscreen · **N**: speaker notes + timer · **R**: replay the slide's animation · **1–9**: jump to a slide
- Clickers work (they send PageDown/PageUp).
- Use Chrome or Edge on a laptop with a decent GPU for smooth 3D.

## Using it in Canva

Canva can't run HTML, so every slide is exported as an MP4 that keeps all the animation.

1. Create a 1920×1080 Presentation in Canva.
2. Upload all `export/videos/*.mp4` files.
3. Put one video per slide, full-bleed, in order (01 → 12).
4. Each video autoplays when you reach its slide. Preview it once to check how it behaves at the end of the clip.
5. Text is baked into the videos. To change wording, edit `deck/index.html` (or ask for text-free "clean" versions) and add your own Canva text on top.

## Slide list

1. Intro: "Introducing…", then a black screen, then the headlights turn on and the car is revealed
2. The idea: soccer + supercars
3. Meet the car: 3D turntable with callouts and specs
4. Physics: momentum (car → ball collision, slow-mo)
5. Physics: impulse (force–time graph, crush bumper)
6. Physics: kinetic energy (speedometer + ½mv² curve, boost cap)
7. Physics: collision angles (contact normal, θ = sin⁻¹(d/(R+r)))
8. The arena: charging pads, live tracking
9. Cost per match: energy flow, ≈1.5 kWh ≈ $0.25
10. Roadmap
11. The ask: $250K + use of funds
12. Close: the car launches the ball at the camera, then the final title

## Rebuilding

```sh
npm install
./build.sh                          # bundles src/ → deck/deck.js
node tools/export.mjs 0,1,2 30      # re-render slide videos (0-based indexes)
node tools/script.mjs               # regenerate SCRIPT.md from src/notes.js
```

## Credits

- The base 3D car model is "Ferrari 458 Italia" by vicent091036 (Sketchfab, CC BY 4.0), distributed with the three.js examples. In this deck it has a new paint, a rear wing, a strike splitter, LED sills, and no badges. Credited on the final slide.
- three.js (MIT), GSAP, Bebas Neue / Inter / JetBrains Mono (SIL OFL).
- Design direction informed by the ui-ux-pro-max skill (sports / bold display type / high-motion guidance).
