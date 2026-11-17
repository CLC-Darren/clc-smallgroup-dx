/* 漢威牧區｜我的領地（個人）：今日任務、聖經主線（66 卷）、全副軍裝、我的收藏。全部只有自己看得到。 */
(async function () {
  const U = window.SGU, F = window.SGF, esc = U.esc, $ = U.$;
  let D = await F.load();
  const books = () => D.myDaily.books || {};
  const REG = window.SG_REGIONS || [], BOOKS = window.SG_BOOKS || [], ARMOR = window.SG_ARMOR || [];
  let openRegion = '';

  // ---------- 今日任務 ----------
  function tasks() {
    const day = (D.myDaily.days || {})[U.today()] || {};
    const done = U.dayDone(day, D.tasks), st = U.streak(D.myDaily.days || {}, D.tasks, D.app.graceDays ?? 1);
    $('landTasks').innerHTML = `<div class="sg-card-h">今日任務<span class="sg-pill" style="margin-left:6px">${done ? '✓ 完成' : `${D.tasks.filter(t => day[t.id]).length} / ${D.tasks.length}`}</span><a class="sg-more" href="me.html#tasks">每日紀錄 ›</a></div>
      <div class="sg-card-b"><div class="sg-tasks">${D.tasks.map(t => `<button type="button" class="sg-task" data-task="${t.id}" aria-pressed="${!!day[t.id]}"><span class="chk">${day[t.id] ? '✓' : ''}</span>${esc(t.icon || '')} ${esc(t.name)}</button>`).join('')}</div>
      <div class="sg-streak">🔥 連續 <b style="color:var(--sg-text)">${st}</b> 天・全部完成可以抽一張經文卡</div>
      ${done ? '<p class="sg-note" style="margin:6px 0 0">今天就這樣，去過好你的一天吧 ☀️</p>' : ''}
      <p class="sg-note" style="margin:6px 0 0">🔒 這一頁只有你自己看得到。</p></div>`;
  }
  $('landTasks').addEventListener('click', async e => {
    const b = e.target.closest('[data-task]'); if (!b) return;
    const drawn = await F.setTask(b.dataset.task, b.getAttribute('aria-pressed') !== 'true');
    tasks(); if (drawn) F.showCard(drawn);
  });

  // ---------- 全副軍裝（完成裝備課程得著、升級；和生命建造無關） ----------
  function armor() {
    const lv = a => window.SG_armorLv(D, a.id), got = ARMOR.filter(a => lv(a) > 0).length;
    $('landArmor').innerHTML = `<div class="sg-card-h">🛡️ 全副軍裝<span class="sg-note" style="margin-left:auto">${got} / ${ARMOR.length}</span></div>
      <div class="sg-card-b"><div class="sg-armor">${ARMOR.map(a => { const n = lv(a); return `<div class="sg-armor-i${n ? '' : ' off'}" title="${esc(a.topic)}：${esc(a.lessons.join('、'))}"><span class="b">${a.icon}</span><b>${esc(a.name)}</b><small>${n ? `Lv${n}・${esc(a.topic)}` : `學習「${esc(a.topic)}」來得著`}</small></div>`; }).join('')}</div>
      <p class="sg-note" style="margin:8px 0 0">以弗所書 6:13–17。每件裝備有幾堂小課，學完就能穿上，繼續學就能升級（課程之後開放）。</p></div>`;
  }

  // ---------- 聖經主線 ----------
  function bible() {
    const b = books(), read = BOOKS.filter(x => b[x.id]).length;
    const center = b.rev ? '新耶路撒冷' : (b['1ki'] ? '所羅門聖殿' : '會幕');
    $('landBible').innerHTML = `<div class="sg-card-h">📖 聖經主線<span class="sg-note" style="margin-left:auto">${read} / 66 卷</span></div>
      <div class="sg-card-b"><div class="sg-progress" style="margin-bottom:8px"><span style="width:${read / 66 * 100}%"></span></div>
      <p class="sg-note" style="margin:0 0 8px">中心建築：<b style="color:var(--sg-text)">${center}</b>（會幕 → 所羅門聖殿 → 新耶路撒冷）。每讀完一次，那卷的代表物就升一級。</p></div>
      ${REG.map(r => {
        const list = BOOKS.filter(x => x.region === r.id), k = list.filter(x => b[x.id]).length, open = openRegion === r.id;
        return `<div class="sg-region"><button type="button" class="sg-item" data-region="${r.id}" style="width:100%;background:none;border-left:0;border-right:0;border-bottom:0;cursor:pointer;text-align:left">
          <span class="sg-txt"><b>${esc(r.name)}</b><small>${k} / ${list.length} 卷</small></span><span class="sg-mini-bar"><span style="width:${k / list.length * 100}%"></span></span><span>${open ? '▾' : '▸'}</span></button>
          ${open ? `<div class="sg-books">${list.map(x => { const lv = b[x.id] || 0; return `<button type="button" class="sg-book${lv ? '' : ' off'}" data-book="${x.id}"><span class="i">${x.kind === 'npc' ? '🧔' : x.kind === 'letter' ? '✉️' : x.kind === 'end' ? '🏙️' : '🏛️'}</span><b>${esc(x.name)}</b><small>${lv ? `${esc(x.rep)}・Lv${lv}` : '還沒讀'}</small></button>`; }).join('')}</div>` : ''}</div>`;
      }).join('')}`;
  }
  $('landBible').addEventListener('click', e => {
    const r = e.target.closest('[data-region]'); if (r) { openRegion = openRegion === r.dataset.region ? '' : r.dataset.region; bible(); return; }
    const bk = e.target.closest('[data-book]'); if (!bk) return;
    const x = BOOKS.find(y => y.id === bk.dataset.book), lv = books()[x.id] || 0;
    const kindText = { npc: '人物：讀這卷書就是去拜訪他', letter: '使徒的信：收進你的書房，也連到世界地圖上的城市', end: '終點：新耶路撒冷', place: '建築／地點' }[x.kind];
    const dlg = U.sheet(`<h3>${esc(x.name)}</h3><p class="sg-note" style="margin:0 0 12px">${esc(kindText)}</p>
      <div class="sg-card" style="text-align:center;padding:18px"><div style="font-size:44px">${x.kind === 'npc' ? '🧔' : x.kind === 'letter' ? '✉️' : x.kind === 'end' ? '🏙️' : '🏛️'}</div>
        <div style="font-size:18px;font-weight:800;margin-top:6px">${esc(x.rep)}</div><div class="sg-note">${lv ? `Lv ${lv}・讀完 ${lv} 次` : '還沒蓋起來'}</div>
        <div class="sg-note" style="margin-top:6px">（示意圖示；正式版是繪製的 Q 版／低多邊形元件）</div></div>
      <p class="sg-note" style="margin-top:10px">讀完整卷就按一下。每年重讀讀完，等級再加一。深度任務（金句、小測驗、感想）之後加入。</p>
      <div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">關閉</button><button type="button" class="sg-btn sg-btn-teal" id="readDone" style="flex:2">✓ 我讀完${lv ? '一次了' : '了'}</button></div>`);
    dlg.querySelector('#readDone').addEventListener('click', async () => {
      D.myDaily.books = { ...books(), [x.id]: lv + 1 };
      await db.collection('daily').doc(U.session.personId).set({ ...D.myDaily }, { merge: true });
      if (!lv) await db.collection('posts').add({ type: 'milestone', author: U.session.personId, groupId: D.me.groupId || '', scope: 'group', badge: 'book', text: `讀完了${x.name}，蓋好了「${x.rep}」🎉`,
        reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      dlg.close(); U.toast(lv ? `${x.rep} 升到 Lv ${lv + 1}` : `蓋好了「${x.rep}」，已通知你的小組 🎉`); openRegion = x.region; bible();
    });
  });

  $('meAv').innerHTML = U.avatar(D.me, 44);
  $('meName').textContent = D.me.name || '';
  $('meSub').textContent = `${(D.myGroup || {}).name || '漢威牧區'}・${U.ROLE_LABEL[U.session.role]}`;
  tasks(); armor(); bible();
})();
