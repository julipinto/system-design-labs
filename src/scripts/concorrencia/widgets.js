/* SDLabs · Concorrência e Paralelismo: widgets em JS puro
   (corrida Bia × Caio, TTL do lock contra a pausa do dono, deadlock reserva × estorno, pool de conexões, speedup de Amdahl).
   Usam a loja do brief: GATO-042 com 1 unidade, SELECT e UPDATE de 2 ms, Redis de 1 ms, relatorios de 4 vCPU com 42 s sequenciais. */
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
  function svg(tag, attrs, kids) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, k) || attrs[k] == null) continue;
      if (k === 'text') n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function fmt(v, d) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: d == null ? 2 : d }); }
  function sec(ms) { return fmt(ms / 1000, 3) + ' s'; }

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
  var uid = 0;
  function slider(label, min, max, step, value, unit, fmtv) {
    var id = 'cc-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, sync: sync, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function toggle(label, on, onChange) {
    var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': on ? 'true' : 'false', text: label });
    b.addEventListener('click', function () {
      var v = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      onChange(v);
    });
    return b;
  }

  /* =============== AULA 6: Bia × Caio, todas as ordens =============== */
  function wCorrida(root) {
    var NAMES = { B1: 'Bia checa', B2: 'Bia baixa', C1: 'Caio checa', C2: 'Caio baixa' };
    var STEPS = ['B1', 'B2', 'C1', 'C2'];
    var S = { mutex: false, seq: [], all: false };

    // as 6 formas de intercalar B1<B2 e C1<C2
    var ALL = [];
    (function gen(seq, b, c) {
      if (b === 2 && c === 2) { ALL.push(seq.slice()); return; }
      if (b < 2) { seq.push('B' + (b + 1)); gen(seq, b + 1, c); seq.pop(); }
      if (c < 2) { seq.push('C' + (c + 1)); gen(seq, b, c + 1); seq.pop(); }
    })([], 0, 0);

    function sim(seq) {
      var q = 1, read = {}, made = { B: false, C: false }, log = [];
      seq.forEach(function (s) {
        var who = s.charAt(0), name = who === 'B' ? 'Bia' : 'Caio';
        if (s.charAt(1) === '1') { read[who] = q; log.push(name + ' lê quantidade = ' + (q < 0 ? '−' + Math.abs(q) : q) + ' (SELECT)'); }
        else if (read[who] >= 1) { q -= 1; made[who] = true; log.push(name + ' baixa: quantidade = ' + (q < 0 ? '−' + Math.abs(q) : q) + ' (UPDATE)'); }
        else log.push(name + ' viu 0: responde 409 sem estoque');
      });
      return { q: q, made: made, log: log, pedidos: (made.B ? 1 : 0) + (made.C ? 1 : 0) };
    }
    function valid(seq) {
      if (!S.mutex) return true;
      return seq.join(' ') === 'B1 B2 C1 C2' || seq.join(' ') === 'C1 C2 B1 B2';
    }
    function enabled(s) {
      if (S.seq.indexOf(s) >= 0) return false;
      var who = s.charAt(0), n = s.charAt(1);
      if (n === '2' && S.seq.indexOf(who + '1') < 0) return false;
      if (S.mutex) {
        // quem começou segura a trava até baixar; o outro só entra depois
        var other = who === 'B' ? 'C' : 'B';
        var otherOpen = S.seq.indexOf(other + '1') >= 0 && S.seq.indexOf(other + '2') < 0;
        if (otherOpen) return false;
      }
      return true;
    }

    var ctl = el('div', { class: 'ib-ctrl' });
    var out = el('div', { class: 'cr-out', 'aria-live': 'polite' });
    var list = el('div', { class: 'cr-list' });
    var mx = toggle('Pôr mutex', false, function (v) { S.mutex = v; S.seq = []; render(); });
    var allBtn = toggle('Todas as ordens', false, function (v) { S.all = v; render(); });
    var reset = el('button', { type: 'button', class: 'btn', text: 'Zerar' });
    reset.addEventListener('click', function () { S.seq = []; render(); });
    ctl.appendChild(mx); ctl.appendChild(allBtn); ctl.appendChild(reset);
    var picks = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Monte uma ordem' });
    var pickBtns = {};
    STEPS.forEach(function (s) {
      var b = el('button', { type: 'button', class: 'chip', text: s + ' · ' + NAMES[s] });
      b.addEventListener('click', function () { if (enabled(s)) { S.seq.push(s); render(); } });
      pickBtns[s] = b; picks.appendChild(b);
    });

    function render() {
      STEPS.forEach(function (s) {
        var on = enabled(s);
        pickBtns[s].disabled = !on;
        pickBtns[s].style.opacity = on ? '' : '.45';
      });
      clear(out);
      if (S.seq.length === 0) {
        out.appendChild(el('p', { class: 'cr-say', text: 'Toque os passos na ordem em que eles acontecem. Cada cliente faz dois: checar (SELECT) e baixar (UPDATE). Começa com 1 gato no estoque.' }));
      } else {
        out.appendChild(el('p', { class: 'cr-seq', text: 'Ordem: ' + S.seq.join(' → ') }));
        var r = sim(S.seq);
        var ol = el('ol', { class: 'ls-list' });
        r.log.forEach(function (l) { ol.appendChild(el('li', { text: l })); });
        out.appendChild(ol);
        if (S.seq.length === 4) {
          var bad = r.q < 0;
          out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: bad ? 'Estoque final: −1. ' : 'Estoque final: ' + r.q + '. ' }),
            bad ? 'Duas reservas para 1 gato: os dois leram 1 antes de qualquer baixa.' : 'Só um pedido saiu (' + (r.made.B ? 'a Bia, o 1049' : 'o Caio') + '): um terminou inteiro antes de o outro começar.']));
        }
      }
      // as 6 (ou 2) ordens
      clear(list);
      var shown = ALL.filter(valid);
      var neg = shown.filter(function (s) { return sim(s).q < 0; }).length;
      if (S.all) {
        var tb = el('tbody');
        shown.forEach(function (s) {
          var r = sim(s), bad = r.q < 0;
          var cur = S.seq.length === 4 && s.join(' ') === S.seq.join(' ');
          tb.appendChild(el('tr', { class: cur ? 'cr-cur' : '' }, [
            el('th', { scope: 'row', text: s.join(' ') }),
            el('td', { class: 'cc-cell ' + (bad ? 'bad' : 'ok'), text: bad ? '−1' : String(r.q) }),
            el('td', { text: r.pedidos + (r.pedidos === 1 ? ' pedido' : ' pedidos') })
          ]));
        });
        list.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table' }, [
          el('thead', null, [el('tr', null, [el('th', { scope: 'col', text: 'ordem' }), el('th', { scope: 'col', text: 'estoque' }), el('th', { scope: 'col', text: 'vendas' })])]), tb])]));
        list.appendChild(el('p', { class: 'sr-verdict ' + (neg ? 'bad' : '') }, [el('strong', { text: neg + ' de ' + shown.length + ' ordens dão −1. ' }),
          S.mutex ? 'Com o mutex, a checagem e a baixa de um cliente ficam juntas: só sobram as 2 ordens seguras.' : 'Só B1 B2 C1 C2 e C1 C2 B1 B2 (um pedido inteiro, depois o outro) dão certo.']));
      }
    }
    root.appendChild(ctl);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Monte a ordem dos 4 passos' }));
    root.appendChild(picks);
    root.appendChild(out);
    root.appendChild(list);
    render();
  }

  /* =============== AULA 8: TTL do lock contra a pausa do dono =============== */
  function wTtl(root) {
    var ttl = slider('TTL da trava', 1, 10, 1, 5, 's');
    var pause = slider('Pausa do dono antes do UPDATE', 0, 10, 0.5, 6, 's', function (v) { return fmt(v, 1); });
    var S = { fence: false };
    var out = el('div', { class: 'lk-out', 'aria-live': 'polite' });
    var fenceBtn = toggle('Fencing token no banco (33 contra 34)', false, function (v) { S.fence = v; render(); });

    function render() {
      var T = +ttl.input.value * 1000, P = +pause.input.value * 1000;
      var expiry = T + 1;                       // a chave some 1 ms depois do SET de t = 1 ms mais o TTL
      var release = P + 6;                      // 1 ms de SET + pausa + 4 ms de trabalho + 1 ms de DEL
      var tryAt = function (from) { return 3 + 50 * Math.ceil((from - 3) / 50); };
      var two = P > T + 1;                        // o dono ainda está parado quando a trava vence
      var ev = [];
      ev.push([1, 'Bia pega a trava (token a1, TTL ' + fmt(T / 1000, 0) + ' s) e fica parada ' + fmt(P / 1000, 1) + ' s']);
      var verdict, bad = false, win = '';
      var tC = null;
      if (two) {
        tC = tryAt(expiry);
        ev.push([expiry, 'O TTL vence: a chave some']);
        if (tC > 10000) {
          ev.push([10000, 'O Caio desiste aos 10 s, antes de a trava vencer']);
          verdict = 'O Caio desistiu antes do vencimento. A Bia acorda com a trava já vencida, mas ninguém a pegou: o UPDATE dela dá 0 (estoque 0).';
          ev.push([P, 'Bia acorda e faz o UPDATE → quantidade 0']);
        } else {
          ev.push([tC, 'Caio pega a trava (token b2), lê 1, baixa para 0 e compra']);
          ev.push([Math.max(P, tC + 8), 'Bia acorda e ainda acha que tem a trava; faz o UPDATE' + (S.fence ? ' com o token 33' : '')]);
          win = 'janela de dois donos: de ' + sec(tC) + ' até ' + sec(Math.max(P, tC + 8));
          if (S.fence) { ev.push([Math.max(P, tC + 8) + 1, 'O banco já viu o token 34 e recusa o 33: o UPDATE da Bia falha']); verdict = 'Com o fencing token o banco recusa a escrita atrasada. Estoque final: 0. A Bia leva um erro e o Caio fica com o gato.'; }
          else { verdict = 'Estoque final: −1. Os dois acharam que eram donos da trava, e o UPDATE da Bia passou por cima do Caio.'; bad = true; }
        }
      } else {
        ev.push([P + 2, 'Bia faz o UPDATE → quantidade 0 (a trava ainda é dela)']);
        var tn = tryAt(release);
        ev.push([release, 'Bia solta a trava']);
        ev.push([tn + 3, 'Caio entra (tentativa em ' + sec(tn) + '), lê 0 e recebe 409']);
        verdict = 'A Bia termina antes do TTL vencer, então só um dono existe em cada momento. Estoque final: 0 e o Caio leva 409.';
      }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: two ? (win ? 'Há uma janela com dois donos. ' : 'O TTL venceu. ') : 'Sem janela de dois donos. ' }), verdict]));
      var tb = el('tbody');
      ev.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (e) {
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: sec(e[0]) }), el('td', { text: e[1] })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table lk-table' }, [tb])]));
      // régua de 0 a 10 s: quem tem a trava, a faixa vermelha é a dos dois donos
      var tr = el('div', { class: 'lk-track', role: 'img', 'aria-label': 'Linha do tempo de 0 a 10 segundos da trava' });
      var seg = function (a, b, cls, label) {
        if (b <= a) return;
        tr.appendChild(el('div', { class: 'lk-seg ' + cls, style: 'left:' + (a / 10000 * 100) + '%;width:' + ((b - a) / 10000 * 100) + '%', text: (b - a) >= 1400 ? label : '' }));
      };
      if (two) {
        seg(0, Math.min(T, 10000), 'ok', 'Bia');
        if (tC !== null && tC <= 10000) {
          seg(Math.min(T, 10000), tC, 'idle', 'vencida');
          var endTwo = Math.min(Math.max(P, tC + 8), 10000);
          seg(tC, endTwo, 'bad', 'dois donos');
        } else seg(Math.min(T, 10000), Math.min(P, 10000), 'idle', 'vencida');
      } else {
        seg(0, Math.min(release, 10000), 'ok', 'Bia');
      }
      out.appendChild(tr);
      out.appendChild(el('div', { class: 'lk-scale' }, [0, 2, 4, 6, 8, 10].map(function (n) { return el('span', { style: 'left:' + (n * 10) + '%', text: n + ' s' }); })));
      out.appendChild(el('p', { class: 'sr-note', text: 'O Caio tenta a cada 50 ms (em 3, 53, 103 ms...) e desiste aos 10 s. O lock é um SET NX PX com ida e volta de 1 ms. O fencing token só existe num serviço que entrega número crescente (o ZooKeeper dá; o SET NX do Redis não). Sem relógio nenhum, o UPDATE ... AND quantidade > 0 também impede o −1.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [ttl.wrap, pause.wrap]);
    [ttl, pause].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [fenceBtn]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: deadlock, reserva × estorno =============== */
  function wDeadlock(root) {
    var ORD = ['estoque → pedido', 'pedido → estoque'];
    var S = { r: 0, c: 1, global: false };
    var rB = [], cB = [];
    var out = el('div', { class: 'dl-out', 'aria-live': 'polite' });
    var gl = toggle('Ordem global: estoque antes de pedido', false, function (v) { S.global = v; render(); });
    function name(i) { return i === 0 ? 'estoque:GATO-042' : 'pedido:1049'; }
    function render() {
      var r = S.global ? 0 : S.r, c = S.global ? 0 : S.c;
      press(rB, r); press(cB, c);
      rB.concat(cB).forEach(function (b) { b.disabled = S.global; b.style.opacity = S.global ? '.45' : ''; });
      var cross = r !== c;
      var rFirst = r === 0 ? 'estoque:GATO-042' : 'pedido:1049', rSecond = r === 0 ? 'pedido:1049' : 'estoque:GATO-042';
      var cFirst = c === 0 ? 'estoque:GATO-042' : 'pedido:1049', cSecond = c === 0 ? 'pedido:1049' : 'estoque:GATO-042';
      var rows;
      if (cross) {
        rows = [
          ['0', 'reservar trava ' + rFirst, ''],
          ['1', 'cancelar trava ' + cFirst, ''],
          ['2', 'reservar quer ' + rSecond + ', que o cancelar segura: espera', 'wait'],
          ['3', 'cancelar quer ' + cSecond + ', que o reservar segura: espera', 'wait']
        ];
      } else {
        rows = [
          ['0', 'reservar trava ' + rFirst, ''],
          ['1', 'cancelar quer ' + cFirst + ', que o reservar segura: espera', 'wait'],
          ['2', 'reservar trava ' + rSecond + ' e trabalha', ''],
          ['3', 'reservar solta as duas travas; o cancelar entra e segue', 'ok']
        ];
      }
      clear(out);
      var tb = el('tbody');
      rows.forEach(function (x) {
        tb.appendChild(el('tr', { class: x[2] === 'wait' && cross && x[0] !== '1' ? 'dl-wait' : '' }, [el('th', { scope: 'row', text: 't = ' + x[0] }), el('td', { text: x[1] })]));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cc-table lk-table' }, [tb])]));
      if (cross) {
        out.appendChild(el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'Deadlock. ' }), 'O reservar espera o cancelar e o cancelar espera o reservar: um ciclo, e ninguém anda. As duas goroutines continuam presas, e toda reserva futura do gato fica pendurada.']));
        out.appendChild(el('pre', { class: 'dl-pg' }, [el('code', { text: 't = 1003 ms (deadlock_timeout = 1 s no PostgreSQL)\nERROR:  deadlock detected\nDETAIL: Process A waits for ShareLock; blocked by process B.\nSQLSTATE: 40P01\n-- o PostgreSQL aborta uma transação e a outra segue' })]));
        out.appendChild(el('p', { class: 'sr-note', text: 'Com travas em memória (sync.Mutex) não há esse detector: o Go só avisa quando todas as goroutines estão bloqueadas. Os nomes das travas e o texto do erro são de exemplo.' }));
      } else {
        out.appendChild(el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Sem ciclo. ' }), S.global
          ? 'Com a ordem global, as duas operações pegam o estoque primeiro. Quem chega depois espera na primeira trava e não segura nada que o outro precise.'
          : 'As duas pegam as travas na mesma ordem, então ninguém segura uma trava que o outro quer pegar primeiro.']));
      }
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Ordem das travas em reservar(1049)' }));
    root.appendChild(chipRow('Ordem em reservar', ORD, rB, function (i) { S.r = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Ordem das travas em cancelar(1049)' }));
    root.appendChild(chipRow('Ordem em cancelar', ORD, cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('div', { class: 'ib-ctrl' }, [gl]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: pool de conexões =============== */
  function wPool(root) {
    var pool = slider('Tamanho do pool (por réplica)', 1, 50, 1, 10, 'conexões');
    var sim = slider('Pedidos simultâneos (por réplica)', 1, 300, 1, 200, 'pedidos');
    var ms = slider('Tempo por consulta', 5, 100, 5, 20, 'ms');
    var rep = slider('Réplicas do estoque', 1, 15, 1, 1, '', function (v) { return v + (v === 1 ? ' réplica' : ' réplicas'); });
    var out = el('div', { class: 'pl-out', 'aria-live': 'polite' });
    var LIMIT = 100;
    function render() {
      var P = +pool.input.value, N = +sim.input.value, T = +ms.input.value, R = +rep.input.value;
      var lotes = Math.ceil(N / P), last = lotes * T, sum = 0;
      for (var i = 1; i <= N; i++) sum += Math.ceil(i / P) * T;
      var avg = sum / N;
      var perRep = Math.min(N, P) / (T / 1000);
      var total = R * P;
      var over = total > LIMIT;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('último', last, Math.max(last, 100), fmt(last) + ' ms', last > 1000 ? 'bad' : 'cap'));
      bars.appendChild(bar('média', avg, Math.max(last, 100), fmt(avg) + ' ms', 'win'));
      bars.appendChild(bar('conexões', total, Math.max(total, LIMIT), total + ' de ' + LIMIT, over ? 'bad' : 'cap'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Vazão por réplica' }), el('b', { text: fmt(perRep, 0) + '/s' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Lotes' }), el('b', { text: fmt(lotes, 0) + ' × ' + T + ' ms' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Little: em uso' }), el('b', { text: fmt(perRep, 0) + '/s × ' + T + ' ms = ' + fmt(perRep * T / 1000, 0) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Réplicas × pool' }), el('b', { text: R + ' × ' + P + ' = ' + total })])
      ]));
      if (over) {
        out.appendChild(el('p', { class: 'sr-verdict bad' }, [el('strong', { text: 'O banco recusa. ' }), total + ' conexões passam do max_connections de ' + LIMIT + ': o PostgreSQL responde FATAL: sorry, too many clients already. Reduza o pool por réplica (' + R + ' × ' + Math.floor(LIMIT / R) + ' = ' + (R * Math.floor(LIMIT / R)) + '), ponha um pooler como o PgBouncer ou suba o max_connections.']));
      } else {
        out.appendChild(el('p', { class: 'sr-verdict' }, [el('strong', { text: 'Cabe no banco. ' }),
          N <= P ? 'Há vaga para todos os ' + N + ' pedidos: ninguém espera além dos ' + T + ' ms da consulta.'
            : 'Os primeiros ' + P + ' terminam em ' + T + ' ms e o último, no lote ' + lotes + ', em ' + fmt(last) + ' ms (média de ' + fmt(avg) + ' ms). A vazão fica em ' + fmt(perRep, 0) + '/s por réplica, ' + fmt(perRep * R, 0) + '/s no total.']));
      }
      out.appendChild(el('p', { class: 'sr-note', text: 'Conta da loja: 200 pedidos, pool de 10 e 20 ms dão 20 lotes, último em 400 ms e média de 210 ms. Com 12 réplicas, 12 × 10 = 120 passam das 100 conexões que o PostgreSQL aceita por padrão. Todos os pedidos chegam juntos e cada um segura uma conexão pelos ms da consulta.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [pool.wrap, sim.wrap, ms.wrap, rep.wrap]);
    [pool, sim, ms, rep].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 3: speedup (Amdahl) do relatório =============== */
  function wAmdahl(root) {
    var BASE = 42;
    var cores = slider('Núcleos', 1, 16, 1, 4, 'núcleos');
    var ser = slider('Parte serial', 0, 20, 0.01, 4.76, '%', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'am-out', 'aria-live': 'polite' });
    function S(n, s) { return 1 / (s + (1 - s) / n); }
    function render() {
      var N = +cores.input.value, s = +ser.input.value / 100;
      var sp = S(N, s), eff = sp / N * 100, t = BASE / sp, ceil = s > 0 ? 1 / s : Infinity;
      clear(out);
      var W = 520, H = 220, L = 38, B = 28, TOP = 12, R = 12;
      var maxY = 16;
      var X = function (n) { return L + (n - 1) / 15 * (W - L - R); };
      var Y = function (v) { return H - B - Math.min(v, maxY) / maxY * (H - B - TOP); };
      var g = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'am-svg', role: 'img', 'aria-label': 'Curva de aceleração por número de núcleos, com a reta ideal e o ponto escolhido' });
      [0, 4, 8, 12, 16].forEach(function (v) {
        g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'am-grid' }));
        g.appendChild(svg('text', { x: L - 6, y: Y(v) + 4, class: 'am-tick', 'text-anchor': 'end', text: v + '×' }));
      });
      [1, 4, 8, 12, 16].forEach(function (n) { g.appendChild(svg('text', { x: X(n), y: H - 8, class: 'am-tick', 'text-anchor': 'middle', text: String(n) })); });
      g.appendChild(svg('line', { x1: X(1), y1: Y(1), x2: X(16), y2: Y(16), class: 'am-ideal' }));
      if (isFinite(ceil) && ceil <= maxY) g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(ceil), y2: Y(ceil), class: 'am-ceil' }));
      var pts = [];
      for (var n = 1; n <= 16; n++) pts.push(X(n) + ',' + Y(S(n, s)));
      g.appendChild(svg('polyline', { points: pts.join(' '), class: 'am-curve' }));
      g.appendChild(svg('circle', { cx: X(N), cy: Y(sp), r: 6, class: 'am-dot' }));
      out.appendChild(g);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Aceleração' }), el('b', { text: fmt(sp, 1) + '×' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Eficiência' }), el('b', { text: fmt(eff, 0) + '%' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Fechamento (base 42 s)' }), el('b', { text: fmt(t, 1) + ' s' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Teto com infinitos núcleos' }), el('b', { text: isFinite(ceil) ? fmt(ceil, 1) + '×' : 'sem teto' })])
      ]));
      var msg = N === 1 ? 'Com 1 núcleo não há ganho: são os 42 s sequenciais.'
        : sp >= N - 0.05 ? 'Sem parte serial, cada núcleo novo rende por inteiro: ' + N + ' núcleos, ' + N + '×.'
        : N + ' núcleos dão ' + fmt(sp, 1) + '×, e não ' + N + '×: a parte serial de ' + fmt(s * 100, 1) + '% (somar as parciais e gravar) não encolhe.';
      out.appendChild(el('p', { class: 'sr-verdict ' + (eff < 50 ? 'bad' : '') }, [el('strong', { text: 'Relatório das 23:00. ' }), msg + (N === 4 && Math.abs(s - 2 / 42) < 0.0015 ? ' É o 42 ÷ 12 = 3,5× da aula.' : '')]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Fórmula: aceleração = 1 ÷ (serial + (1 − serial) ÷ núcleos). A parte serial real é 2 s de 42, ou 4,8%. A linha tracejada é o ganho ideal (N×); a pontilhada é o teto 1 ÷ serial.' }));
    }
    var presets = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Atalhos' });
    [['Relatório real: 4 núcleos, 4,8%', 4, 4.76], ['8 núcleos, 4,8%', 8, 4.76], ['16 núcleos, 4,8%', 16, 4.76], ['Sem parte serial', 4, 0]].forEach(function (p) {
      var b = el('button', { type: 'button', class: 'chip', text: p[0] });
      b.addEventListener('click', function () { cores.input.value = p[1]; ser.input.value = p[2]; cores.sync(); ser.sync(); render(); });
      presets.appendChild(b);
    });
    var ctrls = el('div', { class: 'sr-ctrls' }, [cores.wrap, ser.wrap]);
    [cores, ser].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(presets);
    root.appendChild(out);
    render();
  }

  var REG = { corrida: wCorrida, ttl: wTtl, deadlock: wDeadlock, pool: wPool, amdahl: wAmdahl };
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
