// KickShift 3D stage: studio-lit silver supercar, headlight reveal, match ball, sprite baking.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import glb from '../assets/ferrari.glb';
import dracoWrapper from '../assets/draco_wrapper.txt';
import dracoWasm from '../assets/draco_decoder.wasm';
import aoUrl from '../assets/ferrari_ao.png';
import { clamp, lerp, prog, E } from './util.js';
import { buildFeatures } from './xray3d.js';
import { buildArena, track } from './arena3d.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const WHITE = new THREE.Color(0xffffff);
export const PAINT = {
  silver: { color: 0xc4c8ce, metalness: 1.0, roughness: 0.3 },
  black: { color: 0x0b0c0e, metalness: 0.55, roughness: 0.22 },
};

function makeEnv(renderer) {
  // Black photo studio: two long overhead soft boxes, side strips, a dim floor bounce.
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x010101);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mk = (sx, sy, sz, x, y, z, k) => {
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k) }));
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); s.add(m);
  };
  mk(1.6, 0.05, 15, -1.7, 7, 0, 2.6);
  mk(1.6, 0.05, 15, 1.7, 7, 0, 2.6);
  mk(4.5, 0.05, 4.5, 0, 7.2, 0, 0.6);
  mk(0.05, 0.7, 18, -8, 2.2, 0, 1.6);
  mk(0.05, 0.7, 18, 8, 2.2, 0, 1.6);
  mk(0.05, 2.6, 3, 8, 3, -6, 1.0);
  mk(0.05, 2.6, 3, -8, 3, 6, 0.7);
  mk(14, 0.5, 0.05, 0, 2.6, -10, 0.9);
  mk(14, 0.5, 0.05, 0, 2.6, 10, 0.6);
  mk(30, 0.05, 30, 0, -0.5, 0, 0.035);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}

function radialTex(inner, outer, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Futuristic 12-panel ball: pearl-white ceramic panels, graphite grooves with a fine light inlay,
// and an inset bevel line on every panel. Computed per pixel from the icosahedron directions.
function makeBall(radius) {
  const p = (1 + Math.sqrt(5)) / 2, normals = [];
  for (const s1 of [1, -1]) for (const s2 of [1, -1]) for (const v of [[0, s1, s2 * p], [s1, s2 * p, 0], [s2 * p, 0, s1]]) normals.push(V3(...v).normalize());
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uN = { value: normals };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vObj; uniform vec3 uN[12]; float gGroove; float gInlay;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 u = normalize(vObj); float b1 = -2.0, b2 = -2.0;
        for (int i = 0; i < 12; i++) { float s = dot(u, uN[i]); if (s > b1) { b2 = b1; b1 = s; } else if (s > b2) { b2 = s; } }
        float d = b1 - b2;
        gGroove = 1.0 - smoothstep(0.030, 0.042, d);
        gInlay = 1.0 - smoothstep(0.004, 0.009, d);
        float bevel = smoothstep(0.105, 0.112, d) * (1.0 - smoothstep(0.118, 0.125, d));
        vec3 pearl = vec3(0.90, 0.905, 0.91), graphite = vec3(0.025, 0.027, 0.03);
        diffuseColor.rgb = mix(pearl * (1.0 - 0.55 * bevel), graphite, gGroove);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(roughnessFactor, 0.55, gGroove);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += vec3(0.95) * gInlay;`);
  };
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 160, 120), mat);
}

function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uInt: { value: 0 }, uLen: { value: 9 }, uColor: { value: new THREE.Color(0xf2f6ff) } },
    vertexShader: `uniform float uLen; varying float vD; varying vec3 vN; varying vec3 vV;
      void main(){ vD = -position.y/uLen; vec4 wp = modelMatrix*vec4(position,1.0);
      vN = normalize(normalMatrix*normal); vec4 mv = viewMatrix*wp; vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uInt; uniform vec3 uColor; varying float vD; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
      float a = uInt * f * pow(clamp(1.0-vD,0.0,1.0), 1.7) * smoothstep(0.0, 0.05, vD);
      gl_FragColor = vec4(uColor*a, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

export async function createStage(canvas, { dpr = 1, capture = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: capture, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(1920, 1080, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 16, 40);
  scene.environment = makeEnv(renderer);
  scene.environmentIntensity = 1;
  const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 200);

  // ---------- car ----------
  const gltf = await new Promise((res, rej) => {
    const buf = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength);
    const draco = new DRACOLoader();
    draco._loadLibrary = (url) => Promise.resolve(url.endsWith('.wasm') ? dracoWasm.buffer.slice(dracoWasm.byteOffset, dracoWasm.byteOffset + dracoWasm.byteLength) : dracoWrapper);
    new GLTFLoader().setDRACOLoader(draco).parse(buf, '', res, rej);
  });
  const model = gltf.scene;
  const car = new THREE.Group();
  car.add(model);

  const scan = { z: { value: -10 }, amt: { value: 0 }, col: { value: WHITE.clone().multiplyScalar(1.6) } };
  const bodyMat = new THREE.MeshPhysicalMaterial({ ...PAINT.silver, clearcoat: 1, clearcoatRoughness: 0.03 });
  bodyMat.onBeforeCompile = (sh) => {
    sh.uniforms.uScanZ = scan.z; sh.uniforms.uScanAmt = scan.amt; sh.uniforms.uScanCol = scan.col;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uScanZ; uniform float uScanAmt; uniform vec3 uScanCol;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float sd = vWP.z - uScanZ;
        totalEmissiveRadiance += uScanCol * uScanAmt * (exp(-sd*sd*60.0) + 0.12*exp(-sd*sd*3.0));`);
  };
  const gloss = new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0.5, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x1b1d20, metalness: 1, roughness: 0.3 });
  const caliper = new THREE.MeshStandardMaterial({ color: 0xd9dce0, metalness: 0.85, roughness: 0.3 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x08090b, metalness: 0.9, roughness: 0.03, transparent: true, opacity: 0.74 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.85, metalness: 0 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.32, metalness: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x9a9fa6, roughness: 0.12, metalness: 1 });
  // DRL strips: only the front of this mesh glows (its far end is a side repeater on the fender).
  const drlMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xf4f8ff, emissiveIntensity: 0 });
  drlMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLX;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLX = position.x;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLX;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= step(vLX, 0.15);');
  };
  const headMat = new THREE.MeshStandardMaterial({ color: 0x15171a, emissive: 0xf4f8ff, emissiveIntensity: 0, roughness: 0.1, metalness: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x1a0606, emissive: 0xd8140c, emissiveIntensity: 0, roughness: 0.2 });

  const wheels = [];
  model.traverse((o) => {
    if (/^wheel_(fl|fr|rl|rr)$/.test(o.name)) wheels.push(o);
    if (!o.isMesh) return;
    const mn = o.material.name;
    if (mn === 'Body_Color') o.material = bodyMat;
    else if (mn === 'Ferrari_Yellow' || mn === 'Leather_red' || mn === '_0098_DodgerBlue') o.material = gloss;
    else if (mn === 'Glass_Gray') o.material = glass;
    else if (mn === 'Tires') o.material = tire;
    else if (mn === 'Carbon_Fiber') o.material = carbon;
    else if (mn === 'metal_chrome') o.material = chrome;
    else if (mn === 'Turn_Signal_LED') o.material = drlMat;
    else if (mn === 'Projector_Glass') o.material = headMat;
    else if (mn === 'Taillight_Glass') o.material = tailMat;
    else if (mn === 'metal_gray') o.material = (o.name === 'brake') ? caliper : rimMat;
    else if (mn === 'plastic_gray') o.material = carbon;
    else { o.material = o.material.clone(); }
  });

  car.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(model);
  const meshes = []; model.traverse(o => o.isMesh && meshes.push(o));
  const rc = new THREE.Raycaster();
  const hit = (o, d) => { rc.set(o, d); const h = rc.intersectObjects(meshes, false)[0]; return h ? h.point : null; };

  // ---------- KickShift bodywork: carbon strike-splitter + rear wing ----------
  const parts = new THREE.Group(); car.add(parts);
  const front = [];
  for (let i = 0; i <= 18; i++) {
    const x = lerp(-0.93, 0.93, i / 18);
    const p = hit(V3(x, 0.2, bb.min.z - 3), V3(0, 0, 1));
    if (p) front.push(V3(x, 0.1, p.z - 0.06));
  }
  if (front.length > 4) {
    const shape = new THREE.Shape();
    front.forEach((p, i) => (i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z)));
    for (let i = front.length - 1; i >= 0; i--) shape.lineTo(front[i].x * 0.96, -(front[i].z + 0.42));
    const sg = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    sg.rotateX(-Math.PI / 2);
    const sp = new THREE.Mesh(sg, carbon); sp.position.y = 0.075; parts.add(sp);
  }
  let deckY;
  {
    const deck = hit(V3(0, 5, bb.max.z - 0.5), V3(0, -1, 0));
    deckY = deck ? deck.y : bb.max.y * 0.85;
    const chord = 0.44, span = 1.78;
    const af = new THREE.Shape();
    af.moveTo(0, 0);
    af.bezierCurveTo(0.02, 0.045, 0.16, 0.06, chord, 0.028);
    af.bezierCurveTo(0.2, 0.012, 0.05, -0.018, 0, 0);
    const wg = new THREE.ExtrudeGeometry(af, { depth: span, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 2, curveSegments: 16 });
    wg.rotateY(-Math.PI / 2); wg.translate(span / 2, 0, 0);
    const wing = new THREE.Mesh(wg, carbon);
    wing.position.set(0, deckY + 0.24, bb.max.z - 0.78);
    wing.rotation.x = 0.1;
    parts.add(wing);
    for (const x of [-0.89, 0.89]) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.12, 0.5), gloss);
      plate.position.set(x, deckY + 0.25, bb.max.z - 0.56); parts.add(plate);
    }
    for (const x of [-0.46, 0.46]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.28, 0.15), carbon);
      st.position.set(x, deckY + 0.11, bb.max.z - 0.62); st.rotation.x = -0.25; parts.add(st);
    }
  }

  // ---------- lights ----------
  const lampZ = bb.min.z + 0.42, lampY = 0.66, lampX = 0.66;
  const spots = [], beams = [];
  const beamGeo = new THREE.ConeGeometry(1.7, 9, 96, 1, true); beamGeo.translate(0, -4.5, 0);
  const bMat = beamMaterial();
  for (const s of [-1, 1]) {
    const sp = new THREE.SpotLight(0xf2f6ff, 0, 45, 0.42, 0.6, 1.3);
    sp.position.set(s * lampX, lampY, lampZ);
    sp.target.position.set(s * 1.1, 0, lampZ - 9);
    car.add(sp, sp.target); spots.push(sp);
    const b = new THREE.Mesh(beamGeo, bMat);
    b.position.set(s * lampX, lampY, lampZ - 0.05);
    b.quaternion.setFromUnitVectors(V3(0, -1, 0), V3(s * 0.05, -0.07, -1).normalize());
    car.add(b); beams.push(b);
  }
  let dust;
  {
    const N = 900, pos = new Float32Array(N * 3);
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const d = 0.6 + r() * 8, s = r() < 0.5 ? -1 : 1, rad = d * 0.22 * Math.sqrt(r()), a = r() * Math.PI * 2;
      pos[i * 3] = s * lampX + Math.cos(a) * rad; pos[i * 3 + 1] = lampY - d * 0.07 + Math.sin(a) * rad; pos[i * 3 + 2] = lampZ - d;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.03, map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xeef2f8 }));
    car.add(dust);
  }

  // overhead light that travels along the body during the intro reveal
  const sweep = new THREE.SpotLight(0xffffff, 0, 20, 0.2, 0.85, 1.4);
  sweep.position.set(0.4, 4.4, 0); sweep.target.position.set(0, 0.6, 0); scene.add(sweep, sweep.target);

  // ---------- floor, turntable rings, fake mirror reflection ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x060606, roughness: 0.24, metalness: 0.0, transparent: true, opacity: 0.92, envMap: scene.environment, envMapIntensity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xbfc3c8, transparent: true, opacity: 0 });
  const ring = new THREE.Group();
  ring.add(new THREE.Mesh(new THREE.RingGeometry(3.3, 3.312, 256), ringMat));
  ring.add(new THREE.Mesh(new THREE.RingGeometry(3.55, 3.554, 256), ringMat));
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, len = i % 6 === 0 ? 0.14 : 0.06;
    const tk = new THREE.Mesh(new THREE.PlaneGeometry(0.008, len), ringMat);
    tk.position.set(Math.cos(a) * (3.43), Math.sin(a) * (3.43), 0); tk.rotation.z = a + Math.PI / 2; ring.add(tk);
  }
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring);

  const reflection = car.clone(true);
  reflection.scale.y = -1;
  reflection.traverse(o => { if (o.isSpotLight || o.isPoints || (o.isMesh && o.material === bMat)) o.visible = false; });
  const rWheels = []; reflection.traverse(o => /^wheel_(fl|fr|rl|rr)$/.test(o.name) && rWheels.push(o));
  scene.add(reflection, car);

  const ao = await new THREE.TextureLoader().loadAsync(aoUrl);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), new THREE.MeshBasicMaterial({ map: ao, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012; shadow.renderOrder = 2; car.add(shadow);

  // ---------- ball ----------
  const BALL_R = 0.75;
  const ball = makeBall(BALL_R); scene.add(ball);
  const ballRefl = ball.clone(); ballRefl.scale.y = -1; scene.add(ballRefl);
  const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,0.9)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  ballShadow.rotation.x = -Math.PI / 2; ballShadow.position.y = 0.003; scene.add(ballShadow);

  // ---------- feature reveal + arena ----------
  const X = buildFeatures({ car, model, parts, reflection, bb, wheels, hit, renderer });
  const AR = buildArena({ scene, car, keepChildren: [model, parts, shadow], bodyMat, blackPaint: PAINT.black, barPts: X.barPts, beamMaterial, radialTex });

  // ---------- post ----------
  const rt = new THREE.WebGLRenderTarget(1920 * dpr, 1080 * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setSize(1920, 1080);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); bool bad = !(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b) || c.r > 6e4 || c.g > 6e4 || c.b > 6e4;
      gl_FragColor = bad ? vec4(0.0,0.0,0.0,1.0) : vec4(min(c.rgb, vec3(8.0)), c.a); }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1920, 1080), 0.45, 0.4, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- hitbox wireframes ----------
  const hbEdgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const hbFillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const hbGroup = new THREE.Group(); scene.add(hbGroup);
  let hbEdges = null, hbFill = null;
  function setHitbox(L, Hh, hf, ch, Wd = 2.1) {
    const zr = bb.max.z + 0.05, zf = zr - L, y0 = 0.06, sh = new THREE.Shape();
    sh.moveTo(zr, y0); sh.lineTo(zr, Hh);
    if (ch > 0.02 && Hh - hf > 0.02) { sh.lineTo(zf + ch, Hh); sh.lineTo(zf, hf); } else sh.lineTo(zf, Hh);
    sh.lineTo(zf, y0); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: Wd, bevelEnabled: false });
    g.rotateY(-Math.PI / 2); g.translate(Wd / 2, 0, 0);
    if (hbEdges) { hbGroup.remove(hbEdges, hbFill); hbEdges.geometry.dispose(); hbFill.geometry.dispose(); }
    hbFill = new THREE.Mesh(g, hbFillMat); hbEdges = new THREE.LineSegments(new THREE.EdgesGeometry(g, 15), hbEdgeMat);
    hbGroup.add(hbFill, hbEdges);
    return zf;
  }

  // ---------- state helpers ----------
  function lights({ drl = 0, head = 0, tail = 0, beam = 0, spot = null } = {}) {
    drlMat.emissiveIntensity = drl * 9;
    headMat.emissiveIntensity = head * 7;
    tailMat.emissiveIntensity = tail * 2.2;
    spots.forEach(s => (s.intensity = (spot ?? head) * 70));
    bMat.uniforms.uInt.value = beam * 0.11;
    dust.material.opacity = beam * 0.8;
    sweep.intensity = 0; hbEdgeMat.opacity = 0; hbFillMat.opacity = 0;
  }
  function paint(name) { const p = PAINT[name]; bodyMat.color.setHex(p.color); bodyMat.metalness = p.metalness; bodyMat.roughness = p.roughness; }
  function setWheel(angle) { wheels.forEach(w => (w.rotation.x = -angle)); rWheels.forEach(w => (w.rotation.x = -angle)); }
  function placeCar(z) { car.position.z = z; reflection.position.z = z; }
  function placeBall(x, y, z, rx = 0, rz = 0, show = true) {
    ball.visible = ballRefl.visible = ballShadow.visible = show;
    ball.position.set(x, y, z); ball.rotation.set(rx, 0, rz);
    ballRefl.position.set(x, -y, z); ballRefl.rotation.set(-rx, 0, -rz);
    const h = Math.max(0, y - BALL_R);
    ballShadow.position.set(x, 0.003, z); const s = BALL_R * 1.2 * (1 + h * 0.25); ballShadow.scale.set(s, s, s);
    ballShadow.material.opacity = 1 / (1 + h * 0.8);
  }
  function look(px, py, pz, tx, ty, tz, fov = 30, shiftX = 0) {
    camera.position.set(px, py, pz); camera.fov = fov;
    if (shiftX) camera.setViewOffset(1920, 1080, -shiftX, 0, 1920, 1080); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); camera.lookAt(tx, ty, tz);
  }
  function draw() { composer.render(); }
  // every scene starts from the same clean state
  function base() {
    X.reset(); AR.reset(); scene.fog.near = 16; scene.fog.far = 40;
    car.position.set(0, 0, 0); car.rotation.set(0, 0, 0); reflection.position.set(0, 0, 0); reflection.rotation.set(0, 0, 0);
    reflection.visible = true; floor.visible = true;
  }

  const NOSE = bb.min.z, TAIL = bb.max.z;

  // ---------- slide renderers (pure functions of t) ----------
  function flicker(t, t0) {
    const d = t - t0; if (d < 0) return 0;
    if (d < 0.07) return 1; if (d < 0.16) return 0.05; if (d < 0.22) return 0.7; if (d < 0.34) return 0.0;
    return E.outCubic(clamp((d - 0.34) / 0.18));
  }

  // Intro: a light scan traces the body in the dark, a macro shot on the headlight as it ignites,
  // then a long pull-back to the hero angle while the studio lights come up.
  function intro(t) {
    base();
    paint('silver'); ring.visible = false; placeBall(0, 0, 0, 0, 0, false); placeCar(0); setWheel(0);
    const drl = flicker(t, 4.4);
    const head = E.outExpo(prog(t, 5.2, 5.4));
    const env = E.inOutCubic(prog(t, 6.0, 9.6));
    scene.environmentIntensity = 0.85 * env;
    lights({ drl, head, beam: head * (1 - 0.4 * env), tail: prog(t, 6.6, 7.0) });
    const sp = prog(t, 2.9, 4.4);
    scan.col.value.setScalar(2.6);
    scan.z.value = lerp(TAIL + 0.6, NOSE - 0.6, E.inOutCubic(sp));
    scan.amt.value = sp > 0 && sp < 1 ? Math.min(1, sp * 5, (1 - sp) * 5) : 0;
    const sw = prog(t, 6.6, 9.4);
    sweep.position.z = lerp(TAIL + 1.2, NOSE - 1.2, E.inOutSine(sw)); sweep.target.position.z = sweep.position.z;
    sweep.intensity = 45 * Math.sin(Math.PI * sw);
    bloom.strength = 0.45 + 0.9 * Math.exp(-Math.pow((t - 5.27) * 6, 2));
    // camera: macro on the headlight, then pull back to the hero three-quarter view
    const lamp = V3(0.62, 0.64, NOSE + 0.38);
    const m = E.inOutSine(prog(t, 2.6, 5.6));
    const macroP = V3(lerp(1.7, 1.18, m), lerp(0.86, 0.72, m), lerp(NOSE - 1.7, NOSE - 1.05, m));
    const k = E.inOutCubic(prog(t, 5.7, 10.4)), drift = Math.max(0, t - 10.4) * 0.03;
    const heroP = V3(5.6 + drift, 1.25, -4.9), heroT = V3(0.25, 0.85, -0.1);
    const cp = macroP.clone().lerp(heroP, k), ct = lamp.clone().lerp(heroT, k);
    look(cp.x, cp.y, cp.z, ct.x, ct.y, ct.z, lerp(24, 30, k));
    draw();
    const lp = project(lamp.x + 0.02, lamp.y, lamp.z - 0.05);
    return { streak: { x: lp.x, y: lp.y, a: Math.exp(-Math.pow((t - 5.3) * 3.2, 2)) } };
  }

  function meet(t) {
    base();
    scan.col.value.setScalar(1.6); paint('silver'); ring.visible = true; placeBall(0, 0, 0, 0, 0, false); placeCar(0); setWheel(0);
    const a = E.outCubic(prog(t, 0, 1.0));
    scene.environmentIntensity = 1.15 * a;
    ringMat.opacity = 0.45 * E.outCubic(prog(t, 0.3, 1.6));
    ring.scale.setScalar(lerp(0.85, 1, E.outExpo(prog(t, 0.3, 1.6))));
    ring.rotation.z = t * 0.03;
    lights({ drl: a, head: 0.5 * a, beam: 0.18 * a, tail: a });
    scan.amt.value = 0; bloom.strength = 0.45;
    const phi = lerp(-1.22, -0.98, E.inOutSine(prog(t, 0, 14)));
    const R = lerp(9.0, 8.0, E.outCubic(prog(t, 0, 3.5)));
    look(Math.cos(phi) * R + 0.3, 1.55, Math.sin(phi) * R, 0.15, 0.5, 0, 31, -60);
    draw();
  }

  // Closing: car launches, strikes the ball toward the lens, flash, hero pose.
  const OUT = { launch: 1.7, acc: 8, ballZ: -9.2, slow: 0.32 };
  const HB = { x: -2.5, z: -1.5, shift: 250, phi: -0.75, R: 9.5 };
  OUT.sc = NOSE - (OUT.ballZ + BALL_R);
  OUT.tc = Math.sqrt(2 * OUT.sc / OUT.acc);
  OUT.vc = OUT.acc * OUT.tc;
  OUT.cam = V3(-4.6, 1.15, -15.6);
  function outro(t) {
    base();
    paint('silver'); ring.visible = false; scan.amt.value = 0;
    const tC = OUT.launch + OUT.tc;
    let flash = 0;
    if (t < tC + 1.4) {
      const f1 = Math.exp(-Math.pow((t - 0.55) * 9, 2)), f2 = Math.exp(-Math.pow((t - 0.95) * 9, 2));
      const lit = E.outCubic(prog(t, 0.0, 0.3));
      scene.environmentIntensity = 0.85;
      lights({ drl: lit, head: Math.max(0.5 * lit, f1 * 1.1, f2 * 1.1), spot: 0, beam: 0, tail: lit });
      bloom.strength = 0.45 + 0.7 * Math.max(f1, f2);
      let s;
      if (t < OUT.launch) s = 0;
      else if (t < tC) { const tau = t - OUT.launch; s = 0.5 * OUT.acc * tau * tau; }
      else { const tau = (t - tC) * OUT.slow; const v2 = OUT.vc * (900 - 0.6 * 20) / 920; s = OUT.sc + v2 * tau - 0.5 * 6 * tau * tau; }
      placeCar(-s); setWheel(s / 0.36);
      if (t < tC) placeBall(0, BALL_R, OUT.ballZ, 0, 0, true);
      else {
        const tau = (t - tC) * OUT.slow;
        const vb = 1.6 * 900 * OUT.vc / 920;
        const start = V3(0, BALL_R, OUT.ballZ);
        const dir = OUT.cam.clone().add(V3(0.6, -0.1, 0)).sub(start).normalize();
        const p = start.clone().addScaledVector(dir, vb * tau); p.y = BALL_R + (dir.y * vb + vb * 0.32) * tau - 4.9 * tau * tau;
        placeBall(p.x, Math.max(BALL_R, p.y), p.z, -tau * 9, tau * 2, true);
        flash = clamp((3.2 - p.distanceTo(OUT.cam)) / 1.6);
      }
      const shake = t > tC ? Math.exp(-(t - tC) * 6) * 0.05 : 0;
      look(OUT.cam.x + Math.sin(t * 90) * shake, OUT.cam.y + Math.cos(t * 77) * shake, OUT.cam.z, 0, 0.7, -6.5, 34);
      draw();
      return { flash };
    }
    const h = t - (tC + 1.4);
    placeCar(0); setWheel(0);
    placeBall(HB.x, BALL_R, HB.z, 0.4, 0.2, true);
    scene.environmentIntensity = 0.95;
    lights({ drl: 1, head: 0.8, beam: 0.3, tail: 1 });
    bloom.strength = 0.45;
    const phi = HB.phi - h * 0.02;
    look(Math.cos(phi) * HB.R + 0.6, 1.35, Math.sin(phi) * HB.R - 0.6, 0.6, 0.55, -0.8, 30, HB.shift);
    draw();
    return { flash: clamp(1 - h / 0.9) };
  }
  OUT.end = OUT.launch + OUT.tc + 1.4;

  // Hitbox presets: a simplified collision shape around the car. The front edge height h decides
  // where the ball is struck, so the same car can play low chips or flat drives.
  const HITBOX = {
    presets: [
      { name: 'Wedge', L: 4.9, H: 1.05, hf: 0.45, ch: 1.4 },
      { name: 'Balanced', L: 4.6, H: 1.2, hf: 0.6, ch: 0.9 },
      { name: 'Wall', L: 4.5, H: 1.35, hf: 1.35, ch: 0.0 },
    ],
    at(t) {
      const P = this.presets, seg = [[0, 4.0], [4.8, 7.6], [8.4, 99]];
      let i = 0, u = 0;
      if (t >= 4.0 && t < 4.8) { i = 0; u = E.inOutCubic((t - 4.0) / 0.8); }
      else if (t >= 4.8 && t < 7.6) i = 1;
      else if (t >= 7.6 && t < 8.4) { i = 1; u = E.inOutCubic((t - 7.6) / 0.8); }
      else if (t >= 8.4) i = 2;
      const a = P[i], b = P[Math.min(2, i + 1)], mix = (k) => lerp(a[k], b[k], u);
      return { i: u > 0.5 ? Math.min(2, i + 1) : i, L: mix('L'), H: mix('H'), hf: mix('hf'), ch: mix('ch') };
    },
  };
  function hitbox(t) {
    base();
    scan.col.value.setScalar(1.6); paint('silver'); ring.visible = false; placeCar(0); setWheel(0); scan.amt.value = 0;
    const a = E.outCubic(prog(t, 0, 1.0));
    scene.environmentIntensity = 1.1 * a;
    lights({ drl: a, head: 0.4 * a, spot: 0, beam: 0, tail: a });
    const st = HITBOX.at(t), zf = setHitbox(st.L, st.H, st.hf, st.ch);
    const ha = E.outCubic(prog(t, 0.6, 1.4));
    hbEdgeMat.opacity = 0.95 * ha; hbFillMat.opacity = 0.07 * ha;
    const hc = Math.min(st.hf, BALL_R), gap = Math.sqrt(Math.max(0, BALL_R * BALL_R - (BALL_R - hc) * (BALL_R - hc)));
    const zb = zf - gap;
    placeBall(0, BALL_R, zb, 0.3, 0.2, true);
    bloom.strength = 0.4;
    // side view, so angles on screen match the real angles
    const cz = -1.0, dist = lerp(13.2, 12.4, E.inOutSine(prog(t, 0, 12)));
    look(dist, 1.25, cz, 0, 0.62, cz, 30, 110);
    draw();
    const P = (y, z) => project(1.06, y, z);
    return { ...st, contact: P(hc, zf), center: P(BALL_R, zb), foot: P(0, zf), ballR: P(BALL_R * 2, zb).y };
  }

  // What's inside: X-ray sweep, then each part is called out in turn.
  function features(t) {
    base(); paint('silver'); ring.visible = true; placeBall(0, 0, 0, 0, 0, false); placeCar(0); setWheel(0);
    const a = E.outCubic(prog(t, 0, 1.0));
    scene.environmentIntensity = 1.1 * a;
    ringMat.opacity = 0.32 * E.outCubic(prog(t, 0.3, 1.6));
    ring.scale.setScalar(lerp(0.85, 1, E.outExpo(prog(t, 0.3, 1.6)))); ring.rotation.z = t * 0.03;
    lights({ drl: a, head: 0.4 * a, beam: 0.08 * a, tail: a, spot: 0 });
    const sp = prog(t, 1.1, 2.9);
    scan.col.value.setScalar(2.4);
    scan.z.value = lerp(NOSE - 0.4, TAIL + 0.4, E.inOutCubic(sp));
    scan.amt.value = sp > 0 && sp < 1 ? Math.min(1, sp * 6, (1 - sp) * 6) : 0;
    bloom.strength = 0.32;
    X.frame(t);
    const phi = lerp(-0.82, -0.46, E.inOutSine(prog(t, 0, 18)));
    const R = lerp(10.4, 9.7, E.outCubic(prog(t, 0, 4)));
    look(Math.cos(phi) * R, 2.3, Math.sin(phi) * R, 0, 0.5, 0.1, 30);
    draw();
  }

  // The arena: a match in progress; the camera tours lanes, tracking cameras, scoreboard and walls.
  const ARENA_CAM = track([
    [0, 13, 12, 26, 0, 0, -3, 44], [3.0, 16, 4.5, -10, 10.6, 0.3, 4, 38], [5.4, 16.8, 2.6, -17, 10.6, 0.4, -2, 36],
    [7.2, 18, 9, -12, 2, 3, 0, 40], [9.2, 29, 10.5, -6, -4, 7.0, 2, 40], [11.8, 6.5, 9.4, 16.5, 0, 10.4, 2.5, 32],
    [14.8, -11.4, 2.4, 21, -16, 2.6, 6, 36], [18, -12, 12.5, 24, 1, 0, -2, 42],
].map(([t, ...v]) => ({ t, v })));
  function arena(t, cam = null) {
    base(); floor.visible = false; reflection.visible = false; ring.visible = false; paint('silver'); scan.amt.value = 0;
    scene.fog.near = 70; scene.fog.far = 180;
    scene.environmentIntensity = 0.95;
    lights({ drl: 1, head: 0.5, beam: 0, spot: 0, tail: 1 });
    bloom.strength = 0.6;
    const coneAmt = E.outCubic(prog(t, 7.2, 8.0)) * (1 - E.inOutSine(prog(t, 10.6, 11.4)));
    const st = AR.frame(t, { car, wheels, bars: X.bars, coneAmt: 0 });
    placeBall(0.5 - 0.08 * t, BALL_R, 1.5 - 0.06 * t, -t * 0.13, t * 0.1, true);
    const c = cam || ARENA_CAM(t);
    look(c[0], c[1], c[2], c[3], c[4], c[5], c[6]);
    draw();
    // tracking overlay: what the arena cameras see (screen-space boxes around every car and the ball)
    const amt = cam ? 0 : coneAmt, boxes = [];
    if (amt > 0) {
      st.poses.forEach((p, i) => {
        const cs = Math.cos(p.ry), sn = Math.sin(p.ry); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, front = true;
        for (const lx of [bb.min.x, bb.max.x]) for (const ly of [0, 1.2]) for (const lz of [NOSE, TAIL]) {
          const q = project(p.x + lx * cs + lz * sn, ly, p.z - lx * sn + lz * cs);
          if (q.z > 1) front = false; x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y);
        }
        if (front) boxes.push({ x0, y0, x1, y1, label: `#${i + 1}`, sub: `${st.speeds[i].toFixed(1)} m/s` });
      });
      const b0 = project(ball.position.x, ball.position.y, ball.position.z), br = Math.abs(project(ball.position.x, ball.position.y + BALL_R, ball.position.z).y - b0.y);
      if (b0.z < 1) boxes.push({ x0: b0.x - br, y0: b0.y - br, x1: b0.x + br, y1: b0.y + br, label: 'ball', sub: '' });
    }
    const pods = AR.pods.map(p => project(p.x, p.y, p.z)).filter(q => q.z < 1 && q.x > 0 && q.x < 1920 && q.y > 0 && q.y < 1080);
    return { amt, boxes, pods };
  }

  function project(x, y, z) {
    const v = V3(x, y, z).project(camera);
    return { x: (v.x + 1) * 960, y: (1 - v.y) * 540, z: v.z };
  }

  // ---------- bake 2D sprites from the real 3D car (transparent canvases) ----------
  function bake() {
    const save = { bg: scene.background, env: scene.environmentIntensity };
    const hide = [floor, reflection, ring, ball, ballRefl, ballShadow, shadow, ...beams, dust, ...spots];
    const vis = hide.map(o => o.visible);
    hide.forEach(o => (o.visible = false));
    scene.background = null; scene.environmentIntensity = 1.0;
    lights({ drl: 1, head: 0.6, tail: 0.8 });
    scan.amt.value = 0; placeCar(0); setWheel(0);
    renderer.setClearColor(0x000000, 0);
    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    const shot = (w, h, setup) => {
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      setup(ortho); ortho.updateProjectionMatrix();
      renderer.render(scene, ortho);
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(renderer.domElement, 0, 0);
      return c;
    };
    const ppm = 300, hw = 2.5, top = 1.4, bot = -0.1;
    const sideFrame = (o) => { o.left = -hw; o.right = hw; o.top = (top - bot) / 2; o.bottom = -(top - bot) / 2; o.position.set(20, (top + bot) / 2, 0); o.up.set(0, 1, 0); o.lookAt(0, (top + bot) / 2, 0); };
    const W = Math.round(hw * 2 * ppm), H = Math.round((top - bot) * ppm);
    paint('silver');
    wheels.forEach(w => (w.visible = false));
    const body = shot(W, H, sideFrame);
    wheels.forEach(w => (w.visible = true));
    const wheelPos = wheels.filter(w => /_(fr|rr)$/.test(w.name)).map(w => { const p = new THREE.Vector3(); w.getWorldPosition(p); return { x: (hw - p.z) * ppm, y: (top - p.y) * ppm }; });
    model.traverse(o => { if (o.isMesh) o.userData.v = o.visible; });
    parts.visible = false;
    const fr = wheels.find(w => w.name === 'wheel_fr');
    model.traverse(o => { if (o.isMesh) { let p = o, inW = false; while (p) { if (p === fr) inW = true; p = p.parent; } o.visible = inW; } });
    const wp = new THREE.Vector3(); fr.getWorldPosition(wp);
    const wr = 0.4;
    const wheel = shot(900, 900, (o) => { o.left = -wr; o.right = wr; o.top = wr; o.bottom = -wr; o.position.set(20, wp.y, wp.z); o.up.set(0, 1, 0); o.lookAt(0, wp.y, wp.z); });
    model.traverse(o => { if (o.isMesh) o.visible = o.userData.v; });
    parts.visible = true;
    const hh = 1.25;
    const topShot = () => shot(Math.round(hw * 2 * ppm), Math.round(hh * 2 * ppm), (o) => { o.left = -hw; o.right = hw; o.top = hh; o.bottom = -hh; o.position.set(0, 20, 0); o.up.set(-1, 0, 0); o.lookAt(0, 0, 0); });
    const topImg = topShot();
    paint('black');
    const topBlack = topShot();
    paint('silver');
    car.visible = false; placeBall(0, 0, 0, 0.5, 0.3, true); ballShadow.visible = false; ballRefl.visible = false;
    const br = 0.8;
    const ballImg = shot(720, 720, (o) => { o.left = -br; o.right = br; o.top = br; o.bottom = -br; o.position.set(6, 6, 12); o.up.set(0, 1, 0); o.lookAt(0, 0, 0); });
    car.visible = true;
    hide.forEach((o, i) => (o.visible = vis[i]));
    scene.background = save.bg; scene.environmentIntensity = save.env;
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(dpr); renderer.setSize(1920, 1080, false);
    arena(9.2, [12, 11, 25, 0, 0, -2, 46]);
    const arenaImg = document.createElement('canvas'); arenaImg.width = 960; arenaImg.height = 540;
    arenaImg.getContext('2d').drawImage(renderer.domElement, 0, 0, 960, 540);
    base();
    return {
      arena: arenaImg,
      side: { body, ppm, noseX: (hw - NOSE) * ppm, tailX: (hw - TAIL) * ppm, groundY: top * ppm, wheels: wheelPos, wheelR: 0.36 },
      wheel: { img: wheel, ppm: 900 / (wr * 2) },
      top: { img: topImg, black: topBlack, ppm, length: TAIL - NOSE },
      ball: { img: ballImg, ppm: 720 / (br * 2), r: BALL_R },
    };
  }

  return {
    renderer, intro, meet, features, arena, outro, hitbox, HITBOX, project, bake, OUT, HB,
    anchors: { ...X.anchors, ...AR.anchors, nose: V3(0, 0.35, NOSE + 0.1), corner: V3(0.85, 0.35, NOSE + 0.55), sill: V3(1.0, 0.3, 0.2), wing: V3(0.45, deckY + 0.27, TAIL - 0.6), bb },
  };
}
