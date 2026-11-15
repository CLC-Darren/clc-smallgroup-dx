/**
 * 漢威牧區｜初始假資料（靜態階段用）
 * 人名、電話、Email、生日全部是虛構的；小組名稱用真的。
 * 「更多 → 重設假資料」會清掉瀏覽器裡的修改，重新產生這一份。
 */
(function () {
  // 固定種子的亂數：每次重設都產生一樣的資料
  let seed = 20261116;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const chance = p => rnd() < p;
  const pad = n => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const randDate = (y1, y2) => ymd(y1 + Math.floor(rnd() * (y2 - y1 + 1)), 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));

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

  // 虛構姓名（避開 Excel 裡的真實姓名）
  const SURNAMES = ['王', '林', '黃', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '邱', '曾', '廖', '賴', '徐', '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高', '潘', '簡', '朱', '鍾'];
  const GIVEN = ['冠宇', '承恩', '柏翰', '宥廷', '品睿', '家豪', '彥廷', '俊廷', '子軒', '宇翔', '哲瑋', '政諺', '育霖', '昱辰', '致遠', '信宏', '明哲', '志豪', '文傑', '耀中',
    '嘉宏', '偉倫', '俊賢', '士弘', '奕廷', '宗翰', '承翰', '定遠', '以恆', '逸凡', '佑任', '睿恩', '聖傑', '立言', '書亞', '約翰', '恩典', '以諾', '浩然', '凱文'];
  const used = new Set();
  const fakeName = () => { let n; do { n = pick(SURNAMES) + pick(GIVEN); } while (used.has(n)); used.add(n); return n; };
  const LINE_SUFFIX = ['', '🙏', '✨', ' Joshua', ' Ken', ' Andy', ' Leo', '_tw', '0315'];

  const GROUPS = [
    { id: 'g_jianyu', name: '建宇小組', order: 1, active: true, size: 13, leader: '王建宇', founded: '2016-03', note: '' },
    { id: 'g_weixun', name: '威勛小組', order: 2, active: true, size: 10, leader: '林威勛', founded: '2017-09', note: '2026.3 分植書豪小組' },
    { id: 'g_shuhao', name: '書豪小組', order: 3, active: true, size: 11, leader: '黃書豪', founded: '2026-03', from: 'g_weixun', note: '2026.3 自威勛小組分植' },
    { id: 'g_zhongxiong', name: '忠雄小組', order: 4, active: true, size: 9, leader: '吳忠雄', founded: '2019-12', note: '2019.12 分植；2026.9 啟宏小組併入' },
    { id: 'g_qihong', name: '啟宏小組', order: 5, active: false, size: 0, leader: '', founded: '2024-10', from: 'g_jianyu', note: '2024.10 自建宇小組分植；2026.9 併入忠雄小組', mergedInto: 'g_zhongxiong' },
    { id: 'g_zongjian', name: '宗鍵小組', order: 6, active: false, size: 0, leader: '', founded: '2023-01', note: '2023 加入、2025 離開牧區' },
    { id: 'g_huiru', name: '暉儒小組', order: 7, active: false, size: 0, leader: '', founded: '2016-01', note: '2024 離開牧區' },
    { id: 'g_qiming', name: '啟名小組', order: 8, active: false, size: 0, leader: '', founded: '2023-01', note: '2023 加入、2024 離開牧區' }
  ];
  const STATUS_W = [['委身小組', 0.62], ['新加入', 0.14], ['只來聚會', 0.1], ['很久沒來', 0.1], ['其他', 0.04]];
  const pickStatus = () => { let r = rnd(), s = 0; for (const [k, w] of STATUS_W) { s += w; if (r < s) return k; } return '委身小組'; };

  function courseProgress(level) {
    // level 0~1：越高完成越多；每項給一個完成日期
    const out = {};
    let year = 2017 + Math.floor(rnd() * 7);
    COURSES.forEach((cat, ci) => {
      cat.items.forEach(it => {
        const need = ci === 0 ? 0.15 : 0.12 + ci * 0.17;
        if (level > need + rnd() * 0.15) { out[it.id] = randDate(Math.min(year, 2026), Math.min(year + 1, 2026)); }
      });
      year += 1;
    });
    return out;
  }

  window.SG_SEED = function () {
    const store = { districts: {}, groups: {}, options: {}, persons: {}, personPhotos: {} };
    const ms = Date.now();
    store.districts.d_hanwei = { name: '漢威牧區', order: 1 };
    GROUPS.forEach(g => {
      store.groups[g.id] = { name: g.name, order: g.order, active: g.active, districtId: 'd_hanwei', gender: '男', founded: g.founded, from: g.from || '', mergedInto: g.mergedInto || '', note: g.note };
    });
    store.options.lists = {
      statuses: ['委身小組', '新加入', '只來聚會', '很久沒來', '已離開', '其他'],
      marital: ['已婚', '未婚'],
      living: ['家人同住', '獨居', '租屋', '其他'],
      ministries: MINISTRIES,
      courses: COURSES
    };
    let no = 0;
    GROUPS.filter(g => g.active).forEach(g => {
      for (let i = 0; i < g.size; i++) {
        const isLeader = i === 0;
        const name = isLeader ? g.leader : fakeName();
        used.add(name);
        const status = isLeader ? '委身小組' : pickStatus();
        const level = isLeader ? 0.95 : status === '委身小組' ? rnd() : status === '新加入' ? rnd() * 0.25 : rnd() * 0.5;
        const mins = isLeader ? ['小組長'] : MINISTRIES.slice(1).filter(() => chance(status === '委身小組' ? 0.14 : 0.03)).slice(0, 2);
        if (i === 1 && !mins.includes('副小組長')) mins.unshift('副小組長');
        const by = 1982 + Math.floor(rnd() * 21);
        const mobile = `09${Math.floor(10 + rnd() * 89)}-${String(Math.floor(rnd() * 1e6)).padStart(6, '0')}`;
        const id = 'p' + String(++no).padStart(3, '0');
        const care = [];
        if (chance(0.45)) care.push({ date: randDate(2026, 2026), text: pick(['最近工作很忙，週末加班，約了下週一起吃飯。', '家人身體不適，需要代禱與關心。', '開始穩定來小組，對受洗有興趣。', '換新工作，適應中，鼓勵他持續 QT。', '和小組長一對一，分享最近的掙扎，彼此禱告。']), by: g.leader });
        if (chance(0.25)) care.push({ date: randDate(2025, 2025), text: pick(['參加經歷神營會後很有感動。', '搬家到新北，通勤時間變長。', '準備結婚，邀請參加婚前輔導。']), by: g.leader });
        store.persons[id] = {
          name, gender: '男', birthday: ymd(by, 1 + Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)),
          mobile, phone: '', address: chance(0.5) ? pick(['新北市板橋區', '新北市新莊區', '台北市萬華區', '新北市中和區', '台北市大安區']) : '',
          lineId: name.slice(1) + pick(LINE_SUFFIX), email: `member${no}@example.com`,
          joinDate: status === '新加入' ? randDate(2026, 2026) : randDate(2012, 2025),
          marital: by < 1993 ? (chance(0.6) ? '已婚' : '未婚') : (chance(0.2) ? '已婚' : '未婚'), living: '',
          groupId: g.id, status, ministries: mins, memberNo: String(no),
          courses: courseProgress(level),
          bible: { 2025: chance(0.4) ? 'done' : chance(0.3) ? 'signed' : '', 2026: chance(0.45) ? 'done' : chance(0.3) ? 'signed' : '' },
          careLogs: care.sort((a, b) => b.date.localeCompare(a.date)),
          note: '', source: 'manual',
          createdAt: { __ms: ms - Math.floor(rnd() * 3e10) }, updatedAt: { __ms: ms }, updatedBy: ''
        };
      }
    });
    return store;
  };
  window.SG_COURSES_DEFAULT = COURSES;
  window.SG_MINISTRIES_DEFAULT = MINISTRIES;
})();
