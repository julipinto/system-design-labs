/* SDLabs · Estratégias de Cache: widgets em JS puro
   (relógio de TTL, simulador de evicção, calculadora de hit rate, chave do proxy da CDN).
   Todos usam a loja do brief: produto:42 (gato de pelúcia), banco 40 ms, Redis 1 ms, TTL 60 s, 3 vagas. */
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
  function fmt(v) { return Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 }); }

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
  function table(rows) {
    var tb = el('tbody');
    rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { class: /^\S{24,}$/.test(r[1]) ? 'ck-long' : null, text: r[1] })])); });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]);
  }

  /* =============== AULA 2: relógio de TTL com o preço velho =============== */
  var TTL = 60, SPAN = 120;
  function wTtl(root) {
    var CHANGES = [5, 20, 45, 59];
    var S = { c: 1, del: 0, t: 30 };
    var cB = [], dB = [];
    var slider = el('input', { type: 'range', min: '0', max: String(SPAN), step: '1', value: String(S.t), 'aria-label': 'Instante em que a Bia abre a página, em segundos' });
    var readout = el('p', { class: 'ttl-read', 'aria-live': 'polite' });
    var track = el('div', { class: 'ttl-track', role: 'img' });
    var scale = el('div', { class: 'ttl-scale' });
    var out = el('div', { class: 'ttl-out', 'aria-live': 'polite' });

    function render() {
      press(cB, S.c); press(dB, S.del);
      var tc = CHANGES[S.c], t = S.t, del = S.del === 1;
      var staleFrom = tc, staleTo = del ? tc : TTL;
      clear(track);
      function seg(cls, from, to, label) {
        if (to <= from) return;
        track.appendChild(el('div', { class: 'ttl-seg ' + cls, style: 'width:' + ((to - from) / SPAN * 100) + '%', text: to - from >= 14 ? label : '' }));
      }
      seg('ok', 0, staleFrom, 'em dia');
      seg('bad', staleFrom, staleTo, 'velho');
      seg('ok', staleTo, SPAN, del ? 'em dia' : 'em dia (nova cópia)');
      track.appendChild(el('div', { class: 'ttl-mark', style: 'left:' + (t / SPAN * 100) + '%' }));
      track.setAttribute('aria-label', 'Linha do tempo de 0 a ' + SPAN + ' segundos: dado velho de ' + staleFrom + ' s a ' + staleTo + ' s');
      clear(scale);
      [0, tc, TTL, SPAN].forEach(function (v, i, a) {
        if (a.indexOf(v) !== i || (v === tc && TTL - tc < 8)) return;
        scale.appendChild(el('span', { style: 'left:' + (v / SPAN * 100) + '%', text: v + ' s' }));
      });

      readout.textContent = 'A Bia abre a página em t = ' + t + ' s';
      var cacheSay, bankSay, status, cls;
      if (t < tc) {
        cacheSay = 'hit, 1 ms: 89.90'; bankSay = '89.90'; status = 'Em dia: o cache e o banco dizem o mesmo preço.'; cls = 'ok';
      } else if (del) {
        cacheSay = 'miss: a chave foi apagada em t = ' + tc + ' s. Lê o banco (40 ms) e grava 79.90 de novo, com TTL de 60 s'; bankSay = '79.90';
        status = 'Em dia: quem gravou o preço também apagou produto:42, então o pedido seguinte já traz o 79.90.'; cls = 'ok';
      } else if (t < TTL) {
        cacheSay = 'hit, 1 ms: 89.90'; bankSay = '79.90';
        status = 'Dado velho há ' + (t - tc) + ' s. O cache não quebrou, só ficou para trás: o TTL ainda não venceu.'; cls = 'bad';
      } else {
        cacheSay = 'miss: o TTL venceu em t = 60 s. Lê o banco (40 ms) e grava 79.90 de novo'; bankSay = '79.90';
        status = 'Em dia: a cópia velha já saiu. Ela durou ' + (TTL - tc) + ' s depois da mudança.'; cls = 'ok';
      }
      clear(out);
      out.appendChild(table([
        ['O cache responde', cacheSay],
        ['O banco diz', bankSay],
        ['Dado velho no total', del ? '0 s (a chave foi apagada junto com a escrita)' : (TTL - tc) + ' s (de t = ' + tc + ' a t = ' + TTL + ')']
      ]));
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: status }));
    }
    slider.addEventListener('input', function () { S.t = Number(slider.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Quando o preço muda para 79.90 (o cache foi gravado em t = 0, TTL de 60 s)' }));
    root.appendChild(chipRow('Instante da mudança de preço', CHANGES.map(function (v) { return 't = ' + v + ' s'; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. O que a loja faz na hora da escrita' }));
    root.appendChild(chipRow('Invalidação', ['Só espera o TTL', 'Apaga produto:42 (DEL)'], dB, function (i) { S.del = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Arraste o relógio' }));
    root.appendChild(slider);
    root.appendChild(readout);
    root.appendChild(track);
    root.appendChild(scale);
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'O pior caso é mudar o preço logo depois de gravar o cache (t = 5 s): 55 s de dado velho. Os 60 s inteiros só acontecem se a mudança vem no mesmo instante da gravação.' }));
    render();
  }

  /* =============== AULA 3: simulador de evicção (LRU, LFU, FIFO) =============== */
  var CAPACITY = 3;
  var PRODUCTS = [42, 7, 13, 99, 5];
  var READY = [42, 7, 42, 13, 99];
  var POLICIES = ['LRU', 'LFU', 'FIFO'];
  function simulate(policy, seq) {
    var items = [], clock = 0, hits = 0, log = [];
    seq.forEach(function (k) {
      clock++;
      var it = items.filter(function (x) { return x.k === k; })[0];
      if (it) { it.last = clock; it.freq++; hits++; log.push({ k: k, hit: true }); return; }
      var gone = null;
      if (items.length >= CAPACITY) {
        var order = items.slice().sort(function (a, b) {
          if (policy === 'LRU') return a.last - b.last;
          if (policy === 'FIFO') return a.ins - b.ins;
          return a.freq - b.freq || a.ins - b.ins;
        });
        gone = order[0];
        items = items.filter(function (x) { return x !== gone; });
      }
      items.push({ k: k, ins: clock, last: clock, freq: 1 });
      log.push({ k: k, hit: false, gone: gone ? gone.k : null });
    });
    return { items: items.sort(function (a, b) { return a.ins - b.ins; }), hits: hits, log: log };
  }
  function wEvict(root) {
    var S = { seq: [] };
    var grid = el('div', { class: 'ls-grid ev-grid' });
    var hist = el('p', { class: 'sr-note ev-hist', 'aria-live': 'polite' });
    var bs = [];
    var bReady = el('button', { type: 'button', class: 'btn primary', text: 'Sequência pronta: 42, 7, 42, 13, 99' });
    var bNext = el('button', { type: 'button', class: 'btn', text: 'Pedir o produto:42 de novo' });
    var bReset = el('button', { type: 'button', class: 'btn', text: 'Reiniciar' });

    function render() {
      clear(grid);
      POLICIES.forEach(function (p) {
        var r = simulate(p, S.seq);
        var last = r.log[r.log.length - 1];
        var slots = el('ul', { class: 'ls-list ev-slots' });
        for (var i = 0; i < CAPACITY; i++) {
          var it = r.items[i];
          slots.appendChild(el('li', { class: 'ev-slot' + (it ? '' : ' empty'), text: it ? 'produto:' + it.k + (it.freq > 1 ? ' · ' + it.freq + ' pedidos' : '') : 'vaga livre' }));
        }
        var say = !last ? 'Peça um produto.' : last.hit ? 'produto:' + last.k + ': hit.' : last.gone != null ? 'produto:' + last.k + ': miss. Saiu o produto:' + last.gone + '.' : 'produto:' + last.k + ': miss, entrou numa vaga livre.';
        var total = r.log.length;
        grid.appendChild(el('div', { class: 'ls-panel' }, [
          el('p', { class: 'ls-h', text: p }),
          slots,
          el('p', { class: 'ev-say', text: say }),
          el('p', { class: 'sr-note', text: total ? r.hits + (r.hits === 1 ? ' hit' : ' hits') + ' em ' + total + (total === 1 ? ' pedido' : ' pedidos') : '' })
        ]));
      });
      clear(hist);
      hist.textContent = S.seq.length ? 'Pedidos: ' + S.seq.map(function (k) { return 'produto:' + k; }).join(' → ') : 'Nenhum pedido ainda. A sequência pronta é a da figura.';
      bNext.disabled = S.seq.length === 0;
    }
    function add(k) { S.seq.push(k); render(); }

    var row = el('div', { class: 'sr-chips', role: 'group', 'aria-label': 'Pedir um produto' });
    PRODUCTS.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'chip', text: k === 42 ? 'produto:42 (gato de pelúcia)' : 'produto:' + k });
      b.addEventListener('click', function () { add(k); });
      row.appendChild(b); bs.push(b);
    });
    bReady.addEventListener('click', function () { S.seq = READY.slice(); render(); });
    bNext.addEventListener('click', function () { add(42); });
    bReset.addEventListener('click', function () { S.seq = []; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Peça um produto (o cache tem 3 vagas)' }));
    root.appendChild(row);
    root.appendChild(el('div', { class: 'ib-ctrl' }, [bReady, bNext, bReset]));
    root.appendChild(hist);
    root.appendChild(grid);
    root.appendChild(el('p', { class: 'sr-note', text: 'Na LFU, o empate de pedidos se desfaz pelo mais antigo (quem entrou primeiro). Outras implementações desempatam de outro jeito.' }));
    render();
  }

  /* =============== AULA 4: calculadora de hit rate e tempo médio =============== */
  function wHitRate(root) {
    var TOTALS = [10, 1000], CACHES = [1, 0.05], DBS = [40, 10];
    var S = { n: 0, h: 8, c: 0, d: 0 };
    var nB = [], cB = [], dB = [];
    var slider = el('input', { type: 'range', min: '0', max: '10', step: '1', value: '8', 'aria-label': 'Quantidade de hits' });
    var label = el('p', { class: 'ttl-read', 'aria-live': 'polite' });
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(nB, S.n); press(cB, S.c); press(dB, S.d);
      var total = TOTALS[S.n], c = CACHES[S.c], d = DBS[S.d];
      slider.max = String(total);
      slider.step = total > 10 ? '10' : '1';
      if (S.h > total) S.h = total;
      slider.value = String(S.h);
      var hits = S.h, misses = total - hits, h = hits / total;
      var hitCost = c, missCost = c + d;
      var avg = h * hitCost + (1 - h) * missCost;
      var gain = d / avg;
      var be = c / d * 100;
      label.textContent = fmt(hits) + (hits === 1 ? ' hit e ' : ' hits e ') + fmt(misses) + (misses === 1 ? ' miss' : ' misses') + ' em ' + fmt(total) + ' pedidos';
      clear(out);
      out.appendChild(table([
        ['Hit rate', fmt(h * 100) + '% (' + hits + ' ÷ ' + fmt(total) + ')'],
        ['Custo de um hit', fmt(hitCost) + ' ms'],
        ['Custo de um miss', fmt(c) + ' + ' + fmt(d) + ' = ' + fmt(missCost) + ' ms'],
        ['Tempo médio com cache', fmt(h) + ' × ' + fmt(hitCost) + ' + ' + fmt(1 - h) + ' × ' + fmt(missCost) + ' = ' + fmt(avg) + ' ms'],
        ['Tempo sem cache', fmt(d) + ' ms'],
        ['O banco recebe', fmt((1 - h) * 100) + '% das leituras (' + fmt(misses) + ' de ' + fmt(total) + ')']
      ]));
      var worse = avg > d;
      out.appendChild(el('p', { class: 'ib-verdict ' + (worse ? 'bad' : 'ok'), text: worse
        ? 'O cache piora: ' + fmt(avg) + ' ms contra ' + fmt(d) + ' ms sem ele. Abaixo de ' + fmt(be) + '% de hit rate, o cache custa mais do que ajuda.'
        : 'O cache compensa: a página fica ' + fmt(gain) + ' vezes mais rápida. O ponto de equilíbrio nesta conta é ' + fmt(be) + '% de hit rate.' }));
    }
    slider.addEventListener('input', function () { S.h = Number(slider.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Pedidos contados' }));
    root.appendChild(chipRow('Pedidos contados', TOTALS.map(function (v) { return fmt(v) + ' pedidos'; }), nB, function (i) {
      var old = TOTALS[S.n]; S.n = i; S.h = Math.round(S.h / old * TOTALS[i]); render();
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Quantos foram hit' }));
    root.appendChild(slider);
    root.appendChild(label);
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Onde mora o cache' }));
    root.appendChild(chipRow('Velocidade do cache', ['Redis: 1 ms', 'Hashmap no app: 0,05 ms'], cB, function (i) { S.c = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '4. Velocidade do banco' }));
    root.appendChild(chipRow('Velocidade do banco', ['40 ms (o da loja)', '10 ms (banco folgado)'], dB, function (i) { S.d = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'A conta de exemplo da loja é 8 hits em 10 pedidos, Redis e banco de 40 ms: 9 ms. A conta ignora o tempo de gravar a cópia no cache depois de um miss.' }));
    render();
  }

  /* =============== AULA 7: chave do proxy da CDN (sha1 de método + path + query) =============== */
  function sha1hex(str) {
    var bytes = unescape(encodeURIComponent(str)).split('').map(function (c) { return c.charCodeAt(0); });
    var l = bytes.length;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    var bits = l * 8;
    for (var i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (bits >>> (i * 8)) & 255);
    var h = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];
    function rol(x, n) { return (x << n) | (x >>> (32 - n)); }
    for (var o = 0; o < bytes.length; o += 64) {
      var w = [];
      for (var t = 0; t < 16; t++) w[t] = (bytes[o + 4 * t] << 24) | (bytes[o + 4 * t + 1] << 16) | (bytes[o + 4 * t + 2] << 8) | bytes[o + 4 * t + 3];
      for (t = 16; t < 80; t++) w[t] = rol(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1);
      var a = h[0], b = h[1], c = h[2], d = h[3], e = h[4];
      for (t = 0; t < 80; t++) {
        var f, k;
        if (t < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (t < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (t < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        var tmp = (rol(a, 5) + f + e + k + w[t]) | 0;
        e = d; d = c; c = rol(b, 30); b = a; a = tmp;
      }
      h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0; h[4] = (h[4] + e) | 0;
    }
    return h.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function wCdnKey(root) {
    var PICKS = [
      { n: 'GET /gato.jpg', m: 'GET', p: '/gato.jpg', q: '' },
      { n: 'GET /gato.jpg?v=2', m: 'GET', p: '/gato.jpg', q: 'v=2' },
      { n: 'POST /gato.jpg', m: 'POST', p: '/gato.jpg', q: '' },
      { n: 'GET /busca?q=gato', m: 'GET', p: '/busca', q: 'q=gato' }
    ];
    var S = { m: 'GET', p: '/gato.jpg', q: '' };
    var pB = [];
    var iP = el('input', { type: 'text', class: 'ck-in', value: S.p, 'aria-label': 'Caminho (Path)', autocomplete: 'off', spellcheck: 'false' });
    var iQ = el('input', { type: 'text', class: 'ck-in', value: S.q, 'aria-label': 'Query (RawQuery, sem o ponto de interrogação)', autocomplete: 'off', spellcheck: 'false', placeholder: 'ex.: v=2' });
    var mB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(mB, S.m === 'GET' ? 0 : 1);
      var text = S.m + S.p + S.q;
      var hash = sha1hex(text);
      clear(out);
      out.appendChild(table([
        ['Texto da chave (linha 21)', text],
        ['SHA-1 (linhas 68 a 72)', hash],
        ['Arquivo no disco', 'cache/' + hash],
        ['O que a origem recebe (linha 32)', 'GET ' + S.p + '  (origem + Path)']
      ]));
      var notes = [];
      if (S.q) notes.push('A query "' + S.q + '" mudou o nome do arquivo, mas não vai à origem: duas queries diferentes guardam a mesma resposta.');
      if (S.m !== 'GET') notes.push('O método entrou na chave, mas a linha 33 faz sempre http.Get: o arquivo guarda a resposta de um GET.');
      if (!notes.length) notes.push('Para GET /gato.jpg é o arquivo f34b9897…, o mesmo da aula. Experimente colocar uma query ou trocar o método.');
      out.appendChild(el('p', { class: 'ib-verdict ' + (S.q || S.m !== 'GET' ? 'bad' : 'ok'), text: notes.join(' ') }));
    }
    iP.addEventListener('input', function () { S.p = iP.value; render(); });
    iQ.addEventListener('input', function () { S.q = iQ.value; render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: 'Pedidos prontos' }));
    root.appendChild(chipRow('Pedidos prontos', PICKS.map(function (x) { return x.n; }), pB, function (i) {
      var x = PICKS[i]; S.m = x.m; S.p = x.p; S.q = x.q; iP.value = x.p; iQ.value = x.q; render(); press(pB, i);
    }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Método' }));
    root.appendChild(chipRow('Método', ['GET', 'POST'], mB, function (i) { S.m = i === 0 ? 'GET' : 'POST'; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Caminho (Path)' }));
    root.appendChild(iP);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Query (RawQuery, sem o "?")' }));
    root.appendChild(iQ);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Resultado' }));
    root.appendChild(out);
    render();
  }

  var REG = { ttl: wTtl, evict: wEvict, hitrate: wHitRate, cdnkey: wCdnKey };
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
