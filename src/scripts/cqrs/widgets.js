/* SDLabs · CQRS: widgets em JS puro
   (relatório × view materializada, atraso do modelo de leitura, "a Lena vê o 1056?", documento do modelo de leitura,
   composição × modelo de leitura, escrita dupla e custo da outbox em WAL).
   Usam os números do brief: relatório de ~235 ms em 300 mil pedidos, view de 0,021 ms, REFRESH de 401 ms e CONCURRENTLY de 340 ms,
   projetor de 100 eventos/s por instância, documento da Lena de 1.787 B, WAL de 359,6 / 1.232,7 / 2.735,8 B por pedido. */
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
    if (ms >= 60000) return fmt(ms / 60000, 1) + ' min';
    if (ms >= 1000) return fmt(ms / 1000, 1) + ' s';
    if (ms >= 10) return fmt(ms, 0) + ' ms';
    return fmt(ms, 3) + ' ms';
  }
  function fmtBytes(b) {
    if (b >= 1e9) return fmt(b / 1e9, 2) + ' GB';
    if (b >= 1e6) return fmt(b / 1e6, 1) + ' MB';
    if (b >= 1e3) return fmt(b / 1e3, 1) + ' KB';
    return fmt(b, 1) + ' B';
  }

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
    var id = 'cq-sl-' + (++uid);
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cq-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }

  /* =============== AULA 3: relatório × view materializada =============== */
  function wRelatorio(root) {
    var ROWS = [10000, 100000, 300000, 1000000, 5000000, 10000000, 50000000];
    var BASE = 300000, REL = 235, VIEW = 0.021, REF = 401, CON = 340;
    var btns = [], S = { concorrente: false };
    var rows = slider('Linhas em pedidos', 0, ROWS.length - 1, 1, 2, '', function (i) { return fmt(ROWS[i], 0); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    function render() {
      var n = ROWS[+rows.input.value], k = n / BASE;
      var rel = REL * k, ref = REF * k, con = CON * k;
      var espera = S.concorrente ? 12 : ref;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Relatório (varre tudo)', fmtMs(rel)),
        fact('Ler a view (5 linhas)', fmtMs(VIEW)),
        fact('Razão', '~' + fmt(rel / VIEW, 0) + '×'),
        fact(S.concorrente ? 'REFRESH CONCURRENTLY' : 'REFRESH simples', fmtMs(S.concorrente ? con : ref)),
        fact('Leitor esperando', S.concorrente ? '~12 ms' : 'até ' + fmtMs(espera))
      ]));
      out.appendChild(verdict(!S.concorrente,
        S.concorrente ? 'O leitor segue lendo a versão antiga.' : 'O leitor fica parado até o REFRESH terminar.',
        S.concorrente
          ? 'O CONCURRENTLY monta a versão nova ao lado e a troca no fim (exige um índice único). No teste a 300 mil linhas o leitor esperou 12 ms; o REFRESH inteiro leva ' + fmtMs(con) + ' neste tamanho.'
          : 'O REFRESH simples tranca a view. Neste tamanho ele leva ' + fmtMs(ref) + ', e o SELECT que chegou no começo espera quase tudo isso.'));
      out.appendChild(note(n === BASE
        ? 'Medido a 300 mil linhas (PostgreSQL 14): relatório 238,8 · 240,7 · 227,6 ms (~235 ms); view 0,021 ms; REFRESH 401 ms; CONCURRENTLY 340 ms. No teste do bloqueio a transação ficou aberta por 3 s e o leitor esperou 2.285 ms (simples) contra 12 ms (concorrente).'
        : 'Estimativa linear a partir dos 300 mil medidos (o PostgreSQL não foi rodado neste tamanho). A view continua em 0,021 ms porque lê as mesmas 5 linhas.'));
      out.appendChild(note('Lembrete: a view só sabe o que sabia no último REFRESH. Com REFRESH às 23:00, o pedido das 20:12 entra 2 h 48 min depois.'));
    }
    function pick(i) { S.concorrente = i === 1; press(btns, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rows.wrap]));
    root.appendChild(chipRow('Tipo de REFRESH', ['REFRESH simples', 'REFRESH CONCURRENTLY'], btns, pick));
    rows.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 5: atraso do modelo de leitura =============== */
  function wAtraso(root) {
    var btns = [];
    var taxa = slider('Pedidos por segundo', 1, 60, 1, 30, 'pedidos/s');
    var evs = slider('Eventos por pedido', 1, 8, 1, 4, 'eventos');
    var ms = slider('Tempo por evento no projetor', 1, 50, 1, 10, 'ms');
    var inst = slider('Instâncias do projetor (= partições)', 1, 6, 1, 1, '');
    var parada = slider('Uma instância parada por', 0, 30, 1, 0, 'min');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'Black Friday, 1 instância', i: 1, p: 0 },
      { t: '3 instâncias', i: 3, p: 0 },
      { t: '3 instâncias, uma parada 10 min', i: 3, p: 10 }
    ];
    function sec(s) { return s >= 600 ? fmt(s / 60, 1) + ' min' : fmt(s, 0) + ' s'; }
    function mmss(s) { var m = Math.floor(s / 60), r = Math.round(s - m * 60); return m > 0 ? m + ' min ' + (r ? r + ' s' : '') : r + ' s'; }
    function render() {
      var p = +taxa.input.value, e = +evs.input.value, t = +ms.input.value, n = +inst.input.value, T = +parada.input.value;
      var entra = p * e, porInst = 1000 / t, cap = n * porInst, uso = entra / cap;
      var deficit = Math.max(0, entra - cap), acc10 = deficit * 600, atraso10 = acc10 / cap;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Eventos que entram', fmt(entra, 0) + '/s'),
        fact('Capacidade (' + n + ' × ' + fmt(porInst, 0) + ')', fmt(cap, 0) + '/s'),
        fact('Uso', fmt(uso * 100, 0) + '%'),
        fact('Atraso em 10 min', deficit > 0 ? fmt(acc10, 0) + ' eventos = ' + sec(atraso10) : 'nenhum')
      ]));
      out.appendChild(verdict(deficit > 0,
        deficit > 0 ? 'A conta não fecha.' : 'A conta fecha.',
        deficit > 0
          ? 'Entram ' + fmt(entra, 0) + '/s e o projetor consome ' + fmt(cap, 0) + '/s: faltam ' + fmt(deficit, 0) + '/s, e o atraso cresce sem parar (' + sec(atraso10) + ' em 10 min).'
          : 'O projetor consome ' + fmt(cap, 0) + '/s e entram ' + fmt(entra, 0) + '/s: usa ' + fmt(uso * 100, 0) + '% e o atraso não acumula.'));
      if (T > 0) {
        var share = entra / n, acc = share * T * 60, drain = porInst - share;
        if (drain <= 0) {
          out.appendChild(verdict(true, 'A instância parada nunca recupera.',
            'A partição dela recebe ' + fmt(share, 0) + '/s e uma instância só consome ' + fmt(porInst, 0) + '/s: depois de ' + T + ' min, o atraso acumulado é de ' + fmt(acc, 0) + ' eventos e não drena.'));
        } else {
          out.appendChild(verdict(true, 'Uma instância parada por ' + T + ' min.',
            'Acumula ' + fmt(share, 0) + ' × ' + (T * 60) + ' = ' + fmt(acc, 0) + ' eventos. Ao voltar, drena a ' + fmt(porInst, 0) + ' − ' + fmt(share, 0) + ' = ' + fmt(drain, 0) + '/s, em ' + fmt(acc / drain, 0) + ' s (' + mmss(acc / drain) + '). Só os clientes daquela partição veem a tela atrasada.'));
        }
      }
      out.appendChild(note('Cada pedido gera 4 eventos na loja (PedidoCriado, PedidoPago e dois EstoqueReservado). Supõe partições iguais, uma por instância. É uma conta de exemplo, não uma medição.'));
    }
    function preset(i) { inst.set(PRESETS[i].i); parada.set(PRESETS[i].p); press(btns, i); render(); }
    root.appendChild(chipRow('Cenários do texto', PRESETS.map(function (x) { return x.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, evs.wrap, ms.wrap, inst.wrap, parada.wrap]));
    [taxa, evs, ms, inst, parada].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 5: a Lena vê o 1056? =============== */
  function wLena(root) {
    var btns = [], S = { est: 0 };
    var atraso = slider('Atraso do projetor (commit até o modelo de leitura)', 0, 3000, 2, 74, 'ms');
    var abre = slider('A Lena abre "meus pedidos" depois do commit', 0, 3000, 10, 50, 'ms');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var EST = ['Nada', 'A resposta traz o pedido', 'Token de versão', 'Processando'];
    function render() {
      var a = +atraso.input.value, o = +abre.input.value, falta = a - o;
      var fatos, v;
      clear(out);
      if (S.est === 0) {
        var ve = falta <= 0;
        fatos = [fact('Pedido na tela', ve ? 'sim' : 'não'), fact('Espera', '0 ms'), fact('Custo', 'nenhum')];
        v = verdict(!ve, ve ? 'Aparece.' : 'Não aparece.',
          ve ? 'O modelo de leitura já sabia do 1056 quando ela abriu a tela.'
            : 'Ela abriu ' + fmt(falta, 0) + ' ms antes de o modelo saber do 1056. Vê a lista sem o pedido novo, como o 1055 do módulo 17, e acha que a compra se perdeu.');
      } else if (S.est === 1) {
        fatos = [fact('Pedido na tela', 'sim'), fact('Espera', '0 ms'), fact('Custo', 'estado no app')];
        v = verdict(false, 'Aparece na hora.',
          'O 201 do CriarPedido trouxe o documento do 1056 e o app o pôs no topo da lista. O custo é o app guardar esse pedido e o juntar à resposta do modelo; vale só para o aparelho que fez a compra (em outro aparelho, vale o que o modelo sabe).');
      } else if (S.est === 2) {
        var espera = Math.max(0, falta);
        if (espera === 0) {
          fatos = [fact('Pedido na tela', 'sim'), fact('Espera', '0 ms'), fact('Custo', 'nenhum')];
          v = verdict(false, 'Aparece.', 'O GET /meus-pedidos?min_versao=8 já encontrou a versão 8: responde direto.');
        } else if (espera <= 1000) {
          fatos = [fact('Pedido na tela', 'sim'), fact('Espera', fmt(espera, 0) + ' ms'), fact('Custo', 'tela espera')];
          v = verdict(false, 'Aparece depois de esperar.',
            'O meus-pedidos segura a resposta por ' + fmt(espera, 0) + ' ms até o projetor chegar à versão 8 (limite de 1 s). A Lena vê o pedido, com a tela um instante mais lenta.');
        } else {
          fatos = [fact('Pedido na tela', 'sim'), fact('Espera', '1.000 ms'), fact('Custo', 'lê o lado do comando')];
          v = verdict(true, 'Aparece, mas pelo lado da escrita.',
            'O projetor levaria ' + fmt(falta, 0) + ' ms e o limite é 1 s: o meus-pedidos desiste e lê do lado do comando. A Lena vê o pedido, e o lado da escrita ganha uma leitura que o CQRS queria evitar.');
        }
      } else {
        var pronto = falta <= 0;
        fatos = [fact('Pedido na tela', pronto ? 'completo' : '"processando"'), fact('Espera', '0 ms'), fact('Custo', 'info incompleta')];
        v = verdict(false, pronto ? 'Aparece completo.' : 'Aparece como "processando".',
          pronto ? 'O modelo já tinha o 1056, com itens e total.'
            : 'A tela mostra o 1056 como "processando" por mais ' + fmt(falta, 0) + ' ms, sem itens, pagamento nem rastreio. Não mente e não consulta ninguém; só mostra menos.');
      }
      out.appendChild(el('div', { class: 'sr-facts' }, fatos));
      out.appendChild(v);
      out.appendChild(note('Estratégia: ' + EST[S.est] + '. Num dia comum o atraso é ~74 ms e a Lena abre a tela 50 ms depois do commit: 24 ms cedo demais.'));
    }
    function pick(i) { S.est = i; press(btns, i); render(); }
    root.appendChild(chipRow('Estratégia', EST, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [atraso.wrap, abre.wrap]));
    [atraso, abre].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 6: documento do modelo de leitura =============== */
  var DOC8 = '{"cliente_id":"lena-77","versao":8,"pedidos":[' +
    '{"pedido_id":1056,"criado_em":"2026-11-27T20:12:00-03:00","status":"criado","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990},{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":11480,"pagamento":null,"rastreio":null},' +
    '{"pedido_id":1055,"criado_em":"2026-11-27T20:10:00-03:00","status":"pago","itens":[{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":3490,"pagamento":"cartao_credito","rastreio":null},' +
    '{"pedido_id":1054,"criado_em":"2026-11-27T20:08:00-03:00","status":"pago","itens":[{"nome":"camiseta preta","qtd":1,"preco_centavos":4900}],"total_centavos":6400,"pagamento":"cartao_credito","rastreio":null},' +
    '{"pedido_id":1051,"criado_em":"2026-11-20T14:19:00-03:00","status":"enviado","itens":[{"nome":"caneca azul","qtd":2,"preco_centavos":1990}],"total_centavos":5480,"pagamento":"pix","rastreio":"LA123456788BR"},' +
    '{"pedido_id":1048,"criado_em":"2026-11-05T10:15:00-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":9490,"pagamento":"cartao_credito","rastreio":"LA123456787BR"},' +
    '{"pedido_id":1047,"criado_em":"2026-06-18T14:02:10-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":9490,"pagamento":"boleto","rastreio":"LA123456786BR"},' +
    '{"pedido_id":1044,"criado_em":"2026-04-18T14:20:00-03:00","status":"entregue","itens":[{"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"total_centavos":3490,"pagamento":"pix","rastreio":"LA123456785BR"},' +
    '{"pedido_id":1042,"criado_em":"2026-03-02T11:05:00-03:00","status":"entregue","itens":[{"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990}],"total_centavos":8990,"pagamento":"pix","rastreio":"LA123456784BR"}]}';
  function nbytes(s) { return new TextEncoder().encode(s).length; }

  function wDocumento(root) {
    var btns = [], S = { real: true };
    var np = slider('Pedidos no documento', 1, 10, 1, 8, 'pedidos');
    var ni = slider('Itens por pedido', 1, 3, 1, 2, 'itens');
    var cli = slider('Clientes', 0.1, 5, 0.1, 1.5, 'milhões', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var ITENS = [
      { nome: 'gato de pelúcia', qtd: 1, preco_centavos: 7990 },
      { nome: 'caneca azul', qtd: 1, preco_centavos: 1990 },
      { nome: 'camiseta preta', qtd: 1, preco_centavos: 4900 }
    ];
    function build(N, k) {
      var itens = ITENS.slice(0, k), tot = 1500;
      itens.forEach(function (i) { tot += i.qtd * i.preco_centavos; });
      var peds = [], i;
      for (i = 0; i < N; i++) {
        peds.push({ pedido_id: 1056 - i, criado_em: '2026-11-27T20:12:00-03:00', status: 'criado', itens: itens, total_centavos: tot, pagamento: null, rastreio: null });
      }
      return { json: JSON.stringify({ cliente_id: 'lena-77', versao: N, pedidos: peds }), um: nbytes(JSON.stringify(peds[0])), N: N };
    }
    function render() {
      var d, N, um;
      if (S.real) { d = { json: DOC8 }; N = 8; um = nbytes(JSON.stringify(JSON.parse(DOC8).pedidos[0])); }
      else { d = build(+np.input.value, +ni.input.value); N = d.N; um = d.um; }
      var total = nbytes(d.json), media = total / N;
      var guardados = S.real ? 10 : N;
      var gb = (+cli.input.value) * 1e6 * guardados * media;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Documento de lena-77', fmt(total, 0) + ' B'),
        fact('Média por pedido', fmt(media, 0) + ' B'),
        fact('Só o pedido 1056', fmt(um, 0) + ' B'),
        fact(fmt(+cli.input.value, 1) + ' M clientes × ' + guardados + ' pedidos', fmtBytes(gb))
      ]));
      out.appendChild(el('pre', { class: 'cq-json' }, [el('code', { text: d.json })]));
      out.appendChild(note(S.real
        ? 'Os 8 pedidos reais da história: 1.787 B no total, 223 B por pedido em média. O 1056 vem primeiro (o mais novo) e tem pagamento e rastreio nulos. Os pedidos 1042 a 1055 têm os itens e totais da história; datas, forma de pagamento e códigos de rastreio são de exemplo.'
        : 'Documento montado com o formato do 1056 repetido (status criado, pagamento e rastreio nulos): é só uma conta de tamanho, os pedidos 1055 e anteriores da história têm outros dados.'));
      out.appendChild(note('A conta de armazenamento supõe 10 pedidos por cliente (o teto do documento): 1,5 milhão × 10 × 223 B = 3,35 GB. Contra isso, a tabela pedidos de 50 milhões tem 100 GB + 40% de índices.'));
    }
    function pick(i) { S.real = i === 0; press(btns, i); np.input.disabled = S.real; ni.input.disabled = S.real; render(); }
    root.appendChild(chipRow('Documento', ['Os 8 da Lena (real)', 'Montar'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [np.wrap, ni.wrap, cli.wrap]));
    [np, ni, cli].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 7: composição × modelo de leitura =============== */
  function wComposicao(root) {
    var btns = [], S = { caiu: false };
    var n = slider('Serviços que a tela chama', 1, 8, 1, 4, '');
    var av = slider('Disponibilidade de cada um', 99, 99.99, 0.01, 99.9, '%', function (v) { return fmt(v, 2); });
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var MES = 43200;
    function render() {
      var N = +n.input.value, a = +av.input.value / 100;
      var serie = Math.pow(a, N), minS = (1 - serie) * MES, minM = (1 - a) * MES;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Composição (em série)', fmt(serie * 100, 4) + '%'),
        fact('Fora por mês (composição)', fmt(minS, 1) + ' min'),
        fact('Modelo de leitura (1 lugar)', fmt(a * 100, 2) + '%'),
        fact('Fora por mês (modelo)', fmt(minM, 1) + ' min')
      ]));
      out.appendChild(table(['Tela', 'Todas de pé', 'Uma fonte caiu (pagamentos)'], [
        { cells: [{ text: 'Composta no bff-app' }, { text: fmt(serie * 100, 4) + '% disponível' }, { text: 'falha, ou "status indisponível"', cls: 'cq-bad' }] },
        { cells: [{ text: 'Modelo de leitura' }, { text: fmt(a * 100, 2) + '% disponível' }, { text: 'continua, com o último status' }] }
      ], S.caiu ? 'cq-down' : ''));
      out.appendChild(verdict(S.caiu,
        S.caiu ? 'pagamentos caiu.' : 'Todas as fontes de pé.',
        S.caiu
          ? 'A tela composta depende dos ' + N + ' serviços ao mesmo tempo e falha. A do modelo de leitura continua e mostra o último status que o projetor conhece: o dado fica velho, e a tela, de pé.'
          : 'Com ' + N + ' serviços a ' + fmt(a * 100, 2) + '% a composição fica em ' + fmt(serie * 100, 4) + '%, ' + fmt(minS, 1) + ' min/mês fora; o modelo de leitura, ' + fmt(minM, 1) + ' min/mês (mês de 30 dias).'));
      out.appendChild(note('O modelo de leitura paga em consistência eventual multiplicada: três tópicos, um projetor e um armazenamento, cada fonte com o seu atraso. O padrão da loja é 4 serviços a 99,9%: 99,6006% e 172,5 min contra 43,2 min.'));
    }
    function pick(i) { S.caiu = i === 1; press(btns, i); render(); }
    root.appendChild(chipRow('Estado das fontes', ['Todas de pé', 'Derrubar pagamentos'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap, av.wrap]));
    [n, av].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 8: escrita dupla =============== */
  function wDualWrite(root) {
    var falha = slider('Falha da segunda escrita (broker ou COMMIT)', 0, 5, 0.05, 0.1, '%', function (v) { return fmt(v, 2); });
    var taxa = slider('Pedidos por segundo', 1, 60, 1, 30, 'pedidos/s');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    function render() {
      var p = +falha.input.value / 100, r = +taxa.input.value, h = r * 3600, bad = h * p;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Pedidos por hora', fmt(h, 0)),
        fact('Falhas por hora', fmt(bad, 0)),
        fact('Por dia', fmt(bad * 24, 0))
      ]));
      out.appendChild(table(['Ordem das duas escritas', 'Pedidos sem evento /h', 'Fantasmas /h', 'O que acontece'], [
        { cls: bad > 0 ? 'cq-badrow' : '', cells: [{ text: 'commit, depois publish' }, { text: fmt(bad, 0), cls: bad > 0 ? 'cq-bad' : '' }, { text: '0' }, { text: 'o pedido existe e nunca chega à tela' }] },
        { cls: bad > 0 ? 'cq-badrow' : '', cells: [{ text: 'publish, depois commit' }, { text: '0' }, { text: fmt(bad, 0), cls: bad > 0 ? 'cq-bad' : '' }, { text: 'a tela mostra um pedido que não existe' }] },
        { cells: [{ text: 'outbox (aula 10)' }, { text: '0' }, { text: '0' }, { text: 'o evento espera na tabela; pode sair duas vezes' }] }
      ], 'cq-wide'));
      out.appendChild(verdict(bad > 0,
        bad > 0 ? fmt(bad, 0) + ' por hora, sem ninguém perceber.' : 'Sem falha, a escrita dupla "funciona".',
        bad > 0
          ? 'A ' + fmt(p * 100, 2) + '% e ' + fmt(r, 0) + ' pedidos/s, são ' + fmt(r, 0) + ' × 3.600 × ' + fmt(p, 4) + ' = ' + fmt(bad, 0) + ' pedidos por hora com uma das duas escritas perdida. O brief usa 0,1% e 30/s: 108 por hora.'
          : 'Com taxa zero nada se perde, mas basta um soluço do broker ou um COMMIT recusado para o modelo de leitura divergir, e ninguém repõe o que faltou.'));
      out.appendChild(note('Exemplo de taxa (0,1%): a de falha real depende do broker e da rede. A outbox zera pedidos sem evento e fantasmas, e troca isso por entrega pelo menos uma vez e por mais WAL (aula 10).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [falha.wrap, taxa.wrap]));
    [falha, taxa].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: custo da outbox em WAL =============== */
  function wOutbox(root) {
    var btns = [], S = { pol: 1 };
    var taxa = slider('Pedidos por segundo', 1, 60, 1, 30, 'pedidos/s');
    var evs = slider('Eventos por pedido na outbox', 1, 4, 1, 2, 'eventos');
    var out = el('div', { class: 'cq-out', 'aria-live': 'polite' });
    var BASE = 359.6, INS = (1232.7 - 359.6) / 2, UPD = 1503.1 / 2, DEL = 684.1 / 2;
    var POL = ['Sem outbox', 'Relay marca (UPDATE)', 'Relay apaga (DELETE)'];
    function wal(pol, e) { return pol === 0 ? BASE : BASE + e * INS + e * (pol === 1 ? UPD : DEL); }
    function render() {
      var r = +taxa.input.value, e = +evs.input.value, w = wal(S.pol, e);
      var bps = w * r, mbh = bps * 3600 / 1e6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('WAL por pedido', fmt(w, 1) + ' B'),
        fact('Fator sobre o sem outbox', fmt(w / BASE, 1) + '×'),
        fact('Taxa de WAL', fmt(bps / 1000, 1) + ' KB/s'),
        fact('Por hora', fmt(mbh, 1) + ' MB'),
        fact('Por dia', fmt(mbh * 24 / 1000, 1) + ' GB')
      ]));
      var rows = [0, 1, 2].map(function (p) {
        var ww = wal(p, e);
        return { cls: p === S.pol ? 'cq-cur' : '', cells: [{ text: POL[p] }, { text: fmt(ww, 1) + ' B' }, { text: fmt(ww / BASE, 1) + '×' }, { text: fmt(ww * r * 3600 / 1e6, 1) + ' MB/h' }] };
      });
      out.appendChild(table(['Política', 'WAL por pedido', 'Fator', 'MB por hora'], rows, 'cq-wide'));
      out.appendChild(note(e === 2
        ? 'Medido (PostgreSQL 14, 20.000 pedidos, cada um com INSERT e UPDATE do status, PedidoCriado de 326 B em jsonb e PedidoPago de 63 B): 359,6 B sem outbox, 1.232,7 B com 2 INSERT, 2.735,8 B com UPDATE do relay e 1.916,8 B com DELETE.'
        : 'Para 2 eventos os números são medidos. Para ' + e + ' evento' + (e > 1 ? 's' : '') + ' o widget escala linear por evento (estimativa): +436,6 B no INSERT, +751,6 B no UPDATE e +342,1 B no DELETE de cada evento.'));
      out.appendChild(note('A tabela de eventos pode ser apagada ou particionada por dia; a que cresce sem limite é a que ninguém limpa.'));
    }
    function pick(i) { S.pol = i; press(btns, i); render(); }
    root.appendChild(chipRow('Política da outbox', POL, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [taxa.wrap, evs.wrap]));
    [taxa, evs].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(1);
  }

  var REG = { relatorio: wRelatorio, atraso: wAtraso, lena: wLena, documento: wDocumento, composicao: wComposicao, dualwrite: wDualWrite, outbox: wOutbox };
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
