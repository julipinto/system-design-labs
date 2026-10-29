/* SDLabs · API Gateways: plain JS widgets (English)
   (token bucket and leaky bucket simulator, "which response?", path rewrite, gateway replicas with a local or Redis counter).
   All of them use the store from the brief: gw-loja, /api/v1 and /api/v2 routes, a catalog that handles 100/s, a limit of 10/s per key, a 500/s bot. */
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
  function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

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

  /* =============== LESSON 5: token bucket x leaky bucket (10 ms steps) =============== */
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
      { n: 'Lena: 12 requests at once', sec: 1, arr: function (i) { return i === 0 ? 12 : 0; }, total: 12 },
      { n: 'Bot: 500 per second, for 2 s', sec: 2, arr: function () { return 5; }, total: 1000 }
    ];
    var PRESETS = [
      { n: 'Store bucket: 20 and 10/s', mode: 'token', cap: 20, rate: 10 },
      { n: 'Article example: 200 and 100/s', mode: 'token', cap: 200, rate: 100 },
      { n: 'Store queue: 50 and 50/s', mode: 'leaky', cap: 50, rate: 50 }
    ];
    var S = { mode: 'token', cap: 20, rate: 10, sc: 0 };
    var mB = [], sB = [], pB = [];
    var cap = slider('bk-cap', 1, 200, S.cap, 'Capacity (tokens or queue size): ');
    var rate = slider('bk-rate', 1, 100, S.rate, 'Rate (tokens refilled or output per second): ');
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(mB, S.mode === 'token' ? 0 : 1); press(sB, S.sc);
      cap.input.value = String(S.cap); cap.out.textContent = String(S.cap);
      rate.input.value = String(S.rate); rate.out.textContent = String(S.rate);
      var sc = SCEN[S.sc], r = simulate(S.mode, S.cap, S.rate, sc.arr, sc.sec);
      var peak = 0, maxOut = 0;
      r.bins.forEach(function (b) { peak = Math.max(peak, b.arr, b.out); maxOut = Math.max(maxOut, b.out); });
      var chart = el('div', { class: 'bk-chart', role: 'img', 'aria-label': 'Requests that arrived and left every 100 ms: at most ' + maxOut + ' left in 100 ms' });
      r.bins.forEach(function (b, i) {
        chart.appendChild(el('div', { class: 'bk-col', title: (i * 100) + ' ms: ' + b.arr + ' arrived, ' + b.out + ' left' }, [
          el('i', { class: 'bk-in', style: 'height:' + (peak ? b.arr / peak * 100 : 0) + '%' }),
          el('i', { class: 'bk-out', style: 'height:' + (peak ? b.out / peak * 100 : 0) + '%' })
        ]));
      });
      clear(out);
      out.appendChild(chart);
      out.appendChild(el('p', { class: 'sr-note bk-legend', text: 'Each column is 100 ms. Gray: requests that arrived. Lit: requests that left for the catalog.' }));
      var rows = [
        ['Arrived', fmt(sc.total) + ' requests'],
        ['Passed to the catalog', fmt(r.pass) + ' (' + fmt(r.pass / sc.sec) + ' per second on average)'],
        ['Got a 429', fmt(r.rej) + (S.mode === 'leaky' ? ' (queue full: dropped)' : ' (no token)')]
      ];
      if (S.mode === 'leaky') rows.push(['Still in the queue at the end', fmt(r.left) + ' (leave in the next ' + fmt(Math.round(r.left / S.rate * 1000)) + ' ms)']);
      rows.push(['Most requests in 100 ms', fmt(maxOut) + (S.mode === 'leaky' ? ' (the output is smooth)' : '')]);
      out.appendChild(table(rows));
      var txt, cls = 'ok';
      if (r.rej === 0) txt = S.mode === 'token'
        ? 'Everything got through: the bucket of ' + S.cap + ' tokens covers the burst of ' + sc.total + '. ' + fmt(Math.max(0, S.cap - sc.total)) + ' tokens left.'
        : 'Everything got through, but waiting in the queue: the catalog never received more than ' + fmt(maxOut) + ' requests in 100 ms.';
      else { cls = 'bad'; txt = S.mode === 'token'
        ? 'The bucket emptied and only what it refills gets through: ' + S.rate + ' per second. The other ' + fmt(r.rej) + ' get a 429 with Retry-After: 1.'
        : 'The queue of ' + S.cap + ' filled up and the excess was dropped. The output stayed at ' + S.rate + ' per second, with no spike.'; }
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: txt }));
    }
    cap.input.addEventListener('input', function () { S.cap = Number(cap.input.value); render(); });
    rate.input.addEventListener('input', function () { S.rate = Number(rate.input.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Ready-made bucket' }));
    root.appendChild(chipRow('Ready-made bucket', PRESETS.map(function (p) { return p.n; }), pB, function (i) {
      var p = PRESETS[i]; S.mode = p.mode; S.cap = p.cap; S.rate = p.rate; render(); press(pB, i);
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Bucket type' }));
    root.appendChild(chipRow('Bucket type', ['Token bucket', 'Leaky bucket (queue)'], mB, function (i) { S.mode = i === 0 ? 'token' : 'leaky'; render(); press(pB, -1); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cap.wrap, rate.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Who arrives' }));
    root.appendChild(chipRow('Who arrives', SCEN.map(function (s) { return s.n; }), sB, function (i) { S.sc = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The simulation steps every 10 ms and starts with a full bucket (token) or an empty queue (leaky). Touching the controls deselects the ready-made bucket.' }));
    render(); press(pB, 0);
  }

  /* =============== LESSON 5: which response does the call get? =============== */
  var ROUTES = [
    { n: 'GET /api/v1/produtos/42', svc: 'catalogo', auth: null, body: '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90 }' },
    { n: 'POST /api/v1/pedidos', svc: 'pedidos', auth: 'pedidos:criar', body: '{ "id": 1048, "total": 94.90 }' },
    { n: 'GET /api/v1/pedidos/1048', svc: 'pedidos', auth: 'pedidos:ler', body: '{ "id": 1048, "total": 94.90 }' },
    { n: 'GET /api/v1/frete', svc: null }
  ];
  var CREDS = [
    { n: 'No token', id: null },
    { n: 'Lena\'s token (valid)', id: 'lena-77', scopes: ['pedidos:ler', 'pedidos:criar'], ok: true },
    { n: 'Lena\'s token (expired)', id: 'lena-77', scopes: ['pedidos:ler', 'pedidos:criar'], ok: false },
    { n: 'Partner key (produtos:ler)', id: 'marketplace-xyz', scopes: ['produtos:ler'], ok: true }
  ];
  function answer(r, c, over) {
    if (!r.svc) return { code: '404 Not Found', who: 'gateway', why: 'No route matches this method and path. The gateway answers by itself, and no service is called.', hdr: '', cls: 'bad' };
    if (r.auth) {
      if (c.id === null) return { code: '401 Unauthorized', who: 'gateway', why: 'The route requires login and no token came. The gateway doesn\'t know who is calling yet.', hdr: 'WWW-Authenticate: Bearer', cls: 'bad' };
      if (!c.ok) return { code: '401 Unauthorized', who: 'gateway', why: 'The token expired (the exp instant has passed). Without a valid credential, the gateway doesn\'t know who is calling.', hdr: 'WWW-Authenticate: Bearer', cls: 'bad' };
      if (c.scopes.indexOf(r.auth) < 0) return { code: '403 Forbidden', who: 'gateway', why: 'The gateway knows who it is (' + c.id + '), but the route asks for the ' + r.auth + ' scope and the credential only has ' + c.scopes.join(', ') + '.', hdr: '', cls: 'bad' };
    }
    if (over) return { code: '429 Too Many Requests', who: 'gateway', why: 'The quota of 10 requests per second is used up' + (c.id ? ' for ' + c.id + '.' : ' for this IP (without login, the gateway counts by address).') + ' The request never reaches the service.', hdr: 'Retry-After: 1 · RateLimit-Limit: 10 · RateLimit-Remaining: 0', cls: 'bad' };
    var why = r.svc + ' answers.';
    if (!r.auth) why = 'The route is public: the gateway doesn\'t even look at the token. ' + why;
    else if (r.n.indexOf('1048') > 0) why = 'Valid credential, ' + r.auth + ' scope present. The pedidos service still checks whether the X-Cliente-Id (' + c.id + ') owns order 1048, and it does. ' + why;
    else why = 'Valid credential and ' + r.auth + ' scope present. The gateway passes on X-Cliente-Id: ' + c.id + '. ' + why;
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
      var rows = [['Response', a.code], ['Who answers', a.who], ['Why', a.why]];
      if (a.hdr) rows.push(['Headers', a.hdr]);
      if (a.body) rows.push(['Body', a.body]);
      out.appendChild(table(rows));
      out.appendChild(el('p', { class: 'ib-verdict ' + a.cls, text: a.code + ' · ' + a.who }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. The call' }));
    root.appendChild(chipRow('Call', ROUTES.map(function (r) { return r.n; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Who is calling' }));
    root.appendChild(chipRow('Credential', CREDS.map(function (c) { return c.n; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. The client\'s quota' }));
    root.appendChild(chipRow('Quota', ['Within 10 per second', 'Already over 10 per second'], qB, function (i) { S.q = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The order is Kong\'s: no route, 404; then authentication (401), scope authorization (403) and, last, the limit (429). Lena\'s scopes: pedidos:ler and pedidos:criar. The partner\'s scope: produtos:ler.' }));
    render();
  }

  /* =============== LESSON 6: path rewrite =============== */
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
    var inp = el('input', { type: 'text', class: 'ck-in', value: S.p, 'aria-label': 'Path the client calls', autocomplete: 'off', spellcheck: 'false' });
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      var m = route(S.p.trim());
      clear(out);
      if (!m) {
        out.appendChild(table([
          ['Matched route', 'none'], ['Service', 'none (the gateway answers by itself)'], ['Response', '404 Not Found']
        ]));
        out.appendChild(el('p', { class: 'ib-verdict bad', text: 'No route starts with this path. The gateway returns 404 and calls no service. The store\'s routes: ' + PATHS.map(function (r) { return r.prefix; }).join(', ') + '.' }));
        return;
      }
      var r = m.r, delivered = r.base + m.rest + m.qs;
      var resp = '(the service answers)';
      if (r.ver === 'v1') resp = m.rest ? '{ "id": 1048, "total": 94.90 }' : '(the client\'s list of orders)';
      if (r.ver === 'v2') resp = m.rest ? '{ "id": 1048, "total": { "valor": 94.90, "moeda": "BRL" } }' : '(the list of orders, in the v2 format)';
      if (r.svc === 'catalogo' && m.rest === '/42') resp = '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90 }';
      out.appendChild(table([
        ['Matched route', r.prefix],
        ['Service', r.svc],
        ['Prefix removed (strip_path)', r.prefix],
        ['Service base path', r.base],
        ['Path handed to the service', delivered],
        ['The sum', r.base + ' + ' + (m.rest || '(empty)') + (m.qs ? ' + ' + m.qs : '') + ' = ' + delivered],
        ['Response', resp]
      ]));
      var note = r.ver === 'v2' ? 'Version 2 changed the shape of the total, which is why it has its own route and service. pedidos-v2 only knows /pedidos.'
        : r.ver === 'v1' ? 'The old app stays here, reading the total as a number.'
        : 'The service doesn\'t know /api/v1 exists in front of its path.';
      out.appendChild(el('p', { class: 'ib-verdict ok', text: note }));
    }
    inp.addEventListener('input', function () { S.p = inp.value; render(); press(pB, PICKS.indexOf(S.p)); });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Ready-made paths' }));
    root.appendChild(chipRow('Ready-made paths', PICKS, pB, function (i) { S.p = PICKS[i]; inp.value = S.p; render(); press(pB, i); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'What the client calls' }));
    root.appendChild(inp);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The widget matches the route prefix up to a slash or the end of the path and picks the most specific route. The services have a base path named after themselves, as in lesson 7\'s lab.' }));
    render(); press(pB, 0);
  }

  /* =============== LESSON 7: gateway replicas, local or Redis counter =============== */
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
        ['Gateway nodes', String(n)],
        ['Bot requests per node', fmt(each) + ' per second (500 ÷ ' + n + ', with the balancer splitting evenly)'],
        ['Configured limit', local ? fmt(per) + ' per second on each node' + (S.div === 1 ? ' (10 ÷ ' + n + ', rounded down)' : '') : '10 per second, in a single counter (Redis)'],
        ['What the bot can get through', fmt(total) + (local ? ' per second (' + fmt(passEach) + ' × ' + n + ')' : ' per second, plus a few from eventual consistency')],
        ['Against the promised 10', local ? fmt(total / LIMIT) + (total / LIMIT === 1 ? ' time' : ' times') : 'about 1 time'],
        ['The catalog receives', fmt(total) + ' of the ' + CAT + ' per second it can handle']
      ];
      clear(out);
      out.appendChild(table(rows));
      var msg, cls = 'ok';
      if (local && S.div === 0 && n > 1) { cls = 'bad'; msg = 'With ' + n + ' nodes and a local counter, the bot gets ' + fmt(total) + ' per second through: ' + n + ' times the limit. The catalog can still handle it, but the rule of 10 no longer holds.'; }
      else if (local && S.div === 1 && n > 1) { cls = total === LIMIT ? 'ok' : 'bad'; msg = total === LIMIT
        ? 'Splitting the limit per node settles the count for the bot (' + fmt(total) + ' per second). The cost: if the balancer doesn\'t split evenly, Lena gets a 429 below the promised 10 per second.'
        : 'Splitting the limit per node leaves the bot at ' + fmt(total) + ' per second, under 10. The rounding takes ' + fmt(LIMIT - total) + ' per second from Lena too, and if the balancer doesn\'t split evenly she gets a 429 too soon.'; }
      else if (!local) msg = 'With Redis, all the nodes read and write the same counter, and the limit stays around 10 per second whatever the number of nodes. Each request costs a trip to Redis, and if Redis goes down the gateway has to choose between letting everything through and blocking everything.';
      else msg = 'With a single node, the local counter is right: 10 per second.';
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: msg }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. How many gateway nodes' }));
    root.appendChild(chipRow('Gateway nodes', NS.map(function (n) { return n + (n === 1 ? ' node' : ' nodes'); }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Where the counter lives (policy)' }));
    root.appendChild(chipRow('Policy', ['local: in each node\'s memory', 'redis: shared'], pB, function (i) { S.pol = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Each node\'s limit (only applies to the local policy)' }));
    root.appendChild(chipRow('Each node\'s limit', ['10 per second on each', '10 ÷ nodes on each'], dB, function (i) { S.div = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The calculation assumes a bot at 500 per second, a single key and the balancer splitting the requests in equal parts among the nodes.' }));
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
