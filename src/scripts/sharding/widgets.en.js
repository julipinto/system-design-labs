/* SDLabs · Sharding and Partitioning: widgets in plain JS, English copy (same logic as widgets.js; only the visible text changed)
   (which shard, hot key, partition by date, consistent hashing ring, slots and directory, shuffle sharding). */
(function () {
  'use strict';

  /* =============== contas (as mesmas do brief; testadas em Node) =============== */
  function utf8(s) { return Array.prototype.slice.call(new TextEncoder().encode(s)); }

  function murmur3(bytes) { // murmur3 de 32 bits, seed 0: o Sum32 do spaolacci/murmur3
    var len = bytes.length, h = 0, i = 0, k, c1 = 0xcc9e2d51, c2 = 0x1b873593;
    for (var n = len >> 2; n > 0; n--, i += 4) {
      k = (bytes[i] | bytes[i + 1] << 8 | bytes[i + 2] << 16 | bytes[i + 3] << 24) >>> 0;
      k = Math.imul(k, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0;
      h = (h ^ k) >>> 0; h = ((h << 13) | (h >>> 19)) >>> 0; h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
    }
    k = 0;
    switch (len & 3) {
      case 3: k ^= bytes[i + 2] << 16; /* falls through */
      case 2: k ^= bytes[i + 1] << 8; /* falls through */
      case 1: k ^= bytes[i]; k = Math.imul(k >>> 0, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0; h = (h ^ k) >>> 0;
    }
    h = (h ^ len) >>> 0;
    h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  function mm(s) { return murmur3(utf8(s)); }

  function fnv1a(bytes) { // FNV-1a de 32 bits
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) { h = (h ^ bytes[i]) >>> 0; h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function sumChars(bytes) { var s = 0; for (var i = 0; i < bytes.length; i++) s += bytes[i]; return s >>> 0; }

  var K256 = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(bytes) { // devolve os 8 bytes iniciais como dois números de 32 bits [alto, baixo]
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var l = bytes.length, m = bytes.slice(); m.push(0x80);
    while ((m.length % 64) !== 56) m.push(0);
    var hi = Math.floor(l * 8 / 0x100000000), lo = (l * 8) >>> 0;
    m.push(hi >>> 24 & 255, hi >>> 16 & 255, hi >>> 8 & 255, hi & 255, lo >>> 24 & 255, lo >>> 16 & 255, lo >>> 8 & 255, lo & 255);
    var w = new Array(64);
    function rr(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (var o = 0; o < m.length; o += 64) {
      for (var t = 0; t < 16; t++) w[t] = (m[o + 4 * t] << 24 | m[o + 4 * t + 1] << 16 | m[o + 4 * t + 2] << 8 | m[o + 4 * t + 3]) >>> 0;
      for (t = 16; t < 64; t++) {
        var s0 = rr(w[t - 15], 7) ^ rr(w[t - 15], 18) ^ (w[t - 15] >>> 3), s1 = rr(w[t - 2], 17) ^ rr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
        var S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return [H[0], H[1]];
  }
  /* no widget, "SHA-256" vira um número de 32 bits: os 4 primeiros bytes do resumo (exemplo do widget; o lab usa 8) */
  var FUNCS = {
    murmur3: { label: 'murmur3', fn: function (s) { return mm(s); } },
    fnv: { label: 'FNV-1a', fn: function (s) { return fnv1a(utf8(s)); } },
    sha: { label: 'SHA-256', fn: function (s) { return sha256(utf8(s))[0] >>> 0; } },
    soma: { label: 'sum of characters', fn: function (s) { return sumChars(utf8(s)); } }
  };
  var FKEYS = ['murmur3', 'fnv', 'sha', 'soma'];

  var CLIENTES = ['lena-77', 'bia-31', 'caio-58', 'davi-12', 'mkt-01'];
  var NKEYS = 100000;
  var hcache = {};
  function keyHashes(fk) { // hash de c-0 … c-99999 na função escolhida (guardado)
    if (hcache[fk]) return hcache[fk];
    var a = new Uint32Array(NKEYS), f = FUNCS[fk].fn;
    for (var i = 0; i < NKEYS; i++) a[i] = f('c-' + i);
    hcache[fk] = a; return a;
  }
  function modChange(fk, n1, n2) { // fração das 100 mil chaves que mudam de shard quando N vai de n1 a n2
    var a = keyHashes(fk), c = 0;
    for (var i = 0; i < NKEYS; i++) if (a[i] % n1 !== a[i] % n2) c++;
    return c / NKEYS;
  }

  /* anel: cada shard tem p pontos nas posições murmur3("shard-S#i"); a chave vai ao primeiro ponto >= hash (sentido horário) */
  function buildRing(ids, p) {
    var pts = [];
    ids.forEach(function (s) { for (var i = 0; i < p; i++) pts.push({ pos: mm('shard-' + s + '#' + i), id: s }); });
    pts.sort(function (a, b) { return a.pos - b.pos || a.id - b.id; });
    return pts;
  }
  function ringOwner(pts, h) {
    var lo = 0, hi = pts.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (pts[mid].pos >= h) hi = mid; else lo = mid + 1; }
    return pts[lo === pts.length ? 0 : lo].id;
  }
  function ringAssign(ids, p) { // dono de cada uma das 100 mil chaves
    var pts = buildRing(ids, p), a = keyHashes('murmur3'), out = new Int8Array(NKEYS);
    for (var i = 0; i < NKEYS; i++) out[i] = ringOwner(pts, a[i]);
    return out;
  }
  function shares(assign, ids) {
    var cnt = {}; ids.forEach(function (s) { cnt[s] = 0; });
    for (var i = 0; i < assign.length; i++) cnt[assign[i]]++;
    return ids.map(function (s) { return cnt[s] / assign.length; });
  }

  function choose(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
  function subset(cid, n, k) { // rendezvous: as k réplicas de menor murmur3(cliente + ":catalogo-" + r)
    var sc = [];
    for (var r = 1; r <= n; r++) sc.push({ r: r, h: mm(cid + ':catalogo-' + r) });
    sc.sort(function (a, b) { return a.h - b.h; });
    return sc.slice(0, k).map(function (x) { return x.r; }).sort(function (a, b) { return a - b; });
  }

  var CORE = { murmur3: mm, fnv1a: function (s) { return fnv1a(utf8(s)); }, sha256hi: function (s) { return sha256(utf8(s))[0] >>> 0; },
    keyHashes: keyHashes, modChange: modChange, buildRing: buildRing, ringAssign: ringAssign, shares: shares, choose: choose, subset: subset, CLIENTES: CLIENTES };
  if (typeof module !== 'undefined' && module.exports) module.exports = CORE;
  if (typeof document === 'undefined') return;

  /* =============== peças de tela =============== */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null) continue;
      if (k === 'class') n.className = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: d === 0 ? 0 : undefined }); }
  function pct(v, d) { return fmt(v * 100, d == null ? 1 : d) + '%'; }
  function hex(h) { return '0x' + ('00000000' + h.toString(16)).slice(-8); }
  function mins(s) { var m = Math.floor(s / 60), r = Math.round(s - m * 60); return m + ' min' + (r ? ' ' + r + ' s' : ''); }

  function chipRow(label, labels, btns, onPick) {
    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': label });
    labels.forEach(function (t, i) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: t });
      b.addEventListener('click', function () { onPick(i); });
      btns.push(b);
      row.appendChild(b);
    });
    return row;
  }
  function press(btns, idx) { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); }); }
  function bar(label, value, max, text, cls) {
    return el('div', { class: 'sr-bar' }, [
      el('span', { text: label }),
      el('div', { class: 'sr-track' }, [
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, value / max * 100)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }
  var uid = 0;
  function slider(label, min, max, step, value, unit, fmtv) {
    var id = 'sh-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function field(label, type, value, attrs) {
    var id = 'sh-in-' + (++uid);
    var a = { id: id, type: type, value: String(value) };
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) a[k] = attrs[k];
    var inp = el('input', a);
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label]), inp]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table sh-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, text) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), text]);
  }

  /* =============== AULA 6: qual é o shard? =============== */
  function wQualShard(root) {
    var S = { n: 3, f: 0, key: 'lena-77', ch: null };
    var key = field('cliente_id', 'text', S.key, { autocomplete: 'off', spellcheck: 'false', maxlength: '40' });
    var ns = slider('Shards', 1, 8, 1, 3);
    var fb = [];
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var f = FUNCS[FKEYS[S.f]], n = S.n;
      var h = f.fn(S.key);
      var shard = h % n;
      out.appendChild(el('div', { class: 'sr-facts' }, [fact('hash (' + f.label + ')', hex(h)), fact('in decimal', fmt(h, 0)), fact('mod ' + n, String(shard)), fact('goes to', 'shard-' + shard)]));
      var rows = CLIENTES.map(function (c) {
        var hh = f.fn(c), s = hh % n;
        return { cls: c === S.key ? 'cr-cur' : '', cells: [{ text: c }, { text: hex(hh) }, { text: 'shard-' + s, cls: 'sh-cell' }] };
      });
      out.appendChild(table(['customer', 'hash', 'shard with mod ' + n], rows));
      if (S.ch) {
        var c = S.ch, mv = 0, lista = [];
        CLIENTES.forEach(function (cl) {
          var hh = f.fn(cl), a = hh % c.a, b = hh % c.b;
          if (a !== b) { mv++; lista.push(cl + ' (' + a + ' → ' + b + ')'); }
        });
        var frac = modChange(FKEYS[S.f], c.a, c.b);
        var ideal = c.b > c.a ? (c.b - c.a) / c.b : (c.a - c.b) / c.a;
        var gb = frac * 100, sec = gb * 1000 / 50;
        out.appendChild(verdict(frac > ideal + 0.08, 'From ' + c.a + ' to ' + c.b + ' shards:',
          mv + ' of the 5 customers move' + (lista.length ? ' (' + lista.join(', ') + ')' : '') + '. Over the 100,000 keys c-0 … c-99999, ' + pct(frac) + ' move (the ideal would be ' + pct(ideal) + '). On the 50-million-row table that is ' + fmt(frac * 50, 1) + ' million rows, ' + fmt(gb, 0) + ' GB, ' + mins(sec) + ' at 50 MB/s.'));
      }
      out.appendChild(el('p', { class: 'sr-note', text: 'Lena\'s 1054: murmur3("lena-77") = 0x8fd9d9d8, mod 3 = 1, shard-1. The SHA-256 function here uses the first 4 bytes of the digest; the sum of characters adds up the bytes of the text (which is why "lena-77" and "77-anel" always land on the same shard).' }));
    }
    function changeBy(kind) {
      var a = S.n, b = kind === 0 ? a + 1 : kind === 1 ? a * 2 : a - 1;
      if (b < 1 || b > 16) { S.ch = null; render(); return; }
      S.ch = { a: a, b: b }; render();
    }
    key.input.addEventListener('input', function () { S.key = key.input.value; S.ch = null; render(); });
    ns.input.addEventListener('input', function () { S.n = +ns.input.value; S.ch = null; render(); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [key.wrap, ns.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Hash function' }));
    root.appendChild(chipRow('Hash function', FKEYS.map(function (k) { return FUNCS[k].label; }), fb, function (i) { S.f = i; S.ch = null; press(fb, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'What if the number of shards changes?' }));
    var cb = [];
    root.appendChild(chipRow('Change the number of shards', ['+1 shard', 'double', '−1 shard'], cb, function (i) { press(cb, i); changeBy(i); }));
    root.appendChild(out);
    press(fb, 0);
    render();
  }

  /* =============== AULA 3: chave quente =============== */
  function wChaveQuente(root) {
    var S = { key: 0, m: 0 };
    var pc = slider('mkt-01 share of the rows', 0, 60, 1, 40, '%');
    var ns = slider('Shards', 2, 8, 1, 3);
    var cap = field('Capacity per shard (orders/s)', 'number', 150, { min: '10', max: '1000', step: '10', inputmode: 'numeric' });
    var kb = [], mb = [];
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var p = +pc.input.value / 100, n = +ns.input.value, c = Math.max(1, +cap.input.value || 150);
      var hot, work = n, note;
      if (S.key === 0) { hot = p + (1 - p) / n; note = 'mkt-01 lands whole on one shard (the hash spreads keys, not load); the other customers spread evenly.'; }
      else if (S.key === 1) { hot = 0.55; work = Math.min(n, 3); note = 'cidade has only 3 values (SP 55%, Rio 25%, Recife 20%, an example): at most 3 shards work, and the SP one takes 55%.'; }
      else { hot = 1; note = 'With a criado_em range (or a sequential id), 100% of the new writes land on the shard of the newest range.'; }
      var T = c / hot, nominal = n * c, eff = T / nominal;
      var mit = '';
      if (S.m === 1 && S.key === 0) {
        var Tm = Math.min(2 * c / Math.max(p, 0.0001), c / Math.max((1 - p) / n, 0.0001));
        T = Tm; nominal = (n + 1) * c + c; eff = T / nominal;
        mit = 'Dedicated shard: mkt-01 alone on a 2× machine (capacity ' + 2 * c + '/s) and the ' + n + ' normal shards with the rest. Both sides saturate at T = ' + fmt(T, 0) + ' orders/s.';
      } else if (S.m === 2 && S.key === 0) {
        hot = 1 / n; T = c / hot; eff = T / nominal;
        mit = 'Salt: mkt-01#0 … mkt-01#7 spread the partner over the ' + n + ' shards. The math gets close to 100%; the price is that "all orders from mkt-01" become scatter-gather across the ' + n + ' shards.';
      } else if (S.m !== 0) mit = 'The mitigations apply to the cliente_id key (the mkt-01 case). Switch the key to see the math.';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('hottest shard', pct(S.m === 2 && S.key === 0 ? 1 / n : hot)),
        fact('cluster efficiency', pct(Math.min(1, eff))),
        fact('nominal capacity', fmt(nominal, 0) + '/s'),
        fact('useful capacity', fmt(T, 0) + '/s')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('nominal', nominal, nominal, fmt(nominal, 0) + '/s', 'cap'),
        bar('useful', T, nominal, fmt(T, 0) + '/s', eff < 0.7 ? '' : 'win')
      ]));
      out.appendChild(verdict(eff < 0.7, eff < 0.7 ? 'The store pays for ' + n + ' servers and uses ' + fmt(eff * n, 2) + '.' : 'Almost everything is used.',
        'Efficiency = 1 ÷ (shards × fraction of the hottest shard) = ' + pct(Math.min(1, eff)) + '. ' + (mit || note)));
      if (work < n && S.key === 1) out.appendChild(el('p', { class: 'sr-note', text: 'With ' + n + ' shards and only 3 values of cidade, ' + (n - work) + ' stay empty.' }));
    }
    [pc, ns].forEach(function (s) { s.input.addEventListener('input', render); });
    cap.input.addEventListener('input', render);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pc.wrap, ns.wrap, cap.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Sharding key' }));
    root.appendChild(chipRow('Sharding key', ['cliente_id', 'cidade', 'criado_em'], kb, function (i) { S.key = i; press(kb, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Mitigation' }));
    root.appendChild(chipRow('Mitigation', ['none', 'dedicated 2× shard', 'salt in 8 sub-keys'], mb, function (i) { S.m = i; press(mb, i); render(); }));
    root.appendChild(out);
    press(kb, 0); press(mb, 0);
    render();
  }

  /* =============== AULAS 4 e 5: partição por data =============== */
  function wParticao(root) {
    var S = { q: 0, has27: false };
    var dt = field('order criado_em', 'date', '2026-11-20', { min: '2023-01-01', max: '2030-12-31' });
    var qb = [], fb = [];
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var v = dt.input.value, y = v ? +v.slice(0, 4) : NaN;
      var parts = [2024, 2025, 2026].concat(S.has27 ? [2027] : []);
      var ok = parts.indexOf(y) >= 0;
      if (!v || isNaN(y)) out.appendChild(el('p', { class: 'sr-note', text: 'Pick a date.' }));
      else if (ok) out.appendChild(verdict(false, 'INSERT:', 'the row goes to pedidos_' + y + ' (FROM \'' + y + '-01-01\' TO \'' + (y + 1) + '-01-01\').'));
      else out.appendChild(verdict(true, 'INSERT fails.', 'ERROR: no partition of relation "pedidos" found for row. DETAIL: Partition key of the failing row contains (criado_em) = (' + v + ' 00:00:00-03). The ' + y + ' partition is missing.'));
      var scans = parts.map(function (p) { return 'pedidos_' + p; });
      var lines, head;
      if (S.q === 0) { // consulta só por criado_em (novembro de 2026)
        lines = ['Seq Scan on pedidos_2026'];
        head = 'WHERE criado_em >= \'2026-11-01\' AND criado_em < \'2026-12-01\'';
      } else if (S.q === 1) {
        lines = scans.map(function (s) { return 'Index Scan using ' + s + '_pkey on ' + s; });
        head = 'WHERE id = 1042 (without the partition key)';
      } else {
        lines = ['Index Scan using pedidos_2026_pkey on pedidos_2026'];
        head = 'WHERE id = 1042 AND criado_em >= \'2026-11-01\' AND criado_em < \'2026-12-01\'';
      }
      out.appendChild(el('pre', { class: 'sh-plan' }, [el('code', { text: head + '\n' + (lines.length > 1 ? 'Append\n  ' : '') + lines.join('\n' + (lines.length > 1 ? '  ' : '')) })]));
      out.appendChild(el('p', { class: 'sr-note', text: lines.length === 1 ? 'Pruning: the planner reads 1 partition and discards the other ' + (parts.length - 1) + '.' : 'Without the partition key the Append visits all ' + parts.length + ' partitions, one lookup in each.' }));
      out.appendChild(table(['retire 2024 (105,407 rows)', 'time', 'leaves dead rows?'], [
        { cells: [{ text: 'DELETE … WHERE criado_em < \'2025-01-01\'' }, { text: '62.9 ms' }, { text: 'yes, for VACUUM' }] },
        { cells: [{ text: 'DROP TABLE pedidos_2024' }, { text: '7.5 ms' }, { text: 'no' }] },
        { cells: [{ text: 'ALTER TABLE … DETACH PARTITION' }, { text: '1.1 ms' }, { text: 'no (and the detached table is kept)' }] }
      ], 'sh-wide'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Measured on PostgreSQL 14, on this machine. The order of magnitude holds (DROP and DETACH do not scan rows); the exact time on 8 million rows is not guaranteed.' }));
    }
    dt.input.addEventListener('input', render);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dt.wrap]));
    root.appendChild(chipRow('Shortcut', ['new year: 1/1/2027', 'Black Friday 2026'], fb, function (i) { press(fb, i); dt.input.value = i === 0 ? '2027-01-01' : '2026-11-20'; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Query' }));
    root.appendChild(chipRow('Query', ['criado_em only', 'id only', 'id and criado_em'], qb, function (i) { S.q = i; press(qb, i); render(); }));
    var fix = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'create the pedidos_2027 partition' });
    fix.addEventListener('click', function () { S.has27 = !S.has27; fix.setAttribute('aria-pressed', S.has27 ? 'true' : 'false'); render(); });
    root.appendChild(el('div', { class: 'sr-chips' }, [fix]));
    root.appendChild(out);
    press(qb, 0);
    render();
  }

  /* =============== AULA 7: anel de hashing consistente =============== */
  function wAnel(root) {
    var S = { ids: [0, 1, 2], prev: null, prevIds: null, prevP: 0 };
    var ns = slider('Shards', 2, 8, 1, 3);
    var ps = slider('Points per shard', 1, 200, 1, 200);
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    var add = el('button', { type: 'button', class: 'btn', text: 'Add a shard' });
    var rem = el('button', { type: 'button', class: 'btn', text: 'Remove the biggest shard' });
    var reset = el('button', { type: 'button', class: 'btn', text: 'Reset' });
    function range(n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; }
    function render() {
      clear(out);
      var p = +ps.input.value, ids = S.ids;
      var cur = ringAssign(ids, p), sh = shares(cur, ids);
      var avg = 1 / ids.length, mx = Math.max.apply(null, sh);
      var rows = ids.map(function (s, i) {
        var before = S.prev && S.prevIds.indexOf(s) >= 0 ? pct(shares(S.prev, S.prevIds)[S.prevIds.indexOf(s)]) : '—';
        return { cells: [{ text: 'shard-' + s }, { text: before }, { text: pct(sh[i]) }] };
      });
      out.appendChild(el('div', { class: 'sr-bars' }, ids.map(function (s, i) { return bar('shard-' + s, sh[i], Math.max(mx, 0.01), pct(sh[i]), sh[i] === mx ? 'win' : ''); })));
      out.appendChild(el('div', { class: 'sr-facts' }, [fact('max ÷ mean', fmt(mx / avg, 2)), fact('shards', String(ids.length)), fact('points on the ring', String(ids.length * p))]));
      if (S.prev) {
        var moved = 0, dest = {};
        for (var i = 0; i < NKEYS; i++) if (S.prev[i] !== cur[i]) { moved++; dest[cur[i]] = (dest[cur[i]] || 0) + 1; }
        var fr = moved / NKEYS, a = S.prevIds.length, b = ids.length;
        var modf = modChange('murmur3', a, b);
        var only = Object.keys(dest).length;
        var gb = fr * 100;
        var toWho = Object.keys(dest).map(function (k) { return 'shard-' + k + ' ' + pct(dest[k] / NKEYS); }).join(', ');
        out.appendChild(table(['after the change (' + a + ' → ' + b + ')', 'keys that move', 'rows (50 M)', 'GB · time at 50 MB/s'], [
          { cls: 'cr-cur', cells: [{ text: 'ring (' + p + ' points)' }, { text: pct(fr) }, { text: fmt(fr * 50, 1) + ' M' }, { text: fmt(gb, 0) + ' GB · ' + mins(gb * 1000 / 50) }] },
          { cells: [{ text: 'hash mod N' }, { text: pct(modf) }, { text: fmt(modf * 50, 1) + ' M' }, { text: fmt(modf * 100, 0) + ' GB · ' + mins(modf * 100 * 1000 / 50) }] }
        ], 'sh-wide'));
        out.appendChild(verdict(false, 'Where the ring\'s keys went:', toWho + '.' + (b > a ? ' Only the new shard receives.' : ' Who gets the keys of the shard that left: ' + (only === 1 ? 'a single neighbor (domino effect).' : only + ' neighbors share them.'))));
      } else {
        out.appendChild(el('p', { class: 'sr-note', text: 'Press "Add a shard" or "Remove the biggest shard" to see how many of the 100,000 keys move, and compare with hash mod N.' }));
      }
      out.appendChild(el('p', { class: 'sr-note', text: 'Each shard marks the ring at murmur3("shard-S#i"); the key goes to the first point clockwise. With 200 points: 35.5 / 32.2 / 32.3% on 3 shards and 25.7% of the keys move going to 4. With 1 point: 70.2 / 8.8 / 21.0%.' }));
    }
    function reroll() { S.ids = range(+ns.input.value); S.prev = null; S.prevIds = null; render(); }
    ns.input.addEventListener('input', reroll);
    ps.input.addEventListener('input', function () { S.prev = null; S.prevIds = null; render(); });
    add.addEventListener('click', function () {
      if (S.ids.length >= 8) return;
      S.prev = ringAssign(S.ids, +ps.input.value); S.prevIds = S.ids.slice();
      S.ids = S.ids.concat([Math.max.apply(null, S.ids) + 1]); render();
    });
    rem.addEventListener('click', function () {
      if (S.ids.length <= 2) return;
      var p = +ps.input.value, a = ringAssign(S.ids, p), sh = shares(a, S.ids), big = S.ids[sh.indexOf(Math.max.apply(null, sh))];
      S.prev = a; S.prevIds = S.ids.slice();
      S.ids = S.ids.filter(function (s) { return s !== big; }); render();
    });
    reset.addEventListener('click', reroll);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ns.wrap, ps.wrap]));
    root.appendChild(el('div', { class: 'sr-chips' }, [add, rem, reset]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 8: slots e diretório =============== */
  function wSlots(root) {
    var NS = 1024;
    // os 256 slots que o shard-3 recebe: os últimos 86/85/85 dos shards 0, 1 e 2 (slots ≥ 768, 769 e 770), do maior para o menor
    var cand = [];
    for (var s = 0; s < NS; s++) { var o = s % 3; if (s >= 768 + o) cand.push(s); }
    cand.sort(function (a, b) { return b - a; });
    var mv = slider('Slots moved to shard-3', 0, 256, 1, 256, '', function (v) { return v + ' of 1,024'; });
    var mbs = field('Copy MB/s', 'number', 50, { min: '1', max: '2000', step: '10', inputmode: 'numeric' });
    var kb = field('KB per row', 'number', 2, { min: '1', max: '64', step: '1', inputmode: 'numeric' });
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var k = +mv.input.value, moved = {};
      for (var i = 0; i < k; i++) moved[cand[i]] = true;
      var rate = Math.max(1, +mbs.input.value || 50), row = Math.max(1, +kb.input.value || 2);
      var slotsPerShard = [0, 0, 0, 0];
      for (var sl = 0; sl < NS; sl++) slotsPerShard[moved[sl] ? 3 : sl % 3]++;
      var gb = k / NS * 50e6 * row / 1e6; // GB movidos: fração dos slots × 50 milhões de linhas
      var sec = gb * 1000 / rate;
      out.appendChild(el('div', { class: 'sr-facts' }, [fact('slots per shard', slotsPerShard.join(' / ')), fact('rows moved', fmt(k / NS * 50, 1) + ' M'), fact('GB to copy', fmt(gb, 1)), fact('time', mins(sec))]));
      var changed = 0;
      var rows = CLIENTES.map(function (c) {
        var sl = mm(c) & 1023, a = sl % 3, b = moved[sl] ? 3 : a;
        if (a !== b) changed++;
        return { cls: a !== b ? 'cr-cur' : '', cells: [{ text: c }, { text: String(sl) }, { text: 'shard-' + a }, { text: 'shard-' + b }] };
      });
      out.appendChild(table(['customer', 'slot (murmur3 mod 1,024)', 'before (slot mod 3)', 'after'], rows));
      out.appendChild(verdict(false, changed + ' of 5 customers move.', k === 256 ? 'With all 256 slots (exactly 25%) only bia-31 moves: her slot, 827, goes from shard-2 to shard-3. The slot → shard map is the only thing that changes, and it fits in 1 KB.' : 'Moving fewer slots means moving less data: ' + fmt(k / NS * 100, 1) + '% of the table. The customer\'s hash does not change; only the map does.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'shard-3 receives the last 86, 85 and 85 slots of shards 0, 1 and 2 (slots ≥ 768, 769 and 770). Here the slots go from the highest number to the lowest. The GB math uses the 50 million rows.' }));
    }
    [mv.input, mbs.input, kb.input].forEach(function (i) { i.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [mv.wrap, mbs.wrap, kb.wrap]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 9: shuffle sharding =============== */
  function wShuffle(root) {
    var nr = slider('catalogo replicas', 4, 20, 1, 10);
    var ks = slider('Replicas per customer', 1, 4, 1, 2);
    var noisy = el('select', { id: 'sh-noisy', 'aria-label': 'Noisy customer' }, CLIENTES.map(function (c) { return el('option', { value: c, text: c }); }));
    noisy.value = 'mkt-01';
    var retry = el('input', { type: 'checkbox', id: 'sh-retry' }); retry.checked = true;
    var out = el('div', { class: 'sh-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var n = +nr.input.value, k = Math.min(+ks.input.value, n), bad = noisy.value;
      var C = choose(n, k), partial = 1 - choose(n - k, k) / C;
      var groups = Math.max(1, Math.floor(n / k)), fixedLoss = 1 / groups;
      var down = subset(bad, n, k);
      var gOf = function (c) { return mm(c) % groups; };
      var gb = gOf(bad);
      out.appendChild(el('div', { class: 'sr-facts' }, [fact('possible sets C(' + n + ', ' + k + ')', fmt(C, 0)), fact('same set as the noisy one', pct(1 / C, 2)), fact('at least 1 replica in common', pct(partial)), fact('fixed groups of ' + k, pct(fixedLoss, 0) + ' go down')]));
      var rows = CLIENTES.map(function (c) {
        var s = subset(c, n, k), j = s.filter(function (r) { return down.indexOf(r) >= 0; }).length;
        var fixedHit = gOf(c) === gb;
        var shuf = j === 0 ? 'unaffected' : j === k ? 'no service' : retry.checked ? 'served, with retry' : 'fails ' + pct(j / k, 0) + ' of calls';
        return { cls: c === bad ? 'cr-cur' : '', cells: [{ text: c }, { text: '{' + s.join(', ') + '}' }, { text: shuf, cls: j === k ? 'bad' : '' }, { text: fixedHit ? 'no service' : 'unaffected', cls: fixedHit ? 'bad' : '' }] };
      });
      out.appendChild(table(['customer', 'replicas (shuffle)', 'shuffle sharding', 'fixed groups'], rows));
      out.appendChild(verdict(false, bad + ' hangs {' + down.join(', ') + '}.', 'With fixed groups, ' + pct(fixedLoss, 0) + ' of the customers go down (the whole group). With shuffle sharding, only whoever has the same set goes down: ' + pct(1 / C, 2) + ' on average. Whoever shares only part of the set depends on the client\'s retry: ' + (retry.checked ? 'on, it tries the other replica and carries on.' : 'off, half of its calls (j ÷ k) fail.')));
      out.appendChild(el('p', { class: 'sr-note', text: 'Each customer gets the ' + k + ' replicas with the lowest murmur3(cliente_id + ":catalogo-" + r) (rendezvous). AWS Route 53: 2,048 virtual servers, 4 per domain, C(2048, 4) = 730,862,190,080 combinations.' }));
    }
    [nr.input, ks.input, noisy].forEach(function (i) { i.addEventListener('input', render); });
    retry.addEventListener('change', render);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nr.wrap, ks.wrap,
      el('div', { class: 'sr-ctl' }, [el('label', { for: 'sh-noisy' }, ['Noisy customer']), noisy]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: 'sh-retry' }, ['The client tries the other replicas ']), retry])]));
    root.appendChild(out);
    render();
  }

  var REG = { qualshard: wQualShard, chavequente: wChaveQuente, particao: wParticao, anel: wAnel, slots: wSlots, shuffle: wShuffle };
  function init() {
    var nodes = document.querySelectorAll('[data-widget]');
    Array.prototype.forEach.call(nodes, function (n) {
      var f = REG[n.getAttribute('data-widget')];
      if (!f || n.getAttribute('data-ready')) return;
      n.setAttribute('data-ready', '1');
      try { f(n); } catch (e) { if (window.console) console.error('widget', n.getAttribute('data-widget'), e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
