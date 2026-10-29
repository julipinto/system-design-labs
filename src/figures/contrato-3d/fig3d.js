// Figura 3D (iso-glow): o painel de controle da loja. No centro, o tanque do orçamento de erro (12.960 ruins, 43,2 min no mês)
// com duas faixas da política (50% e 10%); à esquerda, os incidentes que bebem dele (ou as janelas do burn rate); à direita, a
// escada da política (publicar → só correções → congelar → sala de guerra). Os outros cenários reaproveitam a mesma prancha:
// a escada SLI → SLO → SLA e as quatro células com o orçamento em barras; a frota do catálogo e o pool de 20 (USE); o pedidos
// por célula, os erros, o histograma e as duas versões (RED); os quatro mostradores da celula-recife (quatro sinais de ouro).
// Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=orcamento|slo|use|red|golden; ?step=N abre no passo N; burn é o passo 5 do orcamento).
// Dados: docs/escrita/observabilidade-brief.md e as aulas 6 a 10 (contas de c28.py, 21/10/2026): 5/s × 2.592.000 = 12.960.000,
// 0,1% = 12.960 = 43,2 min; SP 643,5 = 4,97%; PSP-A sem proteção 2.700 = 20,8% (1.000×); 1063: 8 = 0,06%; burn 14,4× · 6× · 1×
// = 2% · 5% · 10%; SLA 99,5% = 216 min; células 5.184 · 4.276,8 · 1.944 · 1.555,2; catalogo-3 99% × 64% × 67,5%, Little 64,6 de
// 86,4; pool 40,4 de 20; RED 9,9 · 4,5 · 3,6 · 12,0; histograma 400 · 975 · 992 · 992 · 1.000; breaker 275 → 193,1 ms.
FIGS3D.push({ id: 'contrato', name: 'Contrato', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const pct = (v, d = 1) => dec(v * 100, d) + '%';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['orcamento', 'slo', 'use', 'red', 'golden'];
  const SCNAME = { orcamento: 'Orçamento', slo: 'SLO', use: 'USE', red: 'RED', golden: 'Golden' };
  const SCFULL = { orcamento: 'O orçamento de erro', slo: 'SLI, SLO e SLA', use: 'USE: os recursos', red: 'RED: os serviços', golden: 'Os quatro sinais de ouro' };
  const AULA = { orcamento: 'aula-7-service-levels', slo: 'aula-7-service-levels', use: 'aula-8-use-method',
    red: 'aula-9-red-method', golden: 'aula-10-four-golden-signals' };
  let clk = 0, sc = 'orcamento', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    if (m === 'burn') { sc = 'orcamento'; fromUrl = true; step = 4; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-contrato3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0); zb = onde a base pousa
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 20, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 }, POD = { s1: 13, fs: 11.5, lh: 14, y0: 33 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5, zb = PL) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y, zb] };
  }
  // barras 3D de altura variável (o orçamento das células, a utilização das réplicas, o rate): base = o bloco onde pousam
  const BARS = {};
  function bar(nm, base, x, y, w, d, H) {
    const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, H, 3, mat, g); BARS[nm] = { g, mat, base, x, y, w, d, H, v: 0 };
  }
  // Orçamento: os incidentes (ou as janelas do burn) à esquerda, o tanque no meio, a política à direita
  const IY = [145, 240, 335];
  ['iSP', 'iPSP', 'i1063'].forEach((nm, k) => block(nm, 40, IY[k], 240, 84, 16));
  ['w1h', 'w6h', 'w3d'].forEach((nm, k) => block(nm, 40, IY[k], 240, 84, 16));
  block('fr250', 40, 225, 240, 130, 18);
  const POLY = [150, 214, 278, 342], POL = ['pPub', 'pCor', 'pCong', 'pWar'];
  POL.forEach((nm, k) => block(nm, 650, POLY[k], 220, 58, 14, SMALL));
  // SLO: a escada SLI → SLO → SLA, a entrada do POST /pedidos e as quatro células
  block('sli', 40, 140, 250, 150, 16); block('slo', 320, 140, 260, 150, 30); block('sla', 610, 140, 260, 150, 44);
  block('req', 40, 330, 250, 90, 14, SMALL);
  const CX = [40, 250, 460, 670], CELL = ['mkt', 'sp', 'rio', 'rec'], CY = 320;
  CELL.forEach((c, k) => { block('c_' + c, CX[k], CY, 190, 104, 14, SMALL); bar('cb_' + c, 'c_' + c, CX[k] + 132, CY + 34, 46, 48, 96); });
  // USE: as 10 réplicas do catálogo com a utilização em barra, a frota, o pool de 20 e os seis recursos da célula
  const RX = k => 40 + k * 83;
  for (let k = 0; k < 10; k++) { block('rep' + k, RX(k), 140, 76, 120, 12, POD); bar('ub' + k, 'rep' + k, RX(k) + 18, 140 + 66, 40, 44, 100); }
  block('frota', 480, 320, 390, 110, 16);
  block('prel', 40, 150, 250, 120, 16); block('pchk', 40, 300, 250, 120, 16); block('pool', 330, 150, 300, 270, 18); block('puse', 670, 150, 200, 270, 16, SMALL);
  const RES = ['rCpu', 'rMem', 'rPool', 'rWal', 'rNet', 'rKaf'];
  RES.forEach((nm, k) => block(nm, [40, 320, 600][k % 3], [150, 300][Math.floor(k / 3)], 260, 130, 16, SMALL));
  // RED: o pedidos em cima das células; os erros; o histograma; as duas versões
  block('svc', 300, 140, 300, 100, 18);
  block('e5xx', 40, 140, 400, 120, 16); block('eInv', 470, 140, 400, 120, 16); block('eFrete', 40, 290, 400, 120, 16); block('e4xx', 470, 290, 400, 120, 16);
  block('hist', 40, 140, 540, 280, 16); block('pct', 610, 140, 260, 280, 16);
  block('v240', 40, 140, 400, 280, 16); block('v250', 470, 140, 400, 280, 16);
  // Golden: os quatro mostradores e o mural dos 300 painéis
  const GS = ['gLat', 'gTraf', 'gErr', 'gSat'];
  GS.forEach((nm, k) => block(nm, CX[k], 150, 190, 240, 20, SMALL));
  block('mural', 40, 140, 830, 290, 14, SMALL);
  const NAMES = Object.keys(B), BN = Object.keys(BARS);

  // o tanque do orçamento: base, quatro colunas, aro, as faixas de 50% e 10% e o líquido (que encolhe em altura)
  const TX = 345, TY = 140, TW = 250, TD = 250, TH = 160, FB = 8, FH = TH - 18;
  const tank = new THREE.Group(); g0.add(tank); tank.visible = false;
  rbox(TX, TY, 0, TW, TD, FB, 10, bodyMat, tank);
  [[TX, TY], [TX + TW - 10, TY], [TX, TY + TD - 10], [TX + TW - 10, TY + TD - 10]].forEach(([x, y]) => rbox(x, y, FB, 10, 10, TH - FB, 2, bodyMat, tank));
  rbox(TX, TY, TH - 6, TW, 10, 6, 2, bodyMat, tank); rbox(TX, TY + TD - 10, TH - 6, TW, 10, 6, 2, bodyMat, tank);
  rbox(TX, TY, TH - 6, 10, TD, 6, 2, bodyMat, tank); rbox(TX + TW - 10, TY, TH - 6, 10, TD, 6, 2, bodyMat, tank);
  const RAILS = [0.5, 0.1].map(f => { const mat = capMat(); twCaps.push(mat); const z = FB + f * FH;
    rbox(TX - 3, TY + TD - 3, z, TW + 6, 5, 3, 1, mat, tank); rbox(TX + TW - 3, TY - 3, z, 5, TD + 6, 3, 1, mat, tank);
    rbox(TX - 3, TY - 3, z, TW + 6, 5, 3, 1, mat, tank); rbox(TX - 3, TY - 3, z, 5, TD + 6, 3, 1, mat, tank); return { mat, f }; });
  const fluid = new THREE.Group(); tank.add(fluid); fluid.position.copy(W(0, 0, FB));
  const fluidMat = capMat(); twCaps.push(fluidMat);
  rbox(TX + 12, TY + 12, 0, TW - 24, TD - 24, FH, 8, fluidMat, fluid);
  const ftop = faceCanvas('top', TX + 16, TY + 16, FH, TW - 32, TD - 32, 4, fluid);
  // pilhas (a fila de cada réplica)
  const KW = 46, KD = 40, KH = 8, KMAX = 6;
  const CARDS = Array.from({ length: 22 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e fichas de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 24 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c), grayEm = new THREE.Color(0x8d9399);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : tone === 'gray' ? grayEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : tone === 'gray' ? 0.3 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? 2.6 : b.on || b.tone === 'bad' ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if ((b.on || b.tone === 'bad') && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
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
  const TAGS = Array.from({ length: 8 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const IC = IY.map(y => y + 42), PC = POLY.map(y => y + 29);
  const CAB = {
    drain: IC.map(y => P3([[TX, y], [280, y]])), pol: PC.map(y => P3([[TX + TW, y], [650, y]])),
    frete: P3([[280, 290], [TX, 290]]),
    req: P3([[165, 330], [165, 290]]), s12: P3([[290, 215], [320, 215]], 30), s23: P3([[580, 215], [610, 215]], 40),
    prel: P3([[290, 210], [330, 210]]), pchk: P3([[290, 360], [330, 360]]), puse: P3([[630, 285], [670, 285]]),
    svc: P3([[450, 240], [450, 280]]), bus: P3([[CX[0] + 95, 280], [CX[3] + 95, 280]]),
  };
  const branch = k => P3([[CX[k] + 95, 280], [CX[k] + 95, CY]]);
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone === 'gray' ? 'dim' : tone || 'acc']);
  }
  // fichas num cabo: período per (s), a ficha k sai em k × per; kind(k) = [rótulo, tom]
  function tokens(o, pts, per, kind, travel = 1.6) {
    for (let k = Math.floor((clk - travel) / per); k <= Math.floor(clk / per); k++) {
      const a = clk - k * per; if (a < 0) continue; const [lab, tn] = kind(k); pk(o, pts, a / travel, lab, tn);
    }
  }

  // ── conteúdo dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], bars: {}, tank: null }; }

  // Orçamento: o tanque (lv = fração que sobra), a política acesa pelo nível e os incidentes
  const BUD = 12960, MIN = 43.2;
  const left = lv => `${pct(lv)} · ${dec(MIN * lv)} min`;
  function tankBase(o, lv, tone = '') {
    o.tank = { lv, tone: tone || (lv < 0.1 ? 'bad' : ''), lab: pct(lv), sub: `${thou(BUD * lv)} ruins · ${dec(MIN * lv)} min` };
    show(o, ...POL);
    const k = lv > 0.5 ? 0 : lv > 0.1 ? 1 : lv > 0 ? 2 : 3;
    o.rows.pPub = act('publicar normal', '> 50%', ['deploy liberado', k === 0 ? 'acc' : 'dim']);
    o.rows.pCor = act('só correções', '50–10%', ['canary lento', k === 1 ? 'acc' : 'dim']);
    o.rows.pCong = act('congelar', '< 10%', ['só o que é correção', k === 2 ? 'bad' : 'dim']);
    o.rows.pWar = act('sala de guerra', '0%', ['prioridade: estabilidade', k === 3 ? 'bad' : 'dim']);
    o.on[POL[k]] = k >= 2 ? 'bad' : 1; POL.forEach((p, i) => { if (i !== k) o.on[p] = 0; });
    o.beams.push(...CAB.pol.map((pts, i) => ({ pts, on: i === k, tone: i === k && k >= 2 ? 'bad' : '' })));
    T(o, [TX + TW + 6, TY + TD + 8, PL + FB + FH * 0.5 + 6], '50%', 'dim'); T(o, [TX + TW + 6, TY + TD + 8, PL + FB + FH * 0.1 + 6], '10%', 'bad');
  }
  const INC = [
    { nm: 'iSP', name: 'queda de SP', meta: 'MÓDULO 27', conta: '9,9/s × 65 s = 643,5', v: 643.5, p: '4,97%' },
    { nm: 'iPSP', name: 'PSP-A sem proteção', meta: 'MÓDULO 21', conta: '30/s × 90 s = 2.700', v: 2700, p: '20,8%' },
    { nm: 'i1063', name: 'episódio do 1063', meta: 'AULA 2', conta: '8 acima de 800 ms', v: 8, p: '0,06%' },
  ];
  // done = quantos já queimaram; cur = o que está queimando agora (f = progresso)
  function incidents(o, done, cur = -1, f = 0) {
    INC.forEach((I, i) => { show(o, I.nm); const burnt = i < done || (i === cur && f >= 1), now = i === cur && f < 1 && f > 0;
      o.rows[I.nm] = act(I.name, I.meta, [I.conta, 'dim'], [burnt ? `queimou ${I.p}` : now ? 'queimando…' : 'ainda não', burnt || now ? 'bad' : 'dim']);
      if (burnt || now) bad(o, I.nm);
      o.beams.push({ pts: CAB.drain[i], tone: now ? 'bad' : '', on: 0, flow: now }); });
  }
  const LV = [1, 1 - 643.5 / BUD, 1 - 3343.5 / BUD, 1 - 3351.5 / BUD];
  // SLO: as células com a fração (fr) e o valor do passo
  const CELLN = { mkt: 'celula-mkt', sp: 'celula-sp', rio: 'celula-rio', rec: 'celula-recife' };
  const CFR = { mkt: '40%', sp: '33%', rio: '15%', rec: '12%' };
  function cells(o, vals, lv, tone = {}) {
    CELL.forEach((c, k) => { const nm = 'c_' + c; show(o, nm); const tn = tone[c] || '';
      o.rows[nm] = act(CELLN[c], CFR[c], [vals[k], tn === 'bad' ? 'bad' : 'acc']); if (tn === 'bad') bad(o, nm); else o.on[nm] = tn === 'on' ? 1 : 2;
      if (lv[k] > 0) o.bars['cb_' + c] = [lv[k], tn === 'bad' ? 'bad' : '']; });
  }
  // USE: réplicas com a utilização (u em %)
  function reps(o, hot = true, lab = true) {
    for (let k = 0; k < 10; k++) { const nm = 'rep' + k, h = k === 2 && hot; show(o, nm);
      o.rows[nm] = act('catalogo-' + (k + 1), '', [lab ? (h ? '99%' : '64%') : '', h ? 'bad' : 'dim']);
      if (h) bad(o, nm); else o.on[nm] = 2; o.bars['ub' + k] = [h ? 0.99 : 0.64, h ? 'bad' : '']; }
  }
  // o pool: 20 casas; c = checkout, s = status, r = relatório
  const poolCells = n => { const c = Array(20).fill(''); for (let i = 0; i < n; i++) c[i] = 'r'; return c; };

  // ── o que se vê em cada passo ──
  const STEPS = {
    orcamento: [
      { id: 'mes', dur: 6, title: 'O orçamento do mês: 12.960 ruins', yk: 'O TANQUE CHEIO',
        code: ['30 dias = 2.592.000 s', '5 pedidos/s × 2.592.000 = 12.960.000', 'SLO 99,9%: sobra 0,1%', '0,1% = 12.960 requisições ruins', '  = 43,2 min de queda total'],
        story: 'O tanque é o <b>orçamento de erro</b> do mês. O SLO de 99,9% deixa 0,1% de folga: em 30 dias, a 5 pedidos por segundo, são <b>12.960.000</b> requisições, e 0,1% delas são <b>12.960</b> ruins, ou <b>43,2 min</b> de loja fora do ar. À esquerda estão três incidentes dos módulos anteriores, e cada um vai beber do tanque.',
        look: 'O tanque cheio; à direita, a política acesa em "publicar normal"; as faixas marcam 50% e 10%.',
        key: 'O orçamento é o que sobra entre a meta e 100%.',
        f(o) { tankBase(o, 1); incidents(o, 0);
          o.cnt = [['ORÇAMENTO', '12.960 ruins'], ['EM MINUTOS', '43,2 min', 'dim'], ['SOBRA', '100%', 'dim']];
          o.res = [['tanque cheio: publicar normal', 'acc']]; } },
      { id: 'sp', dur: 7, title: 'A queda de SP queima 4,97%', yk: 'MÓDULO 27: 65 s DE RTO', act: ['Queda de SP', 'módulo 27'],
        code: ['queda de SP: 65 s de RTO (módulo 27)', 'celula-sp: 9,9 pedidos/s', '9,9 × 65 = 643,5 ruins', '643,5 ÷ 12.960 = 4,97%', 'sobra: 95,0% (41,1 min)'],
        story: 'A queda de SP do módulo 27: <b>65 s</b> até a célula voltar, com <b>9,9 pedidos/s</b>. São <b>643,5</b> pedidos ruins, <b>4,97%</b> do mês. A conta é simplificada: compara a taxa da <code>celula-sp</code> com um orçamento calculado a 5 pedidos/s de média. O tanque baixa um pouco e a política continua em "publicar".',
        look: 'O cano da queda de SP fica vermelho e o líquido desce até 95%.',
        key: 'Uma queda de 65 s custa um vigésimo do mês.',
        f(o, t) { const f = lin(t, 0.6, 3, 0, 1), lv = LV[0] + (LV[1] - LV[0]) * f; tankBase(o, lv); incidents(o, 0, 0, f);
          o.cnt = [['QUEIMOU', f >= 1 ? '4,97%' : pct(1 - lv, 2), 'bad'], ['FALHAS', thou(643.5 * f), 'dim'], ['SOBRA', left(lv), 'dim']];
          o.res = f >= 1 ? [['sobram 95,0%: publicar', 'acc']] : [['queimando…', 'bad']]; } },
      { id: 'psp', dur: 7, title: 'O PSP-A sem proteção queima 20,8%', yk: 'MÓDULO 21: 90 s A 100% DE ERRO', act: ['PSP sem proteção', 'módulo 21'],
        code: ['PSP-A fora 90 s, sem breaker (módulo 21)', '30 pedidos/s × 90 s = 2.700 ruins', '2.700 ÷ 12.960 = 20,8%', 'burn rate: 1 ÷ 0,001 = 1.000×', 'sobra: 74,2% (32,1 min)'],
        story: 'O incidente do PSP-A, sem o <i>breaker</i> e sem o <i>fallback</i> do módulo 21: 90 s a 100% de erro, a 30 pedidos/s. São <b>2.700</b> falhas, <b>20,8%</b> do mês, em um minuto e meio. O <i>burn rate</i> desse incidente é <b>1.000×</b>: ele gasta o orçamento mil vezes mais rápido que o previsto.',
        look: 'O cano do PSP-A fica vermelho e o líquido cai até 74%, ainda acima da faixa de 50%.',
        key: 'Um incidente desses come um quinto do mês em 90 s.',
        f(o, t) { const f = lin(t, 0.6, 3.4, 0, 1), lv = LV[1] + (LV[2] - LV[1]) * f; tankBase(o, lv); incidents(o, 1, 1, f);
          o.cnt = [['QUEIMOU', f >= 1 ? '20,8%' : pct((LV[1] - lv), 1), 'bad'], ['FALHAS', thou(2700 * f), 'dim'], ['SOBRA', left(lv), 'dim']];
          o.res = f >= 1 ? [['sobram 74,2%: publicar', 'acc']] : [['queimando a 1.000×…', 'bad']]; } },
      { id: '1063', dur: 7, title: 'O 1063 queima 0,06%, e não acha nada', yk: 'AULA 2: OS 8 PEDIDOS LENTOS', act: ['O episódio do 1063', 'aula 2'],
        code: ['episódio do 1063 (aula 2)', '8 pedidos acima de 800 ms', '8 ÷ 12.960 = 0,06%', 'nenhum alerta: 5,3× em 5 min', 'sobra: 74,1% (32,0 min)'],
        story: 'O episódio da Lena: <b>8</b> pedidos acima de 800 ms, entre eles o 1063. Custou <b>0,06%</b> do mês, quase nada, e por isso não acendeu alarme nenhum (5,3× em 5 min, abaixo de 14,4×). O orçamento mede o <b>estrago</b>; quem achou o <code>holder</code> foi a investigação da aula 2.',
        look: 'O cano do 1063 pinga por um instante; o nível quase não se mexe.',
        key: 'O orçamento mede o estrago, mas não diz onde ele está.',
        f(o, t) { const f = lin(t, 0.6, 2.2, 0, 1), lv = LV[2] + (LV[3] - LV[2]) * f; tankBase(o, lv); incidents(o, 2, 2, f);
          o.cnt = [['QUEIMOU', f >= 1 ? '0,06%' : '…', 'bad'], ['FALHAS', String(Math.round(8 * f)), 'dim'], ['SOBRA', left(lv), 'dim']];
          o.res = [['sobram 74,1%: publicar', 'acc']]; } },
      { id: 'burn', dur: 9, title: 'Burn rate: a velocidade da queima', yk: 'CONSUMO = BURN × JANELA ÷ PERÍODO', act: ['Ver o burn rate', 'as três janelas'],
        code: ['período: 30 dias = 720 h', '14,4 × 1 h ÷ 720 = 2%    página', '6 × 6 h ÷ 720 = 5%       página', '1 × 72 h ÷ 720 = 10%     ticket', '5% em 1 h exigiria 36×'],
        story: 'O <i>burn rate</i> é a velocidade: <b>1×</b> gasta o tanque exatamente em 30 dias; 2× o gasta em 15. Três regras do SRE Workbook, num mês novo: <b>14,4× por 1 h</b> come 2% e vira página; <b>6× por 6 h</b> come 5% e também é página; <b>1× por 3 dias</b> come 10% e vira <i>ticket</i>. As páginas exigem a janela longa <b>e</b> a curta (5 min, 30 min), para o alerta parar quando o problema para.',
        look: 'As três janelas acendem em sequência; o tanque cheio desce 2%, 5% e 10%.',
        key: 'O burn rate liga o orçamento ao alerta.',
        f(o, t) { const k = Math.floor(t / 3) % 3, c = [0.02, 0.05, 0.10][k], f = lin(t % 3, 0.3, 1.6, 0, 1), lv = 1 - c * f; tankBase(o, lv);
          const W3 = [['w1h', '14,4× · 1 h', 'E 5 MIN', 'consome 2%', 'página'], ['w6h', '6× · 6 h', 'E 30 MIN', 'consome 5%', 'página'], ['w3d', '1× · 3 dias', '', 'consome 10%', 'ticket']];
          W3.forEach(([nm, a, m, r1, r2], i) => { show(o, nm); o.rows[nm] = act(a, m, [r1, i === k ? 'acc' : 'dim'], [r2, i === k && i < 2 ? 'bad' : 'dim']);
            if (i === k) lit(o, nm); else o.on[nm] = 2; o.beams.push({ pts: CAB.drain[i], on: i === k, flow: i === k }); });
          o.cnt = [['BURN', ['14,4×', '6×', '1×'][k]], ['JANELA', ['1 h e 5 min', '6 h e 30 min', '3 dias'][k], 'dim'], ['CONSOME', ['2% · página', '5% · página', '10% · ticket'][k], k < 2 ? 'bad' : 'dim']];
          o.res = [[['14,4 × 1 ÷ 720 = 2%', '6 × 6 ÷ 720 = 5%', '1 × 72 ÷ 720 = 10%'][k], 'acc']]; } },
      { id: 'politica', dur: 9, title: 'A política: o orçamento manda no deploy', yk: 'TRÊS PSPs SEM PROTEÇÃO NO MÊS', act: ['Três PSPs no mês', 'a política reage'],
        code: ['> 50%: publicar normal', '50% a 10%: só correções, canary lento', '< 10%: congela o que não é correção', '0%: sala de guerra', '3 × 2.700 = 8.100 = 62,5% do mês'],
        story: 'Uma política possível (é um exemplo): com mais de <b>50%</b> sobrando, publica-se normal; entre 50% e 10%, só correções e <i>canary</i> lento (módulo 22); abaixo de <b>10%</b>, congela-se o que não é correção; no zero, sala de guerra. Num mês com <b>três</b> PSPs sem proteção, saem 8.100 do tanque: sobra <b>37,5%</b>, e a loja entra na faixa de cautela.',
        look: 'O tanque desce em três degraus; a luz da política desce de "publicar" para "só correções".',
        key: 'Velocidade × estabilidade, decidido por um número.',
        f(o, t) { const F = [0, 1, 2].map(i => lin(t, 0.8 + 2.2 * i, 2 + 2.2 * i, 0, 1)), lvv = 1 - 2700 * (F[0] + F[1] + F[2]) / BUD; tankBase(o, lvv);
          INC.forEach((I, i) => { show(o, I.nm); const f = F[i], now = f > 0 && f < 1;
            o.rows[I.nm] = act(`PSP-A, ${i + 1}ª vez`, 'SEM BREAKER', ['30/s × 90 s = 2.700', 'dim'], [f >= 1 ? 'queimou 20,8%' : now ? 'queimando…' : 'ainda não', f > 0 ? 'bad' : 'dim']);
            if (f > 0) bad(o, I.nm); o.beams.push({ pts: CAB.drain[i], tone: now ? 'bad' : '', flow: now }); });
          o.cnt = [['SOBRA', pct(lvv)], ['QUEIMADO', thou(BUD * (1 - lvv)), 'bad'], ['POLÍTICA', lvv > 0.5 ? 'publicar' : 'só correções', lvv > 0.5 ? 'dim' : 'bad']];
          o.res = lvv <= 0.375 + 1e-6 ? [['sobra 37,5%: só correções', 'bad']] : [['publicar normal', 'acc']]; } },
      { id: 'frete', dur: 9, title: 'E se der errado: o SLI que conta o frete 0,00 como bom', yk: 'O SLI MEDE A COISA ERRADA', act: ['Publicar a 2.5.0', 'frete 0,00'],
        code: ['2.5.0 (módulo 22): 201, rápido, frete 0,00', 'bom = 2xx e ≤ 800 ms → conta como bom', 'orçamento queimado: 0', 'perda: R$ 15,00 por pedido em Recife', 'conserto: SLI de negócio', '  pedidos_frete_zero_total{cidade}'],
        story: 'A <code>2.5.0</code> do módulo 22 devolve <code>201</code>, rápido, com frete <b>0,00</b>. Pela definição do SLI (2xx e até 800 ms), cada pedido desses é <b>bom</b>. O tanque não desce, o painel do SLO segue verde e a loja perde <b>R$ 15,00</b> por pedido em Recife. O SLI precisa medir o que o cliente e o negócio chamam de certo: a razão de <code>pedidos_frete_zero_total</code>, ou um <i>diff</i> contra a 2.4.0.',
        look: 'Os pedidos da 2.5.0 entram no tanque como "bons"; o nível não se mexe.',
        key: 'Se o defeito conta como bom, o orçamento não o vê.',
        f(o) { tankBase(o, LV[3]); show(o, 'fr250'); bad(o, 'fr250');
          o.rows.fr250 = act('pedidos 2.5.0', 'MÓDULO 22', ['201 em 0,3 s', 'dim'], ['frete Recife: 0,00', 'bad'], ['SLI: bom', 'acc']);
          o.beams.push({ pts: CAB.frete, on: 1, flow: 0 }); tokens(o, CAB.frete, 1.2, () => ['201 · frete 0,00', 'acc']);
          o.cnt = [['QUEIMADO PELO FRETE', '0'], ['SLI DO PEDIDO', 'bom', 'dim'], ['PERDA', 'R$ 15,00/pedido', 'bad']];
          o.res = [['tanque parado, loja perdendo', 'bad']]; } },
    ],
    slo: [
      { id: 'sli', dur: 8, title: 'SLI: bons ÷ válidos', yk: 'A MEDIDA',
        code: ['SLI = bons ÷ válidos (POST /pedidos)', 'bom: status 2xx e duração ≤ 800 ms', 'válido: tudo, menos', '  422 do cliente, 409 esgotado, 429 tenant', 'o 1063: 201 em 1,9 s → ruim'],
        story: 'O primeiro degrau é a <b>medida</b>. O SLI do <code>POST /pedidos</code> é uma razão: <b>bons ÷ válidos</b>. Bom é <code>2xx</code> <b>e</b> em até <b>800 ms</b>. Válido é tudo, menos o que a loja escolheu recusar: o <code>422</code> do cliente, o <code>409</code> de esgotado (módulo 11) e o <code>429</code> do tenant (módulo 25). O 1063 da Lena, <code>201</code> em 1,9 s, conta como <b>ruim</b>.',
        look: 'As fichas sobem para o SLI: amarelas são boas, vermelhas são ruins, cinza ficam fora da conta.',
        key: 'O SLI define o que conta como bom.',
        f(o) { show(o, 'sli', 'req'); lit(o, 'sli', 'req');
          o.rows.sli = act('SLI', 'A MEDIDA', ['bons ÷ válidos', 'acc'], ['bom: 2xx e ≤ 800 ms', 'dim'], ['fora: 422 · 409 · 429', 'dim']);
          o.rows.req = act('POST /pedidos', 'ENTRADA', ['5 pedidos/s', 'dim']);
          const K = [['201 · 0,3 s', 'acc'], ['201 · 1,9 s', 'bad'], ['422', 'gray'], ['201 · 0,2 s', 'acc'], ['503', 'bad'], ['409', 'gray'], ['201 · 0,3 s', 'acc'], ['429', 'gray']];
          o.beams.push({ pts: CAB.req, on: 1 }); tokens(o, CAB.req, 1.3, k => K[((k % 8) + 8) % 8], 1.8);
          o.cnt = [['SLI', 'bons ÷ válidos'], ['BOM', '2xx e ≤ 800 ms', 'dim'], ['FORA DA CONTA', '422 · 409 · 429', 'dim']];
          o.res = [['o 1063 (1,9 s) é ruim', 'bad']]; } },
      { id: 'slo', dur: 7, title: 'SLO: 99,9% em 30 dias', yk: 'A META', act: ['Pôr a meta', '99,9%'],
        code: ['30 dias = 43.200 min', '0,1% × 43.200 = 43,2 min', '0,1% × 12.960.000 = 12.960 ruins', 'metas do módulo 24: erros ≤ 0,1%', '  e p95 ≤ 800 ms'],
        story: 'O segundo degrau é a <b>meta</b>: <b>99,9%</b> em 30 dias, as metas do módulo 24 (erros até 0,1%, p95 até 800 ms). É interna: o time decide com ela. Em minutos, são <b>43,2 min</b> de falha no mês; em pedidos, <b>12.960</b> ruins.',
        look: 'O degrau do SLO sobe ao lado do SLI.',
        key: 'O SLO é a meta que o time usa para decidir.',
        f(o) { show(o, 'sli', 'slo'); o.on.sli = 2; lit(o, 'slo');
          o.rows.sli = act('SLI', 'A MEDIDA', ['bons ÷ válidos', 'acc'], ['bom: 2xx e ≤ 800 ms', 'dim']);
          o.rows.slo = act('SLO', 'A META', ['99,9% em 30 dias', 'acc'], ['43,2 min de falha', 'dim'], ['= 12.960 ruins', 'dim']);
          o.beams.push({ pts: CAB.s12, on: 1, flow: 1 });
          o.cnt = [['SLO', '99,9%'], ['FALHA PERMITIDA', '43,2 min', 'dim'], ['RUINS NO MÊS', '12.960', 'dim']];
          o.res = [['meta interna: 43,2 min', 'acc']]; } },
      { id: 'sla', dur: 7, title: 'SLA: 99,5% com o mkt-01', yk: 'O CONTRATO', act: ['Assinar o SLA', 'mkt-01'],
        code: ['SLA com o mkt-01: 99,5% por mês', '0,5% × 43.200 = 216 min (3 h 36)', 'SLO 43,2 min < SLA 216 min', 'folga: 216 − 43,2 = 172,8 min', 'o SLO estoura muito antes do contrato'],
        story: 'O terceiro degrau é o <b>contrato</b>: com o <code>mkt-01</code>, a loja assinou <b>99,5%</b> por mês, ou <b>216 min</b> (3 h 36) de falha. O SLA é <b>menos</b> exigente que o SLO, de propósito: o SLO de 43,2 min estoura muito antes, e o time reage com 172,8 min de folga até a multa.',
        look: 'O degrau do SLA, o mais alto, fecha a escada; os três ficam acesos.',
        key: 'O SLO mais exigente que o SLA é a blindagem do contrato.',
        f(o) { show(o, 'sli', 'slo', 'sla'); o.on.sli = 2; o.on.slo = 2; lit(o, 'sla');
          o.rows.sli = act('SLI', 'A MEDIDA', ['bons ÷ válidos', 'acc'], ['bom: 2xx e ≤ 800 ms', 'dim']);
          o.rows.slo = act('SLO', 'A META', ['99,9% em 30 dias', 'acc'], ['43,2 min de falha', 'dim']);
          o.rows.sla = act('SLA', 'O CONTRATO', ['99,5% · mkt-01', 'acc'], ['216 min (3 h 36)', 'dim'], ['folga: 172,8 min', 'dim']);
          o.beams.push({ pts: CAB.s12, on: 1 }, { pts: CAB.s23, on: 1, flow: 1 });
          o.cnt = [['SLA', '99,5%'], ['FALHA NO CONTRATO', '216 min', 'dim'], ['FOLGA', '172,8 min', 'dim']];
          o.res = [['SLO (43,2) blinda o SLA (216)', 'acc']]; } },
      { id: 'celulas', dur: 7, title: 'O orçamento por célula', yk: '12.960 PELAS FRAÇÕES DO MÓDULO 26', act: ['Dividir por célula', 'módulo 26'],
        code: ['12.960 pelas frações das células', 'celula-mkt 40% = 5.184', 'celula-sp 33% = 4.276,8', 'celula-rio 15% = 1.944', 'celula-recife 12% = 1.555,2'],
        story: 'As 12.960 ruins se dividem pelas frações das células (módulo 26): <code>celula-mkt</code> <b>5.184</b>, <code>celula-sp</code> <b>4.276,8</b>, <code>celula-rio</code> <b>1.944</b> e <code>celula-recife</code> <b>1.555,2</b>. A célula da Lena tem o <b>menor</b> orçamento absoluto: o mesmo incidente o consome mais depressa.',
        look: 'Uma barra por célula, com a altura do orçamento; a de Recife é a mais baixa.',
        key: 'Cada célula tem o seu tanque.',
        f(o) { show(o, 'sli', 'slo', 'sla'); ['sli', 'slo', 'sla'].forEach(n => o.on[n] = 2);
          o.rows.sli = act('SLI', 'A MEDIDA', ['bons ÷ válidos', 'acc']); o.rows.slo = act('SLO', 'A META', ['99,9% · 12.960', 'acc']); o.rows.sla = act('SLA', 'O CONTRATO', ['99,5% · mkt-01', 'acc']);
          o.beams.push({ pts: CAB.s12, on: 1 }, { pts: CAB.s23, on: 1 });
          cells(o, ['5.184', '4.276,8', '1.944', '1.555,2'], [1, 0.825, 0.375, 0.3], { rec: 'on' });
          o.cnt = [['celula-recife', '1.555,2'], ['celula-mkt', '5.184', 'dim'], ['TOTAL', '12.960', 'dim']];
          o.res = [['Recife: o menor tanque', 'acc']]; } },
      { id: 'cem', dur: 8, title: 'E se der errado: o SLO de 100%', yk: 'NUNCA 100%', act: ['Pedir 100%', 'nenhum erro'],
        code: ['SLO 100% → orçamento 0', 'nenhuma publicação, nenhuma manutenção', 'o 1º incidente, mesmo de 1 s, quebra a meta', 'cada nove a mais divide por 10', '99,99% = 4,32 min · 100% = 0'],
        story: 'Alguém pede <b>100%</b>. O orçamento vira <b>zero</b>: nenhum erro em 30 dias significa nenhuma publicação, nenhuma manutenção, nenhuma tolerância. O primeiro incidente, mesmo de 1 s, quebra a meta. Cada nove a mais já corta o orçamento em 10 (99,99% são 4,32 min); 100% corta tudo. O artigo pede noves, nunca 100%.',
        look: 'As barras das células somem e o degrau do SLO fica vermelho.',
        key: 'Uma meta de 100% proíbe qualquer mudança.',
        f(o, t) { const z = t > 1.2; show(o, 'sli', 'slo', 'sla'); o.on.sli = 2; o.on.sla = 2; if (z) bad(o, 'slo'); else lit(o, 'slo');
          o.rows.sli = act('SLI', 'A MEDIDA', ['bons ÷ válidos', 'acc']); o.rows.sla = act('SLA', 'O CONTRATO', ['99,5% · mkt-01', 'acc']);
          o.rows.slo = act('SLO', 'A META', [z ? '100% em 30 dias' : '99,9% em 30 dias', z ? 'bad' : 'acc'], [z ? 'orçamento: 0' : '12.960 ruins', z ? 'bad' : 'dim'], [z ? 'deploy: proibido' : '', 'bad']);
          o.beams.push({ pts: CAB.s12, on: !z, tone: z ? 'bad' : '' }, { pts: CAB.s23, on: 1 });
          const f = z ? 0 : 1; cells(o, z ? ['0', '0', '0', '0'] : ['5.184', '4.276,8', '1.944', '1.555,2'], [f, 0.825 * f, 0.375 * f, 0.3 * f], z ? { mkt: 'bad', sp: 'bad', rio: 'bad', rec: 'bad' } : {});
          o.cnt = [['ORÇAMENTO', z ? '0' : '12.960', z ? 'bad' : ''], ['DEPLOYS', z ? 'nenhum' : 'liberados', z ? 'bad' : 'dim'], ['1º INCIDENTE', z ? 'quebra a meta' : '—', z ? 'bad' : 'dim']];
          o.res = z ? [['100% = nenhuma mudança', 'bad']] : []; } },
    ],
    use: [
      { id: 'frota', dur: 6, title: 'A frota do catálogo a 67,5%', yk: 'BLACK FRIDAY, 20:03 (MÓDULO 14)',
        code: ['10 réplicas do catalogo, 640 req/s', 'utilização média: 67,5%', 'erros: 1% de 504', 'pela média, tudo tranquilo', 'USE: Utilização, Saturação, Erros'],
        story: 'O USE de Brendan Gregg é um roteiro para <b>recursos</b>: para cada um (CPU, memória, disco, rede, pools e filas), três perguntas, <b>Utilização</b>, <b>Saturação</b> e <b>Erros</b>. Comece pela frota do catálogo na Black Friday, às 20:03: o painel da frota mostra <b>67,5%</b> de utilização. Parece saudável.',
        look: 'Um bloco só, a frota, com a utilização média num medidor.',
        key: 'A média da frota é um número tranquilo.',
        f(o) { show(o, 'frota'); lit(o, 'frota');
          o.rows.frota = act('frota catalogo', '10 RÉPLICAS', ['utilização: 67,5%', 'acc'], ['640 req/s', 'dim']); o.rows.frota.meter = { f: 0.675 };
          o.cnt = [['UTILIZAÇÃO MÉDIA', '67,5%'], ['RÉPLICAS', '10', 'dim'], ['TRÁFEGO', '640 req/s', 'dim']];
          o.res = [['parece saudável', 'dim']]; } },
      { id: 'replica', dur: 7, title: 'U: a catalogo-3 a 99%', yk: 'UTILIZAÇÃO, POR INSTÂNCIA', act: ['Abrir por réplica', '10 barras'],
        code: ['9 réplicas a 64%', 'a catalogo-3 a 99%', 'média: (9 × 64 + 99) ÷ 10 = 67,5%', 'a média esconde a réplica', 'olhe por instância, depois agregue'],
        story: 'Abra a frota por réplica: <b>nove</b> estão a <b>64%</b> e a <code>catalogo-3</code> a <b>99%</b>. A média, (9 × 64 + 99) ÷ 10 = <b>67,5%</b>, esconde a única que importa. O USE se aplica a <b>cada instância</b>, e só depois se agrega.',
        look: 'Dez barras; a terceira, vermelha, quase no topo.',
        key: 'A média da frota esconde a réplica saturada.',
        f(o) { reps(o); show(o, 'frota'); o.on.frota = 2;
          o.rows.frota = act('frota catalogo', 'MÉDIA', ['utilização: 67,5%', 'dim'], ['a catalogo-3: 99%', 'bad']); o.rows.frota.meter = { f: 0.675 };
          o.cnt = [['catalogo-3', '99%', 'bad'], ['AS OUTRAS 9', '64%', 'dim'], ['MÉDIA DA FROTA', '67,5%', 'dim']];
          o.res = [['1 em 10 vive na réplica a 99%', 'bad']]; } },
      { id: 'fila', dur: 8, title: 'S e E: a fila e os 504', yk: 'LITTLE: L = λ × W (MÓDULO 14)', act: ['Ver a fila', 'saturação'],
        code: ['catalogo-3: 64 req/s × 1,01 s = 64,6', 'as outras: 2,4 em andamento cada', 'total da frota: 86,4', 'S: a fila que a utilização esconde', 'E: 1% de 504 a 640 req/s'],
        story: '<b>Saturação</b> é o trabalho que espera. Pela lei de Little, a <code>catalogo-3</code> tem 64 req/s × 1,01 s = <b>64,6</b> requisições em andamento, de <b>86,4</b> na frota; cada réplica saudável tem <b>2,4</b>. <b>Erros</b>: 1% de <code>504</code> a 640 req/s. Qualquer das três perguntas, sozinha, aponta a réplica certa. A média, não.',
        look: 'Uma pilha alta na frente da catalogo-3; uma ficha só na frente de cada outra.',
        key: 'A saturação mostra o que a utilização esconde.',
        f(o, t) { reps(o); const f = lin(t, 0.6, 3, 0, 1);
          for (let k = 0; k < 10; k++) o.piles.push(k === 2 ? { p: [RX(k) + 38, 288, PL + 2], v: 1, f: f, txt: dec(64.6 * f) + '\nem voo' } : { p: [RX(k) + 38, 288, PL + 2], v: 1, f: 0.01, txt: '2,4', tone: 'acc' });
          if (t > 3) T(o, [RX(2) + 38, 200, 120], '1% de 504', 'bad');
          o.cnt = [['EM ANDAMENTO', dec(64.6 * f), 'bad'], ['CADA SAUDÁVEL', '2,4', 'dim'], ['ERROS', '1% de 504', 'bad']];
          o.res = f >= 1 ? [['64,6 de 86,4 na catalogo-3', 'bad']] : [['enchendo a fila…', 'bad']]; } },
      { id: 'pool', dur: 9, title: 'O pool de 20 também é recurso', yk: 'MÓDULO 25: O RELATÓRIO DAS 23:00', act: ['Ligar o relatório', 'pool de 20'],
        code: ['sem relatório: 0,4 de 20 = 2%', 'relatório 23:00: 40,4 pedidas > 20', 'U = em uso ÷ 20 = 100%', 'S = db_pool_waiting (a fila)', 'E = 503 do pool cheio', '  33% do checkout · 10% do status'],
        story: 'O pool de <b>20 conexões</b> do módulo 25 é um recurso como a CPU. Sem o relatório, o cliente usa <b>0,4</b> de 20 (2%). Às 23:00 o relatório pede 40, e a demanda vira <b>40,4</b>: <b>U</b> = 100%; <b>S</b> = quem espera uma vaga, <code>db_pool_waiting</code>; <b>E</b> = os <code>503</code> do pool cheio, <b>33%</b> do checkout e <b>10%</b> do status. O USE descreve o problema sem precisar saber a causa.',
        look: 'O relatório enche as 20 casas; o quadro do USE fica vermelho nas três linhas.',
        key: 'Pool cheio: 100%, fila e 503 em três linhas.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 3, 0, 20)), full = n >= 20; show(o, 'prel', 'pchk', 'pool', 'puse');
          lit(o, 'prel'); if (full) bad(o, 'pool', 'pchk', 'puse'); else lit(o, 'pool', 'pchk', 'puse');
          o.rows.prel = act('relatório', '23:00', ['10/s × 4 s', 'dim'], ['pede 40 de 20', full ? 'bad' : 'acc']);
          o.rows.pchk = act('checkout · status', 'CLIENTE', ['0,4 em uso', 'dim'], [full ? '503: 33% · 10%' : '503: 0', full ? 'bad' : 'dim']);
          o.rows.pool = act('pool · 20 conexões', 'BANCO DO pedidos'); o.rows.pool.pool = { cells: poolCells(n), bad: full };
          o.rows.puse = full ? act('USE do pool', '', ['U: 100%', 'bad'], ['  (40,4 pedidas)', 'dim'], ['S: db_pool_waiting', 'bad'], ['E: 503', 'bad'], ['  33% chk · 10% sts', 'dim'])
            : act('USE do pool', '', [`U: ${n ? Math.round(n / 20 * 100) : 2}%`, 'acc'], ['S: 0 esperando', 'dim'], ['E: 0', 'dim']);
          o.beams.push({ pts: CAB.prel, on: 1, flow: 1, tone: full ? 'bad' : '' }, { pts: CAB.pchk, on: 1, flow: 1, tone: full ? 'bad' : '' }, { pts: CAB.puse, on: 1 });
          o.cnt = [['U', full ? '100%' : Math.round(n / 20 * 100) + '%', full ? 'bad' : 'acc'], ['S', full ? 'fila de espera' : '0', full ? 'bad' : 'dim'], ['E', full ? '503: 33% · 10%' : '0', full ? 'bad' : 'dim']];
          o.res = full ? [['três letras, um diagnóstico', 'bad']] : [['o relatório chegando…', 'dim']]; } },
      { id: 'celula', dur: 8, title: 'A tabela de recursos da célula', yk: 'U · S · E PARA CADA RECURSO', act: ['Montar a tabela', 'celula-recife'],
        code: ['para cada recurso da celula-recife:', 'U: quanto está em uso', 'S: quanto espera (a fila)', 'E: eventos de falha do recurso', 'o lag do consumidor também é S'],
        story: 'O percurso do USE: liste os recursos da célula e preencha <b>U</b>, <b>S</b> e <b>E</b> de cada um, antes de teorizar. Olhe primeiro o que está vermelho em S ou E. Repare no último: o <code>kafka_consumer_lag</code> é a saturação de um recurso que nem parece recurso; o atraso cresce sem a CPU subir. (Os valores são o modelo de leitura, não uma medição.)',
        look: 'Seis placas, uma por recurso, cada uma com as três perguntas; a do consumidor Kafka acesa.',
        key: 'Todo recurso responde às mesmas três perguntas.',
        f(o) { const R = [['rCpu', 'CPU', '% de uso', 'run queue, throttling', '(raros)'], ['rMem', 'memória', '% do limite', 'swap, pausas do GC', 'OOMKill'],
            ['rPool', 'pool do banco', 'em uso ÷ 20', 'db_pool_waiting', '503 de pool cheio'], ['rWal', 'disco do WAL', '% de I/O', 'fila de I/O, flush', 'erro de I/O'],
            ['rNet', 'rede', 'banda ÷ capacidade', 'drops, retransmissões', 'resets'], ['rKaf', 'consumidor Kafka', 'msgs/s ÷ capacidade', 'kafka_consumer_lag', 'mensagens na DLQ']];
          R.forEach(([nm, n, u, s, e]) => { show(o, nm); o.rows[nm] = act(n, 'RECURSO', ['U: ' + u, 'dim'], ['S: ' + s, nm === 'rKaf' ? 'acc' : 'dim'], ['E: ' + e, 'dim']); o.on[nm] = nm === 'rKaf' ? 1 : 2; });
          o.cnt = [['RECURSOS', '6'], ['PERGUNTAS', 'U · S · E', 'dim'], ['O ESCONDIDO', 'consumer lag', 'dim']];
          o.res = [['o lag é saturação', 'acc']]; } },
      { id: 'cego', dur: 8, title: 'E se der errado: o USE só vê recurso', yk: 'A 2.5.0 NO AR (MÓDULO 22)', act: ['Publicar a 2.5.0', 'frete 0,00'],
        code: ['2.5.0 no ar (módulo 22)', 'CPU 20% · pool 10% · disco e rede em paz', 'U, S, E: tudo bem', 'o pedidos devolve frete 0,00 em Recife', 'o defeito está no serviço: aula 9'],
        story: 'Com a <code>2.5.0</code> no ar, a CPU está a <b>20%</b>, o pool a <b>10%</b>, o disco e a rede em paz. Todo recurso responde bem às três perguntas. E o <code>pedidos</code> continua devolvendo frete <b>0,00</b> em Recife. O defeito está no <b>serviço</b>, e o USE não olha para lá. A aula 9 cobre esse buraco.',
        look: 'As seis placas acesas, sem vermelho; o rótulo do frete 0,00 flutua por cima.',
        key: 'Todos os recursos bem, e o serviço errado.',
        f(o, t) { const R = [['rCpu', 'CPU', 'U: 20%'], ['rMem', 'memória', 'U: normal'], ['rPool', 'pool do banco', 'U: 10% (2 de 20)'], ['rWal', 'disco do WAL', 'U: normal'], ['rNet', 'rede', 'U: normal'], ['rKaf', 'consumidor Kafka', 'lag: 0']];
          R.forEach(([nm, n, u]) => { show(o, nm); o.rows[nm] = act(n, 'OK', [u, 'acc'], ['S: 0', 'dim'], ['E: 0', 'dim']); lit(o, nm); });
          if (t > 1.5) T(o, [450, 280, 70], 'pedidos 2.5.0\nfrete Recife: 0,00', 'bad');
          o.cnt = [['CPU', '20%'], ['POOL', '10%', 'dim'], ['FRETE EM RECIFE', '0,00', 'bad']];
          o.res = t > 1.5 ? [['recursos bem, serviço errado', 'bad']] : [['tudo verde…', 'acc']]; } },
    ],
    red: [
      { id: 'rate', dur: 7, title: 'Rate: o pedidos por célula', yk: 'BLACK FRIDAY: 30 PEDIDOS/s',
        code: ['30 pedidos/s pelas frações do módulo 26', 'celula-mkt 40% = 12,0', 'celula-sp 33% = 9,9', 'celula-rio 15% = 4,5', 'celula-recife 12% = 3,6'],
        story: 'O RED (Tom Wilkie, Grafana) é o roteiro dos <b>serviços</b>: <b>Rate</b>, <b>Errors</b> e <b>Duration</b>. Comece pelo Rate do <code>pedidos</code> na Black Friday, cortado por célula: <b>12,0</b> na mkt, <b>9,9</b> em SP, <b>4,5</b> no Rio e <b>3,6</b> em Recife. Se só a mkt sobe, a pergunta é o que mudou nela; se as quatro sobem juntas, é a campanha.',
        look: 'O pedidos manda fichas para as quatro células; a altura de cada barra é o rate.',
        key: 'Um rate por célula separa a campanha do problema local.',
        f(o) { show(o, 'svc'); lit(o, 'svc'); o.rows.svc = act('pedidos', 'SERVIÇO', ['30 pedidos/s', 'acc'], ['R · E · D', 'dim']);
          cells(o, ['12,0/s', '9,9/s', '4,5/s', '3,6/s'], [1, 0.825, 0.375, 0.3]);
          o.beams.push({ pts: CAB.svc, on: 1 }, { pts: CAB.bus, on: 1 }, ...[0, 1, 2, 3].map(k => ({ pts: branch(k), on: 1, flow: 1 })));
          o.cnt = [['RATE', '30 pedidos/s'], ['celula-mkt', '12,0', 'dim'], ['celula-recife', '3,6', 'dim']];
          o.res = [['rate por célula', 'acc']]; } },
      { id: 'erros', dur: 7, title: 'Errors: tudo o que viola a expectativa', yk: 'ERRO SEMÂNTICO', act: ['Definir o erro', 'três famílias'],
        code: ['5xx e timeout', 'resposta inválida ou duplicada', 'o 201 com frete 0,00 (o sucesso errado)', '409, 422, 429: observados', '  no painel, fora do SLO'],
        story: 'O <b>erro</b> do RED se define pelo que o cliente espera. Na loja são três famílias: o <code>5xx</code> e o <i>timeout</i>; a resposta inválida ou duplicada; e o <b>sucesso errado</b>, o <code>201</code> com frete 0,00. Os <code>4xx</code> da loja (<code>409</code> esgotado, <code>422</code>, <code>429</code>) são decisões legítimas: aparecem no painel e ficam fora do SLO.',
        look: 'Três placas vermelhas de erro; a quarta, cinza, com os 4xx observados.',
        key: 'Todo código se monitora; nem todo código entra no SLO.',
        f(o) { show(o, 'e5xx', 'eInv', 'eFrete', 'e4xx'); bad(o, 'e5xx', 'eInv', 'eFrete'); o.on.e4xx = 2;
          o.rows.e5xx = act('5xx · timeout', 'ERRO', ['falha do servidor', 'bad'], ['ou passou do prazo', 'dim']);
          o.rows.eInv = act('inválida · duplicada', 'ERRO', ['resposta quebrada', 'bad'], ['pedido em dobro', 'dim']);
          o.rows.eFrete = act('sucesso errado', 'ERRO', ['201 com frete 0,00', 'bad'], ['a 2.5.0 (módulo 22)', 'dim']);
          o.rows.e4xx = act('409 · 422 · 429', 'OBSERVADO', ['decisão da loja', 'dim'], ['fora do SLO', 'dim']);
          o.cnt = [['ERROS', '3 famílias', 'bad'], ['4xx', 'observados', 'dim'], ['NO SLO', 'só os erros', 'dim']];
          o.res = [['erro escrito no domínio da loja', 'acc']]; } },
      { id: 'duracao', dur: 8, title: 'Duration: percentis do histograma', yk: 'POST /pedidos, 1.000 REQUISIÇÕES', act: ['Ver a duração', 'histograma'],
        code: ['buckets: 0,25 · 0,5 · 0,8 · 1 · 2,5 s', 'acumulado: 400 · 975 · 992 · 992 · 1.000', 'p50 0,293 · p95 0,489 · p99 0,765 s', '8 lentos em 1.000: p99 não se mexe', 'percentil não se soma nem tira média'],
        story: 'A <b>duração</b> se lê em percentis, estimados do histograma (aula 3). Na janela de 1.000 requisições: <b>p50 0,293 s</b>, <b>p95 0,489 s</b>, <b>p99 0,765 s</b>, abaixo do SLO de 0,8 s. Os 8 pedidos lentos do 1063 ficam no <i>bucket</i> de 1 a 2,5 s e não movem o p99. Corte também por rota, por versão e por célula.',
        look: 'As barras do histograma; as linhas do p50, p95 e p99 e a do SLO em 0,8 s.',
        key: 'Duração é percentil, de um histograma, por corte.',
        f(o) { show(o, 'hist', 'pct'); lit(o, 'hist'); o.on.pct = 2;
          o.rows.hist = act('http_server_request_duration_seconds', 'POST /pedidos'); o.rows.hist.hist = 1;
          o.rows.pct = act('percentis', 'ESTIMADOS', ['p50    0,293 s', 'dim'], ['p95    0,489 s', 'acc'], ['p99    0,765 s', 'acc'], ['p99,9  2,3125 s', 'bad'], ['  (real ~1,9 s)', 'dim'], ['SLO    0,8 s', 'dim']);
          o.cnt = [['p95', '0,489 s'], ['p99', '0,765 s', 'dim'], ['SLO', '0,8 s', 'dim']];
          o.res = [['p99 dentro do SLO', 'acc']]; } },
      { id: 'versao', dur: 8, title: 'Por versão: a 2.5.0 ao lado da 2.4.0', yk: 'O CANARY DO MÓDULO 22', act: ['Cortar por versão', '2.4.0 × 2.5.0'],
        code: ['canary: 10% do tráfego na 2.5.0', 'R, E (5xx) e D: iguais nas duas', 'E de negócio: pedidos_frete_zero_total', '  ÷ total, por cidade e por versão', '2.5.0: 20% (Recife) com frete 0,00'],
        story: 'O <i>canary</i> do módulo 22 manda 10% do tráfego para a <code>2.5.0</code>. O RED por versão põe as duas lado a lado: o mesmo Rate, 0% de <code>5xx</code> e a mesma Duration. Só o <b>erro semântico</b>, a razão de <code>pedidos_frete_zero_total</code>, denuncia: <b>20%</b> dos pedidos da 2.5.0 (os de Recife) saem com frete 0,00.',
        look: 'Dois painéis iguais em R e D; a linha do frete zero acende vermelha na 2.5.0.',
        key: 'Por versão e com erro de negócio, a 2.5.0 aparece.',
        f(o, t) { const r = t > 1.6; show(o, 'v240', 'v250'); lit(o, 'v240'); if (r) bad(o, 'v250'); else lit(o, 'v250');
          o.rows.v240 = act('pedidos 2.4.0', '90% DO TRÁFEGO', ['R: 27 pedidos/s', 'dim'], ['E 5xx: 0%', 'acc'], ['E frete zero: 0%', 'acc'], ['D p95: igual', 'dim']);
          o.rows.v250 = act('pedidos 2.5.0', 'CANARY 10%', ['R: 3 pedidos/s', 'dim'], ['E 5xx: 0%', 'acc'], [r ? 'E frete zero: 20%' : 'E frete zero: …', r ? 'bad' : 'dim'], ['D p95: igual', 'dim']);
          o.cnt = [['FRETE ZERO NA 2.5.0', r ? '20%' : '…', 'bad'], ['5xx', '0% nas duas', 'dim'], ['DURAÇÃO', 'igual', 'dim']];
          o.res = r ? [['só o erro de negócio a pega', 'bad']] : []; } },
      { id: 'so5xx', dur: 8, title: 'E se der errado: erro = só 5xx, duração = média', yk: 'O PRIMEIRO PAINEL DE QUASE TODA EQUIPE', act: ['Só 5xx e média', 'o painel ingênuo'],
        code: ['erro = só 5xx · duração = só média', '2.5.0: 0% de 5xx, média igual: verde', 'frete 0,00 em Recife por 60 min', 'R$ 15,00 perdidos por pedido', 'RED com erro do domínio e percentil'],
        story: 'O painel que quase toda equipe monta primeiro: erro é <b>só</b> <code>5xx</code> e duração é <b>só</b> a média. Nele a <code>2.5.0</code> fica <b>verde</b>: nenhum <code>5xx</code>, média igual. A loja perde <b>R$ 15,00</b> por pedido em Recife por <b>60 min</b>. O RED só ajuda com o erro escrito no domínio da loja e a duração em percentil.',
        look: 'Os dois painéis acesos sem vermelho; o rótulo do prejuízo flutua sobre a 2.5.0.',
        key: 'Com erro = 5xx e média, o defeito fica verde.',
        f(o, t) { show(o, 'v240', 'v250'); lit(o, 'v240', 'v250');
          o.rows.v240 = act('pedidos 2.4.0', '90% DO TRÁFEGO', ['R: 27 pedidos/s', 'dim'], ['E (só 5xx): 0%', 'acc'], ['D (média): igual', 'acc']);
          o.rows.v250 = act('pedidos 2.5.0', 'CANARY 10%', ['R: 3 pedidos/s', 'dim'], ['E (só 5xx): 0%', 'acc'], ['D (média): igual', 'acc'], ['painel: verde', 'acc']);
          if (t > 1.4) T(o, [670, 300, 60], 'R$ 15,00 por pedido\nem Recife, 60 min', 'bad');
          o.cnt = [['PAINEL', 'verde'], ['PERDA', 'R$ 15,00/pedido', 'bad'], ['ATÉ NOTAR', '60 min', 'bad']];
          o.res = [['verde e errado', 'bad']]; } },
    ],
    golden: [
      { id: 'painel', dur: 7, title: 'Quatro mostradores para a celula-recife', yk: 'CELULA-RECIFE, BLACK FRIDAY',
        code: ['latência: p95 do sucesso 489 ms (SLO 800)', 'tráfego: 3,6 pedidos/s', 'erros: 0% de 5xx, frete zero 0', 'saturação: pool 0,4 de 20 (2%)', '  lag da réplica 0,3 s (alerta 0,5 s)'],
        story: 'Se só pudesse ter quatro números, o SRE book escolhe estes: <b>latência</b>, <b>tráfego</b>, <b>erros</b> e <b>saturação</b>. Na <code>celula-recife</code>: p95 do sucesso <b>489 ms</b> (SLO 800), <b>3,6</b> pedidos/s, <b>0%</b> de <code>5xx</code> e frete zero em 0, pool a <b>2%</b> e o lag da réplica em 0,3 s (alerta em 0,5 s). É RED + saturação, olhando o que o <b>usuário</b> sente.',
        look: 'Quatro mostradores lado a lado; nenhum no vermelho.',
        key: 'Quatro números descrevem o que o usuário sente.',
        f(o) { show(o, ...GS); GS.forEach(g => o.on[g] = 2);
          o.rows.gLat = act('latência', 'p95'); o.rows.gLat.lat = { rows: [['p95 sucesso', 489, 'acc']], max: 900, mark: 800 };
          o.rows.gTraf = act('tráfego', 'PEDIDOS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3,6/s', sub: 'de 30 na loja' };
          o.rows.gErr = act('erros', '5xx · NEGÓCIO'); o.rows.gErr.gauge = { f: 0, val: '0%', sub: 'frete zero: 0' };
          o.rows.gSat = act('saturação', 'O MAIS APERTADO'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0,4 de 20' };
          o.cnt = [['LATÊNCIA p95', '489 ms'], ['TRÁFEGO', '3,6/s', 'dim'], ['SATURAÇÃO', 'pool 2%', 'dim']];
          o.res = [['Recife saudável', 'acc']]; } },
      { id: 'breaker', dur: 8, title: 'O breaker abre e a média melhora', yk: 'MÉDIA = 0,3 × 2 + 0,7 × 275', act: ['Abrir o breaker', 'módulo 21'],
        code: ['breaker aberto (módulo 21)', '30% falham em 2 ms', '70% respondem em 275 ms', 'média = 0,3 × 2 + 0,7 × 275', '  = 193,1 ms (caiu de 275)'],
        story: 'O <i>breaker</i> do módulo 21 abre e recusa a chamada na hora: <b>30%</b> das requisições falham em <b>2 ms</b>; os outros 70% respondem nos <b>275 ms</b> de sempre. A latência média vira 0,3 × 2 + 0,7 × 275 = <b>193 ms</b>. Caiu de 275 para 193 enquanto 3 em cada 10 clientes recebem erro. Um painel com uma média só vê melhora.',
        look: 'A barra da média encolhe de 275 para 193 ms; o mostrador de erros sobe para 30%.',
        key: 'A média melhora com o sistema pior.',
        f(o, t) { const f = lin(t, 0.8, 3, 0, 1), avg = 275 - 81.9 * f; show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; lit(o, 'gLat'); if (f > 0) bad(o, 'gErr'); else o.on.gErr = 2;
          o.rows.gLat = act('latência', 'MÉDIA'); o.rows.gLat.lat = { rows: [['média', avg, 'acc']], max: 300 };
          o.rows.gTraf = act('tráfego', 'PEDIDOS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3,6/s', sub: 'de 30 na loja' };
          o.rows.gErr = act('erros', 'BREAKER'); o.rows.gErr.gauge = { f: 0.3 * f, val: Math.round(30 * f) + '%', sub: 'falha em 2 ms', tone: f > 0 ? 'bad' : '' };
          o.rows.gSat = act('saturação', 'O MAIS APERTADO'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0,4 de 20' };
          o.cnt = [['LATÊNCIA MÉDIA', Math.round(avg) + ' ms'], ['ANTES', '275 ms', 'dim'], ['FALHAM', Math.round(30 * f) + '%', 'bad']];
          o.res = f >= 1 ? [['193 ms: "melhorou"?', 'bad']] : [['o breaker abrindo…', 'dim']]; } },
      { id: 'separa', dur: 7, title: 'Duas curvas: o sucesso e o erro', yk: 'SRE BOOK: SEPARE AS LATÊNCIAS', act: ['Separar as latências', 'sucesso × erro'],
        code: ['duas curvas, não uma média', 'sucesso: 275 ms (o normal)', 'erro: 2 ms, em 30% das requisições', 'a do sucesso não mudou', 'a do erro mostra a falha rápida'],
        story: 'Separe as latências, como pede o SRE book (e ao contrário do que diz o artigo). A curva do <b>sucesso</b> continua em <b>275 ms</b>; a do <b>erro</b> mostra <b>2 ms</b> em 30% das requisições. O problema, que a média escondia, aparece.',
        look: 'Três barras: a média, o sucesso a 275 e o erro a 2 ms, em vermelho.',
        key: 'Latência do sucesso e do erro, sempre separadas.',
        f(o) { show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; lit(o, 'gLat'); bad(o, 'gErr');
          o.rows.gLat = act('latência', 'SEPARADA'); o.rows.gLat.lat = { rows: [['média', 193, 'dim'], ['sucesso', 275, 'acc'], ['erro (30%)', 2, 'bad']], max: 300 };
          o.rows.gTraf = act('tráfego', 'PEDIDOS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3,6/s', sub: 'de 30 na loja' };
          o.rows.gErr = act('erros', 'BREAKER'); o.rows.gErr.gauge = { f: 0.3, val: '30%', sub: 'falha em 2 ms', tone: 'bad' };
          o.rows.gSat = act('saturação', 'O MAIS APERTADO'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0,4 de 20' };
          o.cnt = [['SUCESSO', '275 ms'], ['ERRO', '2 ms', 'bad'], ['MÉDIA', '193 ms', 'dim']];
          o.res = [['o erro rápido aparece', 'acc']]; } },
      { id: 'lento', dur: 7, title: 'Um erro lento é pior que um rápido', yk: 'SRE BOOK, MONITORING DISTRIBUTED SYSTEMS', act: ['Erro lento', '8 s'],
        code: ['erro rápido (2 ms): tenta de novo', '  ou desiste', 'erro lento (8 s): uma conexão,', '  uma thread e a paciência presas', 'só se vê com as latências separadas'],
        story: 'O inverso também vale: <b>um erro lento é pior que um erro rápido</b>. Quem recebe o erro em 2 ms tenta de novo ou desiste; quem espera <b>8 s</b> por um erro já gastou uma conexão, uma <i>thread</i> e a paciência. Essa diferença só aparece com as duas latências separadas.',
        look: 'A barra do erro atravessa o mostrador: 8 s contra 275 ms do sucesso.',
        key: 'A latência do erro também importa.',
        f(o) { show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; bad(o, 'gLat', 'gErr');
          o.rows.gLat = act('latência', 'SEPARADA'); o.rows.gLat.lat = { rows: [['sucesso', 275, 'acc'], ['erro lento', 8000, 'bad']], max: 8000 };
          o.rows.gTraf = act('tráfego', 'PEDIDOS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3,6/s', sub: 'de 30 na loja' };
          o.rows.gErr = act('erros', 'LENTOS'); o.rows.gErr.gauge = { f: 0.3, val: '30%', sub: 'em 8 s cada', tone: 'bad' };
          o.rows.gSat = act('saturação', 'O MAIS APERTADO'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0,4 de 20' };
          o.cnt = [['ERRO LENTO', '8 s', 'bad'], ['ERRO RÁPIDO', '2 ms', 'dim'], ['SUCESSO', '275 ms', 'dim']];
          o.res = [['8 s presos por erro', 'bad']]; } },
      { id: 'previsao', dur: 8, title: 'Saturação com previsão', yk: 'O RECURSO MAIS APERTADO', act: ['Prever a saturação', 'disco'],
        code: ['saturação: o recurso mais apertado', '"o disco está a 80%": e daí?', '"o disco enche em 4 h": aja agora', 'a previsão vira alerta', '  antes do sintoma'],
        story: 'A saturação é o sinal para agir <b>antes</b>. "O disco está a 80%" não diz o que fazer; "<b>o disco enche em 4 h</b>" diz. O mostrador leva a tendência adiante e marca quando o recurso chega ao limite. Os outros sinais alimentam outras decisões: latência e erros dão o SLI da aula 7; o tráfego, o plano de capacidade do módulo 23.',
        look: 'O mostrador da saturação vira um gráfico: a linha sobe até 80% e a projeção tracejada toca 100% em 4 h.',
        key: 'Saturação boa é a que diz quando vai faltar.',
        f(o, t) { show(o, ...GS); GS.forEach(g => o.on[g] = 2); bad(o, 'gSat');
          o.rows.gLat = act('latência', 'p95'); o.rows.gLat.lat = { rows: [['p95 sucesso', 489, 'acc']], max: 900, mark: 800 };
          o.rows.gTraf = act('tráfego', 'PEDIDOS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3,6/s', sub: 'de 30 na loja' };
          o.rows.gErr = act('erros', '5xx · NEGÓCIO'); o.rows.gErr.gauge = { f: 0, val: '0%', sub: 'frete zero: 0' };
          o.rows.gSat = act('saturação', 'DISCO'); o.rows.gSat.fc = { now: 0.8, f: lin(t, 0.6, 3, 0, 1) };
          o.cnt = [['DISCO', '80%'], ['PREVISÃO', 'enche em 4 h', 'bad'], ['AÇÃO', 'agora', 'dim']];
          o.res = [['enche em 4 h', 'bad']]; } },
      { id: 'acumulo', dur: 8, title: 'E se der errado: monitoramento por acúmulo', yk: 'O OPOSTO DOS QUATRO SINAIS (ARTIGO)', act: ['Juntar 300 painéis', 'por acúmulo'],
        code: ['300 painéis, milhares de métricas', '"a loja está bem?": abra dez painéis', 'o modelo mental se perdeu', 'quatro sinais × quatro células', '  = 16 números para começar'],
        story: 'O artigo dá nome ao oposto: <b>monitoramento por acúmulo</b>. A equipe junta <b>300 painéis</b> e milhares de métricas; quando alguém pergunta "a loja está bem?", ninguém responde sem abrir dez deles. Quatro sinais por célula (<b>16 números</b>) não substituem os detalhes, mas dão por onde começar. USE para o recurso, RED para o serviço, os quatro sinais para o usuário.',
        look: 'Os quatro mostradores somem atrás de um mural de 300 quadradinhos piscando.',
        key: 'Mais painéis não respondem se a loja está bem.',
        f(o) { show(o, 'mural'); bad(o, 'mural'); o.rows.mural = act('300 painéis', '"A LOJA ESTÁ BEM?"'); o.rows.mural.mural = Math.floor(clk * 2.5);
          o.cnt = [['PAINÉIS', '300', 'bad'], ['"ESTÁ BEM?"', 'sem resposta', 'bad'], ['QUATRO SINAIS', '16 números', 'dim']];
          o.res = [['sem modelo mental', 'bad']]; } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, papel à direita, na primeira linha
    const y = s1 > 15 ? 13 : s1 > 13 ? 11 : 10;
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  const GRAF = () => theme === 'light' ? '#3f4448' : '#c9cdd0', PAPER = () => theme === 'light' ? '#f6f6f5' : '#141516', EMPTY = () => theme === 'light' ? '#ececeb' : '#17181a';
  const RELC = () => theme === 'light' ? '#5c3a2e' : '#9c7f6c';
  // o pool: 20 casas em 4 colunas × 5 fileiras
  function drawPool(x, u, C, p, W_, H_) {
    const top = 28, gh = H_ - top - 28, cw = (W_ - 16) / 4, rh = gh / 5;
    for (let i = 0; i < 20; i++) { const v = p.cells[i], X = 8 + (i % 4) * cw + 2, Y = top + Math.floor(i / 4) * rh + 2, w = cw - 4, h = rh - 4;
      x.fillStyle = v === 'r' ? (p.bad ? BAD() : RELC()) : EMPTY(); x.fillRect(u(X), u(Y), u(w), u(h));
      if (!v) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(w), u(h)); }
      else { x.fillStyle = PAPER(); x.textAlign = 'center'; fitFont(x, u, 'relatório', 10, w - 4); x.fillText('relatório', u(X + w / 2), u(Y + h / 2)); x.textAlign = 'left'; } }
    const n = p.cells.filter(Boolean).length, lab = n >= 20 ? '20 de 20 · cheio' : `${n} de 20 em uso`;
    x.textAlign = 'center'; x.fillStyle = n >= 20 ? BAD() : toneC('hi'); fitFont(x, u, lab, 13, W_ - 12); x.fillText(lab, u(W_ / 2), u(H_ - 12)); x.textAlign = 'left';
  }
  // um medidor horizontal na faixa da frente
  function drawMeter(x, u, C, m, W_, H_) {
    const y = H_ - 26, w = W_ - 12; x.fillStyle = EMPTY(); x.fillRect(u(6), u(y), u(w), u(14)); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(6), u(y), u(w), u(14));
    x.fillStyle = m.tone === 'bad' ? BAD() : accC(); x.fillRect(u(6), u(y), u(w * clamp(m.f)), u(14));
  }
  // mostrador: arco de 180°, ponteiro, valor grande e legenda
  function drawGauge(x, u, C, g, W_, H_) {
    const cx = W_ / 2, cy = 124, r = Math.min(W_ * 0.36, 66), a0 = Math.PI, f = clamp(g.f), col = g.tone === 'bad' ? BAD() : accC();
    x.lineCap = 'butt'; x.lineWidth = u(13); x.strokeStyle = EMPTY(); x.beginPath(); x.arc(u(cx), u(cy), u(r), a0, 2 * Math.PI); x.stroke();
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.arc(u(cx), u(cy), u(r + 6.5), a0, 2 * Math.PI); x.stroke(); x.beginPath(); x.arc(u(cx), u(cy), u(r - 6.5), a0, 2 * Math.PI); x.stroke();
    if (f > 0) { x.lineWidth = u(13); x.strokeStyle = col; x.beginPath(); x.arc(u(cx), u(cy), u(r), a0, a0 + Math.PI * Math.max(f, 0.012)); x.stroke(); }
    const an = a0 + Math.PI * f; x.strokeStyle = toneC('hi'); x.lineWidth = u(2.4); x.beginPath(); x.moveTo(u(cx), u(cy)); x.lineTo(u(cx + Math.cos(an) * (r - 4)), u(cy + Math.sin(an) * (r - 4))); x.stroke();
    x.fillStyle = toneC('hi'); x.beginPath(); x.arc(u(cx), u(cy), u(4), 0, 2 * Math.PI); x.fill();
    x.textAlign = 'center'; x.fillStyle = g.tone === 'bad' ? BAD() : toneC('hi'); fitFont(x, u, g.val, 26, W_ - 12); x.fillText(g.val, u(cx), u(cy + 26));
    x.fillStyle = INK(); fitFont(x, u, g.sub, 12, W_ - 12); x.fillText(g.sub, u(cx), u(cy + 48)); x.textAlign = 'left';
  }
  // a latência como barras (média, sucesso, erro) numa escala; mark = a linha do SLO
  function drawLat(x, u, C, l, W_, H_) {
    const x0 = 8, w = W_ - 16, top = 40, gap = Math.min(52, (H_ - top - 16) / l.rows.length);
    if (l.mark) { const mx = x0 + w * l.mark / l.max; x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.setLineDash([u(3), u(2.5)]);
      x.beginPath(); x.moveTo(u(mx), u(top - 6)); x.lineTo(u(mx), u(top + gap * l.rows.length)); x.stroke(); x.setLineDash([]);
      x.fillStyle = BAD(); x.textAlign = 'right'; fitFont(x, u, 'SLO 800', 11, 70); x.fillText('SLO 800', u(mx - 3), u(top + gap * l.rows.length + 10)); x.textAlign = 'left'; }
    l.rows.forEach(([lab, v, tn], i) => { const y = top + i * gap, val = v >= 1000 ? dec(v / 1000, 0) + ' s' : Math.round(v) + ' ms';
      x.fillStyle = toneC(tn === 'acc' ? 'hi' : tn); fitFont(x, u, lab, 12.5, w * 0.6); x.fillText(lab, u(x0), u(y + 4));
      x.textAlign = 'right'; x.fillStyle = toneC(tn); fitFont(x, u, val, 14, w * 0.4); x.fillText(val, u(x0 + w), u(y + 4)); x.textAlign = 'left';
      x.fillStyle = EMPTY(); x.fillRect(u(x0), u(y + 13), u(w), u(14)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(x0), u(y + 13), u(w), u(14));
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? GRAF() : accC(); x.fillRect(u(x0), u(y + 13), u(Math.max(1.5, w * clamp(v / l.max))), u(14)); });
  }
  // a previsão: a linha até "agora" (80%) e a projeção tracejada até 100% em 4 h
  function drawForecast(x, u, C, p, W_, H_) {
    const x0 = 14, x1 = W_ - 10, y0 = H_ - 40, y1 = 52, xn = x0 + (x1 - x0) * 0.5, Y = v => y0 - (y0 - y1) * v;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(x0), u(y0)); x.lineTo(u(x1), u(y0)); x.stroke();
    x.strokeStyle = BAD(); x.setLineDash([u(2), u(2)]); x.beginPath(); x.moveTo(u(x0), u(Y(1))); x.lineTo(u(x1), u(Y(1))); x.stroke(); x.setLineDash([]);
    x.fillStyle = BAD(); fitFont(x, u, '100%', 11, 40); x.fillText('100%', u(x0), u(Y(1) - 8));
    x.strokeStyle = accC(); x.lineWidth = u(3); x.beginPath(); x.moveTo(u(x0), u(Y(0.6))); x.lineTo(u(xn), u(Y(p.now))); x.stroke();
    x.fillStyle = accC(); x.beginPath(); x.arc(u(xn), u(Y(p.now)), u(4), 0, 2 * Math.PI); x.fill();
    if (p.f > 0) { const xe = xn + (x1 - xn) * p.f, ye = Y(p.now + (1 - p.now) * p.f); x.strokeStyle = BAD(); x.lineWidth = u(2.4); x.setLineDash([u(4), u(3)]);
      x.beginPath(); x.moveTo(u(xn), u(Y(p.now))); x.lineTo(u(xe), u(ye)); x.stroke(); x.setLineDash([]); }
    x.fillStyle = toneC('hi'); fitFont(x, u, '80% agora', 12, 80); x.fillText('80% agora', u(xn - 30), u(Y(p.now) + 18));
    x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'agora', 11, 60); x.fillText('agora', u(xn), u(y0 + 12)); x.fillText('+4 h', u(x1 - 14), u(y0 + 12));
    x.fillStyle = BAD(); fitFont(x, u, 'enche em 4 h', 15, W_ - 12); x.fillText('enche em 4 h', u(W_ / 2), u(H_ - 12)); x.textAlign = 'left';
  }
  // o histograma da janela de 1.000: contagem por bucket (não acumulada) e as linhas dos percentis
  const HB = [['0,05', 0], ['0,1', 0], ['0,25', 400], ['0,5', 575], ['0,8', 17], ['1', 0], ['2,5', 8], ['5', 0]];
  function drawHist(x, u, C, W_, H_) {
    const x0 = 12, w = W_ - 24, bw = w / HB.length, y0 = H_ - 40, top = 64, Hm = y0 - top, X = v => x0 + v * bw;
    HB.forEach(([le, n], i) => { const h = n ? Math.max(4, Hm * Math.sqrt(n / 575)) : 0, slow = i === 6;
      x.fillStyle = slow ? BAD() : accC(); if (h) x.fillRect(u(X(i) + 4), u(y0 - h), u(bw - 8), u(h));
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X(i) + 4), u(top), u(bw - 8), u(Hm));
      x.textAlign = 'center'; x.fillStyle = slow ? BAD() : toneC('hi'); fitFont(x, u, String(n), 13, bw - 4); x.fillText(String(n), u(X(i) + bw / 2), u(y0 - h - 9));
      x.fillStyle = INK(); fitFont(x, u, '≤ ' + le, 11, bw - 2); x.fillText('≤ ' + le, u(X(i) + bw / 2), u(y0 + 12)); });
    x.fillStyle = INK(); fitFont(x, u, 'requisições por bucket (s) · as 8 lentas em vermelho', 11, W_ - 16); x.fillText('requisições por bucket (s) · as 8 lentas em vermelho', u(W_ / 2), u(y0 + 28));
    const M = [['p50', 3.172, 'dim'], ['p95', 3.956, 'acc'], ['p99', 4.883, 'acc'], ['SLO', 5, 'bad']];
    M.forEach(([lab, v, tn], i) => { const mx = X(v); x.strokeStyle = toneC(tn === 'acc' ? 'hi' : tn); x.lineWidth = u(tn === 'bad' ? 1.6 : 1.2);
      if (tn === 'bad') x.setLineDash([u(3), u(2.5)]); x.beginPath(); x.moveTo(u(mx), u(top - 4 - (i % 2) * 14)); x.lineTo(u(mx), u(y0)); x.stroke(); x.setLineDash([]);
      x.fillStyle = toneC(tn === 'acc' ? 'hi' : tn); fitFont(x, u, lab, 12, 50); x.fillText(lab, u(mx), u(top - 12 - (i % 2) * 14)); });
    x.textAlign = 'left';
  }
  // o mural: 300 quadradinhos que piscam ao acaso
  function drawMural(x, u, C, seed, W_, H_) {
    const cols = 25, rows = 12, top = 28, s = Math.min((W_ - 16) / cols, (H_ - top - 30) / rows), x0 = (W_ - cols * s) / 2;
    for (let i = 0; i < 300; i++) { const h = (i * 2654435761 + seed * 40503) >>> 0, on = (h >>> 7) % 7 < 2, red = (h >>> 3) % 23 === 0;
      x.fillStyle = red ? BAD() : on ? accC() : EMPTY(); x.globalAlpha = on || red ? 0.85 : 1;
      x.fillRect(u(x0 + (i % cols) * s + 1.5), u(top + Math.floor(i / cols) * s + 1.5), u(s - 3), u(s - 3)); x.globalAlpha = 1; }
    x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, 'cada um com o seu número, nenhum com a resposta', 13, W_ - 16);
    x.fillText('cada um com o seu número, nenhum com a resposta', u(W_ / 2), u(H_ - 13)); x.textAlign = 'left';
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : cf.s1 > 13 ? 21 : 19;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.pool) drawPool(x, u, C, d.pool, W_, H_);
    if (d.meter) drawMeter(x, u, C, d.meter, W_, H_);
    if (d.gauge) drawGauge(x, u, C, d.gauge, W_, H_);
    if (d.lat) drawLat(x, u, C, d.lat, W_, H_);
    if (d.fc) drawForecast(x, u, C, d.fc, W_, H_);
    if (d.hist) drawHist(x, u, C, W_, H_);
    if (d.mural != null) drawMural(x, u, C, d.mural, W_, H_);
    cv.tex.needsUpdate = true;
  }
  // o topo do líquido: quanto sobra, em % e em ruins e minutos
  let tankKey = '';
  function drawTank(tk) {
    const key = JSON.stringify(tk) + theme + accent.getHex(); if (key === tankKey) return; tankKey = key;
    const cv = ftop, { x, u } = frameBox(cv, true, tk.tone), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    x.textAlign = 'center'; x.fillStyle = INK(); fitFont(x, u, 'ORÇAMENTO DE ERRO', 13, W_ - 16); x.fillText('ORÇAMENTO DE ERRO', u(W_ / 2), u(22));
    x.fillStyle = tk.tone === 'bad' ? BAD() : accC(); fitFont(x, u, tk.lab, 54, W_ - 16); x.fillText(tk.lab, u(W_ / 2), u(H_ / 2 - 4));
    x.fillStyle = toneC('hi'); fitFont(x, u, tk.sub, 14, W_ - 14); x.fillText(tk.sub, u(W_ / 2), u(H_ / 2 + 38));
    x.fillStyle = INK(); fitFont(x, u, 'de 12.960 · 43,2 min', 12, W_ - 16); x.fillText('de 12.960 · 43,2 min', u(W_ / 2), u(H_ - 18)); x.textAlign = 'left';
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab, tone) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P, acc = tone === 'acc';
    x.fillStyle = acc ? (light ? '#f6ece2' : '#2a1d12') : light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    const col = acc ? accC() : BAD(); x.strokeStyle = col; x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = col; const [a, b] = lab.split('\n');
      if (b) { fitFont(x, u, a, 13, W_ - 5); x.fillText(a, u(W_ / 2), u(H_ / 2 - 7)); fitFont(x, u, b, 9, W_ - 5); x.fillText(b, u(W_ / 2), u(H_ / 2 + 9)); }
      else { fitFont(x, u, a, 14, W_ - 5); x.fillText(a, u(W_ / 2), u(H_ / 2)); } x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { if (pl.v <= 0) continue; const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? (pl.txt ?? thou(pl.v) + (pl.lab ? '\n' + pl.lab : '')) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + (pl.tone || '') + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab, pl.tone); }
        Cd.mat.emissive.copy(pl.tone === 'acc' ? accent : badEm); Cd.mat.emissiveIntensity = pl.tone === 'acc' ? 0.25 : 0.5;
        moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 && pl.tone !== 'acc' ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const DATA = {
    orcamento: () => `<table class="h3-sum"><tr><th>incidente</th><th>conta</th><th>queimou</th></tr><tr${on_(step === 1)}><td>queda de SP (27)</td><td>9,9 × 65 = 643,5</td><td>4,97%</td></tr><tr${on_(step === 2)}><td>PSP-A sem proteção (21)</td><td>30 × 90 = 2.700</td><td>20,8%</td></tr><tr${on_(step === 3)}><td>episódio do 1063</td><td>8 acima de 800 ms</td><td>0,06%</td></tr></table><li>Orçamento: 5/s × 2.592.000 s = <b>12.960.000</b> requisições; 0,1% = <b>12.960</b> ruins = <b>43,2 min</b></li><li><i>Burn rate</i> (SRE Workbook): <b>14,4×</b> em 1 h = 2% e <b>6×</b> em 6 h = 5% (página, com a janela curta de 5 e 30 min); <b>1×</b> em 3 dias = 10% (<i>ticket</i>); 100% de erro = <b>1.000×</b></li><li>Política (exemplo): &gt; 50% publicar · 50–10% só correções · &lt; 10% congelar · 0% sala de guerra</li><li>A queda de SP é conta simplificada (9,9/s da <code>celula-sp</code> contra um orçamento a 5/s de média)</li><li>Contas de <code>c28.py</code> (21/10/2026); nenhum Prometheus foi rodado</li>`,
    slo: () => `<table class="h3-sum"><tr><th>meta</th><th>falha no mês (30 d)</th></tr><tr><td>99%</td><td>432 min</td></tr><tr${on_(step === 2)}><td>99,5% (SLA mkt-01)</td><td>216 min</td></tr><tr${on_(step === 1 || step === 3)}><td>99,9% (SLO)</td><td>43,2 min</td></tr><tr><td>99,95%</td><td>21,6 min</td></tr><tr${on_(step === 4)}><td>99,99%</td><td>4,32 min</td></tr></table><li>SLI do <code>POST /pedidos</code>: bom = <code>2xx</code> e ≤ 800 ms; válido = tudo menos <code>422</code>, <code>409</code> e <code>429</code></li><li>Por célula (módulo 26): mkt 40% = <b>5.184</b> · sp 33% = <b>4.276,8</b> · rio 15% = <b>1.944</b> · recife 12% = <b>1.555,2</b></li><li>O artigo: SLO 99,95% com SLI 99,98% dá 0,03% de margem (12,96 min em 30 dias)</li>`,
    use: () => `<table class="h3-sum"><tr><th>recurso</th><th>U</th><th>S</th><th>E</th></tr><tr><td>CPU</td><td>% de uso</td><td>run queue</td><td>(raros)</td></tr><tr><td>memória</td><td>% do limite</td><td>swap, GC</td><td>OOMKill</td></tr><tr${on_(step === 3)}><td>pool do banco</td><td>em uso ÷ 20</td><td>db_pool_waiting</td><td>503</td></tr><tr><td>disco do WAL</td><td>% de I/O</td><td>fila de I/O</td><td>erro de I/O</td></tr><tr><td>rede</td><td>banda</td><td>drops</td><td>resets</td></tr><tr${on_(step === 4)}><td>consumidor Kafka</td><td>msgs/s</td><td>kafka_consumer_lag</td><td>DLQ</td></tr></table><li><code>catalogo-3</code> (módulo 14, 20:03): U <b>99%</b> (as outras 64%, frota <b>67,5%</b>); S: 64 × 1,01 = <b>64,6</b> de 86,4 em andamento; E: 1% de <code>504</code> a 640 req/s</li><li>Pool do módulo 25 (k6 real): 0,4 de 20 sem relatório; 40,4 pedidas com ele; <code>503</code> em 33% do checkout e 10% do status</li><li>A tabela é um modelo de leitura, não uma medição; o método está em brendangregg.com/usemethod.html</li>`,
    red: () => `<table class="h3-sum"><tr><th>célula</th><th>fração</th><th>rate (BF)</th></tr><tr${on_(step === 0)}><td>celula-mkt</td><td>40%</td><td>12,0/s</td></tr><tr${on_(step === 0)}><td>celula-sp</td><td>33%</td><td>9,9/s</td></tr><tr${on_(step === 0)}><td>celula-rio</td><td>15%</td><td>4,5/s</td></tr><tr${on_(step === 0)}><td>celula-recife</td><td>12%</td><td>3,6/s</td></tr></table><li>Histograma (1.000 req): <code>le</code> 0,25 → 400 · 0,5 → 975 · 0,8 → 992 · 1 → 992 · 2,5 → 1.000; p50 0,293 · p95 0,489 · p99 0,765 · p99,9 2,3125 s</li><li>Erros: <code>5xx</code>, <i>timeout</i>, inválida, duplicada, o <code>201</code> com frete 0,00; <code>409</code>, <code>422</code> e <code>429</code> observados, fora do SLO</li><li><i>Canary</i> (módulo 22): 10% na <code>2.5.0</code>; 20% dos pedidos dela (Recife) com frete 0,00; R$ 15,00 por pedido por 60 min</li><li>O rate por versão (27 e 3 pedidos/s) é a divisão de 30/s pelo <i>canary</i> de 10%</li>`,
    golden: () => `<table class="h3-sum"><tr><th>sinal</th><th>celula-recife (exemplo)</th></tr><tr${on_(step >= 1 && step <= 3)}><td>latência</td><td>p95 do sucesso 489 ms (SLO 800); erro por breaker: 2 ms</td></tr><tr><td>tráfego</td><td>3,6 pedidos/s</td></tr><tr${on_(step >= 1 && step <= 3)}><td>erros</td><td>0% de 5xx; frete zero a 0</td></tr><tr${on_(step === 4)}><td>saturação</td><td>pool 2% (0,4 de 20); lag 0,3 s (alerta 0,5 s)</td></tr></table><li><i>Breaker</i> aberto: 0,3 × 2 + 0,7 × 275 = <b>193,1 ms</b> (a média cai de 275 enquanto 30% falham)</li><li>Quatro sinais = RED + saturação; USE para o recurso, RED para o serviço, os quatro sinais para o usuário</li><li>Correção ao artigo: o SRE book manda <b>separar</b> a latência do sucesso e a do erro</li><li>4 células × 4 sinais = 16 números; a previsão "enche em 4 h" é exemplo</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte e leva até ele
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
  function readout() { if (active !== 'contrato') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'contrato' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-contrato3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'contrato') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const ease1 = (v, want, dt, sp) => v + Math.sign(want - v) * Math.min(Math.abs(want - v), dt / sp);
  let tankF = 0, lvNow = 1;
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f = ease1(Bk.f, want, dt, 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], Bk.pos[2] - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, Bk.pos[2] + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    // as barras sobem depois que o bloco delas pousou
    BN.forEach(nm => { const b = BARS[nm], s = o.bars[nm], bs = B[b.base], want = s && bs.f > 0.95 ? s[0] : 0;
      b.v = ease1(b.v, want, dt, 0.7); b.g.visible = b.v > 0.005 && bs.g.visible;
      if (b.g.visible) { b.g.position.copy(W(b.x, b.y, bs.pos[2] + bs.h)); b.g.scale.set(1, b.v, 1); }
      const bad_ = s && s[1] === 'bad'; b.mat.emissive.copy(bad_ ? badEm : accent); b.mat.emissiveIntensity = bad_ ? 0.45 : 0.35; });
    // o tanque: sobe inteiro no cenário do orçamento; o líquido segue o nível do passo
    tankF = ease1(tankF, o.tank ? 1 : 0, dt, 0.6); tank.visible = tankF > 0.01;
    if (tank.visible) { tank.position.copy(W(0, 0, PL - (1 - ease(clamp(tankF))) * (TH + 12)));
      if (o.tank) { lvNow = ease1(lvNow, o.tank.lv, dt, 2.2); drawTank(o.tank); }
      fluid.scale.set(1, Math.max(0.004, lvNow), 1);
      const low = o.tank && o.tank.tone === 'bad'; fluidMat.emissive.copy(low ? badEm : accent); fluidMat.emissiveIntensity = low ? 0.4 : 0.28;
      RAILS.forEach(R => { R.mat.emissive.copy(R.f < 0.2 ? badEm : accent); R.mat.emissiveIntensity = 0.45; }); }
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placePiles(o.piles); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [24, 880, 20, 446];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = (POSTER ? 0.9 : nar ? 1 : 0.88) * Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
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
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), scr, ftop];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = ''); tankKey = '';
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); tankF = o.tank ? 1 : 0; if (o.tank) lvNow = o.tank.lv;
    BN.forEach(nm => { const s = o.bars[nm]; BARS[nm].v = s ? s[0] : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
