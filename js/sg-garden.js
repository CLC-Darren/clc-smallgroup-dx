/* 漢威牧區｜我的領地：園子地形（Gemini 軟陶等角地形）＋ GPT 建築、人物元件。
   來源：Gemini「伊甸與應許之地」原型（地形、河流、台地、開拓、放置、拖曳）；元件圖由 docs/art/ 的 GPT 3×3 表切成 images/garden/*.webp。
   這一版只看樣子：讀經、測驗、存檔都還沒接（重新整理會回到示範配置）。 */
(function () {
  const canvas = document.getElementById('gardenCanvas');
  if (!canvas) return;
  const box = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  const V = '20261116t';
  const IMG = 'images/garden/';

  const TILE_W = 128, TILE_H = 64, PLATEAU_ELEVATION_PX = 28;
  const TREE = { gx: 0.85, gy: -0.65 };   // 中央生命樹

  // GPT 建築：檔名、名稱、佔地（格）、顯示比例
  const ITEMS = [
    ['b1-01', 'tabernacle', '會幕', 3, 1.00], ['b1-02', 'ark_boat', '挪亞方舟', 3, 1.00], ['b1-03', 'altar', '銅祭壇', 2, 0.75],
    ['b1-04', 'harp', '大衛的琴', 1, 0.60], ['b1-05', 'gate', '城門', 2, 1.00], ['b1-06', 'house', '泥磚民居', 2, 1.00],
    ['b1-07', 'vineyard', '葡萄園', 2, 1.00], ['b1-08', 'sundial', '日晷', 1, 0.60], ['b1-09', 'ark_cov', '約櫃', 2, 0.75],
    ['b2-01', 'palace', '王宮', 3, 1.00], ['b2-02', 'tomb', '空墳墓', 2, 1.00], ['b2-03', 'boat', '加利利漁船', 2, 0.90],
    ['b2-04', 'manger', '馬槽', 2, 1.00], ['b2-05', 'dock', '漁港碼頭', 2, 1.00], ['b2-06', 'hall', '柱廊會堂', 3, 0.95],
    ['b2-07', 'serpent', '銅蛇', 1, 0.80], ['b2-08', 'stones', '紀念石', 1, 0.80], ['b2-09', 'elim', '以琳棕樹', 2, 1.00]
  ];
  // 示範配置（想放的位置；放不下就就近找）
  const DEMO = [['tabernacle', 1.5, 2.2], ['house', 2.2, -2.6], ['vineyard', -3.6, 2.4], ['gate', -1.4, 4.3], ['harp', -2.6, -2.6],
    ['ark_cov', 3.0, 2.5], ['elim', 4.2, -1.4], ['manger', -4.2, -0.2], ['ark_boat', 0.2, -4.6], ['sundial', -2.0, -1.8], ['stones', 2.8, 0.4]];

  const state = {
    camX: 0, camY: 0, zoom: 0.8, time: 0, w: 0, h: 0, dpr: 1,
    gardenBlobs: [{ cx: 0, cy: 0, rx: 5.4, ry: 5.3, seed: 0.8, progress: 1, flowers: [] }],
    plateaus: [{ cx: -2.6, cy: -2.4, rx: 2.35, ry: 2.15, seed: 1.2 }, { cx: 2.8, cy: 2.3, rx: 2.15, ry: 2.05, seed: 3.7 }],
    expandingMode: false, expansionCandidates: [],
    building: false, selectedCatalogIndex: -1, selectedPlacedId: null, draggingPlacedId: null, dragOffsetGrid: { gx: 0, gy: 0 }, hoverGrid: null,
    buildings: [], catalog: [], charSprites: [], decorations: [], agents: [],
    leaves: [], birds: [], riverSparkles: [], desertGrains: []
  };

  // ---------- 介面（壓在地圖上） ----------
  const ui = document.createElement('div');
  ui.className = 'sg-gd-ui';
  ui.innerHTML = `<div class="sg-gd-top"><button type="button" class="sg-gd-btn" id="gdExpand">✨ 開拓</button><button type="button" class="sg-gd-btn" id="gdBuild" aria-pressed="false">🏗️ 建造</button></div>
    <div class="sg-gd-toast" id="gdToast"></div>
    <div class="sg-gd-sel" id="gdSel"><b id="gdSelName"></b><span>可拖曳移動</span><button type="button" class="sg-gd-btn danger" id="gdDel">🗑️ 拆除</button><button type="button" class="sg-gd-btn" id="gdSelOk">完成</button></div>
    <div class="sg-gd-dock" id="gdDock" hidden></div>`;
  box.append(ui);
  const $ = id => document.getElementById(id);
  function toast(msg) { const el = $('gdToast'); el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600); }

  // ---------- 座標 ----------
  const gridToWorld = (gx, gy) => ({ wx: (gx - gy) * (TILE_W * 0.5), wy: (gx + gy) * (TILE_H * 0.5) });
  const worldToGrid = (wx, wy) => ({ gx: (wx / (TILE_W * 0.5) + wy / (TILE_H * 0.5)) * 0.5, gy: (wy / (TILE_H * 0.5) - wx / (TILE_W * 0.5)) * 0.5 });
  function screenToWorld(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return { wx: (cx - r.left - state.w * 0.5 - state.camX) / state.zoom, wy: (cy - r.top - state.h * 0.5 - state.camY) / state.zoom };
  }

  // ---------- 有機區塊、台地、河流 ----------
  function blobR(b, a) {
    const c = Math.cos(a), s = Math.sin(a), n = 2.5;
    const rx = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ry = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    const wob = 1 + 0.065 * Math.sin(a * 4 + b.seed) + 0.045 * Math.cos(a * 3 - b.seed * 1.3);
    return { dx: rx * b.rx * wob, dy: ry * b.ry * wob };
  }
  function inShape(gx, gy, s, margin = 0) {
    const x = gx - s.cx, y = gy - s.cy, d = blobR(s, Math.atan2(y, x));
    return Math.hypot(x, y) <= Math.hypot(d.dx, d.dy) + margin;
  }
  const isInsideGarden = (gx, gy) => state.gardenBlobs.some(b => b.progress > 0.35 && inShape(gx, gy, b, -0.15));
  const elevAt = (gx, gy) => state.plateaus.some(p => inShape(gx, gy, p, -0.22)) ? 1 : 0;
  const riverX = gy => Math.sin(gy * 0.40) * 1.65 - 0.35;
  const isRiver = (gx, gy) => Math.abs(gx - riverX(gy)) < 0.72;

  function shapePath(s, offY = 0, k = 1) {
    const path = new Path2D(), pts = [], N = 56;
    for (let i = 0; i < N; i++) {
      const d = blobR(s, i / N * Math.PI * 2), p = gridToWorld(s.cx + d.dx * k, s.cy + d.dy * k);
      pts.push({ x: p.wx, y: p.wy + offY });
    }
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N];
      if (i === 0) path.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
      path.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
    }
    path.closePath(); return path;
  }
  function gyExtent() {
    let a = -5.2, b = 5.2;
    state.gardenBlobs.forEach(o => { if (o.progress > 0.1) { a = Math.min(a, o.cy - o.ry * o.progress); b = Math.max(b, o.cy + o.ry * o.progress); } });
    return { minGy: a, maxGy: b };
  }
  function lerpHex(a, b, t) {
    const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
    const x = ch(A), y = ch(B);
    return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',') + ')';
  }

  // ---------- 開拓 ----------
  function makeCandidates() {
    state.expansionCandidates = [];
    const a0 = Math.random() * Math.PI * 2;
    [a0, a0 + Math.PI * 2 / 3 + (Math.random() - .5) * .45, a0 + Math.PI * 4 / 3 + (Math.random() - .5) * .45].forEach((a, i) => {
      const dx = Math.cos(a), dy = Math.sin(a); let d = 3.5;
      while (d < 18 && isInsideGarden(dx * d, dy * d)) d += 0.4;
      state.expansionCandidates.push({ cx: dx * (d + 1.35), cy: dy * (d + 1.35), rx: 2.5 + Math.random() * .9, ry: 2.4 + Math.random() * .9, seed: Math.random() * 10 + i * 2.1, pulse: i * 1.4 });
    });
  }
  function pickCandidate(c) {
    const flowers = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * .78;
      flowers.push({ gx: c.cx + Math.cos(a) * c.rx * r, gy: c.cy + Math.sin(a) * c.ry * r, color: ['#ff8fa3', '#ffd166', '#ffffff', '#b5e48c'][i % 4], delay: Math.random() * .5 });
    }
    const blob = { cx: c.cx, cy: c.cy, rx: c.rx, ry: c.ry, seed: c.seed, progress: .01, flowers };
    state.gardenBlobs.push(blob);
    setExpand(false);
    setTimeout(() => addDecorations(blob, 4), 1550);
    toast('🌱 新土地正在變綠，河道也跟著延伸！');
  }
  function setExpand(on) {
    state.expandingMode = on; $('gdExpand').classList.toggle('on', on);
    if (on) { setBuild(false); state.selectedPlacedId = null; selBar(); makeCandidates(); toast('✨ 點一塊發光的候選地來開拓'); }
    else state.expansionCandidates = [];
  }

  // ---------- 畫世界 ----------
  const MESAS = [{ x: -1020, y: -380, rx: 195, ry: 96, h: 48 }, { x: 1080, y: -290, rx: 225, ry: 110, h: 56 }, { x: -940, y: 520, rx: 175, ry: 88, h: 42 }, { x: 990, y: 540, rx: 210, ry: 102, h: 50 }];
  function drawWorld(t) {
    const dg = ctx.createLinearGradient(-1800, -1100, 1800, 1200);
    dg.addColorStop(0, '#f3d49b'); dg.addColorStop(.5, '#e7be82'); dg.addColorStop(1, '#d6a363');
    ctx.fillStyle = dg; ctx.fillRect(-4200, -3200, 8400, 6400);
    for (let i = -7; i <= 7; i++) {
      const by = i * 240, g = ctx.createLinearGradient(0, by - 70, 0, by + 110);
      g.addColorStop(0, 'rgba(255,241,212,.42)'); g.addColorStop(.45, 'rgba(235,192,132,.12)'); g.addColorStop(1, 'rgba(176,121,62,.24)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-3800, by + 200);
      for (let x = -3800; x <= 3800; x += 320) ctx.lineTo(x, by + Math.sin(x * .0022 + i * 1.4) * 65 + Math.cos(x * .0011 - i) * 35);
      ctx.lineTo(3800, by + 260); ctx.closePath(); ctx.fill();
    }
    state.desertGrains.forEach(g => { ctx.fillStyle = g.light ? 'rgba(255,248,226,.48)' : 'rgba(171,117,58,.28)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, g.r * 1.5, g.r * .85, .2, 0, Math.PI * 2); ctx.fill(); });
    MESAS.forEach(m => {
      ctx.fillStyle = 'rgba(138,86,40,.25)'; ctx.beginPath(); ctx.ellipse(m.x + 12, m.y + 16, m.rx * 1.05, m.ry * 1.06, 0, 0, Math.PI * 2); ctx.fill();
      const cg = ctx.createLinearGradient(m.x - m.rx, m.y, m.x + m.rx, m.y);
      cg.addColorStop(0, '#d47c57'); cg.addColorStop(.5, '#be623e'); cg.addColorStop(1, '#9c4829');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(m.x, m.y, m.rx, m.ry, 0, 0, Math.PI * 2); ctx.fill();
      const tg = ctx.createRadialGradient(m.x - m.rx * .25, m.y - m.h - m.ry * .2, 10, m.x, m.y - m.h, m.rx);
      tg.addColorStop(0, '#f2a97e'); tg.addColorStop(1, '#d9845b');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(m.x, m.y - m.h, m.rx * .94, m.ry * .92, 0, 0, Math.PI * 2); ctx.fill();
    });
    // 綠洲：先畫全部陰影 → 懸崖 → 草地，重疊的區塊會融成一塊
    const bp = state.gardenBlobs.map(b => ({ b, p: b.progress, top: shapePath(b, 0, .85 + .15 * b.progress), cliff: shapePath(b, 28 * b.progress, .85 + .15 * b.progress) }));
    ctx.save(); ctx.translate(0, 36); ctx.fillStyle = 'rgba(128,84,38,.26)'; bp.forEach(o => ctx.fill(o.top)); ctx.restore();
    const cl = ctx.createLinearGradient(-700, 0, 700, 0);
    cl.addColorStop(0, '#b58a54'); cl.addColorStop(.5, '#966d3c'); cl.addColorStop(1, '#755128');
    ctx.fillStyle = cl; bp.forEach(o => ctx.fill(o.cliff));
    bp.forEach(o => {
      const { wx, wy } = gridToWorld(o.b.cx, o.b.cy), r = Math.max(o.b.rx, o.b.ry) * TILE_W;
      const g = ctx.createRadialGradient(wx - 60, wy - 70, 20, wx, wy, r * 1.15);
      if (o.p < 1) { g.addColorStop(0, lerpHex('#ebd096', '#a8db72', o.p)); g.addColorStop(.6, lerpHex('#dfb878', '#82bf56', o.p)); g.addColorStop(1, lerpHex('#cfa05d', '#659e40', o.p)); }
      else { g.addColorStop(0, '#a8db72'); g.addColorStop(.55, '#82bf56'); g.addColorStop(1, '#659e40'); }
      ctx.fillStyle = g; ctx.fill(o.top);
    });
    state.gardenBlobs.forEach(b => (b.flowers || []).forEach(f => {
      const lp = Math.max(0, Math.min(1, (b.progress - f.delay * .5) * 1.6)); if (lp <= 0) return;
      const s = lp < 1 ? (1 + .35 * Math.sin(lp * Math.PI)) * lp : 1, { wx, wy } = gridToWorld(f.gx, f.gy);
      ctx.save(); ctx.translate(wx, wy); ctx.scale(s, s);
      ctx.strokeStyle = '#5c9c38'; ctx.lineWidth = 2.5; ctx.beginPath();
      ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -8, -8, -11); ctx.moveTo(0, 0); ctx.quadraticCurveTo(5, -9, 8, -12); ctx.stroke();
      ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(0, -11, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }));
    drawRiver(t);
    state.plateaus.forEach(p => {
      const top = shapePath(p, -PLATEAU_ELEVATION_PX, 1), base = shapePath(p, 4, 1.04);
      ctx.fillStyle = 'rgba(68,108,40,.28)'; ctx.fill(base);
      const { wx, wy } = gridToWorld(p.cx, p.cy), rw = p.rx * TILE_W;
      const cg = ctx.createLinearGradient(wx - rw, wy, wx + rw, wy);
      cg.addColorStop(0, '#96c963'); cg.addColorStop(.5, '#76ab48'); cg.addColorStop(1, '#588a32');
      ctx.fillStyle = cg; ctx.fill(base);
      const tg = ctx.createRadialGradient(wx - 40, wy - PLATEAU_ELEVATION_PX - 40, 15, wx, wy - PLATEAU_ELEVATION_PX, rw);
      tg.addColorStop(0, '#bded87'); tg.addColorStop(.65, '#91cf61'); tg.addColorStop(1, '#75b548');
      ctx.fillStyle = tg; ctx.fill(top);
      ctx.strokeStyle = 'rgba(232,255,194,.65)'; ctx.lineWidth = 4; ctx.stroke(top);
    });
    if (state.expandingMode) state.expansionCandidates.forEach(c => {
      const path = shapePath(c), pulse = .55 + .45 * Math.sin(t * 4.2 + c.pulse);
      ctx.save(); ctx.fillStyle = `rgba(175,242,128,${.18 + .14 * pulse})`; ctx.fill(path);
      ctx.shadowColor = '#fff799'; ctx.shadowBlur = 16; ctx.strokeStyle = `rgba(255,252,196,${.65 + .35 * pulse})`;
      ctx.lineWidth = 4.5; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 24; ctx.stroke(path); ctx.restore();
      const { wx, wy } = gridToWorld(c.cx, c.cy);
      ctx.fillStyle = 'rgba(74,55,35,.78)'; ctx.beginPath(); ctx.roundRect(wx - 46, wy - 15, 92, 30, 15); ctx.fill();
      ctx.fillStyle = '#fff9e6'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('✨ 點擊開拓', wx, wy);
    });
  }
  function drawRiver(t) {
    const { minGy, maxGy } = gyExtent(), pts = [];
    for (let i = 0; i <= 36; i++) { const gy = minGy + (maxGy - minGy) * i / 36; pts.push(gridToWorld(riverX(gy), gy)); }
    const stroke = (w, st) => {
      ctx.strokeStyle = st; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0].wx, pts[0].wy);
      for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(pts[i].wx, pts[i].wy, (pts[i].wx + pts[i + 1].wx) / 2, (pts[i].wy + pts[i + 1].wy) / 2);
      ctx.lineTo(pts[pts.length - 1].wx, pts[pts.length - 1].wy); ctx.stroke();
    };
    stroke(TILE_W * .92, 'rgba(214,198,146,.72)'); stroke(TILE_W * .74, '#79d2d6'); stroke(TILE_W * .54, '#4ab3d9');
    ctx.save(); ctx.setLineDash([28, 42]); ctx.lineDashOffset = -t * 26; stroke(TILE_W * .22, 'rgba(235,252,255,.45)'); ctx.restore();
    state.riverSparkles.forEach(sp => {
      const gy = minGy + ((sp.u + t * sp.speed) % 1) * (maxGy - minGy), p = gridToWorld(riverX(gy) + sp.offsetX, gy), tw = .4 + .6 * Math.sin(t * 5 + sp.phase);
      ctx.fillStyle = `rgba(255,255,255,${.75 * tw})`; ctx.beginPath(); ctx.arc(p.wx, p.wy, sp.size * (.7 + .4 * tw), 0, Math.PI * 2); ctx.fill();
    });
  }

  // ---------- 放置規則：園內、非河道、不重疊、不碰生命樹、整棟同一層 ----------
  function canPlaceAt(gx, gy, size, ignoreId) {
    const x0 = Math.floor(gx), y0 = Math.floor(gy); let lvl = null;
    if (Math.hypot(x0 + size / 2 - TREE.gx, y0 + size / 2 - TREE.gy) < size / 2 + 0.9) return false;
    for (let x = x0; x < x0 + size; x++) for (let y = y0; y < y0 + size; y++) {
      const cx = x + .5, cy = y + .5;
      if (!isInsideGarden(cx, cy) || isRiver(cx, cy)) return false;
      const e = elevAt(cx, cy); if (lvl === null) lvl = e; else if (e !== lvl) return false;
      for (const b of state.buildings) if (b.id !== ignoreId && x < b.gx + b.size && x + 1 > b.gx && y < b.gy + b.size && y + 1 > b.gy) return false;
    }
    return { ok: true, elevation: lvl || 0 };
  }
  function nearBuilding(gx, gy, d) { return state.buildings.some(b => Math.hypot(gx - b.gx - b.size / 2, gy - b.gy - b.size / 2) < b.size / 2 + d); }

  // ---------- 裝飾（還沒有裝飾表：先用程式畫的樹、花、石頭）與人物 ----------
  function regenDecorations() {
    state.decorations = [{ gx: TREE.gx, gy: TREE.gy, kind: 'life', scale: 1.38 }];
    state.gardenBlobs.forEach(b => addDecorations(b, 9));
  }
  function addDecorations(blob, n) {
    for (let placed = 0, tries = 0; placed < n && tries < 80; tries++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * .85, gx = blob.cx + Math.cos(a) * blob.rx * r, gy = blob.cy + Math.sin(a) * blob.ry * r;
      if (!isInsideGarden(gx, gy) || isRiver(gx, gy) || Math.hypot(gx - TREE.gx, gy - TREE.gy) < 1.8 || nearBuilding(gx, gy, 0.9)) continue;
      state.decorations.push({ gx, gy, kind: ['tree', 'flower', 'rock'][Math.floor(Math.random() * 3)], scale: .72 + Math.random() * .32 }); placed++;
    }
  }
  function initAgents() {
    state.agents = [
      { role: 0, gx: 1.5, gy: 0.4, tx: 3.0, ty: 0.9, wait: 0, phase: 0 }, { role: 1, gx: 2.6, gy: -1.0, tx: 1.4, ty: -2.4, wait: .5, phase: 1.7 },
      { role: 2, gx: -2.2, gy: 1.4, tx: -3.2, ty: 0.6, wait: 0, phase: 3.1 }, { role: 3, gx: -2.6, gy: 1.9, tx: -3.0, ty: 1.0, wait: .2, phase: 2.2 },
      { role: 3, gx: -1.9, gy: 2.0, tx: -2.6, ty: 1.4, wait: .8, phase: 4.0 }];
  }
  function updateAgents(dt) {
    state.agents.forEach(a => {
      a.phase += dt * 7.5;
      if (a.wait > 0) { a.wait -= dt; return; }
      const dx = a.tx - a.gx, dy = a.ty - a.gy, d = Math.hypot(dx, dy);
      if (d < .12) {
        a.wait = 1 + Math.random() * 2;
        for (let k = 0; k < 18; k++) {
          const b = state.gardenBlobs[Math.floor(Math.random() * state.gardenBlobs.length)], an = Math.random() * Math.PI * 2, r = Math.random() * .78;
          const nx = b.cx + Math.cos(an) * b.rx * r, ny = b.cy + Math.sin(an) * b.ry * r;
          if (isInsideGarden(nx, ny) && !isRiver(nx, ny)) { a.tx = nx; a.ty = ny; break; }
        }
      } else { const sp = a.role === 3 ? .62 : .82; a.gx += dx / d * sp * dt; a.gy += dy / d * sp * dt; }
    });
  }

  // ---------- 環境粒子 ----------
  function initAmbient() {
    const R = Math.random;
    state.leaves = Array.from({ length: 18 }, (_, i) => ({ x: (R() - .5) * 1400, y: (R() - .5) * 900, vx: 14 + R() * 14, vy: 8 + R() * 10, phase: R() * 6.3, size: 4 + R() * 3, color: ['#a8d663', '#f4c95d', '#e59854'][i % 3] }));
    state.birds = Array.from({ length: 4 }, (_, i) => ({ x: -1600 + i * 750, y: -450 + i * 230, speed: 48 + R() * 22, wing: i * 1.5, scale: .75 + R() * .35 }));
    state.riverSparkles = Array.from({ length: 24 }, () => ({ u: R(), offsetX: (R() - .5) * .42, speed: .035 + R() * .025, phase: R() * 6.3, size: 2.2 + R() * 2 }));
    state.desertGrains = Array.from({ length: 300 }, () => ({ x: (R() - .5) * 4800, y: (R() - .5) * 3400, r: 1.5 + R() * 2.2, light: R() > .42 }));
  }
  function drawAmbient(dt, t) {
    state.leaves.forEach(l => {
      l.x += (l.vx + Math.sin(t * 2 + l.phase) * 10) * dt; l.y += l.vy * dt;
      if (l.x > 950 || l.y > 650) { l.x = -850 + Math.random() * 400; l.y = -580; }
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(Math.sin(t * 2.5 + l.phase) * .8); ctx.fillStyle = l.color;
      ctx.beginPath(); ctx.ellipse(0, 0, l.size, l.size * .48, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    state.birds.forEach(b => {
      b.x += b.speed * dt; b.y -= b.speed * .22 * dt; b.wing += dt * 7.5;
      if (b.x > 1600) { b.x = -1600; b.y = -300 + Math.random() * 650; }
      const f = Math.sin(b.wing) * 7;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.scale, b.scale); ctx.strokeStyle = 'rgba(74,52,28,.22)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-14, f); ctx.quadraticCurveTo(-6, -6, 0, 0); ctx.quadraticCurveTo(6, -6, 14, f); ctx.stroke(); ctx.restore();
    });
  }

  // ---------- 實體（依深度排序） ----------
  function spriteBottom(img, wx, wy, w) { const h = w * img.height / img.width; ctx.drawImage(img, wx - w / 2, wy - h * .86, w, h); }
  function drawEntities() {
    const list = [];
    state.decorations.forEach(d => { const p = gridToWorld(d.gx, d.gy), e = elevAt(d.gx, d.gy) * PLATEAU_ELEVATION_PX; list.push({ z: d.gx + d.gy + e * .02, f: () => drawDecoration(d, p.wx, p.wy - e) }); });
    state.buildings.forEach(b => {
      const c = state.catalog.find(x => x.id === b.catalogId); if (!c || !c.img) return;
      const cx = b.gx + b.size / 2, cy = b.gy + b.size / 2, p = gridToWorld(cx, cy), e = (b.elevation || 0) * PLATEAU_ELEVATION_PX;
      list.push({ z: cx + cy + e * .02, f: () => drawBuilding(b, c, p.wx, p.wy - e, b.id === state.selectedPlacedId) });
    });
    state.agents.forEach(a => { const p = gridToWorld(a.gx, a.gy), e = elevAt(a.gx, a.gy) * PLATEAU_ELEVATION_PX; list.push({ z: a.gx + a.gy + e * .02, f: () => drawAgent(a, p.wx, p.wy - e) }); });
    list.sort((a, b) => a.z - b.z).forEach(o => o.f());
    if (state.selectedCatalogIndex >= 0 && state.hoverGrid) {
      const c = state.catalog[state.selectedCatalogIndex]; if (!c.img) return;
      const gx = Math.floor(state.hoverGrid.gx - c.size / 2 + .5), gy = Math.floor(state.hoverGrid.gy - c.size / 2 + .5), res = canPlaceAt(gx, gy, c.size);
      const e = (res ? res.elevation : elevAt(gx + .5, gy + .5)) * PLATEAU_ELEVATION_PX, p = gridToWorld(gx + c.size / 2, gy + c.size / 2);
      ctx.save(); ctx.fillStyle = res ? 'rgba(118,214,102,.45)' : 'rgba(235,92,74,.48)';
      ctx.beginPath(); ctx.ellipse(p.wx, p.wy - e, c.size * TILE_W * .45, c.size * TILE_H * .45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .8; spriteBottom(c.img, p.wx, p.wy - e + c.size * 6, c.size * TILE_W * .94 * c.scale); ctx.restore();
    }
  }
  function drawBuilding(b, c, wx, wy, sel) {
    if (sel) {
      ctx.fillStyle = 'rgba(255,224,115,.5)'; ctx.beginPath(); ctx.ellipse(wx, wy, b.size * TILE_W * .48, b.size * TILE_H * .48, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffcf4d'; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.fillStyle = 'rgba(72,52,28,.18)'; ctx.beginPath(); ctx.ellipse(wx + 6, wy + 4, b.size * TILE_W * .36, b.size * TILE_H * .34, 0, 0, Math.PI * 2); ctx.fill();
    spriteBottom(c.img, wx, wy + b.size * 6, b.size * TILE_W * .94 * c.scale);
  }
  function drawDecoration(d, wx, wy) {
    const s = d.scale; ctx.save(); ctx.translate(wx, wy);
    ctx.fillStyle = 'rgba(65,95,42,.22)'; ctx.beginPath(); ctx.ellipse(0, 4, 24 * s, 12 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (d.kind === 'life' || d.kind === 'tree') {
      const L = d.kind === 'life';
      ctx.fillStyle = '#9c6336'; ctx.beginPath(); ctx.roundRect(-6 * s, -34 * s, 12 * s, 36 * s, 5 * s); ctx.fill();
      const g = ctx.createRadialGradient(-10 * s, -54 * s, 4, 0, -44 * s, 34 * s);
      g.addColorStop(0, L ? '#ffe875' : '#bce87d'); g.addColorStop(.6, L ? '#7bc950' : '#73b548'); g.addColorStop(1, '#528c32');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -46 * s, 28 * s, 0, Math.PI * 2); ctx.arc(-16 * s, -36 * s, 18 * s, 0, Math.PI * 2); ctx.arc(16 * s, -36 * s, 18 * s, 0, Math.PI * 2); ctx.fill();
      if (L) { ctx.fillStyle = '#ffd34d'; [[-12, -50], [10, -58], [14, -38], [-18, -34], [0, -40]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x * s, y * s, 3.6 * s, 0, Math.PI * 2); ctx.fill(); }); }
    } else if (d.kind === 'flower') {
      ctx.fillStyle = '#6db344'; ctx.beginPath(); ctx.arc(0, -8 * s, 15 * s, 0, Math.PI * 2); ctx.fill();
      ['#ff8fa3', '#ffd166', '#ffffff'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc((i - 1) * 7 * s, -11 * s, 3.5 * s, 0, Math.PI * 2); ctx.fill(); });
    } else {
      ctx.fillStyle = '#cfc4b2'; ctx.beginPath(); ctx.ellipse(-4 * s, -5 * s, 13 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#b5a895'; ctx.beginPath(); ctx.ellipse(8 * s, -3 * s, 9 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  function drawAgent(a, wx, wy) {
    const moving = a.wait <= 0, bounce = moving ? Math.abs(Math.sin(a.phase)) * 5 : 0, mv = gridToWorld(a.tx - a.gx, a.ty - a.gy);
    ctx.fillStyle = 'rgba(58,78,36,.25)'; ctx.beginPath(); ctx.ellipse(wx, wy + 2, 15, 7, 0, 0, Math.PI * 2); ctx.fill();
    // 人物表：列 1 男、列 2 女、列 3 牧人與小羊；每列：走（正面）、走（背面）、站
    let idx = a.role === 3 ? 8 : a.role * 3 + (!moving && a.role < 2 ? 2 : (mv.wy < -.5 ? 1 : 0));
    const spr = state.charSprites[idx]; if (!spr) return;
    const h = a.role === 3 ? 44 : 66, w = h * spr.width / spr.height;
    ctx.save(); ctx.translate(wx, wy - bounce); if (mv.wx < -.5) ctx.scale(-1, 1);
    ctx.drawImage(spr, -w / 2, -h * .92, w, h); ctx.restore();
  }

  // ---------- 建造選單 ----------
  function dock() {
    const el = $('gdDock');
    el.innerHTML = state.catalog.map((c, i) => `<button type="button" class="sg-gd-card${state.selectedCatalogIndex === i ? ' on' : ''}" data-i="${i}">
      <img src="${c.src}" alt=""><b>${c.name}</b><span class="ctl"><span class="sz" data-sz="${i}" title="佔地格數">${c.size}×${c.size}</span>
      <span class="sc"><span data-sc="-${i}">－</span><i>${c.scale.toFixed(2)}</i><span data-sc="+${i}">＋</span></span></span></button>`).join('');
  }
  $('gdDock').addEventListener('click', e => {
    const sz = e.target.closest('[data-sz]');
    if (sz) { const c = state.catalog[+sz.dataset.sz]; c.size = c.size % 3 + 1; dock(); toast(`「${c.name}」佔地改為 ${c.size}×${c.size}`); return; }
    const sc = e.target.closest('[data-sc]');
    if (sc) { const v = sc.dataset.sc, c = state.catalog[+v.slice(1)]; c.scale = Math.max(.35, Math.min(1.8, Math.round((c.scale + (v[0] === '+' ? .05 : -.05)) * 100) / 100)); dock(); return; }
    const card = e.target.closest('[data-i]'); if (!card) return;
    const i = +card.dataset.i; state.selectedCatalogIndex = state.selectedCatalogIndex === i ? -1 : i; state.selectedPlacedId = null; selBar(); dock();
    if (state.selectedCatalogIndex >= 0) toast(`點園子裡的空地放「${state.catalog[i].name}」`);
  });
  function setBuild(on) {
    state.building = on; $('gdBuild').setAttribute('aria-pressed', String(on)); $('gdDock').hidden = !on; document.body.classList.toggle('sg-gd-building', on);
    if (on) { if (state.expandingMode) setExpand(false); dock(); } else { state.selectedCatalogIndex = -1; }
  }
  $('gdBuild').addEventListener('click', () => setBuild(!state.building));
  $('gdExpand').addEventListener('click', () => setExpand(!state.expandingMode));
  function selBar() {
    const b = state.buildings.find(x => x.id === state.selectedPlacedId), el = $('gdSel');
    if (!b) { el.classList.remove('on'); return; }
    const c = state.catalog.find(x => x.id === b.catalogId); $('gdSelName').textContent = `${c ? c.name : '建築'}（${b.size}×${b.size}）`; el.classList.add('on');
  }
  $('gdDel').addEventListener('click', () => { state.buildings = state.buildings.filter(b => b.id !== state.selectedPlacedId); state.selectedPlacedId = null; selBar(); toast('已拆除'); });
  $('gdSelOk').addEventListener('click', () => { state.selectedPlacedId = null; selBar(); });

  // ---------- 操作：單指拖曳畫面／移動建築、雙指縮放、滾輪縮放、點選放置與開拓 ----------
  const ptrs = new Map(); let panning = false, panStart = { x: 0, y: 0 }, downPos = { x: 0, y: 0 }, pinch0 = null, zoom0 = 1;
  const ZMIN = .24, ZMAX = 1.9;
  function hitBuilding(gx, gy) {
    for (const b of [...state.buildings].sort((a, c) => (c.gx + c.gy) - (a.gx + a.gy))) {
      const s = (b.elevation || 0) * PLATEAU_ELEVATION_PX / TILE_H, x = gx + s, y = gy + s;
      if (x >= b.gx - .15 && x <= b.gx + b.size + .15 && y >= b.gy - .15 && y <= b.gy + b.size + .15) return b;
    }
    return null;
  }
  function zoomAt(cx, cy, z) {
    const r = canvas.getBoundingClientRect(), sx = cx - r.left - state.w / 2, sy = cy - r.top - state.h / 2;
    const k = Math.max(ZMIN, Math.min(ZMAX, z)) / state.zoom;
    state.camX = sx - (sx - state.camX) * k; state.camY = sy - (sy - state.camY) * k; state.zoom *= k;
  }
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { panning = false; state.draggingPlacedId = null; const p = [...ptrs.values()]; pinch0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); zoom0 = state.zoom; return; }
    downPos = { x: e.clientX, y: e.clientY };
    const w = screenToWorld(e.clientX, e.clientY), g = worldToGrid(w.wx, w.wy); state.hoverGrid = g;
    if (state.selectedCatalogIndex === -1 && !state.expandingMode) {
      const hit = hitBuilding(g.gx, g.gy);
      if (hit && (state.building || hit.id === state.selectedPlacedId)) { state.selectedPlacedId = hit.id; state.draggingPlacedId = hit.id; state.dragOffsetGrid = { gx: g.gx - hit.gx, gy: g.gy - hit.gy }; selBar(); return; }
    }
    panning = true; panStart = { x: e.clientX - state.camX, y: e.clientY - state.camY };
  });
  canvas.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch0) { const p = [...ptrs.values()]; zoomAt((p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, zoom0 * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / pinch0); return; }
    const w = screenToWorld(e.clientX, e.clientY), g = worldToGrid(w.wx, w.wy); state.hoverGrid = g;
    if (state.draggingPlacedId) {
      const b = state.buildings.find(x => x.id === state.draggingPlacedId);
      if (b) { const tx = Math.round(g.gx - state.dragOffsetGrid.gx), ty = Math.round(g.gy - state.dragOffsetGrid.gy), r = canPlaceAt(tx, ty, b.size, b.id); if (r) { b.gx = tx; b.gy = ty; b.elevation = r.elevation; } }
      return;
    }
    if (panning && ptrs.size === 1) { state.camX = e.clientX - panStart.x; state.camY = e.clientY - panStart.y; }
  });
  function ptrEnd(e) {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = null;
    const wasDrag = !!state.draggingPlacedId; state.draggingPlacedId = null; panning = false;
    if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) >= 10 || wasDrag || ptrs.size) return;
    const w = screenToWorld(e.clientX, e.clientY), g = worldToGrid(w.wx, w.wy);
    if (state.expandingMode) { const c = state.expansionCandidates.find(c => inShape(g.gx, g.gy, c, .45)); if (c) { pickCandidate(c); return; } }
    if (state.selectedCatalogIndex >= 0) {
      const c = state.catalog[state.selectedCatalogIndex], gx = Math.floor(g.gx - c.size / 2 + .5), gy = Math.floor(g.gy - c.size / 2 + .5), r = canPlaceAt(gx, gy, c.size);
      if (r) state.buildings.push({ id: 'b_' + Date.now() + '_' + Math.floor(Math.random() * 1000), catalogId: c.id, gx, gy, size: c.size, elevation: r.elevation });
      else toast('⚠️ 這裡放不下：要避開河道、沙漠、生命樹，也不能跨在台地邊緣');
    } else { const hit = hitBuilding(g.gx, g.gy); state.selectedPlacedId = hit ? hit.id : null; selBar(); }
  }
  canvas.addEventListener('pointerup', ptrEnd);
  canvas.addEventListener('pointercancel', ptrEnd);
  canvas.addEventListener('pointerleave', () => { if (!ptrs.size) state.hoverGrid = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.clientX, e.clientY, state.zoom * (e.deltaY < 0 ? 1.08 : .92)); }, { passive: false });

  // ---------- 尺寸與主迴圈 ----------
  let fitted = false;
  function resize() {
    const r = box.getBoundingClientRect(); if (!r.width || !r.height) return;
    state.w = r.width; state.h = r.height; state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * state.dpr); canvas.height = Math.round(r.height * state.dpr);
    if (!fitted) { state.zoom = Math.max(ZMIN, Math.min(1.05, r.width / 1180, r.height / 860)); state.camX = 0; state.camY = (r.width < 600 ? -30 : 10) * state.zoom; fitted = true; }
  }
  new ResizeObserver(resize).observe(box);
  let last = performance.now();
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!still.matches) { state.time += dt; updateAgents(dt); }
    state.gardenBlobs.forEach(b => { if (b.progress < 1) b.progress = Math.min(1, b.progress + dt / 1.5); });
    if (state.w) {
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); ctx.clearRect(0, 0, state.w, state.h);
      ctx.translate(state.w / 2 + state.camX, state.h / 2 + state.camY); ctx.scale(state.zoom, state.zoom);
      drawWorld(state.time); drawEntities(); drawAmbient(still.matches ? 0 : dt, state.time);
    }
    requestAnimationFrame(loop);
  }

  // ---------- 啟動 ----------
  const load = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
  state.catalog = ITEMS.map(([f, id, name, size, scale]) => ({ id, name, size, scale, src: `${IMG}${f}.webp?v=${V}`, img: null }));
  state.catalog.forEach(c => load(c.src).then(im => { c.img = im; }));
  Promise.all(Array.from({ length: 9 }, (_, i) => load(`${IMG}c-0${i + 1}.webp?v=${V}`))).then(a => { state.charSprites = a; });
  // 示範配置：從想放的位置往外找第一個放得下的地方
  DEMO.forEach(([id, x, y], n) => {
    const c = state.catalog.find(k => k.id === id);
    for (let r = 0; r < 4; r += .5) for (let a = 0; a < 16; a++) {
      const gx = Math.round(x + Math.cos(a / 16 * Math.PI * 2) * r - c.size / 2), gy = Math.round(y + Math.sin(a / 16 * Math.PI * 2) * r - c.size / 2), res = canPlaceAt(gx, gy, c.size);
      if (res) { state.buildings.push({ id: 'demo_' + n, catalogId: id, gx, gy, size: c.size, elevation: res.elevation }); return; }
    }
  });
  initAmbient(); regenDecorations(); initAgents(); resize();
  requestAnimationFrame(loop);
})();
