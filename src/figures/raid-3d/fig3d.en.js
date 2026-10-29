// 3D figure (iso-glow): RAID. The store's server keeps pedidos.db on several disks.
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
    raid0: { disks: 4, use: '4 TB', of: '4 TB', frac: 1, tol: 'none', rd: '×4', wr: '×4', pen: '1 I/O' },
    raid1: { disks: 2, use: '1 TB', of: '2 TB', frac: 0.5, tol: '1 disk', rd: '×2', wr: '×1', pen: '2 I/Os' },
    raid5: { disks: 4, use: '3 TB', of: '4 TB', frac: 0.75, tol: '1 disk', rd: '×3', wr: '×3', pen: '4 I/Os' },
    raid6: { disks: 5, use: '3 TB', of: '5 TB', frac: 0.6, tol: '2 disks', rd: '×3', wr: '×3', pen: '6 I/Os' },
    raid10: { disks: 4, use: '2 TB', of: '4 TB', frac: 0.5, tol: '1 per pair', rd: '×4', wr: '×2', pen: '2 I/Os' },
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
    if (id === 'fail') { if (i === F && t >= 0.8) { o.st = 'fail'; o.sub = 'FAILED'; } }
    else if (id === 'result') { if (i === F) { o.st = 'fail'; o.sub = 'FAILED'; } }
    else if (id === 'fail2') { if (i === F || t >= 0.8) { o.st = 'fail'; o.sub = 'FAILED'; } }
    else if (id === 'rebuild') {
      if (t < 0.3) { o.st = 'fail'; o.sub = 'FAILED'; }
      else if (t < 1.2) { const f = ease((t - 0.3) / 0.9); o.st = 'fail'; o.sub = 'FAILED'; o.off = [0, 150 * f, 26 * Math.sin(f * Math.PI) + 8 * f]; }
      else if (t < 1.3) o.vis = false;
      else { const f = ease(Math.min(1, (t - 1.3) / 0.9)); o.off = [0, 150 * (1 - f), 22 * Math.sin(f * Math.PI)];
        const p = RBprog(), em = EMPTYRB(); o.st = em ? 'new' : p < 1 ? 'new' : 'ok'; o.bar = em ? 0 : p;
        o.sub = em ? 'empty' : p < 1 ? Math.round(p * 100) + '%' : 'ok'; }
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
    x.fillText(d.st === 'new' ? 'NEW ' + d.sub : d.sub === 'ok' ? (d.st === 'busy' ? 'reading…' : 'ok') : d.sub, u(3), u(17));
    if (d.bar != null) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(30), u(14.5), u(30), u(5)); x.fillStyle = acc; x.fillRect(u(30), u(14.5), u(30 * d.bar), u(5)); }
    cv.tex.needsUpdate = true;
  }
  function drawCtlFront() {
    const key = 'cf' + sc + theme; if (keys.get('cf') === key) return; keys.set('cf', key);
    const { x, P } = ctlFr, C = pal3(), u = v => v * P; bgFill(x, ctlFr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('CONTROLLER', u(4), u(8));
    x.fillStyle = theme === 'light' ? C.hi : '#' + accent.getHexString(); x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(SCNAME[sc] + ' · ' + ST().disks + ' disks', u(4), u(18)); ctlFr.tex.needsUpdate = true;
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
    x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.textAlign = 'right'; x.fillText(L().file + ' blocks', u(99), u(10)); x.textAlign = 'center';
    cells.forEach((s, k) => { const c = k % 4, r = Math.floor(k / 4), x0 = 3 + c * 25.5, y0 = 22 + r * 40, w = 24, h = 34, lab = 'A' + (k + 1);
      x.beginPath(); x.roundRect(u(x0), u(y0), u(w), u(h), u(2));
      if (s === 'empty') { x.setLineDash([u(1.4), u(1)]); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke(); x.setLineDash([]); return; }
      if (s === 'hole') { x.fillStyle = theme === 'light' ? '#f1d9d6' : '#2a1514'; x.fill(); x.strokeStyle = '#ff5a4a'; x.lineWidth = u(0.7); x.stroke();
        x.fillStyle = '#ff5a4a'; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText('✕', u(x0 + w / 2), u(y0 + 13)); x.font = `${u(5)}px ${MONO3}`; x.fillText(lab + ' lost', u(x0 + w / 2), u(y0 + 27)); return; }
      x.fillStyle = s === 'ok' ? (theme === 'light' ? '#f6ece2' : '#2a1d12') : theme === 'light' ? '#eeeeed' : '#17181a'; x.fill();
      x.strokeStyle = s === 'ok' ? acc : C.line; x.lineWidth = u(s === 'ok' ? 1 : 0.4); x.stroke();
      x.fillStyle = acc; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(lab, u(x0 + w / 2), u(y0 + 13));
      x.fillStyle = C.inkHi; x.font = `${u(6)}px ${MONO3}`; x.fillText(BITS[lab] || '', u(x0 + w / 2), u(y0 + 25)); });
    ctlTop.tex.needsUpdate = true;
  }
  const lostState = () => sc === 'raid0' ? ['DATA LOST', 'bad'] : OUT2() === 'all' ? ['FAILED', 'bad'] : OUT2() === 'half' ? ['FAILED · HALF', 'bad'] : ['DEGRADED', 'warn'];
  function status() {
    const id = cur();
    if (id === 'fail') return lt >= 0.8 ? ['DISK FAILED', 'bad'] : ['healthy', 'ok'];
    if (id === 'result') return sc === 'raid0' ? ['DATA LOST', 'bad'] : ['DEGRADED', 'warn'];
    if (id === 'fail2') return lt < 0.8 ? (sc === 'raid0' ? ['DATA LOST', 'bad'] : ['DEGRADED', 'warn']) : lostState();
    if (id === 'rebuild') { if (EMPTYRB()) return lostState(); const p = RBprog(); return lt < 1.3 ? ['DEGRADED', 'warn'] : p < 1 ? ['REBUILDING ' + Math.round(p * 100) + '%', 'warn'] : ['healthy', 'ok']; }
    return ['healthy', 'ok'];
  }
  // tolerância a falhas: quantas já foram usadas
  function tolInfo() {
    const s = ST(), id = cur(); let nf = failedSet().size;
    if (id === 'rebuild' && lt >= 1.3) nf = (EMPTYRB() || RBprog() < 1) ? TG().length : 0;
    if (!nf) return [s.tol, 'ok'];
    if (sc === 'raid0') return ['0 of 0 · lost', 'bad'];
    if (sc === 'raid6') return [nf + ' of 2 ' + 'used', 'warn'];
    if (sc === 'raid10') return nf < 2 ? ['pair 1: 1 of 1 used', 'warn'] : pair === 'same' ? ['pair 1: 2 of 1 · exceeded', 'bad'] : ['1 of 1 in each pair', 'warn'];
    return nf < 2 ? ['1 of 1 used', 'warn'] : ['2 of 1 · exceeded', 'bad'];
  }
  function drawStat() {
    const s = ST(), [stt, tone] = status(), [tolT, tolTone] = tolInfo(), key = 'ss' + sc + stt + tolT + theme + accent.getHex(); if (keys.get('stat') === key) return; keys.set('stat', key);
    const { x, P } = stScr, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, stScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(SCNAME[sc], u(5), u(10));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(s.disks + ' disks × 1 TB', u(5), u(21));
    const sc2 = tone === 'bad' ? '#ff5a4a' : tone === 'warn' ? '#ffb02e' : '#34d27b';
    x.font = `600 ${u(8)}px ${MONO3}`; x.textAlign = 'right'; x.fillStyle = sc2; x.fillText(stt, u(283), u(11));
    x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('usable capacity', u(5), u(32)); x.textAlign = 'right'; x.fillStyle = C.inkHi; x.font = `600 ${u(6.5)}px ${MONO3}`; x.fillText(`${s.use} of ${s.of}`, u(283), u(32));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(5), u(37), u(278), u(7)); x.fillStyle = acc; x.fillRect(u(5), u(37), u(278 * s.frac), u(7));
    if (s.frac < 1) { x.strokeStyle = C.ink; x.lineWidth = u(0.4); for (let k = 5 + 278 * s.frac + 3; k < 283; k += 4) { x.beginPath(); x.moveTo(u(k), u(44)); x.lineTo(u(Math.min(283, k + 4)), u(37)); x.stroke(); } }
    const cells = [['tolerates failures', tolT], ['read', s.rd], ['write', s.wr], ['small write costs', s.pen]];
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
    arrive: { title: { all: 'The file reaches the controller' },
      story: { all: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller receives it: it cuts the file into blocks (A1, A2, A3…) and decides which disk each one goes to. That decision is what changes from one RAID level to another.',
        raid0: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller cuts the file into 8 blocks (A1 to A8) and decides which disk each one goes to. Today: RAID 0, with 4 disks of 1 TB.',
        raid1: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller cuts the file into blocks (we show A1 and A2 here) and decides which disk each one goes to. Today: RAID 1, with 2 disks of 1 TB.',
        raid5: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller cuts the file into blocks (A1 to A6) and decides which disk each one goes to. Today: RAID 5, with 4 disks of 1 TB.',
        raid6: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller cuts the file into blocks (A1 to A6) and decides which disk each one goes to. Today: RAID 6, with 5 disks of 1 TB.',
        raid10: 'The store\'s server needs to save pedidos.db, the file with all the orders. The RAID controller cuts the file into blocks (A1 to A4) and decides which disk each one goes to. Today: RAID 10, with 4 disks of 1 TB.' },
      look: { all: 'The file comes in from the left and turns into blocks on the controller\'s top. The gauge at the back sums up the level.' },
      key: { all: 'RAID joins several disks to gain speed, safety or both.' } },
    write: { title: { raid0: 'Write: spread in stripes (striping)', raid1: 'Write: copy to both disks (mirror)', raid5: 'Write: spread and compute the parity', raid6: 'Write: spread and compute P and Q', raid10: 'Write: mirror in pairs and spread' },
      story: { raid0: 'In RAID 0, A1 goes to disk 1, A2 to disk 2, A3 to disk 3 and A4 to disk 4. The next stripe starts over at disk 1. Four disks write at the same time, which is why it is fast. But each block exists in one place only.',
        raid1: 'In RAID 1 each block is written to both disks at the same time: A1 on D1 and D2, then A2 on both. It is a mirror. Write speed is that of a single disk, and half the capacity becomes a copy.',
        raid5: 'In RAID 5 the blocks spread out like in RAID 0, but each stripe gets a parity block: the XOR of the data blocks. 1011 ⊕ 0110 ⊕ 0101 = 1000, and that P1 goes to disk 4. In stripe 2 the parity (P2) sits on disk 3: it rotates among the disks.',
        raid6: 'RAID 6 is RAID 5 with two parities per stripe: P (the same XOR) and Q (another calculation, Reed-Solomon). With 5 disks, each stripe has 3 data blocks, P and Q, and both rotate among the disks.',
        raid10: 'RAID 10 combines both: the disks form mirrored pairs (D1+D2 and D3+D4) and the blocks spread across the pairs. A1 goes to pair 1 and is copied on both of its disks; A2 goes to pair 2, also copied.' },
      look: { raid0: 'Cubes leave the controller and land one on each disk; on stripe 2 they repeat.', raid1: 'Each block becomes two cubes, one per disk.', raid5: 'The gold cubes are the parity P: the calculation shows in the balloon before it flies. It lands on a different disk in each stripe.', raid6: 'Gold is P, purple is Q. Both change disks on every stripe.', raid10: 'Each block becomes two cubes, only on the two disks of its pair.' },
      key: { raid0: 'Striping: spread blocks over several disks to write and read in parallel.', raid1: 'Mirror: each block exists on two disks.', raid5: 'Parity = XOR of the blocks. If one disappears, the others and P rebuild it.', raid6: 'Two parities: it survives losing two disks.', raid10: 'Mirror + stripes: fast and safe, but only half the capacity.' } },
    read: { title: { raid0: 'Read: all 4 disks deliver together', raid1: 'Read: one block from each disk', raid5: 'Read: only the data blocks', raid6: 'Read: only the data blocks', raid10: 'Read: any copy will do' },
      story: { raid0: 'Time to read the file back. All 4 disks deliver their blocks at once: A1, A2, A3 and A4 arrive together. That is why reads can reach ×4 the speed of one disk.',
        raid1: 'Both disks hold the same data, so the controller splits the work: A1 comes from D1 and A2 comes from D2, at the same time. Reads can reach ×2.',
        raid5: 'The controller fetches the data blocks from disks 1, 2 and 3 in parallel: A1, A2 and A3. Parity P1 stays quiet, used only if something is missing. Since it rotates, across the whole file every disk works. Reads around ×3.',
        raid6: 'Same idea as RAID 5: A1, A2 and A3 arrive in parallel and P and Q stay quiet, in reserve. Reads around ×3.',
        raid10: 'The controller reads from any copy: A1 from D1, A2 from D3, A3 from D2 and A4 from D4. All four disks deliver at the same time: reads ×4.' },
      look: { all: 'The lit disks send light to the controller and the blocks return to the file strip.', raid5: 'The gold parity cube stays dark: reading does not use P.', raid6: 'The gold and purple cubes stay dark: reading does not use P or Q.' },
      key: { raid0: 'Parallel reads: the more disks, the more blocks per second.', raid1: 'Mirror: reads from one or the other, so reads scale with the copies.', raid5: 'Reading does not pay for parity. Only writing does.', raid6: 'Reading does not pay for parity. Only writing does.', raid10: 'Each pair delivers a block: reads ×4.' } },
    fail: { title: { all: 'One night, a disk burns out' },
      story: { raid0: 'The night goes by and disk 2 burns out: the LED turns red and it stops responding. D2 held A2 and A6. The controller notices right away. The question is: does pedidos.db still exist?',
        raid1: 'The night goes by and disk 2 burns out: the LED turns red and it stops responding. D2 held A1 and A2, but D1 has the same ones. The question is: does pedidos.db still exist?',
        raid5: 'The night goes by and disk 2 burns out: the LED turns red and it stops responding. D2 held A2 and A5. The question is: does pedidos.db still exist?',
        raid6: 'The night goes by and disk 2 burns out: the LED turns red and it stops responding. D2 held A2 and A5; 4 disks are left, with P and Q. The question is: does pedidos.db still exist?',
        raid10: 'The night goes by and disk 2 burns out: the LED turns red and it stops responding. D2 held A1 and A3, and its pair, D1, has the same ones. The question is: does pedidos.db still exist?' },
      look: { all: 'D2 goes dark, the LED turns red and the cubes inside it turn red.' },
      key: { all: 'A disk failing is not "if", it is "when". RAID is the plan for that day.' } },
    result: { title: { raid0: 'Result: the file has holes', raid1: 'Result: the mirror saves the data', raid5: 'Result: the parity rebuilds the block', raid6: 'Result: the parity rebuilds the block', raid10: 'Result: the mirrored pair saves the data' },
      story: { raid0: 'RAID 0 keeps nothing beyond the blocks themselves. A2 and A6 were only on D2, so they are gone, and pedidos.db is left with holes: the file does not open. Losing one disk means losing everything. Only a backup saves you.',
        raid1: 'The mirror works: every block on D2 is also on D1. The controller starts reading everything from D1 and the store\'s server does not even notice. The system runs without redundancy until the disk is replaced.',
        raid5: 'The parity kicks in. To rebuild A2, the controller XORs the others in the stripe: P1 ⊕ A1 ⊕ A3 = 1000 ⊕ 1011 ⊕ 0101 = 0110, identical to A2. A5 comes out the same way. The file is complete, just slower (degraded mode).',
        raid6: 'With one disk lost, RAID 6 does the same as RAID 5: P1 ⊕ A1 ⊕ A3 = 0110, which is A2. And Q is still left: if a second disk dies, Q helps rebuild both.',
        raid10: 'The mirrored pair saves the day: A1 and A3 are also on D1, so the controller reads from there. The other pairs do not even notice. Reads stay fast, but this pair now has only one copy.' },
      look: { raid0: 'Two cells with ✕ on the file strip: A2 and A6 are gone.', raid1: 'The light comes only from D1.', raid5: 'Two new cubes appear above the controller: A2 and A5, recalculated. The lights come from the other disks.', raid6: 'Two new cubes appear above the controller: A2 and A5, recalculated. The lights come from the other disks.', raid10: 'The lights come from disks 1, 3 and 4.' },
      key: { raid0: 'RAID 0 has no redundancy: one disk less means one chunk of the file less.', raid1: 'Mirror: the copy takes over with no pause.', raid5: 'XOR is reversible: P ⊕ the others = what was missing.', raid6: 'With P and Q, even two disks can disappear.', raid10: 'Each pair tolerates one disk; both disks of the same pair, no.' } },
    fail2: { title: { all: 'A second disk burns out', raid0: 'There is no second failure to speak of' },
      story: { raid0: 'In RAID 0 there is no second failure to speak of: pedidos.db was already lost when D2 burned out, and the other disks do not change that. In the other levels, this is where the differences show.',
        raid1: 'The store has not replaced D2 yet. Then D1 burns out too. Both held A1 and A2, and there is no third copy: pedidos.db is lost. The mirror survives 1 disk, and the second is too much.',
        raid5: 'The store is still waiting for the new disk for D2 (in real life, the second failure usually comes during the rebuild, when all disks work at their limit). Then D4 burns out. In stripe 1, A2 and P1 are missing: the calculation would be A2 = P1 ⊕ A1 ⊕ A3, but P1 vanished too. pedidos.db is lost.',
        raid6: 'D2 is still out and D4 burns out too. In each stripe two blocks are missing, but there are two calculations. In stripe 1, A2 and P1 are missing: Q1 (with A1 and A3) gives back A2, and with it P1 is recalculated. In stripe 2, A5 and Q2 are missing: P2 rebuilds A5, and Q2 is recalculated.',
        raid10: () => pair === 'same'
          ? 'D2 is still out and D1, its pair, burns out. The whole of pair 1 is gone: A1 and A3 only existed there. Pair 2 is intact, with A2 and A4, so the file loses half of its blocks: the ones that belonged to pair 1.'
          : 'D2 is still out and D3 burns out, in the other pair. Each pair still has one live disk: D1 holds A1 and A3, D4 holds A2 and A4. The file is whole, just with no slack at all.' },
      look: { raid0: 'Nothing new lights up: D2 stays dark and the file strip still shows A2 and A6 with ✕.',
        raid1: 'D1 goes dark and turns red like D2. On the file strip, A1 and A2 become ✕.',
        raid5: 'D4 goes dark and the LED turns red. The A2 and A5 cubes turn red: no way to rebuild them. On the file strip, A2, A5 and A6 become ✕.',
        raid6: 'D2 and D4 dark. A2 and A5 stay above the controller, rebuilt, and the lights come from D1, D3 and D5.',
        raid10: () => pair === 'same' ? 'D1 and D2 dark. The lights come only from D3 and D4, and A1 and A3 become ✕ on the file strip.' : 'D2 and D3 dark. The lights come from D1 and D4, one from each pair.' },
      key: { raid0: 'RAID 0 has no slack: the first failure is already the last.',
        raid1: 'A mirror survives 1 disk: with both out, the copy is gone.',
        raid5: 'XOR solves one unknown per stripe. With two, the math does not close.',
        raid6: 'Two parities, two equations: two missing blocks can still be solved.',
        raid10: () => pair === 'same' ? 'Both disks of the same pair: the pair loses everything.' : 'One live disk per pair is the limit: that way it survives.' } },
    rebuild: { title: { all: 'New disk and rebuild', raid0: 'New disk: nothing to rebuild', raid1: 'New disks: nowhere to copy from', raid5: 'New disks: nothing to recalculate', raid6: 'Two new disks and rebuild', raid10: () => pair === 'same' ? 'New disks: pair 1 does not come back' : 'Two new disks and rebuild' },
      story: { raid0: 'The store replaces disk 2 with a new one. But it comes in empty: there is nowhere to rebuild A2 and A6 from. The file has to be restored from backup. RAID 0 has no rebuild.',
        raid1: 'The store replaces D1 and D2. Both come in empty: with no live copy, there is nowhere to copy from. pedidos.db only comes back from backup. RAID 1 rebuild only works while one of the disks survives.',
        raid5: 'The store replaces D2 and D4. Both come in empty: the rebuild recreates one missing disk per stripe, and here two were missing. pedidos.db only comes back from backup. That is why the rebuild window is the risk of RAID 5.',
        raid6: 'D2 and D4 are replaced. The rebuild reads the other 3 disks and recalculates, stripe by stripe, the blocks of the two new ones, with P and Q. It takes a while and the live disks work at their limit: a third disk failing now would be the end.',
        raid10: () => pair === 'same'
          ? 'The store replaces D1 and D2. Both come in empty: the whole of pair 1 is gone, so A1 and A3 only come back from backup. Pair 2 stays intact, with A2 and A4.'
          : 'D2 and D3 are replaced. Each new disk copies its pair, with no calculation at all: D2 comes from D1 and D3 comes from D4. Both pairs rebuild at the same time, fast and light. Until it finishes, each pair has only one copy.' },
      look: { all: 'The old trays come out, the new ones go in with an amber LED, and the bar shows progress. The lights show who is working.', raid0: 'The new tray goes in empty and stays that way.', raid1: 'The new trays go in empty and stay that way: no light, nothing to copy.', raid5: 'The new trays go in empty and stay that way: no light, nothing to read.', raid10: () => pair === 'same' ? 'The pair 1 trays go in empty; D3 and D4 stay as they were.' : 'The new trays go in with an amber LED. The light goes up from D1 to D2 and from D4 to D3.' },
      key: { raid0: 'Without redundancy, there is nothing to rebuild.', raid1: 'Rebuild needs at least one live copy.', raid5: 'Rebuild recreates one disk at a time: two out in the same stripe means loss.', raid6: 'With two disks out, RAID 6 rebuilds, but with no slack.', raid10: () => pair === 'same' ? 'Mirror rebuild needs a live copy: without one, only backup.' : 'Mirror rebuild is a simple copy, and each pair rebuilds on its own.' } },
    sum: { title: { all: 'Summary of ' },
      story: { raid0: 'RAID 0: 4 × 1 TB = 4 TB usable, reads and writes ×4, zero tolerance. Use it for data you can recreate (cache, video being edited, temp files). Do not use it for anything you cannot lose.',
        raid1: 'RAID 1: 2 × 1 TB = 1 TB usable, reads ×2, writes ×1, tolerates 1 disk. Use it for the operating system and small databases, where simple and safe matters. Do not use it when you need a lot of capacity: half becomes copy.',
        raid5: 'RAID 5: 4 × 1 TB = 3 TB usable, tolerates 1 disk, reads ×3, but each small write costs 4 I/Os. Use it for read-heavy loads with good capacity (files, backups). Do not use it with very large disks (long, risky rebuild) or with lots of random writes (database).',
        raid6: 'RAID 6: 5 × 1 TB = 3 TB usable, tolerates 2 disks, a small write costs 6 I/Os. Use it for large disks and data that matters, where the rebuild is long. Do not use it with lots of random writes.',
        raid10: 'RAID 10: 4 × 1 TB = 2 TB usable, reads ×4, writes ×2, only 2 I/Os per write and a fast rebuild. Use it for databases and write-heavy loads. Do not use it if cheap capacity is the priority: half becomes copy.' },
      look: { all: 'The gauge at the back shows the level\'s numbers. In the panel, the table compares all five.' },
      key: { raid0: 'RAID 0: speed without protection.', raid1: 'RAID 1: simple safety, half the capacity.', raid5: 'RAID 5: capacity and protection, expensive writes.', raid6: 'RAID 6: survives two disks, writes even more expensive.', raid10: 'RAID 10: speed and safety for half the capacity.' } },
  };
  const titleOf = () => { const s = STEPS[cur()]; return cur() === 'sum' ? 'Summary of ' + SCNAME[sc] : val(s.title[sc] ?? s.title.all); };

  // dados do passo
  const layHtml = () => { const l = L(), bad = failedSet();
    return `<table class="h3-sum r3-lay"><tr><th>stripe</th>${Array.from({ length: l.n }, (_, i) => `<th class="${bad.has(i) ? 'r3-bad' : ''}">D${i + 1}</th>`).join('')}</tr>` +
      l.rows.map((row, r) => `<tr><td>${r + 1}</td>${row.map((lab, i) => `<td class="${KIND(lab) === 'p' ? 'r3-p' : KIND(lab) === 'q' ? 'r3-q' : ''} ${bad.has(i) ? 'r3-bad' : ''}">${lab}</td>`).join('')}</tr>`).join('') + '</table>'; };
  const XOR1 = '  1011  A1\n⊕ 0110  A2\n⊕ 0101  A3\n= 1000  P1';
  const XOR2 = '  1100  A4\n⊕ 0011  A5\n⊕ 1001  A6\n= 0110  P2';
  const REC1 = '  1000  P1\n⊕ 1011  A1\n⊕ 0101  A3\n= 0110  A2 ✓';
  const REC2 = '  0110  P2\n⊕ 1100  A4\n⊕ 1001  A6\n= 0011  A5 ✓';
  const PENL = { raid0: 'Small write: 1 I/O (writes the block and done).', raid1: 'Small write: 2 I/Os (writes to both disks).', raid5: 'Small write: 4 I/Os (reads the old block, reads the old parity, writes the new block, writes the new parity). New P = old P ⊕ old A ⊕ new A.', raid6: 'Small write: 6 I/Os (reads block, old P and Q; writes block, new P and Q).', raid10: 'Small write: 2 I/Os (writes to both disks of the pair).' };
  const X_EX = '<li class="h3-dim">Bits, block names and 4 disks of 1 TB are teaching examples. Speeds are relative to a single disk.</li>';
  const DATA = {
    arrive: () => `<li>File: <b>pedidos.db</b>, cut into <b>${L().file}</b> blocks (A1…A${L().file})</li><li>Controller: <b>${SCNAME[sc]}</b> with <b>${ND()}</b> disks of 1 TB</li><li>Usable capacity: <b>${ST().use}</b> of ${ST().of}</li>${X_EX}`,
    write: () => layHtml() + (PAR() ? `<pre class="r3-xor">${XOR1}\n\n${XOR2}${sc === 'raid6' ? '\n\nQ = another calculation (Reed-Solomon), no simple bits' : ''}</pre>` : '') + `<li>${PENL[sc]}</li>`,
    read: () => layHtml() + `<li>Read: <b>${ST().rd}</b> · write: <b>${ST().wr}</b> (relative to one disk)</li><li>${{ raid0: 'Reads D1, D2, D3 and D4 together.', raid1: 'A1 from D1 and A2 from D2, at the same time.', raid5: 'Reads the 3 data blocks of the stripe; P1 is not read.', raid6: 'Reads the 3 data blocks; P and Q are not read.', raid10: 'A1 (D1), A2 (D3), A3 (D2), A4 (D4).' }[sc]}</li>`,
    fail: () => layHtml() + `<li>Disk 2 (D2): <b>${failedSet().has(F) ? 'FAILED' : 'ok'}</b></li><li>${SCNAME[sc]} tolerance: <b>${ST().tol}</b></li>`,
    result: () => layHtml() + ({ raid0: '<li>Lost blocks: <b>A2 and A6</b> (they only existed on D2).</li><li>No copy and no parity: restore from backup.</li>',
      raid1: '<li>Everything is read from <b>D1</b>: block A1 and A2 are there.</li>',
      raid5: `<pre class="r3-xor">${REC1}\n\n${REC2}</pre>`, raid6: `<pre class="r3-xor">${REC1}\n\n${REC2}</pre><li>Q stays in reserve for a second failure.</li>`,
      raid10: '<li>A1 and A3 are read from <b>D1</b> (D2\'s pair). A2 comes from D3 and A4 from D4.</li><li>If D1 fails too, A1 and A3 are lost.</li>' })[sc],
    fail2: () => layHtml() + ({ raid0: '<li>RAID 0 tolerance: <b>0 disks</b>. Nothing to add: the file was already lost on the first failure.</li>',
      raid1: '<li>Disks out: <b>D1 and D2</b> (2 out of 1 tolerated)</li><li>Lost blocks: <b>A1 and A2</b>, with no copy at all.</li>',
      raid5: `<pre class="r3-xor">  ????  P1 (was on D4)\n⊕ 1011  A1\n⊕ 0101  A3\n= ????  A2 ✗ two unknowns</pre><li>Disks out: <b>D2 and D4</b> (2 out of 1 tolerated)</li><li>Stripe 2: A5 and A6 are missing together, and P2 alone cannot rebuild both.</li>`,
      raid6: `<pre class="r3-xor">stripe 1 (A2 and P1 missing)\n  Q1 with A1 and A3 → A2 = 0110 ✓\n  1011 ⊕ 0110 ⊕ 0101 = 1000  P1 ✓\n\nstripe 2 (A5 and Q2 missing)\n  0110 ⊕ 1100 ⊕ 1001 = 0011  A5 ✓\n  Q2 recalculated with A4, A5, A6 ✓</pre><li>Disks out: <b>D2 and D4</b> (2 out of 2 tolerated). Q uses another calculation (Reed-Solomon), so it solves what XOR alone cannot.</li>`,
      raid10: pair === 'same'
        ? '<li>Disks out: <b>D1 and D2</b>, the whole of pair 1 (2 out of 1 tolerated in the pair).</li><li>Lost: <b>A1 and A3</b>, half of the file.</li><li>A2 and A4 are still on <b>D3 and D4</b>, but the file does not open whole.</li>'
        : '<li>Disks out: <b>D2</b> (pair 1) and <b>D3</b> (pair 2): 1 per pair.</li><li><b>D1</b> holds A1 and A3; <b>D4</b> holds A2 and A4: whole file.</li><li>No slack: one more disk out and some pair is lost.</li>' })[sc],
    rebuild: () => { const p = RBprog(), em = EMPTYRB(); return layHtml() + `<li>Progress: <b>${em ? 'no rebuild' : Math.round(p * 100) + '%'}</b></li><li>${{ raid0: 'New disk empty: A2 and A6 only come back from backup.', raid1: 'D1 and D2 new and empty: A1 and A2 only come back from backup.', raid5: 'D2 and D4 new and empty: pedidos.db only comes back from backup.', raid6: 'Reads D1, D3 and D5 and recalculates D2 and D4 with P and Q. A third disk failing now = file lost.', raid10: pair === 'same' ? 'D1 and D2 new and empty: A1 and A3 only come back from backup. Pair 2 stays intact.' : 'D2 copies D1 and D3 copies D4. If D1 or D4 fails now, that pair is lost.' }[sc]}</li>`; },
    sum: () => `<table class="h3-sum"><tr><th>level</th><th>disks</th><th>usable</th><th>tolerates</th><th>read</th><th>write</th><th>I/Os</th></tr>${SC.map(k => { const s = STAT[k]; return `<tr${k === sc ? ' style="color:var(--ink);font-weight:600"' : ''}><td>${SCNAME[k]}</td><td>${s.disks}</td><td>${s.use}</td><td>${s.tol}</td><td>${s.rd}</td><td>${s.wr}</td><td>${s.pen}</td></tr>`; }).join('')}</table><li>I/Os = cost of a small write.</li><li><b>RAID is not a backup:</b> deleting the file by accident deletes it on every disk.</li>${X_EX}`,
  };
  function nowHtml() { return DATA[cur()](); }
  const pairHtml = () => sc === 'raid10' && (cur() === 'fail2' || cur() === 'rebuild')
    ? `<div class="o3-mode o3-pair" role="group" aria-label="Which disk burns out along with D2">${[['other', 'Other pair (D3)'], ['same', 'Same pair (D1)']].map(([v, n]) => `<button data-pair="${v}" aria-pressed="${v === pair}">${n}</button>`).join('')}</div>` : '';
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="RAID level">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${titleOf()}</h2>${pairHtml()}
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="raidnow">${nowHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + (AULA[sc] || 'aula-13-resumo-raid')); };
  function readout() { if (active !== 'raid') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${status()[0].toLowerCase()}`; }
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
    if (id === 'arrive' && t > 1.6) q = ['ctl', ['pedidos.db arrived', 'acc', `${l.file} blocks · A1 … A${l.file}`]];
    if (id === 'write') { const R = rows.length, rT = ROWT();
      if (t < R * rT) { const r = Math.min(R - 1, Math.floor(t / rT)), lt2 = t - r * rT, T = {
        raid0: [['stripe 1 · striping', 'A1→D1 · A2→D2 · A3→D3 · A4→D4'], ['stripe 2 · striping', 'A5→D1 · A6→D2 · A7→D3 · A8→D4']],
        raid1: [['A1 → D1 and D2', 'same block, two disks'], ['A2 → D1 and D2', 'same block, two disks']],
        raid5: [lt2 < 1.6 ? ['P1 = A1 ⊕ A2 ⊕ A3', '1011 ⊕ 0110 ⊕ 0101 = 1000'] : ['P1 → D4', 'stripe 1 parity on disk 4'], lt2 < 1.6 ? ['P2 = A4 ⊕ A5 ⊕ A6', '1100 ⊕ 0011 ⊕ 1001 = 0110'] : ['P2 → D3', 'the parity rotated: stripe 2 on disk 3']],
        raid6: [lt2 < 1.6 ? ['P1 = A1 ⊕ A2 ⊕ A3 = 1000', 'Q1 = other calculation (Reed-Solomon)'] : ['P1 → D4 · Q1 → D5', 'two parities in stripe 1'], lt2 < 1.6 ? ['P2 = A4 ⊕ A5 ⊕ A6 = 0110', 'Q2 = other calculation (Reed-Solomon)'] : ['P2 → D3 · Q2 → D4', 'P and Q rotated']],
        raid10: [['A1 → pair 1 (D1 and D2)', 'A2 → pair 2 (D3 and D4)'], ['A3 → pair 1 (D1 and D2)', 'A4 → pair 2 (D3 and D4)']] }[sc][r];
        q = ['ctl', [T[0], 'acc', T[1]]]; }
      else w2 = ['dsk', [{ raid0: 'written: one block on each disk', raid1: 'written: identical copy on both disks', raid5: 'written: data + rotating parity', raid6: 'written: data + rotating P + Q', raid10: 'written: mirrored pairs' }[sc], 'acc', `${ST().use} usable of ${ST().of}`]]; }
    if (id === 'read' && t > 0.5) w2 = ['dsk', [{ raid0: 'reads D1 D2 D3 D4 together · ×4', raid1: 'A1 from D1 and A2 from D2 · ×2', raid5: 'reads A1 A2 A3 together · P1 stays quiet', raid6: 'reads A1 A2 A3 together · P and Q quiet', raid10: 'reads all 4 disks together · ×4' }[sc], 'acc', 'each disk delivers a block at the same time']];
    if (id === 'fail' && t >= 0.8) w2 = ['dsk', ['☠ D2 burned out', 'bad', 'red LED · the disk stops responding']];
    if (id === 'fail2') { const f2 = F2(), dn = f2 == null ? '' : 'D' + (f2 + 1);
      if (sc === 'raid0') w2 = ['dsk', ['no second failure', 'bad', 'the file was already lost on the first']];
      else if (t >= 2.0) {
        if (sc === 'raid1') w2 = ['dsk', ['file lost', 'bad', 'D1 and D2 burned out: only backup saves it']];
        else if (sc === 'raid5') { w2 = ['dsk', ['file lost', 'bad', 'A2, A5 and A6 cannot be rebuilt']]; if (t > 2.4) q = ['ctl', ['A2 = P1 ⊕ A1 ⊕ A3 ?', 'bad', 'P1 was on D4, which burned out:\n2 unknowns, 1 equation ✗']]; }
        else if (sc === 'raid6') { w2 = ['dsk', ['2 of 2 used', 'acc', 'no slack: a third disk would be the end']]; q = ['ctl', ['2 disks out, 2 equations', 'acc', 'stripe 1: A2 from Q1, P1 = 1000 ✓\nstripe 2: A5 = P2⊕A4⊕A6 = 0011 ✓']]; }
        else if (pair === 'same') w2 = ['dsk', ['all of pair 1 out', 'bad', 'A1 and A3 lost · A2 and A4 alive']];
        else w2 = ['dsk', ['one alive in each pair', 'acc', 'D1 and D4 hold the whole file']]; }
      else if (t >= 0.8) w2 = ['dsk', [`☠ ${dn} burned out too`, 'bad', 'red LED · second disk out']]; }
    if (id === 'result') { if (sc === 'raid0') q = ['ctl', ['✕ A2 and A6 are gone', 'bad', 'no copy and no parity:\nthe file is lost']];
      else if (PAR() && t > 1.4) q = ['ctl', ['A2 = P1 ⊕ A1 ⊕ A3', 'acc', '1000 ⊕ 1011 ⊕ 0101 = 0110 ✓\nA5 = P2 ⊕ A4 ⊕ A6 = 0011 ✓']];
      else if (sc === 'raid1') w2 = ['dsk', ['reads everything from D1', 'acc', 'the copy takes over with no pause']];
      else if (sc === 'raid10') w2 = ['dsk', ['reads A1 and A3 from D1', 'acc', 'D2\'s pair has a copy of everything']]; }
    if (id === 'rebuild') { const p = RBprog(), dn = TG().map(x => 'D' + (x + 1)).join(' and ');
      if (t < 1.3) w2 = ['dsk', [TG().length > 1 ? `swap the ${dn} trays` : 'swap the D2 tray', 'hi', TG().length > 1 ? 'the burned disks come out' : 'the burned disk comes out']];
      else if (EMPTYRB()) w2 = ['dsk', [TG().length > 1 ? 'new disks empty' : 'new disk empty', 'bad', 'nowhere to rebuild from:\nrestore from backup']];
      else if (p < 1) w2 = ['dsk', [`rebuild ${Math.round(p * 100)}%`, 'acc', sc === 'raid6' ? '⚠ no slack: one more disk out = file lost' : sc === 'raid10' ? 'each new disk copies its pair' : '⚠ another disk failing now = file lost']];
      else w2 = ['dsk', ['rebuild complete', 'acc', TG().length > 1 ? 'the new disks have their blocks back' : 'the new D2 has its blocks back']]; }
    if (id === 'sum') w2 = ['dsk', [`${SCNAME[sc]}: ${ST().use} usable`, 'acc', `tolerates ${ST().tol} · small write ${ST().pen}`]];
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch level', 'C', cycleSc], ['Switch pair (RAID 10)', 'P', () => sc === 'raid10' && setPair(pair === 'same' ? 'other' : 'same')]],
    view: NARROW() ? { target: W(330, 150, -150), dist: innerWidth < 640 ? 11.5 : 14.5 } : { target: W(105, 150, 60), dist: 14.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · level: C or 1 2 3 4 5 · drag to rotate' };
})() });
