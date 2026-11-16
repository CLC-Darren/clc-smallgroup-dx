/**
 * 漢威牧區｜初始假資料（靜態階段用）
 * 人名、電話、Email、生日、貼文全部是虛構的；小組名稱與年度紀錄合計數字是真的。
 * 「齒輪 → 後台 → 重設假資料」會清掉瀏覽器裡的修改，重新產生這一份。
 */
(function () {
  let seed = 20261116;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const chance = p => rnd() < p;
  const pad = n => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const iso = d => ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const randDate = (y1, y2) => ymd(y1 + Math.floor(rnd() * (y2 - y1 + 1)), 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
  const NOW = new Date();
  const daysAgo = n => { const d = new Date(NOW); d.setDate(d.getDate() - n); return d; };

  const COURSES = [
    { id: 'm', title: '里程碑', items: [{ id: 'exp', name: '經歷神' }, { id: 'bap', name: '受洗' }] },
    { id: 'c1', title: 'C1 委身於教會', items: [{ id: 'c1a', name: 'C1 一、二課' }, { id: 'c1b', name: 'C1 三、四課' }, { id: 'c1x', name: 'C1 考試' }] },
    { id: 'c2', title: 'C2 委身於成熟', items: [{ id: 'c2m', name: '榮耀男人／幸福女人' }, { id: 'c2q', name: 'QT 研習營' }, { id: 'c2p', name: '父母 INTO' },
      { id: 'c2a', name: 'C2 一、二課' }, { id: 'c2b', name: 'C2 三、四課' }, { id: 'c2c', name: 'C2 第五課' }, { id: 'c2x', name: 'C2 考試' }] },
    { id: 'c3', title: 'C3 委身於宣教', items: [{ id: 'c3a', name: 'C3 一、二、三課' }, { id: 'c3b', name: 'C3 四、五、六課' }] },
    { id: 'c4', title: 'C4 委身於服事', items: [{ id: 'c4a', name: '小組長訓練' }, { id: 'c4b', name: '九型人格' }, { id: 'c4c', name: '人際關係' }] },
    { id: 'c5', title: 'C5 委身於門訓', items: [{ id: 'c5a', name: '門徒班' }, { id: 'c5b', name: '領導力' }] }
  ];
  const MINISTRIES = ['小組長', '副小組長', '核心同工', '主日PPT', '敬拜團', '司琴', '影音', '招待', '安總', '關懷'];
  const SURNAMES = ['王', '林', '黃', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '邱', '曾', '廖', '賴', '徐', '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高', '潘', '簡', '朱', '鍾'];
  const GIVEN = ['冠宇', '承恩', '柏翰', '宥廷', '品睿', '家豪', '彥廷', '俊廷', '子軒', '宇翔', '哲瑋', '政諺', '育霖', '昱辰', '致遠', '信宏', '明哲', '志豪', '文傑', '耀中',
    '嘉宏', '偉倫', '俊賢', '士弘', '奕廷', '宗翰', '承翰', '定遠', '以恆', '逸凡', '佑任', '睿恩', '聖傑', '立言', '書亞', '約翰', '恩典', '以諾', '浩然', '凱文'];
  const used = new Set();
  const fakeName = () => { let n; do { n = pick(SURNAMES) + pick(GIVEN); } while (used.has(n)); used.add(n); return n; };
  const LINE_SUFFIX = ['', '🙏', '✨', ' Joshua', ' Ken', ' Andy', ' Leo', '_tw', '0315'];

  // 聚會時間：區長在後台幫各組設定（小組長不能改）
  const GROUPS = [
    { id: 'g_jianyu', name: '建宇小組', order: 1, active: true, size: 13, leader: '王建宇', founded: '2016-03', time: '20:00–21:30', note: '' },
    { id: 'g_weixun', name: '威勛小組', order: 2, active: true, size: 10, leader: '林威勛', founded: '2017-09', time: '16:00–17:30', note: '2026.3 分植書豪小組' },
    { id: 'g_shuhao', name: '書豪小組', order: 3, active: true, size: 11, leader: '黃書豪', founded: '2026-03', from: 'g_weixun', time: '21:00–22:00', note: '2026.3 自威勛小組分植' },
    { id: 'g_zhongxiong', name: '忠雄小組', order: 4, active: true, size: 9, leader: '吳忠雄', founded: '2019-12', time: '20:00–21:30', note: '2019.12 分植；2026.9 啟宏小組併入' },
    { id: 'g_qihong', name: '啟宏小組', order: 5, active: false, size: 0, founded: '2024-10', from: 'g_jianyu', mergedInto: 'g_zhongxiong', note: '2024.10 自建宇小組分植；2026.9 併入忠雄小組' },
    { id: 'g_zongjian', name: '宗鍵小組', order: 6, active: false, size: 0, founded: '2023-01', note: '2023 加入、2025 離開牧區' },
    { id: 'g_huiru', name: '暉儒小組', order: 7, active: false, size: 0, founded: '2016-01', note: '2024 離開牧區' },
    { id: 'g_qiming', name: '啟名小組', order: 8, active: false, size: 0, founded: '2023-01', note: '2023 加入、2024 離開牧區' }
  ];
  const STATUS_W = [['委身小組', 0.62], ['新加入', 0.14], ['只來聚會', 0.1], ['很久沒來', 0.1], ['其他', 0.04]];
  const pickStatus = () => { let r = rnd(), s = 0; for (const [k, w] of STATUS_W) { s += w; if (r < s) return k; } return '委身小組'; };

  function courseProgress(level) {
    const out = {};
    let year = 2017 + Math.floor(rnd() * 7);
    COURSES.forEach((cat, ci) => {
      cat.items.forEach(it => {
        const need = ci === 0 ? 0.15 : 0.12 + ci * 0.17;
        if (level > need + rnd() * 0.15) out[it.id] = randDate(Math.min(year, 2026), Math.min(year + 1, 2026));
      });
      year += 1;
    });
    return out;
  }

  window.SG_SEED = function () {
    const ms = Date.now();
    const at = d => ({ __ms: d.getTime() });
    const S = { districts: {}, groups: {}, options: {}, persons: {}, personPhotos: {}, posts: {}, daily: {}, attendance: {},
      funds: {}, visits: {}, meetings: {}, events: {}, handbook: {}, annual: {}, intakes: {}, intakePhotos: {} };
    S.districts.d_hanwei = { name: '漢威牧區', order: 1 };
    GROUPS.forEach(g => {
      S.groups[g.id] = { name: g.name, order: g.order, active: g.active, districtId: 'd_hanwei', gender: '男', founded: g.founded, from: g.from || '',
        mergedInto: g.mergedInto || '', note: g.note, meetDay: 6, meetTime: g.time || '', lineUrl: '' };
    });
    S.options.lists = { statuses: ['委身小組', '新加入', '只來聚會', '很久沒來', '已離開', '其他'], marital: ['已婚', '未婚'],
      living: ['家人同住', '獨居', '租屋', '其他'], ministries: MINISTRIES, courses: COURSES };
    S.options.app = {
      verseMode: 'rotate', fixedVerse: 'v01', verses: (window.SG_VERSES || []).map(v => v.id),
      tasks: [{ id: 'qt', name: 'QT', icon: '📖' }, { id: 'pray', name: '禱告', icon: '🙏' }],
      features: { tasks: true, cards: true, journey: true, goal: true, badges: true },
      monthGoal: 120, graceDays: 1,
      meetTimes: ['16:00–17:30', '20:00–21:30', '21:00–22:00']
    };

    // ---------- 人 ----------
    used.add('漢威');
    S.persons.p_hanwei = { name: '漢威', gender: '男', birthday: '1980-11-16', mobile: '0900-000000', phone: '', address: '', lineId: '漢威', email: 'hanwei@example.com',
      joinDate: '2010-01-01', marital: '已婚', living: '', groupId: '', status: '委身小組', ministries: ['區長'], memberNo: '0', role: 'district',
      courses: courseProgress(1), bible: { 2025: 'done', 2026: 'done' }, careLogs: [], note: '區長（預覽用）', source: 'manual', createdAt: at(daysAgo(900)), updatedAt: at(NOW), updatedBy: '' };
    let no = 0;
    const byGroup = {};
    GROUPS.filter(g => g.active).forEach(g => {
      byGroup[g.id] = [];
      for (let i = 0; i < g.size; i++) {
        const isLeader = i === 0;
        const name = isLeader ? g.leader : fakeName();
        used.add(name);
        const status = isLeader ? '委身小組' : pickStatus();
        const level = isLeader ? 0.95 : status === '委身小組' ? rnd() : status === '新加入' ? rnd() * 0.25 : rnd() * 0.5;
        const mins = isLeader ? ['小組長'] : MINISTRIES.slice(1).filter(() => chance(status === '委身小組' ? 0.14 : 0.03)).slice(0, 2);
        if (i === 1 && !mins.includes('副小組長')) mins.unshift('副小組長');
        const by = 1982 + Math.floor(rnd() * 21);
        // 讓本月、今天各有幾位壽星
        let bm = 1 + Math.floor(rnd() * 12), bd = 1 + Math.floor(rnd() * 28);
        if (no % 9 === 3) { bm = NOW.getMonth() + 1; }
        if (no === 6) { bm = NOW.getMonth() + 1; bd = NOW.getDate(); }
        const id = 'p' + String(++no).padStart(3, '0');
        const care = [];
        if (chance(0.45)) care.push({ date: randDate(2026, 2026), text: pick(['最近工作很忙，週末加班，約了下週一起吃飯。', '家人身體不適，需要代禱與關心。', '開始穩定來小組，對受洗有興趣。', '換新工作，適應中，鼓勵他持續 QT。', '和小組長一對一，分享最近的掙扎，彼此禱告。']), by: g.leader });
        S.persons[id] = {
          name, gender: '男', birthday: ymd(by, bm, bd),
          mobile: `09${Math.floor(10 + rnd() * 89)}-${String(Math.floor(rnd() * 1e6)).padStart(6, '0')}`, phone: '',
          address: chance(0.5) ? pick(['新北市板橋區', '新北市新莊區', '台北市萬華區', '新北市中和區', '台北市大安區']) : '',
          lineId: name.slice(1) + pick(LINE_SUFFIX), email: `member${no}@example.com`,
          joinDate: status === '新加入' ? randDate(2026, 2026) : randDate(2012, 2025),
          marital: by < 1993 ? (chance(0.6) ? '已婚' : '未婚') : (chance(0.2) ? '已婚' : '未婚'), living: '',
          groupId: g.id, status, ministries: mins, memberNo: String(no), role: isLeader ? 'leader' : 'member',
          courses: courseProgress(level),
          bible: { 2025: chance(0.4) ? 'done' : chance(0.3) ? 'signed' : '', 2026: chance(0.45) ? 'done' : chance(0.3) ? 'signed' : '' },
          careLogs: care.sort((a, b) => b.date.localeCompare(a.date)),
          note: '', source: 'manual', createdAt: at(daysAgo(Math.floor(rnd() * 400))), updatedAt: at(NOW), updatedBy: ''
        };
        byGroup[g.id].push({ id, name, status, level });
      }
    });

    // ---------- 每日任務（只有自己看得到）：過去 70 天 ----------
    const CARD_IDS = (window.SG_VERSES || []).map(v => v.id);
    Object.entries(S.persons).forEach(([id, p]) => {
      const rate = p.role === 'leader' || p.role === 'district' ? 0.85 : p.status === '委身小組' ? 0.55 + rnd() * 0.3 : p.status === '新加入' ? 0.3 : 0.12;
      const days = {}, cards = [];
      for (let n = 70; n >= 1; n--) {
        const d = iso(daysAgo(n));
        const qt = chance(rate), pray = chance(Math.min(1, rate + 0.1));
        if (qt || pray) days[d] = { qt, pray };
        if (qt && pray && chance(0.6)) cards.push({ id: pick(CARD_IDS), at: d });
      }
      // 聖經主線：讀完次數（示意）
      const order = ['gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', 'mat', 'mrk', 'luk', 'jhn', 'act', 'psa', 'pro', 'jon'];
      const books = {}; const nRead = Math.floor(rate * order.length * rnd() * 1.4);
      order.slice(0, nRead).forEach((b, k) => { books[b] = 1 + (k < 3 && chance(0.4) ? 1 : 0); });
      S.daily[id] = { days, cards, received: [], giftsSent: 0, books };
    });

    // ---------- 點名：過去 16 個星期六 ----------
    const lastSat = new Date(NOW); lastSat.setDate(lastSat.getDate() - ((lastSat.getDay() + 1) % 7));
    for (let w = 0; w < 16; w++) {
      const d = new Date(lastSat); d.setDate(d.getDate() - 7 * w);
      const date = iso(d);
      const special = w === 6 ? '聯合主日' : w === 11 ? '特會' : '';
      Object.entries(byGroup).forEach(([gid, list]) => {
        if (w === 0 && gid === 'g_shuhao') return;   // 讓書豪小組上週還沒點名
        const present = special ? [] : list.filter(m => chance(m.status === '委身小組' ? 0.85 : m.status === '新加入' ? 0.6 : 0.2)).map(m => m.id);
        S.attendance[gid + '_' + date] = { groupId: gid, date, present, guests: special ? 0 : Math.floor(rnd() * 3), special, by: '', at: at(d) };
      });
    }

    // ---------- 小組基金（只記收支） ----------
    let fn = 0;
    Object.keys(byGroup).forEach(gid => {
      for (let k = 0; k < 7; k++) {
        const inc = k % 3 === 0;
        S.funds['f' + (++fn)] = { groupId: gid, date: iso(daysAgo(10 + k * 17)), type: inc ? 'income' : 'expense',
          item: inc ? pick(['每月小組奉獻', '小組奉獻', '活動結餘']) : pick(['愛宴食材', '聚會點心', '生日蛋糕', '佈置材料', '新朋友小禮物']),
          amount: inc ? 1000 + Math.floor(rnd() * 20) * 100 : 200 + Math.floor(rnd() * 15) * 50, by: '' };
      }
    });

    // ---------- 安德烈探訪：每年次數 ----------
    const A = window.SG_ANNUAL || {};
    Object.keys(byGroup).forEach(gid => {
      const v = (A[gid] && A[gid].visits) || {};
      [2025, 2026].forEach(y => { S.visits[gid + '_' + y] = { groupId: gid, year: y, count: (v[y + 'H1'] || 0) + (v[y + 'H2'] || 0) }; });
    });

    // ---------- 年度紀錄（Excel 匯入的數字） ----------
    Object.entries(A).forEach(([key, values]) => { S.annual[key] = { values }; });

    // ---------- 牧養手冊 ----------
    (window.SG_HANDBOOK || []).forEach((h, i) => { S.handbook['h' + (i + 1)] = { title: h.title, body: h.body, order: i + 1 }; });

    // ---------- 會議記錄（虛構內容） ----------
    S.meetings.m1 = { date: '2026-10-17', time: '9:00–11:30', place: '區長家', topics: '1. 年底活動\n2. 新朋友跟進\n3. 2027 牧區目標', notes: '・聖誕節各組邀約名單，12 月第一週回報\n・新朋友兩週內要有一次一對一\n・2027 目標下次會議再討論', by: '漢威' };
    S.meetings.m2 = { date: '2026-06-20', time: '19:00–21:00', place: '線上', topics: '1. 上半年回顧（年度紀錄）\n2. 書豪小組分植後狀況', notes: '・上半年週平均穩定\n・書豪小組需要多一位核心同工', by: '漢威' };
    S.meetings.m3 = { date: '2026-02-14', time: '9:00–11:30', place: '區長家', topics: '1. 教會異象\n2. 威勛小組分植\n3. 經歷神營會推動', notes: '・3 月完成分植\n・每組至少推 2 位參加經歷神', by: '漢威' };

    // ---------- 活動行事曆 ----------
    const ev = (n, title, place, scope, groupId) => ({ date: iso(daysAgo(-n)), title, place, scope, groupId: groupId || '', by: '漢威' });
    S.events.e1 = ev(5, '牧區聯合小組', '教會 B1', 'district');
    S.events.e2 = ev(19, '聖誕節佈道會', '主堂', 'church');
    S.events.e3 = ev(33, '牧區年終感恩餐會', '待定', 'district');
    S.events.e4 = ev(60, '經歷神營會', '三峽', 'church');
    S.events.e5 = ev(12, '建宇小組 愛宴', '組長家', 'group', 'g_jianyu');

    // ---------- 動態牆 ----------
    let pn = 0;
    const pid = gid => pick(byGroup[gid]).id;
    const post = (daysBack, hours, data) => {
      const d = daysAgo(daysBack); d.setHours(hours, Math.floor(rnd() * 60));
      S.posts['post' + String(++pn).padStart(3, '0')] = { reactions: { amen: [], heart: [] }, prayedBy: [], comments: [], scope: 'group', ...data, createdAt: at(d) };
    };
    const someIds = (gid, n) => byGroup[gid].filter(() => chance(0.5)).slice(0, n).map(m => m.id);
    post(0, 7, { type: 'qt', author: pid('g_jianyu'), groupId: 'g_jianyu', ref: '詩篇 23 篇', text: '今天讀到「祂使我躺臥在青草地上」，提醒我這週不要一直趕，先在神面前安靜。', reactions: { amen: someIds('g_jianyu', 5), heart: someIds('g_jianyu', 2) } });
    post(0, 9, { type: 'prayer', author: pid('g_weixun'), groupId: 'g_weixun', text: '下週二有一個重要的面試，請大家為我禱告，求神開路，也讓我有平安。', prayedBy: someIds('g_weixun', 6), comments: [{ by: byGroup.g_weixun[0].id, text: '為你禱告！面試前可以傳訊息給我', at: at(daysAgo(0)) }] });
    post(1, 21, { type: 'milestone', author: byGroup.g_shuhao[2].id, groupId: 'g_shuhao', badge: 'c1', text: '完成了 C1 委身於教會 🎓', reactions: { amen: [], heart: someIds('g_shuhao', 7) } });
    post(1, 12, { type: 'gift', author: byGroup.g_jianyu[0].id, to: byGroup.g_jianyu[3].id, groupId: 'g_jianyu', card: 'v07', text: '這週辛苦了，送你這句話！' });
    post(2, 8, { type: 'testimony', author: pid('g_zhongxiong'), groupId: 'g_zhongxiong', scope: 'district', text: '上個月工作上一直卡關，小組大家陪我禱告。這週主管主動調整專案，壓力少了很多。真的感謝神，也謝謝小組的弟兄！', reactions: { amen: someIds('g_zhongxiong', 6), heart: someIds('g_jianyu', 4) }, comments: [{ by: byGroup.g_zhongxiong[0].id, text: '感謝主！🙌', at: at(daysAgo(2)) }] });
    post(2, 20, { type: 'mood', author: pid('g_jianyu'), groupId: 'g_jianyu', text: '今天小組的愛宴太好吃了，謝謝負責的弟兄 😋', reactions: { amen: [], heart: someIds('g_jianyu', 8) } });
    post(3, 10, { type: 'goal', groupId: 'g_jianyu', author: '', text: '建宇小組本月 QT 已經走到「以弗所」！再 60 次就到米利都 🚶' });
    post(3, 22, { type: 'qt', author: pid('g_shuhao'), groupId: 'g_shuhao', ref: '腓立比書 4:6-7', text: '應當一無掛慮。我把這週擔心的三件事寫下來，一件一件交給神。' });
    post(4, 9, { type: 'event', author: 'p_hanwei', groupId: '', scope: 'district', text: '牧區聯合小組在下週六晚上，教會 B1，請各組小組長回報人數 🙏', event: 'e1' });
    post(5, 19, { type: 'prayer', author: pid('g_jianyu'), groupId: 'g_jianyu', text: '爸爸下週要開刀，求主保守手術順利。', prayedBy: someIds('g_jianyu', 9) });
    post(6, 13, { type: 'milestone', author: byGroup.g_weixun[4].id, groupId: 'g_weixun', badge: 'bap', text: '今天受洗了！歡迎成為神家的一份子 💧', scope: 'district', reactions: { amen: someIds('g_weixun', 8), heart: someIds('g_zhongxiong', 5) } });
    post(7, 8, { type: 'qt', author: pid('g_zhongxiong'), groupId: 'g_zhongxiong', ref: '以賽亞書 40:31', text: '等候神的必從新得力。最近很累，求神給我新的力量。' });

    // 有照片、影片的貼文（假圖：images/feed/）
    const F_ = 'images/feed/';
    post(0, 6, { type: 'qt', author: pid('g_shuhao'), groupId: 'g_shuhao', ref: '詩篇 5:3', text: '早晨，耶和華啊，你必聽我的聲音。今天早起在頂樓讀經，天空好美。', media: [{ type: 'image', src: F_ + 'qt-dawn.webp' }], reactions: { amen: someIds('g_shuhao', 5), heart: someIds('g_shuhao', 4) } });
    post(1, 22, { type: 'mood', author: pid('g_jianyu'), groupId: 'g_jianyu', text: '營火之夜！謝謝大家一起唱到最後 🔥', media: [{ type: 'video', src: F_ + 'campfire.mp4', poster: F_ + 'campfire.webp' }], reactions: { amen: [], heart: someIds('g_jianyu', 9) } });
    post(2, 21, { type: 'testimony', author: pid('g_weixun'), groupId: 'g_weixun', scope: 'district', text: '牧區海邊退修會回來，最感動的是晚上的敬拜，好久沒有這樣單純地享受神的同在。', media: [{ type: 'image', src: F_ + 'beach-retreat.webp' }, { type: 'image', src: F_ + 'worship.webp' }], reactions: { amen: someIds('g_weixun', 7), heart: someIds('g_weixun', 6) } });
    post(4, 20, { type: 'mood', author: pid('g_zhongxiong'), groupId: 'g_zhongxiong', text: '忠雄小組愛宴，每個人帶一道菜，吃到撐 😋', media: [{ type: 'image', src: F_ + 'love-feast.webp' }, { type: 'image', src: F_ + 'campfire.webp' }, { type: 'image', src: F_ + 'worship.webp' }], reactions: { amen: [], heart: someIds('g_zhongxiong', 8) } });

    // ---------- 新朋友（照 SR 的新朋友名單） ----------
    [['蕭宇恩', 'g_jianyu', '跟進關懷', 3], ['潘柏睿', 'g_weixun', '', 1], ['簡志遠', 'g_shuhao', '偶爾聚會', 12]].forEach(([name, gid, status, n], i) => {
      S.intakes['i' + (i + 1)] = { name, gender: '男', birthday: randDate(1995, 2003), mobile: `09${Math.floor(10 + rnd() * 89)}-${String(Math.floor(rnd() * 1e6)).padStart(6, '0')}`,
        groupId: gid, groupName: S.groups[gid].name, status, source: 'form', refName: byGroup[gid][1].name, refRelation: '同事', faith: ['慕道中'], intent: ['認識朋友'],
        note: '', createdAt: at(daysAgo(n)) };
    });
    return S;
  };
  window.SG_COURSES_DEFAULT = COURSES;
  window.SG_MINISTRIES_DEFAULT = MINISTRIES;
})();
