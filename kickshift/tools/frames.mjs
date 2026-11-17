// usage: node tools/frames.mjs '[[slideIndex, t], ...]' [outdir]
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import path from 'path'; import fs from 'fs';
const shots = JSON.parse(process.argv[2]); const out = process.argv[3] || 'dev';
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await p.goto('file://' + path.resolve('deck/index.html') + '?capture=1');
await p.waitForFunction(() => window.KS_READY, null, { timeout: 120000 });
for (const [i, t] of shots) {
  const t0 = Date.now();
  await p.evaluate(([i, t]) => KS.render(i, t), [i, t]);
  await p.screenshot({ path: `${out}/s${i + 1}_${t}.jpg`, type: 'jpeg', quality: 85 });
  console.log(i + 1, t, Date.now() - t0, 'ms');
}
await b.close();
