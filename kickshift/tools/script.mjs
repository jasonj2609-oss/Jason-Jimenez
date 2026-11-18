import { NOTES } from '../src/notes.js';
import fs from 'fs';
let md = '# KickShift — Speaker Script (~8 min)\n\nTip: the big title on each slide is your cue. Read it, then explain it in your own words. Press **N** in the HTML deck to see these notes while rehearsing.\n\n';
NOTES.forEach((n, i) => { md += `## ${i + 1}. ${n.title}  \`${n.time}\`\n\n${n.say.split('\n').map(l => l.startsWith('(') ? `*${l}*` : l).join('\n\n')}\n\n`; });
md += `---
### Physics cheat-sheet (for Q&A)

| Idea | Equation | Numbers used |
|---|---|---|
| Faraday's law | ε = −N dΦ/dt | AC in the lane coils changes the flux through the car's receiver coil |
| Energy collected | E = P t | 1 kW for 1 s (4 m lane at 4 m/s) = 1,000 J |
| Capacitor energy | E = ½ C V² | 0.87 F at 48 V ≈ 1,000 J |
| Grip limit | F = τ/r ≤ μ m g | m = 50 kg, μ = 0.9 → 441 N; r = 0.15 m → τ ≈ 66 N·m |
| Boost energy | ΔE = ½ m (v_f² − v_i²) | ½(50)(6² − 4²) = 500 J |
| Tactics | E = P L / v | 2 m/s → 2,000 J; 4 m/s → 1,000 J; 8 m/s → 500 J |
| Match energy | E = ∫ P dt | ≈ 1.5 kWh per car → ≈ $0.25 at $0.16/kWh |

### Business cheat-sheet (for Q&A)

| Item | Estimate | How we got it |
|---|---|---|
| Match price | $20 per player, 4 players (2v2), 10 minutes | in line with go-kart pricing |
| Venue revenue | ≈ $672K a year | $80 a match × 24 matches a day × 350 days |
| Venue costs | staff $120K, space $60K, upkeep + power $42K, our fees $91K | our fees = $2K/month + 10% of revenue |
| Venue profit | ≈ $359K a year → arena pays back in ≈ 13 months | $400K ÷ $359K |
| Arena package | costs us ≈ $250K, sells for $400K | 6 cars $72K, floor + lanes $120K, cameras/software $30K, barriers/install $28K |
| Production car | ≈ $12K | 50 kg remote-driven car with coil, supercapacitor, battery, motors, telemetry |
| Electricity per match | under $1 | 4 cars × ≈ 0.1 kWh at ≈ $0.16/kWh, plus lane losses |
| Projections | 0 → 1 → 5 → 15 → 35 arenas (years 1–5); revenue $0 → $0.67M → $2.45M → $5.49M → $10.85M | sales + recurring fees + flagship venue |
| Break-even | year 4 (projected) | costs $0.25M → $1.3M → $2.6M → $4.7M → $8.4M |

### Likely question: "How fast does it go? Is there a top speed or a minimum speed?"

Say: "There's no set speed. The driver chooses, and that choice is the game. Normal driving is about 4 metres per second, around 9 miles per hour, and a boost takes it to about 6, around 13 miles per hour. For safety, the software caps the prototype at 8 metres per second, about 18 miles per hour. There's no minimum, but driving slower than 4 doesn't give you a bigger boost, because one pass at 4 already fills the supercapacitor."

- Top speed: a software limit of 8 m/s (≈ 29 km/h, 18 mph) for the 50 kg prototype, because the cars play near glass walls and fans. It's also the fastest speed on the tactics slide.
- Speeding up: grip limits how fast you can speed up, not your top speed: a ≤ μg = 0.9 × 9.81 ≈ 8.8 m/s².
- Minimum: none, but the supercapacitor holds about 1,000 J, and one pass at 4 m/s collects 1,000 J (E = P L / v = 1,000 × 4 ÷ 4). Going slower collects more (2,000 J at 2 m/s), but the extra only tops up the battery, and the other team gets to the ball first.
- The full-size car comes later; its limit would be set after testing.

### Likely question: "What about damage to the cars? Does it still make money?"

Say: "The first cars are 50 kilograms and remote-driven. A hit at boost speed, 6 metres per second, carries about 900 joules, around 200 times less than a real car. The front is a bumper shell that's made to be crushed and swapped for $150, like a hockey stick. Even if damage costs a venue $70,000 a year, it still makes about $290,000 and earns back its arena in under a year and a half. And every replacement shell is something we sell."

- Physics: KE = ½mv² = ½ × 50 × 6² = 900 J (a 900 kg car at 20 m/s has 180,000 J). Impulse: F = Δp/Δt; p = 300 kg·m/s, so stopping in 5 ms means about 60 kN, while a shell that crushes over 30 ms brings it down to about 10 kN.
- Cost per venue per year (estimate): 33,600 car-matches; one shell per 100 matches = 336 shells × $150 = $50K; other repairs about $18K (25% of the $72K fleet). Total about $68K, so the venue keeps about $290K and pays back in about 17 months (about 22 months if damage is double).
- Upside: shells are a consumable we sell (about $50K a year per venue; at roughly $40 each to make, about $37K profit). This is not in the projections.
- Full-size cars come later, with racing crash structures, and sponsors and the league fund repairs. The first year's 50 test matches measure the real damage rate.

Biggest risks (be ready to name them): wireless-lane efficiency on moving cars, bumper durability, safety around crowds, and whether venues buy. The seed round tests the first three before big money is spent.

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
`;
fs.writeFileSync('SCRIPT.md', md);
