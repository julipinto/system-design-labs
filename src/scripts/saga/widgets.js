/* SDLabs · Saga Pattern: widgets em JS puro
   (simulador da saga do 1057, coreografia × orquestração, máquina de estados, compensação com retry,
   probabilidades do laboratório, reserva presa e vigia de sagas).
   Usam a loja do brief: pedido 1057 (Davi, 58,00, Pix c-7732, espera de 41,2 s), 20:15:00.000, estorno de 3,65 s,
   laboratório com 10% de falha no estoque e 5% no pagamento, reserva de 10 min a 30 pedidos/s. */
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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d }); }
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
    var espera = slider('Espera do Pix (até o Davi pagar)', 1, 120, 0.1, 41.2, 's', function (v) { return fmt(v, 1); });
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
      out.appendChild(table(['Hora', 'Transição', 'Evento'], rows));
      var estorno = r.comps.indexOf('EstornarCobranca') >= 0;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Tempo até o fim', dur(r.total)),
        fact('Compensações', r.comps.length ? r.comps.join(' → ') : 'nenhuma'),
        fact('Estorno', estorno ? 'sim (R$ 58,00)' : 'não'),
        fact('Estado final', r.log[r.log.length - 1].para)
      ]));
      var head, say, bad = !!r.failed;
      if (!r.failed) {
        head = 'A saga termina em FINALIZADO.';
        say = 'Os três passos passam em ' + dur(r.total) + ', e dessa soma ' + fmt(E / 1000, 1) + ' s são a espera do Pix.';
      } else if (!estorno && r.order.indexOf('cobrar') > r.order.indexOf(r.failed)) {
        head = 'Falhou antes de cobrar: sem estorno.';
        say = 'Nada foi cobrado, então não há dinheiro a devolver. ' + (r.comps.length > 1 ? 'Só se desfaz o que já passou: ' + r.comps.slice(0, -1).join(', ') + '. ' : '') +
          'O preço dessa ordem é outro: a reserva fica presa enquanto o cliente decide pagar (aula 10).';
      } else if (r.failed === 'cobrar') {
        head = 'A cobrança falhou.';
        say = 'O PSP recusou depois de ' + fmt(E / 1000, 1) + ' s de espera. ' + (r.comps.length > 1 ? 'Desfaz-se o que já passou: ' + r.comps.slice(0, -1).join(', ') + '.' : 'Não há nada a desfazer além do pedido.');
      } else {
        head = 'A saga compensa na ordem inversa.';
        say = 'Desfaz o que já tinha passado: ' + r.comps.join(', ') + '. O Davi viu o dinheiro sair e voltar.';
      }
      out.appendChild(verdict(bad && estorno, head, say));
      out.appendChild(el('p', { class: 'sr-note', text: 'Tempos de exemplo, medidos no 1057 (reservar 40 ms, estorno 3,65 s, 20 ms entre passos); agendar (60 ms) e liberar (40 ms) são estimativas. LIBERANDO aparece só aqui, para mostrar a segunda compensação. Com a ordem da loja, a espera de 41,2 s e a falha no estoque, o total é 44,95 s; com a ordem do laboratório, cerca de 100 ms.' }));
    }
    root.appendChild(chipRow('Ordem dos passos', ['Cobrar antes (a loja)', 'Reservar antes (o laboratório)'], bo, function (i) { S.o = i; press(bo, i); render(); }));
    root.appendChild(chipRow('Passo que falha', ['Nenhum', 'Cobrar', 'Reservar', 'Agendar'], bf, function (i) { S.f = i; press(bf, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [espera.wrap]));
    espera.input.addEventListener('input', render);
    root.appendChild(out);
    press(bo, 0); press(bf, 2);
    render();
  }

  /* =============== AULA 5: coreografia × orquestração =============== */
  function wCoreoOrq(root) {
    var n = slider('Passos depois do pedido', 2, 8, 1, 3, '', function (v) { return String(v); });
    var f = slider('Passo que falha', 1, 3, 1, 2, '', function (v) { return String(v); });
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
        fact('Coreografia', co + ' eventos'),
        fact('Orquestração', orq + ' mensagens + 1 de início'),
        fact('Lugares que sabem tudo', '0 contra 1'),
        fact('Dependências para trás', back + ' contra 0')
      ]));
      out.appendChild(table(['', 'coreografia', 'orquestração'], [
        { cells: [{ text: 'Conta' }, { text: fail ? '1 + ' + (F - 1) + ' + 1 + ' + (F - 1) + ' + 1 = ' + co : '1 + ' + N + ' = ' + co }, { text: fail ? '2·' + F + ' + 2·' + (F - 1) + ' + 2 = ' + orq : '2 · ' + N + ' = ' + orq }] },
        { cells: [{ text: 'Onde está o fluxo' }, { text: 'espalhado em ' + (N + 1) + ' serviços' }, { text: 'no orquestrador' }] },
        { cells: [{ text: 'Se um cai' }, { text: 'a saga para sem ninguém saber' }, { text: 'o orquestrador sabe e espera' }] }
      ]));
      out.appendChild(verdict(false, 'O orquestrador custa ' + (orq - co) + (Math.abs(orq - co) === 1 ? ' mensagem' : ' mensagens') + ' a ' + (orq >= co ? 'mais' : 'menos') + '.',
        'E paga com um lugar que sabe tudo: o fluxo, a vigia e a métrica moram nele, e todo pedido o atravessa. A coreografia não tem centro, mas o fluxo não está em lugar nenhum e cada serviço que pode falhar depois obriga os anteriores a escutá-lo (' + back + ' setas para trás no pior caso).'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Com 3 passos (cobrar, reservar, agendar) a coreografia usa 4 eventos no sucesso e 5 na falha do estoque, e a orquestração 6 e 8, mais 1 de início. A conta para falha supõe que os passos anteriores ao que falhou foram todos compensados e que o pedido é cancelado no fim.' }));
    }
    root.appendChild(chipRow('Resultado', ['Tudo certo', 'Um passo falha'], btns, function (i) { S.fail = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, f.wrap]));
    [n, f].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 1);
    render();
  }

  /* =============== AULA 6: máquina de estados =============== */
  var STATES = ['(nada)', 'NOVO', 'COBRANDO', 'PAGO', 'RESERVANDO', 'RESERVADO', 'AGENDANDO', 'COMPENSANDO', 'ESTORNANDO', 'FINALIZADO', 'CANCELADO', 'INTERVENCAO'];
  var FINAL = { FINALIZADO: 1, CANCELADO: 1, INTERVENCAO: 1 };
  var EVENTS = [
    { v: 'criado', t: 'PedidoCriado' },
    { v: 'avancar', t: 'avançar (a saga manda o próximo comando)' },
    { v: 'pago', t: 'PedidoPago' },
    { v: 'prazo', t: 'prazo da cobrança vencido' },
    { v: 'reservado', t: 'EstoqueReservado' },
    { v: 'indisponivel', t: 'EstoqueIndisponivel' },
    { v: 'agendada', t: 'EntregaAgendada' },
    { v: 'entregafalhou', t: 'EntregaFalhou' },
    { v: 'estornado', t: 'PagamentoEstornado' },
    { v: 'esgotou', t: 'estorno esgotou as tentativas' }
  ];
  var TRANS = [
    ['(nada)', 'criado', 'NOVO', 'grava a saga s-1057'],
    ['NOVO', 'avancar', 'COBRANDO', 'manda a cobrança Pix c-7732'],
    ['COBRANDO', 'pago', 'PAGO', 'registra os 58,00'],
    ['COBRANDO', 'prazo', 'CANCELADO', 'cancela o pedido (nada a estornar)'],
    ['PAGO', 'avancar', 'RESERVANDO', 'manda ReservarEstoque'],
    ['RESERVANDO', 'reservado', 'RESERVADO', 'registra a reserva'],
    ['RESERVANDO', 'indisponivel', 'COMPENSANDO', 'guarda o motivo sem_estoque'],
    ['RESERVADO', 'avancar', 'AGENDANDO', 'manda AgendarEntrega'],
    ['AGENDANDO', 'agendada', 'FINALIZADO', 'avisa o cliente'],
    ['AGENDANDO', 'entregafalhou', 'COMPENSANDO', 'guarda o motivo da falha'],
    ['COMPENSANDO', 'avancar', 'ESTORNANDO', 'manda EstornarCobranca c-7732 (chave estorno-c-7732)'],
    ['ESTORNANDO', 'estornado', 'CANCELADO', 'cancela o pedido e avisa o Davi'],
    ['ESTORNANDO', 'esgotou', 'INTERVENCAO', 'alerta com todos os dados (chama gente)']
  ];
  function evLabel(v) { for (var i = 0; i < EVENTS.length; i++) if (EVENTS[i].v === v) return EVENTS[i].t; return v; }

  function wMaquina(root) {
    var btns = [];
    var st = select('Estado atual', STATES.map(function (s) { return { v: s, t: s }; }), 'COBRANDO');
    var ev = select('Evento que chegou', EVENTS.map(function (e) { return { v: e.v, t: e.t }; }), 'pago');
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'PedidoPago em COBRANDO', s: 'COBRANDO', e: 'pago' },
      { t: 'O mesmo PedidoPago em RESERVANDO', s: 'RESERVANDO', e: 'pago' },
      { t: 'EstoqueIndisponivel em RESERVANDO', s: 'RESERVANDO', e: 'indisponivel' },
      { t: 'PedidoPago em CANCELADO', s: 'CANCELADO', e: 'pago' }
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
        fact('Estado atual', s),
        fact('Evento', evLabel(e)),
        fact('Próximo estado', tr ? tr[2] : s + ' (não muda)'),
        fact('transitar(...) devolve', verdictLabel)
      ]));
      if (tr) {
        out.appendChild(verdict(false, 'A transição passa.', 'UPDATE saga SET estado = \'' + tr[2] + '\', versao = versao + 1 WHERE estado = \'' + s + '\' afeta 1 linha. Ação: ' + tr[3] + '. A linha vai para o log.' + (FINAL[tr[2]] ? ' ' + tr[2] + ' é um estado final' + (tr[2] === 'INTERVENCAO' ? ' e o único que chama gente.' : '.') : '')));
      } else {
        var expected = TRANS.filter(function (x) { return x[1] === e; }).map(function (x) { return x[0]; });
        var why;
        if (FINAL[s]) why = 'A saga já terminou em ' + s + ': nenhum evento mexe mais nela.';
        else {
          var idx = STATES.indexOf(s);
          var before = expected.every(function (x) { return STATES.indexOf(x) < idx; });
          var after = expected.every(function (x) { return STATES.indexOf(x) > idx; });
          var lista = expected.join(' ou ');
          why = before ? 'É uma duplicata (ou atraso): esse evento só serve em ' + lista + ', e a saga já passou desse ponto.'
            : after ? 'Chegou fora de ordem: esse evento só serve em ' + lista + ', e a saga ainda não chegou lá.'
            : 'Esse evento só serve em ' + lista + ', e a saga está em ' + s + '.';
        }
        out.appendChild(verdict(true, 'Ignorado (f).', 'UPDATE ... WHERE estado = \'' + (expected[0] || '?') + '\' afeta 0 linhas, e nada vai para o log. ' + why));
      }
      var rows = TRANS.map(function (x) {
        return { cls: tr && x === tr ? 'sg-cur' : '', cells: [{ text: x[0] }, { text: evLabel(x[1]) }, { text: x[2] }, { text: x[3] }] };
      });
      out.appendChild(table(['Estado', 'Evento', 'Próximo', 'Ação'], rows));
    }
    function preset(i) { st.input.value = PRESETS[i].s; ev.input.value = PRESETS[i].e; press(btns, i); render(); }
    root.appendChild(chipRow('Situações do 1057', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [st.wrap, ev.wrap]));
    [st, ev].forEach(function (s) { s.input.addEventListener('change', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 6: vigia de sagas =============== */
  function wVigia(root) {
    var prazo = slider('Prazo por estado', 1, 120, 1, 30, 'min', function (v) { return String(v); });
    var taxa = slider('Sagas que ficam paradas por hora', 1, 60, 1, 12, '/h', function (v) { return String(v); });
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
        fact('Sagas paradas', String(list.length)),
        fact('A vigia expira agora', String(exp.length)),
        fact('Ainda no prazo', String(list.length - exp.length)),
        fact('Espera máxima antes de compensar', P + ' min')
      ]));
      var shown = exp.slice(0, 10);
      if (shown.length) {
        out.appendChild(table(['Saga', 'Estado', 'Parada desde', 'Há'], shown.map(function (x) {
          return { cells: [{ text: x.id }, { text: x.estado }, { text: hhmm(x.age) }, { text: fmt(x.age, 0) + ' min' }] };
        })));
        if (exp.length > shown.length) out.appendChild(el('p', { class: 'sr-note', text: '… e mais ' + (exp.length - shown.length) + ' sagas na lista.' }));
      }
      out.appendChild(verdict(exp.length === 0 ? false : true,
        exp.length === 0 ? 'Nenhuma saga passou do prazo.' : exp.length + (exp.length === 1 ? ' saga passou' : ' sagas passaram') + ' do prazo de ' + P + ' min.',
        'A vigia as expira e dispara a compensação. ' + (exp.length === 0 ? 'Com um prazo tão longo, a saga de teste de 60 min ainda não é achada: o cliente espera ' + P + ' min por uma resposta.' : 'Um prazo curto acha cedo, mas pode expirar um Pix que o Davi ainda ia pagar; um prazo longo deixa o dinheiro e o estoque parados.')));
      out.appendChild(el('p', { class: 'sr-note', text: 'Exemplo: são 20:20, a s-teste está parada em COBRANDO desde 19:20 (a que a vigia real achou, com prazo de 30 min), e as outras N sagas pararam uniformemente na última hora. Os ids s-xNN são de exemplo. Sem vigia, nenhuma sai do estado.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [prazo.wrap, taxa.wrap]));
    [prazo, taxa].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 7: compensação com retry =============== */
  function wCompensacao(root) {
    var n = slider('Repetições depois da primeira falha', 1, 8, 1, 5, '', function (v) { return String(v); });
    var base = slider('Base do backoff', 0.5, 4, 0.5, 1, 's', function (v) { return fmt(v, 1); });
    var p = slider('Chance de o PSP responder (por tentativa)', 0, 100, 5, 50, '%', function (v) { return String(v); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var N = +n.input.value, B = +base.input.value, pr = +p.input.value / 100;
      var waits = [], sum = 0;
      for (var i = 0; i < N; i++) { var w = B * Math.pow(2, i); waits.push(w); sum += w; }
      var pFail = Math.pow(1 - pr, N + 1);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Esperas', waits.map(function (w) { return fmt(w, 1); }).join(' + ') + ' s'),
        fact('Soma das esperas', fmt(sum, 1) + ' s'),
        fact('Tentativas no total', String(N + 1)),
        fact('Chance de INTERVENCAO', pct(pFail, 2))
      ]));
      out.appendChild(table(['conta', 'resultado'], [
        { cells: [{ text: 'Soma' }, { text: B + ' × (2^' + N + ' − 1) = ' + fmt(B, 1) + ' × ' + (Math.pow(2, N) - 1) + ' = ' + fmt(sum, 1) + ' s' }] },
        { cells: [{ text: 'Todas falham' }, { text: '(1 − ' + fmt(pr, 2) + ')^' + (N + 1) + ' = ' + pct(pFail, 2) }] },
        { cls: pFail > 0.05 ? 'sg-bad' : '', cells: [{ text: 'A saga vai para' }, { text: pFail > 0.5 ? 'INTERVENCAO, na maioria das vezes' : 'CANCELADO, na maioria das vezes' }] }
      ]));
      out.appendChild(verdict(pFail > 0.05, pFail > 0.05 ? 'Mais de 5% das sagas chamam gente.' : 'Poucas sagas chamam gente.',
        'O estorno usa a chave estorno-c-7732, então repetir não estorna duas vezes. A saga aguenta um PSP fora do ar por até ' + fmt(sum, 1) + ' s; se a queda for maior, vai para INTERVENCAO mesmo com o PSP voltando depois.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Padrão da loja: 5 repetições com base de 1 s (1, 2, 4, 8 e 16 s, soma 31 s). A chance de resposta por tentativa é um exemplo e supõe tentativas independentes: um PSP que caiu de verdade responde mal a todas.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, base.wrap, p.wrap]));
    [n, base, p].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: probabilidades do laboratório =============== */
  function wProb(root) {
    var btns = [], S = { o: 0 };
    var pe = slider('Falha no estoque', 0, 30, 1, 10, '%', function (v) { return String(v); });
    var pp = slider('Falha no pagamento', 0, 30, 1, 5, '%', function (v) { return String(v); });
    var nn = slider('Pedidos', 1, 1000, 1, 20, '', function (v) { return fmt(v, 0); });
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
        fact('Sucessos esperados', pct(ok, 1) + ' (' + fmt(N * ok, 1) + ' de ' + fmt(N, 0) + ')'),
        fact('Falha no estoque', fmt(N * fe, 1) + ' (' + pct(fe, 1) + ')'),
        fact('Falha no pagamento', fmt(N * fp, 1) + ' (' + pct(fp, 1) + ')'),
        fact('Estornos', fmt(est, 1))
      ]));
      out.appendChild(table(['conta', 'resultado'], lab ? [
        { cells: [{ text: 'Sucesso' }, { text: '(1 − ' + fmt(E, 2) + ') × (1 − ' + fmt(P, 2) + ') = ' + pct(ok, 1) }] },
        { cells: [{ text: 'Falha no estoque' }, { text: fmt(E, 2) + ' → só CANCEL_ORDER (1 compensação)' }] },
        { cells: [{ text: 'Falha no pagamento' }, { text: '(1 − ' + fmt(E, 2) + ') × ' + fmt(P, 2) + ' = ' + pct(fp, 1) + ' → RELEASE_STOCK e CANCEL_ORDER (2)' }] },
        { cells: [{ text: 'Compensações no total' }, { text: fmt(comps, 1) + ' comandos, ' + fmt(lib, 1) + ' liberações de estoque' }] }
      ] : [
        { cells: [{ text: 'Sucesso' }, { text: '(1 − ' + fmt(P, 2) + ') × (1 − ' + fmt(E, 2) + ') = ' + pct(ok, 1) }] },
        { cells: [{ text: 'Falha no pagamento' }, { text: fmt(P, 2) + ' → só CancelarPedido (nada a estornar)' }] },
        { cls: est > 0 ? 'sg-bad' : '', cells: [{ text: 'Falha no estoque' }, { text: '(1 − ' + fmt(P, 2) + ') × ' + fmt(E, 2) + ' = ' + pct(fe, 1) + ' → EstornarCobranca e CancelarPedido (2)' }] },
        { cells: [{ text: 'Compensações no total' }, { text: fmt(comps, 1) + ' comandos, ' + fmt(est, 1) + ' estornos' }] }
      ]));
      out.appendChild(verdict(!lab && est > 0,
        lab ? 'Ordem do laboratório: nenhum estorno.' : 'Ordem da loja: cada falha de estoque vira um estorno.',
        'A taxa de sucesso é a mesma nas duas ordens (' + pct(ok, 1) + '). O que muda é o que se desfaz: ' + (lab ? 'liberar estoque (barato), com a reserva presa como preço (aula 10).' : 'devolver dinheiro ao cliente, com taxa possível e tempo (44,95 s no 1057).')));
      out.appendChild(el('p', { class: 'sr-note', text: 'Padrão: 10% e 5%, 20 pedidos, ordem do laboratório: 85,5% (17,1 de 20), 2,0 falhas no estoque e 0,9 no pagamento. Na ordem da loja, com 10% de estoque e pagamento antes, a conta exata dá 1,9 estornos (2,0 se o pagamento nunca falhasse). Valores esperados: uma rodada de 20 pedidos varia.' }));
    }
    root.appendChild(chipRow('Ordem dos passos', ['Estoque antes de cobrar (o laboratório)', 'Cobrar antes do estoque (a loja)'], btns, function (i) { S.o = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pe.wrap, pp.wrap, nn.wrap]));
    [pe, pp, nn].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 10: reserva presa =============== */
  function wReserva(root) {
    var rate = slider('Pedidos por segundo', 1, 60, 1, 30, '/s', function (v) { return String(v); });
    var desist = slider('Desistem do Pix', 0, 50, 1, 20, '%', function (v) { return String(v); });
    var prazo = slider('Prazo da reserva', 1, 30, 1, 10, 'min', function (v) { return String(v); });
    var out = el('div', { class: 'sg-out', 'aria-live': 'polite' });
    function render() {
      var R = +rate.input.value, D = +desist.input.value / 100, M = +prazo.input.value;
      var presas = R * D * M * 60, porMin = R * D * 60;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Unidades presas', fmt(presas, 0)),
        fact('Reservas que expiram', fmt(porMin, 0) + ' por minuto'),
        fact('Desistências por segundo', fmt(R * D, 1)),
        fact('Prazo em segundos', fmt(M * 60, 0) + ' s')
      ]));
      out.appendChild(table(['conta', 'resultado'], [
        { cells: [{ text: 'Unidades presas' }, { text: R + ' × ' + fmt(D, 2) + ' × ' + (M * 60) + ' = ' + fmt(presas, 0) }] },
        { cells: [{ text: 'Cada uma segura o estoque por' }, { text: M + ' min, até a vigia liberar' }] }
      ]));
      out.appendChild(verdict(presas >= 1000, presas >= 1000 ? 'Milhares de unidades paradas.' : 'Poucas unidades presas.',
        'É o preço de reservar antes de cobrar: cada Pix abandonado segura a unidade até o prazo. A expiração da reserva é uma compensação (LiberarEstoque). Na ordem da loja não há reserva presa, mas cada falha de estoque vira estorno.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Exemplo da aula 10: 30 pedidos/s, 20% de desistência e 10 min dão 30 × 0,2 × 600 = 3.600. É a média de unidades presas em regime (a taxa de entrada vezes o tempo de espera).' }));
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
