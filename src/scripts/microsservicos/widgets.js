/* SDLabs · Microsserviços: widgets em JS puro
   (calculadora de vCPU, somador de saltos, modelo anêmico ou rico, ordenar eventos, replay da fila).
   História: a loja (processo `loja`, 8 vCPU, banco `loja`) com 7 módulos; Lena, Recife; pedido 1047, gato de pelúcia (produto 42, GATO-042), 94.90. */
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
  var uid = 0;

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
  function slider(label, id, min, max, value) {
    var out = el('output', { for: id, 'aria-live': 'off' });
    var input = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: '1', value: String(value) });
    var box = el('div', { class: 'sr-ctl mx-ctl' }, [el('label', { for: id }, [label, out]), input]);
    return { box: box, input: input, out: out };
  }

  /* =============== AULA: calculadora de vCPU na Black Friday =============== */
  var MONO_VCPU = 8;
  function calcVcpu(n) {
    var rows = [
      ['Catálogo', n, 1],
      ['Carrinho', Math.ceil(n / 4), 1],
      ['Pedidos', Math.ceil(n / 4), 1],
      ['Pagamentos', Math.ceil(n / 5), 1],
      ['Estoque', Math.ceil(n / 5), 1],
      ['Entregas', 1, 1],
      ['Relatórios', 1, 4]
    ];
    var total = rows.reduce(function (s, r) { return s + r[1] * r[2]; }, 0);
    return { mono: MONO_VCPU * n, svc: total, rows: rows };
  }
  function wVcpu(root) {
    var S = { n: 10 };
    var sl = slider('Tráfego da vitrine (Catálogo)', 'mx-v-' + (++uid), 1, 20, S.n);
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function bar(name, v, max, win) {
      return el('div', { class: 'sr-bar' }, [
        el('span', { text: name }),
        el('div', { class: 'sr-track' }, [
          el('div', { class: 'sr-fill' + (win ? ' win' : ''), style: 'width:' + (v / max * 100) + '%' }),
          el('span', { class: 'sr-lbl', text: fmt(v) + ' vCPU' })
        ])
      ]);
    }
    function render() {
      var n = S.n, r = calcVcpu(n);
      sl.out.textContent = n + '×';
      var max = Math.max(r.mono, r.svc);
      clear(out);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Monolito', r.mono, max, r.mono > r.svc),
        bar('Serviços', r.svc, max, false)
      ]));
      var tb = el('tbody');
      r.rows.forEach(function (x) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: x[0] }), el('td', { text: x[1] + ' × ' + x[2] + ' vCPU' }), el('td', { text: fmt(x[1] * x[2]) })]));
      });
      tb.appendChild(el('tr', { class: 'mx-total' }, [el('th', { scope: 'row', text: 'Total' }), el('td', { text: '' }), el('td', { text: fmt(r.svc) })]));
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table mx-tbl' }, [
        el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'Serviço' }), el('th', { scope: 'col', text: 'Réplicas × vCPU' }), el('th', { scope: 'col', text: 'vCPU' })])]),
        tb
      ])]));
      var diff = r.mono - r.svc, v;
      if (diff > 0) {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: fmt(diff) + ' vCPU a menos' }), ' com microsserviços: ' + fmt(r.svc) + ' contra ' + fmt(r.mono) + '. Só o Catálogo precisou crescer; no monolito é preciso copiar o programa inteiro (' + n + ' × ' + MONO_VCPU + ').']);
      } else if (diff < 0) {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: (n === 1 ? 'No dia comum o monolito é mais barato' : 'Aqui o monolito ainda é mais barato') }), ': ' + fmt(r.mono) + ' contra ' + fmt(r.svc) + '. Separar em serviços tem um custo fixo, e ele só se paga quando um módulo cresce sozinho.']);
      } else {
        v = el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Empate' }), ': ' + fmt(r.mono) + ' vCPU nos dois.']);
      }
      out.appendChild(v);
    }
    sl.input.addEventListener('input', function () { S.n = Number(sl.input.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Quanto a vitrine cresce' }));
    root.appendChild(sl.box);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Números de exemplo. Regra dos serviços: Carrinho e Pedidos crescem 1 réplica a cada 4× de tráfego, Pagamentos e Estoque 1 a cada 5×; Entregas e Relatórios (4 vCPU) ficam fixos.' }));
    render();
  }

  /* =============== AULA: somador de saltos de rede =============== */
  var BASE_MS = 180, LIMIT_MS = 2000;
  function calcSaltos(saltos, ms) {
    var total = BASE_MS + saltos * ms;
    return { total: total, extra: total - BASE_MS, pctMono: (total - BASE_MS) / BASE_MS * 100, pctLimit: total / LIMIT_MS * 100 };
  }
  function wSaltos(root) {
    var MS = [1, 5, 20];
    var S = { n: 4, ms: 1 };
    var sl = slider('Saltos de rede no checkout', 'mx-s-' + (++uid), 0, 20, 4);
    var mB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      var n = S.n, ms = MS[S.ms], r = calcSaltos(n, ms);
      press(mB, S.ms);
      sl.out.textContent = String(n);
      sl.input.value = String(n);
      clear(out);
      var cls = r.pctLimit >= 100 ? ' mx-bad' : r.pctLimit >= 75 ? ' mx-warn' : '';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Checkout' }), el('b', { text: fmt(r.total) + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Sobre o monolito' }), el('b', { text: (r.extra ? '+' : '') + fmt(r.extra) + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Do limite de 2 s' }), el('b', { text: fmt(r.pctLimit) + '%' })])
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [el('div', { class: 'sr-bar' }, [
        el('span', { text: 'Limite 2 s' }),
        el('div', { class: 'sr-track' }, [
          el('div', { class: 'sr-fill' + cls, style: 'width:' + Math.min(100, r.pctLimit) + '%' }),
          el('span', { class: 'sr-lbl', text: fmt(r.total) + ' de ' + fmt(LIMIT_MS) + ' ms' })
        ])
      ])]));
      var msg;
      if (n === 0) msg = el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Monolito: chamadas locais.' }), ' 180 ms de trabalho, cada chamada de função custa uns 0,01 ms e não passa por rede.']);
      else if (r.total > LIMIT_MS) msg = el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'Estourou o timeout.' }), ' ' + fmt(r.total) + ' ms passam do limite de ' + fmt(LIMIT_MS) + ' ms: o checkout falha.']);
      else msg = el('p', { class: 'sr-verdict' }, [el('strong', { text: fmt(r.total) + ' ms' }), ': 180 ms de trabalho + ' + n + (n === 1 ? ' salto × ' : ' saltos × ') + ms + ' ms. São ' + fmt(r.extra) + ' ms a mais que o monolito (+' + fmt(r.pctMono) + '%), ' + fmt(r.pctLimit) + '% do limite.']);
      out.appendChild(msg);
    }
    sl.input.addEventListener('input', function () { S.n = Number(sl.input.value); render(); });
    var bLena = el('button', { type: 'button', class: 'btn', text: 'O checkout da Lena (4 saltos)' });
    var bMono = el('button', { type: 'button', class: 'btn', text: 'Monolito (0 saltos)' });
    bLena.addEventListener('click', function () { S.n = 4; S.ms = 1; render(); });
    bMono.addEventListener('click', function () { S.n = 0; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Quantos saltos' }));
    root.appendChild(sl.box);
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Ms por salto' }));
    root.appendChild(chipRow('Ms por salto', ['1 ms', '5 ms', '20 ms (rede ruim)'], mB, function (i) { S.ms = i; render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bLena, bMono]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A conta usa 180 ms de trabalho fixo. A rede também falha, e cada salto pode precisar de retry: isso não entra aqui.' }));
    render();
  }

  /* =============== AULA: modelo anêmico ou rico =============== */
  function wAnemico(root) {
    var STATUSES = ['criado', 'pago', 'enviado'];
    var S = { st: 1, a: null, r: null };
    var sB = [];
    var grid = el('div', { class: 'ls-grid', 'aria-live': 'polite' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Voltar ao estado inicial' });
    function start() { var s = STATUSES[S.st]; S.a = { status: s, msg: null, cls: '', tried: false, was: s }; S.r = { status: s, msg: null, cls: '', tried: false, was: s }; }
    function cancelA() {
      var a = S.a;
      a.was = a.status; a.tried = true;
      a.status = 'cancelado';
      if (a.was === 'enviado') { a.msg = 'O pedido já tinha saído (rastreio LA123456789BR) e virou cancelado: a regra não está em lugar nenhum.'; a.cls = 'bad'; }
      else if (a.was === 'cancelado') { a.msg = 'Aceitou de novo: o campo só recebe o valor.'; a.cls = ''; }
      else { a.msg = 'Aceito: status virou cancelado. Quem escreveu o código de fora é quem lembrou (ou esqueceu) de checar.'; a.cls = 'ok'; }
      render();
    }
    function cancelR() {
      var r = S.r;
      r.tried = true;
      if (r.status === 'enviado') { r.msg = 'Recusado: não dá para cancelar pedido já enviado.'; r.cls = 'bad'; }
      else if (r.status === 'cancelado') { r.msg = 'Já está cancelado, nada a fazer.'; r.cls = ''; }
      else {
        r.msg = 'Aceito: status virou cancelado.' + (r.status === 'pago' ? ' Estorno de 94.90 em Pagamentos via evento PedidoCancelado.' : '');
        r.cls = 'ok'; r.status = 'cancelado';
      }
      render();
    }
    function panel(title, code, m, onCancel) {
      var b = el('button', { type: 'button', class: 'btn primary', text: 'Cancelar o pedido 1047' });
      b.addEventListener('click', onCancel);
      return el('div', { class: 'ls-panel' }, [
        el('p', { class: 'ls-h', text: title }),
        el('pre', { class: 'ib-sql' }, [el('code', { text: code })]),
        b,
        el('p', { class: 'mx-status' }, ['Status do pedido: ', el('strong', { text: m.status })]),
        el('p', { class: 'mx-res' + (m.cls ? ' ' + m.cls : ''), text: m.msg || 'Ainda não tentou cancelar.' })
      ]);
    }
    function render() {
      press(sB, S.st);
      clear(grid);
      grid.appendChild(panel('Modelo anêmico', 'pedido.status = "cancelado"', S.a, cancelA));
      grid.appendChild(panel('Modelo rico', 'pedido.cancelar()', S.r, cancelR));
    }
    bReset.addEventListener('click', function () { start(); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Status do pedido 1047 agora' }));
    root.appendChild(chipRow('Status do pedido 1047', STATUSES, sB, function (i) { S.st = i; start(); render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReset]));
    root.appendChild(grid);
    root.appendChild(el('p', { class: 'sr-note', text: 'No anêmico o pedido é só dados, e a regra mora em quem o altera. No rico, a regra mora no próprio pedido.' }));
    start(); render();
  }

  /* =============== AULA: ordenar os eventos e achar o contexto dono =============== */
  var EV = [
    { n: 'ProdutoVisto', ctx: 'Catálogo', why: 'mostrar o gato de pelúcia é com a vitrine; ninguém comprou nada ainda.' },
    { n: 'ItemAdicionadoAoCarrinho', ctx: 'Carrinho', why: 'o que está na sacola antes de virar pedido é do Carrinho.' },
    { n: 'PedidoCriado', ctx: 'Pedidos', why: 'transformar a sacola no pedido 1047 é decisão de Pedidos.' },
    { n: 'PedidoPago', ctx: 'Pagamentos', why: 'aprovar a cobrança de 94.90 é com quem fala com o banco.' },
    { n: 'EstoqueReservado', ctx: 'Estoque', why: 'só o Estoque sabe se o GATO-042 tem unidade para reservar.' },
    { n: 'PedidoEnviado', ctx: 'Entregas', why: 'despachar o pacote é com quem cuida do transporte.' },
    { n: 'PedidoEntregue', ctx: 'Entregas', why: 'confirmar que chegou na Lena, em Recife, é a mesma conversa do envio.' }
  ];
  var CTXS = ['Catálogo', 'Carrinho', 'Pedidos', 'Pagamentos', 'Estoque', 'Entregas'];
  var SHUF = [3, 0, 6, 2, 4, 1, 5];
  function wEventos(root) {
    var S = { placed: [], owned: {}, say: '', cls: '', focus: null };
    var pool = el('div', { class: 'mx-pool' });
    var tl = el('ol', { class: 'ib-tl' });
    var say = el('p', { class: 'mx-say', 'aria-live': 'polite' });
    var sub = el('p', { class: 'sr-sub' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Recomeçar' });
    var sum = el('div', { 'aria-live': 'polite' });

    function ordered() { return S.placed.length === EV.length; }
    function pick(i) {
      if (i === S.placed.length) {
        S.placed.push(i);
        S.say = EV[i].n + ' entrou na linha do tempo.'; S.cls = 'ok';
      } else { S.say = 'Esse ainda não: o que precisa acontecer antes?'; S.cls = 'bad'; }
      S.focus = 'pool';
      render();
    }
    function own(i, c) {
      if (EV[i].ctx === CTXS[c]) { S.owned[i] = true; S.say = EV[i].n + ': ' + CTXS[c] + '.'; S.cls = 'ok'; S.focus = null; }
      else { S.say = 'Quem sabe disso é quem decide: ' + EV[i].why; S.cls = 'bad'; S.focus = 'c-' + i + '-' + c; }
      render();
    }
    function render() {
      var done = ordered();
      sub.textContent = done ? '2. Quem é o dono de cada evento?' : '1. Toque nos eventos na ordem em que aconteceram (' + S.placed.length + ' de ' + EV.length + ')';
      clear(pool);
      pool.hidden = done;
      SHUF.forEach(function (i) {
        if (S.placed.indexOf(i) >= 0) return;
        var b = el('button', { type: 'button', class: 'btn mx-ev', text: EV[i].n });
        b.addEventListener('click', function () { pick(i); });
        pool.appendChild(b);
      });
      clear(tl);
      S.placed.forEach(function (i, pos) {
        var item = el('li', { class: 'ib-step' + (S.owned[i] ? '' : (done ? ' now' : '')) }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: EV[i].n }), el('span', { class: 'ib-n', text: String(pos + 1) })])
        ]);
        if (S.owned[i]) item.appendChild(el('span', { class: 'ib-who t2 mx-seal', text: 'Dono: ' + EV[i].ctx }));
        else if (done) {
          var row = el('div', { class: 'sr-chips mx-ctxs', role: 'group', 'aria-label': 'Contexto dono de ' + EV[i].n });
          CTXS.forEach(function (c, j) {
            var b = el('button', { type: 'button', class: 'chip', 'data-f': 'c-' + i + '-' + j, text: c });
            b.addEventListener('click', function () { own(i, j); });
            row.appendChild(b);
          });
          item.appendChild(row);
        }
        tl.appendChild(item);
      });
      say.textContent = S.say || (done ? '' : 'Comece pelo primeiro: o que a Lena fez antes de tudo?');
      say.className = 'mx-say' + (S.cls ? ' ' + S.cls : '');
      clear(sum);
      if (done && EV.every(function (e, i) { return S.owned[i]; })) {
        sum.appendChild(el('p', { class: 'ib-verdict ok' }, [el('strong', { text: '7 eventos, 6 contextos; Entregas guarda dois.' }), ' Cada fato do pedido 1047 pertence a um só dono.']));
      }
      if (S.focus) {
        var t = S.focus === 'pool' ? pool.querySelector('button') : root.querySelector('[data-f="' + S.focus + '"]');
        if (t) t.focus();
        S.focus = null;
      }
    }
    bReset.addEventListener('click', function () { S.placed = []; S.owned = {}; S.say = ''; S.cls = ''; render(); });

    root.appendChild(sub);
    root.appendChild(pool);
    root.appendChild(say);
    root.appendChild(tl);
    root.appendChild(sum);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReset]));
    render();
  }

  /* =============== AULA: replay da fila com evento duplicado =============== */
  var QUEUE = [
    { id: 'e-501', type: 'PedidoCriado' },
    { id: 'e-502', type: 'PedidoPago', pay: '{ pedido_id: 1047, valor: 94.90 }' },
    { id: 'e-502', type: 'PedidoPago', pay: '{ pedido_id: 1047, valor: 94.90 }', dup: true },
    { id: 'e-504', type: 'PedidoEnviado' }
  ];
  function wFila(root) {
    var S = { pos: 0, idem: false, stock: 3, seen: [], res: [] };
    var list = el('ol', { class: 'ib-tl' });
    var facts = el('div', { class: 'sr-facts' });
    var out = el('div', { 'aria-live': 'polite' });
    var id = 'mx-i-' + (++uid);
    var box = el('input', { type: 'checkbox', id: id });
    var sw = el('label', { class: 'mx-switch', for: id }, [box, el('span', { text: 'Estoque guarda os evento_id já processados (idempotência)' })]);
    var bNext = el('button', { type: 'button', class: 'btn primary', text: 'Processar o próximo evento' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Recomeçar' });

    function reset() { S.pos = 0; S.stock = 3; S.seen = []; S.res = []; render(); }
    function next() {
      if (S.pos >= QUEUE.length) return;
      var e = QUEUE[S.pos], r;
      if (e.type !== 'PedidoPago') r = { t: 'Ignorado: ' + e.type + ' não é com o estoque.', c: '' };
      else if (S.idem && S.seen.indexOf(e.id) >= 0) r = { t: e.id + ' já foi processado, ignorado. O estoque fica em ' + S.stock + '.', c: 'ok' };
      else {
        var from = S.stock; S.stock--;
        if (S.idem) S.seen.push(e.id);
        r = e.dup
          ? { t: 'Reserva de novo: estoque do GATO-042 ' + from + ' → ' + S.stock + '. Errado: o gato vendido uma vez saiu duas vezes do estoque.', c: 'bad' }
          : { t: 'Reserva o GATO-042: estoque ' + from + ' → ' + S.stock + '.', c: 'ok' };
      }
      S.res.push(r); S.pos++;
      render();
    }
    function render() {
      var done = S.pos >= QUEUE.length;
      box.checked = S.idem;
      bNext.disabled = done;
      clear(list);
      QUEUE.forEach(function (e, i) {
        var r = S.res[i];
        var item = el('li', { class: 'ib-step' + (r && r.c === 'bad' ? ' flag' : (i === S.pos ? ' now' : '')) }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: e.id + ' ' + e.type }), el('span', { class: 'ib-n', text: (e.dup ? 'duplicado' : (r ? 'processado' : (i === S.pos ? 'próximo' : 'na fila'))) })])
        ]);
        if (e.pay) item.appendChild(el('p', { class: 'ib-db', text: e.pay }));
        if (r) item.appendChild(el('p', { class: 'ib-out', text: r.t }));
        list.appendChild(item);
      });
      clear(facts);
      facts.appendChild(el('div', { class: 'sr-fact' }, [el('small', { text: 'Estoque GATO-042' }), el('b', { text: String(S.stock) })]));
      facts.appendChild(el('div', { class: 'sr-fact' }, [el('small', { text: 'evento_id vistos' }), el('b', { text: S.idem ? '{ ' + S.seen.join(', ') + (S.seen.length ? ' ' : '') + '}' : 'não guarda' })]));
      clear(out);
      if (done) {
        out.appendChild(S.stock === 2
          ? el('p', { class: 'ib-verdict ok' }, [el('strong', { text: 'Estoque 2 (certo).' }), ' Uma venda, uma baixa: o duplicado foi reconhecido pelo evento_id.'])
          : el('p', { class: 'ib-verdict bad' }, [el('strong', { text: 'Estoque 1 (errado) contra 2 (certo).' }), ' A rede entregou o PedidoPago duas vezes e o estoque baixou duas vezes. Ligue o interruptor e rode de novo.']));
      }
    }
    box.addEventListener('change', function () { S.idem = box.checked; reset(); });
    bNext.addEventListener('click', next);
    bReset.addEventListener('click', reset);

    root.appendChild(el('p', { class: 'sr-sub', text: 'Fila do serviço estoque' }));
    root.appendChild(sw);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bNext, bReset]));
    root.appendChild(list);
    root.appendChild(facts);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'Trocar o interruptor reinicia a fila. A entrega duas vezes é normal em fila com garantia "pelo menos uma vez".' }));
    render();
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { calcVcpu: calcVcpu, calcSaltos: calcSaltos };

  var REG = { vcpu: wVcpu, saltos: wSaltos, anemico: wAnemico, eventos: wEventos, fila: wFila };
  function init() {
    var nodes = document.querySelectorAll('[data-widget]');
    Array.prototype.forEach.call(nodes, function (n) {
      var f = REG[n.getAttribute('data-widget')];
      if (!f || n.getAttribute('data-ready')) return;
      n.setAttribute('data-ready', '1');
      try { f(n); } catch (e) { if (window.console) console.error('widget', n.getAttribute('data-widget'), e); }
    });
  }
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
