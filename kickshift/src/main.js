import './styles.css';
import gsap from 'gsap';
import katex from 'katex';
import { createStage } from './car3d.js';
import * as S from './slides2d.js';
import { NOTES } from './notes.js';
import { clamp, prog, E } from './util.js';

const qs = new URLSearchParams(location.search);
const CAPTURE = qs.has('capture');
if (CAPTURE) document.documentElement.classList.add('capture');
if (qs.has('clean')) document.documentElement.classList.add('clean');
const DPR = CAPTURE ? Number(qs.get('dpr') || 1) : Math.min(2, window.devicePixelRatio || 1);
const GL_DPR = CAPTURE ? Number(qs.get('dpr') || 1) : Math.min(1.5, window.devicePixelRatio || 1);

const stageEl = document.getElementById('stage');
const fit = () => { const s = Math.min(innerWidth / 1920, innerHeight / 1080); stageEl.style.transform = `translate(-50%,-50%) scale(${s})`; };
fit(); addEventListener('resize', fit);

const slides = [...document.querySelectorAll('.slide')];
const PLAN = {
  intro: { gl: 'intro', dur: 14 }, idea: { draw: S.sIdea, dur: 10 }, meet: { gl: 'meet', dur: 14 },
  momentum: { draw: S.sMomentum, dur: 12 }, impulse: { draw: S.sImpulse, dur: 12 }, energy: { draw: S.sEnergy, dur: 11 },
  aim: { draw: S.sAim, dur: 11.5 }, arena: { draw: S.sArena, dur: 12 }, cost: { draw: S.sCost, dur: 10 },
  road: { draw: S.sRoad, dur: 11 }, ask: { draw: S.sAsk, dur: 10 }, outro: { gl: 'outro', dur: 13 },
};
const DEF = slides.map(el => ({ el, id: el.dataset.id, ...PLAN[el.dataset.id] }));

// ---------- text helpers ----------
function splitChars(el) {
  const out = [];
  const walk = (node) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of n.textContent) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; frag.appendChild(s); out.push(s); }
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
  };
  walk(el); return out;
}

function buildTimeline(d, endT) {
  const tl = gsap.timeline({ paused: true });
  const at = (v) => (String(v).startsWith('end') ? endT + Number(String(v).slice(3) || 0) : Number(v));
  d.el.querySelectorAll('[data-in]').forEach(el => {
    const t0 = at(el.dataset.at || 0), type = el.dataset.in;
    if (type === 'chars') {
      const chars = splitChars(el), st = Number(el.dataset.stagger || 0.028);
      tl.fromTo(chars, { opacity: 0, y: '0.32em', filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out', stagger: st }, t0);
    } else if (type === 'slam') {
      tl.fromTo(el, { opacity: 0, scale: 1.7, filter: 'blur(24px)', letterSpacing: '0.3em' }, { opacity: 1, scale: 1, filter: 'blur(0px)', letterSpacing: '0.02em', duration: 0.6, ease: 'expo.out' }, t0);
    } else if (type === 'tilt') {
      gsap.set(el, { transformPerspective: 1700, transformOrigin: '50% 40%' });
      tl.fromTo(el, { opacity: 0, rotationX: 80, scale: 0.6, y: 200 }, { opacity: 1, rotationX: 46, scale: 0.86, y: 0, duration: 2.0, ease: 'expo.out' }, t0);
    } else {
      const from = { opacity: 0, filter: 'blur(10px)' };
      if (type === 'up') from.y = 46; if (type === 'left') from.x = -70; if (type === 'right') from.x = 70;
      tl.fromTo(el, from, { opacity: 1, x: 0, y: 0, filter: 'blur(0px)', duration: 1.0, ease: 'expo.out' }, t0);
    }
    if (el.dataset.out) tl.to(el, { opacity: 0, y: -30, filter: 'blur(12px)', duration: 0.5, ease: 'power2.in' }, at(el.dataset.out));
  });
  tl.set({}, {}, Math.max(d.dur, tl.duration()));
  return tl;
}

function counters(d, t) {
  d.el.querySelectorAll('[data-count]').forEach(el => {
    const v = Number(el.dataset.count), a = Number(el.dataset.at || 0), dur = Number(el.dataset.dur || 1.3), dec = Number(el.dataset.dec || 0);
    const x = v * E.outCubic(prog(t, a, a + dur));
    el.textContent = x.toFixed(dec);
  });
}

// ---------- per-slide extras ----------
function meetCallouts(d, t, stage) {
  const svg = d.el.querySelector('#callouts'); if (!svg) return;
  let html = '';
  d.el.querySelectorAll('[data-co]').forEach(el => {
    const a = stage.anchors[el.dataset.co], p = stage.project(a.x, a.y, a.z);
    const right = el.classList.contains('r');
    const top = parseFloat(el.style.top), left = parseFloat(el.style.left);
    const lx = right ? left - 24 : left + 420, ly = top + 22;
    const t0 = Number(el.dataset.at), pr = E.outCubic(prog(t, t0 - 0.2, t0 + 0.7));
    if (pr <= 0) return;
    const ex = right ? lx - 60 : lx + 60;
    const pts = [[lx, ly], [ex, ly], [p.x, p.y]];
    let len = 0; for (let i = 1; i < 3; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const pulse = 10 + 14 * ((t * 0.9) % 1);
    html += `<polyline points="${pts.map(q => q.join(',')).join(' ')}" fill="none" stroke="#F2F2EE" stroke-width="1.4" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - pr)}" opacity=".7"/>`;
    if (pr > 0.95) html += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#F2F2EE"/><circle cx="${p.x}" cy="${p.y}" r="${pulse}" fill="none" stroke="#F2F2EE" stroke-width="1.2" opacity="${0.8 * (1 - ((t * 0.9) % 1))}"/>`;
  });
  svg.innerHTML = html;
}

// ---------- boot ----------
let stage, SP, tls = [], ctxs = [], cur = -1, t0 = 0;
const glEl = document.getElementById('gl'), flashEl = document.getElementById('flash');

function renderSlide(i, t) {
  const d = DEF[i];
  tls[i].seek(Math.min(t, tls[i].duration()), false);
  counters(d, t);
  if (d.draw) {
    const ctx = ctxs[i]; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.imageSmoothingQuality = 'high';
    d.draw(ctx, t, SP);
  } else {
    const r = stage[d.gl](t) || {};
    flashEl.style.opacity = r.flash || 0;
    if (d.id === 'meet') meetCallouts(d, t, stage);
  }
  if (!d.gl) flashEl.style.opacity = 0;
}

function show(i) {
  slides.forEach((s, k) => s.classList.toggle('on', k === i));
  glEl.classList.toggle('on', !!DEF[i].gl);
  cur = i; t0 = performance.now();
  document.getElementById('bar').style.width = ((i + 1) / slides.length) * 100 + '%';
  document.getElementById('count').textContent = `${String(i + 1).padStart(2, '0')} / ${slides.length}`;
  const n = NOTES[i]; if (n) document.getElementById('notes').innerHTML = `<h4><span>${i + 1}. ${n.title}</span><span>${n.time}  ·  <span id="clock"></span></span></h4>${n.say}`;
}

async function boot() {
  const g = document.getElementById('grain').getContext('2d'), id = g.createImageData(512, 512);
  for (let k = 0; k < id.data.length; k += 4) { const v = Math.random() * 255; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
  g.putImageData(id, 0, 0);
  document.getElementById('grain').style.cssText += 'width:1920px;height:1080px';
  document.querySelectorAll('[data-tex]').forEach(el => { try { katex.render(el.dataset.tex, el, { throwOnError: false, displayMode: false }); } catch (_) {} });
  await Promise.all(['400 40px "CMU Serif"', 'italic 400 40px "CMU Serif"', '700 40px "CMU Serif"', '400 20px KaTeX_Main', 'italic 400 20px KaTeX_Math', '400 20px KaTeX_Size1', '400 20px KaTeX_Size2'].map(f => document.fonts.load(f).catch(() => {})));
  await document.fonts.ready;
  stage = await createStage(glEl, { dpr: GL_DPR, capture: CAPTURE });
  SP = stage.bake();
  DEF.forEach((d, i) => {
    tls[i] = buildTimeline(d, stage.OUT.end);
    const c = d.el.querySelector('canvas.c2d');
    if (c) { c.width = 1920 * DPR; c.height = 1080 * DPR; ctxs[i] = c.getContext('2d'); }
  });
  document.getElementById('loading').remove();
  window.KS = {
    count: DEF.length, durations: DEF.map(d => d.dur), ids: DEF.map(d => d.id),
    render(i, t) { if (cur !== i) show(i); renderSlide(i, t); },
  };
  if (CAPTURE) { window.KS_READY = true; return; }
  show(Number(qs.get('s') || 1) - 1);
  const loop = (now) => { renderSlide(cur, (now - t0) / 1000); const c = document.getElementById('clock'); if (c) c.textContent = clockText(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}

let talkStart = null;
const clockText = () => { if (!talkStart) return '0:00'; const s = Math.floor((performance.now() - talkStart) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function go(i) { i = clamp(i, 0, slides.length - 1); if (talkStart === null) talkStart = performance.now(); show(i); }
addEventListener('keydown', (e) => {
  if (!window.KS || CAPTURE) return;
  const k = e.key;
  if (['ArrowRight', 'PageDown', ' ', 'Enter', 'ArrowDown'].includes(k)) { e.preventDefault(); go(cur + 1); }
  else if (['ArrowLeft', 'PageUp', 'ArrowUp', 'Backspace'].includes(k)) { e.preventDefault(); go(cur - 1); }
  else if (k === 'f' || k === 'F') { try { const r = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); r && r.catch && r.catch(() => {}); } catch (_) {} }
  else if (k === 'n' || k === 'N') document.getElementById('notes').classList.toggle('on');
  else if (k === 'r' || k === 'R') go(cur);
  else if (k === 'Home') go(0);
  else if (/^[1-9]$/.test(k)) go(Number(k) - 1);
});
let touchX = null, swiped = false;
addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; swiped = false; }, { passive: true });
addEventListener('touchend', (e) => {
  if (touchX === null || !window.KS || CAPTURE) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) { swiped = true; go(dx < 0 ? cur + 1 : cur - 1); }
});
addEventListener('click', (e) => { if (swiped) { swiped = false; return; } if (window.KS && !CAPTURE && !e.target.closest('#notes')) go(cur + 1); });
setTimeout(() => { const h = document.getElementById('hint'); if (h) h.style.opacity = 0; }, 5000);

boot().catch(err => { console.error(err); const l = document.getElementById('loading'); if (l) l.textContent = 'ERROR: ' + err.message; });
