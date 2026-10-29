/* SDLabs · Network Protocols: widgets in plain JS */
(function () {
  'use strict';
  var RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
  function btn(text, cls, onclick) {
    var b = el('button', { type: 'button', class: 'btn' + (cls ? ' ' + cls : ''), text: text });
    b.addEventListener('click', onclick);
    return b;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  var uid = 0;
  function id(p) { uid++; return p + uid; }

  /* ---------- controles de stepper ---------- */
  function stepper(root, getLen, onChange) {
    var i = 0;
    var prev = btn('Back', '', function () { go(i - 1); });
    var next = btn('Next', 'primary', function () { go(i + 1); });
    var reset = btn('Restart', '', function () { go(0); });
    var counter = el('span', { class: 'counter' });
    var bar = el('div', { class: 'w-row' }, [prev, next, reset, counter]);
    function go(n) {
      var len = getLen();
      i = Math.max(0, Math.min(len - 1, n));
      prev.disabled = i === 0;
      next.disabled = i >= len - 1;
      counter.textContent = 'Step ' + (i + 1) + ' of ' + len;
      onChange(i);
    }
    return { bar: bar, go: go, get: function () { return i; } };
  }

  /* ---------- diagrama de sequência ---------- */
  function renderSeq(host, left, right, msgs, cur) {
    clear(host);
    host.appendChild(el('div', { class: 'seq-head' }, [el('span', { text: left }), el('span', { text: right })]));
    for (var k = 0; k <= cur && k < msgs.length; k++) {
      var m = msgs[k];
      if (m.kind === 'note') {
        host.appendChild(el('div', { class: 'msg note-msg' + (k === cur ? ' cur' : ''), text: m.text }));
        continue;
      }
      var div = el('div', { class: 'msg' + (k === cur ? ' cur' : '') + (m.lost ? ' lostmsg' : '') });
      div.appendChild(el('div', { class: 'msg-l' }, [
        el('span', { class: 'lab', text: m.label }),
        el('span', { class: 'det', text: m.detail || '' })
      ]));
      div.appendChild(el('div', {
        class: 'arrow ' + (m.dir === '>' ? 'r' : 'l') + (m.lost ? ' lost' : '') + (m.phase ? ' ph-' + m.phase : ''),
        'aria-hidden': 'true'
      }));
      host.appendChild(div);
    }
  }

  /* =============== AULA 3: IP =============== */
  function wIp(root) {
    var inpId = id('ip');
    var input = el('input', { type: 'text', id: inpId, value: '192.168.1.10', inputmode: 'text', autocomplete: 'off', spellcheck: 'false', 'aria-describedby': inpId + 'r' });
    var chips = el('div', { class: 'w-row' }, ['10.0.0.5', '172.16.4.1', '172.32.0.1', '192.168.1.10', '8.8.8.8', '127.0.0.1'].map(function (v) {
      var c = el('button', { type: 'button', class: 'chip', text: v });
      c.addEventListener('click', function () { input.value = v; update(); });
      return c;
    }));
    var out = el('div', { class: 'live', id: inpId + 'r', 'aria-live': 'polite' });
    root.appendChild(el('div', { class: 'w-row' }, [el('label', { for: inpId, text: 'IPv4: ' }), input]));
    root.appendChild(chips);
    root.appendChild(out);

    function classify(o) {
      var a = o[0], b = o[1];
      if (a === 10) return { priv: true, t: 'private', why: 'Range 10.0.0.0/8 (10.0.0.0 to 10.255.255.255).' };
      if (a === 172 && b >= 16 && b <= 31) return { priv: true, t: 'private', why: 'Range 172.16.0.0/12 (172.16.0.0 to 172.31.255.255).' };
      if (a === 192 && b === 168) return { priv: true, t: 'private', why: 'Range 192.168.0.0/16 (192.168.0.0 to 192.168.255.255).' };
      if (a === 127) return { priv: false, t: 'loopback', why: '127.0.0.0/8 is the machine itself (localhost). It is not one of the 3 private ranges, but it does not go out to the internet either.' };
      if (a === 169 && b === 254) return { priv: false, t: 'link-local', why: '169.254.0.0/16: the device found no DHCP and assigned itself an address.' };
      if (a === 100 && b >= 64 && b <= 127) return { priv: false, t: 'CGNAT', why: '100.64.0.0/10: carrier-grade NAT range. It is not one of the 3 classic private ranges.' };
      if (a === 0) return { priv: false, t: 'reserved', why: '0.0.0.0/8: "this host/network", not a destination address on the internet.' };
      if (a >= 224 && a <= 239) return { priv: false, t: 'multicast', why: '224.0.0.0/4: group address (multicast), it does not belong to a single device.' };
      if (a >= 240) return { priv: false, t: 'reserved', why: '240.0.0.0/4: reserved (includes the broadcast 255.255.255.255), not a public device address.' };
      return { priv: false, t: 'public', why: 'Outside the private ranges: it is routable on the internet (if assigned to someone).' };
    }
    function update() {
      clear(out);
      var s = input.value.trim();
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
      var o = m ? m.slice(1).map(Number) : null;
      if (!o || o.some(function (x) { return x > 255; })) {
        input.setAttribute('aria-invalid', 'true');
        out.appendChild(el('p', { class: 'bad', text: 'Invalid IPv4: use 4 numbers from 0 to 255 separated by dots.' }));
        return;
      }
      input.removeAttribute('aria-invalid');
      var c = classify(o);
      var bits = el('div', { class: 'bits', role: 'img', 'aria-label': 'Binary: ' + o.map(function (x) { return ('00000000' + x.toString(2)).slice(-8); }).join('.') });
      o.forEach(function (x) {
        var b = ('00000000' + x.toString(2)).slice(-8), ob = el('div', { class: 'oct-bits' });
        b.split('').forEach(function (ch) { ob.appendChild(el('span', { class: 'bit b' + ch, text: ch })); });
        bits.appendChild(el('div', { class: 'oct' }, [ob, el('span', { class: 'oct-dec', text: String(x) })]));
      });
      out.appendChild(bits);
      out.appendChild(el('div', { class: 'verdict' }, [
        el('span', { class: 'tag ' + (c.priv ? 'ok' : 'muted'), text: c.priv ? 'PRIVATE' : c.t.toUpperCase() }),
        el('span', { text: c.priv ? c.why + ' It is not routed on the internet; it needs NAT to get out.' : c.why })
      ]));
    }
    input.addEventListener('input', update);
    update();

    root.appendChild(el('p', { class: 'sub-h', text: 'IPv6: 128 bits = 8 groups of 16 bits (hex)' }));
    var v6 = el('div', { class: 'v6', role: 'img', 'aria-label': 'IPv6 example: 2001:0db8:85a3:0000:0000:8a2e:0370:7334' });
    '2001:0db8:85a3:0000:0000:8a2e:0370:7334'.split(':').forEach(function (g) { v6.appendChild(el('span', { class: 'v6g', text: g })); });
    root.appendChild(v6);
    root.appendChild(el('p', { class: 'widget-hint', text: 'Runs of zeros can be shortened with "::" (once): 2001:db8:85a3::8a2e:370:7334.' }));

    root.appendChild(el('p', { class: 'sub-h', text: 'Scale: each square = 1 address bit (128 in total, the 32 blue ones are IPv4)' }));
    var dots = el('div', { class: 'dots', 'aria-hidden': 'true', style: 'grid-template-columns:repeat(32,1fr)' });
    for (var d = 0; d < 128; d++) dots.appendChild(el('span', { class: 'dot' + (d < 32 ? ' on' : '') }));
    root.appendChild(dots);
    var two32 = Math.pow(2, 32);
    var rows = el('div', {}, [
      el('div', { class: 'scale-row' }, [el('span', { text: 'IPv4' }), el('div', { class: 'scale-track' }, [el('div', { class: 'scale-fill', style: 'width:' + (32 / 128 * 100) + '%' }), el('span', { class: 'scale-lbl', text: '2^32 = 4,294,967,296' })])]),
      el('div', { class: 'scale-row' }, [el('span', { text: 'IPv6' }), el('div', { class: 'scale-track' }, [el('div', { class: 'scale-fill v6f', style: 'width:100%' }), el('span', { class: 'scale-lbl', text: '2^128 ≈ 3.4 × 10^38' })])])
    ]);
    root.appendChild(rows);
    var ratio = BigInt(2) ** BigInt(96);
    root.appendChild(el('p', { class: 'widget-hint', text: 'The bar is on a bit scale (exponent), not a quantity scale: in real quantity, IPv4 would not even show up as one pixel. Each extra bit doubles the total, and IPv6 has 96 more bits: ' + ratio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' times the IPv4 space. With ~8 billion people, IPv4 gives about ' + (two32 / 8e9).toFixed(1) + ' addresses per person; IPv6, about 4 × 10^28 per person.' }));
  }

  /* =============== AULA 4: TCP / UDP =============== */
  var TCP_MSGS = [
    { phase: 'open', label: 'SYN', detail: 'seq=100', dir: '>', note: 'Client: "I want to open a connection". It picks the ISN (Initial Sequence Number) 100.' },
    { phase: 'open', label: 'SYN-ACK', detail: 'seq=300 ack=101', dir: '<', note: 'Server: "OK". It picks its own ISN (300) and confirms the client\'s (ack=101: I expect byte 101).' },
    { phase: 'open', label: 'ACK', detail: 'seq=101 ack=301', dir: '>', note: 'Client confirms. Connection open: that was 1 RTT before sending any data.' },
    { phase: 'data', label: 'Data #1', detail: 'seq=101 len=100', dir: '>', note: 'First segment, bytes 101 to 200.' },
    { phase: 'data', label: 'ACK', detail: 'ack=201', dir: '<', note: 'Server: "I got up to 200, I expect 201".' },
    { phase: 'data', label: 'Data #2', detail: 'seq=201 len=100', dir: '>', lost: true, note: 'This segment is lost along the way. The client doesn\'t know yet.' },
    { phase: 'data', label: 'Data #3', detail: 'seq=301 len=100', dir: '>', note: 'It arrives out of order: the server holds it, but does not hand it to the application without #2.' },
    { phase: 'data', label: 'Duplicate ACK', detail: 'ack=201', dir: '<', note: 'Server insists: "I still expect 201". It is the sign that something is missing.' },
    { phase: 'data', label: 'Retransmit #2', detail: 'seq=201 len=100', dir: '>', note: 'With no acknowledgment (timeout or duplicate ACKs), the client resends the lost segment.' },
    { phase: 'data', label: 'ACK', detail: 'ack=401', dir: '<', note: 'Cumulative ACK: "I got everything up to 400". In the right order, it delivers to the application.' },
    { phase: 'close', label: 'FIN', detail: 'seq=401', dir: '>', note: 'Client finished sending and closes its direction.' },
    { phase: 'close', label: 'ACK', detail: 'ack=402', dir: '<', note: 'Server confirms the client\'s FIN. It can still send whatever is left.' },
    { phase: 'close', label: 'FIN', detail: 'seq=301', dir: '<', note: 'Server finishes and closes its direction.' },
    { phase: 'close', label: 'ACK', detail: 'ack=302', dir: '>', note: 'Client confirms. Connection closed (4 messages: four-way close).' }
  ];
  var UDP_MSGS = [
    { label: 'Datagram #1', detail: 'no handshake', dir: '>', note: 'No SYN, no ACK: it goes straight out. Delivered.' },
    { label: 'Datagram #2', detail: '', dir: '>', lost: true, note: 'Lost along the way. Nobody warns, nobody retransmits.' },
    { label: 'Datagram #3', detail: '', dir: '>', note: 'Delivered. The server doesn\'t know #2 is missing and has no way to know.' },
    { kind: 'note', text: 'End: the server has #1 and #3. The client thinks it sent everything. If the application needs guarantees, it implements them itself.', note: 'UDP used 3 messages, against 14 for TCP. Faster, but with no guarantee.' }
  ];

  /* "The segment now": the real header of each message, each side\'s state and the server buffer */
  var TCP_SEG = [
    { f: ['SYN'], seq: 100, ack: null, len: 0, st: ['SYN_SENT', 'SYN_RECEIVED'], buf: ['', '', ''] },
    { f: ['SYN', 'ACK'], seq: 300, ack: 101, len: 0, st: ['ESTABLISHED', 'SYN_RECEIVED'], buf: ['', '', ''] },
    { f: ['ACK'], seq: 101, ack: 301, len: 0, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['', '', ''] },
    { f: ['ACK', 'PSH'], seq: 101, ack: 301, len: 100, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', '', ''] },
    { f: ['ACK'], seq: 301, ack: 201, len: 0, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', '', ''] },
    { f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', 'lost', ''] },
    { f: ['ACK', 'PSH'], seq: 301, ack: 301, len: 100, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', 'lost', 'held'] },
    { f: ['ACK'], seq: 301, ack: 201, len: 0, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', 'lost', 'held'] },
    { f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['ok', 'ok', 'ok'] },
    { f: ['ACK'], seq: 301, ack: 401, len: 0, st: ['ESTABLISHED', 'ESTABLISHED'], buf: ['done', 'done', 'done'] },
    { f: ['FIN', 'ACK'], seq: 401, ack: 301, len: 0, st: ['FIN_WAIT_1', 'CLOSE_WAIT'], buf: ['done', 'done', 'done'] },
    { f: ['ACK'], seq: 301, ack: 402, len: 0, st: ['FIN_WAIT_2', 'CLOSE_WAIT'], buf: ['done', 'done', 'done'] },
    { f: ['FIN', 'ACK'], seq: 301, ack: 402, len: 0, st: ['TIME_WAIT', 'LAST_ACK'], buf: ['done', 'done', 'done'] },
    { f: ['ACK'], seq: 402, ack: 302, len: 0, st: ['TIME_WAIT', 'CLOSED'], buf: ['done', 'done', 'done'] }
  ];
  var UDP_SEG = [
    { len: 100, buf: ['ok', '', ''] },
    { len: 100, buf: ['ok', 'gone', ''] },
    { len: 100, buf: ['ok', 'gone', 'ok'] },
    { len: 0, buf: ['ok', 'gone', 'ok'] }
  ];
  var BUF_TXT = { '': 'not arrived yet', ok: 'arrived ✓', lost: 'missing (hole)', held: 'held, out of order', done: 'delivered to the app ✓', gone: 'lost, nobody knows' };
  function renderSeg(host, msgs, i, udp) {
    clear(host);
    var m = msgs[i], toSrv = m.dir !== '<';
    host.appendChild(el('div', { class: 'seg-head' }, [el('span', { text: udp ? 'The datagram now' : 'The segment now' }), el('span', { text: m.lost ? 'this one was lost along the way' : (toSrv ? 'client → server' : 'server → client') })]));
    var ports = toSrv ? '51234 → 443' : '443 → 51234';
    var field = function (k, v, changed, off) { return el('div', { class: 'seg-f' + (changed ? ' is-new' : '') + (off ? ' is-off' : '') }, [el('small', { text: k }), el('b', { text: v })]); };
    if (udp) {
      var u = UDP_SEG[i];
      if (m.kind !== 'note') {
        host.appendChild(el('div', { class: 'seg-grid' + (m.lost ? ' is-lost' : '') }, [
          field('ports', ports), field('length', (8 + u.len) + ' B'), field('checksum', '0x3f1a'),
          field('seq', 'does not exist', false, true), field('ack', 'does not exist', false, true), field('handshake', 'does not exist', false, true)
        ]));
      }
    } else {
      var d = TCP_SEG[i], p = TCP_SEG[i - 1] || {};
      var flags = el('div', { class: 'seg-flags' });
      ['SYN', 'ACK', 'PSH', 'FIN'].forEach(function (f) { flags.appendChild(el('span', { class: d.f.indexOf(f) >= 0 ? 'on' : '', text: f })); });
      host.appendChild(el('div', { class: 'seg-grid' + (m.lost ? ' is-lost' : '') }, [
        field('ports', ports),
        field('seq', String(d.seq), d.seq !== p.seq),
        field('ack', d.ack == null ? '— (no ACK flag)' : String(d.ack), d.ack !== p.ack, d.ack == null),
        el('div', { class: 'seg-f seg-wide' }, [el('small', { text: 'flags' }), flags]),
        field('data', d.len ? d.len + ' B (bytes ' + d.seq + '–' + (d.seq + d.len - 1) + ')' : 'none (control only)', d.len !== p.len)
      ]));
      host.appendChild(el('div', { class: 'seg-states' }, [
        el('div', {}, [el('small', { text: 'client state' }), el('b', { class: d.st[0] !== (p.st || [])[0] ? 'is-new' : '', text: d.st[0] })]),
        el('div', {}, [el('small', { text: 'server state' }), el('b', { class: d.st[1] !== (p.st || [])[1] ? 'is-new' : '', text: d.st[1] })])
      ]));
    }
    var buf = (udp ? UDP_SEG[i] : TCP_SEG[i]).buf;
    var bar = el('div', { class: 'seg-buf' });
    ['101–200', '201–300', '301–400'].forEach(function (r, k) {
      bar.appendChild(el('div', { class: 'seg-chunk is-' + (buf[k] || 'empty') }, [el('b', { text: (udp ? '#' + (k + 1) : 'bytes ' + r) }), el('small', { text: BUF_TXT[buf[k]] })]));
    });
    host.appendChild(el('div', { class: 'seg-bufwrap' }, [el('small', { class: 'seg-label', text: udp ? 'what the server has' : 'server receive buffer' }), bar]));
  }
  function wTcp(root) {
    var udp = false;
    var seq = el('div', { class: 'seq' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var seg = el('div', { class: 'seg' });
    var cmp = btn('Compare with UDP', '', function () {
      udp = !udp;
      cmp.setAttribute('aria-pressed', String(udp));
      cmp.textContent = udp ? 'Back to TCP' : 'Compare with UDP';
      st.go(0);
    });
    cmp.setAttribute('aria-pressed', 'false');
    var st = stepper(root, function () { return (udp ? UDP_MSGS : TCP_MSGS).length; }, function (i) {
      var msgs = udp ? UDP_MSGS : TCP_MSGS, m = msgs[i];
      renderSeq(seq, 'Client', 'Server', msgs, i);
      renderSeg(seg, msgs, i, udp);
      clear(note);
      var ph = m.phase === 'open' ? 'Open' : m.phase === 'data' ? 'Data' : m.phase === 'close' ? 'Close' : (udp ? 'UDP' : '');
      if (ph) note.appendChild(el('span', { class: 'phase ' + (m.phase || 'data'), text: ph }));
      note.appendChild(document.createTextNode(m.note));
    });
    st.bar.appendChild(cmp);
    root.appendChild(st.bar);
    root.appendChild(note);
    root.appendChild(el('div', { class: 'tcp-split' }, [seq, seg]));
    st.go(0);
  }

  /* =============== AULA 5: TLS =============== */
  function wTls(root) {
    var R12 = [
      { t: 'TCP handshake', l: ['→ SYN', '← SYN-ACK', '→ ACK'] },
      { t: 'TLS: negotiation', l: ['→ ClientHello (versions, ciphers)', '← ServerHello + Certificate + ServerKeyExchange + ServerHelloDone'] },
      { t: 'TLS: keys', l: ['→ ClientKeyExchange + ChangeCipherSpec + Finished', '← ChangeCipherSpec + Finished'] },
      { t: 'HTTP', http: true, l: ['→ GET / (encrypted)', '← 200 OK: first byte'] }
    ];
    var R13 = [
      { t: 'TCP handshake', l: ['→ SYN', '← SYN-ACK', '→ ACK'] },
      { t: 'TLS: everything in one round', l: ['→ ClientHello + key share (already guesses the cipher)', '← ServerHello + Certificate + Finished (already encrypted)'] },
      { t: 'HTTP', http: true, l: ['→ Finished + GET / (encrypted)', '← 200 OK: first byte'] }
    ];
    var hostA = el('div', { class: 'tlscol' }), hostB = el('div', { class: 'tlscol' });
    var live = el('div', { class: 'note-box', 'aria-live': 'polite' });
    root.appendChild(el('div', { class: 'w-row' }, [el('label', { text: 'Example RTT: 80 ms' })]));
    var st = stepper(root, function () { return 5; }, function (i) {
      draw(hostA, 'TLS 1.2', R12, i);
      draw(hostB, 'TLS 1.3', R13, i);
      clear(live);
      if (i === 0) live.appendChild(document.createTextNode('No RTT spent yet. Click Next to advance one round on both sides.'));
      else {
        live.appendChild(el('p', { style: 'margin:0 0 4px' }, ['TLS 1.2: ', el('b', { text: Math.min(i, 3) + ' RTT' }), ' spent' + (i >= 4 ? '. The request went out after 3 RTTs and the response arrived in the 4th.' : ' so far.')]));
        live.appendChild(el('p', { style: 'margin:0' }, ['TLS 1.3: ', el('b', { text: Math.min(i, 2) + ' RTT' }), ' spent' + (i >= 3 ? '. The request went out after 2 RTTs and the response arrived in the 3rd.' : ' so far.')]));
      }
      if (i >= 3) live.appendChild(el('p', { class: 'muted', text: 'With an 80 ms RTT: TLS 1.2 spends 240 ms before the request goes out; TLS 1.3 spends 160 ms. When resuming a session, 1.3 can even send data in 0-RTT.' }));
    });
    function draw(host, title, rounds, i) {
      clear(host);
      host.appendChild(el('h4', { text: title }));
      var shown = 0;
      rounds.forEach(function (r, k) {
        if (k < i) {
          shown++;
          var d = el('div', { class: 'round' + (r.http ? ' http' : '') }, [el('div', { class: 'rt', text: 'RTT ' + (k + 1) + ' · ' + r.t })]);
          r.l.forEach(function (x) { d.appendChild(el('div', { text: x })); });
          host.appendChild(d);
        } else host.appendChild(el('div', { class: 'round-ph', 'aria-hidden': 'true' }));
      });
      var pre = rounds.filter(function (r) { return !r.http; }).length;
      host.appendChild(el('div', { class: 'tls-sum ' + (title === 'TLS 1.3' ? 'ok' : 'bad'), text: 'RTTs before the request: ' + pre }));
    }
    root.appendChild(st.bar);
    root.appendChild(el('div', { class: 'cols2' }, [hostA, hostB]));
    root.appendChild(live);
    st.go(0);
  }

  /* =============== AULA 6: DNS =============== */
  function wDns(root) {
    var mode = 'none';
    var NODES = [['nav', 'Browser'], ['res', 'Resolver'], ['root', 'Root (.)'], ['tld', 'TLD .dev'], ['auth', 'Authoritative']];
    var STEPS = {
      none: [
        { n: ['nav'], ms: 0, t: 'Browser and system cache', x: 'Internal question: "do I already know the IP of demo.fidelissauro.dev?" No. Cache miss.' },
        { n: ['nav', 'res'], ms: 5, t: 'Browser asks the resolver', x: 'The resolver (the provider\'s, or 8.8.8.8 / 1.1.1.1) gets the question. Its cache doesn\'t have it either. It takes over the search.' },
        { n: ['res', 'root'], ms: 25, t: 'Resolver asks the root', x: '"Who knows about demo.fidelissauro.dev?" The root doesn\'t know the IP, but answers: "ask the servers of the .dev TLD".' },
        { n: ['res', 'tld'], ms: 25, t: 'Resolver asks the .dev TLD', x: 'The TLD doesn\'t know the IP either. It answers with the NS record: "the authoritative name server for fidelissauro.dev is this one".' },
        { n: ['res', 'auth'], ms: 30, t: 'Resolver asks the authoritative server', x: 'The one with the final word. It answers the A record: demo.fidelissauro.dev = 203.0.113.42 (example IP), with a TTL of 300 s.' },
        { n: ['res', 'nav'], ms: 0, t: 'Resolver answers and caches', x: 'The resolver returns the IP to the browser and keeps it for the TTL. The browser keeps it too.' },
        { n: ['nav'], ms: 0, t: 'Browser connects to the IP', x: 'Only now do TCP (and TLS) start against 203.0.113.42. DNS is done.' }
      ],
      resolver: [
        { n: ['nav'], ms: 0, t: 'Browser and system cache', x: 'Cache miss in the browser.' },
        { n: ['nav', 'res'], ms: 5, t: 'Resolver answers from cache', x: 'Someone else resolved this name a moment ago: the resolver answers directly, without talking to the root, TLD or authoritative server.' },
        { n: ['nav'], ms: 0, t: 'Browser connects to the IP', x: 'Connects to 203.0.113.42.' }
      ],
      browser: [
        { n: ['nav'], ms: 0, t: 'Browser cache: hit', x: 'The browser already knew the IP (TTL still valid). Zero network traffic.' },
        { n: ['nav'], ms: 0, t: 'Browser connects to the IP', x: 'Connects to 203.0.113.42.' }
      ]
    };
    var nodesBox = el('div', { class: 'nodes', 'aria-hidden': 'true' });
    var info = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var gname = id('dnsmode');
    var radios = el('div', { class: 'radios', role: 'radiogroup', 'aria-label': 'Cache' });
    [['none', 'No cache'], ['resolver', 'Resolver cache'], ['browser', 'Browser cache']].forEach(function (o, k) {
      var r = el('input', { type: 'radio', name: gname, value: o[0] });
      if (k === 0) r.checked = true;
      r.addEventListener('change', function () { mode = o[0]; st.go(0); });
      radios.appendChild(el('label', {}, [r, o[1]]));
    });
    var st = stepper(root, function () { return STEPS[mode].length; }, function (i) {
      var steps = STEPS[mode], s = steps[i], seen = {}, total = 0;
      for (var k = 0; k <= i; k++) { steps[k].n.forEach(function (x) { seen[x] = true; }); total += steps[k].ms; }
      clear(nodesBox);
      NODES.forEach(function (nd) {
        nodesBox.appendChild(el('span', { class: 'node' + (s.n.indexOf(nd[0]) >= 0 ? ' active' : seen[nd[0]] ? ' seen' : '') }, [nd[1]]));
      });
      clear(info);
      info.appendChild(el('b', { text: s.t }));
      info.appendChild(el('p', { text: s.x, style: 'margin:6px 0' }));
      info.appendChild(el('span', { class: 'mono muted', text: 'Accumulated DNS time (example): ~' + total + ' ms' }));
    });
    root.appendChild(radios);
    root.appendChild(st.bar);
    root.appendChild(nodesBox);
    root.appendChild(info);
    st.go(0);
  }

  /* =============== AULA 7: DHCP =============== */
  function wDhcp(root) {
    var MSGS = [
      { phase: 'open', label: 'D · DHCPDISCOVER', detail: 'broadcast', dir: '>', note: 'Client (no IP, 0.0.0.0:68) shouts to the network (255.255.255.255:67, UDP): "is there a DHCP server out there?"', ip: null },
      { phase: 'open', label: 'O · DHCPOFFER', detail: '192.168.0.23', dir: '<', note: 'The server offers 192.168.0.23/24, gateway 192.168.0.1, DNS 192.168.0.1, a 24 h lease. If there were more servers, each could make an offer.', ip: 'oferta' },
      { phase: 'data', label: 'R · DHCPREQUEST', detail: 'broadcast', dir: '>', note: 'Client picks an offer and formally asks for it. It goes by broadcast to tell the other servers their offers were declined.', ip: 'oferta' },
      { phase: 'data', label: 'A · DHCPACK', detail: 'lease 24 h', dir: '<', note: 'Server confirms: the IP is the client\'s for 24 h. Renewal is attempted at half the time (12 h). Now the device configures the interface.', ip: 'ok' }
    ];
    var seq = el('div', { class: 'seq' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var state = el('dl', { class: 'kv' });
    var st = stepper(root, function () { return MSGS.length; }, function (i) {
      var m = MSGS[i];
      renderSeq(seq, 'Client (new phone)', 'DHCP server (router)', MSGS, i);
      clear(note); note.appendChild(document.createTextNode(m.note));
      clear(state);
      var ok = m.ip === 'ok';
      [['Client IP', ok ? '192.168.0.23' : '0.0.0.0 (none)'],
       ['Mask', ok ? '255.255.255.0 (/24)' : '-'],
       ['Gateway', ok ? '192.168.0.1' : '-'],
       ['DNS', ok ? '192.168.0.1' : '-'],
       ['Lease', ok ? '24 h' : (m.ip === 'oferta' ? 'offer: 24 h (not yours yet)' : '-')]].forEach(function (p) {
        state.appendChild(el('dt', { text: p[0] }));
        state.appendChild(el('dd', { class: ok ? 'ok' : '', text: p[1] }));
      });
    });
    root.appendChild(st.bar);
    root.appendChild(seq);
    root.appendChild(note);
    root.appendChild(el('p', { class: 'sub-h', text: 'Client configuration' }));
    root.appendChild(state);
    st.go(0);
  }

  /* =============== AULA 8: HTTP =============== */
  var RES = [['index.html', 3], ['style.css', 2], ['app.js', 2], ['logo.svg', 3], ['foto.jpg', 2], ['api/user', 4]];
  var IDLE = 2, PEN = 5, LOSTIDX = 6;
  function simHttp(proto, loss) {
    var pk = [], waits = RES.map(function () { return 0; }), n = 0, t, r, j;
    if (proto === 'h1') {
      t = 0;
      RES.forEach(function (res, r2) {
        t += IDLE;
        waits[r2] = t - IDLE >= 0 ? t : 0;
        for (j = 0; j < res[1]; j++) {
          if (loss && n === LOSTIDX) { pk.push({ lane: r2, sent: t, deliv: t + PEN }); t += PEN; }
          else { pk.push({ lane: r2, sent: t, deliv: t }); t += 1; }
          n++;
        }
      });
    } else {
      var left = RES.map(function (x) { return x[1]; }), k = IDLE, L = IDLE + LOSTIDX;
      while (left.some(function (x) { return x > 0; })) {
        for (r = 0; r < RES.length; r++) {
          if (!left[r]) continue;
          left[r]--;
          var d = k;
          if (loss) {
            if (n === LOSTIDX) d = k + PEN;
            else if (proto === 'h2' && n > LOSTIDX) d = Math.max(k, L + PEN);
          }
          pk.push({ lane: r, sent: k, deliv: d });
          k++; n++;
        }
      }
    }
    var done = RES.map(function () { return 0; }), first = RES.map(function () { return 1e9; });
    pk.forEach(function (p) { done[p.lane] = Math.max(done[p.lane], p.deliv); first[p.lane] = Math.min(first[p.lane], p.sent); });
    return { pk: pk, done: done, first: first };
  }
  function wHttp(root) {
    var loss = false, t = 0, timer = null;
    var T = Math.max.apply(null, simHttp('h1', true).done) + 2;
    var protos = [
      ['h1', 'HTTP/1.1', 'one TCP connection, one resource at a time'],
      ['h2', 'HTTP/2', 'multiplexed, but a single TCP'],
      ['h3', 'HTTP/3', 'multiplexed over QUIC (UDP)']
    ];
    var cellsRef = {}, sumRef = {};
    var playBtn = btn('Play', 'primary', function () { playing() ? stop() : play(); });
    var lossBtn = btn('Lose a packet', '', function () {
      loss = !loss; lossBtn.setAttribute('aria-pressed', String(loss));
      lossBtn.textContent = loss ? 'Packet lost (click to undo)' : 'Lose a packet';
      build(); t = 0; draw(); if (!RM) play(); else { t = T; draw(); }
    });
    lossBtn.setAttribute('aria-pressed', 'false');
    var rid = id('hr');
    var slider = el('input', { type: 'range', id: rid, min: '0', max: String(T), value: '0', 'aria-label': 'Time (ticks)' });
    slider.addEventListener('input', function () { stop(); t = Number(slider.value); draw(); });
    root.appendChild(el('div', { class: 'w-row' }, [playBtn, btn('Restart', '', function () { stop(); t = 0; draw(); if (!RM) play(); }), lossBtn,
      el('div', { class: 'range' }, [el('span', { class: 'mono muted', text: 'time' }), slider])]));
    var area = el('div'); root.appendChild(area);
    var live = el('div', { class: 'note-box', 'aria-live': 'polite' }); root.appendChild(live);
    root.appendChild(el('div', { class: 'legend', 'aria-hidden': 'true' }, [
      el('span', {}, [el('i', { class: 'w' }), 'waiting (queue / request)']),
      el('span', {}, [el('i'), 'data arriving']),
      el('span', {}, [el('i', { class: 'h' }), 'blocked: packet held back']),
      el('span', {}, [el('i', { class: 'd' }), 'resource complete'])
    ]));
    function playing() { return timer !== null; }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = 'Play'; }
    function play() {
      if (t >= T) t = 0;
      stop(); playBtn.textContent = 'Pause';
      timer = setInterval(function () { t++; if (t >= T) { t = T; stop(); } draw(); }, 180);
    }
    var sims;
    function build() {
      clear(area); cellsRef = {}; sumRef = {};
      sims = {};
      protos.forEach(function (p) {
        sims[p[0]] = simHttp(p[0], loss);
        var box = el('div', { class: 'hproto' });
        var sum = el('small', { class: 'mono' });
        box.appendChild(el('h4', {}, [p[1], el('small', { text: p[2] }), sum]));
        sumRef[p[0]] = sum;
        cellsRef[p[0]] = [];
        RES.forEach(function (res, r) {
          var cells = el('div', { class: 'cells', style: 'grid-template-columns:repeat(' + T + ',1fr)' });
          var arr = [];
          for (var c = 0; c < T; c++) { var cc = el('span', { class: 'cell' }); arr.push(cc); cells.appendChild(cc); }
          cellsRef[p[0]].push(arr);
          box.appendChild(el('div', { class: 'lane' }, [el('span', { class: 'lane-n', text: res[0], title: res[0] }), cells]));
        });
        area.appendChild(box);
      });
    }
    function draw() {
      slider.value = String(t);
      var msgs = [];
      protos.forEach(function (p) {
        var s = sims[p[0]], states = RES.map(function () { var a = []; for (var c = 0; c < T; c++) a.push('empty'); return a; });
        RES.forEach(function (res, r) {
          var firstData = s.first[r];
          for (var c = 0; c < firstData && c < T; c++) states[r][c] = 'wait';
        });
        s.pk.forEach(function (pk) {
          for (var c = pk.sent; c < pk.deliv && c < T; c++) states[pk.lane][c] = 'held';
          if (pk.deliv < T) states[pk.lane][pk.deliv] = 'data';
        });
        if (p[0] === 'h1' && loss) {
          /* HOL: resources behind the lost packet stay stalled */
          var lp = s.pk.filter(function (x) { return x.deliv > x.sent; })[0];
          if (lp) RES.forEach(function (res, r) { if (r > lp.lane) for (var c = lp.sent; c < lp.deliv && c < T; c++) if (states[r][c] === 'wait') states[r][c] = 'held'; });
        }
        RES.forEach(function (res, r) {
          var dn = s.done[r];
          states[r][dn] = 'done';
          for (var c = 0; c < T; c++) {
            var cl = 'cell ' + states[r][c] + (c > t ? ' future' : '');
            cellsRef[p[0]][r][c].className = cl;
          }
        });
        var all = Math.max.apply(null, s.done) + 1;
        sumRef[p[0]].textContent = t >= all ? 'all done at tick ' + all : 'in progress';
        msgs.push(p[1] + ': ' + all + ' ticks');
      });
      var s1 = sims.h1, s2 = sims.h2, s3 = sims.h3;
      var text;
      if (t < T) text = 'Tick ' + t + ' of ' + T + '.';
      else if (!loss) text = 'No loss: ' + msgs.join(' · ') + '. Multiplexing removes the wait of one request at a time.';
      else {
        var f2 = Math.max.apply(null, s2.done) + 1;
        text = 'With loss: ' + msgs.join(' · ') + '. In HTTP/1.1 everything behind it waits. In HTTP/2 TCP holds back the packets of all streams until the retransmission (striped bands on resources that lost nothing). In HTTP/3 only the affected resource is delayed.';
        void f2;
      }
      live.textContent = text;
      void s1; void s3;
    }
    build();
    if (RM) { t = T; draw(); } else { draw(); }
  }

  /* =============== AULA 9: latência =============== */
  function wLatency(root) {
    var S = {};
    function slider(key, label, min, max, step, val, fmt) {
      var i = id('lt');
      var out = el('output', { for: i, text: fmt(val) });
      var inp = el('input', { type: 'range', id: i, min: String(min), max: String(max), step: String(step), value: String(val) });
      S[key] = Number(val);
      inp.addEventListener('input', function () { S[key] = Number(inp.value); out.textContent = fmt(S[key]); calc(); });
      return el('div', { class: 'ctl' }, [el('label', { for: i }, [label, out]), inp]);
    }
    var ctrls = el('div', { class: 'ctrls' }, [
      slider('rtt', 'RTT', 5, 300, 5, 80, function (v) { return v + ' ms'; }),
      slider('srv', 'Server time', 0, 1000, 10, 120, function (v) { return v + ' ms'; }),
      slider('kb', 'Response size', 1, 5000, 1, 800, function (v) { return v >= 1000 ? (v / 1000).toFixed(1) + ' MB' : v + ' KB'; }),
      slider('bw', 'Bandwidth', 1, 1000, 1, 50, function (v) { return v + ' Mbps'; })
    ]);
    var C = {};
    function check(key, label, checked) {
      var i = id('lc'), inp = el('input', { type: 'checkbox', id: i });
      inp.checked = !!checked; C[key] = inp;
      inp.addEventListener('change', calc);
      var lb = el('label', { for: i }, [inp, label]);
      return lb;
    }
    var h3Label, zeroLabel;
    var tls13 = check('tls13', 'TLS 1.3 (unchecked = TLS 1.2)', false);
    var opts = el('div', { class: 'opts' }, [
      check('dns', 'DNS cache', false),
      check('ka', 'Reused connection (keep-alive)', false),
      tls13,
      h3Label = check('h3', 'HTTP/3 (QUIC)', false),
      zeroLabel = check('zero', '0-RTT (resuming a QUIC session)', false)
    ]);
    var total = el('p', { class: 'seg-total' });
    var stack = el('div', { class: 'stack', role: 'img' });
    var legend = el('ul', { class: 'legend-l' });
    var verdict = el('div', { class: 'note-box', 'aria-live': 'polite' });
    root.appendChild(ctrls); root.appendChild(opts); root.appendChild(total); root.appendChild(stack); root.appendChild(legend); root.appendChild(verdict);

    function calc() {
      var rtt = S.rtt, reuse = C.ka.checked, h3 = C.h3.checked, t13 = C.tls13.checked, zero = C.zero.checked && h3 && !reuse;
      C.zero.disabled = !(h3 && !reuse);
      zeroLabel.className = C.zero.disabled ? 'dis' : '';
      C.tls13.disabled = h3; tls13.className = h3 ? 'dis' : '';
      var dns = (C.dns.checked || reuse) ? 0 : Math.round(30 + 0.5 * rtt);
      var tcp = 0, tls = 0;
      if (!reuse) {
        if (h3) tls = zero ? 0 : rtt;
        else { tcp = rtt; tls = t13 ? rtt : 2 * rtt; }
      }
      var req = rtt;
      var srv = S.srv;
      var dl = Math.round(S.kb * 8 / S.bw);
      var parts = [
        ['c-dns', 'DNS lookup', dns, C.dns.checked || reuse ? 'cached' : 'resolver ~30 ms + half the RTT (example)'],
        ['c-tcp', 'TCP handshake', tcp, h3 ? 'does not exist: QUIC does not use TCP' : reuse ? 'connection already open' : '1 RTT'],
        ['c-tls', h3 ? 'QUIC + TLS 1.3' : 'TLS handshake', tls, reuse ? 'session already negotiated' : h3 ? (zero ? '0-RTT: data already in the first packet' : '1 RTT: transport and TLS together') : (t13 ? '1 RTT' : '2 RTTs')],
        ['c-req', 'Request (round trip)', req, '1 RTT: the request goes and the response starts coming back'],
        ['c-srv', 'Server processing', srv, 'your code, database, etc.'],
        ['c-dl', 'Download', dl, S.kb + ' KB at ' + S.bw + ' Mbps (no slow start)']
      ];
      var sum = parts.reduce(function (a, p) { return a + p[2]; }, 0);
      var ttfb = req + srv;
      total.textContent = '';
      total.appendChild(document.createTextNode(sum + ' ms '));
      total.appendChild(el('small', { text: 'in total · first byte of the response at ' + (dns + tcp + tls + ttfb) + ' ms' }));
      clear(stack); clear(legend);
      var desc = [];
      parts.forEach(function (p) {
        if (p[2] > 0) stack.appendChild(el('div', { class: 'seg ' + p[0], style: 'flex:' + p[2] + ' 1 0', title: p[1] + ': ' + p[2] + ' ms' }));
        desc.push(p[1] + ' ' + p[2] + ' ms');
        legend.appendChild(el('li', {}, [
          el('span', { class: 'sw ' + p[0] }),
          el('span', {}, [p[1], el('span', { class: 'why-s', text: p[3] })]),
          el('span', { class: 'ms', text: p[2] + ' ms' })
        ]));
      });
      stack.setAttribute('aria-label', 'Time breakdown: ' + desc.join(', '));
      var big = parts.slice().sort(function (a, b) { return b[2] - a[2]; })[0];
      var rtts = (tcp + tls + req) / rtt;
      verdict.textContent = 'Biggest piece: ' + big[1] + ' (' + Math.round(big[2] / sum * 100) + '%). Handshakes + request add up to ' + (Math.round(rtts * 10) / 10) + ' RTT' + (rtts === 1 ? '' : 's') + ' (' + Math.round(tcp + tls + req) + ' ms) before the first byte comes back, not counting the server. ' +
        (dl / sum >= 0.4 ? 'Here bandwidth matters: the download is ' + Math.round(dl / sum * 100) + '% of the total, so more bandwidth helps.' : dl / sum >= 0.15 ? 'Bandwidth and latency both matter: more bandwidth helps a little, but cutting RTTs or server time helps more.' : 'Here RTT and the server rule: more bandwidth would barely help.');
    }
    calc();
  }

  /* =============== AULA 1: linha do tempo =============== */
  function wTimeline(root) {
    var T = [
      { y: '1960s', t: 'Packet switching', s: 'Paul Baran (USA) and Donald Davies (UK) propose cutting the message into small packets that travel on their own, by different routes, instead of reserving a whole line for each conversation.' },
      { y: '1969', t: 'ARPANET', s: 'The first packet network goes live, linking 4 US institutions (UCLA, SRI, UCSB and Utah), each through a minicomputer called an IMP.' },
      { y: '1973', t: 'ALOHAnet and Ethernet', s: 'ALOHAnet, in Hawaii, showed how to share a common medium (radio). Bob Metcalfe used the idea in Ethernet: listen before talking and detect collisions (CSMA/CD).' },
      { y: '01/01/1983', t: 'TCP/IP official', s: 'ARPANET starts using TCP/IP as its official protocol. It is the date the stack becomes the common language of interconnected networks.' },
      { y: '1980s', t: 'NSFNET', s: 'NSFNET links supercomputing centers through fast backbones, over TCP/IP, and brings the internet to universities and research across the country.' },
      { y: '1989 to 1993', t: 'The Web', s: 'Tim Berners-Lee creates the Web at CERN (proposed in 1989, live in 1991). The Mosaic browser (1993) makes it easy for the general public.' }
    ];
    var list = el('ol', { class: 'tl-list', 'aria-label': 'Milestones in the history of networks' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var btns = [];
    function pick(i) {
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      clear(note);
      note.appendChild(el('b', { text: T[i].y + ' · ' + T[i].t + '. ' }));
      note.appendChild(document.createTextNode(T[i].s));
    }
    T.forEach(function (m, i) {
      var b = el('button', { type: 'button', class: 'tl-b', 'aria-pressed': 'false' }, [
        el('span', { class: 'tl-y', text: m.y }),
        el('span', { class: 'tl-t', text: m.t })
      ]);
      b.addEventListener('click', function () { pick(i); });
      btns.push(b);
      list.appendChild(el('li', null, [b]));
    });
    root.appendChild(list);
    root.appendChild(note);
    pick(0);
  }

  /* =============== AULA 2: quem decide em qual camada =============== */
  function wEquip(root) {
    var ROWS = [
      ['7-5', 'Application', 'URL path, header, cookie'],
      ['4', 'Transport', 'TCP or UDP port'],
      ['3', 'Network', 'IP address'],
      ['2', 'Data Link', 'MAC address'],
      ['1', 'Physical', 'electrical signal, light, radio']
    ];
    var TAG = { skip: 'does not look', read: 'opens and reads', decide: 'decides here', base: 'receives the signal', pass: 'only repeats the signal' };
    var DEV = [
      { n: 'Hub or repeater', l: 'layer 1', st: ['skip', 'skip', 'skip', 'skip', 'pass'], d: 'Looks at no header at all: it cleans up the signal and repeats it on every port.' },
      { n: 'Switch or bridge', l: 'layer 2', st: ['skip', 'skip', 'skip', 'decide', 'base'], d: 'Reads the frame\'s destination MAC and checks the MAC table. It sends only through the port where that MAC lives.' },
      { n: 'Router or L3 switch', l: 'layer 3', st: ['skip', 'skip', 'decide', 'read', 'base'], d: 'Opens the frame, reads the destination IP and checks the routing table. It picks the next hop and builds a new frame.' },
      { n: 'Load balancer L4', l: 'layer 4', st: ['skip', 'decide', 'read', 'read', 'base'], d: 'Decides by IP and port, without reading the content. It is fast and works for any protocol over TCP or UDP.' },
      { n: 'Proxy, application gateway or L7 load balancer', l: 'layers 4 to 7', st: ['decide', 'read', 'read', 'read', 'base'], d: 'Opens the conversation all the way to the content and decides by path, header or cookie. It is the most flexible and the one that costs the most processing.' }
    ];
    var bar = el('div', { class: 'w-row', role: 'group', 'aria-label': 'Network devices' });
    var stack = el('div', { class: 'eq-stack' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var btns = [];
    function pick(i) {
      var d = DEV[i];
      btns.forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      clear(stack);
      ROWS.forEach(function (r, k) {
        var s = d.st[k];
        stack.appendChild(el('div', { class: 'eq-row is-' + s }, [
          el('span', { class: 'eq-n', text: r[0] }),
          el('span', { class: 'eq-what' }, [el('b', { text: r[1] }), ' · ' + r[2]]),
          el('span', { class: 'eq-tag', text: TAG[s] })
        ]));
      });
      clear(note);
      note.appendChild(el('b', { text: d.n + ' (' + d.l + '). ' }));
      note.appendChild(document.createTextNode(d.d));
    }
    DEV.forEach(function (d, i) {
      var b = btn(d.n, '', function () { pick(i); });
      b.setAttribute('aria-pressed', 'false');
      btns.push(b);
      bar.appendChild(b);
    });
    root.appendChild(bar);
    root.appendChild(stack);
    root.appendChild(note);
    pick(2);
  }

  var REG = { ip: wIp, tcp: wTcp, tls: wTls, dns: wDns, dhcp: wDhcp, http: wHttp, latency: wLatency, timeline: wTimeline, equip: wEquip };
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
