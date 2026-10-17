/* SDLabs · Databases, Modelos de Dados e Indexação: widgets em JS puro
   (calculadora de página, simulador de LSM-Tree, busca B-Tree contra varredura, escolhedor de banco).
   Todos usam a mesma tabela `pedidos` do brief (6 linhas, ~2 KB cada, página de 8 KB). */
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
  function kb(v) { return v >= 1048576 ? fmt(v / 1048576) + ' GB' : v >= 1024 ? fmt(v / 1024) + ' MB' : fmt(v) + ' KB'; }

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

  /* =============== AULA 10: calculadora de linhas por página =============== */
  function wPageCalc(root) {
    var PAGES = [4, 8, 16];
    var ROWS = [0.5, 1, 2, 9];
    var COUNTS = [6, 1000, 1000000];
    var S = { p: 1, r: 2, n: 0 };
    var pB = [], rB = [], nB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(pB, S.p); press(rB, S.r); press(nB, S.n);
      var page = PAGES[S.p], row = ROWS[S.r], n = COUNTS[S.n];
      var fits = row <= page;
      var perPage = fits ? Math.floor(page / row) : 0;
      var pagesPerRow = fits ? 0 : Math.ceil(row / page);
      var pages = fits ? Math.ceil(n / perPage) : n * pagesPerRow;
      var readKb = (fits ? 1 : pagesPerRow) * page;
      var waste = Math.max(0, Math.round((1 - row / readKb) * 100));
      clear(out);
      var rows = [
        ['Linhas por página', fits ? fmt(perPage) : 'não cabe: a linha ocupa ' + pagesPerRow + ' páginas'],
        ['Páginas que a tabela ocupa', fmt(pages) + ' (' + kb(pages * page) + ')'],
        ['Varredura (ler tudo)', fmt(pages) + ' páginas lidas'],
        ['Ler 1 pedido pelo índice', kb(readKb) + ' lidos para ~' + fmt(row) + ' KB úteis (' + waste + '% de sobra)']
      ];
      var tb = el('tbody');
      rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })])); });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]));
      var note = fits
        ? (S.n === 0 && S.p === 1 && S.r === 2 ? 'É a conta da figura: 4 linhas por página de 8 KB, 6 linhas em 2 páginas. Com 16 KB, as 6 linhas cabem em 1 página.' : 'Conta simples: tamanho da página dividido pelo da linha, sem cabeçalho da página.')
        : 'Uma linha maior que a página é dividida em mais de uma (ou o campo grande vai para outro lugar). Cada leitura custa ' + pagesPerRow + ' páginas.';
      out.appendChild(el('p', { class: 'sr-note', text: note }));
    }

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Tamanho da página' }));
    root.appendChild(chipRow('Tamanho da página', PAGES.map(function (v) { return v + ' KB'; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Tamanho da linha' }));
    root.appendChild(chipRow('Tamanho da linha', ROWS.map(function (v) { return fmt(v) + ' KB'; }), rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Linhas na tabela' }));
    root.appendChild(chipRow('Linhas na tabela', COUNTS.map(function (v) { return fmt(v); }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'PostgreSQL usa 8 KB e InnoDB usa 16 KB. O tamanho da linha de 2 KB é exemplo para a conta ficar redonda: uma linha real de pedido costuma ter bem menos.' }));
    render();
  }

  /* =============== AULA 11: simulador de LSM-Tree =============== */
  var CAP = 4;
  var ORDERS = {
    1041: 'Caio · caneca azul · qtd 2', 1042: 'Lena · gato de pelúcia · qtd 1', 1043: 'Bia · gato de pelúcia · qtd 1',
    1044: 'Lena · caneca azul · qtd 1', 1045: 'Davi · camiseta preta · qtd 3', 1046: 'Bia · caneca azul · qtd 1'
  };
  function wLsm(root) {
    var S;
    function fresh() { return { wal: [], mem: {}, ssts: [], next: 1041, n: 0, msg: 'Grave o primeiro pedido. A memtable deste exemplo comporta 4 entradas.', trace: null }; }
    S = fresh();

    var walBox = el('ol', { class: 'ls-list' });
    var memBox = el('ul', { class: 'ls-list' });
    var diskBox = el('div', { class: 'ls-disk' });
    var msg = el('p', { class: 'ls-msg', 'aria-live': 'polite' });
    var traceBox = el('ol', { class: 'ib-tl ls-trace', 'aria-live': 'polite' });
    var bW = el('button', { type: 'button', class: 'btn primary', text: 'Gravar próximo pedido' });
    var bU = el('button', { type: 'button', class: 'btn', text: 'Atualizar o 1042 (qtd 2)' });
    var bD = el('button', { type: 'button', class: 'btn', text: 'Apagar o 1044' });
    var bC = el('button', { type: 'button', class: 'btn', text: 'Compactar' });
    var bR = el('button', { type: 'button', class: 'btn', text: 'Reiniciar' });

    function memKeys() { return Object.keys(S.mem).map(Number).sort(function (a, b) { return a - b; }); }
    function label(e) { return e.tomb ? 'tombstone (apagado)' : e.v; }
    function put(k, e, what) {
      S.wal.push({ k: k, e: e });
      S.mem[k] = e;
      S.msg = what + ' Foi para o WAL e para a memtable, e a resposta "gravado" já pode voltar.';
      if (memKeys().length >= CAP) {
        S.n++;
        var data = {};
        memKeys().forEach(function (key) { data[key] = S.mem[key]; });
        S.ssts.unshift({ name: 'SSTable ' + S.n, data: data });
        S.mem = {}; S.wal = [];
        S.msg += ' A memtable encheu (4 entradas): foi despejada em um arquivo novo, a SSTable ' + S.n + ', e o WAL foi esvaziado.';
      }
      S.trace = null;
      render();
    }
    bW.addEventListener('click', function () {
      var k = S.next++;
      var v = ORDERS[k] || ('pedido novo ' + k + ' (exemplo)');
      put(k, { v: v }, 'Pedido ' + k + ' gravado.');
    });
    bU.addEventListener('click', function () { put(1042, { v: 'Lena · gato de pelúcia · qtd 2 (versão nova)' }, 'Nova versão do 1042: a LSM não altera o arquivo antigo, grava outra versão.'); });
    bD.addEventListener('click', function () { put(1044, { tomb: true }, 'Apagar o 1044 grava um tombstone, e não remove nada ainda.'); });
    bC.addEventListener('click', function () {
      if (S.ssts.length < 2) { S.msg = 'A compactação junta SSTables: precisa de pelo menos 2 no disco. Grave mais pedidos até a memtable despejar outra vez.'; S.trace = null; render(); return; }
      var merged = {}, before = S.ssts.length, dropped = 0;
      S.ssts.slice().reverse().forEach(function (t) {
        Object.keys(t.data).forEach(function (k) { if (merged[k]) dropped++; merged[k] = t.data[k]; });
      });
      Object.keys(merged).forEach(function (k) { if (merged[k].tomb) { delete merged[k]; dropped++; } });
      S.n++;
      S.ssts = [{ name: 'SSTable ' + S.n + ' (compactada)', data: merged }];
      S.msg = 'Compactação: ' + before + ' SSTables viraram 1. Ficou só a versão mais nova de cada chave; ' + dropped + ' versão(ões) velha(s) ou tombstone(s) foram descartados.';
      S.trace = null; render();
    });
    bR.addEventListener('click', function () { S = fresh(); render(); });

    function read(k) {
      var steps = [], opened = 0, found = null;
      var m = S.mem[k];
      if (m) { steps.push({ t: 'Memtable', o: 'Achou: ' + label(m) + '.', hit: true }); found = m; }
      else steps.push({ t: 'Memtable', o: 'Não tem o ' + k + '.' });
      for (var i = 0; !found && i < S.ssts.length; i++) {
        var t = S.ssts[i], e = t.data[k];
        if (!e) steps.push({ t: t.name, o: 'Filtro de Bloom: "certamente não está aqui". Arquivo pulado, 0 leituras.' });
        else { opened++; steps.push({ t: t.name, o: 'Filtro de Bloom: "talvez". Abriu o arquivo e achou: ' + label(e) + '.', hit: true }); found = e; }
      }
      var res = !found ? 'Pedido ' + k + ' não existe.' : found.tomb ? 'O 1044 foi apagado: o tombstone mais novo manda, e a leitura responde "não existe".' : 'Resposta: ' + found.v + '.';
      S.trace = { k: k, steps: steps, opened: opened, res: res };
      render();
    }

    function render() {
      clear(walBox); clear(memBox); clear(diskBox); clear(traceBox);
      if (!S.wal.length) walBox.appendChild(el('li', { class: 'ls-empty', text: 'vazio' }));
      S.wal.forEach(function (w) { walBox.appendChild(el('li', { text: w.k + (w.e.tomb ? ' (apagar)' : ' → ' + w.e.v) })); });
      var mk = memKeys();
      if (!mk.length) memBox.appendChild(el('li', { class: 'ls-empty', text: 'vazia' }));
      mk.forEach(function (k) { memBox.appendChild(el('li', { text: k + ' → ' + label(S.mem[k]) })); });
      if (!S.ssts.length) diskBox.appendChild(el('p', { class: 'ls-empty', text: 'Nenhuma SSTable ainda.' }));
      S.ssts.forEach(function (t, i) {
        var keys = Object.keys(t.data).map(Number).sort(function (a, b) { return a - b; });
        diskBox.appendChild(el('div', { class: 'ls-sst' }, [
          el('strong', { text: t.name + (i === 0 ? ' · mais nova' : '') }),
          el('span', { text: keys.map(function (k) { return k + (t.data[k].tomb ? '✕' : ''); }).join(', ') })
        ]));
      });
      msg.textContent = S.msg;
      bU.disabled = false; bD.disabled = false;
      if (S.trace) {
        traceBox.appendChild(el('li', { class: 'ib-step now' }, [el('strong', { text: 'Leitura do pedido ' + S.trace.k + ': ' + S.trace.opened + ' SSTable(s) aberta(s)' })]));
        S.trace.steps.forEach(function (s) {
          traceBox.appendChild(el('li', { class: 'ib-step' + (s.hit ? ' now' : '') }, [
            el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who', text: s.t })]),
            el('p', { class: 'ib-out', text: s.o })
          ]));
        });
        traceBox.appendChild(el('li', { class: 'ib-verdict ok' }, [el('strong', { text: S.trace.res })]));
      }
    }

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Escreva' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bW, bU, bD, bC, bR]));
    root.appendChild(msg);
    root.appendChild(el('div', { class: 'ls-grid' }, [
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'WAL (disco, só acréscimo)' }), walBox]),
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'Memtable (memória, até 4)' }), memBox]),
      el('div', { class: 'ls-panel' }, [el('p', { class: 'ls-h', text: 'Disco: SSTables (imutáveis)' }), diskBox])
    ]));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Leia um pedido' }));
    var rb = [];
    var ids = [1041, 1042, 1043, 1044, 1045, 1046, 1099];
    root.appendChild(chipRow('Pedido a ler', ids.map(function (v) { return v === 1099 ? '1099 (não existe)' : String(v); }), rb, function (i) { press(rb, i); read(ids[i]); }));
    root.appendChild(traceBox);
    root.appendChild(el('p', { class: 'sr-note', text: 'No exemplo o filtro de Bloom nunca erra. Num banco de verdade ele pode dizer "talvez" para uma chave que não está (a leitura abre o arquivo à toa), mas nunca diz "não está" para uma chave que está. ✕ marca tombstone.' }));
    render();
  }

  /* =============== AULA 12: B-Tree contra varredura =============== */
  var FANOUT = 409; // chaves por página interna: 8.192 bytes ÷ ~20 bytes por entrada (exemplo)
  function levels(rows) {
    var rowsPerPage = 4, n = Math.ceil(rows / rowsPerPage), lv = 1;
    while (n > 1) { n = Math.ceil(n / FANOUT); lv++; }
    return lv;
  }
  function wBtree(root) {
    var IDS = [1041, 1042, 1043, 1044, 1045, 1046];
    var COUNTS = [6, 1000, 1000000, 1000000000];
    var S = { id: 1, mode: 1, step: 1, n: 0 };
    var idB = [], mB = [], nB = [];
    var tl = el('ol', { class: 'ib-tl' });
    var verdict = el('div', { class: 'ib-verdict hide' });
    var counter = el('span', { class: 'ib-count' });
    var back = el('button', { type: 'button', class: 'btn', text: '← Passo anterior' });
    var next = el('button', { type: 'button', class: 'btn primary', text: 'Próximo passo →' });
    var scale = el('div', { class: 'sr-tablewrap' });
    var scaleNote = el('p', { class: 'sr-note' });

    function steps() {
      var id = IDS[S.id];
      if (S.mode === 0) {
        return [
          { t: 'Varredura', p: 'Página 1 (1041, 1042, 1043, 1044)', o: 'Lê a página inteira (8 KB) e confere as 4 linhas.' + (id <= 1044 ? ' O ' + id + ' está aqui, mas o banco ainda não sabe que não há outro.' : ' Nenhuma linha é o ' + id + '.') },
          { t: 'Varredura', p: 'Página 2 (1045, 1046)', o: id >= 1045 ? 'Achou o ' + id + '. Fim da tabela.' : 'Confere o resto da tabela e termina.' }
        ];
      }
      var left = id < 1043;
      return [
        { t: 'B-Tree', p: 'Raiz [1043]', o: id + (left ? ' é menor que 1043: desce para a folha da esquerda.' : ' é 1043 ou maior: desce para a folha da direita.') },
        { t: 'B-Tree', p: left ? 'Folha [1041, 1042]' : 'Folha [1043, 1044, 1045, 1046]', o: 'Achou o ' + id + ' nesta folha.' }
      ];
    }
    function render() {
      press(idB, S.id); press(mB, S.mode); press(nB, S.n);
      var st = steps();
      clear(tl);
      st.forEach(function (s, i) {
        if (i >= S.step) return;
        tl.appendChild(el('li', { class: 'ib-step' + (i === S.step - 1 ? ' now' : '') }, [
          el('div', { class: 'ib-head' }, [el('span', { class: 'ib-who' + (S.mode ? '' : ' t2'), text: s.t }), el('span', { class: 'ib-n', text: 'Leitura ' + (i + 1) + ' de página' })]),
          el('p', { class: 'ib-db', text: s.p }),
          el('p', { class: 'ib-out', text: s.o })
        ]));
      });
      clear(verdict);
      var done = S.step === st.length;
      verdict.className = 'ib-verdict' + (done ? ' ok' : ' hide');
      if (done) {
        verdict.appendChild(el('strong', { text: S.step + ' páginas lidas. ' }));
        verdict.appendChild(document.createTextNode((S.mode === 0 ? 'A varredura leu a tabela toda: 2 páginas. ' : 'A B-Tree desceu da raiz à folha: 2 páginas. ') + 'Com 6 linhas, os dois jeitos empatam. Suba o tamanho da tabela abaixo e veja quando a árvore passa a valer a pena.'));
      }
      counter.textContent = 'Páginas lidas: ' + S.step;
      back.disabled = S.step <= 1;
      next.disabled = done;

      var rows = COUNTS[S.n], scan = Math.ceil(rows / 4), lv = levels(rows);
      clear(scale);
      var tb = el('tbody');
      [['Varredura', fmt(scan) + ' páginas (' + kb(scan * 8) + ')'], ['B-Tree', fmt(lv) + ' páginas (' + lv + ' níveis)'],
        ['Diferença', lv >= scan ? 'empate (a árvore não compensa em tabela tão pequena)' : fmt(Math.round(scan / lv)) + ' vezes menos leituras com a árvore']].forEach(function (r) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })]));
      });
      scale.appendChild(el('table', { class: 'sr-table pc-table' }, [tb]));
      scaleNote.textContent = 'Linhas de ~2 KB, 4 por página de 8 KB, e ~' + FANOUT + ' chaves por página interna (exemplo). A árvore cresce em largura: cada nível novo multiplica por ' + FANOUT + ' o que ela alcança.';
    }
    back.addEventListener('click', function () { if (S.step > 1) { S.step--; render(); } });
    next.addEventListener('click', function () { S.step++; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Qual pedido procurar' }));
    root.appendChild(chipRow('Pedido', IDS.map(String), idB, function (i) { S.id = i; S.step = 1; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Como procurar' }));
    root.appendChild(chipRow('Método', ['Varredura (sem índice)', 'B-Tree'], mB, function (i) { S.mode = i; S.step = 1; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Avance as leituras' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [back, next, counter]));
    root.appendChild(tl);
    root.appendChild(verdict);
    root.appendChild(el('p', { class: 'sr-sub', text: '4. E se a tabela crescer?' }));
    root.appendChild(chipRow('Linhas na tabela', COUNTS.map(function (v) { return fmt(v) + ' linhas'; }), nB, function (i) { S.n = i; render(); }));
    root.appendChild(scale);
    root.appendChild(scaleNote);
    render();
  }

  /* =============== AULA 15: escolhedor de banco =============== */
  var SCEN = [
    { q: 'A Lena paga o gato de pelúcia: o pedido é gravado e o estoque diminui, tudo ou nada.', model: 'Relacional (linhas)', index: 'B-Tree em chaves e índices secundários', cons: 'Forte (ACID). Na partição de rede, CP.', lose: 'Latência de commit e escala horizontal fácil.', ex: 'PostgreSQL, MySQL, SQL Server' },
    { q: 'Milhões de cliques e métricas por segundo chegam à loja, e nenhum pode se perder.', model: 'Coluna larga ou séries temporais', index: 'LSM-Tree (WAL, memtable, SSTable)', cons: 'Eventual, com replicação assíncrona.', lose: 'Leitura mais complexa e dado possivelmente velho por um tempo.', ex: 'Cassandra, ScyllaDB, InfluxDB' },
    { q: 'O carrinho da Lena e a sessão de login dela.', model: 'Chave-valor, em memória', index: 'Hash da chave (carrinho:lena, sessao:lena)', cons: 'Simples; o dado pode ser refeito.', lose: 'Durabilidade (reiniciar pode apagar) e consulta pelo conteúdo do valor.', ex: 'Redis, Valkey, Memcached' },
    { q: 'A Lena digita "pelúcia" na busca do catálogo.', model: 'Documentos, em motor de busca', index: 'Índice invertido (pelúcia → 1042, 1043)', cons: 'Eventual: é uma cópia de leitura.', lose: 'Gravação mais cara e não serve de fonte de verdade.', ex: 'Elasticsearch, Solr, GIN do PostgreSQL' },
    { q: 'A página do gato de pelúcia mostra "quem comprou também comprou".', model: 'Grafo', index: 'Arestas COMPROU guardadas como dado; travessia', cons: 'Depende do produto; costuma ser leitura analítica.', lose: 'Somas e relatórios de tabela, que o grafo não faz bem.', ex: 'Neo4j' },
    { q: 'O financeiro quer o total de valor por cidade no mês.', model: 'Colunar', index: 'Segmentos por coluna, comprimidos', cons: 'Dados em repouso; análise, não transação.', lose: 'Ler ou gravar um pedido inteiro (mexe em todos os arquivos).', ex: 'BigQuery, Redshift, columnstore do SQL Server' }
  ];
  function wPicker(root) {
    var S = { i: -1, open: false };
    var bs = [];
    var card = el('div', { class: 'pk-card', 'aria-live': 'polite' });
    function render() {
      press(bs, S.i);
      clear(card);
      if (S.i < 0) { card.appendChild(el('p', { class: 'sr-note', text: 'Escolha uma situação acima.' })); return; }
      var s = SCEN[S.i];
      card.appendChild(el('p', { class: 'pk-q', text: s.q }));
      if (!S.open) {
        var show = el('button', { type: 'button', class: 'btn primary', text: 'Ver a resposta' });
        show.addEventListener('click', function () { S.open = true; render(); });
        card.appendChild(show);
        return;
      }
      var tb = el('tbody');
      [['Modelo', s.model], ['Índice', s.index], ['Consistência', s.cons], ['O que se aceita perder', s.lose], ['Exemplos', s.ex]].forEach(function (r) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })]));
      });
      card.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]));
    }
    var names = ['Pagamento e estoque', 'Cliques e métricas', 'Carrinho e sessão', 'Busca por texto', 'Quem comprou também comprou', 'Relatório do mês'];
    root.appendChild(el('p', { class: 'sr-sub', text: 'Situação da loja' }));
    root.appendChild(chipRow('Situação', names, bs, function (i) { S.i = i; S.open = false; render(); }));
    root.appendChild(card);
    root.appendChild(el('p', { class: 'sr-note', text: 'Escolhas de partida, não regras: depende do volume, da equipe e do que o produto já usa.' }));
    render();
  }

  var REG = { pagecalc: wPageCalc, lsm: wLsm, btreesearch: wBtree, picker: wPicker };
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
