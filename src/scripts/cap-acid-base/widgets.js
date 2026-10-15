/* SDLabs · Teorema CAP, ACID e BASE: widgets em JS puro (simulador de níveis de isolamento) */
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

  /* =============== AULA 2: níveis de isolamento ===============
     Duas transações, T1 e T2, mexem na conta da Lia (saldo R$ 1.000).
     Cada cenário mostra a pior intercalação que o nível PERMITE. */
  var LEVELS = ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'];
  var SHORT = ['RU', 'RC', 'RR', 'SER'];
  var ANOM = ['Dirty read', 'Non-repeatable read', 'Phantom', 'Lost update'];
  var ANOM_SHORT = ['Dirty', 'Não-rep.', 'Phantom', 'Lost upd.'];

  // pode[nível][anomalia]: padrão SQL para as três primeiras; lost update segundo o modelo clássico de leitura, conta e gravação
  var CAN = [
    [true, true, true, true],
    [false, true, true, true],
    [false, false, true, false],
    [false, false, false, false]
  ];

  function brl(v) { return 'R$ ' + v.toLocaleString('pt-BR'); }

  var SCEN = [
    function dirty(L) {
      var bad = L === 0;
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nUPDATE conta SET saldo = saldo - 300\n WHERE id = 'lia';", out: 'Saldo pendente de T1: R$ 700 (sem COMMIT ainda).', db: 'Banco (confirmado): ' + brl(1000) },
          { w: 'T2', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lia';",
            out: bad ? 'T2 lê R$ 700. É um valor sujo: ninguém confirmou.' : 'T2 lê R$ 1.000, o último valor confirmado' + (L === 3 ? ' (ou espera o T1 terminar, conforme o motor).' : '.'),
            db: 'Banco (confirmado): ' + brl(1000), flag: bad },
          { w: 'T1', sql: 'ROLLBACK;', out: 'O débito de R$ 300 é desfeito. O saldo continua R$ 1.000.', db: 'Banco (confirmado): ' + brl(1000) }
        ],
        bad: bad,
        msg: bad
          ? 'Dirty read: T2 enxergou R$ 700, um saldo que nunca existiu de verdade. Se T2 tivesse aprovado uma compra com esse número, estaria errado.'
          : 'Sem dirty read: T2 só enxerga o que já foi confirmado (COMMIT). O débito desfeito nunca apareceu para ele.'
      };
    },
    function nonrep(L) {
      var bad = L <= 1;
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lia';", out: 'T1 lê R$ 1.000.', db: 'Banco (confirmado): ' + brl(1000) },
          { w: 'T2', sql: "BEGIN;\nUPDATE conta SET saldo = saldo - 300\n WHERE id = 'lia';\nCOMMIT;", out: 'T2 confirma: o saldo agora é R$ 700.', db: 'Banco (confirmado): ' + brl(700) },
          { w: 'T1', sql: "SELECT saldo FROM conta\n WHERE id = 'lia';  -- de novo, na mesma transação",
            out: bad ? 'T1 lê R$ 700. A mesma consulta deu outro resultado.' : 'T1 lê R$ 1.000 outra vez: continua vendo a mesma "foto" de quando começou.',
            db: 'Banco (confirmado): ' + brl(700), flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Non-repeatable read: na mesma transação, T1 leu R$ 1.000 e depois R$ 700. Um relatório que soma saldos em dois momentos fica incoerente.'
          : 'Sem non-repeatable read: T1 vê R$ 1.000 as duas vezes. Só vai enxergar os R$ 700 depois de terminar e começar outra transação.'
      };
    },
    function phantom(L) {
      var bad = L <= 2;
      var third;
      if (L <= 1) third = 'T1 vê 3 linhas, total R$ 450. Apareceu um lançamento "fantasma".';
      else if (L === 2) third = 'O padrão SQL deixa passar: 3 linhas, total R$ 450. (O PostgreSQL já esconde o fantasma aqui e mostraria 2 linhas, R$ 300.)';
      else third = 'T1 vê as mesmas 2 linhas, total R$ 300.';
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT COUNT(*), SUM(-valor) FROM lancamento\n WHERE conta = 'lia' AND dia = hoje;", out: '2 linhas, total gasto R$ 300 (limite do dia: R$ 500).', db: 'Banco: saldo ' + brl(1000) + ' · 2 lançamentos hoje' },
          { w: 'T2', sql: "BEGIN;\nINSERT INTO lancamento (conta, valor, dia)\nVALUES ('lia', -150, hoje);\nCOMMIT;", out: 'T2 confirma um novo lançamento de R$ 150.', db: 'Banco: saldo ' + brl(850) + ' · 3 lançamentos hoje' },
          { w: 'T1', sql: "SELECT COUNT(*), SUM(-valor) FROM lancamento\n WHERE conta = 'lia' AND dia = hoje;  -- mesma consulta", out: third, db: 'Banco: saldo ' + brl(850) + ' · 3 lançamentos hoje', flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Phantom: a mesma consulta devolveu uma linha a mais. Não é um valor que mudou, é um conjunto que ganhou uma linha nova. Quem confere o limite de R$ 500 do dia pode errar a conta.'
          : 'Sem phantom: o conjunto de linhas que T1 enxerga não muda no meio da transação.'
      };
    },
    function lost(L) {
      var bad = L <= 1;
      var last;
      if (bad) last = { sql: "UPDATE conta SET saldo = 700\n WHERE id = 'lia';\nCOMMIT;", out: 'T2 grava R$ 700 por cima do R$ 1.200 de T1.', db: 'Banco (confirmado): ' + brl(700) };
      else last = { sql: "UPDATE conta SET saldo = 700\n WHERE id = 'lia';", out: 'ERRO: could not serialize access due to concurrent update. T2 faz ROLLBACK, tenta de novo: lê R$ 1.200, grava R$ 900 e confirma.', db: 'Banco (confirmado): ' + brl(900) };
      return {
        steps: [
          { w: 'T1', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lia';", out: 'T1 lê R$ 1.000 e calcula no app: 1.000 + 200.', db: 'Banco (confirmado): ' + brl(1000) },
          { w: 'T2', sql: "BEGIN;\nSELECT saldo FROM conta\n WHERE id = 'lia';", out: 'T2 lê R$ 1.000 e calcula no app: 1.000 - 300.', db: 'Banco (confirmado): ' + brl(1000) },
          { w: 'T1', sql: "UPDATE conta SET saldo = 1200\n WHERE id = 'lia';\nCOMMIT;", out: 'T1 confirma: o saldo agora é R$ 1.200.', db: 'Banco (confirmado): ' + brl(1200) },
          { w: 'T2', sql: last.sql, out: last.out, db: last.db, flag: bad }
        ],
        bad: bad,
        msg: bad
          ? 'Lost update: o certo seria 1.000 + 200 - 300 = R$ 900. O banco ficou com R$ 700 e o crédito de R$ 200 de T1 sumiu, sem erro nenhum.'
          : 'Sem lost update: o banco detecta que T2 partiu de um saldo velho, recusa a gravação e T2 refaz a conta. Resultado certo: R$ 900.'
      };
    }
  ];

  function wIsolation(root) {
    var S = { a: 0, l: 1, step: 1 };
    var aBtns = [], lBtns = [], cells = [];

    var live = el('div', { 'aria-live': 'polite', class: 'ib-live' });
    var tl = el('ol', { class: 'ib-tl', 'aria-label': 'Linha do tempo das transações' });
    var verdict = el('div', { class: 'ib-verdict', role: 'status' });
    var back = el('button', { type: 'button', class: 'btn', text: '← Voltar' });
    var next = el('button', { type: 'button', class: 'btn primary', text: 'Próximo passo →' });
    var reset = el('button', { type: 'button', class: 'btn', text: 'Recomeçar' });
    var counter = el('span', { class: 'ib-count' });

    function chipRow(label, items, list, onpick) {
      var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': label });
      items.forEach(function (t, i) {
        var b = el('button', { type: 'button', class: 'chip', text: t, 'aria-pressed': 'false' });
        b.addEventListener('click', function () { onpick(i); });
        list.push(b);
        row.appendChild(b);
      });
      return row;
    }

    function render() {
      aBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === S.a ? 'true' : 'false'); });
      lBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === S.l ? 'true' : 'false'); });
      cells.forEach(function (c) {
        var on = c.l === S.l && c.a === S.a;
        c.b.classList.toggle('sel', on);
        c.b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var sc = SCEN[S.a](S.l);
      var n = sc.steps.length;
      if (S.step > n) S.step = n;
      clear(tl);
      sc.steps.slice(0, S.step).forEach(function (st, i) {
        tl.appendChild(el('li', { class: 'ib-step' + (st.flag ? ' flag' : '') + (i === S.step - 1 ? ' now' : '') }, [
          el('div', { class: 'ib-head' }, [
            el('span', { class: 'ib-who ' + st.w.toLowerCase(), text: st.w }),
            el('span', { class: 'ib-n', text: 'passo ' + (i + 1) + ' de ' + n })
          ]),
          el('pre', { class: 'ib-sql' }, [el('code', { text: st.sql })]),
          el('p', { class: 'ib-out', text: st.out }),
          el('p', { class: 'ib-db', text: st.db })
        ]));
      });
      clear(verdict);
      var done = S.step === n;
      verdict.className = 'ib-verdict' + (done ? (sc.bad ? ' bad' : ' ok') : ' hide');
      if (done) {
        verdict.appendChild(el('strong', { text: (sc.bad ? 'Acontece: ' : 'Não acontece: ') + ANOM[S.a] + ' em ' + LEVELS[S.l] + '. ' }));
        verdict.appendChild(document.createTextNode(sc.msg));
      }
      counter.textContent = 'Passo ' + S.step + ' de ' + n;
      back.disabled = S.step <= 1;
      next.disabled = done;
    }
    function pick(a, l) { if (a != null) S.a = a; if (l != null) S.l = l; S.step = 1; render(); }

    back.addEventListener('click', function () { if (S.step > 1) { S.step--; render(); } });
    next.addEventListener('click', function () { S.step++; render(); });
    reset.addEventListener('click', function () { S.step = 1; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Escolha a anomalia' }));
    root.appendChild(chipRow('Anomalia', ANOM, aBtns, function (i) { pick(i, null); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Escolha o nível de isolamento' }));
    root.appendChild(chipRow('Nível de isolamento', LEVELS, lBtns, function (i) { pick(null, i); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Avance a linha do tempo' }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [back, next, reset, counter]));
    live.appendChild(tl);
    live.appendChild(verdict);
    root.appendChild(live);

    // matriz anomalia x nível (cada célula é um botão que escolhe o par)
    var head = el('tr', null, [el('th', { scope: 'col', text: 'Nível' })].concat(ANOM_SHORT.map(function (t) { return el('th', { scope: 'col', text: t }); })));
    var body = el('tbody');
    LEVELS.forEach(function (lv, l) {
      var tr = el('tr', null, [el('th', { scope: 'row', text: SHORT[l], title: lv })]);
      ANOM.forEach(function (an, a) {
        var can = CAN[l][a];
        var b = el('button', { type: 'button', class: 'ib-cell ' + (can ? 'yes' : 'no'), 'aria-pressed': 'false',
          'aria-label': lv + ', ' + an + ': ' + (can ? 'pode acontecer' : 'não acontece'), text: can ? 'pode' : 'não' });
        b.addEventListener('click', function () { pick(a, l); });
        cells.push({ b: b, l: l, a: a });
        tr.appendChild(el('td', null, [b]));
      });
      body.appendChild(tr);
    });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Quadro: o que cada nível permite' }));
    root.appendChild(el('table', { class: 'ib-matrix' }, [el('caption', { class: 'sr-note', text: 'RU = Read Uncommitted, RC = Read Committed, RR = Repeatable Read, SER = Serializable. Toque numa célula para ver o caso.' }), el('thead', null, [head]), body]));
    root.appendChild(el('p', { class: 'sr-note', text: 'As três primeiras colunas seguem a tabela do padrão SQL: ele define o mínimo que cada nível garante, e cada motor pode ser mais rígido. No PostgreSQL, Read Uncommitted se comporta como Read Committed e o Repeatable Read já não deixa phantom. Lost update não está nessa tabela: é o clássico "ler, calcular no app e gravar". Quando o banco faz a conta (UPDATE conta SET saldo = saldo - 300) ou você trava a linha (SELECT ... FOR UPDATE), ele não acontece nem em Read Committed. Valores de exemplo.' }));
    render();
  }

  var REG = { isolation: wIsolation };
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
