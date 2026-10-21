/* SDLabs · Bulkhead Pattern: widgets em JS puro
   (pool e Little, compartilhado × separado, raio de explosão, multiplexação com Erlang C, lanes de prioridade e vizinho barulhento).
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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
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
    var JOB = 6000; /* consultas do relatório (10 min a 10/s) */
    var lc = slider('Checkout: pedidos por segundo', 1, 30, 1, 10, '/s');
    var wc = slider('Checkout: tempo de cada um', 5, 100, 5, 20, 'ms');
    var ls = slider('Status do pedido: consultas por segundo', 5, 100, 5, 40, '/s');
    var ws = slider('Status do pedido: tempo de cada uma', 1, 50, 1, 5, 'ms');
    var lr = slider('Relatório: consultas por segundo', 1, 20, 1, 10, '/s');
    var wr = slider('Relatório: tempo de cada consulta', 1, 10, 1, 4, 's');
    var pool = slider('Tamanho do pool', 8, 60, 2, 20, 'conexões');
    var inte = slider('Vagas do interativo (se dividido)', 2, 58, 2, 16, 'conexões');
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
        fact('Checkout (λ × W)', fmt(Lc, 2) + ' conexões'),
        fact('Status do pedido (λ × W)', fmt(Ls, 2) + ' conexões'),
        fact('Relatório (λ × W)', S.rel ? fmt(Lr, 1) + ' conexões' : 'desligado', Lr > (S.div ? B : P))
      ]));
      var rows;
      if (!S.div) {
        var sat = tot > P + 1e-9;
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Em uso, todos juntos', fmt(tot, 1) + ' de ' + P, sat),
          fact('Se satura', sat ? 'sim: o pool inteiro' : 'não', sat),
          fact('Sobra para o cliente', sat ? 'só o que o relatório soltar' : fmt(P - tot, 1) + ' conexões', sat)
        ]));
        out.appendChild(verdict(sat,
          sat ? 'O relatório sozinho pede ' + fmt(Lr, 0) + ' para um pool de ' + P + '.' : 'Cabe: ' + fmt(tot, 1) + ' em uso de ' + P + '.',
          sat ? 'As consultas de ' + fmt(+ws.input.value, 0) + ' ms do cliente chegam e as ' + P + ' vagas já estão presas: pool cheio é 503 na hora. É o que o k6 mediu na aula 1.'
            : 'Ligue o relatório de 10/s × 4 s para ver o pool saturar: 0,4 + 40 = 40,4 de 20.'));
      } else {
        var satI = Lint > I + 1e-9, satB = Lr > B + 1e-9;
        var cap = B / +wr.input.value, jobMin = Lr ? JOB / Math.min(+lr.input.value, cap) / 60 : JOB / +lr.input.value / 60;
        var jobFree = JOB / +lr.input.value / 60;
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Interativo: em uso de ' + I, fmt(Lint, 2), satI),
          fact('Batch: pede ' + fmt(Lr, 0) + ' de ' + B, satB ? 'satura só ele' : (S.rel ? 'cabe' : 'desligado'), satB),
          fact('Batch atende', fmt(cap, 2) + ' consulta/s (' + B + ' ÷ ' + fmt(+wr.input.value, 0) + ' s)', satB)
        ]));
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Job de ' + fmt(JOB, 0) + ' consultas', S.rel ? fmtMin(jobMin) : '—', S.rel && jobMin > jobFree * 1.01),
          fact('Sem a divisão (a ' + fmt(+lr.input.value, 0) + '/s)', fmtMin(jobFree)),
          fact('Pelo Little bastariam', fmt(Math.max(2, Math.ceil(Lint * 10)) + 4, 0) + ' conexões (0,4 × 10 + 4)')
        ]));
        out.appendChild(verdict(satI,
          satI ? 'Até o interativo satura: ' + fmt(Lint, 1) + ' em uso para ' + I + ' vagas.' : (satB ? 'O furo fica no compartimento do batch.' : 'Nada satura.'),
          satI ? 'Aumente as vagas do interativo ou baixe a taxa.'
            : (satB ? 'O cliente tem ' + fmt(I - Lint, 1) + ' vagas de sobra. O relatório recebe 503 nas consultas que passam de ' + B + ' simultâneas e o job leva ' + fmtMin(jobMin) + ' em vez de ' + fmtMin(jobFree) + ': o batch tolera, o cliente não.'
              : 'O relatório cabe nas ' + B + ' vagas dele.')));
      }
      out.appendChild(note('Little: conexões em uso = λ × W. Divisão do k6: 16 + 4. Pela conta bastariam 4 + 4 = 8 e as outras 12 conexões voltariam ao max_connections do banco (100). Pool cheio devolve 503 sem fila (semáforo).'));
    }
    function pickD(i) { S.div = i; press(dB, i); render(); }
    function pickR(i) { S.rel = i; press(rB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lc.wrap, wc.wrap, ls.wrap, ws.wrap, lr.wrap, wr.wrap, pool.wrap, inte.wrap]));
    root.appendChild(chipRow('Pool', ['Único', 'Dividido (interativo + batch)'], dB, pickD));
    root.appendChild(chipRow('Relatório das 23:00', ['Desligado', 'Ligado'], rB, pickR));
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
    var pool = slider('Tamanho do pool', 8, 60, 2, 20, 'conexões');
    var inte = slider('Vagas do interativo (se dividido)', 2, 58, 2, 16, 'conexões');
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
      var names = { post: 'Checkout (POST)', get: 'Status do pedido (GET)', rel: 'Relatório' };
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
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Percentual de sucesso de cada fluxo na janela de 25 a 50 s' }, ['post', 'get', 'rel'].map(function (k) {
        var okM = mean(k, 'ok');
        var vazio = !S.rel && k === 'rel';
        return bar(names[k].split(' ')[0], vazio ? 0 : okM, vazio ? 'desligado' : fmtPct(okM, 0) + ' ok', !vazio && okM < 0.95);
      })));
      out.appendChild(table(['Janela 25–50 s', 'Modelo', 'k6 real'], rows));
      out.appendChild(el('p', { class: 'bk-axis', text: 'Modelo: média de 5 sorteios no navegador. k6: uma rodada de 80 s.' }));
      var cliente = Math.min(mean('post', 'ok'), mean('get', 'ok'));
      var bad = cliente < 0.99;
      out.appendChild(verdict(bad,
        bad ? 'O cliente perde requisições: ' + fmtPct(1 - mean('post', 'ok'), 0) + ' do checkout e ' + fmtPct(1 - mean('get', 'ok'), 0) + ' do status recebem 503.' : 'O cliente não perde nada na janela.',
        !S.rel ? 'Sem o relatório o pool nem se mexe: o cliente usa 0,4 de ' + P + '.'
          : (S.div ? (bad ? 'O compartimento do interativo (' + I + ') também aperta.' : 'Quem paga é o batch: ' + fmtPct(1 - mean('rel', 'ok'), 0) + ' das consultas dele recebem 503. O bulkhead não criou capacidade, escolheu quem espera.')
            : 'O relatório pede 40 conexões para ' + P + ' e expulsa o cliente. Divida o pool e compare.')));
      out.appendChild(note(canon ? 'Com 20 conexões (único ou 16 + 4) a coluna da direita é o k6 v2.3.0, rodado em 20–21/10/2026 contra o loja-pool.js: fora da janela do relatório todos os fluxos ficam em 100%. O modelo do navegador usa chegadas em intervalos regulares com um pequeno sorteio, e a divisão das perdas entre checkout e status não bate com a do k6 (o POST e o relatório chegam nos mesmos instantes e disputam a mesma vaga); a direção é a mesma.'
        : 'O k6 só rodou com 20 conexões, único ou 16 + 4, e o relatório ligado. Fora disso a coluna do k6 fica vazia. O modelo do navegador refaz o cenário com chegadas em intervalos regulares e um pequeno sorteio, sem fila: pool cheio é 503.'));
    }
    function pickD(i) { S.div = i; press(dB, i); render(); }
    function pickR(i) { S.rel = i; press(rB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pool.wrap, inte.wrap]));
    root.appendChild(chipRow('Pool', ['Único', 'Dividido (16 + 4 no k6)'], dB, pickD));
    root.appendChild(chipRow('Relatório entre 20 s e 50 s', ['Desligado', 'Ligado'], rB, pickR));
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
    var total = slider('Workers no total', 4, 60, 1, 12, 'workers');
    var carga = slider('Carga', 0.5, 0.9, 0.05, 0.7, '', function (v) { return fmt(v * 100, 0) + '%'; });
    var svc = slider('Tempo de serviço S', 10, 200, 10, 50, 'ms');
    var nB = [], NS = [1, 2, 3, 4, 6], S = { n: 2 };
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var T = +total.input.value, rho = +carga.input.value, Sm = +svc.input.value, p = NS[S.n];
      var per = Math.floor(T / p);
      clear(out);
      if (per < 1) { out.appendChild(verdict(true, 'Pools demais para ' + T + ' workers.', 'Cada pool precisa de ao menos 1 worker.')); return; }
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
        fact('1 pool de ' + use + ' · espera', fmtPct(P1, 1) + ' das vezes'),
        fact(p + ' pools de ' + per + ' · espera', p === 1 ? 'igual ao de cima' : fmtPct(Pn, 1) + ' das vezes', Pn > P1 + 0.01),
        fact('Espera média: único × dividido', fmt(W1, 1) + ' ms × ' + (p === 1 ? fmt(W1, 1) : fmt(Wn, 1)) + ' ms', Wn > W1 * 1.5)
      ]));
      function cell(P, W, bad) { return { text: fmtPct(P, 1) + '\n' + fmt(W, 1) + ' ms', cls: bad ? 'bk-bad' : '' }; }
      var rows = [
        { cells: [{ text: '1 pool de ' + use }, cell(P1, W1), { text: String(use) }] },
        { cells: [{ text: p + ' pools de ' + per }, cell(Pn, Wn, Pn > P1 + 0.01 || Wn > W1 * 1.5), { text: String(use) }] }
      ];
      if (p > 1 && kP) rows.push({ cells: [{ text: p + ' pools de ' + kP + ' (iguala a chance)' }, cell(erlangC(kP, aP), wqMs(kP, aP, Sm)), { text: kP * p + ' (+' + fmt((kP * p / use - 1) * 100, 0) + '%)' }] });
      if (p > 1 && kW) rows.push({ cells: [{ text: p + ' pools de ' + kW + ' (iguala a espera)' }, cell(erlangC(kW, aP), wqMs(kW, aP, Sm)), { text: kW * p + ' (+' + fmt((kW * p / use - 1) * 100, 0) + '%)' }] });
      out.appendChild(table(['Carga ' + fmt(rho * 100, 0) + '%, S = ' + Sm + ' ms', 'Chance de esperar e espera média', 'Workers'], rows));
      var worse = p > 1 && Pn > P1 + 0.005;
      out.appendChild(verdict(worse,
        p === 1 ? 'Um pool só: é o melhor caso médio.' : (worse ? 'Dividir piora o caso normal.' : 'Aqui a divisão quase não custa.'),
        p === 1 ? 'Qualquer worker livre atende qualquer fluxo: é a multiplexação estatística. Aumente o número de pools para ver o preço.'
          : 'A chance de esperar vai de ' + fmtPct(P1, 1) + ' para ' + fmtPct(Pn, 1) + ' e a espera média, de ' + fmt(W1, 1) + ' para ' + fmt(Wn, 1) + ' ms. Em troca, o pior caso fica contido: um pool saturado não leva os outros.'));
      out.appendChild(note('Erlang C (fila M/M/c, módulo 23): P(esperar) = C(c, a) e espera média = C × S ÷ (c × (1 − ρ)). Números do módulo: 12 workers, carga de 70% (8,4 erlangs), S = 50 ms → 18,4% e 2,6 ms; em 3 pools de 4 → 42,9% e 17,9 ms; igualar a chance de esperar (dentro de 5%) pede 5 por pool (15, +25%) e igualar a espera, 6 por pool (18, +50%). Contas refeitas em Python em 20/10/2026.'));
    }
    function pickN(i) { S.n = i; press(nB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [total.wrap, carga.wrap, svc.wrap]));
    root.appendChild(chipRow('Número de pools', ['1 pool', '2 pools', '3 pools', '4 pools', '6 pools'], nB, pickN));
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
    var nS = slider('Compartimentos (N)', 1, 100, 1, 3, '');
    var reps = slider('Réplicas (shuffle sharding)', 4, 20, 1, 10, 'réplicas');
    var kk = slider('Réplicas por cliente', 1, 4, 1, 2, '');
    var dB = [], pB = [], S = { d: 0, p: 1 };
    var PS = [0.01, 0.001, 0.0001], PL = ['99%', '99,9%', '99,99%'];
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function fracs(n, d) {
      /* o mkt-01 tem 40% do tráfego; os outros 60% se dividem igualmente */
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
        fact('Raio médio (1 ÷ N)', fmtPct(1 / N, 1)),
        fact('Pior caso', fmtPct(worst, 1), worst > 1 / N + 0.005),
        fact('Disponibilidade no pior incidente', fmtPct(1 - worst, 1))
      ]));
      var draw = Math.min(N, 20);
      var chart = el('div', { class: 'bk-shards', role: 'img', 'aria-label': 'Fatia do tráfego de cada compartimento' });
      var max = Math.max(worst, 0.0001);
      for (var i = 0; i < draw; i++) {
        var v = f[i], hot = v >= worst - 1e-9 && worst > 1 / N + 0.005;
        var col = el('div', { class: 'bk-shard' + (hot ? ' hot' : '') });
        var b = el('i'); b.style.height = Math.max(3, v / max * 100) + '%';
        col.appendChild(b); col.appendChild(el('span', { text: fmt(v * 100, v < 0.1 ? 1 : 0) + '%' }));
        chart.appendChild(col);
      }
      out.appendChild(chart);
      if (N > 20) out.appendChild(el('p', { class: 'bk-axis', text: 'Mostrando os 20 primeiros dos ' + N + ' compartimentos.' }));
      var verb = d === 0 ? 'Tráfego uniforme: o raio é 1 ÷ N.' : (d === 1 ? 'O mkt-01 (40%) divide um compartimento com os outros: ' + fmtPct(0.6 / N + 0.4, 0) + ' do tráfego.' : 'O mkt-01 sozinho num compartimento (40%); os outros dividem 60%.');
      out.appendChild(verdict(worst > 1 / N + 0.005, 'Pior caso: ' + fmtPct(worst, 1) + '.', verb + (N === 1 ? ' Com 1 compartimento o raio é 100%.' : (d === 1 && N === 3 ? ' É o caso do módulo 16: 20% · 20% · 60%.' : (d === 2 && N === 4 ? ' O shard dedicado leva o pior caso de 60% a 40%.' : '')))));
      out.appendChild(el('div', { class: 'sr-sub', text: 'Quantos incidentes (cada compartimento a ' + PL[S.p] + ')' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Algum fora: 1 − (1 − p)^N', fmtPct(algum, 2)),
        fact('Todos fora ao mesmo tempo: p^N', todos < 1e-4 ? pot10(todos) : fmtPct(todos, 4)),
        fact('Um cliente em 1 compartimento', fmtPct(p, 2))
      ]));
      out.appendChild(el('div', { class: 'sr-sub', text: 'Shuffle sharding: ' + k + ' de ' + n + ' réplicas' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Combinações C(' + n + ', ' + k + ')', fmt(C, 0)),
        fact('Pior caso no shuffle (1 ÷ C)', fmtPct(1 / C, 1)),
        fact('Grupos fixos de ' + k + ' em ' + n + ' (' + k + ' ÷ ' + n + ')', fmtPct(k / n, 1), true)
      ]));
      out.appendChild(note('Tabela do artigo: 1 → 100%, 2 → 50%, 3 → 33,3% (ele escreve 33%), 5 → 20%, 10 → 10%, 20 → 5%, 50 → 2%, 100 → 1%. Ela supõe tráfego uniforme. Mais compartimentos dão mais incidentes pequenos (1 − 0,999^N: 0,10% com 1, 4,88% com 50) e fazem a parada total sumir (p^N), mas a indisponibilidade de um cliente fica em 0,1%. O estoque global dos shards do pedidos tem raio de 100%, qualquer que seja N.'));
    }
    function pickD(i) { S.d = i; press(dB, i); render(); }
    function pickP(i) { S.p = i; press(pB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap, reps.wrap, kk.wrap]));
    root.appendChild(chipRow('Distribuição do tráfego', ['Uniforme', 'Com o mkt-01 a 40%', 'Com o shard dedicado'], dB, pickD));
    root.appendChild(chipRow('Disponibilidade de cada compartimento', PL, pB, pickP));
    [nS, reps, kk].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickD(0); pickP(1);
    nS.set(3); render();
  }

  /* =============== AULA 4: lanes de prioridade =============== */
  function wLanes(root) {
    var W = slider('Workers no total', 10, 40, 2, 20, 'workers');
    var alta = slider('Lane alta (checkout)', 2, 30, 1, 12, 'workers');
    var normal = slider('Lane normal (estorno, parceiros)', 1, 20, 1, 6, 'workers');
    var sB = [], lB = [], S = { surto: 1, lanes: 1 };
    var DEM = { alta: 8, normal: 4, baixa: 2 }; /* workers em uso no regime normal (λ × W) */
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var T = +W.input.value, a = +alta.input.value, n = +normal.input.value;
      if (a + n >= T) { a = Math.max(1, T - n - 1); if (a + n >= T) { n = Math.max(1, T - a - 1); } }
      var b = Math.max(1, T - a - n);
      var dem = { alta: DEM.alta, normal: DEM.normal, baixa: DEM.baixa };
      if (S.surto === 1) dem.baixa = 60; /* o reprocessamento (ou a reconciliação) dispara */
      if (S.surto === 2) dem.normal = 60; /* o robô de 500/s do mkt-01 entra pela lane normal */
      var got = {}, tot = dem.alta + dem.normal + dem.baixa, caps = { alta: a, normal: n, baixa: b };
      ['alta', 'normal', 'baixa'].forEach(function (k) {
        got[k] = S.lanes ? Math.min(dem[k], caps[k]) : (tot <= T ? dem[k] : T * dem[k] / tot);
      });
      var names = { alta: 'Alta (checkout de cliente)', normal: 'Normal (estorno e parceiros)', baixa: 'Baixa (reprocessamento)' };
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Divisão', S.lanes ? a + ' · ' + n + ' · ' + b : 'pool único de ' + T),
        fact('Checkout atendido', fmt(got.alta, 1) + ' de ' + dem.alta, got.alta < dem.alta - 0.05),
        fact('Quem fica sem vaga', fmt(tot - got.alta - got.normal - got.baixa, 1) + ' workers pedidos', tot - got.alta - got.normal - got.baixa > 0.05)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Workers atendidos em cada lane' }, ['alta', 'normal', 'baixa'].map(function (k) {
        var ok = got[k] >= dem[k] - 0.05;
        return bar(k, dem[k] ? got[k] / dem[k] : 1, fmt(got[k], 1) + ' de ' + fmt(dem[k], 0), !ok);
      })));
      var cutAlta = got.alta < dem.alta - 0.05;
      out.appendChild(verdict(cutAlta,
        cutAlta ? 'O checkout perde vagas: ' + fmt(got.alta, 1) + ' de ' + dem.alta + '.' : 'O checkout segue com as ' + dem.alta + ' que pede.',
        S.surto === 0 ? 'Sem surto, tudo cabe nos dois desenhos: ' + dem.alta + ' + ' + dem.normal + ' + ' + dem.baixa + ' = ' + tot + ' de ' + T + '. Dispare um surto.'
          : (S.lanes ? 'O surto de ' + fmt(S.surto === 1 ? dem.baixa : dem.normal, 0) + ' workers bate no teto da lane (' + (S.surto === 1 ? b : n) + ') e o resto é recusado nela. A lane alta não foi tocada.'
            : 'No pool único o surto disputa as mesmas vagas e leva a parte dele da fila: o checkout recebe ' + fmt(T * dem.alta / tot, 1) + ' das ' + dem.alta + ' vagas de que precisa.')));
      out.appendChild(note('Modelo: no regime normal o checkout usa 8 workers, o normal 4 e a baixa 2 (λ × W). No pool único cada fluxo recebe uma parte do pool proporcional ao que pede. Números do módulo: 20 workers em 12 · 6 · 2; um surto de baixa não passa de 2 e o checkout continua com 12.'));
    }
    function pickS(i) { S.surto = i; press(sB, i); render(); }
    function pickL(i) { S.lanes = i; press(lB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [W.wrap, alta.wrap, normal.wrap]));
    root.appendChild(chipRow('Quem dispara o surto', ['Sem surto', 'Reprocessamento (baixa)', 'Robô do mkt-01 (normal)'], sB, pickS));
    root.appendChild(chipRow('Divisão', ['Pool único', 'Três lanes'], lB, pickL));
    [W, alta, normal].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pickS(1); pickL(1);
  }

  /* =============== AULA 5: vizinho barulhento =============== */
  function wVizinho(root) {
    var cap = slider('Capacidade do catálogo (10 réplicas)', 200, 2000, 100, 1000, 'req/s');
    var robo = slider('Robô do mkt-01', 0, 1000, 50, 500, 'req/s');
    var teto = slider('Teto do tenant mkt-01', 0, 1000, 50, 100, 'req/s');
    var out = el('div', { class: 'bk-out', 'aria-live': 'polite' });
    function render() {
      var C = +cap.input.value, R = +robo.input.value, T = +teto.input.value;
      var comTeto = T < C;
      var cons = Math.min(R, comTeto ? T : C, C);
      var r429 = comTeto ? Math.max(0, R - T) : 0;
      var sobra = C - cons, garantido = comTeto ? C - T : 0;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('O robô consome (' + fmtPct(cons / C, 0) + ' da frota)', fmt(cons, 0) + ' req/s', cons / C > 0.3),
        fact('Sobra para os outros', fmt(sobra, 0) + ' req/s', sobra / C < 0.7),
        fact('Recusado com 429 (no compartimento dele)', fmt(r429, 0) + ' req/s', false)
      ]));
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Divisão da capacidade da frota' }, [
        bar('robô', cons / C, fmt(cons, 0) + ' req/s', cons / C > 0.3),
        bar('outros', sobra / C, fmt(sobra, 0) + ' req/s', false)
      ]));
      out.appendChild(verdict(!comTeto && cons / C > 0.3,
        comTeto ? 'O teto de ' + fmt(T, 0) + ' req/s protege os outros.' : 'Sem teto, o robô leva ' + fmtPct(cons / C, 0) + ' da frota.',
        comTeto ? 'O robô pede ' + fmt(R, 0) + ' e entra com ' + fmt(cons, 0) + '; os ' + fmt(r429, 0) + ' excedentes recebem 429 no compartimento dele. Os outros têm ' + fmt(garantido, 0) + ' req/s garantidos (reserva).'
          : 'O teto está em ' + fmt(T, 0) + ' (igual ou acima da frota): na prática não há compartimento. Baixe o teto para 100.'));
      out.appendChild(note('Números do módulo: o robô de 500 req/s contra 10 réplicas (1.000 req/s) consome 50% da frota; com o teto de 100 (10% de 1.000) os outros 900 ficam garantidos e os 400 do robô recebem 429. O rate limit global (módulo 8) protege o sistema do total; o bulkhead por tenant protege cada fluxo dos outros.'));
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
