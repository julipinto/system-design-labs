/* SDLabs · Event Sourcing: plain JS widgets (English copy of widgets.js)
   (storage, version conflict, rebuild a model, rehydrate 1047, cost of rehydrating with snapshot,
   order and version, idempotency).
   Numbers from the brief: ~263 B per event (263 MB for 1 million), 140 GB in the 50-million pedidos table, rehydrating
   1,000,000 events in 1,935 · 1,801 · 1,770 ms (~555 thousand/s), with snapshot 13.1 · 19.6 · 12.1 ms, rebuilding
   200 million events at 20,000/s = 10,000 s = 2 h 47 min, arrival e-501, e-504, e-505, e-502, e-502 of order 1047. */
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
    if (ms >= 100000) return fmtDur(ms / 1000);
    if (ms >= 10) return fmt(ms, 0) + ' ms';
    return fmt(ms, 1) + ' ms';
  }
  function fmtDur(s) {
    if (s >= 3600) {
      var h = Math.floor(s / 3600), m = Math.round((s - h * 3600) / 60);
      if (m === 60) { h += 1; m = 0; }
      return h + ' h' + (m ? ' ' + m + ' min' : '');
    }
    if (s >= 120) return fmt(s / 60, 1) + ' min';
    return fmt(s, 1) + ' s';
  }
  function fmtRatio(r) { return '~' + fmt(r >= 100 ? Math.round(r / 10) * 10 : r, r >= 100 ? 0 : 1) + '×'; }
  function fmtN(n) { return fmt(n, 0); }

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
    var id = 'es-sl-' + (++uid);
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table es-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function pre(t) { return el('pre', { class: 'es-json' }, [el('code', { text: t })]); }

  /* =============== LESSON 2: storage =============== */
  function wArmazenamento(root) {
    var B = 263, TAB_GB_50M = 140;
    var porPed = slider('Events per order', 2, 10, 1, 4, 'events');
    var ped = slider('Orders', 1, 50, 1, 50, 'million');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var e = +porPed.input.value, p = +ped.input.value;
      var ev = p * 1e6 * e, gb = ev * B / 1e9, tab = TAB_GB_50M * p / 50;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Events', fmt(ev / 1e6, 1) + ' million'),
        fact('Event Store (~263 B each)', fmt(gb, 1) + ' GB'),
        fact('pedidos table (module 16)', fmt(tab, 1) + ' GB'),
        fact('Store ÷ table', fmt(gb / tab * 100, 0) + '%'),
        fact('Both together', fmt(gb + tab, 1) + ' GB')
      ]));
      out.appendChild(verdict(gb > tab,
        gb > tab ? 'The Event Store is bigger than the table.' : 'The Event Store is smaller than the table, but it does not replace it.',
        'The Store takes ' + fmt(gb, 1) + ' GB and the pedidos table still exists as a read model: the total is ' + fmt(gb + tab, 1) + ' GB, not ' + fmt(gb, 1) + '.'));
      out.appendChild(note(e === 4 && p === 50
        ? 'Math from the brief: 4 events × 50 million = 200 million × ~263 B ≈ 52.6 GB (measured on PostgreSQL 14: 263 MB for 1 million events, table and indexes, small payload). The real PedidoCriado is 336 B of JSON alone, so this is an estimate.'
        : 'Estimate: ~263 B per event (measured with a small payload) and the pedidos table scaled linearly from the 140 GB at 50 million. Bigger events or extra indexes change the result.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [porPed.wrap, ped.wrap]));
    [porPed, ped].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 4: version conflict =============== */
  function wConflito(root) {
    var RATES = [1, 2, 6, 10, 30, 60, 100, 300, 600, 1000];
    var btns = [], S = { unique: true };
    var taxa = slider('Commands per second on the same stream', 0, RATES.length - 1, 1, 2, '', function (i) { return fmtN(RATES[i]) + '/s'; });
    var ms = slider('Time of each attempt (read, decide, write)', 1, 50, 1, 5, 'ms');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var ERR = 'ERROR:  duplicate key value violates unique constraint "eventos_stream_versao"\nDETAIL:  Key (stream_id, versao)=(estoque-GATO-042, 3) already exists.';
    function render() {
      var r = RATES[+taxa.input.value], t = +ms.input.value, a = r * t / 1000;
      var p = 1 - Math.exp(-a), cap = 1000 / t;
      clear(out);
      var rows;
      if (S.unique) {
        rows = [
          { cells: [{ text: 'A and B read' }, { text: 'MAX(versao) = 2: the function check passes in both.' }, { text: 'v1, v2' }] },
          { cells: [{ text: 'A inserts' }, { text: 'append_evento(…, 2) → version 3, e-lab-A. A commits after 2 s.' }, { text: 'v1, v2, v3 (A)' }] },
          { cells: [{ text: 'B waits' }, { text: 'Lock / transactionid: B tries the same version 3 and stays stuck until A commits.' }, { text: 'no change' }] },
          { cls: 'es-bad', cells: [{ text: 'B fails' }, { text: 'duplicate key … "eventos_stream_versao"', cls: 'es-bad' }, { text: 'no change' }] },
          { cells: [{ text: 'B retries' }, { text: 'it re-reads the stream (v3), decides with the new balance and writes with expected version 3.' }, { text: 'v1, v2, v3 (A), v4 (B)' }] }
        ];
      } else {
        rows = [
          { cells: [{ text: 'A and B read' }, { text: 'MAX(versao) = 2: the check passes in both.' }, { text: 'v1, v2' }] },
          { cells: [{ text: 'A inserts' }, { text: 'version 3, e-lab-A.' }, { text: 'v1, v2, v3 (A)' }] },
          { cls: 'es-bad', cells: [{ text: 'B inserts' }, { text: 'nothing stops it: version 3, e-lab-B.', cls: 'es-bad' }, { text: 'v1, v2, v3 (A), v3 (B)' }] }
        ];
      }
      out.appendChild(table(['Step', 'What happens', 'Stream'], rows, 'es-wide'));
      if (S.unique) out.appendChild(pre(ERR));
      out.appendChild(verdict(!S.unique,
        S.unique ? 'One passes, the other retries.' : 'The stream ended up with two version 3s.',
        S.unique
          ? 'The UNIQUE (stream_id, versao) blocks the second one. Measured result: v1 e-lab-0, v2 e-503, v3 e-lab-A, and B has to re-read the stream and decide again.'
          : 'Without the constraint both sessions pass. Which v3 comes first? Any rehydration becomes ambiguous, and the log, which was the source of truth, is broken. (A consequence of the design, not measured.)'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Commands per second', fmtN(r) + '/s'),
        fact('Stream load (λ × time)', fmt(a, 2)),
        fact(S.unique ? 'Chance of colliding' : 'Chance of duplicating the version', fmt(p * 100, 1) + '%'),
        fact('Capacity (1 stream)', fmt(cap, 0) + '/s')
      ]));
      out.appendChild(verdict(r > cap,
        r > cap ? 'The stream became a bottleneck.' : (p < 0.1 ? 'Collisions are rare.' : 'There are many collisions.'),
        r > cap
          ? fmtN(r) + ' commands per second arrive and one stream serves ~' + fmt(cap, 0) + '/s (1,000 ÷ ' + t + ' ms): the aggregate is too big, split it by SKU.'
          : (p < 0.1
            ? 'At ' + fmtN(r) + '/s with ' + t + ' ms per attempt, the chance of another command arriving in the middle is ' + fmt(p * 100, 1) + '%. The retry handles it.'
            : 'The chance of another command arriving in the middle is ' + fmt(p * 100, 1) + '%: almost every command needs a retry. The aggregate should be smaller.')));
      out.appendChild(note('Estimate with independent random arrivals: collision chance = 1 − e^(−commands/s × time). At 6/s and 5 ms it is low (~3%); at 600/s the stream cannot keep up. Not measured.'));
    }
    function pick(i) { S.unique = i === 0; press(btns, i); render(); }
    ms.input.addEventListener('input', render);
    root.appendChild(chipRow('Constraint on the table', ['With UNIQUE (stream_id, versao)', 'Without UNIQUE'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, ms.wrap]));
    taxa.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 6: rebuild a model =============== */
  function wReconstruir(root) {
    var READ = 555000, btns = [];
    var ev = slider('Events in the Store', 1, 500, 1, 200, 'million');
    var rit = slider('Write rate into the model', 1000, 100000, 1000, 20000, 'events/s');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var PRESETS = [{ t: 'The 200 million at 20,000/s', e: 200, r: 20000 }, { t: 'Model 5× faster', e: 200, r: 100000 }, { t: '500 million at 20,000/s', e: 500, r: 20000 }];
    function render() {
      var e = +ev.input.value * 1e6, r = +rit.input.value;
      var tw = e / r, tr = e / READ, total = Math.max(tw, tr);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Time to rebuild', fmtDur(total)),
        fact('Writing to the model', fmtDur(tw)),
        fact('Reading the Store (~555 thousand/s)', fmtDur(tr)),
        fact('Bottleneck', tw >= tr ? 'writing' : 'reading')
      ]));
      out.appendChild(verdict(tw >= tr,
        tw >= tr ? 'The bottleneck is writing to the model.' : 'Here the bottleneck is reading the Store.',
        tw >= tr
          ? 'The Store delivers ~555 thousand events per second and the model only receives ' + fmtN(r) + '. Rebuilding takes ' + fmtDur(tw) + '; speeding up reads changes nothing, speeding up writes does.'
          : 'With the model receiving ' + fmtN(r) + '/s, the read rate of ~555 thousand/s is the limit: ' + fmtDur(tr) + '.'));
      out.appendChild(note(+ev.input.value === 200 && r === 20000
        ? 'Math from the brief: 200 million ÷ 20,000/s = 10,000 s = 2 h 47 min. The Store read rate (~555 thousand events/s) was measured on PostgreSQL 14; the 20,000/s rate is the one from module 18.'
        : 'Estimate: events ÷ rate, with reading and writing in parallel (the slower one counts). The 555 thousand/s rate was measured on PostgreSQL 14.'));
    }
    function preset(i) { ev.set(PRESETS[i].e); rit.set(PRESETS[i].r); press(btns, i); render(); }
    root.appendChild(chipRow('Scenarios from the text', PRESETS.map(function (x) { return x.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ev.wrap, rit.wrap]));
    [ev, rit].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== LESSON 7: rehydrate 1047 =============== */
  function wRehidratar(root) {
    var EV = [
      { v: 1, id: 'e-501', tipo: 'PedidoCriado', quando: '14:02:10.000' },
      { v: 2, id: 'e-502', tipo: 'PedidoPago', quando: '14:02:11.000' },
      { v: 3, id: 'e-504', tipo: 'PedidoEnviado', quando: '14:30:00' },
      { v: 4, id: 'e-505', tipo: 'PedidoEntregue', quando: '06/19 10:40:00' }
    ];
    var STATUS = ['', 'criado', 'pago', 'enviado', 'entregue'];
    var MOMENTS = [
      { t: 'before 14:02:10', v: 0 }, { t: '14:02:10', v: 1 }, { t: '14:02:11', v: 2 }, { t: '14:15', v: 2 },
      { t: '14:30', v: 3 }, { t: '06/19 10:39', v: 3 }, { t: '06/19 10:40', v: 4 }
    ];
    var btns = [], S = { modo: 0 };
    var sv = slider('Fold up to version', 0, 4, 1, 4, '', function (v) { return String(v); });
    var sh = slider('Up to the time (06/18/2026, unless stated)', 0, MOMENTS.length - 1, 1, 6, '', function (i) { return MOMENTS[i].t; });
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function estado(v) {
      if (v === 0) return '(empty: no event applied)';
      return JSON.stringify({ pedido_id: 1047, status: STATUS[v], total_centavos: 9490, rastreio: v >= 3 ? 'LA123456789BR' : null, versao: v }, null, 2);
    }
    function render() {
      var v = S.modo === 0 ? +sv.input.value : MOMENTS[+sh.input.value].v;
      var hora = S.modo === 1 ? MOMENTS[+sh.input.value].t : null;
      clear(out);
      var rows = EV.map(function (e) {
        var on = e.v <= v;
        return { cls: on ? 'es-on' : 'es-off', cells: [{ text: 'v' + e.v }, { text: e.id }, { text: e.tipo }, { text: e.quando }, { text: on ? 'applied' : 'not yet' }] };
      });
      out.appendChild(table(['Version', 'evento_id', 'Type', 'When', 'Folding'], rows, 'es-wide'));
      out.appendChild(el('div', { class: 'es-pair' }, [
        el('div', null, [el('p', { class: 'sr-sub', text: 'From the events' }), pre(estado(v))]),
        el('div', null, [el('p', { class: 'sr-sub', text: 'pedidos table (only the last)' }), pre(JSON.stringify({ pedido_id: 1047, status: 'entregue' }, null, 2))])
      ]));
      var diff = v !== 4;
      out.appendChild(verdict(diff,
        v === 0 ? 'It did not exist yet.' : (diff ? 'The two disagree.' : 'The two agree.'),
        v === 0
          ? 'Before 14:02:10 the pedido-1047 stream is empty. The table only knows the end of the story.'
          : (diff
            ? (hora ? 'At ' + hora + ' ' : 'At version ' + v + ' ') + 'the events say ' + STATUS[v] + '; the table can only say entregue.'
            : 'Folding the 4 events the result is entregue, version 4: the same as the table keeps, but now with the path.')));
      out.appendChild(note('State as in the lesson: it starts empty and each event is applied in order. Values in cents; times from module 6.'));
    }
    function pick(i) {
      S.modo = i; press(btns, i);
      sv.wrap.hidden = i !== 0; sh.wrap.hidden = i !== 1;
      render();
    }
    root.appendChild(chipRow('How to choose the point', ['By version', 'By time'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [sv.wrap, sh.wrap]));
    [sv, sh].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== LESSON 8: cost of rehydrating =============== */
  function wCusto(root) {
    var NS = [1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    var POL = [{ t: 'None', k: 0 }, { t: 'Every 10,000', k: 10000 }, { t: 'Every 1,000', k: 1000 }, { t: 'Every 100', k: 100 }];
    var FIX = 11.2, btns = [], S = { p: 2 };
    var n = slider('Events in the stream', 0, NS.length - 1, 1, 6, '', function (i) { return fmtN(NS[i]); });
    var vel = slider('Read speed', 50, 1000, 5, 555, 'thousand events/s');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var N = NS[+n.input.value], sp = +vel.input.value * 1000, K = POL[S.p].k;
      var full = N / sp * 1000;
      var sem = K === 0 || N <= K;
      var tail = sem ? N : K, snap = sem ? full : FIX + K / sp * 1000;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Without snapshot', fmtMs(full)),
        fact('With the policy', fmtMs(snap)),
        fact('Events read', fmtN(tail)),
        fact('Event reduction', sem ? '1×' : fmtRatio(N / tail)),
        fact('Time reduction', sem ? '1×' : fmtRatio(full / snap)),
        fact('Snapshots written', sem ? '0' : fmtN(Math.floor(N / K)))
      ]));
      var why = K === 0 ? 'Without a snapshot rehydration reads the whole stream: ' + fmtN(N) + ' events in ' + fmtMs(full) + ', on every command.'
        : (N <= K ? 'The stream has fewer events than the policy: there is no snapshot yet, so it reads everything.'
          : 'With a snapshot every ' + fmtN(K) + ' rehydration reads 1 photo and at most ' + fmtN(K) + ' events: ' + fmtMs(snap) + ' instead of ' + fmtMs(full) + '.');
      out.appendChild(verdict(K === 0 && full > 500, K === 0 ? (full > 500 ? 'Every command pays this.' : 'It is still cheap.') : 'The snapshot cuts the tail.', why));
      out.appendChild(note(N === 1000000 && sp === 555000
        ? 'Measured (PostgreSQL 14, 1,000,000 events, balance 10,000): without snapshot 1,935 · 1,801 · 1,770 ms; with a photo at version 999,000 and 1,000 events after it, 13.1 · 19.6 · 12.1 ms (includes starting psql twice). Every 10,000 and every 100 are estimates.'
        : 'Estimate: without snapshot = events ÷ speed; with snapshot = ~11 ms fixed (what is left of the ~13 ms measured) + tail ÷ speed, in the worst case of K events in the tail. Measured only at 1 million at ~555 thousand/s.'));
      out.appendChild(note('A more frequent photo reads less, but writes more photos. The snapshot is derived and disposable: deleting all of them only makes reads slow.'));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Snapshot policy', POL.map(function (x) { return x.t; }), btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, vel.wrap]));
    [n, vel].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== LESSON 9: order and version =============== */
  function wOrdem(root) {
    var STATUS = ['', 'criado', 'pago', 'enviado', 'entregue'];
    var BASE = [
      { id: 'e-501', v: 1, k: 'a' }, { id: 'e-504', v: 3, k: 'b' }, { id: 'e-505', v: 4, k: 'c' },
      { id: 'e-502', v: 2, k: 'd' }, { id: 'e-502', v: 2, k: 'e', dup: true }
    ];
    var order = BASE.slice(), rbtns = [], S = { regra: 1, perde: false };
    var RULES = ['Last to arrive wins', 'Higher version only', 'Higher version + wait for the missing one'];
    var list = el('ol', { class: 'es-arr', 'aria-label': 'Arrival order of the events' });
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var perdeBtn = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'Version 2 never arrives' });
    var dragFrom = -1;

    function label(e) { return e.id + ' · v' + e.v + ' · ' + STATUS[e.v] + (e.dup ? ' (duplicate)' : ''); }
    function move(i, d) {
      var j = i + d;
      if (j < 0 || j >= order.length) return;
      var t = order[i]; order[i] = order[j]; order[j] = t;
      drawList(); render();
    }
    function drawList() {
      clear(list);
      order.forEach(function (e, i) {
        var li = el('li', { class: 'es-arr-i', draggable: 'true', 'data-i': String(i) });
        li.appendChild(el('span', { class: 'es-arr-n', text: String(i + 1) }));
        li.appendChild(el('span', { class: 'es-arr-t', text: label(e) }));
        var up = el('button', { type: 'button', class: 'btn es-mv', 'aria-label': 'Arrive earlier: ' + label(e), text: '↑' });
        var dn = el('button', { type: 'button', class: 'btn es-mv', 'aria-label': 'Arrive later: ' + label(e), text: '↓' });
        up.disabled = i === 0; dn.disabled = i === order.length - 1;
        up.addEventListener('click', function () { move(i, -1); });
        dn.addEventListener('click', function () { move(i, 1); });
        li.appendChild(up); li.appendChild(dn);
        li.addEventListener('dragstart', function (ev) { dragFrom = i; try { ev.dataTransfer.setData('text/plain', String(i)); ev.dataTransfer.effectAllowed = 'move'; } catch (x) {} });
        li.addEventListener('dragover', function (ev) { ev.preventDefault(); });
        li.addEventListener('drop', function (ev) {
          ev.preventDefault();
          if (dragFrom < 0 || dragFrom === i) return;
          var it = order.splice(dragFrom, 1)[0]; order.splice(i, 0, it); dragFrom = -1;
          drawList(); render();
        });
        list.appendChild(li);
      });
    }
    function simula() {
      var seq = order.filter(function (e) { return !(S.perde && e.v === 2); });
      var rows = [], st = { status: '(vazio)', v: 0 }, desc = 0, buf = [];
      seq.forEach(function (e) {
        var acao, ok = true;
        if (S.regra === 0) {
          acao = 'applies (arrived last so far)'; st = { status: STATUS[e.v], v: e.v };
        } else if (S.regra === 1) {
          if (e.v > st.v) { acao = 'applies (' + st.v + ' → ' + e.v + ')'; st = { status: STATUS[e.v], v: e.v }; }
          else { acao = 'discards (' + e.v + ' is not greater than ' + st.v + ')'; desc++; ok = false; }
        } else {
          if (e.v <= st.v) { acao = 'discards (already applied up to v' + st.v + ')'; desc++; ok = false; }
          else if (e.v === st.v + 1) {
            acao = 'applies v' + e.v; st = { status: STATUS[e.v], v: e.v };
            var drained = [];
            for (;;) {
              var nx = null;
              for (var q = 0; q < buf.length; q++) if (buf[q].v === st.v + 1) { nx = q; break; }
              if (nx === null) break;
              var b = buf.splice(nx, 1)[0]; st = { status: STATUS[b.v], v: b.v }; drained.push('v' + b.v);
            }
            if (drained.length) acao += '; then ' + drained.join(' and ') + ' from the buffer';
          } else {
            acao = 'waits (v' + (st.v + 1) + ' is missing)'; buf.push(e); ok = false;
          }
        }
        rows.push({ cls: ok ? '' : 'es-off', cells: [{ text: e.id + ' v' + e.v + (e.dup ? ' (dup)' : '') }, { text: acao }, { text: st.status + (st.v ? ', v' + st.v : '') }] });
      });
      return { rows: rows, st: st, desc: desc, buf: buf };
    }
    function render() {
      var r = simula();
      clear(out);
      out.appendChild(table(['Arrived', 'What the projection does', 'State after'], r.rows, 'es-wide'));
      var buraco = S.perde && r.st.v === 4 && S.regra !== 2;
      var certo = r.st.v === 4 && !buraco;
      var esperando = r.buf.length ? ' ' + r.buf.length + ' event(s) left waiting for v' + (r.st.v + 1) + '.' : '';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Final state', r.st.status + (r.st.v ? ', v' + r.st.v : '')),
        fact('Discards', String(r.desc)),
        fact('Waiting', String(r.buf.length)),
        fact('Result', certo ? 'correct' : (buraco ? 'with a gap' : (r.buf.length ? 'waiting' : 'wrong')))
      ]));
      var head, say;
      if (buraco) {
        head = 'It ended at entregue, but with a gap.';
        say = 'The rule only looks at "greater than": it applied v3 and v4 without ever having seen v2 (pago). The final state even looks right, and the model never learned about the payment.';
      } else if (certo) {
        head = 'It ended at entregue, version 4.';
        say = S.regra === 0
          ? 'Right by luck: e-505 was the last to arrive. Change the order (put an e-502 last) and the rule gets it wrong.'
          : 'The old or repeated events were discarded or waited their turn, and the final state is the Store\'s.';
      } else if (r.buf.length) {
        head = 'The projection is waiting for v' + (r.st.v + 1) + '.';
        say = 'Without v' + (r.st.v + 1) + ' it does not move forward, and that is right: it is better to wait (or ask the Store for the missing version) than to apply v3 and leave a gap.' + esperando;
      } else {
        head = 'It ended at ' + r.st.status + ', version ' + r.st.v + ': wrong.';
        say = 'The order was already delivered (v4), and a late event took the model back.';
      }
      out.appendChild(verdict(buraco || (!certo && !r.buf.length), head, say));
      out.appendChild(note('Example arrival: e-501 (v1), e-504 (v3), e-505 (v4), e-502 (v2) and e-502 again. With the "higher version only" rule the result measured on PostgreSQL 14 is entregue, v4, with both e-502s discarded. "Last to arrive" depends on who arrives last.'));
    }
    function pickRegra(i) { S.regra = i; press(rbtns, i); render(); }
    function togglePerde() { S.perde = !S.perde; perdeBtn.setAttribute('aria-pressed', S.perde ? 'true' : 'false'); render(); }
    perdeBtn.addEventListener('click', togglePerde);
    var ctl = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Arrival order' });
    [
      ['Example arrival', function () { order = BASE.slice(); }],
      ['Store order', function () { order = BASE.slice().sort(function (a, b) { return a.v - b.v || (a.dup ? 1 : 0) - (b.dup ? 1 : 0); }); }],
      ['Shuffle', function () { for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; } }]
    ].forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', text: c[0] });
      b.addEventListener('click', function () { c[1](); drawList(); render(); });
      ctl.appendChild(b);
    });
    ctl.appendChild(perdeBtn);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Arrival order at the status model' }));
    root.appendChild(ctl);
    root.appendChild(list);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Projection rule' }));
    root.appendChild(chipRow('Projection rule', RULES, rbtns, pickRegra));
    root.appendChild(out);
    drawList();
    pickRegra(1);
  }

  /* =============== LESSON 10: idempotency =============== */
  function wIdempotencia(root) {
    var mbtns = [], tbtns = [], S = { modelo: 1, tabela: 0 };
    var nEnt = slider('Times e-502 reaches stock', 1, 5, 1, 2, 'times');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var n = +nEnt.input.value, saldo = 3, rows = [], seq = ['3'];
      for (var i = 1; i <= n; i++) {
        var acao, ef;
        if (S.modelo === 0) {
          acao = i === 1 ? 'writes the reservation of order 1047' : 'rewrites the same reservation (key: the order)';
          saldo = 2; ef = 'balance ' + saldo;
        } else if (S.tabela === 1) {
          if (i === 1) { acao = 'e-502 was not in the table: applies −1 and writes the id'; saldo -= 1; }
          else acao = 'e-502 is already in eventos_processados: discards';
          ef = 'balance ' + saldo;
        } else {
          acao = 'applies −1'; saldo -= 1; ef = 'balance ' + saldo + (saldo < 0 ? ' (impossible)' : '');
        }
        seq.push(String(saldo));
        rows.push({ cls: (S.modelo === 1 && S.tabela === 0 && i > 1) ? 'es-bad' : '', cells: [{ text: 'delivery ' + i }, { text: acao, cls: (S.modelo === 1 && S.tabela === 0 && i > 1) ? 'es-bad' : '' }, { text: ef }] });
      }
      clear(out);
      out.appendChild(table(['Arrival', 'What stock does', 'Result'], rows, 'es-wide'));
      var certo = saldo === 2;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Balance path', seq.join(' → ')),
        fact('Final balance', String(saldo)),
        fact('Correct balance', '2'),
        fact('Difference', saldo === 2 ? 'none' : fmt(2 - saldo, 0) + ' unit(s) short')
      ]));
      out.appendChild(verdict(!certo,
        certo ? 'The balance adds up: 3 → 2.' : 'The balance is wrong: ' + seq.join(' → ') + '.',
        S.modelo === 0
          ? 'In the last-state model the reservation is one row per order: rewriting it changes nothing. The natural key (the order) does the work, with or without the table.'
          : (S.tabela === 1
            ? 'The evento_id goes into the table in the same transaction that applies the effect. The second delivery finds e-502 there and discards it.'
            : 'The model adds up and has no way to know it already saw e-502. Each delivery takes away one more unit, and stock "sells" what does not exist' + (saldo < 0 ? ' (the balance went below zero)' : '') + '.')));
      out.appendChild(note('This is the module 6 case: the PedidoPago e-502 arrives twice and stock goes 3 → 2 → 1. From 4 deliveries on the balance would go negative, which the stock aggregate would refuse, but a projection that only adds up does not refuse.'));
    }
    function pickM(i) { S.modelo = i; press(mbtns, i); tbtns.forEach(function (b) { b.disabled = i === 0; }); render(); }
    function pickT(i) { S.tabela = i; press(tbtns, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Stock model' }));
    root.appendChild(chipRow('Model', ['Last state (one row per order)', 'Sum (balance −1 on every event)'], mbtns, pickM));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Processed events table' }));
    root.appendChild(chipRow('Processed table', ['Without the table', 'With the table'], tbtns, pickT));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [nEnt.wrap]));
    nEnt.input.addEventListener('input', render);
    root.appendChild(out);
    pickT(0); pickM(1);
  }

  var REG = { armazenamento: wArmazenamento, conflito: wConflito, reconstruir: wReconstruir, rehidratar: wRehidratar, custo: wCusto, ordem: wOrdem, idempotencia: wIdempotencia };
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
