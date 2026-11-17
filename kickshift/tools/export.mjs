// Render slides to MP4 (for Canva) + final-frame PNG. usage: node tools/export.mjs "0,2,11" [fps]
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'child_process'; import path from 'path'; import fs from 'fs';
const list = process.argv[2].split(',').map(Number), fps = Number(process.argv[3] || 30), ss = Number(process.argv[4] || 1);
const vdir = 'export/videos', sdir = 'export/stills';
fs.mkdirSync(vdir, { recursive: true }); fs.mkdirSync(sdir, { recursive: true });
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: ss });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + path.resolve('deck/index.html') + '?capture=1&dpr=' + ss);
await p.waitForFunction(() => window.KS_READY, null, { timeout: 180000 });
const info = await p.evaluate(() => ({ ids: KS.ids, dur: KS.durations }));
for (const i of list) {
  const name = `${String(i + 1).padStart(2, '0')}-${info.ids[i]}`, n = Math.round(info.dur[i] * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    ...(ss > 1 ? ['-vf', 'scale=1920:1080:flags=lanczos'] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${vdir}/${name}.mp4`]);
  const done = new Promise(r => ff.on('close', r));
  const t0 = Date.now();
  for (let k = 0; k < n; k++) {
    await p.evaluate(([i, t]) => KS.render(i, t), [i, k / fps]);
    const buf = await p.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (k % 60 === 0) console.log(name, k, '/', n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end(); await done;
  await p.evaluate(([i, t]) => KS.render(i, t), [i, info.dur[i] - 0.01]);
  await p.screenshot({ path: `${sdir}/${name}.png` });
  console.log('DONE', name, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await b.close();
