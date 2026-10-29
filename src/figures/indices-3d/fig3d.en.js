// Figura 3D (iso-glow): índices. A Lena abre "Meus pedidos" e o banco precisa achar o pedido 1042 na tabela pedidos (6 linhas).
// Cena: ao fundo, o mostrador com a consulta SQL, a resposta e o contador de páginas lidas. Na frente, as páginas do disco
// (lajes de 8 KB com até 4 cartões de linha, ~2 KB cada). No meio, a estrutura do índice do cenário: raiz da B-Tree,
// função hash e 4 baldes, fichas do índice invertido, ou memtable + WAL da LSM (as lajes viram SSTables com bloom filter).
// Cenários (toggle e ?mode=scan|btree|lsm|hash|inverted; ?step=N abre no passo N): cada um tem um "e se der errado".
// Dados: a história canônica do módulo (docs/escrita/databases-brief.md). hash(id) = id é um exemplo didático.
FIGS3D.push({ id: 'indices', name: 'Indexes', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  // cores de texto: no claro, versões bem escuras. O texto dos cartões é miúdo e a textura reduzida mistura o traço com o fundo,
  // então o hex precisa de folga para o pixel na tela ainda dar ≥ 4.5:1 (WCAG AA). O escuro fica como estava.
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const WARN = () => theme === 'light' ? '#6e4100' : '#ffb02e';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const ROW = { 1041: ['Caio', 'caneca azul', 2, '39.80', 'Rio'], 1042: ['Lena', 'gato de pelúcia', 1, '89.90', 'Recife'], 1043: ['Bia', 'gato de pelúcia', 1, '89.90', 'SP'],
    1044: ['Lena', 'caneca azul', 1, '19.90', 'Recife'], 1045: ['Davi', 'camiseta preta', 3, '147.00', 'SP'], 1046: ['Bia', 'caneca azul', 1, '19.90', 'SP'] };
  const IDS = [1041, 1042, 1043, 1044, 1045, 1046];
  const HEAP = [[1041, 1042, 1043, 1044], [1045, 1046]];          // 4 linhas de ~2 KB por página de 8 KB
  const LEAF = [[1041, 1042], [1043, 1044, 1045, 1046]];          // folhas da B-Tree (raiz [1043])
  const BUCK = [[1044], [1041, 1045], [1042, 1046], [1043]];       // hash(id) % 4, com hash(id) = id
  const TERMS = [['azul', [1041, 1044, 1046]], ['camiseta', [1045]], ['caneca', [1041, 1044, 1046]], ['gato', [1042, 1043]], ['pelúcia', [1042, 1043]], ['preta', [1045]]];
  const heapAt = id => { for (let p = 0; p < 2; p++) { const k = HEAP[p].indexOf(id); if (k >= 0) return { p, k, off: k * 2048 }; } };
  const rowLine = id => `${id} | ${ROW[id][0]} | ${ROW[id][1]} | ${ROW[id][2]} | ${ROW[id][3]} | ${ROW[id][4]}`;
  const SQL1 = 'SELECT * FROM pedidos\nWHERE id = 1042;', SQLR = 'SELECT * FROM pedidos\nWHERE id BETWEEN 1042 AND 1045;';

  const SC = ['scan', 'btree', 'lsm', 'hash', 'inverted'];
  const SCNAME = { scan: 'Scan', btree: 'B-Tree', lsm: 'LSM', hash: 'Hash', inverted: 'Inverted' };
  const AULA = { scan: 'aula-10-page-size-e-indexacao-colunar', btree: 'aula-12-b-tree', lsm: 'aula-11-lsm-trees', hash: 'aula-13-hashing', inverted: 'aula-14-indices-invertidos' };
  let clk = 0, sc = 'btree', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowKey = '', nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; } const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-indices3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7;
  plateWith(g0, 680, 330, [[14, 14], [666, 14], [14, 316], [666, 316]]);
  hazeAndShadow(g0, 340, 165, 8.2, 4.4);
  // mostrador ao fundo
  rbox(24, 12, PL, 456, 12, 104, 5, bodyMat, g0);
  const scr = faceCanvas('front', 28, 24, 113, 448, 100, 5, g0);
  // páginas (lajes) e cartões de linha
  const SX = [24, 248, 472], SY = 160, SW = 184, SD = 130, SH = 16, ST = PL + SH;
  const TW = 172, TD = 25, TH = 8;
  const slot = (s, k) => [SX[s] + 6, SY + 9 + k * 29, ST];
  const SLAB = SX.map((x0, s) => {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(x0, SY, PL, SW, SD, SH, 6, mat, g);
    const top = faceCanvas('top', x0 + 3, SY + 3, ST, SW - 6, SD - 6, 5, g);
    const fr = faceCanvas('front', x0 + 3, SY + SD, ST - 1, SW - 6, 14, 9, g);
    return { g, mat, top, fr, key: '' };
  });
  const TILE = {};
  [...IDS].forEach(id => {
    const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, TW, TD, TH, 3, mat, g);
    const top = faceCanvas('top', 1, 1, TH, TW - 2, TD - 2, 8, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow);
    TILE[id] = { g, mat, top, glow, key: '', pos: null, from: null, to: null, t0: 0 };
  });
  // B-Tree: raiz
  const gTree = new THREE.Group(); g0.add(gTree);
  const rootMat = capMat(); twCaps.push(rootMat);
  rbox(140, 60, PL, 184, 56, 26, 6, rootMat, gTree);
  const rootTop = faceCanvas('top', 143, 63, PL + 26, 178, 50, 6, gTree);
  // Hash: função e 4 baldes
  const gHash = new THREE.Group(); g0.add(gHash);
  const fnMat = capMat(); twCaps.push(fnMat);
  rbox(24, 58, PL, 140, 66, 24, 6, fnMat, gHash);
  const fnTop = faceCanvas('top', 27, 61, PL + 24, 134, 60, 6, gHash);
  const BK = [0, 1, 2, 3].map(k => { const mat = capMat(); twCaps.push(mat); const x = 184 + k * 120;
    rbox(x, 58, PL, 108, 66, 14, 5, mat, gHash); return { mat, top: faceCanvas('top', x + 3, 61, PL + 14, 102, 60, 6, gHash), key: '' }; });
  // Invertido: uma ficha por termo
  const gInv = new THREE.Group(); g0.add(gInv);
  const TM = TERMS.map((_, k) => { const g = new THREE.Group(); gInv.add(g); const mat = capMat(); twCaps.push(mat); const x = 24 + k * 106;
    rbox(x, 58, PL, 100, 66, 12, 5, mat, g); return { g, mat, top: faceCanvas('top', x + 3, 61, PL + 12, 94, 60, 6, g), key: '' }; });
  // LSM: memtable (memória) e WAL (disco, só acrescenta)
  const gLsm = new THREE.Group(); g0.add(gLsm);
  const memMat = capMat(); twCaps.push(memMat);
  rbox(24, 52, PL, 220, 78, 14, 6, memMat, gLsm);
  const memTop = faceCanvas('top', 27, 55, PL + 14, 214, 72, 5, gLsm);
  const memFr = faceCanvas('front', 27, 130, PL + 13, 214, 12, 9, gLsm);
  const memSlot = k => [48, 64 + k * 32, PL + 14];
  const walMat = capMat(); twCaps.push(walMat);
  rbox(264, 52, PL, 392, 78, 10, 6, walMat, gLsm);
  const walTop = faceCanvas('top', 267, 55, PL + 10, 386, 72, 5, gLsm);
  // barra de leitura (varredura)
  const headMat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), headMat); head.scale.set(188 * TS, 3 * TS, 3 * TS); g0.add(head); head.visible = false;
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 28 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 6 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const a = W(...b.pts[i]), c = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.5) * TS, d = c.clone().sub(a), len = d.length();
        m.visible = true; m.material = b.on ? beamOn : beamOff; m.position.copy(a).add(c).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.flow !== false && nd < DOTS.length) { const D = DOTS[nd++], cum = cumLen(b.pts), f = (lt * 0.55 + nd * 0.27) % 1, p = alongPts(b.pts, cum, f);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.94)' : 'rgba(18,19,20,.9)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12)];

  // ── rotas das vigas (no chão, z = 10) ──
  const Z = 10;
  const toSlab = (x0, y0, s, yc) => [[x0, y0, Z], [x0, yc, Z], [SX[s] + SW / 2, yc, Z], [SX[s] + SW / 2, SY, Z]];
  const R = {
    rootL: [[196, 116, Z], [196, 140, Z], [116, 140, Z], [116, SY, Z]],
    rootR: [[268, 116, Z], [268, 140, Z], [340, 140, Z], [340, SY, Z]],
    sib: [[SX[0] + SW, 225, 15], [SX[1], 225, 15]],
    fn: k => [[94, 124, Z], [94, 138, Z], [238 + k * 120, 138, Z], [238 + k * 120, 124, Z]],
    bk2: toSlab(478, 124, 0, 150),
    term: toSlab(498, 124, 0, 148),
    inWal: [[-40, 141, Z], [460, 141, Z], [460, 130, Z]],
    inMem: [[-40, 141, Z], [134, 141, Z], [134, 130, Z]],
    flush: [[214, 130, Z], [214, 150, Z], [564, 150, Z], [564, SY, Z]],
    merge: [[SX[2], 225, 15], [SX[1] + SW, 225, 15]],
    qMem: [[-40, 141, Z], [134, 141, Z], [134, 130, Z]],
    qS1: [[-40, 147, Z], [340, 147, Z], [340, SY, Z]],
    qS0: [[-40, 153, Z], [116, 153, Z], [116, SY, Z]],
  };

  // ── o que se vê em cada passo (spec) ──
  const SLABDEF = {
    heap: [{ lab: 'PAGE 1', sub: '8 KB · 4 rows' }, { lab: 'PAGE 2', sub: '8 KB · 2 rows' }, { vis: false }],
    btree: [{ lab: 'LEAF 1', sub: 'page · 2 rows' }, { lab: 'LEAF 2', sub: 'page · 4 rows' }, { vis: false }],
    lsm: [{ lab: 'SST-1', sub: 'bloom 10110100' }, { lab: 'SST-2', sub: 'bloom 00011010' }, { vis: false, lab: 'SST-3', sub: 'bloom 01001010' }],
  };
  function base() {
    const lay = sc === 'btree' ? 'btree' : sc === 'lsm' ? 'lsm' : 'heap';
    const o = { slabs: SLABDEF[lay].map(d => ({ vis: d.vis !== false, lab: d.lab, sub: d.sub, read: 0, note: '', tone: '' })),
      place: {}, st: {}, beams: [], head: null, tags: [], reads: 0, cmps: 0, cLab: 'rows compared', million: '', milTone: 'acc',
      sql: SQL1, res: [], idx: {} };
    const put = (s, ids) => ids.forEach((id, k) => o.place[id] = slot(s, k));
    if (lay === 'heap') HEAP.forEach((ids, s) => put(s, ids));
    if (lay === 'btree') LEAF.forEach((ids, s) => put(s, ids));
    if (lay === 'lsm') { put(0, [1041, 1042, 1043]); put(1, [1044]); o.place[1045] = memSlot(0); }
    o.put = put;
    return o;
  }
  // compara linha por linha: cada uma fica 'cmp' por um instante e depois 'hit' ou 'miss'
  function sweep(o, ids, t, t0, per, isHit) {
    let n = 0;
    ids.forEach((id, i) => { const a = t0 + i * per; if (t < a) return; n++;
      if (t < a + per * 0.65) { o.st[id] = 'cmp'; o.head = id; } else o.st[id] = isHit(id) ? 'hit' : 'miss'; });
    return n;
  }
  const readAt = (o, s, t, a) => { if (t >= a) { o.slabs[s].read = 1; return 1; } return 0; };
  const done = (o, ...ss) => ss.forEach(s => { o.slabs[s].read = 2; o.slabs[s].note = 'read ✓'; });
  const hits = (o, ids) => ids.forEach(id => o.st[id] = 'hit');
  const miss = (o, ids) => ids.forEach(id => o.st[id] = 'miss');
  const T = (o, x, y, z, text, tone = 'acc') => o.tags.push([x, y, z, text, tone]);
  const res1 = o => o.res = [rowLine(1042)];

  const STEPS = {
    scan: [
      { id: 'ask', dur: 3, title: 'No index: there is only the table',
        story: 'Lena opens "My orders" and the app asks the database for order 1042, the plush cat one. The pedidos table has 6 rows stored in 2 pages of 8 KB, each row about 2 KB. There is no index at all: the database only knows where the pages begin.',
        look: 'The two pages on disk, with 4 and 2 rows. The counter on the display is at zero.',
        key: 'Without an index, the database does not know which page a row is in.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; if (t > 0.6) T(o, 236, 314, 28, '6 rows in 2 pages\nno index: where is 1042?', 'hi'); } },
      { id: 'p1', dur: 5, title: 'Read the whole of page 1',
        story: 'The database brings page 1 from disk and compares each row\'s id with 1042: 1041 no, 1042 yes, 1043 no, 1044 no. It found Lena\'s order on the second row, but the whole page had already arrived, all 4 rows.',
        look: 'Page 1 lights up, the bar passes row by row and 1042 rises.',
        key: 'The disk hands over the whole page, never just one row.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; o.reads = readAt(o, 0, t, 0.3);
          o.cmps = sweep(o, HEAP[0], t, 0.8, 0.85, id => id === 1042); if (o.st[1042] === 'hit') res1(o);
          if (o.head) T(o, 300, slot(0, HEAP[0].indexOf(o.head))[1] + 12, 48, o.head === 1042 ? '1042 = 1042 ✓' : `${o.head} ≠ 1042`, o.head === 1042 ? 'acc' : 'dim');
          else if (t > 4.4) T(o, 116, 314, 28, '1 page read\npage 2 still to go'); } },
      { id: 'p2', dur: 4.5, title: 'And it keeps going to the end',
        story: 'Even after finding it, the database moves on to page 2: without an index it has no way to know there is only one 1042. It compares 1045 and 1046 and only then stops. That was 2 pages read and 6 rows compared to return 1.',
        look: 'Page 2 lights up and the counter reaches 2 pages and 6 comparisons.',
        key: 'Full scan: it reads every page of the table.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; done(o, 0); hits(o, [1042]); miss(o, [1041, 1043, 1044]); res1(o);
          o.reads = 1 + readAt(o, 1, t, 0.3); o.cmps = 4 + sweep(o, HEAP[1], t, 0.8, 0.85, () => false);
          if (o.head) T(o, 524, slot(1, HEAP[1].indexOf(o.head))[1] + 12, 48, `${o.head} ≠ 1042`, 'dim');
          if (t > 2.6) { done(o, 1); T(o, 340, 314, 28, '2 pages · 6 comparisons\nto return 1 row'); } } },
      { id: 'scale', dur: 4, title: 'What if the store grows?',
        story: 'With 6 orders, 2 pages go unnoticed. With 1 million orders, at 4 per page, the same query reads 250,000 pages, about 2 GB, to find one row. A B-Tree on id would read about 4 (B-Tree tab).',
        look: 'The balloon over page 2 counts the pages the big table would have; the display repeats the number.',
        key: 'A full scan grows with the table: double the rows, double the pages.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; done(o, 0, 1); hits(o, [1042]); miss(o, [1041, 1043, 1044, 1045, 1046]); res1(o); o.reads = 2; o.cmps = 6;
          if (t > 0.5) T(o, 340, 314, 28, 'with 1 million orders:\n250,000 pages · ~2 GB\n(B-Tree: ~4)', 'bad'); } },
    ],
    btree: [
      { id: 'tree', dur: 3.5, title: 'The B-Tree index: a sorted tree',
        story: 'Now there is a B-Tree index on id. The root holds only the key 1043, which splits the leaves: 1041 and 1042 on the left, 1043 to 1046 on the right. Here the leaves are the pages with the rows themselves, in order (a clustered index, like the InnoDB primary key).',
        look: 'The root [1043] at the back, linked to the two leaves. The rows swapped places: now they are in order inside the leaves.',
        key: 'B-Tree: sorted keys in levels; each level cuts the path.',
        f(o, t) { o.million = '~4 pages'; o.beams.push({ pts: R.rootL }, { pts: R.rootR }, { pts: R.sib });
          if (t > 0.8) T(o, 232, 88, 64, 'root: 1043\n< 1043 on the left · ≥ 1043 on the right'); } },
      { id: 'root', dur: 4, title: 'Read the root: 1042 < 1043',
        story: 'To find 1042, the database starts at the root, which is 1 page. It compares: 1042 is less than 1043, so it follows the left pointer. The right leaf is not even opened.',
        look: 'The root lights up and the link on the left carries the light to leaf 1.',
        key: 'One comparison at the root already rules out the whole right leaf.',
        f(o, t) { o.million = '~4 pages'; o.idx.root = t > 0.3 ? 1 : 0; o.reads = t > 0.3 ? 1 : 0; o.cmps = t > 0.9 ? 1 : 0;
          o.beams.push({ pts: R.rootL, on: t > 1.2 }, { pts: R.rootR }, { pts: R.sib });
          if (t > 0.9) T(o, 232, 88, 64, '1042 < 1043 → left'); } },
      { id: 'leaf', dur: 4.5, title: 'Read leaf 1 and find 1042',
        story: 'Leaf 1 arrives from disk with 1041 and 1042, in order. 1042 is there and the database stops: the keys are unique and sorted, so there is nothing left to look for. That is 2 pages, exactly the same 2 as the scan: with 6 rows, the B-Tree ties.',
        look: 'Leaf 1 lights up and 1042 rises. Leaf 2 stays dark.',
        key: 'With 6 rows it is a tie: 2 pages against the scan\'s 2.',
        f(o, t) { o.million = '~4 pages'; o.idx.root = 2; o.beams.push({ pts: R.rootL, on: true }, { pts: R.rootR }, { pts: R.sib });
          o.reads = 1 + readAt(o, 0, t, 0.3); o.cmps = 1 + sweep(o, LEAF[0], t, 0.8, 0.8, id => id === 1042);
          if (o.st[1042] === 'hit') res1(o);
          if (o.head) T(o, 300, slot(0, LEAF[0].indexOf(o.head))[1] + 12, 48, o.head === 1042 ? '1042 ✓' : '1041 ≠ 1042', o.head === 1042 ? 'acc' : 'dim');
          if (t > 2.6) { done(o, 0); T(o, 116, 314, 28, 'found: root + leaf 1\n= 2 pages (a tie with the scan)'); } } },
      { id: 'scale', dur: 4, title: 'A tie here, a gap there',
        story: 'With 6 orders, scan and B-Tree read the same 2 pages: the index has not made a difference yet. The difference shows up as the table grows. With 1 million orders, the scan reads 250,000 pages; the B-Tree goes down about 4 levels and reads ~4, because each internal page holds hundreds of keys.',
        look: 'The balloon in front compares the two numbers: a tie with 6 rows, 250,000 against ~4 with 1 million.',
        key: 'The scan grows with the table; the B-Tree grows with the height of the tree, which barely changes.',
        f(o, t) { o.million = '~4 pages (scan: 250,000)'; o.idx.root = 2; o.beams.push({ pts: R.rootL, on: true }, { pts: R.rootR }, { pts: R.sib });
          o.reads = 2; o.cmps = 3; hits(o, [1042]); miss(o, [1041]); done(o, 0); res1(o);
          if (t > 0.4) T(o, 230, 314, 28, t > 1.4 ? '6 rows: a tie, 2 × 2 pages\n1 million: B-Tree ~4 × scan 250,000' : '6 rows: B-Tree 2 × scan 2 (a tie)', t > 1.4 ? 'acc' : 'hi'); } },
      { id: 'range', dur: 5.5, title: 'Range: the leaves walk together', sql: SQLR,
        story: 'The store wants the orders from 1042 to 1045. The B-Tree goes down to 1042 as before and then walks sideways: each leaf points to its neighbor, so 1043, 1044 and 1045 come in sequence, already in order. That is 3 pages: root, leaf 1 and leaf 2.',
        look: 'The link between the leaves lights up and the orders from 1042 to 1045 rise in a line.',
        key: 'Order is the B-Tree\'s trump card: ranges and ORDER BY come almost for free.',
        f(o, t) { o.million = '~4 + the range leaves'; o.idx.root = 2; o.reads = (t > 0.3 ? 1 : 0) + readAt(o, 0, t, 0.6) + readAt(o, 1, t, 2.0);
          o.beams.push({ pts: R.rootL, on: t > 0.4 }, { pts: R.rootR }, { pts: R.sib, on: t > 1.7 });
          o.cmps = (t > 0.3 ? 1 : 0) + sweep(o, LEAF[0], t, 0.8, 0.5, id => id === 1042) + sweep(o, LEAF[1], t, 2.2, 0.5, id => id <= 1045);
          if (t > 1.8) done(o, 0); if (t > 4.4) done(o, 1);
          o.res = IDS.filter(id => o.st[id] === 'hit').length ? [`${IDS.filter(id => o.st[id] === 'hit').length} rows: ${IDS.filter(id => o.st[id] === 'hit').join(', ')}`] : [];
          if (o.head === 1046) T(o, 524, slot(1, 3)[1] + 12, 48, '1046 > 1045: stop', 'dim');
          if (t > 4.4) T(o, 340, 314, 28, '1042 → 1045\nroot + 2 leaves = 3 pages'); } },
      { id: 'other', dur: 6, title: 'What if it goes wrong: search by another column', sql: "SELECT * FROM pedidos\nWHERE cliente = 'Lena';",
        story: 'Now the question is about the customer: all of Lena\'s orders. The index is on id and does not help, because the root only knows how to split ids. The database goes back to reading both leaves whole and comparing the 6 rows, like the scan. For this query you would need another index, on customer.',
        look: 'The root stays dark; both leaves light up and only 1042 and 1044 rise.',
        key: 'An index only serves the column (or the first columns) it was created on.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; o.idx.root = -1; o.beams.push({ pts: R.rootL }, { pts: R.rootR }, { pts: R.sib, on: t > 2.4 });
          o.reads = readAt(o, 0, t, 0.6) + readAt(o, 1, t, 2.5); const lena = id => ROW[id][0] === 'Lena';
          o.cmps = sweep(o, LEAF[0], t, 1.0, 0.7, lena) + sweep(o, LEAF[1], t, 2.8, 0.7, lena);
          if (t > 0.3) T(o, 232, 88, 64, 'index on id:\nknows nothing about cliente', 'bad');
          if (o.head) T(o, o.place[o.head][0] + 120, o.place[o.head][1] + 12, 48, ROW[o.head][0] === 'Lena' ? `${o.head}: Lena ✓` : `${o.head}: ${ROW[o.head][0]}`, ROW[o.head][0] === 'Lena' ? 'acc' : 'dim');
          if (t > 2.4) done(o, 0); if (t > 5.4) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.length ? [`${h.length} ${h.length > 1 ? 'rows' : 'row'}: ${h.join(', ')} (Lena)`] : []; } },
    ],
    hash: [
      { id: 'fn', dur: 3.5, title: 'Hash: a calculation picks the bucket',
        story: 'Another kind of index swaps the tree for a calculation. The database passes the key through a hash function and uses the remainder of the division by the number of buckets. Here there are 4 buckets and, so you can check it in your head, the example hash returns the id itself: hash(1042) % 4 = 2.',
        look: 'The function box shows the calculation and the light runs to bucket 2.',
        key: 'A hash turns the key straight into the bucket number, with no comparisons.',
        f(o, t) { o.million = '2 pages'; o.idx.fn = t > 0.4 ? 1 : 0; o.idx.bk = [0, 0, t > 1.4 ? 1 : 0, 0];
          [0, 1, 2, 3].forEach(k => o.beams.push({ pts: R.fn(k), on: k === 2 && t > 1.0 }));
          if (t > 0.6) T(o, 94, 142, 26, 'hash(1042) % 4\n= 1042 % 4 = 2'); } },
      { id: 'bucket', dur: 3.5, title: 'Read bucket 2',
        story: 'Bucket 2 is 1 page of the index. Inside it there are two entries, because 1046 % 4 is also 2: 1042 points to page 1, byte 2048, and 1046 to page 2, byte 2048. The database checks the key and keeps the one for 1042.',
        look: 'Bucket 2 lights up with its two entries; the one for 1042 is highlighted.',
        key: 'Two keys in the same bucket is a collision: the database checks the key inside.',
        f(o, t) { o.million = '2 pages'; o.idx.fn = 2; o.idx.bk = [0, 0, t > 0.3 ? 1 : 0, 0]; o.idx.hi = t > 1.0 ? 1042 : 0;
          [0, 1, 2, 3].forEach(k => o.beams.push({ pts: R.fn(k), on: k === 2 }));
          o.reads = t > 0.3 ? 1 : 0; o.cmps = t > 1.0 ? 1 : 0;
          if (t > 1.0) T(o, 478, 142, 26, 'bucket 2: 1042 → page 1, byte 2048'); } },
      { id: 'fetch', dur: 4, title: 'Go straight to the row',
        story: 'With the address in hand, the database reads page 1 and jumps to byte 2048, where Lena\'s row begins. That is 2 pages, and with 1 million orders it would still be 2: the right bucket comes out of the calculation, whatever the size of the table.',
        look: 'The light goes from bucket 2 to page 1 and 1042 rises.',
        key: 'For exact equality, a hash costs the same with 6 or 1 million rows.',
        f(o, t) { o.million = '2 pages'; o.idx.fn = 2; o.idx.bk = [0, 0, 2, 0]; o.idx.hi = 1042;
          o.beams.push({ pts: R.bk2, on: t > 0.4 }); o.reads = 1 + readAt(o, 0, t, 0.9); o.cmps = 1;
          if (t > 1.5) { o.st[1042] = 'hit'; res1(o); done(o, 0); T(o, 116, 314, 28, 'byte 2048 → 1042 ✓\nbucket + page = 2'); } } },
      { id: 'range', dur: 6, title: 'What if it goes wrong: a range', sql: SQLR,
        story: 'Now the store asks for 1042 to 1045, which the B-Tree solved by walking the leaves. In a hash, neighboring keys land in unrelated buckets: 1043 in 3, 1044 in 0, 1045 in 1. The index keeps no order, so it does not help: the database goes back to scanning the 2 pages (with 1 million, 250,000).',
        look: 'Each bucket lights up its piece of the range, scattered; the ones doing the real work are the two pages.',
        key: 'A hash only answers "equal to". For ranges and order, use a B-Tree.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; o.idx.fn = 0; o.idx.bk = [3, 3, 3, 3]; o.idx.rng = true;
          if (t > 0.3) T(o, 440, 142, 30, '1042…1045 in 4 different buckets\nno order: the index is no use', 'bad');
          o.reads = readAt(o, 0, t, 1.4) + readAt(o, 1, t, 3.4); const inR = id => id >= 1042 && id <= 1045;
          o.cmps = sweep(o, HEAP[0], t, 1.6, 0.45, inR) + sweep(o, HEAP[1], t, 3.6, 0.45, inR);
          if (t > 3.4) done(o, 0); if (t > 4.6) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.length ? [`${h.length} rows: ${h.join(', ')} (scan)`] : []; } },
    ],
    inverted: [
      { id: 'like', dur: 5.5, title: 'Search for a word without an index', sql: "SELECT * FROM pedidos\nWHERE produto LIKE '%pelúcia%';",
        story: 'Lena wants to see other plush products and types "pelúcia" in the store search. Without a text index, the database runs LIKE \'%pelúcia%\': it reads the 2 pages and looks for the word inside the text of each of the 6 products. It finds 1042 and 1043, but read everything.',
        look: 'Both pages light up and the bar passes through the 6 rows; 1042 and 1043 rise.',
        key: 'LIKE with % at the start cannot use a B-Tree: it becomes a scan.',
        f(o, t) { o.million = '250,000 pages'; o.milTone = 'bad'; o.idx.inv = -1; const has = id => ROW[id][1].includes('pelúcia');
          o.reads = readAt(o, 0, t, 0.3) + readAt(o, 1, t, 2.9);
          o.cmps = sweep(o, HEAP[0], t, 0.6, 0.6, has) + sweep(o, HEAP[1], t, 3.1, 0.6, has);
          if (o.head) T(o, o.place[o.head][0] + 128, o.place[o.head][1] + 12, 48, `"${ROW[o.head][1]}" ${has(o.head) ? '✓' : '✕'}`, has(o.head) ? 'acc' : 'dim');
          if (t > 2.9) done(o, 0); if (t > 4.3) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.map(rowLine); } },
      { id: 'terms', dur: 4.5, title: 'The inverted index: word → orders',
        story: 'The inverted index does the work at write time. Each product is split into terms: "gato de pelúcia" becomes gato and pelúcia, and "de" is left out. For each term the index keeps the sorted list of orders that contain it.',
        look: 'Six cards in the middle, one per term, each with its list of ids.',
        key: 'Inverted: instead of order → words, word → orders.',
        f(o, t) { o.million = '—'; o.idx.inv = -1; o.idx.show = Math.floor(clamp((t - 0.3) / 1.8) * 6 + 0.001);
          if (t > 2.2) T(o, 340, 142, 26, '"gato de pelúcia" → gato · pelúcia\n("de" is left out)', 'hi'); } },
      { id: 'lookup', dur: 3.5, title: 'Look up "pelúcia" in the dictionary', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelúcia';",
        story: 'Now the search goes straight to the term pelúcia, 1 page of the index, and reads the list: [1042, 1043]. No product has been opened so far and the database already knows which ones they are.',
        look: 'The "pelúcia" card lights up with 1042 and 1043.',
        key: 'The list of ids (posting list) is the answer before the table is opened.',
        f(o, t) { o.million = '1 + the pages of the matches'; o.idx.inv = t > 0.3 ? 4 : -1; o.reads = t > 0.3 ? 1 : 0;
          if (t > 0.6) T(o, 498, 142, 26, 'pelúcia → [1042, 1043]'); } },
      { id: 'fetch', dur: 4, title: 'Fetch the two rows', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelúcia';",
        story: 'With the ids, the database opens only page 1, where Lena\'s order and Bia\'s are. That is 2 pages in total. The search returns Lena\'s plush cat (1042) and Bia\'s (1043).',
        look: 'The light goes from the card to page 1; 1042 and 1043 rise and page 2 stays dark.',
        key: 'Fast text search = a dictionary of terms + lists of ids.',
        f(o, t) { o.million = '1 + the pages of the matches'; o.idx.inv = 4; o.beams.push({ pts: R.term, on: t > 0.4 }); o.reads = 1 + readAt(o, 0, t, 1.0);
          if (t > 1.4) o.st[1042] = 'hit'; if (t > 1.7) o.st[1043] = 'hit'; o.res = [1042, 1043].filter(id => o.st[id] === 'hit').map(rowLine);
          if (t > 2.0) { done(o, 0); T(o, 116, 314, 28, '1 index page\n+ page 1 = 2'); } } },
      { id: 'accent', dur: 4.5, title: 'What if it goes wrong: "pelucia" without the accent', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelucia';",
        story: 'On her phone, Lena types "pelucia", without the accent. The term pelucia does not exist in the dictionary and the search comes back empty, with two plush cats in the table. That is why the index normalizes the text at write time and at search time (lowercase, no accents): both sides become "pelucia" and meet.',
        look: 'No card lights up and the balloon shows "pelucia" with no match in the dictionary.',
        key: 'The index only finds the term exactly as it was stored: normalizing is half the work.',
        f(o, t) { o.million = '—'; o.idx.inv = t > 0.4 ? -2 : -1; o.reads = t > 0.4 ? 1 : 0; o.res = t > 1.0 ? ['0 rows'] : [];
          if (t > 0.6) T(o, 498, 142, 26, '"pelucia" ≠ "pelúcia"\nnot in the dictionary ✕', 'bad');
          if (t > 2.4) T(o, 340, 314, 28, 'normalizing both ends:\npelúcia → pelucia = found'); } },
    ],
    lsm: [
      { id: 'wal', dur: 4.5, title: 'Write: the WAL first', sql: "INSERT INTO pedidos VALUES\n(1046, 'Bia', 'caneca azul', 1, 19.90, 'SP');",
        story: 'In databases with an LSM Tree, like Cassandra and RocksDB, what has to be fast is writing. Order 1046, Bia\'s, arrives. Before anything else it is noted at the end of the WAL, an append-only file: writing at the end is sequential and cheap, and if the machine crashes the order is safe there.',
        look: '1046 enters from the left and a new line appears at the end of the WAL.',
        key: 'WAL: write it down first, so nothing is lost if it crashes.',
        f(o, t) { o.million = '—'; o.cLab = 'writes to disk'; o.idx.wal = t > 1.4 ? 2 : 1; o.idx.walHi = t > 1.4;
          o.beams.push({ pts: R.inWal, on: t > 0.4 && t < 2.4 }, { pts: R.inMem });
          if (t > 0.2) o.place[1046] = t < 1.4 ? [-80, 60, 80] : [478, 62, 30];
          o.st[1046] = 'cmp'; o.cmps = t > 1.4 ? 1 : 0;
          if (t > 1.6) T(o, 460, 142, 26, 'WAL #2: PUT 1046\nappended at the end'); } },
      { id: 'mem', dur: 4, title: 'And into the memtable', sql: "INSERT INTO pedidos VALUES\n(1046, 'Bia', 'caneca azul', 1, 19.90, 'SP');",
        story: 'Right after, 1046 goes into the memtable, an in-memory table always sorted by id. It already had 1045 and now it is full (here the limit is 2 rows, to fit in the drawing). No disk page was read or rewritten.',
        look: '1046 lands in the memtable right below 1045; the label shows 2 of 2.',
        key: 'Memtable: the recent writes, in memory and in order.',
        f(o, t) { o.million = '—'; o.cLab = 'writes to disk'; o.cmps = 1; o.idx.wal = 2; o.idx.mem = t > 1.2 ? 'full' : '';
          o.beams.push({ pts: R.inWal }, { pts: R.inMem, on: t > 0.2 && t < 2 });
          o.place[1046] = t < 0.3 ? [478, 62, 30] : memSlot(1); if (t < 1.4) o.st[1046] = 'cmp';
          if (t > 1.2) T(o, 134, 142, 30, 'memtable 2 of 2: full\n1045 · 1046 in order', 'acc'); } },
      { id: 'flush', dur: 4.5, title: 'Memtable full: it becomes an SSTable', sql: '-- flush (the database does it on its own)',
        story: 'Once full, the memtable is dumped to disk in one go, as a new sorted file: SST-3, with 1045 and 1046. This file never changes again (SSTable = Sorted String Table, immutable). The memtable comes back empty and the part of the WAL it covered can go away.',
        look: 'The two cards go down from the memtable to SST-3, on the right.',
        key: 'Flush: a full memory becomes a sorted, immutable file on disk.',
        f(o, t) { o.million = '—'; o.cLab = 'writes to disk'; o.idx.wal = 2; o.idx.walDrop = t > 2.4; o.idx.mem = t > 1.6 ? 'empty' : 'full';
          o.place[1046] = memSlot(1); if (t > 0.5) { o.slabs[2].vis = true; o.slabs[2].note = 'new'; o.slabs[2].tone = 'acc'; }
          if (t > 0.8) o.put(2, [1045, 1046]); if (t > 0.6 && t < 2.4) { o.st[1045] = o.st[1046] = 'cmp'; }
          o.beams.push({ pts: R.flush, on: t > 0.4 && t < 2.4 }); o.cmps = t > 1.6 ? 2 : 1;
          if (t > 2.0) T(o, 564, 314, 28, 'SST-3: 1045 · 1046\nsorted · immutable'); } },
      { id: 'compact', dur: 5, title: 'Compaction: merging files', sql: '-- compaction (in the background)',
        story: 'An immutable file that only piles up makes reads more and more expensive. In the background, compaction merges SST-2 and SST-3 into one, SST-4 (1044, 1045, 1046), interleaving the already sorted lists, and deletes the two old ones. If an id appeared in both, only the newer version would stay.',
        look: 'SST-3\'s cards slide over to SST-2, which is now called SST-4.',
        key: 'Compaction trades many small files for a few big ones.',
        f(o, t) { o.million = '—'; o.cLab = 'writes to disk'; o.idx.wal = 0; o.idx.mem = 'empty'; o.cmps = 2 + (t > 2.2 ? 1 : 0);
          o.slabs[2].vis = t < 2.2; o.put(2, [1045, 1046]); if (t > 0.5) { o.slabs[1].read = 1; o.slabs[2].read = 1; }
          if (t > 1.0) o.put(1, [1044, 1045, 1046]); o.beams.push({ pts: R.merge, on: t > 0.6 && t < 2.2 });
          if (t > 2.2) { o.slabs[1].lab = 'SST-4'; o.slabs[1].sub = 'bloom 01001011'; o.slabs[1].note = 'new'; o.slabs[1].tone = 'acc'; o.slabs[1].read = 0; }
          if (t > 0.8) T(o, 452, 314, 28, 'SST-2 + SST-3 → SST-4\n1044 · 1045 · 1046'); } },
      { id: 'read', dur: 6, title: 'Read: from newest to oldest',
        story: 'Now Lena opens order 1042. The read goes from newest to oldest: first the memtable (empty), then SST-4. SST-4\'s Bloom filter, a bit summary kept in memory, answers "definitely not here" and the file is not even opened. SST-1\'s answers "maybe": the database reads 1 page and finds 1042.',
        look: 'The light passes through the memtable, SST-4 says "no" and stays dark, SST-1 lights up and 1042 rises.',
        key: 'A Bloom filter says "definitely not here" or "maybe here".',
        f(o, t) { o.million = '1 per SSTable with "maybe"'; lsmRead(o, t, true); } },
      { id: 'nobloom', dur: 6, title: 'What if there were no Bloom filter',
        story: 'Without the Bloom filter, the database would have to open SST-4 to find out that 1042 is not there: 2 pages instead of 1. With 10 SSTables, it would be up to 10. The Bloom filter also errs, but only one way: sometimes it says "maybe" and the file does not have it; it never says "no" for what it has.',
        look: 'SST-4 lights up too and is read for nothing: the counter goes to 2.',
        key: 'LSM writes cheap and pays on reads; Bloom filters and compaction hold that bill down.',
        f(o, t) { o.million = '1 page per SSTable'; o.milTone = 'bad'; lsmRead(o, t, false); } },
    ],
  };
  function lsmRead(o, t, bloom) {
    o.idx.mem = 'empty'; o.idx.wal = 0; o.put(1, [1044, 1045, 1046]); o.slabs[1].lab = 'SST-4'; o.slabs[1].sub = 'bloom 01001011';
    o.beams.push({ pts: R.qMem, on: t > 0.3 && t < 1.4 }, { pts: R.qS1, on: t > 1.4 && t < (bloom ? 2.4 : 3.2) }, { pts: R.qS0, on: t > (bloom ? 2.6 : 3.4) });
    if (t > 0.5 && t < 1.6) T(o, 134, 142, 30, 'memtable: empty', 'dim');
    if (bloom) {
      if (t > 1.5) { o.slabs[1].note = '1042? no'; o.slabs[1].tone = 'bad'; }
      if (t > 1.6 && t < 2.8) T(o, 340, 314, 28, 'SST-4 Bloom filter: not here\nskipped, not opened', 'dim');
      if (t > 2.6) { o.slabs[0].note = '1042? maybe'; o.slabs[0].tone = 'acc'; }
      o.reads = readAt(o, 0, t, 3.0); o.cmps = sweep(o, [1041, 1042], t, 3.3, 0.6, id => id === 1042);
      if (t > 4.6) { done(o, 0); T(o, 116, 314, 28, 'SST-1: 1042 ✓\n1 page read'); }
    } else {
      o.slabs[0].sub = o.slabs[1].sub = 'no bloom';
      o.reads = readAt(o, 1, t, 1.6) + readAt(o, 0, t, 3.6);
      o.cmps = sweep(o, [1044, 1045, 1046], t, 1.9, 0.42, () => false) + sweep(o, [1041, 1042], t, 3.9, 0.5, id => id === 1042);
      if (t > 3.2) { o.slabs[1].read = 2; o.slabs[1].note = 'read for nothing'; o.slabs[1].tone = 'bad'; }
      if (t > 3.2 && t < 4.8) T(o, 340, 314, 28, 'SST-4 opened for nothing:\n1042 was not there', 'bad');
      if (t > 5.0) { done(o, 0); T(o, 116, 314, 28, 'SST-1: 1042 ✓\n2 pages read', 'bad'); }
    }
    if (o.st[1042] === 'hit') res1(o);
  }
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); if (cur().sql) o.sql = cur().sql; return o; }

  // ── desenhos nas telas ──
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'warn' ? WARN() : tn === 'acc' ? accC() : pal3().ink;
  function drawTile(T_, id, st) {
    const key = id + st + theme + accent.getHex(); if (T_.key === key) return; T_.key = key;
    const cv = T_.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', on = st === 'hit' || st === 'cmp', acc = accC();
    x.clearRect(0, 0, cv.c.width, cv.c.height);
    x.fillStyle = on ? (light ? '#f6ece2' : '#2a1d12') : st === 'miss' ? (light ? '#e6e6e5' : '#121314') : (light ? '#eeeeed' : '#17181a'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = on ? acc : C.line; x.lineWidth = u(on ? 1.4 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    const r = ROW[id], dim = st === 'miss';
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = dim ? C.inkHi : acc; x.font = `600 ${u(10.5)}px ${MONO3}`; x.fillText(String(id), u(4), u(7.6));
    x.fillStyle = dim ? INK() : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(r[0], u(40), u(7.6));
    x.textAlign = 'right'; x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText(dim ? '≠' : '2 KB', u(166), u(7));
    x.textAlign = 'left'; x.fillStyle = dim ? INK() : C.inkHi; x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText(`${r[1]} · ${r[2]} pcs · ${r[3]} · ${r[4]}`, u(4), u(17.2));
    cv.tex.needsUpdate = true;
    T_.mat.emissiveIntensity = st === 'hit' ? 1 : st === 'cmp' ? 0.7 : st === 'miss' ? 0 : 0.25;
  }
  function drawSlab(S, d, s) {
    const key = JSON.stringify(d) + theme + accent.getHex(); if (S.key === key) return; S.key = key;
    const C = pal3(), acc = accC();
    { const cv = S.top, { x, P } = cv, u = v => v * P; x.fillStyle = C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
      for (let k = 0; k < 4; k++) { x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(3), u(6 + k * 29), u(172), u(25)); x.setLineDash([]); }
      cv.tex.needsUpdate = true; }
    const cv = S.fr, { x, P } = cv, u = v => v * P; x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = d.read ? acc : C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText(d.lab || '', u(3), u(7.2));
    const lw = x.measureText(d.lab || '').width / P; x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText(d.sub || '', u(8 + lw), u(7.4));
    if (d.note) { x.textAlign = 'right'; x.fillStyle = toneC(d.tone || 'acc'); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText(d.note, u(175), u(7.4)); }
    cv.tex.needsUpdate = true;
    S.mat.emissiveIntensity = d.read === 1 ? 0.55 : d.read === 2 ? 0.18 : 0;
  }
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawIdx(o) {
    const I = o.idx, thm = theme + accent.getHex(), acc = accC();
    if (sc === 'btree' && once('root', I.root + thm)) {
      const { x, u, C } = frameBox(rootTop, I.root > 0, I.root === -1 ? 'bad' : ''); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('ROOT · 1 page', u(5), u(7));
      x.textAlign = 'center'; x.fillStyle = I.root === -1 ? INK() : acc; x.font = `600 ${u(17)}px ${MONO3}`; x.fillText('[ 1043 ]', u(89), u(24));
      x.font = `600 ${u(7)}px ${MONO3}`; x.fillStyle = C.inkHi; x.textAlign = 'left'; x.fillText('← < 1043', u(5), u(42)); x.textAlign = 'right'; x.fillText('≥ 1043 →', u(173), u(42));
      rootTop.tex.needsUpdate = true; rootMat.emissiveIntensity = I.root === 1 ? 0.6 : I.root === 2 ? 0.2 : 0; }
    if (sc === 'hash') {
      if (once('fn', I.fn + thm)) { const { x, u, C } = frameBox(fnTop, I.fn > 0); x.textAlign = 'left';
        x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('HASH FUNCTION', u(5), u(7));
        x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('hash(id) % 4', u(5), u(22));
        x.fillStyle = I.fn > 0 ? acc : INK(); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(I.fn > 0 ? '1042 % 4 = 2' : 'hash(id) = id', u(5), u(37));
        x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('(teaching example)', u(5), u(51)); fnTop.tex.needsUpdate = true; fnMat.emissiveIntensity = I.fn === 1 ? 0.6 : I.fn === 2 ? 0.2 : 0; }
      BK.forEach((B, k) => { const lv = (I.bk || [])[k] || 0; if (!once('bk' + k, lv + '|' + I.hi + '|' + I.rng + thm)) return;
        const { x, u, C } = frameBox(B.top, lv === 1 || lv === 2 || lv === 3); x.textAlign = 'left';
        x.fillStyle = lv ? acc : C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('BUCKET ' + k, u(5), u(7.5));
        BUCK[k].forEach((id, j) => { const a = heapAt(id), hi = I.hi === id || (I.rng && id >= 1042 && id <= 1045);
          x.fillStyle = hi ? acc : C.inkHi; x.font = `600 ${u(12)}px ${MONO3}`; x.fillText(String(id), u(5), u(22 + j * 20));
          x.fillStyle = hi ? acc : INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(`→ page ${a.p + 1} · ${a.off}`, u(5), u(32 + j * 20)); });
        B.top.tex.needsUpdate = true; B.mat.emissiveIntensity = lv === 1 ? 0.6 : lv ? 0.2 : 0; });
    }
    if (sc === 'inverted') TM.forEach((M, k) => { const show = I.show == null ? 6 : I.show; M.g.visible = step > 0 && k < show;
      const on = I.inv === k; if (!once('tm' + k, on + '|' + I.inv + thm)) return;
      const { x, u, C } = frameBox(M.top, on); const [term, ids] = TERMS[k]; x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('TERM', u(5), u(7));
      x.fillStyle = on ? acc : C.inkHi; x.font = `600 ${u(term.length > 7 ? 13 : 15)}px ${MONO3}`; x.fillText(term, u(5), u(22));
      x.fillStyle = on ? acc : INK(); x.font = `600 ${u(9)}px ${MONO3}`; ids.forEach((id, j) => x.fillText(String(id), u(5 + (j % 2) * 44), u(39 + Math.floor(j / 2) * 13)));
      M.top.tex.needsUpdate = true; M.mat.emissiveIntensity = on ? 0.7 : 0; });
    if (sc === 'lsm') {
      if (once('mem', I.mem + thm)) { { const { x, u, C } = frameBox(memTop, false); x.textAlign = 'center'; x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`;
          [0, 1].forEach(k => { x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(21), u(9 + k * 32), u(172), u(25)); x.setLineDash([]); x.fillText('free', u(107), u(21.5 + k * 32)); });
          memTop.tex.needsUpdate = true; }
        const cv = memFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
        x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('MEMTABLE', u(3), u(6.4));
        x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText('memory (RAM) · sorted', u(52), u(6.6));
        x.textAlign = 'right'; x.fillStyle = I.mem === 'full' ? WARN() : accC(); x.font = `600 ${u(7)}px ${MONO3}`; x.fillText(I.mem === 'full' ? '2 of 2 · full' : I.mem === 'empty' ? '0 of 2' : '1 of 2', u(211), u(6.6));
        cv.tex.needsUpdate = true; memMat.emissiveIntensity = I.mem === 'full' ? 0.35 : 0; }
      if (once('wal', I.wal + '|' + I.walHi + '|' + I.walDrop + thm)) { const { x, u, C } = frameBox(walTop, I.walHi); x.textAlign = 'left';
        x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('WAL', u(5), u(8)); x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('disk · append only, at the end', u(30), u(8.4));
        const lines = [['#1', 'PUT 1045 · Davi · camiseta preta · 147.00'], ['#2', 'PUT 1046 · Bia · caneca azul · 19.90']];
        lines.slice(0, I.wal || 0).forEach(([n, l], j) => { const y = 24 + j * 14, hi = I.walHi && j === 1;
          x.fillStyle = I.walDrop ? INK() : hi ? accC() : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(`${n}  ${l}`, u(5), u(y));
          if (I.walDrop) { const w = x.measureText(`${n}  ${l}`).width; x.strokeStyle = INK(); x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(5), u(y)); x.lineTo(u(5) + w, u(y)); x.stroke(); } });
        if (!I.wal) { x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('(empty: what was here is now in the SSTables)', u(5), u(26)); }
        if (I.walDrop) { x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText('already in SST-3: can be discarded', u(5), u(56)); }
        walTop.tex.needsUpdate = true; walMat.emissiveIntensity = I.walHi ? 0.4 : 0; }
    }
  }
  function drawScreen(o) {
    const key = JSON.stringify([o.sql, o.res, o.reads, o.cmps, o.cLab, o.million, o.milTone, sc]) + theme + accent.getHex(); if (once('scr', key) === false) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const L0 = 228;
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('PAGES READ SO FAR', u(8), u(9));
    x.fillStyle = acc; x.font = `600 ${u(38)}px ${MONO3}`; x.fillText(String(o.reads), u(8), u(37));
    x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText(o.cLab, u(80), u(27)); x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(String(o.cmps), u(80), u(41));
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('WITH 1 MILLION ORDERS', u(8), u(66));
    x.fillStyle = o.milTone === 'bad' ? BAD() : o.million === '—' ? INK() : acc; let mf = 12; x.font = `600 ${u(mf)}px ${MONO3}`;
    const mw = x.measureText(o.million).width; if (mw > u(214)) { mf *= u(214) / mw; x.font = `600 ${u(mf)}px ${MONO3}`; } x.fillText(o.million, u(8), u(81));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(94)); x.stroke();
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('QUERY · ' + SCNAME[sc].toUpperCase(), u(L0), u(9));
    const sl = o.sql.split('\n'), fs = Math.max(...sl.map(l => l.length)) > 34 ? 8 : 10.5;
    x.fillStyle = C.inkHi; x.font = `600 ${u(fs)}px ${MONO3}`; sl.forEach((l, i) => x.fillText(l, u(L0), u(24 + i * (fs + 4))));
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('ANSWER', u(L0), u(62));
    x.font = `600 ${u(o.res.length > 1 ? 6.4 : 7)}px ${MONO3}`; x.fillStyle = o.res.length ? acc : INK();
    (o.res.length ? o.res : ['searching…']).slice(0, 2).forEach((l, i) => x.fillText(l, u(L0), u(75 + i * 11)));
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const heapTable = (hi = []) => `<table class="h3-sum"><tr><th>page</th><th>byte</th><th>id</th><th>cliente</th><th>produto</th><th>valor</th></tr>${IDS.map(id => { const a = heapAt(id), r = ROW[id];
    return `<tr${hi.includes(id) ? ' class="on"' : ''}><td>${a.p + 1}</td><td>${a.off}</td><td>${id}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[3]}</td></tr>`; }).join('')}</table>`;
  const EX = '<li class="h3-dim">Table, pages and keys are the module example. 8 KB page as in PostgreSQL (InnoDB uses 16 KB); each row takes ~2 KB so 4 fit in a page.</li>';
  const DATA = {
    scan: () => heapTable([1042]) + `<li>Pages read: <b>2</b> of 2 · rows compared: <b>6</b> · returned: <b>1</b></li><li>1 million orders ÷ 4 per page = <b>250,000 pages</b> (≈ 2 GB); with a B-Tree on id, <b>~4</b>. With 6 rows both read 2 (a tie).</li>${EX}`,
    btree: () => `<li>Root: <b>[1043]</b> · leaf 1: <b>1041, 1042</b> · leaf 2: <b>1043, 1044, 1045, 1046</b></li><li>id = 1042: root → leaf 1 = <b>2 pages</b></li><li>BETWEEN 1042 AND 1045: root → leaf 1 → leaf 2 = <b>3 pages</b></li><li>cliente = 'Lena': the index on id does not help → <b>2 leaves, 6 comparisons</b></li><li>In PostgreSQL the index is separate from the table: the leaf holds the row address (ctid) and the search reads 1 more page of the table.</li><li>With 6 rows: B-Tree 2 pages, scan 2 pages (<b>a tie</b>).</li><li>With 1 million: scan <b>250,000</b> pages, B-Tree <b>~4</b> (each internal page holds hundreds of keys).</li>${EX}`,
    hash: () => `<table class="h3-sum"><tr><th>bucket</th><th>entries (id → page · byte)</th></tr>${BUCK.map((b, k) => `<tr${k === 2 ? ' class="on"' : ''}><td>${k}</td><td>${b.map(id => { const a = heapAt(id); return `${id} → ${a.p + 1} · ${a.off}`; }).join(' &nbsp; ')}</td></tr>`).join('')}</table><li>hash(id) % 4 with <b>hash(id) = id</b> (teaching example; a real database uses a function that spreads better)</li><li>id = 1042: bucket 2 + page 1 = <b>2 pages</b></li><li>Range: a hash keeps no order → <b>scan</b></li>${EX}`,
    inverted: () => `<table class="h3-sum"><tr><th>term</th><th>orders (posting list)</th></tr>${TERMS.map(([t, ids]) => `<tr${t === 'pelúcia' ? ' class="on"' : ''}><td>${t}</td><td>${ids.join(', ')}</td></tr>`).join('')}</table><li>"de" is a stopword: it stays out of the index.</li><li>"pelúcia": 1 index page + page 1 = <b>2 pages</b>; without an index, LIKE reads <b>2 pages and 6 texts</b></li><li>In PostgreSQL, <b>@@</b> is text search and the <b>GIN</b> index is an inverted index.</li>${EX}`,
    lsm: () => `<table class="h3-sum"><tr><th>where</th><th>what it holds</th></tr><tr><td>WAL</td><td>#1 PUT 1045 · #2 PUT 1046</td></tr><tr><td>memtable</td><td>1045, 1046 (limit 2) → flush</td></tr><tr><td>SST-1</td><td>1041, 1042, 1043 · bloom 10110100</td></tr><tr><td>SST-2 + SST-3</td><td>1044 + 1045, 1046 → SST-4 · bloom 01001011</td></tr></table><li>8-bit Bloom filter; 1042 sets bits 0 and 2. SST-1 has both at 1 → <b>maybe</b>. SST-4 has both at 0 → <b>not here</b>.</li><li>Reading 1042: memtable → SST-4 (skipped) → SST-1 = <b>1 page</b>; without Bloom, <b>2</b>.</li><li>The 2-row memtable limit and the 8-bit Bloom filter are examples; in practice a memtable is tens of MB.</li>${EX}`,
  };
  const titleOf = () => cur().title;
  function countHtml() { const o = SP || spec(); return `<b>${o.reads}</b><span>${o.reads === 1 ? 'page read' : 'pages read'} so far</span><i>· ${o.cmps} ${o.cmps === 1 ? o.cLab.replace('rows compared', 'row compared').replace('writes', 'write') : o.cLab}</i>`; }
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Index type">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${titleOf()}</h2>
      <div class="i3-count" id="i3count">${countHtml()}</div>
      <div class="i3-sql"><b>SQL command</b>${o.sql.replace(/</g, '&lt;')}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'indices') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.reads} ${o.reads === 1 ? 'page read' : 'pages read'}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'indices' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-indices3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'indices') setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    gTree.visible = sc === 'btree'; gHash.visible = sc === 'hash'; gInv.visible = sc === 'inverted'; gLsm.visible = sc === 'lsm';
    SLAB.forEach((S, s) => { const d = o.slabs[s]; S.g.visible = d.vis; if (d.vis) drawSlab(S, d, s); });
    IDS.forEach(id => {
      const T_ = TILE[id], p = o.place[id];
      if (!p) { T_.g.visible = false; T_.pos = null; T_.glow.material.uniforms.intensity.value = 0; return; }
      const st = o.st[id] || 'norm', want = [p[0], p[1], p[2] + (st === 'hit' ? 12 : 0)];
      if (!T_.pos) { T_.pos = want.slice(); T_.to = want; T_.from = want; }
      if (want.some((v, i) => v !== T_.to[i])) { T_.from = T_.pos.slice(); T_.to = want; T_.t0 = clk; }
      const f = ease(clamp((clk - T_.t0) / 0.9)), hop = Math.hypot(T_.to[0] - T_.from[0], T_.to[1] - T_.from[1]);
      T_.pos = lerp3(T_.from, T_.to, f); T_.pos[2] += Math.sin(f * Math.PI) * Math.min(60, hop * 0.3);
      T_.g.visible = true; T_.g.position.copy(W(...T_.pos)); drawTile(T_, id, st);
      moveGlow(T_.glow, [T_.pos[0] + TW / 2, T_.pos[1] + TD / 2, T_.pos[2] + TH + 2], st === 'hit' ? 0.9 : 0);
    });
    if (o.head && o.place[o.head]) { const p = TILE[o.head].pos || o.place[o.head]; head.visible = true; head.position.copy(W(p[0] + TW / 2, p[1] + TD + 2, ST + 14)); } else head.visible = false;
    setBeams(o.beams); drawIdx(o); drawScreen(o);
    const ph = innerWidth < 640;   // no celular, os balões da frente não podem sair pela esquerda
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(ph && g[1] > 280 ? Math.max(g[0], 250) : g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('i3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra o conteúdo do cenário na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = sc === 'scan' || sc === 'btree' ? [10, 490, 8, 326] : [10, 670, 8, 326];
      const nar = NARROW(), asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = 500 / innerWidth;
      const aW = nar ? 1.02 : 0.97 - side, aH = nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 70) / 100 * 1.04 / (2 * tn * aH));
      const fx = nar ? 0.55 : side + aW / 2, fy = nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), R = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(R, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), T = C.addScaledVector(R, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), P = T.clone().addScaledVector(dir, D);
      controls.target.lerp(T, k); camera.position.lerp(P, k);
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, cur().dur + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear, e tinta escura sobre fundo
  // claro perde muito nessa conta (o contraste medido caía para ~2.5:1). No claro, a textura é lida crua e o shader converte
  // de sRGB depois de filtrar: a média fica em gama, como a tela reduz texto. No escuro, nada muda (decodificação normal).
  const CANV = () => [...IDS.map(id => TILE[id].top), ...SLAB.flatMap(S => [S.top, S.fr]), rootTop, fnTop, ...BK.map(B => B.top), ...TM.map(M => M.top), memTop, memFr, walTop, scr];
  const GAM = { value: 0 };
  CANV().forEach(cv => { cv.mesh.material.onBeforeCompile = sh => { sh.uniforms.uGam = GAM;
    sh.fragmentShader = 'uniform float uGam;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      if ( uGam > 0.5 ) sampledDiffuseColor.rgb = mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) );
      diffuseColor *= sampledDiffuseColor;
    #endif`); }; cv.mesh.material.needsUpdate = true; });
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; SLAB.forEach(S => S.key = ''); IDS.forEach(id => TILE[id].key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); headMat.color.copy(accent); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch index', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 165, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 165, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · index: C or 1 2 3 4 5 · drag to rotate' };
})() });
