/* 漢威牧區｜牧養管理（小組長以上）：組員名單（連到 members.html，每週點名在那裡）、新朋友、小組基金、安德烈探訪、會議記錄、活動行事曆、牧養手冊、年度大總表 */
(async function () {
  const U = window.SGU, esc = U.esc, $ = U.$, me = U.session;
  const SECS = [['intake', '🌱 新朋友'], ['fund', '💰 小組基金'], ['visit', '🚶 安德烈探訪'], ['annual', '📊 年度大總表'],
    ['meet', '🗒️ 會議記錄'], ['event', '📅 活動行事曆'], ['book', '📖 牧養手冊']];
  let D = {};
  async function load() {
    const [groups, persons, lists, app] = await Promise.all([U.all('groups'), U.all('persons'), U.one('options', 'lists'), U.one('options', 'app')]);
    D.groups = groups.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    D.gmap = Object.fromEntries(groups.map(g => [g.id, g]));
    D.persons = persons; D.pmap = Object.fromEntries(persons.map(p => [p.id, p]));
    D.lists = lists || {}; D.app = app || {};
    D.me = D.pmap[me.personId] || {};
  }
  await load();
  const active = () => D.groups.filter(g => g.active !== false);
  const myGroups = () => U.isDistrict() ? active() : active().filter(g => g.id === D.me.groupId);
  let cur = { sec: 'intake', gid: (myGroups()[0] || {}).id, date: '' };
  const h = location.hash.slice(1).split(':');
  if (h[0] === 'roll') { location.replace('members.html#' + location.hash.slice(1)); return; }   // 每週點名已併進組員名單
  if (SECS.some(s => s[0] === h[0])) { cur.sec = h[0]; if (h[1]) cur.gid = h[1]; if (h[2]) cur.date = h[2]; }

  function nav() { $('secNav').innerHTML = '<a href="members.html" class="sg-secnav-link">👥 組員名單</a>' + SECS.map(([k, l]) => `<button type="button" data-sec="${k}" aria-pressed="${k === cur.sec}">${l}</button>`).join(''); }
  $('secNav').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) { cur.sec = b.dataset.sec; cur.date = ''; history.replaceState(null, '', '#' + cur.sec); nav(); render(); } });
  const groupBar = (withAll) => myGroups().length > 1 || withAll
    ? `<div class="sg-chipbar" data-gbar>${withAll ? `<button type="button" data-g="district" aria-pressed="${cur.gid === 'district'}">牧區合計</button>` : ''}${(withAll ? D.groups.filter(g => g.active !== false || (D.annual && D.annual[g.id])) : myGroups()).map(g => `<button type="button" data-g="${g.id}" aria-pressed="${g.id === cur.gid}">${esc(g.name)}${g.active === false ? '（已停用）' : ''}</button>`).join('')}</div>` : '';
  $('sec').addEventListener('click', e => { const b = e.target.closest('[data-gbar] [data-g]'); if (b) { cur.gid = b.dataset.g; cur.date = ''; render(); } });
  const title = (t, sub) => `<h2 style="font-size:20px;font-weight:800;margin:0 0 4px">${t}</h2>${sub ? `<p class="sg-sub">${sub}</p>` : ''}`;

  async function render() {
    if (cur.sec !== 'annual' && (cur.gid === 'district' || !D.gmap[cur.gid] || D.gmap[cur.gid].active === false) ) cur.gid = (myGroups()[0] || {}).id;
    const fn = { intake, fund, visit, annual, meet, event, book }[cur.sec];
    $('sec').innerHTML = '<div class="sg-empty">讀取中…</div>';
    await fn();
  }

  // ================= 新朋友 =================
  async function intake() {
    const list = (await U.all('intakes')).sort((a, b) => U.ms(b.createdAt) - U.ms(a.createdAt));
    const url = new URL('join.html', location.href).href;
    $('sec').innerHTML = title('新朋友', '照 SR 的新朋友名單與登記表。之後全教會版本完成，改從教會那邊抓。') + `
      <section class="sg-card"><a class="sg-item" href="intakes.html"><span class="sg-ic">🌱</span><span class="sg-txt">新朋友名單<small>跟進、改狀態、加入名冊</small></span><span class="sg-badge">${list.length} 位</span></a>
        <a class="sg-item" href="join.html" target="_blank"><span class="sg-ic">📝</span><span class="sg-txt">新朋友登記表<small>給新朋友自己填，不用登入</small></span><span class="sg-badge">開啟 ↗</span></a>
        <div class="sg-item"><span class="sg-ic">🔗</span><span class="sg-txt">登記表網址<small style="word-break:break-all">${esc(url)}</small></span><button type="button" class="sg-btn" id="copyJoin">複製</button></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">最近登記</div>${list.slice(0, 6).map(p => `<a class="sg-item" href="intakes.html"><span class="sg-ic">👋</span><span class="sg-txt">${esc(p.name)}<small>${U.md(new Date(U.ms(p.createdAt)).toISOString())}・${esc(p.groupName || '未選小組')}</small></span>${p.personId ? '<span class="sg-pill">已加入名冊</span>' : `<span class="sg-badge">${esc(p.status || '未處理')}</span>`}</a>`).join('') || '<div class="sg-empty">還沒有新朋友登記</div>'}</section>`;
    $('copyJoin').addEventListener('click', () => navigator.clipboard.writeText(url).then(() => U.toast('已複製登記表網址')));
  }

  // ================= 小組基金（只記收支） =================
  async function fund() {
    const g = D.gmap[cur.gid]; if (!g) return;
    const list = (await U.all('funds')).filter(f => f.groupId === g.id).sort((a, b) => b.date.localeCompare(a.date));
    const inc = list.filter(f => f.type === 'income').reduce((s, f) => s + (+f.amount || 0), 0), exp = list.filter(f => f.type === 'expense').reduce((s, f) => s + (+f.amount || 0), 0);
    const n = x => x.toLocaleString('zh-TW');
    $('sec').innerHTML = title('小組基金', `${esc(g.name)}・只登記收入與支出`) + groupBar() + `
      <section class="sg-card"><div class="sg-card-b" style="text-align:center;padding-top:16px"><div class="sg-note">目前結餘</div><div style="font-size:30px;font-weight:800;color:${inc - exp >= 0 ? 'var(--sg-teal-text)' : '#D70015'}">$ ${n(inc - exp)}</div>
        <div style="display:flex;justify-content:center;gap:18px;font-size:13px;color:var(--sg-muted);margin-top:4px"><span>收入 $ ${n(inc)}</span><span>支出 $ ${n(exp)}</span></div></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">新增一筆</div><div class="sg-card-b">
        <div class="sg-seg" id="fType"><button type="button" data-t="income" aria-pressed="false">＋ 收入</button><button type="button" data-t="expense" aria-pressed="true">－ 支出</button></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="sg-lab" for="fDate">日期</label><input class="sg-in" type="date" id="fDate" value="${U.today()}"></div>
        <div><label class="sg-lab" for="fAmt">金額</label><input class="sg-in" type="number" id="fAmt" min="1" inputmode="numeric" placeholder="0"></div></div>
        <label class="sg-lab" for="fItem">項目</label><input class="sg-in" id="fItem" maxlength="40" placeholder="例如：每月小組奉獻、愛宴食材">
        <button type="button" class="sg-btn sg-btn-teal" id="fAdd" style="width:100%;margin-top:12px">新增</button></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">明細</div>${list.map(f => `<div class="sg-item"><span class="sg-ic">${f.type === 'income' ? '⬆️' : '⬇️'}</span><span class="sg-txt">${esc(f.item)}<small>${U.mdw(f.date)}</small></span>
        <b style="color:${f.type === 'income' ? 'var(--sg-teal-text)' : '#D70015'}">${f.type === 'income' ? '+' : '−'}${n(+f.amount)}</b><button type="button" class="sg-btn" data-del="${f.id}" aria-label="刪除" style="min-height:32px;padding:0 10px">🗑</button></div>`).join('') || '<div class="sg-empty">還沒有紀錄</div>'}</section>`;
    let type = 'expense';
    $('fType').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return; type = b.dataset.t; $('fType').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('fAdd').addEventListener('click', async () => {
      const amount = +$('fAmt').value, item = $('fItem').value.trim();
      if (!item || !(amount > 0)) { U.toast('請填項目和金額', 'error'); return; }
      await db.collection('funds').add({ groupId: g.id, date: $('fDate').value || U.today(), type, item, amount, by: me.personId });
      U.toast('已新增'); fund();
    });
    $('sec').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (!confirm('刪除這一筆？')) return; await db.collection('funds').doc(b.dataset.del).delete(); fund(); }));
  }

  // ================= 安德烈探訪：每年次數 =================
  async function visit() {
    const vs = await U.all('visits'), y = new Date().getFullYear();
    const years = [y, y - 1];
    const get = (gid, yr) => (vs.find(v => v.groupId === gid && +v.year === yr) || {}).count || 0;
    $('sec').innerHTML = title('安德烈探訪', '每年告訴區長去了幾次就好（含福音佈道）。') + `
      <section class="sg-card"><div class="sg-scroll-x"><table class="sg-table"><thead><tr><th>小組</th>${years.map(yr => `<th class="num">${yr}</th>`).join('')}</tr></thead><tbody>
      ${myGroups().map(g => `<tr><td><b>${esc(g.name)}</b></td>${years.map(yr => `<td class="num">${yr === y ? `<span style="display:inline-flex;align-items:center;gap:6px"><button type="button" class="sg-btn" data-v="${g.id}" data-d="-1" style="min-height:30px;padding:0 10px">−</button><b style="min-width:24px;display:inline-block;text-align:center">${get(g.id, yr)}</b><button type="button" class="sg-btn" data-v="${g.id}" data-d="1" style="min-height:30px;padding:0 10px">＋</button></span>` : get(g.id, yr)}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div></section><p class="sg-note" style="margin-top:8px">今年的次數會自動帶進年度大總表。</p>`;
    $('sec').querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.v + '_' + y; const n = Math.max(0, get(b.dataset.v, y) + +b.dataset.d);
      await db.collection('visits').doc(id).set({ groupId: b.dataset.v, year: y, count: n }); visit();
    }));
  }

  // ================= 年度大總表 =================
  const METRICS = [['avg', '週平均人數', 'auto'], ['line', 'LINE 群組人數', 'manual'], ['visits', '安德烈＆探訪人次', 'auto'], ['exp', '經歷神', 'auto'], ['bap', '受洗', 'auto'],
    ['c1', 'C1 完成', 'auto'], ['c2', 'C2 完成', 'auto'], ['c3', 'C3 完成', 'auto'], ['bible', '極限讀經（上：報名｜下：完成）', 'auto'], ['disciple', '門徒班', 'auto']];
  let showAll = false;
  async function annual() {
    if (!U.isDistrict()) cur.gid = D.me.groupId;
    else if (!annual.seen) { annual.seen = true; cur.gid = 'district'; }
    else if (!cur.gid || (cur.gid !== 'district' && !D.gmap[cur.gid])) cur.gid = 'district';
    const [ann, att, vs] = await Promise.all([U.all('annual'), U.all('attendance'), U.all('visits')]);
    D.annual = Object.fromEntries(ann.map(a => [a.id, a]));
    const y = new Date().getFullYear(), first = showAll ? 2019 : y - 2;
    const periods = []; for (let yr = first; yr <= y; yr++) periods.push(yr + 'H1', yr + 'H2');
    const nowP = y + (new Date().getMonth() < 6 ? 'H1' : 'H2');
    const inP = (d, p) => !!d && /^\d{4}-\d{2}/.test(d) && d.slice(0, 4) === p.slice(0, 4) && ((+d.slice(5, 7) <= 6) === p.endsWith('H1'));
    const catDone = (p, cid) => { const cat = (D.lists.courses || []).find(c => c.id === cid); if (!cat) return ''; const ds = cat.items.map(i => (p.courses || {})[i.id]); return ds.every(Boolean) ? ds.filter(x => /^\d/.test(x)).sort().pop() || '' : ''; };
    function auto(gid, m, p) {
      if (p > nowP) return null;
      if (gid === 'district') { const vals = active().map(g => auto(g.id, m, p)).filter(v => v !== null); return vals.length ? +vals.reduce((s, v) => s + v, 0).toFixed(1) : null; }
      const ppl = D.persons.filter(x => x.groupId === gid);
      if (m === 'avg') { const r = att.filter(a => a.groupId === gid && !a.special && inP(a.date, p)); return r.length ? +(r.reduce((s, a) => s + a.present.length + (a.guests || 0), 0) / r.length).toFixed(1) : null; }
      if (m === 'visits') { if (!p.endsWith('H2')) return null; const v = vs.find(x => x.groupId === gid && +x.year === +p.slice(0, 4)); return v ? v.count : null; }
      if (m === 'exp' || m === 'bap') return ppl.filter(x => inP((x.courses || {})[m], p)).length;
      if (/^c\d$/.test(m)) return ppl.filter(x => inP(catDone(x, m), p)).length;
      if (m === 'disciple') return ppl.filter(x => inP((x.courses || {}).c5a, p)).length;
      if (m === 'bible') { const yr = p.slice(0, 4); return ppl.filter(x => p.endsWith('H1') ? ['signed', 'done'].includes((x.bible || {})[yr]) : (x.bible || {})[yr] === 'done').length; }
      return null;
    }
    const vals = (D.annual[cur.gid] || {}).values || {};
    const cell = (m, p) => {
      const saved = (vals[m] || {})[p];
      if (saved !== undefined && saved !== null && saved !== '') return { v: saved, auto: false };
      const a = METRICS.find(x => x[0] === m)[2] === 'auto' ? auto(cur.gid, m, p) : null;
      return { v: a, auto: a !== null };
    };
    const edit = U.isDistrict();
    const gname = cur.gid === 'district' ? '牧區合計' : (D.gmap[cur.gid] || {}).name;
    const avgSeries = periods.map(p => ({ p, v: cell('avg', p).v }));
    const max = Math.max(1, ...avgSeries.map(x => +x.v || 0));
    $('sec').innerHTML = title('年度大總表', '每半年一欄。<span style="color:var(--sg-teal-text);font-weight:700">藍綠色數字</span>是系統自動算的；' + (edit ? '點任何一格可以手動調整。' : '只有區長可以調整。')) + (U.isDistrict() ? groupBar(true) : '') + `
      <section class="sg-card"><div class="sg-card-h">${esc(gname)}・週平均人數<button type="button" class="sg-more" id="annAll">${showAll ? '只看近三年' : '看 2019 起全部'}</button></div>
        <div class="sg-card-b"><svg viewBox="0 0 ${periods.length * 30} 110" style="width:100%;height:120px" role="img" aria-label="週平均人數長條圖">
        ${avgSeries.map((x, i) => x.v === null || x.v === undefined ? '' : `<rect x="${i * 30 + 6}" y="${92 - (x.v / max) * 80}" width="18" height="${(x.v / max) * 80}" rx="4" fill="${x.p.endsWith('H1') ? '#2DB3BE' : '#007E8A'}"><title>${x.p.replace('H1', ' 上').replace('H2', ' 下')}：${x.v}</title></rect><text x="${i * 30 + 15}" y="${88 - (x.v / max) * 80}" font-size="8" text-anchor="middle" fill="currentColor">${x.v}</text>`).join('')}
        ${periods.map((p, i) => p.endsWith('H1') ? `<text x="${i * 30 + 30}" y="106" font-size="9" text-anchor="middle" fill="currentColor" opacity=".6">${p.slice(0, 4)}</text>` : '').join('')}</svg></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-scroll-x"><table class="sg-table sg-annual"><thead>
        <tr class="yr"><th></th>${periods.filter(p => p.endsWith('H1')).map(p => `<th colspan="2">${p.slice(0, 4)}</th>`).join('')}</tr>
        <tr><th>項目</th>${periods.map(p => `<th class="num" style="text-align:center">${p.endsWith('H1') ? '1–6月' : '7–12月'}</th>`).join('')}</tr></thead><tbody>
        ${METRICS.map(([m, label]) => `<tr><td><b>${label}</b></td>${periods.map(p => { const c = cell(m, p); return `<td class="cell${c.auto ? ' auto' : ''}${edit ? ' edit' : ''}" data-m="${m}" data-p="${p}" title="${c.auto ? '自動計算' : ''}">${c.v === null || c.v === undefined ? '<span style="opacity:.3">—</span>' : c.v}</td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div></section>
      <p class="sg-note" style="margin-top:8px">自動計算：週平均←每週點名；經歷神、受洗、C1～C3、門徒班←名冊的完成日期；極限讀經←名冊的報名／完成；安德烈←每年探訪次數（記在下半年）。LINE 群組人數請手動填。</p>`;
    $('annAll').addEventListener('click', () => { showAll = !showAll; annual(); });
    if (edit) $('sec').querySelector('.sg-annual').addEventListener('click', e => {
      const td = e.target.closest('td.cell'); if (!td) return;
      const { m, p } = td.dataset, c = cell(m, p), label = METRICS.find(x => x[0] === m)[1];
      const dlg = U.sheet(`<h3>${esc(gname)}・${esc(label)}</h3><p class="sg-note">${p.slice(0, 4)} ${p.endsWith('H1') ? '1–6 月' : '7–12 月'}${c.auto ? `・目前是自動計算（${c.v}）` : ''}</p>
        <input class="sg-in" id="annV" type="number" step="0.1" value="${c.v ?? ''}" style="margin-top:8px">
        <div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="sg-btn" id="annAuto" style="flex:1">改回自動計算</button><button type="button" class="sg-btn sg-btn-teal" id="annOk" style="flex:1">儲存</button></div>`);
      const saveV = async val => {
        const doc = D.annual[cur.gid] || { values: {} }; const values = { ...(doc.values || {}) }; values[m] = { ...(values[m] || {}) };
        if (val === null) delete values[m][p]; else values[m][p] = val;
        await db.collection('annual').doc(cur.gid).set({ values }); dlg.close(); annual();
      };
      dlg.querySelector('#annOk').addEventListener('click', () => { const v = dlg.querySelector('#annV').value; saveV(v === '' ? null : +v); });
      dlg.querySelector('#annAuto').addEventListener('click', () => saveV(null));
    });
  }

  // ================= 會議記錄 =================
  async function meet() {
    const list = (await U.all('meetings')).sort((a, b) => b.date.localeCompare(a.date));
    $('sec').innerHTML = title('會議記錄', '牧區同工會議') + (U.isDistrict() ? '<button type="button" class="sg-btn sg-btn-teal" id="mAdd" style="margin-bottom:12px">＋ 新增會議記錄</button>' : '') +
      (list.map(m => `<section class="sg-card" style="margin-bottom:12px"><div class="sg-card-h">${U.mdw(m.date)}・${esc(m.time || '')}・${esc(m.place || '')}${U.isDistrict() ? `<button type="button" class="sg-more" data-medit="${m.id}">編輯</button>` : ''}</div>
        <div class="sg-card-b"><div class="sg-lab" style="margin-top:0">討論事項</div><div class="sg-article">${esc(m.topics)}</div><div class="sg-lab">會議記錄</div><div class="sg-article">${esc(m.notes)}</div></div></section>`).join('') || '<div class="sg-card sg-empty">還沒有會議記錄</div>');
    const form = m => {
      const dlg = U.sheet(`<h3>${m ? '編輯' : '新增'}會議記錄</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="sg-lab">日期</label><input class="sg-in" type="date" id="mDate" value="${m ? m.date : U.today()}"></div><div><label class="sg-lab">時間</label><input class="sg-in" id="mTime" value="${esc(m ? m.time : '')}" placeholder="9:00–11:30"></div></div>
        <label class="sg-lab">地點</label><input class="sg-in" id="mPlace" value="${esc(m ? m.place : '')}">
        <label class="sg-lab">討論事項</label><textarea class="sg-in" id="mTopics" rows="4">${esc(m ? m.topics : '')}</textarea>
        <label class="sg-lab">會議記錄</label><textarea class="sg-in" id="mNotes" rows="6">${esc(m ? m.notes : '')}</textarea>
        <div style="display:flex;gap:8px;margin-top:12px">${m ? '<button type="button" class="sg-btn sg-btn-red" id="mDel">刪除</button>' : ''}<button type="button" class="sg-btn" data-dlg-close style="flex:1">取消</button><button type="button" class="sg-btn sg-btn-teal" id="mOk" style="flex:2">儲存</button></div>`);
      dlg.querySelector('#mOk').addEventListener('click', async () => {
        const data = { date: dlg.querySelector('#mDate').value, time: dlg.querySelector('#mTime').value, place: dlg.querySelector('#mPlace').value, topics: dlg.querySelector('#mTopics').value, notes: dlg.querySelector('#mNotes').value, by: me.personId };
        if (m) await db.collection('meetings').doc(m.id).set(data); else await db.collection('meetings').add(data);
        dlg.close(); meet();
      });
      if (m) dlg.querySelector('#mDel').addEventListener('click', async () => { if (confirm('刪除這份會議記錄？')) { await db.collection('meetings').doc(m.id).delete(); dlg.close(); meet(); } });
    };
    if ($('mAdd')) $('mAdd').addEventListener('click', () => form(null));
    $('sec').querySelectorAll('[data-medit]').forEach(b => b.addEventListener('click', () => form(list.find(x => x.id === b.dataset.medit))));
  }

  // ================= 活動行事曆 =================
  async function event() {
    const list = (await U.all('events')).filter(e => e.scope !== 'group' || U.isDistrict() || e.groupId === D.me.groupId).sort((a, b) => a.date.localeCompare(b.date));
    const up = list.filter(e => e.date >= U.today()), past = list.filter(e => e.date < U.today()).reverse().slice(0, 5);
    const SC = { church: '全教會', district: '牧區', group: '小組' };
    const row = e => `<div class="sg-item"><span class="sg-ic" style="font-size:12px;font-weight:800">${U.md(e.date)}</span><span class="sg-txt">${esc(e.title)}<small>${U.mdw(e.date)}・${esc(e.place || '')}</small></span><span class="sg-badge">${SC[e.scope] || ''}${e.scope === 'group' ? '・' + esc((D.gmap[e.groupId] || {}).name || '') : ''}</span>
      ${U.isDistrict() || (e.scope === 'group' && e.groupId === D.me.groupId) ? `<button type="button" class="sg-btn" data-edel="${e.id}" style="min-height:32px;padding:0 10px" aria-label="刪除">🗑</button>` : ''}</div>`;
    $('sec').innerHTML = title('活動行事曆', '每個人的首頁都會看到近期活動') + `<button type="button" class="sg-btn sg-btn-teal" id="eAdd" style="margin-bottom:12px">＋ 新增活動</button>
      <section class="sg-card"><div class="sg-card-h">接下來</div>${up.map(row).join('') || '<div class="sg-empty">沒有活動</div>'}</section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">已結束</div>${past.map(row).join('') || '<div class="sg-empty">—</div>'}</section>`;
    $('eAdd').addEventListener('click', () => {
      const dlg = U.sheet(`<h3>新增活動</h3><label class="sg-lab">活動名稱</label><input class="sg-in" id="eT" maxlength="40">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="sg-lab">日期</label><input class="sg-in" type="date" id="eD" value="${U.today()}"></div><div><label class="sg-lab">地點</label><input class="sg-in" id="eP"></div></div>
        <label class="sg-lab">範圍</label><select class="sg-in" id="eS">${U.isDistrict() ? '<option value="district">牧區</option><option value="church">全教會</option>' : ''}<option value="group">${esc((D.gmap[D.me.groupId] || {}).name || '小組')}</option></select>
        <label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="ePost" checked> 同時發一則動態</label>
        <div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">取消</button><button type="button" class="sg-btn sg-btn-teal" id="eOk" style="flex:2">新增</button></div>`);
      dlg.querySelector('#eOk').addEventListener('click', async () => {
        const t = dlg.querySelector('#eT').value.trim(); if (!t) { U.toast('請填活動名稱', 'error'); return; }
        const scope = dlg.querySelector('#eS').value;
        const ref = await db.collection('events').add({ title: t, date: dlg.querySelector('#eD').value, place: dlg.querySelector('#eP').value, scope, groupId: scope === 'group' ? D.me.groupId : '', by: me.personId });
        if (dlg.querySelector('#ePost').checked) await db.collection('posts').add({ type: 'event', event: ref.id, author: me.personId, groupId: scope === 'group' ? D.me.groupId : '', scope: scope === 'group' ? 'group' : 'district',
          text: `新活動：${t}`, reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        dlg.close(); event();
      });
    });
    $('sec').querySelectorAll('[data-edel]').forEach(b => b.addEventListener('click', async () => { if (confirm('刪除這個活動？')) { await db.collection('events').doc(b.dataset.edel).delete(); event(); } }));
  }

  // ================= 牧養手冊 =================
  async function book() {
    const list = (await U.all('handbook')).sort((a, b) => (a.order || 0) - (b.order || 0));
    const open = cur.date && list.find(x => x.id === cur.date);
    if (open) {
      $('sec').innerHTML = `<button type="button" class="sg-btn" id="bBack" style="margin-bottom:12px">‹ 牧養手冊</button><section class="sg-card"><div class="sg-card-h" style="font-size:18px">${esc(open.title)}${U.isDistrict() ? '<button type="button" class="sg-more" id="bEdit">編輯</button>' : ''}</div><div class="sg-card-b sg-article">${esc(open.body)}</div></section>`;
      $('bBack').addEventListener('click', () => { cur.date = ''; book(); });
      if ($('bEdit')) $('bEdit').addEventListener('click', () => {
        const dlg = U.sheet(`<h3>編輯：${esc(open.title)}</h3><label class="sg-lab">標題</label><input class="sg-in" id="bT" value="${esc(open.title)}"><label class="sg-lab">內容</label><textarea class="sg-in" id="bB" rows="14">${esc(open.body)}</textarea>
          <div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="sg-btn" data-dlg-close style="flex:1">取消</button><button type="button" class="sg-btn sg-btn-teal" id="bOk" style="flex:2">儲存</button></div>`);
        dlg.querySelector('#bOk').addEventListener('click', async () => { await db.collection('handbook').doc(open.id).update({ title: dlg.querySelector('#bT').value, body: dlg.querySelector('#bB').value }); dlg.close(); book(); });
      });
      return;
    }
    $('sec').innerHTML = title('牧養手冊', '小組長的工具與原則') + `<section class="sg-card">${list.map(b => `<button type="button" class="sg-item" data-book="${b.id}" style="width:100%;border-left:0;border-right:0;border-bottom:0;background:none;text-align:left;cursor:pointer"><span class="sg-ic">📖</span><span class="sg-txt">${esc(b.title)}<small>${esc(b.body.replace(/\s+/g, ' ').slice(0, 40))}…</small></span><span>›</span></button>`).join('')}</section>`;
    $('sec').querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => { cur.date = b.dataset.book; book(); }));
  }

  nav(); render();
})();
