/* SDLabs · Concurrency and Parallelism: widgets in plain JS (English)
   (Bia × Caio race, lock TTL against the owner's pause, reserve × cancel deadlock, connection pool, Amdahl speedup).
   They use the store from the brief: GATO-042 with 1 unit, SELECT and UPDATE of 2 ms, Redis of 1 ms, relatorios with 4 vCPU and 42 s sequential. */
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
  function svg(tag, attrs, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null) continue;
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); }
  function sec(ms) { return fmt(ms / 1000, 3) + ' s'; }

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
    var id = 'cc-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, sync: sync, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function toggle(label, on, onChange) {
    var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', text: label });
    b.addEventListener('click', function () {
      var v = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      onChange(v);
    });
    return b;
  }

  /* =============== LESSON 6: Bia × Caio, every order =============== */
  function wCorrida(root) {
    var NAMES = { B1: 'Bia checks', B2: 'Bia decrements', C1: 'Caio checks', C2: 'Caio decrements' };
    var STEPS = ['B1', 'B2', 'C1', 'C2'];
    var S = { mutex: false, seq: [], all: false };

    // the 6 ways to interleave B1<B2 and C1<C2
    var ALL = [];
    (function gen(seq, b, c) {
      if (b === 2 && c === 2) { ALL.push(seq.slice()); return; }
      if (b < 2) { seq.push('B' + (b + 1)); gen(seq, b + 1, c); seq.pop(); }
      if (c < 2) { seq.push('C' + (c + 1)); gen(seq, b, c + 1); seq.pop(); }
    })([], 0, 0);

    function sim(seq) {
      var q = 1, read = {}, made = { B: false, C: false }, log = [];
      seq.forEach(function (s) {
        var who = s.charAt(0), name = who === 'B' ? 'Bia' : 'Caio';
        if (s.charAt(1) === '1') { read[who] = q; log.push(name + ' reads quantidade = ' + (q < 0 ? '−' + Math.abs(q) : q) + ' (SELECT)'); }
        else if (read[who] >= 1) { q -= 1; made[who] = true; log.push(name + ' decrements: quantidade = ' + (q < 0 ? '−' + Math.abs(q) : q) + ' (UPDATE)'); }
        else log.push(name + ' saw 0: answers 409 out of stock');
      });
      return { q: q, made: made, log: log, pedidos: (made.B ? 1 : 0) + (made.C ? 1 : 0) };
    }
    function valid(seq) {
      if (!S.mutex) return true;
      return seq.join(' ') === 'B1 B2 C1 C2' || seq.join(' ') === 'C1 C2 B1 B2';
    }
    function enabled(s) {
      if (S.seq.indexOf(s) >= 0) return false;
      var who = s.charAt(0), n = s.charAt(1);
      if (n === '2' && S.seq.indexOf(who + '1') < 0) return false;
      if (S.mutex) {
        // whoever started holds the lock until the decrement; the other only gets in afterwards
        var other = who === 'B' ? 'C' : 'B';
        var otherOpen = S.seq.indexOf(other + '1') >= 0 && S.seq.indexOf(other + '2') < 0;
        if (otherOpen) return false;
      }
      return true;
    }

    var ctl = el('div', { class: 'ib-ctrl' });
    var out = el('div', { class: 'cr-out', 'aria-live': 'polite' });
    var list = el('div', { class: 'cr-list' });
    var mx = toggle('Add mutex', false, function (v) { S.mutex = v; S.seq = []; render(); });
    var allBtn = toggle('All orders', false, function (v) { S.all = v; render(); });
    var reset = el('button', { type: 'button', class: 'btn', text: 'Reset' });
    reset.addEventListener('click', function () { S.seq = []; render(); });
    ctl.appendChild(mx); ctl.appendChild(allBtn); ctl.appendChild(reset);
    var picks = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Build an order' });
    var pickBtns = {};
    STEPS.forEach(function (s) {
      var b = el('button', { type: 'button', class: 'chip', text: s + ' · ' + NAMES[s] });
      b.addEventListener('click', function () { if (enabled(s)) { S.seq.push(s); render(); } });
      pickBtns[s] = b; picks.appendChild(b);
    });

    function render() {
      STEPS.forEach(function (s) {
        var on = enabled(s);
        pickBtns[s].disabled = !on;
        pickBtns[s].style.opacity = on ? '' : '.45';
      });
      clear(out);
      if (S.seq.length === 0) {
        out.appendChild(el('p', { class: 'cr-say', text: 'Tap the steps in the order they happen. Each customer does two: check (SELECT) and decrement (UPDATE). It starts with 1 cat in stock.' }));
      } else {
        out.appendChild(el('p', { class: 'cr-seq', text: 'Order: ' + S.seq.join(' → ') }));
        var r = sim(S.seq);
        var ol = el('ol', { class: 'ls-list' });
        r.log.forEach(function (l) { ol.appendChild(el('li', { text: l })); });
        out.appendChild(ol);
        if (S.seq.length === 4) {
          var bad = r.q < 0;
          out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: bad ? 'Final stock: −1. ' : 'Final stock: ' + r.q + '. ' }),
            bad ? 'Two reservations for 1 cat: both read 1 before any decrement.' : 'Only one order went through (' + (r.made.B ? 'Bia, 1049' : 'Caio') + '): one finished completely before the other started.']));
        }
      }
      // the 6 (or 2) orders
      clear(list);
      var shown = ALL.filter(valid);
      var neg = shown.filter(function (s) { return sim(s).q < 0; }).length;
      if (S.all) {
        var tb = el('tbody');
        shown.forEach(function (s) {
          var r = sim(s), bad = r.q < 0;
          var cur = S.seq.length === 4 && s.join(' ') === S.seq.join(' ');
          tb.appendChild(el('tr', { class: cur ? 'cr-cur' : '' }, [
            el('th', { scope: 'row', text: s.join(' ') }),
            el('td', { class: 'cc-cell ' + (bad ? 'bad' : 'ok'), text: bad ? '−1' : String(r.q) }),
            el('td', { text: r.pedidos + (r.pedidos === 1 ? ' order' : ' orders') })
          ]));
        });
        list.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table' }, [
          el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'order' }), el('th', { scope: 'col', text: 'stock' }), el('th', { scope: 'col', text: 'sales' })])]), tb])]));
        list.appendChild(el('p', { class: 'sr-verdict ' + (neg ? 'bad' : '') }, [el('strong', { text: neg + ' of ' + shown.length + ' orders give −1. ' }),
          S.mutex ? 'With the mutex, a customer\'s check and decrement stay together: only the 2 safe orders are left.' : 'Only B1 B2 C1 C2 and C1 C2 B1 B2 (one whole order, then the other) work out.']));
      }
    }
    root.appendChild(ctl);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Build the order of the 4 steps' }));
    root.appendChild(picks);
    root.appendChild(out);
    root.appendChild(list);
    render();
  }

  /* =============== LESSON 8: lock TTL against the owner's pause =============== */
  function wTtl(root) {
    var ttl = slider('Lock TTL', 1, 10, 1, 5, 's');
    var pause = slider('Owner pause before the UPDATE', 0, 10, 0.5, 6, 's', function (v) { return fmt(v, 1); });
    var S = { fence: false };
    var out = el('div', { class: 'lk-out', 'aria-live': 'polite' });
    var fenceBtn = toggle('Fencing token in the database (33 against 34)', false, function (v) { S.fence = v; render(); });

    function render() {
      var T = +ttl.input.value * 1000, P = +pause.input.value * 1000;
      var expiry = T + 1;                       // the key goes away 1 ms after the SET at t = 1 ms plus the TTL
      var release = P + 6;                      // 1 ms of SET + pause + 4 ms of work + 1 ms of DEL
      var tryAt = function (from) { return 3 + 50 * Math.ceil((from - 3) / 50); };
      var two = P > T + 1;                        // the owner is still stopped when the lock expires
      var ev = [];
      ev.push([1, 'Bia takes the lock (token a1, TTL ' + fmt(T / 1000, 0) + ' s) and stays stopped ' + fmt(P / 1000, 1) + ' s']);
      var verdict, bad = false, win = '';
      var tC = null;
      if (two) {
        tC = tryAt(expiry);
        ev.push([expiry, 'The TTL expires: the key goes away']);
        if (tC > 10000) {
          ev.push([10000, 'Caio gives up at 10 s, before the lock expires']);
          verdict = 'Caio gave up before the expiry. Bia wakes up with the lock already expired, but nobody took it: her UPDATE gives 0 (stock 0).';
          ev.push([P, 'Bia wakes up and runs the UPDATE → quantidade 0']);
        } else {
          ev.push([tC, 'Caio takes the lock (token b2), reads 1, decrements to 0 and buys']);
          ev.push([Math.max(P, tC + 8), 'Bia wakes up and still thinks she has the lock; runs the UPDATE' + (S.fence ? ' with token 33' : '')]);
          win = 'two-owner window: from ' + sec(tC) + ' to ' + sec(Math.max(P, tC + 8));
          if (S.fence) { ev.push([Math.max(P, tC + 8) + 1, 'The database has already seen token 34 and refuses 33: Bia\'s UPDATE fails']); verdict = 'With the fencing token the database refuses the late write. Final stock: 0. Bia gets an error and Caio keeps the cat.'; }
          else { verdict = 'Final stock: −1. Both thought they owned the lock, and Bia\'s UPDATE ran over Caio\'s.'; bad = true; }
        }
      } else {
        ev.push([P + 2, 'Bia runs the UPDATE → quantidade 0 (the lock is still hers)']);
        var tn = tryAt(release);
        ev.push([release, 'Bia releases the lock']);
        ev.push([tn + 3, 'Caio gets in (attempt at ' + sec(tn) + '), reads 0 and gets 409']);
        verdict = 'Bia finishes before the TTL expires, so only one owner exists at each moment. Final stock: 0 and Caio gets 409.';
      }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: two ? (win ? 'There is a window with two owners. ' : 'The TTL expired. ') : 'No two-owner window. ' }), verdict]));
      var tb = el('tbody');
      ev.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (e) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: sec(e[0]) }), el('td', { text: e[1] })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table lk-table' }, [tb])]));
      // 0 to 10 s ruler: who holds the lock; the red band is the two-owner one
      var tr = el('div', { class: 'lk-track', role: 'img', 'aria-label': 'Timeline of the lock from 0 to 10 seconds' });
      var seg = function (a, b, cls, label) {
        if (b <= a) return;
        tr.appendChild(el('div', { class: 'lk-seg ' + cls, style: 'left:' + (a / 10000 * 100) + '%;width:' + ((b - a) / 10000 * 100) + '%', text: (b - a) >= 1400 ? label : '' }));
      };
      if (two) {
        seg(0, Math.min(T, 10000), 'ok', 'Bia');
        if (tC !== null && tC <= 10000) {
          seg(Math.min(T, 10000), tC, 'idle', 'expired');
          var endTwo = Math.min(Math.max(P, tC + 8), 10000);
          seg(tC, endTwo, 'bad', 'two owners');
        } else seg(Math.min(T, 10000), Math.min(P, 10000), 'idle', 'expired');
      } else {
        seg(0, Math.min(release, 10000), 'ok', 'Bia');
      }
      out.appendChild(tr);
      out.appendChild(el('div', { class: 'lk-scale' }, [0, 2, 4, 6, 8, 10].map(function (n) { return el('span', { style: 'left:' + (n * 10) + '%', text: n + ' s' }); })));
      out.appendChild(el('p', { class: 'sr-note', text: 'Caio tries every 50 ms (at 3, 53, 103 ms...) and gives up at 10 s. The lock is a SET NX PX with a 1 ms round trip. A fencing token only exists in a service that hands out an increasing number (ZooKeeper does; Redis\'s SET NX does not). With no clock at all, the UPDATE ... AND quantidade > 0 also prevents the −1.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [ttl.wrap, pause.wrap]);
    [ttl, pause].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [fenceBtn]));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 6: deadlock, reserve × cancel =============== */
  function wDeadlock(root) {
    var ORD = ['estoque → pedido', 'pedido → estoque'];
    var S = { r: 0, c: 1, global: false };
    var rB = [], cB = [];
    var out = el('div', { class: 'dl-out', 'aria-live': 'polite' });
    var gl = toggle('Global order: estoque before pedido', false, function (v) { S.global = v; render(); });
    function name(i) { return i === 0 ? 'estoque:GATO-042' : 'pedido:1049'; }
    function render() {
      var r = S.global ? 0 : S.r, c = S.global ? 0 : S.c;
      press(rB, r); press(cB, c);
      rB.concat(cB).forEach(function (b) { b.disabled = S.global; b.style.opacity = S.global ? '.45' : ''; });
      var cross = r !== c;
      var rFirst = r === 0 ? 'estoque:GATO-042' : 'pedido:1049', rSecond = r === 0 ? 'pedido:1049' : 'estoque:GATO-042';
      var cFirst = c === 0 ? 'estoque:GATO-042' : 'pedido:1049', cSecond = c === 0 ? 'pedido:1049' : 'estoque:GATO-042';
      var rows;
      if (cross) {
        rows = [
          ['0', 'reservar locks ' + rFirst, ''],
          ['1', 'cancelar locks ' + cFirst, ''],
          ['2', 'reservar wants ' + rSecond + ', which cancelar holds: waits', 'wait'],
          ['3', 'cancelar wants ' + cSecond + ', which reservar holds: waits', 'wait']
        ];
      } else {
        rows = [
          ['0', 'reservar locks ' + rFirst, ''],
          ['1', 'cancelar wants ' + cFirst + ', which reservar holds: waits', 'wait'],
          ['2', 'reservar locks ' + rSecond + ' and works', ''],
          ['3', 'reservar releases both locks; cancelar gets in and goes on', 'ok']
        ];
      }
      clear(out);
      var tb = el('tbody');
      rows.forEach(function (x) {
        tb.appendChild(el('tr', { class: x[2] === 'wait' && cross && x[0] !== '1' ? 'dl-wait' : '' }, [el('th', { scope: 'row', text: 't = ' + x[0] }), el('td', { text: x[1] })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table lk-table' }, [tb])]));
      if (cross) {
        out.appendChild(el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'Deadlock. ' }), 'reservar waits for cancelar and cancelar waits for reservar: a cycle, and nobody moves. Both goroutines stay stuck, and every future reservation of the cat hangs.']));
        out.appendChild(el('pre', { class: 'dl-pg' }, [el('code', { text: 't = 1003 ms (deadlock_timeout = 1 s no PostgreSQL)\nERROR:  deadlock detected\nDETAIL: Process A waits for ShareLock; blocked by process B.\nSQLSTATE: 40P01\n-- PostgreSQL aborts one transaction and the other goes on' })]));
        out.appendChild(el('p', { class: 'sr-note', text: 'With in-memory locks (sync.Mutex) there is no such detector: Go only warns when all goroutines are blocked. The lock names and the error text are examples.' }));
      } else {
        out.appendChild(el('p', { class: 'sr-verdict' }, [el('strong', { text: 'No cycle. ' }), S.global
          ? 'With the global order, both operations take estoque first. Whoever arrives later waits on the first lock and holds nothing the other one needs.'
          : 'Both take the locks in the same order, so nobody holds a lock the other wants to take first.']));
      }
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Lock order in reservar(1049)' }));
    root.appendChild(chipRow('Order in reservar', ORD, rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Lock order in cancelar(1049)' }));
    root.appendChild(chipRow('Order in cancelar', ORD, cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [gl]));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 10: connection pool =============== */
  function wPool(root) {
    var pool = slider('Pool size (per replica)', 1, 50, 1, 10, 'connections');
    var sim = slider('Simultaneous orders (per replica)', 1, 300, 1, 200, 'orders');
    var ms = slider('Time per query', 5, 100, 5, 20, 'ms');
    var rep = slider('estoque replicas', 1, 15, 1, 1, '', function (v) { return v + (v === 1 ? ' replica' : ' replicas'); });
    var out = el('div', { class: 'pl-out', 'aria-live': 'polite' });
    var LIMIT = 100;
    function render() {
      var P = +pool.input.value, N = +sim.input.value, T = +ms.input.value, R = +rep.input.value;
      var lotes = Math.ceil(N / P), last = lotes * T, sum = 0;
      for (var i = 1; i <= N; i++) sum += Math.ceil(i / P) * T;
      var avg = sum / N;
      var perRep = Math.min(N, P) / (T / 1000);
      var total = R * P;
      var over = total > LIMIT;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('last', last, Math.max(last, 100), fmt(last) + ' ms', last > 1000 ? 'bad' : 'cap'));
      bars.appendChild(bar('average', avg, Math.max(last, 100), fmt(avg) + ' ms', 'win'));
      bars.appendChild(bar('connections', total, Math.max(total, LIMIT), total + ' of ' + LIMIT, over ? 'bad' : 'cap'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Throughput per replica' }), el('b', { text: fmt(perRep, 0) + '/s' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Batches' }), el('b', { text: fmt(lotes, 0) + ' × ' + T + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Little: in use' }), el('b', { text: fmt(perRep, 0) + '/s × ' + T + ' ms = ' + fmt(perRep * T / 1000, 0) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Replicas × pool' }), el('b', { text: R + ' × ' + P + ' = ' + total })])
      ]));
      if (over) {
        out.appendChild(el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'The database refuses. ' }), total + ' connections go past the max_connections of ' + LIMIT + ': PostgreSQL answers FATAL: sorry, too many clients already. Reduce the pool per replica (' + R + ' × ' + Math.floor(LIMIT / R) + ' = ' + (R * Math.floor(LIMIT / R)) + '), add a pooler like PgBouncer or raise max_connections.']));
      } else {
        out.appendChild(el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Fits in the database. ' }),
          N <= P ? 'There is a slot for all ' + N + ' orders: nobody waits beyond the ' + T + ' ms of the query.'
            : 'The first ' + P + ' finish in ' + T + ' ms and the last one, in batch ' + lotes + ', in ' + fmt(last) + ' ms (average of ' + fmt(avg) + ' ms). Throughput stays at ' + fmt(perRep, 0) + '/s per replica, ' + fmt(perRep * R, 0) + '/s in total.']));
      }
      out.appendChild(el('p', { class: 'sr-note', text: 'The store\'s math: 200 orders, a pool of 10 and 20 ms give 20 batches, the last at 400 ms and an average of 210 ms. With 12 replicas, 12 × 10 = 120 goes past the 100 connections PostgreSQL accepts by default. All orders arrive together and each one holds a connection for the ms of the query.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [pool.wrap, sim.wrap, ms.wrap, rep.wrap]);
    [pool, sim, ms, rep].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 3: speedup (Amdahl) of the report =============== */
  function wAmdahl(root) {
    var BASE = 42;
    var cores = slider('Cores', 1, 16, 1, 4, 'cores');
    var ser = slider('Serial part', 0, 20, 0.01, 4.76, '%', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'am-out', 'aria-live': 'polite' });
    function S(n, s) { return 1 / (s + (1 - s) / n); }
    function render() {
      var N = +cores.input.value, s = +ser.input.value / 100;
      var sp = S(N, s), eff = sp / N * 100, t = BASE / sp, ceil = s > 0 ? 1 / s : Infinity;
      clear(out);
      var W = 520, H = 220, L = 38, B = 28, TOP = 12, R = 12;
      var maxY = 16;
      var X = function (n) { return L + (n - 1) / 15 * (W - L - R); };
      var Y = function (v) { return H - B - Math.min(v, maxY) / maxY * (H - B - TOP); };
      var g = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'am-svg', role: 'img', 'aria-label': 'Speedup curve by number of cores, with the ideal line and the chosen point' });
      [0, 4, 8, 12, 16].forEach(function (v) {
        g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'am-grid' }));
        g.appendChild(svg('text', { x: L - 6, y: Y(v) + 4, class: 'am-tick', 'text-anchor': 'end', text: v + '×' }));
      });
      [1, 4, 8, 12, 16].forEach(function (n) { g.appendChild(svg('text', { x: X(n), y: H - 8, class: 'am-tick', 'text-anchor': 'middle', text: String(n) })); });
      g.appendChild(svg('line', { x1: X(1), y1: Y(1), x2: X(16), y2: Y(16), class: 'am-ideal' }));
      if (isFinite(ceil) && ceil <= maxY) g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(ceil), y2: Y(ceil), class: 'am-ceil' }));
      var pts = [];
      for (var n = 1; n <= 16; n++) pts.push(X(n) + ',' + Y(S(n, s)));
      g.appendChild(svg('polyline', { points: pts.join(' '), class: 'am-curve' }));
      g.appendChild(svg('circle', { cx: X(N), cy: Y(sp), r: 6, class: 'am-dot' }));
      out.appendChild(g);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Speedup' }), el('b', { text: fmt(sp, 1) + '×' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Efficiency' }), el('b', { text: fmt(eff, 0) + '%' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Close (base 42 s)' }), el('b', { text: fmt(t, 1) + ' s' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Ceiling with infinite cores' }), el('b', { text: isFinite(ceil) ? fmt(ceil, 1) + '×' : 'no ceiling' })])
      ]));
      var msg = N === 1 ? 'With 1 core there is no gain: it is the 42 s sequential.'
        : sp >= N - 0.05 ? 'With no serial part, each new core pays off in full: ' + N + ' cores, ' + N + '×.'
        : N + ' cores give ' + fmt(sp, 1) + '×, not ' + N + '×: the serial part of ' + fmt(s * 100, 1) + '% (summing the partial results and saving) does not shrink.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (eff < 50 ? 'bad' : '') }, [el('strong', { text: '23:00 report. ' }), msg + (N === 4 && Math.abs(s - 2 / 42) < 0.0015 ? ' It is the 42 ÷ 12 = 3.5× from the lesson.' : '')]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Formula: speedup = 1 ÷ (serial + (1 − serial) ÷ cores). The real serial part is 2 s out of 42, or 4.8%. The dashed line is the ideal gain (N×); the dotted one is the ceiling 1 ÷ serial.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Shortcuts' });
    [['Real report: 4 cores, 4.8%', 4, 4.76], ['8 cores, 4.8%', 8, 4.76], ['16 cores, 4.8%', 16, 4.76], ['No serial part', 4, 0]].forEach(function (p) {
      var b = el('button', { type: 'button', class: 'chip', text: p[0] });
      b.addEventListener('click', function () { cores.input.value = p[1]; ser.input.value = p[2]; cores.sync(); ser.sync(); render(); });
      presets.appendChild(b);
    });
    var ctrls = el('div', { class: 'sr-ctrls' }, [cores.wrap, ser.wrap]);
    [cores, ser].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(presets);
    root.appendChild(out);
    render();
  }

  var REG = { corrida: wCorrida, ttl: wTtl, deadlock: wDeadlock, pool: wPool, amdahl: wAmdahl };
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
