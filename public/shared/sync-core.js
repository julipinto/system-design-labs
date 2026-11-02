/* SDLabs · progresso entre aparelhos: o núcleo, sem rede.
   1. Carimba a data de cada mudança de progresso no localStorage (envolve setItem/removeItem), em sdl-sync:meta.
   2. Monta um "documento" do progresso, junta dois documentos (vale a mudança mais recente) e aplica o resultado.
   A rede e o login ficam em sync.js, que só carrega o Supabase quando há sessão.

   O que é progresso:
     sdl-<módulo>:done        lista de aulas entendidas → um item por aula ("d:<módulo>|<aula>"), para desfazer valer
     sdl-<módulo>:cur         aula atual → chave inteira
     sdlabs:<slug>:quiz:v1    quiz: solved e missed por pergunta ("qs:"/"qm:<slug>|<id>"), o resto (best, nota, last) inteiro ("q:<slug>")
     sdl-provas-finais:cola   cola dos 28 números → chave inteira
   Fica de fora o que é do aparelho: sdl-<módulo>:mode (foco ou tudo), cenas das figuras, tema.

   Documento: { v: 1, i: { item: [1|0, t] }, k: { chave: [valor|null, t] } }, t em segundos. 0 = sem data (progresso de antes do login). */
(function (root) {
  'use strict';
  var META = 'sdl-sync:meta';
  var RE_DONE = /^sdl-(.+):done$/, RE_CUR = /^sdl-(.+):cur$/, RE_QUIZ = /^sdlabs:(.+):quiz:v1$/, COLA = 'sdl-provas-finais:cola';

  function now() { return Math.floor(Date.now() / 1000); }
  function tracked(k) { return typeof k === 'string' && k !== META && (RE_DONE.test(k) || RE_CUR.test(k) || RE_QUIZ.test(k) || k === COLA); }
  function jparse(s, d) { try { var v = JSON.parse(s); return v == null ? d : v; } catch (e) { return d; } }
  function arr(s) { var a = jparse(s, []); return Array.isArray(a) ? a.map(String) : []; }
  function quiz(s) { var q = jparse(s, {}); return q && typeof q === 'object' && !Array.isArray(q) ? q : {}; }
  function keysOf(o) { return o && typeof o === 'object' ? Object.keys(o).filter(function (k) { return o[k]; }) : []; }
  function rest(q) { var r = {}; Object.keys(q).sort().forEach(function (k) { if (k !== 'solved' && k !== 'missed') r[k] = q[k]; }); return r; }
  function canon(v) { // JSON com chaves em ordem: dois objetos iguais dão o mesmo texto
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function emptyMeta() { return { i: {}, k: {} }; }
  function readMeta(get) { var m = jparse(get(META), null); return m && m.i && m.k ? m : emptyMeta(); }

  // o que mudou entre o valor velho e o novo de uma chave de progresso → carimbos em meta
  function stampChange(meta, key, oldV, newV, t) {
    var m;
    function diff(prefix, a, b) {
      var A = {}, B = {};
      a.forEach(function (x) { A[x] = 1; }); b.forEach(function (x) { B[x] = 1; });
      b.forEach(function (x) { if (!A[x]) meta.i[prefix + '|' + x] = [1, t]; });
      a.forEach(function (x) { if (!B[x]) meta.i[prefix + '|' + x] = [0, t]; });
    }
    if ((m = RE_DONE.exec(key))) diff('d:' + m[1], arr(oldV), arr(newV));
    else if ((m = RE_QUIZ.exec(key))) {
      var qa = quiz(oldV), qb = quiz(newV);
      diff('qs:' + m[1], keysOf(qa.solved), keysOf(qb.solved));
      diff('qm:' + m[1], keysOf(qa.missed), keysOf(qb.missed));
      if (canon(rest(qa)) !== canon(rest(qb))) meta.k['q:' + m[1]] = t;
    } else if (oldV !== newV) meta.k[key] = t;
    return meta;
  }

  // documento a partir do armazenamento (get, lista de chaves) e dos carimbos
  function snapshot(get, allKeys, meta) {
    meta = meta || emptyMeta();
    var doc = { v: 1, i: {}, k: {} };
    function item(id, p) { var s = meta.i[id]; doc.i[id] = [p, s ? s[1] : 0]; }
    allKeys.forEach(function (key) {
      var m, v = get(key);
      if (v == null) return;
      if ((m = RE_DONE.exec(key))) arr(v).forEach(function (a) { item('d:' + m[1] + '|' + a, 1); });
      else if ((m = RE_QUIZ.exec(key))) {
        var q = quiz(v);
        keysOf(q.solved).forEach(function (a) { item('qs:' + m[1] + '|' + a, 1); });
        keysOf(q.missed).forEach(function (a) { item('qm:' + m[1] + '|' + a, 1); });
        var r = rest(q);
        if (Object.keys(r).length) doc.k['q:' + m[1]] = [r, meta.k['q:' + m[1]] || 0];
      } else if (tracked(key)) doc.k[key] = [v, meta.k[key] || 0];
    });
    // marcas de desfazer (o item saiu daqui) e chaves apagadas também viajam, com a data
    Object.keys(meta.i).forEach(function (id) { if (!doc.i[id] && meta.i[id][0] === 0) doc.i[id] = [0, meta.i[id][1]]; });
    Object.keys(meta.k).forEach(function (k) { if (!doc.k[k]) doc.k[k] = [null, meta.k[k]]; });
    return doc;
  }

  // junção: por item e por chave, vale a data mais recente. Empate: marcado ganha de desmarcado; valor ganha de vazio.
  function merge(a, b) {
    a = a && a.v === 1 ? a : { i: {}, k: {} }; b = b && b.v === 1 ? b : { i: {}, k: {} };
    var out = { v: 1, i: {}, k: {} };
    Object.keys(a.i).concat(Object.keys(b.i)).forEach(function (id) {
      if (out.i[id]) return;
      var x = a.i[id], y = b.i[id];
      out.i[id] = !x ? y.slice() : !y ? x.slice() : x[1] !== y[1] ? (x[1] > y[1] ? x : y).slice() : [Math.max(x[0], y[0]), x[1]];
    });
    Object.keys(a.k).concat(Object.keys(b.k)).forEach(function (k) {
      if (out.k[k]) return;
      var x = a.k[k], y = b.k[k];
      out.k[k] = !x ? y.slice() : !y ? x.slice() : x[1] !== y[1] ? (x[1] > y[1] ? x : y).slice() : (x[0] == null && y[0] != null ? y : x).slice();
    });
    return out;
  }

  function same(a, b) { return canon(a) === canon(b); }

  // aplica o documento no armazenamento: devolve as chaves que mudaram. set/del gravam sem carimbar.
  function apply(get, set, del, doc) {
    var want = {}, changed = [];
    function bucket(key) { return want[key] || (want[key] = { done: null, solved: null, missed: null, rest: undefined, raw: undefined }); }
    Object.keys(doc.i).forEach(function (id) {
      var bar = id.indexOf('|'), pre = id.slice(0, bar), x = id.slice(bar + 1), c = pre.indexOf(':'), kind = pre.slice(0, c), slug = pre.slice(c + 1);
      var key = kind === 'd' ? 'sdl-' + slug + ':done' : 'sdlabs:' + slug + ':quiz:v1';
      var b = bucket(key), f = kind === 'd' ? 'done' : kind === 'qs' ? 'solved' : 'missed';
      if (!b[f]) b[f] = {};
      if (doc.i[id][0]) b[f][x] = 1;
    });
    Object.keys(doc.k).forEach(function (k) {
      var m = /^q:(.+)$/.exec(k);
      if (m) bucket('sdlabs:' + m[1] + ':quiz:v1').rest = doc.k[k][0];
      else bucket(k).raw = doc.k[k][0];
    });
    Object.keys(want).forEach(function (key) {
      var w = want[key], cur = get(key), next;
      if (RE_DONE.test(key)) {
        var have = arr(cur), ids = keysOf(w.done);
        // mantém a ordem local; o que chegou de fora entra no fim
        next = have.filter(function (x) { return w.done && w.done[x]; });
        ids.forEach(function (x) { if (next.indexOf(x) < 0) next.push(x); });
        if (!next.length && cur == null) return;
        if (canon(next) !== canon(have) || cur == null) { set(key, JSON.stringify(next)); changed.push(key); }
      } else if (RE_QUIZ.test(key)) {
        var q = quiz(cur), base = w.rest === undefined ? rest(q) : (w.rest || {});
        next = {};
        Object.keys(base).forEach(function (f) { next[f] = base[f]; });
        next.solved = {}; next.missed = {};
        keysOf(w.solved).forEach(function (x) { next.solved[x] = 1; });
        keysOf(w.missed).forEach(function (x) { next.missed[x] = 1; });
        if (w.solved === null) next.solved = q.solved || {};
        if (w.missed === null) next.missed = q.missed || {};
        if (!next.best) next.best = q.best || {};
        if (canon(next) !== canon(q)) { set(key, JSON.stringify(next)); changed.push(key); }
      } else if (w.raw !== undefined) {
        if (w.raw === null) { if (cur != null) { del(key); changed.push(key); } }
        else if (w.raw !== cur) { set(key, String(w.raw)); changed.push(key); }
      }
    });
    return changed;
  }

  // carimbos de um documento (para gravar depois de aplicar)
  function metaOf(doc) {
    var m = emptyMeta();
    Object.keys(doc.i).forEach(function (id) { m.i[id] = doc.i[id].slice(); });
    Object.keys(doc.k).forEach(function (k) { m.k[k] = doc.k[k][1]; });
    return m;
  }

  var core = { META: META, now: now, tracked: tracked, stampChange: stampChange, snapshot: snapshot, merge: merge, apply: apply, same: same, metaOf: metaOf, readMeta: readMeta, canon: canon };
  if (typeof module === 'object' && module.exports) { module.exports = core; return; }

  /* ---------- no navegador: carimbar as gravações de progresso ---------- */
  var LS;
  try { LS = root.localStorage; if (!LS) return; } catch (e) { return; }  // sem storage: nada a sincronizar
  if (root.SDLSync) return;  // já instalado (script incluído duas vezes)
  var P = root.Storage && root.Storage.prototype;
  if (!P) return;
  var oGet = P.getItem, oSet = P.setItem, oDel = P.removeItem;
  function rawGet(k) { try { return oGet.call(LS, k); } catch (e) { return null; } }
  function rawSet(k, v) { try { oSet.call(LS, k, v); } catch (e) { /* cheio ou bloqueado: segue */ } }
  function rawDel(k) { try { oDel.call(LS, k); } catch (e) { /* bloqueado */ } }
  function stamped(k, old, nv) {
    try {
      var meta = readMeta(rawGet);
      stampChange(meta, k, old, nv, now());
      meta.dirty = 1;
      rawSet(META, JSON.stringify(meta));
      root.dispatchEvent(new root.CustomEvent('sdl-progress-change', { detail: { key: k } }));
    } catch (e) { /* carimbo é extra: a gravação já aconteceu */ }
  }
  P.setItem = function (k, v) {
    if (this !== LS || !tracked(k)) return oSet.apply(this, arguments);
    var old = rawGet(k);
    oSet.call(this, k, v);  // erro de cota sobe como antes
    stamped(k, old, String(v));
  };
  P.removeItem = function (k) {
    if (this !== LS || !tracked(k)) return oDel.apply(this, arguments);
    var old = rawGet(k);
    oDel.call(this, k);
    if (old != null) stamped(k, old, null);
  };
  function allKeys() { var out = []; try { for (var n = 0; n < LS.length; n++) out.push(LS.key(n)); } catch (e) { /* bloqueado */ } return out; }
  core.rawGet = rawGet; core.rawSet = rawSet; core.rawDel = rawDel;
  core.local = function () { return snapshot(rawGet, allKeys(), readMeta(rawGet)); };
  // junta com o remoto, grava aqui e devolve { doc, changed }
  core.absorb = function (remote) {
    var merged = merge(core.local(), remote);
    var changed = apply(rawGet, rawSet, rawDel, merged);
    var m = metaOf(merged); m.dirty = 0;
    rawSet(META, JSON.stringify(m));
    return { doc: merged, changed: changed };
  };
  root.SDLSync = core;
})(typeof window !== 'undefined' ? window : this);
