/**
 * 漢威牧區｜假資料庫（靜態階段用）
 * 模仿 Firebase Firestore compat 的常用寫法（collection / doc / where / onSnapshot / batch…），
 * 資料存在瀏覽器 localStorage（sg_mockdb_v1）。
 * 接上真的 Firebase 時：頁面改載入 firebase-*-compat.js，並移除本檔與 sg-mock-data.js，其他程式不用改。
 */
(function () {
  const KEY = 'sg_mockdb_v1';
  let store;
  try { store = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { store = null; }
  if (!store) { store = (window.SG_SEED && window.SG_SEED()) || {}; persist(); }

  function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* 空間不足時只存在記憶體 */ } }
  const coll = name => (store[name] = store[name] || {});
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // 時間：存成 {__ms}，讀出來是有 toMillis() 的物件（像 Firestore Timestamp）
  const TS = ms => ({ __ms: ms });
  function revive(v) {
    if (Array.isArray(v)) return v.map(revive);
    if (v && typeof v === 'object') {
      if (typeof v.__ms === 'number') { const ms = v.__ms; return { seconds: Math.floor(ms / 1000), toMillis: () => ms, toDate: () => new Date(ms) }; }
      const o = {}; for (const k in v) o[k] = revive(v[k]); return o;
    }
    return v;
  }
  const SENT_TS = { __sentinel: 'ts' }, SENT_DEL = { __sentinel: 'del' };
  function resolve(data, base) {
    const out = base ? JSON.parse(JSON.stringify(base)) : {};
    for (const k in data) {
      const v = data[k];
      if (v === SENT_DEL) delete out[k];
      else if (v === SENT_TS) out[k] = TS(Date.now());
      else if (v && typeof v.toMillis === 'function') out[k] = TS(v.toMillis());
      else out[k] = v === undefined ? null : JSON.parse(JSON.stringify(v));
    }
    return out;
  }

  // 監聽
  const listeners = new Set();
  let pending = false;
  function changed() {
    persist();
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; listeners.forEach(l => l()); }, 0);
  }

  function docSnap(name, id) {
    const raw = coll(name)[id];
    return { id, exists: !!raw, ref: new DocRef(name, id), data: () => raw ? revive(raw) : undefined, get: k => raw ? revive(raw)[k] : undefined };
  }
  function querySnap(docs) {
    return { docs, size: docs.length, empty: !docs.length, metadata: { fromCache: false, hasPendingWrites: false }, forEach: f => docs.forEach(f) };
  }

  class DocRef {
    constructor(name, id) { this._c = name; this.id = id || newId(); this.path = name + '/' + this.id; }
    get() { return Promise.resolve(docSnap(this._c, this.id)); }
    set(data, opt) { const c = coll(this._c); c[this.id] = resolve(data, opt && opt.merge ? c[this.id] : null); changed(); return Promise.resolve(); }
    update(data) {
      const c = coll(this._c);
      if (!c[this.id]) return Promise.reject(Object.assign(new Error('找不到這筆資料'), { code: 'not-found' }));
      c[this.id] = resolve(data, c[this.id]); changed(); return Promise.resolve();
    }
    delete() { delete coll(this._c)[this.id]; changed(); return Promise.resolve(); }
    collection(sub) { return new Query(this.path + '/' + sub); }
    onSnapshot(a, b, c) {
      const cb = typeof a === 'function' ? a : b;
      const run = () => cb(docSnap(this._c, this.id));
      listeners.add(run); setTimeout(run, 0);
      return () => listeners.delete(run);
    }
  }

  class Query {
    constructor(name, filters = [], order = null, lim = 0) { this._c = name; this._f = filters; this._o = order; this._l = lim; }
    where(field, op, value) { return new Query(this._c, [...this._f, [field, op, value]], this._o, this._l); }
    orderBy(field, dir = 'asc') { return new Query(this._c, this._f, [field, dir], this._l); }
    limit(n) { return new Query(this._c, this._f, this._o, n); }
    doc(id) { return new DocRef(this._c, id); }
    add(data) { const ref = new DocRef(this._c); return ref.set(data).then(() => ref); }
    _run() {
      const c = coll(this._c);
      let ids = Object.keys(c).filter(id => this._f.every(([f, op, v]) => {
        const x = c[id][f];
        if (op === '==') return x === v;
        if (op === '!=') return x !== v;
        if (op === 'in') return v.includes(x);
        if (op === 'array-contains') return Array.isArray(x) && x.includes(v);
        if (op === '>=') return x >= v; if (op === '<=') return x <= v;
        if (op === '>') return x > v; if (op === '<') return x < v;
        return true;
      }));
      if (this._o) { const [f, d] = this._o; ids.sort((a, b) => (c[a][f] > c[b][f] ? 1 : c[a][f] < c[b][f] ? -1 : 0) * (d === 'desc' ? -1 : 1)); }
      if (this._l) ids = ids.slice(0, this._l);
      return querySnap(ids.map(id => docSnap(this._c, id)));
    }
    get() { return Promise.resolve(this._run()); }
    onSnapshot(a, b, c) {
      const cb = typeof a === 'function' ? a : b;
      const run = () => cb(this._run());
      listeners.add(run); setTimeout(run, 0);
      return () => listeners.delete(run);
    }
  }

  const db = {
    collection: name => new Query(name),
    batch() {
      const ops = [];
      return {
        set(ref, data, opt) { ops.push(() => ref.set(data, opt)); return this; },
        update(ref, data) { ops.push(() => ref.update(data)); return this; },
        delete(ref) { ops.push(() => ref.delete()); return this; },
        commit() { return ops.reduce((p, op) => p.then(op), Promise.resolve()); }
      };
    }
  };

  window.db = db;
  window.firebase = window.firebase || {};
  window.firebase.firestore = Object.assign(() => db, {
    FieldValue: { serverTimestamp: () => SENT_TS, delete: () => SENT_DEL },
    Timestamp: { fromMillis: ms => ({ toMillis: () => ms, toDate: () => new Date(ms) }), now: () => ({ toMillis: () => Date.now() }) }
  });
  window.SG_MOCK = {
    reset() { localStorage.removeItem(KEY); location.reload(); },
    ts: TS
  };
})();
