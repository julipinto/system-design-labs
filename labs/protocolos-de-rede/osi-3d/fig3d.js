// Figura OSI em 3D (iso-glow): duas pilhas explodidas de 7 placas (celular da Lena e do irmão).
// O dado aparece SOBRE a camada ativa e se transforma de verdade: foto → comprimida e cifrada →
// quebrada em fatias (TCP) → quadro da fatia #1 [MAC][IP][TCP][dados][FCS] → bits no cabo → volta.
// Usa OSI_STAGES e osiDataView, injetados pelo build.
FIGS3D.push({ id: 'osi', name: 'Modelo OSI', mod: (() => {
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const OX = 40, OY = 34, SW = 170, SD = 116, SH = 6, GAP = 40, Z0 = 20, LIFT = 64;
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
    const s = { grp, mat, rim, lift: 0, key: null, draw(state, chat) {
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
        if (chat === 'recv') { c.fillText('Lena enviou uma foto', (bx + 4) * P, (by + 15) * P); drawCat(c, (bx + 60) * P, (by + 7) * P, 24 * P, A_, theme === 'light' ? '#fbfbfa' : '#141516'); }
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
  const sess = polyLine([[SXS.sp + SW, OY + 20, zL(5) + 3], [SXS.tk, OY + 20, zL(5) + 3]], lineMat, g0); sess.visible = false;
  const sessLbl = label('SESSÃO 9f3a · aberta', 80, 9, 6, onTop((SXS.sp + SW + SXS.tk) / 2, OY + 26, zL(5) + 4), g0); sessLbl.visible = false;

  // ── o dado: um grupo que fica sobre a camada ativa ──
  const D = new THREE.Group(); g0.add(D); const DS = 2; D.scale.setScalar(DS);
  const tile = new THREE.Group(); D.add(tile);
  const tileMat = capMat(); twCaps.push(tileMat); rbox(-28, -28, 0, 56, 56, 3, 3, tileMat, tile);
  const tcv = faceCanvas('top', -28, -28, 3, 56, 56, 6, tile, false);
  let tileMode = null;
  const drawTile = (mode, force) => { if (tileMode === mode && !force) return; tileMode = mode;
    const { x, P } = tcv, C = pal3(), A_ = '#' + accent.getHexString(), S = 56 * P;
    if (mode === 'photo') { const bgc = theme === 'light' ? '#f3ede6' : '#1d1712'; x.fillStyle = bgc; x.fillRect(0, 0, S, S); drawCat(x, 4 * P, 4 * P, 48 * P, A_, bgc); }
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
  [['tcp', 'TCP · fatia #1, seq 1', 28, 26], ['ip', 'IP · para 198.51.100.7', 40, 34], ['mac', 'MAC · para o roteador', 52, 42]].forEach(([id, txt, w, h]) => {
    const g = new THREE.Group(); D.add(g);
    const fillMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
    const fill = new THREE.Mesh(new THREE.BoxGeometry(w * TS, h * TS, w * TS), fillMat); fill.position.copy(W(0, 0, h / 2)); g.add(fill);
    seg(boxEdges(w, w, h), g, accentLineMat);
    const tz = { tcp: 16, ip: 27, mac: 38 }[id], R = new THREE.Group(), Lf = new THREE.Group(); g.add(R); g.add(Lf);
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
  let s = 0, playing = false, dwell = 0, bitsT = -1, last = 0;

  function readout() { if (active !== 'osi') return; const t = ST[s];
    document.getElementById('read').textContent = `passo ${s + 1}/16 · ` + (s === 0 ? 'início' : s === 8 ? 'roteadores' : (t.side === 'sp' ? 'lena' : 'irmão') + ` · ${t.L} ${t.name.toLowerCase()}`); }
  const LOOK3D = [
    'Pilha da esquerda (Lena): a placa 7 é a tela do chat e a foto do gato está sobre ela. Ainda é só a imagem, sem nada de rede.',
    'Camada 7 acesa: em cima da foto aparece o pedido HTTP (POST /v1/fotos) que o app montou.',
    'Camada 6: a foto encolhe (compressão) e vira ruído (cifrada). O selo TLS · AES-256 mostra que ninguém no caminho consegue ver o gato.',
    'Camada 5: acende a linha da sessão entre as duas camadas 5. Os bytes não mudam.',
    'Camada 4: o bloco cifrado se quebra em fatias numeradas (#1, #2, #3…). A fatia #1 vem para a frente e ganha a primeira caixa: o cabeçalho TCP (número 1, seq 1).',
    'Camada 3: uma caixa maior envolve a do TCP: o cabeçalho IP, com o endereço final (para 198.51.100.7). É o rótulo que os roteadores leem.',
    'Camada 2: a terceira caixa, o cabeçalho MAC, com o endereço só do próximo salto (o roteador de casa). Pacote dentro de pacote dentro de pacote: isso é encapsulamento.',
    'Camada 1: as fatias viram sinal; os pontos de luz saem pelo cabo.',
    'Os pontos de luz são os bits. Cada roteador pisca quando eles passam: abre até o IP, troca o MAC e manda adiante.',
    'Pilha da direita (irmão), camada 1: as fatias reaparecem com o quadro completo.',
    'Camada 2: sai a caixa do MAC (o FCS conferiu: nenhum bit corrompido).',
    'Camada 3: sai a caixa do IP (o destino era ele).',
    'Camada 4: sai a caixa do TCP e as 215 fatias se juntam, na ordem, no bloco cifrado de novo.',
    'Camada 5: a linha da sessão acende de novo: é a mesma conversa.',
    'Camada 6: o bloco é decifrado e volta ao tamanho original: o gato aparece.',
    'Camada 7: a foto chega ao chat do irmão.',
  ];
  function panelHtml() {
    const t = ST[s], wh = t.side === 'sp' ? 'São Paulo · celular da Lena' : t.side === 'tk' ? 'Tóquio · celular do irmão' : 'No caminho · roteadores';
    return `<div class="o3-head"><span>Passo ${s + 1} de 16 · ${wh}</span><span>PDU: ${t.pdu}</span></div>
      <div class="o3-bar"><i style="width:${((s + 1) / 16 * 100).toFixed(1)}%"></i></div>
      <h2>${t.title}</h2>
      <p class="o3-look"><b>No desenho</b>${LOOK3D[s]}</p>
      <p>${t.body}</p>
      <details class="o3-dv"${innerWidth < 640 ? '' : ' open'}><summary>O dado agora</summary><div class="dv">${osiDataView(s, false)}</div></details>`;
  }
  function render() {
    const w = where(s);
    for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) {
      let state = '';
      if (w.side === side && w.L === L && s !== 0) state = 'on';
      else if (side === 'sp' && s >= 1 && s <= 8 && L > (s === 8 ? 0 : 8 - s)) state = 'hot';
      else if (side === 'tk' && s >= 9 && L < w.L) state = 'hot';
      const chat = L === 7 ? (side === 'sp' ? (s <= 1 ? 'send' : 'sent') : (s === 15 ? 'recv' : 'idle')) : '';
      slabs[side][L].draw(state, chat);
    }
    const d = DST[s];
    wire.material = s === 7 || s === 8 || s === 9 ? accentLineMat : majorMat;
    sess.material = accentLineMat; sess.visible = !!d.sess; sessLbl.visible = !!d.sess;
    httpLbl.visible = !!d.http; lockLbl.visible = !!d.lock && d.mode !== 'cubes';
    drawTile(d.mode === 'photo' ? 'photo' : 'cipher');
    const info = document.getElementById('info'); if (active === 'osi' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    readout();
  }
  function go(i) { s = (i + 16) % 16; dwell = 0; bitsT = s === 7 || s === 8 ? 0 : -1;
    if (s === 0) { cur.x = SXS.sp + SW / 2; cur.z = zL(7) + SH; } render(); SFX.bit(1); return true; }
  const next = () => go(s + 1), prev = () => go(Math.max(0, s - 1)), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  // a peça que acabou de entrar fica acesa
  const NEW = { 4: 'tcp', 5: 'ip', 6: 'mac' };
  const newPart = id => NEW[s] === id;

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const w = where(s), d = DST[s], k = 1 - Math.exp(-dt / 0.35), kk = 1 - Math.exp(-dt / 0.5);
    // a camada ativa abre espaço: as de cima sobem
    for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) {
      const sl = slabs[side][L], want = w.side === side && L > w.L && s !== 0 ? LIFT : 0;
      sl.lift += (want - sl.lift) * kk; sl.grp.position.copy(W(0, 0, sl.lift));
    }
    // o dado vai para o centro da camada ativa
    const tx = (w.side === 'tk' ? SXS.tk : SXS.sp) + SW / 2, tz = zL(w.L) + SH + 0.5;
    cur.x += (tx - cur.x) * k; cur.z += (tz - cur.z) * k;
    const show = d.mode !== 'none' && !d.fade ? 1 : 0; cur.a += (show - cur.a) * k;
    cur.f += ((d.f || 1) - cur.f) * k; cur.tile += ((d.mode === 'photo' || d.mode === 'cipher' ? 1 : 0) - cur.tile) * k;
    D.position.copy(W(cur.x, PY + 4, cur.z)); D.visible = cur.a > 0.04;
    tile.scale.setScalar(Math.max(0.001, cur.f * cur.tile * cur.a)); tile.visible = cur.tile > 0.02;
    const cubesOn = d.mode === 'cubes' ? cur.a : 0;
    cubes.forEach((c, n) => { c.s += (cubesOn - c.s) * (1 - Math.exp(-dt / (0.25 + n * 0.012)));
      const t = c.s; c.g.visible = t > 0.02; c.g.scale.setScalar(Math.max(0.001, t)); c.g.position.copy(W(c.home[0] * t, c.home[1] * t, 0)); });
    for (const [id, p] of Object.entries(parts)) { const want = d[id] && d.mode === 'cubes' ? cur.a : 0; p.s += (want - p.s) * k;
      p.g.visible = p.s > 0.02; p.g.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * p.s)); p.g.position.copy(W((where(s).side === 'tk' ? -1 : 1) * PIECE_X, 0, 0));
      p.fillMat.opacity = newPart(id) ? 0.02 * p.s : 0; p.fill.visible = newPart(id); p.R.visible = w.side !== 'tk'; p.Lf.visible = w.side === 'tk'; p.g.traverse(o => { if (o.material && o.material !== p.fillMat && o.material.opacity !== undefined && o.isMesh) o.material.opacity = p.s; }); }
    // a fatia #1 sai da grade para a frente e cresce: é ela que recebe os cabeçalhos
    { const c = cubes[0], pull = d.tcp && d.mode === 'cubes' ? 1 : 0; c.pull = (c.pull || 0) + (pull - (c.pull || 0)) * k;
      const t = c.s, side = where(s).side === 'tk' ? -1 : 1, px = c.home[0] * t * (1 - c.pull) + side * PIECE_X * c.pull, py = c.home[1] * t * (1 - c.pull);
      c.g.position.copy(W(px, py, 0)); c.g.scale.setScalar(Math.max(0.001, t * (1 + (PIECE_S - 1) * c.pull))); c.mat.emissiveIntensity = 0.35 * c.pull; }
    // bits: vários pontos de luz em fila pelo cabo
    if (bitsT >= 0) { bitsT += dt; const T = s === 7 ? 1.2 : 4.2;
      beads.forEach((b, n) => { const t = (bitsT - n * 0.18) / T; if (t < 0 || t > 1) { b.material.uniforms.intensity.value = 0; return; }
        moveGlow(b, alongPts(wirePts, wcum, s === 7 ? t * 0.08 : t), 0.95); });
      if (s === 8) routers.forEach(r => { if (!r.hit && bitsT / T >= r.t) { r.hit = true; flash(r.g, 320); SFX.bit(1); } });
      if (bitsT > T + 1.4) bitsT = s === 7 ? 0 : -1; }
    else { beads.forEach(b => b.material.uniforms.intensity.value = 0); routers.forEach(r => r.hit = false); }
    // no celular a câmera desliza até a pilha da vez
    if (innerWidth < 640 && dt > 0) {
      const fx = w.side === 'tk' ? SXS.tk + SW / 2 - 30 : w.side === 'x' ? (COL.sp + COL.tk) / 2 : SXS.sp + SW / 2 + 30;
      const want = W(fx, w.side === 'x' ? WY : 150, w.side === 'x' ? -110 : 30), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
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
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.stage === undefined) o = o.parent; if (o) go(o.userData.stage); }
  themeHooks.push(() => { for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) slabs[side][L].force = true; drawTile(tileMode || 'photo', true); render(); });
  drawTile('photo', true); render();
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto]],
    view: innerWidth < 640 ? { target: W(SXS.sp + SW / 2 + 30, 150, 30), dist: 7 } : { target: W(250, 160, 120), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · clique numa camada · arraste para girar' };
})() });
