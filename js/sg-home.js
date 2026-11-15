/* 漢威牧區｜首頁：問候＋今日經文、今日任務、本週點名（小組長以上）、壽星、小組旅程、活動、動態牆 */
(async function () {
  const U = window.SGU, F = window.SGF, esc = U.esc, $ = U.$;
  let D = await F.load();
  await F.ensureBirthdays();
  let filter = 'all';
  const desk = window.matchMedia('(min-width: 1024px)');

  // ---------- 問候 ----------
  const first = n => (n || '').length >= 3 ? n.slice(1) : n;
  $('hello').textContent = `Hello，${first(D.me.name)}`;
  const v = U.verseOfDay(D.app);
  if (v) $('verse').innerHTML = `${esc(v.text)}<b>${esc(v.ref)}</b>`;
  $('meAvatar').innerHTML = U.avatar(D.me, 40);

  // ---------- 今日任務（只有自己看得到） ----------
  function renderTasks() {
    if (D.feat.tasks === false || !D.tasks.length) return;
    const day = (D.myDaily.days || {})[U.today()] || {};
    const st = U.streak(D.myDaily.days || {}, D.tasks, D.app.graceDays ?? 1);
    const done = U.dayDone(day, D.tasks);
    $('taskCard').classList.remove('hidden');
    $('taskCard').innerHTML = `<div class="sg-card-h">今日任務<span class="sg-pill" style="margin-left:6px">${done ? '✓ 完成' : `${D.tasks.filter(t => day[t.id]).length} / ${D.tasks.length}`}</span><a class="sg-more" href="me.html">我的紀錄 ›</a></div>
      <div class="sg-card-b"><div class="sg-tasks">${D.tasks.map(t => `<button type="button" class="sg-task" data-task="${t.id}" aria-pressed="${!!day[t.id]}"><span class="chk">${day[t.id] ? '✓' : ''}</span>${esc(t.icon || '')} ${esc(t.name)}</button>`).join('')}</div>
      <div class="sg-streak">🔥 連續 <b style="color:var(--sg-text)">${st}</b> 天${D.feat.cards !== false ? '・全部完成可以抽一張經文卡' : ''}</div>
      <p class="sg-note" style="margin:6px 0 0">🔒 每日任務只有你自己看得到，區長、小組長只看得到全組的總數。</p></div>`;
  }
  $('taskCard').addEventListener('click', async e => {
    const b = e.target.closest('[data-task]'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    const drawn = await F.setTask(b.dataset.task, on);
    renderTasks(); renderSide();
    if (drawn) F.showCard(drawn);
  });

  // ---------- 本週點名、需要關懷（小組長以上） ----------
  async function renderLead() {
    if (U.session.role === 'member') return;
    const att = await U.all('attendance');
    const groups = U.isDistrict() ? D.groups.filter(g => g.active !== false) : [D.myGroup].filter(Boolean);
    const rows = groups.map(g => {
      const thisW = U.meetDate(g, 0), lastW = U.meetDate(g, -1), today = U.today();
      const recThis = att.find(a => a.groupId === g.id && a.date === thisW), recLast = att.find(a => a.groupId === g.id && a.date === lastW);
      const target = thisW <= today ? thisW : lastW, rec = thisW <= today ? recThis : recLast;
      const st = rec ? `<span class="sg-pill">✓ 已點名 ${(rec.present || []).length + (rec.guests || 0)} 人</span>` : '<span class="sg-pill" style="background:rgba(245,159,0,.16);color:#B35C00">尚未點名</span>';
      return `<a class="sg-item" href="care.html#roll:${g.id}:${target}"><span class="sg-ic">✅</span><span class="sg-txt">${esc(g.name)}・${U.mdw(target)} ${esc(g.meetTime || '')}<small>本週聚會 ${U.mdw(thisW)}</small></span>${st}</a>`;
    }).join('');
    const scope = new Set(groups.map(g => g.id));
    const care = D.persons.filter(p => scope.has(p.groupId) && (p.status === '很久沒來' || p.status === '新加入')).slice(0, 4);
    $('leadCard').classList.remove('hidden');
    $('leadCard').innerHTML = `<div class="sg-card-h">本週點名<a class="sg-more" href="care.html">牧養 ›</a></div>${rows}
      ${care.length ? `<div class="sg-card-h" style="border-top:1px solid var(--sg-line);padding-top:12px">需要關心<a class="sg-more" href="members.html">名冊 ›</a></div>
      <div class="sg-card-b" style="display:flex;flex-wrap:wrap;gap:6px">${care.map(p => `<span class="sg-badge" style="font-size:13px">${esc(p.name)}・${esc(p.status)}</span>`).join('')}</div>` : ''}`;
  }

  // ---------- 側欄：壽星、小組旅程、近期活動 ----------
  function renderSide() {
    const month = new Date().getMonth() + 1, md = U.today().slice(5);
    const stars = D.persons.filter(p => p.birthday && +p.birthday.slice(5, 7) === month && p.status !== '已離開' && (U.isDistrict() || p.groupId === D.me.groupId || !p.groupId))
      .sort((a, b) => a.birthday.slice(8).localeCompare(b.birthday.slice(8)));
    const bday = `<section class="sg-card"><div class="sg-card-h">🎂 ${month} 月壽星<span class="sg-note" style="margin-left:auto">${stars.length} 位</span></div>
      <div class="sg-card-b">${stars.length ? `<div class="sg-bday">${stars.map(p => `<button type="button" class="${p.birthday.slice(5) === md ? 'today' : ''}" data-bday="${p.id}"><span class="ring">${U.avatar(p, 52)}</span>${esc(p.name.length >= 3 ? p.name.slice(1) : p.name)}<small>${p.birthday.slice(5) === md ? '今天！' : U.md(p.birthday)}</small></button>`).join('')}</div>` : '<div class="sg-empty">這個月沒有壽星</div>'}</div></section>`;
    let journey = '';
    if (D.feat.journey !== false || D.feat.goal !== false) {
      const gid = U.isDistrict() ? '' : D.me.groupId;
      const ym = U.today().slice(0, 7);
      const month = U.groupQt(D.daily, D.persons, gid, ym), total = U.groupQt(D.daily, D.persons, gid, U.today().slice(0, 4));
      const goal = (D.app.monthGoal || 120) * (gid ? 1 : D.groups.filter(g => g.active !== false).length);
      const pos = U.journeyAt(Math.floor(total / (D.app.qtPerStep || 1) / (gid ? 1 : Math.max(1, D.groups.filter(g => g.active !== false).length))));
      journey = `<section class="sg-card"><div class="sg-card-h">🚶 ${gid ? esc(F.groupName(gid)) : '牧區'}的旅程<a class="sg-more" href="fellowship.html#journey">看地圖 ›</a></div><div class="sg-card-b">
        ${D.feat.journey !== false ? `<div style="font-size:15px;margin-bottom:8px">今年走到 <b style="color:var(--sg-teal-text)">${esc(pos.city.name)}</b>${pos.next ? `，再 ${pos.toNext} 次 QT 到 ${esc(pos.next.name)}` : '，抵達終點！'}</div>` : ''}
        ${D.feat.goal !== false ? `<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--sg-muted);margin-bottom:4px"><span>本月 QT 目標</span><span>${month} / ${goal}</span></div><div class="sg-progress"><span style="width:${Math.min(100, month / goal * 100)}%"></span></div>` : ''}
        <p class="sg-note" style="margin:8px 0 0">全組的 QT 都算進來，一起往前走。</p></div></section>`;
    }
    const evs = D.events.filter(e => e.date >= U.today() && (e.scope !== 'group' || U.isDistrict() || e.groupId === D.me.groupId)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
    const events = `<section class="sg-card"><div class="sg-card-h">📅 近期活動</div>${evs.length ? evs.map(e => `<div class="sg-item"><span class="sg-ic" style="font-size:13px;font-weight:800;flex-direction:column;line-height:1">${U.md(e.date)}</span><span class="sg-txt">${esc(e.title)}<small>${U.mdw(e.date)}・${esc(e.place || '')}</small></span></div>`).join('') : '<div class="sg-empty">近期沒有活動</div>'}</section>`;
    const html = bday + journey + events;
    $('sideCol').innerHTML = desk.matches ? html : '';
    $('sideSlotMobile').innerHTML = desk.matches ? '' : bday + journey;
    if (!desk.matches) $('sideCol').innerHTML = events;
  }
  desk.addEventListener('change', renderSide);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-bday]'); if (!b) return;
    const el = document.querySelector(`[data-post="bday_${b.dataset.bday}_${U.today()}"]`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.querySelector('.sg-comments').classList.remove('hidden'); }
    else { const p = D.pmap[b.dataset.bday]; U.toast(`${p.name} 的生日是 ${U.md(p.birthday)}`); }
  });

  // ---------- 動態牆 ----------
  function renderFilter() {
    const opts = U.isDistrict() ? [['all', '全部'], ['district', '牧區公開'], ...D.groups.filter(g => g.active !== false).map(g => [g.id, g.name])]
      : [['all', '全部'], ['mine', D.myGroup ? D.myGroup.name : '我的小組'], ['district', '牧區公開']];
    $('feedFilter').innerHTML = opts.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${esc(l)}</button>`).join('');
  }
  $('feedFilter').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filter = b.dataset.f; renderFilter(); renderFeed(); } });
  function renderFeed() {
    const list = D.posts.filter(F.canSee).filter(p => filter === 'all' ? true : filter === 'district' ? (p.scope === 'district' || !p.groupId) : filter === 'mine' ? p.groupId === D.me.groupId : p.groupId === filter)
      .sort((a, b) => U.ms(b.createdAt) - U.ms(a.createdAt));
    $('feed').innerHTML = list.length ? list.map(F.cardHtml).join('') : '<div class="sg-card sg-empty">還沒有動態，來發第一則吧！</div>';
  }
  F.bind($('feed'));
  async function reload() { D = await F.load(); renderTasks(); renderSide(); renderFeed(); }
  document.querySelector('main').addEventListener('click', e => {
    const c = e.target.closest('[data-compose]'); if (!c) return;
    if (c.dataset.compose === 'gift') F.gift(null, reload); else F.compose(c.dataset.compose, reload);
  });

  renderTasks(); renderLead(); renderSide(); renderFilter(); renderFeed();
})();
