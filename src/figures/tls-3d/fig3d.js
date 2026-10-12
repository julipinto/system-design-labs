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
  const SC = ['t12', 't13', 'r0'], SCNAME = { t12: 'TLS 1.2', t13: 'TLS 1.3', r0: 'Retomada (0-RTT)' };
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
    tcp: () => [E(1, 'SYN\nTCP: "vamos conversar?"', `SYN · ${CIP} → ${SIP}:443`), E(-1, 'SYN-ACK', 'SYN-ACK', { rtt: 1 }), E(1, 'ACK', 'ACK · conexão TCP aberta')],
    ch: () => sc === 't12'
      ? [E(1, 'ClientHello\nTLS 1.2 · cifras · random · SNI loja.exemplo', `ClientHello · SNI: ${HOST}`)]
      : [E(1, 'ClientHello\nTLS 1.3 · cifras · key share · SNI loja.exemplo', `ClientHello · SNI: ${HOST} · key share`)],
    sh: () => sc === 't12'
      ? [E(-1, 'ServerHello + Certificado\n+ ServerKeyExchange + ServerHelloDone', `Certificado de ${HOST} (em claro)`, { rtt: 2, cert: true })]
      : [E(-1, 'ServerHello + key share\ncifra escolhida', 'ServerHello · key share'),
         E(-1, '🔒 Certificado + Verify + Finished\njá cifrados com a chave nova', `${NOISE} (certificado cifrado)`, { enc: true, rtt: 2, cert: true })],
    kx: () => sc === 't12'
      ? [{ mix: 'show' }, E(-1, 'parte pública do servidor\n(foi no ServerKeyExchange)', 'tinta verde (pública)', { paint: PAINT.B, replay: true }),
         E(1, 'ClientKeyExchange\nparte pública do celular', 'tinta laranja (pública)', { paint: PAINT.A }), { mix: 'mix' }]
      : [{ mix: 'show' }, E(1, 'key share do celular\n(revendo: foi no ClientHello)', 'tinta laranja (pública)', { paint: PAINT.A, replay: true }),
         E(-1, 'key share do servidor\n(revendo: foi no ServerHello)', 'tinta verde (pública)', { paint: PAINT.B, replay: true }), { mix: 'mix' }],
    fin: () => sc === 't12'
      ? [E(1, '🔒 ChangeCipherSpec + Finished', NOISE, { enc: true }), E(-1, '🔒 ChangeCipherSpec + Finished', NOISE, { enc: true, rtt: 3 })]
      : [E(1, '🔒 Finished\n"conferi tudo, a chave é esta"', NOISE, { enc: true })],
    req: () => [E(1, '🔒 GET /carrinho\ncookie, senha, tudo cifrado', `${NOISE} (≈ 400 bytes)`, { enc: true, req: true }), E(-1, '🔒 200 OK\nprimeiro byte da página', `${NOISE} (≈ 14 KB)`, { enc: true, rtt: BEFORE[sc] + 1 })],
    ch0: () => [E(1, 'ClientHello + PSK\n"sou eu de novo" (ticket da última visita)', `ClientHello · SNI: ${HOST} · PSK`),
      E(1, '🔒 early data: GET /carrinho\njá cifrado, junto com o hello', `${NOISE} (early data)`, { enc: true, req: true })],
    sh0: () => [E(-1, 'ServerHello + 🔒 Finished\nchave confirmada', 'ServerHello + ruído', { enc: false }), E(-1, '🔒 200 OK\nprimeiro byte da página', `${NOISE} (≈ 14 KB)`, { enc: true, rtt: 2 })],
    replay: () => [E(1, '🔒 cópia do early data\nreenviada pelo curioso', 'eu copio e reenvio o pacote!', { enc: true, from: 'cu' })],
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
    tcp: { title: { all: 'A linha TCP já está aberta' },
      story: { all: `Lena abre https://${HOST} num Wi-Fi público. Antes do TLS, o TCP abre a conexão: SYN, SYN-ACK, ACK. Isso já custou 1 RTT (80 ms no exemplo). Tudo o que passa por essa linha, o curioso do Wi-Fi vê.` },
      look: { all: 'Os envelopes vão e voltam pela linha; atrás dela, o curioso anota o que vê na tela dele.' },
      key: { all: 'Sem TLS, quem está no caminho lê tudo.' } },
    ch: { title: { all: 'ClientHello' },
      story: { t12: 'O celular manda o ClientHello: as versões que aceita, as cifras que sabe usar, um número aleatório e o nome do site (SNI). Ainda não há segredo nenhum: vai em claro.',
        t13: 'O celular manda o ClientHello: versões, cifras, um número aleatório e o nome do site (SNI). No TLS 1.3 ele já adivinha o método de troca de chaves e manda junto a sua parte pública (key share). Isso economiza uma ida e volta.' },
      look: { all: 'Um envelope em claro atravessa a linha; o curioso lê o nome do site.', t13x: 'Um envelope em claro atravessa a linha levando a tinta laranja (a parte pública do celular).' },
      key: { t12: 'O ClientHello diz o que o celular sabe fazer.', t13x: 'No 1.3, o ClientHello já leva a parte pública da chave.' } },
    sh: { title: { all: 'ServerHello + certificado' },
      story: { t12: `O servidor escolhe a versão e a cifra e manda o certificado: o documento que diz "eu sou ${HOST}", assinado por uma autoridade (CA). Manda também a parte pública dele da troca de chaves. Tudo em claro: o curioso vê o certificado. O celular confere o nome, a data e a cadeia até uma CA em que confia.`,
        t13x: `O servidor responde com o ServerHello e a parte pública dele (key share). Com as duas partes, os dois lados já calculam a chave. Por isso o certificado já vai cifrado: o curioso não vê. O celular confere o nome, a data e a cadeia até uma CA em que confia. Fim do 2º RTT.` },
      look: { all: 'O certificado aparece na frente do celular, com as três conferências.' },
      key: { all: 'O certificado prova quem é o servidor; a assinatura da CA prova que o certificado é verdadeiro.' } },
    kx: { title: { all: 'A troca de chaves (ECDHE)' },
      story: { all: 'Pense em tintas. Os dois combinam uma cor pública (amarelo). Cada um tem uma cor secreta que nunca sai de casa: o celular, vermelho; o servidor, azul. Cada um mistura a sua secreta com o amarelo e manda a mistura pela linha. Aí cada um junta a sua secreta à mistura que recebeu: os dois chegam ao mesmo marrom. O curioso viu o amarelo, o laranja e o verde, mas sem uma cor secreta não chega ao marrom.' },
      look: { all: 'As tintas laranja e verde atravessam a linha; os dois lados acabam com o mesmo pote marrom, e o curioso fica com outra cor.' },
      key: { all: 'A chave de sessão nunca passa pela linha: cada lado a calcula sozinho.' } },
    fin: { title: { all: 'Finished: daqui em diante, tudo cifrado' },
      story: { t12: 'Os dois lados avisam "a partir de agora, cifrado" (ChangeCipherSpec) e mandam o Finished: um resumo de todo o handshake, já cifrado com a chave nova. Se alguém tivesse mexido em alguma mensagem, o resumo não bateria. Fim do 3º RTT.',
        t13x: 'O celular manda o Finished, já cifrado: um resumo de todo o handshake. Se alguém tivesse mexido em alguma mensagem, o resumo não bateria. A linha agora só leva ruído.' },
      look: { all: 'A linha muda: em vez de texto, ruído com cadeados.' },
      key: { all: 'Assimétrico para combinar a chave, simétrico (rápido) para os dados.' } },
    req: { title: { all: 'O pedido vai cifrado' },
      story: { t12: 'Só agora, depois de 3 RTTs (240 ms), o GET sai. Vai cifrado: o curioso vê o tamanho e o horário, mas não a página, o cookie ou a senha. A resposta chega no 4º RTT.',
        t13x: 'O GET sai depois de 2 RTTs (160 ms), junto com o Finished. Vai cifrado: o curioso vê o tamanho e o horário, mas não a página, o cookie ou a senha. A resposta chega no 3º RTT.' },
      look: { all: 'Os envelopes cifrados passam; a tela do curioso só mostra ruído.' },
      key: { all: 'O curioso ainda vê quem fala com quem e quanto; o conteúdo, não.' } },
    ch0: { title: { all: 'Voltando: hello e pedido juntos' },
      story: { all: 'Lena já visitou a loja e o servidor lhe deu um ticket (uma chave pré-combinada, PSK). Na volta, depois do TCP, o celular manda o ClientHello com o ticket e, no mesmo voo, o GET já cifrado (early data). O pedido sai depois de 1 RTT só.' },
      look: { all: 'Dois envelopes seguidos: o hello em claro e o pedido já cifrado.' },
      key: { all: '0-RTT: o pedido não espera o handshake terminar.' } },
    sh0: { title: { all: 'A resposta chega no 2º RTT' },
      story: { all: 'O servidor reconhece o ticket, confirma a chave e já responde o GET. O primeiro byte chega no fim do 2º RTT (160 ms), contra 3 no 1.3 normal e 4 no 1.2.' },
      look: { all: 'A linha virou ruído; a resposta volta cifrada.' },
      key: { all: 'Retomar a sessão poupa o handshake inteiro.' } },
    replay: { title: { all: 'A ressalva: replay' },
      story: { all: 'O early data vai antes de o servidor provar que a conversa é nova. O curioso não lê o pedido, mas pode copiar o pacote e mandar de novo. Se fosse "pagar R$ 100", o pagamento poderia acontecer duas vezes. Por isso servidores só aceitam 0-RTT para pedidos que podem se repetir sem estrago, como um GET, ou recusam o early data.' },
      look: { all: 'Uma cópia do envelope cifrado sai do curioso e chega ao servidor.' },
      key: { all: '0-RTT é rápido, mas pode ser repetido por quem está no caminho.' } },
    sum: { title: { all: 'Resumo: RTTs antes do primeiro byte' },
      story: { all: 'Mesma página, mesmo RTT de 80 ms. TLS 1.2: o pedido sai depois de 3 RTTs (240 ms). TLS 1.3: depois de 2 (160 ms). Retomada com 0-RTT: depois de 1 (80 ms), com a ressalva do replay. Troque o cenário no painel para comparar.' },
      look: { all: 'A tela do celular compara os três; a barra acesa é o cenário escolhido.' },
      key: { all: 'Cada RTT do handshake é espera antes do primeiro byte útil.' } },
  };
  const F = {
    tcp: () => `<li>SYN → SYN-ACK ← ACK →: ${CIP} → ${SIP}, porta 443</li><li><b>O curioso vê</b>: IPs, portas e que uma conexão começou.</li>`,
    ch: () => sc === 't12'
      ? `<li>ClientHello: client_version 1.2, random (32 bytes), session_id, cipher_suites (ex.: ECDHE-RSA-AES128-GCM-SHA256), extensões: server_name = ${HOST}, supported_groups, signature_algorithms</li><li><b>O curioso vê</b>: tudo, inclusive o nome do site (SNI).</li>`
      : `<li>ClientHello: legacy_version 0x0303, random, cipher_suites (ex.: TLS_AES_128_GCM_SHA256), extensões: supported_versions = TLS 1.3, <b>key_share</b> (x25519, parte pública), server_name = ${HOST}, signature_algorithms</li><li><b>O curioso vê</b>: tudo, inclusive o SNI ${HOST} em claro (só o ECH, Encrypted Client Hello, esconde isso).</li>`,
    sh: () => sc === 't12'
      ? `<li>ServerHello: versão e cifra escolhidas, random</li><li>Certificate: ${HOST}, emitido por "CA Exemplo", com a cadeia</li><li>ServerKeyExchange: parte pública ECDHE, assinada pela chave do certificado</li><li>ServerHelloDone</li><li><b>O curioso vê</b>: o certificado inteiro, em claro.</li>`
      : `<li>ServerHello (em claro): cifra escolhida, <b>key_share</b> do servidor</li><li>Cifrados: EncryptedExtensions, Certificate, CertificateVerify (prova de que o servidor tem a chave privada do certificado), Finished</li><li><b>O curioso vê</b>: o ServerHello; o certificado, não.</li>`,
    kx: () => `<li>ECDHE: cada lado gera um par de chaves só para esta conexão; a parte privada nunca sai do aparelho</li><li>Com a parte privada de um e a pública do outro, os dois calculam o mesmo segredo; dele saem as chaves de sessão</li><li>Chaves novas a cada conexão: mesmo que a chave do certificado vaze depois, conversas antigas continuam protegidas (sigilo futuro)</li><li><b>O curioso vê</b>: as duas partes públicas. Com elas, não dá para calcular o segredo.</li>`,
    fin: () => `<li>${sc === 't12' ? 'ChangeCipherSpec + Finished, nos dois sentidos' : 'Finished do celular'}: verify_data = resumo (HMAC) de todas as mensagens do handshake</li><li>Registros cifrados começam com 17 03 03 (tipo "dados de aplicação")</li><li><b>O curioso vê</b>: ruído e o tamanho de cada registro.</li>`,
    req: () => `<li>GET /carrinho, cookies e headers: dentro do registro cifrado (AES-GCM, por exemplo)</li><li>Pedido saiu depois de <b>${BEFORE[sc]} RTTs</b> (${BEFORE[sc] * RTT} ms); primeiro byte em ${BEFORE[sc] + 1} RTTs (${(BEFORE[sc] + 1) * RTT} ms)</li><li><b>O curioso vê</b>: IPs, porta 443, tamanhos e horários; o conteúdo, não.</li>`,
    ch0: () => `<li>ClientHello com pre_shared_key (o ticket da visita anterior) e early_data</li><li>Logo atrás, o GET cifrado com a chave derivada do ticket</li><li><b>O curioso vê</b>: o hello e o SNI em claro; o pedido, só como ruído.</li>`,
    sh0: () => `<li>ServerHello aceita o PSK; EncryptedExtensions confirma o early_data; Finished</li><li>A resposta do GET vem logo em seguida, cifrada</li><li><b>O curioso vê</b>: ruído.</li>`,
    replay: () => `<li>O early data não tem a proteção contra repetição que o resto da conversa tem</li><li>Defesas: aceitar 0-RTT só para pedidos idempotentes (GET), lembrar tickets já usados ou recusar o early data</li><li><b>O curioso</b> não lê nada, mas pode reenviar a cópia.</li>`,
    sum: () => `<li>Com o TCP: 1.2 = 3 RTTs antes do pedido; 1.3 = 2; 0-RTT = 1</li><li>A RTT de 80 ms: 240, 160 e 80 ms antes do pedido</li><li>Hoje as versões em uso são o 1.2 e o 1.3; SSL e TLS 1.0/1.1 foram aposentados</li>`,
  };
  const SUMT = `<table class="h3-sum"><tr><th></th><th>Pedido sai</th><th>1º byte</th></tr>
    <tr><td>TLS 1.2</td><td>3 RTTs · 240 ms</td><td>4 RTTs · 320 ms</td></tr>
    <tr><td>TLS 1.3</td><td>2 RTTs · 160 ms</td><td>3 RTTs · 240 ms</td></tr>
    <tr><td>0-RTT</td><td>1 RTT · 80 ms</td><td>2 RTTs · 160 ms</td></tr></table>`;
  const rttText = () => { const r = rttNow(); return `${r} RTT${r === 1 ? '' : 's'} · ${r * RTT} ms`; };

  function nowHtml() { return `<li>Contador: <b>${rttText()}</b> <span class="h3-dim">(RTT de exemplo: 80 ms)</span></li>${F[cur()]()}`; }
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Versão do TLS">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${pick(s.title)}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${pick(s.look)}</p>
      <p class="o3-key"><b>Em uma frase</b>${pick(s.key)}</p>
      ${cur() === 'sum' ? SUMT : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Campos reais e o que o curioso vê</summary><ul class="h3-now" id="tlsnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'tls') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${rttText()}`; }
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
      x.fillStyle = C.inkHi; x.font = `600 ${u(4.2)}px ${MONO3}`; x.fillText('RTTs até o pedido', u(26), u(24));
      SC.forEach((v, i) => { const y = 34 + i * 22, on = v === sc, w = 40 * BEFORE[v] / 3;
        x.textAlign = 'left'; x.fillStyle = on ? acc : C.ink; x.font = `${on ? 600 : 400} ${u(3.6)}px ${MONO3}`; x.fillText(SCNAME[v], u(5), u(y));
        x.strokeStyle = on ? A_ : C.line; x.fillStyle = A_; x.lineWidth = u(0.5); x.beginPath(); x.roundRect(u(5), u(y + 4), u(w), u(6), u(1.5)); if (on) x.fill(); else x.stroke();
        x.fillStyle = on ? acc : C.ink; x.font = `600 ${u(3.8)}px ${MONO3}`; x.fillText(`${BEFORE[v]} RTT · ${BEFORE[v] * RTT} ms`, u(5), u(y + 15)); });
      phScr.tex.needsUpdate = true; return;
    }
    x.fillStyle = C.ink; x.font = `${u(3.8)}px ${MONO3}`; x.fillText(d.status, u(26), u(24));
    x.fillText('handshake (exemplo)', u(26), u(42));
    x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(`${d.rtt}`, u(26), u(55)); x.font = `${u(4)}px ${MONO3}`; x.fillText(`RTT · ${d.rtt * RTT} ms`, u(26), u(64));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(74)); x.lineTo(u(48), u(74)); x.stroke();
    x.fillStyle = C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText('chave de sessão', u(26), u(81));
    x.fillStyle = d.key ? acc : C.ink; x.font = `600 ${u(4)}px ${MONO3}`; x.fillText(d.key ? (sc === 'r0' ? 'do ticket (PSK)' : 'combinada ✓') : 'ainda não', u(26), u(88));
    x.fillStyle = d.req ? acc : C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText(d.req ? 'pedido enviado' : '', u(26), u(100));
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
    x.fillStyle = C.inkHi; x.font = `600 ${u(4.8)}px ${MONO3}`; x.fillText('o que eu vejo:', u(4), u(6));
    lines.slice(-4).forEach(([s, enc], i) => { x.fillStyle = enc ? C.ink : acc; x.font = `${u(3.9)}px ${MONO3}`;
      let t = s; while (x.measureText(t).width > u(100) && t.length > 4) t = t.slice(0, -2); if (t !== s) t = t.slice(0, -1) + '…'; x.fillText(t, u(4), u(15 + i * 8)); });
    cuScr.tex.needsUpdate = true;
  }
  function drawLine(enc) {
    const { x, C, A_, u } = scrBase(lnScr), w = lnScr.c.width, h = lnScr.c.height;
    x.clearRect(0, 0, w, h); x.fillStyle = theme === 'light' ? '#ecebea' : '#17181a'; x.fillRect(0, 0, w, h);
    if (!enc) { x.strokeStyle = C.line; x.lineWidth = u(0.5); x.setLineDash([u(6), u(5)]); x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); x.setLineDash([]);
      x.fillStyle = C.ink; x.font = `${u(4.5)}px ${MONO3}`; x.textAlign = 'center'; x.fillText('em claro: quem está no caminho lê', w / 2, u(6)); }
    else { x.fillStyle = C.ink; x.font = `${u(3.4)}px ${MONO3}`; x.textAlign = 'left'; const H = '0123456789abcdef';
      let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let r = 0; r < 4; r++) { let s = ''; for (let i = 0; i < 120; i++) s += H[Math.floor(rnd() * 16)] + H[Math.floor(rnd() * 16)] + ' '; x.fillText(s, 0, u(3.5 + r * 5.5)); }
      for (let k = 0; k < 6; k++) { const cx = u(30 + k * 72); x.fillStyle = theme === 'light' ? '#ecebea' : '#17181a'; x.fillRect(cx - u(6), u(4), u(12), u(16)); lockIcon(x, cx, u(12.5), u(11), A_); } }
    lnScr.tex.needsUpdate = true;
  }
  function drawCert(enc) {
    const { x, C, acc, u } = scrBase(ctScr); x.textAlign = 'left';
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(2), u(2), u(86), u(102));
    x.fillStyle = C.inkHi; x.font = `600 ${u(6.5)}px ${MONO3}`; x.fillText('CERTIFICADO', u(6), u(10));
    const row = (k, v, y, hi) => { x.fillStyle = C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText(k, u(6), u(y)); x.fillStyle = hi ? acc : C.inkHi; x.font = `600 ${u(5)}px ${MONO3}`; x.fillText(v, u(6), u(y + 7)); };
    row('nome (domínio)', HOST, 22, true); row('válido até', '2027-03-01', 40); row('emitido por', 'CA Exemplo', 58);
    x.fillStyle = C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText('assinatura da CA', u(6), u(78));
    x.strokeStyle = acc; x.lineWidth = u(0.8); x.beginPath(); x.moveTo(u(8), u(92)); x.bezierCurveTo(u(20), u(80), u(26), u(100), u(38), u(88)); x.bezierCurveTo(u(46), u(80), u(52), u(96), u(64), u(86)); x.stroke();
    x.fillStyle = acc; x.font = `600 ${u(4.2)}px ${MONO3}`; x.fillText(enc ? 'chegou cifrado' : 'chegou em claro', u(6), u(100));
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
    if (lastSeen && !phone) tSees.set(`curioso vê: ${lastSeen[0]}`, lastSeen[1] ? 'dim' : 'acc').at(350, 50, 210); else tSees.hide();
    drawCurioso(sw.length ? sw : [['(nada ainda)', true]]);
    // nomes fixos e contador
    tPh.set('CELULAR DA LENA', 'hi').at(80, 172, 236);
    tSv.set(`SERVIDOR\n${HOST}`, 'hi').at(630, 136, 200);
    tCu.set(phone ? 'CURIOSO' : 'CURIOSO\nWi-Fi público: vê tudo que passa', id === 'replay' ? 'acc' : 'dim').at(350, 50, phone ? 150 : 150);
    tRtt.set(`RTTs gastos até agora: ${rttText()}`, 'acc').at(phone ? 80 : 170, 172, 300);
    // certificado
    const certLeg = TL.legs.find(l => l.cert), certIn = id === 'sh' && certLeg && t >= certLeg.t1;
    ctG.visible = certIn; if (certIn) { drawCert(sc !== 't12'); tCert.set('✓ nome bate: loja.exemplo\n✓ dentro da validade\n✓ cadeia até uma CA confiável', 'acc').at(phone ? 150 : 198, 212, phone ? 120 : 160); } else tCert.hide();
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
      tKph.set(kxDone ? 'celular: verde + vermelho\n= marrom (chave de sessão)' : 'celular: amarelo (público)\n+ vermelho (secreto)', kxDone ? 'acc' : 'hi').at(195, 225, 70);
      tKsv.set(kxDone ? 'servidor: laranja + azul\n= o mesmo marrom' : 'servidor: amarelo (público)\n+ azul (secreto)', kxDone ? 'acc' : 'hi').at(505, 225, 70);
      if (kxDone) tKcu.set('curioso: laranja + verde\n✕ outra cor, sem o segredo', 'dim').at(365, 112, phone ? 90 : 75); else tKcu.hide();
    } else if (id === 'sum') { tKph.hide(); tKsv.hide();
      tKcu.set(`pedido sai depois de:\nTLS 1.2: 3 RTTs (240 ms)\nTLS 1.3: 2 RTTs (160 ms)\n0-RTT: 1 RTT (80 ms)`, 'acc').at(360, TY, phone ? 200 : 140); }
    else { tKph.hide(); tKsv.hide(); tKcu.hide(); }
    // brilhos
    const busy = !!(curLeg && t < curLeg.t1);
    phCap.emissiveIntensity = busy && curLeg.dir > 0 && !curLeg.from ? 0.6 : 0;
    svCap.emissiveIntensity = busy && curLeg.dir < 0 ? 0.6 : (id === 'replay' && busy ? 0.6 : 0);
    cuCap.emissiveIntensity = busy ? 0.45 : 0;
    lnMat.emissiveIntensity = busy ? 0.22 : 0.05;
    // telas (só redesenha quando muda)
    const enc = encLine(), st = id === 'replay' ? 'recebi o mesmo GET 2 vezes?' : id === 'req' || id === 'sh0' ? 'respondendo, cifrado' : enc ? 'canal cifrado' : id === 'tcp' ? 'TCP aberto' : id === 'kx' ? 'calculando a chave' : 'handshake';
    const status = id === 'tcp' ? 'abrindo TCP…' : id === 'sh' ? (certIn ? 'certificado ok' : 'esperando certificado') : enc ? 'conexão segura' : 'handshake…';
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 140, -150), dist: innerWidth < 640 ? 10.6 : 15 } : { target: W(180, 140, 70), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1 2 3 · arraste para girar' };
})() });
