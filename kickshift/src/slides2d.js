// 2D canvas scenes. Every function is a pure function of time t (seconds) so frames can be rendered deterministically.
import { clamp, lerp, prog, E, rng, keys } from './util.js';

export const W = 1920, H = 1080;
export const C = { lime: '#C6FF3A', cyan: '#3BE3FF', red: '#FF4D3D', amber: '#FFB22E', ink: '#F4F6F8', dim: 'rgba(244,246,248,0.55)', faint: 'rgba(244,246,248,0.14)' };
const MONO = '"JetBrains Mono", ui-monospace, monospace', DISP = '"Bebas Neue", Impact, sans-serif';
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const bump = (t, a, b) => { const p = prog(t, a, b); return Math.sin(Math.PI * p); };

// ---------- shared drawing ----------
let gridCache = null;
export function bg(ctx, t, { gx = 1400, gy = 260, glow = 0.08, grid = true } = {}) {
  if (!gridCache) {
    gridCache = document.createElement('canvas'); gridCache.width = W; gridCache.height = H;
    const g = gridCache.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.075)';
    for (let x = 24; x < W; x += 48) for (let y = 24; y < H; y += 48) g.fillRect(x - 1, y - 1, 2, 2);
    const v = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.85)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = '#040506'; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(gx, gy, 0, gx, gy, 1000);
  r.addColorStop(0, rgba(C.lime, glow)); r.addColorStop(1, rgba(C.lime, 0));
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  if (grid) ctx.drawImage(gridCache, 0, 0);
}

export function arrow(ctx, x1, y1, x2, y2, color, { w = 5, head = 22, glow = 16, alpha = 1 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3 || alpha <= 0) return;
  const hh = Math.min(head, len * 0.55);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = glow;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hh * 0.7, y2 - Math.sin(a) * hh * 0.7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.45) * hh, y2 - Math.sin(a - 0.45) * hh);
  ctx.lineTo(x2 - Math.cos(a + 0.45) * hh, y2 - Math.sin(a + 0.45) * hh);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

export function text(ctx, s, x, y, { size = 22, font = MONO, weight = 500, color = C.ink, align = 'left', base = 'middle', alpha = 1, glow = 0, spacing = 0 } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  if (spacing) ctx.letterSpacing = spacing + 'px';
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillText(s, x, y); ctx.restore();
}

function dashed(ctx, pts, color, { w = 2, dash = [8, 10], alpha = 1, off = 0 } = {}) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash); ctx.lineDashOffset = off;
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
}

function ring(ctx, x, y, r, color, alpha, w = 3) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.shadowColor = color; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

function impact(ctx, x, y, p, color = '#fff', scale = 1) {
  if (p <= 0 || p >= 1) return;
  ring(ctx, x, y, (30 + 420 * E.outCubic(p)) * scale, color, (1 - p) * 0.9, 4 * (1 - p) + 1);
  ring(ctx, x, y, (20 + 260 * E.outCubic(p)) * scale, C.lime, (1 - p) * 0.7, 2);
  const R = rng(91);
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.shadowColor = C.lime; ctx.shadowBlur = 14;
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2, sp = (120 + R() * 380) * scale, l = 20 + R() * 50;
    const d = sp * E.outCubic(p);
    ctx.globalAlpha = (1 - p) * 0.9; ctx.lineWidth = 2 + R() * 2;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); ctx.lineTo(x + Math.cos(a) * (d + l * (1 - p)), y + Math.sin(a) * (d + l * (1 - p))); ctx.stroke();
  }
  ctx.restore();
}

function groundShadow(ctx, cx, gy, halfW, alpha = 0.7) {
  ctx.save(); ctx.translate(cx, gy); ctx.scale(1, 0.09);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, halfW, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// side-view car built from the baked 3D sprites; wheels spin independently
export function carSide(ctx, SP, noseX, gy, ppm, wheelAngle = 0, { alpha = 1, ghosts = 0, ghostDx = 0 } = {}) {
  const s = SP.side, k = ppm / s.ppm;
  const draw = (nx, a) => {
    const ox = nx - s.noseX * k, oy = gy - s.groundY * k;
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(s.body, ox, oy, s.body.width * k, s.body.height * k);
    const wr = (SP.wheel.img.width * k) / 2;
    for (const w of s.wheels) {
      ctx.save(); ctx.translate(ox + w.x * k, oy + w.y * k); ctx.rotate(wheelAngle);
      ctx.drawImage(SP.wheel.img, -wr, -wr, wr * 2, wr * 2); ctx.restore();
    }
    ctx.restore();
  };
  groundShadow(ctx, noseX - (s.noseX - s.tailX) * k * 0.5, gy, (s.noseX - s.tailX) * k * 0.62, 0.8 * alpha);
  for (let g = ghosts; g >= 1; g--) draw(noseX - ghostDx * g, alpha * 0.16 * (1 - g / (ghosts + 1)));
  draw(noseX, alpha);
}
export function carTop(ctx, SP, cx, cy, heading, ppm, { alpha = 1, filter = null, shadow = true } = {}) {
  const s = SP.top, k = ppm / s.ppm, w = s.img.width * k, h = s.img.height * k;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(heading); ctx.globalAlpha = alpha;
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 24 * k * 10; ctx.shadowOffsetY = 6; }
  if (filter) ctx.filter = filter;
  ctx.drawImage(s.img, -w / 2, -h / 2, w, h); ctx.restore();
}
export function ballAt(ctx, SP, x, y, r, rot = 0, alpha = 1) {
  const b = SP.ball, rpx = (b.r * b.ppm), k = r / rpx, s = b.img.width * k;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
  ctx.drawImage(b.img, -s / 2, -s / 2, s, s); ctx.restore();
}

function streaks(ctx, t, { seed = 3, n = 110, inten = 1, y0 = 100, y1 = 1000, speed = 1 } = {}) {
  const R = rng(seed);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + R() * (y1 - y0), sp = (900 + R() * 2600) * speed, len = 60 + R() * 380, off = R() * 5000, lw = 0.6 + R() * 2.2;
    const lime = R() < 0.16, a = (0.05 + R() * 0.3) * inten;
    const x = W + 400 - ((t * sp + off) % (W + 900));
    const g = ctx.createLinearGradient(x, y, x + len, y);
    const c = lime ? C.lime : '#ffffff';
    g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
    ctx.strokeStyle = g; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.restore();
}

function groundLine(ctx, gy, alpha = 1, ppm = 110, shift = 0, clipW = W) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.rect(0, 0, clipW, H); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.2, 'rgba(255,255,255,0.35)'); g.addColorStop(0.8, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, gy, W, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let x = (-shift % ppm); x < W; x += ppm) ctx.fillRect(x, gy + 8, 2, 10);
  const r = ctx.createLinearGradient(0, gy, 0, H);
  r.addColorStop(0, 'rgba(198,255,58,0.05)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r; ctx.fillRect(0, gy + 2, W, H - gy);
  ctx.restore();
}

// ================= SLIDE: THE IDEA =================
export function sIdea(ctx, t, SP) {
  bg(ctx, t, { gx: 960, gy: 540, glow: 0.05 });
  const gy = 1000, ppm = 200, br = 0.75 * ppm;
  streaks(ctx, t, { inten: E.outCubic(prog(t, 0, 1.2)) * (1 + 2.5 * bump(t, 5.6, 6.8)), y0: 80, y1: 1060, speed: 1 + 1.5 * bump(t, 5.6, 6.8) });
  groundLine(ctx, gy, E.outCubic(prog(t, 4.6, 5.2)), ppm, t * 600);
  // ball rolls in, car blasts through and launches it
  const bxRest = 1500, tc = 6.05;
  const vcar = 4200; // px/s
  const nose = bxRest - br + (t - tc) * vcar;
  let bx, by, rot = 0, show = t > 4.4;
  if (t < tc) {
    const p = E.outCubic(prog(t, 4.4, 5.6)); bx = lerp(W + br + 40, bxRest, p); by = gy - br; rot = -(W + br + 40 - bx) / br;
  } else {
    const tau = t - tc; bx = bxRest + 2600 * tau; by = gy - br - 1500 * tau + 1400 * tau * tau; rot = tau * 18;
  }
  if (nose > -800 && nose < W + 1400) carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36, { ghosts: 5, ghostDx: 110 });
  if (show) ballAt(ctx, SP, bx, by, br, rot);
  impact(ctx, bxRest - br, gy - br, prog(t, tc, tc + 0.7), '#fff', 1.2);
  const f = Math.exp(-Math.pow((t - tc) * 10, 2)) * 0.35;
  if (f > 0.01) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
}

// ================= SLIDE: MOMENTUM =================
export const PHYS = { M: 900, m: 20, e: 0.6, v0: 15 };
PHYS.vb = (1 + PHYS.e) * PHYS.M * PHYS.v0 / (PHYS.M + PHYS.m);
PHYS.v1 = PHYS.v0 * (PHYS.M - PHYS.e * PHYS.m) / (PHYS.M + PHYS.m);

export function sMomentum(ctx, t, SP) {
  bg(ctx, t, { gx: 1500, gy: 300 });
  const ppm = 112, gy = 850, rb = 0.75 * ppm, bx0 = 1130, slow = 0.3;
  const { M, m, e, v0, vb, v1 } = PHYS;
  const vd = v0 * ppm * slow, contactX = bx0 - rb, x0 = -120, tStart = 1.0;
  const tc = tStart + (contactX - x0) / vd;
  let nose, vcar;
  if (t < tc) { nose = x0 + (t - tStart) * vd; vcar = v0; }
  else {
    const tau = t - tc, T = 2.8, vd1 = v1 * ppm * slow;
    const tt = Math.min(tau, T); nose = contactX + vd1 * tt - 0.5 * (vd1 / T) * tt * tt; vcar = v1 * (1 - tt / T);
  }
  groundLine(ctx, gy, E.outCubic(prog(t, 0.2, 1.0)), ppm);
  // predicted trajectory + strobe
  const ang = 22 * Math.PI / 180, vx = vb * Math.cos(ang) * ppm * slow, vy = vb * Math.sin(ang) * ppm * slow, g = 9.81 * ppm * slow * slow;
  const bpos = (tau) => [bx0 + vx * tau, gy - rb - vy * tau + 0.5 * g * tau * tau];
  if (t > tc) {
    const pts = []; for (let k = 0; k <= 60; k++) pts.push(bpos(k * 0.05));
    dashed(ctx, pts, C.cyan, { alpha: 0.55 * E.outCubic(prog(t, tc + 0.15, tc + 0.6)), w: 2, dash: [3, 12] });
    for (let k = 1; k * 0.14 < t - tc; k++) { const [x, y] = bpos(k * 0.14); if (x < W + 100) ballAt(ctx, SP, x, y, rb, k * 0.14 * vx / rb, 0.16); }
  }
  // speed lines behind the car
  if (vcar > 1) {
    ctx.save(); const R = rng(5);
    for (let i = 0; i < 14; i++) {
      const y = gy - 20 - R() * 120, l = 80 + R() * 220, x = nose - 4.6 * ppm - R() * 80 - ((t * 900 + R() * 400) % 300);
      ctx.globalAlpha = 0.25 * (vcar / v0); ctx.strokeStyle = i % 4 ? '#fff' : C.lime; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l, y); ctx.stroke();
    }
    ctx.restore();
  }
  carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36);
  // ball
  let bx = bx0, by = gy - rb, brot = 0;
  if (t > tc) { [bx, by] = bpos(t - tc); brot = (t - tc) * vx / rb; }
  ballAt(ctx, SP, bx, by, rb, brot);
  impact(ctx, contactX, gy - rb, prog(t, tc, tc + 0.9), '#fff', 1);
  const fl = Math.exp(-Math.pow((t - tc) * 12, 2)) * 0.3; if (fl > 0.01) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  // momentum vector on the car
  const a1 = E.outCubic(prog(t, 1.6, 2.2)) * clamp(vcar / 4);
  const cx = nose - 2.27 * ppm, ay = gy - 210, L = 250 * (vcar / v0);
  arrow(ctx, cx - 60, ay, cx - 60 + L * a1, ay, C.lime, { alpha: a1, w: 6 });
  text(ctx, 'p = m·v', cx - 60, ay - 44, { size: 30, color: C.lime, alpha: a1, weight: 600 });
  text(ctx, `${M} kg × ${vcar.toFixed(1)} m/s`, cx - 60, ay + 36, { size: 20, color: C.dim, alpha: a1 });
  // ball velocity vector
  if (t > tc) {
    const tau = t - tc, a2 = E.outCubic(prog(t, tc + 0.1, tc + 0.5));
    const vyNow = vy - g * tau, sp = Math.hypot(vx, vyNow), Lb = 380 * a2;
    if (bx < W - 40) {
      arrow(ctx, bx, by, bx + vx / sp * Lb, by - vyNow / sp * Lb, C.cyan, { alpha: a2, w: 6 });
      text(ctx, `v = ${vb.toFixed(1)} m/s`, bx + 30, by + 110, { size: 26, color: C.cyan, alpha: a2, weight: 600 });
    }
  }
}

// ================= SLIDE: IMPULSE / BUMPERS =================
function hexBlock(ctx, x, y, w, h, squash, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, '#1b2410'); g.addColorStop(1, '#2c3d12');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 8;
  const r = 13, sx = squash;
  for (let row = -1; row * r * 1.5 < h + r; row++) {
    for (let col = -1; col * r * Math.sqrt(3) * sx < w + r * 2; col++) {
      const cx = x + (col * Math.sqrt(3) * r + (row % 2 ? Math.sqrt(3) * r / 2 : 0)) * sx, cy = y + row * r * 1.5;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const px = cx + Math.cos(a) * r * sx, py = cy + Math.sin(a) * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.strokeRect(x, y, w, h); ctx.restore();
}

export function sImpulse(ctx, t, SP) {
  bg(ctx, t, { gx: 500, gy: 600 });
  // ---- left: crash rig ----
  const ppm = 200, gy = 790, wallX = 830, bw0 = 64, bwMin = 18;
  const tA = 2.0, tB = 2.7;
  let nose, bw = bw0;
  if (t < tA) nose = lerp(-260, wallX - bw0, E.inOutSine(prog(t, 0.4, tA)) * 0 + prog(t, 0.4, tA));
  else if (t < tB) { const p = prog(t, tA, tB); bw = bw0 - (bw0 - bwMin) * Math.sin(Math.PI * Math.min(1, p * 1.25) * 0.5 + (p > 0.8 ? 0 : 0)); nose = wallX - bw; }
  else { const p = E.outCubic(prog(t, tB, tB + 0.8)); bw = lerp(bwMin, bw0 * 0.86, p); nose = wallX - bw - 34 * p; }
  if (t < 0.4) nose = -260;
  // wall
  ctx.save();
  const wg = ctx.createLinearGradient(wallX, 0, wallX + 60, 0); wg.addColorStop(0, '#2a2e33'); wg.addColorStop(1, '#0d0f11');
  ctx.fillStyle = wg; ctx.fillRect(wallX, gy - 330, 60, 330);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
  for (let y = gy - 330; y < gy; y += 26) { ctx.beginPath(); ctx.moveTo(wallX, y + 26); ctx.lineTo(wallX + 60, y); ctx.stroke(); }
  ctx.restore();
  groundLine(ctx, gy, 1, ppm, 0, 980);
  // swap animation: old module drops out, new one slides in
  const sw = prog(t, 7.4, 9.2);
  const swapping = sw > 0 && sw < 1;
  carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36);
  const by = gy - 0.62 * ppm, bh = 0.46 * ppm;
  if (!swapping && sw < 1) hexBlock(ctx, nose, by, bw, bh, bw / bw0, C.lime, 1);
  if (swapping || sw >= 1) {
    const out = E.inCubic(prog(sw, 0, 0.45)), inn = E.outCubic(prog(sw, 0.45, 1));
    if (out < 1) hexBlock(ctx, nose, by + out * 160, bw, bh, bw / bw0, '#7a8a5a', 1 - out);
    if (inn > 0) hexBlock(ctx, nose - (1 - inn) * 0, by + (1 - inn) * 160, bw0 * 0.86, bh, 0.86, C.lime, inn);
    if (inn > 0) ring(ctx, nose + 30, by + bh / 2, 40 + 60 * inn, C.lime, (1 - inn) * 0.8);
  }
  impact(ctx, wallX, gy - 0.4 * ppm, prog(t, tA, tA + 0.9), '#fff', 0.7);

  // ---- right: force-time graph ----
  const x0 = 1060, x1 = 1800, y0 = 830, y1 = 300, tmax = 80, Fmax = 800;
  const X = (ms) => x0 + (ms / tmax) * (x1 - x0), Y = (kN) => y0 - (kN / Fmax) * (y0 - y1);
  const ax = E.outCubic(prog(t, 0.5, 1.3));
  ctx.save(); ctx.globalAlpha = ax; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y1 - 20); ctx.lineTo(x0, y0); ctx.lineTo(x1 + 20, y0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(x0, Y(k * 200)); ctx.lineTo(x1, Y(k * 200)); ctx.stroke(); }
  ctx.restore();
  for (let k = 0; k <= 4; k++) text(ctx, `${k * 20}`, X(k * 20), y0 + 28, { size: 18, color: C.dim, align: 'center', alpha: ax });
  for (let k = 1; k <= 4; k++) text(ctx, `${k * 200}`, x0 - 14, Y(k * 200), { size: 18, color: C.dim, align: 'right', alpha: ax });
  text(ctx, 'TIME (ms)', x1, y0 + 62, { size: 16, color: C.dim, align: 'right', alpha: ax, spacing: 3 });
  text(ctx, 'FORCE (kN)', x0, y1 - 48, { size: 16, color: C.dim, alpha: ax, spacing: 3 });
  const cur = tmax * prog(t, 2.0, 4.6);
  const curve = (peak, dur, col, fillA) => {
    const end = Math.min(cur, dur); if (end <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.moveTo(X(0), Y(0));
    for (let ms = 0; ms <= end; ms += dur / 120) ctx.lineTo(X(ms), Y(peak * Math.sin(Math.PI * ms / dur)));
    ctx.lineTo(X(end), Y(peak * Math.sin(Math.PI * end / dur)));
    const path = new Path2D(); // stroke copy
    ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.stroke();
    ctx.lineTo(X(end), Y(0)); ctx.closePath(); ctx.shadowBlur = 0; ctx.fillStyle = rgba(col, fillA); ctx.fill();
    ctx.restore();
  };
  curve(707, 10, C.red, 0.22);
  curve(141, 50, C.lime, 0.2);
  if (cur > 0 && cur < tmax) { ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(X(cur), y1); ctx.lineTo(X(cur), y0); ctx.stroke(); ctx.restore(); }
  const l1 = E.outCubic(prog(cur, 5, 12)), l2 = E.outCubic(prog(cur, 25, 34));
  text(ctx, 'RIGID  707 kN', X(5) + 26, Y(707) - 4, { size: 24, color: C.red, alpha: l1, weight: 600 });
  text(ctx, 'KICKSHIFT BUMPER  141 kN', X(25) - 30, Y(141) - 34, { size: 24, color: C.lime, alpha: l2, weight: 600 });
  // same-area callout
  const s = E.outCubic(prog(t, 5.0, 5.8));
  if (s > 0) {
    dashed(ctx, [[X(6), Y(707)], [X(60), Y(707)]], C.amber, { alpha: s * 0.6, dash: [4, 6] });
    dashed(ctx, [[X(26), Y(141)], [X(60), Y(141)]], C.amber, { alpha: s * 0.6, dash: [4, 6] });
    arrow(ctx, X(58), Y(700), X(58), Y(150), C.amber, { alpha: s, w: 4, head: 18 });
    text(ctx, '−80% PEAK FORCE', X(56), Y(470), { size: 30, color: C.amber, alpha: s, weight: 700, align: 'right' });
    text(ctx, 'same area = same impulse', X(56), Y(470) + 40, { size: 20, color: C.dim, alpha: s, align: 'right' });
  }
}

// ================= SLIDE: KINETIC ENERGY / BOOST =================
const KE = (kmh) => 0.5 * 900 * Math.pow(kmh / 3.6, 2) / 1000;
export function speedAt(t) {
  let v = keys(t, [[0, 0], [1.2, 0], [2.6, 30], [4.0, 30], [5.4, 60], [6.8, 60], [7.7, 80]]);
  if (t > 7.7) v = 80 - 1.6 * Math.abs(Math.sin((t - 7.7) * 14)) * Math.exp(-(t - 7.7) * 2.2);
  return v;
}
export function sEnergy(ctx, t, SP) {
  bg(ctx, t, { gx: 520, gy: 600, glow: 0.06 });
  const v = speedAt(t);
  // ---- gauge ----
  const cx = 540, cy = 600, R = 290, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, A = (k) => a0 + (a1 - a0) * (k / 100);
  const ap = E.outCubic(prog(t, 0.3, 1.3));
  ctx.save(); ctx.globalAlpha = ap; ctx.lineCap = 'butt';
  ctx.lineWidth = 22; ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + (a1 - a0) * ap); ctx.stroke();
  ctx.strokeStyle = rgba(C.red, 0.35); ctx.beginPath(); ctx.arc(cx, cy, R, A(80), A(100)); ctx.stroke();
  for (let k = 0; k <= 100; k += 2) {
    const a = A(k), major = k % 10 === 0, r1 = R - 26, r2 = R - (major ? 52 : 38);
    ctx.strokeStyle = k > 80 ? rgba(C.red, 0.8) : (k <= v ? C.lime : 'rgba(255,255,255,0.35)'); ctx.lineWidth = major ? 3 : 1.5;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
  }
  ctx.restore();
  for (let k = 0; k <= 100; k += 20) { const a = A(k); text(ctx, `${k}`, cx + Math.cos(a) * (R - 84), cy + Math.sin(a) * (R - 84), { size: 22, color: k > 80 ? C.red : C.dim, align: 'center', alpha: ap }); }
  // value arc
  ctx.save(); ctx.lineWidth = 22; ctx.lineCap = 'round';
  const grd = ctx.createLinearGradient(cx - R, cy, cx + R, cy); grd.addColorStop(0, '#5fbf0e'); grd.addColorStop(1, C.lime);
  ctx.strokeStyle = grd; ctx.shadowColor = C.lime; ctx.shadowBlur = 30;
  if (v > 0.2) { ctx.beginPath(); ctx.arc(cx, cy, R, a0, A(v)); ctx.stroke(); }
  ctx.restore();
  // needle
  const an = A(v);
  ctx.save(); ctx.globalAlpha = ap; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.shadowColor = C.lime; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.moveTo(cx - Math.cos(an) * 30, cy - Math.sin(an) * 30); ctx.lineTo(cx + Math.cos(an) * (R - 40), cy + Math.sin(an) * (R - 40)); ctx.stroke();
  ctx.fillStyle = '#0b0d0f'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  text(ctx, `${Math.round(v)}`, cx, cy + 120, { size: 150, font: DISP, weight: 400, align: 'center', alpha: ap });
  text(ctx, 'KM/H', cx, cy + 200, { size: 22, color: C.dim, align: 'center', alpha: ap, spacing: 6 });
  // boost bar
  const bx = cx - 190, byy = cy + 270, bp = prog(t, 6.8, 7.7);
  text(ctx, 'BOOST', bx, byy - 26, { size: 18, color: bp > 0 ? C.lime : C.dim, alpha: ap, spacing: 5 });
  for (let i = 0; i < 3; i++) {
    const f = clamp(bp * 3 - i);
    ctx.save(); ctx.globalAlpha = ap; ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(bx + i * 130, byy, 118, 14);
    if (f > 0) { ctx.fillStyle = C.lime; ctx.shadowColor = C.lime; ctx.shadowBlur = 20; ctx.fillRect(bx + i * 130, byy, 118 * f, 14); }
    ctx.restore();
  }
  if (t > 7.7) text(ctx, 'LIMITED · 80', bx + 390, byy + 7, { size: 18, color: C.red, alpha: E.outCubic(prog(t, 7.7, 8.1)), spacing: 3 });

  // ---- KE plot ----
  const x0 = 1080, x1 = 1800, y0 = 820, y1 = 290, vmax = 100, kmax = 360;
  const X = (k) => x0 + (k / vmax) * (x1 - x0), Y = (e) => y0 - (e / kmax) * (y0 - y1);
  const pa = E.outCubic(prog(t, 0.6, 1.4));
  ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x0, y1 - 20); ctx.lineTo(x0, y0); ctx.lineTo(x1 + 20, y0); ctx.stroke(); ctx.restore();
  for (let k = 0; k <= 100; k += 20) text(ctx, `${k}`, X(k), y0 + 28, { size: 18, color: C.dim, align: 'center', alpha: pa });
  for (let e = 100; e <= 300; e += 100) text(ctx, `${e}`, x0 - 14, Y(e), { size: 18, color: C.dim, align: 'right', alpha: pa });
  text(ctx, 'SPEED (km/h)', x1, y0 + 62, { size: 16, color: C.dim, align: 'right', alpha: pa, spacing: 3 });
  text(ctx, 'KINETIC ENERGY (kJ)', x0, y1 - 48, { size: 16, color: C.dim, alpha: pa, spacing: 3 });
  const ghost = []; for (let k = 0; k <= 100; k += 1) ghost.push([X(k), Y(KE(k))]);
  dashed(ctx, ghost, '#fff', { alpha: 0.18 * pa, dash: [2, 8] });
  // cap zone
  const capA = E.outCubic(prog(t, 6.6, 7.2));
  if (capA > 0) {
    ctx.save(); ctx.globalAlpha = capA; ctx.fillStyle = rgba(C.red, 0.08); ctx.fillRect(X(80), y1 - 20, X(100) - X(80) + 20, y0 - y1 + 20); ctx.restore();
    dashed(ctx, [[X(80), y1 - 20], [X(80), y0]], C.red, { alpha: capA, w: 2, dash: [6, 6] });
    text(ctx, 'ARENA CAP', X(80) + 12, y1 + 6, { size: 18, color: C.red, alpha: capA, spacing: 3, weight: 600 });
  }
  if (v > 0.5) {
    ctx.save(); ctx.strokeStyle = C.lime; ctx.lineWidth = 5; ctx.shadowColor = C.lime; ctx.shadowBlur = 22; ctx.beginPath();
    for (let k = 0; k <= v; k += 0.5) (k ? ctx.lineTo(X(k), Y(KE(k))) : ctx.moveTo(X(k), Y(KE(k))));
    ctx.lineTo(X(v), Y(KE(v))); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(X(v), Y(KE(v)), 9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // pins at 30 / 60
  for (const [k, at] of [[30, 2.6], [60, 5.4]]) {
    const a = E.outCubic(prog(t, at, at + 0.4)); if (a <= 0) continue;
    ring(ctx, X(k), Y(KE(k)), 12, C.lime, a, 3);
    text(ctx, `${Math.round(KE(k))} kJ`, X(k) - 18, Y(KE(k)) - 34, { size: 24, color: C.ink, alpha: a, weight: 600, align: 'right' });
  }
  const rel = E.outCubic(prog(t, 5.8, 6.5));
  if (rel > 0) {
    dashed(ctx, [[X(30), Y(KE(30))], [X(30), y0]], C.amber, { alpha: rel * 0.8, dash: [4, 6] });
    dashed(ctx, [[X(60), Y(KE(60))], [X(60), y0]], C.amber, { alpha: rel * 0.8, dash: [4, 6] });
    dashed(ctx, [[x0, Y(KE(30))], [X(30), Y(KE(30))]], C.amber, { alpha: rel * 0.8, dash: [4, 6] });
    dashed(ctx, [[x0, Y(KE(60))], [X(60), Y(KE(60))]], C.amber, { alpha: rel * 0.8, dash: [4, 6] });
    text(ctx, '2× SPEED', X(45), y0 - 24, { size: 22, color: C.amber, alpha: rel, align: 'center', weight: 700 });
    text(ctx, '4× ENERGY', x0 + 20, (Y(KE(30)) + Y(KE(60))) / 2, { size: 22, color: C.amber, alpha: rel, weight: 700 });
  }
  if (v > 1) text(ctx, `KE = ½mv² = ${Math.round(KE(v))} kJ`, Math.min(X(v), 1620) - 10, Y(KE(v)) - 70, { size: 26, color: C.lime, align: 'right', weight: 600, alpha: E.outCubic(prog(t, 1.3, 1.8)) });
}

// ================= SLIDE: AIM WITH GEOMETRY (top-down) =================
export const AIM = { ppm: 100, B: [980, 560], R: 1.5, r: 0.75, shots: [0, 0.7, -0.7], goalX: 1720, mouth: [250, 870] };
export function sAim(ctx, t, SP) {
  bg(ctx, t, { gx: 1700, gy: 560, glow: 0.07 });
  const { ppm, B, R, r, shots, goalX, mouth } = AIM;
  const Rp = R * ppm, rp = r * ppm, sum = Rp + rp, half = 2.27 * ppm;
  // pitch markings
  const pa = E.outCubic(prog(t, 0.2, 1.0));
  ctx.save(); ctx.globalAlpha = pa;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(goalX, 60); ctx.lineTo(goalX, 1020); ctx.stroke();
  ctx.strokeRect(goalX - 260, mouth[0] - 70, 260, mouth[1] - mouth[0] + 140);
  // goal + net
  ctx.strokeStyle = C.lime; ctx.shadowColor = C.lime; ctx.shadowBlur = 20; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(goalX, mouth[0]); ctx.lineTo(goalX + 110, mouth[0]); ctx.lineTo(goalX + 110, mouth[1]); ctx.lineTo(goalX, mouth[1]); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = rgba(C.lime, 0.18); ctx.lineWidth = 1;
  for (let y = mouth[0]; y <= mouth[1]; y += 24) { ctx.beginPath(); ctx.moveTo(goalX, y); ctx.lineTo(goalX + 110, y); ctx.stroke(); }
  for (let x = goalX; x <= goalX + 110; x += 22) { ctx.beginPath(); ctx.moveTo(x, mouth[0]); ctx.lineTo(x, mouth[1]); ctx.stroke(); }
  ctx.restore();

  const T0 = 1.2, SPAN = 3.0, APP = 1.0;
  const geo = (d) => { const dp = d * ppm, cnx = B[0] - Math.sqrt(sum * sum - dp * dp), cny = B[1] + dp; const n = [(B[0] - cnx) / sum, (B[1] - cny) / sum]; return { cnx, cny, n }; };
  const ballPath = (n, tau) => {
    const sp = 1100, dGoal = (goalX + 60 - B[0]) / n[0];
    const d = tau * sp < dGoal ? tau * sp : dGoal + 40 * E.outCubic(clamp((tau * sp - dGoal) / 300));
    return [B[0] + n[0] * d, B[1] + n[1] * d];
  };
  const active = clamp(Math.floor((t - T0) / SPAN), 0, shots.length - 1);
  // finished shots: ghost car + path
  for (let k = 0; k < active; k++) {
    const { cnx, cny, n } = geo(shots[k]);
    carTop(ctx, SP, cnx + Rp - half, cny, 0, ppm, { alpha: 0.13, shadow: false });
    const end = ballPath(n, 9);
    dashed(ctx, [B, end], k ? C.cyan : C.lime, { alpha: 0.55, w: 3, dash: [2, 10] });
    ring(ctx, end[0], end[1], 14, k ? C.cyan : C.lime, 0.8, 3);
  }
  const d = shots[active], { cnx, cny, n } = geo(d), ts = T0 + active * SPAN, tc = ts + APP;
  let ncx, bpos = B, brot = 0;
  if (t < tc) ncx = lerp(cnx - 900, cnx, E.outCubic(prog(t, ts - 0.2, tc)) * 0.15 + prog(t, ts - 0.2, tc) * 0.85);
  else { const tau = t - tc; ncx = cnx + 120 * E.outCubic(clamp(tau / 0.8)); bpos = ballPath(n, tau); brot = tau * 14; }
  if (t < T0 - 0.2) ncx = cnx - 900;
  carTop(ctx, SP, ncx + Rp - half, cny, 0, ppm);
  // overlays for the active shot
  const ov = E.outCubic(prog(t, tc, tc + 0.5));
  if (ov > 0) {
    const P = [cnx + n[0] * Rp, cny + n[1] * Rp];
    ctx.save(); ctx.globalAlpha = ov; ctx.strokeStyle = C.cyan; ctx.setLineDash([6, 8]); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cnx, cny, Rp, -1.0, 1.0); ctx.stroke(); ctx.restore();
    dashed(ctx, [[P[0] - 40, P[1]], [P[0] + 260, P[1]]], '#fff', { alpha: ov * 0.5, dash: [4, 6] });
    arrow(ctx, P[0], P[1], P[0] + n[0] * 380 * ov, P[1] + n[1] * 380 * ov, C.lime, { w: 5 });
    const th = Math.atan2(n[1], n[0]);
    if (Math.abs(th) > 0.01) { ctx.save(); ctx.globalAlpha = ov; ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P[0], P[1], 120, Math.min(0, th), Math.max(0, th)); ctx.stroke(); ctx.restore(); }
    const deg = Math.round(Math.abs(th) * 180 / Math.PI);
    text(ctx, `θ = ${deg}°`, P[0] + 140, P[1] + (th < 0 ? -36 : 40), { size: 28, color: C.amber, alpha: ov, weight: 700 });
    text(ctx, `d = ${d === 0 ? '0' : (d > 0 ? '+' : '−') + Math.abs(d).toFixed(1)} m`, cnx - 330, cny, { size: 22, color: C.dim, alpha: ov });
    ctx.save(); ctx.globalAlpha = ov; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(P[0], P[1], 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    impact(ctx, P[0], P[1], prog(t, tc, tc + 0.7), '#fff', 0.6);
  }
  ballAt(ctx, SP, bpos[0], bpos[1], rp, brot);
  // goal flash
  const tGoal = tc + ((goalX - B[0]) / n[0] - 0) / 1100;
  const gf = bump(t, tGoal, tGoal + 0.8);
  if (gf > 0) { ctx.save(); ctx.globalAlpha = gf * 0.35; const g = ctx.createRadialGradient(goalX + 50, bpos[1], 0, goalX + 50, bpos[1], 400); g.addColorStop(0, C.lime); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(goalX - 400, 0, 800, H); ctx.restore(); }
}

// ================= SLIDE: ARENA (rendered flat; CSS gives it perspective) =================
const CARS = [
  [640, 0.37, 0.0, 330, 0.61, 1.0], [600, 0.33, 2.1, 340, 0.52, 0.3],
  [660, 0.29, 4.0, 300, 0.71, 2.2], [560, 0.41, 5.2, 320, 0.47, 4.4],
];
const carPos = (c, tt) => [960 + c[0] * Math.sin(c[1] * tt + c[2]), 540 + c[3] * Math.sin(c[4] * tt + c[5])];
const ballPos = (tt) => [960 + 480 * Math.sin(0.23 * tt + 1.3) + 110 * Math.sin(0.9 * tt), 540 + 250 * Math.sin(0.37 * tt + 0.4)];
export const PADS = [[560, 150], [1360, 150], [560, 930], [1360, 930]];
export function sArena(ctx, t, SP) {
  ctx.clearRect(0, 0, W, H);
  const tt = t * 1.0 + 6;
  const fx0 = 160, fy0 = 90, fx1 = 1760, fy1 = 990;
  // turf
  ctx.save();
  ctx.beginPath(); ctx.roundRect(fx0, fy0, fx1 - fx0, fy1 - fy0, 110); ctx.clip();
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#0b130a' : '#0e180c'; ctx.fillRect(fx0 + i * 100, fy0, 100, fy1 - fy0); }
  const vg = ctx.createRadialGradient(960, 540, 200, 960, 540, 950); vg.addColorStop(0, 'rgba(198,255,58,0.06)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = vg; ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(fx0, fy0, fx1 - fx0, fy1 - fy0, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(960, fy0); ctx.lineTo(960, fy1); ctx.stroke();
  ctx.beginPath(); ctx.arc(960, 540, 130, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(fx0, 540 - 200, 200, 400); ctx.strokeRect(fx1 - 200, 540 - 200, 200, 400);
  ctx.restore();
  // goals
  for (const [x, col] of [[fx0 - 70, C.lime], [fx1, C.cyan]]) {
    ctx.save(); ctx.fillStyle = rgba(col, 0.15); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 30;
    ctx.fillRect(x, 540 - 130, 70, 260); ctx.strokeRect(x, 540 - 130, 70, 260); ctx.restore();
  }
  // charging pads
  const padA = E.outCubic(prog(t, 1.6, 2.4));
  const positions = CARS.map(c => carPos(c, tt));
  PADS.forEach(([px, py], i) => {
    const near = positions.some(([x, y]) => Math.hypot(x - px, y - py) < 110);
    const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i);
    ctx.save(); ctx.globalAlpha = padA; ctx.translate(px, py);
    ctx.fillStyle = rgba(C.lime, 0.08 + 0.1 * pulse + (near ? 0.2 : 0)); ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.shadowColor = C.lime; ctx.shadowBlur = 25 + (near ? 30 : 0);
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; k ? ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 70) : ctx.moveTo(70, 0); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = C.lime; ctx.beginPath(); ctx.moveTo(-8, -22); ctx.lineTo(10, -4); ctx.lineTo(0, -2); ctx.lineTo(8, 22); ctx.lineTo(-10, 2); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (near) ring(ctx, px, py, 70 + 40 * ((t * 1.5) % 1), C.lime, padA * (1 - ((t * 1.5) % 1)), 3);
  });
  // tracking cameras + sweeping beams
  const trA = E.outCubic(prog(t, 3.0, 3.8));
  [[110, 50], [1810, 50], [110, 1030], [1810, 1030]].forEach(([x, y], i) => {
    const base = Math.atan2(540 - y, 960 - x), a = base + 0.35 * Math.sin(t * 0.9 + i * 1.7);
    ctx.save(); ctx.globalAlpha = trA;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 900); g.addColorStop(0, rgba(C.lime, 0.16)); g.addColorStop(1, rgba(C.lime, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 900, a - 0.16, a + 0.16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0d0f'; ctx.strokeStyle = C.lime; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  // ball + trail
  const bp = ballPos(tt);
  for (let k = 14; k >= 1; k--) { const p = ballPos(tt - k * 0.05); ctx.save(); ctx.globalAlpha = 0.25 * (1 - k / 15); ctx.fillStyle = C.lime; ctx.beginPath(); ctx.arc(p[0], p[1], 14 * (1 - k / 18), 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ballAt(ctx, SP, bp[0], bp[1], 22, tt * 3);
  // cars
  const ppm = 24, carA = E.outCubic(prog(t, 0.6, 1.4));
  CARS.forEach((c, i) => {
    const [x, y] = carPos(c, tt), [x2, y2] = carPos(c, tt + 0.02), hd = Math.atan2(y2 - y, x2 - x);
    carTop(ctx, SP, x, y, hd, ppm * 1.25, { alpha: carA, filter: i % 2 ? 'hue-rotate(95deg) saturate(1.4) brightness(1.1)' : null });
    if (trA > 0) {
      const col = i % 2 ? C.cyan : C.lime, s = 62;
      ctx.save(); ctx.globalAlpha = trA; ctx.strokeStyle = col; ctx.lineWidth = 3;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * s, y + sy * (s - 18)); ctx.lineTo(x + sx * s, y + sy * s); ctx.lineTo(x + sx * (s - 18), y + sy * s); ctx.stroke(); }
      ctx.restore();
      const kmh = Math.hypot(x2 - x, y2 - y) / 0.02 / ppm * 3.6 * 1.6;
      const batt = Math.round(94 - i * 9 - t * 0.5);
      ctx.save(); ctx.globalAlpha = trA; ctx.fillStyle = 'rgba(5,7,8,0.82)'; ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x + 70, y - 88, 168, 40, 8); ctx.fill(); ctx.stroke(); ctx.restore();
      text(ctx, `${String(Math.round(kmh)).padStart(2, ' ')} KM/H · ${batt}%`, x + 154, y - 68, { size: 17, color: col, align: 'center', alpha: trA, weight: 600 });
    }
  });
}

// ================= SLIDE: COST PER MATCH (energy flow) =================
const bez = (p0, p1, p2, p3, u) => {
  const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
};
export function sCost(ctx, t, SP) {
  bg(ctx, t, { gx: 600, gy: 560, glow: 0.05 });
  const nodes = [
    { x: 130, y: 470, w: 230, h: 220, label: 'BATTERY', sub: '8 kWh', at: 0.5, col: C.lime },
    { x: 520, y: 490, w: 230, h: 180, label: 'MOTORS', sub: '~90% eff.', at: 0.9, col: C.lime },
    { x: 910, y: 470, w: 230, h: 220, label: 'MOTION', sub: '½mv²', at: 1.3, col: C.cyan },
  ];
  const flows = [
    { a: [360, 580], b: [520, 580], w: 90, col: C.lime, at: 1.4, n: 18, lbl: null },
    { a: [750, 580], b: [910, 580], w: 78, col: C.cyan, at: 1.8, n: 16, lbl: null },
    { a: [1140, 540], b: [1300, 300], w: 34, col: C.red, at: 2.4, n: 9, lbl: ['IMPACTS + BRAKES', 1320, 300] },
    { a: [1140, 620], b: [1300, 820], w: 26, col: '#9aa3ad', at: 2.6, n: 7, lbl: ['TYRES + AIR', 1320, 820] },
    { a: [1025, 690], b: [245, 690], w: 22, col: C.lime, at: 3.0, n: 8, regen: true, lbl: ['REGEN  ≈ +20%', 635, 950] },
  ];
  for (const f of flows) {
    const rev = E.inOutCubic(prog(t, f.at, f.at + 0.9)); if (rev <= 0) continue;
    const ctrl = f.regen ? [[f.a[0], 960], [f.b[0], 960]] : [[(f.a[0] + f.b[0]) / 2 + 20, f.a[1]], [(f.a[0] + f.b[0]) / 2 - 20, f.b[1]]];
    const P = (u) => bez(f.a, ctrl[0], ctrl[1], f.b, u);
    ctx.save(); ctx.strokeStyle = rgba(f.col, 0.22); ctx.lineWidth = f.w; ctx.lineCap = 'butt';
    ctx.beginPath(); for (let u = 0; u <= rev + 1e-6; u += 0.01) { const p = P(Math.min(u, rev)); u ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
    ctx.restore();
    if (rev >= 1) {
      const R = rng(f.n * 13);
      ctx.save(); ctx.fillStyle = f.col; ctx.shadowColor = f.col; ctx.shadowBlur = 12;
      for (let i = 0; i < f.n * 2; i++) {
        const off = R(), lane = (R() - 0.5) * f.w * 0.75, sz = 2 + R() * 3;
        const u = (off + t * 0.45) % 1; const p = P(u), q = P(Math.min(1, u + 0.01));
        const nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1;
        ctx.globalAlpha = Math.sin(Math.PI * u);
        ctx.beginPath(); ctx.arc(p[0] + nx / nl * lane, p[1] + ny / nl * lane, sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (f.lbl) text(ctx, f.lbl[0], f.lbl[1], f.lbl[2], { size: 20, color: f.col === '#9aa3ad' ? C.dim : f.col, alpha: E.outCubic(prog(t, f.at + 0.6, f.at + 1.1)), weight: 600, spacing: 2, align: f.regen ? 'center' : 'left' });
  }
  for (const n of nodes) {
    const a = E.outBack(prog(t, n.at, n.at + 0.6)); if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(n.x + n.w / 2, n.y + n.h / 2); ctx.scale(a, a);
    ctx.fillStyle = 'rgba(12,15,18,0.95)'; ctx.strokeStyle = n.col; ctx.lineWidth = 2; ctx.shadowColor = n.col; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.roundRect(-n.w / 2, -n.h / 2, n.w, n.h, 18); ctx.fill(); ctx.stroke(); ctx.restore();
    text(ctx, n.label, n.x + n.w / 2, n.y + n.h / 2 - 18, { size: 22, color: C.ink, align: 'center', alpha: clamp(a), weight: 600, spacing: 4 });
    text(ctx, n.sub, n.x + n.w / 2, n.y + n.h / 2 + 22, { size: 20, color: n.col, align: 'center', alpha: clamp(a) });
  }
  // battery fill icon inside battery node
  const ba = E.outCubic(prog(t, 0.8, 1.4));
  if (ba > 0) {
    const lvl = 0.85 - 0.12 * prog(t, 2, 9) + 0.05 * prog(t, 4, 9);
    ctx.save(); ctx.globalAlpha = ba; ctx.strokeStyle = C.lime; ctx.lineWidth = 2; ctx.strokeRect(205, 625, 80, 30); ctx.fillStyle = C.lime; ctx.fillRect(285, 633, 6, 14);
    ctx.shadowColor = C.lime; ctx.shadowBlur = 12; ctx.fillRect(209, 629, 72 * lvl, 22); ctx.restore();
  }
}

// ================= SLIDE: ROADMAP =================
const ROAD_PTS = [[90, 690], [430, 560], [800, 660], [1160, 520], [1500, 640], [1840, 540]];
let roadCache = null;
export function roadSamples() {
  if (roadCache) return roadCache;
  const P = ROAD_PTS, out = [];
  const cr = (p0, p1, p2, p3, u) => [0, 1].map(i => 0.5 * ((2 * p1[i]) + (-p0[i] + p2[i]) * u + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * u * u + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * u * u * u));
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < 60; k++) out.push(cr(p0, p1, p2, p3, k / 60));
  }
  out.push(P[P.length - 1]);
  const len = [0]; for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
  roadCache = { pts: out, len, total: len[len.length - 1] };
  return roadCache;
}
export function roadAt(u) {
  const r = roadSamples(), L = clamp(u) * r.total;
  let i = 1; while (i < r.len.length - 1 && r.len[i] < L) i++;
  const f = (L - r.len[i - 1]) / ((r.len[i] - r.len[i - 1]) || 1), a = r.pts[i - 1], b = r.pts[i];
  return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
}
export const MILESTONES = [0.14, 0.39, 0.64, 0.88];
export const roadU = (t) => E.inOutSine(prog(t, 0.8, 8.2));
export function sRoad(ctx, t, SP) {
  bg(ctx, t, { gx: 960, gy: 600, glow: 0.05 });
  const r = roadSamples(), draw = E.inOutCubic(prog(t, 0.1, 1.0));
  const n = Math.floor(r.pts.length * draw);
  const stroke = (w, col, upto, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i < upto; i++) i ? ctx.lineTo(r.pts[i][0], r.pts[i][1]) : ctx.moveTo(r.pts[i][0], r.pts[i][1]); ctx.stroke(); ctx.restore(); };
  stroke(74, '#0d1013', n); stroke(76, 'rgba(255,255,255,0.05)', n);
  stroke(2, 'rgba(255,255,255,0.28)', n, [18, 22]);
  const u = roadU(t), cu = Math.floor(u * (r.pts.length - 1));
  ctx.save(); ctx.shadowColor = C.lime; ctx.shadowBlur = 24; stroke(5, C.lime, cu + 1); ctx.restore();
  MILESTONES.forEach((mu, i) => {
    const p = roadAt(mu), on = u >= mu, a = E.outCubic(prog(t, 0.6 + i * 0.12, 1.2 + i * 0.12));
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = on ? C.lime : '#15191d'; ctx.strokeStyle = on ? C.lime : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3;
    if (on) { ctx.shadowColor = C.lime; ctx.shadowBlur = 30; }
    ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    if (on) { const tp = (u - mu) * 6; ring(ctx, p.x, p.y, 16 + 70 * E.outCubic(clamp(tp)), C.lime, 1 - clamp(tp), 3); }
  });
  const p = roadAt(u), p2 = roadAt(Math.min(1, u + 0.002));
  carTop(ctx, SP, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), 30, { alpha: E.outCubic(prog(t, 0.5, 1.0)) });
}

// ================= SLIDE: THE ASK (donut) =================
export const FUNDS = [
  { pct: 50, label: 'PROTOTYPE CARS', col: C.lime },
  { pct: 25, label: 'ARENA + TRACKING', col: C.cyan },
  { pct: 15, label: 'DURABILITY TESTS', col: C.amber },
  { pct: 10, label: 'SAFETY', col: '#d7dce1' },
];
export function sAsk(ctx, t, SP) {
  bg(ctx, t, { gx: 1340, gy: 540, glow: 0.07 });
  const cx = 1340, cy = 560, R = 225, w = 52;
  ctx.save(); ctx.globalAlpha = E.outCubic(prog(t, 0.6, 1.2)); ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  let acc = -Math.PI / 2;
  FUNDS.forEach((f, i) => {
    const span = f.pct / 100 * Math.PI * 2, p = E.inOutCubic(prog(t, 1.2 + i * 0.45, 1.8 + i * 0.45));
    if (p > 0) {
      ctx.save(); ctx.strokeStyle = f.col; ctx.lineWidth = w; ctx.shadowColor = f.col; ctx.shadowBlur = 26;
      ctx.beginPath(); ctx.arc(cx, cy, R, acc + 0.012, acc + span * p - 0.012); ctx.stroke(); ctx.restore();
      const mid = acc + span / 2, la = E.outCubic(prog(t, 1.6 + i * 0.45, 2.2 + i * 0.45));
      const ex = cx + Math.cos(mid) * (R + 60), ey = cy + Math.sin(mid) * (R + 60), right = Math.cos(mid) >= 0;
      const lx = right ? Math.max(ex + 40, cx + R + 90) : Math.min(ex - 40, cx - R - 90);
      ctx.save(); ctx.globalAlpha = la; ctx.strokeStyle = rgba(f.col, 0.7); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(mid) * (R + 34), cy + Math.sin(mid) * (R + 34)); ctx.lineTo(ex, ey); ctx.lineTo(lx, ey); ctx.stroke(); ctx.restore();
      text(ctx, `${f.pct}%`, lx + (right ? 12 : -12), ey - 18, { size: 44, font: DISP, weight: 400, color: f.col, align: right ? 'left' : 'right', alpha: la });
      text(ctx, f.label, lx + (right ? 12 : -12), ey + 20, { size: 18, color: C.ink, align: right ? 'left' : 'right', alpha: la, spacing: 3 });
    }
    acc += span;
  });
  text(ctx, 'USE OF', cx, cy - 22, { size: 20, color: C.dim, align: 'center', spacing: 6, alpha: E.outCubic(prog(t, 1.0, 1.6)) });
  text(ctx, 'FUNDS', cx, cy + 16, { size: 54, font: DISP, weight: 400, align: 'center', alpha: E.outCubic(prog(t, 1.0, 1.6)) });
}
