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
  function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 }); }
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
  var KIND = { g: { lab: 'cat', ms: 20 }, b: { lab: 'search', ms: 900 } };
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
      if (rule === 'rr') { r = i % n; why = 'turn of ' + (r + 1); }
      else if (rule === 'peso') { r = PESO[i % 4]; why = 'list 1 · 2 · 3 · 3'; }
      else if (rule === 'qt') { r = Math.floor(i / 2) % n; why = 'quantum 300 ms: 2 at a time'; }
      else if (rule === 'lr') { vec = cnt.slice(); r = argmin(vec); cnt[r]++; why = 'served'; }
      else if (rule === 'lc' || rule === 'lor') {
        var pend = [];
        for (var k = 0; k < n; k++) pend.push(pendingAt(placed, k, q.t));
        vec = rule === 'lc' ? pend.map(function (v, k2) { return v + ((opts.idle || [])[k2] || 0); }) : pend;
        r = argmin(vec);
        why = rule === 'lc' ? 'open connections' : 'pending requests';
      } else if (rule === 'hash') { r = CLI[q.c].h % 3; why = CLI[q.c].h + ' % 3 = ' + r; }
      else if (rule === 'rnd') { r = opts.rnd[i]; why = 'draw'; }
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
    var box = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Accumulated work per replica: ' + res.work.map(function (w, i) { return NAMES[i] + ' ' + ms(w); }).join(', ') });
    for (var i = 0; i < n; i++) {
      var f = el('div', { class: 'sr-fill' + (res.work[i] === max && max > 0 ? ' cap' : ''), style: 'width:' + (res.work[i] / max * 100) + '%' });
      box.appendChild(el('div', { class: 'sr-bar' }, [
        el('span', { text: NAMES[i] + ' · ' + res.num[i] + (res.num[i] === 1 ? ' request' : ' requests') }),
        el('div', { class: 'sr-track' }, [f, el('span', { class: 'sr-lbl', text: ms(res.work[i]) })])
      ]));
    }
    return box;
  }
  function ratioText(hi, lo) {
    if (lo === 0) return 'One replica received no requests, and the busiest has ' + ms(hi) + ' of work.';
    var r = hi / lo;
    if (r < 1.05) return 'Work is even: ' + ms(hi) + ' on each replica.';
    return 'The busiest replica has ' + ms(hi) + ' of work, ' + fmt(Math.round(r * 10) / 10) + ' times the least busy one (' + ms(lo) + ').';
  }

  /* =============== AULA 3: round robin, com quantum e com peso =============== */
  function wSimRr(root) {
    var RULES = [['rr', 'Round robin'], ['qt', 'RR with quantum'], ['peso', 'RR with weight (catalogo-3 = 2)']];
    var S = { r: 0 }, rB = [], out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    function render() {
      press(rB, S.r);
      var res = run(RULES[S.r][0], { n: 3 });
      var s = showRun(out, res, 3);
      var t = { rr: 'Each replica received 3 requests, and the 3 searches (P2, P5, P8) all landed on catalogo-2.',
        qt: 'With a 300 ms quantum and one request every 200 ms, each replica gets 2 in a row. Searches P2 and P8 land together on catalogo-1.',
        peso: 'catalogo-3 enters twice per round. Here the searches spread out, but only because the order of the queue helped.' }[RULES[S.r][0]];
      out.appendChild(verdict(t + ' ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Rule' }));
    root.appendChild(chipRow('Rotation rule', RULES.map(function (r) { return r[1]; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Cat = 20 ms, search = 900 ms. The quantum is the one from the article\'s Go code; real tools rotate by request, with weights.' }));
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
      out.insertBefore(el('p', { class: 'lb-counters', text: 'Counters before P1: ' + counters.slice(0, n).map(function (c, i) { return NAMES[i] + ' = ' + fmt(c); }).join(' · ') }), out.firstChild);
      if (!four) out.appendChild(verdict('The three replicas start together, so the result is the same as round robin\'s: the 3 searches still land on catalogo-2. ' + ratioText(s.hi, s.lo), true));
      else if (S.z === 0) out.appendChild(verdict('All 9 requests went to catalogo-4: it has counter 0 and the others have 3,000. That would be 3,000 requests in a row, an involuntary denial of service.', true));
      else out.appendChild(verdict('With the counters reset (or windowed), catalogo-4 joins like the others and the requests spread across all four. ' + ratioText(s.hi, s.lo)));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Pool' }));
    root.appendChild(chipRow('Replicas in the pool', ['Just the 3 replicas', 'catalogo-4 joins with counter 0'], pB, function (i) { S.p = i; render(); }));
    zRow = el('div');
    zRow.appendChild(el('p', { class: 'sr-sub', text: 'Counters of the other three' }));
    zRow.appendChild(chipRow('Counters', ['Accumulated (3,000 each)', 'Reset or windowed'], zB, function (i) { S.z = i; render(); }));
    root.appendChild(zRow);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'This is the article\'s least request: it counts requests already served. Envoy\'s LEAST_REQUEST counts active requests (lesson 6).' }));
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
      if (rule === 'rr') msg = 'Round robin looks at nothing: searches P2, P5 and P8 land on catalogo-2.';
      else if (rule === 'lc' && S.i) msg = 'catalogo-1 looks busy (5 idle connections) and barely gets any request, while catalogo-2 takes too many searches. An open connection is not work.';
      else if (rule === 'lc') msg = 'Without idle connections, open connections and pending requests coincide, and least connection gets it right.';
      else msg = 'LOR only counts requests without a response: the 5 idle connections don\'t weigh, and the work splits evenly (one search and two cats on each).';
      out.appendChild(verdict(msg + ' ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Rule' }));
    root.appendChild(chipRow('Choice rule', rules.map(function (r) { return r[1]; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Keep-alive' }));
    root.appendChild(chipRow('Idle connections', ['No idle connections', '5 idle connections on catalogo-1'], iB, function (i) { S.i = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: intro }));
    render();
  }
  function wSimLc(root) {
    wSimConn(root, [['rr', 'Round robin'], ['lc', 'Least connection']],
      'Requests arrive one every 100 ms. In each row, the numbers are the open connections of catalogo-1 · 2 · 3 at the moment of the choice; a tie goes to the first.');
  }
  function wSimLor(root) {
    wSimConn(root, [['rr', 'Round robin'], ['lc', 'Least connection'], ['lor', 'LOR']],
      'Requests arrive one every 100 ms. In each row, the numbers are what the rule compared on catalogo-1 · 2 · 3; a tie goes to the first.');
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
        out.appendChild(verdict('Lena (177.38.20.5): h = 20 × 256 + 5 = 5,125, and 5,125 % 3 = 1, always catalogo-2. Each client has its fixed replica, and the math doesn\'t look at the cost of the request. ' + ratioText(s.hi, s.lo), s.hi / (s.lo || 1) > 1.5));
        return;
      }
      var total = [10, 9, 10000][S.n], num = [0, 0, 0], i;
      if (S.n === 1) {
        var r9 = run('rnd', { n: 3, rnd: draw.slice(0, 9) });
        var s9 = showRun(out, r9, 3);
        out.appendChild(verdict('9 requests drawn: ' + r9.num.join(' · ') + '. ' + ratioText(s9.hi, s9.lo), s9.hi / (s9.lo || 1) > 1.5));
        return;
      }
      var seq = S.n === 0 ? draw.slice(0, 10) : sorteia(10000);
      seq.forEach(function (v) { num[v]++; });
      var max = Math.max.apply(null, num);
      var box = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Requests per replica: ' + num.join(', ') });
      for (i = 0; i < 3; i++) {
        box.appendChild(el('div', { class: 'sr-bar' }, [
          el('span', { text: NAMES[i] }),
          el('div', { class: 'sr-track' }, [el('div', { class: 'sr-fill' + (num[i] === max ? ' cap' : ''), style: 'width:' + (num[i] / max * 100) + '%' }),
            el('span', { class: 'sr-lbl', text: fmt(num[i]) + ' (' + fmt(Math.round(num[i] / total * 1000) / 10) + '%)' })])
        ]));
      }
      out.appendChild(box);
      out.appendChild(verdict(S.n === 0
        ? '10 requests drawn: ' + num.join(' · ') + '. With little traffic the draw comes out uneven.'
        : '10,000 requests drawn: ' + num.map(fmt).join(' · ') + '. With a lot of traffic each replica gets close to 1/3.', S.n === 0 && max - Math.min.apply(null, num) > 1));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Rule' }));
    root.appendChild(chipRow('Choice rule', ['IP hash', 'Random'], rB, function (i) { S.r = i; render(); }));
    nRow = el('div');
    nRow.appendChild(el('p', { class: 'sr-sub', text: 'How many requests' }));
    nRow.appendChild(chipRow('Number of requests', ['10 requests', 'The 9 in the queue', '10,000 requests'], nB, function (i) { S.n = i; render(); }));
    root.appendChild(nRow);
    again = el('button', { type: 'button', class: 'btn', text: 'Draw again' });
    again.addEventListener('click', function () { draw = sorteia(10); render(); });
    root.appendChild(again);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The initial draw is the figure\'s (2 · 5 · 3). The example hash uses the last two numbers of the IP; NGINX and Envoy use real hash functions.' }));
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
          el('span', { class: 'sr-lbl', text: fmt(moved) + ' of ' + fmt(total) + ' (' + fmt(Math.round(pct * 10) / 10) + '%)' })])
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
      out.appendChild(el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Clients that change replica: modulo ' + mod + ' of ' + C + ', consistent hashing ' + cons + ' of ' + C }, [
        bar('Modulo (% ' + N + ' → % ' + (N - 1) + ')', mod, C, 'cap'),
        bar('Consistent hashing', cons, C, 'win')
      ]));
      var pm = Math.round(mod / C * 100), pc = Math.round(cons / C * 100);
      var msg = 'With ' + N + ' → ' + (N - 1) + ' replicas, the modulo changed ' + pm + '% of the clients and consistent hashing, ' + pc + '%. In general, it\'s (N − 1)/N = ' + (N - 1) + '/' + N + ' against 1/N = 1/' + N + ' (only those that were on the replica that left). Each client that changes loses the session and the local cache of the old replica.';
      if (C < N * (N - 1)) msg += ' With so few clients the sample is misleading: choose 180 or 1,800.';
      out.appendChild(verdict(msg, C >= N * (N - 1) && N >= 4));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Pool size before the departure' }));
    root.appendChild(chipRow('Replicas before', POOLS.map(function (n) { return n + ' replicas'; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Clients' }));
    root.appendChild(chipRow('Number of clients', CLIENTS.map(function (n) { return n + ' clients'; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Clients are numbered h = 0, 1, 2… and the replica is h % N, as in the figure. The last replica leaves.' }));
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
      out.appendChild(el('p', { class: 'lb-read', text: 'catalogo-2 hangs at 20:00:00' }));
      out.appendChild(ticks);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Leaves the pool in', out15 + ' s', 'at ' + clock(0, out15)),
        fact('Requests that fail', fmt(share), 'of ' + fmt(all) + ' (1 in 3)'),
        fact('Returns to the pool in', back + ' s', 'at ' + clock(300, back) + ' if it returns at 20:05:00')
      ]));
      var msg = 'Leaves the pool after ' + H + (H === 1 ? ' failure' : ' failures') + ' in a row, one every ' + I + ' s: ' + I + ' × ' + H + ' = ' + out15 + ' s. In that time, 1 in 3 of the ' + fmt(all) + ' requests lands on the stopped replica and fails.';
      if (H === 1) msg += ' With threshold 1, a check lost to a network hiccup already takes a healthy replica out of the pool.';
      if (T > I) msg += ' Careful: the timeout (' + T + ' s) is longer than the interval (' + I + ' s), so a check starts before the previous one ends.';
      out.appendChild(verdict(msg, out15 > 20 || H === 1));
    }
    function fact(label, big, small) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: big }), el('small', { class: 'lb-sub', text: small })]); }
    function pad2(v) { return (v < 10 ? '0' : '') + v; }
    function clock(base, add) { var t = base + add; return '20:' + pad2(Math.floor(t / 60)) + ':' + pad2(t % 60); }
    function group(title, labels, btns, key) {
      root.appendChild(el('p', { class: 'sr-sub', text: title }));
      root.appendChild(chipRow(title, labels, btns, function (i) { S[key] = i; render(); }));
    }
    group('Interval between checks', INT.map(function (v) { return v + ' s'; }), iB, 'i');
    group('Timeout of each check', TMO.map(function (v) { return v + ' s'; }), tB, 't');
    group('Failures in a row to leave the pool', THR.map(function (v) { return String(v); }), hB, 'h');
    group('Successes in a row to return', OK.map(function (v) { return String(v); }), oB, 'o');
    group('Requests per second', RPS.map(function (v) { return v + ' per s'; }), rB, 'r');
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'With 5 s × 3 failures = 15 s (20:00:15), as in the lesson. The math assumes the replica hangs right before a check. With 3 replicas in the pool, 1 in 3 requests lands on it.' }));
    render();
  }

  /* =============== AULA 8: L4 ou L7 enxerga isto? =============== */
  function wCamadas(root) {
    var ROWS = [
      ['Source IP', '177.38.20.5', 4, 'It\'s in the IP header, outside the envelope.'],
      ['Source port', '51514', 4, 'It\'s in the TCP header, outside the envelope.'],
      ['Destination IP', '203.0.113.10', 4, 'It\'s lb-loja\'s address: it comes in the IP header.'],
      ['Destination port', '443', 4, 'It\'s in the TCP header and says it\'s HTTPS.'],
      ['Method and path', 'GET /produtos/42', 7, 'It\'s inside the HTTP, which travels encrypted by TLS. Only whoever terminates TLS reads it.'],
      ['Host header', 'loja.com.br', 7, 'It\'s an HTTP header, also encrypted.'],
      ['Session cookie', 'sessao=…', 7, 'It\'s an HTTP header, also encrypted.']
    ];
    var S = ROWS.map(function () { return null; });
    var out = el('div', { class: 'lb-out', 'aria-live': 'polite' });
    var rowsEl = el('ul', { class: 'lb-fields' }), sum = verdict('Choose an option on each row.');
    var btns = [];
    function paint() {
      var right = 0, answered = 0;
      ROWS.forEach(function (r, i) {
        var v = S[i], li = rowsEl.children[i], fb = li.querySelector('.lb-why');
        btns[i].forEach(function (b, k) { b.setAttribute('aria-pressed', v === (k === 0 ? 4 : 7) ? 'true' : 'false'); });
        li.className = 'lb-field' + (v == null ? '' : v === r[2] ? ' yes' : ' no');
        if (v != null) { answered++; if (v === r[2]) right++; }
        fb.textContent = v == null ? '' : (v === r[2] ? 'Right. ' : 'No: ') + (r[2] === 4 ? 'layer 4 already sees this. ' : 'only layer 7 sees this. ') + r[3];
      });
      sum.textContent = answered < ROWS.length ? answered + ' of ' + ROWS.length + ' answered.' : right + ' of ' + ROWS.length + ' right. Layer 4 sees the 4 address and port fields; layer 7 sees everything, but only after terminating TLS.';
      sum.className = 'sr-verdict' + (answered === ROWS.length && right < ROWS.length ? ' bad' : '');
    }
    ROWS.forEach(function (r, i) {
      var pair = [];
      var group = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Who sees it: ' + r[0] });
      [['Layer 4 too', 4], ['Only layer 7', 7]].forEach(function (o) {
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
    root.appendChild(el('p', { class: 'sr-note', text: 'Lena\'s request to loja.com.br: TCP 177.38.20.5:51514 → 203.0.113.10:443, and inside, GET /produtos/42 HTTP/1.1 with Host and Cookie.' }));
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
