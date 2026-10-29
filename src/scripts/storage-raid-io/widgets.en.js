/* SDLabs · Storage, RAID and I/O: plain JS widgets (I/O calculator and RAID calculator), English */
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
  var uid = 0;
  function id(p) { uid++; return p + uid; }
  function nf(v, d) {
    return v.toLocaleString('en-US', { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: 0 });
  }
  function mbs(v) {
    if (v >= 1024) return nf(v / 1024, 1) + ' GB/s';
    return nf(v, v < 10 ? 2 : 1) + ' MB/s';
  }
  function bar(label, pct, text, cls) {
    return el('div', { class: 'sr-bar' }, [
      el('span', { text: label }),
      el('div', { class: 'sr-track' }, [
        el('div', { class: 'sr-fill ' + (cls || ''), style: 'width:' + Math.max(0, Math.min(100, pct)) + '%' }),
        el('span', { class: 'sr-lbl', text: text })
      ])
    ]);
  }

  /* =============== LESSON 2: I/O calculator =============== */
  var BLOCKS = [4, 8, 16, 32, 64, 128, 256, 512, 1000]; // KB (1 MB = 1000 KB, como nos MB/s)
  function kbText(k) { return k >= 1000 ? (k / 1000) + ' MB' : k + ' KB'; }
  var PRESETS = [
    { n: 'HDD 7200 rpm', iops: 150, bw: 180 },
    { n: 'SSD SATA', iops: 90000, bw: 550 },
    { n: 'NVMe', iops: 500000, bw: 3500 },
    { n: 'EBS gp3 (default)', iops: 3000, bw: 125 }
  ];
  var SCEN = [
    { n: 'Database: small random blocks (8 KB)', kb: 8 },
    { n: 'Video: large sequential blocks (1 MB)', kb: 1000 }
  ];

  function wIo(root) {
    var S = { iops: 3000, bw: 125, bi: 1 };
    var chipsP = [], chipsS = [];

    function chipRow(list, items, onpick) {
      var row = el('div', { class: 'sr-chips', role: 'group' });
      items.forEach(function (p, i) {
        var b = el('button', { type: 'button', class: 'chip', text: p.n, 'aria-pressed': 'false' });
        b.addEventListener('click', function () { onpick(i); });
        list.push(b);
        row.appendChild(b);
      });
      return row;
    }

    var iopsId = id('sri'), bwId = id('srb'), blId = id('srk');
    var iopsOut = el('output', { for: iopsId });
    var iopsIn = el('input', { type: 'range', id: iopsId, min: '0', max: '100', step: '1' });
    var bwOut = el('output', { for: bwId });
    var bwIn = el('input', { type: 'range', id: bwId, min: '0', max: '100', step: '1' });
    var blOut = el('output', { for: blId });
    var blIn = el('input', { type: 'range', id: blId, min: '0', max: String(BLOCKS.length - 1), step: '1', value: '1' });

    // log sliders: IOPS from 100 to 1,000,000, bandwidth from 50 MB/s to 8000 MB/s
    function logv(p, lo, hi) { return Math.round(Math.exp(Math.log(lo) + (p / 100) * (Math.log(hi) - Math.log(lo)))); }
    function logp(v, lo, hi) { return 100 * (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)); }
    function setSliders() {
      iopsIn.value = String(logp(S.iops, 100, 1000000));
      bwIn.value = String(logp(S.bw, 50, 8000));
      blIn.value = String(S.bi);
    }
    iopsIn.addEventListener('input', function () { S.iops = nice(logv(Number(iopsIn.value), 100, 1000000)); unpress(chipsP); calc(); });
    bwIn.addEventListener('input', function () { S.bw = nice(logv(Number(bwIn.value), 50, 8000)); unpress(chipsP); calc(); });
    blIn.addEventListener('input', function () { S.bi = Number(blIn.value); unpress(chipsS); calc(); });
    function nice(v) {
      var m = v < 1000 ? 10 : v < 10000 ? 100 : 1000;
      return Math.max(m, Math.round(v / m) * m);
    }
    function unpress(list) { list.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); }

    var rowP = chipRow(chipsP, PRESETS, function (i) {
      S.iops = PRESETS[i].iops; S.bw = PRESETS[i].bw;
      unpress(chipsP); chipsP[i].setAttribute('aria-pressed', 'true');
      setSliders(); calc();
    });
    var rowS = chipRow(chipsS, SCEN, function (i) {
      S.bi = BLOCKS.indexOf(SCEN[i].kb);
      unpress(chipsS); chipsS[i].setAttribute('aria-pressed', 'true');
      setSliders(); calc();
    });

    var out = el('div', { 'aria-live': 'polite' });
    function calc() {
      var kb = BLOCKS[S.bi];
      iopsOut.textContent = nf(S.iops) + ' IOPS';
      bwOut.textContent = nf(S.bw) + ' MB/s';
      blOut.textContent = kbText(kb);
      var byIops = S.iops * kb / 1000;      // MB/s the IOPS can deliver
      var real = Math.min(byIops, S.bw);
      var gargalo = byIops <= S.bw ? 'IOPS' : 'bandwidth';
      var iopsToFill = Math.ceil(S.bw * 1000 / kb); // IOPS to fill the bandwidth
      var secs100 = 100000 / real;                  // 100 GB
      var top = Math.max(byIops, S.bw);
      clear(out);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('IOPS x block', 100 * byIops / top, mbs(byIops), gargalo === 'IOPS' ? 'win' : ''),
        bar('Link bandwidth', 100 * S.bw / top, mbs(S.bw), gargalo === 'bandwidth' ? 'win' : ''),
        bar('Throughput', 100 * real / top, mbs(real), 'cap')
      ]));
      out.appendChild(el('div', { class: 'sr-verdict' }, [
        el('strong', { text: 'Bottleneck: ' + gargalo + '. ' }),
        gargalo === 'IOPS'
          ? '' + nf(S.iops) + ' IOPS with ' + kbText(kb) + ' blocks give ' + mbs(byIops) + ', less than the ' + nf(S.bw) + ' MB/s bandwidth. To go higher you need more IOPS or bigger blocks.'
          : 'The IOPS would give ' + mbs(byIops) + ', but the link only carries ' + nf(S.bw) + ' MB/s. More IOPS will not help: you are out of bandwidth.'
      ]));
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Math' }), el('b', { text: nf(S.iops) + ' x ' + kbText(kb) + ' = ' + mbs(byIops) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Real throughput' }), el('b', { text: mbs(real) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'IOPS to fill the bandwidth' }), el('b', { text: nf(iopsToFill) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Copy 100 GB' }), el('b', { text: secs100 >= 120 ? nf(secs100 / 60, 1) + ' min' : nf(secs100, 0) + ' s' })])
      ]));
      var px = Math.round(125 * 1000 / 3000);
      out.appendChild(el('p', { class: 'sr-note', text: 'Bottleneck switch: the block size where IOPS x block equals the bandwidth is bandwidth / IOPS. On default gp3, 125 MB/s / 3,000 IOPS = about ' + px + ' KB.' }));
    }

    root.appendChild(el('p', { class: 'sr-sub', text: 'Disk or volume' }));
    root.appendChild(rowP);
    root.appendChild(el('p', { class: 'sr-sub', text: 'Store scenario' }));
    root.appendChild(rowS);
    root.appendChild(el('div', { class: 'sr-ctrls' }, [
      el('div', { class: 'sr-ctl' }, [el('label', { for: iopsId }, ['Disk IOPS', iopsOut]), iopsIn]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: bwId }, ['Link bandwidth', bwOut]), bwIn]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: blId }, ['Block size', blOut]), blIn])
    ]));
    root.appendChild(out);
    chipsP[3].setAttribute('aria-pressed', 'true');
    S.bi = BLOCKS.indexOf(8);
    chipsS[0].setAttribute('aria-pressed', 'true');
    setSliders();
    calc();
  }

  /* =============== LESSON 13: RAID calculator =============== */
  var LEVELS = {
    '0':  { n: 'RAID 0 (striping)',        min: 2, pen: 1, use: function (n, s) { return n * s; },       tol: function () { return '0 (any failure loses everything)'; }, rd: function (n) { return n; } },
    '1':  { n: 'RAID 1 (mirror)',         min: 2, pen: 2, use: function (n, s) { return s; },           tol: function (n) { return (n - 1) + (n > 2 ? ' (all but one)' : ''); }, rd: function (n) { return n; } },
    '5':  { n: 'RAID 5 (parity)',        min: 3, pen: 4, use: function (n, s) { return (n - 1) * s; }, tol: function () { return '1'; }, rd: function (n) { return n; } },
    '6':  { n: 'RAID 6 (double parity)',  min: 4, pen: 6, use: function (n, s) { return (n - 2) * s; }, tol: function () { return '2'; }, rd: function (n) { return n; } },
    '10': { n: 'RAID 10 (1+0)',            min: 4, pen: 2, even: true, use: function (n, s) { return n / 2 * s; }, tol: function (n) { return '1 guaranteed, up to ' + (n / 2) + ' (one per pair)'; }, rd: function (n) { return n; } }
  };
  var LORDER = ['0', '1', '5', '6', '10'];
  var DEFAULT_N = { '0': 4, '1': 2, '5': 4, '6': 5, '10': 4 };

  function wRaid(root) {
    var S = { lv: '5', n: 4, size: 1, iops: 150 };
    var lvId = id('rl'), nId = id('rn'), szId = id('rs'), ioId = id('ri');
    var sel = el('select', { id: lvId }, LORDER.map(function (k) {
      var o = el('option', { value: k, text: LEVELS[k].n });
      if (k === S.lv) o.selected = true;
      return o;
    }));
    var nIn = el('input', { type: 'number', id: nId, min: '2', max: '24', step: '1', value: '4', inputmode: 'numeric' });
    var szIn = el('input', { type: 'number', id: szId, min: '1', max: '100', step: '1', value: '1', inputmode: 'numeric' });
    var ioIn = el('input', { type: 'number', id: ioId, min: '50', max: '1000000', step: '50', value: '150', inputmode: 'numeric' });
    sel.addEventListener('change', function () {
      S.lv = sel.value; S.n = DEFAULT_N[S.lv]; nIn.value = String(S.n); calc();
    });
    function num(inp, lo, hi) {
      var v = Math.floor(Number(inp.value));
      if (!isFinite(v) || v < lo) return lo;
      return Math.min(hi, v);
    }
    nIn.addEventListener('input', function () { S.n = num(nIn, 1, 24); calc(); });
    szIn.addEventListener('input', function () { S.size = num(szIn, 1, 100); calc(); });
    ioIn.addEventListener('input', function () { S.iops = num(ioIn, 1, 1000000); calc(); });

    var out = el('div', { 'aria-live': 'polite' });
    function calc() {
      var L = LEVELS[S.lv], n = S.n, s = S.size;
      clear(out);
      var problems = [];
      if (n < L.min) problems.push(L.n + ' needs at least ' + L.min + ' disks.');
      if (L.even && n % 2 !== 0) problems.push('RAID 10 uses pairs: the number of disks must be even.');
      if (problems.length) {
        out.appendChild(el('div', { class: 'sr-verdict bad' }, [el('strong', { text: 'Invalid configuration. ' }), problems.join(' ')]));
        return;
      }
      var raw = n * s, use = L.use(n, s), pct = 100 * use / raw;
      var disks = el('div', { class: 'sr-disks', 'aria-hidden': 'true' });
      for (var i = 0; i < n; i++) disks.appendChild(el('div', { class: 'sr-disk' }));
      out.appendChild(disks);
      out.appendChild(el('div', { class: 'sr-bars' }, [
        bar('Raw', 100, nf(raw) + ' TB', ''),
        bar('Usable', pct, nf(use, 1) + ' TB (' + nf(pct) + '%)', 'cap')
      ]));
      var rIops = n * S.iops, wIops = Math.floor(n * S.iops / L.pen);
      out.appendChild(el('div', { class: 'sr-facts' }, [
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Usable capacity' }), el('b', { text: nf(use, 1) + ' TB' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Disks that can fail' }), el('b', { text: L.tol(n) })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Write penalty' }), el('b', { text: L.pen + ' I/Os per write' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Random read (theoretical)' }), el('b', { text: nf(rIops) + ' IOPS' })]),
        el('div', { class: 'sr-fact' }, [el('small', { text: 'Random write (theoretical)' }), el('b', { text: nf(wIops) + ' IOPS' })])
      ]));
      out.appendChild(el('p', { class: 'sr-note', text: 'Math: ' + n + ' x ' + nf(S.iops) + ' IOPS = ' + nf(rIops) + ' on reads; on writes, divide by ' + L.pen + '. Theoretical values: the controller cache and the access pattern change the result.' }));
    }

    root.appendChild(el('div', { class: 'sr-ctrls' }, [
      el('div', { class: 'sr-ctl' }, [el('label', { for: lvId, text: 'Level' }), sel]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: nId, text: 'Number of disks' }), nIn]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: szId, text: 'Size of each disk (TB)' }), szIn]),
      el('div', { class: 'sr-ctl' }, [el('label', { for: ioId, text: 'IOPS of each disk' }), ioIn])
    ]));
    root.appendChild(out);
    calc();
  }

  var REG = { io: wIo, raid: wRaid };
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
