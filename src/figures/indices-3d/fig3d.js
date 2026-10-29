// Figura 3D (iso-glow): índices. A Lena abre "Meus pedidos" e o banco precisa achar o pedido 1042 na tabela pedidos (6 linhas).
// Cena: ao fundo, o mostrador com a consulta SQL, a resposta e o contador de páginas lidas. Na frente, as páginas do disco
// (lajes de 8 KB com até 4 cartões de linha, ~2 KB cada). No meio, a estrutura do índice do cenário: raiz da B-Tree,
// função hash e 4 baldes, fichas do índice invertido, ou memtable + WAL da LSM (as lajes viram SSTables com bloom filter).
// Cenários (toggle e ?mode=scan|btree|lsm|hash|inverted; ?step=N abre no passo N): cada um tem um "e se der errado".
// Dados: a história canônica do módulo (docs/escrita/databases-brief.md). hash(id) = id é um exemplo didático.
FIGS3D.push({ id: 'indices', name: 'Índices', mod: (() => {
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
  const SCNAME = { scan: 'Varredura', btree: 'B-Tree', lsm: 'LSM', hash: 'Hash', inverted: 'Invertido' };
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
    heap: [{ lab: 'PÁGINA 1', sub: '8 KB · 4 linhas' }, { lab: 'PÁGINA 2', sub: '8 KB · 2 linhas' }, { vis: false }],
    btree: [{ lab: 'FOLHA 1', sub: 'página · 2 linhas' }, { lab: 'FOLHA 2', sub: 'página · 4 linhas' }, { vis: false }],
    lsm: [{ lab: 'SST-1', sub: 'bloom 10110100' }, { lab: 'SST-2', sub: 'bloom 00011010' }, { vis: false, lab: 'SST-3', sub: 'bloom 01001010' }],
  };
  function base() {
    const lay = sc === 'btree' ? 'btree' : sc === 'lsm' ? 'lsm' : 'heap';
    const o = { slabs: SLABDEF[lay].map(d => ({ vis: d.vis !== false, lab: d.lab, sub: d.sub, read: 0, note: '', tone: '' })),
      place: {}, st: {}, beams: [], head: null, tags: [], reads: 0, cmps: 0, cLab: 'linhas comparadas', million: '', milTone: 'acc',
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
  const done = (o, ...ss) => ss.forEach(s => { o.slabs[s].read = 2; o.slabs[s].note = 'lida ✓'; });
  const hits = (o, ids) => ids.forEach(id => o.st[id] = 'hit');
  const miss = (o, ids) => ids.forEach(id => o.st[id] = 'miss');
  const T = (o, x, y, z, text, tone = 'acc') => o.tags.push([x, y, z, text, tone]);
  const res1 = o => o.res = [rowLine(1042)];

  const STEPS = {
    scan: [
      { id: 'ask', dur: 3, title: 'Sem índice: só existe a tabela',
        story: 'A Lena abre "Meus pedidos" e o app pede ao banco o pedido 1042, o do gato de pelúcia. A tabela pedidos tem 6 linhas guardadas em 2 páginas de 8 KB, cada linha com uns 2 KB. Não existe índice nenhum: o banco só sabe onde as páginas começam.',
        look: 'As duas páginas no disco, com 4 e 2 linhas. O contador no mostrador está em zero.',
        key: 'Sem índice, o banco não sabe em que página está uma linha.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; if (t > 0.6) T(o, 236, 314, 28, '6 linhas em 2 páginas\nsem índice: onde está o 1042?', 'hi'); } },
      { id: 'p1', dur: 5, title: 'Lê a página 1 inteira',
        story: 'O banco traz a página 1 do disco e compara o id de cada linha com 1042: 1041 não, 1042 sim, 1043 não, 1044 não. Achou o pedido da Lena logo na segunda linha, mas a página inteira já tinha vindo, com as 4.',
        look: 'A página 1 acende, a barra passa linha por linha e o 1042 sobe.',
        key: 'O disco entrega a página inteira, nunca uma linha só.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; o.reads = readAt(o, 0, t, 0.3);
          o.cmps = sweep(o, HEAP[0], t, 0.8, 0.85, id => id === 1042); if (o.st[1042] === 'hit') res1(o);
          if (o.head) T(o, 300, slot(0, HEAP[0].indexOf(o.head))[1] + 12, 48, o.head === 1042 ? '1042 = 1042 ✓' : `${o.head} ≠ 1042`, o.head === 1042 ? 'acc' : 'dim');
          else if (t > 4.4) T(o, 116, 314, 28, '1 página lida\nainda falta a página 2'); } },
      { id: 'p2', dur: 4.5, title: 'E continua até o fim',
        story: 'Mesmo depois de achar, o banco segue para a página 2: sem índice ele não tem como saber que só existe um 1042. Compara 1045 e 1046 e só então para. Foram 2 páginas lidas e 6 linhas comparadas para devolver 1.',
        look: 'A página 2 acende e o contador chega a 2 páginas e 6 comparações.',
        key: 'Varredura completa (full scan): lê todas as páginas da tabela.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; done(o, 0); hits(o, [1042]); miss(o, [1041, 1043, 1044]); res1(o);
          o.reads = 1 + readAt(o, 1, t, 0.3); o.cmps = 4 + sweep(o, HEAP[1], t, 0.8, 0.85, () => false);
          if (o.head) T(o, 524, slot(1, HEAP[1].indexOf(o.head))[1] + 12, 48, `${o.head} ≠ 1042`, 'dim');
          if (t > 2.6) { done(o, 1); T(o, 340, 314, 28, '2 páginas · 6 comparações\npara devolver 1 linha'); } } },
      { id: 'scale', dur: 4, title: 'E se a loja crescer?',
        story: 'Com 6 pedidos, 2 páginas passam despercebidas. Com 1 milhão de pedidos, a 4 por página, a mesma consulta lê 250 000 páginas, cerca de 2 GB, para achar uma linha. Uma B-Tree no id leria umas 4 (aba B-Tree).',
        look: 'O balão sobre a página 2 conta as páginas que a tabela grande teria; o mostrador repete o número.',
        key: 'Full scan cresce com a tabela: o dobro de linhas, o dobro de páginas.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; done(o, 0, 1); hits(o, [1042]); miss(o, [1041, 1043, 1044, 1045, 1046]); res1(o); o.reads = 2; o.cmps = 6;
          if (t > 0.5) T(o, 340, 314, 28, 'com 1 milhão de pedidos:\n250 000 páginas · ~2 GB\n(B-Tree: ~4)', 'bad'); } },
    ],
    btree: [
      { id: 'tree', dur: 3.5, title: 'O índice B-Tree: uma árvore ordenada',
        story: 'Agora existe um índice B-Tree no id. A raiz guarda só a chave 1043, que divide as folhas: à esquerda ficam 1041 e 1042, à direita de 1043 a 1046. Aqui as folhas são as próprias páginas com as linhas, em ordem (índice clusterizado, como a chave primária do InnoDB).',
        look: 'A raiz [1043] ao fundo, ligada às duas folhas. As linhas trocaram de lugar: agora estão em ordem dentro das folhas.',
        key: 'B-Tree: chaves ordenadas em níveis; cada nível corta o caminho.',
        f(o, t) { o.million = '~4 páginas'; o.beams.push({ pts: R.rootL }, { pts: R.rootR }, { pts: R.sib });
          if (t > 0.8) T(o, 232, 88, 64, 'raiz: 1043\n< 1043 à esquerda · ≥ 1043 à direita'); } },
      { id: 'root', dur: 4, title: 'Lê a raiz: 1042 < 1043',
        story: 'Para achar o 1042, o banco começa pela raiz, que é 1 página. Compara: 1042 é menor que 1043, então segue o ponteiro da esquerda. A folha da direita nem é aberta.',
        look: 'A raiz acende e a ligação da esquerda leva a luz até a folha 1.',
        key: 'Uma comparação na raiz já descarta a folha da direita inteira.',
        f(o, t) { o.million = '~4 páginas'; o.idx.root = t > 0.3 ? 1 : 0; o.reads = t > 0.3 ? 1 : 0; o.cmps = t > 0.9 ? 1 : 0;
          o.beams.push({ pts: R.rootL, on: t > 1.2 }, { pts: R.rootR }, { pts: R.sib });
          if (t > 0.9) T(o, 232, 88, 64, '1042 < 1043 → esquerda'); } },
      { id: 'leaf', dur: 4.5, title: 'Lê a folha 1 e acha o 1042',
        story: 'A folha 1 chega do disco com 1041 e 1042, em ordem. O 1042 está ali e o banco para: as chaves são únicas e ordenadas, não há o que procurar depois. São 2 páginas, exatamente as mesmas 2 da varredura: com 6 linhas, a B-Tree empata.',
        look: 'A folha 1 acende e o 1042 sobe. A folha 2 fica apagada.',
        key: 'Com 6 linhas dá empate: 2 páginas contra 2 da varredura.',
        f(o, t) { o.million = '~4 páginas'; o.idx.root = 2; o.beams.push({ pts: R.rootL, on: true }, { pts: R.rootR }, { pts: R.sib });
          o.reads = 1 + readAt(o, 0, t, 0.3); o.cmps = 1 + sweep(o, LEAF[0], t, 0.8, 0.8, id => id === 1042);
          if (o.st[1042] === 'hit') res1(o);
          if (o.head) T(o, 300, slot(0, LEAF[0].indexOf(o.head))[1] + 12, 48, o.head === 1042 ? '1042 ✓' : '1041 ≠ 1042', o.head === 1042 ? 'acc' : 'dim');
          if (t > 2.6) { done(o, 0); T(o, 116, 314, 28, 'achou: raiz + folha 1\n= 2 páginas (empate com a varredura)'); } } },
      { id: 'scale', dur: 4, title: 'Empate aqui, distância lá',
        story: 'Com 6 pedidos, varredura e B-Tree leem as mesmas 2 páginas: o índice ainda não fez diferença. A diferença aparece quando a tabela cresce. Com 1 milhão de pedidos, a varredura lê 250 000 páginas; a B-Tree desce uns 4 níveis e lê ~4, porque cada página interna guarda centenas de chaves.',
        look: 'O balão da frente compara os dois números: empate com 6 linhas, 250 000 contra ~4 com 1 milhão.',
        key: 'A varredura cresce com a tabela; a B-Tree cresce com a altura da árvore, que quase não muda.',
        f(o, t) { o.million = '~4 páginas (varredura: 250 000)'; o.idx.root = 2; o.beams.push({ pts: R.rootL, on: true }, { pts: R.rootR }, { pts: R.sib });
          o.reads = 2; o.cmps = 3; hits(o, [1042]); miss(o, [1041]); done(o, 0); res1(o);
          if (t > 0.4) T(o, 230, 314, 28, t > 1.4 ? '6 linhas: empate, 2 × 2 páginas\n1 milhão: B-Tree ~4 × varredura 250 000' : '6 linhas: B-Tree 2 × varredura 2 (empate)', t > 1.4 ? 'acc' : 'hi'); } },
      { id: 'range', dur: 5.5, title: 'Intervalo: as folhas andam juntas', sql: SQLR,
        story: 'A loja quer os pedidos de 1042 a 1045. A B-Tree desce até o 1042 como antes e depois anda de lado: cada folha aponta para a vizinha, então 1043, 1044 e 1045 vêm na sequência, já em ordem. São 3 páginas: raiz, folha 1 e folha 2.',
        look: 'A ligação entre as folhas acende e os pedidos de 1042 a 1045 sobem em fila.',
        key: 'Ordem é o trunfo da B-Tree: intervalo e ORDER BY saem quase de graça.',
        f(o, t) { o.million = '~4 + as folhas do intervalo'; o.idx.root = 2; o.reads = (t > 0.3 ? 1 : 0) + readAt(o, 0, t, 0.6) + readAt(o, 1, t, 2.0);
          o.beams.push({ pts: R.rootL, on: t > 0.4 }, { pts: R.rootR }, { pts: R.sib, on: t > 1.7 });
          o.cmps = (t > 0.3 ? 1 : 0) + sweep(o, LEAF[0], t, 0.8, 0.5, id => id === 1042) + sweep(o, LEAF[1], t, 2.2, 0.5, id => id <= 1045);
          if (t > 1.8) done(o, 0); if (t > 4.4) done(o, 1);
          o.res = IDS.filter(id => o.st[id] === 'hit').length ? [`${IDS.filter(id => o.st[id] === 'hit').length} linhas: ${IDS.filter(id => o.st[id] === 'hit').join(', ')}`] : [];
          if (o.head === 1046) T(o, 524, slot(1, 3)[1] + 12, 48, '1046 > 1045: para', 'dim');
          if (t > 4.4) T(o, 340, 314, 28, '1042 → 1045\nraiz + 2 folhas = 3 páginas'); } },
      { id: 'other', dur: 6, title: 'E se der errado: buscar por outra coluna', sql: "SELECT * FROM pedidos\nWHERE cliente = 'Lena';",
        story: 'Agora a pergunta é pelo cliente: todos os pedidos da Lena. O índice está no id e não ajuda, porque a raiz só sabe dividir ids. O banco volta a ler as 2 folhas inteiras e comparar as 6 linhas, como na varredura. Para essa consulta seria preciso outro índice, no cliente.',
        look: 'A raiz fica apagada; as duas folhas acendem e só 1042 e 1044 sobem.',
        key: 'Um índice só serve para a coluna (ou o começo das colunas) em que foi criado.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; o.idx.root = -1; o.beams.push({ pts: R.rootL }, { pts: R.rootR }, { pts: R.sib, on: t > 2.4 });
          o.reads = readAt(o, 0, t, 0.6) + readAt(o, 1, t, 2.5); const lena = id => ROW[id][0] === 'Lena';
          o.cmps = sweep(o, LEAF[0], t, 1.0, 0.7, lena) + sweep(o, LEAF[1], t, 2.8, 0.7, lena);
          if (t > 0.3) T(o, 232, 88, 64, 'índice no id:\nnão sabe nada de cliente', 'bad');
          if (o.head) T(o, o.place[o.head][0] + 120, o.place[o.head][1] + 12, 48, ROW[o.head][0] === 'Lena' ? `${o.head}: Lena ✓` : `${o.head}: ${ROW[o.head][0]}`, ROW[o.head][0] === 'Lena' ? 'acc' : 'dim');
          if (t > 2.4) done(o, 0); if (t > 5.4) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.length ? [`${h.length} ${h.length > 1 ? 'linhas' : 'linha'}: ${h.join(', ')} (Lena)`] : []; } },
    ],
    hash: [
      { id: 'fn', dur: 3.5, title: 'Hash: uma conta diz o balde',
        story: 'Outro tipo de índice troca a árvore por uma conta. O banco passa a chave por uma função hash e usa o resto da divisão pelo número de baldes. Aqui são 4 baldes e, para dar para conferir de cabeça, o hash do exemplo devolve o próprio id: hash(1042) % 4 = 2.',
        look: 'A caixa da função mostra a conta e a luz corre até o balde 2.',
        key: 'Hash transforma a chave direto no número do balde, sem comparar nada.',
        f(o, t) { o.million = '2 páginas'; o.idx.fn = t > 0.4 ? 1 : 0; o.idx.bk = [0, 0, t > 1.4 ? 1 : 0, 0];
          [0, 1, 2, 3].forEach(k => o.beams.push({ pts: R.fn(k), on: k === 2 && t > 1.0 }));
          if (t > 0.6) T(o, 94, 142, 26, 'hash(1042) % 4\n= 1042 % 4 = 2'); } },
      { id: 'bucket', dur: 3.5, title: 'Lê o balde 2',
        story: 'O balde 2 é 1 página do índice. Dentro dele há duas entradas, porque 1046 % 4 também dá 2: o 1042 aponta para a página 1, byte 2048, e o 1046 para a página 2, byte 2048. O banco confere a chave e fica com a do 1042.',
        look: 'O balde 2 acende com as duas entradas; a do 1042 fica em destaque.',
        key: 'Duas chaves no mesmo balde é colisão: o banco confere a chave lá dentro.',
        f(o, t) { o.million = '2 páginas'; o.idx.fn = 2; o.idx.bk = [0, 0, t > 0.3 ? 1 : 0, 0]; o.idx.hi = t > 1.0 ? 1042 : 0;
          [0, 1, 2, 3].forEach(k => o.beams.push({ pts: R.fn(k), on: k === 2 }));
          o.reads = t > 0.3 ? 1 : 0; o.cmps = t > 1.0 ? 1 : 0;
          if (t > 1.0) T(o, 478, 142, 26, 'balde 2: 1042 → pág 1, byte 2048'); } },
      { id: 'fetch', dur: 4, title: 'Vai direto à linha',
        story: 'Com o endereço na mão, o banco lê a página 1 e pula para o byte 2048, onde começa a linha da Lena. São 2 páginas, e com 1 milhão de pedidos continuariam 2: o balde certo sai da conta, seja qual for o tamanho da tabela.',
        look: 'A luz sai do balde 2 até a página 1 e o 1042 sobe.',
        key: 'Para igualdade exata, o hash custa o mesmo com 6 ou 1 milhão de linhas.',
        f(o, t) { o.million = '2 páginas'; o.idx.fn = 2; o.idx.bk = [0, 0, 2, 0]; o.idx.hi = 1042;
          o.beams.push({ pts: R.bk2, on: t > 0.4 }); o.reads = 1 + readAt(o, 0, t, 0.9); o.cmps = 1;
          if (t > 1.5) { o.st[1042] = 'hit'; res1(o); done(o, 0); T(o, 116, 314, 28, 'byte 2048 → 1042 ✓\nbalde + página = 2'); } } },
      { id: 'range', dur: 6, title: 'E se der errado: um intervalo', sql: SQLR,
        story: 'Agora a loja pede de 1042 a 1045, o que a B-Tree resolveu andando pelas folhas. No hash, chaves vizinhas caem em baldes sem relação nenhuma: 1043 no 3, 1044 no 0, 1045 no 1. O índice não guarda ordem, então não serve: o banco volta à varredura das 2 páginas (com 1 milhão, 250 000).',
        look: 'Cada balde acende o seu pedaço do intervalo, espalhado; quem trabalha de verdade são as duas páginas.',
        key: 'Hash só responde "igual a". Para intervalo e ordem, B-Tree.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; o.idx.fn = 0; o.idx.bk = [3, 3, 3, 3]; o.idx.rng = true;
          if (t > 0.3) T(o, 440, 142, 30, '1042…1045 em 4 baldes diferentes\nsem ordem: o índice não serve', 'bad');
          o.reads = readAt(o, 0, t, 1.4) + readAt(o, 1, t, 3.4); const inR = id => id >= 1042 && id <= 1045;
          o.cmps = sweep(o, HEAP[0], t, 1.6, 0.45, inR) + sweep(o, HEAP[1], t, 3.6, 0.45, inR);
          if (t > 3.4) done(o, 0); if (t > 4.6) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.length ? [`${h.length} linhas: ${h.join(', ')} (varredura)`] : []; } },
    ],
    inverted: [
      { id: 'like', dur: 5.5, title: 'Buscar uma palavra sem índice', sql: "SELECT * FROM pedidos\nWHERE produto LIKE '%pelúcia%';",
        story: 'A Lena quer ver outros produtos de pelúcia e digita "pelúcia" na busca da loja. Sem índice de texto, o banco faz LIKE \'%pelúcia%\': lê as 2 páginas e procura a palavra dentro do texto de cada um dos 6 produtos. Acha 1042 e 1043, mas leu tudo.',
        look: 'As duas páginas acendem e a barra passa pelas 6 linhas; 1042 e 1043 sobem.',
        key: 'LIKE com % no começo não aproveita B-Tree: vira varredura.',
        f(o, t) { o.million = '250 000 páginas'; o.milTone = 'bad'; o.idx.inv = -1; const has = id => ROW[id][1].includes('pelúcia');
          o.reads = readAt(o, 0, t, 0.3) + readAt(o, 1, t, 2.9);
          o.cmps = sweep(o, HEAP[0], t, 0.6, 0.6, has) + sweep(o, HEAP[1], t, 3.1, 0.6, has);
          if (o.head) T(o, o.place[o.head][0] + 128, o.place[o.head][1] + 12, 48, `"${ROW[o.head][1]}" ${has(o.head) ? '✓' : '✕'}`, has(o.head) ? 'acc' : 'dim');
          if (t > 2.9) done(o, 0); if (t > 4.3) done(o, 1);
          const h = IDS.filter(id => o.st[id] === 'hit'); o.res = h.map(rowLine); } },
      { id: 'terms', dur: 4.5, title: 'O índice invertido: palavra → pedidos',
        story: 'O índice invertido faz o trabalho na hora de gravar. Cada produto é quebrado em termos: "gato de pelúcia" vira gato e pelúcia, e o "de" fica de fora. Para cada termo o índice guarda a lista, em ordem, dos pedidos que o contêm.',
        look: 'Seis fichas no meio, uma por termo, cada uma com a sua lista de ids.',
        key: 'Invertido: em vez de pedido → palavras, palavra → pedidos.',
        f(o, t) { o.million = '—'; o.idx.inv = -1; o.idx.show = Math.floor(clamp((t - 0.3) / 1.8) * 6 + 0.001);
          if (t > 2.2) T(o, 340, 142, 26, '"gato de pelúcia" → gato · pelúcia\n("de" fica de fora)', 'hi'); } },
      { id: 'lookup', dur: 3.5, title: 'Busca "pelúcia" no dicionário', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelúcia';",
        story: 'Agora a busca vai direto ao termo pelúcia, 1 página do índice, e lê a lista: [1042, 1043]. Nenhum produto foi aberto até aqui e o banco já sabe quais são.',
        look: 'A ficha "pelúcia" acende com 1042 e 1043.',
        key: 'A lista de ids (posting list) é a resposta antes de abrir a tabela.',
        f(o, t) { o.million = '1 + as páginas dos achados'; o.idx.inv = t > 0.3 ? 4 : -1; o.reads = t > 0.3 ? 1 : 0;
          if (t > 0.6) T(o, 498, 142, 26, 'pelúcia → [1042, 1043]'); } },
      { id: 'fetch', dur: 4, title: 'Busca as duas linhas', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelúcia';",
        story: 'Com os ids, o banco abre só a página 1, onde estão o pedido da Lena e o da Bia. São 2 páginas no total. A busca devolve o gato de pelúcia da Lena (1042) e o da Bia (1043).',
        look: 'A luz sai da ficha até a página 1; 1042 e 1043 sobem e a página 2 fica apagada.',
        key: 'Busca de texto rápida = dicionário de termos + listas de ids.',
        f(o, t) { o.million = '1 + as páginas dos achados'; o.idx.inv = 4; o.beams.push({ pts: R.term, on: t > 0.4 }); o.reads = 1 + readAt(o, 0, t, 1.0);
          if (t > 1.4) o.st[1042] = 'hit'; if (t > 1.7) o.st[1043] = 'hit'; o.res = [1042, 1043].filter(id => o.st[id] === 'hit').map(rowLine);
          if (t > 2.0) { done(o, 0); T(o, 116, 314, 28, '1 página do índice\n+ a página 1 = 2'); } } },
      { id: 'accent', dur: 4.5, title: 'E se der errado: "pelucia" sem acento', sql: "SELECT * FROM pedidos\nWHERE produto @@ 'pelucia';",
        story: 'No celular, a Lena digita "pelucia", sem acento. O termo pelucia não existe no dicionário e a busca volta vazia, com dois gatos de pelúcia na tabela. Por isso o índice normaliza o texto na gravação e na busca (minúsculas, sem acento): os dois lados viram "pelucia" e se encontram.',
        look: 'Nenhuma ficha acende e o balão mostra "pelucia" sem par no dicionário.',
        key: 'O índice só acha o termo exatamente como foi guardado: normalizar é metade do trabalho.',
        f(o, t) { o.million = '—'; o.idx.inv = t > 0.4 ? -2 : -1; o.reads = t > 0.4 ? 1 : 0; o.res = t > 1.0 ? ['0 linhas'] : [];
          if (t > 0.6) T(o, 498, 142, 26, '"pelucia" ≠ "pelúcia"\nnão está no dicionário ✕', 'bad');
          if (t > 2.4) T(o, 340, 314, 28, 'normalizando nas duas pontas:\npelúcia → pelucia = acha'); } },
    ],
    lsm: [
      { id: 'wal', dur: 4.5, title: 'Escrita: primeiro o WAL', sql: "INSERT INTO pedidos VALUES\n(1046, 'Bia', 'caneca azul', 1, 19.90, 'SP');",
        story: 'Em bancos com LSM Tree, como Cassandra e RocksDB, o que precisa ser rápido é escrever. Chega o pedido 1046, da Bia. Antes de tudo ele é anotado no fim do WAL, um arquivo em que só se acrescenta: gravar no fim é sequencial e barato, e se a máquina cair o pedido está salvo ali.',
        look: 'O 1046 entra pela esquerda e uma linha nova aparece no fim do WAL.',
        key: 'WAL: anotar antes, para não perder nada se cair.',
        f(o, t) { o.million = '—'; o.cLab = 'escritas no disco'; o.idx.wal = t > 1.4 ? 2 : 1; o.idx.walHi = t > 1.4;
          o.beams.push({ pts: R.inWal, on: t > 0.4 && t < 2.4 }, { pts: R.inMem });
          if (t > 0.2) o.place[1046] = t < 1.4 ? [-80, 60, 80] : [478, 62, 30];
          o.st[1046] = 'cmp'; o.cmps = t > 1.4 ? 1 : 0;
          if (t > 1.6) T(o, 460, 142, 26, 'WAL #2: PUT 1046\nacrescentado no fim'); } },
      { id: 'mem', dur: 4, title: 'E entra na memtable', sql: "INSERT INTO pedidos VALUES\n(1046, 'Bia', 'caneca azul', 1, 19.90, 'SP');",
        story: 'Logo depois, o 1046 entra na memtable, uma tabela em memória sempre ordenada pelo id. Ela já tinha o 1045 e agora está cheia (aqui o limite é 2 linhas, para caber no desenho). Nenhuma página do disco foi lida nem reescrita.',
        look: 'O 1046 pousa na memtable logo abaixo do 1045; a etiqueta mostra 2 de 2.',
        key: 'Memtable: as escritas recentes, em memória e em ordem.',
        f(o, t) { o.million = '—'; o.cLab = 'escritas no disco'; o.cmps = 1; o.idx.wal = 2; o.idx.mem = t > 1.2 ? 'full' : '';
          o.beams.push({ pts: R.inWal }, { pts: R.inMem, on: t > 0.2 && t < 2 });
          o.place[1046] = t < 0.3 ? [478, 62, 30] : memSlot(1); if (t < 1.4) o.st[1046] = 'cmp';
          if (t > 1.2) T(o, 134, 142, 30, 'memtable 2 de 2: cheia\n1045 · 1046 em ordem', 'acc'); } },
      { id: 'flush', dur: 4.5, title: 'Memtable cheia: vira SSTable', sql: '-- flush (o banco faz sozinho)',
        story: 'Cheia, a memtable é despejada no disco de uma vez, como um arquivo novo e ordenado: a SST-3, com 1045 e 1046. Esse arquivo nunca mais muda (SSTable = Sorted String Table, imutável). A memtable volta vazia e o trecho do WAL que ela cobria pode ir embora.',
        look: 'Os dois cartões descem da memtable para a SST-3, à direita.',
        key: 'Flush: memória cheia vira um arquivo ordenado e imutável no disco.',
        f(o, t) { o.million = '—'; o.cLab = 'escritas no disco'; o.idx.wal = 2; o.idx.walDrop = t > 2.4; o.idx.mem = t > 1.6 ? 'empty' : 'full';
          o.place[1046] = memSlot(1); if (t > 0.5) { o.slabs[2].vis = true; o.slabs[2].note = 'nova'; o.slabs[2].tone = 'acc'; }
          if (t > 0.8) o.put(2, [1045, 1046]); if (t > 0.6 && t < 2.4) { o.st[1045] = o.st[1046] = 'cmp'; }
          o.beams.push({ pts: R.flush, on: t > 0.4 && t < 2.4 }); o.cmps = t > 1.6 ? 2 : 1;
          if (t > 2.0) T(o, 564, 314, 28, 'SST-3: 1045 · 1046\nordenada · imutável'); } },
      { id: 'compact', dur: 5, title: 'Compactação: juntar arquivos', sql: '-- compactação (em segundo plano)',
        story: 'Arquivo imutável que só se acumula deixa a leitura cada vez mais cara. Em segundo plano, a compactação junta SST-2 e SST-3 numa só, a SST-4 (1044, 1045, 1046), intercalando as listas já ordenadas, e apaga as duas antigas. Se um id aparecesse nas duas, ficaria só a versão mais nova.',
        look: 'Os cartões da SST-3 deslizam para a SST-2, que passa a se chamar SST-4.',
        key: 'Compactação troca muitos arquivos pequenos por poucos grandes.',
        f(o, t) { o.million = '—'; o.cLab = 'escritas no disco'; o.idx.wal = 0; o.idx.mem = 'empty'; o.cmps = 2 + (t > 2.2 ? 1 : 0);
          o.slabs[2].vis = t < 2.2; o.put(2, [1045, 1046]); if (t > 0.5) { o.slabs[1].read = 1; o.slabs[2].read = 1; }
          if (t > 1.0) o.put(1, [1044, 1045, 1046]); o.beams.push({ pts: R.merge, on: t > 0.6 && t < 2.2 });
          if (t > 2.2) { o.slabs[1].lab = 'SST-4'; o.slabs[1].sub = 'bloom 01001011'; o.slabs[1].note = 'nova'; o.slabs[1].tone = 'acc'; o.slabs[1].read = 0; }
          if (t > 0.8) T(o, 452, 314, 28, 'SST-2 + SST-3 → SST-4\n1044 · 1045 · 1046'); } },
      { id: 'read', dur: 6, title: 'Leitura: do mais novo ao mais antigo',
        story: 'Agora a Lena abre o pedido 1042. A leitura vai do mais novo para o mais antigo: primeiro a memtable (vazia), depois a SST-4. O bloom filter da SST-4, um resumo em bits que fica na memória, responde "com certeza não tem" e o arquivo nem é aberto. O da SST-1 responde "talvez": o banco lê 1 página e acha o 1042.',
        look: 'A luz passa pela memtable, a SST-4 diz "não" e fica apagada, a SST-1 acende e o 1042 sobe.',
        key: 'Bloom filter diz "não tem" com certeza, ou "talvez tenha".',
        f(o, t) { o.million = '1 por SSTable com "talvez"'; lsmRead(o, t, true); } },
      { id: 'nobloom', dur: 6, title: 'E se não houvesse bloom filter',
        story: 'Sem o bloom filter, o banco teria que abrir a SST-4 para descobrir que o 1042 não está lá: 2 páginas em vez de 1. Com 10 SSTables, seriam até 10. O bloom também erra, mas só para um lado: às vezes diz "talvez" e o arquivo não tem; nunca diz "não" para o que tem.',
        look: 'A SST-4 acende também e é lida à toa: o contador vai a 2.',
        key: 'LSM escreve barato e paga na leitura; bloom e compactação seguram essa conta.',
        f(o, t) { o.million = '1 página por SSTable'; o.milTone = 'bad'; lsmRead(o, t, false); } },
    ],
  };
  function lsmRead(o, t, bloom) {
    o.idx.mem = 'empty'; o.idx.wal = 0; o.put(1, [1044, 1045, 1046]); o.slabs[1].lab = 'SST-4'; o.slabs[1].sub = 'bloom 01001011';
    o.beams.push({ pts: R.qMem, on: t > 0.3 && t < 1.4 }, { pts: R.qS1, on: t > 1.4 && t < (bloom ? 2.4 : 3.2) }, { pts: R.qS0, on: t > (bloom ? 2.6 : 3.4) });
    if (t > 0.5 && t < 1.6) T(o, 134, 142, 30, 'memtable: vazia', 'dim');
    if (bloom) {
      if (t > 1.5) { o.slabs[1].note = '1042? não'; o.slabs[1].tone = 'bad'; }
      if (t > 1.6 && t < 2.8) T(o, 340, 314, 28, 'bloom da SST-4: não tem\npula sem abrir', 'dim');
      if (t > 2.6) { o.slabs[0].note = '1042? talvez'; o.slabs[0].tone = 'acc'; }
      o.reads = readAt(o, 0, t, 3.0); o.cmps = sweep(o, [1041, 1042], t, 3.3, 0.6, id => id === 1042);
      if (t > 4.6) { done(o, 0); T(o, 116, 314, 28, 'SST-1: 1042 ✓\n1 página lida'); }
    } else {
      o.slabs[0].sub = o.slabs[1].sub = 'sem bloom';
      o.reads = readAt(o, 1, t, 1.6) + readAt(o, 0, t, 3.6);
      o.cmps = sweep(o, [1044, 1045, 1046], t, 1.9, 0.42, () => false) + sweep(o, [1041, 1042], t, 3.9, 0.5, id => id === 1042);
      if (t > 3.2) { o.slabs[1].read = 2; o.slabs[1].note = 'lida à toa'; o.slabs[1].tone = 'bad'; }
      if (t > 3.2 && t < 4.8) T(o, 340, 314, 28, 'SST-4 aberta à toa:\n1042 não estava lá', 'bad');
      if (t > 5.0) { done(o, 0); T(o, 116, 314, 28, 'SST-1: 1042 ✓\n2 páginas lidas', 'bad'); }
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
    x.textAlign = 'left'; x.fillStyle = dim ? INK() : C.inkHi; x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText(`${r[1]} · ${r[2]} un · ${r[3]} · ${r[4]}`, u(4), u(17.2));
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
      x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('RAIZ · 1 página', u(5), u(7));
      x.textAlign = 'center'; x.fillStyle = I.root === -1 ? INK() : acc; x.font = `600 ${u(17)}px ${MONO3}`; x.fillText('[ 1043 ]', u(89), u(24));
      x.font = `600 ${u(7)}px ${MONO3}`; x.fillStyle = C.inkHi; x.textAlign = 'left'; x.fillText('← < 1043', u(5), u(42)); x.textAlign = 'right'; x.fillText('≥ 1043 →', u(173), u(42));
      rootTop.tex.needsUpdate = true; rootMat.emissiveIntensity = I.root === 1 ? 0.6 : I.root === 2 ? 0.2 : 0; }
    if (sc === 'hash') {
      if (once('fn', I.fn + thm)) { const { x, u, C } = frameBox(fnTop, I.fn > 0); x.textAlign = 'left';
        x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('FUNÇÃO HASH', u(5), u(7));
        x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('hash(id) % 4', u(5), u(22));
        x.fillStyle = I.fn > 0 ? acc : INK(); x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(I.fn > 0 ? '1042 % 4 = 2' : 'hash(id) = id', u(5), u(37));
        x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('(exemplo didático)', u(5), u(51)); fnTop.tex.needsUpdate = true; fnMat.emissiveIntensity = I.fn === 1 ? 0.6 : I.fn === 2 ? 0.2 : 0; }
      BK.forEach((B, k) => { const lv = (I.bk || [])[k] || 0; if (!once('bk' + k, lv + '|' + I.hi + '|' + I.rng + thm)) return;
        const { x, u, C } = frameBox(B.top, lv === 1 || lv === 2 || lv === 3); x.textAlign = 'left';
        x.fillStyle = lv ? acc : C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('BALDE ' + k, u(5), u(7.5));
        BUCK[k].forEach((id, j) => { const a = heapAt(id), hi = I.hi === id || (I.rng && id >= 1042 && id <= 1045);
          x.fillStyle = hi ? acc : C.inkHi; x.font = `600 ${u(12)}px ${MONO3}`; x.fillText(String(id), u(5), u(22 + j * 20));
          x.fillStyle = hi ? acc : INK(); x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(`→ pág ${a.p + 1} · ${a.off}`, u(5), u(32 + j * 20)); });
        B.top.tex.needsUpdate = true; B.mat.emissiveIntensity = lv === 1 ? 0.6 : lv ? 0.2 : 0; });
    }
    if (sc === 'inverted') TM.forEach((M, k) => { const show = I.show == null ? 6 : I.show; M.g.visible = step > 0 && k < show;
      const on = I.inv === k; if (!once('tm' + k, on + '|' + I.inv + thm)) return;
      const { x, u, C } = frameBox(M.top, on); const [term, ids] = TERMS[k]; x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('TERMO', u(5), u(7));
      x.fillStyle = on ? acc : C.inkHi; x.font = `600 ${u(term.length > 7 ? 13 : 15)}px ${MONO3}`; x.fillText(term, u(5), u(22));
      x.fillStyle = on ? acc : INK(); x.font = `600 ${u(9)}px ${MONO3}`; ids.forEach((id, j) => x.fillText(String(id), u(5 + (j % 2) * 44), u(39 + Math.floor(j / 2) * 13)));
      M.top.tex.needsUpdate = true; M.mat.emissiveIntensity = on ? 0.7 : 0; });
    if (sc === 'lsm') {
      if (once('mem', I.mem + thm)) { { const { x, u, C } = frameBox(memTop, false); x.textAlign = 'center'; x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`;
          [0, 1].forEach(k => { x.setLineDash([u(1.6), u(1.2)]); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(21), u(9 + k * 32), u(172), u(25)); x.setLineDash([]); x.fillText('livre', u(107), u(21.5 + k * 32)); });
          memTop.tex.needsUpdate = true; }
        const cv = memFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
        x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('MEMTABLE', u(3), u(6.4));
        x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText('memória (RAM) · ordenada', u(52), u(6.6));
        x.textAlign = 'right'; x.fillStyle = I.mem === 'full' ? WARN() : accC(); x.font = `600 ${u(7)}px ${MONO3}`; x.fillText(I.mem === 'full' ? '2 de 2 · cheia' : I.mem === 'empty' ? '0 de 2' : '1 de 2', u(211), u(6.6));
        cv.tex.needsUpdate = true; memMat.emissiveIntensity = I.mem === 'full' ? 0.35 : 0; }
      if (once('wal', I.wal + '|' + I.walHi + '|' + I.walDrop + thm)) { const { x, u, C } = frameBox(walTop, I.walHi); x.textAlign = 'left';
        x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('WAL', u(5), u(8)); x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('disco · só acrescenta no fim', u(30), u(8.4));
        const lines = [['#1', 'PUT 1045 · Davi · camiseta preta · 147.00'], ['#2', 'PUT 1046 · Bia · caneca azul · 19.90']];
        lines.slice(0, I.wal || 0).forEach(([n, l], j) => { const y = 24 + j * 14, hi = I.walHi && j === 1;
          x.fillStyle = I.walDrop ? INK() : hi ? accC() : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText(`${n}  ${l}`, u(5), u(y));
          if (I.walDrop) { const w = x.measureText(`${n}  ${l}`).width; x.strokeStyle = INK(); x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(5), u(y)); x.lineTo(u(5) + w, u(y)); x.stroke(); } });
        if (!I.wal) { x.fillStyle = INK(); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('(vazio: o que estava aqui já foi para as SSTables)', u(5), u(26)); }
        if (I.walDrop) { x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText('já está na SST-3: pode ser descartado', u(5), u(56)); }
        walTop.tex.needsUpdate = true; walMat.emissiveIntensity = I.walHi ? 0.4 : 0; }
    }
  }
  function drawScreen(o) {
    const key = JSON.stringify([o.sql, o.res, o.reads, o.cmps, o.cLab, o.million, o.milTone, sc]) + theme + accent.getHex(); if (once('scr', key) === false) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const L0 = 228;
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('PÁGINAS LIDAS ATÉ AGORA', u(8), u(9));
    x.fillStyle = acc; x.font = `600 ${u(38)}px ${MONO3}`; x.fillText(String(o.reads), u(8), u(37));
    x.fillStyle = INK(); x.font = `600 ${u(6.8)}px ${MONO3}`; x.fillText(o.cLab, u(80), u(27)); x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(String(o.cmps), u(80), u(41));
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('COM 1 MILHÃO DE PEDIDOS', u(8), u(66));
    x.fillStyle = o.milTone === 'bad' ? BAD() : o.million === '—' ? INK() : acc; let mf = 12; x.font = `600 ${u(mf)}px ${MONO3}`;
    const mw = x.measureText(o.million).width; if (mw > u(214)) { mf *= u(214) / mw; x.font = `600 ${u(mf)}px ${MONO3}`; } x.fillText(o.million, u(8), u(81));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(94)); x.stroke();
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('CONSULTA · ' + SCNAME[sc].toUpperCase(), u(L0), u(9));
    const sl = o.sql.split('\n'), fs = Math.max(...sl.map(l => l.length)) > 34 ? 8 : 10.5;
    x.fillStyle = C.inkHi; x.font = `600 ${u(fs)}px ${MONO3}`; sl.forEach((l, i) => x.fillText(l, u(L0), u(24 + i * (fs + 4))));
    x.fillStyle = INK(); x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText('RESPOSTA', u(L0), u(62));
    x.font = `600 ${u(o.res.length > 1 ? 6.4 : 7)}px ${MONO3}`; x.fillStyle = o.res.length ? acc : INK();
    (o.res.length ? o.res : ['procurando…']).slice(0, 2).forEach((l, i) => x.fillText(l, u(L0), u(75 + i * 11)));
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const heapTable = (hi = []) => `<table class="h3-sum"><tr><th>pág</th><th>byte</th><th>id</th><th>cliente</th><th>produto</th><th>valor</th></tr>${IDS.map(id => { const a = heapAt(id), r = ROW[id];
    return `<tr${hi.includes(id) ? ' class="on"' : ''}><td>${a.p + 1}</td><td>${a.off}</td><td>${id}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[3]}</td></tr>`; }).join('')}</table>`;
  const EX = '<li class="h3-dim">Tabela, páginas e chaves são o exemplo do módulo. Página de 8 KB como no PostgreSQL (o InnoDB usa 16 KB); cada linha ocupa ~2 KB para caberem 4 por página.</li>';
  const DATA = {
    scan: () => heapTable([1042]) + `<li>Páginas lidas: <b>2</b> de 2 · linhas comparadas: <b>6</b> · devolvidas: <b>1</b></li><li>1 milhão de pedidos ÷ 4 por página = <b>250 000 páginas</b> (≈ 2 GB); com B-Tree no id, <b>~4</b>. Com 6 linhas os dois leem 2 (empate).</li>${EX}`,
    btree: () => `<li>Raiz: <b>[1043]</b> · folha 1: <b>1041, 1042</b> · folha 2: <b>1043, 1044, 1045, 1046</b></li><li>id = 1042: raiz → folha 1 = <b>2 páginas</b></li><li>BETWEEN 1042 AND 1045: raiz → folha 1 → folha 2 = <b>3 páginas</b></li><li>cliente = 'Lena': o índice no id não ajuda → <b>2 folhas, 6 comparações</b></li><li>No PostgreSQL o índice fica separado da tabela: a folha guarda o endereço da linha (ctid) e a busca lê mais 1 página da tabela.</li><li>Com 6 linhas: B-Tree 2 páginas, varredura 2 páginas (<b>empate</b>).</li><li>Com 1 milhão: varredura <b>250 000</b> páginas, B-Tree <b>~4</b> (cada página interna guarda centenas de chaves).</li>${EX}`,
    hash: () => `<table class="h3-sum"><tr><th>balde</th><th>entradas (id → pág · byte)</th></tr>${BUCK.map((b, k) => `<tr${k === 2 ? ' class="on"' : ''}><td>${k}</td><td>${b.map(id => { const a = heapAt(id); return `${id} → ${a.p + 1} · ${a.off}`; }).join(' &nbsp; ')}</td></tr>`).join('')}</table><li>hash(id) % 4 com <b>hash(id) = id</b> (exemplo didático; um banco usa uma função que espalha melhor)</li><li>id = 1042: balde 2 + página 1 = <b>2 páginas</b></li><li>Intervalo: o hash não guarda ordem → <b>varredura</b></li>${EX}`,
    inverted: () => `<table class="h3-sum"><tr><th>termo</th><th>pedidos (posting list)</th></tr>${TERMS.map(([t, ids]) => `<tr${t === 'pelúcia' ? ' class="on"' : ''}><td>${t}</td><td>${ids.join(', ')}</td></tr>`).join('')}</table><li>"de" é stopword: fica fora do índice.</li><li>"pelúcia": 1 página do índice + página 1 = <b>2 páginas</b>; sem índice, LIKE lê <b>2 páginas e 6 textos</b></li><li>No PostgreSQL, <b>@@</b> é a busca de texto e o índice <b>GIN</b> é um índice invertido.</li>${EX}`,
    lsm: () => `<table class="h3-sum"><tr><th>onde</th><th>o que tem</th></tr><tr><td>WAL</td><td>#1 PUT 1045 · #2 PUT 1046</td></tr><tr><td>memtable</td><td>1045, 1046 (limite 2) → flush</td></tr><tr><td>SST-1</td><td>1041, 1042, 1043 · bloom 10110100</td></tr><tr><td>SST-2 + SST-3</td><td>1044 + 1045, 1046 → SST-4 · bloom 01001011</td></tr></table><li>Bloom filter de 8 bits; 1042 liga os bits 0 e 2. SST-1 tem os dois em 1 → <b>talvez</b>. SST-4 tem os dois em 0 → <b>não tem</b>.</li><li>Leitura do 1042: memtable → SST-4 (pula) → SST-1 = <b>1 página</b>; sem bloom, <b>2</b>.</li><li>Limite de 2 linhas na memtable e bloom de 8 bits são exemplos; na prática a memtable tem dezenas de MB.</li>${EX}`,
  };
  const titleOf = () => cur().title;
  function countHtml() { const o = SP || spec(); return `<b>${o.reads}</b><span>${o.reads === 1 ? 'página lida' : 'páginas lidas'} até agora</span><i>· ${o.cmps} ${o.cmps === 1 ? o.cLab.replace('linhas comparadas', 'linha comparada').replace('escritas', 'escrita') : o.cLab}</i>`; }
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Tipo de índice">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${titleOf()}</h2>
      <div class="i3-count" id="i3count">${countHtml()}</div>
      <div class="i3-sql"><b>Comando SQL</b>${o.sql.replace(/</g, '&lt;')}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'indices') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.reads} ${o.reads === 1 ? 'página lida' : 'páginas lidas'}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar índice', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 165, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 165, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · índice: C ou 1 2 3 4 5 · arraste para girar' };
})() });
