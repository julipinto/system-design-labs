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
        if (!ck) { ck = document.createElement('span'); ck.className = 'ico ico-check toc-ck'; ck.setAttribute('aria-label', EN ? 'understood' : 'entendida'); a.appendChild(ck); }
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
    });
  }

  function show(i, scroll) {
    cur = i; save('cur', lessons[i].id);
    if (mode === 'focus') lessons.forEach(function (l, k) { l.hidden = k !== i; });
    render();
    if (scroll) lessons[i].scrollIntoView();
  }
  function setHash(id) { try { if (location.hash !== '#' + id) location.hash = id; } catch (e) { /* ignora */ } }
  function go(i) { if (i < 0 || i >= N) return; closePanel(); show(i, true); setHash(lessons[i].id); }

  /* índice */
  function openPanel() { panel.hidden = false; statusBtn.setAttribute('aria-expanded', 'true'); var a = tocLinks[cur]; if (a) a.focus(); }
  function closePanel(back) { if (panel.hidden) return; panel.hidden = true; statusBtn.setAttribute('aria-expanded', 'false'); if (back) statusBtn.focus(); }
  statusBtn.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanel(true); });
  document.addEventListener('click', function (e) { if (!panel.hidden && !bar.contains(e.target)) closePanel(); });
  tocLinks.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); go(i); }); });
  prevBtn.addEventListener('click', function () { go(cur - 1); });
  nextBtn.addEventListener('click', function () { go(cur + 1); });

  /* botões do fim da aula */
  lessons.forEach(function (ls, i) {
    var b = ls.querySelector('.done-btn');
    if (b) b.addEventListener('click', function () {
      if (done[ls.id]) delete done[ls.id]; else done[ls.id] = true;
      save('done', JSON.stringify(Object.keys(done)));
      render();
    });
    Array.prototype.forEach.call(ls.querySelectorAll('[data-nav]'), function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); go(i + (a.getAttribute('data-nav') === 'next' ? 1 : -1)); });
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
    if (i < 0) return;
    closePanel();
    if (mode === 'all') { if (i !== cur) { cur = i; save('cur', lessons[i].id); render(); } }
    else if (i !== cur || lessons[i].hidden) show(i, true);
  });

  /* início */
  root.classList.add('js');
  root.classList.toggle('focus', mode === 'focus');
  panel.hidden = true;
  sw.setAttribute('aria-checked', String(mode === 'all'));
  if (mode === 'focus') { show(cur, hashIdx() >= 0); } else { render(); }
  fitTrail();
})();
