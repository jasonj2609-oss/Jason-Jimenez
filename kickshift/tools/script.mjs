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

Sources and caveats: the prototype numbers are illustrative. Supercapacitor and battery ranges are typical published values. Purdue University has reported wireless power transfer to a moving truck at highway speed; that supports the principle, not KickShift's specific design.
`;
fs.writeFileSync('SCRIPT.md', md);
