/* 漢威牧區｜外框的資料：狀態列（連續天數、讀經、柴火）、活動（壽星、近期活動）、任務列（今日、小組、牧區）、動態跑馬燈。
 * 每頁都載入（要先有 sg-shell.js、sg-feed.js）。點了用彈出視窗（U.sheet），不換頁。 */
(async function () {
  const U = window.SGU, F = window.SGF; if (!U || !F || !U.session || !document.getElementById('sgStatus')) return;   // 面板裡不用
  const esc = U.esc, $ = U.$;
  let D = await F.load();
  const first = n => (n || '').length >= 3 ? n.slice(1) : n;
  const scopeGroups = () => U.isDistrict() ? D.groups.filter(g => g.active !== false) : [D.myGroup].filter(Boolean);

  // ---------- 狀態列 ----------
  function status() {
    const days = D.myDaily.days || {}, st = U.streak(days, D.tasks, D.app.graceDays ?? 1);
    const read = Object.values(D.myDaily.books || {}).filter(Boolean).length;
    const fire = U.groupQt(D.daily, D.persons, U.isDistrict() ? '' : D.me.groupId, U.today().slice(0, 7));
    const md = U.today().slice(5), month = new Date().getMonth() + 1;
    const stars = bdays(), todayStar = stars.some(p => p.birthday.slice(5) === md);
    const evs = events();
    document.querySelectorAll('.sg-st-av').forEach(e => { e.innerHTML = U.avatar(D.me, 34); });
    const meAv = $('sgMeAv'); if (meAv) meAv.innerHTML = U.avatar(D.me, 44);
    $('sgStatus').innerHTML = `<span class="sg-st-name">${esc(first(D.me.name))}</span>
      <span class="sg-chip" title="連續天數">🔥 ${st}</span><span class="sg-chip" title="聖經 66 卷讀完幾卷">📖 ${read}/66</span><span class="sg-chip" title="小組營地柴火（本月全組 QT 次數）">🪵 ${fire}</span>
      <button type="button" class="sg-chip sg-ev${todayStar ? ' hot' : ''}" data-pop="bday" title="${month} 月壽星">🎂 ${stars.length}</button>
      <button type="button" class="sg-chip sg-ev" data-pop="events" title="近期活動">📅 ${evs.length}</button>`;
  }
  function bdays() {
    const month = new Date().getMonth() + 1;
    return D.persons.filter(p => p.birthday && +p.birthday.slice(5, 7) === month && p.status !== '已離開' && (U.isDistrict() || p.groupId === D.me.groupId || !p.groupId))
      .sort((a, b) => a.birthday.slice(8).localeCompare(b.birthday.slice(8)));
  }
  const events = () => D.events.filter(e => e.date >= U.today() && (e.scope !== 'group' || U.isDistrict() || e.groupId === D.me.groupId)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);

  // ---------- 任務列（地圖頁） ----------
  function taskcol() {
    const box = $('sgTasks'); if (!box) return;
    const day = (D.myDaily.days || {})[U.today()] || {}, n = D.tasks.filter(t => day[t.id]).length, done = U.dayDone(day, D.tasks);
    const btn = (k, ic, label, badge, dot) => `<button type="button" class="sg-rb" data-pop="${k}"><span class="o">${ic}${dot ? '<i class="dot"></i>' : ''}</span><span class="t">${label}</span>${badge ? `<span class="b">${badge}</span>` : ''}</button>`;
    box.innerHTML = btn('today', '☀️', '今日任務', D.tasks.length ? (done ? '✓' : `${n}/${D.tasks.length}`) : '', !done && D.tasks.length)
      + btn('group', '🏕️', '小組任務', '', false) + btn('district', '🏛️', '牧區任務', '', false);
  }

  // ---------- 彈出視窗 ----------
  const head = (t, sub) => `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><h2 style="font-size:19px;font-weight:800;margin:0;flex:1">${t}</h2>${sub || ''}<button type="button" class="sg-gear" data-dlg-close aria-label="關閉">✕</button></div>`;
  const POPS = {
    today() {
      const day = (D.myDaily.days || {})[U.today()] || {}, done = U.dayDone(day, D.tasks), st = U.streak(D.myDaily.days || {}, D.tasks, D.app.graceDays ?? 1);
      return head('今日任務', `<span class="sg-pill">${done ? '✓ 完成' : `${D.tasks.filter(t => day[t.id]).length} / ${D.tasks.length}`}</span>`)
        + `<div class="sg-tasks">${D.tasks.map(t => `<button type="button" class="sg-task" data-task="${t.id}" aria-pressed="${!!day[t.id]}"><span class="chk">${day[t.id] ? '✓' : ''}</span>${esc(t.icon || '')} ${esc(t.name)}</button>`).join('')}</div>
        <div class="sg-streak">🔥 連續 <b style="color:var(--sg-text)">${st}</b> 天${D.feat.cards !== false ? '・全部完成可以抽一張經文卡' : ''}</div>
        ${done ? '<p class="sg-note" style="margin:6px 0 0">今天就這樣，去過好你的一天吧 ☀️</p>' : ''}
        <p class="sg-note" style="margin:6px 0 0">🔒 每日任務只有你自己看得到，區長、小組長只看得到全組的總數。</p>`;
    },
    async group() {
      const gid = U.isDistrict() ? '' : D.me.groupId, ym = U.today().slice(0, 7), nG = Math.max(1, scopeGroups().length);
      const month = U.groupQt(D.daily, D.persons, gid, ym), total = U.groupQt(D.daily, D.persons, gid, U.today().slice(0, 4));
      const goal = (D.app.monthGoal || 120) * (gid ? 1 : nG);
      const pos = U.journeyAt(Math.floor(total / (D.app.qtPerStep || 1) / (gid ? 1 : nG)));
      let roll = '';
      if (U.session.role !== 'member') {
        const att = await U.all('attendance');
        roll = scopeGroups().map(g => {
          const thisW = U.meetDate(g, 0), lastW = U.meetDate(g, -1), target = thisW <= U.today() ? thisW : lastW;
          const rec = att.find(a => a.groupId === g.id && a.date === target);
          return `<a class="sg-item" href="members.html#roll:${g.id}:${target}"><span class="sg-ic">✅</span><span class="sg-txt">${esc(g.name)}・${U.mdw(target)}<small>本週點名</small></span>${rec ? `<span class="sg-pill">✓ ${(rec.present || []).length + (rec.guests || 0)} 人</span>` : '<span class="sg-pill" style="background:rgba(245,159,0,.16);color:#B35C00">尚未點名</span>'}</a>`;
        }).join('');
        const scope = new Set(scopeGroups().map(g => g.id));
        const care = D.persons.filter(p => scope.has(p.groupId) && (p.status === '很久沒來' || p.status === '新加入')).slice(0, 6);
        if (care.length) roll += `<div class="sg-lab" style="margin:12px 0 6px">需要關心</div><div style="display:flex;flex-wrap:wrap;gap:6px">${care.map(p => `<span class="sg-badge" style="font-size:13px">${esc(p.name)}・${esc(p.status)}</span>`).join('')}</div>`;
      }
      return head(`🏕️ ${gid ? esc(F.groupName(gid)) : '各小組'}的任務`)
        + `<div style="font-size:15px;margin-bottom:8px">營地今年走到 <b style="color:var(--sg-teal-text)">${esc(pos.city.name)}</b>${pos.next ? `，再 ${pos.toNext} 次 QT 到 ${esc(pos.next.name)}` : '，抵達終點！'}</div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--sg-muted);margin-bottom:4px"><span>🪵 本月柴火（全組 QT）</span><span>${month} / ${goal}</span></div><div class="sg-progress"><span style="width:${Math.min(100, month / goal * 100)}%"></span></div>
        <p class="sg-note" style="margin:8px 0 12px">全組的 QT 都算進來，一起往前走；柴火達標就解鎖一次線下聚會。</p>${roll}`;
    },
    district() {
      const month = U.groupQt(D.daily, D.persons, '', U.today().slice(0, 7)), goal = (D.app.monthGoal || 120) * Math.max(1, D.groups.filter(g => g.active !== false).length);
      return head('🏛️ 牧區任務') + `<div class="sg-item" style="padding-left:0"><span class="sg-ic">📍</span><span class="sg-txt">帕弗・城市任務 3/4<small>保羅第一次宣教路線（示意）</small></span></div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--sg-muted);margin:8px 0 4px"><span>牧區本月 QT</span><span>${month} / ${goal}</span></div><div class="sg-progress"><span style="width:${Math.min(100, month / goal * 100)}%"></span></div>
        <p class="sg-note" style="margin:8px 0 0">城市任務完成才能前往下一城（P2 開始）。</p>`;
    },
    bday() {
      const md = U.today().slice(5), stars = bdays();
      return head(`🎂 ${new Date().getMonth() + 1} 月壽星`, `<span class="sg-note">${stars.length} 位</span>`) + (stars.length ? `<div class="sg-bday">${stars.map(p => `<button type="button" class="${p.birthday.slice(5) === md ? 'today' : ''}" data-bday="${p.id}"><span class="ring">${U.avatar(p, 52)}</span>${esc(first(p.name))}<small>${p.birthday.slice(5) === md ? '今天！' : U.md(p.birthday)}</small></button>`).join('')}</div>` : '<div class="sg-empty">這個月沒有壽星</div>');
    },
    events() {
      const evs = events();
      return head('📅 近期活動') + (evs.length ? evs.map(e => `<div class="sg-item" style="padding-left:0"><span class="sg-ic" style="font-size:13px;font-weight:800">${U.md(e.date)}</span><span class="sg-txt">${esc(e.title)}<small>${U.mdw(e.date)}・${esc(e.place || '')}</small></span></div>`).join('') : '<div class="sg-empty">近期沒有活動</div>');
    }
  };
  let dlg = null, cur = '';
  async function openPop(k) { cur = k; const html = await POPS[k](); if (dlg && dlg.open) dlg.querySelector('.sg-dialog-body').innerHTML = html; else dlg = U.sheet(html, { onClose: () => { dlg = null; } }); }
  document.addEventListener('click', async e => {
    const p = e.target.closest('[data-pop]'); if (p) { openPop(p.dataset.pop); return; }
    const t = e.target.closest('.sg-dialog [data-task]');
    if (t) { const drawn = await F.setTask(t.dataset.task, t.getAttribute('aria-pressed') !== 'true'); D = await F.load(); status(); taskcol(); openPop(cur); if (drawn) F.showCard(drawn); return; }
    const b = e.target.closest('.sg-dialog [data-bday]');
    if (b) {
      const post = document.querySelector(`[data-post="bday_${b.dataset.bday}_${U.today()}"]`);
      if (post) { dlg.close(); post.scrollIntoView({ behavior: 'smooth', block: 'center' }); const c = post.querySelector('.sg-comments'); if (c) c.classList.remove('hidden'); }
      else { const q = D.pmap[b.dataset.bday]; U.toast(`${q.name} 的生日是 ${U.md(q.birthday)}`); }
    }
  });

  // ---------- 動態跑馬燈（底部中間） ----------
  function ticker() {
    const el = $('sgTickerTxt'); if (!el) return;
    const list = D.posts.filter(F.canSee).sort((a, b) => U.ms(b.createdAt) - U.ms(a.createdAt)).slice(0, 6)
      .map(p => { const a = D.pmap[p.author]; return `<b>${esc(a ? first(a.name) : '漢威牧區')}</b>：${esc((p.text || (F.TYPES[p.type] || {}).label || '').replace(/\s+/g, ' '))}`; });
    if (!list.length) { el.textContent = '還沒有動態'; return; }
    let i = 0; el.innerHTML = list[0];
    setInterval(() => { i = (i + 1) % list.length; el.innerHTML = list[i]; }, 4500);
  }

  status(); taskcol(); ticker();
})();
