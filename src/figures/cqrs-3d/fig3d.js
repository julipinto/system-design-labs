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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const clock = ms => { const v = Math.max(0, Math.round(ms)), s = Math.floor(v / 1000); return '20:12:' + String(s).padStart(2, '0') + '.' + String(v % 1000).padStart(3, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['dois-modelos', 'view', 'replica', 'eventual', 'documento', 'distribuido'];
  const SCNAME = { 'dois-modelos': 'Dois modelos', view: 'View', replica: 'Réplica', eventual: 'Eventual', documento: 'Documento', distribuido: 'Distribuído' };
  const SCFULL = { 'dois-modelos': 'Comando e consulta', view: 'A view materializada', replica: 'A réplica de leitura',
    eventual: 'Consistência eventual', documento: 'O documento da Lena', distribuido: 'Vários serviços, um documento' };
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
  const OLD = ['1055 · 34,90', '1054', '1051', '1048', '1047', '1044', '1042'];
  // o documento meus_pedidos:lena-77: resumo + pedidos, o mais novo primeiro
  const DOC = (top, sum, tone = 'acc') => { const d = act('meus_pedidos:lena-77', '', sum, ...(top ? [[top, tone]] : []), ...OLD.slice(0, top ? 7 : 7).map(r => [r, 'dim']));
    d.fs = 12.5; d.lh = 15.5; d.y0 = 39; return d; };
  const DOC7 = () => DOC(null, ['7 pedidos · v7', 'dim']), DOC8 = () => DOC('1056 · criado · 114,80', ['8 pedidos · 1.787 B · v8', 'acc']);
  const TBL = (...r) => { const d = act('PostgreSQL loja', 'ESCRITA', ...r); d.fs = 13.5; d.lh = 19; return d; };
  const DB0 = () => TBL(['pedidos', 'tbl'], ['1055 · lena-77 · 34,90', 'dim'], ['itens_pedido', 'tbl'], ['1055 · 7 · 1 × 19,90', 'dim']);
  const DB1 = () => TBL(['pedidos', 'tbl'], ['1056 · lena-77 · 114,80', 'acc'], ['1055 · lena-77 · 34,90', 'dim'], ['itens_pedido', 'tbl'], ['1056 · 42 · 1 × 79,90', 'acc'], ['1056 · 7 · 1 × 19,90', 'acc']);
  const EV = (...st) => ['e-1801', 'e-1802', 'e-1803', 'e-1804', 'e-1805'].map((l, i) => [l, st[i] || 'none']);
  function base() {
    const o = { show: { db: 1, cmd: 1, doc: 1, qry: 1, bus: 1, bff: 1, lena: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    o.rows.db = DB0();
    o.rows.cmd = act('pedidos', 'COMANDO', ['CriarPedido', 'hi'], ['regras + transação', 'dim'], ['estoque: gato 20 · caneca 36', 'dim']);
    o.rows.doc = DOC7();
    o.rows.qry = act('meus-pedidos', 'CONSULTA', ['MeusPedidos(cliente)', 'hi'], ['regras: nenhuma', 'dim'], ['lê o documento por chave', 'dim']);
    o.rows.bus = act('eventos', 'ESTEIRA'); o.rows.bus.tape = EV(); o.rows.bus.tapeLabel = 'KAFKA';
    o.rows.bff = act('bff-app', 'BFF', ['POST /pedidos → pedidos', 'dim'], ['GET /meus-pedidos → meus-pedidos', 'dim']);
    o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], ['1055 · 34,90', 'hi']);
    o.rows.pag = act('pagamentos', 'SERVIÇO', ['PedidoPago · cartão', 'dim']);
    o.rows.ent = act('entregas', 'SERVIÇO', ['PedidoEnviado · rastreio', 'dim']);
    o.rows.cat = act('catalogo', 'SERVIÇO', ['nome e preço de hoje', 'dim']);
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
    db: (() => { const d = act('pg-sp', 'PRIMÁRIO', ['SP · lê e escreve', 'dim'], ['mesmo esquema: 5 tabelas', 'dim'], ...(st.sp || [])); return d; })(),
    doc: (() => { const d = act('pg-rio', 'RÉPLICA', ['mesmo esquema: 5 tabelas', 'dim'], ['RTT até SP: 10 ms', 'dim'], ...(st.rio || [])); return d; })(),
    qry: act('pg-recife', 'RÉPLICA', ...(st.rec || [['mesmo esquema: 5 tabelas', 'dim'], ['RTT até SP: 80 ms', 'dim']])),
  });
  function replicaBase(o, st) {
    hide(o, 'bus'); const r = REP(st); o.rows.db = r.db; o.rows.doc = r.doc; o.rows.qry = r.qry;
    o.rows.cmd = act('pedidos', 'ESCREVE EM SP', ['INSERT só no primário', 'dim']);
    o.rows.bff = act('relatório 23:00', 'CONSULTA LONGA', ['~40 s nas 50 milhões', 'dim'], ['(estimativa linear)', 'dim']);
    o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], ['lê de Recife', 'hi']);
    only(o, { pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec }, { pts: CAB.bq }, { pts: CAB.lrec });
    o.rtt = 1;
  }
  // ── cenário View: o documento vira a view, o meus-pedidos vira o leitor ──
  const MV = (...r) => { const d = act('faturamento_cidade_produto', '', ['VIEW · mesmo banco loja · 5 linhas', 'dim'], ...r); d.fs = 13.5; d.lh = 19; return d; };
  const MVROW = (p, u, tn = 'hi') => [`Recife · caneca azul · ${p}`, tn];
  function viewBase(o) {
    hide(o, 'bus', 'lena');
    o.rows.db = TBL(['pedidos', 'tbl'], ['300.008 linhas', 'dim'], ['itens_pedido', 'tbl'], ['600.009 linhas', 'dim'], ['produtos · 3 linhas', 'dim']);
    o.rows.doc = MV(MVROW('100003'), ['unidades 150004', 'dim'], ['+ 4 linhas (cidade × produto)', 'dim']);
    o.rows.qry = act('leitor', 'SESSÃO 2', ['SELECT … FROM', 'dim'], ['faturamento_cidade_produto', 'dim']);
    o.rows.cmd = act('sessão 1', 'REFRESH', ['ainda parada', 'dim']);
    o.rows.bff = act('relatório 23:00', 'CONSULTA', ['faturamento por cidade e produto', 'dim'], ['pedidos × itens × produtos', 'dim']);
    only(o, { pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.qdoc }, { pts: CAB.rdb });
  }
  // ── cenário Distribuído: pagamentos, entregas e catalogo no lugar do banco ──
  function distBase(o) {
    hide(o, 'db'); showX(o, 'pag', 'ent', 'cat');
    o.rows.cmd = act('pedidos', 'SERVIÇO', ['PedidoCriado · itens', 'dim'], ['nome e preço da época', 'dim']);
    o.rows.bus = act('eventos', '3 TÓPICOS'); o.rows.bus.tape = [['pedidos', 'none'], ['pagamentos', 'none'], ['entregas', 'none']]; o.rows.bus.tapeLabel = 'KAFKA';
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
      { id: 'lados', dur: 5, title: 'Dois modelos, uma tela', yk: 'OS DOIS LADOS', act: ['Fazer o 1056', 'CriarPedido'],
        code: ['comando   CriarPedido → pedidos', '          PostgreSQL loja (normalizado)', 'consulta  MeusPedidos → meus-pedidos', '          meus_pedidos:lena-77 (documento)', 'no meio:  a esteira de eventos'],
        story: 'À esquerda, o lado do <b>comando</b>: o serviço <code>pedidos</code> e o PostgreSQL <code>loja</code>, com as tabelas normalizadas <code>pedidos</code> e <code>itens_pedido</code>. À direita, o lado da <b>consulta</b>: o serviço novo <code>meus-pedidos</code> e o documento da Lena, no formato da tela. No meio, a esteira de eventos leva o que muda de um lado para o outro. Na frente, o <code>bff-app</code> e o celular da Lena, em Recife.',
        look: 'Dois caminhos saem do bff-app: o da esquerda escreve, o da direita lê, e cada um tem o seu armazenamento.',
        key: 'O CQRS separa quem muda o estado de quem lê, em modelos diferentes.',
        f(o) { lit(o, 'cmd', 'qry');
          o.cnt = [['MODELOS', '2'], ['COMANDO', 'pedidos', 'dim'], ['CONSULTA', 'meus-pedidos', 'dim']];
          o.res = [['um modelo escreve, o outro lê', 'acc']];
          T(o, [155, 446, 24], 'comando', 'dim'); T(o, [749, 446, 24], 'consulta', 'dim'); } },
      { id: 'comando', dur: 5, title: 'CriarPedido: o 1056 entra pelo lado do comando', yk: 'O COMANDO, ÀS 20:12:00.000',
        code: ['POST /pedidos   (bff-app → pedidos)', 'CriarPedido(cliente = lena-77)', '  1 gato de pelúcia   79,90', '  1 caneca azul       19,90', '  frete Recife        15,00  = 114,80'],
        story: 'Às <b>20:12:00.000</b> da Black Friday a Lena fecha a compra: 1 gato de pelúcia (79,90), 1 caneca azul (19,90) e o frete de Recife (15,00), <b>114,80</b>. O <code>bff-app</code> manda o comando <code>CriarPedido</code> ao serviço <code>pedidos</code>. É uma ordem no imperativo: muda estado e pode ser recusada por regra.',
        look: 'O ponto de luz sai do celular, passa pelo bff-app e entra no pedidos, pelo caminho da esquerda.',
        key: 'Comando é imperativo, muda estado e pode falhar por regra.',
        f(o, t) { const f = lin(t, 0.4, 3.2, 0, 1); lit(o, 'lena', 'bff'); if (f >= 1) lit(o, 'cmd');
          o.rows.lena = act('Lena', 'Recife', ['comprando…', 'acc'], ['total 114,80', 'hi']);
          o.beams = [{ pts: CAB.lb, on: f < 1 }, { pts: CAB.bc, on: f < 1 }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, WAY.cmd, f, 'CriarPedido 1056');
          o.cnt = [['RELÓGIO', clock(0)], ['TOTAL', '114,80', 'dim'], ['ITENS', '2 + frete', 'dim']];
          o.res = f >= 1 ? [['o comando chegou ao pedidos', 'acc']] : []; } },
      { id: 'valida', dur: 7, title: 'As validações antes do INSERT', yk: 'O QUE O CriarPedido CONFERE',
        code: ['1. cliente lena-77 existe', '2. produto 42 ativo', '3. preço vigente 79,90 (módulo 5)', '4. estoque: 20 gatos, 36 canecas', '5. frete Recife 15,00', 'só então: INSERT'],
        story: 'O comando é rico em regras. Antes de gravar, o <code>CriarPedido</code> confere o cliente (<code>lena-77</code> existe), o produto 42 (ativo), o <b>preço vigente</b> (79,90, o valor do módulo 5), o estoque (20 gatos e 36 canecas) e o frete de Recife (15,00). Se uma regra falhar, o comando é recusado e nada é gravado. Quem decide é o agregado <code>Pedido</code>.',
        look: 'As validações acendem uma a uma no bloco do pedidos. O lado da consulta continua apagado: lá não há regra nenhuma.',
        key: 'A regra mora só no comando.',
        f(o, t) { const n = Math.floor(lin(t, 0.4, 5.4, 0, 5.99)); lit(o, 'cmd');
          const V = ['cliente lena-77 ✓', 'produto 42 ativo ✓', 'preço 79,90 ✓', 'estoque 20 · 36 ✓', 'frete Recife 15,00 ✓'];
          o.rows.cmd = act('pedidos', 'COMANDO', ...V.map((v, i) => i < n ? [v, 'acc'] : null)); o.rows.cmd.fs = 14; o.rows.cmd.lh = 17; o.rows.cmd.y0 = 39;
          if (!n) o.rows.cmd.rows = [['validando…', 'dim']];
          o.cnt = [['VALIDAÇÕES', `${n} de 5`], ['NO COMANDO', 'regras', 'dim'], ['NA CONSULTA', 'nenhuma', 'dim']];
          o.res = n >= 5 ? [['tudo certo: pode gravar', 'acc']] : [['conferindo…', 'dim']]; } },
      { id: 'grava', dur: 6, title: 'Grava pedidos e itens_pedido numa transação', yk: 'NO POSTGRESQL loja',
        code: ['BEGIN;', "INSERT INTO pedidos VALUES (1056, 'lena-77', …);", 'INSERT INTO itens_pedido … (42, 1, 79,90);', 'INSERT INTO itens_pedido … (7, 1, 19,90);', 'COMMIT;   -- 20:12:00.004'],
        story: 'Só então o comando grava: <b>1 linha</b> em <code>pedidos</code> e <b>2</b> em <code>itens_pedido</code>, na mesma transação (ACID): ou as duas tabelas recebem o 1056, ou nenhuma. O <code>COMMIT</code> fecha às <b>20:12:00.004</b>. O estoque passa a 19 gatos e 35 canecas.',
        look: 'As linhas do 1056 acendem nas duas tabelas do banco, normalizadas: o pedido mora uma vez, os itens em outra tabela.',
        key: 'O modelo de escrita é normalizado e transacional.',
        f(o, t) { const ms = lin(t, 0.4, 3, 0, 4), ok = ms >= 4; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.cmd = act('pedidos', 'COMANDO', ['5 de 5 validações', 'acc'], [ok ? 'COMMIT às .004' : 'gravando…', ok ? 'acc' : 'dim'], [ok ? 'estoque: gato 19 · caneca 35' : 'estoque: gato 20 · caneca 36', 'dim']);
          o.rows.db = ok ? DB1() : DB0();
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: !ok, flow: !ok }, { pts: CAB.qdoc }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          o.cnt = [['RELÓGIO', clock(ms)], ['LINHAS', ok ? '1 + 2' : '…', 'dim'], ['TRANSAÇÃO', ok ? 'COMMIT' : 'aberta', 'dim']];
          o.res = ok ? [['1056 gravado nas duas tabelas', 'acc']] : []; } },
      { id: 'evento', dur: 6, title: 'O e-1801 PedidoCriado leva o 1056 para o outro lado', yk: 'O EVENTO (336 B)',
        code: ['{"evento_id":"e-1801",', ' "tipo":"PedidoCriado","pedido_id":1056,', ' "cliente_id":"lena-77","versao":1,', ' "itens":[…gato 7990, caneca 1990],', ' "total_centavos":11480, …}  = 336 bytes'],
        story: 'O lado da consulta não lê o banco do comando. Ele fica sabendo do pedido por um <b>evento</b>: o <code>e-1801</code>, <code>PedidoCriado</code>, de <b>336 bytes</b>, com o nome e o preço da época de cada item e o dinheiro em centavos. O projetor recebe o evento e põe o 1056 no topo do documento da Lena, que passa à <b>versão 8</b>.',
        look: 'O ponto de luz sai do banco, corre pela esteira e entra no documento. A ficha ganha uma linha no topo.',
        key: 'Um evento leva a mudança do modelo de escrita ao de leitura.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'db', 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(f > 0 ? (done ? 'ok' : 'recv') : 'none');
          o.rows.doc = done ? DOC8() : DOC7();
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, f, 'e-1801 · 336 B');
          o.cnt = [['EVENTO', 'e-1801'], ['TAMANHO', '336 B', 'dim'], ['DOCUMENTO', done ? 'v8' : 'v7', 'dim']];
          o.res = done ? [['o 1056 está nos dois modelos', 'acc']] : []; } },
      { id: 'consulta', dur: 6, title: 'A tela lê do outro lado: uma rota, um documento', yk: 'A CONSULTA',
        code: ['GET /meus-pedidos   (bff-app → meus-pedidos)', 'MeusPedidos(lena-77)', '  lê meus_pedidos:lena-77 por chave', '  sem JOIN, sem regra', '  devolve 1.787 B: 8 pedidos'],
        story: 'A Lena abre "meus pedidos". O <code>bff-app</code> chama <b>uma</b> rota, a do <code>meus-pedidos</code>, que devolve o documento de <b>1.787 bytes</b> com os 8 pedidos, o 1056 no topo. A consulta não valida nada: as regras já foram aplicadas antes de o dado entrar. Ela só lê e responde.',
        look: 'A luz desce do documento, passa pelo meus-pedidos e pelo bff-app e chega ao celular, pelo caminho da direita.',
        key: 'Consulta só devolve dado; o modelo de leitura tem o formato da tela.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [done ? '1056 · 114,80' : '1055 · 34,90', done ? 'acc' : 'hi']);
          o.beams = [{ pts: CAB.lb, on: !done }, { pts: CAB.bc }, { pts: CAB.bq, on: !done }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: !done }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f, '1.787 B');
          o.cnt = [['DOCUMENTO', '1.787 B'], ['PEDIDOS', '8', 'dim'], ['ROTAS CHAMADAS', '1', 'dim']];
          o.res = done ? [['a tela leu um documento só', 'acc']] : []; } },
      { id: 'regra', dur: 6, title: 'E se der errado: a regra duplicada', yk: 'A MESMA REGRA NOS DOIS LADOS',
        code: ['leitura: "pedido cancelado não aparece"', 'meses depois o comando muda a regra:', '  sem estoque → "aguardando reposição"', 'ninguém muda o outro lado', 'a Lena vê o que o checkout já recusou'],
        story: 'Alguém põe "pedido cancelado não aparece" também no modelo de leitura, para a tela ficar limpa. Meses depois o comando muda a regra (um pedido recusado por falta de estoque passa a ficar "aguardando reposição") e ninguém lembra do outro lado. Os dois divergem, e a Lena vê um pedido que o checkout já recusou.',
        look: 'O meus-pedidos fica vermelho com uma regra que não é dele, e a tela mostra um pedido que o comando recusou.',
        key: 'Regra duplicada é bug esperando: a consulta mostra o que lhe chegou.',
        f(o, t) { const bad = t > 1; lit(o, 'cmd'); o.on.qry = bad ? 'bad' : 1; if (bad) o.on.lena = 'bad';
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          o.rows.cmd = act('pedidos', 'COMANDO', ['regra nova:', 'dim'], ['sem estoque →', 'acc'], ['"aguardando reposição"', 'acc']);
          o.rows.qry = act('meus-pedidos', 'CONSULTA', ['regra copiada:', 'dim'], ['"cancelado não aparece"', bad ? 'bad' : 'hi'], [bad ? 'ficou velha' : '', 'bad']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [bad ? 'pedido já recusado' : '1056 · 114,80', bad ? 'bad' : 'acc']);
          o.cnt = [['CÓPIAS DA REGRA', '2', 'bad'], ['NO COMANDO', 'nova', 'dim'], ['NA CONSULTA', bad ? 'velha' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['os dois modelos divergem', 'bad']] : [];
          if (bad) T(o, TF(749), 'regra que não é dela', 'bad'); } },
      { id: 'aviso', dur: 7, title: 'E se der errado: CQRS onde um SELECT basta', yk: 'MEDIDO EM POSTGRESQL 14',
        code: ['SELECT … FROM pedidos JOIN itens_pedido', '  JOIN produtos JOIN pagamentos JOIN remessas', " WHERE cliente_id = 'lena-77'  -- 8 pedidos", 'Execution Time: 0,23 a 0,31 ms', '~100 páginas em memória, com índice'],
        story: 'A falha mais cara é de projeto. Nesta loja, a consulta da tela no modelo normalizado (5 tabelas, 8 pedidos da Lena, com índice) custa <b>0,23 a 0,31 ms</b>. O JOIN por cliente não é o problema. Separar os modelos só por causa dele troca 0,3 ms por duas peças para manter em sincronia. Martin Fowler avisa: "para a maioria dos sistemas o CQRS acrescenta complexidade arriscada". O que dói de verdade são o relatório (View) e os serviços separados (Distribuído).',
        look: 'O caminho direto do bff-app ao banco acende: um SELECT de 0,3 ms. O lado da consulta, a esteira e o documento ficam vermelhos: peças a mais.',
        key: 'Para a maioria dos sistemas basta um modelo.',
        f(o, t) { const bad = t > 1.2; lit(o, 'db', 'bff', 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('ok'); o.rows.doc = DOC8();
          if (bad) { o.on.qry = 'bad'; o.on.doc = 'bad'; o.on.bus = 'bad'; }
          o.rows.bff = act('bff-app', 'BFF', ['GET /meus-pedidos → loja', 'acc'], ['SELECT com JOIN: 0,23–0,31 ms', 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], ['1056 · 114,80', 'acc']);
          o.beams = [{ pts: CAB.lb, on: true }, { pts: CAB.rdb, on: true, flow: true }, { pts: CAB.bq, tone: bad ? 'bad' : '' }, { pts: CAB.qdoc, tone: bad ? 'bad' : '' }, { pts: CAB.ev1, tone: bad ? 'bad' : '' }, { pts: CAB.ev2, tone: bad ? 'bad' : '' }, { pts: CAB.cdb }, { pts: CAB.bc }];
          o.cnt = [['A CONSULTA DA TELA', '0,23–0,31 ms'], ['MODELOS', bad ? '1 basta' : '2', bad ? 'bad' : 'dim'], ['PEÇAS A MAIS', bad ? '3' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['para a maioria dos sistemas', 'bad'], ['basta um modelo', 'bad']] : [];
          if (bad) T(o, TF(452), 'basta um modelo', 'bad'); } },
    ],
    view: [
      { id: 'relatorio', dur: 6, title: 'O relatório das 23:00 varre 300 mil pedidos: ~235 ms', yk: 'O RELATÓRIO (3 EXECUÇÕES)',
        code: ['SELECT p.cidade, pr.nome, count(DISTINCT p.id),', '       sum(i.qtd)', '  FROM pedidos p JOIN itens_pedido i …', '  JOIN produtos pr … GROUP BY p.cidade, pr.nome;', '238,8 · 240,7 · 227,6 ms  (~235 ms)'],
        story: 'O relatório das 23:00 (módulo 6), o faturamento por cidade e produto, junta <code>pedidos</code>, <code>itens_pedido</code> e <code>produtos</code> e agrupa. No banco de teste (PostgreSQL 14, <b>300.008</b> pedidos), três execuções deram 238,8, 240,7 e 227,6 ms: <b>~235 ms</b>. Nas 50 milhões de linhas do módulo 16, a estimativa linear (não medida) é de <b>~40 s</b>, disputando banco e CPU com quem está pagando.',
        look: 'O relatório, na frente, puxa as três tabelas do banco pelo cabo da esquerda. A view, à direita, ainda está apagada.',
        key: 'Uma consulta que varre tudo é a que mais pesa no banco de escrita.',
        f(o, t) { viewBase(o); const ms = lin(t, 0.4, 3.4, 0, 235), done = ms >= 235; lit(o, 'bff', 'db'); hide(o, 'doc'); o.beams = o.beams.filter(b => b.pts !== CAB.rio && b.pts !== CAB.qdoc);
          o.beams.find(b => b.pts === CAB.rdb).on = !done; o.beams.find(b => b.pts === CAB.rdb).flow = !done;
          o.cnt = [['RELATÓRIO', `${Math.round(ms)} ms`], ['LINHAS VARRIDAS', '300.008', 'dim'], ['NAS 50 MILHÕES', '~40 s', 'dim']];
          o.res = done ? [['~235 ms para 5 linhas de resultado', 'acc']] : [];
          if (!done) T(o, [290, 250, 30], 'varrendo 300 mil linhas', 'acc'); } },
      { id: 'cria', dur: 5, title: 'CREATE MATERIALIZED VIEW: o resultado guardado, 406 ms', yk: 'A VIEW, NO MESMO BANCO',
        code: ['CREATE MATERIALIZED VIEW faturamento_cidade_produto', '  AS SELECT … ;            -- 406 ms', 'CREATE UNIQUE INDEX', '  ON faturamento_cidade_produto (cidade, produto);', '5 linhas guardadas'],
        story: 'O jeito mais simples de tirar o relatório do caminho é guardar o resultado pronto, no mesmo banco. <code>CREATE MATERIALIZED VIEW faturamento_cidade_produto AS …</code> roda a consulta uma vez e guarda as <b>5 linhas</b> do resultado. Criar custou <b>406 ms</b>. A view é o modelo de leitura mais simples: mesmo banco, mesma equipe, uma linha de SQL.',
        look: 'A view sobe à direita, ligada ao banco pelo cabo do meio, com a linha de Recife e da caneca azul.',
        key: 'Uma view materializada é o resultado de uma consulta guardado numa tabela.',
        f(o, t) { viewBase(o); const done = t > 1.4; lit(o, 'db'); if (done) lit(o, 'doc'); else hide(o, 'doc');
          o.beams.find(b => b.pts === CAB.rio).on = !done; o.beams.find(b => b.pts === CAB.rio).flow = !done;
          o.cnt = [['CRIAR A VIEW', done ? '406 ms' : '…'], ['LINHAS', '5', 'dim'], ['ONDE', 'mesmo banco', 'dim']];
          o.res = done ? [['5 linhas prontas para ler', 'acc']] : [];
          T(o, [452, 136, 34], 'mesmo banco loja', 'dim'); } },
      { id: 'le', dur: 5, title: 'Ler a view: 0,021 ms, ~11.000× mais rápido', yk: 'O LEITOR',
        code: ['EXPLAIN ANALYZE', '  SELECT * FROM faturamento_cidade_produto', "   WHERE cidade = 'Recife';", 'Execution Time: 0,021 ms', '235 ÷ 0,021 ≈ 11.000×'],
        story: 'O leitor pede a linha de Recife à view: <b>0,021 ms</b>. Cerca de <b>11.000×</b> mais rápido que o relatório, porque lê 5 linhas prontas em vez de varrer 300 mil. Nas 50 milhões a leitura continua em ~0,021 ms: a view tem as mesmas 5 linhas.',
        look: 'A luz corre do leitor à view, pelo cabo curto da direita, e volta quase na hora.',
        key: 'O ganho é enorme: ler o pronto em vez de calcular.',
        f(o, t) { viewBase(o); lit(o, 'qry', 'doc');
          o.beams.find(b => b.pts === CAB.qdoc).on = true; o.beams.find(b => b.pts === CAB.qdoc).flow = true;
          o.rows.qry = act('leitor', 'SESSÃO 2', ["WHERE cidade = 'Recife'", 'hi'], ['0,021 ms', 'acc']);
          o.cnt = [['LER A VIEW', '0,021 ms'], ['O RELATÓRIO', '~235 ms', 'dim'], ['RAZÃO', '~11.000×', 'dim']];
          o.res = [['5 linhas prontas: 0,021 ms', 'acc']]; } },
      { id: 'refresh', dur: 8, title: 'REFRESH simples: o leitor espera 2.285 ms', yk: 'DUAS SESSÕES',
        code: ['sessão 1: BEGIN;', '  REFRESH MATERIALIZED VIEW …;  -- 401 ms', '  SELECT pg_sleep(3); COMMIT;', 'sessão 2 (1 s depois): SELECT count(*) …', 'wait_event_type = Lock · wait_event = relation'],
        story: 'A view só sabe o que sabia quando foi feita; para saber dos pedidos novos, alguém a refaz. <code>REFRESH MATERIALIZED VIEW</code> levou <b>401 ms</b> (estimativa linear de ~67 s nas 50 milhões). No teste, a sessão 1 deu o <code>REFRESH</code> dentro de uma transação que durou 3 s. Um segundo depois, o leitor fez <code>SELECT count(*)</code> na view e ficou parado: o <code>pg_stat_activity</code> o mostrou em <code>wait_event_type = Lock</code>, <code>wait_event = relation</code>. Esperou <b>2.285 ms</b>.',
        look: 'A view fica vermelha (travada) enquanto a sessão 1 a refaz. O relógio do leitor conta a espera até 2.285 ms.',
        key: 'O REFRESH simples bloqueia quem lê.',
        f(o, t) { viewBase(o); const s = lin(t, 0.4, 6.4, 0, 3.3), lock = s < 3, reading = s >= 1, w = clamp(s - 1, 0, 2.285);
          lit(o, 'cmd'); o.on.doc = lock ? 'bad' : 1; o.on.qry = reading && w < 2.285 ? 'bad' : reading ? 1 : 0;
          o.rows.cmd = act('sessão 1', 'REFRESH', [lock ? 'REFRESH … (transação aberta)' : 'COMMIT', lock ? 'bad' : 'acc'], ['pg_sleep(3)', 'dim']);
          o.rows.qry = act('leitor', 'SESSÃO 2', [reading ? 'SELECT count(*) …' : 'ainda não leu', 'hi'], reading ? [w < 2.285 ? 'Lock · relation' : 'leu', w < 2.285 ? 'bad' : 'acc'] : null, reading ? [`esperou ${thou(w * 1000)} ms`, 'dim'] : null);
          o.beams = [{ pts: CAB.cdb, on: lock }, { pts: CAB.rio, on: lock, tone: lock ? 'bad' : '' }, { pts: CAB.qdoc, on: reading, tone: reading && w < 2.285 ? 'bad' : '' }, { pts: CAB.rdb }];
          o.cnt = [['O LEITOR ESPEROU', `${thou(w * 1000)} ms`, w > 0 && w < 2.285 ? 'bad' : ''], ['RELÓGIO DA SESSÃO 1', `${s.toFixed(1).replace('.', ',')} s`, 'dim'], ['REFRESH', '401 ms', 'dim']];
          o.res = w >= 2.285 ? [['leitor parado 2.285 ms', 'bad']] : reading ? [['wait_event = relation', 'bad']] : [];
          if (lock) T(o, [749, 136, 50], 'travada pelo REFRESH', 'bad'); } },
      { id: 'concorrente', dur: 6, title: 'REFRESH CONCURRENTLY: o leitor espera 12 ms', yk: 'COM O ÍNDICE ÚNICO',
        code: ['CREATE UNIQUE INDEX ON faturamento_cidade_produto', '  (cidade, produto);   -- exigido', 'REFRESH MATERIALIZED VIEW CONCURRENTLY …;', '  -- 340 ms', 'o leitor lê a versão antiga: espera 12 ms'],
        story: 'O <code>REFRESH … CONCURRENTLY</code> monta a versão nova ao lado e troca só as linhas que mudaram, sem tirar a view do leitor. Exige um <code>CREATE UNIQUE INDEX</code> na view. Levou <b>340 ms</b>, e o mesmo leitor esperou <b>12 ms</b> em vez de 2.285.',
        look: 'A view continua acesa enquanto é refeita; o leitor lê quase sem parar.',
        key: 'CONCURRENTLY existe por causa do leitor: custa um índice único.',
        f(o, t) { viewBase(o); const w = lin(t, 1.2, 1.6, 0, 12); lit(o, 'cmd', 'doc', 'qry');
          o.rows.cmd = act('sessão 1', 'CONCURRENTLY', ['REFRESH … CONCURRENTLY', 'acc'], ['340 ms · índice único', 'dim']);
          o.rows.qry = act('leitor', 'SESSÃO 2', ['SELECT count(*) …', 'hi'], ['lê a versão antiga', 'acc'], [`esperou ${Math.round(w)} ms`, 'dim']);
          o.beams = [{ pts: CAB.cdb, on: true }, { pts: CAB.rio, on: true, flow: true }, { pts: CAB.qdoc, on: true, flow: true }, { pts: CAB.rdb }];
          o.cnt = [['O LEITOR ESPEROU', `${Math.round(w)} ms`], ['SIMPLES', '2.285 ms', 'dim'], ['REFRESH CONCURRENTLY', '340 ms', 'dim']];
          o.res = w >= 12 ? [['12 ms em vez de 2.285', 'acc']] : []; } },
      { id: 'velha', dur: 8, title: 'E se der errado: a view envelhece e mostra 100003', yk: 'DEPOIS DE UM PEDIDO NOVO',
        code: ['INSERT … pedido de caneca em Recife', "SELECT … WHERE produto = 'caneca azul'", '  → pedidos = 100003, unidades = 150004', 'REFRESH MATERIALIZED VIEW …;', '  → pedidos = 100004, unidades = 150005'],
        story: 'Um pedido novo de caneca entra em Recife. O banco já o tem; a view, não: <code>SELECT … WHERE produto = \'caneca azul\'</code> continua dando <b>100003</b> pedidos e 150004 unidades. Só depois do <code>REFRESH</code> ela passa a <b>100004</b> e 150005. Se o <code>REFRESH</code> roda às 23:00, o pedido das 20:12 só entra <b>2 h 48 min</b> depois. E cada <code>REFRESH</code> refaz o resultado inteiro: o PostgreSQL não atualiza a view aos pedaços.',
        look: 'O pedido acende no banco; a view continua com 100003 em vermelho até o REFRESH, quando vira 100004.',
        key: 'A view só sabe o que sabia no último REFRESH.',
        f(o, t) { viewBase(o); const ins = t > 0.8, ref = t > 5.2; lit(o, 'cmd', 'db'); o.on.doc = ins && !ref ? 'bad' : ref ? 1 : 0;
          o.rows.cmd = act('pedidos', 'INSERT', ['pedido de caneca · Recife', ins ? 'acc' : 'dim'], [ref ? 'sessão 1: REFRESH' : '', 'acc']);
          o.rows.db = TBL(['pedidos', 'tbl'], [ins ? '300.009 linhas (+1 caneca)' : '300.008 linhas', ins ? 'acc' : 'dim'], ['itens_pedido', 'tbl'], ['600.009 linhas', 'dim'], ['produtos · 3 linhas', 'dim']);
          o.rows.doc = ref ? MV(MVROW('100004', 0, 'acc'), ['unidades 150005', 'acc'], ['refeita inteira', 'dim']) : MV(MVROW('100003', 0, ins ? 'bad' : 'hi'), ['unidades 150004', ins ? 'bad' : 'dim'], [ins ? 'não sabe do pedido novo' : '+ 4 linhas', ins ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.cdb, on: ins && !ref, flow: ins && !ref }, { pts: CAB.rio, on: ref, flow: ref }, { pts: CAB.qdoc }, { pts: CAB.rdb }];
          o.cnt = [['A VIEW DIZ', ref ? '100004' : '100003', ins && !ref ? 'bad' : ''], ['O BANCO TEM', ins ? '100004' : '100003', 'dim'], ['REFRESH ÀS 23:00', '+2 h 48 min', 'bad']];
          o.res = ins && !ref ? [['a view mostra o passado', 'bad']] : ref ? [['só depois do REFRESH', 'acc']] : [];
          if (ins && !ref) T(o, TF(749), 'ainda 100003', 'bad'); } },
    ],
    replica: [
      { id: 'tres', dur: 5, title: 'Primário em SP, réplicas no Rio e em Recife', yk: 'O DESENHO DO MÓDULO 17',
        code: ['pg-sp      primário · lê e escreve', 'pg-rio     réplica  · só lê · RTT 10 ms', 'pg-recife  réplica  · só lê · RTT 80 ms', 'mesmo esquema nas três', 'a Lena lê de Recife: ~2 ms, não 80'],
        story: 'A réplica é o modelo de leitura mais barato: o <b>mesmo esquema</b> em outro servidor, sem projetor e sem evento. É o desenho do módulo 17: o primário <code>pg-sp</code> em SP e as réplicas no Rio e em Recife, alimentadas pelo log do banco. A Lena lê de Recife: <b>~2 ms</b> em vez dos <b>80 ms</b> de ida e volta até SP.',
        look: 'O primário à esquerda; o Rio atrás e Recife na frente, à direita, cada um com o seu cabo e o RTT escrito. A Lena liga em Recife.',
        key: 'A réplica copia o mesmo esquema: não é outro modelo.',
        f(o) { replicaBase(o); lit(o, 'db');
          o.cnt = [['SERVIDORES QUE LEEM', '3'], ['LER EM RECIFE', '~2 ms', 'dim'], ['LER EM SP', '80 ms', 'dim']];
          o.res = [['mesmo esquema, outro servidor', 'acc']]; } },
      { id: 'da', dur: 5, title: 'O que ela dá: capacidade e proximidade', yk: 'TRÊS SERVIDORES LENDO',
        code: ['capacidade: 3 servidores atendem leitura', 'proximidade: Recife a ~2 ms da Lena', 'mais uma cópia se o primário cair', 'código de leitura: igual', 'só muda a conexão'],
        story: 'A réplica dá <b>capacidade</b> (as três máquinas atendem leitura), <b>proximidade</b> (perto de quem lê) e uma cópia a mais, útil se o primário cair. Tudo sem mexer no modelo e sem mudar uma linha do código de leitura: só a conexão.',
        look: 'O log corre de SP para as duas réplicas, e a leitura da Lena sai de Recife.',
        key: 'Mais servidores lendo, perto de quem lê.',
        f(o) { replicaBase(o); lit(o, 'db', 'doc', 'qry', 'lena');
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], ['de Recife: ~2 ms', 'acc']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }, { pts: CAB.bq }, { pts: CAB.lrec, on: true, flow: true }];
          o.cnt = [['CAPACIDADE', '3 servidores'], ['LEITURA DA LENA', '~2 ms', 'dim'], ['CÓDIGO NOVO', 'nenhum', 'dim']];
          o.res = [['capacidade e proximidade', 'acc']]; } },
      { id: 'nao-da', dur: 6, title: 'O que ela não dá: o JOIN de 5 tabelas continua', yk: 'EM pg-recife',
        code: ['SELECT … FROM pedidos', '  JOIN itens_pedido JOIN produtos', '  JOIN pagamentos JOIN remessas', " WHERE cliente_id = 'lena-77';", 'mesma consulta, outra máquina'],
        story: 'O que a réplica <b>não</b> dá é formato de tela: "meus pedidos" continua sendo um JOIN de 5 tabelas, só que em outra máquina. Nem isolamento de consulta pesada: o relatório, rodando na réplica, disputa com o log que chega do primário. O artigo diz que a réplica "apenas troca o problema de lugar": é verdade quando o problema é o formato.',
        look: 'Recife mostra as mesmas 5 tabelas do primário. Nenhum documento: a forma do dado é a mesma.',
        key: 'Réplica dá capacidade, não formato.',
        f(o) { replicaBase(o, { rec: [['pedidos · itens_pedido', 'hi'], ['produtos · pagamentos', 'hi'], ['remessas: JOIN de 5', 'acc']] }); lit(o, 'qry', 'lena');
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio, on: true }, { pts: CAB.rec, on: true }, { pts: CAB.bq }, { pts: CAB.lrec, on: true, flow: true }];
          o.cnt = [['TABELAS NO JOIN', '5'], ['FORMATO NOVO', 'nenhum', 'dim'], ['ESQUEMA', 'o mesmo', 'dim']];
          o.res = [['trocou o lugar, não o formato', 'acc']]; } },
      { id: 'relatorio', dur: 6, title: 'O relatório vai para a réplica de Recife', yk: 'A CONSULTA LONGA', act: ['Mandar o relatório', 'para Recife'],
        code: ['réplica em hot standby', 'consulta longa na réplica', 'o primário continua mandando o WAL', 'max_standby_streaming_delay: 30 s (padrão)', 'relatório da loja: ~40 s'],
        story: 'A ideia parece boa: tirar o relatório das 23:00 do primário e rodá-lo na réplica de Recife. Só que a réplica não está parada: ela aplica, sem parar, o log que vem de SP. Se o log precisar mexer em linhas que a consulta ainda está lendo, a réplica espera até <code>max_standby_streaming_delay</code> (padrão <b>30 s</b>) e depois escolhe o log.',
        look: 'O relatório, na frente, liga em Recife. O cabo de SP continua levando o log para lá.',
        key: 'Na réplica, a consulta longa disputa com o log que chega.',
        f(o, t) { replicaBase(o, { rec: [['relatório rodando', 'acc'], ['WAL chegando de SP', 'dim']] }); const s = lin(t, 0.4, 5, 0, 2); lit(o, 'bff', 'qry');
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: true, flow: true }, { pts: CAB.bq, on: true, flow: true }, { pts: CAB.lrec }];
          o.cnt = [['CONSULTA NA RÉPLICA', `${s.toFixed(1).replace('.', ',')} s`], ['LIMITE PADRÃO', '30 s', 'dim'], ['O RELATÓRIO', '~40 s', 'dim']];
          o.res = [['~40 s > 30 s do padrão', 'bad']]; } },
      { id: 'cancela', dur: 8, title: 'VACUUM no primário: a consulta morre aos 3,16 s', yk: 'MEDIDO · max_standby_streaming_delay = 1s',
        code: ['t = 0 s     na réplica: consulta de 6 s', 't = 2 s     no primário: DELETE + VACUUM', 't = 3,16 s  a consulta morre:', 'ERROR: canceling statement due to', '       conflict with recovery'],
        story: 'No teste (PostgreSQL 14, <code>max_standby_streaming_delay = 1s</code>), uma consulta de 6 s rodava na réplica. Aos 2 s o primário fez <code>DELETE</code> e <code>VACUUM</code> de linhas que ela ainda precisava ver. A réplica esperou o limite e, aos <b>3,16 s</b>, cancelou: <code>ERROR: canceling statement due to conflict with recovery</code>. Com o padrão de 30 s, o relatório de ~40 s também morreria. Os consertos custam: <code>hot_standby_feedback</code> faz a tabela inchar no primário; subir o limite deixa a réplica mais atrás.',
        look: 'O DELETE + VACUUM sai de SP pelo cabo de Recife; a réplica segura um segundo e fica vermelha quando cancela o relatório.',
        key: 'A consulta longa na réplica é cancelada por conflito de recuperação.',
        f(o, t) { const s = lin(t, 0.4, 6, 0, 3.4), vac = s >= 2, dead = s >= 3.16;
          replicaBase(o, { sp: [[vac ? 'DELETE + VACUUM' : 'escrevendo', vac ? 'acc' : 'dim']],
            rec: [[dead ? 'consulta cancelada' : 'relatório rodando', dead ? 'bad' : 'acc'], [dead ? 'conflict with recovery' : vac ? 'segurando o log: 1 s' : 'WAL chegando', dead ? 'bad' : 'dim']] });
          lit(o, 'db'); o.on.qry = dead ? 'bad' : 1; o.on.bff = dead ? 'bad' : 1;
          o.rows.bff = act('relatório 23:00', dead ? 'CANCELADO' : 'NA RÉPLICA', [dead ? 'ERROR aos 3,16 s' : 'rodando…', dead ? 'bad' : 'dim'], ['consulta de 6 s', 'dim']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: vac }, { pts: CAB.bq, on: !dead, tone: dead ? 'bad' : '', flow: !dead }, { pts: CAB.lrec }];
          pk(o, CAB.rec, (s - 2) / 0.5, 'DELETE + VACUUM');
          o.cnt = [['CONSULTA NA RÉPLICA', `${s.toFixed(2).replace('.', ',')} s`, dead ? 'bad' : ''], ['VACUUM NO PRIMÁRIO', vac ? 'aos 2 s' : '…', 'dim'], ['LIMITE', '1 s', 'dim']];
          o.res = dead ? [['canceling statement due to', 'bad'], ['conflict with recovery', 'bad']] : [];
          if (dead) T(o, TF(749), 'cancelada aos 3,16 s', 'bad'); } },
      { id: 'atraso', dur: 8, title: 'E se der errado: o 1056 some por 800 ms em Recife', yk: 'BLACK FRIDAY · RECIFE 800 ms ATRÁS',
        code: ['20:12:00.004  COMMIT do 1056 em SP', '20:12:00.050  a Lena abre "meus pedidos"', '              lê de Recife: só até o 1055', '~20:12:00.804 Recife aplica o 1056', 'réplica aproxima, não resolve'],
        story: 'Na Black Friday a réplica de Recife estava <b>800 ms</b> atrás do primário. A Lena faz o 1056 (commit às 20:12:00.004) e, logo depois, abre "meus pedidos" lendo de Recife: o pedido não está lá, como o 1055 no módulo 17. Só aparece quando Recife aplica o log, perto de 20:12:00.804. A réplica não resolve ler o que se acabou de escrever: só aproxima.',
        look: 'O 1056 acende em SP e viaja devagar pelo cabo de Recife; enquanto isso, a tela da Lena fica vermelha sem ele.',
        key: 'A réplica mostra o passado por centenas de milissegundos.',
        f(o, t) { const ms = lin(t, 0.3, 6.5, 0, 1000), applied = ms >= 804, opened = ms >= 50;
          replicaBase(o, { sp: [['COMMIT 1056 às .004', 'acc']], rec: [[applied ? '1056 aplicado' : 'ainda no 1055', applied ? 'acc' : 'bad'], ['800 ms atrás', 'dim']] });
          lit(o, 'db', 'cmd'); o.on.qry = applied ? 1 : 'bad'; if (opened) o.on.lena = applied ? 1 : 'bad';
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [!opened ? 'abrindo…' : applied ? '1056 · 114,80' : 'sem o 1056', !opened ? 'dim' : applied ? 'acc' : 'bad']);
          o.beams = [{ pts: CAB.cdb }, { pts: CAB.rio }, { pts: CAB.rec, on: !applied }, { pts: CAB.bq }, { pts: CAB.lrec, on: opened, flow: opened, tone: opened && !applied ? 'bad' : '' }];
          pk(o, CAB.rec, (ms - 4) / 800, 'WAL 1056');
          o.cnt = [['RELÓGIO', clock(ms)], ['ATRASO DE RECIFE', '800 ms', 'bad'], ['NA TELA', applied ? '1056' : '1055', applied ? 'dim' : 'bad']];
          o.res = opened && !applied ? [['a Lena não vê o próprio pedido', 'bad']] : applied ? [['só depois de ~800 ms', 'acc']] : [];
          if (opened && !applied) T(o, TF(560), 'cadê o 1056?', 'bad'); } },
    ],
    eventual: [
      { id: 'commit', dur: 5, title: 'O 1056: commit às 20:12:00.004', yk: 'NO LADO DO COMANDO', act: ['Seguir o 1056', 'do commit à tela'],
        code: ['20:12:00.000  CriarPedido 1056', '20:12:00.004  COMMIT (pedidos + itens_pedido)', 'modelo de leitura: ainda v7', 'o documento ainda não sabe', 'a esteira leva o resto'],
        story: 'Com eventos alimentando o modelo de leitura, ele fica sempre um pouco atrás do de escrita. Isso é a <b>consistência eventual</b> do módulo 3 (BASE), agora de propósito. O 1056 é gravado às <b>20:12:00.004</b>. Nesse instante o documento da Lena ainda está na versão 7, sem ele.',
        look: 'As linhas do 1056 acendem no banco. O documento, à direita, ainda tem 7 pedidos.',
        key: 'Separar os modelos troca "leio o que escrevi" por "leio em breve".',
        f(o) { lit(o, 'db', 'cmd'); o.rows.db = DB1();
          o.rows.cmd = act('pedidos', 'COMANDO', ['CriarPedido 1056', 'acc'], ['COMMIT às .004', 'acc']);
          o.cnt = [['RELÓGIO', clock(4)], ['NO BANCO', '1056', 'dim'], ['NO DOCUMENTO', 'v7 · sem o 1056', 'dim']];
          o.res = [['escrito; ainda não legível', 'acc']]; } },
      { id: 'caminho', dur: 8, title: 'Do commit à tela: ~74 ms', yk: 'O CAMINHO (EXEMPLO, DIA COMUM)',
        code: ['commit                        .004', '+30 ms  o CDC lê o WAL         .034', '+10 ms  Kafka, acks=all        .044', '+20 ms  o consumidor pega      .064', '+10 ms  upsert no documento    .074'],
        story: 'O caminho do 1056 até o documento, num dia comum (exemplo): o CDC lê o WAL (+30 ms), o Kafka com <code>acks=all</code> confirma (+10 ms), o consumidor pega (+20 ms) e o projetor faz o <i>upsert</i> no armazenamento de leitura (+10 ms). O modelo de leitura sabe do 1056 por volta das <b>20:12:00.074</b>: <b>~74 ms</b> depois do commit.',
        look: 'O ponto de luz sai do banco, corre pela esteira e entra no documento; o relógio vai de .004 a .074.',
        key: 'O atraso é a soma das etapas do caminho.',
        f(o, t) { const ms = lin(t, 0.4, 6.4, 4, 74), done = ms >= 74; lit(o, 'db', 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (done ? 'ok' : 'recv') : 'none'); o.rows.doc = done ? DOC8() : DOC7();
          const stage = ms < 34 ? 'o CDC lê o WAL' : ms < 44 ? 'Kafka, acks=all' : ms < 64 ? 'o consumidor pega' : ms < 74 ? 'upsert' : 'no documento';
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, (ms - 4) / 70, stage);
          o.cnt = [['RELÓGIO', clock(ms)], ['DEPOIS DO COMMIT', `+${Math.round(ms - 4)} ms`, 'dim'], ['DOCUMENTO', done ? 'v8' : 'v7', 'dim']];
          o.res = done ? [['~74 ms do commit à tela', 'acc']] : []; } },
      { id: 'buraco', dur: 7, title: 'A Lena abre às 20:12:00.050 e não vê o 1056', yk: 'READ-YOUR-WRITES', act: ['Abrir "meus pedidos"', 'às .050'],
        code: ['20:12:00.004  COMMIT', '20:12:00.050  GET /meus-pedidos', '              documento ainda v7', '20:12:00.074  o 1056 chega ao documento', '24 ms tarde demais'],
        story: 'A Lena abre "meus pedidos" às <b>20:12:00.050</b>, 24 ms antes de o modelo saber, e <b>não vê</b> o 1056: o mesmo problema do 1055 no módulo 17. Quem escreve espera ler o que escreveu (<i>read-your-writes</i>), e o modelo de leitura ainda está no caminho. O desenho tem de prever esse intervalo.',
        look: 'O evento ainda está na esteira quando a leitura chega ao documento; a tela da Lena fica vermelha, sem o 1056.',
        key: 'Sem previsão, a Lena não vê o próprio pedido.',
        f(o, t) { const ms = lin(t, 0.4, 5.4, 4, 90), opened = ms >= 50, arrived = ms >= 74;
          lit(o, 'db', 'bus'); o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (arrived ? 'ok' : 'recv') : 'none'); o.rows.doc = arrived ? DOC8() : DOC7();
          if (arrived) lit(o, 'doc'); if (opened) { o.on.lena = 'bad'; o.on.qry = 1; }
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [opened ? '1055 · sem o 1056' : 'abrindo…', opened ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: opened, tone: opened ? 'bad' : '' }, { pts: CAB.bc }, { pts: CAB.bq, on: opened }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: opened }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801');
          o.cnt = [['RELÓGIO', clock(ms)], ['A LENA ABRIU', opened ? '.050' : '…', opened ? 'bad' : 'dim'], ['O MODELO SOUBE', arrived ? '.074' : '…', 'dim']];
          o.res = opened ? [['leu v7: o 1056 não aparece', 'bad']] : [];
          if (opened) T(o, TF(560), 'cadê o 1056?', 'bad'); } },
      { id: 'resposta', dur: 6, title: 'Jeito (a): a resposta do comando traz o pedido', yk: 'O 201 JÁ TEM O 1056',
        code: ['POST /pedidos → 201 Created', '  { "pedido_id": 1056, "status": "criado",', '    "itens": […], "total_centavos": 11480 }', 'o app põe o 1056 na lista na hora', 'não pergunta ao modelo de leitura'],
        story: 'O primeiro jeito: o <code>CriarPedido</code> responde <code>201</code> com o documento do 1056, e o app o põe na lista na hora, sem perguntar ao modelo de leitura. A Lena vê o próprio pedido; quando o modelo alcança, a lista que vem do <code>meus-pedidos</code> já o traz.',
        look: 'A resposta volta pelo caminho do comando direto ao celular, que mostra o 1056 antes de o documento saber.',
        key: 'Quem acabou de escrever já tem o que escreveu.',
        f(o, t) { const f = lin(t, 0.4, 3, 0, 1), done = f >= 1; lit(o, 'cmd'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.bus.tape = EV('recv');
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [done ? '1056 · 114,80 (do 201)' : 'esperando o 201', done ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: !done }, { pts: CAB.bc, on: !done }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true }];
          pk(o, rev(WAY.cmd), f, '201 · 1056');
          o.cnt = [['RESPOSTA', '201'], ['NA TELA', done ? '1056' : '…', 'dim'], ['CUSTO', 'o app junta a lista', 'dim']];
          o.res = done ? [['a Lena vê o 1056 na hora', 'acc']] : []; } },
      { id: 'token', dur: 8, title: 'Jeito (b): o token de versão min_versao=8', yk: 'ESPERA ATÉ 1 s', act: ['Usar o token', 'min_versao=8'],
        code: ['GET /meus-pedidos?min_versao=8   (às .050)', 'documento em v7: o meus-pedidos espera', 'às .074 o projetor chega à v8', '→ responde com o 1056 (24 ms de espera)', 'se passar de 1 s: lê do lado do comando'],
        story: 'O segundo jeito: a <code>versao</code> do documento é o análogo do LSN do módulo 17. O app pede <code>GET /meus-pedidos?min_versao=8</code>. O <code>meus-pedidos</code> vê o documento em v7 e <b>espera</b> (até 1 s) o projetor chegar à v8. Às .074 a v8 chega e ele responde, com 24 ms de espera. Se não chegasse em 1 s, leria do lado do comando.',
        look: 'O meus-pedidos segura a leitura enquanto o evento termina a esteira; quando o documento vira v8, a resposta segue para o celular.',
        key: 'O token diz qual versão a Lena precisa ver.',
        f(o, t) { const ms = lin(t, 0.4, 6.4, 40, 110), opened = ms >= 50, arrived = ms >= 74, back = clamp((ms - 74) / 30);
          lit(o, 'bus'); o.rows.db = DB1(); o.rows.bus.tape = EV(ms >= 44 ? (arrived ? 'ok' : 'recv') : 'none'); o.rows.doc = arrived ? DOC8() : DOC7();
          if (arrived) lit(o, 'doc'); if (opened) o.on.qry = 1; if (back >= 1) lit(o, 'lena');
          o.rows.qry = act('meus-pedidos', 'CONSULTA', ['min_versao=8', 'acc'], [!opened ? '…' : arrived ? 'v8 chegou: responde' : 'documento v7: espera', arrived ? 'acc' : 'dim'], [opened ? `espera ${Math.round(clamp(ms, 50, 74) - 50)} ms (até 1 s)` : '', 'dim']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [back >= 1 ? '1056 · 114,80' : opened ? 'carregando…' : 'abrindo…', back >= 1 ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: opened }, { pts: CAB.bc }, { pts: CAB.bq, on: opened }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: opened }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801'); pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], back, 'v8 · 1056');
          o.cnt = [['RELÓGIO', clock(ms)], ['ESPERA', `${Math.round(clamp(ms, 50, 74) - 50)} ms`, 'dim'], ['VERSÃO', arrived ? 'v8' : 'v7', 'dim']];
          o.res = back >= 1 ? [['esperou 24 ms e viu o 1056', 'acc']] : []; } },
      { id: 'processando', dur: 5, title: 'Jeito (c): "processando"', yk: 'A TELA ADMITE O ATRASO',
        code: ['o app sabe que o 1056 foi aceito', 'mostra: 1056 · processando', 'sem pagamento, sem rastreio', 'troca quando o modelo alcança', 'não consulta ninguém'],
        story: 'O terceiro jeito: a tela mostra o 1056 como "processando" até o modelo alcançar. Não mente e não consulta ninguém, mas a Lena vê o pedido sem o pagamento e sem o rastreio por alguns instantes. Cada jeito custa algo diferente: o (a) pede que o app junte a lista, o (b) segura a leitura, o (c) mostra menos.',
        look: 'A tela da Lena mostra o 1056 em "processando" enquanto o evento termina a esteira.',
        key: 'A Lena precisa ver o próprio pedido, mesmo antes do modelo.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 40, 90), arrived = ms >= 74; lit(o, 'lena', 'bus'); if (arrived) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(arrived ? 'ok' : 'recv'); o.rows.doc = arrived ? DOC8() : DOC7();
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [arrived ? '1056 · criado' : '1056 · processando', 'acc']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !arrived }, { pts: CAB.ev2, on: !arrived }];
          pk(o, WAY.ev, (ms - 4) / 70, 'e-1801');
          o.cnt = [['NA TELA', arrived ? 'criado' : 'processando'], ['RELÓGIO', clock(ms), 'dim'], ['CONSULTA EXTRA', 'nenhuma', 'dim']];
          o.res = [['pedido visível, status honesto', 'acc']]; } },
      { id: 'bf', dur: 8, title: 'Black Friday: 120 eventos/s contra 100/s por instância', yk: 'A CONTA QUE NÃO FECHA',
        code: ['30 pedidos/s × 4 eventos = 120 eventos/s', '1 upsert de 10 ms = 100 eventos/s', '1 instância: déficit de 20/s', '10 min: 20 × 600 = 12.000 eventos', '= 120 s de atraso, e crescendo'],
        story: 'Na Black Friday a loja faz 30 pedidos/s e cada um gera 4 eventos (no 1056: <code>e-1801</code> a <code>e-1804</code>): <b>120 eventos/s</b>. O projetor faz 1 <i>upsert</i> de 10 ms por evento, ou seja, <b>100 eventos/s</b> por instância. Com 1 instância sobram 20 por segundo: em 10 minutos são <b>12.000 eventos</b> na fila, <b>120 s</b> de atraso, e só cresce.',
        look: 'A pilha na frente da esteira cresce: são os eventos que o projetor ainda não aplicou.',
        key: 'A capacidade do projetor decide o atraso.',
        f(o, t) { const m = lin(t, 0.4, 6.4, 0, 10), n = 20 * 60 * m; lit(o, 'bus'); o.on.doc = m > 1 ? 'bad' : 1;
          o.rows.db = DB1(); o.rows.bus = act('eventos', '120/s ENTRAM'); o.rows.bus.tape = [['e-1801', 'ok'], ['e-1802', 'ok'], ['e-1803', 'ok'], ['e-1804', 'ok']]; o.rows.bus.tapeLabel = 'KAFKA';
          o.rows.qry = act('projetor', '1 INSTÂNCIA', ['100 eventos/s', 'hi'], ['10 ms por upsert', 'dim'], ['déficit: 20/s', 'bad']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: true, flow: true }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true, flow: true }, { pts: CAB.ev2, on: true, flow: true, tone: 'bad' }];
          o.piles.push({ p: [452, 236, PL + 2], v: n, f: m / 10 });
          o.cnt = [['ATRASO ACUMULADO', `${thou(n)} eventos`, 'bad'], ['EM SEGUNDOS', `${Math.round(n / 100)} s`, 'bad'], ['TEMPO', `${m.toFixed(1).replace('.', ',')} min`, 'dim']];
          o.res = m >= 10 ? [['120 s atrás e crescendo', 'bad']] : []; } },
      { id: 'tres', dur: 8, title: '3 instâncias: 40% de uso; uma parada drena em 400 s', yk: 'A CONTA QUE FECHA (E A QUE TROPEÇA)',
        code: ['3 partições do tópico pedidos (módulo 13)', '3 × 100 = 300/s; cada uma recebe 40/s', 'uma cai 10 min: 40 × 600 = 24.000', 'ao voltar drena a 100 − 40 = 60/s', '24.000 ÷ 60 = 400 s (6 min 40 s)'],
        story: 'Com <b>3 instâncias</b> (as 3 partições do tópico <code>pedidos</code>, módulo 13) a capacidade é 300/s e cada uma recebe 40/s: <b>40%</b> de uso. Mas se uma delas cai por 10 minutos, acumula 40 × 600 = <b>24.000 eventos</b>; ao voltar, drena a 100 − 40 = 60/s e leva <b>400 s</b> (6 min 40 s). Nesse tempo só os clientes daquela partição veem a tela atrasada. A métrica que vigia isso é o atraso do consumidor e a idade do último evento aplicado.',
        look: 'A pilha cresce enquanto a instância está parada e encolhe devagar depois que ela volta.',
        key: 'Vigie o atraso do consumidor e a idade do último evento aplicado.',
        f(o, t) { const s = lin(t, 0.4, 7.2, 0, 1000), down = s < 600, n = down ? 40 * s : Math.max(0, 24000 - 60 * (s - 600));
          lit(o, 'bus', 'doc'); o.on.qry = down ? 'bad' : 1;
          o.rows.db = DB1(); o.rows.bus = act('eventos', '3 PARTIÇÕES'); o.rows.bus.tape = [['p0', 'ok'], ['p1', down ? 'bad' : 'recv'], ['p2', 'ok']]; o.rows.bus.tapeLabel = 'KAFKA';
          o.rows.qry = act('projetor', '3 INSTÂNCIAS', ['300/s · 40% de uso', 'hi'], [down ? 'p1 parada' : n > 0 ? 'p1 drenando a 60/s' : 'p1 em dia', down ? 'bad' : 'acc'], [`há ${Math.floor(s / 60)} min ${Math.round(s % 60)} s`, 'dim']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb, on: true, flow: true }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true, flow: true }, { pts: CAB.ev2, on: true, flow: true }];
          if (n > 0) o.piles.push({ p: [452, 236, PL + 2], v: n, f: n / 24000 });
          o.cnt = [['FILA DA PARTIÇÃO p1', `${thou(n)} eventos`, down || n > 0 ? 'bad' : ''], ['RELÓGIO', `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`, 'dim'], ['PARA DRENAR', '400 s', 'dim']];
          o.res = down ? [['instância parada: fila cresce', 'bad']] : n > 0 ? [['drenando a 60/s', 'acc']] : [['em dia: 6 min 40 s depois', 'acc']]; } },
      { id: 'duas-vezes', dur: 8, title: 'E se der errado: o projetor aplica o e-1801 duas vezes', yk: 'hospital-cqrs-sql · handler.go (LIDO NO CÓDIGO)',
        code: ['INSERT INTO View_Farmacia (…) VALUES (…)', '-- sem ON CONFLICT', 'o consumidor relê a mensagem', '→ o INSERT roda de novo', 'conserto: só se versao for maior, ou evento_id'],
        story: 'Reentrega acontece: o consumidor cai depois de aplicar e antes de confirmar, e relê a mensagem. O projetor do laboratório do autor (<code>hospital-cqrs-sql/internal/events/handler.go</code>) faz <code>INSERT</code> direto na view, <b>sem <code>ON CONFLICT</code></b> (lido no código; o laboratório não foi executado). Na loja, o 1056 apareceria <b>duas vezes</b> em "meus pedidos". O conserto é aplicar o evento só se a <code>versao</code> for maior que a guardada, ou guardar o <code>evento_id</code> dos já aplicados: idempotência.',
        look: 'O e-1801 passa duas vezes pela esteira; o documento ganha uma segunda linha do 1056, em vermelho.',
        key: 'Um projetor que não é idempotente duplica o pedido.',
        f(o, t) { const f1 = lin(t, 0.3, 2.3, 0, 1), f2 = lin(t, 3, 5, 0, 1), dup = f2 >= 1; lit(o, 'bus'); o.on.doc = dup ? 'bad' : f1 >= 1 ? 1 : 0;
          o.rows.db = DB1(); o.rows.bus.tape = [['e-1801', 'ok'], ['e-1801', f2 > 0 ? 'bad' : 'none'], ['e-1802', 'none']]; o.rows.bus.tapeLabel = 'REENTREGA';
          if (dup) { const d = DOC('1056 · criado · 114,80', ['9 linhas · o 1056 duas vezes', 'bad'], 'bad'); d.rows.splice(2, 0, ['1056 · criado · 114,80', 'bad']); d.rows.pop(); o.rows.doc = d; }
          else o.rows.doc = f1 >= 1 ? DOC8() : DOC7();
          if (dup) o.on.lena = 'bad';
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [dup ? '1056 · 1056 (duas vezes)' : f1 >= 1 ? '1056 · 114,80' : '1055 · 34,90', dup ? 'bad' : 'acc']);
          o.rows.qry = act('projetor', 'SEM IDEMPOTÊNCIA', ['INSERT sem ON CONFLICT', dup ? 'bad' : 'hi'], [f2 > 0 ? 'recebeu o e-1801 de novo' : '', 'bad']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true, tone: f2 > 0 ? 'bad' : '' }];
          pk(o, WAY.ev, f1, 'e-1801'); pk(o, WAY.ev, f2, 'e-1801 de novo', 'bad');
          o.cnt = [['O 1056 NA TELA', dup ? '2 vezes' : f1 >= 1 ? '1 vez' : '…', dup ? 'bad' : ''], ['ENTREGAS DO e-1801', f2 > 0 ? '2' : '1', 'dim'], ['CONSERTO', 'versao ou evento_id', 'dim']];
          o.res = dup ? [['reentrega duplicou o pedido', 'bad']] : [];
          if (dup) T(o, TF(749), '1056 duplicado', 'bad'); } },
    ],
    documento: [
      { id: 'ficha', dur: 5, title: 'Um documento por cliente: meus_pedidos:lena-77', yk: 'O DOCUMENTO',
        code: ['{"cliente_id":"lena-77","versao":8,', ' "pedidos":[{"pedido_id":1056,', '   "status":"criado","itens":[…],', '   "total_centavos":11480,', '   "pagamento":null,"rastreio":null}, …]}'],
        story: 'A tela não faz transação nem JOIN: ela busca um documento por cliente. O modelo de leitura guarda <code>meus_pedidos:lena-77</code> com os 10 últimos pedidos, o mais novo primeiro. Os 8 pedidos da Lena (1042, 1044, 1047, 1048, 1051, 1054, 1055 e 1056) ocupam <b>1.787 bytes</b>, em média <b>223 B</b> por pedido.',
        look: 'A ficha da Lena, à direita, com os 8 pedidos em linhas e o 1056 no topo.',
        key: 'O modelo de leitura tem o formato exato da resposta.',
        f(o) { lit(o, 'doc'); o.rows.db = DB1(); o.rows.doc = DOC8(); o.rows.bus.tape = EV('ok');
          o.cnt = [['DOCUMENTO', '1.787 B'], ['PEDIDOS', '8', 'dim'], ['MÉDIA', '223 B por pedido', 'dim']];
          o.res = [['um documento, a tela inteira', 'acc']]; } },
      { id: 'monta', dur: 7, title: 'O projetor monta o 1056: 336 B entram, 253 B ficam', yk: 'DO EVENTO AO DOCUMENTO',
        code: ['entra: e-1801 PedidoCriado   336 B', 'fica:  o 1056 no documento    253 B', '  status "criado"', '  pagamento null · rastreio null', 'nome e preço da época: não lê o catalogo'],
        story: 'O projetor recebe o <code>e-1801</code> (336 B) e escreve só o que a tela mostra: o 1056 com status "criado", os dois itens com nome e preço da época, o total e, por enquanto, <code>pagamento</code> e <code>rastreio</code> nulos. Ficam <b>253 B</b> no documento. É a mesma topologia do SQL para SQL; só que agora o projetor "fala dois dialetos".',
        look: 'O evento corre pela esteira e o 1056 aparece no topo da ficha; o contador de bytes fecha em 1.787.',
        key: 'O projetor traduz o evento para o formato da tela.',
        f(o, t) { const f = lin(t, 0.4, 3.6, 0, 1), done = f >= 1; lit(o, 'bus'); if (done) lit(o, 'doc');
          o.rows.db = DB1(); o.rows.bus.tape = EV(f > 0 ? (done ? 'ok' : 'recv') : 'none'); o.rows.doc = done ? DOC8() : DOC7();
          o.rows.qry = act('meus-pedidos', 'PROJETOR', ['e-1801 → 1056', 'acc'], ['336 B → 253 B', 'hi'], ['upsert no documento', 'dim']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: !done }, { pts: CAB.ev2, on: !done }];
          pk(o, WAY.ev, f, 'e-1801 · 336 B');
          o.cnt = [['O 1056 NO DOCUMENTO', done ? '253 B' : '…'], ['O EVENTO', '336 B', 'dim'], ['DOCUMENTO', done ? '1.787 B' : '7 pedidos', 'dim']];
          o.res = done ? [['8 pedidos: 1.787 B', 'acc']] : []; } },
      { id: 'chave', dur: 6, title: 'Uma leitura por chave, sem JOIN', yk: 'A TELA PEDE UMA CHAVE',
        code: ['GET meus_pedidos:lena-77', '→ 1 leitura, 1.787 B', 'sem JOIN', 'sem esperar quatro serviços', 'o bff-app repassa como está'],
        story: 'A tela pede o documento de <code>lena-77</code> e recebe tudo numa leitura: sem JOIN, sem esperar quatro serviços. O <code>bff-app</code> repassa o documento como está.',
        look: 'A luz vai do celular ao documento pelo caminho da direita e volta com a ficha inteira.',
        key: 'Um documento é uma leitura por chave.',
        f(o, t) { const f = lin(t, 0.3, 4.3, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.db = DB1(); o.rows.doc = DOC8(); o.rows.bus.tape = EV('ok');
          o.rows.qry = act('meus-pedidos', 'CONSULTA', ['GET lena-77', 'acc'], ['1 leitura por chave', 'hi']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [done ? '8 pedidos · 1056 no topo' : 'abrindo…', done ? 'acc' : 'dim']);
          o.beams = [{ pts: CAB.lb, on: true }, { pts: CAB.bc }, { pts: CAB.bq, on: true }, { pts: CAB.cdb }, { pts: CAB.qdoc, on: true }, { pts: CAB.ev1 }, { pts: CAB.ev2 }];
          pk(o, [...WAY.qry, ...WAY.qdoc], Math.min(1, f * 2) < 1 ? f * 2 : 0, 'GET lena-77'); pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f * 2 - 1, '1.787 B');
          o.cnt = [['LEITURAS', '1'], ['JOIN', 'nenhum', 'dim'], ['RESPOSTA', '1.787 B', 'dim']];
          o.res = done ? [['a tela inteira numa leitura', 'acc']] : []; } },
      { id: 'tamanho', dur: 5, title: '3,35 GB para 1,5 milhão de clientes', yk: 'A CONTA DO TAMANHO',
        code: ['1,5 M clientes × 10 pedidos × 223 B', '  = 3,35 GB (modelo de leitura)', 'tabela pedidos, 50 M linhas (módulo 16):', '  100 GB + 40% de índices = 140 GB', 'guarda só o que a tela mostra'],
        story: '1,5 milhão de clientes × 10 pedidos × 223 B = <b>3,35 GB</b> no armazenamento de leitura. A tabela <code>pedidos</code> de 50 milhões de linhas do módulo 16 pesa 100 GB mais 40% de índices: <b>140 GB</b>. O modelo de leitura é muito menor porque guarda só o que a tela mostra.',
        look: 'O banco de escrita, à esquerda, com 140 GB; o de leitura, à direita, com 3,35 GB.',
        key: 'Pequeno por desenho: só o que a tela mostra.',
        f(o) { lit(o, 'db', 'doc'); o.rows.bus.tape = EV('ok');
          o.rows.db = TBL(['pedidos', 'tbl'], ['50 milhões de linhas', 'hi'], ['100 GB + 40% de índices', 'dim'], ['= 140 GB', 'acc']);
          o.rows.doc = DD(['1,5 milhão de documentos', 'hi'], ['× 10 pedidos × 223 B', 'dim'], ['= 3,35 GB', 'acc']);
          o.cnt = [['MODELO DE LEITURA', '3,35 GB'], ['MODELO DE ESCRITA', '140 GB', 'dim'], ['POR PEDIDO', '223 B', 'dim']];
          o.res = [['3,35 GB contra 140 GB', 'acc']]; } },
      { id: 'es', dur: 6, title: 'No Elasticsearch: nested, _seq_no e _primary_term', yk: 'O ARMAZENAMENTO DO ARTIGO',
        code: ['mapping: pedidos e itens como "nested"', 'GET devolve _version, _seq_no,', '  _primary_term', 'atualizar com if_seq_no e', '  if_primary_term (concorrência otimista)'],
        story: 'O artigo guarda o documento no <b>Elasticsearch</b>, num índice com <code>mapping</code>, e os itens como <code>nested</code> (cada item vira um objeto próprio, e não campos achatados). No <code>GET</code>, ele devolve <code>_version</code>, <code>_seq_no</code> e <code>_primary_term</code>, que servem de controle de concorrência: uma atualização com <code>if_seq_no</code> e <code>if_primary_term</code> só passa se ninguém mudou o documento antes. Servem também uma coluna JSON, um <i>document store</i> ou o Redis.',
        look: 'O documento mostra os campos de controle do Elasticsearch ao lado dos pedidos.',
        key: 'O projetor ganha um dialeto: upsert parcial e controle de concorrência.',
        f(o) { lit(o, 'doc', 'qry'); o.rows.db = DB1(); o.rows.bus.tape = EV('ok');
          o.rows.doc = DD(['índice com mapping', 'hi'], ['pedidos: nested', 'dim'], ['itens: nested', 'dim'], ['GET → _seq_no', 'acc'], ['     _primary_term', 'acc']);
          o.rows.qry = act('meus-pedidos', 'PROJETOR', ['if_seq_no', 'acc'], ['if_primary_term', 'acc'], ['upsert parcial', 'dim']);
          o.cnt = [['CONTROLE', '_seq_no'], ['E', '_primary_term', 'dim'], ['ITENS', 'nested', 'dim']];
          o.res = [['quem atualiza confere a versão', 'acc']]; } },
      { id: 'fora-de-ordem', dur: 9, title: 'E se der errado: o PedidoEnviado chega antes do PedidoCriado', yk: 'EVENTO FORA DE ORDEM',
        code: ['chega primeiro: e-1805 PedidoEnviado', '  rastreio LA123456791BR', '  o 1056 ainda não existe no documento', 'defesa: upsert parcial (cria só o que sabe)', 'depois: e-1801 completa os itens'],
        story: 'O rastreio do 1056 só existe no dia seguinte (<code>e-1805</code> <code>PedidoEnviado</code>, 09:10, <code>LA123456791BR</code>). Imagine que, por um atraso entre partições, ele chegue <b>antes</b> do <code>PedidoCriado</code>. O projetor tenta atualizar um pedido que não existe no documento. A defesa é o <i>upsert</i> parcial: criar o 1056 só com o que o evento sabe (o rastreio) e completar quando o <code>e-1801</code> chegar, com <code>if_seq_no</code> e <code>if_primary_term</code> para que duas atualizações não se atropelem.',
        look: 'O e-1805 chega primeiro e o documento acende em vermelho; o upsert parcial cria o 1056 só com o rastreio, e o e-1801 completa os itens.',
        key: 'Evento fora de ordem pede upsert parcial e controle de concorrência.',
        f(o, t) { const f5 = lin(t, 0.3, 2.3, 0, 1), miss = f5 >= 1 && t < 3.6, part = t >= 3.6, f1 = lin(t, 4.6, 6.6, 0, 1), full = f1 >= 1;
          lit(o, 'bus'); o.on.doc = miss ? 'bad' : part ? 1 : 0;
          o.rows.db = DB1(); o.rows.bus.tape = [['e-1805', f5 > 0 ? 'bad' : 'none'], ['e-1801', f1 > 0 ? (full ? 'ok' : 'recv') : 'none']];
          const R = full ? [['1056 · enviado · 114,80', 'acc'], ['itens: gato, caneca', 'acc'], ['rastreio LA123456791BR', 'acc']]
            : part ? [['1056 · só o rastreio', 'acc'], ['itens: (falta)', 'bad'], ['rastreio LA123456791BR', 'acc']]
            : miss ? [['update no 1056:', 'bad'], ['o pedido não existe', 'bad']] : [['7 pedidos · v7', 'dim'], ['sem o 1056', 'dim']];
          o.rows.doc = DD(...R, ['1055 · 34,90', 'dim']);
          o.rows.qry = act('meus-pedidos', 'PROJETOR', [miss ? 'update falhou' : part ? 'upsert parcial' : 'recebendo', miss ? 'bad' : 'acc'], [full ? 'e-1801 completou' : '', 'acc']);
          o.beams = [{ pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.bq }, { pts: CAB.cdb }, { pts: CAB.qdoc }, { pts: CAB.ev1, on: true }, { pts: CAB.ev2, on: true, tone: f5 < 1 && f5 > 0 ? 'bad' : '' }];
          pk(o, WAY.ev, f5, 'e-1805 · PedidoEnviado', 'bad'); pk(o, WAY.ev, f1, 'e-1801 · PedidoCriado');
          o.cnt = [['CHEGOU PRIMEIRO', 'e-1805', 'bad'], ['O 1056', full ? 'completo' : part ? 'parcial' : miss ? 'não existe' : '…', full ? '' : 'bad'], ['DEFESA', 'upsert parcial', 'dim']];
          o.res = miss ? [['update em pedido que não existe', 'bad']] : full ? [['completo, na ordem que chegou', 'acc']] : part ? [['criado só com o rastreio', 'acc']] : [];
          if (miss) T(o, TF(749), 'o 1056 não existe', 'bad'); } },
    ],
    distribuido: [
      { id: 'compoe', dur: 6, title: 'Composição: o bff-app chama 4 serviços', yk: 'API COMPOSITION (MÓDULO 9)',
        code: ['pedidos · pagamentos · entregas · catalogo', '0,999 × 0,999 × 0,999 × 0,999', '  = 0,999⁴ = 99,6006%', '= 172,5 min/mês fora do ar', 'o mais lento decide a latência'],
        story: 'Hoje o <code>bff-app</code> (módulo 9) monta "meus pedidos" chamando <code>pedidos</code>, <code>pagamentos</code>, <code>entregas</code> e <code>catalogo</code>, cada um com o seu banco. A tela só funciona se os quatro responderem: com 99,9% cada, 0,999⁴ = <b>99,6006%</b>, ou <b>172,5 min/mês</b> fora do ar (a conta em série do módulo 12). O mais lento decide a latência, e cada serviço entra no raio de explosão da tela.',
        look: 'Quatro cabos saem do bff-app, um para cada serviço à esquerda. O lado direito está apagado.',
        key: 'Composição soma o risco de quatro serviços.',
        f(o) { distBase(o); lit(o, 'bff', 'cmd', 'pag', 'ent', 'cat');
          o.rows.bff = act('bff-app', 'COMPÕE', ['chama 4 serviços', 'acc'], ['espera o mais lento', 'dim']);
          compose(o, false);
          o.cnt = [['DISPONIBILIDADE', '99,6006%'], ['FORA POR MÊS', '172,5 min', 'dim'], ['SERVIÇOS CHAMADOS', '4', 'dim']];
          o.res = [['os 4 precisam responder', 'acc']]; } },
      { id: 'cai', dur: 6, title: 'pagamentos cai: a tela composta falha', yk: 'UM DOS QUATRO FORA', act: ['Derrubar pagamentos', 'composição'],
        code: ['pagamentos: fora do ar', 'bff-app: 3 de 4 responderam', 'a tela falha, ou mostra', '  "status indisponível" (fallback, módulo 9)', 'raio de explosão: a tela inteira'],
        story: 'O serviço <code>pagamentos</code> cai. A tela composta depende dele: ou falha, ou mostra "status indisponível", o <i>fallback</i> do módulo 9. Um serviço fora derruba uma tela que nem é dele.',
        look: 'O pagamentos fica vermelho e o cabo dele também; a tela da Lena fica vermelha.',
        key: 'Na composição, qualquer fonte fora derruba a tela.',
        f(o, t) { distBase(o); const down = t > 0.8; lit(o, 'bff', 'cmd', 'ent', 'cat'); o.on.pag = down ? 'bad' : 1; if (down) o.on.lena = 'bad';
          o.rows.pag = act('pagamentos', down ? 'FORA DO AR' : 'SERVIÇO', [down ? 'não responde' : 'PedidoPago · cartão', down ? 'bad' : 'dim']);
          o.rows.bff = act('bff-app', 'COMPÕE', [down ? '3 de 4 responderam' : 'chama 4 serviços', down ? 'bad' : 'acc'], [down ? '"status indisponível"' : 'espera o mais lento', down ? 'bad' : 'dim']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [down ? 'status indisponível' : '1056 · pago', down ? 'bad' : 'acc']);
          compose(o, down);
          o.cnt = [['A TELA COMPOSTA', down ? 'falha' : 'ok', down ? 'bad' : ''], ['SERVIÇOS DE PÉ', down ? '3 de 4' : '4 de 4', 'dim'], ['FALLBACK', down ? '"indisponível"' : '…', 'dim']];
          o.res = down ? [['um serviço fora, a tela fora', 'bad']] : [];
          if (down) T(o, [155, 70, 40], 'pagamentos fora', 'bad'); } },
      { id: 'eventos', dur: 8, title: 'Por eventos: 3 tópicos alimentam um documento', yk: 'O PADRÃO CQRS DE MICROSERVICES.IO',
        code: ['pedidos     → PedidoCriado  (itens)', 'pagamentos  → PedidoPago    (cartão)', 'entregas    → PedidoEnviado (rastreio)', 'catalogo: não precisa (o evento', '  já leva nome e preço da época)'],
        story: 'O outro jeito: cada dono publica o seu evento. <code>PedidoCriado</code> (de <code>pedidos</code>), <code>PedidoPago</code> (de <code>pagamentos</code>) e <code>PedidoEnviado</code> (de <code>entregas</code>) alimentam <b>um</b> documento. O <code>catalogo</code> não precisa entrar: o evento já leva o nome e o preço da época. É o padrão "CQRS" de microservices.io, a alternativa à <i>API Composition</i>.',
        look: 'Três fontes mandam eventos para a esteira; o projetor junta tudo no documento do 1056. O catalogo fica apagado.',
        key: 'O modelo de leitura é montado por eventos de vários donos.',
        f(o, t) { distBase(o); const fc = lin(t, 0.3, 2.3, 0, 1), fp = lin(t, 2.3, 4.3, 0, 1), fe = lin(t, 4.3, 6.3, 0, 1);
          lit(o, 'bus'); if (fc > 0 && fc < 1) lit(o, 'cmd'); if (fp > 0 && fp < 1) lit(o, 'pag'); if (fe > 0 && fe < 1) lit(o, 'ent'); if (fc >= 1) lit(o, 'doc');
          o.rows.bus.tape = [['pedidos', fc >= 1 ? 'ok' : fc > 0 ? 'recv' : 'none'], ['pagamentos', fp >= 1 ? 'ok' : fp > 0 ? 'recv' : 'none'], ['entregas', fe >= 1 ? 'ok' : fe > 0 ? 'recv' : 'none']];
          o.rows.doc = DD(['1056', 'hi'], [fc >= 1 ? 'itens: gato, caneca ✓' : 'itens: …', fc >= 1 ? 'acc' : 'dim'], [fp >= 1 ? 'pagamento: cartão ✓' : 'pagamento: …', fp >= 1 ? 'acc' : 'dim'], [fe >= 1 ? 'rastreio: LA123456791BR ✓' : 'rastreio: …', fe >= 1 ? 'acc' : 'dim']);
          o.rows.qry = act('meus-pedidos', 'PROJETOR', ['3 tópicos → 1 documento', 'acc'], ['upsert por pedido_id', 'dim']);
          o.rows.cat = act('catalogo', 'NÃO ENTRA', ['o evento já leva o nome', 'dim']);
          only(o, { pts: CAB.qdoc }, { pts: CAB.bq }, { pts: CAB.lb }, { pts: CAB.bc }, { pts: CAB.ecmd, on: fc > 0 && fc < 1 }, { pts: CAB.epag, on: fp > 0 && fp < 1 }, { pts: CAB.eent, on: fe > 0 && fe < 1 });
          pk(o, [...CAB.ecmd, ...ONBUS(168)], fc, 'PedidoCriado'); pk(o, [...CAB.epag, ...ONBUS(108)], fp, 'PedidoPago'); pk(o, [...CAB.eent, ...ONBUS(142)], fe, 'PedidoEnviado');
          o.cnt = [['TÓPICOS', '3'], ['PROJETOR', '1', 'dim'], ['ARMAZENAMENTO', '1', 'dim']];
          o.res = fe >= 1 ? [['o 1056 completo num documento', 'acc']] : []; } },
      { id: 'le', dur: 5, title: 'A tela lê um lugar só: 99,9%', yk: 'UM ARMAZENAMENTO',
        code: ['GET /meus-pedidos → 1 documento', 'disponibilidade: 99,9%', '= 43,2 min/mês fora', 'contra 99,6006% e 172,5 min/mês', 'latência: uma leitura por chave'],
        story: 'Agora a tela lê um lugar só: <b>99,9%</b>, ou <b>43,2 min/mês</b> fora, contra os 172,5 da composição. A latência é a de uma leitura por chave, e não a do mais lento dos quatro. O preço: três tópicos, um projetor, um armazenamento, e uma consistência eventual multiplicada, porque cada fonte tem o seu atraso.',
        look: 'Só o caminho da direita acende: celular, bff-app, meus-pedidos, documento.',
        key: 'O modelo por eventos tira os quatro serviços do caminho da tela.',
        f(o, t) { distBase(o); const f = lin(t, 0.3, 3.3, 0, 1), done = f >= 1; lit(o, 'doc', 'qry'); if (done) lit(o, 'lena');
          o.rows.bus.tape = [['pedidos', 'ok'], ['pagamentos', 'ok'], ['entregas', 'ok']];
          o.rows.doc = DD(['1056', 'hi'], ['itens: gato, caneca', 'acc'], ['pagamento: cartão', 'acc'], ['rastreio: LA123456791BR', 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], [done ? '1056 · completo' : 'abrindo…', done ? 'acc' : 'dim']);
          only(o, { pts: CAB.qdoc, on: true }, { pts: CAB.bq, on: true }, { pts: CAB.lb, on: true }, { pts: CAB.bc }, { pts: CAB.trunk }, { pts: CAB.bpag }, { pts: CAB.bent }, { pts: CAB.bcat });
          pk(o, [...rev(WAY.qdoc), ...rev(WAY.qry)], f, '1 documento');
          o.cnt = [['DISPONIBILIDADE', '99,9%'], ['FORA POR MÊS', '43,2 min', 'dim'], ['COMPOSIÇÃO', '172,5 min', 'dim']];
          o.res = done ? [['um lugar só: 43,2 min/mês', 'acc']] : []; } },
      { id: 'cai-de-novo', dur: 6, title: 'pagamentos cai de novo: a tela continua', yk: 'A MESMA QUEDA, OUTRO DESENHO', act: ['Derrubar pagamentos', 'modelo de leitura'],
        code: ['pagamentos: fora do ar', 'o tópico pagamentos para de receber', 'o documento guarda o último status:', '  pagamento: cartão', 'a tela segue de pé'],
        story: 'O mesmo <code>pagamentos</code> cai. Agora a tela não o chama: lê o documento, que guarda o <b>último status</b> que conhece (<code>pagamento: cartão</code>). A Lena continua vendo o 1056. O que fica parado é só a atualização do pagamento, até o serviço voltar e o tópico andar de novo.',
        look: 'O pagamentos fica vermelho, mas o caminho da direita continua aceso e a tela da Lena também.',
        key: 'O modelo por eventos isola a tela da queda de uma fonte.',
        f(o, t) { distBase(o); const down = t > 0.8; lit(o, 'doc', 'qry', 'lena'); o.on.pag = down ? 'bad' : 1;
          o.rows.pag = act('pagamentos', down ? 'FORA DO AR' : 'SERVIÇO', [down ? 'não publica' : 'PedidoPago · cartão', down ? 'bad' : 'dim']);
          o.rows.bus.tape = [['pedidos', 'ok'], ['pagamentos', down ? 'bad' : 'ok'], ['entregas', 'ok']];
          o.rows.doc = DD(['1056', 'hi'], ['itens: gato, caneca', 'acc'], ['pagamento: cartão', 'acc'], [down ? '(último status conhecido)' : 'rastreio: LA123456791BR', down ? 'dim' : 'acc']);
          o.rows.lena = act('Lena', 'Recife', ['meus pedidos', 'dim'], ['1056 · pago (cartão)', 'acc']);
          only(o, { pts: CAB.qdoc, on: true, flow: true }, { pts: CAB.bq, on: true, flow: true }, { pts: CAB.lb, on: true, flow: true }, { pts: CAB.epag, tone: down ? 'bad' : '' }, { pts: CAB.eent }, { pts: CAB.ecmd }, { pts: CAB.bc });
          o.cnt = [['A TELA', 'de pé'], ['PAGAMENTOS', down ? 'fora' : 'ok', down ? 'bad' : 'dim'], ['STATUS MOSTRADO', 'o último: cartão', 'dim']];
          o.res = down ? [['uma fonte fora, a tela de pé', 'acc']] : [];
          if (down) T(o, [155, 70, 40], 'pagamentos fora', 'bad'); } },
      { id: 'fantasma', dur: 10, title: 'E se der errado: o pedido fantasma sem itens', yk: 'O PedidoCriado SE PERDEU',
        code: ['PedidoCriado do 1056: nunca chega', 'PedidoPago e PedidoEnviado: chegam', '→ 1056 com pagamento e rastreio, sem itens', 'verificador: sem itens há mais de 5 min?', '  GET /pedidos/1056 e completa'],
        story: 'Suponha que o <code>PedidoCriado</code> do 1056 nunca chegue ao modelo de leitura (a escrita dupla da aula 8 mostra como isso acontece), mas o <code>PedidoPago</code> e o <code>PedidoEnviado</code> cheguem. O documento do 1056 fica com pagamento e rastreio e <b>sem itens</b>: um pedido fantasma que nunca completa. A defesa é um <b>verificador</b> (reconciliação): para documentos sem itens há mais de 5 minutos, ele chama <code>GET /pedidos/1056</code> e completa o que falta.',
        look: 'O PedidoCriado some no caminho; os outros dois chegam e o documento fica vermelho, sem itens. Depois o verificador busca o pedido no pedidos e completa.',
        key: 'Documento incompleto é um estado real: a reconciliação existe para isso.',
        f(o, t) { distBase(o); const fc = lin(t, 0.3, 1.6, 0, 0.45), fp = lin(t, 1.2, 3, 0, 1), fe = lin(t, 2.4, 4.2, 0, 1), ghost = fe >= 1 && t < 7, fix = lin(t, 7, 8.6, 0, 1), done = fix >= 1;
          lit(o, 'bus'); o.on.doc = ghost ? 'bad' : done ? 1 : 0; if (fix > 0 && !done) lit(o, 'cmd'); if (fc > 0 && t < 2) o.on.cmd = 1;
          o.rows.bus.tape = [['pedidos', fc >= 0.45 ? 'bad' : fc > 0 ? 'recv' : 'none'], ['pagamentos', fp >= 1 ? 'ok' : 'none'], ['entregas', fe >= 1 ? 'ok' : 'none']];
          o.rows.doc = DD(['1056', ghost ? 'bad' : 'hi'], [done ? 'itens: gato, caneca ✓' : 'itens: (nenhum)', done ? 'acc' : fe >= 1 ? 'bad' : 'dim'], [fp >= 1 ? 'pagamento: cartão' : 'pagamento: …', fp >= 1 ? 'acc' : 'dim'], [fe >= 1 ? 'rastreio: LA123456791BR' : 'rastreio: …', fe >= 1 ? 'acc' : 'dim']);
          o.rows.qry = act('meus-pedidos', 'VERIFICADOR', [t < 5 ? 'esperando' : done ? 'completou o 1056' : 'sem itens há > 5 min', done ? 'acc' : t < 5 ? 'dim' : 'bad'], [t >= 7 ? 'GET /pedidos/1056' : '', 'acc']);
          only(o, { pts: CAB.qdoc, on: fix > 0 && !done }, { pts: CAB.bq, on: fix > 0 && !done }, { pts: CAB.bc, on: fix > 0 && !done }, { pts: CAB.lb },
            { pts: CAB.ecmd, tone: fc >= 0.45 ? 'bad' : '', on: fc > 0 && fc < 0.45 }, { pts: CAB.epag, on: fp > 0 && fp < 1 }, { pts: CAB.eent, on: fe > 0 && fe < 1 });
          if (fc < 0.45) pk(o, [...CAB.ecmd, ...ONBUS(168)], fc, 'PedidoCriado', 'bad');
          pk(o, [...CAB.epag, ...ONBUS(108)], fp, 'PedidoPago'); pk(o, [...CAB.eent, ...ONBUS(142)], fe, 'PedidoEnviado');
          pk(o, P3([[749, 230], [749, 322], [594, 322, ZT], [310, 322, ZT], [270, 322]]), fix, 'GET /pedidos/1056');
          o.cnt = [['O 1056', done ? 'completo' : ghost ? 'sem itens' : '…', ghost ? 'bad' : ''], ['PedidoCriado', fc >= 0.45 ? 'perdido' : '…', 'bad'], ['VERIFICADOR', '> 5 min sem itens', 'dim']];
          o.res = ghost ? [['pedido fantasma: nunca completa', 'bad']] : done ? [['a reconciliação completou', 'acc']] : [];
          if (fc >= 0.45 && t < 7) T(o, [300, 220, 30], 'PedidoCriado perdido', 'bad'); } },
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
    'dois-modelos': () => `<li>O evento <code>e-1801</code> (JSON compacto, <b>336 B</b>): <code>{"evento_id":"e-1801","tipo":"PedidoCriado","pedido_id":1056,"cliente_id":"lena-77","versao":1,"itens":[{"produto_id":42,"nome":"gato de pelúcia","qtd":1,"preco_centavos":7990},{"produto_id":7,"nome":"caneca azul","qtd":1,"preco_centavos":1990}],"frete_centavos":1500,"total_centavos":11480,"criado_em":"2026-11-27T20:12:00.000-03:00"}</code></li><li>A versão <i>notification</i> (só <code>evento_id</code>, <code>tipo</code>, <code>pedido_id</code>, <code>versao</code>) tem <b>72 B</b> e obriga uma chamada de volta</li><table class="h3-sum"><tr><th>modelo</th><th>forma</th><th>o 1056 fica assim</th></tr><tr${step < 4 ? ' class="on"' : ''}><td>escrita</td><td>normalizado</td><td>1 linha em pedidos + 2 em itens_pedido</td></tr><tr${step >= 4 ? ' class="on"' : ''}><td>leitura</td><td>desnormalizado</td><td>253 B dentro do documento de 1.787 B</td></tr></table><li>A consulta da tela no modelo normalizado (PostgreSQL 14, 5 tabelas, 8 pedidos, com índice): <code>Execution Time</code> <b>0,23 a 0,31 ms</b>, ~100 páginas em <code>shared hit</code></li><li>Martin Fowler: "for most systems CQRS adds risky complexity"</li><li>CQRS não é <i>event sourcing</i> (módulo 20) e não exige dois bancos</li>`,
    view: () => `<table class="h3-sum"><tr><th>medida (PostgreSQL 14)</th><th>300 mil</th><th>50 M (est.)</th></tr><tr${step === 0 ? ' class="on"' : ''}><td>relatório</td><td>~235 ms</td><td>~40 s</td></tr><tr${step === 1 ? ' class="on"' : ''}><td>criar a view</td><td>406 ms</td><td></td></tr><tr${step === 2 ? ' class="on"' : ''}><td>ler a view</td><td>0,021 ms</td><td>~0,021 ms</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>REFRESH</td><td>401 ms</td><td>~67 s</td></tr><tr${step === 4 ? ' class="on"' : ''}><td>REFRESH CONCURRENTLY</td><td>340 ms</td><td>~57 s</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>leitor esperando, simples</td><td>2.285 ms</td><td>até ~67 s</td></tr><tr${step === 4 ? ' class="on"' : ''}><td>leitor esperando, concorrente</td><td>12 ms</td><td>pouco</td></tr></table><li>Três execuções do relatório: 238,8 · 240,7 · 227,6 ms</li><li>Leitor bloqueado: <code>wait_event_type = Lock</code>, <code>wait_event = relation</code></li><li>Depois de um pedido de caneca: <b>100003 | 150004</b> até o <code>REFRESH</code>; <b>100004 | 150005</b> depois</li><li>A tabela do artigo (<code>vw_prescricoes_medicamentos_detalhadas</code>, com <code>INSERT … SELECT</code>) é uma tabela desnormalizada, não uma view materializada</li>`,
    replica: () => `<li>Réplica em <i>hot standby</i>, <code>max_standby_streaming_delay = 1s</code> (PostgreSQL 14.24, 20/10/2026):</li><table class="h3-sum"><tr><th>t</th><th>o que aconteceu</th></tr><tr><td>0 s</td><td>consulta de 6 s na réplica</td></tr><tr><td>2 s</td><td>DELETE + VACUUM no primário</td></tr><tr class="on"><td>3,16 s</td><td>a consulta morre</td></tr></table><li><b>ERROR: canceling statement due to conflict with recovery</b> · DETAIL: User query might have needed to see row versions that must be removed.</li><li>Padrão da documentação: <code>max_standby_streaming_delay</code> = <b>30 s</b>; o relatório de ~40 s seria cancelado</li><li>Consertos: <code>hot_standby_feedback</code> (o primário não limpa: a tabela incha) ou subir o atraso (a réplica fica mais atrás)</li><li>Black Friday: Recife <b>800 ms</b> atrás; Lena a ~2 ms de Recife, 80 ms de SP</li>`,
    eventual: () => `<table class="h3-sum"><tr><th>etapa (exemplo)</th><th>+ms</th><th>relógio</th></tr><tr><td>commit</td><td>4</td><td>.004</td></tr><tr><td>o CDC lê o WAL</td><td>30</td><td>.034</td></tr><tr><td>Kafka, acks=all</td><td>10</td><td>.044</td></tr><tr class="on"><td>a Lena abre a tela</td><td></td><td>.050</td></tr><tr><td>o consumidor pega</td><td>20</td><td>.064</td></tr><tr><td>upsert no documento</td><td>10</td><td>.074</td></tr></table><table class="h3-sum"><tr><th>Black Friday</th><th>resultado</th></tr><tr${step === 6 ? ' class="on"' : ''}><td>1 instância: 120/s entram, 100/s saem</td><td>12.000 eventos em 10 min = 120 s</td></tr><tr${step === 7 ? ' class="on"' : ''}><td>3 instâncias: 40/s cada</td><td>40% de uso</td></tr><tr${step === 7 ? ' class="on"' : ''}><td>1 de 3 parada 10 min</td><td>24.000 eventos, 400 s para drenar</td></tr><tr><td>relay do laboratório (poll de 2 s)</td><td>1 s em média, 2 s no pior caso</td></tr></table><li>Reconstruir do zero: 200 milhões de eventos a 20.000/s = <b>2 h 47 min</b>; o tópico guarda só 7 dias</li><li><code>hospital-cqrs-sql/internal/events/handler.go</code>: <code>INSERT</code> sem <code>ON CONFLICT</code> (lido no código, não executado)</li>`,
    documento: () => `<table class="h3-sum"><tr><th>item</th><th>valor</th></tr><tr${step === 0 ? ' class="on"' : ''}><td>documento da Lena (8 pedidos)</td><td>1.787 B</td></tr><tr><td>média por pedido</td><td>223 B</td></tr><tr${step === 1 ? ' class="on"' : ''}><td>pedido 1056 (2 itens, criado)</td><td>253 B</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>1,5 M clientes × 10 × 223 B</td><td>3,35 GB</td></tr><tr${step === 3 ? ' class="on"' : ''}><td>tabela pedidos (50 M linhas)</td><td>140 GB</td></tr><tr><td>evento PedidoCriado (e-1801)</td><td>336 B</td></tr></table><li>Tamanhos contados em Python, JSON compacto em UTF-8 (o "ú" de "pelúcia" pesa 2 bytes)</li><li>Elasticsearch: <code>nested</code> nos itens; <code>_version</code>, <code>_seq_no</code>, <code>_primary_term</code> no <code>GET</code>; <code>if_seq_no</code>/<code>if_primary_term</code> para atualizar</li><li>Mudar o tipo de um campo do <code>mapping</code> exige índice novo e reindexar a partir da fonte</li><li>No artigo, o <code>mapping</code> é criado em <code>PUT /prontuarios</code> e o documento gravado em <code>POST /prescricoes/_doc/1</code>: o mapeamento não vale para o outro índice</li>`,
    distribuido: () => `<table class="h3-sum"><tr><th></th><th>composição</th><th>por eventos</th></tr><tr><td>disponibilidade</td><td>0,999⁴ = 99,6006%</td><td>99,9%</td></tr><tr><td>fora por mês</td><td>172,5 min</td><td>43,2 min</td></tr><tr><td>latência</td><td>a do mais lento</td><td>1 leitura por chave</td></tr><tr${step === 1 || step === 4 ? ' class="on"' : ''}><td>pagamentos cai</td><td>a tela falha</td><td>mostra o último status</td></tr><tr><td>consistência</td><td>forte, na chamada</td><td>eventual, por fonte</td></tr><tr><td>peças novas</td><td>nenhuma</td><td>3 tópicos, 1 projetor, 1 armazenamento</td></tr></table><li>Ordem: o Kafka garante ordem só dentro de uma partição; o <code>PedidoPago</code> pode chegar antes do <code>PedidoCriado</code>: upsert parcial por <code>pedido_id</code> e <code>versao</code> por fonte</li><li>Rastreio do 1056: <code>LA123456791BR</code> (e-1805, dia seguinte, 09:10)</li><li>Verificador: documentos sem itens há mais de 5 min → <code>GET /pedidos/1056</code></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo (fazer o 1056, abrir a tela, usar o token, derrubar pagamentos…): avança para o passo seguinte
  function actHtml() { const a = cur().act; if (!a) return '';
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
  function readout() { if (active !== 'cqrs') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
