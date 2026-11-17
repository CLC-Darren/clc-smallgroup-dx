/* 漢威牧區｜後台（區長）：小組與聚會時間、每日經文、每日任務與獎勵、選項、資料匯出／匯入 */
(async function () {
  const U = window.SGU, esc = U.esc, $ = U.$;
  const SECS = [['groups', '🗂️ 小組'], ['verse', '📖 每日經文'], ['reward', '🎯 任務與獎勵'], ['options', '🏷️ 選項'], ['data', '📦 資料']];
  let sec = SECS.some(s => s[0] === location.hash.slice(1)) ? location.hash.slice(1) : 'groups';
  let app, lists, groups, persons;
  async function load() {
    [app, lists, groups, persons] = await Promise.all([U.one('options', 'app'), U.one('options', 'lists'), U.all('groups'), U.all('persons')]);
    app = app || {}; lists = lists || {}; groups.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }
  await load();
  const nav = () => { $('secNav').innerHTML = SECS.map(([k, l]) => `<button type="button" data-sec="${k}" aria-pressed="${k === sec}">${l}</button>`).join(''); };
  $('secNav').addEventListener('click', e => { const b = e.target.closest('[data-sec]'); if (b) { sec = b.dataset.sec; history.replaceState(null, '', '#' + sec); nav(); render(); } });
  const title = (t, sub) => `<h2 style="font-size:20px;font-weight:800;margin:0 0 4px">${t}</h2>${sub ? `<p class="sg-sub">${sub}</p>` : ''}`;
  const saveApp = async patch => { Object.assign(app, patch); await db.collection('options').doc('app').set(app); U.toast('已儲存'); };
  const render = () => ({ groups: gRender, verse: vRender, reward: rRender, options: oRender, data: dRender })[sec]();

  // ---------- 小組 ----------
  function gRender() {
    const times = app.meetTimes || [];
    $('sec').innerHTML = title('小組', '聚會時間由區長設定，小組長不能改。停用的小組會保留歷史資料。') + groups.map(g => {
      const leader = persons.find(p => p.groupId === g.id && p.role === 'leader');
      const custom = g.meetTime && !times.includes(g.meetTime);
      return `<section class="sg-card" style="margin-bottom:12px" data-g="${g.id}"><div class="sg-card-h">${esc(g.name)}${g.active === false ? '<span class="sg-badge">已停用</span>' : ''}<span class="sg-note" style="margin-left:auto">${esc(g.note || '')}</span></div><div class="sg-card-b">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
          <div><label class="sg-lab">小組名稱</label><input class="sg-in" data-f="name" value="${esc(g.name)}"></div>
          <div><label class="sg-lab">聚會日</label><select class="sg-in" data-f="meetDay">${U.WD.map((w, i) => `<option value="${i}"${(g.meetDay ?? 6) === i ? ' selected' : ''}>星期${w}</option>`).join('')}</select></div>
          <div><label class="sg-lab">聚會時間</label><select class="sg-in" data-f="meetTimeSel">${times.map(t => `<option${t === g.meetTime ? ' selected' : ''}>${esc(t)}</option>`).join('')}<option value="__other"${custom ? ' selected' : ''}>其他時間…</option></select>
            <input class="sg-in${custom ? '' : ' hidden'}" data-f="meetTimeOther" value="${custom ? esc(g.meetTime) : ''}" placeholder="例如 19:30–21:00" style="margin-top:6px"></div>
          <div><label class="sg-lab">小組長</label><input class="sg-in" value="${esc(leader ? leader.name : '—')}" disabled title="在名冊把人的「目前服事」設為小組長（正式版會在權限管理設定）"></div>
        </div>
        <label class="sg-lab">小組 LINE 群組邀請連結（選填，組員在「我的」會看到按鈕）</label><input class="sg-in" data-f="lineUrl" value="${esc(g.lineUrl || '')}" placeholder="https://line.me/R/ti/g/…">
        <div style="display:flex;gap:8px;margin-top:12px;align-items:center"><label style="display:flex;gap:6px;align-items:center;font-size:14px;flex:1"><input type="checkbox" data-f="active"${g.active === false ? '' : ' checked'}> 使用中</label>
          <button type="button" class="sg-btn sg-btn-teal" data-save>儲存</button></div></div></section>`;
    }).join('') + `<button type="button" class="sg-btn" id="gAdd">＋ 新增小組</button>`;
    $('sec').querySelectorAll('[data-f="meetTimeSel"]').forEach(s => s.addEventListener('change', () => s.nextElementSibling.classList.toggle('hidden', s.value !== '__other')));
    $('sec').querySelectorAll('[data-save]').forEach(b => b.addEventListener('click', async () => {
      const box = b.closest('[data-g]'), f = k => box.querySelector(`[data-f="${k}"]`);
      const sel = f('meetTimeSel').value;
      await db.collection('groups').doc(box.dataset.g).update({ name: f('name').value.trim(), meetDay: +f('meetDay').value, meetTime: sel === '__other' ? f('meetTimeOther').value.trim() : sel,
        lineUrl: f('lineUrl').value.trim(), active: f('active').checked });
      U.toast('已儲存'); await load(); gRender();
    }));
    $('gAdd').addEventListener('click', async () => {
      const name = prompt('新小組名稱（例如：○○小組）'); if (!name) return;
      await db.collection('groups').add({ name: name.trim(), order: groups.length + 1, active: true, districtId: 'd_hanwei', gender: '男', meetDay: 6, meetTime: (app.meetTimes || [])[1] || '', lineUrl: '', note: '' });
      await load(); gRender();
    });
  }

  // ---------- 每日經文 ----------
  function vRender() {
    const all = window.SG_VERSES || [], on = new Set(app.verses || all.map(v => v.id));
    $('sec').innerHTML = title('每日經文', '首頁問候下方的祝福經文（和合本）。可以每天輪替，也可以指定一句。') + `
      <section class="sg-card"><div class="sg-card-b" style="padding-top:12px"><div class="sg-seg" id="vMode"><button type="button" data-m="rotate" aria-pressed="${app.verseMode !== 'fixed'}">每天輪替</button><button type="button" data-m="fixed" aria-pressed="${app.verseMode === 'fixed'}">指定一句</button></div>
        <label class="sg-lab">指定的經文</label><select class="sg-in" id="vFixed">${all.map(v => `<option value="${v.id}"${v.id === app.fixedVerse ? ' selected' : ''}>${esc(v.ref)}</option>`).join('')}</select>
        <p class="sg-note" style="margin-top:8px">今天顯示：${esc((U.verseOfDay(app) || {}).ref || '')}</p></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">輪替清單（勾選的會輪流出現）</div>${all.map(v => `<label class="sg-item" style="cursor:pointer"><input type="checkbox" class="sg-check" data-v="${v.id}"${on.has(v.id) ? ' checked' : ''}><span class="sg-txt"><b>${esc(v.ref)}</b><small style="color:var(--sg-text)">${esc(v.text)}</small></span></label>`).join('')}</section>
      <button type="button" class="sg-btn sg-btn-teal" id="vSave" style="margin-top:12px;width:100%">儲存</button>
      <p class="sg-note" style="margin-top:8px">新增經文：下一版開放在這裡直接新增；目前請告訴 Darren。</p>`;
    let mode = app.verseMode === 'fixed' ? 'fixed' : 'rotate';
    $('vMode').addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (!b) return; mode = b.dataset.m; $('vMode').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); });
    $('vSave').addEventListener('click', async () => {
      const ids = [...$('sec').querySelectorAll('[data-v]:checked')].map(c => c.dataset.v);
      if (!ids.length) { U.toast('至少勾一句', 'error'); return; }
      await saveApp({ verseMode: mode, fixedVerse: $('vFixed').value, verses: ids }); vRender();
    });
  }

  // ---------- 任務與獎勵 ----------
  function rRender() {
    const f = app.features || {};
    const tg = (k, l, d) => `<label class="sg-item" style="cursor:pointer"><input type="checkbox" class="sg-check" data-feat="${k}"${f[k] === false ? '' : ' checked'}><span class="sg-txt">${l}<small>${d}</small></span></label>`;
    $('sec').innerHTML = title('任務與獎勵', '每個功能都可以開關。個人紀錄只有本人看得到；公開的只有全組的總數。') + `
      <section class="sg-card"><div class="sg-card-h">功能開關</div>
        ${tg('tasks', '📅 每日任務', '首頁的 QT、禱告打勾')}${tg('cards', '📚 經文卡', '每天任務完成抽一張，可以送給組員')}${tg('journey', '🗺️ 宣教旅程地圖', '全組累積 QT 往前走')}${tg('goal', '🎯 本月 QT 目標', '首頁顯示全組本月進度')}${tg('badges', '🏅 徽章', '里程碑徽章')}</section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">每日任務項目</div><div class="sg-card-b" id="tList">${(app.tasks || []).map((t, i) => `<div style="display:flex;gap:8px;margin-bottom:8px"><input class="sg-in" data-ti="${i}" data-k="icon" value="${esc(t.icon || '')}" style="width:60px;text-align:center"><input class="sg-in" data-ti="${i}" data-k="name" value="${esc(t.name)}"><button type="button" class="sg-btn" data-tdel="${i}">刪除</button></div>`).join('')}
        <button type="button" class="sg-btn" id="tAdd">＋ 新增任務</button></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">數字設定</div><div class="sg-card-b">
        <label class="sg-lab">每組每月 QT 目標（次）</label><input class="sg-in" type="number" id="nGoal" value="${app.monthGoal || 120}" min="1">
        <label class="sg-lab">宣教旅程：每幾次 QT 前進一步</label><input class="sg-in" type="number" id="nStep" value="${app.qtPerStep || 1}" min="1">
        <label class="sg-lab">恩典日：每 7 天可以漏幾天不中斷</label><input class="sg-in" type="number" id="nGrace" value="${app.graceDays ?? 1}" min="0" max="3"></div></section>
      <button type="button" class="sg-btn sg-btn-teal" id="rSave" style="margin-top:12px;width:100%">儲存</button>`;
    const readTasks = () => (app.tasks || []).map((t, i) => ({ id: t.id, icon: $('sec').querySelector(`[data-ti="${i}"][data-k="icon"]`).value, name: $('sec').querySelector(`[data-ti="${i}"][data-k="name"]`).value.trim() })).filter(t => t.name);
    $('tAdd').addEventListener('click', () => { app.tasks = [...readTasks(), { id: 't' + Date.now().toString(36), icon: '✅', name: '新任務' }]; rRender(); });
    $('sec').querySelectorAll('[data-tdel]').forEach(b => b.addEventListener('click', () => { const t = readTasks(); t.splice(+b.dataset.tdel, 1); app.tasks = t; rRender(); }));
    $('rSave').addEventListener('click', async () => {
      const features = {}; $('sec').querySelectorAll('[data-feat]').forEach(c => { features[c.dataset.feat] = c.checked; });
      await saveApp({ features, tasks: readTasks(), monthGoal: +$('nGoal').value || 120, qtPerStep: +$('nStep').value || 1, graceDays: +$('nGrace').value || 0 });
    });
  }

  // ---------- 選項 ----------
  function oRender() {
    const box = (k, l, help) => `<label class="sg-lab">${l}</label><textarea class="sg-in" data-opt="${k}" rows="2">${esc((lists[k] || []).join('、'))}</textarea><p class="sg-note">${help}</p>`;
    $('sec').innerHTML = title('選項', '用「、」隔開。改名會影響已經存的資料，請小心。') + `<section class="sg-card"><div class="sg-card-b">
      ${box('statuses', '聚會狀態', '名冊的狀態選單')}${box('ministries', '服事崗位', '名冊的「目前服事」，也可以在名冊用來篩選服事團隊')}${box('marital', '婚姻', '')}
      <label class="sg-lab">聚會時間選項</label><textarea class="sg-in" id="oTimes" rows="2">${esc((app.meetTimes || []).join('、'))}</textarea>
      <button type="button" class="sg-btn sg-btn-teal" id="oSave" style="margin-top:12px;width:100%">儲存</button></div></section>
      <section class="sg-card" style="margin-top:12px"><div class="sg-card-h">課程清單</div>${(lists.courses || []).map(c => `<div class="sg-item"><span class="sg-txt"><b>${esc(c.title)}</b><small>${c.items.map(i => esc(i.name)).join('、')}</small></span></div>`).join('')}
        <p class="sg-note" style="margin:0 14px 12px">課程項目的新增與排序在下一版開放。</p></section>`;
    $('oSave').addEventListener('click', async () => {
      const split = v => v.split(/[、,，\n]/).map(x => x.trim()).filter(Boolean);
      $('sec').querySelectorAll('[data-opt]').forEach(t => { lists[t.dataset.opt] = split(t.value); });
      await db.collection('options').doc('lists').set(lists);
      await saveApp({ meetTimes: split($('oTimes').value) });
    });
  }

  // ---------- 資料 ----------
  function dRender() {
    $('sec').innerHTML = title('資料', '搬家、備份用。正式版會匯出 Firebase 裡這個 App 的全部資料。') + `<section class="sg-card">
      <div class="sg-item"><span class="sg-ic">⬇️</span><span class="sg-txt">匯出全部資料<small>下載一個 JSON 檔</small></span><button type="button" class="sg-btn sg-btn-teal" id="dExp">匯出</button></div>
      <div class="sg-item"><span class="sg-ic">⬆️</span><span class="sg-txt">匯入資料<small>會取代目前全部資料</small></span><label class="sg-btn">選擇檔案<input type="file" id="dImp" accept="application/json" class="hidden"></label></div>
      <div class="sg-item"><span class="sg-ic">🧪</span><span class="sg-txt">重設假資料<small>靜態預覽用：清掉這台裝置上的修改</small></span><button type="button" class="sg-btn sg-btn-red" id="dReset">重設</button></div></section>`;
    $('dExp').addEventListener('click', () => {
      const blob = new Blob([localStorage.getItem('sg_mockdb_v4') || '{}'], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `漢威牧區_資料_${U.today()}.json`; a.click();
    });
    $('dImp').addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      try { const txt = await file.text(); JSON.parse(txt); if (!confirm('匯入會取代目前全部資料，確定嗎？')) return; localStorage.setItem('sg_mockdb_v4', txt); location.reload(); }
      catch (err) { U.toast('檔案格式不對', 'error'); }
    });
    $('dReset').addEventListener('click', () => { if (confirm('回到初始假資料？這台裝置上的修改會清掉。')) SG_MOCK.reset(); });
  }

  nav(); render();
})();
