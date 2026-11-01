/* ---------- fim do quiz: ponte para o próximo capítulo ----------
   Camada por cima do DOM que cada quiz.js escreve em #app (os quiz.js não mudam). Quando a tela final aparece
   (tem o placar .q-score), acrescenta embaixo o capítulo seguinte da história, lido de chapters.json (gerado no build). */
(function () {
  'use strict';
  var app = document.getElementById('app'), me = document.currentScript;
  var m = location.pathname.match(/\/(en\/)?labs\/([^/]+)\/quiz\//);
  if (!app || !me || !m || !window.MutationObserver || !window.fetch) return;
  var EN = !!m[1], slug = m[2];
  var base = me.src.replace(/shared\/next-chapter\.js.*$/, '');
  var next = null;
  fetch(base + (EN ? 'en/' : '') + 'chapters.json').then(function (r) { return r.json(); }).then(function (all) { next = all[slug] || null; put(); }).catch(function () {});
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function put() {
    if (!next) return;
    var score = app.querySelector('.q-score');
    if (!score) return;
    var screen = score.closest('section') || score.parentNode;
    if (screen.querySelector('.q-next-ch')) return;
    var box = el('div', 'q-next-ch');
    box.appendChild(el('p', 'q-next-ch-k', EN ? 'Next chapter' : 'Próximo capítulo'));
    box.appendChild(el('p', 'q-next-ch-t', next.title));
    if (next.lead) box.appendChild(el('p', 'q-next-ch-lead', next.lead));
    var a = el('a', 'q-btn', EN ? 'Start the chapter →' : 'Começar o capítulo →'); a.href = next.href;
    box.appendChild(a);
    screen.appendChild(box);
  }
  new MutationObserver(put).observe(app, { childList: true, subtree: true });
})();
