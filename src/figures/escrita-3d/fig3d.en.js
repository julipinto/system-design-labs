// Figura 3D (iso-glow): do banco ao evento sem perder nada. À esquerda o serviço pedidos (na frente) e o PostgreSQL loja (atrás),
// com as tabelas pedidos, itens_pedido e, na Outbox, a tabela outbox embaixo delas. No meio, a fita do WAL com o Debezium (atrás)
// e o relay (um ou dois). À direita, o Kafka (atrás) e quem escuta ele: o meus-pedidos (o modelo de leitura da Lena) e o pagamentos.
// Atrás, o mostrador (a conta do passo, o código ou o SQL, e o resultado).
// Cenários (botões e ?mode=dual-write|falha-dual|cdc|outbox|relay-duplicado; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/cqrs-brief.md) e as aulas 8–10 (COMMIT do 1056 às 20:12:00.004; e-1801 de 336 B;
// 0,1% × 30 pedidos/s = 108 por hora; handler.go linhas 51/78/79/85; cdc_handler.go só c e r; test_decoding BEGIN 832 … COMMIT 832;
// relay de 2 s, lote 100, 5 tentativas; WAL 359,6 → 1.232,7 → 2.735,8 B; SKIP LOCKED 1–4 e 5–8; o relay do lab sem SKIP LOCKED).
FIGS3D.push({ id: 'escrita', name: 'Do banco ao evento', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return thou(+a) + (b ? '.' + b : ''); };
  const clock = ms => { const v = Math.max(0, Math.round(ms)), s = Math.floor(v / 1000); return '20:12:' + String(s).padStart(2, '0') + '.' + String(v % 1000).padStart(3, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['dual-write', 'falha-dual', 'cdc', 'outbox', 'relay-duplicado'];
  const SCNAME = { 'dual-write': 'Dual-write', 'falha-dual': 'Dual-write failure', cdc: 'CDC', outbox: 'Outbox', 'relay-duplicado': 'Duplicate relay' };
  const SCFULL = { 'dual-write': 'Dual write', 'falha-dual': "The lab's and the article's dual write", cdc: 'Change Data Capture',
    outbox: 'Transactional outbox', 'relay-duplicado': 'The relay that publishes twice' };
  const AULA = { 'dual-write': 'aula-8-dual-write-pattern', 'falha-dual': 'aula-8-dual-write-pattern', cdc: 'aula-9-change-data-capture-cdc',
    outbox: 'aula-10-transactional-outbox', 'relay-duplicado': 'aula-10-transactional-outbox' };
  let clk = 0, sc = 'dual-write', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-escrita3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

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
  const BIG = { s1: 18, fs: 14, lh: 18, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  block('db', 40, 40, 250, 210, 30); block('cmd', 40, 290, 250, 110, 24);
  block('wal', 320, 40, 270, 86, 12, SMALL); block('relay', 320, 160, 270, 76, 16, SMALL); block('relay2', 320, 262, 270, 76, 16, SMALL);
  block('kfk', 620, 40, 244, 170, 24); block('doc', 620, 240, 244, 100, 18, SMALL); block('pag', 620, 352, 244, 60, 14, SMALL);
  const NAMES = Object.keys(B);
  // os pedidos sem evento: cartões vermelhos empilhados no meio da prancha
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz: escritas, linhas do log e eventos
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
  const TF = x => [x, 422, 36];   // balão na faixa livre da frente da prancha

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const CAB = {
    cdb: P3([[165, 290], [165, 250]]),                                   // pedidos → banco (a escrita 1)
    pub: P3([[290, 372], [605, 372], [605, 190], [620, 190]]),           // pedidos → Kafka (a escrita 2 do dual-write)
    kdoc: P3([[742, 210], [742, 240]]), kpag: P3([[864, 120], [884, 120], [884, 382], [864, 382]]),
    dbwal: P3([[290, 83], [320, 83]]), walk: P3([[590, 83], [620, 83]]),   // banco → WAL/Debezium → Kafka
    dbrel: P3([[290, 198], [320, 198]]), relk: P3([[590, 198], [620, 198]]), // banco → relay → Kafka
    dbrel2: P3([[290, 238], [305, 238], [305, 300], [320, 300]]), rel2k: P3([[590, 300], [605, 300], [605, 204], [620, 204]]),
    back: P3([[620, 290], [300, 290], [300, 244], [290, 244]]),          // meus-pedidos → banco de escrita (o handler do CDC)
  };
  // caminhos dos pontos de luz
  const WAY = {
    cdb: P3([[165, 345, ZT], [165, 290], [165, 250]]),
    pub: P3([[220, 372, ZT], [290, 372], [605, 372], [605, 190], [620, 190]]),
    wal: P3([[200, 83, 40], [290, 83], [320, 83], [590, 83, 22], [620, 83]]),
    rel: P3([[200, 198, 40], [290, 198], [320, 198], [590, 198, 26], [620, 198]]),
    rel2: P3([[200, 238, 40], [290, 238], [305, 238], [305, 300], [320, 300], [590, 300, 26], [605, 300], [605, 204], [620, 204]]),
    kdoc: P3([[742, 160, 34], [742, 210], [742, 240], [742, 280, 28]]),
    kpag: P3([[800, 120, 34], [864, 120], [884, 120], [884, 382], [864, 382], [800, 382, 24]]),
    back: P3([[680, 290, 28], [620, 290], [300, 290], [300, 244], [290, 244], [220, 230, 40]]),
  };
  // um ponto de luz andando num caminho: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const small = (d, fs = 13, lh = 17.5, y0 = 39) => { d.fs = fs; d.lh = lh; d.y0 = y0; return d; };
  // o banco loja: pedidos e itens_pedido; na Outbox, a tabela outbox embaixo
  const ITENS = tn => [['1056 · 42 · 1 × 79.90', tn], ['1056 · 7 · 1 × 19.90', tn]];
  // com a outbox embaixo e o 1056 gravado, o 1055 sai do bloco para caber tudo
  const DB = (has, tn = 'acc', st = 'criado', ...out) => { const old = !(has && out.length);
    return small(act('PostgreSQL loja', 'WRITE', ['pedidos', 'tbl'],
      has ? [`1056 · lena-77 · ${st}`, tn] : null, old ? ['1055 · lena-77 · 34.90', 'dim'] : null, ['itens_pedido', 'tbl'],
      ...(has ? ITENS(tn) : []), ...(old ? [['1055 · 7 · 1 × 19.90', 'dim']] : []),
      ...(out.length ? [['outbox', 'tbl'], ...out] : []))); };
  const KF = (rows, tape, meta = 'BROKER') => { const d = act('Kafka', meta, ...rows); d.fs = 13; d.lh = 18; if (tape) { d.tape = tape; d.tapeLabel = 'TOPIC'; } return d; };
  const LIST = ['lena-77 list', 'dim'];
  const DOC = (...r) => act('meus-pedidos', 'READ', LIST, ...(r.length ? r : [['1055 · 34.90', 'hi']]));
  const DOC1 = (tn = 'acc', st = 'criado') => DOC([`1056 · ${st} · 114.80`, tn], ['1055 · 34.90', 'dim']);
  const SHOW = { 'dual-write': ['db', 'cmd', 'kfk', 'doc', 'pag'], 'falha-dual': ['db', 'cmd', 'kfk', 'doc', 'pag'],
    cdc: ['db', 'cmd', 'wal', 'kfk', 'doc'], outbox: ['db', 'cmd', 'relay', 'kfk', 'doc'], 'relay-duplicado': ['db', 'cmd', 'relay', 'kfk', 'doc'] };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.db = DB(false);
    o.rows.cmd = act('pedidos', 'SERVICE', ['CriarPedido(lena-77)', 'hi'], ['1 cat + 1 mug + shipping', 'dim'], ['total 114.80', 'dim']);
    o.rows.kfk = KF([['pedidos topic', 'dim'], ['key: pedido_id', 'dim']], [['', 'none'], ['', 'none'], ['', 'none']]);
    o.rows.doc = DOC();
    o.rows.pag = act('pagamentos', 'CONSUMER', ['charges on seeing PedidoCriado', 'dim']);
    o.rows.wal = act('WAL', 'SLOT · pgoutput', ['Debezium reads the database log', 'dim']); o.rows.wal.tape = []; o.rows.wal.tapeLabel = 'LOG';
    o.rows.relay = act('relay', 'POLL 2 s', ['batch 100 · up to 5 attempts', 'dim'], ['outbox_relay.go', 'dim']);
    o.rows.relay2 = act('relay B', 'POLL 2 s', ['second process', 'dim']);
    if (sc === 'dual-write' || sc === 'falha-dual') {
      o.rows.cmd = act('pedidos', 'SERVICE', ['CriarPedido(lena-77)', 'hi'], ['1. INSERT into the database', 'dim'], ['2. publish to Kafka', 'dim']);
      o.beams.push({ pts: CAB.cdb }, { pts: CAB.pub }, { pts: CAB.kdoc }, { pts: CAB.kpag });
    } else if (sc === 'cdc') {
      o.rows.cmd = act('pedidos', 'SERVICE', ['CriarPedido(lena-77)', 'hi'], ['only writes to the database', 'dim'], ['no Kafka producer', 'dim']);
      o.rows.kfk = KF([['loja.public.pedidos', 'dim'], ['loja.public.itens_pedido', 'dim']], null, 'TWO TOPICS');
      o.beams.push({ pts: CAB.cdb }, { pts: CAB.dbwal }, { pts: CAB.walk }, { pts: CAB.kdoc });
    } else {
      o.rows.cmd = act('pedidos', 'SERVICE', ['CriarPedido(lena-77)', 'hi'], ['order + event', 'dim'], ['in one transaction', 'dim']);
      o.rows.db = DB(false, 'acc', 'criado', ['empty', 'dim']);
      o.beams.push({ pts: CAB.cdb }, { pts: CAB.dbrel }, { pts: CAB.relk }, { pts: CAB.kdoc });
    }
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const hide = (o, ...nm) => nm.forEach(n => o.show[n] = 0);
  const showX = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  // liga/pinta um cabo (e o põe na lista se ainda não estiver)
  const bm = (o, pts, p) => { const b = o.beams.find(b => b.pts === pts); if (b) Object.assign(b, p); else o.beams.push({ pts, ...p }); };
  const TAPE1 = (s, lab = 'e-1801') => [[lab, s], ['', 'none'], ['', 'none']];
  // a linha do 1056 na outbox: pendente (acesa) ou publicada
  const OUT1 = (st, id = 1) => [`${id} · PedidoCriado · e-1801`, st === 'pub' ? 'dim' : st === 'bad' ? 'bad' : 'acc'];
  const OUTST = (st, id = 1) => [st === 'pub' ? '  published_at = 20:12:02' : '  processed_at IS NULL', st === 'pub' ? 'dim' : st === 'bad' ? 'bad' : 'hi'];

  // ── o que se vê em cada passo ──
  const STEPS = {
    'dual-write': [
      { id: 'cena', dur: 5, title: 'Two writes, two systems', yk: 'THE COMMAND FOR 1056', act: ['Place 1056', 'INSERT + publish'],
        code: ['1. INSERT into PostgreSQL loja', '   pedidos + itens_pedido · COMMIT', '2. publish to Kafka', '   e-1801 PedidoCriado · 336 B', 'nothing ties 1 to 2'],
        story: 'On the left, the <code>pedidos</code> service and the PostgreSQL <code>loja</code>. On the right, Kafka and whoever listens to the topic: <code>meus-pedidos</code> (Lena\'s read model) and <code>pagamentos</code>. In the dual write, the command for 1056 does two things in sequence: it writes to the database and publishes the event to the broker. The two cables leave the same service and do not know about each other.',
        look: 'Two cables leave pedidos: one goes up to the database, the other crosses the plate to Kafka. Neither goes through the other.',
        key: 'A dual write is two writes in two places, with nothing to make them atomic.',
        f(o) { lit(o, 'cmd');
          o.cnt = [['WRITES', '2'], ['TRANSACTIONS', '1 (database only)', 'dim'], ['ATOMIC', 'no', 'dim']];
          o.res = [['two writes, no guarantee', 'acc']];
          T(o, [165, 268, 40], 'write 1: database', 'dim'); T(o, [455, 392, 26], 'write 2: broker', 'dim'); } },
      { id: 'commit', dur: 5, title: 'INSERT and COMMIT at 20:12:00.004', yk: 'WRITE 1: THE DATABASE',
        code: ['BEGIN;', "INSERT INTO pedidos (1056, 'lena-77', …);", 'INSERT INTO itens_pedido … (42, 1, 7990);', 'INSERT INTO itens_pedido … (7, 1, 1990);', 'COMMIT;   -- 20:12:00.004'],
        story: 'At <b>20:12:00.000</b> Lena closes the purchase: 1 plush cat (79.90), 1 blue mug (19.90) and Recife shipping (15.00), <b>114.80</b>. <code>pedidos</code> writes 1 row in <code>pedidos</code> and 2 in <code>itens_pedido</code> and does a <code>COMMIT</code> at <b>20:12:00.004</b>. The first write is done. Kafka does not know anything yet.',
        look: 'The light goes down from pedidos to the database and the 1056 rows light up. The Kafka cable stays dark.',
        key: 'The first write is a normal transaction, and it does not know a second one exists.',
        f(o, t) { const ms = lin(t, 0.4, 3, 0, 4), ok = ms >= 4; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.db = DB(ok); bm(o, CAB.cdb, { on: !ok }); pk(o, WAY.cdb, lin(t, 0.4, 3, 0, 1), 'INSERT 1056');
          o.cnt = [['CLOCK', clock(ms)], ['ROWS', ok ? '1 + 2' : '…', 'dim'], ['IN KAFKA', 'nothing yet', 'dim']];
          o.res = ok ? [['1056 written to the database', 'acc'], ['the event has not gone out yet', 'dim']] : []; } },
      { id: 'publish', dur: 6, title: 'publish PedidoCriado: the happy path', yk: 'WRITE 2: THE BROKER', act: ['Take the broker down', 'after the commit'],
        code: ['producer.Publish("pedido-1056", e-1801)', '  {"evento_id":"e-1801",', '   "tipo":"PedidoCriado",', '   "pedido_id":1056, … }   = 336 B', 'meus-pedidos and pagamentos receive it'],
        story: 'Right after the <code>COMMIT</code>, <code>pedidos</code> publishes <code>e-1801</code>, <code>PedidoCriado</code>, of <b>336 bytes</b>. <code>meus-pedidos</code> puts 1056 at the top of Lena\'s list and <code>pagamentos</code> starts charging 114.80. When both writes succeed, nobody notices they were two.',
        look: 'The light crosses the plate to Kafka and goes on to meus-pedidos and pagamentos. All three light up.',
        key: 'On the happy path the dual write works; the problem is what is left when one of the two fails.',
        f(o, t) { const f1 = lin(t, 0.4, 2.4, 0, 1), f2 = lin(t, 2.4, 3.8, 0, 1), inK = f1 >= 1, done = f2 >= 1;
          lit(o, 'cmd', 'db'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc', 'pag');
          o.rows.db = DB(true); o.rows.kfk = KF([['pedidos topic', 'dim'], [inK ? 'e-1801 · 336 B' : 'key: pedido_id', inK ? 'acc' : 'dim']], TAPE1(inK ? 'ok' : f1 > 0 ? 'recv' : 'none'));
          if (done) { o.rows.doc = DOC1(); o.rows.pag = act('pagamentos', 'CONSUMER', ['e-1801 received · charges 114.80', 'acc']); }
          bm(o, CAB.pub, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); bm(o, CAB.kpag, { on: inK && !done });
          pk(o, WAY.pub, f1, 'e-1801 · 336 B'); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['EVENT', 'e-1801'], ['SIZE', '336 B', 'dim'], ['IN meus-pedidos', done ? '1056' : '…', 'dim']];
          o.res = done ? [['both writes succeeded', 'acc']] : []; } },
      { id: 'broker-fora', dur: 7, title: 'Failure 1: database ok, broker down', yk: 'ORDER WITHOUT AN EVENT',
        code: ['COMMIT;              -- 20:12:00.004  ok', 'producer.Publish(…)  -- broker down', '  → network error', '1056 is in the database', 'e-1801 never goes out'],
        story: 'Now the broker is down at the moment of the <code>publish</code>. The <code>COMMIT</code> already went through: 1056 <b>exists</b> in the database. The event <b>never goes out</b>. <code>meus-pedidos</code> does not find out, and Lena does not see the order she just paid for. The <code>estoque</code> does not reserve either: the mug stays at 36 instead of 35, as module 17 already showed.',
        look: 'The database lights up with 1056; the Kafka cable turns red halfway, and meus-pedidos stays without 1056.',
        key: 'Order without an event: the database knows, the read model never will.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), bad = f >= 0.8; lit(o, 'cmd', 'db'); o.rows.db = DB(true);
          if (bad) { o.on.kfk = 'bad'; o.on.doc = 'bad'; }
          o.rows.kfk = KF([['pedidos topic', 'dim'], [bad ? 'broker down' : 'key: pedido_id', bad ? 'bad' : 'dim']], TAPE1('none', ''));
          o.rows.doc = DOC(['1055 · 34.90', 'hi'], bad ? ['1056: never arrived', 'bad'] : null);
          o.rows.pag = act('pagamentos', 'CONSUMER', ['nothing to charge', 'dim']);
          bm(o, CAB.pub, { on: true, tone: bad ? 'bad' : '' }); if (f < 0.8) pk(o, WAY.pub, f, 'e-1801', '');
          o.cnt = [['IN THE DATABASE', '1056'], ['IN KAFKA', bad ? 'nothing' : '…', bad ? 'bad' : 'dim'], ['IN meus-pedidos', bad ? 'without 1056' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['order without an event', 'bad'], ['the command returned success', 'dim']] : [];
          if (bad) T(o, [520, 398, 26], 'broker down', 'bad'); } },
      { id: 'conta', dur: 8, title: '0.1% failure: 108 orders per hour without an event', yk: 'THE MATH',
        code: ['publish failure: 0.1%', '30 orders/s × 3,600 s = 108,000 per hour', '108,000 × 0.001 = 108 per hour', 'they exist in the database, without an event', 'they never reach the read model'],
        story: 'A broker does not stay down for long; a hiccup is enough. If publishing fails <b>0.1%</b> of the time, at the 30 orders/s of Black Friday that is 30 × 3,600 × 0.001 = <b>108 orders per hour</b> that exist in the database and have no event. None of them reaches the read model, and nothing warns: the command returned success for all of them.',
        look: 'A red pile grows in the middle of the plate: each card is a written order that did not become an event. The counter goes up to 108 in one hour.',
        key: '0.1% sounds small; at 30 orders/s it is 108 invisible orders per hour.',
        f(o, t) { const m = lin(t, 0.4, 6.4, 0, 60), n = 108 * m / 60, done = m >= 60; lit(o, 'cmd', 'db', 'kfk'); o.rows.db = DB(true);
          bm(o, CAB.cdb, { on: true, flow: true }); bm(o, CAB.pub, { on: true, flow: true });
          o.piles = n >= 1 ? [{ p: [455, 230], f: n / 108, v: n }] : [];
          o.cnt = [['WITHOUT AN EVENT', thou(n), n >= 1 ? 'bad' : ''], ['TIME', `${Math.round(m)} min`, 'dim'], ['ORDERS WRITTEN', thou(1800 * m), 'dim']];
          o.res = done ? [['108 per hour, forever', 'bad']] : [['counting…', 'dim']];
          T(o, [455, 300, 20], 'orders without an event', 'bad'); } },
      { id: 'fantasma', dur: 8, title: 'If it goes wrong: event without an order', yk: 'THE OTHER ORDER',
        code: ['producer.Publish(…)   -- ok: e-1801 went out', 'COMMIT;               -- refused', '  → the database does not have 1056', 'meus-pedidos shows 1056', 'pagamentos charges 114.80'],
        story: 'Swapping the order does not solve it, it only swaps the failure. If the command publishes first and the <code>COMMIT</code> is refused afterwards (a conflict, a full disk, a database that went down), <code>e-1801</code> is already gone. <code>meus-pedidos</code> shows a 1056 that <b>does not exist</b>, and <code>pagamentos</code> may charge 114.80 for an order the database does not have. That is the ghost.',
        look: 'The event reaches Kafka and lights meus-pedidos and pagamentos up in red; the database turns red, with the COMMIT refused and no 1056.',
        key: 'In either order, one of the two writes can fail on its own.',
        f(o, t) { const f1 = lin(t, 0.4, 2.2, 0, 1), f2 = lin(t, 2.2, 3.4, 0, 1), inK = f1 >= 1, fail = t > 2.8, done = f2 >= 1; lit(o, 'cmd'); if (inK) lit(o, 'kfk');
          if (fail) { o.on.db = 'bad'; o.rows.db = DB(false); o.rows.db.rows.push(['COMMIT recusado', 'bad']); } else o.rows.db = DB(false);
          o.rows.kfk = KF([['pedidos topic', 'dim'], [inK ? 'e-1801 · 336 B' : 'key: pedido_id', inK ? 'acc' : 'dim']], TAPE1(inK ? 'ok' : f1 > 0 ? 'recv' : 'none'));
          if (done) { o.on.doc = 'bad'; o.on.pag = 'bad'; o.rows.doc = DOC1('bad', 'ghost'); o.rows.pag = act('pagamentos', 'CONSUMER', ['charged 114.80 for an order', 'bad'], ['the database does not have', 'bad']); }
          bm(o, CAB.pub, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); bm(o, CAB.kpag, { on: inK && !done }); bm(o, CAB.cdb, { tone: fail ? 'bad' : '' });
          pk(o, WAY.pub, f1, 'e-1801'); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['IN THE DATABASE', fail ? 'nothing' : '…', fail ? 'bad' : 'dim'], ['IN KAFKA', inK ? 'e-1801' : '…', 'dim'], ['CHARGED', done ? '114.80' : '…', done ? 'bad' : 'dim']];
          o.res = fail && done ? [['event without an order: ghost', 'bad'], ['and an undue charge', 'bad']] : fail ? [['COMMIT refused', 'bad']] : [];
          if (fail) T(o, TF(165), 'COMMIT refused', 'bad'); if (done) T(o, TF(742), 'a 1056 that does not exist', 'bad'); } },
    ],
    'falha-dual': [
      { id: 'lab', dur: 6, title: 'The lab\'s handler.go: writes, then publishes', yk: 'hospital-cqrs-sql · commands/handler.go',
        code: ['51  prescricao, … := h.repo.CriarPrescricao(…)', '52  if err != nil {', '53    return nil, fmt.Errorf(…)', '78  if err := h.producer.Publish(…); err != nil {', '79    log.Printf("AVISO: Erro ao publicar …")', '85  return prescricao, nil'],
        story: 'In the author\'s lab, <code>hospital-cqrs-sql</code> does the dual write by hand. Line 51 <b>writes</b> to the database; if it fails, lines 52 and 53 return the error and nothing is published. Line 78 <b>publishes</b> to Kafka after writing. Read "prescrição" as "order": it is the same drawing as 1056. This was read in the code; the lab requires Docker and Kafka and was not run.',
        look: 'pedidos writes to the database and only then sends the event to Kafka, along the long cable in front.',
        key: 'The lab publishes after the commit, outside the transaction.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 2, 4, 0, 1); lit(o, 'cmd'); if (f1 >= 1) lit(o, 'db'); if (f2 >= 1) lit(o, 'kfk');
          o.rows.cmd = act('pedidos', 'handler.go', ['51  writes to the database', f1 >= 1 ? 'acc' : 'hi'], ['78  publishes to Kafka', f2 >= 1 ? 'acc' : 'hi'], ['85  returns success', 'dim']); o.rows.cmd.fs = 14;
          o.rows.db = DB(f1 >= 1); if (f2 >= 1) o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          pk(o, WAY.cdb, f1, 'line 51'); pk(o, WAY.pub, f2, 'line 78');
          o.cnt = [['WRITES', 'line 51'], ['PUBLISHES', 'line 78', 'dim'], ['RETURNS', 'line 85', 'dim']];
          o.res = f2 >= 1 ? [['two writes, one after the other', 'acc']] : []; } },
      { id: 'aviso', dur: 8, title: 'Broker down: the code logs an AVISO and returns success', yk: 'THE SWALLOWED ERROR',
        code: ['78  Publish(…) → error', '79  log.Printf("AVISO: Erro ao publicar', '      evento, mas prescrição foi criada")', '81  // O evento poderá ser republicado', '    //   posteriormente   (nobody republishes)', '85  return prescricao, nil   → success'],
        story: 'If <code>Publish</code> fails, line 79 only writes <code>log.Printf("AVISO: Erro ao publicar evento, mas prescrição foi criada")</code> (a warning that the event failed but the prescription was created) and the code <b>carries on</b>. Line 85 returns <b>success</b>. The comment on line 81 says "the event can be republished later", but there is no code that does it. Lena gets "order confirmed", and <code>meus-pedidos</code> never receives 1056. It is Failure 1, written by hand.',
        look: 'The Kafka cable turns red; pedidos shows the AVISO line and the "success", and meus-pedidos stays without 1056.',
        key: 'Swallowing the error turns the failure into a silent loss.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), bad = f >= 0.8; lit(o, 'db'); o.rows.db = DB(true); o.on.cmd = bad ? 'bad' : 1;
          o.rows.cmd = act('pedidos', 'handler.go', ['51  wrote 1056', 'acc'], [bad ? '79  log AVISO and carry on' : '78  publishing…', bad ? 'bad' : 'hi'], [bad ? '85  returns success' : '', 'acc']); o.rows.cmd.fs = 14;
          if (bad) { o.on.kfk = 'bad'; o.rows.kfk = KF([['pedidos topic', 'dim'], ['Publish: error', 'bad']], TAPE1('none', '')); o.rows.doc = DOC(['1055 · 34.90', 'hi'], ['1056: never arrived', 'bad']); o.on.doc = 'bad'; }
          bm(o, CAB.pub, { on: true, tone: bad ? 'bad' : '' }); if (!bad) pk(o, WAY.pub, f, 'e-1801');
          o.cnt = [['LENA SEES', 'order confirmed'], ['IN meus-pedidos', bad ? 'without 1056' : '…', bad ? 'bad' : 'dim'], ['WHO REPUBLISHES', 'nobody', 'bad']];
          o.res = bad ? [['AVISO in the log, success in the response', 'bad'], ['and the event lost', 'bad']] : [];
          if (bad) T(o, TF(165), 'AVISO: … mas prescrição foi criada', 'bad'); } },
      { id: 'cai', dur: 7, title: 'The process dies between writing and publishing', yk: 'NO ERROR, NO LOG',
        code: ['51  writes · COMMIT at 20:12:00.004', '    the process dies here (deploy, memory)', '78  Publish(…)   never runs', '79  AVISO …      never runs', 'no log, no event'],
        story: 'The broker does not even have to fail. If the process dies between line 51 and 78 (a <i>deploy</i>, out of memory), the <code>COMMIT</code> already went through and the <code>Publish</code> never runs. This time not even the AVISO line is left in the log: 1056 is in the database, and nobody knows the event is missing.',
        look: 'pedidos turns red right after the COMMIT. The database has 1056; the Kafka cable never even lights up.',
        key: 'Between two writes there is always an instant when only the first has happened.',
        f(o, t) { const f = lin(t, 0.4, 1.8, 0, 1), ok = f >= 1, dead = t > 2.4; if (ok) lit(o, 'db'); o.on.cmd = dead ? 'bad' : 1; o.rows.db = DB(ok);
          o.rows.cmd = act('pedidos', 'handler.go', ['51  COMMIT at .004', ok ? 'acc' : 'hi'], [dead ? 'process died' : '…', dead ? 'bad' : 'dim'], [dead ? '78  never ran' : '', 'bad']); o.rows.cmd.fs = 14;
          if (dead) { o.rows.doc = DOC(['1055 · 34.90', 'hi'], ['1056: never arrived', 'bad']); o.on.doc = 'bad'; }
          pk(o, WAY.cdb, f, 'COMMIT');
          o.cnt = [['IN THE DATABASE', ok ? '1056' : '…'], ['IN KAFKA', dead ? 'nothing' : '…', dead ? 'bad' : 'dim'], ['IN THE LOG', dead ? 'nothing' : '…', dead ? 'bad' : 'dim']];
          o.res = dead ? [['order without an event, and without a trace', 'bad']] : [];
          if (dead) T(o, TF(165), 'process died', 'bad'); } },
      { id: 'artigo', dur: 7, title: 'The article\'s "Dual-Write pattern": publish inside the transaction', yk: 'BEGIN … PUBLISH … COMMIT',
        code: ['BEGIN;', 'INSERT INTO pedidos … 1056 …;', 'producer.Publish(e-1801)   -- network', 'COMMIT;', 'if anything fails: ROLLBACK'],
        story: 'The source article presents the "Dual-Write pattern" as a <code>BEGIN</code>, the publish and a <code>COMMIT</code>, with a <i>rollback</i> if anything fails, and says that this way "one does not happen without the other". It looks safer: the event goes out with the transaction still open. But the database transaction <b>does not cover</b> the broker. And, while the <code>publish</code> waits for the network, the transaction stays open <b>holding locks</b>: a slow broker blocks whoever needs the same rows.',
        look: 'The database stays lit with the transaction open while the light goes to Kafka. The locks stay held until the COMMIT.',
        key: 'Putting the publish inside the transaction does not make it part of it.',
        f(o, t) { const f = lin(t, 1, 4, 0, 1), inK = f >= 1, done = t > 4.8; lit(o, 'cmd', 'db'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'hi'); o.rows.db.rows.push([done ? 'COMMIT' : 'transaction open · locks held', done ? 'acc' : 'bad']);
          o.rows.cmd = act('pedidos', 'ARTICLE', ['BEGIN · INSERT', 'acc'], [inK ? 'publish ok' : 'publish… (network)', inK ? 'acc' : 'hi'], [done ? 'COMMIT' : 'COMMIT waits', done ? 'acc' : 'dim']); o.rows.cmd.fs = 14;
          if (inK) o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          bm(o, CAB.pub, { on: !inK }); pk(o, WAY.pub, f, 'e-1801 (open transaction)');
          o.cnt = [['TRANSACTION', done ? 'closed' : 'open', done ? '' : 'bad'], ['LOCKS', done ? 'released' : 'held', done ? 'dim' : 'bad'], ['KAFKA', 'outside the transaction', 'dim']];
          o.res = [['the broker is not in the transaction', 'acc']]; } },
      { id: 'commit-falha', dur: 8, title: 'If it goes wrong: the event went out and the COMMIT failed', yk: 'THE ROLLBACK DOES NOT TAKE BACK THE EVENT',
        code: ['BEGIN; INSERT … 1056 …;', 'Publish(e-1801)   -- ok, already in Kafka', 'COMMIT;           -- refused', 'ROLLBACK: the database forgets 1056', 'Kafka does not forget e-1801'],
        story: 'In the article\'s drawing, the event goes out before the <code>COMMIT</code>. If the <code>COMMIT</code> is refused, the <i>rollback</i> undoes 1056 in the database, but <code>e-1801</code> <b>is already gone</b>: <code>meus-pedidos</code> shows an order that does not exist and <code>pagamentos</code> may charge 114.80. A truly atomic write across PostgreSQL and Kafka would require <i>two-phase commit</i>, which blocks if the coordinator goes down (Fowler) and which Kafka does not offer. The way out is to have <b>one</b> write and derive the other from what the database wrote: CDC or outbox.',
        look: 'The database turns red and loses 1056; Kafka, meus-pedidos and pagamentos keep it, in red on the read side.',
        key: 'The database transaction does not cover the broker: the rollback does not take back the event.',
        f(o, t) { const fail = t > 1.4, f2 = lin(t, 1.8, 3.2, 0, 1), done = f2 >= 1; lit(o, 'cmd', 'kfk');
          o.on.db = fail ? 'bad' : 1; o.rows.db = fail ? DB(false) : DB(true, 'hi'); o.rows.db.rows.push([fail ? 'COMMIT refused · ROLLBACK' : 'transaction open', 'bad']);
          o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          if (done) { o.on.doc = 'bad'; o.on.pag = 'bad'; o.rows.doc = DOC1('bad', 'ghost'); o.rows.pag = act('pagamentos', 'CONSUMER', ['charged 114.80 for an order', 'bad'], ['the database undid', 'bad']); }
          bm(o, CAB.kdoc, { on: !done }); bm(o, CAB.kpag, { on: !done }); bm(o, CAB.cdb, { tone: fail ? 'bad' : '' }); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['IN THE DATABASE', fail ? 'undone' : 'open', fail ? 'bad' : 'dim'], ['IN KAFKA', 'e-1801', 'dim'], ['ATOMIC', 'only with 2PC', 'bad']];
          o.res = fail ? [['the rollback does not take back the event', 'bad'], ['a single write: CDC or outbox', 'acc']] : [];
          if (fail) T(o, TF(165), 'ROLLBACK', 'bad'); if (done) T(o, TF(742), 'the event is already gone', 'bad'); } },
    ],
    cdc: [
      { id: 'log', dur: 6, title: 'The database log already has everything that was confirmed', yk: 'THE CONNECTOR', act: ['Place 1056', 'only the INSERT'],
        code: ['wal_level = logical', 'slot: hospital_cdc_slot   (in the lab)', 'plugin: pgoutput', 'snapshot.mode: initial', 'Debezium → Kafka Connect → topics'],
        story: 'The database already keeps a list of everything it <b>confirmed</b>, in order: the WAL. With <code>wal_level=logical</code>, a replication slot and <code>pgoutput</code>, Debezium reads that log and publishes each change to Kafka (the CDC from module 17, lesson 5). <code>pedidos</code> goes back to doing one thing: writing. In the <code>hospital-cqrs-cdc</code> lab, the <i>command service</i> does not even have a Kafka producer.',
        look: 'Between the database and Kafka there is a tape: the WAL, with Debezium reading it. pedidos only has the database cable.',
        key: 'CDC takes the second write out of the application: the one who publishes is the log reader.',
        f(o) { lit(o, 'wal');
          o.cnt = [['COMMAND WRITES', '1'], ['WHO PUBLISHES', 'Debezium', 'dim'], ['WHAT IT READS', 'the WAL', 'dim']];
          o.res = [['the command does not talk to Kafka', 'acc']];
          T(o, [455, 140, 30], 'the database log', 'dim'); } },
      { id: 'commit', dur: 6, title: '1056 becomes rows in the WAL', yk: 'THE TRANSACTION IN THE LOG',
        code: ['BEGIN', 'pedidos       INSERT 1056', 'itens_pedido  INSERT 1056 · 42', 'itens_pedido  INSERT 1056 · 7', 'COMMIT        -- 20:12:00.004'],
        story: '<code>CriarPedido</code> writes 1 row in <code>pedidos</code> and 2 in <code>itens_pedido</code> and does a <code>COMMIT</code> at <b>20:12:00.004</b>. The WAL records the whole transaction, from <code>BEGIN</code> to <code>COMMIT</code>. Logical decoding only delivers confirmed transactions: a rolled-back transaction does not become an event.',
        look: 'The WAL tape gains five cells: BEGIN, the three 1056 rows and the COMMIT.',
        key: 'The log only has what was confirmed.',
        f(o, t) { const n = Math.floor(lin(t, 0.6, 4, 0, 5.99)), ms = lin(t, 0.4, 3, 0, 4), ok = n >= 5; lit(o, 'cmd', 'wal'); if (n >= 2) lit(o, 'db');
          o.rows.db = DB(n >= 2); const C = ['BEGIN', 'ped c', 'item c', 'item c', 'COMMIT'];
          o.rows.wal.tape = C.map((l, i) => [l, i < n ? 'ok' : 'none']); o.rows.wal.rows = [['1056 transaction', 'hi']];
          bm(o, CAB.cdb, { on: !ok }); bm(o, CAB.dbwal, { on: n >= 1 && !ok, flow: n >= 1 && !ok }); pk(o, WAY.cdb, lin(t, 0.4, 2.4, 0, 1), 'INSERT 1056');
          o.cnt = [['CLOCK', clock(ms)], ['IN THE WAL', `${n} of 5`, 'dim'], ['ROWS', '1 + 2', 'dim']];
          o.res = ok ? [['the whole transaction is in the log', 'acc']] : []; } },
      { id: 'topicos', dur: 7, title: 'Two tables, two topics', yk: 'WHAT DEBEZIUM PUBLISHES',
        code: ['loja.public.pedidos', '  {"id":1056,"status":"criado",…,"op":"c"}', 'loja.public.itens_pedido', '  {…"produto_id":42,…,"op":"c"}', '  {…"produto_id":7,…,"op":"c"}'],
        story: 'Debezium publishes each table to its own topic: the 1056 row goes to <code>loja.public.pedidos</code> and the two item rows to <code>loja.public.itens_pedido</code>. The <code>ExtractNewRecordState</code> <i>transform</i> keeps only the <b>new value</b> of the row, and the <code>op</code> field says what happened: <code>c</code>, created. These are three technical messages, one per row; the 336 B <code>PedidoCriado</code>, with the items inside, does not exist here.',
        look: 'Three lights leave the tape for Kafka: one goes to the orders topic, two to the items topic. Then meus-pedidos builds 1056.',
        key: 'The CDC event is technical: a row changed, one topic per table.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), inK = f >= 1, f2 = lin(t, 3, 4.4, 0, 1), done = f2 >= 1; lit(o, 'db', 'wal'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true); o.rows.wal.tape = ['BEGIN', 'ped c', 'item c', 'item c', 'COMMIT'].map(l => [l, 'ok']); o.rows.wal.rows = [['Debezium publishes', 'hi']];
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], [inK ? '  1056 · op c' : '', 'acc'], ['loja.public.itens_pedido', 'hi'], [inK ? '  1056·42 and 1056·7 · op c' : '', 'acc']], null, 'TWO TOPICS');
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.walk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done });
          pk(o, WAY.wal.slice(2), f, 'pedidos · c'); pk(o, WAY.wal.slice(2), clamp(f - 0.18), ''); pk(o, WAY.wal.slice(2), clamp(f - 0.36), 'items · c'); pk(o, WAY.kdoc, f2);
          o.cnt = [['MESSAGES', inK ? '3' : '…'], ['TOPICS', '2', 'dim'], ['op', 'c', 'dim']];
          o.res = done ? [['3 rows, not 1 PedidoCriado', 'acc']] : []; } },
      { id: 'kafka-fora', dur: 8, title: 'The broker goes down and the checkout keeps working', yk: 'THE LAB\'S README',
        code: ['Kafka down', 'pedidos: INSERT · COMMIT   ok', 'the slot keeps the WAL since the last read', 'Kafka comes back: Debezium continues', '  from where it stopped'],
        story: 'If Kafka goes down, the command does not even notice: it does not talk to Kafka. The replication slot keeps the WAL from the last point read, and when the broker returns Debezium continues from there. The lab\'s README says (in Portuguese): "Se Kafka cair, aplicação continua funcionando. Debezium replica quando volta." ("If Kafka goes down, the application keeps working. Debezium replicates when it comes back.") There is no more order without an event or event without an order.',
        look: 'Kafka turns red; pedidos and the database stay lit, and the WAL tape accumulates cells, waiting. When Kafka comes back, the tape empties.',
        key: 'Only what was confirmed becomes an event, and nothing is lost if the broker goes down.',
        f(o, t) { const down = t < 4.6, n = Math.min(5, Math.floor(lin(t, 0.6, 4.2, 0, 5.99))); lit(o, 'cmd', 'db', 'wal'); o.on.kfk = down ? 'bad' : 1; o.rows.db = DB(true);
          o.rows.wal.tape = Array.from({ length: 5 }, (_, i) => [i < n ? (down ? 'waiting' : 'read') : '', i < n ? (down ? 'recv' : 'ok') : 'none']);
          o.rows.wal.rows = [[down ? 'the slot keeps the WAL' : 'Debezium continues', down ? 'hi' : 'acc']];
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], [down ? 'down' : 'receiving again', down ? 'bad' : 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'TWO TOPICS');
          bm(o, CAB.cdb, { on: true, flow: true }); bm(o, CAB.walk, { on: !down, flow: !down, tone: down ? 'bad' : '' });
          o.cnt = [['THE CHECKOUT', 'keeps working'], ['THE SLOT', down ? `keeps ${n}` : 'emptying', 'dim'], ['LOST', '0', 'dim']];
          o.res = down ? [['the command does not even notice', 'acc']] : [['nothing was lost', 'acc']];
          if (down) T(o, [742, 226, 40], 'Kafka down', 'bad'); } },
      { id: 'update', dur: 6, title: 'The payment becomes an UPDATE: op = u', yk: '20:12:01.100',
        code: ["UPDATE pedidos SET status = 'pago'", ' WHERE id = 1056;   -- 20:12:01.100', 'loja.public.pedidos', '  {"id":1056,"status":"pago","op":"u"}', 'op: c criou · u atualizou · d apagou · r snapshot'],
        story: 'At <b>20:12:01.100</b> the payment goes through, and <code>pedidos</code> changes the status of 1056 with an <code>UPDATE</code>. In the log that is one more row; in the <code>loja.public.pedidos</code> topic, one more message, now with <code>op = u</code>. The four values of <code>op</code>: <code>c</code> created, <code>u</code> updated, <code>d</code> deleted and <code>r</code>, read from the initial <i>snapshot</i>.',
        look: 'A new cell, "ped u", enters the tape and runs to the orders topic.',
        key: 'The op says what happened to the row: c, u, d or r.',
        f(o, t) { const f = lin(t, 1, 3.2, 0, 1), inK = f >= 1; lit(o, 'cmd', 'db', 'wal'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'acc', 'pago'); o.rows.wal.tape = [['…', 'none'], ['COMMIT', 'ok'], ['BEGIN', 'ok'], ['ped u', t > 0.6 ? 'ok' : 'none'], ['COMMIT', t > 0.8 ? 'ok' : 'none']];
          o.rows.wal.rows = [['UPDATE of 1056', 'hi']]; o.rows.doc = DOC1();
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'dim'], [inK ? '  1056 · pago · op u' : '', 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'TWO TOPICS');
          bm(o, CAB.walk, { on: !inK }); pk(o, WAY.wal.slice(2), f, 'pedidos · u');
          o.cnt = [['op', 'u'], ['STATUS', 'pago', 'dim'], ['CLOCK', '20:12:01.100', 'dim']];
          o.res = inK ? [['the topic has the u of 1056', 'acc']] : []; } },
      { id: 'ignora-u', dur: 7, title: 'If it goes wrong: the handler ignores the u', yk: 'cdc_handler.go · lines 66 to 72',
        code: ['if event.Op != "c" && event.Op != "r" {', '  log.Printf("Ignorando operação %s …")', '  return nil', '}', 'the u of 1056 is discarded'],
        story: 'Read in the lab\'s code: <code>cdc_handler.go</code> only continues for <code>c</code> and <code>r</code>; for any other <code>op</code>, it logs "Ignorando operação" (ignoring operation) and returns. The <code>u</code> of 1056 arrives and is <b>discarded</b>, and Lena\'s screen shows <code>criado</code> forever, even after it is paid and shipped.',
        look: 'The message with op = u reaches meus-pedidos and the block turns red: the status stays "criado".',
        key: 'A CDC handler that ignores u and d leaves the screen stale forever.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), bad = f >= 1; lit(o, 'db', 'kfk'); o.rows.db = DB(true, 'acc', 'pago');
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'dim'], ['  1056 · pago · op u', 'acc']], null, 'TWO TOPICS');
          o.rows.wal.tape = [['ped u', 'ok']]; o.rows.wal.rows = [['UPDATE of 1056', 'dim']];
          o.on.doc = bad ? 'bad' : 0; o.rows.doc = bad ? DOC(['1056 · criado · 114.80', 'bad'], ['op u ignored', 'bad'], ['the database says: pago', 'dim']) : DOC1();
          bm(o, CAB.kdoc, { on: !bad, tone: bad ? 'bad' : '' }); pk(o, WAY.kdoc, f, 'op u');
          o.cnt = [['THE DATABASE SAYS', 'pago'], ['THE SCREEN SAYS', bad ? 'criado' : '…', bad ? 'bad' : 'dim'], ['PROCESSES', 'only c and r', 'bad']];
          o.res = bad ? [['"Ignorando operação u"', 'bad'], ['the screen stays stale forever', 'bad']] : [];
          if (bad) T(o, TF(742), 'criado forever', 'bad'); } },
      { id: 'le-escrita', dur: 8, title: 'If it goes wrong: the handler goes back to the write database', yk: 'cdc_handler.go · lines 109 to 123',
        code: ['getMedico(…)                 → write database', 'getPaciente(…)               → write database', 'getMedicamentosPrescricao(…) → write database', '3 queries per event', 'reads depend on writes again'],
        story: 'To complete the row it received, the handler calls <code>getMedico</code>, <code>getPaciente</code> and <code>getMedicamentosPrescricao</code>: <b>three queries to the write database</b> per event. The read side goes back to depending on the write side, exactly what CQRS wanted to separate; if the command database gets slow, the read model falls behind with it. And the connector uses <code>decimal.handling.mode: double</code>, money as floating point: that is why the store keeps whole cents.',
        look: 'A red cable goes back from meus-pedidos to the loja database, bypassing Kafka: three queries per event.',
        key: 'If the read model queries the write database, the two sides couple again.',
        f(o, t) { const n = Math.min(3, Math.floor(lin(t, 0.6, 5.4, 0, 3.99))); lit(o, 'kfk'); o.on.doc = 'bad'; o.on.db = n ? 'bad' : 0; o.rows.db = DB(true);
          o.rows.db.rows.push([n ? `${n} handler quer${n > 1 ? 'ies' : 'y'}` : '', 'bad']);
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'DOIS TÓPICOS');
          o.rows.doc = DOC(['completes the row', 'hi'], [n ? `get… ${n} of 3` : 'received 1056 · op c', 'bad']);
          bm(o, CAB.back, { on: true, tone: 'bad' }); if (n < 3) pk(o, WAY.back, (lt * 0.7) % 1, ['getMedico', 'getPaciente', 'getMedicamentos…'][n], 'bad');
          o.cnt = [['QUERIES PER EVENT', `${n}`, 'bad'], ['TO WHOM', 'write database', 'bad'], ['MONEY', 'double', 'dim']];
          o.res = n >= 3 ? [['reads depend on writes', 'bad']] : [['querying…', 'dim']];
          T(o, [455, 300, 30], 'back to the write database', 'bad'); } },
    ],
    outbox: [
      { id: 'tabela', dur: 6, title: 'The outbox table, in the same database', yk: 'Outbox_Events (lab)',
        code: ['id · aggregate_type · aggregate_id', 'event_type · payload (JSON)', 'created_at · processed_at', 'published_at · error_message', 'retry_count'],
        story: 'The outbox changes where the event is born: it becomes a <b>row</b> in a table of the <b>same database</b> as the order. The lab\'s <code>Outbox_Events</code> has <code>aggregate_type</code>, <code>aggregate_id</code>, <code>event_type</code>, <code>payload</code> (the whole business event, in JSON), <code>created_at</code>, <code>processed_at</code>, <code>published_at</code>, <code>error_message</code> and <code>retry_count</code>. A second process, the <b>relay</b>, takes the table to Kafka.',
        look: 'In the loja database, the outbox table shows up under pedidos and itens_pedido. In the middle, the relay links the database to Kafka.',
        key: 'In the outbox, the event is data in the same database.',
        f(o) { lit(o, 'db', 'relay');
          o.cnt = [['COMMAND WRITES', '1 transaction'], ['TABLES', 'pedidos + outbox', 'dim'], ['WHO PUBLISHES', 'the relay', 'dim']];
          o.res = [['the event lives in the database', 'acc']];
          T(o, [165, 224, 44], 'outbox', 'acc'); } },
      { id: 'transacao', dur: 7, title: 'INSERT pedidos + INSERT outbox + COMMIT', yk: 'test_decoding (PostgreSQL 14)', act: ['Try a test order', 'and ROLLBACK'],
        code: ['BEGIN 832', 'table public.pedidos: INSERT:', "  id[bigint]:1056 cliente_id[text]:'lena-77' …", 'table public.outbox: INSERT: id[bigint]:1', "  event_type[text]:'PedidoCriado' … e-1801", 'COMMIT 832'],
        story: '<code>BEGIN; INSERT INTO pedidos …1056…; INSERT INTO outbox …PedidoCriado e-1801…; COMMIT;</code>. Read with PostgreSQL\'s <code>test_decoding</code>, it came out as <b>a single transaction</b>, <code>BEGIN 832 … COMMIT 832</code>, with both rows inside. If the order goes in, the event goes in with it, and the command does not talk to Kafka.',
        look: 'The 1056 rows and row 1 of the outbox light up together in the database, on the same COMMIT.',
        key: 'One transaction, two pieces of data: the order and the event go in together.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.db = ok ? DB(true, 'acc', 'criado', OUT1('new'), OUTST('new')) : DB(false, 'acc', 'criado', ['empty', 'dim']);
          bm(o, CAB.cdb, { on: !ok }); pk(o, WAY.cdb, f, 'BEGIN … COMMIT');
          o.cnt = [['TRANSACTION', ok ? '832' : 'open'], ['ROWS', ok ? 'pedidos + outbox' : '…', 'dim'], ['IN KAFKA', 'nothing yet', 'dim']];
          o.res = ok ? [['BEGIN 832 … COMMIT 832', 'acc'], ['both rows together', 'acc']] : []; } },
      { id: 'rollback', dur: 6, title: 'The ROLLBACK takes both away', yk: 'THE TEST ORDER',
        code: ['BEGIN;', 'INSERT INTO pedidos … (test);', 'INSERT INTO outbox … (test);', 'ROLLBACK;', 'in the tables: nothing · in the log: nothing'],
        story: 'A second attempt, for a test order, ended in <code>ROLLBACK</code>. <b>Nothing</b> was left: not in the tables, not in the decoded stream of <code>test_decoding</code>. There is no more order without an event or event without an order, because there are no longer two writes.',
        look: 'The two test rows show up in red and vanish together; the relay has nothing new to carry.',
        key: 'If the transaction rolls back, both vanish together.',
        f(o, t) { const gone = t > 2.6; lit(o, 'cmd', 'db'); o.on.cmd = gone ? 1 : 'bad';
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new'), ...(gone ? [OUTST('new')] : [['2 · test · ROLLBACK', 'bad']]));
          if (!gone) o.rows.db.rows.splice(2, 0, ['test · ROLLBACK', 'bad']);
          o.rows.cmd = act('pedidos', 'TEST', ['BEGIN · 2 INSERT', 'hi'], ['ROLLBACK', 'bad'], [gone ? 'nothing left' : 'undoing…', gone ? 'acc' : 'dim']);
          o.cnt = [['IN THE TABLES', gone ? 'nothing' : '…'], ['IN THE DECODED LOG', gone ? 'nothing' : '…', 'dim'], ['GHOSTS', '0', 'dim']];
          o.res = gone ? [['both vanish together', 'acc']] : [['ROLLBACK', 'bad']];
          if (!gone) T(o, TF(165), 'ROLLBACK', 'bad'); } },
      { id: 'relay', dur: 8, title: 'The relay checks the table every 2 s', yk: 'outbox_relay.go (lab)',
        code: ['every 2 s:', '  SELECT … WHERE processed_at IS NULL', '  LIMIT 100                (the batch)', '  PublishRaw("pedido-1056", payload)', '  UPDATE … processed_at, published_at', 'up to 5 attempts per event'],
        story: 'The lab\'s <code>outbox_relay.go</code> checks the table every <b>2 s</b>, in batches of <b>100</b>, with up to <b>5</b> attempts per event. It picks up <code>e-1801</code>, publishes to Kafka with the key <code>pedido-1056</code> and then marks the row with <code>processed_at</code> and <code>published_at</code>. The price of the <i>poll</i>: <b>1 s on average and 2 s in the worst case</b> added to the read model\'s delay.',
        look: 'The relay\'s clock counts up to 2 s; then the light leaves the outbox, passes through the relay and reaches Kafka and meus-pedidos. The outbox row gets marked.',
        key: 'The relay turns the table into events, with up to 2 s of waiting.',
        f(o, t) { const s = lin(t, 0.4, 3, 0, 2), f1 = lin(t, 3, 4.4, 0, 1), f2 = lin(t, 4.4, 5.4, 0, 1), inK = f1 >= 1, done = f2 >= 1, marked = t > 4.8;
          lit(o, 'db', 'relay'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1(marked ? 'pub' : 'new'), OUTST(marked ? 'pub' : 'new'));
          o.rows.relay = act('relay', 'POLL 2 s', [s < 2 ? `next poll in ${dec(2 - s)} s` : marked ? 'marked: published_at' : 'publishing e-1801', s < 2 ? 'hi' : 'acc'], ['batch 100 · up to 5 attempts', 'dim']);
          if (inK) o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · key pedido-1056', 'acc']], TAPE1('ok'));
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.dbrel, { on: f1 > 0 && !inK }); bm(o, CAB.relk, { on: f1 > 0 && !inK }); bm(o, CAB.kdoc, { on: inK && !done });
          pk(o, WAY.rel, f1, 'e-1801'); pk(o, WAY.kdoc, f2);
          o.cnt = [['POLL WAIT', `${dec(s)} s`], ['AVERAGE', '1 s', 'dim'], ['WORST CASE', '2 s', 'dim']];
          o.res = done ? [['1056 reached the screen', 'acc'], ['after the poll', 'dim']] : []; } },
      { id: 'cdc-outbox', dur: 7, title: 'CDC reading the outbox itself: milliseconds', yk: 'Debezium Outbox Event Router',
        code: ['columns: id · aggregatetype · aggregateid', '         type · payload', 'routes by aggregatetype → topic', 'reads the WAL: no poll', 'business event, ms latency'],
        story: 'The second way removes the <i>poll</i>: CDC reads the <code>outbox</code> table itself in the WAL. Debezium\'s <i>Outbox Event Router</i> expects the columns <code>id</code>, <code>aggregatetype</code>, <code>aggregateid</code>, <code>type</code> and <code>payload</code> and routes by <code>aggregatetype</code>. Latency drops from up to 2 s to <b>milliseconds</b>, and the event that comes out is the whole business <code>PedidoCriado</code>, not a <code>pedidos</code> row.',
        look: 'The relay leaves the scene; the WAL tape rises in the middle and carries the outbox row straight to Kafka.',
        key: 'CDC on the outbox: a business event, with no poll.',
        f(o, t) { hide(o, 'relay'); showX(o, 'wal'); o.beams = o.beams.filter(b => b.pts !== CAB.dbrel && b.pts !== CAB.relk); o.beams.push({ pts: CAB.dbwal }, { pts: CAB.walk });
          const f = lin(t, 1, 2.6, 0, 1), inK = f >= 1, f2 = lin(t, 2.6, 3.6, 0, 1), done = f2 >= 1; lit(o, 'db', 'wal'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new'), ['  aggregatetype = pedido', 'hi']);
          o.rows.wal = act('WAL', 'OUTBOX EVENT ROUTER', ['Debezium reads only the outbox', 'hi']); o.rows.wal.tapeLabel = 'LOG';
          o.rows.wal.tape = [['BEGIN', 'ok'], ['ped c', 'ok'], ['outbox c', 'ok'], ['COMMIT', 'ok']];
          if (inK) o.rows.kfk = KF([['pedido topic', 'dim'], ['PedidoCriado e-1801', 'acc']], TAPE1('ok'));
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.walk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); pk(o, WAY.wal, f, 'PedidoCriado'); pk(o, WAY.kdoc, f2);
          o.cnt = [['LATENCY', 'ms'], ['POLL', 'none', 'dim'], ['EVENT', 'business', 'dim']];
          o.res = done ? [['no poll, and the business event', 'acc']] : []; } },
      { id: 'custo', dur: 8, title: 'If it goes wrong: the outbox writes 7.6× more WAL', yk: 'WAL PER ORDER (20,000 ORDERS)',
        code: ['without outbox            359.6 B', '+ 2 INSERTs into the outbox 1,232.7 B   3.4×', '+ relay marks (UPDATE)    2,735.8 B   7.6×', '+ relay deletes (DELETE)  1,916.8 B   5.3×', 'at 30/s: 10.8 KB/s → 82.1 KB/s'],
        story: 'The article warns that the outbox can become a bottleneck, and now there is a number. Over 20,000 orders on PostgreSQL 14, the WAL per order went from <b>359.6 B</b> without an outbox to <b>1,232.7 B</b> with the 2 <code>INSERT</code>s into the outbox, and to <b>2,735.8 B</b> when the relay marks each event with an <code>UPDATE</code>: <b>7.6×</b>. At 30 orders/s that is <b>82.1 KB/s</b> (295.5 MB/h) instead of 10.8 KB/s. Deleting with <code>DELETE</code> costs less (1,916.8 B, 5.3×) and keeps the table from growing without end.',
        look: 'The WAL tape gains a cell for each part of the math: the order, the outbox\'s 2 INSERTs and the relay\'s UPDATE, which turns red. The dial goes from 359.6 up to 2,735.8 bytes.',
        key: 'The outbox is not free: 5.3× to 7.6× the WAL per order.',
        f(o, t) { showX(o, 'wal'); const k = Math.floor(lin(t, 0.4, 5.4, 0, 2.99)), V = [359.6, 1232.7, 2735.8];
          lit(o, 'db', 'relay', 'wal'); if (k === 2) o.on.relay = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', OUT1(k === 2 ? 'pub' : 'new'), ['2 · PedidoPago · e-1802', k >= 1 ? 'acc' : 'dim'], [k === 2 ? '  marked: published_at' : '  processed_at IS NULL', k === 2 ? 'bad' : 'hi']);
          o.rows.wal = act('WAL', 'PER ORDER', [`${dec(V[k])} B`, k === 2 ? 'bad' : 'acc']); o.rows.wal.tapeLabel = 'WAL';
          o.rows.wal.tape = [['order', 'ok'], ['+outbox', k >= 1 ? 'ok' : 'none'], ['+UPDATE', k >= 2 ? 'bad' : 'none']];
          o.rows.relay = act('relay', 'MARKS', ['UPDATE … published_at', k === 2 ? 'bad' : 'dim'], ['DELETE would cost 1,916.8 B', 'dim']);
          o.cnt = [['WAL PER ORDER', `${dec(V[k])} B`, k === 2 ? 'bad' : ''], ['FACTOR', ['1×', '3.4×', '7.6×'][k], k === 2 ? 'bad' : 'dim'], ['AT 30 ORDERS/S', ['10.8 KB/s', '37.0 KB/s', '82.1 KB/s'][k], 'dim']];
          o.res = k === 2 ? [['7.6× the WAL · 295.5 MB/h', 'bad'], ['with DELETE: 5.3× · 207 MB/h', 'acc']] : [['adding up…', 'dim']]; } },
    ],
    'relay-duplicado': [
      { id: 'publica', dur: 6, title: 'The relay publishes e-1801', yk: 'processarEvento · line 138', act: ['Take the relay down', 'between publish and mark'],
        code: ['SELECT … WHERE processed_at IS NULL', '  → id 3 · PedidoCriado · e-1801', '138  PublishRaw("pedido-1056", payload)', '154  marcarProcessado(3)', 'between 138 and 154: a window'],
        story: 'The relay picks up event 3 from the outbox, the <code>PedidoCriado</code> <code>e-1801</code> of 1056, and publishes it to Kafka (line 138 of <code>outbox_relay.go</code>) with the key <code>pedido-1056</code>. Only <b>afterwards</b>, on line 154, does it call <code>marcarProcessado</code>, an <code>UPDATE</code> that writes <code>processed_at</code> and <code>published_at</code>. Between the two lines there is a window.',
        look: 'The light leaves row 3 of the outbox, passes through the relay and reaches Kafka. The row is not marked yet.',
        key: 'The relay publishes first and marks afterwards.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), inK = f >= 1; lit(o, 'db', 'relay'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new', 3), OUTST('new'));
          o.rows.relay = act('relay', 'processarEvento', [inK ? '138 published' : '138 publishing…', 'acc'], ['154 marcarProcessado: not yet', 'dim']);
          if (inK) o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · key pedido-1056', 'acc']], TAPE1('ok'));
          bm(o, CAB.dbrel, { on: !inK }); bm(o, CAB.relk, { on: !inK }); pk(o, WAY.rel, f, 'e-1801');
          o.cnt = [['PUBLISHED', inK ? 'e-1801' : '…'], ['MARKED', 'not yet', 'dim'], ['KEY', 'pedido-1056', 'dim']];
          o.res = inK ? [['Kafka has e-1801', 'acc'], ['the outbox does not know yet', 'dim']] : []; } },
      { id: 'cai', dur: 6, title: 'The relay dies before marking', yk: 'BETWEEN 138 AND 154',
        code: ['138  PublishRaw(…)        ok: e-1801 in Kafka', '     the relay dies here', '154  marcarProcessado(3)   never runs', 'outbox: id 3 · processed_at IS NULL', 'to the database, the event did not go out'],
        story: 'The relay publishes <code>e-1801</code> and <b>dies</b> before line 154. Kafka already has the event, and <code>meus-pedidos</code> already put 1056 in the list. But, to the database, row 3 of the outbox still has an empty <code>processed_at</code>: the event "did not go out".',
        look: 'The relay turns red. Kafka has one e-1801; row 3 of the outbox stays lit as pending.',
        key: 'Publishing and marking are two writes: the relay has its own window.',
        f(o, t) { const f = lin(t, 0.4, 1.6, 0, 1), dead = t > 1.8; lit(o, 'db', 'kfk'); if (f >= 1) lit(o, 'doc'); o.on.relay = dead ? 'bad' : 1;
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new', 3), OUTST('new'));
          o.rows.relay = act('relay', 'processarEvento', ['138 published', 'acc'], [dead ? 'died before 154' : '154 …', dead ? 'bad' : 'dim']);
          o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · 1 time', 'acc']], TAPE1('ok'));
          if (f >= 1) o.rows.doc = DOC1();
          pk(o, WAY.kdoc, f);
          o.cnt = [['IN KAFKA', 'e-1801'], ['IN THE OUTBOX', 'pending', 'bad'], ['THE RELAY', dead ? 'died' : '…', dead ? 'bad' : 'dim']];
          o.res = dead ? [['published, but not marked', 'bad']] : [];
          if (dead) T(o, [455, 250, 34], 'relay died', 'bad'); } },
      { id: 'duplica', dur: 7, title: 'When it returns, it publishes again: e-1801 goes out twice', yk: 'AT LEAST ONCE',
        code: ['the relay comes back', 'SELECT … WHERE processed_at IS NULL', '  → id 3 again', 'PublishRaw(e-1801)   -- 2nd time', 'handler: INSERT without ON CONFLICT'],
        story: 'When the relay comes back, event 3 is still pending, and it <b>publishes it again</b>. The outbox delivery is <b>at least once</b>: the event is never lost, but it can go out duplicated. The lab\'s consumer is not prepared: the handler does an <code>INSERT</code> without <code>ON CONFLICT</code> (lesson 5), and 1056 shows up <b>twice</b> in Lena\'s list.',
        look: 'Two e-1801 on the Kafka tape; meus-pedidos turns red, with 1056 twice.',
        key: 'The outbox delivers at least once: a duplicate is expected.',
        f(o, t) { const f1 = lin(t, 0.6, 2.4, 0, 1), inK = f1 >= 1, f2 = lin(t, 2.6, 3.6, 0, 1), done = f2 >= 1, marked = t > 3; lit(o, 'db', 'relay', 'kfk');
          o.rows.db = DB(true, 'dim', 'criado', OUT1(marked ? 'pub' : 'new', 3), OUTST(marked ? 'pub' : 'new'));
          o.rows.relay = act('relay', 'BACK', ['id 3 still pending', 'hi'], [inK ? 'published again' : 'publishing…', inK ? 'bad' : 'hi']);
          o.rows.kfk = KF([['pedidos topic', 'dim'], [inK ? 'e-1801 · 2 times' : 'e-1801 · 1 time', inK ? 'bad' : 'acc']], [['e-1801', 'ok'], ['e-1801', inK ? 'bad' : f1 > 0 ? 'recv' : 'none'], ['', 'none']]);
          o.rows.doc = done ? DOC(['1056 · criado · 114.80', 'bad'], ['1056 · criado · 114.80', 'bad'], ['1055 · 34.90', 'dim']) : DOC1();
          o.on.doc = done ? 'bad' : 1;
          bm(o, CAB.dbrel, { on: !inK }); bm(o, CAB.relk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done, tone: 'bad' });
          pk(o, WAY.rel, f1, 'e-1801 again'); pk(o, WAY.kdoc, f2, '', 'bad');
          o.cnt = [['IN KAFKA', inK ? '2 × e-1801' : '1 × e-1801', inK ? 'bad' : ''], ["IN LENA'S LIST", done ? '1056 twice' : '1056', done ? 'bad' : 'dim'], ['DELIVERY', 'at least 1 time', 'dim']];
          o.res = done ? [['duplicate on screen', 'bad'], ['INSERT without ON CONFLICT', 'bad']] : []; } },
      { id: 'idempotente', dur: 6, title: 'The defense: the consumer stores the evento_id', yk: 'IDEMPOTENT CONSUMER',
        code: ['receives e-1801', '  already applied? no → applies, stores e-1801', 'receives e-1801 again', '  already applied? yes → ignores', 'result: 1056 once'],
        story: 'The duplicate is part of the pattern, so the defense lives in the consumer: it stores the <code>evento_id</code> of each applied event (or applies only if the <code>versao</code> is greater). The second <code>e-1801</code> arrives, is already in the list of applied ones and is ignored. Lena\'s list has 1056 once.',
        look: 'The second e-1801 reaches meus-pedidos and changes nothing; 1056 shows up only once.',
        key: 'At least once + an idempotent consumer = the effect of exactly once.',
        f(o, t) { const f = lin(t, 0.6, 2, 0, 1), done = f >= 1; lit(o, 'db', 'relay', 'kfk', 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('pub', 3), OUTST('pub'));
          o.rows.relay = act('relay', 'POLL 2 s', ['id 3 marked', 'dim']);
          o.rows.kfk = KF([['pedidos topic', 'dim'], ['e-1801 · 2 times', 'hi']], [['e-1801', 'ok'], ['e-1801', 'ok'], ['', 'none']]);
          o.rows.doc = DOC(['1056 · criado · 114.80', 'acc'], [done ? 'e-1801 already applied: ignores' : 'applied: e-1801', done ? 'acc' : 'dim']);
          pk(o, WAY.kdoc, f, 'e-1801 (2nd)');
          o.cnt = [["IN LENA'S LIST", '1056 once'], ['DUPLICATE', done ? 'ignored' : '…', 'dim'], ['STORES', 'evento_id', 'dim']];
          o.res = done ? [['idempotent: the duplicate changes nothing', 'acc']] : []; } },
      { id: 'dois-relays', dur: 7, title: 'Two relays with SKIP LOCKED: different batches', yk: 'FOR UPDATE SKIP LOCKED (PostgreSQL 14)',
        code: ['SELECT … WHERE publicado_em IS NULL', '  ORDER BY id LIMIT 4', '  FOR UPDATE SKIP LOCKED', 'relay A → ids 1, 2, 3, 4', 'relay B → ids 5, 6, 7, 8   (nothing in common)'],
        story: 'To get more throughput, the store brings up a second relay. With <code>SELECT … WHERE publicado_em IS NULL ORDER BY id LIMIT 4 FOR UPDATE SKIP LOCKED</code>, each relay locks the rows it took and skips the ones the other locked. In the test, relay A took ids <b>1, 2, 3 and 4</b> and B, at the same time, <b>5, 6, 7 and 8</b>: nothing in common.',
        look: 'The second relay shows up below the first. Each one pulls a different batch from the outbox.',
        key: 'SKIP LOCKED splits the work between relays without taking the same row.',
        f(o) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2, on: true, flow: true }, { pts: CAB.rel2k }); bm(o, CAB.dbrel, { on: true, flow: true }); lit(o, 'db', 'relay', 'relay2');
          o.rows.db = DB(true, 'dim', 'criado', ['1–4 · relay A', 'acc'], ['  3 · PedidoCriado · e-1801', 'acc'], ['5–8 · relay B', 'hi'], ['  5 · PedidoPago · e-1802', 'hi']);
          o.rows.relay = act('relay A', 'SKIP LOCKED', ['ids 1, 2, 3, 4', 'acc'], ['has the PedidoCriado (3)', 'dim']);
          o.rows.relay2 = act('relay B', 'SKIP LOCKED', ['ids 5, 6, 7, 8', 'acc'], ['has the PedidoPago (5)', 'dim']);
          o.cnt = [['RELAY A', '1–4'], ['RELAY B', '5–8', 'dim'], ['IN COMMON', 'nothing', 'dim']];
          o.res = [['different batches, no repeats', 'acc']]; } },
      { id: 'ordem', dur: 7, title: 'If it goes wrong: PedidoPago arrives before PedidoCriado', yk: 'SWAPPED ORDER',
        code: ['relay A: id 3   PedidoCriado   e-1801', 'relay B: id 5   PedidoPago     e-1802', 'B publishes first', 'meus-pedidos: paid before it exists', 'defense: pedido_id key + versao'],
        story: 'The <code>PedidoCriado</code> of 1056 is id 3, in relay A\'s batch; the <code>PedidoPago</code> (<code>e-1802</code>) is id 5, in B\'s batch. The two relays run in parallel, and 5 can arrive <b>first</b>: <code>meus-pedidos</code> receives the payment for an order it does not have yet. Two defenses: the <b>topic key</b> is the <code>pedido_id</code> (same partition, same publishing order) and the consumer checks the <code>versao</code> (module 17, lesson 4).',
        look: 'Two lights leave the two relays; B\'s (e-1802) reaches Kafka first, and meus-pedidos turns red.',
        key: 'With more than one relay, the order between events of the same order is not guaranteed.',
        f(o, t) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2 }, { pts: CAB.rel2k }); const fB = lin(t, 0.4, 2.2, 0, 1), fA = lin(t, 1.4, 3.8, 0, 1), fd = lin(t, 2.2, 3.2, 0, 1), bad = fd >= 1;
          lit(o, 'db', 'relay', 'relay2'); if (fB >= 1) lit(o, 'kfk'); if (bad) o.on.doc = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', ['1–4 · relay A', 'dim'], ['  3 · PedidoCriado · e-1801', 'acc'], ['5–8 · relay B', 'dim'], ['  5 · PedidoPago · e-1802', 'acc']);
          o.rows.relay = act('relay A', 'id 3', [fA >= 1 ? 'published e-1801' : 'publishing e-1801…', 'hi']);
          o.rows.relay2 = act('relay B', 'id 5', [fB >= 1 ? 'published e-1802 first' : 'publishing e-1802…', fB >= 1 ? 'bad' : 'hi']);
          o.rows.kfk = KF([['pedidos topic', 'dim'], ['key: pedido-1056', 'dim']], [['e-1802', fB >= 1 ? 'bad' : 'none'], ['e-1801', fA >= 1 ? 'ok' : 'none'], ['', 'none']]);
          o.rows.doc = bad ? DOC(['PedidoPago for a 1056', 'bad'], ['the list does not have', 'bad'], ['1055 · 34.90', 'dim']) : DOC();
          bm(o, CAB.dbrel, { on: fA > 0 && fA < 1 }); bm(o, CAB.relk, { on: fA > 0 && fA < 1 }); bm(o, CAB.dbrel2, { on: fB < 1 }); bm(o, CAB.rel2k, { on: fB < 1, tone: 'bad' });
          pk(o, WAY.rel2, fB, 'e-1802', 'bad'); pk(o, WAY.rel, fA, 'e-1801'); pk(o, WAY.kdoc, fd, '', 'bad');
          o.cnt = [['ARRIVED FIRST', fB >= 1 ? 'e-1802' : '…', fB >= 1 ? 'bad' : ''], ['AFTER', fA >= 1 ? 'e-1801' : '…', 'dim'], ['DEFENSE', 'pedido_id + versao', 'dim']];
          o.res = bad ? [['paid before it exists', 'bad'], ['check the versao', 'acc']] : [];
          if (bad) T(o, TF(742), 'swapped order', 'bad'); } },
      { id: 'sem-skip', dur: 8, title: 'If it goes wrong: the lab\'s relay does not use SKIP LOCKED', yk: 'outbox_relay.go · lines 99 to 107',
        code: ['SELECT id, aggregate_type, … FROM Outbox_Events', ' WHERE processed_at IS NULL', '   AND retry_count < $1', ' ORDER BY created_at ASC LIMIT $2', '-- no FOR UPDATE SKIP LOCKED'],
        story: 'Read in the code: the lab relay\'s <code>SELECT</code> (lines 99 to 107) <b>does not have</b> <code>FOR UPDATE SKIP LOCKED</code>. With one relay, fine. With two, both read the <b>same</b> pending rows, and each event goes out <b>twice</b>: <code>e-1801</code> twice, <code>e-1802</code> twice. Either you run a single relay, or you add <code>SKIP LOCKED</code>; and the consumer still has to be idempotent.',
        look: 'Both relays pull the same outbox rows, and the Kafka tape ends up with each event repeated, in red.',
        key: 'Without SKIP LOCKED, two relays publish the same events.',
        f(o, t) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2 }, { pts: CAB.rel2k }); const n = Math.min(4, Math.floor(lin(t, 0.6, 4.6, 0, 4.99)));
          lit(o, 'db', 'kfk'); o.on.relay = 'bad'; o.on.relay2 = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', ['1–8 · both relays', 'bad'], ['  3 · PedidoCriado · e-1801', 'hi'], ['  5 · PedidoPago · e-1802', 'hi']);
          o.rows.relay = act('relay A', 'NO SKIP LOCKED', ['reads ids 1 to 8', 'bad']); o.rows.relay2 = act('relay B', 'NO SKIP LOCKED', ['reads ids 1 to 8', 'bad']);
          const tp = [['e-1801', 'ok'], ['e-1801', 'bad'], ['e-1802', 'ok'], ['e-1802', 'bad']];
          o.rows.kfk = KF([['pedidos topic', 'dim'], [n >= 4 ? 'each event 2 times' : 'publishing…', n >= 2 ? 'bad' : 'hi']], tp.map((c, i) => i < n ? c : ['', 'none']));
          bm(o, CAB.dbrel, { on: true, flow: true, tone: 'bad' }); bm(o, CAB.dbrel2, { on: true, flow: true, tone: 'bad' }); bm(o, CAB.relk, { on: true, tone: 'bad' }); bm(o, CAB.rel2k, { on: true, tone: 'bad' });
          o.cnt = [['DUPLICATES', `${Math.floor(n / 2)}`, n >= 2 ? 'bad' : ''], ['ROWS IN COMMON', '1 to 8', 'bad'], ['IN THE LAB', 'no SKIP LOCKED', 'bad']];
          o.res = n >= 4 ? [['both relays publish everything', 'bad'], ['1 relay, or SKIP LOCKED', 'acc']] : [['…', 'dim']];
          T(o, [455, 250, 34], 'the same rows', 'bad'); } },
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
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.5 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  // uma fita: células em fila; acesa = gravada/entregue, contorno = a caminho, vazia = ainda não, vermelha = duplicada/erro
  function drawTape(x, u, C, tape, W_, H_, label) {
    const n = Math.max(1, tape.length), lw = 40, gap = 3, cw = Math.min(70, (W_ - 10 - lw - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 6, light = theme === 'light';
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
        if (i) y += 3; fitFont(x, u, text, fs - 1, W_ - 14); const tw = x.measureText(text).width / u(1) + 8;
        x.fillStyle = on === 'bad' ? BAD() : accC(); x.fillRect(u(4), u(y - lh / 2 + 2), u(tw), u(lh - 4));
        x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillText(text, u(8), u(y + 0.5));
      } else if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); }
      y += lh; });
    if (d.tape && d.tape.length) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'TÓPICO');
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
  const on_ = (...i) => i.includes(step) ? ' class="on"' : '';
  const DATA = {
    'dual-write': () => `<table class="h3-sum"><tr><th>order</th><th>if the 2nd fails</th><th>effect</th></tr><tr${on_(3, 4)}><td>commit and then publish</td><td>broker down</td><td>order without an event: 108/h at 0.1%</td></tr><tr${on_(5)}><td>publish and then commit</td><td><code>COMMIT</code> refused</td><td>event without an order: ghost and undue charge</td></tr><tr><td>publish inside the transaction</td><td>slow broker</td><td>locks held; still not atomic</td></tr><tr><td>outbox (lesson 10)</td><td>relay down</td><td>the event waits in the table; nothing is lost</td></tr></table><li>The math: 30 orders/s × 3,600 s × 0.001 = <b>108 orders per hour</b> in the database without an event (example of a 0.1% publish failure)</li><li>The <code>e-1801</code> <code>PedidoCriado</code> event weighs <b>336 B</b> in compact JSON; money in cents (<code>"total_centavos":11480</code>)</li><li>Order 1056: 1 plush cat 79.90 + 1 blue mug 19.90 + Recife shipping 15.00 = <b>114.80</b>; <code>COMMIT</code> at 20:12:00.004</li><li>Confluent, "The Dual-Write Problem": the database transaction does not cover the broker</li>`,
    'falha-dual': () => `<li><code>hospital-cqrs-sql/internal/commands/handler.go</code> (read in the code, not run):</li><table class="h3-sum"><tr><th>line</th><th>what it does</th></tr><tr${on_(0, 2)}><td>51</td><td>writes the prescription to the database</td></tr><tr${on_(0)}><td>52–53</td><td>if the write fails, returns an error and does not publish</td></tr><tr${on_(0, 1)}><td>78</td><td><code>h.producer.Publish(ctx, eventKey, event)</code></td></tr><tr${on_(1)}><td>79</td><td><code>log.Printf("AVISO: Erro ao publicar evento, mas prescrição foi criada: %v", err)</code></td></tr><tr${on_(1)}><td>81</td><td>"O evento poderá ser republicado posteriormente" (the event can be republished later; there is no code that republishes)</td></tr><tr${on_(1)}><td>85</td><td><code>return prescricao, nil</code>: success</td></tr></table><li>The CDC lab's <code>ARCHITECTURE_COMPARISON.md</code> marks "Publica evento no Kafka (fora da transação!)" (publishes the event to Kafka, outside the transaction) as the problem</li><li><b>Correction to the article:</b> the "Dual-Write pattern" with <code>BEGIN … publish … COMMIT</code> and <i>rollback</i> is not atomic; it is the problem, not the solution</li><li>Atomic across PostgreSQL and Kafka would require <i>two-phase commit</i>, which blocks if the coordinator goes down (Fowler) and which Kafka does not offer</li>`,
    cdc: () => `<li><code>hospital-cqrs-cdc/postgres-connector.json</code>: <code>plugin.name: pgoutput</code>, <code>slot.name: hospital_cdc_slot</code>, <code>snapshot.mode: initial</code>, <code>decimal.handling.mode: double</code>, <i>transform</i> <code>ExtractNewRecordState</code></li><table class="h3-sum"><tr><th>op</th><th>means</th><th>the lab's handler</th></tr><tr${on_(2)}><td>c</td><td>created</td><td>processes</td></tr><tr${on_(4, 5)}><td>u</td><td>updated</td><td><b>ignores</b></td></tr><tr><td>d</td><td>deleted</td><td><b>ignores</b></td></tr><tr><td>r</td><td>read from the <i>snapshot</i></td><td>processes</td></tr></table><li>In the store: topics <code>loja.public.pedidos</code> and <code>loja.public.itens_pedido</code>; in the lab, <code>hospital_db.public.prescricoes</code> and <code>…prescricao_medicamentos</code></li><li><code>cdc_handler.go</code>: lines 66–72 only continue for <code>c</code> and <code>r</code>; lines 109–123 call <code>getMedico</code>, <code>getPaciente</code>, <code>getMedicamentosPrescricao</code> on the write database (read in the code)</li><li>Costs the lab's README admits: technical event, coupling to the schema, more pieces (Debezium, slot, WAL), latency of ms to seconds</li><li>Forgotten slot: PostgreSQL retains the entire WAL; the ~23 days at 108 MB/h math from module 17</li>`,
    outbox: () => `<li><code>test_decoding</code> (PostgreSQL 14.24, 10/20/2026): <code>BEGIN 832</code> · <code>table public.pedidos: INSERT: id[bigint]:1056 cliente_id[text]:'lena-77' …</code> · <code>table public.outbox: INSERT: id[bigint]:1 aggregate_type[text]:'pedido' aggregate_id[text]:'1056' event_type[text]:'PedidoCriado' payload[jsonb]:'{…"evento_id": "e-1801"…}'</code> · <code>COMMIT 832</code>; the test order with <code>ROLLBACK</code> left nothing</li><table class="h3-sum"><tr><th>WAL per order (20,000)</th><th>bytes</th><th>at 30/s</th></tr><tr${on_(5)}><td>without outbox</td><td>359.6</td><td>10.8 KB/s · 38.8 MB/h</td></tr><tr${on_(5)}><td>+ 2 INSERTs into the outbox</td><td>1,232.7</td><td>37.0 KB/s</td></tr><tr${on_(5)}><td>+ relay marks (UPDATE)</td><td>2,735.8 (7.6×)</td><td>82.1 KB/s · 295.5 MB/h</td></tr><tr><td>+ relay deletes (DELETE)</td><td>1,916.8 (5.3×)</td><td>57.5 KB/s · 207 MB/h</td></tr></table><li>The lab's relay (<code>outbox_relay.go</code>): <b>2 s</b> poll, batch of <b>100</b>, up to <b>5</b> attempts; +1 s on average, +2 s in the worst case</li><li>Debezium <i>Outbox Event Router</i>: columns <code>id</code>, <code>aggregatetype</code>, <code>aggregateid</code>, <code>type</code>, <code>payload</code>; routes by <code>aggregatetype</code></li><li>In the WAL test, <code>PedidoCriado</code> weighs 326 B in <code>jsonb</code> and <code>PedidoPago</code> 63 B</li>`,
    'relay-duplicado': () => `<table class="h3-sum"><tr><th>line (outbox_relay.go)</th><th>what it does</th></tr><tr${on_(6)}><td>99–107</td><td><code>SELECT … WHERE processed_at IS NULL AND retry_count &lt; $1 ORDER BY created_at ASC LIMIT $2</code>, <b>without</b> <code>FOR UPDATE SKIP LOCKED</code></td></tr><tr${on_(0, 1, 2)}><td>138</td><td><code>PublishRaw(ctx, eventKey, payload)</code>, key <code>aggregate_type-aggregate_id</code> = <code>pedido-1056</code></td></tr><tr><td>148–151</td><td>updates the <i>views</i> locally; if it fails, it only logs</td></tr><tr${on_(0, 1)}><td>154</td><td><code>marcarProcessado</code>: <code>UPDATE</code> of <code>processed_at</code> and <code>published_at</code></td></tr></table><li><code>SKIP LOCKED</code> measured (PostgreSQL 14.24): <code>SELECT … WHERE publicado_em IS NULL ORDER BY id LIMIT 4 FOR UPDATE SKIP LOCKED</code> → relay A <b>1, 2, 3, 4</b>; relay B <b>5, 6, 7, 8</b></li><li>In this test's ids, the <code>PedidoCriado</code> of 1056 (<code>e-1801</code>) is 3 and the <code>PedidoPago</code> (<code>e-1802</code>, 20:12:01.100) is 5</li><li><b>At-least-once</b> delivery: the consumer has to be idempotent (<code>evento_id</code>); the <code>hospital-cqrs-sql</code> handler does an <code>INSERT</code> without <code>ON CONFLICT</code> (read in the code)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // step action button (place 1056, take the broker down, ROLLBACK, take the relay down): moves on to the next step
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
  function readout() { if (active !== 'escrita') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'escrita' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-escrita3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'escrita') return;
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
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
