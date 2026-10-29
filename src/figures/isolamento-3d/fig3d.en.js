// Figura 3D (iso-glow): o raio e as paredes. A loja vista como uma planta: os 3 shards de pedidos (o shard-2 maior, com o mkt-01),
// o pagamentos (2 réplicas), as 10 réplicas do catalogo, o recomendacoes, o primário de SP e as réplicas do Rio e de Recife, e o pool
// de conexões do pagamentos como o casco de um navio (paredes que sobem entre os compartimentos 50/30/20).
// Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=blast|healthcheck|dados|bulkhead|shuffle; ?step=N abre no passo N).
// Dados: docs/escrita/resiliencia-brief.md e as aulas 3, 4, 12 e 13 (1/N 33,3% × shard-2 60%; 5 s × 3 = 15 s, 225 e 960 perdidas,
// pânico a 50%; RTO 35 s, 1.050 escritas, RPO 9 · 24, 640 → 128 req/s; pool de 100 em 3,33 s × 50/30/20 em 1,67 s, o 1058 do Caio
// às 20:20:04 com frete Rio 12,00 = 71,70; pares do módulo 16: mkt-01 {8, 9}, lena-77 {6, 8}, bia-31 {4, 6}, caio-58 {1, 4}, davi-12 {1, 9}).
FIGS3D.push({ id: 'isolamento', name: 'Isolation', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 2) => v.toFixed(d);
  const clock = s => '20:20:' + String(Math.floor(Math.max(0, s))).padStart(2, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['blast', 'healthcheck', 'dados', 'bulkhead', 'shuffle'];
  const SCNAME = { blast: 'Blast', healthcheck: 'Healthcheck', dados: 'Data', bulkhead: 'Bulkhead', shuffle: 'Shuffle' };
  const SCFULL = { blast: 'The blast radius', healthcheck: 'Replicas and healthcheck', dados: 'The data layer',
    bulkhead: 'Bulkheads: the walls', shuffle: 'Shuffle sharding' };
  const AULA = { blast: 'aula-3-blast-radius', healthcheck: 'aula-4-replicacao-balanceamento-e-healthchecks',
    dados: 'aula-12-resiliencia-na-camada-de-dados', bulkhead: 'aula-13-sharding-e-bulkheads', shuffle: 'aula-13-sharding-e-bulkheads' };
  let clk = 0, sc = 'blast', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-isolamento3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0)
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 20, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 }, CELL = { s1: 17, fs: 11, lh: 12, y0: 37 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  // as 10 réplicas do catalogo (Blast, Healthcheck e Shuffle usam a mesma fileira)
  const CX = i => 40 + (i - 1) * 55, CW = 49, CY = 196, CD = 58, CC = i => CX(i) + CW / 2;
  for (let i = 1; i <= 10; i++) block('c' + i, CX(i), CY, CW, CD, 14, CELL, 5);
  // Blast: shards, pagamentos, recomendacoes e a tela da loja
  block('s0', 40, 40, 150, 120, 26); block('s1', 205, 40, 150, 120, 26); block('s2', 370, 40, 215, 120, 30);
  block('pag', 620, 40, 244, 120, 24); block('rec', 620, 196, 244, 58, 14, SMALL); block('tela', 300, 320, 300, 112, 16);
  // Healthcheck: o balanceador, as 2 réplicas do pagamentos e o PSP-A
  block('lb', 330, 350, 244, 90, 16); block('p1', 90, 190, 250, 110, 22); block('p2', 564, 190, 250, 110, 22); block('pspH', 330, 40, 244, 100, 20);
  // Dados: primário e réplicas atrás, pedidos, cache e catalogo na frente
  block('sp', 40, 40, 250, 120, 28); block('rio', 330, 40, 250, 120, 28); block('recife', 620, 40, 244, 120, 28);
  block('ped', 40, 260, 250, 100, 20); block('cache', 330, 230, 250, 100, 18); block('cat', 330, 360, 250, 74, 14, SMALL);
  // Bulkhead: o Caio, o pagamentos, o pool e as três dependências
  block('caio', 40, 60, 250, 110, 16); block('pagB', 40, 230, 250, 120, 22); block('pool', 330, 110, 300, 240, 18);
  block('psp', 680, 110, 184, 74, 18, SMALL); block('frete', 680, 195, 184, 74, 18, SMALL); block('email', 680, 280, 184, 74, 18, SMALL);
  // Shuffle: os cinco clientes do módulo 16
  const CLI = [['mkt-01', [8, 9]], ['lena-77', [6, 8]], ['bia-31', [4, 6]], ['caio-58', [1, 4]], ['davi-12', [1, 9]]];
  const KX = k => 40 + k * 169, KC = k => KX(k) + 74;
  CLI.forEach((c, k) => block('k' + k, KX(k), 330, 148, 90, 14, SMALL));
  const NAMES = Object.keys(B);
  // as paredes do pool (bulkheads): duas lâminas que sobem entre os compartimentos 50 | 30 | 20
  const PX = 330 + 2.5, PY = 110 + 2.5, GX = 6, GY = 30, GW = 300 - 5 - 12, GH = 170, COLW = GW / 10;
  const WALLS = [5, 8].map(col => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 4, GH + 6, 18, 1, mat, g); return { g, mat, f: 0, x: PX + GX + col * COLW - 2 }; });
  // pilhas: falhas, escritas sem destino, cotações recusadas
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 64 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 22 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
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
  const TAGS = Array.from({ length: 7 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TF = x => [x, 446, 24];   // balão na faixa livre da frente da prancha

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const BR = (y, i) => P3([[CC(i), y], [CC(i), CY + CD]]);   // ramal de um barramento até a réplica i do catalogo
  const CAB = {
    // Blast: a tela chama os componentes
    tbus: P3([[420, 320], [420, 280]]), cbus: P3([[CC(1), 280], [CC(10), 280]]),
    trec: P3([[570, 320], [570, 292], [742, 292], [742, 254]]), tpag: P3([[600, 400], [880, 400], [880, 100], [864, 100]]),
    tsh: P3([[300, 400], [22, 400], [22, 176], [477, 176]]), sh0: P3([[115, 176], [115, 160]]), sh1: P3([[280, 176], [280, 160]]), sh2: P3([[477, 176], [477, 160]]),
    // Healthcheck
    lp1: P3([[400, 350], [400, 325], [215, 325], [215, 300]]), lp2: P3([[504, 350], [504, 325], [689, 325], [689, 300]]),
    p1psp: P3([[215, 190], [215, 90], [330, 90]]), p2psp: P3([[689, 190], [689, 90], [574, 90]]),
    lcat: P3([[452, 350], [452, 280]]),
    // Dados
    psp: P3([[165, 260], [165, 160]]), rep1: P3([[290, 100], [330, 100]]), rep2: P3([[250, 160], [250, 185], [742, 185], [742, 160]]),
    crio: P3([[455, 230], [455, 160]]), ccache: P3([[455, 360], [455, 330]]), prio: P3([[290, 300], [310, 300], [310, 205], [400, 205], [400, 160]]),
    // Bulkhead
    cpag: P3([[165, 170], [165, 230]]), ppool: P3([[290, 290], [330, 290]]),
    qpsp: P3([[630, 147], [680, 147]]), qfr: P3([[630, 232], [680, 232]]), qem: P3([[630, 317], [680, 317]]),
  };
  const catBranches = (y, f = () => ({})) => Array.from({ length: 10 }, (_, k) => ({ pts: BR(y, k + 1), ...f(k + 1) }));
  // Shuffle: cada cliente tem um cabo reto e fino para cada réplica do seu par (um grafo, não um barramento)
  const GRP = (k, r, j) => P3([[KC(k) + (j ? 24 : -24), 330], [CC(r), CY + CD]]);   // reta do cliente k à réplica r
  const SHC = (k, j) => GRP(k, CLI[k][1][j], j);
  // um ponto de luz andando num caminho: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const rev = pts => pts.slice().reverse();

  // ── conteúdo dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  const cells = (o, st = {}) => { for (let i = 1; i <= 10; i++) { const s = st[i]; o.show['c' + i] = 1;
    o.rows['c' + i] = act(String(i), '', [s === 'bad' ? 'hung' : s === 'off' ? 'down' : 'ok', s === 'bad' || s === 'off' ? 'bad' : 'dim']);
    if (s === 'bad' || s === 'off') o.on['c' + i] = 'bad'; else if (s === 'on') o.on['c' + i] = 1; } };
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], walls: 0 }; }

  // Blast: a planta inteira; down = o componente derrubado no passo
  const TELA = (st = {}) => { const r = (k, lab) => { const v = st[k]; return [`${lab}: ${v || 'ok'}`, v ? 'bad' : 'dim']; };
    const d = act('store screen', 'WHAT THE CUSTOMER SEES', r('cat', 'catalog'), r('rec', 'recommendations'), r('chk', 'checkout'), r('meus', 'my orders')); d.fs = 14; d.lh = 17.5; d.y0 = 39; return d; };
  function blastBase(o, down) {
    show(o, 's0', 's1', 's2', 'pag', 'rec', 'tela'); cells(o, down === 'cat' ? { 3: 'off' } : {});
    o.rows.s0 = act('shard-0', 'ORDERS', ['1/3 of customers', 'dim']); o.rows.s1 = act('shard-1', 'ORDERS', ['1/3 of customers', 'dim']);
    o.rows.s2 = act('shard-2', 'ORDERS', ['1/3 of customers', 'dim'], ['+ mkt-01', 'dim']);
    o.rows.pag = act('pagamentos', 'SERVICE', ['charges at PSP', 'dim'], ['2 replicas · 40/s', 'dim']);
    o.rows.rec = act('recomendacoes', 'SERVICE', ['"recomendado": [...]', 'dim']);
    o.rows.tela = TELA();
    const dn = k => down === k ? 'bad' : '';
    // os cabos ficam apagados; só o do componente derrubado fica vermelho
    o.beams = [{ pts: CAB.tbus }, { pts: CAB.cbus }, ...catBranches(280, i => ({ tone: down === 'cat' && i === 3 ? 'bad' : '' })),
      { pts: CAB.trec, tone: dn('rec') }, { pts: CAB.tpag, tone: dn('pag') },
      { pts: CAB.tsh, tone: dn('s2') }, { pts: CAB.sh0 }, { pts: CAB.sh1 }, { pts: CAB.sh2, tone: dn('s2') }];
    T(o, [150, 268, 24], 'catalogo · 10 replicas', 'dim');
  }
  // Healthcheck: o balanceador e as duas réplicas do pagamentos
  const LB = (...r) => act('lb-loja', 'BALANCER', ...r);
  const REP = (n, ...r) => act('pagamentos-' + n, 'REPLICA', ...r);
  function hcBase(o) {
    show(o, 'lb', 'p1', 'p2', 'pspH');
    o.rows.lb = LB(['30 orders/s', 'dim'], ['GET /saude every 5 s', 'dim'], ['in pool: 2 of 2', 'hi']);
    o.rows.p1 = REP(1, ['15/s · 20/s capacity', 'dim'], ['/saude: 200', 'acc']);
    o.rows.p2 = REP(2, ['15/s · 20/s capacity', 'dim'], ['/saude: 200', 'acc']);
    o.rows.pspH = act('PSP-A', 'CHARGE', ['p50 180 ms', 'dim']);
    o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, on: 1, flow: 1 }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
  }
  // Dados
  const PG = (nm, meta, ...r) => act(nm, meta, ...r);
  function dbBase(o) {
    show(o, 'sp', 'rio', 'recife', 'ped', 'cache', 'cat');
    o.rows.sp = PG('pg-sp', 'PRIMARY', ['reads and writes', 'dim'], ['gets 30 writes/s', 'hi']);
    o.rows.rio = PG('pg-rio', 'REPLICA', ['read-only · async', 'dim'], ['serves the cache', 'dim']);
    o.rows.recife = PG('pg-recife', 'REPLICA', ['read-only · async', 'dim'], ['farther from SP', 'dim']);
    o.rows.ped = act('pedidos', 'WRITES', ['30 orders/s', 'hi'], ['INSERT on primary', 'dim']);
    o.rows.cache = act('catalog cache', 'TTL 60 s', ['hit rate: 80%', 'dim'], ['to origin: 128 req/s', 'dim']);
    o.rows.cat = act('catalogo', 'READS', ['640 req/s', 'hi']);
    o.beams = [{ pts: CAB.psp, on: 1, flow: 1 }, { pts: CAB.rep1, on: 1 }, { pts: CAB.rep2, on: 1 }, { pts: CAB.crio, on: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
  }
  // Bulkhead: pool = { walls, psp (conexões presas no PSP-A), fr, em (conexões de frete e e-mail), tone }
  function bhBase(o) {
    show(o, 'caio', 'pagB', 'pool', 'psp', 'frete', 'email');
    o.rows.caio = act('Caio · Rio', 'ORDER 1058', ['3 blue mugs · 59.70', 'dim'], ['not closed yet', 'dim']);
    o.rows.pagB = act('pagamentos', '30 ORDERS/S', ['charges · quotes shipping', 'dim'], ['sends email', 'dim']);
    o.rows.pool = act('connection pool', 'PAGAMENTOS'); o.rows.pool.pool = { walls: 0, psp: 5, fr: 2, em: 2, tone: 'acc' };
    o.rows.psp = act('PSP-A', 'CHARGE', ['p50 180 ms', 'dim'], ['responds', 'acc']);
    o.rows.frete = act('shipping quote', 'FAST', ['responds', 'acc']);
    o.rows.email = act('email', 'FAST', ['responds', 'acc']);
    o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, on: 1, flow: 1 }, { pts: CAB.qfr, on: 1 }, { pts: CAB.qem, on: 1 }];
  }
  // Shuffle: st = estado de cada réplica, kt = estado de cada cliente
  function shBase(o, st = {}, kt = {}) {
    cells(o, st);
    CLI.forEach(([nm, pr], k) => { show(o, 'k' + k); const s = kt[k];
      o.rows['k' + k] = act(nm, `{${pr.join(', ')}}`, [s === 'bad' ? 'no catalogo' : s === 'half' ? 'loses half' : s === 'one' ? 'keeps the other' : 'served', s === 'bad' || s === 'half' ? 'bad' : s === 'one' ? 'acc' : 'dim']);
      if (s === 'bad' || s === 'half') o.on['k' + k] = 'bad'; else if (s === 'one') o.on['k' + k] = 1; });
    T(o, [150, 180, 30], 'catalogo-1 … catalogo-10', 'dim');
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    blast: [
      { id: 'planta', dur: 5, title: 'The store as a floor plan', yk: 'THE FOUR QUESTIONS',
        code: ['if this component stops:', '  what stops working?', '  what works in part?', '  how long until I\'m back?', '  does it create inconsistency?'],
        story: 'Each block is a component of the store: the 3 <i>shards</i> of the <code>pedidos</code> table (<code>shard-2</code> is the biggest), <code>pagamentos</code>, the 10 replicas of <code>catalogo</code> and <code>recomendacoes</code>. In front, the store screen with the four parts the customer uses. The <b>blast radius</b> of a component is how much of that screen goes dark when it stops.',
        look: 'All the cables leave the screen. In the next steps, one component turns red at a time and the stain shows up on the screen.',
        key: 'The blast radius is how much of the store stops when a component fails.',
        f(o) { blastBase(o); lit(o, 'tela');
          o.cnt = [['QUESTIONS', '4'], ['COMPONENTS', '15', 'dim'], ['RADIUS', 'to measure', 'dim']];
          o.res = [['small, known radius', 'acc']]; } },
      { id: 'rec', dur: 5, title: 'recomendacoes goes down: one section disappears', yk: 'THE MODULE 9 FALLBACK', act: ['Take down recomendacoes', 'small radius'],
        code: ['recomendacoes: down', 'bff-app answers without the section:', '  "recomendado": []   in 100 ms', 'catalog, checkout, my orders: ok'],
        story: '<code>recomendacoes</code> stops. <code>bff-app</code> already has the module 9 <i>fallback</i>: it answers without the section, with <code>"recomendado": []</code>, in 100 ms. The screen loses one part and the rest keeps going: catalog, checkout and my orders work.',
        look: 'recomendacoes turns red and only the "recommendations" line on the screen goes dark.',
        key: 'Small radius: one section of the screen disappears.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'rec' : ''); lit(o, 'tela'); if (d) { bad(o, 'rec'); o.rows.rec = act('recomendacoes', 'DOWN', ['not responding', 'bad']); o.rows.tela = TELA({ rec: '[] (no section)' }); }
          o.cnt = [['RADIUS', d ? '1 section' : '…', d ? 'acc' : 'dim'], ['CHECKOUT', 'ok', 'dim'], ['BROWSING', 'ok', 'dim']];
          o.res = d ? [['one section gone, the rest keeps going', 'acc']] : [];
          if (d) T(o, [742, 225, 40], 'no recommendations', 'bad'); } },
      { id: 'catalogo', dur: 5, title: '1 of 10 catalogo replicas: 10% of the capacity', yk: '1/N WITH N = 10', act: ['Take down a replica', 'catalogo-3'],
        code: ['catalogo: 10 replicas', 'catalogo-3: down', 'capacity: 9 of 10 = 90%', 'visible error: none', 'the same catalogo serves bff-app and bff-web'],
        story: 'One of the 10 <code>catalogo</code> replicas stops. The balancer sends the traffic to the other 9: the store loses <b>10% of the capacity</b> and nobody sees an error (how long the replica takes to leave the pool is lesson 4). One caveat: the same <code>catalogo</code> serves <code>bff-app</code> and <code>bff-web</code> (module 9). If the whole service goes down, both channels go dark together.',
        look: 'Replica 3 turns red; the screen stays lit.',
        key: 'With N copies, one fewer costs 1/N of the capacity.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'cat' : ''); lit(o, 'tela');
          o.cnt = [['CAPACITY', d ? '90%' : '100%'], ['1/N', '10%', 'dim'], ['ERROR ON SCREEN', 'none', 'dim']];
          o.res = d ? [['10% less, no visible error', 'acc']] : [];
          if (d) T(o, [CC(3), 225, 40], 'catalogo-3 down', 'bad'); } },
      { id: 'pagamentos', dur: 5, title: 'pagamentos goes down: all checkout stops', yk: 'THE STORE\'S BIGGEST RADIUS', act: ['Take down pagamentos', 'big radius'],
        code: ['pagamentos: down', 'checkout: stopped (all the revenue)', 'catalog: ok', 'my orders: ok', 'recommendations: ok'],
        story: 'Now <code>pagamentos</code>. Nobody completes a purchase: the whole checkout stops, and with it all the revenue. Browsing continues (you can see products and old orders), but you cannot pay. It is the store\'s biggest radius, and that is why <code>pagamentos</code> gets the defenses from lessons 5 to 11.',
        look: 'pagamentos turns red and so does the "checkout" line on the screen. The others stay lit.',
        key: 'Big radius: all the revenue stops, browsing continues.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'pag' : ''); lit(o, 'tela');
          if (d) { bad(o, 'pag'); o.rows.pag = act('pagamentos', 'DOWN', ['does not charge', 'bad']); o.rows.tela = TELA({ chk: 'stopped' }); }
          o.cnt = [['RADIUS', d ? 'all the revenue' : '…', d ? 'bad' : 'dim'], ['CHECKOUT', d ? 'stopped' : 'ok', d ? 'bad' : 'dim'], ['BROWSING', 'ok', 'dim']];
          o.res = d ? [['checkout stopped, browsing ok', 'bad']] : [];
          if (d) T(o, TF(450), 'nobody pays', 'bad'); } },
      { id: 'n', dur: 5, title: 'Three shards: the 1/N math says 33.3%', yk: '1/N WITH EQUAL LOAD',
        code: ['one compartment down takes 1/N:', '  N = 3       33.3%', '  N = 10      10%', '  N = 100     1%', '  N = 1,000   0.1%'],
        story: 'The <code>pedidos</code> table is in 3 <i>shards</i>, by <code>cliente_id</code> (module 16). The textbook math says that, with N equal compartments, one down takes 1/N: N = 3 gives <b>33.3%</b>; N = 10, 10%; N = 100, 1%; N = 1,000, 0.1%. The more compartments, the smaller the radius of each one.',
        look: 'The three shards light up, each with 1/3 of the customers. Notice that shard-2 is bigger.',
        key: '1/N only holds if the compartments weigh the same.',
        f(o) { blastBase(o); lit(o, 's0', 's1', 's2');
          o.cnt = [['1/N', '33,3%'], ['SHARDS', '3', 'dim'], ['CUSTOMERS IN EACH', '1/3', 'dim']];
          o.res = [['the promise: 33.3% per shard', 'acc']]; } },
      { id: 'shard2', dur: 6, title: 'If it goes wrong: shard-2 takes 60% of the rows', yk: 'THE MATH WITH UNEVEN LOAD', act: ['Take down shard-2', 'where mkt-01 lives'],
        code: ['mkt-01: 40% of the rows (module 16)', 'shard-2 = 0.4 + 0.6 ÷ 3 = 60%', 'shard-0 = 0.6 ÷ 3 = 20%', 'shard-1 = 0.6 ÷ 3 = 20%', 'down: 1/3 of customers, 60% of rows'],
        story: '<code>shard-2</code> stops. By the 1/N math, it would be a third. But that is where <code>mkt-01</code> lives, the partner marketplace that alone has <b>40%</b> of the <code>pedidos</code> rows (module 16). <code>shard-2</code> holds 0.4 + 0.6 ÷ 3 = <b>60% of the rows</b>, and the other two, 20% each. The failure affects 1/3 of the customers and 60% of the orders. The article assumes uniform load, and 1/N is only the best case.',
        look: 'shard-2 turns red, and with it the checkout and orders of 1/3 of the customers, mkt-01 among them.',
        key: 'With uneven load, the radius of a shard is its weight, not 1/N.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 's2' : ''); lit(o, 'tela');
          o.rows.s0 = act('shard-0', 'ORDERS', ['1/3 of customers', 'dim'], ['20% of rows', d ? 'acc' : 'dim']);
          o.rows.s1 = act('shard-1', 'ORDERS', ['1/3 of customers', 'dim'], ['20% of rows', d ? 'acc' : 'dim']);
          o.rows.s2 = act('shard-2', d ? 'DOWN' : 'ORDERS', ['1/3 of customers', 'dim'], ['+ mkt-01 (40%)', d ? 'bad' : 'dim'], ['60% of rows', d ? 'bad' : 'dim']);
          if (d) { bad(o, 's2'); o.rows.tela = TELA({ chk: 'down for 1/3', meus: 'down for 1/3' }); }
          o.cnt = [['ROWS DOWN', d ? '60%' : '…', 'bad'], ['CUSTOMERS DOWN', '1/3', 'dim'], ['1/N PROMISED', '33,3%', 'dim']];
          o.res = d ? [['1/3 of customers, 60% of rows', 'bad']] : [];
          if (d) T(o, [477, 40, 96], '60% of rows', 'bad'); } },
    ],
    healthcheck: [
      { id: 'replicas', dur: 6, title: 'Two replicas behind the balancer', yk: 'THE lb-loja POOL',
        code: ['pagamentos: 2 replicas at 20/s', 'total capacity: 40/s', 'Black Friday: 30 orders/s', '  15/s on each replica', 'GET /saude every 5 s', '3 failures in a row: leaves the pool'],
        story: '<code>pagamentos</code> has <b>2 replicas</b> at 20/s (module 14) behind <code>lb-loja</code>. On Black Friday <b>30 orders/s</b> arrive, 15/s for each one. Every <b>5 s</b> the balancer queries each replica\'s health URL; the one that fails <b>3 times in a row</b> leaves the pool (module 7). The <i>healthcheck</i> is shallow: it only checks that the process responds.',
        look: 'The orders leave the balancer and split between the two replicas.',
        key: 'Several replicas behind a balancer that knows who is alive.',
        f(o) { hcBase(o); lit(o, 'lb', 'p1', 'p2');
          o.cnt = [['PER REPLICA', '15/s'], ['CAPACITY', '40/s', 'dim'], ['IN POOL', '2 of 2', 'dim']];
          o.res = [['both respond', 'acc']]; } },
      { id: 'trava', dur: 9, title: 'pagamentos-2 hangs: 15 s until it leaves the pool', yk: 'INTERVAL × FAILURES', act: ['Hang pagamentos-2', 'count the failures'],
        code: ['interval 5 s × 3 failures = 15 s', 'the hung replica gets 15/s', '15/s × 15 s = 225 failures', 'probe 1 (5 s): fails', 'probe 2 (10 s): fails', 'probe 3 (15 s): leaves the pool'],
        story: '<code>pagamentos-2</code> hangs: the process is up, but it does not respond. The balancer does not know that and keeps sending it half the traffic, <b>15/s</b>. Only after <b>3 probes</b> fail, one every 5 s, does it leave the pool: <b>15 s</b>. In that time 15 × 15 = <b>225</b> orders go through a hung replica.',
        look: 'The red stack next to the replica grows to 225; the probes fail one by one on the balancer.',
        key: 'Until the replica leaves the pool, every order that lands on it fails.',
        f(o, t) { hcBase(o); const s = lin(t, 0.5, 7.5, 0, 15), k = Math.floor(s / 5 + 1e-6), out = s >= 15, n = Math.round(15 * s);
          lit(o, 'lb', 'p1'); bad(o, 'p2');
          o.rows.p2 = REP(2, [out ? 'out of the pool' : 'hung: not responding', 'bad'], [`/saude: ${k} of 3 failures`, 'bad']);
          o.rows.lb = LB(['30 orders/s', 'dim'], [`probes failed: ${k} of 3`, k ? 'bad' : 'dim'], [`in pool: ${out ? '1' : '2'} of 2`, out ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, tone: out ? '' : 'bad', flow: !out }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
          o.piles.push({ p: [850, 245, PL + 2], v: n, f: n / 225 });
          o.cnt = [['FAILURES', thou(n), 'bad'], ['TIME', dec(s, 1) + ' s', 'dim'], ['FAILED PROBES', `${k} of 3`, 'dim']];
          o.res = out ? [['225 failures, then it leaves the pool', 'bad']] : [['still in pool', 'dim']];
          if (out) T(o, TF(689), 'pagamentos-2 out of the pool', 'acc'); } },
      { id: 'sai', dur: 5, title: 'Out of the pool: half the capacity', yk: 'AFTER THE 15 s',
        code: ['pagamentos-2: out of the pool', 'pagamentos-1: gets everything', 'capacity: 20/s (half)', 'the service stays up', '"down" became "half"'],
        story: 'At 15 s <code>pagamentos-2</code> leaves the pool and the balancer sends everything to <code>pagamentos-1</code>. The store keeps selling with <b>half the capacity</b>. Without the second replica, the same hang would have taken all of <code>pagamentos</code> down. Two copies turn "service down" into "half the capacity".',
        look: 'The cable to the hung replica goes dark; only the pagamentos-1 path stays lit.',
        key: 'A replica is the cheap defense: it turns "down" into "half".',
        f(o) { hcBase(o); lit(o, 'lb', 'p1'); bad(o, 'p2');
          o.rows.p2 = REP(2, ['out of the pool', 'bad'], ['/saude: 3 of 3 failures', 'bad']);
          o.rows.p1 = REP(1, ['gets all the traffic', 'acc'], ['/saude: 200', 'acc']);
          o.rows.lb = LB(['30 orders/s', 'dim'], ['GET /saude every 5 s', 'dim'], ['in pool: 1 of 2', 'acc']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2 }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
          o.cnt = [['IN POOL', '1 of 2'], ['CAPACITY', '20/s', 'dim'], ['SERVICE', 'up', 'dim']];
          o.res = [['half the capacity, up', 'acc']]; } },
      { id: 'catalogo', dur: 9, title: 'On catalogo: 960 requests in 15 s', yk: 'THE SAME CLOCK, MORE TRAFFIC', act: ['Hang catalogo-7', '640 req/s'],
        code: ['catalogo: 10 replicas, 640 req/s', '64 req/s on each', 'catalogo-7 hangs', '64 × 15 s = 960 lost', 'outlier detection (Envoy):', '  removes whatever errors in a row'],
        story: 'The same goes for <code>catalogo</code>: 10 replicas behind <code>lb-loja</code>, 640 req/s, <b>64 req/s</b> on each. One hangs and takes the same 15 s to leave: <b>960</b> requests lost. Envoy\'s <i>outlier detection</i> shortens this: it removes from rotation whatever errors in a row, without waiting for the probe. The two mechanisms add up.',
        look: 'Replica 7 turns red and the stack grows to 960 before it leaves.',
        key: 'The more traffic, the more expensive the 15 s.',
        f(o, t) { show(o, 'lb'); const s = lin(t, 0.5, 7.5, 0, 15), out = s >= 15, n = Math.round(64 * s);
          cells(o, { 7: 'bad' }); lit(o, 'lb');
          o.rows.lb = LB(['catalogo: 640 req/s', 'dim'], [`64 req/s × ${dec(s, 1)} s`, 'bad'], [`in pool: ${out ? 9 : 10} of 10`, out ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lcat, on: 1, flow: 1 }, { pts: CAB.cbus, on: 1 }, ...catBranches(280, i => i === 7 ? { tone: out ? '' : 'bad' } : { on: 1 })];
          o.piles.push({ p: [640, 300, PL + 2], v: n, f: n / 960 });
          o.cnt = [['LOST', thou(n), 'bad'], ['TIME', dec(s, 1) + ' s', 'dim'], ['PER REPLICA', '64 req/s', 'dim']];
          o.res = out ? [['960 lost in 15 s', 'bad']] : [['still in pool', 'dim']];
          T(o, [150, 268, 24], 'catalogo · 10 replicas', 'dim'); } },
      { id: 'profundo', dur: 9, title: 'If it goes wrong: the deep healthcheck queries PSP-A', yk: 'GET /saude → PSP-A', act: ['Turn on the deep one', 'that queries PSP-A'],
        code: ['GET /saude also calls PSP-A', '20:20:00 PSP-A goes to 8 s', 'pagamentos-1: probe times out', 'pagamentos-2: probe times out', '3 probes (15 s): both leave', 'healthy: 0 of 2'],
        story: 'Someone writes a deep <i>healthcheck</i>: the <code>pagamentos</code> health URL also queries PSP-A. At <b>20:20:00</b> PSP-A starts answering in <b>8 s</b>. The probes of <b>both</b> replicas time out, because the problem is not in either of them. After 3 probes (15 s), the balancer removes both: the store has no <code>pagamentos</code> even though the replicas are perfect.',
        look: 'The probes cross the replicas to PSP-A and come back red; both replicas turn red together.',
        key: 'A slow dependency is not a disease of the replica.',
        f(o, t) { hcBase(o); const s = lin(t, 0.5, 7.5, 0, 15), k = Math.floor(s / 5 + 1e-6), out = s >= 15;
          bad(o, 'pspH'); o.rows.pspH = act('PSP-A', 'SLOW', ['8 s since 20:20:00', 'bad']);
          if (k) bad(o, 'p1', 'p2'); else lit(o, 'p1', 'p2');
          const R = n => REP(n, [out ? 'out of the pool' : 'process: ok', out ? 'bad' : 'acc'], [`/saude: ${k} of 3 failures`, k ? 'bad' : 'dim']);
          o.rows.p1 = R(1); o.rows.p2 = R(2); bad(o, 'lb');
          o.rows.lb = LB(['deep healthcheck', 'bad'], [`probes failed: ${k} of 3`, k ? 'bad' : 'dim'], [`in pool: ${out ? 0 : 2} of 2`, out ? 'bad' : 'hi']);
          o.beams = [{ pts: CAB.lp1, tone: 'bad', flow: 1 }, { pts: CAB.lp2, tone: 'bad', flow: 1 }, { pts: CAB.p1psp, tone: 'bad', flow: 1 }, { pts: CAB.p2psp, tone: 'bad', flow: 1 }];
          o.cnt = [['IN POOL', `${out ? 0 : 2} of 2`, out ? 'bad' : 'acc'], ['CLOCK', clock(s), 'dim'], ['PSP-A', '8 s', 'bad']];
          o.res = out ? [['both replicas out of the pool', 'bad']] : [['the probes wait for PSP-A', 'dim']];
          T(o, [452, 22, 40], 'GET /saude → PSP-A', 'bad'); } },
      { id: 'panico', dur: 6, title: 'If it goes wrong: panic at 50%', yk: 'ENVOY\'S PANIC THRESHOLD',
        code: ['Envoy: default panic threshold = 50%', 'healthy: 0 of 2 = 0% < 50%', '→ ignores health, sends to both', 'rule: removing from the pool checks only', '  what the replica controls', 'slow PSP: breaker and fallback'],
        story: 'Envoy has a safeguard: below <b>50%</b> healthy replicas (the <i>panic threshold</i> default) it <b>ignores health</b> and goes back to balancing across all of them. Here panic saves the day, but counting on it is a matter of luck. The rule: the <i>healthcheck</i> that removes from the pool checks only what the replica controls (process, memory, queue). A slow PSP is handled with a <i>circuit breaker</i> (lesson 8) and a <i>fallback</i> (lesson 9).',
        look: 'The balancer panics and sends traffic again to both "sick" replicas.',
        key: 'Ejecting the innocent does not help and can cause the blackout.',
        f(o) { hcBase(o); bad(o, 'pspH', 'lb'); lit(o, 'p1', 'p2'); o.rows.pspH = act('PSP-A', 'SLOW', ['8 s since 20:20:00', 'bad']);
          const R = n => REP(n, ['"sick", gets 15/s', 'bad'], ['/saude: 3 of 3 failures', 'bad']);
          o.rows.p1 = R(1); o.rows.p2 = R(2);
          o.rows.lb = LB(['PANIC MODE', 'bad'], ['healthy: 0% < 50%', 'bad'], ['sends to both', 'acc']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, on: 1, flow: 1 }, { pts: CAB.p1psp, tone: 'bad' }, { pts: CAB.p2psp, tone: 'bad' }];
          o.cnt = [['ENVOY', 'panic', 'bad'], ['HEALTHY', '0%', 'dim'], ['THRESHOLD', '50%', 'dim']];
          o.res = [['saved by panic: luck', 'bad']];
          T(o, TF(452), 'panic: ignores health', 'bad'); } },
    ],
    dados: [
      { id: 'split', dur: 5, title: 'Writes on the primary, reads on the replicas', yk: 'READ-WRITE SPLITTING (MODULE 17)',
        code: ['pedidos → pg-sp: 30 writes/s', 'pg-sp → pg-rio and pg-recife', '  async replication', 'reads → replicas', 'a read replica goes down: read from the other'],
        story: 'The store separates reads from writes (module 17). <code>pedidos</code> writes to the primary <code>pg-sp</code>, <b>30 orders/s</b> on Black Friday. The replicas <code>pg-rio</code> and <code>pg-recife</code> receive the changes asynchronously and serve the reads. If a read replica goes down, the <i>fallback</i> is trivial: read from the other one.',
        look: 'The writes go up from pedidos to the primary; replication runs from the primary to the two replicas.',
        key: 'Copies and separate reads: the first defense of the data.',
        f(o) { dbBase(o); lit(o, 'sp', 'ped');
          o.cnt = [['WRITES', '30/s'], ['REPLICAS', '2', 'dim'], ['PRIMARY', 'pg-sp', 'dim']];
          o.res = [['writes in SP, reads on the replicas', 'acc']]; } },
      { id: 'cache', dur: 5, title: 'The cache holds the origin: 640 → 128 req/s', yk: 'THE CATALOG SHIELD',
        code: ['catalogo: 640 req/s', 'cache: TTL 60 s, 80% hit rate', '640 × 20% = 128 req/s at the origin', 'the DB sees 1/5 of the reads'],
        story: '<code>catalogo</code> reads through a cache with a <b>60 s</b> TTL (module 5). With an 80% hit rate, of the <b>640 req/s</b> only <b>128</b> reach the database: 640 × 20%. The cache is a shield, and the database sees a fifth of the read load.',
        look: 'The wide flow goes into the cache from catalogo; only a thin thread continues to the replica.',
        key: 'The cache takes 80% of the reads off the database.',
        f(o) { dbBase(o); lit(o, 'cache', 'cat', 'rio');
          o.rows.cache = act('catalog cache', 'TTL 60 s', ['hit rate: 80%', 'acc'], ['to origin: 128 req/s', 'acc']);
          o.beams = [{ pts: CAB.psp }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, on: 1, flow: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
          T(o, [455, 345, 30], '640 req/s', 'acc'); T(o, [455, 195, 30], '128 req/s', 'acc');
          o.cnt = [['AT ORIGIN', '128 req/s'], ['IN CACHE', '640 req/s', 'dim'], ['HIT RATE', '80%', 'dim']];
          o.res = [['the DB sees 128 of 640', 'acc']]; } },
      { id: 'cai', dur: 9, title: 'The SP primary goes down: 35 s without writes', yk: 'RTO = 35 s', act: ['Take down pg-sp', 'the primary'],
        code: ['pg-sp: down', 'RTO until promotion: 35 s', '30 orders/s × 35 s = 1,050', '  write attempts with no primary', 'reads: keep going on replicas and cache'],
        story: '<code>pg-sp</code> goes down. Until a replica is promoted to primary, <b>35 s</b> go by (the module 17 RTO). In that time, at 30 orders/s, that is 30 × 35 = <b>1,050</b> write attempts with nowhere to go. Reads continue: the replicas and the cache keep answering.',
        look: 'The primary turns red and the stack of writes with no destination grows to 1,050. The read path stays lit.',
        key: 'A database does not restart: the RTO is the price of promotion.',
        f(o, t) { dbBase(o); const s = lin(t, 0.5, 7.5, 0, 35), n = Math.round(30 * s);
          bad(o, 'sp', 'ped'); lit(o, 'cache', 'cat', 'rio');
          o.rows.sp = PG('pg-sp', 'DOWN', ['not responding', 'bad'], [`for ${Math.floor(s)} s`, 'bad']);
          o.rows.ped = act('pedidos', 'NO PRIMARY', [`${thou(n)} writes with no destination`, 'bad'], ['30 orders/s', 'dim']);
          o.beams = [{ pts: CAB.psp, tone: 'bad', flow: 1 }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, on: 1, flow: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
          o.piles.push({ p: [165, 405, PL + 2], v: n, f: n / 1050 });
          o.cnt = [['NO PRIMARY', Math.floor(s) + ' s', 'bad'], ['LOST WRITES', thou(n), 'bad'], ['READS', 'ok', 'dim']];
          o.res = s >= 35 ? [['35 s: 1,050 writes with no destination', 'bad']] : [['waiting for promotion', 'dim']]; } },
      { id: 'promove', dur: 6, title: 'The promotion: RPO of 9 or 24 orders', yk: 'RPO = WHAT THE REPLICA DID NOT HAVE',
        code: ['at 35 s: pg-rio becomes primary', 'RPO at 30 orders/s:', '  pg-rio       9 orders', '  pg-recife   24 orders', 'the replicas are async:', '  they were behind pg-sp'],
        story: 'At 35 s <code>pg-rio</code> is promoted and the writes come back. But the replica was behind the primary: the orders that <code>pg-sp</code> wrote and had not sent yet are lost. That is the <b>RPO</b>: <b>9 orders</b> if the promoted one is Rio\'s, <b>24</b> if it is Recife\'s. RTO and RPO are the price the store accepts, and they need to be written down.',
        look: 'pg-rio becomes the primary and the writes from pedidos go to it along a new path.',
        key: 'The RPO is the data the replica did not have yet.',
        f(o, t) { dbBase(o); const f = lin(t, 0.4, 2.4, 0, 1); bad(o, 'sp'); lit(o, 'rio', 'ped');
          o.rows.sp = PG('pg-sp', 'DOWN', ['not responding', 'bad']);
          o.rows.rio = PG('pg-rio', 'NEW PRIMARY', ['promoted at 35 s', 'acc'], ['lost 9 orders', 'bad']);
          o.rows.recife = PG('pg-recife', 'REPLICA', ['if it were this one:', 'dim'], ['it would lose 24 orders', 'dim']);
          o.rows.ped = act('pedidos', 'WRITES', ['30 orders/s', 'hi'], ['INSERT on pg-rio', 'acc']);
          o.beams = [{ pts: CAB.psp }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.prio, on: 1, flow: 1 }, { pts: CAB.crio, on: 1 }, { pts: CAB.ccache, on: 1 }];
          pk(o, CAB.prio, f, 'first write');
          o.cnt = [['RPO', '9 orders', 'bad'], ['IF IT WERE RECIFE', '24', 'dim'], ['RTO', '35 s', 'dim']];
          o.res = [['writes again, 9 orders fewer', 'acc']];
          T(o, [455, 22, 50], 'RPO 9', 'bad'); T(o, [742, 22, 50], 'RPO 24', 'dim'); } },
      { id: 'stale', dur: 6, title: 'stale-if-error: the cache outlives the origin', yk: 'RFC 5861',
        code: ['Cache-Control: max-age=60,', '  stale-if-error=600', 'the origin fails → serve the old copy', 'old price 79.90 for up to 10 min: ok', 'the order command revalidates (module 18)'],
        story: 'Another day: the replica that serves the cache goes down. With <code>stale-if-error</code> (RFC 5861), the cache keeps serving the expired copy for a while, here 10 min. Serving the "old" price of <b>79.90</b> is acceptable because the order command revalidates the current price (module 18). The read can be behind; the money cannot.',
        look: 'The Rio replica turns red, but the cache keeps answering catalogo with the old copy.',
        key: 'A cache with stale-if-error keeps serving with the origin down.',
        f(o, t) { dbBase(o); const d = t > 0.6; lit(o, 'cache', 'cat', 'sp', 'ped'); if (d) bad(o, 'rio');
          if (d) o.rows.rio = PG('pg-rio', 'DOWN', ['not responding', 'bad']);
          o.rows.cache = act('catalog cache', 'STALE-IF-ERROR', [d ? 'serves the old copy' : 'hit rate: 80%', 'acc'], [d ? 'price 79.90 (expired)' : 'to origin: 128 req/s', d ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.psp, on: 1, flow: 1 }, { pts: CAB.rep1, on: !d }, { pts: CAB.rep2, on: 1 }, { pts: CAB.crio, tone: d ? 'bad' : '', on: !d }, { pts: CAB.ccache, on: 1, flow: 1 }];
          o.cnt = [['CATALOG', 'up'], ['ORIGIN', d ? 'down' : 'ok', d ? 'bad' : 'dim'], ['STALE WINDOW', '10 min', 'dim']];
          o.res = d ? [['serves stale with the origin down', 'acc']] : []; } },
      { id: 'estouro', dur: 10, title: 'If it goes wrong: the cache goes cold along with the database', yk: 'THE CACHE STAMPEDE', act: ['DB down for 5 min', 'TTL only'],
        code: ['DB down for 5 min; TTL of 60 s only', 'keys expire and the hit rate collapses', 'the DB is back: all expired together', '  640 req/s at the origin, not 128', 'fix: TTL with jitter', '  + stale-while-revalidate'],
        story: 'Now without <code>stale-if-error</code>: the database is down for 5 min and the catalog keys, with a 60 s TTL, expire. When the database comes back, all of them expired together and the <b>640 req/s</b> hit the origin at once, instead of the usual 128. That is the cache stampede: a spike the freshly promoted database cannot take and that knocks it down again. The fix: TTL with <i>jitter</i> (each key expires at a different moment) and <code>stale-while-revalidate</code> (serve the old copy while a single request fetches the new one).',
        look: 'The cache empties while the database is down; when it comes back, the whole catalogo flow goes straight through and the database turns red again.',
        key: 'The same TTL on everything is a bomb: keys that expire together come back together.',
        f(o, t) { dbBase(o); const m = lin(t, 0.5, 5.5, 0, 5), back = t > 6, hit = Math.round(lin(m, 0, 1, 80, 0));
          lit(o, 'cat', 'sp', 'ped'); o.on.cache = back ? 'bad' : hit ? 1 : 'bad';
          if (!back || t > 7.5) bad(o, 'rio'); else lit(o, 'rio');
          o.rows.rio = PG('pg-rio', back ? (t > 7.5 ? 'DOWN AGAIN' : 'BACK') : 'DOWN', [back ? '640 req/s at once' : `down for ${dec(m, 1)} min`, 'bad']);
          o.rows.cache = act('catalog cache', 'TTL 60 s ONLY', [`hit rate: ${back ? 0 : hit}%`, hit && !back ? 'acc' : 'bad'], [back ? 'all keys expired' : hit ? 'keys expiring' : 'vazio', 'bad']);
          o.beams = [{ pts: CAB.psp, on: 1 }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, tone: 'bad', flow: back }, { pts: CAB.ccache, on: 1, flow: 1, tone: back ? 'bad' : '' }];
          o.cnt = [['AT ORIGIN', back ? '640 req/s' : '—', 'bad'], ['HIT RATE', `${back ? 0 : hit}%`, 'dim'], ['USUAL', '128 req/s', 'dim']];
          o.res = back ? [['640 at once: cache stampede', 'bad']] : [['DB down, cache emptying', 'dim']];
          if (back) T(o, [455, 195, 30], '640 req/s', 'bad'); } },
    ],
    bulkhead: [
      { id: 'pool', dur: 5, title: 'One pool of 100 for three dependencies', yk: 'LITTLE\'S LAW (LESSON 6)',
        code: ['pagamentos: pool of 100 connections', '  PSP-A, shipping quote, email', 'normal: PSP-A at 180 ms', 'in flight = 30/s × 0.18 s = 5.4', 'almost all of it is left'],
        story: '<code>pagamentos</code> talks to three dependencies through the same <b>pool of 100 connections</b>: PSP-A (the charge), the shipping quote and the email. On a normal day PSP-A answers in 180 ms and, at 30 orders/s, takes only 30 × 0.18 = <b>5.4</b> connections in flight (Little\'s Law, lesson 6). Almost the whole pool is left.',
        look: 'A few pool slots are lit; the three dependencies respond.',
        key: 'One pool, one radius: the three dependencies share the same compartment.',
        f(o) { bhBase(o); lit(o, 'pagB', 'pool');
          o.cnt = [['IN FLIGHT ON PSP-A', '5,4'], ['POOL', '100', 'dim'], ['DEPENDENCIES', '3', 'dim']];
          o.res = [['all three go through the same pool', 'acc']]; } },
      { id: 'enche', dur: 8, title: 'PSP-A at 8 s: the pool fills in 3.33 s', yk: 'POOL ÷ RATE', act: ['PSP-A at 8 s', '20:20:00'],
        code: ['20:20:00 PSP-A goes to 8 s', '30/s arrive; none comes back before 8 s', 'in flight = 30 × t', '100 ÷ 30 = 3.33 s: pool full', 'shipping and email: no connection'],
        story: 'At <b>20:20:00</b> PSP-A starts answering in <b>8 s</b>. Each call holds a connection for 8 s, and 30 arrive per second: in <b>100 ÷ 30 = 3.33 s</b> all 100 connections are stuck on PSP-A. The shipping quote and the email, which answer fast, are left with no connection. The failure of one dependency took down all three.',
        look: 'The pool slots fill with red until none are left; shipping and email turn red.',
        key: 'Shared pool: the slow dependency takes the whole compartment.',
        f(o, t) { bhBase(o); const s = lin(t, 0.5, 6, 0, 3.6), n = Math.min(100, Math.round(30 * s)), full = n >= 100;
          lit(o, 'pagB'); bad(o, 'psp'); o.on.pool = full ? 'bad' : 1;
          o.rows.pool.pool = { walls: 0, psp: n, fr: full ? 0 : 2, em: full ? 0 : 2, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'SLOW', ['8 s per call', 'bad'], ['holds the connection', 'bad']);
          if (full) { bad(o, 'frete', 'email'); o.rows.frete = act('shipping quote', 'FAST', ['no connection in the pool', 'bad']); o.rows.email = act('email', 'FAST', ['no connection in the pool', 'bad']); }
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, tone: 'bad', flow: 1 }, { pts: CAB.qfr, on: !full, tone: full ? 'bad' : '' }, { pts: CAB.qem, on: !full, tone: full ? 'bad' : '' }];
          o.cnt = [['IN FLIGHT', `${n} of 100`, full ? 'bad' : 'acc'], ['t', dec(Math.min(s, 3.33), 2) + ' s', 'dim'], ['SHIPPING AND EMAIL', full ? 'no connection' : 'ok', full ? 'bad' : 'dim']];
          o.res = full ? [['3.33 s: pool full, all three stop', 'bad']] : [['filling…', 'dim']]; } },
      { id: 'caio', dur: 6, title: 'At 20:20:04, Caio\'s 1058 is left with no shipping', yk: 'ORDER 1058',
        code: ['20:20:04 order 1058 (Caio, Rio)', '  3 blue mugs        59.70', '  shipping Rio       ?', 'shipping quote: no connection', 'the slow PSP-A stopped shipping'],
        story: 'At <b>20:20:04</b> Caio, in Rio, checks out order <b>1058</b>: 3 blue mugs (59.70). <code>pagamentos</code> needs the shipping quote, but the pool has been full since 20:20:03, all of it stuck on PSP-A. The quote does not even go out, and the order stops before reaching the charge. Shipping has nothing to do with the PSP, and it went down with it.',
        look: 'The 1058 goes down from Caio to pagamentos and the shipping call runs into the full pool.',
        key: 'With a single pool, whoever does not depend on PSP-A loses too.',
        f(o, t) { bhBase(o); const f = lin(t, 0.4, 2.4, 0, 1); lit(o, 'pagB'); bad(o, 'pool', 'psp', 'frete', 'email');
          o.rows.pool.pool = { walls: 0, psp: 100, fr: 0, em: 0, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'SLOW', ['8 s per call', 'bad'], ['holds the connection', 'bad']);
          o.rows.frete = act('shipping quote', 'FAST', ['no connection in the pool', 'bad']); o.rows.email = act('email', 'FAST', ['no connection in the pool', 'bad']);
          o.on.caio = f >= 1 ? 'bad' : 1;
          o.rows.caio = act('Caio · Rio', 'ORDER 1058', ['3 blue mugs · 59.70', 'dim'], [f >= 1 ? 'shipping Rio: no quote' : '20:20:04 · checking out…', f >= 1 ? 'bad' : 'acc']);
          o.beams = [{ pts: CAB.cpag, on: 1 }, { pts: CAB.ppool, tone: f >= 1 ? 'bad' : '', on: 1 }, { pts: CAB.qpsp, tone: 'bad' }, { pts: CAB.qfr, tone: 'bad' }, { pts: CAB.qem, tone: 'bad' }];
          pk(o, CAB.cpag, f, '1058');
          o.cnt = [['O 1058', f >= 1 ? 'no shipping' : '…', 'bad'], ['CLOCK', '20:20:04', 'dim'], ['POOL', '100 of 100', 'bad']];
          o.res = f >= 1 ? [['shipping went down with PSP-A', 'bad']] : [];
          if (f >= 1) T(o, [605, 232, 40], 'no connection', 'bad'); } },
      { id: 'paredes', dur: 8, title: 'Three pools: only PSP-A\'s runs out, in 1.67 s', yk: 'BULKHEADS 50 / 30 / 20', act: ['Split into 50/30/20', 'the walls'],
        code: ['PSP-A 50 · shipping 30 · email 20', '20:20:00 PSP-A at 8 s, again', 'in flight on PSP-A = 30 × t', '50 ÷ 30 = 1.67 s: only it fills', 'shipping and email: keep going'],
        story: 'Now the pool becomes three compartments, like a ship\'s hull: <b>50</b> connections for PSP-A, <b>30</b> for the shipping quote and <b>20</b> for the email. With PSP-A at 8 s, its compartment fills sooner, in <b>50 ÷ 30 = 1.67 s</b>. But the water stops at the wall: shipping and email keep their connections.',
        look: 'Two walls rise in the pool. Only the PSP-A compartment fills; the other two keep free slots.',
        key: 'Bulkhead: the failure of one compartment does not flood the others.',
        f(o, t) { bhBase(o); o.walls = 1; const s = lin(t, 1.2, 4.5, 0, 1.8), n = Math.min(50, Math.round(30 * s)), full = n >= 50;
          lit(o, 'pagB', 'pool', 'frete', 'email'); if (s > 0) bad(o, 'psp');
          o.rows.pool.pool = { walls: 1, psp: n, fr: 2, em: 2, tone: 'bad' };
          if (s > 0) o.rows.psp = act('PSP-A', 'SLOW', [full ? 'pool of 50 full' : '8 s per call', 'bad'], ['holds the connection', 'bad']);
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, tone: s > 0 ? 'bad' : '', on: 1, flow: 1 }, { pts: CAB.qfr, on: 1, flow: 1 }, { pts: CAB.qem, on: 1, flow: 1 }];
          o.cnt = [['PSP-A', `${n} of 50`, full ? 'bad' : 'acc'], ['t', dec(Math.min(s, 1.67), 2) + ' s', 'dim'], ['SHIPPING AND EMAIL', 'ok', 'dim']];
          o.res = full ? [['1.67 s: only PSP-A runs out', 'acc']] : [['filling…', 'dim']]; } },
      { id: 'caio2', dur: 6, title: 'The 1058 with walls: shipping Rio 12.00', yk: 'ORDER 1058, AGAIN',
        code: ['20:20:04 order 1058 (Caio, Rio)', '  3 blue mugs        59.70', '  shipping Rio       12.00', '  total              71.70', 'quote: shipping pool (30), ok', 'charge: PSP-A pool full'],
        story: 'At 20:20:04 the 1058 arrives again. The shipping quote uses its own compartment and comes back: Rio shipping, <b>12.00</b>, total <b>71.70</b>. The charge still runs into PSP-A\'s full compartment, and that is where the <i>circuit breaker</i> and the <i>fallback</i> to PSP-B come in (lessons 8 and 9). The wall does not cure PSP-A; it keeps it from taking the rest down with it.',
        look: 'The shipping call goes through the middle compartment and comes back lit; the PSP-A one runs into the full compartment.',
        key: 'The wall does not cure the dependency: it holds the radius.',
        f(o, t) { bhBase(o); o.walls = 1; const f = lin(t, 0.4, 2.4, 0, 1), done = f >= 1;
          lit(o, 'pagB', 'pool', 'frete', 'email'); bad(o, 'psp'); o.on.caio = done ? 1 : 1;
          o.rows.pool.pool = { walls: 1, psp: 50, fr: done ? 3 : 2, em: 2, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'SLOW', ['pool of 50 full', 'bad'], ['→ breaker and fallback', 'acc']);
          o.rows.frete = act('shipping quote', 'POOL OF 30', [done ? 'Rio: 12.00' : 'responds', 'acc']);
          o.rows.caio = act('Caio · Rio', 'ORDER 1058', ['59.70 + shipping 12.00', done ? 'acc' : 'dim'], [done ? 'total 71.70' : '20:20:04 · checking out…', 'acc']);
          o.beams = [{ pts: CAB.cpag, on: 1 }, { pts: CAB.ppool, on: 1 }, { pts: CAB.qpsp, tone: 'bad' }, { pts: CAB.qfr, on: 1, flow: 1 }, { pts: CAB.qem, on: 1 }];
          pk(o, CAB.cpag, f, '1058');
          o.cnt = [['O 1058', done ? '71,70' : '…'], ['SHIPPING RIO', done ? '12,00' : '…', 'dim'], ['PSP-A', '50 of 50', 'bad']];
          o.res = done ? [['shipping quoted; the charge goes to the breaker', 'acc']] : [];
          if (done) T(o, [705, 195, 44], 'shipping Rio 12.00', 'acc'); } },
      { id: 'pequeno', dur: 7, title: 'If it goes wrong: the bulkhead that is too small', yk: 'THE WALL COSTS CAPACITY', act: ['Peak of 40 quotes', 'on the pool of 30'],
        code: ['shipping pool: 30 connections', 'quote peak: 40 in flight', '40 − 30 = 10 with no connection', 'the email has free slots, but', '  the wall does not lend', 'same database behind: the wall leaks'],
        story: 'The wall costs capacity: the shipping compartment of 30 connections does not borrow the free slots of the others. In a peak of <b>40 quotes in flight</b>, <b>10</b> are left with no connection: legitimate traffic refused, with the store healthy. There is another way for the wall to fail: two separate pools that depend on the <b>same</b> database have the database\'s radius.',
        look: 'The shipping compartment fills and 10 quotes are left over, in red, on the outside.',
        key: '50/30/20 do not have the flexibility of 100 together.',
        f(o, t) { bhBase(o); o.walls = 1; const n = Math.round(lin(t, 0.5, 4, 0, 40)), out = Math.max(0, n - 30);
          lit(o, 'pagB', 'psp', 'email'); o.on.pool = out ? 'bad' : 1; o.on.frete = out ? 'bad' : 1;
          o.rows.pool.pool = { walls: 1, psp: 5, fr: Math.min(30, n), em: 2, tone: 'acc', frTone: out ? 'bad' : '' };
          o.rows.frete = act('shipping quote', 'POOL OF 30', [`${n} in flight`, out ? 'bad' : 'acc'], [out ? `${out} with no connection` : 'cabe', out ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, on: 1 }, { pts: CAB.qfr, on: 1, flow: 1, tone: out ? 'bad' : '' }, { pts: CAB.qem, on: 1 }];
          if (out) o.piles.push({ p: [522, 395, PL + 2], v: out, f: out / 10 });
          o.cnt = [['NO CONNECTION', String(out), out ? 'bad' : 'dim'], ['QUOTES IN FLIGHT', String(n), 'dim'], ['SHIPPING POOL', '30', 'dim']];
          o.res = out ? [['legitimate traffic refused', 'bad']] : [['fits…', 'dim']];
          if (out >= 10) T(o, [522, 446, 30], '10 quotes refused', 'bad'); } },
    ],
    shuffle: [
      { id: 'todas', dur: 8, title: 'No isolation: the bad request goes through all of them', yk: 'EVERYONE USES ALL 10', act: ['Turn on mkt-01', 'the bad request'],
        code: ['catalogo: 10 replicas at 100 req/s', 'all customers use all 10', 'mkt-01 sends the request that hangs', 'it moves from replica to replica', '→ all 10 hang: 100% down'],
        story: '<code>catalogo</code> has 10 replicas (<code>catalogo-1</code> to <code>catalogo-10</code>, 100 req/s each). <code>mkt-01</code> sends a request that hangs the replica that receives it (module 16). If every customer uses all 10, the bad request moves on one by one and takes the whole service down: the radius is the entire store.',
        look: 'The replicas turn red one by one, and the five customers lose catalogo.',
        key: 'With no isolation, the noisy customer reaches everyone.',
        f(o, t) { const n = Math.floor(lin(t, 0.6, 5.6, 0, 10.99)), all = n >= 10, st = {}; for (let i = 1; i <= n; i++) st[i] = 'bad';
          const kt = {}; if (all) CLI.forEach((_, k) => kt[k] = 'bad'); shBase(o, st, kt); if (n) bad(o, 'k0');
          o.beams = [{ pts: P3([[CC(1), 272], [KC(4), 272]]), on: !all, tone: all ? 'bad' : '' }, ...CLI.map((_, k) => ({ pts: P3([[KC(k), 330], [KC(k), 272]]), on: !all, tone: k === 0 && n ? 'bad' : all ? 'bad' : '', flow: k === 0 && n && !all })),
            ...catBranches(272, i => i <= n ? { tone: 'bad' } : { on: 1 })];
          o.cnt = [['HUNG', `${Math.min(n, 10)} of 10`, n ? 'bad' : 'dim'], ['CUSTOMERS DOWN', all ? '5 of 5' : '0 of 5', all ? 'bad' : 'dim'], ['RADIUS', all ? '100%' : '…', all ? 'bad' : 'dim']];
          o.res = all ? [['the whole service went down', 'bad']] : n ? [['hanging…', 'bad']] : []; } },
      { id: 'grupos', dur: 6, title: 'Fixed groups of 2: 20% down', yk: '5 FIXED GROUPS (MODULE 16)',
        code: ['groups: (1,2) (3,4) (5,6) (7,8) (9,10)', 'group = murmur3(cliente_id) mod 5', 'mkt-01 and bia-31: group (3,4)', 'they hang 3 and 4', '1 group of 5 = 20% of customers'],
        story: 'The first wall: 5 fixed groups of 2 replicas, and the customer\'s group comes from <code>murmur3(cliente_id) mod 5</code> (module 16). <code>mkt-01</code> lands in group (3, 4), together with <code>bia-31</code>. Both replicas hang and <b>20%</b> of the customers (1 group out of 5) are left with no service, Bia included.',
        look: 'Only replicas 3 and 4 turn red, and so does Bia, who shares the group with mkt-01.',
        key: 'Fixed groups: the radius drops to 1/5, but the group neighbor goes down too.',
        f(o, t) { const d = t > 1; shBase(o, d ? { 3: 'bad', 4: 'bad' } : {}, d ? { 0: 'bad', 2: 'bad' } : {});
          ['k1', 'k3', 'k4'].forEach(k => { o.rows[k].rows = [['another group', 'dim']]; });
          o.rows.k0.meta = 'GROUP (3,4)'; o.rows.k2.meta = 'GRUPO (3,4)';
          o.beams = [{ pts: GRP(0, 3, 0), on: 1, tone: d ? 'bad' : '', flow: 1 }, { pts: GRP(0, 4, 1), on: 1, tone: d ? 'bad' : '' }, { pts: GRP(2, 3, 0), on: !d, tone: d ? 'bad' : '' }, { pts: GRP(2, 4, 1), on: !d, tone: d ? 'bad' : '' }].map(b => ({ ...b, thin: 1 }));
          o.cnt = [['CUSTOMERS DOWN', d ? '20%' : '…', 'bad'], ['GROUPS', '5', 'dim'], ['HUNG', d ? '2 of 10' : '0', 'dim']];
          o.res = d ? [['20% down, Bia too', 'bad']] : []; } },
      { id: 'pares', dur: 6, title: 'Shuffle sharding: 2 of 10, 45 pairs', yk: 'RENDEZVOUS (MODULE 16)', act: ['Give each one a pair', 'C(10, 2) = 45'],
        code: ['C(10, 2) = 45 pairs', 'mkt-01   {8, 9}', 'lena-77  {6, 8}', 'bia-31   {4, 6}', 'caio-58  {1, 4}', 'davi-12  {1, 9}'],
        story: 'Now each customer gets its own pair, by <i>rendezvous</i>: the 2 replicas with the lowest <code>murmur3(cliente_id + ":catalogo-" + r)</code>. There are <b>C(10, 2) = 45</b> pairs. <code>mkt-01</code> gets {8, 9}, <code>lena-77</code> gets {6, 8}, <code>bia-31</code> gets {4, 6}, <code>caio-58</code> gets {1, 4} and <code>davi-12</code> gets {1, 9}. The pairs overlap, but are almost never the same.',
        look: 'Each customer has two cables, one to each replica of its pair.',
        key: 'Each customer uses its own pair, and the neighbor\'s pair is almost never the same.',
        f(o) { shBase(o); CLI.forEach((_, k) => lit(o, 'k' + k));
          o.beams = CLI.flatMap((_, k) => [{ pts: SHC(k, 0), on: 1, thin: 1 }, { pts: SHC(k, 1), on: 1, thin: 1 }]);
          o.cnt = [['PAIRS', '45'], ['PER CUSTOMER', '2 of 10', 'dim'], ['SAME PAIR', '1 ÷ 45', 'dim']];
          o.res = [['each with its own pair', 'acc']]; } },
      { id: 'trava', dur: 7, title: 'mkt-01 hangs 8 and 9: only its pair goes down', yk: 'THE PAIR\'S RADIUS', act: ['Turn on mkt-01', 'again'],
        code: ['hung: catalogo-8 and catalogo-9', 'bia-31 {4,6} and caio-58 {1,4}: do not even notice', 'lena-77 {6,8}: loses 8, keeps 6', 'davi-12 {1,9}: loses 9, keeps 1', 'same pair as mkt-01: 1 ÷ 45 = 2.2%'],
        story: '<code>mkt-01</code> sends the bad request and hangs <b>its</b> two replicas, 8 and 9. Bia and Caio do not even notice. Lena (has 8) and Davi (has 9) lose one of the two and keep going on the other. Only whoever has exactly the pair {8, 9} is left with no service: 1 ÷ 45 = <b>2.2%</b> of the customers, against 20% with fixed groups. <i>Shuffle sharding</i> cuts customers and cuts resources: it is what ties sharding to the <i>bulkhead</i>.',
        look: 'Only replicas 8 and 9 turn red; Lena and Davi lose one cable each and the other stays lit.',
        key: 'Shuffle sharding: the noisy one only takes down whoever has the same pair.',
        f(o, t) { const d = t > 1; shBase(o, d ? { 8: 'bad', 9: 'bad' } : {}, d ? { 0: 'bad', 1: 'one', 4: 'one' } : {});
          if (!d) CLI.forEach((_, k) => lit(o, 'k' + k)); else lit(o, 'k2', 'k3');
          const isBad = r => d && (r === 8 || r === 9);
          o.beams = CLI.flatMap(([, pr], k) => pr.map((r, j) => ({ pts: SHC(k, j), on: !isBad(r), tone: isBad(r) ? 'bad' : '', flow: k === 0 && j === 0, thin: 1 })));
          o.cnt = [['SAME PAIR', '2,2%'], ['FIXED GROUPS', '20%', 'dim'], ['HUNG', d ? '2 of 10' : '0', d ? 'bad' : 'dim']];
          o.res = d ? [['only whoever has {8, 9} goes down', 'acc']] : []; } },
      { id: 'sem-retry', dur: 6, title: 'If it goes wrong: the client does not try the other replica', yk: 'WHAT SHUFFLE REQUIRES',
        code: ['the client has to try the other', '  replica of the pair (AWS\'s retry)', 'otherwise: lena-77 and davi-12', '  lose half of the calls', 'share at least 1 replica: 37.8%'],
        story: '<i>Shuffle sharding</i> only works if the <b>client tries the other replica</b> of the pair (it is the retry that AWS requires from the client). If Lena\'s app sends to 8 and gives up, she loses <b>half</b> of the calls, and so does Davi, with 9. With 10 replicas, <b>37.8%</b> of the customers share at least one replica with <code>mkt-01</code> (1 − 28/45), and without the retry all of them feel it.',
        look: 'Lena and Davi turn red: half of their calls hit a hung replica and never come back.',
        key: 'Without the client\'s retry, the pair becomes half a service.',
        f(o) { shBase(o, { 8: 'bad', 9: 'bad' }, { 0: 'bad', 1: 'half', 4: 'half' }); lit(o, 'k2', 'k3');
          const isBad = r => r === 8 || r === 9;
          o.beams = CLI.flatMap(([, pr], k) => pr.map((r, j) => ({ pts: SHC(k, j), on: !isBad(r), tone: isBad(r) ? 'bad' : '', flow: (k === 1 || k === 4) && isBad(r), thin: 1 })));
          o.cnt = [['LENA AND DAVI', '50% lost', 'bad'], ['SHARE 1 REPLICA', '37,8%', 'dim'], ['SAME PAIR', '2,2%', 'dim']];
          o.res = [['no retry: half a service', 'bad']];
          T(o, TF(KC(1)), 'loses half', 'bad'); T(o, TF(KC(4)), 'loses half', 'bad'); } },
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
    const y = s1 > 15 ? 13 : 11;
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  // o pool: 100 casas em 10 colunas; com paredes, colunas 0–4 = PSP-A (50), 5–7 = frete (30), 8–9 = e-mail (20)
  function drawPool(x, u, C, p, W_, on) {
    const light = theme === 'light', rh = GH / 10, own = new Array(100).fill(0);
    const put = (c0, k, v) => { const col = c0 + Math.floor(k / 10), row = k % 10; own[col * 10 + row] = v; };
    if (p.walls) { for (let k = 0; k < p.psp; k++) put(0, k, 1); for (let k = 0; k < p.fr; k++) put(5, k, 2); for (let k = 0; k < p.em; k++) put(8, k, 3); }
    else { let k = 0; for (; k < p.psp; k++) put(0, k, 1); for (let j = 0; j < p.fr && k < 100; j++, k++) put(0, k, 2); for (let j = 0; j < p.em && k < 100; j++, k++) put(0, k, 3); }
    for (let col = 0; col < 10; col++) for (let row = 0; row < 10; row++) {
      const v = own[col * 10 + row], X = GX + col * COLW + 1.2, Y = GY + row * rh + 1.2, w = COLW - 2.4, h = rh - 2.4;
      x.fillStyle = v === 1 ? (p.tone === 'bad' ? BAD() : accC()) : v === 2 ? (p.frTone === 'bad' ? BAD() : light ? '#3f4448' : '#c9cdd0') : v === 3 ? (light ? '#3f4448' : '#c9cdd0') : light ? '#ececeb' : '#17181a';
      x.fillRect(u(X), u(Y), u(w), u(h));
      if (!v) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(w), u(h)); }
      if (v === 2 || v === 3) { x.fillStyle = light ? '#f6f6f5' : '#141516'; x.textAlign = 'center'; fitFont(x, u, v === 2 ? 'ship.' : 'email', 7, w - 2); x.fillText(v === 2 ? 'ship.' : 'email', u(X + w / 2), u(Y + h / 2 + 0.3)); x.textAlign = 'left'; }
    }
    const ly = GY + GH + 14; x.textAlign = 'center';
    if (p.walls) { [[0, 5, 'PSP-A · 50'], [5, 3, 'shipping · 30'], [8, 2, 'email · 20']].forEach(([c0, n, lab]) => { x.fillStyle = toneC('hi'); fitFont(x, u, lab, 11, n * COLW - 3); x.fillText(lab, u(GX + (c0 + n / 2) * COLW), u(ly)); });
      x.fillStyle = accC(); [5, 8].forEach(c => x.fillRect(u(GX + c * COLW - 0.9), u(GY - 3), u(1.8), u(GH + 6))); }
    else { x.fillStyle = toneC('hi'); fitFont(x, u, 'single pool · 100 connections', 12, W_ - 12); x.fillText('single pool · 100 connections', u(W_ / 2), u(ly)); }
    x.textAlign = 'left';
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : cf.s1 > 13 ? 21 : 20;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.pool) drawPool(x, u, C, d.pool, W_, on);
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { if (pl.v <= 0) continue; const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? thou(pl.v) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
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
    blast: () => `<table class="h3-sum"><tr><th>if it stops…</th><th>radius</th></tr><tr${on_(step === 1)}><td>recomendacoes</td><td>one section of the screen</td></tr><tr${on_(step === 3)}><td>pagamentos</td><td>all checkout (the revenue)</td></tr><tr${on_(step === 2)}><td>catalogo (1 of 10)</td><td>10% of the capacity</td></tr><tr${on_(step === 5)}><td>shard-2</td><td>1/3 of the customers, 60% of the rows</td></tr><tr><td>SP primary</td><td>all writes for 35 s (Data scenario)</td></tr></table><li>1/N with equal load: N = 3 → <b>33.3%</b> · 10 → 10% · 100 → 1% · 1,000 → 0.1%</li><li>With <code>mkt-01</code> at 40% of the rows: <code>shard-2</code> = 0.4 + 0.6 ÷ 3 = <b>60%</b>; <code>shard-0</code> and <code>shard-1</code> = 20% each</li><li>Hidden dependency: the same <code>catalogo</code> serves <code>bff-app</code> and <code>bff-web</code> (module 9)</li><li>The shared radius: the single pool of <code>pagamentos</code> puts PSP-A, shipping and email in the same radius (Bulkhead scenario)</li>`,
    healthcheck: () => `<table class="h3-sum"><tr><th>where</th><th>per replica</th><th>× 15 s</th></tr><tr${on_(step === 1)}><td>pagamentos (2 replicas, 30/s)</td><td>15/s</td><td>225 failures</td></tr><tr${on_(step === 3)}><td>catalogo (10 replicas, 640 req/s)</td><td>64 req/s</td><td>960 lost</td></tr></table><li>Module 7 healthcheck: <b>5 s</b> interval, <b>3</b> failures in a row = <b>15 s</b></li><li>Envoy's <i>panic threshold</i>: "The default panic threshold is 50%"; below that it balances across all the replicas</li><table class="h3-sum"><tr><th>the healthcheck checks</th><th>removes from pool?</th></tr><tr><td>process responds</td><td>yes</td></tr><tr><td>internal queue and memory</td><td>yes</td></tr><tr${on_(step >= 4)}><td>dependency (database, PSP)</td><td>no: breaker and fallback</td></tr></table>`,
    dados: () => `<table class="h3-sum"><tr><th>measure</th><th>value</th></tr><tr${on_(step === 2 || step === 3)}><td>promotion RTO</td><td>35 s (module 17)</td></tr><tr${on_(step === 3)}><td>RPO (Rio · Recife)</td><td>9 · 24 orders at 30/s</td></tr><tr${on_(step === 2)}><td>writes with no primary</td><td>30 × 35 = 1,050</td></tr><tr${on_(step === 1)}><td>catalog at the origin</td><td>128 req/s (80% hit rate)</td></tr><tr${on_(step === 5)}><td>catalog with a cold cache</td><td>640 req/s</td></tr></table><li><code>stale-if-error</code> and <code>stale-while-revalidate</code>: RFC 5861</li><li>The price of 79.90 can arrive stale on a read; the order command revalidates the current price (module 18)</li><li>Catalog TTL: 60 s (module 5)</li>`,
    bulkhead: () => `<table class="h3-sum"><tr><th>layout</th><th>PSP-A runs out in</th><th>shipping and email</th></tr><tr${on_(step >= 1 && step <= 2)}><td>single pool of 100</td><td>100 ÷ 30 = 3.33 s</td><td>stop together</td></tr><tr${on_(step >= 3 && step <= 4)}><td>bulkheads 50 / 30 / 20</td><td>50 ÷ 30 = 1.67 s</td><td>keep going</td></tr></table><li>Little's Law (in flight = rate × time), at 30 orders/s: 180 ms → <b>5.4</b>; 1 s → 30; 8 s → <b>240</b></li><li>The 1058 (Caio, Rio, 20:20:04): 3 blue mugs 59.70 + shipping Rio 12.00 = <b>71.70</b>, card</li><li>The charge for the 1058 goes to PSP-B through the <i>breaker</i> and the <i>fallback</i> (lessons 8 and 9; the calls figure)</li><li>Other wall axes: one pool per dependency, per priority and per customer (<code>mkt-01</code> with its own queue)</li>`,
    shuffle: () => `<table class="h3-sum"><tr><th>customer</th><th>pair</th><th>with 8 and 9 hung</th></tr><tr${on_(step >= 3)}><td>mkt-01</td><td>{8, 9}</td><td>no catalogo</td></tr><tr><td>lena-77</td><td>{6, 8}</td><td>keeps 6</td></tr><tr><td>bia-31</td><td>{4, 6}</td><td>does not notice</td></tr><tr><td>caio-58</td><td>{1, 4}</td><td>does not notice</td></tr><tr><td>davi-12</td><td>{1, 9}</td><td>keeps 1</td></tr></table><li>10,000 customers simulated in module 16: <b>240 (2.4%)</b> with the same pair as <code>mkt-01</code> (expected 1 ÷ 45 = 2.2%); <b>3,868 (38.7%)</b> share at least one replica (expected 37.8%); fixed groups: 2,007 (20%)</li><li>With 4 of 10: C(10, 4) = 210 sets, 0.5% with the same set, but 93.2% share at least one replica</li><li>Sharding cuts data and customers; <i>bulkhead</i> cuts resources; <i>shuffle sharding</i> cuts both</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (derrubar, travar, separar…) e leva até ele
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
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'isolamento') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'isolamento' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-isolamento3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'isolamento') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    // as paredes sobem (ou descem) dentro do pool
    const pool = B.pool, ptop = PL + pool.h;
    WALLS.forEach(Wl => { const want = o.walls && pool.f > 0.9 ? 1 : 0; Wl.f += Math.sign(want - Wl.f) * Math.min(Math.abs(want - Wl.f), dt / 0.7);
      const e = ease(clamp(Wl.f)); Wl.g.visible = Wl.f > 0.01 && pool.g.visible;
      if (Wl.g.visible) Wl.g.position.copy(W(Wl.x, PY + GY - 3, ptop - 18 + e * 18));
      Wl.mat.emissive.copy(accent); Wl.mat.emissiveIntensity = 0.35 * e; });
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
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); WALLS.forEach(Wl => { Wl.f = o.walls ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
