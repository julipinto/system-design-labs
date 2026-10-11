// Figura OSI em 3D (iso-glow): duas pilhas explodidas de 7 placas (celular da Lena e do irmão).
// O dado aparece SOBRE a camada ativa e se transforma de verdade: foto → comprimida e cifrada →
// quebrada em fatias (TCP) → quadro da fatia #1 [MAC][IP][TCP][dados][FCS] → bits no cabo → volta.
// Usa OSI_STAGES e osiDataView, injetados pelo build.
FIGS3D.push({ id: 'osi', name: 'Modelo OSI', mod: (() => {
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const OX = 40, OY = 34, SW = 170, SD = 116, SH = 6, GAP = 40, Z0 = 20, PULL = 132;   // PULL: quanto a camada ativa sai da pilha, como gaveta
  const SXS = { sp: OX, tk: OX + 460 };
  const zL = L => Z0 + (L - 1) * GAP;
  const COL = { sp: SXS.sp + SW + 52, tk: SXS.tk - 52 };
  const PY = OY + SD / 2;
  const NAMES = { 1: 'FÍSICA', 2: 'ENLACE', 3: 'REDE', 4: 'TRANSPORTE', 5: 'SESSÃO', 6: 'APRESENTAÇÃO', 7: 'APLICAÇÃO' };
  const PROTO = { 1: 'rádio · cobre · fibra', 2: 'Wi-Fi · Ethernet · MAC', 3: 'IP · ICMP', 4: 'TCP · UDP', 5: 'sessão TLS', 6: 'TLS · JPEG', 7: 'HTTP · DNS' };
  const PDU = { 1: 'bits', 2: 'quadro', 3: 'pacote', 4: 'segmento', 5: 'dados', 6: 'dados', 7: 'dados' };
  const CAT = ['.X......X.', '.XX....XX.', '.XXXXXXXX.', 'XX.XXXX.XX', 'XXXXXXXXXX', 'XXXX..XXXX', '.XXXXXXXX.', '..XXXXXX..'];
  const drawCat = (x, ox, oy, size, col, bg) => { const u = size / 100; x.save(); x.translate(ox, oy);
    x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(18 * u, 44 * u); x.lineTo(24 * u, 8 * u); x.lineTo(42 * u, 28 * u); x.lineTo(58 * u, 28 * u); x.lineTo(76 * u, 8 * u); x.lineTo(82 * u, 44 * u);
    x.quadraticCurveTo(90 * u, 88 * u, 50 * u, 92 * u); x.quadraticCurveTo(10 * u, 88 * u, 18 * u, 44 * u); x.closePath(); x.fill();   // cabeça com orelhas
    x.fillStyle = bg; x.beginPath(); x.ellipse(36 * u, 54 * u, 7 * u, 9 * u, 0, 0, Math.PI * 2); x.ellipse(64 * u, 54 * u, 7 * u, 9 * u, 0, 0, Math.PI * 2); x.fill();   // olhos
    x.fillStyle = col; x.beginPath(); x.ellipse(36 * u, 55 * u, 2.4 * u, 6.5 * u, 0, 0, Math.PI * 2); x.ellipse(64 * u, 55 * u, 2.4 * u, 6.5 * u, 0, 0, Math.PI * 2); x.fill();   // pupilas
    x.fillStyle = bg; x.beginPath(); x.moveTo(45 * u, 68 * u); x.lineTo(55 * u, 68 * u); x.lineTo(50 * u, 74 * u); x.closePath(); x.fill();   // nariz
    x.strokeStyle = bg; x.lineWidth = 1.6 * u; x.beginPath();
    for (const [y0, y1] of [[72, 68], [76, 77], [80, 86]]) { x.moveTo(40 * u, y0 * u); x.lineTo(14 * u, y1 * u); x.moveTo(60 * u, y0 * u); x.lineTo(86 * u, y1 * u); }
    x.moveTo(50 * u, 74 * u); x.lineTo(50 * u, 79 * u); x.stroke(); x.restore(); };
  const drawNoise = (x, ox, oy, size, cols, seed) => { let r = seed; const n = 36, px = size / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { r = (r * 1103515245 + 12345) & 0x7fffffff; x.fillStyle = cols[r % cols.length]; x.fillRect(ox + i * px, oy + j * px, px + 0.5, px + 0.5); } };

  plateWith(g0, 740, 330, [[18, 18], [722, 18], [18, 312], [722, 312]]);

  // ── placas: corpo que acende, borda, nome/protocolos atrás e, na camada 7, a tela do chat ──
  const slabs = { sp: {}, tk: {} };
  const makeSlab = (side, L) => {
    const x = SXS[side], z = zL(L), mat = capMat(); twCaps.push(mat);
    const grp = new THREE.Group(); grp.userData = { stage: side === 'sp' ? 8 - L : 8 + L }; g0.add(grp);
    rbox(x, OY, z, SW, SD, SH, 6, mat, grp);
    const sh = new THREE.Shape(); roundRect(sh, x, -(OY + SD), SW, SD, 6);
    const rim = loopL(sh.getPoints(10).map(p => W(p.x, -p.y, z + SH + 0.06)), accentLineMat); rim.visible = false; grp.add(rim);
    const cv = faceCanvas('top', x, OY, z + SH, SW, SD, 4, grp, true);
    slitsUV(frontUV(x, OY + SD, z + SH), SW - 46, SW - 12, 3, 1.4, SH - 1.4, grp);
    const s = { grp, mat, rim, pull: 0, key: null, draw(state, chat) {
      const k = state + '|' + chat; if (s.key === k && !s.force) return; s.key = k; s.force = false;
      const { x: c, P } = cv, C = pal3(), A_ = '#' + accent.getHexString(), on = state === 'on', hot = state === 'hot';
      c.clearRect(0, 0, cv.c.width, cv.c.height); c.lineWidth = 0.25 * P;
      c.strokeStyle = on ? A_ : C.detail; c.beginPath(); c.roundRect(5 * P, 5 * P, (SW - 10) * P, (SD - 10) * P, 3 * P); c.stroke();
      c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = on || hot ? A_ : C.inkHi; c.font = `600 ${10 * P}px ${MONO3}`; c.letterSpacing = `${1.1 * P}px`;
      c.fillText(`${L}  ${NAMES[L]}`, 12 * P, 20 * P);
      c.fillStyle = C.ink; c.font = `${7 * P}px ${MONO3}`; c.letterSpacing = '0px';
      c.fillText(PROTO[L], 12 * P, 31 * P); c.textAlign = 'right'; c.fillText(PDU[L], (SW - 12) * P, 31 * P);
      if (chat) {                                   // a tela do app de mensagens, como no vídeo
        const bx = 12, by = SD - 46, bw = 88, bh = 34, ink = C.inkHi, sub = C.ink;
        c.strokeStyle = ink; c.lineWidth = 0.5 * P; c.beginPath(); c.roundRect(bx * P, by * P, bw * P, bh * P, 3 * P); c.stroke();
        c.textAlign = 'left'; c.fillStyle = ink; c.font = `600 ${5.5 * P}px ${MONO3}`;
        c.fillText(side === 'sp' ? 'Irmão · Tóquio' : 'Lena · São Paulo', (bx + 4) * P, (by + 8) * P);
        c.fillStyle = sub; c.font = `${5 * P}px ${MONO3}`;
        if (chat === 'call') { c.fillText('chamada de vídeo · 00:03', (bx + 4) * P, (by + 15) * P); }
        else if (chat === 'recv') { c.fillText('Lena enviou uma foto', (bx + 4) * P, (by + 15) * P); drawCat(c, (bx + 60) * P, (by + 7) * P, 24 * P, A_, theme === 'light' ? '#fbfbfa' : '#141516'); }
        else c.fillText(chat === 'send' ? 'olha o gato! ▸ enviar' : 'como vai o gatinho?', (bx + 4) * P, (by + 15) * P);
        c.beginPath(); c.roundRect((bx + 4) * P, (by + bh - 9) * P, (bw - 8) * P, 5 * P, 2 * P); c.stroke();
      }
      cv.tex.needsUpdate = true; mat.emissiveIntensity = 0; rim.visible = on || hot;
    } };
    return s;
  };
  for (const side of ['sp', 'tk']) {
    for (let L = 1; L <= 7; L++) slabs[side][L] = makeSlab(side, L);
    label(side === 'sp' ? 'LENA · SÃO PAULO' : 'IRMÃO · TÓQUIO', 150, 10, 7, onTop(SXS[side] + SW / 2, OY + SD + 22, 7), g0);
  }

  // ── cabo no piso, 3 roteadores, vários pontos de luz para os bits ──
  const WY = OY + SD + 70, WZ = 12;
  const wirePts = [[COL.sp, PY, WZ], [COL.sp, WY, WZ], [COL.tk, WY, WZ], [COL.tk, PY, WZ]];
  const wire = polyLine(wirePts, majorMat, g0), wcum = cumLen(wirePts);
  polyLine([[SXS.sp + SW, PY, zL(1) + 3], [COL.sp, PY, zL(1) + 3], [COL.sp, PY, WZ]], lineMat, g0);
  polyLine([[SXS.tk, PY, zL(1) + 3], [COL.tk, PY, zL(1) + 3], [COL.tk, PY, WZ]], lineMat, g0);
  const routers = [0.25, 0.5, 0.75].map((f, n) => {
    const rx = COL.sp + (COL.tk - COL.sp) * f, g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(rx - 18, WY - 16, 7, 36, 32, 16, 4, mat, g); slitsUV(frontUV(rx - 18, WY + 16, 23), 6, 30, 3, 3, 10, g);
    label(`R${n + 1}`, 20, 8, 6, onTop(rx, WY, 23), g);
    return { g, t: (wcum[1] + (rx - COL.sp)) / wcum[wcum.length - 1] };
  });
  const beads = Array.from({ length: 7 }, () => { const b = glowPoints([W(...wirePts[0])], 0.2); g0.add(b); return b; });

  // ── sessão: uma linha entre as camadas 5 das duas pilhas ──
  // uma ponte de luz entre as duas camadas 5 (acompanha a gaveta), com dois pontos indo e voltando: a conversa
  const sessMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.85, toneMapped: false });
  const sess = new THREE.Mesh(new THREE.CylinderGeometry(2.2 * TS, 2.2 * TS, 1, 16), sessMat); sess.visible = false; g0.add(sess);
  const sessBeads = [0, 1].map(() => { const b = glowPoints([W(0, 0, 0)], 0.32); g0.add(b); return b; });
  const sessLbl = label('SESSÃO ABERTA · conversa 9f3a', 120, 12, 8, onTop(0, 0, 0), g0); sessLbl.visible = false;
  const sessEnds = () => [[SXS.sp + SW, PY + slabs.sp[5].pull, zL(5) + SH / 2], [SXS.tk, PY + slabs.tk[5].pull, zL(5) + SH / 2]];

  // ── o dado: um grupo que fica sobre a camada ativa ──
  const D = new THREE.Group(); g0.add(D); const DS = 2; D.scale.setScalar(DS);
  const tile = new THREE.Group(); D.add(tile);
  const tileMat = capMat(); twCaps.push(tileMat); rbox(-28, -28, 0, 56, 56, 3, 3, tileMat, tile);
  const tcv = faceCanvas('top', -28, -28, 3, 56, 56, 6, tile, false);
  let tileMode = null;
  const drawTile = (mode, force) => { if (tileMode === mode && !force) return; tileMode = mode;
    const { x, P } = tcv, C = pal3(), A_ = '#' + accent.getHexString(), S = 56 * P;
    if (mode === 'call') { const bgc = theme === 'light' ? '#f3ede6' : '#1d1712'; x.fillStyle = bgc; x.fillRect(0, 0, S, S); x.fillStyle = A_;
      x.beginPath(); x.roundRect(8 * P, 16 * P, 28 * P, 22 * P, 4 * P); x.fill(); x.beginPath(); x.moveTo(38 * P, 22 * P); x.lineTo(50 * P, 16 * P); x.lineTo(50 * P, 38 * P); x.lineTo(38 * P, 32 * P); x.fill();
      x.strokeStyle = A_; x.lineWidth = 1.4 * P; x.beginPath(); for (let i = 0; i < 9; i++) { const xx = (10 + i * 4.4) * P, hh = [3, 6, 9, 5, 8, 4, 7, 3, 5][i] * P; x.moveTo(xx, 47 * P - hh); x.lineTo(xx, 47 * P + hh); } x.stroke(); }
    else if (mode === 'photo') { const bgc = theme === 'light' ? '#f3ede6' : '#1d1712'; x.fillStyle = bgc; x.fillRect(0, 0, S, S); drawCat(x, 4 * P, 4 * P, 48 * P, A_, bgc); }
    else drawNoise(x, 0, 0, S, theme === 'light' ? ['#c9ccd0', '#9aa0a6', '#e3e5e7', '#7d848b'] : ['#39414b', '#8d99a8', '#20252b', '#c7cfd9', '#5d6774'], 7);
    x.strokeStyle = A_; x.lineWidth = P * 1.2; x.strokeRect(P / 2, P / 2, S - P, S - P); tcv.tex.needsUpdate = true; };
  const httpLbl = label('POST /v1/fotos · HTTP', 60, 8, 4.8, onTop(0, 33, 4), D);
  const lockLbl = label('TLS · AES-256 · cifrado', 60, 8, 4.8, onTop(0, -33, 4), D);
  // as fatias: 20 cubinhos na grade (representam 215)
  const cubes = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(); D.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-4.5, -4.5, 0, 9, 9, 9, 1.5, mat, g);
    const n = j * 5 + i; if (n < 3) label(`#${n + 1}`, 10, 6, 4.5, onTop(0, 0, 9.4), g);
    cubes.push({ g, mat, home: [(i - 2) * 12, (j - 1.5) * 12 - 8], s: 0 });
  }
  // encapsulamento da fatia #1: uma caixa transparente por cabeçalho (TCP dentro do IP dentro do MAC)
  const PIECE_X = 76, PIECE_S = 2;
  const boxEdges = (w, d, h) => { const x0 = -w / 2, x1 = w / 2, y0 = -d / 2, y1 = d / 2, P8 = [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]];
    return [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([i, j]) => [P8[i], P8[j]]); };
  const parts = {};
  [['tcp', 'TCP · fatia #1, seq 1', 28, 26], ['udp', 'UDP · 8 B, sem seq/ACK', 28, 26], ['ip', 'IP · para 198.51.100.7', 40, 34], ['mac', 'MAC · para o roteador', 52, 42]].forEach(([id, txt, w, h]) => {
    const g = new THREE.Group(); D.add(g);
    const fillMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
    const fill = new THREE.Mesh(new THREE.BoxGeometry(w * TS, h * TS, w * TS), fillMat); fill.position.copy(W(0, 0, h / 2)); g.add(fill);
    seg(boxEdges(w, w, h), g, accentLineMat);
    const tz = { tcp: 16, udp: 16, ip: 27, mac: 38 }[id], R = new THREE.Group(), Lf = new THREE.Group(); g.add(R); g.add(Lf);
    seg([[[w / 2, w / 2, tz], [w / 2, 26.2, tz]], [[w / 2, 26.2, tz], [37, 26.2, tz]]], R, lineMat);
    label(txt, 62, 7, 4.4, onFront(70, 26.2, tz), R, { align: 'left' });
    seg([[[-w / 2, w / 2, tz], [-w / 2, 26.2, tz]], [[-w / 2, 26.2, tz], [-37, 26.2, tz]]], Lf, lineMat);
    label(txt, 62, 7, 4.4, onFront(-68, 26.2, tz), Lf);
    parts[id] = { g, fillMat, fill, R, Lf, s: 0 };
  });
  hazeAndShadow(g0, 370, 165, 9, 4.6);
  creases(first);

  // ── roteiro (o mesmo da figura 2D) ──
  const ST = OSI_STAGES;
  const where = s => s <= 7 ? { side: 'sp', L: s === 0 ? 7 : 8 - s } : s === 8 ? { side: 'x', L: 1 } : { side: 'tk', L: s - 8 };
  const DST = [
    { mode: 'photo', f: 1 }, { mode: 'photo', f: 1, http: 1 }, { mode: 'cipher', f: 0.55, lock: 1 }, { mode: 'cipher', f: 0.55, lock: 1, sess: 1 },
    { mode: 'cubes', tcp: 1, data: 1 }, { mode: 'cubes', tcp: 1, ip: 1, data: 1 }, { mode: 'cubes', tcp: 1, ip: 1, mac: 1, fcs: 1, data: 1 },
    { mode: 'cubes', tcp: 1, ip: 1, mac: 1, fcs: 1, data: 1, fade: 1 }, { mode: 'none' },
    { mode: 'cubes', tcp: 1, ip: 1, mac: 1, fcs: 1, data: 1 }, { mode: 'cubes', tcp: 1, ip: 1, data: 1 }, { mode: 'cubes', tcp: 1, data: 1 },
    { mode: 'cipher', f: 0.55, lock: 1 }, { mode: 'cipher', f: 0.55, lock: 1, sess: 1 }, { mode: 'photo', f: 1 }, { mode: 'none' },
  ];
  const cur = { x: SXS.sp + SW / 2, z: zL(7) + SH, a: 1, f: 1, tile: 1 };
  let s = 0, playing = false, dwell = 0, bitsT = -1, last = 0, mode = 'tcp', followT = 1.6;

  function readout() { if (active !== 'osi') return; const t = ST[s];
    document.getElementById('read').textContent = `passo ${s + 1}/16 · ` + (s === 0 ? 'início' : s === 8 ? 'roteadores' : (t.side === 'sp' ? 'lena' : 'irmão') + ` · ${t.L} ${t.name.toLowerCase()}`); }
  const LOOK3D = [
    'A placa 7 (a tela do chat) saiu da pilha; o gato está em cima dela.',
    'Em cima da foto apareceu o rótulo do pedido HTTP.',
    'A foto encolheu e virou ruído; o selo diz TLS · AES-256.',
    'Uma ponte de luz liga as camadas 5 das duas pilhas; os pontos indo e voltando são a conversa.',
    'O bloco virou 20 cubinhos numerados; o #1 saiu para o lado dentro da caixa TCP.',
    'O #1 ganhou uma segunda caixa por fora: IP.',
    'Terceira caixa por fora: MAC. Três caixas, uma dentro da outra.',
    'Os cubinhos somem da gaveta e os pontos de luz saem pelo cabo.',
    'Siga os pontos de luz no cabo; cada roteador (R1, R2, R3) pisca quando eles passam.',
    'A placa 1 do irmão saiu da pilha com o quadro completo.',
    'A caixa de fora (MAC) sumiu.',
    'A caixa do IP sumiu; só resta a do TCP.',
    'A última caixa sumiu e os cubinhos se juntaram no bloco cifrado.',
    'A ponte da sessão acende de novo entre as camadas 5: é a mesma conversa.',
    'O ruído virou gato de novo.',
    'A foto entrou no chat do irmão (placa 7).',
  ];

  // a história, passo a passo (cada passo continua o anterior) e o conceito para guardar
  const STORY = [
    ['São Paulo, 21h. A Lena tira uma foto do gato e abre a conversa com o irmão, que mora em Tóquio. Ela toca em enviar. Daqui pra frente a foto vai descer as 7 camadas do celular dela, cruzar o planeta e subir as 7 camadas do celular dele, em cerca de 1 segundo.', 'Cada camada faz um único trabalho e entrega o resultado para a camada de baixo.'],
    ['Primeiro o app precisa dizer o que quer. Ele escreve um pedido HTTP, "POST /v1/fotos", com a foto no corpo. (Um pouco antes, o DNS já tinha descoberto o IP do servidor de mensagens.)', 'Camada 7 é onde o app fala: HTTP, DNS, gRPC.'],
    ['Mandar 7,68 MB seria lento, e qualquer um no caminho poderia ver o gato. Então a foto é comprimida para 313 KB e cifrada com TLS. Para quem interceptar, agora é só ruído.', 'Camada 6 cuida de formato, compressão e criptografia.'],
    ['Antes de mandar, os dois lados precisam estar na mesma conversa. A sessão marca quem fala com quem e de onde retomar se a conexão cair no meio.', 'Camada 5 abre, mantém e fecha a conversa.'],
    ['Só que 313 KB não cabem num pacote: cada um leva no máximo uns 1.460 bytes. O TCP corta o bloco em 215 fatias, numera cada uma e põe nela o primeiro cabeçalho, com as portas e o número de sequência.', 'Camada 4 corta, numera e garante a entrega (TCP).'],
    ['Cada fatia precisa saber para onde vai. Por fora do TCP entra o cabeçalho IP, com o endereço final: 198.51.100.7. É esse rótulo que todos os roteadores vão ler até Tóquio.', 'Camada 3 dá o endereço final e escolhe o caminho (IP).'],
    ['Mas o primeiro trecho é curtinho: do celular até o roteador de casa. Por fora do IP entra o cabeçalho MAC, com o endereço desse roteador, e um FCS no fim para detectar bits estragados. Pacote dentro de pacote dentro de pacote: isso é encapsulamento.', 'Camada 2 entrega só até o próximo salto (MAC).'],
    ['Fim da descida. O quadro vira sinal: ondas de rádio até o roteador, pulsos elétricos no cobre e luz na fibra.', 'Camada 1 é o meio físico: aqui só existem bits.'],
    ['Os bits cruzam o planeta pelo cabo submarino. Em cada roteador o quadro é aberto até o IP: ele lê o destino, escolhe o próximo salto, troca o MAC e manda adiante. O IP de destino nunca muda no caminho.', 'Roteadores trabalham até a camada 3.'],
    ['Tóquio. O celular do irmão recebe o sinal e remonta os bits do quadro. Agora a mesma escada é percorrida ao contrário, de baixo para cima, e cada camada tira o cabeçalho que a camada equivalente da Lena colocou.', 'Desencapsular: cada camada tira o seu próprio cabeçalho.'],
    ['O enlace confere o FCS (nenhum bit estragou no caminho) e vê que o MAC de destino é o dele. Sai a caixa do MAC.', 'Camada 2 confere a integridade e o endereço local.'],
    ['O IP de destino também é o dele. Sai a caixa do IP.', 'Camada 3 confirma que o pacote chegou ao destino certo.'],
    ['O TCP junta as 215 fatias pela numeração, pede de novo as que faltaram e confirma o recebimento para a Lena. Sai o TCP, e o bloco cifrado fica inteiro de novo.', 'Camada 4 põe em ordem, completa e confirma.'],
    ['A sessão confere que esses dados são da mesma conversa com a Lena.', 'Camada 5 sabe a qual conversa cada dado pertence.'],
    ['O TLS decifra e a imagem é descomprimida: o ruído volta a ser o gato.', 'Camada 6 desfaz a criptografia e a compressão.'],
    ['O app mostra a foto no chat. Para o irmão foi instantâneo, mas a foto passou por 14 camadas e vários roteadores em cerca de 1 segundo.', 'Cada camada pôs um envelope na ida, e a mesma camada o tirou na volta.'],
  ];
  const UDP_TXT = {
    0: ['Lena liga para o irmão (chamada de vídeo)', 'Agora a Lena não manda uma foto: ela liga para o irmão por vídeo. O dado não está pronto, ele nasce a cada instante na câmera e no microfone, dezenas de pedaços por segundo. Numa conversa ao vivo, atrasar é pior do que perder um pedacinho.', 'A placa 7 mostra a chamada e, sobre ela, o vídeo ao vivo.', 'Voz e vídeo ao vivo têm pressa: chegar agora vale mais que chegar completo.'],
    1: ['7 · Aplicação: o app abre a chamada', 'O app de chamada (WebRTC) não faz um pedido e espera a resposta. Ele abre um fluxo e manda pedaços de áudio e vídeo sem parar.', 'Camada 7 acesa: o fluxo de mídia começa a sair.', 'Camada 7: o app decide o que enviar (aqui, um fluxo de mídia).'],
    2: ['6 · Apresentação: codifica e cifra', 'Cada pedacinho passa por um codec (Opus para voz, VP8 para vídeo), que comprime, e pelo SRTP, que cifra. Cada pedaço é pequeno e independente dos outros.', 'Camada 6: o vídeo vira ruído cifrado (SRTP).', 'Camada 6: compressão e criptografia, agora em tempo real.'],
    3: ['5 · Sessão: a chamada está aberta', 'A sessão aqui é a própria chamada: quem fala com quem, com que codec e há quanto tempo.', 'Camada 5: a linha da sessão (a chamada) acende entre os dois lados.', 'Camada 5 mantém a conversa aberta.'],
    4: ['4 · Transporte: UDP, sem esperar ninguém', 'Aqui está a grande diferença. Em vez do TCP, entra o UDP: só portas, tamanho e checksum (8 bytes). Sem abrir conexão, sem confirmar, sem reenviar. Se um pedaço se perder, ninguém para a fila esperando por ele.', 'A fatia #1 ganha uma caixa fina: o UDP (8 bytes, sem seq e sem ACK).', 'UDP troca garantia por velocidade.'],
    8: ['Salto a salto: um pedaço se perde', 'No caminho um pedaço se perde (fila cheia num roteador, Wi-Fi ruim). Com UDP ninguém avisa e ninguém reenvia. Os outros seguem em frente.', 'Um dos pontos de luz some no meio do cabo: é o pedaço perdido.', 'Perder pacote é normal na internet; o UDP simplesmente segue.'],
    12: ['4 · Transporte: segue sem o pedaço que faltou', 'Chegou quase tudo. O pedaço que se perdeu fica de fora: a imagem dá uma travadinha de milissegundos e a chamada continua. Se fosse esperar o reenvio, a conversa ficaria atrasada.', 'As fatias se juntam com um buraco: falta uma. A chamada segue mesmo assim.', 'TCP espera o que faltou; UDP pula e continua.'],
    14: ['6 · Apresentação: decifra e decodifica', 'O SRTP decifra e o codec remonta voz e imagem, mesmo com um pedacinho a menos.', 'Camada 6: o bloco é decifrado e o vídeo volta.', 'Camada 6 desfaz a criptografia e a compressão.'],
    15: ['7 · Aplicação: a chamada continua', 'O irmão vê e ouve a Lena ao vivo, com uma travadinha que ele nem percebeu. Por isso chamadas, jogos e transmissões ao vivo usam UDP (ou QUIC, que também roda sobre UDP).', 'Camada 7: a chamada aparece na tela do irmão.', 'Foto: TCP. Ligação ao vivo: UDP.'],
  };
  const cmpHtml = () => (s === 4 || s === 12) ? `<div class="dv-cmp"><div class="${mode === 'tcp' ? 'is-here' : ''}"><b>Foto · TCP</b><div class="dv-chips"><span>#5</span><span>#6</span><span class="miss">#7?</span><span>#8</span></div>espera o #7 chegar de novo (reenvio)</div><div class="${mode === 'udp' ? 'is-here' : ''}"><b>Ligação · UDP</b><div class="dv-chips"><span>#5</span><span>#6</span><span class="miss">–</span><span>#8</span></div>pula o #7: uma travadinha e segue</div></div>` : '';
  function panelHtml() {
    const u = mode === 'udp' ? UDP_TXT[s] : null;
    const t = ST[s], wh = t.side === 'sp' ? 'São Paulo · celular da Lena' : t.side === 'tk' ? 'Tóquio · celular do irmão' : 'No caminho · roteadores';
    return `<div class="o3-head"><span>Passo ${s + 1} de 16 · ${wh}</span><span>PDU: ${t.pdu}</span></div>
      <div class="o3-bar"><i style="width:${((s + 1) / 16 * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário"><button data-mode="tcp" aria-pressed="${mode === 'tcp'}">Foto · TCP</button><button data-mode="udp" aria-pressed="${mode === 'udp'}">Ligação · UDP</button></div>
      <h2>${u ? u[0] : t.title}</h2>
      <p class="o3-story">${u ? u[1] : STORY[s][0]}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${u ? u[2] : LOOK3D[s]}</p>
      <p class="o3-key"><b>Em uma frase</b>${u ? u[3] : STORY[s][1]}</p>${cmpHtml()}
      <details class="o3-dv"${innerWidth < 640 ? '' : ' open'}><summary>O dado agora</summary><div class="dv">${osiDataView(s, false, mode)}</div></details>`;
  }
  function render() {
    const w = where(s);
    for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) {
      let state = '';
      if (w.side === side && w.L === L && s !== 0) state = 'on';
      else if (side === 'sp' && s >= 1 && s <= 8 && L > (s === 8 ? 0 : 8 - s)) state = 'hot';
      else if (side === 'tk' && s >= 9 && L < w.L) state = 'hot';
      const chat = L === 7 ? (mode === 'udp' ? 'call' : side === 'sp' ? (s <= 1 ? 'send' : 'sent') : (s === 15 ? 'recv' : 'idle')) : '';
      slabs[side][L].draw(state, chat);
    }
    const d = DST[s];
    wire.material = s === 7 || s === 8 || s === 9 ? accentLineMat : majorMat;
    sess.visible = !!d.sess; sessLbl.visible = !!d.sess;
    httpLbl.visible = !!d.http; lockLbl.visible = !!d.lock && d.mode !== 'cubes';
    drawTile(d.mode === 'photo' ? (mode === 'udp' ? 'call' : 'photo') : 'cipher');
    const info = document.getElementById('info'); if (active === 'osi' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    readout();
  }
  function go(i) { s = (i + 16) % 16; dwell = 0; followT = 1.8; bitsT = s === 7 || s === 8 ? 0 : -1;
    if (s === 0) { cur.x = SXS.sp + SW / 2; cur.z = zL(7) + SH; } render(); SFX.bit(1); return true; }
  const next = () => go(s + 1), prev = () => go(Math.max(0, s - 1)), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setMode = m => { mode = m; for (const side of ['sp', 'tk']) slabs[side][7].force = true; tileMode = null; render(); return true; };
  const toggleMode = () => setMode(mode === 'tcp' ? 'udp' : 'tcp');
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b && active === 'osi') setMode(b.dataset.mode); });
  // a peça que acabou de entrar fica acesa
  const NEW = { 4: 'tcp', 5: 'ip', 6: 'mac' };
  const newPart = id => NEW[s] === (id === 'udp' ? 'tcp' : id);

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const w = where(s), d = DST[s], k = 1 - Math.exp(-dt / 0.35), kk = 1 - Math.exp(-dt / 0.5);
    // a camada ativa sai da pilha para a frente, como uma gaveta, e fica inteira à vista
    let pullNow = 0;
    for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) {
      const sl = slabs[side][L], want = w.side === side && L === w.L && w.side !== 'x' ? PULL : 0;
      sl.pull += (want - sl.pull) * kk; sl.grp.position.copy(W(0, sl.pull, 0));
      if (w.side === side && L === w.L) pullNow = sl.pull;
    }
    // o dado vai para o centro da camada ativa
    const tx = (w.side === 'tk' ? SXS.tk : SXS.sp) + SW / 2, tz = zL(w.L) + SH + 0.5;
    cur.x += (tx - cur.x) * k; cur.z += (tz - cur.z) * k;
    const show = d.mode !== 'none' && !d.fade ? 1 : 0; cur.a += (show - cur.a) * k;
    cur.f += ((d.f || 1) - cur.f) * k; cur.tile += ((d.mode === 'photo' || d.mode === 'cipher' ? 1 : 0) - cur.tile) * k;
    D.position.copy(W(cur.x, PY + 4 + pullNow, cur.z)); D.visible = cur.a > 0.04;
    tile.scale.setScalar(Math.max(0.001, cur.f * cur.tile * cur.a)); tile.visible = cur.tile > 0.02;
    const cubesOn = d.mode === 'cubes' ? cur.a : 0;
    cubes.forEach((c, n) => { const gap = mode === 'udp' && n === 6 && s >= 9; c.s += ((gap ? 0 : cubesOn) - c.s) * (1 - Math.exp(-dt / (0.25 + n * 0.012)));
      const t = c.s; c.g.visible = t > 0.02; c.g.scale.setScalar(Math.max(0.001, t)); c.g.position.copy(W(c.home[0] * t, c.home[1] * t, 0)); });
    for (const [id, p] of Object.entries(parts)) { const key = id === 'udp' ? 'tcp' : id, use = id === 'udp' ? mode === 'udp' : id === 'tcp' ? mode === 'tcp' : true;
      const want = use && d[key] && d.mode === 'cubes' ? cur.a : 0; p.s += (want - p.s) * k;
      p.g.visible = p.s > 0.02; p.g.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * p.s)); p.g.position.copy(W((where(s).side === 'tk' ? -1 : 1) * PIECE_X, 0, 0));
      p.fillMat.opacity = newPart(id) ? 0.02 * p.s : 0; p.fill.visible = newPart(id); p.R.visible = w.side !== 'tk'; p.Lf.visible = w.side === 'tk'; p.g.traverse(o => { if (o.material && o.material !== p.fillMat && o.material.opacity !== undefined && o.isMesh) o.material.opacity = p.s; }); }
    // a fatia #1 sai da grade para a frente e cresce: é ela que recebe os cabeçalhos
    { const c = cubes[0], pull = d.tcp && d.mode === 'cubes' ? 1 : 0; c.pull = (c.pull || 0) + (pull - (c.pull || 0)) * k;
      const t = c.s, side = where(s).side === 'tk' ? -1 : 1, px = c.home[0] * t * (1 - c.pull) + side * PIECE_X * c.pull, py = c.home[1] * t * (1 - c.pull);
      c.g.position.copy(W(px, py, 0)); c.g.scale.setScalar(Math.max(0.001, t * (1 + (PIECE_S - 1) * c.pull))); c.mat.emissiveIntensity = 0.35 * c.pull; }
    // ponte da sessão: reposiciona entre as camadas 5 (que podem estar na gaveta) e anima a conversa
    if (sess.visible) {
      const [A, B] = sessEnds(), a3 = W(...A), b3 = W(...B), dir = b3.clone().sub(a3), len = dir.length();
      sess.position.copy(a3.clone().add(b3).multiplyScalar(0.5)); sess.scale.set(1, len, 1);
      sess.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()); sessMat.color.copy(accent);
      const mid = A.map((v, i) => (v + B[i]) / 2); sessLbl.position.copy(W(mid[0] + 50, mid[1] - 16, mid[2] + 16));
      sessBeads.forEach((bd, n) => { const t = 0.5 + 0.5 * Math.sin(now / 700 + n * Math.PI); moveGlow(bd, A.map((v, i) => v + (B[i] - v) * t), 0.9); });
    } else sessBeads.forEach(bd => bd.material.uniforms.intensity.value = 0);
    // bits: vários pontos de luz em fila pelo cabo
    if (bitsT >= 0) { bitsT += dt; const T = s === 7 ? 1.2 : 4.2;
      beads.forEach((b, n) => { const t = (bitsT - n * 0.18) / T; if (t < 0 || t > 1 || (mode === 'udp' && s === 8 && n === 3 && t > 0.45)) { b.material.uniforms.intensity.value = 0; return; }
        moveGlow(b, alongPts(wirePts, wcum, s === 7 ? t * 0.08 : t), 0.95); });
      if (s === 8) routers.forEach(r => { if (!r.hit && bitsT / T >= r.t) { r.hit = true; flash(r.g, 320); SFX.bit(1); } });
      if (bitsT > T + 1.4) bitsT = s === 7 ? 0 : -1; }
    else { beads.forEach(b => b.material.uniforms.intensity.value = 0); routers.forEach(r => r.hit = false); }
    // depois de cada passo a câmera desliza até a camada da vez (no desktop, à direita do painel)
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = innerWidth < 640, off = mob ? 30 : -150;
      const fx = d.sess ? (SXS.sp + SW + SXS.tk) / 2 + (mob ? 0 : -170) : w.side === 'tk' ? SXS.tk + SW / 2 + (mob ? -30 : off) : w.side === 'x' ? (COL.sp + COL.tk) / 2 + (mob ? 0 : -120) : SXS.sp + SW / 2 + off;
      const want = W(fx, w.side === 'x' ? WY : 150 + PULL * 0.6, w.side === 'x' ? (mob ? -110 : -40) : (mob ? 30 : zL(w.L) - 20)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= (s === 8 ? 6 : 6.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'u' || e.key === 'U') return toggleMode();
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.stage === undefined) o = o.parent; if (o) go(o.userData.stage); }
  themeHooks.push(() => { for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) slabs[side][L].force = true; drawTile(tileMode || 'photo', true); render(); });
  drawTile('photo', true); render();
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Foto ⇄ Ligação', 'U', toggleMode]],
    view: innerWidth < 640 ? { target: W(SXS.sp + SW / 2 + 30, 150 + PULL * 0.6, 30), dist: 7 } : { target: W(250, 200, 110), dist: 14 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · clique numa camada · arraste para girar' };
})() });
