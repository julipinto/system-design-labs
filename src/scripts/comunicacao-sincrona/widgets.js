/* SDLabs · Comunicação Síncrona: widgets em JS puro
   (disponibilidade em série, perguntar × segurar × ser avisado, assinatura do webhook, bytes do pedido, N+1 do GraphQL).
   Usam a história do brief: pedido 1050 do Davi (2890 centavos, Pix), PSP, cobrança c-7731, pedidos com 3 vCPU. */
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

  /* =============== AULA 1: disponibilidade em série =============== */
  function wSerie(root) {
    var S = { n: 2, a: 2 };
    var NS = [1, 2, 3, 4, 5, 6];
    var AV = [0.99, 0.995, 0.999, 0.9995, 0.9999];
    var AL = ['99%', '99,5%', '99,9%', '99,95%', '99,99%'];
    var nB = [], aB = [];
    var out = el('div', { class: 'se-out', 'aria-live': 'polite' });
    var MES = 30 * 24 * 60;
    function pct(v) { return Number(v * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 }); }
    function mins(v) { return v < 10 ? fmt(v, 1) : fmt(Math.round(v), 0); }
    function render() {
      press(nB, S.n); press(aB, S.a);
      var n = NS[S.n], a = AV[S.a];
      var chain = Math.pow(a, n);
      var down = (1 - chain) * MES, alone = (1 - a) * MES;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('um sozinho', alone, down, mins(alone) + ' min', 'cap'));
      bars.appendChild(bar(n + (n === 1 ? ' salto' : ' saltos'), down, down, mins(down) + ' min', n > 1 ? 'bad' : 'cap'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Conta', AL[S.a] + ' ^ ' + n),
        fact('Disponibilidade da cadeia', pct(chain) + '%'),
        fact('Fora do ar por mês', mins(down) + ' min')
      ]));
      var msg = n === 1
        ? 'Um serviço só: ' + mins(alone) + ' minutos por mês fora do ar. É a referência para comparar.'
        : n + ' serviços em série com ' + AL[S.a] + ' cada: ' + pct(chain) + '%, ' + mins(down) + ' minutos por mês, ' + fmt(down / alone, 1) + ' vezes o de um sozinho.' + (n === 3 && S.a === 2 ? ' São os 129 minutos da aula: pedidos, pagamentos e PSP.' : '');
      out.appendChild(el('p', { class: 'sr-verdict ' + (n > 1 ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Mês de 30 dias (43.200 min). A conta supõe falhas independentes e tempo de reparo igual; uma falha que se propaga em cadeia é pior que isso.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Serviços em série' }));
    root.appendChild(chipRow('Serviços em série', NS.map(String), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Disponibilidade de cada um' }));
    root.appendChild(chipRow('Disponibilidade de cada um', AL, aB, function (i) { S.a = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 3: perguntar, segurar ou ser avisado =============== */
  function wEspera(root) {
    var CPU_MS = 2, VCPU = 3, TIMEOUT = 10, FD = 1024;
    var sN = slider('es-n', 'Telas esperando o Pix', 100, 10000, 100, 5000, '', render);
    var sI = slider('es-i', 'Pergunta a cada', 1, 10, 1, 2, 's', render);
    var sT = slider('es-t', 'O Pix cai aos', 1, 60, 0.1, 23.4, 's', render);
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function vc(rps) { return rps * CPU_MS / 1000; }
    function render() {
      var N = +sN.input.value, i = +sI.input.value, t = +sT.input.value;
      var reqs = Math.ceil(t / i - 1e-9);
      var shortRps = N / i, longRps = N / Math.min(TIMEOUT, t), hookRps = N / t;
      var rows = [
        { n: 'short polling', rps: shortRps, atraso: fmt(reqs * i - t, 1) + ' s neste Pix, ' + fmt(i / 2, 1) + ' s em média', extra: reqs + ' requisições por tela, ' + (reqs - 1) + ' inúteis' },
        { n: 'long polling', rps: longRps, atraso: '~50 ms', extra: fmt(N, 0) + ' conexões abertas' },
        { n: 'webhook', rps: hookRps, atraso: '~30 ms até o servidor', extra: '1 chamada por pagamento' }
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
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'jeito' }), el('th', { scope: 'col', text: 'atraso até a tela saber' }), el('th', { scope: 'col', text: 'detalhe' })])]), body])]));
      var vS = vc(shortRps), vL = vc(longRps);
      var msg = vS > VCPU
        ? 'O short polling pede ' + fmt(vS, 1) + ' vCPU só para ouvir "ainda não", e o pedidos tem ' + VCPU + ': satura. O long polling gasta ' + fmt(vL, 1) + ' vCPU' + (N > FD ? ', mas segura ' + fmt(N, 0) + ' conexões, acima do 1.024 padrão de descritores' : '') + '.'
        : 'O short polling cabe nos ' + VCPU + ' vCPU do pedidos (' + fmt(vS, 1) + ' vCPU), com atraso de ' + fmt(i / 2, 1) + ' s em média. Suba as telas ou baixe o intervalo para ver o limite.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (vS > VCPU ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Custo de ' + CPU_MS + ' ms de CPU por requisição e pedidos com ' + VCPU + ' vCPU (3 réplicas de 1, módulo 6). O long polling segura até ' + TIMEOUT + ' s. O webhook chega ao servidor; a tela só vê pelo long polling ou pelo WebSocket.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [sN.wrap, sI.wrap, sT.wrap]);
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 3: a assinatura do webhook confere? =============== */
  function wAssinatura(root) {
    var ORIG = { body: '{"evento_id":"ev-8812","tipo":"cobranca.paga","cobranca_id":"c-7731","valor_centavos":2890,"pago_em":"14:05:23"}', secret: 'segredo-de-exemplo', t: '1792000000', delay: 0 };
    var ORIG_V1 = '068149938cba8e09bb177226c07dc4123cf00f012211374b314e534c05eee13a';
    var S = { body: ORIG.body, secret: ORIG.secret, t: ORIG.t, delay: 0, v1: ORIG_V1 };
    var DELAYS = [0, 240, 360];
    var DL = ['chegou agora', 'chegou 4 min depois', 'chegou 6 min depois'];
    var dB = [];
    var inBody = el('input', { type: 'text', class: 'ck-in', id: 'as-body', 'aria-label': 'Corpo recebido', spellcheck: 'false' });
    var inSecret = el('input', { type: 'text', class: 'ck-in', id: 'as-secret', 'aria-label': 'Segredo da loja', spellcheck: 'false' });
    var inT = el('input', { type: 'text', class: 'ck-in', id: 'as-t', 'aria-label': 'Carimbo t', inputmode: 'numeric' });
    var inV = el('input', { type: 'text', class: 'ck-in', id: 'as-v1', 'aria-label': 'Assinatura v1 recebida', spellcheck: 'false' });
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
        clear(out); out.appendChild(el('p', { class: 'sr-verdict bad', text: 'Este navegador não tem WebCrypto fora de uma página segura; abra o site por https.' })); return;
      }
      var signed = S.t + '.' + S.body;
      hmac(S.secret, signed).then(function (calc) {
        if (my !== seq) return;
        var match = calc === S.v1.trim().toLowerCase();
        var age = S.delay;
        var state = !match ? 'inválida' : (age > 300 ? 'expirada' : 'válida');
        clear(out);
        out.appendChild(el('p', { class: 'sr-sub', text: 'O que o pagamentos assina e compara' }));
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Corpo', new TextEncoder().encode(S.body).length + ' bytes'),
          fact('Idade da chamada', age === 0 ? 'agora' : Math.round(age / 60) + ' min'),
          fact('Janela', '5 min')
        ]));
        out.appendChild(el('pre', { class: 'as-pre' }, [el('code', { text: 'HMAC-SHA256("' + S.t + '." + corpo)\ncalculado: ' + calc + '\nrecebido:  ' + S.v1.trim().toLowerCase() })]));
        out.appendChild(el('p', { class: 'sr-verdict ' + (state === 'válida' ? '' : 'bad'), text:
          state === 'válida' ? 'Assinatura válida: o HMAC bate e a chamada tem menos de 5 minutos. O pagamentos guarda o evento_id e responde 200.' :
          state === 'expirada' ? 'Assinatura expirada: o HMAC bate, mas a chamada tem mais de 5 minutos. Pode ser uma chamada gravada e reenviada, e a loja recusa.' :
          'Assinatura inválida: o HMAC calculado não é o recebido. O corpo foi mexido, o segredo é outro ou quem chamou não é o PSP. A loja recusa.' }));
      }).catch(function () {
        if (my !== seq) return;
        clear(out); out.appendChild(el('p', { class: 'sr-verdict bad', text: 'Não consegui calcular o HMAC neste navegador.' }));
      });
    }
    function bind(inp, key) { inp.addEventListener('input', function () { S[key] = inp.value; render(); }); }
    bind(inBody, 'body'); bind(inSecret, 'secret'); bind(inT, 't'); bind(inV, 'v1');
    root.appendChild(el('p', { class: 'sr-sub', text: 'Corpo recebido' }));
    root.appendChild(inBody);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Assinatura v1 recebida' }));
    root.appendChild(inV);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Segredo da loja e carimbo t' }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [inSecret, inT]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Quando a chamada chegou' }));
    root.appendChild(chipRow('Quando a chamada chegou', DL, dB, function (i) { S.delay = DELAYS[i]; sync(); render(); }));
    var acts = el('div', { class: 'sr-chips' });
    [['Adulterar o valor (2890 → 1)', function () { S.body = ORIG.body.replace('2890', '1'); }],
     ['Segredo errado', function () { S.secret = 'outro-segredo'; }],
     ['Voltar ao original', function () { S.body = ORIG.body; S.secret = ORIG.secret; S.t = ORIG.t; S.delay = 0; S.v1 = ORIG_V1; }]
    ].forEach(function (a) {
      var b = el('button', { type: 'button', class: 'chip', text: a[0] });
      b.addEventListener('click', function () { a[1](); sync(); render(); });
      acts.appendChild(b);
    });
    root.appendChild(acts);
    root.appendChild(out);
    sync(); render();
  }

  /* =============== AULA 5: bytes do pedido =============== */
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
      if (id) { var v = varint(id); fields.push({ f: 'pedido_id = 1', tag: [0x08], val: v, why: 'varint de ' + fmt(id, 0) }); }
      if (val) { var w = varint(val); fields.push({ f: 'valor_centavos = 2', tag: [0x10], val: w, why: 'varint de ' + fmt(val, 0) }); }
      var mb = Array.prototype.slice.call(new TextEncoder().encode(meio));
      if (mb.length) fields.push({ f: 'meio = 3', tag: [0x1a], val: varint(mb.length).concat(mb), why: mb.length + ' bytes de texto' });
      fields.forEach(function (x) { total += x.tag.length + x.val.length; });
      var reqHead = 'POST /cobrancas HTTP/1.1\r\nHost: pagamentos:8080\r\nUser-Agent: pedidos-go/1.0\r\nAccept: application/json\r\nContent-Type: application/json\r\nContent-Length: ' + jsonB + '\r\n\r\n';
      var reqHeadB = reqHead.length;
      var rest = reqHeadB + jsonB + 150;
      var g1 = BASE_1 + (total - REF), gN = BASE_N + (total - REF);
      clear(out);
      var body = el('tbody');
      if (!fields.length) body.appendChild(el('tr', null, [el('td', { colspan: '3', text: 'Mensagem vazia: no proto3 o valor padrão (0 e texto vazio) não viaja.' })]));
      fields.forEach(function (x) {
        body.appendChild(el('tr', null, [el('th', { scope: 'row', text: x.f }), el('td', { class: 'by-hex', text: h2(x.tag) + ' | ' + h2(x.val) }), el('td', { text: x.why })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'campo' }), el('th', { scope: 'col', text: 'etiqueta | valor (hex)' }), el('th', { scope: 'col', text: 'o que é' })])]), body])]));
      out.appendChild(el('pre', { class: 'as-pre' }, [el('code', { text: json })]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('JSON do pedido', jsonB + ' B'),
        fact('Protobuf', total + ' B'),
        fact('Menor', jsonB && total ? fmt(jsonB / total, 1) + '×' : '–')
      ]));
      var max = Math.max(rest, g1);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('REST, toda chamada', rest, max, rest + ' B', 'cap'));
      bars.appendChild(bar('gRPC, 1ª chamada', g1, max, g1 + ' B', 'win'));
      bars.appendChild(bar('gRPC, 2ª em diante', gN, max, gN + ' B', 'win'));
      out.appendChild(bars);
      out.appendChild(el('p', { class: 'sr-verdict', text: 'REST: ' + reqHeadB + ' B de cabeçalhos + ' + jsonB + ' B de corpo + 150 B de resposta = ' + rest + ' B. gRPC: ' + g1 + ' B na 1ª chamada e ' + gN + ' B da 2ª em diante, ' + fmt(rest / gN, 1) + '× menos que o REST.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Com os valores da aula (1050, 2890, pix) são 360 B de REST e 229 B e 103 B de gRPC. Os 229 B e 103 B foram medidos com grpc-go v1.62.1 em loopback; aqui só o tamanho da mensagem muda (mais ou menos bytes no quadro DATA). A resposta fica em 150 B (REST) e 18 B + cabeçalhos (gRPC).' }));
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

  /* =============== AULA 7: o N+1 do GraphQL =============== */
  function wNmais1(root) {
    var S = { dl: 0 };
    var dB = [];
    var sN = slider('nm-n', 'Produtos na lista', 1, 50, 1, 20, '', render);
    var out = el('div', { class: 'nm-out', 'aria-live': 'polite' });
    var MS = 20;
    function render() {
      press(dB, S.dl);
      var N = +sN.input.value;
      var ingenuo = 1 + N, lote = 2;
      var usado = S.dl ? lote : ingenuo;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('resolver ingênuo', ingenuo, ingenuo, ingenuo + ' chamadas', S.dl ? 'cap' : 'bad'));
      bars.appendChild(bar('com DataLoader', lote, ingenuo, lote + ' chamadas', 'win'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chamadas ao estoque', String(usado)),
        fact('Em série, a ' + MS + ' ms', fmt(usado * MS, 0) + ' ms')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (S.dl ? '' : 'bad'), text: S.dl
        ? 'DataLoader ligado: 1 chamada para a lista e 1 em lote para o estoque, com os ' + N + ' ids juntos. São 2 chamadas, qualquer que seja o tamanho da lista.'
        : 'Resolver ingênuo: 1 chamada para a lista e ' + N + ' ao estoque, uma por produto: 1 + ' + N + ' = ' + ingenuo + '.' + (N === 20 ? ' É o 21 da aula.' : '') }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Os ' + MS + ' ms por chamada são o tempo de exemplo da reserva de estoque do módulo 11, e a conta supõe as chamadas em série.' }));
    }
    root.appendChild(sN.wrap);
    root.appendChild(el('p', { class: 'sr-sub', text: 'DataLoader' }));
    root.appendChild(chipRow('DataLoader', ['desligado', 'ligado'], dB, function (i) { S.dl = i; render(); }));
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
