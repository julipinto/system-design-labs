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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return thou(+a) + (b ? ',' + b : ''); };
  const clock = ms => { const v = Math.max(0, Math.round(ms)), s = Math.floor(v / 1000); return '20:12:' + String(s).padStart(2, '0') + '.' + String(v % 1000).padStart(3, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['dual-write', 'falha-dual', 'cdc', 'outbox', 'relay-duplicado'];
  const SCNAME = { 'dual-write': 'Dual-write', 'falha-dual': 'Falha do dual-write', cdc: 'CDC', outbox: 'Outbox', 'relay-duplicado': 'Relay duplicado' };
  const SCFULL = { 'dual-write': 'Escrita dupla', 'falha-dual': 'O dual-write do laboratório e do artigo', cdc: 'Change Data Capture',
    outbox: 'Transactional outbox', 'relay-duplicado': 'O relay que publica duas vezes' };
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
  const ITENS = tn => [['1056 · 42 · 1 × 79,90', tn], ['1056 · 7 · 1 × 19,90', tn]];
  // com a outbox embaixo e o 1056 gravado, o 1055 sai do bloco para caber tudo
  const DB = (has, tn = 'acc', st = 'criado', ...out) => { const old = !(has && out.length);
    return small(act('PostgreSQL loja', 'ESCRITA', ['pedidos', 'tbl'],
      has ? [`1056 · lena-77 · ${st}`, tn] : null, old ? ['1055 · lena-77 · 34,90', 'dim'] : null, ['itens_pedido', 'tbl'],
      ...(has ? ITENS(tn) : []), ...(old ? [['1055 · 7 · 1 × 19,90', 'dim']] : []),
      ...(out.length ? [['outbox', 'tbl'], ...out] : []))); };
  const KF = (rows, tape, meta = 'BROKER') => { const d = act('Kafka', meta, ...rows); d.fs = 13; d.lh = 18; if (tape) { d.tape = tape; d.tapeLabel = 'TÓPICO'; } return d; };
  const LIST = ['lista da lena-77', 'dim'];
  const DOC = (...r) => act('meus-pedidos', 'LEITURA', LIST, ...(r.length ? r : [['1055 · 34,90', 'hi']]));
  const DOC1 = (tn = 'acc', st = 'criado') => DOC([`1056 · ${st} · 114,80`, tn], ['1055 · 34,90', 'dim']);
  const SHOW = { 'dual-write': ['db', 'cmd', 'kfk', 'doc', 'pag'], 'falha-dual': ['db', 'cmd', 'kfk', 'doc', 'pag'],
    cdc: ['db', 'cmd', 'wal', 'kfk', 'doc'], outbox: ['db', 'cmd', 'relay', 'kfk', 'doc'], 'relay-duplicado': ['db', 'cmd', 'relay', 'kfk', 'doc'] };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.db = DB(false);
    o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['1 gato + 1 caneca + frete', 'dim'], ['total 114,80', 'dim']);
    o.rows.kfk = KF([['tópico pedidos', 'dim'], ['chave: pedido_id', 'dim']], [['', 'none'], ['', 'none'], ['', 'none']]);
    o.rows.doc = DOC();
    o.rows.pag = act('pagamentos', 'CONSUMIDOR', ['cobra ao ver PedidoCriado', 'dim']);
    o.rows.wal = act('WAL', 'SLOT · pgoutput', ['Debezium lê o log do banco', 'dim']); o.rows.wal.tape = []; o.rows.wal.tapeLabel = 'LOG';
    o.rows.relay = act('relay', 'POLL 2 s', ['lote 100 · até 5 tentativas', 'dim'], ['outbox_relay.go', 'dim']);
    o.rows.relay2 = act('relay B', 'POLL 2 s', ['segundo processo', 'dim']);
    if (sc === 'dual-write' || sc === 'falha-dual') {
      o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['1. INSERT no banco', 'dim'], ['2. publish no Kafka', 'dim']);
      o.beams.push({ pts: CAB.cdb }, { pts: CAB.pub }, { pts: CAB.kdoc }, { pts: CAB.kpag });
    } else if (sc === 'cdc') {
      o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['só grava no banco', 'dim'], ['sem produtor Kafka', 'dim']);
      o.rows.kfk = KF([['loja.public.pedidos', 'dim'], ['loja.public.itens_pedido', 'dim']], null, 'DOIS TÓPICOS');
      o.beams.push({ pts: CAB.cdb }, { pts: CAB.dbwal }, { pts: CAB.walk }, { pts: CAB.kdoc });
    } else {
      o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['pedido + evento', 'dim'], ['numa transação', 'dim']);
      o.rows.db = DB(false, 'acc', 'criado', ['vazia', 'dim']);
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
      { id: 'cena', dur: 5, title: 'Duas escritas, dois sistemas', yk: 'O COMANDO DO 1056', act: ['Fazer o 1056', 'INSERT + publish'],
        code: ['1. INSERT no PostgreSQL loja', '   pedidos + itens_pedido · COMMIT', '2. publish no Kafka', '   e-1801 PedidoCriado · 336 B', 'nada amarra o 1 ao 2'],
        story: 'À esquerda, o serviço <code>pedidos</code> e o PostgreSQL <code>loja</code>. À direita, o Kafka e quem escuta o tópico: o <code>meus-pedidos</code> (o modelo de leitura da Lena) e o <code>pagamentos</code>. Na escrita dupla, o comando do 1056 faz duas coisas em sequência: grava no banco e publica o evento no broker. Os dois cabos saem do mesmo serviço e não sabem um do outro.',
        look: 'Dois cabos saem do pedidos: um sobe para o banco, o outro atravessa a prancha até o Kafka. Nenhum passa pelo outro.',
        key: 'Escrita dupla são duas escritas em dois lugares, sem nada que as torne atômicas.',
        f(o) { lit(o, 'cmd');
          o.cnt = [['ESCRITAS', '2'], ['TRANSAÇÕES', '1 (só o banco)', 'dim'], ['ATÔMICO', 'não', 'dim']];
          o.res = [['duas escritas, nenhuma garantia', 'acc']];
          T(o, [165, 268, 40], 'escrita 1: banco', 'dim'); T(o, [455, 392, 26], 'escrita 2: broker', 'dim'); } },
      { id: 'commit', dur: 5, title: 'INSERT e COMMIT às 20:12:00.004', yk: 'ESCRITA 1: O BANCO',
        code: ['BEGIN;', "INSERT INTO pedidos (1056, 'lena-77', …);", 'INSERT INTO itens_pedido … (42, 1, 7990);', 'INSERT INTO itens_pedido … (7, 1, 1990);', 'COMMIT;   -- 20:12:00.004'],
        story: 'Às <b>20:12:00.000</b> a Lena fecha a compra: 1 gato de pelúcia (79,90), 1 caneca azul (19,90) e o frete de Recife (15,00), <b>114,80</b>. O <code>pedidos</code> grava 1 linha em <code>pedidos</code> e 2 em <code>itens_pedido</code> e dá <code>COMMIT</code> às <b>20:12:00.004</b>. A primeira escrita terminou. O Kafka ainda não sabe de nada.',
        look: 'A luz desce do pedidos para o banco e as linhas do 1056 acendem. O cabo do Kafka continua apagado.',
        key: 'A primeira escrita é uma transação normal, e ela não sabe que existe uma segunda.',
        f(o, t) { const ms = lin(t, 0.4, 3, 0, 4), ok = ms >= 4; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.db = DB(ok); bm(o, CAB.cdb, { on: !ok }); pk(o, WAY.cdb, lin(t, 0.4, 3, 0, 1), 'INSERT 1056');
          o.cnt = [['RELÓGIO', clock(ms)], ['LINHAS', ok ? '1 + 2' : '…', 'dim'], ['NO KAFKA', 'nada ainda', 'dim']];
          o.res = ok ? [['1056 gravado no banco', 'acc'], ['o evento ainda não saiu', 'dim']] : []; } },
      { id: 'publish', dur: 6, title: 'publish PedidoCriado: o caminho feliz', yk: 'ESCRITA 2: O BROKER', act: ['Derrubar o broker', 'depois do commit'],
        code: ['producer.Publish("pedido-1056", e-1801)', '  {"evento_id":"e-1801",', '   "tipo":"PedidoCriado",', '   "pedido_id":1056, … }   = 336 B', 'meus-pedidos e pagamentos recebem'],
        story: 'Logo depois do <code>COMMIT</code>, o <code>pedidos</code> publica o <code>e-1801</code>, <code>PedidoCriado</code>, de <b>336 bytes</b>. O <code>meus-pedidos</code> põe o 1056 no topo da lista da Lena e o <code>pagamentos</code> passa a cobrar 114,80. Quando as duas escritas dão certo, ninguém percebe que eram duas.',
        look: 'A luz atravessa a prancha até o Kafka e segue para o meus-pedidos e o pagamentos. Os três acendem.',
        key: 'No caminho feliz a escrita dupla funciona; o problema é o que sobra quando uma das duas falha.',
        f(o, t) { const f1 = lin(t, 0.4, 2.4, 0, 1), f2 = lin(t, 2.4, 3.8, 0, 1), inK = f1 >= 1, done = f2 >= 1;
          lit(o, 'cmd', 'db'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc', 'pag');
          o.rows.db = DB(true); o.rows.kfk = KF([['tópico pedidos', 'dim'], [inK ? 'e-1801 · 336 B' : 'chave: pedido_id', inK ? 'acc' : 'dim']], TAPE1(inK ? 'ok' : f1 > 0 ? 'recv' : 'none'));
          if (done) { o.rows.doc = DOC1(); o.rows.pag = act('pagamentos', 'CONSUMIDOR', ['e-1801 recebido · cobra 114,80', 'acc']); }
          bm(o, CAB.pub, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); bm(o, CAB.kpag, { on: inK && !done });
          pk(o, WAY.pub, f1, 'e-1801 · 336 B'); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['EVENTO', 'e-1801'], ['TAMANHO', '336 B', 'dim'], ['NO meus-pedidos', done ? '1056' : '…', 'dim']];
          o.res = done ? [['as duas escritas deram certo', 'acc']] : []; } },
      { id: 'broker-fora', dur: 7, title: 'Falha 1: banco ok, broker fora', yk: 'PEDIDO SEM EVENTO',
        code: ['COMMIT;              -- 20:12:00.004  ok', 'producer.Publish(…)  -- broker fora', '  → erro de rede', 'o 1056 está no banco', 'o e-1801 nunca sai'],
        story: 'Agora o broker está fora no instante do <code>publish</code>. O <code>COMMIT</code> já passou: o 1056 <b>existe</b> no banco. O evento <b>nunca sai</b>. O <code>meus-pedidos</code> não fica sabendo, e a Lena não vê o pedido que acabou de pagar. O <code>estoque</code> também não reserva: a caneca fica em 36 em vez de 35, como o módulo 17 já tinha mostrado.',
        look: 'O banco acende com o 1056; o cabo do Kafka fica vermelho no meio do caminho, e o meus-pedidos continua sem o 1056.',
        key: 'Pedido sem evento: o banco sabe, o modelo de leitura nunca vai saber.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), bad = f >= 0.8; lit(o, 'cmd', 'db'); o.rows.db = DB(true);
          if (bad) { o.on.kfk = 'bad'; o.on.doc = 'bad'; }
          o.rows.kfk = KF([['tópico pedidos', 'dim'], [bad ? 'broker fora' : 'chave: pedido_id', bad ? 'bad' : 'dim']], TAPE1('none', ''));
          o.rows.doc = DOC(['1055 · 34,90', 'hi'], bad ? ['1056: nunca chegou', 'bad'] : null);
          o.rows.pag = act('pagamentos', 'CONSUMIDOR', ['nada para cobrar', 'dim']);
          bm(o, CAB.pub, { on: true, tone: bad ? 'bad' : '' }); if (f < 0.8) pk(o, WAY.pub, f, 'e-1801', '');
          o.cnt = [['NO BANCO', '1056'], ['NO KAFKA', bad ? 'nada' : '…', bad ? 'bad' : 'dim'], ['NO meus-pedidos', bad ? 'sem o 1056' : '…', bad ? 'bad' : 'dim']];
          o.res = bad ? [['pedido sem evento', 'bad'], ['o comando devolveu sucesso', 'dim']] : [];
          if (bad) T(o, [520, 398, 26], 'broker fora', 'bad'); } },
      { id: 'conta', dur: 8, title: '0,1% de falha: 108 pedidos por hora sem evento', yk: 'A CONTA',
        code: ['falha de publicação: 0,1%', '30 pedidos/s × 3.600 s = 108.000 por hora', '108.000 × 0,001 = 108 por hora', 'existem no banco, sem evento', 'nunca chegam ao modelo de leitura'],
        story: 'Um broker não fica fora por muito tempo; basta um soluço. Se a publicação falha em <b>0,1%</b> das vezes, a 30 pedidos/s da Black Friday são 30 × 3.600 × 0,001 = <b>108 pedidos por hora</b> que existem no banco e não têm evento. Nenhum deles chega ao modelo de leitura, e nada avisa: o comando devolveu sucesso para todos.',
        look: 'Uma pilha vermelha cresce no meio da prancha: cada cartão é um pedido gravado que não virou evento. O contador vai até 108 em uma hora.',
        key: '0,1% parece pouco; a 30 pedidos/s são 108 pedidos invisíveis por hora.',
        f(o, t) { const m = lin(t, 0.4, 6.4, 0, 60), n = 108 * m / 60, done = m >= 60; lit(o, 'cmd', 'db', 'kfk'); o.rows.db = DB(true);
          bm(o, CAB.cdb, { on: true, flow: true }); bm(o, CAB.pub, { on: true, flow: true });
          o.piles = n >= 1 ? [{ p: [455, 230], f: n / 108, v: n }] : [];
          o.cnt = [['SEM EVENTO', thou(n), n >= 1 ? 'bad' : ''], ['TEMPO', `${Math.round(m)} min`, 'dim'], ['PEDIDOS GRAVADOS', thou(1800 * m), 'dim']];
          o.res = done ? [['108 por hora, para sempre', 'bad']] : [['contando…', 'dim']];
          T(o, [455, 300, 20], 'pedidos sem evento', 'bad'); } },
      { id: 'fantasma', dur: 8, title: 'E se der errado: evento sem pedido', yk: 'A OUTRA ORDEM',
        code: ['producer.Publish(…)   -- ok: e-1801 saiu', 'COMMIT;               -- recusado', '  → o banco não tem o 1056', 'meus-pedidos mostra o 1056', 'pagamentos cobra 114,80'],
        story: 'Trocar a ordem não resolve, só troca a falha. Se o comando publica primeiro e o <code>COMMIT</code> é recusado depois (um conflito, o disco cheio, o banco que caiu), o <code>e-1801</code> já foi. O <code>meus-pedidos</code> mostra um 1056 que <b>não existe</b>, e o <code>pagamentos</code> pode cobrar 114,80 de um pedido que o banco não tem. É o fantasma.',
        look: 'O evento chega ao Kafka e acende o meus-pedidos e o pagamentos em vermelho; o banco fica vermelho, com o COMMIT recusado e sem o 1056.',
        key: 'Em qualquer ordem, uma das duas escritas pode falhar sozinha.',
        f(o, t) { const f1 = lin(t, 0.4, 2.2, 0, 1), f2 = lin(t, 2.2, 3.4, 0, 1), inK = f1 >= 1, fail = t > 2.8, done = f2 >= 1; lit(o, 'cmd'); if (inK) lit(o, 'kfk');
          if (fail) { o.on.db = 'bad'; o.rows.db = DB(false); o.rows.db.rows.push(['COMMIT recusado', 'bad']); } else o.rows.db = DB(false);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], [inK ? 'e-1801 · 336 B' : 'chave: pedido_id', inK ? 'acc' : 'dim']], TAPE1(inK ? 'ok' : f1 > 0 ? 'recv' : 'none'));
          if (done) { o.on.doc = 'bad'; o.on.pag = 'bad'; o.rows.doc = DOC1('bad', 'fantasma'); o.rows.pag = act('pagamentos', 'CONSUMIDOR', ['cobrou 114,80 de um pedido', 'bad'], ['que o banco não tem', 'bad']); }
          bm(o, CAB.pub, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); bm(o, CAB.kpag, { on: inK && !done }); bm(o, CAB.cdb, { tone: fail ? 'bad' : '' });
          pk(o, WAY.pub, f1, 'e-1801'); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['NO BANCO', fail ? 'nada' : '…', fail ? 'bad' : 'dim'], ['NO KAFKA', inK ? 'e-1801' : '…', 'dim'], ['COBRADO', done ? '114,80' : '…', done ? 'bad' : 'dim']];
          o.res = fail && done ? [['evento sem pedido: fantasma', 'bad'], ['e cobrança indevida', 'bad']] : fail ? [['COMMIT recusado', 'bad']] : [];
          if (fail) T(o, TF(165), 'COMMIT recusado', 'bad'); if (done) T(o, TF(742), 'um 1056 que não existe', 'bad'); } },
    ],
    'falha-dual': [
      { id: 'lab', dur: 6, title: 'O handler.go do laboratório: grava, depois publica', yk: 'hospital-cqrs-sql · commands/handler.go',
        code: ['51  prescricao, … := h.repo.CriarPrescricao(…)', '52  if err != nil {', '53    return nil, fmt.Errorf(…)', '78  if err := h.producer.Publish(…); err != nil {', '79    log.Printf("AVISO: Erro ao publicar …")', '85  return prescricao, nil'],
        story: 'No laboratório do autor, o <code>hospital-cqrs-sql</code> faz a escrita dupla à mão. A linha 51 <b>grava</b> no banco; se falhar, as linhas 52 e 53 devolvem o erro e nada é publicado. A linha 78 <b>publica</b> no Kafka depois de gravar. Leia "prescrição" como "pedido": é o mesmo desenho do 1056. Isso foi lido no código; o laboratório exige Docker e Kafka e não foi executado.',
        look: 'O pedidos grava no banco e só depois manda o evento ao Kafka, pelo cabo comprido da frente.',
        key: 'O laboratório publica depois do commit, fora da transação.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 2, 4, 0, 1); lit(o, 'cmd'); if (f1 >= 1) lit(o, 'db'); if (f2 >= 1) lit(o, 'kfk');
          o.rows.cmd = act('pedidos', 'handler.go', ['51  grava no banco', f1 >= 1 ? 'acc' : 'hi'], ['78  publica no Kafka', f2 >= 1 ? 'acc' : 'hi'], ['85  devolve sucesso', 'dim']); o.rows.cmd.fs = 14;
          o.rows.db = DB(f1 >= 1); if (f2 >= 1) o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          pk(o, WAY.cdb, f1, 'linha 51'); pk(o, WAY.pub, f2, 'linha 78');
          o.cnt = [['GRAVA', 'linha 51'], ['PUBLICA', 'linha 78', 'dim'], ['DEVOLVE', 'linha 85', 'dim']];
          o.res = f2 >= 1 ? [['duas escritas, uma depois da outra', 'acc']] : []; } },
      { id: 'aviso', dur: 8, title: 'Broker fora: o código loga um AVISO e devolve sucesso', yk: 'O ERRO ENGOLIDO',
        code: ['78  Publish(…) → erro', '79  log.Printf("AVISO: Erro ao publicar', '      evento, mas prescrição foi criada")', '81  // O evento poderá ser republicado', '    //   posteriormente   (ninguém republica)', '85  return prescricao, nil   → sucesso'],
        story: 'Se o <code>Publish</code> falha, a linha 79 só escreve <code>log.Printf("AVISO: Erro ao publicar evento, mas prescrição foi criada")</code> e o código <b>segue</b>. A linha 85 devolve <b>sucesso</b>. O comentário da linha 81 diz que "o evento poderá ser republicado posteriormente", mas não há código que o faça. A Lena recebe "pedido confirmado", e o <code>meus-pedidos</code> nunca recebe o 1056. É a Falha 1, escrita à mão.',
        look: 'O cabo do Kafka fica vermelho; o pedidos mostra a linha de AVISO e o "sucesso", e o meus-pedidos continua sem o 1056.',
        key: 'Engolir o erro transforma a falha numa perda silenciosa.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), bad = f >= 0.8; lit(o, 'db'); o.rows.db = DB(true); o.on.cmd = bad ? 'bad' : 1;
          o.rows.cmd = act('pedidos', 'handler.go', ['51  gravou o 1056', 'acc'], [bad ? '79  log AVISO e segue' : '78  publicando…', bad ? 'bad' : 'hi'], [bad ? '85  devolve sucesso' : '', 'acc']); o.rows.cmd.fs = 14;
          if (bad) { o.on.kfk = 'bad'; o.rows.kfk = KF([['tópico pedidos', 'dim'], ['Publish: erro', 'bad']], TAPE1('none', '')); o.rows.doc = DOC(['1055 · 34,90', 'hi'], ['1056: nunca chegou', 'bad']); o.on.doc = 'bad'; }
          bm(o, CAB.pub, { on: true, tone: bad ? 'bad' : '' }); if (!bad) pk(o, WAY.pub, f, 'e-1801');
          o.cnt = [['A LENA VÊ', 'pedido confirmado'], ['NO meus-pedidos', bad ? 'sem o 1056' : '…', bad ? 'bad' : 'dim'], ['QUEM REPUBLICA', 'ninguém', 'bad']];
          o.res = bad ? [['AVISO no log, sucesso na resposta', 'bad'], ['e o evento perdido', 'bad']] : [];
          if (bad) T(o, TF(165), 'AVISO: … mas prescrição foi criada', 'bad'); } },
      { id: 'cai', dur: 7, title: 'O processo cai entre gravar e publicar', yk: 'SEM ERRO, SEM LOG',
        code: ['51  grava · COMMIT às 20:12:00.004', '    o processo morre aqui (deploy, memória)', '78  Publish(…)   nunca roda', '79  AVISO …      nunca roda', 'nenhum log, nenhum evento'],
        story: 'Nem é preciso o broker falhar. Se o processo morre entre a linha 51 e a 78 (um <i>deploy</i>, falta de memória), o <code>COMMIT</code> já passou e o <code>Publish</code> nunca roda. Desta vez não sobra nem a linha de AVISO no log: o 1056 está no banco, e ninguém sabe que o evento faltou.',
        look: 'O pedidos fica vermelho logo depois do COMMIT. O banco tem o 1056; o cabo do Kafka nem chega a acender.',
        key: 'Entre duas escritas sempre há um instante em que só a primeira aconteceu.',
        f(o, t) { const f = lin(t, 0.4, 1.8, 0, 1), ok = f >= 1, dead = t > 2.4; if (ok) lit(o, 'db'); o.on.cmd = dead ? 'bad' : 1; o.rows.db = DB(ok);
          o.rows.cmd = act('pedidos', 'handler.go', ['51  COMMIT às .004', ok ? 'acc' : 'hi'], [dead ? 'processo morreu' : '…', dead ? 'bad' : 'dim'], [dead ? '78  nunca rodou' : '', 'bad']); o.rows.cmd.fs = 14;
          if (dead) { o.rows.doc = DOC(['1055 · 34,90', 'hi'], ['1056: nunca chegou', 'bad']); o.on.doc = 'bad'; }
          pk(o, WAY.cdb, f, 'COMMIT');
          o.cnt = [['NO BANCO', ok ? '1056' : '…'], ['NO KAFKA', dead ? 'nada' : '…', dead ? 'bad' : 'dim'], ['NO LOG', dead ? 'nada' : '…', dead ? 'bad' : 'dim']];
          o.res = dead ? [['pedido sem evento, e sem rastro', 'bad']] : [];
          if (dead) T(o, TF(165), 'processo caiu', 'bad'); } },
      { id: 'artigo', dur: 7, title: 'O "padrão Dual-Write" do artigo: publish dentro da transação', yk: 'BEGIN … PUBLISH … COMMIT',
        code: ['BEGIN;', 'INSERT INTO pedidos … 1056 …;', 'producer.Publish(e-1801)   -- rede', 'COMMIT;', 'se algo falhar: ROLLBACK'],
        story: 'O artigo-base apresenta o "padrão Dual-Write" como um <code>BEGIN</code>, a publicação e um <code>COMMIT</code>, com <i>rollback</i> se algo falhar, e diz que assim "um ou outro não ocorre isoladamente". Parece mais seguro: o evento sai com a transação ainda aberta. Só que a transação do banco <b>não cobre</b> o broker. E, enquanto o <code>publish</code> espera a rede, a transação fica aberta <b>segurando locks</b>: um broker lento trava quem precisa das mesmas linhas.',
        look: 'O banco fica aceso com a transação aberta enquanto a luz vai ao Kafka. Os locks continuam presos até o COMMIT.',
        key: 'Pôr o publish dentro da transação não o torna parte dela.',
        f(o, t) { const f = lin(t, 1, 4, 0, 1), inK = f >= 1, done = t > 4.8; lit(o, 'cmd', 'db'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'hi'); o.rows.db.rows.push([done ? 'COMMIT' : 'transação aberta · locks presos', done ? 'acc' : 'bad']);
          o.rows.cmd = act('pedidos', 'ARTIGO', ['BEGIN · INSERT', 'acc'], [inK ? 'publish ok' : 'publish… (rede)', inK ? 'acc' : 'hi'], [done ? 'COMMIT' : 'COMMIT espera', done ? 'acc' : 'dim']); o.rows.cmd.fs = 14;
          if (inK) o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          bm(o, CAB.pub, { on: !inK }); pk(o, WAY.pub, f, 'e-1801 (transação aberta)');
          o.cnt = [['TRANSAÇÃO', done ? 'fechada' : 'aberta', done ? '' : 'bad'], ['LOCKS', done ? 'soltos' : 'presos', done ? 'dim' : 'bad'], ['O KAFKA', 'fora da transação', 'dim']];
          o.res = [['o broker não está na transação', 'acc']]; } },
      { id: 'commit-falha', dur: 8, title: 'E se der errado: o evento saiu e o COMMIT falhou', yk: 'O ROLLBACK NÃO RECOLHE O EVENTO',
        code: ['BEGIN; INSERT … 1056 …;', 'Publish(e-1801)   -- ok, já está no Kafka', 'COMMIT;           -- recusado', 'ROLLBACK: o banco esquece o 1056', 'o Kafka não esquece o e-1801'],
        story: 'No desenho do artigo, o evento sai antes do <code>COMMIT</code>. Se o <code>COMMIT</code> é recusado, o <i>rollback</i> desfaz o 1056 no banco, mas o <code>e-1801</code> <b>já foi</b>: o <code>meus-pedidos</code> mostra um pedido que não existe e o <code>pagamentos</code> pode cobrar 114,80. Atômico de verdade entre PostgreSQL e Kafka exigiria <i>two-phase commit</i>, que bloqueia se o coordenador cai (Fowler) e que o Kafka não oferece. A saída é ter <b>uma só</b> escrita e derivar a outra do que o banco gravou: CDC ou outbox.',
        look: 'O banco fica vermelho e perde o 1056; o Kafka, o meus-pedidos e o pagamentos ficam com ele, em vermelho do lado da leitura.',
        key: 'A transação do banco não cobre o broker: o rollback não recolhe o evento.',
        f(o, t) { const fail = t > 1.4, f2 = lin(t, 1.8, 3.2, 0, 1), done = f2 >= 1; lit(o, 'cmd', 'kfk');
          o.on.db = fail ? 'bad' : 1; o.rows.db = fail ? DB(false) : DB(true, 'hi'); o.rows.db.rows.push([fail ? 'COMMIT recusado · ROLLBACK' : 'transação aberta', 'bad']);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · 336 B', 'acc']], TAPE1('ok'));
          if (done) { o.on.doc = 'bad'; o.on.pag = 'bad'; o.rows.doc = DOC1('bad', 'fantasma'); o.rows.pag = act('pagamentos', 'CONSUMIDOR', ['cobrou 114,80 de um pedido', 'bad'], ['que o banco desfez', 'bad']); }
          bm(o, CAB.kdoc, { on: !done }); bm(o, CAB.kpag, { on: !done }); bm(o, CAB.cdb, { tone: fail ? 'bad' : '' }); pk(o, WAY.kdoc, f2); pk(o, WAY.kpag, f2);
          o.cnt = [['NO BANCO', fail ? 'desfeito' : 'aberto', fail ? 'bad' : 'dim'], ['NO KAFKA', 'e-1801', 'dim'], ['ATÔMICO', 'só com 2PC', 'bad']];
          o.res = fail ? [['o rollback não recolhe o evento', 'bad'], ['uma escrita só: CDC ou outbox', 'acc']] : [];
          if (fail) T(o, TF(165), 'ROLLBACK', 'bad'); if (done) T(o, TF(742), 'o evento já foi', 'bad'); } },
    ],
    cdc: [
      { id: 'log', dur: 6, title: 'O log do banco já tem tudo o que foi confirmado', yk: 'O CONECTOR', act: ['Fazer o 1056', 'só o INSERT'],
        code: ['wal_level = logical', 'slot: hospital_cdc_slot   (no laboratório)', 'plugin: pgoutput', 'snapshot.mode: initial', 'Debezium → Kafka Connect → tópicos'],
        story: 'O banco já guarda uma lista de tudo o que <b>confirmou</b>, na ordem: o WAL. Com <code>wal_level=logical</code>, um slot de replicação e o <code>pgoutput</code>, o Debezium lê esse log e publica cada mudança no Kafka (o CDC do módulo 17, aula 5). O <code>pedidos</code> volta a fazer uma coisa só: gravar. No laboratório <code>hospital-cqrs-cdc</code>, o <i>command service</i> nem tem produtor Kafka.',
        look: 'Entre o banco e o Kafka há uma fita: o WAL, com o Debezium lendo. O pedidos só tem o cabo do banco.',
        key: 'O CDC tira a segunda escrita da aplicação: quem publica é o leitor do log.',
        f(o) { lit(o, 'wal');
          o.cnt = [['ESCRITAS DO COMANDO', '1'], ['QUEM PUBLICA', 'Debezium', 'dim'], ['O QUE ELE LÊ', 'o WAL', 'dim']];
          o.res = [['o comando não fala com o Kafka', 'acc']];
          T(o, [455, 140, 30], 'o log do banco', 'dim'); } },
      { id: 'commit', dur: 6, title: 'O 1056 vira linhas no WAL', yk: 'A TRANSAÇÃO NO LOG',
        code: ['BEGIN', 'pedidos       INSERT 1056', 'itens_pedido  INSERT 1056 · 42', 'itens_pedido  INSERT 1056 · 7', 'COMMIT        -- 20:12:00.004'],
        story: 'O <code>CriarPedido</code> grava 1 linha em <code>pedidos</code> e 2 em <code>itens_pedido</code> e dá <code>COMMIT</code> às <b>20:12:00.004</b>. O WAL registra a transação inteira, do <code>BEGIN</code> ao <code>COMMIT</code>. A decodificação lógica só entrega transações confirmadas: uma transação desfeita não vira evento.',
        look: 'A fita do WAL ganha cinco células: BEGIN, as três linhas do 1056 e o COMMIT.',
        key: 'O log só tem o que foi confirmado.',
        f(o, t) { const n = Math.floor(lin(t, 0.6, 4, 0, 5.99)), ms = lin(t, 0.4, 3, 0, 4), ok = n >= 5; lit(o, 'cmd', 'wal'); if (n >= 2) lit(o, 'db');
          o.rows.db = DB(n >= 2); const C = ['BEGIN', 'ped c', 'item c', 'item c', 'COMMIT'];
          o.rows.wal.tape = C.map((l, i) => [l, i < n ? 'ok' : 'none']); o.rows.wal.rows = [['transação do 1056', 'hi']];
          bm(o, CAB.cdb, { on: !ok }); bm(o, CAB.dbwal, { on: n >= 1 && !ok, flow: n >= 1 && !ok }); pk(o, WAY.cdb, lin(t, 0.4, 2.4, 0, 1), 'INSERT 1056');
          o.cnt = [['RELÓGIO', clock(ms)], ['NO WAL', `${n} de 5`, 'dim'], ['LINHAS', '1 + 2', 'dim']];
          o.res = ok ? [['a transação inteira está no log', 'acc']] : []; } },
      { id: 'topicos', dur: 7, title: 'Duas tabelas, dois tópicos', yk: 'O QUE O DEBEZIUM PUBLICA',
        code: ['loja.public.pedidos', '  {"id":1056,"status":"criado",…,"op":"c"}', 'loja.public.itens_pedido', '  {…"produto_id":42,…,"op":"c"}', '  {…"produto_id":7,…,"op":"c"}'],
        story: 'O Debezium publica cada tabela no seu tópico: a linha do 1056 vai para <code>loja.public.pedidos</code> e as duas de itens, para <code>loja.public.itens_pedido</code>. O <i>transform</i> <code>ExtractNewRecordState</code> deixa só o <b>novo valor</b> da linha, e o campo <code>op</code> diz o que aconteceu: <code>c</code>, criou. São três mensagens técnicas, uma por linha; o <code>PedidoCriado</code> de 336 B, com os itens dentro, não existe aqui.',
        look: 'Três luzes saem da fita para o Kafka: uma vai para o tópico de pedidos, duas para o de itens. Depois o meus-pedidos monta o 1056.',
        key: 'O evento do CDC é técnico: uma linha mudou, num tópico por tabela.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), inK = f >= 1, f2 = lin(t, 3, 4.4, 0, 1), done = f2 >= 1; lit(o, 'db', 'wal'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true); o.rows.wal.tape = ['BEGIN', 'ped c', 'item c', 'item c', 'COMMIT'].map(l => [l, 'ok']); o.rows.wal.rows = [['Debezium publica', 'hi']];
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], [inK ? '  1056 · op c' : '', 'acc'], ['loja.public.itens_pedido', 'hi'], [inK ? '  1056·42 e 1056·7 · op c' : '', 'acc']], null, 'DOIS TÓPICOS');
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.walk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done });
          pk(o, WAY.wal.slice(2), f, 'pedidos · c'); pk(o, WAY.wal.slice(2), clamp(f - 0.18), ''); pk(o, WAY.wal.slice(2), clamp(f - 0.36), 'itens · c'); pk(o, WAY.kdoc, f2);
          o.cnt = [['MENSAGENS', inK ? '3' : '…'], ['TÓPICOS', '2', 'dim'], ['op', 'c', 'dim']];
          o.res = done ? [['3 linhas, não 1 PedidoCriado', 'acc']] : []; } },
      { id: 'kafka-fora', dur: 8, title: 'O broker cai e o checkout continua', yk: 'README DO LABORATÓRIO',
        code: ['Kafka fora', 'pedidos: INSERT · COMMIT   ok', 'o slot guarda o WAL desde o último lido', 'Kafka volta: o Debezium continua', '  do ponto onde parou'],
        story: 'Se o Kafka cai, o comando nem percebe: ele não fala com o Kafka. O slot de replicação guarda o WAL a partir do último ponto lido, e quando o broker volta o Debezium continua dali. O README do laboratório diz: "Se Kafka cair, aplicação continua funcionando. Debezium replica quando volta." Não há mais pedido sem evento nem evento sem pedido.',
        look: 'O Kafka fica vermelho; o pedidos e o banco seguem acesos, e a fita do WAL acumula células à espera. Quando o Kafka volta, a fita esvazia.',
        key: 'Só vira evento o que foi confirmado, e nada se perde se o broker cai.',
        f(o, t) { const down = t < 4.6, n = Math.min(5, Math.floor(lin(t, 0.6, 4.2, 0, 5.99))); lit(o, 'cmd', 'db', 'wal'); o.on.kfk = down ? 'bad' : 1; o.rows.db = DB(true);
          o.rows.wal.tape = Array.from({ length: 5 }, (_, i) => [i < n ? (down ? 'espera' : 'lido') : '', i < n ? (down ? 'recv' : 'ok') : 'none']);
          o.rows.wal.rows = [[down ? 'o slot guarda o WAL' : 'Debezium continua', down ? 'hi' : 'acc']];
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], [down ? 'fora do ar' : 'recebendo de novo', down ? 'bad' : 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'DOIS TÓPICOS');
          bm(o, CAB.cdb, { on: true, flow: true }); bm(o, CAB.walk, { on: !down, flow: !down, tone: down ? 'bad' : '' });
          o.cnt = [['O CHECKOUT', 'continua'], ['O SLOT', down ? `guarda ${n}` : 'esvaziando', 'dim'], ['PERDIDOS', '0', 'dim']];
          o.res = down ? [['o comando nem percebe', 'acc']] : [['nada se perdeu', 'acc']];
          if (down) T(o, [742, 226, 40], 'Kafka fora', 'bad'); } },
      { id: 'update', dur: 6, title: 'O pagamento vira um UPDATE: op = u', yk: '20:12:01.100',
        code: ["UPDATE pedidos SET status = 'pago'", ' WHERE id = 1056;   -- 20:12:01.100', 'loja.public.pedidos', '  {"id":1056,"status":"pago","op":"u"}', 'op: c criou · u atualizou · d apagou · r snapshot'],
        story: 'Às <b>20:12:01.100</b> o pagamento passa, e o <code>pedidos</code> muda o status do 1056 com um <code>UPDATE</code>. No log isso é mais uma linha; no tópico <code>loja.public.pedidos</code>, mais uma mensagem, agora com <code>op = u</code>. Os quatro valores do <code>op</code>: <code>c</code> criou, <code>u</code> atualizou, <code>d</code> apagou e <code>r</code>, leitura do <i>snapshot</i> inicial.',
        look: 'Uma célula nova, "ped u", entra na fita e corre para o tópico de pedidos.',
        key: 'O op diz o que aconteceu com a linha: c, u, d ou r.',
        f(o, t) { const f = lin(t, 1, 3.2, 0, 1), inK = f >= 1; lit(o, 'cmd', 'db', 'wal'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'acc', 'pago'); o.rows.wal.tape = [['…', 'none'], ['COMMIT', 'ok'], ['BEGIN', 'ok'], ['ped u', t > 0.6 ? 'ok' : 'none'], ['COMMIT', t > 0.8 ? 'ok' : 'none']];
          o.rows.wal.rows = [['UPDATE do 1056', 'hi']]; o.rows.doc = DOC1();
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'dim'], [inK ? '  1056 · pago · op u' : '', 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'DOIS TÓPICOS');
          bm(o, CAB.walk, { on: !inK }); pk(o, WAY.wal.slice(2), f, 'pedidos · u');
          o.cnt = [['op', 'u'], ['STATUS', 'pago', 'dim'], ['RELÓGIO', '20:12:01.100', 'dim']];
          o.res = inK ? [['o tópico tem o u do 1056', 'acc']] : []; } },
      { id: 'ignora-u', dur: 7, title: 'E se der errado: o handler ignora o u', yk: 'cdc_handler.go · linhas 66 a 72',
        code: ['if event.Op != "c" && event.Op != "r" {', '  log.Printf("Ignorando operação %s …")', '  return nil', '}', 'o u do 1056 é descartado'],
        story: 'Lido no código do laboratório: o <code>cdc_handler.go</code> só continua para <code>c</code> e <code>r</code>; para qualquer outro <code>op</code>, loga "Ignorando operação" e volta. O <code>u</code> do 1056 chega e é <b>descartado</b>, e a tela da Lena mostra <code>criado</code> para sempre, mesmo depois de pago e enviado.',
        look: 'A mensagem com op = u chega ao meus-pedidos e o bloco fica vermelho: o status continua "criado".',
        key: 'Um handler de CDC que ignora u e d deixa a tela velha para sempre.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), bad = f >= 1; lit(o, 'db', 'kfk'); o.rows.db = DB(true, 'acc', 'pago');
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'dim'], ['  1056 · pago · op u', 'acc']], null, 'DOIS TÓPICOS');
          o.rows.wal.tape = [['ped u', 'ok']]; o.rows.wal.rows = [['UPDATE do 1056', 'dim']];
          o.on.doc = bad ? 'bad' : 0; o.rows.doc = bad ? DOC(['1056 · criado · 114,80', 'bad'], ['op u ignorado', 'bad'], ['o banco diz: pago', 'dim']) : DOC1();
          bm(o, CAB.kdoc, { on: !bad, tone: bad ? 'bad' : '' }); pk(o, WAY.kdoc, f, 'op u');
          o.cnt = [['O BANCO DIZ', 'pago'], ['A TELA DIZ', bad ? 'criado' : '…', bad ? 'bad' : 'dim'], ['PROCESSA', 'só c e r', 'bad']];
          o.res = bad ? [['"Ignorando operação u"', 'bad'], ['a tela fica velha para sempre', 'bad']] : [];
          if (bad) T(o, TF(742), 'criado para sempre', 'bad'); } },
      { id: 'le-escrita', dur: 8, title: 'E se der errado: o handler volta ao banco de escrita', yk: 'cdc_handler.go · linhas 109 a 123',
        code: ['getMedico(…)                 → banco de escrita', 'getPaciente(…)               → banco de escrita', 'getMedicamentosPrescricao(…) → banco de escrita', '3 consultas por evento', 'a leitura depende da escrita de novo'],
        story: 'Para completar a linha que recebeu, o handler chama <code>getMedico</code>, <code>getPaciente</code> e <code>getMedicamentosPrescricao</code>: <b>três consultas ao banco de escrita</b> por evento. O lado da leitura volta a depender do lado da escrita, justamente o que o CQRS queria separar; se o banco do comando fica lento, o modelo de leitura atrasa junto. E o conector usa <code>decimal.handling.mode: double</code>, dinheiro em ponto flutuante: por isso a loja guarda centavos inteiros.',
        look: 'Um cabo vermelho volta do meus-pedidos ao banco loja, por fora do Kafka: três consultas a cada evento.',
        key: 'Se o modelo de leitura consulta o banco de escrita, os dois lados se acoplam de novo.',
        f(o, t) { const n = Math.min(3, Math.floor(lin(t, 0.6, 5.4, 0, 3.99))); lit(o, 'kfk'); o.on.doc = 'bad'; o.on.db = n ? 'bad' : 0; o.rows.db = DB(true);
          o.rows.db.rows.push([n ? `${n} consulta${n > 1 ? 's' : ''} do handler` : '', 'bad']);
          o.rows.kfk = KF([['loja.public.pedidos', 'hi'], ['  1056 · op c', 'acc'], ['loja.public.itens_pedido', 'hi']], null, 'DOIS TÓPICOS');
          o.rows.doc = DOC(['completa a linha', 'hi'], [n ? `get… ${n} de 3` : 'recebeu 1056 · op c', 'bad']);
          bm(o, CAB.back, { on: true, tone: 'bad' }); if (n < 3) pk(o, WAY.back, (lt * 0.7) % 1, ['getMedico', 'getPaciente', 'getMedicamentos…'][n], 'bad');
          o.cnt = [['CONSULTAS POR EVENTO', `${n}`, 'bad'], ['A QUEM', 'banco de escrita', 'bad'], ['DINHEIRO', 'double', 'dim']];
          o.res = n >= 3 ? [['a leitura depende da escrita', 'bad']] : [['consultando…', 'dim']];
          T(o, [455, 300, 30], 'de volta ao banco de escrita', 'bad'); } },
    ],
    outbox: [
      { id: 'tabela', dur: 6, title: 'A tabela outbox, no mesmo banco', yk: 'Outbox_Events (laboratório)',
        code: ['id · aggregate_type · aggregate_id', 'event_type · payload (JSON)', 'created_at · processed_at', 'published_at · error_message', 'retry_count'],
        story: 'A outbox muda onde o evento nasce: ele vira uma <b>linha</b> numa tabela do <b>mesmo banco</b> do pedido. A <code>Outbox_Events</code> do laboratório tem <code>aggregate_type</code>, <code>aggregate_id</code>, <code>event_type</code>, <code>payload</code> (o evento de negócio inteiro, em JSON), <code>created_at</code>, <code>processed_at</code>, <code>published_at</code>, <code>error_message</code> e <code>retry_count</code>. Um segundo processo, o <b>relay</b>, leva a tabela ao Kafka.',
        look: 'No banco loja, a tabela outbox aparece embaixo de pedidos e itens_pedido. No meio, o relay liga o banco ao Kafka.',
        key: 'Na outbox, o evento é um dado do mesmo banco.',
        f(o) { lit(o, 'db', 'relay');
          o.cnt = [['ESCRITAS DO COMANDO', '1 transação'], ['TABELAS', 'pedidos + outbox', 'dim'], ['QUEM PUBLICA', 'o relay', 'dim']];
          o.res = [['o evento mora no banco', 'acc']];
          T(o, [165, 224, 44], 'outbox', 'acc'); } },
      { id: 'transacao', dur: 7, title: 'INSERT pedidos + INSERT outbox + COMMIT', yk: 'test_decoding (PostgreSQL 14)', act: ['Tentar um pedido de teste', 'e dar ROLLBACK'],
        code: ['BEGIN 832', 'table public.pedidos: INSERT:', "  id[bigint]:1056 cliente_id[text]:'lena-77' …", 'table public.outbox: INSERT: id[bigint]:1', "  event_type[text]:'PedidoCriado' … e-1801", 'COMMIT 832'],
        story: '<code>BEGIN; INSERT INTO pedidos …1056…; INSERT INTO outbox …PedidoCriado e-1801…; COMMIT;</code>. Lida com o <code>test_decoding</code> do PostgreSQL, saiu <b>uma só transação</b>, <code>BEGIN 832 … COMMIT 832</code>, com as duas linhas dentro. Se o pedido entra, o evento entra junto, e o comando não fala com o Kafka.',
        look: 'As linhas do 1056 e a linha 1 da outbox acendem juntas no banco, no mesmo COMMIT.',
        key: 'Uma transação, dois dados: o pedido e o evento entram juntos.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'db');
          o.rows.db = ok ? DB(true, 'acc', 'criado', OUT1('new'), OUTST('new')) : DB(false, 'acc', 'criado', ['vazia', 'dim']);
          bm(o, CAB.cdb, { on: !ok }); pk(o, WAY.cdb, f, 'BEGIN … COMMIT');
          o.cnt = [['TRANSAÇÃO', ok ? '832' : 'aberta'], ['LINHAS', ok ? 'pedidos + outbox' : '…', 'dim'], ['NO KAFKA', 'nada ainda', 'dim']];
          o.res = ok ? [['BEGIN 832 … COMMIT 832', 'acc'], ['as duas linhas juntas', 'acc']] : []; } },
      { id: 'rollback', dur: 6, title: 'O ROLLBACK leva os dois', yk: 'O PEDIDO DE TESTE',
        code: ['BEGIN;', 'INSERT INTO pedidos … (teste);', 'INSERT INTO outbox … (teste);', 'ROLLBACK;', 'nas tabelas: nada · no log: nada'],
        story: 'Uma segunda tentativa, de um pedido de teste, terminou em <code>ROLLBACK</code>. Não ficou <b>nada</b>: nem nas tabelas, nem no fluxo decodificado do <code>test_decoding</code>. Não existe mais pedido sem evento nem evento sem pedido, porque não existem mais duas escritas.',
        look: 'As duas linhas de teste aparecem em vermelho e somem juntas; o relay não tem nada novo para levar.',
        key: 'Se a transação desfaz, os dois somem juntos.',
        f(o, t) { const gone = t > 2.6; lit(o, 'cmd', 'db'); o.on.cmd = gone ? 1 : 'bad';
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new'), ...(gone ? [OUTST('new')] : [['2 · teste · ROLLBACK', 'bad']]));
          if (!gone) o.rows.db.rows.splice(2, 0, ['teste · ROLLBACK', 'bad']);
          o.rows.cmd = act('pedidos', 'TESTE', ['BEGIN · 2 INSERT', 'hi'], ['ROLLBACK', 'bad'], [gone ? 'nada ficou' : 'desfazendo…', gone ? 'acc' : 'dim']);
          o.cnt = [['NAS TABELAS', gone ? 'nada' : '…'], ['NO LOG DECODIFICADO', gone ? 'nada' : '…', 'dim'], ['FANTASMAS', '0', 'dim']];
          o.res = gone ? [['os dois somem juntos', 'acc']] : [['ROLLBACK', 'bad']];
          if (!gone) T(o, TF(165), 'ROLLBACK', 'bad'); } },
      { id: 'relay', dur: 8, title: 'O relay olha a tabela a cada 2 s', yk: 'outbox_relay.go (laboratório)',
        code: ['a cada 2 s:', '  SELECT … WHERE processed_at IS NULL', '  LIMIT 100                (o lote)', '  PublishRaw("pedido-1056", payload)', '  UPDATE … processed_at, published_at', 'até 5 tentativas por evento'],
        story: 'O <code>outbox_relay.go</code> do laboratório olha a tabela a cada <b>2 s</b>, em lotes de <b>100</b>, com até <b>5</b> tentativas por evento. Ele pega o <code>e-1801</code>, publica no Kafka com a chave <code>pedido-1056</code> e depois marca a linha com <code>processed_at</code> e <code>published_at</code>. O preço do <i>poll</i>: <b>1 s em média e 2 s no pior caso</b> a mais no atraso do modelo de leitura.',
        look: 'O relógio do relay conta até 2 s; então a luz sai da outbox, passa pelo relay e chega ao Kafka e ao meus-pedidos. A linha da outbox fica marcada.',
        key: 'O relay transforma a tabela em eventos, com até 2 s de espera.',
        f(o, t) { const s = lin(t, 0.4, 3, 0, 2), f1 = lin(t, 3, 4.4, 0, 1), f2 = lin(t, 4.4, 5.4, 0, 1), inK = f1 >= 1, done = f2 >= 1, marked = t > 4.8;
          lit(o, 'db', 'relay'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1(marked ? 'pub' : 'new'), OUTST(marked ? 'pub' : 'new'));
          o.rows.relay = act('relay', 'POLL 2 s', [s < 2 ? `próximo poll em ${dec(2 - s)} s` : marked ? 'marcou: published_at' : 'publicando e-1801', s < 2 ? 'hi' : 'acc'], ['lote 100 · até 5 tentativas', 'dim']);
          if (inK) o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · chave pedido-1056', 'acc']], TAPE1('ok'));
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.dbrel, { on: f1 > 0 && !inK }); bm(o, CAB.relk, { on: f1 > 0 && !inK }); bm(o, CAB.kdoc, { on: inK && !done });
          pk(o, WAY.rel, f1, 'e-1801'); pk(o, WAY.kdoc, f2);
          o.cnt = [['ESPERA DO POLL', `${dec(s)} s`], ['MÉDIA', '1 s', 'dim'], ['PIOR CASO', '2 s', 'dim']];
          o.res = done ? [['o 1056 chegou à tela', 'acc'], ['depois do poll', 'dim']] : []; } },
      { id: 'cdc-outbox', dur: 7, title: 'O CDC lendo a própria outbox: milissegundos', yk: 'Debezium Outbox Event Router',
        code: ['colunas: id · aggregatetype · aggregateid', '         type · payload', 'roteia pelo aggregatetype → tópico', 'lê o WAL: sem poll', 'evento de negócio, latência de ms'],
        story: 'O segundo jeito tira o <i>poll</i>: o CDC lê a própria tabela <code>outbox</code> no WAL. O <i>Outbox Event Router</i> do Debezium espera as colunas <code>id</code>, <code>aggregatetype</code>, <code>aggregateid</code>, <code>type</code> e <code>payload</code> e roteia pelo <code>aggregatetype</code>. A latência cai de até 2 s para <b>milissegundos</b>, e o evento que sai é o <code>PedidoCriado</code> inteiro, de negócio, e não uma linha de <code>pedidos</code>.',
        look: 'O relay sai de cena; a fita do WAL sobe no meio e leva a linha da outbox direto ao Kafka.',
        key: 'CDC na outbox: evento de negócio, sem poll.',
        f(o, t) { hide(o, 'relay'); showX(o, 'wal'); o.beams = o.beams.filter(b => b.pts !== CAB.dbrel && b.pts !== CAB.relk); o.beams.push({ pts: CAB.dbwal }, { pts: CAB.walk });
          const f = lin(t, 1, 2.6, 0, 1), inK = f >= 1, f2 = lin(t, 2.6, 3.6, 0, 1), done = f2 >= 1; lit(o, 'db', 'wal'); if (inK) lit(o, 'kfk'); if (done) lit(o, 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new'), ['  aggregatetype = pedido', 'hi']);
          o.rows.wal = act('WAL', 'OUTBOX EVENT ROUTER', ['Debezium lê só a outbox', 'hi']); o.rows.wal.tapeLabel = 'LOG';
          o.rows.wal.tape = [['BEGIN', 'ok'], ['ped c', 'ok'], ['outbox c', 'ok'], ['COMMIT', 'ok']];
          if (inK) o.rows.kfk = KF([['tópico pedido', 'dim'], ['PedidoCriado e-1801', 'acc']], TAPE1('ok'));
          if (done) o.rows.doc = DOC1();
          bm(o, CAB.walk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done }); pk(o, WAY.wal, f, 'PedidoCriado'); pk(o, WAY.kdoc, f2);
          o.cnt = [['LATÊNCIA', 'ms'], ['POLL', 'nenhum', 'dim'], ['EVENTO', 'de negócio', 'dim']];
          o.res = done ? [['sem poll, e o evento de negócio', 'acc']] : []; } },
      { id: 'custo', dur: 8, title: 'E se der errado: a outbox escreve 7,6× mais WAL', yk: 'WAL POR PEDIDO (20.000 PEDIDOS)',
        code: ['sem outbox               359,6 B', '+ 2 INSERT na outbox   1.232,7 B   3,4×', '+ relay marca (UPDATE)  2.735,8 B   7,6×', '+ relay apaga (DELETE)  1.916,8 B   5,3×', 'a 30/s: 10,8 KB/s → 82,1 KB/s'],
        story: 'O artigo avisa que a outbox pode virar gargalo, e agora há número. Em 20.000 pedidos no PostgreSQL 14, o WAL por pedido foi de <b>359,6 B</b> sem outbox para <b>1.232,7 B</b> com os 2 <code>INSERT</code> na outbox, e para <b>2.735,8 B</b> quando o relay marca cada evento com <code>UPDATE</code>: <b>7,6×</b>. A 30 pedidos/s são <b>82,1 KB/s</b> (295,5 MB/h) em vez de 10,8 KB/s. Apagar com <code>DELETE</code> custa menos (1.916,8 B, 5,3×) e impede a tabela de crescer sem fim.',
        look: 'A fita do WAL ganha uma célula a cada parte da conta: o pedido, os 2 INSERT da outbox e o UPDATE do relay, que fica vermelho. O mostrador sobe de 359,6 para 2.735,8 bytes.',
        key: 'A outbox não é de graça: 5,3× a 7,6× o WAL por pedido.',
        f(o, t) { showX(o, 'wal'); const k = Math.floor(lin(t, 0.4, 5.4, 0, 2.99)), V = [359.6, 1232.7, 2735.8];
          lit(o, 'db', 'relay', 'wal'); if (k === 2) o.on.relay = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', OUT1(k === 2 ? 'pub' : 'new'), ['2 · PedidoPago · e-1802', k >= 1 ? 'acc' : 'dim'], [k === 2 ? '  marcadas: published_at' : '  processed_at IS NULL', k === 2 ? 'bad' : 'hi']);
          o.rows.wal = act('WAL', 'POR PEDIDO', [`${dec(V[k])} B`, k === 2 ? 'bad' : 'acc']); o.rows.wal.tapeLabel = 'WAL';
          o.rows.wal.tape = [['pedido', 'ok'], ['+outbox', k >= 1 ? 'ok' : 'none'], ['+UPDATE', k >= 2 ? 'bad' : 'none']];
          o.rows.relay = act('relay', 'MARCA', ['UPDATE … published_at', k === 2 ? 'bad' : 'dim'], ['DELETE custaria 1.916,8 B', 'dim']);
          o.cnt = [['WAL POR PEDIDO', `${dec(V[k])} B`, k === 2 ? 'bad' : ''], ['FATOR', ['1×', '3,4×', '7,6×'][k], k === 2 ? 'bad' : 'dim'], ['A 30 PEDIDOS/S', ['10,8 KB/s', '37,0 KB/s', '82,1 KB/s'][k], 'dim']];
          o.res = k === 2 ? [['7,6× o WAL · 295,5 MB/h', 'bad'], ['com DELETE: 5,3× · 207 MB/h', 'acc']] : [['somando…', 'dim']]; } },
    ],
    'relay-duplicado': [
      { id: 'publica', dur: 6, title: 'O relay publica o e-1801', yk: 'processarEvento · linha 138', act: ['Derrubar o relay', 'entre publicar e marcar'],
        code: ['SELECT … WHERE processed_at IS NULL', '  → id 3 · PedidoCriado · e-1801', '138  PublishRaw("pedido-1056", payload)', '154  marcarProcessado(3)', 'entre a 138 e a 154: uma janela'],
        story: 'O relay pega o evento 3 da outbox, o <code>PedidoCriado</code> <code>e-1801</code> do 1056, e o publica no Kafka (linha 138 do <code>outbox_relay.go</code>) com a chave <code>pedido-1056</code>. Só <b>depois</b>, na linha 154, chama <code>marcarProcessado</code>, um <code>UPDATE</code> que grava <code>processed_at</code> e <code>published_at</code>. Entre as duas linhas existe uma janela.',
        look: 'A luz sai da linha 3 da outbox, passa pelo relay e chega ao Kafka. A linha ainda não está marcada.',
        key: 'O relay publica primeiro e marca depois.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), inK = f >= 1; lit(o, 'db', 'relay'); if (inK) lit(o, 'kfk');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new', 3), OUTST('new'));
          o.rows.relay = act('relay', 'processarEvento', [inK ? '138 publicou' : '138 publicando…', 'acc'], ['154 marcarProcessado: ainda não', 'dim']);
          if (inK) o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · chave pedido-1056', 'acc']], TAPE1('ok'));
          bm(o, CAB.dbrel, { on: !inK }); bm(o, CAB.relk, { on: !inK }); pk(o, WAY.rel, f, 'e-1801');
          o.cnt = [['PUBLICADO', inK ? 'e-1801' : '…'], ['MARCADO', 'ainda não', 'dim'], ['CHAVE', 'pedido-1056', 'dim']];
          o.res = inK ? [['o Kafka tem o e-1801', 'acc'], ['a outbox ainda não sabe', 'dim']] : []; } },
      { id: 'cai', dur: 6, title: 'O relay cai antes de marcar', yk: 'ENTRE A 138 E A 154',
        code: ['138  PublishRaw(…)        ok: e-1801 no Kafka', '     o relay morre aqui', '154  marcarProcessado(3)   nunca roda', 'outbox: id 3 · processed_at IS NULL', 'para o banco, o evento não saiu'],
        story: 'O relay publica o <code>e-1801</code> e <b>cai</b> antes da linha 154. O Kafka já tem o evento, e o <code>meus-pedidos</code> já pôs o 1056 na lista. Mas, para o banco, a linha 3 da outbox continua com <code>processed_at</code> vazio: o evento "não saiu".',
        look: 'O relay fica vermelho. O Kafka tem um e-1801; a linha 3 da outbox continua acesa como pendente.',
        key: 'Publicar e marcar são duas escritas: o relay tem a sua própria janela.',
        f(o, t) { const f = lin(t, 0.4, 1.6, 0, 1), dead = t > 1.8; lit(o, 'db', 'kfk'); if (f >= 1) lit(o, 'doc'); o.on.relay = dead ? 'bad' : 1;
          o.rows.db = DB(true, 'dim', 'criado', OUT1('new', 3), OUTST('new'));
          o.rows.relay = act('relay', 'processarEvento', ['138 publicou', 'acc'], [dead ? 'caiu antes da 154' : '154 …', dead ? 'bad' : 'dim']);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · 1 vez', 'acc']], TAPE1('ok'));
          if (f >= 1) o.rows.doc = DOC1();
          pk(o, WAY.kdoc, f);
          o.cnt = [['NO KAFKA', 'e-1801'], ['NA OUTBOX', 'pendente', 'bad'], ['O RELAY', dead ? 'caiu' : '…', dead ? 'bad' : 'dim']];
          o.res = dead ? [['publicado, mas não marcado', 'bad']] : [];
          if (dead) T(o, [455, 250, 34], 'relay caiu', 'bad'); } },
      { id: 'duplica', dur: 7, title: 'Ao voltar, publica de novo: o e-1801 sai duas vezes', yk: 'PELO MENOS UMA VEZ',
        code: ['o relay volta', 'SELECT … WHERE processed_at IS NULL', '  → id 3 de novo', 'PublishRaw(e-1801)   -- 2ª vez', 'handler: INSERT sem ON CONFLICT'],
        story: 'Quando o relay volta, o evento 3 ainda está pendente, e ele o <b>publica de novo</b>. A entrega da outbox é <b>pelo menos uma vez</b>: o evento nunca se perde, mas pode sair duplicado. O consumidor do laboratório não está preparado: o handler faz <code>INSERT</code> sem <code>ON CONFLICT</code> (aula 5), e o 1056 aparece <b>duas vezes</b> na lista da Lena.',
        look: 'Dois e-1801 na fita do Kafka; o meus-pedidos fica vermelho, com o 1056 duas vezes.',
        key: 'A outbox entrega pelo menos uma vez: duplicata é esperada.',
        f(o, t) { const f1 = lin(t, 0.6, 2.4, 0, 1), inK = f1 >= 1, f2 = lin(t, 2.6, 3.6, 0, 1), done = f2 >= 1, marked = t > 3; lit(o, 'db', 'relay', 'kfk');
          o.rows.db = DB(true, 'dim', 'criado', OUT1(marked ? 'pub' : 'new', 3), OUTST(marked ? 'pub' : 'new'));
          o.rows.relay = act('relay', 'VOLTOU', ['id 3 ainda pendente', 'hi'], [inK ? 'publicou de novo' : 'publicando…', inK ? 'bad' : 'hi']);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], [inK ? 'e-1801 · 2 vezes' : 'e-1801 · 1 vez', inK ? 'bad' : 'acc']], [['e-1801', 'ok'], ['e-1801', inK ? 'bad' : f1 > 0 ? 'recv' : 'none'], ['', 'none']]);
          o.rows.doc = done ? DOC(['1056 · criado · 114,80', 'bad'], ['1056 · criado · 114,80', 'bad'], ['1055 · 34,90', 'dim']) : DOC1();
          o.on.doc = done ? 'bad' : 1;
          bm(o, CAB.dbrel, { on: !inK }); bm(o, CAB.relk, { on: !inK }); bm(o, CAB.kdoc, { on: inK && !done, tone: 'bad' });
          pk(o, WAY.rel, f1, 'e-1801 de novo'); pk(o, WAY.kdoc, f2, '', 'bad');
          o.cnt = [['NO KAFKA', inK ? '2 × e-1801' : '1 × e-1801', inK ? 'bad' : ''], ['NA LISTA DA LENA', done ? '1056 duas vezes' : '1056', done ? 'bad' : 'dim'], ['ENTREGA', 'pelo menos 1 vez', 'dim']];
          o.res = done ? [['duplicata na tela', 'bad'], ['INSERT sem ON CONFLICT', 'bad']] : []; } },
      { id: 'idempotente', dur: 6, title: 'A defesa: o consumidor guarda o evento_id', yk: 'CONSUMIDOR IDEMPOTENTE',
        code: ['recebe e-1801', '  já aplicado? não → aplica, guarda e-1801', 'recebe e-1801 de novo', '  já aplicado? sim → ignora', 'resultado: o 1056 uma vez'],
        story: 'A duplicata é parte do padrão, então a defesa mora no consumidor: ele guarda o <code>evento_id</code> de cada evento aplicado (ou aplica só se a <code>versao</code> for maior). O segundo <code>e-1801</code> chega, já está na lista de aplicados e é ignorado. A lista da Lena tem o 1056 uma vez.',
        look: 'O segundo e-1801 chega ao meus-pedidos e não muda nada; o 1056 aparece uma vez só.',
        key: 'Pelo menos uma vez + consumidor idempotente = efeito de uma vez só.',
        f(o, t) { const f = lin(t, 0.6, 2, 0, 1), done = f >= 1; lit(o, 'db', 'relay', 'kfk', 'doc');
          o.rows.db = DB(true, 'dim', 'criado', OUT1('pub', 3), OUTST('pub'));
          o.rows.relay = act('relay', 'POLL 2 s', ['id 3 marcado', 'dim']);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], ['e-1801 · 2 vezes', 'hi']], [['e-1801', 'ok'], ['e-1801', 'ok'], ['', 'none']]);
          o.rows.doc = DOC(['1056 · criado · 114,80', 'acc'], [done ? 'e-1801 já aplicado: ignora' : 'aplicados: e-1801', done ? 'acc' : 'dim']);
          pk(o, WAY.kdoc, f, 'e-1801 (2ª)');
          o.cnt = [['NA LISTA DA LENA', '1056 uma vez'], ['DUPLICATAS', done ? 'ignorada' : '…', 'dim'], ['GUARDA', 'evento_id', 'dim']];
          o.res = done ? [['idempotente: a duplicata não muda nada', 'acc']] : []; } },
      { id: 'dois-relays', dur: 7, title: 'Dois relays com SKIP LOCKED: lotes diferentes', yk: 'FOR UPDATE SKIP LOCKED (PostgreSQL 14)',
        code: ['SELECT … WHERE publicado_em IS NULL', '  ORDER BY id LIMIT 4', '  FOR UPDATE SKIP LOCKED', 'relay A → ids 1, 2, 3, 4', 'relay B → ids 5, 6, 7, 8   (nada em comum)'],
        story: 'Para dar vazão, a loja sobe um segundo relay. Com <code>SELECT … WHERE publicado_em IS NULL ORDER BY id LIMIT 4 FOR UPDATE SKIP LOCKED</code>, cada relay trava as linhas que pegou e pula as que o outro travou. No teste, o relay A pegou os ids <b>1, 2, 3 e 4</b> e o B, ao mesmo tempo, <b>5, 6, 7 e 8</b>: nada em comum.',
        look: 'O segundo relay aparece embaixo do primeiro. Cada um puxa um lote diferente da outbox.',
        key: 'SKIP LOCKED divide o trabalho entre relays sem pegar a mesma linha.',
        f(o) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2, on: true, flow: true }, { pts: CAB.rel2k }); bm(o, CAB.dbrel, { on: true, flow: true }); lit(o, 'db', 'relay', 'relay2');
          o.rows.db = DB(true, 'dim', 'criado', ['1–4 · relay A', 'acc'], ['  3 · PedidoCriado · e-1801', 'acc'], ['5–8 · relay B', 'hi'], ['  5 · PedidoPago · e-1802', 'hi']);
          o.rows.relay = act('relay A', 'SKIP LOCKED', ['ids 1, 2, 3, 4', 'acc'], ['tem o PedidoCriado (3)', 'dim']);
          o.rows.relay2 = act('relay B', 'SKIP LOCKED', ['ids 5, 6, 7, 8', 'acc'], ['tem o PedidoPago (5)', 'dim']);
          o.cnt = [['RELAY A', '1–4'], ['RELAY B', '5–8', 'dim'], ['EM COMUM', 'nada', 'dim']];
          o.res = [['lotes diferentes, sem repetir', 'acc']]; } },
      { id: 'ordem', dur: 7, title: 'E se der errado: o PedidoPago chega antes do PedidoCriado', yk: 'ORDEM TROCADA',
        code: ['relay A: id 3   PedidoCriado   e-1801', 'relay B: id 5   PedidoPago     e-1802', 'o B publica primeiro', 'meus-pedidos: pago antes de existir', 'defesa: chave pedido_id + versao'],
        story: 'O <code>PedidoCriado</code> do 1056 é o id 3, no lote do relay A; o <code>PedidoPago</code> (<code>e-1802</code>) é o id 5, no lote do B. Os dois relays correm em paralelo, e o 5 pode chegar <b>primeiro</b>: o <code>meus-pedidos</code> recebe o pagamento de um pedido que ainda não tem. Duas defesas: a <b>chave do tópico</b> é o <code>pedido_id</code> (mesma partição, mesma ordem de publicação) e o consumidor confere a <code>versao</code> (módulo 17, aula 4).',
        look: 'Duas luzes saem dos dois relays; a do B (e-1802) chega antes ao Kafka, e o meus-pedidos fica vermelho.',
        key: 'Com mais de um relay, a ordem entre eventos do mesmo pedido não é garantida.',
        f(o, t) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2 }, { pts: CAB.rel2k }); const fB = lin(t, 0.4, 2.2, 0, 1), fA = lin(t, 1.4, 3.8, 0, 1), fd = lin(t, 2.2, 3.2, 0, 1), bad = fd >= 1;
          lit(o, 'db', 'relay', 'relay2'); if (fB >= 1) lit(o, 'kfk'); if (bad) o.on.doc = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', ['1–4 · relay A', 'dim'], ['  3 · PedidoCriado · e-1801', 'acc'], ['5–8 · relay B', 'dim'], ['  5 · PedidoPago · e-1802', 'acc']);
          o.rows.relay = act('relay A', 'id 3', [fA >= 1 ? 'publicou e-1801' : 'publicando e-1801…', 'hi']);
          o.rows.relay2 = act('relay B', 'id 5', [fB >= 1 ? 'publicou e-1802 antes' : 'publicando e-1802…', fB >= 1 ? 'bad' : 'hi']);
          o.rows.kfk = KF([['tópico pedidos', 'dim'], ['chave: pedido-1056', 'dim']], [['e-1802', fB >= 1 ? 'bad' : 'none'], ['e-1801', fA >= 1 ? 'ok' : 'none'], ['', 'none']]);
          o.rows.doc = bad ? DOC(['PedidoPago de um 1056', 'bad'], ['que a lista não tem', 'bad'], ['1055 · 34,90', 'dim']) : DOC();
          bm(o, CAB.dbrel, { on: fA > 0 && fA < 1 }); bm(o, CAB.relk, { on: fA > 0 && fA < 1 }); bm(o, CAB.dbrel2, { on: fB < 1 }); bm(o, CAB.rel2k, { on: fB < 1, tone: 'bad' });
          pk(o, WAY.rel2, fB, 'e-1802', 'bad'); pk(o, WAY.rel, fA, 'e-1801'); pk(o, WAY.kdoc, fd, '', 'bad');
          o.cnt = [['CHEGOU PRIMEIRO', fB >= 1 ? 'e-1802' : '…', fB >= 1 ? 'bad' : ''], ['DEPOIS', fA >= 1 ? 'e-1801' : '…', 'dim'], ['DEFESA', 'pedido_id + versao', 'dim']];
          o.res = bad ? [['pago antes de existir', 'bad'], ['confira a versao', 'acc']] : [];
          if (bad) T(o, TF(742), 'ordem trocada', 'bad'); } },
      { id: 'sem-skip', dur: 8, title: 'E se der errado: o relay do laboratório não usa SKIP LOCKED', yk: 'outbox_relay.go · linhas 99 a 107',
        code: ['SELECT id, aggregate_type, … FROM Outbox_Events', ' WHERE processed_at IS NULL', '   AND retry_count < $1', ' ORDER BY created_at ASC LIMIT $2', '-- sem FOR UPDATE SKIP LOCKED'],
        story: 'Lido no código: o <code>SELECT</code> do relay do laboratório (linhas 99 a 107) <b>não tem</b> <code>FOR UPDATE SKIP LOCKED</code>. Com um relay só, tudo bem. Com dois, os dois leem as <b>mesmas</b> linhas pendentes, e cada evento sai <b>em dobro</b>: o <code>e-1801</code> duas vezes, o <code>e-1802</code> duas vezes. Ou se roda um relay só, ou se põe o <code>SKIP LOCKED</code>; e o consumidor continua tendo de ser idempotente.',
        look: 'Os dois relays puxam as mesmas linhas da outbox, e a fita do Kafka fica com cada evento repetido, em vermelho.',
        key: 'Sem SKIP LOCKED, dois relays publicam os mesmos eventos.',
        f(o, t) { showX(o, 'relay2'); o.beams.push({ pts: CAB.dbrel2 }, { pts: CAB.rel2k }); const n = Math.min(4, Math.floor(lin(t, 0.6, 4.6, 0, 4.99)));
          lit(o, 'db', 'kfk'); o.on.relay = 'bad'; o.on.relay2 = 'bad';
          o.rows.db = DB(true, 'dim', 'criado', ['1–8 · os dois relays', 'bad'], ['  3 · PedidoCriado · e-1801', 'hi'], ['  5 · PedidoPago · e-1802', 'hi']);
          o.rows.relay = act('relay A', 'SEM SKIP LOCKED', ['lê ids 1 a 8', 'bad']); o.rows.relay2 = act('relay B', 'SEM SKIP LOCKED', ['lê ids 1 a 8', 'bad']);
          const tp = [['e-1801', 'ok'], ['e-1801', 'bad'], ['e-1802', 'ok'], ['e-1802', 'bad']];
          o.rows.kfk = KF([['tópico pedidos', 'dim'], [n >= 4 ? 'cada evento 2 vezes' : 'publicando…', n >= 2 ? 'bad' : 'hi']], tp.map((c, i) => i < n ? c : ['', 'none']));
          bm(o, CAB.dbrel, { on: true, flow: true, tone: 'bad' }); bm(o, CAB.dbrel2, { on: true, flow: true, tone: 'bad' }); bm(o, CAB.relk, { on: true, tone: 'bad' }); bm(o, CAB.rel2k, { on: true, tone: 'bad' });
          o.cnt = [['DUPLICATAS', `${Math.floor(n / 2)}`, n >= 2 ? 'bad' : ''], ['LINHAS EM COMUM', '1 a 8', 'bad'], ['NO LAB', 'sem SKIP LOCKED', 'bad']];
          o.res = n >= 4 ? [['os dois relays publicam tudo', 'bad'], ['1 relay, ou SKIP LOCKED', 'acc']] : [['…', 'dim']];
          T(o, [455, 250, 34], 'as mesmas linhas', 'bad'); } },
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
    'dual-write': () => `<table class="h3-sum"><tr><th>ordem</th><th>se a 2ª falha</th><th>efeito</th></tr><tr${on_(3, 4)}><td>commit e depois publish</td><td>broker fora</td><td>pedido sem evento: 108/h a 0,1%</td></tr><tr${on_(5)}><td>publish e depois commit</td><td><code>COMMIT</code> recusado</td><td>evento sem pedido: fantasma e cobrança indevida</td></tr><tr><td>publish dentro da transação</td><td>broker lento</td><td>locks presos; ainda não é atômico</td></tr><tr><td>outbox (aula 10)</td><td>relay fora</td><td>o evento espera na tabela; nada se perde</td></tr></table><li>A conta: 30 pedidos/s × 3.600 s × 0,001 = <b>108 pedidos por hora</b> no banco sem evento (exemplo de 0,1% de falha da publicação)</li><li>O evento <code>e-1801</code> <code>PedidoCriado</code> pesa <b>336 B</b> em JSON compacto; dinheiro em centavos (<code>"total_centavos":11480</code>)</li><li>Pedido 1056: 1 gato de pelúcia 79,90 + 1 caneca azul 19,90 + frete Recife 15,00 = <b>114,80</b>; <code>COMMIT</code> às 20:12:00.004</li><li>Confluent, "The Dual-Write Problem": a transação do banco não cobre o broker</li>`,
    'falha-dual': () => `<li><code>hospital-cqrs-sql/internal/commands/handler.go</code> (lido no código, não executado):</li><table class="h3-sum"><tr><th>linha</th><th>o que faz</th></tr><tr${on_(0, 2)}><td>51</td><td>grava a prescrição no banco</td></tr><tr${on_(0)}><td>52–53</td><td>se a gravação falha, devolve erro e não publica</td></tr><tr${on_(0, 1)}><td>78</td><td><code>h.producer.Publish(ctx, eventKey, event)</code></td></tr><tr${on_(1)}><td>79</td><td><code>log.Printf("AVISO: Erro ao publicar evento, mas prescrição foi criada: %v", err)</code></td></tr><tr${on_(1)}><td>81</td><td>"O evento poderá ser republicado posteriormente" (não há código que republique)</td></tr><tr${on_(1)}><td>85</td><td><code>return prescricao, nil</code>: sucesso</td></tr></table><li>O <code>ARCHITECTURE_COMPARISON.md</code> do laboratório do CDC marca "Publica evento no Kafka (fora da transação!)" como o problema</li><li><b>Correção ao artigo:</b> o "padrão Dual-Write" com <code>BEGIN … publica … COMMIT</code> e <i>rollback</i> não é atômico; é o problema, não a solução</li><li>Atômico entre PostgreSQL e Kafka exigiria <i>two-phase commit</i>, que bloqueia se o coordenador cai (Fowler) e que o Kafka não oferece</li>`,
    cdc: () => `<li><code>hospital-cqrs-cdc/postgres-connector.json</code>: <code>plugin.name: pgoutput</code>, <code>slot.name: hospital_cdc_slot</code>, <code>snapshot.mode: initial</code>, <code>decimal.handling.mode: double</code>, <i>transform</i> <code>ExtractNewRecordState</code></li><table class="h3-sum"><tr><th>op</th><th>significa</th><th>o handler do lab</th></tr><tr${on_(2)}><td>c</td><td>criou</td><td>processa</td></tr><tr${on_(4, 5)}><td>u</td><td>atualizou</td><td><b>ignora</b></td></tr><tr><td>d</td><td>apagou</td><td><b>ignora</b></td></tr><tr><td>r</td><td>leitura do <i>snapshot</i></td><td>processa</td></tr></table><li>Na loja: tópicos <code>loja.public.pedidos</code> e <code>loja.public.itens_pedido</code>; no laboratório, <code>hospital_db.public.prescricoes</code> e <code>…prescricao_medicamentos</code></li><li><code>cdc_handler.go</code>: linhas 66–72 só seguem para <code>c</code> e <code>r</code>; linhas 109–123 chamam <code>getMedico</code>, <code>getPaciente</code>, <code>getMedicamentosPrescricao</code> no banco de escrita (lido no código)</li><li>Custos que o README do laboratório admite: evento técnico, acoplamento ao esquema, mais peças (Debezium, slot, WAL), latência de ms a segundos</li><li>Slot esquecido: o PostgreSQL retém o WAL inteiro; a conta de ~23 dias a 108 MB/h do módulo 17</li>`,
    outbox: () => `<li><code>test_decoding</code> (PostgreSQL 14.24, 20/10/2026): <code>BEGIN 832</code> · <code>table public.pedidos: INSERT: id[bigint]:1056 cliente_id[text]:'lena-77' …</code> · <code>table public.outbox: INSERT: id[bigint]:1 aggregate_type[text]:'pedido' aggregate_id[text]:'1056' event_type[text]:'PedidoCriado' payload[jsonb]:'{…"evento_id": "e-1801"…}'</code> · <code>COMMIT 832</code>; o pedido de teste com <code>ROLLBACK</code> não deixou nada</li><table class="h3-sum"><tr><th>WAL por pedido (20.000)</th><th>bytes</th><th>a 30/s</th></tr><tr${on_(5)}><td>sem outbox</td><td>359,6</td><td>10,8 KB/s · 38,8 MB/h</td></tr><tr${on_(5)}><td>+ 2 INSERT na outbox</td><td>1.232,7</td><td>37,0 KB/s</td></tr><tr${on_(5)}><td>+ relay marca (UPDATE)</td><td>2.735,8 (7,6×)</td><td>82,1 KB/s · 295,5 MB/h</td></tr><tr><td>+ relay apaga (DELETE)</td><td>1.916,8 (5,3×)</td><td>57,5 KB/s · 207 MB/h</td></tr></table><li>Relay do laboratório (<code>outbox_relay.go</code>): poll de <b>2 s</b>, lote de <b>100</b>, até <b>5</b> tentativas; +1 s em média, +2 s no pior caso</li><li>Debezium <i>Outbox Event Router</i>: colunas <code>id</code>, <code>aggregatetype</code>, <code>aggregateid</code>, <code>type</code>, <code>payload</code>; roteia pelo <code>aggregatetype</code></li><li>No teste de WAL, o <code>PedidoCriado</code> pesa 326 B em <code>jsonb</code> e o <code>PedidoPago</code> 63 B</li>`,
    'relay-duplicado': () => `<table class="h3-sum"><tr><th>linha (outbox_relay.go)</th><th>o que faz</th></tr><tr${on_(6)}><td>99–107</td><td><code>SELECT … WHERE processed_at IS NULL AND retry_count &lt; $1 ORDER BY created_at ASC LIMIT $2</code>, <b>sem</b> <code>FOR UPDATE SKIP LOCKED</code></td></tr><tr${on_(0, 1, 2)}><td>138</td><td><code>PublishRaw(ctx, eventKey, payload)</code>, chave <code>aggregate_type-aggregate_id</code> = <code>pedido-1056</code></td></tr><tr><td>148–151</td><td>atualiza as <i>views</i> localmente; se falhar, só loga</td></tr><tr${on_(0, 1)}><td>154</td><td><code>marcarProcessado</code>: <code>UPDATE</code> de <code>processed_at</code> e <code>published_at</code></td></tr></table><li><code>SKIP LOCKED</code> medido (PostgreSQL 14.24): <code>SELECT … WHERE publicado_em IS NULL ORDER BY id LIMIT 4 FOR UPDATE SKIP LOCKED</code> → relay A <b>1, 2, 3, 4</b>; relay B <b>5, 6, 7, 8</b></li><li>Nos ids desse teste, o <code>PedidoCriado</code> do 1056 (<code>e-1801</code>) é o 3 e o <code>PedidoPago</code> (<code>e-1802</code>, 20:12:01.100) é o 5</li><li>Entrega <b>pelo menos uma vez</b>: o consumidor tem de ser idempotente (<code>evento_id</code>); o handler do <code>hospital-cqrs-sql</code> faz <code>INSERT</code> sem <code>ON CONFLICT</code> (lido no código)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo (fazer o 1056, derrubar o broker, dar ROLLBACK, derrubar o relay): avança para o passo seguinte
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
  function readout() { if (active !== 'escrita') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
