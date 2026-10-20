/* SDLabs · Service Mesh: widgets em JS puro
   (tempestade de retries, "quem pode chamar?", custo do sidecar contra o do ambient, "a loja precisa de malha?").
   Usam a loja do brief: 30 pods em 3 nós, 6 serviços em 3 linguagens, pedidos → pagamentos, sidecar de 0,1 vCPU e 50 MB. */
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
  function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

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
  function slider(id, label, min, max, step, value, unit) {
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = inp.value + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }

  /* =============== AULA 2: tempestade de retries =============== */
  function wRetryStorm(root) {
    var S = { hops: 2, tries: 2, clicks: 0 };
    var HOPS = ['1 salto', '2 saltos', '3 saltos'];
    var TRIES = ['1 tentativa', '2 tentativas', '3 tentativas', '4 tentativas'];
    var CLICKS = [1, 10, 100];
    var hB = [], tB = [], cB = [];
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });

    function render() {
      press(hB, S.hops); press(tB, S.tries); press(cB, S.clicks);
      var hops = S.hops + 1, tries = S.tries + 1, clicks = CLICKS[S.clicks];
      var storm = Math.pow(tries, hops);
      var perClick = storm * clicks;
      var lastOnly = tries * clicks;
      var budget = Math.min(perClick, clicks + Math.max(3, Math.ceil(clicks * 0.2)));
      var max = perClick;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('sem limite', perClick, max, fmt(perClick) + ' chamadas', storm > tries ? 'bad' : 'cap'));
      bars.appendChild(bar('só no último', lastOnly, max, fmt(lastOnly) + ' chamadas', 'cap'));
      bars.appendChild(bar('orçamento', budget, max, fmt(budget) + ' chamadas', 'win'));
      out.appendChild(bars);
      var how = [];
      for (var i = 0; i < hops; i++) how.push(tries);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Conta por clique' }), el('b', { text: how.join(' × ') + ' = ' + fmt(storm) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Saltos com retry' }), el('b', { text: hops + ' de 3' })])
      ]));
      var bad = storm > tries;
      var msg;
      if (storm === 1) msg = 'Sem retry nenhum: 1 chamada por clique. Seguro, mas qualquer 503 passageiro chega à Lena.';
      else if (hops === 1) msg = 'Retry num salto só: no máximo ' + tries + ' chamadas ao pagamentos por clique. É o que a malha faz com a regra do Envoy do pedidos.';
      else msg = 'Cada tentativa de cima dispara todas as de baixo: ' + how.join(' × ') + ' = ' + fmt(storm) + ' chamadas por clique ao pagamentos' + (clicks > 1 ? ', ' + fmt(perClick) + ' com ' + clicks + ' cliques' : '') + '.' + (hops === 3 && tries === 3 ? ' São as 27 da aula.' : '');
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Os saltos contam do pagamentos para cima: pedidos → pagamentos, bff-app → pedidos e app da Lena → bff-app. O orçamento do Envoy deixa os retries em andamento chegarem a 20% das chamadas ativas, com um piso de 3 retries por vez (retry_budget). Aqui: chamadas + o maior entre 3 e 20% delas.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Saltos com retry' }));
    root.appendChild(chipRow('Saltos com retry', HOPS, hB, function (i) { S.hops = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Tentativas por salto (a original conta)' }));
    root.appendChild(chipRow('Tentativas por salto', TRIES, tB, function (i) { S.tries = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Cliques ao mesmo tempo' }));
    root.appendChild(chipRow('Cliques ao mesmo tempo', CLICKS.map(function (c) { return c + (c === 1 ? ' clique' : ' cliques'); }), cB, function (i) { S.clicks = i; render(); }));
    root.appendChild(out);
    S.hops = 2; S.tries = 2; render();
  }

  /* =============== AULA 2: quem pode chamar o pagamentos? =============== */
  function wAuthz(root) {
    var POLICIES = [
      { n: 'Sem política', t: 'Nenhuma AuthorizationPolicy no pagamentos: toda chamada que passa no mTLS é aceita.',
        ok: function () { return true; } },
      { n: 'Só o pedidos (ALLOW)', t: 'ALLOW com principals: loja.local/ns/loja/sa/pedidos. Qualquer outro é negado, mas o pedidos pode fazer qualquer chamada.',
        ok: function (o) { return o === 'pedidos'; } },
      { n: 'Só o pedidos em POST /cobrancas', t: 'ALLOW com principals do pedidos e operation POST em /cobrancas. É a regra da loja.',
        ok: function (o, c) { return o === 'pedidos' && c === 0; } }
    ];
    var ORIGINS = ['pedidos', 'catalogo', 'bff-app', 'relatorios'];
    var CALLS = ['POST /cobrancas', 'GET /cobrancas/1048'];
    var S = { p: 2 };
    var pB = [];
    var out = el('div', { class: 'az-out', 'aria-live': 'polite' });

    function render() {
      press(pB, S.p);
      var P = POLICIES[S.p];
      clear(out);
      out.appendChild(el('p', { class: 'ev-say', text: P.t }));
      var head = el('tr', null, [el('th', { scope: 'col', text: 'quem chama' })].concat(CALLS.map(function (c) { return el('th', { scope: 'col', text: c }); })));
      var body = el('tbody');
      ORIGINS.forEach(function (o) {
        var cells = [el('th', { scope: 'row', text: o })];
        CALLS.forEach(function (c, ci) {
          var ok = P.ok(o, ci);
          cells.push(el('td', { class: 'az-cell ' + (ok ? 'ok' : 'bad'), text: ok ? '200' : '403' }));
        });
        body.appendChild(el('tr', null, cells));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table az-table' }, [el('thead', null, [head]), body])]));
      var denied = 0;
      ORIGINS.forEach(function (o) { CALLS.forEach(function (c, ci) { if (!P.ok(o, ci)) denied++; }); });
      out.appendChild(el('p', { class: 'sr-verdict ' + (denied ? '' : 'bad'), text: denied
        ? denied + ' de 8 chamadas voltam 403 com o corpo RBAC: access denied, sem nenhuma linha de código no pagamentos.'
        : 'Nada é barrado: o catalogo e o relatorios conseguem cobrar. Sem política, a identidade do mTLS não decide nada.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Política do pagamentos' }));
    root.appendChild(chipRow('Política do pagamentos', POLICIES.map(function (p) { return p.n; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: custo do sidecar contra o do ambient =============== */
  function wSidecarCost(root) {
    var CPU = 0.1, MB = 50;
    var pods = slider('mesh-pods', 'Pods da loja', 10, 100, 10, 30, 'pods');
    var nodes = slider('mesh-nodes', 'Nós do cluster', 1, 10, 1, 3, 'nós');
    var wps = slider('mesh-wp', 'Waypoints', 0, 3, 1, 1, 'waypoints');
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });

    function mem(mb) { return mb >= 1000 ? fmt(mb / 1000) + ' GB' : fmt(mb) + ' MB'; }
    function render() {
      var p = +pods.input.value, n = +nodes.input.value, w = +wps.input.value;
      var sCpu = p * CPU, sMb = p * MB;
      var aProx = n + w, aCpu = aProx * CPU, aMb = aProx * MB;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('sidecar vCPU', sCpu, Math.max(sCpu, aCpu), fmt(sCpu) + ' vCPU', 'cap'));
      bars.appendChild(bar('ambient vCPU', aCpu, Math.max(sCpu, aCpu), fmt(aCpu) + ' vCPU', 'win'));
      bars.appendChild(bar('sidecar mem.', sMb, Math.max(sMb, aMb), mem(sMb), 'cap'));
      bars.appendChild(bar('ambient mem.', aMb, Math.max(sMb, aMb), mem(aMb), 'win'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Proxies' }), el('b', { text: p + ' contra ' + n + ' + ' + w })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Pods a reiniciar' }), el('b', { text: p + ' contra 0' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Proxies por chamada' }), el('b', { text: '2 contra ' + (w > 0 ? 3 : 2) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Pods por nó' }), el('b', { text: fmt(p / n) })])
      ]));
      var saved = sCpu - aCpu;
      out.appendChild(el('p', { class: 'sr-verdict ' + (saved > 0 ? '' : 'bad'), text: saved > 0
        ? 'O ambient poupa ' + fmt(saved) + ' vCPU e ' + mem(sMb - aMb) + ': o custo do sidecar cresce com os ' + p + ' pods, o do ambient com os ' + n + ' nós e ' + w + ' waypoint' + (w === 1 ? '' : 's') + '.'
        : 'Com tão poucos pods por nó e tantos waypoints, o ambient deixa de poupar. O formato da conta é pods contra nós.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Exemplo da loja: 0,1 vCPU e 50 MB por proxy, igual para sidecar, ztunnel e waypoint. Os números reais variam com o tráfego. Para a atualização, troque o Envoy dos pods contra trocar os ztunnels e waypoints, que não reinicia nenhum pod de serviço.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [pods.wrap, nodes.wrap, wps.wrap]);
    [pods, nodes, wps].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: a loja precisa de uma malha? =============== */
  function wValeMalha(root) {
    var SVC = [3, 6, 15, 40], LANG = [1, 2, 3], TEAM = [1, 3, 6];
    var S = { s: 1, l: 2, t: 1, m: 1, p: 1 };
    var sB = [], lB = [], tB = [], mB = [], pB = [];
    var out = el('div', { class: 'vm-out', 'aria-live': 'polite' });

    function render() {
      press(sB, S.s); press(lB, S.l); press(tB, S.t); press(mB, S.m); press(pB, S.p);
      var items = [];
      var sv = SVC[S.s], lg = LANG[S.l], tm = TEAM[S.t];
      var ps = sv >= 15 ? 2 : sv >= 5 ? 1 : 0;
      items.push([ps, sv + ' serviços: ' + (ps === 2 ? 'muitos pares de chamada, cada um com timeout, retry e métrica' : ps === 1 ? 'dá para escrever a regra à mão, mas ela já se espalha' : 'poucos pares de chamada, a regra cabe numa biblioteca')]);
      var pl = lg >= 3 ? 2 : lg === 2 ? 1 : 0;
      items.push([pl, lg + (lg === 1 ? ' linguagem' : ' linguagens') + ': ' + (pl === 2 ? 'uma biblioteca de rede para cada, todas precisando se comportar igual' : pl === 1 ? 'duas bibliotecas para manter iguais' : 'uma biblioteca compartilhada resolve')]);
      var pt = tm >= 6 ? 2 : tm >= 3 ? 1 : 0;
      items.push([pt, tm + (tm === 1 ? ' time' : ' times') + ': ' + (pt === 2 ? 'a regra diverge entre times e ninguém enxerga o todo' : pt === 1 ? 'a regra começa a divergir entre os times' : 'um time só combina a regra na conversa')]);
      items.push([S.m ? 2 : 0, S.m ? 'mTLS em tudo é exigência: a malha cifra e dá identidade a todos de uma vez' : 'sem exigência de mTLS em tudo: o TLS do gateway pode bastar']);
      items.push([S.p ? 1 : -2, S.p ? 'há um time de plataforma para operar o control plane e as atualizações' : 'sem time para operá-la, a malha vira dívida']);
      var score = items.reduce(function (a, x) { return a + x[0]; }, 0);
      var head, say, cls = '';
      if (score >= 6) { head = 'Vale a malha.'; say = ' Muitos sinais apontam para ela. Comece pelo L4 (mTLS e política por identidade) e acrescente L7 onde precisar.'; }
      else if (score >= 3) { head = 'Depende.'; say = ' Há sinais dos dois lados. Dá para começar só com mTLS e política por identidade (ambient ou uma malha enxuta) ou ficar com biblioteca e gateway por mais um tempo.'; }
      else { head = 'Biblioteca e gateway bastam.'; say = ' Uma malha seria mais um sistema a operar para pouco ganho.'; cls = 'bad'; }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + cls }, [el('strong', { text: head }), say + ' (placar: ' + score + ')']));
      var ul = el('ul', { class: 'ls-list vm-list' });
      items.forEach(function (x) {
        ul.appendChild(el('li', { class: x[0] > 0 ? 'vm-for' : x[0] < 0 ? 'vm-against' : 'vm-flat' }, [el('b', { text: (x[0] > 0 ? '+' + x[0] : x[0] === 0 ? '0' : String(x[0])) + ' ' }), x[1]]));
      });
      out.appendChild(ul);
      out.appendChild(el('p', { class: 'sr-note', text: 'Regra de bolso: pesos de 0 a 2 para serviços, linguagens, times e mTLS, +1 ou -2 para o time de plataforma. A loja da história (6 serviços, 3 linguagens, mTLS exigido) fica em 7; o número de times é de exemplo.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Serviços' }));
    root.appendChild(chipRow('Serviços', SVC.map(String), sB, function (i) { S.s = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Linguagens' }));
    root.appendChild(chipRow('Linguagens', LANG.map(String), lB, function (i) { S.l = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Times' }));
    root.appendChild(chipRow('Times', TEAM.map(String), tB, function (i) { S.t = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'mTLS em tudo é exigência?' }));
    root.appendChild(chipRow('mTLS exigido', ['não', 'sim'], mB, function (i) { S.m = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Time de plataforma' }));
    root.appendChild(chipRow('Time de plataforma', ['não', 'sim'], pB, function (i) { S.p = i; render(); }));
    root.appendChild(out);
    render();
  }

  var REG = { retrystorm: wRetryStorm, authz: wAuthz, sidecarcost: wSidecarCost, valemalha: wValeMalha };
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
