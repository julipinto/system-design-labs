/* SDLabs · Provas Finais: widgets em JS puro
   (monte a loja, tire uma peça, os 14 saltos do 1060, a cola dos 28 números, cálculos de relance, nota por bloco).
   Os dados vêm de dados.js (os mesmos do brief, do quiz e das aulas). Nenhum número é novo: o pedido é o 1060 (módulo 26). */
import { BLOCOS, MODULOS, PECAS, SALTOS, blocoDe } from './dados.js';

(function () {
  'use strict';

  var BASE = (function () {
    /* a página está em <base>/labs/provas-finais/: sobe dois níveis para achar os outros módulos */
    var p = location.pathname.replace(/\/labs\/provas-finais\/?.*$/, '/');
    return p;
  })();
  function hrefMod(slug) { return BASE + 'labs/' + slug + '/'; }

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
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function press(btns, idx) { btns.forEach(function (b, i) { b.setAttribute('aria-pressed', i === idx ? 'true' : 'false'); }); }
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
  var uid = 0;
  function slider(label, min, max, step, value, unit, fmtv) {
    var id = 'pf-sl-' + (++uid);
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = (fmtv ? fmtv(+inp.value) : fmt(+inp.value, 2)) + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }
  function fact(label, value, bad) { return el('div', { class: 'sr-fact' + (bad ? ' pf-badfact' : '') }, [el('small', { text: label }), el('b', { text: value })]); }
  function verdict(bad, head, say) { return el('p', { class: 'sr-verdict ' + (bad ? 'bad' : '') }, [el('strong', { text: head + ' ' }), say]); }
  function note(t) { return el('p', { class: 'sr-note', text: t }); }
  function bar(label, frac, text, bad) {
    var fill = el('div', { class: 'sr-fill' + (bad ? ' cap' : ' win') });
    fill.style.width = Math.max(0, Math.min(1, frac)) * 100 + '%';
    return el('div', { class: 'sr-bar' }, [el('span', { text: label }), el('div', { class: 'sr-track' }, [fill, el('span', { class: 'sr-lbl', text: text })])]);
  }
  function store(key) {
    return {
      get: function () { try { return JSON.parse(window.localStorage.getItem(key) || 'null'); } catch (e) { return null; } },
      set: function (v) { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* sem armazenamento: o widget segue funcionando */ } }
    };
  }
  function modLink(n) {
    var m = MODULOS[n - 1];
    return el('a', { class: 'pf-modlink', href: hrefMod(m.slug), text: 'M' + n + ' ' + m.nome });
  }

  /* =============== MONTE A LOJA (a ordem) =============== */
  function wMonte(root) {
    var ordem = shuffle(MODULOS.map(function (m) { return m.n; }));
    var checked = false;
    var list = el('ol', { class: 'pf-order', 'aria-label': 'Os 28 módulos, na ordem que você montou' });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var drag = null;

    function render() {
      clear(list);
      ordem.forEach(function (n, i) {
        var m = MODULOS[n - 1];
        var right = checked && n === i + 1;
        var wrong = checked && n !== i + 1;
        var up = el('button', { type: 'button', class: 'pf-mv', 'aria-label': 'Subir ' + m.nome, text: '↑' });
        var dn = el('button', { type: 'button', class: 'pf-mv', 'aria-label': 'Descer ' + m.nome, text: '↓' });
        up.disabled = i === 0; dn.disabled = i === ordem.length - 1;
        up.addEventListener('click', function () { mover(i, i - 1); });
        dn.addEventListener('click', function () { mover(i, i + 1); });
        var handle = el('span', { class: 'pf-grip', 'aria-hidden': 'true', text: '⋮⋮' });
        var txt = el('span', { class: 'pf-name' }, [
          el('b', { text: (i + 1) + '. ' }), m.nome,
          checked ? el('small', { class: 'pf-m', text: ' (módulo ' + n + ')' }) : null
        ]);
        var li = el('li', { class: 'pf-card' + (right ? ' ok' : '') + (wrong ? ' no' : ''), 'data-i': String(i) }, [handle, txt, el('span', { class: 'pf-btns' }, [up, dn])]);
        if (right) li.appendChild(el('p', { class: 'pf-why' }, [el('b', { text: m.numero }), ' · ' + m.problema]));
        handle.addEventListener('pointerdown', function (e) { startDrag(e, i, li); });
        list.appendChild(li);
      });
    }
    function mover(a, b) {
      if (b < 0 || b >= ordem.length) return;
      var x = ordem.splice(a, 1)[0];
      ordem.splice(b, 0, x);
      checked = false; clear(out);
      render();
      var btn = list.children[b] && list.children[b].querySelector(a < b ? '.pf-mv:last-child' : '.pf-mv');
      if (btn && !btn.disabled) btn.focus();
    }
    function startDrag(e, i, li) {
      if (e.button != null && e.button !== 0) return;
      e.preventDefault();
      drag = { from: i, li: li, pid: e.pointerId };
      li.classList.add('drag');
      try { e.target.setPointerCapture(e.pointerId); } catch (x) { /* sem captura */ }
      var move = function (ev) {
        var rows = Array.prototype.slice.call(list.children);
        var to = rows.length - 1;
        for (var k = 0; k < rows.length; k++) {
          var r = rows[k].getBoundingClientRect();
          if (ev.clientY < r.top + r.height / 2) { to = k; break; }
        }
        drag.to = to;
        rows.forEach(function (row, k) { row.classList.toggle('drop', k === to && k !== drag.from); });
      };
      var up = function () {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        var d = drag; drag = null;
        if (d && d.to != null && d.to !== d.from) mover(d.from, d.to); else render();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);
    }

    var bCheck = el('button', { type: 'button', class: 'pf-btn', text: 'Conferir a ordem' });
    var bShuf = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Embaralhar' });
    var bShow = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Mostrar a ordem certa' });
    bCheck.addEventListener('click', function () {
      checked = true; render();
      var acertos = ordem.filter(function (n, i) { return n === i + 1; }).length;
      var seguidos = 0, melhor = 0;
      ordem.forEach(function (n, i) { if (n === i + 1) { seguidos++; melhor = Math.max(melhor, seguidos); } else seguidos = 0; });
      var faixa = acertos === 28 ? 'A loja inteira, na ordem. Agora diga o porquê de cada peça sem olhar.'
        : acertos >= 20 ? 'Quase lá. Os cartões ✗ mostram onde a história se confunde: releia a ponte da aula do bloco.'
        : 'A ordem é a história: cada peça entra porque a anterior criou um problema. Releia as 7 aulas e tente de novo.';
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (acertos === 28 ? '' : 'bad') }, [el('strong', { text: acertos + ' de 28 na posição certa. ' }), faixa + ' (Autoavaliação, sem nota oficial.)']));
      out.appendChild(note('Maior sequência certa: ' + melhor + '. Cada acerto mostra o número e o problema que o módulo resolveu.'));
    });
    bShuf.addEventListener('click', function () { ordem = shuffle(ordem); checked = false; clear(out); render(); });
    bShow.addEventListener('click', function () {
      ordem = MODULOS.map(function (m) { return m.n; }); checked = true; render();
      clear(out); out.appendChild(note('Esta é a ordem real da história. Embaralhe e tente refazer.'));
    });
    root.appendChild(el('p', { class: 'sr-note', text: 'Toque nas setas (ou arraste pelos pontos) para pôr os 28 módulos na ordem em que cada um se tornou necessário.' }));
    root.appendChild(list);
    root.appendChild(el('div', { class: 'pf-actions' }, [bCheck, bShuf, bShow]));
    root.appendChild(out);
    render();
  }

  /* =============== TIRE UMA PEÇA =============== */
  function wPeca(root) {
    var btns = [];
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    function show(i) {
      var p = PECAS[i];
      press(btns, i);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('Se você tira', p.peca, true),
        fact('O número', p.numero, true)
      ]));
      out.appendChild(verdict(true, 'O que quebra:', p.quebra));
      var avisou = el('p', { class: 'pf-avisou' }, ['Quem avisou: ']);
      p.avisou.forEach(function (n, k) { if (k) avisou.appendChild(document.createTextNode(' e ')); avisou.appendChild(modLink(n)); });
      out.appendChild(avisou);
    }
    root.appendChild(chipRow('As 13 peças', PECAS.map(function (p) { return p.peca; }), btns, show));
    root.appendChild(out);
    out.appendChild(note('Escolha uma peça: é o "e se der errado" de cada módulo, olhado ao contrário.'));
  }

  /* =============== OS 14 SALTOS DO 1060 =============== */
  function wSaltos(root) {
    var hide = false, conferido = false;
    var picks = SALTOS.map(function () { return 0; });
    var list = el('ol', { class: 'pf-saltos' });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var bHide = el('button', { type: 'button', class: 'pf-btn', text: 'Esconder os módulos e adivinhar' });
    var bCheck = el('button', { type: 'button', class: 'pf-btn', text: 'Conferir' });
    bCheck.hidden = true;
    function render() {
      clear(list);
      SALTOS.forEach(function (s, i) {
        var li = el('li', { class: 'pf-salto' });
        li.appendChild(el('p', { class: 'pf-stxt', text: s.salto }));
        if (!hide) {
          var mods = el('p', { class: 'pf-smods' }, ['Criado em: ']);
          s.mods.forEach(function (n, k) { if (k) mods.appendChild(document.createTextNode(' · ')); mods.appendChild(modLink(n)); });
          li.appendChild(mods);
        } else {
          var id = 'pf-sel-' + i;
          var sel = el('select', { id: id, 'aria-label': 'Módulo do salto ' + (i + 1) });
          sel.appendChild(el('option', { value: '0', text: 'Qual módulo criou esta peça?' }));
          MODULOS.forEach(function (m) { sel.appendChild(el('option', { value: String(m.n), text: 'M' + m.n + ' ' + m.nome })); });
          sel.value = String(picks[i]);
          sel.addEventListener('change', function () { picks[i] = +sel.value; conferido = false; clear(out); render(); });
          var ok = conferido && s.mods.indexOf(picks[i]) !== -1;
          var no = conferido && s.mods.indexOf(picks[i]) === -1;
          li.className += ok ? ' ok' : no ? ' no' : '';
          li.appendChild(el('div', { class: 'pf-pick' }, [el('label', { for: id, class: 'pf-lbl', text: 'Salto ' + (i + 1) }), sel]));
          if (conferido) {
            var r = el('p', { class: 'pf-smods' }, [ok ? '✓ ' : '✗ O certo: ']);
            s.mods.forEach(function (n, k) { if (k) r.appendChild(document.createTextNode(' · ')); r.appendChild(modLink(n)); });
            li.appendChild(r);
          }
        }
        list.appendChild(li);
      });
    }
    bHide.addEventListener('click', function () {
      hide = !hide; conferido = false; clear(out);
      bHide.textContent = hide ? 'Mostrar os módulos' : 'Esconder os módulos e adivinhar';
      bCheck.hidden = !hide;
      if (hide) picks = SALTOS.map(function () { return 0; });
      render();
    });
    bCheck.addEventListener('click', function () {
      conferido = true; render();
      var n = SALTOS.filter(function (s, i) { return s.mods.indexOf(picks[i]) !== -1; }).length;
      clear(out);
      out.appendChild(verdict(n < 14, n + ' de 14.', n === 14 ? 'Você sabe de onde veio cada salto do 1060.' : 'Cada ✗ aponta o módulo certo: releia a frase-resumo dele na aula do bloco.'));
    });
    root.appendChild(el('div', { class: 'sr-facts' }, [
      fact('Pedido', '1060 · Lena'), fact('Célula', 'celula-recife · 20:25:00.000'), fact('Total', '2 × 79,90 + 15,00 = 174,80')
    ]));
    root.appendChild(list);
    root.appendChild(el('div', { class: 'pf-actions' }, [bHide, bCheck]));
    root.appendChild(out);
    root.appendChild(note('O 1060 está certo se você consegue dizer, de cada salto, qual problema resolveu e o que o faria falhar.'));
    render();
  }

  /* =============== COLA DOS 28 NÚMEROS =============== */
  function wCola(root) {
    var st = store('sdl-provas-finais:cola');
    var saved = st.get() || {};
    var know = saved.know || {};
    var filtro = 0; /* 0 = todos */
    var fila = [], pos = 0, virado = false;
    var fBtns = [];
    var card = el('div', { class: 'pf-flash' });
    var prog = el('div', { class: 'pf-prog' });
    function deck() {
      return MODULOS.filter(function (m) { return !filtro || blocoDe(m.n).n === filtro; }).map(function (m) { return m.n; });
    }
    function montar() { fila = shuffle(deck()); pos = 0; virado = false; desenha(); }
    function contar() {
      clear(prog);
      BLOCOS.forEach(function (b) {
        var tot = b.ate - b.de + 1, ok = 0;
        for (var n = b.de; n <= b.ate; n++) if (know[n]) ok++;
        prog.appendChild(bar('Bloco ' + b.n, ok / tot, ok + ' de ' + tot, false));
      });
    }
    function marca(sabia) {
      var n = fila[pos];
      if (sabia) know[n] = 1; else delete know[n];
      st.set({ know: know });
      pos++; virado = false; desenha();
    }
    function desenha() {
      clear(card);
      contar();
      if (!fila.length) { card.appendChild(el('p', { text: 'Sem cartões neste filtro.' })); return; }
      if (pos >= fila.length) {
        var sabidos = fila.filter(function (n) { return know[n]; }).length;
        card.appendChild(el('p', { class: 'pf-fim' }, [el('b', { text: sabidos + ' de ' + fila.length + ' marcados como "sabia". ' }), 'O que ficou sem marca volta no próximo embaralho.']));
        var again = el('button', { type: 'button', class: 'pf-btn', text: 'Embaralhar de novo' });
        again.addEventListener('click', montar);
        card.appendChild(again);
        return;
      }
      var n = fila[pos], m = MODULOS[n - 1], b = blocoDe(n);
      card.appendChild(el('p', { class: 'pf-count', text: 'Cartão ' + (pos + 1) + ' de ' + fila.length + ' · bloco ' + b.n }));
      card.appendChild(el('p', { class: 'pf-front' }, [el('b', { text: 'Módulo ' + n + ' · ' + m.nome }), el('span', { text: m.problema })]));
      if (!virado) {
        var ver = el('button', { type: 'button', class: 'pf-btn', text: 'Ver o número' });
        ver.addEventListener('click', function () { virado = true; desenha(); });
        card.appendChild(ver);
      } else {
        card.appendChild(el('p', { class: 'pf-back' }, [el('b', { text: m.numero }), el('span', { text: m.sig })]));
        var sim = el('button', { type: 'button', class: 'pf-btn', text: 'Sabia' });
        var nao = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Não sabia' });
        sim.addEventListener('click', function () { marca(true); });
        nao.addEventListener('click', function () { marca(false); });
        card.appendChild(el('div', { class: 'pf-actions' }, [sim, nao]));
      }
    }
    var labels = ['Todos'].concat(BLOCOS.map(function (b) { return 'Bloco ' + b.n; }));
    root.appendChild(chipRow('Filtrar por bloco', labels, fBtns, function (i) { filtro = i; press(fBtns, i); montar(); }));
    press(fBtns, 0);
    root.appendChild(card);
    root.appendChild(prog);
    root.appendChild(note('Frente: o módulo e o problema. Verso: o número e o que ele significa. O "sabia" fica salvo neste navegador.'));
    montar();
  }

  /* =============== CÁLCULOS DE RELANCE =============== */
  function wCalculos(root) {
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var from = el('p', { class: 'pf-avisou' });
    var ctl = el('div', { class: 'sr-ctrls' });
    var btns = [];
    var calcs = [
      { nome: 'Tempo médio do cache', mod: 5, build: function () {
        var h = slider('Hit rate', 0, 100, 1, 90, '%', function (v) { return fmt(v, 0); });
        var c = slider('Tempo no cache', 1, 10, 1, 1, 'ms', function (v) { return fmt(v, 0); });
        var b = slider('Tempo no banco', 10, 100, 1, 41, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [h, c, b], run: function () {
          var H = +h.input.value / 100, C = +c.input.value, B = +b.input.value;
          var t = H * C + (1 - H) * B;
          return { facts: [['Tempo médio', fmt(t, 1) + ' ms'], ['Sem cache', fmt(B, 0) + ' ms'], ['Ganho', fmt(B / t, 1) + '×']], bad: H < 0.5,
            head: 'h × 1 + (1 − h) × 41.', say: fmt(H * 100, 0) + '% × ' + C + ' + ' + fmt((1 - H) * 100, 0) + '% × ' + B + ' = ' + fmt(t, 1) + ' ms. Com h = 90% são 5 ms (módulo 5).' };
        } };
      } },
      { nome: 'Vazão do estoque', mod: 11, build: function () {
        var cpu = slider('CPU por pedido', 1, 10, 1, 2, 'ms', function (v) { return fmt(v, 0); });
        var esp = slider('Espera por pedido', 0, 40, 1, 18, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [cpu, esp], run: function () {
          var C = +cpu.input.value, E = +esp.input.value;
          return { facts: [['Um por vez', fmt(1000 / (C + E), 0) + '/s'], ['Teto (CPU)', fmt(1000 / C, 0) + '/s'], ['Pedidos em voo no teto', fmt((C + E) / C, 0) + ' pedidos']], bad: false,
            head: '2 ms + 18 ms.', say: 'Um pedido por vez leva ' + (C + E) + ' ms: ' + fmt(1000 / (C + E), 0) + '/s. Com a espera sobreposta, só a CPU limita: 1.000 ÷ ' + C + ' = ' + fmt(1000 / C, 0) + '/s (módulo 11).' };
        } };
      } },
      { nome: 'Timeout crítico', mod: 21, build: function () {
        var pool = slider('Pool de conexões', 10, 100, 1, 50, '', function (v) { return fmt(v, 0); });
        var taxa = slider('Chamadas por segundo', 5, 60, 1, 30, '/s', function (v) { return fmt(v, 0); });
        var to = slider('Timeout do PSP', 0.5, 10, 0.5, 8, 's', function (v) { return fmt(v, 1); });
        return { sliders: [pool, taxa, to], run: function () {
          var P = +pool.input.value, L = +taxa.input.value, T = +to.input.value, crit = P / L;
          var enche = T > crit;
          return { facts: [['Timeout crítico', fmt(crit, 2) + ' s'], ['Seu timeout', fmt(T, 1) + ' s'], ['O pool', enche ? 'enche' : 'aguenta']], bad: enche,
            head: P + ' ÷ ' + L + ' = ' + fmt(crit, 2) + ' s.', say: enche ? 'Com ' + fmt(T, 1) + ' s o pool enche antes de a primeira chamada soltar a vaga (módulo 21).' : 'Com ' + fmt(T, 1) + ' s cada vaga volta antes de o pool acabar.' };
        } };
      } },
      { nome: 'Perda por RPO', mod: 27, build: function () {
        var taxa = slider('Pedidos por segundo', 1, 40, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
        var lag = slider('Lag da réplica', 0, 1500, 50, 300, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [taxa, lag], run: function () {
          var R = +taxa.input.value, L = +lag.input.value / 1000, perda = R * L;
          return { facts: [['Pedidos em risco', fmt(perda, 2)], ['Conta', fmt(R, 1) + ' × ' + fmt(L, 2) + ' s']], bad: perda > 5,
            head: 'RPO esperado = taxa × lag.', say: 'celula-sp: 9,9 × 0,3 = 2,97. celula-recife: 3,6 × 0,8 = 2,88. No failover do módulo 17: 30 × 0,8 = 24 pedidos.' };
        } };
      } },
      { nome: 'Orçamento de erro', mod: 28, build: function () {
        var slo = slider('SLO', 99, 99.99, 0.01, 99.9, '%', function (v) { return fmt(v, 2); });
        var dias = slider('Janela', 7, 30, 1, 30, 'dias', function (v) { return fmt(v, 0); });
        var burn = slider('Burn rate', 1, 20, 0.1, 14.4, '×', function (v) { return fmt(v, 1); });
        return { sliders: [slo, dias, burn], run: function () {
          var S = +slo.input.value / 100, D = +dias.input.value, B = +burn.input.value;
          var min = (1 - S) * D * 24 * 60, ruins = (1 - S) * 12960000 * (D / 30), h1 = B / (D * 24);
          return { facts: [['Orçamento', fmt(min, 1) + ' min'], ['Ruins (12,96 M/mês)', fmt(ruins, 0)], ['1 h a ' + fmt(B, 1) + '×', fmt(h1 * 100, 1) + '% do orçamento']], bad: h1 >= 0.02,
            head: '(1 − SLO) × janela.', say: 'SLO 99,9% em 30 dias: 0,1% × 43.200 min = 43,2 min, ou 12.960 requisições ruins em 12,96 milhões. Com burn rate de 14,4×, uma hora consome 2% (módulo 28).' };
        } };
      } },
      { nome: 'Shuffle 1 ÷ C(N,k)', mod: 26, build: function () {
        var N = slider('Células (N)', 4, 12, 1, 10, '', function (v) { return fmt(v, 0); });
        var K = slider('Células por cliente (k)', 1, 3, 1, 2, '', function (v) { return fmt(v, 0); });
        function comb(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
        return { sliders: [N, K], run: function () {
          var n = +N.input.value, k = Math.min(+K.input.value, n), c = comb(n, k);
          return { facts: [['Pares possíveis', fmt(c, 0)], ['Clientes no mesmo par', fmt(100 / c, 1) + '%']], bad: false,
            head: '1 ÷ C(' + n + ', ' + k + ').', say: 'Com 2 em 10: C(10, 2) = 45 pares; um par inteiro caído atinge 1 ÷ 45 = 2,2% dos clientes (módulo 26). A fórmula (f/N)^k é só aproximação.' };
        } };
      } },
    ];
    var cur = null;
    function pick(i) {
      press(btns, i);
      var c = calcs[i].build();
      cur = c;
      clear(ctl);
      c.sliders.forEach(function (s) { ctl.appendChild(s.wrap); s.input.addEventListener('input', paint); });
      paint();
      clear(from);
      from.appendChild(document.createTextNode('Vem do '));
      from.appendChild(modLink(calcs[i].mod));
    }
    function paint() {
      var r = cur.run();
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, r.facts.map(function (f, k) { return fact(f[0], f[1], r.bad && k === 0); })));
      out.appendChild(verdict(r.bad, r.head, r.say));
    }
    root.appendChild(chipRow('Escolha a conta', calcs.map(function (c) { return c.nome; }), btns, pick));
    root.appendChild(ctl);
    root.appendChild(out);
    root.appendChild(from);
    pick(0);
  }

  /* =============== NOTA POR BLOCO =============== */
  function wNota(root) {
    var d = store('sdlabs:provas-finais:quiz:v1').get();
    var last = d && d.last;
    var box = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    root.appendChild(box);
    var quizHref = BASE + 'labs/provas-finais/quiz/';
    if (!last) {
      box.appendChild(note('Ainda não há resultado neste navegador. Faça a prova final (80 perguntas) e volte aqui: as 7 barras aparecem sozinhas.'));
      box.appendChild(el('a', { class: 'pf-btn', href: quizHref, text: 'Fazer a prova final →' }));
      return;
    }
    var bars = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Nota por bloco' });
    var fracos = [];
    BLOCOS.forEach(function (b) {
      var r = last.blocos && last.blocos['b' + b.n];
      if (!r || !r.t) { bars.appendChild(bar('Bloco ' + b.n, 0, 'sem perguntas', false)); return; }
      var f = r.c / r.t, bad = f < 0.7;
      if (bad) fracos.push(b);
      bars.appendChild(bar('Bloco ' + b.n, f, r.c + ' de ' + r.t + ' (' + fmt(f * 100, 0) + '%)', bad));
    });
    var integ = last.blocos && last.blocos.i;
    if (integ && integ.t) bars.appendChild(bar('Integr.', integ.c / integ.t, integ.c + ' de ' + integ.t, integ.c / integ.t < 0.7));
    box.appendChild(bars);
    var tot = last.total || { c: 0, t: 0 };
    var pct = tot.t ? tot.c / tot.t : 0;
    var faixa = pct >= 0.9 ? 'Pode explicar a loja sem olhar.' : pct >= 0.7 ? 'Revise os blocos abaixo de 70%.' : 'Volte ao bloco mais baixo e refaça o "Você consegue?".';
    box.appendChild(verdict(pct < 0.7, tot.c + ' de ' + tot.t + ' (' + fmt(pct * 100, 0) + '%).', faixa));
    if (fracos.length) {
      var lst = el('ul', { class: 'pf-rever' });
      fracos.forEach(function (b) {
        var li = el('li', null, ['Bloco ' + b.n + ': ']);
        for (var n = b.de; n <= b.ate; n++) { if (n > b.de) li.appendChild(document.createTextNode(' · ')); li.appendChild(modLink(n)); }
        lst.appendChild(li);
      });
      box.appendChild(el('p', { class: 'pf-avisou', text: 'Para revisar (abaixo de 70%):' }));
      box.appendChild(lst);
    }
    box.appendChild(el('a', { class: 'pf-btn ghost', href: quizHref, text: 'Refazer a prova final →' }));
  }

  var REG = { monte: wMonte, peca: wPeca, saltos: wSaltos, cola: wCola, calculos: wCalculos, nota: wNota };
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
