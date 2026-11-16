/* 漢威牧區｜組員名單的附加功能：新朋友提醒（最上面）＋每週點名
 * 新朋友：登記表（join.html）送來的資料先進 intakes（沒登入的人只能寫這裡，個資名單不開放外人寫入），
 *   這裡按「加入名單」就變成組員（狀態「新加入」）；之後的狀況寫在個人資料的備註。狀態「新加入」的人列在「需要關懷」。
 * 每週點名（併在組員名單裡）
 * 不改組員名單本身（sg-roster.js）：名單畫好之後，在每個名字前面加一格打勾，名單上方加一條點名列
 *（日期、這週是、訪客人數、儲存）。資料格式與原本牧養的點名相同：attendance/{小組id_日期}。
 * 網址 members.html#roll:小組id:日期 → 直接切到那個小組、那一天。 */
(async function () {
  const U = window.SGU, esc = U.esc, me = U.session;
  if (!U || !me || document.body.dataset.mode !== 'members') return;
  const SPECIAL = ['', '聯合主日', '特會', '安息月', '其他'];
  const [groups, mine] = await Promise.all([U.all('groups'), U.one('persons', me.personId)]);
  let persons = await U.all('persons');
  const gmap = Object.fromEntries(groups.map(g => [g.id, g]));
  const myGroups = groups.filter(g => g.active !== false && (U.isDistrict() || g.id === (mine || {}).groupId));
  let st = { gid: '', date: '', present: new Set(), special: '', guests: 0, rec: null, dirty: false, recs: [] };

  // ---------- 點名列（放在名單上方） ----------
  const bar = document.createElement('section');
  bar.className = 'sg-rollbar'; bar.id = 'rollBar';
  const anchor = document.getElementById('deskWrap');
  anchor.parentNode.insertBefore(bar, anchor);
  const nf = document.createElement('section');
  nf.className = 'sg-rollbar sg-newbar'; nf.id = 'newBar';
  anchor.parentNode.insertBefore(nf, bar);
  const inScope = gid => U.isDistrict() ? true : myGroups.some(g => g.id === gid);

  // ---------- 新朋友 ----------
  async function newFriends() {
    const intakes = (await U.all('intakes')).filter(x => !x.personId && (inScope(x.groupId) || (U.isDistrict() && !x.groupId)));
    const care = persons.filter(p => p.status === '新加入' && inScope(p.groupId));
    nf.innerHTML = `<div class="sg-roll-row"><div class="sg-roll-h">🌱 新朋友</div>
        ${care.length ? `<span class="sg-note">需要關懷：</span>${care.map(p => `<button type="button" class="sg-nf-chip" data-nf-find="${esc(p.name)}">${esc(p.name)}</button>`).join('')}` : '<span class="sg-note">目前沒有需要關懷的新朋友</span>'}</div>
      ${intakes.length ? `<div class="sg-roll-row"><span class="sg-note">登記表新送來 ${intakes.length} 位：</span>${intakes.map(x => `<span class="sg-nf-in"><b>${esc(x.name)}</b>${x.groupId && gmap[x.groupId] ? `・${esc(gmap[x.groupId].name)}` : ''}<button type="button" class="sg-btn sg-btn-teal" data-nf-join="${esc(x.id)}">加入名單</button></span>`).join('')}</div>` : ''}
      <p class="sg-note" style="margin:0">狀態是「新加入」的人會列在這裡；有什麼狀況寫在他的個人資料「備註」。</p>`;
    nf.dataset.n = intakes.length;
    nf._intakes = intakes;
  }
  nf.addEventListener('click', async e => {
    const f = e.target.closest('[data-nf-find]');
    if (f) { const s = document.querySelector('[data-filter="status"]'); if (s && [...s.options].some(o => o.value === '新加入')) { s.value = '新加入'; s.dispatchEvent(new Event('change', { bubbles: true })); } return; }
    const j = e.target.closest('[data-nf-join]'); if (!j) return;
    const x = nf._intakes.find(i => i.id === j.dataset.nfJoin); if (!x || !confirm(`把「${x.name}」加入組員名單？`)) return;
    const arr = v => Array.isArray(v) ? v.join('、') : (v || '');
    const note = ['新朋友登記表', x.refName ? `介紹人：${x.refName}${x.refRelation ? `（${x.refRelation}）` : ''}` : '', arr(x.faith) ? `信仰：${arr(x.faith)}` : '', arr(x.intent) ? `希望：${arr(x.intent)}` : '', x.note ? `代禱：${x.note}` : ''].filter(Boolean).join('\n');
    const gid = x.groupId || (myGroups.length === 1 ? myGroups[0].id : '');
    const ref = await db.collection('persons').add({ name: x.name, gender: x.gender || '', birthday: x.birthday || '', mobile: x.mobile || '', phone: x.phone || '', address: x.address || '',
      groupId: gid, status: '新加入', note, source: 'intake', ...(x.photoThumb ? { photoThumb: x.photoThumb } : {}), createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    await db.collection('intakes').doc(x.id).update({ personId: ref.id, joinedAt: firebase.firestore.FieldValue.serverTimestamp() });
    U.toast(`已把 ${x.name} 加入組員名單`);
    persons = await U.all('persons'); newFriends(); if (st.gid === gid) load(st.gid, st.date);
  });
  newFriends();
  const groupSel = () => document.querySelector('[data-filter="group"]');
  const people = () => persons.filter(p => p.groupId === st.gid && p.status !== '已離開');

  async function load(gid, date) {
    st.gid = gid; const g = gmap[gid];
    if (!g) { draw(); decorate(); return; }
    const today = U.today();
    st.date = date || (U.meetDate(g, 0) <= today ? U.meetDate(g, 0) : U.meetDate(g, -1));
    st.recs = (await U.all('attendance')).filter(a => a.groupId === gid).sort((a, b) => b.date.localeCompare(a.date));
    st.rec = st.recs.find(a => a.date === st.date) || null;
    st.present = new Set(st.rec ? st.rec.present : people().map(p => p.id));   // 還沒點名：預設全部有來，把沒來的點掉
    st.special = st.rec ? st.rec.special || '' : ''; st.guests = st.rec ? st.rec.guests || 0 : 0; st.dirty = false;
    draw(); decorate();
  }
  function draw() {
    const g = gmap[st.gid];
    if (!g) { bar.innerHTML = `<div class="sg-roll-h">✅ 每週點名</div><p class="sg-note" style="margin:0">請先在上面的「小組」選一個小組，名字前面就會出現點名的打勾格。</p>`; return; }
    const H1 = +st.date.slice(5, 7) <= 6, yr = st.date.slice(0, 4);
    const inHalf = st.recs.filter(r => !r.special && r.date.slice(0, 4) === yr && ((+r.date.slice(5, 7) <= 6) === H1));
    const avg = inHalf.length ? (inHalf.reduce((s, r) => s + r.present.length + (r.guests || 0), 0) / inHalf.length).toFixed(1) : '—';
    bar.innerHTML = `<div class="sg-roll-row">
        <div class="sg-roll-h">✅ 點名・${esc(g.name)}</div>
        <div class="sg-roll-date"><button type="button" class="sg-btn" data-week="-1" aria-label="上一週">‹</button>
          <span><b>${U.mdw(st.date)}</b> ${esc(g.meetTime || '')}</span>
          <button type="button" class="sg-btn" data-week="1" aria-label="下一週"${st.date >= U.meetDate(g, 0) ? ' disabled' : ''}>›</button></div>
        <span class="sg-note">${st.rec ? '已點名' : '還沒點名（預設全部有來，把沒來的點掉）'}・${yr} ${H1 ? '上' : '下'}半年週平均 ${avg}</span></div>
      <div class="sg-roll-row">
        <div class="sg-seg" id="rollSpecial">${SPECIAL.map(s => `<button type="button" data-sp="${s}" aria-pressed="${st.special === s}">${s || '一般小組'}</button>`).join('')}</div>
        <label class="sg-roll-guest">新朋友／訪客 <input class="sg-in" id="rollGuests" type="number" min="0" max="50" value="${st.guests}"></label>
        <button type="button" class="sg-btn sg-btn-teal" id="rollSave">儲存點名（<span id="rollCount">${st.present.size}</span> 位${st.guests ? `＋訪客 ${st.guests}` : ''}）</button></div>`;
  }
  bar.addEventListener('click', async e => {
    const w = e.target.closest('[data-week]');
    if (w) { if (st.dirty && !confirm('這週的點名還沒儲存，要放棄嗎？')) return; const d = new Date(st.date); d.setDate(d.getDate() + 7 * w.dataset.week); load(st.gid, U.iso(d)); return; }
    const sp = e.target.closest('[data-sp]'); if (sp) { st.special = sp.dataset.sp; st.dirty = true; draw(); return; }
    if (e.target.closest('#rollSave')) {
      await db.collection('attendance').doc(st.gid + '_' + st.date).set({ groupId: st.gid, date: st.date, present: [...st.present], guests: st.guests, special: st.special, by: me.personId, at: firebase.firestore.FieldValue.serverTimestamp() });
      U.toast(`已儲存 ${U.mdw(st.date)} 點名`); load(st.gid, st.date);
    }
  });
  bar.addEventListener('input', e => { if (e.target.id === 'rollGuests') { st.guests = Math.max(0, +e.target.value || 0); st.dirty = true; const b = document.getElementById('rollSave'); if (b) b.innerHTML = `儲存點名（<span id="rollCount">${st.present.size}</span> 位${st.guests ? `＋訪客 ${st.guests}` : ''}）`; } });

  // ---------- 名字前面的打勾格（名單每次重畫後補上） ----------
  const chk = id => { const p = persons.find(x => x.id === id); return `<button type="button" class="roll-chk" data-roll="${esc(id)}" aria-pressed="${st.present.has(id)}" aria-label="點名：${esc(p ? p.name : '')}">✓</button>`; };
  const inGroup = id => { const p = persons.find(x => x.id === id); return !!p && p.groupId === st.gid && p.status !== '已離開'; };
  function decorate() {
    const table = document.querySelector('#deskWrap table');
    if (table && !table.querySelector('col.roll-col')) {
      table.querySelector('colgroup').insertAdjacentHTML('afterbegin', '<col class="roll-col" style="width:56px">');
      table.querySelector('thead tr').insertAdjacentHTML('afterbegin', '<th class="roll-th">到</th>');
    }
    document.querySelectorAll('#tbody tr[data-id]').forEach(tr => {
      let td = tr.querySelector('td.roll-td'); if (!td) { td = document.createElement('td'); td.className = 'roll-td'; tr.prepend(td); }
      td.innerHTML = gmap[st.gid] && inGroup(tr.dataset.id) ? chk(tr.dataset.id) : '';
    });
    document.querySelectorAll('#cards .m-card').forEach(c => {
      const id = (c.querySelector('[data-open]') || {}).dataset ? c.querySelector('[data-open]').dataset.open : '';
      const old = c.querySelector('.roll-chk'); if (old) old.remove();
      if (gmap[st.gid] && inGroup(id)) c.insertAdjacentHTML('afterbegin', chk(id));
    });
  }
  // 先接住點擊，名單不會因為按打勾而打開個人資料
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-roll]'); if (!b) return;
    e.stopPropagation(); e.preventDefault();
    const id = b.dataset.roll; st.present.has(id) ? st.present.delete(id) : st.present.add(id); st.dirty = true;
    document.querySelectorAll(`[data-roll="${CSS.escape(id)}"]`).forEach(x => x.setAttribute('aria-pressed', String(st.present.has(id))));
    const c = document.getElementById('rollCount'); if (c) c.textContent = st.present.size;
  }, true);
  const mo = new MutationObserver(() => decorate());
  ['tbody', 'cards'].forEach(id => { const el = document.getElementById(id); if (el) mo.observe(el, { childList: true }); });

  // ---------- 跟著名單的「小組」篩選走 ----------
  const pickFromFilter = () => {
    const v = groupSel() ? groupSel().value : 'all';
    const gid = myGroups.some(g => g.id === v) ? v : (myGroups.length === 1 ? myGroups[0].id : '');
    if (gid !== st.gid) load(gid);
  };
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.filter === 'group') setTimeout(pickFromFilter, 0); });
  document.addEventListener('click', e => { if (e.target.closest('#colMenu')) setTimeout(pickFromFilter, 0); });   // 電腦版表頭的小組選單
  const h = /^#roll:([^:]+)(?::(\d{4}-\d{2}-\d{2}))?/.exec(location.hash);
  if (h && gmap[h[1]]) {
    const setSel = (n) => { const s = groupSel(); if (s && [...s.options].some(o => o.value === h[1])) { s.value = h[1]; s.dispatchEvent(new Event('change', { bubbles: true })); } else if (n) setTimeout(() => setSel(n - 1), 400); };
    setSel(5);   // 名單的選單可能還在讀取
    load(h[1], h[2]);
  } else pickFromFilter();
})();
