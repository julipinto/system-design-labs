/* SDLabs · BFF (English): plain JS widgets (home screen calculator, "Which BFF?", timeout and fallback).
   They all use the store from the brief: Lena's app home screen (4G 120 ms, Wi-Fi 30 ms), slowest service 25 ms,
   180 KB without a BFF and 12 KB with the bff-app, order 1048, 100 ms timeout. */
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
  function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 1 }); }

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
    rows.forEach(function (r) { tb.appendChild(el('tr', null, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] })])); });
    return el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table pc-table' }, [tb])]);
  }
  function ctl(label, input, output) {
    return el('div', { class: 'sr-ctl' }, [el('label', null, [el('span', { text: label }), output]), input]);
  }

  /* =============== LESSON 2: home screen calculator =============== */
  var SERVICE_MS = 25, ASSEMBLE_MS = 5;
  var NETS = [{ n: '4G: 120 ms', rtt: 120 }, { n: 'Wi-Fi: 30 ms', rtt: 30 }];
  var SIZES = [{ n: '180 KB (website JSON)', kb: 180 }, { n: '12 KB (tailored)', kb: 12 }];
  function timeFor(bff, calls, rtt) { return bff ? rtt + SERVICE_MS + ASSEMBLE_MS : calls * rtt; }
  function wHome(root) {
    var S = { net: 0, bff: 0, size: 0, calls: 4, opens: 10 };
    var nB = [], mB = [], zB = [];
    var callsIn = el('input', { type: 'range', min: '1', max: '8', step: '1', value: '4', 'aria-label': 'Calls the screen needs' });
    var callsOut = el('output');
    var opensIn = el('input', { type: 'range', min: '1', max: '30', step: '1', value: '10', 'aria-label': 'App opens per day' });
    var opensOut = el('output');
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });

    function render() {
      press(nB, S.net); press(mB, S.bff); press(zB, S.size);
      var rtt = NETS[S.net].rtt, kb = SIZES[S.size].kb, bff = S.bff === 1;
      callsOut.textContent = S.calls + (S.calls === 1 ? ' call' : ' calls');
      opensOut.textContent = S.opens + ' per day';
      var t = timeFor(bff, S.calls, rtt), other = timeFor(!bff, S.calls, rtt);
      var mb = kb * S.opens * 30 / 1024;
      clear(out);
      var how = bff
        ? '1 trip of ' + rtt + ' ms + ' + SERVICE_MS + ' ms for the slowest service (in parallel) + ' + ASSEMBLE_MS + ' ms to assemble = ' + fmt(t) + ' ms'
        : S.calls + ' trips in a queue × ' + rtt + ' ms = ' + fmt(t) + ' ms';
      out.appendChild(table([
        ['Calls from the phone', bff ? '1 (the BFF makes the other ' + S.calls + ')' : String(S.calls)],
        ['Screen time', how],
        ['Data per open', fmt(kb) + ' KB'],
        ['Data per month', fmt(mb) + ' MB (' + S.opens + ' opens per day × 30 days)']
      ]));
      var better = t <= other;
      out.appendChild(el('p', { class: 'ib-verdict ' + (better ? 'ok' : 'bad'), text: bff
        ? (t < other ? 'The BFF saves ' + fmt(other - t) + ' ms: without it, it would be ' + fmt(other) + ' ms.' : 'With ' + S.calls + (S.calls === 1 ? ' call' : ' calls') + ' the BFF does not help with time (' + fmt(other) + ' ms without it): it only pays off when there is more than one trip to combine.')
        : (S.calls === 1 ? 'With a single call there is nothing to combine: the BFF would not help with time.' : 'No BFF: ' + fmt(t) + ' ms. With the BFF it would be ' + fmt(other) + ' ms.') }));
    }
    callsIn.addEventListener('input', function () { S.calls = Number(callsIn.value); render(); });
    opensIn.addEventListener('input', function () { S.opens = Number(opensIn.value); render(); });

    root.appendChild(el('p', { class: 'sr-sub', text: '1. Phone network' }));
    root.appendChild(chipRow('Network', NETS.map(function (x) { return x.n; }), nB, function (i) { S.net = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. Who builds the screen' }));
    root.appendChild(chipRow('Who builds the screen', ['No BFF: one call after the other', 'With BFF: 1 call, services in parallel'], mB, function (i) { S.bff = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '3. Response size' }));
    root.appendChild(chipRow('Response size', SIZES.map(function (x) { return x.n; }), zB, function (i) { S.size = i; render(); }));
    root.appendChild(el('div', { class: 'sr-ctrls' }, [ctl('Calls the screen needs', callsIn, callsOut), ctl('App opens', opensIn, opensOut)]));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Result' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The store\'s numbers are 4G, 4 calls, 180 KB without a BFF (480 ms) and 12 KB with the bff-app (150 ms). To keep it simple, each call without a BFF counts only the network trip; the services\' time goes into the BFF calculation.' }));
    render();
  }

  /* =============== LESSON 3: which BFF? (order 1048 status in each channel) =============== */
  var CANAIS = [
    { n: 'bff-app', dono: 'app team', fmt: 'small JSON', cut: 'long description, high-res photos and internal fields',
      body: '{ "pedido": { "id": 1048, "status": "a caminho" },\n  "foto": "gato-96.webp" }',
      note: 'The app draws the screen on its own, so it gets only the fields it needs and a thumbnail. The gateway already checked the JWT.' },
    { n: 'bff-web', dono: 'website team', fmt: 'HTML page (SSR)', cut: 'nothing: the website shows more, with large photos',
      body: '<h1>Pedido 1048</h1>\n<p>Status: a caminho</p>\n<img src="gato-800.webp" alt="gato de pelúcia">',
      note: 'The server builds the whole page and keeps Bia\'s session in the central cache (the module 5 Redis).' },
    { n: 'bff-voz', dono: 'voice team', fmt: 'short text sentence', cut: 'photo, ids, structures: only what can be spoken',
      body: '"Your order 1048 is on its way and arrives Thursday."',
      note: 'Lena asks "where is my order?" and the answer comes ready to be read aloud.' },
    { n: 'marketplace-xyz (gateway)', dono: 'public API, no BFF', fmt: 'generic, stable JSON', cut: 'nothing is adapted: the contract is the same for every partner',
      body: '{ "pedido": 1048, "status": "a_caminho" }',
      note: 'An external partner stays on the gateway\'s public API. A BFF is for your own frontend.' }
  ];
  function wCanal(root) {
    var S = { c: 0 };
    var cB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(cB, S.c);
      var c = CANAIS[S.c];
      clear(out);
      out.appendChild(el('p', { class: 'sr-sub', text: 'What reaches this channel' }));
      out.appendChild(el('pre', { class: 'bf-body' }, [el('code', { text: c.body })]));
      out.appendChild(table([
        ['Format', c.fmt],
        ['Owner', c.dono],
        ['What is left out', c.cut]
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: c.note }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Order 1048, seen by each channel' }));
    root.appendChild(chipRow('Channel', CANAIS.map(function (c) { return c.n; }), cB, function (i) { S.c = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== LESSON 6: timeout and fallback =============== */
  var DELAYS = [{ n: '25 ms (normal)', ms: 25 }, { n: '90 ms', ms: 90 }, { n: '150 ms', ms: 150 }, { n: '400 ms', ms: 400 }, { n: '30 s (stuck)', ms: 30000 }];
  var TIMEOUTS = [{ n: '100 ms timeout', ms: 100 }, { n: 'No timeout', ms: 0 }];
  function wTimeout(root) {
    var S = { d: 0, t: 0 };
    var dB = [], tB = [];
    var out = el('div', { class: 'pc-out', 'aria-live': 'polite' });
    function render() {
      press(dB, S.d); press(tB, S.t);
      var X = DELAYS[S.d].ms, T = TIMEOUTS[S.t].ms, RTT = 120;
      var cut = T > 0 && X > T;
      var waited = cut ? T : X;
      var total = RTT + Math.max(SERVICE_MS, waited) + ASSEMBLE_MS;
      var gone = T === 0 && X >= 30000;
      var rows = [
        ['The recomendacoes takes', X >= 1000 ? fmt(X / 1000) + ' s' : X + ' ms'],
        ['The bff-app waits', cut ? T + ' ms and gives up' : (X >= 1000 ? fmt(X / 1000) + ' s' : X + ' ms')],
        ['Lena\'s screen', gone ? 'never arrives' : fmt(total) + ' ms'],
        ['"Customers who bought this also bought" section', cut ? 'left out, with "recomendado": []' : (gone ? '-' : 'present (blue mug)')]
      ];
      clear(out);
      out.appendChild(table(rows));
      var cls, msg;
      if (gone) {
        cls = 'bad';
        msg = 'With no timeout, each screen is stuck for 30 s. Connections pile up until the bff-app falls, and the whole home screen disappears, not just the recommendations.';
      } else if (cut) {
        cls = 'ok';
        msg = 'Lena sees the screen in ' + fmt(total) + ' ms, without the recommendations. The fallback covered the failure and she did not even notice.';
      } else if (X > 100) {
        cls = 'bad';
        msg = 'The screen arrives, but it takes ' + fmt(total) + ' ms because of a section that is only decoration. With no timeout, one service\'s slowness becomes the screen\'s slowness.';
      } else {
        cls = 'ok';
        msg = 'Everything within the deadline: the screen arrives in ' + fmt(total) + ' ms with all four sections.';
      }
      out.appendChild(el('p', { class: 'ib-verdict ' + cls, text: msg }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: '1. How long the recomendacoes takes' }));
    root.appendChild(chipRow('recomendacoes time', DELAYS.map(function (x) { return x.n; }), dB, function (i) { S.d = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: '2. What the bff-app does' }));
    root.appendChild(chipRow('Timeout', TIMEOUTS.map(function (x) { return x.n; }), tB, function (i) { S.t = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'What Lena sees' }));
    root.appendChild(out);
    root.appendChild(el('p', { class: 'sr-note', text: 'The screen takes 120 ms of 4G network + the slowest service (at least 25 ms) + 5 ms to assemble. With a timeout, the slowest service counts at most 100 ms.' }));
    render();
  }

  var REG = { 'tela-inicial': wHome, 'qual-bff': wCanal, timeout: wTimeout };
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
