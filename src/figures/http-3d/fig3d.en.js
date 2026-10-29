// Figura 3D (iso-glow): HTTP/1.1 x HTTP/2 x HTTP/3.
// Navegador da Lena (notebook, à esquerda) e servidor (à direita). Os 6 arquivos ficam na prateleira do servidor,
// saem em pacotes (pontos de luz), atravessam o tubo da conexão e enchem as 6 vagas na frente do notebook.
// Um pacote do CSS se perde: no HTTP/1.1 a fila inteira espera, no HTTP/2 o TCP segura todos os streams,
// no HTTP/3 só o stream do CSS espera. Tudo vem de uma simulação simples em ms (exemplo, RTT de 80 ms).
FIGS3D.push({ id: 'http', name: 'HTTP 1.1 · 2 · 3', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── simulação (ms de exemplo) ──
  const RTT = 80, OW = RTT / 2, GAP = 5, HOP = 14;
  const RES = [['HTML', 'index.html', 3], ['CSS', 'style.css', 4], ['JS', 'app.js', 3], ['IMG1', 'foto1.jpg', 4], ['IMG2', 'foto2.jpg', 4], ['IMG3', 'foto3.jpg', 4]];
  const LOST = { res: 1, idx: 2 };                       // o 3º pacote do CSS se perde
  const VERS = ['h1', 'h2', 'h3'], VNAME = { h1: 'HTTP/1.1', h2: 'HTTP/2', h3: 'HTTP/3' };
  function simulate(v) {
    const HS = v === 'h3' ? RTT : 2 * RTT, pk = [], req = [];
    const mk = (r, i, send) => { const p = { res: r, idx: i, send, arr: send + OW };
      if (r === LOST.res && i === LOST.idx) { p.lost = true; p.retx = send + RTT; p.arr = p.retx + OW; }
      pk.push(p); return p; };
    if (v === 'h1') {                                    // uma resposta por vez: o próximo pedido só sai quando a anterior termina
      let t = HS;
      RES.forEach(([, , n], r) => {
        req.push({ res: r, send: t, arr: t + OW });
        const mine = []; for (let i = 0; i < n; i++) mine.push(mk(r, i, t + OW + i * GAP));
        let d = 0; mine.forEach(p => { d = Math.max(d, p.arr); p.del = d; }); t = d;
      });
    } else {                                             // os 6 pedidos de uma vez; respostas em quadros intercalados
      RES.forEach((_, r) => req.push({ res: r, send: HS, arr: HS + OW }));
      let k = 0; for (let i = 0; i < 4; i++) RES.forEach(([, , n], r) => { if (i < n) mk(r, i, HS + OW + (k++) * GAP); });
      if (v === 'h2') { let d = 0; pk.forEach(p => { d = Math.max(d, p.arr); p.del = d; }); }       // TCP: uma fila só de bytes
      else RES.forEach((_, r) => { let d = 0; pk.filter(p => p.res === r).forEach(p => { d = Math.max(d, p.arr); p.del = d; }); });   // QUIC: ordem por stream
    }
    const lost = pk.find(p => p.lost), total = Math.max(...pk.map(p => p.del)), e5 = lost.arr + HOP + 10;
    const win = [[0, 0], [0, HS], [HS, HS + OW], [HS + OW, lost.send], [lost.send, lost.retx - 1], [lost.retx, e5], [e5, Math.max(e5, total + HOP + 10)], [0, 0], [total + HOP + 10, total + HOP + 10]];
    return { v, HS, pk, req, lost, total, win };
  }
  const SIM = { h1: simulate('h1'), h2: simulate('h2'), h3: simulate('h3') };
  const TOT = { h1: SIM.h1.total, h2: SIM.h2.total, h3: SIM.h3.total };

  // ── geometria (unidades iso) ──
  const TX0 = 262, TX1 = 490, LANE = 110, LANES3 = RES.map((_, r) => 75 + r * 14);
  const laneY = (v, r) => v === 'h3' ? LANES3[r] : LANE + 7;
  const SLOT = r => ({ x: 92 + (r % 3) * 64, y: 96 + Math.floor(r / 3) * 60 });         // centro da vaga (44 x 44), na bandeja do navegador
  const SHELF = r => ({ x: 523 + (r % 3) * 46, y: 67 + Math.floor(r / 3) * 52 });        // centro do arquivo na prateleira (34 x 34)
  const SRV_TOP = 147, MIDX = (TX0 + TX1) / 2, TRAY_Z = 13, SLOT_H = 44;
  const bufPos = k => [276 + (k % 6) * 16, 176 + Math.floor(k / 6) * 18, 8];

  plateWith(g0, 680, 240, [[18, 18], [662, 18], [18, 222], [662, 222]]);

  // navegador: monitor ao fundo e, na frente, a bandeja com as 6 vagas (o que já chegou)
  const lapG = new THREE.Group(); lapG.userData.go = 6; g0.add(lapG);
  rbox(130, 22, 7, 40, 24, 8, 4, bodyMat, lapG); rbox(144, 26, 15, 12, 8, 18, 2, bodyMat, lapG);
  rbox(40, 24, 33, 220, 10, 140, 5, bodyMat, lapG);
  const scr = faceCanvas('front', 47, 34, 167, 206, 128, 5, lapG);
  rbox(50, 56, 7, 200, 132, 6, 6, bodyMat, lapG);

  // servidor
  const srvG = new THREE.Group(); srvG.userData.go = 2; g0.add(srvG);
  rbox(500, 40, 7, 140, 140, 140, 6, bodyMat, srvG);
  const srvCv = faceCanvas('front', 510, 180, 140, 120, 46, 5, srvG);
  slitsUV(frontUV(500, 180, 147), 14, 126, 4, 62, 128, srvG);
  const srvLed = dotFront(624, 180, 84, 2.6, srvG); const srvGlow = glowPoints([W(624, 181, 84)], 0.22); g0.add(srvGlow);

  // tubo HTTP/1.1 e HTTP/2: uma conexão TCP
  const tubeMat = capMat(); twCaps.push(tubeMat);
  const tube12 = new THREE.Group(); tube12.userData.go = 4; g0.add(tube12);
  rbox(TX0, LANE - 17, 7, TX1 - TX0, 34, 6, 4, tubeMat, tube12);
  const rim12 = polyLine([[TX0, LANE - 17, 13.1], [TX1, LANE - 17, 13.1], [TX1, LANE + 17, 13.1], [TX0, LANE + 17, 13.1], [TX0, LANE - 17, 13.1]], accentLineMat, tube12);
  // tubo HTTP/3: QUIC sobre UDP, 6 pistas (streams)
  const tubeMat3 = capMat(); twCaps.push(tubeMat3);
  const tube3 = new THREE.Group(); tube3.userData.go = 4; g0.add(tube3);
  rbox(TX0, 66, 7, TX1 - TX0, 88, 6, 6, tubeMat3, tube3);
  seg(LANES3.slice(1).map(y => [[TX0 + 6, y - 7, 13.1], [TX1 - 6, y - 7, 13.1]]), tube3, lineMat);
  const rim3 = polyLine([[TX0, 66, 13.1], [TX1, 66, 13.1], [TX1, 154, 13.1], [TX0, 154, 13.1], [TX0, 66, 13.1]], accentLineMat, tube3);
  RES.forEach(([n], r) => label(n, 28, 9, 6.5, onTop(TX1 - 24, LANES3[r], 13), tube3));

  // vagas na frente do notebook (o que já chegou ao navegador) e o buffer
  const slots = RES.map((_, r) => { const s = SLOT(r), g = new THREE.Group(); g.userData.go = 3; g0.add(g);
    inset(s.x - 25, s.y - 25, TRAY_Z, 50, 50, 4, g);
    const fg = new THREE.Group(); g.add(fg); fg.position.copy(W(s.x, s.y, TRAY_Z)); const mat = capMat(); twCaps.push(mat);
    rbox(-22, -22, 0, 44, 44, SLOT_H, 4, mat, fg); return { g, fg, mat }; });
  const trayG = new THREE.Group(); trayG.userData.go = 4; g0.add(trayG);
  inset(266, 166, 7, 104, 46, 4, trayG); label('BUFFER', 44, 9, 7, onTop(318, 219, 7), trayG);
  const gapBox = polyLine([[269, 169, 8.2], [283, 169, 8.2], [283, 183, 8.2], [269, 183, 8.2], [269, 169, 8.2]], accentLineMat, g0);

  // arquivos na prateleira (em cima do servidor)
  const shelf = RES.map(([n], r) => { const s = SHELF(r), fg = new THREE.Group(); fg.userData.go = 2; g0.add(fg); fg.position.copy(W(s.x, s.y, SRV_TOP));
    const mat = capMat(); twCaps.push(mat); rbox(-17, -17, 0, 34, 34, 34, 3, mat, fg);
    const cv = faceCanvas('top', -17, -17, 34, 34, 34, 8, fg, true); return { fg, mat, cv, name: n }; });
  const drawShelf = () => shelf.forEach(({ cv, name }) => { const { x, P } = cv, C = pal3();
    x.clearRect(0, 0, cv.c.width, cv.c.height); x.fillStyle = C.inkHi; x.font = `600 ${(name.length > 3 ? 8.5 : 10) * P}px ${MONO3}`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, 17 * P, 17.5 * P); cv.tex.needsUpdate = true; });

  // pacotes (respostas), pedidos e o ponto do handshake
  const mkDot = (s, h) => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, 0, s, s, h, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.24); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const PK = Array.from({ length: 22 }, () => mkDot(13, 10));
  const RQ = Array.from({ length: 6 }, () => mkDot(9, 7));
  const HSD = mkDot(13, 10), TR = [mkDot(10, 8), mkDot(10, 8)];
  hazeAndShadow(g0, 340, 120, 8.2, 3.2);
  creases(first);

  // ── rótulos que olham para a câmera (sempre legíveis) ──
  const tags = [];
  function tag(h = 13) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `${fs * 0.8}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.8 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; sp.scale.set(nw / P * TS, nh / P * TS, 1);
    }
    tags.push(t); return t;
  }
  const tLap = tag(14).set('LENA\'S BROWSER').at(150, 28, 206);
  const tSrv = tag(14).set('SERVER').at(570, 110, 250);
  const tConn = tag(13), tReq = tag(12), tLost = tag(13), tRetx = tag(12), tBuf = tag(12), tQueue = tag(12), tNet = tag(13);
  const tSlot = RES.map(() => tag(14));

  // ── tela do notebook e painel do servidor ──
  let scrKey = '';
  function drawScreen(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === scrKey) return; scrKey = key;
    const { x, P } = scr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, scr.c.width, scr.c.height);
    x.textBaseline = 'middle';
    x.fillStyle = C.line; [7, 13, 19].forEach(cx => { x.beginPath(); x.arc(u(cx), u(8), u(2), 0, Math.PI * 2); x.fill(); });
    x.font = `600 ${u(7)}px ${MONO3}`; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.fillText('loja.exemplo', u(26), u(8.5));
    x.textAlign = 'right'; x.fillStyle = A_; x.fillText(`${VNAME[d.v]} · ${d.net}`, u(200), u(8.5));
    x.strokeStyle = C.detail; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(0, u(16)); x.lineTo(scr.c.width, u(16)); x.stroke();
    if (d.cmp) {
      x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('Page ready (example)', u(7), u(29));
      const mx = Math.max(...VERS.map(v => TOT[v]));
      VERS.forEach((v, i) => { const y = 44 + i * 24, w = 118 * TOT[v] / mx, on = v === d.v;
        x.fillStyle = on ? A_ : C.ink; x.font = `${on ? 600 : 400} ${u(7.5)}px ${MONO3}`; x.textAlign = 'left'; x.fillText(VNAME[v], u(7), u(y));
        x.strokeStyle = on ? A_ : C.line; x.lineWidth = u(0.7); x.beginPath(); x.roundRect(u(7), u(y + 6), u(w), u(8), u(2)); if (on) x.fill(); else x.stroke();
        x.fillStyle = on ? A_ : C.ink; x.fillText(`${TOT[v]} ms`, u(7 + w + 4), u(y + 10)); });
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('same 6 files, same loss, RTT 80 ms', u(7), u(120));
    } else {
      RES.forEach(([n], r) => { const bx = 6 + (r % 3) * 66, by = 22 + Math.floor(r / 3) * 44, bw = 62, bh = 40, f = d.fill[r], st = d.st[r], done = f >= 0.999;
        x.strokeStyle = done ? A_ : C.line; x.lineWidth = u(done ? 0.9 : 0.5); x.beginPath(); x.roundRect(u(bx), u(by), u(bw), u(bh), u(2)); x.stroke();
        x.textAlign = 'left'; x.fillStyle = done ? A_ : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(n, u(bx + 4), u(by + 9));
        x.fillStyle = done ? A_ : C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(done ? 'ready ✓' : st || '—', u(bx + 4), u(by + 21));
        x.strokeStyle = C.detail; x.beginPath(); x.roundRect(u(bx + 4), u(by + 29), u(bw - 8), u(5), u(1.5)); x.stroke();
        if (f > 0) { x.fillStyle = A_; x.beginPath(); x.roundRect(u(bx + 4), u(by + 29), u((bw - 8) * f), u(5), u(1.5)); x.fill(); } });
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(`t = ${d.t} ms (exemplo)`, u(7), u(120));
      x.textAlign = 'right'; x.fillStyle = d.ready === 6 ? A_ : C.ink; x.fillText(`ready: ${d.ready}/6`, u(200), u(120));
    }
    scr.tex.needsUpdate = true;
  }
  let srvKey = '';
  function drawServer(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === srvKey) return; srvKey = key;
    const { x, P } = srvCv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, srvCv.c.width, srvCv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('loja.exemplo', u(6), u(9));
    x.fillStyle = A_; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(`${VNAME[d.v]} · ${d.v === 'h3' ? 'QUIC/UDP' : 'TCP'}`, u(6), u(23));
    x.fillStyle = C.ink; x.font = `${u(7.5)}px ${MONO3}`; x.fillText(d.st, u(6), u(37));
    srvCv.tex.needsUpdate = true;
  }

  // ── roteiro ──
  const N = 9;
  const pick = o => o[ver] ?? (ver !== 'h3' ? o.h12 : undefined) ?? o.all;
  const STEPS = [
    { title: 'The page needs 6 files',
      story: { all: 'Lena opens a store page on her laptop. To draw the screen, the browser needs 6 files from the server: the HTML, the CSS, the JS and 3 images. (In real life the HTML arrives first and says which the others are; here we skip that part to look only at the transport.) The times are examples, with an RTT of 80 ms.' },
      look: { all: 'On the right, the 6 files wait on top of the server. On the left, 6 empty slots in front of the laptop.' },
      key: { h1: 'HTTP/1.1: one request, one response, then the next.', h2: 'HTTP/2: several requests at the same time on one TCP connection.', h3: 'HTTP/3: several requests at the same time, each in its own stream, over QUIC.' } },
    { title: 'Opening the connection',
      story: { h12: 'Before any file, the browser opens the connection. First TCP (SYN and SYN-ACK): 1 round trip. Then TLS 1.3 agrees on the keys: 1 more round trip. That is 2 RTTs, 160 ms, without a single byte of the page.',
        h3: 'HTTP/3 uses QUIC, which is born with TLS 1.3 inside. The first QUIC message already carries the ClientHello: transport and encryption are settled in the same round trip. 1 RTT, 80 ms.' },
      look: { all: 'A dot of light goes back and forth through the tube; the label above counts the RTTs.' },
      key: { h12: 'TCP + TLS 1.3 = 2 RTTs before the first request.', h3: 'QUIC combines transport and TLS: 1 RTT.' } },
    { title: 'The requests go out',
      story: { h1: 'Connection open. The browser sends the first request: GET /index.html. The other 5 wait their turn, because this connection only fits one response at a time. (That is why browsers open up to 6 connections per server; here we show one so the queue is visible.)',
        h2: 'Connection open. The browser sends all 6 requests at once, on the same connection. Each request becomes a stream with its own number, and the headers go compressed with HPACK.',
        h3: 'Connection open. The 6 requests go out together, each in its own QUIC stream. The headers go compressed with QPACK, the version of HPACK made for independent streams.' },
      look: { h1: 'Only one request crosses the tube, from the laptop to the server.', h2: 'Six requests cross the same tube together.', h3: 'Six requests cross the tube together, each in its own lane.' },
      key: { h1: 'HTTP/1.1: one request at a time per connection.', h2: 'Multiplexing: many requests on a single connection.', h3: 'Each request has its own stream, independent of the others.' } },
    { title: 'The responses arrive',
      story: { h1: 'The server sends the HTML in 3 packets. Each packet that arrives goes into its slot. Only when the HTML finishes does the browser ask for the CSS.',
        h2: 'The server answers everything together, in mixed frames: a piece of the HTML, one of the CSS, one of the JS, one of each image, and again. All through the same TCP tube, and the slots fill up together.',
        h3: 'The server answers everything together, each file in its own lane. The slots fill up together, as in HTTP/2.' },
      look: { h1: 'The HTML fills the first slot; the CSS is requested; the rest stays on the server.', h2: 'Mixed dots of light in the same tube; all the slots start to fill.', h3: 'Each lane carries one file; all the slots start to fill.' },
      key: { all: 'The file travels in packets; the slot fills as they arrive.' } },
    { title: 'A packet gets lost',
      story: { h1: 'In the middle of the CSS, a packet gets lost on the way (bad Wi-Fi, a full queue at a router). The next CSS packet arrives, but TCP delivers everything in order: it sits in the buffer, waiting for the missing one. And the JS and the 3 images have not even been requested: they are queued behind the CSS.',
        h2: 'A CSS packet gets lost. The frames of the other files keep arriving, but TCP does not know what a stream is: to it, everything is one queue of bytes. It holds in the buffer everything that arrived after the gap. HTML, JS and images wait because of one piece of the CSS.',
        h3: 'A CSS packet gets lost. Each QUIC stream has its own order, so only the CSS waits. HTML, JS and images keep arriving and filling the slots.' },
      look: { h1: 'The packet falls out of the tube. The next one sits still in the buffer, and the queue on top of the server does not move.', h2: 'The packet falls out of the tube. Everything that arrives after it stops in the buffer, dimmed: no slot fills.', h3: 'The packet falls out of the CSS lane. Only the CSS stops in the buffer; the other slots keep filling.' },
      key: { h1: 'Head-of-line blocking: the first in line blocks everyone behind it.', h2: 'HTTP/2 took the queue out of the application, but TCP still blocks all the streams together.', h3: 'In QUIC, losing a packet in one stream does not block the others.' } },
    { title: 'The resend',
      story: { h1: 'TCP notices the gap and the server resends the packet. In this example that costs about 1 more RTT (80 ms). When it arrives, the gap closes and the buffer releases the rest of the CSS. Only now can the browser request the JS.',
        h2: 'TCP notices the gap and the server resends the packet. In this example that costs about 1 more RTT (80 ms). When it arrives, the gap closes and the buffer releases everything at once: all the slots fill together.',
        h3: 'QUIC also resends the packet, in the same time. The difference: only the CSS was waiting. The other files had already arrived.' },
      look: { all: 'A dot labeled "resend" crosses the tube, and the buffer empties into the slots.' },
      key: { h12: 'Resending costs an RTT; on TCP, everyone behind the gap pays for that wait.', h3: 'The resend delays only the stream that lost the packet.' } },
    { title: 'Page ready',
      story: { h1: `After the CSS, the rest goes one at a time: request, response, next. The page is ready in ${TOT.h1} ms (example). With 6 parallel connections it would be faster, but each one pays for its own handshake.`,
        h2: `The page is ready in ${TOT.h2} ms (example): one connection, everything together, but all the files waited for the resend of one CSS packet.`,
        h3: `The page is ready in ${TOT.h3} ms (example): 80 ms less in the handshake, and the loss only delayed the CSS.` },
      look: { all: 'The laptop screen compares the three times; the lit bar is the selected version.' },
      key: { all: 'Same 6 files, same loss: what changes is how many round trips there are and who waits.' } },
    { title: 'Lena switches networks',
      story: { h12: 'Lena leaves home and the laptop moves from Wi-Fi to the phone\'s 4G. The IP changes. A TCP connection is identified by the IP and port of both sides: with a new IP, it dies. The browser opens another one and pays 2 RTTs (160 ms) of TCP + TLS again.',
        h3: 'Lena leaves home and the laptop moves from Wi-Fi to the phone\'s 4G. The IP changes, but the QUIC connection is identified by a connection ID, not by IP and port. The server recognizes the ID and the conversation goes on, with no new handshake.' },
      look: { h12: 'The tube goes dark ("connection dropped") and a new handshake starts from zero.', h3: 'The tube stays lit and the dots keep passing; the label shows the connection ID.' },
      key: { h12: 'TCP: new IP, new connection.', h3: 'QUIC: the connection ID survives the network switch.' } },
    { title: 'Summary of the three versions',
      story: { h1: 'HTTP/1.1 (1997): persistent connections, but one response at a time on each. The queue blocks in the application.', h2: 'HTTP/2 (2015): multiplexing and compressed headers (HPACK) on one TCP connection. Server push existed, but fell out of use. A loss still blocks everything in TCP.', h3: 'HTTP/3 (2022): QUIC over UDP, built-in TLS 1.3, independent streams, QPACK and connection ID.' },
      look: { all: 'The scene shows the complete page; switch the version in the panel to compare.' },
      key: { all: 'Each version attacks the same problem: one wait holding up the others.' } },
  ];
  const SUM = `<table class="h3-sum"><tr><th></th><th>1.1</th><th>2</th><th>3</th></tr>
    <tr><td>Transport</td><td>TCP</td><td>TCP</td><td>QUIC (UDP)</td></tr>
    <tr><td>Handshake</td><td>2 RTT</td><td>2 RTT</td><td>1 RTT</td></tr>
    <tr><td>Requests</td><td>1 at a time</td><td>together</td><td>together</td></tr>
    <tr><td>A loss blocks</td><td>the queue</td><td>everyone</td><td>only 1 stream</td></tr>
    <tr><td>Headers</td><td>text</td><td>HPACK</td><td>QPACK</td></tr>
    <tr><td>Example</td><td>${TOT.h1} ms</td><td>${TOT.h2} ms</td><td>${TOT.h3} ms</td></tr></table>`;

  let step = 0, ver = 'h1', lt = 0, hold = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', simNow = 0, nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-http3d-ver'); if (VERS.includes(v)) ver = v; } catch (e) {}
  const HS_LEGS = { h12: [[1, 'RTT 1 · TCP\nSYN →'], [-1, 'RTT 1 · TCP\n← SYN-ACK'], [1, 'RTT 2 · TLS 1.3\nClientHello →'], [-1, 'RTT 2 · TLS 1.3\n← ServerHello + certificado']],
    h3: [[1, 'RTT 1 · QUIC + TLS 1.3\nInitial (ClientHello) →'], [-1, 'RTT 1 · QUIC + TLS 1.3\n← response + keys']] };
  const legs = () => ver === 'h3' ? HS_LEGS.h3 : HS_LEGS.h12;
  const connText = () => ({ h1: '1 TCP + TLS connection\none response at a time', h2: '1 TCP + TLS connection\n6 mixed streams', h3: '1 QUIC (UDP) connection\n6 independent streams' })[ver];
  const speed = () => step === 6 && ver === 'h1' ? 70 : 25;      // ms de exemplo por segundo de tela
  const segEnd = () => step === 7 ? (ver === 'h3' ? 160 : 300) : SIM[ver].win[step][1];
  const segStart = () => step === 7 ? 0 : SIM[ver].win[step][0];

  function nowHtml() {
    const S = SIM[ver], t = simNow;
    if (step === 7) {
      const u = t, moved = u >= 30;
      return `<li>Network: <b>${moved ? '4G' : 'Wi-Fi'}</b> · IP ${moved ? '100.64.7.21' : '192.168.0.12'}</li>
        <li>Connection: ${ver === 'h3' ? `<b>the same</b> (connection ID 7f3a…)` : moved ? (u >= 220 ? '<b>new</b> TCP + TLS connection' : '<b>dropped</b> (IP and port changed)') : 'open'}</li>
        <li>Cost of the switch: ${ver === 'h3' ? '0 RTT' : '2 RTTs (160 ms) of handshake again'}</li>`;
    }
    const sent = S.req.filter(q => q.send <= t).length, arrived = S.pk.filter(p => p.arr <= t && (!p.lost || t >= p.arr)).length;
    const held = S.pk.filter(p => p.arr <= t && t < p.del).length, ready = RES.filter((_, r) => S.pk.filter(p => p.res === r).every(p => t >= p.del + HOP)).length;
    const lostNow = t >= S.lost.send + OW / 2 && t < S.lost.arr;
    return `<li>Clock: <b>${Math.round(t)} ms</b> <span class="h3-dim">(example, RTT 80 ms)</span></li>
      <li>Connection: ${ver === 'h3' ? '1 QUIC over UDP, TLS 1.3 built in' : '1 TCP + TLS 1.3'} · handshake ${ver === 'h3' ? '1 RTT' : '2 RTTs'}${t < S.HS ? ' <b>(opening)</b>' : ''}</li>
      <li>Requests sent: <b>${sent}/6</b>${ver === 'h1' ? ' (one at a time)' : ''}</li>
      <li>Packets: <b>${arrived}/22</b> arrived${lostNow ? ' · <b>1 lost</b>' : ''}${held ? ` · <b>${held} in the buffer</b>` : ''}</li>
      <li>Files ready: <b>${ready}/6</b></li>`;
  }
  function panelHtml() {
    const st = STEPS[step];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N}</span><span>${VNAME[ver]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="HTTP version">${VERS.map(v => `<button data-ver="${v}" aria-pressed="${v === ver}">${VNAME[v]}</button>`).join('')}</div>
      <h2>${st.title}</h2>
      <p class="o3-story">${pick(st.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(st.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(st.key)}</p>
      ${step === 8 ? SUM : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>What is happening</summary><ul class="h3-now" id="h3now">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'http') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N} · ${VNAME[ver].toLowerCase()} · ${step === 7 ? 'network switch' : Math.round(simNow) + ' ms'}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'http' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    tube12.visible = ver !== 'h3'; tube3.visible = ver === 'h3';
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N - 1, i)); lt = 0; hold = 0; dwell = 0; followT = 1.8; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setVer = v => { ver = v; lt = 0; hold = 0; scrKey = srvKey = ''; try { localStorage.setItem('sdlabs-http3d-ver', v); } catch (e) {} render(); return true; };
  const cycleVer = () => setVer(VERS[(VERS.indexOf(ver) + 1) % 3]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-ver]'); if (b && active === 'http') { setVer(b.dataset.ver); } });

  // ── um quadro da cena no instante t ──
  const place = (o, p, k) => { o.g.visible = true; o.g.position.copy(W(...p)); o.mat.emissiveIntensity = k; moveGlow(o.glow, [p[0], p[1], p[2] + 5], k > 0.5 ? 0.85 : 0); };
  const off = o => { o.g.visible = false; o.glow.material.uniforms.intensity.value = 0; };
  const along = (y, f, dir = -1) => [dir < 0 ? TX1 - (TX1 - TX0) * f : TX0 + (TX1 - TX0) * f, y, 13];
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  function scene3(t, u) {
    const S = SIM[ver], v = ver, net = step === 7;
    // pacotes de resposta
    const heldList = S.pk.filter(p => p.arr <= t && t < p.del).sort((a, b) => a.arr - b.arr);
    S.pk.forEach((p, j) => { const o = PK[j], y = laneY(v, p.res), s = SLOT(p.res);
      if (net || t < p.send) return off(o);
      if (p.lost && t < p.retx) {
        const tm = p.send + OW * 0.5;
        if (t < tm) return place(o, along(y, (t - p.send) / OW), 1);
        if (t < tm + 30) { const f = (t - tm) / 30; o.g.visible = true; o.g.position.copy(W(MIDX - 4, y + 22 * f, 13 - 70 * f * f)); o.mat.emissiveIntensity = 1 - f; o.glow.material.uniforms.intensity.value = 0; return; }
        return off(o);
      }
      const s0 = p.lost ? p.retx : p.send;
      if (t < p.arr) return place(o, along(y, (t - s0) / OW), p.lost ? 1.4 : 1);
      if (t < p.del) return place(o, bufPos(heldList.indexOf(p) + 1), 0.08);
      if (t < p.del + HOP) { const f = (t - p.del) / HOP, a = p.del > p.arr ? bufPos(0) : [TX0, y, 13], b = [s.x, s.y, TRAY_Z + SLOT_H + 4];
        const q = lerp3(a, b, f); q[2] += Math.sin(f * Math.PI) * 30; return place(o, q, 1); }
      off(o);
    });
    // pedidos (do notebook para o servidor)
    S.req.forEach((q, r) => { const o = RQ[r];
      if (!net && t >= q.send && t < q.arr) place(o, along(v === 'h3' ? LANES3[r] : LANE - 8, (t - q.send) / OW, 1), 0.55); else off(o); });
    const inFlight = S.req.filter(q => t >= q.send && t < q.arr);
    if (!net && inFlight.length) { const q = inFlight[Math.min(2, inFlight.length - 1)], p = along(v === 'h3' ? LANES3[q.res] : LANE - 8, (t - q.send) / OW, 1);
      tReq.set(inFlight.length > 1 ? `${inFlight.length} × GET →` : `GET /${RES[q.res][1]} →`, 'hi').at(p[0], p[1] - 10, 48); } else tReq.hide();
    // handshake (passo 2) ou reconexão (passo 8)
    const L = legs(); let hsT = -1;
    if (!net && t < S.HS && step >= 1) hsT = t;
    if (net && v !== 'h3' && u >= 60 && u < 220) hsT = u - 60;
    if (hsT >= 0) { const i = Math.min(L.length - 1, Math.floor(hsT / OW)), f = (hsT - i * OW) / OW, dir = L[i][0];
      place(HSD, along(v === 'h3' ? LANES3[2] : LANE, f, dir), 1.2); tConn.set(L[i][1], 'acc').at(MIDX, LANE, 92); }
    else { off(HSD);
      if (net && v !== 'h3' && u >= 30) tConn.set(u < 60 ? 'TCP connection dropped\nthe IP changed' : 'new TCP + TLS connection\n+2 RTTs', u < 60 ? 'dim' : 'hi').at(MIDX, LANE, 92);
      else if (net && v === 'h3' && u >= 30) tConn.set('same QUIC connection\nconnection ID 7f3a…', 'acc').at(MIDX, LANE, 92);
      else if (step === 0) tConn.set('no connection yet', 'dim').at(MIDX, LANE, 92);
      else tConn.set(connText(), 'hi').at(MIDX, LANE, 92); }
    // tubo aceso quando a conexão está aberta
    const open = net ? (v === 'h3' || u < 30 || u >= 220) : step >= 1 && t >= S.HS;
    const tm = v === 'h3' ? tubeMat3 : tubeMat; tm.emissiveIntensity = open ? 0.22 : (hsT >= 0 ? 0.08 : 0);
    rim12.visible = rim3.visible = open;
    // conversa contínua no passo da troca de rede
    TR.forEach((o, n) => { if (!net || !open) return off(o); const ph = ((u + n * 40) % 80) / 80;
      place(o, along(v === 'h3' ? LANES3[1 + n * 3] : LANE + (n ? 6 : -8), ph, n ? -1 : 1), 0.9); });
    // perda e reenvio
    const L0 = S.lost, ly = laneY(v, L0.res);
    if (!net && t >= L0.send + OW / 2 && t < L0.arr + HOP) tLost.set('✕ CSS packet lost', 'acc').at(MIDX + 20, ly + 70, 4); else tLost.hide();
    if (!net && t >= L0.retx && t < L0.arr) { const p = along(ly, (t - L0.retx) / OW); tRetx.set('↻ resend', 'acc').at(p[0], p[1], 40); } else tRetx.hide();
    const gapOpen = !net && t >= L0.send + OW / 2 && t < L0.arr; gapBox.visible = gapOpen;
    if (!net && (heldList.length || gapOpen) && t >= L0.send + OW / 2) tBuf.set(v === 'h3' ? `CSS stream buffer\n${heldList.length} waiting · the others go on` : `TCP buffer: 1 packet missing\n${heldList.length} waiting behind it`, 'acc').at(318, 190, 50);
    else tBuf.hide();
    // prateleira do servidor
    shelf.forEach((sh, r) => { const ps = S.pk.filter(p => p.res === r), sent = net ? ps.length : ps.filter(p => t >= p.send).length, f = 1 - sent / ps.length;
      sh.fg.visible = f > 0.01; sh.fg.scale.set(1, Math.max(0.001, f), 1); sh.mat.emissiveIntensity = sent > 0 && f > 0 ? 0.9 : 0; });
    if (v === 'h1' && !net && step >= 2) { const q = S.req.filter(q => q.send > t).map(q => RES[q.res][0]);
      if (q.length) tQueue.set(`queued: ${q.join(', ')}`, step === 4 ? 'acc' : 'dim').at(570, 110, 214); else tQueue.hide(); } else tQueue.hide();
    // vagas no navegador
    const fills = [], sts = []; let ready = 0;
    slots.forEach((sl, r) => { const ps = S.pk.filter(p => p.res === r), f = net ? 1 : ps.reduce((a, p) => a + Math.max(0, Math.min(1, (t - p.del) / HOP)), 0) / ps.length;
      const waiting = !net && f < 1 && (ps.some(p => p.arr <= t && t < p.del) || (L0.res === r && t >= L0.send + OW / 2 && t < L0.arr));
      const queued = v === 'h1' && !net && S.req[r].send > t;
      const moving = !net && ps.some(p => t >= p.send && t < p.del + HOP);
      sl.fg.visible = f > 0.01; sl.fg.scale.set(1, Math.max(0.001, f), 1); sl.mat.emissiveIntensity = f >= 1 ? 0.3 : waiting ? 0.06 : 0.9;
      const st = f >= 0.999 ? 'ready ✓' : waiting ? 'waiting' : queued && step >= 2 ? 'queued' : moving ? 'arriving' : '';
      if (f >= 0.999) ready++; fills.push(+f.toFixed(2)); sts.push(st);
      const s = SLOT(r); tSlot[r].set(f >= 0.999 ? `✓ ${RES[r][0]}` : RES[r][0], f >= 0.999 ? 'acc' : waiting || queued ? 'dim' : 'hi').at(s.x, s.y, TRAY_Z + SLOT_H + 20); });
    // notebook, servidor e rede
    drawScreen({ v, t: Math.round(t), fill: fills, st: sts, ready, net: net && u >= 30 ? '4G' : 'Wi-Fi', cmp: step === 6 && t >= SIM[v].win[6][1] - 1 || step === 8 });
    const srvSt = net ? (v === 'h3' || u < 30 || u >= 220 ? 'connected' : 'connection lost') : t < S.HS ? (step ? 'handshake…' : 'idle') :
      t >= L0.retx && t < L0.arr ? 'resending 1 packet' : S.pk.some(p => t >= p.send && t < p.arr) ? 'sending' : ready === 6 ? 'all sent' : 'waiting for a request';
    drawServer({ v, st: srvSt });
    const ledOn = srvSt === 'sending' || srvSt === 'resending 1 packet' || srvSt === 'handshake…';
    srvLed.material = ledOn ? ledOnMat : ledOffMat; srvGlow.material.uniforms.intensity.value = ledOn ? 0.8 : 0;
    if (net && u >= 30) tNet.set('Wi-Fi → 4G\nIP 192.168.0.12 → 100.64.7.21', 'acc').at(150, 28, 258); else tNet.hide();
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = [[340, 120, 50], [340, 120, 50], [340, 120, 50], [330, 120, 40], [320, 130, 30], [310, 130, 30], [300, 110, 60], [300, 110, 60], [340, 120, 50]];
  const FOCUS_M = [[340, 120, 60], [380, 110, 40], [380, 110, 40], [260, 120, 40], [330, 130, 20], [260, 140, 20], [300, 110, 60], [320, 110, 60], [320, 120, 60]];

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const a = segStart(), b = segEnd();
    let t = a + lt * speed();
    if (t >= b) { t = b; hold += dt; if (hold > 3 && b > a) { lt = 0; hold = 0; } } else lt += dt;
    if (step === 7) { simNow = t; scene3(SIM[ver].total + HOP + 10, t); }
    else { simNow = t; scene3(t, 0); }
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('h3now'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[step];
      const want = W(f[0] + (mob ? -10 : -190), f[1], f[2] + (mob ? -230 : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; const segLen = (b - a) / speed(); if (dwell >= Math.max(6.5, segLen + 4)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'v' || e.key === 'V') return cycleVer();
    if (e.key === '1' || e.key === '2' || e.key === '3') return setVer(VERS[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) go(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); drawShelf(); scrKey = srvKey = ''; });
  drawShelf(); render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch version', 'V', cycleVer]],
    view: NARROW() ? { target: W(330, 120, -190), dist: innerWidth < 640 ? 9.2 : 13 } : { target: W(150, 120, 50), dist: 16 },
    info: panelHtml(),
    hint: 'next: → · back: ← · version: V or 1 2 3 · drag to rotate' };
})() });
