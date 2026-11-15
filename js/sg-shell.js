/* 漢威牧區｜外框：導覽列（手機底部、電腦左側）與深淺色
 * 每頁 <body data-page="home|members|care|fellowship|more">，內容放在 <main class="sg-main">。
 * 深淺色在 <head> 的小段程式先套用（避免閃一下），這裡負責切換與記住。 */
(function () {
  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    members: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>',
    care: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    fellowship: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>',
    more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'
  };
  const TABS = [
    ['home', 'index.html', '總覽'], ['members', 'members.html', '名冊'], ['care', 'care.html', '牧養'],
    ['fellowship', 'fellowship.html', '團契'], ['more', 'more.html', '更多']
  ];
  const icon = (k, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;
  const cur = document.body.dataset.page;
  const link = ([k, href, label], size) => `<a href="${href}"${k === cur ? ' aria-current="page"' : ''}>${icon(k, size)}<span>${label}</span></a>`;

  const side = document.createElement('nav');
  side.className = 'sg-side'; side.setAttribute('aria-label', '主選單');
  side.innerHTML = `<div class="sg-brand">漢威牧區管理<small>靜態預覽・假資料</small></div>` + TABS.map(t => link(t, 20)).join('');
  const bar = document.createElement('nav');
  bar.className = 'sg-tabbar'; bar.setAttribute('aria-label', '主選單');
  bar.innerHTML = TABS.map(t => link(t, 24)).join('');
  document.body.prepend(side);
  document.body.append(bar);

  // 深淺色：'' 跟隨系統、'light'、'dark'
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const getTheme = () => { try { return localStorage.getItem('sg_theme') || ''; } catch (e) { return ''; } };
  function apply() {
    const t = getTheme();
    document.documentElement.classList.toggle('dark', t ? t === 'dark' : mq.matches);
  }
  mq.addEventListener('change', apply);
  window.SG_SHELL = {
    getTheme,
    setTheme(t) { try { t ? localStorage.setItem('sg_theme', t) : localStorage.removeItem('sg_theme'); } catch (e) { /* 記不住也沒關係 */ } apply(); }
  };
  apply();
})();
