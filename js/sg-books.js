/* 漢威牧區｜聖經 66 卷與「我的領地」的代表物（平台內容：用資料描述，不寫死在畫面程式裡）。
 * kind：place 建築／地點、npc 人物、letter 書信（個人書房）、end 終點。代表物仍待 Darren 確認。 */
window.SG_REGIONS = [
  { id: 'law', name: '摩西五經' }, { id: 'history', name: '歷史書' }, { id: 'poetry', name: '詩歌智慧書' },
  { id: 'major', name: '大先知書' }, { id: 'minor', name: '小先知書' }, { id: 'gospel', name: '福音書' },
  { id: 'acts', name: '使徒行傳' }, { id: 'paul', name: '保羅書信' }, { id: 'general', name: '一般書信' }, { id: 'rev', name: '啟示錄' }
];
window.SG_BOOKS = [
  ['gen', '創世記', 'law', 'place', '伊甸園'], ['exo', '出埃及記', 'law', 'place', '西奈山'], ['lev', '利未記', 'law', 'place', '祭壇'],
  ['num', '民數記', 'law', 'place', '曠野營地'], ['deu', '申命記', 'law', 'place', '尼波山'],
  ['jos', '約書亞記', 'history', 'place', '吉甲十二石'], ['jdg', '士師記', 'history', 'place', '底波拉的棕樹'], ['rut', '路得記', 'history', 'npc', '路得'],
  ['1sa', '撒母耳記上', 'history', 'place', '以拉谷'], ['2sa', '撒母耳記下', 'history', 'place', '大衛城'], ['1ki', '列王紀上', 'history', 'place', '所羅門聖殿'],
  ['2ki', '列王紀下', 'history', 'place', '迦密山'], ['1ch', '歷代志上', 'history', 'place', '約櫃'], ['2ch', '歷代志下', 'history', 'place', '聖殿的院'],
  ['ezr', '以斯拉記', 'history', 'place', '重建的聖殿'], ['neh', '尼希米記', 'history', 'place', '耶路撒冷城牆'], ['est', '以斯帖記', 'history', 'npc', '以斯帖'],
  ['job', '約伯記', 'poetry', 'npc', '約伯'], ['psa', '詩篇', 'poetry', 'place', '大衛的豎琴'], ['pro', '箴言', 'poetry', 'place', '智慧的房子'],
  ['ecc', '傳道書', 'poetry', 'place', '日晷'], ['sng', '雅歌', 'poetry', 'place', '葡萄園'],
  ['isa', '以賽亞書', 'major', 'npc', '以賽亞'], ['jer', '耶利米書', 'major', 'npc', '耶利米'], ['lam', '耶利米哀歌', 'major', 'place', '傾倒的城門'],
  ['ezk', '以西結書', 'major', 'npc', '以西結'], ['dan', '但以理書', 'major', 'npc', '但以理'],
  ['hos', '何西阿書', 'minor', 'npc', '何西阿'], ['jol', '約珥書', 'minor', 'npc', '約珥'], ['amo', '阿摩司書', 'minor', 'npc', '阿摩司'], ['oba', '俄巴底亞書', 'minor', 'npc', '俄巴底亞'],
  ['jon', '約拿書', 'minor', 'npc', '約拿'], ['mic', '彌迦書', 'minor', 'npc', '彌迦'], ['nam', '那鴻書', 'minor', 'npc', '那鴻'], ['hab', '哈巴谷書', 'minor', 'npc', '哈巴谷'],
  ['zep', '西番雅書', 'minor', 'npc', '西番雅'], ['hag', '哈該書', 'minor', 'npc', '哈該'], ['zec', '撒迦利亞書', 'minor', 'npc', '撒迦利亞'], ['mal', '瑪拉基書', 'minor', 'npc', '瑪拉基'],
  ['mat', '馬太福音', 'gospel', 'place', '山上寶訓的山'], ['mrk', '馬可福音', 'gospel', 'place', '加利利海的船'], ['luk', '路加福音', 'gospel', 'place', '伯利恆的馬槽'], ['jhn', '約翰福音', 'gospel', 'place', '空墳墓'],
  ['act', '使徒行傳', 'acts', 'place', '港口'],
  ['rom', '羅馬書', 'paul', 'letter', '給羅馬的信'], ['1co', '哥林多前書', 'paul', 'letter', '給哥林多的信（一）'], ['2co', '哥林多後書', 'paul', 'letter', '給哥林多的信（二）'],
  ['gal', '加拉太書', 'paul', 'letter', '給加拉太的信'], ['eph', '以弗所書', 'paul', 'letter', '給以弗所的信'], ['php', '腓立比書', 'paul', 'letter', '給腓立比的信'],
  ['col', '歌羅西書', 'paul', 'letter', '給歌羅西的信'], ['1th', '帖撒羅尼迦前書', 'paul', 'letter', '給帖撒羅尼迦的信（一）'], ['2th', '帖撒羅尼迦後書', 'paul', 'letter', '給帖撒羅尼迦的信（二）'],
  ['1ti', '提摩太前書', 'paul', 'letter', '給提摩太的信（一）'], ['2ti', '提摩太後書', 'paul', 'letter', '給提摩太的信（二）'], ['tit', '提多書', 'paul', 'letter', '給提多的信'], ['phm', '腓利門書', 'paul', 'letter', '給腓利門的信'],
  ['heb', '希伯來書', 'general', 'letter', '給希伯來人的信'], ['jas', '雅各書', 'general', 'letter', '雅各的信'], ['1pe', '彼得前書', 'general', 'letter', '彼得的信（一）'], ['2pe', '彼得後書', 'general', 'letter', '彼得的信（二）'],
  ['1jn', '約翰一書', 'general', 'letter', '約翰的信（一）'], ['2jn', '約翰二書', 'general', 'letter', '約翰的信（二）'], ['3jn', '約翰三書', 'general', 'letter', '約翰的信（三）'], ['jud', '猶大書', 'general', 'letter', '猶大的信'],
  ['rev', '啟示錄', 'rev', 'end', '新耶路撒冷']
].map(([id, name, region, kind, rep]) => ({ id, name, region, kind, rep }));
/** 全副軍裝（以弗所書 6:14–17）；對應生命建造程序為示意，待 Darren 確認 */
window.SG_ARMOR = [
  { id: 'belt', name: '真理的帶子', icon: '🎗️', by: ['exp'], hint: '經歷神' },
  { id: 'breast', name: '公義的護心鏡', icon: '🛡️', by: ['bap'], hint: '受洗' },
  { id: 'shoes', name: '平安的福音鞋', icon: '👟', by: ['c1'], hint: '完成 C1' },
  { id: 'shield', name: '信德的藤牌', icon: '🔰', by: ['c2'], hint: '完成 C2' },
  { id: 'helmet', name: '救恩的頭盔', icon: '⛑️', by: ['c3'], hint: '完成 C3' },
  { id: 'sword', name: '聖靈的寶劍', icon: '🗡️', by: ['c4', 'c5'], hint: '完成 C4、C5' }
];
