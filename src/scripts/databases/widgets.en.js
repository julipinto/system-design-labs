/* SDLabs · Databases, Data Models and Indexing: plain JS widgets (English)
   (page calculator, LSM-Tree simulator, B-Tree search vs scan, database picker).
   All of them use the same `pedidos` table from the brief (6 rows, ~2 KB each, 8 KB page). */
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
  function kb(v) { return v >= 1048576 ? fmt(v / 1048576) + ' GB' : v >= 1024 ? fmt(v / 1024) + ' MB' : fmt(v) + ' KB'; }

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

  /* =============== LESSON 10: rows-per-page calculator =============== */
  function wPageCalc(root) {
    var PAGES = [4, 8, 16];
    var ROWS = [0.5, 1, 2, 9];
    var COUNTS = [6, 1000, 1000000];
    var S = { p: 1, r: 2, n: 0 };
    var pB = [], rB = [], nB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(pB, S.p); press(rB, S.r); press(nB, S.n);
      var page = PAGES[S.p], row = ROWS[S.r], n = COUNTS[S.n];
      var fits = row <= page;
      var perPage = fits ? Math.floor(page / row) : 0;
      var pagesPerRow = fits ? 0 : Math.ceil(row / page);
      var pages = fits ? Math.ceil(n / perPage) : n * pagesPerRow;
      var readKb = (fits ? 1 : pagesPerRow) * page;
      var waste = Math.max(0, Math.round((1 - row / readKb) * 100));
      clear(out);
      var rows = [
        ['Rows per page', fits ? fmt(perPage) : 'does not fit: the row takes ' + pagesPerRow + ' pages'],
        ['Pages the table takes', fmt(pages) + ' (' + kb(pages * page) + ')'],
        ['Scan (read everything)', fmt(pages) + ' pages read'],
        ['Read 1 order through the index', kb(readKb) + ' read for ~' + fmt(row) + ' KB useful (' + waste + '% wasted)']
      ];
      var tb = el('tbody');
      rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })])); });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]));
      var note = fits
        ? (S.n === 0 && S.p === 1 && S.r === 2 ? 'This is the figure\'s math: 4 rows per 8 KB page, 6 rows in 2 pages. With 16 KB, the 6 rows fit in 1 page.' : 'Simple math: page size divided by row size, with no page header.')
        : 'A row larger than the page is split across more than one (or the big field goes somewhere else). Each read costs ' + pagesPerRow + ' pages.';
      out.appendChild(el('p', { class: 'sr-note', text: note }));
    }

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Page size' }));
    root.appendChild(chipRow('Page size', PAGES.map(function (v) { return v + ' KB'; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Row size' }));
    root.appendChild(chipRow('Row size', ROWS.map(function (v) { return fmt(v) + ' KB'; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Rows in the table' }));
    root.appendChild(chipRow('Rows in the table', COUNTS.map(function (v) { return fmt(v); }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'PostgreSQL uses 8 KB and InnoDB uses 16 KB. The 2 KB row size is an example to keep the math round: a real order row is usually much smaller.' }));
    render();
  }

  /* =============== LESSON 11: LSM-Tree simulator =============== */
  var CAP = 4;
  var ORDERS = {
    1041: 'Caio · caneca azul · qtd 2', 1042: 'Lena · gato de pelúcia · qtd 1', 1043: 'Bia · gato de pelúcia · qtd 1',
    1044: 'Lena · caneca azul · qtd 1', 1045: 'Davi · camiseta preta · qtd 3', 1046: 'Bia · caneca azul · qtd 1'
  };
  function wLsm(root) {
    var S;
    function fresh() { return { wal: [], mem: {}, ssts: [], next: 1041, n: 0, msg: 'Write the first order. The memtable in this example holds 4 entries.', trace: null }; }
    S = fresh();

    var walBox = el('ol', { class: 'ls-list' });
    var memBox = el('ul', { class: 'ls-list' });
    var diskBox = el('div', { class: 'ls-disk' });
    var msg = el('p', { class: 'ls-msg', 'aria-live': 'polite' });
    var traceBox = el('ol', { class: 'ib-tl ls-trace', 'aria-live': 'polite' });
    var bW = el('button', { type: 'button', class: 'btn primary', text: 'Write next order' });
    var bU = el('button', { type: 'button', class: 'btn', text: 'Update 1042 (qtd 2)' });
    var bD = el('button', { type: 'button', class: 'btn', text: 'Delete 1044' });
    var bC = el('button', { type: 'button', class: 'btn', text: 'Compact' });
    var bR = el('button', { type: 'button', class: 'btn', text: 'Reset' });

    function memKeys() { return Object.keys(S.mem).map(Number).sort(function (a, b) { return a - b; }); }
    function label(e) { return e.tomb ? 'tombstone (deleted)' : e.v; }
    function put(k, e, what) {
      S.wal.push({ k: k, e: e });
      S.mem[k] = e;
      S.msg = what + ' It went to the WAL and the memtable, and the "written" answer can already go back.';
      if (memKeys().length >= CAP) {
        S.n++;
        var data = {};
        memKeys().forEach(function (key) { data[key] = S.mem[key]; });
        S.ssts.unshift({ name: 'SSTable ' + S.n, data: data });
        S.mem = {}; S.wal = [];
        S.msg += ' The memtable filled up (4 entries): it was flushed into a new file, SSTable ' + S.n + ', and the WAL was emptied.';
      }
      S.trace = null;
      render();
    }
    bW.addEventListener('click', function () {
      var k = S.next++;
      var v = ORDERS[k] || ('new order ' + k + ' (example)');
      put(k, { v: v }, 'Order ' + k + ' written.');
    });
    bU.addEventListener('click', function () { put(1042, { v: 'Lena · gato de pelúcia · qtd 2 (new version)' }, 'New version of 1042: the LSM does not change the old file, it writes another version.'); });
    bD.addEventListener('click', function () { put(1044, { tomb: true }, 'Deleting 1044 writes a tombstone, and does not remove anything yet.'); });
    bC.addEventListener('click', function () {
      if (S.ssts.length < 2) { S.msg = 'Compaction merges SSTables: it needs at least 2 on disk. Write more orders until the memtable flushes again.'; S.trace = null; render(); return; }
      var merged = {}, before = S.ssts.length, dropped = 0;
      S.ssts.slice().reverse().forEach(function (t) {
        Object.keys(t.data).forEach(function (k) { if (merged[k]) dropped++; merged[k] = t.data[k]; });
      });
      Object.keys(merged).forEach(function (k) { if (merged[k].tomb) { delete merged[k]; dropped++; } });
      S.n++;
      S.ssts = [{ name: 'SSTable ' + S.n + ' (compacted)', data: merged }];
      S.msg = 'Compaction: ' + before + ' SSTables became 1. Only the newest version of each key is left; ' + dropped + ' old version(s) or tombstone(s) were discarded.';
      S.trace = null; render();
    });
    bR.addEventListener('click', function () { S = fresh(); render(); });

    function read(k) {
      var steps = [], opened = 0, found = null;
      var m = S.mem[k];
      if (m) { steps.push({ t: 'Memtable', o: 'Found: ' + label(m) + '.', hit: true }); found = m; }
      else steps.push({ t: 'Memtable', o: 'Does not have ' + k + '.' });
      for (var i = 0; !found && i < S.ssts.length; i++) {
        var t = S.ssts[i], e = t.data[k];
        if (!e) steps.push({ t: t.name, o: 'Bloom filter: "certainly not here". File skipped, 0 reads.' });
        else { opened++; steps.push({ t: t.name, o: 'Bloom filter: "maybe". Opened the file and found: ' + label(e) + '.', hit: true }); found = e; }
      }
      var res = !found ? 'Order ' + k + ' does not exist.' : found.tomb ? '1044 was deleted: the newest tombstone wins, and the read answers "does not exist".' : 'Answer: ' + found.v + '.';
      S.trace = { k: k, steps: steps, opened: opened, res: res };
      render();
    }

    function render() {
      clear(walBox); clear(memBox); clear(diskBox); clear(traceBox);
      if (!S.wal.length) walBox.appendChild(el('li', { class: 'ls-empty', text: 'empty' }));
      S.wal.forEach(function (w) { walBox.appendChild(el('li', { text: w.k + (w.e.tomb ? ' (delete)' : ' → ' + w.e.v) })); });
      var mk = memKeys();
      if (!mk.length) memBox.appendChild(el('li', { class: 'ls-empty', text: 'empty' }));
      mk.forEach(function (k) { memBox.appendChild(el('li', { text: k + ' → ' + label(S.mem[k]) })); });
      if (!S.ssts.length) diskBox.appendChild(el('p', { class: 'ls-empty', text: 'No SSTable yet.' }));
      S.ssts.forEach(function (t, i) {
        var keys = Object.keys(t.data).map(Number).sort(function (a, b) { return a - b; });
        diskBox.appendChild(el('div', { class: 'ls-sst' }, [
          el('strong', { text: t.name + (i === 0 ? ' · newest' : '') }),
          el('span', { text: keys.map(function (k) { return k + (t.data[k].tomb ? '✕' : ''); }).join(', ') })
        ]));
      });
      msg.textContent = S.msg;
      bU.disabled = false; bD.disabled = false;
      if (S.trace) {
        traceBox.appendChild(el('li', { class: 'ib-step now' }, [el('strong', { text: 'Read of order ' + S.trace.k + ': ' + S.trace.opened + ' SSTable(s) opened' })]));
        S.trace.steps.forEach(function (s) {
          traceBox.appendChild(el('li', { class: 'ib-step' + (s.hit ? ' now' : '') }, [
            el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: s.t })]),
            el('p', { class: 'ib-out', text: s.o })
          ]));
        });
        traceBox.appendChild(el('li', { class: 'ib-verdict ok' }, [el('strong', { text: S.trace.res })]));
      }
    }

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Write' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bW, bU, bD, bC, bR]));
    root.appendChild(msg);
    root.appendChild(el('div', { class: 'ls-grid' }, [
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'WAL (disk, append-only)' }), walBox]),
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'Memtable (memory, up to 4)' }), memBox]),
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'Disk: SSTables (immutable)' }), diskBox])
    ]));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Read an order' }));
    var rb = [];
    var ids = [1041, 1042, 1043, 1044, 1045, 1046, 1099];
    root.appendChild(chipRow('Order to read', ids.map(function (v) { return v === 1099 ? '1099 (does not exist)' : String(v); }), rb, function (i) { press(rb, i); read(ids[i]); }));
    root.appendChild(traceBox);
    root.appendChild(el('p', { class: 'sr-note', text: 'In the example the Bloom filter never errs. In a real database it can say "maybe" for a key that is not there (the read opens the file for nothing), but it never says "not here" for a key that is. ✕ marks a tombstone.' }));
    render();
  }

  /* =============== LESSON 12: B-Tree vs scan =============== */
  var FANOUT = 409; // keys per internal page: 8,192 bytes ÷ ~20 bytes por entrada (exemplo)
  function levels(rows) {
    var rowsPerPage = 4, n = Math.ceil(rows / rowsPerPage), lv = 1;
    while (n > 1) { n = Math.ceil(n / FANOUT); lv++; }
    return lv;
  }
  function wBtree(root) {
    var IDS = [1041, 1042, 1043, 1044, 1045, 1046];
    var COUNTS = [6, 1000, 1000000, 1000000000];
    var S = { id: 1, mode: 1, step: 1, n: 0 };
    var idB = [], mB = [], nB = [];
    var tl = el('ol', { class: 'ib-tl' });
    var verdict = el('div', { class: 'ib-verdict hide' });
    var counter = el('span', { class: 'ib-count' });
    var back = el('button', { type: 'button', class: 'btn' }, [el('i', { class: 'ico ico-prev', 'aria-hidden': 'true' }), 'Previous step']);
    var next = el('button', { type: 'button', class: 'btn primary' }, ['Next step', el('i', { class: 'ico ico-next', 'aria-hidden': 'true' })]);
    var scale = el('div', { class: 'sr-tablewrap' });
    var scaleNote = el('p', { class: 'sr-note' });

    function steps() {
      var id = IDS[S.id];
      if (S.mode === 0) {
        return [
          { t: 'Scan', p: 'Page 1 (1041, 1042, 1043, 1044)', o: 'Reads the whole page (8 KB) and checks the 4 rows.' + (id <= 1044 ? ' ' + id + ' is here, but the database does not know yet that there is no other.' : ' No row is ' + id + '.') },
          { t: 'Scan', p: 'Page 2 (1045, 1046)', o: id >= 1045 ? 'Found ' + id + '. End of the table.' : 'Checks the rest of the table and finishes.' }
        ];
      }
      var left = id < 1043;
      return [
        { t: 'B-Tree', p: 'Root [1043]', o: id + (left ? ' is smaller than 1043: goes down to the left leaf.' : ' is 1043 or larger: goes down to the right leaf.') },
        { t: 'B-Tree', p: left ? 'Leaf [1041, 1042]' : 'Leaf [1043, 1044, 1045, 1046]', o: 'Found ' + id + ' in this leaf.' }
      ];
    }
    function render() {
      press(idB, S.id); press(mB, S.mode); press(nB, S.n);
      var st = steps();
      clear(tl);
      st.forEach(function (s, i) {
        if (i >= S.step) return;
        tl.appendChild(el('li', { class: 'ib-step' + (i === S.step - 1 ? ' now' : '') }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who' + (S.mode ? '' : ' t2'), text: s.t }), el('span', { class: 'ib-n', text: 'Page read ' + (i + 1) })]),
          el('p', { class: 'ib-db', text: s.p }),
          el('p', { class: 'ib-out', text: s.o })
        ]));
      });
      clear(verdict);
      var done = S.step === st.length;
      verdict.className = 'ib-verdict' + (done ? ' ok' : ' hide');
      if (done) {
        verdict.appendChild(el('strong', { text: S.step + ' pages read. ' }));
        verdict.appendChild(document.createTextNode((S.mode === 0 ? 'The scan read the whole table: 2 pages. ' : 'The B-Tree went from the root to the leaf: 2 pages. ') + 'With 6 rows, the two ways tie. Raise the table size below and see when the tree starts to pay off.'));
      }
      counter.textContent = 'Pages read: ' + S.step;
      back.disabled = S.step <= 1;
      next.disabled = done;

      var rows = COUNTS[S.n], scan = Math.ceil(rows / 4), lv = levels(rows);
      clear(scale);
      var tb = el('tbody');
      [['Scan', fmt(scan) + ' pages (' + kb(scan * 8) + ')'], ['B-Tree', fmt(lv) + ' pages (' + lv + ' levels)'],
        ['Difference', lv >= scan ? 'tie (the tree does not pay off in a table this small)' : fmt(Math.round(scan / lv)) + ' times fewer reads with the tree']].forEach(function (r) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })]));
      });
      scale.appendChild(el('table', { class: 'sr-table pc-table' }, [tb]));
      scaleNote.textContent = 'Rows of ~2 KB, 4 per 8 KB page, and ~' + FANOUT + ' keys per internal page (example). The tree grows wider: each new level multiplies what it reaches by ' + FANOUT + '.';
    }
    back.addEventListener('click', function () { if (S.step > 1) { S.step--; render(); } });
    next.addEventListener('click', function () { S.step++; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Which order to look for' }));
    root.appendChild(chipRow('Order', IDS.map(String), idB, function (i) { S.id = i; S.step = 1; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. How to search' }));
    root.appendChild(chipRow('Method', ['Scan (no index)', 'B-Tree'], mB, function (i) { S.mode = i; S.step = 1; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Step through the reads' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [back, next, counter]));
    root.appendChild(tl);
    root.appendChild(verdict);
    root.appendChild(el('p', { class: 'sr-sub', text: '4. What if the table grows?' }));
    root.appendChild(chipRow('Rows in the table', COUNTS.map(function (v) { return fmt(v) + ' rows'; }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(scale);
    root.appendChild(scaleNote);
    render();
  }

  /* =============== LESSON 15: database picker =============== */
  var SCEN = [
    { q: 'Lena pays for the plush cat: the order is written and the stock goes down, all or nothing.', model: 'Relational (rows)', index: 'B-Tree on keys and secondary indexes', cons: 'Strong (ACID). On a network partition, CP.', lose: 'Commit latency and easy horizontal scale.', ex: 'PostgreSQL, MySQL, SQL Server' },
    { q: 'Millions of clicks and metrics per second arrive at the store, and none can be lost.', model: 'Wide-column or time series', index: 'LSM-Tree (WAL, memtable, SSTable)', cons: 'Eventual, with asynchronous replication.', lose: 'A more complex read and possibly stale data for a while.', ex: 'Cassandra, ScyllaDB, InfluxDB' },
    { q: 'Lena\'s cart and her login session.', model: 'Key-value, in memory', index: 'Hash of the key (carrinho:lena, sessao:lena)', cons: 'Simple; the data can be rebuilt.', lose: 'Durability (a restart can wipe it) and querying by the content of the value.', ex: 'Redis, Valkey, Memcached' },
    { q: 'Lena types "pelúcia" (plush) into the catalog search.', model: 'Documents, in a search engine', index: 'Inverted index (pelúcia → 1042, 1043)', cons: 'Eventual: it is a read copy.', lose: 'More expensive writes, and it is not a source of truth.', ex: 'Elasticsearch, Solr, PostgreSQL GIN' },
    { q: 'The plush cat page shows "whoever bought this also bought".', model: 'Graph', index: 'COMPROU edges stored as data; traversal', cons: 'Depends on the product; usually an analytical read.', lose: 'Table sums and reports, which the graph does not do well.', ex: 'Neo4j' },
    { q: 'Finance wants the total value per city for the month.', model: 'Columnar', index: 'Per-column segments, compressed', cons: 'Data at rest; analytics, not transactions.', lose: 'Reading or writing a whole order (touches every file).', ex: 'BigQuery, Redshift, SQL Server columnstore' }
  ];
  function wPicker(root) {
    var S = { i: -1, open: false };
    var bs = [];
    var card = el('div', { class: 'pk-card', 'aria-live': 'polite' });
    function render() {
      press(bs, S.i);
      clear(card);
      if (S.i < 0) { card.appendChild(el('p', { class: 'sr-note', text: 'Pick a situation above.' })); return; }
      var s = SCEN[S.i];
      card.appendChild(el('p', { class: 'pk-q', text: s.q }));
      if (!S.open) {
        var show = el('button', { type: 'button', class: 'btn primary', text: 'Show the answer' });
        show.addEventListener('click', function () { S.open = true; render(); });
        card.appendChild(show);
        return;
      }
      var tb = el('tbody');
      [['Model', s.model], ['Index', s.index], ['Consistency', s.cons], ['What you accept losing', s.lose], ['Examples', s.ex]].forEach(function (r) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })]));
      });
      card.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]));
    }
    var names = ['Payment and stock', 'Clicks and metrics', 'Cart and session', 'Text search', 'Whoever bought also bought', 'Monthly report'];
    root.appendChild(el('p', { class: 'sr-sub', text: 'Store situation' }));
    root.appendChild(chipRow('Situation', names, bs, function (i) { S.i = i; S.open = false; render(); }));
    root.appendChild(card);
    root.appendChild(el('p', { class: 'sr-note', text: 'Starting choices, not rules: it depends on volume, on the team and on what the product already uses.' }));
    render();
  }

  var REG = { pagecalc: wPageCalc, lsm: wLsm, btreesearch: wBtree, picker: wPicker };
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
