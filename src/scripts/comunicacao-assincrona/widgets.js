/* SDLabs · Comunicação Assíncrona: widgets em JS puro
   (qual partição, lag e consumidores, perda com acks, fila única × filas separadas, QoS do MQTT).
   Usam a loja do brief: pedidos 1047 a 1051, tópico `pedidos` com 3 partições, entregas a 100 ms por evento,
   cópia para o seguidor em 10 ms, 50.000 e-mails promocionais a 100/s, PUBLISH de 77 B. */
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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 2 : d }); }
  function signed(v) { return (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('pt-BR', { useGrouping: false }); }

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
  function bar(label, value, max, text, cls) {
    return el('div', { class: 'sr-bar' }, [
      el('span', { text: label }),
      el('div', { class: 'sr-track' }, [
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, value / max * 100)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }
  var uid = 0;
  function slider(label, min, max, step, value, unit, fmtv) {
    var id = 'ca-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, sync: sync, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function field(label, type, value, attrs) {
    var id = 'ca-in-' + (++uid);
    var a = { id: id, type: type, value: String(value) };
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) a[k] = attrs[k];
    var inp = el('input', a);
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label]), inp]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table ca-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }

  /* =============== AULA 5: qual partição? murmur2 como o particionador do cliente Java =============== */
  function murmur2(str) {
    var d = Array.prototype.slice.call(new TextEncoder().encode(str)), len = d.length, m = 0x5bd1e995, r = 24;
    var h = (0x9747b28c ^ len) >>> 0, i = 0, k;
    for (var n = len >> 2; n > 0; n--, i += 4) {
      k = (d[i] | d[i + 1] << 8 | d[i + 2] << 16 | d[i + 3] << 24) >>> 0;
      k = Math.imul(k, m) >>> 0; k = (k ^ (k >>> r)) >>> 0; k = Math.imul(k, m) >>> 0;
      h = Math.imul(h, m) >>> 0; h = (h ^ k) >>> 0;
    }
    switch (len & 3) {
      case 3: h = (h ^ (d[i + 2] << 16)) >>> 0; /* falls through */
      case 2: h = (h ^ (d[i + 1] << 8)) >>> 0; /* falls through */
      case 1: h = (h ^ d[i]) >>> 0; h = Math.imul(h, m) >>> 0;
    }
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, m) >>> 0; h = (h ^ (h >>> 15)) >>> 0;
    return h | 0;
  }
  function partOf(key, n) { return (murmur2(key) & 0x7fffffff) % n; }

  function wParticao(root) {
    var key = field('Chave (pedido_id)', 'text', '1051', { inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', maxlength: '40' });
    var np = slider('Partições do tópico', 1, 12, 1, 3);
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });
    var IDS = ['1047', '1048', '1049', '1050', '1051'];

    function render() {
      var k = key.input.value.trim() || '0', n = +np.input.value;
      var h = murmur2(k), pos = h & 0x7fffffff, p = pos % n, p3 = pos % 3, p6 = pos % 6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('murmur2 (assinado)', signed(h)),
        fact('Sem o sinal', String(pos)),
        fact('Partição com ' + n, 'p' + p)
      ]));
      var moved = p3 !== p6;
      out.appendChild(el('p', { class: 'sr-verdict ' + (moved ? 'bad' : '') }, [
        el('strong', { text: 'Chave ' + k + ': p' + p3 + ' com 3 partições, p' + p6 + ' com 6. ' }),
        moved ? 'Ela muda de partição ao subir de 3 para 6: durante a transição, os eventos antigos ficam na p' + p3 + ' e os novos vão para a p' + p6 + ', e a ordem do pedido se perde.'
          : 'Ela fica na mesma partição nos dois casos, então a ordem desse pedido não é afetada.'
      ]));
      var rows = IDS.map(function (id) {
        var a = partOf(id, 3), b = partOf(id, 6), c = partOf(id, n);
        return { cls: id === k ? 'cr-cur' : '', cells: [{ text: id }, { text: signed(murmur2(id)) }, { text: 'p' + a }, { text: 'p' + b, cls: a !== b ? 'ca-cell bad' : '' }, { text: 'p' + c }] };
      });
      out.appendChild(table(['pedido_id', 'murmur2', 'com 3', 'com 6', 'com ' + n], rows));
      out.appendChild(el('p', { class: 'sr-note', text: 'Partição = (murmur2(chave) & 0x7fffffff) mod nº de partições, o particionador padrão do cliente Java. A função confere com os vetores de teste do Kafka ("21" dá −973932308, "foobar" dá −790332482). O NewHashPartitioner do sarama (Go) usa FNV-1a e dá outro resultado: a chave 1051 vai para p2 com 3 partições.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [key.wrap, np.wrap]));
    key.input.addEventListener('input', render);
    np.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: lag e consumidores =============== */
  function wLag(root) {
    var rate = slider('Eventos por segundo no tópico', 1, 300, 1, 30, '/s');
    var parts = slider('Partições', 1, 12, 1, 3);
    var ms = slider('Tempo por evento', 10, 500, 10, 100, 'ms');
    var cons = slider('Consumidores no grupo', 1, 15, 1, 3);
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });

    function render() {
      var R = +rate.input.value, P = +parts.input.value, M = +ms.input.value, C = +cons.input.value;
      var active = Math.min(C, P), idle = Math.max(0, C - P);
      var cap = active * 1000 / M;
      var growth = Math.max(0, R - cap) * 60;
      var per = R / active, limit = 1000 / M;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Capacidade do grupo', fmt(cap, 1) + '/s'),
        fact('Por consumidor ativo', fmt(per, 1) + '/s de ' + fmt(limit, 1)),
        fact('Lag por minuto', growth > 0 ? '+' + fmt(growth, 0) : '0'),
        fact('Consumidores ociosos', String(idle))
      ]));
      var max = Math.max(R, cap, 1);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Chegam', R, max, fmt(R, 0) + '/s', ''),
        bar('Processa', cap, max, fmt(cap, 1) + '/s', R > cap ? '' : 'win')
      ]));
      var bad = R > cap, edge = !bad && Math.abs(R - cap) < 0.05;
      var msg;
      if (bad) msg = 'O grupo processa ' + fmt(cap, 1) + '/s e chegam ' + fmt(R, 0) + '/s: o lag cresce ' + fmt(growth, 0) + ' eventos por minuto.';
      else if (edge) msg = 'O grupo está exatamente no limite: ' + fmt(cap, 0) + '/s contra ' + fmt(R, 0) + '/s. Qualquer rajada vira lag.';
      else msg = 'O grupo aguenta, com folga de ' + fmt(cap - R, 1) + '/s.';
      if (idle > 0) msg += ' ' + idle + (idle === 1 ? ' consumidor fica parado' : ' consumidores ficam parados') + ': com ' + P + ' partições, o grupo só usa ' + P + '. Mais consumidores não adianta; mais partições, sim (mas muda o hash da chave).';
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: bad ? 'Lag crescendo. ' : edge ? 'No limite. ' : 'Em dia. ' }), msg]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacidade = min(consumidores, partições) × 1000 ÷ ms por evento. Cada partição é lida por um consumidor do grupo, então o máximo útil é o número de partições.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Atalhos' });
    [['entregas na Black Friday', 30, 3, 100, 3], ['5 réplicas em 3 partições', 30, 3, 100, 5], ['6 partições, 6 consumidores', 30, 6, 100, 6], ['dia comum (20/s)', 20, 3, 100, 3]].forEach(function (p) {
      var b = el('button', { type: 'button', class: 'chip', text: p[0] });
      b.addEventListener('click', function () {
        rate.input.value = p[1]; parts.input.value = p[2]; ms.input.value = p[3]; cons.input.value = p[4];
        [rate, parts, ms, cons].forEach(function (s) { s.sync(); }); render();
      });
      presets.appendChild(b);
    });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rate.wrap, parts.wrap, ms.wrap, cons.wrap]));
    [rate, parts, ms, cons].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(presets);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: perda com acks =============== */
  function wAcks(root) {
    var ACKS = ['0', '1', 'all'];
    var S = { acks: 2 };
    var btns = [];
    var minisr = slider('min.insync.replicas', 1, 3, 1, 2);
    var isr = slider('Réplicas em dia (ISR)', 1, 3, 1, 3);
    var fail = slider('O líder cai em t =', 0, 50, 1, 5, 'ms');
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });
    var COPY = 10;

    function render() {
      var a = ACKS[S.acks], mi = +minisr.input.value, n = +isr.input.value, t = +fail.input.value;
      var copied = n >= 2 && t >= COPY;        // o seguidor já tem o evento quando o líder cai
      var ev = [[0, 'O produtor envia o PedidoPago (offset 48213) ao líder kafka-1']];
      var label, bad = false, text;
      if (a === 'all' && n < mi) {
        ev.push([0, 'A ISR tem ' + n + ' réplica' + (n === 1 ? '' : 's') + ', menos que min.insync.replicas = ' + mi]);
        label = 'Erro: NotEnoughReplicas. ';
        text = 'O líder recusa a escrita e o produtor recebe o erro. Nada foi gravado, nada se perdeu, e a partição para de aceitar eventos: disponibilidade perdida para não perder dado.';
        bad = true;
      } else {
        var ackAt = a === 'all' ? (mi <= 1 ? 0 : COPY) : 0;
        if (a === '0') ev.push([0, 'acks=0: o produtor não espera nenhuma confirmação']);
        else if (ackAt === 0) ev.push([0, 'O líder confirma ao produtor' + (a === 'all' ? ' (min.insync.replicas = 1: só o líder basta)' : '')]);
        if (n >= 2) ev.push([COPY, 'O seguidor termina de copiar o evento' + (a === 'all' && ackAt === COPY ? ' e o líder confirma ao produtor' : '')]);
        ev.push([t, 'O líder kafka-1 cai']);
        if (a !== '0' && ackAt > 0 && t < ackAt) {
          label = 'Não confirmado: o produtor repete. ';
          text = 'O líder caiu antes de ' + mi + ' réplicas terem o evento, então não confirmou. O produtor repete no novo líder e o evento entra (a idempotência evita duplicar). Nada se perde.';
          ev.push([t + 1, 'Sem confirmação, o produtor repete o envio ao novo líder']);
        } else if (!copied) {
          label = 'Evento perdido. ';
          text = (a === '0' ? 'O produtor nem esperou confirmação.' : 'O líder já tinha confirmado ao produtor.') +
            (n < 2 ? ' Não havia seguidor em dia.' : ' O seguidor só teria o evento em ' + COPY + ' ms, e o líder caiu em ' + t + ' ms.') +
            ' O novo líder não tem o PedidoPago: o estoque nunca vê o pagamento da Lena, e o produtor acha que enviou.';
          bad = true;
        } else {
          label = a === '0' ? 'Gravado, sem confirmação. ' : 'Confirmado e seguro. ';
          text = 'O seguidor já tinha copiado o evento quando o líder caiu (' + t + ' ms, contra ' + COPY + ' ms de cópia). O novo líder o tem' + (a === '0' ? ', embora o produtor não tenha como saber.' : '.');
        }
      }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: label }), text]));
      var rows = ev.sort(function (x, y) { return x[0] - y[0]; }).map(function (e) { return { cells: [{ text: e[0] + ' ms' }, { text: e[1] }] }; });
      out.appendChild(table(['quando', 'o que acontece'], rows, 'ca-wide'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Com acks=all e min.insync.replicas = 1, o líder sozinho basta e a proteção é a mesma do acks=1. O tempo de cópia de 10 ms e a queda do líder são exemplos.' }));
    }
    function pick(i) { S.acks = i; press(btns, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'acks do produtor' }));
    root.appendChild(chipRow('acks do produtor', ['acks=0', 'acks=1', 'acks=all'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [minisr.wrap, isr.wrap, fail.wrap]));
    [minisr, isr, fail].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== AULA 9: fila única × filas separadas =============== */
  function wEmails(root) {
    var promos = field('E-mails promocionais na fila (1 a 100.000)', 'number', 50000, { min: '1', max: '100000', step: '1', inputmode: 'numeric' });
    var rate = slider('Taxa do provedor', 10, 500, 10, 100, 'e-mails/s');
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });

    function dur(s) {
      if (s < 1) return fmt(s * 1000, 0) + ' ms';
      if (s < 60) return fmt(s, 1) + ' s';
      var m = Math.floor(s / 60), r = Math.round(s - m * 60);
      return m + ' min ' + r + ' s';
    }
    function render() {
      var P = Math.max(1, Math.min(100000, Math.floor(+promos.input.value) || 1)), R = +rate.input.value;
      var single = P / R, split = 1 / R;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Fila única', dur(single)),
        fact('Filas separadas', split < 1 ? 'menos de 1 s' : dur(split)),
        fact('Promoções terminam em', dur(P / R))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Fila única', single, Math.max(single, 1), dur(single), ''),
        bar('Separadas', split, Math.max(single, 1), split < 1 ? '< 1 s' : dur(split), 'win')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (single >= 60 ? 'bad' : '') }, [
        el('strong', { text: 'A confirmação do pedido 1051, da Lena. ' }),
        'Na fila única ela espera atrás de ' + fmt(P, 0) + ' promoções: ' + fmt(P, 0) + ' ÷ ' + R + ' = ' + fmt(single, 0) + ' s (' + dur(single) + '). Com a fila transacional separada ela sai em ' + (split < 1 ? 'menos de 1 s' : dur(split)) + '. A newsletter leva o mesmo tempo nos dois casos.'
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Conta feita com a taxa do provedor repartida com prioridade para a fila de transacionais (um consumidor dedicado a ela). O e-mail transacional é 1 mensagem: 1 ÷ taxa.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Atalhos' });
    [['Black Friday: 50.000', 50000], ['5.000', 5000], ['100.000', 100000]].forEach(function (p) {
      var b = el('button', { type: 'button', class: 'chip', text: p[0] });
      b.addEventListener('click', function () { promos.input.value = p[1]; render(); });
      presets.appendChild(b);
    });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [promos.wrap, rate.wrap]));
    promos.input.addEventListener('input', render);
    rate.input.addEventListener('input', render);
    root.appendChild(presets);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 7: QoS do MQTT =============== */
  function wQos(root) {
    var S = { q: 1, loss: 0 };
    var qb = [], lb = [];
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });
    var LOSS = ['nenhum', 'o PUBLISH', 'a confirmação'];

    function steps() {
      var q = S.q, loss = S.loss, st = [], pub = q === 0 ? 75 : 77;
      var P = function (name, dir, bytes, note, lost) { st.push({ name: name, dir: dir, bytes: bytes, note: note, lost: !!lost }); };
      var delivered = 0;
      if (q === 0) {
        if (loss === 1) { P('PUBLISH', 'caminhão → broker', pub, 'perdido na rede: ninguém reenvia', true); }
        else { P('PUBLISH', 'caminhão → broker', pub, 'sem confirmação', false); delivered = 1; }
      } else if (q === 1) {
        if (loss === 1) {
          P('PUBLISH', 'caminhão → broker', pub, 'perdido na rede', true);
          P('PUBLISH (DUP)', 'caminhão → broker', pub, 'sem PUBACK no prazo, o cliente reenvia', false); delivered = 1;
          P('PUBACK', 'broker → caminhão', 4, 'confirma', false);
        } else if (loss === 2) {
          P('PUBLISH', 'caminhão → broker', pub, 'o broker entrega ao assinante (1ª vez)', false); delivered = 1;
          P('PUBACK', 'broker → caminhão', 4, 'perdido na rede', true);
          P('PUBLISH (DUP)', 'caminhão → broker', pub, 'sem PUBACK, o cliente reenvia: o broker entrega de novo', false); delivered = 2;
          P('PUBACK', 'broker → caminhão', 4, 'confirma', false);
        } else {
          P('PUBLISH', 'caminhão → broker', pub, 'o broker entrega ao assinante', false); delivered = 1;
          P('PUBACK', 'broker → caminhão', 4, 'confirma', false);
        }
      } else {
        if (loss === 1) {
          P('PUBLISH', 'caminhão → broker', pub, 'perdido na rede', true);
          P('PUBLISH (DUP)', 'caminhão → broker', pub, 'o cliente reenvia', false);
          P('PUBREC', 'broker → caminhão', 4, 'recebi, guardei o identificador', false);
        } else if (loss === 2) {
          P('PUBLISH', 'caminhão → broker', pub, 'o broker guarda o identificador', false);
          P('PUBREC', 'broker → caminhão', 4, 'perdido na rede', true);
          P('PUBLISH (DUP)', 'caminhão → broker', pub, 'o cliente reenvia; o broker reconhece o identificador e não duplica', false);
          P('PUBREC', 'broker → caminhão', 4, 'recebi (de novo)', false);
        } else {
          P('PUBLISH', 'caminhão → broker', pub, 'o broker guarda o identificador', false);
          P('PUBREC', 'broker → caminhão', 4, 'recebi', false);
        }
        P('PUBREL', 'caminhão → broker', 4, 'pode liberar: o broker entrega ao assinante', false); delivered = 1;
        P('PUBCOMP', 'broker → caminhão', 4, 'concluído', false);
      }
      return { st: st, delivered: delivered };
    }
    function render() {
      var r = steps(), total = 0;
      r.st.forEach(function (s) { total += s.bytes; });
      clear(out);
      var rows = r.st.map(function (s, i) {
        return { cls: s.lost ? 'dl-wait' : '', cells: [{ text: String(i + 1) }, { text: s.name }, { text: s.dir }, { text: s.bytes + ' B' }, { text: s.lost ? 'PERDIDO: ' + s.note : s.note }] };
      });
      out.appendChild(table(['#', 'pacote', 'sentido', 'bytes', 'o que acontece'], rows, 'ca-wide'));
      var bad = r.delivered !== 1;
      var head = r.delivered === 0 ? 'Mensagem perdida. ' : r.delivered === 2 ? 'Mensagem duplicada. ' : 'Entregue uma vez. ';
      var say = r.delivered === 0 ? 'Com QoS 0 ninguém confirma e ninguém reenvia: a posição do caminhão se perdeu e o caminhão não sabe.'
        : r.delivered === 2 ? 'O QoS 1 é "pelo menos uma vez": o PUBACK se perdeu, o cliente reenviou e o assinante recebeu a mesma posição duas vezes. A posição é idempotente (vale a mais recente), então o rastreio aguenta.'
        : S.q === 0 ? 'Chegou, mas sem nenhuma garantia: com perda de pacote ela teria sumido.'
        : S.q === 1 ? 'O assinante recebeu uma vez; se a confirmação se perder, ele recebe duas (teste "a confirmação").'
        : 'O QoS 2 não duplica nem perde: os 4 pacotes guardam o identificador dos dois lados. Custa mais pacotes.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head }), say + ' Total na rede: ' + total + ' B em ' + r.st.length + ' pacotes.']));
      out.appendChild(el('p', { class: 'sr-note', text: 'PUBLISH de QoS 1 e 2 = 77 B (tópico de 33 B, payload de 38 B, identificador de 2 B); sem identificador, o de QoS 0 tem 75 B. PUBACK, PUBREC, PUBREL e PUBCOMP têm 4 B cada.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'QoS' }));
    root.appendChild(chipRow('QoS', ['QoS 0', 'QoS 1', 'QoS 2'], qb, function (i) { S.q = i; press(qb, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O que se perde na rede' }));
    root.appendChild(chipRow('O que se perde na rede', ['nada', 'o PUBLISH', 'a confirmação'], lb, function (i) { S.loss = i; press(lb, i); render(); }));
    root.appendChild(out);
    press(qb, 1); press(lb, 0);
    render();
  }

  var REG = { particao: wParticao, lag: wLag, acks: wAcks, emails: wEmails, qos: wQos };
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
