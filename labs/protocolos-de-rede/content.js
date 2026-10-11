/* SDLabs · Protocolos de Rede: widgets em JS puro */
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
    var prev = btn('Voltar', '', function () { go(i - 1); });
    var next = btn('Próximo', 'primary', function () { go(i + 1); });
    var reset = btn('Reiniciar', '', function () { go(0); });
    var counter = el('span', { class: 'counter' });
    var bar = el('div', { class: 'w-row' }, [prev, next, reset, counter]);
    function go(n) {
      var len = getLen();
      i = Math.max(0, Math.min(len - 1, n));
      prev.disabled = i === 0;
      next.disabled = i >= len - 1;
      counter.textContent = 'Passo ' + (i + 1) + ' de ' + len;
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
      if (a === 10) return { priv: true, t: 'privado', why: 'Faixa 10.0.0.0/8 (10.0.0.0 a 10.255.255.255).' };
      if (a === 172 && b >= 16 && b <= 31) return { priv: true, t: 'privado', why: 'Faixa 172.16.0.0/12 (172.16.0.0 a 172.31.255.255).' };
      if (a === 192 && b === 168) return { priv: true, t: 'privado', why: 'Faixa 192.168.0.0/16 (192.168.0.0 a 192.168.255.255).' };
      if (a === 127) return { priv: false, t: 'loopback', why: '127.0.0.0/8 é a própria máquina (localhost). Não é uma das 3 faixas privadas, mas também não sai para a internet.' };
      if (a === 169 && b === 254) return { priv: false, t: 'link-local', why: '169.254.0.0/16: o aparelho não achou DHCP e se autoatribuiu um endereço.' };
      if (a === 100 && b >= 64 && b <= 127) return { priv: false, t: 'CGNAT', why: '100.64.0.0/10: faixa de NAT de operadora. Não é uma das 3 faixas privadas clássicas.' };
      if (a === 0) return { priv: false, t: 'reservado', why: '0.0.0.0/8: "este host/rede", não é endereço de destino na internet.' };
      if (a >= 224 && a <= 239) return { priv: false, t: 'multicast', why: '224.0.0.0/4: endereço de grupo (multicast), não pertence a um único dispositivo.' };
      if (a >= 240) return { priv: false, t: 'reservado', why: '240.0.0.0/4: reservado (inclui o broadcast 255.255.255.255), não é um endereço público de dispositivo.' };
      return { priv: false, t: 'público', why: 'Fora das faixas privadas: é roteável na internet (se estiver atribuído a alguém).' };
    }
    function update() {
      clear(out);
      var s = input.value.trim();
      var m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
      var o = m ? m.slice(1).map(Number) : null;
      if (!o || o.some(function (x) { return x > 255; })) {
        input.setAttribute('aria-invalid', 'true');
        out.appendChild(el('p', { class: 'bad', text: 'IPv4 inválido: use 4 números de 0 a 255 separados por ponto.' }));
        return;
      }
      input.removeAttribute('aria-invalid');
      var c = classify(o);
      var bits = el('div', { class: 'bits', role: 'img', 'aria-label': 'Binário: ' + o.map(function (x) { return ('00000000' + x.toString(2)).slice(-8); }).join('.') });
      o.forEach(function (x) {
        var b = ('00000000' + x.toString(2)).slice(-8), ob = el('div', { class: 'oct-bits' });
        b.split('').forEach(function (ch) { ob.appendChild(el('span', { class: 'bit b' + ch, text: ch })); });
        bits.appendChild(el('div', { class: 'oct' }, [ob, el('span', { class: 'oct-dec', text: String(x) })]));
      });
      out.appendChild(bits);
      out.appendChild(el('div', { class: 'verdict' }, [
        el('span', { class: 'tag ' + (c.priv ? 'ok' : 'muted'), text: c.priv ? 'PRIVADO' : c.t.toUpperCase() }),
        el('span', { text: c.priv ? c.why + ' Não é roteado na internet; precisa de NAT para sair.' : c.why })
      ]));
    }
    input.addEventListener('input', update);
    update();

    root.appendChild(el('p', { class: 'sub-h', text: 'IPv6: 128 bits = 8 grupos de 16 bits (hex)' }));
    var v6 = el('div', { class: 'v6', role: 'img', 'aria-label': 'Exemplo de IPv6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334' });
    '2001:0db8:85a3:0000:0000:8a2e:0370:7334'.split(':').forEach(function (g) { v6.appendChild(el('span', { class: 'v6g', text: g })); });
    root.appendChild(v6);
    root.appendChild(el('p', { class: 'widget-hint', text: 'Zeros em sequência podem ser abreviados com "::" (uma vez): 2001:db8:85a3::8a2e:370:7334.' }));

    root.appendChild(el('p', { class: 'sub-h', text: 'Escala: cada quadrado = 1 bit de endereço (128 no total, os 32 azuis são o IPv4)' }));
    var dots = el('div', { class: 'dots', 'aria-hidden': 'true', style: 'grid-template-columns:repeat(32,1fr)' });
    for (var d = 0; d < 128; d++) dots.appendChild(el('span', { class: 'dot' + (d < 32 ? ' on' : '') }));
    root.appendChild(dots);
    var two32 = Math.pow(2, 32);
    var rows = el('div', {}, [
      el('div', { class: 'scale-row' }, [el('span', { text: 'IPv4' }), el('div', { class: 'scale-track' }, [el('div', { class: 'scale-fill', style: 'width:' + (32 / 128 * 100) + '%' }), el('span', { class: 'scale-lbl', text: '2^32 = 4.294.967.296' })])]),
      el('div', { class: 'scale-row' }, [el('span', { text: 'IPv6' }), el('div', { class: 'scale-track' }, [el('div', { class: 'scale-fill v6f', style: 'width:100%' }), el('span', { class: 'scale-lbl', text: '2^128 ≈ 3,4 × 10^38' })])])
    ]);
    root.appendChild(rows);
    var ratio = BigInt(2) ** BigInt(96);
    root.appendChild(el('p', { class: 'widget-hint', text: 'A barra está em escala de bits (expoente), não de quantidade: em quantidade real, o IPv4 não apareceria nem como um pixel. Cada bit a mais dobra o total, e o IPv6 tem 96 bits a mais: ' + ratio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' vezes o espaço do IPv4. Com ~8 bilhões de pessoas, o IPv4 dá cerca de ' + (two32 / 8e9).toFixed(1).replace('.', ',') + ' endereço por pessoa; o IPv6, cerca de 4 × 10^28 por pessoa.' }));
  }

  /* =============== AULA 4: TCP / UDP =============== */
  var TCP_MSGS = [
    { phase: 'open', label: 'SYN', detail: 'seq=100', dir: '>', note: 'Cliente: "quero abrir uma conexão". Escolhe o ISN (Initial Sequence Number) 100.' },
    { phase: 'open', label: 'SYN-ACK', detail: 'seq=300 ack=101', dir: '<', note: 'Servidor: "topo". Escolhe o próprio ISN (300) e confirma o do cliente (ack=101: espero o byte 101).' },
    { phase: 'open', label: 'ACK', detail: 'seq=101 ack=301', dir: '>', note: 'Cliente confirma. Conexão aberta: foi 1 RTT antes de enviar qualquer dado.' },
    { phase: 'data', label: 'Dados #1', detail: 'seq=101 len=100', dir: '>', note: 'Primeiro segmento, bytes 101 a 200.' },
    { phase: 'data', label: 'ACK', detail: 'ack=201', dir: '<', note: 'Servidor: "recebi até o 200, espero o 201".' },
    { phase: 'data', label: 'Dados #2', detail: 'seq=201 len=100', dir: '>', lost: true, note: 'Este segmento se perde no caminho. O cliente não sabe ainda.' },
    { phase: 'data', label: 'Dados #3', detail: 'seq=301 len=100', dir: '>', note: 'Chega fora de ordem: o servidor guarda, mas não entrega à aplicação sem o #2.' },
    { phase: 'data', label: 'ACK duplicado', detail: 'ack=201', dir: '<', note: 'Servidor insiste: "ainda espero o 201". É o sinal de que algo faltou.' },
    { phase: 'data', label: 'Retransmite #2', detail: 'seq=201 len=100', dir: '>', note: 'Sem confirmação (timeout ou ACKs duplicados), o cliente reenvia o segmento perdido.' },
    { phase: 'data', label: 'ACK', detail: 'ack=401', dir: '<', note: 'ACK cumulativo: "recebi tudo até o 400". Na ordem certa, entrega à aplicação.' },
    { phase: 'close', label: 'FIN', detail: 'seq=401', dir: '>', note: 'Cliente terminou de enviar e fecha o seu sentido.' },
    { phase: 'close', label: 'ACK', detail: 'ack=402', dir: '<', note: 'Servidor confirma o FIN do cliente. Ele ainda pode enviar o que faltar.' },
    { phase: 'close', label: 'FIN', detail: 'seq=301', dir: '<', note: 'Servidor termina e fecha o seu sentido.' },
    { phase: 'close', label: 'ACK', detail: 'ack=302', dir: '>', note: 'Cliente confirma. Conexão encerrada (4 mensagens: four-way close).' }
  ];
  var UDP_MSGS = [
    { label: 'Datagrama #1', detail: 'sem handshake', dir: '>', note: 'Sem SYN, sem ACK: vai direto. Entregue.' },
    { label: 'Datagrama #2', detail: '', dir: '>', lost: true, note: 'Perdido no caminho. Ninguém avisa, ninguém retransmite.' },
    { label: 'Datagrama #3', detail: '', dir: '>', note: 'Entregue. O servidor não sabe que faltou o #2 e não tem como saber.' },
    { kind: 'note', text: 'Fim: o servidor tem #1 e #3. O cliente acha que enviou tudo. Se a aplicação precisar de garantias, ela mesma implementa.', note: 'UDP gastou 3 mensagens, contra 14 do TCP. Mais rápido, porém sem garantia.' }
  ];

  /* "O segmento agora": o cabeçalho real de cada mensagem, o estado de cada lado e o buffer do servidor */
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
  var BUF_TXT = { '': 'ainda não chegou', ok: 'chegou ✓', lost: 'faltando (buraco)', held: 'guardado, fora de ordem', done: 'entregue ao app ✓', gone: 'perdido, ninguém sabe' };
  function renderSeg(host, msgs, i, udp) {
    clear(host);
    var m = msgs[i], toSrv = m.dir !== '<';
    host.appendChild(el('div', { class: 'seg-head' }, [el('span', { text: udp ? 'O datagrama agora' : 'O segmento agora' }), el('span', { text: m.lost ? 'este se perdeu no caminho' : (toSrv ? 'cliente → servidor' : 'servidor → cliente') })]));
    var ports = toSrv ? '51234 → 443' : '443 → 51234';
    var field = function (k, v, changed, off) { return el('div', { class: 'seg-f' + (changed ? ' is-new' : '') + (off ? ' is-off' : '') }, [el('small', { text: k }), el('b', { text: v })]); };
    if (udp) {
      var u = UDP_SEG[i];
      if (m.kind !== 'note') {
        host.appendChild(el('div', { class: 'seg-grid' + (m.lost ? ' is-lost' : '') }, [
          field('portas', ports), field('tamanho', (8 + u.len) + ' B'), field('checksum', '0x3f1a'),
          field('seq', 'não existe', false, true), field('ack', 'não existe', false, true), field('handshake', 'não existe', false, true)
        ]));
      }
    } else {
      var d = TCP_SEG[i], p = TCP_SEG[i - 1] || {};
      var flags = el('div', { class: 'seg-flags' });
      ['SYN', 'ACK', 'PSH', 'FIN'].forEach(function (f) { flags.appendChild(el('span', { class: d.f.indexOf(f) >= 0 ? 'on' : '', text: f })); });
      host.appendChild(el('div', { class: 'seg-grid' + (m.lost ? ' is-lost' : '') }, [
        field('portas', ports),
        field('seq', String(d.seq), d.seq !== p.seq),
        field('ack', d.ack == null ? '— (sem flag ACK)' : String(d.ack), d.ack !== p.ack, d.ack == null),
        el('div', { class: 'seg-f seg-wide' }, [el('small', { text: 'flags' }), flags]),
        field('dados', d.len ? d.len + ' B (bytes ' + d.seq + '–' + (d.seq + d.len - 1) + ')' : 'nenhum (só controle)', d.len !== p.len)
      ]));
      host.appendChild(el('div', { class: 'seg-states' }, [
        el('div', {}, [el('small', { text: 'estado do cliente' }), el('b', { class: d.st[0] !== (p.st || [])[0] ? 'is-new' : '', text: d.st[0] })]),
        el('div', {}, [el('small', { text: 'estado do servidor' }), el('b', { class: d.st[1] !== (p.st || [])[1] ? 'is-new' : '', text: d.st[1] })])
      ]));
    }
    var buf = (udp ? UDP_SEG[i] : TCP_SEG[i]).buf;
    var bar = el('div', { class: 'seg-buf' });
    ['101–200', '201–300', '301–400'].forEach(function (r, k) {
      bar.appendChild(el('div', { class: 'seg-chunk is-' + (buf[k] || 'empty') }, [el('b', { text: (udp ? '#' + (k + 1) : 'bytes ' + r) }), el('small', { text: BUF_TXT[buf[k]] })]));
    });
    host.appendChild(el('div', { class: 'seg-bufwrap' }, [el('small', { class: 'seg-label', text: udp ? 'o que o servidor tem' : 'buffer de recepção do servidor' }), bar]));
  }
  function wTcp(root) {
    var udp = false;
    var seq = el('div', { class: 'seq' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var seg = el('div', { class: 'seg' });
    var cmp = btn('Comparar com UDP', '', function () {
      udp = !udp;
      cmp.setAttribute('aria-pressed', String(udp));
      cmp.textContent = udp ? 'Voltar ao TCP' : 'Comparar com UDP';
      st.go(0);
    });
    cmp.setAttribute('aria-pressed', 'false');
    var st = stepper(root, function () { return (udp ? UDP_MSGS : TCP_MSGS).length; }, function (i) {
      var msgs = udp ? UDP_MSGS : TCP_MSGS, m = msgs[i];
      renderSeq(seq, 'Cliente', 'Servidor', msgs, i);
      renderSeg(seg, msgs, i, udp);
      clear(note);
      var ph = m.phase === 'open' ? 'Abrir' : m.phase === 'data' ? 'Dados' : m.phase === 'close' ? 'Fechar' : (udp ? 'UDP' : '');
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
      { t: 'TLS: negociação', l: ['→ ClientHello (versões, cifras)', '← ServerHello + Certificado + ServerKeyExchange + ServerHelloDone'] },
      { t: 'TLS: chaves', l: ['→ ClientKeyExchange + ChangeCipherSpec + Finished', '← ChangeCipherSpec + Finished'] },
      { t: 'HTTP', http: true, l: ['→ GET / (criptografado)', '← 200 OK: primeiro byte'] }
    ];
    var R13 = [
      { t: 'TCP handshake', l: ['→ SYN', '← SYN-ACK', '→ ACK'] },
      { t: 'TLS: tudo numa rodada', l: ['→ ClientHello + key share (já adivinha a cifra)', '← ServerHello + Certificado + Finished (já criptografado)'] },
      { t: 'HTTP', http: true, l: ['→ Finished + GET / (criptografado)', '← 200 OK: primeiro byte'] }
    ];
    var hostA = el('div', { class: 'tlscol' }), hostB = el('div', { class: 'tlscol' });
    var live = el('div', { class: 'note-box', 'aria-live': 'polite' });
    root.appendChild(el('div', { class: 'w-row' }, [el('label', { text: 'RTT de exemplo: 80 ms' })]));
    var st = stepper(root, function () { return 5; }, function (i) {
      draw(hostA, 'TLS 1.2', R12, i);
      draw(hostB, 'TLS 1.3', R13, i);
      clear(live);
      if (i === 0) live.appendChild(document.createTextNode('Nenhum RTT gasto ainda. Clique em Próximo para avançar uma rodada nos dois lados.'));
      else {
        live.appendChild(el('p', { style: 'margin:0 0 4px' }, ['TLS 1.2: ', el('b', { text: Math.min(i, 3) + ' RTT' }), ' gastos' + (i >= 4 ? '. A requisição saiu após 3 RTTs e a resposta chegou no 4º.' : ' até agora.')]));
        live.appendChild(el('p', { style: 'margin:0' }, ['TLS 1.3: ', el('b', { text: Math.min(i, 2) + ' RTT' }), ' gastos' + (i >= 3 ? '. A requisição saiu após 2 RTTs e a resposta chegou no 3º.' : ' até agora.')]));
      }
      if (i >= 3) live.appendChild(el('p', { class: 'muted', text: 'Com 80 ms de RTT: TLS 1.2 gasta 240 ms antes de a requisição sair; TLS 1.3 gasta 160 ms. Retomando uma sessão, o 1.3 ainda pode enviar dados no 0-RTT.' }));
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
      host.appendChild(el('div', { class: 'tls-sum ' + (title === 'TLS 1.3' ? 'ok' : 'bad'), text: 'RTTs antes da requisição: ' + pre }));
    }
    root.appendChild(st.bar);
    root.appendChild(el('div', { class: 'cols2' }, [hostA, hostB]));
    root.appendChild(live);
    st.go(0);
  }

  /* =============== AULA 6: DNS =============== */
  function wDns(root) {
    var mode = 'none';
    var NODES = [['nav', 'Navegador'], ['res', 'Resolver'], ['root', 'Raiz (.)'], ['tld', 'TLD .dev'], ['auth', 'Autoritativo']];
    var STEPS = {
      none: [
        { n: ['nav'], ms: 0, t: 'Cache do navegador e do sistema', x: 'Pergunta interna: "já sei o IP de demo.fidelissauro.dev?" Não. Cache miss.' },
        { n: ['nav', 'res'], ms: 5, t: 'Navegador pergunta ao resolver', x: 'O resolver (do provedor, ou 8.8.8.8 / 1.1.1.1) recebe a pergunta. O cache dele também não tem. Ele assume a busca.' },
        { n: ['res', 'root'], ms: 25, t: 'Resolver pergunta à raiz', x: '"Quem sabe de demo.fidelissauro.dev?" A raiz não sabe o IP, mas responde: "pergunte aos servidores do TLD .dev".' },
        { n: ['res', 'tld'], ms: 25, t: 'Resolver pergunta ao TLD .dev', x: 'O TLD também não sabe o IP. Responde com o registro NS: "o servidor de nomes autoritativo de fidelissauro.dev é este".' },
        { n: ['res', 'auth'], ms: 30, t: 'Resolver pergunta ao autoritativo', x: 'Quem tem a palavra final. Responde o registro A: demo.fidelissauro.dev = 203.0.113.42 (IP de exemplo), com TTL de 300 s.' },
        { n: ['res', 'nav'], ms: 0, t: 'Resolver responde e guarda em cache', x: 'O resolver devolve o IP ao navegador e o guarda pelo TTL. O navegador também guarda.' },
        { n: ['nav'], ms: 0, t: 'Navegador conecta ao IP', x: 'Só agora começa o TCP (e o TLS) contra 203.0.113.42. O DNS acabou.' }
      ],
      resolver: [
        { n: ['nav'], ms: 0, t: 'Cache do navegador e do sistema', x: 'Cache miss no navegador.' },
        { n: ['nav', 'res'], ms: 5, t: 'Resolver responde do cache', x: 'Outra pessoa já resolveu esse nome há pouco: o resolver responde direto, sem falar com raiz, TLD ou autoritativo.' },
        { n: ['nav'], ms: 0, t: 'Navegador conecta ao IP', x: 'Conecta a 203.0.113.42.' }
      ],
      browser: [
        { n: ['nav'], ms: 0, t: 'Cache do navegador: acerto', x: 'O navegador já sabia o IP (TTL ainda válido). Zero tráfego de rede.' },
        { n: ['nav'], ms: 0, t: 'Navegador conecta ao IP', x: 'Conecta a 203.0.113.42.' }
      ]
    };
    var nodesBox = el('div', { class: 'nodes', 'aria-hidden': 'true' });
    var info = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var gname = id('dnsmode');
    var radios = el('div', { class: 'radios', role: 'radiogroup', 'aria-label': 'Cache' });
    [['none', 'Sem cache'], ['resolver', 'Cache no resolver'], ['browser', 'Cache no navegador']].forEach(function (o, k) {
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
      info.appendChild(el('span', { class: 'mono muted', text: 'Tempo acumulado de DNS (exemplo): ~' + total + ' ms' }));
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
      { phase: 'open', label: 'D · DHCPDISCOVER', detail: 'broadcast', dir: '>', note: 'Cliente (sem IP, 0.0.0.0:68) grita para a rede (255.255.255.255:67, UDP): "tem algum servidor DHCP aí?"', ip: null },
      { phase: 'open', label: 'O · DHCPOFFER', detail: '192.168.0.23', dir: '<', note: 'O servidor oferece 192.168.0.23/24, gateway 192.168.0.1, DNS 192.168.0.1, lease de 24 h. Se houvesse mais servidores, cada um poderia ofertar.', ip: 'oferta' },
      { phase: 'data', label: 'R · DHCPREQUEST', detail: 'broadcast', dir: '>', note: 'Cliente escolhe uma oferta e a pede formalmente. Vai em broadcast para avisar os outros servidores que recusou as ofertas deles.', ip: 'oferta' },
      { phase: 'data', label: 'A · DHCPACK', detail: 'lease 24 h', dir: '<', note: 'Servidor confirma: o IP é do cliente por 24 h. Renovação tentada na metade do tempo (12 h). Agora o aparelho configura a interface.', ip: 'ok' }
    ];
    var seq = el('div', { class: 'seq' });
    var note = el('div', { class: 'note-box', 'aria-live': 'polite' });
    var state = el('dl', { class: 'kv' });
    var st = stepper(root, function () { return MSGS.length; }, function (i) {
      var m = MSGS[i];
      renderSeq(seq, 'Cliente (celular novo)', 'Servidor DHCP (roteador)', MSGS, i);
      clear(note); note.appendChild(document.createTextNode(m.note));
      clear(state);
      var ok = m.ip === 'ok';
      [['IP do cliente', ok ? '192.168.0.23' : '0.0.0.0 (nenhum)'],
       ['Máscara', ok ? '255.255.255.0 (/24)' : '-'],
       ['Gateway', ok ? '192.168.0.1' : '-'],
       ['DNS', ok ? '192.168.0.1' : '-'],
       ['Lease', ok ? '24 h' : (m.ip === 'oferta' ? 'oferta: 24 h (ainda não é seu)' : '-')]].forEach(function (p) {
        state.appendChild(el('dt', { text: p[0] }));
        state.appendChild(el('dd', { class: ok ? 'ok' : '', text: p[1] }));
      });
    });
    root.appendChild(st.bar);
    root.appendChild(seq);
    root.appendChild(note);
    root.appendChild(el('p', { class: 'sub-h', text: 'Configuração do cliente' }));
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
      ['h1', 'HTTP/1.1', 'uma conexão TCP, um recurso por vez'],
      ['h2', 'HTTP/2', 'multiplexado, mas um único TCP'],
      ['h3', 'HTTP/3', 'multiplexado sobre QUIC (UDP)']
    ];
    var cellsRef = {}, sumRef = {};
    var playBtn = btn('Reproduzir', 'primary', function () { playing() ? stop() : play(); });
    var lossBtn = btn('Perder um pacote', '', function () {
      loss = !loss; lossBtn.setAttribute('aria-pressed', String(loss));
      lossBtn.textContent = loss ? 'Pacote perdido (clique para desfazer)' : 'Perder um pacote';
      build(); t = 0; draw(); if (!RM) play(); else { t = T; draw(); }
    });
    lossBtn.setAttribute('aria-pressed', 'false');
    var rid = id('hr');
    var slider = el('input', { type: 'range', id: rid, min: '0', max: String(T), value: '0', 'aria-label': 'Tempo (ticks)' });
    slider.addEventListener('input', function () { stop(); t = Number(slider.value); draw(); });
    root.appendChild(el('div', { class: 'w-row' }, [playBtn, btn('Reiniciar', '', function () { stop(); t = 0; draw(); if (!RM) play(); }), lossBtn,
      el('div', { class: 'range' }, [el('span', { class: 'mono muted', text: 'tempo' }), slider])]));
    var area = el('div'); root.appendChild(area);
    var live = el('div', { class: 'note-box', 'aria-live': 'polite' }); root.appendChild(live);
    root.appendChild(el('div', { class: 'legend', 'aria-hidden': 'true' }, [
      el('span', {}, [el('i', { class: 'w' }), 'esperando (fila / pedido)']),
      el('span', {}, [el('i'), 'dados chegando']),
      el('span', {}, [el('i', { class: 'h' }), 'bloqueado: pacote ficou retido']),
      el('span', {}, [el('i', { class: 'd' }), 'recurso completo'])
    ]));
    function playing() { return timer !== null; }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = 'Reproduzir'; }
    function play() {
      if (t >= T) t = 0;
      stop(); playBtn.textContent = 'Pausar';
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
          /* HOL: recursos atrás do pacote perdido ficam parados */
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
        sumRef[p[0]].textContent = t >= all ? 'tudo pronto no tick ' + all : 'em andamento';
        msgs.push(p[1] + ': ' + all + ' ticks');
      });
      var s1 = sims.h1, s2 = sims.h2, s3 = sims.h3;
      var text;
      if (t < T) text = 'Tick ' + t + ' de ' + T + '.';
      else if (!loss) text = 'Sem perda: ' + msgs.join(' · ') + '. Multiplexar elimina a espera de um pedido por vez.';
      else {
        var f2 = Math.max.apply(null, s2.done) + 1;
        text = 'Com perda: ' + msgs.join(' · ') + '. No HTTP/1.1 tudo que vem atrás espera. No HTTP/2 o TCP retém os pacotes de todos os fluxos até a retransmissão (faixas listradas em recursos que nem perderam nada). No HTTP/3 só o recurso afetado atrasa.';
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
      slider('srv', 'Tempo do servidor', 0, 1000, 10, 120, function (v) { return v + ' ms'; }),
      slider('kb', 'Tamanho da resposta', 1, 5000, 1, 800, function (v) { return v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',') + ' MB' : v + ' KB'; }),
      slider('bw', 'Banda', 1, 1000, 1, 50, function (v) { return v + ' Mbps'; })
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
    var tls13 = check('tls13', 'TLS 1.3 (desmarcado = TLS 1.2)', false);
    var opts = el('div', { class: 'opts' }, [
      check('dns', 'Cache de DNS', false),
      check('ka', 'Conexão reutilizada (keep-alive)', false),
      tls13,
      h3Label = check('h3', 'HTTP/3 (QUIC)', false),
      zeroLabel = check('zero', '0-RTT (retomando sessão QUIC)', false)
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
        ['c-dns', 'DNS lookup', dns, C.dns.checked || reuse ? 'em cache' : 'resolver ~30 ms + metade do RTT (exemplo)'],
        ['c-tcp', 'TCP handshake', tcp, h3 ? 'não existe: QUIC não usa TCP' : reuse ? 'conexão já aberta' : '1 RTT'],
        ['c-tls', h3 ? 'QUIC + TLS 1.3' : 'TLS handshake', tls, reuse ? 'sessão já negociada' : h3 ? (zero ? '0-RTT: dados já no primeiro pacote' : '1 RTT: transporte e TLS juntos') : (t13 ? '1 RTT' : '2 RTTs')],
        ['c-req', 'Requisição (ida e volta)', req, '1 RTT: o pedido vai e a resposta começa a voltar'],
        ['c-srv', 'Servidor processando', srv, 'o seu código, banco de dados, etc.'],
        ['c-dl', 'Download', dl, S.kb + ' KB a ' + S.bw + ' Mbps (sem slow start)']
      ];
      var sum = parts.reduce(function (a, p) { return a + p[2]; }, 0);
      var ttfb = req + srv;
      total.textContent = '';
      total.appendChild(document.createTextNode(sum + ' ms '));
      total.appendChild(el('small', { text: 'no total · primeiro byte da resposta em ' + (dns + tcp + tls + ttfb) + ' ms' }));
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
      stack.setAttribute('aria-label', 'Composição do tempo: ' + desc.join(', '));
      var big = parts.slice().sort(function (a, b) { return b[2] - a[2]; })[0];
      var rtts = (tcp + tls + req) / rtt;
      verdict.textContent = 'Maior pedaço: ' + big[1] + ' (' + Math.round(big[2] / sum * 100) + '%). Handshakes + requisição somam ' + (Math.round(rtts * 10) / 10) + ' RTT' + (rtts === 1 ? '' : 's') + ' (' + Math.round(tcp + tls + req) + ' ms) antes do primeiro byte voltar, fora o servidor. ' +
        (dl / sum >= 0.4 ? 'Aqui a banda pesa: o download é ' + Math.round(dl / sum * 100) + '% do total, então aumentar a banda ajuda.' : dl / sum >= 0.15 ? 'Banda e latência pesam: mais banda ajuda um pouco, mas cortar RTTs ou tempo de servidor ajuda mais.' : 'Aqui o RTT e o servidor mandam: mais banda quase não ajudaria.');
    }
    calc();
  }

  var REG = { ip: wIp, tcp: wTcp, tls: wTls, dns: wDns, dhcp: wDhcp, http: wHttp, latency: wLatency };
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

/* ---------- modo foco, barra de estado, concluídas e flashcards ---------- */
(function () {
  'use strict';
  var root = document.querySelector('.sdl-content');
  if (!root) return;
  var lessons = Array.prototype.slice.call(root.querySelectorAll('.lesson'));
  var N = lessons.length;
  if (!N) return;
  var KEY = 'sdl-protocolos-de-rede:';
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

  /* segmentos da barra de progresso */
  var segs = lessons.map(function () { var s = document.createElement('span'); s.className = 'pg-seg'; track.appendChild(s); return s; });
  track.setAttribute('aria-valuemax', String(N));

  function render() {
    var dc = doneCount(), l = lessons[cur];
    statusText.textContent = 'Aula ' + (cur + 1) + ' de ' + N + ' · ' + title(l) + ' · ~' + l.getAttribute('data-min') + ' min';
    count.textContent = dc + '/' + N + ' ✓';
    track.setAttribute('aria-valuenow', String(dc));
    track.setAttribute('aria-valuetext', dc + ' de ' + N + ' aulas entendidas');
    segs.forEach(function (s, i) { s.className = 'pg-seg' + (done[lessons[i].id] ? ' done' : '') + (i === cur ? ' cur' : ''); });
    prevBtn.disabled = cur === 0; nextBtn.disabled = cur === N - 1;
    tocLinks.forEach(function (a, i) {
      var ck = a.querySelector('.toc-ck');
      if (done[lessons[i] && lessons[i].id]) {
        if (!ck) { ck = document.createElement('span'); ck.className = 'toc-ck'; ck.textContent = '✓'; ck.setAttribute('aria-label', 'entendida'); a.appendChild(ck); }
      } else if (ck) a.removeChild(ck);
      if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    lessons.forEach(function (ls, i) {
      var b = ls.querySelector('.done-btn'), msg = ls.querySelector('.done-msg'), nx = ls.querySelector('[data-nav="next"]');
      var isDone = !!done[ls.id];
      if (b) { b.setAttribute('aria-pressed', String(isDone)); b.textContent = isDone ? 'Aula entendida ✓ (clique para desfazer)' : 'Entendi esta aula ✓'; }
      if (msg) msg.textContent = isDone ? dc + ' de ' + N + ' ✓' + (i < N - 1 ? ' · Próxima: Aula ' + (i + 2) + ', ' + title(lessons[i + 1]) : ' · Módulo completo!') : '';
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
})();
