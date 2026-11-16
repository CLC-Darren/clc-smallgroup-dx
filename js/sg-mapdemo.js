/* 漢威牧區｜世界地圖、我的領地（P1-0b：地形用 sg-terrain.js 程式畫；城市、建築仍是示意）。 */

(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  // 8 色，每色三種明暗：頂（亮）、左（中）、右（暗）
  const PAL = {
    stone: ['#F4EBDD', '#D9CBB4', '#B9A78A'], wood: ['#C98B55', '#A86B3C', '#83512C'], roof: ['#E86F51', '#C9553A', '#A2422D'],
    teal: ['#3BB3BD', '#0E8C97', '#08666E'], cloth: ['#FFFFFF', '#E9E4F5', '#C9C0E3'], gold: ['#FFD66B', '#F2A93B', '#C98417'],
    grass: ['#9BD88E', '#6FBF64', '#4E9A48'], rock: ['#B8B2AA', '#948C82', '#6F675E']
  };

  // 等角方塊：gx, gy（格子座標），w, d（寬深），h（高），顏色
  function iso(ox, oy, t) { return (gx, gy, z = 0) => [ox + (gx - gy) * t, oy + (gx + gy) * t / 2 - z]; }
  function block(g, P, gx, gy, w, d, h, c) {
    const a = P(gx, gy, h), b = P(gx + w, gy, h), cc = P(gx + w, gy + d, h), dd = P(gx, gy + d, h);
    const b0 = P(gx + w, gy, 0), c0 = P(gx + w, gy + d, 0), d0 = P(gx, gy + d, 0);
    const pts = arr => arr.map(p => p.join(',')).join(' ');
    el('polygon', { points: pts([dd, cc, c0, d0]), fill: c[1] }, g);
    el('polygon', { points: pts([b, cc, c0, b0]), fill: c[2] }, g);
    el('polygon', { points: pts([a, b, cc, dd]), fill: c[0] }, g);
    return { top: [(a[0] + cc[0]) / 2, (a[1] + cc[1]) / 2] };
  }
  function roof(g, P, gx, gy, w, d, h, rh, c) {   // 雙斜屋頂（沿 x 方向）
    const m1 = P(gx, gy + d / 2, h + rh), m2 = P(gx + w, gy + d / 2, h + rh);
    const a = P(gx, gy, h), b = P(gx + w, gy, h), cc = P(gx + w, gy + d, h), dd = P(gx, gy + d, h);
    const pts = arr => arr.map(p => p.join(',')).join(' ');
    el('polygon', { points: pts([dd, cc, m2, m1]), fill: c[1] }, g);
    el('polygon', { points: pts([b, cc, m2]), fill: c[2] }, g);
    el('polygon', { points: pts([a, b, m2, m1]), fill: c[0] }, g);
  }
  function flag(g, x, y, color) { el('line', { x1: x, y1: y, x2: x, y2: y - 26, stroke: '#5A4632', 'stroke-width': 2 }, g); el('polygon', { points: `${x},${y - 26} ${x + 14},${y - 21} ${x},${y - 16}`, fill: color }, g); }
  function label(g, x, y, text, sub, strong) {
    const w = Math.max(text.length * 15 + 16, sub ? sub.length * 11 + 14 : 0);
    el('rect', { x: x - w / 2, y: y, width: w, height: sub ? 38 : 24, rx: 8, fill: strong ? '#2B2420' : 'rgba(255,251,243,.92)', stroke: strong ? '#F2A93B' : '#C9B48E', 'stroke-width': 1.5 }, g);
    el('text', { x, y: y + 17, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: strong ? '#FFE3A8' : '#2B2420' }, g).textContent = text;
    if (sub) el('text', { x, y: y + 32, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: strong ? '#F2C46F' : '#7A6A58' }, g).textContent = sub;
  }
  function person(g, x, y, body, acc) {
    el('ellipse', { cx: x, cy: y + 2, rx: 9, ry: 4, fill: 'rgba(0,0,0,.18)' }, g);
    el('polygon', { points: `${x - 9},${y} ${x + 9},${y} ${x},${y - 24}`, fill: body }, g);
    el('circle', { cx: x, cy: y - 27, r: 7, fill: '#F1C9A5' }, g);
    if (acc) el('path', { d: `M${x - 8},${y - 29} q8,-10 16,0`, fill: acc }, g);
  }

  const T = window.SGTerrain;
  const geo = (g, x, y, text, size) => el('text', { x, y, 'text-anchor': 'middle', 'font-size': size || 11, 'font-weight': 800, fill: '#5A4A38', stroke: 'rgba(255,251,243,.85)', 'stroke-width': 3, 'paint-order': 'stroke', 'pointer-events': 'none' }, g).textContent = text;

  // ---------- ① 世界地圖（地中海：耶路撒冷 → 羅馬） ----------
  const W = document.getElementById('world'); if (W && T) {
  const ll = (lon, lat) => [(lon - 11) * 33, (43.2 - lat) * 40 + 40];          // 經緯度 → 畫面
  const R0 = 0.1, LON0 = 10.5, LAT0 = 44.5, NX = 281, NY = 171;               // 高度場：每格 0.1°
  const toG = (lon, lat) => [(lon - LON0) / R0, (LAT0 - lat) / R0];
  const MATS = ['grass', 'dry', 'desert', 'plateau', 'lime', 'red', 'mount', 'forest', 'valley', 'water'];
  const G = T.grid(NX, NY), mi = m => MATS.indexOf(m), tg = pts => pts.map(p => toG(p[0], p[1]));
  const poly = (pts, h, m) => T.paintPoly(G, tg(pts), h, m ? mi(m) : null);
  const line = (pts, r, h, m) => T.paintLine(G, tg(pts), r / R0, h, m ? mi(m) : null);
  // 陸地（高度 1）
  poly([[10, 45], [39, 45], [39, 41.2], [36, 41.6], [34, 42], [31, 41.1], [29, 41.2], [27, 41.2], [26, 40.9], [24, 41.2], [22, 42.2], [20, 41.8], [19.4, 41.8], [18, 42.6], [16, 42.6], [15, 42.2], [12, 42.4], [11, 42.6], [10, 43]], 1, 'grass');
  poly([[12, 42.4], [15, 42.2], [16, 41.4], [17.2, 40.5], [18.5, 40.1], [16.6, 39.0], [16.0, 38.0], [15.6, 38.0], [15.9, 39.3], [15.0, 40.2], [14.0, 40.8], [12.5, 41.4], [11, 42.3], [11, 42.6]], 1, 'grass');
  poly([[12.4, 38.1], [15.6, 38.3], [15.1, 36.7], [12.6, 37.6]], 1, 'grass');
  poly([[19.4, 41.8], [20, 41.8], [22, 42.2], [24, 41.2], [26, 40.9], [26.1, 40.3], [24.5, 40.2], [23.7, 40.2], [22.9, 40.6], [22.6, 40.0], [23.3, 39.2], [22.9, 38.6], [24, 38.2], [23.2, 37.9], [22.9, 37.5], [23.2, 36.4], [22.5, 36.4], [21.7, 36.8], [21.1, 37.8], [21.3, 38.4], [20.7, 38.9], [20, 39.7], [19.4, 40.4]], 1, 'grass');
  poly([[26.0, 40.3], [27, 41.2], [29, 41.2], [31, 41.1], [34, 42], [36, 41.6], [39, 41.2], [39, 36.5], [36.2, 36.6], [36, 36.2], [35, 36.6], [34, 36.3], [32.8, 36.1], [31.5, 36.7], [30.6, 36.8], [29.7, 36.2], [28.2, 36.7], [27.3, 37.2], [27.2, 37.9], [26.4, 38.4], [26.8, 39.0], [26.1, 39.5]], 1, 'grass');
  poly([[36, 36.2], [39, 36.5], [39, 27], [34.9, 27], [34.9, 29.5], [34.2, 31.2], [34.5, 31.6], [34.9, 32.4], [35.1, 33.1], [35.5, 33.9], [35.9, 34.7], [35.9, 35.4]], 1, 'dry');
  poly([[10, 34], [11, 33.6], [15.2, 32.4], [19.6, 32.0], [20, 30.5], [25, 31.6], [29, 30.9], [32.3, 31.3], [34.2, 31.2], [35, 29], [35, 27], [10, 27]], 1, 'desert');
  poly([[23.5, 35.6], [26.3, 35.3], [26.2, 35.0], [23.6, 35.2]], 1, 'grass');                 // 革哩底
  poly([[32.3, 35.1], [34.6, 35.7], [33.9, 35.1], [32.6, 34.7]], 1, 'grass');                 // 居比路
  [[14.4, 35.9, .1], [26.55, 37.32, .07], [26.3, 39.2, .25], [26.0, 38.4, .17], [26.8, 37.75, .13], [25.5, 37.05, .14], [28.0, 36.2, .22], [27.2, 36.85, .09], [19.9, 39.6, .14]]
    .forEach(([lo, la, r]) => line([[lo, la]], r, 1, 'grass'));                                  // 馬爾他、拔摩、愛琴海諸島
  // 海：黑海、亞得里亞海、哥林多灣、蘇伊士灣、亞喀巴灣、紅海
  poly([[28.0, 41.6], [29.2, 41.25], [31, 41.2], [33, 42.0], [35.0, 42.05], [36.3, 41.7], [38, 41.0], [39.5, 41.0], [39.5, 45], [29.5, 45], [28.6, 44.0], [28.0, 43.0]], -1);
  poly([[12.4, 44.5], [13.6, 43.6], [14.2, 42.6], [16.0, 41.9], [18.0, 40.6], [18.5, 40.2], [19.4, 40.5], [19.4, 41.8], [18.0, 42.6], [16.0, 43.5], [15.0, 44.2], [13.6, 45.0], [12.3, 45.0]], -1);
  line([[21.3, 38.3], [22.2, 38.15], [22.85, 38.0]], .08, -1);
  line([[32.55, 29.95], [32.9, 29.3], [33.5, 28.3], [34.0, 27.6]], .12, -1);
  line([[35.0, 29.55], [34.75, 28.6], [34.45, 28.0], [34.3, 27.2]], .09, -1);
  poly([[34.0, 27.7], [34.4, 27.6], [36, 26.5], [33, 26.5]], -1);
  // 低地、河谷的顏色
  poly([[29.9, 31.3], [32.3, 31.3], [31.2, 30.0]], null, 'grass'); line([[31.2, 30.0], [31.0, 29.0], [30.9, 27.2]], .15, null, 'grass');   // 尼羅河三角洲、河谷
  line([[29.3, 37.9], [28.3, 37.9], [27.3, 37.55]], .08, 1, 'grass');                           // 米安得河谷（以弗所）
  // 山地、高原（高度 2～5）
  poly([[30.2, 39.6], [33.5, 40.2], [36.8, 39.6], [37.6, 38.4], [35.2, 37.9], [32.0, 38.0], [30.4, 38.4]], 3, 'plateau');   // 安納托利亞高原
  line([[31, 40.9], [34, 41.3], [37.5, 40.8]], .25, 3, 'forest');                                  // 本都山
  line([[27.8, 38.9], [29.0, 38.3]], .3, 2, 'dry');
  line([[29.8, 37.0], [30.6, 37.25], [31.5, 37.2], [32.5, 37.0], [33.5, 37.0], [34.5, 37.3], [35.4, 37.6], [36.4, 37.8]], .26, 4, 'mount');   // 托魯斯山脈
  line([[20.8, 40.3], [21.4, 39.2], [21.8, 38.6]], .25, 4, 'lime');                               // 品都斯山
  line([[22.35, 40.08]], .16, 5, 'mount');                                                        // 奧林帕斯山
  line([[22.2, 37.5]], .35, 3, 'lime'); line([[23.8, 38.15]], .12, 2, 'lime');                     // 伯羅奔尼撒、亞底加
  line([[23.5, 41.6], [25.5, 41.5]], .25, 3, 'forest'); line([[16.5, 43.6], [19.5, 42.4]], .3, 3, 'forest');   // 羅多彼、第拿里
  line([[12.5, 43.6], [13.4, 42.4], [14.6, 41.3], [15.8, 40.3], [16.1, 39.3]], .22, 4, 'mount');  // 亞平寧山
  line([[15.0, 37.75]], .15, 4, 'mount'); line([[24.8, 35.2]], .15, 3, 'lime'); line([[32.9, 34.95]], .18, 3, 'forest');   // 埃特納、伊達、特羅多斯
  line([[20.5, 32.6], [22.5, 32.7]], .25, 2, 'dry');                                               // 古利奈高地
  // 以色列、外約旦、西奈
  poly([[35.65, 33.0], [36.6, 33.0], [36.8, 31.0], [35.9, 29.9], [35.55, 30.6], [35.6, 31.8]], 3, 'plateau');   // 外約旦高原（含戈蘭）
  line([[35.7, 33.5], [36.2, 34.5]], .15, 4, 'forest'); line([[36.0, 33.5], [36.6, 34.4]], .12, 4, 'mount');      // 黎巴嫩山、前黎巴嫩山
  line([[35.85, 33.4]], .12, 5, 'mount');                                                         // 黑門山
  line([[35.25, 33.05], [35.45, 32.85]], .15, 2, 'grass'); line([[34.97, 32.82], [35.15, 32.6]], .06, 2, 'forest');   // 加利利山地、迦密山
  line([[35.25, 32.45], [35.2, 31.95]], .14, 3, 'dry'); line([[34.92, 31.85], [34.85, 31.35]], .1, 2, 'dry');           // 撒瑪利亞、示非拉
  line([[35.2, 31.95], [35.15, 31.35]], .14, 4, 'lime'); line([[35.15, 31.35], [35.05, 31.15]], .12, 3, 'lime');       // 猶大山地、希伯崙
  line([[35.38, 31.8], [35.33, 31.3]], .08, 2, 'desert'); line([[35.39, 32.69]], .04, 3, 'grass');                       // 猶大曠野、他泊山
  line([[35.55, 30.9], [35.45, 30.3]], .12, 4, 'red');                                            // 以東紅岩（佩特拉）
  poly([[33.0, 30.2], [34.6, 30.2], [34.4, 29.0], [33.4, 29.0]], 2, 'desert'); line([[33.95, 28.55]], .35, 5, 'red');   // 西奈高地、西奈山
  line([[35.6, 33.2], [35.55, 32.7], [35.52, 32.2], [35.5, 31.75], [35.45, 31.0], [35.2, 30.2], [35.0, 29.55]], .07, .3, 'valley');   // 約旦河谷（往下凹）
  line([[35.58, 32.82]], .07, .3, 'water'); line([[35.5, 31.72], [35.45, 31.15]], .055, .2, 'water');   // 加利利海、死海

  el('rect', { x: -400, y: -400, width: 1700, height: 1500, fill: '#1A8C99' }, W);
  const proj0 = (gx, gy) => ll(LON0 + gx * R0, LAT0 - gy * R0);
  const R = T.render(W, { id: 'w', G, mats: MATS, proj: proj0, noise: .5, landBlur: [1, 1], seaBlur: [3, 2], simplify: 1.6, shadow: [1.1, .55],
    water: [{ t: .01, c: '#1F99A4' }, { t: .05, c: '#27A8AF' }, { t: .12, c: '#33BDB9' }, { t: .22, c: '#46C8BF' }, { t: .32, c: '#5FD3C4' }, { t: .41, c: '#7FE0CF' }],   // 海：越近岸越淺
    levels: [{ t: .15, h: 1.5, base: 'sand', patch: ['water', 'valley'] }, { t: .55, h: 3.5, base: 'grass' }, { t: 1.5, h: 7, base: 'grass' },
      { t: 2.5, h: 10.5, base: 'grass' }, { t: 3.5, h: 14, base: 'grass' }, { t: 4.5, h: 17.5, base: 'grass' }] });
  const proj = (lon, lat) => { const p = ll(lon, lat), g = toG(lon, lat); return [p[0], p[1] - R.liftAt(g[0], g[1])]; };   // 貼在地表上
  // 河流（約旦河、奧倫提斯河、尼羅河、米安得河、台伯河）
  const river = pts => el('polyline', { points: pts.map(p => proj(p[0], p[1]).join(',')).join(' '), fill: 'none', stroke: '#4FCFD0', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, W);
  river([[35.65, 33.25], [35.6, 32.9]]); river([[35.57, 32.72], [35.55, 32.2], [35.5, 31.8]]);
  river([[36.3, 34.4], [36.55, 35.3], [36.5, 36.0], [36.15, 36.2], [35.95, 36.05]]);
  river([[31.0, 27.3], [31.1, 29.0], [31.15, 30.3], [30.4, 31.45]]); river([[31.15, 30.3], [31.8, 31.45]]);
  river([[29.4, 37.9], [28.3, 37.9], [27.3, 37.55]]); river([[12.6, 42.5], [12.45, 41.95], [12.25, 41.75]]);
  // 浪線
  [[25, 34.5], [30, 33.5], [19, 36], [16, 34.5], [28, 35.4], [33.8, 33.6], [21, 39.2], [17.5, 38.5], [12.3, 40.6], [31.5, 32.4], [24.5, 39.3]].forEach(([lo, la]) => {
    const [x, y] = ll(lo, la); el('path', { d: `M${x} ${y} q5 -3 10 0 t10 0`, stroke: '#FFFFFF', 'stroke-width': 1.5, fill: 'none', opacity: .6, 'stroke-linecap': 'round' }, W); });
  // 山峰、樹林
  const pk = (lo, la, s, k) => { const [x, y] = proj(lo, la); T.peak(W, x, y, s, k); };
  [[35.85, 33.4, 9, 'snow'], [22.35, 40.08, 10, 'snow'], [31.5, 37.2, 8, 'snow'], [33.5, 37.0, 9, 'snow'], [35.4, 37.6, 8, 'snow'], [30.4, 37.15, 6], [32.5, 37.0, 6], [34.5, 37.3, 7],
   [33.95, 28.55, 9, 'red'], [15.0, 37.75, 7, 'snow'], [13.6, 42.45, 8, 'snow'], [15.0, 41.0, 6], [21.3, 39.5, 7], [24.8, 35.22, 6], [36.0, 34.2, 7, 'snow'], [35.45, 30.5, 5, 'red']].forEach(m => pk(...m));
  [[35.9, 33.85], [36.0, 34.1], [36.1, 34.35], [35.85, 34.0], [36.05, 34.55], [35.05, 32.72], [32.95, 34.9], [33.2, 41.2], [35.2, 41.1]].forEach(([lo, la], i) => { const [x, y] = proj(lo, la); T.tree(W, x, y, 4.5, i > 4); });
  const cloud = el('g', { class: 'cloud', opacity: .7 }, W);
  [[640, 470], [760, 240]].forEach(([x, y]) => { el('ellipse', { cx: x, cy: y, rx: 40, ry: 13, fill: '#fff' }, cloud); el('ellipse', { cx: x + 22, cy: y - 8, rx: 24, ry: 12, fill: '#fff' }, cloud); });
  [['地中海', 21, 34.2, 15], ['愛琴海', 25.2, 38.6, 11], ['黑海', 32, 42.8, 12], ['小亞細亞', 33.2, 39.0, 12], ['埃及', 28.5, 29.2, 12], ['義大利', 15.6, 40.8, 11], ['希臘', 21.9, 39.0, 11], ['西奈', 33.8, 29.6, 10]]
    .forEach(([t, lo, la, s]) => { const [x, y] = proj(lo, la); geo(W, x, y, t, s); });

  // 保羅第一次宣教（徒 13–14）
  const C = { 耶路撒冷: [35.2, 31.8], 安提阿: [36.2, 36.2], 西流基: [35.9, 36.1], 撒拉米: [33.9, 35.2], 帕弗: [32.4, 34.8], 別加: [30.8, 37.0], '彼西底的安提阿': [31.2, 38.3], 以哥念: [32.5, 37.9], 路司得: [32.3, 37.5], 特庇: [33.4, 37.3],
    以弗所: [27.3, 37.9], 哥林多: [22.9, 37.9], 雅典: [23.7, 38.0], 腓立比: [24.3, 41.0], 羅馬: [12.5, 41.9] };
  const route = ['耶路撒冷', '安提阿', '西流基', '撒拉米', '帕弗', '別加', '彼西底的安提阿', '以哥念', '路司得', '特庇'];
  const doneIdx = 4;  // 目前在帕弗
  const path = route.map(n => proj(...C[n]).join(',')).join(' ');
  el('polyline', { points: path, fill: 'none', stroke: '#8A6D3B', 'stroke-width': 3, 'stroke-dasharray': '8 8', opacity: .55 }, W);
  el('polyline', { points: route.slice(0, doneIdx + 1).map(n => proj(...C[n]).join(',')).join(' '), fill: 'none', stroke: '#D9534F', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, W);
  // 其他城市（灰）
  ['以弗所', '哥林多', '雅典', '腓立比', '羅馬'].forEach(n => { const [x, y] = proj(...C[n]); el('circle', { cx: x, cy: y, r: 6, fill: '#fff', stroke: '#9A8C78', 'stroke-width': 2 }, W); el('text', { x, y: y - 11, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#7A6A58' }, W).textContent = n; });
  // 路線上的城市：小建築
  route.forEach((n, i) => {
    const [x, y] = proj(...C[n]); const g = el('g', {}, W);
    if (i === 3 || i === 1) return;   // 安提阿、撒拉米用大圖示
    const P = iso(x, y - 6, 6);
    const done = i <= doneIdx;
    block(g, P, -1, -1, 2, 2, 8, done ? PAL.stone : PAL.rock);
    roof(g, P, -1, -1, 2, 2, 8, 6, done ? PAL.roof : PAL.rock);
    if (!done) el('text', { x: x + 12, y: y - 6, 'font-size': 13 }, g).textContent = '🔒';
  });
  // 安提阿（差派教會，大一點）
  { const [x, y] = proj(...C['安提阿']); const g = el('g', {}, W); const P = iso(x - 6, y, 7);
    block(g, P, -1, -1, 3, 2, 14, PAL.stone); roof(g, P, -1, -1, 3, 2, 14, 8, PAL.teal); flag(g, x + 2, y - 26, '#F2A93B');
    label(g, x + 4, y + 16, '安提阿', '差派的教會'); }
  // 目前所在城：帕弗（營地＋營火＋光圈）
  { const [x, y] = proj(...C['帕弗']); const g = el('g', {}, W);
    el('circle', { cx: x, cy: y, r: 12, fill: '#F2A93B', class: 'pulse' }, g);
    const P = iso(x - 18, y - 4, 6);
    block(g, P, -2, -1, 3, 2, 10, PAL.stone); roof(g, P, -2, -1, 3, 2, 10, 7, PAL.roof);
    block(g, iso(x + 14, y + 2, 5), 0, 0, 2, 2, 7, PAL.cloth);
    const f = el('g', { class: 'flame' }, g);
    el('ellipse', { cx: x + 2, cy: y + 12, rx: 10, ry: 4, fill: '#8A6D3B' }, g);
    el('path', { d: `M${x + 2},${y + 10} q-8,-8 0,-20 q8,12 0,20z`, fill: '#F2A93B' }, f);
    el('path', { d: `M${x + 2},${y + 10} q-4,-5 0,-11 q4,6 0,11z`, fill: '#FFE08A' }, f);
    flag(g, x - 22, y - 18, '#D9534F');
    label(g, x, y + 20, '📍 帕弗', '漢威牧區・任務 3/4', true); }
  // 撒拉米（已完成）
  { const [x, y] = proj(...C['撒拉米']); label(W, x - 30, y - 30, '撒拉米 ✓'); }
  { const [x, y] = proj(...C['耶路撒冷']); const g = el('g', {}, W); const P = iso(x, y - 4, 7);
    block(g, P, -1, -1, 2, 2, 16, PAL.gold); roof(g, P, -1, -1, 2, 2, 16, 6, PAL.gold); label(g, x - 50, y - 6, '耶路撒冷', '出發'); }
  { const [x, y] = proj(...C['別加']); label(W, x - 20, y - 36, '別加 🔒', '下一站'); }
  // 拖曳、縮放；一開始依畫面比例對準東地中海
  T.panzoom(W, { x: 0, y: 0, w: 900, h: 660 }, ar => { let vh = 500, vw = vh * ar; if (vw > 860) { vw = 860; vh = vw / ar; } if (vh > 620) { vw = 620 * ar; } return { cx: 690, cy: 330, w: vw }; });
  }
  // ---------- ② 我的領地：迦南地，浮在海上的島（2.5D 俯視，北朝上） ----------
  const L = document.getElementById('land'); if (L && T) {
  // 一格一個字（西 → 東、北 → 南）：~海 s沙岸 g草地 f樹林 d乾地 D乾地高 l石灰岩 L耶路撒冷 y曠野 n/N南地沙漠 v河谷 j約旦河 B加利利海 S死海 p/P外約旦高原 m山 H黑門山 R以東紅岩 Z西奈山
  const MAP = [
    '~~~~ffmHm~~~', '~~~gfffmmp~~', '~~sgfffjBpp~', '~~sgffgjBpp~', '~~sffggvjpp~', '~~sgggggvjpp', '~~sgddDDvjpp', '~~sgdDDDvjpP', '~~sgdDlDyjpP', '~~sgdllDyjpP',
    '~~sgdlLlyySp', '~~sgdlllyySP', '~~ssddlyySSP', '~~~sdddyySpP', '~~~snnnyyRRR', '~~~snnnnnRR~', '~~~~snnnnRR~', '~~~~snnNNnR~', '~~~~~nnNZZn~', '~~~~~~nZZZ~~'];
  const CODE = { '~': [-1, 'grass'], s: [.35, 'grass'], g: [1, 'grass'], f: [2, 'forest'], d: [2, 'dry'], D: [3, 'dry'], l: [4, 'lime'], L: [5, 'lime'], y: [2, 'desert'], n: [1, 'desert'], N: [2, 'desert'],
    v: [.35, 'valley'], j: [.3, 'water'], B: [.3, 'water'], S: [.2, 'water'], p: [3, 'plateau'], P: [4, 'plateau'], m: [4, 'mount'], H: [6, 'mount'], R: [4, 'red'], Z: [5, 'red'] };
  const MATS = ['grass', 'dry', 'desert', 'plateau', 'lime', 'red', 'mount', 'forest', 'valley', 'water'];
  const PAD = 2, F = 4, CW = 12 + PAD * 2, CH = MAP.length + PAD * 2, NX = CW * F + 1, NY = CH * F + 1, SX = 34, SY = 25;
  const cell = (c, r) => { c -= PAD; r -= PAD; return CODE[(MAP[r] || '')[c]] || CODE['~']; };
  const G = T.grid(NX, NY);
  for (let fy = 0; fy < NY; fy++) for (let fx = 0; fx < NX; fx++) {       // 粗格放大（雙線性），材質取最近的格
    const cx = fx / F - .5, cy = fy / F - .5, i = Math.floor(cx), j = Math.floor(cy), u = cx - i, w = cy - j;
    const h = (a, b) => cell(a, b)[0];
    G.h[fy * NX + fx] = (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - w) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * w;
    G.m[fy * NX + fx] = MATS.indexOf(cell(Math.min(CW - 1, Math.floor(fx / F)), Math.min(CH - 1, Math.floor(fy / F)))[1]);
  }
  const iso0 = (gx, gy) => [(gx / F - PAD) * SX, (gy / F - PAD) * SY];   // 北朝上：x＝東、y＝南
  el('rect', { x: -3000, y: -3000, width: 6000, height: 6000, fill: '#1A8C99' }, L);
  const R = T.render(L, { id: 'l', G, mats: MATS, proj: iso0, noise: .35, landBlur: [1, 2], seaBlur: [3, 2], simplify: 1.3, shadow: [.9, .45],
    water: [{ t: .01, c: '#1F99A4' }, { t: .05, c: '#27A8AF' }, { t: .12, c: '#33BDB9' }, { t: .22, c: '#46C8BF' }, { t: .32, c: '#5FD3C4' }, { t: .41, c: '#7FE0CF' }],   // 海：越近岸越淺
    levels: [{ t: .15, h: 4, base: 'sand', patch: ['water', 'valley'] }, { t: .55, h: 10, base: 'grass' }, { t: 1.5, h: 20, base: 'grass' }, { t: 2.5, h: 30, base: 'grass' },
      { t: 3.5, h: 40, base: 'grass' }, { t: 4.5, h: 50, base: 'grass' }, { t: 5.5, h: 62, base: 'grass' }] });
  // 地表上的點（c＝西→東第幾格、r＝北→南第幾格）
  const at = (c, r) => { const gx = (c + PAD) * F, gy = (r + PAD) * F, p = iso0(gx, gy); return [p[0], p[1] - R.liftAt(gx, gy)]; };
  const G2 = el('g', {}, L);
  // 地名
  [['黑門山', 7.5, -.6], ['加利利海', 8.6, 3.4], ['約旦河', 9.6, 6.6], ['死海', 10.4, 11.6], ['耶路撒冷', 7.6, 10.2], ['外約旦高原', 11.2, 8.4], ['南地', 6, 15.6]].forEach(([t, c, r]) => { const [x, y] = at(c, r); geo(G2, x, y, t, 12); });
  { const [x, y] = iso0((0 + PAD) * F, (9 + PAD) * F); geo(G2, x - 20, y, '地中海', 14); }
  // 山峰、樹林
  { const [x, y] = at(7.5, .6); T.peak(G2, x, y, 20, 'snow'); }
  [[4.5, .8], [5.2, 1.1], [4.7, 1.6], [5.8, 1.6], [6.3, 1.0], [3.4, 4.4, 1], [3.9, 4.8, 1], [4.6, 2.9, 1], [5.6, 3.3, 1]].forEach(([c, r, rd]) => { const [x, y] = at(c, r); T.tree(G2, x, y, 9, rd); });
  // 西奈山（南端，紅色花崗岩）
  { const [x, y] = at(8.3, 18.8); T.peak(G2, x, y, 26, 'red'); label(G2, x, y + 14, '西奈山 Lv2', '★★☆ 出埃及記'); }
  // 伊甸園（加利利）
  { const [x, y] = at(5.4, 2.4); el('rect', { x: x - 3, y: y - 16, width: 6, height: 16, fill: PAL.wood[1] }, G2);
    el('polygon', { points: `${x - 18},${y - 18} ${x},${y - 46} ${x},${y - 12}`, fill: PAL.grass[0] }, G2); el('polygon', { points: `${x},${y - 46} ${x + 18},${y - 18} ${x},${y - 12}`, fill: PAL.grass[1] }, G2);
    label(G2, x, y + 4, '伊甸園 Lv1'); }
  // 挪亞方舟（沿海平原）
  { const [x, y] = at(3.5, 13); const P = iso(x, y, 10);
    block(G2, P, -1.5, -.5, 3, 1.1, 10, PAL.wood); roof(G2, P, -1.5, -.5, 3, 1.1, 10, 8, PAL.wood);
    label(G2, x - 10, y + 14, '挪亞方舟 Lv1', '★☆☆ 創世記'); }
  // 會幕（示羅，中心建築）
  { const [x, y] = at(6.5, 7.5); const P = iso(x, y, 10);
    for (let i = 0; i < 5; i++) block(G2, P, -2 + i * .8, -1.6, .2, .2, 12, PAL.stone);
    block(G2, P, -1, -.6, 2.2, 1.2, 16, PAL.cloth); roof(G2, P, -1, -.6, 2.2, 1.2, 16, 7, PAL.teal);
    block(G2, P, -2.2, -.3, .6, .6, 6, PAL.gold);
    for (let i = 0; i < 5; i++) block(G2, P, -2 + i * .8, 1.4, .2, .2, 12, PAL.stone);
    label(G2, x, y + 20, '會幕', '中心建築・第一階段', true); }
  // 先知（NPC）
  { const [x, y] = at(6.5, 11.2); const P = iso(x, y, 10);
    block(G2, P, -.6, -.6, 1.2, 1.2, 12, PAL.stone); roof(G2, P, -.6, -.6, 1.2, 1.2, 12, 7, PAL.roof);
    person(G2, x - 16, y + 8, '#6741D9', '#E9E4F5'); label(G2, x - 6, y + 20, '以賽亞 🔒', '讀以賽亞書解鎖'); }
  T.panzoom(L, { x: -110, y: -110, w: 630, h: 680 }, ar => ({ cx: 205, cy: 235, w: ar < 1 ? 460 : Math.max(630, 680 * ar) }), true);
  }
})();
