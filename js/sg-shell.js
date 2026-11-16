/* 漢威牧區｜外框與共用工具
 * - Header：照 DX 標準（深色、Logo、右邊只有 Superuser 的 🔐）。
 * - Header 下面：本站的 App 列（標題／問候、預覽身分、齒輪：深淺色、後台、登出）。
 * - 導覽：手機底部分頁列、電腦左側選單；依身分顯示不同分頁。
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
  const applyTheme = () => { const t = getTheme(); document.documentElement.classList.toggle('dark', t ? t === 'dark' : mq.matches); };
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

  // ---------- 導覽 ----------
  const ICONS = {
    world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    land: '<path d="M3 20 12 5l9 15z"/><path d="M9.5 20 12 15l2.5 5"/>',
    care: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    fellowship: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
    members: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>',
    me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.2-6 8-6s7 2 8 6"/>'
  };
  // 四個主分頁（總規格第四節）；團契、我的資料從世界／我的領地進入
  const TABS = [
    ['world', 'index.html', '世界', ['district', 'leader', 'member']],
    ['land', 'land.html', '我的領地', ['district', 'leader', 'member']],
    ['care', 'care.html', '牧養', ['district', 'leader']],
    ['members', 'members.html', '名冊', ['district', 'leader']]
  ].filter(t => t[3].includes(session.role));
  const icon = (k, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  const curTab = { fellowship: 'world', home: 'world', me: 'land' }[page] || page;
  const link = ([k, href, label], size) => `<a href="${href}"${k === curTab ? ' aria-current="page"' : ''}>${icon(k, size)}<span>${label}</span></a>`;
  const side = document.createElement('nav');
  side.className = 'sg-side'; side.setAttribute('aria-label', '主選單');
  side.innerHTML = TABS.map(t => link(t, 20)).join('');
  const bar = document.createElement('nav');
  bar.className = 'sg-tabbar'; bar.setAttribute('aria-label', '主選單');
  bar.innerHTML = TABS.map(t => link(t, 24)).join('');
  hd.after(side);
  document.body.append(bar);
  // 世界／我的領地：導覽放在地圖上（Islanders 式圓形按鈕），不占左側
  const mapBox = document.querySelector('.sg-world-map');
  if (mapBox) {
    document.body.classList.add('sg-mapnav');
    const hud = document.createElement('nav');
    hud.className = 'sg-hud'; hud.setAttribute('aria-label', '主選單');
    hud.innerHTML = TABS.map(([k, href, label]) => `<a href="${href}"${k === curTab ? ' aria-current="page"' : ''}><span class="o">${icon(k, 22)}</span><span>${label}</span></a>`).join('');
    mapBox.append(hud);
  }

  // ---------- App 列：標題、預覽身分、齒輪 ----------
  const appbar = $('sgAppbar');
  if (appbar) {
    appbar.insertAdjacentHTML('beforeend', `<div class="sg-appbar-tools">
      <button type="button" class="sg-demo" id="demoBtn" title="暫時的按鈕：切換身分預覽畫面，正式版會拿掉">🧪 預覽：${ROLE_LABEL[session.role]}</button>
      <button type="button" class="sg-gear" id="gearBtn" aria-label="設定" aria-haspopup="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>
    </div>`);
    const pop = document.createElement('div');
    pop.className = 'sg-pop hidden'; pop.id = 'sgPop'; pop.setAttribute('role', 'menu');
    document.body.appendChild(pop);
    const open = (btn, html) => {
      if (!pop.classList.contains('hidden') && pop.dataset.for === btn.id) { pop.classList.add('hidden'); return; }
      pop.innerHTML = html; pop.dataset.for = btn.id; pop.classList.remove('hidden');
      const r = btn.getBoundingClientRect();
      pop.style.top = (r.bottom + 6 + window.scrollY) + 'px';
      pop.style.left = Math.max(8, Math.min(r.right - pop.offsetWidth, window.innerWidth - pop.offsetWidth - 8)) + 'px';
    };
    $('gearBtn').addEventListener('click', e => {
      const t = getTheme();
      const seg = (v, l) => `<button type="button" data-theme="${v}" aria-pressed="${t === v}">${l}</button>`;
      open(e.currentTarget, `<div class="sg-pop-sec"><div class="sg-pop-lab">深淺色</div><div class="sg-seg">${seg('', '跟隨系統')}${seg('light', '淺色')}${seg('dark', '深色')}</div></div>
        ${SGU.isDistrict() ? '<a class="sg-pop-item" href="admin-settings.html">⚙️ 後台</a>' : ''}
        <button type="button" class="sg-pop-item" data-logout>↪ 登出</button>`);
    });
    $('demoBtn').addEventListener('click', e => {
      open(e.currentTarget, `<div class="sg-pop-sec"><div class="sg-pop-lab">切換預覽身分</div>
        ${DEMO.map(d => `<button type="button" class="sg-pop-item" data-demo="${d.personId}"${d.personId === session.personId ? ' aria-checked="true"' : ''}>${d.personId === session.personId ? '✓ ' : ''}${esc(d.label)}</button>`).join('')}
        <p class="sg-pop-note">這是暫時的按鈕，方便你看不同身分看到的畫面。正式版會拿掉，改成真正的登入。</p></div>`);
    });
    pop.addEventListener('click', e => {
      const th = e.target.closest('[data-theme]');
      if (th) { try { th.dataset.theme ? localStorage.setItem('sg_theme', th.dataset.theme) : localStorage.removeItem('sg_theme'); } catch (er) { /* */ } applyTheme(); pop.querySelectorAll('[data-theme]').forEach(b => b.setAttribute('aria-pressed', String(b === th))); return; }
      if (e.target.closest('[data-logout]')) { setSession(null); location.replace('login.html'); return; }
      const dm = e.target.closest('[data-demo]');
      if (dm) { const d = DEMO.find(x => x.personId === dm.dataset.demo); setSession({ personId: d.personId, role: d.role }); location.reload(); }
    });
    document.addEventListener('click', e => { if (!e.target.closest('#sgPop, #gearBtn, #demoBtn')) pop.classList.add('hidden'); });
  }
})();
