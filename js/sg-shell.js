/* 漢威牧區｜外框與共用工具
 * - Header：照 DX 標準（深色、Logo、右邊只有 Superuser 的 🔐）。
 * - 外框（學遊戲介面）：狀態列、左控制列（設定、牧養管理、組員名單、收藏、🧪測試）、右任務列、左下「我」、右下 世界地圖⇄我的領地、動態跑馬燈；手機動態用抽屜。
 * - 身分（靜態階段）：存在 localStorage sg_session；接 Firebase 後改成真正的登入。
 * 每頁：<body data-page="home|care|fellowship|members|me|admin" data-roles="district,leader,member">
 */
(function () {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const WD = ['日', '一', '二', '三', '四', '五', '六'];
  const ROLE_LABEL = { district: '區長', leader: '小組長', member: '組員' };

  // ---------- 深淺色 ----------
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const getTheme = () => { try { return localStorage.getItem('sg_theme') || ''; } catch (e) { return ''; } };
  const getDark = () => { try { return localStorage.getItem('sg_dark') || 'a'; } catch (e) { return 'a'; } };   // 深色候選：a 石板藍、b 暖灰、c 深海綠、o 原本
  const applyTheme = () => { const t = getTheme(); document.documentElement.classList.toggle('dark', t ? t === 'dark' : mq.matches); document.documentElement.dataset.dk = getDark(); };
  mq.addEventListener('change', applyTheme);
  applyTheme();

  // ---------- 身分 ----------
  const DEMO = [
    { personId: 'p_hanwei', role: 'district', label: '區長（漢威）' },
    { personId: 'p001', role: 'leader', label: '小組長（王建宇・建宇小組）' },
    { personId: 'p007', role: 'member', label: '組員（建宇小組）' }
  ];
  function getSession() { try { return JSON.parse(localStorage.getItem('sg_session') || 'null'); } catch (e) { return null; } }
  function setSession(s) { try { s ? localStorage.setItem('sg_session', JSON.stringify(s)) : localStorage.removeItem('sg_session'); } catch (e) { /* 無法記住 */ } }
  const page = document.body.dataset.page || '';
  const session = getSession();
  if (!session && page !== 'login' && page !== 'join') { location.replace('login.html'); return; }
  const allowed = (document.body.dataset.roles || 'district,leader,member').split(',');
  if (session && page !== 'login' && page !== 'join' && !allowed.includes(session.role)) { location.replace('index.html'); return; }

  // ---------- 共用工具 ----------
  const SGU = window.SGU = {
    $, esc, pad, iso, WD, ROLE_LABEL, session, DEMO,
    today: () => iso(new Date()),
    md: s => { const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return p ? `${+p[2]}/${+p[3]}` : ''; },
    mdw: s => { const p = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); if (!p) return ''; const d = new Date(+p[1], +p[2] - 1, +p[3]); return `${+p[2]}/${+p[3]}（${WD[d.getDay()]}）`; },
    ago(ms) {
      const s = (Date.now() - ms) / 1000;
      if (s < 60) return '剛剛'; if (s < 3600) return Math.floor(s / 60) + ' 分鐘前'; if (s < 86400) return Math.floor(s / 3600) + ' 小時前';
      if (s < 86400 * 7) return Math.floor(s / 86400) + ' 天前';
      const d = new Date(ms); return `${d.getMonth() + 1}/${d.getDate()}`;
    },
    ms: v => (v && typeof v.toMillis === 'function') ? v.toMillis() : (typeof v === 'number' ? v : 0),
    setSession, getSession,
    isDistrict: () => session && session.role === 'district',
    isLeader: () => session && session.role === 'leader',
    toast(msg, kind) { (window.SG && SG.toast) ? SG.toast(msg, kind) : alert(msg); },
    async all(coll) { const s = await db.collection(coll).get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    async one(coll, id) { const s = await db.collection(coll).doc(id).get(); return s.exists ? { id, ...s.data() } : null; },
    stamp: () => ({ updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: session ? session.personId : '' }),
    /** 小組本週（星期一～日）的聚會日期 */
    meetDate(group, offsetWeeks = 0) {
      const d = new Date(); const day = (d.getDay() + 6) % 7;   // 星期一＝0
      d.setDate(d.getDate() - day + ((((group && group.meetDay) ?? 6) + 6) % 7) + offsetWeeks * 7);
      return iso(d);
    },
    groupMeetText: g => g ? `每週${WD[g.meetDay ?? 6]} ${g.meetTime || ''}`.trim() : '',
    avatar(p, size = 40) {
      if (window.SG && SG.avatarHtml) return SG.avatarHtml(p || { name: '？' }, size);
      return `<span style="width:${size}px;height:${size}px;border-radius:50%;background:#007E8A;color:#fff;display:inline-flex;align-items:center;justify-content:center">${esc((p && p.name || '？')[0])}</span>`;
    },
    /** 底部滑出（手機）／置中（電腦）的對話框。回傳 dialog 元素。 */
    sheet(html, { onClose } = {}) {
      const dlg = document.createElement('dialog');
      dlg.className = 'sg-dialog';
      dlg.innerHTML = `<div class="sg-dialog-body">${html}</div>`;
      document.body.appendChild(dlg);
      dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-dlg-close]')) dlg.close(); });
      dlg.addEventListener('close', () => { dlg.remove(); if (onClose) onClose(); });
      dlg.showModal();
      return dlg;
    }
  };

  // ---------- 今日經文、任務、徽章、旅程（首頁、團契、我的共用） ----------
  SGU.verseOfDay = function (app) {
    const all = window.SG_VERSES || [];
    const list = (app && app.verses && app.verses.length ? app.verses : all.map(v => v.id)).map(id => all.find(v => v.id === id)).filter(Boolean);
    if (app && app.verseMode === 'fixed') return all.find(v => v.id === app.fixedVerse) || list[0];
    const d = new Date(); const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    return list[n % list.length];
  };
  SGU.dayDone = (day, tasks) => !!day && tasks.every(t => day[t.id]);
  /** 連續天數：恩典日＝每 7 天內可以漏 graceDays 天不中斷 */
  SGU.streak = function (days, tasks, grace = 1) {
    let n = 0, missed = [], d = new Date();
    if (!SGU.dayDone(days[iso(d)], tasks)) d.setDate(d.getDate() - 1);   // 今天還沒做完不算中斷
    for (let i = 0; i < 400; i++) {
      const k = iso(d);
      if (SGU.dayDone(days[k], tasks)) n++;
      else { missed = missed.filter(x => i - x < 7); if (missed.length >= grace) break; missed.push(i); }
      d.setDate(d.getDate() - 1);
    }
    return n;
  };
  /** 小組在某月（YYYY-MM）的 QT 總次數：只算總數，不看個人 */
  SGU.groupQt = function (daily, persons, gid, prefix) {
    const ids = new Set(persons.filter(p => !gid || p.groupId === gid).map(p => p.id));
    let n = 0;
    daily.forEach(d => { if (!ids.has(d.id)) return; Object.entries(d.days || {}).forEach(([k, v]) => { if ((!prefix || k.startsWith(prefix)) && v.qt) n++; }); });
    return n;
  };
  SGU.journeyAt = function (steps) {
    const J = window.SG_JOURNEY || [];
    let i = 0; while (i + 1 < J.length && steps >= J[i + 1].at) i++;
    return { idx: i, city: J[i], next: J[i + 1] || null, toNext: J[i + 1] ? J[i + 1].at - steps : 0 };
  };
  SGU.BADGES = [
    { id: 'first-qt', icon: '🌱', name: '第一次 QT' }, { id: 'streak7', icon: '🔥', name: '連續 7 天' }, { id: 'streak30', icon: '🏔️', name: '連續 30 天' },
    { id: 'bap', icon: '💧', name: '受洗' }, { id: 'c1', icon: '①', name: '完成 C1' }, { id: 'c2', icon: '②', name: '完成 C2' }, { id: 'c3', icon: '③', name: '完成 C3' },
    { id: 'c4', icon: '④', name: '完成 C4' }, { id: 'c5', icon: '⑤', name: '完成 C5' }, { id: 'testimony', icon: '✨', name: '第一次分享見證' },
    { id: 'pray50', icon: '🙏', name: '為人禱告 50 次' }, { id: 'giver', icon: '🎁', name: '送出第一份禮物' }, { id: 'cards10', icon: '📚', name: '收集 10 張經文卡' }
  ];
  SGU.badgesOf = function (person, daily, posts, courses, tasks) {
    const got = new Set();
    const days = (daily && daily.days) || {};
    if (Object.values(days).some(v => v.qt)) got.add('first-qt');
    const st = SGU.streak(days, tasks, 0);
    if (st >= 7) got.add('streak7'); if (st >= 30) got.add('streak30');
    const done = person.courses || {};
    if (done.bap) got.add('bap');
    (courses || []).filter(c => /^c\d$/.test(c.id)).forEach(c => { if (c.items.every(i => done[i.id])) got.add(c.id); });
    if (posts.some(p => p.type === 'testimony' && p.author === person.id)) got.add('testimony');
    if (posts.filter(p => (p.prayedBy || []).includes(person.id)).length >= 50) got.add('pray50');
    if (daily && daily.giftsSent > 0) got.add('giver');
    if (daily && new Set((daily.cards || []).map(c => c.id)).size >= 10) got.add('cards10');
    return got;
  };

  // 在 DX 的 App 框（iframe）裡開：不顯示自己的 Header（DX 已經有一條）
  try { if (window.self !== window.top) document.documentElement.classList.add('sg-embed'); } catch (e) { document.documentElement.classList.add('sg-embed'); }
  // ---------- Header（DX 標準） ----------
  const hd = document.createElement('header');
  hd.className = 'sg-hd';
  hd.innerHTML = `<a class="sg-logo" href="index.html">CLC Small Group</a><span style="flex:1"></span>
    <button type="button" class="sg-hd-btn" id="suKey" aria-label="Superuser 登入" title="Superuser 登入">🔐</button>`;
  document.body.prepend(hd);
  $('suKey').addEventListener('click', () => SGU.toast('🔐 是 Superuser（DX）用的登入，正式版會接 DX；組員不需要用到。'));
  if (page === 'login' || page === 'join') return;   // 登入頁、新朋友登記表：只有 Header

  // ---------- 內容頁（牧養管理、組員名單、我…）一律開在地圖上的面板裡 ----------
  // 面板＝地圖上的 iframe（網址加 ?panel=1）；直接開內容頁時，轉回地圖頁再打開面板，外框才會一致。
  const FILE = location.pathname.split('/').pop() || 'index.html';
  const MAPS = ['index.html', 'land.html'];
  const inPanel = new URLSearchParams(location.search).has('panel');
  const withPanel = u => { const [path, hash] = u.split('#'); return path + (path.includes('?') ? '&' : '?') + 'panel=1' + (hash ? '#' + hash : ''); };
  let parentPanel = null; try { parentPanel = window.parent !== window && window.parent.SGPanel; } catch (e) { /* */ }
  if (parentPanel && !inPanel) {   // 面板裡被程式換頁、少了 ?panel=1：地圖頁整頁換過去，其他補上參數
    if (MAPS.includes(FILE)) window.top.location.href = FILE + location.search + location.hash; else location.replace(withPanel(FILE + location.search + location.hash));
    return;
  }
  if (inPanel) {
    document.documentElement.classList.add('sg-panel');
    document.addEventListener('click', e => {   // 面板裡的連結：地圖頁整頁換過去；其他頁原地換（不留歷史，返回鍵才不會亂）
      const a = e.target.closest('a[href]'); if (!a || a.target) return;
      const h = a.getAttribute('href') || '', f = h.split(/[?#]/)[0];
      if (!/^[\w-]+\.html/.test(h)) return;
      e.preventDefault();
      if (MAPS.includes(f)) window.top.location.href = h; else location.replace(withPanel(h));
    });
    return;
  }
  if (page !== 'world' && page !== 'land') {
    let last = 'index.html'; try { last = sessionStorage.getItem('sg_lastmap') || last; } catch (e) { /* */ }
    location.replace(last + '#p=' + encodeURIComponent(FILE + location.search + location.hash)); return;
  }
  try { sessionStorage.setItem('sg_lastmap', FILE); } catch (e) { /* */ }

  // ---------- 外框（學遊戲介面，每頁位置相同） ----------
  // 狀態列＋活動（左上）／控制列（左）／任務列（右，只在地圖頁）／左下「我」／右下 世界地圖⇄我的領地／動態跑馬燈（底部中間）
  // 電腦（橫向且寬 ≥ 1024）：動態在右側欄；手機、直向：底部列＋可往上拉的抽屜。資料由 sg-frame.js 填入。
  const ICONS = {
    world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    land: '<path d="M3 20 12 5l9 15z"/><path d="M9.5 20 12 15l2.5 5"/>',
    care: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    members: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
    bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    flag: '<path d="M6 3v18"/><path d="M6 4h12v11l-6-3-6 3"/><path d="M9 7.5l3 1.6 3-1.6M9 10.5l3 1.6 3-1.6"/>'
  };
  const icon = (k, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  const isMap = page === 'world' || page === 'land';
  const lead = session.role !== 'member';
  document.body.classList.add('sg-frame'); if (isMap) document.body.classList.add('sg-mapnav');
  const host = document.querySelector('.sg-world-map') || document.body;
  const add = (cls, html, parent) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; (parent || host).append(d); return d; };
  // 狀態列（內容由 sg-frame.js 填）
  const status = add('sg-status', '<a class="sg-st-me" href="me.html" aria-label="我的個人頁"><span class="sg-st-av"></span></a><span id="sgStatus" class="sg-st-chips"></span>');
  if (!isMap) { const main = document.querySelector('main'); if (main) main.prepend(status); }
  // 控制列（左）
  const railBtn = (k, href, label, cur) => `<a class="sg-rb" href="${href}"${cur ? ' aria-current="page"' : ''}><span class="o">${icon(k, 20)}</span><span class="t">${label}</span></a>`;
  // 順序：小組、收藏、（小組長以上）牧養管理、設定、🧪測試
  const rail = add('sg-rail', `${railBtn('flag', 'fellowship.html', '小組', false)}${railBtn('bag', 'me.html#cards', '收藏', false)}
    ${lead ? railBtn('care', 'care.html', '牧養管理', false) : ''}
    <button type="button" class="sg-rb" id="gearBtn" aria-haspopup="true"><span class="o">${icon('gear', 20)}</span><span class="t">設定</span></button>`, isMap ? host : document.body);
  // 任務列（右，地圖頁）
  if (isMap) add('sg-taskcol', '', host).id = 'sgTasks';
  // 左下「我」、右下 世界地圖⇄我的領地、跑馬燈
  const toLand = page === 'world';
  const meBtn = `<a class="sg-corner sg-corner-me" href="me.html"${page === 'me' ? ' aria-current="page"' : ''}><span class="o" id="sgMeAv">${icon('members', 24)}</span><span class="t">我</span></a>`;
  const swBtn = `<a class="sg-corner sg-corner-sw" href="${toLand ? 'land.html' : 'index.html'}"><span class="o">${icon(toLand ? 'land' : 'world', 26)}</span><span class="t">${toLand ? '我的領地' : '世界地圖'}</span></a>`;
  const bar = add('sg-bottom', `${meBtn}<button type="button" class="sg-ticker" id="sgTicker" aria-label="最新動態${isMap ? '（往上拉打開）' : ''}"><span class="sg-grip" aria-hidden="true"></span><span id="sgTickerTxt">　</span></button>${swBtn}`, document.body);

  // ---------- 手機：動態抽屜（收合／半開／全開），只有拉底部列或抽屜把手才會動，地圖照常拖曳 ----------
  const drawer = document.querySelector('.sg-world-feed');
  const DESK = window.matchMedia('(min-width: 1024px) and (orientation: landscape)');
  if (drawer) {
    const STATES = ['closed', 'half', 'full'];
    let st = 'closed';
    const set = s => { st = s; drawer.dataset.sheet = s; drawer.style.transform = ''; };
    set('closed');
    const handles = [drawer.querySelector('.sg-grab'), $('sgTicker')].filter(Boolean);
    let drag = null;
    handles.forEach(h => {
      h.addEventListener('pointerdown', e => { if (DESK.matches) return; drag = { y: e.clientY, t: Date.now(), moved: false, base: drawer.getBoundingClientRect().top }; try { h.setPointerCapture(e.pointerId); } catch (er) { /* */ } });
      h.addEventListener('pointermove', e => {
        if (!drag) return; const dy = e.clientY - drag.y; if (Math.abs(dy) > 6) drag.moved = true;
        if (drag.moved) { drawer.classList.add('dragging'); drawer.style.transform = `translateY(${Math.max(0, drag.base + dy - drawer.offsetTop)}px)`; }
      });
      h.addEventListener('pointerup', e => {
        if (!drag) return; const dy = e.clientY - drag.y, moved = drag.moved; drag = null; drawer.classList.remove('dragging');
        if (!moved) { set(st === 'closed' ? 'half' : 'closed'); return; }   // 點一下：開／關
        const i = STATES.indexOf(st); set(STATES[Math.max(0, Math.min(2, i + (dy < -40 ? 1 : dy > 40 ? -1 : 0) * (Math.abs(dy) > 260 ? 2 : 1)))]);
      });
      h.addEventListener('pointercancel', () => { drag = null; drawer.classList.remove('dragging'); set(st); });
    });
    host.addEventListener('pointerdown', e => { if (!DESK.matches && st !== 'closed' && !e.target.closest('.sg-bottom, .sg-rail, .sg-taskcol, .sg-status')) set('closed'); });
  }
  if (!isMap && $('sgTicker')) $('sgTicker').addEventListener('click', () => { location.href = 'index.html'; });
  // 世界頁：問候與今日經文放到動態最上面；我的領地：標題拿掉（地圖上已經有）
  const appbar = $('sgAppbar');
  if (appbar && page === 'world' && drawer) drawer.insertBefore(appbar, drawer.querySelector('.sg-grab').nextSibling);
  if (appbar && page === 'land') appbar.classList.add('hidden');

  // ---------- 面板：開／關、上一頁、Esc、再按同一顆鈕關閉 ----------
  {
    let box = null, curUrl = '';
    const mark = u => document.querySelectorAll('.sg-rail a, .sg-corner-me').forEach(a => {
      const on = !!u && a.getAttribute('href') === u; if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    const frame = () => box && box.querySelector('iframe');
    function show(u) {
      if (!box) {
        box = document.createElement('div'); box.className = 'sg-panelbox';
        box.innerHTML = '<iframe title="內容"></iframe><button type="button" class="sg-panel-x" aria-label="關閉，回到地圖">✕</button>'
          + '<div class="sg-panel-foot"><button type="button" class="sg-panel-back" aria-label="返回"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button></div>';
        document.body.append(box);
        box.querySelector('.sg-panel-x').addEventListener('click', close);
        box.querySelector('.sg-panel-back').addEventListener('click', back);
        frame().src = withPanel(u);
      } else if (u !== curUrl) frame().contentWindow.location.replace(withPanel(u));   // 換面板不留歷史
      curUrl = u;
      if (drawer && !DESK.matches) drawer.dataset.sheet = 'closed';
      mark(u);
    }
    // 返回：面板裡的頁面有上一層（標題前的「‹」）就回上一層，否則關掉面板回地圖
    function back() {
      let up = null; try { up = frame().contentDocument.querySelector('.sg-appbar h1 a[href]'); } catch (e) { /* */ }
      if (up) frame().contentWindow.location.replace(withPanel(up.getAttribute('href'))); else close();
    }
    function hide() { if (box) { box.remove(); box = null; curUrl = ''; } mark(''); }
    const fromHash = () => { const m = /^#p=(.+)$/.exec(location.hash); return m ? decodeURIComponent(m[1]) : ''; };
    window.SGPanel = {
      open(u) { if (u === curUrl) { close(); return; } const had = !!box; show(u); history[had ? 'replaceState' : 'pushState']({ panel: u }, '', '#p=' + encodeURIComponent(u)); },
      close
    };
    function close() { if (history.state && history.state.panel) history.back(); else { hide(); history.replaceState(null, '', location.pathname + location.search); } }
    addEventListener('popstate', () => { const u = fromHash(); if (u) show(u); else hide(); });
    if (fromHash()) { const u = fromHash(); history.replaceState(null, '', location.pathname + location.search); history.pushState({ panel: u }, '', '#p=' + encodeURIComponent(u)); show(u); }   // 上一頁＝回地圖
    addEventListener('keydown', e => { if (e.key === 'Escape' && box) close(); });
    // 地圖頁上點到內容頁的連結（控制列、「我」、彈出視窗、動態）：開面板，不換頁
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey) return;
      const h = a.getAttribute('href') || '', f = h.split(/[?#]/)[0];
      if (!/^[\w-]+\.html/.test(h) || MAPS.includes(f) || f === 'login.html') return;
      e.preventDefault(); const d = a.closest('dialog'); if (d) d.close();
      window.SGPanel.open(h);
    });
  }

  // ---------- 設定（齒輪）：深淺色、後台、登出 ----------
  {
    const pop = document.createElement('div');
    pop.className = 'sg-pop hidden'; pop.id = 'sgPop'; pop.setAttribute('role', 'menu');
    document.body.appendChild(pop);
    const open = (btn, html) => {
      if (!pop.classList.contains('hidden') && pop.dataset.for === btn.id) { pop.classList.add('hidden'); return; }
      pop.innerHTML = html; pop.dataset.for = btn.id; pop.classList.remove('hidden');
      const r = btn.getBoundingClientRect();
      pop.style.left = Math.min(r.right + 8, window.innerWidth - pop.offsetWidth - 8) + 'px';
      pop.style.top = (Math.max(8, Math.min(r.top, window.innerHeight - pop.offsetHeight - 8)) + window.scrollY) + 'px';
    };
    $('gearBtn').addEventListener('click', e => {
      const t = getTheme();
      const seg = (v, l) => `<button type="button" data-theme="${v}" aria-pressed="${t === v}">${l}</button>`;
      open(e.currentTarget, `<div class="sg-pop-sec"><div class="sg-pop-lab">深淺色</div><div class="sg-seg">${seg('', '跟隨系統')}${seg('light', '淺色')}${seg('dark', '深色')}</div></div>
        ${SGU.isDistrict() ? '<a class="sg-pop-item" href="admin-settings.html">⚙️ 後台</a>' : ''}
        <button type="button" class="sg-pop-item" data-logout>↪ 登出</button>`);
    });
    pop.addEventListener('click', e => {
      const th = e.target.closest('[data-theme]');
      if (th) { try { th.dataset.theme ? localStorage.setItem('sg_theme', th.dataset.theme) : localStorage.removeItem('sg_theme'); } catch (er) { /* */ } applyTheme(); pop.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b === th))); return; }
      if (e.target.closest('[data-logout]')) { setSession(null); location.replace('login.html'); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('#sgPop, #gearBtn')) pop.classList.add('hidden'); });
  }

  // ---------- 浮動測試鈕（暫時，正式版拿掉）：身分、頁面、切換身分、回登入頁、材質色票 ----------
  {
    const fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'sg-rb sg-testfab'; fab.innerHTML = '<span class="o">🧪</span><span class="t">測試</span>'; fab.setAttribute('aria-label', '測試面板（暫時）');
    const panel = document.createElement('div');
    panel.className = 'sg-testpanel hidden'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', '測試面板');
    document.body.append(panel); rail.append(fab);
    const draw = () => {
      const me = DEMO.find(d => d.personId === session.personId);
      const file = location.pathname.split('/').pop() || 'index.html';
      const title = (document.title.split('|')[1] || document.title).trim();
      const T = window.SGTerrain;
      const sw = T ? Object.values(T.PALETTE).map(m => `<div class="sg-swatch"><span class="n">${esc(m.name)}</span><span class="u">${esc(m.use)}</span>
          <span class="cs">${m.c.map(c => `<span style="background:${c}" title="${c}" data-copy="${c}">${c.slice(1)}</span>`).join('')}</span></div>`).join('')
        + `<div class="sg-swatch"><span class="n">建材</span><span class="u">${T.BUILD.map(b => b[0]).join('／')}</span><span class="cs">${T.BUILD.map(b => `<span style="background:${b[1]}" title="${b[0]} ${b[1]}" data-copy="${b[1]}"></span>`).join('')}</span></div>`
        : '<p class="sg-note">色票在「世界」「我的領地」頁才會顯示。</p>';
      panel.innerHTML = `<h3>現在</h3><div class="now">身分：<b>${esc(me ? me.label : ROLE_LABEL[session.role])}</b><br>頁面：<b>${esc(title)}</b>（${esc(file)}）</div>
        <h3>切換身分</h3><div class="roles">${DEMO.map(d => `<button type="button" data-demo="${d.personId}" aria-pressed="${d.personId === session.personId}">${ROLE_LABEL[d.role]}</button>`).join('')}</div>
        <h3>深色模式（候選，切到深色才看得出來）</h3><div class="roles">${[['a', '石板藍'], ['b', '暖灰'], ['c', '深海綠'], ['o', '原本']].map(([k, l]) => `<button type="button" data-dk="${k}" aria-pressed="${getDark() === k}">${l}</button>`).join('')}</div>
        <h3>登入</h3><button type="button" class="go" data-login>↪ 回登入頁</button>
        <h3>材質色票（亮面／暗面／陰影；點色塊複製色碼）</h3>${sw}`;
    };
    fab.addEventListener('click', () => { if (panel.classList.contains('hidden')) draw(); panel.classList.toggle('hidden'); });
    panel.addEventListener('click', e => {
      const dm = e.target.closest('[data-demo]');
      if (dm) { const d = DEMO.find(x => x.personId === dm.dataset.demo); setSession({ personId: d.personId, role: d.role }); location.reload(); return; }
      if (e.target.closest('[data-login]')) { setSession(null); location.replace('login.html'); return; }
      const dk = e.target.closest('[data-dk]');
      if (dk) { try { localStorage.setItem('sg_dark', dk.dataset.dk); } catch (er) { /* */ } applyTheme(); document.querySelectorAll('.sg-panelbox iframe').forEach(f => { try { f.contentDocument.documentElement.dataset.dk = dk.dataset.dk; } catch (er) { /* */ } }); draw(); return; }
      const cp = e.target.closest('[data-copy]');
      if (cp && navigator.clipboard) navigator.clipboard.writeText(cp.dataset.copy).then(() => { cp.textContent = '✓'; setTimeout(draw, 700); }).catch(() => {});
    });
    document.addEventListener('click', e => { if (!e.target.closest('.sg-testpanel, .sg-testfab')) panel.classList.add('hidden'); });
  }
})();
