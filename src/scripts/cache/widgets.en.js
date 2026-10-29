/* SDLabs · Caching Strategies: plain JS widgets (English copy of widgets.js)
   (TTL clock, eviction simulator, hit rate calculator, CDN proxy key).
   All use the store from the brief: produto:42 (plush cat), database 40 ms, Redis 1 ms, TTL 60 s, 3 slots. */
(function () {
  'use strict';

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
  function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

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
  function table(rows) {
    var tb = el('tbody');
    rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { class: /^\S{24,}$/.test(r[1]) ? 'ck-long' : null, text: r[1] })])); });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]);
  }

  /* =============== LESSON 2: TTL clock with the old price =============== */
  var TTL = 60, SPAN = 120;
  function wTtl(root) {
    var CHANGES = [5, 20, 45, 59];
    var S = { c: 1, del: 0, t: 30 };
    var cB = [], dB = [];
    var slider = el('input', { type: 'range', min: '0', max: String(SPAN), step: '1', value: String(S.t), 'aria-label': 'Moment when Bia opens the page, in seconds' });
    var readout = el('p', { class: 'ttl-read', 'aria-live': 'polite' });
    var track = el('div', { class: 'ttl-track', role: 'img' });
    var scale = el('div', { class: 'ttl-scale' });
    var out = el('div', { class: 'ttl-out', 'aria-live': 'polite' });

    function render() {
      press(cB, S.c); press(dB, S.del);
      var tc = CHANGES[S.c], t = S.t, del = S.del === 1;
      var staleFrom = tc, staleTo = del ? tc : TTL;
      clear(track);
      function seg(cls, from, to, label) {
        if (to <= from) return;
        track.appendChild(el('div', { class: 'ttl-seg ' + cls, style: 'width:' + ((to - from) / SPAN * 100) + '%', text: to - from >= 14 ? label : '' }));
      }
      seg('ok', 0, staleFrom, 'fresh');
      seg('bad', staleFrom, staleTo, 'stale');
      seg('ok', staleTo, SPAN, del ? 'fresh' : 'fresh (new copy)');
      track.appendChild(el('div', { class: 'ttl-mark', style: 'left:' + (t / SPAN * 100) + '%' }));
      track.setAttribute('aria-label', 'Timeline from 0 to ' + SPAN + ' seconds: stale data from ' + staleFrom + ' s to ' + staleTo + ' s');
      clear(scale);
      [0, tc, TTL, SPAN].forEach(function (v, i, a) {
        if (a.indexOf(v) !== i || (v === tc && TTL - tc < 8)) return;
        scale.appendChild(el('span', { style: 'left:' + (v / SPAN * 100) + '%', text: v + ' s' }));
      });

      readout.textContent = 'Bia opens the page at t = ' + t + ' s';
      var cacheSay, bankSay, status, cls;
      if (t < tc) {
        cacheSay = 'hit, 1 ms: 89.90'; bankSay = '89.90'; status = 'Fresh: the cache and the database say the same price.'; cls = 'ok';
      } else if (del) {
        cacheSay = 'miss: the key was deleted at t = ' + tc + ' s. Reads the database (40 ms) and writes 79.90 again, with a 60 s TTL'; bankSay = '79.90';
        status = 'Fresh: whoever wrote the price also deleted produto:42, so the next request already brings 79.90.'; cls = 'ok';
      } else if (t < TTL) {
        cacheSay = 'hit, 1 ms: 89.90'; bankSay = '79.90';
        status = 'Stale data for ' + (t - tc) + ' s. The cache didn\'t break, it just fell behind: the TTL hasn\'t expired yet.'; cls = 'bad';
      } else {
        cacheSay = 'miss: the TTL expired at t = 60 s. Reads the database (40 ms) and writes 79.90 again'; bankSay = '79.90';
        status = 'Fresh: the old copy is already gone. It lasted ' + (TTL - tc) + ' s after the change.'; cls = 'ok';
      }
      clear(out);
      out.appendChild(table([
        ['The cache answers', cacheSay],
        ['The database says', bankSay],
        ['Total stale data', del ? '0 s (the key was deleted along with the write)' : (TTL - tc) + ' s (from t = ' + tc + ' to t = ' + TTL + ')']
      ]));
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: status }));
    }
    slider.addEventListener('input', function () { S.t = Number(slider.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. When the price changes to 79.90 (the cache was written at t = 0, 60 s TTL)' }));
    root.appendChild(chipRow('Moment of the price change', CHANGES.map(function (v) { return 't = ' + v + ' s'; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. What the store does at write time' }));
    root.appendChild(chipRow('Invalidation', ['Just wait for the TTL', 'Delete produto:42 (DEL)'], dB, function (i) { S.del = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Drag the clock' }));
    root.appendChild(slider);
    root.appendChild(readout);
    root.appendChild(track);
    root.appendChild(scale);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The worst case is changing the price right after writing the cache (t = 5 s): 55 s of stale data. The full 60 s only happens if the change comes at the very instant of the write.' }));
    render();
  }

  /* =============== LESSON 3: eviction simulator (LRU, LFU, FIFO) =============== */
  var CAPACITY = 3;
  var PRODUCTS = [42, 7, 13, 99, 5];
  var READY = [42, 7, 42, 13, 99];
  var POLICIES = ['LRU', 'LFU', 'FIFO'];
  function simulate(policy, seq) {
    var items = [], clock = 0, hits = 0, log = [];
    seq.forEach(function (k) {
      clock++;
      var it = items.filter(function (x) { return x.k === k; })[0];
      if (it) { it.last = clock; it.freq++; hits++; log.push({ k: k, hit: true }); return; }
      var gone = null;
      if (items.length >= CAPACITY) {
        var order = items.slice().sort(function (a, b) {
          if (policy === 'LRU') return a.last - b.last;
          if (policy === 'FIFO') return a.ins - b.ins;
          return a.freq - b.freq || a.ins - b.ins;
        });
        gone = order[0];
        items = items.filter(function (x) { return x !== gone; });
      }
      items.push({ k: k, ins: clock, last: clock, freq: 1 });
      log.push({ k: k, hit: false, gone: gone ? gone.k : null });
    });
    return { items: items.sort(function (a, b) { return a.ins - b.ins; }), hits: hits, log: log };
  }
  function wEvict(root) {
    var S = { seq: [] };
    var grid = el('div', { class: 'ls-grid ev-grid' });
    var hist = el('p', { class: 'sr-note ev-hist', 'aria-live': 'polite' });
    var bs = [];
    var bReady = el('button', { type: 'button', class: 'btn primary', text: 'Ready-made sequence: 42, 7, 42, 13, 99' });
    var bNext = el('button', { type: 'button', class: 'btn', text: 'Request produto:42 again' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Reset' });

    function render() {
      clear(grid);
      POLICIES.forEach(function (p) {
        var r = simulate(p, S.seq);
        var last = r.log[r.log.length - 1];
        var slots = el('ul', { class: 'ls-list ev-slots' });
        for (var i = 0; i < CAPACITY; i++) {
          var it = r.items[i];
          slots.appendChild(el('li', { class: 'ev-slot' + (it ? '' : ' empty'), text: it ? 'produto:' + it.k + (it.freq > 1 ? ' · ' + it.freq + ' requests' : '') : 'free slot' }));
        }
        var say = !last ? 'Request a product.' : last.hit ? 'produto:' + last.k + ': hit.' : last.gone != null ? 'produto:' + last.k + ': miss. produto:' + last.gone + ' was evicted.' : 'produto:' + last.k + ': miss, went into a free slot.';
        var total = r.log.length;
        grid.appendChild(el('div', { class: 'ls-panel' }, [
          el('p', { class: 'ls-h', text: p }),
          slots,
          el('p', { class: 'ev-say', text: say }),
          el('p', { class: 'sr-note', text: total ? r.hits + (r.hits === 1 ? ' hit' : ' hits') + ' in ' + total + (total === 1 ? ' request' : ' requests') : '' })
        ]));
      });
      clear(hist);
      hist.textContent = S.seq.length ? 'Requests: ' + S.seq.map(function (k) { return 'produto:' + k; }).join(' → ') : 'No requests yet. The ready-made sequence is the one in the figure.';
      bNext.disabled = S.seq.length === 0;
    }
    function add(k) { S.seq.push(k); render(); }

    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Request a product' });
    PRODUCTS.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'chip', text: k === 42 ? 'produto:42 (plush cat)' : 'produto:' + k });
      b.addEventListener('click', function () { add(k); });
      row.appendChild(b); bs.push(b);
    });
    bReady.addEventListener('click', function () { S.seq = READY.slice(); render(); });
    bNext.addEventListener('click', function () { add(42); });
    bReset.addEventListener('click', function () { S.seq = []; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Request a product (the cache has 3 slots)' }));
    root.appendChild(row);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReady, bNext, bReset]));
    root.appendChild(hist);
    root.appendChild(grid);
    root.appendChild(el('p', { class: 'sr-note', text: 'In LFU, a tie in requests is broken by the oldest (whoever entered first). Other implementations break ties differently.' }));
    render();
  }

  /* =============== LESSON 4: hit rate and average time calculator =============== */
  function wHitRate(root) {
    var TOTALS = [10, 1000], CACHES = [1, 0.05], DBS = [40, 10];
    var S = { n: 0, h: 8, c: 0, d: 0 };
    var nB = [], cB = [], dB = [];
    var slider = el('input', { type: 'range', min: '0', max: '10', step: '1', value: '8', 'aria-label': 'Number of hits' });
    var label = el('p', { class: 'ttl-read', 'aria-live': 'polite' });
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(nB, S.n); press(cB, S.c); press(dB, S.d);
      var total = TOTALS[S.n], c = CACHES[S.c], d = DBS[S.d];
      slider.max = String(total);
      slider.step = total > 10 ? '10' : '1';
      if (S.h > total) S.h = total;
      slider.value = String(S.h);
      var hits = S.h, misses = total - hits, h = hits / total;
      var hitCost = c, missCost = c + d;
      var avg = h * hitCost + (1 - h) * missCost;
      var gain = d / avg;
      var be = c / d * 100;
      label.textContent = fmt(hits) + (hits === 1 ? ' hit and ' : ' hits and ') + fmt(misses) + (misses === 1 ? ' miss' : ' misses') + ' in ' + fmt(total) + ' requests';
      clear(out);
      out.appendChild(table([
        ['Hit rate', fmt(h * 100) + '% (' + hits + ' ÷ ' + fmt(total) + ')'],
        ['Cost of a hit', fmt(hitCost) + ' ms'],
        ['Cost of a miss', fmt(c) + ' + ' + fmt(d) + ' = ' + fmt(missCost) + ' ms'],
        ['Average time with cache', fmt(h) + ' × ' + fmt(hitCost) + ' + ' + fmt(1 - h) + ' × ' + fmt(missCost) + ' = ' + fmt(avg) + ' ms'],
        ['Time without cache', fmt(d) + ' ms'],
        ['The database receives', fmt((1 - h) * 100) + '% of the reads (' + fmt(misses) + ' of ' + fmt(total) + ')']
      ]));
      var worse = avg > d;
      out.appendChild(el('p', { class: 'ib-verdict ' + (worse ? 'bad' : 'ok'), text: worse
        ? 'The cache makes it worse: ' + fmt(avg) + ' ms against ' + fmt(d) + ' ms without it. Below a ' + fmt(be) + '% hit rate, the cache costs more than it helps.'
        : 'The cache pays off: the page gets ' + fmt(gain) + ' times faster. The break-even point in this math is a ' + fmt(be) + '% hit rate.' }));
    }
    slider.addEventListener('input', function () { S.h = Number(slider.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Requests counted' }));
    root.appendChild(chipRow('Requests counted', TOTALS.map(function (v) { return fmt(v) + ' requests'; }), nB, function (i) {
      var old = TOTALS[S.n]; S.n = i; S.h = Math.round(S.h / old * TOTALS[i]); render();
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. How many were hits' }));
    root.appendChild(slider);
    root.appendChild(label);
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Where the cache lives' }));
    root.appendChild(chipRow('Cache speed', ['Redis: 1 ms', 'Hashmap in the app: 0.05 ms'], cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '4. Database speed' }));
    root.appendChild(chipRow('Database speed', ['40 ms (the store\'s)', '10 ms (relaxed database)'], dB, function (i) { S.d = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The store\'s example math is 8 hits in 10 requests, Redis and a 40 ms database: 9 ms. The math ignores the time to write the copy to the cache after a miss.' }));
    render();
  }

  /* =============== LESSON 7: CDN proxy key (sha1 of method + path + query) =============== */
  function sha1hex(str) {
    var bytes = unescape(encodeURIComponent(str)).split('').map(function (c) { return c.charCodeAt(0); });
    var l = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var bits = l * 8;
    for (var i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
    var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    function rol(x, n) { return (x << n) | (x >>> (32 - n)); }
    for (var o = 0; o < bytes.length; o += 64) {
      var w = [];
      for (var t = 0; t < 16; t++) w[t] = (bytes[o + 4 * t] << 24) | (bytes[o + 4 * t + 1] << 16) | (bytes[o + 4 * t + 2] << 8) | bytes[o + 4 * t + 3];
      for (t = 16; t < 80; t++) w[t] = rol(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
      for (t = 0; t < 80; t++) {
        var f, k;
        if (t < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        var tmp = (rol(a, 5) + f + e + k + w[t]) | 0;
        e = d; d = c; c = rol(b, 30); b = a; a = tmp;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0;
    }
    return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function wCdnKey(root) {
    var PICKS = [
      { n: 'GET /gato.jpg', m: 'GET', p: '/gato.jpg', q: '' },
      { n: 'GET /gato.jpg?v=2', m: 'GET', p: '/gato.jpg', q: 'v=2' },
      { n: 'POST /gato.jpg', m: 'POST', p: '/gato.jpg', q: '' },
      { n: 'GET /busca?q=gato', m: 'GET', p: '/busca', q: 'q=gato' }
    ];
    var S = { m: 'GET', p: '/gato.jpg', q: '' };
    var pB = [];
    var iP = el('input', { type: 'text', class: 'ck-in', value: S.p, 'aria-label': 'Path', autocomplete: 'off', spellcheck: 'false' });
    var iQ = el('input', { type: 'text', class: 'ck-in', value: S.q, 'aria-label': 'Query (RawQuery, without the question mark)', autocomplete: 'off', spellcheck: 'false', placeholder: 'e.g. v=2' });
    var mB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(mB, S.m === 'GET' ? 0 : 1);
      var text = S.m + S.p + S.q;
      var hash = sha1hex(text);
      clear(out);
      out.appendChild(table([
        ['Key text (line 21)', text],
        ['SHA-1 (lines 68 to 72)', hash],
        ['File on disk', 'cache/' + hash],
        ['What the origin receives (line 32)', 'GET ' + S.p + '  (origem + Path)']
      ]));
      var notes = [];
      if (S.q) notes.push('The query "' + S.q + '" changed the file name, but it doesn\'t go to the origin: two different queries store the same response.');
      if (S.m !== 'GET') notes.push('The method went into the key, but line 33 always does http.Get: the file stores the response of a GET.');
      if (!notes.length) notes.push('For GET /gato.jpg it\'s the file f34b9897…, the same as in the lesson. Try adding a query or changing the method.');
      out.appendChild(el('p', { class: 'ib-verdict ' + (S.q || S.m !== 'GET' ? 'bad' : 'ok'), text: notes.join(' ') }));
    }
    iP.addEventListener('input', function () { S.p = iP.value; render(); });
    iQ.addEventListener('input', function () { S.q = iQ.value; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Ready-made requests' }));
    root.appendChild(chipRow('Ready-made requests', PICKS.map(function (x) { return x.n; }), pB, function (i) {
      var x = PICKS[i]; S.m = x.m; S.p = x.p; S.q = x.q; iP.value = x.p; iQ.value = x.q; render(); press(pB, i);
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Method' }));
    root.appendChild(chipRow('Method', ['GET', 'POST'], mB, function (i) { S.m = i === 0 ? 'GET' : 'POST'; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Path' }));
    root.appendChild(iP);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Query (RawQuery, without the "?")' }));
    root.appendChild(iQ);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    render();
  }

  var REG = { ttl: wTtl, evict: wEvict, hitrate: wHitRate, cdnkey: wCdnKey };
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
