/* SDLabs · API Gateways: widgets em JS puro
   (simulador de token bucket e leaky bucket, "qual resposta?", reescrita de caminho, réplicas do gateway com contador local ou Redis).
   Todos usam a loja do brief: gw-loja, rotas /api/v1 e /api/v2, catálogo que aguenta 100/s, limite de 10/s por chave, robô de 500/s. */
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
  function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

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
  function table(rows) {
    var tb = el('tbody');
    rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })])); });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]);
  }
  function slider(id, min, max, value, label) {
    var inp = el('input', { type: 'range', min: String(min), max: String(max), step: '1', value: String(value), id: id });
    var out = el('output', { for: id, text: String(value) });
    var lab = el('label', { for: id }, [label, out]);
    return { wrap: el('div', { class: 'sr-ctl' }, [lab, inp]), input: inp, out: out };
  }

  /* =============== AULA 5: token bucket x leaky bucket (passos de 10 ms) =============== */
  var DT = 0.01, BIN = 10;
  function simulate(mode, cap, rate, arrivals, seconds) {
    var n = Math.round(seconds / DT), tok = cap, q = 0, credit = 0;
    var pass = 0, rej = 0, bins = [];
    for (var i = 0; i <= n; i++) {
      var b = Math.floor(i / BIN);
      if (!bins[b]) bins[b] = { arr: 0, out: 0 };
      if (i === n) break;
      var a = arrivals(i), o = 0;
      bins[b].arr += a;
      if (mode === 'token') {
        tok = Math.min(cap, tok + rate * DT);
        for (var k = 0; k < a; k++) { if (tok >= 1) { tok -= 1; o++; } else rej++; }
      } else {
        for (var j = 0; j < a; j++) { if (q < cap) q++; else rej++; }
        credit += rate * DT;
        while (credit >= 1 && q > 0) { credit -= 1; q -= 1; o++; }
        if (q === 0 && credit > 1) credit = 1;
      }
      pass += o;
      bins[b].out += o;
    }
    return { pass: pass, rej: rej, left: q, bins: bins };
  }
  function wBuckets(root) {
    var SCEN = [
      { n: 'Lena: 12 pedidos de uma vez', sec: 1, arr: function (i) { return i === 0 ? 12 : 0; }, total: 12 },
      { n: 'Robô: 500 por segundo, por 2 s', sec: 2, arr: function () { return 5; }, total: 1000 }
    ];
    var PRESETS = [
      { n: 'Balde da loja: 20 e 10/s', mode: 'token', cap: 20, rate: 10 },
      { n: 'Exemplo do artigo: 200 e 100/s', mode: 'token', cap: 200, rate: 100 },
      { n: 'Fila da loja: 50 e 50/s', mode: 'leaky', cap: 50, rate: 50 }
    ];
    var S = { mode: 'token', cap: 20, rate: 10, sc: 0 };
    var mB = [], sB = [], pB = [];
    var cap = slider('bk-cap', 1, 200, S.cap, 'Capacidade (tokens ou tamanho da fila): ');
    var rate = slider('bk-rate', 1, 100, S.rate, 'Taxa (tokens repostos ou saída por segundo): ');
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(mB, S.mode === 'token' ? 0 : 1); press(sB, S.sc);
      cap.input.value = String(S.cap); cap.out.textContent = String(S.cap);
      rate.input.value = String(S.rate); rate.out.textContent = String(S.rate);
      var sc = SCEN[S.sc], r = simulate(S.mode, S.cap, S.rate, sc.arr, sc.sec);
      var peak = 0, maxOut = 0;
      r.bins.forEach(function (b) { peak = Math.max(peak, b.arr, b.out); maxOut = Math.max(maxOut, b.out); });
      var chart = el('div', { class: 'bk-chart', role: 'img', 'aria-label': 'Pedidos que chegaram e que saíram a cada 100 ms: no máximo ' + maxOut + ' saíram em 100 ms' });
      r.bins.forEach(function (b, i) {
        chart.appendChild(el('div', { class: 'bk-col', title: (i * 100) + ' ms: chegaram ' + b.arr + ', saíram ' + b.out }, [
          el('i', { class: 'bk-in', style: 'height:' + (peak ? b.arr / peak * 100 : 0) + '%' }),
          el('i', { class: 'bk-out', style: 'height:' + (peak ? b.out / peak * 100 : 0) + '%' })
        ]));
      });
      clear(out);
      out.appendChild(chart);
      out.appendChild(el('p', { class: 'sr-note bk-legend', text: 'Cada coluna são 100 ms. Cinza: pedidos que chegaram. Aceso: pedidos que saíram para o catálogo.' }));
      var rows = [
        ['Chegaram', fmt(sc.total) + ' pedidos'],
        ['Passaram para o catálogo', fmt(r.pass) + ' (' + fmt(r.pass / sc.sec) + ' por segundo em média)'],
        ['Levaram 429', fmt(r.rej) + (S.mode === 'leaky' ? ' (fila cheia: descartados)' : ' (sem token)')]
      ];
      if (S.mode === 'leaky') rows.push(['Ainda na fila no fim', fmt(r.left) + ' (saem nos próximos ' + fmt(Math.round(r.left / S.rate * 1000)) + ' ms)']);
      rows.push(['Mais pedidos em 100 ms', fmt(maxOut) + (S.mode === 'leaky' ? ' (a saída é lisa)' : '')]);
      out.appendChild(table(rows));
      var txt, cls = 'ok';
      if (r.rej === 0) txt = S.mode === 'token'
        ? 'Passou tudo: o balde de ' + S.cap + ' tokens cobre a rajada de ' + sc.total + '. Sobraram ' + fmt(Math.max(0, S.cap - sc.total)) + ' tokens.'
        : 'Passou tudo, mas esperando na fila: o catálogo nunca recebeu mais que ' + fmt(maxOut) + ' pedidos em 100 ms.';
      else { cls = 'bad'; txt = S.mode === 'token'
        ? 'O balde esvaziou e só passa o que ele repõe: ' + S.rate + ' por segundo. Os outros ' + fmt(r.rej) + ' levam 429 com Retry-After: 1.'
        : 'A fila de ' + S.cap + ' encheu e o excedente foi descartado. A saída ficou em ' + S.rate + ' por segundo, sem pico.'; }
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: txt }));
    }
    cap.input.addEventListener('input', function () { S.cap = Number(cap.input.value); render(); });
    rate.input.addEventListener('input', function () { S.rate = Number(rate.input.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Balde pronto' }));
    root.appendChild(chipRow('Balde pronto', PRESETS.map(function (p) { return p.n; }), pB, function (i) {
      var p = PRESETS[i]; S.mode = p.mode; S.cap = p.cap; S.rate = p.rate; render(); press(pB, i);
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Tipo de balde' }));
    root.appendChild(chipRow('Tipo de balde', ['Token bucket', 'Leaky bucket (fila)'], mB, function (i) { S.mode = i === 0 ? 'token' : 'leaky'; render(); press(pB, -1); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cap.wrap, rate.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Quem chega' }));
    root.appendChild(chipRow('Quem chega', SCEN.map(function (s) { return s.n; }), sB, function (i) { S.sc = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A simulação anda de 10 em 10 ms e começa com o balde cheio (token) ou a fila vazia (leaky). Mexer nos controles desmarca o balde pronto.' }));
    render(); press(pB, 0);
  }

  /* =============== AULA 5: qual resposta a chamada recebe? =============== */
  var ROUTES = [
    { n: 'GET /api/v1/produtos/42', svc: 'catalogo', auth: null, body: '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90 }' },
    { n: 'POST /api/v1/pedidos', svc: 'pedidos', auth: 'pedidos:criar', body: '{ "id": 1048, "total": 94.90 }' },
    { n: 'GET /api/v1/pedidos/1048', svc: 'pedidos', auth: 'pedidos:ler', body: '{ "id": 1048, "total": 94.90 }' },
    { n: 'GET /api/v1/frete', svc: null }
  ];
  var CREDS = [
    { n: 'Sem token', id: null },
    { n: 'Token da Lena (válido)', id: 'lena-77', scopes: ['pedidos:ler', 'pedidos:criar'], ok: true },
    { n: 'Token da Lena (vencido)', id: 'lena-77', scopes: ['pedidos:ler', 'pedidos:criar'], ok: false },
    { n: 'Chave do parceiro (produtos:ler)', id: 'marketplace-xyz', scopes: ['produtos:ler'], ok: true }
  ];
  function answer(r, c, over) {
    if (!r.svc) return { code: '404 Not Found', who: 'gateway', why: 'Nenhuma rota casa com este método e caminho. O gateway responde sozinho, e nenhum serviço é chamado.', hdr: '', cls: 'bad' };
    if (r.auth) {
      if (c.id === null) return { code: '401 Unauthorized', who: 'gateway', why: 'A rota exige login e não veio token. O gateway ainda não sabe quem chama.', hdr: 'WWW-Authenticate: Bearer', cls: 'bad' };
      if (!c.ok) return { code: '401 Unauthorized', who: 'gateway', why: 'O token venceu (o instante exp já passou). Sem credencial válida, o gateway não sabe quem chama.', hdr: 'WWW-Authenticate: Bearer', cls: 'bad' };
      if (c.scopes.indexOf(r.auth) < 0) return { code: '403 Forbidden', who: 'gateway', why: 'O gateway sabe quem é (' + c.id + '), mas a rota pede o escopo ' + r.auth + ' e a credencial tem só ' + c.scopes.join(', ') + '.', hdr: '', cls: 'bad' };
    }
    if (over) return { code: '429 Too Many Requests', who: 'gateway', why: 'A cota de 10 pedidos por segundo acabou' + (c.id ? ' para ' + c.id + '.' : ' para este IP (sem login, o gateway conta pelo endereço).') + ' O pedido nem chega ao serviço.', hdr: 'Retry-After: 1 · RateLimit-Limit: 10 · RateLimit-Remaining: 0', cls: 'bad' };
    var why = r.svc + ' responde.';
    if (!r.auth) why = 'A rota é pública: o gateway nem olha o token. ' + why;
    else if (r.n.indexOf('1048') > 0) why = 'Credencial válida, escopo ' + r.auth + ' presente. O serviço pedidos ainda confere se o X-Cliente-Id (' + c.id + ') é o dono do pedido 1048, e é. ' + why;
    else why = 'Credencial válida e escopo ' + r.auth + ' presente. O gateway repassa X-Cliente-Id: ' + c.id + '. ' + why;
    return { code: '200 OK', who: r.svc, why: why, hdr: '', body: r.body, cls: 'ok' };
  }
  function wResposta(root) {
    var S = { r: 0, c: 0, q: 0 };
    var rB = [], cB = [], qB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(rB, S.r); press(cB, S.c); press(qB, S.q);
      var a = answer(ROUTES[S.r], CREDS[S.c], S.q === 1);
      clear(out);
      var rows = [['Resposta', a.code], ['Quem responde', a.who], ['Por quê', a.why]];
      if (a.hdr) rows.push(['Cabeçalhos', a.hdr]);
      if (a.body) rows.push(['Corpo', a.body]);
      out.appendChild(table(rows));
      out.appendChild(el('p', { class: 'ib-verdict ' + a.cls, text: a.code + ' · ' + a.who }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. A chamada' }));
    root.appendChild(chipRow('Chamada', ROUTES.map(function (r) { return r.n; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Quem chama' }));
    root.appendChild(chipRow('Credencial', CREDS.map(function (c) { return c.n; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. A cota do cliente' }));
    root.appendChild(chipRow('Cota', ['Dentro de 10 por segundo', 'Já passou de 10 por segundo'], qB, function (i) { S.q = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A ordem é a do Kong: sem rota, 404; depois a autenticação (401), a autorização por escopo (403) e, por último, o limite (429). Escopos da Lena: pedidos:ler e pedidos:criar. Escopo do parceiro: produtos:ler.' }));
    render();
  }

  /* =============== AULA 6: reescrita de caminho =============== */
  var PATHS = [
    { prefix: '/api/v1/produtos', svc: 'catalogo', base: '/produtos' },
    { prefix: '/api/v1/carrinho', svc: 'carrinho', base: '/carrinho' },
    { prefix: '/api/v1/pedidos', svc: 'pedidos', base: '/pedidos', ver: 'v1' },
    { prefix: '/api/v1/clientes', svc: 'clientes', base: '/clientes' },
    { prefix: '/api/v2/pedidos', svc: 'pedidos-v2', base: '/pedidos', ver: 'v2' }
  ];
  function route(path) {
    var q = path.indexOf('?'), p = q < 0 ? path : path.slice(0, q), qs = q < 0 ? '' : path.slice(q);
    for (var i = 0; i < PATHS.length; i++) {
      var r = PATHS[i];
      if (p === r.prefix || p.indexOf(r.prefix + '/') === 0) return { r: r, rest: p.slice(r.prefix.length), qs: qs };
    }
    return null;
  }
  function wReescrita(root) {
    var PICKS = ['/api/v2/pedidos/1048', '/api/v1/pedidos/1048', '/api/v1/produtos/42', '/api/v1/pedidos', '/api/v3/pedidos/1048', '/api/v1/pedido/1048'];
    var S = { p: PICKS[0] };
    var pB = [];
    var inp = el('input', { type: 'text', class: 'ck-in', value: S.p, 'aria-label': 'Caminho que o cliente chama', autocomplete: 'off', spellcheck: 'false' });
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      var m = route(S.p.trim());
      clear(out);
      if (!m) {
        out.appendChild(table([
          ['Rota casada', 'nenhuma'], ['Serviço', 'nenhum (o gateway responde sozinho)'], ['Resposta', '404 Not Found']
        ]));
        out.appendChild(el('p', { class: 'ib-verdict bad', text: 'Nenhuma rota começa com este caminho. O gateway devolve 404 e não chama serviço algum. Rotas da loja: ' + PATHS.map(function (r) { return r.prefix; }).join(', ') + '.' }));
        return;
      }
      var r = m.r, delivered = r.base + m.rest + m.qs;
      var resp = '(o serviço responde)';
      if (r.ver === 'v1') resp = m.rest ? '{ "id": 1048, "total": 94.90 }' : '(a lista de pedidos do cliente)';
      if (r.ver === 'v2') resp = m.rest ? '{ "id": 1048, "total": { "valor": 94.90, "moeda": "BRL" } }' : '(a lista de pedidos, no formato da v2)';
      if (r.svc === 'catalogo' && m.rest === '/42') resp = '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90 }';
      out.appendChild(table([
        ['Rota casada', r.prefix],
        ['Serviço', r.svc],
        ['Prefixo removido (strip_path)', r.prefix],
        ['Caminho-base do serviço', r.base],
        ['Caminho entregue ao serviço', delivered],
        ['Conta', r.base + ' + ' + (m.rest || '(vazio)') + (m.qs ? ' + ' + m.qs : '') + ' = ' + delivered],
        ['Resposta', resp]
      ]));
      var note = r.ver === 'v2' ? 'A versão 2 mudou a forma do total, e por isso tem rota e serviço próprios. O pedidos-v2 só conhece /pedidos.'
        : r.ver === 'v1' ? 'O app antigo continua aqui, lendo o total como número.'
        : 'O serviço não sabe que existe /api/v1 na frente do caminho dele.';
      out.appendChild(el('p', { class: 'ib-verdict ok', text: note }));
    }
    inp.addEventListener('input', function () { S.p = inp.value; render(); press(pB, PICKS.indexOf(S.p)); });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Caminhos prontos' }));
    root.appendChild(chipRow('Caminhos prontos', PICKS, pB, function (i) { S.p = PICKS[i]; inp.value = S.p; render(); press(pB, i); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O que o cliente chama' }));
    root.appendChild(inp);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'O widget casa o prefixo da rota até uma barra ou o fim do caminho e escolhe a rota mais específica. Os serviços têm o caminho-base do próprio nome, como no laboratório da aula 7.' }));
    render(); press(pB, 0);
  }

  /* =============== AULA 7: réplicas do gateway, contador local ou Redis =============== */
  function wReplicas(root) {
    var NS = [1, 2, 3, 5], ROBO = 500, LIMIT = 10, CAT = 100;
    var S = { n: 2, pol: 0, div: 0 };
    var nB = [], pB = [], dB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(nB, S.n); press(pB, S.pol); press(dB, S.div);
      var n = NS[S.n], local = S.pol === 0;
      var each = ROBO / n, per = LIMIT, total, rows;
      if (local && S.div === 1) per = Math.floor(LIMIT / n);
      var passEach = Math.min(each, per);
      total = local ? passEach * n : LIMIT;
      rows = [
        ['Nós do gateway', String(n)],
        ['Pedidos do robô por nó', fmt(each) + ' por segundo (500 ÷ ' + n + ', com o balanceador repartindo igual)'],
        ['Limite configurado', local ? fmt(per) + ' por segundo em cada nó' + (S.div === 1 ? ' (10 ÷ ' + n + ', arredondado para baixo)' : '') : '10 por segundo, num contador só (Redis)'],
        ['O robô consegue passar', fmt(total) + (local ? ' por segundo (' + fmt(passEach) + ' × ' + n + ')' : ' por segundo, mais alguns por consistência eventual')],
        ['Contra o prometido (10)', local ? fmt(total / LIMIT) + ' vez' + (total / LIMIT === 1 ? '' : 'es') : 'cerca de 1 vez'],
        ['O catálogo recebe', fmt(total) + ' de ' + CAT + ' por segundo que ele aguenta']
      ];
      clear(out);
      out.appendChild(table(rows));
      var msg, cls = 'ok';
      if (local && S.div === 0 && n > 1) { cls = 'bad'; msg = 'Com ' + n + ' nós e contador local, o robô passa ' + fmt(total) + ' por segundo: ' + n + ' vezes o limite. O catálogo ainda aguenta, mas a regra de 10 não vale mais.'; }
      else if (local && S.div === 1 && n > 1) { cls = total === LIMIT ? 'ok' : 'bad'; msg = total === LIMIT
        ? 'Dividir o limite por nó fecha a conta para o robô (' + fmt(total) + ' por segundo). O custo: se o balanceador não reparte igual, a Lena leva 429 abaixo dos 10 por segundo prometidos.'
        : 'Dividir o limite por nó deixa o robô em ' + fmt(total) + ' por segundo, abaixo dos 10. O arredondamento tira ' + fmt(LIMIT - total) + ' por segundo da Lena também, e se o balanceador não reparte igual ela leva 429 antes da hora.'; }
      else if (!local) msg = 'Com o Redis, todos os nós leem e gravam o mesmo contador, e o limite fica em torno de 10 por segundo qualquer que seja o número de nós. Cada pedido gasta uma ida ao Redis, e se o Redis cai o gateway precisa decidir entre liberar tudo e barrar tudo.';
      else msg = 'Com um nó só, o contador local está certo: 10 por segundo.';
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: msg }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. Quantos nós do gateway' }));
    root.appendChild(chipRow('Nós do gateway', NS.map(function (n) { return n + (n === 1 ? ' nó' : ' nós'); }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Onde mora o contador (policy)' }));
    root.appendChild(chipRow('Policy', ['local: na memória de cada nó', 'redis: compartilhado'], pB, function (i) { S.pol = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Limite de cada nó (só vale na policy local)' }));
    root.appendChild(chipRow('Limite de cada nó', ['10 por segundo em cada', '10 ÷ nós em cada'], dB, function (i) { S.div = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A conta supõe um robô de 500 por segundo, uma chave só e o balanceador repartindo os pedidos em partes iguais entre os nós.' }));
    render();
  }

  var REG = { buckets: wBuckets, resposta: wResposta, reescrita: wReescrita, replicas: wReplicas };
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
