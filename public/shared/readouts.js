/* ---------- números de destaque: 7 segmentos nos widgets, matriz de pontos na nota do quiz ----------
   Camada por cima do HTML que os widgets e o quiz já escrevem; eles não mudam.
   - .sr-fact b (fato de widget) e [data-seg7]: se o texto for número + unidade curta, vira mostrador de 7 segmentos.
   - .q-score (nota do quiz): "38 de 46" / "38 of 46" vira 38/46 em pontos de LED.
   O texto original fica para o leitor de tela (aria-label); o desenho é aria-hidden.
   Quando o mesmo elemento muda de valor, os segmentos acesos entram em varredura (sr-sweep). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  /* o gato de pelúcia da Lena (shared/cat.svg): aparece nos fechamentos (módulo completo, quiz gabaritado).
     window.sdlCat(depoisDeste) põe o gato logo depois do elemento, uma vez só, entrando com um pulinho. */
  var catSvg = null;
  window.sdlCat = function (after) {
    if (!after || (after.nextElementSibling && after.nextElementSibling.classList.contains('sdl-cat'))) return;
    var put = function () {
      if (after.nextElementSibling && after.nextElementSibling.classList.contains('sdl-cat')) return;
      var d = document.createElement('div'); d.className = 'sdl-cat'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = catSvg;
      after.insertAdjacentElement('afterend', d);
    };
    if (catSvg) return put();
    fetch(BASE + 'cat.svg').then(function (r) { return r.text(); }).then(function (t) { catSvg = t.replace(/<!--[\s\S]*?-->/g, ''); put(); }).catch(function () {});
  };

  // 7 segmentos (a-g) num quadro 12x22, com a inclinação leve dos mostradores de verdade
  var SEGS = { a: '2,1 10,1 8.5,3 3.5,3', b: '10.5,1.5 10.5,10.3 8.7,9.2 8.7,3.3', c: '10.5,11.7 10.5,20.5 8.7,18.7 8.7,12.8', d: '2,21 10,21 8.5,19 3.5,19',
    e: '1.5,11.7 1.5,20.5 3.3,18.7 3.3,12.8', f: '1.5,1.5 1.5,10.3 3.3,9.2 3.3,3.3', g: '2.2,11 3.7,10 8.3,10 9.8,11 8.3,12 3.7,12' };
  var D7 = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g' };
  function seg7(digits, h) {
    var k = h / 22, gap = 3.5 * k, x = 0, out = '';
    for (var i = 0; i < digits.length; i++) {
      var ch = digits[i];
      if (ch === '.' || ch === ',') { out += '<circle class="on" cx="' + (x + 0.2 * k) + '" cy="' + (h - 1.2 * k) + '" r="' + (1.3 * k) + '"/>'; x += 3.2 * k; continue; }
      if (ch === ':') { out += '<circle class="on" cx="' + (x + 1.4 * k) + '" cy="' + (7 * k) + '" r="' + (1.3 * k) + '"/><circle class="on" cx="' + (x + 1.4 * k) + '" cy="' + (15 * k) + '" r="' + (1.3 * k) + '"/>'; x += 4 * k + gap; continue; }
      if (ch === ' ') { x += 5 * k; continue; }
      var on = D7[ch] || '';
      out += '<g transform="translate(' + x + ' 0) scale(' + k + ') skewX(-6) translate(1.2 0)">';
      for (var n in SEGS) out += '<polygon class="' + (on.indexOf(n) >= 0 ? 'on' : 'off') + '" points="' + SEGS[n] + '"/>';
      out += '</g>'; x += 12 * k + gap;
    }
    var w = Math.max(1, x - gap);
    return '<svg width="' + w.toFixed(1) + '" height="' + h + '" viewBox="0 0 ' + w.toFixed(1) + ' ' + h + '" aria-hidden="true">' + out + '</svg>';
  }

  // matriz 5x7: 1 = ponto aceso
  var G = { '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    '/': ['00001', '00001', '00010', '00100', '01000', '10000', '10000'] };
  function dots(text, pitch) {
    var r = pitch * 0.38, x = 0, col = 0, out = '';
    for (var c = 0; c < text.length; c++) {
      var g = G[text[c]]; if (!g) continue;
      for (var y = 0; y < 7; y++) for (var i = 0; i < g[y].length; i++)
        out += '<circle class="' + (g[y][i] === '1' ? 'on' : 'off') + '" style="--c:' + (col + i) + '" cx="' + (x + i * pitch + pitch / 2) + '" cy="' + (y * pitch + pitch / 2) + '" r="' + r + '"/>';
      x += (g[0].length + 1) * pitch; col += g[0].length + 1;
    }
    var w = x - pitch, h = 7 * pitch;
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + out + '</svg>';
  }

  // número (com separadores) + unidade curta opcional: "12,5 ms", "4.800", "92%", "1:30", "-3"
  var NUM = /^\s*(-?[\d][\d.,: ]*)\s*(%|[A-Za-zµ°/]{1,6}(?:\/[A-Za-z]{1,3})?)?\s*$/;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function paint(el, text, html, unit) {
    var changed = el.__rv !== undefined && el.__rv !== text;
    el.__rv = text; el.__busy = true;
    el.setAttribute('aria-label', text); el.setAttribute('role', 'img');
    el.innerHTML = html + (unit ? '<span class="rv-unit" aria-hidden="true">' + unit + '</span>' : '');
    el.classList.toggle('rv-sweep', changed && !reduce);
    el.__busy = false;
  }
  function doSeg(el) {
    if (el.__busy) return;
    var text = el.__rv !== undefined && el.querySelector('svg') ? el.__rv : el.textContent;
    if (el.querySelector('svg') && text === el.__rv) return;
    var m = NUM.exec(text);
    if (!m || m[1].replace(/\D/g, '').length > 9) { el.classList.remove('rv-seg'); return; }
    el.classList.add('rv-seg');
    var h = Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.9) || 22;
    paint(el, text.trim(), seg7(m[1].trim(), h), m[2]);
  }
  function doScore(el) {
    if (el.__busy || el.querySelector('svg')) return;
    var m = /(\d+)\D+(\d+)/.exec(el.textContent); if (!m) return;
    el.classList.add('rv-dots');
    var pitch = Math.max(5, Math.round(parseFloat(getComputedStyle(el).fontSize) / 9));
    paint(el, el.textContent.replace(/\s*✓\s*$/, '').trim(), dots(m[1] + '/' + m[2], pitch));
    if (m[1] === m[2]) window.sdlCat(el);   // gabaritou: o gato aparece
  }
  function scan(root) {
    if (!root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('.sr-fact b, [data-seg7]'), doSeg);
    Array.prototype.forEach.call(root.querySelectorAll('.q-score'), doScore);
  }
  function start() {
    scan(document);
    var pending = false;
    new MutationObserver(function (list) {
      // os widgets reescrevem o próprio HTML a cada mudança: varre de novo na próxima pintura
      for (var i = 0; i < list.length; i++) { var t = list[i].target; if (t.__busy || (t.parentNode && t.parentNode.__busy)) continue;
        if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; scan(document); }); } }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
