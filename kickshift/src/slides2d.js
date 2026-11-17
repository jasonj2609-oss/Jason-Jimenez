// 2D figures, drawn like the plates of a physics paper: hairlines, serif labels, monochrome.
// Every function is a pure function of time t (seconds), so frames render deterministically.
import { clamp, lerp, prog, E, rng, keys } from './util.js';

export const W = 1920, H = 1080;
export const C = { ink: '#F2F2EE', silver: '#B9BDC3', mid: '#7E838A', dark: '#3F4247', dim: 'rgba(242,242,238,0.6)', faint: 'rgba(242,242,238,0.16)' };
const SERIF = '"CMU Serif", "Latin Modern Roman", Georgia, serif';
const bump = (t, a, b) => Math.sin(Math.PI * prog(t, a, b));

// ---------- shared drawing ----------
let vignette = null;
export function bg(ctx, { gx = 960, gy = -200, glow = 0.09 } = {}) {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(gx, gy, 0, gx, gy, 1300);
  r.addColorStop(0, `rgba(255,255,255,${glow})`); r.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  if (!vignette) {
    vignette = document.createElement('canvas'); vignette.width = W; vignette.height = H;
    const g = vignette.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vignette, 0, 0);
}

// Text with *italic* runs, the way variables are set in a paper. "_x" after a run sets x as a subscript.
export function mtext(ctx, s, x, y, { size = 26, color = '#F2F2EE', align = 'left', base = 'middle', alpha = 1, weight = 400, italicAll = false } = {}) {
  if (alpha <= 0) return 0;
  const parts = [];
  s.split('*').forEach((p, i) => {
    if (!p) return;
    const it = italicAll || i % 2 === 1;
    const m = p.match(/^_(\w+)(.*)$/s);
    if (m) { parts.push({ p: m[1], it: false, sub: true }); if (m[2]) parts.push({ p: m[2], it }); }
    else parts.push({ p, it });
  });
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.textBaseline = base; ctx.textAlign = 'left';
  const font = (q) => `${q.it ? 'italic ' : ''}${weight} ${q.sub ? Math.round(size * 0.68) : size}px ${SERIF}`;
  let total = 0; for (const q of parts) { ctx.font = font(q); q.w = ctx.measureText(q.p).width + (q.sub ? 2 : 0); total += q.w; }
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const q of parts) { ctx.font = font(q); ctx.fillText(q.p, cx + (q.sub ? 1 : 0), y + (q.sub ? size * 0.28 : 0)); cx += q.w; }
  ctx.restore();
  return total;
}

// TikZ "stealth" arrow
export function arrow(ctx, x1, y1, x2, y2, { color = '#F2F2EE', w = 2, head = 18, alpha = 1, dash = null } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3 || alpha <= 0) return;
  const h = Math.min(head, len * 0.5);
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.36) * h, y2 - Math.sin(a - 0.36) * h);
  ctx.lineTo(x2 - Math.cos(a) * h * 0.62, y2 - Math.sin(a) * h * 0.62);
  ctx.lineTo(x2 - Math.cos(a + 0.36) * h, y2 - Math.sin(a + 0.36) * h);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function line(ctx, pts, { color = '#F2F2EE', w = 1.5, dash = null, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
}
function circle(ctx, x, y, r, { stroke = '#F2F2EE', fill = null, w = 1.5, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
  ctx.restore();
}
function hat(ctx, x, y, size, alpha = 1) { line(ctx, [[x - size * 0.2, y], [x, y - size * 0.15], [x + size * 0.2, y]], { w: 1.6, alpha }); }

function impact(ctx, x, y, p, scale = 1) {
  if (p <= 0 || p >= 1) return;
  circle(ctx, x, y, (20 + 380 * E.outCubic(p)) * scale, { w: 2.5 * (1 - p) + 0.5, alpha: (1 - p) * 0.8 });
  circle(ctx, x, y, (12 + 220 * E.outCubic(p)) * scale, { stroke: C.silver, w: 1, alpha: (1 - p) * 0.6 });
}
function flash(ctx, t, tc, k = 0.28) {
  const f = Math.exp(-Math.pow((t - tc) * 11, 2)) * k;
  if (f > 0.01) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
}
function groundShadow(ctx, cx, gy, halfW, alpha = 0.8) {
  ctx.save(); ctx.translate(cx, gy); ctx.scale(1, 0.07);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, halfW, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// Side-view car from the baked 3D sprites: spinning wheels, a floor reflection, optional motion blur.
let scratch = null;
export function carSide(ctx, SP, noseX, gy, ppm, wheelAngle = 0, { alpha = 1, blur = 0, reflect = true } = {}) {
  const s = SP.side, k = ppm / s.ppm, bw = s.body.width * k, bh = s.body.height * k, wr = (SP.wheel.img.width * k) / 2;
  const paint = (g, nx, a, flip) => {
    const ox = nx - s.noseX * k;
    g.save(); g.globalAlpha = a;
    if (flip) { g.translate(0, gy); g.scale(1, -1); } else g.translate(0, gy);
    const oy = -s.groundY * k;
    g.drawImage(s.body, ox, oy, bw, bh);
    for (const w of s.wheels) { g.save(); g.translate(ox + w.x * k, oy + w.y * k); g.rotate(wheelAngle); g.drawImage(SP.wheel.img, -wr, -wr, wr * 2, wr * 2); g.restore(); }
    g.restore();
  };
  const n = blur > 2 ? 10 : 1;
  const run = (g, flip) => { for (let i = 0; i < n; i++) paint(g, noseX - (n > 1 ? (i / (n - 1)) * blur : 0), n > 1 ? alpha * Math.min(1, 1.9 / n) : alpha, flip); };
  if (reflect) {
    if (!scratch) { scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; }
    const g = scratch.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    run(g, true);
    g.globalCompositeOperation = 'destination-in';
    const m = g.createLinearGradient(0, gy, 0, gy + 0.55 * bh); m.addColorStop(0, 'rgba(0,0,0,0.22)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(scratch, 0, 0);
  }
  groundShadow(ctx, noseX - (s.noseX - s.tailX) * k * 0.5 - blur / 2, gy, (s.noseX - s.tailX) * k * 0.6 + blur / 2, 0.85 * alpha);
  run(ctx, false);
}
export function carTop(ctx, SP, cx, cy, heading, ppm, { alpha = 1, black = false, shadow = true } = {}) {
  const s = SP.top, img = black ? s.black : s.img, k = ppm / s.ppm, w = img.width * k, h = img.height * k;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(heading); ctx.globalAlpha = alpha;
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = Math.max(8, 40 * k * 10); ctx.shadowOffsetY = 4; }
  ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
export function ballAt(ctx, SP, x, y, r, rot = 0, alpha = 1) {
  const b = SP.ball, k = r / (b.r * b.ppm), s = b.img.width * k;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(b.img, -s / 2, -s / 2, s, s); ctx.restore();
}

function streaks(ctx, t, { seed = 3, n = 90, inten = 1, y0 = 100, y1 = 1000, speed = 1 } = {}) {
  const R = rng(seed);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const y = y0 + R() * (y1 - y0), sp = (900 + R() * 2600) * speed, len = 60 + R() * 380, off = R() * 5000, lw = 0.5 + R() * 1.4;
    const a = (0.04 + R() * 0.2) * inten, x = W + 400 - ((t * sp + off) % (W + 900));
    const g = ctx.createLinearGradient(x, y, x + len, y);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.restore();
}
function groundLine(ctx, gy, alpha = 1, ppm = 110, x0 = 0, x1 = W, ticks = true) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(242,242,238,0)'); g.addColorStop(0.15, 'rgba(242,242,238,0.45)'); g.addColorStop(0.85, 'rgba(242,242,238,0.45)'); g.addColorStop(1, 'rgba(242,242,238,0)');
  ctx.fillStyle = g; ctx.fillRect(x0, gy, x1 - x0, 1.5);
  if (ticks) { ctx.fillStyle = 'rgba(242,242,238,0.2)'; for (let x = x0 + ppm; x < x1 - 40; x += ppm) ctx.fillRect(x, gy + 8, 1, 9); }
  ctx.restore();
}
// paper-style axes: closed frame, inward ticks, serif tick labels
function axes(ctx, { x0, x1, y0, y1, xt, yt, X, Y, xl, yl, alpha = 1 }) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(242,242,238,0.7)'; ctx.lineWidth = 1.4;
  ctx.strokeRect(x0, y1, x1 - x0, y0 - y1); ctx.lineWidth = 1.2;
  for (const v of xt) { const x = X(v); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - 10); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 10); ctx.stroke(); }
  for (const v of yt) { const y = Y(v); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 10, y); ctx.moveTo(x1, y); ctx.lineTo(x1 - 10, y); ctx.stroke(); }
  ctx.restore();
  for (const v of xt) mtext(ctx, String(v), X(v), y0 + 30, { size: 22, color: C.silver, align: 'center', alpha });
  for (const v of yt) mtext(ctx, String(v), x0 - 14, Y(v), { size: 22, color: C.silver, align: 'right', alpha });
  mtext(ctx, xl, (x0 + x1) / 2, y0 + 70, { size: 25, align: 'center', alpha });
  ctx.save(); ctx.translate(x0 - 92, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); mtext(ctx, yl, 0, 0, { size: 25, align: 'center', alpha }); ctx.restore();
}
function hatchFill(ctx, path, color, alpha, gap = 10) {
  if (alpha <= 0) return;
  ctx.save(); ctx.clip(path); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
  for (let x = -H; x < W; x += gap) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
  ctx.restore();
}

// ================= SLIDE: THE IDEA =================
export function sIdea(ctx, t, SP) {
  bg(ctx, { gy: 300, glow: 0.05 });
  const gy = 1000, ppm = 200, br = 0.75 * ppm;
  streaks(ctx, t, { inten: E.outCubic(prog(t, 0, 1.2)) * (1 + 2 * bump(t, 5.6, 6.8)), y0: 80, y1: 960, speed: 1 + 1.5 * bump(t, 5.6, 6.8) });
  groundLine(ctx, gy, E.outCubic(prog(t, 4.6, 5.2)), ppm, 0, W, false);
  const bxRest = 1480, tc = 6.05, vcar = 4200;
  const nose = bxRest - br + (t - tc) * vcar;
  let bx, by, rot = 0;
  if (t < tc) { const p = E.outCubic(prog(t, 4.4, 5.6)); bx = lerp(W + br + 40, bxRest, p); by = gy - br; rot = -(W + br + 40 - bx) / br; }
  else { const tau = t - tc; bx = bxRest + 2600 * tau; by = gy - br - 1500 * tau + 1400 * tau * tau; rot = tau * 18; }
  if (nose > -900 && nose < W + 1500) carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36, { blur: 240 });
  if (t > 4.4) ballAt(ctx, SP, bx, by, br, rot);
  impact(ctx, bxRest - br, gy - br, prog(t, tc, tc + 0.7), 1.1);
  flash(ctx, t, tc, 0.3);
}

// ================= SLIDE: MOMENTUM =================
export const PHYS = { M: 900, m: 20, e: 0.6, v0: 15 };
PHYS.vb = (1 + PHYS.e) * PHYS.M * PHYS.v0 / (PHYS.M + PHYS.m);
PHYS.v1 = PHYS.v0 * (PHYS.M - PHYS.e * PHYS.m) / (PHYS.M + PHYS.m);

export function sMomentum(ctx, t, SP) {
  bg(ctx, { gx: 1300 });
  const ppm = 112, gy = 840, rb = 0.75 * ppm, bx0 = 1130, slow = 1 / 3;
  const { M, v0, vb, v1 } = PHYS;
  const vd = v0 * ppm * slow, contactX = bx0 - rb, x0 = -120, tStart = 1.0;
  const tc = tStart + (contactX - x0) / vd;
  let nose, vcar;
  if (t < tc) { nose = x0 + (t - tStart) * vd; vcar = v0; }
  else { const T = 1.8, vd1 = v1 * ppm * slow, tt = Math.min(t - tc, T); nose = contactX + vd1 * tt - 0.5 * (vd1 / T) * tt * tt; vcar = v1 * (1 - tt / T); }
  groundLine(ctx, gy, E.outCubic(prog(t, 0.2, 1.0)), ppm);
  const ang = 22 * Math.PI / 180, vx = vb * Math.cos(ang) * ppm * slow, vy = vb * Math.sin(ang) * ppm * slow, g = 9.81 * ppm * slow * slow;
  const bpos = (tau) => [bx0 + vx * tau, gy - rb - vy * tau + 0.5 * g * tau * tau];
  if (t > tc) {
    const pts = []; for (let k = 0; k <= 60; k++) pts.push(bpos(k * 0.05));
    line(ctx, pts, { color: C.silver, w: 1.5, dash: [2, 9], alpha: 0.8 * E.outCubic(prog(t, tc + 0.15, tc + 0.6)) });
    // multi-flash exposure of the ball, like a strobe photograph
    for (let k = 1; k * 0.14 < t - tc; k++) { const [x, y] = bpos(k * 0.14); if (x < W + 100 && x > nose + 60) ballAt(ctx, SP, x, y, rb, k * 0.14 * vx / rb, 0.13); }
  }
  carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36);
  let bx = bx0, by = gy - rb, brot = 0;
  if (t > tc) { [bx, by] = bpos(t - tc); brot = (t - tc) * vx / rb; }
  ballAt(ctx, SP, bx, by, rb, brot);
  impact(ctx, contactX, gy - rb, prog(t, tc, tc + 0.9));
  flash(ctx, t, tc, 0.25);
  const a1 = E.outCubic(prog(t, 1.6, 2.2)) * clamp(vcar / 3);
  const cx = nose - 2.27 * ppm, ay = gy - 205, L = 240 * (vcar / v0);
  arrow(ctx, cx - 70, ay, cx - 70 + L * a1, ay, { alpha: a1, w: 2.4, head: 20 });
  mtext(ctx, '*p* = *Mv*', cx - 70, ay - 38, { size: 32, alpha: a1 });
  mtext(ctx, `*M* = ${M} kg,  *v* = ${vcar.toFixed(1)} m/s`, cx - 70, ay + 34, { size: 22, color: C.silver, alpha: a1 });
  const am = E.outCubic(prog(t, 2.0, 2.6)) * (t < tc ? 1 : 0);
  mtext(ctx, '*m* = 20 kg', bx0, gy - 2 * rb - 34, { size: 24, color: C.silver, align: 'center', alpha: am });
  if (t > tc) {
    const tau = t - tc, a2 = E.outCubic(prog(t, tc + 0.1, tc + 0.5));
    const vyNow = vy - g * tau, sp = Math.hypot(vx, vyNow), Lb = 330 * a2;
    if (bx < W - 60) {
      arrow(ctx, bx, by, bx + vx / sp * Lb, by - vyNow / sp * Lb, { alpha: a2, w: 2.4, head: 20 });
      mtext(ctx, `*v*_ball = ${vb.toFixed(1)} m/s`, bx + 40, by + 120, { size: 28, alpha: a2 });
    }
  }
}

// ================= SLIDE: IMPULSE / BUMPERS =================
function honeycomb(ctx, x, y, w, h, squash, alpha) {
  if (alpha <= 0) return;
  ctx.save(); ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#2b2d31'); g.addColorStop(1, '#16171a');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(210,214,220,0.75)'; ctx.lineWidth = 1.2;
  const r = 11, sx = squash;
  for (let row = -1; row * r * 1.5 < h + r; row++) for (let col = -1; col * r * Math.sqrt(3) * sx < w + r * 2; col++) {
    const cx = x + (col * Math.sqrt(3) * r + (row % 2 ? Math.sqrt(3) * r / 2 : 0)) * sx, cy = y + row * r * 1.5;
    ctx.beginPath();
    for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, px = cx + Math.cos(a) * r * sx, py = cy + Math.sin(a) * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.strokeRect(x, y, w, h); ctx.restore();
}

export function sImpulse(ctx, t, SP) {
  bg(ctx, { gx: 500 });
  const ppm = 150, gy = 820, wallX = 830, bw0 = 58, bwMin = 16, tA = 2.0, tB = 2.7;
  let nose, bw = bw0;
  if (t < tA) nose = lerp(-300, wallX - bw0, prog(t, 0.4, tA));
  else if (t < tB) { const p = prog(t, tA, tB); bw = bw0 - (bw0 - bwMin) * Math.sin(Math.PI * Math.min(1, p * 1.25) * 0.5); nose = wallX - bw; }
  else { const p = E.outCubic(prog(t, tB, tB + 0.8)); bw = lerp(bwMin, bw0 * 0.86, p); nose = wallX - bw - 30 * p; }
  if (t < 0.4) nose = -300;
  ctx.save();
  const wg = ctx.createLinearGradient(wallX, 0, wallX + 56, 0); wg.addColorStop(0, '#3a3c40'); wg.addColorStop(1, '#141517');
  ctx.fillStyle = wg; ctx.fillRect(wallX, gy - 300, 56, 300);
  ctx.strokeStyle = 'rgba(242,242,238,0.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(wallX, gy - 300, 56, 300);
  ctx.beginPath(); ctx.rect(wallX + 56, gy - 300, 30, 300); ctx.clip(); ctx.strokeStyle = 'rgba(242,242,238,0.35)';
  for (let y = gy - 320; y < gy + 20; y += 14) { ctx.beginPath(); ctx.moveTo(wallX + 56, y + 14); ctx.lineTo(wallX + 86, y - 16); ctx.stroke(); }
  ctx.restore();
  groundLine(ctx, gy, 1, ppm, 0, 960, false);
  carSide(ctx, SP, nose, gy, ppm, nose / ppm / 0.36, { reflect: false });
  const sw = prog(t, 7.4, 9.2), by = gy - 0.6 * ppm, bh = 0.42 * ppm;
  if (sw <= 0) honeycomb(ctx, nose, by, bw, bh, bw / bw0, 1);
  else {
    const out = E.inCubic(prog(sw, 0, 0.45)), inn = E.outCubic(prog(sw, 0.45, 1));
    if (out < 1) honeycomb(ctx, nose, by + out * 150, bw, bh, bw / bw0, 1 - out);
    if (inn > 0) honeycomb(ctx, nose, by + (1 - inn) * 150, bw0 * 0.86, bh, 0.86, inn);
  }
  const lab = E.outCubic(prog(t, 1.0, 1.6)) * (1 - prog(t, 7.2, 7.5));
  line(ctx, [[nose + 20, by - 6], [nose - 30, by - 80]], { w: 1.2, alpha: lab });
  mtext(ctx, 'honeycomb module', nose - 38, by - 96, { size: 24, color: C.silver, align: 'right', alpha: lab, italicAll: true });
  impact(ctx, wallX, gy - 0.4 * ppm, prog(t, tA, tA + 0.9), 0.6);

  const x0 = 1100, x1 = 1800, y0 = 840, y1 = 330, tmax = 80, Fmax = 800;
  const X = (ms) => x0 + (ms / tmax) * (x1 - x0), Y = (kN) => y0 - (kN / Fmax) * (y0 - y1);
  axes(ctx, { x0, x1, y0, y1, xt: [0, 20, 40, 60, 80], yt: [0, 200, 400, 600, 800], X, Y, xl: 'time *t* (ms)', yl: 'force *F* (kN)', alpha: E.outCubic(prog(t, 0.5, 1.3)) });
  const cur = tmax * prog(t, 2.0, 4.6);
  const curve = (peak, dur, rigid) => {
    const end = Math.min(cur, dur); if (end <= 0) return;
    const p = new Path2D(); p.moveTo(X(0), Y(0));
    for (let ms = 0; ms <= end; ms += dur / 140) p.lineTo(X(ms), Y(peak * Math.sin(Math.PI * ms / dur)));
    p.lineTo(X(end), Y(peak * Math.sin(Math.PI * end / dur)));
    const area = new Path2D(p); area.lineTo(X(end), Y(0)); area.closePath();
    if (rigid) hatchFill(ctx, area, C.ink, 0.35, 9);
    else { ctx.save(); ctx.fillStyle = 'rgba(185,189,195,0.18)'; ctx.fill(area); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = rigid ? C.ink : C.silver; ctx.lineWidth = 2.4; if (!rigid) ctx.setLineDash([12, 7]); ctx.stroke(p); ctx.restore();
  };
  curve(707, 10, true); curve(141, 50, false);
  if (cur > 0 && cur < tmax) line(ctx, [[X(cur), y1], [X(cur), y0]], { color: C.mid, w: 1, dash: [3, 5] });
  const lg = E.outCubic(prog(t, 1.2, 1.8));
  if (lg > 0) {
    ctx.save(); ctx.globalAlpha = lg; ctx.fillStyle = 'rgba(5,5,5,0.85)'; ctx.strokeStyle = 'rgba(242,242,238,0.4)'; ctx.lineWidth = 1;
    ctx.fillRect(x1 - 320, y1 + 20, 300, 96); ctx.strokeRect(x1 - 320, y1 + 20, 300, 96); ctx.restore();
    line(ctx, [[x1 - 300, y1 + 50], [x1 - 252, y1 + 50]], { w: 2.4, alpha: lg });
    line(ctx, [[x1 - 300, y1 + 88], [x1 - 252, y1 + 88]], { w: 2.4, color: C.silver, dash: [12, 7], alpha: lg });
    mtext(ctx, 'rigid bumper', x1 - 238, y1 + 50, { size: 24, alpha: lg });
    mtext(ctx, 'KickShift module', x1 - 238, y1 + 88, { size: 24, alpha: lg });
  }
  mtext(ctx, '707 kN', X(5) + 22, Y(707) + 6, { size: 25, alpha: E.outCubic(prog(cur, 5, 12)) });
  mtext(ctx, '141 kN', X(25), Y(141) - 26, { size: 25, color: C.silver, align: 'center', alpha: E.outCubic(prog(cur, 25, 34)) });
  const s = E.outCubic(prog(t, 5.0, 5.8));
  if (s > 0) {
    line(ctx, [[X(6), Y(707)], [X(62), Y(707)]], { color: C.mid, dash: [4, 6], alpha: s });
    line(ctx, [[X(32), Y(141)], [X(62), Y(141)]], { color: C.mid, dash: [4, 6], alpha: s });
    arrow(ctx, X(60), Y(700), X(60), Y(150), { alpha: s, w: 2, head: 16 });
    mtext(ctx, '−80% peak force', X(58), Y(440), { size: 30, align: 'right', alpha: s });
    mtext(ctx, 'equal areas, equal impulse', X(58), Y(440) + 38, { size: 23, color: C.silver, align: 'right', alpha: s, italicAll: true });
  }
}

// ================= SLIDE: KINETIC ENERGY / BOOST =================
const KE = (kmh) => 0.5 * 900 * Math.pow(kmh / 3.6, 2) / 1000;
export function speedAt(t) {
  let v = keys(t, [[0, 0], [1.2, 0], [2.6, 30], [4.0, 30], [5.4, 60], [6.8, 60], [7.7, 80]]);
  if (t > 7.7) v = 80 - 1.4 * Math.abs(Math.sin((t - 7.7) * 14)) * Math.exp(-(t - 7.7) * 2.2);
  return v;
}
export function sEnergy(ctx, t, SP) {
  bg(ctx, { gx: 540, gy: 200 });
  const v = speedAt(t);
  const cx = 540, cy = 610, R = 280, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, A = (k) => a0 + (a1 - a0) * (k / 100);
  const ap = E.outCubic(prog(t, 0.3, 1.3));
  ctx.save(); ctx.globalAlpha = ap;
  ctx.strokeStyle = 'rgba(242,242,238,0.25)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + (a1 - a0) * ap); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R - 92, a0, a1); ctx.stroke();
  for (let k = 0; k <= 100; k += 2) {
    const a = A(k), major = k % 10 === 0, r1 = R - 4, r2 = R - (major ? 30 : 16);
    ctx.strokeStyle = k <= v ? C.ink : 'rgba(242,242,238,0.35)'; ctx.lineWidth = major ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
  }
  ctx.restore();
  const capP = new Path2D(); capP.arc(cx, cy, R + 16, A(80), A(100)); capP.arc(cx, cy, R + 3, A(100), A(80), true); capP.closePath();
  hatchFill(ctx, capP, C.ink, 0.55 * ap, 6);
  for (let k = 0; k <= 100; k += 20) { const a = A(k); mtext(ctx, `${k}`, cx + Math.cos(a) * (R - 58), cy + Math.sin(a) * (R - 58), { size: 26, color: C.silver, align: 'center', alpha: ap }); }
  if (v > 0.2) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.shadowColor = 'rgba(255,255,255,0.5)'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(cx, cy, R + 9, a0, A(v)); ctx.stroke(); ctx.restore(); }
  const an = A(v);
  ctx.save(); ctx.globalAlpha = ap; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - Math.cos(an) * 34, cy - Math.sin(an) * 34); ctx.lineTo(cx + Math.cos(an) * (R - 20), cy + Math.sin(an) * (R - 20)); ctx.stroke();
  ctx.fillStyle = '#0b0b0c'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  mtext(ctx, `${Math.round(v)}`, cx, cy + 128, { size: 110, align: 'center', alpha: ap });
  mtext(ctx, 'km/h', cx, cy + 196, { size: 28, color: C.silver, align: 'center', alpha: ap, italicAll: true });
  if (t > 6.8) mtext(ctx, t > 7.7 ? 'boost — limited at 80 km/h' : 'boost', cx, cy + 250, { size: 25, color: C.silver, align: 'center', alpha: E.outCubic(prog(t, 6.8, 7.2)), italicAll: true });

  const x0 = 1100, x1 = 1800, y0 = 840, y1 = 330, vmax = 100, kmax = 360;
  const X = (k) => x0 + (k / vmax) * (x1 - x0), Y = (e) => y0 - (e / kmax) * (y0 - y1);
  const pa = E.outCubic(prog(t, 0.6, 1.4));
  axes(ctx, { x0, x1, y0, y1, xt: [0, 20, 40, 60, 80, 100], yt: [0, 100, 200, 300], X, Y, xl: 'speed *v* (km/h)', yl: 'kinetic energy (kJ)', alpha: pa });
  const ghost = []; for (let k = 0; k <= 100; k += 1) ghost.push([X(k), Y(KE(k))]);
  line(ctx, ghost, { w: 1, dash: [2, 7], alpha: 0.35 * pa });
  const capA = E.outCubic(prog(t, 6.6, 7.2));
  if (capA > 0) {
    const r = new Path2D(); r.rect(X(80), y1, X(100) - X(80), y0 - y1);
    hatchFill(ctx, r, C.ink, 0.22 * capA, 12);
    line(ctx, [[X(80), y1], [X(80), y0]], { w: 1.4, alpha: capA });
    mtext(ctx, 'arena cap', X(90), y1 + 34, { size: 24, align: 'center', alpha: capA, italicAll: true });
  }
  if (v > 0.5) {
    const pts = []; for (let k = 0; k <= v; k += 0.5) pts.push([X(k), Y(KE(k))]); pts.push([X(v), Y(KE(v))]);
    line(ctx, pts, { w: 3 }); circle(ctx, X(v), Y(KE(v)), 7, { fill: C.ink, stroke: null });
  }
  for (const [k, at] of [[30, 2.6], [60, 5.4]]) {
    const a = E.outCubic(prog(t, at, at + 0.4)); if (a <= 0) continue;
    circle(ctx, X(k), Y(KE(k)), 10, { w: 1.6, alpha: a });
    mtext(ctx, `${Math.round(KE(k))} kJ`, X(k) - 18, Y(KE(k)) - 30, { size: 26, align: 'right', alpha: a });
  }
  const rel = E.outCubic(prog(t, 5.8, 6.5));
  if (rel > 0) {
    for (const k of [30, 60]) { line(ctx, [[X(k), Y(KE(k))], [X(k), y0]], { color: C.silver, dash: [3, 6], alpha: rel }); line(ctx, [[x0, Y(KE(k))], [X(k), Y(KE(k))]], { color: C.silver, dash: [3, 6], alpha: rel }); }
    mtext(ctx, '2× speed', X(45), y0 - 26, { size: 26, align: 'center', alpha: rel, italicAll: true });
    mtext(ctx, '4× energy', x0 + 22, (Y(KE(30)) + Y(KE(60))) / 2, { size: 26, alpha: rel, italicAll: true });
  }
  if (v > 1) mtext(ctx, `*E*_k = ${Math.round(KE(v))} kJ`, Math.min(X(v), 1640) - 14, Y(KE(v)) - 64, { size: 30, align: 'right', alpha: E.outCubic(prog(t, 1.3, 1.8)) });
}

// ================= SLIDE: AIM WITH GEOMETRY (top-down) =================
export const AIM = { ppm: 100, B: [1060, 620], R: 1.5, r: 0.75, shots: [0, 0.7, -0.7], goalX: 1740, mouth: [320, 920] };
export function sAim(ctx, t, SP) {
  bg(ctx, { gx: 1700, gy: 600, glow: 0.05 });
  const { ppm, B, R, r, shots, goalX, mouth } = AIM;
  const Rp = R * ppm, rp = r * ppm, sum = Rp + rp, half = 2.27 * ppm;
  const pa = E.outCubic(prog(t, 0.2, 1.0));
  line(ctx, [[goalX, 70], [goalX, 1010]], { color: C.faint, w: 1.4, alpha: pa });
  ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = C.faint; ctx.lineWidth = 1.4; ctx.strokeRect(goalX - 250, mouth[0] - 60, 250, mouth[1] - mouth[0] + 120); ctx.restore();
  line(ctx, [[goalX, mouth[0]], [goalX + 100, mouth[0]], [goalX + 100, mouth[1]], [goalX, mouth[1]]], { w: 2.4, alpha: pa });
  ctx.save(); ctx.globalAlpha = pa * 0.3; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.8;
  for (let y = mouth[0]; y <= mouth[1]; y += 22) { ctx.beginPath(); ctx.moveTo(goalX, y); ctx.lineTo(goalX + 100, y); ctx.stroke(); }
  for (let x = goalX; x <= goalX + 100; x += 20) { ctx.beginPath(); ctx.moveTo(x, mouth[0]); ctx.lineTo(x, mouth[1]); ctx.stroke(); }
  ctx.restore();

  const T0 = 1.2, SPAN = 3.0, APP = 1.0;
  const geo = (d) => { const dp = d * ppm, cnx = B[0] - Math.sqrt(sum * sum - dp * dp), cny = B[1] + dp; return { cnx, cny, n: [(B[0] - cnx) / sum, (B[1] - cny) / sum] }; };
  const ballPath = (n, tau) => {
    const sp = 1100, dGoal = (goalX + 50 - B[0]) / n[0];
    const d = tau * sp < dGoal ? tau * sp : dGoal + 30 * E.outCubic(clamp((tau * sp - dGoal) / 300));
    return [B[0] + n[0] * d, B[1] + n[1] * d];
  };
  const active = clamp(Math.floor((t - T0) / SPAN), 0, shots.length - 1);
  for (let k = 0; k < active; k++) {
    const { cnx, cny, n } = geo(shots[k]);
    const end = ballPath(n, 9);
    line(ctx, [B, end], { color: C.silver, w: 1.6, dash: [2, 9], alpha: 0.8 });
    circle(ctx, end[0], end[1], 10, { stroke: C.silver, w: 1.4, alpha: 0.9 });
  }
  const d = shots[active], { cnx, cny, n } = geo(d), ts = T0 + active * SPAN, tc = ts + APP;
  let ncx, bpos = B, brot = 0;
  if (t < tc) ncx = lerp(cnx - 900, cnx, E.outCubic(prog(t, ts - 0.2, tc)) * 0.15 + prog(t, ts - 0.2, tc) * 0.85);
  else { const tau = t - tc; ncx = cnx + 110 * E.outCubic(clamp(tau / 0.8)); bpos = ballPath(n, tau); brot = tau * 14; }
  if (t < T0 - 0.2) ncx = cnx - 900;
  carTop(ctx, SP, ncx + Rp - half, cny, 0, ppm);
  const ov = E.outCubic(prog(t, tc, tc + 0.5));
  if (ov > 0) {
    const P = [cnx + n[0] * Rp, cny + n[1] * Rp];
    ctx.save(); ctx.globalAlpha = ov; ctx.strokeStyle = C.silver; ctx.setLineDash([6, 7]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cnx, cny, Rp, -1.0, 1.0); ctx.stroke(); ctx.restore();
    line(ctx, [[P[0] - 40, P[1]], [P[0] + 280, P[1]]], { color: C.mid, w: 1.2, dash: [4, 6], alpha: ov });
    arrow(ctx, P[0], P[1], P[0] + n[0] * 360 * ov, P[1] + n[1] * 360 * ov, { w: 2.4, head: 20 });
    const tip = [P[0] + n[0] * 360, P[1] + n[1] * 360], up = n[1] < -0.01;
    const ly = tip[1] + (up ? -30 : 34);
    mtext(ctx, '*n*', tip[0] + 16, ly, { size: 34, alpha: ov }); hat(ctx, tip[0] + 25, ly - 14, 34, ov);
    const th = Math.atan2(n[1], n[0]);
    if (Math.abs(th) > 0.01) { ctx.save(); ctx.globalAlpha = ov; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(P[0], P[1], 130, Math.min(0, th), Math.max(0, th)); ctx.stroke(); ctx.restore(); }
    mtext(ctx, `*θ* = ${Math.round(Math.abs(th) * 180 / Math.PI)}°`, P[0] + 150, P[1] + (th < 0 ? 30 : th > 0 ? -30 : -30), { size: 30, alpha: ov });
    circle(ctx, P[0], P[1], 5, { fill: C.ink, stroke: null, alpha: ov });
    // offset of the car's centre line from the ball's centre, labelled behind the car
    const tail = cnx + Rp - 2 * half;
    line(ctx, [[tail - 150, cny], [tail - 10, cny]], { color: C.mid, w: 1, dash: [2, 5], alpha: ov });
    mtext(ctx, d === 0 ? '*d* = 0' : `*d* = ${Math.abs(d).toFixed(1)} m`, tail - 160, cny, { size: 28, align: 'right', alpha: ov });
    impact(ctx, P[0], P[1], prog(t, tc, tc + 0.7), 0.5);
  }
  ballAt(ctx, SP, bpos[0], bpos[1], rp, brot);
}

// ================= SLIDE: ARENA (flat; CSS tilts it into perspective) =================
const CARS = [
  [640, 0.37, 0.0, 330, 0.61, 1.0], [600, 0.33, 2.1, 340, 0.52, 0.3],
  [660, 0.29, 4.0, 300, 0.71, 2.2], [560, 0.41, 5.2, 320, 0.47, 4.4],
];
const carPos = (c, tt) => [960 + c[0] * Math.sin(c[1] * tt + c[2]), 540 + c[3] * Math.sin(c[4] * tt + c[5])];
const ballPos = (tt) => [960 + 480 * Math.sin(0.23 * tt + 1.3) + 110 * Math.sin(0.9 * tt), 540 + 250 * Math.sin(0.37 * tt + 0.4)];
export const PADS = [[560, 150], [1360, 150], [560, 930], [1360, 930]];
export function sArena(ctx, t, SP) {
  ctx.clearRect(0, 0, W, H);
  const tt = t + 6, fx0 = 160, fy0 = 90, fx1 = 1760, fy1 = 990;
  ctx.save(); ctx.beginPath(); ctx.roundRect(fx0, fy0, fx1 - fx0, fy1 - fy0, 110); ctx.clip();
  for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? '#1a1b1d' : '#1d1e21'; ctx.fillRect(fx0 + i * 100, fy0, 100, fy1 - fy0); }
  const vg = ctx.createRadialGradient(960, 540, 150, 960, 540, 980); vg.addColorStop(0, 'rgba(255,255,255,0.06)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vg; ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(242,242,238,0.7)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(fx0, fy0, fx1 - fx0, fy1 - fy0, 110); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(960, fy0); ctx.lineTo(960, fy1); ctx.stroke();
  ctx.beginPath(); ctx.arc(960, 540, 130, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(fx0, 340, 200, 400); ctx.strokeRect(fx1 - 200, 340, 200, 400);
  ctx.restore();
  for (const x of [fx0 - 64, fx1]) { ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.08)'; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.fillRect(x, 410, 64, 260); ctx.strokeRect(x, 410, 64, 260); ctx.restore(); }
  const padA = E.outCubic(prog(t, 1.6, 2.4)), positions = CARS.map(c => carPos(c, tt));
  PADS.forEach(([px, py], i) => {
    const near = positions.some(([x, y]) => Math.hypot(x - px, y - py) < 110), pulse = 0.5 + 0.5 * Math.sin(t * 3 + i);
    ctx.save(); ctx.globalAlpha = padA; ctx.translate(px, py);
    ctx.fillStyle = `rgba(242,242,238,${0.05 + 0.06 * pulse + (near ? 0.12 : 0)})`; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4; ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 10 + (near ? 26 : 0);
    ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; k ? ctx.lineTo(Math.cos(a) * 68, Math.sin(a) * 68) : ctx.moveTo(68, 0); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; k ? ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46) : ctx.moveTo(46, 0); } ctx.closePath(); ctx.stroke();
    ctx.restore();
    if (near) circle(ctx, px, py, 68 + 40 * ((t * 1.5) % 1), { w: 2, alpha: padA * (1 - ((t * 1.5) % 1)) });
  });
  const trA = E.outCubic(prog(t, 3.0, 3.8));
  [[110, 50], [1810, 50], [110, 1030], [1810, 1030]].forEach(([x, y], i) => {
    const base = Math.atan2(540 - y, 960 - x), a = base + 0.35 * Math.sin(t * 0.9 + i * 1.7);
    ctx.save(); ctx.globalAlpha = trA;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 900); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 900, a - 0.15, a + 0.15); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0b0c'; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  });
  const bp = ballPos(tt);
  for (let k = 12; k >= 1; k--) { const p = ballPos(tt - k * 0.05); circle(ctx, p[0], p[1], 12 * (1 - k / 16), { fill: 'rgba(242,242,238,0.5)', stroke: null, alpha: 0.35 * (1 - k / 13) }); }
  ballAt(ctx, SP, bp[0], bp[1], 22, tt * 3);
  const ppm = 30, carA = E.outCubic(prog(t, 0.6, 1.4));
  CARS.forEach((c, i) => {
    const [x, y] = carPos(c, tt), [x2, y2] = carPos(c, tt + 0.02), hd = Math.atan2(y2 - y, x2 - x);
    carTop(ctx, SP, x, y, hd, ppm, { alpha: carA, black: i % 2 === 1 });
    if (trA > 0) {
      const s = 64;
      ctx.save(); ctx.globalAlpha = trA; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * s, y + sy * (s - 16)); ctx.lineTo(x + sx * s, y + sy * s); ctx.lineTo(x + sx * (s - 16), y + sy * s); ctx.stroke(); }
      ctx.restore();
      const kmh = Math.hypot(x2 - x, y2 - y) / 0.02 / 24 * 3.6 * 1.6, batt = Math.round(94 - i * 9 - t * 0.5);
      ctx.save(); ctx.globalAlpha = trA; ctx.fillStyle = 'rgba(5,5,5,0.85)'; ctx.strokeStyle = 'rgba(242,242,238,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.rect(x + 72, y - 92, 200, 42); ctx.fill(); ctx.stroke(); ctx.restore();
      mtext(ctx, `${i % 2 ? 'B' : 'A'}${Math.floor(i / 2) + 1}   ${Math.round(kmh)} km/h · ${batt}%`, x + 172, y - 71, { size: 21, align: 'center', alpha: trA });
    }
  });
}

// ================= SLIDE: COST PER MATCH (energy flow) =================
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
export function sCost(ctx, t, SP) {
  bg(ctx, { gx: 640 });
  const nodes = [
    { x: 130, y: 470, w: 230, h: 220, label: 'Battery', sub: '8 kWh', at: 0.5 },
    { x: 520, y: 490, w: 230, h: 180, label: 'Motors', sub: '*η* ≈ 0.9', at: 0.9 },
    { x: 910, y: 470, w: 230, h: 220, label: 'Motion', sub: '½*Mv*²', at: 1.3 },
  ];
  const flows = [
    { a: [360, 580], b: [520, 580], w: 90, col: '242,242,238', al: 0.2, at: 1.4, n: 18 },
    { a: [750, 580], b: [910, 580], w: 78, col: '242,242,238', al: 0.2, at: 1.8, n: 16 },
    { a: [1140, 540], b: [1300, 270], w: 34, col: '185,189,195', al: 0.22, at: 2.4, n: 9, lbl: ['impacts and brakes', 1318, 270] },
    { a: [1140, 620], b: [1300, 820], w: 26, col: '126,131,138', al: 0.3, at: 2.6, n: 7, lbl: ['tyres and air drag', 1318, 820] },
    { a: [1025, 690], b: [245, 690], w: 22, col: '242,242,238', al: 0.16, at: 3.0, n: 8, regen: true, lbl: ['regenerative braking, ≈ +20%', 635, 945] },
  ];
  for (const f of flows) {
    const rev = E.inOutCubic(prog(t, f.at, f.at + 0.9)); if (rev <= 0) continue;
    const ctrl = f.regen ? [[f.a[0], 930], [f.b[0], 930]] : [[(f.a[0] + f.b[0]) / 2 + 20, f.a[1]], [(f.a[0] + f.b[0]) / 2 - 20, f.b[1]]];
    const P = (u) => bez(f.a, ctrl[0], ctrl[1], f.b, u);
    ctx.save(); ctx.strokeStyle = `rgba(${f.col},${f.al})`; ctx.lineWidth = f.w; ctx.lineCap = 'butt';
    ctx.beginPath(); for (let u = 0; u <= rev + 1e-6; u += 0.01) { const p = P(Math.min(u, rev)); u ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke(); ctx.restore();
    if (rev >= 1) {
      const R = rng(f.n * 13);
      ctx.save(); ctx.fillStyle = `rgb(${f.col})`;
      for (let i = 0; i < f.n * 2; i++) {
        const off = R(), lane = (R() - 0.5) * f.w * 0.75, sz = 1.5 + R() * 2.5, u = (off + t * 0.45) % 1;
        const p = P(u), q = P(Math.min(1, u + 0.01)), nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.9; ctx.beginPath(); ctx.arc(p[0] + nx / nl * lane, p[1] + ny / nl * lane, sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (f.lbl) mtext(ctx, f.lbl[0], f.lbl[1], f.lbl[2], { size: 25, color: C.silver, alpha: E.outCubic(prog(t, f.at + 0.6, f.at + 1.1)), align: f.regen ? 'center' : 'left', italicAll: true });
  }
  for (const nd of nodes) {
    const a = E.outBack(prog(t, nd.at, nd.at + 0.6)); if (a <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(a); ctx.translate(nd.x + nd.w / 2, nd.y + nd.h / 2); ctx.scale(a, a);
    ctx.fillStyle = 'rgba(12,12,13,0.96)'; ctx.strokeStyle = 'rgba(242,242,238,0.75)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.rect(-nd.w / 2, -nd.h / 2, nd.w, nd.h); ctx.fill(); ctx.stroke(); ctx.restore();
    mtext(ctx, nd.label, nd.x + nd.w / 2, nd.y + nd.h / 2 - 20, { size: 34, align: 'center', alpha: clamp(a) });
    mtext(ctx, nd.sub, nd.x + nd.w / 2, nd.y + nd.h / 2 + 26, { size: 27, color: C.silver, align: 'center', alpha: clamp(a) });
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
  return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f) };
}
export const MILESTONES = [0.14, 0.39, 0.64, 0.88];
export const roadU = (t) => E.inOutSine(prog(t, 0.8, 8.2));
export function sRoad(ctx, t, SP) {
  bg(ctx, { gy: 300, glow: 0.06 });
  const r = roadSamples(), n = Math.floor(r.pts.length * E.inOutCubic(prog(t, 0.1, 1.0)));
  const stroke = (w, col, upto, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash); ctx.beginPath(); for (let i = 0; i < upto; i++) i ? ctx.lineTo(r.pts[i][0], r.pts[i][1]) : ctx.moveTo(r.pts[i][0], r.pts[i][1]); ctx.stroke(); ctx.restore(); };
  stroke(76, 'rgba(242,242,238,0.35)', n); stroke(73, '#101012', n);
  stroke(1.5, 'rgba(242,242,238,0.35)', n, [16, 20]);
  const u = roadU(t), cu = Math.floor(u * (r.pts.length - 1));
  ctx.save(); ctx.shadowColor = 'rgba(255,255,255,0.6)'; ctx.shadowBlur = 12; stroke(3, C.ink, cu + 1); ctx.restore();
  MILESTONES.forEach((mu, i) => {
    const p = roadAt(mu), on = u >= mu, a = E.outCubic(prog(t, 0.6 + i * 0.12, 1.2 + i * 0.12));
    circle(ctx, p.x, p.y, 13, { fill: on ? C.ink : '#101012', stroke: on ? C.ink : 'rgba(242,242,238,0.6)', w: 2, alpha: a });
    if (on) { const tp = (u - mu) * 6; circle(ctx, p.x, p.y, 13 + 60 * E.outCubic(clamp(tp)), { w: 1.5, alpha: 1 - clamp(tp) }); }
  });
  const p = roadAt(u), p2 = roadAt(Math.min(1, u + 0.002));
  carTop(ctx, SP, p.x, p.y, Math.atan2(p2.y - p.y, p2.x - p.x), 30, { alpha: E.outCubic(prog(t, 0.5, 1.0)) });
}

// ================= SLIDE: THE ASK (donut) =================
export const FUNDS = [
  { pct: 50, label: 'prototype cars', col: '#F2F2EE' },
  { pct: 25, label: 'arena and tracking', col: '#B9BDC3' },
  { pct: 15, label: 'durability tests', col: '#80858B' },
  { pct: 10, label: 'safety', col: '#4A4D52' },
];
export function sAsk(ctx, t, SP) {
  bg(ctx, { gx: 1340, gy: 200, glow: 0.07 });
  const cx = 1340, cy = 560, R = 225, w = 48;
  ctx.save(); ctx.globalAlpha = E.outCubic(prog(t, 0.6, 1.2)); ctx.strokeStyle = 'rgba(242,242,238,0.07)'; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  let acc = -Math.PI / 2;
  FUNDS.forEach((f, i) => {
    const span = f.pct / 100 * Math.PI * 2, p = E.inOutCubic(prog(t, 1.2 + i * 0.45, 1.8 + i * 0.45));
    if (p > 0) {
      ctx.save(); ctx.strokeStyle = f.col; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, R, acc + 0.01, acc + span * p - 0.01); ctx.stroke(); ctx.restore();
      const mid = acc + span / 2, la = E.outCubic(prog(t, 1.6 + i * 0.45, 2.2 + i * 0.45));
      const ex = cx + Math.cos(mid) * (R + 60), ey = cy + Math.sin(mid) * (R + 60), right = Math.cos(mid) >= 0;
      const lx = right ? Math.max(ex + 40, cx + R + 90) : Math.min(ex - 40, cx - R - 90);
      line(ctx, [[cx + Math.cos(mid) * (R + 32), cy + Math.sin(mid) * (R + 32)], [ex, ey], [lx, ey]], { color: C.silver, w: 1.2, alpha: la });
      mtext(ctx, `${f.pct}%`, lx + (right ? 12 : -12), ey - 20, { size: 48, align: right ? 'left' : 'right', alpha: la });
      mtext(ctx, f.label, lx + (right ? 12 : -12), ey + 22, { size: 25, color: C.silver, align: right ? 'left' : 'right', alpha: la, italicAll: true });
    }
    acc += span;
  });
  mtext(ctx, 'Use of funds', cx, cy, { size: 34, align: 'center', alpha: E.outCubic(prog(t, 1.0, 1.6)), italicAll: true });
}
