/* SDLabs · Replicação de Dados: widgets em JS puro
   (quórum, failover, conflito de relógio e versão, latência do commit e perda, a Lena e o "meus pedidos", ECST e playground de CRDT).
   Usam a loja do brief: primário em SP, réplicas no Rio e em Recife, RTT de 10 e 80 ms, commit local de 2 ms,
   atraso da Black Friday de 300 e 800 ms, 30 pedidos/s, Patroni com ttl de 30 s. */
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
    var id = 'rp-sl-' + (++uid);
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
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table rp-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function btn(text, onClick) {
    var b = el('button', { type: 'button', class: 'btn', text: text });
    b.addEventListener('click', onClick);
    return b;
  }

  /* =============== AULA 1: quórum (do módulo 3) =============== */
  function wQuorum(root) {
    var btns = [];
    var N = 3;
    var w = slider('W: cópias que confirmam a escrita', 1, 3, 1, 2);
    var r = slider('R: cópias que respondem à leitura', 1, 3, 1, 2);
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var PRESETS = [
      { t: 'W = 2, R = 2 (maioria)', w: 2, r: 2 },
      { t: 'W = 3, R = 1 (escrita em todas)', w: 3, r: 1 },
      { t: 'W = 1, R = 1 (assíncrona)', w: 1, r: 1 },
      { t: 'W = 1, R = 3 (lê em todas)', w: 1, r: 3 }
    ];
    function render() {
      var W = +w.input.value, R = +r.input.value, sum = W + R, ok = sum > N;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('N (SP, Rio, Recife)', String(N)),
        fact('W + R', W + ' + ' + R + ' = ' + sum),
        fact('Cópias em comum', ok ? String(sum - N) + ' no mínimo' : 'pode ser nenhuma'),
        fact('Escrita tolera cair', (N - W) + (N - W === 1 ? ' nó' : ' nós')),
        fact('Leitura tolera cair', (N - R) + (N - R === 1 ? ' nó' : ' nós'))
      ]));
      out.appendChild(verdict(!ok,
        ok ? 'W + R > N: a leitura sempre vê a última escrita.' : 'W + R ≤ N: a leitura pode não ver a última escrita.',
        ok ? 'Com ' + W + ' cópias confirmando e ' + R + ' respondendo, ao menos ' + (sum - N) + ' cópia' + (sum - N > 1 ? 's' : '') + ' está nos dois conjuntos, então alguma resposta traz o dado novo (o carimbo ou a versão diz qual é o mais novo).'
          : 'Escrita em ' + W + ' e leitura em ' + R + ' cabem nas ' + N + ' cópias sem se cruzar: a leitura pode cair só nas cópias que ainda não receberam o pedido, e a Lena vê o passado. É o que acontece na replicação assíncrona (W = 1).'));
      var losses = [];
      if (W < N) losses.push('com W = ' + W + ', se o primário cair antes de repassar, o pedido pode estar em só ' + W + ' cópia' + (W > 1 ? 's' : ''));
      if (W === N) losses.push('com W = ' + N + ', a escrita para se qualquer cópia cair (a síncrona da aula 3)');
      if (R === N) losses.push('com R = ' + N + ', a leitura para se qualquer cópia cair');
      if (ok && W === 2 && R === 2) losses.push('com 2 de 3 a escrita e a leitura seguem com um nó fora do ar');
      out.appendChild(el('p', { class: 'sr-note', text: 'O que isso custa: ' + losses.join('; ') + '.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'A conta de quórum é a do módulo 3. O PostgreSQL em streaming não vota a cada leitura: o que se aproxima dela é W (synchronous_standby_names) e a escolha de onde ler.' }));
    }
    function preset(i) { w.set(PRESETS[i].w); r.set(PRESETS[i].r); press(btns, i); render(); }
    root.appendChild(chipRow('Escolhas comuns', PRESETS.map(function (p) { return p.t; }), btns, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [w.wrap, r.wrap]));
    [w, r].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 2: failover =============== */
  function wFailover(root) {
    var btns = [], S = { down: 0 };
    var ttl = slider('ttl do Patroni', 10, 60, 1, 30, 's');
    var promo = slider('Tempo para promover e reconectar', 1, 30, 1, 5, 's');
    var rate = slider('Pedidos por segundo', 1, 60, 1, 30, 'pedidos/s');
    var lagRio = slider('Atraso do Rio', 0, 2000, 10, 300, 'ms');
    var lagRec = slider('Atraso de Recife', 0, 2000, 10, 800, 'ms');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    function render() {
      var t = +ttl.input.value, p = +promo.input.value, taxa = +rate.input.value;
      var lr = +lagRio.input.value, lc = +lagRec.input.value;
      var alive = S.down === 0 ? 2 : 1, quorum = alive >= 2;
      var rto = t + p, tent = taxa * rto;
      clear(out);
      if (!quorum) {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Nós vivos', '1 de 3'), fact('Maioria precisa de', '2'), fact('Líder', 'ninguém'), fact('Escrita', 'parada')
        ]));
        out.appendChild(verdict(true, 'Sem quórum.',
          'Só Recife está vivo: 1 de 3 não é maioria, então nenhuma eleição acontece e o banco não aceita escrita até outro nó voltar. É a escolha CP do módulo 3: parar em vez de arriscar dois primários.'));
        return;
      }
      var leader = lr <= lc ? 'Rio' : 'Recife', lagL = Math.min(lr, lc);
      var perda = taxa * lagL / 1000;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('RTO', fmt(rto, 0) + ' s'),
        fact('Tentativas sem primário', fmt(tent, 0)),
        fact('Novo líder', leader),
        fact('Pedidos perdidos (assíncrona)', fmt(perda, 1)),
        fact('Quórum', '2 de 3: ok')
      ]));
      out.appendChild(table(['conta', 'resultado'], [
        { cells: [{ text: 'RTO = ttl + promoção' }, { text: t + ' + ' + p + ' = ' + rto + ' s' }] },
        { cells: [{ text: 'Sem primário = taxa × RTO' }, { text: taxa + ' × ' + rto + ' = ' + fmt(tent, 0) + ' tentativas' }] },
        { cls: leader === 'Rio' ? 'rp-cur' : '', cells: [{ text: 'Rio' }, { text: 'atraso ' + lr + ' ms, perderia ' + fmt(taxa * lr / 1000, 1) + ' pedidos' }] },
        { cls: leader === 'Recife' ? 'rp-cur' : '', cells: [{ text: 'Recife' }, { text: 'atraso ' + lc + ' ms, perderia ' + fmt(taxa * lc / 1000, 1) + ' pedidos' }] }
      ], 'rp-narrow'));
      out.appendChild(verdict(false, leader + ' vira o líder.',
        'É a réplica mais à frente no log (menor atraso: ' + lagL + ' ms). No Raft o voto só vai para quem tem o log igual ou mais atualizado, e o tempo de eleição é sorteado entre 150 e 300 ms.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'O ttl de 30 s é o padrão do Patroni (o líder precisa renovar a chave) e é o tempo até o failover começar; os 5 s de promoção e reconexão são exemplo. Na Black Friday: 30 × 35 = 1.050 tentativas; perda de 9 pedidos (Rio) ou 24 (Recife).' }));
    }
    function pick(i) { S.down = i; press(btns, i); render(); }
    root.appendChild(chipRow('Quem cai', ['só o SP', 'SP e Rio'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ttl.wrap, promo.wrap, rate.wrap, lagRio.wrap, lagRec.wrap]));
    [ttl, promo, rate, lagRio, lagRec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 2: conflito de relógio e versão =============== */
  function wConflito(root) {
    var btns = [], S = { p: 0 };
    var off = slider('Desvio do relógio de Recife', -500, 500, 10, -120, 'ms', function (v) { return (v > 0 ? '+' : '') + fmt(v, 0); });
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var SP_REAL = 100, REC_REAL = 150;
    function stamp(ms) { return '20:20:00.' + String(Math.max(0, Math.min(999, ms))).padStart(3, '0'); }
    function render() {
      var d = +off.input.value, recStamp = REC_REAL + d;
      clear(out);
      out.appendChild(table(['escrita', 'quando foi de verdade', 'carimbo gravado', 'vetor de versão'], [
        { cells: [{ text: 'SP: "Rua do Sol, 200" (atendente)' }, { text: stamp(SP_REAL) }, { text: stamp(SP_REAL) }, { text: '{SP:2, Rec:0}' }] },
        { cells: [{ text: 'Recife: "Rua da Aurora, 100" (a Lena no app)' }, { text: stamp(REC_REAL) }, { text: stamp(recStamp) }, { text: '{SP:1, Rec:1}' }] }
      ], 'rp-wide'));
      if (S.p === 0) {
        var spWins = SP_REAL >= recStamp;
        var winner = spWins ? 'SP' : 'Recife';
        var wrong = spWins; // o mais recente de verdade é Recife
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Mais recente de verdade', 'Recife'),
          fact('O LWW escolhe', winner),
          fact('Endereço que fica', spWins ? 'Rua do Sol, 200' : 'Rua da Aurora, 100'),
          fact('Escrita perdida', spWins ? 'a da Lena' : 'a do atendente')
        ]));
        out.appendChild(verdict(wrong, wrong ? 'O LWW escolhe errado.' : 'O LWW acerta, por sorte.',
          wrong ? 'O carimbo de Recife (' + stamp(recStamp) + ') é menor que o de SP (' + stamp(SP_REAL) + '), embora a escrita de Recife seja a última de verdade. A escrita da Lena some sem erro: LWW depende de relógio.'
            : 'Com o desvio em ' + fmt(d, 0) + ' ms o carimbo de Recife (' + stamp(recStamp) + ') passou o de SP, e a escrita mais recente venceu. Mude o desvio para −120 ms e ela volta a perder.'));
      } else {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('{SP:2, Rec:0} domina {SP:1, Rec:1}?', 'não (Rec: 0 < 1)'),
          fact('{SP:1, Rec:1} domina {SP:2, Rec:0}?', 'não (SP: 1 < 2)'),
          fact('Resultado', 'concorrentes'),
          fact('Depende do relógio?', 'não')
        ]));
        out.appendChild(verdict(false, 'O vetor detecta a concorrência.',
          'Nenhum vetor é maior ou igual ao outro em todas as posições, então as escritas foram feitas sem uma ter visto a outra. O sistema guarda as duas versões e a aplicação decide (por exemplo, perguntar à Lena). O desvio de ' + fmt(d, 0) + ' ms não muda nada.'));
      }
      out.appendChild(el('p', { class: 'sr-note', text: 'Um vetor A domina B quando cada posição de A é maior ou igual à de B e ao menos uma é maior. Se nenhum domina, as escritas são concorrentes (Dynamo, 2007).' }));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Política', ['LWW (último carimbo)', 'vetor de versão'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [off.wrap]));
    off.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 3: latência do commit e perda (RPO) =============== */
  function wCommit(root) {
    var btns = [], S = { m: 0 };
    var rio = slider('RTT do Rio', 1, 50, 1, 10, 'ms');
    var rec = slider('RTT de Recife', 10, 200, 5, 80, 'ms');
    var loc = slider('Commit local (disco)', 1, 10, 1, 2, 'ms');
    var rate = slider('Taxa de pedidos', 1, 60, 1, 30, 'pedidos/s');
    var lagRio = slider('Atraso do Rio', 0, 2000, 10, 300, 'ms');
    var lagRec = slider('Atraso de Recife', 0, 2000, 10, 800, 'ms');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var MODES = ['assíncrona', 'semi (espera o Rio)', 'semi (espera Recife)', 'síncrona (Rio e Recife)'];
    function render() {
      var a = +rio.input.value, b = +rec.input.value, l = +loc.input.value, taxa = +rate.input.value;
      var lr = +lagRio.input.value, lc = +lagRec.input.value;
      var wait = [0, a, b, Math.max(a, b)][S.m], lat = l + wait, cps = 1000 / lat;
      var waitsRio = S.m === 1 || S.m === 3, waitsRec = S.m === 2 || S.m === 3;
      var perdaRio = waitsRio ? 0 : taxa * lr / 1000, perdaRec = waitsRec ? 0 : taxa * lc / 1000;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Latência do commit', fmt(lat, 0) + ' ms'),
        fact('Commits/s por conexão', fmt(cps, 0)),
        fact('Perda se o Rio for promovido', fmt(perdaRio, 1) + ' pedidos'),
        fact('Perda se Recife for promovido', fmt(perdaRec, 1) + ' pedidos')
      ]));
      var conta = S.m === 0 ? l + ' ms (só o disco)' : l + ' + ' + (S.m === 3 ? 'máx(' + a + ', ' + b + ')' : String(wait)) + ' = ' + lat + ' ms';
      out.appendChild(table(['conta', 'resultado'], [
        { cells: [{ text: 'Commit' }, { text: conta }] },
        { cells: [{ text: 'Commits por segundo' }, { text: '1.000 ÷ ' + lat + ' = ' + fmt(cps, 1) }] },
        { cls: waitsRio ? '' : 'rp-bad', cells: [{ text: 'Rio promovido' }, { text: waitsRio ? 'o Rio já confirmou: 0 pedidos' : taxa + ' × ' + fmt(lr / 1000, 2) + ' s = ' + fmt(perdaRio, 1) + ' pedidos' }] },
        { cls: waitsRec ? '' : 'rp-bad', cells: [{ text: 'Recife promovido' }, { text: waitsRec ? 'Recife já confirmou: 0 pedidos' : taxa + ' × ' + fmt(lc / 1000, 2) + ' s = ' + fmt(perdaRec, 1) + ' pedidos' }] }
      ], 'rp-narrow'));
      var lost = Math.min(perdaRio, perdaRec) > 0;
      out.appendChild(verdict(lost,
        lost ? 'Há janela de perda.' : 'Perda zero enquanto as réplicas esperadas respondem.',
        lost ? 'A réplica promovida pode estar atrás do que o primário confirmou, e o que falta é taxa × atraso.' : 'O que o primário confirmou já está na réplica esperada; o preço é esperar o RTT dela no commit.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Exemplo da loja: 2 ms (assíncrona), 12 ms (semi com o Rio), 82 ms (síncrona), e perdas de 9 e 24 pedidos na Black Friday (30/s, atraso de 300 e 800 ms). O ack conta até a réplica gravar o log; com remote_apply entra também o atraso de aplicar. A semi-síncrona do MariaDB volta a ser assíncrona depois de 10 s sem ack; a do PostgreSQL espera.' }));
    }
    root.appendChild(chipRow('Modo', MODES, btns, function (i) { S.m = i; press(btns, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rio.wrap, rec.wrap, loc.wrap, rate.wrap, lagRio.wrap, lagRec.wrap]));
    [rio, rec, loc, rate, lagRio, lagRec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    press(btns, 0);
    render();
  }

  /* =============== AULA 3: a Lena e o "meus pedidos" =============== */
  function wLena(root) {
    var btns = [], S = { s: 0 };
    var lag = slider('Atraso da réplica de Recife', 0, 2000, 10, 800, 'ms');
    var t = slider('A Lena abre a tela', 0, 2000, 10, 300, 'ms depois do pedido');
    var nSec = slider('Janela no primário (N)', 1, 10, 1, 2, 's');
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var LOCAL = 2, RTT = 80, READ = 2;
    var STRATS = ['ler da réplica', 'primário por N s', 'token de LSN', 'remote_apply'];
    function render() {
      var L = +lag.input.value, T = +t.input.value, N = +nSec.input.value;
      var appearAt = LOCAL + L; // o 1055 chega a Recife quando o log é aplicado
      var commitDone = LOCAL, sees, cost, where, extra = '';
      if (S.s === 0) {
        where = 'réplica de Recife'; cost = READ; sees = T >= appearAt;
      } else if (S.s === 1) {
        if (T <= N * 1000) { where = 'primário em SP'; cost = READ + RTT; sees = T >= LOCAL; }
        else { where = 'réplica de Recife'; cost = READ; sees = T >= appearAt; extra = ' A janela de ' + N + ' s já passou e a leitura voltou para a réplica.'; }
      } else if (S.s === 2) {
        if (T >= appearAt) { where = 'réplica de Recife'; cost = READ; sees = true; extra = ' O replay_lsn já passou do token.'; }
        else { where = 'primário em SP (o replay_lsn ainda está atrás do token)'; cost = READ + RTT; sees = T >= LOCAL; }
      } else {
        commitDone = Math.max(LOCAL + RTT, appearAt);
        where = 'réplica de Recife'; cost = READ; sees = T >= commitDone;
      }
      clear(out);
      var facts = [
        fact('O 1055 aparece em Recife', 'às 20:10:00.' + String(Math.min(999, appearAt)).padStart(3, '0') + (appearAt > 999 ? ' (+' + fmt(appearAt - 999, 0) + ' ms)' : '')),
        fact('A Lena abre a tela', 'às 20:10:00.' + String(Math.min(999, T)).padStart(3, '0')),
        fact('Lê de', where),
        fact('Custo da leitura', fmt(cost, 0) + ' ms')
      ];
      if (S.s === 3) facts.push(fact('Commit demora', fmt(commitDone, 0) + ' ms'));
      out.appendChild(el('div', { class: 'sr-facts' }, facts));
      if (S.s === 3 && T < commitDone) {
        out.appendChild(verdict(true, 'A tela abriu antes de o commit confirmar.',
          'Com remote_apply o primário só diz "pronto" depois de a réplica aplicar, em ' + fmt(commitDone, 0) + ' ms. A Lena ainda não recebeu a confirmação do pedido; depois dela, a leitura em Recife já mostra o 1055.'));
      } else {
        out.appendChild(verdict(!sees, sees ? 'O 1055 aparece.' : 'O 1055 não aparece.',
          sees ? 'A tela lê do ' + where + ' e o pedido está lá.' + extra
            : 'A tela lê da réplica de Recife, que só terá o 1055 em ' + fmt(appearAt, 0) + ' ms, e mostra o 1054 como último pedido.' + extra));
      }
      var notes = {
        0: 'Leitura de 2 ms, mas a Lena vê o passado enquanto a réplica estiver atrás (800 ms na Black Friday).',
        1: 'Sempre vê o pedido dentro da janela, ao custo de +80 ms de RTT por leitura. Depois da janela a leitura volta para a réplica.',
        2: 'O primário informa o LSN do commit (0/8004430 no laboratório) e a aplicação só lê da réplica quando pg_last_wal_replay_lsn() >= token; se não, lê do primário.',
        3: 'O commit espera a réplica aplicar: cerca de 82 ms com atraso baixo e, com a réplica atrasada, o atraso inteiro entra no commit.'
      };
      out.appendChild(el('p', { class: 'sr-note', text: notes[S.s] }));
    }
    root.appendChild(chipRow('Estratégia', STRATS, btns, function (i) { S.s = i; press(btns, i); nSec.wrap.hidden = i !== 1; render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lag.wrap, t.wrap, nSec.wrap]));
    [lag, t, nSec].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    nSec.wrap.hidden = true;
    press(btns, 0);
    render();
  }

  /* =============== AULA 4: ECST, ordem e versão =============== */
  function wEcst(root) {
    var btns = [], dupBtns = [], S = { o: 1, d: 0 };
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var EV = {
      v8: { v: 8, end: 'Rua da Aurora, 100' },
      v9: { v: 9, end: 'Rua do Sol, 200' }
    };
    function seq() {
      var s = S.o === 0 ? ['v8', 'v9'] : ['v9', 'v8'];
      if (S.d === 1) s = s.concat([s[s.length - 1]]);
      return s;
    }
    function render() {
      var s = seq(), blind = null, safe = null, rows = [];
      s.forEach(function (k, i) {
        var e = EV[k];
        blind = e;
        var apply = !safe || e.v > safe.v;
        if (apply) safe = e;
        rows.push({ cls: apply ? '' : 'rp-bad', cells: [
          { text: (i + 1) + '. chega ' + k + (i > 0 && s[i - 1] === k ? ' (repetida)' : '') },
          { text: '"' + e.end + '" (v' + e.v + ')' },
          { text: apply ? 'aplica: fica v' + e.v : 'descarta: continua v' + safe.v }
        ] });
      });
      clear(out);
      out.appendChild(el('ul', { class: 'rp-queue', 'aria-label': 'Fila do entregas' }, s.map(function (k) {
        return el('li', { text: 'ClienteAtualizado ' + k });
      })));
      out.appendChild(table(['evento', 'o que traz', 'regra: aplica só se a versão for maior'], rows, 'rp-wide'));
      var badBlind = blind.v !== 9, badSafe = safe.v !== 9;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Sem a regra (às cegas)', blind.end + ' (v' + blind.v + ')'),
        fact('Com a regra da versão', safe.end + ' (v' + safe.v + ')'),
        fact('Endereço certo', EV.v9.end + ' (v9)')
      ]));
      out.appendChild(verdict(badBlind, badBlind ? 'Às cegas, o endereço fica velho.' : 'Às cegas acerta, por causa da ordem.',
        badBlind ? 'O último evento a chegar foi a v8 e ele sobrescreveu a v9: a caneca vai para a Rua da Aurora, 100.' : 'O último a chegar foi a v9. Troque a ordem e o resultado muda.'));
      out.appendChild(verdict(badSafe, badSafe ? 'Com a regra, ainda erra.' : 'Com a regra, fica o endereço certo.',
        'A versão do evento só é aplicada se for maior que a da cópia, então a v8 atrasada e qualquer repetição são descartadas.'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Ordem trocada acontece, por exemplo, depois de um reparticionamento do tópico (de 3 para 6 partições). A regra funciona porque o evento carrega o estado inteiro e o campo versao.' }));
    }
    root.appendChild(chipRow('Ordem de chegada', ['v8 e v9 (certa)', 'v9 e v8 (trocada)'], btns, function (i) { S.o = i; press(btns, i); render(); }));
    root.appendChild(chipRow('Repetição', ['sem duplicata', 'último evento repetido'], dupBtns, function (i) { S.d = i; press(dupBtns, i); render(); }));
    root.appendChild(out);
    press(btns, 1); press(dupBtns, 0);
    render();
  }

  /* =============== AULA 6: playground de CRDT =============== */
  var SITES = ['SP', 'Rio', 'Recife'];
  function newState() {
    return {
      g: { SP: 120, Rio: 80, Recife: 50 },
      p: { SP: 1, Rio: 0, Recife: 0 }, n: { SP: 0, Rio: 0, Recife: 0 },
      adds: { caneca: ['t0'] }, rem: {}
    };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function maxMap(a, b) {
    var r = {};
    SITES.forEach(function (s) { r[s] = Math.max(a[s] || 0, b[s] || 0); });
    return r;
  }
  function union(a, b) {
    var r = a.slice();
    b.forEach(function (x) { if (r.indexOf(x) < 0) r.push(x); });
    return r.sort();
  }
  function merge(a, b) {
    var r = { g: maxMap(a.g, b.g), p: maxMap(a.p, b.p), n: maxMap(a.n, b.n), adds: {}, rem: {} };
    var keys = Object.keys(a.adds).concat(Object.keys(b.adds), Object.keys(a.rem), Object.keys(b.rem));
    keys.forEach(function (k) {
      r.adds[k] = union(a.adds[k] || [], b.adds[k] || []);
      r.rem[k] = union(a.rem[k] || [], b.rem[k] || []);
    });
    return r;
  }
  function sum(m) { return SITES.reduce(function (t, s) { return t + (m[s] || 0); }, 0); }
  function items(st) {
    return Object.keys(st.adds).filter(function (k) {
      var rem = st.rem[k] || [];
      return st.adds[k].some(function (t) { return rem.indexOf(t) < 0; });
    }).sort();
  }
  function canon(st) { return JSON.stringify([st.g, st.p, st.n, items(st), sum(st.p) - sum(st.n)]); }
  function show(st) { return { g: sum(st.g), cart: items(st), stock: sum(st.p) - sum(st.n) }; }

  function wCrdt(root) {
    var states, partitioned, tagN, runs, ok;
    var out = el('div', { class: 'rp-out', 'aria-live': 'polite' });
    var note = el('p', { class: 'sr-note', role: 'status' });
    var partBtn;
    function reset() {
      states = { SP: newState(), Rio: newState(), Recife: newState() };
      partitioned = false; tagN = 0; runs = 0; ok = 0; note.textContent = '';
      partBtn.setAttribute('aria-pressed', 'false');
    }
    function syncAll() {
      var all = states.SP;
      all = merge(all, states.Rio); all = merge(all, states.Recife);
      SITES.forEach(function (s) { states[s] = clone(all); });
    }
    function after() { if (!partitioned) syncAll(); render(); }
    function inc(s, k) { states[s].g[s] += k; after(); }
    function addItem(s, name) {
      var st = states[s];
      st.adds[name] = (st.adds[name] || []).concat(['n' + (++tagN) + s]).sort();
      after();
    }
    function removeItem(s, name) {
      var st = states[s];
      if (items(st).indexOf(name) < 0) { note.textContent = s + ' não tem ' + name + ' no carrinho.'; render(); return; }
      st.rem[name] = union(st.rem[name] || [], st.adds[name] || []);
      after();
    }
    function sell(s) {
      var st = states[s];
      if (sum(st.p) - sum(st.n) <= 0) { note.textContent = s + ' vê estoque 0 e recusa a venda.'; render(); return; }
      st.n[s] += 1;
      after();
    }
    function setPartition(v) {
      partitioned = v; partBtn.setAttribute('aria-pressed', v ? 'true' : 'false');
      if (!v) syncAll();
      render();
    }
    function scenarioText() {
      reset(); partitioned = true; partBtn.setAttribute('aria-pressed', 'true');
      states.SP.g.SP += 15; states.Recife.g.Recife += 8;
      var t1 = 'n' + (++tagN) + 'Recife';
      states.Recife.adds.gato = [t1];
      states.SP.rem.caneca = ['t0'];
      states.SP.n.SP += 1; states.Recife.n.Recife += 1;
      note.textContent = 'Rede partida. SP: +15 visualizações, remove a caneca, vende 1. Recife: +8, adiciona o gato, vende 1. Agora aperte "Juntar".';
      render();
    }
    function scenarioAdd() {
      reset(); partitioned = true; partBtn.setAttribute('aria-pressed', 'true');
      states.SP.rem.caneca = ['t0'];
      states.Recife.adds.caneca = ['t0', 'n' + (++tagN) + 'Recife'];
      note.textContent = 'Rede partida. SP remove a caneca e Recife a adiciona de novo ao mesmo tempo. Aperte "Juntar": a caneca fica (add vence).';
      render();
    }
    function shuffle() {
      var snap = SITES.map(function (s) { return clone(states[s]); });
      var msgs = snap.slice();
      var extra = 2 + Math.floor(Math.random() * 4);
      for (var i = 0; i < extra; i++) msgs.push(clone(snap[Math.floor(Math.random() * 3)]));
      for (var j = msgs.length - 1; j > 0; j--) { var k = Math.floor(Math.random() * (j + 1)); var tmp = msgs[j]; msgs[j] = msgs[k]; msgs[k] = tmp; }
      var empty = { g: { SP: 0, Rio: 0, Recife: 0 }, p: { SP: 0, Rio: 0, Recife: 0 }, n: { SP: 0, Rio: 0, Recife: 0 }, adds: {}, rem: {} };
      var r1 = msgs.reduce(merge, empty);
      var r2 = merge(merge(snap[0], snap[1]), snap[2]);
      runs += 1; if (canon(r1) === canon(r2)) ok += 1;
      var s = show(r1);
      note.textContent = 'Ordem aleatória, ' + msgs.length + ' mensagens (' + (msgs.length - 3) + ' duplicadas): visualizações ' + s.g + ', carrinho {' + s.cart.join(', ') + '}, estoque ' + s.stock + '. Mesmo resultado da junção em ordem: ' + (canon(r1) === canon(r2) ? 'sim' : 'não') + '. Rodadas que convergiram: ' + ok + ' de ' + runs + '.';
      render();
    }
    function render() {
      clear(out);
      var rows = SITES.map(function (s) {
        var v = show(states[s]);
        return { cells: [
          { text: s },
          { text: '{SP: ' + states[s].g.SP + ', Rio: ' + states[s].g.Rio + ', Recife: ' + states[s].g.Recife + '} = ' + v.g },
          { text: '{' + v.cart.join(', ') + '}' },
          { text: String(v.stock), cls: v.stock < 0 ? 'rp-cell bad' : 'rp-cell' }
        ] };
      });
      out.appendChild(table(['site', 'visualizações', 'carrinho', 'estoque'], rows, 'rp-wide'));
      out.appendChild(el('p', { class: 'sr-note', text: 'Colunas: G-Counter (visualizações do gato 42), OR-Set (carrinho da Lena) e PN-Counter (estoque da caneca).' }));
      var all = merge(merge(states.SP, states.Rio), states.Recife), v = show(all);
      var diverge = canon(states.SP) !== canon(all) || canon(states.Rio) !== canon(all) || canon(states.Recife) !== canon(all);
      if (diverge) out.appendChild(verdict(false, 'Os sites ainda divergem.', 'Se juntar agora, o resultado é ' + v.g + ' visualizações, {' + v.cart.join(', ') + '} no carrinho e estoque ' + v.stock + '.'));
      else out.appendChild(verdict(v.stock < 0, v.stock < 0 ? 'Convergiu, e o estoque está em ' + v.stock + '.' : 'Os três sites estão iguais.',
        v.stock < 0 ? 'A junção é correta e igual nos três, e mesmo assim vendeu a última caneca duas vezes: CRDT não protege "estoque ≥ 0".'
          : 'Visualizações ' + v.g + ', carrinho {' + v.cart.join(', ') + '}, estoque ' + v.stock + '.'));
      out.appendChild(note);
    }
    function siteRow(s) {
      var rw = el('div', { class: 'rp-site' }, [el('span', { class: 'rp-state', text: s + ':' })]);
      rw.appendChild(btn('+1 visualização', function () { inc(s, 1); }));
      rw.appendChild(btn('adicionar gato', function () { addItem(s, 'gato'); }));
      rw.appendChild(btn('remover caneca', function () { removeItem(s, 'caneca'); }));
      rw.appendChild(btn('vender 1 caneca', function () { sell(s); }));
      return rw;
    }
    partBtn = el('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', text: 'Partir a rede' });
    partBtn.addEventListener('click', function () { setPartition(partBtn.getAttribute('aria-pressed') !== 'true'); });
    reset();
    root.appendChild(el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Rede e cenários' }, [
      partBtn,
      btn('Juntar', function () { setPartition(false); }),
      btn('Cenário do texto', scenarioText),
      btn('Cenário: add vence', scenarioAdd),
      btn('Ordem aleatória, com duplicatas', shuffle),
      btn('Zerar', function () { reset(); render(); })
    ]));
    SITES.forEach(function (s) { root.appendChild(siteRow(s)); });
    root.appendChild(out);
    render();
  }

  var REG = { quorum: wQuorum, failover: wFailover, conflito: wConflito, commit: wCommit, lena: wLena, ecst: wEcst, crdt: wCrdt };
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
