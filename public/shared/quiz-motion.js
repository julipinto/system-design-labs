/* ---------- movimento do quiz ----------
   Camada por cima do DOM que cada quiz.js escreve em #app; os quiz.js não mudam.
   Observa o que entra e o que muda, e anima só transform/opacity/clip-path.
   - tela nova: a anterior sai (cópia por cima) e a próxima entra do lado para onde a pessoa foi
   - alternativa marcada: certa assenta, errada desloca 3px uma vez só
   - explicação (.q-fb): abre de cima para baixo
   - barras de progresso: crescem a partir do valor anterior
   - tela final: elementos chegam em sequência curta (o placar .q-score tem a varredura do readouts.js)
   A caixa de marcar dos tópicos é CSS puro (quiz.css). Com prefers-reduced-motion: só um fade de 120 ms. */
(function () {
  'use strict';
  var app = document.getElementById('app');
  if (!app || !app.animate || !window.MutationObserver) return;

  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function reduced() { return mq.matches; }
  function go(el, kf, opt) {
    try { return el.animate(kf, opt); } catch (e) { return null; }
  }
  function fade(el) { go(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'linear' }); }

  function pctOf(i) { var v = i && parseFloat(i.style.width); return isNaN(v) ? 0 : v; }
  function grow(i, from, to) {
    if (reduced() || !(to > 0) || from === to) return;
    go(i, [{ transform: 'scaleX(' + (from / to) + ')' }, { transform: 'scaleX(1)' }], { duration: 360, easing: EASE });
  }

  function kindOf(s) {
    if (!s) return 'none';
    if (s.querySelector('.q-bar')) return 'ask';
    if (s.querySelector('.q-score')) return 'end';
    return 'home';
  }

  /* a anterior já saiu do DOM: devolvo uma cópia inerte, por cima, só para sair */
  function leave(old, now, dx) {
    if (!old || reduced()) return;
    var ghost = old.cloneNode(true);
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('inert', '');
    ghost.style.cssText = 'position:absolute;pointer-events:none;top:' + now.offsetTop + 'px;left:' + now.offsetLeft + 'px;width:' + now.offsetWidth + 'px';
    app.appendChild(ghost);
    var a = go(ghost, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-dx) + 'px)' }], { duration: 180, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    if (a) a.onfinish = function () { ghost.remove(); }; else ghost.remove();
  }

  function screenChange(now, old) {
    var kind = kindOf(now), prev = kindOf(old);
    if (reduced()) { fade(now); return; }
    if (kind === 'ask') {
      go(now, [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: EASE });
      leave(old, now, 24);
      var fill = now.querySelector('.q-bar > i');
      grow(fill, prev === 'ask' ? pctOf(old.querySelector('.q-bar > i')) : 0, pctOf(fill));
    } else if (kind === 'end') {
      /* chegada em sequência; o placar fica de fora porque o readouts.js já o varre */
      var kids = Array.prototype.slice.call(now.children);
      kids.forEach(function (el, i) {
        if (el.classList.contains('q-score')) return;
        go(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: EASE, delay: Math.min(i, 7) * 60, fill: 'backwards' });
      });
      leave(old, now, 24);
    } else {
      /* início: volta para a esquerda */
      go(now, [{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
      leave(old, now, -20);
    }
  }

  function feedback(fb) {
    if (reduced()) { fade(fb); return; }
    /* abre de cima para baixo: o recorte desce e o conteúdo assenta uns pixels */
    go(fb, [{ clipPath: 'inset(0 0 100% 0)', opacity: 0.4, transform: 'translateY(-6px)' }, { clipPath: 'inset(0 0 0 0)', opacity: 1, transform: 'none' }], { duration: 380, easing: EASE });
  }

  function classAdded(el, cls, oldClass) { return el.classList.contains(cls) && (' ' + oldClass + ' ').indexOf(' ' + cls + ' ') < 0; }

  function marked(el, oldClass) {
    if (reduced()) return;
    var badge = el.querySelector('.q-badge');
    if (badge && badge.textContent) go(badge, [{ opacity: 0, transform: 'translateX(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: EASE });
    if (classAdded(el, 'is-wrong', oldClass)) {
      /* um único deslocamento mínimo */
      go(el, [{ transform: 'none' }, { transform: 'translateX(-3px)', offset: 0.4 }, { transform: 'none' }], { duration: 240, easing: EASE });
    } else if (classAdded(el, 'is-right', oldClass)) {
      go(el, [{ transform: 'scale(.988)' }, { transform: 'scale(1.01)', offset: 0.55 }, { transform: 'none' }], { duration: 300, easing: EASE });
    }
  }

  new MutationObserver(function (recs) {
    var now = null, old = null;
    recs.forEach(function (r) {
      if (r.type === 'childList') {
        if (r.target === app) {
          Array.prototype.forEach.call(r.addedNodes, function (n) { if (n.classList && n.classList.contains('q-screen')) now = n; });
          Array.prototype.forEach.call(r.removedNodes, function (n) { if (n.classList && n.classList.contains('q-screen')) old = n; });
        } else if (r.target.classList && r.target.classList.contains('q-live')) {
          Array.prototype.forEach.call(r.addedNodes, function (n) { if (n.classList && n.classList.contains('q-fb')) feedback(n); });
        }
      } else if (r.attributeName === 'class') {
        var el = r.target, was = r.oldValue || '';
        if (!el.isConnected || !el.matches('.q-btn, .q-slot')) return;
        if (classAdded(el, 'is-right', was) || classAdded(el, 'is-wrong', was)) marked(el, was);
        else if (el.classList.contains('q-slot') && classAdded(el, 'is-filled', was) && !reduced())
          go(el, [{ transform: 'scale(.985)' }, { transform: 'none' }], { duration: 180, easing: EASE });
      } else if (r.attributeName === 'style' && r.target.parentNode && r.target.parentNode.classList.contains('q-meter')) {
        /* medidor da tela inicial muda quando se marcam tópicos */
        var m = /width:\s*([\d.]+)%/.exec(r.oldValue || '');
        grow(r.target, m ? parseFloat(m[1]) : 0, pctOf(r.target));
      }
    });
    if (now) screenChange(now, old);
  }).observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'], attributeOldValue: true });
})();
