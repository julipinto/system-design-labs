/* SDLabs · Cell-Based Architecture: plain JS widgets (English copy of widgets.js)
   (veneno, raio, piso, estoque, roteador, replicação e 2PC, shuffle, folga).
   Usam os números do brief: células 40 · 33 · 15 · 12% (30 pedidos/s na BF), plano de 2027 (200 pedidos/s, 950 req/s, 41 → 53 vCPU),
   piso de 2 réplicas, 2PC em 2 rodadas (24 e 164 ms), shuffle exato C(f,k) ÷ C(N,k) × aproximado (f/N)^k.
   As contas foram refeitas em Python em 21/10/2026 (c26.py) e batem com o brief. */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
  function sig(v, n) { return Number(v).toLocaleString('en-US', { maximumSignificantDigits: n || 3 }); }
  function pct(v, d) { return fmt(v, d) + '%'; }

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
    var id = 'cb-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : fmt(+inp.value, 2)) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return {
      input: inp,
      set: function (v) { inp.value = String(v); sync(); },
      setMax: function (m) { inp.max = String(m); sync(); },
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp])
    };
  }
  function numField(label, min, max, step, value, unit) {
    var id = 'cb-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: String(value), inputmode: 'decimal', class: 'cb-num' });
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp]) };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' cb-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cb-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function sub(t) { return el('p', { class: 'sr-sub', text: t }); }
  function bar(label, value, max, text, cls) {
    return el('div', { class: 'sr-bar' }, [
      el('span', { text: label }),
      el('div', { class: 'sr-track' }, [
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, value / max * 100)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }
  function btn(label, onClick) {
    var b = el('button', { type: 'button', class: 'btn', text: label });
    b.addEventListener('click', onClick);
    return b;
  }
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }

  /* ---- the store: 4 cells (mkt, sp, rio, recife) ---- */
  var NAMES = ['celula-mkt', 'celula-sp', 'celula-rio', 'celula-recife'];
  var FRAC = [40, 33, 15, 12];

  /* ================= 1. veneno ================= */
  function wVeneno(root) {
    var S = { modo: 1, n: 4, custom: [40, 33, 15, 12] };
    var nS = slider('Cells', 1, 10, 1, 4, '');
    var tS = slider('Orders per second', 5, 60, 1, 30, 'ord/s');
    var mS = slider('Minutes until the block', 1, 15, 1, 4, 'min');
    var kS = slider('Minutes with the consumer stuck', 1, 30, 1, 10, 'min');
    var mB = [];
    var fields = el('div', { class: 'sr-ctrls' });
    var fInputs = [];
    for (var i = 0; i < 10; i++) {
      var f = numField('Cell ' + (i + 1), 0, 100, 1, i < 4 ? FRAC[i] : 0, '%');
      fInputs.push(f.input); fields.appendChild(f.wrap);
    }
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function fractions() {
      if (S.modo === 1) return { n: 4, p: FRAC.slice(), poison: 0, loja: true };
      if (S.modo === 0) { var n = +nS.input.value, a = []; for (var i = 0; i < n; i++) a.push(100 / n); return { n: n, p: a, poison: 0 }; }
      var vals = fInputs.map(function (x) { return Math.max(0, +x.value || 0); });
      var n2 = +nS.input.value, arr = vals.slice(0, n2), tot = arr.reduce(function (a, b) { return a + b; }, 0) || 1;
      return { n: n2, p: arr.map(function (v) { return v / tot * 100; }), poison: 0 };
    }
    function render() {
      var fr = fractions(), rate = +tS.input.value, min = +mS.input.value, kmin = +kS.input.value;
      var p = fr.p[fr.poison] / 100, seg = min * 60, seg2 = kmin * 60;
      var perdU = rate * seg, perdC = rate * p * seg;
      var evtU = rate * 4 / 3 * seg2, evtC = rate * p * 4 / 3 * seg2; /* já é por partição: 40/s × 600 s */
      var pfU = evtU * 0.6, pfC = fr.loja ? 0 : evtC * 0.6;
      var pfRaio = fr.loja ? 0 : p * 100;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Lost attempts, single stack', fmt(perdU, 0) + ' (100%)', true),
        fact('Lost attempts, cells', fmt(perdC, 0) + ' (' + pct(p * 100, 1) + ')'),
        fact('Individual customer radius', '100% → ' + pct(pfRaio, 1)),
        fact('Partner radius (mkt-01)', '100% → 100%')
      ]));
      out.appendChild(sub('The same poison in the topic (3 partitions, 4 events per order)'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Stuck, shared topic', fmt(evtU, 0) + ' (' + fmt(pfU, 0) + ' from individuals)', true),
        fact('Stuck, per-cell topic', fmt(evtC, 0) + ' (' + fmt(pfC, 0) + ' from individuals)'),
        fact('Events/s on the poison partition', fmt(rate * 4 / 3, 1) + ' → ' + fmt(rate * p * 4 / 3, 1))
      ]));
      var ok = fr.loja && Math.abs(rate - 30) < 1e-9 && min === 4 && kmin === 10;
      out.appendChild(verdict(false, ok ? 'The store math.' : 'The math.',
        'In the single stack the poison hits the whole rate (' + fmt(perdU, 0) + ' attempts). With cells, only the share of its own cell (' + pct(p * 100, 1) + '): ' + fmt(perdC, 0) +
        '. The stuck events are the poison partition rate (' + fmt(rate * 4 / 3, 1) + '/s in the single stack, ' + fmt(rate * p * 4 / 3, 1) + '/s in the cell) × the seconds stuck.'));
      out.appendChild(note('Store: 30 ord/s × 240 s = 7,200 × 12 × 240 = 2,880; 40/s × 600 s = 24,000 (14,400 from individuals) × 16/s × 600 s = 9,600 (all from the partner). The rate per partition is 4 events per order ÷ 3.'));
    }
    function pick(i) {
      S.modo = i; press(mB, i);
      if (i === 1) { nS.set(4); nS.input.disabled = true; } else nS.input.disabled = false;
      fields.style.display = i === 2 ? '' : 'none';
      render();
    }
    root.appendChild(chipRow('Traffic split', ['Uniform', 'The store\'s (40 · 33 · 15 · 12)', 'Editable'], mB, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap, tS.wrap, mS.wrap, kS.wrap]));
    root.appendChild(fields);
    [nS, tS, mS, kS].forEach(function (x) { x.input.addEventListener('input', render); });
    fInputs.forEach(function (x) { x.addEventListener('input', render); });
    root.appendChild(out);
    pick(1);
  }

  /* ================= 2. raio ================= */
  function wRaio(root) {
    var S = { modo: 1 };
    var nS = slider('Cells', 1, 20, 1, 4, '');
    var mB = [];
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function dist() {
      if (S.modo === 1) return { names: NAMES, p: FRAC };
      if (S.modo === 2) return { names: ['celula-mkt', 'celula-sp-a', 'celula-sp-b', 'celula-rio', 'celula-recife'], p: [40, 16.5, 16.5, 15, 12] };
      var n = +nS.input.value, names = [], p = [];
      for (var i = 0; i < n; i++) { names.push('cell ' + (i + 1)); p.push(100 / n); }
      return { names: names, p: p };
    }
    function render() {
      var d = dist(), n = d.p.length, max = Math.max.apply(null, d.p), avg = 100 / n, eff = 100 * avg / max;
      clear(out);
      out.appendChild(el('div', { class: 'sr-bars' }, d.p.map(function (v, i) {
        return bar(d.names[i].replace('celula-', ''), v, 100, fmt(v, 1) + '%', v === max ? 'win' : '');
      })));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Cells', String(n)),
        fact('Average radius', pct(avg, 1)),
        fact('Worst case', pct(max, 1), max > avg + 1e-9),
        fact('Efficiency 1 ÷ (N × max.)', pct(eff, 1), eff < 99.9)
      ]));
      var uni = Math.abs(max - avg) < 1e-9;
      out.appendChild(verdict(!uni, uni ? 'Uniform traffic.' : 'The radius is the biggest share.',
        uni ? 'With equal parts the worst case is 1 ÷ N, the article\'s table.' : 'The worst case is ' + pct(max, 1) + ', not ' + pct(avg, 1) + ' (1 ÷ N): the efficiency drops to ' + pct(eff, 1) + '.'));
      out.appendChild(table(['Store mix', 'Share of the traffic'], [
        { cells: [{ text: 'mkt-01' }, { text: '40%' }] },
        { cells: [{ text: 'SP (55% × 60%)' }, { text: '33%' }] },
        { cells: [{ text: 'Rio (25% × 60%)' }, { text: '15%' }] },
        { cells: [{ text: 'Recife (20% × 60%)' }, { text: '12%' }] }
      ]));
      out.appendChild(note('Without mkt-01 set apart there would be 3 cells at 55 · 25 · 20% (worst case 55%, average 33.3%). For the individual customer, the mkt-01 radius drops from 100% to 0%.'));
    }
    function pick(i) { S.modo = i; press(mB, i); nS.input.disabled = i !== 0; nS.wrap.style.display = i === 0 ? '' : 'none'; render(); }
    root.appendChild(chipRow('Distribution', ['Uniform', 'The store\'s (4 cells)', 'SP split in 2 (5 cells)'], mB, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap]));
    nS.input.addEventListener('input', render);
    root.appendChild(out);
    pick(1);
  }

  /* ================= 3. piso ================= */
  var SERV = [
    { n: 'catalogo', cap: 100, min1: 2 },
    { n: 'pedidos', cap: 30, min1: 3 },
    { n: 'pagamentos', cap: 20, min1: 2 },
    { n: 'estoque', cap: 500, min1: 2 }
  ];
  function reps(load, cap, rho, piso) { return Math.max(piso, Math.ceil(load / (cap * rho) - 1e-9)); }
  function wPiso(root) {
    var pS = slider('Orders per second (total)', 5, 300, 1, 200, 'ord/s');
    var cS = slider('Catalog', 50, 1500, 10, 950, 'req/s');
    var rS = slider('ρ alvo', 50, 90, 5, 70, '%');
    var zS = slider('Floor per service', 1, 3, 1, 2, 'replicas');
    var pB = [];
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function render() {
      var ped = +pS.input.value, cat = +cS.input.value, rho = +rS.input.value / 100, piso = +zS.input.value;
      var cells = [
        { n: 'celula-mkt', ped: ped * 0.4, cat: Math.min(100, cat) },
        { n: 'celula-sp', ped: ped * 0.6 * 0.55, cat: cat * 0.55 },
        { n: 'celula-rio', ped: ped * 0.6 * 0.25, cat: cat * 0.25 },
        { n: 'celula-recife', ped: ped * 0.6 * 0.20, cat: cat * 0.20 }
      ];
      var load1 = [cat, ped, ped, ped];
      var single = SERV.map(function (s, i) { return reps(load1[i], s.cap, rho, s.min1); });
      var perCell = cells.map(function (c) {
        var l = [c.cat, c.ped, c.ped, c.ped];
        return SERV.map(function (s, i) { return reps(l[i], s.cap, rho, piso); });
      });
      var sum = SERV.map(function (s, i) { return perCell.reduce(function (a, r) { return a + r[i]; }, 0); });
      var t1 = single.reduce(function (a, b) { return a + b; }, 0), tC = sum.reduce(function (a, b) { return a + b; }, 0);
      var diffs = sum.map(function (v, i) { return v - single[i]; });
      var worst = diffs.indexOf(Math.max.apply(null, diffs));
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Single stack', fmt(t1, 0) + ' vCPU'),
        fact('4 cells', fmt(tC, 0) + ' vCPU', true),
        fact('Difference', '+' + fmt(tC - t1, 0) + ' (' + pct((tC - t1) / t1 * 100, 1) + ')'),
        fact('Ratio', fmt(tC / t1, 1).replace(',0', '') + '×')
      ]));
      var rows = SERV.map(function (s, i) {
        return { cells: [{ text: s.n }, { text: fmt(single[i], 0) }, { text: fmt(sum[i], 0) }, { text: (diffs[i] >= 0 ? '+' : '') + fmt(diffs[i], 0), cls: i === worst && diffs[i] > 0 ? 'cb-bad' : '' }] };
      });
      rows.push({ cells: [{ text: 'total' }, { text: fmt(t1, 0) }, { text: fmt(tC, 0) }, { text: '+' + fmt(tC - t1, 0) }] });
      out.appendChild(table(['Service', 'Single stack', '4 cells', 'Difference'], rows));
      out.appendChild(sub('vCPU of each cell'));
      out.appendChild(el('div', { class: 'sr-facts' }, cells.map(function (c, i) {
        return fact(c.n, fmt(perCell[i].reduce(function (a, b) { return a + b; }, 0), 0) + ' vCPU');
      })));
      out.appendChild(verdict(false, 'Weighs most: ' + SERV[worst].n + '.',
        diffs[worst] > 0 ? 'Goes from ' + single[worst] + ' to ' + sum[worst] + ' replicas (+' + diffs[worst] + '): the floor of ' + piso + ' per cell is paid four times, and so is the rounding.'
          : 'Nothing weighs more: the floor fits within what the load already needed.'));
      out.appendChild(note('1 replica = 1 vCPU. Capacity per replica: catalog 100 req/s, pedidos 30/s, pagamentos 20/s, estoque 500/s. celula-mkt reserves the 100 req/s cap on the catalog (module 25). In the single stack, the minimum is the module 14 fleet (2 · 3 · 2 · 2).'));
    }
    function preset(i) { press(pB, i); if (i === 0) { pS.set(5); cS.set(100); } else { pS.set(200); cS.set(950); } render(); }
    root.appendChild(chipRow('Scenario', ['Regular day (5 ord/s)', '2027 Black Friday (200 ord/s)'], pB, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pS.wrap, cS.wrap, rS.wrap, zS.wrap]));
    [pS, cS, rS, zS].forEach(function (x) { x.input.addEventListener('input', function () { press(pB, -1); render(); }); });
    root.appendChild(out);
    preset(1);
  }

  /* ================= 4. estoque ================= */
  function allocate(units) {
    var exact = FRAC.map(function (f) { return units * f / 100; });
    var base = exact.map(Math.floor), left = units - base.reduce(function (a, b) { return a + b; }, 0);
    var order = exact.map(function (v, i) { return { i: i, r: v - Math.floor(v) }; }).sort(function (a, b) { return b.r - a.r; });
    for (var k = 0; k < left; k++) base[order[k].i]++;
    return base;
  }
  function wEstoque(root) {
    var uS = slider('Cat units in the network', 1, 50, 1, 19, '');
    var S = { alloc: null, global: false, log: [], total: 0, lena: false };
    var gB = el('input', { type: 'checkbox', id: 'cb-glob' });
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    var bLena = btn('Order 1060 (Lena takes 2)', function () { buy(2, true); });
    var bNext = btn('Next Recife customer (1)', function () { buy(1, false); });
    var bRb = btn('Rebalance', rebalance);
    var bRs = btn('Start over', reset);
    function reset() {
      S.total = +uS.input.value; S.alloc = allocate(S.total); S.log = []; S.lena = false;
      S.log.push('Proportional allocation: sp ' + S.alloc[1] + ' · rio ' + S.alloc[2] + ' · recife ' + S.alloc[3] + ' · mkt ' + S.alloc[0] + '.');
      render();
    }
    function netTotal() { return S.global ? S.total : S.alloc.reduce(function (a, b) { return a + b; }, 0); }
    function buy(q, lena) {
      if (S.global) {
        if (S.total >= q) { S.total -= q; S.log.push((lena ? 'Lena takes ' + q + '. ' : 'Recife customer takes ' + q + '. ') + 'Global stock: ' + S.total + '.'); }
        else S.log.push('Sold out: the whole network only has ' + S.total + '.');
      } else if (S.alloc[3] >= q) {
        S.alloc[3] -= q; if (lena) S.lena = true;
        S.log.push((lena ? 'Lena takes ' + q + ' (order 1060, 174.80). ' : 'Recife customer takes ' + q + '. ') + 'celula-recife: ' + S.alloc[3] + '. Network: ' + netTotal() + '.');
      } else {
        S.log.push('"Sold out" in Recife, with ' + netTotal() + ' cat' + (netTotal() === 1 ? '' : 's') + ' in the network.');
      }
      render();
    }
    function rebalance() {
      if (S.global) { S.log.push('With a global stock there is nothing to rebalance.'); render(); return; }
      var give = Math.min(2, S.alloc[1]);
      if (give === 0) { S.log.push('celula-sp has nothing to give.'); render(); return; }
      S.alloc[1] -= give; S.alloc[3] += give;
      S.log.push('The control plane moves ' + give + ' from SP to Recife (async, within seconds). Recife: ' + S.alloc[3] + ', SP: ' + S.alloc[1] + '.');
      render();
    }
    function render() {
      clear(out);
      if (S.global) {
        out.appendChild(el('div', { class: 'sr-bars' }, [bar('network', S.total, +uS.input.value, S.total + ' cats', 'cap')]));
        out.appendChild(verdict(true, 'Global stock.', 'The oversell goes away, but the four cells now depend on the same stock: the radius is back to 100% (the hidden channel from module 25).'));
      } else {
        out.appendChild(el('div', { class: 'sr-bars' }, S.alloc.map(function (v, i) {
          return bar(NAMES[i].replace('celula-', ''), v, Math.max(1, Math.max.apply(null, allocate(S.total || 1))), v + (i === 3 && S.alloc[3] === 0 ? ' (sold out)' : ''), i === 3 && S.alloc[3] === 0 ? '' : 'win');
        })));
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('In the network', fmt(netTotal(), 0) + ' cats'),
          fact('celula-recife', fmt(S.alloc[3], 0), S.alloc[3] === 0),
          fact('Rebalance when', '< 20% of the allocation')
        ]));
        if (S.alloc[3] === 0 && netTotal() > 0) out.appendChild(verdict(true, 'The last cat.', 'Recife hit zero with ' + netTotal() + ' in the network. Ways out: accept the local sold out, rebalance (async) or reserve across cells with a saga (couples two cells).'));
      }
      out.appendChild(el('ul', { class: 'cb-log' }, S.log.slice(-5).map(function (t) { return el('li', { text: t }); })));
    }
    gB.addEventListener('change', function () { S.global = gB.checked; if (S.global) { S.total = netTotal() || S.total; } reset2(); });
    function reset2() { var keep = S.global; reset(); S.global = keep; if (keep) { S.total = +uS.input.value; S.log = ['Global stock: ' + S.total + ' cats for the four cells.']; } render(); }
    uS.input.addEventListener('input', reset2);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [uS.wrap]));
    root.appendChild(el('label', { class: 'cb-check', for: 'cb-glob' }, [gB, 'Global stock (the tempting design)']));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bLena, bNext, bRb, bRs]));
    root.appendChild(out);
    reset();
  }

  /* ================= 5. roteador ================= */
  function murmur3(str) {
    var h = 0, k, i = 0, len = str.length, rem = len & 3, bytes = len - rem;
    function mul(a, b) { return Math.imul(a, b); }
    while (i < bytes) {
      k = (str.charCodeAt(i) & 0xff) | ((str.charCodeAt(i + 1) & 0xff) << 8) | ((str.charCodeAt(i + 2) & 0xff) << 16) | ((str.charCodeAt(i + 3) & 0xff) << 24);
      i += 4;
      k = mul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = mul(k, 0x1b873593);
      h ^= k; h = (h << 13) | (h >>> 19); h = (mul(h, 5) + 0xe6546b64) | 0;
    }
    k = 0;
    if (rem >= 3) k ^= (str.charCodeAt(i + 2) & 0xff) << 16;
    if (rem >= 2) k ^= (str.charCodeAt(i + 1) & 0xff) << 8;
    if (rem >= 1) { k ^= str.charCodeAt(i) & 0xff; k = mul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = mul(k, 0x1b873593); h ^= k; }
    h ^= len; h ^= h >>> 16; h = mul(h, 0x85ebca6b); h ^= h >>> 13; h = mul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }
  var RING_V = 100;
  function buildRing(n) {
    var pts = [];
    for (var c = 0; c < n; c++) for (var v = 0; v < RING_V; v++) pts.push({ h: murmur3('celula-' + (c + 1) + '#' + v), c: c });
    pts.sort(function (a, b) { return a.h - b.h; });
    return pts;
  }
  function ringCell(ring, h) {
    var lo = 0, hi = ring.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (ring[mid].h < h) lo = mid + 1; else hi = mid; }
    return ring[lo === ring.length ? 0 : lo].c;
  }
  var CLIENTS = [
    { id: 'lena-77', cell: 'celula-recife' },
    { id: 'bia-31', cell: 'celula-sp' },
    { id: 'caio-58', cell: 'celula-rio' },
    { id: 'davi-12', cell: 'celula-sp' },
    { id: 'mkt-01', cell: 'celula-mkt' }
  ];
  function wRoteador(root) {
    var nS = slider('Cells (N)', 3, 10, 1, 4, '');
    var cB = [], mB = [];
    var S = { c: 0, m: 0, moved: null };
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    var KEYS = 100000, hs = [];
    for (var i = 0; i < KEYS; i++) hs.push(murmur3('cliente-' + i));
    function where(m, n, id) {
      if (m === 0) return CLIENTS.filter(function (c) { return c.id === id; })[0].cell;
      var h = murmur3(id);
      return 'c' + ((m === 1 ? h % n : ringCell(buildRing(n), h)) + 1);
    }
    function moves(n) {
      var a = 0, b = 0, r1 = buildRing(n), r2 = buildRing(n + 1);
      for (var i = 0; i < KEYS; i++) {
        if (hs[i] % n !== hs[i] % (n + 1)) a++;
        if (ringCell(r1, hs[i]) !== ringCell(r2, hs[i])) b++;
      }
      return { mod: a / KEYS * 100, ring: b / KEYS * 100 };
    }
    var bMove = btn('N → N + 1', function () { S.moved = moves(+nS.input.value); render(); });
    function render() {
      var n = +nS.input.value, id = CLIENTS[S.c].id;
      clear(out);
      var cur = where(S.m, n, id);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Customer', id),
        fact('Key → cell', S.m === 0 ? 'mapa-v42 → ' + cur : (S.m === 1 ? 'murmur3 mod ' + n : 'ring of ' + (n * RING_V) + ' points') + ' → ' + cur),
        S.moved ? fact('After N + 1', S.m === 0 ? cur + ' (the table only changes if you change it)' : where(S.m, n + 1, id)) : fact('After N + 1', 'press the button')
      ]));
      if (S.m === 0) out.appendChild(note('The registry table stores cliente_id → cell (1.5 million × ~100 B = 150 MB, in memory at the edge). It does not depend on N.'));
      if (S.moved) {
        out.appendChild(sub('Who changes cell from ' + n + ' to ' + (n + 1) + ' (100,000 keys, murmur3)'));
        out.appendChild(table(['Method', 'Keys that move'], [
          { cls: S.m === 1 ? 'cb-cur' : '', cells: [{ text: 'hash mod N' }, { text: fmt(S.moved.mod, 1) + '%', cls: 'cb-bad' }] },
          { cls: S.m === 2 ? 'cb-cur' : '', cells: [{ text: 'ring (' + RING_V + ' points per cell)' }, { text: fmt(S.moved.ring, 1) + '%' }] },
          { cls: S.m === 0 ? 'cb-cur' : '', cells: [{ text: 'registry table' }, { text: '0% (only the ones you move)' }] }
        ]));
        out.appendChild(verdict(S.moved.mod > 50, 'Rehash storm.', 'mod N moves ' + fmt(S.moved.mod, 1) + '% of the keys; the ring, ' + fmt(S.moved.ring, 1) + '% (theory: 1 ÷ (N + 1) = ' + fmt(100 / (n + 1), 1) + '%); the table, nothing. Every key that moves takes its data along.'));
      } else {
        out.appendChild(note('Press N → N + 1 to count who changes cell. Brief: 4 → 5 with 100,000 SHA-256 keys gave 80.1% (mod N); with murmur3 the value is close.'));
      }
      out.appendChild(note('Moving mkt-01 through the table: 20 million rows × 2 KB = 40 GB; at 50 MB/s that is 800 s = 13 min 20 s.'));
    }
    function pickC(i) { S.c = i; press(cB, i); render(); }
    function pickM(i) { S.m = i; S.moved = null; press(mB, i); render(); }
    root.appendChild(chipRow('Customer', CLIENTS.map(function (c) { return c.id; }), cB, pickC));
    root.appendChild(chipRow('Method', ['Table', 'mod N', 'Ring'], mB, pickM));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap]));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bMove]));
    nS.input.addEventListener('input', function () { S.moved = null; render(); });
    root.appendChild(out);
    press(cB, 0); press(mB, 0); render();
  }

  /* ================= 6. replicação e 2PC ================= */
  function wReplicacao(root) {
    var PRE = [{ n: 'celula-sp', r: 9.9, l: 300 }, { n: 'celula-rio', r: 4.5, l: 300 }, { n: 'celula-recife', r: 3.6, l: 800 }, { n: 'celula-mkt', r: 12, l: 800 }];
    var rS = slider('Orders per second of the cell', 1, 40, 0.1, 9.9, 'ord/s', function (v) { return fmt(v, 1); });
    var lS = slider('Passive lag', 0, 2000, 50, 300, 'ms', function (v) { return fmt(v, 0); });
    var aS = slider('RTT SP–Rio', 1, 100, 1, 10, 'ms', function (v) { return fmt(v, 0); });
    var bS = slider('RTT SP–Recife', 10, 200, 1, 80, 'ms', function (v) { return fmt(v, 0); });
    var vS = slider('Availability of each cell', 99, 99.99, 0.01, 99.9, '%', function (v) { return fmt(v, 2); });
    var cB = [];
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function render() {
      var r = +rS.input.value, lag = +lS.input.value, a = +aS.input.value, b = +bS.input.value, av = +vS.input.value / 100, loc = 2;
      var perda = r * lag / 1000, perdaU = 30 * lag / 1000;
      var l1 = loc, l2 = 2 * a + 2 * loc, l3 = 2 * Math.max(a, b) + 2 * loc;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Expected loss (rate × lag)', fmt(perda, 2) + ' orders'),
        fact('Before: single primary (30/s)', fmt(perdaU, 1) + ' orders')
      ]));
      out.appendChild(table(['Commit', 'Latency', 'Hot row', 'Availability'], [
        { cells: [{ text: 'Asynchronous (active only)' }, { text: fmt(l1, 0) + ' ms' }, { text: fmt(1000 / l1, 1) + '/s' }, { text: pct(av * 100, 4) }] },
        { cells: [{ text: '2PC SP + Rio' }, { text: fmt(l2, 0) + ' ms' }, { text: fmt(1000 / l2, 1) + '/s' }, { text: pct(Math.pow(av, 2) * 100, 4) }] },
        { cells: [{ text: '2PC SP + Rio + Recife' }, { text: fmt(l3, 0) + ' ms', cls: 'cb-bad' }, { text: fmt(1000 / l3, 1) + '/s', cls: 'cb-bad' }, { text: pct(Math.pow(av, 3) * 100, 4) }] }
      ]));
      out.appendChild(verdict(l3 > 100, '2PC adds up.', 'There are two rounds (prepare and commit), each waits for the slowest participant: 2 × ' + fmt(Math.max(a, b), 0) + ' + 2 × 2 = ' + fmt(l3, 0) +
        ' ms with Recife. The hot row lock is held that whole time, and any participant being down aborts (availability ' + fmt(av * 100, 2) + '%^k).'));
      out.appendChild(note('A model of network rounds, not a measurement: no 2PC was run on PostgreSQL. Local commit of 2 ms. Async loss = rate × lag (module 17).'));
    }
    function pick(i) { press(cB, i); rS.set(PRE[i].r); lS.set(PRE[i].l); render(); }
    root.appendChild(chipRow('Cell', PRE.map(function (p) { return p.n; }), cB, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rS.wrap, lS.wrap, aS.wrap, bS.wrap, vS.wrap]));
    [rS, lS, aS, bS, vS].forEach(function (x) { x.input.addEventListener('input', function () { if (x === rS || x === lS) press(cB, -1); render(); }); });
    root.appendChild(out);
    pick(0);
  }

  /* ================= 7. shuffle ================= */
  var SH = [
    { id: 'mkt-01', cells: [8, 9] }, { id: 'lena-77', cells: [6, 8] }, { id: 'bia-31', cells: [4, 6] },
    { id: 'caio-58', cells: [1, 4] }, { id: 'davi-12', cells: [1, 9] }
  ];
  function pctP(v, four) {
    var p = v * 100;
    if (p === 0) return '0%';
    return (four && p >= 0.1 ? sig(p, 4) : sig(p, 3)) + '%';
  }
  function wShuffle(root) {
    var nS = slider('Cells (N)', 4, 50, 1, 20, '', function (v) { return fmt(v, 0); });
    var kS = slider('Cells per customer (k)', 1, 5, 1, 2, '', function (v) { return fmt(v, 0); });
    var fS = slider('Cells down (f)', 1, 8, 1, 2, '', function (v) { return fmt(v, 0); });
    var down = { 8: true, 9: true };
    var chips = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Cells down (N = 10)' });
    var cBtns = [];
    for (var c = 1; c <= 10; c++) (function (c) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': down[c] ? 'true' : 'false', text: 'c' + c });
      b.addEventListener('click', function () { if (down[c]) delete down[c]; else down[c] = true; b.setAttribute('aria-pressed', down[c] ? 'true' : 'false'); render(); });
      cBtns.push(b); chips.appendChild(b);
    })(c);
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function render() {
      var N = +nS.input.value, k = +kS.input.value, f = +fS.input.value;
      var apx = Math.pow(f / N, k), ex = comb(f, k) / comb(N, k), pairs = comb(N, k);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Article (f/N)^k', pctP(apx, true)),
        fact('Exact C(f,k) ÷ C(N,k)', pctP(ex, false), false),
        fact('Sets C(N,k)', fmt(pairs, 0))
      ]));
      var erro = N === 20 && k === 5 && f === 5;
      out.appendChild(verdict(erro, erro ? 'The article got it wrong here.' : 'Approximate × exact.',
        erro ? 'The 3rd row of the article\'s table prints 0.009%; (5 ÷ 20)^5 gives 0.0977% and the exact math, 0.00645%.'
          : f < k ? 'With f < k no customer has all its cells down: the exact value is 0.'
          : 'The article\'s formula draws with replacement and overestimates: ' + pctP(apx, true) + ' against ' + pctP(ex, false) + ' exact' + (f === k ? ' (1 ÷ ' + fmt(pairs, 0) + ')' : '') + '.'));
      if (N === 4) out.appendChild(note('With 4 cells shuffle barely helps: 6 pairs, 16.7% (f = k = 2).'));
      out.appendChild(sub('The five customers (N = 10, k = 2, rendezvous draw with murmur3)'));
      var rows = SH.map(function (cl) {
        var lost = cl.cells.filter(function (x) { return down[x]; }).length;
        var txt = lost === 0 ? 'does not even notice' : lost === cl.cells.length ? 'no service' : 'loses 1, keeps the other';
        return { cls: lost === cl.cells.length ? 'cb-cur' : '', cells: [{ text: cl.id }, { text: '{' + cl.cells.join(', ') + '}' }, { text: txt, cls: lost === cl.cells.length ? 'cb-bad' : '' }] };
      });
      out.appendChild(table(['Customer', 'Cells', 'With the ones down'], rows));
      var nd = Object.keys(down).length;
      out.appendChild(note(nd ? nd + ' cell' + (nd > 1 ? 's' : '') + ' down: the ' + (10 - nd) + ' survivors take on +' + fmt(nd / (10 - nd) * 100, 1) + '% each. Only whoever has exactly the pair that went down (1 in 45, 2.2%) is left without service.' : 'Mark the cells that are down (the mkt-01 poison takes down 8 and 9).'));
    }
    function sync() { fS.setMax(Math.max(1, +kS.input.value + 3)); if (+fS.input.value > +fS.input.max) fS.set(fS.input.max); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap, kS.wrap, fS.wrap]));
    nS.input.addEventListener('input', render); fS.input.addEventListener('input', render); kS.input.addEventListener('input', sync);
    root.appendChild(chips);
    root.appendChild(out);
    sync();
  }

  /* ================= 8. folga ================= */
  function wFolga(root) {
    var nS = slider('Cells (N)', 2, 20, 1, 4, '', function (v) { return fmt(v, 0); });
    var rS = slider('ρ alvo', 50, 90, 5, 70, '%', function (v) { return fmt(v, 0); });
    var fS = slider('Cells that fail', 1, 5, 1, 1, '', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'cb-out', 'aria-live': 'polite' });
    function render() {
      var N = +nS.input.value, rho = +rS.input.value, f = Math.min(+fS.input.value, N - 1);
      var add = f / (N - f) * 100, maxN = rho * (N - f) / N;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Increase per survivor', '+' + fmt(add, 1) + '%', add > 50),
        fact('Maximum normal occupancy', fmt(maxN, 1) + '%'),
        fact('Survivors', fmt(N - f, 0) + ' of ' + N)
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('normal', maxN, 100, fmt(maxN, 1) + '%', 'win'),
        bar('after', rho, 100, fmt(rho, 0) + '%', 'cap')
      ]));
      var rows = [2, 3, 4, 10, 20].map(function (n) {
        return { cls: n === N ? 'cb-cur' : '', cells: [{ text: 'N = ' + n }, { text: '+' + fmt(100 / (n - 1), 1) + '%' }, { text: fmt(rho * (n - 1) / n, 1) + '%' }] };
      });
      out.appendChild(table(['One cell goes down', 'Increase (1 ÷ (N − 1))', 'Maximum normal occupancy'], rows));
      out.appendChild(sub('The store\'s unequal case'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('celula-sp (33%) goes down; only the passive in Rio takes it over', 'Rio 15% → 48%', true),
        fact('Rio orders/s', '4.5 → 14.4 (3.2×)', true),
        fact('If they were equal (N = 4)', '+33.3%')
      ]));
      out.appendChild(verdict(N <= 3, N <= 3 ? 'Little headroom.' : 'Headroom is a function of N.',
        'With ' + N + ' equal cells and a target ρ of ' + rho + '%, the normal occupancy has to stay at ' + fmt(maxN, 1) + '% so that, after ' + f + ' outage' + (f > 1 ? 's' : '') + ', the survivors do not go past ' + rho + '%.'));
      out.appendChild(note('Increase per survivor = f ÷ (N − f); with one outage, 1 ÷ (N − 1). Maximum normal occupancy = ρ × (N − f) ÷ N.'));
    }
    function sync() { fS.setMax(Math.max(1, Math.min(5, +nS.input.value - 1))); if (+fS.input.value > +fS.input.max) fS.set(fS.input.max); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nS.wrap, rS.wrap, fS.wrap]));
    nS.input.addEventListener('input', sync); rS.input.addEventListener('input', render); fS.input.addEventListener('input', render);
    root.appendChild(out);
    sync();
  }

  var REG = { veneno: wVeneno, raio: wRaio, piso: wPiso, estoque: wEstoque, roteador: wRoteador, replicacao: wReplicacao, shuffle: wShuffle, folga: wFolga };
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
