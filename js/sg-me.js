/* 漢威牧區｜我的：每日紀錄（月曆）、經文卡冊、徽章、收到的禮物、我的資料。全部只有自己看得到。 */
(async function () {
  const U = window.SGU, F = window.SGF, esc = U.esc, $ = U.$;
  let D = await F.load();
  const SECS = [['tasks', '📅 每日紀錄'], ['cards', '📚 經文卡冊'], ['badges', '🏅 徽章'], ['gifts', '🎁 收到的禮物'], ['profile', '👤 我的資料']];
  let sec = SECS.some(s => s[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'tasks';
  let monthOff = 0;
  const nav = () => { $('secNav').innerHTML = SECS.map(([k, l]) => `<button type="button" data-sec="${k}" aria-pressed="${k === sec}">${l}</button>`).join(''); };
  $('secNav').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) { sec = b.dataset.sec; history.replaceState(null, '', '#' + sec); nav(); render(); } });
  const title = (t, sub) => `<h2 style="font-size:20px;font-weight:800;margin:0 0 4px">${t}</h2>${sub ? `<p class="sg-sub">${sub}</p>` : ''}`;
  const lock = '<p class="sg-note" style="margin:0 0 12px">🔒 這一頁只有你自己看得到。區長、小組長只看得到全組的總數。</p>';
  const render = () => ({ tasks, cards, badges, gifts, profile })[sec]();

  // ---------- 每日紀錄 ----------
  function tasks() {
    const days = D.myDaily.days || {}, T = D.tasks;
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + monthOff);
    const y = base.getFullYear(), m = base.getMonth(), n = new Date(y, m + 1, 0).getDate(), lead = (new Date(y, m, 1).getDay() + 6) % 7;
    let full = 0, cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="wd"></span>';
    for (let d = 1; d <= n; d++) {
      const k = `${y}-${U.pad(m + 1)}-${U.pad(d)}`, v = days[k] || {}, cnt = T.filter(t => v[t.id]).length;
      if (cnt === T.length) full++;
      cells += `<span class="${cnt === T.length ? 'full' : cnt ? 'half' : ''}${k === U.today() ? ' today' : ''}" title="${k}">${d}</span>`;
    }
    const qtYear = Object.entries(days).filter(([k, v]) => k.startsWith(String(y)) && v.qt).length;
    const today = days[U.today()] || {};
    $('sec').innerHTML = title('每日紀錄', '每天完成 QT 和禱告，月曆就會亮起來。') + lock + `
      <section class="sg-card"><div class="sg-card-h">今天</div><div class="sg-card-b"><div class="sg-tasks">${T.map(t => `<button type="button" class="sg-task" data-task="${t.id}" aria-pressed="${!!today[t.id]}"><span class="chk">${today[t.id] ? '✓' : ''}</span>${esc(t.icon || '')} ${esc(t.name)}</button>`).join('')}</div></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-b" style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center;gap:8px;padding-top:14px">
        <div><div style="font-size:26px;font-weight:800;color:var(--sg-teal-text)">${U.streak(days, T, D.app.graceDays ?? 1)}</div><div class="sg-note">🔥 連續天數</div></div>
        <div><div style="font-size:26px;font-weight:800">${full}</div><div class="sg-note">本月全部完成</div></div>
        <div><div style="font-size:26px;font-weight:800">${qtYear}</div><div class="sg-note">${y} 年 QT 次數</div></div></div>
        <p class="sg-note" style="margin:0 14px 12px">恩典日：每 7 天裡可以漏 ${D.app.graceDays ?? 1} 天，連續紀錄不會中斷。</p></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h"><button type="button" class="sg-btn" data-mo="-1" style="min-height:30px">‹</button><span style="flex:1;text-align:center">${y} 年 ${m + 1} 月</span><button type="button" class="sg-btn" data-mo="1" style="min-height:30px"${monthOff >= 0 ? ' disabled' : ''}>›</button></div>
        <div class="sg-card-b"><div class="sg-cal">${['一', '二', '三', '四', '五', '六', '日'].map(w => `<span class="wd">${w}</span>`).join('')}${cells}</div>
        <div style="display:flex;gap:14px;font-size:12px;color:var(--sg-muted);margin-top:10px"><span>■ <span style="color:#007E8A">全部完成</span></span><span>■ <span style="color:rgba(0,126,138,.5)">完成一部分</span></span></div></div></section>`;
    $('sec').querySelectorAll('[data-mo]').forEach(b => b.addEventListener('click', () => { monthOff += +b.dataset.mo; tasks(); }));
    $('sec').querySelectorAll('[data-task]').forEach(b => b.addEventListener('click', async () => {
      const drawn = await F.setTask(b.dataset.task, b.getAttribute('aria-pressed') !== 'true'); tasks(); if (drawn) F.showCard(drawn);
    }));
  }

  // ---------- 經文卡冊 ----------
  function cards() {
    const have = new Map(); (D.myDaily.cards || []).forEach(c => have.set(c.id, (have.get(c.id) || 0) + 1));
    const all = window.SG_VERSES || [];
    $('sec').innerHTML = title('經文卡冊', `每天任務全部完成就抽一張。已收集 ${have.size} / ${all.length} 張。集滿一個系列會得到徽章。`) + lock +
      `<button type="button" class="sg-btn sg-btn-teal" id="giftBtn" style="margin-bottom:12px">🎁 送一張給組員</button>` +
      (window.SG_SERIES || []).map(s => {
        const list = all.filter(v => v.series === s.name), got = list.filter(v => have.has(v.id)).length;
        return `<section class="sg-card" style="margin-bottom:12px"><div class="sg-card-h"><span style="width:12px;height:12px;border-radius:4px;background:${s.color}"></span>${esc(s.name)}系列<span class="sg-note" style="margin-left:auto">${got} / ${list.length}${got === list.length ? ' 🏅' : ''}</span></div>
          <div class="sg-card-b"><div class="sg-cardgrid">${list.map(v => have.has(v.id) ? `<button type="button" class="sg-mini" data-card="${v.id}" style="background:${s.color}"><span>${esc(v.ref)}</span><span class="n">${have.get(v.id) > 1 ? '×' + have.get(v.id) : ''}</span></button>` : `<div class="sg-mini locked"><span>？？？</span><span class="n">還沒抽到</span></div>`).join('')}</div></div></section>`;
      }).join('');
    $('giftBtn').addEventListener('click', () => F.gift(null, async () => { D = await F.load(); cards(); }));
    $('sec').querySelectorAll('[data-card]').forEach(b => b.addEventListener('click', () => {
      const v = D.verse(b.dataset.card);
      const dlg = U.sheet(`<div class="sg-vcard" style="background:${D.series(v.series).color}"><span class="s">${esc(v.series)}系列</span><div class="t">${esc(v.text)}</div><span class="r">${esc(v.ref)}</span></div>
        <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">關閉</button><button type="button" class="sg-btn sg-btn-teal" id="g1" style="flex:1">🎁 送給組員</button></div>`);
      dlg.querySelector('#g1').addEventListener('click', () => { dlg.close(); F.gift(v.id, async () => { D = await F.load(); cards(); }); });
    }));
  }

  // ---------- 徽章 ----------
  function badges() {
    const got = U.badgesOf(D.me, D.myDaily, D.posts, D.lists.courses, D.tasks);
    $('sec').innerHTML = title('徽章', `已得到 ${got.size} / ${U.BADGES.length} 個。只有你和你自己知道 😊`) + lock +
      `<section class="sg-card"><div class="sg-card-b" style="padding-top:16px"><div class="sg-badges">${U.BADGES.map(b => `<div class="sg-badge-i${got.has(b.id) ? '' : ' off'}"><span class="b">${b.icon}</span>${esc(b.name)}</div>`).join('')}</div></div></section>`;
  }

  // ---------- 收到的禮物 ----------
  function gifts() {
    const list = (D.myDaily.received || []).slice().reverse();
    $('sec').innerHTML = title('收到的禮物', '組員送給你的經文卡') + `<div class="sg-stack">${list.map(g => { const v = D.verse(g.card) || {}, f = D.pmap[g.from] || {}; return `<section class="sg-card"><div class="sg-card-b" style="padding-top:12px">
      <div class="sg-post-h">${U.avatar(f, 36)}<div><div class="who">${esc(f.name || '')}</div><div class="meta">${U.md(g.at)}${g.text ? '・' + esc(g.text) : ''}</div></div></div>
      <div class="sg-vcard" style="background:${D.series(v.series).color};margin-top:10px;min-height:0"><span class="s">${esc(v.series || '')}系列</span><div class="t">${esc(v.text || '')}</div><span class="r">${esc(v.ref || '')}</span></div></div></section>`; }).join('') || '<div class="sg-card sg-empty">還沒有收到禮物。你也可以先送一張給組員 🎁</div>'}</div>`;
  }

  // ---------- 我的資料 ----------
  function profile() {
    const p = D.me, g = D.myGroup, cats = D.lists.courses || [], done = p.courses || {};
    const items = cats.flatMap(c => c.items), n = items.filter(i => done[i.id]).length;
    const row = (l, v) => v ? `<div class="sg-item"><span class="sg-txt"><small style="margin:0 0 2px">${l}</small>${esc(v)}</span></div>` : '';
    $('sec').innerHTML = title('我的資料', '要修改資料，請告訴你的小組長。') + `
      <section class="sg-card"><div class="sg-card-b" style="display:flex;align-items:center;gap:14px;padding-top:16px">${U.avatar(p, 64)}<div><div style="font-size:20px;font-weight:800">${esc(p.name)}</div><div class="sg-note">${esc(g ? g.name : '漢威牧區')}・${esc(U.ROLE_LABEL[U.session.role])}</div></div></div>
        ${row('小組聚會', g ? U.groupMeetText(g) : '')}${row('手機', p.mobile)}${row('Email', p.email)}${row('LINE ID', p.lineId)}${row('生日', p.birthday ? U.md(p.birthday) : '')}${row('目前服事', (p.ministries || []).join('、'))}
        ${g && g.lineUrl ? `<a class="sg-item" href="${esc(g.lineUrl)}" target="_blank" rel="noopener"><span class="sg-ic">💬</span><span class="sg-txt">開啟小組 LINE 群組</span>›</a>` : ''}</section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">生命建造進度<span class="sg-pill" style="margin-left:auto">${n} / ${items.length}</span></div><div class="sg-card-b">
        <div class="sg-progress" style="margin-bottom:12px"><span style="width:${items.length ? n / items.length * 100 : 0}%"></span></div>
        ${cats.map(c => { const k = c.items.filter(i => done[i.id]).length; return `<div style="display:flex;justify-content:space-between;font-size:14px;padding:6px 0;border-top:1px solid var(--sg-line)"><span>${esc(c.title)}</span><b style="color:${k === c.items.length ? 'var(--sg-teal-text)' : 'var(--sg-muted)'}">${k === c.items.length ? '✓ 完成' : `${k} / ${c.items.length}`}</b></div>`; }).join('')}
      </div></section>`;
  }

  nav(); render();
})();
