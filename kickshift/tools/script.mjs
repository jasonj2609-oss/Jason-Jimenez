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
| Power limit | F ≤ P/v | 1 kW at 4 m/s → 250 N; boost 2 kW → 500 N, capped at 441 N by grip |
| Boost energy | ΔE = ½ m (v_f² − v_i²) | ½(50)(6² − 4²) = 500 J |
| Tactics | E = P L / v | 2 m/s → 2,000 J; 4 m/s → 1,000 J; 8 m/s → 500 J |
| Speed after boost | v_f = √(v² + 2ηE/m) | η = 0.5: 2 → 6.6, 4 → 6.0, 8 → 8.6 m/s |
| Momentum | M v₀ = M v_M + m v_m | 900 kg at 15 m/s, 20 kg ball, e = 0.6 → ball 23.5 m/s |
| Match energy | E = ∫ P dt | ≈ 1.5 kWh per car → ≈ $0.25 at $0.16/kWh |

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
`;
fs.writeFileSync('SCRIPT.md', md);
