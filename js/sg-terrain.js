/* 漢威牧區｜地形引擎（P1-0b）
 * 高度場 → 等高台階（marching squares）→ 懸崖依朝向分亮面／暗面／陰影、右下投影（不用模糊濾鏡）。
 * 材質色票（開發排程〈地圖視覺規格〉）；拖曳移動、滾輪／雙指縮放。世界地圖、我的領地共用，只做畫面。 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  // ---------- 材質色票：[亮面, 暗面, 陰影] ----------
  const PALETTE = {
    deep: { name: '深海', use: '海（遠）', c: ['#1A8C99'] },
    near: { name: '近岸', use: '海（近岸）', c: ['#33BDB9'] },
    shallow: { name: '淺灘', use: '岸邊一圈', c: ['#7FE0CF', '#5FD3C4'] },
    water: { name: '河、湖', use: '約旦河、加利利海、尼羅河', c: ['#4FCFD0', '#33B8BE'] },
    sand: { name: '沙岸', use: '海岸線', c: ['#F3E2A6', '#E2CB86', '#C9AE6A'] },
    grass: { name: '草地、平原', use: '沿海平原、加利利', c: ['#9CCB45', '#7DB236', '#5E8F2B'] },
    dry: { name: '乾地、灌木', use: '撒瑪利亞、示非拉', c: ['#C3C85A', '#A3A946', '#828737'] },
    plateau: { name: '高原頂', use: '安納托利亞、外約旦', c: ['#EFA65A', '#D5874A', '#B06A3C'] },
    lime: { name: '石灰岩', use: '猶大山地、希臘', c: ['#EDE3CF', '#CDBFA3', '#A99A7E'] },
    red: { name: '紅岩、花崗岩', use: '西奈山、以東', c: ['#C8694A', '#A5523C', '#7E3E30'] },
    cliff: { name: '懸崖側面', use: '台地邊緣', c: ['#5E7468', '#4A5F55', '#384A43'] },
    mount: { name: '高山', use: '托魯斯、黑門山', c: ['#7C8A86', '#5F6D6A', '#4A5654', '#FFFFFF'] },
    desert: { name: '沙漠', use: '埃及、曠野', c: ['#F2C27C', '#DDA463', '#BE8550'] },
    forest: { name: '樹林', use: '黎巴嫩香柏、橄欖園', c: ['#4E8F48', '#3C7440', '#2C5A35'] }
  };
  const BUILD = [['白石牆', '#F4EBDD'], ['泥磚', '#D9B98C'], ['木', '#C98B55'], ['紅瓦', '#E86F51'], ['藍綠屋頂', '#3BB3BD'], ['帳棚布', '#FFFFFF']];
  const ALIAS = { valley: 'grass' };                  // 河谷：顏色同草地，但只出現在低處
  const OWN_SIDE = { sand: 1, lime: 1, red: 1, mount: 1, desert: 1 };   // 這些材質的懸崖用自己的顏色
  const pal = m => PALETTE[ALIAS[m] || m] || PALETTE.grass;
  const darken = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = s => Math.round(((n >> s) & 255) * (1 - f)); return `rgb(${c(16)},${c(8)},${c(0)})`; };
  const top = m => pal(m).c[0];
  const sides = m => { const p = pal(m); return OWN_SIDE[ALIAS[m] || m] ? [p.c[1], p.c[2], darken(p.c[2], .15)] : PALETTE.cliff.c; };   // [朝左, 朝前, 朝右]

  // ---------- 高度場 ----------
  function grid(nx, ny) { return { nx, ny, h: new Float32Array(nx * ny).fill(-1), m: new Uint8Array(nx * ny) }; }
  function setCell(G, k, h, mi) { if (h !== null) G.h[k] = h; if (mi != null && mi >= 0) G.m[k] = mi; }
  function paintPoly(G, pts, h, mi) {          // 掃描線填多邊形（格子座標）
    const ys = pts.map(p => p[1]); const y0 = Math.max(0, Math.ceil(Math.min(...ys))), y1 = Math.min(G.ny - 1, Math.floor(Math.max(...ys)));
    for (let j = y0; j <= y1; j++) {
      const xs = [];
      for (let k = 0; k < pts.length; k++) { const a = pts[k], b = pts[(k + 1) % pts.length]; if ((a[1] <= j) !== (b[1] <= j)) xs.push(a[0] + (j - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.max(0, Math.ceil(xs[k])); i <= Math.min(G.nx - 1, Math.floor(xs[k + 1])); i++) setCell(G, j * G.nx + i, h, mi);
    }
  }
  function paintLine(G, pts, r, h, mi) {       // 沿折線畫一條寬 r 的帶（山脈、河谷）
    for (let s = 0; s < Math.max(1, pts.length - 1); s++) {
      const a = pts[s], b = pts[Math.min(s + 1, pts.length - 1)];
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0]) - r)), x1 = Math.min(G.nx - 1, Math.ceil(Math.max(a[0], b[0]) + r));
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1]) - r)), y1 = Math.min(G.ny - 1, Math.ceil(Math.max(a[1], b[1]) + r));
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1;
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const u = Math.max(0, Math.min(1, ((i - a[0]) * dx + (j - a[1]) * dy) / L2));
        if (Math.hypot(i - a[0] - u * dx, j - a[1] - u * dy) <= r) setCell(G, j * G.nx + i, h, mi);
      }
    }
  }
  function blur(a, nx, ny, r, passes) {
    const b = new Float32Array(a.length);
    for (let p = 0; p < passes; p++) {
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const x = i + k; if (x >= 0 && x < nx) { s += a[j * nx + x]; n++; } } b[j * nx + i] = s / n; }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, n = 0; for (let k = -r; k <= r; k++) { const y = j + k; if (y >= 0 && y < ny) { s += b[y * nx + i]; n++; } } a[j * nx + i] = s / n; }
    }
    return a;
  }
  function border(a, nx, ny, v) { for (let i = 0; i < nx; i++) { a[i] = v; a[(ny - 1) * nx + i] = v; } for (let j = 0; j < ny; j++) { a[j * nx] = v; a[j * nx + nx - 1] = v; } }
  function sample(a, nx, ny, x, y) {
    x = Math.max(0, Math.min(nx - 1.001, x)); y = Math.max(0, Math.min(ny - 1.001, y));
    const i = x | 0, j = y | 0, u = x - i, w = y - j, k = j * nx + i;
    return (a[k] * (1 - u) + a[k + 1] * u) * (1 - w) + (a[k + nx] * (1 - u) + a[k + nx + 1] * u) * w;
  }
  // marching squares：回傳封閉的等高線（格子座標）
  function contours(a, nx, ny, t) {
    const segs = new Map();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v = [a[j * nx + i], a[j * nx + i + 1], a[(j + 1) * nx + i + 1], a[(j + 1) * nx + i]];   // 左上、右上、右下、左下（順時針）
      const ins = v.map(x => x >= t), n = ins.filter(Boolean).length;
      if (n === 0 || n === 4) continue;
      const cor = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const keys = ['h' + i + ',' + j, 'v' + (i + 1) + ',' + j, 'h' + i + ',' + (j + 1), 'v' + i + ',' + j];
      const cr = [];
      for (let e = 0; e < 4; e++) { const b = (e + 1) % 4; if (ins[e] !== ins[b]) { const s = (t - v[e]) / (v[b] - v[e]); cr.push({ key: keys[e], x: cor[e][0] + (cor[b][0] - cor[e][0]) * s, y: cor[e][1] + (cor[b][1] - cor[e][1]) * s, exit: ins[e] }); } }
      const center = (v[0] + v[1] + v[2] + v[3]) / 4 >= t, L = cr.length;
      for (let k = 0; k < L; k++) if (cr[k].exit) segs.set(cr[k].key, { a: cr[k], b: center ? cr[(k + 1) % L] : cr[(k - 1 + L) % L] });
    }
    const rings = [];
    for (const s0 of segs.values()) {
      if (s0.used) continue;
      const ring = []; let s = s0;
      while (s && !s.used) { s.used = true; ring.push([s.a.x, s.a.y]); s = segs.get(s.b.key); }
      if (ring.length > 2) rings.push(ring);
    }
    return rings;
  }
  function simplify(ring, d) {                  // 拉長邊 → 低多邊形的切面感
    const out = [ring[0]];
    for (let k = 1; k < ring.length; k++) { const p = ring[k], q = out[out.length - 1]; if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= d) out.push(p); }
    return out.length > 2 ? out : ring;
  }
  const hash = k => { const s = Math.sin(k * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const f1 = n => Math.round(n * 10) / 10;

  /* ---------- 畫地形 ----------
   * cfg: { id, G, mats:[材質名], proj(gx,gy)→[x,y], levels:[{t,h,base,patch?}], water:[{t,c}],
   *        landBlur:[r,次數], seaBlur:[r,次數], noise, simplify, shadow:[dx倍, dy倍] } */
  function render(root, cfg) {
    const { G, proj, mats } = cfg, nx = G.nx, ny = G.ny, uid = cfg.id;
    const H = Float32Array.from(G.h);
    if (cfg.noise) for (let k = 0; k < H.length; k++) if (G.h[k] > -0.5) H[k] += (hash(k) - .5) * cfg.noise;
    blur(H, nx, ny, cfg.landBlur[0], cfg.landBlur[1]); border(H, nx, ny, -9);
    const S = new Float32Array(nx * ny); for (let k = 0; k < S.length; k++) S[k] = G.h[k] > -0.5 ? 1 : 0;
    blur(S, nx, ny, cfg.seaBlur[0], cfg.seaBlur[1]); border(S, nx, ny, 0);
    const rings = (a, t) => contours(a, nx, ny, t).map(r => simplify(r, cfg.simplify));
    const toD = rs => rs.map(r => 'M' + r.map(p => { const q = proj(p[0], p[1]); return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + 'Z').join('');
    const defs = el('defs', {}, root);

    // 海：深 → 近岸 → 淺灘
    cfg.water.forEach(w => { const d = toD(rings(S, w.t)); if (d) el('path', { d, fill: w.c, 'fill-rule': 'evenodd' }, root); });

    // 各材質在地表上的範圍（之後依每一層台階裁切）
    const has = {};
    mats.forEach((m, mi) => {
      const M = new Float32Array(nx * ny); let any = false;
      for (let k = 0; k < M.length; k++) if (G.m[k] === mi && G.h[k] > -0.5) { M[k] = 1; any = true; }
      if (!any) return;
      blur(M, nx, ny, 1, 1); border(M, nx, ny, 0);
      const d = toD(rings(M, .5)); if (d) { el('path', { id: uid + 'm' + m, d, 'fill-rule': 'evenodd' }, defs); has[m] = 1; }
    });

    let h0 = 0;
    cfg.levels.forEach((L, li) => {
      const rs = rings(H, L.t); if (!rs.length) return;
      const D = toD(rs), dh = L.h - h0, g = el('g', {}, root);
      // 投影（往右下，半透明，不模糊）＋懸崖底部的環境遮蔽
      if (li > 0) el('path', { d: D, fill: 'rgba(70,45,20,.2)', 'fill-rule': 'evenodd', transform: `translate(${f1(dh * cfg.shadow[0])},${f1(-h0 + dh * cfg.shadow[1])})` }, g);
      el('path', { d: D, fill: 'none', stroke: 'rgba(60,40,20,.16)', 'stroke-width': 2.4, transform: `translate(0,${f1(-h0)})` }, g);
      // 懸崖側面：每段邊依朝向上色（光從左上）
      const bucket = {};
      rs.forEach(r => {
        for (let k = 0; k < r.length; k++) {
          const p = r[k], q = r[(k + 1) % r.length], ex = q[0] - p[0], ey = q[1] - p[1], len = Math.hypot(ex, ey);
          if (len < 1e-6) continue;
          let ox = ey / len, oy = -ex / len; const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
          if (sample(H, nx, ny, mx + ox * .35, my + oy * .35) >= L.t) { ox = -ox; oy = -oy; }
          const M0 = proj(mx, my), M1 = proj(mx + ox, my + oy), sx = M1[0] - M0[0], sy = M1[1] - M0[1], sl = Math.hypot(sx, sy);
          if (sy <= sl * .06) continue;                       // 背面看不到
          const shade = sx / sl < -.35 ? 0 : sx / sl > .35 ? 2 : 1;
          const ci = Math.max(0, Math.min(nx - 1, Math.round(mx - ox * .7))), cj = Math.max(0, Math.min(ny - 1, Math.round(my - oy * .7)));
          const col = (li === 0 ? sides('sand') : sides(mats[G.m[cj * nx + ci]]))[shade];
          const P = proj(p[0], p[1]), Q = proj(q[0], q[1]);
          (bucket[col] = bucket[col] || []).push(`M${f1(P[0])} ${f1(P[1] - L.h)}L${f1(Q[0])} ${f1(Q[1] - L.h)}L${f1(Q[0])} ${f1(Q[1] - h0)}L${f1(P[0])} ${f1(P[1] - h0)}Z`);
        }
      });
      for (const c in bucket) el('path', { d: bucket[c].join(''), fill: c, stroke: c, 'stroke-width': .6, 'stroke-linejoin': 'round' }, g);
      // 頂面：底色＋各材質（裁切在這一層裡）
      const tg = el('g', { transform: `translate(0,${f1(-L.h)})` }, g);
      el('path', { d: D, fill: top(L.base), stroke: top(L.base), 'stroke-width': .6, 'fill-rule': 'evenodd' }, tg);
      const pl = (L.patch || mats).filter(m => has[m] && m !== L.base);
      if (pl.length) {
        const cp = el('clipPath', { id: uid + 'c' + li }, defs); el('path', { d: D, 'clip-rule': 'evenodd' }, cp);
        pl.forEach(m => el('use', { href: '#' + uid + 'm' + m, fill: top(m), 'clip-path': `url(#${uid}c${li})` }, tg));
      }
      h0 = L.h;
    });
    // 地表高度（給城市、建築、河流用）
    const liftAt = (gx, gy) => { const v = sample(H, nx, ny, gx, gy); let h = 0; cfg.levels.forEach(L => { if (v >= L.t) h = L.h; }); return h; };
    return { liftAt };
  }

  // ---------- 低多邊形山峰、樹 ----------
  function peak(g, x, y, s, kind) {
    const c = kind === 'red' ? PALETTE.red.c : PALETTE.mount.c;
    const A = [x, y - s * 1.3], Lb = [x - s, y], R = [x + s, y], F = [x + s * .15, y + s * .3];
    const pts = a => a.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
    el('polygon', { points: pts([F, R, [x + s * 2, y + s * .55]]), fill: 'rgba(70,45,20,.2)' }, g);
    el('polygon', { points: pts([Lb, A, F]), fill: c[0] }, g);
    el('polygon', { points: pts([F, A, R]), fill: c[1] }, g);
    if (kind === 'snow') {
      const lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
      el('polygon', { points: pts([lerp(Lb, A, .62), A, lerp(F, A, .55), lerp(Lb, A, .7)]), fill: '#FFFFFF' }, g);
      el('polygon', { points: pts([lerp(F, A, .55), A, lerp(R, A, .62)]), fill: '#E3E8EC' }, g);
    }
  }
  function tree(g, x, y, s, round) {
    const c = PALETTE.forest.c;
    el('polygon', { points: `${f1(x)},${f1(y)} ${f1(x + s * 1.2)},${f1(y + s * .35)} ${f1(x + s * .5)},${f1(y + s * .5)}`, fill: 'rgba(70,45,20,.2)' }, g);
    if (round) {
      el('polygon', { points: `${f1(x - s * .6)},${f1(y - s * .7)} ${f1(x)},${f1(y - s * 1.4)} ${f1(x)},${f1(y)}`, fill: c[0] }, g);
      el('polygon', { points: `${f1(x)},${f1(y - s * 1.4)} ${f1(x + s * .6)},${f1(y - s * .7)} ${f1(x)},${f1(y)}`, fill: c[1] }, g);
    } else {
      el('polygon', { points: `${f1(x - s * .45)},${f1(y)} ${f1(x)},${f1(y - s * 1.6)} ${f1(x)},${f1(y + s * .15)}`, fill: c[0] }, g);
      el('polygon', { points: `${f1(x)},${f1(y + s * .15)} ${f1(x)},${f1(y - s * 1.6)} ${f1(x + s * .45)},${f1(y)}`, fill: c[1] }, g);
    }
  }

  /* ---------- 拖曳、縮放（改 viewBox） ----------
   * box：內容範圍 {x,y,w,h}；init(ar) → {cx,cy,w}；contain：可看到內容外面（島嶼用） */
  function panzoom(svg, box, init, contain) {
    let v = null;
    svg.style.touchAction = 'none'; svg.style.cursor = 'grab';
    const rect = () => svg.getBoundingClientRect();
    function clamp(r) {
      const ar = r.width / r.height;
      const maxW = contain ? Math.max(box.w, box.h * ar) * 1.08 : Math.min(box.w, box.h * ar);
      v.w = Math.max(maxW / 6, Math.min(maxW, v.w));
      const h = v.w / ar;
      v.cx = v.w >= box.w ? box.x + box.w / 2 : Math.max(box.x + v.w / 2, Math.min(box.x + box.w - v.w / 2, v.cx));
      v.cy = h >= box.h ? box.y + box.h / 2 : Math.max(box.y + h / 2, Math.min(box.y + box.h - h / 2, v.cy));
      svg.setAttribute('viewBox', `${f1(v.cx - v.w / 2)} ${f1(v.cy - h / 2)} ${f1(v.w)} ${f1(h)}`);
    }
    function apply() { const r = rect(); if (!r.width || !r.height) return; if (!v) v = init(r.width / r.height); clamp(r); }
    // 讓螢幕上的 s0 那一點移到 s1，同時寬度乘上 k
    function move(s0, s1, k) {
      const r = rect(); if (!v || !r.width) return; const u = v.w / r.width;
      const wx = v.cx + (s0[0] - r.left - r.width / 2) * u, wy = v.cy + (s0[1] - r.top - r.height / 2) * u;
      v.w *= k; const u2 = v.w / r.width;
      v.cx = wx - (s1[0] - r.left - r.width / 2) * u2; v.cy = wy - (s1[1] - r.top - r.height / 2) * u2;
      clamp(r);
    }
    const pts = new Map();
    const mid = () => { const a = [...pts.values()]; return [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length]; };
    const spread = () => { const a = [...pts.values()]; return a.length > 1 ? Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) : 0; };
    svg.addEventListener('pointerdown', e => { try { svg.setPointerCapture(e.pointerId); } catch (er) { /* */ } pts.set(e.pointerId, [e.clientX, e.clientY]); svg.style.cursor = 'grabbing'; });
    svg.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      const c0 = mid(), d0 = spread(); pts.set(e.pointerId, [e.clientX, e.clientY]); const c1 = mid(), d1 = spread();
      move(c0, c1, d0 && d1 ? d0 / d1 : 1);
    });
    const up = e => { pts.delete(e.pointerId); if (!pts.size) svg.style.cursor = 'grab'; };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', e => { e.preventDefault(); const s = [e.clientX, e.clientY]; move(s, s, Math.exp(e.deltaY * (e.deltaMode ? 0.05 : 0.0015))); }, { passive: false });
    if (window.ResizeObserver) new ResizeObserver(apply).observe(svg); else addEventListener('resize', apply);
    apply();
    return { reset() { v = null; apply(); } };
  }

  window.SGTerrain = { PALETTE, BUILD, el, grid, paintPoly, paintLine, render, peak, tree, panzoom };
})();
