/* 漢威牧區｜動態牆（首頁、團契共用）：讀資料、貼文卡片、按讚、留言、為你禱告、發文、送經文卡 */
(function () {
  const U = window.SGU, esc = U.esc, me = U.session;
  const F = window.SGF = {};
  const TYPES = {
    qt: { label: '📖 QT', bg: 'rgba(0,126,138,.12)', fg: '#007E8A' },
    testimony: { label: '✨ 見證', bg: 'rgba(232,163,61,.16)', fg: '#A0640A' },
    prayer: { label: '🙏 代禱', bg: 'rgba(121,80,242,.14)', fg: '#6741D9' },
    mood: { label: '💬 心情', bg: 'rgba(127,127,127,.14)', fg: '#6E6E73' },
    milestone: { label: '🎉 里程碑' }, birthday: { label: '🎂 生日' }, gift: { label: '🎁 禮物' }, goal: { label: '🚶 小組旅程' }, event: { label: '📅 活動' }
  };
  F.TYPES = TYPES;

  // ---------- 讀資料 ----------
  F.load = async function () {
    const [lists, app, groups, persons, posts, events, daily] = await Promise.all([
      U.one('options', 'lists'), U.one('options', 'app'), U.all('groups'), U.all('persons'), U.all('posts'), U.all('events'), U.all('daily')]);
    const D = { lists: lists || {}, app: app || {}, groups: groups.sort((a, b) => (a.order ?? 99) - (b.order ?? 99)), persons, posts, events, daily };
    D.pmap = Object.fromEntries(persons.map(p => [p.id, p]));
    D.gmap = Object.fromEntries(groups.map(g => [g.id, g]));
    D.me = D.pmap[me.personId] || { id: me.personId, name: '訪客' };
    D.myGroup = D.gmap[D.me.groupId] || null;
    D.myDaily = daily.find(d => d.id === me.personId) || { days: {}, cards: [], received: [], giftsSent: 0 };
    D.tasks = (D.app.tasks || []).filter(Boolean);
    D.feat = D.app.features || {};
    D.verse = id => (window.SG_VERSES || []).find(v => v.id === id);
    D.series = name => (window.SG_SERIES || []).find(s => s.name === name) || { color: '#007E8A' };
    F.D = D;
    return D;
  };
  F.groupName = gid => (F.D.gmap[gid] || {}).name || '';
  F.canSee = p => {
    if (U.isDistrict()) return true;
    return !p.groupId || p.groupId === F.D.me.groupId || p.scope === 'district' || p.scope === 'church';
  };

  // ---------- 貼文卡片 ----------
  const pressed = (arr) => (arr || []).includes(me.personId);
  F.cardHtml = function (p) {
    const D = F.D, a = D.pmap[p.author], t = TYPES[p.type] || TYPES.mood;
    const when = U.ago(U.ms(p.createdAt));
    const where = p.groupId ? F.groupName(p.groupId) : '漢威牧區';
    const scopeTxt = p.scope === 'district' ? '・牧區公開' : '';
    let body = '';
    if (p.type === 'milestone' || p.type === 'goal' || p.type === 'birthday') {
      const big = p.type === 'goal' ? '🚶' : p.type === 'birthday' ? '🎂' : (p.badge === 'bap' ? '💧' : '🎓');
      body = `<div class="sg-post-sys"><span class="big">${big}</span><div><div style="font-weight:800;font-size:15px">${p.type === 'goal' ? esc(where) : esc(a ? a.name : '')}</div>
        <div style="font-size:15px;line-height:1.55">${esc(p.text)}</div><div class="meta" style="font-size:12px;color:var(--sg-muted);margin-top:2px">${esc(when)}${p.type !== 'goal' ? '・' + esc(where) : ''}</div></div></div>`;
    } else if (p.type === 'gift') {
      const to = D.pmap[p.to], v = D.verse(p.card) || {};
      body = `${head(a, when, where, scopeTxt, t)}<div class="sg-post-body">送給 <b>${esc(to ? to.name : '')}</b> 一張經文卡${p.text ? '：' + esc(p.text) : ''}</div>
        <div class="sg-vcard" style="background:${D.series(v.series).color};min-height:0;margin-bottom:8px"><span class="s">${esc(v.series || '')}系列</span><div class="t">${esc(v.text || '')}</div><span class="r">${esc(v.ref || '')}</span></div>`;
    } else if (p.type === 'event') {
      const ev = D.events.find(e => e.id === p.event);
      body = `${head(a, when, where, scopeTxt, t)}<div class="sg-post-body">${esc(p.text)}</div>
        ${ev ? `<div class="sg-item" style="border:1px solid var(--sg-line);border-radius:12px;margin-bottom:8px"><span class="sg-ic">📅</span><span class="sg-txt">${esc(ev.title)}<small>${U.mdw(ev.date)}・${esc(ev.place || '')}</small></span></div>` : ''}`;
    } else {
      body = `${head(a, when, where, scopeTxt, t)}<div class="sg-post-body">${p.ref ? `<span class="sg-post-ref">${esc(p.ref)}</span><br>` : ''}${esc(p.text)}</div>`;
    }
    body += media(p.media);
    const amen = p.reactions && p.reactions.amen || [], heart = p.reactions && p.reactions.heart || [], prayed = p.prayedBy || [], cms = p.comments || [];
    const counts = [amen.length ? `🙏 ${amen.length}` : '', heart.length ? `❤️ ${heart.length}` : '', p.type === 'prayer' && prayed.length ? `${prayed.length} 人為你禱告` : '', cms.length ? `${cms.length} 則留言` : ''].filter(Boolean);
    const act = p.type === 'prayer'
      ? `<button type="button" data-act="pray" aria-pressed="${pressed(prayed)}">🙏 ${pressed(prayed) ? '已為你禱告' : '我為你禱告'}</button>`
      : `<button type="button" data-act="amen" aria-pressed="${pressed(amen)}">🙏 阿們</button><button type="button" class="heart" data-act="heart" aria-pressed="${pressed(heart)}">❤️ 讚</button>`;
    return `<article class="sg-card sg-post" data-post="${esc(p.id)}">${body}
      ${counts.length ? `<div class="sg-post-count">${counts.join('<span>・</span>')}</div>` : ''}
      <div class="sg-post-act">${act}<button type="button" data-act="comment">💬 ${p.type === 'birthday' ? '送祝福' : '留言'}</button>${canShare(p) ? '<button type="button" data-act="share">↗ 分享</button>' : ''}</div>
      <div class="sg-comments${cms.length || F.openCm === p.id ? '' : ' hidden'}">
        ${cms.map(c => { const w = D.pmap[c.by]; return `<div class="sg-cm">${U.avatar(w, 28)}<div class="bubble"><b>${esc(w ? w.name : '')}</b>${esc(c.text)}</div></div>`; }).join('')}
        <form class="sg-cm-form" data-cm-form><input name="t" maxlength="300" placeholder="${p.type === 'birthday' ? '寫下生日祝福…' : '寫留言…'}" autocomplete="off"><button class="sg-btn sg-btn-teal" type="submit">送出</button></form>
      </div></article>`;
  };
  // 照片（1～3 張排成格子）、影片（點了才載入）
  function media(m) {
    if (!m || !m.length) return '';
    return `<div class="sg-media n${Math.min(m.length, 3)}">${m.slice(0, 4).map(x => x.type === 'video'
      ? `<video src="${esc(x.src)}" poster="${esc(x.poster || '')}" controls playsinline preload="none"></video>`
      : `<img src="${esc(x.src)}" alt="" loading="lazy">`).join('')}</div>`;
  }
  // 分享：代禱只有本人能分享（別人的代禱事項不外流）；系統自動貼文不分享
  const canShare = p => !['birthday', 'goal', 'gift'].includes(p.type) && (p.type !== 'prayer' || p.author === me.personId);
  F.share = function (p, only) {   // only：發文時勾選的平台（沒給就全部顯示）
    const url = 'https://clc-dx04.pages.dev/sg/';   // 之後可換成單篇貼文的公開網址
    const text = `${p.ref ? p.ref + '｜' : ''}${p.text || ''}\n— 漢威牧區`, e = encodeURIComponent;
    let T = [['Facebook', '#1877F2', `https://www.facebook.com/sharer/sharer.php?u=${e(url)}&quote=${e(text)}`],
      ['LINE', '#06C755', `https://social-plugins.line.me/lineit/share?url=${e(url)}&text=${e(text)}`],
      ['Threads', '#101010', `https://www.threads.net/intent/post?text=${e(text + '\n' + url)}`],
      ['X', '#101010', `https://x.com/intent/post?text=${e(text)}&url=${e(url)}`]];
    const want = k => !only || only.includes(k);
    T = T.filter(t => want(t[0]));
    const qtMine = p.type === 'qt' && p.author === me.personId;
    let counted = false;
    const shared = async () => {   // QT：真的按了分享出去，才把今天的 QT 打勾（網頁沒辦法確認對方平台是否真的發出，按下分享就算）
      if (!qtMine || counted) return; counted = true;
      const drawn = await F.setTask('qt', true); U.toast('已分享，今天的 QT 打勾了 ✓');
      if (drawn) setTimeout(() => F.showCard(drawn), 600);
    };
    const dlg = U.sheet(`<h3>分享到</h3><p class="sg-note" style="margin:4px 0 12px">${only ? '依序點你選的平台，一個一個分享出去。' : '轉貼到你常用的社群，邀請更多朋友認識小組。'}${qtMine ? '<br>分享出去之後，今天的 QT 會自動打勾。' : ''}</p>
      <div class="sg-share">${T.map(([n, c, href]) => `<a href="${href}" target="_blank" rel="noopener" data-sh="out" style="background:${c}">${n}</a>`).join('')}
        ${want('Instagram') ? '<button type="button" data-sh="ig" style="background:linear-gradient(45deg,#F58529,#DD2A7B,#8134AF)">Instagram</button>' : ''}
        <button type="button" data-sh="copy">🔗 複製文字</button>${navigator.share ? '<button type="button" data-sh="more">⋯ 其他 App</button>' : ''}</div>
      <button type="button" class="sg-btn" data-dlg-close style="width:100%;margin-top:12px">關閉</button>`);
    const copy = () => navigator.clipboard ? navigator.clipboard.writeText(text + '\n' + url) : Promise.reject();
    dlg.addEventListener('click', async ev => {
      const b = ev.target.closest('[data-sh]'); if (!b) return;
      if (b.dataset.sh === 'out') { b.style.opacity = '.55'; b.textContent = '✓ ' + b.textContent.replace(/^✓ /, ''); shared(); return; }
      if (b.dataset.sh === 'copy') { copy().then(() => U.toast('已複製')).catch(() => {}); }
      if (b.dataset.sh === 'ig') {   // IG 沒有網頁分享：手機用系統分享（可帶照片），電腦先複製文字再開 IG
        const img = (p.media || []).find(x => x.type === 'image');
        if (navigator.share && img) { try { const blob = await (await fetch(img.src)).blob(); const f = new File([blob], 'photo.webp', { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text }); shared(); return; } } catch (er) { /* */ } }
        shared(); copy().finally(() => { U.toast('文字已複製，到 Instagram 貼上即可'); window.open('https://www.instagram.com/', '_blank', 'noopener'); });
      }
      if (b.dataset.sh === 'more') { try { await navigator.share({ title: '漢威牧區', text, url }); shared(); } catch (er) { /* 取消 */ } }
    });
  };

  function head(a, when, where, scopeTxt, t) {
    return `<div class="sg-post-h">${U.avatar(a, 40)}<div style="min-width:0"><div class="who">${esc(a ? a.name : '')}</div><div class="meta">${esc(when)}・${esc(where)}${scopeTxt}</div></div>
      ${t.bg ? `<span class="sg-post-tag" style="background:${t.bg};color:${t.fg}">${t.label}</span>` : ''}</div>`;
  }

  // ---------- 互動 ----------
  F.bind = function (root, rerender) {
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const el = b.closest('[data-post]'), p = F.D.posts.find(x => x.id === el.dataset.post); if (!p) return;
      const toggle = (arr) => { const s = new Set(arr || []); s.has(me.personId) ? s.delete(me.personId) : s.add(me.personId); return [...s]; };
      if (b.dataset.act === 'share') { F.share(p); return; }
      if (b.dataset.act === 'comment') { F.openCm = p.id; el.querySelector('.sg-comments').classList.remove('hidden'); el.querySelector('[data-cm-form] input').focus(); return; }
      if (b.dataset.act === 'pray') p.prayedBy = toggle(p.prayedBy);
      else { p.reactions = p.reactions || { amen: [], heart: [] }; p.reactions[b.dataset.act] = toggle(p.reactions[b.dataset.act]); }
      el.outerHTML = F.cardHtml(p);
      await db.collection('posts').doc(p.id).update({ reactions: p.reactions || { amen: [], heart: [] }, prayedBy: p.prayedBy || [] });
    });
    root.addEventListener('submit', async e => {
      const f = e.target.closest('[data-cm-form]'); if (!f) return;
      e.preventDefault();
      const text = f.t.value.trim(); if (!text) return;
      const el = f.closest('[data-post]'), p = F.D.posts.find(x => x.id === el.dataset.post);
      p.comments = [...(p.comments || []).map(c => ({ by: c.by, text: c.text, at: U.ms(c.at) || Date.now() })), { by: me.personId, text, at: Date.now() }];
      F.openCm = p.id;
      el.outerHTML = F.cardHtml(p);
      await db.collection('posts').doc(p.id).update({ comments: p.comments });
    });
  };

  // ---------- 發文 ----------
  F.compose = function (type, onDone) {
    const D = F.D;
    const opts = [['qt', '📖 QT 分享'], ['testimony', '✨ 見證'], ['prayer', '🙏 代禱'], ['mood', '💬 心情']];
    const ph = { qt: '今天讀了什麼？有什麼感動或應用？', testimony: '神在你生活中做了什麼？', prayer: '需要大家為你禱告的事…', mood: '想跟大家說的話…' };
    const dlg = U.sheet(`<h3>發文</h3>
      <div class="sg-seg" id="cType" style="margin:10px 0">${opts.map(([k, l]) => `<button type="button" data-k="${k}" aria-pressed="${k === type}">${l}</button>`).join('')}</div>
      <div id="cRefWrap"><label class="sg-lab" for="cRef">經文（選填）</label><input class="sg-in" id="cRef" maxlength="40" placeholder="例如：詩篇 23 篇"></div>
      <label class="sg-lab" for="cText">內容</label><textarea class="sg-in" id="cText" rows="5" maxlength="1500"></textarea>
      <label class="sg-lab">誰看得到</label>
      <div class="sg-seg" id="cScope">${D.myGroup ? `<button type="button" data-s="group" aria-pressed="true">${esc(D.myGroup.name)}</button>` : ''}<button type="button" data-s="district" aria-pressed="${!D.myGroup}">整個牧區</button></div>
      <label class="sg-lab">發佈後同時分享到（可複選，不選就只發在這裡）</label>
      <div class="sg-chipbar" id="cShare" style="flex-wrap:wrap">${['Facebook', 'LINE', 'Instagram', 'Threads', 'X'].map(n => `<button type="button" data-p="${n}" aria-pressed="false">${n}</button>`).join('')}</div>
      <p class="sg-note" id="cQtNote" style="margin-top:6px">QT 要分享到社群，才會把今天的「QT」任務打勾。</p>
      <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">取消</button><button type="button" class="sg-btn sg-btn-teal" id="cSend" style="flex:2">發佈</button></div>`);
    let cur = type, scope = D.myGroup ? 'group' : 'district';
    const sync = () => {
      dlg.querySelectorAll('#cType button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.k === cur)));
      dlg.querySelector('#cRefWrap').classList.toggle('hidden', cur !== 'qt');
      dlg.querySelector('#cQtNote').classList.toggle('hidden', cur !== 'qt');
      dlg.querySelector('#cText').placeholder = ph[cur];
    };
    sync();
    dlg.querySelector('#cType').addEventListener('click', e => { const b = e.target.closest('button'); if (b) { cur = b.dataset.k; if (cur === 'testimony') setScope('district'); sync(); } });
    const setScope = s => { scope = s; dlg.querySelectorAll('#cScope button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === s))); };
    dlg.querySelector('#cShare').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); });
    dlg.querySelector('#cScope').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setScope(b.dataset.s); });
    dlg.querySelector('#cSend').addEventListener('click', async () => {
      const text = dlg.querySelector('#cText').value.trim();
      if (!text) { U.toast('請先寫點內容', 'error'); return; }
      const data = { type: cur, author: me.personId, groupId: D.me.groupId || '', scope, text, ref: cur === 'qt' ? dlg.querySelector('#cRef').value.trim() : '',
        reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      await db.collection('posts').add(data);
      const share = [...dlg.querySelectorAll('#cShare [aria-pressed="true"]')].map(b => b.dataset.p);
      dlg.close(); U.toast('已發佈');
      if (onDone) onDone();
      if (share.length) F.share(data, share);
    });
  };

  // ---------- 每日任務（只有自己） ----------
  F.setTask = async function (taskId, val) {
    const D = F.D, today = U.today();
    const days = { ...(D.myDaily.days || {}) };
    days[today] = { ...(days[today] || {}), [taskId]: val };
    const wasDone = U.dayDone((D.myDaily.days || {})[today], D.tasks);
    D.myDaily.days = days;
    const nowDone = U.dayDone(days[today], D.tasks);
    let drawn = null;
    const cards = D.myDaily.cards || [];
    if (!wasDone && nowDone && D.feat.cards !== false && !cards.some(c => c.at === today)) {
      const all = window.SG_VERSES || [], have = new Set(cards.map(c => c.id));
      const pool = all.filter(v => !have.has(v.id));
      drawn = (pool.length ? pool : all)[Math.floor(Math.random() * (pool.length || all.length))];
      D.myDaily.cards = [...cards, { id: drawn.id, at: today }];
    }
    await db.collection('daily').doc(me.personId).set({ ...D.myDaily }, { merge: true });
    return drawn;
  };
  F.showCard = function (v, title) {
    U.sheet(`<h3>${esc(title || '🎉 今天的任務完成了！')}</h3><p class="sg-note" style="margin:0 0 12px">抽到一張經文卡，已收進「我的 → 經文卡冊」，也可以送給組員。</p>
      <div class="sg-vcard sg-flip" style="background:${F.D.series(v.series).color}"><span class="s">${esc(v.series)}系列</span><div class="t">${esc(v.text)}</div><span class="r">${esc(v.ref)}</span></div>
      <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">收下</button><button type="button" class="sg-btn sg-btn-teal" id="giftNow" style="flex:1">🎁 送給組員</button></div>`)
      .querySelector('#giftNow').addEventListener('click', e => { e.target.closest('dialog').close(); F.gift(v.id); });
  };

  // ---------- 送經文卡 ----------
  F.gift = function (cardId, onDone) {
    const D = F.D;
    const mine = [...new Set((D.myDaily.cards || []).map(c => c.id))].map(D.verse).filter(Boolean);
    if (!mine.length) { U.toast('完成每日任務就會得到經文卡', 'error'); return; }
    const people = D.persons.filter(p => p.id !== me.personId && p.status !== '已離開' && (U.isDistrict() || p.groupId === D.me.groupId || p.role === 'district'))
      .sort((a, b) => (a.groupId || '').localeCompare(b.groupId || '') || a.name.localeCompare(b.name, 'zh-Hant'));
    const dlg = U.sheet(`<h3>🎁 送一張經文卡</h3>
      <label class="sg-lab" for="gTo">送給</label><select class="sg-in" id="gTo"><option value="">請選擇</option>${people.map(p => `<option value="${p.id}">${esc(p.name)}${p.groupId && U.isDistrict() ? '（' + esc(F.groupName(p.groupId)) + '）' : ''}</option>`).join('')}</select>
      <label class="sg-lab">選一張卡</label><div class="sg-cardgrid" id="gCards">${mine.map(v => `<button type="button" class="sg-mini" data-card="${v.id}" style="background:${D.series(v.series).color};outline:${v.id === cardId ? '3px solid #F59F00' : 'none'}"><span>${esc(v.ref)}</span><span class="n">${esc(v.series)}</span></button>`).join('')}</div>
      <label class="sg-lab" for="gMsg">想說的話（選填）</label><input class="sg-in" id="gMsg" maxlength="80" placeholder="這週辛苦了！">
      <p class="sg-note" style="margin-top:8px">送出後會出現在動態牆上，對方也會收到。卡片送出後你還是保留著。</p>
      <div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">取消</button><button type="button" class="sg-btn sg-btn-teal" id="gSend" style="flex:2">送出</button></div>`);
    let pickId = cardId || (mine[0] && mine[0].id);
    dlg.querySelector('#gCards').addEventListener('click', e => { const b = e.target.closest('[data-card]'); if (!b) return; pickId = b.dataset.card; dlg.querySelectorAll('[data-card]').forEach(x => x.style.outline = x === b ? '3px solid #F59F00' : 'none'); });
    dlg.querySelector('#gSend').addEventListener('click', async () => {
      const to = dlg.querySelector('#gTo').value;
      if (!to) { U.toast('請選擇要送給誰', 'error'); return; }
      const msg = dlg.querySelector('#gMsg').value.trim();
      await db.collection('posts').add({ type: 'gift', author: me.personId, to, card: pickId, text: msg, groupId: D.pmap[to].groupId || D.me.groupId || '', scope: 'group',
        reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      const rd = D.daily.find(d => d.id === to) || { days: {}, cards: [], received: [] };
      await db.collection('daily').doc(to).set({ ...rd, received: [...(rd.received || []), { card: pickId, from: me.personId, text: msg, at: U.today() }] }, { merge: true });
      D.myDaily.giftsSent = (D.myDaily.giftsSent || 0) + 1;
      await db.collection('daily').doc(me.personId).set({ ...D.myDaily }, { merge: true });
      dlg.close(); U.toast('已送出 🎁');
      if (onDone) onDone();
    });
  };

  /** 今天生日的人：自動產生一則生日貼文（每人每天一則） */
  F.ensureBirthdays = async function () {
    const D = F.D, md = U.today().slice(5);
    for (const p of D.persons) {
      if (!p.birthday || p.birthday.slice(5) !== md || p.status === '已離開') continue;
      const id = `bday_${p.id}_${U.today()}`;
      if (D.posts.some(x => x.id === id)) continue;
      const data = { type: 'birthday', author: p.id, groupId: p.groupId || '', scope: 'district', text: '今天生日！一起送上祝福 🎉', reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() };
      await db.collection('posts').doc(id).set(data);
      D.posts.push({ id, ...data, createdAt: { toMillis: () => Date.now() } });
    }
  };
})();
