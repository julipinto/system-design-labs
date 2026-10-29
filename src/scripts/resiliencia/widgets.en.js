/* SDLabs · Resilience: widgets in plain JS (English)
   (availability, Little and pool, chain of deadlines, retry storm, amplification, circuit breaker, fallback,
   degradation, queue and backpressure, bulkhead, blast radius and idempotency key).
   They use the numbers from the brief: 30 orders/s, pool of 50, PSP-A at 8 s from 20:20:00 to 20:21:30, 1 s timeout,
   breaker (window 20, minimum 10, 50%, open 30 s, 5 probes), 1,300 req/s against 1,000, queue of 5,000, bulkheads 50/30/20.
   The breaker and the storm repeat the brief's simulations in the browser (Python, seed 7): the two strategies without randomness
   and the breaker match exactly; the ones with jitter use another number generator and vary a little. */
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
  /* round half to even (the brief's Python shows 20.2× for 20.25) */
  function r1(x) {
    var y = x * 10, f = Math.floor(y), d = y - f;
    var r = Math.abs(d - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(y);
    return r / 10;
  }
  function fmtPct(p) { return fmt(p * 100, 4) + '%'; }
  function fmtS(s) { return fmt(s, 2) + ' s'; }
  function fmtMin(m) {
    if (m >= 60) return fmt(m, 1) + ' min';
    if (m >= 1) return fmt(m, 2) + ' min';
    return fmt(m * 60, 1) + ' s';
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
    var id = 'rs-sl-' + (++uid);
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
  function numField(label, min, max, step, value, unit) {
    var id = 'rs-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: String(value), inputmode: 'decimal', class: 'rs-num' });
    return {
      input: inp,
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp])
    };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' rs-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table rs-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }

  /* =============== LESSON 2: disponibilidade =============== */
  function wDisponibilidade(root) {
    var MIN = 43200, TENT = 12960000;
    var AV = [0.99, 0.995, 0.999, 0.9995, 0.9999, 0.99999];
    var AVL = ['99%', '99.5%', '99.9%', '99.95%', '99.99%', '99.999%'];
    var S = { a: 2, psp: false, par: false };
    var n = slider('Hops in series', 1, 8, 1, 4, 'hops');
    var aB = [], pB = [], parB = [];
    var slo = [0.99, 0.995, 0.999, 0.9995, 0.9999], sloIdx = 2, sloB = [];
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var k = +n.input.value, a = AV[S.a];
      var last = S.psp ? 0.995 : a;
      var lastEff = S.par ? 1 - (1 - last) * (1 - last) : last;
      var total = Math.pow(a, k - 1) * lastEff;
      var down = MIN * (1 - total);
      var budget = (1 - slo[sloIdx]) * TENT;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chain availability', fmtPct(total), total < 0.999),
        fact('Down per month', fmtMin(down)),
        fact('Over 30 days (43,200 min)', fmt(MIN * total, 1) + ' min up')
      ]));
      var rows = AV.concat([0.99999]).slice(0, 6).map(function (v, i) {
        return { cls: i === S.a ? 'rs-cur' : '', cells: [{ text: AVL[i] }, { text: fmtMin(MIN * (1 - v)) }, { text: fmt(86400 * 30 * (1 - v), 0) + ' s' }] };
      });
      out.appendChild(table(['Table of nines', 'Down per month', 'In seconds'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Usage-based SLO', AVL[AV.indexOf(slo[sloIdx])] || fmtPct(slo[sloIdx])),
        fact('Error budget (12,960,000 attempts)', fmt(budget, 0) + ' failures'),
        fact('90 s incident (2,700 failures)', fmt(2700 / budget * 100, 1) + '% of the month', 2700 / budget > 0.5),
        fact('Unprotected, 5 min (9,000 failures)', fmt(9000 / budget * 100, 1) + '% of the month', 9000 / budget > 1)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('The incident, by usage (1 − 2,700 ÷ 12,960,000)', fmtPct(1 - 2700 / TENT)),
        fact('The same incident, by time (90 s out of 43,200 min)', fmtPct(1 - 1.5 / MIN))
      ]));
      out.appendChild(verdict(total < 0.999,
        total < 0.999 ? 'The chain fell below 99.9%.' : 'The chain holds 99.9%.',
        S.par
          ? 'Two PSPs in parallel only count if the failures are independent: in the same cloud and with the same credential, the second goes down together with the first.'
          : 'In series each hop multiplies the math: four hops at 99.9% end at 99.6006% (172.5 min per month). Put PSP-B in parallel and see what changes.'));
      out.appendChild(note('By usage it counts attempts (the month at 5 orders/s has 12,960,000); by time it counts minutes. A response in 8 s is a success by status and a failure for the client: the SLI needs a latency limit.'));
    }
    function pickA(i) { S.a = i; press(aB, i); render(); }
    function pickP(i) { S.psp = i === 1; press(pB, i); render(); }
    function pickPar(i) { S.par = i === 1; press(parB, i); render(); }
    function pickSlo(i) { sloIdx = i; press(sloB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Availability of each hop' }));
    root.appendChild(chipRow('Availability of each hop', AVL, aB, pickA));
    root.appendChild(el('p', { class: 'sr-sub', text: 'The last hop' }));
    root.appendChild(chipRow('The last hop', ['Same as the others', "It's PSP-A at 99.5%"], pB, pickP));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Second PSP' }));
    root.appendChild(chipRow('PSP-B in parallel', ['Without PSP-B', 'With PSP-B in parallel'], parB, pickPar));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Usage-based SLO (error budget)' }));
    root.appendChild(chipRow('SLO', ['99%', '99.5%', '99.9%', '99.95%', '99.99%'], sloB, pickSlo));
    n.input.addEventListener('input', render);
    root.appendChild(out);
    pickA(2); pickP(0); pickPar(0); pickSlo(2);
  }

  /* =============== LESSON 6: Little e pool =============== */
  function wLittle(root) {
    var pool = slider('Connection pool', 10, 200, 5, 50, 'connections');
    var taxa = slider('Orders per second', 5, 100, 5, 30, '/s');
    var lat = slider('Time of each call', 0.1, 10, 0.1, 1, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var p = +pool.input.value, r = +taxa.input.value, w = +lat.input.value;
      var L = r * w, vaz = p / w, crit = p / r, sat = L > p + 1e-9;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('In flight (L = rate × time)', fmt(L, 1) + ' of ' + p, sat),
        fact('Maximum pool throughput', fmt(vaz, vaz < 10 ? 2 : 0) + '/s', vaz < r),
        fact('Saturates?', sat ? 'SATURATES' : 'ok', sat),
        fact('Critical timeout (pool ÷ rate)', fmt(crit, 2) + ' s')
      ]));
      var rows = [0.18, 0.6, 1, 2, 8].map(function (x) {
        var l = r * x, s = l > p + 1e-9;
        return { cls: Math.abs(x - w) < 0.05 ? 'rs-cur' : '', cells: [{ text: fmt(x, 2) + ' s' }, { text: fmt(l, 1) }, { text: fmt(p / x, p / x < 10 ? 2 : 0) + '/s' }, { text: s ? 'SATURATES' : 'ok', cls: s ? 'rs-bad' : '' }] };
      });
      out.appendChild(table(['Call time', 'In flight', 'Max throughput', 'Pool'], rows));
      out.appendChild(verdict(sat,
        sat ? 'The pool runs out in ' + fmt(p / r, 2) + ' s.' : 'The pool holds.',
        sat
          ? 'With each call stuck for ' + fmt(w, 1) + ' s, ' + fmt(r, 0) + ' come in per second and only ' + fmt(vaz, vaz < 10 ? 2 : 0) + ' leave: the math does not add up, and the timeout has to be lower than ' + fmt(crit, 2) + ' s.'
          : fmt(L, 1) + ' of ' + p + ' connections in flight. The closer to the pool, the less slack for the next slowdown; the timeout still needs to stay below ' + fmt(crit, 2) + ' s.'));
      out.appendChild(note('With the story defaults (pool 50, 30/s): 1 s gives 30 in flight (ok), 2 s gives 60 (saturates) and 8 s gives 240. Critical timeout = 50 ÷ 30 = 1.67 s. That is Little\'s Law: in flight = rate × time.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pool.wrap, taxa.wrap, lat.wrap]));
    [pool, taxa, lat].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 6: chain of deadlines =============== */
  function wPrazos(root) {
    var NAMES = ['app', 'gw-loja', 'bff-app', 'pedidos', 'pagamentos', 'PSP (per attempt)'];
    var VAL = [5, 3, 2.8, 2.5, 2, 1];
    var fields = NAMES.map(function (nm, i) { return numField('Timeout of ' + nm, 0.1, 30, 0.1, VAL[i], 's'); });
    var tent = slider('Attempts to the PSP', 1, 5, 1, 3, 'attempts');
    var base = slider('Backoff base', 50, 500, 50, 100, 'ms');
    var btns = [], S = { prazo: false };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var t = fields.map(function (f) { return Math.max(0.1, +f.input.value || 0.1); });
      var k = +tent.input.value, b = +base.input.value / 1000;
      var rows = [], total = 0, restante = t[4];
      for (var i = 0; i < k; i++) {
        var espera = i === 0 ? 0 : b * Math.pow(2, i - 1);
        var cap = t[5];
        if (S.prazo) {
          restante -= espera;
          cap = Math.min(t[5], restante);
          if (cap <= 0.05) { rows.push({ cells: [{ text: 'attempt ' + (i + 1) }, { text: 'does not run' }, { text: 'no deadline left' }] }); break; }
          restante -= cap;
        }
        total += espera + cap;
        rows.push({ cells: [{ text: 'attempt ' + (i + 1) }, { text: fmt(cap, 2) + ' s' }, { text: 'ends at ' + fmt(total, 2) + ' s' }] });
      }
      var warns = [];
      for (var j = 0; j < 5; j++) if (t[j] <= t[j + 1] + 1e-9) warns.push(NAMES[j] + ' (' + fmt(t[j], 1) + ' s) waits less than or equal to the inner one, ' + NAMES[j + 1] + ' (' + fmt(t[j + 1], 1) + ' s)');
      var torfao = [];
      [[0, 'app'], [1, 'gw-loja'], [2, 'bff-app'], [3, 'pedidos'], [4, 'pagamentos']].forEach(function (p) { if (total > t[p[0]] + 1e-9) torfao.push(p[1] + ' (' + fmt(t[p[0]], 1) + ' s)'); });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Sum of attempts + backoff', fmt(total, 2) + ' s', torfao.length > 0),
        fact('Chain in order?', warns.length ? 'NO' : 'yes', warns.length > 0),
        fact('Give up before the end', torfao.length ? String(torfao.length) + ' link' + (torfao.length > 1 ? 's' : '') : 'none', torfao.length > 0)
      ]));
      out.appendChild(table(['Attempt to the PSP', 'Time granted', 'Moment'], rows));
      if (warns.length) out.appendChild(verdict(true, 'Deadline out of order.', warns[0] + '. The outer one gives up first and the inner one keeps working for nobody.'));
      if (torfao.length) out.appendChild(verdict(true, 'Orphaned work.', 'With ' + fmt(total, 2) + ' s of attempts, ' + torfao.join(', ') + ' give(s) up and the PSP may have charged anyway (c-7731 from module 12).'));
      if (!warns.length && !torfao.length) out.appendChild(verdict(false, 'The chain adds up.', 'Each outer link waits longer than the inner one and the attempts fit in the deadline.'));
      out.appendChild(note('Story default: 5 · 3 · 2.8 · 2.5 · 2.0 · 1.0 s per attempt, 3 attempts and a 100 ms base: 3 × 1 s + 0.1 + 0.2 = 3.3 s, more than the 3 s of gw-loja. With "only try if there is deadline left", the 2nd attempt gets 2.0 − 1.0 − 0.1 = 0.9 s.'));
    }
    function pick(i) { S.prazo = i === 1; press(btns, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, fields.map(function (f) { return f.wrap; })));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tent.wrap, base.wrap]));
    root.appendChild(chipRow('Deadline policy', ['Tries even with no deadline', 'Only tries if there is deadline left'], btns, pick));
    fields.forEach(function (f) { f.input.addEventListener('input', render); });
    [tent, base].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 7: retry storm =============== */
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function Heap() { this.a = []; }
  Heap.prototype.push = function (x) {
    var a = this.a, i = a.length; a.push(x);
    while (i > 0) { var p = (i - 1) >> 1; if (a[p][0] < x[0] || (a[p][0] === x[0] && a[p][1] <= x[1])) break; a[i] = a[p]; i = p; }
    a[i] = x;
  };
  Heap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      var i = 0, n = a.length;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i, c = last;
        if (l < n && (a[l][0] < c[0] || (a[l][0] === c[0] && a[l][1] < c[1]))) { m = l; c = a[l]; }
        if (r < n && (a[r][0] < c[0] || (a[r][0] === c[0] && a[r][1] < c[1]))) { m = r; c = a[r]; }
        if (m === i) break;
        a[i] = a[m]; i = m;
      }
      a[i] = last;
    }
    return top;
  };
  /* strategies: 0 fixed, 1 exponential without jitter, 2 full, 3 equal, 4 decorrelated */
  function herd(strat, n, down, capRate, deadline) {
    var base = 0.1, cap = 5, win = 0.1, quota = Math.round(capRate * win);
    var rnd = mulberry(7), hp = new Heap(), used = {}, peaks = {};
    var calls = 0, refUp = 0, done = 0, last = 0, i;
    for (i = 0; i < n; i++) hp.push([0, i, 0, base]);
    while (hp.a.length) {
      var e = hp.pop(), t = e[0], c = e[1], a = e[2], prev = e[3];
      if (t > deadline + 1e-9) continue;
      calls++;
      var w = Math.floor(t / win + 1e-9);
      peaks[w] = (peaks[w] || 0) + 1;
      var ok = false;
      if (t >= down - 1e-9) {
        var u = used[w] || 0;
        if (u < quota) { used[w] = u + 1; ok = true; } else refUp++;
      }
      if (ok) { done++; if (t > last) last = t; continue; }
      var ex = Math.min(cap, base * Math.pow(2, a)), s;
      if (strat === 0) s = base;
      else if (strat === 1) s = ex;
      else if (strat === 2) s = rnd() * ex;
      else if (strat === 3) s = ex / 2 + rnd() * ex / 2;
      else s = Math.min(cap, base + rnd() * (prev * 3 - base));
      hp.push([t + s, c, a + 1, s]);
    }
    var peak = 0, bars = [], maxW = Math.ceil(deadline / win);
    for (var k = 0; k < maxW; k++) { var v = peaks[k] || 0; bars.push(v); if (k * win >= down - 1e-9 && v > peak) peak = v; }
    return { calls: calls, peak: peak, refUp: refUp, done: done, last: last, bars: bars };
  }
  var HERD_MEDIDO = [
    { calls: 45500, peak: 1000, refUp: 24500, done: 1000, ult: 'last at 6.9 s' },
    { calls: 6980, peak: 1000, refUp: 1940, done: 40 },
    { calls: 7540, peak: 84, refUp: 687, done: 1000 },
    { calls: 7162, peak: 130, refUp: 1085, done: 993 },
    { calls: 7590, peak: 125, refUp: 1397, done: 999 }
  ];
  function wTempestade(root) {
    var NAMES = ['Fixed 100 ms interval', 'Exponential without jitter', 'Exponential + full jitter', 'Exponential + equal jitter', 'Decorrelated jitter'];
    var btns = [], S = { s: 2 }, timer = null;
    var cli = slider('Clients', 100, 5000, 100, 1000, 'clients', function (v) { return fmt(v, 0); });
    var dur = slider('PSP down for', 0, 10, 0.5, 2, '', function (v) { return fmt(v, 1) + ' s'; });
    var capa = slider('PSP capacity when back', 100, 500, 50, 200, '/s');
    var prazo = slider('Deadline of each client', 2, 20, 1, 10, '', function (v) { return v + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var n = +cli.input.value, d = +dur.input.value, c = +capa.input.value, p = +prazo.input.value;
      var padrao = n === 1000 && d === 2 && c === 200 && p === 10;
      var r = herd(S.s, n, d, c, p);
      var m = padrao ? HERD_MEDIDO[S.s] : null;
      var calls = m ? m.calls : r.calls, peak = m ? m.peak : r.peak, ref = m ? m.refUp : r.refUp, done = m ? m.done : r.done;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Calls to the PSP', fmt(calls, 0) + ' (' + fmt(calls / n, 1) + ' per client)', calls / n > 20),
        fact('Peak per 100 ms window (after it is back)', fmt(peak, 0), peak >= n * 0.9),
        fact('Refused with the PSP up', fmt(ref, 0), ref > 20000),
        fact('Completed within the deadline', fmt(done, 0) + ' of ' + fmt(n, 0) + ' (' + fmt(done / n * 100, 0) + '%)', done / n < 0.5)
      ]));
      var bars = r.bars, mx = 1;
      bars.forEach(function (v) { if (v > mx) mx = v; });
      var chart = el('div', { class: 'rs-bars', role: 'img', 'aria-label': 'Calls per 100 ms window, from 0 s to ' + p + ' s; largest window with ' + fmt(mx, 0) + ' calls' });
      bars.forEach(function (v, k) {
        var b = el('i', { class: k * 0.1 < d - 1e-9 ? 'down' : '' });
        b.style.height = Math.max(2, v / mx * 100) + '%';
        chart.appendChild(b);
      });
      out.appendChild(chart);
      out.appendChild(el('p', { class: 'rs-axis' }, [el('span', { text: '0 s' }), el('span', { text: 'PSP back at ' + fmt(d, 1) + ' s' }), el('span', { text: p + ' s' })]));
      var best = padrao ? [1, 2, 3, 4] : null;
      out.appendChild(verdict(S.s === 0 || S.s === 1,
        S.s === 0 ? 'The fixed interval gets everyone through, but by brute force.' : S.s === 1 ? 'Backoff without jitter sends synchronized waves.' : 'Jitter spreads the calls out.',
        S.s === 0 ? 'Each client calls every 100 ms: ' + fmt(calls / n, 1) + ' calls per client and the PSP refuses most of them even when it is up.'
          : S.s === 1 ? 'Everyone waits the same time and comes back together: the peak per window is ' + fmt(peak, 0) + ' and only ' + fmt(done / n * 100, 0) + '% finish within the deadline.'
          : 'The wait is drawn at random, so the clients fall out of sync: the peak drops to ' + fmt(peak, 0) + ' per window and almost everyone finishes.'));
      out.appendChild(note(padrao
        ? 'With the story defaults (1,000 clients, PSP down for 2 s, then 200/s, 10 s deadline, 100 ms base, 5 s cap, seed 7) the numbers are the ones measured in Python. If you change any control, the widget simulates in the browser: the draw is different and the rows with jitter vary a little.'
        : 'Simulated in the browser (simplified model: 100 ms windows, the PSP accepts capacity ÷ 10 per window). The chart shows the calls per 100 ms window; in gray, the ones made while the PSP was down.'));
    }
    function pick(i) { S.s = i; press(btns, i); render(); }
    function later() { clearTimeout(timer); timer = setTimeout(render, 150); }
    root.appendChild(chipRow('Wait strategy', NAMES, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cli.wrap, dur.wrap, capa.wrap, prazo.wrap]));
    [cli, dur, capa, prazo].forEach(function (s) { s.input.addEventListener('input', later); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== LESSON 7: amplification =============== */
  function wAmplificacao(root) {
    var cam = slider('Layers that retry', 1, 5, 1, 3, 'layers');
    var tent = slider('Attempts per layer', 1, 5, 1, 3, 'attempts');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var l = +cam.input.value, a = +tent.input.value, N = Math.pow(a, l);
      var taxa = 30 * N, cap = 40, razao = taxa / cap, orc = 30 * 1.1;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Calls to pagamentos per tap (N = attempts^layers)', fmt(N, 0), N > 3),
        fact('Rate at 30 orders/s', fmt(taxa, 0) + '/s', taxa > cap),
        fact('Against the capacity of 40/s', fmt(r1(razao), 1) + '×', razao > 1),
        fact('With a 10% retry budget', fmt(orc, 0) + '/s', orc > cap)
      ]));
      var rows = [[1, 3], [3, 2], [3, 3]].map(function (p) {
        return { cls: p[0] === l && p[1] === a ? 'rs-cur' : '', cells: [{ text: p[0] + ' layer' + (p[0] > 1 ? 's' : '') + ' × ' + p[1] + ' attempts' }, { text: fmt(Math.pow(p[1], p[0]), 0) + ' calls' }, { text: fmt(30 * Math.pow(p[1], p[0]), 0) + '/s' }] };
      });
      out.appendChild(table(['Case', 'Per tap', 'At 30 orders/s'], rows));
      out.appendChild(verdict(taxa > cap,
        taxa > cap ? 'pagamentos receives ' + fmt(r1(razao), 1) + ' times what it can handle.' : 'The rate fits in the 40/s.',
        taxa > cap
          ? 'Each layer retries on its own and the attempts multiply. Retrying only in the outer layer (1 layer) and limiting with a 10% budget brings the rate to 33/s.'
          : 'Even so, the 10% budget (33/s) and the deadline still apply: the math only fits because the failure has not happened yet.'));
      out.appendChild(note('The module 10 numbers: 3 layers × 3 attempts = 27 calls per tap; 30 × 27 = 810/s against a pagamentos of 2 replicas at 20/s (40/s). The 10% budget is of the SRE book kind (60 retries per minute per process).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cam.wrap, tent.wrap]));
    [cam, tent].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 8: circuit breaker (the brief simulation) =============== */
  function breakerSim(o) {
    var rate = 30, dur = 100, failUntil = 90, slow = 8, fast = 0.18, pool = 50;
    var total = rate * dur, inflight = [], pending = [];
    var state = 'closed', openedAt = 0, win = [], probesSent = 0, probeRes = [];
    var calls = 0, ff = 0, rej = 0, peak = 0, durante = 0, depois = 0, closedAt = null, tl = [];
    var segs = [], segStart = 0, segState = 'closed';
    function seg(t, st) { if (st !== segState) { segs.push([segStart, t, segState]); segStart = t; segState = st; } }
    function flush(t) {
      pending.sort(function (a, b) { return a.t - b.t; });
      while (pending.length && pending[0].t < t) {
        var e = pending.shift();
        inflight.splice(inflight.indexOf(e.t), 1);
        if (e.probe) {
          probeRes.push(e.ok);
          if (probeRes.length === o.probes) {
            var f = probeRes.filter(function (x) { return !x; }).length / o.probes;
            if (f >= o.thr) { state = 'open'; openedAt = e.t; tl.push(['reabre', e.t]); seg(e.t, 'open'); }
            else { state = 'closed'; win = []; tl.push(['fecha', e.t]); closedAt = e.t; seg(e.t, 'closed'); }
            probeRes = []; probesSent = 0;
          }
        } else if (state === 'closed') {
          win.push(e.ok); if (win.length > o.win) win.shift();
          var fails = win.filter(function (x) { return !x; }).length;
          if (win.length >= o.min && fails / win.length >= o.thr) { state = 'open'; openedAt = e.t; tl.push(['abre', e.t]); seg(e.t, 'open'); }
        }
      }
    }
    for (var k = 0; k < total; k++) {
      var t = k / rate;
      flush(t);
      if (state === 'open' && t >= openedAt + o.open) { state = 'half'; probesSent = 0; probeRes = []; tl.push(['meio-aberto', t]); seg(t, 'half'); }
      var probe = false;
      if (state === 'open') { ff++; continue; }
      if (state === 'half') { if (probesSent >= o.probes) { ff++; continue; } probesSent++; probe = true; }
      if (inflight.length >= pool) { rej++; continue; }
      calls++;
      var lat = t < failUntil ? slow : fast, ok = lat <= o.timeout, end = t + Math.min(lat, o.timeout);
      inflight.push(end); if (inflight.length > peak) peak = inflight.length;
      pending.push({ t: end, ok: ok, probe: probe });
    }
    segs.push([segStart, dur, segState]);
    return { calls: calls, ff: ff, rej: rej, peak: peak, tl: tl, segs: segs, closedAt: closedAt };
  }
  function breakerOff(timeout) {
    var rate = 30, total = 3000, pool = 50, inflight = [], calls = 0, rej = 0, peak = 0;
    for (var k = 0; k < total; k++) {
      var t = k / rate;
      inflight = inflight.filter(function (e) { return e >= t; });
      if (inflight.length >= pool) { rej++; continue; }
      calls++;
      var lat = t < 90 ? 8 : 0.18;
      inflight.push(t + Math.min(lat, timeout)); if (inflight.length > peak) peak = inflight.length;
    }
    return { calls: calls, rej: rej, peak: peak };
  }
  function wBreaker(root) {
    var jan = slider('Window of calls', 5, 50, 1, 20, 'calls');
    var min = slider('Minimum calls', 1, 50, 1, 10, 'calls');
    var thr = slider('Failure threshold', 10, 100, 5, 50, '%');
    var aberto = slider('Open time', 5, 60, 5, 30, 's');
    var sondas = slider('Half-open probes', 1, 10, 1, 5, 'probes');
    var tmo = slider('Timeout', 0.5, 8, 0.5, 1, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    var NM = { closed: 'closed', open: 'open', half: 'half-open' };
    function render() {
      var o = { win: +jan.input.value, min: Math.min(+min.input.value, +jan.input.value), thr: +thr.input.value / 100, open: +aberto.input.value, probes: +sondas.input.value, timeout: +tmo.input.value };
      var s = breakerSim(o), off = breakerOff(o.timeout);
      var abre = null; s.tl.forEach(function (e) { if (abre == null && e[0] === 'abre') abre = e[1]; });
      clear(out);
      var bar = el('div', { class: 'rs-tl', role: 'img', 'aria-label': 'Breaker timeline over 100 s' });
      s.segs.forEach(function (g) {
        var sp = el('i', { class: g[2], title: NM[g[2]] + ' from ' + fmt(g[0], 2) + ' s to ' + fmt(g[1], 2) + ' s' });
        sp.style.width = ((g[1] - g[0]) / 100 * 100) + '%';
        bar.appendChild(sp);
      });
      var psp = el('i', { class: 'psp' }); psp.style.left = '90%'; bar.appendChild(psp);
      out.appendChild(bar);
      out.appendChild(el('p', { class: 'rs-axis' }, [el('span', { text: '0 s' }), el('span', { text: 'PSP-A back at 90 s' }), el('span', { text: '100 s' })]));
      out.appendChild(el('div', { class: 'rs-legend' }, [el('span', { class: 'closed', text: 'closed' }), el('span', { class: 'open', text: 'open' }), el('span', { class: 'half', text: 'half-open' })]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Opens at', abre == null ? 'never' : fmt(abre, 2) + ' s', abre == null),
        fact('Closes at', s.closedAt == null ? 'does not close' : fmt(s.closedAt, 2) + ' s'),
        fact('Calls to PSP-A (without a breaker: 3,000)', fmt(s.calls, 0)),
        fact('Fast fails', fmt(s.ff, 0)),
        fact('Refused by the pool', fmt(s.rej, 0), s.rej > 0),
        fact('Peak in flight (pool of 50)', fmt(s.peak, 0), s.peak >= 50)
      ]));
      var rows = [['Without breaker, timeout ' + fmt(o.timeout, 1) + ' s', off], ['With breaker', s]].map(function (p) {
        return { cls: p[0] === 'With breaker' ? 'rs-cur' : '', cells: [{ text: p[0] }, { text: fmt(p[1].calls, 0) }, { text: fmt(p[1].rej, 0), cls: p[1].rej ? 'rs-bad' : '' }, { text: fmt(p[1].peak, 0) }] };
      });
      out.appendChild(table(['Scenario (100 s at 30/s)', 'Calls to the PSP', 'Refused by the pool', 'Peak in flight'], rows));
      var padrao = o.win === 20 && o.min === 10 && o.thr === 0.5 && o.open === 30 && o.probes === 5 && o.timeout === 1;
      out.appendChild(verdict(abre == null || s.rej > 0,
        abre == null ? 'The breaker never opened.' : s.rej > 0 ? 'The pool still refused ' + fmt(s.rej, 0) + ' calls.' : 'The breaker protected the pool.',
        abre == null ? 'With this window and this minimum there were not enough failing calls.'
          : 'It opened at ' + fmt(abre, 2) + ' s: until then, each call was stuck for the timeout (' + fmt(o.timeout, 1) + ' s). The longer the timeout, the later the breaker opens.'));
      out.appendChild(note(padrao
        ? 'Story defaults: opens at 1.3 s, half-open at 31.3 s, reopens at 32.43 s, again at 63.6 s, half-open at 93.6 s and closes at 93.91 s; 237 calls to the PSP instead of 3,000 (54 until it closes, 183 after) and 2,763 fast fails. A call above the timeout counts as a failure.'
        : 'Same simulation as the module (30 req/s for 100 s, PSP-A at 8 s until 90 s, pool of 50), with your controls. The state goes back to "closed" only when the probes pass.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [jan.wrap, min.wrap, thr.wrap, aberto.wrap, sondas.wrap, tmo.wrap]));
    [jan, min, thr, aberto, sondas, tmo].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 9: fallback =============== */
  function wFallback(root) {
    var a = numField('Partner A, per query', 0, 5, 0.01, 0.03, 'R$');
    var b = numField('Partner B, per query', 0, 5, 0.01, 0.10, 'R$');
    var qps = slider('Queries per second', 1, 100, 1, 30, '/s');
    var min = slider('Duration', 1, 60, 1, 10, 'min');
    var pro = slider('Proactive traffic on the fallback', 0, 10, 0.5, 1, '%');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function brl(v) { return 'R$ ' + fmt(v, 2); }
    function render() {
      var pa = +a.input.value || 0, pb = +b.input.value || 0, r = +qps.input.value, m = +min.input.value, p = +pro.input.value / 100;
      var q = r * 60 * m, ca = q * pa, cb = q * pb, ex = cb - ca;
      var pr = r * p;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Queries in the window', fmt(q, 0)),
        fact('All on partner A', brl(ca)),
        fact('All on partner B (fallback)', brl(cb)),
        fact('Extra cost of the fallback', '+' + brl(ex), ex > 0)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Proactive: ' + fmt(p * 100, 1) + '% of the traffic', fmt(pr, 2) + '/s'),
        fact('Per minute', fmt(pr * 60, 1) + ' calls'),
        fact('Cost of the proactive one in the window', brl(q * p * pb))
      ]));
      out.appendChild(verdict(false, 'The fallback has a price.',
        'The more expensive partner costs +' + brl(ex) + ' in ' + m + ' min. Sending ' + fmt(p * 100, 1) + '% of the traffic to it all the time (' + fmt(pr * 60, 1) + ' calls per minute) costs little and shows, before the incident, whether it still works.'));
      out.appendChild(note('Story default: A at R$ 0.03 and B at R$ 0.10 per query (the article\'s numbers), 30/s for 10 min = 18,000 queries: R$ 540 against R$ 1,800, +R$ 1,260. The 1% proactive one sends 0.3/s to PSP-B, 18 per minute.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [a.wrap, b.wrap, qps.wrap, min.wrap, pro.wrap]));
    [a, b, qps, min, pro].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 10: degradation =============== */
  function wDegradacao(root) {
    var dem = slider('Catalog demand', 500, 2000, 50, 1300, 'req/s', function (v) { return fmt(v, 0); });
    var rep = slider('Replicas', 6, 14, 1, 10, 'replicas');
    var f0 = numField('CPU per page, level 0', 1, 30, 0.5, 10, 'ms');
    var f1 = numField('CPU per page, level 1 (no recommendations)', 1, 30, 0.5, 7.5, 'ms');
    var f2 = numField('CPU per page, level 2 (+ simple search, no reviews)', 1, 30, 0.5, 6, 'ms');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    var NM = ['0 · normal', '1 · no recommendations', '2 · + simple search and no reviews', '3 · only the static page from the CDN'];
    function render() {
      var d = +dem.input.value, r = +rep.input.value;
      var ms = [+f0.input.value || 10, +f1.input.value || 7.5, +f2.input.value || 6];
      var cap = ms.map(function (m) { return r * (1000 / m); });
      var nivel = 3;
      for (var i = 0; i < 3; i++) if (cap[i] + 1e-9 >= d) { nivel = i; break; }
      clear(out);
      var rows = NM.map(function (nm, i) {
        var c = i < 3 ? cap[i] : null;
        return { cls: i === nivel ? 'rs-cur' : '', cells: [{ text: nm }, { text: i < 3 ? fmt(ms[i], 1) + ' ms' : 'CDN' }, { text: i < 3 ? fmt(c, 0) + ' req/s' : 'the CDN holds' }, { text: i < 3 ? (c + 1e-9 >= d ? 'holds' : 'does not hold') : 'holds', cls: i < 3 && c + 1e-9 < d ? 'rs-bad' : '' }] };
      });
      out.appendChild(table(['Level', 'CPU per page', 'Capacity', 'Holds ' + fmt(d, 0) + '?'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Minimum level that holds', String(nivel), nivel > 0),
        fact('Demand', fmt(d, 0) + ' req/s'),
        fact('Capacity at level 0', fmt(cap[0], 0) + ' req/s', cap[0] < d)
      ]));
      out.appendChild(verdict(nivel > 1,
        nivel === 0 ? 'No need to degrade.' : nivel === 3 ? 'Only the static page from the CDN holds.' : 'Level ' + nivel + ' holds without falling over.',
        nivel === 0 ? 'The normal fleet handles the demand.'
          : nivel === 3 ? 'Not even level 2 gets there: take the store off the server and serve the storefront from the CDN (module 5) while the fleet grows.'
          : 'Switching off on purpose what is not essential buys the time the HPA takes (minutes) to go from 10 to 14 replicas (1,400 req/s). When the peak passes, go back one level at a time.'));
      out.appendChild(note('Story default: 1,300 req/s at 20:20 (a burst of a few seconds, from the newsletter) against 1,000. Level 0: 10 ms = 100 req/s per replica = 1,000; level 1: 7.5 ms = 133 = 1,333; level 2: 6 ms = 167 = 1,667. The sustained peak from module 14 is 640 (projected 950).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dem.wrap, rep.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [f0.wrap, f1.wrap, f2.wrap]));
    [dem, rep, f0, f1, f2].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 11: fila e backpressure =============== */
  function wFila(root) {
    var POL = ['Unbounded queue', 'Block the producer', 'Refuse with 429', 'Drop by priority'];
    var btns = [], S = { p: 2 };
    var cheg = slider('Arrival', 20, 300, 5, 120, 'events/s');
    var capa = slider('Projector capacity', 20, 300, 5, 100, 'events/s');
    var lim = slider('Queue limit', 500, 20000, 500, 5000, 'events', function (v) { return fmt(v, 0); });
    var crise = slider('Crisis duration', 1, 30, 1, 10, 'min');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var a = +cheg.input.value, c = +capa.input.value, L = +lim.input.value, T = +crise.input.value * 60;
      var def = a - c;
      clear(out);
      if (def <= 0) {
        out.appendChild(verdict(false, 'No overload.', 'The capacity (' + fmt(c, 0) + '/s) covers the arrival (' + fmt(a, 0) + '/s): the queue stays empty. Raise the arrival above the capacity to see the deficit.'));
        return;
      }
      var enche = L / def, back = def * T, atrasoIl = back / c, dreno = back / (c - 20);
      var items = [];
      if (S.p === 0) {
        items = [
          fact('Delay after ' + fmt(T / 60, 0) + ' min', fmt(atrasoIl, 0) + ' s and growing', true),
          fact('Events in the queue', fmt(back, 0), true),
          fact('Drain with arrival at 20/s', fmt(dreno, 0) + ' s')
        ];
      } else {
        var cheia = enche < T;
        var atrasoMax = L / c;
        items = [
          fact('The queue of ' + fmt(L, 0) + ' fills in', fmt(enche, 0) + ' s (' + fmt(Math.floor(enche / 60), 0) + ' min ' + fmt(Math.round(enche % 60), 0) + ' s)', false),
          fact('Maximum delay (full queue)', fmt(atrasoMax, 0) + ' s'),
          S.p === 1 ? fact('Who pays', 'the producer waits (arrival drops to ' + fmt(c, 0) + '/s)') : S.p === 2 ? fact('Refused with 429 + Retry-After', cheia ? fmt(def, 0) + '/s' : 'none yet', cheia) : fact('Dropped (SHEDDABLE first)', cheia ? fmt(def, 0) + '/s' : 'none yet', cheia),
          fact('Drain at the end of the crisis', fmt(Math.min(L, back) / (c - 20), 0) + ' s')
        ];
      }
      out.appendChild(el('div', { class: 'sr-facts' }, items));
      var bad = S.p === 0;
      var txt = [
        'An unbounded queue "in memory" hides the overload: the delay grows without telling anyone, memory fills up and the process dies with the queue inside.',
        'The producer notices the slowness and slows down on its own. It works when it can wait; an app client cannot.',
        'The limit shows up: the projector answers 429 with Retry-After and whoever sends knows it has to wait. The full queue gives at most ' + fmt(L / c, 0) + ' s of delay.',
        'With the queue at its limit, it drops SHEDDABLE traffic first (marketing, reports) and keeps the order events. It is refusing early what matters least.'
      ][S.p];
      out.appendChild(verdict(bad, POL[S.p] + '.', txt));
      out.appendChild(note('Story default (the meus-pedidos projector from module 18): arrival of 120/s against 100/s, deficit of 20/s; the queue of 5,000 fills in 250 s (4 min 10 s); unbounded, in 10 min that is 12,000 events = 120 s of delay; draining takes 12,000 ÷ (100 − 20) = 150 s after the crisis.'));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Queue policy', POL, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cheg.wrap, capa.wrap, lim.wrap, crise.wrap]));
    [cheg, capa, lim, crise].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== LESSON 13: bulkhead =============== */
  function wBulkhead(root) {
    var total = slider('Total pool of pagamentos', 20, 300, 10, 100, 'connections');
    var psp = slider('PSP partition', 10, 200, 5, 50, 'connections');
    var frete = slider('Shipping quote partition', 5, 100, 5, 30, 'connections');
    var lat = slider('PSP-A latency', 0.1, 10, 0.1, 8, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var T = +total.input.value, p = +psp.input.value, f = +frete.input.value, w = +lat.input.value;
      var email = T - p - f, L = 30 * w;
      clear(out);
      if (email < 1) {
        out.appendChild(verdict(true, 'The partitions exceed the pool.', 'PSP (' + p + ') + shipping (' + f + ') leave ' + email + ' for the email: lower a partition or raise the total pool.'));
        return;
      }
      var satC = L > T + 1e-9, satB = L > p + 1e-9;
      var tC = T / 30, tB = p / 30;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('PSP-A in flight (30/s × ' + fmt(w, 1) + ' s)', fmt(L, 1), satB),
        fact('Single pool (' + T + '): runs out in', satC ? fmt(tC, 2) + ' s' : 'does not run out', satC),
        fact('With bulkheads: the PSP one (' + p + ') runs out in', satB ? fmt(tB, 2) + ' s' : 'does not run out', satB)
      ]));
      var rows = [
        { cells: [{ text: 'PSP-A' }, { text: satC ? 'down' : 'keeps going', cls: satC ? 'rs-bad' : '' }, { text: satB ? 'down (' + p + ' connections)' : 'keeps going', cls: satB ? 'rs-bad' : '' }] },
        { cells: [{ text: 'Shipping quote' }, { text: satC ? 'down too' : 'keeps going', cls: satC ? 'rs-bad' : '' }, { text: 'keeps going (' + f + ' connections)' }] },
        { cells: [{ text: 'Email' }, { text: satC ? 'down too' : 'keeps going', cls: satC ? 'rs-bad' : '' }, { text: 'keeps going (' + email + ' connections)' }] }
      ];
      out.appendChild(table(['Dependency', 'Shared pool', 'With bulkheads ' + p + '/' + f + '/' + email], rows));
      out.appendChild(verdict(satC,
        satC ? 'In the single pool, the slow PSP takes everything with it.' : 'With this PSP, nothing runs out.',
        satC ? 'The ' + T + ' connections get stuck on the PSP in ' + fmt(tC, 2) + ' s, and the shipping quote and the email, which are fast, get blocked too. With walls, only the PSP is left out and the other two keep going.'
          : 'A latency of ' + fmt(w, 1) + ' s keeps ' + fmt(L, 1) + ' in flight, below the pool. Raise the latency to 8 s and compare.'));
      out.appendChild(note('Story default: a shared pool of 100 fills in 100 ÷ 30 = 3.33 s; bulkheads of 50 (PSP), 30 (shipping) and 20 (email) make only the PSP one run out, in 50 ÷ 30 = 1.67 s. A bulkhead that is too small refuses legitimate traffic: 30 connections for a peak of 40 in flight.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [total.wrap, psp.wrap, frete.wrap, lat.wrap]));
    [total, psp, frete, lat].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 3: blast radius =============== */
  function wBlast(root) {
    var NS = [3, 5, 10, 100, 1000];
    var nB = [], dB = [], S = { n: 0, d: 0 };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var n = NS[S.n], mk = S.d === 1;
      var uni = 1 / n;
      var comMk = mk ? 0.4 + 0.6 / n : uni, resto = mk ? 0.6 / n : uni;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Customers affected (1 of ' + n + ')', fmt(uni * 100, 1) + '%'),
        fact(mk ? 'Rows on shard-2 (with mkt-01)' : 'Rows in one compartment', fmt(comMk * 100, 1) + '%', mk),
        fact(mk ? 'Rows on each of the others' : 'Rows affected', fmt(resto * 100, 1) + '%')
      ]));
      var draw = Math.min(n, 12);
      var chart = el('div', { class: 'rs-shards', role: 'img', 'aria-label': 'Share of rows in each compartment' });
      for (var i = 0; i < draw; i++) {
        var v = i === draw - 1 ? comMk : resto;
        var col = el('div', { class: 'rs-shard' + (i === draw - 1 && mk ? ' hot' : '') });
        var bar = el('i'); bar.style.height = Math.max(3, v * 100 / (mk ? 60 : Math.max(uni * 100, 1)) * (mk ? 1 : 0.6)) + '%';
        col.appendChild(bar);
        col.appendChild(el('span', { text: i === draw - 1 && mk ? 'shard-2' : 's' + i }));
        chart.appendChild(col);
      }
      out.appendChild(chart);
      out.appendChild(verdict(mk,
        mk ? 'One shard down wipes out ' + fmt(comMk * 100, 0) + '% of the rows, for ' + fmt(uni * 100, 1) + '% of the customers.' : 'With uniform load, 1 of ' + n + ' gives ' + fmt(uni * 100, 1) + '%.',
        mk ? 'mkt-01 (a marketplace customer) has 40% of the rows and lives on shard-2. The 1/N math assumes equal load; here it does not hold.'
          : 'The 1/N math is the best case: it works when all the compartments weigh the same. Try the mkt-01 distribution.'));
      out.appendChild(note('Story default (module 16): 3 shards and mkt-01 at 40% of the rows: shard-2 = 0.4 + 0.6 ÷ 3 = 60% of the rows; shard-0 and shard-1 = 20% each. One shard down affects 1/3 of the customers (33.3%) but 20% or 60% of the rows. 1/N: 10 → 10%, 100 → 1%, 1,000 → 0.1%.'));
    }
    function pickN(i) { S.n = i; press(nB, i); render(); }
    function pickD(i) { S.d = i; press(dB, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Compartments (shards, replicas, cells)' }));
    root.appendChild(chipRow('Compartments', NS.map(String), nB, pickN));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Load distribution' }));
    root.appendChild(chipRow('Load distribution', ['Uniform', 'mkt-01 at 40% of the rows'], dB, pickD));
    root.appendChild(out);
    pickN(0); pickD(0);
  }

  /* =============== LESSON 5: idempotency key =============== */
  function wIdem(root) {
    var KEY = '3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10';
    var n = slider('Times the app sends the POST', 1, 5, 1, 2, 'times');
    var kB = [], cB = [], S = { key: 1, diff: 0 };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var k = +n.input.value, comChave = S.key === 1, diff = S.diff === 1;
      var criados = comChave ? 1 : k;
      clear(out);
      var rows = [];
      for (var i = 1; i <= k; i++) {
        var st, extra;
        if (!comChave) { st = '201'; extra = i === 1 ? 'order 1058' : 'duplicate order (hypothetical)'; }
        else if (i === 1) { st = '201'; extra = 'executes · INSERT 0 1'; }
        else if (diff) { st = '422'; extra = 'different body · INSERT 0 0'; }
        else { st = '201'; extra = 'stored response (order 1058) · INSERT 0 0'; }
        rows.push({ cls: st === '422' ? 'rs-badrow' : '', cells: [{ text: 'send ' + i }, { text: st, cls: st === '422' ? 'rs-bad' : '' }, { text: extra }] });
      }
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Orders created', String(criados), criados > 1),
        fact('Charges to the PSP', String(criados), criados > 1),
        fact('Extra header', comChave ? '+57 B' : 'none')
      ]));
      out.appendChild(table(['Send', 'Status', 'What the server did'], rows));
      if (comChave) {
        out.appendChild(el('pre', { class: 'rs-json' }, [el('code', { text:
          'Idempotency-Key: "' + KEY + '"\n\n' +
          'chave         | hash_corpo | estado    | resposta\n' +
          '3f9a2c7e-…    | ' + (diff && k > 1 ? 'no match   ' : 'b7e1…      ') + '| concluido | {"status":201,"pedido_id":1058}' }) ]));
      }
      out.appendChild(verdict(!comChave && k > 1,
        !comChave ? (k > 1 ? 'Without a key, each send is a new intent.' : 'Just one send: nothing to duplicate.') : diff && k > 1 ? 'The key matches, the body does not: 422.' : 'The key guarantees a single effect.',
        !comChave ? (k > 1 ? 'Caio\'s app lost the response and repeated: ' + k + ' orders and ' + k + ' charges are born. This is thread 4 from module 12.' : 'Increase the sends to see what repeating does without the key.')
          : diff && k > 1 ? 'The same key with another body is a client error, not a repeat: the server compares the body hash and refuses with 422 (the IETF draft).'
          : 'The repeat finds the key in the idempotencia table, the INSERT … ON CONFLICT DO NOTHING returns 0 rows and the stored response comes back: the same 1058, not a 1059.'));
      out.appendChild(note('Real data (PostgreSQL 14.24): the 1st arrival returned INSERT 0 1 and stored {"status":201,"pedido_id":1058}; the repeat returned INSERT 0 0 and the stored response (mesmo_corpo = t); with a different body, mesmo_corpo = f. If the first one is still processing, the concurrent INSERT waits for the commit (unique index) and returns 0 rows.'));
    }
    function pickK(i) { S.key = i; press(kB, i); render(); }
    function pickC(i) { S.diff = i; press(cB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap]));
    root.appendChild(chipRow('Key', ['Without Idempotency-Key', 'With Idempotency-Key'], kB, pickK));
    root.appendChild(chipRow('Body of the repeat', ['Same body', 'Different body'], cB, pickC));
    n.input.addEventListener('input', render);
    root.appendChild(out);
    pickK(1); pickC(0);
  }

  var REG = {
    disponibilidade: wDisponibilidade, little: wLittle, prazos: wPrazos, tempestade: wTempestade, amplificacao: wAmplificacao,
    breaker: wBreaker, fallback: wFallback, degradacao: wDegradacao, fila: wFila, bulkhead: wBulkhead, blast: wBlast, idem: wIdem
  };
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
