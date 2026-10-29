/* SDLabs · CQRS: widgets in plain JS (English version)
   (report × materialized view, read model delay, "does Lena see 1056?", read model document,
   composition × read model, dual write and outbox WAL cost).
   They use the brief's numbers: ~235 ms report over 300 thousand orders, 0.021 ms view, 401 ms REFRESH and 340 ms CONCURRENTLY,
   projector at 100 events/s per instance, Lena's 1,787 B document, WAL of 359.6 / 1,232.7 / 2,735.8 B per order. */
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
  function fmtMs(ms) {
    if (ms >= 60000) return fmt(ms / 60000, 1) + ' min';
    if (ms >= 1000) return fmt(ms / 1000, 1) + ' s';
    if (ms >= 10) return fmt(ms, 0) + ' ms';
    return fmt(ms, 3) + ' ms';
  }
  function fmtBytes(b) {
    if (b >= 1e9) return fmt(b / 1e9, 2) + ' GB';
    if (b >= 1e6) return fmt(b / 1e6, 1) + ' MB';
    if (b >= 1e3) return fmt(b / 1e3, 1) + ' KB';
    return fmt(b, 1) + ' B';
  }

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
    var id = 'cq-sl-' + (++uid);
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cq-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }

  /* =============== LESSON 3: report × materialized view =============== */
  function wRelatorio(root) {
    var ROWS = [10000, 100000, 300000, 1000000, 5000000, 10000000, 50000000];
    var BASE = 300000, REL = 235, VIEW = 0.021, REF = 401, CON = 340;
    var btns = [], S = { concorrente: false };
    var rows = slider('Rows in pedidos', 0, ROWS.length - 1, 1, 2, '', function (i) { return fmt(ROWS[i], 0); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    function render() {
      var n = ROWS[+rows.input.value], k = n / BASE;
      var rel = REL * k, ref = REF * k, con = CON * k;
      var espera = S.concorrente ? 12 : ref;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Report (scans everything)', fmtMs(rel)),
        fact('Read the view (5 rows)', fmtMs(VIEW)),
        fact('Ratio', '~' + fmt(rel / VIEW, 0) + '×'),
        fact(S.concorrente ? 'REFRESH CONCURRENTLY' : 'Plain REFRESH', fmtMs(S.concorrente ? con : ref)),
        fact('Reader waiting', S.concorrente ? '~12 ms' : 'up to ' + fmtMs(espera))
      ]));
      out.appendChild(verdict(!S.concorrente,
        S.concorrente ? 'The reader keeps reading the old version.' : 'The reader stays stuck until the REFRESH ends.',
        S.concorrente
          ? 'CONCURRENTLY builds the new version alongside and swaps it at the end (it requires a unique index). In the test at 300 thousand rows the reader waited 12 ms; the whole REFRESH takes ' + fmtMs(con) + ' at this size.'
          : 'The plain REFRESH locks the view. At this size it takes ' + fmtMs(ref) + ', and the SELECT that arrived at the start waits almost all of that.'));
      out.appendChild(note(n === BASE
        ? 'Measured at 300 thousand rows (PostgreSQL 14): report 238.8 · 240.7 · 227.6 ms (~235 ms); view 0.021 ms; REFRESH 401 ms; CONCURRENTLY 340 ms. In the blocking test the transaction stayed open for 3 s and the reader waited 2,285 ms (plain) against 12 ms (concurrent).'
        : 'Linear estimate from the 300 thousand measured (PostgreSQL was not run at this size). The view stays at 0.021 ms because it reads the same 5 rows.'));
      out.appendChild(note('Reminder: the view only knows what it knew at the last REFRESH. With a REFRESH at 23:00, the 20:12 order gets in 2 h 48 min later.'));
    }
    function pick(i) { S.concorrente = i === 1; press(btns, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rows.wrap]));
    root.appendChild(chipRow('REFRESH type', ['Plain REFRESH', 'REFRESH CONCURRENTLY'], btns, pick));
    rows.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 5: read model delay =============== */
  function wAtraso(root) {
    var btns = [];
    var taxa = slider('Orders per second', 1, 60, 1, 30, 'orders/s');
    var evs = slider('Events per order', 1, 8, 1, 4, 'events');
    var ms = slider('Time per event in the projector', 1, 50, 1, 10, 'ms');
    var inst = slider('Projector instances (= partitions)', 1, 6, 1, 1, '');
    var parada = slider('One instance down for', 0, 30, 1, 0, 'min');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'Black Friday, 1 instance', i: 1, p: 0 },
      { t: '3 instances', i: 3, p: 0 },
      { t: '3 instances, one down 10 min', i: 3, p: 10 }
    ];
    function sec(s) { return s >= 600 ? fmt(s / 60, 1) + ' min' : fmt(s, 0) + ' s'; }
    function mmss(s) { var m = Math.floor(s / 60), r = Math.round(s - m * 60); return m > 0 ? m + ' min ' + (r ? r + ' s' : '') : r + ' s'; }
    function render() {
      var p = +taxa.input.value, e = +evs.input.value, t = +ms.input.value, n = +inst.input.value, T = +parada.input.value;
      var entra = p * e, porInst = 1000 / t, cap = n * porInst, uso = entra / cap;
      var deficit = Math.max(0, entra - cap), acc10 = deficit * 600, atraso10 = acc10 / cap;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Incoming events', fmt(entra, 0) + '/s'),
        fact('Capacity (' + n + ' × ' + fmt(porInst, 0) + ')', fmt(cap, 0) + '/s'),
        fact('Usage', fmt(uso * 100, 0) + '%'),
        fact('Delay in 10 min', deficit > 0 ? fmt(acc10, 0) + ' events = ' + sec(atraso10) : 'none')
      ]));
      out.appendChild(verdict(deficit > 0,
        deficit > 0 ? 'The math does not work.' : 'The math works.',
        deficit > 0
          ? fmt(entra, 0) + '/s come in and the projector consumes ' + fmt(cap, 0) + '/s: ' + fmt(deficit, 0) + '/s short, and the delay keeps growing (' + sec(atraso10) + ' in 10 min).'
          : 'The projector consumes ' + fmt(cap, 0) + '/s and ' + fmt(entra, 0) + '/s come in: it uses ' + fmt(uso * 100, 0) + '% and the delay does not build up.'));
      if (T > 0) {
        var share = entra / n, acc = share * T * 60, drain = porInst - share;
        if (drain <= 0) {
          out.appendChild(verdict(true, 'The stopped instance never recovers.',
            'Its partition receives ' + fmt(share, 0) + '/s and one instance only consumes ' + fmt(porInst, 0) + '/s: after ' + T + ' min, the accumulated delay is ' + fmt(acc, 0) + ' events and it does not drain.'));
        } else {
          out.appendChild(verdict(true, 'One instance down for ' + T + ' min.',
            'It accumulates ' + fmt(share, 0) + ' × ' + (T * 60) + ' = ' + fmt(acc, 0) + ' events. When it returns, it drains at ' + fmt(porInst, 0) + ' − ' + fmt(share, 0) + ' = ' + fmt(drain, 0) + '/s, in ' + fmt(acc / drain, 0) + ' s (' + mmss(acc / drain) + '). Only the customers of that partition see the delayed screen.'));
        }
      }
      out.appendChild(note('Each order generates 4 events in the store (PedidoCriado, PedidoPago and two EstoqueReservado). It assumes equal partitions, one per instance. It is an example calculation, not a measurement.'));
    }
    function preset(i) { inst.set(PRESETS[i].i); parada.set(PRESETS[i].p); press(btns, i); render(); }
    root.appendChild(chipRow('Scenarios from the text', PRESETS.map(function (x) { return x.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, evs.wrap, ms.wrap, inst.wrap, parada.wrap]));
    [taxa, evs, ms, inst, parada].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== LESSON 5: does Lena see 1056? =============== */
  function wLena(root) {
    var btns = [], S = { est: 0 };
    var atraso = slider('Projector delay (commit to the read model)', 0, 3000, 2, 74, 'ms');
    var abre = slider('Lena opens "my orders" after the commit', 0, 3000, 10, 50, 'ms');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var EST = ['Nothing', 'The response carries the order', 'Version token', 'Processing'];
    function render() {
      var a = +atraso.input.value, o = +abre.input.value, falta = a - o;
      var fatos, v;
      clear(out);
      if (S.est === 0) {
        var ve = falta <= 0;
        fatos = [fact('Order on screen', ve ? 'yes' : 'no'), fact('Wait', '0 ms'), fact('Cost', 'none')];
        v = verdict(!ve, ve ? 'It shows up.' : 'It does not show up.',
          ve ? 'The read model already knew about 1056 when she opened the screen.'
            : 'She opened ' + fmt(falta, 0) + ' ms before the model knew about 1056. She sees the list without the new order, like 1055 in module 17, and thinks the purchase was lost.');
      } else if (S.est === 1) {
        fatos = [fact('Order on screen', 'yes'), fact('Wait', '0 ms'), fact('Cost', 'state in the app')];
        v = verdict(false, 'Shows up right away.',
          'The 201 from CriarPedido brought the 1056 document and the app put it at the top of the list. The cost is the app keeping that order and merging it with the model\'s response; it only holds for the device that made the purchase (on another device, what the model knows applies).');
      } else if (S.est === 2) {
        var espera = Math.max(0, falta);
        if (espera === 0) {
          fatos = [fact('Order on screen', 'yes'), fact('Wait', '0 ms'), fact('Cost', 'none')];
          v = verdict(false, 'It shows up.', 'GET /meus-pedidos?min_versao=8 already found version 8: it answers right away.');
        } else if (espera <= 1000) {
          fatos = [fact('Order on screen', 'yes'), fact('Wait', fmt(espera, 0) + ' ms'), fact('Cost', 'screen waits')];
          v = verdict(false, 'Shows up after waiting.',
            'meus-pedidos holds the response for ' + fmt(espera, 0) + ' ms until the projector reaches version 8 (1 s limit). Lena sees the order, with the screen a moment slower.');
        } else {
          fatos = [fact('Order on screen', 'yes'), fact('Wait', '1,000 ms'), fact('Cost', 'reads the command side')];
          v = verdict(true, 'Shows up, but through the write side.',
            'The projector would take ' + fmt(falta, 0) + ' ms and the limit is 1 s: meus-pedidos gives up and reads from the command side. Lena sees the order, and the write side gets a read that CQRS wanted to avoid.');
        }
      } else {
        var pronto = falta <= 0;
        fatos = [fact('Order on screen', pronto ? 'complete' : '"processing"'), fact('Wait', '0 ms'), fact('Cost', 'incomplete info')];
        v = verdict(false, pronto ? 'Shows up complete.' : 'Shows up as "processing".',
          pronto ? 'The model already had 1056, with items and total.'
            : 'The screen shows 1056 as "processing" for another ' + fmt(falta, 0) + ' ms, with no items, payment or tracking. It does not lie and does not ask anyone; it just shows less.');
      }
      out.appendChild(el('div', { class: 'sr-facts' }, fatos));
      out.appendChild(v);
      out.appendChild(note('Strategy: ' + EST[S.est] + '. On a normal day the delay is ~74 ms and Lena opens the screen 50 ms after the commit: 24 ms too early.'));
    }
    function pick(i) { S.est = i; press(btns, i); render(); }
    root.appendChild(chipRow('Strategy', EST, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [atraso.wrap, abre.wrap]));
    [atraso, abre].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 6: read model document =============== */
  var DOC8 = '{"cliente_id":"lena-77","versao":8,"pedidos":[' +
    '{"pedido_id":1056,"criado_em":"2026-11-27T20:12:00-03:00","status":"criado","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990},{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":11480,"pagamento":null,"rastreio":null},' +
    '{"pedido_id":1055,"criado_em":"2026-11-27T20:10:00-03:00","status":"pago","itens":[{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":3490,"pagamento":"cartao_credito","rastreio":null},' +
    '{"pedido_id":1054,"criado_em":"2026-11-27T20:08:00-03:00","status":"pago","itens":[{"nome":"camiseta preta","qtd":1,"preco_centavos":4900}],"total_centavos":6400,"pagamento":"cartao_credito","rastreio":null},' +
    '{"pedido_id":1051,"criado_em":"2026-11-20T14:19:00-03:00","status":"enviado","itens":[{"nome":"caneca azul","qtd":2,"preco_centavos":1990}],"total_centavos":5480,"pagamento":"pix","rastreio":"LA123456788BR"},' +
    '{"pedido_id":1048,"criado_em":"2026-11-05T10:15:00-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":9490,"pagamento":"cartao_credito","rastreio":"LA123456787BR"},' +
    '{"pedido_id":1047,"criado_em":"2026-06-18T14:02:10-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":9490,"pagamento":"boleto","rastreio":"LA123456786BR"},' +
    '{"pedido_id":1044,"criado_em":"2026-04-18T14:20:00-03:00","status":"entregue","itens":[{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":3490,"pagamento":"pix","rastreio":"LA123456785BR"},' +
    '{"pedido_id":1042,"criado_em":"2026-03-02T11:05:00-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":8990,"pagamento":"pix","rastreio":"LA123456784BR"}]}';
  function nbytes(s) { return new TextEncoder().encode(s).length; }

  function wDocumento(root) {
    var btns = [], S = { real: true };
    var np = slider('Orders in the document', 1, 10, 1, 8, 'orders');
    var ni = slider('Items per order', 1, 3, 1, 2, 'items');
    var cli = slider('Customers', 0.1, 5, 0.1, 1.5, 'million', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var ITENS = [
      { nome: 'gato de pelúcia', qtd: 1, preco_centavos: 7990 },
      { nome: 'caneca azul', qtd: 1, preco_centavos: 1990 },
      { nome: 'camiseta preta', qtd: 1, preco_centavos: 4900 }
    ];
    function build(N, k) {
      var itens = ITENS.slice(0, k), tot = 1500;
      itens.forEach(function (i) { tot += i.qtd * i.preco_centavos; });
      var peds = [], i;
      for (i = 0; i < N; i++) {
        peds.push({ pedido_id: 1056 - i, criado_em: '2026-11-27T20:12:00-03:00', status: 'criado', itens: itens, total_centavos: tot, pagamento: null, rastreio: null });
      }
      return { json: JSON.stringify({ cliente_id: 'lena-77', versao: N, pedidos: peds }), um: nbytes(JSON.stringify(peds[0])), N: N };
    }
    function render() {
      var d, N, um;
      if (S.real) { d = { json: DOC8 }; N = 8; um = nbytes(JSON.stringify(JSON.parse(DOC8).pedidos[0])); }
      else { d = build(+np.input.value, +ni.input.value); N = d.N; um = d.um; }
      var total = nbytes(d.json), media = total / N;
      var guardados = S.real ? 10 : N;
      var gb = (+cli.input.value) * 1e6 * guardados * media;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Document of lena-77', fmt(total, 0) + ' B'),
        fact('Average per order', fmt(media, 0) + ' B'),
        fact('Order 1056 alone', fmt(um, 0) + ' B'),
        fact(fmt(+cli.input.value, 1) + ' M customers × ' + guardados + ' orders', fmtBytes(gb))
      ]));
      out.appendChild(el('pre', { class: 'cq-json' }, [el('code', { text: d.json })]));
      out.appendChild(note(S.real
        ? 'The 8 real orders from the story: 1,787 B in total, 223 B per order on average. 1056 comes first (the newest) and has null payment and tracking. Orders 1042 to 1055 have the items and totals from the story; dates, payment method and tracking codes are examples.'
        : 'Document built by repeating the 1056 shape (status criado, null payment and tracking): it is only a size calculation, orders 1055 and earlier in the story have other data.'));
      out.appendChild(note('The storage calculation assumes 10 orders per customer (the document ceiling): 1.5 million × 10 × 223 B = 3.35 GB. Against that, the 50-million-row pedidos table has 100 GB + 40% indexes.'));
    }
    function pick(i) { S.real = i === 0; press(btns, i); np.input.disabled = S.real; ni.input.disabled = S.real; render(); }
    root.appendChild(chipRow('Document', ["Lena's 8 (real)", 'Build'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [np.wrap, ni.wrap, cli.wrap]));
    [np, ni, cli].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 7: composition × read model =============== */
  function wComposicao(root) {
    var btns = [], S = { caiu: false };
    var n = slider('Services the screen calls', 1, 8, 1, 4, '');
    var av = slider('Availability of each one', 99, 99.99, 0.01, 99.9, '%', function (v) { return fmt(v, 2); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var MES = 43200;
    function render() {
      var N = +n.input.value, a = +av.input.value / 100;
      var serie = Math.pow(a, N), minS = (1 - serie) * MES, minM = (1 - a) * MES;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Composition (in series)', fmt(serie * 100, 4) + '%'),
        fact('Offline per month (composition)', fmt(minS, 1) + ' min'),
        fact('Read model (1 place)', fmt(a * 100, 2) + '%'),
        fact('Offline per month (model)', fmt(minM, 1) + ' min')
      ]));
      out.appendChild(table(['Screen', 'All up', 'One source down (pagamentos)'], [
        { cells: [{ text: 'Composed in the bff-app' }, { text: fmt(serie * 100, 4) + '% available' }, { text: 'fails, or "status unavailable"', cls: 'cq-bad' }] },
        { cells: [{ text: 'Read model' }, { text: fmt(a * 100, 2) + '% available' }, { text: 'keeps working, with the last status' }] }
      ], S.caiu ? 'cq-down' : ''));
      out.appendChild(verdict(S.caiu,
        S.caiu ? 'pagamentos is down.' : 'All sources up.',
        S.caiu
          ? 'The composed screen depends on all ' + N + ' services at the same time and fails. The read model one keeps working and shows the last status the projector knows: the data goes stale, and the screen stays up.'
          : 'With ' + N + ' services at ' + fmt(a * 100, 2) + '% the composition is at ' + fmt(serie * 100, 4) + '%, ' + fmt(minS, 1) + ' min/month offline; the read model, ' + fmt(minM, 1) + ' min/month (30-day month).'));
      out.appendChild(note('The read model pays in multiplied eventual consistency: three topics, one projector and one storage, each source with its own delay. The store\'s default is 4 services at 99.9%: 99.6006% and 172.5 min against 43.2 min.'));
    }
    function pick(i) { S.caiu = i === 1; press(btns, i); render(); }
    root.appendChild(chipRow('State of the sources', ['All up', 'Take pagamentos down'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, av.wrap]));
    [n, av].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 8: dual write =============== */
  function wDualWrite(root) {
    var falha = slider('Failure of the second write (broker or COMMIT)', 0, 5, 0.05, 0.1, '%', function (v) { return fmt(v, 2); });
    var taxa = slider('Orders per second', 1, 60, 1, 30, 'orders/s');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    function render() {
      var p = +falha.input.value / 100, r = +taxa.input.value, h = r * 3600, bad = h * p;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Orders per hour', fmt(h, 0)),
        fact('Failures per hour', fmt(bad, 0)),
        fact('Per day', fmt(bad * 24, 0))
      ]));
      out.appendChild(table(['Order of the two writes', 'Orders without an event /h', 'Ghosts /h', 'What happens'], [
        { cls: bad > 0 ? 'cq-badrow' : '', cells: [{ text: 'commit, then publish' }, { text: fmt(bad, 0), cls: bad > 0 ? 'cq-bad' : '' }, { text: '0' }, { text: 'the order exists and never reaches the screen' }] },
        { cls: bad > 0 ? 'cq-badrow' : '', cells: [{ text: 'publish, then commit' }, { text: '0' }, { text: fmt(bad, 0), cls: bad > 0 ? 'cq-bad' : '' }, { text: 'the screen shows an order that does not exist' }] },
        { cells: [{ text: 'outbox (lesson 10)' }, { text: '0' }, { text: '0' }, { text: 'the event waits in the table; it can go out twice' }] }
      ], 'cq-wide'));
      out.appendChild(verdict(bad > 0,
        bad > 0 ? fmt(bad, 0) + ' per hour, without anyone noticing.' : 'With no failure, the dual write "works".',
        bad > 0
          ? 'At ' + fmt(p * 100, 2) + '% and ' + fmt(r, 0) + ' orders/s, that is ' + fmt(r, 0) + ' × 3,600 × ' + fmt(p, 4) + ' = ' + fmt(bad, 0) + ' orders per hour with one of the two writes lost. The brief uses 0.1% and 30/s: 108 per hour.'
          : 'With a zero rate nothing is lost, but one broker hiccup or a refused COMMIT is enough for the read model to diverge, and nobody replaces what was missing.'));
      out.appendChild(note('Example rate (0.1%): the real failure rate depends on the broker and the network. The outbox zeroes orders without an event and ghosts, and trades that for at-least-once delivery and more WAL (lesson 10).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [falha.wrap, taxa.wrap]));
    [falha, taxa].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 10: outbox cost in WAL =============== */
  function wOutbox(root) {
    var btns = [], S = { pol: 1 };
    var taxa = slider('Orders per second', 1, 60, 1, 30, 'orders/s');
    var evs = slider('Events per order in the outbox', 1, 4, 1, 2, 'events');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var BASE = 359.6, INS = (1232.7 - 359.6) / 2, UPD = 1503.1 / 2, DEL = 684.1 / 2;
    var POL = ['No outbox', 'Relay marks (UPDATE)', 'Relay deletes (DELETE)'];
    function wal(pol, e) { return pol === 0 ? BASE : BASE + e * INS + e * (pol === 1 ? UPD : DEL); }
    function render() {
      var r = +taxa.input.value, e = +evs.input.value, w = wal(S.pol, e);
      var bps = w * r, mbh = bps * 3600 / 1e6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('WAL per order', fmt(w, 1) + ' B'),
        fact('Factor over no outbox', fmt(w / BASE, 1) + '×'),
        fact('WAL rate', fmt(bps / 1000, 1) + ' KB/s'),
        fact('Per hour', fmt(mbh, 1) + ' MB'),
        fact('Per day', fmt(mbh * 24 / 1000, 1) + ' GB')
      ]));
      var rows = [0, 1, 2].map(function (p) {
        var ww = wal(p, e);
        return { cls: p === S.pol ? 'cq-cur' : '', cells: [{ text: POL[p] }, { text: fmt(ww, 1) + ' B' }, { text: fmt(ww / BASE, 1) + '×' }, { text: fmt(ww * r * 3600 / 1e6, 1) + ' MB/h' }] };
      });
      out.appendChild(table(['Policy', 'WAL per order', 'Factor', 'MB per hour'], rows, 'cq-wide'));
      out.appendChild(note(e === 2
        ? 'Measured (PostgreSQL 14, 20,000 orders, each with an INSERT and an UPDATE of the status, PedidoCriado of 326 B in jsonb and PedidoPago of 63 B): 359.6 B without outbox, 1,232.7 B with 2 INSERTs, 2,735.8 B with the relay\'s UPDATE and 1,916.8 B with DELETE.'
        : 'For 2 events the numbers are measured. For ' + e + ' event' + (e > 1 ? 's' : '') + ' the widget scales linearly per event (estimate): +436.6 B on the INSERT, +751.6 B on the UPDATE and +342.1 B on the DELETE of each event.'));
      out.appendChild(note('The events table can be deleted from or partitioned by day; the one that grows without limit is the one nobody cleans.'));
    }
    function pick(i) { S.pol = i; press(btns, i); render(); }
    root.appendChild(chipRow('Outbox policy', POL, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, evs.wrap]));
    [taxa, evs].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(1);
  }

  var REG = { relatorio: wRelatorio, atraso: wAtraso, lena: wLena, documento: wDocumento, composicao: wComposicao, dualwrite: wDualWrite, outbox: wOutbox };
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
