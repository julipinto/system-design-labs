/* SDLabs · Microservices: plain JS widgets, English copy
   (vCPU calculator, hop adder, anemic or rich model, event sorting, queue replay).
   Story: the store (process `loja`, 8 vCPU, database `loja`) with 7 modules; Lena, Recife; order 1047, plush cat (product 42, GATO-042), 94.90. */
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
  var uid = 0;

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
  function slider(label, id, min, max, value) {
    var out = el('output', { for: id, 'aria-live': 'off' });
    var input = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: '1', value: String(value) });
    var box = el('div', { class: 'sr-ctl mx-ctl' }, [el('label', { for: id }, [label, out]), input]);
    return { box: box, input: input, out: out };
  }

  /* =============== LESSON: vCPU calculator on Black Friday =============== */
  var MONO_VCPU = 8;
  function calcVcpu(n) {
    var rows = [
      ['Catalog', n, 1],
      ['Cart', Math.ceil(n / 4), 1],
      ['Orders', Math.ceil(n / 4), 1],
      ['Payments', Math.ceil(n / 5), 1],
      ['Stock', Math.ceil(n / 5), 1],
      ['Shipping', 1, 1],
      ['Reports', 1, 4]
    ];
    var total = rows.reduce(function (s, r) { return s + r[1] * r[2]; }, 0);
    return { mono: MONO_VCPU * n, svc: total, rows: rows };
  }
  function wVcpu(root) {
    var S = { n: 10 };
    var sl = slider('Storefront (Catalog) traffic', 'mx-v-' + (++uid), 1, 20, S.n);
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function bar(name, v, max, win) {
      return el('div', { class: 'sr-bar' }, [
        el('span', { text: name }),
        el('div', { class: 'sr-track' }, [
          el('div', { class: 'sr-fill' + (win ? ' win' : ''), style: 'width:' + (v / max * 100) + '%' }),
          el('span', { class: 'sr-lbl', text: fmt(v) + ' vCPU' })
        ])
      ]);
    }
    function render() {
      var n = S.n, r = calcVcpu(n);
      sl.out.textContent = n + '×';
      var max = Math.max(r.mono, r.svc);
      clear(out);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Monolith', r.mono, max, r.mono > r.svc),
        bar('Services', r.svc, max, false)
      ]));
      var tb = el('tbody');
      r.rows.forEach(function (x) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: x[0] }), el('td', { text: x[1] + ' × ' + x[2] + ' vCPU' }), el('td', { text: fmt(x[1] * x[2]) })]));
      });
      tb.appendChild(el('tr', { class: 'mx-total' }, [el('th', { scope: 'row', text: 'Total' }), el('td', { text: '' }), el('td', { text: fmt(r.svc) })]));
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table mx-tbl' }, [
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'Service' }), el('th', { scope: 'col', text: 'Replicas × vCPU' }), el('th', { scope: 'col', text: 'vCPU' })])]),
        tb
      ])]));
      var diff = r.mono - r.svc, v;
      if (diff > 0) {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: fmt(diff) + ' fewer vCPU' }), ' with microservices: ' + fmt(r.svc) + ' against ' + fmt(r.mono) + '. Only Catalog had to grow; the monolith has to copy the whole program (' + n + ' × ' + MONO_VCPU + ').']);
      } else if (diff < 0) {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: (n === 1 ? 'On an ordinary day the monolith is cheaper' : 'Here the monolith is still cheaper') }), ': ' + fmt(r.mono) + ' against ' + fmt(r.svc) + '. Splitting into services has a fixed cost, and it only pays off when one module grows on its own.']);
      } else {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Tie' }), ': ' + fmt(r.mono) + ' vCPU in both.']);
      }
      out.appendChild(v);
    }
    sl.input.addEventListener('input', function () { S.n = Number(sl.input.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'How much the storefront grows' }));
    root.appendChild(sl.box);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Example numbers. Rule for the services: Cart and Orders grow 1 replica for every 4× of traffic, Payments and Stock 1 for every 5×; Shipping and Reports (4 vCPU) stay fixed.' }));
    render();
  }

  /* =============== LESSON: network hop adder =============== */
  var BASE_MS = 180, LIMIT_MS = 2000;
  function calcSaltos(saltos, ms) {
    var total = BASE_MS + saltos * ms;
    return { total: total, extra: total - BASE_MS, pctMono: (total - BASE_MS) / BASE_MS * 100, pctLimit: total / LIMIT_MS * 100 };
  }
  function wSaltos(root) {
    var MS = [1, 5, 20];
    var S = { n: 4, ms: 1 };
    var sl = slider('Network hops in the checkout', 'mx-s-' + (++uid), 0, 20, 4);
    var mB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      var n = S.n, ms = MS[S.ms], r = calcSaltos(n, ms);
      press(mB, S.ms);
      sl.out.textContent = String(n);
      sl.input.value = String(n);
      clear(out);
      var cls = r.pctLimit >= 100 ? ' mx-bad' : r.pctLimit >= 75 ? ' mx-warn' : '';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Checkout' }), el('b', { text: fmt(r.total) + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Over the monolith' }), el('b', { text: (r.extra ? '+' : '') + fmt(r.extra) + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Of the 2 s limit' }), el('b', { text: fmt(r.pctLimit) + '%' })])
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [el('div', { class: 'sr-bar' }, [
        el('span', { text: 'Limit 2 s' }),
        el('div', { class: 'sr-track' }, [
          el('div', { class: 'sr-fill' + cls, style: 'width:' + Math.min(100, r.pctLimit) + '%' }),
          el('span', { class: 'sr-lbl', text: fmt(r.total) + ' of ' + fmt(LIMIT_MS) + ' ms' })
        ])
      ])]));
      var msg;
      if (n === 0) msg = el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Monolith: local calls.' }), ' 180 ms of work, each function call costs about 0.01 ms and does not go over the network.']);
      else if (r.total > LIMIT_MS) msg = el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'Timeout exceeded.' }), ' ' + fmt(r.total) + ' ms is over the ' + fmt(LIMIT_MS) + ' ms limit: the checkout fails.']);
      else msg = el('p', { class: 'sr-verdict' }, [el('strong', { text: fmt(r.total) + ' ms' }), ': 180 ms of work + ' + n + (n === 1 ? ' hop × ' : ' hops × ') + ms + ' ms. That is ' + fmt(r.extra) + ' ms more than the monolith (+' + fmt(r.pctMono) + '%), ' + fmt(r.pctLimit) + '% of the limit.']);
      out.appendChild(msg);
    }
    sl.input.addEventListener('input', function () { S.n = Number(sl.input.value); render(); });
    var bLena = el('button', { type: 'button', class: 'btn', text: 'Lena\'s checkout (4 hops)' });
    var bMono = el('button', { type: 'button', class: 'btn', text: 'Monolith (0 hops)' });
    bLena.addEventListener('click', function () { S.n = 4; S.ms = 1; render(); });
    bMono.addEventListener('click', function () { S.n = 0; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. How many hops' }));
    root.appendChild(sl.box);
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Ms per hop' }));
    root.appendChild(chipRow('Ms per hop', ['1 ms', '5 ms', '20 ms (bad network)'], mB, function (i) { S.ms = i; render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bLena, bMono]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The math uses 180 ms of fixed work. The network also fails, and each hop may need a retry: that is not counted here.' }));
    render();
  }

  /* =============== LESSON: anemic or rich model =============== */
  function wAnemico(root) {
    var STATUSES = ['criado', 'pago', 'enviado'];
    var STAT_EN = { criado: 'created', pago: 'paid', enviado: 'shipped', cancelado: 'canceled' };
    var S = { st: 1, a: null, r: null };
    var sB = [];
    var grid = el('div', { class: 'ls-grid', 'aria-live': 'polite' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Back to the initial state' });
    function start() { var s = STATUSES[S.st]; S.a = { status: s, msg: null, cls: '', tried: false, was: s }; S.r = { status: s, msg: null, cls: '', tried: false, was: s }; }
    function cancelA() {
      var a = S.a;
      a.was = a.status; a.tried = true;
      a.status = 'cancelado';
      if (a.was === 'enviado') { a.msg = 'The order had already left (tracking LA123456789BR) and became canceled: the rule is nowhere.'; a.cls = 'bad'; }
      else if (a.was === 'cancelado') { a.msg = 'Accepted again: the field just takes the value.'; a.cls = ''; }
      else { a.msg = 'Accepted: status became canceled. Whoever wrote the outside code is the one who remembered (or forgot) to check.'; a.cls = 'ok'; }
      render();
    }
    function cancelR() {
      var r = S.r;
      r.tried = true;
      if (r.status === 'enviado') { r.msg = 'Refused: a shipped order cannot be canceled.'; r.cls = 'bad'; }
      else if (r.status === 'cancelado') { r.msg = 'Already canceled, nothing to do.'; r.cls = ''; }
      else {
        r.msg = 'Accepted: status became canceled.' + (r.status === 'pago' ? ' Refund of 94.90 in Payments via the PedidoCancelado event.' : '');
        r.cls = 'ok'; r.status = 'cancelado';
      }
      render();
    }
    function panel(title, code, m, onCancel) {
      var b = el('button', { type: 'button', class: 'btn primary', text: 'Cancel order 1047' });
      b.addEventListener('click', onCancel);
      return el('div', { class: 'ls-panel' }, [
        el('p', { class: 'ls-h', text: title }),
        el('pre', { class: 'ib-sql' }, [el('code', { text: code })]),
        b,
        el('p', { class: 'mx-status' }, ['Order status: ', el('strong', { text: STAT_EN[m.status] || m.status })]),
        el('p', { class: 'mx-res' + (m.cls ? ' ' + m.cls : ''), text: m.msg || 'You have not tried to cancel yet.' })
      ]);
    }
    function render() {
      press(sB, S.st);
      clear(grid);
      grid.appendChild(panel('Anemic model', 'pedido.status = "cancelado"', S.a, cancelA));
      grid.appendChild(panel('Rich model', 'pedido.cancelar()', S.r, cancelR));
    }
    bReset.addEventListener('click', function () { start(); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Status of order 1047 now' }));
    root.appendChild(chipRow('Status of order 1047', ['created', 'paid', 'shipped'], sB, function (i) { S.st = i; start(); render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReset]));
    root.appendChild(grid);
    root.appendChild(el('p', { class: 'sr-note', text: 'In the anemic one the order is just data, and the rule lives in whoever changes it. In the rich one, the rule lives in the order itself.' }));
    start(); render();
  }

  /* =============== LESSON: sort the events and find the owning context =============== */
  var EV = [
    { n: 'ProdutoVisto', ctx: 'Catalog', why: 'showing the plush cat is the storefront\'s job; nobody bought anything yet.' },
    { n: 'ItemAdicionadoAoCarrinho', ctx: 'Cart', why: 'what is in the bag before it becomes an order belongs to Cart.' },
    { n: 'PedidoCriado', ctx: 'Orders', why: 'turning the bag into order 1047 is the call of Orders.' },
    { n: 'PedidoPago', ctx: 'Payments', why: 'approving the 94.90 charge is up to whoever talks to the bank.' },
    { n: 'EstoqueReservado', ctx: 'Stock', why: 'only Stock knows whether GATO-042 has a unit to reserve.' },
    { n: 'PedidoEnviado', ctx: 'Shipping', why: 'dispatching the package is up to whoever handles transport.' },
    { n: 'PedidoEntregue', ctx: 'Shipping', why: 'confirming it reached Lena, in Recife, is the same conversation as the dispatch.' }
  ];
  var CTXS = ['Catalog', 'Cart', 'Orders', 'Payments', 'Stock', 'Shipping'];
  var SHUF = [3, 0, 6, 2, 4, 1, 5];
  function wEventos(root) {
    var S = { placed: [], owned: {}, say: '', cls: '', focus: null };
    var pool = el('div', { class: 'mx-pool' });
    var tl = el('ol', { class: 'ib-tl' });
    var say = el('p', { class: 'mx-say', 'aria-live': 'polite' });
    var sub = el('p', { class: 'sr-sub' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Start over' });
    var sum = el('div', { 'aria-live': 'polite' });

    function ordered() { return S.placed.length === EV.length; }
    function pick(i) {
      if (i === S.placed.length) {
        S.placed.push(i);
        S.say = EV[i].n + ' went onto the timeline.'; S.cls = 'ok';
      } else { S.say = 'Not that one yet: what has to happen before?'; S.cls = 'bad'; }
      S.focus = 'pool';
      render();
    }
    function own(i, c) {
      if (EV[i].ctx === CTXS[c]) { S.owned[i] = true; S.say = EV[i].n + ': ' + CTXS[c] + '.'; S.cls = 'ok'; S.focus = null; }
      else { S.say = 'The owner is whoever decides: ' + EV[i].why; S.cls = 'bad'; S.focus = 'c-' + i + '-' + c; }
      render();
    }
    function render() {
      var done = ordered();
      sub.textContent = done ? '2. Who owns each event?' : '1. Tap the events in the order they happened (' + S.placed.length + ' of ' + EV.length + ')';
      clear(pool);
      pool.hidden = done;
      SHUF.forEach(function (i) {
        if (S.placed.indexOf(i) >= 0) return;
        var b = el('button', { type: 'button', class: 'btn mx-ev', text: EV[i].n });
        b.addEventListener('click', function () { pick(i); });
        pool.appendChild(b);
      });
      clear(tl);
      S.placed.forEach(function (i, pos) {
        var item = el('li', { class: 'ib-step' + (S.owned[i] ? '' : (done ? ' now' : '')) }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: EV[i].n }), el('span', { class: 'ib-n', text: String(pos + 1) })])
        ]);
        if (S.owned[i]) item.appendChild(el('span', { class: 'ib-who t2 mx-seal', text: 'Owner: ' + EV[i].ctx }));
        else if (done) {
          var row = el('div', { class: 'sr-chips mx-ctxs', role: 'group', 'aria-label': 'Owning context of ' + EV[i].n });
          CTXS.forEach(function (c, j) {
            var b = el('button', { type: 'button', class: 'chip', 'data-f': 'c-' + i + '-' + j, text: c });
            b.addEventListener('click', function () { own(i, j); });
            row.appendChild(b);
          });
          item.appendChild(row);
        }
        tl.appendChild(item);
      });
      say.textContent = S.say || (done ? '' : 'Start with the first one: what did Lena do before anything else?');
      say.className = 'mx-say' + (S.cls ? ' ' + S.cls : '');
      clear(sum);
      if (done && EV.every(function (e, i) { return S.owned[i]; })) {
        sum.appendChild(el('p', { class: 'ib-verdict ok' }, [el('strong', { text: '7 events, 6 contexts; Shipping keeps two.' }), ' Each fact of order 1047 belongs to a single owner.']));
      }
      if (S.focus) {
        var t = S.focus === 'pool' ? pool.querySelector('button') : root.querySelector('[data-f="' + S.focus + '"]');
        if (t) t.focus();
        S.focus = null;
      }
    }
    bReset.addEventListener('click', function () { S.placed = []; S.owned = {}; S.say = ''; S.cls = ''; render(); });

    root.appendChild(sub);
    root.appendChild(pool);
    root.appendChild(say);
    root.appendChild(tl);
    root.appendChild(sum);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReset]));
    render();
  }

  /* =============== LESSON: queue replay with a duplicate event =============== */
  var QUEUE = [
    { id: 'e-501', type: 'PedidoCriado' },
    { id: 'e-502', type: 'PedidoPago', pay: '{ pedido_id: 1047, valor: 94.90 }' },
    { id: 'e-502', type: 'PedidoPago', pay: '{ pedido_id: 1047, valor: 94.90 }', dup: true },
    { id: 'e-504', type: 'PedidoEnviado' }
  ];
  function wFila(root) {
    var S = { pos: 0, idem: false, stock: 3, seen: [], res: [] };
    var list = el('ol', { class: 'ib-tl' });
    var facts = el('div', { class: 'sr-facts' });
    var out = el('div', { 'aria-live': 'polite' });
    var id = 'mx-i-' + (++uid);
    var box = el('input', { type: 'checkbox', id: id });
    var sw = el('label', { class: 'mx-switch', for: id }, [box, el('span', { text: 'Stock keeps the evento_id values already processed (idempotency)' })]);
    var bNext = el('button', { type: 'button', class: 'btn primary', text: 'Process the next event' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Start over' });

    function reset() { S.pos = 0; S.stock = 3; S.seen = []; S.res = []; render(); }
    function next() {
      if (S.pos >= QUEUE.length) return;
      var e = QUEUE[S.pos], r;
      if (e.type !== 'PedidoPago') r = { t: 'Ignored: ' + e.type + ' is not for stock.', c: '' };
      else if (S.idem && S.seen.indexOf(e.id) >= 0) r = { t: e.id + ' was already processed, ignored. Stock stays at ' + S.stock + '.', c: 'ok' };
      else {
        var from = S.stock; S.stock--;
        if (S.idem) S.seen.push(e.id);
        r = e.dup
          ? { t: 'Reserves again: GATO-042 stock ' + from + ' → ' + S.stock + '. Wrong: the cat sold once left the stock twice.', c: 'bad' }
          : { t: 'Reserves GATO-042: stock ' + from + ' → ' + S.stock + '.', c: 'ok' };
      }
      S.res.push(r); S.pos++;
      render();
    }
    function render() {
      var done = S.pos >= QUEUE.length;
      box.checked = S.idem;
      bNext.disabled = done;
      clear(list);
      QUEUE.forEach(function (e, i) {
        var r = S.res[i];
        var item = el('li', { class: 'ib-step' + (r && r.c === 'bad' ? ' flag' : (i === S.pos ? ' now' : '')) }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: e.id + ' ' + e.type }), el('span', { class: 'ib-n', text: (e.dup ? 'duplicate' : (r ? 'processed' : (i === S.pos ? 'next' : 'queued'))) })])
        ]);
        if (e.pay) item.appendChild(el('p', { class: 'ib-db', text: e.pay }));
        if (r) item.appendChild(el('p', { class: 'ib-out', text: r.t }));
        list.appendChild(item);
      });
      clear(facts);
      facts.appendChild(el('div', { class: 'sr-fact' }, [el('small', { text: 'GATO-042 stock' }), el('b', { text: String(S.stock) })]));
      facts.appendChild(el('div', { class: 'sr-fact' }, [el('small', { text: 'evento_id values seen' }), el('b', { text: S.idem ? '{ ' + S.seen.join(', ') + (S.seen.length ? ' ' : '') + '}' : 'not kept' })]));
      clear(out);
      if (done) {
        out.appendChild(S.stock === 2
          ? el('p', { class: 'ib-verdict ok' }, [el('strong', { text: 'Stock 2 (right).' }), ' One sale, one deduction: the duplicate was recognized by its evento_id.'])
          : el('p', { class: 'ib-verdict bad' }, [el('strong', { text: 'Stock 1 (wrong) against 2 (right).' }), ' The network delivered PedidoPago twice and stock was deducted twice. Turn the switch on and run it again.']));
      }
    }
    box.addEventListener('change', function () { S.idem = box.checked; reset(); });
    bNext.addEventListener('click', next);
    bReset.addEventListener('click', reset);

    root.appendChild(el('p', { class: 'sr-sub', text: 'Queue of the stock service' }));
    root.appendChild(sw);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bNext, bReset]));
    root.appendChild(list);
    root.appendChild(facts);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Flipping the switch restarts the queue. Delivery twice is normal in a queue with an "at least once" guarantee.' }));
    render();
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { calcVcpu: calcVcpu, calcSaltos: calcSaltos };

  var REG = { vcpu: wVcpu, saltos: wSaltos, anemico: wAnemico, eventos: wEventos, fila: wFila };
  function init() {
    var nodes = document.querySelectorAll('[data-widget]');
    Array.prototype.forEach.call(nodes, function (n) {
      var f = REG[n.getAttribute('data-widget')];
      if (!f || n.getAttribute('data-ready')) return;
      n.setAttribute('data-ready', '1');
      try { f(n); } catch (e) { if (window.console) console.error('widget', n.getAttribute('data-widget'), e); }
    });
  }
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
