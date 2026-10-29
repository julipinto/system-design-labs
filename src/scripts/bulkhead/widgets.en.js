/* SDLabs · Bulkhead Pattern: plain JS widgets (English copy)
   (pool and Little, shared × separate, blast radius, multiplexing with Erlang C, priority lanes and noisy neighbor).
   Usam os números do brief: pool de 20 conexões ao banco do pedidos; checkout 10/s × 20 ms, status do pedido 40/s × 5 ms,
   relatório das 23:00 10/s × 4 s (entre 20 s e 50 s); 16 + 4; Little pede 4 + 4; lanes 12 · 6 · 2; Erlang C com 12 workers (18,4% × 42,9%);
   raio 60% → 40% com o shard dedicado; teto de 100 req/s do mkt-01 em 1.000 req/s do catalogo.
   Os números do k6 são os reais (v2.3.0, 20–21/10/2026). O modelo do navegador é outro gerador de chegadas: veja a nota do widget. */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
  function fmtPct(p, d) { return fmt(p * 100, d == null ? 1 : d) + '%'; }
  function fmtMin(min) {
    if (min >= 60) return fmt(min, 0) + ' min';
    return fmt(min, 1) + ' min';
  }

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
  var uid = 0;
  function slider(label, min, max, step, value, unit, fmtv) {
    var id = 'bk-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : fmt(+inp.value, 2)) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return {
      input: inp,
      set: function (v) { inp.value = String(v); sync(); },
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp])
    };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' bk-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table bk-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  /* barra de 0 a 100% com o valor escrito dentro */
  function bar(label, frac, text, bad) {
    var fill = el('div', { class: 'sr-fill' + (bad ? ' cap' : ' win') });
    fill.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [fill, el('span', { class: 'sr-lbl', text: text })])]);
  }

  /* =============== AULA 1: pool e Little =============== */
  function wPoolLittle(root) {
    var JOB = 6000; /* report queries (10 min at 10/s) */
    var lc = slider('Checkout: orders per second', 1, 30, 1, 10, '/s');
    var wc = slider('Checkout: time of each one', 5, 100, 5, 20, 'ms');
    var ls = slider('Order status: queries per second', 5, 100, 5, 40, '/s');
    var ws = slider('Order status: time of each one', 1, 50, 1, 5, 'ms');
    var lr = slider('Report: queries per second', 1, 20, 1, 10, '/s');
    var wr = slider('Report: time of each query', 1, 10, 1, 4, 's');
    var pool = slider('Pool size', 8, 60, 2, 20, 'connections');
    var inte = slider('Interactive slots (if split)', 2, 58, 2, 16, 'connections');
    var dB = [], rB = [], S = { div: 0, rel: 1 };
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var P = +pool.input.value;
      var I = Math.min(+inte.input.value, P - 2), B = P - I;
      var Lc = +lc.input.value * +wc.input.value / 1000;
      var Ls = +ls.input.value * +ws.input.value / 1000;
      var Lr = S.rel ? +lr.input.value * +wr.input.value : 0;
      var Lint = Lc + Ls, tot = Lint + Lr;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Checkout (λ × W)', fmt(Lc, 2) + ' connections'),
        fact('Order status (λ × W)', fmt(Ls, 2) + ' connections'),
        fact('Report (λ × W)', S.rel ? fmt(Lr, 1) + ' connections' : 'off', Lr > (S.div ? B : P))
      ]));
      var rows;
      if (!S.div) {
        var sat = tot > P + 1e-9;
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('In use, all together', fmt(tot, 1) + ' of ' + P, sat),
          fact('Saturates', sat ? 'yes: the whole pool' : 'no', sat),
          fact('Left for the customer', sat ? 'only what the report releases' : fmt(P - tot, 1) + ' connections', sat)
        ]));
        out.appendChild(verdict(sat,
          sat ? 'The report alone asks for ' + fmt(Lr, 0) + ' from a pool of ' + P + '.' : 'It fits: ' + fmt(tot, 1) + ' in use of ' + P + '.',
          sat ? 'The customer\'s ' + fmt(+ws.input.value, 0) + ' ms queries arrive and all ' + P + ' slots are already held: a full pool is an instant 503. This is what k6 measured in lesson 1.'
            : 'Turn on the 10/s × 4 s report to watch the pool saturate: 0.4 + 40 = 40.4 of 20.'));
      } else {
        var satI = Lint > I + 1e-9, satB = Lr > B + 1e-9;
        var cap = B / +wr.input.value, jobMin = Lr ? JOB / Math.min(+lr.input.value, cap) / 60 : JOB / +lr.input.value / 60;
        var jobFree = JOB / +lr.input.value / 60;
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Interactive: in use of ' + I, fmt(Lint, 2), satI),
          fact('Batch: asks ' + fmt(Lr, 0) + ' of ' + B, satB ? 'only it saturates' : (S.rel ? 'fits' : 'off'), satB),
          fact('Batch serves', fmt(cap, 2) + ' query/s (' + B + ' ÷ ' + fmt(+wr.input.value, 0) + ' s)', satB)
        ]));
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Job of ' + fmt(JOB, 0) + ' queries', S.rel ? fmtMin(jobMin) : '—', S.rel && jobMin > jobFree * 1.01),
          fact('Without the split (at ' + fmt(+lr.input.value, 0) + '/s)', fmtMin(jobFree)),
          fact('By Little, enough would be', fmt(Math.max(2, Math.ceil(Lint * 10)) + 4, 0) + ' connections (0.4 × 10 + 4)')
        ]));
        out.appendChild(verdict(satI,
          satI ? 'Even interactive saturates: ' + fmt(Lint, 1) + ' in use for ' + I + ' slots.' : (satB ? 'The hole stays in the batch compartment.' : 'Nothing saturates.'),
          satI ? 'Increase the interactive slots or lower the rate.'
            : (satB ? 'The customer has ' + fmt(I - Lint, 1) + ' slots to spare. The report gets a 503 on queries beyond ' + B + ' concurrent and the job takes ' + fmtMin(jobMin) + ' instead of ' + fmtMin(jobFree) + ': batch tolerates it, the customer does not.'
              : 'The report fits in its ' + B + ' slots.')));
      }
      out.appendChild(note('Little: connections in use = λ × W. k6 split: 16 + 4. By the math 4 + 4 = 8 would be enough and the other 12 connections would go back to the database\'s max_connections (100). A full pool returns 503 with no queue (semaphore).'));
    }
    function pickD(i) { S.div = i; press(dB, i); render(); }
    function pickR(i) { S.rel = i; press(rB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lc.wrap, wc.wrap, ls.wrap, ws.wrap, lr.wrap, wr.wrap, pool.wrap, inte.wrap]));
    root.appendChild(chipRow('Pool', ['Single', 'Split (interactive + batch)'], dB, pickD));
    root.appendChild(chipRow('23:00 report', ['Off', 'On'], rB, pickR));
    [lc, wc, ls, ws, lr, wr, pool, inte].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickD(0); pickR(1);
  }

  /* =============== AULA 1: compartilhado × separado (k6 e modelo) =============== */
  /* k6 real, janela "durante" 25–50 s (resultados-k6.txt) */
  var K6 = {
    shared: { post: { ok: 66.8, n: 250, e: 83, p95: 66 }, get: { ok: 89.9, n: 1001, e: 101, p95: 15 }, rel: { ok: 47.2, n: 250, e: 132, p95: 12001 } },
    bulkhead: { post: { ok: 100, n: 250, e: 0, p95: 54 }, get: { ok: 100, n: 1000, e: 0, p95: 15 }, rel: { ok: 14.0, n: 250, e: 215, p95: 7444 } }
  };
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* o cenário do k6 (80 s; relatório de 20 s a 50 s) contra um pool único de P ou contra I + (P − I); semáforo, sem fila */
  function simPool(div, P, I, rel, seed) {
    var R = rng(seed), JIT = 0.003;
    function ex(m) { return -Math.log(1 - R()) * m; }
    var pools = div ? { int: { n: I, busy: 0 }, batch: { n: P - I, busy: 0 } } : { all: { n: P, busy: 0 } };
    var ev = [];
    function arr(tipo, rate, t0, t1) { for (var t = t0; t < t1 - 1e-9; t += 1 / rate) ev.push({ t: t + R() * JIT, tipo: tipo }); }
    arr('post', 10, 0, 80); arr('get', 40, 0, 80); if (rel) arr('rel', 10, 20, 50);
    ev.sort(function (a, b) { return a.t - b.t; });
    var W = { post: 0.020, get: 0.005, rel: 4 }, rels = [], res = { post: [], get: [], rel: [] };
    ev.forEach(function (e) {
      rels.sort(function (a, b) { return a.t - b.t; });
      while (rels.length && rels[0].t <= e.t) rels.shift().p.busy--;
      var p = div ? (e.tipo === 'rel' ? pools.batch : pools.int) : pools.all;
      var ok = p.busy < p.n, w = 0;
      if (ok) { p.busy++; w = ex(W[e.tipo]); rels.push({ t: e.t + w, p: p }); }
      res[e.tipo].push({ t: e.t, ok: ok, w: w });
    });
    return res;
  }
  function janela(a, t0, t1) {
    var x = a.filter(function (r) { return r.t >= t0 && r.t < t1; });
    var okv = x.filter(function (r) { return r.ok; });
    var w = okv.map(function (r) { return r.w; }).sort(function (p, q) { return p - q; });
    return { n: x.length, ok: x.length ? okv.length / x.length : 1, e: x.length - okv.length, p95: w.length ? w[Math.min(w.length - 1, Math.ceil(0.95 * w.length) - 1)] * 1000 : 0 };
  }
  function wK6(root) {
    var pool = slider('Pool size', 8, 60, 2, 20, 'connections');
    var inte = slider('Interactive slots (if split)', 2, 58, 2, 16, 'connections');
    var dB = [], rB = [], S = { div: 0, rel: 1 };
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var P = +pool.input.value, I = Math.min(+inte.input.value, P - 2);
      var N = 5, acc = { post: [], get: [], rel: [] };
      for (var s = 1; s <= N; s++) {
        var r = simPool(!!S.div, P, I, !!S.rel, s);
        ['post', 'get', 'rel'].forEach(function (k) { acc[k].push(janela(r[k], 25, 50)); });
      }
      function mean(k, f) { return acc[k].reduce(function (a, x) { return a + x[f]; }, 0) / N; }
      var canon = P === 20 && S.rel && ((!S.div) || I === 16);
      var kk = canon ? (S.div ? K6.bulkhead : K6.shared) : null;
      var names = { post: 'Checkout (POST)', get: 'Status (GET)', rel: 'Report' };
      var rows = [];
      clear(out);
      ['post', 'get', 'rel'].forEach(function (k) {
        var okM = mean(k, 'ok');
        rows.push({ cells: [
          { text: names[k].split(' ')[0] },
          { text: S.rel || k !== 'rel' ? fmtPct(okM, 1) + '\np95 ' + fmt(mean(k, 'p95'), 0) + ' ms' : '—' },
          { text: kk ? fmt(kk[k].ok, 1) + '%\n' + kk[k].e + ' × 503\np95 ' + fmt(kk[k].p95, 0) + ' ms' : '—' }
        ] });
      });
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Success rate of each flow in the 25 to 50 s window' }, ['post', 'get', 'rel'].map(function (k) {
        var okM = mean(k, 'ok');
        var vazio = !S.rel && k === 'rel';
        return bar(names[k].split(' ')[0], vazio ? 0 : okM, vazio ? 'off' : fmtPct(okM, 0) + ' ok', !vazio && okM < 0.95);
      })));
      out.appendChild(table(['Window 25–50 s', 'Model', 'Real k6'], rows));
      out.appendChild(el('p', { class: 'bk-axis', text: 'Model: average of 5 draws in the browser. k6: one 80 s run.' }));
      var cliente = Math.min(mean('post', 'ok'), mean('get', 'ok'));
      var bad = cliente < 0.99;
      out.appendChild(verdict(bad,
        bad ? 'The customer loses requests: ' + fmtPct(1 - mean('post', 'ok'), 0) + ' of checkout and ' + fmtPct(1 - mean('get', 'ok'), 0) + ' of status get a 503.' : 'The customer loses nothing in the window.',
        !S.rel ? 'Without the report the pool barely moves: the customer uses 0.4 of ' + P + '.'
          : (S.div ? (bad ? 'The interactive compartment (' + I + ') is squeezed too.' : 'The batch pays: ' + fmtPct(1 - mean('rel', 'ok'), 0) + ' of its queries get a 503. The bulkhead did not create capacity, it chose who waits.')
            : 'The report asks for 40 connections for ' + P + ' and pushes the customer out. Split the pool and compare.')));
      out.appendChild(note(canon ? 'With 20 connections (single or 16 + 4) the right-hand column is k6 v2.3.0, run on 20–21/10/2026 against loja-pool.js: outside the report window every flow stays at 100%. The browser model uses arrivals at regular intervals with a small random draw, and its split of losses between checkout and status does not match k6\'s (the POST and the report arrive at the same instants and fight for the same slot); the direction is the same.'
        : 'k6 only ran with 20 connections, single or 16 + 4, and the report on. Outside that, the k6 column stays empty. The browser model redoes the scenario with arrivals at regular intervals and a small random draw, with no queue: a full pool is a 503.'));
    }
    function pickD(i) { S.div = i; press(dB, i); render(); }
    function pickR(i) { S.rel = i; press(rB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pool.wrap, inte.wrap]));
    root.appendChild(chipRow('Pool', ['Single', 'Split (16 + 4 in k6)'], dB, pickD));
    root.appendChild(chipRow('Report between 20 s and 50 s', ['Off', 'On'], rB, pickR));
    [pool, inte].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickD(0); pickR(1);
  }

  /* =============== AULA 2: Erlang C =============== */
  function erlangC(c, a) {
    if (a >= c) return 1;
    var b = 1;
    for (var k = 1; k <= c; k++) b = a * b / (k + a * b);
    return b / (1 - (a / c) * (1 - b));
  }
  function wqMs(c, a, S) { return erlangC(c, a) * S / (c - a); }
  function wErlang(root) {
    var total = slider('Total workers', 4, 60, 1, 12, 'workers');
    var carga = slider('Load', 0.5, 0.9, 0.05, 0.7, '', function (v) { return fmt(v * 100, 0) + '%'; });
    var svc = slider('Service time S', 10, 200, 10, 50, 'ms');
    var nB = [], NS = [1, 2, 3, 4, 6], S = { n: 2 };
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var T = +total.input.value, rho = +carga.input.value, Sm = +svc.input.value, p = NS[S.n];
      var per = Math.floor(T / p);
      clear(out);
      if (per < 1) { out.appendChild(verdict(true, 'Too many pools for ' + T + ' workers.', 'Each pool needs at least 1 worker.')); return; }
      var use = per * p, aTot = use * rho, aP = aTot / p;
      var P1 = erlangC(use, aTot), W1 = wqMs(use, aTot, Sm);
      var Pn = erlangC(per, aP), Wn = wqMs(per, aP, Sm);
      /* menor tamanho por pool que iguala a probabilidade e a espera do pool único */
      var kP = null, kW = null;
      for (var k = Math.floor(aP) + 1; k <= 400 && (kP === null || kW === null); k++) {
        if (kP === null && erlangC(k, aP) <= P1 * 1.05) kP = k;
        if (kW === null && wqMs(k, aP, Sm) <= W1 + 1e-9) kW = k;
      }
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('1 pool of ' + use + ' · waits', fmtPct(P1, 1) + ' of the time'),
        fact(p + ' pools of ' + per + ' · waits', p === 1 ? 'same as above' : fmtPct(Pn, 1) + ' of the time', Pn > P1 + 0.01),
        fact('Average wait: single × split', fmt(W1, 1) + ' ms × ' + (p === 1 ? fmt(W1, 1) : fmt(Wn, 1)) + ' ms', Wn > W1 * 1.5)
      ]));
      function cell(P, W, bad) { return { text: fmtPct(P, 1) + '\n' + fmt(W, 1) + ' ms', cls: bad ? 'bk-bad' : '' }; }
      var rows = [
        { cells: [{ text: '1 pool of ' + use }, cell(P1, W1), { text: String(use) }] },
        { cells: [{ text: p + ' pools of ' + per }, cell(Pn, Wn, Pn > P1 + 0.01 || Wn > W1 * 1.5), { text: String(use) }] }
      ];
      if (p > 1 && kP) rows.push({ cells: [{ text: p + ' pools of ' + kP + ' (matches the chance)' }, cell(erlangC(kP, aP), wqMs(kP, aP, Sm)), { text: kP * p + ' (+' + fmt((kP * p / use - 1) * 100, 0) + '%)' }] });
      if (p > 1 && kW) rows.push({ cells: [{ text: p + ' pools of ' + kW + ' (matches the wait)' }, cell(erlangC(kW, aP), wqMs(kW, aP, Sm)), { text: kW * p + ' (+' + fmt((kW * p / use - 1) * 100, 0) + '%)' }] });
      out.appendChild(table(['Load ' + fmt(rho * 100, 0) + '%, S = ' + Sm + ' ms', 'Chance of waiting and average wait', 'Workers'], rows));
      var worse = p > 1 && Pn > P1 + 0.005;
      out.appendChild(verdict(worse,
        p === 1 ? 'A single pool: the best average case.' : (worse ? 'Splitting worsens the normal case.' : 'Here the split hardly costs anything.'),
        p === 1 ? 'Any free worker serves any flow: that is statistical multiplexing. Increase the number of pools to see the price.'
          : 'The chance of waiting goes from ' + fmtPct(P1, 1) + ' to ' + fmtPct(Pn, 1) + ' and the average wait from ' + fmt(W1, 1) + ' to ' + fmt(Wn, 1) + ' ms. In exchange, the worst case is contained: a saturated pool does not take the others down.'));
      out.appendChild(note('Erlang C (M/M/c queue, module 23): P(wait) = C(c, a) and average wait = C × S ÷ (c × (1 − ρ)). Module numbers: 12 workers, 70% load (8.4 erlangs), S = 50 ms → 18.4% and 2.6 ms; in 3 pools of 4 → 42.9% and 17.9 ms; matching the chance of waiting (within 5%) takes 5 per pool (15, +25%) and matching the wait takes 6 per pool (18, +50%). Calculations redone in Python on 20/10/2026.'));
    }
    function pickN(i) { S.n = i; press(nB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [total.wrap, carga.wrap, svc.wrap]));
    root.appendChild(chipRow('Number of pools', ['1 pool', '2 pools', '3 pools', '4 pools', '6 pools'], nB, pickN));
    [total, carga, svc].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickN(2);
  }

  /* =============== AULA 3: raio de explosão =============== */
  function comb(n, k) {
    var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }
  var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  function pot10(x) {
    var e = Math.floor(Math.log10(x)), m = x / Math.pow(10, e);
    if (m > 9.5) { e += 1; m = 1; }
    var sup = String(e).split('').map(function (c) { return SUP[c]; }).join('');
    return (m < 1.05 ? '' : fmt(m, 1) + ' × ') + '10' + sup;
  }
  function wRaio(root) {
    var nS = slider('Compartments (N)', 1, 100, 1, 3, '');
    var reps = slider('Replicas (shuffle sharding)', 4, 20, 1, 10, 'replicas');
    var kk = slider('Replicas per customer', 1, 4, 1, 2, '');
    var dB = [], pB = [], S = { d: 0, p: 1 };
    var PS = [0.01, 0.001, 0.0001], PL = ['99%', '99.9%', '99.99%'];
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function fracs(n, d) {
      /* mkt-01 has 40% of the traffic; the other 60% is split equally */
      var a = [], i;
      if (d === 0 || n === 1) { for (i = 0; i < n; i++) a.push(1 / n); return a; }
      if (d === 1) { for (i = 0; i < n; i++) a.push(0.6 / n); a[0] += 0.4; return a; }
      for (i = 0; i < n - 1; i++) a.push(0.6 / (n - 1));
      a.push(0.4); return a;
    }
    function render() {
      var N = +nS.input.value, d = S.d, p = PS[S.p];
      var f = fracs(N, d), worst = Math.max.apply(null, f);
      var n = +reps.input.value, k = Math.min(+kk.input.value, n - 1);
      var C = comb(n, k);
      var algum = 1 - Math.pow(1 - p, N), todos = Math.pow(p, N);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Average radius (1 ÷ N)', fmtPct(1 / N, 1)),
        fact('Worst case', fmtPct(worst, 1), worst > 1 / N + 0.005),
        fact('Availability in the worst incident', fmtPct(1 - worst, 1))
      ]));
      var draw = Math.min(N, 20);
      var chart = el('div', { class: 'bk-shards', role: 'img', 'aria-label': 'Share of traffic in each compartment' });
      var max = Math.max(worst, 0.0001);
      for (var i = 0; i < draw; i++) {
        var v = f[i], hot = v >= worst - 1e-9 && worst > 1 / N + 0.005;
        var col = el('div', { class: 'bk-shard' + (hot ? ' hot' : '') });
        var b = el('i'); b.style.height = Math.max(3, v / max * 100) + '%';
        col.appendChild(b); col.appendChild(el('span', { text: fmt(v * 100, v < 0.1 ? 1 : 0) + '%' }));
        chart.appendChild(col);
      }
      out.appendChild(chart);
      if (N > 20) out.appendChild(el('p', { class: 'bk-axis', text: 'Showing the first 20 of ' + N + ' compartments.' }));
      var verb = d === 0 ? 'Uniform traffic: the radius is 1 ÷ N.' : (d === 1 ? 'mkt-01 (40%) shares a compartment with the others: ' + fmtPct(0.6 / N + 0.4, 0) + ' of the traffic.' : 'mkt-01 alone in a compartment (40%); the others split 60%.');
      out.appendChild(verdict(worst > 1 / N + 0.005, 'Worst case: ' + fmtPct(worst, 1) + '.', verb + (N === 1 ? ' With 1 compartment the radius is 100%.' : (d === 1 && N === 3 ? ' This is the module 16 case: 20% · 20% · 60%.' : (d === 2 && N === 4 ? ' The dedicated shard takes the worst case from 60% to 40%.' : '')))));
      out.appendChild(el('div', { class: 'sr-sub', text: 'How many incidents (each compartment at ' + PL[S.p] + ')' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Some down: 1 − (1 − p)^N', fmtPct(algum, 2)),
        fact('All down at the same time: p^N', todos < 1e-4 ? pot10(todos) : fmtPct(todos, 4)),
        fact('One customer in 1 compartment', fmtPct(p, 2))
      ]));
      out.appendChild(el('div', { class: 'sr-sub', text: 'Shuffle sharding: ' + k + ' of ' + n + ' replicas' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Combinations C(' + n + ', ' + k + ')', fmt(C, 0)),
        fact('Worst case with shuffle (1 ÷ C)', fmtPct(1 / C, 1)),
        fact('Fixed groups of ' + k + ' in ' + n + ' (' + k + ' ÷ ' + n + ')', fmtPct(k / n, 1), true)
      ]));
      out.appendChild(note('Article table: 1 → 100%, 2 → 50%, 3 → 33.3% (it writes 33%), 5 → 20%, 10 → 10%, 20 → 5%, 50 → 2%, 100 → 1%. It assumes uniform traffic. More compartments give more small incidents (1 − 0.999^N: 0.10% with 1, 4.88% with 50) and make the total outage disappear (p^N), but one customer\'s unavailability stays at 0.1%. The global inventory behind the pedidos shards has a radius of 100%, whatever N is.'));
    }
    function pickD(i) { S.d = i; press(dB, i); render(); }
    function pickP(i) { S.p = i; press(pB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap, reps.wrap, kk.wrap]));
    root.appendChild(chipRow('Traffic distribution', ['Uniform', 'With mkt-01 at 40%', 'With the dedicated shard'], dB, pickD));
    root.appendChild(chipRow('Availability of each compartment', PL, pB, pickP));
    [nS, reps, kk].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickD(0); pickP(1);
    nS.set(3); render();
  }

  /* =============== AULA 4: lanes de prioridade =============== */
  function wLanes(root) {
    var W = slider('Total workers', 10, 40, 2, 20, 'workers');
    var alta = slider('High lane (checkout)', 2, 30, 1, 12, 'workers');
    var normal = slider('Normal lane (refunds, partners)', 1, 20, 1, 6, 'workers');
    var sB = [], lB = [], S = { surto: 1, lanes: 1 };
    var DEM = { alta: 8, normal: 4, baixa: 2 }; /* workers in use in the normal regime (λ × W) */
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var T = +W.input.value, a = +alta.input.value, n = +normal.input.value;
      if (a + n >= T) { a = Math.max(1, T - n - 1); if (a + n >= T) { n = Math.max(1, T - a - 1); } }
      var b = Math.max(1, T - a - n);
      var dem = { alta: DEM.alta, normal: DEM.normal, baixa: DEM.baixa };
      if (S.surto === 1) dem.baixa = 60; /* reprocessing (or reconciliation) kicks in */
      if (S.surto === 2) dem.normal = 60; /* the mkt-01 500/s bot enters through the normal lane */
      var got = {}, tot = dem.alta + dem.normal + dem.baixa, caps = { alta: a, normal: n, baixa: b };
      ['alta', 'normal', 'baixa'].forEach(function (k) {
        got[k] = S.lanes ? Math.min(dem[k], caps[k]) : (tot <= T ? dem[k] : T * dem[k] / tot);
      });
      var names = { alta: 'High (customer checkout)', normal: 'Normal (refunds and partners)', baixa: 'Low (reprocessing)' };
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Split', S.lanes ? a + ' · ' + n + ' · ' + b : 'single pool of ' + T),
        fact('Checkout served', fmt(got.alta, 1) + ' of ' + dem.alta, got.alta < dem.alta - 0.05),
        fact('Left without a slot', fmt(tot - got.alta - got.normal - got.baixa, 1) + ' workers requested', tot - got.alta - got.normal - got.baixa > 0.05)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Workers served in each lane' }, ['alta', 'normal', 'baixa'].map(function (k) {
        var ok = got[k] >= dem[k] - 0.05;
        return bar({ alta: 'high', normal: 'normal', baixa: 'low' }[k], dem[k] ? got[k] / dem[k] : 1, fmt(got[k], 1) + ' of ' + fmt(dem[k], 0), !ok);
      })));
      var cutAlta = got.alta < dem.alta - 0.05;
      out.appendChild(verdict(cutAlta,
        cutAlta ? 'Checkout loses slots: ' + fmt(got.alta, 1) + ' of ' + dem.alta + '.' : 'Checkout keeps the ' + dem.alta + ' it asks for.',
        S.surto === 0 ? 'With no burst, everything fits in both designs: ' + dem.alta + ' + ' + dem.normal + ' + ' + dem.baixa + ' = ' + tot + ' of ' + T + '. Trigger a burst.'
          : (S.lanes ? 'The burst of ' + fmt(S.surto === 1 ? dem.baixa : dem.normal, 0) + ' workers hits the lane cap (' + (S.surto === 1 ? b : n) + ') and the rest is refused in it. The high lane was not touched.'
            : 'In the single pool the burst competes for the same slots and takes its share: checkout gets ' + fmt(T * dem.alta / tot, 1) + ' of the ' + dem.alta + ' slots it needs.')));
      out.appendChild(note('Model: in the normal regime checkout uses 8 workers, normal 4 and low 2 (λ × W). In the single pool each flow gets a share of the pool proportional to what it asks for. Module numbers: 20 workers in 12 · 6 · 2; a burst of low never goes past 2 and checkout keeps its 12.'));
    }
    function pickS(i) { S.surto = i; press(sB, i); render(); }
    function pickL(i) { S.lanes = i; press(lB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [W.wrap, alta.wrap, normal.wrap]));
    root.appendChild(chipRow('Who triggers the burst', ['No burst', 'Reprocessing (low)', 'mkt-01 bot (normal)'], sB, pickS));
    root.appendChild(chipRow('Split', ['Single pool', 'Three lanes'], lB, pickL));
    [W, alta, normal].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickS(1); pickL(1);
  }

  /* =============== AULA 5: vizinho barulhento =============== */
  function wVizinho(root) {
    var cap = slider('Catalog capacity (10 replicas)', 200, 2000, 100, 1000, 'req/s');
    var robo = slider('mkt-01 bot', 0, 1000, 50, 500, 'req/s');
    var teto = slider('mkt-01 tenant cap', 0, 1000, 50, 100, 'req/s');
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var C = +cap.input.value, R = +robo.input.value, T = +teto.input.value;
      var comTeto = T < C;
      var cons = Math.min(R, comTeto ? T : C, C);
      var r429 = comTeto ? Math.max(0, R - T) : 0;
      var sobra = C - cons, garantido = comTeto ? C - T : 0;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('The bot consumes (' + fmtPct(cons / C, 0) + ' of the fleet)', fmt(cons, 0) + ' req/s', cons / C > 0.3),
        fact('Left for the others', fmt(sobra, 0) + ' req/s', sobra / C < 0.7),
        fact('Refused with 429 (in its own compartment)', fmt(r429, 0) + ' req/s', false)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Split of the fleet capacity' }, [
        bar('bot', cons / C, fmt(cons, 0) + ' req/s', cons / C > 0.3),
        bar('others', sobra / C, fmt(sobra, 0) + ' req/s', false)
      ]));
      out.appendChild(verdict(!comTeto && cons / C > 0.3,
        comTeto ? 'The cap of ' + fmt(T, 0) + ' req/s protects the others.' : 'With no cap, the bot takes ' + fmtPct(cons / C, 0) + ' of the fleet.',
        comTeto ? 'The bot asks for ' + fmt(R, 0) + ' and gets in with ' + fmt(cons, 0) + '; the ' + fmt(r429, 0) + ' excess get a 429 in its own compartment. The others have ' + fmt(garantido, 0) + ' req/s guaranteed (reservation).'
          : 'The cap is at ' + fmt(T, 0) + ' (equal to or above the fleet): in practice there is no compartment. Lower the cap to 100.'));
      out.appendChild(note('Module numbers: the 500 req/s bot against 10 replicas (1,000 req/s) consumes 50% of the fleet; with the cap of 100 (10% of 1,000) the other 900 are guaranteed and the bot\'s 400 get a 429. The global rate limit (module 8) protects the system from the total; the per-tenant bulkhead protects each flow from the others.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cap.wrap, robo.wrap, teto.wrap]));
    [cap, robo, teto].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  var REG = { 'pool-little': wPoolLittle, 'k6-pool': wK6, erlang: wErlang, raio: wRaio, lanes: wLanes, vizinho: wVizinho };
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
