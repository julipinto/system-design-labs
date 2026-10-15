// Figura 3D (iso-glow): RAID. O servidor da loja guarda o pedidos.db em vários discos.
// Uma controladora RAID (à esquerda, na frente), uma fileira de 5 baias com discos de gaveta (cada um com LED e duas faixas),
// e um mostrador ao fundo com os números do nível (discos, capacidade útil, tolerância, leitura, escrita, I/Os por escrita).
// Os blocos (A1, A2…) são cubos que voam da controladora para os discos; paridade P (dourado) e Q (roxo) são cubos de outra cor.
// Cenários: raid0, raid1, raid5, raid6, raid10 (também por ?mode=). Passos iguais em todos: chega, escrita, leitura, falha, resultado, segunda falha, rebuild, resumo.
// Segunda falha: raid1 perde o D1, raid5 perde o D4 (P1 some junto), raid6 perde o D4 e sobrevive (P e Q), raid10 tem seletor: outro par (D3) ou mesmo par (D1) (?pair=other|same).
// Números (bits, 4 discos de 1 TB) são exemplos didáticos coerentes com as aulas.
FIGS3D.push({ id: 'raid', name: 'RAID', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados ──
  const SC = ['raid0', 'raid1', 'raid5', 'raid6', 'raid10'];
  const SCNAME = { raid0: 'RAID 0', raid1: 'RAID 1', raid5: 'RAID 5', raid6: 'RAID 6', raid10: 'RAID 10' };
  const AULA = { raid0: 'aula-8-raid-0', raid1: 'aula-9-raid-1', raid5: 'aula-10-raid-5', raid6: 'aula-11-raid-6', raid10: 'aula-12-raid-10' };
  const IDS = ['arrive', 'write', 'read', 'fail', 'result', 'fail2', 'rebuild', 'sum'];
  const F = 1;                                   // o disco que queima: D2
  const BITS = { A1: '1011', A2: '0110', A3: '0101', A4: '1100', A5: '0011', A6: '1001', A7: '1110', A8: '0001', P1: '1000', P2: '0110', Q1: 'RS', Q2: 'RS' };
  const KIND = l => l[0] === 'P' ? 'p' : l[0] === 'Q' ? 'q' : 'd';
  const LAY = {
    raid0: { n: 4, file: 8, rows: [['A1', 'A2', 'A3', 'A4'], ['A5', 'A6', 'A7', 'A8']] },
    raid1: { n: 2, file: 2, rows: [['A1', 'A1'], ['A2', 'A2']] },
    raid5: { n: 4, file: 6, rows: [['A1', 'A2', 'A3', 'P1'], ['A4', 'A5', 'P2', 'A6']] },
    raid6: { n: 5, file: 6, rows: [['A1', 'A2', 'A3', 'P1', 'Q1'], ['A4', 'A5', 'P2', 'Q2', 'A6']] },
    raid10: { n: 4, file: 4, rows: [['A1', 'A1', 'A2', 'A2'], ['A3', 'A3', 'A4', 'A4']] },
  };
  const STAT = {
    raid0: { disks: 4, use: '4 TB', of: '4 TB', frac: 1, tol: 'nenhum', rd: '×4', wr: '×4', pen: '1 I/O' },
    raid1: { disks: 2, use: '1 TB', of: '2 TB', frac: 0.5, tol: '1 disco', rd: '×2', wr: '×1', pen: '2 I/Os' },
    raid5: { disks: 4, use: '3 TB', of: '4 TB', frac: 0.75, tol: '1 disco', rd: '×3', wr: '×3', pen: '4 I/Os' },
    raid6: { disks: 5, use: '3 TB', of: '5 TB', frac: 0.6, tol: '2 discos', rd: '×3', wr: '×3', pen: '6 I/Os' },
    raid10: { disks: 4, use: '2 TB', of: '4 TB', frac: 0.5, tol: '1 por par', rd: '×4', wr: '×2', pen: '2 I/Os' },
  };
  // leitura: [disco, faixa] que entregam blocos em paralelo
  const READ = { raid0: [[0, 0], [1, 0], [2, 0], [3, 0]], raid1: [[0, 0], [1, 1]], raid5: [[0, 0], [1, 0], [2, 0]], raid6: [[0, 0], [1, 0], [2, 0]], raid10: [[0, 0], [2, 0], [1, 1], [3, 1]] };
  // depois da falha: células que ainda respondem e servem ao resultado / rebuild
  const SURV = {
    raid0: [], raid1: [[0, 0], [0, 1]],
    raid5: [[0, 0], [2, 0], [3, 0], [0, 1], [2, 1], [3, 1]],
    raid6: [[0, 0], [2, 0], [3, 0], [0, 1], [2, 1], [4, 1]],
    raid10: [[0, 0], [0, 1], [2, 0], [3, 1]],
  };
  const LOSTK = { raid0: [1, 5], raid5: [1, 4], raid6: [1, 4] };    // blocos do arquivo que só existiam no D2 (índice do bloco)
  const REC = { raid5: ['A2', 'A5'], raid6: ['A2', 'A5'] };
  // segunda falha: raid10 escolhe 'other' (D3, outro par) ou 'same' (D1, par do D2)
  let pair = 'other';
  try { const m = new URLSearchParams(location.search).get('pair'); if (m === 'same' || m === 'other') pair = m; } catch (e) {}
  const F2 = () => ({ raid0: null, raid1: 0, raid5: 3, raid6: 3, raid10: pair === 'same' ? 0 : 2 })[sc];
  const OUT2 = () => ({ raid0: 'gone', raid1: 'all', raid5: 'all', raid6: 'safe', raid10: pair === 'same' ? 'half' : 'safe' })[sc];   // gone: já perdido · all: tudo perdido · half: metade · safe: sobrevive
  const HOLES = () => ({ raid0: [1, 5], raid1: [0, 1], raid5: [1, 4, 5], raid10: pair === 'same' ? [0, 2] : [] })[sc] || [];   // blocos do arquivo sem como refazer
  const EMPTYRB = () => OUT2() !== 'safe';                      // discos novos entram vazios (não há de onde reconstruir)
  const SURV2 = () => ({ raid0: [], raid1: [], raid5: [],
    raid6: [[0, 0], [2, 0], [4, 0], [0, 1], [2, 1], [4, 1]],
    raid10: pair === 'same' ? [[2, 0], [2, 1], [3, 0], [3, 1]] : [[0, 0], [0, 1], [3, 0], [3, 1]] })[sc];
  const SRCD = () => [...new Set(SURV2().map(c => c[0]))];
  const TG = () => [F, F2()].filter(x => x != null);              // discos trocados
  const val = v => typeof v === 'function' ? v() : v;

  let sc = 'raid5', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const m = new URLSearchParams(location.search).get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; } } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-raid3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  const L = () => LAY[sc], ST = () => STAT[sc];
  const N = () => IDS.length, cur = () => IDS[step];
  const PAR = () => sc === 'raid5' || sc === 'raid6';
  const ROWT = () => PAR() ? 3.4 : 2.6;
  const RB = 4.0;
  const DUR = () => ({ arrive: 3.6, write: L().rows.length * ROWT() + 0.8, read: 3.8, fail: 3.4, result: 4.4, fail2: 5, rebuild: 2.4 + RB + 0.8, sum: 1.5 })[cur()];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);

  // ── geometria ──
  plateWith(g0, 640, 300, [[18, 18], [622, 18], [18, 282], [622, 282]]);
  const mkGroup = id => { const g = new THREE.Group(); g.userData.go = id; g0.add(g); return g; };
  const DX = i => 176 + i * 84, DY = 80, DW = 70, DD = 122, DH = 34, DT = 7 + DH;
  const cellC = (i, r) => [DX(i) + DW / 2, DY + 34 + r * 56];
  for (let i = 0; i < 5; i++) inset(DX(i) - 4, DY - 4, 7, DW + 8, DD + 8, 5, g0);

  const ledOk = new THREE.Color(0x34d27b), ledBad = new THREE.Color(0xff4d3d), ledAmb = new THREE.Color(0xffb02e);
  const DISK = [];
  for (let i = 0; i < 5; i++) {
    const g = mkGroup('d' + i), x0 = DX(i);
    const mat = bodyMat.clone();
    rbox(x0, DY, 7, DW, DD, DH, 6, mat, g);
    const top = faceCanvas('top', x0 + 3, DY + 3, DT, DW - 6, DD - 6, 8, g);
    const fr = faceCanvas('front', x0 + 2, DY + DD, DT - 2, DW - 4, 22, 10, g);
    const led = new THREE.MeshBasicMaterial({ color: 0x34d27b, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 });
    dotFront(x0 + DW - 9, DY + DD, 12, 2.6, g, led);
    const glow = glowPoints([W(x0 + DW - 9, DY + DD + 0.5, 12)], 0.22); g.add(glow);
    DISK.push({ g, mat, top, fr, led, glow });
  }
  // controladora
  const ctlG = mkGroup('ctl');
  rbox(24, 140, 7, 110, 122, 44, 8, bodyMat, ctlG);
  const ctlTop = faceCanvas('top', 28, 144, 51, 102, 114, 7, ctlG);
  const ctlFr = faceCanvas('front', 30, 262, 46, 98, 24, 8, ctlG);
  slitsFront(36, 122, 6, 262, 14, 20, ctlG);
  // mostrador ao fundo (sempre visível)
  const stG = mkGroup('stat');
  rbox(24, 22, 7, 300, 12, 112, 5, bodyMat, stG);
  const stScr = faceCanvas('front', 30, 34, 115, 288, 100, 5, stG);
  hazeAndShadow(g0, 320, 150, 7.8, 4.2);

  // cubos de bloco
  const partMat = hex => new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.9, side: THREE.DoubleSide, emissive: new THREE.Color(hex), emissiveIntensity: 0.4, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  function mkCube() {
    const g = new THREE.Group(); g0.add(g); g.visible = false;
    const mats = { d: capMat(), p: partMat(0xe0a73a), q: partMat(0xa98bff) }; twCaps.push(mats.d);
    const mesh = rbox(-23, -22, 0, 46, 44, 22, 3, mats.d, g);
    const top = faceCanvas('top', -23, -22, 22, 46, 44, 8, g);
    const fr = faceCanvas('front', -21, 22, 20, 42, 18, 8, g);
    return { g, mats, mesh, top, fr, key: '' };
  }
  const CUB = DISK.map(() => [mkCube(), mkCube()]);
  const RECC = [mkCube(), mkCube()];
  const FILEC = mkCube();
  creases(first);

  // trilhos de luz (barramento na frente dos discos) e pontos que viajam
  const pathTo = i => { const xc = DX(i) + DW / 2; return [[130, 222, 9], [xc, 222, 9], [xc, 203, 9]]; };
  const PATHS = [];
  for (let i = 0; i < 5; i++) { const pts = pathTo(i); PATHS.push({ pts, cum: cumLen(pts), dim: polyLine(pts, lineMat, g0), lit: polyLine(pts, accentLineMat, g0) }); PATHS[i].lit.visible = false; }
  const RBP = {}; const rbp = (i, T) => RBP[i + '-' + T] ??= (() => { const pts = PATHS[i].pts.slice().reverse().concat(PATHS[T].pts); return { pts, cum: cumLen(pts) }; })();
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.28); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = [0, 1, 2, 3, 4, 5].map(() => mkDot(12));
  function place(d, p, k) { d.g.visible = true; d.g.position.copy(W(...p)); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); }

  // ── rótulos que olham para a câmera ──
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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : t.tone === 'bad' ? '#ff5a4a' : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? '#ff5a4a' : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tCtl = tag(13), tQ = tag(12), tW = tag(12);

  // ── tempos da escrita ──
  const strip = k => [28 + 3 + (k % 4) * 25.5 + 12, 144 + 22 + Math.floor(k / 4) * 40 + 17, 52];
  const kOf = l => parseInt(l.slice(1)) - 1;
  function wTimes() { const T = L().rows.length ? L().rows : [], out = Array.from({ length: L().n }, () => []);
    T.forEach((row, r) => { const tR = r * ROWT(); let k = 0;
      row.forEach((lab, i) => { const kd = KIND(lab);
        out[i][r] = { st: kd === 'd' ? tR + 0.3 + 0.16 * (k++) : tR + 1.6 + (kd === 'q' ? 0.25 : 0), dur: 1.3, from: kd === 'd' ? strip(kOf(lab)) : [79, 201, 64] }; }); });
    return out; }
  let WT = wTimes();

  // ── estado do que se vê ──
  const RBprog = () => clamp((lt - 2.4) / RB);
  function diskInfo(i) {
    const id = cur(), t = lt, o = { st: 'ok', off: [0, 0, 0], vis: true, bar: null, sub: 'ok' }, f2 = F2() != null && i === F2();
    if (i !== F && !f2) { if (id === 'rebuild' && t > 2.4 && RBprog() < 1 && SRCD().includes(i)) o.st = 'busy'; return o; }
    if (id === 'fail') { if (i === F && t >= 0.8) { o.st = 'fail'; o.sub = 'FALHOU'; } }
    else if (id === 'result') { if (i === F) { o.st = 'fail'; o.sub = 'FALHOU'; } }
    else if (id === 'fail2') { if (i === F || t >= 0.8) { o.st = 'fail'; o.sub = 'FALHOU'; } }
    else if (id === 'rebuild') {
      if (t < 0.3) { o.st = 'fail'; o.sub = 'FALHOU'; }
      else if (t < 1.2) { const f = ease((t - 0.3) / 0.9); o.st = 'fail'; o.sub = 'FALHOU'; o.off = [0, 150 * f, 26 * Math.sin(f * Math.PI) + 8 * f]; }
      else if (t < 1.3) o.vis = false;
      else { const f = ease(Math.min(1, (t - 1.3) / 0.9)); o.off = [0, 150 * (1 - f), 22 * Math.sin(f * Math.PI)];
        const p = RBprog(), em = EMPTYRB(); o.st = em ? 'new' : p < 1 ? 'new' : 'ok'; o.bar = em ? 0 : p;
        o.sub = em ? 'vazio' : p < 1 ? Math.round(p * 100) + '%' : 'ok'; }
    }
    return o;
  }
  const failedSet = () => { const id = cur(), t = lt, s = new Set(), f2 = F2();
    if (id === 'fail' && t >= 0.8) s.add(F);
    if (id === 'result') s.add(F);
    if (id === 'fail2') { s.add(F); if (f2 != null && t >= 0.8) s.add(f2); }
    if (id === 'rebuild' && t < 1.3) TG().forEach(x => s.add(x));
    return s; };
  function cellState(i, r) {          // → { vis, f, lost, lit }
    const id = cur(), t = lt, lab = L().rows[r][i], o = { vis: true, f: 1, lost: false, lit: false, lab }, f2 = F2() != null && i === F2();
    if (id === 'arrive') { o.vis = false; return o; }
    if (id === 'write') { const w = WT[i][r], f = clamp((t - w.st) / w.dur); if (f <= 0) o.vis = false; o.f = f; o.w = w; return o; }
    if (id === 'read') { o.lit = READ[sc].some(([a, b]) => a === i && b === r) && t > 0.5; return o; }
    if (i === F && id === 'fail') { o.lost = t >= 0.8; return o; }
    if (i === F && id === 'result') { o.lost = true; return o; }
    if (id === 'result') { o.lit = SURV[sc].some(([a, b]) => a === i && b === r) && t > 0.4; return o; }
    if (id === 'fail2') {
      if (i === F || (f2 && t >= 0.8)) { o.lost = true; return o; }
      o.lit = SURV2().some(([a, b]) => a === i && b === r) && t > 1.8; return o; }
    if ((i === F || f2) && id === 'rebuild') {
      if (t < 0.3) { o.lost = true; return o; }
      if (EMPTYRB()) { o.vis = false; return o; }
      o.vis = RBprog() >= (r + 1) / L().rows.length; o.lit = o.vis && RBprog() < 1; return o; }
    if (id === 'rebuild') { o.lit = SURV2().some(([a, b]) => a === i && b === r) && t > 2.4 && RBprog() < 1 && !EMPTYRB(); return o; }
    return o;
  }

  // ── desenhos nas telas ──
  const keys = new Map();
  const bgFill = (x, cv, col) => { x.fillStyle = col || (theme === 'light' ? '#f6f6f5' : '#141516'); x.fillRect(0, 0, cv.c.width, cv.c.height); };
  const toneCol = (kind, lost) => { const light = theme === 'light', C = pal3();
    return lost ? '#ff5a4a' : kind === 'p' ? (light ? '#8a5a00' : '#e0a73a') : kind === 'q' ? (light ? '#5b3fc7' : '#b79cff') : (light ? C.hi : '#' + accent.getHexString()); };
  function drawCube(c, lab, st) {
    const key = lab + st + theme + accent.getHex(); if (c.key === key) return; c.key = key;
    const kind = KIND(lab[0] === 'p' ? 'x' : lab), C = pal3(), light = theme === 'light', col = toneCol(kind, st === 'lost'), bits = BITS[lab] || '';
    c.mesh.material = c.mats[kind];
    const bg = st === 'lost' ? (light ? '#f1d9d6' : '#2a1514') : st === 'lit' ? (light ? '#f6ece2' : '#2a1d12') : (light ? '#eeeeed' : '#17181a');
    for (const [cv, front] of [[c.top, false], [c.fr, true]]) {
      const { x, P } = cv, u = v => v * P; x.clearRect(0, 0, cv.c.width, cv.c.height);
      x.fillStyle = bg; x.fillRect(0, 0, cv.c.width, cv.c.height);
      x.strokeStyle = col; x.lineWidth = u(st === 'lit' ? 1.6 : 0.8); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col;
      if (front) { x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(lab, cv.c.width / 2, cv.c.height / 2); }
      else { x.font = `600 ${u(lab.length > 4 ? 8.5 : 15)}px ${MONO3}`; x.fillText(lab, cv.c.width / 2, u(lab.length > 4 ? 22 : 17));
        if (bits) { x.font = `${u(9)}px ${MONO3}`; x.fillStyle = st === 'lost' ? col : C.inkHi; x.fillText(bits, cv.c.width / 2, u(33)); }
        if (st === 'lost') { x.font = `600 ${u(9)}px ${MONO3}`; x.fillStyle = col; x.fillText('✕', cv.c.width - u(6), u(7)); } }
      cv.tex.needsUpdate = true; }
    c.mats[kind].emissiveIntensity = st === 'lit' ? 1.0 : st === 'lost' ? 0 : 0.35;
  }
  function setCube(c, p, scale, vis) { c.g.visible = vis; if (!vis) return; c.g.position.copy(W(...p)); c.g.scale.setScalar(scale); }
  function drawDiskTop(i) {
    const key = 'dt' + i + theme; if (keys.get(key)) return; keys.set(key, 1);
    const { x, P } = DISK[i].top, C = pal3(), u = v => v * P, cv = DISK[i].top;
    bgFill(x, cv, C.recess);
    for (let r = 0; r < 2; r++) { x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.roundRect(u(9), u(6 + r * 56), u(46), u(44), u(3)); x.stroke(); x.setLineDash([]);
      x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(String(r + 1), u(3), u(10 + r * 56)); }
    cv.tex.needsUpdate = true;
  }
  function drawDiskFront(i, d) {
    const key = 'df' + i + d.st + d.sub + theme; if (keys.get('df' + i) === key) return; keys.set('df' + i, key);
    const cv = DISK[i].fr, { x, P } = cv, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = d.st === 'fail' ? '#ff5a4a' : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('D' + (i + 1), u(3), u(8));
    x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('1 TB', u(DW - 8), u(7));
    x.textAlign = 'left'; x.fillStyle = d.st === 'fail' ? '#ff5a4a' : d.st === 'new' || d.st === 'busy' ? acc : C.ink; x.font = `600 ${u(6.4)}px ${MONO3}`;
    x.fillText(d.st === 'new' ? 'NOVO ' + d.sub : d.sub === 'ok' ? (d.st === 'busy' ? 'lendo…' : 'ok') : d.sub, u(3), u(17));
    if (d.bar != null) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(30), u(14.5), u(30), u(5)); x.fillStyle = acc; x.fillRect(u(30), u(14.5), u(30 * d.bar), u(5)); }
    cv.tex.needsUpdate = true;
  }
  function drawCtlFront() {
    const key = 'cf' + sc + theme; if (keys.get('cf') === key) return; keys.set('cf', key);
    const { x, P } = ctlFr, C = pal3(), u = v => v * P; bgFill(x, ctlFr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('CONTROLADORA', u(4), u(8));
    x.fillStyle = theme === 'light' ? C.hi : '#' + accent.getHexString(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(SCNAME[sc] + ' · ' + ST().disks + ' discos', u(4), u(18)); ctlFr.tex.needsUpdate = true;
  }
  function stripCells() {
    const n = L().file, id = cur(), t = lt, a = Array(n).fill('full');
    if (id === 'arrive') { const c = Math.floor(clamp((t - 1.8) / 1.4) * n + 0.001); return a.map((_, k) => k < c ? 'full' : 'empty'); }
    if (id === 'write') return a.map((_, k) => { let started = false; L().rows.forEach((row, r) => row.forEach((lab, i) => { if (KIND(lab) === 'd' && kOf(lab) === k && t >= WT[i][r].st) started = true; })); return started ? 'empty' : 'full'; })
      .map(v => v);
    if (id === 'read') { const c = Math.floor(clamp((t - 1.2) / 1.8) * n + 0.001); return a.map((_, k) => k < c ? 'full' : 'empty'); }
    if (id === 'result' || id === 'fail2' || id === 'rebuild') {
      if (sc === 'raid0') return a.map((_, k) => LOSTK.raid0.includes(k) ? 'hole' : 'full');
      if (id === 'result' && PAR()) return a.map((_, k) => LOSTK[sc].includes(k) ? (t > 1.6 ? 'ok' : 'empty') : 'full');
      if (id === 'fail2') {
        if (sc === 'raid6') return a.map((_, k) => LOSTK.raid6.includes(k) ? (t < 0.8 || t > 2.0 ? 'ok' : 'empty') : 'full');
        if (t < 0.8) return a.map((_, k) => sc === 'raid5' && LOSTK.raid5.includes(k) ? 'ok' : 'full');
      }
      if (id !== 'result') return a.map((_, k) => HOLES().includes(k) ? 'hole' : 'full');
    }
    return a;
  }
  function drawStrip(cells) {
    const key = 'st' + cells.join() + sc + theme + accent.getHex(); if (keys.get('strip') === key) return; keys.set('strip', key);
    const { x, P } = ctlTop, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, ctlTop, C.recess); x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('pedidos.db', u(3), u(9));
    x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText(L().file + ' blocos', u(99), u(10)); x.textAlign = 'center';
    cells.forEach((s, k) => { const c = k % 4, r = Math.floor(k / 4), x0 = 3 + c * 25.5, y0 = 22 + r * 40, w = 24, h = 34, lab = 'A' + (k + 1);
      x.beginPath(); x.roundRect(u(x0), u(y0), u(w), u(h), u(2));
      if (s === 'empty') { x.setLineDash([u(1.4), u(1)]); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke(); x.setLineDash([]); return; }
      if (s === 'hole') { x.fillStyle = theme === 'light' ? '#f1d9d6' : '#2a1514'; x.fill(); x.strokeStyle = '#ff5a4a'; x.lineWidth = u(0.7); x.stroke();
        x.fillStyle = '#ff5a4a'; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText('✕', u(x0 + w / 2), u(y0 + 13)); x.font = `${u(5)}px ${MONO3}`; x.fillText(lab + ' perdido', u(x0 + w / 2), u(y0 + 27)); return; }
      x.fillStyle = s === 'ok' ? (theme === 'light' ? '#f6ece2' : '#2a1d12') : theme === 'light' ? '#eeeeed' : '#17181a'; x.fill();
      x.strokeStyle = s === 'ok' ? acc : C.line; x.lineWidth = u(s === 'ok' ? 1 : 0.4); x.stroke();
      x.fillStyle = acc; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(lab, u(x0 + w / 2), u(y0 + 13));
      x.fillStyle = C.inkHi; x.font = `${u(6)}px ${MONO3}`; x.fillText(BITS[lab] || '', u(x0 + w / 2), u(y0 + 25)); });
    ctlTop.tex.needsUpdate = true;
  }
  const lostState = () => sc === 'raid0' ? ['DADOS PERDIDOS', 'bad'] : OUT2() === 'all' ? ['FALHOU', 'bad'] : OUT2() === 'half' ? ['FALHOU · METADE', 'bad'] : ['DEGRADADO', 'warn'];
  function status() {
    const id = cur();
    if (id === 'fail') return lt >= 0.8 ? ['DISCO FALHOU', 'bad'] : ['saudável', 'ok'];
    if (id === 'result') return sc === 'raid0' ? ['DADOS PERDIDOS', 'bad'] : ['DEGRADADO', 'warn'];
    if (id === 'fail2') return lt < 0.8 ? (sc === 'raid0' ? ['DADOS PERDIDOS', 'bad'] : ['DEGRADADO', 'warn']) : lostState();
    if (id === 'rebuild') { if (EMPTYRB()) return lostState(); const p = RBprog(); return lt < 1.3 ? ['DEGRADADO', 'warn'] : p < 1 ? ['RECONSTRUINDO ' + Math.round(p * 100) + '%', 'warn'] : ['saudável', 'ok']; }
    return ['saudável', 'ok'];
  }
  // tolerância a falhas: quantas já foram usadas
  function tolInfo() {
    const s = ST(), id = cur(); let nf = failedSet().size;
    if (id === 'rebuild' && lt >= 1.3) nf = (EMPTYRB() || RBprog() < 1) ? TG().length : 0;
    if (!nf) return [s.tol, 'ok'];
    if (sc === 'raid0') return ['0 de 0 · perdeu', 'bad'];
    if (sc === 'raid6') return [nf + ' de 2 ' + (nf > 1 ? 'usadas' : 'usada'), 'warn'];
    if (sc === 'raid10') return nf < 2 ? ['par 1: 1 de 1 usada', 'warn'] : pair === 'same' ? ['par 1: 2 de 1 · estourou', 'bad'] : ['1 de 1 em cada par', 'warn'];
    return nf < 2 ? ['1 de 1 usada', 'warn'] : ['2 de 1 · estourou', 'bad'];
  }
  function drawStat() {
    const s = ST(), [stt, tone] = status(), [tolT, tolTone] = tolInfo(), key = 'ss' + sc + stt + tolT + theme + accent.getHex(); if (keys.get('stat') === key) return; keys.set('stat', key);
    const { x, P } = stScr, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, stScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(SCNAME[sc], u(5), u(10));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(s.disks + ' discos × 1 TB', u(5), u(21));
    const sc2 = tone === 'bad' ? '#ff5a4a' : tone === 'warn' ? '#ffb02e' : '#34d27b';
    x.font = `600 ${u(8)}px ${MONO3}`; x.textAlign = 'right'; x.fillStyle = sc2; x.fillText(stt, u(283), u(11));
    x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('capacidade útil', u(5), u(32)); x.textAlign = 'right'; x.fillStyle = C.inkHi; x.font = `600 ${u(6.5)}px ${MONO3}`; x.fillText(`${s.use} de ${s.of}`, u(283), u(32));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(5), u(37), u(278), u(7)); x.fillStyle = acc; x.fillRect(u(5), u(37), u(278 * s.frac), u(7));
    if (s.frac < 1) { x.strokeStyle = C.ink; x.lineWidth = u(0.4); for (let k = 5 + 278 * s.frac + 3; k < 283; k += 4) { x.beginPath(); x.moveTo(u(k), u(44)); x.lineTo(u(Math.min(283, k + 4)), u(37)); x.stroke(); } }
    const cells = [['tolera falhas', tolT], ['leitura', s.rd], ['escrita', s.wr], ['escrita pequena custa', s.pen]];
    cells.forEach(([a, b], k) => { const cx = 5 + (k % 2) * 142, cy = 52 + Math.floor(k / 2) * 23;
      x.beginPath(); x.roundRect(u(cx), u(cy), u(136), u(20), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.fillText(a, u(cx + 4), u(cy + 6));
      x.fillStyle = k === 3 && PAR() ? '#ffb02e' : k === 0 && tolTone === 'bad' ? '#ff5a4a' : k === 0 && tolTone === 'warn' ? '#ffb02e' : C.inkHi;
      let fs = 9.5; x.font = `600 ${u(fs)}px ${MONO3}`; const mw = x.measureText(b).width; if (mw > u(128)) { fs *= u(128) / mw; x.font = `600 ${u(fs)}px ${MONO3}`; }
      x.fillText(b, u(cx + 4), u(cy + 14.5)); });
    stScr.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const pick = o => val(o[sc] ?? o.all);
  const ND = () => ST().disks;
  const STEPS = {
    arrive: { title: { all: 'O arquivo chega à controladora' },
      story: { all: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. Quem recebe é a controladora RAID: ela corta o arquivo em blocos (A1, A2, A3…) e decide em qual disco cada um vai. Essa decisão é o que muda de um nível de RAID para outro.',
        raid0: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. A controladora RAID corta o arquivo em 8 blocos (A1 a A8) e decide em qual disco cada um vai. Hoje: RAID 0, com 4 discos de 1 TB.',
        raid1: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. A controladora RAID corta o arquivo em blocos (aqui mostramos A1 e A2) e decide em qual disco cada um vai. Hoje: RAID 1, com 2 discos de 1 TB.',
        raid5: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. A controladora RAID corta o arquivo em blocos (A1 a A6) e decide em qual disco cada um vai. Hoje: RAID 5, com 4 discos de 1 TB.',
        raid6: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. A controladora RAID corta o arquivo em blocos (A1 a A6) e decide em qual disco cada um vai. Hoje: RAID 6, com 5 discos de 1 TB.',
        raid10: 'O servidor da loja precisa guardar o pedidos.db, o arquivo com todos os pedidos. A controladora RAID corta o arquivo em blocos (A1 a A4) e decide em qual disco cada um vai. Hoje: RAID 10, com 4 discos de 1 TB.' },
      look: { all: 'O arquivo entra pela esquerda e vira blocos na tampa da controladora. O mostrador ao fundo resume o nível.' },
      key: { all: 'RAID junta vários discos para ganhar velocidade, segurança ou os dois.' } },
    write: { title: { raid0: 'Escrita: espalhar em faixas (striping)', raid1: 'Escrita: copiar nos dois discos (espelho)', raid5: 'Escrita: espalhar e calcular a paridade', raid6: 'Escrita: espalhar e calcular P e Q', raid10: 'Escrita: espelhar em pares e espalhar' },
      story: { raid0: 'No RAID 0, A1 vai para o disco 1, A2 para o 2, A3 para o 3 e A4 para o 4. A faixa (stripe) seguinte recomeça no disco 1. Quatro discos gravam ao mesmo tempo, por isso é rápido. Mas cada bloco existe em um lugar só.',
        raid1: 'No RAID 1 cada bloco é gravado nos dois discos ao mesmo tempo: A1 no D1 e no D2, depois A2 nos dois. É um espelho. A escrita tem a velocidade de um disco só, e metade da capacidade vira cópia.',
        raid5: 'No RAID 5 os blocos se espalham como no RAID 0, mas cada faixa ganha um bloco de paridade: o XOR dos blocos de dados. 1011 ⊕ 0110 ⊕ 0101 = 1000, e esse P1 vai para o disco 4. Na faixa 2 a paridade (P2) fica no disco 3: ela gira entre os discos.',
        raid6: 'O RAID 6 é o RAID 5 com duas paridades por faixa: P (o mesmo XOR) e Q (outra conta, de Reed-Solomon). Com 5 discos, cada faixa tem 3 blocos de dados, P e Q, e os dois giram entre os discos.',
        raid10: 'O RAID 10 combina os dois: os discos formam pares espelhados (D1+D2 e D3+D4) e os blocos se espalham entre os pares. A1 vai para o par 1 e é copiado nos dois discos dele; A2 vai para o par 2, também copiado.' },
      look: { raid0: 'Cubos saem da controladora e pousam um em cada disco; na faixa 2 repetem.', raid1: 'Cada bloco vira dois cubos, um por disco.', raid5: 'Os cubos dourados são a paridade P: a conta aparece no balão antes de ela voar. Ela pousa em discos diferentes em cada faixa.', raid6: 'Dourado é P, roxo é Q. Os dois mudam de disco a cada faixa.', raid10: 'Cada bloco vira dois cubos, só nos dois discos do seu par.' },
      key: { raid0: 'Striping: espalhar blocos em vários discos para gravar e ler em paralelo.', raid1: 'Espelho: cada bloco existe em dois discos.', raid5: 'Paridade = XOR dos blocos. Se um sumir, os outros e o P o refazem.', raid6: 'Duas paridades: aguenta a perda de dois discos.', raid10: 'Espelho + faixas: rápido e seguro, mas só metade da capacidade.' } },
    read: { title: { raid0: 'Leitura: os 4 discos entregam juntos', raid1: 'Leitura: um bloco de cada disco', raid5: 'Leitura: só os blocos de dados', raid6: 'Leitura: só os blocos de dados', raid10: 'Leitura: qualquer cópia serve' },
      story: { raid0: 'Hora de ler o arquivo de volta. Os 4 discos entregam seus blocos ao mesmo tempo: A1, A2, A3 e A4 chegam juntos. Por isso a leitura chega a ×4 a velocidade de um disco.',
        raid1: 'Os dois discos têm o mesmo dado, então a controladora divide o trabalho: A1 vem do D1 e A2 vem do D2, ao mesmo tempo. A leitura chega a ×2.',
        raid5: 'A controladora pega os blocos de dados dos discos 1, 2 e 3 em paralelo: A1, A2 e A3. A paridade P1 fica quieta, só serve se algo faltar. Como ela gira, ao longo do arquivo todos os discos trabalham. Leitura em torno de ×3.',
        raid6: 'Mesma ideia do RAID 5: A1, A2 e A3 chegam em paralelo e P e Q ficam quietos, de reserva. Leitura em torno de ×3.',
        raid10: 'A controladora lê de qualquer cópia: A1 do D1, A2 do D3, A3 do D2 e A4 do D4. Os quatro discos entregam ao mesmo tempo: leitura ×4.' },
      look: { all: 'Os discos acesos mandam luz para a controladora e os blocos voltam para a faixa do arquivo.', raid5: 'O cubo dourado de paridade fica apagado: ler não usa P.', raid6: 'Os cubos dourado e roxo ficam apagados: ler não usa P nem Q.' },
      key: { raid0: 'Leitura em paralelo: quanto mais discos, mais blocos por segundo.', raid1: 'Espelho: lê de um ou do outro, a leitura escala com as cópias.', raid5: 'Ler não paga paridade. Só escrever paga.', raid6: 'Ler não paga paridade. Só escrever paga.', raid10: 'Cada par entrega um bloco: leitura ×4.' } },
    fail: { title: { all: 'Numa noite, um disco queima' },
      story: { raid0: 'Passa a noite e o disco 2 queima: o LED fica vermelho e ele para de responder. O D2 guardava A2 e A6. A controladora percebe na hora. A pergunta é: o pedidos.db ainda existe?',
        raid1: 'Passa a noite e o disco 2 queima: o LED fica vermelho e ele para de responder. O D2 guardava A1 e A2, mas o D1 tem os mesmos. A pergunta é: o pedidos.db ainda existe?',
        raid5: 'Passa a noite e o disco 2 queima: o LED fica vermelho e ele para de responder. O D2 guardava A2 e A5. A pergunta é: o pedidos.db ainda existe?',
        raid6: 'Passa a noite e o disco 2 queima: o LED fica vermelho e ele para de responder. O D2 guardava A2 e A5; sobram 4 discos, com P e Q. A pergunta é: o pedidos.db ainda existe?',
        raid10: 'Passa a noite e o disco 2 queima: o LED fica vermelho e ele para de responder. O D2 guardava A1 e A3, e o par dele, o D1, tem os mesmos. A pergunta é: o pedidos.db ainda existe?' },
      look: { all: 'O D2 escurece, o LED fica vermelho e os cubos dentro dele ficam vermelhos.' },
      key: { all: 'Disco falhar não é "se", é "quando". RAID é o plano para esse dia.' } },
    result: { title: { raid0: 'Resultado: o arquivo tem buracos', raid1: 'Resultado: o espelho salva o dado', raid5: 'Resultado: a paridade refaz o bloco', raid6: 'Resultado: a paridade refaz o bloco', raid10: 'Resultado: o par espelhado salva o dado' },
      story: { raid0: 'O RAID 0 não guarda nada além dos próprios blocos. A2 e A6 estavam só no D2, então sumiram, e o pedidos.db fica com buracos: o arquivo não abre. Perder um disco é perder tudo. Só um backup salva.',
        raid1: 'O espelho funciona: todo bloco do D2 também está no D1. A controladora passa a ler tudo do D1 e o servidor da loja nem percebe. O sistema segue sem redundância até trocar o disco.',
        raid5: 'A paridade entra em ação. Para refazer o A2, a controladora faz o XOR dos outros da faixa: P1 ⊕ A1 ⊕ A3 = 1000 ⊕ 1011 ⊕ 0101 = 0110, igualzinho ao A2. O A5 sai do mesmo jeito. O arquivo está completo, só mais lento (modo degradado).',
        raid6: 'Perdeu um disco, o RAID 6 faz o mesmo que o RAID 5: P1 ⊕ A1 ⊕ A3 = 0110, que é o A2. E ainda sobra o Q: se um segundo disco morrer, o Q ajuda a refazer os dois.',
        raid10: 'O par espelhado salva: A1 e A3 também estão no D1, então a controladora lê dali. Os outros pares nem notam. A leitura continua rápida, mas esse par agora tem uma cópia só.' },
      look: { raid0: 'Duas casas com ✕ na faixa do arquivo: A2 e A6 sumiram.', raid1: 'A luz sai só do D1.', raid5: 'Dois cubos novos surgem sobre a controladora: A2 e A5, recalculados. As luzes saem dos outros discos.', raid6: 'Dois cubos novos surgem sobre a controladora: A2 e A5, recalculados. As luzes saem dos outros discos.', raid10: 'As luzes saem dos discos 1, 3 e 4.' },
      key: { raid0: 'RAID 0 não tem redundância: um disco a menos é arquivo a menos.', raid1: 'Espelho: a cópia assume sem pausa.', raid5: 'XOR é reversível: P ⊕ os outros = o que faltava.', raid6: 'Com P e Q, até dois discos podem sumir.', raid10: 'Cada par tolera um disco; os dois do mesmo par, não.' } },
    fail2: { title: { all: 'Um segundo disco queima', raid0: 'Não chega a haver segunda falha' },
      story: { raid0: 'No RAID 0 não chega a haver segunda falha: o pedidos.db já foi perdido quando o D2 queimou, e os outros discos não mudam isso. Nos outros níveis é aqui que as diferenças aparecem.',
        raid1: 'A loja ainda não trocou o D2. Então o D1 queima também. Os dois guardavam A1 e A2, e não existe uma terceira cópia: o pedidos.db se perdeu. O espelho aguenta 1 disco, e o segundo é demais.',
        raid5: 'A loja ainda espera o disco novo do D2 (na vida real, a segunda falha costuma vir no rebuild, quando todos os discos trabalham no limite). Então o D4 queima. Na faixa 1 faltam A2 e P1: a conta seria A2 = P1 ⊕ A1 ⊕ A3, mas o P1 sumiu junto. O pedidos.db está perdido.',
        raid6: 'O D2 ainda está fora e o D4 queima também. Em cada faixa faltam dois blocos, mas existem duas contas. Na faixa 1 faltam A2 e P1: o Q1 (com A1 e A3) devolve o A2, e com ele o P1 se recalcula. Na faixa 2 faltam A5 e Q2: o P2 refaz o A5, e o Q2 se recalcula.',
        raid10: () => pair === 'same'
          ? 'O D2 ainda está fora e o D1, o par dele, queima. O par 1 inteiro se foi: A1 e A3 só existiam ali. O par 2 está intacto, com A2 e A4, então o arquivo perde metade dos blocos: os que cabiam ao par 1.'
          : 'O D2 ainda está fora e o D3 queima, no outro par. Cada par ainda tem um disco vivo: o D1 guarda A1 e A3, o D4 guarda A2 e A4. O arquivo está inteiro, só sem nenhuma folga.' },
      look: { raid0: 'Nada novo se acende: o D2 continua escuro e a faixa do arquivo continua com A2 e A6 em ✕.',
        raid1: 'O D1 escurece e fica vermelho como o D2. Na faixa do arquivo, A1 e A2 viram ✕.',
        raid5: 'O D4 escurece e o LED fica vermelho. Os cubos A2 e A5 ficam vermelhos: sem como refazer. Na faixa do arquivo, A2, A5 e A6 viram ✕.',
        raid6: 'D2 e D4 escuros. A2 e A5 continuam sobre a controladora, refeitos, e as luzes saem do D1, D3 e D5.',
        raid10: () => pair === 'same' ? 'D1 e D2 escuros. As luzes saem só do D3 e do D4, e A1 e A3 viram ✕ na faixa do arquivo.' : 'D2 e D3 escuros. As luzes saem do D1 e do D4, um de cada par.' },
      key: { raid0: 'RAID 0 não tem folga: a primeira falha já é a última.',
        raid1: 'Espelho aguenta 1 disco: com os dois fora, a cópia acabou.',
        raid5: 'O XOR resolve uma incógnita por faixa. Com duas, a conta não fecha.',
        raid6: 'Duas paridades, duas equações: dois blocos faltando ainda se resolvem.',
        raid10: () => pair === 'same' ? 'Os dois discos do mesmo par: o par perde tudo.' : 'Um disco vivo por par é o limite: assim sobrevive.' } },
    rebuild: { title: { all: 'Disco novo e rebuild', raid0: 'Disco novo: não há o que reconstruir', raid1: 'Discos novos: não há de onde copiar', raid5: 'Discos novos: não há o que recalcular', raid6: 'Dois discos novos e rebuild', raid10: () => pair === 'same' ? 'Discos novos: o par 1 não volta' : 'Dois discos novos e rebuild' },
      story: { raid0: 'A loja troca o disco 2 por um novo. Mas ele entra vazio: não há de onde reconstruir A2 e A6. O arquivo precisa ser restaurado do backup. O RAID 0 não tem rebuild.',
        raid1: 'A loja troca o D1 e o D2. Os dois entram vazios: sem nenhuma cópia viva, não há de onde copiar. O pedidos.db só volta do backup. O rebuild do RAID 1 só funciona enquanto um dos discos sobrevive.',
        raid5: 'A loja troca o D2 e o D4. Os dois entram vazios: o rebuild refaz um disco que falta por faixa, e aqui faltavam dois. O pedidos.db só volta do backup. Por isso a janela do rebuild é o risco do RAID 5.',
        raid6: 'Troca o D2 e o D4. O rebuild lê os outros 3 discos e recalcula, faixa por faixa, os blocos dos dois novos, com P e Q. Demora e os discos vivos trabalham no limite: um terceiro disco falhar agora seria o fim.',
        raid10: () => pair === 'same'
          ? 'A loja troca o D1 e o D2. Os dois entram vazios: o par 1 inteiro se foi, então A1 e A3 só voltam do backup. O par 2 segue intacto, com A2 e A4.'
          : 'Troca o D2 e o D3. Cada disco novo copia o seu par, sem conta nenhuma: o D2 vem do D1 e o D3 vem do D4. Os dois pares se refazem ao mesmo tempo, rápido e leve. Até terminar, cada par tem uma cópia só.' },
      look: { all: 'As gavetas velhas saem, as novas entram com LED âmbar, e a barra mostra o avanço. As luzes mostram quem trabalha.', raid0: 'A gaveta nova entra vazia e fica assim.', raid1: 'As gavetas novas entram vazias e ficam assim: nenhuma luz, nada para copiar.', raid5: 'As gavetas novas entram vazias e ficam assim: nenhuma luz, nada para ler.', raid10: () => pair === 'same' ? 'As gavetas do par 1 entram vazias; o D3 e o D4 ficam como estavam.' : 'As gavetas novas entram com LED âmbar. A luz sobe do D1 para o D2 e do D4 para o D3.' },
      key: { raid0: 'Sem redundância, não há o que reconstruir.', raid1: 'Rebuild precisa de pelo menos uma cópia viva.', raid5: 'Rebuild refaz um disco por vez: dois fora na mesma faixa é perda.', raid6: 'Com dois discos fora, o RAID 6 reconstrói, mas sem folga.', raid10: () => pair === 'same' ? 'Rebuild de espelho precisa de uma cópia viva: sem ela, só backup.' : 'Rebuild de espelho é cópia simples, e cada par se refaz sozinho.' } },
    sum: { title: { all: 'Resumo do ' },
      story: { raid0: 'RAID 0: 4 × 1 TB = 4 TB úteis, leitura e escrita ×4, tolerância zero. Use para dado que dá para refazer (cache, vídeo em edição, temporários). Não use para nada que não possa ser perdido.',
        raid1: 'RAID 1: 2 × 1 TB = 1 TB útil, leitura ×2, escrita ×1, tolera 1 disco. Use para sistema operacional e bancos pequenos, onde simples e seguro importa. Não use quando precisar de muita capacidade: metade vira cópia.',
        raid5: 'RAID 5: 4 × 1 TB = 3 TB úteis, tolera 1 disco, leitura ×3, mas cada escrita pequena custa 4 I/Os. Use para leitura pesada com boa capacidade (arquivos, backups). Não use com discos muito grandes (rebuild longo e arriscado) nem com muita escrita aleatória (banco).',
        raid6: 'RAID 6: 5 × 1 TB = 3 TB úteis, tolera 2 discos, escrita pequena custa 6 I/Os. Use para discos grandes e dado que importa, onde o rebuild é longo. Não use com muita escrita aleatória.',
        raid10: 'RAID 10: 4 × 1 TB = 2 TB úteis, leitura ×4, escrita ×2, só 2 I/Os por escrita e rebuild rápido. Use para banco de dados e carga com muita escrita. Não use se capacidade barata é a prioridade: metade vira cópia.' },
      look: { all: 'O mostrador ao fundo traz os números do nível. No painel, a tabela compara os cinco.' },
      key: { raid0: 'RAID 0: velocidade sem proteção.', raid1: 'RAID 1: segurança simples, metade da capacidade.', raid5: 'RAID 5: capacidade e proteção, escrita cara.', raid6: 'RAID 6: aguenta dois discos, escrita ainda mais cara.', raid10: 'RAID 10: velocidade e segurança por metade da capacidade.' } },
  };
  const titleOf = () => { const s = STEPS[cur()]; return cur() === 'sum' ? 'Resumo do ' + SCNAME[sc] : val(s.title[sc] ?? s.title.all); };

  // dados do passo
  const layHtml = () => { const l = L(), bad = failedSet();
    return `<table class="h3-sum r3-lay"><tr><th>faixa</th>${Array.from({ length: l.n }, (_, i) => `<th class="${bad.has(i) ? 'r3-bad' : ''}">D${i + 1}</th>`).join('')}</tr>` +
      l.rows.map((row, r) => `<tr><td>${r + 1}</td>${row.map((lab, i) => `<td class="${KIND(lab) === 'p' ? 'r3-p' : KIND(lab) === 'q' ? 'r3-q' : ''} ${bad.has(i) ? 'r3-bad' : ''}">${lab}</td>`).join('')}</tr>`).join('') + '</table>'; };
  const XOR1 = '  1011  A1\n⊕ 0110  A2\n⊕ 0101  A3\n= 1000  P1';
  const XOR2 = '  1100  A4\n⊕ 0011  A5\n⊕ 1001  A6\n= 0110  P2';
  const REC1 = '  1000  P1\n⊕ 1011  A1\n⊕ 0101  A3\n= 0110  A2 ✓';
  const REC2 = '  0110  P2\n⊕ 1100  A4\n⊕ 1001  A6\n= 0011  A5 ✓';
  const PENL = { raid0: 'Escrita pequena: 1 I/O (grava o bloco e pronto).', raid1: 'Escrita pequena: 2 I/Os (grava nos dois discos).', raid5: 'Escrita pequena: 4 I/Os (lê o bloco antigo, lê a paridade antiga, grava o bloco novo, grava a paridade nova). P novo = P antigo ⊕ A antigo ⊕ A novo.', raid6: 'Escrita pequena: 6 I/Os (lê bloco, P e Q antigos; grava bloco, P e Q novos).', raid10: 'Escrita pequena: 2 I/Os (grava nos dois discos do par).' };
  const X_EX = '<li class="h3-dim">Bits, nomes dos blocos e 4 discos de 1 TB são exemplos didáticos. Velocidades são relativas a um disco só.</li>';
  const DATA = {
    arrive: () => `<li>Arquivo: <b>pedidos.db</b>, cortado em <b>${L().file}</b> blocos (A1…A${L().file})</li><li>Controladora: <b>${SCNAME[sc]}</b> com <b>${ND()}</b> discos de 1 TB</li><li>Capacidade útil: <b>${ST().use}</b> de ${ST().of}</li>${X_EX}`,
    write: () => layHtml() + (PAR() ? `<pre class="r3-xor">${XOR1}\n\n${XOR2}${sc === 'raid6' ? '\n\nQ = outra conta (Reed-Solomon), sem bits simples' : ''}</pre>` : '') + `<li>${PENL[sc]}</li>`,
    read: () => layHtml() + `<li>Leitura: <b>${ST().rd}</b> · escrita: <b>${ST().wr}</b> (relativo a um disco)</li><li>${{ raid0: 'Lê D1, D2, D3 e D4 juntos.', raid1: 'A1 do D1 e A2 do D2, ao mesmo tempo.', raid5: 'Lê os 3 blocos de dados da faixa; P1 não é lido.', raid6: 'Lê os 3 blocos de dados; P e Q não são lidos.', raid10: 'A1 (D1), A2 (D3), A3 (D2), A4 (D4).' }[sc]}</li>`,
    fail: () => layHtml() + `<li>Disco 2 (D2): <b>${failedSet().has(F) ? 'FALHOU' : 'ok'}</b></li><li>Tolerância do ${SCNAME[sc]}: <b>${ST().tol}</b></li>`,
    result: () => layHtml() + ({ raid0: '<li>Blocos perdidos: <b>A2 e A6</b> (só existiam no D2).</li><li>Sem cópia e sem paridade: restaurar do backup.</li>',
      raid1: '<li>Tudo é lido do <b>D1</b>: o bloco A1 e o A2 estão lá.</li>',
      raid5: `<pre class="r3-xor">${REC1}\n\n${REC2}</pre>`, raid6: `<pre class="r3-xor">${REC1}\n\n${REC2}</pre><li>O Q segue de reserva para uma segunda falha.</li>`,
      raid10: '<li>A1 e A3 são lidos do <b>D1</b> (par do D2). A2 vem do D3 e A4 do D4.</li><li>Se o D1 também falhar, A1 e A3 estão perdidos.</li>' })[sc],
    fail2: () => layHtml() + ({ raid0: '<li>Tolerância do RAID 0: <b>0 discos</b>. Nada a somar: o arquivo já se perdeu na primeira falha.</li>',
      raid1: '<li>Discos fora: <b>D1 e D2</b> (2 de 1 tolerado)</li><li>Blocos perdidos: <b>A1 e A2</b>, sem nenhuma cópia.</li>',
      raid5: `<pre class="r3-xor">  ????  P1 (estava no D4)\n⊕ 1011  A1\n⊕ 0101  A3\n= ????  A2 ✗ duas incógnitas</pre><li>Discos fora: <b>D2 e D4</b> (2 de 1 tolerado)</li><li>Faixa 2: A5 e A6 faltam juntos, e o P2 sozinho não refaz os dois.</li>`,
      raid6: `<pre class="r3-xor">faixa 1 (faltam A2 e P1)\n  Q1 com A1 e A3 → A2 = 0110 ✓\n  1011 ⊕ 0110 ⊕ 0101 = 1000  P1 ✓\n\nfaixa 2 (faltam A5 e Q2)\n  0110 ⊕ 1100 ⊕ 1001 = 0011  A5 ✓\n  Q2 recalculado com A4, A5, A6 ✓</pre><li>Discos fora: <b>D2 e D4</b> (2 de 2 tolerados). O Q usa outra conta (Reed-Solomon), por isso resolve o que o XOR sozinho não resolve.</li>`,
      raid10: pair === 'same'
        ? '<li>Discos fora: <b>D1 e D2</b>, o par 1 inteiro (2 de 1 tolerado no par).</li><li>Perdidos: <b>A1 e A3</b>, metade do arquivo.</li><li>A2 e A4 seguem nos <b>D3 e D4</b>, mas o arquivo não abre inteiro.</li>'
        : '<li>Discos fora: <b>D2</b> (par 1) e <b>D3</b> (par 2): 1 por par.</li><li>O <b>D1</b> guarda A1 e A3; o <b>D4</b> guarda A2 e A4: arquivo inteiro.</li><li>Sem folga: mais um disco fora e algum par se perde.</li>' })[sc],
    rebuild: () => { const p = RBprog(), em = EMPTYRB(); return layHtml() + `<li>Progresso: <b>${em ? 'não há rebuild' : Math.round(p * 100) + '%'}</b></li><li>${{ raid0: 'Disco novo vazio: A2 e A6 só voltam do backup.', raid1: 'D1 e D2 novos e vazios: A1 e A2 só voltam do backup.', raid5: 'D2 e D4 novos e vazios: o pedidos.db só volta do backup.', raid6: 'Lê D1, D3 e D5 e recalcula D2 e D4 com P e Q. Um terceiro disco falhar agora = arquivo perdido.', raid10: pair === 'same' ? 'D1 e D2 novos e vazios: A1 e A3 só voltam do backup. O par 2 segue intacto.' : 'D2 copia o D1 e D3 copia o D4. Se o D1 ou o D4 falhar agora, aquele par se perde.' }[sc]}</li>`; },
    sum: () => `<table class="h3-sum"><tr><th>nível</th><th>discos</th><th>útil</th><th>tolera</th><th>leitura</th><th>escrita</th><th>I/Os</th></tr>${SC.map(k => { const s = STAT[k]; return `<tr${k === sc ? ' style="color:var(--ink);font-weight:600"' : ''}><td>${SCNAME[k]}</td><td>${s.disks}</td><td>${s.use}</td><td>${s.tol}</td><td>${s.rd}</td><td>${s.wr}</td><td>${s.pen}</td></tr>`; }).join('')}</table><li>I/Os = custo de uma escrita pequena.</li><li><b>RAID não é backup:</b> apagar o arquivo sem querer apaga em todos os discos.</li>${X_EX}`,
  };
  function nowHtml() { return DATA[cur()](); }
  const pairHtml = () => sc === 'raid10' && (cur() === 'fail2' || cur() === 'rebuild')
    ? `<div class="o3-mode o3-pair" role="group" aria-label="Qual disco queima junto com o D2">${[['other', 'Outro par (D3)'], ['same', 'Mesmo par (D1)']].map(([v, n]) => `<button data-pair="${v}" aria-pressed="${v === pair}">${n}</button>`).join('')}</div>` : '';
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Nível de RAID">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${titleOf()}</h2>${pairHtml()}
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${pick(s.look)}</p>
      <p class="o3-key"><b>Em uma frase</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now" id="raidnow">${nowHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + (AULA[sc] || 'aula-13-resumo-raid')); };
  function readout() { if (active !== 'raid') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${status()[0].toLowerCase()}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'raid' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; keys.clear(); render(); SFX.bit(1); return true; }
  const GOID = { ctl: 'write', stat: 'sum' };
  const goId = id => { const w = GOID[id] || (/^d\d$/.test(id) ? 'fail' : null); const i = IDS.indexOf(w); return go(i >= 0 ? i : step); };
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-raid3d-sc', v); } catch (e) {} WT = wTimes(); backLink(); return go(step); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const setPair = v => { pair = v; lt = 0; dwell = 0; followT = 0; keys.clear(); render(); SFX.bit(1); return true; };
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'raid') setSc(b.dataset.sc);
    const pb = e.target.closest('[data-pair]'); if (pb && active === 'raid') setPair(pb.dataset.pair); });
  backLink();

  // ── um quadro da cena ──
  const AT = { ctl: [215, 300, 12], dsk: [430, 268, 22], w: [430, 268, 22] };
  function scene3() {
    const id = cur(), t = lt, l = L(), n = l.n, rows = l.rows;
    // discos e baias
    const act = [];
    DISK.forEach((D, i) => {
      D.g.visible = i < n; if (i >= n) return;
      const d = diskInfo(i); D.g.visible = d.vis; D.g.position.copy(W(...d.off));
      const k = d.st === 'fail' ? 0.38 : 1; D.mat.color.copy(bodyMat.color).multiplyScalar(k);
      const blink = Math.sin(t * (d.st === 'new' ? 9 : 6)) > 0;
      const col = d.st === 'fail' ? ledBad : d.st === 'ok' ? ledOk : ledAmb;
      D.led.color.copy(col); D.glow.material.uniforms.color.value.copy(col);
      let inten = d.st === 'fail' ? (blink ? 0.9 : 0.2) : d.st === 'ok' ? 0.55 : blink ? 1 : 0.3;
      D.led.color.multiplyScalar(d.st === 'fail' ? (blink ? 1 : 0.35) : 1);
      D.glow.material.uniforms.intensity.value = inten * (d.vis ? 1 : 0);
      drawDiskTop(i); drawDiskFront(i, d); act[i] = d;
    });
    // cubos
    const live = new Set();
    CUB.forEach((pair, i) => pair.forEach((c, r) => {
      if (i >= n) { c.g.visible = false; return; }
      const cs = cellState(i, r), d = act[i], base = cellC(i, r);
      const dis = d.off;
      if (!cs.vis || !d.vis) { c.g.visible = false; return; }
      let p = [base[0] + dis[0], base[1] + dis[1], DT + dis[2]], sc_ = 1;
      if (id === 'write' && cs.f < 1) { const w = cs.w, e = ease(cs.f); p = lerp3(w.from, [base[0], base[1], DT], e); p[2] += Math.sin(e * Math.PI) * 70; sc_ = 0.6 + 0.4 * e; }
      drawCube(c, cs.lab, cs.lost ? 'lost' : cs.lit ? 'lit' : 'norm');
      setCube(c, p, sc_, true);
      if (id === 'write' && cs.f > 0 && cs.f < 1.0 + 0.3 / 1.3 && cs.f >= 1) act[i].flash = true;
    }));
    // cubos soltos: arquivo chegando e blocos recalculados
    if (id === 'arrive' && t < 2.0) { const f = ease(clamp(t / 1.6)); drawCube(FILEC, 'pedidos.db', 'lit'); setCube(FILEC, lerp3([-70, 200, 80], [79, 201, 78], f), 1.3, true); } else FILEC.g.visible = false;
    RECC.forEach((c, k) => { const rs = id === 'result' && PAR() && t > 1.4 ? 'lit' : id === 'fail2' && sc === 'raid6' ? 'lit' : id === 'fail2' && sc === 'raid5' ? (t < 0.8 ? 'lit' : 'lost') : null;
      if (!rs) { c.g.visible = false; return; }
      const f = id === 'fail2' ? 1 : ease(clamp((t - 1.4) / 0.8)); drawCube(c, REC[sc][k], rs); setCube(c, [58 + k * 42, 201, 80 + 10 * Math.sin(t * 2 + k)], 0.7 + 0.3 * f, true); });
    // pontos de luz
    let nd = 0; const lit = new Set();
    const bead = (path, g, k = 1.3) => { const d = DOTS[nd++]; if (d) place(d, alongPts(path.pts, path.cum, g), k); };
    if (id === 'read') { READ[sc].forEach(([i], j) => { lit.add(i); const f = clamp((t - 0.5 - 0.08 * j) / 1.6); if (f > 0 && f < 1) bead(PATHS[i], 1 - ease(f)); }); }
    if (id === 'result') { const seen = new Set(); SURV[sc].forEach(([i]) => { if (seen.has(i)) return; seen.add(i); lit.add(i); const f = clamp((t - 0.4 - 0.1 * seen.size) / 1.6); if (f > 0 && f < 1) bead(PATHS[i], 1 - ease(f)); }); }
    if (id === 'fail2') { const seen = new Set(); SURV2().forEach(([i]) => { if (seen.has(i)) return; seen.add(i); lit.add(i); const f = clamp((t - 1.8 - 0.1 * seen.size) / 1.6); if (f > 0 && f < 1) bead(PATHS[i], 1 - ease(f)); }); }
    if (id === 'rebuild' && !EMPTYRB() && t > 2.4 && RBprog() < 1) { const seen = new Set(); SURV2().forEach(([i]) => { if (seen.has(i)) return; seen.add(i); lit.add(i);
      TG().forEach((T, j) => { if (sc === 'raid10' && (i >> 1) !== (T >> 1)) return; lit.add(T); const f = ((t - 2.4) * 0.5 + seen.size * 0.13 + j * 0.07) % 1; bead(rbp(i, T), f); }); }); }
    if (id === 'write') rows.forEach((row, r) => row.forEach((lab, i) => { const w = WT[i][r], f = (t - w.st) / w.dur; if (f > 0.95 && f < 1.5) lit.add(i); }));
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    PATHS.forEach((P, i) => { P.dim.visible = i < n; P.lit.visible = i < n && lit.has(i); });
    // telas fixas
    drawCtlFront(); drawStrip(stripCells()); drawStat();
    // balões
    let q = null, w2 = null;
    if (id === 'arrive' && t > 1.6) q = ['ctl', ['pedidos.db chegou', 'acc', `${l.file} blocos · A1 … A${l.file}`]];
    if (id === 'write') { const R = rows.length, rT = ROWT();
      if (t < R * rT) { const r = Math.min(R - 1, Math.floor(t / rT)), lt2 = t - r * rT, T = {
        raid0: [['faixa 1 · striping', 'A1→D1 · A2→D2 · A3→D3 · A4→D4'], ['faixa 2 · striping', 'A5→D1 · A6→D2 · A7→D3 · A8→D4']],
        raid1: [['A1 → D1 e D2', 'o mesmo bloco, dois discos'], ['A2 → D1 e D2', 'o mesmo bloco, dois discos']],
        raid5: [lt2 < 1.6 ? ['P1 = A1 ⊕ A2 ⊕ A3', '1011 ⊕ 0110 ⊕ 0101 = 1000'] : ['P1 → D4', 'paridade da faixa 1 no disco 4'], lt2 < 1.6 ? ['P2 = A4 ⊕ A5 ⊕ A6', '1100 ⊕ 0011 ⊕ 1001 = 0110'] : ['P2 → D3', 'a paridade girou: faixa 2 no disco 3']],
        raid6: [lt2 < 1.6 ? ['P1 = A1 ⊕ A2 ⊕ A3 = 1000', 'Q1 = outra conta (Reed-Solomon)'] : ['P1 → D4 · Q1 → D5', 'duas paridades na faixa 1'], lt2 < 1.6 ? ['P2 = A4 ⊕ A5 ⊕ A6 = 0110', 'Q2 = outra conta (Reed-Solomon)'] : ['P2 → D3 · Q2 → D4', 'P e Q giraram']],
        raid10: [['A1 → par 1 (D1 e D2)', 'A2 → par 2 (D3 e D4)'], ['A3 → par 1 (D1 e D2)', 'A4 → par 2 (D3 e D4)']] }[sc][r];
        q = ['ctl', [T[0], 'acc', T[1]]]; }
      else w2 = ['dsk', [{ raid0: 'gravado: um bloco em cada disco', raid1: 'gravado: cópia idêntica nos 2 discos', raid5: 'gravado: dados + paridade girando', raid6: 'gravado: dados + P + Q girando', raid10: 'gravado: pares espelhados' }[sc], 'acc', `${ST().use} úteis de ${ST().of}`]]; }
    if (id === 'read' && t > 0.5) w2 = ['dsk', [{ raid0: 'lê D1 D2 D3 D4 juntos · ×4', raid1: 'A1 do D1 e A2 do D2 · ×2', raid5: 'lê A1 A2 A3 juntos · P1 fica quieto', raid6: 'lê A1 A2 A3 juntos · P e Q quietos', raid10: 'lê os 4 discos juntos · ×4' }[sc], 'acc', 'cada disco entrega um bloco ao mesmo tempo']];
    if (id === 'fail' && t >= 0.8) w2 = ['dsk', ['☠ D2 queimou', 'bad', 'LED vermelho · o disco para de responder']];
    if (id === 'fail2') { const f2 = F2(), dn = f2 == null ? '' : 'D' + (f2 + 1);
      if (sc === 'raid0') w2 = ['dsk', ['sem segunda falha', 'bad', 'o arquivo já foi perdido na primeira']];
      else if (t >= 2.0) {
        if (sc === 'raid1') w2 = ['dsk', ['arquivo perdido', 'bad', 'D1 e D2 queimados: só o backup salva']];
        else if (sc === 'raid5') { w2 = ['dsk', ['arquivo perdido', 'bad', 'A2, A5 e A6 sem como refazer']]; if (t > 2.4) q = ['ctl', ['A2 = P1 ⊕ A1 ⊕ A3 ?', 'bad', 'P1 estava no D4, que queimou:\n2 incógnitas, 1 equação ✗']]; }
        else if (sc === 'raid6') { w2 = ['dsk', ['2 de 2 usadas', 'acc', 'sem folga: um terceiro disco seria o fim']]; q = ['ctl', ['2 discos fora, 2 contas', 'acc', 'faixa 1: A2 pelo Q1, P1 = 1000 ✓\nfaixa 2: A5 = P2⊕A4⊕A6 = 0011 ✓']]; }
        else if (pair === 'same') w2 = ['dsk', ['par 1 inteiro fora', 'bad', 'A1 e A3 perdidos · A2 e A4 vivos']];
        else w2 = ['dsk', ['um vivo em cada par', 'acc', 'D1 e D4 seguram o arquivo inteiro']]; }
      else if (t >= 0.8) w2 = ['dsk', [`☠ ${dn} queimou também`, 'bad', 'LED vermelho · segundo disco fora']]; }
    if (id === 'result') { if (sc === 'raid0') q = ['ctl', ['✕ A2 e A6 sumiram', 'bad', 'sem cópia e sem paridade:\no arquivo está perdido']];
      else if (PAR() && t > 1.4) q = ['ctl', ['A2 = P1 ⊕ A1 ⊕ A3', 'acc', '1000 ⊕ 1011 ⊕ 0101 = 0110 ✓\nA5 = P2 ⊕ A4 ⊕ A6 = 0011 ✓']];
      else if (sc === 'raid1') w2 = ['dsk', ['lê tudo do D1', 'acc', 'a cópia assume sem pausa']];
      else if (sc === 'raid10') w2 = ['dsk', ['lê A1 e A3 do D1', 'acc', 'o par do D2 tem cópia de tudo']]; }
    if (id === 'rebuild') { const p = RBprog(), dn = TG().map(x => 'D' + (x + 1)).join(' e ');
      if (t < 1.3) w2 = ['dsk', [TG().length > 1 ? `troca as gavetas do ${dn}` : 'troca a gaveta do D2', 'hi', TG().length > 1 ? 'saem os discos queimados' : 'sai o disco queimado']];
      else if (EMPTYRB()) w2 = ['dsk', [TG().length > 1 ? 'discos novos vazios' : 'disco novo vazio', 'bad', 'não há de onde reconstruir:\nrestaurar do backup']];
      else if (p < 1) w2 = ['dsk', [`rebuild ${Math.round(p * 100)}%`, 'acc', sc === 'raid6' ? '⚠ sem folga: mais um disco fora = arquivo perdido' : sc === 'raid10' ? 'cada disco novo copia o seu par' : '⚠ outro disco falhar agora = arquivo perdido']];
      else w2 = ['dsk', ['rebuild completo', 'acc', TG().length > 1 ? 'os discos novos voltaram a ter os blocos' : 'o D2 novo voltou a ter os blocos dele']]; }
    if (id === 'sum') w2 = ['dsk', [`${SCNAME[sc]}: ${ST().use} úteis`, 'acc', `tolera ${ST().tol} · escrita pequena ${ST().pen}`]];
    const at = k => AT[k];
    if (q) tQ.set(q[1][2] ? `${q[1][0]}\n${q[1][2]}` : q[1][0], q[1][1]).at(...at(q[0])); else tQ.hide();
    if (w2) tW.set(w2[1][2] ? `${w2[1][0]}\n${w2[1][2]}` : w2[1][0], w2[1][1]).at(...at(w2[0])); else tW.hide();
    tCtl.hide();
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > DUR() + 3) lt = 0;
    scene3();
    if (now - nowAt > 250) { nowAt = now; const el = document.getElementById('raidnow'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = mob ? [300, 150, 110] : [320, 150, 60];
      const want = W(f[0] + (mob ? -10 : -215), f[1], f[2] + (mob ? (innerWidth < 640 ? -300 : -250) : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, DUR() + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if ((e.key === 'p' || e.key === 'P') && sc === 'raid10') return setPair(pair === 'same' ? 'other' : 'same');
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); keys.clear(); [...CUB.flat(), ...RECC, FILEC].forEach(c => c.key = ''); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar nível', 'C', cycleSc], ['Trocar par (RAID 10)', 'P', () => sc === 'raid10' && setPair(pair === 'same' ? 'other' : 'same')]],
    view: NARROW() ? { target: W(330, 150, -150), dist: innerWidth < 640 ? 11.5 : 14.5 } : { target: W(105, 150, 60), dist: 14.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · nível: C ou 1 2 3 4 5 · arraste para girar' };
})() });
