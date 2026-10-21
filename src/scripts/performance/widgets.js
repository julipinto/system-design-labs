/* SDLabs · Performance, Capacidade e Escalabilidade: widgets em JS puro
   (percentis e média, curva do joelho, cadeia de capacidade, queda de réplicas com vertical × horizontal, calculadora do HPA).
   Usam a loja do brief: amostra de 100 requisições das 20:03 (640 req/s), catálogo com 100 req/s por réplica (R = 10 + 10 ÷ (1 − ρ)),
   checkout em pedidos/s (pedidos 90, pagamentos 40, estoque 1.000, banco 150), HPA com alvo de 70%. */
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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d }); }
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
      name: 'com a catalogo-3 (20:03)',
      hot: true,
      values: expand([[20, 26], [30, 32], [25, 40], [10, 55], [5, 74],
        [1, 150], [1, 300], [1, 450], [1, 600], [1, 800], [1, 1000], [1, 1200], [1, 1500], [1, 2000], [1, 2100]]),
      rows: [
        ['9 réplicas saudáveis (64%)', '20 × 26 · 30 × 32 · 25 × 40 · 10 × 55 · 5 × 74'],
        ['catalogo-3 (99%)', '150 · 300 · 450 · 600 · 800 · 1.000 · 1.200 · 1.500 · 2.000 · 2.100']
      ],
      perReplicaP99: [55, 55, 55, 55, 74, 74, 74, 74, 74, 2100]
    },
    {
      name: 'sem a catalogo-3 (depois de corrigir)',
      hot: false,
      values: expand([[20, 28], [30, 34], [25, 42], [15, 56], [8, 58], [2, 73]]),
      rows: [['todas a 67,5%', '20 × 28 · 30 × 34 · 25 × 42 · 15 × 56 · 8 × 58 · 2 × 73']],
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
        fact('Média', fmt(avg) + ' ms'),
        fact('p50 (posto 50)', nearestRank(v, 50) + ' ms'),
        fact('p90 (posto 90)', nearestRank(v, 90) + ' ms'),
        fact('p95 (posto 95)', fmt(p95, 0) + ' ms'),
        fact('p99 (posto 99)', fmt(p99, 0) + ' ms'),
        fact('Máximo', fmt(v[n - 1], 0) + ' ms'),
        fact('Erros (acima de 2.000 ms)', errs + ' de ' + n + ' = ' + fmt(errs / n * 100) + '%')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('média', avg, 2200, fmt(avg) + ' ms', avg > META ? 'win' : ''),
        bar('p95', p95, 2200, fmt(p95, 0) + ' ms', p95 > META ? 'win' : ''),
        bar('p99', p99, 2200, fmt(p99, 0) + ' ms', p99 > META ? 'win' : ''),
        bar('meta (p95)', META, 2200, META + ' ms', '')
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Barra em laranja = acima da meta de 300 ms.' }));
      out.appendChild(verdict(avg > META,
        'Painel da média: ' + (avg > META ? 'vermelho.' : 'verde.'),
        'A média é ' + fmt(avg) + ' ms contra a meta de ' + META + ' ms.'));
      out.appendChild(verdict(p95 > META,
        'Painel do p95: ' + (p95 > META ? 'vermelho.' : 'verde.'),
        'O p95 é ' + fmt(p95, 0) + ' ms contra a meta de ' + META + ' ms.'
          + (s.hot ? ' É o painel que mostra que a Lena esperou 2 s.' : ' Todas as réplicas respondem no mesmo ritmo.')));
      if (s.perReplicaP99) {
        var tot = 0;
        s.perReplicaP99.forEach(function (x) { tot += x; });
        var m = tot / s.perReplicaP99.length;
        out.appendChild(verdict(true, 'Média dos p99 por réplica: ' + fmt(m, 0) + ' ms.',
          'Cada réplica reporta o seu p99 (com 10 requisições é o máximo dela) e o painel tira a média. O p99 verdadeiro da frota, sobre as 100 requisições juntas, é ' + fmt(p99, 0) + ' ms. Percentil não se soma nem se tira média: junta-se o histograma e calcula-se de novo.'));
      }
      out.appendChild(table(['Grupo', 'Tempos no lb-loja (ms)'], s.rows.map(function (r) { return { cells: [{ text: r[0] }, { text: r[1] }] }; })));
      out.appendChild(el('p', { class: 'sr-note', text: 'Método do posto mais próximo (nearest-rank): o percentil p é o valor na posição ⌈p% × n⌉ da amostra ordenada, com n = 100. Com 100 amostras o p99 é só o 99º valor e se move com uma requisição; ele só se estabiliza com mil ou mais.' }));
    }
    root.appendChild(chipRow('Amostra', SAMPLES.map(function (s) { return s.name; }), btns, function (i) { S.i = i; press(btns, i); render(); }));
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 3: a curva do joelho =============== */
  function wJoelho(root) {
    var btns = [], S = { m: 1 };
    var rep = slider('Réplicas', 1, 20, 1, 10);
    var util = slider('Utilização de CPU (ρ)', 0, 99, 1, 64, '%');
    var rps = slider('Tráfego', 0, 1000, 10, 640, 'req/s');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var rho = 0.64, lam = 640;
    function render() {
      var n = +rep.input.value, cap = n * 100;
      if (S.m === 0) { rho = +util.input.value / 100; lam = rho * cap; }
      else { lam = +rps.input.value; rho = lam / cap; }
      clear(out);
      var sat = rho >= 1, r = sat ? Infinity : resp(rho);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Capacidade', fmt(cap, 0) + ' req/s'),
        fact('Tráfego', fmt(lam, 0) + ' req/s'),
        fact('Utilização ρ', sat ? '≥ 100%' : pct(rho)),
        fact('Resposta R(ρ)', sat ? 'sem limite' : fmt(r) + ' ms'),
        fact('Em andamento (Little)', sat ? 'a fila cresce' : fmt(lam * r / 1000) + ' requisições')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('R(ρ)', sat ? 1010 : Math.min(r, 1010), 1010, sat ? 'satura' : fmt(r) + ' ms', rho > 0.7 ? 'win' : '')
      ]));
      var head, say, bad = false;
      if (sat) { bad = true; head = 'Saturado.'; say = 'A demanda de ' + fmt(lam, 0) + ' req/s passa da capacidade de ' + fmt(cap, 0) + ': a fila cresce ' + fmt(lam - cap, 0) + ' req/s, ' + fmt((lam - cap) * 60, 0) + ' por minuto.'; }
      else if (rho > 0.9) { bad = true; head = 'Joelho da curva.'; say = 'Acima de 90% cada ponto a mais custa dezenas de ms: aos 99% a resposta é 1.010 ms, a ordem de grandeza do "2 s" da Black Friday.'; }
      else if (rho > 0.7) { bad = true; head = 'Acima do limite seguro.'; say = 'O limite de 70% passou. A resposta ainda é aceitável, mas a folga acabou.'; }
      else { head = 'Dentro da faixa segura.'; say = 'Até 70% a resposta fica em 43,3 ms ou menos: a fila quase não existe.'; }
      out.appendChild(verdict(bad, head, say));
      var ref = [0, 0.4, 0.5, 0.64, 0.675, 0.7, 0.8, 0.9, 0.95, 0.99];
      out.appendChild(table(['ρ', 'R (ms)'], ref.map(function (x) {
        return { cls: Math.abs(x - rho) < 0.0001 ? 'cr-cur' : '', cells: [{ text: pct(x, 1) }, { text: fmt(resp(x), 1) }] };
      }), 'pf-narrow'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Modelo de brinquedo (fila M/M/1 simplificada): R(ρ) = 10 ms de CPU + 10 ms ÷ (1 − ρ). Supõe réplicas iguais; por isso os 86,4 em andamento da aula (com a catalogo-3 quente, resposta média de 135 ms) são diferentes dos que aparecem aqui.' }));
    }
    function setMode(i) {
      S.m = i; press(btns, i);
      util.wrap.hidden = i !== 0; rps.wrap.hidden = i !== 1;
      render();
    }
    root.appendChild(chipRow('Controlar por', ['utilização', 'req/s'], btns, setMode));
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
    { k: 'banco', name: 'banco do pedidos', per: 150, cost: 0, scale: false, init: 1 }
  ];
  function wCadeia(root) {
    var btns = [];
    var dem = slider('Demanda', 1, 200, 1, 60, 'pedidos/s');
    var sl = {};
    ELOS.forEach(function (e) { if (e.scale) sl[e.k] = slider('Réplicas de ' + e.name, 1, 10, 1, e.init); });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: '30 pedidos/s (hoje)', d: 30, r: [3, 2, 2] },
      { t: '60 pedidos/s (dobrada)', d: 60, r: [3, 2, 2] },
      { t: '60, estoque ×2', d: 60, r: [3, 2, 4] },
      { t: '60, pagamentos ×2', d: 60, r: [3, 4, 2] },
      { t: '100, pagamentos ×2', d: 100, r: [3, 4, 2] },
      { t: '200, tudo escalado', d: 200, r: [6, 8, 2] }
    ];

    function render() {
      var D = +dem.input.value, caps = {};
      ELOS.forEach(function (e) { caps[e.k] = e.scale ? +sl[e.k].input.value * e.per : e.per; });
      /* o pedido é gravado no banco antes do pagamento; cada elo recebe o que o anterior deixou passar */
      var order = ['pedidos', 'banco', 'pagamentos', 'estoque'], inflow = {}, flow = D;
      order.forEach(function (k) { inflow[k] = flow; flow = Math.min(flow, caps[k]); });
      var saida = flow, minCap = Math.min(caps.pedidos, caps.pagamentos, caps.estoque, caps.banco);
      var represa = D - saida, gargalo = [];
      if (D > minCap) ELOS.forEach(function (e) { if (caps[e.k] === minCap) gargalo.push(e.name); });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Entra', fmt(D, 0) + '/s'),
        fact('Sai', fmt(saida, 0) + '/s'),
        fact('Represado', fmt(represa, 0) + '/s'),
        fact('Fila em 60 s', fmt(represa * 60, 0) + ' pedidos'),
        fact('Degradação', fmt(represa / D * 100, 0) + '%')
      ]));
      var rows = ELOS.map(function (e) {
        var rho = inflow[e.k] / caps[e.k], hot = gargalo.indexOf(e.name) >= 0;
        var r = e.cost && rho < 1 ? fmt(e.cost / (1 - rho), 0) + ' ms' : (e.cost ? 'satura' : 'medido na carga');
        return { cls: hot ? 'dl-wait' : '', cells: [
          { text: e.name },
          { text: e.scale ? sl[e.k].input.value + ' × ' + e.per + '/s' : '1 primário' },
          { text: fmt(caps[e.k], 0) + '/s' },
          { text: fmt(inflow[e.k], 0) + '/s' },
          { text: fmt(Math.min(rho, 9.99) * 100, 0) + '%' + (rho > 1 ? ' (satura)' : ''), cls: hot ? 'pf-cell bad' : 'pf-cell' },
          { text: r }
        ] };
      });
      out.appendChild(table(['elo', 'réplicas × por réplica', 'capacidade', 'recebe', 'utilização', 'resposta do elo'], rows, 'pf-wide'));
      if (gargalo.length) out.appendChild(verdict(true, 'Gargalo: ' + gargalo.join(' e ') + '.',
        'A saída é a capacidade do elo mais fraco, ' + fmt(minCap, 0) + '/s, e ' + fmt(represa, 0) + ' pedidos por segundo viram fila ou erro. Escalar um elo que não é esse não muda a saída.'));
      else out.appendChild(verdict(false, 'Sem gargalo.', 'Todos os elos dão conta da demanda. O elo mais fraco é o de ' + fmt(minCap, 0) + '/s, e a folga até ele é de ' + fmt(minCap - D, 0) + ' pedidos/s.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacidade = réplicas × por réplica (CPU por pedido: pedidos 33 ms = 30/s, pagamentos 50 ms = 20/s, estoque 2 ms = 500/s). O banco é um primário só: réplicas de serviço não o escalam. A resposta do elo usa custo ÷ (1 − utilização), o mesmo modelo da curva. O pedido passa por pedidos, é gravado no banco, depois paga e baixa o estoque.' }));
    }
    root.appendChild(chipRow('Cenário', PRESETS.map(function (p) { return p.t; }), btns, function (j) {
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
    var dem = slider('Demanda', 100, 1200, 10, 640, 'req/s');
    var rep = slider('Réplicas', 1, 20, 1, 10);
    var per = slider('Capacidade por réplica', 25, 200, 5, 100, 'req/s');
    var fall = slider('Réplicas que caem', 0, 19, 1, 0);
    var vc = slider('vCPU da réplica vertical', 1, 16, 1, 8);
    var ser = slider('Parte que não paraleliza', 0, 25, 0.01, 4.76, '%');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });

    function render() {
      var D = +dem.input.value, n = +rep.input.value, c = +per.input.value;
      fall.input.max = String(Math.max(0, n - 1));
      if (+fall.input.value > n - 1) fall.set(Math.max(0, n - 1));
      var k = +fall.input.value;
      var alive = n - k, cap = alive * c, rho = D / cap, sat = rho >= 1;
      clear(out);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Horizontal: a frota perde réplicas' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Vivas', alive + ' de ' + n),
        fact('Capacidade', fmt(cap, 0) + ' req/s'),
        fact('Utilização ρ', pct(rho)),
        fact('Resposta', sat ? 'sem limite' : fmt(resp(rho)) + ' ms')
      ]));
      if (sat) out.appendChild(verdict(true, 'Satura.', 'Faltam ' + fmt(D - cap, 0) + ' req/s: a fila cresce ' + fmt((D - cap) * 60, 0) + ' requisições por minuto e as respostas passam do timeout de 2 s.'));
      else out.appendChild(verdict(rho > 0.7, rho > 0.7 ? 'Acima de 70%.' : 'Cabe.', 'Com ' + alive + ' réplicas a utilização é ' + pct(rho) + ' e a resposta, ' + fmt(resp(rho)) + ' ms. ' + (rho > 0.7 ? 'A folga de segurança acabou.' : 'Sobra folga (o N+k da frota).')));
      var rows = [];
      for (var j = 0; j < Math.min(n, 7); j++) {
        var cp = (n - j) * c, r = D / cp;
        rows.push({ cls: j === k ? 'cr-cur' : '', cells: [{ text: j + ' caída' + (j === 1 ? '' : 's') }, { text: fmt(cp, 0) + ' req/s' }, { text: pct(r) + (r >= 1 ? ' (satura)' : '') }, { text: r >= 1 ? 'fila de ' + fmt(D - cp, 0) + '/s' : fmt(resp(r)) + ' ms' }] });
      }
      out.appendChild(table(['caem', 'capacidade', 'utilização', 'resposta'], rows, 'pf-wide'));

      var s = +ser.input.value / 100, v = +vc.input.value, sp = amdahl(s, v);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Vertical: uma réplica de ' + v + ' vCPU' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Ganho (Amdahl)', fmt(sp, 2) + '×'),
        fact('Capacidade', fmt(sp * 100, 0) + ' req/s'),
        fact('Por vCPU', fmt(sp * 100 / v, 0) + ' req/s'),
        fact('Horizontal, mesmos vCPU', fmt(v * 100, 0) + ' req/s'),
        fact('Se a réplica cai', 'perde 100%')
      ]));
      var bars = [1, 2, 4, 8, 16, 32].map(function (x) {
        var g = amdahl(s, x);
        return bar(x + ' vCPU', g, 32, fmt(g, 1) + '×', x === v ? 'win' : '');
      });
      out.appendChild(el('div', { class: 'sr-bars' }, bars));
      out.appendChild(el('p', { class: 'sr-note', text: 'Ganho = 1 ÷ (s + (1 − s) ÷ n), com s a parte que não paraleliza. Com s = 1/21 (4,76%, a do relatorios do módulo 11) o teto é 21× e 8 vCPU dão 6,0×: 600 req/s, e não 800. As barras vão a 32×, o tamanho da escala.' }));
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
    var cur = field('Réplicas atuais', 10, { min: '1', max: '1000', step: '1' });
    var met = field('Métrica atual (média dos pods)', 95, { min: '0', step: 'any' });
    var tgt = field('Alvo', 70, { min: '1', step: 'any' });
    var tol = field('Tolerância (%)', 10, { min: '0', max: '100', step: '1' });
    var mn = field('Mínimo de réplicas', 1, { min: '1', step: '1' });
    var mx = field('Máximo de réplicas', 100, { min: '1', step: '1' });
    var dMet = slider('Atraso da métrica', 0, 60, 5, 15, 's');
    var dDec = slider('Período de decisão', 5, 60, 5, 15, 's');
    var dPod = slider('Pod ficar pronto', 0, 120, 5, 30, 's');
    var capRep = slider('Capacidade por réplica', 25, 200, 5, 100, 'req/s');
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });

    var PRESETS = [
      { t: 'pico de 95%', n: 10, m: 95, a: 70, cpu: true },
      { t: 'média 67,5% (alvo 70%)', n: 10, m: 67.5, a: 70, cpu: true },
      { t: 'média 67,5% (alvo 80%)', n: 10, m: 67.5, a: 80, cpu: true },
      { t: 'média 67,5% (alvo 60%)', n: 10, m: 67.5, a: 60, cpu: true },
      { t: 'pico de 1.100 req/s', n: 10, m: 110, a: 70, cpu: true },
      { t: 'artigo: 6 réplicas a 100%', n: 6, m: 100, a: 80, cpu: true },
      { t: 'artigo: 6 réplicas a 200%', n: 6, m: 200, a: 80, cpu: true },
      { t: 'vazão: 950 req/s, 70 por réplica', n: 10, m: 95, a: 70, cpu: false }
    ];
    function render() {
      var n = Math.max(1, Math.round(+cur.input.value) || 1), m = +met.input.value || 0, a = +tgt.input.value || 1;
      var t = (+tol.input.value || 0) / 100, lo = Math.max(1, Math.round(+mn.input.value) || 1), hi = Math.max(lo, Math.round(+mx.input.value) || lo);
      var ratio = m / a, inTol = Math.abs(ratio - 1) <= t;
      var raw = n * ratio, want = inTol ? n : Math.ceil(raw - 1e-9);
      var fin = Math.max(lo, Math.min(hi, want));
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Razão atual ÷ alvo', fmt(ratio, 3)),
        fact('Atuais × razão', fmt(raw, 2)),
        fact('Com ceil', inTol ? 'ignorado (tolerância)' : String(Math.ceil(raw - 1e-9))),
        fact('Réplicas desejadas', String(fin))
      ]));
      var after = fin ? m * n / fin : 0;
      var unit = S.cpu ? '%' : ' req/s por réplica';
      var say;
      if (inTol) say = 'A razão ' + fmt(ratio, 3) + ' está a menos de ' + fmt(t * 100, 0) + '% de 1,0: o HPA não faz nada, e ' + n + ' réplicas ficam como estão.';
      else if (fin > n) say = 'Sobe de ' + n + ' para ' + fin + ' (a política padrão permite +4 pods ou +100% a cada 15 s, a maior).' + (fin !== want ? ' O máximo de ' + hi + ' limitou.' : '');
      else if (fin < n) say = 'Desce de ' + n + ' para ' + fin + ', depois da janela de estabilização de 300 s. Se a média esconde uma réplica quente, é no pior momento.';
      else say = 'Mantém ' + n + ' réplicas' + (want !== n ? ' (limite de mínimo ou máximo)' : '') + '.';
      out.appendChild(verdict(!inTol && fin < n, inTol ? 'Dentro da tolerância.' : fin > n ? 'Escala para cima.' : fin < n ? 'Escala para baixo.' : 'Sem mudança.', say));
      if (!inTol && fin !== n) out.appendChild(el('p', { class: 'sr-note', text: 'Depois, com a mesma carga: ' + fmt(after, 1) + unit + ' em cada uma das ' + fin + ' réplicas' + (S.cpu ? ' (resposta de ' + (after < 100 ? fmt(resp(after / 100)) + ' ms' : 'sem limite') + ').' : '.') }));

      /* a linha do tempo de reação e as requisições perdidas */
      var cap = +capRep.input.value, demand = S.cpu ? m / 100 * n * cap : m * n;
      var react = +dMet.input.value + +dDec.input.value + +dPod.input.value;
      var over = Math.max(0, demand - n * cap), lost = over * react, total = demand * react;
      out.appendChild(el('p', { class: 'sr-sub', text: 'Reação: do pico até a réplica pronta' }));
      out.appendChild(table(['etapa', 'tempo', 'acumulado'], [
        { cells: [{ text: 'a métrica chega' }, { text: dMet.input.value + ' s' }, { text: dMet.input.value + ' s' }] },
        { cells: [{ text: 'o HPA decide' }, { text: dDec.input.value + ' s' }, { text: (+dMet.input.value + +dDec.input.value) + ' s' }] },
        { cells: [{ text: 'o pod fica pronto' }, { text: dPod.input.value + ' s' }, { text: react + ' s' }] }
      ]));
      out.appendChild(verdict(lost > 0,
        lost > 0 ? 'Perdidas: ' + fmt(lost, 0) + ' requisições.' : 'Sem perda.',
        lost > 0 ? 'Demanda de ' + fmt(demand, 0) + ' req/s contra capacidade de ' + fmt(n * cap, 0) + ': ' + fmt(over, 0) + ' req/s a mais × ' + react + ' s = ' + fmt(lost, 0) + ' recusadas ou atrasadas, ' + fmt(lost / total * 100) + '% das ' + fmt(total, 0) + ' do período.'
          : 'A demanda de ' + fmt(demand, 0) + ' req/s cabe na capacidade de ' + fmt(n * cap, 0) + ' durante os ' + react + ' s de reação.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Pods ainda não prontos entram na média como 0% de uso (documentação do Kubernetes), o que amortece a subida seguinte. A utilização de CPU é a % dos requests do pod, em média entre os pods. Aqui 100% de CPU = a capacidade por réplica.' }));
    }
    function preset(j) {
      var p = PRESETS[j];
      cur.input.value = p.n; met.input.value = p.m; tgt.input.value = p.a; S.cpu = p.cpu;
      press(unitBtns, p.cpu ? 0 : 1); press(btns, j); render();
    }
    root.appendChild(chipRow('Cenário', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(chipRow('Unidade da métrica', ['CPU (%)', 'req/s por réplica'], unitBtns, function (i) { S.cpu = i === 0; press(unitBtns, i); press(btns, -1); render(); }));
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
