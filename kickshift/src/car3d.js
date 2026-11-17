// KickShift 3D stage: studio-lit supercar, headlight reveal, smart ball, sprite baking.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import glb from '../assets/ferrari.glb';
import dracoWrapper from '../assets/draco_wrapper.txt';
import dracoWasm from '../assets/draco_decoder.wasm';
import aoUrl from '../assets/ferrari_ao.png';
import { clamp, lerp, prog, E } from './util.js';

const LIME = new THREE.Color(0xc6ff3a);
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

export const BODY_COLOR = 0x5fbf0e;

function makeEnv(renderer) {
  // Black studio with long soft-box strips -> classic supercar reflections.
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x020202);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const mk = (sx, sy, sz, x, y, z, k, tint = 0xffffff) => {
    const c = new THREE.Color(tint).multiplyScalar(k);
    const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: c }));
    m.scale.set(sx, sy, sz); m.position.set(x, y, z); s.add(m);
  };
  mk(1.4, 0.05, 16, -1.6, 7, 0, 2.4);
  mk(1.4, 0.05, 16, 1.6, 7, 0, 2.4);
  mk(0.05, 0.6, 18, -8, 2.2, 0, 1.5);
  mk(0.05, 0.6, 18, 8, 2.2, 0, 1.5);
  mk(0.05, 2.5, 3, 8, 3, -6, 0.9);
  mk(14, 0.5, 0.05, 0, 2.6, -10, 0.8);
  mk(14, 0.5, 0.05, 0, 2.6, 10, 0.6);
  mk(30, 0.05, 30, 0, -0.5, 0, 0.04);
  mk(0.05, 0.3, 18, -8, 0.6, 0, 0.5, 0xc6ff3a);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose();
  return tex;
}

function radialTex(inner = 'rgba(198,255,58,1)', outer = 'rgba(198,255,58,0)', size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeBall(radius) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 64, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x15181c, metalness: 0.2, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 })
  );
  g.add(shell);
  // Truncated-icosahedron seams projected onto the sphere (a real football pattern).
  const p = (1 + Math.sqrt(5)) / 2;
  const base = [[0, 1, 3 * p], [1, 2 + p, 2 * p], [p, 2, 2 * p + 1]];
  const verts = [];
  for (const b of base) {
    for (let r = 0; r < 3; r++) {
      const v = [b[r % 3], b[(r + 1) % 3], b[(r + 2) % 3]];
      for (let sx of [1, -1]) for (let sy of [1, -1]) for (let sz of [1, -1]) {
        const w = [v[0] * sx, v[1] * sy, v[2] * sz];
        if (!verts.some(q => Math.hypot(q[0] - w[0], q[1] - w[1], q[2] - w[2]) < 1e-6)) verts.push(w);
      }
    }
  }
  const geos = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) {
    const a = verts[i], b = verts[j];
    if (Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2) < 1e-3) {
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8;
        pts.push(V3(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)).normalize().multiplyScalar(radius * 1.003));
      }
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, radius * 0.012, 5, false));
    }
  }
  const seamMat = new THREE.MeshBasicMaterial({ color: LIME.clone().multiplyScalar(2.2), toneMapped: false });
  g.add(new THREE.Mesh(mergeGeometries(geos), seamMat));
  g.userData.seamMat = seamMat;
  return g;
}

function beamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uInt: { value: 0 }, uLen: { value: 9 }, uColor: { value: new THREE.Color(0xdfeeff) } },
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

  const scan = { z: { value: -10 }, amt: { value: 0 }, col: { value: LIME.clone().multiplyScalar(3) } };
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: BODY_COLOR, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02 });
  bodyMat.onBeforeCompile = (sh) => {
    sh.uniforms.uScanZ = scan.z; sh.uniforms.uScanAmt = scan.amt; sh.uniforms.uScanCol = scan.col;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uScanZ; uniform float uScanAmt; uniform vec3 uScanCol;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float sd = vWP.z - uScanZ;
        float band = exp(-sd*sd*40.0);
        float trail = smoothstep(0.0, -1.6, sd) * (0.5+0.5*step(0.92, fract(vWP.z*6.0)))*0.25*smoothstep(-1.6,-0.2,sd);
        totalEmissiveRadiance += uScanCol * uScanAmt * (band + trail);`);
  };
  const black = new THREE.MeshPhysicalMaterial({ color: 0x07080a, metalness: 0.6, roughness: 0.25, clearcoat: 1 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 1, roughness: 0.28 });
  const caliper = new THREE.MeshStandardMaterial({ color: 0xc6ff3a, metalness: 0.3, roughness: 0.35, emissive: 0x6a8f10, emissiveIntensity: 0.4 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a0c0f, metalness: 0.9, roughness: 0.04, transparent: true, opacity: 0.72 });
  const tire = new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: 0.82, metalness: 0 });
  const carbon = new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.38, metalness: 0.55 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x8a8f96, roughness: 0.15, metalness: 1 });
  const drlMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xe8f6ff, emissiveIntensity: 0, toneMapped: true });
  const headMat = new THREE.MeshStandardMaterial({ color: 0x15171a, emissive: 0xf2f8ff, emissiveIntensity: 0, roughness: 0.1, metalness: 0.5 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x1a0505, emissive: 0xff2a1a, emissiveIntensity: 0, roughness: 0.2 });

  const wheels = [];
  model.traverse((o) => {
    if (/^wheel_(fl|fr|rl|rr)$/.test(o.name)) wheels.push(o);
    if (!o.isMesh) return;
    const mn = o.material.name;
    if (mn === 'Body_Color') o.material = bodyMat;
    else if (mn === 'Ferrari_Yellow' || mn === 'Leather_red' || mn === '_0098_DodgerBlue') o.material = black;
    else if (mn === 'Glass_Gray') o.material = glass;
    else if (mn === 'Tires') o.material = tire;
    else if (mn === 'Carbon_Fiber') o.material = carbon;
    else if (mn === 'metal_chrome') o.material = chrome;
    else if (mn === 'Turn_Signal_LED') o.material = drlMat;
    else if (mn === 'Projector_Glass') o.material = headMat;
    else if (mn === 'Taillight_Glass') o.material = o.name === 'brakes' ? tailMat : tailMat;
    else if (mn === 'metal_gray') o.material = (o.name === 'brake') ? caliper : rimMat;
    else if (mn === 'plastic_gray') o.material = carbon;
    else { o.material = o.material.clone(); }
  });

  car.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(model);
  const meshes = []; model.traverse(o => o.isMesh && meshes.push(o));
  const rc = new THREE.Raycaster();
  const hit = (o, d) => { rc.set(o, d); const h = rc.intersectObjects(meshes, false)[0]; return h ? h.point : null; };

  // ---------- KickShift bodywork: strike-splitter, LED sills, rear wing, underglow ----------
  const accentMat = new THREE.MeshBasicMaterial({ color: LIME.clone().multiplyScalar(2.4), toneMapped: false });
  const parts = new THREE.Group(); car.add(parts);
  const front = [];
  for (let i = 0; i <= 18; i++) {
    const x = lerp(-0.93, 0.93, i / 18);
    const p = hit(V3(x, 0.2, bb.min.z - 3), V3(0, 0, 1));
    if (p) front.push(V3(x, 0.1, p.z - 0.07));
  }
  if (front.length > 4) {
    const curve = new THREE.CatmullRomCurve3(front);
    parts.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.011, 8, false), accentMat));
    const shape = new THREE.Shape();
    front.forEach((p, i) => (i ? shape.lineTo(p.x, -p.z) : shape.moveTo(p.x, -p.z)));
    for (let i = front.length - 1; i >= 0; i--) shape.lineTo(front[i].x * 0.96, -(front[i].z + 0.42));
    const sg = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false });
    sg.rotateX(-Math.PI / 2);
    const sp = new THREE.Mesh(sg, carbon); sp.position.y = 0.075; parts.add(sp);
  }
  for (const side of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const z = lerp(bb.min.z + 1.45, bb.max.z - 1.25, i / 12);
      const p = hit(V3(side * 4, 0.3, z), V3(-side, 0, 0));
      if (p) pts.push(V3(p.x + side * 0.015, 0.2, z));
    }
    if (pts.length > 3) parts.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.009, 8, false), accentMat));
  }
  {
    const deck = hit(V3(0, 5, bb.max.z - 0.5), V3(0, -1, 0));
    const deckY = deck ? deck.y : bb.max.y * 0.85;
    const chord = 0.46, span = 1.8;
    const af = new THREE.Shape();
    af.moveTo(0, 0);
    af.bezierCurveTo(0.02, 0.05, 0.16, 0.065, chord, 0.03);
    af.bezierCurveTo(0.2, 0.015, 0.05, -0.02, 0, 0);
    const wg = new THREE.ExtrudeGeometry(af, { depth: span, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 16 });
    wg.rotateY(-Math.PI / 2); wg.translate(span / 2, 0, 0);
    const wing = new THREE.Mesh(wg, carbon);
    wing.position.set(0, deckY + 0.26, bb.max.z - 0.78);
    wing.rotation.x = 0.1;
    parts.add(wing);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(span, 0.008, 0.012), accentMat);
    lip.position.set(0, deckY + 0.245, bb.max.z - 0.34); parts.add(lip);
    for (const x of [-0.48, 0.48]) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.3, 0.16), carbon);
      st.position.set(x, deckY + 0.12, bb.max.z - 0.62); st.rotation.x = -0.25; parts.add(st);
    }
  }
  const under = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), new THREE.MeshBasicMaterial({ map: radialTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }));
  under.rotation.x = -Math.PI / 2; under.position.y = 0.012; under.scale.set(1, 1, 1);
  car.add(under);

  // ---------- lights ----------
  const lampZ = bb.min.z + 0.42, lampY = 0.66, lampX = 0.66;
  const spots = [], beams = [];
  const beamGeo = new THREE.ConeGeometry(1.7, 9, 96, 1, true); beamGeo.translate(0, -4.5, 0);
  const bMat = beamMaterial();
  for (const s of [-1, 1]) {
    const sp = new THREE.SpotLight(0xeef5ff, 0, 45, 0.42, 0.6, 1.3);
    sp.position.set(s * lampX, lampY, lampZ);
    sp.target.position.set(s * 1.1, 0, lampZ - 9);
    car.add(sp, sp.target); spots.push(sp);
    const b = new THREE.Mesh(beamGeo, bMat);
    b.position.set(s * lampX, lampY, lampZ - 0.05);
    b.quaternion.setFromUnitVectors(V3(0, -1, 0), V3(s * 0.05, -0.07, -1).normalize());
    car.add(b); beams.push(b);
  }
  // dust floating in the beams
  {
    const N = 900, pos = new Float32Array(N * 3);
    let seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const d = 0.6 + r() * 8, s = r() < 0.5 ? -1 : 1, rad = d * 0.22 * Math.sqrt(r()), a = r() * Math.PI * 2;
      pos[i * 3] = s * lampX + Math.cos(a) * rad; pos[i * 3 + 1] = lampY - d * 0.07 + Math.sin(a) * rad; pos[i * 3 + 2] = lampZ - d;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, map: radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: 0xdfeeff }));
    car.add(dust);
  }
  const rimA = new THREE.SpotLight(0xc6ff3a, 0, 30, 0.5, 0.7, 1.2); rimA.position.set(-5, 4.5, 5);
  const rimB = new THREE.SpotLight(0xffffff, 0, 30, 0.5, 0.7, 1.2); rimB.position.set(5, 5, 4);
  const key = new THREE.SpotLight(0xffffff, 0, 30, 0.6, 0.8, 1.2); key.position.set(3, 7, -5);
  for (const l of [rimA, rimB, key]) { l.target.position.set(0, 0.4, 0); scene.add(l, l.target); }

  // ---------- floor + fake mirror reflection ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x060708, roughness: 0.22, metalness: 0.0, transparent: true, opacity: 0.9, envMap: scene.environment, envMapIntensity: 0.15 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ringMat = new THREE.MeshBasicMaterial({ color: LIME.clone().multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0 });
  const ring = new THREE.Group();
  ring.add(new THREE.Mesh(new THREE.RingGeometry(3.25, 3.27, 192), ringMat));
  ring.add(new THREE.Mesh(new THREE.RingGeometry(3.45, 3.455, 192), ringMat));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.004; scene.add(ring);

  const reflection = car.clone(true);
  reflection.scale.y = -1;
  reflection.traverse(o => { if (o.isSpotLight || o === under) o.visible = false; });
  const rWheels = []; reflection.traverse(o => /^wheel_(fl|fr|rl|rr)$/.test(o.name) && rWheels.push(o));
  const rBeams = []; reflection.traverse(o => o.isMesh && o.material === bMat && rBeams.push(o));
  rBeams.forEach(b => (b.visible = false));
  reflection.traverse(o => { if (o.isPoints) o.visible = false; if (o.isMesh && o.material && o.material.map && o.material.blending === THREE.AdditiveBlending) o.visible = false; });
  scene.add(reflection, car);

  const ao = await new THREE.TextureLoader().loadAsync(aoUrl);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.655 * 4, 1.3 * 4), new THREE.MeshBasicMaterial({ map: ao, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; shadow.renderOrder = 2; car.add(shadow);

  // ---------- ball ----------
  const BALL_R = 0.75;
  const ball = makeBall(BALL_R); scene.add(ball);
  const ballRefl = ball.clone(true); ballRefl.scale.y = -1; scene.add(ballRefl);
  const ballShadow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: radialTex('rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  ballShadow.rotation.x = -Math.PI / 2; ballShadow.position.y = 0.003; scene.add(ballShadow);

  // ---------- post ----------
  const rt = new THREE.WebGLRenderTarget(1920 * dpr, 1080 * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setSize(1920, 1080);
  composer.addPass(new RenderPass(scene, camera));
  // kill NaN/Inf pixels (from degenerate normals) before they smear through the bloom
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); bool bad = !(c.r == c.r) || !(c.g == c.g) || !(c.b == c.b) || c.r > 6e4 || c.g > 6e4 || c.b > 6e4;
      gl_FragColor = bad ? vec4(0.0,0.0,0.0,1.0) : vec4(min(c.rgb, vec3(8.0)), c.a); }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1920, 1080), 0.55, 0.4, 1.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- state helpers ----------
  function lights({ drl = 0, head = 0, tail = 0, beam = 0, under: u = 0, accent = 1, rim = 0, keyL = 0, spot = null } = {}) {
    drlMat.emissiveIntensity = drl * 9;
    headMat.emissiveIntensity = head * 7;
    tailMat.emissiveIntensity = tail * 5;
    spots.forEach(s => (s.intensity = (spot ?? head) * 70));
    bMat.uniforms.uInt.value = beam * 0.12;
    dust.material.opacity = beam * 0.9;
    under.material.opacity = u * 0.22;
    accentMat.color.copy(LIME).multiplyScalar(2.4 * accent);
    caliper.emissiveIntensity = 0.4 * accent;
    rimA.intensity = 0 * rim; rimB.intensity = 0; key.intensity = 0 * keyL;
  }
  function setWheel(angle) { wheels.forEach(w => (w.rotation.x = -angle)); rWheels.forEach(w => (w.rotation.x = -angle)); }
  function placeCar(z) { car.position.z = z; reflection.position.z = z; }
  function placeBall(x, y, z, rx = 0, rz = 0, show = true) {
    ball.visible = ballRefl.visible = ballShadow.visible = show;
    ball.position.set(x, y, z); ball.rotation.set(rx, 0, rz);
    ballRefl.position.set(x, -y, z); ballRefl.rotation.set(-rx, 0, -rz);
    const h = Math.max(0, y - BALL_R);
    ballShadow.position.set(x, 0.003, z); const s = BALL_R * 1.25 * (1 + h * 0.25); ballShadow.scale.set(s, s, s);
    ballShadow.material.opacity = 1 / (1 + h * 0.8);
  }
  function look(px, py, pz, tx, ty, tz, fov = 30, shiftX = 0) {
    camera.position.set(px, py, pz); camera.fov = fov;
    if (shiftX) camera.setViewOffset(1920, 1080, -shiftX, 0, 1920, 1080); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); camera.lookAt(tx, ty, tz);
  }
  function draw() { composer.render(); }

  const NOSE = bb.min.z, TAIL = bb.max.z;

  // ---------- slide renderers (pure functions of t) ----------
  function flicker(t, t0) {
    const d = t - t0; if (d < 0) return 0;
    if (d < 0.07) return 1; if (d < 0.16) return 0.05; if (d < 0.22) return 0.7; if (d < 0.34) return 0.0;
    return E.outCubic(clamp((d - 0.34) / 0.18));
  }

  function intro(t) {
    ring.visible = false; placeBall(0, 0, 0, 0, 0, false); placeCar(0); setWheel(0);
    const drl = flicker(t, 3.7);
    const head = E.outExpo(prog(t, 4.55, 4.75));
    const env = E.inOutCubic(prog(t, 5.2, 8.8));
    scene.environmentIntensity = 0.9 * env;
    floor.material.opacity = 0.88;
    lights({ drl, head, beam: head * (1 - 0.35 * env), tail: prog(t, 6.2, 6.6), under: E.outCubic(prog(t, 7.0, 8.2)), accent: E.outCubic(prog(t, 6.6, 7.2)) * 1, rim: 0.6 * env, keyL: 0 });
    const sp = prog(t, 4.9, 7.1);
    scan.z.value = lerp(NOSE - 0.6, TAIL + 0.6, E.inOutCubic(sp));
    scan.amt.value = sp > 0 && sp < 1 ? Math.min(1, sp * 6, (1 - sp) * 6) : 0;
    bloom.strength = 0.7 + 0.9 * Math.exp(-Math.pow((t - 4.62) * 5, 2));
    const k = E.inOutCubic(prog(t, 3.4, 13));
    const drift = Math.max(0, t - 9) * 0.02;
    look(lerp(2.4, 5.6, k) + drift, lerp(0.42, 1.25, k), lerp(-6.4, -4.9, k), lerp(-0.2, 0.25, k), lerp(0.55, 0.85, k), lerp(-1.6, -0.1, k), lerp(26, 30, k));
    draw();
  }

  function meet(t) {
    ring.visible = true; placeBall(0, 0, 0, 0, 0, false); placeCar(0); setWheel(t * 0);
    const a = E.outCubic(prog(t, 0, 1.0));
    scene.environmentIntensity = 1.3 * a;
    ringMat.opacity = 0.8 * E.outCubic(prog(t, 0.3, 1.6));
    ring.scale.setScalar(lerp(0.6, 1, E.outExpo(prog(t, 0.3, 1.6))));
    lights({ drl: a, head: 0.55 * a, beam: 0.25 * a, tail: a, under: 0.8 * a, accent: a, rim: 1.0 * a, keyL: 0.6 * a });
    scan.amt.value = 0; bloom.strength = 0.65;
    const phi = lerp(-1.2, -0.66, E.inOutSine(prog(t, 0, 15)));
    const R = lerp(8.6, 7.4, E.outCubic(prog(t, 0, 3)));
    look(Math.cos(phi) * R + 0.3, 1.55, Math.sin(phi) * R, 0.15, 0.5, 0, 31, -60);
    draw();
  }

  // Closing: car launches, strikes the ball toward the lens, flash, hero pose.
  const OUT = { launch: 1.7, acc: 8, ballZ: -9.2, slow: 0.32 };
  const HB = { x: -2.5, z: -1.5, shift: 250, phi: -0.75, R: 9.5 };
  OUT.sc = NOSE - (OUT.ballZ + BALL_R); // nose travel until it touches the ball
  OUT.tc = Math.sqrt(2 * OUT.sc / OUT.acc);
  OUT.vc = OUT.acc * OUT.tc;
  OUT.cam = V3(-4.6, 1.15, -15.6);
  function outro(t) {
    ring.visible = false; scan.amt.value = 0;
    const tC = OUT.launch + OUT.tc; // contact time
    let flash = 0;
    const bloomBase = 0.7;
    if (t < tC + 1.4) {
      // action
      const f1 = Math.exp(-Math.pow((t - 0.55) * 9, 2)), f2 = Math.exp(-Math.pow((t - 0.95) * 9, 2));
      const lit = E.outCubic(prog(t, 0.0, 0.3));
      scene.environmentIntensity = 0.55;
      lights({ drl: lit, head: Math.max(0.5 * lit, f1 * 1.1, f2 * 1.1), spot: 0, beam: 0, tail: lit, under: 0.8 * lit, accent: 1, rim: 0.5 });
      bloom.strength = bloomBase + 0.8 * Math.max(f1, f2);
      let s, v;
      if (t < OUT.launch) { s = 0; v = 0; }
      else if (t < tC) { const tau = t - OUT.launch; s = 0.5 * OUT.acc * tau * tau; v = OUT.acc * tau; }
      else { const tau = (t - tC) * OUT.slow; const v2 = OUT.vc * (900 - 0.6 * 20) / 920; s = OUT.sc + v2 * tau - 0.5 * 6 * tau * tau; v = v2; }
      placeCar(-s); setWheel(s / 0.36);
      // ball
      if (t < tC) placeBall(0, BALL_R, OUT.ballZ, 0, 0, true);
      else {
        const tau = (t - tC) * OUT.slow;
        const vb = 1.6 * 900 * OUT.vc / 920;
        const start = V3(0, BALL_R, OUT.ballZ);
        const dir = OUT.cam.clone().add(V3(0.6, -0.1, 0)).sub(start).normalize();
        const vy = vb * 0.32;
        const p = start.clone().addScaledVector(dir, vb * tau); p.y = BALL_R + (dir.y * vb + vy) * tau - 4.9 * tau * tau;
        placeBall(p.x, Math.max(BALL_R, p.y), p.z, -tau * 9, tau * 2, true);
        const d = p.distanceTo(OUT.cam);
        flash = clamp((3.2 - d) / 1.6);
      }
      const shake = t > tC ? Math.exp(-(t - tC) * 6) * 0.05 : 0;
      look(OUT.cam.x + Math.sin(t * 90) * shake, OUT.cam.y + Math.cos(t * 77) * shake, OUT.cam.z, 0, 0.7, -6.5, 34);
      draw();
      return { flash, phase: 0 };
    }
    // hero pose after the flash
    const h = t - (tC + 1.4);
    placeCar(0); setWheel(0);
    placeBall(HB.x, BALL_R, HB.z, 0.4, 0.2, true);
    scene.environmentIntensity = 0.95;
    lights({ drl: 1, head: 0.8, beam: 0.35, tail: 1, under: 0.9, accent: 1, rim: 1, keyL: 0.4 });
    bloom.strength = 0.7;
    const phi = HB.phi - h * 0.02;
    look(Math.cos(phi) * HB.R + 0.6, 1.35, Math.sin(phi) * HB.R - 0.6, 0.6, 0.55, -0.8, 30, HB.shift);
    draw();
    return { flash: clamp(1 - h / 0.9), phase: 1 };
  }
  OUT.end = OUT.launch + OUT.tc + 1.4;

  function project(x, y, z) {
    const v = V3(x, y, z).project(camera);
    return { x: (v.x + 1) * 960, y: (1 - v.y) * 540, z: v.z };
  }

  // ---------- bake 2D sprites from the real 3D car (transparent PNG canvases) ----------
  function bake() {
    const save = { bg: scene.background, env: scene.environmentIntensity };
    const hide = [floor, reflection, ring, ball, ballRefl, ballShadow, shadow, under, ...beams, dust, ...spots];
    const vis = hide.map(o => o.visible);
    hide.forEach(o => (o.visible = false));
    scene.background = null; scene.environmentIntensity = 1.0;
    lights({ drl: 1, head: 0.6, tail: 1, accent: 1, rim: 0.8, keyL: 0.8 });
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
    const ppm = 300, hw = 2.5, top = 1.35, bot = -0.15;
    // side (car faces right): camera on +X looking -X
    const sideFrame = (o) => { o.left = -hw; o.right = hw; o.top = (top - bot) / 2; o.bottom = -(top - bot) / 2; o.position.set(20, (top + bot) / 2, 0); o.up.set(0, 1, 0); o.lookAt(0, (top + bot) / 2, 0); };
    const W = Math.round(hw * 2 * ppm), H = Math.round((top - bot) * ppm);
    wheels.forEach(w => (w.visible = false));
    const body = shot(W, H, sideFrame);
    wheels.forEach(w => (w.visible = true));
    const wheelPos = wheels.filter(w => /_(fr|rr)$/.test(w.name)).map(w => { const p = new THREE.Vector3(); w.getWorldPosition(p); return { x: (hw - p.z) * ppm, y: (top - p.y) * ppm, name: w.name }; });
    // single wheel sprite
    model.traverse(o => { if (o.isMesh) o.userData.v = o.visible; });
    parts.visible = false;
    const fr = wheels.find(w => w.name === 'wheel_fr');
    model.traverse(o => { if (o.isMesh) { let p = o, inW = false; while (p) { if (p === fr) inW = true; p = p.parent; } o.visible = inW; } });
    const wp = new THREE.Vector3(); fr.getWorldPosition(wp);
    const wr = 0.4;
    const wheel = shot(Math.round(wr * 2 * ppm), Math.round(wr * 2 * ppm), (o) => { o.left = -wr; o.right = wr; o.top = wr; o.bottom = -wr; o.position.set(20, wp.y, wp.z); o.up.set(0, 1, 0); o.lookAt(0, wp.y, wp.z); });
    model.traverse(o => { if (o.isMesh) o.visible = o.userData.v; });
    parts.visible = true;
    // top (car faces right): camera above, up = -X
    const hh = 1.25;
    const topImg = shot(Math.round(hw * 2 * ppm), Math.round(hh * 2 * ppm), (o) => { o.left = -hw; o.right = hw; o.top = hh; o.bottom = -hh; o.position.set(0, 20, 0); o.up.set(-1, 0, 0); o.lookAt(0, 0, 0); });
    // ball sprite
    car.visible = false; ball.visible = true; placeBall(0, 0, 0, 0.5, 0.3, true); ballShadow.visible = false; ballRefl.visible = false;
    const br = 0.8;
    const ballImg = shot(480, 480, (o) => { o.left = -br; o.right = br; o.top = br; o.bottom = -br; o.position.set(6, 6, 12); o.up.set(0, 1, 0); o.lookAt(0, 0, 0); });
    car.visible = true;
    // restore
    hide.forEach((o, i) => (o.visible = vis[i]));
    scene.background = save.bg; scene.environmentIntensity = save.env;
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(dpr); renderer.setSize(1920, 1080, false);
    return {
      side: { body, ppm, noseX: (hw - NOSE) * ppm, tailX: (hw - TAIL) * ppm, groundY: top * ppm, wheels: wheelPos, wheelR: 0.36 },
      wheel: { img: wheel, ppm },
      top: { img: topImg, ppm, length: TAIL - NOSE },
      ball: { img: ballImg, ppm: 480 / (br * 2), r: BALL_R },
    };
  }

  return {
    renderer, intro, meet, outro, project, bake, OUT, HB,
    anchors: { nose: V3(0, 0.35, NOSE + 0.1), corner: V3(0.85, 0.35, NOSE + 0.55), sill: V3(1.0, 0.3, 0.2), wing: V3(0.45, 1.22, TAIL - 0.6), bb },
  };
}
