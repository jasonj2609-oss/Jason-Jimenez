// Clean physics demos built around renders of the real car, tyre and ball.
// Energy slides show the 50 kg prototype (a 1:2.6 scale KickShift); pure functions of time t.
import { clamp, lerp, prog, E, keys, rng } from './util.js';
import { W, H, C, bg, mtext, arrow, line, circle, hatchFill, ground, dim, axes, plot } from './slides2d.js';

const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const sup = (n) => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
export const PROTO = { m: 50, P: 1000, L: 4, eta: 0.5, mu: 0.9, muk: 0.72, r: 0.15, g: 9.81, C: 0.87, scale: 2.6 };
const CAR_L = 4.53; // full-size length (m)

// ---------- renders of the real car ----------
let scratch = null;
function groundShadow(ctx, cx, gy, halfW, alpha) {
  ctx.save(); ctx.translate(cx, gy); ctx.scale(1, 0.06);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, halfW);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, halfW, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// side view; `px` = screen pixels per metre of the drawn car's own length
export function carSide(ctx, SP, noseX, gy, px, wheelAngle = 0, { alpha = 1, reflect = true } = {}) {
  const s = SP.side, k = px / s.ppm, bw = s.body.width * k, bh = s.body.height * k;
  const wr = (SP.wheel.img.width / SP.wheel.ppm) * px / 2, ox = noseX - s.noseX * k;
  const paint = (g, flip) => {
    g.save(); g.globalAlpha = alpha; g.translate(0, gy); if (flip) g.scale(1, -1);
    const oy = -s.groundY * k;
    g.drawImage(s.body, ox, oy, bw, bh);
    for (const w of s.wheels) { g.save(); g.translate(ox + w.x * k, oy + w.y * k); g.rotate(wheelAngle); g.drawImage(SP.wheel.img, -wr, -wr, wr * 2, wr * 2); g.restore(); }
    g.restore();
  };
  if (reflect) {
    if (!scratch) { scratch = document.createElement('canvas'); scratch.width = W; scratch.height = H; }
    const g = scratch.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    paint(g, true);
    g.globalCompositeOperation = 'destination-in';
    const m = g.createLinearGradient(0, gy, 0, gy + 0.45 * bh); m.addColorStop(0, 'rgba(0,0,0,0.2)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(scratch, 0, 0);
  }
  groundShadow(ctx, ox + (s.noseX + s.tailX) / 2 * k, gy, (s.noseX - s.tailX) * k * 0.6, 0.9 * alpha);
  paint(ctx, false);
  return { ox, k, top: gy - 1.24 * px * (CAR_L / CAR_L), centerX: noseX - (CAR_L / 2) * px };
}
export function carTop(ctx, SP, cx, cy, heading, px, { alpha = 1, black = false } = {}) {
  const s = SP.top, img = black ? s.black : s.img, k = px / s.ppm, w = img.width * k, h = img.height * k;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(heading); ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 3;
  ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
}
export function ballAt(ctx, SP, x, y, r, rot = 0, alpha = 1) {
  const b = SP.ball, k = r / (b.r * b.ppm), s = b.img.width * k;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.drawImage(b.img, -s / 2, -s / 2, s, s); ctx.restore();
}
function protoTag(ctx, x, y, alpha) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(242,242,238,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x, y - 18, 268, 36); ctx.restore();
  mtext(ctx, 'prototype · 1:2.6 scale · 50 kg', x + 134, y, { size: 19, color: C.silver, align: 'center', alpha, italicAll: true });
}
// conductor seen end-on: dot = current out of the page, cross = into the page
function cond(ctx, x, y, r, out, alpha = 1) {
  circle(ctx, x, y, r, { fill: '#0b0b0c', w: 1.3, alpha });
  if (out) circle(ctx, x, y, r * 0.3, { fill: C.ink, stroke: null, alpha });
  else { line(ctx, [[x - r * 0.55, y - r * 0.55], [x + r * 0.55, y + r * 0.55]], { w: 1.2, alpha }); line(ctx, [[x - r * 0.55, y + r * 0.55], [x + r * 0.55, y - r * 0.55]], { w: 1.2, alpha }); }
}
function slab(ctx, x0, x1, gy, h, alpha) {
  const p = new Path2D(); p.rect(x0, gy + 4, x1 - x0, h);
  ctx.save(); ctx.globalAlpha = alpha; const g = ctx.createLinearGradient(0, gy, 0, gy + h); g.addColorStop(0, '#16171a'); g.addColorStop(1, '#0a0a0b');
  ctx.fillStyle = g; ctx.fill(p); ctx.strokeStyle = 'rgba(242,242,238,0.5)'; ctx.lineWidth = 1.2; ctx.stroke(p); ctx.restore();
  line(ctx, [[x0, gy], [x1, gy]], { w: 3, alpha });
}
function floorLine(ctx, x0, x1, gy, alpha) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, 'rgba(242,242,238,0)'); g.addColorStop(0.1, 'rgba(242,242,238,0.55)'); g.addColorStop(0.9, 'rgba(242,242,238,0.55)'); g.addColorStop(1, 'rgba(242,242,238,0)');
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x0, gy, x1 - x0, 1.5); ctx.restore();
}

// ================= THE PITCH: one sport, three parts =================
export function sPitch(ctx, t, SP) {
  bg(ctx, { gy: 200, glow: 0.07 });
  const cols = [380, 960, 1540], vy0 = 360, vy1 = 640;
  const a = (i) => E.outCubic(prog(t, 0.8 + i * 0.9, 1.6 + i * 0.9));
  // 1 · the car
  const a0 = a(0);
  if (a0 > 0) {
    const px = 92, nose = cols[0] + 208 + (1 - a0) * 60;
    floorLine(ctx, cols[0] - 250, cols[0] + 250, 600, a0);
    carSide(ctx, SP, nose, 600, px, 0, { alpha: a0 });
  }
  // 2 · the arena (perspective floor with a charging lane)
  const a1 = a(1);
  if (a1 > 0) {
    const cx = cols[1], Pp = (u, v) => [cx + u * lerp(240, 140, v), lerp(620, 390, v)];
    const quad = (u0, u1, v0, v1) => { const p = new Path2D(); const q = [Pp(u0, v0), Pp(u1, v0), Pp(u1, v1), Pp(u0, v1)]; p.moveTo(...q[0]); q.slice(1).forEach(z => p.lineTo(...z)); p.closePath(); return p; };
    ctx.save(); ctx.globalAlpha = a1;
    const fl = quad(-1, 1, 0, 1); const g = ctx.createLinearGradient(0, 390, 0, 620); g.addColorStop(0, '#0d0d0f'); g.addColorStop(1, '#1b1c1f'); ctx.fillStyle = g; ctx.fill(fl);
    ctx.strokeStyle = 'rgba(242,242,238,0.6)'; ctx.lineWidth = 1.4; ctx.stroke(fl);
    ctx.strokeStyle = 'rgba(242,242,238,0.08)'; ctx.lineWidth = 1;
    for (let u = -0.75; u <= 0.76; u += 0.25) { ctx.beginPath(); ctx.moveTo(...Pp(u, 0)); ctx.lineTo(...Pp(u, 1)); ctx.stroke(); }
    for (let v = 0.2; v < 1; v += 0.2) { ctx.beginPath(); ctx.moveTo(...Pp(-1, v)); ctx.lineTo(...Pp(1, v)); ctx.stroke(); }
    const pulse = 0.55 + 0.45 * Math.sin(t * 3);
    for (let k = 0; k < 6; k++) {
      const v0 = 0.1 + k * 0.14, cell = quad(-0.16, 0.16, v0, v0 + 0.1);
      ctx.fillStyle = `rgba(242,242,238,${0.08 + 0.12 * pulse})`; ctx.fill(cell); ctx.strokeStyle = 'rgba(242,242,238,0.85)'; ctx.stroke(cell);
    }
    ctx.restore();
    for (const [u, v] of [[-1, 1], [1, 1]]) { const [x, y] = Pp(u, v); circle(ctx, x, y - 14, 7, { fill: '#050505', w: 1.4, alpha: a1 }); line(ctx, [[x, y - 14], Pp(0, 0.5)], { w: 0.8, alpha: 0.25 * a1 }); }
    mtext(ctx, 'charging lane', cx, 650, { size: 19, color: C.silver, align: 'center', alpha: a1, italicAll: true });
  }
  // 3 · the game (top view: grab energy, then race for the ball)
  const a2 = a(2);
  if (a2 > 0) {
    const cx = cols[2], fx0 = cx - 230, fx1 = cx + 230, fy0 = 400, fy1 = 620;
    ctx.save(); ctx.globalAlpha = a2; ctx.fillStyle = '#121315'; ctx.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    ctx.strokeStyle = 'rgba(242,242,238,0.6)'; ctx.lineWidth = 1.4; ctx.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    ctx.beginPath(); ctx.moveTo(cx, fy0); ctx.lineTo(cx, fy1); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, (fy0 + fy1) / 2, 34, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(fx0 - 14, 470, 14, 80); ctx.strokeRect(fx1, 470, 14, 80);
    ctx.fillStyle = 'rgba(242,242,238,0.16)'; ctx.fillRect(cx - 150, fy1 - 46, 110, 30); ctx.strokeStyle = 'rgba(242,242,238,0.85)'; ctx.strokeRect(cx - 150, fy1 - 46, 110, 30);
    ctx.restore();
    const lt = ((t - 2.6) % 6 + 6) % 6, u = clamp(lt / 4.2);
    const path = (q) => [lerp(cx - 210, cx + 150, q), fy1 - 31 - 120 * Math.max(0, q - 0.45) / 0.55 * (q > 0.45 ? 1 : 0)];
    const p1 = path(E.inOutSine(u)), p2 = path(Math.min(1, E.inOutSine(u) + 0.01));
    const ball = [cx + 175, (fy0 + fy1) / 2 - 20];
    ballAt(ctx, SP, ball[0], ball[1], 11, t);
    carTop(ctx, SP, p1[0], p1[1], Math.atan2(p2[1] - p1[1], p2[0] - p1[0]), 13, { alpha: a2 });
    carTop(ctx, SP, cx + 200 - 60 * E.inOutSine(clamp(lt / 5)), fy0 + 40, Math.PI * 0.85, 13, { alpha: a2, black: true });
    const en = clamp((p1[0] - (cx - 150)) / 110);
    ctx.save(); ctx.globalAlpha = a2; ctx.strokeStyle = 'rgba(242,242,238,0.6)'; ctx.strokeRect(fx0, fy1 + 18, 140, 10); ctx.fillStyle = C.ink; ctx.fillRect(fx0, fy1 + 18, 140 * en, 10); ctx.restore();
    mtext(ctx, 'stored energy', fx0 + 150, fy1 + 23, { size: 18, color: C.silver, alpha: a2, italicAll: true });
  }
  const labels = [['1', 'The car', 'collects, stores and spends energy'], ['2', 'The arena', 'charging lanes, cameras, referee'], ['3', 'The game', 'energy becomes a tactic']];
  labels.forEach(([n, h, s], i) => {
    const al = a(i);
    mtext(ctx, n, cols[i], 715, { size: 26, color: C.silver, align: 'center', alpha: al, italicAll: true });
    mtext(ctx, h, cols[i], 762, { size: 46, align: 'center', alpha: al });
    mtext(ctx, s, cols[i], 812, { size: 24, color: C.silver, align: 'center', alpha: al, italicAll: true });
  });
}

// ================= §2 WIRELESS CHARGING: Faraday's law =================
export function sLane(ctx, t, SP) {
  bg(ctx, { gx: 600 });
  const { P, scale } = PROTO;
  const gy = 690, ppm = 190, px = ppm / scale * (CAR_L / CAR_L), lx0 = 220, lx1 = lx0 + 4 * ppm, slow = 0.3, vx = 4 * ppm * slow, f = 1.4;
  const carLen = CAR_L / scale * ppm, half = carLen / 2;
  const ph = Math.sin(2 * Math.PI * f * t), ga = E.outCubic(prog(t, 0.2, 0.9));
  const nose = -40 + (t - 0.5) * vx, xc = nose - half, frac = clamp((xc - lx0) / (lx1 - lx0)), over = xc > lx0 && xc < lx1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1180, H); ctx.clip();
  floorLine(ctx, 40, 1180, gy, ga);
  slab(ctx, lx0, lx1, gy, 62, ga);
  for (let k = 0; k < 6; k++) { const cx = lx0 + 63 + k * 127, pol = (ph >= 0) !== (k % 2 === 1); cond(ctx, cx - 28, gy + 36, 11, pol, ga); cond(ctx, cx + 28, gy + 36, 11, !pol, ga); }
  mtext(ctx, 'coils under the floor carry alternating current', (lx0 + lx1) / 2, gy + 100, { size: 22, color: C.silver, align: 'center', alpha: ga, italicAll: true });
  const fa = E.outCubic(prog(t, 0.9, 1.5));
  for (let x = lx0 + 20; x <= lx1 - 20; x += 38) for (const [row, dy] of [[0, 22], [1, 62], [2, 102]]) {
    const b = ph * Math.exp(-row * 0.45), L = 30 * b;
    if (Math.abs(L) > 3) arrow(ctx, x, gy - dy + L / 2, x, gy - dy - L / 2, { w: 1.3, head: 8, alpha: fa * 0.7 });
  }
  mtext(ctx, '*B*', lx0 - 46, gy - 62, { size: 30, alpha: fa });
  const ca = E.outCubic(prog(t, 0.5, 0.9)) * (1 - prog(nose, 1020, 1180));
  if (ca > 0) {
    carSide(ctx, SP, nose, gy, px, (nose / ppm) / 0.36 * scale, { alpha: ca });
    const cy = gy - 0.06 * ppm;
    ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = over ? C.ink : '#3a3c40'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = over ? 18 : 0;
    ctx.fillRect(xc - 40, cy - 3, 80, 6); ctx.restore();
    const la = ca * (1 - sstep(lx0 - 140, lx0 - 20, xc));
    line(ctx, [[xc, cy + 4], [xc, gy + 132]], { w: 1, color: C.silver, alpha: la * 0.7 });
    mtext(ctx, 'receiver coil', xc, gy + 150, { size: 21, align: 'center', alpha: la, italicAll: true });
    if (frac > 0) mtext(ctx, `*E* = ${Math.round(P * frac)} J`, xc, gy - carLen * 0.34 - 34, { size: 30, align: 'center', alpha: ca });
  }
  ctx.restore();
  protoTag(ctx, 120, 330, ga);
  // induced voltage
  const pa = E.outCubic(prog(t, 0.5, 1.3)), tmax = 8;
  const X0 = 1280, X1 = 1800, Y0 = 700, Y1 = 400, X = (s) => X0 + (s / tmax) * (X1 - X0), Y = (v) => Y0 - ((v + 1.25) / 2.5) * (Y0 - Y1);
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [0, 2, 4, 6, 8], yt: [-1, 0, 1], X, Y, alpha: pa, xl: 'time *t* (s)', yfmt: v => (v < 0 ? '−1' : String(v)), zero: true });
  mtext(ctx, 'induced voltage *ε* (a.u.)', X0, Y1 - 24, { size: 23, alpha: pa });
  const tIn = 0.5 + (lx0 + half + 40) / vx, tOut = tIn + (lx1 - lx0) / vx, tau = clamp(t, 0, tmax);
  const sh = new Path2D(); sh.rect(X(tIn), Y1, X(Math.min(tau, tOut)) - X(tIn), Y0 - Y1);
  if (tau > tIn) { ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.06)'; ctx.fill(sh); ctx.restore(); mtext(ctx, 'over the lane', X((tIn + tOut) / 2), Y1 + 22, { size: 19, color: C.silver, align: 'center', alpha: pa, italicAll: true }); }
  const env = (s) => sstep(tIn - 0.15, tIn + 0.15, s) * (1 - sstep(tOut - 0.15, tOut + 0.15, s));
  if (tau > 0.5) plot(ctx, (s) => -env(s) * Math.cos(2 * Math.PI * f * s), 0.5, tau, X, Y, { step: 0.005, w: 2 });
}

// ================= §3 ENERGY STORAGE =================
export function sStore(ctx, t) {
  bg(ctx, { gx: 500 });
  const X0 = 220, X1 = 900, Y0 = 860, Y1 = 330;
  const XE = (e) => X0 + ((Math.log10(e) + 1) / 4) * (X1 - X0), YP = (p) => Y0 - ((Math.log10(p) - 1) / 4) * (Y0 - Y1);
  const pa = E.outCubic(prog(t, 0.3, 1.1));
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [0.1, 1, 10, 100, 1000], yt: [10, 100, 1e3, 1e4, 1e5], X: XE, Y: YP, alpha: pa, xl: 'energy per kilogram (Wh/kg)', yl: 'power per kilogram (W/kg)', yfmt: (v) => '10' + sup(Math.round(Math.log10(v))) });
  const blob = (ce, cp, rx, ry, rot, a, hatch, name, role, lx, ly) => {
    if (a <= 0) return;
    const p = new Path2D(); p.ellipse(XE(ce), YP(cp), rx * (X1 - X0) / 4 * E.outCubic(a), ry * (Y0 - Y1) / 4 * E.outCubic(a), rot, 0, Math.PI * 2);
    if (hatch) hatchFill(ctx, p, C.ink, 0.5 * a, 8); else { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(242,242,238,0.22)'; ctx.fill(p); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke(p); ctx.restore();
    mtext(ctx, name, lx, ly, { size: 27, align: 'center', alpha: a }); mtext(ctx, role, lx, ly + 32, { size: 23, color: C.silver, align: 'center', alpha: a, italicAll: true });
  };
  blob(150, 700, 0.3, 0.55, -0.35, prog(t, 1.2, 2.0), true, 'battery', 'endurance', XE(150), YP(700) + 140);
  blob(5, 7000, 0.45, 0.45, -0.3, prog(t, 2.0, 2.8), false, 'supercapacitor', 'sprint', XE(5), YP(7000) - 118);

  // ---- supercapacitor cell and its charge ----
  const sa = E.outCubic(prog(t, 0.8, 1.6));
  const Es = (s) => 1000 * (s < 3 ? 0 : s < 5 ? E.inOutSine((s - 3) / 2) : s < 6.2 ? 1 : s < 7.0 ? 1 - E.inOutSine((s - 6.2) / 0.8) : 0);
  const e = Es(t), V = Math.sqrt(2 * e / PROTO.C);
  const cx = 1290, top = 400, hgt = 380, wd = 170;
  ctx.save(); ctx.globalAlpha = sa;
  const body = ctx.createLinearGradient(cx - wd / 2, 0, cx + wd / 2, 0);
  body.addColorStop(0, '#2a2c30'); body.addColorStop(0.28, '#c9ccd1'); body.addColorStop(0.42, '#eef0f2'); body.addColorStop(0.7, '#6b6e74'); body.addColorStop(1, '#1d1e21');
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(cx - wd / 2, top); ctx.lineTo(cx - wd / 2, top + hgt); ctx.ellipse(cx, top + hgt, wd / 2, 18, 0, Math.PI, 0, true); ctx.lineTo(cx + wd / 2, top); ctx.closePath(); ctx.fill();
  const cap = ctx.createLinearGradient(cx - wd / 2, 0, cx + wd / 2, 0); cap.addColorStop(0, '#3a3c40'); cap.addColorStop(0.5, '#8f9298'); cap.addColorStop(1, '#2a2c30');
  ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(cx, top, wd / 2, 18, 0, 0, Math.PI * 2); ctx.fill();
  for (const dx of [-36, 36]) { ctx.fillStyle = '#b9bdc3'; ctx.fillRect(cx + dx - 9, top - 26, 18, 22); ctx.beginPath(); ctx.ellipse(cx + dx, top - 26, 9, 4, 0, 0, Math.PI * 2); ctx.fillStyle = '#e6e8ea'; ctx.fill(); }
  ctx.fillStyle = 'rgba(10,10,12,0.82)'; ctx.fillRect(cx - wd / 2, top + 150, wd, 92);
  ctx.restore();
  mtext(ctx, '0.87 F', cx, top + 180, { size: 26, align: 'center', alpha: sa });
  mtext(ctx, '48 V max', cx, top + 214, { size: 21, color: C.silver, align: 'center', alpha: sa });
  // energy gauge
  const gx = 1530, g0 = 780, g1 = 400, G = (j) => g0 - (j / 1000) * (g0 - g1);
  ctx.save(); ctx.globalAlpha = sa; ctx.strokeStyle = 'rgba(242,242,238,0.7)'; ctx.lineWidth = 1.4; ctx.strokeRect(gx, g1, 44, g0 - g1);
  ctx.fillStyle = 'rgba(242,242,238,0.9)'; ctx.shadowColor = '#fff'; ctx.shadowBlur = e > 0 ? 14 : 0; ctx.fillRect(gx + 4, G(e), 36, g0 - G(e)); ctx.restore();
  for (const j of [0, 500, 1000]) { line(ctx, [[gx + 44, G(j)], [gx + 56, G(j)]], { w: 1.2, alpha: sa }); mtext(ctx, `${j} J`, gx + 64, G(j), { size: 21, color: C.silver, alpha: sa }); }
  mtext(ctx, `*E* = ${Math.round(e)} J`, gx + 22, g0 + 44, { size: 26, align: 'center', alpha: sa });
  mtext(ctx, `*V* = ${V.toFixed(1)} V`, gx + 22, g0 + 80, { size: 23, color: C.silver, align: 'center', alpha: sa });
  const st = t >= 3 && t < 5 ? 'charging on the lane' : t >= 6.2 && t < 7 ? 'boost: emptying fast' : t >= 5 && t < 6.2 ? 'stored, ready to spend' : '';
  mtext(ctx, st, 1410, 350, { size: 24, align: 'center', alpha: sa * (st ? 1 : 0), italicAll: true });
}

// ================= §4 THE BOOST: real tyre, Newton's third law, grip limit =================
export function sBoost(ctx, t, SP) {
  bg(ctx, { gx: 500 });
  const { m, mu, muk, r, g } = PROTO, N = m * g, Fg = mu * N, Fk = muk * N, tauLim = Fg * r;
  const tauAt = (s) => tauLim * keys(s, [[0, 0], [1.2, 0], [4.2, 0.95], [5.8, 1.45], [7.6, 1.45], [8.4, 0.9]]);
  let x = 0, v = 1.5, spin = 0, slip = false;
  for (let s = 0; s < t; s += 0.02) { const q = tauAt(s); slip = q > tauLim; const F = slip ? Fk : q / r; v += F / m * 0.02 * 0.2; x += v * 0.02; if (slip) spin += (q - Fk * r) * 0.12 * 0.02; }
  const tq = tauAt(t), F = slip ? Fk : tq / r;
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  // close-up of the real front wheel: the car render scaled so the tyre radius is 190 px
  const Rpx = 190, px = Rpx / 0.36, s = SP.side, k = px / s.ppm, fw = s.wheels.reduce((a, b) => (a.x > b.x ? a : b));
  const wcx = 470, gy = 820, wcy = gy - Rpx, nose = wcx + (s.noseX - fw.x) * k;
  ctx.save(); ctx.beginPath(); ctx.rect(60, 300, 1000, 640); ctx.clip();
  // moving floor texture
  floorLine(ctx, 60, 1060, gy, ga);
  ctx.save(); ctx.globalAlpha = ga * 0.3; ctx.strokeStyle = C.ink; ctx.lineWidth = 1; const off = (x * 260) % 40;
  for (let xx = 60 - off; xx < 1060; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, gy + 3); ctx.lineTo(xx + 18, gy + 3); ctx.stroke(); }
  ctx.restore();
  ctx.save(); ctx.globalAlpha = ga;
  const bw = s.body.width * k, bh = s.body.height * k, ox = nose - s.noseX * k, oy = gy - s.groundY * k;
  ctx.drawImage(s.body, ox, oy, bw, bh);
  const wr = (SP.wheel.img.width / SP.wheel.ppm) * px / 2;
  ctx.translate(wcx, wcy); ctx.rotate(x / 0.36 * 0.6 + spin); ctx.drawImage(SP.wheel.img, -wr, -wr, wr * 2, wr * 2);
  ctx.restore();
  // edge fade so the crop reads as a lens close-up
  const fade = ctx.createLinearGradient(760, 0, 1060, 0); fade.addColorStop(0, 'rgba(5,5,5,0)'); fade.addColorStop(1, 'rgba(5,5,5,1)');
  ctx.fillStyle = fade; ctx.fillRect(760, 300, 300, 640);
  const fadeT = ctx.createLinearGradient(0, 300, 0, 470); fadeT.addColorStop(0, 'rgba(5,5,5,1)'); fadeT.addColorStop(1, 'rgba(5,5,5,0)');
  ctx.fillStyle = fadeT; ctx.fillRect(60, 300, 1000, 170);
  ctx.restore();
  // torque and the third-law pair at the contact patch (0.32 px per newton)
  const fa = E.outCubic(prog(t, 1.4, 2.0)), sc = 0.32;
  if (tq > 1) {
    ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(wcx, wcy, 70, -2.7, -0.95); ctx.stroke(); ctx.restore();
    arrow(ctx, wcx + Math.cos(-1.1) * 70, wcy + Math.sin(-1.1) * 70, wcx + Math.cos(-0.88) * 70, wcy + Math.sin(-0.88) * 70, { w: 2.6, head: 18, alpha: fa });
    mtext(ctx, '*τ*', wcx - 40, wcy - 96, { size: 36, alpha: fa });
  }
  arrow(ctx, wcx, gy - 6, wcx + F * sc, gy - 6, { w: 3.4, head: 20, alpha: fa });
  arrow(ctx, wcx, gy + 18, wcx - F * sc, gy + 18, { w: 3.4, head: 20, color: C.silver, alpha: fa });
  mtext(ctx, 'floor pushes car forward', wcx + Math.max(F * sc, 60) + 18, gy - 8, { size: 24, alpha: fa * (F > 30 ? 1 : 0), italicAll: true });
  mtext(ctx, 'tyre pushes floor back', wcx - Math.max(F * sc, 60) - 18, gy + 20, { size: 24, color: C.silver, align: 'right', alpha: fa * (F > 30 ? 1 : 0), italicAll: true });
  if (slip) for (let j = 0; j < 6; j++) line(ctx, [[wcx - 40 - j * 30, gy + 1], [wcx - 60 - j * 30, gy + 1]], { w: 2.2, color: C.ink, alpha: (0.6 + 0.4 * Math.sin(t * 22)) * (1 - j / 7) });
  mtext(ctx, `*τ* = ${tq.toFixed(0)} N·m     *F* = ${F.toFixed(0)} N     ${slip ? 'wheel slipping' : 'tyre gripping'}`, 120, 900, { size: 26, alpha: fa });
  protoTag(ctx, 1250, 320, ga);
  // ---- force vs torque ----
  const pa = E.outCubic(prog(t, 0.5, 1.3));
  const A = { x0: 1250, x1: 1800, y0: 760, y1: 400 }, XA = (q) => A.x0 + q / 100 * (A.x1 - A.x0), YA = (f) => A.y0 - f / 500 * (A.y0 - A.y1);
  axes(ctx, { ...A, xt: [0, 25, 50, 75, 100], yt: [0, 250, 500], X: XA, Y: YA, alpha: pa, xl: 'motor torque *τ* (N·m)', xfmt: String });
  mtext(ctx, 'forward force *F* (N)', A.x0, A.y1 - 24, { size: 23, alpha: pa });
  line(ctx, [[XA(0), YA(0)], [XA(tauLim), YA(Fg)]], { w: 2.6, alpha: pa });
  line(ctx, [[XA(tauLim), YA(Fg)], [XA(tauLim), YA(Fk)], [XA(100), YA(Fk)]], { w: 2.4, dash: [9, 6], color: C.silver, alpha: pa });
  line(ctx, [[XA(0), YA(Fg)], [XA(100), YA(Fg)]], { w: 1, dash: [3, 5], color: C.mid, alpha: pa });
  mtext(ctx, `grip limit *μmg* = ${Fg.toFixed(0)} N`, XA(4), YA(Fg) - 22, { size: 21, color: C.silver, alpha: pa });
  mtext(ctx, 'slip', XA(84), YA(Fk) + 24, { size: 21, color: C.silver, align: 'center', alpha: pa, italicAll: true });
  if (t > 1.2) circle(ctx, XA(Math.min(tq, 100)), YA(F), 9, { fill: C.ink, stroke: null, alpha: pa });
}

// ================= §5 ONE LANE PASS =================
export function sPass(ctx, t, SP) {
  bg(ctx, { gx: 600 });
  const { m, P, eta, scale } = PROTO;
  const gy = 620, ppm = 120, px = ppm / scale, lx0 = 120, lx1 = lx0 + 4 * ppm, slow = 0.4, t0 = 0.6;
  const carLen = CAR_L / scale * ppm, half = carLen / 2;
  const tIn = t0 + (lx0 + half + 30) / (4 * ppm * slow), tOut = tIn + (lx1 - lx0) / (4 * ppm * slow), tB = tOut + 0.4, tBe = tB + 1.0;
  const vAt = (s) => 4 + 2 * sstep(tB, tBe, s);
  let nose = -30; for (let s = t0; s < t; s += 0.01) nose += vAt(s) * ppm * slow * 0.01;
  if (t < t0) nose = -30 - (t0 - t) * 4 * ppm * slow;
  const v = vAt(t), xc = nose - half, frac = clamp((xc - lx0) / (lx1 - lx0)), Ec = P * frac;
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1180, H); ctx.clip();
  floorLine(ctx, 40, 1180, gy, ga); slab(ctx, lx0, lx1, gy, 30, ga);
  mtext(ctx, 'charging lane, 4 m', (lx0 + lx1) / 2, gy + 58, { size: 21, color: C.silver, align: 'center', alpha: ga, italicAll: true });
  if (t > tB && t < tBe + 0.6) for (let j = 0; j < 6; j++) line(ctx, [[nose - carLen - 10 - j * 26, gy - 30 + j * 6], [nose - carLen - 50 - j * 26, gy - 30 + j * 6]], { w: 1.4, color: C.silver, alpha: 0.7 * (1 - prog(t, tBe, tBe + 0.6)) });
  carSide(ctx, SP, nose, gy, px, (nose / ppm) / 0.36 * scale);
  const la = E.outCubic(prog(t, 1.0, 1.4)), ty = gy - carLen * 0.34 - 40;
  mtext(ctx, `*v* = ${v.toFixed(1)} m/s`, xc, ty - 34, { size: 26, align: 'center', alpha: la });
  if (frac > 0) mtext(ctx, t < tB ? `*E* = ${Math.round(Ec)} J` : 'boost', xc, ty, { size: 26, align: 'center', alpha: la, italicAll: t >= tB });
  ctx.restore();
  protoTag(ctx, 120, 330, ga);
  // ledger: collected vs needed
  const bx = 600, sc = 0.5;
  const rows = [
    { y: 790, label: 'collected on the lane', val: Ec, a: prog(t, tIn, tIn + 0.2), fill: 'rgba(242,242,238,0.9)' },
    { y: 850, label: 'needed for 4 → 6 m/s', val: 500 * E.outCubic(prog(t, tBe, tBe + 0.6)), a: prog(t, tB + 0.6, tB + 0.8), fill: 'rgba(185,189,195,0.75)' },
  ];
  rows.forEach((rw) => {
    if (rw.a <= 0) return;
    mtext(ctx, rw.label, 120, rw.y, { size: 25, alpha: rw.a });
    ctx.save(); ctx.globalAlpha = rw.a; ctx.fillStyle = rw.fill; ctx.fillRect(bx, rw.y - 15, Math.max(1, rw.val * sc), 30); ctx.restore();
    mtext(ctx, `${Math.round(rw.val)} J`, bx + rw.val * sc + 14, rw.y, { size: 24, alpha: rw.a });
  });
  mtext(ctx, 'half survives storage and drivetrain losses, and that is enough', 120, 910, { size: 23, color: C.silver, alpha: E.outCubic(prog(t, tBe + 0.6, tBe + 1.2)), italicAll: true });
  // speed vs time
  const pa = E.outCubic(prog(t, 0.5, 1.3)), tm = 8;
  const A = { x0: 1280, x1: 1800, y0: 760, y1: 400 }, X = (s) => A.x0 + (s / tm) * (A.x1 - A.x0), Y = (q) => A.y0 - q / 8 * (A.y0 - A.y1);
  axes(ctx, { ...A, xt: [0, 2, 4, 6, 8], yt: [0, 2, 4, 6, 8], X, Y, alpha: pa, xl: 'time *t* (s)', xfmt: String });
  mtext(ctx, 'speed *v* (m/s)', A.x0, A.y1 - 24, { size: 23, alpha: pa });
  const sh = (a, b, lab) => { if (t < a) return; const p = new Path2D(); p.rect(X(a), A.y1, X(Math.min(t, b)) - X(a), A.y0 - A.y1); ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.06)'; ctx.fill(p); ctx.restore(); mtext(ctx, lab, X((a + b) / 2), A.y1 + 22, { size: 19, color: C.silver, align: 'center', alpha: pa, italicAll: true }); };
  sh(tIn, tOut, 'lane'); sh(tB, tBe, 'boost');
  if (t > t0) plot(ctx, vAt, t0, Math.min(t, tm), X, Y, { step: 0.01, w: 2.6 });
}

// ================= §6 ENERGY IS A TACTIC (top view) =================
export function sTactic(ctx, t, SP) {
  bg(ctx, { gx: 600 });
  const { P, L, scale } = PROTO;
  const ppm = 64, lx0 = 380, lx1 = lx0 + L * ppm, slow = 0.5, ts = 1.6, px = ppm / scale;
  const lanes = [{ v: 2, y: 440 }, { v: 4, y: 610 }, { v: 8, y: 780 }];
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1130, H); ctx.clip();
  lanes.forEach((ln) => {
    line(ctx, [[60, ln.y - 48], [1130, ln.y - 48]], { w: 1, color: 'rgba(242,242,238,0.25)', alpha: ga });
    line(ctx, [[60, ln.y + 48], [1130, ln.y + 48]], { w: 1, color: 'rgba(242,242,238,0.25)', alpha: ga });
    const pad = new Path2D(); pad.rect(lx0, ln.y - 40, lx1 - lx0, 80);
    ctx.save(); ctx.globalAlpha = ga; ctx.fillStyle = 'rgba(242,242,238,0.07)'; ctx.fill(pad); ctx.strokeStyle = 'rgba(242,242,238,0.75)'; ctx.lineWidth = 1.2; ctx.stroke(pad);
    ctx.strokeStyle = 'rgba(242,242,238,0.16)'; for (let x = lx0 + 16; x < lx1; x += 16) { ctx.beginPath(); ctx.moveTo(x, ln.y - 40); ctx.lineTo(x, ln.y + 40); ctx.stroke(); }
    ctx.restore();
    const vx = ln.v * ppm * slow, xc = lx0 + (t - ts) * vx, frac = clamp((xc - lx0) / (lx1 - lx0)), Ec = P * L / ln.v * frac, dur = L / ln.v;
    if (xc > -60) carTop(ctx, SP, xc, ln.y, 0, px);
    mtext(ctx, `${ln.v} m/s`, 80, ln.y - 14, { size: 28, alpha: ga });
    if (frac > 0) mtext(ctx, `${Math.round(Ec).toLocaleString('en-US')} J` + (frac >= 1 ? `  in ${dur.toFixed(1)} s` : ''), 80, ln.y + 20, { size: 22, color: C.silver, alpha: 1, italicAll: true });
  });
  ctx.restore();
  mtext(ctx, 'charging lane', (lx0 + lx1) / 2, 360, { size: 21, color: C.silver, align: 'center', alpha: ga, italicAll: true });
  const pa = E.outCubic(prog(t, 0.5, 1.3));
  const A = { x0: 1260, x1: 1800, y0: 760, y1: 400 }, XA = (q) => A.x0 + q / 10 * (A.x1 - A.x0), YA = (e) => A.y0 - Math.min(e, 4000) / 4000 * (A.y0 - A.y1);
  axes(ctx, { ...A, xt: [0, 2, 4, 6, 8, 10], yt: [0, 1000, 2000, 3000, 4000], X: XA, Y: YA, alpha: pa, xl: 'crossing speed *v* (m/s)', xfmt: String, yfmt: (q) => q.toLocaleString('en-US') });
  mtext(ctx, 'energy collected (J)', A.x0, A.y1 - 24, { size: 23, alpha: pa });
  plot(ctx, (q) => P * L / q, 1, 10, XA, YA, { step: 0.05, w: 2.6, alpha: pa });
  lanes.forEach((ln) => {
    const done = ts + (L / ln.v) / slow, a = E.outCubic(prog(t, done, done + 0.4)); if (a <= 0) return;
    circle(ctx, XA(ln.v), YA(P * L / ln.v), 8, { fill: C.ink, stroke: null, alpha: a });
    mtext(ctx, `${ln.v} m/s`, XA(ln.v) + 14, YA(P * L / ln.v) - 20, { size: 21, alpha: a });
  });
}

// ================= §7 HITBOXES (2D overlay on the 3D scene) =================
export function sHitboxOverlay(ctx, t, SP, st) {
  ctx.clearRect(0, 0, W, H);
  if (!st || !st.contact) return;
  const names = ['Wedge', 'Balanced', 'Wall'], blurbs = ['low front edge: chips the ball up', 'mid front edge: rising shot', 'flat front face: straight drive'];
  const ga = E.outCubic(prog(t, 0.8, 1.6)), r = 0.75, hc = Math.min(st.hf, r);
  names.forEach((n, i) => {
    const on = i === st.i, x = 120 + i * 230;
    mtext(ctx, n, x, 880, { size: 34, color: on ? C.ink : 'rgba(242,242,238,0.32)', alpha: ga });
    if (on) line(ctx, [[x, 906], [x + n.length * 16.5, 906]], { w: 2, alpha: ga });
  });
  mtext(ctx, blurbs[st.i], 120, 950, { size: 25, color: C.silver, alpha: ga, italicAll: true });
  const { contact: P, center: B, foot: F } = st;
  const th = Math.asin(clamp((r - hc) / r, 0, 1)), Lr = 250;
  line(ctx, [[P.x, P.y], [B.x, B.y]], { color: C.ink, w: 1.4, dash: [4, 5], alpha: ga });
  arrow(ctx, B.x, B.y, B.x + Math.cos(th) * Lr, B.y - Math.sin(th) * Lr, { w: 2.8, head: 20, alpha: ga });
  line(ctx, [[B.x, B.y], [B.x + Lr * 0.85, B.y]], { color: C.mid, w: 1.1, dash: [4, 6], alpha: ga });
  if (th > 0.02) { ctx.save(); ctx.globalAlpha = ga; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(B.x, B.y, 200, -th, 0); ctx.stroke(); ctx.restore(); }
  mtext(ctx, `*θ* = ${Math.round(th * 180 / Math.PI)}°`, B.x + Math.cos(th) * Lr + 18, B.y - Math.sin(th) * Lr, { size: 32, alpha: ga });
  circle(ctx, P.x, P.y, 6, { fill: C.ink, stroke: null, alpha: ga });
  const dx = F.x - 28;
  if (P.y < F.y - 14) { arrow(ctx, dx, (F.y + P.y) / 2, dx, F.y, { w: 1.2, head: 10, alpha: ga }); arrow(ctx, dx, (F.y + P.y) / 2, dx, P.y, { w: 1.2, head: 10, alpha: ga }); }
  mtext(ctx, st.hf >= r ? '*h* ≥ *r*  (face covers the centre)' : `*h* = ${st.hf.toFixed(2)} m`, dx, F.y + 36, { size: 26, align: 'center', alpha: ga });
}

// ================= §8 COST: power over a match =================
let trace = null;
function powerTrace() {
  if (trace) return trace;
  const R = rng(42), N = 1201, dt = 0.5, P = new Float64Array(N);
  for (let i = 0; i < N; i++) P[i] = 2.5;
  for (let k = 0; k < 40; k++) {
    const tk = 8 + k * 14.6 + R() * 6, A = 90 + R() * 60, D = 2 + R() * 1.5, tr = tk + D + 1.5 + R() * 4, Ar = 25 + R() * 30, Dr = 1.4 + R() * 0.8;
    for (let i = 0; i < N; i++) { const s = i * dt; if (s >= tk && s <= tk + D) P[i] += A * Math.sin(Math.PI * (s - tk) / D); if (s >= tr && s <= tr + Dr) P[i] -= Ar * Math.sin(Math.PI * (s - tr) / Dr); }
  }
  const En = new Float64Array(N); for (let i = 1; i < N; i++) En[i] = En[i - 1] + 0.5 * (P[i] + P[i - 1]) * dt / 3600;
  const kk = 1.5 / En[N - 1]; for (let i = 0; i < N; i++) { P[i] *= kk; En[i] *= kk; }
  trace = { P, E: En, dt, N }; return trace;
}
export function sCost(ctx, t) {
  bg(ctx, { gx: 700 });
  const tr = powerTrace(), X0 = 250, X1 = 1300, Tm = 600, X = (s) => X0 + (s / Tm) * (X1 - X0);
  const y0 = 820, y1 = 400, lo = -50, hi = 125, YP = (p) => y0 - ((p - lo) / (hi - lo)) * (y0 - y1);
  const pa = E.outCubic(prog(t, 0.3, 1.1));
  axes(ctx, { x0: X0, x1: X1, y0, y1, xt: [0, 120, 240, 360, 480, 600], yt: [-50, 0, 50, 100], X, Y: YP, alpha: pa, xl: 'match time *t* (s)', xfmt: String, yfmt: v => (v < 0 ? '−' + Math.abs(v) : String(v)), zero: true });
  mtext(ctx, 'power *P* (kW)', X0, y1 - 24, { size: 23, alpha: pa });
  const cur = Tm * E.inOutSine(prog(t, 1.0, 7.4)), n = Math.min(tr.N - 1, Math.floor(cur / tr.dt));
  if (n > 1) {
    const pos = new Path2D(), neg = new Path2D(), curve = new Path2D();
    pos.moveTo(X(0), YP(0)); neg.moveTo(X(0), YP(0));
    for (let i = 0; i <= n; i++) { const s = i * tr.dt, p = tr.P[i]; pos.lineTo(X(s), YP(Math.max(0, p))); neg.lineTo(X(s), YP(Math.min(0, p))); i ? curve.lineTo(X(s), YP(p)) : curve.moveTo(X(s), YP(p)); }
    pos.lineTo(X(n * tr.dt), YP(0)); pos.closePath(); neg.lineTo(X(n * tr.dt), YP(0)); neg.closePath();
    ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.24)'; ctx.fill(pos); ctx.restore();
    hatchFill(ctx, neg, C.silver, 0.7, 5);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke(curve); ctx.restore();
    if (cur < Tm - 0.5) line(ctx, [[X(cur), y1], [X(cur), y0]], { color: C.mid, w: 1, dash: [3, 5] });
    mtext(ctx, `area so far: ${tr.E[n].toFixed(2)} kWh`, X1 - 16, y1 + 30, { size: 25, align: 'right' });
  }
  const la = E.outCubic(prog(t, 2.6, 3.2));
  mtext(ctx, 'accelerating', X(26), YP(116), { size: 21, alpha: la, italicAll: true });
  mtext(ctx, 'regenerative braking returns energy', X(130), YP(-42), { size: 21, color: C.silver, alpha: la, italicAll: true });
}
