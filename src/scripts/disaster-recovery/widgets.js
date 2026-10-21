/* SDLabs · Single Point of Failure e Disaster Recovery: widgets em JS puro
   (auditoria de SPoF, relógio do failover, split brain, estratégia de DR, restore e pilot light, MTTD/MTTR/MTBF, RPO e lag, capacidade da passiva).
   Usam os números do brief (calculados em Python em 21/10/2026): 12 elos a 99,9% (98,8066% · 99,5003% · 99,9988%), queda de SP
   (MTTD 30 s, RTO 65 s), RTOs 2.874 · 720 · 65 · 35 s, R$ 792/s, restore de 46,2 GB a 50 MB/s = 924 s, split brain 297 e 2.970,
   médias do artigo 34 · 108,4 · 204,5 min. Durações de nós e pods são modelo (exemplo). Nenhum failover foi rodado. */
(function () {
  'use strict';

  var MES = 43200; // minutos em 30 dias

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
  function fmtS(s) { /* segundos em texto curto: 65 s · 12 min · 47 min 54 s · 2 h 47 min */
    if (s < 120) return fmt(s, 1) + ' s';
    var m = Math.floor(s / 60), r = Math.round(s - m * 60);
    if (m < 120) return m + ' min' + (r ? ' ' + r + ' s' : '');
    var h = Math.floor(m / 60);
    return h + ' h' + (m - h * 60 ? ' ' + (m - h * 60) + ' min' : '');
  }
  function brl(v) { return 'R$ ' + fmt(Math.round(v), 0); }
  function pct(a, d) { return fmt(a * 100, d == null ? 4 : d) + '%'; }

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
    var id = 'dr-sl-' + (++uid);
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
  function numField(label, min, max, step, value, unit) {
    var id = 'dr-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: value == null ? '' : String(value), inputmode: 'decimal', class: 'dr-num' });
    return {
      input: inp,
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp])
    };
  }
  function fact(label, value, kind) {
    return el('div', { class: 'sr-fact' + (kind === 'bad' ? ' dr-badfact' : kind === 'ok' ? ' dr-okfact' : '') }, [el('small', { text: label }), el('b', { text: value })]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function bar(label, value, max, cls, text) {
    var w = max > 0 ? Math.max(1, Math.min(100, value / max * 100)) : 0;
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [
      el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + w.toFixed(1) + '%' }), el('span', { class: 'sr-lbl', text: text })])]);
  }

  /* =============== AULA 2: auditoria de SPoF (12 elos) =============== */
  var ELOS = [
    ['DNS loja.com.br', 1], ['Certificado TLS', 1], ['edge-loja (mesmo código e mapa)', 1], ['Identidade (chaves do JWT)', 1],
    ['lb e gw-loja', 2], ['bff-app', 2], ['pedidos', 2], ['pagamentos → PSP (com PSP-B)', 2], ['estoque', 2],
    ['PostgreSQL (primário + passiva)', 2], ['Kafka da célula', 2], ['Mapa e plano de controle', 1]
  ];
  function wAuditoria(root) {
    var st = ELOS.map(function (e) { return { name: e[0], a: 99.9, k: e[1] }; });
    var avail = [], copies = [], rows = [];
    var list = el('div', { class: 'dr-elos' });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var last = '';
    function A(e) { var f = 1 - e.a / 100; return 1 - Math.pow(f, e.k); }
    function total() { return st.reduce(function (p, e) { return p * A(e); }, 1); }
    function render() {
      var T = total(), min = (1 - T) * MES, n = 0;
      st.forEach(function (e, i) {
        var s = e.k === 1; if (s) n++;
        rows[i].badge.textContent = s ? 'SPoF' : 'ok';
        rows[i].badge.className = 'dr-badge ' + (s ? 'bad' : 'ok');
        rows[i].row.className = 'dr-elo' + (s ? ' spof' : '');
        rows[i].dup.disabled = e.k >= 3;
      });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Disponibilidade em série', pct(T, 4), n ? 'bad' : 'ok'),
        fact('Minutos de falha por mês', fmt(min, min < 10 ? 2 : 1), min > 60 ? 'bad' : 'ok'),
        fact('Elos com uma só cópia', String(n), n ? 'bad' : 'ok')
      ]));
      if (last) out.appendChild(verdict(false, 'Duplicar:', last));
      out.appendChild(note('Cada elo duplicado vira um paralelo (1 − (1 − a)^cópias). A conta só vale com falhas independentes: o edge-loja com o mesmo código nas três instâncias é uma falha só, por isso entra com 1 cópia. Mês de 30 dias (43.200 min).'));
    }
    st.forEach(function (e, i) {
      var a = numField('Disponibilidade (%)', 99, 99.999, 0.001, e.a, '');
      var k = el('select', { class: 'dr-num', 'aria-label': 'Cópias de ' + e.name });
      [1, 2, 3].forEach(function (v) { k.appendChild(el('option', { value: String(v), text: v + (v === 1 ? ' cópia' : ' cópias') })); });
      k.value = String(e.k);
      var badge = el('span', { class: 'dr-badge' });
      var dup = el('button', { type: 'button', class: 'btn', text: 'Duplicar', 'aria-label': 'Duplicar este elo: ' + e.name });
      a.input.setAttribute('aria-label', 'Disponibilidade de ' + e.name + ' em %');
      a.input.addEventListener('input', function () { var v = parseFloat(a.input.value); if (v >= 99 && v <= 99.99999) { e.a = v; last = ''; render(); } });
      k.addEventListener('change', function () { e.k = +k.value; last = ''; render(); });
      dup.addEventListener('click', function () {
        var before = (1 - total()) * MES;
        e.k = Math.min(3, e.k + 1); k.value = String(e.k);
        var after = (1 - total()) * MES;
        last = e.name + ': de ' + fmt(before, 1) + ' para ' + fmt(after, 1) + ' min por mês, ganho de ' + fmt(before - after, 1) + ' min.';
        render();
      });
      var row = el('div', { class: 'dr-elo' }, [
        el('div', { class: 'dr-elo-h' }, [el('span', { class: 'dr-n', text: String(i + 1) }), el('span', { class: 'dr-nm', text: e.name }), badge]),
        el('div', { class: 'dr-elo-c' }, [el('div', { class: 'sr-ctl' }, [el('label', { text: 'Disp. (%)' }), a.input]), el('div', { class: 'sr-ctl' }, [el('label', { text: 'Cópias' }), k]), dup])
      ]);
      rows.push({ row: row, badge: badge, dup: dup, k: k, a: a });
      list.appendChild(row);
    });
    var btns = [];
    function preset(i) {
      press(btns, i);
      st.forEach(function (e, j) {
        e.a = 99.9; rows[j].a.input.value = '99.9';
        e.k = i === 0 ? 1 : i === 2 ? 2 : ELOS[j][1];
        rows[j].k.value = String(e.k);
      });
      last = ''; render();
    }
    root.appendChild(chipRow('Cenário', ['Todos com 1 cópia', 'Hoje (5 SPoFs)', 'Tudo duplicado'], btns, preset));
    root.appendChild(list);
    root.appendChild(out);
    preset(1);
  }

  /* =============== AULA 3: relógio do failover =============== */
  var TAXA_SP = 9.9;
  function wRelogio(root) {
    var iv = slider('Intervalo da sonda', 1, 30, 1, 10, 's', function (v) { return fmt(v, 0); });
    var nf = slider('Falhas seguidas', 1, 5, 1, 3, '', function (v) { return fmt(v, 0); });
    var pr = slider('Promoção do banco (ttl + 5)', 5, 120, 5, 35, 's', function (v) { return fmt(v, 0); });
    var pd = slider('Pods da passiva prontos', 0, 120, 5, 30, 's', function (v) { return fmt(v, 0); });
    var mp = slider('Propagação do mapa', 1, 60, 1, 5, 's', function (v) { return fmt(v, 0); });
    var dn = slider('TTL do DNS', 0, 300, 10, 60, 's', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var BLIP = 20; // soluço de rede de exemplo, em s
    function render() {
      var I = +iv.input.value, N = +nf.input.value, P = +pr.input.value, D = +pd.input.value, M = +mp.input.value, T = +dn.input.value;
      var mttd = I * N, troca = Math.max(mttd + D, P) + M, mttr = troca - mttd, rto = troca;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('MTTD (sonda × falhas)', fmt(mttd, 0) + ' s'),
        fact('MTTR (da detecção à volta)', fmt(mttr, 0) + ' s'),
        fact('RTO (da interrupção)', fmt(rto, 0) + ' s', rto > 300 ? 'bad' : 'ok'),
        fact('Tentativas falhas (9,9/s)', fmt(TAXA_SP * rto, 1)),
        fact('Clientes no endereço antigo', 'até ' + fmt(T, 0) + ' s')
      ]));
      var fp = mttd <= BLIP, slow = mttd >= 60;
      if (fp) out.appendChild(verdict(true, 'Falso positivo:', 'a janela de ' + fmt(mttd, 0) + ' s cabe num soluço de rede de ' + BLIP + ' s (exemplo). A sonda dá a região por caída, o failover dispara e SP, que estava bem, é derrubada (e abre a porta do split brain).'));
      else if (slow) out.appendChild(verdict(true, 'Demora:', 'só ' + fmt(mttd, 0) + ' s para perceber a queda. Cada segundo parado custa 9,9 pedidos: o RTO fica em ' + fmt(rto, 0) + ' s.'));
      else out.appendChild(verdict(false, 'Equilíbrio:', 'a janela de ' + fmt(mttd, 0) + ' s passa de um soluço de ' + BLIP + ' s e ainda detecta em menos de 1 min. Com 10 s × 3 o RTO é de 65 s.'));
      out.appendChild(note('As etapas se sobrepõem: RTO = maior de (detecção + pods) e promoção, mais o mapa. O soluço de ' + BLIP + ' s e as durações de pods e mapa são exemplo (modelo); a conta dos 65 s é a do brief.'));
    }
    [iv, nf, pr, pd, mp, dn].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [iv.wrap, nf.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pr.wrap, pd.wrap, mp.wrap, dn.wrap]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 3: split brain =============== */
  function wSplitBrain(root) {
    var tx = slider('Pedidos/s da célula', 0.5, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var jn = slider('Janela até o fencing', 0, 300, 5, 30, 's', function (v) { return fmt(v, 0); });
    var tk = slider('Ticket médio', 20, 300, 5, 80, 'R$', function (v) { return fmt(v, 0); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var btns = [];
    function render() {
      var r = +tx.input.value, j = +jn.input.value, t = +tk.input.value, n = r * j;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Pedidos confirmados e descartados', fmt(n, 0), n > 0 ? 'bad' : 'ok'),
        fact('Valor desses pedidos', brl(n * t), n > 0 ? 'bad' : 'ok'),
        fact('Primários ao mesmo tempo', j > 0 ? '2' : '1', j > 0 ? 'bad' : 'ok')
      ]));
      out.appendChild(verdict(n > 0, n > 0 ? 'Dois primários:' : 'Sem janela:',
        n > 0 ? 'SP, ilhada e viva, aceita ' + fmt(r, 1) + ' pedidos/s por ' + fmt(j, 0) + ' s. O Rio nunca os viu e o pg_rewind os descarta ao religar o primário antigo.' : 'o fencing rebaixou o primário antigo no instante da promoção: nenhum pedido confirmado se perde.'));
      out.appendChild(note('Conta do brief: 9,9 × 30 s = 297 e 9,9 × 300 s = 2.970. O valor em reais usa o ticket de exemplo (R$ 80). Nenhum fencing do Patroni foi testado com partição de rede.'));
    }
    function pick(i) { press(btns, i); jn.set(i === 0 ? 30 : 300); render(); }
    [tx, jn, tk].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(chipRow('Janela', ['30 s: o fencing agiu', '5 min: o fencing falhou'], btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, jn.wrap, tk.wrap]));
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 4: estratégia de DR =============== */
  var EST = [
    { id: 'backup', name: 'Backup e restauração', rto: 2874, rpo: [86400, 300], extra: '~2%', roda: 'nada; backup e WAL no armazenamento de objetos' },
    { id: 'pilot', name: 'Pilot light', rto: 720, rpo: [0.3], extra: '~10%', roda: 'só o banco e o tópico replicando; 0 pods' },
    { id: 'warm', name: 'Warm standby (ativo-passivo)', rto: 65, rpo: [0.3], extra: '~30%', roda: 'a pilha a 30% da capacidade, pronta' },
    { id: 'aa', name: 'Ativo-ativo', rto: 35, rpo: [0.3], extra: '~100%', roda: 'a pilha a 100%, servindo clientes' }
  ];
  var SERV = [
    { name: 'checkout', rto: 300, rpo: 1, txt: '5 min · 1 s' },
    { name: 'catálogo', rto: 900, rpo: 3600, txt: '15 min · 1 h' },
    { name: 'relatórios', rto: 86400, rpo: 86400, txt: '24 h · 24 h' }
  ];
  function wEstrategia(root) {
    var S = { e: 1, s: 0, b: 0 }, ebtn = [], sbtn = [], bbtn = [];
    var tx = slider('Pedidos/s da célula', 1, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var tk = slider('Ticket médio', 20, 300, 5, 80, 'R$', function (v) { return fmt(v, 0); });
    var bwrap = el('div', { class: 'dr-sub' });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var e = EST[S.e], sv = SERV[S.s], r = +tx.input.value, t = +tk.input.value;
      var rpo = e.id === 'backup' ? e.rpo[S.b] : e.rpo[0];
      bwrap.hidden = e.id !== 'backup';
      var perda = r * t * e.rto, ped = r * rpo;
      var okT = e.rto <= sv.rto, okP = rpo <= sv.rpo, ok = okT && okP;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('RTO', fmtS(e.rto) + (e.rto > 120 ? ' (' + fmt(e.rto, 0) + ' s)' : '')),
        fact('RPO', rpo >= 60 ? fmtS(rpo) : fmt(rpo, 1) + ' s'),
        fact('Pedidos perdidos (esperado)', fmt(ped, 2)),
        fact('Custo extra de infra', e.extra),
        fact('R$ perdidos', brl(perda), perda > 100000 ? 'bad' : '')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, EST.map(function (x, i) {
        return bar(x.name.split(' (')[0], r * t * x.rto, r * t * EST[0].rto, i === S.e ? 'win' : '', brl(r * t * x.rto));
      })));
      out.appendChild(verdict(!ok, ok ? 'Passa:' : 'Não passa:',
        e.name + ' no ' + sv.name + ' (meta ' + sv.txt + '): ' + (okT ? 'RTO de ' + fmtS(e.rto) + ' cabe' : 'RTO de ' + fmtS(e.rto) + ' passa dos ' + fmtS(sv.rto)) + '; ' + (okP ? 'RPO cabe.' : 'RPO de ' + (rpo >= 60 ? fmtS(rpo) : fmt(rpo, 1) + ' s') + ' passa de ' + (sv.rpo >= 60 ? fmtS(sv.rpo) : sv.rpo + ' s') + '.')));
      out.appendChild(note('Na reserva: ' + e.roda + '. R$ perdidos = pedidos/s × ticket × RTO (R$ 792/s × RTO com 9,9 × R$ 80). Durações e custos relativos são exemplo; nenhum failover regional foi rodado. O ativo-ativo síncrono leva o RPO a 0, a +10 ms (Rio) ou +80 ms (Recife) por commit.'));
    }
    function pickE(i) { S.e = i; press(ebtn, i); render(); }
    function pickS(i) { S.s = i; press(sbtn, i); render(); }
    function pickB(i) { S.b = i; press(bbtn, i); render(); }
    [tx, tk].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(el('p', { class: 'sr-sub', text: 'Estratégia' }));
    root.appendChild(chipRow('Estratégia', EST.map(function (x) { return x.name; }), ebtn, pickE));
    bwrap.appendChild(chipRow('Backup', ['Backup noturno (RPO 24 h)', 'WAL a cada 5 min (RPO 5 min)'], bbtn, pickB));
    root.appendChild(bwrap);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Meta do serviço' }));
    root.appendChild(chipRow('Serviço', SERV.map(function (x) { return x.name + ' (' + x.txt + ')'; }), sbtn, pickS));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, tk.wrap]));
    root.appendChild(out);
    press(bbtn, 0);
    pickS(0); pickE(1);
  }

  /* =============== AULA 4: restore e pilot light em passos =============== */
  function wRestore(root) {
    var f = {
      gb: numField('Tamanho do banco', 1, 2000, 0.1, 46.2, 'GB'),
      mb: numField('Vazão do restore', 5, 2000, 5, 50, 'MB/s'),
      det: numField('Detectar', 0, 600, 5, 30, 's'),
      dec: numField('Decisão humana', 0, 120, 1, 5, 'min'),
      iac: numField('Infra por IaC', 0, 120, 1, 20, 'min'),
      wal: numField('Replay do WAL', 0, 120, 1, 5, 'min'),
      nos: numField('Nós novos', 0, 30, 1, 4, 'min'),
      pods: numField('Pods prontos', 0, 600, 5, 30, 's'),
      aq: numField('Aquecimento', 0, 60, 1, 2, 'min')
    };
    var MODES = [
      { name: 'Backup e restauração', keys: ['gb', 'mb', 'dec', 'iac', 'wal', 'pods', 'aq'] },
      { name: 'Pilot light', keys: ['det', 'dec', 'nos', 'pods', 'aq'] }
    ];
    var NAMES = { gb: 'Restore do banco', det: 'Detectar', dec: 'Decisão humana', iac: 'Infra por IaC', wal: 'Replay do WAL', nos: 'Nós novos', pods: 'Pods', aq: 'Aquecimento' };
    var btns = [], mode = 0;
    var fields = el('div', { class: 'sr-ctrls' });
    Object.keys(f).forEach(function (k) { fields.appendChild(f[k].wrap); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function secs(k) {
      var v = parseFloat(f[k].input.value); if (!(v >= 0)) v = 0;
      if (k === 'gb') return v * 1000 / Math.max(1, parseFloat(f.mb.input.value) || 1);
      if (k === 'dec' || k === 'iac' || k === 'wal' || k === 'nos' || k === 'aq') return v * 60;
      return v;
    }
    function render() {
      var m = MODES[mode];
      Object.keys(f).forEach(function (k) { f[k].wrap.hidden = m.keys.indexOf(k) < 0 && !(k === 'mb' && m.keys.indexOf('gb') >= 0); });
      var steps = m.keys.filter(function (k) { return k !== 'mb'; }).map(function (k) { return { k: k, s: secs(k) }; });
      var tot = steps.reduce(function (p, x) { return p + x.s; }, 0), big = steps.reduce(function (p, x) { return x.s > p.s ? x : p; }, steps[0]);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('RTO total', fmt(tot, 0) + ' s'), fact('Em minutos', fmtS(tot)), fact('Passo mais pesado', NAMES[big.k] + ' (' + fmt(big.s / Math.max(tot, 1) * 100, 0) + '%)', 'bad'),
        fact('R$ perdidos (R$ 792/s)', brl(tot * 792))
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, steps.map(function (x) {
        return bar(NAMES[x.k], x.s, big.s, x === big ? 'cap' : '', fmt(x.s, 0) + ' s');
      })));
      out.appendChild(note(mode === 0
        ? 'Soma: decisão + infra + restore (' + fmt(secs('gb'), 0) + ' s = GB × 1.000 ÷ MB/s) + replay do WAL + pods + aquecimento. Com os padrões: 300 + 1.200 + 924 + 300 + 30 + 120 = 2.874 s. As durações (menos a conta do restore) são exemplo.'
        : 'Soma: detectar + decisão humana + nós + pods + aquecimento. Com os padrões: 30 + 300 + 240 + 30 + 120 = 720 s (12 min). A decisão humana de 5 min é a que a automação elimina; as durações são exemplo.'));
    }
    function pick(i) { mode = i; press(btns, i); render(); }
    Object.keys(f).forEach(function (k) { f[k].input.addEventListener('input', render); });
    root.appendChild(chipRow('Estratégia', MODES.map(function (m) { return m.name; }), btns, pick));
    root.appendChild(fields);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 4: capacidade da passiva =============== */
  var CEL = [
    { id: 'celula-sp', t: 9.9, regiao: 'SP', passiva: 'Rio', base: 4.5 },
    { id: 'celula-rio', t: 4.5, regiao: 'Rio', passiva: 'SP', base: 9.9 },
    { id: 'celula-recife', t: 3.6, regiao: 'Recife', passiva: 'SP', base: 9.9 },
    { id: 'celula-mkt', t: 12.0, regiao: 'Recife', passiva: 'SP', base: 9.9 }
  ];
  function wPassiva(root) {
    var S = { c: 0, nos: 1 }, cb = [], nb = [];
    var warm = slider('Passiva warm', 10, 100, 5, 30, '% da capacidade', function (v) { return fmt(v, 0); });
    var pp = slider('Pedidos/s por pod', 1, 10, 0.5, 3, '/s', function (v) { return fmt(v, 1); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var c = CEL[S.c], W = +warm.input.value / 100, P = +pp.input.value;
      var fator = (c.base + c.t) / c.base, plenos = Math.ceil(c.t / P), quentes = Math.max(1, Math.ceil(plenos * W)), novos = Math.max(0, plenos - quentes);
      var tempo = novos === 0 ? 0 : 30 + (S.nos ? 0 : 240);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Região da passiva (' + c.passiva + ')', fmt(c.base, 1) + ' → ' + fmt(c.base + c.t, 1) + ' pedidos/s'),
        fact('Fator de carga', fmt(fator, 1) + '×', fator >= 3 ? 'bad' : ''),
        fact('Pods da célula a 100%', String(plenos)),
        fact('Pods warm → a escalar', quentes + ' → +' + novos),
        fact('Tempo de scale-up', tempo ? fmtS(tempo) : 'nenhum', tempo > 60 ? 'bad' : 'ok')
      ]));
      out.appendChild(verdict(fator >= 3, fator >= 3 ? 'A passiva triplica:' : 'A passiva aguenta:',
        c.passiva + ' vai de ' + fmt(c.base, 1) + ' a ' + fmt(c.base + c.t, 1) + ' pedidos/s (' + fmt(fator, 1) + '×). ' + (novos ? 'Os ' + novos + ' pods novos levam 30 s' + (S.nos ? ' com nós livres.' : ' mais 4 min para os nós, porque não há nós livres.') : 'Já roda com a capacidade toda.')));
      out.appendChild(note('A carga vem do módulo 26 (' + CEL.map(function (x) { return x.id.replace('celula-', '') + ' ' + fmt(x.t, 1); }).join(' · ') + '; a região de SP guarda a carga de SP, e o Rio, a do Rio). Pedidos/s por pod e os 30 s por pod são exemplo; a conta do 3,2× é a do módulo 26.'));
    }
    function pickC(i) { S.c = i; press(cb, i); render(); }
    function pickN(i) { S.nos = i; press(nb, i); render(); }
    [warm, pp].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(chipRow('Célula que cai', CEL.map(function (c) { return c.id + ' → ' + c.passiva; }), cb, pickC));
    root.appendChild(chipRow('Nós', ['Nós livres (30 s)', 'Sem nós livres (+4 min)'], nb, pickN));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [warm.wrap, pp.wrap]));
    root.appendChild(out);
    press(nb, 0); pickC(0);
  }

  /* =============== AULA 5: MTTD, MTTR e MTBF =============== */
  var ART = { det: [60, 18, 20, 21, 51], rep: [90, 105, 132, 22, 193], gap: [116, 85, 240, 377, ''] };
  function wMttd(root) {
    var det = [], rep = [], gap = [], rows = [];
    var tb = el('tbody');
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var d = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Incidente ' + (i + 1) + ': detecção levou (min)' });
        var r = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Incidente ' + (i + 1) + ': reparo levou (min)' });
        var g = el('input', { type: 'number', min: '0', step: 'any', class: 'dr-num', inputmode: 'decimal', 'aria-label': 'Intervalo depois do incidente ' + (i + 1) + ' (min)' });
        [d, r, g].forEach(function (x) { x.addEventListener('input', render); });
        det.push(d); rep.push(r); gap.push(g);
        tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: 'Incidente ' + (i + 1) }), el('td', null, [d]), el('td', null, [r]), el('td', null, [g])]));
      })(i);
    }
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    var warn = false;
    function avg(arr) {
      var v = arr.map(function (x) { return parseFloat(x.value); }).filter(function (x) { return x >= 0; });
      return v.length ? v.reduce(function (p, x) { return p + x; }, 0) / v.length : null;
    }
    function render() {
      var a = avg(det), b = avg(rep), c = avg(gap);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('MTTD (início → detecção)', a == null ? '—' : fmt(a, 2) + ' min'),
        fact('MTTR (detecção → volta)', b == null ? '—' : fmt(b, 2) + ' min'),
        fact('MTBF (volta → próxima)', c == null ? '—' : fmt(c, 2) + ' min'),
        fact('Disponibilidade', b == null || c == null ? '—' : pct(c / (c + b), c / (c + b) > 0.99 ? 4 : 1))
      ]));
      if (warn) out.appendChild(verdict(true, 'Didático:', 'as três colunas vêm de três tabelas do artigo que não descrevem os mesmos incidentes (a detecção de "12:00 PM" vira "12:00 AM"; 10:02 vira 11:02). Cada média está certa para a sua tabela, e a disponibilidade de 65,4% mostra que não são números de uma operação real.'));
      out.appendChild(note('Disponibilidade = MTBF ÷ (MTBF + MTTR), com os minutos como estão. A última linha não tem "intervalo até a próxima falha". Células em branco ficam fora da média.'));
    }
    function put(arr, vals) { arr.forEach(function (x, i) { x.value = vals[i] === undefined || vals[i] === '' ? '' : String(vals[i]); }); }
    var btns = [];
    function preset(i) {
      press(btns, i);
      warn = i === 0;
      if (i === 0) { put(det, ART.det); put(rep, ART.rep); put(gap, ART.gap); }
      else if (i === 1) { put(det, [0.5, '', '', '', '']); put(rep, [65 / 60, '', '', '', '']); put(gap, [MES, '', '', '', '']); }
      else { put(det, ['', '', '', '', '']); put(rep, ['', '', '', '', '']); put(gap, ['', '', '', '', '']); }
      render();
    }
    root.appendChild(chipRow('Tabela', ['Tabela do artigo', 'Queda de SP (30 s, 65 s, MTBF de 30 dias)', 'Limpar'], btns, preset));
    root.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table dr-table' }, [
      el('thead', null, [el('tr', null, ['', 'Detecção levou (min)', 'Reparo levou (min)', 'Até a próxima falha (min)'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]));
    root.appendChild(out);
    preset(0);
  }

  /* =============== AULA 5: RPO e lag =============== */
  function wRpo(root) {
    var CELS = [['celula-recife', 3.6, 0.8], ['celula-rio', 4.5, 0.3], ['celula-sp', 9.9, 0.3], ['celula-mkt', 12.0, 0.8]];
    var btns = [];
    var tx = slider('Pedidos/s da célula', 0.5, 30, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
    var lg = slider('Lag da replicação', 0, 2, 0.05, 0.3, 's', function (v) { return fmt(v, 2); });
    var out = el('div', { class: 'dr-out', 'aria-live': 'polite' });
    function render() {
      var r = +tx.input.value, l = +lg.input.value, p = r * l;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Perda esperada (taxa × lag)', fmt(p, 2) + ' pedidos', p > 1 ? 'bad' : 'ok'),
        fact('Janela de lag', fmt(l * 1000, 0) + ' ms', l > 0.5 ? 'bad' : 'ok')
      ]));
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Assíncrono', 2, 82, 'win', '2 ms'), bar('Síncrono Rio', 12, 82, '', '12 ms (2 + 10)'), bar('Síncrono Recife', 82, 82, 'cap', '82 ms (2 + 80)')
      ]));
      out.appendChild(verdict(l > 0.5, l > 0.5 ? 'Acima do alerta:' : 'Dentro do alerta:',
        'o lag de ' + fmt(l * 1000, 0) + ' ms ' + (l > 0.5 ? 'passa dos 500 ms do alerta de replication_lag_seconds; a promessa de 1 s está em risco antes de qualquer desastre.' : 'está abaixo dos 500 ms do alerta de replication_lag_seconds. RPO zero pediria o commit síncrono: 12 ms com o Rio, 82 ms com Recife.')));
      out.appendChild(note('Perda esperada = taxa × lag (célula-sp 9,9 × 0,3 = 2,97 · recife 3,6 × 0,8 = 2,88 · mkt 12 × 0,8 = 9,6). Latências do commit do módulo 17: 2 ms local, mais 10 ms (Rio) ou 80 ms (Recife) de ida e volta.'));
    }
    function pick(i) { press(btns, i); tx.set(CELS[i][1]); lg.set(CELS[i][2]); render(); }
    [tx, lg].forEach(function (s) { s.input.addEventListener('input', function () { press(btns, -1); render(); }); });
    root.appendChild(chipRow('Célula', CELS.map(function (c) { return c[0] + ' (' + fmt(c[1], 1) + '/s, ' + fmt(c[2], 1) + ' s)'; }), btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tx.wrap, lg.wrap]));
    root.appendChild(out);
    pick(2);
  }

  var REG = { auditoria: wAuditoria, relogio: wRelogio, splitbrain: wSplitBrain, estrategia: wEstrategia, restore: wRestore, passiva: wPassiva, mttd: wMttd, rpo: wRpo };
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
