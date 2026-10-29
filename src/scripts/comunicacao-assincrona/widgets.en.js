/* SDLabs · Asynchronous Communication: widgets in plain JS (English)
   (which partition, lag and consumers, loss with acks, single queue vs separate queues, MQTT QoS).
   They use the store from the brief: orders 1047 to 1051, topic `pedidos` with 3 partitions, entregas at 100 ms per event,
   copy to the follower in 10 ms, 50,000 promotional emails at 100/s, 77 B PUBLISH. */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 2 : d }); }
  function signed(v) { return (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('en-US', { useGrouping: false }); }

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
    var key = field('Key (pedido_id)', 'text', '1051', { inputmode: 'numeric', autocomplete: 'off', spellcheck: 'false', maxlength: '40' });
    var np = slider('Topic partitions', 1, 12, 1, 3);
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });
    var IDS = ['1047', '1048', '1049', '1050', '1051'];

    function render() {
      var k = key.input.value.trim() || '0', n = +np.input.value;
      var h = murmur2(k), pos = h & 0x7fffffff, p = pos % n, p3 = pos % 3, p6 = pos % 6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('murmur2 (assinado)', signed(h)),
        fact('Without the sign', String(pos)),
        fact('Partition with ' + n, 'p' + p)
      ]));
      var moved = p3 !== p6;
      out.appendChild(el('p', { class: 'sr-verdict ' + (moved ? 'bad' : '') }, [
        el('strong', { text: 'Key ' + k + ': p' + p3 + ' with 3 partitions, p' + p6 + ' with 6. ' }),
        moved ? 'It changes partition when going from 3 to 6: during the transition, the old events stay on p' + p3 + ' and the new ones go to p' + p6 + ', and the order of the order is lost.'
          : 'It stays on the same partition in both cases, so the order of this order is not affected.'
      ]));
      var rows = IDS.map(function (id) {
        var a = partOf(id, 3), b = partOf(id, 6), c = partOf(id, n);
        return { cls: id === k ? 'cr-cur' : '', cells: [{ text: id }, { text: signed(murmur2(id)) }, { text: 'p' + a }, { text: 'p' + b, cls: a !== b ? 'ca-cell bad' : '' }, { text: 'p' + c }] };
      });
      out.appendChild(table(['pedido_id', 'murmur2', 'with 3', 'with 6', 'with ' + n], rows));
      out.appendChild(el('p', { class: 'sr-note', text: 'Partition = (murmur2(key) & 0x7fffffff) mod number of partitions, the default partitioner of the Java client. The function matches Kafka\'s test vectors ("21" gives −973932308, "foobar" gives −790332482). sarama\'s NewHashPartitioner (Go) uses FNV-1a and gives a different result: key 1051 goes to p2 with 3 partitions.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [key.wrap, np.wrap]));
    key.input.addEventListener('input', render);
    np.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: lag e consumidores =============== */
  function wLag(root) {
    var rate = slider('Events per second on the topic', 1, 300, 1, 30, '/s');
    var parts = slider('Partitions', 1, 12, 1, 3);
    var ms = slider('Time per event', 10, 500, 10, 100, 'ms');
    var cons = slider('Consumers in the group', 1, 15, 1, 3);
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });

    function render() {
      var R = +rate.input.value, P = +parts.input.value, M = +ms.input.value, C = +cons.input.value;
      var active = Math.min(C, P), idle = Math.max(0, C - P);
      var cap = active * 1000 / M;
      var growth = Math.max(0, R - cap) * 60;
      var per = R / active, limit = 1000 / M;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Group capacity', fmt(cap, 1) + '/s'),
        fact('Per active consumer', fmt(per, 1) + '/s of ' + fmt(limit, 1)),
        fact('Lag per minute', growth > 0 ? '+' + fmt(growth, 0) : '0'),
        fact('Idle consumers', String(idle))
      ]));
      var max = Math.max(R, cap, 1);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Arriving', R, max, fmt(R, 0) + '/s', ''),
        bar('Processed', cap, max, fmt(cap, 1) + '/s', R > cap ? '' : 'win')
      ]));
      var bad = R > cap, edge = !bad && Math.abs(R - cap) < 0.05;
      var msg;
      if (bad) msg = 'The group processes ' + fmt(cap, 1) + '/s and ' + fmt(R, 0) + '/s arrive: the lag grows by ' + fmt(growth, 0) + ' events per minute.';
      else if (edge) msg = 'The group is exactly at its limit: ' + fmt(cap, 0) + '/s against ' + fmt(R, 0) + '/s. Any burst turns into lag.';
      else msg = 'The group keeps up, with ' + fmt(cap - R, 1) + '/s to spare.';
      if (idle > 0) msg += ' ' + idle + (idle === 1 ? ' consumer sits idle' : ' consumers sit idle') + ': with ' + P + ' partitions, the group only uses ' + P + '. More consumers does not help; more partitions does (but it changes the key\'s hash).';
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: bad ? 'Lag growing. ' : edge ? 'At the limit. ' : 'Caught up. ' }), msg]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacity = min(consumers, partitions) × 1000 ÷ ms per event. Each partition is read by one consumer of the group, so the useful maximum is the number of partitions.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Shortcuts' });
    [['entregas on Black Friday', 30, 3, 100, 3], ['5 replicas on 3 partitions', 30, 3, 100, 5], ['6 partitions, 6 consumers', 30, 6, 100, 6], ['ordinary day (20/s)', 20, 3, 100, 3]].forEach(function (p) {
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
    var isr = slider('In-sync replicas (ISR)', 1, 3, 1, 3);
    var fail = slider('The leader goes down at t =', 0, 50, 1, 5, 'ms');
    var out = el('div', { class: 'ca-out', 'aria-live': 'polite' });
    var COPY = 10;

    function render() {
      var a = ACKS[S.acks], mi = +minisr.input.value, n = +isr.input.value, t = +fail.input.value;
      var copied = n >= 2 && t >= COPY;        // the follower already has the event when the leader goes down
      var ev = [[0, 'The producer sends the PedidoPago (offset 48213) to the leader kafka-1']];
      var label, bad = false, text;
      if (a === 'all' && n < mi) {
        ev.push([0, 'The ISR has ' + n + ' replica' + (n === 1 ? '' : 's') + ', fewer than min.insync.replicas = ' + mi]);
        label = 'Error: NotEnoughReplicas. ';
        text = 'The leader refuses the write and the producer gets the error. Nothing was written, nothing was lost, and the partition stops accepting events: availability lost to avoid losing data.';
        bad = true;
      } else {
        var ackAt = a === 'all' ? (mi <= 1 ? 0 : COPY) : 0;
        if (a === '0') ev.push([0, 'acks=0: the producer waits for no confirmation']);
        else if (ackAt === 0) ev.push([0, 'The leader confirms to the producer' + (a === 'all' ? ' (min.insync.replicas = 1: the leader alone is enough)' : '')]);
        if (n >= 2) ev.push([COPY, 'The follower finishes copying the event' + (a === 'all' && ackAt === COPY ? ' and the leader confirms to the producer' : '')]);
        ev.push([t, 'The leader kafka-1 goes down']);
        if (a !== '0' && ackAt > 0 && t < ackAt) {
          label = 'Not confirmed: the producer retries. ';
          text = 'The leader went down before ' + mi + ' replicas had the event, so it did not confirm. The producer retries on the new leader and the event goes in (idempotence prevents duplicating). Nothing is lost.';
          ev.push([t + 1, 'With no confirmation, the producer resends to the new leader']);
        } else if (!copied) {
          label = 'Event lost. ';
          text = (a === '0' ? 'The producer did not even wait for confirmation.' : 'The leader had already confirmed to the producer.') +
            (n < 2 ? ' There was no follower in sync.' : ' The follower would only have the event at ' + COPY + ' ms, and the leader went down at ' + t + ' ms.') +
            ' The new leader does not have the PedidoPago: estoque never sees Lena\'s payment, and the producer thinks it sent it.';
          bad = true;
        } else {
          label = a === '0' ? 'Written, no confirmation. ' : 'Confirmed and safe. ';
          text = 'The follower had already copied the event when the leader went down (' + t + ' ms, against ' + COPY + ' ms of copying). The new leader has it' + (a === '0' ? ', although the producer has no way to know.' : '.');
        }
      }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: label }), text]));
      var rows = ev.sort(function (x, y) { return x[0] - y[0]; }).map(function (e) { return { cells: [{ text: e[0] + ' ms' }, { text: e[1] }] }; });
      out.appendChild(table(['when', 'what happens'], rows, 'ca-wide'));
      out.appendChild(el('p', { class: 'sr-note', text: 'With acks=all and min.insync.replicas = 1, the leader alone is enough and the protection is the same as acks=1. The 10 ms copy time and the leader going down are examples.' }));
    }
    function pick(i) { S.acks = i; press(btns, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'producer acks' }));
    root.appendChild(chipRow('producer acks', ['acks=0', 'acks=1', 'acks=all'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [minisr.wrap, isr.wrap, fail.wrap]));
    [minisr, isr, fail].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== AULA 9: fila única × filas separadas =============== */
  function wEmails(root) {
    var promos = field('Promotional emails in the queue (1 to 100,000)', 'number', 50000, { min: '1', max: '100000', step: '1', inputmode: 'numeric' });
    var rate = slider('Provider rate', 10, 500, 10, 100, 'emails/s');
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
        fact('Single queue', dur(single)),
        fact('Separate queues', split < 1 ? 'under 1 s' : dur(split)),
        fact('Promotions finish in', dur(P / R))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Single queue', single, Math.max(single, 1), dur(single), ''),
        bar('Separate', split, Math.max(single, 1), split < 1 ? '< 1 s' : dur(split), 'win')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (single >= 60 ? 'bad' : '') }, [
        el('strong', { text: 'The confirmation for order 1051, Lena\'s. ' }),
        'In the single queue it waits behind ' + fmt(P, 0) + ' promotions: ' + fmt(P, 0) + ' ÷ ' + R + ' = ' + fmt(single, 0) + ' s (' + dur(single) + '). With the transactional queue separate it goes out in ' + (split < 1 ? 'under 1 s' : dur(split)) + '. The newsletter takes the same time in both cases.'
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Calculated with the provider\'s rate split with priority for the transactional queue (a consumer dedicated to it). The transactional email is 1 message: 1 ÷ rate.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Shortcuts' });
    [['Black Friday: 50,000', 50000], ['5,000', 5000], ['100,000', 100000]].forEach(function (p) {
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
    
    function steps() {
      var q = S.q, loss = S.loss, st = [], pub = q === 0 ? 75 : 77;
      var P = function (name, dir, bytes, note, lost) { st.push({ name: name, dir: dir, bytes: bytes, note: note, lost: !!lost }); };
      var delivered = 0;
      if (q === 0) {
        if (loss === 1) { P('PUBLISH', 'truck → broker', pub, 'lost on the network: nobody resends', true); }
        else { P('PUBLISH', 'truck → broker', pub, 'no acknowledgment', false); delivered = 1; }
      } else if (q === 1) {
        if (loss === 1) {
          P('PUBLISH', 'truck → broker', pub, 'lost on the network', true);
          P('PUBLISH (DUP)', 'truck → broker', pub, 'no PUBACK in time, the client resends', false); delivered = 1;
          P('PUBACK', 'broker → truck', 4, 'acknowledges', false);
        } else if (loss === 2) {
          P('PUBLISH', 'truck → broker', pub, 'the broker delivers to the subscriber (1st time)', false); delivered = 1;
          P('PUBACK', 'broker → truck', 4, 'lost on the network', true);
          P('PUBLISH (DUP)', 'truck → broker', pub, 'no PUBACK, the client resends: the broker delivers again', false); delivered = 2;
          P('PUBACK', 'broker → truck', 4, 'acknowledges', false);
        } else {
          P('PUBLISH', 'truck → broker', pub, 'the broker delivers to the subscriber', false); delivered = 1;
          P('PUBACK', 'broker → truck', 4, 'acknowledges', false);
        }
      } else {
        if (loss === 1) {
          P('PUBLISH', 'truck → broker', pub, 'lost on the network', true);
          P('PUBLISH (DUP)', 'truck → broker', pub, 'the client resends', false);
          P('PUBREC', 'broker → truck', 4, 'got it, stored the identifier', false);
        } else if (loss === 2) {
          P('PUBLISH', 'truck → broker', pub, 'the broker stores the identifier', false);
          P('PUBREC', 'broker → truck', 4, 'lost on the network', true);
          P('PUBLISH (DUP)', 'truck → broker', pub, 'the client resends; the broker recognizes the identifier and does not duplicate', false);
          P('PUBREC', 'broker → truck', 4, 'got it (again)', false);
        } else {
          P('PUBLISH', 'truck → broker', pub, 'the broker stores the identifier', false);
          P('PUBREC', 'broker → truck', 4, 'got it', false);
        }
        P('PUBREL', 'truck → broker', 4, 'release it: the broker delivers to the subscriber', false); delivered = 1;
        P('PUBCOMP', 'broker → truck', 4, 'done', false);
      }
      return { st: st, delivered: delivered };
    }
    function render() {
      var r = steps(), total = 0;
      r.st.forEach(function (s) { total += s.bytes; });
      clear(out);
      var rows = r.st.map(function (s, i) {
        return { cls: s.lost ? 'dl-wait' : '', cells: [{ text: String(i + 1) }, { text: s.name }, { text: s.dir }, { text: s.bytes + ' B' }, { text: s.lost ? 'LOST: ' + s.note : s.note }] };
      });
      out.appendChild(table(['#', 'packet', 'direction', 'bytes', 'what happens'], rows, 'ca-wide'));
      var bad = r.delivered !== 1;
      var head = r.delivered === 0 ? 'Message lost. ' : r.delivered === 2 ? 'Message duplicated. ' : 'Delivered once. ';
      var say = r.delivered === 0 ? 'With QoS 0 nobody acknowledges and nobody resends: the truck\'s position was lost and the truck does not know.'
        : r.delivered === 2 ? 'QoS 1 is "at least once": the PUBACK was lost, the client resent and the subscriber received the same position twice. The position is idempotent (the most recent one wins), so tracking copes.'
        : S.q === 0 ? 'It arrived, but with no guarantee: with packet loss it would have vanished.'
        : S.q === 1 ? 'The subscriber received it once; if the acknowledgment is lost, it receives it twice (try "the acknowledgment").'
        : 'QoS 2 neither duplicates nor loses: the 4 packets store the identifier on both sides. It costs more packets.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head }), say + ' Total on the network: ' + total + ' B in ' + r.st.length + ' packets.']));
      out.appendChild(el('p', { class: 'sr-note', text: 'QoS 1 and 2 PUBLISH = 77 B (33 B topic, 38 B payload, 2 B identifier); without the identifier, the QoS 0 one is 75 B. PUBACK, PUBREC, PUBREL and PUBCOMP are 4 B each.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'QoS' }));
    root.appendChild(chipRow('QoS', ['QoS 0', 'QoS 1', 'QoS 2'], qb, function (i) { S.q = i; press(qb, i); render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'What is lost on the network' }));
    root.appendChild(chipRow('What is lost on the network', ['nothing', 'the PUBLISH', 'the acknowledgment'], lb, function (i) { S.loss = i; press(lb, i); render(); }));
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
