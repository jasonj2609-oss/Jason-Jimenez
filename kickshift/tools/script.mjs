import { NOTES } from '../src/notes.js';
import fs from 'fs';
let md = '# KickShift — Speaker Script (~9 min)\n\nPress **N** in the HTML deck to see these notes with a running timer.\n\n';
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
| Hitbox launch angle | θ = arcsin((r − h)/r), h < r | r = 0.75 m: Wedge h = 0.45 → 24°, Balanced 0.60 → 12°, Wall ≥ 0.75 → 0° |
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

Biggest risks (be ready to name them): wireless-lane efficiency on moving cars, bumper durability, safety around crowds, and whether venues buy. The seed round tests the first three before big money is spent.

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
`;
fs.writeFileSync('SCRIPT.md', md);
