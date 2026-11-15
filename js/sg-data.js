/**
 * 漢威牧區｜名單共用工具（由 SR 的 sr-data.js 改寫）
 *
 * Firestore 結構：
 *   persons/{id}   組員：name, gender('女'|'男'|''), birthday('YYYY-MM-DD'|''), phone, mobile,
 *                  address, marital, living, groupId, status, note, source, createdAt, updatedAt, updatedBy
 *   groups/{id}    小組：name, order, active, gender, districtId（所屬牧區）
 *   districts/{id} 牧區：name, order
 *   options/lists  選項：statuses[], marital[], living[], ministries[]（字串陣列，依序顯示）、courses[]（課程分類與項目）
 *   persons 另有：lineId, email, joinDate, ministries[], courses{項目id: 'YYYY-MM-DD'|'done'}, bible{年: 'signed'|'done'}, careLogs[{date,text,by}]
 */
(function () {
  const SG = window.SG = {};

  SG.DEFAULT_OPTIONS = {
    // 與點名表「狀態選單」相同（去掉前面的編號）
    statuses: ['委身小組', '新加入', '只來聚會', '很久沒來', '已離開', '其他'],
    marital: ['已婚', '未婚'],
    living: ['家人同住', '獨居', '租屋', '其他'],
    ministries: window.SG_MINISTRIES_DEFAULT || [],
    courses: window.SG_COURSES_DEFAULT || []
  };
  // 新朋友名單的狀態（與點名表「狀態選單」的新人狀態相同）
  SG.INTAKE_STATUSES = ['跟進關懷', '偶爾聚會', '委身聚會', '加入小組', '暫不加入'];
  SG.OPTION_LABELS = { statuses: '狀態', marital: '婚姻', living: '居住狀況', ministries: '服事崗位' };

  SG.PERSON_FIELDS = ['name', 'gender', 'birthday', 'phone', 'mobile', 'address', 'marital', 'living', 'groupId', 'status', 'note'];
  SG.FIELD_LABELS = {
    name: '姓名', gender: '性別', birthday: '生日', phone: '市話', mobile: '手機', address: '地址',
    marital: '婚姻', living: '居住狀況', groupId: '小組', status: '狀態', note: '備註', memberNo: '編號',
    lineId: 'LINE ID', email: 'Email', joinDate: '入教會日', ministries: '目前服事'
  };

  SG.esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const pad = n => String(n).padStart(2, '0');

  function validYmd(y, m, d) {
    if (!(y >= 1890 && y <= new Date().getFullYear() && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return false;
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  /**
   * 把各種生日寫法轉成 'YYYY-MM-DD'。空白回傳 ''；看不懂回傳 null。
   * 支援：1956-03-02、1956/3/2、45/3/2（民國）、45.03.02、民國45年3月2日、0450302、19560302、
   *       Excel 日期物件與日期序號。年份小於 200 一律視為民國年。
   */
  SG.parseBirthday = function (value) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      if (isNaN(value)) return null;
      const y = value.getFullYear(), m = value.getMonth() + 1, d = value.getDate();
      return validYmd(y, m, d) ? `${y}-${pad(m)}-${pad(d)}` : null;
    }
    if (typeof value === 'number') {
      if (value > 1000 && value < 80000) { // Excel 日期序號
        const dt = new Date(Math.round((value - 25569) * 86400000));
        return SG.parseBirthday(new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
      }
      value = String(value);
    }
    let s = String(value).trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
    if (!s) return '';
    let roc = false;
    if (/^民國/.test(s)) { roc = true; s = s.replace(/^民國\s*/, ''); }
    s = s.replace(/^西元\s*/, '');
    let y, m, d, parts;
    if ((parts = s.match(/^(\d{1,4})\s*[\/\-.年]\s*(\d{1,2})\s*[\/\-.月]\s*(\d{1,2})\s*日?$/))) {
      [y, m, d] = parts.slice(1).map(Number);
    } else if (/^\d{8}$/.test(s)) {
      y = +s.slice(0, 4); m = +s.slice(4, 6); d = +s.slice(6, 8);
    } else if (/^\d{6,7}$/.test(s)) { // 民國 YYMMDD / YYYMMDD
      y = +s.slice(0, s.length - 4); m = +s.slice(-4, -2); d = +s.slice(-2); roc = true;
    } else {
      return null;
    }
    if (roc || y < 200) y += 1911;
    return validYmd(y, m, d) ? `${y}-${pad(m)}-${pad(d)}` : null;
  };

  SG.formatRoc = function (iso) {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return p ? `${+p[1] - 1911}/${p[2]}/${p[3]}` : '';
  };
  SG.formatRocLong = function (iso) {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return p ? `民國 ${+p[1] - 1911} 年 ${+p[2]} 月 ${+p[3]} 日` : '';
  };
  SG.age = function (iso) {
    const p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!p) return null;
    const now = new Date();
    let a = now.getFullYear() - +p[1];
    if (now.getMonth() + 1 < +p[2] || (now.getMonth() + 1 === +p[2] && now.getDate() < +p[3])) a--;
    return a;
  };

  /** 電話整理：手機 0920-710404；市話 02-2345-6789；其他保留原文字。 */
  SG.formatPhone = function (value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    let digits = raw.replace(/[^\d]/g, '');
    if (/^886\d{8,9}$/.test(digits)) digits = '0' + digits.slice(3); // +886
    if (/^9\d{8}$/.test(digits)) digits = '0' + digits; // Excel 吃掉開頭 0
    if (/^09\d{8}$/.test(digits)) return `${digits.slice(0, 4)}-${digits.slice(4)}`;   // 手機統一 0920-710404
    if (/^02\d{8}$/.test(digits)) return `02-${digits.slice(2, 6)}-${digits.slice(6)}`;
    if (/^[2-8]\d{7}$/.test(digits)) return `02-${digits.slice(0, 4)}-${digits.slice(4)}`; // 沒寫區碼的台北市話
    if (/^0[3-8]\d{7,8}$/.test(digits)) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return raw;
  };
  SG.phoneDigits = v => String(v ?? '').replace(/[^\d]/g, '');

  SG.normGender = function (value) {
    const s = String(value ?? '').trim();
    if (/^(女|姊妹|姐妹|f|female)$/i.test(s)) return '女';
    if (/^(男|弟兄|兄弟|m|male)$/i.test(s)) return '男';
    return '';
  };
  SG.genderLabel = g => g === '女' ? '姊妹' : g === '男' ? '弟兄' : '';

  /**
   * 一格裡寫了好幾支電話（以空白、/、換行分隔）時拆開。
   * 回傳 { mobiles: [], landlines: [], text: 除了號碼以外的文字（例如「高雄家」「空號」）}
   */
  SG.splitPhones = function (value) {
    const raw = String(value ?? '').trim();
    const out = { mobiles: [], landlines: [], text: '' };
    if (!raw) return out;
    const tokens = raw.match(/[\d\-()（）+]{7,}/g) || [];
    tokens.forEach(t => {
      const f = SG.formatPhone(t);
      const d = SG.phoneDigits(f);
      if (d.length < 7) return;
      (/^09\d{8}$/.test(d) ? out.mobiles : out.landlines).push(f);
    });
    out.text = raw.replace(/[\d\-()（）+\/\s,，、]+/g, ' ').trim();
    return out;
  };

  /** 辨識重複：姓名＋電話末 6 碼＋生日都相同（同名不同人不會被誤判）。 */
  SG.dupKey = p => [String(p.name || '').replace(/\s+/g, ''),
    (SG.phoneDigits(p.mobile) || SG.phoneDigits(p.phone)).slice(-6), p.birthday || ''].join('|');

  // ---------- Firestore ----------
  SG.watchGroups = function (onData, onError) {
    return window.db.collection('groups').onSnapshot(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name), 'zh-Hant'));
      onData(list);
    }, onError);
  };

  SG.watchOptions = function (onData, onError) {
    return window.db.collection('options').doc('lists').onSnapshot(snap => {
      const data = snap.exists ? snap.data() : {};
      const merged = {};
      for (const k of Object.keys(SG.DEFAULT_OPTIONS)) {
        merged[k] = Array.isArray(data[k]) ? data[k] : SG.DEFAULT_OPTIONS[k].slice();
        if (k === 'statuses') merged[k] = merged[k].filter(x => !SG.NOT_STATUS.includes(x));
      }
      onData(merged, snap.exists);
    }, onError);
  };

  // 「加樂同工」是身分不是聚會狀態：舊資料寫成狀態的，一律當作「未歸類」。
  SG.NOT_STATUS = [];
  SG.statusOf = p => (p && p.status && !SG.NOT_STATUS.includes(p.status)) ? p.status : '';

  SG.serverTime = () => firebase.firestore.FieldValue.serverTimestamp();
  SG.stamp = () => ({ updatedAt: SG.serverTime(), updatedBy: window.currentAdminEmail || '' });


  // ---------- 身分與小組對象 ----------
  // 上方「大分類」：姊妹小組、弟兄小組看所屬小組（小組沒設定對象時看性別）；
  // 加樂同工（小組名稱含「同工」）、全職同工（身分）、未分組各自一類。
  SG.WHO = ['姊妹小組', '弟兄小組', '加樂同工', '全職同工', '未分組'];
  SG.CATEGORIES = ['全職同工', '其他'];
  SG.personWho = function (p, groupMap) {
    if (p.category === '全職同工') return '全職同工';
    const g = groupMap && groupMap[p.groupId];
    if (!g) return '未分組';
    if (/同工/.test(g.name)) return '加樂同工';
    const gg = SG.groupGender(g) || p.gender;
    return gg === '男' ? '弟兄小組' : gg === '女' ? '姊妹小組' : '未分組';
  };
  /** 小組的對象：'女' 姊妹小組、'男' 弟兄小組、'' 不限。沒設定時：培榮、文泉是弟兄小組，其他是姊妹小組。 */
  SG.groupGender = function (g) {
    if (!g) return '';
    if (g.gender === '女' || g.gender === '男' || g.gender === '') return g.gender;
    if (/同工/.test(g.name)) return '';
    return /培榮|文泉/.test(g.name) ? '男' : '女';
  };
  /** 某個性別可以選的小組（加上目前已選的那一組，避免舊資料看不到）。 */
  SG.groupsFor = function (groups, gender, keepId) {
    return groups.filter(g => g.id === keepId || (g.active !== false && (!gender || !SG.groupGender(g) || SG.groupGender(g) === gender)));
  };

  // ---------- 牧區 ----------
  SG.watchDistricts = function (onData, onError) {
    return window.db.collection('districts').onSnapshot(snap => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.name).localeCompare(String(b.name), 'zh-Hant')));
    }, onError);
  };
  /** 加樂同工這類「同工」組不屬於任何牧區，只有管理員管。 */
  SG.isStaffGroup = g => !!g && /同工/.test(g.name || '');
  /** 區長的牧區＋小組長的小組 → 可看可改的所有小組（存成 admin_users.scopeGroups 給資料庫規則用） */
  SG.computeScope = function (leadDistricts, leadGroups, groups) {
    const ds = new Set(leadDistricts || []), out = new Set((leadGroups || []).filter(Boolean));
    (groups || []).forEach(g => { if (g.districtId && ds.has(g.districtId) && !SG.isStaffGroup(g)) out.add(g.id); });
    return [...out].sort();
  };
  /** 牧區或小組變動後，重算所有有範圍的帳號（只有管理員可以寫）。回傳更新筆數。 */
  SG.recomputeAllScopes = async function (groups) {
    const snap = await window.db.collection('admin_users').get();
    const batch = window.db.batch();
    let n = 0;
    snap.docs.forEach(d => {
      const v = d.data() || {};
      if (!Array.isArray(v.leadDistricts) && !Array.isArray(v.leadGroups)) return;
      const next = SG.computeScope(v.leadDistricts, v.leadGroups, groups);
      const prev = Array.isArray(v.scopeGroups) ? v.scopeGroups.slice().sort() : [];
      if (next.join('|') === prev.join('|')) return;
      batch.update(d.ref, { scopeGroups: next, updatedAt: SG.serverTime() });
      n++;
    });
    if (n) await batch.commit();
    return n;
  };

  // ---------- 排序：姓名依筆畫 ----------
  // zh-Hant 的預設排序就是筆畫（同筆畫再比部首），與台灣通訊錄習慣一致。
  SG.collator = new Intl.Collator('zh-Hant-TW-u-co-stroke');
  SG.byName = (a, b) => SG.collator.compare(String(a.name || ''), String(b.name || ''));

  // ---------- 會員編號 ----------
  // 沿用點名表的 No.：姊妹是數字（12），弟兄前面有 *（*12）。只顯示在個人資料裡，可搜尋、可排序。
  SG.memberNoNum = v => { const m = String(v ?? '').match(/\d+/); return m ? +m[0] : Infinity; };
  SG.byMemberNo = (a, b) => {
    const ga = 0, gb = 0;
    return ga - gb || SG.memberNoNum(a.memberNo) - SG.memberNoNum(b.memberNo) || SG.byName(a, b);
  };
  /** 新增組員時給下一個編號：姊妹接著最大數字，弟兄接著最大的 *數字。 */
  SG.nextMemberNo = function (persons, gender) {
    const star = false;   // 漢威牧區的編號不分弟兄姊妹
    let max = 0;
    persons.forEach(p => {
      const v = String(p.memberNo || '').trim();
      if (!v || v.startsWith('*') !== star) return;
      const n = SG.memberNoNum(v);
      if (n !== Infinity && n > max) max = n;
    });
    return (star ? '*' : '') + (max + 1);
  };

  // ---------- 頭像：圓角方形，有相片顯示相片，沒有就顯示姓 ----------
  const AVATAR_COLORS = ['#D6336C', '#9C36B5', '#D9480F', '#1971C2', '#2B8A3E', '#5F3DC4', '#0B7285', '#C2255C'];
  SG.avatarColor = function (name) {
    let h = 0;
    for (const ch of String(name || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  };
  SG.avatarHtml = function (p, size = 44) {
    const radius = Math.round(size * 0.26);
    const base = `width:${size}px;height:${size}px;border-radius:${radius}px;flex:none;`;
    if (p.photoThumb && /^data:image\/(jpeg|png|webp);base64,/.test(p.photoThumb)) {
      return `<img class="sr-avatar" src="${SG.esc(p.photoThumb)}" alt="" style="${base}object-fit:cover">`;
    }
    const ch = Array.from(String(p.name || '？').trim())[0] || '？';
    return `<span class="sr-avatar" aria-hidden="true" style="${base}background:${SG.avatarColor(p.name)};font-size:${Math.round(size * 0.44)}px">${SG.esc(ch)}</span>`;
  };

  // ---------- 聚會狀態的顏色 ----------
  const STATUS_STYLE = {
    '委身小組': ['#DFF7E5', '#1B6B34'], '新加入': ['#FFF3C4', '#7A5200'], '已離開': ['#EEEEF2', '#5C5C60'], '聚會小組': ['#DFF7E5', '#1B6B34'], '只來聚會': ['#E3EEFF', '#0B4FA8'], '加樂同工': ['#D7F3F5', '#00646E'],
    '新朋友': ['#FFF3C4', '#7A5200'], '居家休養': ['#FFEBD6', '#9A4A00'], '很久沒來': ['#EEEEF2', '#48484A'],
    '離開教會': ['#EEEEF2', '#5C5C60'], '安息主懷': ['#EEE6FA', '#5B3C99'], '其他': ['#EEEEF2', '#48484A'],
    '未處理': ['#FFE8D6', '#A3460B'], '跟進關懷': ['#FFF3C4', '#7A5200'], '偶爾聚會': ['#E3EEFF', '#0B4FA8'],
    '委身聚會': ['#D7F3F5', '#00646E'], '加入小組': ['#DFF7E5', '#1B6B34'], '暫不加入': ['#EEEEF2', '#48484A']
  };
  SG.statusPill = function (status) {
    if (!status) return '';
    const [bg, fg] = STATUS_STYLE[status] || ['#EEEEF2', '#48484A'];
    return `<span class="sr-pill" style="background:${bg};color:${fg}">${SG.esc(status)}</span>`;
  };

  // ---------- 相片：在瀏覽器裡裁切壓縮，不必另外開檔案儲存空間 ----------
  // thumb：128px 正方形，存在組員資料裡（列表直接顯示，每張約 5KB）
  // full：最長邊 720px，存在 personPhotos/{id}（打開個人資料才讀取）
  SG.makePhoto = async function (file) {
    if (!file || !/^image\//.test(file.type)) throw new Error('請選擇照片檔案');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error('照片讀不出來，請換一張')); i.src = url; });
      const draw = (w, h, sx, sy, sw, sh, q) => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        return c.toDataURL('image/jpeg', q);
      };
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const thumb = draw(128, 128, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0.78);
      const scale = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
      const fw = Math.round(img.naturalWidth * scale), fh = Math.round(img.naturalHeight * scale);
      let full = draw(fw, fh, 0, 0, img.naturalWidth, img.naturalHeight, 0.82);
      if (full.length > 850000) full = draw(fw, fh, 0, 0, img.naturalWidth, img.naturalHeight, 0.6);
      return { thumb, full };
    } finally { URL.revokeObjectURL(url); }
  };

  // ---------- 提示訊息 ----------
  SG.toast = function (message, kind = 'ok') {
    let box = document.getElementById('srToast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'srToast';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.className = 'sr-toast show ' + (kind === 'error' ? 'sr-toast-error' : '');
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.classList.remove('show'), kind === 'error' ? 4500 : 2200);
  };

  /** 靜態階段：身分來自登入頁選的預覽身分（sg_session）。區長＝全部可改；小組長＝自己小組可看可改；組員看不到名冊。 */
  SG.onAccess = function (callback) {
    const s = (window.SGU && SGU.session) || {};
    setTimeout(() => {
      if (s.role === 'district') return callback({ canView: true, isAdmin: true, isViewer: false, isLeader: false, isStaff: true, scopeGroups: [], leadGroups: [], leadDistricts: [] });
      if (s.role === 'leader') {
        window.db.collection('persons').doc(s.personId).get().then(d => {
          const gid = d.exists ? d.data().groupId : '';
          callback({ canView: true, isAdmin: false, isViewer: false, isLeader: true, isStaff: false, scopeGroups: gid ? [gid] : [], leadGroups: gid ? [gid] : [], leadDistricts: [] });
        });
        return;
      }
      callback({ canView: false, isAdmin: false, isViewer: false, isLeader: false, isStaff: false, scopeGroups: [], leadGroups: [], leadDistricts: [] });
    }, 0);
  };
})();
