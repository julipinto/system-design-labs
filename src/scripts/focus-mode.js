/* ---------- modo foco, barra de estado, concluídas e flashcards ---------- */
// o pacote da trilha anda com mola (Motion anima transform, fora da thread de layout)
import { animate } from 'motion';
(function () {
  'use strict';
  var EN = /^en/.test(document.documentElement.lang);   // versão em inglês (/en/)
  var root = document.querySelector('.sdl-content');
  if (!root) return;
  var lessons = Array.prototype.slice.call(root.querySelectorAll('.lesson'));
  var N = lessons.length;
  if (!N) return;
  var KEY = 'sdl-' + (root.getAttribute('data-module') || 'protocolos-de-rede') + ':';
  function save(k, v) { try { localStorage.setItem(KEY + k, v); } catch (e) { /* sem storage: segue sem lembrar */ } }
  function load(k) { try { return localStorage.getItem(KEY + k); } catch (e) { return null; } }
  function $(sel, ctx) { return (ctx || root).querySelector(sel); }

  var bar = $('.sdl-progress'), statusBtn = $('.pg-status'), statusText = $('.pg-text'), panel = $('.pg-panel');
  var prevBtn = $('[data-pg="prev"]'), nextBtn = $('[data-pg="next"]'), track = $('.pg-track'), count = $('.pg-count');
  var sw = $('.pg-switch'), tocLinks = Array.prototype.slice.call(root.querySelectorAll('.toc a'));
  if (!bar || !statusBtn || !panel) return;

  function idxOf(id) { for (var i = 0; i < N; i++) if (lessons[i].id === id) return i; return -1; }
  function hashIdx() { var h = ''; try { h = decodeURIComponent(location.hash.replace(/^#/, '')); } catch (e) { h = ''; } return idxOf(h); }

  var mode = load('mode') === 'all' ? 'all' : 'focus';
  var done = {};
  try { (JSON.parse(load('done') || '[]') || []).forEach(function (id) { if (idxOf(id) >= 0) done[id] = true; }); } catch (e) { done = {}; }
  var cur = hashIdx();
  if (cur < 0) cur = Math.max(0, idxOf(load('cur') || ''));

  function doneCount() { var c = 0; lessons.forEach(function (l) { if (done[l.id]) c++; }); return c; }
  function title(l) { return l.querySelector('h2').textContent; }

  /* trilha do pacote: uma estação por aula, trilha pontilhada entre elas, o pacote na aula atual */
  var stations = [], links = [];
  lessons.forEach(function (l, i) {
    var st = document.createElement('span'); st.className = 'pg-st'; track.appendChild(st); stations.push(st);
    if (i < N - 1) { var ln = document.createElement('span'); ln.className = 'pg-link'; ln.appendChild(document.createElement('i')); track.appendChild(ln); links.push(ln); }
  });
  var pkt = document.createElement('span'); pkt.className = 'pg-pkt'; track.appendChild(pkt);
  track.setAttribute('aria-valuemax', String(N));
  var pktAt = -1, pktAnim = null;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function placePkt(move) {
    var st = stations[cur]; if (!st || !st.offsetWidth) return;
    var x = st.offsetLeft + st.offsetWidth / 2, go = move && !still && pktAt >= 0 && pktAt !== cur;
    pktAt = cur;
    if (pktAnim) pktAnim.stop();
    // a troca de aula já mexe no layout e rola a página: o pacote sai no quadro seguinte, quando isso assentou
    if (go) requestAnimationFrame(function () { pktAnim = animate(pkt, { x: x }, { type: 'spring', stiffness: 170, damping: 24, mass: 1 }); });
    else pktAnim = animate(pkt, { x: x }, { duration: 0 });
  }
  // muitas aulas para a largura: estação e pacote encolhem para não encostar
  function fitTrail() { track.classList.toggle('dense', track.clientWidth / N < 26); placePkt(false); }
  addEventListener('resize', fitTrail);

  var rendered = false;
  function render() {
    var dc = doneCount(), l = lessons[cur];
    statusText.textContent = '';
    var pn = document.createElement('span'); pn.className = 'pg-n'; pn.textContent = (EN ? 'Lesson ' + (cur + 1) + ' of ' : 'Aula ' + (cur + 1) + ' de ') + N + ' · ';
    var pm = document.createElement('span'); pm.className = 'pg-min'; pm.textContent = ' · ~' + l.getAttribute('data-min') + ' min';
    statusText.appendChild(pn); statusText.appendChild(document.createTextNode(title(l))); statusText.appendChild(pm);
    if (rendered && pktAt !== cur) { statusText.classList.remove('swap'); void statusText.offsetWidth; statusText.classList.add('swap'); }
    count.textContent = dc + '/' + N;
    track.setAttribute('aria-valuenow', String(dc));
    track.setAttribute('aria-valuetext', EN ? dc + ' of ' + N + ' lessons understood' : dc + ' de ' + N + ' aulas entendidas');
    stations.forEach(function (s, i) { var was = / done/.test(s.className), now = !!done[lessons[i].id]; s.className = 'pg-st' + (now ? ' done' : '') + (now && !was && rendered ? ' just' : '') + (i === cur ? ' cur' : ''); });
    links.forEach(function (ln, i) { ln.classList.toggle('lit', i < cur); });
    placePkt(rendered);
    rendered = true;
    prevBtn.disabled = cur === 0; nextBtn.disabled = cur === N - 1;
    tocLinks.forEach(function (a, i) {
      var ck = a.querySelector('.toc-ck');
      if (done[lessons[i] && lessons[i].id]) {
        // o check do índice se desenha só quando a aula é concluída agora (não na carga da página)
        if (!ck) { ck = document.createElement('span'); ck.className = 'ico ico-check toc-ck' + (rendered ? ' fresh' : ''); ck.setAttribute('aria-label', EN ? 'understood' : 'entendida'); a.appendChild(ck); }
      } else if (ck) a.removeChild(ck);
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    lessons.forEach(function (ls, i) {
      var b = ls.querySelector('.done-btn'), msg = ls.querySelector('.done-msg'), nx = ls.querySelector('[data-nav="next"]');
      var isDone = !!done[ls.id];
      ls.classList.toggle('is-done', isDone);
      if (b) { var justDone = isDone && b.getAttribute('aria-pressed') === 'false' && rendered; b.classList.toggle('just', justDone); b.setAttribute('aria-pressed', String(isDone)); b.textContent = EN ? (isDone ? 'Lesson understood (click to undo)' : 'I understood this lesson') : (isDone ? 'Aula entendida (clique para desfazer)' : 'Entendi esta aula');
        var bi = document.createElement('i'); bi.className = 'ico ico-check'; bi.setAttribute('aria-hidden', 'true'); b.insertBefore(bi, isDone ? b.firstChild : null); }
      if (msg) msg.textContent = !isDone ? '' : EN ? dc + ' of ' + N + ' understood' + (i < N - 1 ? ' · Next: Lesson ' + (i + 2) + ', ' + title(lessons[i + 1]) : ' · Module complete!')
        : dc + ' de ' + N + ' entendidas' + (i < N - 1 ? ' · Próxima: Aula ' + (i + 2) + ', ' + title(lessons[i + 1]) : ' · Módulo completo!');
      if (nx) nx.className = 'btn big' + (isDone ? ' primary' : '');
      // módulo completo: o gato aparece embaixo da mensagem, só na aula aberta; desfazer tira o gato
      var cat = msg && msg.nextElementSibling && msg.nextElementSibling.classList.contains('sdl-cat') ? msg.nextElementSibling : null;
      if (msg && isDone && dc === N && i === cur && window.sdlCat) window.sdlCat(msg);
      else if (cat && dc < N) cat.remove();
    });
  }

  /* troca de aula no modo foco: a atual sai rápido para o lado de onde a pessoa veio e a nova entra do lado para onde ela foi.
     A rolagem e o pacote rodam no instante da troca (commit), depois da saída, para não brigar com a animação. */
  var pending = -1, swapTok = 0, swapOut = null;
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  function swap(i, scroll, dir) {
    var old = lessons[cur], tok = ++swapTok;
    pending = i;
    if (swapOut) swapOut.cancel();
    var out = swapOut = old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dir * 10) + 'px)' }], { duration: 110, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    out.onfinish = function () {
      if (tok !== swapTok) return;          // outra troca começou: ela cuida do resto
      out.cancel(); swapOut = null; pending = -1;
      commit(i, scroll);
      lessons[i].animate([{ opacity: 0, transform: 'translateX(' + (dir * 18) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
    };
  }
  function show(i, scroll, dir) {
    if (dir && !still && mode === 'focus' && i !== cur && !lessons[cur].hidden) swap(i, scroll, dir);
    else { swapTok++; if (swapOut) { swapOut.cancel(); swapOut = null; } pending = -1; commit(i, scroll); }
  }
  function commit(i, scroll) {
    cur = i; save('cur', lessons[i].id);
    if (mode === 'focus') lessons.forEach(function (l, k) { l.hidden = k !== i; });
    render();
    if (scroll) lessons[i].scrollIntoView();
  }
  function setHash(id) { try { if (location.hash !== '#' + id) location.hash = id; } catch (e) { /* ignora */ } }
  function at() { return pending >= 0 ? pending : cur; }   // aula de destino, se uma troca está no ar
  function go(i) { if (i < 0 || i >= N) return; if (i === at()) { closePanel(); if (pending < 0) show(i, true); return; } closePanel(); show(i, true, i > at() ? 1 : -1); setHash(lessons[i].id); }

  /* índice: abre com recorte de cima para baixo e os itens entram em fila curtíssima (16 ms cada, só na abertura); fecha pelo mesmo caminho */
  var panelOpen = false, panelAnim = null;
  function openPanel() {
    if (panelAnim) { panelAnim.cancel(); panelAnim = null; }
    panelOpen = true; panel.hidden = false; statusBtn.setAttribute('aria-expanded', 'true');
    if (!still) {
      panelAnim = panel.animate([{ clipPath: 'inset(0 -40px 100% -40px)', transform: 'translateY(-6px)', opacity: .5 }, { clipPath: 'inset(0 -40px -40px -40px)', transform: 'none', opacity: 1 }], { duration: 300, easing: EASE });
      tocLinks.forEach(function (a, k) {
        a.animate([{ opacity: 0, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 40 + Math.min(k, 12) * 16, easing: EASE, fill: 'backwards' });
      });
    }
    var a = tocLinks[cur]; if (a) a.focus({ preventScroll: true });
  }
  function closePanel(back) {
    if (!panelOpen) return;
    panelOpen = false; statusBtn.setAttribute('aria-expanded', 'false');
    if (back) statusBtn.focus();
    if (panelAnim) { panelAnim.cancel(); panelAnim = null; }
    if (still) { panel.hidden = true; return; }
    var a = panelAnim = panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 150, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    a.onfinish = function () { if (panelAnim === a) { panel.hidden = true; a.cancel(); panelAnim = null; } };
  }
  statusBtn.addEventListener('click', function () { panelOpen ? closePanel() : openPanel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(true); });
  document.addEventListener('click', function (e) { if (panelOpen && !bar.contains(e.target)) closePanel(); });
  tocLinks.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); go(i); }); });
  prevBtn.addEventListener('click', function () { go(at() - 1); });
  nextBtn.addEventListener('click', function () { go(at() + 1); });

  /* botões do fim da aula */
  lessons.forEach(function (ls, i) {
    var b = ls.querySelector('.done-btn');
    if (b) b.addEventListener('click', function () {
      if (done[ls.id]) delete done[ls.id]; else done[ls.id] = true;
      save('done', JSON.stringify(Object.keys(done)));
      render();
    });
    Array.prototype.forEach.call(ls.querySelectorAll('[data-nav]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(at() + (a.getAttribute('data-nav') === 'next' ? 1 : -1)); });
    });
    /* flashcards */
    Array.prototype.forEach.call(ls.querySelectorAll('.fc-q'), function (q, k) {
      var a = q.nextElementSibling;
      if (!a) return;
      var aid = 'fc-' + (i + 1) + '-' + (k + 1);
      a.id = aid; q.setAttribute('aria-controls', aid);
      a.hidden = true; q.setAttribute('aria-expanded', 'false');
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') !== 'true';
        q.setAttribute('aria-expanded', String(open)); a.hidden = !open;
      });
    });
  });

  /* modo foco x ver tudo */
  function nearest() {
    var best = 0;
    for (var i = 0; i < N; i++) { if (lessons[i].hidden) continue; if (lessons[i].getBoundingClientRect().top <= 140) best = i; }
    return best;
  }
  function setMode(m) {
    var from = mode;
    if (m === 'focus' && from === 'all') cur = nearest();
    mode = m; save('mode', m);
    root.classList.toggle('focus', m === 'focus');
    sw.setAttribute('aria-checked', String(m === 'all'));
    if (m === 'all') { lessons.forEach(function (l) { l.hidden = false; }); render(); lessons[cur].scrollIntoView(); }
    else show(cur, true);
    closePanel();
  }
  sw.addEventListener('click', function () { setMode(mode === 'all' ? 'focus' : 'all'); });

  /* em "ver tudo", a barra acompanha a rolagem */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (mode !== 'all' || ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var i = nearest();
      if (i !== cur) { cur = i; save('cur', lessons[i].id); render(); }
    });
  }, { passive: true });

  /* botão voltar / hash colado */
  window.addEventListener('hashchange', function () {
    var i = hashIdx();
    if (i < 0 || i === pending) return;   // a troca animada já está a caminho desta aula
    closePanel();
    if (mode === 'all') { if (i !== cur) { cur = i; save('cur', lessons[i].id); render(); } }
    else if (i !== cur || lessons[i].hidden) show(i, true, i > cur ? 1 : -1);
  });

  /* início */
  root.classList.add('js');
  root.classList.toggle('focus', mode === 'focus');
  panel.hidden = true;
  sw.setAttribute('aria-checked', String(mode === 'all'));
  if (mode === 'focus') { show(cur, hashIdx() >= 0); } else { render(); }
  fitTrail();
})();
