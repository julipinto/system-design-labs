// Figura 3D (iso-glow): TLS. O celular da Lena abre https://loja.exemplo e, antes de mandar qualquer dado,
// combina uma chave secreta com o servidor por uma linha que qualquer um pode ouvir.
// Celular à esquerda, servidor à direita, a linha (TCP) entre eles e, atrás, o curioso (Wi-Fi público) que vê tudo o que passa.
// Mensagens viajam como envelopes; as cifradas viram ruído com cadeado. A troca de chaves (ECDHE) usa a analogia das tintas.
// Cenários: TLS 1.2, TLS 1.3 e retomada com 0-RTT. Contador de RTTs sempre à vista (RTT de exemplo de 80 ms, como na aula).
FIGS3D.push({ id: 'tls', name: 'TLS', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados de exemplo ──
  const HOST = 'loja.exemplo', SIP = '203.0.113.10', CIP = '192.168.0.12', RTT = 80;
  const SC = ['t12', 't13', 'r0'], SCNAME = { t12: 'TLS 1.2', t13: 'TLS 1.3', r0: 'Resumption (0-RTT)' };
  const LIST = { t12: ['tcp', 'ch', 'sh', 'kx', 'fin', 'req', 'sum'], t13: ['tcp', 'ch', 'sh', 'kx', 'fin', 'req', 'sum'], r0: ['tcp', 'ch0', 'sh0', 'replay', 'sum'] };
  const ORD = { tcp: 0, ch: 1, ch0: 1, sh: 2, sh0: 2, kx: 3, fin: 4, replay: 4, req: 5, sum: 6 };
  const BEFORE = { t12: 3, t13: 2, r0: 1 };                 // RTTs antes de o pedido sair (com o TCP)
  const NOISE = '17 03 03 9f 2a c4 e1 07 5b d8 33 …';

  // ── geometria (unidades iso) ──
  plateWith(g0, 720, 250, [[18, 18], [702, 18], [18, 232], [702, 232]]);
  const mkGroup = id => { const g = new THREE.Group(); g.userData.go = id; g0.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };

  // celular da Lena (em pé, tela para a frente)
  const phG = mkGroup('tcp');
  rbox(30, 150, 7, 100, 50, 8, 6, bodyMat, phG);
  rbox(40, 168, 15, 80, 14, 166, 11, bodyMat, phG);
  const phCap = glowCap(46, 166, 181, 68, 10, 3, 3, phG);
  const phScr = faceCanvas('front', 45, 182, 176, 70, 152, 5, phG);
  // servidor
  const svG = mkGroup('sh');
  rbox(570, 86, 7, 120, 100, 140, 7, bodyMat, svG);
  const svCap = glowCap(580, 96, 147, 100, 80, 4, 5, svG);
  const svScr = faceCanvas('front', 578, 186, 140, 104, 56, 6, svG);
  slitsUV(frontUV(570, 186, 147), 10, 110, 4, 70, 128, svG);
  // a linha (conexão TCP): faixa com a face de cima pintada (em claro ou ruído com cadeado)
  const TX0 = 134, TX1 = 566, TY = 150;
  const lnG = mkGroup('fin');
  const lnMat = capMat(); twCaps.push(lnMat);
  rbox(TX0, TY - 15, 7, TX1 - TX0, 30, 6, 4, lnMat, lnG);
  const lnScr = faceCanvas('top', TX0 + 4, TY - 12, 13, TX1 - TX0 - 8, 24, 4, lnG);
  // o curioso: roteador de Wi-Fi público com antenas, atrás da linha
  const cuG = mkGroup('kx');
  rbox(290, 34, 7, 120, 56, 52, 6, bodyMat, cuG);
  rbox(304, 46, 59, 8, 8, 70, 3, bodyMat, cuG); rbox(388, 46, 59, 8, 8, 70, 3, bodyMat, cuG);
  const cuScr = faceCanvas('front', 296, 90, 54, 108, 42, 6, cuG);
  const cuCap = glowCap(300, 40, 59, 100, 44, 3, 4, cuG);
  polyLine([[350, 92, 30], [350, TY - 15, 14]], lineMat, cuG);
  // certificado (documento em pé, aparece quando chega ao celular)
  const ctG = mkGroup('sh');
  rbox(150, 206, 7, 96, 6, 112, 3, bodyMat, ctG);
  const ctScr = faceCanvas('front', 153, 212, 116, 90, 106, 6, ctG);
  // tintas da troca de chaves (analogia do ECDHE)
  const PAINT = { pub: 0xe8c547, a: 0xd9534f, b: 0x4a7fd6, A: 0xe0893f, B: 0x7fae5b, key: 0x8a5a3c, bad: 0xb7a46a };
  const pot = (x, y, col) => { const g = new THREE.Group(); g0.add(g); g.position.copy(W(x, y, 7)); const m = new THREE.MeshBasicMaterial({ color: col, toneMapped: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    rbox(-10, -10, 0, 20, 20, 18, 4, m, g); g.visible = false; return { g, m }; };
  const POTS = { ph: [pot(165, 222, PAINT.pub), pot(195, 222, PAINT.a), pot(225, 222, PAINT.key)],
    sv: [pot(475, 222, PAINT.pub), pot(505, 222, PAINT.b), pot(535, 222, PAINT.key)],
    cu: [pot(320, 112, PAINT.pub), pot(350, 112, PAINT.A), pot(380, 112, PAINT.B), pot(410, 112, PAINT.bad)] };
  hazeAndShadow(g0, 360, 125, 8.6, 3.4);
  creases(first);

  // envelopes: em claro, cifrado (ruído com cadeado) e o pote de tinta que viaja na troca de chaves
  const mkEnv = enc => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-16, -11, 0, 32, 22, 5, 2, mat, g); const cv = faceCanvas('top', -15, -10, 5, 30, 20, 8, g); g.visible = false;
    const glow = glowPoints([W(0, 0, 0)], 0.26); g0.add(glow); return { g, mat, cv, glow, enc }; };
  const ENV = { clear: mkEnv(false), enc: mkEnv(true) };
  const paintM = new THREE.MeshBasicMaterial({ color: PAINT.A, toneMapped: false });
  const PDOT = (() => { const g = new THREE.Group(); g0.add(g); rbox(-9, -9, 0, 18, 18, 14, 4, paintM, g); g.visible = false; return { g }; })();

  // ── rótulos que olham para a câmera (sempre legíveis); "🔒 " no começo desenha um cadeado ──
  const tags = [];
  function lockIcon(x, cx, cy, s, col) {
    x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = s * 0.16;
    x.beginPath(); x.arc(cx, cy - s * 0.12, s * 0.24, Math.PI, 0); x.stroke();
    x.beginPath(); x.roundRect(cx - s * 0.36, cy - s * 0.12, s * 0.72, s * 0.52, s * 0.08); x.fill(); x.restore();
  }
  function tag(h = 13) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const lock = lines[0].startsWith('🔒 '); if (lock) lines[0] = lines[0].slice(3);
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `${fs * 0.8}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.8 * 1.3, li = lock ? fs * 1.1 : 0;
      x.font = f1; let w = x.measureText(lines[0]).width + li; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1;
      const y0 = pad * 0.7 + lh / 2, w0 = x.measureText(lines[0]).width;
      if (lock) lockIcon(x, nw / 2 - (w0 + li) / 2 + fs * 0.4, y0, fs, col);
      x.fillText(lines[0], nw / 2 + li / 2, y0);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.6 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tPh = tag(14), tSv = tag(14), tCu = tag(13), tRtt = tag(15), tMsg = tag(12), tSees = tag(12), tCert = tag(12);
  const tKph = tag(12), tKsv = tag(12), tKcu = tag(12);

  // ── roteiro ──
  let sc = 't13', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-tls3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  const ids = () => LIST[sc], N = () => ids().length, cur = () => ids()[step];
  const pick = o => o[sc] ?? (sc !== 't12' ? o.t13x : undefined) ?? o.all;
  // falas: dir 1 = celular → servidor, -1 = servidor → celular; enc = cifrado; rtt = RTTs completos quando a fala chega
  const E = (dir, label, sees, o = {}) => ({ dir, label, sees, ...o });
  const LEGS = {
    tcp: () => [E(1, 'SYN\nTCP: "shall we talk?"', `SYN · ${CIP} → ${SIP}:443`), E(-1, 'SYN-ACK', 'SYN-ACK', { rtt: 1 }), E(1, 'ACK', 'ACK · TCP connection open')],
    ch: () => sc === 't12'
      ? [E(1, 'ClientHello\nTLS 1.2 · ciphers · random · SNI loja.exemplo', `ClientHello · SNI: ${HOST}`)]
      : [E(1, 'ClientHello\nTLS 1.3 · ciphers · key share · SNI loja.exemplo', `ClientHello · SNI: ${HOST} · key share`)],
    sh: () => sc === 't12'
      ? [E(-1, 'ServerHello + Certificate\n+ ServerKeyExchange + ServerHelloDone', `Certificate of ${HOST} (in the clear)`, { rtt: 2, cert: true })]
      : [E(-1, 'ServerHello + key share\nchosen cipher', 'ServerHello · key share'),
         E(-1, '🔒 Certificate + Verify + Finished\nalready encrypted with the new key', `${NOISE} (encrypted certificate)`, { enc: true, rtt: 2, cert: true })],
    kx: () => sc === 't12'
      ? [{ mix: 'show' }, E(-1, 'server public part\n(it was in ServerKeyExchange)', 'green paint (public)', { paint: PAINT.B, replay: true }),
         E(1, 'ClientKeyExchange\nphone public part', 'orange paint (public)', { paint: PAINT.A }), { mix: 'mix' }]
      : [{ mix: 'show' }, E(1, 'phone key share\n(replay: it was in ClientHello)', 'orange paint (public)', { paint: PAINT.A, replay: true }),
         E(-1, 'server key share\n(replay: it was in ServerHello)', 'green paint (public)', { paint: PAINT.B, replay: true }), { mix: 'mix' }],
    fin: () => sc === 't12'
      ? [E(1, '🔒 ChangeCipherSpec + Finished', NOISE, { enc: true }), E(-1, '🔒 ChangeCipherSpec + Finished', NOISE, { enc: true, rtt: 3 })]
      : [E(1, '🔒 Finished\n"I checked everything, this is the key"', NOISE, { enc: true })],
    req: () => [E(1, '🔒 GET /carrinho\ncookie, password, all encrypted', `${NOISE} (≈ 400 bytes)`, { enc: true, req: true }), E(-1, '🔒 200 OK\nfirst byte of the page', `${NOISE} (≈ 14 KB)`, { enc: true, rtt: BEFORE[sc] + 1 })],
    ch0: () => [E(1, 'ClientHello + PSK\n"it\'s me again" (ticket from the last visit)', `ClientHello · SNI: ${HOST} · PSK`),
      E(1, '🔒 early data: GET /carrinho\nalready encrypted, sent with the hello', `${NOISE} (early data)`, { enc: true, req: true })],
    sh0: () => [E(-1, 'ServerHello + 🔒 Finished\nkey confirmed', 'ServerHello + noise', { enc: false }), E(-1, '🔒 200 OK\nfirst byte of the page', `${NOISE} (≈ 14 KB)`, { enc: true, rtt: 2 })],
    replay: () => [E(1, '🔒 copy of the early data\nresent by the snoop', 'I copy and resend the packet!', { enc: true, from: 'cu' })],
    sum: () => [],
  };
  const LEG = 1.5, PAUSE = 0.45, PRE = 0.35;
  function timeline(id = cur()) { let t = PRE; const out = LEGS[id]().map(l => { const d = l.mix ? (l.mix === 'mix' ? 1.6 : 0.9) : l.dir === 1 && l.label === 'ACK' ? 0.9 : LEG, o = { ...l, t0: t, t1: t + d }; t += d + PAUSE; return o; });
    return { legs: out, end: Math.max(t, 1.4) }; }
  let TL = timeline();
  const legsDone = () => TL.legs.filter(l => lt >= l.t1);
  const rttNow = () => { let r = 0; ids().slice(0, step).forEach(id => LEGS[id]().forEach(l => { if (l.rtt) r = Math.max(r, l.rtt); })); legsDone().forEach(l => { if (l.rtt) r = Math.max(r, l.rtt); }); return r; };
  const reqSent = () => ids().slice(0, step).some(id => LEGS[id]().some(l => l.req)) || legsDone().some(l => l.req) || TL.legs.some(l => l.req && lt >= l.t0);
  const encLine = () => sc === 'r0' ? ORD[cur()] >= 2 : ORD[cur()] >= 4;
  const keyKnown = () => sc === 'r0' || ORD[cur()] > 3 || (cur() === 'kx' && TL.legs.some(l => l.mix === 'mix' && lt >= l.t1));

  const STEPS = {
    tcp: { title: { all: 'The TCP line is already open' },
      story: { all: `Lena opens https://${HOST} on a public Wi-Fi. Before TLS, TCP opens the connection: SYN, SYN-ACK, ACK. That already cost 1 RTT (80 ms in the example). Everything that goes through this line, the Wi-Fi snoop sees.` },
      look: { all: 'Envelopes go and come back along the line; behind it, the snoop jots down what he sees on his screen.' },
      key: { all: 'Without TLS, anyone on the path reads everything.' } },
    ch: { title: { all: 'ClientHello' },
      story: { t12: 'The phone sends the ClientHello: the versions it accepts, the ciphers it can use, a random number and the site name (SNI). There is no secret yet: it goes in the clear.',
        t13: 'The phone sends the ClientHello: versions, ciphers, a random number and the site name (SNI). In TLS 1.3 it already guesses the key exchange method and sends its public part along (key share). That saves one round trip.' },
      look: { all: 'A clear envelope crosses the line; the snoop reads the site name.', t13x: 'A clear envelope crosses the line carrying the orange paint (the phone\'s public part).' },
      key: { t12: 'The ClientHello says what the phone can do.', t13x: 'In 1.3, the ClientHello already carries the public part of the key.' } },
    sh: { title: { all: 'ServerHello + certificate' },
      story: { t12: `The server picks the version and the cipher and sends the certificate: the document that says "I am ${HOST}", signed by an authority (CA). It also sends its public part of the key exchange. All in the clear: the snoop sees the certificate. The phone checks the name, the date and the chain up to a CA it trusts.`,
        t13x: `The server answers with the ServerHello and its public part (key share). With both parts, both sides can already compute the key. That is why the certificate already goes encrypted: the snoop does not see it. The phone checks the name, the date and the chain up to a CA it trusts. End of the 2nd RTT.` },
      look: { all: 'The certificate appears in front of the phone, with the three checks.' },
      key: { all: 'The certificate proves who the server is; the CA signature proves the certificate is genuine.' } },
    kx: { title: { all: 'The key exchange (ECDHE)' },
      story: { all: 'Think of paints. The two agree on a public color (yellow). Each has a secret color that never leaves home: the phone, red; the server, blue. Each mixes its secret with the yellow and sends the mix over the line. Then each adds its own secret to the mix it received: both end up with the same brown. The snoop saw the yellow, the orange and the green, but without a secret color he cannot reach the brown.' },
      look: { all: 'The orange and green paints cross the line; both sides end up with the same brown pot, and the snoop is left with another color.' },
      key: { all: 'The session key never crosses the line: each side computes it on its own.' } },
    fin: { title: { all: 'Finished: from here on, everything is encrypted' },
      story: { t12: 'Both sides announce "from now on, encrypted" (ChangeCipherSpec) and send the Finished: a digest of the whole handshake, already encrypted with the new key. If anyone had tampered with a message, the digest would not match. End of the 3rd RTT.',
        t13x: 'The phone sends the Finished, already encrypted: a digest of the whole handshake. If anyone had tampered with a message, the digest would not match. The line now carries only noise.' },
      look: { all: 'The line changes: instead of text, noise with padlocks.' },
      key: { all: 'Asymmetric to agree on the key, symmetric (fast) for the data.' } },
    req: { title: { all: 'The request goes encrypted' },
      story: { t12: 'Only now, after 3 RTTs (240 ms), the GET goes out. It goes encrypted: the snoop sees the size and the time, but not the page, the cookie or the password. The response arrives in the 4th RTT.',
        t13x: 'The GET goes out after 2 RTTs (160 ms), together with the Finished. It goes encrypted: the snoop sees the size and the time, but not the page, the cookie or the password. The response arrives in the 3rd RTT.' },
      look: { all: 'The encrypted envelopes pass; the snoop\'s screen shows only noise.' },
      key: { all: 'The snoop still sees who talks to whom and how much; the content, no.' } },
    ch0: { title: { all: 'Coming back: hello and request together' },
      story: { all: 'Lena has already visited the store and the server gave her a ticket (a pre-shared key, PSK). On the return visit, after TCP, the phone sends the ClientHello with the ticket and, in the same flight, the already encrypted GET (early data). The request goes out after just 1 RTT.' },
      look: { all: 'Two envelopes in a row: the hello in the clear and the already encrypted request.' },
      key: { all: '0-RTT: the request does not wait for the handshake to finish.' } },
    sh0: { title: { all: 'The response arrives in the 2nd RTT' },
      story: { all: 'The server recognizes the ticket, confirms the key and already answers the GET. The first byte arrives at the end of the 2nd RTT (160 ms), against 3 in regular 1.3 and 4 in 1.2.' },
      look: { all: 'The line turned into noise; the response comes back encrypted.' },
      key: { all: 'Resuming the session saves the whole handshake.' } },
    replay: { title: { all: 'The catch: replay' },
      story: { all: 'The early data goes out before the server proves the conversation is new. The snoop cannot read the request, but he can copy the packet and send it again. If it were "pay R$ 100", the payment could happen twice. That is why servers only accept 0-RTT for requests that can repeat without harm, like a GET, or refuse the early data.' },
      look: { all: 'A copy of the encrypted envelope leaves the snoop and reaches the server.' },
      key: { all: '0-RTT is fast, but anyone on the path can repeat it.' } },
    sum: { title: { all: 'Summary: RTTs before the first byte' },
      story: { all: 'Same page, same 80 ms RTT. TLS 1.2: the request goes out after 3 RTTs (240 ms). TLS 1.3: after 2 (160 ms). Resumption with 0-RTT: after 1 (80 ms), with the replay catch. Switch the scenario in the panel to compare.' },
      look: { all: 'The phone screen compares the three; the lit bar is the chosen scenario.' },
      key: { all: 'Each RTT of the handshake is waiting before the first useful byte.' } },
  };
  const F = {
    tcp: () => `<li>SYN → SYN-ACK ← ACK →: ${CIP} → ${SIP}, port 443</li><li><b>The snoop sees</b>: IPs, ports and that a connection started.</li>`,
    ch: () => sc === 't12'
      ? `<li>ClientHello: client_version 1.2, random (32 bytes), session_id, cipher_suites (e.g. ECDHE-RSA-AES128-GCM-SHA256), extensions: server_name = ${HOST}, supported_groups, signature_algorithms</li><li><b>The snoop sees</b>: everything, including the site name (SNI).</li>`
      : `<li>ClientHello: legacy_version 0x0303, random, cipher_suites (e.g. TLS_AES_128_GCM_SHA256), extensions: supported_versions = TLS 1.3, <b>key_share</b> (x25519, public part), server_name = ${HOST}, signature_algorithms</li><li><b>The snoop sees</b>: everything, including the SNI ${HOST} in the clear (only ECH, Encrypted Client Hello, hides it).</li>`,
    sh: () => sc === 't12'
      ? `<li>ServerHello: chosen version and cipher, random</li><li>Certificate: ${HOST}, issued by "CA Exemplo", with the chain</li><li>ServerKeyExchange: ECDHE public part, signed with the certificate key</li><li>ServerHelloDone</li><li><b>The snoop sees</b>: the whole certificate, in the clear.</li>`
      : `<li>ServerHello (in the clear): chosen cipher, server <b>key_share</b></li><li>Encrypted: EncryptedExtensions, Certificate, CertificateVerify (proof that the server holds the certificate\'s private key), Finished</li><li><b>The snoop sees</b>: the ServerHello; the certificate, no.</li>`,
    kx: () => `<li>ECDHE: each side generates a key pair just for this connection; the private part never leaves the device</li><li>With one side\'s private part and the other\'s public part, both compute the same secret; the session keys come from it</li><li>New keys on every connection: even if the certificate key leaks later, old conversations stay protected (forward secrecy)</li><li><b>The snoop sees</b>: the two public parts. With them, the secret cannot be computed.</li>`,
    fin: () => `<li>${sc === 't12' ? 'ChangeCipherSpec + Finished, in both directions' : 'Finished from the phone'}: verify_data = digest (HMAC) of all the handshake messages</li><li>Encrypted records start with 17 03 03 (type "application data")</li><li><b>The snoop sees</b>: noise and the size of each record.</li>`,
    req: () => `<li>GET /carrinho, cookies and headers: inside the encrypted record (AES-GCM, for example)</li><li>Request went out after <b>${BEFORE[sc]} RTTs</b> (${BEFORE[sc] * RTT} ms); first byte at ${BEFORE[sc] + 1} RTTs (${(BEFORE[sc] + 1) * RTT} ms)</li><li><b>The snoop sees</b>: IPs, port 443, sizes and times; the content, no.</li>`,
    ch0: () => `<li>ClientHello with pre_shared_key (the ticket from the previous visit) and early_data</li><li>Right behind it, the GET encrypted with the key derived from the ticket</li><li><b>The snoop sees</b>: the hello and the SNI in the clear; the request, only as noise.</li>`,
    sh0: () => `<li>ServerHello accepts the PSK; EncryptedExtensions confirms the early_data; Finished</li><li>The GET response comes right after, encrypted</li><li><b>The snoop sees</b>: noise.</li>`,
    replay: () => `<li>The early data lacks the replay protection the rest of the conversation has</li><li>Defenses: accept 0-RTT only for idempotent requests (GET), remember tickets already used or refuse the early data</li><li><b>The snoop</b> reads nothing, but can resend the copy.</li>`,
    sum: () => `<li>Counting TCP: 1.2 = 3 RTTs before the request; 1.3 = 2; 0-RTT = 1</li><li>At an 80 ms RTT: 240, 160 and 80 ms before the request</li><li>Today the versions in use are 1.2 and 1.3; SSL and TLS 1.0/1.1 were retired</li>`,
  };
  const SUMT = `<table class="h3-sum"><tr><th></th><th>Request out</th><th>1st byte</th></tr>
    <tr><td>TLS 1.2</td><td>3 RTTs · 240 ms</td><td>4 RTTs · 320 ms</td></tr>
    <tr><td>TLS 1.3</td><td>2 RTTs · 160 ms</td><td>3 RTTs · 240 ms</td></tr>
    <tr><td>0-RTT</td><td>1 RTT · 80 ms</td><td>2 RTTs · 160 ms</td></tr></table>`;
  const rttText = () => { const r = rttNow(); return `${r} RTT${r === 1 ? '' : 's'} · ${r * RTT} ms`; };

  function nowHtml() { return `<li>Counter: <b>${rttText()}</b> <span class="h3-dim">(example RTT: 80 ms)</span></li>${F[cur()]()}`; }
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="TLS version">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${pick(s.title)}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(s.key)}</p>
      ${cur() === 'sum' ? SUMT : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real fields and what the snoop sees</summary><ul class="h3-now" id="tlsnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'tls') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${rttText()}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'tls' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; TL = timeline(); keys = ''; render(); SFX.bit(1); return true; }
  const goId = id => { let i = ids().indexOf(id); if (i < 0) i = ids().findIndex(k => ORD[k] >= ORD[id]); return go(i >= 0 ? i : step); };
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { const id = cur(); sc = v; try { localStorage.setItem('sdlabs-tls3d-sc', v); } catch (e) {}
    let i = ids().indexOf(id); if (i < 0) i = ids().filter(k => ORD[k] <= ORD[id]).length - 1; return go(Math.max(0, i)); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % 3]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'tls') setSc(b.dataset.sc); });

  // ── telas ──
  let keys = '';
  const scrBase = (cv, P = cv.P) => { const { x } = cv, C = pal3(), A_ = '#' + accent.getHexString();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle';
    return { x, C, A_, acc: theme === 'light' ? C.hi : A_, u: v => v * P }; };
  function drawPhone(d) {
    const { x, C, A_, acc, u } = scrBase(phScr, phScr.P * 1.35);
    x.textAlign = 'center';
    x.strokeStyle = d.secure ? A_ : C.line; x.lineWidth = u(0.4); x.beginPath(); x.roundRect(u(3), u(5), u(46), u(9), u(4)); x.stroke();
    if (d.secure) lockIcon(x, u(8), u(9.6), u(4), acc);
    x.fillStyle = C.inkHi; x.font = `600 ${u(3.6)}px ${MONO3}`; x.fillText(`https://${HOST}`, u(27), u(9.6));
    if (d.sum) {
      x.fillStyle = C.inkHi; x.font = `600 ${u(4.2)}px ${MONO3}`; x.fillText('RTTs to request', u(26), u(24));
      SC.forEach((v, i) => { const y = 34 + i * 22, on = v === sc, w = 40 * BEFORE[v] / 3;
        x.textAlign = 'left'; x.fillStyle = on ? acc : C.ink; x.font = `${on ? 600 : 400} ${u(3.6)}px ${MONO3}`; x.fillText(SCNAME[v], u(5), u(y));
        x.strokeStyle = on ? A_ : C.line; x.fillStyle = A_; x.lineWidth = u(0.5); x.beginPath(); x.roundRect(u(5), u(y + 4), u(w), u(6), u(1.5)); if (on) x.fill(); else x.stroke();
        x.fillStyle = on ? acc : C.ink; x.font = `600 ${u(3.8)}px ${MONO3}`; x.fillText(`${BEFORE[v]} RTT · ${BEFORE[v] * RTT} ms`, u(5), u(y + 15)); });
      phScr.tex.needsUpdate = true; return;
    }
    x.fillStyle = C.ink; x.font = `${u(3.8)}px ${MONO3}`; x.fillText(d.status, u(26), u(24));
    x.fillText('handshake (example)', u(26), u(42));
    x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(`${d.rtt}`, u(26), u(55)); x.font = `${u(4)}px ${MONO3}`; x.fillText(`RTT · ${d.rtt * RTT} ms`, u(26), u(64));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(74)); x.lineTo(u(48), u(74)); x.stroke();
    x.fillStyle = C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText('session key', u(26), u(81));
    x.fillStyle = d.key ? acc : C.ink; x.font = `600 ${u(4)}px ${MONO3}`; x.fillText(d.key ? (sc === 'r0' ? 'from ticket (PSK)' : 'agreed ✓') : 'not yet', u(26), u(88));
    x.fillStyle = d.req ? acc : C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText(d.req ? 'request sent' : '', u(26), u(100));
    phScr.tex.needsUpdate = true;
  }
  function drawServer(st) {
    const { x, C, acc, u } = scrBase(svScr); x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6.5)}px ${MONO3}`; x.fillText(HOST, u(5), u(9));
    x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(`${SIP}:443`, u(5), u(20));
    x.fillStyle = acc; x.font = `600 ${u(5.2)}px ${MONO3}`; x.fillText(st, u(5), u(34));
    svScr.tex.needsUpdate = true;
  }
  function drawCurioso(lines) {
    const { x, C, acc, u } = scrBase(cuScr); x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(4.8)}px ${MONO3}`; x.fillText('what I see:', u(4), u(6));
    lines.slice(-4).forEach(([s, enc], i) => { x.fillStyle = enc ? C.ink : acc; x.font = `${u(3.9)}px ${MONO3}`;
      let t = s; while (x.measureText(t).width > u(100) && t.length > 4) t = t.slice(0, -2); if (t !== s) t = t.slice(0, -1) + '…'; x.fillText(t, u(4), u(15 + i * 8)); });
    cuScr.tex.needsUpdate = true;
  }
  function drawLine(enc) {
    const { x, C, A_, u } = scrBase(lnScr), w = lnScr.c.width, h = lnScr.c.height;
    x.clearRect(0, 0, w, h); x.fillStyle = theme === 'light' ? '#ecebea' : '#17181a'; x.fillRect(0, 0, w, h);
    if (!enc) { x.strokeStyle = C.line; x.lineWidth = u(0.5); x.setLineDash([u(6), u(5)]); x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); x.setLineDash([]);
      x.fillStyle = C.ink; x.font = `${u(4.5)}px ${MONO3}`; x.textAlign = 'center'; x.fillText('in the clear: anyone on the path reads it', w / 2, u(6)); }
    else { x.fillStyle = C.ink; x.font = `${u(3.4)}px ${MONO3}`; x.textAlign = 'left'; const H = '0123456789abcdef';
      let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let r = 0; r < 4; r++) { let s = ''; for (let i = 0; i < 120; i++) s += H[Math.floor(rnd() * 16)] + H[Math.floor(rnd() * 16)] + ' '; x.fillText(s, 0, u(3.5 + r * 5.5)); }
      for (let k = 0; k < 6; k++) { const cx = u(30 + k * 72); x.fillStyle = theme === 'light' ? '#ecebea' : '#17181a'; x.fillRect(cx - u(6), u(4), u(12), u(16)); lockIcon(x, cx, u(12.5), u(11), A_); } }
    lnScr.tex.needsUpdate = true;
  }
  function drawCert(enc) {
    const { x, C, acc, u } = scrBase(ctScr); x.textAlign = 'left';
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(2), u(2), u(86), u(102));
    x.fillStyle = C.inkHi; x.font = `600 ${u(6.5)}px ${MONO3}`; x.fillText('CERTIFICATE', u(6), u(10));
    const row = (k, v, y, hi) => { x.fillStyle = C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText(k, u(6), u(y)); x.fillStyle = hi ? acc : C.inkHi; x.font = `600 ${u(5)}px ${MONO3}`; x.fillText(v, u(6), u(y + 7)); };
    row('name (domain)', HOST, 22, true); row('valid until', '2027-03-01', 40); row('issued by', 'CA Exemplo', 58);
    x.fillStyle = C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText('CA signature', u(6), u(78));
    x.strokeStyle = acc; x.lineWidth = u(0.8); x.beginPath(); x.moveTo(u(8), u(92)); x.bezierCurveTo(u(20), u(80), u(26), u(100), u(38), u(88)); x.bezierCurveTo(u(46), u(80), u(52), u(96), u(64), u(86)); x.stroke();
    x.fillStyle = acc; x.font = `600 ${u(4.2)}px ${MONO3}`; x.fillText(enc ? 'arrived encrypted' : 'arrived in the clear', u(6), u(100));
    ctScr.tex.needsUpdate = true;
  }
  function drawEnv(o) { const { x, P } = o.cv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, w = o.cv.c.width, h = o.cv.c.height;
    x.clearRect(0, 0, w, h); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#1d1f21'; x.fillRect(0, 0, w, h);
    if (!o.enc) { x.strokeStyle = C.inkHi; x.lineWidth = u(0.8); x.strokeRect(u(1), u(1), u(28), u(18)); x.beginPath(); x.moveTo(u(1), u(1)); x.lineTo(u(15), u(11)); x.lineTo(u(29), u(1)); x.stroke(); }
    else { x.fillStyle = C.ink; x.font = `${u(3)}px ${MONO3}`; for (let r = 0; r < 5; r++) x.fillText('a9f31c7e0b5d8e', u(0.5), u(3.5 + r * 4)); lockIcon(x, u(15), u(10.5), u(12), A_); }
    o.cv.tex.needsUpdate = true; }

  // ── um quadro da cena ──
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const alongLine = (f, dir, from) => { if (from === 'cu') { const a = [350, 96, 40], b = [TX1 - 10, TY, 22]; return a.map((v, i) => v + (b[i] - v) * f).map((v, i) => i === 2 ? v + Math.sin(f * Math.PI) * 30 : v); }
    const g = dir > 0 ? f : 1 - f; return [TX0 + 10 + (TX1 - TX0 - 20) * g, TY, 22 + Math.sin(f * Math.PI) * 20]; };
  const hideEnv = () => { Object.values(ENV).forEach(o => { o.g.visible = false; o.glow.material.uniforms.intensity.value = 0; }); PDOT.g.visible = false; };
  function seen() {           // o que o curioso viu até agora neste cenário
    const out = []; ids().slice(0, step).forEach(id => LEGS[id]().forEach(l => l.sees && !l.replay && out.push([l.sees, l.enc])));
    TL.legs.forEach(l => { if (l.sees && lt >= l.t0 && !(l.replay && out.some(o => o[0] === l.sees))) out.push([l.sees, l.enc]); }); return out; }
  function scene3() {
    const id = cur(), t = lt, phone = innerWidth < 640;
    hideEnv(); let curLeg = null, mixStage = '';
    TL.legs.forEach(l => { if (t < l.t0) return; const f = Math.min(1, (t - l.t0) / (l.t1 - l.t0));
      if (l.mix) { if (l.mix === 'show') mixStage = mixStage || 'show'; else mixStage = f >= 1 ? 'done' : 'mixing'; return; }
      curLeg = l;
      if (f < 1) { const p = alongLine(ease(f), l.dir, l.from);
        if (l.paint) { PDOT.g.visible = true; PDOT.g.position.copy(W(...p)); paintM.color.setHex(l.paint); }
        else { const o = l.enc ? ENV.enc : ENV.clear; o.g.visible = true; o.g.position.copy(W(...p)); o.mat.emissiveIntensity = 1.1; moveGlow(o.glow, [p[0], p[1], p[2] + 8], 0.8); } } });
    if (id === 'kx' && !mixStage) mixStage = 'show';
    // balão da mensagem e o que o curioso vê
    if (curLeg && t < curLeg.t1 + 1.2) { tMsg.set(curLeg.label, curLeg.enc ? 'acc' : 'hi').at(phone ? 400 : 400, TY + 30, phone ? 250 : 110); } else tMsg.hide();
    const sw = seen(), lastSeen = curLeg && curLeg.sees ? [curLeg.sees, curLeg.enc] : null;
    if (lastSeen && !phone) tSees.set(`snoop sees: ${lastSeen[0]}`, lastSeen[1] ? 'dim' : 'acc').at(350, 50, 210); else tSees.hide();
    drawCurioso(sw.length ? sw : [['(nothing yet)', true]]);
    // nomes fixos e contador
    tPh.set('LENA\'S PHONE', 'hi').at(80, 172, 236);
    tSv.set(`SERVER\n${HOST}`, 'hi').at(630, 136, 200);
    tCu.set(phone ? 'SNOOP' : 'SNOOP\npublic Wi-Fi: sees everything', id === 'replay' ? 'acc' : 'dim').at(350, 50, phone ? 150 : 150);
    tRtt.set(`RTTs spent so far: ${rttText()}`, 'acc').at(phone ? 80 : 170, 172, 300);
    // certificado
    const certLeg = TL.legs.find(l => l.cert), certIn = id === 'sh' && certLeg && t >= certLeg.t1;
    ctG.visible = certIn; if (certIn) { drawCert(sc !== 't12'); tCert.set('✓ name matches: loja.exemplo\n✓ within validity\n✓ chain to a trusted CA', 'acc').at(phone ? 150 : 198, 212, phone ? 120 : 160); } else tCert.hide();
    // tintas
    const showPots = sc !== 'r0' && ORD[id] >= 3 && id !== 'sum';
    const k = keyKnown();
    const inKx = id === 'kx';
    POTS.ph.forEach((p, i) => p.g.visible = showPots && (inKx ? (i < 2 || k) : i === 2));
    POTS.sv.forEach((p, i) => p.g.visible = showPots && (inKx ? (i < 2 || k) : i === 2));
    const kxDone = id === 'kx' ? mixStage === 'done' : ORD[id] > 3;
    const paintsIn = id === 'kx' ? TL.legs.filter(l => l.paint && t >= l.t1).length : 2;
    POTS.cu.forEach((p, i) => p.g.visible = inKx && (i === 0 || (i < 3 ? paintsIn >= i : kxDone)));
    if (id === 'kx' && (!phone || kxDone)) {
      tKph.set(kxDone ? 'phone: green + red\n= brown (session key)' : 'phone: yellow (public)\n+ red (secret)', kxDone ? 'acc' : 'hi').at(195, 225, 70);
      tKsv.set(kxDone ? 'server: orange + blue\n= the same brown' : 'server: yellow (public)\n+ blue (secret)', kxDone ? 'acc' : 'hi').at(505, 225, 70);
      if (kxDone) tKcu.set('snoop: orange + green\n✕ another color, no secret', 'dim').at(365, 112, phone ? 90 : 75); else tKcu.hide();
    } else if (id === 'sum') { tKph.hide(); tKsv.hide();
      tKcu.set(`request goes out after:\nTLS 1.2: 3 RTTs (240 ms)\nTLS 1.3: 2 RTTs (160 ms)\n0-RTT: 1 RTT (80 ms)`, 'acc').at(360, TY, phone ? 200 : 140); }
    else { tKph.hide(); tKsv.hide(); tKcu.hide(); }
    // brilhos
    const busy = !!(curLeg && t < curLeg.t1);
    phCap.emissiveIntensity = busy && curLeg.dir > 0 && !curLeg.from ? 0.6 : 0;
    svCap.emissiveIntensity = busy && curLeg.dir < 0 ? 0.6 : (id === 'replay' && busy ? 0.6 : 0);
    cuCap.emissiveIntensity = busy ? 0.45 : 0;
    lnMat.emissiveIntensity = busy ? 0.22 : 0.05;
    // telas (só redesenha quando muda)
    const enc = encLine(), st = id === 'replay' ? 'got the same GET twice?' : id === 'req' || id === 'sh0' ? 'answering, encrypted' : enc ? 'encrypted channel' : id === 'tcp' ? 'TCP open' : id === 'kx' ? 'computing the key' : 'handshake';
    const status = id === 'tcp' ? 'opening TCP…' : id === 'sh' ? (certIn ? 'certificate ok' : 'waiting for certificate') : enc ? 'secure connection' : 'handshake…';
    const key = JSON.stringify([sc, id, enc, certIn, k, reqSent(), rttNow(), status, theme, sw.length]);
    if (key !== keys) { keys = key; drawPhone({ sum: id === 'sum', status, rtt: rttNow(), key: k, req: reqSent(), secure: enc }); drawServer(st); drawLine(enc); drawEnv(ENV.clear); drawEnv(ENV.enc); }
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = { tcp: [270, 140, 70], ch: [280, 140, 70], ch0: [280, 140, 70], sh: [270, 150, 70], sh0: [290, 140, 70], kx: [290, 150, 60], fin: [290, 140, 70], replay: [320, 120, 70], req: [290, 140, 70], sum: [270, 140, 70] };
  const FOCUS_M = { tcp: [300, 150, 90], ch: [320, 150, 90], ch0: [320, 150, 90], sh: [260, 160, 90], sh0: [340, 150, 90], kx: [340, 160, 70], fin: [330, 150, 90], replay: [380, 130, 90], req: [330, 150, 90], sum: [280, 150, 90] };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > TL.end + 3) lt = 0;              // repete a fala do passo
    scene3();
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('tlsnow'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[cur()];
      const want = W(f[0] + (mob ? -10 : -125), f[1], f[2] + (mob ? (innerWidth < 640 ? -300 : -250) : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, TL.end + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (e.key === '1' || e.key === '2' || e.key === '3') return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); keys = ''; });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 140, -150), dist: innerWidth < 640 ? 10.6 : 15 } : { target: W(180, 140, 70), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1 2 3 · drag to rotate' };
})() });
