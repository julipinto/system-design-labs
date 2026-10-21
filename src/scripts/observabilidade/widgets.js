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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
  function fmtPct(p, d) { return fmt(p * 100, d == null ? 1 : d) + '%'; }
  function fmtBig(v) {
    if (v >= 1e9) return fmt(v / 1e9, 1) + ' bilhões';
    if (v >= 1e6) return fmt(v / 1e6, 1) + (v >= 2e6 ? ' milhões' : ' milhão');
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
      { l: '30 s (sonda sintética)', s: 30 },
      { l: '5 min', s: 300 },
      { l: '15 min', s: 900 },
      { l: '60 min (só a métrica de negócio)', s: 3600 }
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
        { cells: [{ text: 'GET /healthcheck' }, { text: '200' }, { text: 'verde', cls: 'ob-ok' }] },
        { cells: [{ text: 'Status das respostas de POST /pedidos' }, { text: '201' }, { text: 'verde', cls: 'ob-ok' }] },
        { cells: [{ text: 'Taxa de 5xx' }, { text: '0%' }, { text: 'verde', cls: 'ob-ok' }] },
        { cells: [{ text: 'Latência p95' }, { text: '489 ms (igual)' }, { text: 'verde', cls: 'ob-ok' }] },
        { cells: [{ text: 'pedidos_frete_zero_total{cidade="recife"}' }, { text: bug ? 'sobe 1 por segundo' : '0' }, bug ? { text: 'vermelho', cls: 'ob-bad' } : { text: 'verde', cls: 'ob-ok' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'Painel técnico (as quatro primeiras linhas) × painel de negócio (a última)' }));
      out.appendChild(table(['Painel', 'Mostra', 'Estado'], rows));
      out.appendChild(facts([
        fact('Pedidos de Recife por segundo', fmt(RECIFE, 0) + ' (20% de 5)'),
        fact('Frete cobrado a menos', bug ? 'R$ ' + fmt(FRETE, 2) + ' por pedido' : 'nenhum', bug),
        fact('Prejuízo em ' + fmtDur(sec), 'R$ ' + fmt(perdido, 0), bug)
      ]));
      out.appendChild(verdict(bug,
        bug ? 'Disponível e errada.' : 'Disponível e correta.',
        bug ? 'Os quatro painéis técnicos ficam verdes; só a métrica de negócio denuncia. Em ' + fmtDur(sec) + ' são ' + fmt(sec, 0) + ' × ' + fmt(RECIFE, 0) + ' × R$ ' + fmt(FRETE, 0) + ' = R$ ' + fmt(perdido, 0) + '.'
          : 'A 2.4.0 cobra o frete certo: todos os painéis, técnicos e de negócio, estão verdes. Ligue o defeito da 2.5.0.'));
      out.appendChild(note('Conta do módulo 22: 5 pedidos/s × 20% = 1 por segundo para Recife, R$ 15,00 a menos em cada. 60 min = R$ 54.000; 30 s = R$ 450.'));
    }
    root.appendChild(chipRow('Versão do pedidos', ['2.4.0 (frete certo)', '2.5.0 (frete 0,00 em Recife)'], bB, function (i) { S.bug = i; press(bB, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Quanto tempo até alguém notar' }));
    root.appendChild(chipRow('Tempo até notar', TEMPOS.map(function (t) { return t.l; }), tB, function (i) { S.t = i; press(tB, i); render(); }));
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
      { l: 'Os do módulo', b: BASE },
      { l: 'Com o 2,0 no lugar do 2,5', b: [0.05, 0.1, 0.25, 0.5, 0.8, 1, 2, 5] },
      { l: 'Sem bucket perto do SLO (0,8) nem do medo (2,0)', b: [0.1, 0.25, 0.5, 1, 5] }
    ];
    var pB = [], fields = [], showAvg = false;
    var grid = el('div', { class: 'sr-ctrls ob-grid2' });
    BASE.forEach(function (v, i) {
      var f = numField('Limite ' + (i + 1) + ' (le, s)', v, 0.05, render);
      fields.push(f); grid.appendChild(f.wrap);
    });
    var avgBtn = el('button', { type: 'button', class: 'btn', text: 'Tirar a média dos p99' });
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
      if (!b.length) { out.appendChild(note('Preencha ao menos um limite maior que zero.')); return; }
      var c = acumulado(b);
      var rows = b.map(function (v, i) { return { cells: [{ text: fmt(v, 3) }, { text: fmt(c[i], 0) }] }; });
      rows.push({ cells: [{ text: '+Inf' }, { text: fmt(N, 0) }] });
      out.appendChild(table(['le (s)', 'requisições até ali (acumulado)'], rows));
      var QS = [{ q: 0.5, n: 'p50' }, { q: 0.95, n: 'p95' }, { q: 0.99, n: 'p99' }, { q: 0.999, n: 'p99,9' }];
      var qrows = QS.map(function (x) {
        var e = quantil(x.q, b, c), r = quantilReal(x.q), err = Math.abs(e - r) / r;
        return { cells: [{ text: x.n }, { text: fmt(e, 4) + ' s' }, { text: fmt(r, 3) + ' s' }, { text: err < 0.02 ? 'bate' : 'erra ' + fmtPct(err, 0), cls: err < 0.02 ? '' : 'ob-bad' }] };
      });
      out.appendChild(table(['Percentil', 'Estimado pelos buckets', 'Valor real da janela', 'Diferença'], qrows));
      var mean = AMOSTRA.reduce(function (s, v) { return s + v; }, 0) / N;
      var p99 = quantil(0.99, b, c), p999 = quantil(0.999, b, c), real999 = quantilReal(0.999);
      out.appendChild(facts([
        fact('Média da janela', fmt(mean, 3) + ' s'),
        fact('p99 × SLO de 0,8 s', fmt(p99, 3) + ' s · ' + (p99 <= 0.8 ? 'dentro (verde)' : 'fora'), p99 > 0.8),
        fact('Pedidos acima de 1 s', fmt(AMOSTRA.filter(function (v) { return v > 1; }).length, 0) + ' de ' + fmt(N, 0) + ' (0,8%)')
      ]));
      var big = Math.abs(p999 - real999) / real999 > 0.1;
      out.appendChild(verdict(big,
        big ? 'O p99,9 erra por causa do bucket largo.' : 'Os buckets acompanham a cauda.',
        big ? 'Estima ' + fmt(p999, 4) + ' s para um valor real de ' + fmt(real999, 3) + ' s: o bucket onde ele cai é largo, e a interpolação só sabe que o valor está lá dentro. Ponha um limite perto do que você teme (2,0).'
          : 'O p99,9 estimado (' + fmt(p999, 4) + ' s) está perto do real (' + fmt(real999, 3) + ' s). Os 8 pedidos lentos não movem o p95 nem o p99, mas o p99,9 já os vê.'));
      if (showAvg) {
        out.appendChild(el('p', { class: 'sr-sub', text: 'A média dos p99 por réplica (módulo 14)' }));
        out.appendChild(facts([
          fact('4 réplicas a 55 ms, 5 a 74 ms, catalogo-3 a 2.100 ms', '(4 × 55 + 5 × 74 + 2.100) ÷ 10 = 269 ms'),
          fact('p99 verdadeiro (100 requisições juntas)', '2.000 ms', true)
        ]));
        out.appendChild(note('Percentil não se soma nem se tira a média: somam-se os buckets de todas as réplicas e calcula-se de novo.'));
      }
      avgBtn.textContent = showAvg ? 'Esconder a média dos p99' : 'Tirar a média dos p99';
      avgBtn.setAttribute('aria-pressed', showAvg ? 'true' : 'false');
    }
    function pick(i) {
      press(pB, i);
      fields.forEach(function (f, j) { f.input.value = PRESETS[i].b[j] != null ? String(PRESETS[i].b[j]) : ''; });
      render();
    }
    root.appendChild(chipRow('Conjunto de buckets', PRESETS.map(function (p) { return p.l; }), pB, pick));
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
        fact('Combinações de rótulos', parts.length ? parts.join(' × ') + ' = ' + fmtBig(comb) : '1'),
        fact(S.tipo ? 'Séries (× 11 do histograma)' : 'Séries (× 1 do contador)', fmtBig(series), series > 1e6),
        fact('Com o cliente_id (1,5 milhão)', LABELS[5].on ? 'já incluído' : fmtBig(series * 1500000))
      ]));
      var bad = series > 1e6, mid = series > 1e5 && !bad;
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Séries em escala logarítmica' }, [
        bar('séries (escala log)', Math.log10(Math.max(series, 1)) / 11, fmtBig(series), bad)
      ]));
      out.appendChild(verdict(bad || mid,
        bad ? 'Passou do razoável.' : (mid ? 'Pesado.' : 'Cabe em um Prometheus.'),
        bad ? 'Cada combinação de rótulos é uma série guardada e consultada. O cliente_id, o pedido_id e o trace_id têm valores quase únicos: o lugar deles é o log e o trace, não a métrica.'
          : (mid ? 'Está perto do que um servidor de métricas aguenta sem ajuste; mais um rótulo multiplica por outro tanto.'
            : 'As quatro dimensões da loja (servico, rota, status, celula) dão 2.016 combinações e 22.176 séries no histograma.')));
      out.appendChild(note('Um histograma gera 11 séries por combinação: 8 le, o +Inf, o _sum e o _count. O contador gera 1. Toque nos rótulos para ligar ou desligar.'));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Rótulos da métrica (valores possíveis de cada um)' }));
    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Rótulos' });
    LABELS.forEach(function (l, i) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': l.on ? 'true' : 'false', text: l.n + ' (' + fmtBig(l.v) + ')' });
      b.addEventListener('click', function () { l.on = !l.on; b.setAttribute('aria-pressed', l.on ? 'true' : 'false'); render(); });
      lB.push(b); row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Tipo da métrica' }));
    root.appendChild(chipRow('Tipo', ['Contador (1 série)', 'Histograma (11 séries)'], tB, function (i) { S.tipo = i; press(tB, i); render(); }));
    root.appendChild(out);
    press(tB, 1); render();
  }

  /* =============== AULA 4: custo de log =============== */
  function wCustoLog(root) {
    var PRE = [
      { l: 'Dia comum', ped: 5, cat: 40 },
      { l: 'Pico da Black Friday o dia todo', ped: 30, cat: 640 }
    ];
    var S = { nivel: 0 };
    var pp = slider('Pedidos por segundo', 1, 40, 1, 5, '/s');
    var pc = slider('Catálogo: requisições por segundo', 5, 700, 5, 40, 'req/s');
    var pl = slider('Linhas de INFO por serviço e pedido', 1, 8, 1, 3, 'linhas');
    var pb = slider('Bytes por linha (JSON)', 100, 800, 50, 300, 'B');
    var pr = slider('Retenção', 1, 90, 1, 30, 'dias');
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
        fact('Por pedido (5 serviços × ' + fmt(lin, 0) + ' linhas × ' + fmt(byt, 0) + ' B)', fmt(kbPedido, 2) + ' KB'),
        fact('Vazão de log' + (S.nivel ? ' (DEBUG ×10)' : ''), fmt(kbs, 1) + ' KB/s'),
        fact('Por dia', fmt(gbDia, 2) + ' GB', gbDia > 100)
      ]));
      out.appendChild(facts([
        fact('Retido em ' + fmt(ret, 0) + ' dias', fmt(total, 0) + ' GB', total > 1000),
        fact('Só os pedidos (sem o catálogo)', fmt(ped * kbPedido * mult * 86400 / 1e6, 2) + ' GB/dia'),
        fact('Só o catálogo (250 B por requisição)', fmt(cat * 0.25 * mult * 86400 / 1e6, 2) + ' GB/dia')
      ]));
      var bad = gbDia > 100;
      out.appendChild(verdict(bad,
        bad ? 'O diário ficou caro.' : 'Dá para guardar e buscar.',
        bad ? 'Com ' + fmt(gbDia, 0) + ' GB por dia a ingestão, a retenção e a busca pesam, justamente quando se precisa delas. Abra o DEBUG por serviço e por tempo, não na loja toda, e indexe só os campos fixos (trace_id, level).'
          : (S.nivel === 0 && ped === 5 && cat === 40 ? 'No dia comum são 2,81 GB por dia: 4,5 KB por pedido a 5/s mais 40 req/s de 250 B.' : 'Mexa nos controles: o pico é 25,5 GB/dia, e com DEBUG, 255.')));
      out.appendChild(note('Tamanhos por linha e linhas por serviço são exemplo do módulo. Unidades decimais (1 GB = 1.000.000 KB). Pico da Black Friday "o dia todo" é uma conta conservadora: 30 pedidos/s e 640 req/s por 24 h.'));
    }
    function pick(i) { press(pB, i); pp.set(PRE[i].ped); pc.set(PRE[i].cat); render(); }
    root.appendChild(chipRow('Cenário', PRE.map(function (p) { return p.l; }), pB, pick));
    root.appendChild(chipRow('Nível de log', ['INFO', 'DEBUG ligado (×10)'], nB, function (i) { S.nivel = i; press(nB, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pp.wrap, pc.wrap, pl.wrap, pb.wrap, pr.wrap]));
    [pp, pc, pl, pb, pr].forEach(function (s) { s.input.addEventListener('input', function () { press(pB, -1); render(); }); });
    root.appendChild(out);
    press(nB, 0); pick(0);
  }

  /* =============== AULA 5: cascata de spans =============== */
  var SPANS = [
    { n: 'POST /pedidos (gw-loja)', a: 4, b: 4 },
    { n: 'bff-app', a: 6, b: 6 },
    { n: 'pedidos (validar e precificar)', a: 14, b: 14 },
    { n: 'carrinho GET', a: 12, b: 12 },
    { n: 'estoque reservar', a: 20, b: 1640 },
    { n: 'pagamentos (rede + PSP-A)', a: 210, b: 210 },
    { n: 'INSERT em pedidos', a: 6, b: 6 },
    { n: 'publicar no Kafka (PedidoCriado)', a: 3, b: 3 }
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
      var wf = el('div', { class: 'ob-wf', role: 'img', 'aria-label': 'Cascata de spans do pedido 1063' });
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
        fact('Total da requisição', fmt(tot, 0) + ' ms', tot > 800),
        fact('Span mais longo', SPANS[maxI].n + ': ' + fmt(d[maxI], 0) + ' ms'),
        fact('Parte dele no total', fmtPct(share, 1), share > 0.5)
      ]));
      var tp = '00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52-a3c4d5e6f7a8b9c0-01';
      var tp2 = '00-4b7d02c91e6a38f5d0b2a7c9e1f46830-5e2f9a1c7b3d8046-01';
      out.appendChild(el('p', { class: 'sr-sub', text: 'traceparent que o gw-loja manda adiante' }));
      out.appendChild(el('pre', { class: 'ob-tp' }, [el('code', { text: 'traceparent: ' + tp })]));
      if (S.perdeu) {
        out.appendChild(el('p', { class: 'sr-sub', text: 'O consumidor do Kafka não repassa o cabeçalho: abre um trace novo (id de exemplo)' }));
        out.appendChild(el('pre', { class: 'ob-tp' }, [el('code', { text: 'traceparent: ' + tp2 })]));
        out.appendChild(verdict(true, 'O trace partiu ao meio.',
          'A árvore da Lena termina no INSERT (' + fmt(d.slice(0, 7).reduce(function (s, v) { return s + v; }, 0), 0) + ' ms), e o PedidoCriado vira um trace órfão com outro trace_id. Quem abrir o 9c1e5a7b não vê o que veio depois.'));
      } else {
        out.appendChild(verdict(tot > 800,
          tot > 800 ? 'O estoque é quem demora.' : 'Caminho normal.',
          tot > 800 ? 'Os outros 7 spans não mudaram: o estoque passou de 20 para ' + fmt(d[4], 0) + ' ms (20 de trabalho e ' + fmt(Math.max(0, d[4] - 20), 0) + ' de espera por lock) e a requisição, de 275 para ' + fmt(tot, 0) + ' ms. O trace_id é o mesmo em toda a viagem; só o parent_id muda a cada salto.'
            : 'Soma de 275 ms (4 + 6 + 14 + 12 + 20 + 210 + 6 + 3). Escolha o pedido 1063 para ver o estoque esperar pelo lock.'));
      }
      out.appendChild(note('Durações de exemplo do módulo, em fila porque cada span espera o anterior (simplificação). O WARN do estoque carrega o span_id 6d1f0a2b9e3c4a58.'));
    }
    function pick(i) {
      S.lento = i; press(sB, i);
      SPANS.forEach(function (s, j) { fields[j].input.value = String(i ? s.b : s.a); });
      render();
    }
    root.appendChild(chipRow('Pedido', ['Normal (275 ms)', 'O 1063 (1.895 ms)'], sB, pick));
    var ctx = el('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', text: 'Perder o contexto no Kafka' });
    ctx.addEventListener('click', function () { S.perdeu = S.perdeu ? 0 : 1; ctx.setAttribute('aria-pressed', S.perdeu ? 'true' : 'false'); ctx.textContent = S.perdeu ? 'Repassar o contexto no Kafka' : 'Perder o contexto no Kafka'; render(); });
    root.appendChild(el('div', { class: 'ib-ctrl' }, [ctx]));
    root.appendChild(grid);
    root.appendChild(out);
    pick(1);
  }

  /* =============== AULA 5: amostragem =============== */
  function wAmostragem(root) {
    var S = { modo: 0 };
    var tx = slider('Traces por segundo', 1, 60, 1, 30, '/s');
    var hd = slider('Fração guardada (head, e o resto do tail)', 0.1, 100, 0.1, 1, '%', function (v) { return fmt(v, 1); });
    var kb = slider('Tamanho de um trace', 1, 20, 0.2, 4.8, 'KB', function (v) { return fmt(v, 1); });
    var bd = slider('Fração lenta ou com erro (os alvos do tail)', 0.1, 10, 0.1, 0.8, '%', function (v) { return fmt(v, 1); });
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
        fact('Guardar 100%', fmt(gbTudo, 2) + ' GB/dia'),
        fact(S.modo ? 'Tail (' + fmt(p * 100, 1) + '% do resto + 5xx e > 800 ms)' : 'Head (' + fmt(p * 100, 1) + '%)', fmt(gb, 3) + ' GB/dia'),
        fact('Chance de guardar pelo menos um dos ' + LENTOS + ' lentos', fmtPct(chance, 1), chance < 0.5)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Chance de guardar os pedidos lentos' }, [
        bar(S.modo ? 'tail' : 'head', chance, fmtPct(chance, 1), chance < 0.5),
        bar('guardar 100%', 1, '100% · ' + fmt(gbTudo, 1) + ' GB/dia', false)
      ]));
      out.appendChild(verdict(!S.modo && chance < 0.5,
        S.modo ? 'O tail guarda os ' + LENTOS + '.' : (chance < 0.5 ? 'O head joga fora quase todos os lentos.' : 'O head guarda um lento, mas só por sorte.'),
        S.modo ? 'Decide depois de ver o trace inteiro: guarda todo 5xx, todo acima de 800 ms e ' + fmt(p * 100, 1) + '% do resto. O preço é manter os spans num coletor até a requisição acabar.'
          : 'Decide antes de saber se a requisição vai ser lenta: 1 − (1 − ' + fmt(p, 3) + ')^' + LENTOS + ' = ' + fmtPct(chanceHead, 1) + '. Com 1%, são 7,7%. O trace da Lena (um só) é guardado com ' + fmt(p * 100, 1) + '%.'));
      out.appendChild(note('12 spans de ~400 B = 4,8 KB por trace; 30/s × 4,8 KB × 86.400 s = 12,4 GB/dia; 1% = 124 MB/dia. O tail guarda os lentos e os com erro além do resto: aqui, 0,8% das requisições (o episódio do 1063 numa janela).'));
    }
    root.appendChild(chipRow('Quando decidir', ['Head: no começo do trace', 'Tail: depois de ver o trace'], mB, function (i) { S.modo = i; press(mB, i); render(); }));
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
    var dur = slider('Duração do incidente', 10, 600, 10, 90, 's');
    var err = slider('Erro durante o incidente (sem breaker)', 5, 100, 5, 100, '%');
    var thr = slider('Limiar de erro dos alertas A e B', 1, 50, 1, 5, '%');
    var fa = slider('for do alerta A', 0, 600, 15, 300, 's', function (v) { return fmt(v, 0); });
    var fb = slider('for do alerta B', 0, 600, 15, 60, 's', function (v) { return fmt(v, 0); });
    var iv = slider('Intervalo de avaliação', 5, 60, 5, 15, 's');
    var bn = slider('Burn rate que acorda (D)', 2, 40, 0.2, 14.4, '×', function (v) { return fmt(v, 1); });
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
      if (!f) return '∞ (nunca)';
      var a = Math.floor(f[0]), b = Math.ceil(f[1]);
      return a === b ? fmt(a, 0) + ' s' : fmt(a, 0) + ' a ' + fmt(b, 0) + ' s';
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
        if (!f) return 'não dispara';
        return f[0] > D ? 'dispara só depois do fim' : 'dispara';
      }
      function cell(f) { return { text: fmtFaixa(f), cls: !f ? 'ob-bad' : (f[0] > D ? 'ob-bad' : '') }; }
      var rows = [
        { cells: [{ text: 'A: erro > ' + fmt(T * 100, 0) + '% por ' + fmtDur(FA) }, { text: lbl(fA) }, cell(fA), { text: fA ? 'página' : '—' }] },
        { cells: [{ text: 'B: erro > ' + fmt(T * 100, 0) + '% por ' + fmtDur(FB) }, { text: lbl(fB) }, cell(fB), { text: fB ? 'página' : '—' }] },
        { cells: [{ text: 'C: sonda sintética (10 s × 3 falhas)' }, { text: tC ? 'dispara' : 'não dispara' }, { text: tC ? fmt(tC, 0) + ' s' : '∞ (nunca)', cls: tC ? '' : 'ob-bad' }, { text: tC ? 'página' : '—' }] },
        { cells: [{ text: 'D: burn rate ≥ ' + fmt(BR, 1) + '× (1 h e 5 min; SLO ' + fmt(+slo.input.value, 2) + '%)' }, { text: lbl(fD) }, cell(fD), { text: fD ? 'página' : '—' }] },
        { cells: [{ text: 'breaker_state = aberto (causa)' }, { text: tBreaker ? 'dispara' : 'não abre' }, { text: tBreaker ? fmt(tBreaker, 1) + ' s' : '—' }, { text: tBreaker ? 'ticket (causa, não sintoma)' : '—' }] }
      ];
      clear(out);
      out.appendChild(facts([
        fact('Pedidos que falham', fmt(Ftot, 0) + ' de ' + fmt(Ntot, 0), Ftot / Ntot > 0.5),
        fact('Burn rate no incidente', fmt(Ntot ? Ftot / Ntot / ORC : 0, 1) + '×'),
        fact('Burn rate nas janelas de 1 h e de 5 min', fmt(Ftot / (RATE * 3600) / ORC, 2) + '× · ' + fmt(Ftot / (RATE * 300) / ORC, 1) + '×')
      ]));
      out.appendChild(table(['Alerta', 'Resultado', 'MTTD', 'Vira'], rows));
      var algum = !!(fA || fB || tC || fD);
      out.appendChild(verdict(!algum && !S.breaker,
        S.breaker ? (algum ? 'Algo disparou mesmo com as defesas.' : 'Nenhum alerta de página dispara, e não deve.') : (algum ? 'Pelo menos um alerta acorda alguém.' : 'Nenhum alerta pega este incidente.'),
        S.breaker ? 'Com o breaker (abre em 1,3 s) falham só ~' + fmt(Ftot, 0) + ' de ' + fmt(Ntot, 0) + ' pedidos (' + fmtPct(Ftot / Ntot, 2) + '). O estado do breaker é a causa: vira ticket, e o cliente quase não sentiu.'
          : (fA ? 'O alerta A dispara, mas ' + (fA[0] > D ? 'só depois de o incidente acabar.' : 'veja o tempo.') : 'O alerta A (for longo) nunca fecha a janela de ' + fmtDur(FA) + ' num incidente de ' + fmt(D, 0) + ' s. Compare com a sonda (C) e o burn rate (D).')));
      out.appendChild(note('Modelo de 30 pedidos/s. A taxa de erro de A e B é medida na janela do último intervalo de avaliação (simplificação do rate de 1 m). Faixas: a fase da avaliação em relação ao início do incidente muda o resultado em até um intervalo. Padrão do módulo: nunca · 60 a 75 s · 30 s · 52 a 67 s (51,84 s de erro).'));
    }
    function pickB(i) { S.breaker = i; press(bB, i); render(); }
    root.appendChild(chipRow('Defesas do módulo 21', ['Sem breaker nem fallback', 'Com breaker (abre em 1,3 s) e fallback'], bB, pickB));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dur.wrap, err.wrap, thr.wrap, fa.wrap, fb.wrap, iv.wrap, bn.wrap, slo.wrap]));
    [dur, err, thr, fa, fb, iv, bn, slo].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickB(0);
  }

  /* =============== AULA 7: orçamento de erro e burn rate =============== */
  function wOrcamento(root) {
    var SLOS = [99, 99.5, 99.9, 99.95, 99.99];
    var INC = [
      { n: 'PSP-A de 90 s sem proteção (módulo 21)', f: 2700, on: true },
      { n: 'Queda de SP (módulo 27)', f: 643.5, on: false },
      { n: 'Episódio do 1063 (aula 2)', f: 8, on: false }
    ];
    var S = { slo: 2 };
    var sB = [], iB = [];
    var ped = slider('Pedidos por segundo (média)', 1, 30, 1, 5, '/s');
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
        fact('Requisições em 30 dias', fmt(req, 0)),
        fact('Orçamento (' + fmt(orc * 100, 3) + '% ruins)', fmt(bud, 0) + ' requisições · ' + fmt(min, 2) + ' min'),
        fact('Queimado pelos incidentes marcados', fmtPct(pct, 2), pct > 0.5)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Orçamento restante' }, [
        bar('sobra do orçamento', Math.max(0, resta), fmtPct(Math.max(0, resta), 1), resta < 0.1)
      ]));
      var pol = resta > 0.5 ? ['Publicar normal.', 'Sobra mais de 50%: a equipe publica no ritmo de sempre.', false]
        : resta > 0.1 ? ['Só correções e canary lento.', 'Entre 50% e 10%: o que não for correção espera, e o que sai passa por canary lento (módulo 22).', false]
        : resta > 0 ? ['Congelar o que não for correção.', 'Menos de 10%: nada de funcionalidade nova até o orçamento voltar.', true]
        : ['Sala de guerra.', 'O orçamento zerou: prioridade total para a estabilidade, e o SLA com o mkt-01 corre risco.', true];
      out.appendChild(verdict(pol[2], pol[0], pol[1]));
      out.appendChild(el('p', { class: 'sr-sub', text: 'Burn rate: consumo = burn × janela ÷ período' }));
      out.appendChild(table(['Burn × janela', 'Consumo do orçamento', 'Vira'], [
        { cells: [{ text: '14,4× em 1 h' }, { text: fmtPct(14.4 * 1 / 720, 1) }, { text: 'página' }] },
        { cells: [{ text: '6× em 6 h' }, { text: fmtPct(6 * 6 / 720, 1) }, { text: 'página' }] },
        { cells: [{ text: '1× em 3 dias' }, { text: fmtPct(1 * 72 / 720, 1) }, { text: 'ticket' }] },
        { cells: [{ text: fmt(BR, 1) + '× (o do controle)' }, { text: fmt(BR, 1) + '× → acaba em ' + fmtDur(hAcaba * 3600) }, { text: BR >= 6 ? 'página' : 'ticket' }] }
      ]));
      out.appendChild(note('Os incidentes são contas em requisições ruins, e não dependem do SLO: 2.700 (30 × 90 s), 643,5 (9,9 × 65 s, conta simplificada) e 8. A 99,9% e 5 pedidos/s o orçamento é 12.960 (43,2 min): 20,8% · 4,97% · 0,06%. A política é um exemplo.'));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'SLO (janela de 30 dias)' }));
    root.appendChild(chipRow('SLO', SLOS.map(function (v) { return fmt(v, 2) + '%'; }), sB, function (i) { S.slo = i; press(sB, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O que queimou no mês (marque quantos quiser)' }));
    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Incidentes' });
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
          { cells: ['Utilização', '99% na catalogo-3 (as outras 9 a 64%; frota a 67,5%)', estado(true, '', 'vermelho')] },
          { cells: ['Saturação', '64,6 de 86,4 requisições em andamento (Little: 64 req/s × 1,01 s)', estado(true, '', 'vermelho')] },
          { cells: ['Erros', '1% de 504 a 640 req/s', estado(true, '', 'vermelho')] }
        ];
        vis = 'A réplica certa: as três perguntas apontam para a catalogo-3, e a média da frota (67,5%) esconde.';
        nao = 'Se o catálogo devolve o preço certo. O USE não olha o conteúdo.'; bad = true;
      } else if (S.alvo === 1) {
        var on = S.rel;
        rows = [
          { cells: ['Utilização', on ? '100% (40,4 conexões pedidas para um pool de 20)' : '2% (0,4 de 20)', estado(on, 'verde', 'vermelho')] },
          { cells: ['Saturação', on ? 'espera por vaga (db_pool_waiting > 0)' : 'sem espera', estado(on, 'verde', 'vermelho')] },
          { cells: ['Erros', on ? '503 do pool cheio: 33% do checkout e 10% do status' : '0% de 503', estado(on, 'verde', 'vermelho')] }
        ];
        vis = on ? 'O relatório das 23:00 ocupando o pool inteiro: o módulo 25 em três linhas.' : 'Um pool folgado: 0,4 conexões de 20 em uso.';
        nao = 'Qual fluxo está ocupando as conexões. O USE diz que o pool está cheio, não quem o encheu.'; bad = on;
      } else {
        rows = [
          { cells: ['Utilização', 'CPU a 20% · pool a 10%', estado(false, 'verde', '')] },
          { cells: ['Saturação', 'sem fila de CPU nem de pool', estado(false, 'verde', '')] },
          { cells: ['Erros', 'sem OOMKill, sem 503 de pool', estado(false, 'verde', '')] }
        ];
        vis = 'Que todos os recursos estão bem.';
        nao = 'O frete 0,00 em Recife: o defeito está no serviço, e o método só olha recursos.'; bad = true;
      }
      out.appendChild(table(['Pergunta do USE', 'Valor', 'Estado'], rows));
      out.appendChild(el('div', { class: 'ob-two' }, [
        el('p', null, [el('strong', { text: 'O USE enxerga: ' }), vis]),
        el('p', null, [el('strong', { text: 'O USE não enxerga: ' }), nao])
      ]));
      out.appendChild(verdict(bad && S.alvo === 2, S.alvo === 2 ? 'Verde e errado.' : 'Leitura do USE.',
        S.alvo === 2 ? 'Todo recurso está bem e a 2.5.0 segue devolvendo frete 0,00: é o limite do método. A aula 9 cobre o serviço.' : 'U, S e E se preenchem para cada recurso, e depois se agregam. A média da frota esconde a réplica a 99%.'));
    }

    function renderRed() {
      clear(out);
      var v25 = S.alvo === 1;
      var errSem = S.sem === 1;
      var d = S.perc ? 'p95 489 ms' : 'média 311 ms';
      var errTxt = !v25 ? '0% (nada errado)' : (errSem ? '20% dos pedidos com frete 0,00 (os de Recife)' : '0% de 5xx');
      var errBad = v25 && errSem;
      var rows = [
        { cells: ['Rate', '3,6 pedidos/s na celula-recife (30/s na loja)', { text: 'verde', cls: 'ob-ok' }] },
        { cells: ['Errors', errTxt, estado(errBad, 'verde', 'vermelho')] },
        { cells: ['Duration', d + ' (igual nas duas versões)', { text: 'verde', cls: 'ob-ok' }] }
      ];
      out.appendChild(table(['Pergunta do RED', 'pedidos ' + (v25 ? '2.5.0' : '2.4.0'), 'Estado'], rows));
      out.appendChild(el('div', { class: 'ob-two' }, [
        el('p', null, [el('strong', { text: 'O RED enxerga: ' }), 'quantas requisições, quantas falham (pela definição de erro escolhida) e quanto demoram, por rota, por versão e por célula.']),
        el('p', null, [el('strong', { text: 'O RED não enxerga: ' }), errSem ? 'a causa do frete 0,00: aponta o serviço e a versão, e o trace e o log explicam.' : 'o frete 0,00, enquanto o erro for só 5xx.'])
      ]));
      out.appendChild(verdict(v25 && !errSem,
        v25 && !errSem ? 'A 2.5.0 fica verde.' : (v25 ? 'Agora a 2.5.0 aparece.' : 'A 2.4.0 está certa.'),
        v25 && !errSem ? 'Com erro = só 5xx (e ' + (S.perc ? 'percentil' : 'média') + '), Rate, Errors e Duration não mudam: a loja perde R$ 15,00 por pedido em Recife sem nenhum painel vermelho. Ligue o erro semântico.'
          : (v25 ? 'Com o erro definido pelo domínio (frete 0,00 é erro), o Errors da 2.5.0 mostra 20% dos pedidos, no mix do módulo 22. O corte por versão aponta o culpado.'
            : 'Na 2.4.0 os três painéis estão verdes e dizem a verdade. Mude para a 2.5.0.')));
    }

    function renderGolden() {
      clear(out);
      var f = S.bk ? S.falha / 100 : 0;
      var media = f * 2 + (1 - f) * 275;
      out.appendChild(el('p', { class: 'sr-sub', text: 'Latência: média × sucesso × erro' }));
      out.appendChild(facts([
        fact('Latência média (a que um painel simples mostra)', fmt(media, 1) + ' ms', false),
        fact('Latência do sucesso', '275 ms'),
        fact('Latência do erro (breaker aberto)', S.bk ? '2 ms' : '—')
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Latência média comparada à do sucesso' }, [
        bar('média', media / 300, fmt(media, 0) + ' ms', false),
        bar('sucesso', 275 / 300, '275 ms', false)
      ]));
      out.appendChild(verdict(S.bk && f > 0,
        S.bk && f > 0 ? 'A média melhorou enquanto o sistema piorou.' : 'Sem falhas rápidas, média e sucesso coincidem.',
        S.bk && f > 0 ? fmtPct(f, 0) + ' falham em 2 ms e ' + fmtPct(1 - f, 0) + ' respondem em 275: ' + fmt(f, 2) + ' × 2 + ' + fmt(1 - f, 2) + ' × 275 = ' + fmt(media, 1) + ' ms. Só a curva do sucesso, separada, continua em 275, e a dos erros mostra o problema.'
          : 'Ponha o breaker aberto: 30% de falha em 2 ms derrubam a média de 275 para 193 ms.'));
      var rows = [
        { cells: ['catalogo-3 a 99%, com fila', { text: 'sim (U e S)', cls: 'ob-ok' }, { text: 'só se cortar por réplica' }, { text: 'sim (saturação)', cls: 'ob-ok' }] },
        { cells: ['Pool cheio (503)', { text: 'sim (U, S e E)', cls: 'ob-ok' }, { text: 'sim (Errors)', cls: 'ob-ok' }, { text: 'sim (erros e saturação)', cls: 'ob-ok' }] },
        { cells: ['Frete 0,00 (a 2.5.0)', { text: 'não', cls: 'ob-bad' }, { text: 'só com erro semântico', cls: 'ob-bad' }, { text: 'só com o 200 errado nos Erros', cls: 'ob-bad' }] },
        { cells: ['Breaker aberto, 30% de falha em 2 ms', { text: 'não (recursos ok)', cls: 'ob-bad' }, { text: 'sim (Errors 30%)', cls: 'ob-ok' }, { text: 'sim (latência separada)', cls: 'ob-ok' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'O que cada lente enxerga' }));
      out.appendChild(table(['Situação', 'USE (recurso)', 'RED (serviço)', 'Quatro sinais (usuário)'], rows));
      out.appendChild(note('RED = Rate + Errors + Duration; os quatro sinais = RED + Saturação, no nível do serviço. USE olha o recurso, RED o serviço e os quatro sinais o usuário. A leitura "só com…" depende de definir o erro pelo domínio.'));
    }

    function render() { if (modo === 'use') renderUse(); else if (modo === 'red') renderRed(); else renderGolden(); }

    if (modo === 'use') {
      root.appendChild(chipRow('Recurso ou serviço', ['catalogo-3 (Black Friday, 20:03)', 'Pool de 20 conexões', 'pedidos 2.5.0 (frete 0,00)'], tB, function (i) { S.alvo = i; press(tB, i); render(); }));
      root.appendChild(chipRow('Relatório das 23:00 (para o pool)', ['Desligado', 'Ligado'], rB, function (i) { S.rel = i; press(rB, i); S.alvo = 1; press(tB, 1); render(); }));
      press(tB, 0); press(rB, 1);
    } else if (modo === 'red') {
      root.appendChild(chipRow('Versão do pedidos', ['2.4.0', '2.5.0 (frete 0,00 em Recife)'], tB, function (i) { S.alvo = i; press(tB, i); render(); }));
      root.appendChild(chipRow('Definição de erro', ['Só 5xx', 'Semântica (o frete 0,00 é erro)'], eB, function (i) { S.sem = i; press(eB, i); render(); }));
      root.appendChild(chipRow('Duration', ['Média', 'Percentil (de histograma)'], dB, function (i) { S.perc = i; press(dB, i); render(); }));
      S.alvo = 1; press(tB, 1); press(eB, 0); press(dB, 1);
    } else {
      root.appendChild(chipRow('Breaker do módulo 21', ['Fechado', 'Aberto (30% falham em 2 ms)'], tB, function (i) { S.bk = i; press(tB, i); render(); }));
      var fl = slider('Falhas rápidas (com o breaker aberto)', 5, 80, 5, 30, '%');
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
