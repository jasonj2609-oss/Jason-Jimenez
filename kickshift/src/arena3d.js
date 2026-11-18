// The KickShift arena: pitch with wireless charging lanes, safety walls, goals, tiered seating,
// a camera truss that tracks every car and the ball, and a centre-hung energy scoreboard.
// Four cars play on it; lane tiles only switch on under a car.
import * as THREE from 'three';
import { clamp, lerp, prog, E, rng } from './util.js';
import { coilTexture, makeBars } from './xray3d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const PITCH = { PW: 15, PL: 24, WX: 16.2, WZ: 25.5, WR: 7, GOAL: 4.6, LANE_X: 10.6, LANE_Z: 15 };

// Cubic Hermite through timed keys, Catmull-Rom tangents, eased ends.
export function track(keys) {
  const n = keys.length;
  const tan = (j) => (j === 0 || j === n - 1 ? keys[j].v.map(() => 0) : keys[j].v.map((_, d) => (keys[j + 1].v[d] - keys[j - 1].v[d]) / (keys[j + 1].t - keys[j - 1].t)));
  return (t) => {
    if (t <= keys[0].t) return keys[0].v.slice();
    if (t >= keys[n - 1].t) return keys[n - 1].v.slice();
    let i = 0; while (t > keys[i + 1].t) i++;
    const k0 = keys[i], k1 = keys[i + 1], h = k1.t - k0.t, u = (t - k0.t) / h, m0 = tan(i), m1 = tan(i + 1);
    const u2 = u * u, u3 = u2 * u;
    return k0.v.map((p0, d) => (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0[d] + (-2 * u3 + 3 * u2) * k1.v[d] + (u3 - u2) * h * m1[d]);
  };
}
const K = (arr) => track(arr.map(([t, ...v]) => ({ t, v })));

function roundedRect(hx, hz, r, step) {
  // perimeter samples with tangents, counter-clockwise from +x side
  const pts = [], segs = [];
  const sx = hx - r, sz = hz - r;
  segs.push({ len: 2 * sz, at: (s) => [hx, -sz + s, 0, 1] });
  segs.push({ len: Math.PI * r / 2, at: (s) => { const a = s / r; return [sx + r * Math.cos(a), sz + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } });
  segs.push({ len: 2 * sx, at: (s) => [sx - s, hz, -1, 0] });
  segs.push({ len: Math.PI * r / 2, at: (s) => { const a = Math.PI / 2 + s / r; return [-sx + r * Math.cos(a), sz + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } });
  segs.push({ len: 2 * sz, at: (s) => [-hx, sz - s, 0, -1] });
  segs.push({ len: Math.PI * r / 2, at: (s) => { const a = Math.PI + s / r; return [-sx + r * Math.cos(a), -sz + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } });
  segs.push({ len: 2 * sx, at: (s) => [-sx + s, -hz, 1, 0] });
  segs.push({ len: Math.PI * r / 2, at: (s) => { const a = 1.5 * Math.PI + s / r; return [sx + r * Math.cos(a), -sz + r * Math.sin(a), -Math.sin(a), Math.cos(a)]; } });
  const total = segs.reduce((a, s) => a + s.len, 0), n = Math.round(total / step);
  for (let i = 0; i < n; i++) {
    let s = (i + 0.5) * total / n, k = 0;
    while (s > segs[k].len) { s -= segs[k].len; k++; }
    const [x, z, tx, tz] = segs[k].at(s);
    pts.push({ x, z, tx, tz });
  }
  return { pts, seg: total / n };
}
function rrShape(hx, hz, r) {
  const s = new THREE.Shape();
  s.moveTo(-hx + r, -hz); s.lineTo(hx - r, -hz); s.quadraticCurveTo(hx, -hz, hx, -hz + r);
  s.lineTo(hx, hz - r); s.quadraticCurveTo(hx, hz, hx - r, hz); s.lineTo(-hx + r, hz);
  s.quadraticCurveTo(-hx, hz, -hx, hz - r); s.lineTo(-hx, -hz + r); s.quadraticCurveTo(-hx, -hz, -hx + r, -hz);
  return s;
}
function instanced(geo, mat, list, place) {
  const m = new THREE.InstancedMesh(geo, mat, list.length), o = new THREE.Object3D();
  list.forEach((it, i) => { place(o, it, i); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.instanceMatrix.needsUpdate = true;
  return m;
}

export function buildArena({ scene, car, keepChildren, bodyMat, blackPaint, barPts, beamMaterial, radialTex }) {
  const P = PITCH, A = new THREE.Group(); A.visible = false; scene.add(A);
  const R = rng(11);

  // ---------- floor with markings ----------
  {
    const ppm = 40, W = 34, L = 53, c = document.createElement('canvas'); c.width = W * ppm; c.height = L * ppm;
    const g = c.getContext('2d'), X = (x) => (x + W / 2) * ppm, Z = (z) => (z + L / 2) * ppm;
    g.fillStyle = '#0c0c0d'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 2;
    for (let x = -W / 2; x <= W / 2; x += 2) { g.beginPath(); g.moveTo(X(x), 0); g.lineTo(X(x), c.height); g.stroke(); }
    for (let z = -L / 2; z <= L / 2; z += 2) { g.beginPath(); g.moveTo(0, Z(z)); g.lineTo(c.width, Z(z)); g.stroke(); }
    g.strokeStyle = 'rgba(236,236,232,0.7)'; g.lineWidth = 0.12 * ppm;
    g.beginPath(); g.roundRect(X(-P.PW), Z(-P.PL), 2 * P.PW * ppm, 2 * P.PL * ppm, 5 * ppm); g.stroke();
    g.beginPath(); g.moveTo(X(-P.PW), Z(0)); g.lineTo(X(P.PW), Z(0)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), 5 * ppm, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(236,236,232,0.8)'; g.beginPath(); g.arc(X(0), Z(0), 0.3 * ppm, 0, Math.PI * 2); g.fill();
    for (const s of [-1, 1]) {
      g.beginPath(); g.rect(X(-7.5), Z(s > 0 ? P.PL - 5.5 : -P.PL), 15 * ppm, 5.5 * ppm); g.stroke();
      g.beginPath(); g.arc(X(0), Z(s * (P.PL - 5.5)), 3.2 * ppm, s > 0 ? Math.PI : 0, s > 0 ? 2 * Math.PI : Math.PI); g.stroke();
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 16;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.26, metalness: 0.0, envMapIntensity: 0.55 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0; A.add(floor);
    const apron = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: 0x070708, roughness: 0.6 }));
    apron.rotation.x = -Math.PI / 2; apron.position.y = -0.03; A.add(apron);
  }

  // ---------- charging lanes: coil tiles that light only under a car ----------
  const TILE = 1.0, NT = Math.round((2 * P.LANE_Z) / TILE), lanes = [P.LANE_X, -P.LANE_X];
  const tileTex = coilTexture(264, 110, 5);
  const baseTex = coilTexture(264, 110, 5); baseTex.wrapT = THREE.RepeatWrapping; baseTex.repeat.set(1, NT);
  const tiles = [];
  lanes.forEach(x => { for (let k = 0; k < NT; k++) tiles.push({ x, z: -P.LANE_Z + (k + 0.5) * TILE }); });
  for (const x of lanes) {
    const base = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2 * P.LANE_Z), new THREE.MeshBasicMaterial({ map: baseTex, color: 0x6a6e75, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    base.rotation.x = -Math.PI / 2; base.position.set(x, 0.004, 0); A.add(base);
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 2 * P.LANE_Z + 0.2), new THREE.MeshBasicMaterial({ color: 0xc8cbd0 }));
      e.rotation.x = -Math.PI / 2; e.position.set(x + s * 1.22, 0.005, 0); A.add(e);
    }
  }
  const flat = (o, it, y, ry = 0) => { o.position.set(it.x, y, it.z); o.rotation.set(-Math.PI / 2, 0, ry); };
  const glowTiles = instanced(new THREE.PlaneGeometry(2.24, 0.94), new THREE.MeshBasicMaterial({ map: tileTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), tiles, (o, it) => flat(o, it, 0.007));
  const spill = instanced(new THREE.PlaneGeometry(4.2, 2.6), new THREE.MeshBasicMaterial({ map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), tiles, (o, it) => flat(o, it, 0.006));
  const col = new THREE.Color();
  tiles.forEach((_, i) => { glowTiles.setColorAt(i, col.setScalar(0)); spill.setColorAt(i, col.setScalar(0)); });
  A.add(spill, glowTiles);

  // ---------- walls: boards + LED rail + polycarbonate glass + posts, open at the goals ----------
  {
    const { pts, seg } = roundedRect(P.WX, P.WZ, P.WR, 1.0);
    const run = pts.filter(p => !(Math.abs(p.x) < P.GOAL + 0.45 && Math.abs(p.z) > P.WZ - 0.5));
    const orient = (o, p, y, sy = 1) => { o.position.set(p.x, y, p.z); o.rotation.set(0, Math.atan2(-p.tz, p.tx), 0); o.scale.set(1, sy, 1); };
    A.add(instanced(new THREE.BoxGeometry(seg + 0.02, 1.0, 0.16), new THREE.MeshStandardMaterial({ color: 0xaeb2b8, roughness: 0.42, metalness: 0.2 }), run, (o, p) => orient(o, p, 0.6)));
    A.add(instanced(new THREE.BoxGeometry(seg + 0.02, 0.2, 0.17), new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.6 }), run, (o, p) => orient(o, p, 0.1)));
    A.add(instanced(new THREE.BoxGeometry(seg + 0.02, 0.045, 0.18), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 1.18, 1.22) }), run, (o, p) => orient(o, p, 1.11)));
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xc4ccd6, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.1, depthWrite: false, envMapIntensity: 2.2, side: THREE.DoubleSide });
    A.add(instanced(new THREE.BoxGeometry(seg + 0.01, 2.3, 0.025), glassMat, run, (o, p) => orient(o, p, 2.28)));
    A.add(instanced(new THREE.BoxGeometry(0.07, 2.32, 0.07), new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.7, roughness: 0.35 }), run.filter((_, i) => i % 3 === 0), (o, p) => orient(o, p, 2.28)));
    A.add(instanced(new THREE.BoxGeometry(seg + 0.02, 0.05, 0.08), new THREE.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.7, roughness: 0.35 }), run, (o, p) => orient(o, p, 3.44)));
  }

  // ---------- goals ----------
  const goalLights = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(), z0 = s * P.WZ, z1 = s * (P.WZ + 3.2), H = 4.2;
    const frame = new THREE.MeshStandardMaterial({ color: 0xe8e8e6, metalness: 0.3, roughness: 0.3 });
    const post = new THREE.CylinderGeometry(0.11, 0.11, H, 20);
    for (const x of [-P.GOAL, P.GOAL]) { const m = new THREE.Mesh(post, frame); m.position.set(x, H / 2, z0); g.add(m); }
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2 * P.GOAL, 20), frame); bar.rotation.z = Math.PI / 2; bar.position.set(0, H, z0); g.add(bar);
    const led = new THREE.Mesh(new THREE.BoxGeometry(2 * P.GOAL, 0.06, 0.06), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.32, 1.36) })); led.position.set(0, H + 0.17, z0); g.add(led); goalLights.push(led);
    const net = [], step = 0.36;
    for (let x = -P.GOAL; x <= P.GOAL + 1e-6; x += step) net.push(x, 0, z1, x, H, z1, x, H, z0, x, H, z1);
    for (let y = 0; y <= H + 1e-6; y += step) net.push(-P.GOAL, y, z1, P.GOAL, y, z1, -P.GOAL, y, z0, -P.GOAL, y, z1, P.GOAL, y, z0, P.GOAL, y, z1);
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1) + 1e-6; z += step) net.push(-P.GOAL, 0, z, -P.GOAL, H, z, P.GOAL, 0, z, P.GOAL, H, z, -P.GOAL, H, z, P.GOAL, H, z);
    const ng = new THREE.BufferGeometry(); ng.setAttribute('position', new THREE.Float32BufferAttribute(net, 3));
    g.add(new THREE.LineSegments(ng, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 })));
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2 * P.GOAL, 3.2), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8 }));
    back.rotation.x = -Math.PI / 2; back.position.set(0, 0.006, (z0 + z1) / 2); g.add(back);
    A.add(g);
  }

  // ---------- tiered seating with a crowd ----------
  {
    const tierMat = new THREE.MeshStandardMaterial({ color: 0x121315, roughness: 0.85 });
    const people = [];
    for (let i = 0; i < 10; i++) {
      const d = 4.4 + i * 1.15, h = 0.9 + i * 0.62;
      const outer = rrShape(P.WX + d + 1.15, P.WZ + d + 1.15, P.WR + d + 1.15), inner = rrShape(P.WX + d, P.WZ + d, P.WR + d);
      outer.holes.push(inner);
      const geo = new THREE.ExtrudeGeometry(outer, { depth: h, bevelEnabled: false, curveSegments: 10 });
      geo.rotateX(Math.PI / 2); geo.translate(0, h, 0);
      A.add(new THREE.Mesh(geo, tierMat));
      roundedRect(P.WX + d + 0.6, P.WZ + d + 0.6, P.WR + d + 0.6, 0.62).pts.forEach(p => { if (R() > 0.2) people.push({ ...p, y: h, k: R() }); });
    }
    const body = instanced(new THREE.BoxGeometry(0.42, 0.72, 0.3), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), people, (o, p) => { o.position.set(p.x, p.y + 0.36, p.z); o.rotation.set(0, Math.atan2(p.x, p.z) + (p.k - 0.5) * 0.6, 0); o.scale.set(1, 0.9 + 0.25 * p.k, 1); });
    const head = instanced(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), people, (o, p) => { o.position.set(p.x, p.y + 0.78 + 0.18 * p.k, p.z); o.rotation.set(0, 0, 0); o.scale.setScalar(1); });
    people.forEach((p, i) => { const v = 0.035 + 0.2 * Math.pow(R(), 1.6); body.setColorAt(i, col.setScalar(v)); head.setColorAt(i, col.setScalar(v * 1.15)); });
    A.add(body, head);
  }

  // ---------- truss, tracking cameras and their fields of view ----------
  const camPods = [], cones = [];
  {
    const Y = 15, tx = P.WX + 1.6, tz = P.WZ + 1.6, beamMat = new THREE.MeshStandardMaterial({ color: 0x1c1d20, metalness: 0.75, roughness: 0.4 });
    const stripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.56, 0.58) });
    const beam = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.5), beamMat);
      m.position.set((x0 + x1) / 2, Y, (z0 + z1) / 2); m.rotation.y = Math.atan2(-(z1 - z0), x1 - x0); A.add(m);
      const s = new THREE.Mesh(new THREE.BoxGeometry(len * 0.96, 0.06, 0.14), stripMat); s.position.copy(m.position); s.position.y -= 0.28; s.rotation.copy(m.rotation); A.add(s);
    };
    beam(-tx, -tz, tx, -tz); beam(-tx, tz, tx, tz); beam(-tx, -tz, -tx, tz); beam(tx, -tz, tx, tz); beam(-6, -tz, -6, tz); beam(6, -tz, 6, tz);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2f, metalness: 0.6, roughness: 0.35 });
    const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 0.82, 0.85) });
    const spots = [[tx, -tz], [tx, 0], [tx, tz], [0, tz], [-tx, tz], [-tx, 0], [-tx, -tz], [0, -tz]];
    spots.forEach(([x, z]) => {
      const pod = new THREE.Group(); pod.position.set(x, Y - 1.1, z);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.5), podMat); pod.add(b);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.6), podMat); hood.position.set(0, 0.43, 0.75); pod.add(hood);
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 12, 40), lensMat); lens.position.z = 0.76; pod.add(lens);
      const glassL = new THREE.Mesh(new THREE.CircleGeometry(0.26, 40), new THREE.MeshStandardMaterial({ color: 0x050608, metalness: 0.9, roughness: 0.05 })); glassL.position.z = 0.755; pod.add(glassL);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), podMat); arm.position.set(0, 0.7, -0.2); pod.add(arm);
      const target = V3(x * 0.25, 0, z * 0.25);
      pod.lookAt(target); A.add(pod); camPods.push(pod);
      const dir = target.clone().sub(pod.position), L = dir.length();
      const geo = new THREE.ConeGeometry(L * 0.42, L, 64, 1, true); geo.translate(0, -L / 2, 0);
      const mat = beamMaterial(); mat.uniforms.uLen.value = L; mat.uniforms.uInt.value = 0;
      const cone = new THREE.Mesh(geo, mat); cone.position.copy(pod.position); cone.quaternion.setFromUnitVectors(V3(0, -1, 0), dir.normalize());
      A.add(cone); cones.push(cone);
    });
    // hanging cables for the scoreboard
    const cab = [];
    for (const x of [-3.4, 3.4]) for (const z of [-2.3, 2.3]) cab.push(x, 12.2, z, x * 1.6, Y, z * 1.6);
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cab, 3));
    A.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: 0x55585e })));
  }

  // ---------- centre-hung energy scoreboard ----------
  const board = {};
  {
    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, g: c.getContext('2d'), t }; };
    board.main = mk(1024, 455); board.side = mk(712, 455);
    const dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0.5, roughness: 0.4 });
    const face = (tx) => new THREE.MeshBasicMaterial({ map: tx.t, color: new THREE.Color(0.95, 0.95, 0.95) });
    const box = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.2, 5.0), [face(board.side), face(board.side), dark, dark, face(board.main), face(board.main)]);
    box.position.set(0, 10.6, 0); A.add(box);
    for (const y of [8.95, 12.25]) { const r = new THREE.Mesh(new THREE.BoxGeometry(7.32, 0.07, 5.12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.22, 1.26) })); r.position.set(0, y, 0); A.add(r); }
  }
  function drawBoard(b, st) {
    const { g, c } = b, w = c.width, h = c.height;
    g.fillStyle = '#040404'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#ecece8'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 400 ${Math.round(h * 0.085)}px "CMU Serif", Georgia, serif`; g.fillText('KickShift', w / 2, h * 0.12);
    g.font = `400 ${Math.round(h * 0.3)}px "CMU Serif", Georgia, serif`; g.fillText(`${st.a}  :  ${st.b}`, w / 2, h * 0.4);
    g.font = `400 ${Math.round(h * 0.075)}px "CMU Serif", Georgia, serif`; g.fillStyle = '#a9adb3'; g.fillText(st.clock, w / 2, h * 0.6);
    const bw = w * 0.17, bh = h * 0.06, y = h * 0.8;
    st.energy.forEach((e, i) => {
      const x = i < 2 ? w * 0.08 + i * (bw + w * 0.04) : w * 0.92 - bw - (3 - i) * (bw + w * 0.04);
      g.strokeStyle = 'rgba(236,236,232,0.75)'; g.lineWidth = 2; g.strokeRect(x, y, bw, bh);
      g.fillStyle = i < 2 ? '#ecece8' : '#8f949a'; g.fillRect(x + 3, y + 3, (bw - 6) * clamp(e), bh - 6);
      g.fillStyle = '#a9adb3'; g.font = `italic 400 ${Math.round(h * 0.06)}px "CMU Serif", Georgia, serif`; g.textAlign = 'left';
      g.fillText(`#${i + 1}`, x, y - h * 0.05);
      g.textAlign = 'center';
    });
    b.t.needsUpdate = true;
  }

  // ---------- the other three cars ----------
  const blackMat = new THREE.MeshPhysicalMaterial({ ...blackPaint, clearcoat: 1, clearcoatRoughness: 0.03 });
  const keepIdx = car.children.map((c, i) => (keepChildren.includes(c) ? i : -1)).filter(i => i >= 0);
  function cloneCar(black) {
    const c = car.clone(true);
    c.children.slice().forEach((ch, i) => { if (!keepIdx.includes(i)) c.remove(ch); });
    if (black) c.traverse(o => { if (o.isMesh && o.material === bodyMat) o.material = blackMat; });
    const wheels = []; c.traverse(o => /^wheel_(fl|fr|rl|rr)$/.test(o.name) && wheels.push(o));
    const bars = makeBars(barPts); c.add(bars);
    A.add(c);
    return { g: c, wheels, bars };
  }
  const others = [cloneCar(false), cloneCar(true), cloneCar(true)];
  const under = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 6.2), new THREE.MeshBasicMaterial({ map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0x000000 }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.009; A.add(m); return m;
  });

  // ---------- choreography (seconds into the slide) ----------
  const paths = [
    K([[0, 10.6, 19], [2.4, 10.6, 14], [6.8, 10.6, -14], [8.2, 7, -19], [9.6, 2, -20], [11.4, -3, -15], [13.4, -7, -12], [15.4, -12, -8], [18, -13, -1]]),
    K([[0, -8, 6], [2.5, -3, 10], [5, 3, 8], [7.5, 5, 2], [10, 2, -4], [12.5, -4, -6], [15, -8, -1], [18, -7, 5]]),
    K([[0, 6, -10], [2.5, 2, -12], [5, -4, -11], [7.5, -9, -5], [10, -3, 7], [12.5, 4, 9], [15, 9, 3], [18, 8, -5]]),
    K([[0, -10.6, -22], [5, -10.6, -20], [11, -10.6, 12], [12.6, -6, 17], [14.4, 2, 15], [16.2, 6, 8], [18, 4, 2]]),
  ];
  const pose = (f, t) => {
    const [x, z] = f(t);
    let a = f(t + 0.05), b = f(t - 0.05), dx = a[0] - b[0], dz = a[1] - b[1];
    if (Math.hypot(dx, dz) < 1e-3) { a = f(t + 0.6); dx = a[0] - x; dz = a[1] - z; }
    let dist = 0, p = f(0);
    for (let s = 0.05; s <= t + 1e-6; s += 0.05) { const q = f(s); dist += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; }
    return { x, z, ry: Math.atan2(-dx, -dz), dist };
  };
  const energy = (t) => [
    0.22 + 0.68 * E.inOutSine(prog(t, 2.6, 6.8)) - 0.012 * Math.max(0, t - 9),
    0.74 - 0.012 * t,
    0.58 - 0.008 * t,
    0.3 + 0.55 * E.inOutSine(prog(t, 5.4, 11)) - 0.01 * Math.max(0, t - 12),
  ];

  function frame(t, hero) {
    A.visible = true;
    const poses = paths.map(f => pose(f, t));
    const speeds = paths.map(f => { const a = f(t + 0.05), b = f(t - 0.05); return Math.hypot(a[0] - b[0], a[1] - b[1]) / 0.1; });
    const en = energy(t);
    // hero = the main car object; others = clones
    const all = [{ g: hero.car, wheels: hero.wheels, bars: hero.bars }, ...others];
    all.forEach((c, i) => {
      const p = poses[i];
      c.g.position.set(p.x, 0, p.z); c.g.rotation.set(0, p.ry, 0);
      c.wheels.forEach(w => (w.rotation.x = -p.dist / 0.36));
      c.bars.visible = true;
      c.bars.userData.mat.uniforms.uOn.value = 1; c.bars.userData.mat.uniforms.uFill.value = clamp(en[i]);
    });
    // lane tiles: power only flows under a car
    let k = 0;
    const onLane = [0, 3].map(i => poses[i]);
    tiles.forEach((tl) => {
      let gl = 0;
      onLane.forEach(p => { if (Math.abs(p.x - tl.x) < 1.3) gl = Math.max(gl, Math.exp(-Math.pow((tl.z - p.z) / 1.5, 2))); });
      glowTiles.setColorAt(k, col.setScalar(2.6 * gl)); spill.setColorAt(k, col.setScalar(0.55 * gl)); k++;
    });
    glowTiles.instanceColor.needsUpdate = true; spill.instanceColor.needsUpdate = true;
    onLane.forEach((p, j) => {
      const on = Math.abs(Math.abs(p.x) - P.LANE_X) < 1.3 && Math.abs(p.z) < P.LANE_Z + 0.5 ? 1 : 0;
      under[j].position.set(p.x, 0.009, p.z); under[j].rotation.z = p.ry; under[j].material.color.setScalar(0.5 * on);
    });
    goalLights.forEach(l => l.material.color.setScalar(1.3));
    cones.forEach(c => (c.material.uniforms.uInt.value = 0.1 * hero.coneAmt));
    const secs = 8 * 60 - 18 + Math.floor(t);
    drawBoard(board.main, { a: 2, b: 1, clock: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, energy: en });
    drawBoard(board.side, { a: 2, b: 1, clock: `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, energy: en });
    return { poses, energy: en, speeds };
  }
  function reset() { A.visible = false; }

  const anchors = {
    lane: V3(P.LANE_X, 0.02, -6.5), cams: camPods[5].position.clone(), board: V3(-1.2, 10.6, 2.5), wall: V3(-P.WX, 3.0, 10.5),
  };
  return { group: A, frame, reset, anchors, paths, pods: camPods.map(p => p.position.clone()) };
}
