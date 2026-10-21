/* SDLabs · Modelos de Deployment: widgets em JS puro
   (rolling update, raio de explosão por modelo, poder estatístico do canary, migration com lock_timeout,
   bucket da flag e anéis por shard).
   Usam a loja do brief: pedidos 2.4.0 → 2.5.0, terça 14:00, 5 pedidos/s (SP 55%, Rio 25%, Recife 20%),
   pod pronto em 30 s, frete perdido de R$ 15,00 por pedido de Recife, anéis shard-0/1/2 com 20/20/60%. */
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
  function brl(v) { return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

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

  /* =============== AULA 3: rolling update =============== */
  // Resolve maxSurge/maxUnavailable como o Kubernetes: percentual arredonda para cima (surge) e para baixo (unavailable).
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
    var nr = slider('Réplicas', 1, 20, 1, 3, '', function (v) { return String(v); });
    var ms = textInput('maxSurge (número ou %)', '25%');
    var mu = textInput('maxUnavailable (número ou %)', '25%');
    var tr = slider('Pod pronto em', 5, 120, 5, 30, 's', function (v) { return String(v); });
    var dm = slider('Demanda', 1, 2000, 1, 5, 'req/s', function (v) { return fmt(v, 0); });
    var cp = slider('Capacidade por pod', 1, 200, 1, 30, 'req/s', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var n = +nr.input.value, T = +tr.input.value, D = +dm.input.value, C = +cp.input.value;
      var s = resolve(ms.input.value, n, true), u = resolve(mu.input.value, n, false);
      clear(out);
      if (s == null || u == null) {
        out.appendChild(verdict(true, 'Valor inválido.', 'Use um número inteiro (1) ou uma porcentagem (25%) em maxSurge e maxUnavailable.'));
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
        fact('Ondas', fmt(r.waves, 0) + ' × ' + T + ' s'),
        fact('Tempo total', dur(r.time)),
        fact('Mínimo de prontos', fmt(r.minReady, 0) + ' de ' + n),
        fact('Utilização no mínimo', rho >= 1 ? fmt(rho * 100, 1) + '%' : fmt(rho * 100, 1) + '%'),
        fact('Resposta no mínimo', resp == null ? 'satura' : fmt(resp, 1) + ' ms')
      ]));
      var bad = rho >= 1 || rho > 0.9;
      var say = rho >= 1
        ? 'Com ' + r.minReady + ' pod' + (r.minReady === 1 ? '' : 's') + ' prontos a capacidade é ' + fmt(r.minReady * C, 0) + ' req/s, abaixo da demanda de ' + fmt(D, 0) + ': a fila cresce durante a troca.'
        : 'No pior instante restam ' + r.minReady + ' pods prontos e a CPU fica em ' + fmt(rho * 100, 1) + '%. A troca leva ' + dur(r.time) + ' e o tráfego da 2.5.0 vai 0% → … → 100% pela fatia de pods.';
      out.appendChild(verdict(bad, bad ? 'Margem curta.' : 'Troca sem sufoco.', say));
      if (forced) out.appendChild(note('Com os dois em 0 o Kubernetes não deixaria nenhum pod trocar: o widget usou maxUnavailable 1.'));
      out.appendChild(note('Resposta = 10 + 10 ÷ (1 − utilização) ms, o modelo do módulo 14. Presets: pedidos (3 pods: 1 e 0, 90 s) e catalogo (10 pods: 3 e 2, mínimo de 8 prontos, 80%, 60 ms; com maxUnavailable 3: 91,4%, 126,7 ms).'));
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

  /* =============== AULA 1: raio de explosão por modelo =============== */
  var MODELOS = [
    { v: 'recreate', t: 'Recreate' },
    { v: 'rolling', t: 'Rolling (3 pods)' },
    { v: 'bg-com', t: 'Blue/Green, teste inclui Recife' },
    { v: 'bg-sem', t: 'Blue/Green, teste sem Recife' },
    { v: 'canary', t: 'Canary 10% (análise de negócio)' },
    { v: 'shadow', t: 'Shadow 10%' },
    { v: 'flag', t: 'Feature flag a 10%' }
  ];
  function wRaio(root) {
    var md = select('Modelo', MODELOS, 'rolling');
    var rps = slider('Pedidos por segundo', 1, 60, 1, 5, '/s', function (v) { return String(v); });
    var rec = slider('Parcela de Recife', 0, 100, 1, 20, '%', function (v) { return String(v); });
    var val = slider('Frete perdido por pedido', 0, 50, 0.5, 15, '', function (v) { return brl(v); });
    var min = slider('Minutos até alguém perceber', 1, 600, 1, 60, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var R = +rps.input.value, P = +rec.input.value / 100, V = +val.input.value, M = +min.input.value, m = md.input.value;
      var affected = 0, back = '', who = '', recusados = 0, expo = '100%';
      var full = R * P * M * 60;
      if (m === 'recreate') { affected = full; back = '40 s, de novo fora do ar'; who = 'ninguém: a 2.5.0 é saudável'; recusados = R * 40; }
      else if (m === 'rolling') { affected = full; back = '90 s (outro rolling)'; who = 'ninguém: o único portão é o readiness'; }
      else if (m === 'bg-com') { affected = 0; back = '~1 s com o blue de pé (~30 s se já saiu)'; who = 'o teste de fumaça do green, que inclui um pedido para Recife'; expo = '0% (só o teste)'; }
      else if (m === 'bg-sem') { affected = full; back = '~1 s com o blue de pé (~30 s se já saiu)'; who = 'ninguém: o teste do green não olha Recife'; }
      else if (m === 'canary') { affected = R * 0.1 * Math.min(300, M * 60) * P; back = 'segundos (o peso volta a 0)'; who = 'a análise com métrica de negócio (frete_zero por cidade)'; expo = '10% por até 5 min'; }
      else if (m === 'shadow') { affected = 0; back = 'n/a: nenhum cliente foi exposto'; who = 'o comparador (diff 64,00 × 49,00)'; expo = '0% (só cópia)'; }
      else { affected = R * 0.1 * Math.min(300, M * 60) * P; back = 'até 30 s (o TTL do cache da flag)'; who = 'a mesma métrica, por bucket'; expo = '10% dos clientes por hash'; }
      var loss = affected * V;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Exposição da 2.5.0', expo),
        fact('Pedidos de Recife com frete 0', fmt(affected, 0)),
        fact('Perda', brl(loss)),
        fact('Tempo para voltar', back),
        fact('Quem percebe', who)
      ]));
      if (m === 'recreate') out.appendChild(note('Além disso, o Recreate recusa ' + fmt(recusados, 0) + ' pedidos nos 40 s sem atender.'));
      var bad = loss >= 10000;
      out.appendChild(verdict(bad, loss === 0 ? 'Nenhum pedido errado.' : bad ? 'Estrago grande.' : 'Estrago contido.',
        'Raio de explosão = fração do tráfego exposta × tempo até alguém perceber × custo por pedido errado. Aqui: ' +
        (loss === 0 ? 'o defeito foi visto antes de qualquer cliente real.' : fmt(affected, 0) + ' pedidos × ' + brl(V) + ' = ' + brl(loss) + '.')));
      out.appendChild(note('Canary e flag decidem em 5 min pela métrica de negócio (ou antes, se você perceber antes). Defaults: 5 pedidos/s, Recife 20%, 60 min dão 3.600 pedidos e R$ 54.000; o canary, 30 pedidos e R$ 450.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [md.wrap, rps.wrap, rec.wrap, val.wrap, min.wrap]));
    [md, rps, rec, val, min].forEach(function (c) { c.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: poder estatístico do canary =============== */
  function wCanaryPoder(root) {
    var btns = [];
    var PRE = [{ r: 5, c: 10, e: 1, w: 5 }, { r: 640, c: 10, e: 1, w: 5 }];
    var rps = slider('Tráfego', 1, 1000, 1, 5, 'req/s', function (v) { return fmt(v, 0); });
    var cp = slider('Parcela do canary', 1, 50, 1, 10, '%', function (v) { return String(v); });
    var er = slider('Erro verdadeiro', 0.1, 5, 0.1, 1, '%', function (v) { return fmt(v, 1); });
    var wn = slider('Janela', 1, 60, 1, 5, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var R = +rps.input.value, C = +cp.input.value / 100, p = +er.input.value / 100, W = +wn.input.value;
      var rate = R * C, n = rate * W * 60;
      var seen = 1 - Math.pow(1 - p, n), miss = 1 - seen;
      var n95 = Math.ceil(Math.log(0.05) / Math.log(1 - p) - 1e-9), t95 = n95 / rate;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chegam ao canary', fmt(rate, 2) + ' req/s'),
        fact('Amostra na janela', fmt(n, 0) + ' requisições'),
        fact('Chance de ver ≥ 1 erro', fmt(seen * 100, 1) + '%'),
        fact('Chance de não ver nenhum', fmt(miss * 100, 1) + '%'),
        fact('Para 95% de confiança', fmt(n95, 0) + ' requisições'),
        fact('Tempo para chegar lá', dur(t95))
      ]));
      out.appendChild(bar('Vê o erro', seen * 100, fmt(seen * 100, 1) + '%', seen >= 0.95 ? 'win' : ''));
      var bad = seen < 0.95;
      out.appendChild(verdict(bad, bad ? 'A janela passa um defeito real.' : 'Amostra suficiente.',
        bad ? 'Com ' + fmt(n, 0) + ' requisições a chance de não ver nada é ' + fmt(miss * 100, 1) + '%: a análise aprova a 2.5.0 com o defeito dentro. Espere ' + dur(t95) + ' ou decida por número de requisições, não por minutos.'
          : 'A janela junta ' + fmt(n, 0) + ' requisições, acima das ' + fmt(n95, 0) + ' que dão 95% de confiança.'));
      out.appendChild(note('1 − (1 − p)^n, com n = tráfego × parcela × janela. Exemplo da aula: 5 pedidos/s a 10% por 5 min são 150 pedidos e 22% de chance de não ver um erro de 1%; o catalogo (640 req/s) chega a 298 requisições em 4,7 s. O defeito do frete é determinístico para Recife: 30 dos 150 pedidos, todos errados.'));
    }
    function preset(i) { var p = PRE[i]; rps.set(p.r); cp.set(p.c); er.set(p.e); wn.set(p.w); press(btns, i); render(); }
    root.appendChild(chipRow('Preset', ['pedidos (5/s)', 'catalogo (640/s)'], btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rps.wrap, cp.wrap, er.wrap, wn.wrap]));
    [rps, cp, er, wn].forEach(function (c) { c.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 8: migration =============== */
  function wMigracao(root) {
    var lin = slider('Linhas', 1, 50, 1, 50, 'M', function (v) { return String(v); });
    var lot = slider('Lote', 1000, 100000, 1000, 10000, 'linhas', function (v) { return fmt(v, 0); });
    var pau = slider('Pausa entre lotes', 0, 5, 0.1, 1, 's', function (v) { return fmt(v, 1); });
    var mpl = slider('Tempo por lote', 10, 500, 1, 66, 'ms', function (v) { return String(v); });
    var shd = slider('Shards', 1, 4, 1, 3, '', function (v) { return String(v); });
    var lt = select('lock_timeout', [{ v: '0', t: 'desligado' }, { v: '1', t: '1 s' }, { v: '2', t: '2 s' }, { v: '5', t: '5 s' }], '1');
    var tx = slider('Transação longa aberta', 3, 30, 1, 6, 's', function (v) { return String(v); });
    var out = el('div', { class: 'dp-out', 'aria-live': 'polite' });
    function render() {
      var N = +lin.input.value * 1e6, L = +lot.input.value, Pz = +pau.input.value, ms = +mpl.input.value, S = +shd.input.value;
      var per = N / S, batches = Math.ceil(per / L), each = ms / 1000 + Pz, total = batches * each;
      var gb = per * 1.975 / 1000;           // 1.975 MB por milhão de linhas (módulo 16)
      var oneShot = per / 1e6 * 8;           // 8,0 s por milhão de linhas (medido)
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Linhas por shard', fmt(per / 1e6, 2) + ' M'),
        fact('Lotes por shard', fmt(batches, 0)),
        fact('Backfill por shard', dur(total)),
        fact('Dados por shard', fmt(gb, 1) + ' GB')
      ]));
      out.appendChild(table(['conta', 'UPDATE único', 'Em lotes (com VACUUM)'], [
        { cells: [{ text: 'Espaço depois' }, { text: '+100% (+' + fmt(gb, 1) + ' GB)' }, { text: '+22% (+' + fmt(gb * 0.22, 1) + ' GB)' }] },
        { cells: [{ text: 'Linhas seguras de uma vez' }, { text: fmt(per / 1e6, 2) + ' M, por ~' + dur(oneShot) }, { text: fmt(L, 0) + ', por ~' + fmt(ms, 0) + ' ms cada' }] }
      ]));
      out.appendChild(verdict(oneShot > 60, 'O UPDATE único dobra a tabela.',
        'Em lotes de ' + fmt(L, 0) + ' com pausa de ' + fmt(Pz, 1) + ' s são ' + fmt(batches, 0) + ' lotes × ' + fmt(each, 3) + ' s ≈ ' + dur(total) + ' por shard (ordem de grandeza; os shards correm em paralelo). O padrão é 66 ms por lote de 10.000 medidos no PostgreSQL 14.'));
      // simulador de lock_timeout: a transação longa começa em 0, o ALTER chega em 1 s e o SELECT em 2 s
      var D = +tx.input.value, Lt = +lt.input.value, alterAt = 1, selAt = 2;
      var alterEnds = Lt > 0 ? Math.min(D, alterAt + Lt) : D;
      var gaveUp = Lt > 0 && alterAt + Lt < D;
      var selWait = Math.max(0, alterEnds - selAt);
      var lockRows = [
        { cells: [{ text: '0 s' }, { text: 'a transação longa abre um SELECT (dura ' + D + ' s)' }] },
        { cells: [{ text: '1 s' }, { text: 'o ALTER TABLE pede ACCESS EXCLUSIVE e espera' }] },
        { cells: [{ text: '2 s' }, { text: 'um SELECT simples chega e entra na fila atrás do ALTER' }] },
        { cls: gaveUp ? 'dp-bad' : '', cells: [{ text: fmt(alterEnds, 1) + ' s' }, { text: gaveUp ? 'ERROR: canceling statement due to lock timeout (o ALTER desiste)' : 'a transação termina e o ALTER executa' }] }
      ];
      out.appendChild(el('p', { class: 'sr-sub', text: 'Simulador de lock_timeout' }));
      out.appendChild(table(['quando', 'o que acontece'], lockRows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('O SELECT esperou', fmt(selWait, 1) + ' s'),
        fact('O ALTER esperou', fmt(alterEnds - alterAt, 1) + ' s')
      ]));
      out.appendChild(verdict(selWait > 2, selWait > 2 ? 'A fila trava todo mundo.' : 'O SELECT passa.',
        gaveUp ? 'Com lock_timeout de ' + fmt(Lt, 0) + ' s o ALTER desiste em ' + fmt(Lt, 1) + ' s e o SELECT quase não espera. A migration tenta de novo depois.'
          : 'Sem lock_timeout (ou maior que a transação) o ALTER espera ' + fmt(D - alterAt, 1) + ' s e o SELECT de depois espera ' + fmt(selWait, 1) + ' s atrás dele. Medido no PostgreSQL 14: 4,0 s contra 1,0 s.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lin.wrap, lot.wrap, pau.wrap, mpl.wrap, shd.wrap, lt.wrap, tx.wrap]));
    [lin, lot, pau, mpl, shd, lt, tx].forEach(function (c) { c.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 11: bucket da flag (murmur3 x86 32 bits, semente 0) =============== */
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
    var pct = slider('Percentual', 0, 100, 1, 20, '%', function (v) { return String(v); });
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
      if (!id || !fl) { out.appendChild(verdict(true, 'Falta preencher.', 'Escreva um cliente_id e o nome da flag.')); return; }
      var hv = murmur3(fl + ':' + id), bk = hv % 100, on = bk < P;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Texto sorteado', fl + ':' + id),
        fact('murmur3', '0x' + ('00000000' + hv.toString(16)).slice(-8)),
        fact('Bucket (mod 100)', String(bk)),
        fact('Flag', on ? 'ligada' : 'desligada')
      ]));
      out.appendChild(verdict(false, on ? 'Este cliente vê a 2.5.0.' : 'Este cliente ainda vê a 2.4.0.',
        'ligada = bucket < percentual: ' + bk + (on ? ' < ' : ' ≥ ') + P + '. O mesmo cliente cai sempre do mesmo lado, em qualquer pod.'));
      out.appendChild(table(['cliente', 'bucket', 'a ' + P + '%'], CLI.map(function (c) {
        var b = murmur3(fl + ':' + c) % 100;
        return { cls: c === id ? 'dp-cur' : '', cells: [{ text: c }, { text: String(b) }, { text: b < P ? 'liga' : 'não liga' }] };
      })));
      var cum = hist(fl);
      out.appendChild(el('p', { class: 'sr-sub', text: 'Em 100.000 clientes (c-0 a c-99999)' }));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('abaixo de 1', cum[1] / 1000, fmt(cum[1], 0), ''),
        bar('abaixo de 10', cum[10] / 1000, fmt(cum[10], 0), ''),
        bar('abaixo de 50', cum[50] / 1000, fmt(cum[50], 0), ''),
        bar('a ' + P + '%', cum[P] / 1000, fmt(cum[P], 0), 'win')
      ]));
      out.appendChild(note('Para frete_v2 a função dá 985, 9.878 e 49.909: espalha como esperado. A flag nova_home (outro sal) dá lena-77 → 80, bia-31 → 2, caio-58 → 72, davi-12 → 67, mkt-01 → 87.'));
    }
    function pick(i) { cid.input.value = CLI[i]; press(btns, i); render(); }
    root.appendChild(chipRow('Cliente', CLI, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cid.wrap, flg.wrap, pct.wrap]));
    cid.input.addEventListener('input', function () { press(btns, CLI.indexOf(cid.input.value.trim())); render(); });
    flg.input.addEventListener('input', render);
    pct.input.addEventListener('input', render);
    root.appendChild(out);
    pick(1 - 1);
  }

  /* =============== AULA 12: anéis por shard =============== */
  var ANEIS = [
    { n: 'shard-0', cli: 'davi-12', cidade: 'SP' },
    { n: 'shard-1', cli: 'lena-77 e bia-31', cidade: 'Recife' },
    { n: 'shard-2', cli: 'caio-58 e mkt-01', cidade: 'Rio' }
  ];
  var ORDENS = [[0, 1, 2], [1, 0, 2], [2, 1, 0]];
  function wAneis(root) {
    var f0 = slider('Parcela do shard-0', 0, 100, 5, 20, '%', function (v) { return String(v); });
    var f1 = slider('Parcela do shard-1', 0, 100, 5, 20, '%', function (v) { return String(v); });
    var cd = select('Cidade do defeito', [{ v: '0', t: 'SP (shard-0)' }, { v: '1', t: 'Recife (shard-1)' }, { v: '2', t: 'Rio (shard-2)' }], '1');
    var od = select('Ordem dos anéis', ORDENS.map(function (o, i) { return { v: String(i), t: o.map(function (x) { return 'shard-' + x; }).join(' → ') }; }), '0');
    var sy = select('Anel 0', [{ v: '0', t: 'só clientes reais' }, { v: '1', t: 'com clientes sintéticos em todas as cidades' }], '0');
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
        rows.push({ cls: i === first ? 'dp-bad' : '', cells: [{ text: 'anel ' + i }, { text: ANEIS[s].n + ' (' + ANEIS[s].cli + ')' }, { text: fr[s] + '%' }, { text: acc + '%' },
          { text: aparece ? 'sim' : 'não' }] });
      });
      clear(out);
      out.appendChild(table(['anel', 'shard', 'fração', 'exposição acumulada', 'defeito aparece?'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Aparece no anel', first < 0 ? '—' : String(first)),
        fact('Exposição nesse momento', first < 0 ? '—' : expoAt + '%'),
        fact('Pior degrau', Math.max.apply(null, ord.map(function (s) { return fr[s]; })) + '%')
      ]));
      var late = first > 0 || first < 0;
      out.appendChild(verdict(late, first === 0 ? 'Pego no anel 0.' : 'Pego tarde.',
        first === 0 ? 'O anel 0 exercita ' + (synth ? 'todas as cidades (clientes sintéticos)' : 'o código do defeito') + ' e o frete zero aparece com ' + expoAt + '% do tráfego (nenhum cliente real, se forem só sintéticos).'
          : 'O anel 0 (' + ANEIS[ord[0]].n + ', ' + ANEIS[ord[0]].cidade + ') não exercita o defeito de ' + ANEIS[bad].cidade + '. Ele só aparece no anel ' + first + ', com ' + expoAt + '% do tráfego já na 2.5.0.'));
      out.appendChild(note('Cidades por shard: exemplo da loja (davi-12 em SP, lena-77 em Recife, caio-58 no Rio). Defaults: 20/20/60, defeito de Recife: anel 1 com 40%. Clientes sintéticos no anel 0 o trazem para 20%, sem cliente real.'));
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
