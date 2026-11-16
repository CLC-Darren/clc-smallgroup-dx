/* 漢威牧區｜世界地圖頁的動態：問候＋今日經文、發文、動態牆（今日任務、點名、壽星、活動改在外框的彈出視窗，見 sg-frame.js） */
(async function () {
  const U = window.SGU, F = window.SGF, esc = U.esc, $ = U.$;
  let D = await F.load();
  await F.ensureBirthdays();
  let filter = 'all';

  // ---------- 問候 ----------
  const first = n => (n || '').length >= 3 ? n.slice(1) : n;
  $('hello').textContent = `Hello，${first(D.me.name)}`;
  const v = U.verseOfDay(D.app);
  if (v) $('verse').innerHTML = `${esc(v.text)}<b>${esc(v.ref)}</b>`;
  $('meAvatar').innerHTML = U.avatar(D.me, 40);

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
  async function reload() { D = await F.load(); renderFeed(); }
  document.querySelector('main').addEventListener('click', e => {
    const c = e.target.closest('[data-compose]'); if (!c) return;
    if (c.dataset.compose === 'gift') F.gift(null, reload); else F.compose(c.dataset.compose, reload);
  });

  renderFilter(); renderFeed();
})();
