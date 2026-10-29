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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['pilha', 'raio', 'celula', 'roteador', 'assincrono', 'shuffle', 'replicacao'];
  const SCNAME = { pilha: 'Pilha', raio: 'Raio', celula: 'Célula', roteador: 'Roteador', assincrono: 'Assíncrono', shuffle: 'Shuffle', replicacao: 'Replicação' };
  const SCFULL = { pilha: 'Pilha única × células', raio: 'Raio de explosão', celula: 'Dentro da célula', roteador: 'O roteador',
    assincrono: 'Células assíncronas', shuffle: 'Shuffle sharding', replicacao: 'Replicação e folga' };
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
      tube: piece(pg_, nm, 'tópico', 96, 22, 6, w - 110, 16, 10, 7.5, 100, 24, w - 118, 12),
    };
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h: 6, sink: WH + 30, cfg: 'cell', key: '', f: 0, pos: [x, y], pc, pg_ };
  }
  const CY = 118, CD = 212;
  const CELLS = [
    { id: 'sp', nm: 'celula-sp', x: 40, w: 190, frac: 33, rate: '9,9', reg: 'SP' },
    { id: 'rio', nm: 'celula-rio', x: 245, w: 170, frac: 15, rate: '4,5', reg: 'Rio' },
    { id: 'rec', nm: 'celula-recife', x: 430, w: 170, frac: 12, rate: '3,6', reg: 'Recife' },
    { id: 'mkt', nm: 'celula-mkt', x: 615, w: 250, frac: 40, rate: '12,0', reg: 'Recife' },
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
      o.rows[c.id] = act(c.nm, `${c.frac}%`, rows ? rows(c) : [`${c.rate} pedidos/s · ${c.reg}`, 'dim']);
      for (let i = 0; i < pods; i++) o.fleet.push({ x: c.x + 18 + i * 34, y: CY + 82, s: 26, st: podSt ? podSt(c, i) : s === 'bad' ? 'bad' : s ? 'on' : 'dim', lab: 'ped' });
      o.pc[c.id] = { gw: s === 'bad' ? 'bad' : s ? 1 : 0 };
      if (routes) o.beams.push({ pts: routeP(c).slice(1), on: flow && s === 1 ? 1 : 0, tone: s === 'bad' ? 'bad' : '', flow: flow && s === 1 ? 1 : 0, sp: 0.3 }); });
    if (router) { show(o, 'router'); lit(o, 'router'); o.rows.router = act('edge-loja', 'ROTEADOR', ['mapa-v42 · 150 MB', 'hi'], ['lê o cliente_id do JWT', 'dim']); }
  }
  // a pilha única: 3 pods de pedidos no meio da laje
  const UNIPOD = i => [380 + i * 40, CY + 82];
  function uni(o, podSt = () => 'on', row) {
    show(o, 'uni'); lit(o, 'uni');
    o.rows.uni = act('loja · pilha única', 'pedidos@2.6.0', row || ['30 pedidos/s · todos os clientes', 'hi']);
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
    o.rows.open = act('celula-recife@2.6.0', '12%', row || ['3,6 pedidos/s · Recife', 'hi']);
    o.pc.open = { gw: 1, pg: 1, redis: 1, tube: 1 };
    OG.forEach(([nm, , n], g) => { for (let i = 0; i < pods[g]; i++) { const [x, y] = ogPod(g, i); o.fleet.push({ x, y, s: 30, st: podSt ? podSt(g, i) : 'on', lab: nm.slice(0, 3) }); } });
    o.rows.open.labs = OG.map(([nm, lx, n], g) => [lx + Math.max(pods[g], 1) * 18 - 3, 136, `${nm} ×${pods[g]}`, 'hi', 11]);
  }
  const OPEN_DOOR = 40 + 480 - 29;
  const openPath = [[OPEN_DOOR, 446, Z + 4], [OPEN_DOOR, 300, Z + 6], [ogPod(1, 0)[0] + 15, 30 + 107, PL + 6 + 34], [ogPod(3, 0)[0] + 15, 30 + 107, PL + 6 + 34], [40 + 29, 30 + 31, PL + 6 + 30]];
  const LAYERS = [['execução', 'pods e CPU próprios'], ['persistência', 'banco, Redis, tópico'], ['observabilidade', 'métricas da célula'], ['deploy', 'nome e versão'], ['falha', 'cai sozinha']];
  function layers(o, on = () => 1) { LAYERS.forEach(([a, b], i) => { show(o, 'L' + i); const s = on(i); if (s) o.on['L' + i] = s; o.rows['L' + i] = act(a, b); }); }
  // a estante do gato: sp 6 · rio 3 · recife 2 · mkt 8
  const DG = [['sp', 14, 3], ['rio', 90, 3], ['recife', 166, 2], ['mkt', 218, 4]];
  const gatoPos = (g, i) => [560 + DG[g][1] + (i % DG[g][2]) * 21, 190 + 26 + Math.floor(i / DG[g][2]) * 22];
  function depot(o, n = [6, 3, 2, 8], st = (g, i) => 'on', extra = []) {
    show(o, 'depo'); const tot = n.reduce((a, b) => a + b, 0);
    o.rows.depo = act(`gato · ${tot} na rede`, 'ESTOQUE');
    o.rows.depo.labs = DG.map(([nm, lx, cols], g) => [lx + cols * 10.5 - 2, 100, `${nm} ${n[g]}`, n[g] ? 'hi' : 'bad', 12]);
    DG.forEach((d, g) => { for (let i = 0; i < n[g]; i++) { const [x, y] = gatoPos(g, i); o.fleet.push({ x, y, s: 16, st: st(g, i), lab: '' }); } });
    extra.forEach(e => o.fleet.push(e));
  }
  const RINGS = [['célula zero', 'sint-01…03', '0%'], ['celula-recife', '+ Recife', '12%'], ['celula-rio', '+ Rio', '27%'], ['celula-sp', '+ SP', '60%'], ['celula-mkt', '+ parceiro', '100%']];
  function rings(o, k, badZero) { RINGS.forEach(([a, b, p], i) => { show(o, 'r' + i); if (i <= k) o.on['r' + i] = i === 0 && badZero ? 'bad' : 1;
    o.rows['r' + i] = act(a, i <= k ? p : '', [b, i <= k ? 'hi' : 'dim'], [i === 0 ? '0% dos reais' : `acumulado ${p}`, i <= k ? 'acc' : 'dim']); }); }
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
      o.on['k' + k] = s; o.rows['k' + k] = act(nm, `{${pr.join(', ')}}`, [lost === 2 ? 'sem serviço' : lost === 1 ? 'perdeu uma' : down.length ? 'nem notou' : 'duas células', lost === 2 ? 'bad' : lost ? 'acc' : 'hi']);
    });
    const users = {}; CLI.forEach(([nm, pr]) => pr.forEach(p => (users[p] = users[p] || []).push(nm.split('-')[0])));
    Object.entries(users).forEach(([p, us]) => { const g = G(p - 1), dn = down.includes(+p);
      T(o, [g.x + g.s / 2, g.y + g.s / 2, PL + 6 + g.s + 22], us.join(' · '), dn ? 'bad' : us.includes('lena') ? 'acc' : 'hi'); });
  }
  const repLine = (c, k) => { const tx = c.id === 'sp' ? 560 : 120 + (k - 1) * 130, yy = 100 + k * 4;
    return [[c.x + 29, CY + 31, PL + 6 + 26], [c.x + 29, yy, PL + 40], [tx, yy, PL + 40], [tx, 60, PL + 12]]; };
  function passives(o, st = 1) {
    show(o, 'pasSP', 'pasRio'); o.on.pasSP = 'ghost'; o.on.pasRio = 'ghost';
    o.rows.pasSP = act('passivas em SP', 'SOMBRAS', ['celula-rio · lag 300 ms', 'hi'], ['celula-recife · lag 800 ms', 'hi'], ['celula-mkt · lag 800 ms', 'hi']);
    o.rows.pasRio = act('passiva no Rio', 'SOMBRA', ['celula-sp · lag 300 ms', 'hi']);
  }

  // ── o que se vê em cada passo ──
  const POI = 'quantidade: 2147483648';
  const STEPS = {
    pilha: [
      { id: 'unica', dur: 5, title: 'A pilha única: uma versão serve todo mundo', yk: 'HOJE: UMA PILHA SÓ',
        code: ['30 pedidos/s na Black Friday', 'pedidos@2.6.0: 3 pods', 'estoque, pagamentos, Redis: um só', 'bulkheads do módulo 25: dentro da pilha', 'raio de qualquer defeito: 100%'],
        story: 'Depois do módulo 25 a loja tem anteparas dentro dos pools, mas continua sendo <b>uma pilha só</b>: um <code>pedidos</code> 2.6.0 com <b>3 pods</b>, um <code>estoque</code>, um banco e um Redis para todos os clientes. Na noite da Black Friday passam por ela <b>30 pedidos/s</b>. Se uma requisição derruba o <code>pedidos</code>, derruba para todo mundo.',
        look: 'A laje inteira é uma loja só: os 3 pods de pedidos no meio, o banco, o Redis e o tópico no fundo, e o gateway na porta.',
        key: 'Uma pilha compartilhada tem raio de 100%.',
        f(o) { uni(o); o.beams.push({ pts: uniPath(1), on: 1, flow: 3, sp: 0.3 });
          o.cnt = [['PEDIDOS/S', '30'], ['PODS DE PEDIDOS', '3', 'dim'], ['RAIO', '100%', 'dim']];
          o.res = [['uma pilha para todos', 'acc']]; } },
      { id: 'veneno', dur: 6, title: '20:25:00.000: o veneno do mkt-01', yk: 'POISON PILL', act: ['Mandar o veneno', 'quantidade: 2147483648'],
        code: ['POST /pedidos (robô do mkt-01)', 'quantidade: 2147483648 = 2³¹', 'não cabe num int32: panic na soma', 'gw-loja faz retry: até 3 tentativas', '3 pods × ~50 ms = 150 ms'],
        story: 'Às <b>20:25:00.000</b> o robô do <code>mkt-01</code> manda um <code>POST /pedidos</code> com um item de <code>quantidade: 2147483648</code>. É 2³¹, não cabe num <code>int32</code>, e o <code>pedidos</code> 2.6.0 dá <code>panic</code> ao somar o total. O <code>gw-loja</code> faz <i>retry</i> (até 3 tentativas, módulo 21) e a mesma requisição derruba <b>os 3 pods</b> em uns <b>150 ms</b>.',
        look: 'Em câmera lenta: a ficha vermelha grande entra pela porta e apaga um pod de cada vez.',
        key: 'Uma requisição envenenada que o retry espalha derruba todas as réplicas iguais.',
        f(o, t) { const down = i => t > 1.6 + i * 1.1; uni(o, i => down(i) ? 'bad' : 'on');
          [0, 1, 2].forEach(i => trip(o, uniPath(i), t, 0.3 + i * 1.1, 1.6 + i * 1.1, 'bad', 20));
          const n = [0, 1, 2].filter(down).length; if (n === 3) bad(o, 'uni');
          if (t < 4.2) T(o, [UNIPOD(Math.min(2, Math.floor(Math.max(0, t - 0.3) / 1.1)))[0] + 15, CY + 60, 90], POI, 'bad');
          o.cnt = [['PODS DE PÉ', String(3 - n), n === 3 ? 'bad' : ''], ['TEMPO', `${n * 50} ms`, 'dim'], ['TENTATIVA', `${Math.max(1, Math.min(3, n + 1))} de 3`, 'dim']];
          o.res = n === 3 ? [['3 pods no chão em 150 ms', 'bad']] : [['o retry espalha o veneno', 'dim']]; } },
      { id: 'retry', dur: 9, title: 'Cada pod volta em 30 s e cai de novo', yk: '30 PEDIDOS/S × 240 s',
        code: ['pod volta em 30 s (módulo 14)', 'o robô reenvia 1 vez por segundo', 'derruba de novo, sempre', 'bloquear a chave do mkt-01: 4 min', '30 × 240 = 7.200 tentativas falham'],
        story: 'Cada pod volta em <b>30 s</b> e o robô reenvia a mesma requisição 1 vez por segundo: os pods caem assim que sobem. Até alguém bloquear a chave do <code>mkt-01</code> passam <b>4 min</b> (exemplo), e <b>30 × 240 = 7.200 tentativas</b> recebem <code>503</code>. É 100% do tráfego, a Lena inclusa, e o <code>503</code> não consome número de pedido.',
        look: 'O contador sobe até 7.200; a ficha da Lena chega à porta e não passa.',
        key: 'Na pilha única, o defeito de um cliente vira a falha de todos.',
        f(o, t) { const s = lin(t, 0.3, 8.3, 0, 240), up = s % 30 > 28.5 && s < 239; uni(o, () => up ? 'on' : 'bad', ['503 para todos os clientes', 'bad']); bad(o, 'uni');
          o.pc.uni = { gw: 'bad', pg: 0, redis: 0, tube: 0 };
          trip(o, uniPath(1).slice(0, 3), (t % 3), 0.2, 1.6, 'acc', 12); if (t % 3 > 1.6) T(o, [UDOOR, CY + CD + 20, 60], 'Lena: 503', 'bad');
          o.beams.push({ pts: uniPath(0), on: 0, tone: 'bad', flow: 2, sp: 0.5 });
          o.cnt = [['FALHAS', thou(30 * s), 'bad'], ['TEMPO', `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`, 'dim'], ['RAIO', '100%', 'dim']];
          o.res = s >= 240 ? [['7.200 tentativas, 100% do tráfego', 'bad']] : [['os pods voltam e caem', 'dim']]; } },
      { id: 'celulas', dur: 5, title: 'Quatro células: a loja em quatro estandes', yk: 'CÉLULA = A PILHA INTEIRA', act: ['Dividir em células', '4 estandes'],
        code: ['celula-sp      33% · 9,9 pedidos/s', 'celula-rio     15% · 4,5', 'celula-recife  12% · 3,6', 'celula-mkt     40% · 12,0', 'cada uma: lb, gw, serviços, banco,', '  Redis e tópico próprios'],
        story: 'Agora a loja vira <b>quatro células</b>. Cada uma é a pilha inteira (o <code>lb</code>, o <code>gw</code>, os serviços, o PostgreSQL, o Redis e o tópico <code>pedidos</code>) e atende uma <b>parcela fixa</b> dos clientes: os de SP, os do Rio, os de Recife e, sozinho, o parceiro <code>mkt-01</code>. Na frente fica o <b>roteador</b>, que só escolhe a célula.',
        look: 'Quatro estandes com parede e uma porta só; a celula-mkt é a mais larga porque leva 40% dos pedidos.',
        key: 'A célula divide a pilha inteira, não só o banco ou o pool.',
        f(o) { cells(o); CELLS.forEach(c => o.pc[c.id] = { gw: 1, pg: 1, redis: 1, tube: 1 });
          o.cnt = [['CÉLULAS', '4'], ['PIOR CASO', '40%', 'dim'], ['VERSÃO', '@2.6.0', 'dim']];
          o.res = [['quatro pilhas inteiras', 'acc']]; } },
      { id: 'isolado', dur: 9, title: 'O mesmo veneno: só a celula-mkt apaga', yk: '12 PEDIDOS/S × 240 s', act: ['Mandar o veneno de novo', '20:25:00.000'],
        code: ['roteador lê o cliente_id do JWT', 'mkt-01 → celula-mkt', 'celula-mkt: 2 pods de pedidos (o piso)', '12 × 240 = 2.880 tentativas (40%)', 'pessoa física: 0 requisições perdidas'],
        story: 'O roteador lê o <code>cliente_id</code> do JWT (módulo 8) e manda o veneno para a <b><code>celula-mkt</code></b>. Os <b>2 pods</b> de <code>pedidos</code> dela caem e só ela fica fora: <b>12 × 240 = 2.880 tentativas</b> do parceiro falham, 40% do tráfego, dentro do SLA dele. Os 1,5 milhão de clientes pessoa física perdem <b>0</b> requisições.',
        look: 'A ficha vermelha passa pelo roteador e entra só na porta da celula-mkt; as outras três células continuam acesas.',
        key: 'A célula não impede o veneno; ela limita quem ele alcança.',
        f(o, t) { const hit = t > 2.2, s = lin(t, 2.4, 8.4, 0, 240);
          cells(o, { st: c => c.id === 'mkt' && hit ? 'bad' : 1, rows: c => c.id === 'mkt' && hit ? ['503 só para o parceiro', 'bad'] : [`${c.rate} pedidos/s · ${c.reg}`, 'dim'] });
          trip(o, [...routeP(CI.mkt), podTop(CI.mkt, 0)], t, 0.3, 2.2, 'bad', 20); if (t < 2.4) T(o, [RX + 120, 380, 80], POI, 'bad');
          if (hit) T(o, [doorX(CI.mkt) - 60, CY + 40, 90], `celula-mkt fora · ${thou(12 * s)}`, 'bad');
          o.cnt = [['FALHAS', thou(12 * s), hit ? 'bad' : ''], ['PESSOA FÍSICA', '0', 'dim'], ['RAIO', '40%', 'dim']];
          o.res = [[hit ? '2.880 só do parceiro' : 'o roteador lê o JWT', hit ? 'bad' : 'dim']]; } },
      { id: 'lena', dur: 6, title: 'Pedido 1060: a Lena compra às 20:25', yk: 'PEDIDO 1060 · celula-recife',
        code: ['2 gatos de pelúcia: 79,90 × 2 = 159,80', 'frete Recife: 15,00', 'total: 174,80 → 201', 'gato na rede: 19 → 17', 'alocação da celula-recife: 2 → 0', 'commit local: 2 ms (sem os 80 ms até SP)'],
        story: 'Na mesma hora do veneno, <b>20:25:00.000</b>, a Lena compra na <code>celula-recife</code>: <b>2 gatos de pelúcia</b> (159,80, presente para as duas sobrinhas) e frete de Recife 15,00. Total <b>174,80</b>, resposta <code>201</code>: o <b>pedido 1060</b>. Como a célula dela mora em Recife, o commit é local, <b>2 ms</b>, sem cruzar o país até SP.',
        look: 'A ficha da Lena entra pela porta da celula-recife e vai até o banco; ao lado, a celula-mkt segue apagada.',
        key: 'Enquanto o parceiro cai, a Lena compra sem perceber nada.',
        f(o, t) { cells(o, { st: c => c.id === 'mkt' ? 'bad' : 1, flow: false, rows: c => c.id === 'rec' && t > 3 ? ['1060 · 174,80 · 201', 'acc'] : c.id === 'mkt' ? ['503 só para o parceiro', 'bad'] : [`${c.rate} pedidos/s · ${c.reg}`, 'dim'] });
          o.pc.rec = { gw: 1, pg: t > 2.8 ? 1 : 0 };
          const path = [...routeP(CI.rec), podTop(CI.rec, 0), pgTop(CI.rec)]; trip(o, path, t, 0.3, 3, 'acc', 13);
          const p = alongPts(path, cumLen(path), ease(clamp((t - 0.3) / 2.7))); T(o, [p[0], p[1], p[2] + 28], t > 3 ? '1060 · 201' : 'Lena · 1060', 'acc');
          o.cnt = [['PEDIDO', '1060'], ['TOTAL', '174,80', 'dim'], ['RESPOSTA', t > 3 ? '201' : '…', 'dim']];
          o.res = [[t > 3 ? 'gato 19 → 17 · Recife 2 → 0' : 'commit local, 2 ms', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'E se der errado: um estoque global', yk: 'O CANAL OCULTO (MÓDULO 25)',
        code: ['as quatro células chamam o mesmo estoque', '  e o mesmo Redis', 'defeito nessa peça = defeito nas quatro', 'raio: 100% de novo'],
        story: 'Se as quatro células chamam o mesmo <code>estoque</code> e o mesmo Redis, qualquer defeito nessa peça (um <i>lock</i> preso, uma requisição envenenada que chega até ela, a carga do parceiro) vale para as quatro. O raio volta a <b>100%</b>: é o canal oculto do módulo 25, e o isolamento vira decoração.',
        look: 'Os quatro fios vão para o mesmo estoque, no fundo; quando ele fica vermelho, as quatro células apagam.',
        key: 'Uma peça compartilhada devolve o raio de 100%.',
        f(o, t) { const b = t > 2; cells(o, { st: () => b ? 'bad' : 1, flow: !b, rows: () => [b ? 'sem estoque: 503' : 'chama o estoque global', b ? 'bad' : 'dim'] });
          show(o, 'gEst'); o.on.gEst = b ? 'bad' : 1; o.rows.gEst = act('estoque global', 'COMPARTILHADO', ['um só para as 4 células', b ? 'bad' : 'hi'], [b ? 'caiu: raio 100%' : 'o canal oculto', b ? 'bad' : 'dim']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 120, CY + 60, PL + 26], [c.x + 120, 104 + k * 3, PL + 40], [330 + k * 80, 104 + k * 3, PL + 40], [330 + k * 80, 70, PL + 16]], on: b ? 0 : 1, tone: b ? 'bad' : '' }));
          o.cnt = [['RAIO', b ? '100%' : '…', b ? 'bad' : ''], ['PEÇA', 'estoque', 'dim'], ['CÉLULAS FORA', b ? '4 de 4' : '0 de 4', 'dim']];
          o.res = [[b ? 'o raio volta a 100%' : 'uma peça para todas', b ? 'bad' : 'dim']]; } },
    ],
    raio: [
      { id: 'fracao', dur: 5, title: 'O raio é a fração dos pedidos', yk: 'RAIO = FRAÇÃO DO TRÁFEGO',
        code: ['celula-mkt     40%', 'celula-sp      33%', 'celula-rio     15%', 'celula-recife  12%', 'soma          100%'],
        story: 'O raio de explosão de uma célula é a <b>fração dos pedidos</b> que passa por ela, e não 1 ÷ N. Na loja as quatro células têm <b>40 · 33 · 15 · 12%</b>. Se uma cai, perde-se a fatia dela, e a fatia maior é a do parceiro.',
        look: 'Cada célula ganha uma coluna da altura da sua fração; a da celula-mkt é a mais alta.',
        key: 'Cada célula responde pela fatia de tráfego que leva.',
        f(o) { cells(o, { pods: 0, routes: false, router: false }); CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); });
          o.cnt = [['PIOR CASO', '40%'], ['MÉDIA', '25%', 'dim'], ['CÉLULAS', '4', 'dim']];
          o.res = [['o pior caso é a celula-mkt', 'acc']]; } },
      { id: 'mix', dur: 5, title: 'De onde vêm 33, 15 e 12', yk: 'MIX 55/25/20 × 60%',
        code: ['mkt-01: 40% dos pedidos', 'pessoa física: os outros 60%', 'SP     55% × 60% = 33%', 'Rio    25% × 60% = 15%', 'Recife 20% × 60% = 12%'],
        story: 'O <code>mkt-01</code> sozinho faz <b>40%</b> dos pedidos (módulo 16). Os outros 60% são pessoa física, com o mix de cidades do módulo 22: <b>55 / 25 / 20</b>. Multiplicando: SP 33%, Rio 15%, Recife 12%. Cada cliente fica na célula da cidade dele: a Lena em Recife, a Bia e o Davi em SP, o Caio no Rio.',
        look: 'As três colunas de pessoa física somam 60%; a do parceiro, sozinha, 40%.',
        key: 'As frações saem do mix de cidades aplicado aos 60% de pessoa física.',
        f(o) { const MX = { sp: '55% × 60%', rio: '25% × 60%', rec: '20% × 60%', mkt: 'o parceiro' }, WHO = { sp: 'Bia · Davi', rio: 'Caio', rec: 'Lena', mkt: 'mkt-01' };
          cells(o, { pods: 0, routes: false, router: false, rows: c => [WHO[c.id], 'hi'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%\n${MX[c.id]}`, c.id === 'mkt' ? 'acc' : 'hi'); });
          o.cnt = [['PESSOA FÍSICA', '60%'], ['PARCEIRO', '40%', 'dim'], ['MIX', '55/25/20', 'dim']];
          o.res = [['33 + 15 + 12 = 60', 'acc']]; } },
      { id: 'regiao', dur: 5, title: 'Por que a celula-mkt mora em Recife', yk: 'NENHUMA REGIÃO ACIMA DE 52%',
        code: ['mkt em Recife: SP 33 · Rio 15 · Recife 52', 'mkt em SP:     SP 73%', 'mkt no Rio:    Rio 55%', 'a região que cair leva no máximo 52%'],
        story: 'A <code>celula-mkt</code> mora em <b>Recife</b>. Assim nenhuma região concentra mais de <b>52%</b> do tráfego (Recife: 12 + 40). Em SP seriam 73%; no Rio, 55%. A célula isola o software, mas a região continua sendo um domínio de falha acima dela.',
        look: 'As duas colunas da direita moram na mesma região: somadas, 52%.',
        key: 'Escolher onde a célula mora também limita o raio de uma região.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, rows: c => [`região: ${c.reg}`, c.reg === 'Recife' ? 'acc' : 'hi'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.reg === 'Recife' ? 'acc' : 'on'); });
          T(o, [CI.sp.x + 95, CY + 100, PL + 6 + 33 * 4 + 24], 'SP 33%', 'hi'); T(o, [CI.rio.x + 85, CY + 100, PL + 6 + 15 * 4 + 24], 'Rio 15%', 'hi');
          T(o, [610, CY + 100, PL + 6 + 40 * 4 + 30], 'Recife 12 + 40 = 52%', 'acc');
          o.cnt = [['RECIFE', '52%'], ['SE FOSSE SP', '73%', 'dim'], ['SE FOSSE RIO', '55%', 'dim']];
          o.res = [['nenhuma região acima de 52%', 'acc']]; } },
      { id: 'eficiencia', dur: 5, title: 'Pior caso 40%, eficiência 62,5%', yk: 'EFICIÊNCIA = 1 ÷ (N × MÁX.)',
        code: ['uniforme (1 ÷ 4): 25% cada', 'loja: pior caso 40%', '1 ÷ (4 × 0,40) = 62,5%', 'média 25%, mas vale o pior caso'],
        story: 'Com tráfego uniforme, 4 células dariam <b>25%</b> cada. A loja não é uniforme: o pior caso é <b>40%</b>, e a eficiência do isolamento é 1 ÷ (4 × 0,40) = <b>62,5%</b>. A média continua 25%, mas o incidente que importa é o da maior fatia.',
        look: 'A coluna fina ao lado de cada célula é a divisão uniforme, 25%; só a celula-mkt passa muito dela.',
        key: 'Planeje pelo pior caso, não pela média.',
        f(o) { cells(o, { pods: 0, routes: false, router: false });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on', -12); barOn(o, c, 25, 'dim', 40, 14); T(o, [c.x + c.w / 2 - 12, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); });
          T(o, [CI.mkt.x + 165, CY + 110, PL + 6 + 100 + 16], 'uniforme: 25%', 'dim');
          o.cnt = [['EFICIÊNCIA', '62,5%'], ['PIOR CASO', '40%', 'dim'], ['UNIFORME', '25%', 'dim']];
          o.res = [['1 ÷ (4 × 0,40) = 62,5%', 'acc']]; } },
      { id: 'semmkt', dur: 5, title: 'Sem o mkt-01 à parte: 55 · 25 · 20', yk: '3 CÉLULAS POR CIDADE',
        code: ['sem célula própria para o parceiro:', '  SP 55% · Rio 25% · Recife 20%', 'pior caso 55% (média 33,3%)', 'com a celula-mkt: pior caso 40%', 'pessoa física: raio do parceiro 100% → 0%'],
        story: 'Sem a célula própria do parceiro, seriam 3 células por cidade, com <b>55 · 25 · 20%</b>: pior caso <b>55%</b>, média 33,3%. Dar ao <code>mkt-01</code> a célula dele baixa o pior caso para 40% e, para a pessoa física, o raio de um defeito do parceiro cai de <b>100%</b> (pilha única) para <b>0%</b>.',
        look: 'A celula-mkt some e as três de cidade crescem: a de SP passa de 33% para 55%.',
        key: 'Separar o maior cliente é o que mais baixa o pior caso.',
        f(o) { const V = { sp: 55, rio: 25, rec: 20 };
          cells(o, { pods: 0, routes: false, router: false, hide: ['mkt'], rows: c => [`${V[c.id]}% sem a celula-mkt`, c.id === 'sp' ? 'bad' : 'hi'] });
          ['sp', 'rio', 'rec'].forEach(id => { const c = CI[id]; o.nopc[id] = 1; barOn(o, c, V[id], id === 'sp' ? 'bad' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + V[id] * 4 + 24], `${V[id]}%`, id === 'sp' ? 'bad' : 'hi'); });
          o.cnt = [['PIOR CASO', '55%', 'bad'], ['COM A CELULA-MKT', '40%', 'dim'], ['PESSOA FÍSICA', '100% → 0%', 'dim']];
          o.res = [['o parceiro na própria célula', 'acc']]; } },
      { id: 'sp2', dur: 5, title: 'SP em duas células', yk: '5 CÉLULAS', act: ['Dividir SP em duas', '33% → 16,5 + 16,5'],
        code: ['celula-sp-a 16,5% · celula-sp-b 16,5%', 'média: 100 ÷ 5 = 20%', 'pior caso: 40% (a celula-mkt)', 'eficiência: 1 ÷ (5 × 0,40) = 50%'],
        story: 'Dividir a <code>celula-sp</code> em duas de <b>16,5%</b> baixa a média para 20%, mas o pior caso continua <b>40%</b>: a fatia do parceiro não mudou. A eficiência até cai, para 1 ÷ (5 × 0,40) = <b>50%</b>. Mais células só ajudam quando a maior fatia diminui.',
        look: 'A coluna de SP vira duas mais baixas; a da celula-mkt fica onde estava.',
        key: 'O pior caso é a maior fatia, e dividir as pequenas não mexe nela.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, rows: c => c.id === 'sp' ? ['sp-a 16,5 · sp-b 16,5', 'acc'] : [`${c.rate} pedidos/s · ${c.reg}`, 'dim'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; if (c.id === 'sp') { barOn(o, c, 16.5, 'on', -36, 50); barOn(o, c, 16.5, 'on', 36, 50); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + 66 + 24], '16,5% + 16,5%', 'hi'); }
            else { barOn(o, c, c.frac, c.id === 'mkt' ? 'acc' : 'on'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + c.frac * 4 + 24], `${c.frac}%`, c.id === 'mkt' ? 'acc' : 'hi'); } });
          o.cnt = [['PIOR CASO', '40%'], ['MÉDIA', '20%', 'dim'], ['EFICIÊNCIA', '50%', 'dim']];
          o.res = [['o pior caso não se mexe', 'acc']]; } },
      { id: 'errado', dur: 5, title: 'E se der errado: planejar com 1 ÷ N', yk: 'A TABELA DO ARTIGO SUPÕE TRÁFEGO UNIFORME',
        code: ['tabela 1 ÷ N: 4 células = 25%', 'real: 40% na celula-mkt', '40 ÷ 25 = 1,6× o previsto', 'o raio é a maior fração, não 1 ÷ N'],
        story: 'A tabela de raio do artigo (1 ÷ N) diz que 4 células limitam o estrago a <b>25%</b>. Ela só vale com tráfego uniforme. Quem planejar com ela promete 25% e entrega <b>40%</b> no dia em que a <code>celula-mkt</code> cair: 1,6 vez o previsto.',
        look: 'A coluna da celula-mkt fica vermelha, bem acima da coluna fina dos 25% prometidos.',
        key: 'Planeje pelo pior caso medido, não pela divisão ideal.',
        f(o) { cells(o, { pods: 0, routes: false, router: false, st: c => c.id === 'mkt' ? 'bad' : 1 });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, c.frac, c.id === 'mkt' ? 'bad' : 'on', -12); barOn(o, c, 25, 'dim', 40, 14); });
          T(o, [CI.mkt.x + 113, CY + 100, PL + 6 + 160 + 24], 'real: 40%', 'bad'); T(o, [CI.mkt.x + 165, CY + 110, PL + 6 + 100 + 14], 'prometido: 25%', 'dim');
          o.cnt = [['REAL', '40%', 'bad'], ['PROMETIDO', '25%', 'dim'], ['ERRO', '1,6×', 'dim']];
          o.res = [['1 ÷ N só vale se for uniforme', 'bad']]; } },
    ],
    celula: [
      { id: 'dentro', dur: 5, title: 'Dentro da celula-recife: a pilha inteira', yk: 'celula-recife@2.6.0',
        code: ['lb + gw (a porta)', 'catalogo · carrinho · pedidos', 'pagamentos · estoque · entregas', 'PostgreSQL · Redis · tópico pedidos', '12% dos pedidos · 3,6 pedidos/s'],
        story: 'Por dentro, a <code>celula-recife</code> tem tudo o que a loja tinha: o <code>lb</code> e o <code>gw</code>, os serviços, o PostgreSQL, o Redis e o tópico <code>pedidos</code>. Ela tem <b>nome e versão</b> (<code>celula-recife@2.6.0</code>) e atende <b>12%</b> dos pedidos, 3,6 por segundo na Black Friday.',
        look: 'A célula aberta: o banco, o Redis e o tópico no fundo, os pods no meio e o gateway na porta.',
        key: 'Uma célula é uma cópia completa e independente da loja.',
        f(o) { openCell(o); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          o.cnt = [['FRAÇÃO', '12%'], ['PEDIDOS/S', '3,6', 'dim'], ['VERSÃO', '@2.6.0', 'dim']];
          o.res = [['a loja inteira, em tamanho menor', 'acc']]; } },
      { id: 'cinco', dur: 5, title: 'Cinco segmentações ao mesmo tempo', yk: 'ISOLAR EM 5 DIMENSÕES',
        code: ['execução: pods e CPU próprios', 'persistência: banco, Redis e tópico', 'observabilidade: métricas da célula', 'deploy: versão própria (@2.6.0)', 'falha: cai sem levar as outras'],
        story: 'A célula isola em <b>cinco dimensões ao mesmo tempo</b>: execução, persistência, observabilidade, deploy e falha. Isolar só o banco é um <i>shard</i> (módulo 16); só a CPU é um <i>bulkhead</i> (módulo 25). A célula só existe quando as cinco valem juntas.',
        look: 'As cinco camadas à direita acendem uma a uma; todas são fronteiras da mesma célula.',
        key: 'Shard isola dados, bulkhead isola recursos, célula isola a pilha.',
        f(o, t) { openCell(o); layers(o, i => t > 0.4 + i * 0.7 ? 1 : 0); depot(o, [6, 3, 2, 8], () => 'dim');
          const n = [0, 1, 2, 3, 4].filter(i => t > 0.4 + i * 0.7).length;
          o.cnt = [['DIMENSÕES', `${n} de 5`], ['SÓ O BANCO', 'shard', 'dim'], ['SÓ A CPU', 'bulkhead', 'dim']];
          o.res = [['as cinco juntas fazem a célula', 'acc']]; } },
      { id: 'porta', dur: 6, title: 'Uma porta só: o gateway', yk: 'TODA COMUNICAÇÃO EXTERNA PASSA PELO GW',
        code: ['entra: roteador → gw da célula', 'dentro: gw → pedidos → estoque → pg', 'ninguém dentro conhece ninguém de fora', 'entre células: só replicação passiva'],
        story: 'Toda comunicação externa passa pelo <b>gateway da célula</b>, a única porta. O <code>pedidos</code> de Recife não chama o <code>estoque</code> de SP; ele nem sabe que SP existe. O único dado que sai da célula é a <b>replicação passiva</b> para a cópia em outra região (aula 4).',
        look: 'A ficha do 1060 entra pela porta, passa pelo pedidos e pelo estoque e termina no banco, sem tocar a parede. O número do pedido e o trace_id vão com ela.',
        key: 'Uma porta só, e nada lá dentro conhece o lado de fora.',
        f(o, t) { openCell(o, { podSt: (g, i) => (g === 1 && t > 1.6 && t < 3) || (g === 3 && t > 2.6 && t < 4) ? 'new' : 'on' }); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          trip(o, openPath, t, 0.3, 4.2, 'acc', 13); const p = alongPts(openPath, cumLen(openPath), ease(clamp((t - 0.3) / 3.9)));
          T(o, [p[0], p[1], p[2] + 30], '1060 · trace_id', 'acc');
          o.cnt = [['PORTAS', '1'], ['PEDIDO', '1060', 'dim'], ['SAI DA CÉLULA', 'só replicação', 'dim']];
          o.res = [['gw → pedidos → estoque → pg', 'acc']]; } },
      { id: 'piso', dur: 5, title: 'O piso: 2 réplicas por serviço', yk: 'O CUSTO DO ISOLAMENTO',
        code: ['celula-recife (2027): 3 · 2 · 2 · 2 = 9 vCPU', 'estoque: 2 réplicas em cada célula', '4 células: 53 vCPU × 41 da pilha única', '+12 vCPU (+29,3%)', 'dia comum: 4 × 8 = 32 × 9 (3,6×)'],
        story: 'Uma célula não encolhe até zero: cada serviço precisa de <b>2 réplicas</b> no mínimo, para sobreviver à queda de um pod. No plano de 2027 a <code>celula-recife</code> leva 3 · 2 · 2 · 2 = <b>9 vCPU</b>, e as quatro células somam <b>53</b> contra 41 da pilha única (+29,3%). No dia comum, 32 contra 9: <b>3,6×</b>.',
        look: 'Cada grupo tem pelo menos dois cubos; o estoque, que na pilha única tinha 2 para todos, agora tem 2 em cada célula.',
        key: 'O piso por célula é o preço do isolamento.',
        f(o) { openCell(o, { podSt: (g) => g === 3 ? 'new' : 'on', row: ['9 vCPU no plano de 2027', 'acc'] }); layers(o, () => 0); depot(o, [6, 3, 2, 8], () => 'dim');
          o.cnt = [['vCPU', '53'], ['PILHA ÚNICA', '41', 'dim'], ['DIA COMUM', '32 × 9', 'dim']];
          o.res = [['+12 vCPU (+29,3%)', 'acc']]; } },
      { id: 'gato', dur: 6, title: 'O último gato: Recife vai de 2 a 0', yk: 'GATO: 19 = 6 · 3 · 2 · 8', act: ['Último gato', 'o 1060 leva 2'],
        code: ['alocação proporcional à demanda:', '  sp 6 · rio 3 · recife 2 · mkt 8', '1060: a Lena leva 2 gatos', 'celula-recife: 2 → 0', 'rede: 19 → 17'],
        story: 'Um gato é um objeto num depósito, e o <code>estoque</code> também mora na célula. Os <b>19</b> gatos foram alocados pela demanda: <b>6 · 3 · 2 · 8</b> (sp, rio, recife, mkt). O pedido 1060 leva os <b>2</b> da <code>celula-recife</code>: ela vai a <b>0</b>, e a rede, a 17.',
        look: 'Na estante, os dois cubos de Recife se apagam quando a ficha do 1060 passa pelo estoque.',
        key: 'Estoque físico precisa ser dividido entre as células.',
        f(o, t) { const sold = t > 2.4; openCell(o, { podSt: g => g === 3 && t > 1.8 && t < 3 ? 'new' : 'on' }); layers(o, () => 0);
          depot(o, sold ? [6, 3, 0, 8] : [6, 3, 2, 8], () => 'on'); if (sold) o.on.depo = 1;
          if (sold) [0, 1].forEach(i => { const [x, y] = gatoPos(2, i); o.fleet.push({ x, y, s: 16, st: 'ghost', lab: '' }); });
          trip(o, openPath.slice(0, 4), t, 0.3, 2.4, 'acc', 13);
          T(o, [gatoPos(2, 0)[0] + 20, 245, 60], sold ? 'recife: 2 → 0' : 'recife: 2', sold ? 'bad' : 'acc');
          o.cnt = [['RECIFE', sold ? '0' : '2', sold ? 'bad' : ''], ['NA REDE', sold ? '17' : '19', 'dim'], ['PEDIDO', '1060', 'dim']];
          o.res = [[sold ? 'a célula de Recife zerou' : 'alocado pela demanda', sold ? 'bad' : 'acc']]; } },
      { id: 'deploy', dur: 7, title: 'Deploy por célula: 0 → 12 → 27 → 60 → 100%', yk: 'ANÉIS DE EXPOSIÇÃO',
        code: ['célula zero: sint-01…03 (0% reais)', 'celula-recife: 12%', '+ celula-rio: 27%', '+ celula-sp: 60%', '+ celula-mkt: 100%'],
        story: 'Os anéis de deploy do módulo 22 agora são <b>células</b>. A versão nova vai primeiro para a <b>célula zero</b>, sintética, com clientes de teste (<code>sint-01…03</code>) de CEPs de SP, Rio e Recife. Depois <code>celula-recife</code> (12%), Rio (27% acumulado), SP (60%) e, por último, o parceiro (100%).',
        look: 'Os cinco anéis na frente acendem um de cada vez, com a exposição acumulada.',
        key: 'Cada célula é um anel de deploy com nome e versão.',
        f(o, t) { const k = Math.min(4, Math.floor(Math.max(0, t - 0.3) / 1.3)); openCell(o); layers(o, i => i === 3 ? 1 : 0); depot(o, [6, 3, 0, 8], () => 'dim'); rings(o, k);
          o.cnt = [['EXPOSIÇÃO', RINGS[k][2]], ['ANEL', RINGS[k][0], 'dim'], ['ANÉIS', '5', 'dim']];
          o.res = [['uma célula de cada vez', 'acc']]; } },
      { id: 'zero', dur: 5, title: 'A célula zero acha o frete 0,00', yk: 'A ARMADILHA DO ANEL REGIONAL',
        code: ['2.5.0 (módulo 22): frete 0,00 em Recife', '1º anel real: celula-recife (12%)', '  = 100% dos clientes de Recife', 'célula zero com CEP de Recife:', '  frete_zero = 1 pedido sintético', '  perda: R$ 0'],
        story: 'O anel regional tem uma armadilha. A versão 2.5.0 do módulo 22 dava <b>frete 0,00 em Recife</b>: no 1º anel real ela pegaria só 12% do tráfego, mas <b>100%</b> dos clientes de Recife. Quem protege é a célula zero com CEP de Recife, que acha o defeito com <b>1 pedido sintético</b> e perda de <b>R$ 0</b>.',
        look: 'A célula zero fica vermelha e o deploy para ali; o anel da celula-recife não chega a acender.',
        key: 'Uma célula regional concentra os defeitos regionais; teste antes na célula zero.',
        f(o) { openCell(o); layers(o, i => i === 3 ? 1 : 0); depot(o, [6, 3, 0, 8], () => 'dim'); rings(o, 0, true);
          o.rows.r0 = act('célula zero', 'PAROU', ['frete_zero = 1', 'bad'], ['perda: R$ 0', 'acc']);
          T(o, [40 + 77, 360, 60], 'CEP de Recife: frete 0,00', 'bad');
          o.cnt = [['PERDA', 'R$ 0'], ['ALERTA', 'frete_zero = 1', 'dim'], ['SEM ELA', '100% de Recife', 'dim']];
          o.res = [['o defeito para na célula zero', 'acc']]; } },
      { id: 'errado', dur: 8, title: 'E se der errado: esgotado com 17 gatos na rede', yk: 'O ÚLTIMO GATO',
        code: ['próximo cliente de Recife: "esgotado"', 'na rede: sp 6 · rio 3 · mkt 8 = 17', '(a) aceitar o esgotado local', '(b) rebalancear: 2 de SP → Recife', '(c) reservar entre células (saga)', 'adotado: (b), abaixo de 20% da alocação'],
        story: 'O próximo cliente de Recife vê <b>"esgotado"</b>, com <b>17</b> gatos na rede. Há três saídas: aceitar o esgotado local (consistente, perde a venda); <b>rebalancear</b>, com o plano de controle movendo 2 unidades de SP para Recife em segundos, fora do caminho do pedido (a escolhida, com gatilho abaixo de 20% da alocação); ou reservar entre células por saga, que acopla duas células no caminho crítico. Um <code>estoque</code> global acaba com o problema e devolve o raio de 100%.',
        look: 'Recife fica vazia e vermelha; depois dois cubos de SP atravessam a estante até Recife.',
        key: 'Rebalancear fora do caminho do pedido mantém a célula isolada.',
        f(o, t) { const mv = clamp((t - 3) / 2.2), done = mv >= 1; openCell(o, { row: [done ? 'estoque: 2 de novo' : 'esgotado (17 na rede)', done ? 'acc' : 'bad'] }); layers(o, () => 0);
          const ex = [0, 1].map(i => { const a = gatoPos(0, 4 + i), b = gatoPos(2, i), e = ease(mv); return { x: a[0] + (b[0] - a[0]) * e, y: a[1] + (b[1] - a[1]) * e, s: 16, st: 'new', lab: '' }; });
          depot(o, [4, 3, 0, 8], () => 'on', t > 3 ? ex : []); if (t <= 3) { [4, 5].forEach(i => { const [x, y] = gatoPos(0, i); o.fleet.push({ x, y, s: 16, st: 'on', lab: '' }); }); }
          o.rows.depo = act(done ? 'gato · rebalanceado' : 'gato · 17 na rede', 'PLANO DE CONTROLE');
          o.rows.depo.labs = DG.map(([nm, lx, cols], g) => { const n = done ? [4, 3, 2, 8][g] : t > 3 ? [4, 3, 0, 8][g] : [6, 3, 0, 8][g]; return [lx + cols * 10.5 - 2, 100, `${nm} ${n}`, n ? 'hi' : 'bad', 12]; });
          o.on.depo = done ? 1 : 'bad';
          if (!done) T(o, [OPEN_DOOR, 300, 70], 'Recife: esgotado', 'bad');
          o.cnt = [['RECIFE', done ? '2' : '0', done ? '' : 'bad'], ['NA REDE', '17', 'dim'], ['SAÍDA', '(b) rebalancear', 'dim']];
          o.res = [[done ? '2 de SP → Recife' : 'esgotado com 17 na rede', done ? 'acc' : 'bad']]; } },
    ],
    roteador: [
      { id: 'fino', dur: 5, title: 'O roteador fino: lê a chave e escolhe', yk: 'edge-loja',
        code: ['chave: cliente_id do JWT (módulo 8)', 'mapa-v42: cliente_id → célula', '1,5 milhão × ~100 B = 150 MB', 'lena-77 → celula-recife', 'roteador 99,99% × célula 99,9% = 99,89%'],
        story: 'O roteador é a parte compartilhada que sobra, e por isso precisa ser <b>fino</b>: lê o <code>cliente_id</code> do JWT, consulta o mapa e encaminha. O mapa (<code>mapa-v42</code>) é uma tabela de <b>150 MB</b> (1,5 milhão de clientes × ~100 B). Em série, roteador a 99,99% e célula a 99,9% dão <b>99,89%</b>: o roteador é o teto de todas.',
        look: 'A ficha da Lena para no roteador, que acha lena-77 → celula-recife, e segue para a porta certa.',
        key: 'O roteador só roteia; qualquer lógica a mais é risco compartilhado.',
        f(o, t) { cells(o, { flow: false }); o.rows.router = act('edge-loja', 'ROTEADOR', ['mapa-v42 · 150 MB', 'hi'], ['lena-77 → celula-recife', t > 1.2 ? 'acc' : 'dim']);
          o.beams.forEach(b => b.on = 0); o.beams[2].on = t > 1.2 ? 1 : 0;
          trip(o, [...routeP(CI.rec), podTop(CI.rec, 0)], t, 0.3, 3, 'acc', 13); T(o, [RX, 400, 70], 'lena-77', 'acc');
          o.cnt = [['MAPA', '150 MB'], ['DISPONIBILIDADE', '99,89%', 'dim'], ['VERSÃO', 'mapa-v42', 'dim']];
          o.res = [['o roteador é o teto', 'acc']]; } },
      { id: 'chave', dur: 5, title: 'A mesma chave, a mesma célula', yk: 'DETERMINÍSTICO',
        code: ['lena-77 → celula-recife', 'bia-31  → celula-sp', 'davi-12 → celula-sp', 'caio-58 → celula-rio', 'mkt-01  → celula-mkt'],
        story: 'O roteamento é <b>determinístico</b>: a mesma chave cai sempre na mesma célula, hoje e amanhã. Quem muda o mapa é o <b>plano de controle</b> (colocação e migração), fora do caminho do pedido. O roteador só lê.',
        look: 'Cinco fichas, cinco clientes, cada uma para a porta da sua célula.',
        key: 'Chave estável, célula estável.',
        f(o, t) { cells(o, { flow: false }); o.beams.forEach(b => b.on = 1);
          [['rec', 'acc'], ['sp', 'gr'], ['sp', 'gr'], ['rio', 'gr'], ['mkt', 'gr']].forEach(([id, tn], i) => trip(o, [...routeP(CI[id]), podTop(CI[id], i === 2 ? 1 : 0)], (t + i * 0.7) % 3.6, 0.1, 2.6, tn, tn === 'acc' ? 13 : 10));
          CELLS.forEach(c => T(o, [doorX(c), CY + CD + 4, 64], { sp: 'bia-31 · davi-12', rio: 'caio-58', rec: 'lena-77', mkt: 'mkt-01' }[c.id], c.id === 'rec' ? 'acc' : 'hi'));
          o.cnt = [['CLIENTES', '5'], ['MUDAM SOZINHOS', '0', 'dim'], ['QUEM MUDA O MAPA', 'plano de controle', 'dim']];
          o.res = [['chave estável, célula estável', 'acc']]; } },
      { id: 'modn', dur: 6, title: 'mod N: a 5ª célula move 80,1%', yk: 'hash(cliente_id) mod N', act: ['+ 1 célula', '4 → 5 com mod N'],
        code: ['4 → 5 células', 'mod N: 80,1% das chaves mudam', '  (simulação com 100.000 chaves)', 'cada uma leva os dados junto', '= rehash storm'],
        story: 'Com <code>hash(cliente_id) mod N</code>, ir de 4 para 5 células muda a célula de <b>80,1%</b> das chaves (simulação com 100.000 chaves). Cada cliente que muda leva os dados junto. É um <i>rehash storm</i>; o hash aparece aqui só para mostrar o que evitar.',
        look: 'A 5ª célula aparece no fundo e quase todas as fichas trocam de porta.',
        key: 'mod N espalha bem e migra quase tudo quando N muda.',
        f(o, t) { const v = lin(t, 0.8, 3.8, 0, 80.1); cells(o, { st: () => 'bad', flow: false, rows: () => ['80% dos clientes mudam', 'bad'] });
          o.rows.router = act('edge-loja', 'mod 5', ['hash(cliente_id) mod 5', 'bad'], ['era mod 4', 'dim']); o.on.router = 'bad';
          show(o, 'c5'); o.on.c5 = 1; o.rows.c5 = act('celula-5 (nova)', 'N = 5', ['recebe chaves de todas', 'hi']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 150, CY + 60, PL + 28], [c.x + 150, 106 + k * 3, PL + 40], [520 + k * 70, 106 + k * 3, PL + 40], [520 + k * 70, 70, PL + 14]], on: 0, tone: 'bad', flow: 1, sp: 0.5 }));
          o.cnt = [['MUDARAM', dec(v, 1) + '%', 'bad'], ['MÉTODO', 'mod N', 'dim'], ['N', '4 → 5', 'dim']];
          o.res = [['rehash storm', 'bad']]; } },
      { id: 'anel', dur: 5, title: 'O anel: ~19,7%', yk: 'HASH CONSISTENTE',
        code: ['4 → 5 células', 'anel (100 pontos por célula): ~19,7%', '  teoria: 1 ÷ (N + 1) = 1 ÷ 5 = 20%', 'módulo 16 mediu 25,7% de 3 → 4', 'menos, mas quem escolhe é o hash'],
        story: 'Com o <b>anel</b> (hash consistente, módulo 16) só as chaves do arco que a célula nova assume mudam: <b>~19,7%</b> com 100 pontos por célula, perto da teoria, 1 ÷ (N + 1) = 20%. É bem menos que 80%, mas quem decide quem muda é o hash, não você.',
        look: 'Só um fio por célula vai para a 5ª; o contador para perto de 20%.',
        key: 'O anel move pouco, mas não deixa você escolher quem.',
        f(o, t) { const v = lin(t, 0.8, 3.2, 0, 19.7); cells(o, { flow: false, rows: () => ['~20% mudam', 'acc'] });
          o.rows.router = act('edge-loja', 'ANEL', ['anel · 100 pontos por célula', 'hi'], ['N = 5', 'dim']);
          show(o, 'c5'); o.on.c5 = 1; o.rows.c5 = act('celula-5 (nova)', 'N = 5', ['um arco de cada célula', 'hi']);
          CELLS.forEach((c, k) => o.beams.push({ pts: [[c.x + 150, CY + 60, PL + 28], [c.x + 150, 106 + k * 3, PL + 40], [520 + k * 70, 106 + k * 3, PL + 40], [520 + k * 70, 70, PL + 14]], on: 1, flow: 1, sp: 0.3 }));
          o.cnt = [['MUDARAM', '~' + dec(v, 1) + '%'], ['MÉTODO', 'anel', 'dim'], ['MOD N', '80,1%', 'dim']];
          o.res = [['~19,7% contra 80,1%', 'acc']]; } },
      { id: 'tabela', dur: 5, title: 'A tabela: só muda quem você mover', yk: 'MAPA CADASTRAL',
        code: ['4 → 5 células: ninguém muda sozinho', 'mover o mkt-01: 20M linhas × 2 KB = 40 GB', '40 GB a 50 MB/s = 800 s = 13 min 20 s', 'copiar, aplicar o que chegou, virar o mapa'],
        story: 'Com a <b>tabela cadastral</b>, adicionar a 5ª célula não move ninguém: só muda quem o plano de controle mover. Mover o <code>mkt-01</code> são 20 milhões de linhas × 2 KB = <b>40 GB</b>; a 50 MB/s, <b>13 min 20 s</b>: copiar, aplicar o que chegou durante a cópia e virar o mapa.',
        look: 'A 5ª célula fica vazia esperando; nenhum fio sai das quatro.',
        key: 'Com a tabela, mover cliente é uma decisão, não um efeito colateral.',
        f(o, t) { cells(o); o.rows.router = act('edge-loja', 'TABELA', ['mapa-v42 · 150 MB', 'hi'], ['nada muda sozinho', 'acc']);
          show(o, 'c5'); o.on.c5 = 'ghost'; o.rows.c5 = act('celula-5 (nova)', 'VAZIA', ['espera a colocação', 'hi'], ['mover o mkt-01: 13 min 20 s', 'dim']);
          o.cnt = [['MUDARAM', '0%'], ['MOVER O MKT-01', '13 min 20 s', 'dim'], ['DADOS', '40 GB', 'dim']];
          o.res = [['só muda quem você mover', 'acc']]; } },
      { id: 'borda', dur: 6, title: 'Edge cells: três bordas com o mapa na memória', yk: 'ESTABILIDADE ESTÁTICA',
        code: ['3 bordas regionais: SP, Rio, Recife', 'cada uma com o mapa-v42 na memória', 'o plano de controle publica o mapa', 'se ele cai: as bordas seguem', '  com o último mapa'],
        story: 'O roteador roda em <b>três bordas</b> regionais (<i>edge cells</i>), cada uma com o <code>mapa-v42</code> inteiro na memória. O plano de controle publica o mapa, mas não está no caminho do pedido: se ele cai, as bordas continuam com o <b>último mapa</b>. Isso é <b>estabilidade estática</b>.',
        look: 'O plano de controle, no fundo, fica vermelho; as três bordas, na frente, continuam acesas e roteando.',
        key: 'O plano de controle pode cair; o caminho do pedido não depende dele.',
        f(o, t) { const dn = t > 2.4; cells(o, { router: false, routes: false });
          [['eSP', 'borda SP', 'sp'], ['eRio', 'borda Rio', 'rio'], ['eRec', 'borda Recife', 'rec']].forEach(([nm, lab, id]) => { show(o, nm); lit(o, nm); o.rows[nm] = act(lab, 'EDGE', ['mapa-v42 na memória', 'hi'], [dn ? 'segue com o último mapa' : '150 MB', dn ? 'acc' : 'dim']);
            const b = B[nm], cx = b.pos[0] + b.w / 2; o.beams.push({ pts: [[cx, 360, Z + 6], [cx, 342, Z + 6], [doorX(CI[id]), 342, Z + 6], [doorX(CI[id]), CY + CD - 14, Z + 6]], on: 1, flow: 1, sp: 0.3 }); });
          show(o, 'ctrl'); o.on.ctrl = dn ? 'bad' : 1; o.rows.ctrl = act('plano de controle', 'FORA DO CAMINHO', ['publica mapa-v42', dn ? 'dim' : 'hi'], [dn ? 'caiu' : 'colocação · migração', dn ? 'bad' : 'dim']);
          o.cnt = [['BORDAS DE PÉ', '3'], ['PLANO DE CONTROLE', dn ? 'fora' : 'de pé', dn ? 'bad' : 'dim'], ['PEDIDOS', 'seguem', 'dim']];
          o.res = [[dn ? 'as bordas nem notam' : 'o mapa fica na memória', 'acc']]; } },
      { id: 'psp', dur: 6, title: 'O webhook do PSP entra pela borda', yk: 'CÉLULA ASSÍNCRONA',
        code: ['cobrança c-7733 criada na celula-sp', 'referência: celula=sp', 'PSP → webhook → consumidor de borda', 'republica no tópico da celula-sp', 'o backlog fica dentro da célula'],
        story: 'Nem tudo chega com JWT. O PSP chama o <b>webhook</b> do Pix sem saber de células, então a cobrança leva a célula na referência: <code>c-7733</code> carrega <code>celula=sp</code>. O consumidor de borda lê esse campo e republica no tópico da <code>celula-sp</code>; o <i>backlog</i> fica dentro dela.',
        look: 'A ficha do webhook desce do PSP, para na borda de SP e entra na celula-sp pelo tópico.',
        key: 'O que não tem JWT carrega a célula na própria referência.',
        f(o, t) { cells(o, { router: false, routes: false, flow: false }); o.pc.sp = { gw: 1, tube: t > 3.2 ? 1 : 0 };
          [['eSP', 'borda SP'], ['eRio', 'borda Rio'], ['eRec', 'borda Recife']].forEach(([nm, lab]) => { show(o, nm); lit(o, nm); o.rows[nm] = act(lab, 'EDGE', ['mapa-v42 na memória', 'hi'], [nm === 'eSP' ? 'consumidor de borda' : '150 MB', nm === 'eSP' ? 'acc' : 'dim']); });
          show(o, 'psp'); lit(o, 'psp'); o.rows.psp = act('PSP (Pix)', 'EXTERNO', ['webhook c-7733', 'hi'], ['referência: celula=sp', 'acc']);
          const path = [[667, 60, PL + 20], [667, 60, 120], [165, 390, 120], [165, 390, PL + 22], [165, 342, Z + 6], [doorX(CI.sp), 342, Z + 6], [doorX(CI.sp), CY + CD - 14, Z + 6], [CI.sp.x + 140, CY + 30, PL + 6 + 16]];
          o.beams.push({ pts: path, on: 1 }); trip(o, path, t, 0.3, 3.2, 'acc', 12);
          const p = alongPts(path, cumLen(path), ease(clamp((t - 0.3) / 2.9))); T(o, [p[0], p[1], p[2] + 26], 'c-7733 · celula=sp', 'acc');
          o.cnt = [['COBRANÇA', 'c-7733'], ['CÉLULA', 'celula=sp', 'dim'], ['BACKLOG', 'na célula', 'dim']];
          o.res = [['a referência leva a célula', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'E se der errado: o mapa-v43 em todas as bordas', yk: 'O MAPA TAMBÉM É COMPARTILHADO',
        code: ['mapa-v43: bia-31 → celula-xx', 'publicado nas 3 bordas de uma vez', 'célula que não existe: o raio é o do mapa', 'conserto: validar o mapa antes', '  publicar uma borda por vez (anéis)', '  manter o último mapa bom'],
        story: 'O mapa também é uma peça compartilhada. Um <code>mapa-v43</code> ruim (<code>bia-31 → celula-xx</code>, uma célula que não existe) publicado nas três bordas de uma vez erra o destino em todas: o raio volta a <b>100%</b>. O conserto: <b>validar</b> o mapa antes, publicar <b>uma borda por vez</b>, como um anel de deploy, e manter o <b>último mapa bom</b> para voltar.',
        look: 'O plano de controle publica o mapa-v43 e as três bordas ficam vermelhas juntas.',
        key: 'Configuração global se publica em anéis, como código.',
        f(o, t) { const b = t > 1.8; cells(o, { router: false, routes: false, flow: !b });
          [['eSP', 'borda SP'], ['eRio', 'borda Rio'], ['eRec', 'borda Recife']].forEach(([nm, lab], k) => { show(o, nm); o.on[nm] = b ? 'bad' : 1; o.rows[nm] = act(lab, 'EDGE', [b ? 'mapa-v43' : 'mapa-v42', b ? 'bad' : 'hi'], [b ? 'bia-31 → celula-xx' : '150 MB', b ? 'bad' : 'dim']);
            const bk = B[nm], cx = bk.pos[0] + bk.w / 2; o.beams.push({ pts: [[240, 60, PL + 24], [240, 60, 110], [cx, 390, 110], [cx, 390, PL + 22]], on: 0, tone: t > 0.6 ? 'bad' : '', flow: t > 0.6 && !b ? 1 : 0, sp: 0.6 }); });
          show(o, 'ctrl'); o.on.ctrl = 'bad'; o.rows.ctrl = act('plano de controle', 'PUBLICA', ['mapa-v43 · nas 3 de uma vez', 'bad'], ['sem validação', 'bad']);
          o.cnt = [['RAIO', b ? '100%' : '…', 'bad'], ['MAPA', 'mapa-v43', 'dim'], ['BORDAS', b ? '3 de 3' : '…', 'dim']];
          o.res = [['validar · anéis · último mapa bom', b ? 'bad' : 'dim']]; } },
    ],
    assincrono: [
      { id: 'compart', dur: 5, title: 'Um tópico compartilhado: 120 eventos/s', yk: 'TÓPICO pedidos (MÓDULO 13)',
        code: ['30 pedidos/s × 4 eventos = 120 eventos/s', '3 partições: 40 eventos/s cada', 'os consumidores de todas as células', '  leem o mesmo tópico'],
        story: 'No caminho assíncrono, imagine as células publicando num tópico <code>pedidos</code> <b>compartilhado</b>: 3 partições, 4 eventos por pedido, 30 pedidos/s = <b>120 eventos/s</b>, 40 por partição (módulo 13).',
        look: 'As quatro células despejam eventos no mesmo tópico, na frente.',
        key: 'Um tópico compartilhado é uma pilha única no caminho assíncrono.',
        f(o) { cells(o, { router: false, routes: false }); shared(o, 0);
          o.cnt = [['EVENTOS/S', '120'], ['POR PARTIÇÃO', '40', 'dim'], ['PARTIÇÕES', '3', 'dim']];
          o.res = [['um tópico para todas', 'acc']]; } },
      { id: 'trava', dur: 9, title: 'O veneno trava a partição: 24.000 presos', yk: '40 EVENTOS/S × 600 s', act: ['Publicar o veneno', 'evento do mkt-01'],
        code: ['o consumidor cai ao desserializar', '  antes de ler a política de DLQ', 'a partição trava atrás do veneno', '10 min: 40 × 600 = 24.000 eventos', '60% de pessoa física: 14.400'],
        story: 'O evento do veneno derruba o consumidor <b>ao desserializar</b>, antes de ele ler a política de DLQ. A partição <b>trava</b>: em 10 min ficam <b>24.000</b> eventos presos atrás dele (40 × 600), e <b>60% (14.400)</b> são de clientes pessoa física. O <code>PedidoPago</code> da Lena está nessa fila.',
        look: 'A pilha vermelha cresce em cima da partição travada; o contador chega a 24.000.',
        key: 'No tópico compartilhado o veneno do parceiro atrasa a pessoa física.',
        f(o, t) { const s = lin(t, 1.2, 8.2, 0, 600); cells(o, { router: false, routes: false }); shared(o, s);
          trip(o, [[CI.mkt.x + 125, CY + 40, PL + 40], [CI.mkt.x + 125, 400, PL + 40], [305, 400, PL + 24]], t, 0.2, 1.2, 'bad', 18);
          o.cnt = [['PRESOS', thou(40 * s), 'bad'], ['PESSOA FÍSICA', thou(24 * s), 'dim'], ['TEMPO', `${Math.floor(s / 60)} min`, 'dim']];
          o.res = [[s >= 600 ? '14.400 de pessoa física' : 'a partição travou', 'bad']]; } },
      { id: 'porcelula', dur: 5, title: 'Um tópico por célula', yk: 'pedidos.sp · .rio · .recife · .mkt',
        code: ['cada célula publica no seu tópico', 'pedidos.mkt: 12 × 4 ÷ 3 = 16 eventos/s', '  por partição', 'consumidores também por célula'],
        story: 'Com <b>tópicos por célula</b>, cada célula publica e consome o seu: <code>pedidos.sp</code>, <code>.rio</code>, <code>.recife</code>, <code>.mkt</code>. O tópico do parceiro recebe 12 pedidos/s × 4 eventos ÷ 3 partições = <b>16 eventos/s por partição</b>.',
        look: 'O tópico da frente some; acendem os tubos dentro de cada célula.',
        key: 'Cada célula tem o seu tópico e o seu consumidor.',
        f(o) { cells(o, { router: false, routes: false, rows: c => [`pedidos.${c.id === 'rec' ? 'recife' : c.id}`, 'acc'] }); CELLS.forEach(c => o.pc[c.id] = { gw: 1, tube: 1 }); edgeCons(o);
          o.cnt = [['TÓPICOS', '4'], ['MKT POR PARTIÇÃO', '16/s', 'dim'], ['COMPARTILHADO', 'nenhum', 'dim']];
          o.res = [['o backlog fica na célula', 'acc']]; } },
      { id: 'isolado', dur: 9, title: 'O veneno trava só pedidos.mkt: 9.600', yk: '16 EVENTOS/S × 600 s', act: ['Publicar o veneno de novo', 'em pedidos.mkt'],
        code: ['partição travada em pedidos.mkt', '10 min: 16 × 600 = 9.600 eventos', 'todos do parceiro', 'sp, rio, recife: atraso 0'],
        story: 'O mesmo veneno agora trava uma partição de <code>pedidos.mkt</code>: <b>9.600</b> eventos presos em 10 min, <b>todos do parceiro</b>. As outras três células seguem com atraso <b>0</b>, e o <code>PedidoPago</code> da Lena passa na hora.',
        look: 'A pilha vermelha cresce só em cima do tópico da celula-mkt.',
        key: 'O backlog do veneno fica preso dentro da célula do parceiro.',
        f(o, t) { const s = lin(t, 1.2, 8.2, 0, 600); cells(o, { router: false, routes: false, st: c => c.id === 'mkt' && t > 1.2 ? 'bad' : 1, rows: c => c.id === 'mkt' ? ['pedidos.mkt travado', 'bad'] : ['atraso 0', 'acc'] });
          CELLS.forEach(c => o.pc[c.id] = { gw: c.id === 'mkt' && t > 1.2 ? 'bad' : 1, tube: c.id === 'mkt' && t > 1.2 ? 'bad' : 1 }); edgeCons(o);
          if (s > 0) o.piles.push({ p: [CI.mkt.x + 96 + (CI.mkt.w - 110) / 2, CY + 30, PL + 6 + 10], f: s / 600, v: 16 * s });
          o.cnt = [['PRESOS', thou(16 * s), s ? 'bad' : ''], ['PESSOA FÍSICA', '0', 'dim'], ['ANTES', '24.000', 'dim']];
          o.res = [['9.600, todos do parceiro', 'bad']]; } },
      { id: 'errado', dur: 6, title: 'E se der errado: a borda abre o evento', yk: 'A BORDA PRECISA SER FINA',
        code: ['webhooks entram por um consumidor de borda', 'se ele desserializa o corpo inteiro,', '  um evento ruim derruba a borda', '  e para a entrada de todas as células', 'conserto: ler só a referência (celula=…)'],
        story: 'O caminho assíncrono também tem uma parte compartilhada: o <b>consumidor de borda</b>, que recebe os webhooks e republica no tópico de cada célula. Se ele desserializa o corpo inteiro, um evento ruim derruba a borda e para a entrada de <b>todas</b> as células. A borda só deve ler a referência (<code>celula=…</code>) e repassar, como o roteador.',
        look: 'O consumidor de borda fica vermelho e os quatro fios que saem dele apagam.',
        key: 'A borda assíncrona tem a mesma regra do roteador: fina.',
        f(o, t) { const b = t > 2; cells(o, { router: false, routes: false, flow: false }); CELLS.forEach(c => o.pc[c.id] = { gw: 1, tube: b ? 0 : 1 }); edgeCons(o, b);
          trip(o, [[727, 446, Z + 6], [727, 400, PL + 24]], t, 0.3, 1.8, 'bad', 16);
          o.cnt = [['ENTRADA PARADA', b ? '4 células' : '…', b ? 'bad' : ''], ['PEÇA', 'consumidor de borda', 'dim'], ['CONSERTO', 'ler só celula=', 'dim']];
          o.res = [[b ? 'a borda virou ponto único' : 'um evento malformado', 'bad']]; } },
    ],
    replicacao: [
      { id: 'passiva', dur: 5, title: 'Cada célula tem uma célula passiva', yk: 'PASSIVAS EM OUTRA REGIÃO',
        code: ['celula-sp     → passiva no Rio (lag 300 ms)', 'celula-rio    → passiva em SP (300 ms)', 'celula-recife → passiva em SP (800 ms)', 'celula-mkt    → passiva em SP (800 ms)'],
        story: 'O dado de cada célula tem uma cópia numa <b>célula passiva</b>, em outra região. A <code>celula-sp</code> replica para o Rio; as outras três replicam para SP. Na Black Friday o atraso (lag) é de <b>300 ms</b> entre SP e Rio e de <b>800 ms</b> de Recife até SP.',
        look: 'No fundo, as passivas são sombras das células; os fios levam o stream de replicação.',
        key: 'Cada célula tem uma cópia passiva em outra região.',
        f(o) { cells(o, { router: false, routes: false, flow: false, rows: c => [`lag ${c.id === 'sp' || c.id === 'rio' ? 300 : 800} ms`, 'hi'] }); passives(o);
          CELLS.forEach((c, k) => { o.pc[c.id] = { gw: 1, pg: 1 }; o.beams.push({ pts: repLine(c, k), on: 1, flow: 1, sp: 0.25 }); });
          o.cnt = [['PASSIVAS', '4'], ['LAG SP–RIO', '300 ms', 'dim'], ['LAG RECIFE–SP', '800 ms', 'dim']];
          o.res = [['replicação passiva, assíncrona', 'acc']]; } },
      { id: 'lag', dur: 6, title: 'Assíncrona: perda = taxa × lag', yk: 'RPO EM PEDIDOS',
        code: ['sp      9,9 × 0,3 = 2,97', 'rio     4,5 × 0,3 = 1,35', 'recife  3,6 × 0,8 = 2,88', 'mkt    12,0 × 0,8 = 9,6', 'antes (primário único, 30/s):', '  Rio 9 · Recife 24'],
        story: 'Por padrão a replicação é <b>assíncrona</b>: o cliente não espera a cópia, e o que se perde numa queda é o que está no ar, <b>taxa × lag</b> (módulo 17). Na <code>celula-sp</code>, 9,9 × 0,3 = <b>2,97</b> pedidos; na <code>celula-mkt</code>, 12 × 0,8 = <b>9,6</b>. Com o primário único eram 30/s: 9 com o lag do Rio e 24 com o de Recife. A célula reduz o RPO porque reduz a taxa por primário.',
        look: 'As fichas ainda no fio são os pedidos que uma queda perderia; a celula-mkt tem mais delas.',
        key: 'Menos pedidos por primário, menos pedidos perdidos.',
        f(o) { const RPO = { sp: '2,97', rio: '1,35', rec: '2,88', mkt: '9,6' }, ND = { sp: 3, rio: 1, rec: 3, mkt: 10 };
          cells(o, { router: false, routes: false, flow: false, rows: c => [`perda: ${RPO[c.id]} pedidos`, 'acc'] }); passives(o);
          CELLS.forEach((c, k) => { o.pc[c.id] = { gw: 1, pg: 1 }; o.beams.push({ pts: repLine(c, k), on: 1, flow: ND[c.id], ft: 'acc', sp: 0.12 }); });
          o.cnt = [['PIOR', '9,6 pedidos'], ['SP', '2,97', 'dim'], ['ANTES (RECIFE)', '24', 'dim']];
          o.res = [['taxa × lag, por célula', 'acc']]; } },
      { id: 'tpc', dur: 8, title: '2PC: duas rodadas, esperando o mais lento', yk: 'CONSISTENTE: PREPARE + COMMIT', act: ['Ligar o 2PC', 'SP + Rio + Recife'],
        code: ['async: commit local 2 ms', '2PC SP + Rio: 2 × 10 + 2 × 2 = 24 ms', '2PC SP + Rio + Recife:', '  2 × 80 + 2 × 2 = 164 ms', '(modelo: rodadas de rede)'],
        story: 'A replicação <b>consistente</b> com <i>two-phase commit</i> faz duas rodadas, <i>prepare</i> e <i>commit</i>, e cada uma espera o participante mais lento. SP + Rio: <b>24 ms</b>; SP + Rio + Recife: <b>164 ms</b>, contra 2 ms do commit local. Os tempos são um modelo de rodadas de rede.',
        look: 'Em câmera lenta: as fichas saem de SP para o Rio e para Recife e voltam, duas vezes; a de Recife sempre chega por último.',
        key: 'No 2PC, cada rodada custa o RTT do participante mais distante.',
        f(o, t) { const ph = t < 0.4 ? -1 : Math.min(3, Math.floor((t - 0.4) / 1.6)), f = ((t - 0.4) % 1.6) / 1.6, ms = Math.min(164, Math.max(0, Math.round(lin(t, 0.4, 6.8, 0, 164))));
          cells(o, { router: false, routes: false, flow: false, hide: [], st: c => c.id === 'mkt' ? 0 : 1, rows: c => c.id === 'mkt' ? ['fora do 2PC', 'dim'] : [c.id === 'sp' ? 'coordenador' : 'participante', 'acc'] });
          ['sp', 'rio', 'rec'].forEach(id => o.pc[id] = { gw: 1, pg: 1 });
          show(o, 'tpc'); lit(o, 'tpc'); o.rows.tpc = act('2PC', 'SP + RIO + RECIFE', [ph < 0 ? 'commit local: 2 ms' : ['prepare →', '← votos', 'commit →', '← ok'][ph], 'acc'], [`${ms} ms`, 'hi']);
          const a = pgTop(CI.sp), lane = (c, yy) => [a, [a[0], yy, PL + 46], [pgTop(c)[0], yy, PL + 46], pgTop(c)];
          const Lr = lane(CI.rio, 104), Lc = lane(CI.rec, 108); o.beams.push({ pts: Lr, on: 1 }, { pts: Lc, on: 1 });
          if (ph >= 0 && t < 6.8) { const out = ph % 2 === 0, fr = out ? f : 1 - f, fRio = clamp(fr * 8), fRec = clamp(fr);
            o.dots.push([alongPts(Lr, cumLen(Lr), out ? fRio : 1 - clamp((1 - fr) * 8)), 'acc', 11], [alongPts(Lc, cumLen(Lc), fRec), 'acc', 11]); }
          o.cnt = [['COMMIT', `${ms} ms`], ['SÓ SP + RIO', '24 ms', 'dim'], ['ASSÍNCRONO', '2 ms', 'dim']];
          o.res = [[t > 6.8 ? '164 ms por commit' : 'cada rodada espera Recife', 'acc']]; } },
      { id: 'quente', dur: 5, title: 'A linha quente e a disponibilidade', yk: '1 ÷ LATÊNCIA · 0,999^k',
        code: ['estoque do gato: o lock dura as rodadas', '2 ms → 500 reservas/s', '24 ms → 41,7/s', '164 ms → 6,1/s', 'disponibilidade: 99,9 · 99,8 · 99,7%'],
        story: 'Numa <b>linha quente</b>, como o estoque do gato (módulo 11), o <i>lock</i> fica segurado durante as rodadas: <b>500</b> reservas/s com 2 ms, <b>41,7</b> com 24 ms, <b>6,1</b> com 164 ms. E a disponibilidade multiplica: com 3 células a 99,9%, o 2PC fica em <b>99,7%</b>, porque qualquer participante fora aborta.',
        look: 'As colunas sobre as células são as reservas por segundo do gato em cada modo: async, SP + Rio e SP + Rio + Recife.',
        key: '2PC soma a latência e multiplica a indisponibilidade.',
        f(o) { cells(o, { router: false, routes: false, flow: false, st: c => c.id === 'mkt' ? 0 : 1, rows: c => [{ sp: 'async: 500/s', rio: '2PC 2: 41,7/s', rec: '2PC 3: 6,1/s', mkt: '' }[c.id], c.id === 'rec' ? 'bad' : 'acc'] });
          [['sp', 500], ['rio', 41.7], ['rec', 6.1]].forEach(([id, v]) => { const c = CI[id]; o.nopc[id] = 1; barOn(o, c, Math.max(0.6, v / 12.5), id === 'rec' ? 'bad' : 'acc'); T(o, [c.x + c.w / 2, CY + 100, PL + 6 + Math.max(0.6, v / 12.5) * 4 + 26], `${dec(v, v % 1 ? 1 : 0)}/s\n${{ sp: '99,9%', rio: '99,8%', rec: '99,7%' }[id]}`, id === 'rec' ? 'bad' : 'acc'); });
          o.cnt = [['LINHA QUENTE', '6,1/s', 'bad'], ['ASYNC', '500/s', 'dim'], ['DISPONIBILIDADE', '99,7%', 'dim']];
          o.res = [['qualquer participante fora aborta', 'bad']]; } },
      { id: 'folga', dur: 5, title: 'A folga: quem assume quando uma cai', yk: 'OCUPAÇÃO MÁXIMA = 70% × (N − 1) ÷ N',
        code: ['N = 2:  +100%  → rodar a 35%', 'N = 3:  +50%   → 46,7%', 'N = 4:  +33,3% → 52,5%', 'N = 10: +11,1% → 63%', 'N = 20: +5,3%  → 66,5%'],
        story: 'Quando uma célula cai, as outras assumem a carga dela. Com N células iguais cada sobrevivente recebe <b>1 ÷ (N − 1)</b> a mais. Para continuar em ρ ≤ 70% (módulo 23) depois de uma queda, a ocupação normal precisa ficar em 70% × (N − 1) ÷ N: <b>35%</b> com pares ativo-passivo, <b>52,5%</b> com 4 células, 66,5% com 20.',
        look: 'Cada célula mostra até onde pode ir no dia normal (52,5%) e a folga reservada até 70%.',
        key: 'Muitas células pequenas reservam menos folga que pares.',
        f(o) { cells(o, { router: false, routes: false, rows: () => ['normal ≤ 52,5%', 'acc'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; barOn(o, c, 52.5 * 0.6, 'acc', -14, 44); barOn(o, c, 70 * 0.6, 'dim', 30, 14); });
          T(o, [CI.mkt.x + 111, CY + 100, PL + 6 + 31.5 * 4 + 22], '52,5%', 'acc'); T(o, [CI.mkt.x + 155, CY + 110, PL + 6 + 42 * 4 + 16], 'teto 70%', 'dim');
          o.cnt = [['N = 4', '52,5%'], ['PARES', '35%', 'dim'], ['N = 20', '66,5%', 'dim']];
          o.res = [['folga = 1 ÷ (N − 1)', 'acc']]; } },
      { id: 'dados', dur: 6, title: 'O veneno de dados vai junto', yk: 'REQUISIÇÃO × DADO',
        code: ['veneno de requisição: fica na célula', 'veneno de dado (linha corrompida):', '  é replicado para a passiva', '  e derruba as duas'],
        story: 'A célula contém a <b>requisição</b> envenenada. Uma <b>linha corrompida</b> no banco é outra coisa: a replicação copia a linha para a passiva, e quando a passiva assume ela cai pelo mesmo motivo. Para o veneno de dado, a passiva não é saída.',
        look: 'A ficha vermelha sai do banco da celula-mkt, viaja pelo fio de replicação e apaga a sombra em SP também.',
        key: 'A célula contém requisições, não dados corrompidos.',
        f(o, t) { const b = t > 3; cells(o, { router: false, routes: false, st: c => c.id === 'mkt' ? 'bad' : 1, rows: c => c.id === 'mkt' ? ['linha corrompida', 'bad'] : ['ok', 'hi'] }); passives(o);
          o.pc.mkt = { pg: 'bad' }; if (b) { o.on.pasSP = 'bad'; o.rows.pasSP = act('passivas em SP', 'CORROMPIDA', ['celula-rio · lag 300 ms', 'hi'], ['celula-recife · lag 800 ms', 'hi'], ['celula-mkt: a mesma linha', 'bad']); }
          CELLS.forEach((c, k) => o.beams.push({ pts: repLine(c, k), on: c.id !== 'mkt' ? 1 : 0, tone: c.id === 'mkt' ? 'bad' : '' }));
          trip(o, repLine(CI.mkt, 3), t, 0.4, 3, 'bad', 16);
          o.cnt = [['CÓPIAS CORROMPIDAS', b ? '2' : '1', 'bad'], ['REQUISIÇÃO', 'fica na célula', 'dim'], ['DADO', 'replica', 'dim']];
          o.res = [[b ? 'a passiva caiu junto' : 'a linha viaja no stream', 'bad']]; } },
      { id: 'errado', dur: 7, title: 'E se der errado: a celula-sp cai e o Rio vai a 48%', yk: 'CÉLULAS DESIGUAIS',
        code: ['celula-sp cai; a passiva no Rio assume', 'Rio: 15% → 48% do tráfego', '4,5 → 14,4 pedidos/s (3,2×), não +33%', 'saídas: rodar a 35% em pares', '  ou muitas células pequenas', '  ou degradar por prioridade (12 · 6 · 2)'],
        story: 'Se a <code>celula-sp</code> (33%) cai e só a passiva no Rio a assume, o Rio vai de <b>15% a 48%</b> do tráfego: de 4,5 para <b>14,4 pedidos/s</b>, 3,2 vezes, e não os +33% da conta com células iguais. As saídas: pares rodando a 35%, muitas células pequenas ou degradar por prioridade (as lanes 12 · 6 · 2 do módulo 25).',
        look: 'A celula-sp apaga e a coluna do Rio sobe de 15% para 48%.',
        key: 'Com células desiguais, a passiva pode receber mais do que aguenta.',
        f(o, t) { const v = lin(t, 1.5, 4.5, 15, 48); cells(o, { router: false, routes: false, st: c => c.id === 'sp' && t > 1 ? 'bad' : 1, rows: c => c.id === 'rio' ? [`${dec(v * 0.3, 1)} pedidos/s`, v > 40 ? 'bad' : 'acc'] : c.id === 'sp' && t > 1 ? ['caiu', 'bad'] : [`${c.rate} pedidos/s`, 'dim'] });
          CELLS.forEach(c => { o.nopc[c.id] = 1; if (c.id === 'rio') barOn(o, c, v, v > 30 ? 'bad' : 'acc'); else if (c.id !== 'sp' || t <= 1) barOn(o, c, c.frac, 'dim'); });
          T(o, [CI.rio.x + 85, CY + 100, PL + 6 + v * 4 + 26], `Rio: ${Math.round(v)}%`, v > 30 ? 'bad' : 'acc');
          o.cnt = [['RIO', `${Math.round(v)}%`, v > 30 ? 'bad' : ''], ['PEDIDOS/S', dec(v * 0.3, 1), 'dim'], ['VEZES', dec(v / 15, 1) + '×', 'dim']];
          o.res = [['3,2×, e não +33%', 'bad']]; } },
    ],
    shuffle: [
      { id: 'pares', dur: 5, title: 'Cada cliente em 2 de 10 células', yk: 'N = 10, k = 2 · 45 PARES',
        code: ['mkt-01  {8, 9}', 'lena-77 {6, 8}', 'bia-31  {4, 6}', 'caio-58 {1, 4}', 'davi-12 {1, 9}', 'sorteio: rendezvous com murmur3'],
        story: 'O <i>shuffle sharding</i> dá a cada cliente <b>k células</b> em vez de uma. Com 10 células e k = 2 há <b>45 pares</b> possíveis, e cada cliente recebe um (sorteado por <i>rendezvous</i> com <code>murmur3</code>, as posições do módulo 16). Se uma das suas células cai, a outra atende.',
        look: 'Cada cliente na frente tem dois fios, um para cada célula do seu par.',
        key: 'Cada cliente tem duas células; uma basta.',
        f(o) { shuffle(o); o.cnt = [['PARES', '45'], ['N', '10', 'dim'], ['k', '2', 'dim']]; o.res = [['k = 2 de N = 10', 'acc']]; } },
      { id: 'derruba', dur: 5, title: 'O veneno do mkt-01 derruba 8 e 9', yk: 'f = 2 CÉLULAS FORA', act: ['Derrubar 8 e 9', 'o veneno do mkt-01'],
        code: ['o mkt-01 manda o veneno às suas duas células', 'c8 e c9 caem', 'as 8 sobreviventes assumem +25% (2 ÷ 8)'],
        story: 'O veneno do <code>mkt-01</code> vai para as duas células dele e derruba a <b>8</b> e a <b>9</b>. As 8 sobreviventes assumem <b>+25%</b> cada (2 ÷ 8).',
        look: 'As células 8 e 9 ficam vermelhas; os fios que chegavam nelas também.',
        key: 'Duas células caem, e o resto da grade continua de pé.',
        f(o, t) { const d = t > 1 ? [8, 9] : []; shuffle(o, { down: d, st: (k, lost) => k === 0 && d.length ? 'bad' : 1 });
          o.cnt = [['FORA', d.length ? 'c8 · c9' : '…', 'bad'], ['SOBREVIVENTES', '8', 'dim'], ['A MAIS EM CADA', '+25%', 'dim']];
          o.res = [['2 de 10 células caíram', 'bad']]; } },
      { id: 'quem', dur: 5, title: 'Quem nota a queda?', yk: 'QUEM PERDE AS DUAS',
        code: ['bia-31 {4, 6}: nem nota', 'caio-58 {1, 4}: nem nota', 'lena-77 {6, 8}: perde a 8, fica com a 6', 'davi-12 {1, 9}: perde a 9, fica com a 1', 'mkt-01 {8, 9}: perde as duas'],
        story: '<b>Bia e Caio nem notam</b>: nenhuma das células deles caiu. <b>Lena e Davi perdem uma</b> e continuam com a outra. Só fica sem serviço quem tem exatamente {8, 9}: o próprio <code>mkt-01</code> e quem mais tiver o mesmo par.',
        look: 'Na frente, só o mkt-01 fica vermelho; Lena e Davi seguem por um fio só.',
        key: 'Só perde tudo quem tem o mesmo par inteiro.',
        f(o) { shuffle(o, { down: [8, 9] }); o.cnt = [['SEM SERVIÇO', '1 de 5', 'bad'], ['PERDERAM UMA', 'Lena · Davi', 'dim'], ['NEM NOTARAM', 'Bia · Caio', 'dim']]; o.res = [['só o par {8, 9} cai', 'acc']]; } },
      { id: 'conta', dur: 5, title: '1 em 45: 2,22%', yk: 'EXATO: 1 ÷ C(N, k)',
        code: ['C(10, 2) = 45 pares', '1 ÷ 45 = 2,22%', 'com 1 célula por cliente: 2 ÷ 10 = 20%', 'artigo: (f/N)^k = (2/10)² = 4%'],
        story: 'Só quem tem o par {8, 9} fica totalmente fora: <b>1 em 45</b>, ou <b>2,22%</b> dos clientes (o 1 ÷ 45 do módulo 16). Com uma célula por cliente, as mesmas duas quedas tirariam 20%. A fórmula do artigo, <code>(f/N)^k</code>, dá 4%: ela sorteia com reposição e é uma aproximação. A conta exata é C(f,k) ÷ C(N,k).',
        look: 'Um par vermelho entre 45: é a fração dos clientes que fica sem nenhuma célula.',
        key: 'O raio vira probabilidade: 1 ÷ C(N, k).',
        f(o) { shuffle(o, { down: [8, 9] }); o.cnt = [['EXATO', '2,22%'], ['ARTIGO', '4%', 'dim'], ['SEM SHUFFLE', '20%', 'dim']]; o.res = [['1 ÷ 45 = 2,22%', 'acc']]; } },
      { id: 'n20', dur: 5, title: 'Com 20 células: 0,526%', yk: 'N = 20, k = 2 · 190 PARES',
        code: ['C(20, 2) = 190 pares', 'exato: 1 ÷ 190 = 0,526%', 'artigo: (2/20)² = 1%', '"1% = 100 bulkheads" mistura 1 falha com 2', 'mesma falha dupla: 190 compartimentos fixos'],
        story: 'Com <b>20 células</b> há 190 pares, e duas células caídas deixam totalmente fora <b>0,526%</b> dos clientes (o artigo diz 1%). O artigo compara isso a 100 <i>bulkheads</i>, mas mistura uma falha com duas: para a mesma falha dupla, o equivalente são <b>190</b> compartimentos fixos. Com uma célula só caída, ninguém fica totalmente fora.',
        look: 'A grade dobra para 20 células; só o par vermelho continua sem saída.',
        key: 'Mais células, muito mais pares, raio bem menor.',
        f(o) { shuffle(o, { N: 20, down: [8, 9], cli: false }); o.cnt = [['EXATO', '0,526%'], ['ARTIGO', '1%', 'dim'], ['PARES', '190', 'dim']]; o.res = [['1 ÷ 190 = 0,526%', 'acc']];
          T(o, [450, 60, 150], 'N = 20 · k = 2 · 190 pares', 'acc'); } },
      { id: 'artigo', dur: 5, title: 'A tabela do artigo: uma linha errada por 10×', yk: '(f/N)^k × C(f,k) ÷ C(N,k)',
        code: ['N 20, f=k 2: 1%       × 0,526%', 'N 20, f=k 3: 0,3375% × 0,0877%', 'N 20, f=k 5: 0,0977% × 0,00645%', '  (o artigo imprime 0,009%)', 'N 10, f=k 2: 4%       × 2,22%'],
        story: 'A tabela do artigo usa <code>(f/N)^k</code>. Na terceira linha, (5 ÷ 20)^5 dá <b>0,0977%</b>, e o artigo imprime 0,009%: errado por 10×. A conta exata é ainda menor, <b>0,00645%</b>. A aproximação sempre exagera o risco, e exagera mais quanto maior o k.',
        look: 'Cinco células vermelhas: só o cliente com exatamente essas cinco fica fora.',
        key: 'A fórmula do artigo é uma aproximação; a exata é C(f,k) ÷ C(N,k).',
        f(o) { shuffle(o, { N: 20, down: [3, 8, 9, 14, 17], cli: false }); T(o, [450, 60, 150], 'f = k = 5 · 15.504 conjuntos', 'acc');
          o.cnt = [['EXATO', '0,00645%'], ['FÓRMULA', '0,0977%', 'dim'], ['ARTIGO IMPRIME', '0,009%', 'bad']]; o.res = [['errado por 10×', 'bad']]; } },
      { id: 'errado', dur: 5, title: 'E se der errado: shuffle com 4 células', yk: 'N = 4, k = 2 · 6 PARES',
        code: ['C(4, 2) = 6 pares', 'exato: 1 ÷ 6 = 16,7%', 'artigo: (2/4)² = 25%', 'com 4 células o shuffle quase não ajuda'],
        story: 'O <i>shuffle</i> precisa de muitas células. Com as 4 da loja só existem <b>6 pares</b>, e duas células caídas tiram do ar <b>16,7%</b> dos clientes. Com 10, 2,22%; com 20, 0,526%. Na loja de hoje o que limita o raio é a célula própria do parceiro, não o sorteio.',
        look: 'Quatro células, duas vermelhas: um par em seis fica sem nenhuma.',
        key: 'Shuffle sharding só compensa com muitas células.',
        f(o) { shuffle(o, { N: 4, down: [3, 4], cli: false }); T(o, [450, 110, 130], '6 pares · 1 ÷ 6 = 16,7%', 'bad');
          o.cnt = [['EXATO', '16,7%', 'bad'], ['ARTIGO', '25%', 'dim'], ['PARES', '6', 'dim']]; o.res = [['com 4 células quase não ajuda', 'bad']]; } },
    ],
  };
  // tópico compartilhado na frente (s = segundos desde o veneno; 0 = sem veneno)
  function shared(o, s) {
    show(o, 'shTop'); o.on.shTop = s > 0 ? 'bad' : 1; o.rows.shTop = act('tópico pedidos (compartilhado)', '3 PARTIÇÕES'); o.rows.shTop.parts = { n: 3, bad: s > 0 ? 1 : -1 };
    CELLS.forEach(c => { o.pc[c.id] = { gw: 1, tube: 0 }; o.beams.push({ pts: [[c.x + c.w / 2, CY + CD - 30, PL + 30], [c.x + c.w / 2, 342, PL + 30], [Math.min(500, c.x + c.w / 2), 380, PL + 14]], on: 1, flow: 1, sp: 0.35 }); });
    if (s > 0) o.piles.push({ p: [305, 398, PL + 10], f: s / 600, v: 40 * s });
  }
  function edgeCons(o, b) { show(o, 'cons'); o.on.cons = b ? 'bad' : 1; o.rows.cons = act('consumidor de borda', 'WEBHOOKS', [b ? 'caiu ao desserializar' : 'lê celula=… e republica', b ? 'bad' : 'hi']);
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
      x.fillStyle = b ? BAD() : toneC('hi'); x.textAlign = 'center'; const t = b ? `p${i} · travada` : `p${i} · 40/s`; fitFont(x, u, t, 13, w - 6); x.fillText(t, u(X + w / 2), u(y0 + h / 2)); x.textAlign = 'left'; }
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
    pilha: () => `<table class="h3-sum"><tr><th></th><th>pilha única</th><th>4 células</th></tr><tr${on_(step === 2 || step === 4)}><td>tentativas que falham</td><td>7.200</td><td>2.880</td></tr><tr${on_(step === 4)}><td>pessoa física</td><td>100%</td><td>0%</td></tr><tr${on_(step === 1)}><td>pods de pedidos no chão</td><td>3 (150 ms)</td><td>2 da celula-mkt</td></tr><tr${on_(step === 6)}><td>com estoque global</td><td>100%</td><td>100%</td></tr></table><li>Veneno: <code>quantidade: 2147483648</code> (2³¹) às <b>20:25:00.000</b>; retry até 3; pod volta em 30 s; bloqueio em 4 min</li><li>Pedido <b>1060</b>: Lena, 2 gatos 159,80 + frete Recife 15,00 = <b>174,80</b>, <code>201</code>; gato 19 → 17, celula-recife 2 → 0</li><li>Células: sp 33% (9,9/s) · rio 15% (4,5) · recife 12% (3,6) · mkt 40% (12,0); versão <code>@2.6.0</code></li>`,
    raio: () => `<table class="h3-sum"><tr><th>célula</th><th>fração</th><th>pedidos/s</th><th>região</th></tr>${CELLS.map(c => `<tr${on_(c.id === 'mkt')}><td>${c.nm}</td><td>${c.frac}%</td><td>${c.rate}</td><td>${c.reg}</td></tr>`).join('')}</table><li>Pior caso <b>40%</b>, média 25%, eficiência 1 ÷ (4 × 0,40) = <b>62,5%</b></li><li>Sem a celula-mkt: 55 · 25 · 20% (pior caso 55%, média 33,3%)</li><li>SP em duas: 16,5 + 16,5; pior caso ainda 40%; eficiência 50%</li><li>Por região: SP 33% · Rio 15% · Recife 52% (com o mkt em SP: 73%; no Rio: 55%)</li>`,
    celula: () => `<table class="h3-sum"><tr><th>célula</th><th>cat.</th><th>ped.</th><th>pag.</th><th>est.</th><th>vCPU</th></tr><tr><td>mkt</td><td>2</td><td>4</td><td>6</td><td>2</td><td>14</td></tr><tr><td>sp</td><td>8</td><td>4</td><td>5</td><td>2</td><td>19</td></tr><tr><td>rio</td><td>4</td><td>2</td><td>3</td><td>2</td><td>11</td></tr><tr class="on"><td>recife</td><td>3</td><td>2</td><td>2</td><td>2</td><td>9</td></tr><tr><td>total</td><td>17</td><td>12</td><td>16</td><td>8</td><td>53</td></tr><tr><td>pilha única</td><td>14</td><td>10</td><td>15</td><td>2</td><td>41</td></tr></table><li>Plano de 2027 (200 pedidos/s); dia comum: 4 × 8 = <b>32</b> × 9 vCPU (3,6×)</li><li>Gato: 19 = <b>6 · 3 · 2 · 8</b> (sp · rio · recife · mkt); depósitos <code>SP-1</code>, <code>RIO-1</code>, <code>REC-1</code></li><li>Anéis: célula zero 0% → recife 12% → rio 27% → sp 60% → mkt 100%</li>`,
    roteador: () => `<table class="h3-sum"><tr><th>4 → 5 células</th><th>mudam de célula</th></tr><tr${on_(step === 2)}><td>hash mod N</td><td>80,1%</td></tr><tr${on_(step === 3)}><td>anel (100 pontos)</td><td>~19,7%</td></tr><tr${on_(step === 4)}><td>tabela cadastral</td><td>0 (só quem você mover)</td></tr></table><li>Mapa <code>mapa-v42</code>: 1,5 milhão × ~100 B = <b>150 MB</b>, em memória em cada borda</li><li>Em série: 99,99% × 99,9% = <b>99,89%</b></li><li>Mover o <code>mkt-01</code>: 40 GB a 50 MB/s = <b>13 min 20 s</b></li><li>Webhook <code>c-7733</code> com <code>celula=sp</code>; mapa ruim: <code>mapa-v43</code> (<code>bia-31 → celula-xx</code>)</li>`,
    assincrono: () => `<table class="h3-sum"><tr><th></th><th>compartilhado</th><th>por célula</th></tr><tr><td>eventos/s por partição</td><td>40</td><td>16 (mkt)</td></tr><tr${on_(step === 1 || step === 3)}><td>presos em 10 min</td><td>24.000</td><td>9.600</td></tr><tr${on_(step === 1 || step === 3)}><td>de pessoa física</td><td>14.400</td><td>0</td></tr></table><li>30 pedidos/s × 4 eventos = <b>120 eventos/s</b>; 3 partições</li><li>O consumidor cai ao desserializar, antes de ler a política de DLQ</li><li>Os números de eventos presos são taxa × tempo (não houve Kafka rodando)</li>`,
    replicacao: () => `<table class="h3-sum"><tr><th>célula</th><th>passiva</th><th>lag</th><th>perda</th></tr><tr><td>sp</td><td>Rio</td><td>300 ms</td><td>2,97</td></tr><tr><td>rio</td><td>SP</td><td>300 ms</td><td>1,35</td></tr><tr><td>recife</td><td>SP</td><td>800 ms</td><td>2,88</td></tr><tr class="on"><td>mkt</td><td>SP</td><td>800 ms</td><td>9,6</td></tr></table><li>2PC (modelo): SP + Rio <b>24 ms</b>; SP + Rio + Recife <b>164 ms</b>; async 2 ms</li><li>Linha quente: 500 · 41,7 · 6,1 reservas/s; disponibilidade 99,9 · 99,8 · 99,7%</li><li>Ocupação máxima: 35 · 46,7 · 52,5 · 63 · 66,5% (N = 2, 3, 4, 10, 20)</li><li>SP cai: Rio 15% → <b>48%</b> (4,5 → 14,4 pedidos/s, 3,2×)</li>`,
    shuffle: () => `<table class="h3-sum"><tr><th>N</th><th>f = k</th><th>(f/N)^k</th><th>exato</th><th>pares</th></tr><tr${on_(step === 4)}><td>20</td><td>2</td><td>1%</td><td>0,526%</td><td>190</td></tr><tr><td>20</td><td>3</td><td>0,3375%</td><td>0,0877%</td><td>1.140</td></tr><tr${on_(step === 5)}><td>20</td><td>5</td><td>0,0977%</td><td>0,00645%</td><td>15.504</td></tr><tr${on_(step >= 1 && step <= 3)}><td>10</td><td>2</td><td>4%</td><td>2,22%</td><td>45</td></tr><tr${on_(step === 6)}><td>4</td><td>2</td><td>25%</td><td>16,7%</td><td>6</td></tr></table><li>Pares (N = 10): mkt-01 {8, 9} · lena-77 {6, 8} · bia-31 {4, 6} · caio-58 {1, 4} · davi-12 {1, 9}</li><li>O artigo imprime 0,009% na 3ª linha (a fórmula dá 0,0977%)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cel') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
