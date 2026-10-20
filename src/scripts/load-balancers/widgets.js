/* SDLabs · Load Balancers e Proxies Reversos: widgets em JS puro
   (relógio do healthcheck, simuladores da fila P1–P9, calculadora de remapeamento, "L4 ou L7 enxerga isto?").
   Todos usam o cenário do brief: lb-loja, catalogo-1/2/3 (catalogo-4 quando entra), a fila de 9 pedidos
   (gato 20 ms, busca 900 ms, um pedido a cada 100 ms) e o hash de exemplo da figura: octeto3 × 256 + octeto4. */
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
  function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }
  function ms(v) { return fmt(v) + ' ms'; }

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
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', cls && cls(r) ? { class: cls(r) } : null, r.map(function (c, i) {
        return el(i === 0 ? 'th' : 'td', i === 0 ? { scope: 'row', text: c } : { text: c });
      })));
    });
    var th = el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]);
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table lb-table' }, [th, tb])]);
  }
  function verdict(text, bad) { return el('p', { class: 'sr-verdict' + (bad ? ' bad' : ''), text: text }); }

  /* ---------- dados do cenário ---------- */
  var CLI = {
    L: { n: 'Lena', ip: '177.38.20.5', h: 20 * 256 + 5 },
    B: { n: 'Bia', ip: '189.6.44.10', h: 44 * 256 + 10 },
    C: { n: 'Caio', ip: '200.150.7.33', h: 7 * 256 + 33 },
    D: { n: 'Davi', ip: '187.11.90.2', h: 90 * 256 + 2 }
  };
  var KIND = { g: { lab: 'gato', ms: 20 }, b: { lab: 'busca', ms: 900 } };
  var QUEUE = 'Lg Bb Cg Dg Lb Bg Cg Db Lg'.split(' ').map(function (s, i) {
    return { p: 'P' + (i + 1), c: s[0], k: s[1], t: i * 100 };
  });
  var GAP = 100;
  var NAMES = ['catalogo-1', 'catalogo-2', 'catalogo-3', 'catalogo-4'];
  var RANDOM10 = [1, 0, 1, 2, 1, 1, 2, 0, 1, 2]; /* o sorteio da figura: 2 / 5 / 3 */

  /* ---------- motor: a fila passa pela regra; cada regra escolhe a réplica e explica a escolha ---------- */
  function pendingAt(placed, r, t) {
    var n = 0;
    placed.forEach(function (x) { if (x.r === r && x.t <= t && t < x.t + KIND[x.k].ms) n++; });
    return n;
  }
  function argmin(v) {
    var best = 0;
    for (var i = 1; i < v.length; i++) if (v[i] < v[best]) best = i;
    return best;
  }
  /* opts: n (réplicas), idle (conexões ociosas por réplica), counters (contadores iniciais do least request) */
  function run(rule, opts) {
    var n = opts.n || 3, placed = [], rows = [];
    var cnt = (opts.counters || []).slice(0, n);
    while (cnt.length < n) cnt.push(0);
    var PESO = [0, 1, 2, 2];
    QUEUE.forEach(function (q, i) {
      var r, why, vec = null;
      if (rule === 'rr') { r = i % n; why = 'vez da ' + (r + 1); }
      else if (rule === 'peso') { r = PESO[i % 4]; why = 'lista 1 · 2 · 3 · 3'; }
      else if (rule === 'qt') { r = Math.floor(i / 2) % n; why = 'quantum 300 ms: 2 por vez'; }
      else if (rule === 'lr') { vec = cnt.slice(); r = argmin(vec); cnt[r]++; why = 'atendidos'; }
      else if (rule === 'lc' || rule === 'lor') {
        var pend = [];
        for (var k = 0; k < n; k++) pend.push(pendingAt(placed, k, q.t));
        vec = rule === 'lc' ? pend.map(function (v, k2) { return v + ((opts.idle || [])[k2] || 0); }) : pend;
        r = argmin(vec);
        why = rule === 'lc' ? 'conexões abertas' : 'pedidos pendentes';
      } else if (rule === 'hash') { r = CLI[q.c].h % 3; why = CLI[q.c].h + ' % 3 = ' + r; }
      else if (rule === 'rnd') { r = opts.rnd[i]; why = 'sorteio'; }
      placed.push({ r: r, t: q.t, k: q.k });
      rows.push({ q: q, r: r, vec: vec, why: why });
    });
    var work = [], num = [];
    for (var j = 0; j < n; j++) { work.push(0); num.push(0); }
    rows.forEach(function (x) { work[x.r] += KIND[x.q.k].ms; num[x.r]++; });
    return { rows: rows, work: work, num: num, counters: cnt };
  }

  /* ---------- quadro comum: linhas da fila + barras de trabalho por réplica ---------- */
  function showRun(out, res, n, opt) {
    opt = opt || {};
    clear(out);
    var list = el('ol', { class: 'lb-queue' });
    res.rows.forEach(function (x) {
      var q = x.q, cls = 'lb-row' + (q.k === 'b' ? ' heavy' : '');
      var meta = (x.vec ? x.why + ': ' + x.vec.join(' · ') : x.why);
      if (opt.hashMeta) meta = CLI[q.c].ip + ' · ' + x.why;
      list.appendChild(el('li', { class: cls }, [
        el('span', { class: 'lb-p', text: q.p }),
        el('span', { class: 'lb-who', text: CLI[q.c].n + ' · ' + KIND[q.k].lab + ' ' + KIND[q.k].ms + ' ms' }),
        el('span', { class: 'lb-to r' + (x.r + 1), text: '→ ' + NAMES[x.r] }),
        el('span', { class: 'lb-meta', text: meta })
      ]));
    });
    out.appendChild(list);
    out.appendChild(bars(res, n));
    var hi = Math.max.apply(null, res.work), lo = Math.min.apply(null, res.work);
    return { hi: hi, lo: lo };
  }
  function bars(res, n) {
    var max = Math.max.apply(null, res.work.concat([1]));
    var box = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Trabalho acumulado por réplica: ' + res.work.map(function (w, i) { return NAMES[i] + ' ' + ms(w); }).join(', ') });
    for (var i = 0; i < n; i++) {
      var f = el('div', { class: 'sr-fill' + (res.work[i] === max && max > 0 ? ' cap' : ''), style: 'width:' + (res.work[i] / max * 100) + '%' });
      box.appendChild(el('div', { class: 'sr-bar' }, [
        el('span', { text: NAMES[i] + ' · ' + res.num[i] + (res.num[i] === 1 ? ' pedido' : ' pedidos') }),
        el('div', { class: 'sr-track' }, [f, el('span', { class: 'sr-lbl', text: ms(res.work[i]) })])
      ]));
    }
    return box;
  }
  function ratioText(hi, lo) {
    if (lo === 0) return 'Uma réplica não recebeu nenhum pedido, e a mais carregada tem ' + ms(hi) + ' de trabalho.';
    var r = hi / lo;
    if (r < 1.05) return 'Trabalho por igual: ' + ms(hi) + ' em cada réplica.';
    return 'A réplica mais carregada tem ' + ms(hi) + ' de trabalho, ' + fmt(Math.round(r * 10) / 10) + ' vezes a menos carregada (' + ms(lo) + ').';
  }

  /* =============== AULA 3: round robin, com quantum e com peso =============== */
  function wSimRr(root) {
    var RULES = [['rr', 'Round robin'], ['qt', 'RR com quantum'], ['peso', 'RR com peso (catalogo-3 = 2)']];
    var S = { r: 0 }, rB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    function render() {
      press(rB, S.r);
      var res = run(RULES[S.r][0], { n: 3 });
      var s = showRun(out, res, 3);
      var t = { rr: 'Cada réplica recebeu 3 pedidos, e as 3 buscas (P2, P5, P8) caíram todas na catalogo-2.',
        qt: 'Com 300 ms de quantum e um pedido a cada 200 ms, cada réplica recebe 2 seguidos. As buscas P2 e P8 caem juntas na catalogo-1.',
        peso: 'A catalogo-3 entra duas vezes por volta. Aqui as buscas se espalharam, mas só porque a ordem da fila ajudou.' }[RULES[S.r][0]];
      out.appendChild(verdict(t + ' ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Regra' }));
    root.appendChild(chipRow('Regra de rodízio', RULES.map(function (r) { return r[1]; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Gato = 20 ms, busca = 900 ms. O quantum é o do código Go do artigo; as ferramentas reais giram por pedido, com pesos.' }));
    render();
  }

  /* =============== AULA 4: least request, com a catalogo-4 entrando =============== */
  function wSimLr(root) {
    var S = { p: 0, z: 0 }, pB = [], zB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    var zRow;
    function render() {
      press(pB, S.p); press(zB, S.z);
      var four = S.p === 1;
      zRow.hidden = !four;
      var n = four ? 4 : 3;
      var counters = four && S.z === 0 ? [3000, 3000, 3000, 0] : [0, 0, 0, 0];
      var res = run('lr', { n: n, counters: counters });
      var s = showRun(out, res, n);
      out.insertBefore(el('p', { class: 'lb-counters', text: 'Contadores antes do P1: ' + counters.slice(0, n).map(function (c, i) { return NAMES[i] + ' = ' + fmt(c); }).join(' · ') }), out.firstChild);
      if (!four) out.appendChild(verdict('As três réplicas começam juntas, então o resultado é igual ao do round robin: as 3 buscas ainda caem na catalogo-2. ' + ratioText(s.hi, s.lo), true));
      else if (S.z === 0) out.appendChild(verdict('Os 9 pedidos foram todos para a catalogo-4: ela tem contador 0 e as outras, 3.000. Seriam 3.000 pedidos seguidos, uma negação de serviço involuntária.', true));
      else out.appendChild(verdict('Com os contadores zerados (ou janelados), a catalogo-4 entra como as outras e os pedidos se espalham pelas quatro. ' + ratioText(s.hi, s.lo)));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Pool' }));
    root.appendChild(chipRow('Réplicas no pool', ['Só as 3 réplicas', 'Entra a catalogo-4 com contador 0'], pB, function (i) { S.p = i; render(); }));
    zRow = el('div');
    zRow.appendChild(el('p', { class: 'sr-sub', text: 'Contadores das outras três' }));
    zRow.appendChild(chipRow('Contadores', ['Acumulados (3.000 cada)', 'Zerados ou janelados'], zB, function (i) { S.z = i; render(); }));
    root.appendChild(zRow);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Este é o least request do artigo: conta pedidos já atendidos. O LEAST_REQUEST do Envoy conta pedidos ativos (aula 6).' }));
    render();
  }

  /* =============== AULAS 5 e 6: least connection e LOR, com conexões ociosas =============== */
  function wSimConn(root, rules, intro) {
    var S = { r: rules.length - 1, i: 0 }, rB = [], iB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    function render() {
      press(rB, S.r); press(iB, S.i);
      var rule = rules[S.r][0], idle = S.i ? [5, 0, 0] : [0, 0, 0];
      var res = run(rule, { n: 3, idle: idle });
      var s = showRun(out, res, 3);
      var msg;
      if (rule === 'rr') msg = 'O round robin não olha nada: as buscas P2, P5 e P8 caem na catalogo-2.';
      else if (rule === 'lc' && S.i) msg = 'A catalogo-1 parece ocupada (5 conexões ociosas) e quase não recebe pedido, enquanto a catalogo-2 pega buscas demais. Conexão aberta não é trabalho.';
      else if (rule === 'lc') msg = 'Sem conexões ociosas, conexão aberta e pedido pendente coincidem, e o least connection acerta.';
      else msg = 'O LOR só conta pedidos sem resposta: as 5 conexões ociosas não pesam, e o trabalho se divide por igual (uma busca e dois gatos em cada).';
      out.appendChild(verdict(msg + ' ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Regra' }));
    root.appendChild(chipRow('Regra de escolha', rules.map(function (r) { return r[1]; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Keep-alive' }));
    root.appendChild(chipRow('Conexões ociosas', ['Sem conexões ociosas', '5 conexões ociosas na catalogo-1'], iB, function (i) { S.i = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: intro }));
    render();
  }
  function wSimLc(root) {
    wSimConn(root, [['rr', 'Round robin'], ['lc', 'Least connection']],
      'Os pedidos chegam um a cada 100 ms. Em cada linha, os números são as conexões abertas de catalogo-1 · 2 · 3 no instante da escolha; o empate vai para a primeira.');
  }
  function wSimLor(root) {
    wSimConn(root, [['rr', 'Round robin'], ['lc', 'Least connection'], ['lor', 'LOR']],
      'Os pedidos chegam um a cada 100 ms. Em cada linha, os números são o que a regra comparou em catalogo-1 · 2 · 3; o empate vai para a primeira.');
  }

  /* =============== AULA 7: IP hash e random =============== */
  function wSimHash(root) {
    var S = { r: 0, n: 0, seed: 0 }, rB = [], nB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    var again, nRow, draw = RANDOM10.slice();
    function sorteia(count) { var a = []; for (var i = 0; i < count; i++) a.push(Math.floor(Math.random() * 3)); return a; }
    function render() {
      press(rB, S.r); press(nB, S.n);
      var isHash = S.r === 0;
      nRow.hidden = isHash; again.hidden = isHash;
      clear(out);
      if (isHash) {
        var res = run('hash', { n: 3 });
        var s = showRun(out, res, 3, { hashMeta: true });
        out.appendChild(verdict('Lena (177.38.20.5): h = 20 × 256 + 5 = 5.125, e 5.125 % 3 = 1, sempre a catalogo-2. Cada cliente tem a sua réplica fixa, e a conta não olha o custo do pedido. ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
        return;
      }
      var total = [10, 9, 10000][S.n], num = [0, 0, 0], i;
      if (S.n === 1) {
        var r9 = run('rnd', { n: 3, rnd: draw.slice(0, 9) });
        var s9 = showRun(out, r9, 3);
        out.appendChild(verdict('9 pedidos sorteados: ' + r9.num.join(' · ') + '. ' + ratioText(s9.hi, s9.lo), s9.hi / (s9.lo || 1) > 1.5));
        return;
      }
      var seq = S.n === 0 ? draw.slice(0, 10) : sorteia(10000);
      seq.forEach(function (v) { num[v]++; });
      var max = Math.max.apply(null, num);
      var box = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Pedidos por réplica: ' + num.join(', ') });
      for (i = 0; i < 3; i++) {
        box.appendChild(el('div', { class: 'sr-bar' }, [
          el('span', { text: NAMES[i] }),
          el('div', { class: 'sr-track' }, [el('div', { class: 'sr-fill' + (num[i] === max ? ' cap' : ''), style: 'width:' + (num[i] / max * 100) + '%' }),
            el('span', { class: 'sr-lbl', text: fmt(num[i]) + ' (' + fmt(Math.round(num[i] / total * 1000) / 10) + '%)' })])
        ]));
      }
      out.appendChild(box);
      out.appendChild(verdict(S.n === 0
        ? '10 pedidos sorteados: ' + num.join(' · ') + '. Com pouco tráfego o sorteio sai desigual.'
        : '10.000 pedidos sorteados: ' + num.map(fmt).join(' · ') + '. Com muito tráfego cada réplica chega perto de 1/3.', S.n === 0 && max - Math.min.apply(null, num) > 1));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Regra' }));
    root.appendChild(chipRow('Regra de escolha', ['IP hash', 'Random'], rB, function (i) { S.r = i; render(); }));
    nRow = el('div');
    nRow.appendChild(el('p', { class: 'sr-sub', text: 'Quantos pedidos' }));
    nRow.appendChild(chipRow('Quantidade de pedidos', ['10 pedidos', 'Os 9 da fila', '10.000 pedidos'], nB, function (i) { S.n = i; render(); }));
    root.appendChild(nRow);
    again = el('button', { type: 'button', class: 'btn', text: 'Sortear de novo' });
    again.addEventListener('click', function () { draw = sorteia(10); render(); });
    root.appendChild(again);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'O sorteio inicial é o da figura (2 · 5 · 3). O hash de exemplo usa os dois últimos números do IP; o NGINX e o Envoy usam funções de hash de verdade.' }));
    render();
  }

  /* =============== AULA 7: calculadora de remapeamento =============== */
  function wRemap(root) {
    var POOLS = [3, 4, 5, 10], CLIENTS = [12, 180, 1800];
    var S = { p: 0, c: 0 }, pB = [], cB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    function bar(label, moved, total, cls) {
      var pct = moved / total * 100;
      return el('div', { class: 'sr-bar' }, [
        el('span', { text: label }),
        el('div', { class: 'sr-track' }, [el('div', { class: 'sr-fill ' + cls, style: 'width:' + pct + '%' }),
          el('span', { class: 'sr-lbl', text: fmt(moved) + ' de ' + fmt(total) + ' (' + fmt(Math.round(pct * 10) / 10) + '%)' })])
      ]);
    }
    function render() {
      press(pB, S.p); press(cB, S.c);
      var N = POOLS[S.p], C = CLIENTS[S.c], mod = 0, cons = 0;
      for (var h = 0; h < C; h++) {
        var was = h % N, now = h % (N - 1);
        if (was !== now) mod++;
        if (was === N - 1) cons++; /* só quem estava na réplica que saiu muda */
      }
      clear(out);
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Clientes que trocam de réplica: módulo ' + mod + ' de ' + C + ', hashing consistente ' + cons + ' de ' + C }, [
        bar('Módulo (% ' + N + ' → % ' + (N - 1) + ')', mod, C, 'cap'),
        bar('Hashing consistente', cons, C, 'win')
      ]));
      var pm = Math.round(mod / C * 100), pc = Math.round(cons / C * 100);
      var msg = 'Com ' + N + ' → ' + (N - 1) + ' réplicas, o módulo trocou ' + pm + '% dos clientes e o hashing consistente, ' + pc + '%. Na conta geral, são (N − 1)/N = ' + (N - 1) + '/' + N + ' contra 1/N = 1/' + N + ' (só quem estava na réplica que saiu). Cada cliente que troca perde a sessão e o cache local da réplica antiga.';
      if (C < N * (N - 1)) msg += ' Com tão poucos clientes a amostra engana: escolha 180 ou 1.800.';
      out.appendChild(verdict(msg, C >= N * (N - 1) && N >= 4));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Tamanho do pool antes da saída' }));
    root.appendChild(chipRow('Réplicas antes', POOLS.map(function (n) { return n + ' réplicas'; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Clientes' }));
    root.appendChild(chipRow('Quantidade de clientes', CLIENTS.map(function (n) { return n + ' clientes'; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Os clientes são numerados h = 0, 1, 2… e a réplica é h % N, como na figura. Sai a última réplica.' }));
    render();
  }

  /* =============== AULA 1: relógio do healthcheck =============== */
  function wHealth(root) {
    var INT = [2, 5, 10, 30], TMO = [1, 2, 5], THR = [1, 2, 3, 5], RPS = [3, 30, 300], OK = [1, 2, 3];
    var S = { i: 1, t: 0, h: 2, r: 1, o: 1 }, iB = [], tB = [], hB = [], rB = [], oB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    function render() {
      press(iB, S.i); press(tB, S.t); press(hB, S.h); press(rB, S.r); press(oB, S.o);
      var I = INT[S.i], T = TMO[S.t], H = THR[S.h], R = RPS[S.r], K = OK[S.o];
      var out15 = I * H, back = I * K, share = Math.round(R / 3 * out15), all = R * out15;
      clear(out);
      var ticks = el('ol', { class: 'hc-ticks' });
      for (var c = 1; c <= H; c++) {
        ticks.appendChild(el('li', { class: 'hc-tick', text: 'check ' + c + ' · +' + (c * I) + ' s ✕' }));
      }
      out.appendChild(el('p', { class: 'lb-read', text: 'A catalogo-2 trava em 20:00:00' }));
      out.appendChild(ticks);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Sai do pool em', out15 + ' s', 'às ' + clock(0, out15)),
        fact('Pedidos que falham', fmt(share), 'de ' + fmt(all) + ' (1 de cada 3)'),
        fact('Volta ao pool em', back + ' s', 'às ' + clock(300, back) + ' se voltar às 20:05:00')
      ]));
      var msg = 'Sai do pool depois de ' + H + (H === 1 ? ' falha' : ' falhas') + ' seguidas, a cada ' + I + ' s: ' + I + ' × ' + H + ' = ' + out15 + ' s. Nesse tempo, 1 de cada 3 dos ' + fmt(all) + ' pedidos cai na réplica parada e falha.';
      if (H === 1) msg += ' Com limiar 1, um check perdido por tropeço de rede já tira uma réplica saudável do pool.';
      if (T > I) msg += ' Atenção: o timeout (' + T + ' s) é maior que o intervalo (' + I + ' s), então um check começa antes de o anterior acabar.';
      out.appendChild(verdict(msg, out15 > 20 || H === 1));
    }
    function fact(label, big, small) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: big }), el('small', { class: 'lb-sub', text: small })]); }
    function pad2(v) { return (v < 10 ? '0' : '') + v; }
    function clock(base, add) { var t = base + add; return '20:' + pad2(Math.floor(t / 60)) + ':' + pad2(t % 60); }
    function group(title, labels, btns, key) {
      root.appendChild(el('p', { class: 'sr-sub', text: title }));
      root.appendChild(chipRow(title, labels, btns, function (i) { S[key] = i; render(); }));
    }
    group('Intervalo entre checks', INT.map(function (v) { return v + ' s'; }), iB, 'i');
    group('Timeout de cada check', TMO.map(function (v) { return v + ' s'; }), tB, 't');
    group('Falhas seguidas para sair do pool', THR.map(function (v) { return String(v); }), hB, 'h');
    group('Sucessos seguidos para voltar', OK.map(function (v) { return String(v); }), oB, 'o');
    group('Pedidos por segundo', RPS.map(function (v) { return v + ' por s'; }), rB, 'r');
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Com 5 s × 3 falhas = 15 s (20:00:15), como na aula. A conta supõe que a réplica trava logo antes de um check. Com 3 réplicas no pool, 1 de cada 3 pedidos cai nela.' }));
    render();
  }

  /* =============== AULA 8: L4 ou L7 enxerga isto? =============== */
  function wCamadas(root) {
    var ROWS = [
      ['IP de origem', '177.38.20.5', 4, 'Está no cabeçalho IP, por fora do envelope.'],
      ['Porta de origem', '51514', 4, 'Está no cabeçalho TCP, por fora do envelope.'],
      ['IP de destino', '203.0.113.10', 4, 'É o endereço do lb-loja: vem no cabeçalho IP.'],
      ['Porta de destino', '443', 4, 'Está no cabeçalho TCP e diz que é HTTPS.'],
      ['Método e caminho', 'GET /produtos/42', 7, 'Está dentro do HTTP, que vai cifrado pelo TLS. Só quem termina o TLS lê.'],
      ['Cabeçalho Host', 'loja.com.br', 7, 'É um cabeçalho HTTP, também cifrado.'],
      ['Cookie de sessão', 'sessao=…', 7, 'É um cabeçalho HTTP, também cifrado.']
    ];
    var S = ROWS.map(function () { return null; });
    var out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    var rowsEl = el('ul', { class: 'lb-fields' }), sum = verdict('Escolha uma opção em cada linha.');
    var btns = [];
    function paint() {
      var right = 0, answered = 0;
      ROWS.forEach(function (r, i) {
        var v = S[i], li = rowsEl.children[i], fb = li.querySelector('.lb-why');
        btns[i].forEach(function (b, k) { b.setAttribute('aria-pressed', v === (k === 0 ? 4 : 7) ? 'true' : 'false'); });
        li.className = 'lb-field' + (v == null ? '' : v === r[2] ? ' yes' : ' no');
        if (v != null) { answered++; if (v === r[2]) right++; }
        fb.textContent = v == null ? '' : (v === r[2] ? 'Certo. ' : 'Não: ') + (r[2] === 4 ? 'a camada 4 já enxerga isto. ' : 'só a camada 7 enxerga isto. ') + r[3];
      });
      sum.textContent = answered < ROWS.length ? answered + ' de ' + ROWS.length + ' respondidas.' : right + ' de ' + ROWS.length + ' certas. A camada 4 enxerga os 4 campos de endereço e porta; a camada 7 enxerga tudo, mas só depois de terminar o TLS.';
      sum.className = 'sr-verdict' + (answered === ROWS.length && right < ROWS.length ? ' bad' : '');
    }
    ROWS.forEach(function (r, i) {
      var pair = [];
      var group = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Quem enxerga: ' + r[0] });
      [['Camada 4 também', 4], ['Só a camada 7', 7]].forEach(function (o) {
        var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: o[0] });
        b.addEventListener('click', function () { S[i] = o[1]; paint(); });
        pair.push(b); group.appendChild(b);
      });
      btns.push(pair);
      rowsEl.appendChild(el('li', { class: 'lb-field' }, [
        el('div', { class: 'lb-fh' }, [el('span', { class: 'lb-fn', text: r[0] }), el('code', { text: r[1] })]),
        group,
        el('p', { class: 'lb-why' })
      ]));
    });
    root.appendChild(rowsEl);
    root.appendChild(sum);
    root.appendChild(el('p', { class: 'sr-note', text: 'O pedido da Lena a loja.com.br: TCP 177.38.20.5:51514 → 203.0.113.10:443, e dentro, GET /produtos/42 HTTP/1.1 com Host e Cookie.' }));
    paint();
  }

  var REG = { 'health': wHealth, 'sim-rr': wSimRr, 'sim-lr': wSimLr, 'sim-lc': wSimLc, 'sim-lor': wSimLor, 'sim-hash': wSimHash, 'remap': wRemap, 'camadas': wCamadas };
  function init() {
    var nodes = document.querySelectorAll('[data-widget]');
    Array.prototype.forEach.call(nodes, function (n) {
      var f = REG[n.getAttribute('data-widget')];
      if (!f) return;
      try { f(n); } catch (e) { if (window.console) console.error('widget', n.getAttribute('data-widget'), e); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
