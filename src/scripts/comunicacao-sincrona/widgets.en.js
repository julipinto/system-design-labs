/* SDLabs · Synchronous Communication: widgets in plain JS (English)
   (availability in series, ask × hold × be notified, webhook signature, order bytes, GraphQL N+1).
   They use the module story: Davi's order 1050 (2890 cents, Pix), PSP, charge c-7731, pedidos with 3 vCPU. */
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
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, max ? value / max * 100 : 0)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }
  function slider(id, label, min, max, step, value, unit, onInput) {
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = fmt(inp.value, 1) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', function () { sync(); onInput(); });
    sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }

  /* =============== LESSON 1: availability in series =============== */
  function wSerie(root) {
    var S = { n: 2, a: 2 };
    var NS = [1, 2, 3, 4, 5, 6];
    var AV = [0.99, 0.995, 0.999, 0.9995, 0.9999];
    var AL = ['99%', '99.5%', '99.9%', '99.95%', '99.99%'];
    var nB = [], aB = [];
    var out = el('div', { class: 'se-out', 'aria-live': 'polite' });
    var MES = 30 * 24 * 60;
    function pct(v) { return Number(v * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 }); }
    function mins(v) { return v < 10 ? fmt(v, 1) : fmt(Math.round(v), 0); }
    function render() {
      press(nB, S.n); press(aB, S.a);
      var n = NS[S.n], a = AV[S.a];
      var chain = Math.pow(a, n);
      var down = (1 - chain) * MES, alone = (1 - a) * MES;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('a single one', alone, down, mins(alone) + ' min', 'cap'));
      bars.appendChild(bar(n + (n === 1 ? ' hop' : ' hops'), down, down, mins(down) + ' min', n > 1 ? 'bad' : 'cap'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Math', AL[S.a] + ' ^ ' + n),
        fact('Availability of the chain', pct(chain) + '%'),
        fact('Down per month', mins(down) + ' min')
      ]));
      var msg = n === 1
        ? 'A single service: ' + mins(alone) + ' minutes per month down. It is the reference to compare against.'
        : n + ' services in series at ' + AL[S.a] + ' each: ' + pct(chain) + '%, ' + mins(down) + ' minutes per month, ' + fmt(down / alone, 1) + ' times that of a single one.' + (n === 3 && S.a === 2 ? ' Those are the 129 minutes from the lesson: pedidos, pagamentos and PSP.' : '');
      out.appendChild(el('p', { class: 'sr-verdict ' + (n > 1 ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'A 30-day month (43,200 min). The math assumes independent failures and equal repair time; a failure that spreads along the chain is worse than that.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Services in series' }));
    root.appendChild(chipRow('Services in series', NS.map(String), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Availability of each one' }));
    root.appendChild(chipRow('Availability of each one', AL, aB, function (i) { S.a = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 3: ask, hold or be notified =============== */
  function wEspera(root) {
    var CPU_MS = 2, VCPU = 3, TIMEOUT = 10, FD = 1024;
    var sN = slider('es-n', 'Screens waiting for the Pix', 100, 10000, 100, 5000, '', render);
    var sI = slider('es-i', 'Asks every', 1, 10, 1, 2, 's', render);
    var sT = slider('es-t', 'The Pix lands at', 1, 60, 0.1, 23.4, 's', render);
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function vc(rps) { return rps * CPU_MS / 1000; }
    function render() {
      var N = +sN.input.value, i = +sI.input.value, t = +sT.input.value;
      var reqs = Math.ceil(t / i - 1e-9);
      var shortRps = N / i, longRps = N / Math.min(TIMEOUT, t), hookRps = N / t;
      var rows = [
        { n: 'short polling', rps: shortRps, atraso: fmt(reqs * i - t, 1) + ' s on this Pix, ' + fmt(i / 2, 1) + ' s on average', extra: reqs + ' requests per screen, ' + (reqs - 1) + ' useless' },
        { n: 'long polling', rps: longRps, atraso: '~50 ms', extra: fmt(N, 0) + ' open connections' },
        { n: 'webhook', rps: hookRps, atraso: '~30 ms to the server', extra: '1 call per payment' }
      ];
      var maxRps = Math.max(shortRps, longRps, hookRps);
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      rows.forEach(function (r) {
        var v = vc(r.rps);
        bars.appendChild(bar(r.n, r.rps, maxRps, fmt(r.rps, 0) + ' req/s · ' + fmt(v, 1) + ' vCPU', v > VCPU ? 'bad' : 'win'));
      });
      out.appendChild(bars);
      var body = el('tbody');
      rows.forEach(function (r) {
        body.appendChild(el('tr', null, [el('th', { scope: 'row', text: r.n }), el('td', { text: r.atraso }), el('td', { text: r.extra })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'approach' }), el('th', { scope: 'col', text: 'delay until the screen knows' }), el('th', { scope: 'col', text: 'detail' })])]), body])]));
      var vS = vc(shortRps), vL = vc(longRps);
      var msg = vS > VCPU
        ? 'Short polling asks for ' + fmt(vS, 1) + ' vCPU just to hear "not yet", and the pedidos has ' + VCPU + ': it saturates. Long polling spends ' + fmt(vL, 1) + ' vCPU' + (N > FD ? ', but holds ' + fmt(N, 0) + ' connections, above the default 1,024 descriptors' : '') + '.'
        : 'Short polling fits in the ' + VCPU + ' vCPU of the pedidos (' + fmt(vS, 1) + ' vCPU), with a delay of ' + fmt(i / 2, 1) + ' s on average. Raise the screens or lower the interval to see the limit.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (vS > VCPU ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Cost of ' + CPU_MS + ' ms of CPU per request and pedidos with ' + VCPU + ' vCPU (3 replicas of 1, module 6). Long polling holds up to ' + TIMEOUT + ' s. The webhook reaches the server; the screen only sees it through long polling or WebSocket.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [sN.wrap, sI.wrap, sT.wrap]);
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 3: does the webhook signature check out? =============== */
  function wAssinatura(root) {
    var ORIG = { body: '{"evento_id":"ev-8812","tipo":"cobranca.paga","cobranca_id":"c-7731","valor_centavos":2890,"pago_em":"14:05:23"}', secret: 'segredo-de-exemplo', t: '1792000000', delay: 0 };
    var ORIG_V1 = '068149938cba8e09bb177226c07dc4123cf00f012211374b314e534c05eee13a';
    var S = { body: ORIG.body, secret: ORIG.secret, t: ORIG.t, delay: 0, v1: ORIG_V1 };
    var DELAYS = [0, 240, 360];
    var DL = ['arrived now', 'arrived 4 min later', 'arrived 6 min later'];
    var dB = [];
    var inBody = el('input', { type: 'text', class: 'ck-in', id: 'as-body', 'aria-label': 'Body received', spellcheck: 'false' });
    var inSecret = el('input', { type: 'text', class: 'ck-in', id: 'as-secret', 'aria-label': 'Store secret', spellcheck: 'false' });
    var inT = el('input', { type: 'text', class: 'ck-in', id: 'as-t', 'aria-label': 'Timestamp t', inputmode: 'numeric' });
    var inV = el('input', { type: 'text', class: 'ck-in', id: 'as-v1', 'aria-label': 'Signature v1 received', spellcheck: 'false' });
    var out = el('div', { class: 'as-out', 'aria-live': 'polite' });
    var seq = 0;

    function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
    function hmac(secret, msg) {
      var enc = new TextEncoder();
      return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
        .then(function (k) { return crypto.subtle.sign('HMAC', k, enc.encode(msg)); }).then(hex);
    }
    function sync() { inBody.value = S.body; inSecret.value = S.secret; inT.value = S.t; inV.value = S.v1; press(dB, DELAYS.indexOf(S.delay)); }
    function render() {
      var my = ++seq;
      if (!window.crypto || !crypto.subtle) {
        clear(out); out.appendChild(el('p', { class: 'sr-verdict bad', text: 'This browser has no WebCrypto outside a secure page; open the site over https.' })); return;
      }
      var signed = S.t + '.' + S.body;
      hmac(S.secret, signed).then(function (calc) {
        if (my !== seq) return;
        var match = calc === S.v1.trim().toLowerCase();
        var age = S.delay;
        var state = !match ? 'invalid' : (age > 300 ? 'expired' : 'valid');
        clear(out);
        out.appendChild(el('p', { class: 'sr-sub', text: 'What the pagamentos signs and compares' }));
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Body', new TextEncoder().encode(S.body).length + ' bytes'),
          fact('Age of the call', age === 0 ? 'now' : Math.round(age / 60) + ' min'),
          fact('Window', '5 min')
        ]));
        out.appendChild(el('pre', { class: 'as-pre' }, [el('code', { text: 'HMAC-SHA256("' + S.t + '." + body)\ncomputed: ' + calc + '\nreceived: ' + S.v1.trim().toLowerCase() })]));
        out.appendChild(el('p', { class: 'sr-verdict ' + (state === 'valid' ? '' : 'bad'), text:
          state === 'valid' ? 'Valid signature: the HMAC matches and the call is under 5 minutes old. The pagamentos stores the evento_id and answers 200.' :
          state === 'expired' ? 'Expired signature: the HMAC matches, but the call is more than 5 minutes old. It could be a recorded call being replayed, and the store refuses it.' :
          'Invalid signature: the computed HMAC is not the received one. The body was altered, the secret is different or the caller is not the PSP. The store refuses it.' }));
      }).catch(function () {
        if (my !== seq) return;
        clear(out); out.appendChild(el('p', { class: 'sr-verdict bad', text: 'Could not compute the HMAC in this browser.' }));
      });
    }
    function bind(inp, key) { inp.addEventListener('input', function () { S[key] = inp.value; render(); }); }
    bind(inBody, 'body'); bind(inSecret, 'secret'); bind(inT, 't'); bind(inV, 'v1');
    root.appendChild(el('p', { class: 'sr-sub', text: 'Body received' }));
    root.appendChild(inBody);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Signature v1 received' }));
    root.appendChild(inV);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Store secret and timestamp t' }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [inSecret, inT]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'When the call arrived' }));
    root.appendChild(chipRow('When the call arrived', DL, dB, function (i) { S.delay = DELAYS[i]; sync(); render(); }));
    var acts = el('div', { class: 'sr-chips' });
    [['Tamper with the amount (2890 → 1)', function () { S.body = ORIG.body.replace('2890', '1'); }],
     ['Wrong secret', function () { S.secret = 'outro-segredo'; }],
     ['Back to the original', function () { S.body = ORIG.body; S.secret = ORIG.secret; S.t = ORIG.t; S.delay = 0; S.v1 = ORIG_V1; }]
    ].forEach(function (a) {
      var b = el('button', { type: 'button', class: 'chip', text: a[0] });
      b.addEventListener('click', function () { a[1](); sync(); render(); });
      acts.appendChild(b);
    });
    root.appendChild(acts);
    root.appendChild(out);
    sync(); render();
  }

  /* =============== LESSON 5: order bytes =============== */
  function varint(n) {
    var b = [], v = BigInt(n);
    while (v >= 128n) { b.push(Number((v & 127n) | 128n)); v >>= 7n; }
    b.push(Number(v));
    return b;
  }
  function h2(a) { return a.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(' '); }
  function wBytes(root) {
    var BASE_1 = 229, BASE_N = 103, REF = 11;
    var inId = el('input', { type: 'number', id: 'by-id', min: '0', max: '9000000000000000', step: '1', value: '1050', 'aria-label': 'pedido_id' });
    var inVal = el('input', { type: 'number', id: 'by-val', min: '0', max: '9000000000000000', step: '1', value: '2890', 'aria-label': 'valor_centavos' });
    var inMeio = el('input', { type: 'text', id: 'by-meio', value: 'pix', maxlength: '40', 'aria-label': 'meio', spellcheck: 'false' });
    var out = el('div', { class: 'by-out', 'aria-live': 'polite' });
    function num(inp) { var v = Math.floor(Number(inp.value)); return isFinite(v) && v > 0 ? Math.min(v, 9e15) : 0; }
    function render() {
      var id = num(inId), val = num(inVal), meio = inMeio.value;
      var json = '{"pedido_id":' + id + ',"valor_centavos":' + val + ',"meio":' + JSON.stringify(meio) + '}';
      var jsonB = new TextEncoder().encode(json).length;
      var fields = [], total = 0;
      if (id) { var v = varint(id); fields.push({ f: 'pedido_id = 1', tag: [0x08], val: v, why: 'varint of ' + fmt(id, 0) }); }
      if (val) { var w = varint(val); fields.push({ f: 'valor_centavos = 2', tag: [0x10], val: w, why: 'varint of ' + fmt(val, 0) }); }
      var mb = Array.prototype.slice.call(new TextEncoder().encode(meio));
      if (mb.length) fields.push({ f: 'meio = 3', tag: [0x1a], val: varint(mb.length).concat(mb), why: mb.length + ' bytes of text' });
      fields.forEach(function (x) { total += x.tag.length + x.val.length; });
      var reqHead = 'POST /cobrancas HTTP/1.1\r\nHost: pagamentos:8080\r\nUser-Agent: pedidos-go/1.0\r\nAccept: application/json\r\nContent-Type: application/json\r\nContent-Length: ' + jsonB + '\r\n\r\n';
      var reqHeadB = reqHead.length;
      var rest = reqHeadB + jsonB + 150;
      var g1 = BASE_1 + (total - REF), gN = BASE_N + (total - REF);
      clear(out);
      var body = el('tbody');
      if (!fields.length) body.appendChild(el('tr', null, [el('td', { colspan: '3', text: 'Empty message: in proto3 the default value (0 and empty text) does not travel.' })]));
      fields.forEach(function (x) {
        body.appendChild(el('tr', null, [el('th', { scope: 'row', text: x.f }), el('td', { class: 'by-hex', text: h2(x.tag) + ' | ' + h2(x.val) }), el('td', { text: x.why })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'field' }), el('th', { scope: 'col', text: 'tag | value (hex)' }), el('th', { scope: 'col', text: 'what it is' })])]), body])]));
      out.appendChild(el('pre', { class: 'as-pre' }, [el('code', { text: json })]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Order JSON', jsonB + ' B'),
        fact('Protobuf', total + ' B'),
        fact('Smaller', jsonB && total ? fmt(jsonB / total, 1) + '×' : '–')
      ]));
      var max = Math.max(rest, g1);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('REST, every call', rest, max, rest + ' B', 'cap'));
      bars.appendChild(bar('gRPC, 1st call', g1, max, g1 + ' B', 'win'));
      bars.appendChild(bar('gRPC, 2nd on', gN, max, gN + ' B', 'win'));
      out.appendChild(bars);
      out.appendChild(el('p', { class: 'sr-verdict', text: 'REST: ' + reqHeadB + ' B of headers + ' + jsonB + ' B of body + 150 B of response = ' + rest + ' B. gRPC: ' + g1 + ' B on the 1st call and ' + gN + ' B from the 2nd on, ' + fmt(rest / gN, 1) + '× less than REST.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'With the lesson values (1050, 2890, pix) it is 360 B for REST and 229 B and 103 B for gRPC. The 229 B and 103 B were measured with grpc-go v1.62.1 on loopback; here only the message size changes (more or fewer bytes in the DATA frame). The response stays at 150 B (REST) and 18 B + headers (gRPC).' }));
    }
    [inId, inVal, inMeio].forEach(function (i) { i.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [
      el('div', { class: 'sr-ctl' }, [el('label', { for: 'by-id', text: 'pedido_id' }), inId]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: 'by-val', text: 'valor_centavos' }), inVal]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: 'by-meio', text: 'meio' }), inMeio])
    ]));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 7: GraphQL N+1 =============== */
  function wNmais1(root) {
    var S = { dl: 0 };
    var dB = [];
    var sN = slider('nm-n', 'Products in the list', 1, 50, 1, 20, '', render);
    var out = el('div', { class: 'nm-out', 'aria-live': 'polite' });
    var MS = 20;
    function render() {
      press(dB, S.dl);
      var N = +sN.input.value;
      var ingenuo = 1 + N, lote = 2;
      var usado = S.dl ? lote : ingenuo;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('naive resolver', ingenuo, ingenuo, ingenuo + ' calls', S.dl ? 'cap' : 'bad'));
      bars.appendChild(bar('with DataLoader', lote, ingenuo, lote + ' calls', 'win'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Calls to the estoque', String(usado)),
        fact('In series, at ' + MS + ' ms', fmt(usado * MS, 0) + ' ms')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (S.dl ? '' : 'bad'), text: S.dl
        ? 'DataLoader on: 1 call for the list and 1 batched call to the estoque, with the ' + N + ' ids together. That is 2 calls, whatever the size of the list.'
        : 'Naive resolver: 1 call for the list and ' + N + ' to the estoque, one per product: 1 + ' + N + ' = ' + ingenuo + '.' + (N === 20 ? ' That is the 21 from the lesson.' : '') }));
      out.appendChild(el('p', { class: 'sr-note', text: 'The ' + MS + ' ms per call is the example time of the stock reservation from module 11, and the math assumes the calls are in series.' }));
    }
    root.appendChild(sN.wrap);
    root.appendChild(el('p', { class: 'sr-sub', text: 'DataLoader' }));
    root.appendChild(chipRow('DataLoader', ['off', 'on'], dB, function (i) { S.dl = i; render(); }));
    root.appendChild(out);
    render();
  }

  var REG = { serie: wSerie, espera: wEspera, assinatura: wAssinatura, bytes: wBytes, nmais1: wNmais1 };
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
