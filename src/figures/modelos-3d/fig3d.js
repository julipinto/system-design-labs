// Figura 3D (iso-glow): Modelos de dados. A mesma tabela pedidos (6 linhas; a linha-estrela é o pedido 1042, da Lena) guardada de sete jeitos.
// Cena: à esquerda, no fundo, o terminal do app da loja: mostra a consulta, a resposta do banco e um contador (páginas, bytes, arquivos lidos).
// À direita, o banco muda de forma com o modo: páginas de 8 KB com linhas inteiras (row), documentos JSON por cliente (doc),
// um arquivo por coluna (column), partições com colunas dinâmicas (wide), chaves com blobs opacos (kv), nós e arestas COMPROU (graph)
// e páginas de 8 KB × 16 KB com uma linha grande que transborda para o TOAST (page).
// ?mode=row|doc|column|wide|kv|graph|page escolhe o cenário inicial (funciona junto com embed=1).
// Dados: os do brief do módulo (docs/escrita/databases-brief.md). Tamanhos (~2 KB por linha, 8 B por valor, token) são exemplos didáticos.
FIGS3D.push({ id: 'modelos', name: 'Modelos', mod: (() => {
  const ZOFF = () => innerWidth < 640 ? -300 : innerWidth < 900 ? -250 : -205;   // no celular/embed, o painel ocupa a parte de baixo
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const PED = [
    { id: 1041, cli: 'Caio', prod: 'caneca azul', qtd: 2, val: '39.80', cid: 'Rio' },
    { id: 1042, cli: 'Lena', prod: 'gato de pelúcia', qtd: 1, val: '89.90', cid: 'Recife' },
    { id: 1043, cli: 'Bia', prod: 'gato de pelúcia', qtd: 1, val: '89.90', cid: 'SP' },
    { id: 1044, cli: 'Lena', prod: 'caneca azul', qtd: 1, val: '19.90', cid: 'Recife' },
    { id: 1045, cli: 'Davi', prod: 'camiseta preta', qtd: 3, val: '147.00', cid: 'SP' },
    { id: 1046, cli: 'Bia', prod: 'caneca azul', qtd: 1, val: '19.90', cid: 'SP' },
  ];
  const RUN = ['39.80', '129.70', '219.60', '239.50', '386.50', '406.40'];      // soma acumulada, na ordem dos ids
  const SC = ['row', 'doc', 'column', 'wide', 'kv', 'graph', 'page'];
  const SCBTN = { row: 'Linha', doc: 'Doc', column: 'Coluna', wide: 'Wide', kv: 'KV', graph: 'Grafo', page: 'Página' };
  const SCNAME = { row: 'Modelo de linhas (tuplas)', doc: 'Modelo de documentos', column: 'Modelo colunar', wide: 'Coluna larga (wide-column)', kv: 'Chave-valor', graph: 'Grafo', page: 'Páginas de 8 KB e 16 KB' };
  const LESSON = { row: 'aula-4-modelo-de-tuplas', doc: 'aula-5-modelo-de-documentos', column: 'aula-6-modelo-colunar', wide: 'aula-7-coluna-larga', kv: 'aula-8-chave-valor', graph: 'aula-9-grafos', page: 'aula-10-page-size-e-indexacao-colunar' };

  // ── geometria (unidades iso) ──
  plateWith(g0, 820, 310, [[18, 18], [802, 18], [18, 292], [802, 292]]);
  const mkGroup = (id, parent = g0) => { const g = new THREE.Group(); if (id) g.userData.go = id; parent.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };
  const CVS = [];
  const fc = (...a) => { const c = faceCanvas(...a); CVS.push(c); return c; };
  const G = {}; for (const k of SC) { G[k] = mkGroup('sto'); }

  // terminal do app da loja (comum a todos os modos)
  const conG = mkGroup('con');
  rbox(20, 30, 7, 180, 28, 150, 6, bodyMat, conG);
  const conScr = fc('front', 25, 58, 152, 170, 140, 5, conG);
  const conCap = glowCap(26, 34, 157, 168, 20, 3, 3, conG);
  const CON_IN = [110, 44, 168];

  // row: duas páginas de 8 KB, 4 vagas de ~2 KB cada; cada linha é um bloco com os 6 campos
  const TRX = [214, 508], SLOT = s => 74 + s * 54;
  const rowTray = TRX.map(x => { rbox(x, 30, 7, 280, 262, 6, 6, bodyMat, G.row); return fc('top', x + 3, 33, 13, 274, 256, 4, G.row); });
  const ROWB = PED.map((p, i) => { const g = mkGroup('row', G.row), x = TRX[i < 4 ? 0 : 1] + 6, y = SLOT(i % 4);
    const cap = glowCap(x, y, 14, 268, 46, 12, 4, g); const cv = fc('top', x + 2, y + 2, 26, 264, 42, 6, g); return { g, cap, cv, c: [x + 134, y + 23, 26], v: [x + 2 + 204, y + 23, 26] }; });

  // doc: coleção clientes, um documento (cartão em pé) por cliente
  const DOCS = [
    { k: 'caio', x: 232, w: 100, h: 150, peds: [0] }, { k: 'lena', x: 346, w: 210, h: 214, peds: [1, 3] },
    { k: 'bia', x: 570, w: 100, h: 150, peds: [2, 5] }, { k: 'davi', x: 684, w: 100, h: 150, peds: [4] }];
  DOCS.forEach(d => { d.g = mkGroup('doc', G.doc); d.cap = glowCap(d.x, 50, 7, d.w, 14, d.h, 4, d.g); d.cv = fc('front', d.x + 3, 64, 7 + d.h - 3, d.w - 6, d.h - 6, 6, d.g); d.top = [d.x + d.w / 2, 57, 7 + d.h]; });
  inset(222, 34, 7, 572, 48, 6, G.doc);

  // column: um arquivo por coluna, 6 valores em cada, na mesma posição
  const COLK = ['id', 'cli', 'prod', 'qtd', 'val', 'cid'], COLN = ['id', 'cliente', 'produto', 'qtd', 'valor', 'cidade'], COLW = [58, 70, 122, 46, 76, 80];
  let cx0 = 236;
  const FILES = COLK.map((k, i) => { const x = cx0, w = COLW[i]; cx0 += w + 14; const g = mkGroup('col', G.column);
    const cap = glowCap(x, 30, 7, w, 262, 10, 5, g); const cv = fc('top', x + 2, 32, 17, w - 4, 258, 6, g); return { k, x, w, g, cap, cv }; });
  const cellY = s => 32 + 30 + s * 37 + 16;

  // wide: uma partição por cliente, com uma coluna por pedido
  const PARTS = [{ k: 'Caio', cols: [0] }, { k: 'Lena', cols: [1, 3] }, { k: 'Bia', cols: [2, 5] }, { k: 'Davi', cols: [4] }];
  PARTS.forEach((p, i) => { const y = 34 + i * 66; p.y = y; p.g = mkGroup('part', G.wide);
    p.kcap = glowCap(232, y, 7, 104, 54, 18, 4, p.g); p.kcv = fc('top', 234, y + 2, 25, 100, 50, 6, p.g);
    p.cells = p.cols.map((r, j) => { const x = 346 + j * 200; return { r, x, cap: glowCap(x, y, 7, 190, 54, 12, 4, p.g), cv: fc('top', x + 2, y + 2, 19, 186, 50, 6, p.g), c: [x + 95, y + 27, 19] }; }); });

  // kv: quatro chaves, cada valor é uma caixa fechada de bytes
  const KV = [
    { k: 'carrinho:lena', v: '{1042}', hex: '7b 31 30 34 32 7d', n: 6, x: 236, y: 36 },
    { k: 'sessao:lena', v: 'tok_9f2c', hex: '74 6f 6b 5f 39 66 32 63', n: 8, ttl: true, x: 508, y: 36 },
    { k: 'carrinho:bia', v: '{1043}', hex: '7b 31 30 34 33 7d', n: 6, x: 236, y: 164 },
    { k: 'sessao:caio', v: 'tok_41ab', hex: '74 6f 6b 5f 34 31 61 62', n: 8, ttl: true, x: 508, y: 164 }];
  const kvSlot = fc('top', 510, 38, 7.4, 248, 108, 3, G.kv);
  KV.forEach(o => { o.g = mkGroup('kv', G.kv); o.cap = glowCap(o.x, o.y, 7, 252, 112, 34, 6, o.g); o.cv = fc('top', o.x + 2, o.y + 2, 41, 248, 108, 5, o.g); o.c = [o.x + 126, o.y + 56, 41]; });

  // graph: pessoas à esquerda, produtos à direita, arestas COMPROU no chão
  const PEO = ['Caio', 'Lena', 'Bia', 'Davi'].map((n, i) => ({ n, x: 236, y: 36 + i * 68, w: 100, d: 50 }));
  const PRO = ['caneca azul', 'gato de pelúcia', 'camiseta preta'].map((n, i) => ({ n, x: 586, y: 44 + i * 97, w: 170, d: 56 }));
  [...PEO, ...PRO].forEach(o => { o.g = mkGroup('node', G.graph); o.cap = glowCap(o.x, o.y, 7, o.w, o.d, 22, 8, o.g); o.cv = fc('top', o.x + 3, o.y + 3, 29, o.w - 6, o.d - 6, 6, o.g); o.c = [o.x + o.w / 2, o.y + o.d / 2, 29]; });
  const EDG = [[0, 0, 0], [1, 1, 1], [2, 1, 2], [1, 0, 3], [3, 2, 4], [2, 0, 5]];   // [pessoa, produto, linha do pedido]

  // page: duas páginas de 8 KB (PostgreSQL), uma de 16 KB (InnoDB) e uma página TOAST
  const PGX = [222, 346], INX = 486;
  const pgTray = PGX.map(x => { rbox(x, 30, 7, 112, 262, 6, 6, bodyMat, G.page); return fc('top', x + 3, 33, 13, 106, 256, 4, G.page); });
  const blk = (parent, x, y) => { const g = mkGroup('blk', parent); return { g, cap: glowCap(x, y, 14, 100, 46, 12, 4, g), cv: fc('top', x + 2, y + 2, 26, 96, 42, 6, g), c: [x + 50, y + 23, 26] }; };
  const PGB = PED.map((p, i) => blk(G.page, PGX[i < 4 ? 0 : 1] + 6, SLOT(i % 4)));
  const inG = mkGroup('in', G.page), toG = mkGroup('toast', G.page);
  rbox(INX, 30, 7, 232, 262, 6, 6, bodyMat, inG); const inTray = fc('top', INX + 3, 33, 13, 226, 256, 4, inG);
  const INB = PED.map((p, i) => blk(inG, INX + 6 + (i < 4 ? 0 : 114), SLOT(i % 4)));
  rbox(INX, 30, 7, 112, 262, 6, 6, bodyMat, toG); const toTray = fc('top', INX + 3, 33, 13, 106, 256, 4, toG);
  const TOB = [0, 1, 2, 3].map(s => blk(toG, INX + 6, SLOT(s)));
  hazeAndShadow(g0, 410, 155, 10, 4);

  // pontos de luz que levam o dado até o terminal
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.26); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = Array.from({ length: 6 }, () => mkDot(13));
  creases(first);

  // linhas grossas: pontes de luz (dinâmicas) e arestas do grafo
  const litMat = new LineMaterial({ color: accent.clone(), linewidth: 4.4, resolution: accentLineMat.resolution.clone(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
  const edgeMat = new LineMaterial({ color: lineMat.color.clone(), linewidth: 3, resolution: accentLineMat.resolution.clone(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
  const segsOf = (pts, arrow) => { const out = []; for (let i = 0; i < pts.length - 1; i++) out.push(...W(...pts[i]).toArray(), ...W(...pts[i + 1]).toArray());
    if (arrow) { const b = pts[pts.length - 1]; for (const s of [-1, 1]) out.push(...W(b[0] - 13, b[1] + s * 8, b[2]).toArray(), ...W(...b).toArray()); } return out; };
  EDG.forEach(e => { const a = PEO[e[0]], b = PRO[e[1]], ya = a.y + a.d / 2, yb = b.y + b.d / 2;
    e.pts = [[a.x + a.w, ya, 18], [a.x + a.w + 26, ya, 18], [b.x - 26, yb, 18], [b.x, yb, 18]]; e.cum = cumLen(e.pts);
    e.dim = fat(segsOf(e.pts, true), edgeMat); G.graph.add(e.dim); e.lit = fat(segsOf(e.pts, true), litMat); e.lit.visible = false; G.graph.add(e.lit);
    e.mid = [(a.x + a.w + b.x) / 2, (ya + yb) / 2, 18]; });
  const bz = (a, b, c, d, t) => a.map((_, j) => (1 - t) ** 3 * a[j] + 3 * (1 - t) ** 2 * t * b[j] + 3 * (1 - t) * t * t * c[j] + t ** 3 * d[j]);
  const arc = (a, b, lift = 110) => [a, [a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], b];
  const BEAMS = [0, 1, 2].map(() => { const l = fat([0, 0, 0, 0, 0, 0], litMat); l.frustumCulled = false; g0.add(l); l.visible = false; return { l, key: '' }; });
  function beam(i, ctrl) { const B = BEAMS[i], k = ctrl.flat().map(v => v.toFixed(1)).join();
    if (B.key !== k) { B.key = k; const pts = Array.from({ length: 41 }, (_, j) => bz(...ctrl, j / 40)), arr = [];
      for (let j = 0; j < 40; j++) arr.push(...W(...pts[j]).toArray(), ...W(...pts[j + 1]).toArray()); B.l.geometry.setPositions(arr); }
    B.l.visible = true; }

  // ── rótulos que olham para a câmera ──
  // no claro, o cinza de texto (ink) e o vermelho de erro do pal3 ficam abaixo de 4.5:1 sobre os fundos dos cartões: escurecidos aqui
  const palM = () => theme === 'light' ? { ...pal3(), ink: '#4f5357' } : pal3();
  const BAD = () => theme === 'light' ? '#b3261e' : '#ff5a4a';
  const tags = []; let ZC = 1;
  function tag(h = 13) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = palM(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `${fs * 0.82}px ${MONO3}`, pad = fs * 0.45, lh = fs * 1.2, lh2 = fs * 0.82 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'bad' ? BAD() : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.94)' : 'rgba(18,19,20,.9)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.4); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.45 : NARROW() ? 1.2 : 1; t.w0 = nw / P * TS * k; t.h0 = nh / P * TS * k; sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(14), tag(13), tag(13)], tCon = tag(14);

  // ── roteiro ──
  let sc = 'row', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-modelos3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  { const m = new URLSearchParams(location.search).get('mode'); if (SC.includes(m)) sc = m; }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const TAB = ({ hi = [], col = null, page = false } = {}) => `<table class="h3-sum m3-tab"><tr>${page ? '<th>pág.</th>' : ''}${COLN.map((n, i) => `<th class="${COLK[i] === col ? 'm3-c' : ''}">${n}</th>`).join('')}</tr>${PED.map((p, i) => `<tr class="${hi.includes(i) ? 'on' : ''}">${page ? `<td>${i < 4 ? 1 : 2}</td>` : ''}${COLK.map(k => `<td class="${k === col ? 'm3-c' : ''}">${p[k]}</td>`).join('')}</tr>`).join('')}</table>`;
  const EX = '<li class="h3-dim">Tamanhos (~2 KB por linha, 8 B por valor) e tokens são exemplos didáticos; os pedidos são os mesmos das aulas.</li>';
  const LENA_JSON = '{\n  "_id": "lena",\n  "cidade": "Recife",\n  "pedidos": [\n    { "id": 1042, "produto": "gato de pelúcia", "qtd": 1, "valor": 89.90 },\n    { "id": 1044, "produto": "caneca azul", "qtd": 1, "valor": 19.90 }\n  ]\n}';

  const STEPS = {
    row: [
      { id: 'intro', title: 'A tabela pedidos, guardada em linhas',
        story: 'A loja guarda os pedidos numa tabela: 6 linhas, uma por pedido. No modelo de linhas (o do PostgreSQL e do MySQL), cada linha fica inteira, com os seis campos lado a lado. O banco lê o disco em páginas de 8 KB. Aqui cada linha ocupa uns 2 KB, então cabem 4 por página e as 6 linhas usam 2 páginas.',
        look: 'Duas páginas de 8 KB com 4 vagas cada. A linha 1042, da Lena, sobe da página 1 com os seis campos juntos.',
        key: 'Modelo de linhas (tuplas): cada registro fica inteiro, num lugar só.',
        cmd: { who: 'no app da loja', code: 'SELECT * FROM pedidos;', out: '→ 6 linhas (1041 … 1046)' },
        data: () => TAB({ hi: [1], page: true }) + '<li>Página: <b>8 KB</b> (PostgreSQL) · linha: <b>~2 KB</b> → <b>4 linhas por página</b></li><li>6 linhas = <b>2 páginas</b> (a 2ª com 2 vagas livres)</li>' + EX },
      { id: 'point', title: 'Achar o pedido 1042: uma página, a linha inteira',
        story: 'A Lena abre "meus pedidos" e o app pede o 1042. O banco lê a página 1 (8 KB), e ali a linha já está completa: cliente, produto, valor e cidade vêm juntos. Uma leitura de página basta. É o que o modelo de linhas faz bem: ler ou gravar um registro inteiro.',
        look: 'A página 1 acende inteira. A linha 1042 sobe e voa até o terminal com os seis campos.',
        key: 'Para ler ou gravar um registro inteiro, o modelo de linhas é ótimo.',
        cmd: { who: 'no app da loja', code: 'SELECT * FROM pedidos WHERE id = 1042;', out: '→ 1042 | Lena | gato de pelúcia | 1 | 89.90 | Recife' },
        data: () => TAB({ hi: [1] }) + '<li>Páginas lidas: <b>1</b> (8 KB) · útil: <b>1 linha</b> (~2 KB)</li><li>Como o banco sabe que é a página 1? Com um índice (B-Tree, aula 12). Sem índice, ele varreria as duas.</li>' },
      { id: 'sum', title: 'Somar os valores: ler as 2 páginas inteiras',
        story: 'Agora o financeiro quer o total vendido: SUM(valor). O valor fica no meio de cada linha, então o banco lê as 2 páginas inteiras, linha por linha, para aproveitar um campo de cada. Com 6 linhas não pesa. Com 60 milhões, são gigabytes lidos para usar uma coluna só.',
        look: 'A leitura passa linha por linha nas duas páginas e só o campo valor acende. O terminal soma até 406.40.',
        key: 'Para somar uma coluna, o modelo de linhas lê tudo o que está em volta dela.',
        cmd: { who: 'no app da loja', code: 'SELECT SUM(valor) FROM pedidos;', out: '→ 406.40' },
        data: () => TAB({ col: 'val' }) + '<li>Páginas lidas: <b>2</b> = <b>16 KB</b></li><li>Útil: <b>6 valores × 8 B = 48 B</b></li><li>39.80 + 89.90 + 89.90 + 19.90 + 147.00 + 19.90 = <b>406.40</b></li>' },
    ],
    doc: [
      { id: 'intro', title: 'Um documento por cliente',
        story: 'Num banco de documentos (como o MongoDB), a loja pode guardar cada cliente como um documento JSON, com os pedidos dentro dele. A Lena vira um documento só: a cidade e a lista com os pedidos 1042 e 1044. Não existe uma tabela de pedidos separada.',
        look: 'A coleção clientes tem 4 documentos. O da Lena sobe e mostra o JSON, com os dois pedidos aninhados.',
        key: 'Modelo de documentos: o que é lido junto fica guardado junto, num JSON.',
        cmd: { who: 'no app da loja', code: 'db.clientes.insertOne({ _id: "lena", cidade: "Recife", pedidos: [ … ] })', out: '→ { acknowledged: true, insertedId: "lena" }' },
        data: () => `<pre class="m3-json">${esc(LENA_JSON)}</pre><li>Coleção <b>clientes</b>: caio (1041), lena (1042, 1044), bia (1043, 1046), davi (1045)</li>` },
      { id: 'read', title: 'Abrir a conta da Lena: um documento, uma leitura',
        story: 'Quando a Lena entra na conta, o app quer a cliente e todos os pedidos dela. No modelo de linhas seriam duas tabelas e um JOIN. Aqui é um findOne pela chave: o documento inteiro chega de uma vez, já no formato que a tela usa.',
        look: 'O documento da Lena voa até o terminal. O contador marca 1 documento lido.',
        key: 'Um documento traz o objeto inteiro, sem JOIN.',
        cmd: { who: 'no app da loja', code: 'db.clientes.findOne({ _id: "lena" })', out: '→ { _id: "lena", cidade: "Recife", pedidos: [ { id: 1042, … }, { id: 1044, … } ] }' },
        data: () => '<li>Documentos lidos: <b>1</b></li><li>No modelo de linhas: <code>SELECT … FROM clientes JOIN pedidos ON …</code> (duas tabelas)</li><li>O documento já vem no formato do JSON que a tela usa.</li>' },
      { id: 'cross', title: 'E se a pergunta for sobre o produto?',
        story: 'O estoque pergunta quantos gatos de pelúcia foram vendidos. Os pedidos estão presos dentro de cada cliente. Sem um índice em pedidos.produto, o banco abre os 4 documentos e procura dentro de cada lista. Acha 2: o 1042, da Lena, e o 1043, da Bia. E o nome do produto está repetido em cada documento: trocar "gato de pelúcia" é mexer em vários.',
        look: 'A leitura passa pelos 4 documentos, um por um. Acendem os pedidos de gato dentro da Lena e da Bia.',
        key: 'Documento é ótimo pela chave; perguntas que cruzam documentos custam caro.',
        cmd: { who: 'no app da loja', code: 'db.clientes.aggregate([\n  { $unwind: "$pedidos" },\n  { $match: { "pedidos.produto": "gato de pelúcia" } },\n  { $count: "n" } ])', out: '→ { n: 2 }' },
        data: () => '<li>Documentos abertos: <b>4</b> · achados: <b>1042</b> (lena) e <b>1043</b> (bia)</li><li>"gato de pelúcia" aparece copiado em 2 documentos: renomear o produto = atualizar os dois.</li>' },
    ],
    column: [
      { id: 'intro', title: 'A mesma tabela, um arquivo por coluna',
        story: 'Um banco colunar (como ClickHouse, BigQuery ou Redshift) vira a tabela de lado. Em vez de guardar linha por linha, guarda coluna por coluna: um arquivo com todos os ids, outro com todos os clientes, outro com todos os valores. O pedido 1042 continua lá, só que em 6 pedaços, um em cada arquivo, sempre na 2ª posição.',
        look: 'Seis arquivos lado a lado. Os seis pedaços do 1042 acendem, um em cada arquivo, na 2ª posição.',
        key: 'Modelo colunar: cada coluna fica junta, num arquivo próprio.',
        cmd: { who: 'no app da loja', code: 'SELECT * FROM pedidos;', out: '→ as mesmas 6 linhas: o banco remonta cada uma pela posição' },
        data: () => '<li>Arquivos: <b>id</b> · <b>cliente</b> · <b>produto</b> · <b>qtd</b> · <b>valor</b> · <b>cidade</b></li><li>Posição 2 em todos = pedido <b>1042</b>: Lena · gato de pelúcia · 1 · 89.90 · Recife</li>' + EX },
      { id: 'sum', title: 'Somar os valores: ler só um arquivo',
        story: 'A mesma pergunta do financeiro: SUM(valor). Agora o banco abre só o arquivo valor, com os 6 valores encostados um no outro, e soma. Os outros 5 arquivos nem são tocados. Em vez de 16 KB, lê 48 bytes. Com 60 milhões de linhas, a diferença vira segundos contra minutos.',
        look: 'O arquivo valor sobe e acende valor por valor; os outros cinco ficam apagados. O terminal soma até 406.40.',
        key: 'Para agregar uma coluna, o colunar lê só aquela coluna.',
        cmd: { who: 'no app da loja', code: 'SELECT SUM(valor) FROM pedidos;', out: '→ 406.40' },
        data: () => '<table class="h3-sum"><tr><th>modelo</th><th>lê</th><th>bytes</th></tr><tr><td>linhas</td><td>2 páginas inteiras</td><td>16 KB</td></tr><tr class="on"><td>colunar</td><td>só valor</td><td>6 × 8 B = 48 B</td></tr></table><li>Soma: <b>406.40</b></li>' },
      { id: 'compress', title: 'Valores repetidos lado a lado: compressão',
        story: 'Numa coluna, os valores são do mesmo tipo e se repetem. O banco pode guardar a tabela ordenada por cidade: aí os três SP ficam juntos e viram um par só, SP × 3. A coluna cidade cai de 6 textos para 3 pares (valor, quantas vezes). Isso se chama RLE, codificação por repetição, e com milhões de linhas corta o disco muitas vezes.',
        look: 'Os seis arquivos se reordenam por cidade, juntos. Na coluna cidade, os iguais se juntam: Recife × 2, Rio × 1, SP × 3.',
        key: 'Coluna junta valores parecidos, e valores parecidos comprimem muito.',
        cmd: { who: 'no app da loja', code: 'CREATE TABLE pedidos ( … )\nENGINE = MergeTree ORDER BY cidade;', out: '→ cidade: Recife×2 · Rio×1 · SP×3' },
        data: () => '<li>Antes: Rio · Recife · SP · Recife · SP · SP (<b>6 textos</b>)</li><li>Ordenada: Recife · Recife · Rio · SP · SP · SP</li><li>RLE: <b>(Recife, 2) (Rio, 1) (SP, 3)</b> = <b>3 pares</b></li><li>Todos os arquivos mudam de ordem juntos, para a posição continuar valendo.</li>' },
      { id: 'fetch', title: 'E se der errado: buscar o pedido 1042 inteiro',
        story: 'Agora a Lena abre o pedido 1042, como no modelo de linhas. Só que aqui ele está espalhado: o banco precisa ir aos 6 arquivos, pegar a 2ª posição de cada um e remontar a linha. São seis leituras para um registro, contra uma no modelo de linhas. Por isso o colunar serve para análise, e o de linhas para o dia a dia da loja.',
        look: 'A leitura passa pelos 6 arquivos, um de cada vez. Cada pedaço voa até o terminal até a linha ficar completa.',
        key: 'Colunar é ótimo para somar muitas linhas e ruim para buscar uma linha inteira.',
        cmd: { who: 'no app da loja', code: 'SELECT * FROM pedidos WHERE id = 1042;', out: '→ 1042 | Lena | gato de pelúcia | 1 | 89.90 | Recife' },
        data: () => '<table class="h3-sum"><tr><th>modelo</th><th>leituras para o 1042</th></tr><tr><td>linhas</td><td>1 página</td></tr><tr class="on"><td>colunar</td><td>6 arquivos</td></tr></table><li>OLTP (dia a dia, um registro por vez): linhas. OLAP (análise, muitas linhas, poucas colunas): colunar.</li>' },
    ],
    wide: [
      { id: 'intro', title: 'Uma partição por cliente, colunas que crescem',
        story: 'Um banco de coluna larga (como Cassandra ou HBase) agrupa os dados por uma chave de partição. A loja escolhe o cliente. A partição Lena guarda uma coluna por pedido: pedido:1042 e pedido:1044. A do Caio tem uma só. Cada partição tem as colunas de que precisa, e nada vazio é guardado.',
        look: 'Quatro partições, uma por cliente, cada uma com o seu número de colunas. A da Lena sobe com as duas.',
        key: 'Coluna larga: linhas agrupadas por partição, com colunas que variam de uma para outra.',
        cmd: { who: 'no app da loja', code: 'CREATE TABLE pedidos_por_cliente (\n  cliente text, pedido int, produto text, valor decimal,\n  PRIMARY KEY (cliente, pedido));', out: '→ partição = cliente · colunas em ordem de pedido' },
        data: () => '<table class="h3-sum"><tr><th>partição</th><th>colunas</th></tr><tr><td>Caio</td><td>pedido:1041</td></tr><tr class="on"><td>Lena</td><td>pedido:1042 · pedido:1044</td></tr><tr><td>Bia</td><td>pedido:1043 · pedido:1046</td></tr><tr><td>Davi</td><td>pedido:1045</td></tr></table>' },
      { id: 'read', title: 'Ler os pedidos da Lena: uma partição só',
        story: 'O app pede os pedidos da Lena. O banco calcula o hash de "Lena", sabe em qual nó a partição mora e lê só ali. As colunas já estão em ordem (1042, depois 1044) e vêm juntas. As outras partições nem são abertas.',
        look: 'Só a partição da Lena acende. As duas colunas voam para o terminal, na ordem.',
        key: 'Consulta pela chave de partição: rápida, mesmo com bilhões de linhas.',
        cmd: { who: 'no app da loja', code: "SELECT * FROM pedidos_por_cliente\nWHERE cliente = 'Lena';", out: '→ Lena | 1042 | gato de pelúcia | 89.90\n   Lena | 1044 | caneca azul | 19.90' },
        data: () => '<li>Partições lidas: <b>1</b> de 4</li><li>hash("Lena") → o nó e a partição (o número exato do hash não importa aqui)</li><li>Colunas lidas: <b>pedido:1042</b>, <b>pedido:1044</b>, já em ordem</li>' },
      { id: 'filter', title: 'E se der errado: buscar por produto',
        story: 'O estoque quer os pedidos de gato de pelúcia. Produto não é a chave de partição, então o banco teria de abrir todas as partições, em todos os nós. O Cassandra recusa a consulta. Só com ALLOW FILTERING ele aceita e varre tudo. A saída certa é outra tabela, particionada por produto: no wide-column, a tabela nasce da pergunta.',
        look: 'O terminal mostra o erro. Depois, com ALLOW FILTERING, a leitura passa pelas 4 partições e acha o 1042 e o 1043.',
        key: 'Em coluna larga, cada pergunta pede uma tabela com a chave certa.',
        cmd: { who: 'no app da loja', code: "SELECT * FROM pedidos_por_cliente\nWHERE produto = 'gato de pelúcia';", out: '→ InvalidRequest: … use ALLOW FILTERING' },
        data: () => '<li>Erro real do Cassandra: <i>"Cannot execute this query as it might involve data filtering and thus may have unpredictable performance. If you want to execute this query despite the performance unpredictability, use ALLOW FILTERING"</i></li><li>Com ALLOW FILTERING: partições lidas <b>4</b> de 4 · achados <b>1042</b> e <b>1043</b></li><li>Melhor: <code>pedidos_por_produto</code> com PRIMARY KEY (produto, pedido)</li>' },
    ],
    kv: [
      { id: 'get', title: 'Uma chave, um valor fechado',
        story: 'Num banco chave-valor (como Redis ou DynamoDB), cada dado tem um nome e um conteúdo, e só. O carrinho da Lena fica na chave carrinho:lena. O valor é {1042}, mas o banco não sabe disso: para ele são 6 bytes. Quem entende o conteúdo é o app.',
        look: 'A caixa carrinho:lena acende e mostra os bytes 7b 31 30 34 32 7d. No terminal, o app traduz para {1042}.',
        key: 'Chave-valor: acha pela chave, e o valor é opaco para o banco.',
        cmd: { who: 'no app da loja', code: 'GET carrinho:lena', out: '→ "{1042}"' },
        data: () => '<table class="h3-sum"><tr><th>byte</th><th>7b</th><th>31</th><th>30</th><th>34</th><th>32</th><th>7d</th></tr><tr><td>texto</td><td>{</td><td>1</td><td>0</td><td>4</td><td>2</td><td>}</td></tr></table><li>O banco guarda e devolve os <b>6 bytes</b>; quem lê "{1042}" é o app.</li>' + EX },
      { id: 'set', title: 'Gravar a sessão, com prazo para sumir',
        story: 'A Lena faz login. O app grava a sessão dela: chave sessao:lena, valor tok_9f2c, com validade de 1800 segundos. Gravar e ler pela chave leva menos de um milissegundo, porque o Redis guarda tudo na memória. Quando o prazo acaba, a chave some sozinha.',
        look: 'A caixa sessao:lena cai na vaga livre. A validade começa a descer: 1800, 1799…',
        key: 'Chave-valor é o lugar certo para sessão, carrinho e cache.',
        cmd: { who: 'no app da loja', code: 'SET sessao:lena tok_9f2c EX 1800', out: '→ OK' },
        data: () => '<li>Chave: <b>sessao:lena</b> · valor: <b>tok_9f2c</b> (8 bytes: 74 6f 6b 5f 39 66 32 63)</li><li>EX 1800 = expira em <b>1800 s</b> (30 min). <code>TTL sessao:lena</code> → segundos que faltam.</li>' },
      { id: 'scan', title: 'E se der errado: quem tem o 1042 no carrinho?',
        story: 'O estoque quer saber quais carrinhos têm o 1042. O banco não abre valores, então não sabe responder. O app precisa percorrer as chaves (SCAN), pegar cada valor e olhar dentro. Aqui são 4 chaves. Com 10 milhões, é uma varredura inteira.',
        look: 'A leitura passa pelas 4 caixas, uma por uma, e o app traduz cada valor. Só carrinho:lena tem o 1042.',
        key: 'Sem a chave, chave-valor não ajuda: não dá para buscar pelo conteúdo.',
        cmd: { who: 'no app da loja', code: 'SCAN 0 MATCH carrinho:*\nGET carrinho:lena\nGET carrinho:bia', out: '→ só carrinho:lena tem {1042}' },
        data: () => '<li>Chaves percorridas: <b>4</b> · com 1042: <b>carrinho:lena</b></li><li>O MATCH filtra depois de ler: o SCAN passa por todas as chaves do banco.</li>' },
    ],
    graph: [
      { id: 'intro', title: 'Nós e arestas: quem comprou o quê',
        story: 'Num banco de grafo (como o Neo4j), pessoas e produtos viram nós, e cada compra vira uma aresta COMPROU, com o número do pedido guardado nela. O pedido 1042 é a aresta que liga a Lena ao gato de pelúcia. A ligação fica guardada pronta, e não é calculada na hora da consulta.',
        look: 'Quatro pessoas à esquerda, três produtos à direita e seis arestas COMPROU. A aresta do 1042 acende entre a Lena e o gato.',
        key: 'Modelo de grafo: as ligações também são dados.',
        cmd: { who: 'no app da loja', code: "CREATE (:Pessoa {nome:'Lena'})\n  -[:COMPROU {pedido:1042, valor:89.90}]->\n  (:Produto {nome:'gato de pelúcia'})", out: '→ created 2 nodes, created 1 relationship' },
        data: () => '<li>Nós: <b>4 pessoas</b> + <b>3 produtos</b> · arestas COMPROU: <b>6</b> (uma por pedido)</li><li>Aresta do 1042: Lena → gato de pelúcia {pedido: 1042, valor: 89.90}</li>' },
      { id: 'traverse', title: 'Quem comprou o gato também comprou…',
        story: 'A loja quer recomendar produtos: quem comprou gato de pelúcia também comprou o quê? O banco sai do nó do gato, segue as arestas até quem comprou (Lena e Bia) e, de cada uma, segue para os outros produtos. As duas chegam à caneca azul. Cada salto é seguir uma ligação pronta, sem varrer tabela.',
        look: 'Primeiro salto: a luz vai do gato até a Lena e a Bia. Segundo salto: das duas até a caneca azul, que acende com 2.',
        key: 'Grafo responde perguntas de "amigo do amigo" seguindo arestas.',
        cmd: { who: 'no app da loja', code: "MATCH (:Produto {nome:'gato de pelúcia'})\n  <-[:COMPROU]-(p)-[:COMPROU]->(outro)\nRETURN outro.nome, count(*)", out: '→ caneca azul | 2' },
        data: () => '<li>Salto 1: gato de pelúcia ← <b>Lena</b> (1042), <b>Bia</b> (1043)</li><li>Salto 2: Lena → caneca azul (1044) · Bia → caneca azul (1046)</li><li>Em SQL, cada salto é mais um JOIN da tabela pedidos com ela mesma.</li>' },
      { id: 'sum', title: 'E se der errado: somar tudo',
        story: 'O financeiro volta com o SUM(valor). Não há salto para seguir: o grafo precisa visitar as 6 arestas, uma por uma, e somar o valor de cada. Chega aos mesmos 406.40, sem vantagem nenhuma. Para somar uma coluna inteira, o colunar continua sendo a escolha certa.',
        look: 'As seis arestas acendem em sequência. O terminal soma até 406.40.',
        key: 'Grafo serve para seguir ligações, não para agregar tudo.',
        cmd: { who: 'no app da loja', code: 'MATCH ()-[c:COMPROU]->()\nRETURN sum(c.valor)', out: '→ 406.40' },
        data: () => '<li>Arestas visitadas: <b>6</b> de 6</li><li>39.80 + 89.90 + 89.90 + 19.90 + 147.00 + 19.90 = <b>406.40</b></li>' },
    ],
    page: [
      { id: 'read', title: 'O banco lê de página em página',
        story: 'Por baixo de todo modelo existe o disco, e ele não entrega uma linha: entrega uma página. No PostgreSQL a página tem 8 KB. Para dar à Lena o pedido 1042 (uns 2 KB), o banco lê a página 1 inteira, junto com as outras 3 linhas que moram nela.',
        look: 'A página 1 acende inteira e só a linha 1042 sobe. O contador mostra 8 KB lidos para 2 KB úteis.',
        key: 'A unidade de leitura do banco é a página, não a linha.',
        cmd: { who: 'no PostgreSQL', code: 'SHOW block_size;\nSELECT * FROM pedidos WHERE id = 1042;', out: '→ 8192 · 1 página lida (8 KB)' },
        data: () => '<li>Página: <b>8 KB</b> = 8192 bytes · linha: <b>~2 KB</b> → 4 por página</li><li>Lidos: <b>8 KB</b> · úteis: <b>2 KB</b> (a linha 1042)</li>' + EX },
      { id: 'compare', title: '8 KB ou 16 KB: quantas linhas cabem',
        story: 'O MySQL (InnoDB) usa páginas de 16 KB, o dobro. Com linhas de 2 KB cabem 8 por página, e as 6 linhas da loja ficam numa página só. Para o SUM(valor), o PostgreSQL lê 2 páginas e o InnoDB lê 1. Página maior varre com menos leituras, mas traz mais bytes à toa quando você quer uma linha só.',
        look: 'Ao lado das 2 páginas de 8 KB aparece a página de 16 KB com as 6 linhas. As de 8 KB acendem uma depois da outra; a de 16 KB acende de uma vez.',
        key: 'Página maior: menos leituras para varrer, mais bytes à toa para buscar uma linha.',
        cmd: { who: 'no MySQL', code: 'SELECT @@innodb_page_size;\nSELECT SUM(valor) FROM pedidos;', out: '→ 16384 · 406.40' },
        data: () => '<table class="h3-sum"><tr><th>banco</th><th>página</th><th>linhas/pág.</th><th>SUM lê</th></tr><tr><td>PostgreSQL</td><td>8 KB</td><td>4</td><td>2 páginas</td></tr><tr><td>InnoDB</td><td>16 KB</td><td>8</td><td>1 página</td></tr></table>' },
      { id: 'big', title: 'E se a linha for grande demais?',
        story: 'A loja cria um campo descrição, e o 1042 ganha 8 KB de texto. A linha passa de 10 KB e não cabe numa página de 8 KB. O PostgreSQL corta o campo grande em pedaços de ~2 KB e guarda numa tabela à parte, o TOAST, deixando na linha só um ponteiro. Ler o 1042 completo passa a custar 2 páginas.',
        look: 'Aparece uma página TOAST com os 4 pedaços da descrição. Uma ponte de luz liga a linha 1042 a eles, e o contador vai a 2 páginas.',
        key: 'Linha maior que a página vira duas leituras.',
        cmd: { who: 'no PostgreSQL', code: "SELECT * FROM pedidos WHERE id = 1042;", out: '→ 2 páginas lidas: página 1 + página TOAST' },
        data: () => '<li>Linha 1042: ~2 KB + descrição de 8 KB → <b>~10 KB</b> &gt; 8 KB</li><li>TOAST: pedaços de ~2 KB, <b>4 por página</b> (o PostgreSQL tenta comprimir antes; aqui, sem compressão)</li><li>No InnoDB a ideia é a mesma: o excesso vai para páginas de overflow.</li>' },
    ],
  };
  const ids = () => STEPS[sc], N = () => ids().length, cur = () => ids()[step];
  const DUR = { row: [2, 3, 4.4], doc: [1.6, 2.6, 4], column: [2, 3.2, 3.4, 3.8], wide: [1.6, 3, 4.6], kv: [2.2, 2.2, 3.6], graph: [1.6, 3.4, 4], page: [2.6, 3, 2.8] };
  const dur = () => DUR[sc][step];

  // ── painel ──
  const cmdHtml = c => `<div class="s3-cmd"><b>Comando</b><i>${c.who}</i><code>${esc(c.code)}</code><span>${esc(c.out)}</span></div>`;
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Modelo de dados">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCBTN[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      ${cmdHtml(s.cmd)}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now">${s.data()}</ul></details>`;
  }
  let meterNow = '';
  function readout() { if (active !== 'modelos') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()}${meterNow ? ' · ' + meterNow : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'modelos' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    const back = document.querySelector('.o3-back'); if (back) back.setAttribute('href', '../#' + LESSON[sc]);
    readout();
  }
  function applyVis() { for (const k of SC) G[k].visible = k === sc; }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { if (!SC.includes(v)) return false; sc = v; try { localStorage.setItem('sdlabs-modelos3d-sc', v); } catch (e) {} applyVis(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'modelos') setSc(b.dataset.sc); });

  // ── telas ──
  const colors = () => { const C = palM(), A_ = '#' + accent.getHexString(); return { C, A_, acc: theme === 'light' ? C.hi : A_ }; };
  const paint = (cv, key, fn) => { key += theme + accent.getHex(); if (cv.key === key) return; cv.key = key; const { x, P } = cv; x.clearRect(0, 0, cv.c.width, cv.c.height); fn(x, v => v * P, colors()); cv.tex.needsUpdate = true; };
  const bg = (x, cv, col) => { x.fillStyle = col || (theme === 'light' ? '#f6f6f5' : '#141516'); x.fillRect(0, 0, cv.c.width, cv.c.height); };
  const txt = (x, u, s, a, b, size, col, w = 400, al = 'left') => { x.font = `${w} ${u(size)}px ${MONO3}`; x.fillStyle = col; x.textAlign = al; x.textBaseline = 'middle'; x.fillText(s, u(a), u(b)); };
  const rr = (x, u, a, b, w, h, r, { fill, stroke, lw = 0.5, dash, alpha } = {}) => { x.beginPath(); x.roundRect(u(a), u(b), u(w), u(h), u(r));
    if (fill) { if (alpha != null) x.globalAlpha = alpha; x.fillStyle = fill; x.fill(); x.globalAlpha = 1; }
    if (stroke) { if (dash) x.setLineDash(dash.map(u)); x.strokeStyle = stroke; x.lineWidth = u(lw); x.stroke(); x.setLineDash([]); } };
  const fitTxt = (x, u, s, a, b, size, maxW, col, w = 400, al = 'left') => { x.font = `${w} ${u(size)}px ${MONO3}`; const m = x.measureText(s).width; if (m > u(maxW)) size *= u(maxW) / m; txt(x, u, s, a, b, size, col, w, al); };

  function drawCon(S) {
    paint(conScr, JSON.stringify(S), (x, u, { C, acc }) => { bg(x, conScr);
      txt(x, u, 'APP DA LOJA', 5, 8, 7, C.ink, 600); txt(x, u, 'consulta → resposta', 165, 8, 6, C.ink, 400, 'right');
      (S.q || []).slice(0, 3).forEach((l, i) => fitTxt(x, u, l, 5, 20 + i * 11, 8.6, 160, C.inkHi, 600));
      x.strokeStyle = C.detail; x.lineWidth = u(0.6); x.beginPath(); x.moveTo(u(5), u(52)); x.lineTo(u(165), u(52)); x.stroke();
      (S.res || []).slice(0, 4).forEach(([l, tone], i) => fitTxt(x, u, l, 5, 62 + i * 12.5, 9.6, 160, tone === 'bad' ? BAD() : tone === 'dim' ? C.ink : tone === 'hi' ? C.inkHi : acc, tone === 'dim' ? 400 : 600));
      if (S.meter) { rr(x, u, 4, 112, 162, 25, 3, { stroke: acc, lw: 0.9 });
        fitTxt(x, u, S.meter[0], 8, 124.5, 7.2, 86, C.ink); fitTxt(x, u, S.meter[1], 162, 124.5, 13, 72, acc, 600, 'right'); } });
  }
  const XS = [4, 36, 74, 168, 186, 226], FN = ['id', 'cliente', 'produto', 'qtd', 'valor', 'cidade'];
  function drawRow(i, st) {      // st: '', 'star', 'seen', 'cur', 'used', 'big'
    const p = PED[i], cv = ROWB[i].cv;
    paint(cv, i + st, (x, u, { C, A_, acc }) => { const light = theme === 'light', dim = st === 'seen' || st === 'used';
      bg(x, cv, st === 'star' || st === 'cur' ? C.glassOn : null);
      rr(x, u, 0.6, 0.6, 262.8, 40.8, 3, { stroke: st === 'star' || st === 'cur' ? A_ : C.line, lw: st === 'star' || st === 'cur' ? 1.6 : 0.5 });
      const vals = [p.id, p.cli, p.prod, p.qtd, p.val, p.cid];
      if (st === 'cur' || st === 'used') rr(x, u, 182, 3, 42, 36, 2, { fill: A_, alpha: light ? 0.18 : 0.22, stroke: A_, lw: 1 });
      vals.forEach((v, k) => { txt(x, u, FN[k], XS[k], 10, 5.6, C.ink);
        const hot = (st === 'cur' || st === 'used') && k === 4;
        txt(x, u, String(v), XS[k], 27, 10, hot ? acc : dim ? C.ink : st === 'star' && k === 0 ? acc : C.inkHi, hot || k === 0 ? 600 : 400); }); });
  }
  function drawRowTray(p, st) {
    const cv = rowTray[p];
    paint(cv, p + st, (x, u, { C, A_, acc }) => { bg(x, cv, C.recess);
      if (st === 'read') { rr(x, u, 0.8, 0.8, 272.4, 254.4, 4, { stroke: A_, lw: 1.6 }); }
      txt(x, u, `PÁGINA ${p + 1}`, 6, 12, 11, st === 'read' ? acc : C.inkHi, 600);
      txt(x, u, `8 KB · linhas ${p ? '1045–1046' : '1041–1044'}`, 6, 27, 7, C.ink);
      if (st === 'read') txt(x, u, 'lida inteira ✓', 268, 12, 7.5, acc, 600, 'right');
      for (let s = 0; s < 4; s++) { const v = 39 + s * 54; rr(x, u, 3, v, 268, 48, 3, { stroke: C.line, lw: 0.5, dash: [1.6, 1.2] });
        if (p === 1 && s >= 2) txt(x, u, 'livre · ~2 KB', 137, v + 24, 8, C.ink, 400, 'center'); } });
  }
  function drawFile(fi, S) {     // S: { st, hi: [linhas acesas], order f, merge f, seen }
    const F = FILES[fi], cv = F.cv;
    paint(cv, fi + JSON.stringify(S), (x, u, { C, A_, acc }) => { const w = F.w - 4, light = theme === 'light', dim = S.st === 'dim';
      bg(x, cv, C.recess);
      if (S.st === 'on') rr(x, u, 0.8, 0.8, w - 1.6, 256.4, 4, { stroke: A_, lw: 1.6 });
      fitTxt(x, u, COLN[fi], w / 2, 11, 10, w - 6, S.st === 'on' ? acc : dim ? C.ink : C.inkHi, 600, 'center');
      fitTxt(x, u, COLN[fi] + '.col', w / 2, 23, 6, w - 6, C.ink, 400, 'center');
      const ord = S.ord || 0, merge = F.k === 'cid' ? (S.merge || 0) : 0, SORT = [2, 0, 3, 1, 4, 5];
      if (merge > 0) {           // RLE: Recife ×2 · Rio ×1 · SP ×3
        [['Recife', 0, 2], ['Rio', 2, 1], ['SP', 3, 3]].forEach(([v, s0, n]) => { const y0 = 30 + s0 * 37, h = n * 37 - 4;
          rr(x, u, 3, y0, w - 6, h, 3, { fill: A_, alpha: (light ? 0.14 : 0.2) * merge, stroke: A_, lw: 1 });
          txt(x, u, v, w / 2, y0 + h / 2 - 6, 10, acc, 600, 'center'); txt(x, u, `× ${n}`, w / 2, y0 + h / 2 + 8, 10, C.inkHi, 600, 'center'); });
        return; }
      PED.forEach((p, r) => { const slot = r + (SORT[r] - r) * ord, y0 = 30 + slot * 37, on = (S.hi || []).includes(r);
        rr(x, u, 3, y0, w - 6, 33, 2.5, on ? { fill: A_, alpha: light ? 0.16 : 0.22, stroke: A_, lw: 1.2 } : { stroke: C.line, lw: 0.4 });
        fitTxt(x, u, String(p[F.k]), w / 2, y0 + 16.5, 10, w - 10, on ? acc : dim ? C.ink : C.inkHi, on ? 600 : 400, 'center'); }); });
  }
  const docLines = d => d.k === 'lena'
    ? ['{', '  "_id": "lena",', '  "cidade": "Recife",', '  "pedidos": [', '    { "id": 1042,', '      "produto": "gato de pelúcia",', '      "qtd": 1, "valor": 89.90 },', '    { "id": 1044,', '      "produto": "caneca azul",', '      "qtd": 1, "valor": 19.90 }', '  ]', '}']
    : [`_id: ${d.k}`, `cidade: ${PED[d.peds[0]].cid}`, 'pedidos:', ...d.peds.map(r => `· ${PED[r].id} ${PED[r].prod}`)];
  function drawDoc(d, S) {      // S: { st: ''|'on'|'seen', found: [linhas do pedido] }
    paint(d.cv, d.k + JSON.stringify(S), (x, u, { C, A_, acc }) => { const w = d.w - 6, h = d.h - 6, light = theme === 'light';
      bg(x, d.cv, S.st === 'on' ? C.glassOn : null);
      rr(x, u, 0.8, 0.8, w - 1.6, h - 1.6, 3, { stroke: S.st === 'on' ? A_ : C.line, lw: S.st === 'on' ? 1.6 : 0.5 });
      fitTxt(x, u, 'clientes / ' + d.k, 5, 9, 7.4, w - 10, S.st === 'on' ? acc : C.ink, 600);
      const L = docLines(d), big = d.k === 'lena', fs = big ? 8.4 : 7, lh = big ? 14.2 : 13, y0 = big ? 26 : 26;
      (S.found || []).forEach(r => { const k = big ? (r === 1 ? 4 : 7) : 3 + d.peds.indexOf(r), n = big ? 3 : 1;
        rr(x, u, 3, y0 + k * lh - lh / 2 - 1, w - 6, n * lh + 2, 2, { fill: A_, alpha: light ? 0.16 : 0.22, stroke: A_, lw: 1 }); });
      L.forEach((l, i) => fitTxt(x, u, l, 5, y0 + i * lh, fs, w - 9, (S.found || []).some(r => big ? (i >= (r === 1 ? 4 : 7) && i < (r === 1 ? 7 : 10)) : i === 3 + d.peds.indexOf(r)) ? acc : S.st === 'seen' ? C.ink : C.inkHi, 400));
      if (!big) txt(x, u, '(resumo)', w - 5, h - 8, 5.4, C.ink, 400, 'right'); });
  }
  function drawPartKey(p, on) {
    paint(p.kcv, p.k + on, (x, u, { C, A_, acc }) => { bg(x, p.kcv, on ? C.glassOn : null);
      rr(x, u, 0.6, 0.6, 98.8, 48.8, 3, { stroke: on ? A_ : C.line, lw: on ? 1.4 : 0.5 });
      txt(x, u, 'cliente =', 50, 11, 6.6, C.ink, 400, 'center'); txt(x, u, p.k, 50, 28, 14, on ? acc : C.inkHi, 600, 'center'); txt(x, u, 'chave de partição', 50, 42, 5.4, C.ink, 400, 'center'); });
  }
  function drawPartCell(c, st) {   // '', 'on', 'found', 'seen'
    const p = PED[c.r];
    paint(c.cv, c.r + st, (x, u, { C, A_, acc }) => { const on = st === 'on' || st === 'found';
      bg(x, c.cv, on ? C.glassOn : null); rr(x, u, 0.6, 0.6, 184.8, 48.8, 3, { stroke: on ? A_ : C.line, lw: on ? 1.4 : 0.5 });
      txt(x, u, `pedido:${p.id}`, 6, 14, 10, on ? acc : st === 'seen' ? C.ink : C.inkHi, 600);
      fitTxt(x, u, `${p.prod} · ${p.qtd} · ${p.val}`, 6, 33, 8.6, 174, st === 'seen' ? C.ink : C.inkHi);
      if (st === 'found') txt(x, u, '✓ gato', 180, 14, 7, acc, 600, 'right'); });
  }
  function drawKv(o, S) {          // S: { st, ttl, dec }
    paint(o.cv, o.k + JSON.stringify(S), (x, u, { C, A_, acc }) => { const on = S.st === 'on';
      bg(x, o.cv, on ? C.glassOn : null); rr(x, u, 0.8, 0.8, 246.4, 106.4, 4, { stroke: on ? A_ : C.line, lw: on ? 1.6 : 0.5 });
      txt(x, u, o.k, 8, 15, 14, on ? acc : S.st === 'seen' ? C.ink : C.inkHi, 600);
      txt(x, u, 'valor, como o banco vê:', 8, 33, 6.6, C.ink);
      txt(x, u, o.hex, 8, 49, 11, on ? C.inkHi : C.ink, 600);
      txt(x, u, `${o.n} bytes`, 240, 33, 6.6, C.ink, 400, 'right');
      txt(x, u, o.ttl ? (S.ttl != null ? `expira em ${S.ttl} s` : 'expira sozinha (TTL)') : 'sem prazo', 8, 68, 8, o.ttl && S.ttl != null ? acc : C.ink, o.ttl && S.ttl != null ? 600 : 400);
      if (S.dec) txt(x, u, `app lê: ${o.v}`, 240, 88, 9, S.dec === 'hit' ? acc : C.ink, 600, 'right');
      else txt(x, u, 'o banco não sabe o que é', 8, 92, 6.4, C.ink); });
  }
  function drawSlot(show) {
    paint(kvSlot, 'slot' + show, (x, u, { C }) => { if (!show) { x.clearRect(0, 0, kvSlot.c.width, kvSlot.c.height); bg(x, kvSlot, theme === 'light' ? '#e2e3e3' : '#17181a'); }
      else bg(x, kvSlot, theme === 'light' ? '#e2e3e3' : '#17181a');
      rr(x, u, 2, 2, 244, 104, 5, { stroke: C.line, lw: 0.8, dash: [2, 1.6] }); txt(x, u, 'vaga livre', 124, 54, 9, C.ink, 400, 'center'); });
  }
  function drawNode(o, S) {        // S: { st, n }
    const isP = PEO.includes(o);
    paint(o.cv, o.n + JSON.stringify(S), (x, u, { C, A_, acc }) => { const on = S.st === 'on', w = o.w - 6, h = o.d - 6;
      bg(x, o.cv, on ? C.glassOn : null); rr(x, u, 0.6, 0.6, w - 1.2, h - 1.2, 4, { stroke: on ? A_ : C.line, lw: on ? 1.5 : 0.5 });
      txt(x, u, isP ? ':Pessoa' : ':Produto', 6, 9, 6.2, C.ink);
      fitTxt(x, u, o.n, w / 2, h / 2 + 5, isP ? 14 : 11.5, w - 10, on ? acc : C.inkHi, 600, 'center');
      if (S.n) txt(x, u, S.n, w - 5, 9, 7, acc, 600, 'right'); });
  }
  function drawPgTray(cv, name, sub, st, wide) {
    paint(cv, name + sub + st, (x, u, { C, A_, acc }) => { const w = wide ? 226 : 106; bg(x, cv, C.recess);
      if (st === 'read') rr(x, u, 0.8, 0.8, w - 1.6, 254.4, 4, { stroke: A_, lw: 1.6 });
      txt(x, u, name, 5, 11, 9.5, st === 'read' ? acc : C.inkHi, 600); fitTxt(x, u, sub, 5, 24, 6.4, w - 10, C.ink);
      if (st === 'read') txt(x, u, '✓', w - 5, 11, 10, acc, 600, 'right');
      for (let col = 0; col < (wide ? 2 : 1); col++) for (let s = 0; s < 4; s++) rr(x, u, 3 + col * 114, 39 + s * 54, 100, 48, 3, { stroke: C.line, lw: 0.5, dash: [1.6, 1.2] });
      if (!wide && name === 'PÁGINA 2') [2, 3].forEach(s => txt(x, u, 'livre', 53, 63 + s * 54, 8, C.ink, 400, 'center'));
      if (wide) [6, 7].forEach(k => txt(x, u, 'livre', 3 + 114 + 50, 63 + (k - 4) * 54, 8, C.ink, 400, 'center')); });
  }
  function drawBlk(b, l1, l2, st) {
    paint(b.cv, l1 + l2 + st, (x, u, { C, A_, acc }) => { const on = st === 'on' || st === 'star';
      bg(x, b.cv, on ? C.glassOn : null); rr(x, u, 0.6, 0.6, 94.8, 40.8, 3, { stroke: on ? A_ : C.line, lw: on ? 1.5 : 0.5 });
      fitTxt(x, u, l1, 48, 14, 12, 88, on ? acc : st === 'seen' ? C.ink : C.inkHi, 600, 'center'); fitTxt(x, u, l2, 48, 31, 7.2, 88, C.ink, 400, 'center'); });
  }

  // ── um quadro da cena ──
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  let nd = 0, nb = 0;
  const placeDot = (p, k = 1.3) => { const d = DOTS[nd++]; if (!d) return; d.g.visible = true; d.g.position.copy(W(...p)); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], 0.9); };
  // leva um dado de `from` até o terminal (ou ao contrário): ponte de luz grossa + ponto que viaja
  function fly(from, f, rev = false, to = CON_IN) { if (f <= 0 || f >= 1) return; const c = arc(from, to, 120); if (nb < BEAMS.length) beam(nb++, c); placeDot(bz(...c, rev ? 1 - ease(f) : ease(f))); }
  const lift = (g, z) => g.position.copy(W(0, 0, z));
  const ph = (t, a, d) => clamp((t - a) / d);              // fase de 0 a 1 entre a e a+d

  const MODE = {
    row(id, t, out) {
      let lz = Array(6).fill(0), st = Array(6).fill(''), tray = ['', ''];
      if (id === 'intro') { const f = ease(ph(t, 0.5, 0.8)); lz[1] = 16 * f; st[1] = f > 0 ? 'star' : '';
        out.con = { q: ['SELECT * FROM pedidos;'], res: [['6 linhas · ~2 KB cada', 'hi'], ['página 1: 1041 … 1044', 'dim'], ['página 2: 1045, 1046', 'dim']], meter: ['no disco', '2 × 8 KB'] };
        if (f > 0.4) out.tags.push([`linha 1042 · ~2 KB\nLena · gato de pelúcia · 89.90`, 'acc', [TRX[0] + 250, 40, 150]]);
        out.tags.push(['página 2 · 2 vagas livres', 'dim', [TRX[1] + 140, 262, 40]]); }
      if (id === 'point') { const r = t > 0.3; if (r) tray[0] = 'read'; const f = ease(ph(t, 0.9, 0.5)); lz[1] = 16 * f; st[1] = r ? 'star' : '';
        if (r) [0, 2, 3].forEach(i => st[i] = 'seen');
        const ff = ph(t, 1.4, 1.1); fly([ROWB[1].c[0], ROWB[1].c[1], 26 + 16], ff);
        out.con = { q: ['SELECT * FROM pedidos', 'WHERE id = 1042;'], res: ff >= 1 ? [['1042 | Lena', 'acc'], ['gato de pelúcia', 'acc'], ['1 | 89.90 | Recife', 'acc']] : [['lendo a página 1…', 'dim']], meter: ['páginas lidas', r ? '1' : '0'] };
        if (r) out.tags.push(['página 1 inteira: 8 KB\npara usar 1 linha de 2 KB', 'acc', [TRX[0] + 160, 60, 150]]); }
      if (id === 'sum') { const k = Math.floor((t - 0.5) / 0.55), done = k >= 6;
        for (let i = 0; i < 6; i++) st[i] = i < k ? 'used' : i === k ? 'cur' : '';
        if (k >= 0) tray[0] = 'read'; if (k >= 4) tray[1] = 'read';
        if (k >= 0 && k < 6) fly(ROWB[k].v, ((t - 0.5) % 0.55) / 0.55);
        out.con = { q: ['SELECT SUM(valor)', 'FROM pedidos;'], res: k < 0 ? [['…', 'dim']] : [[`soma = ${RUN[Math.min(k, 5)]}`, done ? 'acc' : 'hi'], [done ? 'pronto ✓' : `linha ${PED[Math.min(k, 5)].id}`, 'dim']],
          meter: ['páginas lidas', k < 0 ? '0' : k < 4 ? '1' : '2'] };
        if (done) { out.tags.push(['2 páginas = 16 KB lidos\npara usar 6 valores (48 B)', 'acc', [TRX[1] + 60, 20, 150]]); } }
      ROWB.forEach((b, i) => { lift(b.g, lz[i]); drawRow(i, st[i]); b.cap.emissiveIntensity = st[i] === 'cur' ? 1 : st[i] === 'star' ? 0.7 : 0; });
      rowTray.forEach((_, p) => drawRowTray(p, tray[p]));
      out.meter = out.con.meter.join(' ');
    },
    doc(id, t, out) {
      const S = DOCS.map(() => ({ st: '', found: [] })); let lz = [0, 0, 0, 0];
      if (id === 'intro' || id === 'read') { const f = ease(ph(t, 0.4, 0.7)); lz[1] = 36 * f; if (f > 0) S[1].st = 'on'; }
      if (id === 'intro') { out.con = { q: ['db.clientes.insertOne(…)'], res: [['acknowledged: true', 'hi'], ['insertedId: "lena"', 'acc']], meter: ['documentos', '4'] };
        if (t > 0.9) out.tags.push(['clientes/lena: 1 documento\na cliente + os 2 pedidos', 'acc', [451, 40, 300]]); }
      if (id === 'read') { const ff = ph(t, 1.1, 1.2); fly([451, 64, 7 + 214 + 36], ff);
        out.con = { q: ['db.clientes.findOne(', '  { _id: "lena" })'], res: ff >= 1 ? [['_id: lena · Recife', 'acc'], ['pedidos: 1042, 1044', 'acc'], ['sem JOIN', 'dim']] : [['…', 'dim']], meter: ['docs lidos', t > 1.1 ? '1' : '0'] }; }
      if (id === 'cross') { const k = Math.floor((t - 0.5) / 0.8), done = k >= 4;
        DOCS.forEach((d, i) => { S[i].st = i === k ? 'on' : i < k ? 'seen' : ''; if (i <= k) S[i].found = d.peds.filter(r => PED[r].prod === 'gato de pelúcia'); });
        const n = DOCS.slice(0, Math.max(0, Math.min(4, k + 1))).reduce((a, d) => a + d.peds.filter(r => PED[r].prod === 'gato de pelúcia').length, 0);
        if (k >= 0 && k < 4) fly([DOCS[k].top[0], 64, DOCS[k].top[2]], ((t - 0.5) % 0.8) / 0.8);
        out.con = { q: ['$unwind pedidos', '$match produto =', '  "gato de pelúcia"'], res: [[`gatos: ${n}`, done ? 'acc' : 'hi'], [done ? '1042 (lena) · 1043 (bia)' : k >= 0 && k < 4 ? `abrindo ${DOCS[k].k}…` : '…', 'dim']], meter: ['docs abertos', String(Math.max(0, Math.min(4, k + 1)))] };
        if (done) out.tags.push(['abriu 4 documentos\npara achar 2 gatos', 'acc', [508, 40, 300]]); }
      DOCS.forEach((d, i) => { lift(d.g, lz[i]); drawDoc(d, S[i]); d.cap.emissiveIntensity = S[i].st === 'on' ? 0.7 : 0; });
      out.meter = out.con.meter.join(' ');
    },
    column(id, t, out) {
      const S = FILES.map(() => ({ st: '', hi: [] })); let lz = Array(6).fill(0);
      if (id === 'intro') { FILES.forEach((F, k) => { if (t > 0.4 + k * 0.18) S[k].hi = [1]; });
        out.con = { q: ['SELECT * FROM pedidos;'], res: [['6 arquivos, 1 por coluna', 'hi'], ['posição 2 = pedido 1042', 'acc']], meter: ['arquivos', '6'] };
        if (t > 1.5) out.tags.push(['pedido 1042 = 6 pedaços\num em cada arquivo, na 2ª posição', 'acc', [490, 20, 130]]); }
      if (id === 'sum') { const f = ease(ph(t, 0.3, 0.6)), k = Math.floor((t - 0.9) / 0.35), done = k >= 6; lz[4] = 20 * f;
        FILES.forEach((F, i) => S[i].st = i === 4 ? 'on' : 'dim'); S[4].hi = PED.map((_, r) => r).filter(r => r <= k);
        if (k >= 0 && k < 6) fly([FILES[4].x + FILES[4].w / 2, cellY(k), 17 + 20], ((t - 0.9) % 0.35) / 0.35);
        out.con = { q: ['SELECT SUM(valor)', 'FROM pedidos;'], res: k < 0 ? [['abrindo valor.col…', 'dim']] : [[`soma = ${RUN[Math.min(k, 5)]}`, done ? 'acc' : 'hi'], [done ? 'pronto ✓' : `valor ${PED[Math.min(k, 5)].val}`, 'dim']], meter: ['bytes lidos', `${Math.max(0, Math.min(6, k + 1)) * 8} B`] };
        if (done) { out.tags.push(['lê só valor.col\n6 × 8 B = 48 B', 'acc', [FILES[4].x + 38, 30, 120]]); out.tags.push(['5 arquivos nem abertos', 'dim', [FILES[1].x + 30, 30, 70]]); } }
      if (id === 'compress') { const o = ease(ph(t, 0.5, 1.4)), m = ph(t, 2.2, 0.6); FILES.forEach((F, i) => { S[i].ord = +o.toFixed(3); S[i].st = i === 5 ? 'on' : ''; }); S[5].merge = +m.toFixed(2);
        out.con = { q: ['ORDER BY cidade'], res: m > 0 ? [['Recife×2 · Rio×1', 'acc'], ['SP×3', 'acc'], ['6 textos → 3 pares', 'dim']] : [['Rio Recife SP', 'hi'], ['Recife SP SP', 'hi']], meter: ['cidade', m >= 1 ? '3 pares' : '6 textos'] };
        if (m >= 1) out.tags.push(['RLE: Recife ×2 · Rio ×1 · SP ×3\n6 textos viram 3 pares', 'acc', [600, 170, 110]]); }
      if (id === 'fetch') { const k = Math.floor((t - 0.5) / 0.5), done = k >= 6;
        FILES.forEach((F, i) => { S[i].st = i === k ? 'on' : i < k ? '' : ''; if (i <= k) S[i].hi = [1]; });
        if (k >= 0 && k < 6) fly([FILES[k].x + FILES[k].w / 2, cellY(1), 17], ((t - 0.5) % 0.5) / 0.5);
        const got = PED[1], parts = [got.id, got.cli, got.prod, got.qtd, got.val, got.cid].slice(0, Math.max(0, Math.min(6, k)));
        out.con = { q: ['SELECT * FROM pedidos', 'WHERE id = 1042;'], res: [[parts.slice(0, 2).join(' | ') || '…', 'acc'], [parts.slice(2, 3).join('') || ' ', 'acc'], [parts.slice(3).join(' | ') || ' ', 'acc']], meter: ['arquivos lidos', String(Math.max(0, Math.min(6, k + (done ? 0 : 1))))] };
        if (done) out.tags.push(['6 leituras para 1 pedido\n(no modelo de linhas: 1)', 'acc', [490, 20, 130]]); }
      FILES.forEach((F, i) => { lift(F.g, lz[i]); drawFile(i, S[i]); F.cap.emissiveIntensity = S[i].st === 'on' ? 0.7 : 0; });
      out.meter = out.con.meter.join(' ');
    },
    wide(id, t, out) {
      const on = [false, false, false, false], cst = PARTS.map(p => p.cells.map(() => '')); let lz = [0, 0, 0, 0];
      if (id === 'intro' || id === 'read') { const f = ease(ph(t, 0.4, 0.7)); lz[1] = 12 * f; on[1] = f > 0; if (f > 0) cst[1] = ['on', 'on']; }
      if (id === 'intro') { out.con = { q: ['PRIMARY KEY', '  (cliente, pedido)'], res: [['partição = cliente', 'hi'], ['Lena: 2 colunas', 'acc'], ['Caio: 1 coluna', 'dim']], meter: ['partições', '4'] };
        if (t > 1) out.tags.push(['partição cliente = Lena\npedido:1042 · pedido:1044', 'acc', [600, 130, 110]]); }
      if (id === 'read') { const f0 = ph(t, 1.1, 1), f1 = ph(t, 1.6, 1); fly(PARTS[1].cells[0].c.map((v, i) => i === 2 ? v + 12 : v), f0); fly(PARTS[1].cells[1].c.map((v, i) => i === 2 ? v + 12 : v), f1);
        out.con = { q: ['SELECT * … WHERE', "  cliente = 'Lena';"], res: [['hash("Lena") → partição', 'dim'], ...(f0 >= 1 ? [['1042 | gato de pelúcia', 'acc']] : []), ...(f1 >= 1 ? [['1044 | caneca azul', 'acc']] : [])], meter: ['partições lidas', t > 0.4 ? '1' : '0'] };
        if (t > 0.6) out.tags.push(['só esta partição é lida', 'acc', [600, 130, 110]]); }
      if (id === 'filter') { const k = Math.floor((t - 1.8) / 0.6), done = k >= 4;
        PARTS.forEach((p, i) => { if (i === k) on[i] = true; p.cells.forEach((c, j) => { if (i <= k && k >= 0) cst[i][j] = PED[c.r].prod === 'gato de pelúcia' ? 'found' : i === k ? 'on' : 'seen'; }); });
        if (k >= 0 && k < 4) fly([284, PARTS[k].y + 27, 25], ((t - 1.8) % 0.6) / 0.6);
        const err = t < 1.8;
        out.con = { q: err ? ['WHERE produto =', "  'gato de pelúcia';"] : ["WHERE produto = 'gato…'", 'ALLOW FILTERING;'],
          res: err ? (t > 0.4 ? [['✕ InvalidRequest', 'bad'], ['filtrar fora da chave', 'dim'], ['use ALLOW FILTERING', 'bad']] : [['…', 'dim']]) : [[`achados: ${k >= 2 ? '1042, 1043' : k >= 1 ? '1042' : '—'}`, done ? 'acc' : 'hi'], [done ? 'varreu tudo' : 'varrendo…', 'dim']],
          meter: ['partições lidas', err ? '0' : `${Math.max(0, Math.min(4, k + 1))} de 4`] };
        if (err && t > 0.4) out.tags.push(['✕ produto não é a chave de partição\no Cassandra recusa a consulta', 'bad', [600, 150, 120]]);
        if (done) out.tags.push(['ALLOW FILTERING: abriu as 4 partições', 'acc', [600, 150, 120]]); }
      PARTS.forEach((p, i) => { lift(p.g, lz[i]); drawPartKey(p, on[i]); p.kcap.emissiveIntensity = on[i] ? 0.7 : 0;
        p.cells.forEach((c, j) => { drawPartCell(c, cst[i][j]); c.cap.emissiveIntensity = cst[i][j] === 'on' || cst[i][j] === 'found' ? 0.6 : 0; }); });
      out.meter = out.con.meter.join(' ');
    },
    kv(id, t, out) {
      const S = KV.map(() => ({ st: '' })); let show = [true, true, true, true], dz = [0, 0, 0, 0];
      if (id === 'get') { show[1] = false; const ff = ph(t, 0.9, 1); if (t > 0.4) S[0].st = 'on'; fly(KV[0].c, ff); if (ff >= 1) S[0].dec = 'hit';
        out.con = { q: ['GET carrinho:lena'], res: ff >= 1 ? [['bytes: 7b 31 30 34 32 7d', 'dim'], ['app lê: {1042}', 'acc']] : [['…', 'dim']], meter: ['chaves lidas', t > 0.4 ? '1' : '0'] };
        if (t > 0.4) out.tags.push(['o banco só vê 6 bytes\nquem entende é o app', 'acc', [KV[0].c[0], KV[0].y, 120]]); }
      if (id === 'set') { const f0 = ph(t, 0.2, 0.8), fd = ease(ph(t, 0.9, 0.6)); fly(KV[1].c, f0, true); show[1] = t > 0.9; dz[1] = 90 * (1 - fd);
        const ttl = 1800 - Math.floor(Math.max(0, t - 1.5)); if (fd > 0) S[1] = { st: 'on', ttl: fd >= 1 ? ttl : 1800 };
        out.con = { q: ['SET sessao:lena tok_9f2c', '    EX 1800'], res: fd >= 1 ? [['OK', 'acc'], ['TTL sessao:lena', 'dim']] : [['…', 'dim']], meter: ['expira em', fd >= 1 ? `${ttl} s` : '—'] };
        if (fd >= 1) out.tags.push(['sessao:lena · some em 1800 s', 'acc', [KV[1].c[0], KV[1].y, 120]]); }
      if (id === 'scan') { const k = Math.floor((t - 0.5) / 0.7), done = k >= 4;
        KV.forEach((o, i) => { S[i] = { st: i === k ? 'on' : i < k ? 'seen' : '', dec: i <= k && k >= 0 ? (i === 0 ? 'hit' : 'miss') : null }; });
        if (k >= 0 && k < 4) fly(KV[k].c, ((t - 0.5) % 0.7) / 0.7);
        out.con = { q: ['SCAN 0 MATCH carrinho:*', 'GET … (cada chave)'], res: [[done ? 'com 1042: carrinho:lena' : k >= 0 && k < 4 ? `${KV[k].k} → ${KV[k].v}` : '…', done ? 'acc' : 'hi'], [done ? 'varreu todas as chaves' : ' ', 'dim']], meter: ['chaves lidas', String(Math.max(0, Math.min(4, k + 1)))] };
        if (done) out.tags.push(['leu as 4 chaves\nsó 1 tinha o 1042', 'acc', [600, 300, 70]]); }
      KV.forEach((o, i) => { o.g.visible = show[i]; lift(o.g, dz[i]); if (show[i]) drawKv(o, S[i]); o.cap.emissiveIntensity = S[i].st === 'on' ? 0.7 : 0; });
      drawSlot(!show[1]);
      out.meter = out.con.meter.join(' ');
    },
    graph(id, t, out) {
      const nS = [...PEO, ...PRO].map(() => ({ st: '' })), lit = new Set(), PI = n => PEO.length + n;
      if (id === 'intro') { if (t > 0.5) { lit.add(1); nS[1].st = 'on'; nS[PI(1)].st = 'on'; }
        out.con = { q: ['(:Pessoa)-[:COMPROU]->', '  (:Produto)'], res: [['4 pessoas · 3 produtos', 'hi'], ['6 arestas COMPROU', 'hi'], ['1042: Lena → gato', 'acc']], meter: ['nós · arestas', '7 · 6'] };
        if (t > 0.6) out.tags.push(['COMPROU\npedido 1042 · 89.90', 'acc', [...EDG[1].mid.slice(0, 2), 70]]); }
      if (id === 'traverse') { nS[PI(1)].st = 'on'; const f1 = ph(t, 0.5, 1.1), f2 = ph(t, 2.0, 1.1);
        if (f1 > 0) { lit.add(1); lit.add(2); } [1, 2].forEach(e => { if (f1 > 0 && f1 < 1) placeDot([...alongPts(EDG[e].pts, EDG[e].cum, 1 - ease(f1)).slice(0, 2), 26]); });
        if (f1 >= 1) { nS[1].st = 'on'; nS[2].st = 'on'; }
        if (f2 > 0) { lit.add(3); lit.add(5); } [3, 5].forEach(e => { if (f2 > 0 && f2 < 1) placeDot([...alongPts(EDG[e].pts, EDG[e].cum, ease(f2)).slice(0, 2), 26]); });
        if (f2 >= 1) nS[PI(0)] = { st: 'on', n: '× 2' };
        out.con = { q: ['MATCH (gato)<-[:COMPROU]-(p)', '  -[:COMPROU]->(outro)'], res: f2 >= 1 ? [['caneca azul | 2', 'acc'], ['salto 1: Lena, Bia', 'dim'], ['salto 2: caneca azul', 'dim']] : f1 >= 1 ? [['salto 1: Lena, Bia', 'hi']] : [['…', 'dim']], meter: ['arestas seguidas', String((f1 >= 1 ? 2 : 0) + (f2 >= 1 ? 2 : 0))] };
        if (f1 >= 1 && f2 < 1) out.tags.push(['salto 1: quem comprou o gato', 'acc', [286, 140, 90]]);
        if (f2 >= 1) out.tags.push(['quem comprou o gato\ntambém comprou caneca azul (2)', 'acc', [PRO[0].c[0], PRO[0].y, 90]]); }
      if (id === 'sum') { const k = Math.floor((t - 0.5) / 0.55), done = k >= 6;
        EDG.forEach((e, i) => { if (i <= k) lit.add(i); });
        if (k >= 0 && k < 6) { const e = EDG[k]; nS[e[0]].st = 'on'; nS[PI(e[1])].st = 'on'; placeDot([...alongPts(e.pts, e.cum, ease(((t - 0.5) % 0.55) / 0.55)).slice(0, 2), 26]); }
        out.con = { q: ['MATCH ()-[c:COMPROU]->()', 'RETURN sum(c.valor)'], res: k < 0 ? [['…', 'dim']] : [[`soma = ${RUN[Math.min(k, 5)]}`, done ? 'acc' : 'hi'], [done ? 'pronto ✓' : `aresta ${PED[Math.min(k, 5)].id}`, 'dim']], meter: ['arestas visitadas', String(Math.max(0, Math.min(6, k + 1)))] };
        if (done) out.tags.push(['visitou as 6 arestas: 406.40\nnenhum atalho para somar tudo', 'acc', [470, 300, 50]]); }
      [...PEO, ...PRO].forEach((o, i) => { drawNode(o, nS[i]); o.cap.emissiveIntensity = nS[i].st === 'on' ? 0.7 : 0; });
      EDG.forEach((e, i) => { e.lit.visible = lit.has(i); e.dim.visible = !lit.has(i); });
      out.meter = out.con.meter.join(' ');
    },
    page(id, t, out) {
      let pg = ['', ''], inS = '', toS = '', lz = 0, inZ = 0, toZ = 0; inG.visible = false; toG.visible = false;
      const bst = PED.map(() => ''), ist = PED.map(() => '');
      if (id === 'read') { if (t > 0.4) { pg[0] = 'read'; [0, 2, 3].forEach(i => bst[i] = 'seen'); bst[1] = 'star'; } lz = 16 * ease(ph(t, 0.8, 0.5));
        const ff = ph(t, 1.3, 1); fly([PGB[1].c[0], PGB[1].c[1], 26 + 16], ff);
        out.con = { q: ['SELECT * FROM pedidos', 'WHERE id = 1042;'], res: t > 0.4 ? [['lido: página 1 (8 KB)', 'hi'], ['útil: 1042 (2 KB)', 'acc']] : [['…', 'dim']], meter: ['lido / útil', t > 0.4 ? '8 KB / 2 KB' : '0'] };
        if (t > 0.6) out.tags.push(['página 1 · 8 KB\n4 linhas lidas, 1 usada', 'acc', [PGX[0] + 56, 60, 140]]); }
      if (id === 'compare') { inG.visible = true; inZ = 60 * (1 - ease(ph(t, 0.2, 0.6)));
        if (t > 1.0) pg[0] = 'read'; if (t > 1.6) pg[1] = 'read'; if (t > 2.4) inS = 'read';
        const npg = (t > 1.0) + (t > 1.6), nin = t > 2.4 ? 1 : 0;
        out.con = { q: ['SELECT SUM(valor)', 'FROM pedidos;'], res: [[`PostgreSQL: ${npg} pág. de 8 KB`, npg === 2 ? 'acc' : 'hi'], [`InnoDB: ${nin} pág. de 16 KB`, nin ? 'acc' : 'hi'], ...(nin ? [['soma = 406.40 nos dois', 'dim']] : [])], meter: ['páginas PG · Inno', `${npg} · ${nin}`] };
        if (t > 1.7) out.tags.push(['PostgreSQL · 8 KB\n2 leituras', 'acc', [PGX[1] + 20, 60, 140]]);
        if (t > 2.5) out.tags.push(['InnoDB · 16 KB\n1 leitura, 6 linhas', 'acc', [INX + 150, 60, 140]]); }
      if (id === 'big') { toG.visible = true; toZ = 60 * (1 - ease(ph(t, 0.2, 0.6))); bst[1] = 'big';
        if (t > 0.8) beam(nb++, [[PGB[1].c[0] + 50, PGB[1].c[1], 26], [PGB[1].c[0] + 90, PGB[1].c[1], 120], [INX + 56, 150, 120], [INX + 56, 150, 26]]);
        if (t > 1.2) pg[0] = 'read'; if (t > 1.9) toS = 'read';
        const n = (t > 1.2) + (t > 1.9);
        out.con = { q: ['SELECT * FROM pedidos', 'WHERE id = 1042;'], res: [['linha 1042: ~10 KB', 'hi'], ['não cabe em 8 KB', 'bad'], ...(n === 2 ? [['página 1 + TOAST', 'acc']] : [])], meter: ['páginas lidas', String(n)] };
        if (t > 1.0) out.tags.push(['TOAST: a descrição do 1042\n4 pedaços de ~2 KB', 'acc', [INX + 80, 60, 140]]); }
      PGB.forEach((b, i) => { lift(b.g, i === 1 ? lz : 0); drawBlk(b, String(PED[i].id), bst[i] === 'big' ? 'Lena · → TOAST' : `${PED[i].cli} · ~2 KB`, bst[i] === 'big' ? 'star' : bst[i]); b.cap.emissiveIntensity = bst[i] === 'star' || bst[i] === 'big' ? 0.7 : 0; });
      drawPgTray(pgTray[0], 'PÁGINA 1', '8 KB · PostgreSQL', pg[0], false); drawPgTray(pgTray[1], 'PÁGINA 2', '8 KB · PostgreSQL', pg[1], false);
      lift(inG, inZ); lift(toG, toZ);
      if (inG.visible) { drawPgTray(inTray, 'PÁGINA 1 · 16 KB', 'InnoDB (MySQL) · 8 vagas', inS, true); INB.forEach((b, i) => { drawBlk(b, String(PED[i].id), `${PED[i].cli} · ~2 KB`, inS ? 'on' : ''); b.cap.emissiveIntensity = inS ? 0.35 : 0; }); }
      if (toG.visible) { drawPgTray(toTray, 'TOAST', '8 KB · pedaços', toS, false); TOB.forEach((b, i) => { drawBlk(b, `1042 · ${i + 1}/4`, 'descrição · ~2 KB', toS ? 'on' : ''); b.cap.emissiveIntensity = toS ? 0.5 : 0; }); }
      out.meter = out.con.meter.join(' ');
    },
  };

  const AT_TAG = (p) => p;
  function scene3() {
    { const base = VIEW.dist * Math.max(1, 1.45 / persp.aspect), z = camera === persp ? camera.position.distanceTo(controls.target) / base : 1 / (ortho.zoom || 1);
      const nz = Math.max(0.35, Math.min(1.6, z)); if (Math.abs(nz - ZC) > 0.002) { ZC = nz; tags.forEach(t => t.w0 && t.sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1)); } }
    litMat.resolution.copy(accentLineMat.resolution); edgeMat.resolution.copy(accentLineMat.resolution); litMat.color.copy(accent); edgeMat.color.copy(lineMat.color);
    nd = 0; nb = 0;
    const out = { con: {}, tags: [], meter: '' };
    MODE[sc](cur().id, lt, out);
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    for (let i = nb; i < BEAMS.length; i++) BEAMS[i].l.visible = false;
    drawCon(out.con); conCap.emissiveIntensity = nd > 0 ? 0.8 : 0.15;
    { const r = (out.con.res || [])[0], m = out.con.meter;            // a resposta, grande, em cima do terminal
      if (r && r[1] !== 'dim' && r[0].trim()) tCon.set(`${r[0]}${m ? `\n${m[0]}: ${m[1]}` : ''}`, r[1] === 'bad' ? 'bad' : r[1] === 'acc' ? 'acc' : 'hi').at(110, 44, 200); else tCon.hide(); }
    meterNow = out.meter;
    TAGS.forEach((T, i) => { const g = out.tags[i]; if (g) T.set(g[0], g[1]).at(...AT_TAG(g[2])); else T.hide(); });
    fitTags([tCon, ...TAGS].filter(T => T.sp.visible));
  }
  // mantém os rótulos dentro da área livre da tela (fora do painel e dos botões) e sem um cobrir o outro
  const _c = new THREE.Vector3(), _v = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3();
  function fitTags(list) {
    _r.setFromMatrixColumn(camera.matrixWorld, 0).normalize(); _u.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    const mob = NARROW(), L = mob ? -0.96 : -0.2, R = mob ? 0.96 : 0.66, T = mob ? 0.74 : 0.86, B = mob ? 1 - 2 * (innerHeight * 0.6 - 50) / innerHeight : -0.9;
    const rects = [];
    for (const t of list) {
      const sp = t.sp, hw = sp.scale.x / 2, hh = sp.scale.y / 2;
      _c.copy(sp.position).project(camera); const ex = Math.abs(_v.copy(sp.position).addScaledVector(_r, hw).project(camera).x - _c.x), ey = Math.abs(_v.copy(sp.position).addScaledVector(_u, hh).project(camera).y - _c.y);
      if (!ex || !ey) continue;
      let x = _c.x, y = _c.y;
      x = Math.min(R - ex, Math.max(L + ex, x)); y = Math.min(T - ey, Math.max(B + ey, y));
      for (let k = 0; k < 3; k++) for (const q of rects) if (Math.abs(x - q.x) < ex + q.ex && Math.abs(y - q.y) < ey + q.ey + 0.012) y = y >= q.y || q.y - q.ey - ey - 0.015 < B + ey ? q.y + q.ey + ey + 0.015 : q.y - q.ey - ey - 0.015;
      if (x !== _c.x || y !== _c.y) sp.position.addScaledVector(_r, (x - _c.x) / ex * hw).addScaledVector(_u, (y - _c.y) / ey * hh);
      rects.push({ x, y, ex, ey });
    }
  }

  // ── câmera ──
  const FOCUS = { row: [420, 160, 40], doc: [420, 130, 70], column: [420, 160, 40], wide: [410, 160, 40], kv: [420, 140, 40], graph: [420, 150, 40], page: [400, 160, 40] };
  const FOCUS_M = { row: [440, 200, 60], doc: [440, 150, 120], column: [440, 200, 60], wide: [430, 200, 60], kv: [440, 180, 60], graph: [440, 190, 60], page: [420, 200, 60] };
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > dur() + 6) lt = 0;
    scene3();
    if (now - nowAt > 300) { nowAt = now; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[sc], k = 1 - Math.exp(-dt / 0.6);
      const want = W(f[0] + (mob ? -10 : -124), f[1] + (mob ? 0 : 124), f[2] + (mob ? ZOFF() : 0)), dd = want.sub(controls.target).multiplyScalar(k);
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, dur() + 4)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (e.key >= '1' && e.key <= '7') return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) next(); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); CVS.forEach(c => c.key = ''); });
  applyVis(); render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  const VIEW = NARROW() ? { target: W(490, 150, 60 + ZOFF()), dist: innerWidth < 640 ? 10.8 : 13 } : { target: W(296, 284, 40), dist: 18.5 };
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar modelo', 'C', cycleSc]],
    view: VIEW,
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · modelo: C ou 1 a 7 · arraste para girar' };
})() });
