/* SDLabs · Final Exams (English): widgets in plain JS
   (build the store, take a piece out, the 14 hops of 1060, the cheat sheet of the 28 numbers, quick calculations, score by block).
   The data comes from dados.en.js (the same as the brief, the quiz and the lessons). No number is new: the order is 1060 (module 26). */
import { BLOCOS, MODULOS, PECAS, SALTOS, blocoDe } from './dados.en.js';

(function () {
  'use strict';

  var BASE = (function () {
    /* the page is at <base>/en/labs/provas-finais/: climb up to find the other modules */
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
  function fmt(v, d) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d, minimumFractionDigits: 0 }); }
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
      set: function (v) { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* no storage: the widget keeps working */ } }
    };
  }
  function modLink(n) {
    var m = MODULOS[n - 1];
    return el('a', { class: 'pf-modlink', href: hrefMod(m.slug), text: 'M' + n + ' ' + m.nome });
  }

  /* =============== BUILD THE STORE (the order) =============== */
  function wMonte(root) {
    var ordem = shuffle(MODULOS.map(function (m) { return m.n; }));
    var checked = false;
    var list = el('ol', { class: 'pf-order', 'aria-label': 'The 28 modules, in the order you built' });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var drag = null;

    function render() {
      clear(list);
      ordem.forEach(function (n, i) {
        var m = MODULOS[n - 1];
        var right = checked && n === i + 1;
        var wrong = checked && n !== i + 1;
        var up = el('button', { type: 'button', class: 'pf-mv', 'aria-label': 'Move up ' + m.nome, text: '↑' });
        var dn = el('button', { type: 'button', class: 'pf-mv', 'aria-label': 'Move down ' + m.nome, text: '↓' });
        up.disabled = i === 0; dn.disabled = i === ordem.length - 1;
        up.addEventListener('click', function () { mover(i, i - 1); });
        dn.addEventListener('click', function () { mover(i, i + 1); });
        var handle = el('span', { class: 'pf-grip', 'aria-hidden': 'true', text: '⋮⋮' });
        var txt = el('span', { class: 'pf-name' }, [
          el('b', { text: (i + 1) + '. ' }), m.nome,
          checked ? el('small', { class: 'pf-m', text: ' (module ' + n + ')' }) : null
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
      try { e.target.setPointerCapture(e.pointerId); } catch (x) { /* no capture */ }
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

    var bCheck = el('button', { type: 'button', class: 'pf-btn', text: 'Check the order' });
    var bShuf = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Shuffle' });
    var bShow = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Show the right order' });
    bCheck.addEventListener('click', function () {
      checked = true; render();
      var acertos = ordem.filter(function (n, i) { return n === i + 1; }).length;
      var seguidos = 0, melhor = 0;
      ordem.forEach(function (n, i) { if (n === i + 1) { seguidos++; melhor = Math.max(melhor, seguidos); } else seguidos = 0; });
      var faixa = acertos === 28 ? 'The whole store, in order. Now say why each piece is there without looking.'
        : acertos >= 20 ? 'Almost there. The ✗ cards show where the story gets confusing: reread the bridge of the block lesson.'
        : 'The order is the story: each piece comes in because the previous one created a problem. Reread the 7 lessons and try again.';
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + (acertos === 28 ? '' : 'bad') }, [el('strong', { text: acertos + ' of 28 in the right position. ' }), faixa + ' (Self-assessment, no official score.)']));
      out.appendChild(note('Longest correct streak: ' + melhor + '. Each hit shows the number and the problem the module solved.'));
    });
    bShuf.addEventListener('click', function () { ordem = shuffle(ordem); checked = false; clear(out); render(); });
    bShow.addEventListener('click', function () {
      ordem = MODULOS.map(function (m) { return m.n; }); checked = true; render();
      clear(out); out.appendChild(note('This is the real order of the story. Shuffle and try to rebuild it.'));
    });
    root.appendChild(el('p', { class: 'sr-note', text: 'Tap the arrows (or drag by the dots) to put the 28 modules in the order in which each one became necessary.' }));
    root.appendChild(list);
    root.appendChild(el('div', { class: 'pf-actions' }, [bCheck, bShuf, bShow]));
    root.appendChild(out);
    render();
  }

  /* =============== TAKE A PIECE OUT =============== */
  function wPeca(root) {
    var btns = [];
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    function show(i) {
      var p = PECAS[i];
      press(btns, i);
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        fact('If you take out', p.peca, true),
        fact('The number', p.numero, true)
      ]));
      out.appendChild(verdict(true, 'What breaks:', p.quebra));
      var avisou = el('p', { class: 'pf-avisou' }, ['Warned by: ']);
      p.avisou.forEach(function (n, k) { if (k) avisou.appendChild(document.createTextNode(' and ')); avisou.appendChild(modLink(n)); });
      out.appendChild(avisou);
    }
    root.appendChild(chipRow('The 13 pieces', PECAS.map(function (p) { return p.peca; }), btns, show));
    root.appendChild(out);
    out.appendChild(note('Choose a piece: it is the "if it goes wrong" of each module, seen backwards.'));
  }

  /* =============== THE 14 HOPS OF 1060 =============== */
  function wSaltos(root) {
    var hide = false, conferido = false;
    var picks = SALTOS.map(function () { return 0; });
    var list = el('ol', { class: 'pf-saltos' });
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var bHide = el('button', { type: 'button', class: 'pf-btn', text: 'Hide the modules and guess' });
    var bCheck = el('button', { type: 'button', class: 'pf-btn', text: 'Check' });
    bCheck.hidden = true;
    function render() {
      clear(list);
      SALTOS.forEach(function (s, i) {
        var li = el('li', { class: 'pf-salto' });
        li.appendChild(el('p', { class: 'pf-stxt', text: s.salto }));
        if (!hide) {
          var mods = el('p', { class: 'pf-smods' }, ['Created in: ']);
          s.mods.forEach(function (n, k) { if (k) mods.appendChild(document.createTextNode(' · ')); mods.appendChild(modLink(n)); });
          li.appendChild(mods);
        } else {
          var id = 'pf-sel-' + i;
          var sel = el('select', { id: id, 'aria-label': 'Module of hop ' + (i + 1) });
          sel.appendChild(el('option', { value: '0', text: 'Which module created this piece?' }));
          MODULOS.forEach(function (m) { sel.appendChild(el('option', { value: String(m.n), text: 'M' + m.n + ' ' + m.nome })); });
          sel.value = String(picks[i]);
          sel.addEventListener('change', function () { picks[i] = +sel.value; conferido = false; clear(out); render(); });
          var ok = conferido && s.mods.indexOf(picks[i]) !== -1;
          var no = conferido && s.mods.indexOf(picks[i]) === -1;
          li.className += ok ? ' ok' : no ? ' no' : '';
          li.appendChild(el('div', { class: 'pf-pick' }, [el('label', { for: id, class: 'pf-lbl', text: 'Hop ' + (i + 1) }), sel]));
          if (conferido) {
            var r = el('p', { class: 'pf-smods' }, [ok ? '✓ ' : '✗ The right one: ']);
            s.mods.forEach(function (n, k) { if (k) r.appendChild(document.createTextNode(' · ')); r.appendChild(modLink(n)); });
            li.appendChild(r);
          }
        }
        list.appendChild(li);
      });
    }
    bHide.addEventListener('click', function () {
      hide = !hide; conferido = false; clear(out);
      bHide.textContent = hide ? 'Show the modules' : 'Hide the modules and guess';
      bCheck.hidden = !hide;
      if (hide) picks = SALTOS.map(function () { return 0; });
      render();
    });
    bCheck.addEventListener('click', function () {
      conferido = true; render();
      var n = SALTOS.filter(function (s, i) { return s.mods.indexOf(picks[i]) !== -1; }).length;
      clear(out);
      out.appendChild(verdict(n < 14, n + ' of 14.', n === 14 ? 'You know where each hop of 1060 came from.' : 'Each ✗ points to the right module: reread its summary sentence in the block lesson.'));
    });
    root.appendChild(el('div', { class: 'sr-facts' }, [
      fact('Order', '1060 · Lena'), fact('Cell', 'celula-recife · 20:25:00.000'), fact('Total', '2 × 79.90 + 15.00 = 174.80')
    ]));
    root.appendChild(list);
    root.appendChild(el('div', { class: 'pf-actions' }, [bHide, bCheck]));
    root.appendChild(out);
    root.appendChild(note('1060 is right if you can say, for each hop, which problem it solved and what would make it fail.'));
    render();
  }

  /* =============== CHEAT SHEET OF THE 28 NUMBERS =============== */
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
        prog.appendChild(bar('Block ' + b.n, ok / tot, ok + ' of ' + tot, false));
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
      if (!fila.length) { card.appendChild(el('p', { text: 'No cards in this filter.' })); return; }
      if (pos >= fila.length) {
        var sabidos = fila.filter(function (n) { return know[n]; }).length;
        card.appendChild(el('p', { class: 'pf-fim' }, [el('b', { text: sabidos + ' of ' + fila.length + ' marked as "knew it". ' }), 'Whatever is left unmarked comes back in the next shuffle.']));
        var again = el('button', { type: 'button', class: 'pf-btn', text: 'Shuffle again' });
        again.addEventListener('click', montar);
        card.appendChild(again);
        return;
      }
      var n = fila[pos], m = MODULOS[n - 1], b = blocoDe(n);
      card.appendChild(el('p', { class: 'pf-count', text: 'Card ' + (pos + 1) + ' of ' + fila.length + ' · block ' + b.n }));
      card.appendChild(el('p', { class: 'pf-front' }, [el('b', { text: 'Module ' + n + ' · ' + m.nome }), el('span', { text: m.problema })]));
      if (!virado) {
        var ver = el('button', { type: 'button', class: 'pf-btn', text: 'See the number' });
        ver.addEventListener('click', function () { virado = true; desenha(); });
        card.appendChild(ver);
      } else {
        card.appendChild(el('p', { class: 'pf-back' }, [el('b', { text: m.numero }), el('span', { text: m.sig })]));
        var sim = el('button', { type: 'button', class: 'pf-btn', text: 'Knew it' });
        var nao = el('button', { type: 'button', class: 'pf-btn ghost', text: 'Did not know it' });
        sim.addEventListener('click', function () { marca(true); });
        nao.addEventListener('click', function () { marca(false); });
        card.appendChild(el('div', { class: 'pf-actions' }, [sim, nao]));
      }
    }
    var labels = ['All'].concat(BLOCOS.map(function (b) { return 'Block ' + b.n; }));
    root.appendChild(chipRow('Filter by block', labels, fBtns, function (i) { filtro = i; press(fBtns, i); montar(); }));
    press(fBtns, 0);
    root.appendChild(card);
    root.appendChild(prog);
    root.appendChild(note('Front: the module and the problem. Back: the number and what it means. "Knew it" is saved in this browser.'));
    montar();
  }

  /* =============== QUICK CALCULATIONS =============== */
  function wCalculos(root) {
    var out = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    var from = el('p', { class: 'pf-avisou' });
    var ctl = el('div', { class: 'sr-ctrls' });
    var btns = [];
    var calcs = [
      { nome: 'Average cache time', mod: 5, build: function () {
        var h = slider('Hit rate', 0, 100, 1, 90, '%', function (v) { return fmt(v, 0); });
        var c = slider('Time in the cache', 1, 10, 1, 1, 'ms', function (v) { return fmt(v, 0); });
        var b = slider('Time in the database', 10, 100, 1, 41, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [h, c, b], run: function () {
          var H = +h.input.value / 100, C = +c.input.value, B = +b.input.value;
          var t = H * C + (1 - H) * B;
          return { facts: [['Average time', fmt(t, 1) + ' ms'], ['Without cache', fmt(B, 0) + ' ms'], ['Gain', fmt(B / t, 1) + '×']], bad: H < 0.5,
            head: 'h × 1 + (1 − h) × 41.', say: fmt(H * 100, 0) + '% × ' + C + ' + ' + fmt((1 - H) * 100, 0) + '% × ' + B + ' = ' + fmt(t, 1) + ' ms. With h = 90% that is 5 ms (module 5).' };
        } };
      } },
      { nome: 'Stock throughput', mod: 11, build: function () {
        var cpu = slider('CPU per order', 1, 10, 1, 2, 'ms', function (v) { return fmt(v, 0); });
        var esp = slider('Wait per order', 0, 40, 1, 18, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [cpu, esp], run: function () {
          var C = +cpu.input.value, E = +esp.input.value;
          return { facts: [['One at a time', fmt(1000 / (C + E), 0) + '/s'], ['Ceiling (CPU)', fmt(1000 / C, 0) + '/s'], ['Orders in flight at the ceiling', fmt((C + E) / C, 0) + ' orders']], bad: false,
            head: '2 ms + 18 ms.', say: 'One order at a time takes ' + (C + E) + ' ms: ' + fmt(1000 / (C + E), 0) + '/s. With the wait overlapped, only the CPU limits: 1,000 ÷ ' + C + ' = ' + fmt(1000 / C, 0) + '/s (module 11).' };
        } };
      } },
      { nome: 'Critical timeout', mod: 21, build: function () {
        var pool = slider('Connection pool', 10, 100, 1, 50, '', function (v) { return fmt(v, 0); });
        var taxa = slider('Calls per second', 5, 60, 1, 30, '/s', function (v) { return fmt(v, 0); });
        var to = slider('PSP timeout', 0.5, 10, 0.5, 8, 's', function (v) { return fmt(v, 1); });
        return { sliders: [pool, taxa, to], run: function () {
          var P = +pool.input.value, L = +taxa.input.value, T = +to.input.value, crit = P / L;
          var enche = T > crit;
          return { facts: [['Critical timeout', fmt(crit, 2) + ' s'], ['Your timeout', fmt(T, 1) + ' s'], ['The pool', enche ? 'fills up' : 'holds']], bad: enche,
            head: P + ' ÷ ' + L + ' = ' + fmt(crit, 2) + ' s.', say: enche ? 'At ' + fmt(T, 1) + ' s the pool fills up before the first call frees its slot (module 21).' : 'At ' + fmt(T, 1) + ' s each slot comes back before the pool runs out.' };
        } };
      } },
      { nome: 'Loss from RPO', mod: 27, build: function () {
        var taxa = slider('Orders per second', 1, 40, 0.1, 9.9, '/s', function (v) { return fmt(v, 1); });
        var lag = slider('Replica lag', 0, 1500, 50, 300, 'ms', function (v) { return fmt(v, 0); });
        return { sliders: [taxa, lag], run: function () {
          var R = +taxa.input.value, L = +lag.input.value / 1000, perda = R * L;
          return { facts: [['Orders at risk', fmt(perda, 2)], ['Math', fmt(R, 1) + ' × ' + fmt(L, 2) + ' s']], bad: perda > 5,
            head: 'Expected RPO = rate × lag.', say: 'celula-sp: 9.9 × 0.3 = 2.97. celula-recife: 3.6 × 0.8 = 2.88. In the module 17 failover: 30 × 0.8 = 24 orders.' };
        } };
      } },
      { nome: 'Error budget', mod: 28, build: function () {
        var slo = slider('SLO', 99, 99.99, 0.01, 99.9, '%', function (v) { return fmt(v, 2); });
        var dias = slider('Window', 7, 30, 1, 30, 'days', function (v) { return fmt(v, 0); });
        var burn = slider('Burn rate', 1, 20, 0.1, 14.4, '×', function (v) { return fmt(v, 1); });
        return { sliders: [slo, dias, burn], run: function () {
          var S = +slo.input.value / 100, D = +dias.input.value, B = +burn.input.value;
          var min = (1 - S) * D * 24 * 60, ruins = (1 - S) * 12960000 * (D / 30), h1 = B / (D * 24);
          return { facts: [['Budget', fmt(min, 1) + ' min'], ['Bad (12.96 M/month)', fmt(ruins, 0)], ['1 h at ' + fmt(B, 1) + '×', fmt(h1 * 100, 1) + '% of the budget']], bad: h1 >= 0.02,
            head: '(1 − SLO) × window.', say: 'SLO 99.9% over 30 days: 0.1% × 43,200 min = 43.2 min, or 12,960 bad requests out of 12.96 million. With a burn rate of 14.4×, one hour consumes 2% (module 28).' };
        } };
      } },
      { nome: 'Shuffle 1 ÷ C(N,k)', mod: 26, build: function () {
        var N = slider('Cells (N)', 4, 12, 1, 10, '', function (v) { return fmt(v, 0); });
        var K = slider('Cells per customer (k)', 1, 3, 1, 2, '', function (v) { return fmt(v, 0); });
        function comb(n, k) { var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); }
        return { sliders: [N, K], run: function () {
          var n = +N.input.value, k = Math.min(+K.input.value, n), c = comb(n, k);
          return { facts: [['Possible pairs', fmt(c, 0)], ['Customers on the same pair', fmt(100 / c, 1) + '%']], bad: false,
            head: '1 ÷ C(' + n + ', ' + k + ').', say: 'With 2 in 10: C(10, 2) = 45 pairs; a whole downed pair hits 1 ÷ 45 = 2.2% of customers (module 26). The formula (f/N)^k is only an approximation.' };
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
      from.appendChild(document.createTextNode('From '));
      from.appendChild(modLink(calcs[i].mod));
    }
    function paint() {
      var r = cur.run();
      clear(out);
      out.appendChild(el('div', { class: 'sr-facts' }, r.facts.map(function (f, k) { return fact(f[0], f[1], r.bad && k === 0); })));
      out.appendChild(verdict(r.bad, r.head, r.say));
    }
    root.appendChild(chipRow('Choose the calculation', calcs.map(function (c) { return c.nome; }), btns, pick));
    root.appendChild(ctl);
    root.appendChild(out);
    root.appendChild(from);
    pick(0);
  }

  /* =============== SCORE BY BLOCK =============== */
  function wNota(root) {
    var d = store('sdlabs:provas-finais:quiz:v1').get();
    var last = d && d.last;
    var box = el('div', { class: 'pf-out', 'aria-live': 'polite' });
    root.appendChild(box);
    var quizHref = BASE + 'labs/provas-finais/quiz/';
    if (!last) {
      box.appendChild(note('There is no result in this browser yet. Take the final exam (80 questions) and come back here: the 7 bars show up on their own.'));
      box.appendChild(el('a', { class: 'pf-btn', href: quizHref, text: 'Take the final exam →' }));
      return;
    }
    var bars = el('div', { class: 'sr-bars', role: 'img', 'aria-label': 'Score by block' });
    var fracos = [];
    BLOCOS.forEach(function (b) {
      var r = last.blocos && last.blocos['b' + b.n];
      if (!r || !r.t) { bars.appendChild(bar('Block ' + b.n, 0, 'no questions', false)); return; }
      var f = r.c / r.t, bad = f < 0.7;
      if (bad) fracos.push(b);
      bars.appendChild(bar('Block ' + b.n, f, r.c + ' of ' + r.t + ' (' + fmt(f * 100, 0) + '%)', bad));
    });
    var integ = last.blocos && last.blocos.i;
    if (integ && integ.t) bars.appendChild(bar('Integr.', integ.c / integ.t, integ.c + ' of ' + integ.t, integ.c / integ.t < 0.7));
    box.appendChild(bars);
    var tot = last.total || { c: 0, t: 0 };
    var pct = tot.t ? tot.c / tot.t : 0;
    var faixa = pct >= 0.9 ? 'You can explain the store without looking.' : pct >= 0.7 ? 'Review the blocks below 70%.' : 'Go back to the lowest block and redo "Can you do it?".';
    box.appendChild(verdict(pct < 0.7, tot.c + ' of ' + tot.t + ' (' + fmt(pct * 100, 0) + '%).', faixa));
    if (fracos.length) {
      var lst = el('ul', { class: 'pf-rever' });
      fracos.forEach(function (b) {
        var li = el('li', null, ['Block ' + b.n + ': ']);
        for (var n = b.de; n <= b.ate; n++) { if (n > b.de) li.appendChild(document.createTextNode(' · ')); li.appendChild(modLink(n)); }
        lst.appendChild(li);
      });
      box.appendChild(el('p', { class: 'pf-avisou', text: 'To review (below 70%):' }));
      box.appendChild(lst);
    }
    box.appendChild(el('a', { class: 'pf-btn ghost', href: quizHref, text: 'Retake the final exam →' }));
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
