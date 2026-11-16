/* 漢威牧區｜示意地圖（P1-0 骨架用；正式版換成繪製的底圖與元件）。由 prototype/style-sample.html 抽出。 */

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

  // ---------- ① 世界地圖：經緯度投影到 900×640 ----------
  const W = document.getElementById('world'); if (W) {
  const proj = (lon, lat) => [(lon - 11) * 33, (43.2 - lat) * 40 + 40];
  const poly = (pts, fill, stroke) => el('polygon', { points: pts.map(p => proj(p[0], p[1]).join(',')).join(' '), fill, stroke: stroke || '#C2A86F', 'stroke-width': 2, 'stroke-linejoin': 'round' }, W);
  el('rect', { x: 0, y: 0, width: 900, height: 640, fill: '#9CCFD8' }, W);
  for (let i = 0; i < 14; i++) el('path', { d: `M${(i * 97) % 880} ${60 + (i * 53) % 540} q10 -6 20 0 t20 0`, stroke: '#B9E0E6', 'stroke-width': 2, fill: 'none', opacity: .8 }, W);
  const LAND = '#E9D9B4';
  poly([[11, 44], [38, 44], [38, 41.2], [36, 41.6], [34, 42], [31, 41.1], [29, 41.2], [27, 41.2], [26, 40.9], [24, 41.2], [22, 42.2], [20, 41.8], [19.4, 41.8], [18, 42.6], [16, 42.6], [15, 42.2], [12, 42.4], [11, 42.6]], LAND);
  poly([[12, 42.4], [15, 42.2], [16, 41.4], [17.2, 40.5], [18.5, 40.1], [16.6, 39.0], [16.0, 38.0], [15.6, 38.0], [15.9, 39.3], [15.0, 40.2], [14.0, 40.8], [12.5, 41.4], [11, 42.3], [11, 42.6]], LAND);
  poly([[12.4, 38.1], [15.6, 38.3], [15.1, 36.7], [12.6, 37.6]], LAND);
  poly([[19.4, 41.8], [20, 41.8], [22, 42.2], [24, 41.2], [26, 40.9], [26.1, 40.3], [24.5, 40.2], [23.7, 40.2], [22.9, 40.6], [22.6, 40.0], [23.3, 39.2], [22.9, 38.6], [24, 38.2], [23.2, 37.9], [22.9, 37.5], [23.2, 36.4], [22.5, 36.4], [21.7, 36.8], [21.1, 37.8], [21.3, 38.4], [20.7, 38.9], [20, 39.7], [19.4, 40.4]], LAND);
  poly([[26.0, 40.3], [27, 41.2], [29, 41.2], [31, 41.1], [34, 42], [36, 41.6], [38, 41.2], [38, 36.5], [36.2, 36.6], [36, 36.2], [35, 36.6], [34, 36.3], [32.8, 36.1], [31.5, 36.7], [30.6, 36.8], [29.7, 36.2], [28.2, 36.7], [27.3, 37.2], [27.2, 37.9], [26.4, 38.4], [26.8, 39.0], [26.1, 39.5]], LAND);
  poly([[36, 36.2], [38, 36.5], [38, 29.5], [34.9, 29.5], [34.2, 31.2], [34.5, 31.6], [34.9, 32.4], [35.1, 33.1], [35.5, 33.9], [35.9, 34.7], [35.9, 35.4]], LAND);
  poly([[11, 33.6], [15.2, 32.4], [19.6, 32.0], [20, 30.5], [25, 31.6], [29, 30.9], [32.3, 31.3], [34.2, 31.2], [34.9, 29.5], [11, 29.5]], LAND);
  poly([[23.5, 35.6], [26.3, 35.3], [26.2, 35.0], [23.6, 35.2]], LAND);
  poly([[32.3, 35.1], [34.6, 35.7], [33.9, 35.1], [32.6, 34.7]], LAND);
  const mt = proj(14.4, 35.9); el('circle', { cx: mt[0], cy: mt[1], r: 5, fill: LAND, stroke: '#C2A86F', 'stroke-width': 2 }, W);
  const cloud = el('g', { class: 'cloud', opacity: .7 }, W);
  [[640, 470], [760, 240]].forEach(([x, y]) => { el('ellipse', { cx: x, cy: y, rx: 40, ry: 13, fill: '#fff' }, cloud); el('ellipse', { cx: x + 22, cy: y - 8, rx: 24, ry: 12, fill: '#fff' }, cloud); });

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

  }
  // ---------- ② 我的領地：等角格子 ----------
  const L = document.getElementById('land'); if (L) {
  el('rect', { x: 0, y: 0, width: 900, height: 900, fill: '#BFE3C9' }, L);
  const T = 46, P = iso(450, 170, T);
  // 地面格子
  for (let gx = 0; gx < 9; gx++) for (let gy = 0; gy < 9; gy++) {
    const a = P(gx, gy), b = P(gx + 1, gy), c = P(gx + 1, gy + 1), d = P(gx, gy + 1);
    const river = gy === 7 && gx > 1;
    el('polygon', { points: [a, b, c, d].map(p => p.join(',')).join(' '), fill: river ? '#8FC9E0' : ((gx + gy) % 2 ? '#A6DB9A' : '#9BD38F'), stroke: river ? '#7BB7CF' : '#8CC882', 'stroke-width': 1 }, L);
  }
  const G = el('g', {}, L);
  // 西奈山（後方）
  { const base = [P(0, 0), P(3, 0), P(3, 3), P(0, 3)], top = P(1.5, 1.5, 150);
    el('polygon', { points: [base[3], base[2], top].map(p => p.join(',')).join(' '), fill: PAL.rock[1] }, G);
    el('polygon', { points: [base[1], base[2], top].map(p => p.join(',')).join(' '), fill: PAL.rock[2] }, G);
    el('polygon', { points: `${top[0] - 18},${top[1] + 26} ${top[0]},${top[1]} ${top[0] + 18},${top[1] + 26} ${top[0]},${top[1] + 18}`, fill: '#FFFFFF' }, G);
    const [x, y] = P(1.5, 3.2); label(G, x - 30, y - 6, '西奈山 Lv2', '★★☆ 出埃及記'); }
  // 會幕（中心，院子＋帳幕）
  { const cx = 4.2, cy = 3;
    for (let i = 0; i < 5; i++) { block(G, P, cx + i * 0.8, cy, 0.18, 0.18, 22, PAL.stone); block(G, P, cx + i * 0.8, cy + 3, 0.18, 0.18, 22, PAL.stone); }
    block(G, P, cx + 1.2, cy + 1, 2, 1.2, 34, PAL.cloth); roof(G, P, cx + 1.2, cy + 1, 2, 1.2, 34, 14, PAL.teal);
    block(G, P, cx + 0.4, cy + 1.3, 0.6, 0.6, 12, PAL.gold);
    const [x, y] = P(cx + 2.2, cy + 3.6); label(G, x, y + 6, '會幕', '中心建築・第一階段', true); }
  // 挪亞方舟
  { block(G, P, 1, 5, 3, 1.2, 22, PAL.wood); roof(G, P, 1, 5, 3, 1.2, 22, 16, PAL.wood);
    const [x, y] = P(2.5, 6.4); label(G, x + 40, y + 6, '挪亞方舟 Lv1', '★☆☆ 創世記'); }
  // 先知（NPC）
  { block(G, P, 7.4, 4.6, 1.2, 1.2, 18, PAL.stone); roof(G, P, 7.4, 4.6, 1.2, 1.2, 18, 10, PAL.roof);
    const [x, y] = P(7.0, 4.8); person(G, x, y, '#6741D9', '#E9E4F5');
    label(G, x + 10, y + 14, '以賽亞 🔒', '讀以賽亞書解鎖'); }
  // 生命樹（伊甸園）
  { const [x, y] = P(6, 1.4); el('rect', { x: x - 4, y: y - 26, width: 8, height: 26, fill: PAL.wood[1] }, G);
    el('circle', { cx: x, cy: y - 40, r: 24, fill: PAL.grass[1] }, G); el('circle', { cx: x - 8, cy: y - 48, r: 12, fill: PAL.grass[0] }, G);
    label(G, x, y + 6, '伊甸園 Lv1'); }
  }
})();
