/* SDLabs · Scale Cube: widgets em JS puro
   (diagnóstico por sintoma, cubo e pods, vCPU por eixo, roteador do Z, scatter-gather).
   Usam a loja do brief: `pedidos` com 30 pedidos/s por réplica e 150/s no banco de um primário, demanda de 200/s,
   catálogo de 10 réplicas, 25 vCPU de serviços contra 80 de monolito, murmur3(chave) mod N com os clientes
   lena-77, bia-31, caio-58 e davi-12. */
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

  function chipRow(label, labels, btns, onPick, cls) {
    var row = el('div', { class: cls || 'sr-chips', role: 'group', 'aria-label': label });
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
    var id = 'sc-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : inp.value) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function field(label, type, value, attrs) {
    var id = 'sc-in-' + (++uid);
    var a = { id: id, type: type, value: String(value) };
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) a[k] = attrs[k];
    var inp = el('input', a);
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label]), inp]) };
  }
  function fact(label, value) { return el('div', { class: 'sr-fact' }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table sc-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }

  /* murmur3 (32 bits, seed 0). Confere com os vetores "" → 0, "hello" → 0x248bfa47 e
     "The quick brown fox jumps over the lazy dog" → 0x2e4ff723. */
  function murmur3(str) {
    var d = new TextEncoder().encode(str), len = d.length, h = 0, c1 = 0xcc9e2d51, c2 = 0x1b873593, i = 0, k;
    for (var n = len >> 2; n > 0; n--, i += 4) {
      k = (d[i] | d[i + 1] << 8 | d[i + 2] << 16 | d[i + 3] << 24) >>> 0;
      k = Math.imul(k, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0;
      h = (h ^ k) >>> 0; h = ((h << 13) | (h >>> 19)) >>> 0; h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
    }
    k = 0;
    switch (len & 3) {
      case 3: k ^= d[i + 2] << 16; /* falls through */
      case 2: k ^= d[i + 1] << 8; /* falls through */
      case 1:
        k ^= d[i]; k = Math.imul(k >>> 0, c1) >>> 0; k = ((k << 15) | (k >>> 17)) >>> 0; k = Math.imul(k, c2) >>> 0;
        h = (h ^ k) >>> 0;
    }
    h = (h ^ len) >>> 0; h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 0x85ebca6b) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 0xc2b2ae35) >>> 0; h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }
  function shardOf(key, n) { return murmur3(key) % n; }

  /* =============== AULA 1: diagnóstico por sintoma =============== */
  var SYM = [
    { t: 'Catálogo com CPU a 99% e p99 de 2.000 ms; no pico de 950 req/s a frota chega a 95%', src: 'módulo 14', ax: 'X',
      said: 'CPU a 95% com 950 req/s em 10 réplicas, contra 1.000 req/s de capacidade.',
      why: 'X: clonar. A fórmula do HPA dá ⌈10 × 95 ÷ 70⌉ = 14 réplicas, cópias idênticas de um serviço sem estado.' },
    { t: 'O fechamento das 23:00 derruba o checkout (página de 120 ms para 2,4 s)', src: 'módulo 6', ax: 'Y',
      said: 'O relatório pesado disputa CPU e banco com o checkout dentro do mesmo programa.',
      why: 'Y: separar por função. Clonar o monolito clonaria também o relatório; o certo é pôr o relatorios num serviço (e num banco) só dele.' },
    { t: 'Deploy de 40 min, com três times esperando um ao outro', src: 'módulo 8', ax: 'Y',
      said: 'O problema não é de capacidade: é de organização, com um programa e três donos.',
      why: 'Y: é o único eixo que aumenta a escalabilidade organizacional. Cada time vira dono de código e dados e entrega sozinho.' },
    { t: 'pagamentos com capacidade de 40/s e estoque com 1.000/s parado', src: 'módulo 14', ax: 'X',
      said: 'O elo mais fraco do checkout é o pagamentos (40/s); o estoque usa 4% da capacidade.',
      why: 'X, mas só no elo certo: pagamentos de 2 para 4 réplicas dá 80/s. Dobrar o estoque só dobra a conta de CPU, e a saída fica em 40/s.' },
    { t: 'Banco do pedidos no teto de 150 pedidos/s, com 50 milhões de linhas', src: 'módulos 14 e 16', ax: 'Z',
      said: 'O teto é do banco de um primário, e não do serviço.',
      why: 'X não adianta: 7 réplicas dão 210/s de serviço e o banco continua em 150/s. Z: 3 shards dão 3 × 150 = 450/s.' },
    { t: 'Um cliente (mkt-01, o marketplace do módulo 8) com 40% dos pedidos', src: 'módulo 16', ax: 'Z',
      said: 'Um só cliente concentra a carga de escrita de uma tabela.',
      why: 'Z por tipo de cliente: um shard dedicado ao mkt-01. O Y não divide (é a mesma função) e o X não alivia o banco.' },
    { t: 'A região de SP cai e leva tudo', src: 'módulo 27', ax: 'Z',
      said: 'A região inteira é um único domínio de falha.',
      why: 'Z por região (pods): cada região com a sua aplicação e os seus dados, e o X dentro de cada pod. Se SP cai, só SP some.' },
    { t: 'A busca leva 900 ms por requisição', src: 'módulo 7', ax: 'nenhum',
      said: 'Cada requisição gasta 900 ms de código, sozinha, sem fila.',
      why: 'Nenhum eixo. Clonar de 10 para 20 réplicas só derruba a fila; cada busca continua com 900 ms. A saída é um índice (módulo 4) ou um cache (módulo 5).' }
  ];
  var AXES = ['X', 'Y', 'Z', 'nenhum'];

  function wDiagnostico(root) {
    var S = { s: 0, a: -1 }, sb = [], ab = [];
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      clear(out);
      var s = SYM[S.s];
      out.appendChild(el('p', { class: 'sr-note', text: 'O que o gargalo disse (' + s.src + '): ' + s.said }));
      if (S.a < 0) { out.appendChild(el('p', { class: 'sr-note', text: 'Escolha um eixo para ver a justificativa.' })); return; }
      var ok = AXES[S.a] === s.ax;
      out.appendChild(el('p', { class: 'sr-verdict ' + (ok ? '' : 'bad') }, [
        el('strong', { text: ok ? 'Certo: ' + (s.ax === 'nenhum' ? 'nenhum eixo. ' : 'eixo ' + s.ax + '. ') : 'Não é esse: o eixo é ' + (s.ax === 'nenhum' ? '"nenhum". ' : s.ax + '. ') }),
        s.why
      ]));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'O sintoma' }));
    root.appendChild(chipRow('Sintoma', SYM.map(function (x) { return x.t; }), sb, function (i) { S.s = i; S.a = -1; press(sb, i); press(ab, -1); render(); }, 'sc-sym'));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O eixo' }));
    root.appendChild(chipRow('Eixo', ['X (clonar)', 'Y (por função)', 'Z (por dados)', 'Nenhum'], ab, function (i) { S.a = i; press(ab, i); render(); }));
    root.appendChild(out);
    press(sb, 0); press(ab, -1);
    render();
  }

  /* =============== AULAS 2 e 6: cubo e pods do pedidos =============== */
  var PER_POD = 30, DB = 150, POOL = 10, MAXCONN = 100, OTHERS = 27; /* 27 = os outros pods da loja (30 − 3 do pedidos) */
  function wCuboPods(root) {
    var X = slider('X: réplicas por partição', 1, 20, 1, 3);
    var Z = slider('Z: partições (shards)', 1, 6, 1, 1);
    var D = slider('Demanda de pedidos', 1, 400, 1, 200, 'pedidos/s');
    var yb = [], Y = 1;
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var x = +X.input.value, z = +Z.input.value, dem = +D.input.value;
      var pods = x * z, svc = pods * PER_POD, db = z * DB, sai = Math.min(dem, svc, db);
      var lim = dem <= Math.min(svc, db) ? 'nenhum: a demanda cabe' : (svc < db ? 'o serviço (réplicas)' : svc > db ? 'o banco (partições)' : 'o serviço e o banco, empatados');
      var vcpu = Y === 0 ? pods * 8 : pods * 1;
      var lojaPods = Y === 0 ? pods : OTHERS + pods;
      var connPod = x * POOL, connAll = pods * POOL;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Ponto (X, Y, Z)', '(' + x + ', ' + (Y === 0 ? 1 : 9) + ', ' + z + ')'),
        fact('Pods do pedidos (X × Z)', String(pods)),
        fact('Pods da loja', String(lojaPods)),
        fact('vCPU desses pods', String(vcpu))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Demanda', dem, 450, fmt(dem, 0) + '/s', ''),
        bar('Serviço', svc, 450, fmt(svc, 0) + '/s', svc < db ? 'cap' : ''),
        bar('Banco', db, 450, fmt(db, 0) + '/s', db < svc ? 'cap' : ''),
        bar('Saída', sai, 450, fmt(sai, 0) + '/s (' + fmt(sai / dem * 100, 0) + '%)', 'win')
      ]));
      var bad = sai < dem;
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [
        el('strong', { text: bad ? 'Sai ' + fmt(sai, 0) + ' de ' + fmt(dem, 0) + ' pedidos/s. ' : 'A demanda cabe. ' }),
        'Elo que limita: ' + lim + '. ' + (bad && svc > db ? 'Mais réplicas (X) não mudam nada: o banco é o teto, e só mais partições (Z) o movem.' : '') +
        (bad && svc < db ? 'O banco ainda tem folga: mais réplicas (X) resolvem.' : '') +
        (!bad ? 'Cada banco fica a ' + fmt(dem / z / DB * 100, 0) + '% (com a carga bem repartida).' : '')
      ]));
      var warn = connAll >= MAXCONN;
      out.appendChild(el('p', { class: 'sr-note', text: 'Conexões por banco, com pool de ' + POOL + ' por réplica: ' + connPod + ' no modelo de pods por shard (só as ' + x + ' réplicas dele), ' + connAll + ' se todas as ' + pods + ' réplicas falam com todos os shards' + (warn ? ', no limite de ' + MAXCONN + ' do max_connections padrão do PostgreSQL.' : ' (limite padrão do PostgreSQL: ' + MAXCONN + ').') }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Capacidade de ' + PER_POD + ' pedidos/s por pod (33 ms de CPU por pedido, módulo 14) e ' + DB + '/s por banco de um primário. No monolito, cada pod é uma cópia inteira de 8 vCPU; com 9 serviços, o pod do pedidos tem 1 vCPU. X e Z valem nos dois casos: só o Y exige serviços.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Y: como o programa está dividido' }));
    root.appendChild(chipRow('Y', ['Monolito (Y = 1)', '9 serviços (Y = 9)'], yb, function (i) { Y = i; press(yb, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [X.wrap, Z.wrap, D.wrap]));
    X.input.addEventListener('input', render); Z.input.addEventListener('input', render); D.input.addEventListener('input', render);
    root.appendChild(out);
    Y = 1; press(yb, 1);
    render();
  }

  /* =============== AULA 4: vCPU por eixo =============== */
  var MONO = 8, FIXED = 15; /* carrinho 3 + pedidos 3 + pagamentos 2 + estoque 2 + entregas 1 + relatorios 4 */
  function wVcpu(root) {
    var M = slider('Tráfego da vitrine', 1, 20, 1, 10, '×', function (v) { return v + '×'; });
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var m = +M.input.value, mono = MONO * m, svc = FIXED + m, diff = mono - svc;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Monolito: ' + m + ' × 8 vCPU', mono + ' vCPU'),
        fact('Serviços: ' + m + ' (catálogo) + ' + FIXED, svc + ' vCPU'),
        fact(diff >= 0 ? 'Economia do Y' : 'Custo a mais do Y', Math.abs(diff) + ' vCPU (' + fmt(Math.abs(diff) / mono * 100, 0) + '%)')
      ]));
      var max = Math.max(mono, svc);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Monolito', mono, max, mono + ' vCPU', 'cap'),
        bar('Serviços', svc, max, svc + ' vCPU', 'win')
      ]));
      out.appendChild(el('p', { class: 'sr-verdict ' + (diff < 0 ? 'bad' : '') }, [
        el('strong', { text: m === 10 ? '10×: 80 contra 25 vCPU. ' : diff < 0 ? 'A 1× o monolito sai mais barato. ' : fmt(mono, 0) + ' contra ' + svc + ' vCPU. ' }),
        diff < 0 ? 'Quando todas as partes pedem pouco, 7 serviços pagam o piso de cada um (carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1 e relatórios 4 vCPU). O Y compensa quando só uma parte, o catálogo, cresce.'
          : 'Só a vitrine cresce com o tráfego: o monolito clona o programa inteiro (8 vCPU por cópia), e os serviços clonam só o catálogo (1 vCPU por cópia).'
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Os 15 vCPU fora do catálogo são os da Black Friday (carrinho 3 × 1, pedidos 3 × 1, pagamentos 2 × 1, estoque 2 × 1, entregas 1 × 1, relatórios 1 × 4) e ficam fixos neste widget; o catálogo vale 1 vCPU por réplica. O monolito vale 8 vCPU por cópia, e o N de cópias acompanha o tráfego.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [M.wrap]));
    M.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: roteador do Z =============== */
  var CLIENTES = ['lena-77', 'bia-31', 'caio-58', 'davi-12'];
  function wRoteador(root) {
    var key = field('cliente_id', 'text', 'caio-58', { autocomplete: 'off', spellcheck: 'false', maxlength: '40' });
    var N = slider('Shards', 2, 6, 1, 3);
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    function render() {
      var k = key.input.value.trim() || '', n = +N.input.value, h = murmur3(k), s = h % n;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('murmur3 da chave', String(h) + ' (0x' + h.toString(16) + ')'),
        fact('mod ' + n, String(h) + ' mod ' + n + ' = ' + s),
        fact('Vai para', 'shard ' + s)
      ]));
      var shards = el('div', { class: 'sc-shards' });
      for (var i = 0; i < n; i++) shards.appendChild(el('div', { class: 'sc-shard' + (i === s ? ' on' : '') }, ['shard ' + i, el('small', { text: i === s ? k : 'não é esta' })]));
      out.appendChild(shards);
      var rows = CLIENTES.map(function (c) {
        var a = shardOf(c, 3), b = shardOf(c, n);
        return { cls: c === k ? 'sc-cur' : '', cells: [{ text: c }, { text: 'shard ' + a }, { text: 'shard ' + b, cls: a !== b ? 'sc-bad' : '' }] };
      });
      out.appendChild(table(['cliente_id', 'com 3 shards', 'com ' + n + ' shards'], rows));
      var moved = CLIENTES.filter(function (c) { return shardOf(c, 3) !== shardOf(c, n); }).length;
      out.appendChild(el('p', { class: 'sr-note', text: n === 3 ? 'Com 3 shards: lena-77 e bia-31 no shard 1, caio-58 no shard 2 e davi-12 no shard 0. É o que o módulo 16 constrói.' : 'Passando de 3 para ' + n + ' shards, ' + moved + ' dos 4 clientes mudam de shard (em vermelho): repartir move dados, e por isso a escolha da chave e do esquema é a parte difícil do Z.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'murmur3 de 32 bits, seed 0, conferido com os vetores de teste ("" dá 0, "hello" dá 0x248bfa47 e "The quick brown fox jumps over the lazy dog" dá 0x2e4ff723). É o mesmo widget do módulo 16.' }));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [key.wrap, N.wrap]));
    key.input.addEventListener('input', render); N.input.addEventListener('input', render);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: scatter-gather =============== */
  function wScatter(root) {
    var N = slider('Shards', 2, 6, 1, 3);
    var qb = [], Q = 0;
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });
    var SQL = ["WHERE cliente_id = 'caio-58' AND id = 1042", 'WHERE id = 1042'];
    function render() {
      var n = +N.input.value, s = shardOf('caio-58', n), withKey = Q === 0, read = withKey ? 1 : n;
      clear(out);
      out.appendChild(el('p', { class: 'sr-note', text: 'SELECT * FROM pedidos ' + SQL[Q] + ';' }));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Partições lidas', read + ' de ' + n),
        fact('Trabalho no cluster', read + '× a leitura de um shard'),
        fact('Plano do PostgreSQL', withKey ? 'poda: 1 partição' : 'Append em ' + n + ' partições')
      ]));
      var shards = el('div', { class: 'sc-shards' });
      for (var i = 0; i < n; i++) shards.appendChild(el('div', { class: 'sc-shard' + (withKey ? (i === s ? ' on' : '') : ' on') }, ['shard ' + i, el('small', { text: withKey ? (i === s ? 'lido' : 'ignorado') : 'lido' })]));
      out.appendChild(shards);
      out.appendChild(el('p', { class: 'sr-verdict ' + (withKey ? '' : 'bad') }, [
        el('strong', { text: withKey ? 'Com a chave: 1 shard. ' : 'Sem a chave: scatter-gather, ' + n + ' shards. ' }),
        withKey ? 'O roteador calcula murmur3("caio-58") mod ' + n + ' = ' + s + ' e vai direto ao shard ' + s + '.'
          : 'O roteador não sabe de quem é o pedido 1042, pergunta a todos os shards e junta as respostas: a espera é a do mais lento, e cada consulta ocupa ' + n + ' bancos em vez de 1.'
      ]));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'A consulta' }));
    root.appendChild(chipRow('Consulta', ['Com a chave (cliente_id)', 'Sem a chave (só o id)'], qb, function (i) { Q = i; press(qb, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [N.wrap]));
    N.input.addEventListener('input', render);
    root.appendChild(out);
    press(qb, 0);
    render();
  }

  var REG = { diagnostico: wDiagnostico, 'cubo-pods': wCuboPods, vcpu: wVcpu, roteador: wRoteador, scatter: wScatter };
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
