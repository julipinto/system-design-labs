/* SDLabs · Capacity Planning: widgets em JS puro
   (fila M/M/1 e variabilidade, Little e pool, joelho, mix e rajada, perfis, projeção, cadeia e custo).
   Usam os números do brief: pagamentos S = 50 ms (μ = 20/s por pod), catálogo R(ρ) = 10 ms + 10 ms ÷ (1 − ρ),
   série 300 · 410 · 520 · 640, perfis diário/semanal/sazonal, cadeia 30 · 20 · 500 · 150 por unidade, plano de 2027 (41 vCPU).
   As contas foram refeitas em Python em 20/10/2026 e batem com o brief. */
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
    if (!isFinite(ms)) return '∞';
    if (ms >= 10000) return fmt(ms, 0) + ' ms';
    return fmt(ms, ms < 100 ? 1 : 0) + ' ms';
  }
  function fmtH(s) { return s >= 3600 ? fmt(s / 3600, 1) + ' h' : s >= 60 ? fmt(s / 60, 1) + ' min' : fmt(s, 0) + ' s'; }

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
    var id = 'cp-sl-' + (++uid);
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
    var id = 'cp-nf-' + (++uid);
    var inp = el('input', { type: 'number', id: id, min: String(min), max: String(max), step: String(step), value: String(value), inputmode: 'decimal', class: 'cp-num' });
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, el('output', { text: unit || '' })]), inp]) };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' cp-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function table(head, rows) {
    var tb = el('tbody');
    rows.forEach(function (r) {
      tb.appendChild(el('tr', { class: r.cls || '' }, r.cells.map(function (c, i) {
        return i === 0 ? el('th', { scope: 'row', text: c.text }) : el('td', { class: c.cls || '', text: c.text });
      })));
    });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table cp-table' }, [
      el('thead', null, [el('tr', null, head.map(function (h) { return el('th', { scope: 'col', text: h }); }))]), tb])]);
  }
  function verdict(bad, head, say) {
    return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]);
  }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function sub(t) { return el('p', { class: 'sr-sub', text: t }); }

  var LN20 = Math.log(20);
  function zone(rho) {
    if (rho >= 1) return { name: 'instável', bad: true };
    if (rho >= 0.95) return { name: 'máximo (95% ou mais)', bad: true };
    if (rho > 0.85) return { name: 'acima do joelho', bad: true };
    if (rho >= 0.8) return { name: 'joelho (80–85%)', bad: true };
    if (rho > 0.7) return { name: 'atenção (70–80%)', bad: false };
    return { name: 'saudável (até 70%)', bad: false };
  }
  /* tempo de resposta de uma fila M/G/1 (P–K); fixo = espera fora da CPU (catálogo: 10 ms) */
  function respMs(S, rho, cv, fixo) { return fixo + S + rho / (1 - rho) * (1 + cv * cv) / 2 * S; }

  /* =============== AULA 2: fila =============== */
  function wFila(root) {
    var CVS = [0, 0.5, 1, 2], CVL = ['CV 0 (constante)', 'CV 0,5', 'CV 1 (exponencial)', 'CV 2 (leves e pesados)'];
    var S = { cv: 2, fixo: 0 };
    var sS = slider('Tempo de serviço', 10, 200, 5, 50, 'ms');
    var sC = slider('Servidores (pods)', 1, 20, 1, 2, 'pods');
    var sL = slider('Chegada total (λ)', 1, 700, 1, 30, 'req/s');
    var cvB = [], preB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var s = +sS.input.value, c = +sC.input.value, lam = +sL.input.value, cv = CVS[S.cv];
      var mu = 1000 / s, lp = lam / c, rho = lp / mu, z = zone(rho);
      clear(out);
      if (rho >= 1) {
        out.appendChild(el('div', { class: 'sr-facts' }, [
          fact('Utilização (ρ)', fmt(rho * 100, 1) + '%', true), fact('λ por pod', fmt(lp, 1) + '/s', true), fact('μ por pod', fmt(mu, 1) + '/s')
        ]));
        out.appendChild(verdict(true, 'A fila não para de crescer.', 'A chegada por pod (' + fmt(lp, 1) + '/s) passou do que o pod atende (' + fmt(mu, 1) + '/s): a espera tende a infinito. Some pods ou baixe λ.'));
        return;
      }
      var W = respMs(s, rho, cv, S.fixo), L = lp * W / 1000;
      var p95ok = cv === 1 && S.fixo === 0;
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Utilização (ρ)', fmt(rho * 100, 1) + '%', z.bad),
        fact('λ por pod · μ por pod', fmt(lp, 1) + '/s · ' + fmt(mu, 1) + '/s'),
        fact('Tempo de resposta (W)', fmtMs(W), z.bad),
        fact('Em voo por pod (L)', fmt(L, 2)),
        fact('p95 (W × ln 20)', p95ok ? fmtMs(W * LN20) : '— (só no M/M/1)'),
        fact('W ÷ S', fmt((W - S.fixo) / s, 1) + '×')
      ]));
      var rows = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99].map(function (r) {
        var w = respMs(s, r, cv, S.fixo);
        return { cls: Math.abs(r - rho) < 0.0125 ? 'cp-cur' : '', cells: [
          { text: fmt(r * 100, 0) + '%' }, { text: fmt(mu * r, 1) + '/s' }, { text: fmtMs(w) },
          { text: fmt(mu * r * w / 1000, 1) }, { text: p95ok ? fmtMs(w * LN20) : '—' }] };
      });
      out.appendChild(table(['ρ', 'λ por pod', 'W', 'L', 'p95'], rows));
      out.appendChild(verdict(z.bad, 'Zona: ' + z.name + '.',
        cv === 2 && rho >= 0.79 && rho <= 0.81 && s === 50
          ? 'Com CV 2 a 80% o pagamentos responde em 550 ms, 3,7× o de CV 0 (150 ms). O painel olha "CPU 80%" e a utilização parece saudável.'
          : 'Mesma utilização, outra espera: troque o CV e compare. A 80% com S = 50 ms: 150 · 175 · 250 · 550 ms.'));
      out.appendChild(note(S.fixo
        ? 'Catálogo: R(ρ) = 10 ms de espera fora da CPU + 10 ms ÷ (1 − ρ). Com 640 req/s em 10 réplicas (64%): 37,8 ms.'
        : 'M/M/1 e Pollaczek–Khinchine: W = S + ρ ÷ (1 − ρ) × (1 + CV²) ÷ 2 × S. O p95 usa a exponencial (W × ln 20). Pods atrás de round robin: o M/M/1 sobra folga.'));
    }
    function pickCv(i) { S.cv = i; press(cvB, i); render(); }
    function preset(i) {
      press(preB, i);
      if (i === 0) { sS.set(50); sC.set(2); sL.set(30); S.fixo = 0; pickCv(2); }
      else { sS.set(10); sC.set(10); sL.set(640); S.fixo = 10; pickCv(2); }
    }
    root.appendChild(chipRow('Presets', ['pagamentos: 30 pedidos/s em 2 pods', 'catálogo: 640 req/s em 10 réplicas'], preB, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [sS.wrap, sC.wrap, sL.wrap]));
    [sS, sC, sL].forEach(function (x) { x.input.addEventListener('input', function () { if (+sS.input.value !== 10 && S.fixo) S.fixo = 0; render(); }); });
    root.appendChild(sub('Variabilidade do serviço'));
    root.appendChild(chipRow('Variabilidade', CVL, cvB, pickCv));
    root.appendChild(out);
    preset(0); pickCv(2);
  }

  /* =============== AULA 3: Little e pool =============== */
  function wLittle(root) {
    var lam = slider('Chegada (λ)', 5, 1000, 5, 200, 'req/s');
    var w = slider('Tempo de resposta (W)', 10, 1000, 10, 180, 'ms');
    var la = slider('L(alvo)', 1, 500, 1, 150, 'em voo');
    var fo = slider('Folga do pool', 1, 8, 0.5, 4, '×');
    var po = slider('Pool atual', 10, 300, 10, 50, 'conexões');
    var preB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var l = +lam.input.value, ms = +w.input.value, L = l * ms / 1000, tgt = +la.input.value, pool = +po.input.value, f = +fo.input.value;
      var wt = tgt / l * 1000, cap1 = tgt / (ms / 1000), cap2 = tgt / (ms / 2000), need = Math.ceil(L * f);
      var sat = L > pool;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Em voo (L = λ × W)', fmt(L, 1), L > tgt),
        fact('W(alvo) = L(alvo) ÷ λ', fmt(wt, 0) + ' ms', ms > wt),
        fact('Máximo com W atual', fmt(cap1, 0) + ' req/s'),
        fact('Máximo com W pela metade', fmt(cap2, 0) + ' req/s (+' + fmt((cap2 / cap1 - 1) * 100, 0) + '%)')
      ]));
      out.appendChild(sub('O pool de conexões'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Pool recomendado (L × folga)', fmt(need, 0) + ' conexões'),
        fact('Ocupação do pool atual', fmt(L / pool * 100, 0) + '%', sat),
        fact('Timeout crítico (pool ÷ λ)', fmt(pool / l, 2) + ' s', pool / l < 0.7)
      ]));
      out.appendChild(verdict(sat, sat ? 'O pool satura.' : 'O pool aguenta.',
        sat ? L > 0 ? 'Há ' + fmt(L, 0) + ' em voo para ' + fmt(pool, 0) + ' conexões: o excesso espera. A CPU pode estar a 20% e o serviço parado; só a concorrência (L) mostra.' : '' :
          'Com ' + fmt(L, 0) + ' em voo de ' + fmt(pool, 0) + ', o pool tem folga. Se o W subir para ' + fmt(pool / l * 1000, 0) + ' ms, ele satura.'));
      out.appendChild(note('Reduzir W de 300 para 150 ms não dá "50% mais": a mesma concorrência sustenta o dobro (500 → 1.000 req/s, +100%). Exemplos do artigo: 1.500 × 0,050 = 75; × 0,085 = 127,5.'));
    }
    function preset(i) {
      press(preB, i);
      if (i === 0) { lam.set(500); w.set(300); la.set(150); }
      else if (i === 1) { lam.set(200); w.set(180); po.set(50); }
      else { lam.set(200); w.set(500); po.set(50); }
      render();
    }
    root.appendChild(chipRow('Presets', ['API REST (500 req/s · 300 ms)', 'PSP normal (200/s · 0,18 s)', 'PSP lento (200/s · 0,5 s)'], preB, preset));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [lam.wrap, w.wrap, la.wrap, fo.wrap, po.wrap]));
    [lam, w, la, fo, po].forEach(function (x) { x.input.addEventListener('input', function () { press(preB, -1); render(); }); });
    root.appendChild(out);
    preset(1);
  }

  /* =============== AULA 4: joelho =============== */
  function wJoelho(root) {
    var S = { who: 0 };
    var rho = slider('Utilização (ρ)', 0, 99, 1, 70, '%');
    var whoB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function params() { return S.who === 0 ? { s: 50, fixo: 0 } : { s: 10, fixo: 10 }; }
    function cost(s, r) { return s / ((1 - r) * (1 - r)) * 0.01; }
    function render() {
      var r = +rho.input.value / 100, p = params(), z = zone(r);
      var W = p.fixo + p.s / (1 - r), L = r / (1 - r), c = cost(p.s, r);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Tempo de resposta (W)', fmtMs(W), z.bad),
        fact('Em voo por servidor (L)', fmt(L, 2)),
        fact('Custo de mais 1 ponto', '+' + fmtMs(c), z.bad),
        fact('Zona', z.name, z.bad)
      ]));
      var rows = [0.5, 0.7, 0.8, 0.9, 0.95, 0.99].map(function (x) {
        return { cls: Math.abs(x - r) < 0.005 ? 'cp-cur' : '', cells: [
          { text: fmt(x * 100, 0) + '%' }, { text: fmtMs(p.fixo + p.s / (1 - x)) }, { text: fmt(x / (1 - x), 1) }, { text: '+' + fmtMs(cost(p.s, x)) }] };
      });
      out.appendChild(table(['ρ', 'W', 'L', 'Custo de +1 ponto'], rows));
      out.appendChild(verdict(z.bad, z.bad ? 'Passou do ponto saudável.' : 'Dentro do ponto saudável.',
        z.bad ? 'Cada ponto a mais custa ' + fmtMs(c) + ', ' + fmt(c / cost(p.s, 0.7), 1) + '× o de 70%. Uma rajada empurra o p95 e o timeout vira 504.'
          : 'A 70% cada ponto custa ' + fmtMs(cost(p.s, 0.7)) + '. Há margem para a rajada e para a variabilidade.'));
      out.appendChild(note('Não há quina no M/M/1: a curva é suave (W = S ÷ (1 − ρ)) e o joelho é onde o custo do ponto passa do que o time aceita. Zonas da loja: até 70% · 70–80% · 80–85% · 95%.'));
    }
    function pickWho(i) { S.who = i; press(whoB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [rho.wrap]));
    rho.input.addEventListener('input', render);
    root.appendChild(chipRow('Comparar', ['pagamentos (S = 50 ms)', 'catálogo (10 ms + 10 ms ÷ (1 − ρ))'], whoB, pickWho));
    root.appendChild(out);
    pickWho(0);
  }

  /* =============== AULA 5: mix, rajada e banda =============== */
  function wMix(root) {
    var busca = slider('Buscas no tráfego', 0, 20, 1, 5, '%');
    var cpuP = slider('CPU da página', 5, 30, 1, 10, 'ms');
    var cpuB = slider('CPU da busca', 20, 200, 5, 80, 'ms');
    var dem = slider('Demanda do catálogo', 100, 1500, 10, 950, 'req/s');
    var tps = slider('Rajada: TPS do minuto', 100, 1000, 10, 640, 'req/s');
    var rep = slider('Réplicas na rajada', 1, 20, 1, 10, 'réplicas');
    var kbq = slider('Requisição', 1, 20, 1, 1, 'KB');
    var kbs = slider('Resposta', 1, 100, 1, 19, 'KB');
    var rty = slider('Retries', 0, 30, 5, 0, '%');
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function mbit(t, kb, r) { return t * kb * 1024 * 8 * (1 + r) / 1e6; }
    function render() {
      var b = +busca.input.value / 100, cp = +cpuP.input.value, cb = +cpuB.input.value, d = +dem.input.value;
      var cpu = (1 - b) * cp + b * cb, rps = 1000 / cpu, need = Math.ceil(d / (0.7 * rps)), base = Math.ceil(d / (0.7 * (1000 / cp)));
      var u14 = d / (14 * rps), t = +tps.input.value, n = +rep.input.value, per = t / n;
      var rho = t / (n * (1000 / cp)), spread = rho < 1 ? 10 + cp / (1 - rho) : Infinity;
      var kb = +kbq.input.value + +kbs.input.value, r = +rty.input.value / 100;
      clear(out);
      out.appendChild(sub('O mix: cada tipo de requisição custa um CPU'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('CPU médio por requisição', fmt(cpu, 1) + ' ms'),
        fact('Req/s por réplica', fmt(rps, 1)),
        fact('Réplicas a 70% (' + fmt(d, 0) + ' req/s)', fmt(need, 0), need > base),
        fact('Sem contar a busca', fmt(base, 0) + ' réplicas'),
        fact('Com 14 réplicas: utilização', fmt(u14 * 100, 0) + '%', u14 > 0.8)
      ]));
      out.appendChild(verdict(need > base, need > base ? 'A média da página engana.' : 'Sem busca, vale a conta de 100 req/s por réplica.',
        need > base ? 'Planejar com "100 req/s por réplica" daria ' + base + ' réplicas onde são ' + need + '. A frota nasceria perto de 95% de CPU no pico.' : 'Suba o percentual de busca: 5% leva 14 a 19 réplicas; 10% leva a 24.'));
      out.appendChild(sub('A rajada dentro do segundo'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Espalhado pelo segundo: ρ', fmt(rho * 100, 0) + '%'),
        fact('Espalhado: tempo de resposta', fmtMs(spread)),
        fact('Rajada de 10 ms: por réplica', fmt(per, 0) + ' de uma vez', per * cp > 300),
        fact('A última da fila espera', fmt(per * cp, 0) + ' ms', per * cp > 300),
        fact('Espera média', '~' + fmt(per * cp / 2, 0) + ' ms')
      ]));
      out.appendChild(sub('A banda'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Por transação', fmt(kb, 0) + ' KB'),
        fact('A ' + fmt(d, 0) + ' req/s', fmt(d * kb * 1024 / 1e6, 1) + ' MB/s = ' + fmt(mbit(d, kb, r), 0) + ' Mbit/s'),
        fact('A 640 req/s', fmt(mbit(640, kb, r), 0) + ' Mbit/s')
      ]));
      out.appendChild(note('O custo médio vem de 0,95 × 10 + 0,05 × 80 = 13,5 ms (74,1 req/s). Rajada: os 640 req/s de 1 s chegando em 10 ms são 64 por réplica, atendidos 1 a cada 10 ms. Banda = TPS × KB × 1.024 × 8; com 10% de retries, 171 Mbit/s a 950 req/s.'));
    }
    [busca, cpuP, cpuB, dem, tps, rep, kbq, kbs, rty].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(el('div', { class: 'sr-ctrls' }, [busca.wrap, cpuP.wrap, cpuB.wrap, dem.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [tps.wrap, rep.wrap]));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [kbq.wrap, kbs.wrap, rty.wrap]));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: perfis =============== */
  var DIA = [8.2, 6.1, 4.1, 4.1, 4.1, 8.2, 16.3, 28.5, 40.8, 48.9, 53.0, 57.1, 61.1, 53.0, 48.9, 48.9, 53.0, 57.1, 61.1, 69.3, 77.5, 81.5, 48.9, 20.4];
  var SEM = [1.05, 1.00, 1.00, 1.05, 1.15, 0.90, 0.85], SEML = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  var MES = [0.85, 0.80, 0.90, 0.90, 1.00, 0.95, 0.90, 0.95, 1.00, 1.10, 1.45, 1.20], MESL = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function wPerfis(root) {
    var S = { s: 0, bf: true };
    var sB = [];
    var cb = el('input', { type: 'checkbox', id: 'cp-bf', checked: 'checked' });
    var ag = slider('Janela de agregação da Black Friday', 0, 2, 1, 0, '', function (v) { return ['1 minuto', '1 dia', '1 mês'][v]; });
    var chart = el('div', { class: 'cp-chart' });
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function series() {
      if (S.s === 0) return { v: DIA, l: DIA.map(function (_, i) { return i + 'h'; }), t: 'Dia comum (req/s por hora, média 40)' };
      if (S.s === 1) return { v: SEM.map(function (f) { return f * 40; }), l: SEML, t: 'Semana (fator × 40 req/s)' };
      return { v: MES.map(function (f) { return f * 40; }), l: MESL, t: 'Ano (índice do mês × 40 req/s)' };
    }
    function render() {
      var sr = series(), bf = S.bf, max = bf ? 700 : Math.max.apply(null, sr.v) * 1.1;
      clear(chart);
      var plot = el('div', { class: 'cp-plot' });
      var bars = el('div', { class: 'cp-bars', role: 'img', 'aria-label': sr.t });
      sr.v.forEach(function (v, i) {
        var peak = v === Math.max.apply(null, sr.v);
        bars.appendChild(el('i', { class: peak ? 'pk' : '', style: 'height:' + (v / max * 100) + '%', title: sr.l[i] + ': ' + fmt(v, 1) + ' req/s' }));
      });
      plot.appendChild(bars);
      if (bf) {
        [[640, 'BF 20:03 · 640'], [400, 'BF média do dia · 400']].forEach(function (x) {
          plot.appendChild(el('span', { class: 'cp-ref', style: 'bottom:' + (x[0] / max * 100) + '%', text: x[1] }));
        });
      }
      chart.appendChild(plot);
      chart.appendChild(el('div', { class: 'cp-axis' }, [el('span', { text: sr.l[0] }), el('span', { text: sr.t }), el('span', { text: sr.l[sr.l.length - 1] })]));
      var a = +ag.input.value, vals = [640, 400, 58];
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Pico do dia comum (21h)', '81,5 req/s'),
        fact('Sexta (×1,15 sobre a média)', fmt(40 * 1.15, 0) + ' req/s'),
        fact('Novembro (×1,45)', '58 req/s de média'),
        fact('Black Friday, janela de ' + ['1 minuto', '1 dia', '1 mês'][a], fmt(vals[a], 0) + ' req/s', a === 0)
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('× a média do mês (58)', fmt(vals[a] / 58, 1) + '×'),
        fact('× o pico do dia comum (81,5)', fmt(vals[a] / 81.5, 1) + '×')
      ]));
      out.appendChild(verdict(a === 0, a === 0 ? 'O pico só aparece na janela de 1 minuto.' : 'A janela maior esconde o pico.',
        a === 0 ? 'O minuto das 20:03 tem 640 req/s: 11× a média de novembro e 7,9× o pico comum. É a janela que o plano precisa cobrir.'
          : a === 1 ? 'Na média do dia a Black Friday tem 400 req/s: o dia esconde o minuto.' : 'Na média do mês, novembro tem 58 req/s: o mês esconde o dia.'));
      out.appendChild(note('Séries de exemplo declaradas (média do dia comum = 40 req/s): fatores semanais somam 7,00 e índices mensais 12,00. A rajada de 1.300 req/s do módulo 21 é de segundos: na janela de 1 minuto a mesma noite é ~650.'));
    }
    function pick(i) { S.s = i; press(sB, i); render(); }
    root.appendChild(chipRow('Escala', ['Dia', 'Semana', 'Mês'], sB, pick));
    var lab = el('label', { class: 'cp-check', for: 'cp-bf' }, [cb, ' Mostrar a Black Friday (640 no minuto, 400 na média do dia)']);
    cb.addEventListener('change', function () { S.bf = cb.checked; render(); });
    root.appendChild(lab);
    root.appendChild(chart);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ag.wrap]));
    ag.input.addEventListener('input', render);
    root.appendChild(out);
    pick(0);
  }

  /* =============== AULA 7: projeção =============== */
  function wProjecao(root) {
    var f = [numField('2023', 1, 5000, 10, 300, 'req/s'), numField('2024', 1, 5000, 10, 410, 'req/s'), numField('2025', 1, 5000, 10, 520, 'req/s'), numField('2026', 1, 5000, 10, 640, 'req/s')];
    var ev = slider('Evento de negócio (nova tela)', 0, 40, 1, 15, '%');
    var rep = slider('Réplicas do catálogo (100 req/s)', 4, 30, 1, 14, 'réplicas');
    var rB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function r10(x) { return Math.round(x / 10) * 10; }
    function render() {
      var y = f.map(function (x) { return Math.max(1, +x.input.value || 1); });
      var mx = 1.5, my = (y[0] + y[1] + y[2] + y[3]) / 4;
      var slope = (-1.5 * y[0] - 0.5 * y[1] + 0.5 * y[2] + 1.5 * y[3]) / 5;
      var lin = my + slope * (4 - mx);
      var g = Math.pow(y[3] / y[0], 1 / 3), comp = y[3] * g;
      var e = +ev.input.value / 100, plano = r10(comp * (1 + e)), alta = r10(plano * 1.2), n = +rep.input.value;
      var cenarios = [['Tendência linear', lin], ['Tendência composta', comp], ['Com o evento', plano], ['Margem (+20%)', alta]];
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Reta de mínimos quadrados', '+' + fmt(slope, 0) + ' por ano → ' + fmt(lin, 0)),
        fact('Taxa composta', fmt((g - 1) * 100, 1) + '% ao ano → ' + fmt(comp, 0)),
        fact('Saltos reais', fmt(y[1] / y[0], 2) + ' · ' + fmt(y[2] / y[1], 2) + ' · ' + fmt(y[3] / y[2], 2))
      ]));
      var rows = cenarios.map(function (c) {
        var rho = c[1] / (n * 100), z = zone(rho);
        return { cells: [{ text: c[0] }, { text: fmt(c[1], 0) }, { text: fmt(rho * 100, 1) + '%', cls: z.bad ? 'cp-bad' : '' },
          { text: rho < 1 ? fmtMs(10 + 10 / (1 - rho)) : '∞' }] };
      });
      out.appendChild(table(['2027', 'req/s', 'Uso (' + n + ')', 'R(ρ)'], rows));
      var rhoE = plano / (n * 100);
      out.appendChild(verdict(rhoE > 0.8, rhoE > 0.8 ? 'Com o evento, ' + n + ' réplicas passam do joelho.' : 'Com o evento, ' + n + ' réplicas ficam em ' + fmt(rhoE * 100, 1) + '%.',
        rhoE > 0.8 ? 'Se o plano usar só a reta (' + fmt(lin, 0) + '), a conta parece sobrar; o evento muda tudo.' : 'A margem de ' + fmt(alta, 0) + ' req/s ocupa ' + fmt(alta / (n * 100) * 100, 1) + '%.'));
      var hoje = 30, tend = hoje * plano / y[3];
      out.appendChild(sub('O checkout (pedidos/s)'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Tendência (30 × ' + fmt(plano / y[3], 3) + ')', fmt(tend, 1) + ' pedidos/s'),
        fact('Meta do comercial', '200 pedidos/s'),
        fact('Estresse (1,5 × a meta)', '300 pedidos/s'),
        fact('Diferença a explicar', fmt(200 - tend, 0) + ' pedidos/s (parceiros pela API)', true),
        fact('Conversão: hoje × meta', fmt(30 / y[3] * 100, 1) + '% × ' + fmt(200 / plano * 100, 0) + '% por requisição')
      ]));
      out.appendChild(note('Série de exemplo, declarada. O plano arredonda o evento (824 × 1,15 = 947,5) para 950 e a margem para 1.140.'));
    }
    root.appendChild(el('div', { class: 'sr-ctrls' }, f.map(function (x) { return x.wrap; })));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ev.wrap, rep.wrap]));
    root.appendChild(chipRow('Réplicas', ['10 réplicas', '14 réplicas'], rB, function (i) { rep.set(i ? 14 : 10); press(rB, i); render(); }));
    f.forEach(function (x) { x.input.addEventListener('input', render); });
    ev.input.addEventListener('input', render);
    rep.input.addEventListener('input', function () { press(rB, +rep.input.value === 10 ? 0 : +rep.input.value === 14 ? 1 : -1); render(); });
    root.appendChild(out);
    press(rB, 1); render();
  }

  /* =============== AULAS 8 e 9: cadeia e custo =============== */
  function wCadeia(root) {
    var S = { banco: 0 };
    var pe = slider('Pods do pedidos (30/s cada)', 1, 20, 1, 3, 'pods');
    var pa = slider('Pods do pagamentos (20/s cada)', 1, 20, 1, 2, 'pods');
    var es = slider('Pods do estoque (500/s cada)', 1, 6, 1, 2, 'pods');
    var de = slider('Demanda', 1, 400, 1, 200, 'pedidos/s');
    var ra = slider('ρ alvo', 50, 90, 5, 70, '%');
    var pt = slider('Partições do entregas (40/s cada)', 3, 12, 1, 3, 'partições');
    var bB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var d = +de.input.value, r = +ra.input.value / 100, p = +pt.input.value;
      var elos = [
        { n: 'pedidos', pods: +pe.input.value, un: 30 },
        { n: 'pagamentos', pods: +pa.input.value, un: 20 },
        { n: 'estoque', pods: +es.input.value, un: 500 }
      ];
      elos.forEach(function (e) { e.cap = e.pods * e.un; });
      elos.push({ n: 'banco', pods: S.banco ? 4 : 3, cap: S.banco ? 750 : 250, un: 0 });
      var min = elos.reduce(function (a, e) { return e.cap < a.cap ? e : a; }, elos[0]);
      var rows = elos.map(function (e) {
        var u = d / e.cap, need = e.un ? Math.max(e.n === 'estoque' ? 2 : 1, Math.ceil(d / (r * e.un))) : null;
        return { cls: e === min ? 'cp-cur' : '', cells: [{ text: e.n + ' (' + e.pods + (e.n === 'banco' ? ' shards' : '') + ')' + (e === min ? ' ←' : '') },
          { text: fmt(e.cap, 0) + '/s' }, { text: fmt(u * 100, 0) + '%', cls: u > r ? 'cp-bad' : '' },
          { text: need == null ? '—' : String(need) }] };
      });
      var hot = S.banco ? 0.4 * d / 300 : 0.6 * d / 150, norm = S.banco ? 0.6 * d / 3 / 150 : 0.2 * d / 150;
      var sust = r * min.cap, cabe = d <= sust;
      var cap = p * 40, lag = Math.max(0, d - cap) * 14400, drain = cap > 5 && lag ? lag / (cap - 5) : 0;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Capacidade sistêmica (mín.)', fmt(min.cap, 0) + '/s', d > min.cap),
        fact('Gargalo', min.n),
        fact('Sustentável (ρ alvo × mín.)', fmt(sust, 0) + '/s', !cabe),
        fact('Demanda ocupa', fmt(d / min.cap * 100, 0) + '% do mínimo', !cabe)
      ]));
      out.appendChild(table(['Elo (pods)', 'Capac.', 'Uso', 'Pods a ρ alvo'], rows));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact(S.banco ? 'Shard do mkt-01 (40%, capacidade 300)' : 'Shard quente (60% no shard-2, capacidade 150)', fmt(hot * 100, 1) + '%', hot > 0.8),
        fact('Shards normais', fmt(norm * 100, 1) + '%')
      ]));
      out.appendChild(verdict(!cabe, cabe ? 'A cadeia cabe na demanda.' : 'A cadeia não cabe.',
        cabe ? 'O mínimo é ' + fmt(min.cap, 0) + '/s e o sustentável ' + fmt(sust, 0) + '/s. Escalar outro elo não muda a saída: o gargalo é o mínimo, não o mais caro.'
          : 'O elo ' + min.n + ' limita a cadeia em ' + fmt(min.cap, 0) + '/s. Resolva esse e o próximo aparece.'));
      out.appendChild(sub('O elo assíncrono: o entregas, por evento'));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Consumo (' + p + ' × 40/s)', fmt(cap, 0) + ' eventos/s'),
        fact('Utilização', fmt(d / cap * 100, 1) + '%', d > cap),
        fact('Lag em 4 h de evento', fmt(lag, 0) + ' eventos', lag > 0),
        fact('Tempo para drenar (pico → 5/s)', lag ? fmtH(drain) : '—')
      ]));
      out.appendChild(note('Hoje: 3 · 2 · 2 e 3 shards = 40/s; 2 → 15 pods do pagamentos = 90/s; 3 → 10 do pedidos = 250/s (banco); shard dedicado 2× = 300/s. Mudar o número de partições muda murmur2 mod N (3 → 6 mexe ~50% das chaves).'));
    }
    function pickB(i) { S.banco = i; press(bB, i); render(); }
    root.appendChild(el('div', { class: 'sr-ctrls' }, [pe.wrap, pa.wrap, es.wrap]));
    root.appendChild(chipRow('Banco', ['3 shards (mkt-01 no shard-2)', '4 shards (dedicado 2× para o mkt-01)'], bB, pickB));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [de.wrap, ra.wrap, pt.wrap]));
    [pe, pa, es, de, ra, pt].forEach(function (x) { x.input.addEventListener('input', render); });
    root.appendChild(out);
    pickB(0);
  }

  function wCusto(root) {
    var cat = slider('Pods do catálogo', 6, 30, 1, 14, 'pods');
    var pe = slider('Pods do pedidos', 1, 20, 1, 10, 'pods');
    var pa = slider('Pods do pagamentos', 1, 20, 1, 15, 'pods');
    var es = slider('Pods do estoque', 1, 6, 1, 2, 'pods');
    var hr = slider('Horas de pico', 1, 12, 1, 4, 'h');
    var cB = [];
    var out = el('div', { class: 'cp-out', 'aria-live': 'polite' });
    function render() {
      var c = +cat.input.value, v = c + +pe.input.value + +pa.input.value + +es.input.value, h = +hr.input.value;
      var fixa = 24 * v, el_ = h * v + (24 - h) * 9, em1 = c * 1000 / 7.5, em2 = c * 1000 / 6;
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('vCPU no plano de 2027', fmt(v, 0) + ' (+' + fmt(v - 17, 0) + ' sobre a BF de 2026)'),
        fact('BF 2026 · dia comum', '17 vCPU · 9 vCPU'),
        fact('Réplica-horas: frota fixa', fmt(fixa, 0)),
        fact('Réplica-horas: elástica', fmt(el_, 0) + ' (' + fmt(el_ / fixa * 100, 0) + '% da fixa)')
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Catálogo sustentável (ρ 70%)', fmt(c * 70, 0) + ' req/s'),
        fact('Emergência (degradação 7,5 ms)', fmt(em1, 0) + ' req/s'),
        fact('Emergência (degradação 6 ms)', fmt(em2, 0) + ' req/s')
      ]));
      out.appendChild(verdict(false, 'O plano.',
        'Pré-escale às 19:50: o HPA reage em ~60 s e a newsletter das 20:00 é conhecida. A emergência é folga que o plano conta, mas não usa: degradar é o último recurso.'));
      out.appendChild(note('1 réplica = 1 vCPU. Dia comum: 2 + 3 + 2 + 2 = 9. Elástica: h × vCPU do pico + (24 − h) × 9 (4 × 41 + 20 × 9 = 344, contra 984 da frota fixa).'));
    }
    root.appendChild(chipRow('Catálogo', ['14 pods (sem busca)', '19 pods (5% de busca)'], cB, function (i) { cat.set(i ? 19 : 14); press(cB, i); render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [cat.wrap, pe.wrap, pa.wrap, es.wrap, hr.wrap]));
    [cat, pe, pa, es, hr].forEach(function (x) { x.input.addEventListener('input', function () { press(cB, +cat.input.value === 14 ? 0 : +cat.input.value === 19 ? 1 : -1); render(); }); });
    root.appendChild(out);
    press(cB, 0); render();
  }

  var REG = { fila: wFila, little: wLittle, joelho: wJoelho, mix: wMix, perfis: wPerfis, projecao: wProjecao, cadeia: wCadeia, custo: wCusto };
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
