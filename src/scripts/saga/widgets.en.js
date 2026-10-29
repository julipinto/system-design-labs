/* SDLabs · Saga Pattern: plain JS widgets, English version
   (1057 saga simulator, choreography × orchestration, state machine, compensation with retry,
   lab probabilities, stuck reservation and saga watchdog).
   They use the store's story: order 1057 (Davi, 58.00, Pix c-7732, 41.2 s wait), 20:15:00.000, 3.65 s refund,
   lab with 10% stock failure and 5% payment failure, 10 min reservation at 30 orders/s. */
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
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }

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
    var id = 'sg-sl-' + (++uid);
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
  function select(label, options, value) {
    var id = 'sg-sl-' + (++uid);
    var sel = el('select', { id: id });
    options.forEach(function (o) { sel.appendChild(el('option', { value: o.v, text: o.t })); });
    sel.value = value;
    return { input: sel, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id, text: label }), sel]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table sg-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function pct(v, d) { return fmt(v * 100, d == null ? 1 : d) + '%'; }

  /* =============== AULA 3: simulador da saga do 1057 =============== */
  var STEP = {
    cobrar: { run: 'COBRANDO', ok: 'PAGO', undo: { cmd: 'EstornarCobranca', state: 'ESTORNANDO', dur: 3650 } },
    reservar: { run: 'RESERVANDO', ok: 'RESERVADO', dur: 40, undo: { cmd: 'LiberarEstoque', state: 'LIBERANDO', dur: 40 } },
    agendar: { run: 'AGENDANDO', ok: 'FINALIZADO', dur: 60 }
  };
  var IDS = { NOVO: 'e-1901', PAGO: 'e-1902', COMPENSANDO: 'e-1903', CANCELADO: 'e-1904' };
  function clock(ms) {
    var s = Math.floor(ms / 1000), r = Math.round(ms - s * 1000);
    return '20:' + pad(15 + Math.floor(s / 60), 2) + ':' + pad(s % 60, 2) + '.' + pad(r, 3);
  }
  function dur(ms) { return ms < 1000 ? fmt(ms, 0) + ' ms' : fmt(ms / 1000, 2) + ' s'; }

  function runSaga(orderIdx, failKey, E) {
    var order = orderIdx === 0 ? ['cobrar', 'reservar', 'agendar'] : ['reservar', 'cobrar', 'agendar'];
    var log = [{ de: '', para: 'NOVO', t: 0 }], cur = 'NOVO', t = 0, done = [], failed = null;
    for (var i = 0; i < order.length; i++) {
      var k = order[i], st = STEP[k];
      var start = i === 0 ? 50 : t + 20;
      log.push({ de: cur, para: st.run, t: start }); cur = st.run;
      var d = k === 'cobrar' ? Math.max(E - 50, 10) : st.dur;
      t = start + d;
      if (k === failKey) { failed = k; break; }
      log.push({ de: cur, para: st.ok, t: t }); cur = st.ok; done.push(k);
    }
    var comps = [];
    if (failed) {
      log.push({ de: cur, para: 'COMPENSANDO', t: t }); cur = 'COMPENSANDO';
      var back = done.slice().reverse().filter(function (k) { return STEP[k].undo; });
      if (!back.length) { t += 10; }
      back.forEach(function (k) {
        var u = STEP[k].undo;
        t += 40; log.push({ de: cur, para: u.state, t: t }); cur = u.state; t += u.dur;
        comps.push(u.cmd);
      });
      log.push({ de: cur, para: 'CANCELADO', t: t }); cur = 'CANCELADO';
      comps.push('CancelarPedido');
    }
    return { log: log, total: t, comps: comps, failed: failed, done: done, order: order };
  }

  function wSimulador(root) {
    var bo = [], bf = [], S = { o: 0, f: 2 };
    var FAILS = [null, 'cobrar', 'reservar', 'agendar'];
    var espera = slider('Pix wait (until Davi pays)', 1, 120, 0.1, 41.2, 's', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var E = Math.round(+espera.input.value * 1000);
      var r = runSaga(S.o, FAILS[S.f], E);
      var star = S.o === 0 && S.f === 2;
      clear(out);
      var rows = r.log.map(function (x) {
        var id = star ? IDS[x.para] : '';
        return { cls: x.para === 'COMPENSANDO' || x.para === 'ESTORNANDO' || x.para === 'LIBERANDO' ? 'sg-bad' : '',
          cells: [{ text: clock(x.t) }, { text: (x.de ? x.de + ' → ' : '') + x.para }, { text: id }] };
      });
      out.appendChild(table(['Time', 'Transition', 'Event'], rows));
      var estorno = r.comps.indexOf('EstornarCobranca') >= 0;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Time to finish', dur(r.total)),
        fact('Compensations', r.comps.length ? r.comps.join(' → ') : 'none'),
        fact('Refund', estorno ? 'yes (R$ 58.00)' : 'no'),
        fact('Final state', r.log[r.log.length - 1].para)
      ]));
      var head, say, bad = !!r.failed;
      if (!r.failed) {
        head = 'The saga ends in FINALIZADO.';
        say = 'All three steps pass in ' + dur(r.total) + ', and of that ' + fmt(E / 1000, 1) + ' s is the Pix wait.';
      } else if (!estorno && r.order.indexOf('cobrar') > r.order.indexOf(r.failed)) {
        head = 'Failed before charging: no refund.';
        say = 'Nothing was charged, so there is no money to give back. ' + (r.comps.length > 1 ? 'Only what already passed is undone: ' + r.comps.slice(0, -1).join(', ') + '. ' : '') +
          'The price of this order is different: the reservation stays stuck while the customer decides to pay (lesson 10).';
      } else if (r.failed === 'cobrar') {
        head = 'The charge failed.';
        say = 'The PSP refused after ' + fmt(E / 1000, 1) + ' s of waiting. ' + (r.comps.length > 1 ? 'What already passed is undone: ' + r.comps.slice(0, -1).join(', ') + '.' : 'There is nothing to undo besides the order.');
      } else {
        head = 'The saga compensates in reverse order.';
        say = 'It undoes what had already passed: ' + r.comps.join(', ') + '. Davi saw the money leave and come back.';
      }
      out.appendChild(verdict(bad && estorno, head, say));
      out.appendChild(el('p', { class: 'sr-note', text: 'Example timings, measured on 1057 (reserve 40 ms, refund 3.65 s, 20 ms between steps); schedule (60 ms) and release (40 ms) are estimates. LIBERANDO shows up only here, to show the second compensation. With the store\'s order, the 41.2 s wait and the stock failure, the total is 44.95 s; with the lab\'s order, about 100 ms.' }));
    }
    root.appendChild(chipRow('Order of the steps', ['Charge first (the store)', 'Reserve first (the lab)'], bo, function (i) { S.o = i; press(bo, i); render(); }));
    root.appendChild(chipRow('Step that fails', ['None', 'Charge', 'Reserve', 'Schedule'], bf, function (i) { S.f = i; press(bf, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [espera.wrap]));
    espera.input.addEventListener('input', render);
    root.appendChild(out);
    press(bo, 0); press(bf, 2);
    render();
  }

  /* =============== AULA 5: coreografia × orquestração =============== */
  function wCoreoOrq(root) {
    var n = slider('Steps after the order', 2, 8, 1, 3, '', function (v) { return String(v); });
    var f = slider('Step that fails', 1, 3, 1, 2, '', function (v) { return String(v); });
    var btns = [], S = { fail: 1 };
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var N = +n.input.value;
      f.input.max = String(N);
      if (+f.input.value > N) f.set(N);
      var F = +f.input.value, fail = S.fail === 1;
      f.wrap.hidden = !fail;
      var co = fail ? 2 * F + 1 : N + 1;
      var orq = fail ? 4 * F : 2 * N;
      var back = N * (N - 1) / 2;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Choreography', co + ' events'),
        fact('Orchestration', orq + ' messages + 1 to start'),
        fact('Places that know everything', '0 versus 1'),
        fact('Backward dependencies', back + ' versus 0')
      ]));
      out.appendChild(table(['', 'choreography', 'orchestration'], [
        { cells: [{ text: 'Calculation' }, { text: fail ? '1 + ' + (F - 1) + ' + 1 + ' + (F - 1) + ' + 1 = ' + co : '1 + ' + N + ' = ' + co }, { text: fail ? '2·' + F + ' + 2·' + (F - 1) + ' + 2 = ' + orq : '2 · ' + N + ' = ' + orq }] },
        { cells: [{ text: 'Where the flow is' }, { text: 'spread across ' + (N + 1) + ' services' }, { text: 'in the orchestrator' }] },
        { cells: [{ text: 'If one goes down' }, { text: 'the saga stops and nobody knows' }, { text: 'the orchestrator knows and waits' }] }
      ]));
      out.appendChild(verdict(false, 'The orchestrator costs ' + Math.abs(orq - co) + (Math.abs(orq - co) === 1 ? ' message' : ' messages') + ' ' + (orq >= co ? 'more' : 'less') + '.',
        'And it pays with a place that knows everything: the flow, the watchdog and the metrics live in it, and every order goes through it. Choreography has no center, but the flow is nowhere and every service that can fail later forces the earlier ones to listen to it (' + back + ' backward arrows in the worst case).'));
      out.appendChild(el('p', { class: 'sr-note', text: 'With 3 steps (charge, reserve, schedule) choreography uses 4 events on success and 5 on a stock failure, and orchestration 6 and 8, plus 1 to start. The failure calculation assumes the steps before the one that failed were all compensated and that the order is canceled at the end.' }));
    }
    root.appendChild(chipRow('Result', ['All good', 'One step fails'], btns, function (i) { S.fail = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, f.wrap]));
    [n, f].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 1);
    render();
  }

  /* =============== AULA 6: máquina de estados =============== */
  var STATES = ['(none)', 'NOVO', 'COBRANDO', 'PAGO', 'RESERVANDO', 'RESERVADO', 'AGENDANDO', 'COMPENSANDO', 'ESTORNANDO', 'FINALIZADO', 'CANCELADO', 'INTERVENCAO'];
  var FINAL = { FINALIZADO: 1, CANCELADO: 1, INTERVENCAO: 1 };
  var EVENTS = [
    { v: 'criado', t: 'PedidoCriado' },
    { v: 'avancar', t: 'advance (the saga sends the next command)' },
    { v: 'pago', t: 'PedidoPago' },
    { v: 'prazo', t: 'charge deadline expired' },
    { v: 'reservado', t: 'EstoqueReservado' },
    { v: 'indisponivel', t: 'EstoqueIndisponivel' },
    { v: 'agendada', t: 'EntregaAgendada' },
    { v: 'entregafalhou', t: 'EntregaFalhou' },
    { v: 'estornado', t: 'PagamentoEstornado' },
    { v: 'esgotou', t: 'refund ran out of retries' }
  ];
  var TRANS = [
    ['(none)', 'criado', 'NOVO', 'saves saga s-1057'],
    ['NOVO', 'avancar', 'COBRANDO', 'sends the Pix charge c-7732'],
    ['COBRANDO', 'pago', 'PAGO', 'records the 58.00'],
    ['COBRANDO', 'prazo', 'CANCELADO', 'cancels the order (nothing to refund)'],
    ['PAGO', 'avancar', 'RESERVANDO', 'sends ReservarEstoque'],
    ['RESERVANDO', 'reservado', 'RESERVADO', 'records the reservation'],
    ['RESERVANDO', 'indisponivel', 'COMPENSANDO', 'stores the reason sem_estoque'],
    ['RESERVADO', 'avancar', 'AGENDANDO', 'sends AgendarEntrega'],
    ['AGENDANDO', 'agendada', 'FINALIZADO', 'notifies the customer'],
    ['AGENDANDO', 'entregafalhou', 'COMPENSANDO', 'stores the failure reason'],
    ['COMPENSANDO', 'avancar', 'ESTORNANDO', 'sends EstornarCobranca c-7732 (key estorno-c-7732)'],
    ['ESTORNANDO', 'estornado', 'CANCELADO', 'cancels the order and notifies Davi'],
    ['ESTORNANDO', 'esgotou', 'INTERVENCAO', 'alert with all the data (calls a person)']
  ];
  function evLabel(v) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].v === v) return EVENTS[i].t; return v; }

  function wMaquina(root) {
    var btns = [];
    var st = select('Current state', STATES.map(function (s) { return { v: s, t: s }; }), 'COBRANDO');
    var ev = select('Event that arrived', EVENTS.map(function (e) { return { v: e.v, t: e.t }; }), 'pago');
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'PedidoPago in COBRANDO', s: 'COBRANDO', e: 'pago' },
      { t: 'The same PedidoPago in RESERVANDO', s: 'RESERVANDO', e: 'pago' },
      { t: 'EstoqueIndisponivel in RESERVANDO', s: 'RESERVANDO', e: 'indisponivel' },
      { t: 'PedidoPago in CANCELADO', s: 'CANCELADO', e: 'pago' }
    ];
    function find(s, e) {
      for (var i = 0; i < TRANS.length; i++) if (TRANS[i][0] === s && TRANS[i][1] === e) return TRANS[i];
      return null;
    }
    function render() {
      var s = st.input.value, e = ev.input.value, tr = find(s, e);
      clear(out);
      var verdictLabel = tr ? 't' : 'f';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Current state', s),
        fact('Event', evLabel(e)),
        fact('Next state', tr ? tr[2] : s + ' (unchanged)'),
        fact('transitar(...) returns', verdictLabel)
      ]));
      if (tr) {
        out.appendChild(verdict(false, 'The transition goes through.', 'UPDATE saga SET estado = \'' + tr[2] + '\', versao = versao + 1 WHERE estado = \'' + s + '\' affects 1 row. Action: ' + tr[3] + '. The row goes to the log.' + (FINAL[tr[2]] ? ' ' + tr[2] + ' is a final state' + (tr[2] === 'INTERVENCAO' ? ' and the only one that calls a person.' : '.') : '')));
      } else {
        var expected = TRANS.filter(function (x) { return x[1] === e; }).map(function (x) { return x[0]; });
        var why;
        if (FINAL[s]) why = 'The saga already ended in ' + s + ': no event touches it anymore.';
        else {
          var idx = STATES.indexOf(s);
          var before = expected.every(function (x) { return STATES.indexOf(x) < idx; });
          var after = expected.every(function (x) { return STATES.indexOf(x) > idx; });
          var lista = expected.join(' or ');
          why = before ? 'It is a duplicate (or a late arrival): this event only applies in ' + lista + ', and the saga is already past that point.'
            : after ? 'It arrived out of order: this event only applies in ' + lista + ', and the saga hasn\'t gotten there yet.'
            : 'This event only applies in ' + lista + ', and the saga is in ' + s + '.';
        }
        out.appendChild(verdict(true, 'Ignored (f).', 'UPDATE ... WHERE estado = \'' + (expected[0] || '?') + '\' affects 0 rows, and nothing goes to the log. ' + why));
      }
      var rows = TRANS.map(function (x) {
        return { cls: tr && x === tr ? 'sg-cur' : '', cells: [{ text: x[0] }, { text: evLabel(x[1]) }, { text: x[2] }, { text: x[3] }] };
      });
      out.appendChild(table(['State', 'Event', 'Next', 'Action'], rows));
    }
    function preset(i) { st.input.value = PRESETS[i].s; ev.input.value = PRESETS[i].e; press(btns, i); render(); }
    root.appendChild(chipRow('1057 situations', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [st.wrap, ev.wrap]));
    [st, ev].forEach(function (s) { s.input.addEventListener('change', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 6: vigia de sagas =============== */
  function wVigia(root) {
    var prazo = slider('Deadline per state', 1, 120, 1, 30, 'min', function (v) { return String(v); });
    var taxa = slider('Sagas that stall per hour', 1, 60, 1, 12, '/h', function (v) { return String(v); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    var ESTADOS = ['COBRANDO', 'COBRANDO', 'RESERVANDO', 'COBRANDO', 'AGENDANDO', 'ESTORNANDO'];
    function hhmm(minAgo) {
      var m = 20 * 60 + 20 - Math.round(minAgo);
      return pad(Math.floor(m / 60), 2) + ':' + pad(m % 60, 2);
    }
    function render() {
      var P = +prazo.input.value, N = +taxa.input.value;
      var list = [{ id: 's-teste', estado: 'COBRANDO', age: 60 }];
      for (var i = 0; i < N; i++) list.push({ id: 's-x' + pad(i + 1, 2), estado: ESTADOS[i % ESTADOS.length], age: (i + 0.5) * 60 / N });
      var exp = list.filter(function (x) { return x.age >= P; });
      exp.sort(function (a, b) { return b.age - a.age; });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Stalled sagas', String(list.length)),
        fact('The watchdog expires now', String(exp.length)),
        fact('Still within the deadline', String(list.length - exp.length)),
        fact('Maximum wait before compensating', P + ' min')
      ]));
      var shown = exp.slice(0, 10);
      if (shown.length) {
        out.appendChild(table(['Saga', 'State', 'Stalled since', 'For'], shown.map(function (x) {
          return { cells: [{ text: x.id }, { text: x.estado }, { text: hhmm(x.age) }, { text: fmt(x.age, 0) + ' min' }] };
        })));
        if (exp.length > shown.length) out.appendChild(el('p', { class: 'sr-note', text: '… and ' + (exp.length - shown.length) + ' more sagas in the list.' }));
      }
      out.appendChild(verdict(exp.length === 0 ? false : true,
        exp.length === 0 ? 'No saga went past the deadline.' : exp.length + (exp.length === 1 ? ' saga went' : ' sagas went') + ' past the ' + P + ' min deadline.',
        'The watchdog expires them and triggers the compensation. ' + (exp.length === 0 ? 'With such a long deadline, the 60 min test saga isn\'t found yet: the customer waits ' + P + ' min for an answer.' : 'A short deadline catches them early, but may expire a Pix that Davi was still going to pay; a long deadline leaves the money and the stock sitting idle.')));
      out.appendChild(el('p', { class: 'sr-note', text: 'Example: it is 20:20, s-teste has been stalled in COBRANDO since 19:20 (the one the real watchdog found, with a 30 min deadline), and the other N sagas stalled uniformly over the last hour. The s-xNN ids are examples. Without a watchdog, none of them leave the state.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [prazo.wrap, taxa.wrap]));
    [prazo, taxa].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 7: compensação com retry =============== */
  function wCompensacao(root) {
    var n = slider('Retries after the first failure', 1, 8, 1, 5, '', function (v) { return String(v); });
    var base = slider('Backoff base', 0.5, 4, 0.5, 1, 's', function (v) { return fmt(v, 1); });
    var p = slider('Chance of the PSP answering (per attempt)', 0, 100, 5, 50, '%', function (v) { return String(v); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var N = +n.input.value, B = +base.input.value, pr = +p.input.value / 100;
      var waits = [], sum = 0;
      for (var i = 0; i < N; i++) { var w = B * Math.pow(2, i); waits.push(w); sum += w; }
      var pFail = Math.pow(1 - pr, N + 1);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Waits', waits.map(function (w) { return fmt(w, 1); }).join(' + ') + ' s'),
        fact('Sum of the waits', fmt(sum, 1) + ' s'),
        fact('Total attempts', String(N + 1)),
        fact('Chance of INTERVENCAO', pct(pFail, 2))
      ]));
      out.appendChild(table(['calculation', 'result'], [
        { cells: [{ text: 'Sum' }, { text: B + ' × (2^' + N + ' − 1) = ' + fmt(B, 1) + ' × ' + (Math.pow(2, N) - 1) + ' = ' + fmt(sum, 1) + ' s' }] },
        { cells: [{ text: 'All fail' }, { text: '(1 − ' + fmt(pr, 2) + ')^' + (N + 1) + ' = ' + pct(pFail, 2) }] },
        { cls: pFail > 0.05 ? 'sg-bad' : '', cells: [{ text: 'The saga goes to' }, { text: pFail > 0.5 ? 'INTERVENCAO, most of the time' : 'CANCELADO, most of the time' }] }
      ]));
      out.appendChild(verdict(pFail > 0.05, pFail > 0.05 ? 'More than 5% of sagas call a person.' : 'Few sagas call a person.',
        'The refund uses the key estorno-c-7732, so repeating doesn\'t refund twice. The saga can handle a PSP that is down for up to ' + fmt(sum, 1) + ' s; if the outage is longer, it goes to INTERVENCAO even if the PSP comes back later.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Store default: 5 retries with a 1 s base (1, 2, 4, 8 and 16 s, sum 31 s). The chance of an answer per attempt is an example and assumes independent attempts: a PSP that is really down answers badly to all of them.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, base.wrap, p.wrap]));
    [n, base, p].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: probabilidades do laboratório =============== */
  function wProb(root) {
    var btns = [], S = { o: 0 };
    var pe = slider('Stock failure', 0, 30, 1, 10, '%', function (v) { return String(v); });
    var pp = slider('Payment failure', 0, 30, 1, 5, '%', function (v) { return String(v); });
    var nn = slider('Orders', 1, 1000, 1, 20, '', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var E = +pe.input.value / 100, P = +pp.input.value / 100, N = +nn.input.value;
      var lab = S.o === 0, ok, fe, fp, comps, est, lib;
      if (lab) { // estoque antes do pagamento
        ok = (1 - E) * (1 - P); fe = E; fp = (1 - E) * P;
        comps = N * (fe * 1 + fp * 2); est = 0; lib = N * fp;
      } else { // pagamento antes do estoque
        ok = (1 - P) * (1 - E); fp = P; fe = (1 - P) * E;
        comps = N * (fp * 1 + fe * 2); est = N * fe; lib = 0;
      }
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Expected successes', pct(ok, 1) + ' (' + fmt(N * ok, 1) + ' of ' + fmt(N, 0) + ')'),
        fact('Stock failure', fmt(N * fe, 1) + ' (' + pct(fe, 1) + ')'),
        fact('Payment failure', fmt(N * fp, 1) + ' (' + pct(fp, 1) + ')'),
        fact('Refunds', fmt(est, 1))
      ]));
      out.appendChild(table(['calculation', 'result'], lab ? [
        { cells: [{ text: 'Success' }, { text: '(1 − ' + fmt(E, 2) + ') × (1 − ' + fmt(P, 2) + ') = ' + pct(ok, 1) }] },
        { cells: [{ text: 'Stock failure' }, { text: fmt(E, 2) + ' → only CANCEL_ORDER (1 compensation)' }] },
        { cells: [{ text: 'Payment failure' }, { text: '(1 − ' + fmt(E, 2) + ') × ' + fmt(P, 2) + ' = ' + pct(fp, 1) + ' → RELEASE_STOCK and CANCEL_ORDER (2)' }] },
        { cells: [{ text: 'Compensations in total' }, { text: fmt(comps, 1) + ' commands, ' + fmt(lib, 1) + ' stock releases' }] }
      ] : [
        { cells: [{ text: 'Success' }, { text: '(1 − ' + fmt(P, 2) + ') × (1 − ' + fmt(E, 2) + ') = ' + pct(ok, 1) }] },
        { cells: [{ text: 'Payment failure' }, { text: fmt(P, 2) + ' → only CancelarPedido (nothing to refund)' }] },
        { cls: est > 0 ? 'sg-bad' : '', cells: [{ text: 'Stock failure' }, { text: '(1 − ' + fmt(P, 2) + ') × ' + fmt(E, 2) + ' = ' + pct(fe, 1) + ' → EstornarCobranca and CancelarPedido (2)' }] },
        { cells: [{ text: 'Compensations in total' }, { text: fmt(comps, 1) + ' commands, ' + fmt(est, 1) + ' refunds' }] }
      ]));
      out.appendChild(verdict(!lab && est > 0,
        lab ? 'The lab\'s order: no refunds.' : 'The store\'s order: every stock failure becomes a refund.',
        'The success rate is the same in both orders (' + pct(ok, 1) + '). What changes is what gets undone: ' + (lab ? 'releasing stock (cheap), with the stuck reservation as the price (lesson 10).' : 'giving money back to the customer, with a possible fee and time (44.95 s on 1057).')));
      out.appendChild(el('p', { class: 'sr-note', text: 'Default: 10% and 5%, 20 orders, the lab\'s order: 85.5% (17.1 of 20), 2.0 stock failures and 0.9 payment failures. In the store\'s order, with 10% stock failure and payment first, the exact calculation gives 1.9 refunds (2.0 if payment never failed). Expected values: a round of 20 orders varies.' }));
    }
    root.appendChild(chipRow('Order of the steps', ['Stock before charging (the lab)', 'Charge before stock (the store)'], btns, function (i) { S.o = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pe.wrap, pp.wrap, nn.wrap]));
    [pe, pp, nn].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 10: reserva presa =============== */
  function wReserva(root) {
    var rate = slider('Orders per second', 1, 60, 1, 30, '/s', function (v) { return String(v); });
    var desist = slider('Pix drop-off', 0, 50, 1, 20, '%', function (v) { return String(v); });
    var prazo = slider('Reservation deadline', 1, 30, 1, 10, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var R = +rate.input.value, D = +desist.input.value / 100, M = +prazo.input.value;
      var presas = R * D * M * 60, porMin = R * D * 60;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Stuck units', fmt(presas, 0)),
        fact('Reservations expiring', fmt(porMin, 0) + ' per minute'),
        fact('Drop-offs per second', fmt(R * D, 1)),
        fact('Deadline in seconds', fmt(M * 60, 0) + ' s')
      ]));
      out.appendChild(table(['calculation', 'result'], [
        { cells: [{ text: 'Stuck units' }, { text: R + ' × ' + fmt(D, 2) + ' × ' + (M * 60) + ' = ' + fmt(presas, 0) }] },
        { cells: [{ text: 'Each one holds the stock for' }, { text: M + ' min, until the watchdog releases it' }] }
      ]));
      out.appendChild(verdict(presas >= 1000, presas >= 1000 ? 'Thousands of units sitting idle.' : 'Few units stuck.',
        'That is the price of reserving before charging: each abandoned Pix holds the unit until the deadline. The reservation expiry is a compensation (LiberarEstoque). In the store\'s order there is no stuck reservation, but every stock failure becomes a refund.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Lesson 10 example: 30 orders/s, 20% drop-off and 10 min give 30 × 0.2 × 600 = 3,600. It is the average number of stuck units in steady state (the arrival rate times the wait time).' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rate.wrap, desist.wrap, prazo.wrap]));
    [rate, desist, prazo].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  var REG = { simulador: wSimulador, 'coreo-orq': wCoreoOrq, maquina: wMaquina, vigia: wVigia, compensacao: wCompensacao, probabilidades: wProb, 'reserva-presa': wReserva };
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
