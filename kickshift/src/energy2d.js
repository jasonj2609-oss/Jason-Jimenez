// The energy chain behind KickShift, as physics demos:
// induction charging -> supercapacitor storage -> boost through the tyres -> one lane pass -> strategy.
// Pure functions of time t (seconds). Prototype-scale numbers: 50 kg car, 1 kW received, 4 m lane.
import { clamp, lerp, prog, E, keys } from './util.js';
import { W, H, C, bg, mtext, arrow, line, circle, hatchFill, ground, dim, cart, axes, plot } from './slides2d.js';

const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const sup = (n) => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
export const PROTO = { m: 50, P: 1000, L: 4, v: 4, eta: 0.5, mu: 0.9, muk: 0.72, r: 0.15, g: 9.81, C: 0.87 };

// current-carrying conductor seen end-on: dot = out of the page, cross = into the page
function cond(ctx, x, y, r, out, alpha = 1) {
  circle(ctx, x, y, r, { fill: '#0b0b0c', w: 1.4, alpha });
  if (out) circle(ctx, x, y, r * 0.28, { fill: C.ink, stroke: null, alpha });
  else { line(ctx, [[x - r * 0.55, y - r * 0.55], [x + r * 0.55, y + r * 0.55]], { w: 1.3, alpha }); line(ctx, [[x - r * 0.55, y + r * 0.55], [x + r * 0.55, y - r * 0.55]], { w: 1.3, alpha }); }
}
function laneSlab(ctx, x0, x1, gy, alpha = 1, h = 40) {
  const p = new Path2D(); p.rect(x0, gy + 14, x1 - x0, h);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = '#0c0c0e'; ctx.fill(p); ctx.restore();
  hatchFill(ctx, p, C.ink, 0.22 * alpha, 7);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = 'rgba(242,242,238,0.6)'; ctx.lineWidth = 1.2; ctx.stroke(p); ctx.restore();
  line(ctx, [[x0, gy], [x1, gy]], { w: 3, alpha });
}
// time-series panel helper
function panel(ctx, { x0, x1, y0, y1, tmax, lo, hi, yt, label, tag, alpha, xl, xt, xfmt, yfmt, zero }) {
  const X = (s) => x0 + (s / tmax) * (x1 - x0), Y = (v) => y0 - ((v - lo) / (hi - lo)) * (y0 - y1);
  axes(ctx, { x0, x1, y0, y1, xt: xt || [], yt, X, Y, alpha, xl, xfmt: xfmt || (() => ''), yfmt: yfmt || String, zero });
  mtext(ctx, label, x0, y1 - 22, { size: 22, alpha });
  if (tag) mtext(ctx, tag, x0 - 70, y1 - 22, { size: 22, color: C.silver, alpha, italicAll: true });
  return { X, Y };
}
function shade(ctx, X, a, b, y0, y1, alpha) {
  if (b <= a) return;
  const p = new Path2D(); p.rect(X(a), y1, X(b) - X(a), y0 - y1);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = 'rgba(242,242,238,0.06)'; ctx.fill(p); ctx.restore();
}

// ================= §2 CHARGING LANE: Faraday's law =================
export function sLane(ctx, t) {
  bg(ctx, { gx: 620 });
  const { P } = PROTO;
  const gy = 690, ppm = 110, lx0 = 380, lx1 = lx0 + 4 * ppm, slow = 0.5, vx = 4 * ppm * slow, f = 1.4;
  const ph = Math.sin(2 * Math.PI * f * t);
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  const len = 300, front = -40 + (t - 0.6) * vx, xc = front - 150;
  const frac = clamp((xc - lx0) / (lx1 - lx0)), over = xc > lx0 && xc < lx1;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1180, H); ctx.clip();
  ground(ctx, 70, 1170, gy, ga);
  const slab = new Path2D(); slab.rect(lx0, gy + 14, lx1 - lx0, 66);
  ctx.save(); ctx.globalAlpha = ga; ctx.fillStyle = '#0c0c0e'; ctx.fill(slab); ctx.strokeStyle = 'rgba(242,242,238,0.55)'; ctx.lineWidth = 1.2; ctx.stroke(slab); ctx.restore();
  line(ctx, [[lx0, gy], [lx1, gy]], { w: 3, alpha: ga });
  for (let k = 0; k < 4; k++) {
    const cx = lx0 + 55 + k * 110, pol = (ph >= 0) !== (k % 2 === 1);
    cond(ctx, cx - 30, gy + 47, 11, pol, ga); cond(ctx, cx + 30, gy + 47, 11, !pol, ga);
  }
  mtext(ctx, 'transmitter coils, alternating current', (lx0 + lx1) / 2, gy + 104, { size: 21, color: C.silver, align: 'center', alpha: ga, italicAll: true });
  dim(ctx, lx0, gy + 142, lx1, gy + 142, '*L* = 4 m', { alpha: ga, off: 24, size: 22 });
  // magnetic field above the lane: arrows flip with the current
  const fa = E.outCubic(prog(t, 1.0, 1.6));
  for (let x = lx0 - 45; x <= lx1 + 45; x += 30) {
    const prof = sstep(lx0 - 50, lx0 + 30, x) * (1 - sstep(lx1 - 30, lx1 + 50, x));
    for (const [row, dy] of [[0, 18], [1, 56], [2, 94], [3, 132]]) {
      const b = ph * prof * Math.exp(-row * 0.42), L = 30 * b, y = gy - dy;
      if (Math.abs(L) > 3) arrow(ctx, x, y + L / 2, x, y - L / 2, { w: 1.3, head: 8, alpha: fa * 0.8 });
    }
  }
  mtext(ctx, '*B*', lx1 + 66, gy - 96, { size: 30, alpha: fa });
  // the car and its receiver coil
  const ca = E.outCubic(prog(t, 0.6, 1.0)) * (1 - prog(front - len, 820, 1060));
  const c = cart(ctx, front, gy, { len, h: 70, rw: 18, angle: front / 18, label: null, alpha: ca });
  const rc = new Path2D(); rc.rect(xc - 55, c.by + 1, 110, 10);
  ctx.save(); ctx.globalAlpha = ca; ctx.fillStyle = over ? 'rgba(242,242,238,0.75)' : '#2a2c30'; ctx.fill(rc); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke(rc); ctx.restore();
  for (let i = 0; i < 6; i++) line(ctx, [[xc - 50 + i * 20, c.by + 1], [xc - 40 + i * 20, c.by + 11]], { w: 1, alpha: ca * 0.6, color: over ? '#050505' : C.silver });
  mtext(ctx, 'receiver coil', xc, c.top + 24, { size: 21, align: 'center', alpha: ca, italicAll: true });
  line(ctx, [[xc, c.top + 38], [xc, c.by - 2]], { w: 1, alpha: ca * 0.8, color: C.silver });
  const Ec = P * frac, fadeOut = 1 - prog(xc, lx1 + 80, lx1 + 200);
  if (frac > 0 && fadeOut > 0) {
    mtext(ctx, over ? `*P* = 1.0 kW` : 'off the lane', front - len / 2, c.top - 64, { size: 24, align: 'center', alpha: ca * fadeOut });
    mtext(ctx, `*E* = ${Math.round(Ec)} J`, front - len / 2, c.top - 30, { size: 26, align: 'center', alpha: ca * fadeOut });
  }
  ctx.restore();

  // ---- graphs: B(t), induced emf, energy collected ----
  const pa = E.outCubic(prog(t, 0.5, 1.3)), tmax = 4, tau = clamp((t - 0.6) * slow, 0, tmax);
  const tIn = (lx0 + 150 + 40) / vx * slow, tOut = tIn + 1;
  const toT = (s) => 0.6 + s / slow;
  const g1 = panel(ctx, { x0: 1270, x1: 1800, y0: 450, y1: 340, tmax, lo: -1.2, hi: 1.2, yt: [-1, 0, 1], label: '*B* (a.u.)', tag: '(a)', alpha: pa, zero: true, yfmt: v => (v < 0 ? '−1' : String(v)) });
  const g2 = panel(ctx, { x0: 1270, x1: 1800, y0: 640, y1: 530, tmax, lo: -1.2, hi: 1.2, yt: [-1, 0, 1], label: 'induced voltage *ε* (a.u.)', tag: '(b)', alpha: pa, zero: true, yfmt: v => (v < 0 ? '−1' : String(v)) });
  const g3 = panel(ctx, { x0: 1270, x1: 1800, y0: 860, y1: 720, tmax, lo: 0, hi: 1200, yt: [0, 500, 1000], label: 'energy collected *E* (J)', tag: '(c)', alpha: pa, xl: 'time *t* (s)', xt: [0, 1, 2, 3, 4], xfmt: String });
  const sh = E.outCubic(prog(tau, tIn, tIn + 0.2));
  shade(ctx, g2.X, tIn, Math.min(tau, tOut), 640, 530, sh); shade(ctx, g3.X, tIn, Math.min(tau, tOut), 860, 720, sh);
  if (tau > 0) {
    plot(ctx, (s) => Math.sin(2 * Math.PI * f * toT(s)), 0, tau, g1.X, g1.Y, { step: 0.004, w: 1.8 });
    const env = (s) => sstep(tIn - 0.06, tIn + 0.06, s) * (1 - sstep(tOut - 0.06, tOut + 0.06, s));
    plot(ctx, (s) => -env(s) * Math.cos(2 * Math.PI * f * toT(s)), 0, tau, g2.X, g2.Y, { step: 0.004, w: 1.8, color: C.silver });
    plot(ctx, (s) => P * clamp((s - tIn) / (tOut - tIn)), 0, tau, g3.X, g3.Y, { step: 0.01, w: 2.4 });
  }
  if (tau > tOut) mtext(ctx, '1000 J', g3.X(tOut) + 14, g3.Y(1000) - 18, { size: 22, alpha: E.outCubic(prog(tau, tOut, tOut + 0.2)) });
}

// ================= §3 ENERGY STORAGE: battery vs supercapacitor =================
function capSym(ctx, x, y, alpha) { line(ctx, [[x - 8, y - 26], [x - 8, y + 26]], { w: 3, alpha }); line(ctx, [[x + 8, y - 26], [x + 8, y + 26]], { w: 3, alpha }); }
function batSym(ctx, x, y, alpha) {
  for (let i = 0; i < 2; i++) { const xx = x - 14 + i * 22; line(ctx, [[xx, y - 26], [xx, y + 26]], { w: 2, alpha }); line(ctx, [[xx + 9, y - 13], [xx + 9, y + 13]], { w: 4, alpha }); }
}
function coilSym(ctx, x, y, alpha) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 4; i++) ctx.arc(x - 36 + 9 + i * 18, y, 9, Math.PI, 0);
  ctx.stroke(); ctx.restore();
}
function flow(ctx, pts, t, rate, alpha) {
  if (alpha <= 0.01) return;
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
  for (let k = 0; k < Math.ceil(L / 34); k++) {
    let d = ((k * 34 + t * rate) % L + L) % L, i = 0;
    while (d > seg[i]) { d -= seg[i]; i++; }
    const u = d / seg[i], x = lerp(pts[i][0], pts[i + 1][0], u), y = lerp(pts[i][1], pts[i + 1][1], u);
    circle(ctx, x, y, 3.2, { fill: C.ink, stroke: null, alpha });
  }
}
export function sStore(ctx, t) {
  bg(ctx, { gx: 500 });
  // ---- (a) Ragone plot ----
  const X0 = 210, X1 = 900, Y0 = 880, Y1 = 350;
  const XE = (e) => X0 + ((Math.log10(e) + 1) / 4) * (X1 - X0), YP = (p) => Y0 - ((Math.log10(p) - 1) / 4) * (Y0 - Y1);
  const pa = E.outCubic(prog(t, 0.3, 1.1));
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [0.1, 1, 10, 100, 1000], yt: [10, 100, 1e3, 1e4, 1e5], X: XE, Y: YP, alpha: pa, xl: 'specific energy (Wh/kg)', yl: 'specific power (W/kg)', yfmt: (v) => '10' + sup(Math.round(Math.log10(v))) });
  mtext(ctx, '(a)', X0 - 92, Y1 - 24, { size: 22, color: C.silver, alpha: pa, italicAll: true });
  const blob = (ce, cp, rxDec, ryDec, rot, a, hatch, name, role, lx, ly, align) => {
    if (a <= 0) return;
    const cx = XE(ce), cy = YP(cp), rx = rxDec * (X1 - X0) / 4, ry = ryDec * (Y0 - Y1) / 4;
    const p = new Path2D(); p.ellipse(cx, cy, rx * E.outCubic(a), ry * E.outCubic(a), rot, 0, Math.PI * 2);
    if (hatch) hatchFill(ctx, p, C.ink, 0.5 * a, 8); else { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(242,242,238,0.2)'; ctx.fill(p); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke(p); ctx.restore();
    mtext(ctx, name, lx, ly, { size: 25, align, alpha: a });
    mtext(ctx, role, lx, ly + 30, { size: 22, color: C.silver, align, alpha: a, italicAll: true });
  };
  blob(150, 700, 0.3, 0.55, -0.35, prog(t, 1.4, 2.2), true, 'lithium-ion battery', 'endurance', XE(150) - 10, YP(700) + 130, 'center');
  blob(5, 7000, 0.45, 0.45, -0.3, prog(t, 2.4, 3.2), false, 'supercapacitor', 'sprint', XE(5), YP(7000) - 110, 'center');

  // ---- (b) energy path in the car ----
  const sa = E.outCubic(prog(t, 0.6, 1.4));
  const cP = [1110, 420], sP = [1380, 420], bP = [1380, 580], mP = [1660, 500];
  mtext(ctx, '(b)', 1040, 340, { size: 22, color: C.silver, alpha: sa, italicAll: true });
  const wire = (pts) => line(ctx, pts, { w: 1.4, color: 'rgba(242,242,238,0.55)', alpha: sa });
  wire([[cP[0] + 40, cP[1]], [sP[0] - 8, sP[1]]]); wire([[sP[0] + 8, sP[1]], [mP[0] - 60, sP[1]], [mP[0] - 60, mP[1]], [mP[0] - 34, mP[1]]]);
  wire([[bP[0] + 20, bP[1]], [mP[0] - 60, bP[1]], [mP[0] - 60, mP[1]]]);
  coilSym(ctx, cP[0], cP[1], sa); capSym(ctx, sP[0], sP[1], sa); batSym(ctx, bP[0], bP[1], sa);
  circle(ctx, mP[0], mP[1], 32, { fill: '#0b0b0c', w: 2, alpha: sa }); mtext(ctx, 'M', mP[0], mP[1] + 1, { size: 30, align: 'center', alpha: sa });
  mtext(ctx, 'receiver coil', cP[0], cP[1] + 40, { size: 21, color: C.silver, align: 'center', alpha: sa, italicAll: true });
  mtext(ctx, 'supercapacitor', sP[0], sP[1] - 48, { size: 21, color: C.silver, align: 'center', alpha: sa, italicAll: true });
  mtext(ctx, 'battery', bP[0], bP[1] + 48, { size: 21, color: C.silver, align: 'center', alpha: sa, italicAll: true });
  mtext(ctx, 'motor', mP[0], mP[1] + 54, { size: 21, color: C.silver, align: 'center', alpha: sa, italicAll: true });
  const ph = (a, b) => sstep(a, a + 0.2, t) * (1 - sstep(b - 0.2, b, t));
  const lane = ph(3.0, 5.0), boost = ph(5.4, 6.6), cruise = sa;
  flow(ctx, [[bP[0] + 20, bP[1]], [mP[0] - 60, bP[1]], [mP[0] - 60, mP[1]], [mP[0] - 34, mP[1]]], t, 40, cruise * 0.7);
  flow(ctx, [[cP[0] + 40, cP[1]], [sP[0] - 8, sP[1]]], t, 160, lane);
  flow(ctx, [[sP[0] + 8, sP[1]], [mP[0] - 60, sP[1]], [mP[0] - 60, mP[1]], [mP[0] - 34, mP[1]]], t, 320, boost);
  const { C: Cap } = PROTO;
  const Esc = 1000 * (t < 3 ? 0 : t < 5 ? (t - 3) / 2 : t < 5.4 ? 1 : t < 6.6 ? 1 - (t - 5.4) / 1.2 : 0);
  mtext(ctx, `*V* = ${Math.sqrt(2 * Esc / Cap).toFixed(1)} V`, sP[0] + 26, sP[1] + 40, { size: 22, alpha: sa });
  const g = panel(ctx, { x0: 1110, x1: 1800, y0: 880, y1: 700, tmax: 10, lo: 0, hi: 1200, yt: [0, 500, 1000], label: 'supercapacitor energy (J)', alpha: sa, xl: 'time *t* (s)', xt: [0, 2, 4, 6, 8, 10], xfmt: String });
  shade(ctx, g.X, 3, Math.min(t, 5), 880, 700, sa); shade(ctx, g.X, 5.4, Math.min(t, 6.6), 880, 700, sa);
  if (t > 3) mtext(ctx, 'lane', g.X(4), 718, { size: 20, color: C.silver, align: 'center', alpha: E.outCubic(prog(t, 3, 3.4)), italicAll: true });
  if (t > 5.4) mtext(ctx, 'boost', g.X(6), 718, { size: 20, color: C.silver, align: 'center', alpha: E.outCubic(prog(t, 5.4, 5.8)), italicAll: true });
  const Ef = (s) => 1000 * (s < 3 ? 0 : s < 5 ? (s - 3) / 2 : s < 5.4 ? 1 : s < 6.6 ? 1 - (s - 5.4) / 1.2 : 0);
  if (t > 0.6) plot(ctx, Ef, 0, Math.min(t, 10), g.X, g.Y, { step: 0.02, w: 2.4 });
}

// ================= §4 BOOST: Newton's third law and the grip limit =================
export function sBoost(ctx, t) {
  bg(ctx, { gx: 500 });
  const { m, mu, muk, r, g } = PROTO, N = m * g, Fg = mu * N, Fk = muk * N, tauLim = Fg * r;
  const tauAt = (s) => tauLim * keys(s, [[0, 0], [1.2, 0], [4.0, 0.95], [5.6, 1.45], [7.4, 1.45], [8.2, 0.9]]);
  // integrate speed, roll and slip for the demo
  let v = 2, x = 0, spin = 0, slip = false;
  for (let s = 0; s < t; s += 0.02) {
    const tq = tauAt(s); slip = tq > tauLim; const F = slip ? Fk : tq / r; v += (F / m) * 0.02 * 0.25; x += v * 0.02; spin += (slip ? (tq - Fk * r) * 0.9 : 0) * 0.02;
  }
  const tq = tauAt(t), F = slip ? Fk : tq / r;
  const wx = 470, wy = 560, R = 140, fy = wy + R;
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  // floor with moving texture
  line(ctx, [[110, fy], [960, fy]], { w: 1.6, alpha: ga });
  ctx.save(); ctx.globalAlpha = ga * 0.45; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
  const off = (x * 120) % 13; for (let xx = 110 + 12 - off; xx <= 960; xx += 13) { ctx.beginPath(); ctx.moveTo(xx, fy + 1); ctx.lineTo(xx - 11, fy + 13); ctx.stroke(); }
  ctx.restore();
  // chassis cut-away and suspension arm
  ctx.save(); ctx.globalAlpha = ga; ctx.beginPath(); ctx.roundRect(170, 330, 640, 64, 10);
  const gr = ctx.createLinearGradient(0, 330, 0, 394); gr.addColorStop(0, '#303237'); gr.addColorStop(1, '#131416'); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
  mtext(ctx, 'car body, *m* = 50 kg', 490, 362, { size: 24, align: 'center', alpha: ga });
  line(ctx, [[wx, 394], [wx, wy]], { w: 6, color: '#3a3c40', alpha: ga }); line(ctx, [[wx, 394], [wx, wy]], { w: 1.4, alpha: ga });
  // wheel
  const ang = x / r + spin;
  circle(ctx, wx, wy, R, { fill: '#0d0d0f', w: 2.2, alpha: ga });
  circle(ctx, wx, wy, R - 26, { stroke: C.silver, w: 1.2, alpha: ga });
  for (let k = 0; k < 5; k++) { const a = ang + k * 2 * Math.PI / 5; line(ctx, [[wx + Math.cos(a) * 22, wy + Math.sin(a) * 22], [wx + Math.cos(a) * (R - 28), wy + Math.sin(a) * (R - 28)]], { w: 1.4, color: C.silver, alpha: ga }); }
  circle(ctx, wx, wy, 14, { fill: C.ink, stroke: null, alpha: ga });
  // torque arc
  const ta = E.outCubic(prog(t, 1.2, 1.8)), tr = 74;
  if (tq > 1) {
    ctx.save(); ctx.globalAlpha = ta; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(wx, wy, tr, -2.6, -0.9); ctx.stroke(); ctx.restore();
    arrow(ctx, wx + Math.cos(-1.05) * tr, wy + Math.sin(-1.05) * tr, wx + Math.cos(-0.85) * tr, wy + Math.sin(-0.85) * tr, { w: 2.2, head: 16, alpha: ta });
    mtext(ctx, '*τ*', wx - 30, wy - tr - 22, { size: 32, alpha: ta });
  }
  // forces at the contact patch (0.24 px per newton)
  const s = 0.24, fa = E.outCubic(prog(t, 1.6, 2.2));
  arrow(ctx, wx, fy - 4, wx + F * s, fy - 4, { w: 3, head: 18, alpha: fa });
  mtext(ctx, 'floor pushes car forward', wx + F * s + 14, fy - 30, { size: 22, alpha: fa * (F > 20 ? 1 : 0), italicAll: true });
  arrow(ctx, wx, fy + 22, wx - F * s, fy + 22, { w: 3, head: 18, color: C.silver, alpha: fa });
  mtext(ctx, 'tyre pushes floor backward', wx - F * s - 14, fy + 50, { size: 22, color: C.silver, align: 'right', alpha: fa * (F > 20 ? 1 : 0), italicAll: true });
  arrow(ctx, wx - 26, fy, wx - 26, fy - N * 0.2, { w: 2, head: 14, alpha: fa });
  mtext(ctx, '*N*', wx - 46, fy - N * 0.2 + 10, { size: 26, align: 'right', alpha: fa });
  arrow(ctx, wx + 26, wy, wx + 26, wy + N * 0.2, { w: 2, head: 14, color: C.silver, alpha: fa });
  mtext(ctx, '*mg*', wx + 40, wy + N * 0.2 - 10, { size: 26, color: C.silver, alpha: fa });
  if (slip) {
    const sa = 0.6 + 0.4 * Math.sin(t * 20);
    for (let k = 0; k < 5; k++) line(ctx, [[wx - 30 - k * 26, fy + 2], [wx - 46 - k * 26, fy + 2]], { w: 2, color: C.silver, alpha: sa * (1 - k / 6) });
  }
  // readouts
  mtext(ctx, `*τ* = ${tq.toFixed(0)} N·m`, 1000, 430, { size: 26, alpha: fa, align: 'right' });
  mtext(ctx, `*F* = ${F.toFixed(0)} N`, 1000, 470, { size: 26, alpha: fa, align: 'right' });
  mtext(ctx, `*a* = *F*/*m* = ${(F / m).toFixed(1)} m/s²`, 1000, 510, { size: 26, alpha: fa, align: 'right' });
  mtext(ctx, slip ? 'wheel slipping' : 'tyre gripping', 1000, 552, { size: 24, color: C.silver, alpha: fa, align: 'right', italicAll: true });

  // ---- (a) F vs torque ----
  const pa = E.outCubic(prog(t, 0.5, 1.3));
  const A = { x0: 1250, x1: 1800, y0: 560, y1: 350 }, XA = (q) => A.x0 + q / 100 * (A.x1 - A.x0), YA = (f) => A.y0 - f / 500 * (A.y0 - A.y1);
  axes(ctx, { ...A, xt: [0, 50, 100], yt: [0, 250, 500], X: XA, Y: YA, alpha: pa, xl: 'motor torque *τ* (N·m)' });
  mtext(ctx, 'force *F* (N)', A.x0, A.y1 - 22, { size: 22, alpha: pa }); mtext(ctx, '(a)', A.x0 - 70, A.y1 - 22, { size: 22, color: C.silver, alpha: pa, italicAll: true });
  line(ctx, [[XA(0), YA(0)], [XA(tauLim), YA(Fg)]], { w: 2.4, alpha: pa });
  line(ctx, [[XA(tauLim), YA(Fg)], [XA(tauLim), YA(Fk)], [XA(100), YA(Fk)]], { w: 2.4, dash: [9, 6], color: C.silver, alpha: pa });
  line(ctx, [[XA(0), YA(Fg)], [XA(100), YA(Fg)]], { w: 1, dash: [3, 5], color: C.mid, alpha: pa });
  mtext(ctx, `grip limit *μmg* = ${Fg.toFixed(0)} N`, XA(98), YA(Fg) - 18, { size: 20, align: 'right', alpha: pa, color: C.silver });
  if (t > 1.2) circle(ctx, XA(Math.min(tq, 100)), YA(F), 8, { fill: C.ink, stroke: null, alpha: pa });

  // ---- (b) F vs speed: power limit vs grip limit ----
  const B = { x0: 1250, x1: 1800, y0: 890, y1: 710 }, XB = (q) => B.x0 + q / 10 * (B.x1 - B.x0), YB = (f) => B.y0 - Math.min(f, 600) / 600 * (B.y0 - B.y1);
  const pb = E.outCubic(prog(t, 2.0, 2.8));
  axes(ctx, { ...B, xt: [0, 5, 10], yt: [0, 300, 600], X: XB, Y: YB, alpha: pb, xl: 'speed *v* (m/s)', xfmt: String });
  mtext(ctx, 'force *F* (N)', B.x0, B.y1 - 22, { size: 22, alpha: pb }); mtext(ctx, '(b)', B.x0 - 70, B.y1 - 22, { size: 22, color: C.silver, alpha: pb, italicAll: true });
  line(ctx, [[XB(0), YB(Fg)], [XB(10), YB(Fg)]], { w: 1.2, dash: [3, 5], color: C.mid, alpha: pb });
  plot(ctx, (q) => 1000 / q, 1.67, 10, XB, YB, { step: 0.05, w: 2.2, alpha: pb });
  plot(ctx, (q) => 2000 / q, 3.34, 10, XB, YB, { step: 0.05, w: 2.2, color: C.silver, dash: [9, 6], alpha: pb });
  mtext(ctx, '*P*/*v*, normal 1 kW', XB(9.8), YB(100) - 18, { size: 20, align: 'right', alpha: pb });
  mtext(ctx, 'boost 2 kW', XB(9.8), YB(200) - 22, { size: 20, color: C.silver, align: 'right', alpha: pb, italicAll: true });
  const bb = E.outCubic(prog(t, 8.4, 9.0));
  if (bb > 0) {
    circle(ctx, XB(4), YB(250), 6, { fill: C.ink, stroke: null, alpha: bb });
    circle(ctx, XB(4), YB(Fg), 7, { fill: C.ink, stroke: null, alpha: bb });
    arrow(ctx, XB(4), YB(250) - 8, XB(4), YB(Fg) + 10, { w: 1.8, head: 12, alpha: bb });
    mtext(ctx, 'boost at 4 m/s: capped by grip', XB(4) + 14, YB(565), { size: 20, alpha: bb, italicAll: true });
  }
}

// ================= §5 ONE LANE PASS, by the numbers =================
export function sPass(ctx, t) {
  bg(ctx, { gx: 600 });
  const { m, P, eta } = PROTO;
  const gy = 600, ppm = 90, lx0 = 300, lx1 = lx0 + 4 * ppm, slow = 0.5, t0 = 0.8, len = 135;
  const tIn = t0 + (lx0 + 68 - 40) / (4 * ppm * slow), tOut = tIn + 1 / slow, tB = tOut + 0.6, tBe = tB + 1.0;
  const vAt = (s) => 4 + 2 * sstep(tB, tBe, s);
  let front = 40; for (let s = t0; s < t; s += 0.01) front += vAt(s) * ppm * slow * 0.01;
  if (t < t0) front = 40 - (t0 - t) * 4 * ppm * slow;
  const v = vAt(t), xc = front - 68, frac = clamp((xc - lx0) / (lx1 - lx0)), Ec = P * frac;
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1180, H); ctx.clip();
  ground(ctx, 70, 1170, gy, ga);
  laneSlab(ctx, lx0, lx1, gy, ga, 34);
  dim(ctx, lx0, gy + 76, lx1, gy + 76, '*L* = 4 m', { alpha: ga, off: 24, size: 22 });
  mtext(ctx, 'charging lane', (lx0 + lx1) / 2, gy + 31, { size: 20, align: 'center', color: C.ink, alpha: ga, italicAll: true });
  const c = cart(ctx, front, gy, { len, h: 52, rw: 13, angle: front / 13, label: 'm' });
  if (t > tB && t < tBe + 0.8) for (let k = 0; k < 6; k++) line(ctx, [[c.x0 - 14 - k * 22, c.midY - 18 + k * 7], [c.x0 - 40 - k * 22, c.midY - 18 + k * 7]], { w: 1.4, color: C.silver, alpha: (1 - prog(t, tBe, tBe + 0.8)) * 0.8 });
  const la = E.outCubic(prog(t, 1.0, 1.4));
  mtext(ctx, `*v* = ${v.toFixed(1)} m/s`, front - len / 2, c.top - 64, { size: 24, align: 'center', alpha: la });
  if (frac > 0) mtext(ctx, `*E* = ${Math.round(Ec)} J`, front - len / 2, c.top - 30, { size: 24, align: 'center', alpha: la * (1 - prog(t, tB, tB + 0.3)) });
  if (t > tB) mtext(ctx, 'boost', front - len / 2, c.top - 30, { size: 24, align: 'center', alpha: E.outCubic(prog(t, tB, tB + 0.3)), italicAll: true });
  ctx.restore();
  // energy ledger
  const bx = 560, sc = 0.42, rows = [
    { y: 790, label: 'collected, *E* = *Pt*', val: Ec, show: prog(t, tIn, tIn + 0.2) },
    { y: 845, label: `after losses, *η* ≈ ${eta * 100}%`, val: 500 * E.outCubic(prog(t, tOut + 0.2, tOut + 0.8)), show: prog(t, tOut + 0.1, tOut + 0.3), hatch: true },
    { y: 900, label: 'boost needs ½*m*(*v*_f² − *v*_i²)', val: 500 * E.outCubic(prog(t, tBe, tBe + 0.6)), show: prog(t, tB + 0.6, tB + 0.8), solid: true },
  ];
  rows.forEach((rw) => {
    if (rw.show <= 0) return;
    mtext(ctx, rw.label, 120, rw.y, { size: 23, alpha: rw.show });
    const p = new Path2D(); p.rect(bx, rw.y - 15, Math.max(1, rw.val * sc), 30);
    if (rw.hatch) hatchFill(ctx, p, C.ink, 0.6 * rw.show, 7); else { ctx.save(); ctx.globalAlpha = rw.show; ctx.fillStyle = rw.solid ? 'rgba(185,189,195,0.85)' : 'rgba(242,242,238,0.85)'; ctx.fill(p); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = rw.show; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke(p); ctx.restore();
    mtext(ctx, `${Math.round(rw.val)} J`, bx + rw.val * sc + 14, rw.y, { size: 22, alpha: rw.show });
  });
  // ---- graphs ----
  const pa = E.outCubic(prog(t, 0.5, 1.3)), tm = 4.5, tau = clamp((t - t0) * slow, 0, tm);
  const toT = (q) => t0 + q / slow, rIn = (tIn - t0) * slow, rOut = (tOut - t0) * slow, rB = (tB - t0) * slow, rBe = (tBe - t0) * slow;
  const Est = (q) => { const s = toT(q); return s < tIn ? 0 : s < tOut ? 1000 * (s - tIn) / (tOut - tIn) : s < tB ? 1000 : s < tBe ? 1000 * (1 - (s - tB) / (tBe - tB)) : 0; };
  const g1 = panel(ctx, { x0: 1280, x1: 1800, y0: 580, y1: 360, tmax: tm, lo: 0, hi: 1200, yt: [0, 500, 1000], label: 'stored energy (J)', tag: '(a)', alpha: pa });
  const g2 = panel(ctx, { x0: 1280, x1: 1800, y0: 880, y1: 670, tmax: tm, lo: 0, hi: 8, yt: [0, 4, 8], label: 'speed *v* (m/s)', tag: '(b)', alpha: pa, xl: 'time *t* (s)', xt: [0, 1, 2, 3, 4], xfmt: String });
  shade(ctx, g1.X, rIn, Math.min(tau, rOut), 580, 360, pa); shade(ctx, g2.X, rB, Math.min(tau, rBe), 880, 670, pa);
  if (tau > 0) { plot(ctx, Est, 0, tau, g1.X, g1.Y, { step: 0.005 }); plot(ctx, (q) => vAt(toT(q)), 0, tau, g2.X, g2.Y, { step: 0.005 }); }
  if (tau > rIn) mtext(ctx, 'on the lane', g1.X((rIn + rOut) / 2), 380, { size: 19, color: C.silver, align: 'center', alpha: pa, italicAll: true });
  if (tau > rB) mtext(ctx, 'boost', g2.X((rB + rBe) / 2), 690, { size: 19, color: C.silver, align: 'center', alpha: pa, italicAll: true });
}

// ================= §6 ENERGY IS A TACTIC: slower pass, more energy =================
export function sTactic(ctx, t) {
  bg(ctx, { gx: 600 });
  const { m, P, L, eta } = PROTO;
  const ppm = 90, lx0 = 260, lx1 = lx0 + L * ppm, slow = 0.5, ts = 1.8, len = 110;
  const lanes = [{ v: 2, y: 480 }, { v: 4, y: 650 }, { v: 8, y: 820 }];
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 1080, H); ctx.clip();
  lanes.forEach((ln) => {
    ground(ctx, 70, 1070, ln.y, ga); laneSlab(ctx, lx0, lx1, ln.y, ga, 20);
    const vx = ln.v * ppm * slow, xc = lx0 + (t - ts) * vx, front = xc + 55;
    const frac = clamp((xc - lx0) / (lx1 - lx0)), Ec = P * L / ln.v * frac, dur = L / ln.v;
    if (front > -20) cart(ctx, front, ln.y, { len, h: 40, rw: 10, angle: front / 10, label: null });
    mtext(ctx, `*v* = ${ln.v} m/s`, 80, ln.y - 92, { size: 24, alpha: ga });
    const p = new Path2D(); p.rect(lx0, ln.y + 44, Math.max(1, Ec * 0.16), 22);
    if (frac > 0) {
      ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.85)'; ctx.fill(p); ctx.strokeStyle = C.ink; ctx.lineWidth = 1; ctx.stroke(p); ctx.restore();
      mtext(ctx, `${Math.round(Ec)} J`, lx0 + Ec * 0.16 + 12, ln.y + 55, { size: 22 });
      if (frac >= 1) mtext(ctx, `${dur.toFixed(1)} s on the lane`, lx0 + Ec * 0.16 + 110, ln.y + 55, { size: 21, color: C.silver, alpha: E.outCubic(prog(t, ts + dur / slow, ts + dur / slow + 0.4)), italicAll: true });
    }
  });
  ctx.restore();
  // ---- (a) energy vs crossing speed ----
  const pa = E.outCubic(prog(t, 0.5, 1.3));
  const A = { x0: 1250, x1: 1800, y0: 560, y1: 350 }, XA = (q) => A.x0 + q / 10 * (A.x1 - A.x0), YA = (e) => A.y0 - Math.min(e, 4000) / 4000 * (A.y0 - A.y1);
  axes(ctx, { ...A, xt: [0, 5, 10], yt: [0, 2000, 4000], X: XA, Y: YA, alpha: pa, xl: 'crossing speed *v* (m/s)', xfmt: String });
  mtext(ctx, 'energy collected (J)', A.x0, A.y1 - 22, { size: 22, alpha: pa }); mtext(ctx, '(a)', A.x0 - 70, A.y1 - 22, { size: 22, color: C.silver, alpha: pa, italicAll: true });
  plot(ctx, (q) => P * L / q, 1, 10, XA, YA, { step: 0.05, w: 2.4, alpha: pa });
  // ---- (b) speed after boost vs crossing speed ----
  const B = { x0: 1250, x1: 1800, y0: 890, y1: 710 }, XB = (q) => B.x0 + q / 10 * (B.x1 - B.x0), YB = (q) => B.y0 - Math.min(q, 12) / 12 * (B.y0 - B.y1);
  const vf = (q) => Math.sqrt(q * q + 2 * eta * P * L / q / m);
  axes(ctx, { ...B, xt: [0, 5, 10], yt: [0, 6, 12], X: XB, Y: YB, alpha: pa, xl: 'crossing speed *v* (m/s)', xfmt: String });
  mtext(ctx, 'speed after boost (m/s)', B.x0, B.y1 - 22, { size: 22, alpha: pa }); mtext(ctx, '(b)', B.x0 - 70, B.y1 - 22, { size: 22, color: C.silver, alpha: pa, italicAll: true });
  plot(ctx, vf, 1, 10, XB, YB, { step: 0.05, w: 2.4, alpha: pa });
  plot(ctx, (q) => q, 0, 10, XB, YB, { step: 0.5, w: 1.2, dash: [4, 6], color: C.mid, alpha: pa });
  mtext(ctx, 'no boost', XB(2.4) + 6, YB(2.4) + 22, { size: 19, color: C.silver, alpha: pa, italicAll: true });
  lanes.forEach((ln) => {
    const done = ts + (L / ln.v) / slow, a = E.outCubic(prog(t, done, done + 0.4)); if (a <= 0) return;
    circle(ctx, XA(ln.v), YA(P * L / ln.v), 7, { fill: C.ink, stroke: null, alpha: a });
    circle(ctx, XB(ln.v), YB(vf(ln.v)), 7, { fill: C.ink, stroke: null, alpha: a });
    mtext(ctx, `${ln.v} → ${vf(ln.v).toFixed(1)}`, XB(ln.v) + 12, YB(vf(ln.v)) - 18, { size: 19, alpha: a });
  });
}
