// Figura 3D (iso-glow): TCP x UDP.
// O celular da Lena (cliente, à esquerda) manda ao servidor do app (à direita, ao fundo) as 3 primeiras fatias da foto do gato
// (3 segmentos de 100 bytes; as fatias reais têm ~1.460 bytes, o exemplo é menor para caber na tela).
// Dois trilhos: o de cima leva segmentos ao servidor, o da frente traz os ACKs. Na frente do servidor, o buffer de
// recepção com 3 vagas (bytes 101–200, 201–300, 301–400). O #2 cai do trilho; no TCP ele volta, no UDP some de vez.
// Números (ISN 100 e 300, portas 51234 → 443) são os do widget da aula 4; são exemplos.
FIGS3D.push({ id: 'tcp', name: 'TCP · UDP', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── geometria (unidades iso) ──
  const DY = 150, AY = 210, RX0 = 150, RX1 = 548, CHX = 704;          // trilho de dados (y=150), de ACKs (y=210)
  const RZ = 24, TRAY_Z = 13, SX = [578, 620, 662], SY = 150, SRV_FRONT = 120;
  const RANGES = ['101–200', '201–300', '301–400'];

  plateWith(g0, 730, 250, [[18, 18], [712, 18], [18, 232], [712, 232]]);
  label('THE NETWORK · Wi-Fi, routers, cables', 230, 12, 8, onTop(350, 78, 7), g0);

  // celular na base (cliente)
  const phoneG = new THREE.Group(); phoneG.userData.go = 'hs'; g0.add(phoneG);
  rbox(30, 125, 7, 120, 110, 10, 8, bodyMat, phoneG);
  rbox(73, 150, 17, 40, 15, 45, 3, bodyMat, phoneG);
  rbox(60, 165, 17, 66, 10, 140, 9, bodyMat, phoneG);
  const phScr = faceCanvas('front', 64, 175, 152, 58, 126, 5, phoneG);
  const phLed = dotFront(93, 175, 23, 2.2, phoneG); const phGlow = glowPoints([W(93, 176, 23)], 0.22); g0.add(phGlow);

  // servidor (ao fundo, à direita)
  const srvG = new THREE.Group(); srvG.userData.go = 'srv'; g0.add(srvG);
  rbox(560, 20, 7, 140, 100, 110, 6, bodyMat, srvG);
  const srvCv = faceCanvas('front', 566, SRV_FRONT, 113, 128, 72, 5, srvG);
  slitsUV(frontUV(560, SRV_FRONT, 117), 14, 110, 4, 80, 104, srvG);
  const srvLed = dotFront(684, SRV_FRONT, 26, 2.6, srvG); const srvGlow = glowPoints([W(684, SRV_FRONT + 1, 26)], 0.22); g0.add(srvGlow);

  // trilhos (esteiras)
  const railMatD = capMat(), railMatA = capMat(); twCaps.push(railMatD, railMatA);
  const railD = new THREE.Group(); railD.userData.go = 'loss'; g0.add(railD);
  rbox(RX0, DY - 14, 7, RX1 - RX0, 28, 17, 4, railMatD, railD);
  const railA = new THREE.Group(); railA.userData.go = 'loss'; g0.add(railA);
  rbox(RX0, AY - 14, 7, CHX + 10 - RX0, 28, 17, 4, railMatA, railA);
  rbox(CHX - 10, SRV_FRONT, 7, 20, AY - SRV_FRONT - 4, 17, 3, railMatA, railA);          // rampa do servidor até o trilho de ACKs
  const slats = (y, x0, x1) => { const s = []; for (let x = x0; x <= x1; x += 14) s.push([[x, y - 12, RZ + 0.1], [x, y + 12, RZ + 0.1]]); return s; };
  seg([...slats(DY, 300, RX1 - 8), ...slats(AY, RX0 + 8, 250), ...slats(AY, 380, CHX - 16)], g0);
  label('TO THE APP SERVER →', 96, 10, 6.5, onTop(222, DY, RZ), g0);
  label('← TO LENA\'S PHONE', 96, 10, 6.5, onTop(316, AY, RZ), g0);
  const rimD = polyLine([[RX0, DY - 14, RZ + 0.2], [RX1, DY - 14, RZ + 0.2], [RX1, DY + 14, RZ + 0.2], [RX0, DY + 14, RZ + 0.2], [RX0, DY - 14, RZ + 0.2]], accentLineMat, g0);
  const rimA = polyLine([[RX0, AY - 14, RZ + 0.2], [CHX + 10, AY - 14, RZ + 0.2], [CHX + 10, AY + 14, RZ + 0.2], [RX0, AY + 14, RZ + 0.2], [RX0, AY - 14, RZ + 0.2]], accentLineMat, g0);

  // buffer de recepção (bandeja na frente do servidor)
  const trayG = new THREE.Group(); trayG.userData.go = 'buf'; g0.add(trayG);
  rbox(552, 126, 7, 136, 60, 6, 5, bodyMat, trayG);
  SX.forEach(x => inset(x - 19, SY - 19, TRAY_Z, 38, 38, 4, trayG));
  label('RECEIVE BUFFER', 120, 9, 6.2, onTop(620, 178, TRAY_Z), trayG);
  const rngT = SX.map((x, k) => label(RANGES[k], 34, 9, 6.4, onTop(x, SY, TRAY_Z), trayG));
  const rngU = SX.map((x, k) => label('#' + (k + 1), 34, 9, 7, onTop(x, SY, TRAY_Z), trayG));
  // a vaga vazada: contorno tracejado aceso
  const dash = []; { const x0 = SX[1] - 21, x1 = SX[1] + 21, y0 = SY - 21, y1 = SY + 21, z = TRAY_Z + 0.3, n = 6;
    for (let i = 0; i < n; i++) { const a = i / n, b = (i + 0.55) / n;
      dash.push([[x0 + (x1 - x0) * a, y0, z], [x0 + (x1 - x0) * b, y0, z]], [[x0 + (x1 - x0) * a, y1, z], [x0 + (x1 - x0) * b, y1, z]],
        [[x0, y0 + (y1 - y0) * a, z], [x0, y0 + (y1 - y0) * b, z]], [[x1, y0 + (y1 - y0) * a, z], [x1, y0 + (y1 - y0) * b, z]]); } }
  const holeG = new THREE.Group(); g0.add(holeG); seg(dash, holeG, accentLineMat);

  // blocos: 3 segmentos de dados (fixos) e 2 de controle (reaproveitados)
  const blocks = [];
  function mkBlock(w, d, h, data) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-w / 2, -d / 2, 0, w, d, h, 3, mat, g);
    const cv = faceCanvas('top', -w / 2, -d / 2, h, w, d, 8, g, true);
    const glow = glowPoints([W(0, 0, 0)], 0.24); g0.add(glow); g.visible = false;
    const b = { g, mat, cv, glow, w, d, txt: '', key: '', data }; blocks.push(b); return b;
  }
  function drawTop(b, text) {
    const key = text + theme; if (key === b.key) return; b.key = key; b.txt = text;
    const { x, P } = b.cv, C = pal3(); x.clearRect(0, 0, b.cv.c.width, b.cv.c.height);
    x.fillStyle = C.inkHi; x.textAlign = 'center'; x.textBaseline = 'middle';
    const fs = text.length > 4 ? 7 : text.length > 2 ? 9 : 12; x.font = `600 ${fs * P}px ${MONO3}`;
    x.fillText(text, b.w / 2 * P, b.d / 2 * P + P * 0.5); b.cv.tex.needsUpdate = true;
  }
  const DB = [0, 1, 2].map(() => mkBlock(34, 28, 16, true));
  const CB = [0, 1].map(() => mkBlock(32, 22, 9, false));
  hazeAndShadow(g0, 365, 130, 8, 3.2);
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
      tex.needsUpdate = true; const k = NARROW() ? 1.25 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tCli = tag(14), tSrv = tag(14), tConn = tag(13), tLost = tag(13), tWait = tag(13), tTimer = tag(12), tNoAck = tag(12);
  const tMsg = [tag(13), tag(13)];

  // ── mensagens (mesmos números do widget da aula: TCP_MSGS / TCP_SEG / UDP_SEG) ──
  const TCP = [
    { k: 'c', lab: 'SYN', dir: '>', f: ['SYN'], seq: 100, ack: null, len: 0, send: { c: 'SYN_SENT' }, arr: { s: 'SYN_RECEIVED' } },
    { k: 'c', lab: 'SYN-ACK', dir: '<', f: ['SYN', 'ACK'], seq: 300, ack: 101, len: 0, arr: { c: 'ESTABLISHED' } },
    { k: 'c', lab: 'ACK', dir: '>', f: ['ACK'], seq: 101, ack: 301, len: 0, arr: { s: 'ESTABLISHED' } },
    { k: 'd', seg: 0, lab: '#1', dir: '>', f: ['ACK', 'PSH'], seq: 101, ack: 301, len: 100 },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 201, len: 0 },
    { k: 'd', seg: 1, lab: '#2', dir: '>', f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, lost: true },
    { k: 'd', seg: 2, lab: '#3', dir: '>', f: ['ACK', 'PSH'], seq: 301, ack: 301, len: 100 },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 201, len: 0, dup: true },
    { k: 'd', seg: 1, lab: '#2', dir: '>', f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, retx: true },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 401, len: 0 },
    { k: 'c', lab: 'FIN', dir: '>', f: ['FIN', 'ACK'], seq: 401, ack: 301, len: 0, send: { c: 'FIN_WAIT_1' }, arr: { s: 'CLOSE_WAIT' } },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 402, len: 0, arr: { c: 'FIN_WAIT_2' } },
    { k: 'c', lab: 'FIN', dir: '<', f: ['FIN', 'ACK'], seq: 301, ack: 402, len: 0, send: { s: 'LAST_ACK' }, arr: { c: 'TIME_WAIT' } },
    { k: 'c', lab: 'ACK', dir: '>', f: ['ACK'], seq: 402, ack: 302, len: 0, arr: { s: 'CLOSED' } },
  ];
  const UDP = [
    { k: 'd', seg: 0, lab: '#1', dir: '>', len: 100, udp: true },
    { k: 'd', seg: 1, lab: '#2', dir: '>', len: 100, udp: true, lost: true },
    { k: 'd', seg: 2, lab: '#3', dir: '>', len: 100, udp: true },
  ];
  const MSGS = { tcp: TCP, udp: UDP };
  const msgTag = M => M.udp ? `datagram ${M.lab}\nno seq · ${M.len} B` :
    M.k === 'd' ? `${M.retx ? '↻ ' : ''}${M.lab} · ${M.len} B\nseq=${M.seq}` :
    `${M.dup ? 'duplicate ACK' : M.lab}\n${M.f.includes('SYN') && M.ack == null ? 'seq=' + M.seq : M.lab === 'FIN' ? 'seq=' + M.seq : 'ack=' + M.ack}`;
  const topTxt = M => M.k === 'd' ? M.lab : M.lab === 'SYN-ACK' ? 'S+A' : M.lab;

  // ── roteiro ──
  const SUM = `<table class="h3-sum"><tr><th></th><th>TCP</th><th>UDP</th></tr>
    <tr><td>Connection</td><td>handshake, 1 RTT</td><td>none</td></tr>
    <tr><td>Order</td><td>seq; reorders</td><td>not guaranteed</td></tr>
    <tr><td>Confirmation</td><td>cumulative ACK</td><td>none</td></tr>
    <tr><td>Loss</td><td>resends</td><td>vanishes</td></tr>
    <tr><td>Header</td><td>20 B minimum</td><td>8 B</td></tr>
    <tr><td>In this example</td><td>14 msgs, 300 B</td><td>3 msgs, 200 B</td></tr></table>`;
  const STEPS = {
    tcp: [
      { title: 'Lena is about to send the cat photo', dur: 0, ev: [],
        story: 'Lena, in São Paulo, taps send: her phone is about to send the cat photo to her brother in Tokyo, through the app server (the messaging server that delivers the photo to him). The 313 KB become 215 slices, and TCP guarantees that all of them arrive whole and in order. Here we follow only the first 3 slices, 300 bytes. To fit on screen, the figure uses 100-byte slices; real ones are ~1,460 bytes. The seq and ack numbers are examples.',
        look: 'On the left, Lena\'s phone with the cat photo on screen; on the right, the app server. The top track carries the slices; the front one brings the replies. In front of the server, the receive buffer has 3 empty slots, one per slice.',
        key: 'TCP: Lena\'s photo arrives whole thanks to a connection, numbered bytes, confirmation and resend.' },
      { title: 'Handshake: SYN, SYN-ACK, ACK', dur: 7.6, ev: [[0, 0.3], [1, 2.6], [2, 5.3]],
        story: 'Before any slice of the photo, the two agree on the conversation. Lena\'s phone sends SYN and picks its initial number (ISN): 100. The app server answers SYN-ACK with its own ISN, 300, and ack=101: "I expect your byte 101". The phone confirms with ACK.',
        look: 'Three blocks with no data go, come back and go again. The signs change state: SYN_SENT, SYN_RECEIVED and, at the end, ESTABLISHED on both sides.',
        key: 'Three-way handshake: 1 RTT before the first data byte.' },
      { title: 'Segment #1 arrives', dur: 3.4, ev: [[3, 0.3]],
        story: 'Connection open. Lena\'s phone sends slice #1 of the photo: seq=101, 100 bytes (101 to 200). It keeps a copy until the confirmation arrives, so it can resend. #1 arrives and takes the first slot in the app server\'s buffer.',
        look: 'Block #1 runs along the top track and drops into slot 101–200.',
        key: 'Every byte has a number; seq says where the segment starts.' },
      { title: 'ACK 201', dur: 3.0, ev: [[4, 0.3]],
        story: 'The app server answers ack=201: "I received everything up to 200, now I expect 201". When the ACK arrives, Lena\'s phone deletes its copy of #1: that slice of the photo is safe.',
        look: 'An ACK leaves the server and comes back along the front track. On Lena\'s phone screen, #1 turns "confirmed".',
        key: 'The ACK says which byte the receiver expects next.' },
      { title: '#2 gets lost', dur: 3.2, ev: [[5, 0.3]],
        story: 'Lena does not wait: the phone sends slice #2 of the photo (seq=201) and, right behind it, #3. Along the way #2 is lost: bad Wi-Fi or a router with a full queue. Nobody tells anyone. The phone still thinks everything is fine.',
        look: 'Block #2, a slice of the photo, falls off the track and vanishes.',
        key: 'The network drops packets silently. TCP is the one that notices.' },
      { title: '#3 arrives out of order', dur: 3.4, ev: [[6, 0.3]],
        story: 'Slice #3 (seq=301) arrives whole. The app server keeps it in the buffer but does not deliver it: the 201–300 piece is missing in the middle. Assembling the photo out of order would ruin the cat.',
        look: '#3 takes the last slot, dimmed. The middle slot stays dashed, marked "waiting".',
        key: 'TCP holds what arrived out of order and waits for the gap to close.' },
      { title: 'Duplicate ACK', dur: 3.0, ev: [[7, 0.3]],
        story: 'The server answers ack=201 again. The ACK is cumulative: it can only say "I received everything up to here", and "here" is still byte 200. For Lena\'s phone, getting the same ack twice is a sign that something is missing.',
        look: 'Another ACK comes back with the same number, 201. The buffer does not change.',
        key: 'Repeated ACK: something is missing after that byte.' },
      { title: '#2 is resent', dur: 4.0, ev: [[8, 0.9]],
        story: 'Lena\'s phone still has the copy of #2 and resends the same slice: seq=201, 100 bytes. In this example the trigger is the retransmission timer, which expired with no ACK. With 3 duplicate ACKs TCP would resend before the timer (fast retransmit).',
        look: '#2 leaves Lena\'s phone again and fills the middle slot. All 3 slots are full and in order.',
        key: 'Without confirmation, TCP resends from the saved copy.' },
      { title: 'ACK 401 and delivery to the app', dur: 4.2, ev: [[9, 1.6]], del: 0.3,
        story: 'With the gap closed, bytes 101 to 400 are in order and the server app reads the 3 slices, 300 bytes. A single ACK, ack=401, confirms everything, #3 included. (#1 could have been read earlier, since it was in order; what TCP never does is deliver #3 before #2.)',
        look: 'The three blocks go into the server and its screen shows 300 of 300 bytes. An ACK with 401 goes back to Lena\'s phone.',
        key: 'Cumulative ACK: one number confirms everything that came before.' },
      { title: 'Lena\'s phone closes its side', dur: 5.4, ev: [[10, 0.3], [11, 2.7]],
        story: 'In this example, Lena has no more slices to send. The phone sends FIN (seq=401) and moves to FIN_WAIT_1. The app server confirms with ack=402 and stays in CLOSE_WAIT: it can still send data, if it has any.',
        look: 'A FIN goes, an ACK comes back. The signs show FIN_WAIT_2 on the phone and CLOSE_WAIT on the server.',
        key: 'Each direction of the connection closes separately.' },
      { title: 'The app server closes its side', dur: 5.4, ev: [[12, 0.3], [13, 2.9]],
        story: 'When it is done, the app server sends its own FIN (seq=301) and moves to LAST_ACK. Lena\'s phone confirms with ack=302 and the server closes. The phone stays in TIME_WAIT for a while, in case that last ACK is lost and the FIN comes back.',
        look: 'Now the FIN comes from the server and the ACK goes back. Server: CLOSED. Phone: TIME_WAIT.',
        key: 'Four-way close: FIN, ACK, FIN, ACK.' },
      { title: 'Summary: 14 segments for 3 slices', dur: 1.2, ev: [], tw: 0.8,
        story: 'To deliver the first 3 slices of the photo (300 bytes), TCP exchanged 14 segments: 3 to open, 7 of data and ACKs (counting the resend) and 4 to close. Everything arrived whole and in order, despite the loss: with all 215 slices it would be the same, and her brother would see the cat with no gaps. After TIME_WAIT (2 × MSL: seconds to a few minutes, depending on the system), the phone closes too.',
        look: 'Both signs at CLOSED and the server app holding the 3 slices, 300 bytes. Switch to UDP in the panel to compare.',
        key: 'TCP trades speed for guarantees: order, confirmation and resend.', sum: true },
    ],
    udp: [
      { title: 'What if it were a video call?', dur: 0, ev: [],
        story: 'What if, instead of a photo, Lena were on a video call with her brother? It is the call scenario from the OSI figure: video is born every instant and goes in pieces, here the same 3 pieces of 100 bytes, and the transport is UDP. There is no connection: no handshake, no state, no sequence number.',
        look: 'Lena\'s phone screen keeps sending. The signs show no state: with no connection, there is no state to show. The front track will stay empty.',
        key: 'UDP: send and forget.' },
      { title: 'Datagram #1, straight away', dur: 3.4, ev: [[0, 0.3]],
        story: 'Without agreeing on anything, Lena\'s phone already sends the first piece of the video. It arrives and goes straight to the server app. Nobody answers: UDP has no ACK.',
        look: '#1 leaves at once, with no SYN before it, and drops into the first slot. Nothing comes back on the front track.',
        key: 'No handshake: the first data goes out right away.' },
      { title: '#2 gets lost', dur: 3.2, ev: [[1, 0.3]],
        story: '#2 is lost on the way, like slice #2 of the photo. The difference: Lena\'s phone kept no copy and will never know. There is no ACK to fail to arrive.',
        look: '#2 falls off the track and vanishes. Nobody reacts.',
        key: 'In UDP, loss is silent and final.' },
      { title: '#3 arrives and is delivered', dur: 3.4, ev: [[2, 0.3]],
        story: '#3 arrives and goes straight to the app, waiting for nothing. The app server does not know a #2 ever existed: the datagram has no seq to reveal the gap.',
        look: '#3 takes the last slot, lit. The middle one stays empty and without "waiting": nobody is waiting.',
        key: 'Each datagram is independent: it arrived, it is delivered.' },
      { title: 'End: 200 of 300 bytes (the video stutters for a moment)', dur: 0, ev: [],
        story: 'The server ended up with #1 and #3: 200 bytes. Lena\'s phone thinks it sent everything. That was 3 messages, against 14 for TCP. On the call, her brother sees a small stutter and the call goes on: for voice, live video and games, losing a piece is better than waiting for it. For the cat photo, that would be a hole in the image. If the app needs guarantees, it implements them itself (QUIC does this on top of UDP).',
        look: 'The middle slot empty forever and no ACK on the front track.',
        key: 'UDP is fast and light; the guarantee is left to the application.', sum: true },
    ],
  };
  const DT = 2.0, DA = 2.4, HOP = 0.6, SINK = 0.9;           // segundos de tela
  function build(mode) {
    const S = STEPS[mode], off = [], ev = []; let o = 0, del = Infinity, tw = Infinity, ci = 0;
    S.forEach((s, k) => { off.push(o);
      s.ev.forEach(([m, t]) => { const M = MSGS[mode][m], D = M.dir === '>' ? DT : DA, e = { m, M, ts: o + t, D, ta: o + t + D, step: k };
        if (M.lost) e.tf = e.ts + D * 0.5; if (M.k === 'c') e.pool = ci++ % 2; ev.push(e); });
      if (s.del != null) del = o + s.del; if (s.tw != null) tw = o + s.tw; o += s.dur; });
    return { off, ev, del, tw };
  }
  const TL = { tcp: build('tcp'), udp: build('udp') };
  const MAP = { tcp: [0, 1, 1, 1, 2, 3, 3, 3, 4, 4, 4, 4], udp: [0, 2, 4, 5, 11] };      // passo equivalente no outro cenário
  const GO = { tcp: { hs: 1, loss: 4, buf: 5, srv: 8 }, udp: { hs: 1, loss: 2, buf: 3, srv: 4 } };

  let step = 0, mode = 'tcp', lt = 0, hold = 0, playing = false, dwell = 0, followT = 1.6, last = 0;
  try { const v = localStorage.getItem('sdlabs-tcp3d-mode'); if (v === 'tcp' || v === 'udp') mode = v; } catch (e) {}
  const N = () => STEPS[mode].length;

  // ── estado num instante T (tudo é função pura de T, então voltar um passo funciona) ──
  function stateAt(T) {
    const tl = TL[mode], udp = mode === 'udp';
    let c = udp ? null : 'CLOSED', s = udp ? null : 'LISTEN', ct = -1, st = -1;
    if (!udp) {
      const ch = [];
      tl.ev.forEach(e => { if (e.M.send) for (const [k, v] of Object.entries(e.M.send)) ch.push([e.ts, k, v]);
        if (e.M.arr) for (const [k, v] of Object.entries(e.M.arr)) ch.push([e.ta, k, v]); });
      ch.push([tl.tw, 'c', 'CLOSED']); ch.sort((a, b) => a[0] - b[0]);
      ch.forEach(([t, k, v]) => { if (t <= T) { if (k === 'c') { c = v; ct = t; } else { s = v; st = t; } } });
    }
    const present = [0, 1, 2].map(k => tl.ev.some(e => e.M.k === 'd' && e.M.seg === k && !e.M.lost && T >= e.ta + HOP));
    const delivered = !udp && T >= tl.del;
    const slot = present.map((p, k) => {
      if (udp) return p ? 'ok' : '';
      if (delivered) return 'done';
      if (p) return present.slice(0, k).every(Boolean) ? 'ok' : 'held';
      return present.slice(k + 1).some(Boolean) ? 'hole' : '';
    });
    const sendBuf = [0, 1, 2].map(k => {
      const sent = tl.ev.filter(e => e.M.k === 'd' && e.M.seg === k && e.ts <= T);
      if (!sent.length) return 'fila';
      if (udp) return 'enviado';
      const end = 201 + 100 * k;
      if (tl.ev.some(e => e.M.dir === '<' && e.M.ack != null && e.M.ack >= end && e.M.lab !== 'SYN-ACK' && T >= e.ta)) return 'ok';
      return sent[sent.length - 1].M.retx ? 'retx' : 'sent';
    });
    const appBytes = udp ? present.filter(Boolean).length * 100 : (T >= tl.del + SINK * 0.6 ? 300 : 0);
    return { c, s, ct, st, slot, sendBuf, appBytes, present };
  }

  // ── telas do celular e do servidor ──
  let phKey = '', srvKey = '';
  function drawPhone(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === phKey) return; phKey = key;
    const { x, P } = phScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, W_ = 58;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, phScr.c.width, phScr.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = C.line; x.beginPath(); x.roundRect(u(21), u(4), u(16), u(3), u(1.5)); x.fill();
    x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('cat photo', u(W_ / 2), u(11));
    x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.fillText('· sending', u(W_ / 2), u(18.5));
    x.fillStyle = A_; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(d.udp ? 'UDP' : 'TCP', u(W_ / 2), u(26));
    const TX = { fila: 'queued', sent: 'sent', retx: 'resent', ok: 'confirmed', enviado: 'sent' };
    const SUB = { fila: '', sent: 'copy kept', retx: 'copy kept', ok: 'copy deleted', enviado: 'no copy' };
    d.buf.forEach((b, k) => { const y = 33 + k * 28, on = b === 'ok';
      x.strokeStyle = on ? A_ : C.line; x.lineWidth = u(on ? 0.8 : 0.5); x.beginPath(); x.roundRect(u(4), u(y), u(50), u(24), u(2)); x.stroke();
      x.textAlign = 'left'; x.fillStyle = on ? A_ : C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText(`#${k + 1}`, u(7), u(y + 7));
      x.fillStyle = b === 'fila' ? C.ink : (on ? A_ : C.inkHi); x.font = `${u(5.6)}px ${MONO3}`; x.fillText(TX[b] + (on ? ' ✓' : ''), u(18), u(y + 7));
      x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(SUB[b], u(7), u(y + 17)); });
    x.textAlign = 'center'; x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText('port 51234', u(W_ / 2), u(120));
    phScr.tex.needsUpdate = true;
  }
  function drawServer(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === srvKey) return; srvKey = key;
    const { x, P } = srvCv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, srvCv.c.width, srvCv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('app server :443', u(6), u(9));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(d.udp ? 'app received' : 'app read', u(6), u(24));
    const full = d.bytes === 300;
    x.fillStyle = full ? A_ : C.inkHi; x.font = `600 ${u(13)}px ${MONO3}`; x.fillText(`${d.bytes}/300 B`, u(6), u(40));
    x.strokeStyle = C.detail; x.lineWidth = u(0.6); x.beginPath(); x.roundRect(u(6), u(52), u(116), u(6), u(2)); x.stroke();
    if (d.bytes) { x.fillStyle = A_; x.beginPath(); x.roundRect(u(6), u(52), u(116 * d.bytes / 300), u(6), u(2)); x.fill(); }
    x.fillStyle = C.ink; x.font = `${u(5.5)}px ${MONO3}`; x.fillText(d.note, u(6), u(66));
    srvCv.tex.needsUpdate = true;
  }

  // ── painel ──
  const pick = st => st;
  function fieldsHtml(M, P) {
    const ports = M.dir === '>' ? '51234 → 443' : '443 → 51234', pPorts = P ? (P.dir === '>' ? '51234 → 443' : '443 → 51234') : null;
    const cls = ch => ch ? ' class="new"' : '';
    if (M.udp) return `<div class="t3-f"><span${cls(!P)}><small>ports</small>${ports}</span><span><small>size</small>${8 + M.len} B</span><span><small>checksum</small>0x3f1a</span>
      <span class="off"><small>seq</small>does not exist</span><span class="off"><small>ack</small>does not exist</span><span><small>data</small>${M.len} B</span></div>`;
    const fl = ['SYN', 'ACK', 'PSH', 'FIN'].map(f => `<i class="${M.f.includes(f) ? 'on' : ''}">${f}</i>`).join('');
    const flCh = !P || P.f.join() !== M.f.join();
    return `<div class="t3-f"><span${cls(ports !== pPorts)}><small>ports</small>${ports}</span>
      <span${cls(!P || M.seq !== P.seq)}><small>seq</small>${M.seq}</span>
      <span${M.ack == null ? ' class="off"' : cls(!P || M.ack !== P.ack)}><small>ack</small>${M.ack == null ? '—' : M.ack}</span>
      <span${cls(!P || M.len !== P.len)}><small>len</small>${M.len ? M.len + ' B' : '0'}</span>
      <span class="t3-fl${flCh ? ' new' : ''}"><small>flags</small>${fl}</span></div>`;
  }
  function dataHtml() {
    const S = STEPS[mode][step], ms = MSGS[mode], tl = TL[mode];
    const end = stateAt(tl.off[step] + S.dur), prevEnd = step ? stateAt(tl.off[step] - 1e-6) : stateAt(-1);
    let h = '';
    if (!S.ev.length) h += `<p class="t3-note">${mode === 'tcp' ? (step === 0 ? 'No segments yet. The app server listens on port 443; Lena\'s phone will use a temporary port, 51234.' : 'No segments in this step.') : (step === 0 ? 'No datagrams yet. Ports: 51234 → 443.' : 'No datagrams in this step. And no ACK, ever.')}</p>`;
    S.ev.forEach(([m]) => { const M = ms[m], P = ms.slice(0, m).reverse().find(q => q.dir === M.dir);
      const name = M.udp ? `datagram ${M.lab}` : M.k === 'd' ? `${M.retx ? 'resend ' : ''}segment ${M.lab}` : (M.dup ? 'duplicate ACK' : M.lab);
      h += `<div class="t3-msg"><div class="t3-mh"><b>${M.dir === '>' ? '→' : '←'} ${name}</b><span${M.lost ? ' class="lost"' : ''}>${M.lost ? 'lost on the way' : M.dir === '>' ? 'Lena\'s phone → server' : 'server → Lena\'s phone'}</span></div>${fieldsHtml(M, P)}</div>`; });
    if (mode === 'tcp') h += `<p class="t3-st">Lena\'s phone state: <b${end.c !== prevEnd.c ? ' class="new"' : ''}>${end.c}</b><br>app server state: <b${end.s !== prevEnd.s ? ' class="new"' : ''}>${end.s}</b></p>`;
    h += `<p class="t3-note">Highlighted: what changed compared with the previous message in the same direction. ${mode === 'tcp' ? 'ISNs 100 and 300 are examples: in real life they are random 32-bit numbers.' : 'The UDP header is only 8 bytes: ports, size and checksum.'}</p>`;
    return h;
  }
  function panelHtml() {
    const st = STEPS[mode][step];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${mode.toUpperCase()}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${['tcp', 'udp'].map(v => `<button data-mode="${v}" aria-pressed="${v === mode}">${v.toUpperCase()}</button>`).join('')}</div>
      <h2>${st.title}</h2>
      <p class="o3-story">${pick(st.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${st.look}</p>
      <p class="o3-key"><b>In one sentence</b>${st.key}</p>
      ${st.sum ? SUM : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>${mode === 'tcp' ? 'Segment fields' : 'Datagram fields'}</summary>${dataHtml()}</details>`;
  }
  let cur = null;
  function readout() { if (active !== 'tcp') return;
    const s = cur || stateAt(TL[mode].off[step]);
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${mode}` + (mode === 'tcp' ? ` · Lena\'s phone ${s.c} · app server ${s.s}` : ' · no connection'); }
  function render() {
    const info = document.getElementById('info'); if (active === 'tcp' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    rngT.forEach(m => m.visible = mode === 'tcp'); rngU.forEach(m => m.visible = mode === 'udp');
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; hold = 0; dwell = 0; followT = 1.8; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setMode = v => { if (v === mode) return true; const to = MAP[mode][step]; mode = v; phKey = srvKey = '';
    try { localStorage.setItem('sdlabs-tcp3d-mode', v); } catch (e) {} go(to); return true; };
  const cycleMode = () => setMode(mode === 'tcp' ? 'udp' : 'tcp');
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b && active === 'tcp') setMode(b.dataset.mode); });

  // ── um quadro da cena no instante T ──
  const PATH_D = [[RX0 + 18, DY, RZ], [RX1 - 14, DY, RZ]];
  const PATH_A = [[CHX, SRV_FRONT + 10, RZ], [CHX, AY, RZ], [RX0 + 18, AY, RZ]];
  const cumD = cumLen(PATH_D), cumA = cumLen(PATH_A);
  const onPath = (dir, f) => dir === '>' ? alongPts(PATH_D, cumD, Math.max(0, Math.min(1, f))) : alongPts(PATH_A, cumA, Math.max(0, Math.min(1, f)));
  const sm = f => f * f * (3 - 2 * f);
  const place = (b, p, k, s = 1) => { b.g.visible = true; b.g.position.copy(W(...p)); b.g.scale.setScalar(Math.max(0.001, s)); b.mat.emissiveIntensity = k; moveGlow(b.glow, [p[0], p[1], p[2] + 6], k > 0.5 ? 0.8 * s : 0); };
  const off = b => { b.g.visible = false; b.glow.material.uniforms.intensity.value = 0; };

  function scene3(T) {
    const tl = TL[mode], udp = mode === 'udp', S = stateAt(T); cur = S;
    const stepStart = tl.off[step];
    let flying = [];
    // blocos de dados
    DB.forEach((b, k) => {
      const evs = tl.ev.filter(e => e.M.k === 'd' && e.M.seg === k && e.ts <= T), e = evs[evs.length - 1];
      if (!e) return off(b);
      drawTop(b, e.M.lab);
      if (e.M.lost) {
        if (T < e.tf) { place(b, onPath('>', (T - e.ts) / e.D), 1); flying.push([e, b]); return; }
        const f = (T - e.tf) / 1.1; if (f >= 1) return off(b);
        const g = Math.min(1, f / 0.55), p = [RX0 + 18 + (RX1 - RX0 - 32) * 0.5 + 10 * g, DY - 44 * g, RZ + 8 * Math.sin(g * Math.PI) - (RZ - 8) * g];
        return place(b, p, 1 - f, f < 0.55 ? 1 : 1 - (f - 0.55) / 0.45);
      }
      if (T < e.ta) { place(b, onPath('>', (T - e.ts) / e.D), e.M.retx ? 1.4 : 1); flying.push([e, b]); return; }
      const sl = [SX[k], SY, TRAY_Z];
      if (T < e.ta + HOP) { const f = sm((T - e.ta) / HOP), a = PATH_D[1], p = a.map((v, i) => v + (sl[i] - v) * f); p[2] += Math.sin(f * Math.PI) * 26; return place(b, p, 1); }
      if (!udp && T >= tl.del) { const f = (T - tl.del) / SINK; if (f >= 1) return off(b);
        const p = [SX[k], SY - 34 * sm(f), TRAY_Z + 30 * Math.sin(Math.min(1, f * 1.4) * Math.PI / 2)]; return place(b, p, 1, f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4); }
      const stt = S.slot[k]; place(b, sl, stt === 'held' ? 0.06 : 0.35);
    });
    // blocos de controle (SYN, ACK, FIN)
    CB.forEach((b, p) => { const evs = tl.ev.filter(e => e.M.k === 'c' && e.pool === p && e.ts <= T), e = evs[evs.length - 1];
      if (!e || T >= e.ta) return off(b);
      drawTop(b, topTxt(e.M)); const f = (T - e.ts) / e.D, pop = Math.min(1, f * 8, (1 - f) * 8);
      place(b, onPath(e.M.dir, f), 1, pop); flying.push([e, b]); });
    // rótulo de cada bloco em viagem
    tMsg.forEach((t, i) => { const fl = flying[i]; if (!fl) return t.hide(); const [e, b] = fl, p = b.g.position;
      t.set(msgTag(e.M), e.M.retx || e.M.dup ? 'acc' : 'hi').at(p.x / TS, p.z / TS, p.y / TS + 40); });
    // trilhos acesos enquanto alguém passa
    const onD = flying.some(([e]) => e.M.dir === '>'), onA = flying.some(([e]) => e.M.dir === '<');
    railMatD.emissiveIntensity = onD ? 0.2 : 0; railMatA.emissiveIntensity = onA ? 0.2 : 0; rimD.visible = onD; rimA.visible = onA;
    // perda
    const lost = tl.ev.find(e => e.M.lost), retx = tl.ev.find(e => e.M.retx);
    if (lost && T >= lost.tf && (!retx || T < retx.ta)) tLost.set(udp ? '✕ #2 dropped and vanished\nnobody will know' : '✕ slice #2 of the photo dropped', 'acc').at(RX0 + (RX1 - RX0) * 0.5 + 10, DY - 50, 26); else tLost.hide();
    // vaga vazada / vazia
    const hole = S.slot[1] === 'hole'; holeG.visible = hole;
    if (hole) tWait.set('waiting\nbytes 201–300', 'acc').at(SX[1] - 6, SY + 62, 22);
    else if (udp && S.present[2] && !S.present[1]) tWait.set('#2 never came\nthe server does not know', 'dim').at(SX[1] - 6, SY + 62, 22);
    else tWait.hide();
    // timer do reenvio
    if (retx && step === retx.step && T < retx.ts + 0.3) tTimer.set('#2 timer expired\nno ACK: resend the copy', 'acc').at(RX0 + 30, DY, 105); else tTimer.hide();
    // UDP: nada volta
    if (udp && step >= 1) tNoAck.set(step === N() - 1 ? 'no ACK, ever' : 'no ACK comes back', step === N() - 1 ? 'acc' : 'dim').at(430, AY, 44); else tNoAck.hide();
    // placas de estado
    const changed = t => t >= stepStart && t >= 0;
    const SRV_NAME = NARROW() ? 'APP SERVER' : 'APP SERVER';
    if (udp) { tCli.set('LENA\'S PHONE\nUDP: no state', 'dim'); tSrv.set(`${SRV_NAME}\nUDP: no state`, 'dim'); }
    else { tCli.set(`LENA\'S PHONE\n${S.c}`, changed(S.ct) && step ? 'acc' : 'hi'); tSrv.set(`${SRV_NAME}\n${S.s}`, changed(S.st) && step ? 'acc' : 'hi'); }
    tCli.at(93, 170, 196); tSrv.at(NARROW() ? 585 : 630, 70, 168);
    // conexão (handshake e fechamento)
    const hs = TL.tcp.ev.slice(0, 3);
    if (udp) { if (step === 0) tConn.set('UDP: no connection\nno handshake', 'dim').at(350, 180, 70); else tConn.hide(); }
    else if (step === 0) tConn.set('no connection yet', 'dim').at(350, 180, 70);
    else if (step === 1) { const k = hs.filter(e => T >= e.ts).length, done = T >= hs[1].ta;
      tConn.set(done ? '1 RTT: SYN + SYN-ACK\nthe ACK can already carry data' : `handshake ${k}/3`, done ? 'acc' : 'hi').at(350, 180, 70); }
    else if (step >= 9) tConn.set(step === 9 ? 'Lena → server: closed\nserver → Lena: open' : step === 10 ? 'both directions closed' : 'connection closed', 'hi').at(350, 180, 70);
    else tConn.hide();
    // telas e luzes
    drawPhone({ udp, buf: S.sendBuf });
    const note = udp ? (S.present[2] && !S.present[1] ? '#1 and #3 arrived' : S.present[0] ? '#1 arrived' : 'waiting for data') :
      S.appBytes === 300 ? 'bytes 101–400, in order ✓' : S.slot[1] === 'hole' ? 'buffer: 201–300 missing' : S.present.every(Boolean) ? 'buffer: 101–400 complete' : S.present[0] ? 'buffer: 101–200 in order' : S.s === 'LISTEN' ? 'listening' : 'buffer empty';
    drawServer({ udp, bytes: S.appBytes, note });
    const arrivedAt = side => tl.ev.some(e => (side === 's' ? e.M.dir === '>' : e.M.dir === '<') && !e.M.lost && T >= e.ta && T < e.ta + 0.5);
    const sOn = arrivedAt('s'), cOn = arrivedAt('c');
    srvLed.material = sOn ? ledOnMat : ledOffMat; srvGlow.material.uniforms.intensity.value = sOn ? 0.8 : 0;
    phLed.material = cOn ? ledOnMat : ledOffMat; phGlow.material.uniforms.intensity.value = cOn ? 0.8 : 0;
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = [380, 140, 40];
  const FOCUS_M = { tcp: [[390, 150, 50], [390, 150, 50], [440, 150, 40], [400, 170, 30], [350, 130, 30], [560, 150, 50], [400, 170, 30], [420, 150, 40], [560, 140, 60], [390, 150, 50], [390, 150, 50], [390, 150, 50]],
    udp: [[390, 150, 50], [440, 150, 40], [350, 130, 30], [560, 150, 50], [420, 150, 50]] };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const S = STEPS[mode][step];
    let u = lt; if (u >= S.dur) { u = S.dur; hold += dt; if (hold > 3.5 && S.dur > 0) { lt = 0; hold = 0; } } else lt += dt;
    scene3(TL[mode].off[step] + u);
    readout();
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = mob ? FOCUS_M[mode][step] : FOCUS;
      const zoff = mob ? -7.7 * camera.position.distanceTo(controls.target) : 0;
      const want = W(f[0] + (mob ? -10 : -240), f[1] + (mob ? 0 : 20), f[2] + zoff), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(6.5, S.dur + 4)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleMode();
    if (e.key === 't' || e.key === 'T') return setMode('tcp');
    if (e.key === 'u' || e.key === 'U') return setMode('udp');
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) go(GO[mode][o.userData.go]); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); blocks.forEach(b => { b.key = ''; if (b.txt) drawTop(b, b.txt); }); phKey = srvKey = ''; });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch TCP/UDP', 'C', cycleMode]],
    view: NARROW() ? { target: W(360, 150, -140), dist: innerWidth < 640 ? 9 : 14 } : { target: W(140, 160, 40), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · TCP/UDP: C · drag to rotate' };
})() });
