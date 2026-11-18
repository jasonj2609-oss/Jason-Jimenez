# KickShift — "A car built to score."

Investor-pitch deck for a car-soccer supercar, built as an animated HTML presentation with real-time 3D, physics animations, and video exports for Canva.

## What's here

| Path | What it is |
|---|---|
| `KickShift.html` | **The whole deck in one file.** Email it, put it on Google Drive or a USB stick; on any computer, double-click it to open in Chrome or Edge. Works offline. |
| `deck/index.html` | **The live presentation.** Double-click to open in Chrome/Edge. Runs fully offline. |
| `../docs/` | The same deck, set up for GitHub Pages: **https://jasonj2609-oss.github.io/Jason-Jimenez/** once Pages is switched on (see below). |
| `export/videos/*.mp4` | One 1080p, 60 fps video per slide, **for Canva** (Upload → drag onto a blank slide → stretch to fill). |
| `export/stills/*.png` | The final frame of every slide (a backup, or for thumbnails/handouts). |
| `SCRIPT.md` | A ~9.5-minute speaker script plus physics and business cheat-sheets for Q&A. |
| Presenter's guide | Slide-by-slide explanations, the physics and business in plain words, and a Q&A bank: https://claude.ai/artifact/PEoCkRkr6fhWd3kGwHyEsc |
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
3. Put one video per slide, full-bleed, in order (01 → 17).
4. Each video autoplays when you reach its slide. Preview it once to check how it behaves at the end of the clip.
5. Text is baked into the videos. To change wording, edit `deck/index.html` (or ask for text-free "clean" versions) and add your own Canva text on top.

## Slide list

1. Intro: "Introducing…", a light scan across the car in the dark, a macro shot of the headlight igniting, then a pull-back to the title
2. The idea
3. What we're pitching: one sport, three parts (the car, the arena and the game), each shown as a real render
4. The car, "Not just a car": an X-ray sweep reveals the receiver coil, supercapacitor, battery, hub motors, swappable strike shell, tracking markers and charge light bar
5. The arena, "The field is the charger": a match in a full 3D venue, with lane tiles lighting up only under a car, camera tracking boxes on every car and the ball, a live energy scoreboard and safety walls
6. Wireless charging: coils under the lane and the induced voltage, ε = −N dΦ/dt
7. Energy storage: battery against supercapacitor, plus a supercapacitor filling and emptying, E = ½CV²
8. The boost: a real tyre close-up with Newton's third law at the contact patch and the grip limit F ≤ μmg
9. One pass: 1,000 J collected against the 500 J needed to go from 4 to 6 m/s
10. Energy is a tactic: E = PL/v
11. Hitboxes: Wedge, Balanced and Wall shapes, with launch angle θ = arcsin((r − h)/r)
12. Business model: how money flows from players to venues to KickShift, plus one venue's year (≈ $672K revenue, ≈ $359K profit, arena paid back in ≈ 13 months)
13. Costs, on a log scale: under $1 of electricity a match, up to a $3M full-size arena later
14. Roadmap: build, charge, play (this round), then a flagship venue and arena sales
15. Projections: revenue and costs for years 1–5 (35 arenas and about $10.8M revenue by year 5, profitable from year 4)
16. The numbers: what it takes to build (prototype, each arena, running costs) and how it makes money (arena sales, monthly fees, match share, sponsors)
17. Close: one clean hero shot as the car lights up, then the title and "Thank you"

## Rebuilding

```sh
npm install
./build.sh                          # bundles src/ → deck/deck.js
node tools/export.mjs 0,1,2 30      # re-render slide videos (0-based indexes)
node tools/script.mjs               # regenerate SCRIPT.md from src/notes.js
```

## Credits

- The base 3D car model is "Ferrari 458 Italia" by vicent091036 (Sketchfab, CC BY 4.0), distributed with the three.js examples. In this deck it has a silver paint, a carbon rear wing and strike splitter, and no badges. Credited here and in the speaker notes for the final slide.
- three.js (MIT), GSAP.
- Type: Computer Modern (CMU Serif, SIL OFL) and KaTeX (MIT) for equations, as in a LaTeX physics paper.
- Palette: black, silver and white only.
