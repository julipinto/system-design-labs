/* SDLabs · Resiliência: widgets em JS puro
   (disponibilidade, Little e pool, cadeia de prazos, tempestade de retry, amplificação, circuit breaker, fallback,
   degradação, fila e backpressure, bulkhead, blast radius e chave de idempotência).
   Usam os números do brief: 30 pedidos/s, pool de 50, PSP-A em 8 s de 20:20:00 a 20:21:30, timeout de 1 s,
   breaker (janela 20, mínimo 10, 50%, aberto 30 s, 5 sondas), 1.300 req/s contra 1.000, fila de 5.000, bulkheads 50/30/20.
   O breaker e a tempestade repetem no navegador as simulações do brief (Python, semente 7): as duas estratégias sem sorteio
   e o breaker batem exatamente; as com jitter usam outro gerador de números e variam um pouco. */
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
  /* arredonda para o par (o Python do brief mostra 20,2× para 20,25) */
  function r1(x) {
    var y = x * 10, f = Math.floor(y), d = y - f;
    var r = Math.abs(d - 0.5) < 1e-9 ? (f % 2 === 0 ? f : f + 1) : Math.round(y);
    return r / 10;
  }
  function fmtPct(p) { return fmt(p * 100, 4) + '%'; }
  function fmtS(s) { return fmt(s, 2) + ' s'; }
  function fmtMin(m) {
    if (m >= 60) return fmt(m, 1) + ' min';
    if (m >= 1) return fmt(m, 2) + ' min';
    return fmt(m * 60, 1) + ' s';
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
    var id = 'rs-sl-' + (++uid);
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
    var id = 'rs-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: String(value), inputmode: 'decimal', class: 'rs-num' });
    return {
      input: inp,
      wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp])
    };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' rs-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows, cls) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table rs-table ' + (cls || '') }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }

  /* =============== AULA 2: disponibilidade =============== */
  function wDisponibilidade(root) {
    var MIN = 43200, TENT = 12960000;
    var AV = [0.99, 0.995, 0.999, 0.9995, 0.9999, 0.99999];
    var AVL = ['99%', '99,5%', '99,9%', '99,95%', '99,99%', '99,999%'];
    var S = { a: 2, psp: false, par: false };
    var n = slider('Saltos em série', 1, 8, 1, 4, 'saltos');
    var aB = [], pB = [], parB = [];
    var slo = [0.99, 0.995, 0.999, 0.9995, 0.9999], sloIdx = 2, sloB = [];
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var k = +n.input.value, a = AV[S.a];
      var last = S.psp ? 0.995 : a;
      var lastEff = S.par ? 1 - (1 - last) * (1 - last) : last;
      var total = Math.pow(a, k - 1) * lastEff;
      var down = MIN * (1 - total);
      var budget = (1 - slo[sloIdx]) * TENT;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Disponibilidade da cadeia', fmtPct(total), total < 0.999),
        fact('Fora do ar por mês', fmtMin(down)),
        fact('Por 30 dias (43.200 min)', fmt(MIN * total, 1) + ' min no ar')
      ]));
      var rows = AV.concat([0.99999]).slice(0, 6).map(function (v, i) {
        return { cls: i === S.a ? 'rs-cur' : '', cells: [{ text: AVL[i] }, { text: fmtMin(MIN * (1 - v)) }, { text: fmt(86400 * 30 * (1 - v), 0) + ' s' }] };
      });
      out.appendChild(table(['Tabela de noves', 'Fora por mês', 'Em segundos'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('SLO por uso', AVL[AV.indexOf(slo[sloIdx])] || fmtPct(slo[sloIdx])),
        fact('Orçamento de erro (12.960.000 tentativas)', fmt(budget, 0) + ' falhas'),
        fact('Incidente de 90 s (2.700 falhas)', fmt(2700 / budget * 100, 1) + '% do mês', 2700 / budget > 0.5),
        fact('Sem proteção, 5 min (9.000 falhas)', fmt(9000 / budget * 100, 1) + '% do mês', 9000 / budget > 1)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('O incidente, por uso (1 − 2.700 ÷ 12.960.000)', fmtPct(1 - 2700 / TENT)),
        fact('O mesmo incidente, por tempo (90 s de 43.200 min)', fmtPct(1 - 1.5 / MIN))
      ]));
      out.appendChild(verdict(total < 0.999,
        total < 0.999 ? 'A cadeia ficou abaixo de 99,9%.' : 'A cadeia segura o 99,9%.',
        S.par
          ? 'Dois PSPs em paralelo só valem se as falhas forem independentes: na mesma nuvem e com a mesma credencial, o segundo cai junto com o primeiro.'
          : 'Em série cada salto multiplica a conta: quatro saltos a 99,9% fecham em 99,6006% (172,5 min por mês). Ponha o PSP-B em paralelo e veja o que muda.'));
      out.appendChild(note('Por uso conta tentativas (o mês a 5 pedidos/s tem 12.960.000); por tempo conta minutos. Uma resposta em 8 s é sucesso por status e falha para o cliente: o SLI precisa de limite de latência.'));
    }
    function pickA(i) { S.a = i; press(aB, i); render(); }
    function pickP(i) { S.psp = i === 1; press(pB, i); render(); }
    function pickPar(i) { S.par = i === 1; press(parB, i); render(); }
    function pickSlo(i) { sloIdx = i; press(sloB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Disponibilidade de cada salto' }));
    root.appendChild(chipRow('Disponibilidade de cada salto', AVL, aB, pickA));
    root.appendChild(el('p', { class: 'sr-sub', text: 'O último salto' }));
    root.appendChild(chipRow('O último salto', ['Igual aos outros', 'É o PSP-A a 99,5%'], pB, pickP));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Segundo PSP' }));
    root.appendChild(chipRow('PSP-B em paralelo', ['Sem PSP-B', 'Com PSP-B em paralelo'], parB, pickPar));
    root.appendChild(el('p', { class: 'sr-sub', text: 'SLO por uso (orçamento de erro)' }));
    root.appendChild(chipRow('SLO', ['99%', '99,5%', '99,9%', '99,95%', '99,99%'], sloB, pickSlo));
    n.input.addEventListener('input', render);
    root.appendChild(out);
    pickA(2); pickP(0); pickPar(0); pickSlo(2);
  }

  /* =============== AULA 6: Little e pool =============== */
  function wLittle(root) {
    var pool = slider('Pool de conexões', 10, 200, 5, 50, 'conexões');
    var taxa = slider('Pedidos por segundo', 5, 100, 5, 30, '/s');
    var lat = slider('Tempo de cada chamada', 0.1, 10, 0.1, 1, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var p = +pool.input.value, r = +taxa.input.value, w = +lat.input.value;
      var L = r * w, vaz = p / w, crit = p / r, sat = L > p + 1e-9;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Em voo (L = taxa × tempo)', fmt(L, 1) + ' de ' + p, sat),
        fact('Vazão máxima do pool', fmt(vaz, vaz < 10 ? 2 : 0) + '/s', vaz < r),
        fact('Satura?', sat ? 'SATURA' : 'ok', sat),
        fact('Timeout crítico (pool ÷ taxa)', fmt(crit, 2) + ' s')
      ]));
      var rows = [0.18, 0.6, 1, 2, 8].map(function (x) {
        var l = r * x, s = l > p + 1e-9;
        return { cls: Math.abs(x - w) < 0.05 ? 'rs-cur' : '', cells: [{ text: fmt(x, 2) + ' s' }, { text: fmt(l, 1) }, { text: fmt(p / x, p / x < 10 ? 2 : 0) + '/s' }, { text: s ? 'SATURA' : 'ok', cls: s ? 'rs-bad' : '' }] };
      });
      out.appendChild(table(['Tempo da chamada', 'Em voo', 'Vazão máxima', 'Pool'], rows));
      out.appendChild(verdict(sat,
        sat ? 'O pool esgota em ' + fmt(p / r, 2) + ' s.' : 'O pool aguenta.',
        sat
          ? 'Com cada chamada presa por ' + fmt(w, 1) + ' s entram ' + fmt(r, 0) + ' por segundo e só saem ' + fmt(vaz, vaz < 10 ? 2 : 0) + ': a conta não fecha, e o timeout tem de ser menor que ' + fmt(crit, 2) + ' s.'
          : 'Em voo ' + fmt(L, 1) + ' de ' + p + ' conexões. Quanto mais perto do pool, menos folga para a próxima lentidão; o timeout ainda precisa ficar abaixo de ' + fmt(crit, 2) + ' s.'));
      out.appendChild(note('Com os padrões da história (pool 50, 30/s): 1 s dá 30 em voo (ok), 2 s dá 60 (satura) e 8 s dá 240. Timeout crítico = 50 ÷ 30 = 1,67 s. É a Lei de Little: em voo = taxa × tempo.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pool.wrap, taxa.wrap, lat.wrap]));
    [pool, taxa, lat].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: cadeia de prazos =============== */
  function wPrazos(root) {
    var NAMES = ['app', 'gw-loja', 'bff-app', 'pedidos', 'pagamentos', 'PSP (por tentativa)'];
    var VAL = [5, 3, 2.8, 2.5, 2, 1];
    var fields = NAMES.map(function (nm, i) { return numField('Timeout do ' + nm, 0.1, 30, 0.1, VAL[i], 's'); });
    var tent = slider('Tentativas ao PSP', 1, 5, 1, 3, 'tentativas');
    var base = slider('Base do backoff', 50, 500, 50, 100, 'ms');
    var btns = [], S = { prazo: false };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var t = fields.map(function (f) { return Math.max(0.1, +f.input.value || 0.1); });
      var k = +tent.input.value, b = +base.input.value / 1000;
      var rows = [], total = 0, restante = t[4];
      for (var i = 0; i < k; i++) {
        var espera = i === 0 ? 0 : b * Math.pow(2, i - 1);
        var cap = t[5];
        if (S.prazo) {
          restante -= espera;
          cap = Math.min(t[5], restante);
          if (cap <= 0.05) { rows.push({ cells: [{ text: 'tentativa ' + (i + 1) }, { text: 'não faz' }, { text: 'sem prazo sobrando' }] }); break; }
          restante -= cap;
        }
        total += espera + cap;
        rows.push({ cells: [{ text: 'tentativa ' + (i + 1) }, { text: fmt(cap, 2) + ' s' }, { text: 'termina em ' + fmt(total, 2) + ' s' }] });
      }
      var warns = [];
      for (var j = 0; j < 5; j++) if (t[j] <= t[j + 1] + 1e-9) warns.push(NAMES[j] + ' (' + fmt(t[j], 1) + ' s) espera menos ou igual ao de dentro, o ' + NAMES[j + 1] + ' (' + fmt(t[j + 1], 1) + ' s)');
      var torfao = [];
      [[0, 'app'], [1, 'gw-loja'], [2, 'bff-app'], [3, 'pedidos'], [4, 'pagamentos']].forEach(function (p) { if (total > t[p[0]] + 1e-9) torfao.push(p[1] + ' (' + fmt(t[p[0]], 1) + ' s)'); });
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Soma das tentativas + backoff', fmt(total, 2) + ' s', torfao.length > 0),
        fact('Cadeia em ordem?', warns.length ? 'NÃO' : 'sim', warns.length > 0),
        fact('Desistem antes do fim', torfao.length ? String(torfao.length) + ' elo' + (torfao.length > 1 ? 's' : '') : 'nenhum', torfao.length > 0)
      ]));
      out.appendChild(table(['Tentativa ao PSP', 'Tempo concedido', 'Instante'], rows));
      if (warns.length) out.appendChild(verdict(true, 'Prazo fora de ordem.', warns[0] + '. O de fora desiste antes e o de dentro segue trabalhando para ninguém.'));
      if (torfao.length) out.appendChild(verdict(true, 'Trabalho órfão.', 'Com ' + fmt(total, 2) + ' s de tentativas, ' + torfao.join(', ') + ' desiste(m) e o PSP pode ter cobrado mesmo assim (a c-7731 do módulo 12).'));
      if (!warns.length && !torfao.length) out.appendChild(verdict(false, 'A cadeia fecha.', 'Cada elo de fora espera mais que o de dentro e as tentativas cabem no prazo.'));
      out.appendChild(note('Padrão da história: 5 · 3 · 2,8 · 2,5 · 2,0 · 1,0 s por tentativa, 3 tentativas e base de 100 ms: 3 × 1 s + 0,1 + 0,2 = 3,3 s, mais que os 3 s do gw-loja. Com "só tenta se sobrar prazo", a 2ª tentativa recebe 2,0 − 1,0 − 0,1 = 0,9 s.'));
    }
    function pick(i) { S.prazo = i === 1; press(btns, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, fields.map(function (f) { return f.wrap; })));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tent.wrap, base.wrap]));
    root.appendChild(chipRow('Política de prazo', ['Tenta mesmo sem prazo', 'Só tenta se sobrar prazo'], btns, pick));
    fields.forEach(function (f) { f.input.addEventListener('input', render); });
    [tent, base].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 7: tempestade de retry =============== */
  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function Heap() { this.a = []; }
  Heap.prototype.push = function (x) {
    var a = this.a, i = a.length; a.push(x);
    while (i > 0) { var p = (i - 1) >> 1; if (a[p][0] < x[0] || (a[p][0] === x[0] && a[p][1] <= x[1])) break; a[i] = a[p]; i = p; }
    a[i] = x;
  };
  Heap.prototype.pop = function () {
    var a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      var i = 0, n = a.length;
      for (;;) {
        var l = 2 * i + 1, r = l + 1, m = i, c = last;
        if (l < n && (a[l][0] < c[0] || (a[l][0] === c[0] && a[l][1] < c[1]))) { m = l; c = a[l]; }
        if (r < n && (a[r][0] < c[0] || (a[r][0] === c[0] && a[r][1] < c[1]))) { m = r; c = a[r]; }
        if (m === i) break;
        a[i] = a[m]; i = m;
      }
      a[i] = last;
    }
    return top;
  };
  /* estratégias: 0 fixo, 1 exponencial sem jitter, 2 full, 3 equal, 4 decorrelated */
  function herd(strat, n, down, capRate, deadline) {
    var base = 0.1, cap = 5, win = 0.1, quota = Math.round(capRate * win);
    var rnd = mulberry(7), hp = new Heap(), used = {}, peaks = {};
    var calls = 0, refUp = 0, done = 0, last = 0, i;
    for (i = 0; i < n; i++) hp.push([0, i, 0, base]);
    while (hp.a.length) {
      var e = hp.pop(), t = e[0], c = e[1], a = e[2], prev = e[3];
      if (t > deadline + 1e-9) continue;
      calls++;
      var w = Math.floor(t / win + 1e-9);
      peaks[w] = (peaks[w] || 0) + 1;
      var ok = false;
      if (t >= down - 1e-9) {
        var u = used[w] || 0;
        if (u < quota) { used[w] = u + 1; ok = true; } else refUp++;
      }
      if (ok) { done++; if (t > last) last = t; continue; }
      var ex = Math.min(cap, base * Math.pow(2, a)), s;
      if (strat === 0) s = base;
      else if (strat === 1) s = ex;
      else if (strat === 2) s = rnd() * ex;
      else if (strat === 3) s = ex / 2 + rnd() * ex / 2;
      else s = Math.min(cap, base + rnd() * (prev * 3 - base));
      hp.push([t + s, c, a + 1, s]);
    }
    var peak = 0, bars = [], maxW = Math.ceil(deadline / win);
    for (var k = 0; k < maxW; k++) { var v = peaks[k] || 0; bars.push(v); if (k * win >= down - 1e-9 && v > peak) peak = v; }
    return { calls: calls, peak: peak, refUp: refUp, done: done, last: last, bars: bars };
  }
  var HERD_MEDIDO = [
    { calls: 45500, peak: 1000, refUp: 24500, done: 1000, ult: 'último em 6,9 s' },
    { calls: 6980, peak: 1000, refUp: 1940, done: 40 },
    { calls: 7540, peak: 84, refUp: 687, done: 1000 },
    { calls: 7162, peak: 130, refUp: 1085, done: 993 },
    { calls: 7590, peak: 125, refUp: 1397, done: 999 }
  ];
  function wTempestade(root) {
    var NAMES = ['Intervalo fixo de 100 ms', 'Exponencial sem jitter', 'Exponencial + full jitter', 'Exponencial + equal jitter', 'Decorrelated jitter'];
    var btns = [], S = { s: 2 }, timer = null;
    var cli = slider('Clientes', 100, 5000, 100, 1000, 'clientes', function (v) { return fmt(v, 0); });
    var dur = slider('PSP fora por', 0, 10, 0.5, 2, '', function (v) { return fmt(v, 1) + ' s'; });
    var capa = slider('Capacidade do PSP ao voltar', 100, 500, 50, 200, '/s');
    var prazo = slider('Prazo de cada cliente', 2, 20, 1, 10, '', function (v) { return v + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var n = +cli.input.value, d = +dur.input.value, c = +capa.input.value, p = +prazo.input.value;
      var padrao = n === 1000 && d === 2 && c === 200 && p === 10;
      var r = herd(S.s, n, d, c, p);
      var m = padrao ? HERD_MEDIDO[S.s] : null;
      var calls = m ? m.calls : r.calls, peak = m ? m.peak : r.peak, ref = m ? m.refUp : r.refUp, done = m ? m.done : r.done;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chamadas ao PSP', fmt(calls, 0) + ' (' + fmt(calls / n, 1) + ' por cliente)', calls / n > 20),
        fact('Pico por janela de 100 ms (depois da volta)', fmt(peak, 0), peak >= n * 0.9),
        fact('Recusadas com o PSP de pé', fmt(ref, 0), ref > 20000),
        fact('Concluídos no prazo', fmt(done, 0) + ' de ' + fmt(n, 0) + ' (' + fmt(done / n * 100, 0) + '%)', done / n < 0.5)
      ]));
      var bars = r.bars, mx = 1;
      bars.forEach(function (v) { if (v > mx) mx = v; });
      var chart = el('div', { class: 'rs-bars', role: 'img', 'aria-label': 'Chamadas por janela de 100 ms, de 0 s a ' + p + ' s; maior janela com ' + fmt(mx, 0) + ' chamadas' });
      bars.forEach(function (v, k) {
        var b = el('i', { class: k * 0.1 < d - 1e-9 ? 'down' : '' });
        b.style.height = Math.max(2, v / mx * 100) + '%';
        chart.appendChild(b);
      });
      out.appendChild(chart);
      out.appendChild(el('p', { class: 'rs-axis' }, [el('span', { text: '0 s' }), el('span', { text: 'PSP volta em ' + fmt(d, 1) + ' s' }), el('span', { text: p + ' s' })]));
      var best = padrao ? [1, 2, 3, 4] : null;
      out.appendChild(verdict(S.s === 0 || S.s === 1,
        S.s === 0 ? 'O intervalo fixo fecha todo mundo, mas na força bruta.' : S.s === 1 ? 'O backoff sem jitter manda ondas sincronizadas.' : 'O jitter espalha as chamadas.',
        S.s === 0 ? 'Cada cliente chama a cada 100 ms: ' + fmt(calls / n, 1) + ' chamadas por cliente e o PSP recusa a maioria mesmo de pé.'
          : S.s === 1 ? 'Todos esperam o mesmo tempo e voltam juntos: o pico por janela é de ' + fmt(peak, 0) + ' e só ' + fmt(done / n * 100, 0) + '% concluem no prazo.'
          : 'A espera é sorteada, então os clientes saem de sincronia: o pico cai para ' + fmt(peak, 0) + ' por janela e quase todos concluem.'));
      out.appendChild(note(padrao
        ? 'Com os padrões da história (1.000 clientes, PSP fora por 2 s, depois 200/s, prazo de 10 s, base 100 ms, teto 5 s, semente 7) os números são os medidos em Python. Se mudar qualquer controle, o widget simula no navegador: o sorteio é outro e as linhas com jitter variam um pouco.'
        : 'Simulado no navegador (modelo simplificado: janelas de 100 ms, o PSP aceita capacidade ÷ 10 por janela). O gráfico mostra as chamadas por janela de 100 ms; em cinza, as feitas com o PSP fora.'));
    }
    function pick(i) { S.s = i; press(btns, i); render(); }
    function later() { clearTimeout(timer); timer = setTimeout(render, 150); }
    root.appendChild(chipRow('Estratégia de espera', NAMES, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cli.wrap, dur.wrap, capa.wrap, prazo.wrap]));
    [cli, dur, capa, prazo].forEach(function (s) { s.input.addEventListener('input', later); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== AULA 7: amplificação =============== */
  function wAmplificacao(root) {
    var cam = slider('Camadas que repetem', 1, 5, 1, 3, 'camadas');
    var tent = slider('Tentativas por camada', 1, 5, 1, 3, 'tentativas');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var l = +cam.input.value, a = +tent.input.value, N = Math.pow(a, l);
      var taxa = 30 * N, cap = 40, razao = taxa / cap, orc = 30 * 1.1;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Chamadas ao pagamentos por clique (N = tentativas^camadas)', fmt(N, 0), N > 3),
        fact('Taxa com 30 pedidos/s', fmt(taxa, 0) + '/s', taxa > cap),
        fact('Contra a capacidade de 40/s', fmt(r1(razao), 1) + '×', razao > 1),
        fact('Com orçamento de retry de 10%', fmt(orc, 0) + '/s', orc > cap)
      ]));
      var rows = [[1, 3], [3, 2], [3, 3]].map(function (p) {
        return { cls: p[0] === l && p[1] === a ? 'rs-cur' : '', cells: [{ text: p[0] + ' camada' + (p[0] > 1 ? 's' : '') + ' × ' + p[1] + ' tentativas' }, { text: fmt(Math.pow(p[1], p[0]), 0) + ' chamadas' }, { text: fmt(30 * Math.pow(p[1], p[0]), 0) + '/s' }] };
      });
      out.appendChild(table(['Caso', 'Por clique', 'A 30 pedidos/s'], rows));
      out.appendChild(verdict(taxa > cap,
        taxa > cap ? 'O pagamentos recebe ' + fmt(r1(razao), 1) + ' vezes o que aguenta.' : 'A taxa cabe nos 40/s.',
        taxa > cap
          ? 'Cada camada repete por conta própria e as tentativas se multiplicam. Só repetir na camada de fora (1 camada) e limitar com um orçamento de 10% leva a taxa a 33/s.'
          : 'Mesmo assim, o orçamento de 10% (33/s) e o prazo continuam valendo: a conta só cabe porque a falha ainda não aconteceu.'));
      out.appendChild(note('Os números do módulo 10: 3 camadas × 3 tentativas = 27 chamadas por clique; 30 × 27 = 810/s sobre um pagamentos de 2 réplicas de 20/s (40/s). O orçamento de 10% é do tipo do SRE book (60 retentativas por minuto por processo).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cam.wrap, tent.wrap]));
    [cam, tent].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 8: circuit breaker (simulação do brief) =============== */
  function breakerSim(o) {
    var rate = 30, dur = 100, failUntil = 90, slow = 8, fast = 0.18, pool = 50;
    var total = rate * dur, inflight = [], pending = [];
    var state = 'closed', openedAt = 0, win = [], probesSent = 0, probeRes = [];
    var calls = 0, ff = 0, rej = 0, peak = 0, durante = 0, depois = 0, closedAt = null, tl = [];
    var segs = [], segStart = 0, segState = 'closed';
    function seg(t, st) { if (st !== segState) { segs.push([segStart, t, segState]); segStart = t; segState = st; } }
    function flush(t) {
      pending.sort(function (a, b) { return a.t - b.t; });
      while (pending.length && pending[0].t < t) {
        var e = pending.shift();
        inflight.splice(inflight.indexOf(e.t), 1);
        if (e.probe) {
          probeRes.push(e.ok);
          if (probeRes.length === o.probes) {
            var f = probeRes.filter(function (x) { return !x; }).length / o.probes;
            if (f >= o.thr) { state = 'open'; openedAt = e.t; tl.push(['reabre', e.t]); seg(e.t, 'open'); }
            else { state = 'closed'; win = []; tl.push(['fecha', e.t]); closedAt = e.t; seg(e.t, 'closed'); }
            probeRes = []; probesSent = 0;
          }
        } else if (state === 'closed') {
          win.push(e.ok); if (win.length > o.win) win.shift();
          var fails = win.filter(function (x) { return !x; }).length;
          if (win.length >= o.min && fails / win.length >= o.thr) { state = 'open'; openedAt = e.t; tl.push(['abre', e.t]); seg(e.t, 'open'); }
        }
      }
    }
    for (var k = 0; k < total; k++) {
      var t = k / rate;
      flush(t);
      if (state === 'open' && t >= openedAt + o.open) { state = 'half'; probesSent = 0; probeRes = []; tl.push(['meio-aberto', t]); seg(t, 'half'); }
      var probe = false;
      if (state === 'open') { ff++; continue; }
      if (state === 'half') { if (probesSent >= o.probes) { ff++; continue; } probesSent++; probe = true; }
      if (inflight.length >= pool) { rej++; continue; }
      calls++;
      var lat = t < failUntil ? slow : fast, ok = lat <= o.timeout, end = t + Math.min(lat, o.timeout);
      inflight.push(end); if (inflight.length > peak) peak = inflight.length;
      pending.push({ t: end, ok: ok, probe: probe });
    }
    segs.push([segStart, dur, segState]);
    return { calls: calls, ff: ff, rej: rej, peak: peak, tl: tl, segs: segs, closedAt: closedAt };
  }
  function breakerOff(timeout) {
    var rate = 30, total = 3000, pool = 50, inflight = [], calls = 0, rej = 0, peak = 0;
    for (var k = 0; k < total; k++) {
      var t = k / rate;
      inflight = inflight.filter(function (e) { return e >= t; });
      if (inflight.length >= pool) { rej++; continue; }
      calls++;
      var lat = t < 90 ? 8 : 0.18;
      inflight.push(t + Math.min(lat, timeout)); if (inflight.length > peak) peak = inflight.length;
    }
    return { calls: calls, rej: rej, peak: peak };
  }
  function wBreaker(root) {
    var jan = slider('Janela de chamadas', 5, 50, 1, 20, 'chamadas');
    var min = slider('Mínimo de chamadas', 1, 50, 1, 10, 'chamadas');
    var thr = slider('Limiar de falhas', 10, 100, 5, 50, '%');
    var aberto = slider('Tempo aberto', 5, 60, 5, 30, 's');
    var sondas = slider('Sondas do meio-aberto', 1, 10, 1, 5, 'sondas');
    var tmo = slider('Timeout', 0.5, 8, 0.5, 1, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    var NM = { closed: 'fechado', open: 'aberto', half: 'meio-aberto' };
    function render() {
      var o = { win: +jan.input.value, min: Math.min(+min.input.value, +jan.input.value), thr: +thr.input.value / 100, open: +aberto.input.value, probes: +sondas.input.value, timeout: +tmo.input.value };
      var s = breakerSim(o), off = breakerOff(o.timeout);
      var abre = null; s.tl.forEach(function (e) { if (abre == null && e[0] === 'abre') abre = e[1]; });
      clear(out);
      var bar = el('div', { class: 'rs-tl', role: 'img', 'aria-label': 'Linha do tempo do breaker em 100 s' });
      s.segs.forEach(function (g) {
        var sp = el('i', { class: g[2], title: NM[g[2]] + ' de ' + fmt(g[0], 2) + ' s a ' + fmt(g[1], 2) + ' s' });
        sp.style.width = ((g[1] - g[0]) / 100 * 100) + '%';
        bar.appendChild(sp);
      });
      var psp = el('i', { class: 'psp' }); psp.style.left = '90%'; bar.appendChild(psp);
      out.appendChild(bar);
      out.appendChild(el('p', { class: 'rs-axis' }, [el('span', { text: '0 s' }), el('span', { text: 'PSP-A volta em 90 s' }), el('span', { text: '100 s' })]));
      out.appendChild(el('div', { class: 'rs-legend' }, [el('span', { class: 'closed', text: 'fechado' }), el('span', { class: 'open', text: 'aberto' }), el('span', { class: 'half', text: 'meio-aberto' })]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Abre em', abre == null ? 'nunca' : fmt(abre, 2) + ' s', abre == null),
        fact('Fecha em', s.closedAt == null ? 'não fecha' : fmt(s.closedAt, 2) + ' s'),
        fact('Chamadas ao PSP-A (sem breaker: 3.000)', fmt(s.calls, 0)),
        fact('Falhas rápidas (fast fail)', fmt(s.ff, 0)),
        fact('Recusadas pelo pool', fmt(s.rej, 0), s.rej > 0),
        fact('Pico em voo (pool de 50)', fmt(s.peak, 0), s.peak >= 50)
      ]));
      var rows = [['Sem breaker, timeout ' + fmt(o.timeout, 1) + ' s', off], ['Com breaker', s]].map(function (p) {
        return { cls: p[0] === 'Com breaker' ? 'rs-cur' : '', cells: [{ text: p[0] }, { text: fmt(p[1].calls, 0) }, { text: fmt(p[1].rej, 0), cls: p[1].rej ? 'rs-bad' : '' }, { text: fmt(p[1].peak, 0) }] };
      });
      out.appendChild(table(['Cenário (100 s a 30/s)', 'Chamadas ao PSP', 'Recusadas pelo pool', 'Pico em voo'], rows));
      var padrao = o.win === 20 && o.min === 10 && o.thr === 0.5 && o.open === 30 && o.probes === 5 && o.timeout === 1;
      out.appendChild(verdict(abre == null || s.rej > 0,
        abre == null ? 'O breaker nunca abriu.' : s.rej > 0 ? 'O pool ainda recusou ' + fmt(s.rej, 0) + ' chamadas.' : 'O breaker protegeu o pool.',
        abre == null ? 'Com esta janela e este mínimo não houve chamadas suficientes falhando.'
          : 'Ele abriu em ' + fmt(abre, 2) + ' s: até lá, cada chamada ficou presa pelo timeout (' + fmt(o.timeout, 1) + ' s). Quanto maior o timeout, mais tarde o breaker abre.'));
      out.appendChild(note(padrao
        ? 'Padrões da história: abre em 1,3 s, meio-aberto em 31,3 s, reabre em 32,43 s, de novo em 63,6 s, meio-aberto em 93,6 s e fecha em 93,91 s; 237 chamadas ao PSP em vez de 3.000 (54 até fechar, 183 depois) e 2.763 falhas rápidas. Chamada acima do timeout conta como falha.'
        : 'Mesma simulação do módulo (30 req/s por 100 s, PSP-A em 8 s até 90 s, pool de 50), com os seus controles. O estado volta a "fechado" só quando as sondas passam.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [jan.wrap, min.wrap, thr.wrap, aberto.wrap, sondas.wrap, tmo.wrap]));
    [jan, min, thr, aberto, sondas, tmo].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 9: fallback =============== */
  function wFallback(root) {
    var a = numField('Parceiro A, por consulta', 0, 5, 0.01, 0.03, 'R$');
    var b = numField('Parceiro B, por consulta', 0, 5, 0.01, 0.10, 'R$');
    var qps = slider('Consultas por segundo', 1, 100, 1, 30, '/s');
    var min = slider('Duração', 1, 60, 1, 10, 'min');
    var pro = slider('Tráfego proativo no fallback', 0, 10, 0.5, 1, '%');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function brl(v) { return 'R$ ' + fmt(v, 2); }
    function render() {
      var pa = +a.input.value || 0, pb = +b.input.value || 0, r = +qps.input.value, m = +min.input.value, p = +pro.input.value / 100;
      var q = r * 60 * m, ca = q * pa, cb = q * pb, ex = cb - ca;
      var pr = r * p;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Consultas na janela', fmt(q, 0)),
        fact('Tudo no parceiro A', brl(ca)),
        fact('Tudo no parceiro B (fallback)', brl(cb)),
        fact('Custo extra do fallback', '+' + brl(ex), ex > 0)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Proativo: ' + fmt(p * 100, 1) + '% do tráfego', fmt(pr, 2) + '/s'),
        fact('Por minuto', fmt(pr * 60, 1) + ' chamadas'),
        fact('Custo do proativo na janela', brl(q * p * pb))
      ]));
      out.appendChild(verdict(false, 'O fallback tem preço.',
        'O parceiro mais caro custa +' + brl(ex) + ' em ' + m + ' min. Mandar ' + fmt(p * 100, 1) + '% do tráfego a ele o tempo todo (' + fmt(pr * 60, 1) + ' chamadas por minuto) custa pouco e mostra, antes do incidente, se ele ainda funciona.'));
      out.appendChild(note('Padrão da história: A a R$ 0,03 e B a R$ 0,10 por consulta (os números do artigo), 30/s por 10 min = 18.000 consultas: R$ 540 contra R$ 1.800, +R$ 1.260. O proativo de 1% manda 0,3/s ao PSP-B, 18 por minuto.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [a.wrap, b.wrap, qps.wrap, min.wrap, pro.wrap]));
    [a, b, qps, min, pro].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 10: degradação =============== */
  function wDegradacao(root) {
    var dem = slider('Demanda do catálogo', 500, 2000, 50, 1300, 'req/s', function (v) { return fmt(v, 0); });
    var rep = slider('Réplicas', 6, 14, 1, 10, 'réplicas');
    var f0 = numField('CPU por página, nível 0', 1, 30, 0.5, 10, 'ms');
    var f1 = numField('CPU por página, nível 1 (sem recomendações)', 1, 30, 0.5, 7.5, 'ms');
    var f2 = numField('CPU por página, nível 2 (+ busca simples, sem avaliações)', 1, 30, 0.5, 6, 'ms');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    var NM = ['0 · normal', '1 · sem recomendações', '2 · + busca simples e sem avaliações', '3 · só a página estática da CDN'];
    function render() {
      var d = +dem.input.value, r = +rep.input.value;
      var ms = [+f0.input.value || 10, +f1.input.value || 7.5, +f2.input.value || 6];
      var cap = ms.map(function (m) { return r * (1000 / m); });
      var nivel = 3;
      for (var i = 0; i < 3; i++) if (cap[i] + 1e-9 >= d) { nivel = i; break; }
      clear(out);
      var rows = NM.map(function (nm, i) {
        var c = i < 3 ? cap[i] : null;
        return { cls: i === nivel ? 'rs-cur' : '', cells: [{ text: nm }, { text: i < 3 ? fmt(ms[i], 1) + ' ms' : 'CDN' }, { text: i < 3 ? fmt(c, 0) + ' req/s' : 'a CDN segura' }, { text: i < 3 ? (c + 1e-9 >= d ? 'segura' : 'não segura') : 'segura', cls: i < 3 && c + 1e-9 < d ? 'rs-bad' : '' }] };
      });
      out.appendChild(table(['Nível', 'CPU por página', 'Capacidade', 'Segura ' + fmt(d, 0) + '?'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Nível mínimo que segura', String(nivel), nivel > 0),
        fact('Demanda', fmt(d, 0) + ' req/s'),
        fact('Capacidade no nível 0', fmt(cap[0], 0) + ' req/s', cap[0] < d)
      ]));
      out.appendChild(verdict(nivel > 1,
        nivel === 0 ? 'Não precisa degradar.' : nivel === 3 ? 'Só a página estática da CDN segura.' : 'O nível ' + nivel + ' segura sem cair.',
        nivel === 0 ? 'A frota normal dá conta da demanda.'
          : nivel === 3 ? 'Nem o nível 2 chega lá: tire a loja do servidor e sirva a vitrine da CDN (módulo 5) enquanto a frota cresce.'
          : 'Desligar de propósito o que não é essencial compra o tempo que o HPA leva (minutos) para ir de 10 a 14 réplicas (1.400 req/s). Quando o pico passar, volte um nível de cada vez.'));
      out.appendChild(note('Padrão da história: 1.300 req/s às 20:20 (uma rajada de poucos segundos, da newsletter) contra 1.000. Nível 0: 10 ms = 100 req/s por réplica = 1.000; nível 1: 7,5 ms = 133 = 1.333; nível 2: 6 ms = 167 = 1.667. O pico sustentado do módulo 14 é 640 (projetado 950).'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [dem.wrap, rep.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [f0.wrap, f1.wrap, f2.wrap]));
    [dem, rep, f0, f1, f2].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 11: fila e backpressure =============== */
  function wFila(root) {
    var POL = ['Fila ilimitada', 'Bloquear o produtor', 'Recusar com 429', 'Descartar por prioridade'];
    var btns = [], S = { p: 2 };
    var cheg = slider('Chegada', 20, 300, 5, 120, 'eventos/s');
    var capa = slider('Capacidade do projetor', 20, 300, 5, 100, 'eventos/s');
    var lim = slider('Limite da fila', 500, 20000, 500, 5000, 'eventos', function (v) { return fmt(v, 0); });
    var crise = slider('Duração da crise', 1, 30, 1, 10, 'min');
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var a = +cheg.input.value, c = +capa.input.value, L = +lim.input.value, T = +crise.input.value * 60;
      var def = a - c;
      clear(out);
      if (def <= 0) {
        out.appendChild(verdict(false, 'Sem sobrecarga.', 'A capacidade (' + fmt(c, 0) + '/s) cobre a chegada (' + fmt(a, 0) + '/s): a fila fica vazia. Suba a chegada acima da capacidade para ver o déficit.'));
        return;
      }
      var enche = L / def, back = def * T, atrasoIl = back / c, dreno = back / (c - 20);
      var items = [];
      if (S.p === 0) {
        items = [
          fact('Atraso depois de ' + fmt(T / 60, 0) + ' min', fmt(atrasoIl, 0) + ' s e crescendo', true),
          fact('Eventos na fila', fmt(back, 0), true),
          fact('Dreno com chegada de 20/s', fmt(dreno, 0) + ' s')
        ];
      } else {
        var cheia = enche < T;
        var atrasoMax = L / c;
        items = [
          fact('A fila de ' + fmt(L, 0) + ' enche em', fmt(enche, 0) + ' s (' + fmt(Math.floor(enche / 60), 0) + ' min ' + fmt(Math.round(enche % 60), 0) + ' s)', false),
          fact('Atraso máximo (fila cheia)', fmt(atrasoMax, 0) + ' s'),
          S.p === 1 ? fact('Quem paga', 'o produtor espera (a chegada cai a ' + fmt(c, 0) + '/s)') : S.p === 2 ? fact('Recusados com 429 + Retry-After', cheia ? fmt(def, 0) + '/s' : 'ainda nenhum', cheia) : fact('Descartados (SHEDDABLE primeiro)', cheia ? fmt(def, 0) + '/s' : 'ainda nenhum', cheia),
          fact('Dreno ao fim da crise', fmt(Math.min(L, back) / (c - 20), 0) + ' s')
        ];
      }
      out.appendChild(el('div', { class: 'sr-facts' }, items));
      var bad = S.p === 0;
      var txt = [
        'A fila "em memória" sem limite esconde a sobrecarga: o atraso cresce sem avisar ninguém, a memória enche e o processo cai com a fila dentro.',
        'O produtor percebe a lentidão e desacelera sozinho. Funciona quando ele pode esperar; um cliente do app não pode.',
        'O limite aparece: o projetor responde 429 com Retry-After e quem manda sabe que precisa esperar. A fila cheia dá, no máximo, ' + fmt(L / c, 0) + ' s de atraso.',
        'Com a fila no limite, descarta primeiro o que é SHEDDABLE (marketing, relatório) e mantém os eventos de pedido. É recusar cedo o que menos importa.'
      ][S.p];
      out.appendChild(verdict(bad, POL[S.p] + '.', txt));
      out.appendChild(note('Padrão da história (o projetor meus-pedidos do módulo 18): chegada de 120/s contra 100/s, déficit de 20/s; a fila de 5.000 enche em 250 s (4 min 10 s); ilimitada, em 10 min são 12.000 eventos = 120 s de atraso; drenar leva 12.000 ÷ (100 − 20) = 150 s depois da crise.'));
    }
    function pick(i) { S.p = i; press(btns, i); render(); }
    root.appendChild(chipRow('Política da fila', POL, btns, pick));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cheg.wrap, capa.wrap, lim.wrap, crise.wrap]));
    [cheg, capa, lim, crise].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    pick(2);
  }

  /* =============== AULA 13: bulkhead =============== */
  function wBulkhead(root) {
    var total = slider('Pool total do pagamentos', 20, 300, 10, 100, 'conexões');
    var psp = slider('Partição do PSP', 10, 200, 5, 50, 'conexões');
    var frete = slider('Partição da cotação de frete', 5, 100, 5, 30, 'conexões');
    var lat = slider('Latência do PSP-A', 0.1, 10, 0.1, 8, '', function (v) { return fmt(v, 1) + ' s'; });
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var T = +total.input.value, p = +psp.input.value, f = +frete.input.value, w = +lat.input.value;
      var email = T - p - f, L = 30 * w;
      clear(out);
      if (email < 1) {
        out.appendChild(verdict(true, 'As partições passam do pool.', 'PSP (' + p + ') + frete (' + f + ') deixam ' + email + ' para o e-mail: baixe uma partição ou suba o pool total.'));
        return;
      }
      var satC = L > T + 1e-9, satB = L > p + 1e-9;
      var tC = T / 30, tB = p / 30;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('PSP-A em voo (30/s × ' + fmt(w, 1) + ' s)', fmt(L, 1), satB),
        fact('Pool único (' + T + '): esgota em', satC ? fmt(tC, 2) + ' s' : 'não esgota', satC),
        fact('Com bulkheads: o do PSP (' + p + ') esgota em', satB ? fmt(tB, 2) + ' s' : 'não esgota', satB)
      ]));
      var rows = [
        { cells: [{ text: 'PSP-A' }, { text: satC ? 'fora' : 'segue', cls: satC ? 'rs-bad' : '' }, { text: satB ? 'fora (' + p + ' conexões)' : 'segue', cls: satB ? 'rs-bad' : '' }] },
        { cells: [{ text: 'Cotação de frete' }, { text: satC ? 'fora também' : 'segue', cls: satC ? 'rs-bad' : '' }, { text: 'segue (' + f + ' conexões)' }] },
        { cells: [{ text: 'E-mail' }, { text: satC ? 'fora também' : 'segue', cls: satC ? 'rs-bad' : '' }, { text: 'segue (' + email + ' conexões)' }] }
      ];
      out.appendChild(table(['Dependência', 'Pool compartilhado', 'Com bulkheads ' + p + '/' + f + '/' + email], rows));
      out.appendChild(verdict(satC,
        satC ? 'No pool único, o PSP lento leva tudo junto.' : 'Com este PSP, nada esgota.',
        satC ? 'As ' + T + ' conexões ficam presas ao PSP em ' + fmt(tC, 2) + ' s, e a cotação de frete e o e-mail, que são rápidos, também não passam. Com paredes, só o PSP fica de fora e os outros dois seguem.'
          : 'A latência de ' + fmt(w, 1) + ' s mantém ' + fmt(L, 1) + ' em voo, abaixo do pool. Suba a latência para 8 s e compare.'));
      out.appendChild(note('Padrão da história: pool compartilhado de 100 enche em 100 ÷ 30 = 3,33 s; bulkheads de 50 (PSP), 30 (frete) e 20 (e-mail) fazem só o do PSP esgotar, em 50 ÷ 30 = 1,67 s. Bulkhead pequeno demais recusa tráfego legítimo: 30 conexões para um pico de 40 em voo.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [total.wrap, psp.wrap, frete.wrap, lat.wrap]));
    [total, psp, frete, lat].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(out);
    render();
  }

  /* =============== AULA 3: blast radius =============== */
  function wBlast(root) {
    var NS = [3, 5, 10, 100, 1000];
    var nB = [], dB = [], S = { n: 0, d: 0 };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var n = NS[S.n], mk = S.d === 1;
      var uni = 1 / n;
      var comMk = mk ? 0.4 + 0.6 / n : uni, resto = mk ? 0.6 / n : uni;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Clientes afetados (1 de ' + n + ')', fmt(uni * 100, 1) + '%'),
        fact(mk ? 'Linhas no shard-2 (com o mkt-01)' : 'Linhas num compartimento', fmt(comMk * 100, 1) + '%', mk),
        fact(mk ? 'Linhas em cada um dos outros' : 'Linhas afetadas', fmt(resto * 100, 1) + '%')
      ]));
      var draw = Math.min(n, 12);
      var chart = el('div', { class: 'rs-shards', role: 'img', 'aria-label': 'Fatia de linhas de cada compartimento' });
      for (var i = 0; i < draw; i++) {
        var v = i === draw - 1 ? comMk : resto;
        var col = el('div', { class: 'rs-shard' + (i === draw - 1 && mk ? ' hot' : '') });
        var bar = el('i'); bar.style.height = Math.max(3, v * 100 / (mk ? 60 : Math.max(uni * 100, 1)) * (mk ? 1 : 0.6)) + '%';
        col.appendChild(bar);
        col.appendChild(el('span', { text: i === draw - 1 && mk ? 'shard-2' : 's' + i }));
        chart.appendChild(col);
      }
      out.appendChild(chart);
      out.appendChild(verdict(mk,
        mk ? 'Um shard fora apaga ' + fmt(comMk * 100, 0) + '% das linhas, para ' + fmt(uni * 100, 1) + '% dos clientes.' : 'Com carga uniforme, 1 de ' + n + ' dá ' + fmt(uni * 100, 1) + '%.',
        mk ? 'O mkt-01 (um cliente de marketplace) tem 40% das linhas e mora no shard-2. A conta de 1/N supõe carga igual; aqui ela não vale.'
          : 'A conta 1/N é o melhor caso: serve quando todos os compartimentos pesam o mesmo. Teste a distribuição do mkt-01.'));
      out.appendChild(note('Padrão da história (módulo 16): 3 shards e o mkt-01 a 40% das linhas: shard-2 = 0,4 + 0,6 ÷ 3 = 60% das linhas; shard-0 e shard-1 = 20% cada. Um shard fora afeta 1/3 dos clientes (33,3%) mas 20% ou 60% das linhas. 1/N: 10 → 10%, 100 → 1%, 1.000 → 0,1%.'));
    }
    function pickN(i) { S.n = i; press(nB, i); render(); }
    function pickD(i) { S.d = i; press(dB, i); render(); }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Compartimentos (shards, réplicas, células)' }));
    root.appendChild(chipRow('Compartimentos', NS.map(String), nB, pickN));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Distribuição da carga' }));
    root.appendChild(chipRow('Distribuição da carga', ['Uniforme', 'mkt-01 a 40% das linhas'], dB, pickD));
    root.appendChild(out);
    pickN(0); pickD(0);
  }

  /* =============== AULA 5: chave de idempotência =============== */
  function wIdem(root) {
    var KEY = '3f9a2c7e-5b1d-4e8a-9c3f-7a2b4d6e8f10';
    var n = slider('Vezes que o app envia o POST', 1, 5, 1, 2, 'vezes');
    var kB = [], cB = [], S = { key: 1, diff: 0 };
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });
    function render() {
      var k = +n.input.value, comChave = S.key === 1, diff = S.diff === 1;
      var criados = comChave ? 1 : k;
      clear(out);
      var rows = [];
      for (var i = 1; i <= k; i++) {
        var st, extra;
        if (!comChave) { st = '201'; extra = i === 1 ? 'pedido 1058' : 'pedido duplicado (hipotético)'; }
        else if (i === 1) { st = '201'; extra = 'executa · INSERT 0 1'; }
        else if (diff) { st = '422'; extra = 'corpo diferente · INSERT 0 0'; }
        else { st = '201'; extra = 'resposta guardada (pedido 1058) · INSERT 0 0'; }
        rows.push({ cls: st === '422' ? 'rs-badrow' : '', cells: [{ text: 'envio ' + i }, { text: st, cls: st === '422' ? 'rs-bad' : '' }, { text: extra }] });
      }
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Pedidos criados', String(criados), criados > 1),
        fact('Cobranças ao PSP', String(criados), criados > 1),
        fact('Cabeçalho extra', comChave ? '+57 B' : 'nenhum')
      ]));
      out.appendChild(table(['Envio', 'Status', 'O que o servidor fez'], rows));
      if (comChave) {
        out.appendChild(el('pre', { class: 'rs-json' }, [el('code', { text:
          'Idempotency-Key: "' + KEY + '"\n\n' +
          'chave         | hash_corpo | estado    | resposta\n' +
          '3f9a2c7e-…    | ' + (diff && k > 1 ? 'não bate   ' : 'b7e1…      ') + '| concluido | {"status":201,"pedido_id":1058}' }) ]));
      }
      out.appendChild(verdict(!comChave && k > 1,
        !comChave ? (k > 1 ? 'Sem chave, cada envio é uma intenção nova.' : 'Um envio só: nada a duplicar.') : diff && k > 1 ? 'A chave bate, o corpo não: 422.' : 'A chave garante um só efeito.',
        !comChave ? (k > 1 ? 'O app do Caio perdeu a resposta e repetiu: nascem ' + k + ' pedidos e ' + k + ' cobranças. É o fio 4 do módulo 12.' : 'Aumente os envios para ver o que a repetição faz sem a chave.')
          : diff && k > 1 ? 'A mesma chave com outro corpo é erro do cliente, não repetição: o servidor compara o hash do corpo e recusa com 422 (o rascunho do IETF).'
          : 'A repetição acha a chave na tabela idempotencia, o INSERT … ON CONFLICT DO NOTHING devolve 0 linhas e a resposta guardada volta: o mesmo 1058, não um 1059.'));
      out.appendChild(note('Dado real (PostgreSQL 14.24): a 1ª chegada devolveu INSERT 0 1 e gravou {"status":201,"pedido_id":1058}; a repetição devolveu INSERT 0 0 e a resposta guardada (mesmo_corpo = t); com corpo diferente, mesmo_corpo = f. Se a primeira ainda processa, o INSERT concorrente espera o commit (índice único) e devolve 0 linhas.'));
    }
    function pickK(i) { S.key = i; press(kB, i); render(); }
    function pickC(i) { S.diff = i; press(cB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [n.wrap]));
    root.appendChild(chipRow('Chave', ['Sem Idempotency-Key', 'Com Idempotency-Key'], kB, pickK));
    root.appendChild(chipRow('Corpo da repetição', ['Corpo igual', 'Corpo diferente'], cB, pickC));
    n.input.addEventListener('input', render);
    root.appendChild(out);
    pickK(1); pickC(0);
  }

  var REG = {
    disponibilidade: wDisponibilidade, little: wLittle, prazos: wPrazos, tempestade: wTempestade, amplificacao: wAmplificacao,
    breaker: wBreaker, fallback: wFallback, degradacao: wDegradacao, fila: wFila, bulkhead: wBulkhead, blast: wBlast, idem: wIdem
  };
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
