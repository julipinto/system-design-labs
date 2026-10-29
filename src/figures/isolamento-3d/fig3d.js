// Figura 3D (iso-glow): o raio e as paredes. A loja vista como uma planta: os 3 shards de pedidos (o shard-2 maior, com o mkt-01),
// o pagamentos (2 réplicas), as 10 réplicas do catalogo, o recomendacoes, o primário de SP e as réplicas do Rio e de Recife, e o pool
// de conexões do pagamentos como o casco de um navio (paredes que sobem entre os compartimentos 50/30/20).
// Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=blast|healthcheck|dados|bulkhead|shuffle; ?step=N abre no passo N).
// Dados: docs/escrita/resiliencia-brief.md e as aulas 3, 4, 12 e 13 (1/N 33,3% × shard-2 60%; 5 s × 3 = 15 s, 225 e 960 perdidas,
// pânico a 50%; RTO 35 s, 1.050 escritas, RPO 9 · 24, 640 → 128 req/s; pool de 100 em 3,33 s × 50/30/20 em 1,67 s, o 1058 do Caio
// às 20:20:04 com frete Rio 12,00 = 71,70; pares do módulo 16: mkt-01 {8, 9}, lena-77 {6, 8}, bia-31 {4, 6}, caio-58 {1, 4}, davi-12 {1, 9}).
FIGS3D.push({ id: 'isolamento', name: 'Isolamento', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 2) => v.toFixed(d).replace('.', ',');
  const clock = s => '20:20:' + String(Math.floor(Math.max(0, s))).padStart(2, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['blast', 'healthcheck', 'dados', 'bulkhead', 'shuffle'];
  const SCNAME = { blast: 'Blast', healthcheck: 'Healthcheck', dados: 'Dados', bulkhead: 'Bulkhead', shuffle: 'Shuffle' };
  const SCFULL = { blast: 'O raio de explosão', healthcheck: 'Réplicas e healthcheck', dados: 'A camada de dados',
    bulkhead: 'Bulkheads: as paredes', shuffle: 'Shuffle sharding' };
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
    o.rows['c' + i] = act(String(i), '', [s === 'bad' ? 'trava' : s === 'off' ? 'fora' : 'ok', s === 'bad' || s === 'off' ? 'bad' : 'dim']);
    if (s === 'bad' || s === 'off') o.on['c' + i] = 'bad'; else if (s === 'on') o.on['c' + i] = 1; } };
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], walls: 0 }; }

  // Blast: a planta inteira; down = o componente derrubado no passo
  const TELA = (st = {}) => { const r = (k, lab) => { const v = st[k]; return [`${lab}: ${v || 'ok'}`, v ? 'bad' : 'dim']; };
    const d = act('tela da loja', 'O QUE O CLIENTE VÊ', r('cat', 'catálogo'), r('rec', 'recomendações'), r('chk', 'checkout'), r('meus', 'meus pedidos')); d.fs = 14; d.lh = 17.5; d.y0 = 39; return d; };
  function blastBase(o, down) {
    show(o, 's0', 's1', 's2', 'pag', 'rec', 'tela'); cells(o, down === 'cat' ? { 3: 'off' } : {});
    o.rows.s0 = act('shard-0', 'PEDIDOS', ['1/3 dos clientes', 'dim']); o.rows.s1 = act('shard-1', 'PEDIDOS', ['1/3 dos clientes', 'dim']);
    o.rows.s2 = act('shard-2', 'PEDIDOS', ['1/3 dos clientes', 'dim'], ['+ o mkt-01', 'dim']);
    o.rows.pag = act('pagamentos', 'SERVIÇO', ['cobra no PSP', 'dim'], ['2 réplicas · 40/s', 'dim']);
    o.rows.rec = act('recomendacoes', 'SERVIÇO', ['"recomendado": [...]', 'dim']);
    o.rows.tela = TELA();
    const dn = k => down === k ? 'bad' : '';
    // os cabos ficam apagados; só o do componente derrubado fica vermelho
    o.beams = [{ pts: CAB.tbus }, { pts: CAB.cbus }, ...catBranches(280, i => ({ tone: down === 'cat' && i === 3 ? 'bad' : '' })),
      { pts: CAB.trec, tone: dn('rec') }, { pts: CAB.tpag, tone: dn('pag') },
      { pts: CAB.tsh, tone: dn('s2') }, { pts: CAB.sh0 }, { pts: CAB.sh1 }, { pts: CAB.sh2, tone: dn('s2') }];
    T(o, [150, 268, 24], 'catalogo · 10 réplicas', 'dim');
  }
  // Healthcheck: o balanceador e as duas réplicas do pagamentos
  const LB = (...r) => act('lb-loja', 'BALANCEADOR', ...r);
  const REP = (n, ...r) => act('pagamentos-' + n, 'RÉPLICA', ...r);
  function hcBase(o) {
    show(o, 'lb', 'p1', 'p2', 'pspH');
    o.rows.lb = LB(['30 pedidos/s', 'dim'], ['GET /saude a cada 5 s', 'dim'], ['no pool: 2 de 2', 'hi']);
    o.rows.p1 = REP(1, ['15/s · 20/s de capacidade', 'dim'], ['/saude: 200', 'acc']);
    o.rows.p2 = REP(2, ['15/s · 20/s de capacidade', 'dim'], ['/saude: 200', 'acc']);
    o.rows.pspH = act('PSP-A', 'COBRANÇA', ['p50 180 ms', 'dim']);
    o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, on: 1, flow: 1 }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
  }
  // Dados
  const PG = (nm, meta, ...r) => act(nm, meta, ...r);
  function dbBase(o) {
    show(o, 'sp', 'rio', 'recife', 'ped', 'cache', 'cat');
    o.rows.sp = PG('pg-sp', 'PRIMÁRIO', ['lê e escreve', 'dim'], ['recebe 30 escritas/s', 'hi']);
    o.rows.rio = PG('pg-rio', 'RÉPLICA', ['só leitura · assíncrona', 'dim'], ['atende o cache', 'dim']);
    o.rows.recife = PG('pg-recife', 'RÉPLICA', ['só leitura · assíncrona', 'dim'], ['mais longe de SP', 'dim']);
    o.rows.ped = act('pedidos', 'ESCREVE', ['30 pedidos/s', 'hi'], ['INSERT no primário', 'dim']);
    o.rows.cache = act('cache do catálogo', 'TTL 60 s', ['acerto: 80%', 'dim'], ['à origem: 128 req/s', 'dim']);
    o.rows.cat = act('catalogo', 'LÊ', ['640 req/s', 'hi']);
    o.beams = [{ pts: CAB.psp, on: 1, flow: 1 }, { pts: CAB.rep1, on: 1 }, { pts: CAB.rep2, on: 1 }, { pts: CAB.crio, on: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
  }
  // Bulkhead: pool = { walls, psp (conexões presas no PSP-A), fr, em (conexões de frete e e-mail), tone }
  function bhBase(o) {
    show(o, 'caio', 'pagB', 'pool', 'psp', 'frete', 'email');
    o.rows.caio = act('Caio · Rio', 'PEDIDO 1058', ['3 canecas azuis · 59,70', 'dim'], ['ainda não fechou', 'dim']);
    o.rows.pagB = act('pagamentos', '30 PEDIDOS/S', ['cobra · cota frete', 'dim'], ['manda e-mail', 'dim']);
    o.rows.pool = act('pool de conexões', 'PAGAMENTOS'); o.rows.pool.pool = { walls: 0, psp: 5, fr: 2, em: 2, tone: 'acc' };
    o.rows.psp = act('PSP-A', 'COBRANÇA', ['p50 180 ms', 'dim'], ['responde', 'acc']);
    o.rows.frete = act('cotação de frete', 'RÁPIDA', ['responde', 'acc']);
    o.rows.email = act('e-mail', 'RÁPIDO', ['responde', 'acc']);
    o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, on: 1, flow: 1 }, { pts: CAB.qfr, on: 1 }, { pts: CAB.qem, on: 1 }];
  }
  // Shuffle: st = estado de cada réplica, kt = estado de cada cliente
  function shBase(o, st = {}, kt = {}) {
    cells(o, st);
    CLI.forEach(([nm, pr], k) => { show(o, 'k' + k); const s = kt[k];
      o.rows['k' + k] = act(nm, `{${pr.join(', ')}}`, [s === 'bad' ? 'sem catalogo' : s === 'half' ? 'perde metade' : s === 'one' ? 'segue na outra' : 'atendido', s === 'bad' || s === 'half' ? 'bad' : s === 'one' ? 'acc' : 'dim']);
      if (s === 'bad' || s === 'half') o.on['k' + k] = 'bad'; else if (s === 'one') o.on['k' + k] = 1; });
    T(o, [150, 180, 30], 'catalogo-1 … catalogo-10', 'dim');
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    blast: [
      { id: 'planta', dur: 5, title: 'A loja como uma planta', yk: 'AS QUATRO PERGUNTAS',
        code: ['se este componente parar:', '  o que deixa de funcionar?', '  o que funciona em parte?', '  em quanto tempo volto?', '  gero inconsistência?'],
        story: 'Cada bloco é um componente da loja: os 3 <i>shards</i> da tabela <code>pedidos</code> (o <code>shard-2</code> é o maior), o <code>pagamentos</code>, as 10 réplicas do <code>catalogo</code> e o <code>recomendacoes</code>. Na frente, a tela da loja com as quatro partes que o cliente usa. O <b>raio de explosão</b> de um componente é o tanto dessa tela que apaga quando ele para.',
        look: 'Todos os cabos saem da tela. Nos próximos passos, um componente fica vermelho de cada vez e a mancha aparece na tela.',
        key: 'Raio de explosão é o tanto da loja que para quando um componente falha.',
        f(o) { blastBase(o); lit(o, 'tela');
          o.cnt = [['PERGUNTAS', '4'], ['COMPONENTES', '15', 'dim'], ['RAIO', 'a medir', 'dim']];
          o.res = [['raio pequeno e conhecido', 'acc']]; } },
      { id: 'rec', dur: 5, title: 'recomendacoes cai: some uma seção', yk: 'O FALLBACK DO MÓDULO 9', act: ['Derrubar recomendacoes', 'raio pequeno'],
        code: ['recomendacoes: fora', 'bff-app responde sem a seção:', '  "recomendado": []   em 100 ms', 'catálogo, checkout, meus pedidos: ok'],
        story: 'O <code>recomendacoes</code> para. O <code>bff-app</code> já tem o <i>fallback</i> do módulo 9: responde sem a seção, com <code>"recomendado": []</code>, em 100 ms. A tela perde uma parte e o resto segue: catálogo, checkout e meus pedidos funcionam.',
        look: 'O recomendacoes fica vermelho e só a linha "recomendações" da tela apaga.',
        key: 'Raio pequeno: some uma seção da tela.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'rec' : ''); lit(o, 'tela'); if (d) { bad(o, 'rec'); o.rows.rec = act('recomendacoes', 'FORA', ['não responde', 'bad']); o.rows.tela = TELA({ rec: '[] (sem seção)' }); }
          o.cnt = [['RAIO', d ? '1 seção' : '…', d ? 'acc' : 'dim'], ['CHECKOUT', 'ok', 'dim'], ['NAVEGAÇÃO', 'ok', 'dim']];
          o.res = d ? [['some uma seção, o resto segue', 'acc']] : [];
          if (d) T(o, [742, 225, 40], 'sem recomendações', 'bad'); } },
      { id: 'catalogo', dur: 5, title: '1 de 10 réplicas do catalogo: 10% da capacidade', yk: '1/N COM N = 10', act: ['Derrubar uma réplica', 'catalogo-3'],
        code: ['catalogo: 10 réplicas', 'catalogo-3: fora', 'capacidade: 9 de 10 = 90%', 'erro visível: nenhum', 'o mesmo catalogo serve bff-app e bff-web'],
        story: 'Uma das 10 réplicas do <code>catalogo</code> para. O balanceador manda o tráfego para as outras 9: a loja perde <b>10% da capacidade</b> e ninguém vê erro (quanto tempo a réplica leva para sair do pool é a aula 4). Uma ressalva: o mesmo <code>catalogo</code> serve o <code>bff-app</code> e o <code>bff-web</code> (módulo 9). Se o serviço inteiro cair, os dois canais apagam juntos.',
        look: 'A réplica 3 fica vermelha; a tela continua acesa.',
        key: 'Com N cópias, uma a menos custa 1/N da capacidade.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'cat' : ''); lit(o, 'tela');
          o.cnt = [['CAPACIDADE', d ? '90%' : '100%'], ['1/N', '10%', 'dim'], ['ERRO NA TELA', 'nenhum', 'dim']];
          o.res = d ? [['10% a menos, sem erro visível', 'acc']] : [];
          if (d) T(o, [CC(3), 225, 40], 'catalogo-3 fora', 'bad'); } },
      { id: 'pagamentos', dur: 5, title: 'pagamentos cai: todo o checkout para', yk: 'O MAIOR RAIO DA LOJA', act: ['Derrubar pagamentos', 'raio grande'],
        code: ['pagamentos: fora', 'checkout: parado (toda a receita)', 'catálogo: ok', 'meus pedidos: ok', 'recomendações: ok'],
        story: 'Agora o <code>pagamentos</code>. Ninguém fecha compra: o checkout inteiro para, e com ele toda a receita. A navegação segue (dá para ver produtos e pedidos antigos), mas não dá para pagar. É o maior raio da loja, e por isso o <code>pagamentos</code> recebe as defesas das aulas 5 a 11.',
        look: 'O pagamentos fica vermelho e a linha "checkout" da tela também. As outras continuam acesas.',
        key: 'Raio grande: toda a receita para, a navegação segue.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 'pag' : ''); lit(o, 'tela');
          if (d) { bad(o, 'pag'); o.rows.pag = act('pagamentos', 'FORA', ['não cobra', 'bad']); o.rows.tela = TELA({ chk: 'parado' }); }
          o.cnt = [['RAIO', d ? 'toda a receita' : '…', d ? 'bad' : 'dim'], ['CHECKOUT', d ? 'parado' : 'ok', d ? 'bad' : 'dim'], ['NAVEGAÇÃO', 'ok', 'dim']];
          o.res = d ? [['checkout parado, navegação ok', 'bad']] : [];
          if (d) T(o, TF(450), 'ninguém paga', 'bad'); } },
      { id: 'n', dur: 5, title: 'Três shards: a conta 1/N diz 33,3%', yk: '1/N COM CARGA IGUAL',
        code: ['um compartimento fora leva 1/N:', '  N = 3       33,3%', '  N = 10      10%', '  N = 100     1%', '  N = 1.000   0,1%'],
        story: 'A tabela <code>pedidos</code> está em 3 <i>shards</i>, por <code>cliente_id</code> (módulo 16). A conta de manual diz que, com N compartimentos iguais, um fora leva 1/N: N = 3 dá <b>33,3%</b>; N = 10, 10%; N = 100, 1%; N = 1.000, 0,1%. Quanto mais compartimentos, menor o raio de cada um.',
        look: 'Os três shards acendem, cada um com 1/3 dos clientes. Repare que o shard-2 é maior.',
        key: '1/N só vale se os compartimentos pesam igual.',
        f(o) { blastBase(o); lit(o, 's0', 's1', 's2');
          o.cnt = [['1/N', '33,3%'], ['SHARDS', '3', 'dim'], ['CLIENTES EM CADA', '1/3', 'dim']];
          o.res = [['a promessa: 33,3% por shard', 'acc']]; } },
      { id: 'shard2', dur: 6, title: 'E se der errado: o shard-2 leva 60% das linhas', yk: 'A CONTA COM CARGA DESIGUAL', act: ['Derrubar shard-2', 'onde mora o mkt-01'],
        code: ['mkt-01: 40% das linhas (módulo 16)', 'shard-2 = 0,4 + 0,6 ÷ 3 = 60%', 'shard-0 = 0,6 ÷ 3 = 20%', 'shard-1 = 0,6 ÷ 3 = 20%', 'fora: 1/3 dos clientes, 60% das linhas'],
        story: 'O <code>shard-2</code> para. Pela conta 1/N, seria um terço. Mas é nele que mora o <code>mkt-01</code>, o marketplace parceiro que sozinho tem <b>40%</b> das linhas de <code>pedidos</code> (módulo 16). O <code>shard-2</code> guarda 0,4 + 0,6 ÷ 3 = <b>60% das linhas</b>, e os outros dois, 20% cada. A queda afeta 1/3 dos clientes e 60% dos pedidos. O artigo supõe carga uniforme, e 1/N é só o melhor caso.',
        look: 'O shard-2 fica vermelho, e com ele o checkout e os pedidos de 1/3 dos clientes, entre eles o mkt-01.',
        key: 'Com carga desigual, o raio de um shard é o peso dele, não 1/N.',
        f(o, t) { const d = t > 0.6; blastBase(o, d ? 's2' : ''); lit(o, 'tela');
          o.rows.s0 = act('shard-0', 'PEDIDOS', ['1/3 dos clientes', 'dim'], ['20% das linhas', d ? 'acc' : 'dim']);
          o.rows.s1 = act('shard-1', 'PEDIDOS', ['1/3 dos clientes', 'dim'], ['20% das linhas', d ? 'acc' : 'dim']);
          o.rows.s2 = act('shard-2', d ? 'FORA' : 'PEDIDOS', ['1/3 dos clientes', 'dim'], ['+ mkt-01 (40%)', d ? 'bad' : 'dim'], ['60% das linhas', d ? 'bad' : 'dim']);
          if (d) { bad(o, 's2'); o.rows.tela = TELA({ chk: 'fora p/ 1/3', meus: 'fora p/ 1/3' }); }
          o.cnt = [['LINHAS FORA', d ? '60%' : '…', 'bad'], ['CLIENTES FORA', '1/3', 'dim'], ['1/N PROMETIA', '33,3%', 'dim']];
          o.res = d ? [['1/3 dos clientes, 60% das linhas', 'bad']] : [];
          if (d) T(o, [477, 40, 96], '60% das linhas', 'bad'); } },
    ],
    healthcheck: [
      { id: 'replicas', dur: 6, title: 'Duas réplicas atrás do balanceador', yk: 'O POOL DO lb-loja',
        code: ['pagamentos: 2 réplicas de 20/s', 'capacidade total: 40/s', 'Black Friday: 30 pedidos/s', '  15/s em cada réplica', 'GET /saude a cada 5 s', '3 falhas seguidas: sai do pool'],
        story: 'O <code>pagamentos</code> tem <b>2 réplicas</b> de 20/s (módulo 14) atrás do <code>lb-loja</code>. Na Black Friday chegam <b>30 pedidos/s</b>, 15/s para cada uma. A cada <b>5 s</b> o balanceador consulta a URL de saúde de cada réplica; a que falha <b>3 vezes seguidas</b> sai do pool (módulo 7). O <i>healthcheck</i> é raso: confere só se o processo responde.',
        look: 'Os pedidos saem do balanceador e se dividem entre as duas réplicas.',
        key: 'Várias réplicas atrás de um balanceador que sabe quem está vivo.',
        f(o) { hcBase(o); lit(o, 'lb', 'p1', 'p2');
          o.cnt = [['POR RÉPLICA', '15/s'], ['CAPACIDADE', '40/s', 'dim'], ['NO POOL', '2 de 2', 'dim']];
          o.res = [['as duas respondem', 'acc']]; } },
      { id: 'trava', dur: 9, title: 'pagamentos-2 trava: 15 s até sair do pool', yk: 'INTERVALO × FALHAS', act: ['Travar pagamentos-2', 'conte as falhas'],
        code: ['intervalo 5 s × 3 falhas = 15 s', 'a réplica travada recebe 15/s', '15/s × 15 s = 225 falhas', 'sonda 1 (5 s): falha', 'sonda 2 (10 s): falha', 'sonda 3 (15 s): sai do pool'],
        story: 'O <code>pagamentos-2</code> trava: o processo está de pé, mas não responde. O balanceador não sabe disso e continua mandando metade do tráfego, <b>15/s</b>, para ele. Só depois de <b>3 sondas</b> falhando, uma a cada 5 s, ele sai do pool: <b>15 s</b>. Nesse tempo passam 15 × 15 = <b>225</b> pedidos por uma réplica travada.',
        look: 'A pilha vermelha ao lado da réplica cresce até 225; as sondas falham uma a uma no balanceador.',
        key: 'Até a réplica sair do pool, cada pedido que cai nela falha.',
        f(o, t) { hcBase(o); const s = lin(t, 0.5, 7.5, 0, 15), k = Math.floor(s / 5 + 1e-6), out = s >= 15, n = Math.round(15 * s);
          lit(o, 'lb', 'p1'); bad(o, 'p2');
          o.rows.p2 = REP(2, [out ? 'fora do pool' : 'travada: não responde', 'bad'], [`/saude: ${k} de 3 falhas`, 'bad']);
          o.rows.lb = LB(['30 pedidos/s', 'dim'], [`sondas falhas: ${k} de 3`, k ? 'bad' : 'dim'], [`no pool: ${out ? '1' : '2'} de 2`, out ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, tone: out ? '' : 'bad', flow: !out }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
          o.piles.push({ p: [850, 245, PL + 2], v: n, f: n / 225 });
          o.cnt = [['FALHAS', thou(n), 'bad'], ['TEMPO', dec(s, 1) + ' s', 'dim'], ['SONDAS FALHAS', `${k} de 3`, 'dim']];
          o.res = out ? [['225 falhas, então sai do pool', 'bad']] : [['ainda no pool', 'dim']];
          if (out) T(o, TF(689), 'pagamentos-2 fora do pool', 'acc'); } },
      { id: 'sai', dur: 5, title: 'Fora do pool: metade da capacidade', yk: 'DEPOIS DOS 15 s',
        code: ['pagamentos-2: fora do pool', 'pagamentos-1: recebe tudo', 'capacidade: 20/s (metade)', 'o serviço segue no ar', '"fora" virou "metade"'],
        story: 'Aos 15 s o <code>pagamentos-2</code> sai do pool e o balanceador manda tudo para o <code>pagamentos-1</code>. A loja segue vendendo com <b>metade da capacidade</b>. Sem a segunda réplica, a mesma trava teria tirado o <code>pagamentos</code> inteiro do ar. Duas cópias transformam "serviço fora" em "metade da capacidade".',
        look: 'O cabo para a réplica travada apaga; só o caminho do pagamentos-1 segue aceso.',
        key: 'Réplica é a defesa barata: transforma "fora" em "metade".',
        f(o) { hcBase(o); lit(o, 'lb', 'p1'); bad(o, 'p2');
          o.rows.p2 = REP(2, ['fora do pool', 'bad'], ['/saude: 3 de 3 falhas', 'bad']);
          o.rows.p1 = REP(1, ['recebe todo o tráfego', 'acc'], ['/saude: 200', 'acc']);
          o.rows.lb = LB(['30 pedidos/s', 'dim'], ['GET /saude a cada 5 s', 'dim'], ['no pool: 1 de 2', 'acc']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2 }, { pts: CAB.p1psp }, { pts: CAB.p2psp }];
          o.cnt = [['NO POOL', '1 de 2'], ['CAPACIDADE', '20/s', 'dim'], ['SERVIÇO', 'no ar', 'dim']];
          o.res = [['metade da capacidade, no ar', 'acc']]; } },
      { id: 'catalogo', dur: 9, title: 'No catalogo: 960 requisições em 15 s', yk: 'O MESMO RELÓGIO, MAIS TRÁFEGO', act: ['Travar catalogo-7', '640 req/s'],
        code: ['catalogo: 10 réplicas, 640 req/s', '64 req/s em cada', 'catalogo-7 trava', '64 × 15 s = 960 perdidas', 'outlier detection (Envoy):', '  tira quem erra em sequência'],
        story: 'O mesmo vale para o <code>catalogo</code>: 10 réplicas atrás do <code>lb-loja</code>, 640 req/s, <b>64 req/s</b> em cada. Uma trava e leva os mesmos 15 s para sair: <b>960</b> requisições perdidas. O <i>outlier detection</i> do Envoy encurta isso: tira da rotação quem erra em sequência, sem esperar a sonda. Os dois mecanismos se somam.',
        look: 'A réplica 7 fica vermelha e a pilha cresce até 960 antes de ela sair.',
        key: 'Quanto maior o tráfego, mais caros os 15 s.',
        f(o, t) { show(o, 'lb'); const s = lin(t, 0.5, 7.5, 0, 15), out = s >= 15, n = Math.round(64 * s);
          cells(o, { 7: 'bad' }); lit(o, 'lb');
          o.rows.lb = LB(['catalogo: 640 req/s', 'dim'], [`64 req/s × ${dec(s, 1)} s`, 'bad'], [`no pool: ${out ? 9 : 10} de 10`, out ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lcat, on: 1, flow: 1 }, { pts: CAB.cbus, on: 1 }, ...catBranches(280, i => i === 7 ? { tone: out ? '' : 'bad' } : { on: 1 })];
          o.piles.push({ p: [640, 300, PL + 2], v: n, f: n / 960 });
          o.cnt = [['PERDIDAS', thou(n), 'bad'], ['TEMPO', dec(s, 1) + ' s', 'dim'], ['POR RÉPLICA', '64 req/s', 'dim']];
          o.res = out ? [['960 perdidas em 15 s', 'bad']] : [['ainda no pool', 'dim']];
          T(o, [150, 268, 24], 'catalogo · 10 réplicas', 'dim'); } },
      { id: 'profundo', dur: 9, title: 'E se der errado: o healthcheck profundo consulta o PSP-A', yk: 'GET /saude → PSP-A', act: ['Ligar o profundo', 'que consulta o PSP-A'],
        code: ['GET /saude também chama o PSP-A', '20:20:00 PSP-A passa a 8 s', 'pagamentos-1: sonda estoura', 'pagamentos-2: sonda estoura', '3 sondas (15 s): as duas saem', 'saudáveis: 0 de 2'],
        story: 'Alguém escreve um <i>healthcheck</i> profundo: a URL de saúde do <code>pagamentos</code> também consulta o PSP-A. Às <b>20:20:00</b> o PSP-A passa a responder em <b>8 s</b>. As sondas das <b>duas</b> réplicas estouram, porque o problema não é de nenhuma delas. Depois de 3 sondas (15 s), o balanceador tira as duas: a loja fica sem <code>pagamentos</code> com as réplicas perfeitas.',
        look: 'As sondas atravessam as réplicas até o PSP-A e voltam vermelhas; as duas réplicas ficam vermelhas juntas.',
        key: 'Dependência lenta não é doença da réplica.',
        f(o, t) { hcBase(o); const s = lin(t, 0.5, 7.5, 0, 15), k = Math.floor(s / 5 + 1e-6), out = s >= 15;
          bad(o, 'pspH'); o.rows.pspH = act('PSP-A', 'LENTO', ['8 s desde 20:20:00', 'bad']);
          if (k) bad(o, 'p1', 'p2'); else lit(o, 'p1', 'p2');
          const R = n => REP(n, [out ? 'fora do pool' : 'processo: ok', out ? 'bad' : 'acc'], [`/saude: ${k} de 3 falhas`, k ? 'bad' : 'dim']);
          o.rows.p1 = R(1); o.rows.p2 = R(2); bad(o, 'lb');
          o.rows.lb = LB(['healthcheck profundo', 'bad'], [`sondas falhas: ${k} de 3`, k ? 'bad' : 'dim'], [`no pool: ${out ? 0 : 2} de 2`, out ? 'bad' : 'hi']);
          o.beams = [{ pts: CAB.lp1, tone: 'bad', flow: 1 }, { pts: CAB.lp2, tone: 'bad', flow: 1 }, { pts: CAB.p1psp, tone: 'bad', flow: 1 }, { pts: CAB.p2psp, tone: 'bad', flow: 1 }];
          o.cnt = [['NO POOL', `${out ? 0 : 2} de 2`, out ? 'bad' : 'acc'], ['RELÓGIO', clock(s), 'dim'], ['PSP-A', '8 s', 'bad']];
          o.res = out ? [['as duas réplicas fora do pool', 'bad']] : [['as sondas esperam o PSP-A', 'dim']];
          T(o, [452, 22, 40], 'GET /saude → PSP-A', 'bad'); } },
      { id: 'panico', dur: 6, title: 'E se der errado: o pânico a 50%', yk: 'O PANIC THRESHOLD DO ENVOY',
        code: ['Envoy: panic threshold padrão = 50%', 'saudáveis: 0 de 2 = 0% < 50%', '→ ignora a saúde, manda para as 2', 'regra: tirar do pool confere só', '  o que a réplica controla', 'PSP lento: breaker e fallback'],
        story: 'O Envoy tem uma trava: abaixo de <b>50%</b> de réplicas saudáveis (o padrão do <i>panic threshold</i>) ele <b>ignora a saúde</b> e volta a balancear entre todas. Aqui o pânico salva, mas contar com ele é conta de azar. A regra: o <i>healthcheck</i> que tira do pool confere só o que a réplica controla (processo, memória, fila). O PSP lento se trata com <i>circuit breaker</i> (aula 8) e <i>fallback</i> (aula 9).',
        look: 'O balanceador entra em pânico e manda tráfego de novo para as duas réplicas "doentes".',
        key: 'Ejetar quem não tem culpa não ajuda e pode causar o apagão.',
        f(o) { hcBase(o); bad(o, 'pspH', 'lb'); lit(o, 'p1', 'p2'); o.rows.pspH = act('PSP-A', 'LENTO', ['8 s desde 20:20:00', 'bad']);
          const R = n => REP(n, ['"doente", recebe 15/s', 'bad'], ['/saude: 3 de 3 falhas', 'bad']);
          o.rows.p1 = R(1); o.rows.p2 = R(2);
          o.rows.lb = LB(['MODO PÂNICO', 'bad'], ['saudáveis: 0% < 50%', 'bad'], ['manda para as 2', 'acc']);
          o.beams = [{ pts: CAB.lp1, on: 1, flow: 1 }, { pts: CAB.lp2, on: 1, flow: 1 }, { pts: CAB.p1psp, tone: 'bad' }, { pts: CAB.p2psp, tone: 'bad' }];
          o.cnt = [['ENVOY', 'pânico', 'bad'], ['SAUDÁVEIS', '0%', 'dim'], ['LIMIAR', '50%', 'dim']];
          o.res = [['salvo pelo pânico: conta de azar', 'bad']];
          T(o, TF(452), 'pânico: ignora a saúde', 'bad'); } },
    ],
    dados: [
      { id: 'split', dur: 5, title: 'Escrita no primário, leitura nas réplicas', yk: 'READ-WRITE SPLITTING (MÓDULO 17)',
        code: ['pedidos → pg-sp: 30 escritas/s', 'pg-sp → pg-rio e pg-recife', '  replicação assíncrona', 'leitura → réplicas', 'réplica de leitura cai: lê da outra'],
        story: 'A loja separa leitura de escrita (módulo 17). O <code>pedidos</code> escreve no primário <code>pg-sp</code>, <b>30 pedidos/s</b> na Black Friday. As réplicas <code>pg-rio</code> e <code>pg-recife</code> recebem as mudanças de forma assíncrona e atendem as leituras. Se uma réplica de leitura cai, o <i>fallback</i> é trivial: ler da outra.',
        look: 'As escritas sobem do pedidos ao primário; a replicação corre do primário às duas réplicas.',
        key: 'Cópias e leitura separada: a primeira defesa do dado.',
        f(o) { dbBase(o); lit(o, 'sp', 'ped');
          o.cnt = [['ESCRITAS', '30/s'], ['RÉPLICAS', '2', 'dim'], ['PRIMÁRIO', 'pg-sp', 'dim']];
          o.res = [['escreve em SP, lê nas réplicas', 'acc']]; } },
      { id: 'cache', dur: 5, title: 'O cache segura a origem: 640 → 128 req/s', yk: 'O ESCUDO DO CATÁLOGO',
        code: ['catalogo: 640 req/s', 'cache: TTL 60 s, 80% de acerto', '640 × 20% = 128 req/s na origem', 'o banco vê 1/5 da leitura'],
        story: 'O <code>catalogo</code> lê através de um cache com TTL de <b>60 s</b> (módulo 5). Com 80% de acerto, dos <b>640 req/s</b> só <b>128</b> chegam ao banco: 640 × 20%. O cache é um escudo, e o banco vê um quinto da carga de leitura.',
        look: 'O fluxo largo entra no cache vindo do catalogo; só um fio segue para a réplica.',
        key: 'O cache tira 80% da leitura de cima do banco.',
        f(o) { dbBase(o); lit(o, 'cache', 'cat', 'rio');
          o.rows.cache = act('cache do catálogo', 'TTL 60 s', ['acerto: 80%', 'acc'], ['à origem: 128 req/s', 'acc']);
          o.beams = [{ pts: CAB.psp }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, on: 1, flow: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
          T(o, [455, 345, 30], '640 req/s', 'acc'); T(o, [455, 195, 30], '128 req/s', 'acc');
          o.cnt = [['NA ORIGEM', '128 req/s'], ['NO CACHE', '640 req/s', 'dim'], ['ACERTO', '80%', 'dim']];
          o.res = [['o banco vê 128 de 640', 'acc']]; } },
      { id: 'cai', dur: 9, title: 'O primário de SP cai: 35 s sem escrita', yk: 'RTO = 35 s', act: ['Derrubar o pg-sp', 'o primário'],
        code: ['pg-sp: fora', 'RTO até a promoção: 35 s', '30 pedidos/s × 35 s = 1.050', '  tentativas de escrita sem primário', 'leitura: segue nas réplicas e no cache'],
        story: 'O <code>pg-sp</code> cai. Até uma réplica ser promovida a primária passam <b>35 s</b> (o RTO do módulo 17). Nesse tempo, a 30 pedidos/s, são 30 × 35 = <b>1.050</b> tentativas de escrita sem lugar para ir. A leitura continua: as réplicas e o cache seguem respondendo.',
        look: 'O primário fica vermelho e a pilha de escritas sem destino cresce até 1.050. O caminho da leitura continua aceso.',
        key: 'Banco não reinicia: o RTO é o preço da promoção.',
        f(o, t) { dbBase(o); const s = lin(t, 0.5, 7.5, 0, 35), n = Math.round(30 * s);
          bad(o, 'sp', 'ped'); lit(o, 'cache', 'cat', 'rio');
          o.rows.sp = PG('pg-sp', 'FORA', ['não responde', 'bad'], [`há ${Math.floor(s)} s`, 'bad']);
          o.rows.ped = act('pedidos', 'SEM PRIMÁRIO', [`${thou(n)} escritas sem destino`, 'bad'], ['30 pedidos/s', 'dim']);
          o.beams = [{ pts: CAB.psp, tone: 'bad', flow: 1 }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, on: 1, flow: 1 }, { pts: CAB.ccache, on: 1, flow: 1 }];
          o.piles.push({ p: [165, 405, PL + 2], v: n, f: n / 1050 });
          o.cnt = [['SEM PRIMÁRIO', Math.floor(s) + ' s', 'bad'], ['ESCRITAS PERDIDAS', thou(n), 'bad'], ['LEITURA', 'ok', 'dim']];
          o.res = s >= 35 ? [['35 s: 1.050 escritas sem destino', 'bad']] : [['esperando a promoção', 'dim']]; } },
      { id: 'promove', dur: 6, title: 'A promoção: RPO de 9 ou 24 pedidos', yk: 'RPO = O QUE A RÉPLICA NÃO TINHA',
        code: ['aos 35 s: pg-rio vira primário', 'RPO a 30 pedidos/s:', '  pg-rio       9 pedidos', '  pg-recife   24 pedidos', 'as réplicas são assíncronas:', '  estavam atrás do pg-sp'],
        story: 'Aos 35 s o <code>pg-rio</code> é promovido e as escritas voltam. Mas a réplica estava atrás do primário: os pedidos que o <code>pg-sp</code> gravou e ainda não tinha mandado se perdem. É o <b>RPO</b>: <b>9 pedidos</b> se a promovida for a do Rio, <b>24</b> se for a de Recife. RTO e RPO são o preço que a loja aceita, e precisam estar escritos.',
        look: 'O pg-rio vira primário e as escritas do pedidos vão até ele por um caminho novo.',
        key: 'O RPO é o dado que a réplica ainda não tinha.',
        f(o, t) { dbBase(o); const f = lin(t, 0.4, 2.4, 0, 1); bad(o, 'sp'); lit(o, 'rio', 'ped');
          o.rows.sp = PG('pg-sp', 'FORA', ['não responde', 'bad']);
          o.rows.rio = PG('pg-rio', 'NOVO PRIMÁRIO', ['promovido aos 35 s', 'acc'], ['perdeu 9 pedidos', 'bad']);
          o.rows.recife = PG('pg-recife', 'RÉPLICA', ['se fosse ela:', 'dim'], ['perderia 24 pedidos', 'dim']);
          o.rows.ped = act('pedidos', 'ESCREVE', ['30 pedidos/s', 'hi'], ['INSERT no pg-rio', 'acc']);
          o.beams = [{ pts: CAB.psp }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.prio, on: 1, flow: 1 }, { pts: CAB.crio, on: 1 }, { pts: CAB.ccache, on: 1 }];
          pk(o, CAB.prio, f, 'primeira escrita');
          o.cnt = [['RPO', '9 pedidos', 'bad'], ['SE FOSSE RECIFE', '24', 'dim'], ['RTO', '35 s', 'dim']];
          o.res = [['escreve de novo, 9 pedidos a menos', 'acc']];
          T(o, [455, 22, 50], 'RPO 9', 'bad'); T(o, [742, 22, 50], 'RPO 24', 'dim'); } },
      { id: 'stale', dur: 6, title: 'stale-if-error: o cache sobrevive à origem', yk: 'RFC 5861',
        code: ['Cache-Control: max-age=60,', '  stale-if-error=600', 'a origem falha → serve a cópia velha', 'preço 79,90 velho por até 10 min: ok', 'o comando do pedido revalida (módulo 18)'],
        story: 'Outro dia: a réplica que atende o cache fica fora. Com <code>stale-if-error</code> (RFC 5861), o cache continua servindo a cópia vencida por um prazo, aqui 10 min. Servir o preço de <b>79,90</b> "velho" é aceitável porque o comando do pedido revalida o preço vigente (módulo 18). A leitura pode estar atrasada; o dinheiro, não.',
        look: 'A réplica do Rio fica vermelha, mas o cache continua respondendo ao catalogo com a cópia velha.',
        key: 'O cache com stale-if-error segue servindo com a origem fora.',
        f(o, t) { dbBase(o); const d = t > 0.6; lit(o, 'cache', 'cat', 'sp', 'ped'); if (d) bad(o, 'rio');
          if (d) o.rows.rio = PG('pg-rio', 'FORA', ['não responde', 'bad']);
          o.rows.cache = act('cache do catálogo', 'STALE-IF-ERROR', [d ? 'serve a cópia velha' : 'acerto: 80%', 'acc'], [d ? 'preço 79,90 (vencido)' : 'à origem: 128 req/s', d ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.psp, on: 1, flow: 1 }, { pts: CAB.rep1, on: !d }, { pts: CAB.rep2, on: 1 }, { pts: CAB.crio, tone: d ? 'bad' : '', on: !d }, { pts: CAB.ccache, on: 1, flow: 1 }];
          o.cnt = [['CATÁLOGO', 'no ar'], ['ORIGEM', d ? 'fora' : 'ok', d ? 'bad' : 'dim'], ['PRAZO DO VELHO', '10 min', 'dim']];
          o.res = d ? [['serve o velho com a origem fora', 'acc']] : []; } },
      { id: 'estouro', dur: 10, title: 'E se der errado: o cache esfria junto com o banco', yk: 'O ESTOURO DE CACHE', act: ['Banco fora por 5 min', 'só com TTL'],
        code: ['banco fora por 5 min; só TTL de 60 s', 'as chaves expiram e o acerto despenca', 'o banco volta: todas expiraram juntas', '  640 req/s na origem, não 128', 'conserto: TTL com jitter', '  + stale-while-revalidate'],
        story: 'Agora sem <code>stale-if-error</code>: o banco fica 5 min fora e as chaves do catálogo, com TTL de 60 s, expiram. Quando o banco volta, todas expiraram juntas e os <b>640 req/s</b> caem na origem de uma vez, em vez dos 128 de sempre. É o estouro de cache (<i>cache stampede</i>): um pico que o banco recém-promovido não aguenta e que o derruba de novo. O conserto: TTL com <i>jitter</i> (cada chave expira num instante diferente) e <code>stale-while-revalidate</code> (servir o velho enquanto uma única requisição busca o novo).',
        look: 'O cache se esvazia enquanto o banco está fora; quando ele volta, o fluxo inteiro do catalogo passa direto e o banco fica vermelho de novo.',
        key: 'O mesmo TTL em tudo é uma bomba: chaves que expiram juntas voltam juntas.',
        f(o, t) { dbBase(o); const m = lin(t, 0.5, 5.5, 0, 5), back = t > 6, hit = Math.round(lin(m, 0, 1, 80, 0));
          lit(o, 'cat', 'sp', 'ped'); o.on.cache = back ? 'bad' : hit ? 1 : 'bad';
          if (!back || t > 7.5) bad(o, 'rio'); else lit(o, 'rio');
          o.rows.rio = PG('pg-rio', back ? (t > 7.5 ? 'CAIU DE NOVO' : 'VOLTOU') : 'FORA', [back ? '640 req/s de uma vez' : `fora há ${dec(m, 1)} min`, 'bad']);
          o.rows.cache = act('cache do catálogo', 'SÓ TTL 60 s', [`acerto: ${back ? 0 : hit}%`, hit && !back ? 'acc' : 'bad'], [back ? 'todas as chaves vencidas' : hit ? 'chaves expirando' : 'vazio', 'bad']);
          o.beams = [{ pts: CAB.psp, on: 1 }, { pts: CAB.rep1 }, { pts: CAB.rep2 }, { pts: CAB.crio, tone: 'bad', flow: back }, { pts: CAB.ccache, on: 1, flow: 1, tone: back ? 'bad' : '' }];
          o.cnt = [['NA ORIGEM', back ? '640 req/s' : '—', 'bad'], ['ACERTO', `${back ? 0 : hit}%`, 'dim'], ['DE SEMPRE', '128 req/s', 'dim']];
          o.res = back ? [['640 de uma vez: estouro de cache', 'bad']] : [['banco fora, cache esvaziando', 'dim']];
          if (back) T(o, [455, 195, 30], '640 req/s', 'bad'); } },
    ],
    bulkhead: [
      { id: 'pool', dur: 5, title: 'Um pool de 100 para três dependências', yk: 'LEI DE LITTLE (AULA 6)',
        code: ['pagamentos: pool de 100 conexões', '  PSP-A, cotação de frete, e-mail', 'normal: PSP-A em 180 ms', 'em voo = 30/s × 0,18 s = 5,4', 'sobra quase tudo'],
        story: 'O <code>pagamentos</code> fala com três dependências pelo mesmo <b>pool de 100 conexões</b>: o PSP-A (a cobrança), a cotação de frete e o e-mail. Num dia normal o PSP-A responde em 180 ms e, a 30 pedidos/s, ocupa só 30 × 0,18 = <b>5,4</b> conexões em voo (Lei de Little, aula 6). Sobra quase todo o pool.',
        look: 'Poucas casas do pool acesas; as três dependências respondem.',
        key: 'Um pool, um raio: as três dependências dividem o mesmo compartimento.',
        f(o) { bhBase(o); lit(o, 'pagB', 'pool');
          o.cnt = [['EM VOO NO PSP-A', '5,4'], ['POOL', '100', 'dim'], ['DEPENDÊNCIAS', '3', 'dim']];
          o.res = [['as três passam pelo mesmo pool', 'acc']]; } },
      { id: 'enche', dur: 8, title: 'PSP-A em 8 s: o pool enche em 3,33 s', yk: 'POOL ÷ TAXA', act: ['PSP-A em 8 s', '20:20:00'],
        code: ['20:20:00 o PSP-A passa a 8 s', 'chegam 30/s; nenhuma volta antes de 8 s', 'em voo = 30 × t', '100 ÷ 30 = 3,33 s: pool cheio', 'frete e e-mail: sem conexão'],
        story: 'Às <b>20:20:00</b> o PSP-A passa a responder em <b>8 s</b>. Cada chamada prende uma conexão por 8 s, e chegam 30 por segundo: em <b>100 ÷ 30 = 3,33 s</b> as 100 conexões estão presas no PSP-A. A cotação de frete e o e-mail, que respondem rápido, ficam sem conexão. A falha de uma dependência derrubou as três.',
        look: 'As casas do pool se enchem de vermelho até não sobrar nenhuma; frete e e-mail ficam vermelhos.',
        key: 'Pool compartilhado: a dependência lenta toma o compartimento inteiro.',
        f(o, t) { bhBase(o); const s = lin(t, 0.5, 6, 0, 3.6), n = Math.min(100, Math.round(30 * s)), full = n >= 100;
          lit(o, 'pagB'); bad(o, 'psp'); o.on.pool = full ? 'bad' : 1;
          o.rows.pool.pool = { walls: 0, psp: n, fr: full ? 0 : 2, em: full ? 0 : 2, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'LENTO', ['8 s por chamada', 'bad'], ['prende a conexão', 'bad']);
          if (full) { bad(o, 'frete', 'email'); o.rows.frete = act('cotação de frete', 'RÁPIDA', ['sem conexão no pool', 'bad']); o.rows.email = act('e-mail', 'RÁPIDO', ['sem conexão no pool', 'bad']); }
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, tone: 'bad', flow: 1 }, { pts: CAB.qfr, on: !full, tone: full ? 'bad' : '' }, { pts: CAB.qem, on: !full, tone: full ? 'bad' : '' }];
          o.cnt = [['EM VOO', `${n} de 100`, full ? 'bad' : 'acc'], ['t', dec(Math.min(s, 3.33), 2) + ' s', 'dim'], ['FRETE E E-MAIL', full ? 'sem conexão' : 'ok', full ? 'bad' : 'dim']];
          o.res = full ? [['3,33 s: pool cheio, as três param', 'bad']] : [['enchendo…', 'dim']]; } },
      { id: 'caio', dur: 6, title: 'Às 20:20:04, o 1058 do Caio fica sem frete', yk: 'O PEDIDO 1058',
        code: ['20:20:04 pedido 1058 (Caio, Rio)', '  3 canecas azuis    59,70', '  frete Rio          ?', 'cotação de frete: sem conexão', 'o PSP-A lento parou o frete'],
        story: 'Às <b>20:20:04</b> o Caio, no Rio, fecha o pedido <b>1058</b>: 3 canecas azuis (59,70). O <code>pagamentos</code> precisa da cotação de frete, mas o pool está cheio desde as 20:20:03, todo preso no PSP-A. A cotação nem sai, e o pedido para antes de chegar à cobrança. O frete não tem nada a ver com o PSP, e caiu junto.',
        look: 'O 1058 desce do Caio ao pagamentos e a chamada de frete esbarra no pool cheio.',
        key: 'Com um pool só, quem não depende do PSP-A também perde.',
        f(o, t) { bhBase(o); const f = lin(t, 0.4, 2.4, 0, 1); lit(o, 'pagB'); bad(o, 'pool', 'psp', 'frete', 'email');
          o.rows.pool.pool = { walls: 0, psp: 100, fr: 0, em: 0, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'LENTO', ['8 s por chamada', 'bad'], ['prende a conexão', 'bad']);
          o.rows.frete = act('cotação de frete', 'RÁPIDA', ['sem conexão no pool', 'bad']); o.rows.email = act('e-mail', 'RÁPIDO', ['sem conexão no pool', 'bad']);
          o.on.caio = f >= 1 ? 'bad' : 1;
          o.rows.caio = act('Caio · Rio', 'PEDIDO 1058', ['3 canecas azuis · 59,70', 'dim'], [f >= 1 ? 'frete Rio: sem cotação' : '20:20:04 · fechando…', f >= 1 ? 'bad' : 'acc']);
          o.beams = [{ pts: CAB.cpag, on: 1 }, { pts: CAB.ppool, tone: f >= 1 ? 'bad' : '', on: 1 }, { pts: CAB.qpsp, tone: 'bad' }, { pts: CAB.qfr, tone: 'bad' }, { pts: CAB.qem, tone: 'bad' }];
          pk(o, CAB.cpag, f, '1058');
          o.cnt = [['O 1058', f >= 1 ? 'sem frete' : '…', 'bad'], ['RELÓGIO', '20:20:04', 'dim'], ['POOL', '100 de 100', 'bad']];
          o.res = f >= 1 ? [['o frete caiu junto com o PSP-A', 'bad']] : [];
          if (f >= 1) T(o, [605, 232, 40], 'sem conexão', 'bad'); } },
      { id: 'paredes', dur: 8, title: 'Três pools: só o do PSP-A esgota, em 1,67 s', yk: 'BULKHEADS 50 / 30 / 20', act: ['Separar em 50/30/20', 'as paredes'],
        code: ['PSP-A 50 · frete 30 · e-mail 20', '20:20:00 PSP-A a 8 s, de novo', 'em voo no PSP-A = 30 × t', '50 ÷ 30 = 1,67 s: só ele enche', 'frete e e-mail: seguem'],
        story: 'Agora o pool vira três compartimentos, como o casco de um navio: <b>50</b> conexões para o PSP-A, <b>30</b> para a cotação de frete e <b>20</b> para o e-mail. Com o PSP-A a 8 s, o compartimento dele enche mais cedo, em <b>50 ÷ 30 = 1,67 s</b>. Mas a água para na parede: frete e e-mail seguem com as suas conexões.',
        look: 'Duas paredes sobem no pool. Só o compartimento do PSP-A enche; os outros dois continuam com casas livres.',
        key: 'Bulkhead: a falha de um compartimento não alaga os outros.',
        f(o, t) { bhBase(o); o.walls = 1; const s = lin(t, 1.2, 4.5, 0, 1.8), n = Math.min(50, Math.round(30 * s)), full = n >= 50;
          lit(o, 'pagB', 'pool', 'frete', 'email'); if (s > 0) bad(o, 'psp');
          o.rows.pool.pool = { walls: 1, psp: n, fr: 2, em: 2, tone: 'bad' };
          if (s > 0) o.rows.psp = act('PSP-A', 'LENTO', [full ? 'pool de 50 cheio' : '8 s por chamada', 'bad'], ['prende a conexão', 'bad']);
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, tone: s > 0 ? 'bad' : '', on: 1, flow: 1 }, { pts: CAB.qfr, on: 1, flow: 1 }, { pts: CAB.qem, on: 1, flow: 1 }];
          o.cnt = [['PSP-A', `${n} de 50`, full ? 'bad' : 'acc'], ['t', dec(Math.min(s, 1.67), 2) + ' s', 'dim'], ['FRETE E E-MAIL', 'ok', 'dim']];
          o.res = full ? [['1,67 s: só o PSP-A esgota', 'acc']] : [['enchendo…', 'dim']]; } },
      { id: 'caio2', dur: 6, title: 'O 1058 com paredes: frete Rio 12,00', yk: 'O PEDIDO 1058, DE NOVO',
        code: ['20:20:04 pedido 1058 (Caio, Rio)', '  3 canecas azuis    59,70', '  frete Rio          12,00', '  total              71,70', 'cotação: pool do frete (30), ok', 'cobrança: pool do PSP-A cheio'],
        story: 'Às 20:20:04 o 1058 chega de novo. A cotação de frete usa o compartimento dela e volta: frete do Rio, <b>12,00</b>, total <b>71,70</b>. A cobrança ainda esbarra no compartimento cheio do PSP-A, e é aí que entram o <i>circuit breaker</i> e o <i>fallback</i> para o PSP-B (aulas 8 e 9). A parede não cura o PSP-A; ela impede que ele leve o resto junto.',
        look: 'A chamada de frete passa pelo compartimento do meio e volta acesa; a do PSP-A esbarra no compartimento cheio.',
        key: 'A parede não cura a dependência: ela segura o raio.',
        f(o, t) { bhBase(o); o.walls = 1; const f = lin(t, 0.4, 2.4, 0, 1), done = f >= 1;
          lit(o, 'pagB', 'pool', 'frete', 'email'); bad(o, 'psp'); o.on.caio = done ? 1 : 1;
          o.rows.pool.pool = { walls: 1, psp: 50, fr: done ? 3 : 2, em: 2, tone: 'bad' };
          o.rows.psp = act('PSP-A', 'LENTO', ['pool de 50 cheio', 'bad'], ['→ breaker e fallback', 'acc']);
          o.rows.frete = act('cotação de frete', 'POOL DE 30', [done ? 'Rio: 12,00' : 'responde', 'acc']);
          o.rows.caio = act('Caio · Rio', 'PEDIDO 1058', ['59,70 + frete 12,00', done ? 'acc' : 'dim'], [done ? 'total 71,70' : '20:20:04 · fechando…', 'acc']);
          o.beams = [{ pts: CAB.cpag, on: 1 }, { pts: CAB.ppool, on: 1 }, { pts: CAB.qpsp, tone: 'bad' }, { pts: CAB.qfr, on: 1, flow: 1 }, { pts: CAB.qem, on: 1 }];
          pk(o, CAB.cpag, f, '1058');
          o.cnt = [['O 1058', done ? '71,70' : '…'], ['FRETE RIO', done ? '12,00' : '…', 'dim'], ['PSP-A', '50 de 50', 'bad']];
          o.res = done ? [['frete cotado; a cobrança vai ao breaker', 'acc']] : [];
          if (done) T(o, [705, 195, 44], 'frete Rio 12,00', 'acc'); } },
      { id: 'pequeno', dur: 7, title: 'E se der errado: o bulkhead pequeno demais', yk: 'A PAREDE CUSTA CAPACIDADE', act: ['Pico de 40 cotações', 'no pool de 30'],
        code: ['pool do frete: 30 conexões', 'pico de cotações: 40 em voo', '40 − 30 = 10 sem conexão', 'o e-mail tem casas livres, mas', '  a parede não empresta', 'mesmo banco atrás: a parede é furada'],
        story: 'A parede custa capacidade: o compartimento de 30 conexões do frete não pega emprestadas as casas livres dos outros. Num pico de <b>40 cotações em voo</b>, <b>10</b> ficam sem conexão: tráfego legítimo recusado, com a loja saudável. Há outro jeito de a parede falhar: dois pools separados que dependem do <b>mesmo</b> banco têm o raio do banco.',
        look: 'O compartimento do frete enche e 10 cotações sobram, em vermelho, do lado de fora.',
        key: '50/30/20 não têm a flexibilidade de 100 juntos.',
        f(o, t) { bhBase(o); o.walls = 1; const n = Math.round(lin(t, 0.5, 4, 0, 40)), out = Math.max(0, n - 30);
          lit(o, 'pagB', 'psp', 'email'); o.on.pool = out ? 'bad' : 1; o.on.frete = out ? 'bad' : 1;
          o.rows.pool.pool = { walls: 1, psp: 5, fr: Math.min(30, n), em: 2, tone: 'acc', frTone: out ? 'bad' : '' };
          o.rows.frete = act('cotação de frete', 'POOL DE 30', [`${n} em voo`, out ? 'bad' : 'acc'], [out ? `${out} sem conexão` : 'cabe', out ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.cpag }, { pts: CAB.ppool, on: 1, flow: 1 }, { pts: CAB.qpsp, on: 1 }, { pts: CAB.qfr, on: 1, flow: 1, tone: out ? 'bad' : '' }, { pts: CAB.qem, on: 1 }];
          if (out) o.piles.push({ p: [522, 395, PL + 2], v: out, f: out / 10 });
          o.cnt = [['SEM CONEXÃO', String(out), out ? 'bad' : 'dim'], ['COTAÇÕES EM VOO', String(n), 'dim'], ['POOL DO FRETE', '30', 'dim']];
          o.res = out ? [['tráfego legítimo recusado', 'bad']] : [['cabe…', 'dim']];
          if (out >= 10) T(o, [522, 446, 30], '10 cotações recusadas', 'bad'); } },
    ],
    shuffle: [
      { id: 'todas', dur: 8, title: 'Sem isolamento: a requisição ruim passa por todas', yk: 'TODOS USAM AS 10', act: ['Ligar o mkt-01', 'a requisição ruim'],
        code: ['catalogo: 10 réplicas de 100 req/s', 'todos os clientes usam as 10', 'o mkt-01 manda a requisição que trava', 'ela vai passando de réplica em réplica', '→ as 10 travam: 100% fora'],
        story: 'O <code>catalogo</code> tem 10 réplicas (<code>catalogo-1</code> a <code>catalogo-10</code>, 100 req/s cada). O <code>mkt-01</code> manda uma requisição que trava a réplica que a recebe (módulo 16). Se todo cliente usa as 10, a requisição ruim vai passando de uma em uma e derruba o serviço inteiro: o raio é a loja toda.',
        look: 'As réplicas ficam vermelhas uma a uma, e os cinco clientes perdem o catalogo.',
        key: 'Sem isolamento, o cliente barulhento alcança todos.',
        f(o, t) { const n = Math.floor(lin(t, 0.6, 5.6, 0, 10.99)), all = n >= 10, st = {}; for (let i = 1; i <= n; i++) st[i] = 'bad';
          const kt = {}; if (all) CLI.forEach((_, k) => kt[k] = 'bad'); shBase(o, st, kt); if (n) bad(o, 'k0');
          o.beams = [{ pts: P3([[CC(1), 272], [KC(4), 272]]), on: !all, tone: all ? 'bad' : '' }, ...CLI.map((_, k) => ({ pts: P3([[KC(k), 330], [KC(k), 272]]), on: !all, tone: k === 0 && n ? 'bad' : all ? 'bad' : '', flow: k === 0 && n && !all })),
            ...catBranches(272, i => i <= n ? { tone: 'bad' } : { on: 1 })];
          o.cnt = [['TRAVADAS', `${Math.min(n, 10)} de 10`, n ? 'bad' : 'dim'], ['CLIENTES FORA', all ? '5 de 5' : '0 de 5', all ? 'bad' : 'dim'], ['RAIO', all ? '100%' : '…', all ? 'bad' : 'dim']];
          o.res = all ? [['o serviço inteiro caiu', 'bad']] : n ? [['travando…', 'bad']] : []; } },
      { id: 'grupos', dur: 6, title: 'Grupos fixos de 2: 20% fora', yk: '5 GRUPOS FIXOS (MÓDULO 16)',
        code: ['grupos: (1,2) (3,4) (5,6) (7,8) (9,10)', 'grupo = murmur3(cliente_id) mod 5', 'mkt-01 e bia-31: grupo (3,4)', 'travam a 3 e a 4', '1 grupo de 5 = 20% dos clientes'],
        story: 'A primeira parede: 5 grupos fixos de 2 réplicas, e o grupo do cliente sai de <code>murmur3(cliente_id) mod 5</code> (módulo 16). O <code>mkt-01</code> cai no grupo (3, 4), junto com a <code>bia-31</code>. As duas réplicas travam e <b>20%</b> dos clientes (1 grupo de 5) ficam sem serviço, a Bia incluída.',
        look: 'Só as réplicas 3 e 4 ficam vermelhas, e a Bia, que divide o grupo com o mkt-01, também.',
        key: 'Grupos fixos: o raio cai para 1/5, mas o vizinho de grupo cai junto.',
        f(o, t) { const d = t > 1; shBase(o, d ? { 3: 'bad', 4: 'bad' } : {}, d ? { 0: 'bad', 2: 'bad' } : {});
          ['k1', 'k3', 'k4'].forEach(k => { o.rows[k].rows = [['outro grupo', 'dim']]; });
          o.rows.k0.meta = 'GRUPO (3,4)'; o.rows.k2.meta = 'GRUPO (3,4)';
          o.beams = [{ pts: GRP(0, 3, 0), on: 1, tone: d ? 'bad' : '', flow: 1 }, { pts: GRP(0, 4, 1), on: 1, tone: d ? 'bad' : '' }, { pts: GRP(2, 3, 0), on: !d, tone: d ? 'bad' : '' }, { pts: GRP(2, 4, 1), on: !d, tone: d ? 'bad' : '' }].map(b => ({ ...b, thin: 1 }));
          o.cnt = [['CLIENTES FORA', d ? '20%' : '…', 'bad'], ['GRUPOS', '5', 'dim'], ['TRAVADAS', d ? '2 de 10' : '0', 'dim']];
          o.res = d ? [['20% fora, a Bia junto', 'bad']] : []; } },
      { id: 'pares', dur: 6, title: 'Shuffle sharding: 2 de 10, 45 pares', yk: 'RENDEZVOUS (MÓDULO 16)', act: ['Dar um par a cada um', 'C(10, 2) = 45'],
        code: ['C(10, 2) = 45 pares', 'mkt-01   {8, 9}', 'lena-77  {6, 8}', 'bia-31   {4, 6}', 'caio-58  {1, 4}', 'davi-12  {1, 9}'],
        story: 'Agora cada cliente recebe o seu par, por <i>rendezvous</i>: as 2 réplicas de menor <code>murmur3(cliente_id + ":catalogo-" + r)</code>. Há <b>C(10, 2) = 45</b> pares. O <code>mkt-01</code> fica com {8, 9}, a <code>lena-77</code> com {6, 8}, a <code>bia-31</code> com {4, 6}, o <code>caio-58</code> com {1, 4} e o <code>davi-12</code> com {1, 9}. Os pares se cruzam, mas quase nunca são iguais.',
        look: 'Cada cliente tem dois cabos, um para cada réplica do seu par.',
        key: 'Cada cliente usa o seu par, e o par do vizinho quase nunca é o mesmo.',
        f(o) { shBase(o); CLI.forEach((_, k) => lit(o, 'k' + k));
          o.beams = CLI.flatMap((_, k) => [{ pts: SHC(k, 0), on: 1, thin: 1 }, { pts: SHC(k, 1), on: 1, thin: 1 }]);
          o.cnt = [['PARES', '45'], ['POR CLIENTE', '2 de 10', 'dim'], ['MESMO PAR', '1 ÷ 45', 'dim']];
          o.res = [['cada um com o seu par', 'acc']]; } },
      { id: 'trava', dur: 7, title: 'O mkt-01 trava 8 e 9: só o par dele cai', yk: 'O RAIO DO PAR', act: ['Ligar o mkt-01', 'de novo'],
        code: ['travam: catalogo-8 e catalogo-9', 'bia-31 {4,6} e caio-58 {1,4}: nem notam', 'lena-77 {6,8}: perde a 8, segue na 6', 'davi-12 {1,9}: perde a 9, segue na 1', 'mesmo par do mkt-01: 1 ÷ 45 = 2,2%'],
        story: 'O <code>mkt-01</code> manda a requisição ruim e trava as <b>suas</b> duas réplicas, 8 e 9. A Bia e o Caio nem notam. A Lena (tem a 8) e o Davi (tem a 9) perdem uma das duas e seguem na outra. Só quem tem exatamente o par {8, 9} fica sem serviço: 1 ÷ 45 = <b>2,2%</b> dos clientes, contra 20% dos grupos fixos. O <i>shuffle sharding</i> corta clientes e corta recursos: é o que liga o sharding ao <i>bulkhead</i>.',
        look: 'Só as réplicas 8 e 9 ficam vermelhas; a Lena e o Davi perdem um cabo cada e o outro segue aceso.',
        key: 'Shuffle sharding: o barulhento só derruba quem tem o mesmo par.',
        f(o, t) { const d = t > 1; shBase(o, d ? { 8: 'bad', 9: 'bad' } : {}, d ? { 0: 'bad', 1: 'one', 4: 'one' } : {});
          if (!d) CLI.forEach((_, k) => lit(o, 'k' + k)); else lit(o, 'k2', 'k3');
          const isBad = r => d && (r === 8 || r === 9);
          o.beams = CLI.flatMap(([, pr], k) => pr.map((r, j) => ({ pts: SHC(k, j), on: !isBad(r), tone: isBad(r) ? 'bad' : '', flow: k === 0 && j === 0, thin: 1 })));
          o.cnt = [['MESMO PAR', '2,2%'], ['GRUPOS FIXOS', '20%', 'dim'], ['TRAVADAS', d ? '2 de 10' : '0', d ? 'bad' : 'dim']];
          o.res = d ? [['só cai quem tem {8, 9}', 'acc']] : []; } },
      { id: 'sem-retry', dur: 6, title: 'E se der errado: o cliente não tenta a outra réplica', yk: 'O QUE O SHUFFLE EXIGE',
        code: ['o cliente precisa tentar a outra', '  réplica do par (o retry da AWS)', 'sem isso: lena-77 e davi-12', '  perdem metade das chamadas', 'dividem ao menos 1 réplica: 37,8%'],
        story: 'O <i>shuffle sharding</i> só funciona se o <b>cliente tentar a outra réplica</b> do par (é o retry que a AWS exige do cliente). Se o app da Lena manda para a 8 e desiste, ela perde <b>metade</b> das chamadas, e o Davi também, com a 9. Com 10 réplicas, <b>37,8%</b> dos clientes dividem ao menos uma réplica com o <code>mkt-01</code> (1 − 28/45), e sem o retry todos eles sentem.',
        look: 'A Lena e o Davi ficam vermelhos: metade das chamadas deles bate numa réplica travada e não volta.',
        key: 'Sem o retry do cliente, o par vira meio serviço.',
        f(o) { shBase(o, { 8: 'bad', 9: 'bad' }, { 0: 'bad', 1: 'half', 4: 'half' }); lit(o, 'k2', 'k3');
          const isBad = r => r === 8 || r === 9;
          o.beams = CLI.flatMap(([, pr], k) => pr.map((r, j) => ({ pts: SHC(k, j), on: !isBad(r), tone: isBad(r) ? 'bad' : '', flow: (k === 1 || k === 4) && isBad(r), thin: 1 })));
          o.cnt = [['LENA E DAVI', '50% perdido', 'bad'], ['DIVIDEM 1 RÉPLICA', '37,8%', 'dim'], ['MESMO PAR', '2,2%', 'dim']];
          o.res = [['sem retry: meio serviço', 'bad']];
          T(o, TF(KC(1)), 'perde metade', 'bad'); T(o, TF(KC(4)), 'perde metade', 'bad'); } },
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
      if (v === 2 || v === 3) { x.fillStyle = light ? '#f6f6f5' : '#141516'; x.textAlign = 'center'; fitFont(x, u, v === 2 ? 'frete' : 'e-mail', 7, w - 2); x.fillText(v === 2 ? 'frete' : 'e-mail', u(X + w / 2), u(Y + h / 2 + 0.3)); x.textAlign = 'left'; }
    }
    const ly = GY + GH + 14; x.textAlign = 'center';
    if (p.walls) { [[0, 5, 'PSP-A · 50'], [5, 3, 'frete · 30'], [8, 2, 'e-mail · 20']].forEach(([c0, n, lab]) => { x.fillStyle = toneC('hi'); fitFont(x, u, lab, 11, n * COLW - 3); x.fillText(lab, u(GX + (c0 + n / 2) * COLW), u(ly)); });
      x.fillStyle = accC(); [5, 8].forEach(c => x.fillRect(u(GX + c * COLW - 0.9), u(GY - 3), u(1.8), u(GH + 6))); }
    else { x.fillStyle = toneC('hi'); fitFont(x, u, 'pool único · 100 conexões', 12, W_ - 12); x.fillText('pool único · 100 conexões', u(W_ / 2), u(ly)); }
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
    blast: () => `<table class="h3-sum"><tr><th>se parar…</th><th>raio</th></tr><tr${on_(step === 1)}><td>recomendacoes</td><td>uma seção da tela</td></tr><tr${on_(step === 3)}><td>pagamentos</td><td>todo o checkout (a receita)</td></tr><tr${on_(step === 2)}><td>catalogo (1 de 10)</td><td>10% da capacidade</td></tr><tr${on_(step === 5)}><td>shard-2</td><td>1/3 dos clientes, 60% das linhas</td></tr><tr><td>primário de SP</td><td>toda a escrita por 35 s (cenário Dados)</td></tr></table><li>1/N com carga igual: N = 3 → <b>33,3%</b> · 10 → 10% · 100 → 1% · 1.000 → 0,1%</li><li>Com o <code>mkt-01</code> a 40% das linhas: <code>shard-2</code> = 0,4 + 0,6 ÷ 3 = <b>60%</b>; <code>shard-0</code> e <code>shard-1</code> = 20% cada</li><li>Dependência escondida: o mesmo <code>catalogo</code> atende o <code>bff-app</code> e o <code>bff-web</code> (módulo 9)</li><li>O raio compartilhado: o pool único do <code>pagamentos</code> põe PSP-A, frete e e-mail no mesmo raio (cenário Bulkhead)</li>`,
    healthcheck: () => `<table class="h3-sum"><tr><th>onde</th><th>por réplica</th><th>× 15 s</th></tr><tr${on_(step === 1)}><td>pagamentos (2 réplicas, 30/s)</td><td>15/s</td><td>225 falhas</td></tr><tr${on_(step === 3)}><td>catalogo (10 réplicas, 640 req/s)</td><td>64 req/s</td><td>960 perdidas</td></tr></table><li>Healthcheck do módulo 7: intervalo de <b>5 s</b>, <b>3</b> falhas seguidas = <b>15 s</b></li><li><i>Panic threshold</i> do Envoy: "The default panic threshold is 50%"; abaixo disso ele balanceia entre todas as réplicas</li><table class="h3-sum"><tr><th>o healthcheck confere</th><th>tira do pool?</th></tr><tr><td>processo responde</td><td>sim</td></tr><tr><td>fila interna e memória</td><td>sim</td></tr><tr${on_(step >= 4)}><td>dependência (banco, PSP)</td><td>não: breaker e fallback</td></tr></table>`,
    dados: () => `<table class="h3-sum"><tr><th>medida</th><th>valor</th></tr><tr${on_(step === 2 || step === 3)}><td>RTO da promoção</td><td>35 s (módulo 17)</td></tr><tr${on_(step === 3)}><td>RPO (Rio · Recife)</td><td>9 · 24 pedidos a 30/s</td></tr><tr${on_(step === 2)}><td>escritas sem primário</td><td>30 × 35 = 1.050</td></tr><tr${on_(step === 1)}><td>catálogo na origem</td><td>128 req/s (80% de acerto)</td></tr><tr${on_(step === 5)}><td>catálogo com o cache frio</td><td>640 req/s</td></tr></table><li><code>stale-if-error</code> e <code>stale-while-revalidate</code>: RFC 5861</li><li>O preço de 79,90 pode chegar velho na leitura; o comando do pedido revalida o preço vigente (módulo 18)</li><li>TTL do catálogo: 60 s (módulo 5)</li>`,
    bulkhead: () => `<table class="h3-sum"><tr><th>arranjo</th><th>PSP-A esgota em</th><th>frete e e-mail</th></tr><tr${on_(step >= 1 && step <= 2)}><td>pool único de 100</td><td>100 ÷ 30 = 3,33 s</td><td>param juntos</td></tr><tr${on_(step >= 3 && step <= 4)}><td>bulkheads 50 / 30 / 20</td><td>50 ÷ 30 = 1,67 s</td><td>seguem</td></tr></table><li>Lei de Little (em voo = taxa × tempo), a 30 pedidos/s: 180 ms → <b>5,4</b>; 1 s → 30; 8 s → <b>240</b></li><li>O 1058 (Caio, Rio, 20:20:04): 3 canecas azuis 59,70 + frete Rio 12,00 = <b>71,70</b>, cartão</li><li>A cobrança do 1058 vai ao PSP-B pelo <i>breaker</i> e pelo <i>fallback</i> (aulas 8 e 9; figura das chamadas)</li><li>Outros eixos de parede: um pool por dependência, por prioridade e por cliente (o <code>mkt-01</code> com a sua fila)</li>`,
    shuffle: () => `<table class="h3-sum"><tr><th>cliente</th><th>par</th><th>com 8 e 9 travadas</th></tr><tr${on_(step >= 3)}><td>mkt-01</td><td>{8, 9}</td><td>sem catalogo</td></tr><tr><td>lena-77</td><td>{6, 8}</td><td>segue na 6</td></tr><tr><td>bia-31</td><td>{4, 6}</td><td>nem nota</td></tr><tr><td>caio-58</td><td>{1, 4}</td><td>nem nota</td></tr><tr><td>davi-12</td><td>{1, 9}</td><td>segue na 1</td></tr></table><li>10.000 clientes simulados no módulo 16: <b>240 (2,4%)</b> com o mesmo par do <code>mkt-01</code> (esperado 1 ÷ 45 = 2,2%); <b>3.868 (38,7%)</b> dividem ao menos uma réplica (esperado 37,8%); grupos fixos: 2.007 (20%)</li><li>Com 4 de 10: C(10, 4) = 210 conjuntos, 0,5% com o mesmo conjunto, mas 93,2% dividem ao menos uma réplica</li><li>Sharding corta dados e clientes; <i>bulkhead</i> corta recursos; o <i>shuffle sharding</i> corta os dois</li>`,
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
  function readout() { if (active !== 'isolamento') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
