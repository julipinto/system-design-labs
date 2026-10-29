/* ---------- glossário: termos tocáveis nas aulas + ficha compartilhada ---------- */
(function () {
  'use strict';
  var EN = /^en/.test(document.documentElement.lang);   // versão em inglês (/en/)
  var root = document.querySelector('.sdl-content');
  var dataEl = document.getElementById('gl-data');
  if (!root || !dataEl) return;
  var terms;
  try { terms = JSON.parse(dataEl.textContent || '[]'); } catch (e) { return; }
  if (!terms.length) return;

  /* ---- 1. envolver a primeira ocorrência de cada termo, por aula ---- */
  var byKey = {}, alts = [];
  terms.forEach(function (t, i) {
    t.aliases.forEach(function (a) {
      var ci = /[a-zà-ÿ]/.test(a);               // sigla toda em maiúsculas: casa só como está escrita
      byKey[a.toLowerCase()] = { i: i, alias: a, ci: ci };
      alts.push(a);
    });
  });
  alts.sort(function (a, b) { return b.length - a.length; });
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  var RE = new RegExp('(' + alts.map(esc).join('|') + ')s?(?![\\p{L}\\p{N}_])', 'giu');
  var WORD = /[\p{L}\p{N}_]/u;
  var LEAD = /[(\[{“‘«"'¿¡]*$/u, TRAIL = /^[)\]}”’»"'.,;:!?…%]*/u;
  var SKIP = '.widget, pre, code, button, a, h1, h2, h3, summary, header, svg, script, style, textarea, ' +
    '.osi3d-wrap, .mnemonic, .gl-term, [data-no-gl]';

  function lookup(text) {
    var k = text.toLowerCase(), e = byKey[k], plural = false;
    if (!e && k.charAt(k.length - 1) === 's') { e = byKey[k.slice(0, -1)]; plural = true; }
    if (!e) return null;
    var base = plural ? text.slice(0, -1) : text;
    if (!e.ci && base !== e.alias) return null;
    return e;
  }

  function wrapLesson(lesson) {
    var seen = {}, nodes = [];
    var walker = document.createTreeWalker(lesson, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        return p && !p.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    while (walker.nextNode()) nodes.push(walker.currentNode);
    /* texto visível primeiro; o que está dentro de <details> fechado só entra se o termo não aparece fora dele */
    var shown = [], folded = [];
    nodes.forEach(function (n) { (n.parentElement.closest('details:not([open])') ? folded : shown).push(n); });
    shown.concat(folded).forEach(function (node) {
      var text = node.nodeValue, last = 0, frag = null, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(text))) {
        var start = m.index;
        if (start > 0 && WORD.test(text.charAt(start - 1))) { RE.lastIndex = start + 1; continue; }
        var e = lookup(m[0]);
        if (!e || seen[e.i]) { if (!e) RE.lastIndex = start + 1; continue; }
        seen[e.i] = true;
        frag = frag || document.createDocumentFragment();
        /* o botão é inline atômico: a linha pode quebrar antes ou depois dele; cola nele a pontuação vizinha */
        var end = start + m[0].length;
        var lead = text.slice(last, start).match(LEAD)[0].length, trail = text.slice(end).match(TRAIL)[0].length;
        if (start - lead > last) frag.appendChild(document.createTextNode(text.slice(last, start - lead)));
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'gl-term'; b.setAttribute('aria-haspopup', 'dialog');
        b.setAttribute('aria-expanded', 'false'); b.setAttribute('data-term', terms[e.i].term);
        b.textContent = m[0];
        if (lead || trail) {
          var glue = document.createElement('span');
          glue.className = 'gl-glue';
          if (lead) glue.appendChild(document.createTextNode(text.slice(start - lead, start)));
          glue.appendChild(b);
          if (trail) glue.appendChild(document.createTextNode(text.slice(end, end + trail)));
          frag.appendChild(glue);
        } else frag.appendChild(b);
        last = end + trail;
        RE.lastIndex = last;
      }
      if (frag) {
        if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    });
  }
  Array.prototype.forEach.call(root.querySelectorAll('.lesson'), wrapLesson);

  /* ---- 2. a ficha (uma só, compartilhada) ---- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  var card = document.createElement('div');
  card.className = 'gl-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
  card.setAttribute('aria-labelledby', 'gl-name'); card.setAttribute('aria-describedby', 'gl-def');
  card.setAttribute('aria-hidden', 'true'); card.tabIndex = -1;
  card.innerHTML = '<p class="gl-name" id="gl-name"></p><p class="gl-def" id="gl-def"></p>' +
    '<p class="gl-meta"><span class="gl-layer"></span><span class="gl-seen"></span></p>' +
    '<button type="button" class="gl-close">' + (EN ? 'Close' : 'Fechar') + '</button>';
  document.body.appendChild(card);
  var elName = card.querySelector('.gl-name'), elDef = card.querySelector('.gl-def'),
    elLayer = card.querySelector('.gl-layer'), elSeen = card.querySelector('.gl-seen'),
    elClose = card.querySelector('.gl-close');
  var cur = null, pinned = false, timer = 0;
  var isDesktop = function () { return window.innerWidth >= 640; };
  var byName = {};
  terms.forEach(function (t) { byName[t.term] = t; });

  function lessonNum(id) { var ls = Array.prototype.slice.call(root.querySelectorAll('.lesson')); for (var i = 0; i < ls.length; i++) if (ls[i].id === id) return i + 1; return 0; }

  function place(btn) {
    if (!isDesktop()) { card.style.left = card.style.top = ''; card.style.removeProperty('--ox'); card.style.removeProperty('--oy'); return; }
    var r = btn.getClientRects()[0] || btn.getBoundingClientRect();
    var w = card.offsetWidth, h = card.offsetHeight, gap = 8;
    var left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
    var below = r.bottom + gap + h <= window.innerHeight || r.top - gap - h < 0;
    var top = below ? r.bottom + gap : r.top - gap - h;
    card.style.left = (left + window.scrollX) + 'px';
    card.style.top = (top + window.scrollY) + 'px';
    // origem da abertura/fechamento: o centro da palavra, em coordenadas da ficha
    var ox = Math.min(Math.max(0, r.left + r.width / 2 - left), w), oy = below ? 0 : h;
    card.style.setProperty('--ox', ox + 'px'); card.style.setProperty('--oy', oy + 'px');
  }

  function open(btn, pin) {
    var t = byName[btn.getAttribute('data-term')];
    if (!t) return;
    clearTimeout(timer);
    var swap = card.classList.contains('open') && cur && cur !== btn && !(reduce && reduce.matches);   // troca de termo com a ficha aberta
    var before = swap && isDesktop() ? card.getBoundingClientRect() : null;
    if (cur && cur !== btn) cur.setAttribute('aria-expanded', 'false');
    cur = btn; pinned = !!pin;
    btn.setAttribute('aria-expanded', 'true');
    elName.textContent = t.term;
    elDef.textContent = t.short;
    elLayer.textContent = t.layer ? (EN ? 'Layer ' : 'Camada ') + t.layer : '';
    elLayer.hidden = !t.layer;
    var n = lessonNum(t.lesson), here = btn.closest('.lesson');
    elSeen.textContent = '';
    if (here && here.id === t.lesson) elSeen.textContent = EN ? 'Explained in this lesson' : 'Explicado nesta aula';
    else if (n) {
      var a = document.createElement('a');
      a.href = '#' + t.lesson; a.textContent = (EN ? 'Lesson ' : 'Aula ') + n;
      var ic = document.createElement('i'); ic.className = 'ico ico-next'; ic.setAttribute('aria-hidden', 'true'); a.appendChild(ic);
      elSeen.appendChild(document.createTextNode(EN ? 'Seen in: ' : 'Visto em: ')); elSeen.appendChild(a);
    }
    card.classList.toggle('gl-sheet', !isDesktop());
    card.setAttribute('aria-hidden', 'false');
    card.classList.add('open');
    place(btn);
    if (swap) {
      // conteúdo novo entra por baixo (fade + 4px) e, no desktop, a ficha desliza da posição anterior para a nova
      [elName, elDef, card.querySelector('.gl-meta')].forEach(function (n, i) {
        n.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: i * 30, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
      if (before) {
        var now = card.getBoundingClientRect(), dx = before.left - now.left, dy = before.top - now.top;
        if (card.__glide) card.__glide.cancel();
        if (dx || dy) card.__glide = card.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    }
    if (!isDesktop()) {
      var r = btn.getBoundingClientRect(), room = window.innerHeight - card.offsetHeight - 24;
      if (r.bottom > room) window.scrollBy({ top: r.bottom - room, behavior: reduce && reduce.matches ? 'auto' : 'smooth' });
    }
    if (pin) card.focus({ preventScroll: true });
  }

  function close(back) {
    clearTimeout(timer);
    if (!cur) return;
    var b = cur; cur = null; pinned = false;
    b.setAttribute('aria-expanded', 'false');
    card.classList.remove('open');
    card.setAttribute('aria-hidden', 'true');
    if (back) b.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.gl-term') : null;
    if (t) {
      if (cur === t && pinned) close(true); else open(t, true);
      return;
    }
    if (cur && !card.contains(e.target)) close(false);
  });
  elClose.addEventListener('click', function () { close(true); });
  card.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    e.preventDefault(); close(false);
    if (location.hash !== '#' + id) location.hash = id;
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cur) { e.stopPropagation(); close(true); return; }
    if (e.key !== 'Tab' || !cur || !card.contains(document.activeElement)) return;
    var items = card.querySelectorAll('a, button'), first = card, lastEl = items[items.length - 1];
    if (!e.shiftKey && document.activeElement === lastEl) close(true);
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); close(true); }
  }, true);
  var wasDesktop = isDesktop();
  window.addEventListener('resize', function () {
    var d = isDesktop();
    if (d !== wasDesktop) { wasDesktop = d; close(false); }
    else if (cur && d) place(cur);
  });

  /* desktop: abre ao passar o mouse, com pequeno atraso, e fecha ao sair */
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse' || !isDesktop()) return;
    var t = e.target.closest ? e.target.closest('.gl-term') : null;
    if (t) {
      clearTimeout(timer);
      if (cur === t) return;
      timer = setTimeout(function () { open(t, false); }, 350);
    } else if (card.contains(e.target)) clearTimeout(timer);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse' || !isDesktop()) return;
    var from = e.target.closest ? e.target.closest('.gl-term') : null;
    var inCard = card.contains(e.target);
    if (!from && !inCard) return;
    var to = e.relatedTarget;
    if (to && (card.contains(to) || (to.closest && to.closest('.gl-term') === cur))) return;
    clearTimeout(timer);
    if (cur && !pinned) timer = setTimeout(function () { close(false); }, 250);
  });

  /* ---- 3. botão "Glossário" do painel do índice ---- */
  var all = document.getElementById('glossario');
  Array.prototype.forEach.call(document.querySelectorAll('[data-gl-open]'), function (b) {
    b.addEventListener('click', function () {
      var st = document.querySelector('.pg-status');
      if (st && st.getAttribute('aria-expanded') === 'true') st.click();
      if (!all) return;
      all.open = true;
      var s = all.querySelector('summary');
      s.scrollIntoView({ block: 'start' });
      s.focus({ preventScroll: true });
    });
  });
})();
