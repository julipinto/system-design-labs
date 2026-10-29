/* SDLabs · Scale Cube: plain JS widgets (English copy of widgets.js)
   (diagnosis by symptom, cube and pods, vCPU per axis, Z router, scatter-gather).
   They use the store from the brief: `pedidos` with 30 orders/s per replica and 150/s on a single-primary database, demand of 200/s,
   catalog of 10 replicas, 25 vCPU of services against 80 of monolith, murmur3(key) mod N with the customers
   lena-77, bia-31, caio-58 and davi-12. */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); }

  function chipRow(label, labels, btns, onPick, cls) {
    var row = el('div', { class: cls || 'sr-chips', role: 'group', 'aria-label': label });
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
    var id = 'sc-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function field(label, type, value, attrs) {
    var id = 'sc-in-' + (++uid);
    var a = { id: id, type: type, value: String(value) };
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table sc-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }

  /* murmur3 (32 bits, seed 0). Matches the vectors "" → 0, "hello" → 0x248bfa47 e
     "The quick brown fox jumps over the lazy dog" → 0x2e4ff723. */
  function murmur3(str) {
    var d = new TextEncoder().encode(str), len = d.length, h = 0, c1 = 0xcc9e2d51, c2 = 0x1b873593, i = 0, k;
    for (var n = len >> 2; n > 0; n--, i += 4) {
      k = (d[i] | d[i + 1] << 8 | d[i + 2] << 16 | d[i + 3] << 24) >>> 0;
      k = Math.imul(k, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0;
      h = (h ^ k) >>> 0; h = ((h << 13) | (h >>> 19)) >>> 0; h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
    }
    k = 0;
    switch (len & 3) {
      case 3: k ^= d[i + 2] << 16; /* falls through */
      case 2: k ^= d[i + 1] << 8; /* falls through */
      case 1:
        k ^= d[i]; k = Math.imul(k >>> 0, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0;
        h = (h ^ k) >>> 0;
    }
    h = (h ^ len) >>> 0; h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 0xc2b2ae35) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }
  function shardOf(key, n) { return murmur3(key) % n; }

  /* =============== LESSON 1: diagnosis by symptom =============== */
  var SYM = [
    { t: 'Catalog with CPU at 99% and p99 of 2,000 ms; at the 950 req/s peak the fleet reaches 95%', src: 'module 14', ax: 'X',
      said: 'CPU at 95% with 950 req/s on 10 replicas, against 1,000 req/s of capacity.',
      why: 'X: clone. The HPA formula gives ⌈10 × 95 ÷ 70⌉ = 14 replicas, identical copies of a stateless service.' },
    { t: 'The 11 PM close takes checkout down (page goes from 120 ms to 2.4 s)', src: 'module 6', ax: 'Y',
      said: 'The heavy report fights checkout for CPU and database inside the same program.',
      why: 'Y: split by function. Cloning the monolith would clone the report too; the right move is to put relatorios in a service (and a database) of its own.' },
    { t: '40-minute deploy, with three teams waiting on each other', src: 'module 8', ax: 'Y',
      said: 'The problem is not capacity: it is organization, with one program and three owners.',
      why: 'Y: it is the only axis that increases organizational scalability. Each team owns code and data and ships on its own.' },
    { t: 'pagamentos with a capacity of 40/s and estoque idle at 1,000/s', src: 'module 14', ax: 'X',
      said: 'The weakest link of checkout is pagamentos (40/s); estoque uses 4% of its capacity.',
      why: 'X, but only on the right link: pagamentos from 2 to 4 replicas gives 80/s. Doubling estoque only doubles the CPU bill, and the output stays at 40/s.' },
    { t: 'pedidos database at the 150 orders/s ceiling, with 50 million rows', src: 'modules 14 and 16', ax: 'Z',
      said: 'The ceiling belongs to the single-primary database, not to the service.',
      why: 'X does not help: 7 replicas give 210/s of service and the database stays at 150/s. Z: 3 shards give 3 × 150 = 450/s.' },
    { t: 'One customer (mkt-01, the marketplace from module 8) with 40% of the orders', src: 'module 16', ax: 'Z',
      said: 'A single customer concentrates the write load of a table.',
      why: 'Z by customer type: a shard dedicated to mkt-01. Y does not split it (it is the same function) and X does not relieve the database.' },
    { t: 'The SP region goes down and takes everything with it', src: 'module 27', ax: 'Z',
      said: 'The whole region is a single failure domain.',
      why: 'Z by region (pods): each region with its own application and its own data, and X inside each pod. If SP goes down, only SP goes away.' },
    { t: 'The search takes 900 ms per request', src: 'module 7', ax: 'none',
      said: 'Each request spends 900 ms in code, alone, with no queue.',
      why: 'No axis. Cloning from 10 to 20 replicas only shrinks the queue; each search still takes 900 ms. The way out is an index (module 4) or a cache (module 5).' }
  ];
  var AXES = ['X', 'Y', 'Z', 'none'];

  function wDiagnostico(root) {
    var S = { s: 0, a: -1 }, sb = [], ab = [];
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var s = SYM[S.s];
      out.appendChild(el('p', { class: 'sr-note', text: 'What the bottleneck said (' + s.src + '): ' + s.said }));
      if (S.a < 0) { out.appendChild(el('p', { class: 'sr-note', text: 'Pick an axis to see the reasoning.' })); return; }
      var ok = AXES[S.a] === s.ax;
      out.appendChild(el('p', { class: 'sr-verdict ' + (ok ? '' : 'bad') }, [
        el('strong', { text: ok ? 'Right: ' + (s.ax === 'none' ? 'no axis. ' : s.ax + ' axis. ') : 'Not that one: the axis is ' + (s.ax === 'none' ? '"none". ' : s.ax + '. ') }),
        s.why
      ]));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'The symptom' }));
    root.appendChild(chipRow('Symptom', SYM.map(function (x) { return x.t; }), sb, function (i) { S.s = i; S.a = -1; press(sb, i); press(ab, -1); render(); }, 'sc-sym'));
    root.appendChild(el('p', { class: 'sr-sub', text: 'The axis' }));
    root.appendChild(chipRow('Axis', ['X (clone)', 'Y (by function)', 'Z (by data)', 'None'], ab, function (i) { S.a = i; press(ab, i); render(); }));
    root.appendChild(out);
    press(sb, 0); press(ab, -1);
    render();
  }

  /* =============== LESSONS 2 and 6: cube and pods of pedidos =============== */
  var PER_POD = 30, DB = 150, POOL = 10, MAXCONN = 100, OTHERS = 27; /* 27 = the store's other pods (30 − 3 from pedidos) */
  function wCuboPods(root) {
    var X = slider('X: replicas per partition', 1, 20, 1, 3);
    var Z = slider('Z: partitions (shards)', 1, 6, 1, 1);
    var D = slider('Order demand', 1, 400, 1, 200, 'orders/s');
    var yb = [], Y = 1;
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var x = +X.input.value, z = +Z.input.value, dem = +D.input.value;
      var pods = x * z, svc = pods * PER_POD, db = z * DB, sai = Math.min(dem, svc, db);
      var lim = dem <= Math.min(svc, db) ? 'none: the demand fits' : (svc < db ? 'the service (replicas)' : svc > db ? 'the database (partitions)' : 'the service and the database, tied');
      var vcpu = Y === 0 ? pods * 8 : pods * 1;
      var lojaPods = Y === 0 ? pods : OTHERS + pods;
      var connPod = x * POOL, connAll = pods * POOL;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Point (X, Y, Z)', '(' + x + ', ' + (Y === 0 ? 1 : 9) + ', ' + z + ')'),
        fact('pedidos pods (X × Z)', String(pods)),
        fact('Store pods', String(lojaPods)),
        fact('vCPU of these pods', String(vcpu))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Demand', dem, 450, fmt(dem, 0) + '/s', ''),
        bar('Service', svc, 450, fmt(svc, 0) + '/s', svc < db ? 'cap' : ''),
        bar('DB', db, 450, fmt(db, 0) + '/s', db < svc ? 'cap' : ''),
        bar('Output', sai, 450, fmt(sai, 0) + '/s (' + fmt(sai / dem * 100, 0) + '%)', 'win')
      ]));
      var bad = sai < dem;
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [
        el('strong', { text: bad ? 'Output: ' + fmt(sai, 0) + ' of ' + fmt(dem, 0) + ' orders/s. ' : 'The demand fits. ' }),
        'Limiting link: ' + lim + '. ' + (bad && svc > db ? 'More replicas (X) change nothing: the database is the ceiling, and only more partitions (Z) move it.' : '') +
        (bad && svc < db ? 'The database still has headroom: more replicas (X) fix it.' : '') +
        (!bad ? 'Each database sits at ' + fmt(dem / z / DB * 100, 0) + '% (with the load evenly split).' : '')
      ]));
      var warn = connAll >= MAXCONN;
      out.appendChild(el('p', { class: 'sr-note', text: 'Connections per database, with a pool of ' + POOL + ' per replica: ' + connPod + ' in the pods-per-shard model (only its own ' + x + ' replicas), ' + connAll + ' if all ' + pods + ' replicas talk to all the shards' + (warn ? ', at the ' + MAXCONN + ' limit of the default PostgreSQL max_connections.' : ' (default PostgreSQL limit: ' + MAXCONN + ').') }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacity of ' + PER_POD + ' orders/s per pod (33 ms of CPU per order, module 14) and ' + DB + '/s per single-primary database. In the monolith, each pod is a whole copy of 8 vCPU; with 9 services, the pedidos pod has 1 vCPU. X and Z apply in both cases: only Y requires services.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Y: how the program is split' }));
    root.appendChild(chipRow('Y', ['Monolith (Y = 1)', '9 services (Y = 9)'], yb, function (i) { Y = i; press(yb, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [X.wrap, Z.wrap, D.wrap]));
    X.input.addEventListener('input', render); Z.input.addEventListener('input', render); D.input.addEventListener('input', render);
    root.appendChild(out);
    Y = 1; press(yb, 1);
    render();
  }

  /* =============== LESSON 4: vCPU per axis =============== */
  var MONO = 8, FIXED = 15; /* carrinho 3 + pedidos 3 + pagamentos 2 + estoque 2 + entregas 1 + relatorios 4 */
  function wVcpu(root) {
    var M = slider('Storefront traffic', 1, 20, 1, 10, '×', function (v) { return v + '×'; });
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var m = +M.input.value, mono = MONO * m, svc = FIXED + m, diff = mono - svc;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Monolith: ' + m + ' × 8 vCPU', mono + ' vCPU'),
        fact('Services: ' + m + ' (catalog) + ' + FIXED, svc + ' vCPU'),
        fact(diff >= 0 ? 'Savings from Y' : 'Extra cost of Y', Math.abs(diff) + ' vCPU (' + fmt(Math.abs(diff) / mono * 100, 0) + '%)')
      ]));
      var max = Math.max(mono, svc);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Monolith', mono, max, mono + ' vCPU', 'cap'),
        bar('Services', svc, max, svc + ' vCPU', 'win')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (diff < 0 ? 'bad' : '') }, [
        el('strong', { text: m === 10 ? '10×: 80 against 25 vCPU. ' : diff < 0 ? 'At 1× the monolith is cheaper. ' : fmt(mono, 0) + ' against ' + svc + ' vCPU. ' }),
        diff < 0 ? 'When all the parts ask for little, 7 services pay the floor of each one (cart 3, orders 3, payments 2, stock 2, deliveries 1 and reports 4 vCPU). Y pays off when only one part, the catalog, grows.'
          : 'Only the storefront grows with traffic: the monolith clones the whole program (8 vCPU per copy), and the services clone only the catalog (1 vCPU per copy).'
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'The 15 vCPU outside the catalog are the Black Friday ones (cart 3 × 1, orders 3 × 1, payments 2 × 1, stock 2 × 1, deliveries 1 × 1, reports 1 × 4) and stay fixed in this widget; the catalog is 1 vCPU per replica. The monolith is 8 vCPU per copy, and the number of copies follows the traffic.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [M.wrap]));
    M.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 5: Z router =============== */
  var CLIENTES = ['lena-77', 'bia-31', 'caio-58', 'davi-12'];
  function wRoteador(root) {
    var key = field('cliente_id', 'text', 'caio-58', { autocomplete: 'off', spellcheck: 'false', maxlength: '40' });
    var N = slider('Shards', 2, 6, 1, 3);
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var k = key.input.value.trim() || '', n = +N.input.value, h = murmur3(k), s = h % n;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('murmur3 of the key', String(h) + ' (0x' + h.toString(16) + ')'),
        fact('mod ' + n, String(h) + ' mod ' + n + ' = ' + s),
        fact('Goes to', 'shard ' + s)
      ]));
      var shards = el('div', { class: 'sc-shards' });
      for (var i = 0; i < n; i++) shards.appendChild(el('div', { class: 'sc-shard' + (i === s ? ' on' : '') }, ['shard ' + i, el('small', { text: i === s ? k : 'not this one' })]));
      out.appendChild(shards);
      var rows = CLIENTES.map(function (c) {
        var a = shardOf(c, 3), b = shardOf(c, n);
        return { cls: c === k ? 'sc-cur' : '', cells: [{ text: c }, { text: 'shard ' + a }, { text: 'shard ' + b, cls: a !== b ? 'sc-bad' : '' }] };
      });
      out.appendChild(table(['cliente_id', 'with 3 shards', 'with ' + n + ' shards'], rows));
      var moved = CLIENTES.filter(function (c) { return shardOf(c, 3) !== shardOf(c, n); }).length;
      out.appendChild(el('p', { class: 'sr-note', text: n === 3 ? 'With 3 shards: lena-77 and bia-31 on shard 1, caio-58 on shard 2 and davi-12 on shard 0. It is what module 16 builds.' : 'Going from 3 to ' + n + ' shards, ' + moved + ' of the 4 customers change shard (in red): repartitioning moves data, which is why choosing the key and the scheme is the hard part of Z.' }));
      out.appendChild(el('p', { class: 'sr-note', text: '32-bit murmur3, seed 0, checked against the test vectors ("" gives 0, "hello" gives 0x248bfa47 and "The quick brown fox jumps over the lazy dog" gives 0x2e4ff723). It is the same widget as in module 16.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [key.wrap, N.wrap]));
    key.input.addEventListener('input', render); N.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 5: scatter-gather =============== */
  function wScatter(root) {
    var N = slider('Shards', 2, 6, 1, 3);
    var qb = [], Q = 0;
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    var SQL = ["WHERE cliente_id = 'caio-58' AND id = 1042", 'WHERE id = 1042'];
    function render() {
      var n = +N.input.value, s = shardOf('caio-58', n), withKey = Q === 0, read = withKey ? 1 : n;
      clear(out);
      out.appendChild(el('p', { class: 'sr-note', text: 'SELECT * FROM pedidos ' + SQL[Q] + ';' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Partitions read', read + ' of ' + n),
        fact('Work on the cluster', read + '× the read of one shard'),
        fact('PostgreSQL plan', withKey ? 'pruning: 1 partition' : 'Append over ' + n + ' partitions')
      ]));
      var shards = el('div', { class: 'sc-shards' });
      for (var i = 0; i < n; i++) shards.appendChild(el('div', { class: 'sc-shard' + (withKey ? (i === s ? ' on' : '') : ' on') }, ['shard ' + i, el('small', { text: withKey ? (i === s ? 'read' : 'skipped') : 'read' })]));
      out.appendChild(shards);
      out.appendChild(el('p', { class: 'sr-verdict ' + (withKey ? '' : 'bad') }, [
        el('strong', { text: withKey ? 'With the key: 1 shard. ' : 'Without the key: scatter-gather, ' + n + ' shards. ' }),
        withKey ? 'The router computes murmur3("caio-58") mod ' + n + ' = ' + s + ' and goes straight to shard ' + s + '.'
          : 'The router does not know whose order 1042 is, asks all the shards and merges the answers: the wait is that of the slowest, and each query occupies ' + n + ' databases instead of 1.'
      ]));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'The query' }));
    root.appendChild(chipRow('Query', ['With the key (cliente_id)', 'Without the key (id only)'], qb, function (i) { Q = i; press(qb, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [N.wrap]));
    N.input.addEventListener('input', render);
    root.appendChild(out);
    press(qb, 0);
    render();
  }

  var REG = { diagnostico: wDiagnostico, 'cubo-pods': wCuboPods, vcpu: wVcpu, roteador: wRoteador, scatter: wScatter };
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
