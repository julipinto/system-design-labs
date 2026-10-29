// Figura 3D (iso-glow): monolito × microsserviços. A loja inteira num programa só: o prédio (processo loja, 8 vCPU) com
// 7 salas em cima (os módulos), os 8 cubos de vCPU no meio e o tanque do banco loja ao lado. Depois o prédio se parte em
// serviços, cada um com o seu tanque. Ao fundo, o mostrador: vCPU em uso, ms do checkout, quantos estão no ar e o dado real.
// Cenários (toggle e ?mode=mono|ruido|queda|split|escala|conway; ?step=N abre no passo N).
// Dados: docs/escrita/microsservicos-brief.md (pedido 1047 da Lena: 79.90 + 15.00 = 94.90, estoque 3 → 2, checkout 180 ms,
// 5 ms por salto de rede, 23:00 com 7 de 8 vCPU, 120 ms → 2,4 s, limite 2 s, 80 × 25 vCPU, deploy de 40 min, trace_id=7f3a…).
FIGS3D.push({ id: 'monolito', name: 'Monolith', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const fmtMs = v => v == null ? '—' : v >= 1000 ? (v / 1000).toFixed(1) + ' s' : v < 1 ? v.toFixed(2) + ' ms' : Math.round(v) + ' ms';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SVC = ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas', 'relatorios'];
  const NM = { catalogo: 'CATALOG', carrinho: 'CART', pedidos: 'ORDERS', pagamentos: 'PAYMENTS', estoque: 'STOCK', entregas: 'SHIPPING', relatorios: 'REPORTS' };
  const SHORT = { catalogo: 'CAT', carrinho: 'CRT', pedidos: 'ORD', pagamentos: 'PAY', estoque: 'STK', entregas: 'SHP', relatorios: 'RPT' };
  const DESC = { catalogo: ['product 42', 'plush cat'], carrinho: ['Lena\'s items', '1 cat · 79.90'], pedidos: ['order 1047', 'total 94.90'],
    pagamentos: ['charges the card', 'amount 94.90'], estoque: ['GATO-042', 'quantidade: 3'], entregas: ['shipping and parcel', 'Recife · 15.00'], relatorios: ['cash closing', 'daily · 23:00'] };
  const TANK = { catalogo: ['documents', 'produtos'], carrinho: ['Redis', 'Lena\'s cart'], pedidos: ['PostgreSQL', 'pedidos · itens_pedido'],
    pagamentos: ['PostgreSQL', 'pagamentos'], estoque: ['PostgreSQL', 'estoque · GATO-042: 3'], entregas: ['own DB', 'remessas'], relatorios: ['own DB', 'fechamento'] };
  const BF = { catalogo: 10, carrinho: 3, pedidos: 3, pagamentos: 2, estoque: 2, entregas: 1, relatorios: 1 };   // replicas on Black Friday (relatorios: 1 × 4 vCPU)
  const SC = ['mono', 'ruido', 'queda', 'split', 'escala', 'conway'];
  const SCNAME = { mono: 'Monolith', ruido: 'Neighbor', queda: 'Crash', split: 'Split', escala: 'Scale', conway: 'Conway' };
  const SCFULL = { mono: 'The monolith inside', ruido: 'Noisy neighbor', queda: 'Blast radius', split: 'Splitting into services', escala: 'Black Friday', conway: 'Conway\'s Law' };
  const AULA = { mono: 'aula-1-introducao', ruido: 'aula-2-monolitos', queda: 'aula-2-monolitos', split: 'aula-3-microsservicos', escala: 'aula-3-microsservicos', conway: 'aula-6-lei-de-conway' };
  let clk = 0, sc = 'mono', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-monolito3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, RW = 128, RD = 62, RH = 22, SLH = 20, SLZ = PL + SLH, TD = 36;
  plateWith(g0, 780, 470, [[14, 14], [766, 14], [14, 456], [766, 456]]);
  hazeAndShadow(g0, 390, 235, 9.4, 5.6);
  // mostrador ao fundo (o desenho é feito em 520 × 112 e ampliado)
  rbox(24, 12, PL, 660, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 28, 24, PL + 146, 652, 140, 4, g0), SK = 652 / 520;
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(w, d, h, lab, sub, r = 6) {
    const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, r, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, Math.min(5, 3200 / w), g);
    const fh = Math.min(16, h - 4), fr = fh >= 6 ? faceCanvas('front', 3, d, h - 1, w - 6, fh, Math.min(9, 5600 / w), g) : null;
    return { g, mat, top, fr, fh, w, d, h, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const B = {};
  SVC.forEach(n => { B[n] = block(RW, RD, RH, NM[n], 'module'); B['tk_' + n] = block(RW, TD, 14, 'DB', ''); });
  B.slab = block(576, 188, SLH, 'PROCESS loja', '1 binary · 8 vCPU · 1 DB', 8);
  B.db = block(130, 152, 34, 'DB loja', 'PostgreSQL');
  B.fila = block(RW, RD, 16, 'QUEUE', 'events');
  for (let i = 0; i < 10; i++) B['c' + i] = block(136, 70, 24, 'LOJA', `copy ${i + 1}`);
  B.ld = block(668, 190, 22, 'DBA', '', 8); B.lb = block(640, 170, 22, 'BACKEND', '', 8); B.lf = block(612, 150, 22, 'FRONTEND', '', 8);
  B.iv = block(152, 134, 3, '', '', 8); B.ic = block(520, 134, 3, '', '', 8); B.il = block(340, 136, 3, '', '', 8);
  const NAMES = Object.keys(B);
  // os 8 vCPU do servidor: cubos no canto livre do prédio (acendem com quem está usando)
  const CUBES = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 18, 18, 14, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.22); g0.add(glow); return { g, mat, glow, z: 0 }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 6 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.on ? (b.fat ? 7.5 : 5.5) : 3.5) * TS, d = C_.clone().sub(A), len = d.length();
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera (balões fixos e mensagens que viajam) ──
  // no claro a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto)
  const GAM = { value: 0 };
  const gamFix = mat => { mat.onBeforeCompile = sh => { sh.uniforms.uGam = GAM;
    sh.fragmentShader = 'uniform float uGam;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      if ( uGam > 0.5 ) sampledDiffuseColor.rgb = mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) );
      diffuseColor *= sampledDiffuseColor;
    #endif`); }; mat.needsUpdate = true; };
  const texCS = () => theme === 'light' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  const tags = [];
  function tag(h = 12) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS();
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); gamFix(mat);
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `700 ${fs}px ${MONO3}`, f2 = `600 ${fs * 0.82}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.82 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh || tex.colorSpace !== texCS()) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS(); mat.map = tex; mat.needsUpdate = true; }
      const col = t.tone === 'acc' ? accC() : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.96)' : 'rgba(18,19,20,.92)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.45); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(14), tag(14), tag(14)], MSGS = [tag(13), tag(13)], LENA = tag(12);

  // ── lugares e rotas ──
  // monolito: salas em cima do prédio (4 × 2, o canto livre é dos cubos de vCPU); serviços: no chão, afastados, tanque na frente
  const MC = [30, 172, 314, 456], MR = [190, 292], SX = [20, 200, 380, 560], SY = [180, 320];
  const GRID = { catalogo: [0, 0], carrinho: [1, 0], pedidos: [2, 0], pagamentos: [3, 0], relatorios: [0, 1], entregas: [2, 1], estoque: [3, 1] };
  const mPos = n => [MC[GRID[n][0]], MR[GRID[n][1]], SLZ];
  const sPos = n => [SX[GRID[n][0]], SY[GRID[n][1]], PL];
  const tPos = n => [SX[GRID[n][0]], SY[GRID[n][1]] + RD + 6, PL];
  const cxM = n => MC[GRID[n][0]] + RW / 2, edgeM = n => GRID[n][1] ? MR[1] : MR[0] + RD, YC = 272, ZM = SLZ + 1.5, ZS = PL + 9;
  const R = {
    hop: (a, b) => [[cxM(a), edgeM(a), ZM], [cxM(a), YC, ZM], [cxM(b), YC, ZM], [cxM(b), edgeM(b), ZM]],
    lenaM: n => [[-70, YC, PL + 3], [20, YC, PL + 3], [20, YC, ZM], [cxM(n), YC, ZM], [cxM(n), edgeM(n), ZM]],
    toDb: n => [[cxM(n), edgeM(n), ZM], [cxM(n), YC, ZM], [630, YC, ZM]],
  };
  const NET0 = {
    'carrinho>pedidos': [[328, 211], [380, 211]], 'pedidos>pagamentos': [[508, 211], [560, 211]],
    'pagamentos>estoque': [[688, 211], [708, 211], [708, 351], [688, 351]], 'estoque>entregas': [[560, 351], [508, 351]],
    'pedidos>fila': [[380, 232], [354, 232], [354, 340], [328, 340]], 'fila>entregas': [[328, 366], [380, 366]],
    'lena>catalogo': [[-70, 211], [20, 211]], 'lena>carrinho': [[-70, 302], [174, 302], [174, 232], [200, 232]],
  };
  const net = k => NET0[k].map(p => [p[0], p[1], ZS]);
  const rev = pts => pts.slice().reverse();
  const CHAIN = [['carrinho', 'pedidos'], ['pedidos', 'pagamentos'], ['pagamentos', 'estoque'], ['estoque', 'entregas']];
  const cubeP = k => [180 + (k % 4) * 24, 296 + (k >> 2) * 24, SLZ];
  const cPos = i => [20 + (i % 5) * 150, 190 + (i / 5 | 0) * 120, PL];
  const SUMM = [264, 440, PL];            // faixa livre na frente, para o balão de resumo
  const ISL = { iv: [8, 166, PL], ic: [188, 166, PL], il: [368, 306, PL] };
  // contorno (raio de explosão, time dono de tudo)
  const ringPts = (x0, y0, x1, y1, z) => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [x0, y0, z]];

  // ── conteúdo dos blocos ──
  const roomRows = (n, a, b, tone) => [[a ?? DESC[n][0], 13, tone === 'bad' ? 'bad' : tone === 'dead' ? 'dim' : 'hi'], [b ?? DESC[n][1], 9.6, tone === 'bad' ? 'bad' : 'dim']];
  const tankRows = (n, b, tone) => [[TANK[n][0], 8.2, 'acc'], [b ?? TANK[n][1], 8.2, tone || 'hi']];
  const dbRows = (est = 3, tone) => [['tables', 7, 'dim'], ['produtos · pedidos', 8.2], ['itens_pedido', 8.2], ['pagamentos', 8.2], ['remessas', 8.2], [`estoque GATO-042: ${est}`, 8.6, tone || 'acc']];
  const SLAB = [{ slot: true }];
  const chipsOf = (hi = [], bad = []) => ({ chips: SVC.map(n => [SHORT[n], hi.includes(n) ? 'acc' : bad.includes(n) ? 'bad' : 'dim']) });

  // ── o que se vê em cada passo (spec) ──
  function blank() {
    return { pos: {}, on: {}, rows: {}, front: {}, beams: [], tags: [], msgs: [], cubes: null, cpu: null, ms: null, msLab: 'CHECKOUT MS', msTone: '', lim: 0,
      up: null, mid: null, cmdLab: '', cmd: [], lena: null };
  }
  const CUB1 = ['acc', 0, 0, 0, 0, 0, 0, 0];
  const cpuOf = (cells, sub = '', subTone = 'dim', lab = 'vCPU IN USE') => { const n = cells.filter(Boolean).length; return { lab, txt: `${n} / ${cells.length}`, cells, sub, subTone }; };
  function mono(o, { sub = 'module' } = {}) {
    o.pos.slab = [20, 178, PL]; o.pos.db = [630, 214, PL]; o.rows.slab = SLAB; o.rows.db = dbRows();
    SVC.forEach(n => { o.pos[n] = mPos(n); o.rows[n] = roomRows(n); o.front[n] = { lab: NM[n], sub }; });
    o.cubes = CUB1.slice(); o.cpu = cpuOf(o.cubes, 'checkout and storefront', 'dim'); o.up = { n: 7, of: 7, unit: 'modules' };
    CHAIN.forEach(([a, b]) => o.beams.push({ pts: R.hop(a, b) })); o.beams.push({ pts: R.toDb('pedidos') }); o.lena = 'mono';
    return o;
  }
  function svc(o, { tanks = true, fila = true } = {}) {
    SVC.forEach(n => { o.pos[n] = sPos(n); o.rows[n] = roomRows(n); o.front[n] = { lab: NM[n], sub: 'service' };
      if (tanks) { o.pos['tk_' + n] = tPos(n); o.rows['tk_' + n] = tankRows(n); } });
    if (fila) { o.pos.fila = [SX[1], SY[1], PL]; o.rows.fila = [['event queue', 8.2, 'dim'], ['empty', 8.6, 'dim']]; }
    o.up = { n: 7, of: 7, unit: 'services' }; o.cpu = { lab: 'PROCESSES', txt: '7', cells: [], sub: 'one per service (before: 1)', subTone: 'dim' };
    CHAIN.forEach(([a, b]) => o.beams.push({ pts: net(a + '>' + b) })); if (fila) o.beams.push({ pts: net('pedidos>fila') }, { pts: net('fila>entregas') }); o.lena = 'svc';
    return o;
  }
  function base() { const o = blank(); if (sc === 'mono' || sc === 'ruido' || sc === 'queda') mono(o); else svc(o); if (sc === 'escala' || sc === 'conway') o.lena = null; return o; }
  const T = (o, at, text, tone = 'acc', dz = 30) => o.tags.push([at, text, tone, dz]);
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7, fat = false) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, fat, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const at = (t, a) => t >= a;
  const CALLS = ['pedidos.criar(1047, 94.90)', 'pagamentos.cobrar(94.90)', 'estoque.baixar("GATO-042")', 'entregas.agendar(1047)'];
  const HTTP = ['POST /pedidos  {id: 1047}', 'POST /pagamentos  {94.90}', 'POST /reservas  {GATO-042}', 'POST /remessas  {1047}'];

  const STEPS = {
    mono: [
      { id: 'loja', dur: 4.5, title: 'One program: the whole store in one process',
        story: 'At the end of module 5 the store got fast: the plush cat sits in Redis at 79.90. But the whole store is still one program, the loja process, on an 8 vCPU server with a single database, loja. Inside it live 7 modules: Catalog, Cart, Orders, Payments, Stock, Shipping and Reports.',
        look: 'A building (the loja process) with 7 rooms on top, the 8 vCPU cubes in the free corner and the loja database tank on the right.',
        key: 'Monolith: all modules in the same process, the same deploy and the same database.',
        f(o, t) { o.cmdLab = 'the process'; o.cmd = ['process: loja', 'server: 8 vCPU', 'modules: 7 (one binary)', 'database: loja (PostgreSQL)', 'deploy: 1 for everything'];
          SVC.forEach((n, i) => { if (t > 0.4 + i * 0.3 && t < 0.4 + i * 0.3 + 0.9) o.on[n] = 1; });
          if (t > 2.8) { T(o, 'slab', '1 process · 7 modules', 'acc', 66); T(o, 'db', '1 database: loja', 'hi', 24); } } },
      { id: 'chamadas', dur: 7.5, title: 'Order 1047\'s checkout crosses the rooms',
        story: 'Lena, in Recife, buys another plush cat for her brother: order 1047, 79.90 plus 15.00 shipping. The checkout goes through Cart, Orders, Payments, Stock and Shipping. Each hop is a function call inside the same process and takes about 0.01 ms.',
        look: 'The light leaves Cart and travels along the corridor between the rooms to Shipping; each hop carries the name of the function called.',
        key: 'In a monolith, one module talks to another through a function call: there is no network in between.',
        f(o, t) { o.cmdLab = 'calls in the same process'; o.msLab = 'MS IN LOCAL CALLS'; o.ms = 0;
          send(o, t, 0.2, 1.1, R.lenaM('carrinho'), 'POST /checkout (Lena)', 'hi', 0.3); if (t > 1.1) o.on.carrinho = 1;
          let n = 0; CHAIN.forEach(([a, b], i) => { const s = 1.4 + i * 1.3; if (send(o, t, s, s + 0.9, R.hop(a, b), CALLS[i], 'acc', 0.3)) { n = i + 1; o.on[b] = 1; } if (t > s) o.on[a] = 2; });
          o.ms = n * 0.01; o.cmd = ['carrinho.fechar(1047)', ...CALLS.slice(0, n).map(c => '→ ' + c)];
          if (t > 6.6) T(o, [cxM('pagamentos') - 70, YC, ZM], '4 calls × 0.01 ms\n= 0.04 ms', 'acc', 44); } },
      { id: 'commit', dur: 6.5, title: 'One transaction: BEGIN … COMMIT, 180 ms',
        story: 'All of this runs inside a single transaction in the loja database. The order goes into pedidos, the payment into pagamentos and the plush cat stock drops from 3 to 2. The COMMIT writes everything together, and the whole checkout takes 180 ms.',
        look: 'The writes go down from the building to the loja database tank; the stock changes from 3 to 2 and the counter stops at 180 ms.',
        key: 'One database, one transaction: it writes everything or nothing (the ACID from module 3).',
        f(o, t) { o.cmdLab = 'SQL on the loja database'; ['carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'].forEach(n => o.on[n] = 2);
          const L = ['BEGIN;', "INSERT INTO pedidos … (1047, 'Lena', 94.90);", 'INSERT INTO pagamentos … (1047, 94.90);', "UPDATE estoque SET quantidade = 2 WHERE sku = 'GATO-042';", 'COMMIT;'];
          let n = 1; [0.9, 2.0, 3.1, 4.3].forEach((s, i) => { if (t > s) n = i + 2; }); o.cmd = L.slice(0, n);
          send(o, t, 0.9, 1.7, R.toDb('pedidos'), 'INSERT order 1047', 'acc', 0.2); send(o, t, 2.0, 2.8, R.toDb('pagamentos'), 'INSERT payment 94.90', 'acc', 0.2);
          send(o, t, 3.1, 3.9, R.toDb('estoque'), 'UPDATE estoque 3 → 2', 'acc', 0.2);
          o.ms = Math.round(180 * clamp(t / 4.6)); o.on.db = t > 0.9 && t < 4.8 ? 1 : 0;
          if (t > 3.9) { o.rows.db = dbRows(2); o.rows.estoque = roomRows('estoque', 'GATO-042', 'quantidade: 2'); }
          if (t > 4.6) { o.cmd = L.concat('-- checkout: 180 ms'); T(o, 'db', 'COMMIT\nestoque 3 → 2', 'acc', 22); T(o, 'slab', 'whole checkout: 180 ms', 'acc', 66); } } },
      { id: 'rollback', dur: 7, title: 'What if it goes wrong: stock ran out and ROLLBACK undoes it',
        story: 'Go back to the checkout with one detail: someone took the last cats and stock is already 0. The order and the payment of 94.90 went in, but everything is still in the same transaction. Stock refuses, the ROLLBACK comes, and the order and the payment disappear together. Nobody wrote code to undo anything.',
        look: 'Stock turns red with 0; the light returns to the database and the rows for order 1047 and the payment disappear.',
        key: 'In a monolith consistency comes for free: one ROLLBACK undoes everything at once.',
        f(o, t) { o.cmdLab = 'SQL on the loja database'; o.rows.db = dbRows(0, 'bad'); o.rows.estoque = roomRows('estoque', 'GATO-042', 'quantidade: 0', 'bad');
          const L = ['BEGIN;', 'INSERT INTO pedidos … (1047, …);', 'INSERT INTO pagamentos … (94.90);', 'estoque.baixar("GATO-042") → 0: refused', 'ROLLBACK;', '-- 1047 and the payment: undone'];
          let n = 1; [0.5, 1.6, 2.7, 4.0, 5.2].forEach((s, i) => { if (t > s) n = i + 2; }); o.cmd = L.slice(0, n);
          send(o, t, 0.5, 1.3, R.toDb('pedidos'), 'INSERT order 1047', 'acc', 0.2); send(o, t, 1.6, 2.4, R.toDb('pagamentos'), 'INSERT pagamento', 'acc', 0.2);
          if (t > 0.5) o.on.pedidos = 2; if (t > 1.6) o.on.pagamentos = 2;
          if (t > 2.7) { o.on.estoque = 'bad'; T(o, 'estoque', 'stock: 0 · refused', 'bad', 26); }
          send(o, t, 4.0, 4.8, R.toDb('estoque'), 'ROLLBACK', 'bad', 0.6);
          if (t > 4.8) { o.on.pedidos = 0; o.on.pagamentos = 0; o.rows.pedidos = roomRows('pedidos', 'order 1047', 'undone', 'dead'); o.rows.pagamentos = roomRows('pagamentos', 'payment', 'undone', 'dead');
            T(o, 'db', 'ROLLBACK\nnothing was saved', 'acc', 22); } } },
    ],
    ruido: [
      { id: 'normal', dur: 4.5, title: '22:59: the plush cat page in 120 ms',
        story: 'It is 22:59. The store uses 1 of the 8 vCPUs and the plush cat page opens in 120 ms. Lena has the cat in her cart, ready to close order 1047.',
        look: 'One vCPU cube lit; the light goes from Lena to Catalog and comes back with the page in 120 ms.',
        key: 'All modules share the same 8 vCPUs.',
        f(o, t) { o.cmdLab = 'request · 22:59'; o.msLab = 'PLUSH CAT PAGE MS'; o.cmd = ['GET /produto/42'];
          send(o, t, 0.3, 1.2, R.lenaM('catalogo'), 'GET /produto/42', 'hi', 0.1);
          if (t > 1.2) o.on.catalogo = 1; if (send(o, t, 1.6, 2.5, rev(R.lenaM('catalogo')), '200 · 120 ms', 'acc', 0.6)) { o.cmd = ['GET /produto/42', '→ 200 · 120 ms']; }
          o.ms = t > 2.5 ? 120 : t > 0.3 ? Math.round(120 * clamp((t - 0.3) / 2.2)) : 0;
          if (t > 3.0) T(o, 'catalogo', 'plush cat page: 120 ms', 'acc', 26); } },
      { id: 'relatorio', dur: 5.5, title: '23:00: Reports eats 7 of 8 vCPUs',
        story: 'At 23:00 the Reports module runs the cash closing and adds up all the orders of the day. It takes 7 of the 8 vCPUs and holds them for 15 min. That leaves 1 vCPU for storefront, cart and checkout together.',
        look: 'Reports turns red and the vCPU cubes turn red one by one, up to 7.',
        key: 'In the same process, the hungriest module takes everyone\'s CPU.',
        f(o, t) { o.cmdLab = 'Reports · 23:00'; o.msLab = 'MS DA PÁGINA DO GATO'; o.ms = 120; o.on.relatorios = 'bad';
          o.rows.relatorios = roomRows('relatorios', 'closing', 'running · 15 min', 'bad');
          let k = 0; for (let i = 1; i < 8; i++) if (t > 0.5 + i * 0.35) { o.cubes[i] = 'bad'; k = i; }
          o.cpu = cpuOf(o.cubes, k ? `Reports: ${k} · rest: 1` : 'checkout and storefront', k ? 'bad' : 'dim'); o.cpu.tone = k === 7 ? 'bad' : '';
          o.cmd = ['cash closing', 'SELECT sum(total) FROM pedidos', '  WHERE criado_em >= current_date;', `Reports vCPUs: ${k} of 8 · 15 min`];
          if (t > 3.2) T(o, 'relatorios', '7 of 8 vCPUs\nfor 15 min', 'bad', 26); } },
      { id: 'lento', dur: 6, title: 'The plush cat page: from 120 ms to 2.4 s',
        story: 'Lena reloads the plush cat page. Catalog did not change a line, but now it fights for 1 vCPU with everyone else. The same page that took 120 ms now takes 2.4 s.',
        look: 'The light moves slowly between Lena and Catalog and the counter climbs to 2.4 s.',
        key: 'Noisy neighbor: one module slows the others down without touching their code.',
        f(o, t) { o.cmdLab = 'request · 23:01'; o.msLab = 'MS DA PÁGINA DO GATO'; o.on.relatorios = 'bad'; o.rows.relatorios = roomRows('relatorios', 'closing', 'running · 15 min', 'bad');
          for (let i = 1; i < 8; i++) o.cubes[i] = 'bad'; o.cpu = cpuOf(o.cubes, 'Reports: 7 · rest: 1', 'bad'); o.cpu.tone = 'bad';
          send(o, t, 0.2, 1.0, R.lenaM('catalogo'), 'GET /produto/42', 'hi', 0.1); if (t > 1.0) o.on.catalogo = 'bad';
          const f = clamp((t - 0.2) / 4.2); o.ms = Math.round(2400 * f); o.msTone = 'bad';
          o.cmd = ['GET /produto/42', t > 4.4 ? '→ 200 · 2.4 s (before: 120 ms)' : '… waiting for CPU'];
          if (t > 4.4) { send(o, t, 4.4, 5.0, rev(R.lenaM('catalogo')), '200 · 2.4 s', 'bad', 1); T(o, 'catalogo', '120 ms → 2.4 s\nsame code', 'bad', 26); } } },
      { id: 'timeout', dur: 7, title: 'What if it goes wrong: Lena\'s checkout goes past 2 s',
        story: 'Lena clicks buy. The checkout, which took 180 ms, waits for CPU at every step and crosses the 2 s limit. Order 1047 fails with a timeout. Nobody touched the checkout: the problem lives in the next room.',
        look: 'The checkout light stalls halfway and turns red when the counter passes the 2 s line.',
        key: 'In a monolith, one module\'s excess becomes its neighbor\'s failure.',
        f(o, t) { o.cmdLab = 'checkout · 23:02'; o.lim = 2000; o.on.relatorios = 'bad'; o.rows.relatorios = roomRows('relatorios', 'closing', 'running · 15 min', 'bad');
          for (let i = 1; i < 8; i++) o.cubes[i] = 'bad'; o.cpu = cpuOf(o.cubes, 'Reports: 7 · rest: 1', 'bad'); o.cpu.tone = 'bad';
          send(o, t, 0.2, 1.0, R.lenaM('carrinho'), 'POST /checkout (1047)', 'hi', 0.1); if (t > 1.0) o.on.carrinho = 2;
          const f = clamp((t - 1.0) / 4.0), late = t > 5.0; o.ms = Math.round(2000 * f); o.msTone = f > 0.9 ? 'bad' : '';
          const hops = late ? 1.5 : f * 1.5; CHAIN.forEach(([a, b], i) => { if (hops > i) { const g = clamp(hops - i); o.beams.push({ pts: R.hop(a, b), on: true, tone: late ? 'bad' : '', dot: g < 1 && !late ? g : null, cut: g }); o.on[a] = 2; } });
          o.cmd = ['POST /checkout  (pedido 1047)', late ? '→ error: timeout after 2 s' : '… pagamentos waiting for CPU'];
          if (late) { o.on.pagamentos = 'bad'; T(o, 'pagamentos', 'timeout: 2 s\norder 1047 failed', 'bad', 26); T(o, 'relatorios', 'the problem lives here', 'bad', 26); } } },
    ],
    queda: [
      { id: 'frete', dur: 5, title: 'Shipping calculates the freight for 1047',
        story: 'Everything is up. In the checkout of order 1047, the Shipping module calculates the freight to Recife: 15.00. It is a function like any other, inside the same loja process, using the same memory as the other six modules.',
        look: 'The light reaches Shipping, which returns freight 15.00; the memory bar at the front of the building is calm.',
        key: 'In a monolith, all modules share one process and one memory.',
        f(o, t) { o.cmdLab = 'call'; o.front.slab = { lab: 'PROCESS loja', sub: 'process memory', bar: 0.3 };
          o.cmd = ['entregas.calcularFrete(1047,', '  { cidade: "Recife", cep: "50050-000" })'];
          send(o, t, 0.3, 1.2, R.hop('estoque', 'entregas'), 'calcularFrete(1047)', 'acc', 0.3); if (t > 1.2) o.on.entregas = 1;
          if (t > 1.8) { o.cmd = o.cmd.concat('→ 15.00'); o.rows.entregas = roomRows('entregas', 'frete: 15.00', 'Recife'); T(o, 'entregas', 'freight: 15.00', 'acc', 26); } } },
      { id: 'memoria', dur: 6, title: 'A bug in the freight code: memory fills up',
        story: 'A new version of the freight calculation has a bug: Shipping starts holding on to data and never lets go. The memory of the loja process keeps filling up. Since there is only one process, the memory that runs out belongs to every module.',
        look: 'Shipping turns red and the memory bar at the front of the building fills to the end.',
        key: 'One process, one memory: one module\'s leak is everyone\'s.',
        f(o, t) { o.cmdLab = 'loja process log'; const f = clamp(0.3 + t / 5); o.front.slab = { lab: 'PROCESS loja', sub: 'process memory', bar: f, tone: f > 0.8 ? 'bad' : '' };
          o.on.entregas = 'bad'; o.rows.entregas = roomRows('entregas', 'calcularFrete()', 'holds and never frees', 'bad');
          o.cmd = ['entregas.calcularFrete() still running', `process memory: ${f > 0.95 ? 'full' : 'rising'}`];
          if (t > 1.0) T(o, 'entregas', 'freight bug\nmemory only grows', 'bad', 26); if (f > 0.95) T(o, 'slab', 'process memory: full', 'bad', 66); } },
      { id: 'caiu', dur: 6, title: 'The process crashes: the whole store goes down',
        story: 'Memory runs out and the operating system kills the loja process. With Shipping go the storefront, the cart and payments: the whole store goes down. Lena opens the plush cat page and gets nothing back.',
        look: 'The 7 rooms go dark together, the vCPU cubes switch off and the counter goes to 0 of 7 up.',
        key: 'When the process crashes, every module inside it crashes.',
        f(o, t) { o.cmdLab = 'system log'; const down = t > 0.8; o.front.slab = { lab: 'PROCESS loja', sub: down ? 'down' : 'process memory', bar: down ? 0 : 1, tone: 'bad' };
          o.cmd = ['Out of memory: Killed process (loja)']; o.on.entregas = 'bad';
          if (down) { SVC.forEach(n => { o.on[n] = 'dead'; o.rows[n] = roomRows(n, DESC[n][0], 'down', 'dead'); }); o.cubes = [0, 0, 0, 0, 0, 0, 0, 0]; o.cpu = cpuOf(o.cubes, 'process dead', 'bad'); o.up = { n: 0, of: 7, unit: 'modules' }; o.beams = []; }
          if (send(o, t, 2.4, 3.3, R.lenaM('catalogo').slice(0, 3), 'GET /produto/42', 'hi', 0.1)) { o.cmd = o.cmd.concat('GET /produto/42 → no response'); }
          if (t > 3.3) { o.beams.push({ pts: R.lenaM('catalogo').slice(0, 3), on: true, tone: 'bad', cut: 0.6 }); T(o, 'catalogo', 'the storefront is down too', 'bad', 26); }
          if (t > 4.2) T(o, 'slab', '0 of 7 modules up', 'bad', 66); } },
      { id: 'raio', dur: 6.5, title: 'What if it goes wrong all the way: one module took down all seven',
        story: 'The fix belongs to Shipping, in a single function. But the program is one: to ship the fix, a new binary of the whole store goes out, and the deploy takes 40 min, with the 3 teams in the same queue. Meanwhile, none of the 7 modules sells anything.',
        look: 'A red outline covers the whole building: that is the blast radius. Only Shipping had the bug.',
        key: 'Blast radius: in a monolith, what one module breaks is the whole store.',
        f(o, t) { o.cmdLab = 'fix deploy'; o.front.slab = { lab: 'PROCESS loja', sub: 'down', bar: 0, tone: 'bad' }; o.beams = [];
          SVC.forEach(n => { o.on[n] = n === 'entregas' ? 'bad' : 'dead'; o.rows[n] = roomRows(n, n === 'entregas' ? 'the bug was here' : DESC[n][0], 'down', n === 'entregas' ? 'bad' : 'dead'); });
          o.cubes = [0, 0, 0, 0, 0, 0, 0, 0]; o.cpu = cpuOf(o.cubes, 'process dead', 'bad'); o.up = { n: 0, of: 7, unit: 'modules' };
          const f = clamp(t / 1.6); o.beams.push({ pts: ringPts(12, 170, 604, 374, SLZ + 1), on: true, tone: 'bad', cut: f, fat: true });
          o.cmd = ['fix: 1 function in entregas', 'build: whole store (7 modules)', 'deploy: 40 min', 'queue: 3 teams waiting'];
          if (t > 1.8) T(o, 'slab', 'blast radius: 7 of 7', 'bad', 66); if (t > 3) T(o, 'entregas', '1 bug · 40 min deploy', 'bad', 26); } },
    ],
    split: [
      { id: 'partir', dur: 5.5, title: 'The building splits: 6 services and Reports',
        story: 'The way out is to split the program. Each module becomes a service with its own process: catalogo, carrinho, pedidos, pagamentos, estoque and entregas, plus relatorios on its own. And each one gets its own database: the catalog in documents, the cart in Redis, orders, payments and stock in PostgreSQL.',
        look: 'The rooms come down from the building, move apart, and each one gets its own database tank in front.',
        key: 'Microservice: one process per service, with its own deploy and database.',
        f(o, t) { o.cmdLab = 'services and databases';
          if (t < 1.0) { const m = mono(blank()); Object.assign(o, m, { cmdLab: o.cmdLab }); }
          o.cmd = SVC.slice(0, 6).map(n => `${n.padEnd(11)}→ ${TANK[n][0]}`);
          if (t > 3.2) { T(o, 'tk_pedidos', 'database per service', 'acc', 20); } } },
      { id: 'rede', dur: 7.5, title: 'The same checkout, now over the network: 200 ms',
        story: 'The checkout of 1047 takes the same path, except each hop crosses the network and costs about 5 ms. That is 4 hops between 5 services: 180 + 4 × 5 = 200 ms. The network is now part of the bill.',
        look: 'The light jumps from service to service along the thick beams; each hop adds +5 ms and the counter closes at 200 ms.',
        key: 'Between services, each call is a round trip over the network.',
        f(o, t) { o.cmdLab = 'calls over the network'; o.ms = 180;
          send(o, t, 0.2, 1.1, net('lena>carrinho'), 'POST /checkout (Lena)', 'hi', 0.3); if (t > 1.1) o.on.carrinho = 1;
          let n = 0; CHAIN.forEach(([a, b], i) => { const s = 1.4 + i * 1.3; if (send(o, t, s, s + 0.9, net(a + '>' + b), '+5 ms', 'acc', 0.3, true)) { n = i + 1; o.on[b] = 1; } if (t > s) o.on[a] = 2; });
          o.ms = 180 + 5 * n; o.cmd = HTTP.slice(0, n).concat(n === 4 ? ['180 + 4 × 5 = 200 ms'] : []);
          if (t > 6.6) T(o, 'pagamentos', '4 hops × 5 ms\n180 → 200 ms', 'acc', 26); } },
      { id: 'vizinho', dur: 5.5, title: '23:00: Reports runs in its own corner',
        story: 'At 23:00 the cash closing runs again, now in the relatorios service, with its own 4 vCPUs. It can use all of them without taking anything from anyone. The plush cat page stays at 120 ms.',
        look: 'Reports lights up alone, full; the light goes from Lena to catalog and back in 120 ms.',
        key: 'Each service with its own resources: the noisy neighbor stays isolated.',
        f(o, t) { o.cmdLab = 'request · 23:01'; o.msLab = 'MS DA PÁGINA DO GATO'; o.on.relatorios = 1;
          o.rows.relatorios = roomRows('relatorios', 'closing', '4 of 4 vCPUs (its own)');
          o.cpu = { lab: 'REPORTS vCPUs', txt: '4 / 4', cells: ['acc', 'acc', 'acc', 'acc'], sub: 'only its own: nobody else loses anything', subTone: 'dim' };
          send(o, t, 0.6, 1.4, net('lena>catalogo'), 'GET /produto/42', 'hi', 0.1); if (t > 1.4) o.on.catalogo = 1;
          send(o, t, 1.8, 2.6, rev(net('lena>catalogo')), '200 · 120 ms', 'acc', 0.6); o.ms = t > 2.6 ? 120 : Math.round(120 * clamp((t - 0.6) / 2));
          o.cmd = ['GET /produto/42', t > 2.6 ? '→ 200 · 120 ms (even at 23:00)' : '…'];
          if (t > 3.0) { T(o, 'catalogo', 'plush cat page: 120 ms', 'acc', 26); T(o, 'relatorios', 'closing · 4 own vCPUs', 'acc', 26); } } },
      { id: 'fila', dur: 8, title: 'Shipping goes down: the store keeps selling',
        story: 'The freight bug comes back and takes down the entregas service. Only that one goes down. Order 1047 is paid and the PedidoPago event waits in the queue. When entregas comes back, it reads the event and schedules the parcel. Lena did not even notice.',
        look: 'Shipping goes dark with an X; the PedidoPago stops in the queue and only moves on to entregas when it comes back.',
        key: 'With separate services, one going down does not take the others with it.',
        f(o, t) { o.cmdLab = 'event in the queue'; o.ms = 200; const back = t > 5.0;
          if (!back) { o.on.entregas = 'dead'; o.rows.entregas = roomRows('entregas', 'down', 'freight bug', 'dead'); o.up = { n: 6, of: 7, unit: 'services' }; }
          send(o, t, 0.5, 1.5, net('pedidos>fila'), 'PedidoPago e-502', 'acc', 0.2); if (t > 0.5) o.on.pedidos = 2;
          if (t > 1.5 && t < 5.6) { o.on.fila = 1; o.rows.fila = [['waiting: 1', 8.2, 'acc'], ['PedidoPago e-502', 8.6, 'hi']]; }
          o.cmd = ['PedidoPago {', '  evento_id: "e-502",', '  pedido_id: 1047,', '  valor: 94.90', '}'];
          if (t > 1.6 && !back) { T(o, 'fila', 'PedidoPago waits', 'acc', 24); T(o, 'catalogo', 'storefront stays up', 'acc', 26); }
          if (back) { o.rows.entregas = roomRows('entregas', 'back up', 'reads e-502'); o.on.entregas = 1; }
          if (send(o, t, 5.6, 6.4, net('fila>entregas'), 'PedidoPago e-502', 'acc', 0.3)) { o.rows.entregas = roomRows('entregas', 'parcel for 1047', 'scheduled'); T(o, 'entregas', 'delivered later · nothing lost', 'acc', 26); } } },
      { id: 'compensa', dur: 8, title: 'What if it goes wrong: paid, but stock ran out',
        story: 'Now the payment of 94.90 is approved, but the reservation fails: the plush cat stock is already 0. There is no single ROLLBACK that undoes everything, because each service has its own database. Someone has to compensate and refund the payment. And to understand what happened, the order went through 5 services and 5 logs, tied together by trace_id=7f3a….',
        look: 'Stock turns red with 0, the light goes back to pagamentos with the refund, and each service shows its own log line with the same trace_id.',
        key: 'The price of microservices: without a single transaction, undoing becomes compensating.',
        f(o, t) { o.cmdLab = 'logs · trace_id=7f3a…'; o.ms = 200; o.rows['tk_estoque'] = tankRows('estoque', 'estoque · GATO-042: 0', 'bad');
          if (t > 0.3) o.on.carrinho = 2; if (t > 0.3) o.on.pedidos = 2;
          send(o, t, 0.3, 1.1, net('pedidos>pagamentos'), 'charge 94.90', 'acc', 0.2);
          if (t > 1.1) { o.on.pagamentos = 1; o.rows.pagamentos = roomRows('pagamentos', 'approved', '94.90'); }
          send(o, t, 1.6, 2.4, net('pagamentos>estoque'), 'reserve GATO-042', 'acc', 0.2);
          if (t > 2.4) { o.on.estoque = 'bad'; o.rows.estoque = roomRows('estoque', 'GATO-042: 0', 'reservation failed', 'bad'); }
          if (send(o, t, 3.0, 3.8, rev(net('pagamentos>estoque')), 'failed: stock 0', 'bad', 0.4)) {}
          if (t > 4.2) { o.on.pagamentos = 'bad'; o.rows.pagamentos = roomRows('pagamentos', 'refund', '94.90 returned', 'bad'); T(o, 'pagamentos', 'compensate: refund 94.90', 'bad', 26); }
          const LOG = ['carrinho    checkout 1047', 'pedidos     PedidoCriado 1047', 'pagamentos  approved 94.90', 'estoque     reservation failed: 0', 'pagamentos  refund 94.90'];
          o.cmd = LOG.slice(0, t > 4.2 ? 5 : t > 2.4 ? 4 : t > 1.1 ? 3 : 2);
          if (t > 5.4) T(o, SUMM, '5 services · 5 logs\n1 trace_id=7f3a…', 'acc', 20); } },
    ],
    escala: [
      { id: 'copias', dur: 5.5, title: 'Black Friday: 10× on the storefront, 10 whole buildings',
        story: 'Black Friday: the storefront gets 10 times the traffic. In a monolith the only way to grow is to copy the whole program. To keep up with Catalog, 10 copies of the store come up, each with 8 vCPUs: 80 vCPUs.',
        look: 'Ten identical buildings appear, one by one, and the vCPU counter climbs by 8 up to 80.',
        key: 'The monolith scales whole: copying one part means copying everything.',
        f(o, t) { const m = blank(); Object.assign(o, m); o.cmdLab = 'the monolith bill';
          let n = 0; for (let i = 0; i < 10; i++) if (t > 0.3 + i * 0.3) { o.pos['c' + i] = cPos(i); o.rows['c' + i] = [[`copy ${i + 1} · 8 vCPUs`, 8.2, 'hi'], chipsOf(['catalogo'])]; n = i + 1; }
          o.cpu = { lab: 'vCPUs ON BLACK FRIDAY', txt: `${8 * n}`, cells: Array.from({ length: 80 }, (_, i) => i < 8 * n ? 'hi' : 0), sub: `${n} copies × 8 vCPUs`, subTone: 'dim' };
          o.up = { n, of: 10, unit: 'copies' }; o.mid = { lab: 'PROGRAM COPIES', txt: `${n} × loja` }; o.cmd = [`${n} copies × 8 vCPUs = ${8 * n} vCPUs`, 'traffic: 10× on the storefront only'];
          if (t > 3.6) T(o, 'c2', '10 × 8 = 80 vCPUs', 'acc', 30); } },
      { id: 'junto', dur: 5, title: 'Payments and Reports copied without need',
        story: 'Look inside each copy: only Catalog needed the 10×. Payments, Reports and the other four modules come along in every building, taking up CPU and memory with no extra work to do.',
        look: 'In each building, CAT lights up; PAY and RPT turn red: copied 10 times without need.',
        key: 'Copying the monolith also copies what did not need to grow.',
        f(o, t) { const m = blank(); Object.assign(o, m); o.cmdLab = 'what got copied';
          for (let i = 0; i < 10; i++) { o.pos['c' + i] = cPos(i); o.rows['c' + i] = [[`copy ${i + 1} · 8 vCPUs`, 8.2, 'hi'], t > 0.8 ? chipsOf(['catalogo'], ['pagamentos', 'relatorios']) : chipsOf(['catalogo'])]; if (t > 0.8) o.on['c' + i] = 2; }
          o.cpu = { lab: 'vCPUs ON BLACK FRIDAY', txt: '80', cells: Array(80).fill('hi'), sub: '10 copies × 8 vCPUs', subTone: 'dim' }; o.up = { n: 10, of: 10, unit: 'copies' }; o.mid = { lab: 'COPIED WITHOUT NEED', txt: '6 of 7', tone: 'bad' };
          o.cmd = ['Catalog: 10× (needed)', 'Payments: 10× (not needed)', 'Reports: 10× (not needed)', '+ Cart, Orders, Stock, Shipping'];
          if (t > 1.6) { T(o, 'c7', 'RPT and PAY: 10 copies for nothing', 'bad', 30); } } },
      { id: 'servicos', dur: 6, title: 'As services: only the catalog gets 10 replicas',
        story: 'With services, each one scales at its own pace. catalogo goes up to 10 replicas of 1 vCPU; carrinho and pedidos stay at 3; pagamentos and estoque at 2; entregas at 1; relatorios with one replica of 4 vCPUs. Total: 25 vCPUs, against 80.',
        look: 'The buildings disappear, the services come back and each one shows its replicas; catalog has 10. The counter drops to 25.',
        key: 'Independent scaling: only what receives the traffic grows.',
        f(o, t) { o.cmdLab = 'the services bill'; o.pos.fila = undefined; delete o.pos.fila;
          SVC.forEach(n => { const r = BF[n], v = n === 'relatorios' ? 4 : r; o.rows[n] = [[n === 'relatorios' ? '1 replica × 4 vCPUs' : `${r} × 1 vCPU`, 8.2, n === 'catalogo' ? 'acc' : 'hi'], { sq: v, tone: n === 'catalogo' ? 'acc' : 'hi' }]; });
          if (t > 0.6) o.on.catalogo = 1; o.mid = { lab: 'CATALOG REPLICAS', txt: '10' };
          o.cpu = { lab: 'vCPUs ON BLACK FRIDAY', txt: '25 / 80', cells: Array.from({ length: 80 }, (_, i) => i < 25 ? 'acc' : 'bad'), sub: 'services: 25 · monolith: 80', subTone: 'dim' };
          o.cmd = SVC.map(n => `${n.padEnd(11)}${n === 'relatorios' ? '1 × 4' : String(BF[n]).padStart(2) + ' × 1'} = ${n === 'relatorios' ? 4 : BF[n]}`).concat('total = 25 vCPUs');
          if (t > 2.0) T(o, 'catalogo', '10 replicas', 'acc', 26); if (t > 3.0) T(o, SUMM, '25 vCPUs (against 80)', 'acc', 20); } },
      { id: 'pico', dur: 6, title: 'What if it goes wrong: the peak doubles (20×)',
        story: 'What if the storefront gets 20 times the traffic? In the monolith that is 10 more buildings: 20 × 8 = 160 vCPUs. With services, only the catalog doubles to 20 replicas, and the total goes from 25 to 35 vCPUs. Each step costs 8 vCPUs in the monolith and 1 in services.',
        look: 'Catalog goes to 20 replicas; on the screen, 35 vCPUs lit inside the 160 the monolith would ask for.',
        key: 'The more the peak concentrates on one part, the bigger the gap between the two bills.',
        f(o, t) { o.cmdLab = 'the bill at 20×'; delete o.pos.fila; const k = t > 0.8 ? 20 : 10;
          SVC.forEach(n => { const v = n === 'catalogo' ? k : n === 'relatorios' ? 4 : BF[n]; o.rows[n] = [[n === 'relatorios' ? '1 replica × 4 vCPUs' : `${v} × 1 vCPU`, 8.2, n === 'catalogo' ? 'acc' : 'hi'], { sq: v, tone: n === 'catalogo' ? 'acc' : 'hi' }]; });
          o.on.catalogo = 1; const tot = 15 + k; o.mid = { lab: 'CATALOG REPLICAS', txt: String(k) };
          o.cpu = { lab: 'vCPUs WITH 20× ON THE STOREFRONT', txt: `${tot} / ${k * 8}`, cells: Array.from({ length: k * 8 }, (_, i) => i < tot ? 'acc' : 'bad'), sub: `services: ${tot} · monolith: ${k * 8}`, subTone: 'bad' };
          o.cmd = [`monolith: ${k} × 8 = ${k * 8} vCPUs`, `services: ${k} + 15 = ${tot} vCPUs`, 'each step: +8 (monolith) · +1 (services)'];
          if (t > 1.6) T(o, 'catalogo', `${k} replicas`, 'acc', 26); if (t > 2.4) T(o, SUMM, 'monolith: 160 · services: 35', 'bad', 20); } },
    ],
    conway: [
      { id: 'camadas', dur: 5, title: 'Before: teams by layer',
        story: 'When the store was born, the teams were split by layer: frontend, backend and DBA. The system came out the same, in three stacked layers: screens, rules and database. That is Conway\'s Law: the design of the system copies the communication structure of the people who build it.',
        look: 'Three stacked bands, FRONTEND on top, BACKEND in the middle and DBA at the bottom, each with the name of its team.',
        key: 'Conway\'s Law: the system mimics the organization that designs it.',
        f(o, t) { const m = blank(); Object.assign(o, m); layers(o); o.cmdLab = 'Conway, 1968'; o.mid = { lab: 'LAYERS = TEAMS', txt: '3 = 3' };
          o.cmd = ['"organizations that design systems', ' are constrained to produce designs', ' which are copies of the communication', ' structures of these organizations"', '— M. Conway, Datamation, 1968'];
          ['lf', 'lb', 'ld'].forEach((n, i) => { if (t > 0.5 + i * 0.6 && t < 1.6 + i * 0.6) o.on[n] = 1; });
          if (t > 2.6) { T(o, [700, 290, PL + 70], 'frontend team', 'acc', 0); T(o, [700, 340, PL + 34], 'backend team', 'acc', 0); T(o, [720, 380, PL + 4], 'DBA team', 'acc', 0); } } },
      { id: 'mudanca', dur: 7, title: 'One fix crosses the 3 teams',
        story: 'Remember the freight bug? The fix touches the cart screen, the freight rule and the remessas table. That is three teams, three task queues and a meeting to align. In the end, one deploy, 40 min long, with all three waiting together.',
        look: 'The task goes down from FRONTEND to BACKEND and to DBA; each band lights up when the task reaches it.',
        key: 'Teams by layer: every business change crosses every team.',
        f(o, t) { const m = blank(); Object.assign(o, m); layers(o); o.cmdLab = 'the freight fix'; o.mid = { lab: 'TEAMS ON THE FIX', txt: String(Math.max(1, Math.min(3, Math.floor((t - 0.5) / 1.5) + 1))), tone: t > 3.5 ? 'bad' : '' };
          const S = [['lf', 'cart screen: show the freight'], ['lb', 'rule: calcularFrete()'], ['ld', 'remessas table']];
          let n = 0; S.forEach(([l], i) => { if (t > 0.5 + i * 1.5) { o.on[l] = t < 2.0 + i * 1.5 ? 1 : 2; n = i + 1; } });
          o.cmd = S.slice(0, n).map(([l, s], i) => `${i + 1}. ${['frontend', 'backend', 'DBA'][i]} team: ${s}`).concat(t > 5 ? ['single deploy: 40 min'] : []);
          const TZ = { lf: [380, 348, PL + 66], lb: [380, 358, PL + 44], ld: [380, 368, PL + 22] };
          if (n) T(o, TZ[S[n - 1][0]], `task with the ${['frontend', 'backend', 'DBA'][n - 1]} team`, 'acc', 12);
          if (t > 5) T(o, [700, 340, PL + 34], '3 teams · 1 deploy · 40 min', 'bad', 0); } },
      { id: 'times', dur: 5.5, title: 'After: 3 teams by domain',
        story: 'The store reorganizes its people by domain. Storefront looks after Catalog and search; Checkout, after Cart, Orders and Payments; Logistics, after Stock and Shipping. The services group into three islands, one per team.',
        look: 'The bands disappear; the services come back and gather into three islands, with the team name in front of each one.',
        key: 'Each team owns a whole slice of the business, from the screen to the database.',
        f(o, t) { o.cmdLab = 'teams by domain'; delete o.pos.fila; islands(o, t > 0.6); o.mid = { lab: 'TEAMS', txt: '3 domains' };
          o.cmd = ['Storefront: catalogo (and search)', 'Checkout:   carrinho · pedidos · pagamentos', 'Logistics:  estoque · entregas', '(relatorios stays on its own)'];
          if (t > 1.2 && t < 2.6) ['iv', 'ic', 'il'].forEach(n => o.on[n] = 1); } },
      { id: 'inversa', dur: 6, title: 'Inverse maneuver: the fix stays in one team',
        story: 'The same freight fix now belongs entirely to Logistics: the entregas service and its database. One team, one deploy, without waiting for anyone. Shaping the teams like the architecture you want is the inverse Conway maneuver.',
        look: 'Only the Logistics island lights up; the task goes straight to entregas, and only it gets deployed.',
        key: 'Inverse maneuver: design the teams the way you want the system to look.',
        f(o, t) { o.cmdLab = 'the freight fix'; delete o.pos.fila; islands(o, true); o.on.il = 1; o.mid = { lab: 'TEAMS ON THE FIX', txt: '1' };
          if (t > 0.8) { o.on.entregas = 1; o.rows.entregas = roomRows('entregas', 'calcularFrete()', 'fixed'); }
          if (t > 2.2) o.rows.tk_entregas = tankRows('entregas', 'remessas · adjusted', 'acc');
          o.cmd = ['team: Logistics', 'service: entregas + remessas database', t > 3.4 ? 'deploy: entregas only' : '…', t > 3.4 ? 'other teams: never even knew' : ''].filter(Boolean);
          if (t > 3.4) T(o, 'entregas', '1 team · 1 deploy', 'acc', 26); } },
      { id: 'distribuido', dur: 6.5, title: 'What if it goes wrong: new services, old teams',
        story: 'Now the opposite: the store splits the program into services but keeps the teams by layer. The backend team owns all the services and ships them all together, like before. That is a distributed monolith: the deploy is still tied together and now the network is in the middle too.',
        look: 'The islands disappear; a red outline of the backend team covers all the services, and the deploy goes out for all of them at once.',
        key: 'If the teams do not change, the design goes back to what it was: Conway again.',
        f(o, t) { o.cmdLab = 'backend team deploy'; delete o.pos.fila; o.mid = { lab: 'DEPLOY', txt: 'all together', tone: 'bad' };
          const f = clamp(t / 1.6); o.beams.push({ pts: ringPts(8, 166, 716, 440, PL + 6), on: true, tone: 'bad', cut: f, fat: true });
          if (t > 1.8) SVC.forEach(n => o.on[n] = 2);
          o.cmd = ['owner: backend team (all services)', 'deploy: all together', 'network in between: 5 ms per hop', '= distributed monolith'];
          if (t > 2.0) T(o, [362, 300, PL + 10], 'backend team: owns everything\n1 deploy for all', 'bad', 30); } },
    ],
  };
  function layers(o) {
    o.pos.ld = [20, 178, PL]; o.pos.lb = [34, 188, PL + 22]; o.pos.lf = [48, 198, PL + 44];
    o.rows.lf = [['screens', 8.2, 'dim'], ['storefront · cart · checkout · tracking', 9, 'hi']]; o.rows.lb = []; o.rows.ld = [];
    o.front.lf = { lab: 'FRONTEND', sub: 'frontend team · all the screens' };
    o.front.lb = { lab: 'BACKEND', sub: 'backend team · catalog · cart · orders · payments · stock · shipping · reports' };
    o.front.ld = { lab: 'DBA', sub: 'DBA team · loja database: produtos · pedidos · pagamentos · estoque · remessas' };
    o.up = { n: 3, of: 3, unit: 'layers' }; o.cpu = { lab: 'TEAMS', txt: '3', cells: [], sub: 'one per layer', subTone: 'dim' };
  }
  function islands(o, on) {
    if (!on) return;
    Object.entries(ISL).forEach(([n, p]) => { o.pos[n] = p; o.rows[n] = [{ foot: { iv: 'STOREFRONT TEAM', ic: 'CHECKOUT TEAM', il: 'LOGISTICS TEAM' }[n] }]; });
    o.cpu = { lab: 'TEAMS', txt: '3', cells: [], sub: 'one per domain', subTone: 'dim' };
  }
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', lit = on === 1 || on === 2;
    x.fillStyle = on === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on === 'dead' ? (light ? '#d5d6d6' : '#0b0c0d') : lit ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = on === 'bad' ? BAD() : lit ? accC() : C.line; x.lineWidth = u(lit || on === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(nm, Bk, rows, on, fr) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u, C } = frameBox(cv, on), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
      // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro; em bloco baixo, o texto fica centrado
      const hOf = r => Array.isArray(r) ? Math.max(r[1], 8.2) * 1.25 * 1.45 : 0, tot = rows.reduce((a, r) => a + hOf(r), 0);
      let y = rows.every(Array.isArray) ? Math.max(0, Math.min(6, (H_ - tot) / 2)) : 6; x.textAlign = 'left';
      for (const r of rows) {
        if (r.slot) { x.fillStyle = INK(); fitFont(x, u, 'server CPU · 8 vCPUs', 8.6, 124); x.fillText('server CPU · 8 vCPUs', u(152), u(172));
          x.strokeStyle = C.line; x.lineWidth = u(0.5); x.setLineDash([u(1.6), u(1.2)]); x.strokeRect(u(150), u(110), u(130), u(70)); x.setLineDash([]);
          x.fillStyle = INK(); fitFont(x, u, 'corridor: function calls', 7.4, 260); x.fillText('corridor: function calls', u(300), u(95)); continue; }
        if (r.foot) { x.fillStyle = on === 1 ? accC() : C.inkHi; x.font = `700 ${u(10)}px ${MONO3}`; x.fillText(r.foot, u(6), u(H_ - 8)); continue; }
        if (r.chips) { y += 2; const cw = (W_ - 12) / 7; r.chips.forEach(([lab, tn], i) => { const X = 6 + i * cw;
            x.fillStyle = tn === 'acc' ? accC() : tn === 'bad' ? BAD() : 'rgba(0,0,0,0)'; if (tn !== 'dim') x.fillRect(u(X), u(y), u(cw - 2), u(14));
            x.strokeStyle = tn === 'dim' ? C.line : x.fillStyle; x.lineWidth = u(0.6); x.strokeRect(u(X), u(y), u(cw - 2), u(14));
            x.fillStyle = tn === 'dim' ? INK() : (theme === 'light' ? '#ffffff' : '#141516'); x.textAlign = 'center'; x.font = `700 ${u(7.4)}px ${MONO3}`; x.fillText(lab, u(X + (cw - 2) / 2), u(y + 7.4)); x.textAlign = 'left'; });
          y += 18; continue; }
        if (r.sq != null) { y += 2; const per = 10, s = 9; for (let i = 0; i < r.sq; i++) { const X = 6 + (i % per) * (s + 2), Y = y + (i / per | 0) * (s + 2);
            x.fillStyle = r.tone === 'acc' ? accC() : C.inkHi; x.fillRect(u(X), u(Y), u(s), u(s)); }
          y += Math.ceil(r.sq / per) * (s + 2) + 2; continue; }
        const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.45; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (on === 'dead' || (on === 'bad' && nm === 'entregas' && sc === 'split')) { x.strokeStyle = BAD(); x.lineWidth = u(2); const X0 = W_ - 26, Y0 = 6; x.beginPath(); x.moveTo(u(X0), u(Y0)); x.lineTo(u(X0 + 18), u(Y0 + 18)); x.moveTo(u(X0 + 18), u(Y0)); x.lineTo(u(X0), u(Y0 + 18)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    if (Bk.fr) { const f = fr || { lab: Bk.lab, sub: Bk.sub }, fk = JSON.stringify(f) + on + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(), W_ = cv.c.width / P; x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(6.6, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' || f.tone === 'bad' ? BAD() : on === 1 ? accC() : on === 'dead' ? INK() : C.inkHi; x.font = `700 ${u(big)}px ${MONO3}`; x.fillText(f.lab, u(3), u(mid));
      const lw = x.measureText(f.lab).width / P; x.fillStyle = f.tone === 'bad' ? BAD() : INK(); const room = W_ - lw - 12 - (f.bar != null ? 130 : 0); fitFont(x, u, f.sub, small, room); x.fillText(f.sub, u(8 + lw), u(mid));
      if (f.bar != null) { const bx = W_ - 126, bw = 120; x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(bx), u(mid - 4), u(bw), u(8));
        x.fillStyle = f.tone === 'bad' ? BAD() : accC(); x.fillRect(u(bx + 1), u(mid - 3), u((bw - 2) * f.bar), u(6)); }
      cv.tex.needsUpdate = true; } }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.cpu, o.ms, o.msLab, o.msTone, o.lim, o.up, o.mid, o.cmd, o.cmdLab, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, w = 150) => { x.fillStyle = INK(); fitFont(x, u, t, 7.8, w); x.fillText(t, u(X), u(Y)); };
    // vCPU
    const cp = o.cpu || { lab: 'vCPU', txt: '—', cells: [] };
    lbl(cp.lab, 8, 9); x.font = `700 ${u(22)}px ${MONO3}`; x.fillStyle = cp.tone === 'bad' ? BAD() : acc; x.fillText(cp.txt, u(8), u(29));
    const n = cp.cells.length;
    if (n && n <= 8) cp.cells.forEach((c, i) => { const X = 8 + i * 18; x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(X), u(44), u(14), u(14));
      if (c) { x.fillStyle = c === 'bad' ? BAD() : acc; x.fillRect(u(X + 1), u(45), u(12), u(12)); } });
    else if (n) { const per = 20, s = 5.4, g = 1.3, rows = Math.ceil(n / per), sz = rows > 6 ? s * 6 / rows : s; cp.cells.forEach((c, i) => { const X = 8 + (i % per) * (sz + g), Y = 42 + (i / per | 0) * (sz + g);
      if (c) { x.fillStyle = c === 'bad' ? BAD() : c === 'hi' ? C.inkHi : acc; x.fillRect(u(X), u(Y), u(sz), u(sz)); } else { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(sz), u(sz)); } }); }
    if (cp.sub) { x.fillStyle = toneC(cp.subTone); fitFont(x, u, cp.sub, 8, 146); x.fillText(cp.sub, u(8), u(n > 8 ? 100 : 72)); }
    // ms e no ar
    const B0 = 168;
    const md = o.mid || { lab: o.msLab, txt: fmtMs(o.ms), tone: o.msTone }; lbl(md.lab, B0, 9, 150); x.fillStyle = md.tone === 'bad' ? BAD() : acc; fitFont(x, u, md.txt, 22, 148); x.fillText(md.txt, u(B0), u(29));
    if (o.lim) { const bw = 148, mx = o.lim * 1.25, f = clamp((o.ms || 0) / mx), lx = B0 + bw * o.lim / mx; x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(B0), u(42), u(bw), u(7));
      x.fillStyle = (o.ms || 0) > o.lim * 0.95 ? BAD() : acc; x.fillRect(u(B0 + 0.8), u(42.8), u((bw - 1.6) * f), u(5.4));
      x.strokeStyle = BAD(); x.lineWidth = u(1); x.beginPath(); x.moveTo(u(lx), u(39)); x.lineTo(u(lx), u(52)); x.stroke(); x.fillStyle = BAD(); x.textAlign = 'right'; x.font = `700 ${u(7.6)}px ${MONO3}`; x.fillText('limit 2 s', u(lx + 2), u(58)); x.textAlign = 'left'; }
    if (o.up) { lbl('UP', B0, 72); x.font = `700 ${u(18)}px ${MONO3}`; x.fillStyle = o.up.n < o.up.of ? BAD() : C.inkHi; const ut = `${o.up.n} / ${o.up.of}`; x.fillText(ut, u(B0), u(90));
      const w = x.measureText(ut).width / P; x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText(o.up.unit, u(B0 + w + 6), u(91)); }
    // dado real
    const L0 = 334; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(158), u(6)); x.lineTo(u(158), u(106)); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(106)); x.stroke();
    lbl('REAL DATA · ' + o.cmdLab.toUpperCase(), L0, 9, 180);
    const cl = o.cmd.slice(0, 8), fs0 = cl.length > 5 ? 7.6 : 8.6, st = fs0 + 3.2; x.fillStyle = C.inkHi;
    cl.forEach((l, i) => { x.fillStyle = /fail|error|refus|timeout|ROLLBACK|refund|0: |no response|Killed/.test(l) ? BAD() : i === cl.length - 1 && cl.length > 1 ? acc : C.inkHi; fitFont(x, u, l, fs0, 182); x.fillText(l, u(L0), u(24 + i * st)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">0.01 ms per local call and 5 ms per network hop are the module\'s example numbers, in the real order of magnitude.</li>';
  const DATA = {
    mono: () => `<table class="h3-sum"><tr><th>step</th><th>how</th><th>cost</th></tr><tr><td>carrinho → pedidos</td><td>function</td><td>0.01 ms</td></tr><tr><td>pedidos → pagamentos</td><td>function</td><td>0.01 ms</td></tr><tr><td>pagamentos → estoque</td><td>function</td><td>0.01 ms</td></tr><tr><td>estoque → entregas</td><td>function</td><td>0.01 ms</td></tr><tr class="on"><td>whole checkout</td><td>1 transaction</td><td>180 ms</td></tr></table>
      <li>Lena\'s order <b>1047</b>: produto 42 × 1 = <b>79.90</b> + shipping <b>15.00</b> = <b>94.90</b></li><li>Plush cat stock: <b>3 → 2</b> on COMMIT; with stock 0, the <b>ROLLBACK</b> undoes order and payment</li><li>One process (<b>loja</b>), 8 vCPUs, 7 modules, one database (<b>loja</b>), one deploy</li>${EX}`,
    ruido: () => `<table class="h3-sum"><tr><th>time</th><th>free vCPUs</th><th>plush cat page</th><th>checkout</th></tr><tr><td>22:59</td><td>7 of 8</td><td>120 ms</td><td>180 ms</td></tr><tr class="on"><td>23:00</td><td>0 (Reports: 7)</td><td>2.4 s</td><td>&gt; 2 s · timeout</td></tr></table>
      <li>Cash closing: <b>7 of the 8 vCPUs</b> for <b>15 min</b></li><li>Checkout limit: <b>2 s</b>; order <b>1047</b> fails and nobody touched the checkout</li>`,
    queda: () => `<li>7 modules, <b>1 process</b>, 1 memory</li><li>Bug in the freight calculation (Shipping) → memory runs out → the process crashes → <b>0 of 7</b> up</li><li>Fix: 1 function; deploy: the whole store, <b>40 min</b>, 3 teams in the queue</li>`,
    split: () => `<table class="h3-sum"><tr><th>service</th><th>database</th></tr>${SVC.map(n => `<tr><td>${n}</td><td>${TANK[n][0]} · ${TANK[n][1]}</td></tr>`).join('')}</table>
      <li>Checkout over the network: <b>180 + 4 × 5 = 200 ms</b></li><li>Reports at 23:00 with 4 own vCPUs: the plush cat page stays at <b>120 ms</b></li><li>Shipping down: <b>PedidoPago e-502</b> waits in the queue and is delivered when it comes back</li><li>Paid 94.90 and stock was 0: <b>refund</b> (compensation) · logs tied together by <b>trace_id=7f3a…</b></li>${EX}`,
    escala: () => `<table class="h3-sum"><tr><th>service</th><th>replicas × vCPUs</th><th>vCPUs</th></tr>${SVC.map(n => `<tr><td>${n}</td><td>${n === 'relatorios' ? '1 × 4' : BF[n] + ' × 1'}</td><td>${n === 'relatorios' ? 4 : BF[n]}</td></tr>`).join('')}<tr class="on"><td>total</td><td></td><td>25</td></tr></table>
      <li>Monolith with 10× on the storefront: <b>10 × 8 = 80 vCPUs</b></li><li>With 20×: monolith <b>160</b>, services <b>35</b> (only the catalog doubles)</li>`,
    conway: () => `<table class="h3-sum"><tr><th>team</th><th>looks after</th></tr><tr><td>Storefront</td><td>catalogo, search</td></tr><tr><td>Checkout</td><td>carrinho, pedidos, pagamentos</td></tr><tr><td>Logistics</td><td>estoque, entregas</td></tr></table>
      <li>Before: teams <b>frontend, backend and DBA</b> → the store in 3 layers, every change goes through all 3</li><li>Melvin Conway, "How Do Committees Invent?", <b>Datamation, April 1968</b></li><li>Inverse maneuver: shape the teams like the architecture you want</li>`,
  };
  function countHtml() { const o = SP || spec(), parts = [];
    if (o.cpu && o.cpu.cells.length) parts.push(`vCPU ${o.cpu.txt}`); if (o.up) parts.push(`${o.up.n}/${o.up.of} ${o.up.unit} up`);
    const md = o.mid || { lab: o.msLab, txt: fmtMs(o.ms) }; return `<b>${md.txt}</b><span>${md.lab.toLowerCase()}</span><i>· ${parts.join(' · ')}</i>`; }
  const cmdHtml = o => `<b>Real data · ${o.cmdLab}</b>` + o.cmd.join('\n').replace(/</g, '&lt;');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="m3count">${countHtml()}</div>
      <div class="i3-sql">${cmdHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one line</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'monolito') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.mid ? o.mid.txt : fmtMs(o.ms)}${o.up ? ` · ${o.up.n}/${o.up.of} up` : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'monolito' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-monolito3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'monolito') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function tagPos(o, a, dz) { if (Array.isArray(a)) return [a[0], a[1], a[2] + dz]; const p = o.pos[a], Bk = B[a]; if (!p) return null; return [p[0] + Bk.w / 2, p[1] + Bk.d / 2, p[2] + Bk.h + dz]; }
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm];
      Bk.g.visible = !!p; if (!p) { Bk.pos = null; return; }
      const want = p.slice();
      if (!Bk.pos) { Bk.pos = [p[0], p[1], p[2] - Bk.h - 12]; Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }     // quem aparece sobe do chão
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      drawBlock(nm, Bk, o.rows[nm] || [], o.on[nm] || 0, o.front[nm]); });
    const slabUp = B.slab.g.visible && B.slab.pos;
    CUBES.forEach((Cb, k) => { const st = o.cubes && slabUp ? o.cubes[k] : null;
      if (st == null) { Cb.g.visible = false; Cb.glow.material.uniforms.intensity.value = 0; return; }
      const p = cubeP(k), zt = B.slab.pos[2] + SLH + (st ? 5 : 0); Cb.z += (zt - Cb.z) * 0.2; Cb.g.visible = true; Cb.g.position.copy(W(p[0], p[1], Cb.z));
      if (st === 'bad') Cb.mat.emissive.set(theme === 'light' ? 0xc0392b : 0xff5a4a); else Cb.mat.emissive.copy(accent);
      Cb.mat.emissiveIntensity = st ? 0.9 : 0; moveGlow(Cb.glow, [p[0] + 9, p[1] + 9, Cb.z + 16], st === 'acc' ? 0.7 : 0); });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i], p = g && tagPos(o, g[0], g[3]); if (p) t.set(g[1], g[2]).at(...p); else t.hide(); });
    if (o.lena) LENA.set('Lena · Recife', 'dim').at(-60, o.lena === 'mono' ? 292 : 262, 6); else LENA.hide();
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], p[2] + 26); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('m3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.querySelector('#info .i3-sql'), sh = cmdHtml(SP); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-80, 770, 8, 470];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.92 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.8 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.48 : nar ? 0.49 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), P = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(P, k);
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr].filter(Boolean)), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(360, 230, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(95, 230, 60), dist: 14 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
