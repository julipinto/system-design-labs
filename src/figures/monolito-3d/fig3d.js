// Figura 3D (iso-glow): monolito × microsserviços. A loja inteira num programa só: o prédio (processo loja, 8 vCPU) com
// 7 salas em cima (os módulos), os 8 cubos de vCPU no meio e o tanque do banco loja ao lado. Depois o prédio se parte em
// serviços, cada um com o seu tanque. Ao fundo, o mostrador: vCPU em uso, ms do checkout, quantos estão no ar e o dado real.
// Cenários (toggle e ?mode=mono|ruido|queda|split|escala|conway; ?step=N abre no passo N).
// Dados: docs/escrita/microsservicos-brief.md (pedido 1047 da Lena: 79.90 + 15.00 = 94.90, estoque 3 → 2, checkout 180 ms,
// 5 ms por salto de rede, 23:00 com 7 de 8 vCPU, 120 ms → 2,4 s, limite 2 s, 80 × 25 vCPU, deploy de 40 min, trace_id=7f3a…).
FIGS3D.push({ id: 'monolito', name: 'Monolito', mod: (() => {
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
  const fmtMs = v => v == null ? '—' : v >= 1000 ? (v / 1000).toFixed(1).replace('.', ',') + ' s' : v < 1 ? v.toFixed(2).replace('.', ',') + ' ms' : Math.round(v) + ' ms';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SVC = ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas', 'relatorios'];
  const NM = { catalogo: 'CATÁLOGO', carrinho: 'CARRINHO', pedidos: 'PEDIDOS', pagamentos: 'PAGAMENTOS', estoque: 'ESTOQUE', entregas: 'ENTREGAS', relatorios: 'RELATÓRIOS' };
  const SHORT = { catalogo: 'CAT', carrinho: 'CAR', pedidos: 'PED', pagamentos: 'PAG', estoque: 'EST', entregas: 'ENT', relatorios: 'REL' };
  const DESC = { catalogo: ['produto 42', 'gato de pelúcia'], carrinho: ['itens da Lena', '1 gato · 79.90'], pedidos: ['pedido 1047', 'total 94.90'],
    pagamentos: ['cobra o cartão', 'valor 94.90'], estoque: ['GATO-042', 'quantidade: 3'], entregas: ['frete e remessa', 'Recife · 15.00'], relatorios: ['fechamento', 'de caixa · 23:00'] };
  const TANK = { catalogo: ['documentos', 'produtos'], carrinho: ['Redis', 'carrinho da Lena'], pedidos: ['PostgreSQL', 'pedidos · itens_pedido'],
    pagamentos: ['PostgreSQL', 'pagamentos'], estoque: ['PostgreSQL', 'estoque · GATO-042: 3'], entregas: ['banco próprio', 'remessas'], relatorios: ['banco próprio', 'fechamento'] };
  const BF = { catalogo: 10, carrinho: 3, pedidos: 3, pagamentos: 2, estoque: 2, entregas: 1, relatorios: 1 };   // réplicas na Black Friday (relatorios: 1 × 4 vCPU)
  const SC = ['mono', 'ruido', 'queda', 'split', 'escala', 'conway'];
  const SCNAME = { mono: 'Monolito', ruido: 'Vizinho', queda: 'Queda', split: 'Partir', escala: 'Escala', conway: 'Conway' };
  const SCFULL = { mono: 'O monolito por dentro', ruido: 'Vizinho barulhento', queda: 'Raio de explosão', split: 'Partir em serviços', escala: 'Black Friday', conway: 'Lei de Conway' };
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
  SVC.forEach(n => { B[n] = block(RW, RD, RH, NM[n], 'módulo'); B['tk_' + n] = block(RW, TD, 14, 'BANCO', ''); });
  B.slab = block(576, 188, SLH, 'PROCESSO loja', '1 binário · 8 vCPU · 1 banco', 8);
  B.db = block(130, 152, 34, 'BANCO loja', 'PostgreSQL');
  B.fila = block(RW, RD, 16, 'FILA', 'eventos');
  for (let i = 0; i < 10; i++) B['c' + i] = block(136, 70, 24, 'LOJA', `cópia ${i + 1}`);
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
  const dbRows = (est = 3, tone) => [['tabelas', 7, 'dim'], ['produtos · pedidos', 8.2], ['itens_pedido', 8.2], ['pagamentos', 8.2], ['remessas', 8.2], [`estoque GATO-042: ${est}`, 8.6, tone || 'acc']];
  const SLAB = [{ slot: true }];
  const chipsOf = (hi = [], bad = []) => ({ chips: SVC.map(n => [SHORT[n], hi.includes(n) ? 'acc' : bad.includes(n) ? 'bad' : 'dim']) });

  // ── o que se vê em cada passo (spec) ──
  function blank() {
    return { pos: {}, on: {}, rows: {}, front: {}, beams: [], tags: [], msgs: [], cubes: null, cpu: null, ms: null, msLab: 'MS DO CHECKOUT', msTone: '', lim: 0,
      up: null, mid: null, cmdLab: '', cmd: [], lena: null };
  }
  const CUB1 = ['acc', 0, 0, 0, 0, 0, 0, 0];
  const cpuOf = (cells, sub = '', subTone = 'dim', lab = 'vCPU EM USO') => { const n = cells.filter(Boolean).length; return { lab, txt: `${n} / ${cells.length}`, cells, sub, subTone }; };
  function mono(o, { sub = 'módulo' } = {}) {
    o.pos.slab = [20, 178, PL]; o.pos.db = [630, 214, PL]; o.rows.slab = SLAB; o.rows.db = dbRows();
    SVC.forEach(n => { o.pos[n] = mPos(n); o.rows[n] = roomRows(n); o.front[n] = { lab: NM[n], sub }; });
    o.cubes = CUB1.slice(); o.cpu = cpuOf(o.cubes, 'checkout e vitrine', 'dim'); o.up = { n: 7, of: 7, unit: 'módulos' };
    CHAIN.forEach(([a, b]) => o.beams.push({ pts: R.hop(a, b) })); o.beams.push({ pts: R.toDb('pedidos') }); o.lena = 'mono';
    return o;
  }
  function svc(o, { tanks = true, fila = true } = {}) {
    SVC.forEach(n => { o.pos[n] = sPos(n); o.rows[n] = roomRows(n); o.front[n] = { lab: NM[n], sub: 'serviço' };
      if (tanks) { o.pos['tk_' + n] = tPos(n); o.rows['tk_' + n] = tankRows(n); } });
    if (fila) { o.pos.fila = [SX[1], SY[1], PL]; o.rows.fila = [['fila de eventos', 8.2, 'dim'], ['vazia', 8.6, 'dim']]; }
    o.up = { n: 7, of: 7, unit: 'serviços' }; o.cpu = { lab: 'PROCESSOS', txt: '7', cells: [], sub: 'um por serviço (antes: 1)', subTone: 'dim' };
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
      { id: 'loja', dur: 4.5, title: 'Um programa só: a loja inteira num processo',
        story: 'No fim do módulo 5 a loja ficou rápida: o gato de pelúcia está no Redis a 79.90. Só que a loja inteira ainda é um programa só, o processo loja, num servidor de 8 vCPU e com um banco só, o loja. Dentro dele moram 7 módulos: Catálogo, Carrinho, Pedidos, Pagamentos, Estoque, Entregas e Relatórios.',
        look: 'Um prédio (o processo loja) com 7 salas em cima, os 8 cubos de vCPU no canto livre e o tanque do banco loja à direita.',
        key: 'Monolito: todos os módulos no mesmo processo, no mesmo deploy e no mesmo banco.',
        f(o, t) { o.cmdLab = 'o processo'; o.cmd = ['processo: loja', 'servidor: 8 vCPU', 'módulos: 7 (um binário só)', 'banco: loja (PostgreSQL)', 'deploy: 1 para tudo'];
          SVC.forEach((n, i) => { if (t > 0.4 + i * 0.3 && t < 0.4 + i * 0.3 + 0.9) o.on[n] = 1; });
          if (t > 2.8) { T(o, 'slab', '1 processo · 7 módulos', 'acc', 66); T(o, 'db', '1 banco: loja', 'hi', 24); } } },
      { id: 'chamadas', dur: 7.5, title: 'O checkout do 1047 atravessa as salas',
        story: 'A Lena, em Recife, compra outro gato de pelúcia para o irmão: pedido 1047, 79.90 mais 15.00 de frete. O checkout passa por Carrinho, Pedidos, Pagamentos, Estoque e Entregas. Cada passagem é uma chamada de função dentro do mesmo processo e leva uns 0,01 ms.',
        look: 'A luz sai do Carrinho e anda pelo corredor entre as salas até Entregas; cada passagem leva o nome da função chamada.',
        key: 'No monolito, um módulo fala com o outro por chamada de função: não há rede no meio.',
        f(o, t) { o.cmdLab = 'chamadas no mesmo processo'; o.msLab = 'MS EM CHAMADAS LOCAIS'; o.ms = 0;
          send(o, t, 0.2, 1.1, R.lenaM('carrinho'), 'POST /checkout (Lena)', 'hi', 0.3); if (t > 1.1) o.on.carrinho = 1;
          let n = 0; CHAIN.forEach(([a, b], i) => { const s = 1.4 + i * 1.3; if (send(o, t, s, s + 0.9, R.hop(a, b), CALLS[i], 'acc', 0.3)) { n = i + 1; o.on[b] = 1; } if (t > s) o.on[a] = 2; });
          o.ms = n * 0.01; o.cmd = ['carrinho.fechar(1047)', ...CALLS.slice(0, n).map(c => '→ ' + c)];
          if (t > 6.6) T(o, [cxM('pagamentos') - 70, YC, ZM], '4 chamadas × 0,01 ms\n= 0,04 ms', 'acc', 44); } },
      { id: 'commit', dur: 6.5, title: 'Uma transação só: BEGIN … COMMIT, 180 ms',
        story: 'Tudo isso roda dentro de uma transação só no banco loja. O pedido entra em pedidos, o pagamento em pagamentos e o estoque do gato desce de 3 para 2. O COMMIT grava tudo junto, e o checkout inteiro leva 180 ms.',
        look: 'As escritas descem do prédio para o tanque do banco loja; o estoque troca de 3 para 2 e o contador para em 180 ms.',
        key: 'Um banco, uma transação: grava tudo ou nada (o ACID do módulo 3).',
        f(o, t) { o.cmdLab = 'SQL no banco loja'; ['carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'].forEach(n => o.on[n] = 2);
          const L = ['BEGIN;', "INSERT INTO pedidos … (1047, 'Lena', 94.90);", 'INSERT INTO pagamentos … (1047, 94.90);', "UPDATE estoque SET quantidade = 2 WHERE sku = 'GATO-042';", 'COMMIT;'];
          let n = 1; [0.9, 2.0, 3.1, 4.3].forEach((s, i) => { if (t > s) n = i + 2; }); o.cmd = L.slice(0, n);
          send(o, t, 0.9, 1.7, R.toDb('pedidos'), 'INSERT pedido 1047', 'acc', 0.2); send(o, t, 2.0, 2.8, R.toDb('pagamentos'), 'INSERT pagamento 94.90', 'acc', 0.2);
          send(o, t, 3.1, 3.9, R.toDb('estoque'), 'UPDATE estoque 3 → 2', 'acc', 0.2);
          o.ms = Math.round(180 * clamp(t / 4.6)); o.on.db = t > 0.9 && t < 4.8 ? 1 : 0;
          if (t > 3.9) { o.rows.db = dbRows(2); o.rows.estoque = roomRows('estoque', 'GATO-042', 'quantidade: 2'); }
          if (t > 4.6) { o.cmd = L.concat('-- checkout: 180 ms'); T(o, 'db', 'COMMIT\nestoque 3 → 2', 'acc', 22); T(o, 'slab', 'checkout inteiro: 180 ms', 'acc', 66); } } },
      { id: 'rollback', dur: 7, title: 'E se der errado: o estoque acabou e o ROLLBACK desfaz',
        story: 'Volte ao checkout com um detalhe: alguém levou os últimos gatos e o estoque já está em 0. O pedido e o pagamento de 94.90 já entraram, mas tudo ainda está na mesma transação. Estoque recusa, vem o ROLLBACK, e o pedido e o pagamento somem juntos. Ninguém escreveu código para desfazer.',
        look: 'Estoque fica vermelho com 0; a luz volta ao banco e as linhas do pedido 1047 e do pagamento desaparecem.',
        key: 'No monolito a consistência vem de graça: um ROLLBACK desfaz tudo de uma vez.',
        f(o, t) { o.cmdLab = 'SQL no banco loja'; o.rows.db = dbRows(0, 'bad'); o.rows.estoque = roomRows('estoque', 'GATO-042', 'quantidade: 0', 'bad');
          const L = ['BEGIN;', 'INSERT INTO pedidos … (1047, …);', 'INSERT INTO pagamentos … (94.90);', 'estoque.baixar("GATO-042") → 0: recusado', 'ROLLBACK;', '-- 1047 e o pagamento: desfeitos'];
          let n = 1; [0.5, 1.6, 2.7, 4.0, 5.2].forEach((s, i) => { if (t > s) n = i + 2; }); o.cmd = L.slice(0, n);
          send(o, t, 0.5, 1.3, R.toDb('pedidos'), 'INSERT pedido 1047', 'acc', 0.2); send(o, t, 1.6, 2.4, R.toDb('pagamentos'), 'INSERT pagamento', 'acc', 0.2);
          if (t > 0.5) o.on.pedidos = 2; if (t > 1.6) o.on.pagamentos = 2;
          if (t > 2.7) { o.on.estoque = 'bad'; T(o, 'estoque', 'estoque: 0 · recusado', 'bad', 26); }
          send(o, t, 4.0, 4.8, R.toDb('estoque'), 'ROLLBACK', 'bad', 0.6);
          if (t > 4.8) { o.on.pedidos = 0; o.on.pagamentos = 0; o.rows.pedidos = roomRows('pedidos', 'pedido 1047', 'desfeito', 'dead'); o.rows.pagamentos = roomRows('pagamentos', 'pagamento', 'desfeito', 'dead');
            T(o, 'db', 'ROLLBACK\nnada ficou gravado', 'acc', 22); } } },
    ],
    ruido: [
      { id: 'normal', dur: 4.5, title: '22:59: a página do gato em 120 ms',
        story: 'São 22:59. A loja usa 1 dos 8 vCPU e a página do gato de pelúcia abre em 120 ms. A Lena está com o gato no carrinho, pronta para fechar o pedido 1047.',
        look: 'Um cubo de vCPU aceso; a luz vai da Lena ao Catálogo e volta com a página em 120 ms.',
        key: 'Todos os módulos dividem os mesmos 8 vCPU.',
        f(o, t) { o.cmdLab = 'requisição · 22:59'; o.msLab = 'MS DA PÁGINA DO GATO'; o.cmd = ['GET /produto/42'];
          send(o, t, 0.3, 1.2, R.lenaM('catalogo'), 'GET /produto/42', 'hi', 0.1);
          if (t > 1.2) o.on.catalogo = 1; if (send(o, t, 1.6, 2.5, rev(R.lenaM('catalogo')), '200 · 120 ms', 'acc', 0.6)) { o.cmd = ['GET /produto/42', '→ 200 · 120 ms']; }
          o.ms = t > 2.5 ? 120 : t > 0.3 ? Math.round(120 * clamp((t - 0.3) / 2.2)) : 0;
          if (t > 3.0) T(o, 'catalogo', 'página do gato: 120 ms', 'acc', 26); } },
      { id: 'relatorio', dur: 5.5, title: '23:00: Relatórios come 7 de 8 vCPU',
        story: 'Às 23:00 o módulo Relatórios roda o fechamento de caixa e soma todos os pedidos do dia. Ele pega 7 dos 8 vCPU e fica com eles por 15 min. Sobra 1 vCPU para vitrine, carrinho e checkout juntos.',
        look: 'Relatórios acende em vermelho e os cubos de vCPU ficam vermelhos um a um, até 7.',
        key: 'No mesmo processo, o módulo mais guloso pega a CPU de todos.',
        f(o, t) { o.cmdLab = 'Relatórios · 23:00'; o.msLab = 'MS DA PÁGINA DO GATO'; o.ms = 120; o.on.relatorios = 'bad';
          o.rows.relatorios = roomRows('relatorios', 'fechamento', 'rodando · 15 min', 'bad');
          let k = 0; for (let i = 1; i < 8; i++) if (t > 0.5 + i * 0.35) { o.cubes[i] = 'bad'; k = i; }
          o.cpu = cpuOf(o.cubes, k ? `Relatórios: ${k} · resto: 1` : 'checkout e vitrine', k ? 'bad' : 'dim'); o.cpu.tone = k === 7 ? 'bad' : '';
          o.cmd = ['fechamento de caixa', 'SELECT sum(total) FROM pedidos', '  WHERE criado_em >= current_date;', `vCPU de Relatórios: ${k} de 8 · 15 min`];
          if (t > 3.2) T(o, 'relatorios', '7 de 8 vCPU\npor 15 min', 'bad', 26); } },
      { id: 'lento', dur: 6, title: 'A página do gato: de 120 ms para 2,4 s',
        story: 'A Lena recarrega a página do gato. O Catálogo não mudou uma linha, mas agora disputa 1 vCPU com todo mundo. A mesma página que levava 120 ms leva 2,4 s.',
        look: 'A luz anda devagar entre a Lena e o Catálogo e o contador sobe até 2,4 s.',
        key: 'Vizinho barulhento: um módulo deixa os outros lentos sem tocar no código deles.',
        f(o, t) { o.cmdLab = 'requisição · 23:01'; o.msLab = 'MS DA PÁGINA DO GATO'; o.on.relatorios = 'bad'; o.rows.relatorios = roomRows('relatorios', 'fechamento', 'rodando · 15 min', 'bad');
          for (let i = 1; i < 8; i++) o.cubes[i] = 'bad'; o.cpu = cpuOf(o.cubes, 'Relatórios: 7 · resto: 1', 'bad'); o.cpu.tone = 'bad';
          send(o, t, 0.2, 1.0, R.lenaM('catalogo'), 'GET /produto/42', 'hi', 0.1); if (t > 1.0) o.on.catalogo = 'bad';
          const f = clamp((t - 0.2) / 4.2); o.ms = Math.round(2400 * f); o.msTone = 'bad';
          o.cmd = ['GET /produto/42', t > 4.4 ? '→ 200 · 2,4 s (antes: 120 ms)' : '… esperando CPU'];
          if (t > 4.4) { send(o, t, 4.4, 5.0, rev(R.lenaM('catalogo')), '200 · 2,4 s', 'bad', 1); T(o, 'catalogo', '120 ms → 2,4 s\no código é o mesmo', 'bad', 26); } } },
      { id: 'timeout', dur: 7, title: 'E se der errado: o checkout da Lena passa de 2 s',
        story: 'A Lena clica em comprar. O checkout, que levava 180 ms, espera CPU a cada passo e cruza o limite de 2 s. O pedido 1047 falha por timeout. Ninguém mexeu no checkout: o problema mora na sala ao lado.',
        look: 'A luz do checkout trava no meio do caminho e fica vermelha quando o contador passa a linha de 2 s.',
        key: 'No monolito, o excesso de um módulo vira a falha do vizinho.',
        f(o, t) { o.cmdLab = 'checkout · 23:02'; o.lim = 2000; o.on.relatorios = 'bad'; o.rows.relatorios = roomRows('relatorios', 'fechamento', 'rodando · 15 min', 'bad');
          for (let i = 1; i < 8; i++) o.cubes[i] = 'bad'; o.cpu = cpuOf(o.cubes, 'Relatórios: 7 · resto: 1', 'bad'); o.cpu.tone = 'bad';
          send(o, t, 0.2, 1.0, R.lenaM('carrinho'), 'POST /checkout (1047)', 'hi', 0.1); if (t > 1.0) o.on.carrinho = 2;
          const f = clamp((t - 1.0) / 4.0), late = t > 5.0; o.ms = Math.round(2000 * f); o.msTone = f > 0.9 ? 'bad' : '';
          const hops = late ? 1.5 : f * 1.5; CHAIN.forEach(([a, b], i) => { if (hops > i) { const g = clamp(hops - i); o.beams.push({ pts: R.hop(a, b), on: true, tone: late ? 'bad' : '', dot: g < 1 && !late ? g : null, cut: g }); o.on[a] = 2; } });
          o.cmd = ['POST /checkout  (pedido 1047)', late ? '→ erro: timeout depois de 2 s' : '… pagamentos esperando CPU'];
          if (late) { o.on.pagamentos = 'bad'; T(o, 'pagamentos', 'timeout: 2 s\npedido 1047 falhou', 'bad', 26); T(o, 'relatorios', 'o problema mora aqui', 'bad', 26); } } },
    ],
    queda: [
      { id: 'frete', dur: 5, title: 'Entregas calcula o frete do 1047',
        story: 'Tudo no ar. No checkout do pedido 1047, o módulo Entregas calcula o frete até Recife: 15.00. É uma função como outra qualquer, dentro do mesmo processo loja, usando a mesma memória dos outros seis módulos.',
        look: 'A luz chega a Entregas, que devolve frete 15.00; a barra de memória na frente do prédio está tranquila.',
        key: 'Num monolito, todos os módulos dividem um processo e uma memória.',
        f(o, t) { o.cmdLab = 'chamada'; o.front.slab = { lab: 'PROCESSO loja', sub: 'memória do processo', bar: 0.3 };
          o.cmd = ['entregas.calcularFrete(1047,', '  { cidade: "Recife", cep: "50050-000" })'];
          send(o, t, 0.3, 1.2, R.hop('estoque', 'entregas'), 'calcularFrete(1047)', 'acc', 0.3); if (t > 1.2) o.on.entregas = 1;
          if (t > 1.8) { o.cmd = o.cmd.concat('→ 15.00'); o.rows.entregas = roomRows('entregas', 'frete: 15.00', 'Recife'); T(o, 'entregas', 'frete: 15.00', 'acc', 26); } } },
      { id: 'memoria', dur: 6, title: 'Um bug no frete: a memória enche',
        story: 'Uma versão nova do cálculo de frete tem um bug: Entregas passa a guardar dados sem soltar nunca. A memória do processo loja vai enchendo. Como o processo é um só, a memória que acaba é a de todos os módulos.',
        look: 'Entregas fica vermelho e a barra de memória, na frente do prédio, enche até o fim.',
        key: 'Um processo, uma memória: o vazamento de um módulo é de todos.',
        f(o, t) { o.cmdLab = 'log do processo loja'; const f = clamp(0.3 + t / 5); o.front.slab = { lab: 'PROCESSO loja', sub: 'memória do processo', bar: f, tone: f > 0.8 ? 'bad' : '' };
          o.on.entregas = 'bad'; o.rows.entregas = roomRows('entregas', 'calcularFrete()', 'guarda e não solta', 'bad');
          o.cmd = ['entregas.calcularFrete() ainda rodando', `memória do processo: ${f > 0.95 ? 'cheia' : 'subindo'}`];
          if (t > 1.0) T(o, 'entregas', 'bug no frete\na memória só cresce', 'bad', 26); if (f > 0.95) T(o, 'slab', 'memória do processo: cheia', 'bad', 66); } },
      { id: 'caiu', dur: 6, title: 'O processo cai: a loja inteira sai do ar',
        story: 'A memória acaba e o sistema operacional mata o processo loja. Com Entregas caem a vitrine, o carrinho e os pagamentos: a loja inteira sai do ar. A Lena abre a página do gato e não recebe nada.',
        look: 'As 7 salas apagam juntas, os cubos de vCPU desligam e o contador vai a 0 de 7 no ar.',
        key: 'Quando o processo cai, caem todos os módulos dentro dele.',
        f(o, t) { o.cmdLab = 'log do sistema'; const down = t > 0.8; o.front.slab = { lab: 'PROCESSO loja', sub: down ? 'fora do ar' : 'memória do processo', bar: down ? 0 : 1, tone: 'bad' };
          o.cmd = ['Out of memory: Killed process (loja)']; o.on.entregas = 'bad';
          if (down) { SVC.forEach(n => { o.on[n] = 'dead'; o.rows[n] = roomRows(n, DESC[n][0], 'fora do ar', 'dead'); }); o.cubes = [0, 0, 0, 0, 0, 0, 0, 0]; o.cpu = cpuOf(o.cubes, 'processo morto', 'bad'); o.up = { n: 0, of: 7, unit: 'módulos' }; o.beams = []; }
          if (send(o, t, 2.4, 3.3, R.lenaM('catalogo').slice(0, 3), 'GET /produto/42', 'hi', 0.1)) { o.cmd = o.cmd.concat('GET /produto/42 → sem resposta'); }
          if (t > 3.3) { o.beams.push({ pts: R.lenaM('catalogo').slice(0, 3), on: true, tone: 'bad', cut: 0.6 }); T(o, 'catalogo', 'a vitrine também caiu', 'bad', 26); }
          if (t > 4.2) T(o, 'slab', '0 de 7 módulos no ar', 'bad', 66); } },
      { id: 'raio', dur: 6.5, title: 'E se der errado até o fim: um módulo derrubou os sete',
        story: 'O conserto é de Entregas, numa função só. Mas o programa é um só: para subir a correção sai um binário novo da loja inteira, e o deploy leva 40 min, com os 3 times na mesma fila. Enquanto isso, nenhum dos 7 módulos vende nada.',
        look: 'Um contorno vermelho cobre o prédio todo: esse é o raio da explosão. Só Entregas tinha o bug.',
        key: 'Raio de explosão: no monolito, o que um módulo quebra é a loja inteira.',
        f(o, t) { o.cmdLab = 'deploy da correção'; o.front.slab = { lab: 'PROCESSO loja', sub: 'fora do ar', bar: 0, tone: 'bad' }; o.beams = [];
          SVC.forEach(n => { o.on[n] = n === 'entregas' ? 'bad' : 'dead'; o.rows[n] = roomRows(n, n === 'entregas' ? 'o bug estava aqui' : DESC[n][0], 'fora do ar', n === 'entregas' ? 'bad' : 'dead'); });
          o.cubes = [0, 0, 0, 0, 0, 0, 0, 0]; o.cpu = cpuOf(o.cubes, 'processo morto', 'bad'); o.up = { n: 0, of: 7, unit: 'módulos' };
          const f = clamp(t / 1.6); o.beams.push({ pts: ringPts(12, 170, 604, 374, SLZ + 1), on: true, tone: 'bad', cut: f, fat: true });
          o.cmd = ['correção: 1 função em entregas', 'build: loja inteira (7 módulos)', 'deploy: 40 min', 'fila: 3 times esperando'];
          if (t > 1.8) T(o, 'slab', 'raio de explosão: 7 de 7', 'bad', 66); if (t > 3) T(o, 'entregas', '1 bug · 40 min de deploy', 'bad', 26); } },
    ],
    split: [
      { id: 'partir', dur: 5.5, title: 'O prédio se separa: 6 serviços e Relatórios',
        story: 'A saída é partir o programa. Cada módulo vira um serviço com processo próprio: catalogo, carrinho, pedidos, pagamentos, estoque e entregas, mais relatorios à parte. E cada um com o seu banco: o catálogo em documentos, o carrinho no Redis, pedidos, pagamentos e estoque em PostgreSQL.',
        look: 'As salas descem do prédio, se afastam, e cada uma ganha o seu tanque de banco na frente.',
        key: 'Microsserviço: um processo por serviço, com deploy e banco próprios.',
        f(o, t) { o.cmdLab = 'serviços e bancos';
          if (t < 1.0) { const m = mono(blank()); Object.assign(o, m, { cmdLab: o.cmdLab }); }
          o.cmd = SVC.slice(0, 6).map(n => `${n.padEnd(11)}→ ${TANK[n][0]}`);
          if (t > 3.2) { T(o, 'tk_pedidos', 'banco por serviço', 'acc', 20); } } },
      { id: 'rede', dur: 7.5, title: 'O mesmo checkout, agora pela rede: 200 ms',
        story: 'O checkout do 1047 faz o mesmo caminho, só que cada passagem atravessa a rede e custa uns 5 ms. São 4 saltos entre 5 serviços: 180 + 4 × 5 = 200 ms. A rede entrou na conta.',
        look: 'A luz pula de serviço em serviço pelas vigas grossas; cada salto marca +5 ms e o contador fecha em 200 ms.',
        key: 'Entre serviços, cada chamada é uma ida e volta pela rede.',
        f(o, t) { o.cmdLab = 'chamadas pela rede'; o.ms = 180;
          send(o, t, 0.2, 1.1, net('lena>carrinho'), 'POST /checkout (Lena)', 'hi', 0.3); if (t > 1.1) o.on.carrinho = 1;
          let n = 0; CHAIN.forEach(([a, b], i) => { const s = 1.4 + i * 1.3; if (send(o, t, s, s + 0.9, net(a + '>' + b), '+5 ms', 'acc', 0.3, true)) { n = i + 1; o.on[b] = 1; } if (t > s) o.on[a] = 2; });
          o.ms = 180 + 5 * n; o.cmd = HTTP.slice(0, n).concat(n === 4 ? ['180 + 4 × 5 = 200 ms'] : []);
          if (t > 6.6) T(o, 'pagamentos', '4 saltos × 5 ms\n180 → 200 ms', 'acc', 26); } },
      { id: 'vizinho', dur: 5.5, title: '23:00: Relatórios roda no seu canto',
        story: 'Às 23:00 o fechamento de caixa roda de novo, agora no serviço relatorios, com os seus 4 vCPU. Ele pode usar todos sem tirar nada de ninguém. A página do gato continua em 120 ms.',
        look: 'Relatórios acende sozinho, cheio; a luz vai da Lena ao catálogo e volta em 120 ms.',
        key: 'Cada serviço com os seus recursos: o vizinho barulhento fica isolado.',
        f(o, t) { o.cmdLab = 'requisição · 23:01'; o.msLab = 'MS DA PÁGINA DO GATO'; o.on.relatorios = 1;
          o.rows.relatorios = roomRows('relatorios', 'fechamento', '4 de 4 vCPU (seus)');
          o.cpu = { lab: 'vCPU DE RELATÓRIOS', txt: '4 / 4', cells: ['acc', 'acc', 'acc', 'acc'], sub: 'só dele: o resto não perde nada', subTone: 'dim' };
          send(o, t, 0.6, 1.4, net('lena>catalogo'), 'GET /produto/42', 'hi', 0.1); if (t > 1.4) o.on.catalogo = 1;
          send(o, t, 1.8, 2.6, rev(net('lena>catalogo')), '200 · 120 ms', 'acc', 0.6); o.ms = t > 2.6 ? 120 : Math.round(120 * clamp((t - 0.6) / 2));
          o.cmd = ['GET /produto/42', t > 2.6 ? '→ 200 · 120 ms (mesmo às 23:00)' : '…'];
          if (t > 3.0) { T(o, 'catalogo', 'página do gato: 120 ms', 'acc', 26); T(o, 'relatorios', 'fechamento · 4 vCPU próprios', 'acc', 26); } } },
      { id: 'fila', dur: 8, title: 'Entregas cai: a loja continua vendendo',
        story: 'O bug do frete volta e derruba o serviço entregas. Só ele cai. O pedido 1047 é pago e o evento PedidoPago fica esperando na fila. Quando entregas volta, lê o evento e agenda a remessa. A Lena nem percebeu.',
        look: 'Entregas apaga com um X; o PedidoPago para na fila e só anda até entregas quando ele volta.',
        key: 'Com serviços separados, a queda de um não derruba os outros.',
        f(o, t) { o.cmdLab = 'evento na fila'; o.ms = 200; const back = t > 5.0;
          if (!back) { o.on.entregas = 'dead'; o.rows.entregas = roomRows('entregas', 'fora do ar', 'bug no frete', 'dead'); o.up = { n: 6, of: 7, unit: 'serviços' }; }
          send(o, t, 0.5, 1.5, net('pedidos>fila'), 'PedidoPago e-502', 'acc', 0.2); if (t > 0.5) o.on.pedidos = 2;
          if (t > 1.5 && t < 5.6) { o.on.fila = 1; o.rows.fila = [['esperando: 1', 8.2, 'acc'], ['PedidoPago e-502', 8.6, 'hi']]; }
          o.cmd = ['PedidoPago {', '  evento_id: "e-502",', '  pedido_id: 1047,', '  valor: 94.90', '}'];
          if (t > 1.6 && !back) { T(o, 'fila', 'PedidoPago espera', 'acc', 24); T(o, 'catalogo', 'a vitrine segue no ar', 'acc', 26); }
          if (back) { o.rows.entregas = roomRows('entregas', 'voltou', 'lê o e-502'); o.on.entregas = 1; }
          if (send(o, t, 5.6, 6.4, net('fila>entregas'), 'PedidoPago e-502', 'acc', 0.3)) { o.rows.entregas = roomRows('entregas', 'remessa do 1047', 'agendada'); T(o, 'entregas', 'entregue depois · nada se perdeu', 'acc', 26); } } },
      { id: 'compensa', dur: 8, title: 'E se der errado: pagou, mas o estoque acabou',
        story: 'Agora o pagamento de 94.90 é aprovado, mas a reserva falha: o estoque do gato já está em 0. Não existe mais um ROLLBACK que desfaça tudo, porque cada serviço tem o seu banco. Alguém precisa compensar e estornar o pagamento. E para entender o que houve, o pedido passou por 5 serviços e 5 logs, ligados pelo trace_id=7f3a….',
        look: 'Estoque fica vermelho com 0, a luz volta para pagamentos com o estorno, e cada serviço mostra a sua linha de log com o mesmo trace_id.',
        key: 'O preço dos microsserviços: sem uma transação só, desfazer vira compensar.',
        f(o, t) { o.cmdLab = 'logs · trace_id=7f3a…'; o.ms = 200; o.rows['tk_estoque'] = tankRows('estoque', 'estoque · GATO-042: 0', 'bad');
          if (t > 0.3) o.on.carrinho = 2; if (t > 0.3) o.on.pedidos = 2;
          send(o, t, 0.3, 1.1, net('pedidos>pagamentos'), 'cobrar 94.90', 'acc', 0.2);
          if (t > 1.1) { o.on.pagamentos = 1; o.rows.pagamentos = roomRows('pagamentos', 'aprovado', '94.90'); }
          send(o, t, 1.6, 2.4, net('pagamentos>estoque'), 'reservar GATO-042', 'acc', 0.2);
          if (t > 2.4) { o.on.estoque = 'bad'; o.rows.estoque = roomRows('estoque', 'GATO-042: 0', 'reserva falhou', 'bad'); }
          if (send(o, t, 3.0, 3.8, rev(net('pagamentos>estoque')), 'falhou: estoque 0', 'bad', 0.4)) {}
          if (t > 4.2) { o.on.pagamentos = 'bad'; o.rows.pagamentos = roomRows('pagamentos', 'estorno', '94.90 devolvido', 'bad'); T(o, 'pagamentos', 'compensar: estorno 94.90', 'bad', 26); }
          const LOG = ['carrinho    checkout 1047', 'pedidos     PedidoCriado 1047', 'pagamentos  aprovado 94.90', 'estoque     reserva falhou: 0', 'pagamentos  estorno 94.90'];
          o.cmd = LOG.slice(0, t > 4.2 ? 5 : t > 2.4 ? 4 : t > 1.1 ? 3 : 2);
          if (t > 5.4) T(o, SUMM, '5 serviços · 5 logs\n1 trace_id=7f3a…', 'acc', 20); } },
    ],
    escala: [
      { id: 'copias', dur: 5.5, title: 'Black Friday: 10× na vitrine, 10 prédios inteiros',
        story: 'Black Friday: a vitrine recebe 10 vezes o tráfego. No monolito a única forma de crescer é copiar o programa inteiro. Para dar conta do Catálogo sobem 10 cópias da loja, cada uma com 8 vCPU: 80 vCPU.',
        look: 'Dez prédios iguais aparecem, um a um, e o contador de vCPU sobe de 8 em 8 até 80.',
        key: 'O monolito escala inteiro: copiar uma parte é copiar tudo.',
        f(o, t) { const m = blank(); Object.assign(o, m); o.cmdLab = 'a conta do monolito';
          let n = 0; for (let i = 0; i < 10; i++) if (t > 0.3 + i * 0.3) { o.pos['c' + i] = cPos(i); o.rows['c' + i] = [[`cópia ${i + 1} · 8 vCPU`, 8.2, 'hi'], chipsOf(['catalogo'])]; n = i + 1; }
          o.cpu = { lab: 'vCPU NA BLACK FRIDAY', txt: `${8 * n}`, cells: Array.from({ length: 80 }, (_, i) => i < 8 * n ? 'hi' : 0), sub: `${n} cópias × 8 vCPU`, subTone: 'dim' };
          o.up = { n, of: 10, unit: 'cópias' }; o.mid = { lab: 'CÓPIAS DO PROGRAMA', txt: `${n} × loja` }; o.cmd = [`${n} cópias × 8 vCPU = ${8 * n} vCPU`, 'tráfego: 10× só na vitrine'];
          if (t > 3.6) T(o, 'c2', '10 × 8 = 80 vCPU', 'acc', 30); } },
      { id: 'junto', dur: 5, title: 'Pagamentos e Relatórios copiados sem precisar',
        story: 'Olhe dentro de cada cópia: só o Catálogo precisava dos 10×. Pagamentos, Relatórios e os outros quatro módulos vão junto em cada prédio, ocupando CPU e memória sem ter trabalho a mais.',
        look: 'Em cada prédio, CAT acende; PAG e REL ficam vermelhos: copiados 10 vezes sem precisar.',
        key: 'Copiar o monolito copia também o que não precisava crescer.',
        f(o, t) { const m = blank(); Object.assign(o, m); o.cmdLab = 'o que foi copiado';
          for (let i = 0; i < 10; i++) { o.pos['c' + i] = cPos(i); o.rows['c' + i] = [[`cópia ${i + 1} · 8 vCPU`, 8.2, 'hi'], t > 0.8 ? chipsOf(['catalogo'], ['pagamentos', 'relatorios']) : chipsOf(['catalogo'])]; if (t > 0.8) o.on['c' + i] = 2; }
          o.cpu = { lab: 'vCPU NA BLACK FRIDAY', txt: '80', cells: Array(80).fill('hi'), sub: '10 cópias × 8 vCPU', subTone: 'dim' }; o.up = { n: 10, of: 10, unit: 'cópias' }; o.mid = { lab: 'COPIADOS SEM PRECISAR', txt: '6 de 7', tone: 'bad' };
          o.cmd = ['Catálogo: 10× (precisava)', 'Pagamentos: 10× (sem precisar)', 'Relatórios: 10× (sem precisar)', '+ Carrinho, Pedidos, Estoque, Entregas'];
          if (t > 1.6) { T(o, 'c7', 'REL e PAG: 10 cópias à toa', 'bad', 30); } } },
      { id: 'servicos', dur: 6, title: 'Em serviços: só o catálogo ganha 10 réplicas',
        story: 'Com serviços, cada um escala no seu ritmo. catalogo sobe para 10 réplicas de 1 vCPU; carrinho e pedidos ficam com 3; pagamentos e estoque com 2; entregas com 1; relatorios com uma réplica de 4 vCPU. Total: 25 vCPU, contra 80.',
        look: 'Os prédios somem, os serviços voltam e cada um mostra as suas réplicas; o catálogo tem 10. O contador cai para 25.',
        key: 'Escala independente: só cresce o que recebe o tráfego.',
        f(o, t) { o.cmdLab = 'a conta dos serviços'; o.pos.fila = undefined; delete o.pos.fila;
          SVC.forEach(n => { const r = BF[n], v = n === 'relatorios' ? 4 : r; o.rows[n] = [[n === 'relatorios' ? '1 réplica × 4 vCPU' : `${r} × 1 vCPU`, 8.2, n === 'catalogo' ? 'acc' : 'hi'], { sq: v, tone: n === 'catalogo' ? 'acc' : 'hi' }]; });
          if (t > 0.6) o.on.catalogo = 1; o.mid = { lab: 'RÉPLICAS DO CATÁLOGO', txt: '10' };
          o.cpu = { lab: 'vCPU NA BLACK FRIDAY', txt: '25 / 80', cells: Array.from({ length: 80 }, (_, i) => i < 25 ? 'acc' : 'bad'), sub: 'serviços: 25 · monolito: 80', subTone: 'dim' };
          o.cmd = SVC.map(n => `${n.padEnd(11)}${n === 'relatorios' ? '1 × 4' : String(BF[n]).padStart(2) + ' × 1'} = ${n === 'relatorios' ? 4 : BF[n]}`).concat('total = 25 vCPU');
          if (t > 2.0) T(o, 'catalogo', '10 réplicas', 'acc', 26); if (t > 3.0) T(o, SUMM, '25 vCPU (contra 80)', 'acc', 20); } },
      { id: 'pico', dur: 6, title: 'E se der errado: o pico dobra (20×)',
        story: 'E se a vitrine receber 20 vezes o tráfego? No monolito são mais 10 prédios: 20 × 8 = 160 vCPU. Em serviços, só o catálogo dobra para 20 réplicas, e o total vai de 25 para 35 vCPU. Cada degrau custa 8 vCPU no monolito e 1 nos serviços.',
        look: 'O catálogo passa a 20 réplicas; no mostrador, 35 vCPU acesos dentro dos 160 que o monolito pediria.',
        key: 'Quanto mais o pico se concentra numa parte, maior a distância entre as duas contas.',
        f(o, t) { o.cmdLab = 'a conta com 20×'; delete o.pos.fila; const k = t > 0.8 ? 20 : 10;
          SVC.forEach(n => { const v = n === 'catalogo' ? k : n === 'relatorios' ? 4 : BF[n]; o.rows[n] = [[n === 'relatorios' ? '1 réplica × 4 vCPU' : `${v} × 1 vCPU`, 8.2, n === 'catalogo' ? 'acc' : 'hi'], { sq: v, tone: n === 'catalogo' ? 'acc' : 'hi' }]; });
          o.on.catalogo = 1; const tot = 15 + k; o.mid = { lab: 'RÉPLICAS DO CATÁLOGO', txt: String(k) };
          o.cpu = { lab: 'vCPU COM 20× NA VITRINE', txt: `${tot} / ${k * 8}`, cells: Array.from({ length: k * 8 }, (_, i) => i < tot ? 'acc' : 'bad'), sub: `serviços: ${tot} · monolito: ${k * 8}`, subTone: 'bad' };
          o.cmd = [`monolito: ${k} × 8 = ${k * 8} vCPU`, `serviços: ${k} + 15 = ${tot} vCPU`, 'cada degrau: +8 (monolito) · +1 (serviços)'];
          if (t > 1.6) T(o, 'catalogo', `${k} réplicas`, 'acc', 26); if (t > 2.4) T(o, SUMM, 'monolito: 160 · serviços: 35', 'bad', 20); } },
    ],
    conway: [
      { id: 'camadas', dur: 5, title: 'Antes: times por camada',
        story: 'Quando a loja nasceu, os times eram por camada: frontend, backend e DBA. O sistema saiu igual, em três camadas empilhadas: telas, regras e banco. É a Lei de Conway: o desenho do sistema copia o desenho da comunicação de quem o constrói.',
        look: 'Três faixas empilhadas, FRONTEND em cima, BACKEND no meio e DBA embaixo, cada uma com o nome do seu time.',
        key: 'Lei de Conway: o sistema imita a organização que o desenha.',
        f(o, t) { const m = blank(); Object.assign(o, m); layers(o); o.cmdLab = 'Conway, 1968'; o.mid = { lab: 'CAMADAS = TIMES', txt: '3 = 3' };
          o.cmd = ['"organizações que projetam sistemas', ' ficam presas a produzir desenhos', ' que copiam as suas estruturas', ' de comunicação"', '— M. Conway, Datamation, 1968'];
          ['lf', 'lb', 'ld'].forEach((n, i) => { if (t > 0.5 + i * 0.6 && t < 1.6 + i * 0.6) o.on[n] = 1; });
          if (t > 2.6) { T(o, [700, 290, PL + 70], 'time frontend', 'acc', 0); T(o, [700, 340, PL + 34], 'time backend', 'acc', 0); T(o, [720, 380, PL + 4], 'time DBA', 'acc', 0); } } },
      { id: 'mudanca', dur: 7, title: 'Uma correção atravessa os 3 times',
        story: 'Lembra do bug no frete? A correção mexe na tela do carrinho, na regra de frete e na tabela remessas. São três times, três filas de tarefas e uma reunião para combinar. No fim, um deploy só, de 40 min, com os três esperando juntos.',
        look: 'A tarefa desce de FRONTEND para BACKEND e para DBA; cada faixa acende quando a tarefa chega nela.',
        key: 'Time por camada: toda mudança de negócio atravessa todos os times.',
        f(o, t) { const m = blank(); Object.assign(o, m); layers(o); o.cmdLab = 'a correção do frete'; o.mid = { lab: 'TIMES NA CORREÇÃO', txt: String(Math.max(1, Math.min(3, Math.floor((t - 0.5) / 1.5) + 1))), tone: t > 3.5 ? 'bad' : '' };
          const S = [['lf', 'tela do carrinho: mostrar o frete'], ['lb', 'regra: calcularFrete()'], ['ld', 'tabela remessas']];
          let n = 0; S.forEach(([l], i) => { if (t > 0.5 + i * 1.5) { o.on[l] = t < 2.0 + i * 1.5 ? 1 : 2; n = i + 1; } });
          o.cmd = S.slice(0, n).map(([l, s], i) => `${i + 1}. time ${['frontend', 'backend', 'DBA'][i]}: ${s}`).concat(t > 5 ? ['deploy único: 40 min'] : []);
          const TZ = { lf: [380, 348, PL + 66], lb: [380, 358, PL + 44], ld: [380, 368, PL + 22] };
          if (n) T(o, TZ[S[n - 1][0]], `tarefa no time ${['frontend', 'backend', 'DBA'][n - 1]}`, 'acc', 12);
          if (t > 5) T(o, [700, 340, PL + 34], '3 times · 1 deploy · 40 min', 'bad', 0); } },
      { id: 'times', dur: 5.5, title: 'Depois: 3 times por domínio',
        story: 'A loja reorganiza as pessoas por domínio. Vitrine cuida do Catálogo e da busca; Checkout, de Carrinho, Pedidos e Pagamentos; Logística, de Estoque e Entregas. Os serviços se agrupam em três ilhas, uma por time.',
        look: 'As faixas somem; os serviços voltam e se juntam em três ilhas, com o nome do time na frente de cada uma.',
        key: 'Cada time é dono de um pedaço inteiro do negócio, da tela ao banco.',
        f(o, t) { o.cmdLab = 'times por domínio'; delete o.pos.fila; islands(o, t > 0.6); o.mid = { lab: 'TIMES', txt: '3 domínios' };
          o.cmd = ['Vitrine:   catalogo (e a busca)', 'Checkout:  carrinho · pedidos · pagamentos', 'Logística: estoque · entregas', '(relatorios fica à parte)'];
          if (t > 1.2 && t < 2.6) ['iv', 'ic', 'il'].forEach(n => o.on[n] = 1); } },
      { id: 'inversa', dur: 6, title: 'Manobra inversa: a correção fica num time só',
        story: 'A mesma correção do frete agora é toda da Logística: o serviço entregas e o banco dele. Um time, um deploy, sem esperar ninguém. Escolher os times no formato da arquitetura que se quer é a manobra inversa de Conway.',
        look: 'Só a ilha da Logística acende; a tarefa vai direto para entregas, e o deploy sai só dele.',
        key: 'Manobra inversa: desenhe os times como você quer o sistema.',
        f(o, t) { o.cmdLab = 'a correção do frete'; delete o.pos.fila; islands(o, true); o.on.il = 1; o.mid = { lab: 'TIMES NA CORREÇÃO', txt: '1' };
          if (t > 0.8) { o.on.entregas = 1; o.rows.entregas = roomRows('entregas', 'calcularFrete()', 'corrigido'); }
          if (t > 2.2) o.rows.tk_entregas = tankRows('entregas', 'remessas · ajustada', 'acc');
          o.cmd = ['time: Logística', 'serviço: entregas + banco remessas', t > 3.4 ? 'deploy: só entregas' : '…', t > 3.4 ? 'outros times: nem ficaram sabendo' : ''].filter(Boolean);
          if (t > 3.4) T(o, 'entregas', '1 time · 1 deploy', 'acc', 26); } },
      { id: 'distribuido', dur: 6.5, title: 'E se der errado: serviços novos, times velhos',
        story: 'Agora o contrário: a loja parte o programa em serviços, mas mantém os times por camada. O time backend fica dono de todos os serviços e sobe todos juntos, como antes. É um monolito distribuído: o deploy continua amarrado e a rede ainda entrou no meio.',
        look: 'As ilhas somem; um contorno vermelho do time backend cobre todos os serviços, e o deploy sai para todos de uma vez.',
        key: 'Se os times não mudam, o desenho volta a ser o de antes: Conway de novo.',
        f(o, t) { o.cmdLab = 'deploy do time backend'; delete o.pos.fila; o.mid = { lab: 'DEPLOY', txt: 'todos juntos', tone: 'bad' };
          const f = clamp(t / 1.6); o.beams.push({ pts: ringPts(8, 166, 716, 440, PL + 6), on: true, tone: 'bad', cut: f, fat: true });
          if (t > 1.8) SVC.forEach(n => o.on[n] = 2);
          o.cmd = ['dono: time backend (todos os serviços)', 'deploy: todos juntos', 'rede no meio: 5 ms por salto', '= monolito distribuído'];
          if (t > 2.0) T(o, [362, 300, PL + 10], 'time backend: dono de tudo\n1 deploy para todos', 'bad', 30); } },
    ],
  };
  function layers(o) {
    o.pos.ld = [20, 178, PL]; o.pos.lb = [34, 188, PL + 22]; o.pos.lf = [48, 198, PL + 44];
    o.rows.lf = [['telas', 8.2, 'dim'], ['vitrine · carrinho · checkout · rastreio', 9, 'hi']]; o.rows.lb = []; o.rows.ld = [];
    o.front.lf = { lab: 'FRONTEND', sub: 'time frontend · todas as telas' };
    o.front.lb = { lab: 'BACKEND', sub: 'time backend · catálogo · carrinho · pedidos · pagamentos · estoque · entregas · relatórios' };
    o.front.ld = { lab: 'DBA', sub: 'time DBA · banco loja: produtos · pedidos · pagamentos · estoque · remessas' };
    o.up = { n: 3, of: 3, unit: 'camadas' }; o.cpu = { lab: 'TIMES', txt: '3', cells: [], sub: 'um por camada', subTone: 'dim' };
  }
  function islands(o, on) {
    if (!on) return;
    Object.entries(ISL).forEach(([n, p]) => { o.pos[n] = p; o.rows[n] = [{ foot: { iv: 'TIME VITRINE', ic: 'TIME CHECKOUT', il: 'TIME LOGÍSTICA' }[n] }]; });
    o.cpu = { lab: 'TIMES', txt: '3', cells: [], sub: 'um por domínio', subTone: 'dim' };
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
        if (r.slot) { x.fillStyle = INK(); fitFont(x, u, 'CPU do servidor · 8 vCPU', 8.6, 124); x.fillText('CPU do servidor · 8 vCPU', u(152), u(172));
          x.strokeStyle = C.line; x.lineWidth = u(0.5); x.setLineDash([u(1.6), u(1.2)]); x.strokeRect(u(150), u(110), u(130), u(70)); x.setLineDash([]);
          x.fillStyle = INK(); fitFont(x, u, 'corredor: chamadas de função', 7.4, 260); x.fillText('corredor: chamadas de função', u(300), u(95)); continue; }
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
      x.strokeStyle = BAD(); x.lineWidth = u(1); x.beginPath(); x.moveTo(u(lx), u(39)); x.lineTo(u(lx), u(52)); x.stroke(); x.fillStyle = BAD(); x.textAlign = 'right'; x.font = `700 ${u(7.6)}px ${MONO3}`; x.fillText('limite 2 s', u(lx + 2), u(58)); x.textAlign = 'left'; }
    if (o.up) { lbl('NO AR', B0, 72); x.font = `700 ${u(18)}px ${MONO3}`; x.fillStyle = o.up.n < o.up.of ? BAD() : C.inkHi; const ut = `${o.up.n} / ${o.up.of}`; x.fillText(ut, u(B0), u(90));
      const w = x.measureText(ut).width / P; x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText(o.up.unit, u(B0 + w + 6), u(91)); }
    // dado real
    const L0 = 334; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(158), u(6)); x.lineTo(u(158), u(106)); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(106)); x.stroke();
    lbl('DADO REAL · ' + o.cmdLab.toUpperCase(), L0, 9, 180);
    const cl = o.cmd.slice(0, 8), fs0 = cl.length > 5 ? 7.6 : 8.6, st = fs0 + 3.2; x.fillStyle = C.inkHi;
    cl.forEach((l, i) => { x.fillStyle = /falh|erro|recus|timeout|ROLLBACK|estorno|0: |sem resposta|Killed/.test(l) ? BAD() : i === cl.length - 1 && cl.length > 1 ? acc : C.inkHi; fitFont(x, u, l, fs0, 182); x.fillText(l, u(L0), u(24 + i * st)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">0,01 ms por chamada local e 5 ms por salto de rede são números do exemplo do módulo, na ordem de grandeza real.</li>';
  const DATA = {
    mono: () => `<table class="h3-sum"><tr><th>passo</th><th>como</th><th>custo</th></tr><tr><td>carrinho → pedidos</td><td>função</td><td>0,01 ms</td></tr><tr><td>pedidos → pagamentos</td><td>função</td><td>0,01 ms</td></tr><tr><td>pagamentos → estoque</td><td>função</td><td>0,01 ms</td></tr><tr><td>estoque → entregas</td><td>função</td><td>0,01 ms</td></tr><tr class="on"><td>checkout inteiro</td><td>1 transação</td><td>180 ms</td></tr></table>
      <li>Pedido <b>1047</b> da Lena: produto 42 × 1 = <b>79.90</b> + frete <b>15.00</b> = <b>94.90</b></li><li>Estoque do gato: <b>3 → 2</b> no COMMIT; com estoque 0, o <b>ROLLBACK</b> desfaz pedido e pagamento</li><li>Um processo (<b>loja</b>), 8 vCPU, 7 módulos, um banco (<b>loja</b>), um deploy</li>${EX}`,
    ruido: () => `<table class="h3-sum"><tr><th>hora</th><th>vCPU livres</th><th>página do gato</th><th>checkout</th></tr><tr><td>22:59</td><td>7 de 8</td><td>120 ms</td><td>180 ms</td></tr><tr class="on"><td>23:00</td><td>0 (Relatórios: 7)</td><td>2,4 s</td><td>&gt; 2 s · timeout</td></tr></table>
      <li>Fechamento de caixa: <b>7 dos 8 vCPU</b> por <b>15 min</b></li><li>Limite do checkout: <b>2 s</b>; o pedido <b>1047</b> falha sem que ninguém mexa no checkout</li>`,
    queda: () => `<li>7 módulos, <b>1 processo</b>, 1 memória</li><li>Bug no cálculo de frete (Entregas) → a memória acaba → o processo cai → <b>0 de 7</b> no ar</li><li>Correção: 1 função; deploy: a loja inteira, <b>40 min</b>, 3 times na fila</li>`,
    split: () => `<table class="h3-sum"><tr><th>serviço</th><th>banco</th></tr>${SVC.map(n => `<tr><td>${n}</td><td>${TANK[n][0]} · ${TANK[n][1]}</td></tr>`).join('')}</table>
      <li>Checkout pela rede: <b>180 + 4 × 5 = 200 ms</b></li><li>Relatórios às 23:00 com 4 vCPU próprios: a página do gato fica em <b>120 ms</b></li><li>Entregas fora: <b>PedidoPago e-502</b> espera na fila e é entregue quando ele volta</li><li>Pagou 94.90 e o estoque estava em 0: <b>estorno</b> (compensação) · logs ligados por <b>trace_id=7f3a…</b></li>${EX}`,
    escala: () => `<table class="h3-sum"><tr><th>serviço</th><th>réplicas × vCPU</th><th>vCPU</th></tr>${SVC.map(n => `<tr><td>${n}</td><td>${n === 'relatorios' ? '1 × 4' : BF[n] + ' × 1'}</td><td>${n === 'relatorios' ? 4 : BF[n]}</td></tr>`).join('')}<tr class="on"><td>total</td><td></td><td>25</td></tr></table>
      <li>Monolito com 10× na vitrine: <b>10 × 8 = 80 vCPU</b></li><li>Com 20×: monolito <b>160</b>, serviços <b>35</b> (só o catálogo dobra)</li>`,
    conway: () => `<table class="h3-sum"><tr><th>time</th><th>cuida de</th></tr><tr><td>Vitrine</td><td>catalogo, busca</td></tr><tr><td>Checkout</td><td>carrinho, pedidos, pagamentos</td></tr><tr><td>Logística</td><td>estoque, entregas</td></tr></table>
      <li>Antes: times <b>frontend, backend e DBA</b> → a loja em 3 camadas, toda mudança passa pelos 3</li><li>Melvin Conway, "How Do Committees Invent?", <b>Datamation, abril de 1968</b></li><li>Manobra inversa: montar os times no formato da arquitetura desejada</li>`,
  };
  function countHtml() { const o = SP || spec(), parts = [];
    if (o.cpu && o.cpu.cells.length) parts.push(`vCPU ${o.cpu.txt}`); if (o.up) parts.push(`${o.up.n}/${o.up.of} ${o.up.unit} no ar`);
    const md = o.mid || { lab: o.msLab, txt: fmtMs(o.ms) }; return `<b>${md.txt}</b><span>${md.lab.toLowerCase()}</span><i>· ${parts.join(' · ')}</i>`; }
  const cmdHtml = o => `<b>Dado real · ${o.cmdLab}</b>` + o.cmd.join('\n').replace(/</g, '&lt;');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="m3count">${countHtml()}</div>
      <div class="i3-sql">${cmdHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'monolito') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.mid ? o.mid.txt : fmtMs(o.ms)}${o.up ? ` · ${o.up.n}/${o.up.of} no ar` : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(360, 230, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(95, 230, 60), dist: 14 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
