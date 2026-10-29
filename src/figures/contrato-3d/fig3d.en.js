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
FIGS3D.push({ id: 'contrato', name: 'Contract', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 1) => v.toFixed(d);
  const pct = (v, d = 1) => dec(v * 100, d) + '%';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['orcamento', 'slo', 'use', 'red', 'golden'];
  const SCNAME = { orcamento: 'Budget', slo: 'SLO', use: 'USE', red: 'RED', golden: 'Golden' };
  const SCFULL = { orcamento: 'The error budget', slo: 'SLI, SLO and SLA', use: 'USE: the resources', red: 'RED: the services', golden: 'The four golden signals' };
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
    o.tank = { lv, tone: tone || (lv < 0.1 ? 'bad' : ''), lab: pct(lv), sub: `${thou(BUD * lv)} bad · ${dec(MIN * lv)} min` };
    show(o, ...POL);
    const k = lv > 0.5 ? 0 : lv > 0.1 ? 1 : lv > 0 ? 2 : 3;
    o.rows.pPub = act('ship as normal', '> 50%', ['deploy allowed', k === 0 ? 'acc' : 'dim']);
    o.rows.pCor = act('fixes only', '50–10%', ['slow canary', k === 1 ? 'acc' : 'dim']);
    o.rows.pCong = act('freeze', '< 10%', ['only what is a fix', k === 2 ? 'bad' : 'dim']);
    o.rows.pWar = act('war room', '0%', ['priority: stability', k === 3 ? 'bad' : 'dim']);
    o.on[POL[k]] = k >= 2 ? 'bad' : 1; POL.forEach((p, i) => { if (i !== k) o.on[p] = 0; });
    o.beams.push(...CAB.pol.map((pts, i) => ({ pts, on: i === k, tone: i === k && k >= 2 ? 'bad' : '' })));
    T(o, [TX + TW + 6, TY + TD + 8, PL + FB + FH * 0.5 + 6], '50%', 'dim'); T(o, [TX + TW + 6, TY + TD + 8, PL + FB + FH * 0.1 + 6], '10%', 'bad');
  }
  const INC = [
    { nm: 'iSP', name: 'SP outage', meta: 'MODULE 27', conta: '9.9/s × 65 s = 643.5', v: 643.5, p: '4.97%' },
    { nm: 'iPSP', name: 'PSP-A without protection', meta: 'MODULE 21', conta: '30/s × 90 s = 2,700', v: 2700, p: '20.8%' },
    { nm: 'i1063', name: '1063 episode', meta: 'LESSON 2', conta: '8 above 800 ms', v: 8, p: '0.06%' },
  ];
  // done = quantos já queimaram; cur = o que está queimando agora (f = progresso)
  function incidents(o, done, cur = -1, f = 0) {
    INC.forEach((I, i) => { show(o, I.nm); const burnt = i < done || (i === cur && f >= 1), now = i === cur && f < 1 && f > 0;
      o.rows[I.nm] = act(I.name, I.meta, [I.conta, 'dim'], [burnt ? `burned ${I.p}` : now ? 'burning…' : 'not yet', burnt || now ? 'bad' : 'dim']);
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
      { id: 'mes', dur: 6, title: 'The month\'s budget: 12,960 bad', yk: 'THE FULL TANK',
        code: ['30 days = 2,592,000 s', '5 orders/s × 2,592,000 = 12,960,000', 'SLO 99.9%: 0.1% left', '0.1% = 12,960 bad requests', '  = 43.2 min of total downtime'],
        story: 'The tank is the month\'s <b>error budget</b>. A 99.9% SLO leaves 0.1% of slack: in 30 days, at 5 orders per second, that is <b>12,960,000</b> requests, and 0.1% of them, <b>12,960</b>, are bad, or <b>43.2 min</b> of the store being down. On the left are three incidents from the earlier modules, and each one will drink from the tank.',
        look: 'The full tank; on the right, the policy lit on "ship as normal"; the bands mark 50% and 10%.',
        key: 'The budget is what remains between the target and 100%.',
        f(o) { tankBase(o, 1); incidents(o, 0);
          o.cnt = [['BUDGET', '12,960 bad'], ['IN MINUTES', '43.2 min', 'dim'], ['LEFT', '100%', 'dim']];
          o.res = [['full tank: ship as normal', 'acc']]; } },
      { id: 'sp', dur: 7, title: 'The SP outage burns 4.97%', yk: 'MODULE 27: 65 s OF RTO', act: ['SP outage', 'module 27'],
        code: ['SP outage: 65 s of RTO (module 27)', 'celula-sp: 9.9 orders/s', '9.9 × 65 = 643.5 bad', '643.5 ÷ 12,960 = 4.97%', 'left: 95.0% (41.1 min)'],
        story: 'The module 27 SP outage: <b>65 s</b> until the cell comes back, at <b>9.9 orders/s</b>. That is <b>643.5</b> bad orders, <b>4.97%</b> of the month. The math is simplified: it compares the <code>celula-sp</code> rate with a budget calculated at an average of 5 orders/s. The tank drops a little and the policy stays on "ship".',
        look: 'The SP outage pipe turns red and the liquid drops to 95%.',
        key: 'A 65 s outage costs a twentieth of the month.',
        f(o, t) { const f = lin(t, 0.6, 3, 0, 1), lv = LV[0] + (LV[1] - LV[0]) * f; tankBase(o, lv); incidents(o, 0, 0, f);
          o.cnt = [['BURNED', f >= 1 ? '4.97%' : pct(1 - lv, 2), 'bad'], ['FAILURES', thou(643.5 * f), 'dim'], ['LEFT', left(lv), 'dim']];
          o.res = f >= 1 ? [['95.0% left: ship', 'acc']] : [['burning…', 'bad']]; } },
      { id: 'psp', dur: 7, title: 'PSP-A without protection burns 20.8%', yk: 'MODULE 21: 90 s AT 100% ERRORS', act: ['PSP without protection', 'module 21'],
        code: ['PSP-A down 90 s, no breaker (module 21)', '30 orders/s × 90 s = 2,700 bad', '2,700 ÷ 12,960 = 20.8%', 'burn rate: 1 ÷ 0.001 = 1,000×', 'left: 74.2% (32.1 min)'],
        story: 'The PSP-A incident, without the module 21 <i>breaker</i> and <i>fallback</i>: 90 s at 100% errors, at 30 orders/s. That is <b>2,700</b> failures, <b>20.8%</b> of the month, in a minute and a half. The <i>burn rate</i> of that incident is <b>1,000×</b>: it spends the budget a thousand times faster than planned.',
        look: 'The PSP-A pipe turns red and the liquid falls to 74%, still above the 50% band.',
        key: 'An incident like that eats a fifth of the month in 90 s.',
        f(o, t) { const f = lin(t, 0.6, 3.4, 0, 1), lv = LV[1] + (LV[2] - LV[1]) * f; tankBase(o, lv); incidents(o, 1, 1, f);
          o.cnt = [['BURNED', f >= 1 ? '20.8%' : pct((LV[1] - lv), 1), 'bad'], ['FAILURES', thou(2700 * f), 'dim'], ['LEFT', left(lv), 'dim']];
          o.res = f >= 1 ? [['74.2% left: ship', 'acc']] : [['burning at 1,000×…', 'bad']]; } },
      { id: '1063', dur: 7, title: 'The 1063 burns 0.06%, and finds nothing', yk: 'LESSON 2: THE 8 SLOW ORDERS', act: ['The 1063 episode', 'lesson 2'],
        code: ['1063 episode (lesson 2)', '8 orders above 800 ms', '8 ÷ 12,960 = 0.06%', 'no alert: 5.3× in 5 min', 'left: 74.1% (32.0 min)'],
        story: 'Lena\'s episode: <b>8</b> orders above 800 ms, 1063 among them. It cost <b>0.06%</b> of the month, almost nothing, and so it lit no alarm (5.3× in 5 min, below 14.4×). The budget measures the <b>damage</b>; whoever found the <code>holder</code> was the lesson 2 investigation.',
        look: 'The 1063 pipe drips for a moment; the level barely moves.',
        key: 'The budget measures the damage, but does not say where it is.',
        f(o, t) { const f = lin(t, 0.6, 2.2, 0, 1), lv = LV[2] + (LV[3] - LV[2]) * f; tankBase(o, lv); incidents(o, 2, 2, f);
          o.cnt = [['BURNED', f >= 1 ? '0.06%' : '…', 'bad'], ['FAILURES', String(Math.round(8 * f)), 'dim'], ['LEFT', left(lv), 'dim']];
          o.res = [['74.1% left: ship', 'acc']]; } },
      { id: 'burn', dur: 9, title: 'Burn rate: the speed of the burn', yk: 'CONSUMPTION = BURN × WINDOW ÷ PERIOD', act: ['See the burn rate', 'the three windows'],
        code: ['period: 30 days = 720 h', '14.4 × 1 h ÷ 720 = 2%    page', '6 × 6 h ÷ 720 = 5%       page', '1 × 72 h ÷ 720 = 10%     ticket', '5% in 1 h would need 36×'],
        story: 'The <i>burn rate</i> is the speed: <b>1×</b> spends the tank in exactly 30 days; 2× spends it in 15. Three SRE Workbook rules, in a fresh month: <b>14.4× for 1 h</b> eats 2% and becomes a page; <b>6× for 6 h</b> eats 5% and is also a page; <b>1× for 3 days</b> eats 10% and becomes a <i>ticket</i>. The pages require the long <b>and</b> the short window (5 min, 30 min), so the alert stops when the problem stops.',
        look: 'The three windows light up in sequence; the full tank drops 2%, 5% and 10%.',
        key: 'The burn rate ties the budget to the alert.',
        f(o, t) { const k = Math.floor(t / 3) % 3, c = [0.02, 0.05, 0.10][k], f = lin(t % 3, 0.3, 1.6, 0, 1), lv = 1 - c * f; tankBase(o, lv);
          const W3 = [['w1h', '14.4× · 1 h', 'AND 5 MIN', 'consumes 2%', 'page'], ['w6h', '6× · 6 h', 'AND 30 MIN', 'consumes 5%', 'page'], ['w3d', '1× · 3 days', '', 'consumes 10%', 'ticket']];
          W3.forEach(([nm, a, m, r1, r2], i) => { show(o, nm); o.rows[nm] = act(a, m, [r1, i === k ? 'acc' : 'dim'], [r2, i === k && i < 2 ? 'bad' : 'dim']);
            if (i === k) lit(o, nm); else o.on[nm] = 2; o.beams.push({ pts: CAB.drain[i], on: i === k, flow: i === k }); });
          o.cnt = [['BURN', ['14.4×', '6×', '1×'][k]], ['WINDOW', ['1 h and 5 min', '6 h and 30 min', '3 days'][k], 'dim'], ['CONSUMES', ['2% · page', '5% · page', '10% · ticket'][k], k < 2 ? 'bad' : 'dim']];
          o.res = [[['14.4 × 1 ÷ 720 = 2%', '6 × 6 ÷ 720 = 5%', '1 × 72 ÷ 720 = 10%'][k], 'acc']]; } },
      { id: 'politica', dur: 9, title: 'The policy: the budget rules the deploy', yk: 'THREE UNPROTECTED PSPs IN THE MONTH', act: ['Three PSPs in the month', 'the policy reacts'],
        code: ['> 50%: ship as normal', '50% to 10%: only fixes, slow canary', '< 10%: freeze whatever is not a fix', '0%: war room', '3 × 2,700 = 8,100 = 62.5% of the month'],
        story: 'One possible policy (it is an example): with more than <b>50%</b> left, ship as normal; between 50% and 10%, only fixes and a slow <i>canary</i> (module 22); below <b>10%</b>, freeze whatever is not a fix; at zero, war room. In a month with <b>three</b> unprotected PSPs, 8,100 leave the tank: <b>37.5%</b> is left, and the store enters the caution band.',
        look: 'The tank drops in three steps; the policy light goes down from "ship" to "fixes only".',
        key: 'Speed × stability, decided by a number.',
        f(o, t) { const F = [0, 1, 2].map(i => lin(t, 0.8 + 2.2 * i, 2 + 2.2 * i, 0, 1)), lvv = 1 - 2700 * (F[0] + F[1] + F[2]) / BUD; tankBase(o, lvv);
          INC.forEach((I, i) => { show(o, I.nm); const f = F[i], now = f > 0 && f < 1;
            o.rows[I.nm] = act(`PSP-A, time ${i + 1}`, 'NO BREAKER', ['30/s × 90 s = 2,700', 'dim'], [f >= 1 ? 'burned 20.8%' : now ? 'burning…' : 'not yet', f > 0 ? 'bad' : 'dim']);
            if (f > 0) bad(o, I.nm); o.beams.push({ pts: CAB.drain[i], tone: now ? 'bad' : '', flow: now }); });
          o.cnt = [['LEFT', pct(lvv)], ['BURNED', thou(BUD * (1 - lvv)), 'bad'], ['POLICY', lvv > 0.5 ? 'ship' : 'fixes only', lvv > 0.5 ? 'dim' : 'bad']];
          o.res = lvv <= 0.375 + 1e-6 ? [['37.5% left: fixes only', 'bad']] : [['ship as normal', 'acc']]; } },
      { id: 'frete', dur: 9, title: 'And if it goes wrong: the SLI that counts shipping 0.00 as good', yk: 'THE SLI MEASURES THE WRONG THING', act: ['Ship 2.5.0', 'shipping 0.00'],
        code: ['2.5.0 (module 22): 201, fast, shipping 0.00', 'good = 2xx and ≤ 800 ms → counts as good', 'budget burned: 0', 'loss: R$ 15.00 per order in Recife', 'fix: a business SLI', '  pedidos_frete_zero_total{cidade}'],
        story: '<code>2.5.0</code> from module 22 returns <code>201</code>, fast, with shipping <b>0.00</b>. By the SLI definition (2xx and up to 800 ms), each such order is <b>good</b>. The tank does not drop, the SLO dashboard stays green and the store loses <b>R$ 15.00</b> per order in Recife. The SLI needs to measure what the customer and the business call right: the ratio of <code>pedidos_frete_zero_total</code>, or a <i>diff</i> against 2.4.0.',
        look: 'The 2.5.0 orders enter the tank as "good"; the level does not move.',
        key: 'If the defect counts as good, the budget does not see it.',
        f(o) { tankBase(o, LV[3]); show(o, 'fr250'); bad(o, 'fr250');
          o.rows.fr250 = act('pedidos 2.5.0', 'MODULE 22', ['201 in 0.3 s', 'dim'], ['Recife shipping: 0.00', 'bad'], ['SLI: good', 'acc']);
          o.beams.push({ pts: CAB.frete, on: 1, flow: 0 }); tokens(o, CAB.frete, 1.2, () => ['201 · shipping 0.00', 'acc']);
          o.cnt = [['BURNED BY THE SHIPPING', '0'], ['ORDER SLI', 'good', 'dim'], ['LOSS', 'R$ 15.00/order', 'bad']];
          o.res = [['tank still, store losing', 'bad']]; } },
    ],
    slo: [
      { id: 'sli', dur: 8, title: 'SLI: good ÷ valid', yk: 'THE MEASURE',
        code: ['SLI = good ÷ valid (POST /pedidos)', 'good: status 2xx and duration ≤ 800 ms', 'valid: everything except', '  422 customer, 409 sold out, 429 tenant', 'the 1063: 201 in 1.9 s → bad'],
        story: 'The first step is the <b>measure</b>. The <code>POST /pedidos</code> SLI is a ratio: <b>good ÷ valid</b>. Good is <code>2xx</code> <b>and</b> within <b>800 ms</b>. Valid is everything except what the store chose to refuse: the customer\'s <code>422</code>, the <code>409</code> for sold out (module 11) and the tenant\'s <code>429</code> (module 25). Lena\'s 1063, a <code>201</code> in 1.9 s, counts as <b>bad</b>.',
        look: 'The tokens go up to the SLI: yellow ones are good, red ones are bad, gray ones stay out of the count.',
        key: 'The SLI defines what counts as good.',
        f(o) { show(o, 'sli', 'req'); lit(o, 'sli', 'req');
          o.rows.sli = act('SLI', 'THE MEASURE', ['good ÷ valid', 'acc'], ['good: 2xx and ≤ 800 ms', 'dim'], ['out: 422 · 409 · 429', 'dim']);
          o.rows.req = act('POST /pedidos', 'INPUT', ['5 orders/s', 'dim']);
          const K = [['201 · 0.3 s', 'acc'], ['201 · 1.9 s', 'bad'], ['422', 'gray'], ['201 · 0.2 s', 'acc'], ['503', 'bad'], ['409', 'gray'], ['201 · 0.3 s', 'acc'], ['429', 'gray']];
          o.beams.push({ pts: CAB.req, on: 1 }); tokens(o, CAB.req, 1.3, k => K[((k % 8) + 8) % 8], 1.8);
          o.cnt = [['SLI', 'good ÷ valid'], ['GOOD', '2xx and ≤ 800 ms', 'dim'], ['OUT OF THE COUNT', '422 · 409 · 429', 'dim']];
          o.res = [['the 1063 (1.9 s) is bad', 'bad']]; } },
      { id: 'slo', dur: 7, title: 'SLO: 99.9% over 30 days', yk: 'THE TARGET', act: ['Set the target', '99.9%'],
        code: ['30 days = 43,200 min', '0.1% × 43,200 = 43.2 min', '0.1% × 12,960,000 = 12,960 bad', 'module 24 targets: errors ≤ 0.1%', '  and p95 ≤ 800 ms'],
        story: 'The second step is the <b>target</b>: <b>99.9%</b> over 30 days, the module 24 goals (errors up to 0.1%, p95 up to 800 ms). It is internal: the team decides with it. In minutes, that is <b>43.2 min</b> of failure in the month; in orders, <b>12,960</b> bad ones.',
        look: 'The SLO step rises next to the SLI.',
        key: 'The SLO is the target the team uses to decide.',
        f(o) { show(o, 'sli', 'slo'); o.on.sli = 2; lit(o, 'slo');
          o.rows.sli = act('SLI', 'THE MEASURE', ['good ÷ valid', 'acc'], ['good: 2xx and ≤ 800 ms', 'dim']);
          o.rows.slo = act('SLO', 'THE TARGET', ['99.9% over 30 days', 'acc'], ['43.2 min of failure', 'dim'], ['= 12,960 bad', 'dim']);
          o.beams.push({ pts: CAB.s12, on: 1, flow: 1 });
          o.cnt = [['SLO', '99.9%'], ['ALLOWED FAILURE', '43.2 min', 'dim'], ['BAD IN THE MONTH', '12,960', 'dim']];
          o.res = [['internal target: 43.2 min', 'acc']]; } },
      { id: 'sla', dur: 7, title: 'SLA: 99.5% with mkt-01', yk: 'THE CONTRACT', act: ['Sign the SLA', 'mkt-01'],
        code: ['SLA with mkt-01: 99.5% per month', '0.5% × 43,200 = 216 min (3 h 36)', 'SLO 43.2 min < SLA 216 min', 'slack: 216 − 43.2 = 172.8 min', 'the SLO blows far before the contract'],
        story: 'The third step is the <b>contract</b>: with <code>mkt-01</code>, the store signed <b>99.5%</b> per month, or <b>216 min</b> (3 h 36 min) of failure. The SLA is <b>less</b> demanding than the SLO, on purpose: the 43.2 min SLO blows far earlier, and the team reacts with 172.8 min of slack before the penalty.',
        look: 'The SLA step, the tallest, closes the ladder; all three are lit.',
        key: 'An SLO stricter than the SLA is the contract\'s shield.',
        f(o) { show(o, 'sli', 'slo', 'sla'); o.on.sli = 2; o.on.slo = 2; lit(o, 'sla');
          o.rows.sli = act('SLI', 'THE MEASURE', ['good ÷ valid', 'acc'], ['good: 2xx and ≤ 800 ms', 'dim']);
          o.rows.slo = act('SLO', 'THE TARGET', ['99.9% over 30 days', 'acc'], ['43.2 min of failure', 'dim']);
          o.rows.sla = act('SLA', 'THE CONTRACT', ['99.5% · mkt-01', 'acc'], ['216 min (3 h 36 min)', 'dim'], ['slack: 172.8 min', 'dim']);
          o.beams.push({ pts: CAB.s12, on: 1 }, { pts: CAB.s23, on: 1, flow: 1 });
          o.cnt = [['SLA', '99.5%'], ['FAILURE IN THE CONTRACT', '216 min', 'dim'], ['SLACK', '172.8 min', 'dim']];
          o.res = [['SLO (43.2) shields the SLA (216)', 'acc']]; } },
      { id: 'celulas', dur: 7, title: 'The budget per cell', yk: '12,960 BY THE MODULE 26 SHARES', act: ['Split by cell', 'module 26'],
        code: ['12,960 by the cell shares', 'celula-mkt 40% = 5,184', 'celula-sp 33% = 4,276.8', 'celula-rio 15% = 1,944', 'celula-recife 12% = 1,555.2'],
        story: 'The 12,960 bad ones are split by the cell shares (module 26): <code>celula-mkt</code> <b>5,184</b>, <code>celula-sp</code> <b>4,276.8</b>, <code>celula-rio</code> <b>1,944</b> and <code>celula-recife</code> <b>1,555.2</b>. Lena\'s cell has the <b>smallest</b> absolute budget: the same incident consumes it faster.',
        look: 'One bar per cell, with the height of the budget; Recife\'s is the lowest.',
        key: 'Each cell has its own tank.',
        f(o) { show(o, 'sli', 'slo', 'sla'); ['sli', 'slo', 'sla'].forEach(n => o.on[n] = 2);
          o.rows.sli = act('SLI', 'THE MEASURE', ['good ÷ valid', 'acc']); o.rows.slo = act('SLO', 'THE TARGET', ['99.9% · 12,960', 'acc']); o.rows.sla = act('SLA', 'THE CONTRACT', ['99.5% · mkt-01', 'acc']);
          o.beams.push({ pts: CAB.s12, on: 1 }, { pts: CAB.s23, on: 1 });
          cells(o, ['5,184', '4,276.8', '1,944', '1,555.2'], [1, 0.825, 0.375, 0.3], { rec: 'on' });
          o.cnt = [['celula-recife', '1,555.2'], ['celula-mkt', '5,184', 'dim'], ['TOTAL', '12,960', 'dim']];
          o.res = [['Recife: the smallest tank', 'acc']]; } },
      { id: 'cem', dur: 8, title: 'And if it goes wrong: the 100% SLO', yk: 'NEVER 100%', act: ['Ask for 100%', 'no errors'],
        code: ['SLO 100% → budget 0', 'no releases, no maintenance', 'the 1st incident, even of 1 s, breaks the target', 'each extra nine divides by 10', '99.99% = 4.32 min · 100% = 0'],
        story: 'Someone asks for <b>100%</b>. The budget becomes <b>zero</b>: no errors in 30 days means no releases, no maintenance, no tolerance. The first incident, even of 1 s, breaks the target. Each extra nine already cuts the budget by 10 (99.99% is 4.32 min); 100% cuts everything. The article asks for nines, never 100%.',
        look: 'The cell bars disappear and the SLO step turns red.',
        key: 'A 100% target forbids any change.',
        f(o, t) { const z = t > 1.2; show(o, 'sli', 'slo', 'sla'); o.on.sli = 2; o.on.sla = 2; if (z) bad(o, 'slo'); else lit(o, 'slo');
          o.rows.sli = act('SLI', 'THE MEASURE', ['good ÷ valid', 'acc']); o.rows.sla = act('SLA', 'THE CONTRACT', ['99.5% · mkt-01', 'acc']);
          o.rows.slo = act('SLO', 'THE TARGET', [z ? '100% over 30 days' : '99.9% over 30 days', z ? 'bad' : 'acc'], [z ? 'budget: 0' : '12,960 bad', z ? 'bad' : 'dim'], [z ? 'deploy: forbidden' : '', 'bad']);
          o.beams.push({ pts: CAB.s12, on: !z, tone: z ? 'bad' : '' }, { pts: CAB.s23, on: 1 });
          const f = z ? 0 : 1; cells(o, z ? ['0', '0', '0', '0'] : ['5,184', '4,276.8', '1,944', '1,555.2'], [f, 0.825 * f, 0.375 * f, 0.3 * f], z ? { mkt: 'bad', sp: 'bad', rio: 'bad', rec: 'bad' } : {});
          o.cnt = [['BUDGET', z ? '0' : '12,960', z ? 'bad' : ''], ['DEPLOYS', z ? 'none' : 'allowed', z ? 'bad' : 'dim'], ['1ST INCIDENT', z ? 'breaks the target' : '—', z ? 'bad' : 'dim']];
          o.res = z ? [['100% = no change at all', 'bad']] : []; } },
    ],
    use: [
      { id: 'frota', dur: 6, title: 'The catalog fleet at 67.5%', yk: 'BLACK FRIDAY, 20:03 (MODULE 14)',
        code: ['10 catalogo replicas, 640 req/s', 'average utilization: 67.5%', 'errors: 1% of 504', 'by the average, all calm', 'USE: Utilization, Saturation, Errors'],
        story: 'Brendan Gregg\'s USE is a script for <b>resources</b>: for each one (CPU, memory, disk, network, pools and queues), three questions, <b>Utilization</b>, <b>Saturation</b> and <b>Errors</b>. Start with the catalog fleet on Black Friday, at 20:03: the fleet dashboard shows <b>67.5%</b> utilization. It looks healthy.',
        look: 'A single block, the fleet, with the average utilization on a meter.',
        key: 'The fleet average is a calm number.',
        f(o) { show(o, 'frota'); lit(o, 'frota');
          o.rows.frota = act('catalogo fleet', '10 REPLICAS', ['utilization: 67.5%', 'acc'], ['640 req/s', 'dim']); o.rows.frota.meter = { f: 0.675 };
          o.cnt = [['AVERAGE UTILIZATION', '67.5%'], ['REPLICAS', '10', 'dim'], ['TRAFFIC', '640 req/s', 'dim']];
          o.res = [['looks healthy', 'dim']]; } },
      { id: 'replica', dur: 7, title: 'U: catalogo-3 at 99%', yk: 'UTILIZATION, PER INSTANCE', act: ['Open per replica', '10 bars'],
        code: ['9 replicas at 64%', 'catalogo-3 at 99%', 'average: (9 × 64 + 99) ÷ 10 = 67.5%', 'the average hides the replica', 'look per instance, then aggregate'],
        story: 'Open the fleet per replica: <b>nine</b> are at <b>64%</b> and <code>catalogo-3</code> is at <b>99%</b>. The average, (9 × 64 + 99) ÷ 10 = <b>67.5%</b>, hides the only one that matters. USE applies to <b>each instance</b>, and only then do you aggregate.',
        look: 'Ten bars; the third, red, almost at the top.',
        key: 'The fleet average hides the saturated replica.',
        f(o) { reps(o); show(o, 'frota'); o.on.frota = 2;
          o.rows.frota = act('catalogo fleet', 'AVERAGE', ['utilization: 67.5%', 'dim'], ['catalogo-3: 99%', 'bad']); o.rows.frota.meter = { f: 0.675 };
          o.cnt = [['catalogo-3', '99%', 'bad'], ['THE OTHER 9', '64%', 'dim'], ['FLEET AVERAGE', '67.5%', 'dim']];
          o.res = [['1 in 10 lives on the replica at 99%', 'bad']]; } },
      { id: 'fila', dur: 8, title: 'S and E: the queue and the 504s', yk: 'LITTLE: L = λ × W (MODULE 14)', act: ['See the queue', 'saturation'],
        code: ['catalogo-3: 64 req/s × 1.01 s = 64.6', 'the others: 2.4 in flight each', 'fleet total: 86.4', 'S: the queue that utilization hides', 'E: 1% of 504s at 640 req/s'],
        story: '<b>Saturation</b> is the work that waits. By Little\'s law, <code>catalogo-3</code> has 64 req/s × 1.01 s = <b>64.6</b> requests in flight, out of <b>86.4</b> in the fleet; each healthy replica has <b>2.4</b>. <b>Errors</b>: 1% of <code>504</code> at 640 req/s. Any of the three questions, alone, points to the right replica. The average does not.',
        look: 'A tall stack in front of catalogo-3; a single token in front of each of the others.',
        key: 'Saturation shows what utilization hides.',
        f(o, t) { reps(o); const f = lin(t, 0.6, 3, 0, 1);
          for (let k = 0; k < 10; k++) o.piles.push(k === 2 ? { p: [RX(k) + 38, 288, PL + 2], v: 1, f: f, txt: dec(64.6 * f) + '\nin flight' } : { p: [RX(k) + 38, 288, PL + 2], v: 1, f: 0.01, txt: '2.4', tone: 'acc' });
          if (t > 3) T(o, [RX(2) + 38, 200, 120], '1% of 504s', 'bad');
          o.cnt = [['IN FLIGHT', dec(64.6 * f), 'bad'], ['EACH HEALTHY ONE', '2.4', 'dim'], ['ERRORS', '1% of 504s', 'bad']];
          o.res = f >= 1 ? [['64.6 of 86.4 on catalogo-3', 'bad']] : [['the queue filling…', 'bad']]; } },
      { id: 'pool', dur: 9, title: 'The 20-connection pool is a resource too', yk: 'MODULE 25: THE 23:00 REPORT', act: ['Turn on the report', '20-connection pool'],
        code: ['without the report: 0.4 of 20 = 2%', 'report 23:00: 40.4 requested > 20', 'U = in use ÷ 20 = 100%', 'S = db_pool_waiting (the queue)', 'E = 503 from the full pool', '  33% of checkout · 10% of status'],
        story: 'The module 25 <b>20-connection</b> pool is a resource like the CPU. Without the report, the customer uses <b>0.4</b> of 20 (2%). At 23:00 the report asks for 40, and the demand becomes <b>40.4</b>: <b>U</b> = 100%; <b>S</b> = whoever waits for a slot, <code>db_pool_waiting</code>; <b>E</b> = the full-pool <code>503</code>s, <b>33%</b> of checkout and <b>10%</b> of status. USE describes the problem without needing to know the cause.',
        look: 'The report fills the 20 slots; the USE board turns red on all three lines.',
        key: 'Full pool: 100%, a queue and 503s in three lines.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 3, 0, 20)), full = n >= 20; show(o, 'prel', 'pchk', 'pool', 'puse');
          lit(o, 'prel'); if (full) bad(o, 'pool', 'pchk', 'puse'); else lit(o, 'pool', 'pchk', 'puse');
          o.rows.prel = act('report', '23:00', ['10/s × 4 s', 'dim'], ['asks for 40 of 20', full ? 'bad' : 'acc']);
          o.rows.pchk = act('checkout · status', 'CUSTOMER', ['0.4 in use', 'dim'], [full ? '503: 33% · 10%' : '503: 0', full ? 'bad' : 'dim']);
          o.rows.pool = act('pool · 20 connections', 'DB OF pedidos'); o.rows.pool.pool = { cells: poolCells(n), bad: full };
          o.rows.puse = full ? act('USE of the pool', '', ['U: 100%', 'bad'], ['  (40.4 requested)', 'dim'], ['S: db_pool_waiting', 'bad'], ['E: 503', 'bad'], ['  33% chk · 10% sts', 'dim'])
            : act('USE of the pool', '', [`U: ${n ? Math.round(n / 20 * 100) : 2}%`, 'acc'], ['S: 0 waiting', 'dim'], ['E: 0', 'dim']);
          o.beams.push({ pts: CAB.prel, on: 1, flow: 1, tone: full ? 'bad' : '' }, { pts: CAB.pchk, on: 1, flow: 1, tone: full ? 'bad' : '' }, { pts: CAB.puse, on: 1 });
          o.cnt = [['U', full ? '100%' : Math.round(n / 20 * 100) + '%', full ? 'bad' : 'acc'], ['S', full ? 'wait queue' : '0', full ? 'bad' : 'dim'], ['E', full ? '503: 33% · 10%' : '0', full ? 'bad' : 'dim']];
          o.res = full ? [['three letters, one diagnosis', 'bad']] : [['the report arriving…', 'dim']]; } },
      { id: 'celula', dur: 8, title: 'The cell\'s resource table', yk: 'U · S · E FOR EACH RESOURCE', act: ['Build the table', 'celula-recife'],
        code: ['for each celula-recife resource:', 'U: how much is in use', 'S: how much waits (the queue)', 'E: failure events of the resource', 'consumer lag is S too'],
        story: 'The USE walkthrough: list the cell\'s resources and fill in <b>U</b>, <b>S</b> and <b>E</b> for each one, before theorizing. Look first at what is red in S or E. Note the last one: <code>kafka_consumer_lag</code> is the saturation of a resource that does not even look like one; the delay grows without the CPU going up. (The values are the reading model, not a measurement.)',
        look: 'Six plates, one per resource, each with the three questions; the Kafka consumer one lit.',
        key: 'Every resource answers the same three questions.',
        f(o) { const R = [['rCpu', 'CPU', '% in use', 'run queue, throttling', '(rare)'], ['rMem', 'memory', '% of the limit', 'swap, GC pauses', 'OOMKill'],
            ['rPool', 'DB pool', 'in use ÷ 20', 'db_pool_waiting', '503 from a full pool'], ['rWal', 'WAL disk', '% of I/O', 'I/O queue, flush', 'I/O error'],
            ['rNet', 'network', 'bandwidth ÷ capacity', 'drops, retransmissions', 'resets'], ['rKaf', 'Kafka consumer', 'msgs/s ÷ capacity', 'kafka_consumer_lag', 'messages in the DLQ']];
          R.forEach(([nm, n, u, s, e]) => { show(o, nm); o.rows[nm] = act(n, 'RESOURCE', ['U: ' + u, 'dim'], ['S: ' + s, nm === 'rKaf' ? 'acc' : 'dim'], ['E: ' + e, 'dim']); o.on[nm] = nm === 'rKaf' ? 1 : 2; });
          o.cnt = [['RESOURCES', '6'], ['QUESTIONS', 'U · S · E', 'dim'], ['THE HIDDEN ONE', 'consumer lag', 'dim']];
          o.res = [['lag is saturation', 'acc']]; } },
      { id: 'cego', dur: 8, title: 'And if it goes wrong: USE only sees resources', yk: '2.5.0 LIVE (MODULE 22)', act: ['Ship 2.5.0', 'shipping 0.00'],
        code: ['2.5.0 live (module 22)', 'CPU 20% · pool 10% · disk and network at peace', 'U, S, E: all fine', 'pedidos returns shipping 0.00 in Recife', 'the defect is in the service: lesson 9'],
        story: 'With <code>2.5.0</code> live, the CPU is at <b>20%</b>, the pool at <b>10%</b>, the disk and network at peace. Every resource answers the three questions fine. And <code>pedidos</code> keeps returning shipping <b>0.00</b> in Recife. The defect is in the <b>service</b>, and USE does not look there. Lesson 9 covers that gap.',
        look: 'The six plates lit, with no red; the 0.00 shipping label floats above.',
        key: 'Every resource fine, and the service wrong.',
        f(o, t) { const R = [['rCpu', 'CPU', 'U: 20%'], ['rMem', 'memory', 'U: normal'], ['rPool', 'DB pool', 'U: 10% (2 of 20)'], ['rWal', 'WAL disk', 'U: normal'], ['rNet', 'network', 'U: normal'], ['rKaf', 'Kafka consumer', 'lag: 0']];
          R.forEach(([nm, n, u]) => { show(o, nm); o.rows[nm] = act(n, 'OK', [u, 'acc'], ['S: 0', 'dim'], ['E: 0', 'dim']); lit(o, nm); });
          if (t > 1.5) T(o, [450, 280, 70], 'pedidos 2.5.0\nRecife shipping: 0.00', 'bad');
          o.cnt = [['CPU', '20%'], ['POOL', '10%', 'dim'], ['RECIFE SHIPPING', '0.00', 'bad']];
          o.res = t > 1.5 ? [['resources fine, service wrong', 'bad']] : [['all green…', 'acc']]; } },
    ],
    red: [
      { id: 'rate', dur: 7, title: 'Rate: pedidos per cell', yk: 'BLACK FRIDAY: 30 ORDERS/s',
        code: ['30 orders/s by the module 26 shares', 'celula-mkt 40% = 12.0', 'celula-sp 33% = 9.9', 'celula-rio 15% = 4.5', 'celula-recife 12% = 3.6'],
        story: 'RED (Tom Wilkie, Grafana) is the script for <b>services</b>: <b>Rate</b>, <b>Errors</b> and <b>Duration</b>. Start with the Rate of <code>pedidos</code> on Black Friday, cut by cell: <b>12.0</b> in mkt, <b>9.9</b> in SP, <b>4.5</b> in Rio and <b>3.6</b> in Recife. If only mkt goes up, the question is what changed in it; if all four go up together, it is the campaign.',
        look: 'pedidos sends tokens to the four cells; the height of each bar is the rate.',
        key: 'A rate per cell tells the campaign from the local problem.',
        f(o) { show(o, 'svc'); lit(o, 'svc'); o.rows.svc = act('pedidos', 'SERVICE', ['30 orders/s', 'acc'], ['R · E · D', 'dim']);
          cells(o, ['12.0/s', '9.9/s', '4.5/s', '3.6/s'], [1, 0.825, 0.375, 0.3]);
          o.beams.push({ pts: CAB.svc, on: 1 }, { pts: CAB.bus, on: 1 }, ...[0, 1, 2, 3].map(k => ({ pts: branch(k), on: 1, flow: 1 })));
          o.cnt = [['RATE', '30 orders/s'], ['celula-mkt', '12.0', 'dim'], ['celula-recife', '3.6', 'dim']];
          o.res = [['rate per cell', 'acc']]; } },
      { id: 'erros', dur: 7, title: 'Errors: everything that violates the expectation', yk: 'SEMANTIC ERROR', act: ['Define the error', 'three families'],
        code: ['5xx and timeout', 'invalid or duplicated response', 'the 201 with shipping 0.00 (the wrong success)', '409, 422, 429: observed', '  on the dashboard, out of the SLO'],
        story: 'The RED <b>error</b> is defined by what the customer expects. In the store there are three families: the <code>5xx</code> and the <i>timeout</i>; the invalid or duplicated response; and the <b>wrong success</b>, the <code>201</code> with shipping 0.00. The store\'s <code>4xx</code>s (<code>409</code> sold out, <code>422</code>, <code>429</code>) are legitimate decisions: they show on the dashboard and stay out of the SLO.',
        look: 'Three red error plates; the fourth, gray, with the observed 4xx.',
        key: 'Every code is monitored; not every code enters the SLO.',
        f(o) { show(o, 'e5xx', 'eInv', 'eFrete', 'e4xx'); bad(o, 'e5xx', 'eInv', 'eFrete'); o.on.e4xx = 2;
          o.rows.e5xx = act('5xx · timeout', 'ERROR', ['server failure', 'bad'], ['or past the deadline', 'dim']);
          o.rows.eInv = act('invalid · duplicated', 'ERROR', ['broken response', 'bad'], ['double order', 'dim']);
          o.rows.eFrete = act('wrong success', 'ERROR', ['201 with shipping 0.00', 'bad'], ['2.5.0 (module 22)', 'dim']);
          o.rows.e4xx = act('409 · 422 · 429', 'OBSERVED', ['store decision', 'dim'], ['out of the SLO', 'dim']);
          o.cnt = [['ERRORS', '3 families', 'bad'], ['4xx', 'observed', 'dim'], ['IN THE SLO', 'only the errors', 'dim']];
          o.res = [['error written in the store\'s domain', 'acc']]; } },
      { id: 'duracao', dur: 8, title: 'Duration: percentiles from the histogram', yk: 'POST /pedidos, 1,000 REQUESTS', act: ['See the duration', 'histogram'],
        code: ['buckets: 0.25 · 0.5 · 0.8 · 1 · 2.5 s', 'cumulative: 400 · 975 · 992 · 992 · 1,000', 'p50 0.293 · p95 0.489 · p99 0.765 s', '8 slow in 1,000: p99 does not move', 'percentiles cannot be added or averaged'],
        story: '<b>Duration</b> is read in percentiles, estimated from the histogram (lesson 3). In the 1,000-request window: <b>p50 0.293 s</b>, <b>p95 0.489 s</b>, <b>p99 0.765 s</b>, below the 0.8 s SLO. The 8 slow orders of 1063 sit in the 1 to 2.5 s <i>bucket</i> and do not move p99. Cut by route, by version and by cell too.',
        look: 'The histogram bars; the p50, p95 and p99 lines and the SLO line at 0.8 s.',
        key: 'Duration is a percentile, from a histogram, by cut.',
        f(o) { show(o, 'hist', 'pct'); lit(o, 'hist'); o.on.pct = 2;
          o.rows.hist = act('http_server_request_duration_seconds', 'POST /pedidos'); o.rows.hist.hist = 1;
          o.rows.pct = act('percentiles', 'ESTIMATED', ['p50    0.293 s', 'dim'], ['p95    0.489 s', 'acc'], ['p99    0.765 s', 'acc'], ['p99.9  2.3125 s', 'bad'], ['  (real ~1.9 s)', 'dim'], ['SLO    0.8 s', 'dim']);
          o.cnt = [['p95', '0.489 s'], ['p99', '0.765 s', 'dim'], ['SLO', '0.8 s', 'dim']];
          o.res = [['p99 within the SLO', 'acc']]; } },
      { id: 'versao', dur: 8, title: 'Per version: 2.5.0 next to 2.4.0', yk: 'THE MODULE 22 CANARY', act: ['Cut by version', '2.4.0 × 2.5.0'],
        code: ['canary: 10% of the traffic on 2.5.0', 'R, E (5xx) and D: equal in both', 'business E: pedidos_frete_zero_total', '  ÷ total, per city and per version', '2.5.0: 20% (Recife) with shipping 0.00'],
        story: 'The module 22 <i>canary</i> sends 10% of the traffic to <code>2.5.0</code>. RED per version puts the two side by side: the same Rate, 0% <code>5xx</code> and the same Duration. Only the <b>semantic error</b>, the ratio of <code>pedidos_frete_zero_total</code>, reports it: <b>20%</b> of the 2.5.0 orders (the Recife ones) come out with shipping 0.00.',
        look: 'Two panels equal in R and D; the zero-shipping line lights up red on 2.5.0.',
        key: 'Per version and with a business error, 2.5.0 shows up.',
        f(o, t) { const r = t > 1.6; show(o, 'v240', 'v250'); lit(o, 'v240'); if (r) bad(o, 'v250'); else lit(o, 'v250');
          o.rows.v240 = act('pedidos 2.4.0', '90% OF THE TRAFFIC', ['R: 27 orders/s', 'dim'], ['E 5xx: 0%', 'acc'], ['E zero shipping: 0%', 'acc'], ['D p95: same', 'dim']);
          o.rows.v250 = act('pedidos 2.5.0', 'CANARY 10%', ['R: 3 orders/s', 'dim'], ['E 5xx: 0%', 'acc'], [r ? 'E zero shipping: 20%' : 'E zero shipping: …', r ? 'bad' : 'dim'], ['D p95: same', 'dim']);
          o.cnt = [['ZERO SHIPPING ON 2.5.0', r ? '20%' : '…', 'bad'], ['5xx', '0% in both', 'dim'], ['DURATION', 'same', 'dim']];
          o.res = r ? [['only the business error catches it', 'bad']] : []; } },
      { id: 'so5xx', dur: 8, title: 'And if it goes wrong: error = only 5xx, duration = average', yk: 'ALMOST EVERY TEAM\'S FIRST DASHBOARD', act: ['Only 5xx and average', 'the naive dashboard'],
        code: ['error = only 5xx · duration = only average', '2.5.0: 0% 5xx, same average: green', 'shipping 0.00 in Recife for 60 min', 'R$ 15.00 lost per order', 'RED with the domain error and a percentile'],
        story: 'The dashboard almost every team builds first: error is <b>only</b> <code>5xx</code> and duration is <b>only</b> the average. On it, <code>2.5.0</code> stays <b>green</b>: no <code>5xx</code>, same average. The store loses <b>R$ 15.00</b> per order in Recife for <b>60 min</b>. RED only helps with the error written in the store\'s domain and the duration as a percentile.',
        look: 'Both panels lit with no red; the loss label floats over 2.5.0.',
        key: 'With error = 5xx and average, the defect stays green.',
        f(o, t) { show(o, 'v240', 'v250'); lit(o, 'v240', 'v250');
          o.rows.v240 = act('pedidos 2.4.0', '90% OF THE TRAFFIC', ['R: 27 orders/s', 'dim'], ['E (only 5xx): 0%', 'acc'], ['D (average): same', 'acc']);
          o.rows.v250 = act('pedidos 2.5.0', 'CANARY 10%', ['R: 3 orders/s', 'dim'], ['E (only 5xx): 0%', 'acc'], ['D (average): same', 'acc'], ['dashboard: green', 'acc']);
          if (t > 1.4) T(o, [670, 300, 60], 'R$ 15.00 per order\nin Recife, 60 min', 'bad');
          o.cnt = [['DASHBOARD', 'green'], ['LOSS', 'R$ 15.00/order', 'bad'], ['UNTIL NOTICED', '60 min', 'bad']];
          o.res = [['green and wrong', 'bad']]; } },
    ],
    golden: [
      { id: 'painel', dur: 7, title: 'Four dials for celula-recife', yk: 'CELULA-RECIFE, BLACK FRIDAY',
        code: ['latency: success p95 489 ms (SLO 800)', 'traffic: 3.6 orders/s', 'errors: 0% 5xx, zero shipping 0', 'saturation: pool 0.4 of 20 (2%)', '  replica lag 0.3 s (alert 0.5 s)'],
        story: 'If you could only have four numbers, the SRE book picks these: <b>latency</b>, <b>traffic</b>, <b>errors</b> and <b>saturation</b>. In <code>celula-recife</code>: success p95 <b>489 ms</b> (SLO 800), <b>3.6</b> orders/s, <b>0%</b> of <code>5xx</code> and zero shipping at 0, pool at <b>2%</b> and replica lag at 0.3 s (alert at 0.5 s). It is RED + saturation, looking at what the <b>user</b> feels.',
        look: 'Four dials side by side; none in the red.',
        key: 'Four numbers describe what the user feels.',
        f(o) { show(o, ...GS); GS.forEach(g => o.on[g] = 2);
          o.rows.gLat = act('latency', 'p95'); o.rows.gLat.lat = { rows: [['success p95', 489, 'acc']], max: 900, mark: 800 };
          o.rows.gTraf = act('traffic', 'ORDERS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3.6/s', sub: 'of 30 in the store' };
          o.rows.gErr = act('errors', '5xx · BUSINESS'); o.rows.gErr.gauge = { f: 0, val: '0%', sub: 'zero shipping: 0' };
          o.rows.gSat = act('saturation', 'THE TIGHTEST'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0.4 of 20' };
          o.cnt = [['LATENCY p95', '489 ms'], ['TRAFFIC', '3.6/s', 'dim'], ['SATURATION', 'pool 2%', 'dim']];
          o.res = [['Recife healthy', 'acc']]; } },
      { id: 'breaker', dur: 8, title: 'The breaker opens and the average improves', yk: 'AVERAGE = 0.3 × 2 + 0.7 × 275', act: ['Open the breaker', 'module 21'],
        code: ['breaker open (module 21)', '30% fail in 2 ms', '70% answer in 275 ms', 'average = 0.3 × 2 + 0.7 × 275', '  = 193.1 ms (down from 275)'],
        story: 'The module 21 <i>breaker</i> opens and refuses the call right away: <b>30%</b> of the requests fail in <b>2 ms</b>; the other 70% answer in the usual <b>275 ms</b>. The average latency becomes 0.3 × 2 + 0.7 × 275 = <b>193 ms</b>. It fell from 275 to 193 while 3 in every 10 customers get an error. A dashboard with a single average only sees an improvement.',
        look: 'The average bar shrinks from 275 to 193 ms; the errors dial rises to 30%.',
        key: 'The average improves while the system gets worse.',
        f(o, t) { const f = lin(t, 0.8, 3, 0, 1), avg = 275 - 81.9 * f; show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; lit(o, 'gLat'); if (f > 0) bad(o, 'gErr'); else o.on.gErr = 2;
          o.rows.gLat = act('latency', 'AVERAGE'); o.rows.gLat.lat = { rows: [['average', avg, 'acc']], max: 300 };
          o.rows.gTraf = act('traffic', 'ORDERS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3.6/s', sub: 'of 30 in the store' };
          o.rows.gErr = act('errors', 'BREAKER'); o.rows.gErr.gauge = { f: 0.3 * f, val: Math.round(30 * f) + '%', sub: 'fail in 2 ms', tone: f > 0 ? 'bad' : '' };
          o.rows.gSat = act('saturation', 'THE TIGHTEST'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0.4 of 20' };
          o.cnt = [['AVERAGE LATENCY', Math.round(avg) + ' ms'], ['BEFORE', '275 ms', 'dim'], ['FAILING', Math.round(30 * f) + '%', 'bad']];
          o.res = f >= 1 ? [['193 ms: "improved"?', 'bad']] : [['the breaker opening…', 'dim']]; } },
      { id: 'separa', dur: 7, title: 'Two curves: success and error', yk: 'SRE BOOK: SEPARATE THE LATENCIES', act: ['Separate the latencies', 'success × error'],
        code: ['two curves, not an average', 'success: 275 ms (the normal)', 'error: 2 ms, in 30% of the requests', 'the success one did not change', 'the error one shows the fast failure'],
        story: 'Separate the latencies, as the SRE book asks (and contrary to what the article says). The <b>success</b> curve stays at <b>275 ms</b>; the <b>error</b> one shows <b>2 ms</b> in 30% of the requests. The problem, which the average hid, shows up.',
        look: 'Three bars: the average, the success at 275 and the error at 2 ms, in red.',
        key: 'Success and error latency, always separate.',
        f(o) { show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; lit(o, 'gLat'); bad(o, 'gErr');
          o.rows.gLat = act('latency', 'SEPARATE'); o.rows.gLat.lat = { rows: [['average', 193, 'dim'], ['success', 275, 'acc'], ['error (30%)', 2, 'bad']], max: 300 };
          o.rows.gTraf = act('traffic', 'ORDERS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3.6/s', sub: 'of 30 in the store' };
          o.rows.gErr = act('erros', 'BREAKER'); o.rows.gErr.gauge = { f: 0.3, val: '30%', sub: 'fail in 2 ms', tone: 'bad' };
          o.rows.gSat = act('saturation', 'THE TIGHTEST'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0.4 of 20' };
          o.cnt = [['SUCCESS', '275 ms'], ['ERROR', '2 ms', 'bad'], ['AVERAGE', '193 ms', 'dim']];
          o.res = [['the fast error shows up', 'acc']]; } },
      { id: 'lento', dur: 7, title: 'A slow error is worse than a fast one', yk: 'SRE BOOK, MONITORING DISTRIBUTED SYSTEMS', act: ['Slow error', '8 s'],
        code: ['fast error (2 ms): try again', '  or give up', 'slow error (8 s): a connection,', '  a thread and the patience tied up', 'only visible with the latencies separate'],
        story: 'The reverse also holds: <b>a slow error is worse than a fast error</b>. Whoever gets the error in 2 ms tries again or gives up; whoever waits <b>8 s</b> for an error has already spent a connection, a <i>thread</i> and their patience. That difference only shows up with the two latencies separate.',
        look: 'The error bar runs across the dial: 8 s against 275 ms for success.',
        key: 'The error latency matters too.',
        f(o) { show(o, ...GS); o.on.gTraf = 2; o.on.gSat = 2; bad(o, 'gLat', 'gErr');
          o.rows.gLat = act('latency', 'SEPARATE'); o.rows.gLat.lat = { rows: [['success', 275, 'acc'], ['slow error', 8000, 'bad']], max: 8000 };
          o.rows.gTraf = act('traffic', 'ORDERS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3.6/s', sub: 'of 30 in the store' };
          o.rows.gErr = act('errors', 'SLOW'); o.rows.gErr.gauge = { f: 0.3, val: '30%', sub: '8 s each', tone: 'bad' };
          o.rows.gSat = act('saturation', 'THE TIGHTEST'); o.rows.gSat.gauge = { f: 0.02, val: '2%', sub: 'pool 0.4 of 20' };
          o.cnt = [['SLOW ERROR', '8 s', 'bad'], ['FAST ERROR', '2 ms', 'dim'], ['SUCCESS', '275 ms', 'dim']];
          o.res = [['8 s held per error', 'bad']]; } },
      { id: 'previsao', dur: 8, title: 'Saturation with a forecast', yk: 'THE TIGHTEST RESOURCE', act: ['Forecast the saturation', 'disk'],
        code: ['saturation: the tightest resource', '"the disk is at 80%": so what?', '"the disk fills in 4 h": act now', 'the forecast becomes an alert', '  before the symptom'],
        story: 'Saturation is the signal for acting <b>before</b>. "The disk is at 80%" does not say what to do; "<b>the disk fills in 4 h</b>" does. The dial carries the trend forward and marks when the resource hits the limit. The other signals feed other decisions: latency and errors give the SLI from lesson 7; traffic, the module 23 capacity plan.',
        look: 'The saturation dial turns into a chart: the line rises to 80% and the dashed projection touches 100% in 4 h.',
        key: 'Good saturation is the kind that says when it will run out.',
        f(o, t) { show(o, ...GS); GS.forEach(g => o.on[g] = 2); bad(o, 'gSat');
          o.rows.gLat = act('latency', 'p95'); o.rows.gLat.lat = { rows: [['success p95', 489, 'acc']], max: 900, mark: 800 };
          o.rows.gTraf = act('traffic', 'ORDERS/s'); o.rows.gTraf.gauge = { f: 0.12, val: '3.6/s', sub: 'of 30 in the store' };
          o.rows.gErr = act('errors', '5xx · BUSINESS'); o.rows.gErr.gauge = { f: 0, val: '0%', sub: 'zero shipping: 0' };
          o.rows.gSat = act('saturation', 'DISK'); o.rows.gSat.fc = { now: 0.8, f: lin(t, 0.6, 3, 0, 1) };
          o.cnt = [['DISK', '80%'], ['FORECAST', 'fills in 4 h', 'bad'], ['ACTION', 'now', 'dim']];
          o.res = [['fills in 4 h', 'bad']]; } },
      { id: 'acumulo', dur: 8, title: 'And if it goes wrong: monitoring by accumulation', yk: 'THE OPPOSITE OF THE FOUR SIGNALS (ARTICLE)', act: ['Pile up 300 dashboards', 'by accumulation'],
        code: ['300 dashboards, thousands of metrics', '"is the store fine?": open ten dashboards', 'the mental model is lost', 'four signals × four cells', '  = 16 numbers to start'],
        story: 'The article names the opposite: <b>monitoring by accumulation</b>. The team piles up <b>300 dashboards</b> and thousands of metrics; when someone asks "is the store fine?", nobody answers without opening ten of them. Four signals per cell (<b>16 numbers</b>) do not replace the details, but give a place to start. USE for the resource, RED for the service, the four signals for the user.',
        look: 'The four dials disappear behind a wall of 300 little squares blinking.',
        key: 'More dashboards do not answer whether the store is fine.',
        f(o) { show(o, 'mural'); bad(o, 'mural'); o.rows.mural = act('300 dashboards', '"IS THE STORE FINE?"'); o.rows.mural.mural = Math.floor(clk * 2.5);
          o.cnt = [['DASHBOARDS', '300', 'bad'], ['"IS IT FINE?"', 'no answer', 'bad'], ['FOUR SIGNALS', '16 numbers', 'dim']];
          o.res = [['no mental model', 'bad']]; } },
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
      else { x.fillStyle = PAPER(); x.textAlign = 'center'; fitFont(x, u, 'report', 10, w - 4); x.fillText('report', u(X + w / 2), u(Y + h / 2)); x.textAlign = 'left'; } }
    const n = p.cells.filter(Boolean).length, lab = n >= 20 ? '20 of 20 · full' : `${n} of 20 in use`;
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
    x.fillStyle = toneC('hi'); fitFont(x, u, '80% now', 12, 80); x.fillText('80% now', u(xn - 30), u(Y(p.now) + 18));
    x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'now', 11, 60); x.fillText('now', u(xn), u(y0 + 12)); x.fillText('+4 h', u(x1 - 14), u(y0 + 12));
    x.fillStyle = BAD(); fitFont(x, u, 'fills in 4 h', 15, W_ - 12); x.fillText('fills in 4 h', u(W_ / 2), u(H_ - 12)); x.textAlign = 'left';
  }
  // o histograma da janela de 1.000: contagem por bucket (não acumulada) e as linhas dos percentis
  const HB = [['0.05', 0], ['0.1', 0], ['0.25', 400], ['0.5', 575], ['0.8', 17], ['1', 0], ['2.5', 8], ['5', 0]];
  function drawHist(x, u, C, W_, H_) {
    const x0 = 12, w = W_ - 24, bw = w / HB.length, y0 = H_ - 40, top = 64, Hm = y0 - top, X = v => x0 + v * bw;
    HB.forEach(([le, n], i) => { const h = n ? Math.max(4, Hm * Math.sqrt(n / 575)) : 0, slow = i === 6;
      x.fillStyle = slow ? BAD() : accC(); if (h) x.fillRect(u(X(i) + 4), u(y0 - h), u(bw - 8), u(h));
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X(i) + 4), u(top), u(bw - 8), u(Hm));
      x.textAlign = 'center'; x.fillStyle = slow ? BAD() : toneC('hi'); fitFont(x, u, String(n), 13, bw - 4); x.fillText(String(n), u(X(i) + bw / 2), u(y0 - h - 9));
      x.fillStyle = INK(); fitFont(x, u, '≤ ' + le, 11, bw - 2); x.fillText('≤ ' + le, u(X(i) + bw / 2), u(y0 + 12)); });
    x.fillStyle = INK(); fitFont(x, u, 'requests per bucket (s) · the 8 slow ones in red', 11, W_ - 16); x.fillText('requests per bucket (s) · the 8 slow ones in red', u(W_ / 2), u(y0 + 28));
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
    x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, 'each with its own number, none with the answer', 13, W_ - 16);
    x.fillText('each with its own number, none with the answer', u(W_ / 2), u(H_ - 13)); x.textAlign = 'left';
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
    x.textAlign = 'center'; x.fillStyle = INK(); fitFont(x, u, 'ERROR BUDGET', 13, W_ - 16); x.fillText('ERROR BUDGET', u(W_ / 2), u(22));
    x.fillStyle = tk.tone === 'bad' ? BAD() : accC(); fitFont(x, u, tk.lab, 54, W_ - 16); x.fillText(tk.lab, u(W_ / 2), u(H_ / 2 - 4));
    x.fillStyle = toneC('hi'); fitFont(x, u, tk.sub, 14, W_ - 14); x.fillText(tk.sub, u(W_ / 2), u(H_ / 2 + 38));
    x.fillStyle = INK(); fitFont(x, u, 'of 12,960 · 43.2 min', 12, W_ - 16); x.fillText('of 12,960 · 43.2 min', u(W_ / 2), u(H_ - 18)); x.textAlign = 'left';
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
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const DATA = {
    orcamento: () => `<table class="h3-sum"><tr><th>incident</th><th>math</th><th>burned</th></tr><tr${on_(step === 1)}><td>SP outage (27)</td><td>9.9 × 65 = 643.5</td><td>4.97%</td></tr><tr${on_(step === 2)}><td>PSP-A without protection (21)</td><td>30 × 90 = 2,700</td><td>20.8%</td></tr><tr${on_(step === 3)}><td>1063 episode</td><td>8 above 800 ms</td><td>0.06%</td></tr></table><li>Budget: 5/s × 2,592,000 s = <b>12,960,000</b> requests; 0.1% = <b>12,960</b> bad = <b>43.2 min</b></li><li><i>Burn rate</i> (SRE Workbook): <b>14.4×</b> in 1 h = 2% and <b>6×</b> in 6 h = 5% (page, with the short window of 5 and 30 min); <b>1×</b> in 3 days = 10% (<i>ticket</i>); 100% errors = <b>1,000×</b></li><li>Policy (example): &gt; 50% ship · 50–10% fixes only · &lt; 10% freeze · 0% war room</li><li>The SP outage is a simplified calculation (9.9/s of <code>celula-sp</code> against a budget at an average of 5/s)</li><li>Math from <code>c28.py</code> (10/21/2026); no Prometheus was run</li>`,
    slo: () => `<table class="h3-sum"><tr><th>target</th><th>failure per month (30 d)</th></tr><tr><td>99%</td><td>432 min</td></tr><tr${on_(step === 2)}><td>99.5% (SLA mkt-01)</td><td>216 min</td></tr><tr${on_(step === 1 || step === 3)}><td>99.9% (SLO)</td><td>43.2 min</td></tr><tr><td>99.95%</td><td>21.6 min</td></tr><tr${on_(step === 4)}><td>99.99%</td><td>4.32 min</td></tr></table><li>SLI of <code>POST /pedidos</code>: good = <code>2xx</code> and ≤ 800 ms; valid = everything except <code>422</code>, <code>409</code> and <code>429</code></li><li>Per cell (module 26): mkt 40% = <b>5,184</b> · sp 33% = <b>4,276.8</b> · rio 15% = <b>1,944</b> · recife 12% = <b>1,555.2</b></li><li>The article: a 99.95% SLO with a 99.98% SLI gives a 0.03% margin (12.96 min in 30 days)</li>`,
    use: () => `<table class="h3-sum"><tr><th>resource</th><th>U</th><th>S</th><th>E</th></tr><tr><td>CPU</td><td>% in use</td><td>run queue</td><td>(rare)</td></tr><tr><td>memory</td><td>% of the limit</td><td>swap, GC</td><td>OOMKill</td></tr><tr${on_(step === 3)}><td>DB pool</td><td>in use ÷ 20</td><td>db_pool_waiting</td><td>503</td></tr><tr><td>WAL disk</td><td>% of I/O</td><td>I/O queue</td><td>I/O error</td></tr><tr><td>network</td><td>bandwidth</td><td>drops</td><td>resets</td></tr><tr${on_(step === 4)}><td>Kafka consumer</td><td>msgs/s</td><td>kafka_consumer_lag</td><td>DLQ</td></tr></table><li><code>catalogo-3</code> (module 14, 20:03): U <b>99%</b> (the others 64%, fleet <b>67.5%</b>); S: 64 × 1.01 = <b>64.6</b> of 86.4 in flight; E: 1% of <code>504</code>s at 640 req/s</li><li>Module 25 pool (real k6): 0.4 of 20 without the report; 40.4 requested with it; <code>503</code> in 33% of checkout and 10% of status</li><li>The table is a reading model, not a measurement; the method is at brendangregg.com/usemethod.html</li>`,
    red: () => `<table class="h3-sum"><tr><th>cell</th><th>share</th><th>rate (BF)</th></tr><tr${on_(step === 0)}><td>celula-mkt</td><td>40%</td><td>12.0/s</td></tr><tr${on_(step === 0)}><td>celula-sp</td><td>33%</td><td>9.9/s</td></tr><tr${on_(step === 0)}><td>celula-rio</td><td>15%</td><td>4.5/s</td></tr><tr${on_(step === 0)}><td>celula-recife</td><td>12%</td><td>3.6/s</td></tr></table><li>Histogram (1,000 req): <code>le</code> 0.25 → 400 · 0.5 → 975 · 0.8 → 992 · 1 → 992 · 2.5 → 1,000; p50 0.293 · p95 0.489 · p99 0.765 · p99.9 2.3125 s</li><li>Errors: <code>5xx</code>, <i>timeout</i>, invalid, duplicated, the <code>201</code> with shipping 0.00; <code>409</code>, <code>422</code> and <code>429</code> observed, out of the SLO</li><li><i>Canary</i> (module 22): 10% on <code>2.5.0</code>; 20% of its orders (Recife) with shipping 0.00; R$ 15.00 per order for 60 min</li><li>The per-version rate (27 and 3 orders/s) is the split of 30/s by the 10% <i>canary</i></li>`,
    golden: () => `<table class="h3-sum"><tr><th>signal</th><th>celula-recife (example)</th></tr><tr${on_(step >= 1 && step <= 3)}><td>latency</td><td>success p95 489 ms (SLO 800); breaker error: 2 ms</td></tr><tr><td>traffic</td><td>3.6 orders/s</td></tr><tr${on_(step >= 1 && step <= 3)}><td>errors</td><td>0% 5xx; zero shipping at 0</td></tr><tr${on_(step === 4)}><td>saturation</td><td>pool 2% (0.4 of 20); lag 0.3 s (alert 0.5 s)</td></tr></table><li>Open <i>breaker</i>: 0.3 × 2 + 0.7 × 275 = <b>193.1 ms</b> (the average falls from 275 while 30% fail)</li><li>Four signals = RED + saturation; USE for the resource, RED for the service, the four signals for the user</li><li>Correction to the article: the SRE book says to <b>separate</b> the success latency from the error latency</li><li>4 cells × 4 signals = 16 numbers; the "fills in 4 h" forecast is an example</li>`,
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
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'THE MATH')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'contrato') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
