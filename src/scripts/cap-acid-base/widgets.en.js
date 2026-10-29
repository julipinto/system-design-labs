/* SDLabs · CAP theorem, ACID and BASE: plain JS widgets (isolation level simulator) */
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

  /* =============== LESSON 2: isolation levels ===============
     Two transactions, T1 and T2, touch Lena's account (balance R$ 150): T1 is the R$ 100 transfer to her brother, T2 is the automatic rent debit (R$ 40).
     Each scenario shows the worst interleaving the level ALLOWS. */
  var LEVELS = ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'];
  var SHORT = ['RU', 'RC', 'RR', 'SER'];
  var ANOM = ['Dirty read', 'Non-repeatable read', 'Phantom', 'Lost update'];
  var ANOM_SHORT = ['Dirty', 'Non-rep.', 'Phantom', 'Lost upd.'];

  // can[level][anomaly]: SQL standard for the first three; lost update follows the classic read, calculate and write model
  var CAN = [
    [true, true, true, true],
    [false, true, true, true],
    [false, false, true, false],
    [false, false, false, false]
  ];

  function brl(v) { return 'R$ ' + v.toLocaleString('en-US'); }

  var SCEN = [
    function dirty(L) {
      var bad = L === 0;
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nUPDATE conta SET saldo = saldo - 100\n WHERE id = 'lena';", out: 'T1 pending balance: R$ 50 (no COMMIT yet).', db: 'DB (committed): ' + brl(150) },
          { w: 'T2', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lena';",
            out: bad ? 'T2 reads R$ 50. It\'s a dirty value: nobody committed it.' : 'T2 reads R$ 150, the last committed value' + (L === 3 ? ' (or waits for T1 to finish, depending on the engine).' : '.'),
            db: 'DB (committed): ' + brl(150), flag: bad },
          { w: 'T1', sql: 'ROLLBACK;', out: 'The R$ 100 debit is undone. The balance stays R$ 150.', db: 'DB (committed): ' + brl(150) }
        ],
        bad: bad,
        msg: bad
          ? 'Dirty read: T2 saw R$ 50, a balance that never really existed. If T2 had refused the rent for lack of funds based on that number, it would be wrong.'
          : 'No dirty read: T2 only sees what has already been committed (COMMIT). The undone debit never showed up for it.'
      };
    },
    function nonrep(L) {
      var bad = L <= 1;
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lena';", out: 'T1 reads R$ 150.', db: 'DB (committed): ' + brl(150) },
          { w: 'T2', sql: "BEGIN;\nUPDATE conta SET saldo = saldo - 40\n WHERE id = 'lena';\nCOMMIT;", out: 'T2 commits the rent: the balance is now R$ 110.', db: 'DB (committed): ' + brl(110) },
          { w: 'T1', sql: "SELECT saldo FROM conta\n WHERE id = 'lena';  -- again, in the same transaction",
            out: bad ? 'T1 reads R$ 110. The same query gave a different result.' : 'T1 reads R$ 150 again: it keeps seeing the same "snapshot" from when it started.',
            db: 'DB (committed): ' + brl(110), flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Non-repeatable read: within the same transaction, T1 read R$ 150 and then R$ 110. A report that adds up balances at two moments becomes incoherent.'
          : 'No non-repeatable read: T1 sees R$ 150 both times. It will only see the R$ 110 after it finishes and starts another transaction.'
      };
    },
    function phantom(L) {
      var bad = L <= 2;
      var third;
      if (L <= 1) third = 'T1 sees 3 rows, total R$ 100. A "phantom" entry appeared.';
      else if (L === 2) third = 'The SQL standard lets it through: 3 rows, total R$ 100. (PostgreSQL already hides the phantom here and would show 2 rows, R$ 60.)';
      else third = 'T1 sees the same 2 rows, total R$ 60.';
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT COUNT(*), SUM(-valor) FROM lancamento\n WHERE conta = 'lena' AND dia = hoje;", out: '2 rows, total spent R$ 60 (daily limit: R$ 200).', db: 'DB: balance ' + brl(150) + ' · 2 entries today' },
          { w: 'T2', sql: "BEGIN;\nINSERT INTO lancamento (conta, valor, dia)\nVALUES ('lena', -40, hoje);\nCOMMIT;", out: 'T2 commits a new entry: the R$ 40 rent.', db: 'DB: balance ' + brl(110) + ' · 3 entries today' },
          { w: 'T1', sql: "SELECT COUNT(*), SUM(-valor) FROM lancamento\n WHERE conta = 'lena' AND dia = hoje;  -- same query", out: third, db: 'DB: balance ' + brl(110) + ' · 3 entries today', flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Phantom: the same query returned one more row. A value didn\'t change, a set gained a new row. Anyone checking the R$ 200 daily limit can get the math wrong.'
          : 'No phantom: the set of rows T1 sees doesn\'t change in the middle of the transaction.'
      };
    },
    function lost(L) {
      var bad = L <= 1;
      var last;
      if (bad) last = { sql: "UPDATE conta SET saldo = 110\n WHERE id = 'lena';\nCOMMIT;", out: 'T2 writes R$ 110 over T1\'s R$ 50.', db: 'DB (committed): ' + brl(110) };
      else last = { sql: "UPDATE conta SET saldo = 110\n WHERE id = 'lena';", out: 'ERROR: could not serialize access due to concurrent update. T2 does a ROLLBACK, retries: reads R$ 50, writes R$ 10 and commits.', db: 'DB (committed): ' + brl(10) };
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lena';", out: 'T1 reads R$ 150 and calculates in the app: 150 - 100.', db: 'DB (committed): ' + brl(150) },
          { w: 'T2', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lena';", out: 'T2 reads R$ 150 and calculates in the app: 150 - 40.', db: 'DB (committed): ' + brl(150) },
          { w: 'T1', sql: "UPDATE conta SET saldo = 50\n WHERE id = 'lena';\nCOMMIT;", out: 'T1 commits the transfer: the balance is now R$ 50.', db: 'DB (committed): ' + brl(50) },
          { w: 'T2', sql: last.sql, out: last.out, db: last.db, flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Lost update: the right result would be 150 - 100 - 40 = R$ 10. The database ended with R$ 110 and T1\'s R$ 100 debit vanished, with no error at all.'
          : 'No lost update: the database detects that T2 started from an old balance, refuses the write and T2 redoes the math. Right result: R$ 10.'
      };
    }
  ];

  function wIsolation(root) {
    var S = { a: 0, l: 1, step: 1 };
    var aBtns = [], lBtns = [], cells = [];

    var live = el('div', { 'aria-live': 'polite', class: 'ib-live' });
    var tl = el('ol', { class: 'ib-tl', 'aria-label': 'Transaction timeline' });
    var verdict = el('div', { class: 'ib-verdict', role: 'status' });
    var back = el('button', { type: 'button', class: 'btn' }, [el('i', { class: 'ico ico-prev', 'aria-hidden': 'true' }), 'Back']);
    var next = el('button', { type: 'button', class: 'btn primary' }, ['Next step', el('i', { class: 'ico ico-next', 'aria-hidden': 'true' })]);
    var reset = el('button', { type: 'button', class: 'btn', text: 'Restart' });
    var counter = el('span', { class: 'ib-count' });

    function chipRow(label, items, list, onpick) {
      var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': label });
      items.forEach(function (t, i) {
        var b = el('button', { type: 'button', class: 'chip', text: t, 'aria-pressed': 'false' });
        b.addEventListener('click', function () { onpick(i); });
        list.push(b);
        row.appendChild(b);
      });
      return row;
    }

    function render() {
      aBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === S.a ? 'true' : 'false'); });
      lBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === S.l ? 'true' : 'false'); });
      cells.forEach(function (c) {
        var on = c.l === S.l && c.a === S.a;
        c.b.classList.toggle('sel', on);
        c.b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var sc = SCEN[S.a](S.l);
      var n = sc.steps.length;
      if (S.step > n) S.step = n;
      clear(tl);
      sc.steps.slice(0, S.step).forEach(function (st, i) {
        tl.appendChild(el('li', { class: 'ib-step' + (st.flag ? ' flag' : '') + (i === S.step - 1 ? ' now' : '') }, [
          el('div', { class: 'ib-head' }, [
            el('span', { class: 'ib-who ' + st.w.toLowerCase(), text: st.w }),
            el('span', { class: 'ib-n', text: 'step ' + (i + 1) + ' of ' + n })
          ]),
          el('pre', { class: 'ib-sql' }, [el('code', { text: st.sql })]),
          el('p', { class: 'ib-out', text: st.out }),
          el('p', { class: 'ib-db', text: st.db })
        ]));
      });
      clear(verdict);
      var done = S.step === n;
      verdict.className = 'ib-verdict' + (done ? (sc.bad ? ' bad' : ' ok') : ' hide');
      if (done) {
        verdict.appendChild(el('strong', { text: (sc.bad ? 'Happens: ' : 'Does not happen: ') + ANOM[S.a] + ' in ' + LEVELS[S.l] + '. ' }));
        verdict.appendChild(document.createTextNode(sc.msg));
      }
      counter.textContent = 'Step ' + S.step + ' of ' + n;
      back.disabled = S.step <= 1;
      next.disabled = done;
    }
    function pick(a, l) { if (a != null) S.a = a; if (l != null) S.l = l; S.step = 1; render(); }

    back.addEventListener('click', function () { if (S.step > 1) { S.step--; render(); } });
    next.addEventListener('click', function () { S.step++; render(); });
    reset.addEventListener('click', function () { S.step = 1; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Pick the anomaly' }));
    root.appendChild(chipRow('Anomaly', ANOM, aBtns, function (i) { pick(i, null); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Pick the isolation level' }));
    root.appendChild(chipRow('Isolation level', LEVELS, lBtns, function (i) { pick(null, i); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Step through the timeline' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [back, next, reset, counter]));
    live.appendChild(tl);
    live.appendChild(verdict);
    root.appendChild(live);

    // anomaly x level matrix (each cell is a button that picks the pair)
    var head = el('tr', null, [el('th', { scope: 'col', text: 'Level' })].concat(ANOM_SHORT.map(function (t) { return el('th', { scope: 'col', text: t }); })));
    var body = el('tbody');
    LEVELS.forEach(function (lv, l) {
      var tr = el('tr', null, [el('th', { scope: 'row', text: SHORT[l], title: lv })]);
      ANOM.forEach(function (an, a) {
        var can = CAN[l][a];
        var b = el('button', { type: 'button', class: 'ib-cell ' + (can ? 'yes' : 'no'), 'aria-pressed': 'false',
          'aria-label': lv + ', ' + an + ': ' + (can ? 'can happen' : 'does not happen'), text: can ? 'can' : 'no' });
        b.addEventListener('click', function () { pick(a, l); });
        cells.push({ b: b, l: l, a: a });
        tr.appendChild(el('td', null, [b]));
      });
      body.appendChild(tr);
    });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Table: what each level allows' }));
    root.appendChild(el('table', { class: 'ib-matrix' }, [el('caption', { class: 'sr-note', text: 'RU = Read Uncommitted, RC = Read Committed, RR = Repeatable Read, SER = Serializable. Tap a cell to see the case.' }), el('thead', null, [head]), body]));
    root.appendChild(el('p', { class: 'sr-note', text: 'The first three columns follow the SQL standard table: it defines the minimum each level guarantees, and each engine may be stricter. In PostgreSQL, Read Uncommitted behaves like Read Committed and Repeatable Read already doesn\'t allow phantoms. Lost update isn\'t in that table: it\'s the classic "read, calculate in the app and write". When the database does the math (UPDATE conta SET saldo = saldo - 40) or you lock the row (SELECT ... FOR UPDATE), it doesn\'t happen even in Read Committed. Example values.' }));
    render();
  }

  var REG = { isolation: wIsolation };
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
