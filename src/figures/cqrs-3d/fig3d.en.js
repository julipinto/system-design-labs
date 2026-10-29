// Figura 3D (iso-glow): dois modelos, uma tela. À esquerda o lado do COMANDO (o serviço pedidos na frente, o PostgreSQL loja
// atrás, com as tabelas pedidos e itens_pedido); à direita o lado da CONSULTA (o meus-pedidos na frente, o documento da Lena atrás,
// uma ficha com os pedidos em linhas). No meio, a esteira de eventos (o e-1801 de 336 B). Na frente, o bff-app e o celular da Lena,
// em Recife. Atrás, o mostrador (relógio em ms, o SQL ou a conta do passo e o resultado).
// Os mesmos lugares mudam de papel em cada cenário: na View o documento vira a view materializada; na Réplica, o banco vira o
// primário de SP e o lado direito, as réplicas do Rio e de Recife; no Distribuído aparecem pagamentos, entregas e catalogo.
// Cenários (botões e ?mode=dois-modelos|view|replica|eventual|documento|distribuido; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/cqrs-brief.md) e as aulas 1–7 (pedido 1056 = 114,80 às 20:12:00.000;
// commit .004; ~74 ms até o modelo de leitura; relatório ~235 ms × view 0,021 ms; REFRESH 2.285 ms × CONCURRENTLY 12 ms;
// réplica cancelada aos 3,16 s; documento 1.787 B, 253 B o 1056; 0,999⁴ = 99,6006%).
FIGS3D.push({ id: 'cqrs', name: 'CQRS', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const clock = ms => { const v = Math.max(0, Math.round(ms)), s = Math.floor(v / 1000); return '20:12:' + String(s).padStart(2, '0') + '.' + String(v % 1000).padStart(3, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['dois-modelos', 'view', 'replica', 'eventual', 'documento', 'distribuido'];
  const SCNAME = { 'dois-modelos': 'Two models', view: 'View', replica: 'Replica', eventual: 'Eventual', documento: 'Document', distribuido: 'Distributed' };
  const SCFULL = { 'dois-modelos': 'Command and query', view: 'The materialized view', replica: 'The read replica',
    eventual: 'Eventual consistency', documento: "Lena's document", distribuido: 'Several services, one document' };
  const AULA = { 'dois-modelos': 'aula-1-introducao', view: 'aula-3-views-materializadas', replica: 'aula-4-read-replicas',
    eventual: 'aula-5-consistencia-eventual', documento: 'aula-6-combinacao-de-sql-e-nosql', distribuido: 'aula-7-modelos-distribuidos' };
  let clk = 0, sc = 'dois-modelos', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cqrs3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17, ZT = 32;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0)
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 20, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  block('db', 40, 40, 230, 190, 30); block('cmd', 40, 262, 230, 120, 24);
  block('doc', 634, 40, 230, 190, 30); block('qry', 634, 262, 230, 120, 24);
  block('bus', 310, 90, 284, 92, 12, SMALL); block('bff', 310, 286, 284, 66, 16, SMALL); block('lena', 392, 372, 120, 68, 12, SMALL);
  block('pag', 40, 40, 230, 60, 16, SMALL); block('ent', 40, 106, 230, 60, 16, SMALL); block('cat', 40, 172, 230, 58, 16, SMALL);
  const NAMES = Object.keys(B);
  // o atraso acumulado (Black Friday): cartões empilhados na frente da esteira
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz: comandos, eventos e leituras
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
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
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
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

  // ── cabos (pontas nas bordas dos blocos) e caminhos dos pontos de luz (passam por cima dos blocos baixos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const rev = pts => pts.slice().reverse();
  const CAB = {
    lb: P3([[452, 372], [452, 352]]), bc: P3([[310, 322], [270, 322]]), bq: P3([[594, 322], [634, 322]]),
    cdb: P3([[155, 262], [155, 230]]), qdoc: P3([[749, 262], [749, 230]]),
    ev1: P3([[270, 136], [310, 136]]), ev2: P3([[594, 136], [634, 136]]),
    // réplica: SP → Rio (atrás) e SP → Recife (na frente); relatório → Recife; Lena → Recife
    rio: P3([[270, 136], [634, 136]]), rec: P3([[270, 206], [614, 206], [614, 300], [634, 300]]), lrec: P3([[512, 406], [749, 406], [749, 382]]),
    // view: relatório (bff) → banco; banco → view (mesmo banco)
    rdb: P3([[310, 300], [290, 300], [290, 206], [270, 206]]),
    // distribuído: composição (bff chama os 4) e eventos (3 fontes → esteira)
    // composição: um tronco sai do bff-app e sobe entre os serviços; cada serviço tem o seu ramo (é o ramo que fica vermelho)
    trunk: P3([[310, 300], [290, 300], [290, 70]]), bpag: P3([[290, 70], [270, 70]]), bent: P3([[290, 136], [270, 136]]), bcat: P3([[290, 201], [270, 201]]),
    epag: P3([[270, 62], [296, 62], [296, 108], [310, 108]]), eent: P3([[270, 142], [310, 142]]), ecmd: P3([[270, 276], [284, 276], [284, 168], [310, 168]]),
  };
  const VIA = br => [[310, 300, Z], [290, 300, Z], [290, br[0][1], Z], ...br.slice(1)];
  const ONBUS = y => [[310, y, 26], [594, y, 26], [634, y, Z]];
  const WAY = {
    cmd: P3([[452, 406, ZT], [452, 322, ZT], [310, 322, ZT], [270, 322]]),           // Lena → bff-app → pedidos
    qry: P3([[452, 406, ZT], [452, 322, ZT], [594, 322, ZT], [634, 322]]),           // Lena → bff-app → meus-pedidos
    ev: P3([[270, 136], ...ONBUS(136)]),                                              // banco → esteira → documento
    qdoc: CAB.qdoc, cdb: CAB.cdb,
  };
  // um ponto de luz andando num caminho: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const OLD = ['1055 · 34.90', '1054', '1051', '1048', '1047', '1044', '1042'];
  // o documento meus_pedidos:lena-77: resumo + pedidos, o mais novo primeiro
  const DOC = (top, sum, tone = 'acc') => { const d = act('meus_pedidos:lena-77', '', sum, ...(top ? [[top, tone]] : []), ...OLD.slice(0, top ? 7 : 7).map(r => [r, 'dim']));
    d.fs = 12.5; d.lh = 15.5; d.y0 = 39; return d; };
  const DOC7 = () => DOC(null, ['7 orders · v7', 'dim']), DOC8 = () => DOC('1056 · criado · 114.80', ['8 orders · 1,787 B · v8', 'acc']);
  const TBL = (...r) => { const d = act('PostgreSQL loja', 'WRITE', ...r); d.fs = 13.5; d.lh = 19; return d; };
  const DB0 = () => TBL(['pedidos', 'tbl'], ['1055 · lena-77 · 34.90', 'dim'], ['itens_pedido', 'tbl'], ['1055 · 7 · 1 × 19.90', 'dim']);
  const DB1 = () => TBL(['pedidos', 'tbl'], ['1056 · lena-77 · 114.80', 'acc'], ['1055 · lena-77 · 34.90', 'dim'], ['itens_pedido', 'tbl'], ['1056 · 42 · 1 × 79.90', 'acc'], ['1056 · 7 · 1 × 19.90', 'acc']);
  const EV = (...st) => ['e-1801', 'e-1802', 'e-1803', 'e-1804', 'e-1805'].map((l, i) => [l, st[i] || 'none']);
  function base() {
    const o = { show: { db: 1, cmd: 1, doc: 1, qry: 1, bus: 1, bff: 1, lena: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    o.rows.db = DB0();
    o.rows.cmd = act('pedidos', 'COMMAND', ['CriarPedido', 'hi'], ['rules + transaction', 'dim'], ['stock: cat 20 · mug 36', 'dim']);
    o.rows.doc = DOC7();
    o.rows.qry = act('meus-pedidos', 'QUERY', ['MeusPedidos(cliente)', 'hi'], ['rules: none', 'dim'], ['reads the document by key', 'dim']);
    o.rows.bus = act('eventos', 'CONVEYOR'); o.rows.bus.tape = EV(); o.rows.bus.tapeLabel = 'KAFKA';
    o.rows.bff = act('bff-app', 'BFF', ['POST /pedidos → pedidos', 'dim'], ['GET /meus-pedidos → meus-pedidos', 'dim']);
    o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], ['1055 · 34.90', 'hi']);
    o.rows.pag = act('pagamentos', 'SERVICE', ['PedidoPago · card', 'dim']);
    o.rows.ent = act('entregas', 'SERVICE', ['PedidoEnviado · tracking', 'dim']);
    o.rows.cat = act('catalogo', 'SERVICE', ['name and price today', 'dim']);
    o.beams.push({ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1 }, { pts: CAB.ev2 });
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const hide = (o, ...nm) => nm.forEach(n => o.show[n] = 0);
  const showX = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  // cenários que trocam a topologia: limpa os cabos padrão e põe os seus
  const only = (o, ...b) => { o.beams = b; };

  // ── cenário Réplica: os mesmos lugares com outros papéis ──
  const REP = (st = {}) => ({
    db: (() => { const d = act('pg-sp', 'PRIMARY', ['SP · reads and writes', 'dim'], ['same schema: 5 tables', 'dim'], ...(st.sp || [])); return d; })(),
    doc: (() => { const d = act('pg-rio', 'REPLICA', ['same schema: 5 tables', 'dim'], ['RTT to SP: 10 ms', 'dim'], ...(st.rio || [])); return d; })(),
    qry: act('pg-recife', 'REPLICA', ...(st.rec || [['same schema: 5 tables', 'dim'], ['RTT to SP: 80 ms', 'dim']])),
  });
  function replicaBase(o, st) {
    hide(o, 'bus'); const r = REP(st); o.rows.db = r.db; o.rows.doc = r.doc; o.rows.qry = r.qry;
    o.rows.cmd = act('pedidos', 'WRITES TO SP', ['INSERT only on the primary', 'dim']);
    o.rows.bff = act('23:00 report', 'LONG QUERY', ['~40 s on the 50 million', 'dim'], ['(linear estimate)', 'dim']);
    o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], ['reads from Recife', 'hi']);
    only(o, { pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec }, { pts: CAB.bq }, { pts: CAB.lrec });
    o.rtt = 1;
  }
  // ── cenário View: o documento vira a view, o meus-pedidos vira o leitor ──
  const MV = (...r) => { const d = act('faturamento_cidade_produto', '', ['VIEW · same loja database · 5 rows', 'dim'], ...r); d.fs = 13.5; d.lh = 19; return d; };
  const MVROW = (p, u, tn = 'hi') => [`Recife · caneca azul · ${p}`, tn];
  function viewBase(o) {
    hide(o, 'bus', 'lena');
    o.rows.db = TBL(['pedidos', 'tbl'], ['300,008 rows', 'dim'], ['itens_pedido', 'tbl'], ['600,009 rows', 'dim'], ['produtos · 3 rows', 'dim']);
    o.rows.doc = MV(MVROW('100003'), ['unidades 150004', 'dim'], ['+ 4 rows (city × product)', 'dim']);
    o.rows.qry = act('reader', 'SESSION 2', ['SELECT … FROM', 'dim'], ['faturamento_cidade_produto', 'dim']);
    o.rows.cmd = act('session 1', 'REFRESH', ['still idle', 'dim']);
    o.rows.bff = act('23:00 report', 'QUERY', ['revenue by city and product', 'dim'], ['pedidos × itens × produtos', 'dim']);
    only(o, { pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.qdoc }, { pts: CAB.rdb });
  }
  // ── cenário Distribuído: pagamentos, entregas e catalogo no lugar do banco ──
  function distBase(o) {
    hide(o, 'db'); showX(o, 'pag', 'ent', 'cat');
    o.rows.cmd = act('pedidos', 'SERVICE', ['PedidoCriado · items', 'dim'], ['name and price at the time', 'dim']);
    o.rows.bus = act('eventos', '3 TOPICS'); o.rows.bus.tape = [['pedidos', 'none'], ['pagamentos', 'none'], ['entregas', 'none']]; o.rows.bus.tapeLabel = 'KAFKA';
    only(o, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.qdoc }, { pts: CAB.lb }, { pts: CAB.trunk }, { pts: CAB.bpag }, { pts: CAB.bent }, { pts: CAB.bcat });
  }
  // a composição chamando: cada serviço recebe um ponto de luz pelo tronco; o que está fora fica vermelho
  function compose(o, down) {
    o.beams.forEach(b => { if ([CAB.bc, CAB.trunk, CAB.bent, CAB.bcat, CAB.lb].includes(b.pts)) b.on = true;
      if (b.pts === CAB.bpag) { b.on = true; b.tone = down ? 'bad' : ''; } });
    const f = (clk * 0.45) % 1;
    pk(o, P3([[452, 352], [452, 320], [310, 320], [270, 320]]), f); [CAB.bent, CAB.bcat, ...(down ? [] : [CAB.bpag])].forEach(br => pk(o, VIA(br), f));
    if (down) pk(o, VIA(CAB.bpag), Math.min(f, 0.85), '', 'bad');
  }
  const DD = (...r) => { const d = act('meus_pedidos:lena-77', '', ...r); d.fs = 13.5; d.lh = 19; return d; };

  // ── o que se vê em cada passo ──
  const STEPS = {
    'dois-modelos': [
      { id: 'lados', dur: 5, title: 'Two models, one screen', yk: 'THE TWO SIDES', act: ['Place 1056', 'CriarPedido'],
        code: ['command   CriarPedido → pedidos', '          PostgreSQL loja (normalized)', 'query     MeusPedidos → meus-pedidos', '          meus_pedidos:lena-77 (document)', 'in between: the event conveyor'],
        story: 'On the left, the <b>command</b> side: the <code>pedidos</code> service and the PostgreSQL <code>loja</code>, with the normalized tables <code>pedidos</code> and <code>itens_pedido</code>. On the right, the <b>query</b> side: the new <code>meus-pedidos</code> service and Lena\'s document, shaped like the screen. In between, the event conveyor carries whatever changes from one side to the other. In front, the <code>bff-app</code> and Lena\'s phone, in Recife.',
        look: 'Two paths leave the bff-app: the left one writes, the right one reads, and each has its own storage.',
        key: 'CQRS separates whoever changes the state from whoever reads it, into different models.',
        f(o) { lit(o, 'cmd', 'qry');
          o.cnt = [['MODELS', '2'], ['COMMAND', 'pedidos', 'dim'], ['QUERY', 'meus-pedidos', 'dim']];
          o.res = [['one model writes, the other reads', 'acc']];
          T(o, [155, 446, 24], 'command', 'dim'); T(o, [749, 446, 24], 'query', 'dim'); } },
      { id: 'comando', dur: 5, title: 'CriarPedido: 1056 enters through the command side', yk: 'THE COMMAND, AT 20:12:00.000',
        code: ['POST /pedidos   (bff-app → pedidos)', 'CriarPedido(cliente = lena-77)', '  1 plush cat         79.90', '  1 blue mug          19.90', '  Recife shipping     15.00  = 114.80'],
        story: 'At <b>20:12:00.000</b> on Black Friday Lena closes the purchase: 1 plush cat (79.90), 1 blue mug (19.90) and Recife shipping (15.00), <b>114.80</b>. The <code>bff-app</code> sends the <code>CriarPedido</code> command to the <code>pedidos</code> service. It is an order in the imperative: it changes state and can be refused by a rule.',
        look: 'The light dot leaves the phone, goes through the bff-app and enters pedidos, along the left path.',
        key: 'A command is imperative, changes state and can fail on a rule.',
        f(o, t) { const f = lin(t, 0.4, 3.2, 0, 1); lit(o, 'lena', 'bff'); if (f >= 1) lit(o, 'cmd');
          o.rows.lena = act('Lena', 'Recife', ['buying…', 'acc'], ['total 114.80', 'hi']);
          o.beams = [{ pts: CAB.lb, on: f < 1 }, { pts: CAB.bc, on: f < 1 }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, WAY.cmd, f, 'CriarPedido 1056');
          o.cnt = [['CLOCK', clock(0)], ['TOTAL', '114.80', 'dim'], ['ITEMS', '2 + shipping', 'dim']];
          o.res = f >= 1 ? [['the command reached pedidos', 'acc']] : []; } },
      { id: 'valida', dur: 7, title: 'The validations before the INSERT', yk: 'WHAT CriarPedido CHECKS',
        code: ['1. customer lena-77 exists', '2. product 42 active', '3. current price 79.90 (module 5)', '4. stock: 20 cats, 36 mugs', '5. Recife shipping 15.00', 'only then: INSERT'],
        story: 'The command is rich in rules. Before writing, <code>CriarPedido</code> checks the customer (<code>lena-77</code> exists), product 42 (active), the <b>current price</b> (79.90, the value from module 5), the stock (20 cats and 36 mugs) and Recife shipping (15.00). If a rule fails, the command is refused and nothing is written. The one who decides is the <code>Pedido</code> aggregate.',
        look: 'The validations light up one by one in the pedidos block. The query side stays dark: there are no rules there.',
        key: 'The rule lives only in the command.',
        f(o, t) { const n = Math.floor(lin(t, 0.4, 5.4, 0, 5.99)); lit(o, 'cmd');
          const V = ['customer lena-77 ✓', 'product 42 active ✓', 'price 79.90 ✓', 'stock 20 · 36 ✓', 'Recife shipping 15.00 ✓'];
          o.rows.cmd = act('pedidos', 'COMMAND', ...V.map((v, i) => i < n ? [v, 'acc'] : null)); o.rows.cmd.fs = 14; o.rows.cmd.lh = 17; o.rows.cmd.y0 = 39;
          if (!n) o.rows.cmd.rows = [['validating…', 'dim']];
          o.cnt = [['VALIDATIONS', `${n} of 5`], ['IN THE COMMAND', 'rules', 'dim'], ['IN THE QUERY', 'none', 'dim']];
          o.res = n >= 5 ? [['all good: can write', 'acc']] : [['checking…', 'dim']]; } },
      { id: 'grava', dur: 6, title: 'Writes pedidos and itens_pedido in one transaction', yk: 'IN POSTGRESQL loja',
        code: ['BEGIN;', "INSERT INTO pedidos VALUES (1056, 'lena-77', …);", 'INSERT INTO itens_pedido … (42, 1, 79.90);', 'INSERT INTO itens_pedido … (7, 1, 19.90);', 'COMMIT;   -- 20:12:00.004'],
        story: 'Only then does the command write: <b>1 row</b> in <code>pedidos</code> and <b>2</b> in <code>itens_pedido</code>, in the same transaction (ACID): either both tables receive 1056, or neither does. The <code>COMMIT</code> closes at <b>20:12:00.004</b>. The stock drops to 19 cats and 35 mugs.',
        look: 'The 1056 rows light up in the database\'s two normalized tables: the order lives once, the items in another table.',
        key: 'The write model is normalized and transactional.',
        f(o, t) { const ms = lin(t, 0.4, 3, 0, 4), ok = ms >= 4; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.cmd = act('pedidos', 'COMMAND', ['5 of 5 validations', 'acc'], [ok ? 'COMMIT at .004' : 'writing…', ok ? 'acc' : 'dim'], [ok ? 'stock: cat 19 · mug 35' : 'stock: cat 20 · mug 36', 'dim']);
          o.rows.db = ok ? DB1() : DB0();
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: !ok, flow: !ok }, { pts: CAB.qdoc }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          o.cnt = [['CLOCK', clock(ms)], ['ROWS', ok ? '1 + 2' : '…', 'dim'], ['TRANSACTION', ok ? 'COMMIT' : 'open', 'dim']];
          o.res = ok ? [['1056 written to both tables', 'acc']] : []; } },
      { id: 'evento', dur: 6, title: 'The e-1801 PedidoCriado takes 1056 to the other side', yk: 'THE EVENT (336 B)',
        code: ['{"evento_id":"e-1801",', ' "tipo":"PedidoCriado","pedido_id":1056,', ' "cliente_id":"lena-77","versao":1,', ' "itens":[…gato 7990, caneca 1990],', ' "total_centavos":11480, …}  = 336 bytes'],
        story: 'The query side does not read the command\'s database. It learns about the order through an <b>event</b>: <code>e-1801</code>, <code>PedidoCriado</code>, of <b>336 bytes</b>, with the name and price at the time of each item and the money in cents. The projector receives the event and puts 1056 at the top of Lena\'s document, which moves to <b>version 8</b>.',
        look: 'The light dot leaves the database, runs along the conveyor and enters the document. The card gains a row at the top.',
        key: 'An event carries the change from the write model to the read model.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'db', 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(f > 0 ? (done ? 'ok' : 'recv') : 'none');
          o.rows.doc = done ? DOC8() : DOC7();
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, f, 'e-1801 · 336 B');
          o.cnt = [['EVENT', 'e-1801'], ['SIZE', '336 B', 'dim'], ['DOCUMENT', done ? 'v8' : 'v7', 'dim']];
          o.res = done ? [['1056 is in both models', 'acc']] : []; } },
      { id: 'consulta', dur: 6, title: 'The screen reads from the other side: one route, one document', yk: 'THE QUERY',
        code: ['GET /meus-pedidos   (bff-app → meus-pedidos)', 'MeusPedidos(lena-77)', '  reads meus_pedidos:lena-77 by key', '  no JOIN, no rules', '  returns 1,787 B: 8 orders'],
        story: 'Lena opens "my orders". The <code>bff-app</code> calls <b>one</b> route, the one in <code>meus-pedidos</code>, which returns the <b>1,787-byte</b> document with the 8 orders, 1056 at the top. The query validates nothing: the rules were already applied before the data got in. It only reads and answers.',
        look: 'The light goes down from the document, passes through meus-pedidos and the bff-app and reaches the phone, along the right path.',
        key: 'A query only returns data; the read model has the shape of the screen.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [done ? '1056 · 114.80' : '1055 · 34.90', done ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lb, on: !done }, { pts: CAB.bc }, { pts: CAB.bq, on: !done }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: !done }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f, '1,787 B');
          o.cnt = [['DOCUMENT', '1,787 B'], ['ORDERS', '8', 'dim'], ['ROUTES CALLED', '1', 'dim']];
          o.res = done ? [['the screen read a single document', 'acc']] : []; } },
      { id: 'regra', dur: 6, title: 'If it goes wrong: the duplicated rule', yk: 'THE SAME RULE ON BOTH SIDES',
        code: ['read side: "cancelled order does not appear"', 'months later the command changes the rule:', '  no stock → "awaiting restock"', 'nobody changes the other side', 'Lena sees what the checkout already refused'],
        story: 'Someone puts "cancelled order does not appear" in the read model too, to keep the screen clean. Months later the command changes the rule (an order refused for lack of stock becomes "awaiting restock") and nobody remembers the other side. The two diverge, and Lena sees an order the checkout already refused.',
        look: 'The meus-pedidos turns red with a rule that is not its own, and the screen shows an order the command refused.',
        key: 'A duplicated rule is a bug waiting to happen: the query shows what reached it.',
        f(o, t) { const bad = t > 1; lit(o, 'cmd'); o.on.qry = bad ? 'bad' : 1; if (bad) o.on.lena = 'bad';
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          o.rows.cmd = act('pedidos', 'COMMAND', ['new rule:', 'dim'], ['no stock →', 'acc'], ['"awaiting restock"', 'acc']);
          o.rows.qry = act('meus-pedidos', 'QUERY', ['copied rule:', 'dim'], ['"cancelled does not appear"', bad ? 'bad' : 'hi'], [bad ? 'went stale' : '', 'bad']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [bad ? 'order already refused' : '1056 · 114.80', bad ? 'bad' : 'acc']);
          o.cnt = [['COPIES OF THE RULE', '2', 'bad'], ['IN THE COMMAND', 'new', 'dim'], ['IN THE QUERY', bad ? 'old' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['the two models diverge', 'bad']] : [];
          if (bad) T(o, TF(749), 'rule that is not its own', 'bad'); } },
      { id: 'aviso', dur: 7, title: 'If it goes wrong: CQRS where a SELECT is enough', yk: 'MEASURED ON POSTGRESQL 14',
        code: ['SELECT … FROM pedidos JOIN itens_pedido', '  JOIN produtos JOIN pagamentos JOIN remessas', " WHERE cliente_id = 'lena-77'  -- 8 orders", 'Execution Time: 0.23 to 0.31 ms', '~100 pages in memory, with an index'],
        story: 'The most expensive failure is a design failure. In this store, the screen\'s query on the normalized model (5 tables, 8 of Lena\'s orders, with an index) costs <b>0.23 to 0.31 ms</b>. The JOIN by customer is not the problem. Separating the models just because of it trades 0.3 ms for two pieces to keep in sync. Martin Fowler warns: "for most systems CQRS adds risky complexity". What really hurts are the report (View) and the separate services (Distributed).',
        look: 'The direct path from the bff-app to the database lights up: a 0.3 ms SELECT. The query side, the conveyor and the document turn red: extra pieces.',
        key: 'For most systems one model is enough.',
        f(o, t) { const bad = t > 1.2; lit(o, 'db', 'bff', 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          if (bad) { o.on.qry = 'bad'; o.on.doc = 'bad'; o.on.bus = 'bad'; }
          o.rows.bff = act('bff-app', 'BFF', ['GET /meus-pedidos → loja', 'acc'], ['SELECT with JOIN: 0.23–0.31 ms', 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], ['1056 · 114.80', 'acc']);
          o.beams = [{ pts: CAB.lb, on: true }, { pts: CAB.rdb, on: true, flow: true }, { pts: CAB.bq, tone: bad ? 'bad' : '' }, { pts: CAB.qdoc, tone: bad ? 'bad' : '' }, { pts: CAB.ev1, tone: bad ? 'bad' : '' }, { pts: CAB.ev2, tone: bad ? 'bad' : '' }, { pts: CAB.cdb }, { pts: CAB.bc }];
          o.cnt = [["THE SCREEN'S QUERY", '0.23–0.31 ms'], ['MODELS', bad ? '1 is enough' : '2', bad ? 'bad' : 'dim'], ['EXTRA PIECES', bad ? '3' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['for most systems', 'bad'], ['one model is enough', 'bad']] : [];
          if (bad) T(o, TF(452), 'one model is enough', 'bad'); } },
    ],
    view: [
      { id: 'relatorio', dur: 6, title: 'The 23:00 report scans 300 thousand orders: ~235 ms', yk: 'THE REPORT (3 RUNS)',
        code: ['SELECT p.cidade, pr.nome, count(DISTINCT p.id),', '       sum(i.qtd)', '  FROM pedidos p JOIN itens_pedido i …', '  JOIN produtos pr … GROUP BY p.cidade, pr.nome;', '238.8 · 240.7 · 227.6 ms  (~235 ms)'],
        story: 'The 23:00 report (module 6), revenue by city and product, joins <code>pedidos</code>, <code>itens_pedido</code> and <code>produtos</code> and groups. On the test database (PostgreSQL 14, <b>300,008</b> orders), three runs gave 238.8, 240.7 and 227.6 ms: <b>~235 ms</b>. On the 50 million rows of module 16, the linear estimate (not measured) is <b>~40 s</b>, fighting for database and CPU with the people who are paying.',
        look: 'The report, in front, pulls the three database tables through the left cable. The view, on the right, is still dark.',
        key: 'A query that scans everything is the one that weighs the most on the write database.',
        f(o, t) { viewBase(o); const ms = lin(t, 0.4, 3.4, 0, 235), done = ms >= 235; lit(o, 'bff', 'db'); hide(o, 'doc'); o.beams = o.beams.filter(b => b.pts !== CAB.rio && b.pts !== CAB.qdoc);
          o.beams.find(b => b.pts === CAB.rdb).on = !done; o.beams.find(b => b.pts === CAB.rdb).flow = !done;
          o.cnt = [['REPORT', `${Math.round(ms)} ms`], ['ROWS SCANNED', '300,008', 'dim'], ['ON THE 50 MILLION', '~40 s', 'dim']];
          o.res = done ? [['~235 ms for 5 result rows', 'acc']] : [];
          if (!done) T(o, [290, 250, 30], 'scanning 300 thousand rows', 'acc'); } },
      { id: 'cria', dur: 5, title: 'CREATE MATERIALIZED VIEW: the result stored, 406 ms', yk: 'THE VIEW, IN THE SAME DATABASE',
        code: ['CREATE MATERIALIZED VIEW faturamento_cidade_produto', '  AS SELECT … ;            -- 406 ms', 'CREATE UNIQUE INDEX', '  ON faturamento_cidade_produto (cidade, produto);', '5 rows stored'],
        story: 'The simplest way to take the report out of the way is to store the finished result, in the same database. <code>CREATE MATERIALIZED VIEW faturamento_cidade_produto AS …</code> runs the query once and stores the <b>5 rows</b> of the result. Creating it cost <b>406 ms</b>. The view is the simplest read model: same database, same team, one line of SQL.',
        look: 'The view rises on the right, linked to the database by the middle cable, with the Recife and blue mug row.',
        key: 'A materialized view is the result of a query stored in a table.',
        f(o, t) { viewBase(o); const done = t > 1.4; lit(o, 'db'); if (done) lit(o, 'doc'); else hide(o, 'doc');
          o.beams.find(b => b.pts === CAB.rio).on = !done; o.beams.find(b => b.pts === CAB.rio).flow = !done;
          o.cnt = [['CREATE THE VIEW', done ? '406 ms' : '…'], ['ROWS', '5', 'dim'], ['WHERE', 'same database', 'dim']];
          o.res = done ? [['5 rows ready to read', 'acc']] : [];
          T(o, [452, 136, 34], 'same loja database', 'dim'); } },
      { id: 'le', dur: 5, title: 'Reading the view: 0.021 ms, ~11,000× faster', yk: 'THE READER',
        code: ['EXPLAIN ANALYZE', '  SELECT * FROM faturamento_cidade_produto', "   WHERE cidade = 'Recife';", 'Execution Time: 0.021 ms', '235 ÷ 0.021 ≈ 11,000×'],
        story: 'The reader asks the view for the Recife row: <b>0.021 ms</b>. About <b>11,000×</b> faster than the report, because it reads 5 ready rows instead of scanning 300 thousand. On the 50 million the read stays at ~0.021 ms: the view has the same 5 rows.',
        look: 'The light runs from the reader to the view, along the short cable on the right, and comes back almost at once.',
        key: 'The gain is huge: reading the ready result instead of computing it.',
        f(o, t) { viewBase(o); lit(o, 'qry', 'doc');
          o.beams.find(b => b.pts === CAB.qdoc).on = true; o.beams.find(b => b.pts === CAB.qdoc).flow = true;
          o.rows.qry = act('reader', 'SESSION 2', ["WHERE cidade = 'Recife'", 'hi'], ['0.021 ms', 'acc']);
          o.cnt = [['READ THE VIEW', '0.021 ms'], ['THE REPORT', '~235 ms', 'dim'], ['RATIO', '~11,000×', 'dim']];
          o.res = [['5 ready rows: 0.021 ms', 'acc']]; } },
      { id: 'refresh', dur: 8, title: 'Plain REFRESH: the reader waits 2,285 ms', yk: 'TWO SESSIONS',
        code: ['session 1: BEGIN;', '  REFRESH MATERIALIZED VIEW …;  -- 401 ms', '  SELECT pg_sleep(3); COMMIT;', 'session 2 (1 s later): SELECT count(*) …', 'wait_event_type = Lock · wait_event = relation'],
        story: 'The view only knows what it knew when it was made; to learn about new orders, someone rebuilds it. <code>REFRESH MATERIALIZED VIEW</code> took <b>401 ms</b> (linear estimate of ~67 s on the 50 million). In the test, session 1 ran the <code>REFRESH</code> inside a transaction that lasted 3 s. One second later, the reader ran <code>SELECT count(*)</code> on the view and got stuck: <code>pg_stat_activity</code> showed it at <code>wait_event_type = Lock</code>, <code>wait_event = relation</code>. It waited <b>2,285 ms</b>.',
        look: 'The view turns red (locked) while session 1 rebuilds it. The reader\'s clock counts the wait up to 2,285 ms.',
        key: 'The plain REFRESH blocks whoever reads.',
        f(o, t) { viewBase(o); const s = lin(t, 0.4, 6.4, 0, 3.3), lock = s < 3, reading = s >= 1, w = clamp(s - 1, 0, 2.285);
          lit(o, 'cmd'); o.on.doc = lock ? 'bad' : 1; o.on.qry = reading && w < 2.285 ? 'bad' : reading ? 1 : 0;
          o.rows.cmd = act('session 1', 'REFRESH', [lock ? 'REFRESH … (open transaction)' : 'COMMIT', lock ? 'bad' : 'acc'], ['pg_sleep(3)', 'dim']);
          o.rows.qry = act('reader', 'SESSION 2', [reading ? 'SELECT count(*) …' : 'has not read yet', 'hi'], reading ? [w < 2.285 ? 'Lock · relation' : 'read', w < 2.285 ? 'bad' : 'acc'] : null, reading ? [`waited ${thou(w * 1000)} ms`, 'dim'] : null);
          o.beams = [{ pts: CAB.cdb, on: lock }, { pts: CAB.rio, on: lock, tone: lock ? 'bad' : '' }, { pts: CAB.qdoc, on: reading, tone: reading && w < 2.285 ? 'bad' : '' }, { pts: CAB.rdb }];
          o.cnt = [['THE READER WAITED', `${thou(w * 1000)} ms`, w > 0 && w < 2.285 ? 'bad' : ''], ['SESSION 1 CLOCK', `${s.toFixed(1)} s`, 'dim'], ['REFRESH', '401 ms', 'dim']];
          o.res = w >= 2.285 ? [['reader stuck 2,285 ms', 'bad']] : reading ? [['wait_event = relation', 'bad']] : [];
          if (lock) T(o, [749, 136, 50], 'locked by the REFRESH', 'bad'); } },
      { id: 'concorrente', dur: 6, title: 'REFRESH CONCURRENTLY: the reader waits 12 ms', yk: 'WITH THE UNIQUE INDEX',
        code: ['CREATE UNIQUE INDEX ON faturamento_cidade_produto', '  (cidade, produto);   -- required', 'REFRESH MATERIALIZED VIEW CONCURRENTLY …;', '  -- 340 ms', 'the reader reads the old version: waits 12 ms'],
        story: '<code>REFRESH … CONCURRENTLY</code> builds the new version alongside and swaps only the rows that changed, without taking the view away from the reader. It requires a <code>CREATE UNIQUE INDEX</code> on the view. It took <b>340 ms</b>, and the same reader waited <b>12 ms</b> instead of 2,285.',
        look: 'The view stays lit while it is rebuilt; the reader reads almost without stopping.',
        key: 'CONCURRENTLY exists because of the reader: it costs a unique index.',
        f(o, t) { viewBase(o); const w = lin(t, 1.2, 1.6, 0, 12); lit(o, 'cmd', 'doc', 'qry');
          o.rows.cmd = act('session 1', 'CONCURRENTLY', ['REFRESH … CONCURRENTLY', 'acc'], ['340 ms · unique index', 'dim']);
          o.rows.qry = act('reader', 'SESSION 2', ['SELECT count(*) …', 'hi'], ['reads the old version', 'acc'], [`waited ${Math.round(w)} ms`, 'dim']);
          o.beams = [{ pts: CAB.cdb, on: true }, { pts: CAB.rio, on: true, flow: true }, { pts: CAB.qdoc, on: true, flow: true }, { pts: CAB.rdb }];
          o.cnt = [['THE READER WAITED', `${Math.round(w)} ms`], ['PLAIN', '2,285 ms', 'dim'], ['REFRESH CONCURRENTLY', '340 ms', 'dim']];
          o.res = w >= 12 ? [['12 ms instead of 2,285', 'acc']] : []; } },
      { id: 'velha', dur: 8, title: 'If it goes wrong: the view gets stale and shows 100003', yk: 'AFTER A NEW ORDER',
        code: ['INSERT … mug order in Recife', "SELECT … WHERE produto = 'caneca azul'", '  → pedidos = 100003, unidades = 150004', 'REFRESH MATERIALIZED VIEW …;', '  → pedidos = 100004, unidades = 150005'],
        story: 'A new mug order comes in at Recife. The database already has it; the view does not: <code>SELECT … WHERE produto = \'caneca azul\'</code> keeps returning <b>100003</b> orders and 150004 units. Only after the <code>REFRESH</code> does it go to <b>100004</b> and 150005. If the <code>REFRESH</code> runs at 23:00, the 20:12 order only gets in <b>2 h 48 min</b> later. And each <code>REFRESH</code> rebuilds the whole result: PostgreSQL does not update the view piece by piece.',
        look: 'The order lights up in the database; the view keeps 100003 in red until the REFRESH, when it becomes 100004.',
        key: 'The view only knows what it knew at the last REFRESH.',
        f(o, t) { viewBase(o); const ins = t > 0.8, ref = t > 5.2; lit(o, 'cmd', 'db'); o.on.doc = ins && !ref ? 'bad' : ref ? 1 : 0;
          o.rows.cmd = act('pedidos', 'INSERT', ['mug order · Recife', ins ? 'acc' : 'dim'], [ref ? 'session 1: REFRESH' : '', 'acc']);
          o.rows.db = TBL(['pedidos', 'tbl'], [ins ? '300,009 rows (+1 mug)' : '300,008 rows', ins ? 'acc' : 'dim'], ['itens_pedido', 'tbl'], ['600,009 rows', 'dim'], ['produtos · 3 rows', 'dim']);
          o.rows.doc = ref ? MV(MVROW('100004', 0, 'acc'), ['unidades 150005', 'acc'], ['rebuilt in full', 'dim']) : MV(MVROW('100003', 0, ins ? 'bad' : 'hi'), ['unidades 150004', ins ? 'bad' : 'dim'], [ins ? 'does not know the new order' : '+ 4 rows', ins ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.cdb, on: ins && !ref, flow: ins && !ref }, { pts: CAB.rio, on: ref, flow: ref }, { pts: CAB.qdoc }, { pts: CAB.rdb }];
          o.cnt = [['THE VIEW SAYS', ref ? '100004' : '100003', ins && !ref ? 'bad' : ''], ['THE DATABASE HAS', ins ? '100004' : '100003', 'dim'], ['REFRESH AT 23:00', '+2 h 48 min', 'bad']];
          o.res = ins && !ref ? [['the view shows the past', 'bad']] : ref ? [['only after the REFRESH', 'acc']] : [];
          if (ins && !ref) T(o, TF(749), 'still 100003', 'bad'); } },
    ],
    replica: [
      { id: 'tres', dur: 5, title: 'Primary in SP, replicas in Rio and Recife', yk: 'THE DRAWING FROM MODULE 17',
        code: ['pg-sp      primary · reads and writes', 'pg-rio     replica · read only · RTT 10 ms', 'pg-recife  replica · read only · RTT 80 ms', 'same schema on all three', 'Lena reads from Recife: ~2 ms, not 80'],
        story: 'The replica is the cheapest read model: the <b>same schema</b> on another server, with no projector and no event. It is the drawing from module 17: the <code>pg-sp</code> primary in SP and the replicas in Rio and Recife, fed by the database log. Lena reads from Recife: <b>~2 ms</b> instead of the <b>80 ms</b> round trip to SP.',
        look: 'The primary on the left; Rio behind and Recife in front, on the right, each with its own cable and the RTT written out. Lena connects to Recife.',
        key: 'The replica copies the same schema: it is not another model.',
        f(o) { replicaBase(o); lit(o, 'db');
          o.cnt = [['SERVERS READING', '3'], ['READ IN RECIFE', '~2 ms', 'dim'], ['READ IN SP', '80 ms', 'dim']];
          o.res = [['same schema, another server', 'acc']]; } },
      { id: 'da', dur: 5, title: 'What it gives: capacity and proximity', yk: 'THREE SERVERS READING',
        code: ['capacity: 3 servers handle reads', 'proximity: Recife ~2 ms from Lena', 'one more copy if the primary goes down', 'read code: the same', 'only the connection changes'],
        story: 'The replica gives <b>capacity</b> (all three machines handle reads), <b>proximity</b> (close to whoever reads) and one more copy, useful if the primary goes down. All without touching the model and without changing a line of the read code: only the connection.',
        look: 'The log runs from SP to the two replicas, and Lena\'s read leaves from Recife.',
        key: 'More servers reading, close to whoever reads.',
        f(o) { replicaBase(o); lit(o, 'db', 'doc', 'qry', 'lena');
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], ['from Recife: ~2 ms', 'acc']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }, { pts: CAB.bq }, { pts: CAB.lrec, on: true, flow: true }];
          o.cnt = [['CAPACITY', '3 servers'], ["LENA'S READ", '~2 ms', 'dim'], ['NEW CODE', 'none', 'dim']];
          o.res = [['capacity and proximity', 'acc']]; } },
      { id: 'nao-da', dur: 6, title: 'What it does not give: the 5-table JOIN stays', yk: 'ON pg-recife',
        code: ['SELECT … FROM pedidos', '  JOIN itens_pedido JOIN produtos', '  JOIN pagamentos JOIN remessas', " WHERE cliente_id = 'lena-77';", 'same query, another machine'],
        story: 'What the replica does <b>not</b> give is screen shape: "my orders" is still a 5-table JOIN, just on another machine. Nor isolation of heavy queries: the report, running on the replica, competes with the log that arrives from the primary. The article says the replica "just moves the problem elsewhere": that is true when the problem is the shape.',
        look: 'Recife shows the same 5 tables as the primary. No document: the shape of the data is the same.',
        key: 'A replica gives capacity, not shape.',
        f(o) { replicaBase(o, { rec: [['pedidos · itens_pedido', 'hi'], ['produtos · pagamentos', 'hi'], ['remessas: 5-way JOIN', 'acc']] }); lit(o, 'qry', 'lena');
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio, on: true }, { pts: CAB.rec, on: true }, { pts: CAB.bq }, { pts: CAB.lrec, on: true, flow: true }];
          o.cnt = [['TABLES IN THE JOIN', '5'], ['NEW SHAPE', 'none', 'dim'], ['SCHEMA', 'the same', 'dim']];
          o.res = [['moved the place, not the shape', 'acc']]; } },
      { id: 'relatorio', dur: 6, title: 'The report goes to the Recife replica', yk: 'THE LONG QUERY', act: ['Send the report', 'to Recife'],
        code: ['replica in hot standby', 'long query on the replica', 'the primary keeps sending the WAL', 'max_standby_streaming_delay: 30 s (default)', 'store report: ~40 s'],
        story: 'The idea sounds good: take the 23:00 report off the primary and run it on the Recife replica. Except the replica is not idle: it keeps applying the log that comes from SP. If the log needs to touch rows the query is still reading, the replica waits up to <code>max_standby_streaming_delay</code> (default <b>30 s</b>) and then picks the log.',
        look: 'The report, in front, connects to Recife. The cable from SP keeps carrying the log there.',
        key: 'On the replica, the long query competes with the incoming log.',
        f(o, t) { replicaBase(o, { rec: [['report running', 'acc'], ['WAL arriving from SP', 'dim']] }); const s = lin(t, 0.4, 5, 0, 2); lit(o, 'bff', 'qry');
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: true, flow: true }, { pts: CAB.bq, on: true, flow: true }, { pts: CAB.lrec }];
          o.cnt = [['QUERY ON THE REPLICA', `${s.toFixed(1)} s`], ['DEFAULT LIMIT', '30 s', 'dim'], ['THE REPORT', '~40 s', 'dim']];
          o.res = [['~40 s > the 30 s default', 'bad']]; } },
      { id: 'cancela', dur: 8, title: 'VACUUM on the primary: the query dies at 3.16 s', yk: 'MEASURED · max_standby_streaming_delay = 1s',
        code: ['t = 0 s     on the replica: 6 s query', 't = 2 s     on the primary: DELETE + VACUUM', 't = 3.16 s  the query dies:', 'ERROR: canceling statement due to', '       conflict with recovery'],
        story: 'In the test (PostgreSQL 14, <code>max_standby_streaming_delay = 1s</code>), a 6 s query was running on the replica. At 2 s the primary did a <code>DELETE</code> and <code>VACUUM</code> of rows it still needed to see. The replica waited for the limit and, at <b>3.16 s</b>, cancelled it: <code>ERROR: canceling statement due to conflict with recovery</code>. With the 30 s default, the ~40 s report would die too. The fixes cost something: <code>hot_standby_feedback</code> makes the table bloat on the primary; raising the limit leaves the replica further behind.',
        look: 'The DELETE + VACUUM leaves SP along the Recife cable; the replica holds on for a second and turns red when it cancels the report.',
        key: 'The long query on the replica is cancelled by a recovery conflict.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 3.4), vac = s >= 2, dead = s >= 3.16;
          replicaBase(o, { sp: [[vac ? 'DELETE + VACUUM' : 'writing', vac ? 'acc' : 'dim']],
            rec: [[dead ? 'query cancelled' : 'report running', dead ? 'bad' : 'acc'], [dead ? 'conflict with recovery' : vac ? 'holding the log: 1 s' : 'WAL arriving', dead ? 'bad' : 'dim']] });
          lit(o, 'db'); o.on.qry = dead ? 'bad' : 1; o.on.bff = dead ? 'bad' : 1;
          o.rows.bff = act('23:00 report', dead ? 'CANCELLED' : 'ON THE REPLICA', [dead ? 'ERROR at 3.16 s' : 'running…', dead ? 'bad' : 'dim'], ['6 s query', 'dim']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: vac }, { pts: CAB.bq, on: !dead, tone: dead ? 'bad' : '', flow: !dead }, { pts: CAB.lrec }];
          pk(o, CAB.rec, (s - 2) / 0.5, 'DELETE + VACUUM');
          o.cnt = [['QUERY ON THE REPLICA', `${s.toFixed(2)} s`, dead ? 'bad' : ''], ['VACUUM ON THE PRIMARY', vac ? 'at 2 s' : '…', 'dim'], ['LIMIT', '1 s', 'dim']];
          o.res = dead ? [['canceling statement due to', 'bad'], ['conflict with recovery', 'bad']] : [];
          if (dead) T(o, TF(749), 'cancelled at 3.16 s', 'bad'); } },
      { id: 'atraso', dur: 8, title: 'If it goes wrong: 1056 vanishes for 800 ms in Recife', yk: 'BLACK FRIDAY · RECIFE 800 ms BEHIND',
        code: ['20:12:00.004  COMMIT of 1056 in SP', '20:12:00.050  Lena opens "my orders"', '              reads from Recife: only up to 1055', '~20:12:00.804 Recife applies 1056', 'a replica brings it closer, does not solve it'],
        story: 'On Black Friday the Recife replica was <b>800 ms</b> behind the primary. Lena places 1056 (commit at 20:12:00.004) and, right after, opens "my orders" reading from Recife: the order is not there, like 1055 in module 17. It only shows up when Recife applies the log, around 20:12:00.804. The replica does not solve reading what you just wrote: it only brings it closer.',
        look: '1056 lights up in SP and travels slowly along the Recife cable; meanwhile, Lena\'s screen turns red without it.',
        key: 'The replica shows the past for hundreds of milliseconds.',
        f(o, t) { const ms = lin(t, 0.3, 6.5, 0, 1000), applied = ms >= 804, opened = ms >= 50;
          replicaBase(o, { sp: [['COMMIT 1056 at .004', 'acc']], rec: [[applied ? '1056 applied' : 'still at 1055', applied ? 'acc' : 'bad'], ['800 ms behind', 'dim']] });
          lit(o, 'db', 'cmd'); o.on.qry = applied ? 1 : 'bad'; if (opened) o.on.lena = applied ? 1 : 'bad';
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [!opened ? 'opening…' : applied ? '1056 · 114.80' : 'without 1056', !opened ? 'dim' : applied ? 'acc' : 'bad']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: !applied }, { pts: CAB.bq }, { pts: CAB.lrec, on: opened, flow: opened, tone: opened && !applied ? 'bad' : '' }];
          pk(o, CAB.rec, (ms - 4) / 800, 'WAL 1056');
          o.cnt = [['CLOCK', clock(ms)], ["RECIFE'S DELAY", '800 ms', 'bad'], ['ON SCREEN', applied ? '1056' : '1055', applied ? 'dim' : 'bad']];
          o.res = opened && !applied ? [['Lena does not see her own order', 'bad']] : applied ? [['only after ~800 ms', 'acc']] : [];
          if (opened && !applied) T(o, TF(560), 'where is 1056?', 'bad'); } },
    ],
    eventual: [
      { id: 'commit', dur: 5, title: '1056: commit at 20:12:00.004', yk: 'ON THE COMMAND SIDE', act: ['Follow 1056', 'from commit to screen'],
        code: ['20:12:00.000  CriarPedido 1056', '20:12:00.004  COMMIT (pedidos + itens_pedido)', 'read model: still v7', 'the document does not know yet', 'the conveyor carries the rest'],
        story: 'With events feeding the read model, it is always a little behind the write model. This is the <b>eventual consistency</b> from module 3 (BASE), now on purpose. 1056 is written at <b>20:12:00.004</b>. At that instant Lena\'s document is still at version 7, without it.',
        look: 'The 1056 rows light up in the database. The document, on the right, still has 7 orders.',
        key: 'Separating the models trades "I read what I wrote" for "I read soon".',
        f(o) { lit(o, 'db', 'cmd'); o.rows.db = DB1();
          o.rows.cmd = act('pedidos', 'COMMAND', ['CriarPedido 1056', 'acc'], ['COMMIT at .004', 'acc']);
          o.cnt = [['CLOCK', clock(4)], ['IN THE DATABASE', '1056', 'dim'], ['IN THE DOCUMENT', 'v7 · without 1056', 'dim']];
          o.res = [['written; not readable yet', 'acc']]; } },
      { id: 'caminho', dur: 8, title: 'From commit to screen: ~74 ms', yk: 'THE PATH (EXAMPLE, NORMAL DAY)',
        code: ['commit                        .004', '+30 ms  CDC reads the WAL       .034', '+10 ms  Kafka, acks=all        .044', '+20 ms  the consumer picks up   .064', '+10 ms  upsert into the document .074'],
        story: 'The path of 1056 to the document, on a normal day (example): CDC reads the WAL (+30 ms), Kafka with <code>acks=all</code> confirms (+10 ms), the consumer picks it up (+20 ms) and the projector does the <i>upsert</i> into the read storage (+10 ms). The read model knows about 1056 at around <b>20:12:00.074</b>: <b>~74 ms</b> after the commit.',
        look: 'The light dot leaves the database, runs along the conveyor and enters the document; the clock goes from .004 to .074.',
        key: 'The delay is the sum of the steps along the path.',
        f(o, t) { const ms = lin(t, 0.4, 6.4, 4, 74), done = ms >= 74; lit(o, 'db', 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (done ? 'ok' : 'recv') : 'none'); o.rows.doc = done ? DOC8() : DOC7();
          const stage = ms < 34 ? 'CDC reads the WAL' : ms < 44 ? 'Kafka, acks=all' : ms < 64 ? 'consumer picks up' : ms < 74 ? 'upsert' : 'in the document';
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, (ms - 4) / 70, stage);
          o.cnt = [['CLOCK', clock(ms)], ['AFTER THE COMMIT', `+${Math.round(ms - 4)} ms`, 'dim'], ['DOCUMENT', done ? 'v8' : 'v7', 'dim']];
          o.res = done ? [['~74 ms from commit to screen', 'acc']] : []; } },
      { id: 'buraco', dur: 7, title: 'Lena opens at 20:12:00.050 and does not see 1056', yk: 'READ-YOUR-WRITES', act: ['Open "my orders"', 'at .050'],
        code: ['20:12:00.004  COMMIT', '20:12:00.050  GET /meus-pedidos', '              document still v7', '20:12:00.074  1056 reaches the document', '24 ms too late'],
        story: 'Lena opens "my orders" at <b>20:12:00.050</b>, 24 ms before the model knows, and <b>does not see</b> 1056: the same problem as 1055 in module 17. Whoever writes expects to read what they wrote (<i>read-your-writes</i>), and the read model is still on its way. The design has to plan for that gap.',
        look: 'The event is still on the conveyor when the read reaches the document; Lena\'s screen turns red, without 1056.',
        key: 'Without a plan, Lena does not see her own order.',
        f(o, t) { const ms = lin(t, 0.4, 5.4, 4, 90), opened = ms >= 50, arrived = ms >= 74;
          lit(o, 'db', 'bus'); o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (arrived ? 'ok' : 'recv') : 'none'); o.rows.doc = arrived ? DOC8() : DOC7();
          if (arrived) lit(o, 'doc'); if (opened) { o.on.lena = 'bad'; o.on.qry = 1; }
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [opened ? '1055 · without 1056' : 'opening…', opened ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: opened, tone: opened ? 'bad' : '' }, { pts: CAB.bc }, { pts: CAB.bq, on: opened }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: opened }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801');
          o.cnt = [['CLOCK', clock(ms)], ['LENA OPENED', opened ? '.050' : '…', opened ? 'bad' : 'dim'], ['MODEL KNEW', arrived ? '.074' : '…', 'dim']];
          o.res = opened ? [['read v7: 1056 does not show', 'bad']] : [];
          if (opened) T(o, TF(560), 'where is 1056?', 'bad'); } },
      { id: 'resposta', dur: 6, title: 'Way (a): the command\'s response carries the order', yk: 'THE 201 ALREADY HAS 1056',
        code: ['POST /pedidos → 201 Created', '  { "pedido_id": 1056, "status": "criado",', '    "itens": […], "total_centavos": 11480 }', 'the app puts 1056 in the list right away', 'it does not ask the read model'],
        story: 'The first way: <code>CriarPedido</code> answers <code>201</code> with the 1056 document, and the app puts it in the list right away, without asking the read model. Lena sees her own order; when the model catches up, the list coming from <code>meus-pedidos</code> already has it.',
        look: 'The response comes back along the command path straight to the phone, which shows 1056 before the document knows.',
        key: 'Whoever just wrote already has what they wrote.',
        f(o, t) { const f = lin(t, 0.4, 3, 0, 1), done = f >= 1; lit(o, 'cmd'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('recv');
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [done ? '1056 · 114.80 (from the 201)' : 'waiting for the 201', done ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: !done }, { pts: CAB.bc, on: !done }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true }];
          pk(o, rev(WAY.cmd), f, '201 · 1056');
          o.cnt = [['RESPONSE', '201'], ['ON SCREEN', done ? '1056' : '…', 'dim'], ['COST', 'the app merges the list', 'dim']];
          o.res = done ? [['Lena sees 1056 right away', 'acc']] : []; } },
      { id: 'token', dur: 8, title: 'Way (b): the version token min_versao=8', yk: 'WAITS UP TO 1 s', act: ['Use the token', 'min_versao=8'],
        code: ['GET /meus-pedidos?min_versao=8   (at .050)', 'document at v7: meus-pedidos waits', 'at .074 the projector reaches v8', '→ answers with 1056 (24 ms wait)', 'if it goes past 1 s: reads from the command side'],
        story: 'The second way: the document\'s <code>versao</code> is the analog of the LSN from module 17. The app asks <code>GET /meus-pedidos?min_versao=8</code>. <code>meus-pedidos</code> sees the document at v7 and <b>waits</b> (up to 1 s) for the projector to reach v8. At .074 v8 arrives and it answers, after a 24 ms wait. If it did not arrive within 1 s, it would read from the command side.',
        look: 'meus-pedidos holds the read while the event finishes the conveyor; when the document becomes v8, the response goes on to the phone.',
        key: 'The token says which version Lena needs to see.',
        f(o, t) { const ms = lin(t, 0.4, 6.4, 40, 110), opened = ms >= 50, arrived = ms >= 74, back = clamp((ms - 74) / 30);
          lit(o, 'bus'); o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (arrived ? 'ok' : 'recv') : 'none'); o.rows.doc = arrived ? DOC8() : DOC7();
          if (arrived) lit(o, 'doc'); if (opened) o.on.qry = 1; if (back >= 1) lit(o, 'lena');
          o.rows.qry = act('meus-pedidos', 'QUERY', ['min_versao=8', 'acc'], [!opened ? '…' : arrived ? 'v8 arrived: answers' : 'document v7: waits', arrived ? 'acc' : 'dim'], [opened ? `waits ${Math.round(clamp(ms, 50, 74) - 50)} ms (up to 1 s)` : '', 'dim']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [back >= 1 ? '1056 · 114.80' : opened ? 'loading…' : 'opening…', back >= 1 ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: opened }, { pts: CAB.bc }, { pts: CAB.bq, on: opened }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: opened }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801'); pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], back, 'v8 · 1056');
          o.cnt = [['CLOCK', clock(ms)], ['WAIT', `${Math.round(clamp(ms, 50, 74) - 50)} ms`, 'dim'], ['VERSION', arrived ? 'v8' : 'v7', 'dim']];
          o.res = back >= 1 ? [['waited 24 ms and saw 1056', 'acc']] : []; } },
      { id: 'processando', dur: 5, title: 'Way (c): "processing"', yk: 'THE SCREEN ADMITS THE DELAY',
        code: ['the app knows 1056 was accepted', 'shows: 1056 · processing', 'no payment, no tracking', 'switches when the model catches up', 'asks nobody'],
        story: 'The third way: the screen shows 1056 as "processing" until the model catches up. It does not lie and does not ask anyone, but Lena sees the order without payment and without tracking for a few moments. Each way costs something different: (a) asks the app to merge the list, (b) holds the read, (c) shows less.',
        look: 'Lena\'s screen shows 1056 as "processing" while the event finishes the conveyor.',
        key: 'Lena needs to see her own order, even before the model.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 40, 90), arrived = ms >= 74; lit(o, 'lena', 'bus'); if (arrived) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(arrived ? 'ok' : 'recv'); o.rows.doc = arrived ? DOC8() : DOC7();
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [arrived ? '1056 · criado' : '1056 · processing', 'acc']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801');
          o.cnt = [['ON SCREEN', arrived ? 'criado' : 'processing'], ['CLOCK', clock(ms), 'dim'], ['EXTRA QUERY', 'none', 'dim']];
          o.res = [['order visible, honest status', 'acc']]; } },
      { id: 'bf', dur: 8, title: 'Black Friday: 120 events/s against 100/s per instance', yk: 'THE MATH THAT DOES NOT WORK',
        code: ['30 orders/s × 4 events = 120 events/s', '1 upsert of 10 ms = 100 events/s', '1 instance: deficit of 20/s', '10 min: 20 × 600 = 12,000 events', '= 120 s of delay, and growing'],
        story: 'On Black Friday the store does 30 orders/s and each one generates 4 events (for 1056: <code>e-1801</code> to <code>e-1804</code>): <b>120 events/s</b>. The projector does 1 <i>upsert</i> of 10 ms per event, that is, <b>100 events/s</b> per instance. With 1 instance, 20 per second are left over: in 10 minutes that is <b>12,000 events</b> in the queue, <b>120 s</b> of delay, and it only grows.',
        look: 'The pile in front of the conveyor grows: those are the events the projector has not applied yet.',
        key: 'The projector\'s capacity decides the delay.',
        f(o, t) { const m = lin(t, 0.4, 6.4, 0, 10), n = 20 * 60 * m; lit(o, 'bus'); o.on.doc = m > 1 ? 'bad' : 1;
          o.rows.db = DB1(); o.rows.bus = act('eventos', '120/s COMING IN'); o.rows.bus.tape = [['e-1801', 'ok'], ['e-1802', 'ok'], ['e-1803', 'ok'], ['e-1804', 'ok']]; o.rows.bus.tapeLabel = 'KAFKA';
          o.rows.qry = act('projector', '1 INSTANCE', ['100 events/s', 'hi'], ['10 ms per upsert', 'dim'], ['deficit: 20/s', 'bad']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: true, flow: true }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true, flow: true }, { pts: CAB.ev2, on: true, flow: true, tone: 'bad' }];
          o.piles.push({ p: [452, 236, PL + 2], v: n, f: m / 10 });
          o.cnt = [['ACCUMULATED DELAY', `${thou(n)} events`, 'bad'], ['IN SECONDS', `${Math.round(n / 100)} s`, 'bad'], ['TIME', `${m.toFixed(1)} min`, 'dim']];
          o.res = m >= 10 ? [['120 s behind and growing', 'bad']] : []; } },
      { id: 'tres', dur: 8, title: '3 instances: 40% usage; one stopped drains in 400 s', yk: 'THE MATH THAT WORKS (AND THE ONE THAT STUMBLES)',
        code: ['3 partitions of the pedidos topic (module 13)', '3 × 100 = 300/s; each one receives 40/s', 'one goes down 10 min: 40 × 600 = 24,000', 'when back it drains at 100 − 40 = 60/s', '24,000 ÷ 60 = 400 s (6 min 40 s)'],
        story: 'With <b>3 instances</b> (the 3 partitions of the <code>pedidos</code> topic, module 13) the capacity is 300/s and each one receives 40/s: <b>40%</b> usage. But if one of them goes down for 10 minutes, it accumulates 40 × 600 = <b>24,000 events</b>; when it returns, it drains at 100 − 40 = 60/s and takes <b>400 s</b> (6 min 40 s). In that time only the customers of that partition see the delayed screen. The metric that watches this is the consumer lag and the age of the last applied event.',
        look: 'The pile grows while the instance is stopped and shrinks slowly after it returns.',
        key: 'Watch the consumer lag and the age of the last applied event.',
        f(o, t) { const s = lin(t, 0.4, 7.2, 0, 1000), down = s < 600, n = down ? 40 * s : Math.max(0, 24000 - 60 * (s - 600));
          lit(o, 'bus', 'doc'); o.on.qry = down ? 'bad' : 1;
          o.rows.db = DB1(); o.rows.bus = act('eventos', '3 PARTITIONS'); o.rows.bus.tape = [['p0', 'ok'], ['p1', down ? 'bad' : 'recv'], ['p2', 'ok']]; o.rows.bus.tapeLabel = 'KAFKA';
          o.rows.qry = act('projector', '3 INSTANCES', ['300/s · 40% usage', 'hi'], [down ? 'p1 stopped' : n > 0 ? 'p1 draining at 60/s' : 'p1 caught up', down ? 'bad' : 'acc'], [`${Math.floor(s / 60)} min ${Math.round(s % 60)} s in`, 'dim']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: true, flow: true }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true, flow: true }, { pts: CAB.ev2, on: true, flow: true }];
          if (n > 0) o.piles.push({ p: [452, 236, PL + 2], v: n, f: n / 24000 });
          o.cnt = [['QUEUE OF PARTITION p1', `${thou(n)} events`, down || n > 0 ? 'bad' : ''], ['CLOCK', `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`, 'dim'], ['TO DRAIN', '400 s', 'dim']];
          o.res = down ? [['instance stopped: queue grows', 'bad']] : n > 0 ? [['draining at 60/s', 'acc']] : [['caught up: 6 min 40 s later', 'acc']]; } },
      { id: 'duas-vezes', dur: 8, title: 'If it goes wrong: the projector applies e-1801 twice', yk: 'hospital-cqrs-sql · handler.go (READ IN THE CODE)',
        code: ['INSERT INTO View_Farmacia (…) VALUES (…)', '-- no ON CONFLICT', 'the consumer rereads the message', '→ the INSERT runs again', 'fix: only if versao is greater, or evento_id'],
        story: 'Redelivery happens: the consumer dies after applying and before confirming, and rereads the message. The projector in the author\'s lab (<code>hospital-cqrs-sql/internal/events/handler.go</code>) does a plain <code>INSERT</code> into the view, <b>with no <code>ON CONFLICT</code></b> (read in the code; the lab was not run). In the store, 1056 would show up <b>twice</b> in "my orders". The fix is to apply the event only if the <code>versao</code> is greater than the stored one, or to store the <code>evento_id</code> of those already applied: idempotency.',
        look: 'The e-1801 goes through the conveyor twice; the document gains a second 1056 row, in red.',
        key: 'A projector that is not idempotent duplicates the order.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 3, 5, 0, 1), dup = f2 >= 1; lit(o, 'bus'); o.on.doc = dup ? 'bad' : f1 >= 1 ? 1 : 0;
          o.rows.db = DB1(); o.rows.bus.tape = [['e-1801', 'ok'], ['e-1801', f2 > 0 ? 'bad' : 'none'], ['e-1802', 'none']]; o.rows.bus.tapeLabel = 'REDELIVERY';
          if (dup) { const d = DOC('1056 · criado · 114.80', ['9 rows · 1056 twice', 'bad'], 'bad'); d.rows.splice(2, 0, ['1056 · criado · 114.80', 'bad']); d.rows.pop(); o.rows.doc = d; }
          else o.rows.doc = f1 >= 1 ? DOC8() : DOC7();
          if (dup) o.on.lena = 'bad';
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [dup ? '1056 · 1056 (twice)' : f1 >= 1 ? '1056 · 114.80' : '1055 · 34.90', dup ? 'bad' : 'acc']);
          o.rows.qry = act('projector', 'NOT IDEMPOTENT', ['INSERT without ON CONFLICT', dup ? 'bad' : 'hi'], [f2 > 0 ? 'got e-1801 again' : '', 'bad']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true, tone: f2 > 0 ? 'bad' : '' }];
          pk(o, WAY.ev, f1, 'e-1801'); pk(o, WAY.ev, f2, 'e-1801 again', 'bad');
          o.cnt = [['1056 ON SCREEN', dup ? '2 times' : f1 >= 1 ? '1 time' : '…', dup ? 'bad' : ''], ['DELIVERIES OF e-1801', f2 > 0 ? '2' : '1', 'dim'], ['FIX', 'versao or evento_id', 'dim']];
          o.res = dup ? [['redelivery duplicated the order', 'bad']] : [];
          if (dup) T(o, TF(749), '1056 duplicated', 'bad'); } },
    ],
    documento: [
      { id: 'ficha', dur: 5, title: 'One document per customer: meus_pedidos:lena-77', yk: 'THE DOCUMENT',
        code: ['{"cliente_id":"lena-77","versao":8,', ' "pedidos":[{"pedido_id":1056,', '   "status":"criado","itens":[…],', '   "total_centavos":11480,', '   "pagamento":null,"rastreio":null}, …]}'],
        story: 'The screen does no transaction and no JOIN: it fetches one document per customer. The read model keeps <code>meus_pedidos:lena-77</code> with the last 10 orders, newest first. Lena\'s 8 orders (1042, 1044, 1047, 1048, 1051, 1054, 1055 and 1056) take <b>1,787 bytes</b>, on average <b>223 B</b> per order.',
        look: 'Lena\'s card, on the right, with the 8 orders in rows and 1056 at the top.',
        key: 'The read model has the exact shape of the answer.',
        f(o) { lit(o, 'doc'); o.rows.db = DB1(); o.rows.doc = DOC8(); o.rows.bus.tape = EV('ok');
          o.cnt = [['DOCUMENT', '1,787 B'], ['ORDERS', '8', 'dim'], ['AVERAGE', '223 B per order', 'dim']];
          o.res = [['one document, the whole screen', 'acc']]; } },
      { id: 'monta', dur: 7, title: 'The projector builds 1056: 336 B in, 253 B kept', yk: 'FROM EVENT TO DOCUMENT',
        code: ['in:   e-1801 PedidoCriado    336 B', 'kept: 1056 in the document     253 B', '  status "criado"', '  pagamento null · rastreio null', 'name and price at the time: does not read the catalogo'],
        story: 'The projector receives the <code>e-1801</code> (336 B) and writes only what the screen shows: 1056 with status "criado", the two items with name and price at the time, the total and, for now, null <code>pagamento</code> and <code>rastreio</code>. <b>253 B</b> stay in the document. It is the same topology as SQL to SQL; only now the projector "speaks two dialects".',
        look: 'The event runs along the conveyor and 1056 shows up at the top of the card; the byte counter ends at 1,787.',
        key: 'The projector translates the event into the shape of the screen.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(f > 0 ? (done ? 'ok' : 'recv') : 'none'); o.rows.doc = done ? DOC8() : DOC7();
          o.rows.qry = act('meus-pedidos', 'PROJECTOR', ['e-1801 → 1056', 'acc'], ['336 B → 253 B', 'hi'], ['upsert into the document', 'dim']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, f, 'e-1801 · 336 B');
          o.cnt = [['1056 IN THE DOCUMENT', done ? '253 B' : '…'], ['THE EVENT', '336 B', 'dim'], ['DOCUMENT', done ? '1,787 B' : '7 orders', 'dim']];
          o.res = done ? [['8 orders: 1,787 B', 'acc']] : []; } },
      { id: 'chave', dur: 6, title: 'One read by key, no JOIN', yk: 'THE SCREEN ASKS FOR A KEY',
        code: ['GET meus_pedidos:lena-77', '→ 1 read, 1,787 B', 'no JOIN', 'no waiting for four services', 'the bff-app passes it along as is'],
        story: 'The screen asks for the document of <code>lena-77</code> and gets everything in one read: no JOIN, no waiting for four services. The <code>bff-app</code> passes the document along as it is.',
        look: 'The light goes from the phone to the document along the right path and comes back with the whole card.',
        key: 'A document is one read by key.',
        f(o, t) { const f = lin(t, 0.3, 4.3, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.doc = DOC8(); o.rows.bus.tape = EV('ok');
          o.rows.qry = act('meus-pedidos', 'QUERY', ['GET lena-77', 'acc'], ['1 read by key', 'hi']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [done ? '8 orders · 1056 on top' : 'opening…', done ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: true }, { pts: CAB.bc }, { pts: CAB.bq, on: true }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: true }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, [...WAY.qry, ...WAY.qdoc], Math.min(1, f * 2) < 1 ? f * 2 : 0, 'GET lena-77'); pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f * 2 - 1, '1,787 B');
          o.cnt = [['READS', '1'], ['JOIN', 'none', 'dim'], ['RESPONSE', '1,787 B', 'dim']];
          o.res = done ? [['the whole screen in one read', 'acc']] : []; } },
      { id: 'tamanho', dur: 5, title: '3.35 GB for 1.5 million customers', yk: 'THE SIZE MATH',
        code: ['1.5 M customers × 10 orders × 223 B', '  = 3.35 GB (read model)', 'pedidos table, 50 M rows (module 16):', '  100 GB + 40% indexes = 140 GB', 'it keeps only what the screen shows'],
        story: '1.5 million customers × 10 orders × 223 B = <b>3.35 GB</b> in the read storage. The 50-million-row <code>pedidos</code> table from module 16 weighs 100 GB plus 40% for indexes: <b>140 GB</b>. The read model is much smaller because it keeps only what the screen shows.',
        look: 'The write database, on the left, with 140 GB; the read one, on the right, with 3.35 GB.',
        key: 'Small by design: only what the screen shows.',
        f(o) { lit(o, 'db', 'doc'); o.rows.bus.tape = EV('ok');
          o.rows.db = TBL(['pedidos', 'tbl'], ['50 million rows', 'hi'], ['100 GB + 40% indexes', 'dim'], ['= 140 GB', 'acc']);
          o.rows.doc = DD(['1.5 million documents', 'hi'], ['× 10 orders × 223 B', 'dim'], ['= 3.35 GB', 'acc']);
          o.cnt = [['READ MODEL', '3.35 GB'], ['WRITE MODEL', '140 GB', 'dim'], ['PER ORDER', '223 B', 'dim']];
          o.res = [['3.35 GB against 140 GB', 'acc']]; } },
      { id: 'es', dur: 6, title: 'In Elasticsearch: nested, _seq_no and _primary_term', yk: 'THE ARTICLE\'S STORAGE',
        code: ['mapping: orders and items as "nested"', 'GET returns _version, _seq_no,', '  _primary_term', 'update with if_seq_no and', '  if_primary_term (optimistic concurrency)'],
        story: 'The article stores the document in <b>Elasticsearch</b>, in an index with a <code>mapping</code>, and the items as <code>nested</code> (each item becomes its own object, not flattened fields). On <code>GET</code>, it returns <code>_version</code>, <code>_seq_no</code> and <code>_primary_term</code>, which serve as concurrency control: an update with <code>if_seq_no</code> and <code>if_primary_term</code> only goes through if nobody changed the document before. A JSON column, a <i>document store</i> or Redis would also work.',
        look: 'The document shows the Elasticsearch control fields next to the orders.',
        key: 'The projector gains a dialect: partial upsert and concurrency control.',
        f(o) { lit(o, 'doc', 'qry'); o.rows.db = DB1(); o.rows.bus.tape = EV('ok');
          o.rows.doc = DD(['index with mapping', 'hi'], ['pedidos: nested', 'dim'], ['itens: nested', 'dim'], ['GET → _seq_no', 'acc'], ['     _primary_term', 'acc']);
          o.rows.qry = act('meus-pedidos', 'PROJECTOR', ['if_seq_no', 'acc'], ['if_primary_term', 'acc'], ['partial upsert', 'dim']);
          o.cnt = [['CONTROL', '_seq_no'], ['AND', '_primary_term', 'dim'], ['ITEMS', 'nested', 'dim']];
          o.res = [['whoever updates checks the version', 'acc']]; } },
      { id: 'fora-de-ordem', dur: 9, title: 'If it goes wrong: PedidoEnviado arrives before PedidoCriado', yk: 'OUT-OF-ORDER EVENT',
        code: ['arrives first: e-1805 PedidoEnviado', '  tracking LA123456791BR', '  1056 does not exist in the document yet', 'defense: partial upsert (creates only what it knows)', 'later: e-1801 completes the items'],
        story: 'The tracking for 1056 only exists the next day (<code>e-1805</code> <code>PedidoEnviado</code>, 09:10, <code>LA123456791BR</code>). Imagine that, because of a delay between partitions, it arrives <b>before</b> <code>PedidoCriado</code>. The projector tries to update an order that does not exist in the document. The defense is the partial <i>upsert</i>: create 1056 with only what the event knows (the tracking) and complete it when <code>e-1801</code> arrives, with <code>if_seq_no</code> and <code>if_primary_term</code> so two updates do not trample each other.',
        look: 'The e-1805 arrives first and the document lights up red; the partial upsert creates 1056 with only the tracking, and the e-1801 completes the items.',
        key: 'An out-of-order event calls for partial upsert and concurrency control.',
        f(o, t) { const f5 = lin(t, 0.3, 2.3, 0, 1), miss = f5 >= 1 && t < 3.6, part = t >= 3.6, f1 = lin(t, 4.6, 6.6, 0, 1), full = f1 >= 1;
          lit(o, 'bus'); o.on.doc = miss ? 'bad' : part ? 1 : 0;
          o.rows.db = DB1(); o.rows.bus.tape = [['e-1805', f5 > 0 ? 'bad' : 'none'], ['e-1801', f1 > 0 ? (full ? 'ok' : 'recv') : 'none']];
          const R = full ? [['1056 · enviado · 114.80', 'acc'], ['items: cat, mug', 'acc'], ['tracking LA123456791BR', 'acc']]
            : part ? [['1056 · tracking only', 'acc'], ['items: (missing)', 'bad'], ['tracking LA123456791BR', 'acc']]
            : miss ? [['update on 1056:', 'bad'], ['the order does not exist', 'bad']] : [['7 orders · v7', 'dim'], ['without 1056', 'dim']];
          o.rows.doc = DD(...R, ['1055 · 34.90', 'dim']);
          o.rows.qry = act('meus-pedidos', 'PROJECTOR', [miss ? 'update failed' : part ? 'partial upsert' : 'receiving', miss ? 'bad' : 'acc'], [full ? 'e-1801 completed it' : '', 'acc']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true, tone: f5 < 1 && f5 > 0 ? 'bad' : '' }];
          pk(o, WAY.ev, f5, 'e-1805 · PedidoEnviado', 'bad'); pk(o, WAY.ev, f1, 'e-1801 · PedidoCriado');
          o.cnt = [['ARRIVED FIRST', 'e-1805', 'bad'], ['1056', full ? 'complete' : part ? 'partial' : miss ? 'does not exist' : '…', full ? '' : 'bad'], ['DEFENSE', 'partial upsert', 'dim']];
          o.res = miss ? [['update on an order that does not exist', 'bad']] : full ? [['complete, in the order it arrived', 'acc']] : part ? [['created with only the tracking', 'acc']] : [];
          if (miss) T(o, TF(749), '1056 does not exist', 'bad'); } },
    ],
    distribuido: [
      { id: 'compoe', dur: 6, title: 'Composition: the bff-app calls 4 services', yk: 'API COMPOSITION (MODULE 9)',
        code: ['pedidos · pagamentos · entregas · catalogo', '0.999 × 0.999 × 0.999 × 0.999', '  = 0.999⁴ = 99.6006%', '= 172.5 min/month offline', 'the slowest decides the latency'],
        story: 'Today the <code>bff-app</code> (module 9) builds "my orders" by calling <code>pedidos</code>, <code>pagamentos</code>, <code>entregas</code> and <code>catalogo</code>, each with its own database. The screen only works if all four answer: at 99.9% each, 0.999⁴ = <b>99.6006%</b>, or <b>172.5 min/month</b> offline (the serial math from module 12). The slowest one decides the latency, and every service enters the screen\'s blast radius.',
        look: 'Four cables leave the bff-app, one to each service on the left. The right side is dark.',
        key: 'Composition adds up the risk of four services.',
        f(o) { distBase(o); lit(o, 'bff', 'cmd', 'pag', 'ent', 'cat');
          o.rows.bff = act('bff-app', 'COMPOSES', ['calls 4 services', 'acc'], ['waits for the slowest', 'dim']);
          compose(o, false);
          o.cnt = [['AVAILABILITY', '99.6006%'], ['OFFLINE PER MONTH', '172.5 min', 'dim'], ['SERVICES CALLED', '4', 'dim']];
          o.res = [['all 4 must answer', 'acc']]; } },
      { id: 'cai', dur: 6, title: 'pagamentos goes down: the composed screen fails', yk: 'ONE OF THE FOUR IS DOWN', act: ['Take pagamentos down', 'composition'],
        code: ['pagamentos: down', 'bff-app: 3 of 4 answered', 'the screen fails, or shows', '  "status unavailable" (fallback, module 9)', 'blast radius: the whole screen'],
        story: 'The <code>pagamentos</code> service goes down. The composed screen depends on it: it either fails, or shows "status unavailable", the <i>fallback</i> from module 9. One service down takes out a screen that is not even its own.',
        look: 'pagamentos turns red and so does its cable; Lena\'s screen turns red.',
        key: 'In composition, any source being down takes the screen down.',
        f(o, t) { distBase(o); const down = t > 0.8; lit(o, 'bff', 'cmd', 'ent', 'cat'); o.on.pag = down ? 'bad' : 1; if (down) o.on.lena = 'bad';
          o.rows.pag = act('pagamentos', down ? 'DOWN' : 'SERVICE', [down ? 'not answering' : 'PedidoPago · card', down ? 'bad' : 'dim']);
          o.rows.bff = act('bff-app', 'COMPOSES', [down ? '3 of 4 answered' : 'calls 4 services', down ? 'bad' : 'acc'], [down ? '"status unavailable"' : 'waits for the slowest', down ? 'bad' : 'dim']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [down ? 'status unavailable' : '1056 · paid', down ? 'bad' : 'acc']);
          compose(o, down);
          o.cnt = [['COMPOSED SCREEN', down ? 'fails' : 'ok', down ? 'bad' : ''], ['SERVICES UP', down ? '3 of 4' : '4 of 4', 'dim'], ['FALLBACK', down ? '"unavailable"' : '…', 'dim']];
          o.res = down ? [['one service down, screen down', 'bad']] : [];
          if (down) T(o, [155, 70, 40], 'pagamentos down', 'bad'); } },
      { id: 'eventos', dur: 8, title: 'From events: 3 topics feed one document', yk: 'THE CQRS PATTERN FROM MICROSERVICES.IO',
        code: ['pedidos     → PedidoCriado  (items)', 'pagamentos  → PedidoPago    (card)', 'entregas    → PedidoEnviado (tracking)', 'catalogo: not needed (the event', '  already carries name and price at the time)'],
        story: 'The other way: each owner publishes its event. <code>PedidoCriado</code> (from <code>pedidos</code>), <code>PedidoPago</code> (from <code>pagamentos</code>) and <code>PedidoEnviado</code> (from <code>entregas</code>) feed <b>one</b> document. The <code>catalogo</code> does not need to join in: the event already carries the name and price at the time. It is the "CQRS" pattern from microservices.io, the alternative to <i>API Composition</i>.',
        look: 'Three sources send events to the conveyor; the projector joins everything into the 1056 document. The catalogo stays dark.',
        key: 'The read model is built from the events of several owners.',
        f(o, t) { distBase(o); const fc = lin(t, 0.3, 2.3, 0, 1), fp = lin(t, 2.3, 4.3, 0, 1), fe = lin(t, 4.3, 6.3, 0, 1);
          lit(o, 'bus'); if (fc > 0 && fc < 1) lit(o, 'cmd'); if (fp > 0 && fp < 1) lit(o, 'pag'); if (fe > 0 && fe < 1) lit(o, 'ent'); if (fc >= 1) lit(o, 'doc');
          o.rows.bus.tape = [['pedidos', fc >= 1 ? 'ok' : fc > 0 ? 'recv' : 'none'], ['pagamentos', fp >= 1 ? 'ok' : fp > 0 ? 'recv' : 'none'], ['entregas', fe >= 1 ? 'ok' : fe > 0 ? 'recv' : 'none']];
          o.rows.doc = DD(['1056', 'hi'], [fc >= 1 ? 'items: cat, mug ✓' : 'items: …', fc >= 1 ? 'acc' : 'dim'], [fp >= 1 ? 'payment: card ✓' : 'payment: …', fp >= 1 ? 'acc' : 'dim'], [fe >= 1 ? 'tracking: LA123456791BR ✓' : 'tracking: …', fe >= 1 ? 'acc' : 'dim']);
          o.rows.qry = act('meus-pedidos', 'PROJECTOR', ['3 topics → 1 document', 'acc'], ['upsert by pedido_id', 'dim']);
          o.rows.cat = act('catalogo', 'NOT NEEDED', ['the event already has the name', 'dim']);
          only(o, { pts: CAB.qdoc }, { pts: CAB.bq }, { pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.ecmd, on: fc > 0 && fc < 1 }, { pts: CAB.epag, on: fp > 0 && fp < 1 }, { pts: CAB.eent, on: fe > 0 && fe < 1 });
          pk(o, [...CAB.ecmd, ...ONBUS(168)], fc, 'PedidoCriado'); pk(o, [...CAB.epag, ...ONBUS(108)], fp, 'PedidoPago'); pk(o, [...CAB.eent, ...ONBUS(142)], fe, 'PedidoEnviado');
          o.cnt = [['TOPICS', '3'], ['PROJECTOR', '1', 'dim'], ['STORAGE', '1', 'dim']];
          o.res = fe >= 1 ? [['1056 complete in one document', 'acc']] : []; } },
      { id: 'le', dur: 5, title: 'The screen reads a single place: 99.9%', yk: 'ONE STORAGE',
        code: ['GET /meus-pedidos → 1 document', 'availability: 99.9%', '= 43.2 min/month offline', 'against 99.6006% and 172.5 min/month', 'latency: one read by key'],
        story: 'Now the screen reads a single place: <b>99.9%</b>, or <b>43.2 min/month</b> offline, against the 172.5 of composition. The latency is that of one read by key, not that of the slowest of four. The price: three topics, one projector, one storage, and a multiplied eventual consistency, because each source has its own delay.',
        look: 'Only the right path lights up: phone, bff-app, meus-pedidos, document.',
        key: 'The event-based model takes the four services out of the screen\'s path.',
        f(o, t) { distBase(o); const f = lin(t, 0.3, 3.3, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.bus.tape = [['pedidos', 'ok'], ['pagamentos', 'ok'], ['entregas', 'ok']];
          o.rows.doc = DD(['1056', 'hi'], ['items: cat, mug', 'acc'], ['payment: card', 'acc'], ['tracking: LA123456791BR', 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], [done ? '1056 · complete' : 'opening…', done ? 'acc' : 'dim']);
          only(o, { pts: CAB.qdoc, on: true }, { pts: CAB.bq, on: true }, { pts: CAB.lb, on: true }, { pts: CAB.bc }, { pts: CAB.trunk }, { pts: CAB.bpag }, { pts: CAB.bent }, { pts: CAB.bcat });
          pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f, '1 document');
          o.cnt = [['AVAILABILITY', '99.9%'], ['OFFLINE PER MONTH', '43.2 min', 'dim'], ['COMPOSITION', '172.5 min', 'dim']];
          o.res = done ? [['a single place: 43.2 min/month', 'acc']] : []; } },
      { id: 'cai-de-novo', dur: 6, title: 'pagamentos goes down again: the screen keeps working', yk: 'THE SAME OUTAGE, ANOTHER DRAWING', act: ['Take pagamentos down', 'read model'],
        code: ['pagamentos: down', 'the pagamentos topic stops receiving', 'the document keeps the last status:', '  payment: card', 'the screen stays up'],
        story: 'The same <code>pagamentos</code> goes down. Now the screen does not call it: it reads the document, which keeps the <b>last status</b> it knows (<code>pagamento: cartão</code>). Lena keeps seeing 1056. What stops is only the payment update, until the service comes back and the topic moves again.',
        look: 'pagamentos turns red, but the right path stays lit and so does Lena\'s screen.',
        key: 'The event-based model isolates the screen from the failure of a source.',
        f(o, t) { distBase(o); const down = t > 0.8; lit(o, 'doc', 'qry', 'lena'); o.on.pag = down ? 'bad' : 1;
          o.rows.pag = act('pagamentos', down ? 'DOWN' : 'SERVICE', [down ? 'not publishing' : 'PedidoPago · card', down ? 'bad' : 'dim']);
          o.rows.bus.tape = [['pedidos', 'ok'], ['pagamentos', down ? 'bad' : 'ok'], ['entregas', 'ok']];
          o.rows.doc = DD(['1056', 'hi'], ['items: cat, mug', 'acc'], ['payment: card', 'acc'], [down ? '(last known status)' : 'tracking: LA123456791BR', down ? 'dim' : 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['my orders', 'dim'], ['1056 · paid (card)', 'acc']);
          only(o, { pts: CAB.qdoc, on: true, flow: true }, { pts: CAB.bq, on: true, flow: true }, { pts: CAB.lb, on: true, flow: true }, { pts: CAB.epag, tone: down ? 'bad' : '' }, { pts: CAB.eent }, { pts: CAB.ecmd }, { pts: CAB.bc });
          o.cnt = [['THE SCREEN', 'up'], ['PAGAMENTOS', down ? 'down' : 'ok', down ? 'bad' : 'dim'], ['STATUS SHOWN', 'the last: card', 'dim']];
          o.res = down ? [['one source down, screen up', 'acc']] : [];
          if (down) T(o, [155, 70, 40], 'pagamentos down', 'bad'); } },
      { id: 'fantasma', dur: 10, title: 'If it goes wrong: the ghost order with no items', yk: 'THE PedidoCriado GOT LOST',
        code: ['PedidoCriado of 1056: never arrives', 'PedidoPago and PedidoEnviado: arrive', '→ 1056 with payment and tracking, no items', 'checker: no items for more than 5 min?', '  GET /pedidos/1056 and completes it'],
        story: 'Suppose the <code>PedidoCriado</code> of 1056 never reaches the read model (the dual write from lesson 8 shows how this happens), but <code>PedidoPago</code> and <code>PedidoEnviado</code> do. The 1056 document ends up with payment and tracking and <b>no items</b>: a ghost order that never completes. The defense is a <b>checker</b> (reconciliation): for documents without items for more than 5 minutes, it calls <code>GET /pedidos/1056</code> and fills in what is missing.',
        look: 'PedidoCriado vanishes on the way; the other two arrive and the document turns red, with no items. Then the checker fetches the order from pedidos and completes it.',
        key: 'An incomplete document is a real state: reconciliation exists for that.',
        f(o, t) { distBase(o); const fc = lin(t, 0.3, 1.6, 0, 0.45), fp = lin(t, 1.2, 3, 0, 1), fe = lin(t, 2.4, 4.2, 0, 1), ghost = fe >= 1 && t < 7, fix = lin(t, 7, 8.6, 0, 1), done = fix >= 1;
          lit(o, 'bus'); o.on.doc = ghost ? 'bad' : done ? 1 : 0; if (fix > 0 && !done) lit(o, 'cmd'); if (fc > 0 && t < 2) o.on.cmd = 1;
          o.rows.bus.tape = [['pedidos', fc >= 0.45 ? 'bad' : fc > 0 ? 'recv' : 'none'], ['pagamentos', fp >= 1 ? 'ok' : 'none'], ['entregas', fe >= 1 ? 'ok' : 'none']];
          o.rows.doc = DD(['1056', ghost ? 'bad' : 'hi'], [done ? 'items: cat, mug ✓' : 'items: (none)', done ? 'acc' : fe >= 1 ? 'bad' : 'dim'], [fp >= 1 ? 'payment: card' : 'payment: …', fp >= 1 ? 'acc' : 'dim'], [fe >= 1 ? 'tracking: LA123456791BR' : 'tracking: …', fe >= 1 ? 'acc' : 'dim']);
          o.rows.qry = act('meus-pedidos', 'CHECKER', [t < 5 ? 'waiting' : done ? 'completed 1056' : 'no items for > 5 min', done ? 'acc' : t < 5 ? 'dim' : 'bad'], [t >= 7 ? 'GET /pedidos/1056' : '', 'acc']);
          only(o, { pts: CAB.qdoc, on: fix > 0 && !done }, { pts: CAB.bq, on: fix > 0 && !done }, { pts: CAB.bc, on: fix > 0 && !done }, { pts: CAB.lb },
            { pts: CAB.ecmd, tone: fc >= 0.45 ? 'bad' : '', on: fc > 0 && fc < 0.45 }, { pts: CAB.epag, on: fp > 0 && fp < 1 }, { pts: CAB.eent, on: fe > 0 && fe < 1 });
          if (fc < 0.45) pk(o, [...CAB.ecmd, ...ONBUS(168)], fc, 'PedidoCriado', 'bad');
          pk(o, [...CAB.epag, ...ONBUS(108)], fp, 'PedidoPago'); pk(o, [...CAB.eent, ...ONBUS(142)], fe, 'PedidoEnviado');
          pk(o, P3([[749, 230], [749, 322], [594, 322, ZT], [310, 322, ZT], [270, 322]]), fix, 'GET /pedidos/1056');
          o.cnt = [['1056', done ? 'complete' : ghost ? 'no items' : '…', ghost ? 'bad' : ''], ['PedidoCriado', fc >= 0.45 ? 'lost' : '…', 'bad'], ['CHECKER', '> 5 min without items', 'dim']];
          o.res = ghost ? [['ghost order: never completes', 'bad']] : done ? [['reconciliation completed it', 'acc']] : [];
          if (fc >= 0.45 && t < 7) T(o, [300, 220, 30], 'PedidoCriado lost', 'bad'); } },
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
  // a fita da esteira: células em fila; acesa = aplicada, contorno = no caminho, vazia = ainda não saiu, vermelha = perdida/erro
  function drawTape(x, u, C, tape, W_, H_, label) {
    const n = tape.length, lw = 46, gap = 3, cw = Math.min(70, (W_ - 10 - lw - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 6, light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, label, 10, lw - 4); x.fillText(label, u(5), u(y0 + ch / 2));
    tape.forEach(([lab, s], i) => { const X = 5 + lw + i * (cw + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      x.strokeStyle = s === 'recv' ? accC() : s === 'none' ? C.line : s === 'bad' ? BAD() : accC(); x.lineWidth = u(s === 'recv' ? 1.4 : 0.6);
      if (s === 'recv') x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(X + 0.5), u(y0 + 0.5), u(cw - 1), u(ch - 1)); x.setLineDash([]);
      if (lab) { x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : s === 'recv' ? accC() : INK();
        fitFont(x, u, lab, 12, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; } });
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : 21;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn], i) => {
      if (tn === 'tbl') {   // cabeçalho de tabela: uma aba do tamanho do nome, com um respiro antes (menos na primeira)
        if (i) y += 4; fitFont(x, u, text, fs - 1, W_ - 14); const tw = x.measureText(text).width / u(1) + 8;
        x.fillStyle = on === 'bad' ? BAD() : accC(); x.fillRect(u(4), u(y - lh / 2 + 2), u(tw), u(lh - 4));
        x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillText(text, u(8), u(y + 0.5));
      } else if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); }
      y += lh; });
    if (d.tape) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'KAFKA');
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
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
  const DATA = {
    'dois-modelos': () => `<li>The <code>e-1801</code> event (compact JSON, <b>336 B</b>): <code>{"evento_id":"e-1801","tipo":"PedidoCriado","pedido_id":1056,"cliente_id":"lena-77","versao":1,"itens":[{"produto_id":42,"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990},{"produto_id":7,"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"frete_centavos":1500,"total_centavos":11480,"criado_em":"2026-11-27T20:12:00.000-03:00"}</code></li><li>The <i>notification</i> version (only <code>evento_id</code>, <code>tipo</code>, <code>pedido_id</code>, <code>versao</code>) is <b>72 B</b> and forces a call back</li><table class="h3-sum"><tr><th>model</th><th>shape</th><th>this is how 1056 looks</th></tr><tr${step < 4 ? ' class="on"' : ''}><td>write</td><td>normalized</td><td>1 row in pedidos + 2 in itens_pedido</td></tr><tr${step >= 4 ? ' class="on"' : ''}><td>read</td><td>denormalized</td><td>253 B inside the 1,787 B document</td></tr></table><li>The screen's query on the normalized model (PostgreSQL 14, 5 tables, 8 orders, with an index): <code>Execution Time</code> <b>0.23 to 0.31 ms</b>, ~100 pages in <code>shared hit</code></li><li>Martin Fowler: "for most systems CQRS adds risky complexity"</li><li>CQRS is not <i>event sourcing</i> (module 20) and does not require two databases</li>`,
    view: () => `<table class="h3-sum"><tr><th>measure (PostgreSQL 14)</th><th>300 thousand</th><th>50 M (est.)</th></tr><tr${step === 0 ? ' class="on"' : ''}><td>report</td><td>~235 ms</td><td>~40 s</td></tr><tr${step === 1 ? ' class="on"' : ''}><td>create the view</td><td>406 ms</td><td></td></tr><tr${step === 2 ? ' class="on"' : ''}><td>read the view</td><td>0.021 ms</td><td>~0.021 ms</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>REFRESH</td><td>401 ms</td><td>~67 s</td></tr><tr${step === 4 ? ' class="on"' : ''}><td>REFRESH CONCURRENTLY</td><td>340 ms</td><td>~57 s</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>reader waiting, plain</td><td>2,285 ms</td><td>up to ~67 s</td></tr><tr${step === 4 ? ' class="on"' : ''}><td>reader waiting, concurrent</td><td>12 ms</td><td>little</td></tr></table><li>Three runs of the report: 238.8 · 240.7 · 227.6 ms</li><li>Blocked reader: <code>wait_event_type = Lock</code>, <code>wait_event = relation</code></li><li>After a mug order: <b>100003 | 150004</b> until the <code>REFRESH</code>; <b>100004 | 150005</b> after</li><li>The article's table (<code>vw_prescricoes_medicamentos_detalhadas</code>, with <code>INSERT … SELECT</code>) is a denormalized table, not a materialized view</li>`,
    replica: () => `<li>Replica in <i>hot standby</i>, <code>max_standby_streaming_delay = 1s</code> (PostgreSQL 14.24, 10/20/2026):</li><table class="h3-sum"><tr><th>t</th><th>what happened</th></tr><tr><td>0 s</td><td>6 s query on the replica</td></tr><tr><td>2 s</td><td>DELETE + VACUUM on the primary</td></tr><tr class="on"><td>3.16 s</td><td>the query dies</td></tr></table><li><b>ERROR: canceling statement due to conflict with recovery</b> · DETAIL: User query might have needed to see row versions that must be removed.</li><li>Documentation default: <code>max_standby_streaming_delay</code> = <b>30 s</b>; the ~40 s report would be cancelled</li><li>Fixes: <code>hot_standby_feedback</code> (the primary does not clean: the table bloats) or raise the delay (the replica falls further behind)</li><li>Black Friday: Recife <b>800 ms</b> behind; Lena ~2 ms from Recife, 80 ms from SP</li>`,
    eventual: () => `<table class="h3-sum"><tr><th>stage (example)</th><th>+ms</th><th>clock</th></tr><tr><td>commit</td><td>4</td><td>.004</td></tr><tr><td>CDC reads the WAL</td><td>30</td><td>.034</td></tr><tr><td>Kafka, acks=all</td><td>10</td><td>.044</td></tr><tr class="on"><td>Lena opens the screen</td><td></td><td>.050</td></tr><tr><td>the consumer picks up</td><td>20</td><td>.064</td></tr><tr><td>upsert into the document</td><td>10</td><td>.074</td></tr></table><table class="h3-sum"><tr><th>Black Friday</th><th>result</th></tr><tr${step === 6 ? ' class="on"' : ''}><td>1 instance: 120/s in, 100/s out</td><td>12,000 events in 10 min = 120 s</td></tr><tr${step === 7 ? ' class="on"' : ''}><td>3 instances: 40/s each</td><td>40% usage</td></tr><tr${step === 7 ? ' class="on"' : ''}><td>1 of 3 down 10 min</td><td>24,000 events, 400 s to drain</td></tr><tr><td>the lab's relay (2 s poll)</td><td>1 s on average, 2 s in the worst case</td></tr></table><li>Rebuilding from scratch: 200 million events at 20,000/s = <b>2 h 47 min</b>; the topic keeps only 7 days</li><li><code>hospital-cqrs-sql/internal/events/handler.go</code>: <code>INSERT</code> without <code>ON CONFLICT</code> (read in the code, not run)</li>`,
    documento: () => `<table class="h3-sum"><tr><th>item</th><th>value</th></tr><tr${step === 0 ? ' class="on"' : ''}><td>Lena's document (8 orders)</td><td>1,787 B</td></tr><tr><td>average per order</td><td>223 B</td></tr><tr${step === 1 ? ' class="on"' : ''}><td>order 1056 (2 items, criado)</td><td>253 B</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>1.5 M customers × 10 × 223 B</td><td>3.35 GB</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>pedidos table (50 M rows)</td><td>140 GB</td></tr><tr><td>PedidoCriado event (e-1801)</td><td>336 B</td></tr></table><li>Sizes counted in Python, compact JSON in UTF-8 (the "ú" in "pelúcia" takes 2 bytes)</li><li>Elasticsearch: <code>nested</code> on the items; <code>_version</code>, <code>_seq_no</code>, <code>_primary_term</code> on <code>GET</code>; <code>if_seq_no</code>/<code>if_primary_term</code> to update</li><li>Changing the type of a <code>mapping</code> field requires a new index and reindexing from the source</li><li>In the article, the <code>mapping</code> is created at <code>PUT /prontuarios</code> and the document written to <code>POST /prescricoes/_doc/1</code>: the mapping does not apply to the other index</li>`,
    distribuido: () => `<table class="h3-sum"><tr><th></th><th>composition</th><th>from events</th></tr><tr><td>availability</td><td>0.999⁴ = 99.6006%</td><td>99.9%</td></tr><tr><td>offline per month</td><td>172.5 min</td><td>43.2 min</td></tr><tr><td>latency</td><td>that of the slowest</td><td>1 read by key</td></tr><tr${step === 1 || step === 4 ? ' class="on"' : ''}><td>pagamentos goes down</td><td>the screen fails</td><td>shows the last status</td></tr><tr><td>consistency</td><td>strong, at the call</td><td>eventual, per source</td></tr><tr><td>new pieces</td><td>none</td><td>3 topics, 1 projector, 1 storage</td></tr></table><li>Order: Kafka only guarantees order within a partition; <code>PedidoPago</code> can arrive before <code>PedidoCriado</code>: partial upsert by <code>pedido_id</code> and <code>versao</code> per source</li><li>Tracking for 1056: <code>LA123456791BR</code> (e-1805, next day, 09:10)</li><li>Checker: documents without items for more than 5 min → <code>GET /pedidos/1056</code></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // step action button (place 1056, open the screen, use the token, take pagamentos down…): moves on to the next step
  function actHtml() { const a = cur().act; if (!a) return '';
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
  function readout() { if (active !== 'cqrs') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cqrs' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-cqrs3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'cqrs') return;
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
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placePiles(o.piles); drawScreen(o);
    // na Réplica, o RTT de cada cabo fica escrito ao lado dele (balões discretos), antes dos balões do passo
    const all = (o.rtt ? [[452, 128, Z + 12, 'RTT 10 ms', 'dim'], [452, 214, Z + 12, 'RTT 80 ms', 'dim']] : []).concat(o.tags);
    TAGS.forEach((t, i) => { const g = all[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
