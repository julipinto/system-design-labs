/* SDLabs · BFF: widgets em JS puro (calculadora da tela inicial, "Qual BFF?", timeout e fallback).
   Todos usam a loja do brief: a home do app da Lena (4G 120 ms, Wi-Fi 30 ms), serviço mais lento 25 ms,
   180 KB sem BFF e 12 KB com o bff-app, pedido 1048, timeout de 100 ms. */
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
  function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 }); }

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
  function table(rows) {
    var tb = el('tbody');
    rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })])); });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]);
  }
  function ctl(label, input, output) {
    return el('div', { class: 'sr-ctl' }, [el('label', null, [el('span', { text: label }), output]), input]);
  }

  /* =============== AULA 2: calculadora da tela inicial =============== */
  var SERVICE_MS = 25, ASSEMBLE_MS = 5;
  var NETS = [{ n: '4G: 120 ms', rtt: 120 }, { n: 'Wi-Fi: 30 ms', rtt: 30 }];
  var SIZES = [{ n: '180 KB (JSON do site)', kb: 180 }, { n: '12 KB (sob medida)', kb: 12 }];
  function timeFor(bff, calls, rtt) { return bff ? rtt + SERVICE_MS + ASSEMBLE_MS : calls * rtt; }
  function wHome(root) {
    var S = { net: 0, bff: 0, size: 0, calls: 4, opens: 10 };
    var nB = [], mB = [], zB = [];
    var callsIn = el('input', { type: 'range', min: '1', max: '8', step: '1', value: '4', 'aria-label': 'Chamadas que a tela precisa' });
    var callsOut = el('output');
    var opensIn = el('input', { type: 'range', min: '1', max: '30', step: '1', value: '10', 'aria-label': 'Aberturas do app por dia' });
    var opensOut = el('output');
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(nB, S.net); press(mB, S.bff); press(zB, S.size);
      var rtt = NETS[S.net].rtt, kb = SIZES[S.size].kb, bff = S.bff === 1;
      callsOut.textContent = S.calls + (S.calls === 1 ? ' chamada' : ' chamadas');
      opensOut.textContent = S.opens + ' por dia';
      var t = timeFor(bff, S.calls, rtt), other = timeFor(!bff, S.calls, rtt);
      var mb = kb * S.opens * 30 / 1024;
      clear(out);
      var how = bff
        ? '1 viagem de ' + rtt + ' ms + ' + SERVICE_MS + ' ms do serviço mais lento (em paralelo) + ' + ASSEMBLE_MS + ' ms para montar = ' + fmt(t) + ' ms'
        : S.calls + ' viagens em fila × ' + rtt + ' ms = ' + fmt(t) + ' ms';
      out.appendChild(table([
        ['Chamadas do celular', bff ? '1 (o BFF faz as outras ' + S.calls + ')' : String(S.calls)],
        ['Tempo da tela', how],
        ['Dados por abertura', fmt(kb) + ' KB'],
        ['Dados por mês', fmt(mb) + ' MB (' + S.opens + ' aberturas por dia × 30 dias)']
      ]));
      var better = t <= other;
      out.appendChild(el('p', { class: 'ib-verdict ' + (better ? 'ok' : 'bad'), text: bff
        ? (t < other ? 'O BFF poupa ' + fmt(other - t) + ' ms: sem ele seriam ' + fmt(other) + ' ms.' : 'Com ' + S.calls + (S.calls === 1 ? ' chamada' : ' chamadas') + ' o BFF não ajuda no tempo (' + fmt(other) + ' ms sem ele): ele só compensa quando há mais de uma viagem para juntar.')
        : (S.calls === 1 ? 'Com uma chamada só, não há o que juntar: o BFF não ajudaria no tempo.' : 'Sem BFF: ' + fmt(t) + ' ms. Com o BFF seriam ' + fmt(other) + ' ms.') }));
    }
    callsIn.addEventListener('input', function () { S.calls = Number(callsIn.value); render(); });
    opensIn.addEventListener('input', function () { S.opens = Number(opensIn.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Rede do celular' }));
    root.appendChild(chipRow('Rede', NETS.map(function (x) { return x.n; }), nB, function (i) { S.net = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Quem monta a tela' }));
    root.appendChild(chipRow('Quem monta a tela', ['Sem BFF: uma chamada depois da outra', 'Com BFF: 1 chamada, serviços em paralelo'], mB, function (i) { S.bff = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Tamanho da resposta' }));
    root.appendChild(chipRow('Tamanho da resposta', SIZES.map(function (x) { return x.n; }), zB, function (i) { S.size = i; render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ctl('Chamadas que a tela precisa', callsIn, callsOut), ctl('Aberturas do app', opensIn, opensOut)]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A conta da loja é 4G, 4 chamadas, 180 KB sem BFF (480 ms) e 12 KB com o bff-app (150 ms). Para simplificar, cada chamada sem BFF conta só a viagem de rede; o tempo dos serviços entra na conta do BFF.' }));
    render();
  }

  /* =============== AULA 3: qual BFF? (o status do pedido 1048 em cada canal) =============== */
  var CANAIS = [
    { n: 'bff-app', dono: 'time do app', fmt: 'JSON pequeno', cut: 'descrição longa, fotos em alta e campos internos',
      body: '{ "pedido": { "id": 1048, "status": "a caminho" },\n  "foto": "gato-96.webp" }',
      note: 'O app desenha a tela sozinho, então recebe só os campos dela e uma miniatura. O token JWT já foi conferido pelo gateway.' },
    { n: 'bff-web', dono: 'time do site', fmt: 'página HTML (SSR)', cut: 'nada: o site mostra mais coisas, com fotos grandes',
      body: '<h1>Pedido 1048</h1>\n<p>Status: a caminho</p>\n<img src="gato-800.webp" alt="gato de pelúcia">',
      note: 'O servidor monta a página inteira e guarda a sessão da Bia no cache central (o Redis do módulo 5).' },
    { n: 'bff-voz', dono: 'time da voz', fmt: 'frase curta de texto', cut: 'foto, ids, estruturas: só o que dá para falar',
      body: '"Seu pedido 1048 está a caminho e chega quinta."',
      note: 'A Lena pergunta "cadê meu pedido?" e a resposta já vem pronta para ser lida em voz alta.' },
    { n: 'marketplace-xyz (gateway)', dono: 'API pública, sem BFF', fmt: 'JSON genérico e estável', cut: 'nada é adaptado: o contrato é o mesmo para todo parceiro',
      body: '{ "pedido": 1048, "status": "a_caminho" }',
      note: 'Parceiro externo fica na API pública do gateway. BFF é para frontend próprio.' }
  ];
  function wCanal(root) {
    var S = { c: 0 };
    var cB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(cB, S.c);
      var c = CANAIS[S.c];
      clear(out);
      out.appendChild(el('p', { class: 'sr-sub', text: 'O que chega a este canal' }));
      out.appendChild(el('pre', { class: 'bf-body' }, [el('code', { text: c.body })]));
      out.appendChild(table([
        ['Formato', c.fmt],
        ['Quem cuida', c.dono],
        ['O que fica de fora', c.cut]
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: c.note }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Pedido 1048, visto por cada canal' }));
    root.appendChild(chipRow('Canal', CANAIS.map(function (c) { return c.n; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: timeout e fallback =============== */
  var DELAYS = [{ n: '25 ms (normal)', ms: 25 }, { n: '90 ms', ms: 90 }, { n: '150 ms', ms: 150 }, { n: '400 ms', ms: 400 }, { n: '30 s (preso)', ms: 30000 }];
  var TIMEOUTS = [{ n: 'Timeout de 100 ms', ms: 100 }, { n: 'Sem timeout', ms: 0 }];
  function wTimeout(root) {
    var S = { d: 0, t: 0 };
    var dB = [], tB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(dB, S.d); press(tB, S.t);
      var X = DELAYS[S.d].ms, T = TIMEOUTS[S.t].ms, RTT = 120;
      var cut = T > 0 && X > T;
      var waited = cut ? T : X;
      var total = RTT + Math.max(SERVICE_MS, waited) + ASSEMBLE_MS;
      var gone = T === 0 && X >= 30000;
      var rows = [
        ['O recomendacoes demora', X >= 1000 ? fmt(X / 1000) + ' s' : X + ' ms'],
        ['O bff-app espera', cut ? T + ' ms e desiste' : (X >= 1000 ? fmt(X / 1000) + ' s' : X + ' ms')],
        ['Tela da Lena', gone ? 'não chega' : fmt(total) + ' ms'],
        ['Seção "quem comprou também comprou"', cut ? 'fora, com "recomendado": []' : (gone ? '-' : 'presente (caneca azul)')]
      ];
      clear(out);
      out.appendChild(table(rows));
      var cls, msg;
      if (gone) {
        cls = 'bad';
        msg = 'Sem timeout, cada tela fica presa por 30 s. As conexões se acumulam até o bff-app cair, e a tela inicial inteira some, não só as recomendações.';
      } else if (cut) {
        cls = 'ok';
        msg = 'A Lena vê a tela em ' + fmt(total) + ' ms, sem as recomendações. O fallback cobriu a falha e ela nem percebeu.';
      } else if (X > 100) {
        cls = 'bad';
        msg = 'A tela chega, mas leva ' + fmt(total) + ' ms por causa de uma seção que só enfeita. Sem timeout, a lentidão de um serviço vira lentidão da tela.';
      } else {
        cls = 'ok';
        msg = 'Tudo dentro do prazo: a tela chega em ' + fmt(total) + ' ms com as quatro seções.';
      }
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: msg }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. Quanto o recomendacoes demora' }));
    root.appendChild(chipRow('Tempo do recomendacoes', DELAYS.map(function (x) { return x.n; }), dB, function (i) { S.d = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. O que o bff-app faz' }));
    root.appendChild(chipRow('Timeout', TIMEOUTS.map(function (x) { return x.n; }), tB, function (i) { S.t = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O que a Lena vê' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A tela leva 120 ms de rede no 4G + o serviço mais lento (no mínimo 25 ms) + 5 ms para montar. Com timeout, o serviço mais lento conta no máximo 100 ms.' }));
    render();
  }

  var REG = { 'tela-inicial': wHome, 'qual-bff': wCanal, timeout: wTimeout };
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
