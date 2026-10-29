/* SDLabs · Service Mesh: plain JS widgets (English copy of widgets.js)
   (retry storm, "who can call?", sidecar cost against ambient, "does the shop need a mesh?").
   They use the shop from the brief: 30 pods on 3 nodes, 6 services in 3 languages, pedidos → pagamentos, a sidecar of 0.1 vCPU and 50 MB. */
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
  function fmt(v) { return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 }); }

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
  function bar(label, value, max, text, cls) {
    return el('div', { class: 'sr-bar' }, [
      el('span', { text: label }),
      el('div', { class: 'sr-track' }, [
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, value / max * 100)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }
  function slider(id, label, min, max, step, value, unit) {
    var out = el('output', { for: id });
    var inp = el('input', { type: 'range', id: id, min: String(min), max: String(max), step: String(step), value: String(value) });
    function sync() { out.textContent = inp.value + (unit ? ' ' + unit : ''); }
    inp.addEventListener('input', sync); sync();
    return { input: inp, wrap: el('div', { class: 'sr-ctl' }, [el('label', { for: id }, [label, out]), inp]) };
  }

  /* =============== AULA 2: tempestade de retries =============== */
  function wRetryStorm(root) {
    var S = { hops: 2, tries: 2, clicks: 0 };
    var HOPS = ['1 hop', '2 hops', '3 hops'];
    var TRIES = ['1 attempt', '2 attempts', '3 attempts', '4 attempts'];
    var CLICKS = [1, 10, 100];
    var hB = [], tB = [], cB = [];
    var out = el('div', { class: 'rs-out', 'aria-live': 'polite' });

    function render() {
      press(hB, S.hops); press(tB, S.tries); press(cB, S.clicks);
      var hops = S.hops + 1, tries = S.tries + 1, clicks = CLICKS[S.clicks];
      var storm = Math.pow(tries, hops);
      var perClick = storm * clicks;
      var lastOnly = tries * clicks;
      var budget = Math.min(perClick, clicks + Math.max(3, Math.ceil(clicks * 0.2)));
      var max = perClick;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('no limit', perClick, max, fmt(perClick) + ' calls', storm > tries ? 'bad' : 'cap'));
      bars.appendChild(bar('last hop only', lastOnly, max, fmt(lastOnly) + ' calls', 'cap'));
      bars.appendChild(bar('budget', budget, max, fmt(budget) + ' calls', 'win'));
      out.appendChild(bars);
      var how = [];
      for (var i = 0; i < hops; i++) how.push(tries);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Math per tap' }), el('b', { text: how.join(' × ') + ' = ' + fmt(storm) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Hops with retry' }), el('b', { text: hops + ' of 3' })])
      ]));
      var bad = storm > tries;
      var msg;
      if (storm === 1) msg = 'No retry at all: 1 call per tap. Safe, but any passing 503 reaches Lena.';
      else if (hops === 1) msg = 'Retry on one hop only: at most ' + tries + ' calls to pagamentos per tap. That is what the mesh does with the rule in pedidos\' Envoy.';
      else msg = 'Each attempt above triggers all the ones below: ' + how.join(' × ') + ' = ' + fmt(storm) + ' calls per tap to pagamentos' + (clicks > 1 ? ', ' + fmt(perClick) + ' with ' + clicks + ' taps' : '') + '.' + (hops === 3 && tries === 3 ? ' Those are the 27 from the lesson.' : '');
      out.appendChild(el('p', { class: 'sr-verdict ' + (bad ? 'bad' : ''), text: msg }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Hops count from pagamentos upward: pedidos → pagamentos, bff-app → pedidos and Lena\'s app → bff-app. Envoy\'s budget lets the retries in flight reach 20% of the active calls, with a floor of 3 retries at a time (retry_budget). Here: calls + the larger of 3 and 20% of them.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Hops with retry' }));
    root.appendChild(chipRow('Hops with retry', HOPS, hB, function (i) { S.hops = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Attempts per hop (the original counts)' }));
    root.appendChild(chipRow('Attempts per hop', TRIES, tB, function (i) { S.tries = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Taps at the same time' }));
    root.appendChild(chipRow('Taps at the same time', CLICKS.map(function (c) { return c + (c === 1 ? ' tap' : ' taps'); }), cB, function (i) { S.clicks = i; render(); }));
    root.appendChild(out);
    S.hops = 2; S.tries = 2; render();
  }

  /* =============== AULA 2: quem pode chamar o pagamentos? =============== */
  function wAuthz(root) {
    var POLICIES = [
      { n: 'No policy', t: 'No AuthorizationPolicy on pagamentos: every call that passes mTLS is accepted.',
        ok: function () { return true; } },
      { n: 'Only pedidos (ALLOW)', t: 'ALLOW with principals: loja.local/ns/loja/sa/pedidos. Anyone else is denied, but pedidos can make any call.',
        ok: function (o) { return o === 'pedidos'; } },
      { n: 'Only pedidos on POST /cobrancas', t: 'ALLOW with pedidos\' principals and operation POST on /cobrancas. This is the shop\'s rule.',
        ok: function (o, c) { return o === 'pedidos' && c === 0; } }
    ];
    var ORIGINS = ['pedidos', 'catalogo', 'bff-app', 'relatorios'];
    var CALLS = ['POST /cobrancas', 'GET /cobrancas/1048'];
    var S = { p: 2 };
    var pB = [];
    var out = el('div', { class: 'az-out', 'aria-live': 'polite' });

    function render() {
      press(pB, S.p);
      var P = POLICIES[S.p];
      clear(out);
      out.appendChild(el('p', { class: 'ev-say', text: P.t }));
      var head = el('tr', null, [el('th', { scope: 'col', text: 'caller' })].concat(CALLS.map(function (c) { return el('th', { scope: 'col', text: c }); })));
      var body = el('tbody');
      ORIGINS.forEach(function (o) {
        var cells = [el('th', { scope: 'row', text: o })];
        CALLS.forEach(function (c, ci) {
          var ok = P.ok(o, ci);
          cells.push(el('td', { class: 'az-cell ' + (ok ? 'ok' : 'bad'), text: ok ? '200' : '403' }));
        });
        body.appendChild(el('tr', null, cells));
      });
      out.appendChild(el('div', { class: 'sr-tablewrap' }, [el('table', { class: 'sr-table az-table' }, [el('thead', null, [head]), body])]));
      var denied = 0;
      ORIGINS.forEach(function (o) { CALLS.forEach(function (c, ci) { if (!P.ok(o, ci)) denied++; }); });
      out.appendChild(el('p', { class: 'sr-verdict ' + (denied ? '' : 'bad'), text: denied
        ? denied + ' of 8 calls come back 403 with the body RBAC: access denied, with no line of code in pagamentos.'
        : 'Nothing is blocked: catalogo and relatorios can charge. Without a policy, the mTLS identity decides nothing.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'pagamentos policy' }));
    root.appendChild(chipRow('pagamentos policy', POLICIES.map(function (p) { return p.n; }), pB, function (i) { S.p = i; render(); }));
    root.appendChild(out);
    render();
  }

  /* =============== AULA 5: custo do sidecar contra o do ambient =============== */
  function wSidecarCost(root) {
    var CPU = 0.1, MB = 50;
    var pods = slider('mesh-pods', 'Shop pods', 10, 100, 10, 30, 'pods');
    var nodes = slider('mesh-nodes', 'Cluster nodes', 1, 10, 1, 3, 'nodes');
    var wps = slider('mesh-wp', 'Waypoints', 0, 3, 1, 1, 'waypoints');
    var out = el('div', { class: 'sc-out', 'aria-live': 'polite' });

    function mem(mb) { return mb >= 1000 ? fmt(mb / 1000) + ' GB' : fmt(mb) + ' MB'; }
    function render() {
      var p = +pods.input.value, n = +nodes.input.value, w = +wps.input.value;
      var sCpu = p * CPU, sMb = p * MB;
      var aProx = n + w, aCpu = aProx * CPU, aMb = aProx * MB;
      clear(out);
      var bars = el('div', { class: 'sr-bars' });
      bars.appendChild(bar('sidecar vCPU', sCpu, Math.max(sCpu, aCpu), fmt(sCpu) + ' vCPU', 'cap'));
      bars.appendChild(bar('ambient vCPU', aCpu, Math.max(sCpu, aCpu), fmt(aCpu) + ' vCPU', 'win'));
      bars.appendChild(bar('sidecar mem.', sMb, Math.max(sMb, aMb), mem(sMb), 'cap'));
      bars.appendChild(bar('ambient mem.', aMb, Math.max(sMb, aMb), mem(aMb), 'win'));
      out.appendChild(bars);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Proxies' }), el('b', { text: p + ' vs ' + n + ' + ' + w })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Pods to restart' }), el('b', { text: p + ' vs 0' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Proxies per call' }), el('b', { text: '2 vs ' + (w > 0 ? 3 : 2) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Pods per node' }), el('b', { text: fmt(p / n) })])
      ]));
      var saved = sCpu - aCpu;
      out.appendChild(el('p', { class: 'sr-verdict ' + (saved > 0 ? '' : 'bad'), text: saved > 0
        ? 'Ambient saves ' + fmt(saved) + ' vCPU and ' + mem(sMb - aMb) + ': the sidecar cost grows with the ' + p + ' pods, the ambient one with the ' + n + ' nodes and ' + w + ' waypoint' + (w === 1 ? '' : 's') + '.'
        : 'With so few pods per node and so many waypoints, ambient stops saving. The shape of the math is pods against nodes.' }));
      out.appendChild(el('p', { class: 'sr-note', text: 'Shop example: 0.1 vCPU and 50 MB per proxy, the same for sidecar, ztunnel and waypoint. Real numbers vary with traffic. For updates, swapping the pods\' Envoy compares with swapping the ztunnels and waypoints, which restarts no service pod.' }));
    }
    var ctrls = el('div', { class: 'sr-ctrls' }, [pods.wrap, nodes.wrap, wps.wrap]);
    [pods, nodes, wps].forEach(function (s) { s.input.addEventListener('input', render); });
    root.appendChild(ctrls);
    root.appendChild(out);
    render();
  }

  /* =============== AULA 6: a loja precisa de uma malha? =============== */
  function wValeMalha(root) {
    var SVC = [3, 6, 15, 40], LANG = [1, 2, 3], TEAM = [1, 3, 6];
    var S = { s: 1, l: 2, t: 1, m: 1, p: 1 };
    var sB = [], lB = [], tB = [], mB = [], pB = [];
    var out = el('div', { class: 'vm-out', 'aria-live': 'polite' });

    function render() {
      press(sB, S.s); press(lB, S.l); press(tB, S.t); press(mB, S.m); press(pB, S.p);
      var items = [];
      var sv = SVC[S.s], lg = LANG[S.l], tm = TEAM[S.t];
      var ps = sv >= 15 ? 2 : sv >= 5 ? 1 : 0;
      items.push([ps, sv + ' services: ' + (ps === 2 ? 'many pairs of calls, each with a timeout, a retry and a metric' : ps === 1 ? 'you can write the rule by hand, but it is already spreading' : 'few pairs of calls, the rule fits in a library')]);
      var pl = lg >= 3 ? 2 : lg === 2 ? 1 : 0;
      items.push([pl, lg + (lg === 1 ? ' language' : ' languages') + ': ' + (pl === 2 ? 'one network library for each, all needing to behave the same' : pl === 1 ? 'two libraries to keep the same' : 'one shared library does the job')]);
      var pt = tm >= 6 ? 2 : tm >= 3 ? 1 : 0;
      items.push([pt, tm + (tm === 1 ? ' team' : ' teams') + ': ' + (pt === 2 ? 'the rule diverges between teams and nobody sees the whole' : pt === 1 ? 'the rule starts to diverge between teams' : 'a single team agrees on the rule in conversation')]);
      items.push([S.m ? 2 : 0, S.m ? 'mTLS everywhere is a requirement: the mesh encrypts and gives identity to everyone at once' : 'no mTLS-everywhere requirement: the gateway\'s TLS may be enough']);
      items.push([S.p ? 1 : -2, S.p ? 'there is a platform team to operate the control plane and the updates' : 'with no team to operate it, the mesh becomes debt']);
      var score = items.reduce(function (a, x) { return a + x[0]; }, 0);
      var head, say, cls = '';
      if (score >= 6) { head = 'The mesh is worth it.'; say = ' Many signals point to it. Start with L4 (mTLS and policy by identity) and add L7 where needed.'; }
      else if (score >= 3) { head = 'It depends.'; say = ' There are signals on both sides. You can start with only mTLS and policy by identity (ambient or a lean mesh) or stay with a library and a gateway for a while longer.'; }
      else { head = 'A library and a gateway are enough.'; say = ' A mesh would be one more system to operate for little gain.'; cls = 'bad'; }
      clear(out);
      out.appendChild(el('p', { class: 'sr-verdict ' + cls }, [el('strong', { text: head }), say + ' (score: ' + score + ')']));
      var ul = el('ul', { class: 'ls-list vm-list' });
      items.forEach(function (x) {
        ul.appendChild(el('li', { class: x[0] > 0 ? 'vm-for' : x[0] < 0 ? 'vm-against' : 'vm-flat' }, [el('b', { text: (x[0] > 0 ? '+' + x[0] : x[0] === 0 ? '0' : String(x[0])) + ' ' }), x[1]]));
      });
      out.appendChild(ul);
      out.appendChild(el('p', { class: 'sr-note', text: 'Rule of thumb: weights from 0 to 2 for services, languages, teams and mTLS, +1 or -2 for the platform team. The shop from the story (6 services, 3 languages, mTLS required) scores 7; the number of teams is an example.' }));
    }
    root.appendChild(el('p', { class: 'sr-sub', text: 'Services' }));
    root.appendChild(chipRow('Services', SVC.map(String), sB, function (i) { S.s = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Languages' }));
    root.appendChild(chipRow('Languages', LANG.map(String), lB, function (i) { S.l = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Teams' }));
    root.appendChild(chipRow('Teams', TEAM.map(String), tB, function (i) { S.t = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Is mTLS everywhere a requirement?' }));
    root.appendChild(chipRow('mTLS required', ['no', 'yes'], mB, function (i) { S.m = i; render(); }));
    root.appendChild(el('p', { class: 'sr-sub', text: 'Platform team' }));
    root.appendChild(chipRow('Platform team', ['no', 'yes'], pB, function (i) { S.p = i; render(); }));
    root.appendChild(out);
    render();
  }

  var REG = { retrystorm: wRetryStorm, authz: wAuthz, sidecarcost: wSidecarCost, valemalha: wValeMalha };
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
