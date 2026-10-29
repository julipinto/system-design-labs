/* SDLabs · Data Replication: plain JS widgets (English copy)
   (quorum, failover, clock and version conflict, commit latency and loss, Lena and "my orders", ECST and CRDT playground).
   They use the store from the brief: primary in SP, replicas in Rio and Recife, RTT of 10 and 80 ms, local commit of 2 ms,
   Black Friday lag of 300 and 800 ms, 30 orders/s, Patroni with a 30 s ttl. */
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
    var id = 'rp-sl-' + (++uid);
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
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table rp-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function btn(text, onClick) {
    var b = el('button', { type: 'button', class: 'btn', text: text });
    b.addEventListener('click', onClick);
    return b;
  }

  /* =============== AULA 1: quórum (do módulo 3) =============== */
  function wQuorum(root) {
    var btns = [];
    var N = 3;
    var w = slider('W: copies that confirm the write', 1, 3, 1, 2);
    var r = slider('R: copies that answer the read', 1, 3, 1, 2);
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'W = 2, R = 2 (majority)', w: 2, r: 2 },
      { t: 'W = 3, R = 1 (write to all)', w: 3, r: 1 },
      { t: 'W = 1, R = 1 (asynchronous)', w: 1, r: 1 },
      { t: 'W = 1, R = 3 (read from all)', w: 1, r: 3 }
    ];
    function render() {
      var W = +w.input.value, R = +r.input.value, sum = W + R, ok = sum > N;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('N (SP, Rio, Recife)', String(N)),
        fact('W + R', W + ' + ' + R + ' = ' + sum),
        fact('Copies in common', ok ? String(sum - N) + ' at least' : 'may be none'),
        fact('Write tolerates down', (N - W) + (N - W === 1 ? ' node' : ' nodes')),
        fact('Read tolerates down', (N - R) + (N - R === 1 ? ' node' : ' nodes'))
      ]));
      out.appendChild(verdict(!ok,
        ok ? 'W + R > N: the read always sees the latest write.' : 'W + R ≤ N: the read may not see the latest write.',
        ok ? 'With ' + W + ' copies confirming and ' + R + ' answering, at least ' + (sum - N) + ' cop' + (sum - N > 1 ? 'ies are' : 'y is') + ' in both sets, so some answer carries the new data (the timestamp or version says which one is newer).'
          : 'Writing to ' + W + ' and reading from ' + R + ' fit in the ' + N + ' copies without overlapping: the read can land only on copies that have not received the order yet, and Lena sees the past. It is what happens in asynchronous replication (W = 1).'));
      var losses = [];
      if (W < N) losses.push('with W = ' + W + ', if the primary goes down before passing it on, the order may be on only ' + W + ' cop' + (W > 1 ? 'ies' : 'y'));
      if (W === N) losses.push('with W = ' + N + ', the write stops if any copy goes down (the synchronous mode from lesson 3)');
      if (R === N) losses.push('with R = ' + N + ', the read stops if any copy goes down');
      if (ok && W === 2 && R === 2) losses.push('with 2 of 3, writes and reads carry on with one node down');
      out.appendChild(el('p', { class: 'sr-note', text: 'What this costs: ' + losses.join('; ') + '.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'The quorum math is the one from module 3. Streaming PostgreSQL does not vote on every read: what comes close to it is W (synchronous_standby_names) and the choice of where to read.' }));
    }
    function preset(i) { w.set(PRESETS[i].w); r.set(PRESETS[i].r); press(btns, i); render(); }
    root.appendChild(chipRow('Common choices', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [w.wrap, r.wrap]));
    [w, r].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 2: failover =============== */
  function wFailover(root) {
    var btns = [], S = { down: 0 };
    var ttl = slider('Patroni ttl', 10, 60, 1, 30, 's');
    var promo = slider('Time to promote and reconnect', 1, 30, 1, 5, 's');
    var rate = slider('Orders per second', 1, 60, 1, 30, 'orders/s');
    var lagRio = slider('Rio lag', 0, 2000, 10, 300, 'ms');
    var lagRec = slider('Recife lag', 0, 2000, 10, 800, 'ms');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    function render() {
      var t = +ttl.input.value, p = +promo.input.value, taxa = +rate.input.value;
      var lr = +lagRio.input.value, lc = +lagRec.input.value;
      var alive = S.down === 0 ? 2 : 1, quorum = alive >= 2;
      var rto = t + p, tent = taxa * rto;
      clear(out);
      if (!quorum) {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Live nodes', '1 of 3'), fact('Majority needs', '2'), fact('Leader', 'nobody'), fact('Writes', 'stopped')
        ]));
        out.appendChild(verdict(true, 'No quorum.',
          'Only Recife is alive: 1 of 3 is not a majority, so no election happens and the database accepts no writes until another node comes back. It is the CP choice from module 3: stop instead of risking two primaries.'));
        return;
      }
      var leader = lr <= lc ? 'Rio' : 'Recife', lagL = Math.min(lr, lc);
      var perda = taxa * lagL / 1000;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('RTO', fmt(rto, 0) + ' s'),
        fact('Attempts without a primary', fmt(tent, 0)),
        fact('New leader', leader),
        fact('Lost orders (asynchronous)', fmt(perda, 1)),
        fact('Quorum', '2 of 3: ok')
      ]));
      out.appendChild(table(['math', 'result'], [
        { cells: [{ text: 'RTO = ttl + promotion' }, { text: t + ' + ' + p + ' = ' + rto + ' s' }] },
        { cells: [{ text: 'Without a primary = rate × RTO' }, { text: taxa + ' × ' + rto + ' = ' + fmt(tent, 0) + ' attempts' }] },
        { cls: leader === 'Rio' ? 'rp-cur' : '', cells: [{ text: 'Rio' }, { text: 'lag ' + lr + ' ms, would lose ' + fmt(taxa * lr / 1000, 1) + ' orders' }] },
        { cls: leader === 'Recife' ? 'rp-cur' : '', cells: [{ text: 'Recife' }, { text: 'lag ' + lc + ' ms, would lose ' + fmt(taxa * lc / 1000, 1) + ' orders' }] }
      ], 'rp-narrow'));
      out.appendChild(verdict(false, leader + ' becomes the leader.',
        'It is the replica furthest ahead in the log (smallest lag: ' + lagL + ' ms). In Raft the vote only goes to whoever has an equal or more up-to-date log, and the election timeout is drawn between 150 and 300 ms.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'The 30 s ttl is the Patroni default (the leader has to renew the key) and is the time until failover starts; the 5 s of promotion and reconnection are an example. On Black Friday: 30 × 35 = 1,050 attempts; a loss of 9 orders (Rio) or 24 (Recife).' }));
    }
    function pick(i) { S.down = i; press(btns, i); render(); }
    root.appendChild(chipRow('Who goes down', ['SP only', 'SP and Rio'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ttl.wrap, promo.wrap, rate.wrap, lagRio.wrap, lagRec.wrap]));
    [ttl, promo, rate, lagRio, lagRec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 2: conflito de relógio e versão =============== */
  function wConflito(root) {
    var btns = [], S = { p: 0 };
    var off = slider('Recife clock skew', -500, 500, 10, -120, 'ms', function (v) { return (v > 0 ? '+' : '') + fmt(v, 0); });
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var SP_REAL = 100, REC_REAL = 150;
    function stamp(ms) { return '20:20:00.' + String(Math.max(0, Math.min(999, ms))).padStart(3, '0'); }
    function render() {
      var d = +off.input.value, recStamp = REC_REAL + d;
      clear(out);
      out.appendChild(table(['write', 'when it really happened', 'timestamp stored', 'version vector'], [
        { cells: [{ text: 'SP: "Rua do Sol, 200" (support agent)' }, { text: stamp(SP_REAL) }, { text: stamp(SP_REAL) }, { text: '{SP:2, Rec:0}' }] },
        { cells: [{ text: 'Recife: "Rua da Aurora, 100" (Lena in the app)' }, { text: stamp(REC_REAL) }, { text: stamp(recStamp) }, { text: '{SP:1, Rec:1}' }] }
      ], 'rp-wide'));
      if (S.p === 0) {
        var spWins = SP_REAL >= recStamp;
        var winner = spWins ? 'SP' : 'Recife';
        var wrong = spWins; // the most recent in reality is Recife
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Most recent in reality', 'Recife'),
          fact('LWW picks', winner),
          fact('Address that stays', spWins ? 'Rua do Sol, 200' : 'Rua da Aurora, 100'),
          fact('Lost write', spWins ? "Lena's" : "the support agent's")
        ]));
        out.appendChild(verdict(wrong, wrong ? 'LWW picks wrong.' : 'LWW gets it right, by luck.',
          wrong ? "Recife's timestamp (" + stamp(recStamp) + ") is lower than SP's (" + stamp(SP_REAL) + "), even though Recife's write is the last one in reality. Lena's write vanishes with no error: LWW depends on a clock."
            : 'With the skew at ' + fmt(d, 0) + " ms, Recife's timestamp (" + stamp(recStamp) + ") passed SP's, and the most recent write won. Change the skew to −120 ms and it loses again."));
      } else {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('{SP:2, Rec:0} dominates {SP:1, Rec:1}?', 'no (Rec: 0 < 1)'),
          fact('{SP:1, Rec:1} dominates {SP:2, Rec:0}?', 'no (SP: 1 < 2)'),
          fact('Result', 'concurrent'),
          fact('Depends on the clock?', 'no')
        ]));
        out.appendChild(verdict(false, 'The vector detects the concurrency.',
          'Neither vector is greater than or equal to the other in every position, so the writes were made without either having seen the other. The system keeps both versions and the application decides (for example, asking Lena). The skew of ' + fmt(d, 0) + ' ms changes nothing.'));
      }
      out.appendChild(el('p', { class: 'sr-note', text: "A vector A dominates B when every position of A is greater than or equal to B's and at least one is greater. If neither dominates, the writes are concurrent (Dynamo, 2007)." }));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Policy', ['LWW (latest timestamp)', 'version vector'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [off.wrap]));
    off.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 3: latência do commit e perda (RPO) =============== */
  function wCommit(root) {
    var btns = [], S = { m: 0 };
    var rio = slider('Rio RTT', 1, 50, 1, 10, 'ms');
    var rec = slider('Recife RTT', 10, 200, 5, 80, 'ms');
    var loc = slider('Local commit (disk)', 1, 10, 1, 2, 'ms');
    var rate = slider('Order rate', 1, 60, 1, 30, 'orders/s');
    var lagRio = slider('Rio lag', 0, 2000, 10, 300, 'ms');
    var lagRec = slider('Recife lag', 0, 2000, 10, 800, 'ms');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var MODES = ['asynchronous', 'semi (waits for Rio)', 'semi (waits for Recife)', 'synchronous (Rio and Recife)'];
    function render() {
      var a = +rio.input.value, b = +rec.input.value, l = +loc.input.value, taxa = +rate.input.value;
      var lr = +lagRio.input.value, lc = +lagRec.input.value;
      var wait = [0, a, b, Math.max(a, b)][S.m], lat = l + wait, cps = 1000 / lat;
      var waitsRio = S.m === 1 || S.m === 3, waitsRec = S.m === 2 || S.m === 3;
      var perdaRio = waitsRio ? 0 : taxa * lr / 1000, perdaRec = waitsRec ? 0 : taxa * lc / 1000;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Commit latency', fmt(lat, 0) + ' ms'),
        fact('Commits/s per connection', fmt(cps, 0)),
        fact('Loss if Rio is promoted', fmt(perdaRio, 1) + ' orders'),
        fact('Loss if Recife is promoted', fmt(perdaRec, 1) + ' orders')
      ]));
      var conta = S.m === 0 ? l + ' ms (disk only)' : l + ' + ' + (S.m === 3 ? 'max(' + a + ', ' + b + ')' : String(wait)) + ' = ' + lat + ' ms';
      out.appendChild(table(['math', 'result'], [
        { cells: [{ text: 'Commit' }, { text: conta }] },
        { cells: [{ text: 'Commits per second' }, { text: '1,000 ÷ ' + lat + ' = ' + fmt(cps, 1) }] },
        { cls: waitsRio ? '' : 'rp-bad', cells: [{ text: 'Rio promoted' }, { text: waitsRio ? 'Rio already confirmed: 0 orders' : taxa + ' × ' + fmt(lr / 1000, 2) + ' s = ' + fmt(perdaRio, 1) + ' orders' }] },
        { cls: waitsRec ? '' : 'rp-bad', cells: [{ text: 'Recife promoted' }, { text: waitsRec ? 'Recife already confirmed: 0 orders' : taxa + ' × ' + fmt(lc / 1000, 2) + ' s = ' + fmt(perdaRec, 1) + ' orders' }] }
      ], 'rp-narrow'));
      var lost = Math.min(perdaRio, perdaRec) > 0;
      out.appendChild(verdict(lost,
        lost ? 'There is a loss window.' : 'Zero loss while the awaited replicas answer.',
        lost ? 'The promoted replica may be behind what the primary confirmed, and what is missing is rate × lag.' : 'What the primary confirmed is already on the awaited replica; the price is waiting for its RTT on commit.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Store example: 2 ms (asynchronous), 12 ms (semi with Rio), 82 ms (synchronous), and losses of 9 and 24 orders on Black Friday (30/s, lag of 300 and 800 ms). The ack counts until the replica writes the log; with remote_apply the apply delay is included too. MariaDB semi-synchronous goes back to asynchronous after 10 s without an ack; PostgreSQL waits.' }));
    }
    root.appendChild(chipRow('Mode', MODES, btns, function (i) { S.m = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rio.wrap, rec.wrap, loc.wrap, rate.wrap, lagRio.wrap, lagRec.wrap]));
    [rio, rec, loc, rate, lagRio, lagRec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 3: a Lena e o "meus pedidos" =============== */
  function wLena(root) {
    var btns = [], S = { s: 0 };
    var lag = slider('Recife replica lag', 0, 2000, 10, 800, 'ms');
    var t = slider('Lena opens the screen', 0, 2000, 10, 300, 'ms after the order');
    var nSec = slider('Window on the primary (N)', 1, 10, 1, 2, 's');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var LOCAL = 2, RTT = 80, READ = 2;
    var STRATS = ['read from the replica', 'primary for N s', 'LSN token', 'remote_apply'];
    function render() {
      var L = +lag.input.value, T = +t.input.value, N = +nSec.input.value;
      var appearAt = LOCAL + L; // 1055 reaches Recife when the log is applied
      var commitDone = LOCAL, sees, cost, where, extra = '';
      if (S.s === 0) {
        where = 'Recife replica'; cost = READ; sees = T >= appearAt;
      } else if (S.s === 1) {
        if (T <= N * 1000) { where = 'primary in SP'; cost = READ + RTT; sees = T >= LOCAL; }
        else { where = 'Recife replica'; cost = READ; sees = T >= appearAt; extra = ' The ' + N + ' s window has passed and the read went back to the replica.'; }
      } else if (S.s === 2) {
        if (T >= appearAt) { where = 'Recife replica'; cost = READ; sees = true; extra = ' The replay_lsn has already passed the token.'; }
        else { where = 'primary in SP (the replay_lsn is still behind the token)'; cost = READ + RTT; sees = T >= LOCAL; }
      } else {
        commitDone = Math.max(LOCAL + RTT, appearAt);
        where = 'Recife replica'; cost = READ; sees = T >= commitDone;
      }
      clear(out);
      var facts = [
        fact('1055 shows up in Recife', 'at 20:10:00.' + String(Math.min(999, appearAt)).padStart(3, '0') + (appearAt > 999 ? ' (+' + fmt(appearAt - 999, 0) + ' ms)' : '')),
        fact('Lena opens the screen', 'at 20:10:00.' + String(Math.min(999, T)).padStart(3, '0')),
        fact('Reads from', where),
        fact('Read cost', fmt(cost, 0) + ' ms')
      ];
      if (S.s === 3) facts.push(fact('Commit takes', fmt(commitDone, 0) + ' ms'));
      out.appendChild(el('div', { class: 'sr-facts' }, facts));
      if (S.s === 3 && T < commitDone) {
        out.appendChild(verdict(true, 'The screen opened before the commit confirmed.',
          'With remote_apply the primary only says "done" after the replica applies, at ' + fmt(commitDone, 0) + ' ms. Lena has not received the order confirmation yet; after it, the read in Recife already shows 1055.'));
      } else {
        out.appendChild(verdict(!sees, sees ? '1055 shows up.' : '1055 does not show up.',
          sees ? 'The screen reads from the ' + where + ' and the order is there.' + extra
            : 'The screen reads from the Recife replica, which will only have 1055 at ' + fmt(appearAt, 0) + ' ms, and shows 1054 as the last order.' + extra));
      }
      var notes = {
        0: 'A 2 ms read, but Lena sees the past while the replica is behind (800 ms on Black Friday).',
        1: 'She always sees the order within the window, at the cost of +80 ms of RTT per read. After the window the read goes back to the replica.',
        2: 'The primary reports the commit LSN (0/8004430 in the lab) and the application only reads from the replica when pg_last_wal_replay_lsn() >= token; otherwise it reads from the primary.',
        3: 'The commit waits for the replica to apply: about 82 ms with low lag and, with the replica behind, the whole lag goes into the commit.'
      };
      out.appendChild(el('p', { class: 'sr-note', text: notes[S.s] }));
    }
    root.appendChild(chipRow('Strategy', STRATS, btns, function (i) { S.s = i; press(btns, i); nSec.wrap.hidden = i !== 1; render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lag.wrap, t.wrap, nSec.wrap]));
    [lag, t, nSec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    nSec.wrap.hidden = true;
    press(btns, 0);
    render();
  }

  /* =============== AULA 4: ECST, ordem e versão =============== */
  function wEcst(root) {
    var btns = [], dupBtns = [], S = { o: 1, d: 0 };
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var EV = {
      v8: { v: 8, end: 'Rua da Aurora, 100' },
      v9: { v: 9, end: 'Rua do Sol, 200' }
    };
    function seq() {
      var s = S.o === 0 ? ['v8', 'v9'] : ['v9', 'v8'];
      if (S.d === 1) s = s.concat([s[s.length - 1]]);
      return s;
    }
    function render() {
      var s = seq(), blind = null, safe = null, rows = [];
      s.forEach(function (k, i) {
        var e = EV[k];
        blind = e;
        var apply = !safe || e.v > safe.v;
        if (apply) safe = e;
        rows.push({ cls: apply ? '' : 'rp-bad', cells: [
          { text: (i + 1) + '. ' + k + ' arrives' + (i > 0 && s[i - 1] === k ? ' (repeated)' : '') },
          { text: '"' + e.end + '" (v' + e.v + ')' },
          { text: apply ? 'applies: becomes v' + e.v : 'discards: stays v' + safe.v }
        ] });
      });
      clear(out);
      out.appendChild(el('ul', { class: 'rp-queue', 'aria-label': 'Queue of entregas' }, s.map(function (k) {
        return el('li', { text: 'ClienteAtualizado ' + k });
      })));
      out.appendChild(table(['event', 'what it carries', 'rule: apply only if the version is greater'], rows, 'rp-wide'));
      var badBlind = blind.v !== 9, badSafe = safe.v !== 9;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Without the rule (blind)', blind.end + ' (v' + blind.v + ')'),
        fact('With the version rule', safe.end + ' (v' + safe.v + ')'),
        fact('Right address', EV.v9.end + ' (v9)')
      ]));
      out.appendChild(verdict(badBlind, badBlind ? 'Blindly, the address ends up old.' : 'Blindly it gets it right, because of the order.',
        badBlind ? 'The last event to arrive was v8 and it overwrote v9: the mug goes to Rua da Aurora, 100.' : 'The last to arrive was v9. Change the order and the result changes.'));
      out.appendChild(verdict(badSafe, badSafe ? 'With the rule, it still gets it wrong.' : 'With the rule, the right address stays.',
        'The event version is only applied if it is greater than the copy\'s, so the late v8 and any repetition are discarded.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Swapped order happens, for example, after a topic repartitioning (from 3 to 6 partitions). The rule works because the event carries the entire state and the versao field.' }));
    }
    root.appendChild(chipRow('Arrival order', ['v8 and v9 (right)', 'v9 and v8 (swapped)'], btns, function (i) { S.o = i; press(btns, i); render(); }));
    root.appendChild(chipRow('Repetition', ['no duplicate', 'last event repeated'], dupBtns, function (i) { S.d = i; press(dupBtns, i); render(); }));
    root.appendChild(out);
    press(btns, 1); press(dupBtns, 0);
    render();
  }

  /* =============== AULA 6: playground de CRDT =============== */
  var SITES = ['SP', 'Rio', 'Recife'];
  function newState() {
    return {
      g: { SP: 120, Rio: 80, Recife: 50 },
      p: { SP: 1, Rio: 0, Recife: 0 }, n: { SP: 0, Rio: 0, Recife: 0 },
      adds: { caneca: ['t0'] }, rem: {}
    };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function maxMap(a, b) {
    var r = {};
    SITES.forEach(function (s) { r[s] = Math.max(a[s] || 0, b[s] || 0); });
    return r;
  }
  function union(a, b) {
    var r = a.slice();
    b.forEach(function (x) { if (r.indexOf(x) < 0) r.push(x); });
    return r.sort();
  }
  function merge(a, b) {
    var r = { g: maxMap(a.g, b.g), p: maxMap(a.p, b.p), n: maxMap(a.n, b.n), adds: {}, rem: {} };
    var keys = Object.keys(a.adds).concat(Object.keys(b.adds), Object.keys(a.rem), Object.keys(b.rem));
    keys.forEach(function (k) {
      r.adds[k] = union(a.adds[k] || [], b.adds[k] || []);
      r.rem[k] = union(a.rem[k] || [], b.rem[k] || []);
    });
    return r;
  }
  function sum(m) { return SITES.reduce(function (t, s) { return t + (m[s] || 0); }, 0); }
  function items(st) {
    return Object.keys(st.adds).filter(function (k) {
      var rem = st.rem[k] || [];
      return st.adds[k].some(function (t) { return rem.indexOf(t) < 0; });
    }).sort();
  }
  function canon(st) { return JSON.stringify([st.g, st.p, st.n, items(st), sum(st.p) - sum(st.n)]); }
  function show(st) { return { g: sum(st.g), cart: items(st), stock: sum(st.p) - sum(st.n) }; }

  function wCrdt(root) {
    var states, partitioned, tagN, runs, ok;
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var note = el('p', { class: 'sr-note', role: 'status' });
    var partBtn;
    function reset() {
      states = { SP: newState(), Rio: newState(), Recife: newState() };
      partitioned = false; tagN = 0; runs = 0; ok = 0; note.textContent = '';
      partBtn.setAttribute('aria-pressed', 'false');
    }
    function syncAll() {
      var all = states.SP;
      all = merge(all, states.Rio); all = merge(all, states.Recife);
      SITES.forEach(function (s) { states[s] = clone(all); });
    }
    function after() { if (!partitioned) syncAll(); render(); }
    function inc(s, k) { states[s].g[s] += k; after(); }
    function addItem(s, name) {
      var st = states[s];
      st.adds[name] = (st.adds[name] || []).concat(['n' + (++tagN) + s]).sort();
      after();
    }
    function removeItem(s, name) {
      var st = states[s];
      if (items(st).indexOf(name) < 0) { note.textContent = s + ' has no ' + name + ' in the cart.'; render(); return; }
      st.rem[name] = union(st.rem[name] || [], st.adds[name] || []);
      after();
    }
    function sell(s) {
      var st = states[s];
      if (sum(st.p) - sum(st.n) <= 0) { note.textContent = s + ' sees stock 0 and refuses the sale.'; render(); return; }
      st.n[s] += 1;
      after();
    }
    function setPartition(v) {
      partitioned = v; partBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
      if (!v) syncAll();
      render();
    }
    function scenarioText() {
      reset(); partitioned = true; partBtn.setAttribute('aria-pressed', 'true');
      states.SP.g.SP += 15; states.Recife.g.Recife += 8;
      var t1 = 'n' + (++tagN) + 'Recife';
      states.Recife.adds.gato = [t1];
      states.SP.rem.caneca = ['t0'];
      states.SP.n.SP += 1; states.Recife.n.Recife += 1;
      note.textContent = 'Network split. SP: +15 views, removes the mug, sells 1. Recife: +8, adds the cat, sells 1. Now press "Merge".';
      render();
    }
    function scenarioAdd() {
      reset(); partitioned = true; partBtn.setAttribute('aria-pressed', 'true');
      states.SP.rem.caneca = ['t0'];
      states.Recife.adds.caneca = ['t0', 'n' + (++tagN) + 'Recife'];
      note.textContent = 'Network split. SP removes the mug and Recife adds it again at the same time. Press "Merge": the mug stays (add wins).';
      render();
    }
    function shuffle() {
      var snap = SITES.map(function (s) { return clone(states[s]); });
      var msgs = snap.slice();
      var extra = 2 + Math.floor(Math.random() * 4);
      for (var i = 0; i < extra; i++) msgs.push(clone(snap[Math.floor(Math.random() * 3)]));
      for (var j = msgs.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var tmp = msgs[j]; msgs[j] = msgs[k]; msgs[k] = tmp; }
      var empty = { g: { SP: 0, Rio: 0, Recife: 0 }, p: { SP: 0, Rio: 0, Recife: 0 }, n: { SP: 0, Rio: 0, Recife: 0 }, adds: {}, rem: {} };
      var r1 = msgs.reduce(merge, empty);
      var r2 = merge(merge(snap[0], snap[1]), snap[2]);
      runs += 1; if (canon(r1) === canon(r2)) ok += 1;
      var s = show(r1);
      note.textContent = 'Random order, ' + msgs.length + ' messages (' + (msgs.length - 3) + ' duplicated): views ' + s.g + ', cart {' + s.cart.join(', ') + '}, stock ' + s.stock + '. Same result as the in-order merge: ' + (canon(r1) === canon(r2) ? 'yes' : 'no') + '. Rounds that converged: ' + ok + ' of ' + runs + '.';
      render();
    }
    function render() {
      clear(out);
      var rows = SITES.map(function (s) {
        var v = show(states[s]);
        return { cells: [
          { text: s },
          { text: '{SP: ' + states[s].g.SP + ', Rio: ' + states[s].g.Rio + ', Recife: ' + states[s].g.Recife + '} = ' + v.g },
          { text: '{' + v.cart.join(', ') + '}' },
          { text: String(v.stock), cls: v.stock < 0 ? 'rp-cell bad' : 'rp-cell' }
        ] };
      });
      out.appendChild(table(['site', 'views', 'cart', 'stock'], rows, 'rp-wide'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Columns: G-Counter (views of cat 42), OR-Set (Lena\'s cart) and PN-Counter (mug stock).' }));
      var all = merge(merge(states.SP, states.Rio), states.Recife), v = show(all);
      var diverge = canon(states.SP) !== canon(all) || canon(states.Rio) !== canon(all) || canon(states.Recife) !== canon(all);
      if (diverge) out.appendChild(verdict(false, 'The sites still diverge.', 'If you merge now, the result is ' + v.g + ' views, {' + v.cart.join(', ') + '} in the cart and stock ' + v.stock + '.'));
      else out.appendChild(verdict(v.stock < 0, v.stock < 0 ? 'Converged, and the stock is at ' + v.stock + '.' : 'The three sites are equal.',
        v.stock < 0 ? 'The merge is correct and the same on all three, and still sold the last mug twice: a CRDT does not protect "stock ≥ 0".'
          : 'Views ' + v.g + ', cart {' + v.cart.join(', ') + '}, stock ' + v.stock + '.'));
      out.appendChild(note);
    }
    function siteRow(s) {
      var rw = el('div', { class: 'rp-site' }, [el('span', { class: 'rp-state', text: s + ':' })]);
      rw.appendChild(btn('+1 view', function () { inc(s, 1); }));
      rw.appendChild(btn('add cat', function () { addItem(s, 'gato'); }));
      rw.appendChild(btn('remove mug', function () { removeItem(s, 'caneca'); }));
      rw.appendChild(btn('sell 1 mug', function () { sell(s); }));
      return rw;
    }
    partBtn = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'Split the network' });
    partBtn.addEventListener('click', function () { setPartition(partBtn.getAttribute('aria-pressed') !== 'true'); });
    reset();
    root.appendChild(el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Network and scenarios' }, [
      partBtn,
      btn('Merge', function () { setPartition(false); }),
      btn('Scenario from the text', scenarioText),
      btn('Scenario: add wins', scenarioAdd),
      btn('Random order, with duplicates', shuffle),
      btn('Reset', function () { reset(); render(); })
    ]));
    SITES.forEach(function (s) { root.appendChild(siteRow(s)); });
    root.appendChild(out);
    render();
  }

  var REG = { quorum: wQuorum, failover: wFailover, conflito: wConflito, commit: wCommit, lena: wLena, ecst: wEcst, crdt: wCrdt };
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
