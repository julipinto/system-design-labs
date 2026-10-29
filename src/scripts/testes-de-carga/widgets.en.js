/* SDLabs · Testes de Carga e Estresse: widgets em JS puro
   (perfis no tempo, aberto × fechado, VUs e Little, leitor de resultado, jornada e mix, pré-teste, rampa × degrau) [English copy].
   Usam os números do brief, medidos com o k6 v2.3.0 contra o simulador do checkout (20–21/10/2026):
   metas p95 ≤ 800 ms e erros ≤ 0,1%; "hoje" quebra em 36/s (meta) e ~42/s (erros); plano ~250/s; plano 2 ~260/s (meta) e ~300/s (erros).
   Onde o widget interpola entre pontos medidos (modelo fechado, rampa), a nota do widget diz que é aproximação. */
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
  function fmtMs(ms) { return ms >= 1000 ? fmt(ms / 1000, 2) + ' s' : fmt(ms, 0) + ' ms'; }
  function fmtDur(min) {
    var h = Math.floor(min / 60), m = Math.round(min - h * 60);
    return h ? h + ' h ' + (m ? m + ' min' : '') : m + ' min';
  }
  function lerp(rows, x, i) {
    if (x <= rows[0][0]) return rows[0][i];
    for (var k = 1; k < rows.length; k++) {
      if (x <= rows[k][0]) {
        var a = rows[k - 1], b = rows[k], t = (x - a[0]) / (b[0] - a[0]);
        return a[i] + (b[i] - a[i]) * t;
      }
    }
    return rows[rows.length - 1][i];
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
    var id = 'tc-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : fmt(+inp.value, 2)) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return {
      input: inp,
      set: function (v, lo, hi) {
        if (lo != null) inp.min = String(lo);
        if (hi != null) inp.max = String(hi);
        inp.value = String(v); sync();
      },
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp])
    };
  }
  function numField(label, min, max, step, value, unit) {
    var id = 'tc-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: value == null ? '' : String(value), inputmode: 'decimal', class: 'tc-num' });
    return {
      input: inp,
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp])
    };
  }
  function fact(label, value, kind) {
    return el('div', { class: 'sr-fact' + (kind === 'bad' ? ' tc-badfact' : kind === 'ok' ? ' tc-okfact' : '') }, [el('small', { text: label }), el('b', { text: value })]);
  }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table tc-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }

  /* =============== AULA 2: os cinco perfis no tempo =============== */
  function wTipos(root) {
    var P = [
      { id: 'smoke', name: 'Smoke', taxa: [2, 1, 20, 1, 'orders/s'], dur: [30, 10, 120, 5, 's'], q: 'Does the checkout work at minimal load?', loja: '2 orders/s × 30 s: 61 requests, p95 156 ms', ex: 'constant-arrival-rate',
        pts: function (r, d) { return [[0, r], [d, r]]; } },
      { id: 'media', name: 'Average load', taxa: [30, 1, 200, 1, 'orders/s'], dur: [120, 30, 600, 10, 's'], q: 'Does it hold the target at normal load?', loja: '30 orders/s × 2 min: p95 381 ms, 0% errors', ex: 'constant-arrival-rate',
        pts: function (r, d) { return [[0, r], [d, r]]; } },
      { id: 'estresse', name: 'Stress', taxa: [300, 60, 600, 10, 'orders/s at the top'], dur: [45, 10, 120, 5, 's per level'], q: 'What degrades first and how does it recover?', loja: 'plan 2, 100 → 300/s: target holds up to 250/s; 300/s fails', ex: 'ramping-arrival-rate',
        pts: function (p, d) {
          var a = p / 3, b = p * 2 / 3, c = p * 5 / 6, t = 30, o = [[0, a], [t, a]];
          [[b, 20], [c, 20], [p, 20]].forEach(function (s) { t += s[1]; o.push([t, s[0]]); t += d; o.push([t, s[0]]); });
          t += 20; o.push([t, a]); t += 60; o.push([t, a]); return o;
        } },
      { id: 'spike', name: 'Spike', taxa: [60, 10, 200, 5, 'orders/s at the top'], dur: [60, 10, 180, 5, 's at the top'], q: 'Does it survive the newsletter burst?', loja: '5 → 60/s in 10 s: 47–65% errors at the top', ex: 'ramping-arrival-rate',
        pts: function (p, d) { return [[0, 5], [30, 5], [40, p], [40 + d, p], [50 + d, 5], [140 + d, 5]]; } },
      { id: 'breakpoint', name: 'Breakpoint', taxa: [60, 10, 400, 5, 'orders/s at the end'], dur: [180, 60, 600, 10, 's of ramp'], q: 'Where does it break?', loja: '1 → 60/s ("today"): target at 35–39/s, errors at ~42/s', ex: 'ramping-arrival-rate + abortOnFail',
        pts: function (p, d) { return [[0, 1], [d, p]]; } }
    ];
    var btns = [], S = { i: 0 };
    var taxa = slider('Rate', 1, 20, 1, 2, '');
    var dur = slider('Duration', 10, 120, 5, 30, '');
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function setRanges() {
      var p = P[S.i], t = p.taxa, d = p.dur;
      taxa.set(t[0], t[1], t[2]); taxa.input.step = String(t[3]);
      dur.set(d[0], d[1], d[2]); dur.input.step = String(d[3]);
      taxa.wrap.querySelector('label').firstChild.textContent = p.id === 'estresse' || p.id === 'spike' ? 'Top rate' : p.id === 'breakpoint' ? 'Final rate' : 'Rate';
      dur.wrap.querySelector('label').firstChild.textContent = p.id === 'estresse' ? 'Duration of each level' : p.id === 'spike' ? 'Time at the top' : p.id === 'breakpoint' ? 'Ramp duration' : 'Duration';
      // o texto do output é regerado pelo input; força a unidade certa
      taxa.wrap.querySelector('output').textContent = fmt(t[0], 0) + ' /s';
      dur.wrap.querySelector('output').textContent = fmt(d[0], 0) + ' s';
    }
    function render() {
      var p = P[S.i], r = +taxa.input.value, d = +dur.input.value;
      taxa.wrap.querySelector('output').textContent = fmt(r, 0) + ' /s';
      dur.wrap.querySelector('output').textContent = fmt(d, 0) + ' s';
      var pts = p.pts(r, d), T = pts[pts.length - 1][0], M = 0, area = 0, i;
      for (i = 0; i < pts.length; i++) M = Math.max(M, pts[i][1]);
      for (i = 1; i < pts.length; i++) area += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2;
      var W = 600, H = 200, X = function (t) { return 8 + t / T * (W - 16); }, Y = function (v) { return H - 8 - v / M * (H - 24); };
      var d1 = pts.map(function (q, k) { return (k ? 'L' : 'M') + X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1); }).join(' ');
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('class', 'tc-prof'); svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', p.name + ' profile: up to ' + fmt(M, 0) + ' orders per second in ' + fmt(T, 0) + ' seconds');
      function path(cls, dd) { var q = document.createElementNS(svgNS, 'path'); q.setAttribute('class', cls); q.setAttribute('d', dd); svg.appendChild(q); }
      path('ar', d1 + ' L' + X(T).toFixed(1) + ' ' + (H - 8) + ' L' + X(0).toFixed(1) + ' ' + (H - 8) + ' Z');
      path('ax', 'M8 ' + (H - 8) + ' L' + (W - 8) + ' ' + (H - 8));
      path('ln', d1);
      clear(out);
      out.appendChild(svg);
      out.appendChild(el('div', { class: 'tc-mark' }, [el('span', { text: '0 s' }), el('span', { text: 'peak ' + fmt(M, 0) + '/s' }), el('span', { text: 'end ' + fmt(T, 0) + ' s' })]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Requests (area)', fmt(Math.round(area), 0)),
        fact('Total duration', T >= 120 ? fmt(T / 60, 1) + ' min' : fmt(T, 0) + ' s'),
        fact('k6 executor', p.ex)
      ]));
      out.appendChild(verdict(false, p.name + ': ' + p.q, 'In the store: ' + p.loja + '.'));
      out.appendChild(note('The defaults reproduce checkout.js (smoke 61, average 3,601 and stress 59,567 requests measured; the area gives 60, 3,600 and ~59,750).'));
    }
    function pick(i) { S.i = i; press(btns, i); setRanges(); render(); }
    root.appendChild(chipRow('Test type', P.map(function (p) { return p.name; }), btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, dur.wrap]));
    taxa.input.addEventListener('input', render); dur.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 2: aberto × fechado =============== */
  var ABERTO = [ /* oferecida/s, concluídos/s, p95 ms, erros % (janelas do breakpoint "hoje"; o ponto 54/s é o do texto: 52%) */
    [0, 0, 200, 0], [22.3, 22.5, 255, 0], [25.6, 25.2, 364, 0], [32.1, 32.8, 357, 0], [35.4, 34.9, 345, 0], [38.7, 36.3, 932, 0], [42, 37.2, 2001, 6.8],
    [45.2, 40.6, 2000, 6.5], [48.5, 36.7, 2001, 22.6], [51.8, 29.1, 2001, 42], [54, 26.4, 2001, 52], [55.1, 25.9, 2001, 52.2], [58.4, 25.5, 2001, 55.4], [200, 20, 2001, 90]
  ];
  function wModelo(root) {
    var cap = slider('System capacity', 20, 80, 1, 40, '/s');
    var vus = slider('VUs (closed model)', 1, 200, 1, 20, 'VUs');
    var rate = slider('Rate (open model)', 1, 160, 1, 54, '/s');
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function closed(N, C) {
      var s = C / 40;
      if (C === 40 && N === 20) return { x: 38.1, avg: 520, p95: 1070, err: 0 };
      if (C === 40 && N === 60) return { x: 41.1, avg: 1430, p95: 2000, err: 8.35 };
      var x = 1.03 * C * (1 - Math.exp(-N / (7.5 * s)));
      var avg = Math.min(2000, N / x * 1000);
      var err = Math.max(0, Math.min(60, (avg - 550) / 880 * 8.35));
      return { x: x, avg: avg, p95: Math.min(2000, 2.06 * avg), err: err };
    }
    function open(L, C) {
      var s = C / 40, k = L / s;
      return { x: lerp(ABERTO, k, 1) * s, p95: lerp(ABERTO, k, 2), err: lerp(ABERTO, k, 3) };
    }
    function render() {
      var C = +cap.input.value, N = +vus.input.value, L = +rate.input.value;
      var f = closed(N, C), o = open(L, C);
      clear(out);
      out.appendChild(el('div', { class: 'tc-two' }, [
        el('div', null, [el('h4', { text: 'Closed · ' + N + ' VUs' }), el('div', { class: 'sr-facts' }, [
          fact('Throughput', fmt(f.x, 1) + '/s'),
          fact('p95', fmtMs(f.p95), f.p95 > 800 ? 'bad' : 'ok'),
          fact('Errors', fmt(f.err, 2) + '%', f.err > 0.1 ? 'bad' : 'ok')])]),
        el('div', null, [el('h4', { text: 'Open · ' + L + ' orders/s' }), el('div', { class: 'sr-facts' }, [
          fact('Completed', fmt(o.x, 1) + '/s'),
          fact('p95', fmtMs(o.p95), o.p95 > 800 ? 'bad' : 'ok'),
          fact('Errors', fmt(o.err, 1) + '%', o.err > 0.1 ? 'bad' : 'ok')])])
      ]));
      var hide = f.err <= 0.1 && o.err > 0.1;
      out.appendChild(verdict(hide,
        hide ? 'The closed model hides the break.' : (f.err > 0.1 && o.err > 0.1 ? 'Both show errors.' : 'Neither one broke.'),
        hide ? 'The closed generator stays at ' + fmt(f.x, 1) + '/s and ' + fmt(f.err, 1) + '% errors because it waits for each response (Little: ' + N + ' = ' + fmt(f.x, 1) + ' × ' + fmt(f.avg / 1000, 2) + '). The open rate of ' + L + '/s does not wait, and the ' + C + '/s system answers with ' + fmt(o.err, 1) + '% errors.'
          : 'With ' + N + ' VUs the system serves ' + fmt(f.x, 1) + '/s; with ' + L + '/s open it completes ' + fmt(o.x, 1) + '/s. Raise the rate above the capacity to see the open model break.'));
      out.appendChild(note('Measured with a capacity of 40/s: 20 VUs → 38.1/s, average 520 ms, p95 1.07 s, 0% errors; 60 VUs → 41.1/s, p95 2 s, 8.35%; open at 54/s → 52%. Between these points and with another capacity, the widget approximates (the open model interpolates the breakpoint windows; the closed one uses Little).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cap.wrap, vus.wrap, rate.wrap]));
    [cap, vus, rate].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 8: VUs, taxa e pausa (Little) =============== */
  function wLittle(root) {
    var taxa = slider('Rate', 1, 400, 1, 200, '/s');
    var resp = slider('Response time', 50, 3000, 50, 400, '', function (v) { return fmt(v, 0) + ' ms'; });
    var pausa = slider('Pause (thinking)', 0, 10, 0.5, 3, '', function (v) { return fmt(v, 1) + ' s'; });
    var usu = numField('Users the report cites', 1, 100000, 1, 800, 'users');
    var rep = numField('TPS the report cites', 1, 100000, 1, 600, '/s');
    var btns = [];
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function render() {
      var r = +taxa.input.value, R = +resp.input.value / 1000, z = +pausa.input.value;
      var V = r * (R + z), ciclo = R + z;
      var u = +usu.input.value || 0, t = +rep.input.value || 1, c = u / t;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('User cycle', fmt(ciclo, 2) + ' s'),
        fact('VUs = rate × cycle', fmt(V, 0) + ' VUs'),
        fact('Model', 'open: fixed rate, VUs vary')
      ]));
      out.appendChild(verdict(false, fmt(r, 0) + ' orders/s need ' + fmt(V, 0) + ' VUs.',
        '(' + fmt(R, 2) + ' s of response + ' + fmt(z, 1) + ' s of pause) × ' + fmt(r, 0) + ' = ' + fmt(V, 0) + '. In the open model k6 reserves VUs (preAllocatedVUs, maxVUs) and uses as many as the rate asks for.'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Author\'s report', fmt(u, 0) + ' users ÷ ' + fmt(t, 0) + ' TPS'),
        fact('Implied cycle', fmt(c, 2) + ' s')
      ]));
      out.appendChild(note('With 800 users and 600 TPS the cycle is 800 ÷ 600 = 1.33 s: the report does not say how much of it is response and how much is pause, so users do not convert to rate without that information.'));
    }
    function pick(i) {
      press(btns, i);
      if (i === 0) { taxa.set(200); resp.set(400); pausa.set(3); usu.input.value = '800'; rep.input.value = '600'; }
      else { taxa.set(600); resp.set(350); pausa.set(1); usu.input.value = '800'; rep.input.value = '600'; }
      render();
    }
    root.appendChild(chipRow('Example', ['Plan: 200/s, 0.4 s, 3 s pause', 'README: 600 TPS, 800 users'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, resp.wrap, pausa.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [usu.wrap, rep.wrap]));
    [taxa, resp, pausa].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    [usu, rep].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 9: leitor de resultado =============== */
  var META_P95 = 800, META_ERR = 0.1;
  var JANELAS = {
    hoje: { nome: '"Today" (1 → 60/s)', cols: ['offered/s', 'completed/s', 'p95', 'errors'],
      rows: [[25.6, 25.2, 364, 0], [32.1, 32.8, 357, 0], [35.4, 34.9, 345, 0], [38.7, 36.3, 932, 0], [42, 37.2, 2001, 6.8], [45.2, 40.6, 2000, 6.5],
        [48.5, 36.7, 2001, 22.6], [51.8, 29.1, 2001, 42], [55.1, 25.9, 2001, 52.2], [58.4, 25.5, 2001, 55.4]],
      colapso: null, nota: 'The ramp locates: the 2 min step confirmed 36/s (p95 of 798 ms).' },
    plano: { nome: 'Plan (1 → 360/s)', cols: ['offered/s', 'completed/s', 'p95', 'errors'],
      rows: [[160, null, 284, 0], [188, null, 388, 0], [203, null, 444, 0], [233, null, 491, 0], [248, null, 763, 0], [263, null, 928, 0], [278, null, 1576, 0.3],
        [293, null, 1997, 4.8], [308, null, null, 11.4], [353, 195, null, 40.9]],
      colapso: 'The maximum goodput was ~271/s and dropped to 195/s with 353 offered.', nota: 'The cause is the hot shard: 60% × 250 = 150/s, the shard\'s ceiling.' },
    plano2: { nome: 'Plan 2 (dedicated shard)', cols: ['offered/s', 'completed/s', 'p95', 'errors'],
      rows: [[188, null, 338, 0], [203, null, 394, 0], [218, null, 421, 0], [233, null, 583, 0], [263, null, 728, 0], [278, null, 1003, 0], [293, null, 1155, 0],
        [308, null, 1573, 0.6], [323, null, null, 3.1], [338, null, null, 10.6], [353, null, null, 32.2]],
      colapso: 'The maximum goodput was ~292/s; after that it drops.', nota: 'The target crosses at ~270/s on the ramp and at ~260/s on the step; errors start at ~300/s (10 pods × 30/s and 15 × 20/s together).' }
  };
  var RES = [
    { nome: 'Smoke 2/s', v: [81.9, 155.6, 213.7, 0, 2] },
    { nome: 'Average 30/s', v: [157.5, 381.3, 498.6, 0, 30] },
    { nome: 'Plan average 125/s', v: [109.9, 247.2, 357.4, 0, 125] },
    { nome: 'Step 36/s (today)', v: [333.5, 798.1, 979.7, 0, 36] },
    { nome: 'Step 265/s (plan 2)', v: [363, 819, 1060, 0, 265] },
    { nome: 'Stress plan 2', v: [419, 1480, 1920, 0.54, 300] },
    { nome: 'README: spike', v: [400, 700, null, 0.1, null], mediaMeta: 400 }
  ];
  function wLeitor(root) {
    var avg = numField('Average', 0, 100000, 0.1, 157.5, 'ms');
    var p95 = numField('p95', 0, 100000, 0.1, 381.3, 'ms');
    var p99 = numField('p99', 0, 100000, 0.1, 498.6, 'ms');
    var err = numField('Errors', 0, 100, 0.01, 0, '%');
    var taxa = numField('Rate', 0, 100000, 1, 30, '/s');
    var mm = numField('Average target (optional, strict)', 0, 100000, 1, '', 'ms');
    var rb = [], jb = [], S = { j: 0 };
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    var jout = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function renderRes() {
      var a = parseFloat(avg.input.value), b = parseFloat(p95.input.value), e = parseFloat(err.input.value), m = parseFloat(mm.input.value);
      clear(out);
      if (isNaN(b) || isNaN(e)) { out.appendChild(note('Fill in the p95 and the errors.')); return; }
      var okP = b <= META_P95, okE = e <= META_ERR, okM = isNaN(m) || isNaN(a) ? null : a < m;
      var pass = okP && okE && okM !== false;
      out.appendChild(table(['Target', 'Result', 'Passed?'], [
        { cells: [{ text: 'p95 ≤ 800 ms' }, { text: fmtMs(b) }, { text: okP ? 'passed' : 'failed', cls: okP ? 'tc-ok' : 'tc-bad' }] },
        { cells: [{ text: 'errors ≤ 0.1%' }, { text: fmt(e, 2) + '%' }, { text: okE ? 'passed' : 'failed', cls: okE ? 'tc-ok' : 'tc-bad' }] }
      ].concat(okM === null ? [] : [{ cells: [{ text: 'average < ' + fmt(m, 0) + ' ms' }, { text: fmtMs(a) }, { text: okM ? 'passed' : 'failed', cls: okM ? 'tc-ok' : 'tc-bad' }] }])));
      var p99v = parseFloat(p99.input.value);
      out.appendChild(verdict(!pass, pass ? 'Passed.' : 'Failed.',
        pass ? 'Both targets are met' + (isNaN(p99v) ? '.' : ', and the tail (p99 ' + fmtMs(p99v) + ') is ' + fmt(p99v / b, 1) + '× the p95: read both.')
          : (okM === false ? 'The average of ' + fmtMs(a) + ' is not less than ' + fmt(m, 0) + ' ms: "almost" does not pass. ' : '') + (!okP ? 'The p95 of ' + fmtMs(b) + ' is above 800 ms. ' : '') + (!okE ? 'The errors of ' + fmt(e, 2) + '% are above 0.1%.' : '')));
    }
    function loadRes(i) {
      press(rb, i);
      var r = RES[i], v = r.v;
      avg.input.value = v[0]; p95.input.value = v[1]; p99.input.value = v[2] == null ? '' : v[2]; err.input.value = v[3]; taxa.input.value = v[4] == null ? '' : v[4];
      mm.input.value = r.mediaMeta == null ? '' : r.mediaMeta;
      renderRes();
    }
    function renderJ() {
      var J = JANELAS[['hoje', 'plano', 'plano2'][S.j]];
      var rows = J.rows, mi = -1, ei = -1, ci = -1, gi = -1, gmax = -1, i;
      for (i = 0; i < rows.length; i++) {
        if (mi < 0 && rows[i][2] != null && rows[i][2] > META_P95) mi = i;
        if (ei < 0 && rows[i][3] > META_ERR) ei = i;
        if (rows[i][1] != null && rows[i][1] > gmax) { gmax = rows[i][1]; gi = i; }
      }
      if (S.j === 0 && gi >= 0 && gi + 1 < rows.length) ci = gi + 1;
      clear(jout);
      jout.appendChild(table(['Offered/s', 'Completed/s', 'p95', 'Errors'], rows.map(function (r, k) {
        var tag = [];
        if (k === mi) tag.push('target');
        if (k === ei) tag.push('errors');
        if (k === ci) tag.push('collapse');
        return { cls: 'tc-pt' + (tag.length ? ' tc-cur' : ''), cells: [{ text: fmt(r[0], 1) + (tag.length ? ' · ' + tag.join(' + ') : '') }, { text: r[1] == null ? '—' : fmt(r[1], 1) }, { text: r[2] == null ? '—' : fmtMs(r[2]), cls: r[2] != null && r[2] > META_P95 ? 'tc-bad' : '' },
          { text: fmt(r[3], 1) + '%', cls: r[3] > META_ERR ? 'tc-bad' : '' }] };
      })));
      jout.appendChild(el('div', { class: 'sr-facts' }, [
        fact('1. Target (p95 > 800 ms)', mi < 0 ? '—' : 'at ' + fmt(rows[mi][0], 1) + '/s', mi < 0 ? '' : 'bad'),
        fact('2. Errors (> 0.1%)', ei < 0 ? '—' : 'at ' + fmt(rows[ei][0], 1) + '/s', ei < 0 ? '' : 'bad'),
        fact('3. Collapse (goodput drops)', ci >= 0 ? 'at ' + fmt(rows[ci][0], 1) + '/s' : 'see note', ci >= 0 ? 'bad' : '')
      ]));
      jout.appendChild(note((ci >= 0 ? 'Collapse: the maximum goodput was ' + fmt(gmax, 1) + '/s at ' + fmt(rows[gi][0], 1) + ' offered and it drops after that (to ' + fmt(rows[rows.length - 1][1], 1) + '/s). ' : J.colapso + ' ') + J.nota));
    }
    function pickJ(i) { S.j = i; press(jb, i); renderJ(); }
    root.appendChild(chipRow('Example result', RES.map(function (r) { return r.nome; }), rb, loadRes));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [avg.wrap, p95.wrap, p99.wrap, err.wrap, taxa.wrap, mm.wrap]));
    [avg, p95, p99, err, taxa, mm].forEach(function (f) { f.input.addEventListener('input', function () { press(rb, -1); renderRes(); }); });
    root.appendChild(out);
    root.appendChild(note('The windows below are the ones from k6\'s CSV recomputed in 10 s. Where the brief only records the p95 or the goodput at some points, the table shows "—".'));
    root.appendChild(chipRow('Table of windows', ['"Today"', 'Plan', 'Plan 2'], jb, pickJ));
    root.appendChild(jout);
    loadRes(1); pickJ(0);
  }

  /* =============== AULA 8: jornada e mix =============== */
  function wJornada(root) {
    var wc = slider('Card', 0, 100, 1, 60, '%');
    var wp = slider('Pix', 0, 100, 1, 35, '%');
    var we = slider('Refund', 0, 100, 1, 5, '%');
    var ped = slider('Orders per second', 1, 400, 1, 200, '/s');
    var busca = slider('Catalog search', 0, 20, 1, 0, '%');
    var dem = slider('Catalog demand', 100, 2000, 50, 950, 'req/s');
    var cp = numField('Page cost', 1, 500, 1, 10, 'ms');
    var cb = numField('Search cost', 1, 500, 1, 80, 'ms');
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function render() {
      var c = +wc.input.value, p = +wp.input.value, e = +we.input.value, tot = c + p + e || 1, r = +ped.input.value;
      var b = +busca.input.value / 100, d = +dem.input.value, a = +cp.input.value || 10, bb = +cb.input.value || 80;
      var custo = (1 - b) * a + b * bb, cap = 1000 / custo, sus = cap * 0.7, rep = Math.ceil(d / sus - 1e-9);
      var base = Math.ceil(d / (1000 / a * 0.7) - 1e-9);
      clear(out);
      out.appendChild(el('h4', { class: 'deep-h', text: 'Checkout journey' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Card', fmt(r * c / tot, 0) + '/s (' + fmt(c / tot * 100, 0) + '%)'),
        fact('Pix', fmt(r * p / tot, 0) + '/s (' + fmt(p / tot * 100, 0) + '%)'),
        fact('Refund', fmt(r * e / tot, 0) + '/s (' + fmt(e / tot * 100, 0) + '%)')
      ]));
      out.appendChild(el('h4', { class: 'deep-h', text: 'Catalog: page vs. search' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Average cost', fmt(custo, 1) + ' ms'),
        fact('Capacity per replica', fmt(cap, 0) + ' req/s', b > 0 ? 'bad' : ''),
        fact('Replicas (ρ ≤ 70%)', String(rep), rep > base ? 'bad' : '')
      ]));
      out.appendChild(verdict(rep > base,
        rep > base ? 'With ' + fmt(b * 100, 0) + '% search, ' + rep + ' replicas and not ' + base + '.' : 'With no search in the mix, ' + base + ' replicas.',
        rep > base ? 'The average cost goes up from ' + fmt(a, 0) + ' to ' + fmt(custo, 1) + ' ms and the replica drops from ' + fmt(1000 / a, 0) + ' to ' + fmt(cap, 0) + ' req/s: ' + fmt(d, 0) + ' ÷ (' + fmt(cap, 0) + ' × 0.7) = ' + fmt(d / sus, 1) + ', rounded up to ' + rep + '. Testing only the cheap endpoint sizes ' + base + '.'
          : 'Cost of ' + fmt(a, 0) + ' ms: ' + fmt(1000 / a, 0) + ' req/s per replica, ' + fmt(d, 0) + ' ÷ (' + fmt(1000 / a, 0) + ' × 0.7) = ' + fmt(d / sus, 1) + '. Raise the search to 5% and watch the catalog go from 14 to 19.'));
      out.appendChild(note('Module 23 defaults: page 10 ms, search 80 ms, 950 req/s, ρ ≤ 70%: 0% search = 100 req/s and 14 replicas; 5% = 74 req/s and 19. The journey mix (60 · 35 · 5) is a declared example and pagamentos costs 50 ms per order.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [wc.wrap, wp.wrap, we.wrap, ped.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [busca.wrap, dem.wrap, cp.wrap, cb.wrap]));
    [wc, wp, we, ped, busca, dem, cp, cb].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: pré-teste e o elo =============== */
  function wPre(root) {
    var pods = slider('Pods of pedidos', 1, 10, 1, 3, 'pods');
    var cap = slider('Capacity per pod', 10, 60, 1, 30, '/s');
    var pag = slider('Pods of pagamentos', 2, 15, 1, 2, 'pods');
    var inf = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'pagamentos unlimited (100 pods)' });
    var shc = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: '4 regular shards' });
    var ded = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: '2× dedicated shard for mkt-01' });
    var S = { inf: false, sh4: false, ded: false };
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function measured(P, G, nsh) {
      if (S.inf && !S.ded && G >= 100 && P <= 3 && cap.input.value === '30') return { v: P === 1 ? 35 : P === 2 ? 62 : 88, t: 'pedidos pre-test (pagamentos unlimited): the target falls at ~' + (P === 1 ? 35 : P === 2 ? 62 : 88) + '/s' };
      if (!S.inf && P === 3 && G === 2 && nsh === 3 && !S.ded) return { v: 36, t: '"today": the target falls at 36/s (798 ms in steady state) and errors at ~42/s' };
      if (!S.inf && P === 10 && G === 15 && !S.ded && nsh === 3) return { v: 250, t: 'the plan: the target falls at ~250/s (mkt-01 hot shard: 60% × 250 = 150/s)' };
      if (!S.inf && P === 10 && G === 15 && S.ded && nsh === 3) return { v: 260, t: 'plan 2: the target falls at ~260/s (step) and errors at ~300/s' };
      return null;
    }
    function render() {
      var P = +pods.input.value, c = +cap.input.value, G = S.inf ? 100 : +pag.input.value, nsh = S.sh4 ? 4 : 3;
      var lp = P * c, lg = G * 20, le = 2 * 500;
      var hot, ls;
      if (S.ded) hot = Math.min(2 * 150 / 0.4, nsh * 150 / 0.6);
      else hot = 150 / (0.4 + 0.6 / nsh);
      ls = hot;
      var links = [['pedidos', lp, P + ' × ' + c + '/s'], ['pagamentos', lg, G + ' × 20/s'], ['estoque', le, '2 × 500/s'], ['shards', ls, S.ded ? '300/s + ' + nsh + ' × 150/s' : nsh + ' × 150/s']];
      var min = Infinity, who = 0, i;
      for (i = 0; i < links.length; i++) if (links[i][1] < min) { min = links[i][1]; who = i; }
      var m = measured(P, G, nsh);
      clear(out);
      out.appendChild(table(['Link', 'Math', 'Nominal capacity'], links.map(function (l, k) {
        return { cls: k === who ? 'tc-cur' : '', cells: [{ text: l[0] + (k === who ? ' (limits)' : '') }, { text: l[2] }, { text: fmt(l[1], 0) + '/s', cls: k === who ? 'tc-bad' : '' }] };
      })));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chain capacity', fmt(min, 0) + '/s'),
        fact('Limiting link', links[who][0], 'bad'),
        fact('Measured by k6', m ? '~' + m.v + '/s' : 'no measurement', m ? 'ok' : '')
      ]));
      out.appendChild(verdict(false, links[who][0] + ' is the link.',
        m ? 'This combination was run: ' + m.t + '. The nominal math gives ' + fmt(min, 0) + '/s.'
          : 'This combination was not run. The estimate is ~90% of nominal (' + fmt(min * 0.9, 0) + '/s), the distance at which the target fell on "today" (36 of 40) and on plan 2 (260 of 300).'));
      out.appendChild(note('Math: pedidos 30/s per pod (33 ms), pagamentos 20/s per pod (50 ms), estoque 500/s per pod, 150/s per shard. The hot shard takes 40% (mkt-01) plus 60% ÷ N drawn: 3 shards give 150 ÷ 0.6 = 250/s. The 2× dedicated one handles 300/s for the 40%: 750/s.'));
    }
    function toggle(b, key) { b.addEventListener('click', function () { S[key] = !S[key]; b.setAttribute('aria-pressed', S[key] ? 'true' : 'false'); if (key === 'inf') pag.input.disabled = S.inf; render(); }); }
    toggle(inf, 'inf'); toggle(shc, 'sh4'); toggle(ded, 'ded');
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pods.wrap, cap.wrap, pag.wrap]));
    root.appendChild(el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Dependencies' }, [inf, shc, ded]));
    [pods, cap, pag].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 7: rampa × degrau =============== */
  var TAU = 6.5; // s: atraso da fila para acusar a quebra, calibrado nas duas rampas medidas
  function wRampa(root) {
    var T = slider('Ramp duration', 1, 10, 0.5, 3, '', function (v) { return fmt(v, 1) + ' min'; });
    var top = slider('Final ramp rate', 10, 400, 1, 60, '/s');
    var meta = slider('Where the target falls in steady state', 5, 400, 1, 36, '/s');
    var uMin = slider('Users per minute (author\'s report)', 1, 100, 1, 10, '/min');
    var uTop = slider('Final users (author\'s report)', 1000, 20000, 500, 10000, '');
    var btns = [];
    var out = el('div', { class: 'tc-out', 'aria-live': 'polite' });
    function render() {
      var t = +T.input.value * 60, f = +top.input.value, m = +meta.input.value, um = +uMin.input.value, ut = +uTop.input.value;
      var slope = (f - 1) / t, det = m + slope * TAU, ot = (det - m) / m * 100;
      var alcanca = m <= f;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Ramp slope', fmt(slope, 2) + ' orders/s per s'),
        fact('The ramp reports the target at', alcanca ? '~' + fmt(det, 0) + '/s' : 'never gets there', alcanca ? 'bad' : ''),
        fact('Ramp optimism', alcanca ? '+' + fmt(ot, 1) + '%' : '—'),
        fact('The 2 min step confirms', fmt(m, 0) + '/s', 'ok')
      ]));
      out.appendChild(verdict(alcanca && ot > 3,
        alcanca ? 'The ramp locates, the step confirms.' : 'The ramp ends before the break.',
        alcanca ? 'The queue was still filling when the rate went past the ceiling: that is ~' + fmt(TAU, 1) + ' s of delay, or ' + fmt(slope * TAU, 1) + ' orders/s more on the ' + fmt(t / 60, 1) + ' min ramp. A slower ramp gets closer; a constant 2 min step gives the point with no optimism.'
          : 'Raise the final rate above ' + fmt(m, 0) + '/s so the ramp crosses the target.'));
      var min = ut / um, p37 = 3700 / um;
      out.appendChild(table(['Author\'s report ramp', 'Value'], [
        { cells: [{ text: fmt(ut, 0) + ' users at ' + um + '/min' }, { text: fmtDur(min) }] },
        { cells: [{ text: '3,700 users point' }, { text: fmtDur(p37) }] }
      ]));
      out.appendChild(note('Report default: 10,000 ÷ 10 = 1,000 min = 16 h 40 min, and the 3,700 users come at 6 h 10 min: the ramp is so slow that it measures steady state. The ' + fmt(TAU, 1) + ' s delay is an approximation calibrated on the two measured ramps ("today": 35–39 against 36; plan 2: ~270 against ~260).'));
    }
    function pick(i) {
      press(btns, i);
      if (i === 0) { T.set(3); top.set(60); meta.set(36); } else { T.set(4); top.set(360); meta.set(260); }
      render();
    }
    root.appendChild(chipRow('Measured', ['"Today": 3 min up to 60/s, target at 36', 'Plan 2: 4 min up to 360/s, target at 260'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [T.wrap, top.wrap, meta.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [uMin.wrap, uTop.wrap]));
    [T, top, meta].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    [uMin, uTop].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  var REG = { tipos: wTipos, modelo: wModelo, little: wLittle, leitor: wLeitor, jornada: wJornada, pre: wPre, rampa: wRampa };
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
