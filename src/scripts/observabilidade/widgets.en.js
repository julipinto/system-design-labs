/* SDLabs · Observabilidade e Monitoramento: widgets em JS puro
   (disponível × correto, histograma e percentis, cardinalidade, custo de log, cascata de spans, amostragem,
   quando o alerta dispara, orçamento de erro e burn rate, USE × RED × quatro sinais).
   Usam os números do brief: pedido 1063 (1.895 ms; estoque 1.640), histograma 400 · 975 · 992 · 992 · 1.000
   (p50 0,293 · p95 0,489 · p99 0,765 · p99,9 2,3125), cardinalidade 2.016 → 22.176 → 33,3 bilhões, log 2,81 · 25,5 · 255 GB/dia,
   trace 4,8 KB (12,4 GB × 124 MB/dia; 7,7%), alertas nunca · 60–75 s · 30 s · 51,84 s, orçamento 12.960 (43,2 min),
   20,8% · 4,97% · 0,06%, burn 14,4× · 6× · 1×, média 275 → 193 ms. Contas do c28.py (Python, 21/10/2026). Nada aqui é medição:
   nenhum Prometheus, OpenTelemetry ou Grafana foi rodado; as durações dos spans e os tamanhos por linha são exemplo. */
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
  function fmtBig(v) {
    if (v >= 1e9) return fmt(v / 1e9, 1) + ' billion';
    if (v >= 1e6) return fmt(v / 1e6, 1) + (v >= 2e6 ? ' million' : ' million');
    return fmt(v, 0);
  }
  function fmtDur(s) {
    if (s >= 3600) return fmt(s / 3600, 1) + ' h';
    if (s >= 120) return fmt(s / 60, 1) + ' min';
    return fmt(s, 1) + ' s';
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
    var id = 'ob-sl-' + (++uid);
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
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' ob-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function facts(list) { return el('div', { class: 'sr-facts' }, list); }
  /* tabela: head = títulos; rows = { cls, cells: [{ text, cls }] }; a primeira célula é o cabeçalho da linha */
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        if (typeof c === 'string') c = { text: c };
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table ob-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function bar(label, frac, text, bad) {
    var fill = el('div', { class: 'sr-fill' + (bad ? ' cap' : ' win') });
    fill.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [fill, el('span', { class: 'sr-lbl', text: text })])]);
  }
  function numField(label, value, step, onInput, unit) {
    var id = 'ob-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, value: String(value), step: String(step), min: '0', inputmode: 'decimal' });
    inp.addEventListener('input', onInput);
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, unit ? el('output', { text: unit }) : null]), inp]) };
  }
  function num(inp, dflt) {
    var v = parseFloat(String(inp.value).replace(',', '.'));
    return isFinite(v) ? v : dflt;
  }

  /* =============== AULA 1: disponível × correto =============== */
  function wDisponivel(root) {
    var TEMPOS = [
      { l: '30 s (synthetic probe)', s: 30 },
      { l: '5 min', s: 300 },
      { l: '15 min', s: 900 },
      { l: '60 min (only the business metric)', s: 3600 }
    ];
    var RECIFE = 1;   /* pedidos/s para Recife: 20% de 5/s (mix do módulo 22) */
    var FRETE = 15;   /* R$ a menos por pedido com o frete 0,00 */
    var S = { bug: 0, t: 3 };
    var bB = [], tB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function render() {
      var bug = S.bug === 1, sec = TEMPOS[S.t].s;
      var perdido = bug ? sec * RECIFE * FRETE : 0;
      clear(out);
      var rows = [
        { cells: [{ text: 'GET /healthcheck' }, { text: '200' }, { text: 'green', cls: 'ob-ok' }] },
        { cells: [{ text: 'Status of POST /pedidos responses' }, { text: '201' }, { text: 'green', cls: 'ob-ok' }] },
        { cells: [{ text: '5xx rate' }, { text: '0%' }, { text: 'green', cls: 'ob-ok' }] },
        { cells: [{ text: 'p95 latency' }, { text: '489 ms (same)' }, { text: 'green', cls: 'ob-ok' }] },
        { cells: [{ text: 'pedidos_frete_zero_total{cidade="recife"}' }, { text: bug ? 'rises 1 per second' : '0' }, bug ? { text: 'red', cls: 'ob-bad' } : { text: 'green', cls: 'ob-ok' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'Technical dashboard (the first four rows) × business dashboard (the last one)' }));
      out.appendChild(table(['Panel', 'Shows', 'State'], rows));
      out.appendChild(facts([
        fact('Recife orders per second', fmt(RECIFE, 0) + ' (20% of 5)'),
        fact('Shipping undercharged', bug ? 'R$ ' + fmt(FRETE, 2) + ' per order' : 'none', bug),
        fact('Loss in ' + fmtDur(sec), 'R$ ' + fmt(perdido, 0), bug)
      ]));
      out.appendChild(verdict(bug,
        bug ? 'Available and wrong.' : 'Available and correct.',
        bug ? 'The four technical panels stay green; only the business metric reports it. In ' + fmtDur(sec) + ' that is ' + fmt(sec, 0) + ' × ' + fmt(RECIFE, 0) + ' × R$ ' + fmt(FRETE, 0) + ' = R$ ' + fmt(perdido, 0) + '.'
          : '2.4.0 charges the right shipping: all panels, technical and business, are green. Turn on the 2.5.0 defect.'));
      out.appendChild(note('Math from module 22: 5 orders/s × 20% = 1 per second for Recife, R$ 15.00 less on each. 60 min = R$ 54,000; 30 s = R$ 450.'));
    }
    root.appendChild(chipRow('pedidos version', ['2.4.0 (right shipping)', '2.5.0 (shipping 0.00 in Recife)'], bB, function (i) { S.bug = i; press(bB, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'How long until someone notices' }));
    root.appendChild(chipRow('Time to notice', TEMPOS.map(function (t) { return t.l; }), tB, function (i) { S.t = i; press(tB, i); render(); }));
    root.appendChild(out);
    press(bB, 0); press(tB, S.t); render();
  }

  /* =============== AULA 3: histograma e percentis =============== */
  /* a janela de 1.000 requisições do 1063, valor a valor: contagens acumuladas 400 · 975 · 992 · 992 · 1.000 nos limites do módulo */
  var AMOSTRA = (function () {
    var a = [], i;
    for (i = 1; i <= 400; i++) a.push(0.1 + 0.15 * i / 400);
    for (i = 1; i <= 575; i++) a.push(0.25 + 0.25 * i / 575);
    for (i = 1; i <= 17; i++) a.push(0.5 + 0.3 * i / 17);
    [1.65, 1.7, 1.75, 1.8, 1.84, 1.87, 1.895, 1.9].forEach(function (v) { a.push(v); });
    a.sort(function (p, q) { return p - q; });
    return a;
  })();
  function acumulado(bounds) {
    return bounds.map(function (b) { var c = 0; for (var i = 0; i < AMOSTRA.length; i++) if (AMOSTRA[i] <= b + 1e-9) c++; return c; });
  }
  /* histogram_quantile do Prometheus: interpolação linear dentro do bucket */
  function quantil(q, bounds, counts) {
    var N = AMOSTRA.length, rank = q * N;
    for (var i = 0; i < bounds.length; i++) {
      if (counts[i] >= rank) {
        var lo = i ? bounds[i - 1] : 0, clo = i ? counts[i - 1] : 0;
        if (counts[i] === clo) return bounds[i];
        return lo + (bounds[i] - lo) * (rank - clo) / (counts[i] - clo);
      }
    }
    return bounds[bounds.length - 1];
  }
  function quantilReal(q) { return AMOSTRA[Math.ceil(q * AMOSTRA.length) - 1]; }

  function wHistograma(root) {
    var BASE = [0.05, 0.1, 0.25, 0.5, 0.8, 1, 2.5, 5];
    var PRESETS = [
      { l: 'The module ones', b: BASE },
      { l: 'With 2.0 in place of 2.5', b: [0.05, 0.1, 0.25, 0.5, 0.8, 1, 2, 5] },
      { l: 'No bucket near the SLO (0.8) or the fear (2.0)', b: [0.1, 0.25, 0.5, 1, 5] }
    ];
    var pB = [], fields = [], showAvg = false;
    var grid = el('div', { class: 'sr-ctrls ob-grid2' });
    BASE.forEach(function (v, i) {
      var f = numField('Limit ' + (i + 1) + ' (le, s)', v, 0.05, render);
      fields.push(f); grid.appendChild(f.wrap);
    });
    var avgBtn = el('button', { type: 'button', class: 'btn', text: 'Average the p99s' });
    avgBtn.addEventListener('click', function () { showAvg = !showAvg; render(); });
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function bounds() {
      var b = fields.map(function (f) { return num(f.input, 0); }).filter(function (v) { return v > 0; });
      b.sort(function (p, q) { return p - q; });
      return b.filter(function (v, i) { return i === 0 || v !== b[i - 1]; });
    }
    function render() {
      var b = bounds(), N = AMOSTRA.length;
      clear(out);
      if (!b.length) { out.appendChild(note('Fill in at least one limit greater than zero.')); return; }
      var c = acumulado(b);
      var rows = b.map(function (v, i) { return { cells: [{ text: fmt(v, 3) }, { text: fmt(c[i], 0) }] }; });
      rows.push({ cells: [{ text: '+Inf' }, { text: fmt(N, 0) }] });
      out.appendChild(table(['le (s)', 'requests up to there (cumulative)'], rows));
      var QS = [{ q: 0.5, n: 'p50' }, { q: 0.95, n: 'p95' }, { q: 0.99, n: 'p99' }, { q: 0.999, n: 'p99.9' }];
      var qrows = QS.map(function (x) {
        var e = quantil(x.q, b, c), r = quantilReal(x.q), err = Math.abs(e - r) / r;
        return { cells: [{ text: x.n }, { text: fmt(e, 4) + ' s' }, { text: fmt(r, 3) + ' s' }, { text: err < 0.02 ? 'matches' : 'off by ' + fmtPct(err, 0), cls: err < 0.02 ? '' : 'ob-bad' }] };
      });
      out.appendChild(table(['Percentile', 'Estimated from the buckets', 'Real value in the window', 'Difference'], qrows));
      var mean = AMOSTRA.reduce(function (s, v) { return s + v; }, 0) / N;
      var p99 = quantil(0.99, b, c), p999 = quantil(0.999, b, c), real999 = quantilReal(0.999);
      out.appendChild(facts([
        fact('Window average', fmt(mean, 3) + ' s'),
        fact('p99 × 0.8 s SLO', fmt(p99, 3) + ' s · ' + (p99 <= 0.8 ? 'within (green)' : 'outside'), p99 > 0.8),
        fact('Orders above 1 s', fmt(AMOSTRA.filter(function (v) { return v > 1; }).length, 0) + ' of ' + fmt(N, 0) + ' (0.8%)')
      ]));
      var big = Math.abs(p999 - real999) / real999 > 0.1;
      out.appendChild(verdict(big,
        big ? 'p99.9 is off because of the wide bucket.' : 'The buckets follow the tail.',
        big ? 'It estimates ' + fmt(p999, 4) + ' s for a real value of ' + fmt(real999, 3) + ' s: the bucket it falls in is wide, and the interpolation only knows the value is somewhere inside. Put a limit near what you fear (2.0).'
          : 'The estimated p99.9 (' + fmt(p999, 4) + ' s) is close to the real one (' + fmt(real999, 3) + ' s). The 8 slow orders move neither p95 nor p99, but p99.9 already sees them.'));
      if (showAvg) {
        out.appendChild(el('p', { class: 'sr-sub', text: 'The average of the per-replica p99s (module 14)' }));
        out.appendChild(facts([
          fact('4 replicas at 55 ms, 5 at 74 ms, catalogo-3 at 2,100 ms', '(4 × 55 + 5 × 74 + 2,100) ÷ 10 = 269 ms'),
          fact('True p99 (100 requests together)', '2,000 ms', true)
        ]));
        out.appendChild(note('Percentiles cannot be added or averaged: you sum the buckets of all replicas and compute again.'));
      }
      avgBtn.textContent = showAvg ? 'Hide the average of the p99s' : 'Average the p99s';
      avgBtn.setAttribute('aria-pressed', showAvg ? 'true' : 'false');
    }
    function pick(i) {
      press(pB, i);
      fields.forEach(function (f, j) { f.input.value = PRESETS[i].b[j] != null ? String(PRESETS[i].b[j]) : ''; });
      render();
    }
    root.appendChild(chipRow('Bucket set', PRESETS.map(function (p) { return p.l; }), pB, pick));
    root.appendChild(grid);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [avgBtn]));
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 3: cardinalidade =============== */
  function wCardinalidade(root) {
    var LABELS = [
      { n: 'servico', v: 7, on: true },
      { n: 'rota', v: 12, on: true },
      { n: 'status', v: 6, on: true },
      { n: 'celula', v: 4, on: true },
      { n: 'versao', v: 3, on: false },
      { n: 'cliente_id', v: 1500000, on: false }
    ];
    var S = { tipo: 1 };
    var lB = [], tB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function render() {
      var comb = 1, parts = [];
      LABELS.forEach(function (l) { if (l.on) { comb *= l.v; parts.push(fmt(l.v, 0)); } });
      var por = S.tipo ? 11 : 1, series = comb * por;
      clear(out);
      out.appendChild(facts([
        fact('Label combinations', parts.length ? parts.join(' × ') + ' = ' + fmtBig(comb) : '1'),
        fact(S.tipo ? 'Series (× 11 of the histogram)' : 'Series (× 1 of the counter)', fmtBig(series), series > 1e6),
        fact('With cliente_id (1.5 million)', LABELS[5].on ? 'already included' : fmtBig(series * 1500000))
      ]));
      var bad = series > 1e6, mid = series > 1e5 && !bad;
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Series on a logarithmic scale' }, [
        bar('series (log scale)', Math.log10(Math.max(series, 1)) / 11, fmtBig(series), bad)
      ]));
      out.appendChild(verdict(bad || mid,
        bad ? 'Past reasonable.' : (mid ? 'Heavy.' : 'Fits in a Prometheus.'),
        bad ? 'Each label combination is a stored and queried series. cliente_id, pedido_id and trace_id have almost-unique values: their place is the log and the trace, not the metric.'
          : (mid ? 'It is close to what a metrics server handles without tuning; one more label multiplies it again.'
            : 'The store\'s four dimensions (servico, rota, status, celula) give 2,016 combinations and 22,176 series in the histogram.')));
      out.appendChild(note('A histogram generates 11 series per combination: 8 le, the +Inf, the _sum and the _count. The counter generates 1. Tap the labels to turn them on or off.'));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Metric labels (possible values of each)' }));
    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Labels' });
    LABELS.forEach(function (l, i) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': l.on ? 'true' : 'false', text: l.n + ' (' + fmtBig(l.v) + ')' });
      b.addEventListener('click', function () { l.on = !l.on; b.setAttribute('aria-pressed', l.on ? 'true' : 'false'); render(); });
      lB.push(b); row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Metric type' }));
    root.appendChild(chipRow('Type', ['Counter (1 series)', 'Histogram (11 series)'], tB, function (i) { S.tipo = i; press(tB, i); render(); }));
    root.appendChild(out);
    press(tB, 1); render();
  }

  /* =============== AULA 4: custo de log =============== */
  function wCustoLog(root) {
    var PRE = [
      { l: 'Normal day', ped: 5, cat: 40 },
      { l: 'Black Friday peak all day', ped: 30, cat: 640 }
    ];
    var S = { nivel: 0 };
    var pp = slider('Orders per second', 1, 40, 1, 5, '/s');
    var pc = slider('Catalog: requests per second', 5, 700, 5, 40, 'req/s');
    var pl = slider('INFO lines per service and order', 1, 8, 1, 3, 'lines');
    var pb = slider('Bytes per line (JSON)', 100, 800, 50, 300, 'B');
    var pr = slider('Retention', 1, 90, 1, 30, 'days');
    var pB = [], nB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function render() {
      var ped = +pp.input.value, cat = +pc.input.value, lin = +pl.input.value, byt = +pb.input.value, ret = +pr.input.value;
      var mult = S.nivel ? 10 : 1;
      var kbPedido = 5 * lin * byt / 1000;          /* 5 serviços */
      var kbs = (ped * kbPedido + cat * 0.25) * mult; /* catálogo: 1 linha de 250 B por requisição */
      var gbDia = kbs * 86400 / 1e6, total = gbDia * ret;
      clear(out);
      out.appendChild(facts([
        fact('Per order (5 services × ' + fmt(lin, 0) + ' lines × ' + fmt(byt, 0) + ' B)', fmt(kbPedido, 2) + ' KB'),
        fact('Log throughput' + (S.nivel ? ' (DEBUG ×10)' : ''), fmt(kbs, 1) + ' KB/s'),
        fact('Per day', fmt(gbDia, 2) + ' GB', gbDia > 100)
      ]));
      out.appendChild(facts([
        fact('Retained over ' + fmt(ret, 0) + ' days', fmt(total, 0) + ' GB', total > 1000),
        fact('Orders only (without the catalog)', fmt(ped * kbPedido * mult * 86400 / 1e6, 2) + ' GB/dia'),
        fact('Catalog only (250 B per request)', fmt(cat * 0.25 * mult * 86400 / 1e6, 2) + ' GB/dia')
      ]));
      var bad = gbDia > 100;
      out.appendChild(verdict(bad,
        bad ? 'The diary got expensive.' : 'It can be stored and searched.',
        bad ? 'At ' + fmt(gbDia, 0) + ' GB per day, ingestion, retention and search get heavy, exactly when you need them. Open DEBUG per service and for a limited time, not across the whole store, and index only the fixed fields (trace_id, level).'
          : (S.nivel === 0 && ped === 5 && cat === 40 ? 'On a normal day it is 2.81 GB per day: 4.5 KB per order at 5/s plus 40 req/s of 250 B.' : 'Play with the controls: the peak is 25.5 GB/day, and with DEBUG, 255.')));
      out.appendChild(note('Per-line sizes and lines per service are an example from the module. Decimal units (1 GB = 1,000,000 KB). Black Friday peak "all day" is a conservative calculation: 30 orders/s and 640 req/s for 24 h.'));
    }
    function pick(i) { press(pB, i); pp.set(PRE[i].ped); pc.set(PRE[i].cat); render(); }
    root.appendChild(chipRow('Scenario', PRE.map(function (p) { return p.l; }), pB, pick));
    root.appendChild(chipRow('Log level', ['INFO', 'DEBUG on (×10)'], nB, function (i) { S.nivel = i; press(nB, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pp.wrap, pc.wrap, pl.wrap, pb.wrap, pr.wrap]));
    [pp, pc, pl, pb, pr].forEach(function (s) { s.input.addEventListener('input', function () { press(pB, -1); render(); }); });
    root.appendChild(out);
    press(nB, 0); pick(0);
  }

  /* =============== AULA 5: cascata de spans =============== */
  var SPANS = [
    { n: 'POST /pedidos (gw-loja)', a: 4, b: 4 },
    { n: 'bff-app', a: 6, b: 6 },
    { n: 'pedidos (validate and price)', a: 14, b: 14 },
    { n: 'carrinho GET', a: 12, b: 12 },
    { n: 'estoque reservar', a: 20, b: 1640 },
    { n: 'pagamentos (network + PSP-A)', a: 210, b: 210 },
    { n: 'INSERT into pedidos', a: 6, b: 6 },
    { n: 'publish to Kafka (PedidoCriado)', a: 3, b: 3 }
  ];
  function wCascata(root) {
    var S = { lento: 1, perdeu: 0 };
    var sB = [], cB = [], fields = SPANS.map(function (s, i) {
      return numField(s.n, S.lento ? s.b : s.a, 1, function () { press(sB, -1); render(); }, 'ms');
    });
    var grid = el('div', { class: 'sr-ctrls ob-grid2' }, fields.map(function (f) { return f.wrap; }));
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function dur() { return fields.map(function (f) { return Math.max(0, num(f.input, 0)); }); }
    function render() {
      var d = dur(), tot = d.reduce(function (s, v) { return s + v; }, 0), start = 0;
      var maxI = 0; d.forEach(function (v, i) { if (v > d[maxI]) maxI = i; });
      clear(out);
      var wf = el('div', { class: 'ob-wf', role: 'img', 'aria-label': 'Span waterfall of order 1063' });
      d.forEach(function (v, i) {
        var left = tot ? start / tot : 0, w = tot ? v / tot : 0;
        var orphan = S.perdeu && i === 7;
        var fill = el('div', { class: 'ob-wf-bar' + (i === maxI && v / Math.max(tot, 1) > 0.5 ? ' hot' : '') + (orphan ? ' orphan' : '') });
        fill.style.left = (left * 100) + '%';
        fill.style.width = Math.max(w * 100, 0.8) + '%';
        wf.appendChild(el('div', { class: 'ob-wf-row' }, [
          el('span', { class: 'ob-wf-n', text: SPANS[i].n }),
          el('div', { class: 'ob-wf-track' }, [fill]),
          el('span', { class: 'ob-wf-t', text: fmt(start, 0) + ' → ' + fmt(start + v, 0) + ' ms · ' + fmt(v, 0) + ' ms' })
        ]));
        start += v;
      });
      out.appendChild(wf);
      var share = tot ? d[maxI] / tot : 0;
      out.appendChild(facts([
        fact('Request total', fmt(tot, 0) + ' ms', tot > 800),
        fact('Longest span', SPANS[maxI].n + ': ' + fmt(d[maxI], 0) + ' ms'),
        fact('Its share of the total', fmtPct(share, 1), share > 0.5)
      ]));
      var tp = '00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52-a3c4d5e6f7a8b9c0-01';
      var tp2 = '00-4b7d02c91e6a38f5d0b2a7c9e1f46830-5e2f9a1c7b3d8046-01';
      out.appendChild(el('p', { class: 'sr-sub', text: 'traceparent that gw-loja passes on' }));
      out.appendChild(el('pre', { class: 'ob-tp' }, [el('code', { text: 'traceparent: ' + tp })]));
      if (S.perdeu) {
        out.appendChild(el('p', { class: 'sr-sub', text: 'The Kafka consumer does not pass on the header: it opens a new trace (example id)' }));
        out.appendChild(el('pre', { class: 'ob-tp' }, [el('code', { text: 'traceparent: ' + tp2 })]));
        out.appendChild(verdict(true, 'The trace broke in half.',
          'Lena\'s tree ends at the INSERT (' + fmt(d.slice(0, 7).reduce(function (s, v) { return s + v; }, 0), 0) + ' ms), and PedidoCriado becomes an orphan trace with another trace_id. Whoever opens 9c1e5a7b does not see what came after.'));
      } else {
        out.appendChild(verdict(tot > 800,
          tot > 800 ? 'estoque is the slow one.' : 'Normal path.',
          tot > 800 ? 'The other 7 spans did not change: estoque went from 20 to ' + fmt(d[4], 0) + ' ms (20 of work and ' + fmt(Math.max(0, d[4] - 20), 0) + ' of lock wait) and the request went from 275 to ' + fmt(tot, 0) + ' ms. The trace_id is the same for the whole trip; only the parent_id changes at each hop.'
            : 'Sum of 275 ms (4 + 6 + 14 + 12 + 20 + 210 + 6 + 3). Pick order 1063 to see estoque wait for the lock.'));
      }
      out.appendChild(note('Example durations from the module, in a row because each span waits for the previous one (simplification). The estoque WARN carries the span_id 6d1f0a2b9e3c4a58.'));
    }
    function pick(i) {
      S.lento = i; press(sB, i);
      SPANS.forEach(function (s, j) { fields[j].input.value = String(i ? s.b : s.a); });
      render();
    }
    root.appendChild(chipRow('Order', ['Normal (275 ms)', 'The 1063 (1,895 ms)'], sB, pick));
    var ctx = el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', text: 'Lose the context at Kafka' });
    ctx.addEventListener('click', function () { S.perdeu = S.perdeu ? 0 : 1; ctx.setAttribute('aria-pressed', S.perdeu ? 'true' : 'false'); ctx.textContent = S.perdeu ? 'Pass the context on at Kafka' : 'Lose the context at Kafka'; render(); });
    root.appendChild(el('div', { class: 'ib-ctrl' }, [ctx]));
    root.appendChild(grid);
    root.appendChild(out);
    pick(1);
  }

  /* =============== AULA 5: amostragem =============== */
  function wAmostragem(root) {
    var S = { modo: 0 };
    var tx = slider('Traces per second', 1, 60, 1, 30, '/s');
    var hd = slider('Fraction kept (head, and the rest of tail)', 0.1, 100, 0.1, 1, '%', function (v) { return fmt(v, 1); });
    var kb = slider('Size of one trace', 1, 20, 0.2, 4.8, 'KB', function (v) { return fmt(v, 1); });
    var bd = slider('Slow or error fraction (the tail targets)', 0.1, 10, 0.1, 0.8, '%', function (v) { return fmt(v, 1); });
    var mB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    var LENTOS = 8;
    function render() {
      var r = +tx.input.value, p = +hd.input.value / 100, k = +kb.input.value, f = +bd.input.value / 100;
      var gbTudo = r * k * 86400 / 1e6;
      var gbHead = gbTudo * p;
      var gbTail = gbTudo * (p + f * (1 - p));
      var chanceHead = 1 - Math.pow(1 - p, LENTOS);
      var chance = S.modo ? 1 : chanceHead, gb = S.modo ? gbTail : gbHead;
      clear(out);
      out.appendChild(facts([
        fact('Keep 100%', fmt(gbTudo, 2) + ' GB/dia'),
        fact(S.modo ? 'Tail (' + fmt(p * 100, 1) + '% of the rest + 5xx and > 800 ms)' : 'Head (' + fmt(p * 100, 1) + '%)', fmt(gb, 3) + ' GB/dia'),
        fact('Chance of keeping at least one of the ' + LENTOS + ' slow ones', fmtPct(chance, 1), chance < 0.5)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Chance of keeping the slow orders' }, [
        bar(S.modo ? 'tail' : 'head', chance, fmtPct(chance, 1), chance < 0.5),
        bar('keep 100%', 1, '100% · ' + fmt(gbTudo, 1) + ' GB/dia', false)
      ]));
      out.appendChild(verdict(!S.modo && chance < 0.5,
        S.modo ? 'Tail keeps all ' + LENTOS + '.' : (chance < 0.5 ? 'Head throws away almost all the slow ones.' : 'Head keeps a slow one, but only by luck.'),
        S.modo ? 'It decides after seeing the whole trace: it keeps every 5xx, everything above 800 ms and ' + fmt(p * 100, 1) + '% of the rest. The price is holding the spans in a collector until the request ends.'
          : 'It decides before knowing whether the request will be slow: 1 − (1 − ' + fmt(p, 3) + ')^' + LENTOS + ' = ' + fmtPct(chanceHead, 1) + '. With 1%, that is 7.7%. Lena\'s trace (just one) is kept with ' + fmt(p * 100, 1) + '%.'));
      out.appendChild(note('12 spans of ~400 B = 4.8 KB per trace; 30/s × 4.8 KB × 86,400 s = 12.4 GB/day; 1% = 124 MB/day. Tail keeps the slow and the failed ones beyond the rest: here, 0.8% of requests (the 1063 episode in a window).'));
    }
    root.appendChild(chipRow('When to decide', ['Head: at the start of the trace', 'Tail: after seeing the trace'], mB, function (i) { S.modo = i; press(mB, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, hd.wrap, kb.wrap, bd.wrap]));
    [tx, hd, kb, bd].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(mB, 0); render();
  }

  /* =============== AULA 6: quando o alerta dispara =============== */
  /* Modelo: 30 pedidos/s; o incidente começa em t = 0 e dura D segundos. Sem defesas, falha a fração e dos pedidos;
     com as defesas do módulo 21 o breaker abre em 1,3 s e só 30 × 1,3 pedidos falham. Alertas avaliados a cada I segundos;
     a taxa de erro de A e B é medida na janela do último intervalo (simplificação). O MTTD de A, B e D é dado em faixa
     (a fase da avaliação em relação ao início do incidente é desconhecida). */
  function wAlerta(root) {
    var RATE = 30, SLO_DEFAULT = 99.9;
    var S = { breaker: 0 };
    var dur = slider('Incident duration', 10, 600, 10, 90, 's');
    var err = slider('Error during the incident (without breaker)', 5, 100, 5, 100, '%');
    var thr = slider('Error threshold of alerts A and B', 1, 50, 1, 5, '%');
    var fa = slider('for of alert A', 0, 600, 15, 300, 's', function (v) { return fmt(v, 0); });
    var fb = slider('for of alert B', 0, 600, 15, 60, 's', function (v) { return fmt(v, 0); });
    var iv = slider('Evaluation interval', 5, 60, 5, 15, 's');
    var bn = slider('Burn rate that wakes someone (D)', 2, 40, 0.2, 14.4, '×', function (v) { return fmt(v, 1); });
    var slo = slider('SLO', 99, 99.99, 0.01, SLO_DEFAULT, '%', function (v) { return fmt(v, 2); });
    var bB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });

    function falhasAte(t, D, e) { /* falhas acumuladas de 0 a t */
      var x = Math.min(t, D);
      if (S.breaker) return RATE * Math.min(x, 1.3);
      return RATE * e * x;
    }
    /* simula as avaliações com uma fase; devolve o instante em que dispara ou null */
    function dispara(phase, I, forS, D, e, thrv, ratioFn) {
      var pending = null;
      for (var tau = phase; tau <= D + 4000; tau += I) {
        if (tau <= 0) continue;
        var ok = ratioFn(tau) > thrv;
        if (!ok) { pending = null; continue; }
        if (pending === null) pending = tau;
        if (tau - pending >= forS - 1e-9) return tau;
      }
      return null;
    }
    function faixa(fn, I) { /* varre as fases de 0,25 s a I e devolve [min, max] dos disparos, ou null */
      var mn = Infinity, mx = -Infinity, achou = false, any = false;
      for (var ph = 0.25; ph <= I + 1e-9; ph += 0.25) {
        var t = fn(ph);
        if (t === null) { any = true; continue; }
        achou = true; if (t < mn) mn = t; if (t > mx) mx = t;
      }
      return achou ? [mn, mx, any] : null;
    }
    function fmtFaixa(f) {
      if (!f) return '∞ (never)';
      var a = Math.floor(f[0]), b = Math.ceil(f[1]);
      return a === b ? fmt(a, 0) + ' s' : fmt(a, 0) + ' to ' + fmt(b, 0) + ' s';
    }
    function render() {
      var D = +dur.input.value, e = +err.input.value / 100, T = +thr.input.value / 100, I = +iv.input.value;
      var FA = +fa.input.value, FB = +fb.input.value, BR = +bn.input.value, ORC = 1 - (+slo.input.value) / 100;
      var Ftot = falhasAte(D, D, e), Ntot = RATE * D;
      /* A e B: erro na janela do último intervalo */
      function ratioJanela(tau) {
        var w0 = Math.max(0, tau - I);
        var f = falhasAte(tau, D, e) - falhasAte(w0, D, e);
        var n = RATE * (tau - w0);
        return n > 0 ? f / n : 0;
      }
      var fA = faixa(function (ph) { return dispara(ph, I, FA, D, e, T, ratioJanela); }, I);
      var fB = faixa(function (ph) { return dispara(ph, I, FB, D, e, T, ratioJanela); }, I);
      /* C: sonda de 10 s, 3 falhas seguidas, alinhada ao início; a sonda falha se o erro for de pelo menos 50% naquele instante */
      var tC = null, seg = 0;
      for (var k = 1; k * 10 <= D; k++) {
        var tt = k * 10;
        var falha = S.breaker ? (tt <= 1.3) : e >= 0.5;
        seg = falha ? seg + 1 : 0;
        if (seg >= 3) { tC = tt; break; }
      }
      /* D: burn rate nas janelas de 1 h e de 5 min, as duas acima de BR */
      function burnLong(tau) { return falhasAte(tau, D, e) / (RATE * 3600) / ORC; }
      function burnShort(tau) { return falhasAte(tau, D, e) / (RATE * 300) / ORC; }
      var fD = faixa(function (ph) {
        for (var tau = ph; tau <= D + 4000; tau += I) {
          if (burnLong(tau) >= BR && burnShort(tau) >= BR) return tau;
        }
        return null;
      }, I);
      var tBreaker = S.breaker ? 1.3 : null;
      function lbl(f) {
        if (!f) return 'does not fire';
        return f[0] > D ? 'fires only after the end' : 'fires';
      }
      function cell(f) { return { text: fmtFaixa(f), cls: !f ? 'ob-bad' : (f[0] > D ? 'ob-bad' : '') }; }
      var rows = [
        { cells: [{ text: 'A: error > ' + fmt(T * 100, 0) + '% for ' + fmtDur(FA) }, { text: lbl(fA) }, cell(fA), { text: fA ? 'page' : '—' }] },
        { cells: [{ text: 'B: error > ' + fmt(T * 100, 0) + '% for ' + fmtDur(FB) }, { text: lbl(fB) }, cell(fB), { text: fB ? 'page' : '—' }] },
        { cells: [{ text: 'C: synthetic probe (10 s × 3 failures)' }, { text: tC ? 'fires' : 'does not fire' }, { text: tC ? fmt(tC, 0) + ' s' : '∞ (never)', cls: tC ? '' : 'ob-bad' }, { text: tC ? 'page' : '—' }] },
        { cells: [{ text: 'D: burn rate ≥ ' + fmt(BR, 1) + '× (1 h and 5 min; SLO ' + fmt(+slo.input.value, 2) + '%)' }, { text: lbl(fD) }, cell(fD), { text: fD ? 'page' : '—' }] },
        { cells: [{ text: 'breaker_state = open (cause)' }, { text: tBreaker ? 'fires' : 'does not open' }, { text: tBreaker ? fmt(tBreaker, 1) + ' s' : '—' }, { text: tBreaker ? 'ticket (cause, not symptom)' : '—' }] }
      ];
      clear(out);
      out.appendChild(facts([
        fact('Orders that fail', fmt(Ftot, 0) + ' of ' + fmt(Ntot, 0), Ftot / Ntot > 0.5),
        fact('Burn rate in the incident', fmt(Ntot ? Ftot / Ntot / ORC : 0, 1) + '×'),
        fact('Burn rate in the 1 h and 5 min windows', fmt(Ftot / (RATE * 3600) / ORC, 2) + '× · ' + fmt(Ftot / (RATE * 300) / ORC, 1) + '×')
      ]));
      out.appendChild(table(['Alert', 'Result', 'MTTD', 'Becomes'], rows));
      var algum = !!(fA || fB || tC || fD);
      out.appendChild(verdict(!algum && !S.breaker,
        S.breaker ? (algum ? 'Something fired even with the defenses.' : 'No page alert fires, and it should not.') : (algum ? 'At least one alert wakes someone.' : 'No alert catches this incident.'),
        S.breaker ? 'With the breaker (opens in 1.3 s) only ~' + fmt(Ftot, 0) + ' of ' + fmt(Ntot, 0) + ' orders fail (' + fmtPct(Ftot / Ntot, 2) + '). The breaker state is the cause: it becomes a ticket, and the customer barely felt it.'
          : (fA ? 'Alert A fires, but ' + (fA[0] > D ? 'only after the incident is over.' : 'look at the time.') : 'Alert A (long for) never closes the ' + fmtDur(FA) + ' window in a ' + fmt(D, 0) + ' s incident. Compare with the probe (C) and the burn rate (D).')));
      out.appendChild(note('Model of 30 orders/s. The error rate of A and B is measured over the last evaluation interval window (a simplification of the 1 m rate). Ranges: the evaluation phase relative to the start of the incident changes the result by up to one interval. Module default: never · 60 to 75 s · 30 s · 52 to 67 s (51.84 s of errors).'));
    }
    function pickB(i) { S.breaker = i; press(bB, i); render(); }
    root.appendChild(chipRow('Module 21 defenses', ['No breaker or fallback', 'With breaker (opens in 1.3 s) and fallback'], bB, pickB));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dur.wrap, err.wrap, thr.wrap, fa.wrap, fb.wrap, iv.wrap, bn.wrap, slo.wrap]));
    [dur, err, thr, fa, fb, iv, bn, slo].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickB(0);
  }

  /* =============== AULA 7: orçamento de erro e burn rate =============== */
  function wOrcamento(root) {
    var SLOS = [99, 99.5, 99.9, 99.95, 99.99];
    var INC = [
      { n: '90 s PSP-A without protection (module 21)', f: 2700, on: true },
      { n: 'SP outage (module 27)', f: 643.5, on: false },
      { n: '1063 episode (lesson 2)', f: 8, on: false }
    ];
    var S = { slo: 2 };
    var sB = [], iB = [];
    var ped = slider('Orders per second (average)', 1, 30, 1, 5, '/s');
    var bn = slider('Burn rate', 0.5, 40, 0.1, 14.4, '×', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function render() {
      var slo = SLOS[S.slo], orc = 1 - slo / 100, rate = +ped.input.value, BR = +bn.input.value;
      var req = rate * 2592000, bud = orc * req, min = orc * 43200;
      var queimado = INC.reduce(function (s, x) { return s + (x.on ? x.f : 0); }, 0);
      var pct = queimado / bud, resta = 1 - pct;
      var hAcaba = 720 / BR;
      clear(out);
      out.appendChild(facts([
        fact('Requests in 30 days', fmt(req, 0)),
        fact('Budget (' + fmt(orc * 100, 3) + '% bad)', fmt(bud, 0) + ' requests · ' + fmt(min, 2) + ' min'),
        fact('Burned by the selected incidents', fmtPct(pct, 2), pct > 0.5)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Remaining budget' }, [
        bar('budget left', Math.max(0, resta), fmtPct(Math.max(0, resta), 1), resta < 0.1)
      ]));
      var pol = resta > 0.5 ? ['Ship as normal.', 'More than 50% left: the team ships at the usual pace.', false]
        : resta > 0.1 ? ['Only fixes and a slow canary.', 'Between 50% and 10%: whatever is not a fix waits, and what goes out passes through a slow canary (module 22).', false]
        : resta > 0 ? ['Freeze whatever is not a fix.', 'Less than 10%: no new features until the budget is back.', true]
        : ['War room.', 'The budget hit zero: full priority on stability, and the SLA with mkt-01 is at risk.', true];
      out.appendChild(verdict(pol[2], pol[0], pol[1]));
      out.appendChild(el('p', { class: 'sr-sub', text: 'Burn rate: consumption = burn × window ÷ period' }));
      out.appendChild(table(['Burn × window', 'Budget consumption', 'Becomes'], [
        { cells: [{ text: '14.4× in 1 h' }, { text: fmtPct(14.4 * 1 / 720, 1) }, { text: 'page' }] },
        { cells: [{ text: '6× in 6 h' }, { text: fmtPct(6 * 6 / 720, 1) }, { text: 'page' }] },
        { cells: [{ text: '1× in 3 days' }, { text: fmtPct(1 * 72 / 720, 1) }, { text: 'ticket' }] },
        { cells: [{ text: fmt(BR, 1) + '× (the control\'s)' }, { text: fmt(BR, 1) + '× → runs out in ' + fmtDur(hAcaba * 3600) }, { text: BR >= 6 ? 'page' : 'ticket' }] }
      ]));
      out.appendChild(note('The incidents are counted in bad requests, and do not depend on the SLO: 2,700 (30 × 90 s), 643.5 (9.9 × 65 s, simplified) and 8. At 99.9% and 5 orders/s the budget is 12,960 (43.2 min): 20.8% · 4.97% · 0.06%. The policy is an example.'));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'SLO (30-day window)' }));
    root.appendChild(chipRow('SLO', SLOS.map(function (v) { return fmt(v, 2) + '%'; }), sB, function (i) { S.slo = i; press(sB, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'What burned in the month (select as many as you like)' }));
    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Incidents' });
    INC.forEach(function (x) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': x.on ? 'true' : 'false', text: x.n });
      b.addEventListener('click', function () { x.on = !x.on; b.setAttribute('aria-pressed', x.on ? 'true' : 'false'); render(); });
      iB.push(b); row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ped.wrap, bn.wrap]));
    [ped, bn].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(sB, S.slo); render();
  }

  /* =============== AULAS 8 a 10: USE × RED × quatro sinais =============== */
  function wLentes(root, modo) {
    /* modo: 'use' (aula 8), 'red' (aula 9) ou 'golden' (aula 10) */
    var S = { alvo: 0, rel: 1, sem: 0, perc: 1, falha: 30, bk: 0 };
    var tB = [], rB = [], eB = [], dB = [];
    var out = el('div', { class: 'ob-out', 'aria-live': 'polite' });
    function estado(bad, txtOk, txtBad) { return { text: bad ? txtBad : txtOk, cls: bad ? 'ob-bad' : 'ob-ok' }; }

    function renderUse() {
      clear(out);
      var rows, vis, nao, bad = false;
      if (S.alvo === 0) {
        rows = [
          { cells: ['Utilization', '99% on catalogo-3 (the other 9 at 64%; fleet at 67.5%)', estado(true, '', 'red')] },
          { cells: ['Saturation', '64.6 of 86.4 requests in flight (Little: 64 req/s × 1.01 s)', estado(true, '', 'red')] },
          { cells: ['Errors', '1% of 504s at 640 req/s', estado(true, '', 'red')] }
        ];
        vis = 'The right replica: the three questions point to catalogo-3, and the fleet average (67.5%) hides it.';
        nao = 'Whether the catalog returns the right price. USE does not look at the content.'; bad = true;
      } else if (S.alvo === 1) {
        var on = S.rel;
        rows = [
          { cells: ['Utilization', on ? '100% (40.4 connections requested for a pool of 20)' : '2% (0.4 of 20)', estado(on, 'green', 'red')] },
          { cells: ['Saturation', on ? 'waiting for a slot (db_pool_waiting > 0)' : 'no wait', estado(on, 'green', 'red')] },
          { cells: ['Errors', on ? '503 from the full pool: 33% of checkout and 10% of status' : '0% of 503', estado(on, 'green', 'red')] }
        ];
        vis = on ? 'The 23:00 report taking the whole pool: module 25 in three lines.' : 'A roomy pool: 0.4 connections of 20 in use.';
        nao = 'Which flow is using the connections. USE says the pool is full, not who filled it.'; bad = on;
      } else {
        rows = [
          { cells: ['Utilization', 'CPU at 20% · pool at 10%', estado(false, 'green', '')] },
          { cells: ['Saturation', 'no CPU or pool queue', estado(false, 'green', '')] },
          { cells: ['Errors', 'no OOMKill, no pool 503', estado(false, 'green', '')] }
        ];
        vis = 'That all the resources are fine.';
        nao = 'The 0.00 shipping in Recife: the defect is in the service, and the method only looks at resources.'; bad = true;
      }
      out.appendChild(table(['USE question', 'Value', 'State'], rows));
      out.appendChild(el('div', { class: 'ob-two' }, [
        el('p', null, [el('strong', { text: 'USE sees: ' }), vis]),
        el('p', null, [el('strong', { text: 'USE does not see: ' }), nao])
      ]));
      out.appendChild(verdict(bad && S.alvo === 2, S.alvo === 2 ? 'Green and wrong.' : 'USE reading.',
        S.alvo === 2 ? 'Every resource is fine and 2.5.0 keeps returning shipping 0.00: that is the method\'s limit. Lesson 9 covers the service.' : 'U, S and E are filled in for each resource, and then aggregated. The fleet average hides the replica at 99%.'));
    }

    function renderRed() {
      clear(out);
      var v25 = S.alvo === 1;
      var errSem = S.sem === 1;
      var d = S.perc ? 'p95 489 ms' : 'average 311 ms';
      var errTxt = !v25 ? '0% (nothing wrong)' : (errSem ? '20% of orders with shipping 0.00 (the Recife ones)' : '0% of 5xx');
      var errBad = v25 && errSem;
      var rows = [
        { cells: ['Rate', '3.6 orders/s in celula-recife (30/s in the store)', { text: 'green', cls: 'ob-ok' }] },
        { cells: ['Errors', errTxt, estado(errBad, 'green', 'red')] },
        { cells: ['Duration', d + ' (same in both versions)', { text: 'green', cls: 'ob-ok' }] }
      ];
      out.appendChild(table(['RED question', 'pedidos ' + (v25 ? '2.5.0' : '2.4.0'), 'State'], rows));
      out.appendChild(el('div', { class: 'ob-two' }, [
        el('p', null, [el('strong', { text: 'RED sees: ' }), 'how many requests, how many fail (by the chosen error definition) and how long they take, per route, per version and per cell.']),
        el('p', null, [el('strong', { text: 'RED does not see: ' }), errSem ? 'the cause of the 0.00 shipping: it points to the service and the version, and the trace and the log explain.' : 'the 0.00 shipping, as long as the error is only 5xx.'])
      ]));
      out.appendChild(verdict(v25 && !errSem,
        v25 && !errSem ? '2.5.0 stays green.' : (v25 ? 'Now 2.5.0 shows up.' : '2.4.0 is right.'),
        v25 && !errSem ? 'With error = only 5xx (and ' + (S.perc ? 'percentile' : 'average') + '), Rate, Errors and Duration do not change: the store loses R$ 15.00 per order in Recife with no red panel. Turn on the semantic error.'
          : (v25 ? 'With the error defined by the domain (shipping 0.00 is an error), the 2.5.0 Errors shows 20% of the orders, in the module 22 mix. The cut by version points to the culprit.'
            : 'On 2.4.0 the three panels are green and tell the truth. Switch to 2.5.0.')));
    }

    function renderGolden() {
      clear(out);
      var f = S.bk ? S.falha / 100 : 0;
      var media = f * 2 + (1 - f) * 275;
      out.appendChild(el('p', { class: 'sr-sub', text: 'Latency: average × success × error' }));
      out.appendChild(facts([
        fact('Average latency (the one a simple dashboard shows)', fmt(media, 1) + ' ms', false),
        fact('Success latency', '275 ms'),
        fact('Error latency (open breaker)', S.bk ? '2 ms' : '—')
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Average latency compared to the success latency' }, [
        bar('average', media / 300, fmt(media, 0) + ' ms', false),
        bar('success', 275 / 300, '275 ms', false)
      ]));
      out.appendChild(verdict(S.bk && f > 0,
        S.bk && f > 0 ? 'The average improved while the system got worse.' : 'With no fast failures, average and success coincide.',
        S.bk && f > 0 ? fmtPct(f, 0) + ' fail in 2 ms and ' + fmtPct(1 - f, 0) + ' answer in 275: ' + fmt(f, 2) + ' × 2 + ' + fmt(1 - f, 2) + ' × 275 = ' + fmt(media, 1) + ' ms. Only the success curve, kept separate, stays at 275, and the error one shows the problem.'
          : 'Open the breaker: 30% failing in 2 ms pulls the average down from 275 to 193 ms.'));
      var rows = [
        { cells: ['catalogo-3 at 99%, with a queue', { text: 'yes (U and S)', cls: 'ob-ok' }, { text: 'only if cut per replica' }, { text: 'yes (saturation)', cls: 'ob-ok' }] },
        { cells: ['Full pool (503)', { text: 'yes (U, S and E)', cls: 'ob-ok' }, { text: 'yes (Errors)', cls: 'ob-ok' }, { text: 'yes (errors and saturation)', cls: 'ob-ok' }] },
        { cells: ['Shipping 0.00 (2.5.0)', { text: 'no', cls: 'ob-bad' }, { text: 'only with a semantic error', cls: 'ob-bad' }, { text: 'only with the wrong 200 in Errors', cls: 'ob-bad' }] },
        { cells: ['Open breaker, 30% failing in 2 ms', { text: 'no (resources ok)', cls: 'ob-bad' }, { text: 'yes (Errors 30%)', cls: 'ob-ok' }, { text: 'yes (separate latency)', cls: 'ob-ok' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'What each lens sees' }));
      out.appendChild(table(['Situation', 'USE (resource)', 'RED (service)', 'Four signals (user)'], rows));
      out.appendChild(note('RED = Rate + Errors + Duration; the four signals = RED + Saturation, at the service level. USE looks at the resource, RED at the service and the four signals at the user. The "only with..." reading depends on defining the error by the domain.'));
    }

    function render() { if (modo === 'use') renderUse(); else if (modo === 'red') renderRed(); else renderGolden(); }

    if (modo === 'use') {
      root.appendChild(chipRow('Resource or service', ['catalogo-3 (Black Friday, 20:03)', '20-connection pool', 'pedidos 2.5.0 (shipping 0.00)'], tB, function (i) { S.alvo = i; press(tB, i); render(); }));
      root.appendChild(chipRow('23:00 report (for the pool)', ['Off', 'On'], rB, function (i) { S.rel = i; press(rB, i); S.alvo = 1; press(tB, 1); render(); }));
      press(tB, 0); press(rB, 1);
    } else if (modo === 'red') {
      root.appendChild(chipRow('pedidos version', ['2.4.0', '2.5.0 (shipping 0.00 in Recife)'], tB, function (i) { S.alvo = i; press(tB, i); render(); }));
      root.appendChild(chipRow('Error definition', ['5xx only', 'Semantic (shipping 0.00 is an error)'], eB, function (i) { S.sem = i; press(eB, i); render(); }));
      root.appendChild(chipRow('Duration', ['Average', 'Percentile (from a histogram)'], dB, function (i) { S.perc = i; press(dB, i); render(); }));
      S.alvo = 1; press(tB, 1); press(eB, 0); press(dB, 1);
    } else {
      root.appendChild(chipRow('Module 21 breaker', ['Closed', 'Open (30% fail in 2 ms)'], tB, function (i) { S.bk = i; press(tB, i); render(); }));
      var fl = slider('Fast failures (with the breaker open)', 5, 80, 5, 30, '%');
      fl.input.addEventListener('input', function () { S.falha = +fl.input.value; render(); });
      root.appendChild(el('div', { class: 'sr-ctrls' }, [fl.wrap]));
      S.bk = 1; press(tB, 1);
    }
    root.appendChild(out);
    render();
  }

  var REG = {
    'disponivel-correto': wDisponivel,
    histograma: wHistograma,
    cardinalidade: wCardinalidade,
    'custo-log': wCustoLog,
    cascata: wCascata,
    amostragem: wAmostragem,
    alerta: wAlerta,
    orcamento: wOrcamento,
    use: function (r) { wLentes(r, 'use'); },
    red: function (r) { wLentes(r, 'red'); },
    golden: function (r) { wLentes(r, 'golden'); }
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
