// Figura 3D (iso-glow): do estado aos fatos. À esquerda a tabela pedidos (atrás) e o serviço pedidos (na frente); no meio o agregado
// e o publisher; à direita os streams pedido-1047 e estoque-GATO-042 como trilhos com blocos numerados (v1…v4) e o bus na frente.
// Atrás, o mostrador (a conta do passo, o SQL ou o erro, e o resultado).
// Cenários (botões e ?mode=tabela-x-eventos|agregado|store|bus; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/event-sourcing-brief.md): o 1047 do módulo 6 (e-501, e-502, e-504, e-505 em
// pedido-1047; e-503 em estoque-GATO-042, 3 → 2), 14:15 → pago v2, os erros reais do PostgreSQL 14 (Concurrency conflict,
// eventos_evento_id_key, eventos_stream_versao), a corrida A/B (PgSleep × Lock/transactionid) e a publicação depois do commit do lab do autor.
FIGS3D.push({ id: 'eventos', name: 'From state to facts', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return a + (b ? '.' + b : ''); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['tabela-x-eventos', 'agregado', 'store', 'bus'];
  const SCNAME = { 'tabela-x-eventos': 'Table', agregado: 'Aggregate', store: 'Store', bus: 'Bus' };
  const SCFULL = { 'tabela-x-eventos': 'Table × events', agregado: 'The aggregate', store: 'The Event Store', bus: 'Publisher and bus' };
  const AULA = { 'tabela-x-eventos': 'aula-1-introducao', agregado: 'aula-3-agregados', store: 'aula-4-event-store', bus: 'aula-5-event-bus-e-publishers' };
  let clk = 0, sc = 'tabela-x-eventos', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-eventos3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17, ZT = 34;
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
  block('tbl', 40, 40, 250, 150, 24); block('cmd', 40, 226, 250, 96, 20);
  block('agg', 320, 150, 240, 130, 30); block('pub', 320, 316, 240, 84, 16, SMALL);
  block('store', 590, 40, 290, 140, 10, SMALL); block('stk', 590, 212, 290, 94, 10, SMALL); block('bus', 590, 316, 290, 104, 12, SMALL);
  const NAMES = Object.keys(B);
  // os eventos: blocos sobre os trilhos dos streams (p = pedido-1047, k = estoque-GATO-042), 5 vagas por trilho
  const EW = 52, EG = 5.5, EH = 12;
  const RAIL = { p: { x: 595, y: 46, z: PL + 10, d: 100 }, k: { x: 595, y: 218, z: PL + 10, d: 56 } };
  const pool = s => Array.from({ length: 7 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    const d = RAIL[s].d; rbox(0, 0, 0, EW, d, EH, 3, mat, g); const top = faceCanvas('top', 1.5, 1.5, EH, EW - 3, d - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, key: '', at: null }; });
  const EV = { p: pool('p'), k: pool('k') };
  // a fila de comandos do agregado grande demais: cartões vermelhos empilhados
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz: comandos, eventos e publicações
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
  const TF = x => [x, 436, 30];   // balão na faixa livre da frente da prancha

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const CAB = {
    tbl: P3([[165, 226], [165, 190]]),                                   // pedidos → tabela (INSERT/UPDATE)
    st: P3([[290, 240], [440, 240], [440, 110], [590, 110]]),            // pedidos → stream pedido-1047 (sem o agregado)
    ca: P3([[290, 252], [320, 252]]),                                    // pedidos → agregado (o comando)
    as: P3([[560, 165], [590, 165]]),                                    // agregado → pedido-1047
    ak: P3([[560, 250], [590, 250]]),                                    // agregado → estoque-GATO-042
    sp: P3([[590, 172], [575, 172], [575, 358], [560, 358]]),            // Store → publisher
    pb: P3([[560, 384], [590, 384]]),                                    // publisher → bus
    bk: P3([[735, 316], [735, 306]]),                                    // bus → estoque (o consumidor grava o e-503)
  };
  const slot = (s, i) => [RAIL[s].x + i * (EW + EG) + EW / 2, RAIL[s].y + RAIL[s].d / 2];
  // caminhos dos pontos de luz até uma vaga do trilho
  const WAY = {
    tbl: P3([[165, 274, ZT], [165, 226], [165, 190], [165, 130, 40]]),
    st: i => P3([[200, 274, ZT], [290, 240], [440, 240], [440, 110], [590, 110], [...slot('p', i), 36]]),
    ca: P3([[200, 274, ZT], [290, 252], [320, 252], [440, 215, 46]]),
    as: i => P3([[440, 215, 46], [560, 165], [590, 165], [...slot('p', i), 36]]),
    ak: i => P3([[440, 215, 46], [560, 250], [590, 250], [...slot('k', i), 36]]),
    sp: i => P3([[...slot('p', i), 30], [590, 172], [575, 172], [575, 358], [560, 358], [440, 358, 30]]),
    pb: P3([[440, 358, 30], [560, 384], [590, 384], [700, 384, 26]]),
    bk: i => P3([[735, 384, 26], [735, 316], [735, 306], [...slot('k', i), 36]]),
  };
  // um ponto de luz andando num caminho: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const small = (d, fs = 13, lh = 17.5, y0 = 39) => { d.fs = fs; d.lh = lh; d.y0 = y0; return d; };
  // os eventos do 1047 (stream pedido-1047) e do gato (estoque-GATO-042)
  const PE = [['v1', 'e-501', 'Criado'], ['v2', 'e-502', 'Pago'], ['v3', 'e-504', 'Enviado'], ['v4', 'e-505', 'Entregue']];
  const KE = [['v1', 'balance', '+3'], ['v2', 'e-503', 'Reservado']];
  const ev = (s, i, l, tn = 'hi', lv = 0, dz = 0) => ({ s, i, l, tn, lv, dz });
  const pev = (n, tn = 'hi') => PE.slice(0, n).map((l, i) => ev('p', i, l, typeof tn === 'function' ? tn(i) : tn));
  const kev = (n, tn = 'hi') => KE.slice(0, n).map((l, i) => ev('k', i, l, typeof tn === 'function' ? tn(i) : tn));
  const ST = ['criado', 'pago', 'enviado', 'entregue'];
  // a tabela tradicional: uma linha que se sobrescreve; "antes" é o valor que o UPDATE apagou
  const TBL = (k, tn = 'acc', antes) => small(act('pedidos', 'TABLE · STATE', ['pedidos', 'tbl'],
    k < 0 ? ['no row for 1047', 'dim'] : [`1047 · lena-77 · ${ST[k]}`, tn],
    k >= 0 ? ['total_centavos 9,490', 'dim'] : null, k >= 2 ? ['rastreio LA123456789BR', 'dim'] : null,
    antes ? [`before: ${antes} (erased)`, 'bad'] : null));
  const AGG = (k, ...rows) => act('Pedido 1047', 'AGGREGATE', [`status ${ST[k]} · version ${k + 1}`, 'hi'], ...rows);
  const STK = name => ({ ...act(name || 'estoque-GATO-042', 'STREAM · stock'), foot: 1 });
  const BUS = (cells, row = ['key: pedido_id = 1047', 'dim']) => { const d = act('Kafka · pedidos', 'BUS', row); d.tape = cells; d.tapeLabel = 'TOPIC'; return d; };
  const SHOW = { 'tabela-x-eventos': ['tbl', 'cmd', 'store', 'stk'], agregado: ['cmd', 'agg', 'store', 'stk'],
    store: ['tbl', 'cmd', 'agg', 'store', 'stk'], bus: ['cmd', 'store', 'stk', 'pub', 'bus'] };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], evs: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.tbl = TBL(-1);
    o.rows.cmd = act('pedidos', 'SERVICE', ['writes 1047', 'hi']);
    o.rows.agg = AGG(0, ['Pagar: only in criado', 'dim'], ['Enviar: only in pago', 'dim']);
    o.rows.store = { ...act('pedido-1047', 'STREAM · orders'), foot: 1 };
    o.rows.stk = STK();
    o.rows.pub = act('publisher', 'POSITION', ['last published: none', 'hi'], ['reads the Store in order', 'dim']);
    o.rows.bus = BUS([['', 'none'], ['', 'none'], ['', 'none'], ['', 'none']]);
    if (sc === 'tabela-x-eventos') o.beams.push({ pts: CAB.tbl }, { pts: CAB.st });
    else if (sc === 'agregado') o.beams.push({ pts: CAB.ca }, { pts: CAB.as }, { pts: CAB.ak });
    else if (sc === 'store') {
      o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ...PE.map((l, i) => [`pedido-1047 · ${i + 1} · ${l[1]}`, 'hi']),
        ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
      o.rows.cmd = act('psql', 'SESSION', ['SELECT … FROM eventos', 'hi'], ["WHERE stream_id = 'pedido-1047'", 'dim'], ['ORDER BY versao', 'dim']);
      o.rows.agg = act('append_evento', 'FUNCTION', ['1. reads MAX(versao)', 'hi'], ['2. refuses if ≠ expected', 'hi'], ['3. inserts versao + 1', 'hi']);
      o.beams.push({ pts: CAB.ca }, { pts: CAB.as }, { pts: CAB.ak });
    } else o.beams.push({ pts: CAB.st }, { pts: CAB.sp }, { pts: CAB.pb }, { pts: CAB.bk });
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // liga/pinta um cabo (e o põe na lista se ainda não estiver)
  const bm = (o, pts, p) => { const b = o.beams.find(b => b.pts === pts); if (b) Object.assign(b, p); else o.beams.push({ pts, ...p }); };
  // o relógio da tabela-x-eventos e quanto já entrou em cada lado
  const WHEN = ['14:02:10.000', '14:02:11.000', '14:30:00', '19/06 10:40:00'];
  const BTAPE = (n, tn = 'ok', from = 0) => [0, 1, 2, 3].map(i => i < n && i >= from ? [PE[i][1], tn] : i < n ? [PE[i][1], 'ok'] : ['', 'none']);

  // ── o que se vê em cada passo ──
  const STEPS = {
    'tabela-x-eventos': [
      { id: 'cena', dur: 5, title: 'Two benches, the same order', yk: 'LENA\'S ORDER 1047', act: ['Create 1047', '14:02:10.000'],
        code: ['06/18/2026 · customer lena-77', '1 cat GATO-042 · 7,990 cents', 'shipping 1,500 · total 9,490', 'left: the pedidos table (the state)', 'right: the pedido-1047 stream (the facts)'],
        story: 'On the left, the usual <code>pedidos</code> table: one row per order, with today\'s status. On the right, the <code>pedido-1047</code> stream: a rail where each fact of the order goes in as a numbered block. Next to it, the stock stream for the cat, <code>estoque-GATO-042</code>, which already has version 1: the initial balance, +3. Lena\'s order 1047 (module 6) is going to go through both sides.',
        look: 'The pedido-1047 rail is empty and the table has no row for 1047. On the stock rail, one block: v1, balance +3.',
        key: 'The table keeps how the order is; the stream keeps what happened to it.',
        f(o) { lit(o, 'cmd'); o.evs = kev(1);
          o.cnt = [['CLOCK', '14:02:09'], ['IN THE TABLE', 'nothing', 'dim'], ['IN THE STREAM', '0 events', 'dim']];
          o.res = [['the same order, two ways to store it', 'acc']];
          T(o, [165, 120, 44], 'the state', 'dim'); T(o, [735, 110, 30], 'the facts', 'dim'); } },
      { id: 'criado', dur: 5, title: 'PedidoCriado: INSERT on one side, v1 on the other', yk: '14:02:10.000 · e-501',
        code: ['table: INSERT INTO pedidos', "  (1047, 'lena-77', 'criado', 9490)", 'stream: append pedido-1047 v1', '  e-501 PedidoCriado', '  {cliente: lena-77, total: 9490}'],
        story: 'At <b>14:02:10.000</b> Lena checks out: 1 cat (<code>GATO-042</code>, 7,990 cents) and shipping of 1,500, total <b>9,490</b>. The table gets the row <code>1047 · criado</code> with an <code>INSERT</code>. The stream gets the block <b>v1</b>, the <code>e-501</code> <code>PedidoCriado</code>, with the same data. So far both sides say the same thing.',
        look: 'One light goes up to the table and another crosses the board to the rail: the 1047 row lights up on the left, the v1 block drops onto the rail on the right.',
        key: 'On the first fact, state and event coincide.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['1 cat + shipping', 'dim'], ['total 9,490', 'dim']);
          o.rows.tbl = TBL(ok ? 0 : -1); o.evs = [...kev(1), ...(ok ? pev(1, 'acc') : [])];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'INSERT'); pk(o, WAY.st(0), f, 'e-501');
          o.cnt = [['CLOCK', WHEN[0]], ['IN THE TABLE', ok ? 'criado' : '…', 'dim'], ['IN THE STREAM', ok ? '1 event' : '…', 'dim']];
          o.res = ok ? [['both sides say criado', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: 'PedidoPago: the UPDATE erases criado', yk: '14:02:11.000 · e-502 · e-503',
        code: ["UPDATE pedidos SET status = 'pago'", '  WHERE id = 1047;', 'pedido-1047 v2  e-502 PedidoPago 9,490', 'estoque-GATO-042 v2  e-503', '  EstoqueReservado · 14:02:11.050 · 3 → 2'],
        story: 'At <b>14:02:11.000</b> the payment of 9,490 goes through, on the card. The table runs <code>UPDATE … SET status = \'pago\'</code>: <code>criado</code> ceases to exist. The stream erases nothing, it appends <b>v2</b>, <code>e-502</code> <code>PedidoPago</code>. Fifty milliseconds later, at 14:02:11.050, stock reserves the cat: <code>e-503</code> <code>EstoqueReservado</code> is a fact <b>about stock</b> and goes in as v2 of <code>estoque-GATO-042</code> (3 → 2), not in the order\'s stream.',
        look: 'The table row swaps criado for pago and shows, in red, the value that vanished. On the order rail, v2 drops next to v1; on the stock rail, the v2 of e-503.',
        key: 'The UPDATE replaces; the stream only appends.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1, k = t > 3; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store'); if (k) lit(o, 'stk');
          o.rows.cmd = act('pedidos', 'SERVICE', ['payment approved', 'hi'], ['9,490 · card', 'dim']);
          o.rows.tbl = TBL(ok ? 1 : 0, 'acc', ok ? 'criado' : null);
          o.evs = [...kev(k ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...pev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(1), f, 'e-502');
          o.cnt = [['CLOCK', k ? '14:02:11.050' : WHEN[1]], ['IN THE TABLE', ok ? 'pago' : 'criado', 'dim'], ['EVENTS', `${(ok ? 2 : 1) + (k ? 1 : 0)} of 5`, 'dim']];
          o.res = ok ? [['the table lost criado', 'bad'], ['the stream kept both', 'acc']] : [];
          if (k) T(o, [735, 330, 30], 'e-503 is a stock fact', 'dim'); } },
      { id: 'enviado', dur: 5, title: 'PedidoEnviado: another UPDATE, another block', yk: '14:30:00 · e-504',
        code: ["UPDATE pedidos SET status = 'enviado',", "  rastreio = 'LA123456789BR' WHERE id = 1047;", 'pedido-1047 v3  e-504 PedidoEnviado', '  rastreio LA123456789BR'],
        story: 'At <b>14:30:00</b> the package leaves with tracking <code>LA123456789BR</code>. The table overwrites again: <code>pago</code> becomes <code>enviado</code>. The stream gets <b>v3</b>, <code>e-504</code> <code>PedidoEnviado</code>. Note the numbering: the version is <b>per stream</b> (v1, v2, v3), and the <code>evento_id</code> is <b>global</b>, store-wide. That is why the order jumps from <code>e-502</code> to <code>e-504</code>: <code>e-503</code> is in the stock stream.',
        look: 'v3 drops onto the order rail. In the table, pago becomes enviado and the tracking row appears.',
        key: 'Version counts inside the stream; evento_id counts across the whole store.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVICE', ['package dispatched', 'hi'], ['LA123456789BR', 'dim']);
          o.rows.tbl = TBL(ok ? 2 : 1, 'acc', ok ? 'pago' : 'criado'); o.evs = [...kev(2), ...pev(ok ? 3 : 2, i => i === 2 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(2), f, 'e-504');
          o.cnt = [['CLOCK', WHEN[2]], ['IN THE TABLE', ok ? 'enviado' : 'pago', 'dim'], ['EVENTS', `${ok ? 4 : 3} of 5`, 'dim']];
          o.res = ok ? [['v3 on the order · e-503 on stock', 'acc']] : []; } },
      { id: 'entregue', dur: 6, title: 'PedidoEntregue: the table says entregue, and that is all', yk: '19/06 10:40:00 · e-505', act: ['Back to 14:15', 'what did Lena see?'],
        code: ["UPDATE pedidos SET status = 'entregue'", '  WHERE id = 1047;', 'pedido-1047 v4  e-505 PedidoEntregue', 'table: 1 row · 1 INSERT + 3 UPDATE', 'stream: 4 blocks · none erased'],
        story: 'The next day, <b>06/19 at 10:40</b>, the cat arrives. Third <code>UPDATE</code>: the table says <code>entregue</code> and keeps nothing of the path. The stream gets <b>v4</b>, <code>e-505</code> <code>PedidoEntregue</code>, and holds the four facts in order. Folding the four (applying one after the other, starting from empty), you get <code>{status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}</code>: the same state as the table, derived from the facts.',
        look: 'v4 completes the order rail. The table shows only entregue; the history of values is gone.',
        key: 'The current state is a consequence of the events, not the source.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVICE', ['delivery confirmed', 'hi'], ['19/06 10:40', 'dim']);
          o.rows.tbl = TBL(ok ? 3 : 2, 'acc', ok ? 'enviado' : 'pago'); o.evs = [...kev(2), ...pev(ok ? 4 : 3, i => i === 3 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(3), f, 'e-505');
          o.cnt = [['CLOCK', '19/06 10:40'], ['IN THE TABLE', ok ? 'entregue' : 'enviado', 'dim'], ['EVENTS', `${ok ? 5 : 4} of 5`, 'dim']];
          o.res = ok ? [['both reach entregue', 'acc'], ['only one remembers how', 'dim']] : []; } },
      { id: 'as-1415', dur: 7, title: 'What did Lena see at 14:15?', yk: 'FOLD UP TO 14:15',
        code: ['table: SELECT status FROM pedidos', '  WHERE id = 1047  → entregue', 'stream: events with ocorrido_em ≤ 14:15', '  v1 PedidoCriado → criado', '  v2 PedidoPago   → pago   (v3 is 14:30)'],
        story: 'A question the table cannot answer: what was the status of 1047 at <b>14:15</b>? It only knows <code>entregue</code>. The events answer: fold the stream up to the requested time. v1 gives <code>criado</code>, v2 (14:02:11) gives <code>pago</code>, and v3 is from 14:30, later. Answer: <b><code>pago</code>, version 2</b>.',
        look: 'On the rail, v1 and v2 light up and v3 and v4 go dark: they are the future as of 14:15. The table turns red, stuck on entregue.',
        key: 'Only the events go back in time: at 14:15, pago, version 2.',
        f(o, t) { const f = lin(t, 0.6, 2.6, 0, 1), ok = f >= 1; lit(o, 'store'); o.on.tbl = 'bad';
          o.rows.tbl = TBL(3, 'bad'); o.rows.tbl.rows.push(['at 14:15? it does not know', 'bad']);
          o.rows.cmd = act('pedidos', 'QUESTION', ['status at 14:15?', 'hi']);
          o.evs = [...kev(2, 'dim'), ...pev(4, i => i < 2 ? 'acc' : 'dim')];
          const a = slot('p', 0), b = slot('p', 1); pk(o, P3([[a[0], a[1], 34], [b[0], b[1], 34]]), f, '');
          o.cnt = [['AT 14:15', ok ? 'pago' : '…'], ['VERSION', ok ? '2' : '…', 'dim'], ['THE TABLE', 'entregue', 'bad']];
          o.res = ok ? [['pago, version 2', 'acc'], ['the table only knows entregue', 'bad']] : [];
          if (ok) T(o, [slot('p', 1)[0], 20, 82], 'at 14:15: pago · v2', 'acc'); } },
      { id: 'perguntas', dur: 7, title: 'Each side answers one question', yk: 'WHERE LENA WOULD SEE EACH ANSWER',
        code: ['"which orders are enviado right now?"', '  → table (index on status)', '"what was the status at 14:15?"', '  → events (fold up to the time)', '"how many times did the status change?"', '  → events (count the blocks)'],
        story: 'The table did not lose its usefulness. "Which orders are <code>enviado</code> right now?" is a query with an index on status, fast, and on the stream it would require folding every order. But "what was the status at 14:15?" and "how many times did it change?" only the events answer. Having the events has a cost: versions, projections, more storage (50 million orders at 4 events give 200 million events, ~52.6 GB). In an address book that rarely changes and whose history nobody queries, that cost does not pay off.',
        look: 'Both sides light up together, each with the question it answers well.',
        key: 'The state answers the now; the facts answer the how and the when.',
        f(o) { lit(o, 'tbl', 'store'); o.rows.tbl = TBL(3); o.evs = [...kev(2), ...pev(4, 'acc')];
          o.rows.cmd = act('pedidos', 'QUESTIONS', ['the now → table', 'hi'], ['the how and the when → events', 'hi']);
          o.cnt = [['ENVIADO NOW', 'table'], ['AT 14:15', 'events', 'dim'], ['HOW MANY CHANGES', 'events', 'dim']];
          o.res = [['each question has its side', 'acc']];
          T(o, [165, 120, 44], 'the now', 'acc'); T(o, [735, 110, 30], 'the how and the when', 'acc'); } },
      { id: 'corrigir', dur: 8, title: 'What if it goes wrong: an event with the wrong value', yk: 'YOU DO NOT EDIT: YOU CORRECT',
        code: ['if e-502 had recorded the wrong amount:', '  UPDATE eventos …     no (immutable)', '  DELETE of v2          no', 'append pedido-1047 v5', '  PagamentoCorrigido (new fact)', 'every projection has to handle it'],
        story: 'Suppose <code>PedidoPago</code> had recorded a wrong amount. In the table, an <code>UPDATE</code> would fix it and nobody would know there was a mistake. In the stream, v2 <b>is not edited</b>: it happened and stays on the rail. The correction is <b>another fact</b>, a <code>PagamentoCorrigido</code> that goes in as v5. The history stays honest (it erred and corrected), but every projection that reads the stream has to know how to handle the new event, or it keeps showing the wrong amount.',
        look: 'v2 turns red and does not move; a fifth block, Corrigido, drops at the end of the rail.',
        key: 'A wrong event is not deleted: you write a correction event.',
        f(o, t) { const ok = t > 2.2; lit(o, 'store'); o.on.tbl = 2; o.rows.tbl = TBL(3, 'hi');
          o.rows.cmd = act('pedidos', 'CORRECTION', ['PagamentoCorrigido', 'hi'], ['(example, no real value)', 'dim']);
          o.evs = [...kev(2, 'dim'), ...pev(4, i => i === 1 ? 'bad' : 'hi'), ...(ok ? [ev('p', 4, ['v5', 'new', 'Corrigido'], 'acc')] : [])];
          bm(o, CAB.st, { on: !ok }); pk(o, WAY.st(4), lin(t, 0.6, 2.2, 0, 1), 'PagamentoCorrigido');
          o.cnt = [['v2', 'stays', 'bad'], ['CORRECTION', ok ? 'v5' : '…', 'dim'], ['PROJECTIONS', 'must handle it', 'dim']];
          o.res = ok ? [['wrong v2 stays on the rail', 'bad'], ['v5 tells the correction', 'acc']] : [];
          T(o, [slot('p', 1)[0], 20, 82], 'immutable', 'bad'); } },
    ],
    agregado: [
      { id: 'cena', dur: 5, title: 'The aggregate decides before writing', yk: 'ORDER 1047 IN criado', act: ['Send the Enviar command', 'with the order in criado'],
        code: ['Pedido aggregate · stream pedido-<id>', '  Pagar   → only in criado → PedidoPago', '  Enviar  → only in pago   → PedidoEnviado', 'Estoque aggregate · stream estoque-<sku>', '  Reservar → balance > 0  → EstoqueReservado'],
        story: 'In the middle of the board, the <b>aggregate</b> <code>Pedido 1047</code>: the box that receives <b>commands</b>, checks the rules and, if it accepts, emits <b>events</b> in its stream. It was just created: status <code>criado</code>, version 1. There are two rules: <code>Pagar</code> only in <code>criado</code>, <code>Enviar</code> only in <code>pago</code>. An aggregate is a stream and a consistency boundary: everything that changes 1047 goes through it, in order.',
        look: 'The pedidos service on the left, the aggregate in the middle with the rules, and the two rails on the right: the order\'s v1 and the stock\'s v1.',
        key: 'The aggregate is what decides, validates and orders the events of one subject.',
        f(o) { lit(o, 'agg'); o.evs = [...kev(1), ...pev(1)];
          o.rows.cmd = act('pedidos', 'COMMANDS', ['Pagar · Enviar', 'hi'], ['imperative: can be refused', 'dim']);
          o.cnt = [['STATUS', 'criado'], ['VERSION', '1', 'dim'], ['RULES', '2', 'dim']];
          o.res = [['command goes in, event comes out', 'acc']]; } },
      { id: 'recusa', dur: 6, title: 'Enviar with the order in criado: refused', yk: 'COMMAND REFUSED', act: ['Send Pagar', '14:02:11.000'],
        code: ['command Enviar(1047)', 'aggregate: rehydrates v1 → status criado', 'rule: Enviar only in pago', '  → refuses', 'no event written · stream stays at v1'],
        story: 'The <code>Enviar</code> command arrives with 1047 still in <code>criado</code>. The aggregate loads its own stream (only v1), sees <code>criado</code> and <b>refuses</b>: nothing is written and the stream stays at version 1. The difference in grammar matters: the command is a request in the imperative, and can be denied; the event is a fact in the past, and when it exists it is <b>always</b> true.',
        look: 'The command\'s light reaches the aggregate and it turns red. The cable to the rail does not light up; the rail keeps a single block.',
        key: 'A command can be refused; an event is what already happened.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = f >= 1; lit(o, 'cmd'); o.on.agg = no ? 'bad' : 1; o.evs = [...kev(1), ...pev(1)];
          o.rows.cmd = act('pedidos', 'COMMAND', ['Enviar(1047)', 'hi']);
          o.rows.agg = AGG(0, [no ? 'Enviar: only in pago' : 'Pagar: only in criado', no ? 'bad' : 'dim'], [no ? 'REFUSED' : 'Enviar: only in pago', no ? 'bad' : 'dim']);
          bm(o, CAB.ca, { on: !no, tone: no ? 'bad' : '' }); pk(o, WAY.ca, f, 'Enviar');
          o.cnt = [['COMMAND', 'Enviar'], ['STATUS', 'criado', 'dim'], ['NEW EVENTS', no ? '0' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['refused: the order was not paid', 'bad'], ['the stream stays at v1', 'dim']] : [];
          if (no) T(o, [440, 300, 44], 'refused', 'bad'); } },
      { id: 'pagar', dur: 6, title: 'Pagar in criado: accepted, PedidoPago v2', yk: '14:02:11.000 · e-502',
        code: ['command Pagar(1047, 9,490, card)', 'aggregate: status criado → rule ok', 'emits PedidoPago', 'append pedido-1047 v2 · e-502', 'status pago · version 2'],
        story: 'At <b>14:02:11.000</b> <code>pagamentos</code> reports that the 9,490 went through, and <code>pedidos</code> sends <code>Pagar</code>. Now the rule is met: the status is <code>criado</code>. The aggregate emits <code>PedidoPago</code>, which goes into the stream as <b>v2</b> with the <code>evento_id</code> <code>e-502</code> (the same one from module 6, kept in the metadata). <code>PedidoPago</code> is a fact about the <b>order</b>: whoever records it is the owner of the <code>pedido-1047</code> stream.',
        look: 'The command goes through the aggregate, which lights up, and v2 drops onto the order rail.',
        key: 'Rule met, event written: the aggregate moves forward one version.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3.2, 0, 1), ok = f2 >= 1; lit(o, 'cmd', 'agg'); if (ok) lit(o, 'store');
          o.rows.cmd = act('pedidos', 'COMMAND', ['Pagar(1047)', 'hi'], ['9,490 · card', 'dim']);
          o.rows.agg = AGG(ok ? 1 : 0, ['Pagar in criado: ok', 'acc'], [ok ? 'emitted PedidoPago' : 'emitindo…', ok ? 'acc' : 'dim']);
          o.evs = [...kev(1), ...pev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          bm(o, CAB.ca, { on: f1 < 1 }); bm(o, CAB.as, { on: f1 >= 1 && !ok }); pk(o, WAY.ca, f1, 'Pagar'); pk(o, WAY.as(1), f2, 'e-502');
          o.cnt = [['STATUS', ok ? 'pago' : 'criado'], ['VERSION', ok ? '2' : '1', 'dim'], ['EVENT', ok ? 'e-502' : '…', 'dim']];
          o.res = ok ? [['PedidoPago · v2', 'acc']] : []; } },
      { id: 'estoque', dur: 6, title: 'Another aggregate: the cat\'s stock', yk: '14:02:11.050 · e-503',
        code: ['command Reservar(GATO-042, 1, order 1047)', 'Estoque aggregate: rehydrates v1 → balance 3', 'rule: balance > 0 → ok', 'append estoque-GATO-042 v2 · e-503', 'balance 3 → 2'],
        story: 'Stock is <b>another</b> aggregate, with another stream. The <code>Reservar</code> command for 1 cat for order 1047 reaches it; the balance is 3 (v1, +3), the rule "balance greater than zero" passes, and at <b>14:02:11.050</b> it writes <code>EstoqueReservado</code>, <code>e-503</code>, as <b>v2</b> of <code>estoque-GATO-042</code>: balance 3 → 2. With balance 0, the same command would be refused. Each aggregate is small: <b>one</b> order, <b>one</b> SKU.',
        look: 'The middle box becomes the Estoque GATO-042 aggregate; the light goes to the lower rail and stock\'s v2 lights up.',
        key: 'One aggregate per small subject: the order in its stream, the SKU in its own.',
        f(o, t) { const f = lin(t, 0.6, 2.4, 0, 1), ok = f >= 1; lit(o, 'agg'); if (ok) lit(o, 'stk');
          o.rows.agg = act('Estoque GATO-042', 'AGGREGATE', [`balance ${ok ? 2 : 3} · version ${ok ? 2 : 1}`, 'hi'], ['Reservar: only with balance > 0', 'acc'], [ok ? 'emitted EstoqueReservado' : 'balance 3: ok', ok ? 'acc' : 'dim']);
          o.rows.cmd = act('estoque', 'COMMAND', ['Reservar(GATO-042, 1)', 'hi'], ['order 1047', 'dim']);
          o.evs = [...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...pev(2)];
          bm(o, CAB.ak, { on: !ok }); pk(o, WAY.ak(1), f, 'e-503');
          o.cnt = [['BALANCE', ok ? '2' : '3'], ['VERSION', ok ? '2' : '1', 'dim'], ['REFUSES IF', 'balance 0', 'dim']];
          o.res = ok ? [['EstoqueReservado · v2 · 3 → 2', 'acc']] : []; } },
      { id: 'enviar', dur: 6, title: 'Enviar in pago: accepted, PedidoEnviado v3', yk: '14:30:00 · e-504',
        code: ['command Enviar(1047, LA123456789BR)', 'aggregate: status pago → rule ok', 'emits PedidoEnviado', 'append pedido-1047 v3 · e-504', 'status enviado · version 3'],
        story: 'The same command that was refused at the start comes back at <b>14:30:00</b>, now with the order in <code>pago</code>. The rule passes, and the aggregate emits <code>PedidoEnviado</code> with tracking <code>LA123456789BR</code>: <b>v3</b>, <code>e-504</code>. The order of the stream is the order in which the aggregate decided.',
        look: 'The aggregate goes back to being Pedido 1047, lights up, and v3 drops onto the rail.',
        key: 'The same command, in another state, gets another answer.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3.2, 0, 1), ok = f2 >= 1; lit(o, 'cmd', 'agg'); if (ok) lit(o, 'store');
          o.rows.cmd = act('pedidos', 'COMMAND', ['Enviar(1047)', 'hi'], ['LA123456789BR', 'dim']);
          o.rows.agg = AGG(ok ? 2 : 1, ['Enviar in pago: ok', 'acc'], [ok ? 'emitted PedidoEnviado' : 'emitindo…', ok ? 'acc' : 'dim']);
          o.evs = [...kev(2), ...pev(ok ? 3 : 2, i => i === 2 ? 'acc' : 'hi')];
          bm(o, CAB.ca, { on: f1 < 1 }); bm(o, CAB.as, { on: f1 >= 1 && !ok }); pk(o, WAY.ca, f1, 'Enviar'); pk(o, WAY.as(2), f2, 'e-504');
          o.cnt = [['STATUS', ok ? 'enviado' : 'pago'], ['VERSION', ok ? '3' : '2', 'dim'], ['EVENT', ok ? 'e-504' : '…', 'dim']];
          o.res = ok ? [['PedidoEnviado · v3', 'acc']] : []; } },
      { id: 'grande', dur: 8, title: 'What if it goes wrong: the aggregate that is too big', yk: 'ONE STREAM FOR THE WHOLE STORE',
        code: ['stream estoque-loja: all SKUs', '  30 commands/s fight for the next version', '  one passes, the others: conflict and retry', 'fix: one stream per SKU', '  mug on Black Friday: 6 commands/s'],
        story: 'Suppose stock were <b>one</b> aggregate, <code>estoque-loja</code>, with all the SKUs. Black Friday\'s 30 orders/s become 30 commands/s on the <b>same</b> stream, all wanting to write the next version. Only one passes at a time; the others get a conflict, re-read and try again (the lock from lesson 4), and the stream becomes a queue. With a stream <b>per SKU</b>, the hottest one, the blue mug with ~20% of the orders, gets 6 commands/s. And there is the other mistake: if the aggregate\'s rule is wrong, the event it let through is "true" forever.',
        look: 'The lower rail becomes estoque-loja and a red pile of commands waits in front of it.',
        key: 'A big aggregate becomes a queue: one stream per SKU, never one for the store.',
        f(o, t) { const m = lin(t, 0.4, 4.4, 0, 1); lit(o, 'cmd'); o.on.agg = 'bad'; o.on.stk = 'bad';
          o.rows.stk = STK('estoque-loja');
          o.rows.agg = act('Estoque loja', 'AGGREGATE', ['all SKUs', 'bad'], ['a single stream', 'bad'], ['30 commands/s', 'bad']);
          o.rows.cmd = act('pedidos', 'BLACK FRIDAY', ['30 orders/s', 'hi'], ['30 Reservar/s', 'dim']);
          o.evs = [...pev(3), ev('k', 0, ['v…', 'GATO', '−1'], 'hi'), ev('k', 1, ['v…', 'CANECA', '−1'], 'hi'), ev('k', 2, ['v…', '…', '−1'], 'bad')];
          o.piles = m > 0 ? [{ p: [440, 340, PL + 8], f: m, v: '30/s' }] : [];
          bm(o, CAB.ca, { on: true, flow: true }); bm(o, CAB.ak, { on: true, flow: true, tone: 'bad' });
          o.cnt = [['ON ONE STREAM', '30 commands/s', 'bad'], ['PER SKU (MUG)', '6 commands/s', 'dim'], ['FIX', 'stream per SKU', 'dim']];
          o.res = m >= 1 ? [['one stream becomes a queue', 'bad'], ['one per SKU: 6/s on the mug', 'acc']] : [['enchendo…', 'dim']];
          T(o, [735, 330, 30], 'everyone wants the next version', 'bad'); } },
    ],
    store: [
      { id: 'tabela', dur: 5, title: 'The eventos table: append-only, in version order', yk: 'PostgreSQL 14 · SELECT', act: ['Write with an old version', 'expected 2'],
        code: ['SELECT versao, evento_id, tipo FROM eventos', "  WHERE stream_id = 'pedido-1047' ORDER BY versao;", ' 1 | e-501 | PedidoCriado', ' 2 | e-502 | PedidoPago', ' 3 | e-504 | PedidoEnviado', ' 4 | e-505 | PedidoEntregue'],
        story: 'The Event Store is an <b>append-only</b> table: <code>eventos(id, stream_id, versao, evento_id, tipo, dados jsonb, metadados jsonb, ocorrido_em)</code>, with two constraints: <code>UNIQUE (evento_id)</code> and <code>eventos_stream_versao UNIQUE (stream_id, versao)</code>. The 1047 stream was written on PostgreSQL 14 with four calls to <code>append_evento</code>, each with the <b>expected version</b> (0, 1, 2, 3), and the <code>SELECT</code> returned the four in order. The function reads <code>MAX(versao)</code>, refuses if it differs from the expected one and inserts <code>versao + 1</code>.',
        look: 'On the left, the rows of the eventos table; in the middle, the append_evento function; on the right, the two rails.',
        key: 'An append-only log, one stream per aggregate, in version order.',
        f(o) { lit(o, 'tbl', 'store'); o.evs = [...pev(4, 'acc'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1])];
          o.cnt = [['STREAM', 'pedido-1047'], ['VERSIONS', '1 to 4', 'dim'], ['CONSTRAINTS', '2 UNIQUE', 'dim']];
          o.res = [['4 rows, in order', 'acc']]; } },
      { id: 'velha', dur: 6, title: 'Old expected version: Concurrency conflict', yk: 'FUNCTION ERROR', act: ['Repeat e-502', 'with the right version'],
        code: ["append_evento('pedido-1047', 'e-502', …, 2)", '  MAX(versao) = 4', 'ERROR: Concurrency conflict:', '  expected version 2, but current is 4'],
        story: 'Whoever decided based on version 2 is late: the stream is already at 4. The call <code>append_evento(\'pedido-1047\', \'e-502\', …, 2)</code> reads <code>MAX(versao) = 4</code> and refuses with the function\'s own message: <code>ERROR: Concurrency conflict: expected version 2, but current is 4</code>. This is <b>optimistic concurrency</b>: nobody locks the stream to decide, but whoever decided with old data does not write.',
        look: 'The light reaches the function, which turns red. No new block goes onto the rail.',
        key: 'Old expected version: the function refuses and nothing is written.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = f >= 1; lit(o, 'cmd', 'store'); o.on.agg = no ? 'bad' : 1; o.evs = [...pev(4), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1])];
          o.rows.cmd = act('psql', 'SESSION', ["append_evento(", 'hi'], ["  'pedido-1047', 'e-502',", 'dim'], ['  …, 2)', 'hi']);
          o.rows.agg = act('append_evento', 'FUNCTION', ['MAX(versao) = 4', 'hi'], ['expected 2 ≠ 4', no ? 'bad' : 'hi'], [no ? 'RAISE EXCEPTION' : '…', no ? 'bad' : 'dim']);
          bm(o, CAB.ca, { on: !no, tone: no ? 'bad' : '' }); pk(o, WAY.ca, f, 'expected 2');
          o.cnt = [['EXPECTED', '2'], ['CURRENT', '4', 'dim'], ['WRITTEN', no ? 'nothing' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['Concurrency conflict', 'bad'], ['expected version 2, but current is 4', 'bad']] : [];
          if (no) T(o, [440, 300, 44], 'Concurrency conflict', 'bad'); } },
      { id: 'repetido', dur: 6, title: 'The same e-502 again: eventos_evento_id_key', yk: 'UNIQUE (evento_id) ERROR', act: ['Two Reservar commands', 'at the same time'],
        code: ["append_evento('pedido-1047', 'e-502', …, 4)", '  version ok → tries to insert v5', 'ERROR: duplicate key value violates', '  unique constraint "eventos_evento_id_key"', 'DETAIL: Key (evento_id)=(e-502)', '  already exists.'],
        story: 'Now with the right version, 4. The function accepts and tries to write v5, but the <code>evento_id</code> is the same <code>e-502</code> that is already in v2: the duplicated <code>e-502</code> from module 6, arriving again. The <code>UNIQUE (evento_id)</code> blocks it: <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code>, <code>DETAIL: Key (evento_id)=(e-502) already exists.</code> The same fact does not go into the Store twice.',
        look: 'A v5 block with e-502 comes down onto the rail, turns red and disappears. v2, the original e-502, lights up in red.',
        key: 'The UNIQUE (evento_id) prevents the same fact from being written twice.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = t > 2.4, gone = t > 3.8; lit(o, 'cmd', 'store', 'tbl'); o.on.agg = no ? 'bad' : 1;
          o.rows.cmd = act('psql', 'SESSION', ["append_evento(", 'hi'], ["  'pedido-1047', 'e-502',", 'dim'], ['  …, 4)', 'hi']);
          o.rows.agg = act('append_evento', 'FUNCTION', ['MAX(versao) = 4', 'hi'], ['expected 4: ok', 'acc'], [no ? 'INSERT v5: duplicate key' : 'INSERT v5…', no ? 'bad' : 'hi']);
          o.rows.tbl.rows[2] = ['pedido-1047 · 2 · e-502', no ? 'bad' : 'hi']; o.rows.tbl.rows[5] = ['UNIQUE (evento_id)', 'acc'];
          o.evs = [...pev(4, i => i === 1 && no ? 'bad' : 'hi'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]),
            ...(f >= 1 && !gone ? [ev('p', 4, ['v5', 'e-502', 'Pago'], no ? 'bad' : 'pend')] : [])];
          bm(o, CAB.ca, { on: f < 0.5 }); bm(o, CAB.as, { on: f >= 0.5 && f < 1 }); pk(o, WAY.ca, f * 2, 'e-502'); pk(o, WAY.as(4), f * 2 - 1, '');
          o.cnt = [['evento_id', 'e-502'], ['ALREADY IN', 'v2', 'dim'], ['WRITTEN', no ? 'nothing' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['duplicate key: eventos_evento_id_key', 'bad'], ['Key (evento_id)=(e-502)', 'bad']] : [];
          if (no) T(o, [slot('p', 4)[0], 20, 82], 'e-502 already exists', 'bad'); } },
      { id: 'corrida', dur: 7, title: 'Two Reservar commands with expected version 2: B waits', yk: 'pg_stat_activity',
        code: ['A: BEGIN; append_evento(…, 2);', '   pg_sleep(2); COMMIT;', 'B (0.5 s later): append_evento(…, 2)', 'A → Timeout / PgSleep', 'B → Lock / transactionid'],
        story: 'The real race, on <code>estoque-GATO-042</code> at v2. Session <b>A</b> opens a transaction, calls <code>append_evento(…, 2)</code> and sleeps for 2 s before the <code>COMMIT</code>. Half a second later, session <b>B</b> calls the same, also with expected 2. Both read <code>MAX(versao) = 2</code> (A\'s v3 has not been committed yet), both passed the check and both try v3. <code>pg_stat_activity</code> showed A in <code>Timeout / PgSleep</code> and B in <b><code>Lock / transactionid</code></b>: B is stuck on the unique index, waiting for A.',
        look: 'A\'s v3 is on the rail with a dashed outline (not committed). B\'s v3 hovers above it, waiting.',
        key: 'The function\'s check was not enough: both read 2.',
        f(o, t) { const s = lin(t, 0.3, 4.3, 0, 2), b = s >= 0.5; lit(o, 'cmd', 'agg', 'stk');
          o.rows.cmd = act('psql', 'TWO SESSIONS', ['A: append(…, 2) · sleeps 2 s', 'acc'], [b ? 'B: append(…, 2) · waits' : 'B: at 0.5 s', b ? 'hi' : 'dim']);
          o.rows.agg = act('append_evento', 'A e B', ['both: MAX = 2', 'hi'], ['expected 2: ok', 'acc'], ['both try v3', 'hi']);
          o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · e-lab-A', 'acc'], ['  (A: not committed)', 'dim'], ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'e-lab-A', 'A'], 'pend'),
            ...(b ? [ev('k', 2, ['v3', 'B', 'waits'], 'wait', 0, 26)] : [])];
          bm(o, CAB.ak, { on: true, flow: true });
          o.cnt = [['A', 'PgSleep'], ['B', b ? 'Lock / transactionid' : '…', b ? 'bad' : 'dim'], ['A\'S TIME', `${dec(s)} s`, 'dim']];
          o.res = b ? [['B waits for A on the unique index', 'acc']] : [['A wrote v3, no COMMIT', 'dim']];
          if (b) T(o, [slot('k', 2)[0], 236, 64], 'B waits', 'dim'); } },
      { id: 'falha', dur: 7, title: 'A commits; B fails on eventos_stream_versao', yk: 'UNIQUE (stream_id, versao) ERROR',
        code: ['A: COMMIT', 'B: ERROR: duplicate key value violates', '  unique constraint "eventos_stream_versao"', 'DETAIL: Key (stream_id, versao)=', '  (estoque-GATO-042, 3) already exists.', 'v1 e-lab-0 · v2 e-503 · v3 e-lab-A'],
        story: 'When A commits, B wakes up and fails with <code>ERROR: duplicate key value violates unique constraint "eventos_stream_versao"</code>, <code>DETAIL: Key (stream_id, versao)=(estoque-GATO-042, 3) already exists.</code> Note: it is <b>not</b> the function\'s friendly message. What held the race was the database constraint, not the <code>MAX(versao)</code> check. The stream ended up with v1 <code>e-lab-0</code>, v2 <code>e-503</code>, v3 <code>e-lab-A</code>. B has to <b>re-read</b> the stream (now at v3) and decide again: the retry belongs to the caller.',
        look: 'A\'s v3 turns solid. B\'s block turns red, rises and leaves the rail.',
        key: 'The lock is the UNIQUE (stream_id, versao); the retry belongs to the caller.',
        f(o, t) { const no = t > 1, gone = t > 3.6; lit(o, 'cmd', 'stk'); o.on.agg = no ? 'bad' : 1;
          o.rows.cmd = act('psql', 'TWO SESSIONS', ['A: COMMIT', 'acc'], [no ? 'B: duplicate key' : 'B: waiting…', no ? 'bad' : 'hi'], [no ? 'B: re-reads and decides again' : '', 'dim']);
          o.rows.agg = act('append_evento', 'A e B', ['A: v3 committed', 'acc'], [no ? 'B: eventos_stream_versao' : 'B: waiting', no ? 'bad' : 'hi']);
          o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · e-lab-A', 'acc'], ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'e-lab-A', 'A'], 'acc'),
            ...(gone ? [] : [ev('k', 2, ['v3', 'B', no ? 'failed' : 'waits'], no ? 'bad' : 'wait', 0, no ? 26 + (t - 1) * 20 : 26)])];
          o.cnt = [['A', 'v3 committed'], ['B', no ? 'duplicate key' : '…', no ? 'bad' : 'dim'], ['THE STREAM', 'v1 · v2 · v3', 'dim']];
          o.res = no ? [['eventos_stream_versao', 'bad'], ['B re-reads the stream and tries again', 'acc']] : [];
          if (no && !gone) T(o, [slot('k', 2)[0], 236, 80], 'duplicate key', 'bad'); } },
      { id: 'sem-unique', dur: 8, title: 'What if it goes wrong: the lock only in the application', yk: 'WITHOUT THE UNIQUE (stream_id, versao)',
        code: ['A reads MAX(versao) = 2 → inserts v3', 'B reads MAX(versao) = 2 → inserts v3', 'without the constraint: both pass', 'estoque-GATO-042: two version 3s', 'which came first? the stream does not know'],
        story: 'Take out the <code>UNIQUE (stream_id, versao)</code> and leave only the function\'s check (or the code\'s, like the author lab\'s <code>tx.go</code>, which reads <code>COALESCE(MAX(version), 0)</code> and inserts <code>version + 1</code>). Both sessions read 2 and both write <b>v3</b>: the stream ends up with <b>two version 3s</b>. Order, which was the Store\'s central guarantee, ceases to exist, and if the balance were 1 both commands would have reserved the same last unit. The check in the application is not a lock; the constraint is.',
        look: 'Two v3 blocks stacked on the stock rail, both in red.',
        key: 'Without the UNIQUE, the same version goes in twice and the stream loses its order.',
        f(o, t) { const two = t > 1.6; lit(o, 'cmd'); o.on.agg = 'bad'; o.on.stk = two ? 'bad' : 1;
          o.rows.cmd = act('psql', 'TWO SESSIONS', ['A: MAX = 2 → v3', 'hi'], ['B: MAX = 2 → v3', 'hi']);
          o.rows.agg = act('append_evento', 'WITHOUT UNIQUE', ['A and B read 2', 'hi'], ['both insert v3', 'bad'], ['nothing blocks it', 'bad']);
          o.rows.tbl = small(act('eventos', 'WITHOUT THE CONSTRAINT', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · A', 'bad'], [two ? 'estoque-GATO-042 · 3 · B' : '', 'bad'], ['UNIQUE (stream_id, versao): —', 'bad']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'A', '−1'], two ? 'bad' : 'acc'),
            ev('k', 2, ['v3', 'B', '−1'], two ? 'bad' : 'wait', 1, two ? 0 : lin(t, 0, 1.6, 30, 0))];
          bm(o, CAB.ak, { on: true, flow: !two, tone: two ? 'bad' : '' });
          o.cnt = [['VERSIONS 3', two ? '2' : '1', two ? 'bad' : ''], ['THE ORDER', two ? 'lost' : '…', two ? 'bad' : 'dim'], ['THE LOCK', 'only in the code', 'bad']];
          o.res = two ? [['two v3s in the same stream', 'bad'], ['the lock is the constraint', 'acc']] : [];
          if (two) T(o, [slot('k', 2)[0], 236, 62], 'two v3s', 'bad'); } },
    ],
    bus: [
      { id: 'cena', dur: 5, title: 'The Store is the source; the bus carries the consequences', yk: 'WHO READS, WHO PUBLISHES', act: ['Publish e-501', 'by position'],
        code: ['Event Store: pedido-1047 (source of truth)', 'publisher: reads the Store after the position', 'bus: Kafka, topic pedidos', '  key pedido_id → same partition', 'consumer: estoque (writes to estoque-GATO-042)'],
        story: 'The Event Store keeps the facts; something else carries the facts out. The <b>publisher</b> reads the Store in order, from the <b>position</b> of the last event it already published, and sends each one to the <b>bus</b> (here Kafka, topic <code>pedidos</code>, key <code>pedido_id</code>). Whoever listens, like <code>estoque</code>, reacts and writes its own facts to its own stream. The bus is not the Store: the module 13 topic keeps 7 days, and the Store keeps forever.',
        look: 'The pedido-1047 rail has v1. One cable leaves it for the publisher, another from the publisher to the bus, and a third from the bus to stock.',
        key: 'The Store is the source of truth; the bus is the path of the consequences.',
        f(o) { lit(o, 'store', 'pub'); o.evs = [...pev(1, 'acc'), ...kev(1)];
          o.cnt = [['IN THE STORE', 'v1 · e-501'], ['POSITION', 'none', 'dim'], ['ON THE BUS', 'nothing', 'dim']];
          o.res = [['e-501 still to publish', 'dim']]; } },
      { id: 'publica', dur: 6, title: 'The publisher publishes e-501 and advances the position', yk: 'POSITION: none → v1',
        code: ['reads pedido-1047 after the position', '  → v1 e-501 PedidoCriado', 'publish(key 1047, e-501)', 'position = v1 (e-501)'],
        story: 'The publisher looks at the position (nothing published yet), finds v1 and publishes <code>e-501</code> to the <code>pedidos</code> topic, with key <code>1047</code>. Only after the broker acknowledges does it <b>advance</b> the position to v1. If it crashes before that, it publishes the same event again: delivery is <b>at least once</b>.',
        look: 'The light leaves v1, passes through the publisher and enters the bus; the first cell of the topic lights up.',
        key: 'Publish and then advance the position: nothing is lost, something may repeat.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3, 0, 1), ok = f2 >= 1; lit(o, 'store', 'pub'); if (ok) lit(o, 'bus');
          o.evs = [...pev(1, 'acc'), ...kev(1)];
          o.rows.pub = act('publisher', 'POSITION', [ok ? 'last published: v1 · e-501' : 'last published: none', ok ? 'acc' : 'hi'], ['reads the Store in order', 'dim']);
          o.rows.bus = BUS(BTAPE(ok ? 1 : 0));
          bm(o, CAB.sp, { on: f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !ok }); pk(o, WAY.sp(0), f1, 'e-501'); pk(o, WAY.pb, f2, '');
          o.cnt = [['POSITION', ok ? 'v1' : 'none'], ['ON THE BUS', ok ? 'e-501' : '…', 'dim'], ['KEY', '1047', 'dim']];
          o.res = ok ? [['e-501 on the pedidos topic', 'acc']] : []; } },
      { id: 'reage', dur: 7, title: 'PedidoPago: stock listens and reserves', yk: '14:02:11.000 → 14:02:11.050',
        code: ['14:02:11.000  pedido-1047 v2 · e-502', 'publisher → bus · key 1047', 'stock consumes e-502', '14:02:11.050  estoque-GATO-042 v2 · e-503', '  balance 3 → 2'],
        story: 'At <b>14:02:11.000</b> <code>PedidoPago</code> (<code>e-502</code>) goes into the Store as v2. The publisher carries it to the bus, <code>estoque</code> consumes it and, at <b>14:02:11.050</b>, writes <code>EstoqueReservado</code> (<code>e-503</code>) to <b>its</b> stream, <code>estoque-GATO-042</code>: balance 3 → 2. These are two Stores, one per service, linked by the bus. In the article\'s example it is the same design: a new account becomes a balance in one service and a statement in another.',
        look: 'The order\'s v2 drops onto the rail, goes through the publisher and the bus, comes down to the stock rail and lights up its v2.',
        key: 'Whoever listens to the bus writes its own facts to its own stream.',
        f(o, t) { const a = t > 0.6, f1 = lin(t, 0.8, 2, 0, 1), f2 = lin(t, 2, 3, 0, 1), f3 = lin(t, 3, 4.2, 0, 1), inB = f2 >= 1, ok = f3 >= 1;
          lit(o, 'store', 'pub'); if (inB) lit(o, 'bus'); if (ok) lit(o, 'stk');
          o.evs = [...pev(a ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          o.rows.cmd = act('pedidos', 'SERVICE', ['Pagar(1047) · COMMIT v2', 'hi']);
          o.rows.pub = act('publisher', 'POSITION', [`last published: ${f1 >= 1 ? 'v2 · e-502' : 'v1 · e-501'}`, 'acc'], ['reads the Store in order', 'dim']);
          o.rows.bus = BUS(BTAPE(inB ? 2 : 1, 'ok'));
          bm(o, CAB.st, { on: !a }); bm(o, CAB.sp, { on: a && f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !inB }); bm(o, CAB.bk, { on: inB && !ok });
          pk(o, WAY.st(1), lin(t, 0, 0.6, 0, 1), 'COMMIT v2'); pk(o, WAY.sp(1), f1, 'e-502'); pk(o, WAY.pb, f2, ''); pk(o, WAY.bk(1), f3, 'e-503');
          o.cnt = [['CLOCK', ok ? '14:02:11.050' : '14:02:11.000'], ['POSITION', f1 >= 1 ? 'v2' : 'v1', 'dim'], ['BALANCE GATO-042', ok ? '2' : '3', 'dim']];
          o.res = ok ? [['stock reserved: 3 → 2', 'acc']] : []; } },
      { id: 'ordem', dur: 6, title: 'Key pedido_id: the stream\'s order arrives whole', yk: 'ONE KEY, ONE PARTITION', act: ['Take the publisher down', 'after the COMMIT'],
        code: ['publish(key 1047, e-504)   14:30:00', 'publish(key 1047, e-505)   06/19 10:40', 'same key → same partition (module 13)', 'order on the topic: e-501 e-502 e-504 e-505', 'delivery: at least once'],
        story: '<code>e-504</code> (14:30) and <code>e-505</code> (06/19 10:40) follow the same path. Since they all carry key <code>1047</code>, they land in the same partition (module 13) and arrive in the stream\'s order: v1, v2, v3, v4. The bus preserves order <b>per stream</b>, not store-wide, and delivers <b>at least once</b>: the consumer has to be idempotent (lesson 10).',
        look: 'The four cells of the topic light up in the order of the rail\'s blocks.',
        key: 'Key = pedido_id: a stream\'s order holds on the bus too.',
        f(o, t) { const n = Math.min(4, 2 + Math.floor(lin(t, 0.4, 3.4, 0, 2.99))); lit(o, 'store', 'pub', 'bus');
          o.evs = [...pev(4, i => i < n ? 'acc' : 'hi'), ...kev(2)];
          o.rows.pub = act('publisher', 'POSITION', [`last published: v${n} · ${PE[n - 1][1]}`, 'acc'], ['reads the Store in order', 'dim']);
          o.rows.bus = BUS(BTAPE(n), ['key 1047 → same partition', 'dim']);
          bm(o, CAB.sp, { on: n < 4, flow: n < 4 }); bm(o, CAB.pb, { on: n < 4, flow: n < 4 });
          o.cnt = [['ON THE TOPIC', `${n} of 4`], ['KEY', '1047', 'dim'], ['ORDER', 'the stream\'s', 'dim']];
          o.res = n >= 4 ? [['v1 · v2 · v3 · v4, in order', 'acc']] : [['publicando…', 'dim']]; } },
      { id: 'cai', dur: 7, title: 'What if it goes wrong: the publisher crashes between the commit and the publication', yk: 'DUAL WRITE (author\'s lab)', act: ['Bring the publisher back', 'it reads the position'],
        code: ['14:02:11.000  COMMIT pedido-1047 v2 · e-502', '  the publisher crashes before publishing', 'bus: only e-501', 'stock: never sees e-502', '  GATO-042 stays at 3'],
        story: 'Go back to <b>14:02:11.000</b>: v2 (<code>e-502</code>) was just committed in the Store and the publisher <b>crashes</b> before publishing. The fact exists, but did not go out: the bus only has <code>e-501</code>, <code>estoque</code> never sees the payment and the cat stays at 3, with no reservation. It is the dual write from module 18. The author\'s lab has this design: the README says "the Kafka publication is done after the commit", and what recovers whatever was missing is rehydration, triggered by hand.',
        look: 'v2 is on the rail, lit. The publisher turns red; the bus has a single cell and stock does not get v2.',
        key: 'Committed in the Store and not published: the fact exists and nobody finds out.',
        f(o, t) { const dead = t > 1.2; lit(o, 'store'); o.on.pub = dead ? 'bad' : 1; o.on.stk = dead ? 'bad' : 0;
          o.evs = [...pev(2, i => i === 1 ? 'acc' : 'hi'), ...kev(1, dead ? 'bad' : 'hi')];
          o.rows.pub = act('publisher', 'CRASHED', ['last published: v1 · e-501', 'hi'], [dead ? 'crashed before publishing v2' : 'reading v2…', dead ? 'bad' : 'dim']);
          o.rows.bus = BUS(BTAPE(1)); o.rows.stk = STK();
          bm(o, CAB.sp, { on: !dead, tone: dead ? 'bad' : '' }); if (!dead) pk(o, WAY.sp(1), lin(t, 0.2, 1.2, 0, 0.6), 'e-502');
          o.cnt = [['IN THE STORE', 'v2 · e-502'], ['ON THE BUS', 'only e-501', dead ? 'bad' : 'dim'], ['BALANCE GATO-042', dead ? '3 (no reservation)' : '3', dead ? 'bad' : 'dim']];
          o.res = dead ? [['in the Store, outside the bus', 'bad'], ['stock does not reserve', 'bad']] : [];
          if (dead) T(o, [440, 300, 40], 'publisher crashed', 'bad'); } },
      { id: 'recupera', dur: 7, title: 'The publisher comes back and recovers by position', yk: 'POSITION: v1 → v2',
        code: ['publisher is back · position = v1 (e-501)', 'reads pedido-1047 after v1 → v2 e-502', 'publish(key 1047, e-502)', 'stock: e-503 · balance 3 → 2', 'if it had already gone out: e-502 twice'],
        story: 'When it comes back, the publisher does not trust its memory: it reads the <b>position</b> it saved (v1) and asks the <b>Store itself</b> for everything that came after. It finds v2 and publishes <code>e-502</code>; stock reserves, 3 → 2. If the publisher had published and crashed before saving the position, <code>e-502</code> would go out <b>twice</b>: that is why the consumer has to be idempotent (lesson 10). The way to tie the commit to the publication is the outbox or CDC from module 18.',
        look: 'The publisher lights up again, the light leaves v2 and runs through the bus to stock, which gets v2.',
        key: 'The Store is the source: the publisher recovers by re-reading it from the position.',
        f(o, t) { const f1 = lin(t, 0.6, 1.8, 0, 1), f2 = lin(t, 1.8, 2.8, 0, 1), f3 = lin(t, 2.8, 4, 0, 1), inB = f2 >= 1, ok = f3 >= 1;
          lit(o, 'store', 'pub'); if (inB) lit(o, 'bus'); if (ok) lit(o, 'stk');
          o.evs = [...pev(2, i => i === 1 ? 'acc' : 'hi'), ...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          o.rows.pub = act('publisher', 'BACK', [`position: ${f1 >= 1 ? 'v2 · e-502' : 'v1 · e-501'}`, 'acc'], ['re-reads the Store after it', 'hi']);
          o.rows.bus = BUS(BTAPE(inB ? 2 : 1));
          bm(o, CAB.sp, { on: f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !inB }); bm(o, CAB.bk, { on: inB && !ok });
          pk(o, WAY.sp(1), f1, 'e-502'); pk(o, WAY.pb, f2, ''); pk(o, WAY.bk(1), f3, 'e-503');
          o.cnt = [['POSITION', f1 >= 1 ? 'v2' : 'v1'], ['ON THE BUS', inB ? 'e-501 · e-502' : 'only e-501', 'dim'], ['BALANCE GATO-042', ok ? '2' : '3', 'dim']];
          o.res = ok ? [['recovered by position', 'acc'], ['idempotent consumer: lesson 10', 'dim']] : []; } },
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
  function head(x, u, d, W_, col, s1 = 11, y = s1 > 15 ? 13 : 11) {   // nome à esquerda, papel à direita, na primeira linha (ou na faixa y)
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
    // trilho: o nome vai na faixa da frente, porque os blocos de evento ficam em cima da parte de trás
    const foot = d.foot, ly = foot ? H_ - 21 : cf.s1 > 15 ? 25 : 21; head(x, u, d, W_, col, cf.s1, foot ? H_ - 10 : undefined);
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn], i) => {
      if (tn === 'tbl') {   // cabeçalho de tabela: uma aba do tamanho do nome, com um respiro antes (menos na primeira)
        if (i) y += 3; fitFont(x, u, text, fs - 1, W_ - 14); const tw = x.measureText(text).width / u(1) + 8;
        x.fillStyle = on === 'bad' ? BAD() : accC(); x.fillRect(u(4), u(y - lh / 2 + 2), u(tw), u(lh - 4));
        x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillText(text, u(8), u(y + 0.5));
      } else if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); }
      y += lh; });
    if (d.tape && d.tape.length) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'TOPIC');
    cv.tex.needsUpdate = true;
  }
  // um evento no trilho: versão grande, evento_id e tipo; acc = aceso, pend = não confirmado (tracejado), wait = esperando, bad = erro, dim = fora da conta
  function evFace(cv, l, tn) { const { x, P } = cv, u = v => v * P, light = theme === 'light', C = pal3(), W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = tn === 'bad' ? (light ? '#f4e4e2' : '#24130f') : tn === 'acc' ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    const strong = tn === 'acc' || tn === 'bad' || tn === 'pend';
    x.strokeStyle = tn === 'bad' ? BAD() : strong ? accC() : tn === 'wait' ? INK() : C.line; x.lineWidth = u(strong || tn === 'wait' ? 1.4 : 0.6);
    if (tn === 'pend' || tn === 'wait') x.setLineDash([u(2.6), u(1.8)]);
    x.strokeRect(u(0.8), u(0.8), cv.c.width - u(1.6), cv.c.height - u(1.6)); x.setLineDash([]);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const big = H_ > 80, ys = big ? [0.2, 0.5, 0.76] : [0.22, 0.52, 0.8], fs = big ? [15, 10.5, 10.5] : [13, 10, 10];
    const c0 = tn === 'bad' ? BAD() : tn === 'acc' || tn === 'pend' ? accC() : tn === 'dim' ? INK() : C.inkHi, c1 = tn === 'bad' ? BAD() : tn === 'dim' || tn === 'wait' ? INK() : C.inkHi;
    l.forEach((s, i) => { if (!s) return; x.fillStyle = i ? c1 : c0; fitFont(x, u, s, fs[i], W_ - 5); x.fillText(s, u(W_ / 2), u(H_ * ys[i])); });
    cv.tex.needsUpdate = true; }
  function placeEvents(list, dt) {
    for (const s of ['p', 'k']) {
      const mine = list.filter(e => e.s === s), R = RAIL[s];
      EV[s].forEach((E, j) => { const e = mine[j];
        if (!e) { E.g.visible = false; E.at = null; E.glow.material.uniforms.intensity.value = 0; return; }
        const tgt = [R.x + e.i * (EW + EG), R.y, R.z + e.lv * (EH + 1) + e.dz];
        if (!E.at || !E.g.visible) E.at = [tgt[0], tgt[1], tgt[2] + (POSTER ? 0 : 46)];
        const k = 1 - Math.exp(-dt / 0.16); for (let q = 0; q < 3; q++) E.at[q] += (tgt[q] - E.at[q]) * k;
        E.g.visible = true; E.g.position.copy(W(...E.at));
        const key = JSON.stringify([e.l, e.tn]) + theme + accent.getHex(); if (E.key !== key) { E.key = key; evFace(E.top, e.l, e.tn); }
        E.mat.emissive.copy(e.tn === 'bad' ? badEm : accent); E.mat.emissiveIntensity = e.tn === 'acc' || e.tn === 'bad' ? 0.3 : 0;
        moveGlow(E.glow, [E.at[0] + EW / 2, E.at[1] + R.d / 2, E.at[2] + EH + 2], e.tn === 'acc' ? 0.25 : 0); });
    }
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? String(pl.v) : '';
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
  const on_ = (...i) => i.includes(step) ? ' class="on"' : '';
  const DATA = {
    'tabela-x-eventos': () => `<table class="h3-sum"><tr><th>stream · v</th><th>evento_id</th><th>type · when</th></tr><tr${on_(1)}><td>pedido-1047 · 1</td><td>e-501</td><td>PedidoCriado · 14:02:10.000 · total 9,490</td></tr><tr${on_(2, 5, 7)}><td>pedido-1047 · 2</td><td>e-502</td><td>PedidoPago · 14:02:11.000 · 9,490, card</td></tr><tr${on_(2)}><td>estoque-GATO-042 · 2</td><td>e-503</td><td>EstoqueReservado · 14:02:11.050 · 3 → 2</td></tr><tr${on_(3)}><td>pedido-1047 · 3</td><td>e-504</td><td>PedidoEnviado · 14:30:00 · LA123456789BR</td></tr><tr${on_(4)}><td>pedido-1047 · 4</td><td>e-505</td><td>PedidoEntregue · 06/19 10:40:00</td></tr></table><li>Rehydrate <code>pedido-1047</code> (fold the 4 in order): <code>{pedido_id: 1047, status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}</code>; up to 14:15: <b><code>pago</code>, version 2</b></li><li>The table: 1 <code>INSERT</code> and 3 <code>UPDATE pedidos SET status = …</code>; only <code>entregue</code> is left</li><li>The version is per stream; the <code>evento_id</code> is global (ids <code>e-501</code>, <code>e-502</code>, <code>e-504</code> are the ones from module 6; <code>e-505</code> is new)</li><li>Storage: 50 million orders × 4 events = 200 million × ~263 B = <b>~52.6 GB</b> (estimate); the module 16 <code>pedidos</code> table has 140 GB with indexes</li><li>Fowler: Event Sourcing, CQRS, <i>event notification</i> and <i>event-carried state transfer</i> are four different patterns</li>`,
    agregado: () => `<table class="h3-sum"><tr><th>command</th><th>rule</th><th>event (stream)</th></tr><tr${on_(2)}><td>Pagar</td><td>only in <code>criado</code></td><td>PedidoPago · e-502 (pedido-1047 v2)</td></tr><tr${on_(1, 4)}><td>Enviar</td><td>only in <code>pago</code></td><td>PedidoEnviado · e-504 (pedido-1047 v3)</td></tr><tr${on_(3)}><td>Reservar</td><td>balance &gt; 0</td><td>EstoqueReservado · e-503 (estoque-GATO-042 v2)</td></tr></table><li>Command: imperative, can be refused. Event: past tense, always true</li><li><code>PedidoPago</code> is an order fact (<code>pedidos</code> writes it when <code>pagamentos</code> notifies it; <code>e-502</code> stays in the metadata); <code>EstoqueReservado</code> is a stock fact</li><li>Size: one order, one SKU. Blue mug on Black Friday: ~20% of 30 orders/s = <b>6 events/s</b> on <code>estoque-CANECA-007</code>; at 600 commands/s on a single stream, the stream becomes a bottleneck</li><li>The estoque-loja example (one stream for all SKUs) is hypothetical, to show the limit</li>`,
    store: () => `<li><code>eventos(id bigserial PK, stream_id text, versao int, evento_id text UNIQUE, tipo text, dados jsonb, metadados jsonb, ocorrido_em timestamptz, CONSTRAINT eventos_stream_versao UNIQUE (stream_id, versao))</code>, adapted from the author lab's <code>events</code></li><table class="h3-sum"><tr><th>call (PostgreSQL 14.24)</th><th>result</th></tr><tr${on_(0)}><td><code>append_evento(…, 0)</code> … <code>(…, 3)</code></td><td>v1 e-501 · v2 e-502 · v3 e-504 · v4 e-505</td></tr><tr${on_(1)}><td>e-502 with expected 2 (stream at v4)</td><td><code>Concurrency conflict: expected version 2, but current is 4</code></td></tr><tr${on_(2)}><td>e-502 with expected 4</td><td><code>duplicate key … "eventos_evento_id_key"</code> · <code>Key (evento_id)=(e-502) already exists.</code></td></tr><tr${on_(3, 4)}><td>A and B, both with expected 2, on estoque-GATO-042</td><td>A: <code>Timeout / PgSleep</code>; B: <code>Lock / transactionid</code>, then <code>duplicate key … "eventos_stream_versao"</code> · <code>(estoque-GATO-042, 3)</code></td></tr></table><li>Race result: v1 <code>e-lab-0</code>, v2 <code>e-503</code>, v3 <code>e-lab-A</code></li><li>Author's lab (read, not executed): <code>tx.go</code> reads <code>COALESCE(MAX(version), 0)</code> and inserts <code>version + 1</code>; <code>isVersionConflict</code> counts the error in <code>EventsVersionConflictsTotal</code>; the table has <code>UNIQUE(aggregate_id, version)</code></li><li>Kafka as the Event Store for aggregates: there is no "append only if the version is N" per key and no "read the whole stream" without scanning the partition, and retention deletes; it serves the bus</li>`,
    bus: () => `<table class="h3-sum"><tr><th>when</th><th>Store</th><th>bus · stock</th></tr><tr${on_(1)}><td>14:02:10.000</td><td>pedido-1047 v1 · e-501</td><td>published, key 1047</td></tr><tr${on_(2, 4, 5)}><td>14:02:11.000</td><td>pedido-1047 v2 · e-502</td><td>stock consumes</td></tr><tr${on_(2, 5)}><td>14:02:11.050</td><td>estoque-GATO-042 v2 · e-503</td><td>saldo 3 → 2</td></tr><tr${on_(3)}><td>14:30:00 · 06/19 10:40</td><td>v3 e-504 · v4 e-505</td><td>same key, same partition</td></tr></table><li>Author lab's README: "the Kafka publication is done after the commit": the dual write from module 18; rehydration (<code>rehydratate</code>) republishes by hand whatever was missing (the README is in Portuguese)</li><li>Lab topics: <code>conta_criada</code>, <code>conta_movimentacao</code>, <code>ledger_nova_transacao_confirmada</code>, <code>ledger_saldo_atualizado</code>, <code>ledger_rehydratate_transactions</code></li><li>The bus is not the Store: the module 13 topic keeps 7 days; the Store keeps everything</li><li>At-least-once delivery: idempotent consumer (lesson 10); truly atomic: outbox or CDC (module 18)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo (criar o 1047, mandar Enviar, dois Reservar, derrubar o publisher): avança para o passo seguinte
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
  function readout() { if (active !== 'eventos') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'eventos' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-eventos3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'eventos') return;
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
    placeEvents(o.evs, dt); placePiles(o.piles); drawScreen(o);
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...EV.p.map(e => e.top), ...EV.k.map(e => e.top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = ''); EV.p.concat(EV.k).forEach(e => e.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
