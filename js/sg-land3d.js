/* 漢威牧區｜我的領地：Islanders 風格低多邊形 3D 小島（Gemini「從園子到聖城」原型，第二階段「成長中」）
   ＋ GPT 建築、人物元件（images/garden/*.webp，用 3D 看板放在地面上，比例縮小到和樹、地形相稱）。
   這一版只看樣子：讀經、測驗、存檔都還沒接。three.js r160 放在 js/vendor/three/（MIT）。 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const box = document.getElementById('land3d');
if (box) start(box);

function start(box) {
  const V = '20261117a', IMG = 'images/garden/';
  const P = {
    shoal: 0x7FE0CF, riverLake: 0x4FCFD0, sand: 0xF3E2A6, grass: 0x9CCB45, dryLand: 0xC3C85A, forest: 0x4E8F48,
    cliffBase: 0x5E7468, limestone: 0xEFE6D2, plateau: 0xEFA65A, whiteStone: 0xF4EBDD, wood: 0xC98B55, redTile: 0xE86F51, tealRoof: 0x3BB3BD, tentCloth: 0xFFFFFF
  };
  const C = {}; for (const k in P) C[k] = new THREE.Color(P[k]);

  // ---------- 亂數與雜訊（同原型） ----------
  class Rng { constructor(s) { this.s = s % 2147483647; if (this.s <= 0) this.s += 2147483646; } next() { this.s = this.s * 16807 % 2147483647; return (this.s - 1) / 2147483646; } range(a, b) { return a + this.next() * (b - a); } int(a, b) { return Math.floor(this.range(a, b + 1)); } }
  class Noise {
    constructor(seed) { const r = new Rng(seed), p = new Uint8Array(256); this.perm = new Uint8Array(512); for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = Math.floor(r.next() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]; }
    noise(x, y) {
      const f = t => t * t * t * (t * (t * 6 - 15) + 10), L = (a, b, t) => a + t * (b - a), g = (h, x, y) => { h &= 7; const u = h < 4 ? x : y, v = h < 4 ? y : x; return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v) * .5; };
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y), u = f(xf), v = f(yf), p = this.perm;
      return (L(L(g(p[p[X] + Y], xf, yf), g(p[p[X + 1] + Y], xf - 1, yf), u), L(g(p[p[X] + Y + 1], xf, yf - 1), g(p[p[X + 1] + Y + 1], xf - 1, yf - 1), u), v) + 1) * .5;
    }
    fbm(x, y, o = 3) { let v = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += a * this.noise(x * f, y * f); n += a; a *= .5; f *= 2.05; } return v / n; }
  }

  // ---------- 渲染器、鏡頭、光 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.04;
  renderer.domElement.style.touchAction = 'none';
  box.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdaf0f4); scene.fog = new THREE.FogExp2(0xdaf0f4, .0085);
  const camera = new THREE.PerspectiveCamera(38, 1, .5, 320);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableRotate: false, enablePan: true, enableZoom: true, screenSpacePanning: false, panSpeed: 1.05, zoomSpeed: .95, minDistance: 9, maxDistance: 70 });
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  scene.add(Object.assign(new THREE.HemisphereLight(0xf6fcff, 0x7b988e, .82), {}));
  const sun = new THREE.DirectionalLight(0xfff8eb, 1.48);
  sun.position.set(-28, 42, -26); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { near: 5, far: 130, left: -24, right: 24, top: 24, bottom: -24 }); sun.shadow.bias = -.0006;
  scene.add(sun);
  const NW = new THREE.Vector3(-.65, .45, -.61).normalize();
  const world = new THREE.Group(); scene.add(world);
  const anim = [];

  const matCache = new Map();
  const flat = (hex, o = {}) => { const k = hex + '_' + (o.opacity || 1) + '_' + (o.side || 0); if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: hex, flatShading: true, roughness: .85, metalness: .02, transparent: !!o.transparent, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide })); return matCache.get(k); };
  const terrace = (h, s = .65, sh = .78) => { const q = h / s, b = Math.floor(q), f = q - b; let t = 0; if (f > sh) { const u = (f - sh) / (1 - sh); t = u * u * (3 - 2 * u); } return (b + t) * s; };

  // ---------- 地形：第二階段「成長中」 ----------
  const SEED = 2026, rng = new Rng(SEED), noise = new Noise(SEED), rnoise = new Noise(SEED + 99);
  const R = 12.6, rAmp = rng.range(1.6, 2.8), rFreq = rng.range(.14, .22), rPh = rng.range(0, Math.PI * 2);
  const riverX = z => Math.sin(z * rFreq + rPh) * rAmp + (rnoise.noise(z * .08 + 5, 1.5) - .5) * 1.8;
  const TAB = { x: 2.6, z: -0.5 };
  function sample(x, z) {
    const rx = riverX(z), dR = Math.abs(x - rx), a = Math.atan2(z * .82, x * 1.15);
    const inside = R + (noise.fbm(Math.cos(a) * 1.8 + 4, Math.sin(a) * 1.8 + 4, 3) - .5) * 3.4 - Math.hypot(x * 1.12, z * .84);
    if (inside < 0) return { inside: false, height: -.6, dR };
    let base = .55 + noise.fbm(x * .11 + 10, z * .11 + 10, 3) * 1.65 + Math.max(0, dR - 2.2) * .14;
    if (Math.hypot(x - TAB.x, z - TAB.z) < 3.4) base = 1.15;   // 會幕區平緩高地
    let h = terrace(base, .58, .76);
    if (dR < .92) h = .18; else if (dR < 1.57) h = Math.min(h, .58);
    return { inside: true, height: h, dR };
  }
  {
    const N = 58, span = 34, st = span / N, pts = [], pos = [];
    for (let iz = 0; iz <= N; iz++) { const row = []; for (let ix = 0; ix <= N; ix++) {
      const x = -span / 2 + ix * st + (noise.noise(ix * .7, iz * .7) - .5) * st * .55, z = -span / 2 + iz * st + (noise.noise(ix * .7 + 31, iz * .7 + 31) - .5) * st * .55;
      row.push({ x, z, ...sample(x, z) }); } pts.push(row); }
    const v = p => ({ x: p.x, y: p.inside ? p.height : -.75, z: p.z }), tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    for (let iz = 0; iz < N; iz++) for (let ix = 0; ix < N; ix++) {
      const a = pts[iz][ix], b = pts[iz][ix + 1], c = pts[iz + 1][ix], d = pts[iz + 1][ix + 1];
      if (!(a.inside || b.inside || c.inside || d.inside)) continue;
      if ((ix + iz) % 2 === 0) { tri(v(a), v(c), v(b)); tri(v(b), v(c), v(d)); } else { tri(v(a), v(c), v(d)); tri(v(a), v(d), v(b)); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const P3 = g.attributes.position, col = new Float32Array(P3.count * 3), A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), n = new THREE.Vector3(), e = new THREE.Vector3(), cen = new THREE.Vector3(), t = new THREE.Color();
    for (let i = 0; i < P3.count; i += 3) {
      A.fromBufferAttribute(P3, i); B.fromBufferAttribute(P3, i + 1); Cc.fromBufferAttribute(P3, i + 2);
      n.subVectors(Cc, B).cross(e.subVectors(A, B)).normalize(); cen.copy(A).add(B).add(Cc).multiplyScalar(1 / 3);
      if (Math.max(0, n.y) < .72) t.copy(C.cliffBase).multiplyScalar(THREE.MathUtils.clamp(.88 + n.dot(NW) * .34, .56, 1.24));
      else if (cen.y < .35 || Math.abs(cen.x - riverX(cen.z)) < .98) t.copy(C.sand);
      else if (cen.y > 1.75) t.copy(C.dryLand); else t.copy(C.grass);
      for (let k = 0; k < 3; k++) col.set([t.r, t.g, t.b], (i + k) * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .88, metalness: .02 }));
    m.receiveShadow = m.castShadow = true; world.add(m);
  }
  // 四周淺海
  { const w = new THREE.Mesh(new THREE.PlaneGeometry(90, 90).rotateX(-Math.PI / 2), flat(P.shoal, { transparent: true, opacity: .72 })); w.position.y = -.35; world.add(w); }
  // 河
  {
    const segs = 44, z0 = -R * 1.05, z1 = R * 1.05, hw = .85, rp = [];
    for (let i = 0; i < segs; i++) { const a = THREE.MathUtils.lerp(z0, z1, i / segs), b = THREE.MathUtils.lerp(z0, z1, (i + 1) / segs), xa = riverX(a), xb = riverX(b);
      rp.push(xa - hw, .44, a, xa + hw, .44, a, xb - hw, .44, b, xa + hw, .44, a, xb + hw, .44, b, xb - hw, .44, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, flat(P.riverLake, { side: THREE.DoubleSide })); m.receiveShadow = true; world.add(m);
    anim.push(t => { const a = g.attributes.position; for (let i = 0; i < a.count; i++) a.setY(i, .44 + Math.sin(t * 2.6 + a.getZ(i) * .9) * .025); a.needsUpdate = true; });
  }

  // ---------- GPT 元件：用看板（永遠面向鏡頭）立在地面上 ----------
  const loader = new THREE.TextureLoader();
  const tex = (name, mirror) => { const t = loader.load(`${IMG}${name}.webp?v=${V}`); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (mirror) { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; } return t; };
  const blobMat = new THREE.MeshBasicMaterial({ color: 0x24402e, transparent: true, opacity: .22, depthWrite: false });
  const blobGeo = new THREE.CircleGeometry(.5, 16).rotateX(-Math.PI / 2);
  // [圖, 名稱, 寬（世界單位）, 想放的位置 x, z, 高寬比(圖高/圖寬)]
  const ITEMS = [
    ['b1-01', '會幕', 3.2, TAB.x, TAB.z, 288 / 363], ['b1-06', '泥磚民居', 1.25, 3.6, 3.6, 283 / 348], ['b1-06', '泥磚民居', 1.15, 5.0, 2.2, 283 / 348],
    ['b1-06', '泥磚民居', 1.2, -2.6, 4.4, 283 / 348], ['b1-07', '葡萄園', 1.9, -3.9, -2.8, 272 / 367], ['b1-05', '城門', 1.7, 0.6, -5.8, 298 / 352],
    ['b2-09', '以琳棕樹', 1.5, -4.6, 1.6, 344 / 317], ['b2-04', '馬槽', 1.25, 1.8, 4.9, 274 / 356], ['b1-08', '日晷', .7, 4.6, -2.4, 211 / 247],
    ['b1-04', '大衛的琴', .55, 4.2, 4.6, 328 / 259], ['b2-05', '漁港碼頭', 1.3, null, 2.6, 297 / 344]
  ];
  const occupied = [];
  function placeSprite(name, w, x, z, ratio, y) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(name), toneMapped: false, transparent: true, alphaTest: .05 }));
    s.center.set(.5, .06); s.scale.set(w, w * ratio, 1); s.position.set(x, y + .03, z); world.add(s);
    const b = new THREE.Mesh(blobGeo, blobMat); b.scale.set(w * .9, 1, w * .62); b.position.set(x + .08, y + .02, z + .05); world.add(b);
    occupied.push({ x, z, r: w * .55 });
    return s;
  }
  ITEMS.forEach(([name, , w, x, z, ratio]) => {
    if (x === null) x = riverX(z) + 1.75;   // 碼頭：貼著河岸
    let best = null;
    for (let r = 0; r < 3 && !best; r += .4) for (let a = 0; a < 12 && !best; a++) {
      const px = x + Math.cos(a / 12 * Math.PI * 2) * r, pz = z + Math.sin(a / 12 * Math.PI * 2) * r, c = sample(px, pz);
      if (!c.inside || c.dR < 1.3 + w * .3) continue;
      const hs = [[-.4, 0], [.4, 0], [0, -.3], [0, .3]].map(([dx, dz]) => sample(px + dx * w, pz + dz * w).height);   // 整棟要在同一層台地上
      if (hs.some(h => Math.abs(h - c.height) > .05)) continue;
      if (occupied.some(o => Math.hypot(o.x - px, o.z - pz) < o.r + w * .5)) continue;
      best = { x: px, z: pz, y: c.height };
    }
    if (best) placeSprite(name, w, best.x, best.z, ratio, best.y);
  });
  // 河上的漁船、約旦河邊的紀念石
  { const z = -3.6, x = riverX(z); placeSprite('b2-03', .95, x, z, 295 / 284, .44); }
  { const z = 5.6, x = riverX(z) - 1.5, c = sample(x, z); if (c.inside) placeSprite('b2-08', .7, x, z, 236 / 361, c.height); }
  const freeAt = (x, z, pad = .3) => !occupied.some(o => Math.hypot(o.x - x, o.z - z) < o.r + pad);

  // ---------- 樹、花草（程式畫的低多邊形，避開建築） ----------
  const trees = [], fruit = [], fol = [], leaves = [];
  for (let i = 0; i < 70; i++) {
    const a = rng.range(0, Math.PI * 2), r = rng.range(2, R * .88), x = Math.cos(a) * r, z = Math.sin(a) * r, c = sample(x, z);
    if (!c.inside || c.dR < 1.35 || !freeAt(x, z, .45)) continue;
    if (i % 3 === 0) { trees.push({ x, y: c.height, z, s: rng.range(.6, .95) }); if (leaves.length < 3) leaves.push({ x, y: c.height + .4, z }); }
    else if (i % 5 === 1) fruit.push({ x, y: c.height, z, s: rng.range(.6, .85) });
    else fol.push({ x, y: c.height, z });
  }
  function treeMesh(list, isFruit) {
    if (!list.length) return;
    const tg = new THREE.CylinderGeometry(.08, .14, .65, 5).translate(0, .32, 0), cg = new THREE.IcosahedronGeometry(.55, 0).scale(1, 1.15, 1).translate(0, .92, 0);
    const tm = new THREE.InstancedMesh(tg, flat(P.wood), list.length), cm = new THREE.InstancedMesh(cg, flat(P.forest), list.length);
    const fm = isFruit ? new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.085, 0), flat(P.redTile), list.length * 3) : null;
    tm.castShadow = cm.castShadow = true; tm.receiveShadow = cm.receiveShadow = true;
    const d = new THREE.Object3D(), tint = new THREE.Color(), base = [];
    list.forEach((it, i) => {
      const ry = rng.range(0, Math.PI * 2); d.position.set(it.x, it.y, it.z); d.rotation.set(0, ry, 0); d.scale.setScalar(it.s); d.updateMatrix();
      tm.setMatrixAt(i, d.matrix); cm.setMatrixAt(i, d.matrix); cm.setColorAt(i, tint.copy(C.forest).lerp(C.grass, rng.range(0, .35)));
      base.push({ ...it, ry, ph: rng.range(0, 6.28) });
      if (fm) for (let f = 0; f < 3; f++) { const an = ry + f * 2.094; d.position.set(it.x + Math.cos(an) * .42 * it.s, it.y + (.85 + f % 2 * .16) * it.s, it.z + Math.sin(an) * .42 * it.s); d.updateMatrix(); fm.setMatrixAt(i * 3 + f, d.matrix); }
    });
    world.add(tm, cm); if (fm) world.add(fm);
    anim.push(t => { base.forEach((b, i) => { d.position.set(b.x, b.y, b.z); d.rotation.set(Math.sin(t * 1.4 + b.ph) * .045, b.ry, Math.cos(t * 1.15 + b.ph) * .045); d.scale.setScalar(b.s); d.updateMatrix(); cm.setMatrixAt(i, d.matrix); }); cm.instanceMatrix.needsUpdate = true; });
  }
  treeMesh(trees, false); treeMesh(fruit, true);
  if (fol.length) {
    const m = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.16, 0).scale(1.2, .75, 1.2).translate(0, .09, 0), flat(P.grass), fol.length), d = new THREE.Object3D(), cols = [C.grass, C.forest, C.redTile, C.limestone, C.plateau];
    fol.forEach((p, i) => { d.position.set(p.x, p.y, p.z); d.rotation.set(0, rng.range(0, 6.28), 0); d.scale.setScalar(rng.range(.65, 1.2)); d.updateMatrix(); m.setMatrixAt(i, d.matrix); m.setColorAt(i, rng.next() < .7 ? cols[rng.int(0, 1)] : cols[rng.int(2, 4)]); });
    m.receiveShadow = true; world.add(m);
  }
  // 落葉、會幕的祭壇炊煙、飛鳥、雲影、跳出水面的魚
  if (leaves.length) {
    const n = 10, m = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(.06, 0).scale(1.4, .3, 1), flat(P.plateau), n), d = new THREE.Object3D(); world.add(m);
    anim.push(t => { for (let i = 0; i < n; i++) { const o = leaves[i % leaves.length], ph = i / n * 10, k = (t * .28 + ph) % 1; d.position.set(o.x + Math.sin(t * 1.5 + ph * 3) * .35 + k * .25, o.y + 1.2 - k * 1.15, o.z + Math.cos(t * 1.3 + ph * 2) * .35); d.rotation.set(t * 1.8 + i, t * 1.2, t * .9); d.scale.setScalar(Math.max(.01, k > .85 ? (1 - k) / .15 : 1)); d.updateMatrix(); m.setMatrixAt(i, d.matrix); } m.instanceMatrix.needsUpdate = true; });
  }
  {
    const vent = { x: TAB.x - .2, y: sample(TAB.x, TAB.z).height + .45, z: TAB.z + .5 }, n = 5, m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.11, 0), flat(P.tentCloth, { transparent: true, opacity: .55 }), n), d = new THREE.Object3D(); world.add(m);
    anim.push(t => { for (let p = 0; p < n; p++) { const k = (t * .24 + p / n) % 1; d.position.set(vent.x + Math.sin(t * .9 + k * 4) * .18 + k * .22, vent.y + k * 1.85, vent.z + Math.cos(t * .8 + k * 3) * .15); d.rotation.set(k * 2, k * 1.5, 0); d.scale.setScalar(Math.max(.01, Math.sin(k * Math.PI) * 1.15)); d.updateMatrix(); m.setMatrixAt(p, d.matrix); } m.instanceMatrix.needsUpdate = true; });
  }
  {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .18, -.32, .08, -.08, 0, .02, -.05, 0, 0, .18, 0, .02, -.05, .32, .08, -.08], 3)); g.computeVertexNormals();
    const n = 6, m = new THREE.InstancedMesh(g, flat(P.whiteStone, { side: THREE.DoubleSide }), n), d = new THREE.Object3D(); world.add(m);
    anim.push(t => { const k = (t * .065) % 1, dist = (k - .5) * R * 1.35 * 2.6, cx = Math.cos(.55) * dist, cz = Math.sin(.55) * dist - 2;
      for (let i = 0; i < n; i++) { const f = Math.sin(t * 9 + i * .9) * .25; d.position.set(cx + (i - n / 2) * .75, 7.5 + Math.sin(i * 1.3) * .35 + Math.sin(t * 1.5 + i) * .15, cz + Math.abs(i - n / 2) * .55); d.rotation.set(0, .55 + Math.PI / 2, f); d.scale.set(1, 1 + f * .5, 1); d.updateMatrix(); m.setMatrixAt(i, d.matrix); } m.instanceMatrix.needsUpdate = true; });
  }
  {
    const cm = new THREE.MeshBasicMaterial({ color: 0x3b595e, transparent: true, opacity: .085, depthWrite: false }), span = R * 2.2, cl = [];
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(4.2 + i % 2 * 1.8, 7).rotateX(-Math.PI / 2).scale(1.5, 1, .9), cm); m.position.set(-span * .5 + i * 11, 4.8, -10 + i * 7); world.add(m); cl.push({ m, sp: .55 + i * .12 }); }
    anim.push(() => cl.forEach(c => { c.m.position.x += c.sp * .016; if (c.m.position.x > span * .65) c.m.position.x = -span * .65; }));
  }
  {
    const fish = new THREE.Mesh(new THREE.ConeGeometry(.1, .32, 4).rotateX(Math.PI / 2), flat(P.tealRoof)), fz = 1.5; world.add(fish);
    anim.push(t => { const k = (t * .16) % 1; fish.visible = k < .24; if (!fish.visible) return; const u = k / .24, z = fz + (u - .5) * .85; fish.position.set(riverX(z), .42 + Math.sin(u * Math.PI) * .85, z); fish.rotation.x = -(.5 - u) * 2.1; });
  }

  // ---------- GPT 人物：沿著小路走（正面／背面），偶爾停下 ----------
  const CH = Array.from({ length: 9 }, (_, i) => [tex('c-0' + (i + 1)), tex('c-0' + (i + 1), true)]);
  const CH_RATIO = [200 / 110, 200 / 104, 200 / 107, 200 / 128, 200 / 116, 200 / 118, 200 / 154, 200 / 142, 181 / 200];
  const ty = sample(TAB.x, TAB.z).height;
  const loopA = [{ x: TAB.x - 1.9, z: TAB.z + 2.4 }, { x: TAB.x + .3, z: TAB.z + 2.7 }, { x: TAB.x + 2.3, z: TAB.z + 1.4 }, { x: TAB.x + 2.2, z: TAB.z - 1.8 }, { x: TAB.x + .2, z: TAB.z - 2.5 }];
  const loopB = [{ x: -3.2, z: 2.4 }, { x: -2.0, z: 3.4 }, { x: -3.6, z: 3.8 }, { x: -4.6, z: 2.8 }];
  const people = [{ role: 0, path: loopA, p: 0, sp: .3 }, { role: 1, path: loopA, p: 2.5, sp: .26 }, { role: 2, path: loopB, p: 0, sp: .2 }, { role: 3, path: loopB, p: .45, sp: .2 }, { role: 3, path: loopB, p: .9, sp: .19 }]
    .map((o, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: CH[0][0], toneMapped: false, transparent: true, alphaTest: .05 })); s.center.set(.5, .04); world.add(s);
      const b = new THREE.Mesh(blobGeo, blobMat); b.scale.set(.32, 1, .2); world.add(b); return { ...o, s, b, off: i * 2.3, h: o.role === 3 ? .34 : .58 }; });
  const groundY = (x, z) => { const c = sample(x, z); return c.inside ? c.height : ty; };
  anim.push((t, dt) => people.forEach(v => {
    const n = v.path.length, pause = Math.sin(t * .55 + v.off) > .72;
    if (!pause) v.p = (v.p + dt * v.sp) % n;
    const i0 = Math.floor(v.p) % n, p0 = v.path[i0], p1 = v.path[(i0 + 1) % n], f = v.p - Math.floor(v.p);
    const x = p0.x + (p1.x - p0.x) * f, z = p0.z + (p1.z - p0.z) * f, y = groundY(x, z), bob = pause ? 0 : Math.abs(Math.sin(t * 7 + v.off)) * .03;
    const away = p1.z < p0.z, left = p1.x < p0.x;
    const idx = v.role === 3 ? 8 : v.role * 3 + (pause && v.role < 2 ? 2 : (away ? 1 : 0));
    v.s.material.map = CH[idx][left ? 1 : 0]; v.s.scale.set(v.h / CH_RATIO[idx], v.h, 1); v.s.position.set(x, y + bob + .02, z);
    v.b.position.set(x, y + .02, z);
  }));

  // ---------- 鏡頭：俯角 45°、方位 15°；手機直向時放大、對準會幕 ----------
  const AZ = THREE.MathUtils.degToRad(15), POLAR = THREE.MathUtils.degToRad(45);
  function placeCamera(dist) { const h = dist * Math.sin(POLAR); camera.position.set(controls.target.x + Math.sin(AZ) * h, controls.target.y + dist * Math.cos(POLAR), controls.target.z + Math.cos(AZ) * h); camera.lookAt(controls.target); }
  let touched = false;   // 使用者動過鏡頭之後，視窗再變大小也不重新取景
  renderer.domElement.addEventListener('pointerdown', () => { touched = true; });
  renderer.domElement.addEventListener('wheel', () => { touched = true; }, { passive: true });
  function resize() {
    const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (!touched) {
      const portrait = w / h < .8, wantW = portrait ? 19 : 33;   // 想在畫面寬度內看到的地面寬度
      const dist = THREE.MathUtils.clamp(wantW / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * camera.aspect), 16, 66);
      controls.target.set(portrait ? 1.4 : .6, .8, portrait ? 0.4 : .3); placeCamera(dist);
    }
  }
  new ResizeObserver(resize).observe(box); resize();

  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let last = performance.now(), T = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(.1, (now - last) / 1000)); last = now;
    if (!still.matches) { T += dt; anim.forEach(f => f(T, dt)); }
    controls.update(); renderer.render(scene, camera);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  raf = requestAnimationFrame(frame);
}
