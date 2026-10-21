/* SDLabs · Event Sourcing: widgets em JS puro
   (armazenamento, conflito de versão, reconstruir um modelo, rehidratar o 1047, custo de rehidratar com snapshot,
   ordem e versão, idempotência).
   Números do brief: ~263 B por evento (263 MB para 1 milhão), 140 GB na tabela pedidos de 50 milhões, rehidratação de
   1.000.000 de eventos em 1.935 · 1.801 · 1.770 ms (~555 mil/s), com snapshot 13,1 · 19,6 · 12,1 ms, reconstrução de
   200 milhões de eventos a 20.000/s = 10.000 s = 2 h 47 min, chegada e-501, e-504, e-505, e-502, e-502 do pedido 1047. */
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
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
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

  /* =============== AULA 2: armazenamento =============== */
  function wArmazenamento(root) {
    var B = 263, TAB_GB_50M = 140;
    var porPed = slider('Eventos por pedido', 2, 10, 1, 4, 'eventos');
    var ped = slider('Pedidos', 1, 50, 1, 50, 'milhões');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var e = +porPed.input.value, p = +ped.input.value;
      var ev = p * 1e6 * e, gb = ev * B / 1e9, tab = TAB_GB_50M * p / 50;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Eventos', fmt(ev / 1e6, 1) + ' milhões'),
        fact('Event Store (~263 B cada)', fmt(gb, 1) + ' GB'),
        fact('Tabela pedidos (módulo 16)', fmt(tab, 1) + ' GB'),
        fact('Store ÷ tabela', fmt(gb / tab * 100, 0) + '%'),
        fact('Os dois juntos', fmt(gb + tab, 1) + ' GB')
      ]));
      out.appendChild(verdict(gb > tab,
        gb > tab ? 'O Event Store passa da tabela.' : 'O Event Store é menor que a tabela, mas não a substitui.',
        'O Store ocupa ' + fmt(gb, 1) + ' GB e a tabela pedidos continua existindo como modelo de leitura: o total é ' + fmt(gb + tab, 1) + ' GB, não ' + fmt(gb, 1) + '.'));
      out.appendChild(note(e === 4 && p === 50
        ? 'Conta do brief: 4 eventos × 50 milhões = 200 milhões × ~263 B ≈ 52,6 GB (medido no PostgreSQL 14: 263 MB para 1 milhão de eventos, tabela e índices, payload pequeno). O PedidoCriado real tem 336 B só de JSON, então é uma estimativa.'
        : 'Estimativa: ~263 B por evento (medido com payload pequeno) e a tabela pedidos escalada de forma linear a partir dos 140 GB de 50 milhões. Eventos maiores ou índices extras mudam o resultado.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [porPed.wrap, ped.wrap]));
    [porPed, ped].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 4: conflito de versão =============== */
  function wConflito(root) {
    var RATES = [1, 2, 6, 10, 30, 60, 100, 300, 600, 1000];
    var btns = [], S = { unique: true };
    var taxa = slider('Comandos por segundo no mesmo stream', 0, RATES.length - 1, 1, 2, '', function (i) { return fmtN(RATES[i]) + '/s'; });
    var ms = slider('Tempo de cada tentativa (ler, decidir, gravar)', 1, 50, 1, 5, 'ms');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var ERR = 'ERROR:  duplicate key value violates unique constraint "eventos_stream_versao"\nDETAIL:  Key (stream_id, versao)=(estoque-GATO-042, 3) already exists.';
    function render() {
      var r = RATES[+taxa.input.value], t = +ms.input.value, a = r * t / 1000;
      var p = 1 - Math.exp(-a), cap = 1000 / t;
      clear(out);
      var rows;
      if (S.unique) {
        rows = [
          { cells: [{ text: 'A e B leem' }, { text: 'MAX(versao) = 2: a conferência da função passa nas duas.' }, { text: 'v1, v2' }] },
          { cells: [{ text: 'A insere' }, { text: 'append_evento(…, 2) → versão 3, e-lab-A. A confirma depois de 2 s.' }, { text: 'v1, v2, v3 (A)' }] },
          { cells: [{ text: 'B espera' }, { text: 'Lock / transactionid: B tenta a mesma versão 3 e fica parada até A confirmar.' }, { text: 'sem mudança' }] },
          { cls: 'es-bad', cells: [{ text: 'B falha' }, { text: 'duplicate key … "eventos_stream_versao"', cls: 'es-bad' }, { text: 'sem mudança' }] },
          { cells: [{ text: 'B tenta de novo' }, { text: 'relê o stream (v3), decide com o saldo novo e grava com versão esperada 3.' }, { text: 'v1, v2, v3 (A), v4 (B)' }] }
        ];
      } else {
        rows = [
          { cells: [{ text: 'A e B leem' }, { text: 'MAX(versao) = 2: a conferência passa nas duas.' }, { text: 'v1, v2' }] },
          { cells: [{ text: 'A insere' }, { text: 'versão 3, e-lab-A.' }, { text: 'v1, v2, v3 (A)' }] },
          { cls: 'es-bad', cells: [{ text: 'B insere' }, { text: 'nada impede: versão 3, e-lab-B.', cls: 'es-bad' }, { text: 'v1, v2, v3 (A), v3 (B)' }] }
        ];
      }
      out.appendChild(table(['Passo', 'O que acontece', 'Stream'], rows, 'es-wide'));
      if (S.unique) out.appendChild(pre(ERR));
      out.appendChild(verdict(!S.unique,
        S.unique ? 'Um passa, o outro tenta de novo.' : 'O stream ficou com duas versões 3.',
        S.unique
          ? 'O UNIQUE (stream_id, versao) barra o segundo. Resultado medido: v1 e-lab-0, v2 e-503, v3 e-lab-A, e o B precisa reler o stream e decidir de novo.'
          : 'Sem a restrição as duas sessões passam. Qual v3 vem primeiro? Qualquer rehidratação passa a ser ambígua, e o log, que era a fonte da verdade, está quebrado. (Consequência do desenho, não medida.)'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Comandos por segundo', fmtN(r) + '/s'),
        fact('Carga do stream (λ × tempo)', fmt(a, 2)),
        fact(S.unique ? 'Chance de colidir' : 'Chance de duplicar a versão', fmt(p * 100, 1) + '%'),
        fact('Capacidade (1 stream)', fmt(cap, 0) + '/s')
      ]));
      out.appendChild(verdict(r > cap,
        r > cap ? 'O stream virou gargalo.' : (p < 0.1 ? 'A colisão é rara.' : 'Há muita colisão.'),
        r > cap
          ? 'Chegam ' + fmtN(r) + ' comandos por segundo e um stream atende ~' + fmt(cap, 0) + '/s (1.000 ÷ ' + t + ' ms): o agregado está grande demais, divida por SKU.'
          : (p < 0.1
            ? 'A ' + fmtN(r) + '/s com ' + t + ' ms por tentativa, a chance de outro comando chegar no meio é de ' + fmt(p * 100, 1) + '%. O retry resolve.'
            : 'A chance de outro comando chegar no meio é de ' + fmt(p * 100, 1) + '%: quase todo comando precisa de retry. O agregado deve ser menor.')));
      out.appendChild(note('Estimativa com chegadas aleatórias independentes: chance de colisão = 1 − e^(−comandos/s × tempo). A 6/s e 5 ms fica baixa (~3%); a 600/s o stream não dá conta. Não foi medida.'));
    }
    function pick(i) { S.unique = i === 0; press(btns, i); render(); }
    ms.input.addEventListener('input', render);
    root.appendChild(chipRow('Restrição na tabela', ['Com UNIQUE (stream_id, versao)', 'Sem UNIQUE'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, ms.wrap]));
    taxa.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 6: reconstruir um modelo =============== */
  function wReconstruir(root) {
    var READ = 555000, btns = [];
    var ev = slider('Eventos no Store', 1, 500, 1, 200, 'milhões');
    var rit = slider('Ritmo de escrita no modelo', 1000, 100000, 1000, 20000, 'eventos/s');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var PRESETS = [{ t: 'Os 200 milhões a 20.000/s', e: 200, r: 20000 }, { t: 'Modelo 5× mais rápido', e: 200, r: 100000 }, { t: '500 milhões a 20.000/s', e: 500, r: 20000 }];
    function render() {
      var e = +ev.input.value * 1e6, r = +rit.input.value;
      var tw = e / r, tr = e / READ, total = Math.max(tw, tr);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Tempo para reconstruir', fmtDur(total)),
        fact('Escrever no modelo', fmtDur(tw)),
        fact('Ler o Store (~555 mil/s)', fmtDur(tr)),
        fact('Gargalo', tw >= tr ? 'escrever' : 'ler')
      ]));
      out.appendChild(verdict(tw >= tr,
        tw >= tr ? 'O gargalo é escrever no modelo.' : 'Aqui o gargalo é ler o Store.',
        tw >= tr
          ? 'O Store entrega ~555 mil eventos por segundo e o modelo só recebe ' + fmtN(r) + '. Reconstruir leva ' + fmtDur(tw) + '; acelerar a leitura não muda nada, acelerar a escrita sim.'
          : 'Com o modelo recebendo ' + fmtN(r) + '/s, a leitura de ~555 mil/s limita: ' + fmtDur(tr) + '.'));
      out.appendChild(note(+ev.input.value === 200 && r === 20000
        ? 'Conta do brief: 200 milhões ÷ 20.000/s = 10.000 s = 2 h 47 min. A leitura do Store (~555 mil eventos/s) foi medida num PostgreSQL 14; o ritmo de 20.000/s é o do módulo 18.'
        : 'Estimativa: eventos ÷ ritmo, com leitura e escrita em paralelo (vale a mais lenta). O ritmo de 555 mil/s foi medido num PostgreSQL 14.'));
    }
    function preset(i) { ev.set(PRESETS[i].e); rit.set(PRESETS[i].r); press(btns, i); render(); }
    root.appendChild(chipRow('Cenários do texto', PRESETS.map(function (x) { return x.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ev.wrap, rit.wrap]));
    [ev, rit].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 7: rehidratar o 1047 =============== */
  function wRehidratar(root) {
    var EV = [
      { v: 1, id: 'e-501', tipo: 'PedidoCriado', quando: '14:02:10.000' },
      { v: 2, id: 'e-502', tipo: 'PedidoPago', quando: '14:02:11.000' },
      { v: 3, id: 'e-504', tipo: 'PedidoEnviado', quando: '14:30:00' },
      { v: 4, id: 'e-505', tipo: 'PedidoEntregue', quando: '19/06 10:40:00' }
    ];
    var STATUS = ['', 'criado', 'pago', 'enviado', 'entregue'];
    var MOMENTS = [
      { t: 'antes de 14:02:10', v: 0 }, { t: '14:02:10', v: 1 }, { t: '14:02:11', v: 2 }, { t: '14:15', v: 2 },
      { t: '14:30', v: 3 }, { t: '19/06 10:39', v: 3 }, { t: '19/06 10:40', v: 4 }
    ];
    var btns = [], S = { modo: 0 };
    var sv = slider('Dobrar até a versão', 0, 4, 1, 4, '', function (v) { return String(v); });
    var sh = slider('Até a hora (18/06/2026, salvo indicado)', 0, MOMENTS.length - 1, 1, 6, '', function (i) { return MOMENTS[i].t; });
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function estado(v) {
      if (v === 0) return '(vazio: nenhum evento aplicado)';
      return JSON.stringify({ pedido_id: 1047, status: STATUS[v], total_centavos: 9490, rastreio: v >= 3 ? 'LA123456789BR' : null, versao: v }, null, 2);
    }
    function render() {
      var v = S.modo === 0 ? +sv.input.value : MOMENTS[+sh.input.value].v;
      var hora = S.modo === 1 ? MOMENTS[+sh.input.value].t : null;
      clear(out);
      var rows = EV.map(function (e) {
        var on = e.v <= v;
        return { cls: on ? 'es-on' : 'es-off', cells: [{ text: 'v' + e.v }, { text: e.id }, { text: e.tipo }, { text: e.quando }, { text: on ? 'aplicado' : 'ainda não' }] };
      });
      out.appendChild(table(['Versão', 'evento_id', 'Tipo', 'Quando', 'Dobrando'], rows, 'es-wide'));
      out.appendChild(el('div', { class: 'es-pair' }, [
        el('div', null, [el('p', { class: 'sr-sub', text: 'Pelos eventos' }), pre(estado(v))]),
        el('div', null, [el('p', { class: 'sr-sub', text: 'Tabela pedidos (só o último)' }), pre(JSON.stringify({ pedido_id: 1047, status: 'entregue' }, null, 2))])
      ]));
      var diff = v !== 4;
      out.appendChild(verdict(diff,
        v === 0 ? 'Ainda não existia.' : (diff ? 'Os dois discordam.' : 'Os dois concordam.'),
        v === 0
          ? 'Antes de 14:02:10 o stream pedido-1047 está vazio. A tabela só conhece o fim da história.'
          : (diff
            ? (hora ? 'Às ' + hora + ' ' : 'Na versão ' + v + ' ') + 'os eventos dizem ' + STATUS[v] + '; a tabela só sabe dizer entregue.'
            : 'Dobrando os 4 eventos o resultado é entregue, versão 4: o mesmo que a tabela guarda, mas agora com o caminho.')));
      out.appendChild(note('Estado como na aula: começa vazio e cada evento é aplicado em ordem. Valores em centavos; horários do módulo 6.'));
    }
    function pick(i) {
      S.modo = i; press(btns, i);
      sv.wrap.hidden = i !== 0; sh.wrap.hidden = i !== 1;
      render();
    }
    root.appendChild(chipRow('Como escolher o ponto', ['Por versão', 'Por hora'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [sv.wrap, sh.wrap]));
    [sv, sh].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 8: custo de rehidratar =============== */
  function wCusto(root) {
    var NS = [1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000];
    var POL = [{ t: 'Nenhum', k: 0 }, { t: 'A cada 10.000', k: 10000 }, { t: 'A cada 1.000', k: 1000 }, { t: 'A cada 100', k: 100 }];
    var FIX = 11.2, btns = [], S = { p: 2 };
    var n = slider('Eventos no stream', 0, NS.length - 1, 1, 6, '', function (i) { return fmtN(NS[i]); });
    var vel = slider('Velocidade de leitura', 50, 1000, 5, 555, 'mil eventos/s');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var N = NS[+n.input.value], sp = +vel.input.value * 1000, K = POL[S.p].k;
      var full = N / sp * 1000;
      var sem = K === 0 || N <= K;
      var tail = sem ? N : K, snap = sem ? full : FIX + K / sp * 1000;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Sem snapshot', fmtMs(full)),
        fact('Com a política', fmtMs(snap)),
        fact('Eventos lidos', fmtN(tail)),
        fact('Redução de eventos', sem ? '1×' : fmtRatio(N / tail)),
        fact('Redução de tempo', sem ? '1×' : fmtRatio(full / snap)),
        fact('Snapshots gravados', sem ? '0' : fmtN(Math.floor(N / K)))
      ]));
      var why = K === 0 ? 'Sem snapshot a rehidratação lê o stream inteiro: ' + fmtN(N) + ' eventos em ' + fmtMs(full) + ', a cada comando.'
        : (N <= K ? 'O stream tem menos eventos que a política: ainda não há snapshot, então lê tudo.'
          : 'Com snapshot a cada ' + fmtN(K) + ' a rehidratação lê 1 foto e no máximo ' + fmtN(K) + ' eventos: ' + fmtMs(snap) + ' em vez de ' + fmtMs(full) + '.');
      out.appendChild(verdict(K === 0 && full > 500, K === 0 ? (full > 500 ? 'Cada comando paga isso.' : 'Ainda é barato.') : 'O snapshot corta a cauda.', why));
      out.appendChild(note(N === 1000000 && sp === 555000
        ? 'Medido (PostgreSQL 14, 1.000.000 de eventos, saldo 10.000): sem snapshot 1.935 · 1.801 · 1.770 ms; com foto na versão 999.000 e 1.000 eventos depois, 13,1 · 19,6 · 12,1 ms (inclui subir o psql duas vezes). A cada 10.000 e a cada 100 são estimativa.'
        : 'Estimativa: sem snapshot = eventos ÷ velocidade; com snapshot = ~11 ms fixos (o que sobra dos ~13 ms medidos) + cauda ÷ velocidade, no pior caso de K eventos na cauda. Medido só em 1 milhão a ~555 mil/s.'));
      out.appendChild(note('Foto mais frequente lê menos, mas grava mais fotos. O snapshot é derivado e descartável: apagar todos só deixa a leitura lenta.'));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Política de snapshot', POL.map(function (x) { return x.t; }), btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, vel.wrap]));
    [n, vel].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== AULA 9: ordem e versão =============== */
  function wOrdem(root) {
    var STATUS = ['', 'criado', 'pago', 'enviado', 'entregue'];
    var BASE = [
      { id: 'e-501', v: 1, k: 'a' }, { id: 'e-504', v: 3, k: 'b' }, { id: 'e-505', v: 4, k: 'c' },
      { id: 'e-502', v: 2, k: 'd' }, { id: 'e-502', v: 2, k: 'e', dup: true }
    ];
    var order = BASE.slice(), rbtns = [], S = { regra: 1, perde: false };
    var RULES = ['Último a chegar vence', 'Só versão maior', 'Versão maior + espera pela que falta'];
    var list = el('ol', { class: 'es-arr', 'aria-label': 'Ordem de chegada dos eventos' });
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    var perdeBtn = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'A versão 2 nunca chega' });
    var dragFrom = -1;

    function label(e) { return e.id + ' · v' + e.v + ' · ' + STATUS[e.v] + (e.dup ? ' (duplicado)' : ''); }
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
        var up = el('button', { type: 'button', class: 'btn es-mv', 'aria-label': 'Chegar mais cedo: ' + label(e), text: '↑' });
        var dn = el('button', { type: 'button', class: 'btn es-mv', 'aria-label': 'Chegar mais tarde: ' + label(e), text: '↓' });
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
          acao = 'aplica (chegou por último até agora)'; st = { status: STATUS[e.v], v: e.v };
        } else if (S.regra === 1) {
          if (e.v > st.v) { acao = 'aplica (' + st.v + ' → ' + e.v + ')'; st = { status: STATUS[e.v], v: e.v }; }
          else { acao = 'descarta (' + e.v + ' não é maior que ' + st.v + ')'; desc++; ok = false; }
        } else {
          if (e.v <= st.v) { acao = 'descarta (já aplicou até v' + st.v + ')'; desc++; ok = false; }
          else if (e.v === st.v + 1) {
            acao = 'aplica v' + e.v; st = { status: STATUS[e.v], v: e.v };
            var drained = [];
            for (;;) {
              var nx = null;
              for (var q = 0; q < buf.length; q++) if (buf[q].v === st.v + 1) { nx = q; break; }
              if (nx === null) break;
              var b = buf.splice(nx, 1)[0]; st = { status: STATUS[b.v], v: b.v }; drained.push('v' + b.v);
            }
            if (drained.length) acao += '; depois ' + drained.join(' e ') + ' do buffer';
          } else {
            acao = 'espera (falta v' + (st.v + 1) + ')'; buf.push(e); ok = false;
          }
        }
        rows.push({ cls: ok ? '' : 'es-off', cells: [{ text: e.id + ' v' + e.v + (e.dup ? ' (dup)' : '') }, { text: acao }, { text: st.status + (st.v ? ', v' + st.v : '') }] });
      });
      return { rows: rows, st: st, desc: desc, buf: buf };
    }
    function render() {
      var r = simula();
      clear(out);
      out.appendChild(table(['Chegou', 'O que a projeção faz', 'Estado depois'], r.rows, 'es-wide'));
      var buraco = S.perde && r.st.v === 4 && S.regra !== 2;
      var certo = r.st.v === 4 && !buraco;
      var esperando = r.buf.length ? ' Ficaram ' + r.buf.length + ' evento(s) esperando a v' + (r.st.v + 1) + '.' : '';
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Estado final', r.st.status + (r.st.v ? ', v' + r.st.v : '')),
        fact('Descartes', String(r.desc)),
        fact('Esperando', String(r.buf.length)),
        fact('Resultado', certo ? 'correto' : (buraco ? 'com buraco' : (r.buf.length ? 'esperando' : 'errado')))
      ]));
      var head, say;
      if (buraco) {
        head = 'Terminou em entregue, mas com um buraco.';
        say = 'A regra só olha "maior que": aplicou a v3 e a v4 sem nunca ter visto a v2 (pago). O estado final até parece certo, e o modelo nunca soube do pagamento.';
      } else if (certo) {
        head = 'Terminou em entregue, versão 4.';
        say = S.regra === 0
          ? 'Acertou por sorte: o e-505 foi o último a chegar. Mude a ordem (ponha um e-502 por último) e a regra erra.'
          : 'Os eventos velhos ou repetidos foram descartados ou esperaram a vez, e o estado final é o do Store.';
      } else if (r.buf.length) {
        head = 'A projeção está esperando a v' + (r.st.v + 1) + '.';
        say = 'Sem a v' + (r.st.v + 1) + ' ela não avança, e isso é o certo: é melhor esperar (ou pedir a versão que falta ao Store) do que aplicar a v3 e deixar um buraco.' + esperando;
      } else {
        head = 'Terminou em ' + r.st.status + ', versão ' + r.st.v + ': errado.';
        say = 'O pedido já foi entregue (v4), e um evento atrasado levou o modelo de volta.';
      }
      out.appendChild(verdict(buraco || (!certo && !r.buf.length), head, say));
      out.appendChild(note('Chegada do exemplo: e-501 (v1), e-504 (v3), e-505 (v4), e-502 (v2) e o e-502 de novo. Com a regra "só versão maior" o resultado medido no PostgreSQL 14 é entregue, v4, com os dois e-502 descartados. O "último a chegar" depende de quem chega por último.'));
    }
    function pickRegra(i) { S.regra = i; press(rbtns, i); render(); }
    function togglePerde() { S.perde = !S.perde; perdeBtn.setAttribute('aria-pressed', S.perde ? 'true' : 'false'); render(); }
    perdeBtn.addEventListener('click', togglePerde);
    var ctl = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Ordem de chegada' });
    [
      ['Chegada do exemplo', function () { order = BASE.slice(); }],
      ['Ordem do Store', function () { order = BASE.slice().sort(function (a, b) { return a.v - b.v || (a.dup ? 1 : 0) - (b.dup ? 1 : 0); }); }],
      ['Embaralhar', function () { for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; } }]
    ].forEach(function (c) {
      var b = el('button', { type: 'button', class: 'chip', text: c[0] });
      b.addEventListener('click', function () { c[1](); drawList(); render(); });
      ctl.appendChild(b);
    });
    ctl.appendChild(perdeBtn);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Ordem de chegada ao modelo de status' }));
    root.appendChild(ctl);
    root.appendChild(list);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Regra da projeção' }));
    root.appendChild(chipRow('Regra da projeção', RULES, rbtns, pickRegra));
    root.appendChild(out);
    drawList();
    pickRegra(1);
  }

  /* =============== AULA 10: idempotência =============== */
  function wIdempotencia(root) {
    var mbtns = [], tbtns = [], S = { modelo: 1, tabela: 0 };
    var nEnt = slider('Vezes que o e-502 chega ao estoque', 1, 5, 1, 2, 'vezes');
    var out = el('div', { class: 'es-out', 'aria-live': 'polite' });
    function render() {
      var n = +nEnt.input.value, saldo = 3, rows = [], seq = ['3'];
      for (var i = 1; i <= n; i++) {
        var acao, ef;
        if (S.modelo === 0) {
          acao = i === 1 ? 'grava a reserva do pedido 1047' : 'regrava a mesma reserva (chave: o pedido)';
          saldo = 2; ef = 'saldo ' + saldo;
        } else if (S.tabela === 1) {
          if (i === 1) { acao = 'e-502 não estava na tabela: aplica −1 e grava o id'; saldo -= 1; }
          else acao = 'e-502 já está em eventos_processados: descarta';
          ef = 'saldo ' + saldo;
        } else {
          acao = 'aplica −1'; saldo -= 1; ef = 'saldo ' + saldo + (saldo < 0 ? ' (impossível)' : '');
        }
        seq.push(String(saldo));
        rows.push({ cls: (S.modelo === 1 && S.tabela === 0 && i > 1) ? 'es-bad' : '', cells: [{ text: 'entrega ' + i }, { text: acao, cls: (S.modelo === 1 && S.tabela === 0 && i > 1) ? 'es-bad' : '' }, { text: ef }] });
      }
      clear(out);
      out.appendChild(table(['Chegada', 'O que o estoque faz', 'Resultado'], rows, 'es-wide'));
      var certo = saldo === 2;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Caminho do saldo', seq.join(' → ')),
        fact('Saldo final', String(saldo)),
        fact('Saldo correto', '2'),
        fact('Diferença', saldo === 2 ? 'nenhuma' : fmt(2 - saldo, 0) + ' unidade(s) a menos')
      ]));
      out.appendChild(verdict(!certo,
        certo ? 'O saldo fecha: 3 → 2.' : 'O saldo está errado: ' + seq.join(' → ') + '.',
        S.modelo === 0
          ? 'No modelo de último estado a reserva é uma linha por pedido: regravá-la não muda nada. A chave natural (o pedido) faz o trabalho, com ou sem a tabela.'
          : (S.tabela === 1
            ? 'O evento_id entra na tabela na mesma transação que aplica o efeito. A segunda entrega encontra o e-502 lá e descarta.'
            : 'O modelo soma e não tem como saber que já viu o e-502. Cada entrega tira mais uma unidade, e o estoque "vende" o que não existe' + (saldo < 0 ? ' (o saldo foi abaixo de zero)' : '') + '.')));
      out.appendChild(note('É o caso do módulo 6: o PedidoPago e-502 chega duas vezes e o estoque vai 3 → 2 → 1. A partir de 4 entregas o saldo ficaria negativo, o que o agregado de estoque recusaria, mas uma projeção que só soma não recusa.'));
    }
    function pickM(i) { S.modelo = i; press(mbtns, i); tbtns.forEach(function (b) { b.disabled = i === 0; }); render(); }
    function pickT(i) { S.tabela = i; press(tbtns, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Modelo do estoque' }));
    root.appendChild(chipRow('Modelo', ['Último estado (uma linha por pedido)', 'Soma (saldo −1 a cada evento)'], mbtns, pickM));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Tabela de eventos processados' }));
    root.appendChild(chipRow('Tabela de processados', ['Sem a tabela', 'Com a tabela'], tbtns, pickT));
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
