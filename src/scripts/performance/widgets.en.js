/* SDLabs · Performance, Capacity and Scalability (English): plain JS widgets
   (percentiles and average, knee curve, capacity chain, replicas going down with vertical × horizontal, HPA calculator).
   They use the store's numbers: a sample of 100 requests from 20:03 (640 req/s), a catalog with 100 req/s per replica (R = 10 + 10 ÷ (1 − ρ)),
   checkout in orders/s (pedidos 90, pagamentos 40, estoque 1,000, DB 150), HPA with a 70% target. */
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
  function pct(v, d) { return fmt(v * 100, d == null ? 1 : d) + '%'; }

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
    var id = 'pf-sl-' + (++uid);
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
  function field(label, value, attrs) {
    var id = 'pf-in-' + (++uid);
    var a = { id: id, type: 'number', value: String(value), inputmode: 'decimal' };
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pf-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }

  /* o modelo de fila de brinquedo do módulo: 10 ms de CPU + 10 ms de espera, R(ρ) = 10 + 10 ÷ (1 − ρ) */
  function resp(rho) { return rho >= 1 ? Infinity : 10 + 10 / (1 - rho); }

  /* =============== AULA 2: percentis e média sobre a amostra das 20:03 =============== */
  function expand(rows) {
    var v = [];
    rows.forEach(function (r) { for (var i = 0; i < r[0]; i++) v.push(r[1]); });
    return v;
  }
  var SAMPLES = [
    {
      name: 'with catalogo-3 (20:03)',
      hot: true,
      values: expand([[20, 26], [30, 32], [25, 40], [10, 55], [5, 74],
        [1, 150], [1, 300], [1, 450], [1, 600], [1, 800], [1, 1000], [1, 1200], [1, 1500], [1, 2000], [1, 2100]]),
      rows: [
        ['9 healthy replicas (64%)', '20 × 26 · 30 × 32 · 25 × 40 · 10 × 55 · 5 × 74'],
        ['catalogo-3 (99%)', '150 · 300 · 450 · 600 · 800 · 1,000 · 1,200 · 1,500 · 2,000 · 2,100']
      ],
      perReplicaP99: [55, 55, 55, 55, 74, 74, 74, 74, 74, 2100]
    },
    {
      name: 'without catalogo-3 (after the fix)',
      hot: false,
      values: expand([[20, 28], [30, 34], [25, 42], [15, 56], [8, 58], [2, 73]]),
      rows: [['all at 67.5%', '20 × 28 · 30 × 34 · 25 × 42 · 15 × 56 · 8 × 58 · 2 × 73']],
      perReplicaP99: null
    }
  ];
  var TIMEOUT = 2000, META = 300;
  function nearestRank(sorted, p) {
    var n = sorted.length, rank = Math.ceil(p * n / 100 - 1e-9);
    return sorted[Math.max(1, Math.min(n, rank)) - 1];
  }

  function wPercentis(root) {
    var btns = [], S = { i: 0 };
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });

    function render() {
      var s = SAMPLES[S.i], v = s.values.slice().sort(function (a, b) { return a - b; }), n = v.length, sum = 0, errs = 0;
      v.forEach(function (x) { sum += x; if (x > TIMEOUT) errs++; });
      var avg = sum / n, p95 = nearestRank(v, 95), p99 = nearestRank(v, 99);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Average', fmt(avg) + ' ms'),
        fact('p50 (rank 50)', nearestRank(v, 50) + ' ms'),
        fact('p90 (rank 90)', nearestRank(v, 90) + ' ms'),
        fact('p95 (rank 95)', fmt(p95, 0) + ' ms'),
        fact('p99 (rank 99)', fmt(p99, 0) + ' ms'),
        fact('Maximum', fmt(v[n - 1], 0) + ' ms'),
        fact('Errors (above 2,000 ms)', errs + ' of ' + n + ' = ' + fmt(errs / n * 100) + '%')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('average', avg, 2200, fmt(avg) + ' ms', avg > META ? 'win' : ''),
        bar('p95', p95, 2200, fmt(p95, 0) + ' ms', p95 > META ? 'win' : ''),
        bar('p99', p99, 2200, fmt(p99, 0) + ' ms', p99 > META ? 'win' : ''),
        bar('goal (p95)', META, 2200, META + ' ms', '')
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Orange bar = above the 300 ms goal.' }));
      out.appendChild(verdict(avg > META,
        'Average dashboard: ' + (avg > META ? 'red.' : 'green.'),
        'The average is ' + fmt(avg) + ' ms against the goal of ' + META + ' ms.'));
      out.appendChild(verdict(p95 > META,
        'p95 dashboard: ' + (p95 > META ? 'red.' : 'green.'),
        'The p95 is ' + fmt(p95, 0) + ' ms against the goal of ' + META + ' ms.'
          + (s.hot ? ' This is the dashboard that shows Lena waited 2 s.' : ' All replicas answer at the same pace.')));
      if (s.perReplicaP99) {
        var tot = 0;
        s.perReplicaP99.forEach(function (x) { tot += x; });
        var m = tot / s.perReplicaP99.length;
        out.appendChild(verdict(true, 'Average of the per-replica p99s: ' + fmt(m, 0) + ' ms.',
          'Each replica reports its own p99 (with 10 requests it is its maximum) and the dashboard averages them. The true fleet p99, over the 100 requests together, is ' + fmt(p99, 0) + ' ms. You do not add percentiles or average them: merge the histogram and compute again.'));
      }
      out.appendChild(table(['Group', 'Times at lb-loja (ms)'], s.rows.map(function (r) { return { cells: [{ text: r[0] }, { text: r[1] }] }; })));
      out.appendChild(el('p', { class: 'sr-note', text: 'Nearest-rank method: the percentile p is the value at position ⌈p% × n⌉ of the sorted sample, with n = 100. With 100 samples the p99 is just the 99th value and moves with a single request; it only settles with a thousand or more.' }));
    }
    root.appendChild(chipRow('Sample', SAMPLES.map(function (s) { return s.name; }), btns, function (i) { S.i = i; press(btns, i); render(); }));
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 3: a curva do joelho =============== */
  function wJoelho(root) {
    var btns = [], S = { m: 1 };
    var rep = slider('Replicas', 1, 20, 1, 10);
    var util = slider('CPU utilization (ρ)', 0, 99, 1, 64, '%');
    var rps = slider('Traffic', 0, 1000, 10, 640, 'req/s');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var rho = 0.64, lam = 640;
    function render() {
      var n = +rep.input.value, cap = n * 100;
      if (S.m === 0) { rho = +util.input.value / 100; lam = rho * cap; }
      else { lam = +rps.input.value; rho = lam / cap; }
      clear(out);
      var sat = rho >= 1, r = sat ? Infinity : resp(rho);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Capacity', fmt(cap, 0) + ' req/s'),
        fact('Traffic', fmt(lam, 0) + ' req/s'),
        fact('Utilization ρ', sat ? '≥ 100%' : pct(rho)),
        fact('Response R(ρ)', sat ? 'unbounded' : fmt(r) + ' ms'),
        fact('In flight (Little)', sat ? 'the queue grows' : fmt(lam * r / 1000) + ' requests')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('R(ρ)', sat ? 1010 : Math.min(r, 1010), 1010, sat ? 'saturates' : fmt(r) + ' ms', rho > 0.7 ? 'win' : '')
      ]));
      var head, say, bad = false;
      if (sat) { bad = true; head = 'Saturated.'; say = 'The demand of ' + fmt(lam, 0) + ' req/s goes past the capacity of ' + fmt(cap, 0) + ': the queue grows ' + fmt(lam - cap, 0) + ' req/s, ' + fmt((lam - cap) * 60, 0) + ' per minute.'; }
      else if (rho > 0.9) { bad = true; head = 'Knee of the curve.'; say = 'Above 90% each extra point costs tens of ms: at 99% the response is 1,010 ms, the order of magnitude of the Black Friday "2 s".'; }
      else if (rho > 0.7) { bad = true; head = 'Above the safe limit.'; say = 'The 70% limit has passed. The response is still acceptable, but the headroom is gone.'; }
      else { head = 'Inside the safe band.'; say = 'Up to 70% the response stays at 43.3 ms or less: there is almost no queue.'; }
      out.appendChild(verdict(bad, head, say));
      var ref = [0, 0.4, 0.5, 0.64, 0.675, 0.7, 0.8, 0.9, 0.95, 0.99];
      out.appendChild(table(['ρ', 'R (ms)'], ref.map(function (x) {
        return { cls: Math.abs(x - rho) < 0.0001 ? 'cr-cur' : '', cells: [{ text: pct(x, 1) }, { text: fmt(resp(x), 1) }] };
      }), 'pf-narrow'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Toy model (simplified M/M/1 queue): R(ρ) = 10 ms of CPU + 10 ms ÷ (1 − ρ). It assumes identical replicas; that is why the 86.4 in flight from the lesson (with hot catalogo-3, average response of 135 ms) differ from the ones shown here.' }));
    }
    function setMode(i) {
      S.m = i; press(btns, i);
      util.wrap.hidden = i !== 0; rps.wrap.hidden = i !== 1;
      render();
    }
    root.appendChild(chipRow('Control by', ['utilization', 'req/s'], btns, setMode));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rep.wrap, util.wrap, rps.wrap]));
    [rep, util, rps].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    setMode(1);
  }

  /* =============== AULA 3: a cadeia de capacidade do checkout =============== */
  var ELOS = [
    { k: 'pedidos', name: 'pedidos', per: 30, cost: 33, scale: true, init: 3 },
    { k: 'pagamentos', name: 'pagamentos', per: 20, cost: 50, scale: true, init: 2 },
    { k: 'estoque', name: 'estoque', per: 500, cost: 2, scale: true, init: 2 },
    { k: 'banco', name: 'pedidos DB', per: 150, cost: 0, scale: false, init: 1 }
  ];
  function wCadeia(root) {
    var btns = [];
    var dem = slider('Demand', 1, 200, 1, 60, 'orders/s');
    var sl = {};
    ELOS.forEach(function (e) { if (e.scale) sl[e.k] = slider('Replicas of ' + e.name, 1, 10, 1, e.init); });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: '30 orders/s (today)', d: 30, r: [3, 2, 2] },
      { t: '60 orders/s (doubled)', d: 60, r: [3, 2, 2] },
      { t: '60, estoque ×2', d: 60, r: [3, 2, 4] },
      { t: '60, pagamentos ×2', d: 60, r: [3, 4, 2] },
      { t: '100, pagamentos ×2', d: 100, r: [3, 4, 2] },
      { t: '200, everything scaled', d: 200, r: [6, 8, 2] }
    ];

    function render() {
      var D = +dem.input.value, caps = {};
      ELOS.forEach(function (e) { caps[e.k] = e.scale ? +sl[e.k].input.value * e.per : e.per; });
      /* the order is written to the DB before payment; each link receives what the previous one let through */
      var order = ['pedidos', 'banco', 'pagamentos', 'estoque'], inflow = {}, flow = D;
      order.forEach(function (k) { inflow[k] = flow; flow = Math.min(flow, caps[k]); });
      var saida = flow, minCap = Math.min(caps.pedidos, caps.pagamentos, caps.estoque, caps.banco);
      var represa = D - saida, gargalo = [];
      if (D > minCap) ELOS.forEach(function (e) { if (caps[e.k] === minCap) gargalo.push(e.name); });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('In', fmt(D, 0) + '/s'),
        fact('Out', fmt(saida, 0) + '/s'),
        fact('Backed up', fmt(represa, 0) + '/s'),
        fact('Queue after 60 s', fmt(represa * 60, 0) + ' orders'),
        fact('Degradation', fmt(represa / D * 100, 0) + '%')
      ]));
      var rows = ELOS.map(function (e) {
        var rho = inflow[e.k] / caps[e.k], hot = gargalo.indexOf(e.name) >= 0;
        var r = e.cost && rho < 1 ? fmt(e.cost / (1 - rho), 0) + ' ms' : (e.cost ? 'saturates' : 'measured under load');
        return { cls: hot ? 'dl-wait' : '', cells: [
          { text: e.name },
          { text: e.scale ? sl[e.k].input.value + ' × ' + e.per + '/s' : '1 primary' },
          { text: fmt(caps[e.k], 0) + '/s' },
          { text: fmt(inflow[e.k], 0) + '/s' },
          { text: fmt(Math.min(rho, 9.99) * 100, 0) + '%' + (rho > 1 ? ' (saturates)' : ''), cls: hot ? 'pf-cell bad' : 'pf-cell' },
          { text: r }
        ] };
      });
      out.appendChild(table(['link', 'replicas × per replica', 'capacity', 'receives', 'utilization', 'link response'], rows, 'pf-wide'));
      if (gargalo.length) out.appendChild(verdict(true, 'Bottleneck: ' + gargalo.join(' and ') + '.',
        'The output is the capacity of the weakest link, ' + fmt(minCap, 0) + '/s, and ' + fmt(represa, 0) + ' orders per second become a queue or an error. Scaling a link that is not this one does not change the output.'));
      else out.appendChild(verdict(false, 'No bottleneck.', 'Every link keeps up with the demand. The weakest link is the one at ' + fmt(minCap, 0) + '/s, and the headroom up to it is ' + fmt(minCap - D, 0) + ' orders/s.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacity = replicas × per replica (CPU per order: pedidos 33 ms = 30/s, pagamentos 50 ms = 20/s, estoque 2 ms = 500/s). The DB is a single primary: service replicas do not scale it. The link response uses cost ÷ (1 − utilization), the same model as the curve. The order goes through pedidos, is written to the DB, then pays and decrements the stock.' }));
    }
    root.appendChild(chipRow('Scenario', PRESETS.map(function (p) { return p.t; }), btns, function (j) {
      var p = PRESETS[j]; dem.set(p.d);
      sl.pedidos.set(p.r[0]); sl.pagamentos.set(p.r[1]); sl.estoque.set(p.r[2]);
      press(btns, j); render();
    }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dem.wrap, sl.pedidos.wrap, sl.pagamentos.wrap, sl.estoque.wrap]));
    [dem, sl.pedidos, sl.pagamentos, sl.estoque].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    press(btns, 1);
    render();
  }

  /* =============== AULA 4: queda de réplicas e vertical × horizontal =============== */
  function amdahl(s, n) { return 1 / (s + (1 - s) / n); }
  function wQueda(root) {
    var dem = slider('Demand', 100, 1200, 10, 640, 'req/s');
    var rep = slider('Replicas', 1, 20, 1, 10);
    var per = slider('Capacity per replica', 25, 200, 5, 100, 'req/s');
    var fall = slider('Replicas that go down', 0, 19, 1, 0);
    var vc = slider('vCPU of the vertical replica', 1, 16, 1, 8);
    var ser = slider('Part that does not parallelize', 0, 25, 0.01, 4.76, '%');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });

    function render() {
      var D = +dem.input.value, n = +rep.input.value, c = +per.input.value;
      fall.input.max = String(Math.max(0, n - 1));
      if (+fall.input.value > n - 1) fall.set(Math.max(0, n - 1));
      var k = +fall.input.value;
      var alive = n - k, cap = alive * c, rho = D / cap, sat = rho >= 1;
      clear(out);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Horizontal: the fleet loses replicas' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Alive', alive + ' of ' + n),
        fact('Capacity', fmt(cap, 0) + ' req/s'),
        fact('Utilization ρ', pct(rho)),
        fact('Response', sat ? 'unbounded' : fmt(resp(rho)) + ' ms')
      ]));
      if (sat) out.appendChild(verdict(true, 'Saturates.', fmt(D - cap, 0) + ' req/s are missing: the queue grows ' + fmt((D - cap) * 60, 0) + ' requests per minute and the responses go past the 2 s timeout.'));
      else out.appendChild(verdict(rho > 0.7, rho > 0.7 ? 'Above 70%.' : 'It fits.', 'With ' + alive + ' replicas the utilization is ' + pct(rho) + ' and the response, ' + fmt(resp(rho)) + ' ms. ' + (rho > 0.7 ? 'The safety headroom is gone.' : 'There is headroom left (the fleet\'s N+k).')));
      var rows = [];
      for (var j = 0; j < Math.min(n, 7); j++) {
        var cp = (n - j) * c, r = D / cp;
        rows.push({ cls: j === k ? 'cr-cur' : '', cells: [{ text: j + ' down' }, { text: fmt(cp, 0) + ' req/s' }, { text: pct(r) + (r >= 1 ? ' (saturates)' : '') }, { text: r >= 1 ? 'queue of ' + fmt(D - cp, 0) + '/s' : fmt(resp(r)) + ' ms' }] });
      }
      out.appendChild(table(['down', 'capacity', 'utilization', 'response'], rows, 'pf-wide'));

      var s = +ser.input.value / 100, v = +vc.input.value, sp = amdahl(s, v);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Vertical: one replica of ' + v + ' vCPU' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Gain (Amdahl)', fmt(sp, 2) + '×'),
        fact('Capacity', fmt(sp * 100, 0) + ' req/s'),
        fact('Per vCPU', fmt(sp * 100 / v, 0) + ' req/s'),
        fact('Horizontal, same vCPUs', fmt(v * 100, 0) + ' req/s'),
        fact('If the replica goes down', 'loses 100%')
      ]));
      var bars = [1, 2, 4, 8, 16, 32].map(function (x) {
        var g = amdahl(s, x);
        return bar(x + ' vCPU', g, 32, fmt(g, 1) + '×', x === v ? 'win' : '');
      });
      out.appendChild(el('div', { class: 'sr-bars' }, bars));
      out.appendChild(el('p', { class: 'sr-note', text: 'Gain = 1 ÷ (s + (1 − s) ÷ n), with s the part that does not parallelize. With s = 1/21 (4.76%, the one from relatorios in module 11) the ceiling is 21× and 8 vCPU give 6.0×: 600 req/s, not 800. The bars go up to 32×, the size of the scale.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dem.wrap, rep.wrap, per.wrap, fall.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [vc.wrap, ser.wrap]));
    [dem, rep, per, fall, vc, ser].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: calculadora do HPA =============== */
  function wHpa(root) {
    var btns = [];
    var unitBtns = [], S = { cpu: true };
    var cur = field('Current replicas', 10, { min: '1', max: '1000', step: '1' });
    var met = field('Current metric (average across pods)', 95, { min: '0', step: 'any' });
    var tgt = field('Target', 70, { min: '1', step: 'any' });
    var tol = field('Tolerance (%)', 10, { min: '0', max: '100', step: '1' });
    var mn = field('Minimum replicas', 1, { min: '1', step: '1' });
    var mx = field('Maximum replicas', 100, { min: '1', step: '1' });
    var dMet = slider('Metric delay', 0, 60, 5, 15, 's');
    var dDec = slider('Decision period', 5, 60, 5, 15, 's');
    var dPod = slider('Pod becoming ready', 0, 120, 5, 30, 's');
    var capRep = slider('Capacity per replica', 25, 200, 5, 100, 'req/s');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });

    var PRESETS = [
      { t: '95% peak', n: 10, m: 95, a: 70, cpu: true },
      { t: '67.5% average (target 70%)', n: 10, m: 67.5, a: 70, cpu: true },
      { t: '67.5% average (target 80%)', n: 10, m: 67.5, a: 80, cpu: true },
      { t: '67.5% average (target 60%)', n: 10, m: 67.5, a: 60, cpu: true },
      { t: '1,100 req/s peak', n: 10, m: 110, a: 70, cpu: true },
      { t: 'article: 6 replicas at 100%', n: 6, m: 100, a: 80, cpu: true },
      { t: 'article: 6 replicas at 200%', n: 6, m: 200, a: 80, cpu: true },
      { t: 'throughput: 950 req/s, 70 per replica', n: 10, m: 95, a: 70, cpu: false }
    ];
    function render() {
      var n = Math.max(1, Math.round(+cur.input.value) || 1), m = +met.input.value || 0, a = +tgt.input.value || 1;
      var t = (+tol.input.value || 0) / 100, lo = Math.max(1, Math.round(+mn.input.value) || 1), hi = Math.max(lo, Math.round(+mx.input.value) || lo);
      var ratio = m / a, inTol = Math.abs(ratio - 1) <= t;
      var raw = n * ratio, want = inTol ? n : Math.ceil(raw - 1e-9);
      var fin = Math.max(lo, Math.min(hi, want));
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Ratio current ÷ target', fmt(ratio, 3)),
        fact('Current × ratio', fmt(raw, 2)),
        fact('With ceil', inTol ? 'ignored (tolerance)' : String(Math.ceil(raw - 1e-9))),
        fact('Desired replicas', String(fin))
      ]));
      var after = fin ? m * n / fin : 0;
      var unit = S.cpu ? '%' : ' req/s per replica';
      var say;
      if (inTol) say = 'The ratio ' + fmt(ratio, 3) + ' is within ' + fmt(t * 100, 0) + '% of 1.0: the HPA does nothing, and ' + n + ' replicas stay as they are.';
      else if (fin > n) say = 'Goes up from ' + n + ' to ' + fin + ' (the default policy allows +4 pods or +100% every 15 s, whichever is larger).' + (fin !== want ? ' The maximum of ' + hi + ' capped it.' : '');
      else if (fin < n) say = 'Goes down from ' + n + ' to ' + fin + ', after the 300 s stabilization window. If the average hides a hot replica, it is at the worst moment.';
      else say = 'Keeps ' + n + ' replicas' + (want !== n ? ' (minimum or maximum limit)' : '') + '.';
      out.appendChild(verdict(!inTol && fin < n, inTol ? 'Within tolerance.' : fin > n ? 'Scales up.' : fin < n ? 'Scales down.' : 'No change.', say));
      if (!inTol && fin !== n) out.appendChild(el('p', { class: 'sr-note', text: 'Afterward, with the same load: ' + fmt(after, 1) + unit + ' on each of the ' + fin + ' replicas' + (S.cpu ? ' (response of ' + (after < 100 ? fmt(resp(after / 100)) + ' ms' : 'unbounded') + ').' : '.') }));

      /* a linha do tempo de reação e as requisições perdidas */
      var cap = +capRep.input.value, demand = S.cpu ? m / 100 * n * cap : m * n;
      var react = +dMet.input.value + +dDec.input.value + +dPod.input.value;
      var over = Math.max(0, demand - n * cap), lost = over * react, total = demand * react;
      out.appendChild(el('p', { class: 'sr-sub', text: 'Reaction: from the peak until the replica is ready' }));
      out.appendChild(table(['step', 'time', 'cumulative'], [
        { cells: [{ text: 'the metric arrives' }, { text: dMet.input.value + ' s' }, { text: dMet.input.value + ' s' }] },
        { cells: [{ text: 'the HPA decides' }, { text: dDec.input.value + ' s' }, { text: (+dMet.input.value + +dDec.input.value) + ' s' }] },
        { cells: [{ text: 'the pod becomes ready' }, { text: dPod.input.value + ' s' }, { text: react + ' s' }] }
      ]));
      out.appendChild(verdict(lost > 0,
        lost > 0 ? 'Lost: ' + fmt(lost, 0) + ' requests.' : 'No loss.',
        lost > 0 ? 'Demand of ' + fmt(demand, 0) + ' req/s against a capacity of ' + fmt(n * cap, 0) + ': ' + fmt(over, 0) + ' req/s extra × ' + react + ' s = ' + fmt(lost, 0) + ' rejected or delayed, ' + fmt(lost / total * 100) + '% of the ' + fmt(total, 0) + ' in the period.'
          : 'The demand of ' + fmt(demand, 0) + ' req/s fits within the capacity of ' + fmt(n * cap, 0) + ' during the ' + react + ' s of reaction.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Pods that are not ready yet enter the average as 0% usage (Kubernetes documentation), which cushions the next rise. CPU utilization is the % of the pod\'s requests, averaged across pods. Here 100% CPU = the capacity per replica.' }));
    }
    function preset(j) {
      var p = PRESETS[j];
      cur.input.value = p.n; met.input.value = p.m; tgt.input.value = p.a; S.cpu = p.cpu;
      press(unitBtns, p.cpu ? 0 : 1); press(btns, j); render();
    }
    root.appendChild(chipRow('Scenario', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(chipRow('Metric unit', ['CPU (%)', 'req/s per replica'], unitBtns, function (i) { S.cpu = i === 0; press(unitBtns, i); press(btns, -1); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cur.wrap, met.wrap, tgt.wrap, tol.wrap, mn.wrap, mx.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dMet.wrap, dDec.wrap, dPod.wrap, capRep.wrap]));
    [cur, met, tgt, tol, mn, mx, dMet, dDec, dPod, capRep].forEach(function (x) { x.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  var REG = { percentis: wPercentis, joelho: wJoelho, cadeia: wCadeia, queda: wQueda, hpa: wHpa };
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
