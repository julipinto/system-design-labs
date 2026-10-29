/* SDLabs · Deployment Models: plain JS widgets (English copy)
   (rolling update, blast radius by model, canary statistical power, migration with lock_timeout,
   flag bucket and rings by shard).
   They use the store from the brief: pedidos 2.4.0 → 2.5.0, Tuesday 14:00, 5 orders/s (SP 55%, Rio 25%, Recife 20%),
   pod ready in 30 s, shipping lost of R$ 15.00 per Recife order, rings shard-0/1/2 with 20/20/60%. */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); }
  function brl(v) { return 'R$ ' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

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
    var id = 'dp-sl-' + (++uid);
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
  function select(label, options, value) {
    var id = 'dp-sl-' + (++uid);
    var sel = el('select', { id: id });
    options.forEach(function (o) { sel.appendChild(el('option', { value: o.v, text: o.t })); });
    sel.value = value;
    return { input: sel, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id, text: label }), sel]) };
  }
  function textInput(label, value) {
    var id = 'dp-sl-' + (++uid);
    var inp = el('input', { type: 'text', id: id, value: value, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id, text: label }), inp]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table dp-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(text) { return el('p', { class: 'sr-note', text: text }); }
  function bar(label, pct, text, cls) {
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [
      el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, pct)) + '%' }),
      el('span', { class: 'sr-lbl', text: text })])]);
  }
  function dur(s) {
    if (s < 1) return fmt(s * 1000, 0) + ' ms';
    if (s < 120) return fmt(s, 1) + ' s';
    return fmt(s / 60, 1) + ' min';
  }

  /* =============== LESSON 3: rolling update =============== */
  // Resolves maxSurge/maxUnavailable like Kubernetes: a percentage rounds up (surge) and down (unavailable).
  function resolve(txt, n, up) {
    var s = String(txt).trim().replace(',', '.');
    if (/%$/.test(s)) {
      var p = parseFloat(s);
      if (!isFinite(p) || p < 0) return null;
      var v = n * p / 100;
      return up ? Math.ceil(v - 1e-9) : Math.floor(v + 1e-9);
    }
    var i = parseInt(s, 10);
    return isFinite(i) && i >= 0 && String(i) === s ? i : null;
  }
  function simRolling(n, surge, unav, T) {
    var old = n, newR = 0, newP = 0, t = 0, minReady = n, waves = 0, guard = 0;
    function grow() {
      var total = old + newR + newP;
      var add = Math.min(n - (newR + newP), n + surge - total);
      if (add > 0) newP += add;
    }
    while (guard++ < 500) {
      grow();
      var ready = old + newR, kill = Math.min(old, Math.max(0, ready - (n - unav)));
      old -= kill;
      minReady = Math.min(minReady, old + newR);
      grow();
      if (old === 0 && newP === 0 && newR === n) break;
      if (newP === 0 && kill === 0) break;
      t += T; newR += newP; newP = 0; waves++;
    }
    return { time: t, waves: waves, minReady: minReady };
  }
  function wRolling(root) {
    var btns = [], PRE = [
      { n: 3, s: '25%', u: '25%', T: 30, d: 5, c: 30 },
      { n: 10, s: '25%', u: '25%', T: 30, d: 640, c: 100 }
    ];
    var nr = slider('Replicas', 1, 20, 1, 3, '', function (v) { return String(v); });
    var ms = textInput('maxSurge (number or %)', '25%');
    var mu = textInput('maxUnavailable (number or %)', '25%');
    var tr = slider('Pod ready in', 5, 120, 5, 30, 's', function (v) { return String(v); });
    var dm = slider('Demand', 1, 2000, 1, 5, 'req/s', function (v) { return fmt(v, 0); });
    var cp = slider('Capacity per pod', 1, 200, 1, 30, 'req/s', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var n = +nr.input.value, T = +tr.input.value, D = +dm.input.value, C = +cp.input.value;
      var s = resolve(ms.input.value, n, true), u = resolve(mu.input.value, n, false);
      clear(out);
      if (s == null || u == null) {
        out.appendChild(verdict(true, 'Invalid value.', 'Use a whole number (1) or a percentage (25%) in maxSurge and maxUnavailable.'));
        return;
      }
      var forced = false;
      if (s === 0 && u === 0) { u = 1; forced = true; }
      u = Math.min(u, n);
      var r = simRolling(n, s, u, T);
      var rho = D / (r.minReady * C), resp = rho >= 1 ? null : 10 + 10 / (1 - rho);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('maxSurge', fmt(s, 0) + ' pod' + (s === 1 ? '' : 's')),
        fact('maxUnavailable', fmt(u, 0) + ' pod' + (u === 1 ? '' : 's')),
        fact('Waves', fmt(r.waves, 0) + ' × ' + T + ' s'),
        fact('Total time', dur(r.time)),
        fact('Minimum ready', fmt(r.minReady, 0) + ' of ' + n),
        fact('Utilization at the minimum', rho >= 1 ? fmt(rho * 100, 1) + '%' : fmt(rho * 100, 1) + '%'),
        fact('Response at the minimum', resp == null ? 'saturates' : fmt(resp, 1) + ' ms')
      ]));
      var bad = rho >= 1 || rho > 0.9;
      var say = rho >= 1
        ? 'With ' + r.minReady + ' ready pod' + (r.minReady === 1 ? '' : 's') + ' the capacity is ' + fmt(r.minReady * C, 0) + ' req/s, below the demand of ' + fmt(D, 0) + ': the queue grows during the swap.'
        : 'At the worst moment ' + r.minReady + ' ready pods remain and CPU sits at ' + fmt(rho * 100, 1) + '%. The swap takes ' + dur(r.time) + ' and 2.5.0 traffic goes 0% → … → 100% by the slice of pods.';
      out.appendChild(verdict(bad, bad ? 'Thin margin.' : 'A comfortable swap.', say));
      if (forced) out.appendChild(note('With both at 0 Kubernetes would not let any pod swap: the widget used maxUnavailable 1.'));
      out.appendChild(note('Response = 10 + 10 ÷ (1 − utilization) ms, the model from module 14. Presets: pedidos (3 pods: 1 and 0, 90 s) and catalogo (10 pods: 3 and 2, minimum of 8 ready, 80%, 60 ms; with maxUnavailable 3: 91.4%, 126.7 ms).'));
    }
    function preset(i) {
      var p = PRE[i];
      nr.set(p.n); ms.input.value = p.s; mu.input.value = p.u; tr.set(p.T); dm.set(p.d); cp.set(p.c);
      press(btns, i); render();
    }
    root.appendChild(chipRow('Preset', ['pedidos (3 pods)', 'catalogo (10 pods)'], btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nr.wrap, ms.wrap, mu.wrap, tr.wrap, dm.wrap, cp.wrap]));
    [nr, tr, dm, cp].forEach(function (c) { c.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    [ms, mu].forEach(function (c) { c.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== LESSON 1: blast radius by model =============== */
  var MODELOS = [
    { v: 'recreate', t: 'Recreate' },
    { v: 'rolling', t: 'Rolling (3 pods)' },
    { v: 'bg-com', t: 'Blue/Green, test includes Recife' },
    { v: 'bg-sem', t: 'Blue/Green, test without Recife' },
    { v: 'canary', t: 'Canary 10% (business analysis)' },
    { v: 'shadow', t: 'Shadow 10%' },
    { v: 'flag', t: 'Feature flag at 10%' }
  ];
  function wRaio(root) {
    var md = select('Model', MODELOS, 'rolling');
    var rps = slider('Orders per second', 1, 60, 1, 5, '/s', function (v) { return String(v); });
    var rec = slider('Recife share', 0, 100, 1, 20, '%', function (v) { return String(v); });
    var val = slider('Shipping lost per order', 0, 50, 0.5, 15, '', function (v) { return brl(v); });
    var min = slider('Minutes until someone notices', 1, 600, 1, 60, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var R = +rps.input.value, P = +rec.input.value / 100, V = +val.input.value, M = +min.input.value, m = md.input.value;
      var affected = 0, back = '', who = '', refused = 0, expo = '100%';
      var full = R * P * M * 60;
      if (m === 'recreate') { affected = full; back = '40 s, offline again'; who = 'nobody: 2.5.0 is healthy'; refused = R * 40; }
      else if (m === 'rolling') { affected = full; back = '90 s (another rolling)'; who = 'nobody: the only gate is readiness'; }
      else if (m === 'bg-com') { affected = 0; back = '~1 s with blue still up (~30 s if it already left)'; who = 'green\'s smoke test, which includes an order to Recife'; expo = '0% (the test only)'; }
      else if (m === 'bg-sem') { affected = full; back = '~1 s with blue still up (~30 s if it already left)'; who = 'nobody: green\'s test does not look at Recife'; }
      else if (m === 'canary') { affected = R * 0.1 * Math.min(300, M * 60) * P; back = 'seconds (the weight goes back to 0)'; who = 'the analysis with a business metric (frete_zero by city)'; expo = '10% for up to 5 min'; }
      else if (m === 'shadow') { affected = 0; back = 'n/a: no customer was exposed'; who = 'the comparator (diff 64.00 × 49.00)'; expo = '0% (copy only)'; }
      else { affected = R * 0.1 * Math.min(300, M * 60) * P; back = 'up to 30 s (the flag cache TTL)'; who = 'the same metric, by bucket'; expo = '10% of customers by hash'; }
      var loss = affected * V;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('2.5.0 exposure', expo),
        fact('Recife orders with shipping 0', fmt(affected, 0)),
        fact('Loss', brl(loss)),
        fact('Time to go back', back),
        fact('Who notices', who)
      ]));
      if (m === 'recreate') out.appendChild(note('On top of that, Recreate refuses ' + fmt(refused, 0) + ' orders in the 40 s with no service.'));
      var bad = loss >= 10000;
      out.appendChild(verdict(bad, loss === 0 ? 'No wrong orders.' : bad ? 'Big damage.' : 'Contained damage.',
        'Blast radius = fraction of traffic exposed × time until someone notices × cost per wrong order. Here: ' +
        (loss === 0 ? 'the defect was seen before any real customer.' : fmt(affected, 0) + ' orders × ' + brl(V) + ' = ' + brl(loss) + '.')));
      out.appendChild(note('Canary and flag decide in 5 min by the business metric (or earlier, if you notice earlier). Defaults: 5 orders/s, Recife 20%, 60 min give 3,600 orders and R$ 54,000; the canary, 30 orders and R$ 450.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [md.wrap, rps.wrap, rec.wrap, val.wrap, min.wrap]));
    [md, rps, rec, val, min].forEach(function (c) { c.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 6: statistical power of the canary =============== */
  function wCanaryPoder(root) {
    var btns = [];
    var PRE = [{ r: 5, c: 10, e: 1, w: 5 }, { r: 640, c: 10, e: 1, w: 5 }];
    var rps = slider('Traffic', 1, 1000, 1, 5, 'req/s', function (v) { return fmt(v, 0); });
    var cp = slider('Canary share', 1, 50, 1, 10, '%', function (v) { return String(v); });
    var er = slider('True error rate', 0.1, 5, 0.1, 1, '%', function (v) { return fmt(v, 1); });
    var wn = slider('Window', 1, 60, 1, 5, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var R = +rps.input.value, C = +cp.input.value / 100, p = +er.input.value / 100, W = +wn.input.value;
      var rate = R * C, n = rate * W * 60;
      var seen = 1 - Math.pow(1 - p, n), miss = 1 - seen;
      var n95 = Math.ceil(Math.log(0.05) / Math.log(1 - p) - 1e-9), t95 = n95 / rate;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Reaching the canary', fmt(rate, 2) + ' req/s'),
        fact('Sample in the window', fmt(n, 0) + ' requests'),
        fact('Chance of seeing ≥ 1 error', fmt(seen * 100, 1) + '%'),
        fact('Chance of seeing none', fmt(miss * 100, 1) + '%'),
        fact('For 95% confidence', fmt(n95, 0) + ' requests'),
        fact('Time to get there', dur(t95))
      ]));
      out.appendChild(bar('Sees the error', seen * 100, fmt(seen * 100, 1) + '%', seen >= 0.95 ? 'win' : ''));
      var bad = seen < 0.95;
      out.appendChild(verdict(bad, bad ? 'The window passes a real defect.' : 'Enough sample.',
        bad ? 'With ' + fmt(n, 0) + ' requests the chance of seeing nothing is ' + fmt(miss * 100, 1) + '%: the analysis approves 2.5.0 with the defect inside. Wait ' + dur(t95) + ' or decide by number of requests, not by minutes.'
          : 'The window gathers ' + fmt(n, 0) + ' requests, above the ' + fmt(n95, 0) + ' that give 95% confidence.'));
      out.appendChild(note('1 − (1 − p)^n, with n = traffic × share × window. Lesson example: 5 orders/s at 10% for 5 min are 150 orders and a 22% chance of not seeing a 1% error; catalogo (640 req/s) reaches 298 requests in 4.7 s. The shipping defect is deterministic for Recife: 30 of the 150 orders, all wrong.'));
    }
    function preset(i) { var p = PRE[i]; rps.set(p.r); cp.set(p.c); er.set(p.e); wn.set(p.w); press(btns, i); render(); }
    root.appendChild(chipRow('Preset', ['pedidos (5/s)', 'catalogo (640/s)'], btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rps.wrap, cp.wrap, er.wrap, wn.wrap]));
    [rps, cp, er, wn].forEach(function (c) { c.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== LESSON 8: migration =============== */
  function wMigracao(root) {
    var lin = slider('Rows', 1, 50, 1, 50, 'M', function (v) { return String(v); });
    var lot = slider('Batch', 1000, 100000, 1000, 10000, 'rows', function (v) { return fmt(v, 0); });
    var pau = slider('Pause between batches', 0, 5, 0.1, 1, 's', function (v) { return fmt(v, 1); });
    var mpl = slider('Time per batch', 10, 500, 1, 66, 'ms', function (v) { return String(v); });
    var shd = slider('Shards', 1, 4, 1, 3, '', function (v) { return String(v); });
    var lt = select('lock_timeout', [{ v: '0', t: 'off' }, { v: '1', t: '1 s' }, { v: '2', t: '2 s' }, { v: '5', t: '5 s' }], '1');
    var tx = slider('Long transaction open', 3, 30, 1, 6, 's', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var N = +lin.input.value * 1e6, L = +lot.input.value, Pz = +pau.input.value, ms = +mpl.input.value, S = +shd.input.value;
      var per = N / S, batches = Math.ceil(per / L), each = ms / 1000 + Pz, total = batches * each;
      var gb = per * 1.975 / 1000;           // 1,975 MB per million rows (module 16)
      var oneShot = per / 1e6 * 8;           // 8.0 s per million rows (measured)
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Rows per shard', fmt(per / 1e6, 2) + ' M'),
        fact('Batches per shard', fmt(batches, 0)),
        fact('Backfill per shard', dur(total)),
        fact('Data per shard', fmt(gb, 1) + ' GB')
      ]));
      out.appendChild(table(['math', 'Single UPDATE', 'In batches (with VACUUM)'], [
        { cells: [{ text: 'Space afterwards' }, { text: '+100% (+' + fmt(gb, 1) + ' GB)' }, { text: '+22% (+' + fmt(gb * 0.22, 1) + ' GB)' }] },
        { cells: [{ text: 'Rows held at once' }, { text: fmt(per / 1e6, 2) + ' M, for ~' + dur(oneShot) }, { text: fmt(L, 0) + ', for ~' + fmt(ms, 0) + ' ms each' }] }
      ]));
      out.appendChild(verdict(oneShot > 60, 'The single UPDATE doubles the table.',
        'In batches of ' + fmt(L, 0) + ' with a ' + fmt(Pz, 1) + ' s pause that is ' + fmt(batches, 0) + ' batches × ' + fmt(each, 3) + ' s ≈ ' + dur(total) + ' per shard (order of magnitude; the shards run in parallel). The default is 66 ms per batch of 10,000 measured on PostgreSQL 14.'));
      // lock_timeout simulator: the long transaction starts at 0, the ALTER arrives at 1 s and the SELECT at 2 s
      var D = +tx.input.value, Lt = +lt.input.value, alterAt = 1, selAt = 2;
      var alterEnds = Lt > 0 ? Math.min(D, alterAt + Lt) : D;
      var gaveUp = Lt > 0 && alterAt + Lt < D;
      var selWait = Math.max(0, alterEnds - selAt);
      var lockRows = [
        { cells: [{ text: '0 s' }, { text: 'the long transaction opens a SELECT (lasts ' + D + ' s)' }] },
        { cells: [{ text: '1 s' }, { text: 'the ALTER TABLE asks for ACCESS EXCLUSIVE and waits' }] },
        { cells: [{ text: '2 s' }, { text: 'a simple SELECT arrives and joins the queue behind the ALTER' }] },
        { cls: gaveUp ? 'dp-bad' : '', cells: [{ text: fmt(alterEnds, 1) + ' s' }, { text: gaveUp ? 'ERROR: canceling statement due to lock timeout (the ALTER gives up)' : 'the transaction ends and the ALTER runs' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'lock_timeout simulator' }));
      out.appendChild(table(['when', 'what happens'], lockRows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('The SELECT waited', fmt(selWait, 1) + ' s'),
        fact('The ALTER waited', fmt(alterEnds - alterAt, 1) + ' s')
      ]));
      out.appendChild(verdict(selWait > 2, selWait > 2 ? 'The queue blocks everyone.' : 'The SELECT goes through.',
        gaveUp ? 'With a lock_timeout of ' + fmt(Lt, 0) + ' s the ALTER gives up in ' + fmt(Lt, 1) + ' s and the SELECT barely waits. The migration retries later.'
          : 'Without lock_timeout (or with one longer than the transaction) the ALTER waits ' + fmt(D - alterAt, 1) + ' s and the later SELECT waits ' + fmt(selWait, 1) + ' s behind it. Measured on PostgreSQL 14: 4.0 s against 1.0 s.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lin.wrap, lot.wrap, pau.wrap, mpl.wrap, shd.wrap, lt.wrap, tx.wrap]));
    [lin, lot, pau, mpl, shd, lt, tx].forEach(function (c) { c.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 11: flag bucket (murmur3 x86 32 bits, semente 0) =============== */
  function murmur3(str) {
    var bytes = Array.prototype.slice.call(new TextEncoder().encode(str)), len = bytes.length, h = 0, i = 0;
    function imul(a, b) { return Math.imul(a, b) >>> 0; }
    function rotl(x, r) { return ((x << r) | (x >>> (32 - r))) >>> 0; }
    var nb = len - (len & 3);
    for (; i < nb; i += 4) {
      var k = (bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24)) >>> 0;
      k = imul(k, 0xcc9e2d51); k = rotl(k, 15); k = imul(k, 0x1b873593);
      h = (h ^ k) >>> 0; h = rotl(h, 13); h = (imul(h, 5) + 0xe6546b64) >>> 0;
    }
    var k1 = 0, rem = len & 3;
    if (rem === 3) k1 ^= bytes[i + 2] << 16;
    if (rem >= 2) k1 ^= bytes[i + 1] << 8;
    if (rem >= 1) { k1 ^= bytes[i]; k1 = imul(k1 >>> 0, 0xcc9e2d51); k1 = rotl(k1, 15); k1 = imul(k1, 0x1b873593); h = (h ^ k1) >>> 0; }
    h = (h ^ len) >>> 0; h = (h ^ (h >>> 16)) >>> 0; h = imul(h, 0x85ebca6b); h = (h ^ (h >>> 13)) >>> 0;
    h = imul(h, 0xc2b2ae35); h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }
  function wBucket(root) {
    var CLI = ['lena-77', 'bia-31', 'caio-58', 'davi-12', 'mkt-01'], btns = [];
    var cid = textInput('cliente_id', 'lena-77');
    var flg = textInput('Flag', 'frete_v2');
    var pct = slider('Percentage', 0, 100, 1, 20, '%', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    var cache = {};
    function hist(flag) {
      if (cache[flag]) return cache[flag];
      var h = new Array(100).fill(0);
      for (var i = 0; i < 100000; i++) h[murmur3(flag + ':c-' + i) % 100]++;
      var cum = [0]; for (var b = 0; b < 100; b++) cum.push(cum[b] + h[b]);
      return (cache[flag] = cum);
    }
    function render() {
      var id = cid.input.value.trim(), fl = flg.input.value.trim(), P = +pct.input.value;
      clear(out);
      if (!id || !fl) { out.appendChild(verdict(true, 'Missing input.', 'Type a cliente_id and the flag name.')); return; }
      var hv = murmur3(fl + ':' + id), bk = hv % 100, on = bk < P;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Drawn text', fl + ':' + id),
        fact('murmur3', '0x' + ('00000000' + hv.toString(16)).slice(-8)),
        fact('Bucket (mod 100)', String(bk)),
        fact('Flag', on ? 'on' : 'off')
      ]));
      out.appendChild(verdict(false, on ? 'This customer sees 2.5.0.' : 'This customer still sees 2.4.0.',
        'on = bucket < percentage: ' + bk + (on ? ' < ' : ' ≥ ') + P + '. The same customer always lands on the same side, on any pod.'));
      out.appendChild(table(['customer', 'bucket', 'at ' + P + '%'], CLI.map(function (c) {
        var b = murmur3(fl + ':' + c) % 100;
        return { cls: c === id ? 'dp-cur' : '', cells: [{ text: c }, { text: String(b) }, { text: b < P ? 'on' : 'off' }] };
      })));
      var cum = hist(fl);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Across 100,000 customers (c-0 to c-99999)' }));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('below 1', cum[1] / 1000, fmt(cum[1], 0), ''),
        bar('below 10', cum[10] / 1000, fmt(cum[10], 0), ''),
        bar('below 50', cum[50] / 1000, fmt(cum[50], 0), ''),
        bar('at ' + P + '%', cum[P] / 1000, fmt(cum[P], 0), 'win')
      ]));
      out.appendChild(note('For frete_v2 the function gives 985, 9,878 and 49,909: it spreads as expected. The nova_home flag (another salt) gives lena-77 → 80, bia-31 → 2, caio-58 → 72, davi-12 → 67, mkt-01 → 87.'));
    }
    function pick(i) { cid.input.value = CLI[i]; press(btns, i); render(); }
    root.appendChild(chipRow('Customer', CLI, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cid.wrap, flg.wrap, pct.wrap]));
    cid.input.addEventListener('input', function () { press(btns, CLI.indexOf(cid.input.value.trim())); render(); });
    flg.input.addEventListener('input', render);
    pct.input.addEventListener('input', render);
    root.appendChild(out);
    pick(1 - 1);
  }

  /* =============== LESSON 12: rings by shard =============== */
  var ANEIS = [
    { n: 'shard-0', cli: 'davi-12', cidade: 'SP' },
    { n: 'shard-1', cli: 'lena-77 and bia-31', cidade: 'Recife' },
    { n: 'shard-2', cli: 'caio-58 and mkt-01', cidade: 'Rio' }
  ];
  var ORDENS = [[0, 1, 2], [1, 0, 2], [2, 1, 0]];
  function wAneis(root) {
    var f0 = slider('Share of shard-0', 0, 100, 5, 20, '%', function (v) { return String(v); });
    var f1 = slider('Share of shard-1', 0, 100, 5, 20, '%', function (v) { return String(v); });
    var cd = select('Defect city', [{ v: '0', t: 'SP (shard-0)' }, { v: '1', t: 'Recife (shard-1)' }, { v: '2', t: 'Rio (shard-2)' }], '1');
    var od = select('Ring order', ORDENS.map(function (o, i) { return { v: String(i), t: o.map(function (x) { return 'shard-' + x; }).join(' → ') }; }), '0');
    var sy = select('Ring 0', [{ v: '0', t: 'real customers only' }, { v: '1', t: 'with synthetic customers in every city' }], '0');
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var a = +f0.input.value, b = +f1.input.value;
      if (a + b > 100) { b = 100 - a; f1.set(b); }
      var fr = [a, b, 100 - a - b], ord = ORDENS[+od.input.value], bad = +cd.input.value, synth = sy.input.value === '1';
      var acc = 0, first = -1, expoAt = 0, rows = [];
      ord.forEach(function (s, i) {
        acc += fr[s];
        var aparece = (i === 0 && synth) || s === bad;
        if (aparece && first < 0) { first = i; expoAt = acc; }
        rows.push({ cls: i === first ? 'dp-bad' : '', cells: [{ text: 'ring ' + i }, { text: ANEIS[s].n + ' (' + ANEIS[s].cli + ')' }, { text: fr[s] + '%' }, { text: acc + '%' },
          { text: aparece ? 'yes' : 'no' }] });
      });
      clear(out);
      out.appendChild(table(['ring', 'shard', 'fraction', 'accumulated exposure', 'defect shows up?'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Shows up in ring', first < 0 ? '—' : String(first)),
        fact('Exposure at that moment', first < 0 ? '—' : expoAt + '%'),
        fact('Worst step', Math.max.apply(null, ord.map(function (s) { return fr[s]; })) + '%')
      ]));
      var late = first > 0 || first < 0;
      out.appendChild(verdict(late, first === 0 ? 'Caught in ring 0.' : 'Caught late.',
        first === 0 ? 'Ring 0 exercises ' + (synth ? 'every city (synthetic customers)' : 'the defect\'s code') + ' and the zero shipping shows up with ' + expoAt + '% of the traffic (no real customer, if they are only synthetic).'
          : 'Ring 0 (' + ANEIS[ord[0]].n + ', ' + ANEIS[ord[0]].cidade + ') does not exercise the ' + ANEIS[bad].cidade + ' defect. It only shows up in ring ' + first + ', with ' + expoAt + '% of the traffic already on 2.5.0.'));
      out.appendChild(note('Cities per shard: the store\'s example (davi-12 in SP, lena-77 in Recife, caio-58 in Rio). Defaults: 20/20/60, Recife defect: ring 1 with 40%. Synthetic customers in ring 0 bring it down to 20%, with no real customer.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [f0.wrap, f1.wrap, cd.wrap, od.wrap, sy.wrap]));
    [f0, f1, cd, od, sy].forEach(function (c) { c.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  var REG = { rolling: wRolling, raio: wRaio, 'canary-poder': wCanaryPoder, migracao: wMigracao, bucket: wBucket, aneis: wAneis };
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
