/* SDLabs · Capacity Planning: plain JS widgets (English copy of widgets.js)
   (M/M/1 queue and variability, Little and pool, knee, mix and burst, profiles, projection, chain and cost).
   Same numbers as the lessons: pagamentos S = 50 ms (μ = 20/s per pod), catalog R(ρ) = 10 ms + 10 ms ÷ (1 − ρ),
   series 300 · 410 · 520 · 640, daily/weekly/seasonal profiles, chain 30 · 20 · 500 · 150 per unit, 2027 plan (41 vCPU). */
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
  function fmtMs(ms) {
    if (!isFinite(ms)) return '∞';
    if (ms >= 10000) return fmt(ms, 0) + ' ms';
    return fmt(ms, ms < 100 ? 1 : 0) + ' ms';
  }
  function fmtH(s) { return s >= 3600 ? fmt(s / 3600, 1) + ' h' : s >= 60 ? fmt(s / 60, 1) + ' min' : fmt(s, 0) + ' s'; }

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
    var id = 'cp-sl-' + (++uid);
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
    var id = 'cp-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: String(value), inputmode: 'decimal', class: 'cp-num' });
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp]) };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' cp-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cp-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function sub(t) { return el('p', { class: 'sr-sub', text: t }); }

  var LN20 = Math.log(20);
  function zone(rho) {
    if (rho >= 1) return { name: 'unstable', bad: true };
    if (rho >= 0.95) return { name: 'maximum (95% or more)', bad: true };
    if (rho > 0.85) return { name: 'above the knee', bad: true };
    if (rho >= 0.8) return { name: 'knee (80–85%)', bad: true };
    if (rho > 0.7) return { name: 'caution (70–80%)', bad: false };
    return { name: 'healthy (up to 70%)', bad: false };
  }
  /* response time of an M/G/1 queue (P–K); fixo = wait outside the CPU (catalog: 10 ms) */
  function respMs(S, rho, cv, fixo) { return fixo + S + rho / (1 - rho) * (1 + cv * cv) / 2 * S; }

  /* =============== LESSON 2: queue =============== */
  function wFila(root) {
    var CVS = [0, 0.5, 1, 2], CVL = ['CV 0 (constant)', 'CV 0.5', 'CV 1 (exponential)', 'CV 2 (light and heavy)'];
    var S = { cv: 2, fixo: 0 };
    var sS = slider('Service time', 10, 200, 5, 50, 'ms');
    var sC = slider('Servers (pods)', 1, 20, 1, 2, 'pods');
    var sL = slider('Total arrival (λ)', 1, 700, 1, 30, 'req/s');
    var cvB = [], preB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var s = +sS.input.value, c = +sC.input.value, lam = +sL.input.value, cv = CVS[S.cv];
      var mu = 1000 / s, lp = lam / c, rho = lp / mu, z = zone(rho);
      clear(out);
      if (rho >= 1) {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Utilization (ρ)', fmt(rho * 100, 1) + '%', true), fact('λ per pod', fmt(lp, 1) + '/s', true), fact('μ per pod', fmt(mu, 1) + '/s')
        ]));
        out.appendChild(verdict(true, 'The queue never stops growing.', 'The arrival per pod (' + fmt(lp, 1) + '/s) went past what the pod serves (' + fmt(mu, 1) + '/s): the wait goes to infinity. Add pods or lower λ.'));
        return;
      }
      var W = respMs(s, rho, cv, S.fixo), L = lp * W / 1000;
      var p95ok = cv === 1 && S.fixo === 0;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Utilization (ρ)', fmt(rho * 100, 1) + '%', z.bad),
        fact('λ per pod · μ per pod', fmt(lp, 1) + '/s · ' + fmt(mu, 1) + '/s'),
        fact('Response time (W)', fmtMs(W), z.bad),
        fact('In flight per pod (L)', fmt(L, 2)),
        fact('p95 (W × ln 20)', p95ok ? fmtMs(W * LN20) : '— (M/M/1 only)'),
        fact('W ÷ S', fmt((W - S.fixo) / s, 1) + '×')
      ]));
      var rows = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99].map(function (r) {
        var w = respMs(s, r, cv, S.fixo);
        return { cls: Math.abs(r - rho) < 0.0125 ? 'cp-cur' : '', cells: [
          { text: fmt(r * 100, 0) + '%' }, { text: fmt(mu * r, 1) + '/s' }, { text: fmtMs(w) },
          { text: fmt(mu * r * w / 1000, 1) }, { text: p95ok ? fmtMs(w * LN20) : '—' }] };
      });
      out.appendChild(table(['ρ', 'λ per pod', 'W', 'L', 'p95'], rows));
      out.appendChild(verdict(z.bad, 'Zone: ' + z.name + '.',
        cv === 2 && rho >= 0.79 && rho <= 0.81 && s === 50
          ? 'With CV 2 at 80% pagamentos answers in 550 ms, 3.7× that of CV 0 (150 ms). The dashboard reads "CPU 80%" and the utilization looks healthy.'
          : 'Same utilization, different wait: change the CV and compare. At 80% with S = 50 ms: 150 · 175 · 250 · 550 ms.'));
      out.appendChild(note(S.fixo
        ? 'Catalog: R(ρ) = 10 ms of wait outside the CPU + 10 ms ÷ (1 − ρ). With 640 req/s on 10 replicas (64%): 37.8 ms.'
        : 'M/M/1 and Pollaczek–Khinchine: W = S + ρ ÷ (1 − ρ) × (1 + CV²) ÷ 2 × S. The p95 uses the exponential (W × ln 20). Pods behind round robin: M/M/1 leaves slack.'));
    }
    function pickCv(i) { S.cv = i; press(cvB, i); render(); }
    function preset(i) {
      press(preB, i);
      if (i === 0) { sS.set(50); sC.set(2); sL.set(30); S.fixo = 0; pickCv(2); }
      else { sS.set(10); sC.set(10); sL.set(640); S.fixo = 10; pickCv(2); }
    }
    root.appendChild(chipRow('Presets', ['pagamentos: 30 orders/s on 2 pods', 'catalog: 640 req/s on 10 replicas'], preB, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [sS.wrap, sC.wrap, sL.wrap]));
    [sS, sC, sL].forEach(function (x) { x.input.addEventListener('input', function () { if (+sS.input.value !== 10 && S.fixo) S.fixo = 0; render(); }); });
    root.appendChild(sub('Service variability'));
    root.appendChild(chipRow('Variability', CVL, cvB, pickCv));
    root.appendChild(out);
    preset(0); pickCv(2);
  }

  /* =============== LESSON 3: Little and pool =============== */
  function wLittle(root) {
    var lam = slider('Arrival (λ)', 5, 1000, 5, 200, 'req/s');
    var w = slider('Response time (W)', 10, 1000, 10, 180, 'ms');
    var la = slider('Target L', 1, 500, 1, 150, 'in flight');
    var fo = slider('Pool headroom', 1, 8, 0.5, 4, '×');
    var po = slider('Current pool', 10, 300, 10, 50, 'connections');
    var preB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var l = +lam.input.value, ms = +w.input.value, L = l * ms / 1000, tgt = +la.input.value, pool = +po.input.value, f = +fo.input.value;
      var wt = tgt / l * 1000, cap1 = tgt / (ms / 1000), cap2 = tgt / (ms / 2000), need = Math.ceil(L * f);
      var sat = L > pool;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('In flight (L = λ × W)', fmt(L, 1), L > tgt),
        fact('Target W = target L ÷ λ', fmt(wt, 0) + ' ms', ms > wt),
        fact('Maximum at current W', fmt(cap1, 0) + ' req/s'),
        fact('Maximum with W halved', fmt(cap2, 0) + ' req/s (+' + fmt((cap2 / cap1 - 1) * 100, 0) + '%)')
      ]));
      out.appendChild(sub('The connection pool'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Recommended pool (L × headroom)', fmt(need, 0) + ' connections'),
        fact('Current pool occupancy', fmt(L / pool * 100, 0) + '%', sat),
        fact('Critical timeout (pool ÷ λ)', fmt(pool / l, 2) + ' s', pool / l < 0.7)
      ]));
      out.appendChild(verdict(sat, sat ? 'The pool saturates.' : 'The pool holds.',
        sat ? L > 0 ? 'There are ' + fmt(L, 0) + ' in flight for ' + fmt(pool, 0) + ' connections: the excess waits. The CPU can be at 20% and the service stalled; only concurrency (L) shows it.' : '' :
          'With ' + fmt(L, 0) + ' in flight out of ' + fmt(pool, 0) + ', the pool has slack. If W rises to ' + fmt(pool / l * 1000, 0) + ' ms, it saturates.'));
      out.appendChild(note('Cutting W from 300 to 150 ms does not give "50% more": the same concurrency sustains double (500 → 1,000 req/s, +100%). Article examples: 1,500 × 0.050 = 75; × 0.085 = 127.5.'));
    }
    function preset(i) {
      press(preB, i);
      if (i === 0) { lam.set(500); w.set(300); la.set(150); }
      else if (i === 1) { lam.set(200); w.set(180); po.set(50); }
      else { lam.set(200); w.set(500); po.set(50); }
      render();
    }
    root.appendChild(chipRow('Presets', ['REST API (500 req/s · 300 ms)', 'PSP normal (200/s · 0.18 s)', 'PSP slow (200/s · 0.5 s)'], preB, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lam.wrap, w.wrap, la.wrap, fo.wrap, po.wrap]));
    [lam, w, la, fo, po].forEach(function (x) { x.input.addEventListener('input', function () { press(preB, -1); render(); }); });
    root.appendChild(out);
    preset(1);
  }

  /* =============== LESSON 4: knee =============== */
  function wJoelho(root) {
    var S = { who: 0 };
    var rho = slider('Utilization (ρ)', 0, 99, 1, 70, '%');
    var whoB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function params() { return S.who === 0 ? { s: 50, fixo: 0 } : { s: 10, fixo: 10 }; }
    function cost(s, r) { return s / ((1 - r) * (1 - r)) * 0.01; }
    function render() {
      var r = +rho.input.value / 100, p = params(), z = zone(r);
      var W = p.fixo + p.s / (1 - r), L = r / (1 - r), c = cost(p.s, r);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Response time (W)', fmtMs(W), z.bad),
        fact('In flight per server (L)', fmt(L, 2)),
        fact('Cost of one more point', '+' + fmtMs(c), z.bad),
        fact('Zone', z.name, z.bad)
      ]));
      var rows = [0.5, 0.7, 0.8, 0.9, 0.95, 0.99].map(function (x) {
        return { cls: Math.abs(x - r) < 0.005 ? 'cp-cur' : '', cells: [
          { text: fmt(x * 100, 0) + '%' }, { text: fmtMs(p.fixo + p.s / (1 - x)) }, { text: fmt(x / (1 - x), 1) }, { text: '+' + fmtMs(cost(p.s, x)) }] };
      });
      out.appendChild(table(['ρ', 'W', 'L', 'Cost of +1 point'], rows));
      out.appendChild(verdict(z.bad, z.bad ? 'Past the healthy point.' : 'Inside the healthy point.',
        z.bad ? 'Each extra point costs ' + fmtMs(c) + ', ' + fmt(c / cost(p.s, 0.7), 1) + '× the cost at 70%. A burst pushes the p95 and the timeout turns into a 504.'
          : 'At 70% each point costs ' + fmtMs(cost(p.s, 0.7)) + '. There is margin for the burst and for variability.'));
      out.appendChild(note('There is no corner in M/M/1: the curve is smooth (W = S ÷ (1 − ρ)) and the knee is where the cost of the point passes what the team accepts. Store zones: up to 70% · 70–80% · 80–85% · 95%.'));
    }
    function pickWho(i) { S.who = i; press(whoB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rho.wrap]));
    rho.input.addEventListener('input', render);
    root.appendChild(chipRow('Compare', ['pagamentos (S = 50 ms)', 'catalog (10 ms + 10 ms ÷ (1 − ρ))'], whoB, pickWho));
    root.appendChild(out);
    pickWho(0);
  }

  /* =============== LESSON 5: mix, burst and bandwidth =============== */
  function wMix(root) {
    var busca = slider('Searches in the traffic', 0, 20, 1, 5, '%');
    var cpuP = slider('Page CPU', 5, 30, 1, 10, 'ms');
    var cpuB = slider('Search CPU', 20, 200, 5, 80, 'ms');
    var dem = slider('Catalog demand', 100, 1500, 10, 950, 'req/s');
    var tps = slider('Burst: the minute\'s TPS', 100, 1000, 10, 640, 'req/s');
    var rep = slider('Replicas in the burst', 1, 20, 1, 10, 'replicas');
    var kbq = slider('Request', 1, 20, 1, 1, 'KB');
    var kbs = slider('Response', 1, 100, 1, 19, 'KB');
    var rty = slider('Retries', 0, 30, 5, 0, '%');
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function mbit(t, kb, r) { return t * kb * 1024 * 8 * (1 + r) / 1e6; }
    function render() {
      var b = +busca.input.value / 100, cp = +cpuP.input.value, cb = +cpuB.input.value, d = +dem.input.value;
      var cpu = (1 - b) * cp + b * cb, rps = 1000 / cpu, need = Math.ceil(d / (0.7 * rps)), base = Math.ceil(d / (0.7 * (1000 / cp)));
      var u14 = d / (14 * rps), t = +tps.input.value, n = +rep.input.value, per = t / n;
      var rho = t / (n * (1000 / cp)), spread = rho < 1 ? 10 + cp / (1 - rho) : Infinity;
      var kb = +kbq.input.value + +kbs.input.value, r = +rty.input.value / 100;
      clear(out);
      out.appendChild(sub('The mix: each request type costs a different CPU'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Average CPU per request', fmt(cpu, 1) + ' ms'),
        fact('Req/s per replica', fmt(rps, 1)),
        fact('Replicas at 70% (' + fmt(d, 0) + ' req/s)', fmt(need, 0), need > base),
        fact('Ignoring search', fmt(base, 0) + ' replicas'),
        fact('With 14 replicas: utilization', fmt(u14 * 100, 0) + '%', u14 > 0.8)
      ]));
      out.appendChild(verdict(need > base, need > base ? 'The page average misleads.' : 'Without search, the 100 req/s per replica math holds.',
        need > base ? 'Planning with "100 req/s per replica" would give ' + base + ' replicas where ' + need + ' are needed. The fleet would start near 95% CPU at the peak.' : 'Raise the search percentage: 5% takes 14 to 19 replicas; 10% takes it to 24.'));
      out.appendChild(sub('The burst inside the second'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Spread over the second: ρ', fmt(rho * 100, 0) + '%'),
        fact('Spread: response time', fmtMs(spread)),
        fact('10 ms burst: per replica', fmt(per, 0) + ' at once', per * cp > 300),
        fact('The last in line waits', fmt(per * cp, 0) + ' ms', per * cp > 300),
        fact('Average wait', '~' + fmt(per * cp / 2, 0) + ' ms')
      ]));
      out.appendChild(sub('Bandwidth'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Per transaction', fmt(kb, 0) + ' KB'),
        fact('At ' + fmt(d, 0) + ' req/s', fmt(d * kb * 1024 / 1e6, 1) + ' MB/s = ' + fmt(mbit(d, kb, r), 0) + ' Mbit/s'),
        fact('At 640 req/s', fmt(mbit(640, kb, r), 0) + ' Mbit/s')
      ]));
      out.appendChild(note('The average cost comes from 0.95 × 10 + 0.05 × 80 = 13.5 ms (74.1 req/s). Burst: the 640 req/s of 1 s arriving in 10 ms are 64 per replica, served 1 every 10 ms. Bandwidth = TPS × KB × 1,024 × 8; with 10% retries, 171 Mbit/s at 950 req/s.'));
    }
    [busca, cpuP, cpuB, dem, tps, rep, kbq, kbs, rty].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [busca.wrap, cpuP.wrap, cpuB.wrap, dem.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tps.wrap, rep.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [kbq.wrap, kbs.wrap, rty.wrap]));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 6: profiles =============== */
  var DIA = [8.2, 6.1, 4.1, 4.1, 4.1, 8.2, 16.3, 28.5, 40.8, 48.9, 53.0, 57.1, 61.1, 53.0, 48.9, 48.9, 53.0, 57.1, 61.1, 69.3, 77.5, 81.5, 48.9, 20.4];
  var SEM = [1.05, 1.00, 1.00, 1.05, 1.15, 0.90, 0.85], SEML = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var MES = [0.85, 0.80, 0.90, 0.90, 1.00, 0.95, 0.90, 0.95, 1.00, 1.10, 1.45, 1.20], MESL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function wPerfis(root) {
    var S = { s: 0, bf: true };
    var sB = [];
    var cb = el('input', { type: 'checkbox', id: 'cp-bf', checked: 'checked' });
    var ag = slider('Black Friday aggregation window', 0, 2, 1, 0, '', function (v) { return ['1 minute', '1 day', '1 month'][v]; });
    var chart = el('div', { class: 'cp-chart' });
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function series() {
      if (S.s === 0) return { v: DIA, l: DIA.map(function (_, i) { return i + 'h'; }), t: 'Ordinary day (req/s per hour, average 40)' };
      if (S.s === 1) return { v: SEM.map(function (f) { return f * 40; }), l: SEML, t: 'Week (factor × 40 req/s)' };
      return { v: MES.map(function (f) { return f * 40; }), l: MESL, t: 'Year (month index × 40 req/s)' };
    }
    function render() {
      var sr = series(), bf = S.bf, max = bf ? 700 : Math.max.apply(null, sr.v) * 1.1;
      clear(chart);
      var plot = el('div', { class: 'cp-plot' });
      var bars = el('div', { class: 'cp-bars', role: 'img', 'aria-label': sr.t });
      sr.v.forEach(function (v, i) {
        var peak = v === Math.max.apply(null, sr.v);
        bars.appendChild(el('i', { class: peak ? 'pk' : '', style: 'height:' + (v / max * 100) + '%', title: sr.l[i] + ': ' + fmt(v, 1) + ' req/s' }));
      });
      plot.appendChild(bars);
      if (bf) {
        [[640, 'BF 20:03 · 640'], [400, 'BF day average · 400']].forEach(function (x) {
          plot.appendChild(el('span', { class: 'cp-ref', style: 'bottom:' + (x[0] / max * 100) + '%', text: x[1] }));
        });
      }
      chart.appendChild(plot);
      chart.appendChild(el('div', { class: 'cp-axis' }, [el('span', { text: sr.l[0] }), el('span', { text: sr.t }), el('span', { text: sr.l[sr.l.length - 1] })]));
      var a = +ag.input.value, vals = [640, 400, 58];
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Ordinary-day peak (9 pm)', '81.5 req/s'),
        fact('Friday (×1.15 over the average)', fmt(40 * 1.15, 0) + ' req/s'),
        fact('November (×1.45)', '58 req/s on average'),
        fact('Black Friday, ' + ['1-minute', '1-day', '1-month'][a] + ' window', fmt(vals[a], 0) + ' req/s', a === 0)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('× the month average (58)', fmt(vals[a] / 58, 1) + '×'),
        fact('× the ordinary-day peak (81.5)', fmt(vals[a] / 81.5, 1) + '×')
      ]));
      out.appendChild(verdict(a === 0, a === 0 ? 'The peak only shows in the 1-minute window.' : 'The larger window hides the peak.',
        a === 0 ? 'The 20:03 minute has 640 req/s: 11× the November average and 7.9× the ordinary peak. It is the window the plan has to cover.'
          : a === 1 ? 'In the day average Black Friday has 400 req/s: the day hides the minute.' : 'In the month average, November has 58 req/s: the month hides the day.'));
      out.appendChild(note('Declared example series (ordinary-day average = 40 req/s): weekly factors add up to 7.00 and monthly indexes to 12.00. The module 21 burst of 1,300 req/s lasts seconds: in the 1-minute window the same night is ~650.'));
    }
    function pick(i) { S.s = i; press(sB, i); render(); }
    root.appendChild(chipRow('Scale', ['Day', 'Week', 'Month'], sB, pick));
    var lab = el('label', { class: 'cp-check', for: 'cp-bf' }, [cb, ' Show Black Friday (640 in the minute, 400 in the day average)']);
    cb.addEventListener('change', function () { S.bf = cb.checked; render(); });
    root.appendChild(lab);
    root.appendChild(chart);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ag.wrap]));
    ag.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 7: projection =============== */
  function wProjecao(root) {
    var f = [numField('2023', 1, 5000, 10, 300, 'req/s'), numField('2024', 1, 5000, 10, 410, 'req/s'), numField('2025', 1, 5000, 10, 520, 'req/s'), numField('2026', 1, 5000, 10, 640, 'req/s')];
    var ev = slider('Business event (new screen)', 0, 40, 1, 15, '%');
    var rep = slider('Catalog replicas (100 req/s)', 4, 30, 1, 14, 'replicas');
    var rB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function r10(x) { return Math.round(x / 10) * 10; }
    function render() {
      var y = f.map(function (x) { return Math.max(1, +x.input.value || 1); });
      var mx = 1.5, my = (y[0] + y[1] + y[2] + y[3]) / 4;
      var slope = (-1.5 * y[0] - 0.5 * y[1] + 0.5 * y[2] + 1.5 * y[3]) / 5;
      var lin = my + slope * (4 - mx);
      var g = Math.pow(y[3] / y[0], 1 / 3), comp = y[3] * g;
      var e = +ev.input.value / 100, plano = r10(comp * (1 + e)), alta = r10(plano * 1.2), n = +rep.input.value;
      var cenarios = [['Linear trend', lin], ['Compound trend', comp], ['With the event', plano], ['Margin (+20%)', alta]];
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Least-squares line', '+' + fmt(slope, 0) + ' per year → ' + fmt(lin, 0)),
        fact('Compound rate', fmt((g - 1) * 100, 1) + '% per year → ' + fmt(comp, 0)),
        fact('Real jumps', fmt(y[1] / y[0], 2) + ' · ' + fmt(y[2] / y[1], 2) + ' · ' + fmt(y[3] / y[2], 2))
      ]));
      var rows = cenarios.map(function (c) {
        var rho = c[1] / (n * 100), z = zone(rho);
        return { cells: [{ text: c[0] }, { text: fmt(c[1], 0) }, { text: fmt(rho * 100, 1) + '%', cls: z.bad ? 'cp-bad' : '' },
          { text: rho < 1 ? fmtMs(10 + 10 / (1 - rho)) : '∞' }] };
      });
      out.appendChild(table(['2027', 'req/s', 'Usage (' + n + ')', 'R(ρ)'], rows));
      var rhoE = plano / (n * 100);
      out.appendChild(verdict(rhoE > 0.8, rhoE > 0.8 ? 'With the event, ' + n + ' replicas go past the knee.' : 'With the event, ' + n + ' replicas sit at ' + fmt(rhoE * 100, 1) + '%.',
        rhoE > 0.8 ? 'If the plan uses only the line (' + fmt(lin, 0) + '), the math looks like it has slack; the event changes everything.' : 'The margin of ' + fmt(alta, 0) + ' req/s takes ' + fmt(alta / (n * 100) * 100, 1) + '%.'));
      var hoje = 30, tend = hoje * plano / y[3];
      out.appendChild(sub('The checkout (orders/s)'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Trend (30 × ' + fmt(plano / y[3], 3) + ')', fmt(tend, 1) + ' orders/s'),
        fact('Sales goal', '200 orders/s'),
        fact('Stress (1.5 × the goal)', '300 orders/s'),
        fact('Gap to explain', fmt(200 - tend, 0) + ' orders/s (partners through the API)', true),
        fact('Conversion: today × goal', fmt(30 / y[3] * 100, 1) + '% × ' + fmt(200 / plano * 100, 0) + '% per request')
      ]));
      out.appendChild(note('Declared example series. The plan rounds the event (824 × 1.15 = 947.5) to 950 and the margin to 1,140.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, f.map(function (x) { return x.wrap; })));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ev.wrap, rep.wrap]));
    root.appendChild(chipRow('Replicas', ['10 replicas', '14 replicas'], rB, function (i) { rep.set(i ? 14 : 10); press(rB, i); render(); }));
    f.forEach(function (x) { x.input.addEventListener('input', render); });
    ev.input.addEventListener('input', render);
    rep.input.addEventListener('input', function () { press(rB, +rep.input.value === 10 ? 0 : +rep.input.value === 14 ? 1 : -1); render(); });
    root.appendChild(out);
    press(rB, 1); render();
  }

  /* =============== LESSONS 8 and 9: chain and cost =============== */
  function wCadeia(root) {
    var S = { banco: 0 };
    var pe = slider('pedidos pods (30/s each)', 1, 20, 1, 3, 'pods');
    var pa = slider('pagamentos pods (20/s each)', 1, 20, 1, 2, 'pods');
    var es = slider('estoque pods (500/s each)', 1, 6, 1, 2, 'pods');
    var de = slider('Demand', 1, 400, 1, 200, 'orders/s');
    var ra = slider('Target ρ', 50, 90, 5, 70, '%');
    var pt = slider('entregas partitions (40/s each)', 3, 12, 1, 3, 'partitions');
    var bB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var d = +de.input.value, r = +ra.input.value / 100, p = +pt.input.value;
      var elos = [
        { n: 'pedidos', pods: +pe.input.value, un: 30 },
        { n: 'pagamentos', pods: +pa.input.value, un: 20 },
        { n: 'estoque', pods: +es.input.value, un: 500 }
      ];
      elos.forEach(function (e) { e.cap = e.pods * e.un; });
      elos.push({ n: 'DB', pods: S.banco ? 4 : 3, cap: S.banco ? 750 : 250, un: 0 });
      var min = elos.reduce(function (a, e) { return e.cap < a.cap ? e : a; }, elos[0]);
      var rows = elos.map(function (e) {
        var u = d / e.cap, need = e.un ? Math.max(e.n === 'estoque' ? 2 : 1, Math.ceil(d / (r * e.un))) : null;
        return { cls: e === min ? 'cp-cur' : '', cells: [{ text: e.n + ' (' + e.pods + (e.n === 'DB' ? ' shards' : '') + ')' + (e === min ? ' ←' : '') },
          { text: fmt(e.cap, 0) + '/s' }, { text: fmt(u * 100, 0) + '%', cls: u > r ? 'cp-bad' : '' },
          { text: need == null ? '—' : String(need) }] };
      });
      var hot = S.banco ? 0.4 * d / 300 : 0.6 * d / 150, norm = S.banco ? 0.6 * d / 3 / 150 : 0.2 * d / 150;
      var sust = r * min.cap, cabe = d <= sust;
      var cap = p * 40, lag = Math.max(0, d - cap) * 14400, drain = cap > 5 && lag ? lag / (cap - 5) : 0;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Systemic capacity (min.)', fmt(min.cap, 0) + '/s', d > min.cap),
        fact('Bottleneck', min.n),
        fact('Sustainable (target ρ × min.)', fmt(sust, 0) + '/s', !cabe),
        fact('Demand takes', fmt(d / min.cap * 100, 0) + '% of the minimum', !cabe)
      ]));
      out.appendChild(table(['Link (pods)', 'Capac.', 'Usage', 'Pods at target ρ'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact(S.banco ? 'mkt-01 shard (40%, capacity 300)' : 'Hot shard (60% on shard-2, capacity 150)', fmt(hot * 100, 1) + '%', hot > 0.8),
        fact('Normal shards', fmt(norm * 100, 1) + '%')
      ]));
      out.appendChild(verdict(!cabe, cabe ? 'The chain fits the demand.' : 'The chain does not fit.',
        cabe ? 'The minimum is ' + fmt(min.cap, 0) + '/s and the sustainable ' + fmt(sust, 0) + '/s. Scaling another link does not change the output: the bottleneck is the minimum, not the most expensive one.'
          : 'The ' + min.n + ' link limits the chain at ' + fmt(min.cap, 0) + '/s. Fix that one and the next appears.'));
      out.appendChild(sub('The asynchronous link: entregas, per event'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Consumption (' + p + ' × 40/s)', fmt(cap, 0) + ' events/s'),
        fact('Utilization', fmt(d / cap * 100, 1) + '%', d > cap),
        fact('Lag in 4 h of event', fmt(lag, 0) + ' events', lag > 0),
        fact('Time to drain (peak → 5/s)', lag ? fmtH(drain) : '—')
      ]));
      out.appendChild(note('Today: 3 · 2 · 2 and 3 shards = 40/s; 2 → 15 pagamentos pods = 90/s; 3 → 10 pedidos = 250/s (DB); dedicated 2× shard = 300/s. Changing the number of partitions changes murmur2 mod N (3 → 6 moves ~50% of the keys).'));
    }
    function pickB(i) { S.banco = i; press(bB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pe.wrap, pa.wrap, es.wrap]));
    root.appendChild(chipRow('DB', ['3 shards (mkt-01 on shard-2)', '4 shards (dedicated 2× for mkt-01)'], bB, pickB));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [de.wrap, ra.wrap, pt.wrap]));
    [pe, pa, es, de, ra, pt].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(out);
    pickB(0);
  }

  function wCusto(root) {
    var cat = slider('Catalog pods', 6, 30, 1, 14, 'pods');
    var pe = slider('pedidos pods', 1, 20, 1, 10, 'pods');
    var pa = slider('pagamentos pods', 1, 20, 1, 15, 'pods');
    var es = slider('estoque pods', 1, 6, 1, 2, 'pods');
    var hr = slider('Peak hours', 1, 12, 1, 4, 'h');
    var cB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var c = +cat.input.value, v = c + +pe.input.value + +pa.input.value + +es.input.value, h = +hr.input.value;
      var fixa = 24 * v, el_ = h * v + (24 - h) * 9, em1 = c * 1000 / 7.5, em2 = c * 1000 / 6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('vCPU in the 2027 plan', fmt(v, 0) + ' (+' + fmt(v - 17, 0) + ' over BF 2026)'),
        fact('BF 2026 · ordinary day', '17 vCPU · 9 vCPU'),
        fact('Replica-hours: fixed fleet', fmt(fixa, 0)),
        fact('Replica-hours: elastic', fmt(el_, 0) + ' (' + fmt(el_ / fixa * 100, 0) + '% of fixed)')
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Sustainable catalog (ρ 70%)', fmt(c * 70, 0) + ' req/s'),
        fact('Emergency (7.5 ms degradation)', fmt(em1, 0) + ' req/s'),
        fact('Emergency (6 ms degradation)', fmt(em2, 0) + ' req/s')
      ]));
      out.appendChild(verdict(false, 'The plan.',
        'Pre-scale at 19:50: the HPA reacts in ~60 s and the 20:00 newsletter is known. The emergency is slack the plan counts but does not use: degrading is the last resort.'));
      out.appendChild(note('1 replica = 1 vCPU. Ordinary day: 2 + 3 + 2 + 2 = 9. Elastic: h × peak vCPU + (24 − h) × 9 (4 × 41 + 20 × 9 = 344, against 984 for the fixed fleet).'));
    }
    root.appendChild(chipRow('Catalog', ['14 pods (no search)', '19 pods (5% search)'], cB, function (i) { cat.set(i ? 19 : 14); press(cB, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cat.wrap, pe.wrap, pa.wrap, es.wrap, hr.wrap]));
    [cat, pe, pa, es, hr].forEach(function (x) { x.input.addEventListener('input', function () { press(cB, +cat.input.value === 14 ? 0 : +cat.input.value === 19 ? 1 : -1); render(); }); });
    root.appendChild(out);
    press(cB, 0); render();
  }

  var REG = { fila: wFila, little: wLittle, joelho: wJoelho, mix: wMix, perfis: wPerfis, projecao: wProjecao, cadeia: wCadeia, custo: wCusto };
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
