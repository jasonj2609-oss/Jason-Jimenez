import { NOTES } from '../src/notes.js';
import fs from 'fs';
let md = '# KickShift — Speaker Script (~9 min)\n\nPress **N** in the HTML deck to see these notes with a running timer.\n\n';
NOTES.forEach((n, i) => { md += `## ${i + 1}. ${n.title}  \`${n.time}\`\n\n${n.say.split('\n').map(l => l.startsWith('(') ? `*${l}*` : l).join('\n\n')}\n\n`; });
md += `---\n### Physics cheat-sheet (for Q&A)\n\n| Idea | Formula | Our numbers |\n|---|---|---|\n| Momentum | p = m·v | 900 kg × 15 m/s = 13,500 kg·m/s |\n| Ball launch (car ≫ ball) | v_ball = (1+e)·M·v / (M+m) | 1.6 × 900 × 15 / 920 ≈ 23.5 m/s ≈ 85 km/h |\n| Impulse | J = F·Δt = Δp | 900 kg × 5 m/s = 4,500 N·s; rigid 10 ms → 707 kN peak, bumper 50 ms → 141 kN peak |\n| Kinetic energy | KE = ½mv² | 30 km/h → 31 kJ, 60 km/h → 125 kJ, 80 km/h cap → 222 kJ |\n| Collision angle | θ = sin⁻¹(d / (R + r)) | R = 1.5 m nose, r = 0.75 m ball, d = 0.7 m → θ ≈ 18° |\n| Energy per match | ≈ 40 × ½mv² ÷ efficiency − regen | ≈ 1.5 kWh → ≈ $0.25 at $0.16/kWh |\n`;
fs.writeFileSync('SCRIPT.md', md);
