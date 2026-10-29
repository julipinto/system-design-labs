/* SDLabs · Single Point of Failure and Disaster Recovery: widgets in plain JS (English)
   (SPoF audit, failover clock, split brain, DR strategy, restore and pilot light, MTTD/MTTR/MTBF, RPO and lag, passive capacity).
   They use the brief's numbers (computed in Python on 10/21/2026): 12 links at 99.9% (98.8066% · 99.5003% · 99.9988%), SP outage
   (MTTD 30 s, RTO 65 s), RTOs 2,874 · 720 · 65 · 35 s, R$ 792/s, restore of 46.2 GB at 50 MB/s = 924 s, split brain 297 and 2,970,
   article averages 34 · 108.4 · 204.5 min. Node and pod durations are a model (example). No failover was run. */
(function () {
  'use strict';

  var MES = 43200; // minutes in 30 days

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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
  function fmtS(s) { /* seconds as short text: 65 s · 12 min · 47 min 54 s · 2 h 47 min */
    if (s < 120) return fmt(s, 1) + ' s';
    var m = Math.floor(s / 60), r = Math.round(s - m * 60);
    if (m < 120) return m + ' min' + (r ? ' ' + r + ' s' : '');
    var h = Math.floor(m / 60);
    return h + ' h' + (m - h * 60 ? ' ' + (m - h * 60) + ' min' : '');
  }
  function brl(v) { return 'R$ ' + fmt(Math.round(v), 0); }
  function pct(a, d) { return fmt(a * 100, d == null ? 4 : d) + '%'; }

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
    var id = 'dr-sl-' + (++uid);
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
  function numField(label, min, max, step, value, unit) {
    var id = 'dr-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: value == null ? '' : String(value), inputmode: 'decimal', class: 'dr-num' });
    return {
      input: inp,
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp])
    };
  }
  function fact(label, value, kind) {
    return el('div', { class: 'sr-fact' + (kind === 'bad' ? ' dr-badfact' : kind === 'ok' ? ' dr-okfact' : '') }, [el('small', { text: label }), el('b', { text: value })]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function bar(label, value, max, cls, text) {
    var w = max > 0 ? Math.max(1, Math.min(100, value / max * 100)) : 0;
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [
      el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + w.toFixed(1) + '%' }), el('span', { class: 'sr-lbl', text: text })])]);
  }

  /* =============== LESSON 2: SPoF audit (12 links) =============== */
  var ELOS = [
    ['DNS loja.com.br', 1], ['TLS certificate', 1], ['edge-loja (same code and map)', 1], ['Identity (JWT keys)', 1],
    ['lb e gw-loja', 2], ['bff-app', 2], ['pedidos', 2], ['pagamentos → PSP (with PSP-B)', 2], ['estoque', 2],
    ['PostgreSQL (primary + passive)', 2], ['Cell Kafka', 2], ['Map and control plane', 1]
  ];
  function wAuditoria(root) {
    var st = ELOS.map(function (e) { return { name: e[0], a: 99.9, k: e[1] }; });
    var avail = [], copies = [], rows = [];
    var list = el('div', { class: 'dr-elos' });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var last = '';
    function A(e) { var f = 1 - e.a / 100; return 1 - Math.pow(f, e.k); }
    function total() { return st.reduce(function (p, e) { return p * A(e); }, 1); }
    function render() {
      var T = total(), min = (1 - T) * MES, n = 0;
      st.forEach(function (e, i) {
        var s = e.k === 1; if (s) n++;
        rows[i].badge.textContent = s ? 'SPoF' : 'ok';
        rows[i].badge.className = 'dr-badge ' + (s ? 'bad' : 'ok');
        rows[i].row.className = 'dr-elo' + (s ? ' spof' : '');
        rows[i].dup.disabled = e.k >= 3;
      });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Availability in series', pct(T, 4), n ? 'bad' : 'ok'),
        fact('Minutes of failure per month', fmt(min, min < 10 ? 2 : 1), min > 60 ? 'bad' : 'ok'),
        fact('Links with a single copy', String(n), n ? 'bad' : 'ok')
      ]));
      if (last) out.appendChild(verdict(false, 'Duplicate:', last));
      out.appendChild(note('Each duplicated link becomes a parallel (1 − (1 − a)^copies). The math only holds with independent failures: edge-loja with the same code in all three instances is a single failure, so it counts as 1 copy. 30-day month (43,200 min).'));
    }
    st.forEach(function (e, i) {
      var a = numField('Availability (%)', 99, 99.999, 0.001, e.a, '');
      var k = el('select', { class: 'dr-num', 'aria-label': 'Copies of ' + e.name });
      [1, 2, 3].forEach(function (v) { k.appendChild(el('option', { value: String(v), text: v + (v === 1 ? ' copy' : ' copies') })); });
      k.value = String(e.k);
      var badge = el('span', { class: 'dr-badge' });
      var dup = el('button', { type: 'button', class: 'btn', text: 'Duplicate', 'aria-label': 'Duplicate this link: ' + e.name });
      a.input.setAttribute('aria-label', 'Availability of ' + e.name + ' in %');
      a.input.addEventListener('input', function () { var v = parseFloat(a.input.value); if (v >= 99 && v <= 99.99999) { e.a = v; last = ''; render(); } });
      k.addEventListener('change', function () { e.k = +k.value; last = ''; render(); });
      dup.addEventListener('click', function () {
        var before = (1 - total()) * MES;
        e.k = Math.min(3, e.k + 1); k.value = String(e.k);
        var after = (1 - total()) * MES;
        last = e.name + ': from ' + fmt(before, 1) + ' to ' + fmt(after, 1) + ' min per month, a gain of ' + fmt(before - after, 1) + ' min.';
        render();
      });
      var row = el('div', { class: 'dr-elo' }, [
        el('div', { class: 'dr-elo-h' }, [el('span', { class: 'dr-n', text: String(i + 1) }), el('span', { class: 'dr-nm', text: e.name }), badge]),
        el('div', { class: 'dr-elo-c' }, [el('div', { class: 'sr-ctl' }, [el('label', { text: 'Avail. (%)' }), a.input]), el('div', { class: 'sr-ctl' }, [el('label', { text: 'Copies' }), k]), dup])
      ]);
      rows.push({ row: row, badge: badge, dup: dup, k: k, a: a });
      list.appendChild(row);
    });
    var btns = [];
    function preset(i) {
      press(btns, i);
      st.forEach(function (e, j) {
        e.a = 99.9; rows[j].a.input.value = '99.9';
        e.k = i === 0 ? 1 : i === 2 ? 2 : ELOS[j][1];
        rows[j].k.value = String(e.k);
      });
      last = ''; render();
    }
    root.appendChild(chipRow('Scenario', ['All with 1 copy', 'Today (5 SPoFs)', 'Everything duplicated'], btns, preset));
    root.appendChild(list);
    root.appendChild(out);
    preset(1);
  }

  /* =============== LESSON 3: failover clock =============== */
  var TAXA_SP = 9.9;
  function wRelogio(root) {
    var iv = slider('Probe interval', 1, 30, 1, 10, 's', function (v) { return fmt(v, 0); });
    var nf = slider('Consecutive failures', 1, 5, 1, 3, '', function (v) { return fmt(v, 0); });
    var pr = slider('Database promotion (ttl + 5)', 5, 120, 5, 35, 's', function (v) { return fmt(v, 0); });
    var pd = slider('Passive pods ready', 0, 120, 5, 30, 's', function (v) { return fmt(v, 0); });
    var mp = slider('Map propagation', 1, 60, 1, 5, 's', function (v) { return fmt(v, 0); });
    var dn = slider('DNS TTL', 0, 300, 10, 60, 's', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var BLIP = 20; // example network blip, in s
    function render() {
      var I = +iv.input.value, N = +nf.input.value, P = +pr.input.value, D = +pd.input.value, M = +mp.input.value, T = +dn.input.value;
      var mttd = I * N, troca = Math.max(mttd + D, P) + M, mttr = troca - mttd, rto = troca;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('MTTD (probe × failures)', fmt(mttd, 0) + ' s'),
        fact('MTTR (from detection to recovery)', fmt(mttr, 0) + ' s'),
        fact('RTO (from the interruption)', fmt(rto, 0) + ' s', rto > 300 ? 'bad' : 'ok'),
        fact('Failed attempts (9.9/s)', fmt(TAXA_SP * rto, 1)),
        fact('Clients on the old address', 'up to ' + fmt(T, 0) + ' s')
      ]));
      var fp = mttd <= BLIP, slow = mttd >= 60;
      if (fp) out.appendChild(verdict(true, 'False positive:', 'the ' + fmt(mttd, 0) + ' s window fits inside a ' + BLIP + ' s network blip (example). The probe declares the region down, failover fires and SP, which was fine, is taken down (and opens the door to split brain).'));
      else if (slow) out.appendChild(verdict(true, 'Delay:', 'it takes ' + fmt(mttd, 0) + ' s just to notice the outage. Every second down costs 9.9 orders: the RTO ends up at ' + fmt(rto, 0) + ' s.'));
      else out.appendChild(verdict(false, 'Balance:', 'the ' + fmt(mttd, 0) + ' s window is longer than a ' + BLIP + ' s blip and still detects in under 1 min. With 10 s × 3 the RTO is 65 s.'));
      out.appendChild(note('The steps overlap: RTO = the larger of (detection + pods) and promotion, plus the map. The ' + BLIP + ' s blip and the pod and map durations are an example (model); the 65 s math is the brief\'s.'));
    }
    [iv, nf, pr, pd, mp, dn].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [iv.wrap, nf.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pr.wrap, pd.wrap, mp.wrap, dn.wrap]));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 3: split brain =============== */
  function wSplitBrain(root) {
    var tx = slider('Cell orders/s', 0.5, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var jn = slider('Window until fencing', 0, 300, 5, 30, 's', function (v) { return fmt(v, 0); });
    var tk = slider('Average ticket', 20, 300, 5, 80, 'R$', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var btns = [];
    function render() {
      var r = +tx.input.value, j = +jn.input.value, t = +tk.input.value, n = r * j;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Confirmed orders discarded', fmt(n, 0), n > 0 ? 'bad' : 'ok'),
        fact('Value of those orders', brl(n * t), n > 0 ? 'bad' : 'ok'),
        fact('Primaries at the same time', j > 0 ? '2' : '1', j > 0 ? 'bad' : 'ok')
      ]));
      out.appendChild(verdict(n > 0, n > 0 ? 'Two primaries:' : 'No window:',
        n > 0 ? 'SP, isolated and alive, accepts ' + fmt(r, 1) + ' orders/s for ' + fmt(j, 0) + ' s. Rio never saw them and pg_rewind discards them when the old primary is plugged back in.' : 'fencing demoted the old primary at the moment of promotion: no confirmed order is lost.'));
      out.appendChild(note('The brief\'s math: 9.9 × 30 s = 297 and 9.9 × 300 s = 2,970. The value in reais uses the example ticket (R$ 80). No Patroni fencing was tested with a network partition.'));
    }
    function pick(i) { press(btns, i); jn.set(i === 0 ? 30 : 300); render(); }
    [tx, jn, tk].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(chipRow('Window', ['30 s: fencing acted', '5 min: fencing failed'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, jn.wrap, tk.wrap]));
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 4: DR strategy =============== */
  var EST = [
    { id: 'backup', name: 'Backup and restore', rto: 2874, rpo: [86400, 300], extra: '~2%', roda: 'nothing; backup and WAL in object storage' },
    { id: 'pilot', name: 'Pilot light', rto: 720, rpo: [0.3], extra: '~10%', roda: 'only the database and the topic replicating; 0 pods' },
    { id: 'warm', name: 'Warm standby (active-passive)', rto: 65, rpo: [0.3], extra: '~30%', roda: 'the stack at 30% of capacity, ready' },
    { id: 'aa', name: 'Active-active', rto: 35, rpo: [0.3], extra: '~100%', roda: 'the stack at 100%, serving clients' }
  ];
  var SERV = [
    { name: 'checkout', rto: 300, rpo: 1, txt: '5 min · 1 s' },
    { name: 'catalog', rto: 900, rpo: 3600, txt: '15 min · 1 h' },
    { name: 'reports', rto: 86400, rpo: 86400, txt: '24 h · 24 h' }
  ];
  function wEstrategia(root) {
    var S = { e: 1, s: 0, b: 0 }, ebtn = [], sbtn = [], bbtn = [];
    var tx = slider('Cell orders/s', 1, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var tk = slider('Average ticket', 20, 300, 5, 80, 'R$', function (v) { return fmt(v, 0); });
    var bwrap = el('div', { class: 'dr-sub' });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var e = EST[S.e], sv = SERV[S.s], r = +tx.input.value, t = +tk.input.value;
      var rpo = e.id === 'backup' ? e.rpo[S.b] : e.rpo[0];
      bwrap.hidden = e.id !== 'backup';
      var perda = r * t * e.rto, ped = r * rpo;
      var okT = e.rto <= sv.rto, okP = rpo <= sv.rpo, ok = okT && okP;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('RTO', fmtS(e.rto) + (e.rto > 120 ? ' (' + fmt(e.rto, 0) + ' s)' : '')),
        fact('RPO', rpo >= 60 ? fmtS(rpo) : fmt(rpo, 1) + ' s'),
        fact('Orders lost (expected)', fmt(ped, 2)),
        fact('Extra infra cost', e.extra),
        fact('R$ lost', brl(perda), perda > 100000 ? 'bad' : '')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, EST.map(function (x, i) {
        return bar(x.name.split(' (')[0], r * t * x.rto, r * t * EST[0].rto, i === S.e ? 'win' : '', brl(r * t * x.rto));
      })));
      out.appendChild(verdict(!ok, ok ? 'Pass:' : 'Fail:',
        e.name + ' for ' + sv.name + ' (target ' + sv.txt + '): ' + (okT ? 'RTO of ' + fmtS(e.rto) + ' fits' : 'RTO of ' + fmtS(e.rto) + ' is over ' + fmtS(sv.rto)) + '; ' + (okP ? 'RPO fits.' : 'RPO of ' + (rpo >= 60 ? fmtS(rpo) : fmt(rpo, 1) + ' s') + ' is over ' + (sv.rpo >= 60 ? fmtS(sv.rpo) : sv.rpo + ' s') + '.')));
      out.appendChild(note('In reserve: ' + e.roda + '. R$ lost = orders/s × ticket × RTO (R$ 792/s × RTO with 9.9 × R$ 80). Durations and relative costs are an example; no regional failover was run. Synchronous active-active takes the RPO to 0, at +10 ms (Rio) or +80 ms (Recife) per commit.'));
    }
    function pickE(i) { S.e = i; press(ebtn, i); render(); }
    function pickS(i) { S.s = i; press(sbtn, i); render(); }
    function pickB(i) { S.b = i; press(bbtn, i); render(); }
    [tx, tk].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Strategy' }));
    root.appendChild(chipRow('Strategy', EST.map(function (x) { return x.name; }), ebtn, pickE));
    bwrap.appendChild(chipRow('Backup', ['Nightly backup (RPO 24 h)', 'WAL every 5 min (RPO 5 min)'], bbtn, pickB));
    root.appendChild(bwrap);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Service target' }));
    root.appendChild(chipRow('Service', SERV.map(function (x) { return x.name + ' (' + x.txt + ')'; }), sbtn, pickS));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, tk.wrap]));
    root.appendChild(out);
    press(bbtn, 0);
    pickS(0); pickE(1);
  }

  /* =============== LESSON 4: restore and pilot light step by step =============== */
  function wRestore(root) {
    var f = {
      gb: numField('Database size', 1, 2000, 0.1, 46.2, 'GB'),
      mb: numField('Restore throughput', 5, 2000, 5, 50, 'MB/s'),
      det: numField('Detect', 0, 600, 5, 30, 's'),
      dec: numField('Human decision', 0, 120, 1, 5, 'min'),
      iac: numField('Infra via IaC', 0, 120, 1, 20, 'min'),
      wal: numField('WAL replay', 0, 120, 1, 5, 'min'),
      nos: numField('New nodes', 0, 30, 1, 4, 'min'),
      pods: numField('Pods ready', 0, 600, 5, 30, 's'),
      aq: numField('Warm-up', 0, 60, 1, 2, 'min')
    };
    var MODES = [
      { name: 'Backup and restore', keys: ['gb', 'mb', 'dec', 'iac', 'wal', 'pods', 'aq'] },
      { name: 'Pilot light', keys: ['det', 'dec', 'nos', 'pods', 'aq'] }
    ];
    var NAMES = { gb: 'Database restore', det: 'Detect', dec: 'Human decision', iac: 'Infra via IaC', wal: 'WAL replay', nos: 'New nodes', pods: 'Pods', aq: 'Warm-up' };
    var btns = [], mode = 0;
    var fields = el('div', { class: 'sr-ctrls' });
    Object.keys(f).forEach(function (k) { fields.appendChild(f[k].wrap); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function secs(k) {
      var v = parseFloat(f[k].input.value); if (!(v >= 0)) v = 0;
      if (k === 'gb') return v * 1000 / Math.max(1, parseFloat(f.mb.input.value) || 1);
      if (k === 'dec' || k === 'iac' || k === 'wal' || k === 'nos' || k === 'aq') return v * 60;
      return v;
    }
    function render() {
      var m = MODES[mode];
      Object.keys(f).forEach(function (k) { f[k].wrap.hidden = m.keys.indexOf(k) < 0 && !(k === 'mb' && m.keys.indexOf('gb') >= 0); });
      var steps = m.keys.filter(function (k) { return k !== 'mb'; }).map(function (k) { return { k: k, s: secs(k) }; });
      var tot = steps.reduce(function (p, x) { return p + x.s; }, 0), big = steps.reduce(function (p, x) { return x.s > p.s ? x : p; }, steps[0]);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Total RTO', fmt(tot, 0) + ' s'), fact('In minutes', fmtS(tot)), fact('Heaviest step', NAMES[big.k] + ' (' + fmt(big.s / Math.max(tot, 1) * 100, 0) + '%)', 'bad'),
        fact('R$ lost (R$ 792/s)', brl(tot * 792))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, steps.map(function (x) {
        return bar(NAMES[x.k], x.s, big.s, x === big ? 'cap' : '', fmt(x.s, 0) + ' s');
      })));
      out.appendChild(note(mode === 0
        ? 'Sum: decision + infra + restore (' + fmt(secs('gb'), 0) + ' s = GB × 1,000 ÷ MB/s) + WAL replay + pods + warm-up. With the defaults: 300 + 1,200 + 924 + 300 + 30 + 120 = 2,874 s. The durations (except the restore math) are an example.'
        : 'Sum: detect + human decision + nodes + pods + warm-up. With the defaults: 30 + 300 + 240 + 30 + 120 = 720 s (12 min). The 5 min human decision is the one automation removes; the durations are an example.'));
    }
    function pick(i) { mode = i; press(btns, i); render(); }
    Object.keys(f).forEach(function (k) { f[k].input.addEventListener('input', render); });
    root.appendChild(chipRow('Strategy', MODES.map(function (m) { return m.name; }), btns, pick));
    root.appendChild(fields);
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 4: passive capacity =============== */
  var CEL = [
    { id: 'celula-sp', t: 9.9, regiao: 'SP', passiva: 'Rio', base: 4.5 },
    { id: 'celula-rio', t: 4.5, regiao: 'Rio', passiva: 'SP', base: 9.9 },
    { id: 'celula-recife', t: 3.6, regiao: 'Recife', passiva: 'SP', base: 9.9 },
    { id: 'celula-mkt', t: 12.0, regiao: 'Recife', passiva: 'SP', base: 9.9 }
  ];
  function wPassiva(root) {
    var S = { c: 0, nos: 1 }, cb = [], nb = [];
    var warm = slider('Warm passive', 10, 100, 5, 30, '% of capacity', function (v) { return fmt(v, 0); });
    var pp = slider('Orders/s per pod', 1, 10, 0.5, 3, '/s', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var c = CEL[S.c], W = +warm.input.value / 100, P = +pp.input.value;
      var fator = (c.base + c.t) / c.base, plenos = Math.ceil(c.t / P), quentes = Math.max(1, Math.ceil(plenos * W)), novos = Math.max(0, plenos - quentes);
      var tempo = novos === 0 ? 0 : 30 + (S.nos ? 0 : 240);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Passive region (' + c.passiva + ')', fmt(c.base, 1) + ' → ' + fmt(c.base + c.t, 1) + ' orders/s'),
        fact('Load factor', fmt(fator, 1) + '×', fator >= 3 ? 'bad' : ''),
        fact('Cell pods at 100%', String(plenos)),
        fact('Warm pods → to scale', quentes + ' → +' + novos),
        fact('Scale-up time', tempo ? fmtS(tempo) : 'none', tempo > 60 ? 'bad' : 'ok')
      ]));
      out.appendChild(verdict(fator >= 3, fator >= 3 ? 'The passive triples:' : 'The passive holds:',
        c.passiva + ' goes from ' + fmt(c.base, 1) + ' to ' + fmt(c.base + c.t, 1) + ' orders/s (' + fmt(fator, 1) + '×). ' + (novos ? 'The ' + novos + ' new pods take 30 s' + (S.nos ? ' with free nodes.' : ' plus 4 min for the nodes, because there are no free nodes.') : 'It already runs at full capacity.')));
      out.appendChild(note('The load comes from module 26 (' + CEL.map(function (x) { return x.id.replace('celula-', '') + ' ' + fmt(x.t, 1); }).join(' · ') + '; the SP region holds SP\'s load, and Rio holds Rio\'s). Orders/s per pod and the 30 s per pod are an example; the 3.2× math is from module 26.'));
    }
    function pickC(i) { S.c = i; press(cb, i); render(); }
    function pickN(i) { S.nos = i; press(nb, i); render(); }
    [warm, pp].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(chipRow('Cell that goes down', CEL.map(function (c) { return c.id + ' → ' + c.passiva; }), cb, pickC));
    root.appendChild(chipRow('Nodes', ['Free nodes (30 s)', 'No free nodes (+4 min)'], nb, pickN));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [warm.wrap, pp.wrap]));
    root.appendChild(out);
    press(nb, 0); pickC(0);
  }

  /* =============== LESSON 5: MTTD, MTTR and MTBF =============== */
  var ART = { det: [60, 18, 20, 21, 51], rep: [90, 105, 132, 22, 193], gap: [116, 85, 240, 377, ''] };
  function wMttd(root) {
    var det = [], rep = [], gap = [], rows = [];
    var tb = el('tbody');
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var d = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Incident ' + (i + 1) + ': detection took (min)' });
        var r = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Incident ' + (i + 1) + ': repair took (min)' });
        var g = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Interval after incident ' + (i + 1) + ' (min)' });
        [d, r, g].forEach(function (x) { x.addEventListener('input', render); });
        det.push(d); rep.push(r); gap.push(g);
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: 'Incident ' + (i + 1) }), el('td', null, [d]), el('td', null, [r]), el('td', null, [g])]));
      })(i);
    }
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var warn = false;
    function avg(arr) {
      var v = arr.map(function (x) { return parseFloat(x.value); }).filter(function (x) { return x >= 0; });
      return v.length ? v.reduce(function (p, x) { return p + x; }, 0) / v.length : null;
    }
    function render() {
      var a = avg(det), b = avg(rep), c = avg(gap);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('MTTD (start → detection)', a == null ? '—' : fmt(a, 2) + ' min'),
        fact('MTTR (detection → recovery)', b == null ? '—' : fmt(b, 2) + ' min'),
        fact('MTBF (recovery → next)', c == null ? '—' : fmt(c, 2) + ' min'),
        fact('Availability', b == null || c == null ? '—' : pct(c / (c + b), c / (c + b) > 0.99 ? 4 : 1))
      ]));
      if (warn) out.appendChild(verdict(true, 'Didactic:', 'the three columns come from three tables in the article that do not describe the same incidents (the "12:00 PM" detection becomes "12:00 AM"; 10:02 becomes 11:02). Each average is right for its own table, and the 65.4% availability shows these are not numbers from a real operation.'));
      out.appendChild(note('Availability = MTBF ÷ (MTBF + MTTR), with the minutes as they are. The last row has no "interval until the next failure". Blank cells are left out of the average.'));
    }
    function put(arr, vals) { arr.forEach(function (x, i) { x.value = vals[i] === undefined || vals[i] === '' ? '' : String(vals[i]); }); }
    var btns = [];
    function preset(i) {
      press(btns, i);
      warn = i === 0;
      if (i === 0) { put(det, ART.det); put(rep, ART.rep); put(gap, ART.gap); }
      else if (i === 1) { put(det, [0.5, '', '', '', '']); put(rep, [65 / 60, '', '', '', '']); put(gap, [MES, '', '', '', '']); }
      else { put(det, ['', '', '', '', '']); put(rep, ['', '', '', '', '']); put(gap, ['', '', '', '', '']); }
      render();
    }
    root.appendChild(chipRow('Table', ['Article table', 'SP outage (30 s, 65 s, 30-day MTBF)', 'Clear'], btns, preset));
    root.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table dr-table' }, [
      el('thead', null, [el('tr', null, ['', 'Detection took (min)', 'Repair took (min)', 'Until the next failure (min)'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]));
    root.appendChild(out);
    preset(0);
  }

  /* =============== LESSON 5: RPO and lag =============== */
  function wRpo(root) {
    var CELS = [['celula-recife', 3.6, 0.8], ['celula-rio', 4.5, 0.3], ['celula-sp', 9.9, 0.3], ['celula-mkt', 12.0, 0.8]];
    var btns = [];
    var tx = slider('Cell orders/s', 0.5, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var lg = slider('Replication lag', 0, 2, 0.05, 0.3, 's', function (v) { return fmt(v, 2); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var r = +tx.input.value, l = +lg.input.value, p = r * l;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Expected loss (rate × lag)', fmt(p, 2) + ' orders', p > 1 ? 'bad' : 'ok'),
        fact('Lag window', fmt(l * 1000, 0) + ' ms', l > 0.5 ? 'bad' : 'ok')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Asynchronous', 2, 82, 'win', '2 ms'), bar('Synchronous Rio', 12, 82, '', '12 ms (2 + 10)'), bar('Synchronous Recife', 82, 82, 'cap', '82 ms (2 + 80)')
      ]));
      out.appendChild(verdict(l > 0.5, l > 0.5 ? 'Above the alert:' : 'Within the alert:',
        'the ' + fmt(l * 1000, 0) + ' ms lag ' + (l > 0.5 ? 'is over the 500 ms replication_lag_seconds alert; the 1 s promise is at risk before any disaster.' : 'is under the 500 ms replication_lag_seconds alert. Zero RPO would need a synchronous commit: 12 ms with Rio, 82 ms with Recife.')));
      out.appendChild(note('Expected loss = rate × lag (celula-sp 9.9 × 0.3 = 2.97 · recife 3.6 × 0.8 = 2.88 · mkt 12 × 0.8 = 9.6). Commit latencies from module 17: 2 ms local, plus 10 ms (Rio) or 80 ms (Recife) round trip.'));
    }
    function pick(i) { press(btns, i); tx.set(CELS[i][1]); lg.set(CELS[i][2]); render(); }
    [tx, lg].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(chipRow('Cell', CELS.map(function (c) { return c[0] + ' (' + fmt(c[1], 1) + '/s, ' + fmt(c[2], 1) + ' s)'; }), btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, lg.wrap]));
    root.appendChild(out);
    pick(2);
  }

  var REG = { auditoria: wAuditoria, relogio: wRelogio, splitbrain: wSplitBrain, estrategia: wEstrategia, restore: wRestore, passiva: wPassiva, mttd: wMttd, rpo: wRpo };
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
