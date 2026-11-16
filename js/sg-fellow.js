/* 漢威牧區｜團契：代禱事項、QT 分享、見證、宣教旅程地圖、壽星 */
(async function () {
  const U = window.SGU, F = window.SGF, esc = U.esc, $ = U.$;
  let D = await F.load();
  await F.ensureBirthdays();
  // 小組 LINE 群組：最上面一顆大按鈕（連結由區長在後台設定）
  {
    const gs = U.isDistrict() ? D.groups.filter(g => g.active !== false) : [D.myGroup].filter(Boolean);
    const withUrl = gs.filter(g => g.lineUrl);
    $('lineBox').innerHTML = withUrl.map(g => `<a class="sg-line-btn" href="${esc(g.lineUrl)}" target="_blank" rel="noopener">💬 打開「${esc(g.name)}」LINE 群組</a>`).join('')
      + (withUrl.length < gs.length ? `<p class="sg-note" style="margin:0 0 8px">${gs.filter(g => !g.lineUrl).map(g => esc(g.name)).join('、')}還沒有設定 LINE 群組連結${U.isDistrict() ? '，到「設定 → 後台 → 小組」填上邀請連結。' : '，請區長在後台設定。'}</p>` : '')
      + '<p class="sg-note" style="margin:0 0 8px">想找某個人聊聊：點貼文上他的頭像（有綠點的）就會打開 LINE 私訊。</p>';
  }
  const SECS = [['prayer', '🙏 代禱事項'], ['qt', '📖 QT 分享'], ['testimony', '✨ 見證'], ['bday', '🎂 壽星']]   // 宣教旅程先拿掉;
  let sec = SECS.some(s => s[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'prayer';
  let gfilter = 'all';
  const nav = () => { $('secNav').innerHTML = SECS.map(([k, l]) => `<button type="button" data-sec="${k}" aria-pressed="${k === sec}">${l}</button>`).join(''); };
  $('secNav').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) { sec = b.dataset.sec; history.replaceState(null, '', '#' + sec); nav(); render(); } });
  const title = (t, sub) => `<h2 style="font-size:20px;font-weight:800;margin:0 0 4px">${t}</h2>${sub ? `<p class="sg-sub">${sub}</p>` : ''}`;
  const groupChips = () => {
    const opts = U.isDistrict() ? [['all', '全部小組'], ...D.groups.filter(g => g.active !== false).map(g => [g.id, g.name])] : [['all', '全部'], ['mine', (D.myGroup || {}).name || '我的小組']];
    return `<div class="sg-chipbar" id="gchips">${opts.map(([k, l]) => `<button type="button" data-gf="${k}" aria-pressed="${k === gfilter}">${esc(l)}</button>`).join('')}</div>`;
  };
  $('sec').addEventListener('click', e => { const b = e.target.closest('[data-gf]'); if (b) { gfilter = b.dataset.gf; render(); } });
  F.bind($('sec'));

  function postList(type) {
    return D.posts.filter(p => p.type === type && F.canSee(p))
      .filter(p => gfilter === 'all' ? true : gfilter === 'mine' ? p.groupId === D.me.groupId : p.groupId === gfilter)
      .sort((a, b) => U.ms(b.createdAt) - U.ms(a.createdAt));
  }
  async function reload() { D = await F.load(); render(); }

  function render() {
    if (sec === 'journey') return journey();
    if (sec === 'bday') return bday();
    const meta = { prayer: ['代禱事項', '各小組填自己的代禱事項；按「我為你禱告」讓對方知道有人在為他禱告。' + (U.isDistrict() ? '區長可以依小組篩選。' : '')],
      qt: ['QT 分享', '大家公開分享的靈修筆記。'], testimony: ['見證', '數算神的恩典，彼此激勵。'] }[sec];
    const list = postList(sec);
    $('sec').innerHTML = title(meta[0], meta[1]) + `<button type="button" class="sg-btn sg-btn-teal" data-new="${sec}" style="margin-bottom:12px">＋ ${sec === 'prayer' ? '新增代禱事項' : sec === 'qt' ? '分享 QT' : '分享見證'}</button>` + groupChips() +
      `<div class="sg-stack">${list.map(F.cardHtml).join('') || '<div class="sg-card sg-empty">還沒有內容</div>'}</div>`;
    $('sec').querySelector('[data-new]').addEventListener('click', e => F.compose(e.currentTarget.dataset.new, reload));
  }

  // ---------- 宣教旅程地圖 ----------
  let jgid = U.isDistrict() ? '' : D.me.groupId;
  function journey() {
    const J = window.SG_JOURNEY || [];
    const per = D.app.qtPerStep || 1;
    const year = U.today().slice(0, 4);
    const nG = jgid ? 1 : Math.max(1, D.groups.filter(g => g.active !== false).length);
    const steps = Math.floor(U.groupQt(D.daily, D.persons, jgid, year) / per / nG);
    const pos = U.journeyAt(steps);
    const seg = pos.next ? (steps - pos.city.at) / (pos.next.at - pos.city.at) : 0;
    const mx = pos.next ? pos.city.x + (pos.next.x - pos.city.x) * seg : pos.city.x, my = pos.next ? pos.city.y + (pos.next.y - pos.city.y) * seg : pos.city.y;
    const done = J.slice(0, pos.idx + 1).map(c => `${c.x},${c.y}`).concat(pos.next ? [`${mx},${my}`] : []).join(' ');
    const name = jgid ? (D.gmap[jgid] || {}).name : '牧區（各組加總）';
    const opts = U.isDistrict() ? [['', '牧區加總'], ...D.groups.filter(g => g.active !== false).map(g => [g.id, g.name])] : [];
    $('sec').innerHTML = title('宣教旅程', `跟著保羅的宣教旅程走。全組今年每累積 ${per} 次 QT 就前進一步（牧區是各組平均），抵達一座城就解鎖那座城的經文。沒有排名，大家一起往前走。`) +
      (opts.length ? `<div class="sg-chipbar" id="jchips">${opts.map(([k, l]) => `<button type="button" data-j="${k}" aria-pressed="${k === jgid}">${esc(l)}</button>`).join('')}</div>` : '') + `
      <section class="sg-card"><div class="sg-card-h">${esc(name)}・${year} 年<span class="sg-pill" style="margin-left:auto">已走 ${steps} 步</span></div>
        <div class="sg-card-b"><svg class="sg-map" viewBox="0 0 800 420" role="img" aria-label="宣教旅程地圖">
          <path d="M40 300 C 150 230, 260 330, 360 250 S 560 300, 640 250 S 760 330, 790 300 L 790 420 L 40 420 Z" fill="rgba(0,126,138,.08)"/>
          <path d="M40 60 C 200 20, 330 70, 470 40 S 700 90, 790 50 L 790 0 L 40 0 Z" fill="rgba(140,110,60,.10)"/>
          <polyline points="${J.map(c => `${c.x},${c.y}`).join(' ')}" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="3" stroke-dasharray="6 6"/>
          <polyline points="${done}" fill="none" stroke="#007E8A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
          ${J.map((c, i) => `<g><circle cx="${c.x}" cy="${c.y}" r="${i <= pos.idx ? 9 : 7}" fill="${i <= pos.idx ? '#007E8A' : '#fff'}" stroke="#007E8A" stroke-width="2.5"/>
            <text x="${c.x}" y="${c.y + (i % 2 ? -16 : 24)}" font-size="15" font-weight="700" text-anchor="middle" fill="currentColor" opacity="${i <= pos.idx ? 1 : .55}">${esc(c.name)}</text></g>`).join('')}
          <g transform="translate(${mx},${my})"><circle r="16" fill="#F59F00" opacity=".25"><animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite"/></circle><text y="7" font-size="22" text-anchor="middle">🚶</text></g>
        </svg>
        <div style="margin-top:10px;font-size:15px">目前在 <b style="color:var(--sg-teal-text)">${esc(pos.city.name)}</b>${pos.next ? `，再 <b>${pos.toNext}</b> 步到 ${esc(pos.next.name)}` : '，已經抵達羅馬！🎉'}</div></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">沿途的城市與經文</div>
        ${J.map((c, i) => i <= pos.idx ? `<div class="sg-item"><span class="sg-ic">📍</span><span class="sg-txt"><b>${esc(c.name)}</b><small style="color:var(--sg-text);font-size:14px;line-height:1.6">${esc(c.text)}<br><span style="color:var(--sg-teal-text);font-weight:700">${esc(c.ref)}</span></small></span></div>`
          : `<div class="sg-item" style="opacity:.55"><span class="sg-ic">🔒</span><span class="sg-txt">${esc(c.name)}<small>走到第 ${c.at} 步解鎖</small></span></div>`).join('')}</section>`;
    const jc = $('jchips'); if (jc) jc.addEventListener('click', e => { const b = e.target.closest('[data-j]'); if (b) { jgid = b.dataset.j; journey(); } });
  }

  // ---------- 壽星 ----------
  function bday() {
    const month = new Date().getMonth() + 1, md = U.today().slice(5);
    const list = D.persons.filter(p => p.birthday && +p.birthday.slice(5, 7) === month && p.status !== '已離開' && (U.isDistrict() || p.groupId === D.me.groupId || !p.groupId))
      .sort((a, b) => a.birthday.slice(8).localeCompare(b.birthday.slice(8)));
    $('sec').innerHTML = title(`${month} 月壽星`, '今天生日的人會亮起來，動態牆上也會出現生日貼文，可以送上祝福。') + `<section class="sg-card">
      ${list.map(p => { const today = p.birthday.slice(5) === md; return `<div class="sg-item"${today ? ' style="background:linear-gradient(90deg,rgba(245,159,0,.16),transparent)"' : ''}><span class="sg-bday" style="padding:0"><span class="${today ? 'today' : ''}" style="display:inline-flex"><span class="ring">${U.avatar(p, 40)}</span></span></span>
        <span class="sg-txt"><b>${esc(p.name)}</b>${today ? ' 🎉' : ''}<small>${U.md(p.birthday)}・${esc((D.gmap[p.groupId] || {}).name || '區長')}</small></span>
        ${today ? `<a class="sg-btn sg-btn-teal" href="index.html">送祝福</a>` : ''}</div>`; }).join('') || '<div class="sg-empty">這個月沒有壽星</div>'}</section>`;
  }

  nav(); render();
})();
