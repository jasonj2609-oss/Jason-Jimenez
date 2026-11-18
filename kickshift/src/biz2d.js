// Business slides: how KickShift makes money, what it costs, and the projected return.
// All figures are estimates for the pitch; the speaker script lists the assumptions.
import { clamp, lerp, prog, E, rng } from './util.js';
import { W, H, C, bg, mtext, arrow, line, circle, hatchFill, axes } from './slides2d.js';

const money = (k) => (k >= 1000 ? `$${(k / 1000).toFixed(k % 1000 ? 1 : 0)}M` : `$${Math.round(k)}K`);
export const VENUE = { players: 4, price: 20, matchesPerDay: 24, days: 350, staff: 120, space: 60, upkeep: 40, power: 2, monthly: 2, share: 0.10, pkgPrice: 400, pkgCost: 250 };
VENUE.revenue = VENUE.players * VENUE.price * VENUE.matchesPerDay * VENUE.days / 1000; // $K per year
VENUE.fees = VENUE.monthly * 12 + VENUE.share * VENUE.revenue;
VENUE.profit = VENUE.revenue - (VENUE.staff + VENUE.space + VENUE.upkeep + VENUE.power + VENUE.fees);

function node(ctx, x, y, w, h, title, sub, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(14,14,16,0.95)'; ctx.strokeStyle = 'rgba(242,242,238,0.75)'; ctx.lineWidth = 1.4;
  ctx.fillRect(x - w / 2, y - h / 2, w, h); ctx.strokeRect(x - w / 2, y - h / 2, w, h); ctx.restore();
  mtext(ctx, title, x, y - (sub ? 14 : 0), { size: 32, align: 'center', alpha: a });
  if (sub) mtext(ctx, sub, x, y + 22, { size: 20, color: C.silver, align: 'center', alpha: a, italicAll: true });
}
// "$" tokens travelling along a straight path
function dollars(ctx, x1, y1, x2, y2, t, n, alpha, color = C.ink) {
  if (alpha <= 0) return;
  for (let k = 0; k < n; k++) {
    const u = ((t * 0.32 + k / n) % 1), x = lerp(x1, x2, u), y = lerp(y1, y2, u);
    mtext(ctx, '$', x, y, { size: 22, align: 'center', color, alpha: alpha * Math.sin(Math.PI * u) });
  }
}
function flowLabel(ctx, x, y, a, l1, l2, align = 'center') {
  mtext(ctx, l1, x, y, { size: 24, align, alpha: a });
  if (l2) mtext(ctx, l2, x, y + 28, { size: 20, color: C.silver, align, alpha: a, italicAll: true });
}

// ================= §8 BUSINESS MODEL =================
export function sBiz(ctx, t) {
  bg(ctx, { gx: 600 });
  const a = (s) => E.outCubic(prog(t, s, s + 0.6));
  const K = [880, 360], V = [520, 600], P = [160, 840];
  // flows
  const f1 = a(1.6), f2 = a(2.4), f3 = a(3.2), f4 = a(4.0);
  line(ctx, [[P[0] + 60, P[1] - 40], [V[0] - 90, V[1] + 50]], { w: 1.2, color: 'rgba(242,242,238,0.35)', alpha: f1 });
  dollars(ctx, P[0] + 60, P[1] - 40, V[0] - 90, V[1] + 50, t, 4, f1);
  flowLabel(ctx, 400, 790, f1, '$20 a player, per match', 'pay to play');
  line(ctx, [[V[0] + 90, V[1] - 50], [K[0] - 100, K[1] + 50]], { w: 1.2, color: 'rgba(242,242,238,0.35)', alpha: f2 });
  dollars(ctx, V[0] + 90, V[1] - 50, K[0] - 100, K[1] + 50, t + 0.5, 4, f2);
  flowLabel(ctx, 760, 560, f2, '$400K arena package', '+ $2K a month + 10% of matches', 'left');
  arrow(ctx, K[0] - 140, K[1] + 64, V[0] + 50, V[1] - 66, { w: 1.4, color: C.silver, dash: [6, 6], head: 12, alpha: f3 });
  flowLabel(ctx, 470, 420, f3, 'cars, lanes, bumper shells', 'and software', 'right');
  line(ctx, [[K[0], K[1] - 50], [K[0], 230]], { w: 1.2, color: 'rgba(242,242,238,0.3)', dash: [4, 6], alpha: f4 });
  dollars(ctx, K[0], 220, K[0], K[1] - 50, t + 0.2, 2, f4 * 0.7, C.silver);
  flowLabel(ctx, K[0] + 24, 250, f4, 'sponsors and streaming', 'league, year 3 onward', 'left');
  node(ctx, ...K, 230, 96, 'KickShift', 'us', a(0.6));
  node(ctx, ...V, 230, 96, 'Venue', 'entertainment centre', a(1.0));
  node(ctx, ...P, 200, 80, 'Players', null, a(1.3));

  // ---- one venue, one year: waterfall ----
  const v = VENUE, x0 = 1180, x1 = 1810, y0 = 860, y1 = 360, max = 700;
  const Y = (k) => y0 - (k / max) * (y0 - y1), pa = a(4.6);
  axes(ctx, { x0, x1, y0, y1, xt: [], yt: [0, 200, 400, 600], X: (q) => q, Y, alpha: pa, yfmt: (k) => `$${k}K` });
  mtext(ctx, 'one venue, one year', x0, y1 - 40, { size: 24, alpha: pa, italicAll: true });
  const steps = [
    { k: 'revenue', v: v.revenue, base: 0, solid: true },
    { k: 'staff', v: -v.staff }, { k: 'space', v: -v.space }, { k: 'upkeep', v: -(v.upkeep + v.power) }, { k: 'our fees', v: -v.fees },
    { k: 'profit', v: v.profit, base: 0, solid: true, hatch: true },
  ];
  const bw = 70, gap = (x1 - x0 - 40 - steps.length * bw) / (steps.length - 1);
  let level = 0;
  steps.forEach((s, i) => {
    const ai = E.outCubic(prog(t, 5.0 + i * 0.35, 5.5 + i * 0.35)); if (ai <= 0) { if (!s.solid) level += s.v; return; }
    const x = x0 + 20 + i * (bw + gap);
    let top, bot;
    if (s.solid) { top = s.v; bot = 0; level = s.k === 'revenue' ? s.v : level; } else { top = level; bot = level + s.v; level = bot; }
    const yT = Y(Math.max(top, bot)), yB = Y(Math.min(top, bot)), hh = (yB - yT) * ai;
    const r = new Path2D(); r.rect(x, yB - hh, bw, hh);
    if (s.hatch) hatchFill(ctx, r, C.ink, 0.7, 7);
    else { ctx.save(); ctx.fillStyle = s.solid ? 'rgba(242,242,238,0.88)' : 'rgba(126,131,138,0.55)'; ctx.fill(r); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2; ctx.stroke(r); ctx.restore();
    mtext(ctx, s.k, x + bw / 2, y0 + 26, { size: 19, color: C.silver, align: 'center', alpha: ai, italicAll: true });
    mtext(ctx, `${s.v < 0 ? '−' : ''}$${Math.round(Math.abs(s.v))}K`, x + bw / 2, s.v < 0 ? yB + 18 : yT - 18, { size: 20, align: 'center', alpha: ai });
  });
  const pb = E.outCubic(prog(t, 7.4, 8.0));
  mtext(ctx, `the venue earns back its arena in about ${Math.round(v.pkgPrice / v.profit * 12)} months`, x0, 950, { size: 24, alpha: pb, italicAll: true });
}

// ================= §9 COSTS (log scale) =================
export const COSTS = [
  { label: 'electricity for one match', note: '4 cars', v: 0.001 },
  { label: 'replacement bumper shell', note: 'consumable', v: 0.15 },
  { label: 'one production car', note: '50 kg, remote-driven', v: 12 },
  { label: 'this round: prototype system', note: '2 cars + test arena', v: 250, ours: true },
  { label: 'venue arena package', note: 'cost $250K, sells for $400K', v: 250, price: 400 },
  { label: 'full-size pro arena, later', note: 'phase 2', v: 3000, later: true },
];
export function sCosts(ctx, t) {
  bg(ctx, { gx: 900 });
  const x0 = 760, x1 = 1780, top = 360, rowH = 92;
  const X = (k) => x0 + ((Math.log10(k * 1000)) / 7) * (x1 - x0); // $1 .. $10M
  const pa = E.outCubic(prog(t, 0.3, 1.0)), yB = top + COSTS.length * rowH;
  ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = 'rgba(242,242,238,0.7)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0, top - 20); ctx.lineTo(x0, yB); ctx.lineTo(x1, yB); ctx.stroke();
  ctx.strokeStyle = 'rgba(242,242,238,0.08)'; ctx.lineWidth = 1;
  for (let d = 1; d <= 7; d++) { const x = x0 + d / 7 * (x1 - x0); ctx.beginPath(); ctx.moveTo(x, top - 20); ctx.lineTo(x, yB); ctx.stroke(); }
  ctx.restore();
  ['$1', '$10', '$100', '$1K', '$10K', '$100K', '$1M', '$10M'].forEach((s, d) => mtext(ctx, s, x0 + d / 7 * (x1 - x0), yB + 28, { size: 21, color: C.silver, align: 'center', alpha: pa }));
  mtext(ctx, 'cost, log scale', (x0 + x1) / 2, yB + 66, { size: 23, align: 'center', alpha: pa, italicAll: true });
  COSTS.forEach((c, i) => {
    const y = top + i * rowH + rowH / 2, a = E.outCubic(prog(t, 1.0 + i * 0.5, 1.6 + i * 0.5));
    mtext(ctx, c.label, x0 - 30, y - 12, { size: 26, align: 'right', alpha: a, color: c.later ? C.silver : C.ink });
    mtext(ctx, c.note, x0 - 30, y + 18, { size: 20, align: 'right', alpha: a, color: C.silver, italicAll: true });
    if (a <= 0) return;
    const w = (X(c.v) - x0) * E.outCubic(a), r = new Path2D(); r.rect(x0, y - 16, w, 32);
    if (c.later) hatchFill(ctx, r, C.ink, 0.5, 7); else { ctx.save(); ctx.fillStyle = c.ours ? 'rgba(242,242,238,0.95)' : 'rgba(185,189,195,0.7)'; ctx.fill(r); ctx.restore(); }
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; ctx.stroke(r); ctx.restore();
    let end = x0 + w;
    if (c.price && a > 0.99) {
      const m = new Path2D(); m.rect(X(c.v), y - 16, X(c.price) - X(c.v), 32); hatchFill(ctx, m, C.ink, 0.8, 5);
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; ctx.stroke(m); ctx.restore(); end = X(c.price);
    }
    const txt = c.v < 0.01 ? 'under $1' : c.v < 1 ? `$${Math.round(c.v * 1000)}` : c.price ? `$${c.v}K → $${c.price}K` : money(c.v);
    mtext(ctx, txt, end + 16, y, { size: 24, alpha: a });
  });
}

// ================= §11 PROJECTIONS AND RETURN =================
export const PROJ = [
  { y: 1, rev: 0, cost: 250, arenas: 0, what: 'prototypes' },
  { y: 2, rev: 670, cost: 1300, arenas: 1, what: 'flagship venue' },
  { y: 3, rev: 2450, cost: 2600, arenas: 5, what: '4 arenas sold' },
  { y: 4, rev: 5490, cost: 4700, arenas: 15, what: '10 sold' },
  { y: 5, rev: 10850, cost: 8400, arenas: 35, what: '20 sold' },
];
export function sReturn(ctx, t) {
  bg(ctx, { gx: 700 });
  const x0 = 260, x1 = 1180, y0 = 840, y1 = 360, max = 12000;
  const Y = (k) => y0 - (k / max) * (y0 - y1), pa = E.outCubic(prog(t, 0.3, 1.0));
  axes(ctx, { x0, x1, y0, y1, xt: [], yt: [0, 4000, 8000, 12000], X: (q) => q, Y, alpha: pa, yfmt: (k) => (k ? `$${k / 1000}M` : '$0') });
  mtext(ctx, 'projected revenue and costs', x0, y1 - 26, { size: 24, alpha: pa, italicAll: true });
  const slot = (x1 - x0) / PROJ.length, bw = 86;
  const pts = [];
  PROJ.forEach((p, i) => {
    const cx = x0 + slot * (i + 0.5), a = E.outCubic(prog(t, 1.0 + i * 0.4, 1.6 + i * 0.4));
    mtext(ctx, `year ${p.y}`, cx, y0 + 28, { size: 22, align: 'center', alpha: pa });
    mtext(ctx, `${p.arenas} arena${p.arenas === 1 ? '' : 's'}`, cx, y0 + 58, { size: 19, color: C.silver, align: 'center', alpha: pa, italicAll: true });
    if (a <= 0) return;
    const hh = (y0 - Y(p.rev)) * a, r = new Path2D(); r.rect(cx - bw / 2, y0 - hh, bw, hh);
    ctx.save(); ctx.fillStyle = 'rgba(242,242,238,0.85)'; ctx.fill(r); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.1; ctx.stroke(r); ctx.restore();
    mtext(ctx, p.rev ? money(p.rev) : '$0', cx, y1 + 24, { size: 22, align: 'center', alpha: a });
    pts.push([cx, Y(p.cost), a]);
  });
  if (pts.length > 1) {
    line(ctx, pts.map(p => [p[0], p[1]]), { w: 2.2, color: C.silver, dash: [9, 6] });
    pts.forEach(p => circle(ctx, p[0], p[1], 6, { fill: '#050505', stroke: C.silver, w: 1.8, alpha: p[2] }));
  }
  const la = E.outCubic(prog(t, 3.2, 3.8));
  line(ctx, [[x0 + 30, 440], [x0 + 80, 440]], { w: 10, color: 'rgba(242,242,238,0.85)', alpha: la, cap: 'butt' });
  mtext(ctx, 'revenue', x0 + 92, 440, { size: 21, alpha: la });
  line(ctx, [[x0 + 210, 440], [x0 + 260, 440]], { w: 2.2, color: C.silver, dash: [9, 6], alpha: la });
  mtext(ctx, 'costs', x0 + 272, 440, { size: 21, alpha: la });
  const be = E.outCubic(prog(t, 3.6, 4.2)), bx = x0 + slot * 3.5;
  arrow(ctx, bx - 120, Y(7600), bx - 10, Y(5900), { w: 1.4, head: 12, alpha: be });
  mtext(ctx, 'profitable from year 4', bx - 130, Y(7600) - 6, { size: 22, align: 'right', alpha: be, italicAll: true });
  mtext(ctx, 'Projections, not promises: assumptions are in the speaker notes.', x0, 960, { size: 20, color: C.silver, alpha: pa, italicAll: true });
}

// ================= §12 THE NUMBERS (ledger is DOM; the canvas adds the column rule) =================
export function sNumbers(ctx, t) {
  bg(ctx, { gx: 960, glow: 0.05 });
  const a = E.inOutCubic(prog(t, 0.8, 2.0));
  line(ctx, [[960, 300], [960, 300 + 560 * a]], { w: 1, color: 'rgba(242,242,238,0.16)' });
}
