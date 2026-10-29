// Figura 3D (iso-glow): a loja em quatro estandes. Um galpão com as quatro células lado a lado (celula-sp, celula-rio,
// celula-recife e, mais larga, celula-mkt), cada uma um bloco fechado com parede, uma porta só (o gw) e a pilha dentro
// (o banco, o Redis, o tópico e os pods). Na frente, o roteador (edge-loja) com o mapa; atrás, as passivas como sombras.
// Requisições são fichas: a Lena em sódio, os outros em grafite, o veneno do mkt-01 vermelho e grande.
// Cenários (botões e ?mode=pilha|raio|celula|roteador|assincrono|shuffle|replicacao; ?step=N abre no passo N).
// Dados: docs/escrita/cell-based-brief.md e as aulas 1 a 4 (30 pedidos/s; 40 · 33 · 15 · 12%; veneno 2147483648 às 20:25:00.000,
// 3 pods em 150 ms, 7.200 × 2.880; pedido 1060 = 174,80; gato 19 = 6 · 3 · 2 · 8; 41 → 53 vCPU, 9 → 32; anéis 0 · 12 · 27 · 60 · 100%;
// mapa-v42 de 150 MB, 99,89%; rehash 80,1% · ~19,7% · 0; 13 min 20 s; 120 eventos/s, 24.000 × 9.600, 14.400 × 0;
// RPO 2,97 · 1,35 · 2,88 · 9,6; 2PC 24 e 164 ms; 500 · 41,7 · 6,1/s; 99,9 · 99,8 · 99,7%; folga 35 … 66,5%; Rio 15% → 48%;
// shuffle 45 pares, 2,22%, 190 pares, 0,526%, 6 pares, 16,7%).
FIGS3D.push({ id: 'cel', name: 'Cell-Based', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 1) => v.toFixed(d);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['pilha', 'raio', 'celula', 'roteador', 'assincrono', 'shuffle', 'replicacao'];
  const SCNAME = { pilha: 'Stack', raio: 'Radius', celula: 'Cell', roteador: 'Router', assincrono: 'Async', shuffle: 'Shuffle', replicacao: 'Replication' };
  const SCFULL = { pilha: 'Single stack × cells', raio: 'Blast radius', celula: 'Inside the cell', roteador: 'The router',
    assincrono: 'Async cells', shuffle: 'Shuffle sharding', replicacao: 'Replication and headroom' };
  const AULA = { pilha: 'aula-1-introducao-ao-cell-based', raio: 'aula-1-introducao-ao-cell-based', celula: 'aula-2-estrutura-celular',
    roteador: 'aula-3-roteamento-celular', assincrono: 'aula-3-roteamento-celular', shuffle: 'aula-4-replicacao-celular', replicacao: 'aula-4-replicacao-celular' };
  let clk = 0, sc = 'pilha', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cel3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 19, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 }, LAY = { s1: 13, fs: 12, lh: 14, y0: 30 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, sink: h, cfg, key: '', f: 0, pos: [x, y] };
  }
  // a célula: laje, parede nos fundos e nos lados, mureta na frente com uma porta só (o gw), e a pilha dentro
  const WH = 16, DW = 34;
  const pieces = [];
  function piece(g, nm, lab, x, y, z, w, d, h, r, cx, cy, cw, cd) {
    const mat = capMat(); twCaps.push(mat); rbox(x, y, z, w, d, h, r, mat, g);
    const cv = faceCanvas('top', cx, cy, z + h, cw, cd, Math.min(12, 2400 / cw), g); const pc = { mat, cv, lab, key: '' }; pieces.push(pc); return pc;
  }
  function cellBox(nm, x, y, w, d, P = 4) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, 6, 6, mat, g);
    const dx = w - DW - 12;
    rbox(0, 0, 6, w, 3, WH, 0.5, mat, g); rbox(0, 3, 6, 3, d - 6, WH, 0.5, mat, g); rbox(w - 3, 3, 6, 3, d - 6, WH, 0.5, mat, g);
    rbox(0, d - 3, 6, dx - 3, 3, 4, 0.5, mat, g); rbox(dx + DW + 1, d - 3, 6, w - dx - DW - 1, 3, 4, 0.5, mat, g);
    rbox(dx - 3, d - 7, 6, 4, 7, WH + 8, 0.5, mat, g); rbox(dx + DW - 1, d - 7, 6, 4, 7, WH + 8, 0.5, mat, g); rbox(dx - 3, d - 7, 6 + WH + 8, DW + 4, 7, 3, 0.5, mat, g);
    const top = faceCanvas('top', 3.5, 3.5, 6, w - 7, d - 7, P, g);
    const pg_ = new THREE.Group(); g.add(pg_);
    const pc = {
      gw: piece(pg_, nm, 'gw', dx + 3, d - 24, 6, DW - 6, 18, 12, 2, dx + 5, d - 22, DW - 10, 14),
      pg: piece(pg_, nm, 'pg', 12, 14, 6, 34, 34, 24, 16.9, 18, 20, 22, 22),
      redis: piece(pg_, nm, 'redis', 54, 18, 6, 32, 26, 14, 4, 56, 20, 28, 22),
      tube: piece(pg_, nm, 'topic', 96, 22, 6, w - 110, 16, 10, 7.5, 100, 24, w - 118, 12),
    };
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h: 6, sink: WH + 30, cfg: 'cell', key: '', f: 0, pos: [x, y], pc, pg_ };
  }
  const CY = 118, CD = 212;
  const CELLS = [
    { id: 'sp', nm: 'celula-sp', x: 40, w: 190, frac: 33, rate: '9.9', reg: 'SP' },
    { id: 'rio', nm: 'celula-rio', x: 245, w: 170, frac: 15, rate: '4.5', reg: 'Rio' },
    { id: 'rec', nm: 'celula-recife', x: 430, w: 170, frac: 12, rate: '3.6', reg: 'Recife' },
    { id: 'mkt', nm: 'celula-mkt', x: 615, w: 250, frac: 40, rate: '12.0', reg: 'Recife' },
  ];
  const CI = {}; CELLS.forEach(c => { CI[c.id] = c; cellBox(c.id, c.x, CY, c.w, CD); });
  cellBox('uni', 40, CY, 825, CD, 3);
  cellBox('open', 40, 30, 480, 300, 4);
  // fundo: passivas, plano de controle, a 5ª célula, o PSP, o estoque global
  const BK = (nm, x, w, h = 12) => block(nm, x, 18, w, 78, h, BIG, 4);
  BK('pasSP', 40, 400, 10); BK('pasRio', 470, 395, 10); BK('ctrl', 40, 400); BK('c5', 470, 395, 10); BK('psp', 470, 395); BK('gEst', 300, 300, 14);
  // frente: roteador, bordas, tópico compartilhado, consumidor de borda, 2PC, anéis e clientes do shuffle
  const FR = (nm, x, w, h = 14) => block(nm, x, 360, w, 76, h, BIG, 4);
  FR('router', 330, 270, 16); FR('eSP', 40, 250); FR('eRio', 327, 250); FR('eRec', 614, 250);
  FR('shTop', 40, 520, 10); FR('cons', 590, 274); FR('tpc', 300, 330);
  for (let i = 0; i < 5; i++) { FR('r' + i, 40 + i * 166, 154, 10); FR('k' + i, 40 + i * 166, 154, 10); }
  // dentro da célula aberta: as cinco camadas e a estante do gato
  for (let i = 0; i < 5; i++) block('L' + i, 560, 30 + i * 30, 304, 26, 6, LAY, 6);
  block('depo', 560, 190, 304, 140, 6, { ...LAY, front: 1 }, 5);
  const NAMES = Object.keys(B);

  // colunas (raio, folga): caixas de 10 × 10 × 10 escaladas
  const BARS = Array.from({ length: 12 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 10, 10, 10, 0.8, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, glow, h: 0, f: 0 }; });
  // cubos: pods, gatos e as células do shuffle, com o rótulo no topo
  const CUBES = Array.from({ length: 40 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 10, 10, 10, 1, mat, g); const top = faceCanvas('top', 0.6, 0.6, 10, 8.8, 8.8, 14, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, f: 0, key: '', s: 10, x: 0, y: 0 }; });
  // pilhas de eventos presos
  const KW = 40, KD = 30, KH = 7, KMAX = 7;
  const CARDS = Array.from({ length: 14 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // fios e fichas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 64 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 34 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -3, 12, 12, 6, 2.5, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c), grEm = new THREE.Color(0x9aa0a6);
  let nDot = 0;
  function dot(p, tone, sz = 10) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p)); D.g.scale.setScalar(sz / 12);
    D.mat.emissive.copy(tone === 'bad' ? badEm : tone === 'acc' ? accent : grEm); D.mat.emissiveIntensity = tone === 'gr' ? 0.45 : 1.3;
    moveGlow(D.glow, p, tone === 'bad' ? 0.6 : tone === 'acc' ? 0.9 : 0); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on || b.tone === 'bad' ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if ((b.on || b.tone === 'bad') && b.flow) for (let k = 0; k < b.flow; k++) dot(alongPts(b.pts, cum, (clk * (b.sp || 0.4) + k / b.flow) % 1), b.tone === 'bad' ? 'bad' : b.ft || 'gr', 9);
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
  }

  // ── rótulos que olham para a câmera ──
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
      tex.needsUpdate = true; const k = (innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1) * 1.3; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = Array.from({ length: 10 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── peças de cada passo ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const ghost = (o, ...nm) => nm.forEach(n => o.on[n] = 'ghost');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  function base() { return { show: {}, on: {}, rows: {}, pc: {}, nopc: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], bars: [], fleet: [] }; }
  const doorX = c => c.x + c.w - 29;
  const RX = 465;
  const routeP = (c, from = RX) => [[from, 446, Z + 4], [from, 390, PL + 30], [doorX(c), 342, Z + 6], [doorX(c), CY + CD - 14, Z + 6]];
  const podTop = (c, i = 0) => [c.x + 18 + i * 34 + 13, CY + 95, PL + 6 + 30];
  const pgTop = c => [c.x + 29, CY + 31, PL + 6 + 30];
  // uma ficha que anda pelo caminho entre a e b (segundos do passo)
  function trip(o, pts, t, a, b, tone, sz) { if (t < a || t > b + 0.6) return; const cum = cumLen(pts); o.dots.push([alongPts(pts, cum, ease(clamp((t - a) / (b - a)))), tone, sz]); }
  // as quatro células e o roteador; st(c) = estado de cada célula
  function cells(o, { st = () => 1, rows, pods = 2, podSt, router = true, routes = true, flow = true, hide } = {}) {
    CELLS.forEach(c => { if (hide && hide.includes(c.id)) return; show(o, c.id); const s = st(c); if (s) o.on[c.id] = s;
      o.rows[c.id] = act(c.nm, `${c.frac}%`, rows ? rows(c) : [`${c.rate} orders/s · ${c.reg}`, 'dim']);
      for (let i = 0; i < pods; i++) o.fleet.push({ x: c.x + 18 + i * 34, y: CY + 82, s: 26, st: podSt ? podSt(c, i) : s === 'bad' ? 'bad' : s ? 'on' : 'dim', lab: 'ped' });
      o.pc[c.id] = { gw: s === 'bad' ? 'bad' : s ? 1 : 0 };
      if (routes) o.beams.push({ pts: routeP(c).slice(1), on: flow && s === 1 ? 1 : 0, tone: s === 'bad' ? 'bad' : '', flow: flow && s === 1 ? 1 : 0, sp: 0.3 }); });
    if (router) { show(o, 'router'); lit(o, 'router'); o.rows.router = act('edge-loja', 'ROUTER', ['mapa-v42 · 150 MB', 'hi'], ['reads cliente_id from the JWT', 'dim']); }
  }
  // a pilha única: 3 pods de pedidos no meio da laje
  const UNIPOD = i => [380 + i * 40, CY + 82];
  function uni(o, podSt = () => 'on', row) {
    show(o, 'uni'); lit(o, 'uni');
    o.rows.uni = act('store · single stack', 'pedidos@2.6.0', row || ['30 orders/s · all customers', 'hi']);
    o.pc.uni = { gw: 1, pg: 1, redis: 1, tube: 1 };
    [0, 1, 2].forEach(i => { const [x, y] = UNIPOD(i); o.fleet.push({ x, y, s: 30, st: podSt(i), lab: 'ped' }); });
    o.uniLabs = 1;
  }
  const UDOOR = 40 + 825 - 29;
  const uniPath = (ix) => [[UDOOR, 446, Z + 4], [UDOOR, 342, Z + 6], [UDOOR, CY + CD - 14, Z + 6], [UNIPOD(ix)[0] + 15, CY + 97, PL + 6 + 34]];
  // a célula aberta (Recife): grupos de pods por serviço
  const OG = [['catalogo', 24, 3], ['pedidos', 150, 2], ['pagamentos', 256, 2], ['estoque', 362, 2]];
  const ogPod = (g, i) => [40 + OG[g][1] + i * 36, 30 + 92];
  function openCell(o, { st = 1, pods = [3, 2, 2, 2], podSt, row } = {}) {
    show(o, 'open'); o.on.open = st;
    o.rows.open = act('celula-recife@2.6.0', '12%', row || ['3.6 orders/s · Recife', 'hi']);
    o.pc.open = { gw: 1, pg: 1, redis: 1, tube: 1 };
    OG.forEach(([nm, , n], g) => { for (let i = 0; i < pods[g]; i++) { const [x, y] = ogPod(g, i); o.fleet.push({ x, y, s: 30, st: podSt ? podSt(g, i) : 'on', lab: nm.slice(0, 3) }); } });
    o.rows.open.labs = OG.map(([nm, lx, n], g) => [lx + Math.max(pods[g], 1) * 18 - 3, 136, `${nm} ×${pods[g]}`, 'hi', 11]);
  }
  const OPEN_DOOR = 40 + 480 - 29;
  const openPath = [[OPEN_DOOR, 446, Z + 4], [OPEN_DOOR, 300, Z + 6], [ogPod(1, 0)[0] + 15, 30 + 107, PL + 6 + 34], [ogPod(3, 0)[0] + 15, 30 + 107, PL + 6 + 34], [40 + 29, 30 + 31, PL + 6 + 30]];
  const LAYERS = [['execution', 'own pods and CPU'], ['persistence', 'database, Redis, topic'], ['observability', 'cell metrics'], ['deploy', 'name and version'], ['failure', 'goes down on its own']];
  function layers(o, on = () => 1) { LAYERS.forEach(([a, b], i) => { show(o, 'L' + i); const s = on(i); if (s) o.on['L' + i] = s; o.rows['L' + i] = act(a, b); }); }
  // a estante do gato: sp 6 · rio 3 · recife 2 · mkt 8
  const DG = [['sp', 14, 3], ['rio', 90, 3], ['recife', 166, 2], ['mkt', 218, 4]];
  const gatoPos = (g, i) => [560 + DG[g][1] + (i % DG[g][2]) * 21, 190 + 26 + Math.floor(i / DG[g][2]) * 22];
  function depot(o, n = [6, 3, 2, 8], st = (g, i) => 'on', extra = []) {
    show(o, 'depo'); const tot = n.reduce((a, b) => a + b, 0);
    o.rows.depo = act(`cat · ${tot} in network`, 'STOCK');
    o.rows.depo.labs = DG.map(([nm, lx, cols], g) => [lx + cols * 10.5 - 2, 100, `${nm} ${n[g]}`, n[g] ? 'hi' : 'bad', 12]);
    DG.forEach((d, g) => { for (let i = 0; i < n[g]; i++) { const [x, y] = gatoPos(g, i); o.fleet.push({ x, y, s: 16, st: st(g, i), lab: '' }); } });
    extra.forEach(e => o.fleet.push(e));
  }
  const RINGS = [['cell zero', 'sint-01…03', '0%'], ['celula-recife', '+ Recife', '12%'], ['celula-rio', '+ Rio', '27%'], ['celula-sp', '+ SP', '60%'], ['celula-mkt', '+ partner', '100%']];
  function rings(o, k, badZero) { RINGS.forEach(([a, b, p], i) => { show(o, 'r' + i); if (i <= k) o.on['r' + i] = i === 0 && badZero ? 'bad' : 1;
    o.rows['r' + i] = act(a, i <= k ? p : '', [b, i <= k ? 'hi' : 'dim'], [i === 0 ? '0% of real' : `cumulative ${p}`, i <= k ? 'acc' : 'dim']); }); }
  // colunas sobre as células
  const barOn = (o, c, v, st = 'acc', dx = 0, w = 56) => o.bars.push({ x: c.x + c.w / 2 - w / 2 + dx, y: CY + 74, w, d: 56, h: v * 4, st });
  // shuffle: N células em grade e os cinco clientes na frente
  const CLI = [['mkt-01', [8, 9]], ['lena-77', [6, 8]], ['bia-31', [4, 6]], ['caio-58', [1, 4]], ['davi-12', [1, 9]]];
  function grid(N) { if (N === 4) return i => ({ x: 130 + i * 175, y: 150, s: 80 });
    if (N === 20) return i => ({ x: 70 + (i % 10) * 80, y: 130 + Math.floor(i / 10) * 100, s: 48 });
    return i => ({ x: 110 + (i % 5) * 140, y: 125 + Math.floor(i / 5) * 105, s: 64 }); }
  function shuffle(o, { N = 10, down = [], cli = true, st } = {}) {
    const G = grid(N);
    for (let i = 0; i < N; i++) { const g = G(i), dn = down.includes(i + 1); o.fleet.push({ ...g, st: dn ? 'bad' : 'on', lab: 'c' + (i + 1) }); }
    if (!cli) return;
    CLI.forEach(([nm, pr], k) => { show(o, 'k' + k); const lost = pr.filter(p => down.includes(p)).length, s = st ? st(k, lost) : lost === 2 ? 'bad' : 1;
      o.on['k' + k] = s; o.rows['k' + k] = act(nm, `{${pr.join(', ')}}`, [lost === 2 ? 'no service' : lost === 1 ? 'lost one' : down.length ? 'did not notice' : 'two cells', lost === 2 ? 'bad' : lost ? 'acc' : 'hi']);
    });
    const users = {}; CLI.forEach(([nm, pr]) => pr.forEach(p => (users[p] = users[p] || []).push(nm.split('-')[0])));
    Object.entries(users).forEach(([p, us]) => { const g = G(p - 1), dn = down.includes(+p);
      T(o, [g.x + g.s / 2, g.y + g.s / 2, PL + 6 + g.s + 22], us.join(' · '), dn ? 'bad' : us.includes('lena') ? 'acc' : 'hi'); });
  }
  const repLine = (c, k) => { const tx = c.id === 'sp' ? 560 : 120 + (k - 1) * 130, yy = 100 + k * 4;
    return [[c.x + 29, CY + 31, PL + 6 + 26], [c.x + 29, yy, PL + 40], [tx, yy, PL + 40], [tx, 60, PL + 12]]; };
  function passives(o, st = 1) {
    show(o, 'pasSP', 'pasRio'); o.on.pasSP = 'ghost'; o.on.pasRio = 'ghost';
    o.rows.pasSP = act('passives in SP', 'SHADOWS', ['celula-rio · lag 300 ms', 'hi'], ['celula-recife · lag 800 ms', 'hi'], ['celula-mkt · lag 800 ms', 'hi']);
    o.rows.pasRio = act('passive in Rio', 'SHADOW', ['celula-sp · lag 300 ms', 'hi']);
  }

  // ── o que se vê em cada passo ──
  const POI = 'quantidade: 2147483648';
  const STEPS = {
    pilha: [
      { id: 'unica', dur: 5, title: 'The single stack: one version serves everyone', yk: 'TODAY: ONE SINGLE STACK',
        code: ['30 orders/s on Black Friday', 'pedidos@2.6.0: 3 pods', 'estoque, pagamentos, Redis: just one', 'module 25 bulkheads: inside the stack', 'radius of any defect: 100%'],
        story: 'After module 25 the store has bulkheads inside the pools, but it is still <b>a single stack</b>: one <code>pedidos</code> 2.6.0 with <b>3 pods</b>, one <code>estoque</code>, one database and one Redis for all customers. On Black Friday night <b>30 orders/s</b> go through it. If one request takes down <code>pedidos</code>, it takes it down for everyone.',
        look: 'The whole slab is one store: the 3 pedidos pods in the middle, the database, Redis and topic at the back, and the gateway at the door.',
        key: 'A shared stack has a radius of 100%.',
        f(o) { uni(o); o.beams.push({ pts: uniPath(1), on: 1, flow: 3, sp: 0.3 });
          o.cnt = [['ORDERS/S', '30'], ['PEDIDOS PODS', '3', 'dim'], ['RADIUS', '100%', 'dim']];
          o.res = [['one stack for everyone', 'acc']]; } },
      { id: 'veneno', dur: 6, title: '20:25:00.000: the mkt-01 poison', yk: 'POISON PILL', act: ['Send the poison', 'quantidade: 2147483648'],
        code: ['POST /pedidos (mkt-01 bot)', 'quantidade: 2147483648 = 2³¹', 'does not fit in an int32: panic on the sum', 'gw-loja retries: up to 3 attempts', '3 pods × ~50 ms = 150 ms'],
        story: 'At <b>20:25:00.000</b> the <code>mkt-01</code> bot sends a <code>POST /pedidos</code> with an item of <code>quantidade: 2147483648</code>. That is 2³¹, it does not fit in an <code>int32</code>, and <code>pedidos</code> 2.6.0 does a <code>panic</code> when adding up the total. <code>gw-loja</code> does a <i>retry</i> (up to 3 attempts, module 21) and the same request takes down <b>all 3 pods</b> in about <b>150 ms</b>.',
        look: 'In slow motion: the big red token comes in through the door and switches off one pod at a time.',
        key: 'A poisoned request that the retry spreads takes down all the identical replicas.',
        f(o, t) { const down = i => t > 1.6 + i * 1.1; uni(o, i => down(i) ? 'bad' : 'on');
          [0, 1, 2].forEach(i => trip(o, uniPath(i), t, 0.3 + i * 1.1, 1.6 + i * 1.1, 'bad', 20));
          const n = [0, 1, 2].filter(down).length; if (n === 3) bad(o, 'uni');
          if (t < 4.2) T(o, [UNIPOD(Math.min(2, Math.floor(Math.max(0, t - 0.3) / 1.1)))[0] + 15, CY + 60, 90], POI, 'bad');
          o.cnt = [['PODS UP', String(3 - n), n === 3 ? 'bad' : ''], ['TIME', `${n * 50} ms`, 'dim'], ['ATTEMPT', `${Math.max(1, Math.min(3, n + 1))} of 3`, 'dim']];
          o.res = n === 3 ? [['3 pods down in 150 ms', 'bad']] : [['the retry spreads the poison', 'dim']]; } },
      { id: 'retry', dur: 9, title: 'Each pod comes back in 30 s and goes down again', yk: '30 ORDERS/S × 240 s',
        code: ['pod comes back in 30 s (module 14)', 'the bot resends once per second', 'takes it down again, every time', 'block the mkt-01 key: 4 min', '30 × 240 = 7,200 attempts fail'],
        story: 'Each pod comes back in <b>30 s</b> and the bot resends the same request once per second: the pods go down as soon as they come up. By the time someone blocks the <code>mkt-01</code> key, <b>4 min</b> have passed (an example), and <b>30 × 240 = 7,200 attempts</b> get a <code>503</code>. That is 100% of the traffic, Lena included, and the <code>503</code> does not use up an order number.',
        look: 'The counter climbs to 7,200; Lena\'s token reaches the door and does not get through.',
        key: 'In the single stack, one customer\'s defect becomes everyone\'s failure.',
        f(o, t) { const s = lin(t, 0.3, 8.3, 0, 240), up = s % 30 > 28.5 && s < 239; uni(o, () => up ? 'on' : 'bad', ['503 for all customers', 'bad']); bad(o, 'uni');
          o.pc.uni = { gw: 'bad', pg: 0, redis: 0, tube: 0 };
          trip(o, uniPath(1).slice(0, 3), (t % 3), 0.2, 1.6, 'acc', 12); if (t % 3 > 1.6) T(o, [UDOOR, CY + CD + 20, 60], 'Lena: 503', 'bad');
          o.beams.push({ pts: uniPath(0), on: 0, tone: 'bad', flow: 2, sp: 0.5 });
          o.cnt = [['FAILURES', thou(30 * s), 'bad'], ['TIME', `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`, 'dim'], ['RADIUS', '100%', 'dim']];
          o.res = s >= 240 ? [['7,200 attempts, 100% of the traffic', 'bad']] : [['the pods come back and go down', 'dim']]; } },
      { id: 'celulas', dur: 5, title: 'Four cells: the store in four stalls', yk: 'CELL = THE WHOLE STACK', act: ['Split into cells', '4 stalls'],
        code: ['celula-sp      33% · 9.9 orders/s', 'celula-rio     15% · 4.5', 'celula-recife  12% · 3.6', 'celula-mkt     40% · 12.0', 'each one: lb, gw, services, database,', '  Redis and topic of its own'],
        story: 'Now the store becomes <b>four cells</b>. Each is the whole stack (the <code>lb</code>, the <code>gw</code>, the services, PostgreSQL, Redis and the <code>pedidos</code> topic) and serves a <b>fixed share</b> of the customers: those in SP, those in Rio, those in Recife and, on its own, the partner <code>mkt-01</code>. In front sits the <b>router</b>, which only picks the cell.',
        look: 'Four stalls with a wall and a single door; celula-mkt is the widest because it takes 40% of the orders.',
        key: 'The cell divides the whole stack, not just the database or the pool.',
        f(o) { cells(o); CELLS.forEach(c => o.pc[c.id] = { gw: 1, pg: 1, redis: 1, tube: 1 });
          o.cnt = [['CELLS', '4'], ['WORST CASE', '40%', 'dim'], ['VERSION', '@2.6.0', 'dim']];
          o.res = [['four whole stacks', 'acc']]; } },
      { id: 'isolado', dur: 9, title: 'The same poison: only celula-mkt goes dark', yk: '12 ORDERS/S × 240 s', act: ['Send the poison again', '20:25:00.000'],
        code: ['router reads cliente_id from the JWT', 'mkt-01 → celula-mkt', 'celula-mkt: 2 pedidos pods (the floor)', '12 × 240 = 2,880 attempts (40%)', 'individuals: 0 requests lost'],
        story: 'The router reads the <code>cliente_id</code> in the JWT (module 8) and sends the poison to <b><code>celula-mkt</code></b>. Its <b>2 pods</b> of <code>pedidos</code> go down and only it is out: <b>12 × 240 = 2,880 attempts</b> from the partner fail, 40% of the traffic, within its SLA. The 1.5 million individual customers lose <b>0</b> requests.',
        look: 'The red token passes through the router and enters only the celula-mkt door; the other three cells stay lit.',
        key: 'The cell does not stop the poison; it limits who it reaches.',
        f(o, t) { const hit = t > 2.2, s = lin(t, 2.4, 8.4, 0, 240);
          cells(o, { st: c => c.id === 'mkt' && hit ? 'bad' : 1, rows: c => c.id === 'mkt' && hit ? ['503 for the partner only', 'bad'] : [`${c.rate} orders/s · ${c.reg}`, 'dim'] });
          trip(o, [...routeP(CI.mkt), podTop(CI.mkt, 0)], t, 0.3, 2.2, 'bad', 20); if (t < 2.4) T(o, [RX + 120, 380, 80], POI, 'bad');
          if (hit) T(o, [doorX(CI.mkt) - 60, CY + 40, 90], `celula-mkt down · ${thou(12 * s)}`, 'bad');
          o.cnt = [['FAILURES', thou(12 * s), hit ? 'bad' : ''], ['INDIVIDUALS', '0', 'dim'], ['RADIUS', '40%', 'dim']];
          o.res = [[hit ? '2,880 from the partner only' : 'the router reads the JWT', hit ? 'bad' : 'dim']]; } },
      { id: 'lena', dur: 6, title: 'Order 1060: Lena buys at 20:25', yk: 'ORDER 1060 · celula-recife',
        code: ['2 plush cats: 79.90 × 2 = 159.80', 'Recife shipping: 15.00', 'total: 174.80 → 201', 'cat in the network: 19 → 17', 'celula-recife allocation: 2 → 0', 'local commit: 2 ms (without the 80 ms to SP)'],
        story: 'At the same time as the poison, <b>20:25:00.000</b>, Lena buys in <code>celula-recife</code>: <b>2 plush cats</b> (159.80, a gift for her two nieces) and Recife shipping of 15.00. Total <b>174.80</b>, response <code>201</code>: <b>order 1060</b>. Since her cell lives in Recife, the commit is local, <b>2 ms</b>, without crossing the country to SP.',
        look: 'Lena\'s token enters through the celula-recife door and goes to the database; next to it, celula-mkt stays dark.',
        key: 'While the partner goes down, Lena buys without noticing anything.',
        f(o, t) { cells(o, { st: c => c.id === 'mkt' ? 'bad' : 1, flow: false, rows: c => c.id === 'rec' && t > 3 ? ['1060 · 174.80 · 201', 'acc'] : c.id === 'mkt' ? ['503 for the partner only', 'bad'] : [`${c.rate} orders/s · ${c.reg}`, 'dim'] });
          o.pc.rec = { gw: 1, pg: t > 2.8 ? 1 : 0 };
          const path = [...routeP(CI.rec), podTop(CI.rec, 0), pgTop(CI.rec)]; trip(o, path, t, 0.3, 3, 'acc', 13);
          const p = alongPts(path, cumLen(path), ease(clamp((t - 0.3) / 2.7))); T(o, [p[0], p[1], p[2] + 28], t > 3 ? '1060 · 201' : 'Lena · 1060', 'acc');
          o.cnt = [['ORDER', '1060'], ['TOTAL', '174.80', 'dim'], ['RESPONSE', t > 3 ? '201' : '…', 'dim']];
          o.res = [[t > 3 ? 'cat 19 → 17 · Recife 2 → 0' : 'local commit, 2 ms', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'What if it goes wrong: a global stock', yk: 'THE HIDDEN CHANNEL (MODULE 25)',
        code: ['the four cells call the same stock', '  and the same Redis', 'defect in that part = defect in all four', 'radius: 100% again'],
        story: 'If the four cells call the same <code>estoque</code> and the same Redis, any defect in that part (a stuck <i>lock</i>, a poisoned request that reaches it, the partner\'s load) applies to all four. The radius goes back to <b>100%</b>: it is the hidden channel from module 25, and the isolation becomes decoration.',
        look: 'The four wires go to the same stock, at the back; when it turns red, all four cells go dark.',
        key: 'A shared part brings back the 100% radius.',
        f(o, t) { const b = t > 2; cells(o, { st: () => b ? 'bad' : 1, flow: !b, rows: () => [b ? 'no stock: 503' : 'calls the global stock', b ? 'bad' : 'dim'] });
          show(o, 'gEst'); o.on.gEst = b ? 'bad' : 1; o.rows.gEst = act('global stock', 'SHARED', ['just one for the 4 cells', b ? 'bad' : 'hi'], [b ? 'went down: radius 100%' : 'the hidden channel', b ? 'bad' : 'dim']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 120, CY + 60, PL + 26], [c.x + 120, 104 + k * 3, PL + 40], [330 + k * 80, 104 + k * 3, PL + 40], [330 + k * 80, 70, PL + 16]], on: b ? 0 : 1, tone: b ? 'bad' : '' }));
          o.cnt = [['RADIUS', b ? '100%' : '…', b ? 'bad' : ''], ['PART', 'estoque', 'dim'], ['CELLS DOWN', b ? '4 of 4' : '0 of 4', 'dim']];
          o.res = [[b ? 'the radius is back to 100%' : 'one part for all of them', b ? 'bad' : 'dim']]; } },
    ],
    raio: [
      { id: 'fracao', dur: 5, title: 'The radius is the share of the orders', yk: 'RADIUS = SHARE OF THE TRAFFIC',
        code: ['celula-mkt     40%', 'celula-sp      33%', 'celula-rio     15%', 'celula-recife  12%', 'sum           100%'],
        story: 'A cell\'s blast radius is the <b>share of the orders</b> that goes through it, not 1 ÷ N. In the store the four cells have <b>40 · 33 · 15 · 12%</b>. If one goes down, you lose its slice, and the biggest slice is the partner\'s.',
        look: 'Each cell gets a column as tall as its share; celula-mkt\'s is the tallest.',
        key: 'Each cell answers for the slice of traffic it carries.',
        f(o) { cells(o, { pods: 0, routes: false, router: false }); CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); });
          o.cnt = [['WORST CASE', '40%'], ['AVERAGE', '25%', 'dim'], ['CELLS', '4', 'dim']];
          o.res = [['the worst case is celula-mkt', 'acc']]; } },
      { id: 'mix', dur: 5, title: 'Where 33, 15 and 12 come from', yk: 'MIX 55/25/20 × 60%',
        code: ['mkt-01: 40% of the orders', 'individuals: the other 60%', 'SP     55% × 60% = 33%', 'Rio    25% × 60% = 15%', 'Recife 20% × 60% = 12%'],
        story: '<code>mkt-01</code> alone makes <b>40%</b> of the orders (module 16). The other 60% are individuals, with the city mix from module 22: <b>55 / 25 / 20</b>. Multiplying: SP 33%, Rio 15%, Recife 12%. Each customer sits in their city\'s cell: Lena in Recife, Bia and Davi in SP, Caio in Rio.',
        look: 'The three individual-customer columns add up to 60%; the partner\'s, alone, 40%.',
        key: 'The shares come from the city mix applied to the 60% of individuals.',
        f(o) { const MX = { sp: '55% × 60%', rio: '25% × 60%', rec: '20% × 60%', mkt: 'the partner' }, WHO = { sp: 'Bia · Davi', rio: 'Caio', rec: 'Lena', mkt: 'mkt-01' };
          cells(o, { pods: 0, routes: false, router: false, rows: c => [WHO[c.id], 'hi'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%\n${MX[c.id]}`, c.id === 'mkt' ? 'acc' : 'hi'); });
          o.cnt = [['INDIVIDUALS', '60%'], ['PARTNER', '40%', 'dim'], ['MIX', '55/25/20', 'dim']];
          o.res = [['33 + 15 + 12 = 60', 'acc']]; } },
      { id: 'regiao', dur: 5, title: 'Why celula-mkt lives in Recife', yk: 'NO REGION ABOVE 52%',
        code: ['mkt in Recife: SP 33 · Rio 15 · Recife 52', 'mkt in SP:     SP 73%', 'mkt in Rio:    Rio 55%', 'whichever region goes down takes 52% at most'],
        story: '<code>celula-mkt</code> lives in <b>Recife</b>. That way no region holds more than <b>52%</b> of the traffic (Recife: 12 + 40). In SP it would be 73%; in Rio, 55%. The cell isolates the software, but the region is still a failure domain above it.',
        look: 'The two columns on the right live in the same region: together, 52%.',
        key: 'Choosing where the cell lives also limits the radius of a region.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, rows: c => [`region: ${c.reg}`, c.reg === 'Recife' ? 'acc' : 'hi'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.reg === 'Recife' ? 'acc' : 'on'); });
          T(o, [CI.sp.x + 95, CY + 100, PL + 6 + 33 * 4 + 24], 'SP 33%', 'hi'); T(o, [CI.rio.x + 85, CY + 100, PL + 6 + 15 * 4 + 24], 'Rio 15%', 'hi');
          T(o, [610, CY + 100, PL + 6 + 40 * 4 + 30], 'Recife 12 + 40 = 52%', 'acc');
          o.cnt = [['RECIFE', '52%'], ['IF IT WERE SP', '73%', 'dim'], ['IF IT WERE RIO', '55%', 'dim']];
          o.res = [['no region above 52%', 'acc']]; } },
      { id: 'eficiencia', dur: 5, title: 'Worst case 40%, efficiency 62.5%', yk: 'EFFICIENCY = 1 ÷ (N × MAX.)',
        code: ['uniform (1 ÷ 4): 25% each', 'store: worst case 40%', '1 ÷ (4 × 0.40) = 62.5%', 'average 25%, but the worst case rules'],
        story: 'With uniform traffic, 4 cells would give <b>25%</b> each. The store is not uniform: the worst case is <b>40%</b>, and the isolation efficiency is 1 ÷ (4 × 0.40) = <b>62.5%</b>. The average stays at 25%, but the incident that matters is the one on the biggest slice.',
        look: 'The thin column next to each cell is the uniform split, 25%; only celula-mkt goes well past it.',
        key: 'Plan for the worst case, not the average.',
        f(o) { cells(o, { pods: 0, routes: false, router: false });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on', -12); barOn(o, c, 25, 'dim', 40, 14); T(o, [c.x + c.w / 2 - 12, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); });
          T(o, [CI.mkt.x + 165, CY + 110, PL + 6 + 100 + 16], 'uniform: 25%', 'dim');
          o.cnt = [['EFFICIENCY', '62.5%'], ['WORST CASE', '40%', 'dim'], ['UNIFORM', '25%', 'dim']];
          o.res = [['1 ÷ (4 × 0.40) = 62.5%', 'acc']]; } },
      { id: 'semmkt', dur: 5, title: 'Without mkt-01 set apart: 55 · 25 · 20', yk: '3 CELLS BY CITY',
        code: ['without a cell of its own for the partner:', '  SP 55% · Rio 25% · Recife 20%', 'worst case 55% (average 33.3%)', 'with celula-mkt: worst case 40%', 'individuals: partner radius 100% → 0%'],
        story: 'Without the partner\'s own cell, there would be 3 cells by city, with <b>55 · 25 · 20%</b>: worst case <b>55%</b>, average 33.3%. Giving <code>mkt-01</code> its own cell lowers the worst case to 40% and, for individuals, the radius of a partner defect drops from <b>100%</b> (single stack) to <b>0%</b>.',
        look: 'celula-mkt disappears and the three city cells grow: SP goes from 33% to 55%.',
        key: 'Setting the biggest customer apart is what lowers the worst case the most.',
        f(o) { const V = { sp: 55, rio: 25, rec: 20 };
          cells(o, { pods: 0, routes: false, router: false, hide: ['mkt'], rows: c => [`${V[c.id]}% without celula-mkt`, c.id === 'sp' ? 'bad' : 'hi'] });
          ['sp', 'rio', 'rec'].forEach(id => { const c = CI[id]; o.nopc[id] = 1; barOn(o, c, V[id], id === 'sp' ? 'bad' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + V[id] * 4 + 24], `${V[id]}%`, id === 'sp' ? 'bad' : 'hi'); });
          o.cnt = [['WORST CASE', '55%', 'bad'], ['WITH CELULA-MKT', '40%', 'dim'], ['INDIVIDUALS', '100% → 0%', 'dim']];
          o.res = [['the partner in its own cell', 'acc']]; } },
      { id: 'sp2', dur: 5, title: 'SP in two cells', yk: '5 CELLS', act: ['Split SP in two', '33% → 16.5 + 16.5'],
        code: ['celula-sp-a 16.5% · celula-sp-b 16.5%', 'average: 100 ÷ 5 = 20%', 'worst case: 40% (celula-mkt)', 'efficiency: 1 ÷ (5 × 0.40) = 50%'],
        story: 'Splitting <code>celula-sp</code> in two of <b>16.5%</b> lowers the average to 20%, but the worst case stays at <b>40%</b>: the partner\'s slice did not change. The efficiency even drops, to 1 ÷ (5 × 0.40) = <b>50%</b>. More cells only help when the biggest slice shrinks.',
        look: 'SP\'s column becomes two shorter ones; celula-mkt\'s stays where it was.',
        key: 'The worst case is the biggest slice, and splitting the small ones does not touch it.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, rows: c => c.id === 'sp' ? ['sp-a 16.5 · sp-b 16.5', 'acc'] : [`${c.rate} orders/s · ${c.reg}`, 'dim'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; if (c.id === 'sp') { barOn(o, c, 16.5, 'on', -36, 50); barOn(o, c, 16.5, 'on', 36, 50); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + 66 + 24], '16.5% + 16.5%', 'hi'); }
            else { barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); } });
          o.cnt = [['WORST CASE', '40%'], ['AVERAGE', '20%', 'dim'], ['EFFICIENCY', '50%', 'dim']];
          o.res = [['the worst case does not budge', 'acc']]; } },
      { id: 'errado', dur: 5, title: 'What if it goes wrong: planning with 1 ÷ N', yk: 'THE ARTICLE\'S TABLE ASSUMES UNIFORM TRAFFIC',
        code: ['1 ÷ N table: 4 cells = 25%', 'real: 40% in celula-mkt', '40 ÷ 25 = 1.6× what was predicted', 'the radius is the biggest share, not 1 ÷ N'],
        story: 'The article\'s radius table (1 ÷ N) says 4 cells limit the damage to <b>25%</b>. It only holds with uniform traffic. Whoever plans with it promises 25% and delivers <b>40%</b> on the day <code>celula-mkt</code> goes down: 1.6 times what was predicted.',
        look: 'celula-mkt\'s column turns red, well above the thin column of the promised 25%.',
        key: 'Plan for the measured worst case, not the ideal split.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, st: c => c.id === 'mkt' ? 'bad' : 1 });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'bad' : 'on', -12); barOn(o, c, 25, 'dim', 40, 14); });
          T(o, [CI.mkt.x + 113, CY + 100, PL + 6 + 160 + 24], 'real: 40%', 'bad'); T(o, [CI.mkt.x + 165, CY + 110, PL + 6 + 100 + 14], 'promised: 25%', 'dim');
          o.cnt = [['REAL', '40%', 'bad'], ['PROMISED', '25%', 'dim'], ['ERROR', '1.6×', 'dim']];
          o.res = [['1 ÷ N only holds if traffic is uniform', 'bad']]; } },
    ],
    celula: [
      { id: 'dentro', dur: 5, title: 'Inside celula-recife: the whole stack', yk: 'celula-recife@2.6.0',
        code: ['lb + gw (the door)', 'catalogo · carrinho · pedidos', 'pagamentos · estoque · entregas', 'PostgreSQL · Redis · pedidos topic', '12% of the orders · 3.6 orders/s'],
        story: 'On the inside, <code>celula-recife</code> has everything the store had: the <code>lb</code> and the <code>gw</code>, the services, PostgreSQL, Redis and the <code>pedidos</code> topic. It has a <b>name and a version</b> (<code>celula-recife@2.6.0</code>) and serves <b>12%</b> of the orders, 3.6 per second on Black Friday.',
        look: 'The open cell: the database, Redis and topic at the back, the pods in the middle and the gateway at the door.',
        key: 'A cell is a complete, independent copy of the store.',
        f(o) { openCell(o); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          o.cnt = [['SHARE', '12%'], ['ORDERS/S', '3.6', 'dim'], ['VERSION', '@2.6.0', 'dim']];
          o.res = [['the whole store, in a smaller size', 'acc']]; } },
      { id: 'cinco', dur: 5, title: 'Five segmentations at the same time', yk: 'ISOLATE ALONG 5 DIMENSIONS',
        code: ['execution: own pods and CPU', 'persistence: database, Redis and topic', 'observability: cell metrics', 'deploy: own version (@2.6.0)', 'failure: goes down without taking the others'],
        story: 'The cell isolates along <b>five dimensions at once</b>: execution, persistence, observability, deploy and failure. Isolating only the database is a <i>shard</i> (module 16); only the CPU is a <i>bulkhead</i> (module 25). The cell only exists when all five hold together.',
        look: 'The five layers on the right light up one by one; all of them are boundaries of the same cell.',
        key: 'Shard isolates data, bulkhead isolates resources, cell isolates the stack.',
        f(o, t) { openCell(o); layers(o, i => t > 0.4 + i * 0.7 ? 1 : 0); depot(o, [6, 3, 2, 8], () => 'dim');
          const n = [0, 1, 2, 3, 4].filter(i => t > 0.4 + i * 0.7).length;
          o.cnt = [['DIMENSIONS', `${n} of 5`], ['ONLY THE DATABASE', 'shard', 'dim'], ['ONLY THE CPU', 'bulkhead', 'dim']];
          o.res = [['all five together make the cell', 'acc']]; } },
      { id: 'porta', dur: 6, title: 'A single door: the gateway', yk: 'ALL OUTSIDE COMMUNICATION GOES THROUGH THE GW',
        code: ['in: router → the cell\'s gw', 'inside: gw → pedidos → estoque → pg', 'nothing inside knows anything outside', 'between cells: passive replication only'],
        story: 'All outside communication goes through the <b>cell gateway</b>, the only door. Recife\'s <code>pedidos</code> does not call SP\'s <code>estoque</code>; it does not even know SP exists. The only data that leaves the cell is the <b>passive replication</b> to the copy in another region (lesson 4).',
        look: 'The 1060 token comes in through the door, passes through pedidos and estoque and ends at the database, without touching the wall. The order number and the trace_id go with it.',
        key: 'A single door, and nothing in there knows the outside.',
        f(o, t) { openCell(o, { podSt: (g, i) => (g === 1 && t > 1.6 && t < 3) || (g === 3 && t > 2.6 && t < 4) ? 'new' : 'on' }); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          trip(o, openPath, t, 0.3, 4.2, 'acc', 13); const p = alongPts(openPath, cumLen(openPath), ease(clamp((t - 0.3) / 3.9)));
          T(o, [p[0], p[1], p[2] + 30], '1060 · trace_id', 'acc');
          o.cnt = [['DOORS', '1'], ['ORDER', '1060', 'dim'], ['LEAVES THE CELL', 'replication only', 'dim']];
          o.res = [['gw → pedidos → estoque → pg', 'acc']]; } },
      { id: 'piso', dur: 5, title: 'The floor: 2 replicas per service', yk: 'THE COST OF ISOLATION',
        code: ['celula-recife (2027): 3 · 2 · 2 · 2 = 9 vCPU', 'estoque: 2 replicas in each cell', '4 cells: 53 vCPU × 41 for the single stack', '+12 vCPU (+29.3%)', 'regular day: 4 × 8 = 32 × 9 (3.6×)'],
        story: 'A cell does not shrink to zero: each service needs <b>2 replicas</b> at minimum, to survive the loss of a pod. In the 2027 plan <code>celula-recife</code> takes 3 · 2 · 2 · 2 = <b>9 vCPU</b>, and the four cells add up to <b>53</b> against 41 for the single stack (+29.3%). On a regular day, 32 against 9: <b>3.6×</b>.',
        look: 'Each group has at least two cubes; the estoque, which in the single stack had 2 for everyone, now has 2 in each cell.',
        key: 'The floor per cell is the price of isolation.',
        f(o) { openCell(o, { podSt: (g) => g === 3 ? 'new' : 'on', row: ['9 vCPU in the 2027 plan', 'acc'] }); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          o.cnt = [['vCPU', '53'], ['SINGLE STACK', '41', 'dim'], ['REGULAR DAY', '32 × 9', 'dim']];
          o.res = [['+12 vCPU (+29.3%)', 'acc']]; } },
      { id: 'gato', dur: 6, title: 'The last cat: Recife goes from 2 to 0', yk: 'CAT: 19 = 6 · 3 · 2 · 8', act: ['Last cat', '1060 takes 2'],
        code: ['allocation proportional to demand:', '  sp 6 · rio 3 · recife 2 · mkt 8', '1060: Lena takes 2 cats', 'celula-recife: 2 → 0', 'network: 19 → 17'],
        story: 'A cat is an object in a warehouse, and the <code>estoque</code> also lives in the cell. The <b>19</b> cats were allocated by demand: <b>6 · 3 · 2 · 8</b> (sp, rio, recife, mkt). Order 1060 takes the <b>2</b> from <code>celula-recife</code>: it goes to <b>0</b>, and the network, to 17.',
        look: 'On the shelf, Recife\'s two cubes switch off when the 1060 token passes through the stock.',
        key: 'Physical stock has to be split across the cells.',
        f(o, t) { const sold = t > 2.4; openCell(o, { podSt: g => g === 3 && t > 1.8 && t < 3 ? 'new' : 'on' }); layers(o, () => 0);
          depot(o, sold ? [6, 3, 0, 8] : [6, 3, 2, 8], () => 'on'); if (sold) o.on.depo = 1;
          if (sold) [0, 1].forEach(i => { const [x, y] = gatoPos(2, i); o.fleet.push({ x, y, s: 16, st: 'ghost', lab: '' }); });
          trip(o, openPath.slice(0, 4), t, 0.3, 2.4, 'acc', 13);
          T(o, [gatoPos(2, 0)[0] + 20, 245, 60], sold ? 'recife: 2 → 0' : 'recife: 2', sold ? 'bad' : 'acc');
          o.cnt = [['RECIFE', sold ? '0' : '2', sold ? 'bad' : ''], ['IN NETWORK', sold ? '17' : '19', 'dim'], ['ORDER', '1060', 'dim']];
          o.res = [[sold ? 'Recife\'s cell hit zero' : 'allocated by demand', sold ? 'bad' : 'acc']]; } },
      { id: 'deploy', dur: 7, title: 'Deploy per cell: 0 → 12 → 27 → 60 → 100%', yk: 'EXPOSURE RINGS',
        code: ['cell zero: sint-01…03 (0% real)', 'celula-recife: 12%', '+ celula-rio: 27%', '+ celula-sp: 60%', '+ celula-mkt: 100%'],
        story: 'The module 22 deploy rings are now <b>cells</b>. The new version goes first to <b>cell zero</b>, synthetic, with test customers (<code>sint-01…03</code>) with ZIP codes from SP, Rio and Recife. Then <code>celula-recife</code> (12%), Rio (27% cumulative), SP (60%) and, last, the partner (100%).',
        look: 'The five rings in front light up one at a time, with the cumulative exposure.',
        key: 'Each cell is a deploy ring with a name and a version.',
        f(o, t) { const k = Math.min(4, Math.floor(Math.max(0, t - 0.3) / 1.3)); openCell(o); layers(o, i => i === 3 ? 1 : 0); depot(o, [6, 3, 0, 8], () => 'dim'); rings(o, k);
          o.cnt = [['EXPOSURE', RINGS[k][2]], ['RING', RINGS[k][0], 'dim'], ['RINGS', '5', 'dim']];
          o.res = [['one cell at a time', 'acc']]; } },
      { id: 'zero', dur: 5, title: 'Cell zero finds the 0.00 shipping', yk: 'THE REGIONAL RING TRAP',
        code: ['2.5.0 (module 22): shipping 0.00 in Recife', '1st real ring: celula-recife (12%)', '  = 100% of the Recife customers', 'cell zero with a Recife ZIP code:', '  frete_zero = 1 synthetic order', '  loss: R$ 0'],
        story: 'The regional ring has a trap. Version 2.5.0 from module 22 gave <b>shipping 0.00 in Recife</b>: in the 1st real ring it would hit only 12% of the traffic, but <b>100%</b> of the Recife customers. What protects you is cell zero with a Recife ZIP code, which finds the defect with <b>1 synthetic order</b> and a loss of <b>R$ 0</b>.',
        look: 'Cell zero turns red and the deploy stops there; the celula-recife ring never even lights up.',
        key: 'A regional cell concentrates regional defects; test first in cell zero.',
        f(o) { openCell(o); layers(o, i => i === 3 ? 1 : 0); depot(o, [6, 3, 0, 8], () => 'dim'); rings(o, 0, true);
          o.rows.r0 = act('cell zero', 'STOPPED', ['frete_zero = 1', 'bad'], ['loss: R$ 0', 'acc']);
          T(o, [40 + 77, 360, 60], 'Recife ZIP code: shipping 0.00', 'bad');
          o.cnt = [['LOSS', 'R$ 0'], ['ALERT', 'frete_zero = 1', 'dim'], ['WITHOUT IT', '100% of Recife', 'dim']];
          o.res = [['the defect stops at cell zero', 'acc']]; } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: sold out with 17 cats in the network', yk: 'THE LAST CAT',
        code: ['next Recife customer: "sold out"', 'in the network: sp 6 · rio 3 · mkt 8 = 17', '(a) accept the local sold out', '(b) rebalance: 2 from SP → Recife', '(c) reserve across cells (saga)', 'adopted: (b), below 20% of the allocation'],
        story: 'The next Recife customer sees <b>"sold out"</b>, with <b>17</b> cats in the network. There are three ways out: accept the local sold out (consistent, loses the sale); <b>rebalance</b>, with the control plane moving 2 units from SP to Recife within seconds, off the order path (the one chosen, triggered below 20% of the allocation); or reserve across cells with a saga, which couples two cells on the critical path. A global <code>estoque</code> ends the problem and brings back the 100% radius.',
        look: 'Recife is empty and red; then two SP cubes cross the shelf to Recife.',
        key: 'Rebalancing off the order path keeps the cell isolated.',
        f(o, t) { const mv = clamp((t - 3) / 2.2), done = mv >= 1; openCell(o, { row: [done ? 'estoque: 2 again' : 'sold out (17 in network)', done ? 'acc' : 'bad'] }); layers(o, () => 0);
          const ex = [0, 1].map(i => { const a = gatoPos(0, 4 + i), b = gatoPos(2, i), e = ease(mv); return { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e, s: 16, st: 'new', lab: '' }; });
          depot(o, [4, 3, 0, 8], () => 'on', t > 3 ? ex : []); if (t <= 3) { [4, 5].forEach(i => { const [x, y] = gatoPos(0, i); o.fleet.push({ x, y, s: 16, st: 'on', lab: '' }); }); }
          o.rows.depo = act(done ? 'cat · rebalanced' : 'cat · 17 in network', 'CONTROL PLANE');
          o.rows.depo.labs = DG.map(([nm, lx, cols], g) => { const n = done ? [4, 3, 2, 8][g] : t > 3 ? [4, 3, 0, 8][g] : [6, 3, 0, 8][g]; return [lx + cols * 10.5 - 2, 100, `${nm} ${n}`, n ? 'hi' : 'bad', 12]; });
          o.on.depo = done ? 1 : 'bad';
          if (!done) T(o, [OPEN_DOOR, 300, 70], 'Recife: sold out', 'bad');
          o.cnt = [['RECIFE', done ? '2' : '0', done ? '' : 'bad'], ['IN NETWORK', '17', 'dim'], ['WAY OUT', '(b) rebalance', 'dim']];
          o.res = [[done ? '2 from SP → Recife' : 'sold out with 17 in network', done ? 'acc' : 'bad']]; } },
    ],
    roteador: [
      { id: 'fino', dur: 5, title: 'The thin router: reads the key and picks', yk: 'edge-loja',
        code: ['key: cliente_id from the JWT (module 8)', 'mapa-v42: cliente_id → cell', '1.5 million × ~100 B = 150 MB', 'lena-77 → celula-recife', 'router 99.99% × cell 99.9% = 99.89%'],
        story: 'The router is the shared part that is left, and that is why it has to be <b>thin</b>: it reads the <code>cliente_id</code> from the JWT, looks up the map and forwards. The map (<code>mapa-v42</code>) is a <b>150 MB</b> table (1.5 million customers × ~100 B). In series, a router at 99.99% and a cell at 99.9% give <b>99.89%</b>: the router is the ceiling for all of them.',
        look: 'Lena\'s token stops at the router, which finds lena-77 → celula-recife, and goes on to the right door.',
        key: 'The router only routes; any extra logic is shared risk.',
        f(o, t) { cells(o, { flow: false }); o.rows.router = act('edge-loja', 'ROUTER', ['mapa-v42 · 150 MB', 'hi'], ['lena-77 → celula-recife', t > 1.2 ? 'acc' : 'dim']);
          o.beams.forEach(b => b.on = 0); o.beams[2].on = t > 1.2 ? 1 : 0;
          trip(o, [...routeP(CI.rec), podTop(CI.rec, 0)], t, 0.3, 3, 'acc', 13); T(o, [RX, 400, 70], 'lena-77', 'acc');
          o.cnt = [['MAP', '150 MB'], ['AVAILABILITY', '99.89%', 'dim'], ['VERSION', 'mapa-v42', 'dim']];
          o.res = [['the router is the ceiling', 'acc']]; } },
      { id: 'chave', dur: 5, title: 'The same key, the same cell', yk: 'DETERMINISTIC',
        code: ['lena-77 → celula-recife', 'bia-31  → celula-sp', 'davi-12 → celula-sp', 'caio-58 → celula-rio', 'mkt-01  → celula-mkt'],
        story: 'The routing is <b>deterministic</b>: the same key always lands on the same cell, today and tomorrow. Whoever changes the map is the <b>control plane</b> (placement and migration), off the order path. The router only reads.',
        look: 'Five tokens, five customers, each to the door of its own cell.',
        key: 'Stable key, stable cell.',
        f(o, t) { cells(o, { flow: false }); o.beams.forEach(b => b.on = 1);
          [['rec', 'acc'], ['sp', 'gr'], ['sp', 'gr'], ['rio', 'gr'], ['mkt', 'gr']].forEach(([id, tn], i) => trip(o, [...routeP(CI[id]), podTop(CI[id], i === 2 ? 1 : 0)], (t + i * 0.7) % 3.6, 0.1, 2.6, tn, tn === 'acc' ? 13 : 10));
          CELLS.forEach(c => T(o, [doorX(c), CY + CD + 4, 64], { sp: 'bia-31 · davi-12', rio: 'caio-58', rec: 'lena-77', mkt: 'mkt-01' }[c.id], c.id === 'rec' ? 'acc' : 'hi'));
          o.cnt = [['CUSTOMERS', '5'], ['CHANGE ON THEIR OWN', '0', 'dim'], ['WHO CHANGES THE MAP', 'control plane', 'dim']];
          o.res = [['stable key, stable cell', 'acc']]; } },
      { id: 'modn', dur: 6, title: 'mod N: the 5th cell moves 80.1%', yk: 'hash(cliente_id) mod N', act: ['+ 1 cell', '4 → 5 with mod N'],
        code: ['4 → 5 cells', 'mod N: 80.1% of the keys change', '  (simulation with 100,000 keys)', 'each one takes its data along', '= rehash storm'],
        story: 'With <code>hash(cliente_id) mod N</code>, going from 4 to 5 cells changes the cell of <b>80.1%</b> of the keys (simulation with 100,000 keys). Every customer that changes takes their data along. It is a <i>rehash storm</i>; the hash appears here only to show what to avoid.',
        look: 'The 5th cell appears at the back and almost all the tokens switch doors.',
        key: 'mod N spreads well and migrates almost everything when N changes.',
        f(o, t) { const v = lin(t, 0.8, 3.8, 0, 80.1); cells(o, { st: () => 'bad', flow: false, rows: () => ['80% of customers change', 'bad'] });
          o.rows.router = act('edge-loja', 'mod 5', ['hash(cliente_id) mod 5', 'bad'], ['was mod 4', 'dim']); o.on.router = 'bad';
          show(o, 'c5'); o.on.c5 = 1; o.rows.c5 = act('celula-5 (new)', 'N = 5', ['receives keys from all', 'hi']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 150, CY + 60, PL + 28], [c.x + 150, 106 + k * 3, PL + 40], [520 + k * 70, 106 + k * 3, PL + 40], [520 + k * 70, 70, PL + 14]], on: 0, tone: 'bad', flow: 1, sp: 0.5 }));
          o.cnt = [['MOVED', dec(v, 1) + '%', 'bad'], ['METHOD', 'mod N', 'dim'], ['N', '4 → 5', 'dim']];
          o.res = [['rehash storm', 'bad']]; } },
      { id: 'ring', dur: 5, title: 'The ring: ~19.7%', yk: 'CONSISTENT HASH',
        code: ['4 → 5 cells', 'ring (100 points per cell): ~19.7%', '  theory: 1 ÷ (N + 1) = 1 ÷ 5 = 20%', 'module 16 measured 25.7% from 3 → 4', 'less, but the hash is the one choosing'],
        story: 'With the <b>ring</b> (consistent hash, module 16) only the keys on the arc the new cell takes over change: <b>~19.7%</b> with 100 points per cell, close to the theory, 1 ÷ (N + 1) = 20%. It is far less than 80%, but the hash decides who moves, not you.',
        look: 'Only one wire per cell goes to the 5th; the counter stops near 20%.',
        key: 'The ring moves little, but does not let you choose who.',
        f(o, t) { const v = lin(t, 0.8, 3.2, 0, 19.7); cells(o, { flow: false, rows: () => ['~20% change', 'acc'] });
          o.rows.router = act('edge-loja', 'RING', ['ring · 100 points per cell', 'hi'], ['N = 5', 'dim']);
          show(o, 'c5'); o.on.c5 = 1; o.rows.c5 = act('celula-5 (new)', 'N = 5', ['one arc from each cell', 'hi']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 150, CY + 60, PL + 28], [c.x + 150, 106 + k * 3, PL + 40], [520 + k * 70, 106 + k * 3, PL + 40], [520 + k * 70, 70, PL + 14]], on: 1, flow: 1, sp: 0.3 }));
          o.cnt = [['MOVED', '~' + dec(v, 1) + '%'], ['METHOD', 'ring', 'dim'], ['MOD N', '80.1%', 'dim']];
          o.res = [['~19.7% against 80.1%', 'acc']]; } },
      { id: 'tabela', dur: 5, title: 'The table: only the ones you move change', yk: 'REGISTRY MAP',
        code: ['4 → 5 cells: nobody changes on their own', 'move mkt-01: 20M rows × 2 KB = 40 GB', '40 GB at 50 MB/s = 800 s = 13 min 20 s', 'copy, apply what arrived, flip the map'],
        story: 'With the <b>registry table</b>, adding the 5th cell moves nobody: only whoever the control plane moves changes. Moving <code>mkt-01</code> is 20 million rows × 2 KB = <b>40 GB</b>; at 50 MB/s, <b>13 min 20 s</b>: copy, apply what arrived during the copy and flip the map.',
        look: 'The 5th cell sits empty, waiting; no wire leaves the four.',
        key: 'With the table, moving a customer is a decision, not a side effect.',
        f(o, t) { cells(o); o.rows.router = act('edge-loja', 'TABLE', ['mapa-v42 · 150 MB', 'hi'], ['nothing changes on its own', 'acc']);
          show(o, 'c5'); o.on.c5 = 'ghost'; o.rows.c5 = act('celula-5 (new)', 'EMPTY', ['waits for placement', 'hi'], ['move mkt-01: 13 min 20 s', 'dim']);
          o.cnt = [['MOVED', '0%'], ['MOVE MKT-01', '13 min 20 s', 'dim'], ['DATA', '40 GB', 'dim']];
          o.res = [['only the ones you move change', 'acc']]; } },
      { id: 'borda', dur: 6, title: 'Edge cells: three edges with the map in memory', yk: 'STATIC STABILITY',
        code: ['3 regional edges: SP, Rio, Recife', 'each with mapa-v42 in memory', 'the control plane publishes the map', 'if it goes down: the edges keep going', '  with the last map'],
        story: 'The router runs on <b>three</b> regional edges (<i>edge cells</i>), each with the whole <code>mapa-v42</code> in memory. The control plane publishes the map, but is not on the order path: if it goes down, the edges carry on with the <b>last map</b>. That is <b>static stability</b>.',
        look: 'The control plane, at the back, turns red; the three edges, in front, stay lit and keep routing.',
        key: 'The control plane can go down; the order path does not depend on it.',
        f(o, t) { const dn = t > 2.4; cells(o, { router: false, routes: false });
          [['eSP', 'edge SP', 'sp'], ['eRio', 'edge Rio', 'rio'], ['eRec', 'edge Recife', 'rec']].forEach(([nm, lab, id]) => { show(o, nm); lit(o, nm); o.rows[nm] = act(lab, 'EDGE', ['mapa-v42 in memory', 'hi'], [dn ? 'keeps the last map' : '150 MB', dn ? 'acc' : 'dim']);
            const b = B[nm], cx = b.pos[0] + b.w / 2; o.beams.push({ pts: [[cx, 360, Z + 6], [cx, 342, Z + 6], [doorX(CI[id]), 342, Z + 6], [doorX(CI[id]), CY + CD - 14, Z + 6]], on: 1, flow: 1, sp: 0.3 }); });
          show(o, 'ctrl'); o.on.ctrl = dn ? 'bad' : 1; o.rows.ctrl = act('control plane', 'OFF THE PATH', ['publishes mapa-v42', dn ? 'dim' : 'hi'], [dn ? 'down' : 'placement · migration', dn ? 'bad' : 'dim']);
          o.cnt = [['EDGES UP', '3'], ['CONTROL PLANE', dn ? 'down' : 'up', dn ? 'bad' : 'dim'], ['ORDERS', 'continue', 'dim']];
          o.res = [[dn ? 'the edges do not even notice' : 'the map stays in memory', 'acc']]; } },
      { id: 'psp', dur: 6, title: 'The PSP webhook comes in through the edge', yk: 'ASYNC CELL',
        code: ['charge c-7733 created in celula-sp', 'reference: celula=sp', 'PSP → webhook → edge consumer', 'republishes on celula-sp\'s topic', 'the backlog stays inside the cell'],
        story: 'Not everything arrives with a JWT. The PSP calls the Pix <b>webhook</b> without knowing about cells, so the charge carries the cell in its reference: <code>c-7733</code> carries <code>celula=sp</code>. The edge consumer reads that field and republishes on the <code>celula-sp</code> topic; the <i>backlog</i> stays inside it.',
        look: 'The webhook token comes down from the PSP, stops at the SP edge and enters celula-sp through the topic.',
        key: 'Whatever has no JWT carries the cell in its own reference.',
        f(o, t) { cells(o, { router: false, routes: false, flow: false }); o.pc.sp = { gw: 1, tube: t > 3.2 ? 1 : 0 };
          [['eSP', 'edge SP'], ['eRio', 'edge Rio'], ['eRec', 'edge Recife']].forEach(([nm, lab]) => { show(o, nm); lit(o, nm); o.rows[nm] = act(lab, 'EDGE', ['mapa-v42 in memory', 'hi'], [nm === 'eSP' ? 'edge consumer' : '150 MB', nm === 'eSP' ? 'acc' : 'dim']); });
          show(o, 'psp'); lit(o, 'psp'); o.rows.psp = act('PSP (Pix)', 'EXTERNAL', ['webhook c-7733', 'hi'], ['reference: celula=sp', 'acc']);
          const path = [[667, 60, PL + 20], [667, 60, 120], [165, 390, 120], [165, 390, PL + 22], [165, 342, Z + 6], [doorX(CI.sp), 342, Z + 6], [doorX(CI.sp), CY + CD - 14, Z + 6], [CI.sp.x + 140, CY + 30, PL + 6 + 16]];
          o.beams.push({ pts: path, on: 1 }); trip(o, path, t, 0.3, 3.2, 'acc', 12);
          const p = alongPts(path, cumLen(path), ease(clamp((t - 0.3) / 2.9))); T(o, [p[0], p[1], p[2] + 26], 'c-7733 · celula=sp', 'acc');
          o.cnt = [['CHARGE', 'c-7733'], ['CELL', 'celula=sp', 'dim'], ['BACKLOG', 'in the cell', 'dim']];
          o.res = [['the reference carries the cell', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'What if it goes wrong: mapa-v43 on all the edges', yk: 'THE MAP IS SHARED TOO',
        code: ['mapa-v43: bia-31 → celula-xx', 'published to the 3 edges at once', 'a cell that does not exist: the radius is the map\'s', 'fix: validate the map first', '  publish one edge at a time (rings)', '  keep the last good map'],
        story: 'The map is also a shared part. A bad <code>mapa-v43</code> (<code>bia-31 → celula-xx</code>, a cell that does not exist) published to the three edges at once gets the destination wrong on all of them: the radius is back to <b>100%</b>. The fix: <b>validate</b> the map first, publish <b>one edge at a time</b>, like a deploy ring, and keep the <b>last good map</b> to roll back to.',
        look: 'The control plane publishes mapa-v43 and the three edges turn red together.',
        key: 'Global configuration is published in rings, like code.',
        f(o, t) { const b = t > 1.8; cells(o, { router: false, routes: false, flow: !b });
          [['eSP', 'edge SP'], ['eRio', 'edge Rio'], ['eRec', 'edge Recife']].forEach(([nm, lab], k) => { show(o, nm); o.on[nm] = b ? 'bad' : 1; o.rows[nm] = act(lab, 'EDGE', [b ? 'mapa-v43' : 'mapa-v42', b ? 'bad' : 'hi'], [b ? 'bia-31 → celula-xx' : '150 MB', b ? 'bad' : 'dim']);
            const bk = B[nm], cx = bk.pos[0] + bk.w / 2; o.beams.push({ pts: [[240, 60, PL + 24], [240, 60, 110], [cx, 390, 110], [cx, 390, PL + 22]], on: 0, tone: t > 0.6 ? 'bad' : '', flow: t > 0.6 && !b ? 1 : 0, sp: 0.6 }); });
          show(o, 'ctrl'); o.on.ctrl = 'bad'; o.rows.ctrl = act('control plane', 'PUBLISHES', ['mapa-v43 · to all 3 at once', 'bad'], ['no validation', 'bad']);
          o.cnt = [['RADIUS', b ? '100%' : '…', 'bad'], ['MAP', 'mapa-v43', 'dim'], ['EDGES', b ? '3 of 3' : '…', 'dim']];
          o.res = [['validate · rings · last good map', b ? 'bad' : 'dim']]; } },
    ],
    assincrono: [
      { id: 'compart', dur: 5, title: 'A shared topic: 120 events/s', yk: 'TOPIC pedidos (MODULE 13)',
        code: ['30 orders/s × 4 events = 120 events/s', '3 partitions: 40 events/s each', 'the consumers of all the cells', '  read the same topic'],
        story: 'On the async path, imagine the cells publishing to a <b>shared</b> <code>pedidos</code> topic: 3 partitions, 4 events per order, 30 orders/s = <b>120 events/s</b>, 40 per partition (module 13).',
        look: 'The four cells dump events into the same topic, in front.',
        key: 'A shared topic is a single stack on the async path.',
        f(o) { cells(o, { router: false, routes: false }); shared(o, 0);
          o.cnt = [['EVENTS/S', '120'], ['PER PARTITION', '40', 'dim'], ['PARTITIONS', '3', 'dim']];
          o.res = [['one topic for all', 'acc']]; } },
      { id: 'trava', dur: 9, title: 'The poison jams the partition: 24,000 stuck', yk: '40 EVENTS/S × 600 s', act: ['Publish the poison', 'mkt-01 event'],
        code: ['the consumer crashes on deserialization', '  before reading the DLQ policy', 'the partition jams behind the poison', '10 min: 40 × 600 = 24,000 events', '60% from individuals: 14,400'],
        story: 'The poison event takes the consumer down <b>on deserialization</b>, before it reads the DLQ policy. The partition <b>jams</b>: in 10 min <b>24,000</b> events are stuck behind it (40 × 600), and <b>60% (14,400)</b> are from individual customers. Lena\'s <code>PedidoPago</code> is in that queue.',
        look: 'The red stack grows on top of the jammed partition; the counter reaches 24,000.',
        key: 'On the shared topic the partner\'s poison delays the individual customers.',
        f(o, t) { const s = lin(t, 1.2, 8.2, 0, 600); cells(o, { router: false, routes: false }); shared(o, s);
          trip(o, [[CI.mkt.x + 125, CY + 40, PL + 40], [CI.mkt.x + 125, 400, PL + 40], [305, 400, PL + 24]], t, 0.2, 1.2, 'bad', 18);
          o.cnt = [['STUCK', thou(40 * s), 'bad'], ['INDIVIDUALS', thou(24 * s), 'dim'], ['TIME', `${Math.floor(s / 60)} min`, 'dim']];
          o.res = [[s >= 600 ? '14,400 from individuals' : 'the partition jammed', 'bad']]; } },
      { id: 'porcelula', dur: 5, title: 'One topic per cell', yk: 'pedidos.sp · .rio · .recife · .mkt',
        code: ['each cell publishes to its own topic', 'pedidos.mkt: 12 × 4 ÷ 3 = 16 events/s', '  per partition', 'consumers per cell too'],
        story: 'With <b>per-cell topics</b>, each cell publishes and consumes its own: <code>pedidos.sp</code>, <code>.rio</code>, <code>.recife</code>, <code>.mkt</code>. The partner\'s topic receives 12 orders/s × 4 events ÷ 3 partitions = <b>16 events/s per partition</b>.',
        look: 'The topic in front disappears; the tubes inside each cell light up.',
        key: 'Each cell has its own topic and its own consumer.',
        f(o) { cells(o, { router: false, routes: false, rows: c => [`pedidos.${c.id === 'rec' ? 'recife' : c.id}`, 'acc'] }); CELLS.forEach(c => o.pc[c.id] = { gw: 1, tube: 1 }); edgeCons(o);
          o.cnt = [['TOPICS', '4'], ['MKT PER PARTITION', '16/s', 'dim'], ['SHARED', 'none', 'dim']];
          o.res = [['the backlog stays in the cell', 'acc']]; } },
      { id: 'isolado', dur: 9, title: 'The poison jams only pedidos.mkt: 9,600', yk: '16 EVENTS/S × 600 s', act: ['Publish the poison again', 'to pedidos.mkt'],
        code: ['partition jammed on pedidos.mkt', '10 min: 16 × 600 = 9,600 events', 'all from the partner', 'sp, rio, recife: lag 0'],
        story: 'The same poison now jams one partition of <code>pedidos.mkt</code>: <b>9,600</b> events stuck in 10 min, <b>all from the partner</b>. The other three cells keep going with a lag of <b>0</b>, and Lena\'s <code>PedidoPago</code> goes through right away.',
        look: 'The red stack grows only on top of celula-mkt\'s topic.',
        key: 'The poison\'s backlog stays stuck inside the partner\'s cell.',
        f(o, t) { const s = lin(t, 1.2, 8.2, 0, 600); cells(o, { router: false, routes: false, st: c => c.id === 'mkt' && t > 1.2 ? 'bad' : 1, rows: c => c.id === 'mkt' ? ['pedidos.mkt jammed', 'bad'] : ['lag 0', 'acc'] });
          CELLS.forEach(c => o.pc[c.id] = { gw: c.id === 'mkt' && t > 1.2 ? 'bad' : 1, tube: c.id === 'mkt' && t > 1.2 ? 'bad' : 1 }); edgeCons(o);
          if (s > 0) o.piles.push({ p: [CI.mkt.x + 96 + (CI.mkt.w - 110) / 2, CY + 30, PL + 6 + 10], f: s / 600, v: 16 * s });
          o.cnt = [['STUCK', thou(16 * s), s ? 'bad' : ''], ['INDIVIDUALS', '0', 'dim'], ['BEFORE', '24,000', 'dim']];
          o.res = [['9,600, all from the partner', 'bad']]; } },
      { id: 'errado', dur: 6, title: 'What if it goes wrong: the edge opens the event', yk: 'THE EDGE MUST BE THIN',
        code: ['webhooks come in through an edge consumer', 'if it deserializes the whole body,', '  one bad event takes the edge down', '  and stops the entry for all the cells', 'fix: read only the reference (celula=…)'],
        story: 'The async path also has a shared part: the <b>edge consumer</b>, which receives the webhooks and republishes to each cell\'s topic. If it deserializes the whole body, one bad event takes down the edge and stops the entry for <b>all</b> the cells. The edge should only read the reference (<code>celula=…</code>) and pass it on, like the router.',
        look: 'The edge consumer turns red and the four wires leaving it go dark.',
        key: 'The async edge follows the same rule as the router: thin.',
        f(o, t) { const b = t > 2; cells(o, { router: false, routes: false, flow: false }); CELLS.forEach(c => o.pc[c.id] = { gw: 1, tube: b ? 0 : 1 }); edgeCons(o, b);
          trip(o, [[727, 446, Z + 6], [727, 400, PL + 24]], t, 0.3, 1.8, 'bad', 16);
          o.cnt = [['ENTRY STOPPED', b ? '4 cells' : '…', b ? 'bad' : ''], ['PART', 'edge consumer', 'dim'], ['FIX', 'read only celula=', 'dim']];
          o.res = [[b ? 'the edge became a single point' : 'one malformed event', 'bad']]; } },
    ],
    replicacao: [
      { id: 'passiva', dur: 5, title: 'Each cell has a passive cell', yk: 'PASSIVES IN ANOTHER REGION',
        code: ['celula-sp     → passive in Rio (lag 300 ms)', 'celula-rio    → passive in SP (300 ms)', 'celula-recife → passive in SP (800 ms)', 'celula-mkt    → passive in SP (800 ms)'],
        story: 'Each cell\'s data has a copy in a <b>passive cell</b>, in another region. <code>celula-sp</code> replicates to Rio; the other three replicate to SP. On Black Friday the delay (lag) is <b>300 ms</b> between SP and Rio and <b>800 ms</b> from Recife to SP.',
        look: 'At the back, the passives are shadows of the cells; the wires carry the replication stream.',
        key: 'Each cell has a passive copy in another region.',
        f(o) { cells(o, { router: false, routes: false, flow: false, rows: c => [`lag ${c.id === 'sp' || c.id === 'rio' ? 300 : 800} ms`, 'hi'] }); passives(o);
          CELLS.forEach((c, k) => { o.pc[c.id] = { gw: 1, pg: 1 }; o.beams.push({ pts: repLine(c, k), on: 1, flow: 1, sp: 0.25 }); });
          o.cnt = [['PASSIVES', '4'], ['LAG SP–RIO', '300 ms', 'dim'], ['LAG RECIFE–SP', '800 ms', 'dim']];
          o.res = [['passive replication, asynchronous', 'acc']]; } },
      { id: 'lag', dur: 6, title: 'Asynchronous: loss = rate × lag', yk: 'RPO IN ORDERS',
        code: ['sp      9.9 × 0.3 = 2.97', 'rio     4.5 × 0.3 = 1.35', 'recife  3.6 × 0.8 = 2.88', 'mkt    12.0 × 0.8 = 9.6', 'before (single primary, 30/s):', '  Rio 9 · Recife 24'],
        story: 'By default the replication is <b>asynchronous</b>: the customer does not wait for the copy, and what is lost in an outage is what is in flight, <b>rate × lag</b> (module 17). In <code>celula-sp</code>, 9.9 × 0.3 = <b>2.97</b> orders; in <code>celula-mkt</code>, 12 × 0.8 = <b>9.6</b>. With the single primary it was 30/s: 9 with the Rio lag and 24 with the Recife one. The cell reduces the RPO because it reduces the rate per primary.',
        look: 'The tokens still on the wire are the orders an outage would lose; celula-mkt has more of them.',
        key: 'Fewer orders per primary, fewer orders lost.',
        f(o) { const RPO = { sp: '2.97', rio: '1.35', rec: '2.88', mkt: '9.6' }, ND = { sp: 3, rio: 1, rec: 3, mkt: 10 };
          cells(o, { router: false, routes: false, flow: false, rows: c => [`loss: ${RPO[c.id]} orders`, 'acc'] }); passives(o);
          CELLS.forEach((c, k) => { o.pc[c.id] = { gw: 1, pg: 1 }; o.beams.push({ pts: repLine(c, k), on: 1, flow: ND[c.id], ft: 'acc', sp: 0.12 }); });
          o.cnt = [['WORST', '9.6 orders'], ['SP', '2.97', 'dim'], ['BEFORE (RECIFE)', '24', 'dim']];
          o.res = [['rate × lag, per cell', 'acc']]; } },
      { id: 'tpc', dur: 8, title: '2PC: two rounds, waiting for the slowest', yk: 'CONSISTENT: PREPARE + COMMIT', act: ['Turn on 2PC', 'SP + Rio + Recife'],
        code: ['async: local commit 2 ms', '2PC SP + Rio: 2 × 10 + 2 × 2 = 24 ms', '2PC SP + Rio + Recife:', '  2 × 80 + 2 × 2 = 164 ms', '(model: network rounds)'],
        story: '<b>Consistent</b> replication with <i>two-phase commit</i> makes two rounds, <i>prepare</i> and <i>commit</i>, and each waits for the slowest participant. SP + Rio: <b>24 ms</b>; SP + Rio + Recife: <b>164 ms</b>, against 2 ms for the local commit. The times are a model of network rounds.',
        look: 'In slow motion: the tokens leave SP for Rio and for Recife and come back, twice; the Recife one always arrives last.',
        key: 'In 2PC, each round costs the RTT of the farthest participant.',
        f(o, t) { const ph = t < 0.4 ? -1 : Math.min(3, Math.floor((t - 0.4) / 1.6)), f = ((t - 0.4) % 1.6) / 1.6, ms = Math.min(164, Math.max(0, Math.round(lin(t, 0.4, 6.8, 0, 164))));
          cells(o, { router: false, routes: false, flow: false, hide: [], st: c => c.id === 'mkt' ? 0 : 1, rows: c => c.id === 'mkt' ? ['out of the 2PC', 'dim'] : [c.id === 'sp' ? 'coordenador' : 'participante', 'acc'] });
          ['sp', 'rio', 'rec'].forEach(id => o.pc[id] = { gw: 1, pg: 1 });
          show(o, 'tpc'); lit(o, 'tpc'); o.rows.tpc = act('2PC', 'SP + RIO + RECIFE', [ph < 0 ? 'local commit: 2 ms' : ['prepare →', '← votes', 'commit →', '← ok'][ph], 'acc'], [`${ms} ms`, 'hi']);
          const a = pgTop(CI.sp), lane = (c, yy) => [a, [a[0], yy, PL + 46], [pgTop(c)[0], yy, PL + 46], pgTop(c)];
          const Lr = lane(CI.rio, 104), Lc = lane(CI.rec, 108); o.beams.push({ pts: Lr, on: 1 }, { pts: Lc, on: 1 });
          if (ph >= 0 && t < 6.8) { const out = ph % 2 === 0, fr = out ? f : 1 - f, fRio = clamp(fr * 8), fRec = clamp(fr);
            o.dots.push([alongPts(Lr, cumLen(Lr), out ? fRio : 1 - clamp((1 - fr) * 8)), 'acc', 11], [alongPts(Lc, cumLen(Lc), fRec), 'acc', 11]); }
          o.cnt = [['COMMIT', `${ms} ms`], ['SP + RIO ONLY', '24 ms', 'dim'], ['ASYNC', '2 ms', 'dim']];
          o.res = [[t > 6.8 ? '164 ms per commit' : 'each round waits for Recife', 'acc']]; } },
      { id: 'quente', dur: 5, title: 'The hot row and availability', yk: '1 ÷ LATENCY · 0.999^k',
        code: ['cat stock: the lock lasts through the rounds', '2 ms → 500 reservations/s', '24 ms → 41.7/s', '164 ms → 6.1/s', 'availability: 99.9 · 99.8 · 99.7%'],
        story: 'On a <b>hot row</b>, like the cat\'s stock (module 11), the <i>lock</i> is held through the rounds: <b>500</b> reservations/s at 2 ms, <b>41.7</b> at 24 ms, <b>6.1</b> at 164 ms. And availability multiplies: with 3 cells at 99.9%, 2PC ends up at <b>99.7%</b>, because any participant being down aborts.',
        look: 'The columns over the cells are the cat\'s reservations per second in each mode: async, SP + Rio and SP + Rio + Recife.',
        key: '2PC adds up the latency and multiplies the unavailability.',
        f(o) { cells(o, { router: false, routes: false, flow: false, st: c => c.id === 'mkt' ? 0 : 1, rows: c => [{ sp: 'async: 500/s', rio: '2PC 2: 41.7/s', rec: '2PC 3: 6.1/s', mkt: '' }[c.id], c.id === 'rec' ? 'bad' : 'acc'] });
          [['sp', 500], ['rio', 41.7], ['rec', 6.1]].forEach(([id, v]) => { const c = CI[id]; o.nopc[id] = 1; barOn(o, c, Math.max(0.6, v / 12.5), id === 'rec' ? 'bad' : 'acc'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + Math.max(0.6, v / 12.5) * 4 + 26], `${dec(v, v % 1 ? 1 : 0)}/s\n${{ sp: '99.9%', rio: '99.8%', rec: '99.7%' }[id]}`, id === 'rec' ? 'bad' : 'acc'); });
          o.cnt = [['HOT ROW', '6.1/s', 'bad'], ['ASYNC', '500/s', 'dim'], ['AVAILABILITY', '99.7%', 'dim']];
          o.res = [['any participant being down aborts', 'bad']]; } },
      { id: 'folga', dur: 5, title: 'Headroom: who takes over when one goes down', yk: 'MAX OCCUPANCY = 70% × (N − 1) ÷ N',
        code: ['N = 2:  +100%  → run at 35%', 'N = 3:  +50%   → 46.7%', 'N = 4:  +33.3% → 52.5%', 'N = 10: +11.1% → 63%', 'N = 20: +5.3%  → 66.5%'],
        story: 'When a cell goes down, the others take over its load. With N equal cells each survivor gets <b>1 ÷ (N − 1)</b> more. To stay at ρ ≤ 70% (module 23) after one outage, the normal occupancy has to stay at 70% × (N − 1) ÷ N: <b>35%</b> with active-passive pairs, <b>52.5%</b> with 4 cells, 66.5% with 20.',
        look: 'Each cell shows how far it can go on a normal day (52.5%) and the headroom reserved up to 70%.',
        key: 'Many small cells reserve less headroom than pairs.',
        f(o) { cells(o, { router: false, routes: false, rows: () => ['normal ≤ 52.5%', 'acc'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, 52.5 * 0.6, 'acc', -14, 44); barOn(o, c, 70 * 0.6, 'dim', 30, 14); });
          T(o, [CI.mkt.x + 111, CY + 100, PL + 6 + 31.5 * 4 + 22], '52.5%', 'acc'); T(o, [CI.mkt.x + 155, CY + 110, PL + 6 + 42 * 4 + 16], 'cap 70%', 'dim');
          o.cnt = [['N = 4', '52.5%'], ['PAIRS', '35%', 'dim'], ['N = 20', '66.5%', 'dim']];
          o.res = [['headroom = 1 ÷ (N − 1)', 'acc']]; } },
      { id: 'dados', dur: 6, title: 'The data poison goes along', yk: 'REQUEST × DATA',
        code: ['request poison: stays in the cell', 'data poison (corrupted row):', '  is replicated to the passive', '  and takes both down'],
        story: 'The cell contains the poisoned <b>request</b>. A <b>corrupted row</b> in the database is something else: replication copies the row to the passive, and when the passive takes over it goes down for the same reason. For the data poison, the passive is no way out.',
        look: 'The red token leaves celula-mkt\'s database, travels along the replication wire and switches off the shadow in SP too.',
        key: 'The cell contains requests, not corrupted data.',
        f(o, t) { const b = t > 3; cells(o, { router: false, routes: false, st: c => c.id === 'mkt' ? 'bad' : 1, rows: c => c.id === 'mkt' ? ['corrupted row', 'bad'] : ['ok', 'hi'] }); passives(o);
          o.pc.mkt = { pg: 'bad' }; if (b) { o.on.pasSP = 'bad'; o.rows.pasSP = act('passives in SP', 'CORRUPTED', ['celula-rio · lag 300 ms', 'hi'], ['celula-recife · lag 800 ms', 'hi'], ['celula-mkt: the same row', 'bad']); }
          CELLS.forEach((c, k) => o.beams.push({ pts: repLine(c, k), on: c.id !== 'mkt' ? 1 : 0, tone: c.id === 'mkt' ? 'bad' : '' }));
          trip(o, repLine(CI.mkt, 3), t, 0.4, 3, 'bad', 16);
          o.cnt = [['CORRUPTED COPIES', b ? '2' : '1', 'bad'], ['REQUEST', 'stays in the cell', 'dim'], ['DATA', 'replicates', 'dim']];
          o.res = [[b ? 'the passive went down too' : 'the row travels in the stream', 'bad']]; } },
      { id: 'errado', dur: 7, title: 'What if it goes wrong: celula-sp goes down and Rio goes to 48%', yk: 'UNEQUAL CELLS',
        code: ['celula-sp goes down; the passive in Rio takes over', 'Rio: 15% → 48% of the traffic', '4.5 → 14.4 orders/s (3.2×), not +33%', 'ways out: run at 35% in pairs', '  or many small cells', '  or degrade by priority (12 · 6 · 2)'],
        story: 'If <code>celula-sp</code> (33%) goes down and only the passive in Rio takes it over, Rio goes from <b>15% to 48%</b> of the traffic: from 4.5 to <b>14.4 orders/s</b>, 3.2 times, not the +33% of the equal-cells math. The ways out: pairs running at 35%, many small cells or degrade by priority (the 12 · 6 · 2 lanes from module 25).',
        look: 'celula-sp goes dark and Rio\'s column rises from 15% to 48%.',
        key: 'With unequal cells, the passive can receive more than it can handle.',
        f(o, t) { const v = lin(t, 1.5, 4.5, 15, 48); cells(o, { router: false, routes: false, st: c => c.id === 'sp' && t > 1 ? 'bad' : 1, rows: c => c.id === 'rio' ? [`${dec(v * 0.3, 1)} orders/s`, v > 40 ? 'bad' : 'acc'] : c.id === 'sp' && t > 1 ? ['down', 'bad'] : [`${c.rate} orders/s`, 'dim'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; if (c.id === 'rio') barOn(o, c, v, v > 30 ? 'bad' : 'acc'); else if (c.id !== 'sp' || t <= 1) barOn(o, c, c.frac, 'dim'); });
          T(o, [CI.rio.x + 85, CY + 100, PL + 6 + v * 4 + 26], `Rio: ${Math.round(v)}%`, v > 30 ? 'bad' : 'acc');
          o.cnt = [['RIO', `${Math.round(v)}%`, v > 30 ? 'bad' : ''], ['ORDERS/S', dec(v * 0.3, 1), 'dim'], ['TIMES', dec(v / 15, 1) + '×', 'dim']];
          o.res = [['3.2×, not +33%', 'bad']]; } },
    ],
    shuffle: [
      { id: 'pares', dur: 5, title: 'Each customer in 2 of 10 cells', yk: 'N = 10, k = 2 · 45 PAIRS',
        code: ['mkt-01  {8, 9}', 'lena-77 {6, 8}', 'bia-31  {4, 6}', 'caio-58 {1, 4}', 'davi-12 {1, 9}', 'draw: rendezvous with murmur3'],
        story: '<i>Shuffle sharding</i> gives each customer <b>k cells</b> instead of one. With 10 cells and k = 2 there are <b>45 possible pairs</b>, and each customer gets one (drawn by <i>rendezvous</i> with <code>murmur3</code>, the placements from module 16). If one of their cells goes down, the other one serves.',
        look: 'Each customer in front has two wires, one to each cell of their pair.',
        key: 'Each customer has two cells; one is enough.',
        f(o) { shuffle(o); o.cnt = [['PAIRS', '45'], ['N', '10', 'dim'], ['k', '2', 'dim']]; o.res = [['k = 2 of N = 10', 'acc']]; } },
      { id: 'derruba', dur: 5, title: 'The mkt-01 poison takes down 8 and 9', yk: 'f = 2 CELLS DOWN', act: ['Take down 8 and 9', 'the mkt-01 poison'],
        code: ['mkt-01 sends the poison to its two cells', 'c8 and c9 go down', 'the 8 survivors take on +25% (2 ÷ 8)'],
        story: 'The <code>mkt-01</code> poison goes to its two cells and takes down <b>8</b> and <b>9</b>. The 8 survivors take on <b>+25%</b> each (2 ÷ 8).',
        look: 'Cells 8 and 9 turn red; so do the wires that reached them.',
        key: 'Two cells go down, and the rest of the grid stays up.',
        f(o, t) { const d = t > 1 ? [8, 9] : []; shuffle(o, { down: d, st: (k, lost) => k === 0 && d.length ? 'bad' : 1 });
          o.cnt = [['DOWN', d.length ? 'c8 · c9' : '…', 'bad'], ['SURVIVORS', '8', 'dim'], ['EXTRA ON EACH', '+25%', 'dim']];
          o.res = [['2 of 10 cells went down', 'bad']]; } },
      { id: 'quem', dur: 5, title: 'Who notices the outage?', yk: 'WHO LOSES BOTH',
        code: ['bia-31 {4, 6}: does not notice', 'caio-58 {1, 4}: does not notice', 'lena-77 {6, 8}: loses 8, keeps 6', 'davi-12 {1, 9}: loses 9, keeps 1', 'mkt-01 {8, 9}: loses both'],
        story: '<b>Bia and Caio do not even notice</b>: none of their cells went down. <b>Lena and Davi lose one</b> and keep the other. Only whoever has exactly {8, 9} is left without service: <code>mkt-01</code> itself and anyone else with the same pair.',
        look: 'In front, only mkt-01 turns red; Lena and Davi continue over a single wire.',
        key: 'Only whoever has the whole same pair loses everything.',
        f(o) { shuffle(o, { down: [8, 9] }); o.cnt = [['NO SERVICE', '1 of 5', 'bad'], ['LOST ONE', 'Lena · Davi', 'dim'], ['DID NOT NOTICE', 'Bia · Caio', 'dim']]; o.res = [['only the {8, 9} pair goes down', 'acc']]; } },
      { id: 'conta', dur: 5, title: '1 in 45: 2.22%', yk: 'EXACT: 1 ÷ C(N, k)',
        code: ['C(10, 2) = 45 pairs', '1 ÷ 45 = 2.22%', 'with 1 cell per customer: 2 ÷ 10 = 20%', 'article: (f/N)^k = (2/10)² = 4%'],
        story: 'Only whoever has the {8, 9} pair is completely out: <b>1 in 45</b>, or <b>2.22%</b> of the customers (the 1 ÷ 45 from module 16). With one cell per customer, the same two outages would take out 20%. The article\'s formula, <code>(f/N)^k</code>, gives 4%: it draws with replacement and is an approximation. The exact math is C(f,k) ÷ C(N,k).',
        look: 'One red pair out of 45: it is the share of customers left with no cell.',
        key: 'The radius becomes a probability: 1 ÷ C(N, k).',
        f(o) { shuffle(o, { down: [8, 9] }); o.cnt = [['EXACT', '2.22%'], ['ARTICLE', '4%', 'dim'], ['WITHOUT SHUFFLE', '20%', 'dim']]; o.res = [['1 ÷ 45 = 2.22%', 'acc']]; } },
      { id: 'n20', dur: 5, title: 'With 20 cells: 0.526%', yk: 'N = 20, k = 2 · 190 PAIRS',
        code: ['C(20, 2) = 190 pairs', 'exact: 1 ÷ 190 = 0.526%', 'article: (2/20)² = 1%', '"1% = 100 bulkheads" mixes 1 failure with 2', 'same double failure: 190 fixed compartments'],
        story: 'With <b>20 cells</b> there are 190 pairs, and two cells down leave <b>0.526%</b> of the customers completely out (the article says 1%). The article compares that to 100 <i>bulkheads</i>, but it mixes one failure with two: for the same double failure, the equivalent is <b>190</b> fixed compartments. With only one cell down, nobody is completely out.',
        look: 'The grid doubles to 20 cells; only the red pair is still left with no way out.',
        key: 'More cells, many more pairs, a much smaller radius.',
        f(o) { shuffle(o, { N: 20, down: [8, 9], cli: false }); o.cnt = [['EXACT', '0.526%'], ['ARTICLE', '1%', 'dim'], ['PAIRS', '190', 'dim']]; o.res = [['1 ÷ 190 = 0.526%', 'acc']];
          T(o, [450, 60, 150], 'N = 20 · k = 2 · 190 pairs', 'acc'); } },
      { id: 'artigo', dur: 5, title: 'The article\'s table: one row wrong by 10×', yk: '(f/N)^k × C(f,k) ÷ C(N,k)',
        code: ['N 20, f=k 2: 1%       × 0.526%', 'N 20, f=k 3: 0.3375% × 0.0877%', 'N 20, f=k 5: 0.0977% × 0.00645%', '  (the article prints 0.009%)', 'N 10, f=k 2: 4%       × 2.22%'],
        story: 'The article\'s table uses <code>(f/N)^k</code>. In the third row, (5 ÷ 20)^5 gives <b>0.0977%</b>, and the article prints 0.009%: wrong by 10×. The exact math is even smaller, <b>0.00645%</b>. The approximation always overstates the risk, and overstates it more the bigger the k.',
        look: 'Five red cells: only the customer with exactly those five is out.',
        key: 'The article\'s formula is an approximation; the exact one is C(f,k) ÷ C(N,k).',
        f(o) { shuffle(o, { N: 20, down: [3, 8, 9, 14, 17], cli: false }); T(o, [450, 60, 150], 'f = k = 5 · 15,504 sets', 'acc');
          o.cnt = [['EXACT', '0.00645%'], ['FORMULA', '0.0977%', 'dim'], ['ARTICLE PRINTS', '0.009%', 'bad']]; o.res = [['wrong by 10×', 'bad']]; } },
      { id: 'errado', dur: 5, title: 'What if it goes wrong: shuffle with 4 cells', yk: 'N = 4, k = 2 · 6 PAIRS',
        code: ['C(4, 2) = 6 pairs', 'exact: 1 ÷ 6 = 16.7%', 'article: (2/4)² = 25%', 'with 4 cells shuffle barely helps'],
        story: '<i>Shuffle</i> needs many cells. With the store\'s 4 there are only <b>6 pairs</b>, and two cells down take <b>16.7%</b> of the customers off the air. With 10, 2.22%; with 20, 0.526%. In today\'s store what limits the radius is the partner\'s own cell, not the draw.',
        look: 'Four cells, two red: one pair in six is left with none.',
        key: 'Shuffle sharding only pays off with many cells.',
        f(o) { shuffle(o, { N: 4, down: [3, 4], cli: false }); T(o, [450, 110, 130], '6 pairs · 1 ÷ 6 = 16.7%', 'bad');
          o.cnt = [['EXACT', '16.7%', 'bad'], ['ARTICLE', '25%', 'dim'], ['PAIRS', '6', 'dim']]; o.res = [['with 4 cells it barely helps', 'bad']]; } },
    ],
  };
  // tópico compartilhado na frente (s = segundos desde o veneno; 0 = sem veneno)
  function shared(o, s) {
    show(o, 'shTop'); o.on.shTop = s > 0 ? 'bad' : 1; o.rows.shTop = act('pedidos topic (shared)', '3 PARTITIONS'); o.rows.shTop.parts = { n: 3, bad: s > 0 ? 1 : -1 };
    CELLS.forEach(c => { o.pc[c.id] = { gw: 1, tube: 0 }; o.beams.push({ pts: [[c.x + c.w / 2, CY + CD - 30, PL + 30], [c.x + c.w / 2, 342, PL + 30], [Math.min(500, c.x + c.w / 2), 380, PL + 14]], on: 1, flow: 1, sp: 0.35 }); });
    if (s > 0) o.piles.push({ p: [305, 398, PL + 10], f: s / 600, v: 40 * s });
  }
  function edgeCons(o, b) { show(o, 'cons'); o.on.cons = b ? 'bad' : 1; o.rows.cons = act('edge consumer', 'WEBHOOKS', [b ? 'crashed on deserialization' : 'reads celula=… and republishes', b ? 'bad' : 'hi']);
    CELLS.forEach(c => o.beams.push({ pts: [[727, 360, PL + 20], [727, 342, Z + 6], [doorX(c), 342, Z + 6], [doorX(c), CY + CD - 14, Z + 6]], on: b ? 0 : 1, tone: b ? 'bad' : '' })); }

  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', b = on === 'bad', l = on === 1;
    x.fillStyle = b ? (light ? '#f4e4e2' : '#24130f') : l ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = b ? BAD() : l ? accC() : C.line; x.lineWidth = u(l || b ? 1.2 : 0.6); if (on === 'ghost') x.setLineDash([u(3), u(2)]);
    x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2)); x.setLineDash([]);
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11, y = s1 > 15 ? 13 : 11) {
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11.5, s1 - 1), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  function drawLabs(x, u, labs) { x.textAlign = 'center'; (labs || []).forEach(([X, Y, t, tn, s]) => { x.fillStyle = toneC(tn); fitFont(x, u, t, s || 12, 120); x.fillText(t, u(X), u(Y)); }); x.textAlign = 'left'; }
  // partições do tópico compartilhado
  function drawParts(x, u, C, p, W_, H_, y0) {
    const n = p.n, gap = 8, w = (W_ - 10 - gap * (n - 1)) / n, h = H_ - y0 - 6;
    for (let i = 0; i < n; i++) { const X = 5 + i * (w + gap), b = i === p.bad, col = b ? BAD() : accC();
      x.strokeStyle = col; x.lineWidth = u(0.9); x.strokeRect(u(X), u(y0), u(w), u(h));
      x.fillStyle = col; x.globalAlpha = 0.18; x.fillRect(u(X + 2), u(y0 + 2), u(w - 4), u(h - 4)); x.globalAlpha = 1;
      x.fillStyle = b ? BAD() : toneC('hi'); x.textAlign = 'center'; const t = b ? `p${i} · jammed` : `p${i} · 40/s`; fitFont(x, u, t, 13, w - 6); x.fillText(t, u(X + w / 2), u(y0 + h / 2)); x.textAlign = 'left'; }
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg;
    if (cf === 'cell') {   // célula: nome e linha na faixa da frente, à esquerda da porta
      drawLabs(x, u, d.labs);
      const mw = W_ - DW - 26; x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, 21, mw * (d.meta ? 0.76 : 1)); x.fillText(d.name, u(5), u(H_ - 46));
      const nw = x.measureText(d.name).width / u(1);
      if (d.meta) { x.fillStyle = col; fitFont(x, u, d.meta, 19, mw - nw - 8); x.textAlign = 'right'; x.fillText(d.meta, u(mw + 2), u(H_ - 46)); x.textAlign = 'left'; }
      (d.rows || []).slice(0, 1).forEach(([t, tn]) => { x.fillStyle = toneC(tn); fitFont(x, u, t, 16, mw - 26); x.fillText(t, u(5), u(H_ - 20)); });
      cv.tex.needsUpdate = true; return; }
    if (d.name) { head(x, u, d, W_, col, cf.s1, cf.front ? H_ - 14 : undefined); if (!cf.front && cf !== LAY) { const ly = cf.s1 > 15 ? 25 : 21;
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke(); } }
    let y = cf.y0;
    if (cf !== LAY && !cf.front) (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, cf.fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += cf.lh; });
    if (d.parts) drawParts(x, u, C, d.parts, W_, H_, 30);
    drawLabs(x, u, d.labs);
    cv.tex.needsUpdate = true;
  }
  function drawPiece(pc, st) {
    const key = pc.lab + st + theme + accent.getHex(); if (pc.key === key) return; pc.key = key;
    const cv = pc.cv, { x, u } = frameBox(cv, st), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    x.textAlign = 'center'; x.fillStyle = st === 'bad' ? BAD() : st === 1 ? accC() : INK(); fitFont(x, u, pc.lab, 8.5, W_ - 2); x.fillText(pc.lab, u(W_ / 2), u(H_ / 2 + 0.3)); x.textAlign = 'left';
    cv.tex.needsUpdate = true;
  }
  function cubeFace(Cb, lab, st) {
    const key = lab + st + theme + accent.getHex(); if (Cb.key === key) return; Cb.key = key;
    const cv = Cb.top, { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P, C = pal3();
    const b = st === 'bad' || st === 'ghost', on = st === 'on' || st === 'new';
    x.fillStyle = b ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = b ? BAD() : on ? accC() : C.line; x.lineWidth = u(0.5); x.strokeRect(u(0.3), u(0.3), cv.c.width - u(0.6), cv.c.height - u(0.6));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = b ? BAD() : on ? accC() : INK();
      let fs = lab.length > 2 ? 3 : 4; x.font = `700 ${u(fs)}px ${MONO3}`; const tw = x.measureText(lab).width;
      if (tw > u(W_ - 1.2)) { fs *= u(W_ - 1.2) / tw; x.font = `700 ${u(fs)}px ${MONO3}`; } x.fillText(lab, u(W_ / 2), u(H_ / 2 + 0.2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 11, W_ - 4); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { if (pl.v <= 0) continue; const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2];
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? thou(pl.v) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const DATA = {
    pilha: () => `<table class="h3-sum"><tr><th></th><th>single stack</th><th>4 cells</th></tr><tr${on_(step === 2 || step === 4)}><td>attempts that fail</td><td>7,200</td><td>2,880</td></tr><tr${on_(step === 4)}><td>individuals</td><td>100%</td><td>0%</td></tr><tr${on_(step === 1)}><td>pedidos pods down</td><td>3 (150 ms)</td><td>2 from celula-mkt</td></tr><tr${on_(step === 6)}><td>with global stock</td><td>100%</td><td>100%</td></tr></table><li>Poison: <code>quantidade: 2147483648</code> (2³¹) at <b>20:25:00.000</b>; retry up to 3; pod comes back in 30 s; block at 4 min</li><li>Order <b>1060</b>: Lena, 2 cats 159.80 + Recife shipping 15.00 = <b>174.80</b>, <code>201</code>; cat 19 → 17, celula-recife 2 → 0</li><li>Cells: sp 33% (9.9/s) · rio 15% (4.5) · recife 12% (3.6) · mkt 40% (12.0); version <code>@2.6.0</code></li>`,
    raio: () => `<table class="h3-sum"><tr><th>cell</th><th>share</th><th>orders/s</th><th>region</th></tr>${CELLS.map(c => `<tr${on_(c.id === 'mkt')}><td>${c.nm}</td><td>${c.frac}%</td><td>${c.rate}</td><td>${c.reg}</td></tr>`).join('')}</table><li>Worst case <b>40%</b>, average 25%, efficiency 1 ÷ (4 × 0.40) = <b>62.5%</b></li><li>Without celula-mkt: 55 · 25 · 20% (worst case 55%, average 33.3%)</li><li>SP in two: 16.5 + 16.5; worst case still 40%; efficiency 50%</li><li>By region: SP 33% · Rio 15% · Recife 52% (with mkt in SP: 73%; in Rio: 55%)</li>`,
    celula: () => `<table class="h3-sum"><tr><th>cell</th><th>cat.</th><th>ord.</th><th>pay.</th><th>stk.</th><th>vCPU</th></tr><tr><td>mkt</td><td>2</td><td>4</td><td>6</td><td>2</td><td>14</td></tr><tr><td>sp</td><td>8</td><td>4</td><td>5</td><td>2</td><td>19</td></tr><tr><td>rio</td><td>4</td><td>2</td><td>3</td><td>2</td><td>11</td></tr><tr class="on"><td>recife</td><td>3</td><td>2</td><td>2</td><td>2</td><td>9</td></tr><tr><td>total</td><td>17</td><td>12</td><td>16</td><td>8</td><td>53</td></tr><tr><td>single stack</td><td>14</td><td>10</td><td>15</td><td>2</td><td>41</td></tr></table><li>2027 plan (200 orders/s); regular day: 4 × 8 = <b>32</b> × 9 vCPU (3.6×)</li><li>Cat: 19 = <b>6 · 3 · 2 · 8</b> (sp · rio · recife · mkt); warehouses <code>SP-1</code>, <code>RIO-1</code>, <code>REC-1</code></li><li>Rings: cell zero 0% → recife 12% → rio 27% → sp 60% → mkt 100%</li>`,
    roteador: () => `<table class="h3-sum"><tr><th>4 → 5 cells</th><th>change cell</th></tr><tr${on_(step === 2)}><td>hash mod N</td><td>80.1%</td></tr><tr${on_(step === 3)}><td>ring (100 points)</td><td>~19.7%</td></tr><tr${on_(step === 4)}><td>registry table</td><td>0 (only the ones you move)</td></tr></table><li>Map <code>mapa-v42</code>: 1.5 million × ~100 B = <b>150 MB</b>, in memory on each edge</li><li>In series: 99.99% × 99.9% = <b>99.89%</b></li><li>Moving <code>mkt-01</code>: 40 GB at 50 MB/s = <b>13 min 20 s</b></li><li>Webhook <code>c-7733</code> with <code>celula=sp</code>; bad map: <code>mapa-v43</code> (<code>bia-31 → celula-xx</code>)</li>`,
    assincrono: () => `<table class="h3-sum"><tr><th></th><th>shared</th><th>per cell</th></tr><tr><td>events/s per partition</td><td>40</td><td>16 (mkt)</td></tr><tr${on_(step === 1 || step === 3)}><td>stuck in 10 min</td><td>24,000</td><td>9,600</td></tr><tr${on_(step === 1 || step === 3)}><td>from individuals</td><td>14,400</td><td>0</td></tr></table><li>30 orders/s × 4 events = <b>120 events/s</b>; 3 partitions</li><li>The consumer crashes on deserialization, before reading the DLQ policy</li><li>The stuck-event numbers are rate × time (no Kafka was run)</li>`,
    replicacao: () => `<table class="h3-sum"><tr><th>cell</th><th>passive</th><th>lag</th><th>loss</th></tr><tr><td>sp</td><td>Rio</td><td>300 ms</td><td>2.97</td></tr><tr><td>rio</td><td>SP</td><td>300 ms</td><td>1.35</td></tr><tr><td>recife</td><td>SP</td><td>800 ms</td><td>2.88</td></tr><tr class="on"><td>mkt</td><td>SP</td><td>800 ms</td><td>9.6</td></tr></table><li>2PC (model): SP + Rio <b>24 ms</b>; SP + Rio + Recife <b>164 ms</b>; async 2 ms</li><li>Hot row: 500 · 41.7 · 6.1 reservations/s; availability 99.9 · 99.8 · 99.7%</li><li>Max occupancy: 35 · 46.7 · 52.5 · 63 · 66.5% (N = 2, 3, 4, 10, 20)</li><li>SP goes down: Rio 15% → <b>48%</b> (4.5 → 14.4 orders/s, 3.2×)</li>`,
    shuffle: () => `<table class="h3-sum"><tr><th>N</th><th>f = k</th><th>(f/N)^k</th><th>exact</th><th>pairs</th></tr><tr${on_(step === 4)}><td>20</td><td>2</td><td>1%</td><td>0.526%</td><td>190</td></tr><tr><td>20</td><td>3</td><td>0.3375%</td><td>0.0877%</td><td>1,140</td></tr><tr${on_(step === 5)}><td>20</td><td>5</td><td>0.0977%</td><td>0.00645%</td><td>15,504</td></tr><tr${on_(step >= 1 && step <= 3)}><td>10</td><td>2</td><td>4%</td><td>2.22%</td><td>45</td></tr><tr${on_(step === 6)}><td>4</td><td>2</td><td>25%</td><td>16.7%</td><td>6</td></tr></table><li>Pairs (N = 10): mkt-01 {8, 9} · lena-77 {6, 8} · bia-31 {4, 6} · caio-58 {1, 4} · davi-12 {1, 9}</li><li>The article prints 0.009% on the 3rd row (the formula gives 0.0977%)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>\n      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>\n      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>\n      <h2>${s.title}</h2>\n      ${actHtml()}\n      <div class="i3-count" id="f3count">${countHtml()}</div>\n      <p class="o3-story">${s.story}</p>\n      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>\n      <p class="o3-key"><b>In one sentence</b>${s.key}</p>\n      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>\n      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cel') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cel' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { if (v !== sc) { CUBES.forEach(c => c.f = 0); BARS.forEach(b => b.f = 0); } sc = v; try { localStorage.setItem('sdlabs-cel3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'cel') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const stEm = st => st === 'bad' || st === 'ghost' ? [badEm, st === 'ghost' ? 0.12 : 0.75] : st === 'new' ? [accent, 0.7] : st === 'on' || st === 'acc' ? [accent, st === 'acc' ? 0.55 : 0.25] : [accent, 0.04];
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.sink + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? (Bk.h < 8 ? 0.12 : 0.3) : on === 'ghost' ? 0.03 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.h >= 8 ? 0.3 : 0);
      if (Bk.pc) { Bk.pg_.visible = !o.nopc[nm]; const ps = o.pc[nm] || {};
        Object.entries(Bk.pc).forEach(([k, pc]) => { const s = ps[k] ?? 0; if (Bk.g.visible && Bk.pg_.visible) drawPiece(pc, s);
          pc.mat.emissive.copy(s === 'bad' ? badEm : accent); pc.mat.emissiveIntensity = s === 'bad' ? 0.45 : s === 1 ? 0.35 : 0; }); } });
    BARS.forEach((Br, i) => { const b = o.bars[i]; const want = b ? 1 : 0;
      Br.f += Math.sign(want - Br.f) * Math.min(Math.abs(want - Br.f), dt / 0.4);
      if (b) { Br.h += (b.h - Br.h) * Math.min(1, dt / 0.25); Br.x = b.x; Br.y = b.y; Br.w = b.w; Br.d = b.d; Br.st = b.st; }
      Br.g.visible = Br.f > 0.01 && Br.w > 0;
      if (Br.g.visible) { const h = Math.max(0.3, Br.h * ease(clamp(Br.f)));
        Br.g.position.copy(W(Br.x, Br.y, PL + 6)); Br.g.scale.set(Br.w / 10, h / 10, Br.d / 10);
        const [em, k] = stEm(Br.st); Br.mat.emissive.copy(em); Br.mat.emissiveIntensity = k;
        moveGlow(Br.glow, [Br.x + Br.w / 2, Br.y + Br.d / 2, PL + 6 + h + 3], Br.st === 'acc' || Br.st === 'bad' ? 0.35 : 0); }
      else Br.glow.material.uniforms.intensity.value = 0; });
    CUBES.forEach((Cb, i) => { const c = o.fleet[i]; const want = c ? 1 : 0;
      Cb.f += Math.sign(want - Cb.f) * Math.min(Math.abs(want - Cb.f), dt / 0.45);
      if (c) { Cb.x = c.x; Cb.y = c.y; Cb.s = c.s; Cb.st = c.st; cubeFace(Cb, c.lab, c.st); }
      Cb.g.visible = Cb.f > 0.01 && Cb.s > 0;
      if (Cb.g.visible) { const e = ease(clamp(Cb.f)), hs = Cb.st === 'ghost' ? 0.15 : 1;
        Cb.g.position.copy(W(Cb.x, Cb.y, PL + 6 - (1 - e) * (Cb.s + 8))); Cb.g.scale.set(Cb.s / 10, Cb.s * hs / 10, Cb.s / 10);
        const [em, k] = stEm(Cb.st); Cb.mat.emissive.copy(em); Cb.mat.emissiveIntensity = k;
        moveGlow(Cb.glow, [Cb.x + Cb.s / 2, Cb.y + Cb.s / 2, PL + 6 + Cb.s * hs + 3], (Cb.st === 'new' || Cb.st === 'bad') && e > 0.9 ? 0.4 : 0); }
      else Cb.glow.material.uniforms.intensity.value = 0; });
    nDot = 0; o.dots.forEach(([p, tn, sz]) => dot(p, tn, sz)); setBeams(o.beams);
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placePiles(o.piles);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt = POSTER ? cur().dur : lt + dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const [x0, x1, y0, y1] = [24, 880, 20, 446];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH)) * (nar ? 1.1 : 1);
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
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
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto)
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...pieces.map(p => p.cv), ...CARDS.map(c => c.top), ...CUBES.map(c => c.top)];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    NAMES.forEach(nm => { B[nm].key = ''; }); pieces.forEach(p => p.key = ''); CARDS.forEach(c => c.key = ''); CUBES.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; });
    o.bars.forEach((b, i) => Object.assign(BARS[i], { f: 1, h: b.h, x: b.x, y: b.y, w: b.w, d: b.d, st: b.st }));
    o.fleet.forEach((c, i) => Object.assign(CUBES[i], { f: 1 })); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
