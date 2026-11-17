// Physics figures and demos, drawn like the plates of a physics paper:
// hairlines, Computer Modern labels, monochrome, textbook schematics driven by the real equations.
// Every function is a pure function of time t (seconds), so frames render deterministically.
import { clamp, lerp, prog, E, rng } from './util.js';

export const W = 1920, H = 1080;
export const C = { ink: '#F2F2EE', silver: '#B9BDC3', mid: '#7E838A', dark: '#3F4247', dim: 'rgba(242,242,238,0.6)', faint: 'rgba(242,242,238,0.14)' };
const SERIF = '"CMU Serif", "Latin Modern Roman", Georgia, serif';
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// ---------- primitives ----------
let vignette = null;
export function bg(ctx, { gx = 960, gy = -200, glow = 0.08 } = {}) {
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H);
  const r = ctx.createRadialGradient(gx, gy, 0, gx, gy, 1300);
  r.addColorStop(0, `rgba(255,255,255,${glow})`); r.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
  if (!vignette) {
    vignette = document.createElement('canvas'); vignette.width = W; vignette.height = H;
    const g = vignette.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vignette, 0, 0);
}

// Text with *italic* runs; "_x" right after a run sets x as a subscript.
export function mtext(ctx, s, x, y, { size = 26, color = C.ink, align = 'left', base = 'middle', alpha = 1, weight = 400, italicAll = false } = {}) {
  if (alpha <= 0.002 || !s) return 0;
  const parts = [];
  s.split('*').forEach((p, i) => {
    if (!p) return;
    const it = italicAll || i % 2 === 1;
    const m = p.match(/^_(\w+)(.*)$/s);
    if (m) { parts.push({ p: m[1], it: false, sub: true }); if (m[2]) parts.push({ p: m[2], it }); }
    else parts.push({ p, it });
  });
  ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.textBaseline = base; ctx.textAlign = 'left';
  const font = (q) => `${q.it ? 'italic ' : ''}${weight} ${q.sub ? Math.round(size * 0.68) : size}px ${SERIF}`;
  let total = 0; for (const q of parts) { ctx.font = font(q); q.w = ctx.measureText(q.p).width + (q.sub ? 2 : 0); total += q.w; }
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (const q of parts) { ctx.font = font(q); ctx.fillText(q.p, cx + (q.sub ? 1 : 0), y + (q.sub ? size * 0.28 : 0)); cx += q.w; }
  ctx.restore();
  return total;
}

// TikZ "stealth" arrow
export function arrow(ctx, x1, y1, x2, y2, { color = C.ink, w = 2, head = 18, alpha = 1, dash = null } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 3 || alpha <= 0.002) return;
  const h = Math.min(head, len * 0.5);
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - Math.cos(a - 0.36) * h, y2 - Math.sin(a - 0.36) * h);
  ctx.lineTo(x2 - Math.cos(a) * h * 0.62, y2 - Math.sin(a) * h * 0.62);
  ctx.lineTo(x2 - Math.cos(a + 0.36) * h, y2 - Math.sin(a + 0.36) * h);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function line(ctx, pts, { color = C.ink, w = 1.5, dash = null, alpha = 1, cap = 'round' } = {}) {
  if (alpha <= 0.002 || pts.length < 2) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = cap; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); ctx.restore();
}
function circle(ctx, x, y, r, { stroke = C.ink, fill = null, w = 1.5, alpha = 1, dash = null } = {}) {
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { if (dash) ctx.setLineDash(dash); ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); }
  ctx.restore();
}
function hat(ctx, x, y, size, alpha = 1) { line(ctx, [[x - size * 0.2, y], [x, y - size * 0.15], [x + size * 0.2, y]], { w: 1.6, alpha }); }
function impact(ctx, x, y, p, scale = 1) {
  if (p <= 0 || p >= 1) return;
  circle(ctx, x, y, (16 + 300 * E.outCubic(p)) * scale, { w: 2.2 * (1 - p) + 0.5, alpha: (1 - p) * 0.75 });
  circle(ctx, x, y, (10 + 170 * E.outCubic(p)) * scale, { stroke: C.silver, w: 1, alpha: (1 - p) * 0.55 });
}
function hatchFill(ctx, path, color, alpha, gap = 10, w = 1) {
  if (alpha <= 0.002) return;
  ctx.save(); ctx.clip(path); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = w;
  for (let x = -H; x < W; x += gap) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
  ctx.restore();
}
// textbook ground: a line with short hatching underneath
function ground(ctx, x0, x1, y, alpha = 1) {
  if (alpha <= 0.002) return;
  line(ctx, [[x0, y], [x1, y]], { w: 1.6, alpha });
  ctx.save(); ctx.globalAlpha *= alpha * 0.45; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
  for (let x = x0 + 12; x <= x1; x += 13) { ctx.beginPath(); ctx.moveTo(x, y + 1); ctx.lineTo(x - 11, y + 13); ctx.stroke(); }
  ctx.restore();
}
function wall(ctx, x, y0, y1, alpha = 1) {
  line(ctx, [[x, y0], [x, y1]], { w: 2.2, alpha });
  ctx.save(); ctx.globalAlpha *= alpha * 0.5; ctx.strokeStyle = C.ink; ctx.lineWidth = 1;
  for (let y = y0 + 12; y <= y1; y += 13) { ctx.beginPath(); ctx.moveTo(x + 1, y); ctx.lineTo(x + 13, y - 11); ctx.stroke(); }
  ctx.restore();
}
// dimension line with arrowheads at both ends and a label
function dim(ctx, x1, y1, x2, y2, label, { alpha = 1, off = 26, size = 24 } = {}) {
  if (alpha <= 0.002) return;
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  arrow(ctx, mx, my, x1, y1, { w: 1.2, head: 11, alpha }); arrow(ctx, mx, my, x2, y2, { w: 1.2, head: 11, alpha });
  const horiz = Math.abs(x2 - x1) > Math.abs(y2 - y1);
  mtext(ctx, label, horiz ? mx : mx + off, horiz ? my + off : my, { size, align: horiz ? 'center' : 'left', alpha });
}

// lab cart: body, two spoked wheels, italic mass label
function wheel(ctx, cx, cy, r, angle, alpha) {
  circle(ctx, cx, cy, r, { fill: '#0b0b0c', w: 1.6, alpha });
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = C.silver; ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) { const a = angle + k * 2 * Math.PI / 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2); ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); ctx.stroke(); }
  ctx.restore();
  circle(ctx, cx, cy, r * 0.16, { fill: C.ink, stroke: null, alpha });
}
function cart(ctx, front, y, { len = 270, h = 80, rw = 22, angle = 0, label = 'M', alpha = 1 } = {}) {
  const x0 = front - len, by = y - rw * 2 - 4;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.roundRect(x0, by - h, len, h, Math.min(10, h * 0.18));
  const g = ctx.createLinearGradient(0, by - h, 0, by); g.addColorStop(0, '#303237'); g.addColorStop(1, '#131416'); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0 + 8, by - h + 3); ctx.lineTo(front - 8, by - h + 3); ctx.stroke();
  ctx.restore();
  for (const fx of [0.2, 0.8]) wheel(ctx, x0 + len * fx, y - rw, rw, angle, alpha);
  if (label) mtext(ctx, `*${label}*`, x0 + len / 2, by - h / 2 + 2, { size: Math.min(46, h * 0.5), align: 'center', alpha });
  return { x0, by, top: by - h, midY: by - h / 2 };
}
function ballD(ctx, x, y, r, rot = 0, { label = 'm', alpha = 1 } = {}) {
  ctx.save(); ctx.globalAlpha *= alpha;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#55585e'); g.addColorStop(1, '#121315');
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();
  circle(ctx, x + Math.cos(rot) * r * 0.66, y + Math.sin(rot) * r * 0.66, Math.max(2, r * 0.07), { fill: C.ink, stroke: null, alpha });
  if (label) mtext(ctx, `*${label}*`, x, y + 1, { size: Math.min(40, r * 0.8), align: 'center', alpha });
}
function spring(ctx, x1, x2, y, { coils = 9, amp = 13, alpha = 1, w = 1.6 } = {}) {
  const L = x2 - x1; if (L <= 1) return;
  const lead = Math.min(10, L * 0.12), pts = [[x1, y], [x1 + lead, y]];
  const n = coils * 2, seg = (L - 2 * lead) / n;
  for (let i = 0; i < n; i++) pts.push([x1 + lead + seg * (i + 0.5), y + (i % 2 ? amp : -amp)]);
  pts.push([x2 - lead, y], [x2, y]);
  line(ctx, pts, { w, alpha });
  line(ctx, [[x2, y - amp - 6], [x2, y + amp + 6]], { w: 2.4, alpha });
}

// paper-style axes: closed frame, inward ticks, serif tick labels
function axes(ctx, { x0, x1, y0, y1, xt, yt, X, Y, xl, yl, alpha = 1, xfmt = String, yfmt = String, zero = false }) {
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = 'rgba(242,242,238,0.72)'; ctx.lineWidth = 1.4;
  ctx.strokeRect(x0, y1, x1 - x0, y0 - y1); ctx.lineWidth = 1.2;
  for (const v of xt) { const x = X(v); ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 - 9); ctx.moveTo(x, y1); ctx.lineTo(x, y1 + 9); ctx.stroke(); }
  for (const v of yt) { const y = Y(v); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + 9, y); ctx.moveTo(x1, y); ctx.lineTo(x1 - 9, y); ctx.stroke(); }
  if (zero) { ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(242,242,238,0.35)'; ctx.beginPath(); ctx.moveTo(x0, Y(0)); ctx.lineTo(x1, Y(0)); ctx.stroke(); }
  ctx.restore();
  for (const v of xt) mtext(ctx, xfmt(v), X(v), y0 + 28, { size: 21, color: C.silver, align: 'center', alpha });
  for (const v of yt) mtext(ctx, yfmt(v), x0 - 13, Y(v), { size: 21, color: C.silver, align: 'right', alpha });
  if (xl) mtext(ctx, xl, (x0 + x1) / 2, y0 + 64, { size: 24, align: 'center', alpha });
  if (yl) { ctx.save(); ctx.translate(x0 - 74, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2); mtext(ctx, yl, 0, 0, { size: 24, align: 'center', alpha }); ctx.restore(); }
}
function plot(ctx, f, a, b, X, Y, { step = 0.005, w = 2.4, color = C.ink, dash = null, alpha = 1 } = {}) {
  if (b <= a) return;
  const pts = []; for (let x = a; x < b; x += step) pts.push([X(x), Y(f(x))]); pts.push([X(b), Y(f(b))]);
  line(ctx, pts, { w, color, dash, alpha });
}

// ================= THE IDEA (type only; faint motion lines) =================
export function sIdea(ctx, t) {
  bg(ctx, { gy: 300, glow: 0.05 });
  const R = rng(3), inten = E.outCubic(prog(t, 0, 1.4));
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const y = 80 + R() * 920, sp = 500 + R() * 1600, len = 80 + R() * 420, off = R() * 5000, a = (0.03 + R() * 0.14) * inten;
    const x = W + 400 - ((t * sp + off) % (W + 900)), g = ctx.createLinearGradient(x, y, x + len, y);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 0.5 + R() * 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
  }
  ctx.restore();
}

// ================= §2 MOMENTUM: 1-D collision on a track =================
export const PHYS = { M: 900, m: 20, e: 0.6, v0: 15 };
PHYS.vb = (1 + PHYS.e) * PHYS.M * PHYS.v0 / (PHYS.M + PHYS.m);
PHYS.v1 = PHYS.v0 * (PHYS.M - PHYS.e * PHYS.m) / (PHYS.M + PHYS.m);
export function sMomentum(ctx, t) {
  bg(ctx, { gx: 1300 });
  const { M, m, v0, vb, v1 } = PHYS;
  const ppm = 60, slow = 0.5, ty = 575, rb = 45, bx0 = 1000, len = 270, rw = 22;
  const t0 = 0.8, f0 = -40, contact = bx0 - rb;
  const tc = t0 + (contact - f0) / (v0 * ppm * slow);
  const real = (tt) => (tt - t0) * slow, tauC = real(tc);
  const front = (tt) => (tt < tc ? f0 + (tt - t0) * v0 * ppm * slow : contact + (tt - tc) * v1 * ppm * slow);
  const ballX = (tt) => (tt < tc ? bx0 : bx0 + (tt - tc) * vb * ppm * slow);
  const ga = E.outCubic(prog(t, 0.2, 0.9));
  ground(ctx, 60, 1860, ty, ga);
  // strobe record every 0.1 s of real time
  for (let k = 1; ; k++) {
    const ts = t0 + (k * 0.1) / slow; if (ts > t) break;
    const f = front(ts);
    if (f > 0 && f < W) line(ctx, [[f, ty + 18], [f, ty + 34]], { color: C.silver, w: 1.4, alpha: 0.8 });
    if (ts > tc) { const bx = ballX(ts); if (bx < W + rb) circle(ctx, bx, ty - rb, rb, { stroke: C.silver, w: 1, alpha: 0.32 }); }
  }
  mtext(ctx, 'strobe interval 0.1 s', 70, ty + 58, { size: 21, color: C.silver, alpha: E.outCubic(prog(t, t0 + 0.4, t0 + 1)), italicAll: true });
  const f = front(t), bx = ballX(t), vM = t < tc ? v0 : v1, vm = t < tc ? 0 : vb;
  const c = cart(ctx, f, ty, { len, rw, angle: f / rw });
  ballD(ctx, bx, ty - rb, rb, (bx - bx0) / rb);
  impact(ctx, contact, ty - rb, prog(t, tc, tc + 0.8), 0.9);
  const va = E.outCubic(prog(t, 1.2, 1.8));
  if (f > 40) {
    arrow(ctx, f - len * 0.7, c.top - 46, f - len * 0.7 + vM * 12, c.top - 46, { w: 2.2, alpha: va });
    mtext(ctx, `*v*_M = ${vM.toFixed(1)} m/s`, f - len * 0.7, c.top - 82, { size: 25, alpha: va });
  }
  if (bx < W - 40) {
    if (vm > 0) arrow(ctx, bx, ty - 2 * rb - 30, bx + vm * 12, ty - 2 * rb - 30, { w: 2.2, alpha: va });
    mtext(ctx, `*v*_m = ${vm.toFixed(1)} m/s`, bx - 10, ty - 2 * rb - 66, { size: 25, alpha: va });
  }

  // ---- (a) velocity vs time ----
  const ax = E.outCubic(prog(t, 0.6, 1.4)), tau = clamp(real(t), 0, 2.4);
  const X0 = 230, X1 = 900, Y0 = 940, Y1 = 700, Tm = 2.4;
  const X = (s) => X0 + (s / Tm) * (X1 - X0), Y = (v) => Y0 - (v / 25) * (Y0 - Y1);
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [0, 0.5, 1, 1.5, 2], yt: [0, 10, 20], X, Y, alpha: ax, xfmt: v => v.toFixed(1) });
  mtext(ctx, '*t* (s)', X1 + 16, Y0, { size: 23, alpha: ax });
  mtext(ctx, '*v* (m/s)', X0, Y1 - 26, { size: 23, alpha: ax });
  mtext(ctx, '(a)', X0 - 72, Y1 - 26, { size: 23, color: C.silver, alpha: ax, italicAll: true });
  const vMf = (s) => v0 + (v1 - v0) * sstep(tauC - 0.012, tauC + 0.012, s), vmf = (s) => vb * sstep(tauC - 0.012, tauC + 0.012, s);
  if (tau > 0) { plot(ctx, vMf, 0, tau, X, Y, { step: 0.004 }); plot(ctx, vmf, 0, tau, X, Y, { step: 0.004, color: C.silver, dash: [10, 6] }); }
  const la = E.outCubic(prog(t, tc + 0.3, tc + 0.9));
  mtext(ctx, '*v*_M', X(Tm) - 10, Y(v1) - 22, { size: 23, align: 'right', alpha: la });
  mtext(ctx, '*v*_m', X(Tm) - 10, Y(vb) - 22, { size: 23, color: C.silver, align: 'right', alpha: la });

  // ---- (b) momentum before / after ----
  const bxa = 1250, bxb = 1500, bw = 150, PY0 = 940, PY1 = 700, Pm = 15;
  const PYs = (p) => PY0 - (p / Pm) * (PY0 - PY1);
  const ba = E.outCubic(prog(t, 1.0, 1.6));
  axes(ctx, { x0: 1150, x1: 1800, y0: PY0, y1: PY1, xt: [], yt: [0, 5, 10, 15], X: (v) => v, Y: PYs, alpha: ba });
  mtext(ctx, '*p* (kN·s)', 1150, PY1 - 26, { size: 23, alpha: ba });
  mtext(ctx, '(b)', 1078, PY1 - 26, { size: 23, color: C.silver, alpha: ba, italicAll: true });
  const pM0 = M * v0 / 1000, pM1 = M * v1 / 1000, pm1 = m * vb / 1000;
  const bar = (x, p0, p1, fill, hatch) => {
    const r = new Path2D(); r.rect(x, PYs(p1), bw, PYs(p0) - PYs(p1));
    if (fill) { ctx.save(); ctx.fillStyle = fill; ctx.fill(r); ctx.restore(); }
    if (hatch) hatchFill(ctx, r, C.ink, 0.55, 8);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke(r); ctx.restore();
  };
  if (ba > 0) {
    bar(bxa, 0, pM0 * E.outCubic(prog(t, 1.2, 2.0)), null, true);
    mtext(ctx, 'before', bxa + bw / 2, PY0 + 28, { size: 22, color: C.silver, align: 'center', alpha: ba, italicAll: true });
  }
  const g2 = E.outCubic(prog(t, tc + 0.1, tc + 0.9));
  if (g2 > 0) {
    bar(bxb, 0, pM1 * g2, null, true);
    bar(bxb, pM1 * g2, (pM1 + pm1) * g2, C.ink, false);
    mtext(ctx, 'after', bxb + bw / 2, PY0 + 28, { size: 22, color: C.silver, align: 'center', alpha: g2, italicAll: true });
    line(ctx, [[bxa - 24, PYs(pM0)], [bxb + bw + 24, PYs(pM0)]], { w: 1.2, dash: [6, 6], alpha: g2 });
    mtext(ctx, 'total conserved', bxb + bw + 34, PYs(pM0) - 2, { size: 21, alpha: g2, italicAll: true });
    mtext(ctx, `*p*_m = ${pm1.toFixed(2)}`, bxb + bw + 34, PYs(pM0) + 34, { size: 21, color: C.silver, alpha: g2 });
    mtext(ctx, `*p*_M = ${pM1.toFixed(2)}`, bxb + bw + 34, PYs(pM1 / 2), { size: 21, color: C.silver, alpha: g2 });
  }
}

// ================= §3 IMPULSE: mass-spring impact, two bumpers =================
export function sImpulse(ctx, t) {
  bg(ctx, { gx: 500 });
  const wallX = 900, tC = 2.0, msPerS = 20, v0 = 5; // v0 in mm/ms; 1 px = 1 mm
  const tau = (t - tC) * msPerS;
  const rows = [
    { y: 540, L: 60, T: 10, Fp: 707, coils: 4, amp: 12, lab: '(a) rigid bumper' },
    { y: 830, L: 200, T: 50, Fp: 141, coils: 9, amp: 14, lab: '(b) KickShift module' },
  ];
  const ga = E.outCubic(prog(t, 0.2, 0.9)), swap = prog(t, 8.6, 10.0);
  rows.forEach((r, i) => {
    ground(ctx, 110, wallX, r.y, ga); wall(ctx, wallX, r.y - 200, r.y, ga);
    let crush = 0, F = 0;
    if (tau < 0) crush = tau * v0;
    else if (tau < r.T) { crush = v0 * tau - (v0 / 2) * (tau - (r.T / Math.PI) * Math.sin(Math.PI * tau / r.T)); F = r.Fp * Math.sin(Math.PI * tau / r.T); }
    else crush = v0 * r.T / 2;
    if (i === 1 && swap > 0) crush = lerp(crush, 0, E.inOutCubic(swap));
    const sFront = tau < 0 ? wallX + tau * v0 : wallX, sLen = tau < 0 ? r.L : r.L - Math.max(0, crush);
    const bFront = sFront - sLen, rw = 14;
    const c = cart(ctx, bFront, r.y, { len: 230, h: 70, rw, angle: bFront / rw, label: 'M' });
    spring(ctx, bFront, sFront, c.midY, { coils: r.coils, amp: r.amp });
    mtext(ctx, r.lab, 120, r.y - 170, { size: 26, alpha: ga });
    if (tau > 0 && tau < r.T + 4) mtext(ctx, `*F* = ${Math.round(F)} kN`, sFront - sLen / 2, c.top - 26, { size: 24, align: 'center', alpha: 1 - prog(tau, r.T, r.T + 4) });
    const ra = E.outCubic(prog(tau, r.T + 2, r.T + 12));
    mtext(ctx, `Δ*t* = ${r.T} ms     *F*_max = ${r.Fp} kN     crush = ${v0 * r.T / 2} mm`, 120, r.y + 46, { size: 23, color: C.silver, alpha: ra });
  });
  if (swap > 0) mtext(ctx, 'crushed module replaced (60 s)', wallX - 30, rows[1].y - 170, { size: 23, align: 'right', color: C.silver, alpha: E.outCubic(prog(swap, 0, 0.3)), italicAll: true });

  const x0 = 1110, x1 = 1800, y0 = 860, y1 = 360, tmax = 60, Fmax = 800;
  const X = (ms) => x0 + (ms / tmax) * (x1 - x0), Y = (kN) => y0 - (kN / Fmax) * (y0 - y1);
  axes(ctx, { x0, x1, y0, y1, xt: [0, 20, 40, 60], yt: [0, 200, 400, 600, 800], X, Y, xl: 'time *t* (ms)', yl: 'force *F* (kN)', alpha: E.outCubic(prog(t, 0.5, 1.3)) });
  const cur = clamp(tau, 0, tmax);
  const curve = (peak, dur, rigid) => {
    const end = Math.min(cur, dur); if (end <= 0) return;
    const p = new Path2D(); p.moveTo(X(0), Y(0));
    for (let ms = 0; ms <= end; ms += dur / 160) p.lineTo(X(ms), Y(peak * Math.sin(Math.PI * ms / dur)));
    p.lineTo(X(end), Y(peak * Math.sin(Math.PI * end / dur)));
    const area = new Path2D(p); area.lineTo(X(end), Y(0)); area.closePath();
    if (rigid) hatchFill(ctx, area, C.ink, 0.4, 8); else { ctx.save(); ctx.fillStyle = 'rgba(185,189,195,0.2)'; ctx.fill(area); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = rigid ? C.ink : C.silver; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; if (!rigid) ctx.setLineDash([12, 7]); ctx.stroke(p); ctx.restore();
  };
  curve(707, 10, true); curve(141, 50, false);
  if (cur > 0 && cur < tmax) line(ctx, [[X(cur), y1], [X(cur), y0]], { color: C.mid, w: 1, dash: [3, 5] });
  mtext(ctx, '(a) rigid: 707 kN', X(5) + 20, Y(707) + 4, { size: 24, alpha: E.outCubic(prog(cur, 5, 10)) });
  mtext(ctx, '(b) KickShift: 141 kN', X(25), Y(141) - 26, { size: 24, color: C.silver, align: 'center', alpha: E.outCubic(prog(cur, 25, 32)) });
  const s = E.outCubic(prog(t, 5.4, 6.2));
  if (s > 0) {
    line(ctx, [[X(30), Y(707)], [X(54), Y(707)]], { color: C.mid, dash: [4, 6], alpha: s });
    line(ctx, [[X(40), Y(141)], [X(54), Y(141)]], { color: C.mid, dash: [4, 6], alpha: s });
    arrow(ctx, X(52), Y(700), X(52), Y(150), { alpha: s, w: 2, head: 16 });
    mtext(ctx, '−80% peak force', X(50), Y(440), { size: 29, align: 'right', alpha: s });
    mtext(ctx, 'equal areas: same impulse', X(50), Y(440) + 36, { size: 22, color: C.silver, align: 'right', alpha: s, italicAll: true });
  }
}

// ================= §4 KINETIC ENERGY: braking-distance demo + E(v) =================
const KE = (kmh) => 0.5 * 900 * Math.pow(kmh / 3.6, 2) / 1000;
export function sEnergy(ctx, t) {
  bg(ctx, { gx: 520, gy: 200 });
  const lanes = [{ v: 30, y: 500 }, { v: 60, y: 660 }, { v: 80, y: 820 }];
  const ppm = 28, x0 = 170, g = 9.81, mu = 1, tb = 3.8, slow = 0.6;
  const ga = E.outCubic(prog(t, 0.3, 1.0));
  line(ctx, [[x0, 390], [x0, 850]], { color: C.silver, w: 1.2, dash: [5, 6], alpha: ga });
  mtext(ctx, 'brakes on', x0, 370, { size: 22, color: C.silver, align: 'center', alpha: ga, italicAll: true });
  lanes.forEach((L) => {
    ground(ctx, 60, 990, L.y, ga);
    const v = L.v / 3.6, a = mu * g, ts = v / a, d = v * v / (2 * a), tau = (t - tb) * slow;
    const s = tau < 0 ? v * tau : tau < ts ? v * tau - 0.5 * a * tau * tau : d;
    const fx = x0 + s * ppm;
    if (tau > 0) line(ctx, [[x0, L.y - 3], [Math.max(x0, fx - 4.5 * ppm * 0.18), L.y - 3]], { color: C.silver, w: 3, alpha: 0.55, cap: 'butt' });
    if (fx > -10) cart(ctx, fx, L.y, { len: 4.5 * ppm, h: 34, rw: 9, label: null, angle: fx / 9 });
    mtext(ctx, `*v*_0 = ${L.v} km/h`, 60, L.y - 82, { size: 24, alpha: ga });
    const da = E.outCubic(prog(tau, ts, ts + 0.5));
    if (da > 0) dim(ctx, x0, L.y + 30, x0 + d * ppm, L.y + 30, `*d* = ${d.toFixed(1)} m`, { alpha: da, off: 24, size: 23 });
  });
  mtext(ctx, '2× speed  →  4× energy  →  4× stopping distance', 520, 952, { size: 26, align: 'center', alpha: E.outCubic(prog(t, 8.2, 8.9)), italicAll: true });

  const X0 = 1110, X1 = 1800, Y0 = 860, Y1 = 360, vmax = 100, kmax = 360;
  const X = (k) => X0 + (k / vmax) * (X1 - X0), Y = (e) => Y0 - (e / kmax) * (Y0 - Y1);
  const pa = E.outCubic(prog(t, 0.5, 1.3));
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [0, 20, 40, 60, 80, 100], yt: [0, 100, 200, 300], X, Y, xl: 'speed *v* (km/h)', yl: 'kinetic energy *E*_k (kJ)', alpha: pa });
  const vc = 100 * E.inOutSine(prog(t, 1.2, 3.6));
  const capA = E.outCubic(prog(t, 3.0, 3.6));
  if (capA > 0) {
    const r = new Path2D(); r.rect(X(80), Y1, X(100) - X(80), Y0 - Y1);
    hatchFill(ctx, r, C.ink, 0.2 * capA, 12);
    line(ctx, [[X(80), Y1], [X(80), Y0]], { w: 1.4, alpha: capA });
    mtext(ctx, 'arena cap', X(90), Y1 + 34, { size: 23, align: 'center', alpha: capA, italicAll: true });
  }
  if (vc > 0.2) plot(ctx, (k) => KE(k), 0, vc, X, Y, { step: 0.5, w: 2.6 });
  lanes.forEach((L) => {
    const a = E.outCubic(prog(vc, L.v, L.v + 4)); if (a <= 0) return;
    circle(ctx, X(L.v), Y(KE(L.v)), 8, { fill: '#050505', w: 1.8, alpha: a });
    mtext(ctx, `${Math.round(KE(L.v))} kJ`, X(L.v) - 16, Y(KE(L.v)) - 28, { size: 25, align: 'right', alpha: a });
  });
  const rel = E.outCubic(prog(t, 8.2, 8.9));
  if (rel > 0) for (const k of [30, 60]) {
    line(ctx, [[X(k), Y(KE(k))], [X(k), Y0]], { color: C.silver, dash: [3, 6], alpha: rel });
    line(ctx, [[X0, Y(KE(k))], [X(k), Y(KE(k))]], { color: C.silver, dash: [3, 6], alpha: rel });
  }
}

// ================= §5 COLLISION ANGLES: contact-normal geometry + θ(d) =================
export const AIM = { ppm: 100, B: [860, 610], R: 1.5, r: 0.75, shots: [0, 0.7, -0.7] };
export function sAim(ctx, t) {
  bg(ctx, { gx: 860, gy: 300, glow: 0.05 });
  const { ppm, B, R, r, shots } = AIM;
  const Rp = R * ppm, rp = r * ppm, sum = Rp + rp, halfW = 100, clipX = 1180;
  const T0 = 1.2, SPAN = 3.2, APP = 1.0;
  const geo = (d) => { const dp = d * ppm, cnx = B[0] - Math.sqrt(sum * sum - dp * dp), cny = B[1] + dp; return { cnx, cny, n: [(B[0] - cnx) / sum, (B[1] - cny) / sum] }; };
  const active = clamp(Math.floor((t - T0) / SPAN), 0, shots.length - 1);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, clipX, H); ctx.clip();
  for (let k = 0; k < active; k++) {
    const { n } = geo(shots[k]);
    line(ctx, [B, [B[0] + n[0] * 600, B[1] + n[1] * 600]], { color: C.silver, w: 1.4, dash: [2, 8], alpha: 0.7 });
  }
  const d = shots[active], { cnx, cny, n } = geo(d), ts = T0 + active * SPAN, tc = ts + APP;
  let ncx, bpos = B;
  if (t < tc) ncx = lerp(cnx - 900, cnx, prog(t, ts - 0.2, tc));
  else { const tau = t - tc; ncx = cnx + 90 * E.outCubic(clamp(tau / 0.8)); const dd = Math.min(tau * 700, 900); bpos = [B[0] + n[0] * dd, B[1] + n[1] * dd]; }
  if (t < T0 - 0.2) ncx = cnx - 900;
  // body: rectangle with a circular strike face of radius R
  const ang = Math.asin(halfW / Rp), xs = ncx + Rp * Math.cos(ang);
  ctx.save(); ctx.beginPath(); ctx.moveTo(xs - 520, cny - halfW); ctx.lineTo(xs, cny - halfW); ctx.arc(ncx, cny, Rp, -ang, ang); ctx.lineTo(xs - 520, cny + halfW); ctx.closePath();
  const gr = ctx.createLinearGradient(0, cny - halfW, 0, cny + halfW); gr.addColorStop(0, '#2c2e33'); gr.addColorStop(1, '#131416');
  ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();
  mtext(ctx, '*M*', xs - 250, cny, { size: 40, align: 'center' });
  line(ctx, [[xs - 520, cny], [xs + 60, cny]], { color: C.mid, w: 1, dash: [10, 4, 2, 4] });
  const ov = E.outCubic(prog(t, tc, tc + 0.5));
  if (ov > 0) {
    circle(ctx, cnx, cny, Rp, { stroke: C.silver, w: 1.2, dash: [5, 6], alpha: ov * 0.8 });
    line(ctx, [[cnx - 8, cny], [cnx + 8, cny]], { w: 1.4, alpha: ov }); line(ctx, [[cnx, cny - 8], [cnx, cny + 8]], { w: 1.4, alpha: ov });
    const ra = d >= 0 ? 2.3 : -2.3;
    line(ctx, [[cnx, cny], [cnx + Rp * Math.cos(ra), cny + Rp * Math.sin(ra)]], { color: C.silver, w: 1.2, alpha: ov });
    mtext(ctx, '*R*', cnx + Rp * 0.55 * Math.cos(ra) - 24, cny + Rp * 0.55 * Math.sin(ra), { size: 28, alpha: ov });
    const P = [cnx + n[0] * Rp, cny + n[1] * Rp];
    line(ctx, [[cnx, cny], B], { color: C.silver, w: 1.2, dash: [4, 5], alpha: ov });
    line(ctx, [[P[0] - 30, P[1]], [P[0] + 300, P[1]]], { color: C.mid, w: 1.1, dash: [4, 6], alpha: ov });
    arrow(ctx, P[0], P[1], P[0] + n[0] * 380 * ov, P[1] + n[1] * 380 * ov, { w: 2.4, head: 20 });
    const tip = [P[0] + n[0] * 380, P[1] + n[1] * 380], up = n[1] < -0.01, ly = tip[1] + (up ? -30 : 32);
    mtext(ctx, '*n*', tip[0] + 14, ly, { size: 34, alpha: ov }); hat(ctx, tip[0] + 23, ly - 14, 34, ov);
    const th = Math.atan2(n[1], n[0]);
    if (Math.abs(th) > 0.01) {
      ctx.save(); ctx.globalAlpha = ov; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(P[0], P[1], 150, Math.min(0, th), Math.max(0, th)); ctx.stroke(); ctx.restore();
      mtext(ctx, '*θ*', P[0] + 172 * Math.cos(th / 2), P[1] + 172 * Math.sin(th / 2), { size: 30, alpha: ov });
    }
    circle(ctx, P[0], P[1], 4.5, { fill: C.ink, stroke: null, alpha: ov });
    if (Math.abs(d) > 0.01) {
      const dx = B[0] + rp + 150;
      line(ctx, [[xs + 30, cny], [dx + 14, cny]], { color: C.mid, w: 1, dash: [2, 5], alpha: ov });
      line(ctx, [[B[0], B[1]], [dx + 14, B[1]]], { color: C.mid, w: 1, dash: [2, 5], alpha: ov });
      dim(ctx, dx, cny, dx, B[1], '*d*', { alpha: ov, off: 14, size: 28 });
    }
  }
  ballD(ctx, bpos[0], bpos[1], rp, (bpos[0] - B[0]) / rp);
  if (ov > 0 && t < tc + 0.7) impact(ctx, cnx + n[0] * Rp, cny + n[1] * Rp, prog(t, tc, tc + 0.7), 0.45);
  ctx.restore();

  // ---- θ(d) ----
  const X0 = 1300, X1 = 1800, Y0 = 860, Y1 = 380, dm = 2.25;
  const X = (x) => X0 + ((x + dm) / (2 * dm)) * (X1 - X0), Y = (deg) => Y0 - ((deg + 90) / 180) * (Y0 - Y1);
  const pa = E.outCubic(prog(t, 0.4, 1.2));
  const sg = (v) => (v < 0 ? '−' + Math.abs(v) : String(v));
  axes(ctx, { x0: X0, x1: X1, y0: Y0, y1: Y1, xt: [-2, -1, 0, 1, 2], yt: [-90, -45, 0, 45, 90], X, Y, xl: 'offset *d* (m)', yl: 'launch angle *θ* (°)', alpha: pa, xfmt: sg, yfmt: sg, zero: true });
  // sign: ball deflects up the page (θ > 0) when the ball centre sits above the car's axis (d > 0)
  const th = (x) => Math.asin(clamp(x / (R + r), -1, 1)) * 180 / Math.PI;
  const dp = E.inOutSine(prog(t, 0.8, 2.4));
  if (dp > 0) plot(ctx, th, -dm, -dm + 2 * dm * dp, X, Y, { step: 0.01, w: 2.4 });
  shots.forEach((sd, k) => {
    const tk = T0 + k * SPAN + APP, a = E.outCubic(prog(t, tk, tk + 0.4)); if (a <= 0) return;
    const isNow = k === active, dv = sd;
    circle(ctx, X(dv), Y(th(dv)), isNow ? 9 : 7, { fill: isNow ? C.ink : '#050505', w: 1.8, alpha: a });
    if (isNow) {
      line(ctx, [[X(dv), Y(th(dv))], [X(dv), Y0]], { color: C.silver, dash: [3, 5], alpha: a });
      line(ctx, [[X0, Y(th(dv))], [X(dv), Y(th(dv))]], { color: C.silver, dash: [3, 5], alpha: a });
      const lbl = `*d* = ${dv === 0 ? '0' : (dv < 0 ? '−' : '') + Math.abs(dv).toFixed(1) + ' m'},  *θ* = ${th(dv) < -0.5 ? '−' : ''}${Math.abs(th(dv)).toFixed(0)}°`;
      mtext(ctx, lbl, X(dv) + (dv > 0 ? -16 : 16), Y(th(dv)) + (dv > 0 ? -34 : 34), { size: 23, align: dv > 0 ? 'right' : 'left', alpha: a });
    }
  });
}

// ================= §6 TRACKING: kinematics from 120 Hz samples =================
const FIELD = { x0: 130, y0: 340, w: 1040, mx: 60, my: 32 };
const pathR = (s) => [30 + 22 * Math.sin(0.55 * s), 16 + 11 * Math.sin(1.1 * s + 0.6)];
const pathV = (s) => [22 * 0.55 * Math.cos(0.55 * s), 11 * 1.1 * Math.cos(1.1 * s + 0.6)];
const pathA = (s) => [-22 * 0.3025 * Math.sin(0.55 * s), -11 * 1.21 * Math.sin(1.1 * s + 0.6)];
export function sArena(ctx, t) {
  bg(ctx, { gx: 650, gy: 300, glow: 0.05 });
  const F = FIELD, k = F.w / F.mx, PX = (p) => [F.x0 + p[0] * k, F.y0 + p[1] * k];
  const fa = E.outCubic(prog(t, 0.2, 1.0));
  ctx.save(); ctx.globalAlpha = fa;
  ctx.strokeStyle = 'rgba(242,242,238,0.07)'; ctx.lineWidth = 1;
  for (let x = 0; x <= F.mx; x += 5) { ctx.beginPath(); ctx.moveTo(F.x0 + x * k, F.y0); ctx.lineTo(F.x0 + x * k, F.y0 + F.my * k); ctx.stroke(); }
  for (let y = 0; y <= F.my; y += 4) { ctx.beginPath(); ctx.moveTo(F.x0, F.y0 + y * k); ctx.lineTo(F.x0 + F.w, F.y0 + y * k); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(242,242,238,0.6)'; ctx.lineWidth = 1.4; ctx.strokeRect(F.x0, F.y0, F.w, F.my * k);
  ctx.beginPath(); ctx.moveTo(F.x0 + F.w / 2, F.y0); ctx.lineTo(F.x0 + F.w / 2, F.y0 + F.my * k); ctx.stroke();
  ctx.beginPath(); ctx.arc(F.x0 + F.w / 2, F.y0 + F.my * k / 2, 6 * k, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  for (let x = 0; x <= F.mx; x += 10) mtext(ctx, String(x), F.x0 + x * k, F.y0 + F.my * k + 24, { size: 19, color: C.silver, align: 'center', alpha: fa });
  mtext(ctx, '*x* (m)', F.x0 + F.w + 16, F.y0 + F.my * k + 24, { size: 21, alpha: fa });
  const pads = [[8, 16], [52, 16]], s = t + 1.5, pos = pathR(s);
  pads.forEach((p) => {
    const [cx, cy] = PX(p), near = Math.hypot(pos[0] - p[0], pos[1] - p[1]) < 4;
    ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.fillStyle = near ? 'rgba(242,242,238,0.16)' : 'rgba(242,242,238,0.04)';
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? ctx.lineTo(cx + Math.cos(a) * 2.6 * k, cy + Math.sin(a) * 2.6 * k) : ctx.moveTo(cx + 2.6 * k, cy); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  });
  mtext(ctx, 'charging pad', PX([8, 16])[0], PX([8, 16])[1] + 3.8 * k, { size: 19, color: C.silver, align: 'center', alpha: fa, italicAll: true });
  const ta = E.outCubic(prog(t, 0.8, 1.4));
  [[-2, -2], [62, -2], [-2, 34], [62, 34]].forEach((cp) => {
    const [cx, cy] = PX(cp), [px, py] = PX(pos);
    line(ctx, [[cx, cy], [px, py]], { w: 0.8, alpha: 0.16 * ta });
    ctx.save(); ctx.globalAlpha = ta; ctx.fillStyle = '#050505'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.rect(cx - 9, cy - 7, 18, 14); ctx.fill(); ctx.stroke(); ctx.restore();
  });
  for (let i = 0; i < 300; i += 4) {
    const ss = s - i / 120; if (ss < 1.5) break;
    const [x, y] = PX(pathR(ss)); circle(ctx, x, y, 2.2, { fill: C.ink, stroke: null, alpha: ta * (1 - i / 300) * 0.9 });
  }
  const v = pathV(s), a = pathA(s), sp = Math.hypot(v[0], v[1]), am = Math.hypot(a[0], a[1]);
  const [px, py] = PX(pos), hd = Math.atan2(v[1], v[0]);
  const cross = v[0] * a[1] - v[1] * a[0], rho = sp * sp * sp / Math.max(1e-6, Math.abs(cross));
  const nrm = [-v[1] / sp * Math.sign(cross), v[0] / sp * Math.sign(cross)];
  const oa = ta * clamp((40 - rho) / 20);
  if (oa > 0) {
    const cc = [pos[0] + nrm[0] * rho, pos[1] + nrm[1] * rho], [ccx, ccy] = PX(cc);
    circle(ctx, ccx, ccy, rho * k, { stroke: C.silver, w: 1, dash: [4, 6], alpha: oa * 0.8 });
    line(ctx, [[ccx, ccy], [px, py]], { color: C.silver, w: 1, alpha: oa });
    mtext(ctx, `*ρ* = ${rho.toFixed(1)} m`, (ccx + px) / 2 + 12, (ccy + py) / 2, { size: 22, color: C.silver, alpha: oa });
  }
  ctx.save(); ctx.globalAlpha = ta; ctx.translate(px, py); ctx.rotate(hd);
  ctx.beginPath(); ctx.roundRect(-2.25 * k, -1 * k, 4.5 * k, 2 * k, 0.5 * k); ctx.fillStyle = '#1d1f22'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1.2 * k, -0.6 * k); ctx.lineTo(2.0 * k, 0); ctx.lineTo(1.2 * k, 0.6 * k); ctx.strokeStyle = C.silver; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
  arrow(ctx, px, py, px + v[0] * 7, py + v[1] * 7, { w: 2.4, alpha: ta, head: 16 });
  mtext(ctx, '*v*', px + v[0] * 7 + 10, py + v[1] * 7 - 16, { size: 28, alpha: ta, weight: 700 });
  arrow(ctx, px, py, px + a[0] * 9, py + a[1] * 9, { w: 2, color: C.silver, alpha: ta, head: 14 });
  mtext(ctx, '*a*', px + a[0] * 9 + 10, py + a[1] * 9 + 14, { size: 28, color: C.silver, alpha: ta, weight: 700 });

  const X0 = 1330, X1 = 1800, Tm = 10, X = (u) => X0 + (u / Tm) * (X1 - X0);
  const g1 = { y0: 590, y1: 360, max: 20 }, g2 = { y0: 870, y1: 680, max: 16 };
  const Y1f = (q) => g1.y0 - q / g1.max * (g1.y0 - g1.y1), Y2f = (q) => g2.y0 - q / g2.max * (g2.y0 - g2.y1);
  const pa = E.outCubic(prog(t, 0.6, 1.4));
  axes(ctx, { x0: X0, x1: X1, y0: g1.y0, y1: g1.y1, xt: [0, 5, 10], yt: [0, 10, 20], X, Y: Y1f, alpha: pa });
  axes(ctx, { x0: X0, x1: X1, y0: g2.y0, y1: g2.y1, xt: [0, 5, 10], yt: [0, 8, 16], X, Y: Y2f, alpha: pa, xl: 'time *t* (s)' });
  mtext(ctx, '|*v*| (m/s)', X0, g1.y1 - 24, { size: 22, alpha: pa });
  mtext(ctx, '|*a*| (m/s²)', X0, g2.y1 - 24, { size: 22, alpha: pa });
  const tm = clamp(t - 0.5, 0, Tm);
  if (tm > 0) {
    plot(ctx, (u) => { const q = pathV(u + 2); return Math.hypot(q[0], q[1]); }, 0, tm, X, Y1f, { step: 0.02 });
    plot(ctx, (u) => { const q = pathA(u + 2); return Math.hypot(q[0], q[1]); }, 0, tm, X, Y2f, { step: 0.02, color: C.silver, dash: [9, 5] });
    mtext(ctx, `${sp.toFixed(1)} m/s`, X1 - 8, g1.y1 + 26, { size: 22, align: 'right', alpha: pa });
    mtext(ctx, `${am.toFixed(1)} m/s²`, X1 - 8, g2.y1 + 26, { size: 22, align: 'right', color: C.silver, alpha: pa });
  }
}

// ================= §7 COST: power over a match; energy is the area =================
let traceCache = null;
function powerTrace() {
  if (traceCache) return traceCache;
  const R = rng(42), N = 1201, dt = 0.5, P = new Float64Array(N);
  for (let i = 0; i < N; i++) P[i] = 2.5;
  for (let k = 0; k < 40; k++) {
    const tk = 8 + k * 14.6 + R() * 6, A = 90 + R() * 60, D = 2 + R() * 1.5;
    const tr = tk + D + 1.5 + R() * 4, Ar = 25 + R() * 30, Dr = 1.4 + R() * 0.8;
    for (let i = 0; i < N; i++) {
      const s = i * dt;
      if (s >= tk && s <= tk + D) P[i] += A * Math.sin(Math.PI * (s - tk) / D);
      if (s >= tr && s <= tr + Dr) P[i] -= Ar * Math.sin(Math.PI * (s - tr) / Dr);
    }
  }
  const En = new Float64Array(N); for (let i = 1; i < N; i++) En[i] = En[i - 1] + 0.5 * (P[i] + P[i - 1]) * dt / 3600;
  const kk = 1.5 / En[N - 1];
  for (let i = 0; i < N; i++) { P[i] *= kk; En[i] *= kk; }
  traceCache = { P, E: En, dt, N };
  return traceCache;
}
export function sCost(ctx, t) {
  bg(ctx, { gx: 700 });
  const tr = powerTrace(), X0 = 260, X1 = 1300, Tm = 600, X = (s) => X0 + (s / Tm) * (X1 - X0);
  const pg = { y0: 600, y1: 340, lo: -50, hi: 125 }, eg = { y0: 900, y1: 700, hi: 1.6 };
  const YP = (p) => pg.y0 - ((p - pg.lo) / (pg.hi - pg.lo)) * (pg.y0 - pg.y1), YE = (e) => eg.y0 - (e / eg.hi) * (eg.y0 - eg.y1);
  const pa = E.outCubic(prog(t, 0.3, 1.1)), xt = [0, 120, 240, 360, 480, 600];
  axes(ctx, { x0: X0, x1: X1, y0: pg.y0, y1: pg.y1, xt, yt: [-50, 0, 50, 100], X, Y: YP, alpha: pa, xfmt: () => '', yfmt: v => (v < 0 ? '−' + Math.abs(v) : String(v)), zero: true });
  axes(ctx, { x0: X0, x1: X1, y0: eg.y0, y1: eg.y1, xt, yt: [0, 0.5, 1, 1.5], X, Y: YE, alpha: pa, xl: 'match time *t* (s)', yfmt: v => v.toFixed(1) });
  mtext(ctx, '*P* (kW)', X0, pg.y1 - 24, { size: 22, alpha: pa });
  mtext(ctx, '*E* (kWh)', X0, eg.y1 - 24, { size: 22, alpha: pa });
  const cur = Tm * E.inOutSine(prog(t, 1.0, 7.6)), n = Math.min(tr.N - 1, Math.floor(cur / tr.dt));
  if (n > 1) {
    const pos = new Path2D(), neg = new Path2D(), curve = new Path2D();
    pos.moveTo(X(0), YP(0)); neg.moveTo(X(0), YP(0));
    for (let i = 0; i <= n; i++) {
      const s = i * tr.dt, p = tr.P[i];
      pos.lineTo(X(s), YP(Math.max(0, p))); neg.lineTo(X(s), YP(Math.min(0, p)));
      i ? curve.lineTo(X(s), YP(p)) : curve.moveTo(X(s), YP(p));
    }
    pos.lineTo(X(n * tr.dt), YP(0)); pos.closePath(); neg.lineTo(X(n * tr.dt), YP(0)); neg.closePath();
    ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.22)'; ctx.fill(pos); ctx.restore();
    hatchFill(ctx, neg, C.silver, 0.7, 5);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.stroke(curve); ctx.restore();
    const ep = []; for (let i = 0; i <= n; i += 2) ep.push([X(i * tr.dt), YE(tr.E[i])]); ep.push([X(n * tr.dt), YE(tr.E[n])]);
    line(ctx, ep, { w: 2.6 });
    circle(ctx, X(n * tr.dt), YE(tr.E[n]), 6, { fill: C.ink, stroke: null });
    mtext(ctx, `${tr.E[n].toFixed(2)} kWh`, X(n * tr.dt) - 14, YE(tr.E[n]) - 26, { size: 24, align: 'right' });
    if (cur < Tm - 0.5) line(ctx, [[X(cur), pg.y1], [X(cur), eg.y0]], { color: C.mid, w: 1, dash: [3, 5] });
  }
  const la = E.outCubic(prog(t, 3.0, 3.6));
  mtext(ctx, 'acceleration', X(30), YP(116), { size: 21, alpha: la, italicAll: true });
  mtext(ctx, 'regenerative braking returns energy', X(150), YP(-40), { size: 21, color: C.silver, alpha: la, italicAll: true });
}

// ================= §8 ROADMAP: programme schedule =================
export const PHASES = [
  { a: 0, b: 6, name: 'Build', sub: 'two prototype cars' },
  { a: 6, b: 9, name: 'Break', sub: '1,000-hit bumper test' },
  { a: 9, b: 12, name: 'Play', sub: '50 full test matches' },
  { a: 12, b: 24, name: 'Launch', sub: 'pilot league and venue' },
];
export function sRoad(ctx, t) {
  bg(ctx, { gy: 300, glow: 0.05 });
  const X0 = 440, X1 = 1780, Mx = 24, X = (mo) => X0 + (mo / Mx) * (X1 - X0);
  const rowY = (i) => 420 + i * 115, bh = 46, y0 = 890;
  const pa = E.outCubic(prog(t, 0.2, 1.0));
  ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = 'rgba(242,242,238,0.72)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(X0, y0); ctx.lineTo(X1, y0); ctx.stroke();
  for (let mo = 0; mo <= Mx; mo += 3) { ctx.beginPath(); ctx.moveTo(X(mo), y0); ctx.lineTo(X(mo), y0 - 9); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(242,242,238,0.07)'; ctx.lineWidth = 1;
  for (let mo = 3; mo <= Mx; mo += 3) { ctx.beginPath(); ctx.moveTo(X(mo), 350); ctx.lineTo(X(mo), y0); ctx.stroke(); }
  ctx.restore();
  for (let mo = 0; mo <= Mx; mo += 3) mtext(ctx, String(mo), X(mo), y0 + 28, { size: 21, color: C.silver, align: 'center', alpha: pa });
  mtext(ctx, 'months from funding', (X0 + X1) / 2, y0 + 64, { size: 24, align: 'center', alpha: pa, italicAll: true });
  const cur = Mx * E.inOutSine(prog(t, 1.0, 7.4));
  PHASES.forEach((ph, i) => {
    const y = rowY(i), la = E.outCubic(prog(t, 0.5 + i * 0.15, 1.1 + i * 0.15));
    mtext(ctx, ph.name, X0 - 40, y - 12, { size: 38, align: 'right', alpha: la });
    mtext(ctx, ph.sub, X0 - 40, y + 24, { size: 22, color: C.silver, align: 'right', alpha: la, italicAll: true });
    const end = clamp(cur, ph.a, ph.b); if (end <= ph.a) return;
    const r = new Path2D(); r.rect(X(ph.a), y - bh / 2, X(end) - X(ph.a), bh);
    if (i < 3) { ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.85)'; ctx.fill(r); ctx.restore(); }
    else hatchFill(ctx, r, C.ink, 0.6, 9);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.stroke(r); ctx.restore();
    if (cur >= ph.b) {
      const dx = X(ph.b), da = E.outCubic(prog(cur, ph.b, ph.b + 0.8));
      ctx.save(); ctx.globalAlpha = da; ctx.fillStyle = '#050505'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(dx, y - 17); ctx.lineTo(dx + 17, y); ctx.lineTo(dx, y + 17); ctx.lineTo(dx - 17, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    }
  });
  const sa = E.outCubic(prog(cur, 12, 13));
  line(ctx, [[X(12), 345], [X(12), y0]], { w: 1.4, dash: [6, 6], alpha: sa });
  mtext(ctx, 'seed funding covers months 0–12', X(12) + 14, 352, { size: 22, alpha: sa, italicAll: true });
  if (cur > 0 && cur < Mx) line(ctx, [[X(cur), 370], [X(cur), y0]], { color: C.mid, w: 1, dash: [3, 5] });
}

// ================= §9 THE ASK (donut) =================
export const FUNDS = [
  { pct: 50, label: 'prototype cars', col: '#F2F2EE' },
  { pct: 25, label: 'arena and tracking', col: '#B9BDC3' },
  { pct: 15, label: 'durability tests', col: '#80858B' },
  { pct: 10, label: 'safety', col: '#4A4D52' },
];
export function sAsk(ctx, t) {
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
