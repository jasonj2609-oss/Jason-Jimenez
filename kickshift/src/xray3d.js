// "What's inside": X-ray reveal of the car with its KickShift hardware.
// A clipping plane sweeps nose → tail: the paint is cut away behind it and an
// edge-lit X-ray shell takes its place, showing the parts inside.
import * as THREE from 'three';
import { clamp, lerp, prog, E } from './util.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export function xrayMaterial(plane) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uCol: { value: new THREE.Color(0xdde4ee) } },
    vertexShader: `#include <common>
      #include <clipping_planes_pars_vertex>
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: `#include <common>
      #include <clipping_planes_pars_fragment>
      uniform float uA; uniform vec3 uCol; varying vec3 vN; varying vec3 vV;
      void main() {
        #include <clipping_planes_fragment>
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        gl_FragColor = vec4(uCol * uA * (0.006 + 0.2 * pow(f, 3.0)), 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, clipping: true,
  });
  m.clippingPlanes = [plane];
  return m;
}

// Energy pulses running along a tube (uv.x runs along the tube).
export function flowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uOn: { value: 0 }, uBase: { value: 0.06 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uOn, uBase; varying vec2 vUv;
      void main(){ float d = fract(vUv.x * 5.0 - uT * 1.4);
        float p = smoothstep(0.0, 0.06, d) * (1.0 - smoothstep(0.06, 0.32, d));
        gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * (uBase + uOn * (0.25 + 2.6 * p)), 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

// Charge light bar: lit up to uFill along its length, with a bright leading edge.
export function barMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFill: { value: 0 }, uOn: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uFill, uOn; varying vec2 vUv;
      void main(){ float lit = 1.0 - smoothstep(uFill - 0.004, uFill + 0.004, vUv.x);
        float head = exp(-pow((vUv.x - uFill) * 30.0, 2.0)) * step(0.01, uFill);
        float seg = 0.75 + 0.25 * step(0.18, fract(vUv.x * 14.0));
        gl_FragColor = vec4(vec3(0.95, 0.97, 1.0) * uOn * (0.05 + seg * (2.2 * lit + 2.0 * head)), 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
}

// Concentric coil pattern for charging pads and lane tiles.
export function coilTexture(w = 256, h = 128, turns = 6) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, Math.min(w, h) / 34);
  for (let i = 0; i < turns; i++) {
    const m = 8 + i * (Math.min(w, h) / 2 - 12) / turns, r = Math.max(2, 18 - i * 3);
    g.beginPath(); g.roundRect(m, m, w - 2 * m, h - 2 * m, r); g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// Points along the lower flank, rear → front, just proud of the paint.
export function barPoints(hit, frontZ, rearZ) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const z = lerp(rearZ - 0.62, frontZ + 0.62, i / 24);
    const p = hit(V3(4, 0.68, z), V3(-1, 0, 0));
    pts.push(V3(p ? p.x + 0.02 : 1.0, 0.68, z));
  }
  return pts;
}
export function makeBars(pts) {
  const mat = barMaterial(), g = new THREE.Group();
  for (const s of [1, -1]) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(p.x * s, p.y, p.z)));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.021, 8), mat));
  }
  g.userData.mat = mat;
  return g;
}

export function buildFeatures({ car, model, parts, reflection, bb, wheels, hit, renderer }) {
  renderer.localClippingEnabled = true;
  const NOSE = bb.min.z, TAIL = bb.max.z;
  const wc = {};
  wheels.forEach(w => { const p = V3(0, 0, 0); w.getWorldPosition(p); wc[w.name.slice(-2)] = p; });
  const frontZ = (wc.fl.z + wc.fr.z) / 2, rearZ = (wc.rl.z + wc.rr.z) / 2, track = Math.abs(wc.fr.x), wy = wc.fr.y;
  const midZ = (frontZ + rearZ) / 2;

  // ---- clipping: solid paint keeps z ≥ s, X-ray keeps z ≤ s ----
  const clipSolid = new THREE.Plane(V3(0, 0, 1), 1e4), clipX = new THREE.Plane(V3(0, 0, -1), -1e4);
  const mats = new Set();
  [model, parts].forEach(r => r.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.add(m)); }));
  mats.forEach(m => { m.clippingPlanes = [clipSolid]; });
  const setCut = (s) => { clipSolid.constant = -s; clipX.constant = s; };

  const feat = new THREE.Group(); feat.visible = false;
  const xMat = xrayMaterial(clipX);
  const ghost = new THREE.Group();
  [model, parts].forEach(r => { const c = r.clone(true); c.traverse(o => { if (o.isMesh) o.material = xMat; }); ghost.add(c); });
  feat.add(ghost);

  const part = (color = 0xc9cdd2, metal = 0.8, rough = 0.3) => new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough, emissive: 0xffffff, emissiveIntensity: 0 });
  const C = {};

  // (1) receiver coil under the floor: ferrite plate + rounded-rectangle spiral winding
  {
    const g = new THREE.Group(), m = part(0x5d6168, 0.7, 0.42);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.02, 1.64), part(0x18191b, 0.3, 0.6));
    g.add(plate);
    const pts = [], turns = 8;
    for (let k = 0; k <= turns * 64; k++) {
      const u = k / 64, a = (u % 1) * Math.PI * 2, s = 1 - 0.085 * u;
      const hx = 0.56 * s, hz = 0.76 * s, n = 6;
      const cx = Math.cos(a), sz = Math.sin(a);
      pts.push(V3(Math.sign(cx) * Math.pow(Math.abs(cx), 2 / n) * hx, 0.016, Math.sign(sz) * Math.pow(Math.abs(sz), 2 / n) * hz));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1400, 0.011, 6), m));
    g.position.set(0, 0.075, midZ + 0.05);
    feat.add(g); C.coil = { g, mats: [m] };
  }
  // (2) supercapacitor bank in the engine bay
  const capZ = rearZ - 0.62;
  {
    const g = new THREE.Group(), body = part(0xc2c6cc, 0.95, 0.22), top = part(0x2a2b2e, 0.4, 0.5);
    const cyl = new THREE.CylinderGeometry(0.068, 0.068, 0.36, 40), cap = new THREE.CylinderGeometry(0.07, 0.07, 0.025, 40);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const x = (i - 1.5) * 0.165, z = (j - 1) * 0.165;
      const c = new THREE.Mesh(cyl, body); c.position.set(x, 0.18, z); g.add(c);
      const k = new THREE.Mesh(cap, top); k.position.set(x, 0.372, z); g.add(k);
    }
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.03, 0.6), top); tray.position.y = -0.01; g.add(tray);
    g.position.set(0, 0.3, capZ);
    feat.add(g); C.cap = { g, mats: [body] };
  }
  // (3) battery pack: modules along the floor tunnel
  const batZ0 = frontZ + 0.45, batZ1 = rearZ - 1.15;
  {
    const g = new THREE.Group(), m = part(0x2b2e33, 0.5, 0.45), edge = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
    const n = 4, len = (batZ1 - batZ0) / n;
    const bx = new THREE.BoxGeometry(0.5, 0.11, len - 0.04), eg = new THREE.EdgesGeometry(bx);
    for (let i = 0; i < n; i++) for (const x of [-0.27, 0.27]) {
      const b = new THREE.Mesh(bx, m); b.position.set(x, 0, batZ0 + (i + 0.5) * len); g.add(b);
      const e = new THREE.LineSegments(eg, edge); e.position.copy(b.position); g.add(e);
    }
    g.position.y = 0.2;
    feat.add(g); C.bat = { g, mats: [m], edge };
  }
  // (4) hub motors inside each wheel
  {
    const g = new THREE.Group(), m = part(0xb8bcc2, 0.9, 0.28), ringM = part(0xffffff, 0.2, 0.3);
    const drum = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 48); drum.rotateZ(Math.PI / 2);
    const ring = new THREE.TorusGeometry(0.175, 0.012, 10, 64); ring.rotateY(Math.PI / 2);
    for (const k of ['fl', 'fr', 'rl', 'rr']) {
      const p = wc[k], s = Math.sign(p.x);
      const d = new THREE.Mesh(drum, m); d.position.set(p.x - s * 0.2, p.y, p.z); g.add(d);
      const r = new THREE.Mesh(ring, ringM); r.position.set(p.x - s * 0.13, p.y, p.z); g.add(r);
    }
    feat.add(g); C.motor = { g, mats: [m, ringM] };
  }
  // power cables with travelling pulses: coil → supercap, supercap → each motor
  const flowIn = flowMaterial(), flowOut = flowMaterial();
  {
    const tube = (pts, mat) => feat.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.014, 8), mat));
    tube([V3(0, 0.1, midZ + 0.05), V3(0, 0.16, midZ + 0.35), V3(0.1, 0.22, batZ1 + 0.1), V3(0.12, 0.3, capZ - 0.32)], flowIn);
    for (const k of ['rl', 'rr']) { const p = wc[k], s = Math.sign(p.x); tube([V3(s * 0.3, 0.36, capZ), V3(s * 0.55, 0.33, p.z - 0.05), V3(p.x - s * 0.27, p.y, p.z)], flowOut); }
    for (const k of ['fl', 'fr']) { const p = wc[k], s = Math.sign(p.x); tube([V3(s * 0.1, 0.3, capZ - 0.3), V3(s * 0.12, 0.27, midZ), V3(s * 0.2, 0.27, frontZ + 0.55), V3(p.x - s * 0.27, p.y, p.z)], flowOut); }
  }
  // (5) swappable strike shell over the nose (two profiles: Wedge and Wall)
  const shellMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
  const shellEdge = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  const shells = [];
  for (const hf of [0.28, 0.7]) {
    const z0 = NOSE - 0.08, z1 = NOSE + 0.95, sh = new THREE.Shape();
    sh.moveTo(z0, 0.08); sh.lineTo(z0, hf);
    if (hf < 0.6) sh.quadraticCurveTo(z0 + 0.3, hf + 0.12, z1, 0.66); else { sh.lineTo(z0 + 0.1, hf + 0.03); sh.lineTo(z1, 0.74); }
    sh.lineTo(z1, 0.08); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 1.96, bevelEnabled: false, curveSegments: 18 });
    geo.rotateY(-Math.PI / 2); geo.translate(0.98, 0, 0);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, shellMat), new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), shellEdge));
    feat.add(g); shells.push(g);
  }
  C.shell = { mats: [shellMat] };
  // (6) tracking markers + telemetry antenna on the roll hoops
  const tagZ = rearZ - 1.28;
  let tagY;
  {
    const top = hit(V3(0.42, 5, tagZ), V3(0, -1, 0)); tagY = (top ? top.y : bb.max.y * 0.85) + 0.02;
    const g = new THREE.Group(), stalk = part(0x2a2b2e, 0.6, 0.4), bead = part(0xffffff, 0.1, 0.2);
    const sp = new THREE.SphereGeometry(0.034, 24, 16), st = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8);
    for (const [x, dz, h] of [[-0.42, 0, 0.1], [0.42, 0, 0.1], [0, 0.18, 0.16], [0.22, -0.16, 0.13]]) {
      const s = new THREE.Mesh(st, stalk); s.position.set(x, tagY + h / 2, tagZ + dz); s.scale.y = h / 0.12; g.add(s);
      const b = new THREE.Mesh(sp, bead); b.position.set(x, tagY + h + 0.02, tagZ + dz); g.add(b);
    }
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.42, 8), stalk); ant.position.set(-0.2, tagY + 0.21, tagZ + 0.12); g.add(ant);
    feat.add(g); C.tag = { g, mats: [bead] };
  }
  // (7) charge light bar along both flanks (shown on the car in the arena too)
  const barPts = barPoints(hit, frontZ, rearZ);
  const bars = makeBars(barPts);
  bars.visible = false; car.add(bars);

  // charging pad under the car (studio stand-in for a lane tile)
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 4.6), new THREE.MeshBasicMaterial({ map: coilTexture(256, 470, 7), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: 0x000000 }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(0, 0.006, midZ); feat.add(pad);

  car.add(feat);
  const featR = feat.clone(true); reflection.add(featR);

  const anchors = {
    coil: V3(0.45, 0.08, midZ + 0.5), cap: V3(0.3, 0.68, capZ), bat: V3(0.52, 0.26, (batZ0 + batZ1) / 2),
    motor: V3(wc.fr.x, wy, wc.fr.z), shell: V3(0.6, 0.55, NOSE + 0.2), tag: V3(0.42, tagY + 0.12, tagZ), bar: barPts[16],
  };

  const B = { coil: 3.0, cap: 4.5, bat: 6.0, motor: 7.5, shell: 9.0, tag: 10.8, bar: 12.3, all: 14.0 };
  function frame(t) {
    feat.visible = featR.visible = true; bars.visible = true;
    const sp = prog(t, 1.1, 2.9);
    setCut(lerp(NOSE - 0.4, TAIL + 0.4, E.inOutCubic(sp)));
    xMat.uniforms.uA.value = sp > 0 ? 1 : 0;
    const vis = (k) => E.outCubic(prog(t, 1.1 + (k === 'shell' ? 0.2 : 0.8), 2.9));
    const focus = (k) => {
      const b = B[k], next = Object.values(B).find(v => v > b) || 99;
      const f = E.outCubic(prog(t, b - 0.1, b + 0.35)) * (1 - E.inOutSine(prog(t, next - 0.1, next + 0.5)));
      return Math.max(f, 0.15 * prog(t, b + 0.3, b + 0.8), 0.3 * E.outCubic(prog(t, B.all, B.all + 0.6)) * prog(t, b, b + 0.1));
    };
    for (const k of ['coil', 'cap', 'bat', 'motor', 'tag']) {
      C[k].g.visible = vis(k) > 0.01;
      C[k].mats.forEach(m => { m.emissiveIntensity = 0.04 + 0.9 * focus(k); });
    }
    if (C.bat.edge) C.bat.edge.opacity = 0.2 + 0.6 * focus('bat');
    C.tag.mats[0].emissiveIntensity = 0.4 + 2.5 * focus('tag') * (0.6 + 0.4 * Math.sin(t * 14));
    // pad + flow: lane energy arrives at the coil, then feeds the motors
    pad.material.color.setScalar(0.12 * vis('coil') + 1.1 * E.outCubic(prog(t, B.coil - 0.2, B.coil + 0.4)) * (1 - 0.6 * prog(t, B.cap + 0.5, B.cap + 1.2)));
    flowIn.uniforms.uT.value = flowOut.uniforms.uT.value = t;
    flowIn.uniforms.uOn.value = E.outCubic(prog(t, B.coil + 0.2, B.coil + 0.8));
    flowOut.uniforms.uOn.value = E.outCubic(prog(t, B.motor, B.motor + 0.6));
    flowIn.uniforms.uBase.value = flowOut.uniforms.uBase.value = 0.05 * vis('cap');
    // shell swap: Wedge slides off, Wall slides on
    const s0 = prog(t, B.shell + 0.15, B.shell + 0.75), s1 = prog(t, B.shell + 0.8, B.shell + 1.45);
    shells[0].visible = s0 < 1; shells[0].position.z = -1.3 * E.inCubic(s0);
    shells[1].visible = s1 > 0; shells[1].position.z = -1.3 * (1 - E.outCubic(s1));
    shells.forEach(g => (g.children[1].material.opacity = 0.85 * vis('shell')));
    shellMat.opacity = (0.03 + 0.07 * focus('shell')) * vis('shell');
    // light bar fills during its beat
    bars.userData.mat.uniforms.uOn.value = E.outCubic(prog(t, B.bar - 0.2, B.bar + 0.3));
    bars.userData.mat.uniforms.uFill.value = 0.82 * E.inOutCubic(prog(t, B.bar, B.bar + 1.4));
  }
  // the mirrored copy shares materials; keep visibility and offsets in step
  const syncMirror = () => feat.children.forEach((c, i) => { const r = featR.children[i]; r.visible = c.visible; r.position.copy(c.position); });

  function reset() { setCut(-1e4); feat.visible = featR.visible = false; bars.visible = false; xMat.uniforms.uA.value = 0; }
  return { frame: (t) => { frame(t); syncMirror(); }, reset, anchors, bars, barPts, beats: B, dims: { frontZ, rearZ, midZ, track, wy, wc } };
}
