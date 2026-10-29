// Figura 3D (iso-glow): do estado aos fatos. À esquerda a tabela pedidos (atrás) e o serviço pedidos (na frente); no meio o agregado
// e o publisher; à direita os streams pedido-1047 e estoque-GATO-042 como trilhos com blocos numerados (v1…v4) e o bus na frente.
// Atrás, o mostrador (a conta do passo, o SQL ou o erro, e o resultado).
// Cenários (botões e ?mode=tabela-x-eventos|agregado|store|bus; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/event-sourcing-brief.md): o 1047 do módulo 6 (e-501, e-502, e-504, e-505 em
// pedido-1047; e-503 em estoque-GATO-042, 3 → 2), 14:15 → pago v2, os erros reais do PostgreSQL 14 (Concurrency conflict,
// eventos_evento_id_key, eventos_stream_versao), a corrida A/B (PgSleep × Lock/transactionid) e a publicação depois do commit do lab do autor.
FIGS3D.push({ id: 'eventos', name: 'Do estado aos fatos', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const dec = (n, d = 1) => { const [a, b] = n.toFixed(d).split('.'); return a + (b ? ',' + b : ''); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['tabela-x-eventos', 'agregado', 'store', 'bus'];
  const SCNAME = { 'tabela-x-eventos': 'Tabela', agregado: 'Agregado', store: 'Store', bus: 'Bus' };
  const SCFULL = { 'tabela-x-eventos': 'Tabela × eventos', agregado: 'O agregado', store: 'O Event Store', bus: 'Publisher e bus' };
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
  const KE = [['v1', 'saldo', '+3'], ['v2', 'e-503', 'Reservado']];
  const ev = (s, i, l, tn = 'hi', lv = 0, dz = 0) => ({ s, i, l, tn, lv, dz });
  const pev = (n, tn = 'hi') => PE.slice(0, n).map((l, i) => ev('p', i, l, typeof tn === 'function' ? tn(i) : tn));
  const kev = (n, tn = 'hi') => KE.slice(0, n).map((l, i) => ev('k', i, l, typeof tn === 'function' ? tn(i) : tn));
  const ST = ['criado', 'pago', 'enviado', 'entregue'];
  // a tabela tradicional: uma linha que se sobrescreve; "antes" é o valor que o UPDATE apagou
  const TBL = (k, tn = 'acc', antes) => small(act('pedidos', 'TABELA · ESTADO', ['pedidos', 'tbl'],
    k < 0 ? ['nenhuma linha do 1047', 'dim'] : [`1047 · lena-77 · ${ST[k]}`, tn],
    k >= 0 ? ['total_centavos 9.490', 'dim'] : null, k >= 2 ? ['rastreio LA123456789BR', 'dim'] : null,
    antes ? [`antes: ${antes} (apagado)`, 'bad'] : null));
  const AGG = (k, ...rows) => act('Pedido 1047', 'AGREGADO', [`status ${ST[k]} · versão ${k + 1}`, 'hi'], ...rows);
  const STK = name => ({ ...act(name || 'estoque-GATO-042', 'STREAM · estoque'), foot: 1 });
  const BUS = (cells, row = ['chave: pedido_id = 1047', 'dim']) => { const d = act('Kafka · pedidos', 'BUS', row); d.tape = cells; d.tapeLabel = 'TÓPICO'; return d; };
  const SHOW = { 'tabela-x-eventos': ['tbl', 'cmd', 'store', 'stk'], agregado: ['cmd', 'agg', 'store', 'stk'],
    store: ['tbl', 'cmd', 'agg', 'store', 'stk'], bus: ['cmd', 'store', 'stk', 'pub', 'bus'] };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], evs: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.tbl = TBL(-1);
    o.rows.cmd = act('pedidos', 'SERVIÇO', ['grava o 1047', 'hi']);
    o.rows.agg = AGG(0, ['Pagar: só em criado', 'dim'], ['Enviar: só em pago', 'dim']);
    o.rows.store = { ...act('pedido-1047', 'STREAM · pedidos'), foot: 1 };
    o.rows.stk = STK();
    o.rows.pub = act('publisher', 'POSIÇÃO', ['último publicado: nenhum', 'hi'], ['lê o Store em ordem', 'dim']);
    o.rows.bus = BUS([['', 'none'], ['', 'none'], ['', 'none'], ['', 'none']]);
    if (sc === 'tabela-x-eventos') o.beams.push({ pts: CAB.tbl }, { pts: CAB.st });
    else if (sc === 'agregado') o.beams.push({ pts: CAB.ca }, { pts: CAB.as }, { pts: CAB.ak });
    else if (sc === 'store') {
      o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ...PE.map((l, i) => [`pedido-1047 · ${i + 1} · ${l[1]}`, 'hi']),
        ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
      o.rows.cmd = act('psql', 'SESSÃO', ['SELECT … FROM eventos', 'hi'], ["WHERE stream_id = 'pedido-1047'", 'dim'], ['ORDER BY versao', 'dim']);
      o.rows.agg = act('append_evento', 'FUNÇÃO', ['1. lê MAX(versao)', 'hi'], ['2. recusa se ≠ esperada', 'hi'], ['3. insere versao + 1', 'hi']);
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
      { id: 'cena', dur: 5, title: 'Duas bancadas, o mesmo pedido', yk: 'O PEDIDO 1047 DA LENA', act: ['Criar o 1047', '14:02:10.000'],
        code: ['18/06/2026 · cliente lena-77', '1 gato GATO-042 · 7.990 centavos', 'frete 1.500 · total 9.490', 'à esquerda: a tabela pedidos (o estado)', 'à direita: o stream pedido-1047 (os fatos)'],
        story: 'À esquerda, a tabela <code>pedidos</code> de sempre: uma linha por pedido, com o status de agora. À direita, o stream <code>pedido-1047</code>: um trilho onde cada fato do pedido entra como um bloco numerado. Ao lado dele, o stream do estoque do gato, <code>estoque-GATO-042</code>, que já tem a versão 1: o saldo inicial, +3. O mesmo pedido 1047 da Lena (módulo 6) vai passar pelos dois lados.',
        look: 'O trilho do pedido-1047 está vazio e a tabela não tem a linha do 1047. No trilho do estoque, um bloco: v1, saldo +3.',
        key: 'A tabela guarda como o pedido está; o stream guarda o que aconteceu com ele.',
        f(o) { lit(o, 'cmd'); o.evs = kev(1);
          o.cnt = [['RELÓGIO', '14:02:09'], ['NA TABELA', 'nada', 'dim'], ['NO STREAM', '0 eventos', 'dim']];
          o.res = [['o mesmo pedido, dois jeitos de guardar', 'acc']];
          T(o, [165, 120, 44], 'o estado', 'dim'); T(o, [735, 110, 30], 'os fatos', 'dim'); } },
      { id: 'criado', dur: 5, title: 'PedidoCriado: INSERT de um lado, v1 do outro', yk: '14:02:10.000 · e-501',
        code: ['tabela: INSERT INTO pedidos', "  (1047, 'lena-77', 'criado', 9490)", 'stream: append pedido-1047 v1', '  e-501 PedidoCriado', '  {cliente: lena-77, total: 9490}'],
        story: 'Às <b>14:02:10.000</b> a Lena fecha a compra: 1 gato (<code>GATO-042</code>, 7.990 centavos) e o frete de 1.500, total <b>9.490</b>. A tabela ganha a linha <code>1047 · criado</code> com um <code>INSERT</code>. O stream ganha o bloco <b>v1</b>, o <code>e-501</code> <code>PedidoCriado</code>, com os mesmos dados. Até aqui os dois lados dizem a mesma coisa.',
        look: 'Uma luz sobe para a tabela e outra atravessa a prancha até o trilho: a linha do 1047 acende à esquerda, o bloco v1 cai no trilho à direita.',
        key: 'No primeiro fato, estado e evento coincidem.',
        f(o, t) { const f = lin(t, 0.4, 2.6, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['CriarPedido(lena-77)', 'hi'], ['1 gato + frete', 'dim'], ['total 9.490', 'dim']);
          o.rows.tbl = TBL(ok ? 0 : -1); o.evs = [...kev(1), ...(ok ? pev(1, 'acc') : [])];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'INSERT'); pk(o, WAY.st(0), f, 'e-501');
          o.cnt = [['RELÓGIO', WHEN[0]], ['NA TABELA', ok ? 'criado' : '…', 'dim'], ['NO STREAM', ok ? '1 evento' : '…', 'dim']];
          o.res = ok ? [['os dois lados dizem criado', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: 'PedidoPago: o UPDATE apaga o criado', yk: '14:02:11.000 · e-502 · e-503',
        code: ["UPDATE pedidos SET status = 'pago'", '  WHERE id = 1047;', 'pedido-1047 v2  e-502 PedidoPago 9.490', 'estoque-GATO-042 v2  e-503', '  EstoqueReservado · 14:02:11.050 · 3 → 2'],
        story: 'Às <b>14:02:11.000</b> o pagamento de 9.490 passa, no cartão. A tabela faz <code>UPDATE … SET status = \'pago\'</code>: o <code>criado</code> deixa de existir. O stream não apaga nada, acrescenta o <b>v2</b>, <code>e-502</code> <code>PedidoPago</code>. Cinquenta milissegundos depois, às 14:02:11.050, o estoque reserva o gato: o <code>e-503</code> <code>EstoqueReservado</code> é fato <b>do estoque</b> e entra como v2 no <code>estoque-GATO-042</code> (3 → 2), e não no stream do pedido.',
        look: 'A linha da tabela troca criado por pago e mostra, em vermelho, o valor que sumiu. No trilho do pedido, o v2 cai ao lado do v1; no do estoque, o v2 do e-503.',
        key: 'O UPDATE substitui; o stream só acrescenta.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1, k = t > 3; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store'); if (k) lit(o, 'stk');
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['pagamento aprovado', 'hi'], ['9.490 · cartão', 'dim']);
          o.rows.tbl = TBL(ok ? 1 : 0, 'acc', ok ? 'criado' : null);
          o.evs = [...kev(k ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...pev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(1), f, 'e-502');
          o.cnt = [['RELÓGIO', k ? '14:02:11.050' : WHEN[1]], ['NA TABELA', ok ? 'pago' : 'criado', 'dim'], ['EVENTOS', `${(ok ? 2 : 1) + (k ? 1 : 0)} de 5`, 'dim']];
          o.res = ok ? [['a tabela perdeu o criado', 'bad'], ['o stream guardou os dois', 'acc']] : [];
          if (k) T(o, [735, 330, 30], 'e-503 é fato do estoque', 'dim'); } },
      { id: 'enviado', dur: 5, title: 'PedidoEnviado: outro UPDATE, outro bloco', yk: '14:30:00 · e-504',
        code: ["UPDATE pedidos SET status = 'enviado',", "  rastreio = 'LA123456789BR' WHERE id = 1047;", 'pedido-1047 v3  e-504 PedidoEnviado', '  rastreio LA123456789BR'],
        story: 'Às <b>14:30:00</b> o pacote sai com o rastreio <code>LA123456789BR</code>. A tabela sobrescreve de novo: <code>pago</code> vira <code>enviado</code>. O stream ganha o <b>v3</b>, <code>e-504</code> <code>PedidoEnviado</code>. Repare na numeração: a versão é <b>por stream</b> (v1, v2, v3), e o <code>evento_id</code> é <b>global</b>, da loja inteira. Por isso o pedido pula do <code>e-502</code> para o <code>e-504</code>: o <code>e-503</code> está no stream do estoque.',
        look: 'O v3 cai no trilho do pedido. Na tabela, pago vira enviado e aparece a linha do rastreio.',
        key: 'Versão conta dentro do stream; evento_id conta na loja inteira.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['pacote despachado', 'hi'], ['LA123456789BR', 'dim']);
          o.rows.tbl = TBL(ok ? 2 : 1, 'acc', ok ? 'pago' : 'criado'); o.evs = [...kev(2), ...pev(ok ? 3 : 2, i => i === 2 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(2), f, 'e-504');
          o.cnt = [['RELÓGIO', WHEN[2]], ['NA TABELA', ok ? 'enviado' : 'pago', 'dim'], ['EVENTOS', `${ok ? 4 : 3} de 5`, 'dim']];
          o.res = ok ? [['v3 no pedido · e-503 no estoque', 'acc']] : []; } },
      { id: 'entregue', dur: 6, title: 'PedidoEntregue: a tabela diz entregue, e só', yk: '19/06 10:40:00 · e-505', act: ['Voltar a 14:15', 'o que a Lena via?'],
        code: ["UPDATE pedidos SET status = 'entregue'", '  WHERE id = 1047;', 'pedido-1047 v4  e-505 PedidoEntregue', 'tabela: 1 linha · 1 INSERT + 3 UPDATE', 'stream: 4 blocos · nenhum apagado'],
        story: 'No dia seguinte, <b>19/06 às 10:40</b>, o gato chega. Terceiro <code>UPDATE</code>: a tabela diz <code>entregue</code> e não guarda mais nada do caminho. O stream ganha o <b>v4</b>, <code>e-505</code> <code>PedidoEntregue</code>, e tem os quatro fatos em ordem. Dobrando os quatro (aplicando um depois do outro, a partir do vazio), sai <code>{status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}</code>: o mesmo estado da tabela, derivado dos fatos.',
        look: 'O v4 completa o trilho do pedido. A tabela mostra só entregue; o histórico de valores sumiu.',
        key: 'O estado atual é consequência dos eventos, não a fonte.',
        f(o, t) { const f = lin(t, 0.4, 2.4, 0, 1), ok = f >= 1; lit(o, 'cmd'); if (ok) lit(o, 'tbl', 'store');
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['entrega confirmada', 'hi'], ['19/06 10:40', 'dim']);
          o.rows.tbl = TBL(ok ? 3 : 2, 'acc', ok ? 'enviado' : 'pago'); o.evs = [...kev(2), ...pev(ok ? 4 : 3, i => i === 3 ? 'acc' : 'hi')];
          bm(o, CAB.tbl, { on: !ok }); bm(o, CAB.st, { on: !ok }); pk(o, WAY.tbl, f, 'UPDATE'); pk(o, WAY.st(3), f, 'e-505');
          o.cnt = [['RELÓGIO', '19/06 10:40'], ['NA TABELA', ok ? 'entregue' : 'enviado', 'dim'], ['EVENTOS', `${ok ? 5 : 4} de 5`, 'dim']];
          o.res = ok ? [['os dois chegam a entregue', 'acc'], ['só um lembra como', 'dim']] : []; } },
      { id: 'as-1415', dur: 7, title: 'O que a Lena via às 14:15?', yk: 'DOBRAR ATÉ 14:15',
        code: ['tabela: SELECT status FROM pedidos', '  WHERE id = 1047  → entregue', 'stream: eventos com ocorrido_em ≤ 14:15', '  v1 PedidoCriado → criado', '  v2 PedidoPago   → pago   (v3 é 14:30)'],
        story: 'Uma pergunta que a tabela não responde: qual era o status do 1047 às <b>14:15</b>? Ela só sabe <code>entregue</code>. Os eventos respondem: dobra-se o stream até a hora pedida. O v1 dá <code>criado</code>, o v2 (14:02:11) dá <code>pago</code>, e o v3 é das 14:30, depois. Resposta: <b><code>pago</code>, versão 2</b>.',
        look: 'No trilho, v1 e v2 acendem e v3 e v4 apagam: são do futuro para as 14:15. A tabela fica vermelha, presa em entregue.',
        key: 'Só os eventos voltam no tempo: às 14:15, pago, versão 2.',
        f(o, t) { const f = lin(t, 0.6, 2.6, 0, 1), ok = f >= 1; lit(o, 'store'); o.on.tbl = 'bad';
          o.rows.tbl = TBL(3, 'bad'); o.rows.tbl.rows.push(['às 14:15? não sabe', 'bad']);
          o.rows.cmd = act('pedidos', 'PERGUNTA', ['status às 14:15?', 'hi']);
          o.evs = [...kev(2, 'dim'), ...pev(4, i => i < 2 ? 'acc' : 'dim')];
          const a = slot('p', 0), b = slot('p', 1); pk(o, P3([[a[0], a[1], 34], [b[0], b[1], 34]]), f, '');
          o.cnt = [['ÀS 14:15', ok ? 'pago' : '…'], ['VERSÃO', ok ? '2' : '…', 'dim'], ['A TABELA', 'entregue', 'bad']];
          o.res = ok ? [['pago, versão 2', 'acc'], ['a tabela só sabe entregue', 'bad']] : [];
          if (ok) T(o, [slot('p', 1)[0], 20, 82], 'às 14:15: pago · v2', 'acc'); } },
      { id: 'perguntas', dur: 7, title: 'Cada lado responde uma pergunta', yk: 'ONDE A LENA VERIA CADA RESPOSTA',
        code: ['"quais pedidos estão enviado agora?"', '  → tabela (índice por status)', '"qual era o status às 14:15?"', '  → eventos (dobrar até a hora)', '"quantas vezes o status mudou?"', '  → eventos (contar os blocos)'],
        story: 'A tabela não perdeu a utilidade. "Quais pedidos estão <code>enviado</code> agora?" é uma consulta com índice por status, rápida, e no stream exigiria dobrar todos os pedidos. Já "qual era o status às 14:15?" e "quantas vezes mudou?" só os eventos respondem. Ter os eventos tem custo: versões, projeções, mais armazenamento (os 50 milhões de pedidos a 4 eventos dão 200 milhões de eventos, ~52,6 GB). Num cadastro que muda pouco e cujo histórico ninguém consulta, esse custo não se paga.',
        look: 'Os dois lados acendem juntos, cada um com a pergunta que responde bem.',
        key: 'O estado responde o agora; os fatos respondem o como e o quando.',
        f(o) { lit(o, 'tbl', 'store'); o.rows.tbl = TBL(3); o.evs = [...kev(2), ...pev(4, 'acc')];
          o.rows.cmd = act('pedidos', 'PERGUNTAS', ['o agora → tabela', 'hi'], ['o como e o quando → eventos', 'hi']);
          o.cnt = [['ENVIADOS AGORA', 'tabela'], ['ÀS 14:15', 'eventos', 'dim'], ['QUANTAS MUDANÇAS', 'eventos', 'dim']];
          o.res = [['cada pergunta tem seu lado', 'acc']];
          T(o, [165, 120, 44], 'o agora', 'acc'); T(o, [735, 110, 30], 'o como e o quando', 'acc'); } },
      { id: 'corrigir', dur: 8, title: 'E se der errado: um evento com o valor errado', yk: 'NÃO SE EDITA: CORRIGE-SE',
        code: ['se o e-502 tivesse gravado o valor errado:', '  UPDATE eventos …     não (imutável)', '  DELETE do v2          não', 'append pedido-1047 v5', '  PagamentoCorrigido (novo fato)', 'toda projeção precisa saber tratá-lo'],
        story: 'Suponha que o <code>PedidoPago</code> tivesse gravado um valor errado. Na tabela, um <code>UPDATE</code> corrigiria e ninguém saberia que houve erro. No stream, o v2 <b>não se edita</b>: ele aconteceu e continua no trilho. A correção é <b>outro fato</b>, um <code>PagamentoCorrigido</code> que entra como v5. A história fica honesta (errou e corrigiu), mas toda projeção que lê o stream precisa saber tratar o evento novo, ou continua mostrando o valor errado.',
        look: 'O v2 fica vermelho e não sai do lugar; um quinto bloco, Corrigido, cai no fim do trilho.',
        key: 'Evento errado não se apaga: grava-se um evento de correção.',
        f(o, t) { const ok = t > 2.2; lit(o, 'store'); o.on.tbl = 2; o.rows.tbl = TBL(3, 'hi');
          o.rows.cmd = act('pedidos', 'CORREÇÃO', ['PagamentoCorrigido', 'hi'], ['(exemplo, sem valor real)', 'dim']);
          o.evs = [...kev(2, 'dim'), ...pev(4, i => i === 1 ? 'bad' : 'hi'), ...(ok ? [ev('p', 4, ['v5', 'novo', 'Corrigido'], 'acc')] : [])];
          bm(o, CAB.st, { on: !ok }); pk(o, WAY.st(4), lin(t, 0.6, 2.2, 0, 1), 'PagamentoCorrigido');
          o.cnt = [['O v2', 'fica', 'bad'], ['CORREÇÃO', ok ? 'v5' : '…', 'dim'], ['PROJEÇÕES', 'precisam tratar', 'dim']];
          o.res = ok ? [['v2 errado continua no trilho', 'bad'], ['o v5 conta a correção', 'acc']] : [];
          T(o, [slot('p', 1)[0], 20, 82], 'imutável', 'bad'); } },
    ],
    agregado: [
      { id: 'cena', dur: 5, title: 'O agregado decide antes de gravar', yk: 'O PEDIDO 1047 EM criado', act: ['Mandar Enviar', 'com o pedido criado'],
        code: ['agregado Pedido · stream pedido-<id>', '  Pagar   → só em criado → PedidoPago', '  Enviar  → só em pago   → PedidoEnviado', 'agregado Estoque · stream estoque-<sku>', '  Reservar → saldo > 0  → EstoqueReservado'],
        story: 'No meio da prancha, o <b>agregado</b> <code>Pedido 1047</code>: a caixa que recebe <b>comandos</b>, confere as regras e, se aceitar, emite <b>eventos</b> no seu stream. Ele acabou de ser criado: status <code>criado</code>, versão 1. As regras são duas: <code>Pagar</code> só em <code>criado</code>, <code>Enviar</code> só em <code>pago</code>. Um agregado é um stream e uma fronteira de consistência: tudo o que muda o 1047 passa por ele, em ordem.',
        look: 'O serviço pedidos à esquerda, o agregado no meio com as regras, e os dois trilhos à direita: o v1 do pedido e o v1 do estoque.',
        key: 'O agregado é quem decide, valida e ordena os eventos de um assunto.',
        f(o) { lit(o, 'agg'); o.evs = [...kev(1), ...pev(1)];
          o.rows.cmd = act('pedidos', 'COMANDOS', ['Pagar · Enviar', 'hi'], ['imperativo: pode ser recusado', 'dim']);
          o.cnt = [['STATUS', 'criado'], ['VERSÃO', '1', 'dim'], ['REGRAS', '2', 'dim']];
          o.res = [['comando entra, evento sai', 'acc']]; } },
      { id: 'recusa', dur: 6, title: 'Enviar com o pedido criado: recusado', yk: 'COMANDO RECUSADO', act: ['Mandar Pagar', '14:02:11.000'],
        code: ['comando Enviar(1047)', 'agregado: rehidrata v1 → status criado', 'regra: Enviar só em pago', '  → recusa', 'nenhum evento gravado · stream fica em v1'],
        story: 'O comando <code>Enviar</code> chega com o 1047 ainda em <code>criado</code>. O agregado carrega o próprio stream (só o v1), vê <code>criado</code> e <b>recusa</b>: nada é gravado e o stream continua na versão 1. A diferença de gramática importa: o comando é um pedido no imperativo, e pode ser negado; o evento é um fato no passado, e quando existe é <b>sempre</b> verdadeiro.',
        look: 'A luz do comando chega ao agregado e ele fica vermelho. O cabo para o trilho não acende; o trilho continua com um bloco só.',
        key: 'Comando pode ser recusado; evento é o que já aconteceu.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = f >= 1; lit(o, 'cmd'); o.on.agg = no ? 'bad' : 1; o.evs = [...kev(1), ...pev(1)];
          o.rows.cmd = act('pedidos', 'COMANDO', ['Enviar(1047)', 'hi']);
          o.rows.agg = AGG(0, [no ? 'Enviar: só em pago' : 'Pagar: só em criado', no ? 'bad' : 'dim'], [no ? 'RECUSADO' : 'Enviar: só em pago', no ? 'bad' : 'dim']);
          bm(o, CAB.ca, { on: !no, tone: no ? 'bad' : '' }); pk(o, WAY.ca, f, 'Enviar');
          o.cnt = [['COMANDO', 'Enviar'], ['STATUS', 'criado', 'dim'], ['EVENTOS NOVOS', no ? '0' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['recusado: o pedido não foi pago', 'bad'], ['o stream fica em v1', 'dim']] : [];
          if (no) T(o, [440, 300, 44], 'recusado', 'bad'); } },
      { id: 'pagar', dur: 6, title: 'Pagar em criado: aceito, PedidoPago v2', yk: '14:02:11.000 · e-502',
        code: ['comando Pagar(1047, 9.490, cartão)', 'agregado: status criado → regra ok', 'emite PedidoPago', 'append pedido-1047 v2 · e-502', 'status pago · versão 2'],
        story: 'Às <b>14:02:11.000</b> o <code>pagamentos</code> avisa que os 9.490 passaram, e o <code>pedidos</code> manda <code>Pagar</code>. Agora a regra fecha: o status é <code>criado</code>. O agregado emite <code>PedidoPago</code>, que entra no stream como <b>v2</b> com o <code>evento_id</code> <code>e-502</code> (o mesmo do módulo 6, guardado nos metadados). O <code>PedidoPago</code> é fato do <b>pedido</b>: quem registra é o dono do stream <code>pedido-1047</code>.',
        look: 'O comando passa pelo agregado, que acende, e o v2 cai no trilho do pedido.',
        key: 'Regra cumprida, evento gravado: o agregado avança uma versão.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3.2, 0, 1), ok = f2 >= 1; lit(o, 'cmd', 'agg'); if (ok) lit(o, 'store');
          o.rows.cmd = act('pedidos', 'COMANDO', ['Pagar(1047)', 'hi'], ['9.490 · cartão', 'dim']);
          o.rows.agg = AGG(ok ? 1 : 0, ['Pagar em criado: ok', 'acc'], [ok ? 'emitiu PedidoPago' : 'emitindo…', ok ? 'acc' : 'dim']);
          o.evs = [...kev(1), ...pev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          bm(o, CAB.ca, { on: f1 < 1 }); bm(o, CAB.as, { on: f1 >= 1 && !ok }); pk(o, WAY.ca, f1, 'Pagar'); pk(o, WAY.as(1), f2, 'e-502');
          o.cnt = [['STATUS', ok ? 'pago' : 'criado'], ['VERSÃO', ok ? '2' : '1', 'dim'], ['EVENTO', ok ? 'e-502' : '…', 'dim']];
          o.res = ok ? [['PedidoPago · v2', 'acc']] : []; } },
      { id: 'estoque', dur: 6, title: 'Outro agregado: o estoque do gato', yk: '14:02:11.050 · e-503',
        code: ['comando Reservar(GATO-042, 1, pedido 1047)', 'agregado Estoque: rehidrata v1 → saldo 3', 'regra: saldo > 0 → ok', 'append estoque-GATO-042 v2 · e-503', 'saldo 3 → 2'],
        story: 'O estoque é <b>outro</b> agregado, com outro stream. O comando <code>Reservar</code> 1 gato para o pedido 1047 chega a ele; o saldo é 3 (o v1, +3), a regra "saldo maior que zero" passa, e às <b>14:02:11.050</b> ele grava <code>EstoqueReservado</code>, <code>e-503</code>, como <b>v2</b> do <code>estoque-GATO-042</code>: saldo 3 → 2. Com saldo 0, o mesmo comando seria recusado. Cada agregado é pequeno: <b>um</b> pedido, <b>um</b> SKU.',
        look: 'A caixa do meio vira o agregado Estoque GATO-042; a luz vai para o trilho de baixo e o v2 do estoque acende.',
        key: 'Um agregado por assunto pequeno: o pedido no seu stream, o SKU no dele.',
        f(o, t) { const f = lin(t, 0.6, 2.4, 0, 1), ok = f >= 1; lit(o, 'agg'); if (ok) lit(o, 'stk');
          o.rows.agg = act('Estoque GATO-042', 'AGREGADO', [`saldo ${ok ? 2 : 3} · versão ${ok ? 2 : 1}`, 'hi'], ['Reservar: só com saldo > 0', 'acc'], [ok ? 'emitiu EstoqueReservado' : 'saldo 3: ok', ok ? 'acc' : 'dim']);
          o.rows.cmd = act('estoque', 'COMANDO', ['Reservar(GATO-042, 1)', 'hi'], ['pedido 1047', 'dim']);
          o.evs = [...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...pev(2)];
          bm(o, CAB.ak, { on: !ok }); pk(o, WAY.ak(1), f, 'e-503');
          o.cnt = [['SALDO', ok ? '2' : '3'], ['VERSÃO', ok ? '2' : '1', 'dim'], ['RECUSA SE', 'saldo 0', 'dim']];
          o.res = ok ? [['EstoqueReservado · v2 · 3 → 2', 'acc']] : []; } },
      { id: 'enviar', dur: 6, title: 'Enviar em pago: aceito, PedidoEnviado v3', yk: '14:30:00 · e-504',
        code: ['comando Enviar(1047, LA123456789BR)', 'agregado: status pago → regra ok', 'emite PedidoEnviado', 'append pedido-1047 v3 · e-504', 'status enviado · versão 3'],
        story: 'O mesmo comando que foi recusado no começo volta às <b>14:30:00</b>, agora com o pedido em <code>pago</code>. A regra passa, e o agregado emite <code>PedidoEnviado</code> com o rastreio <code>LA123456789BR</code>: <b>v3</b>, <code>e-504</code>. A ordem do stream é a ordem em que o agregado decidiu.',
        look: 'O agregado volta a ser o Pedido 1047, acende, e o v3 cai no trilho.',
        key: 'O mesmo comando, em outro estado, tem outra resposta.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3.2, 0, 1), ok = f2 >= 1; lit(o, 'cmd', 'agg'); if (ok) lit(o, 'store');
          o.rows.cmd = act('pedidos', 'COMANDO', ['Enviar(1047)', 'hi'], ['LA123456789BR', 'dim']);
          o.rows.agg = AGG(ok ? 2 : 1, ['Enviar em pago: ok', 'acc'], [ok ? 'emitiu PedidoEnviado' : 'emitindo…', ok ? 'acc' : 'dim']);
          o.evs = [...kev(2), ...pev(ok ? 3 : 2, i => i === 2 ? 'acc' : 'hi')];
          bm(o, CAB.ca, { on: f1 < 1 }); bm(o, CAB.as, { on: f1 >= 1 && !ok }); pk(o, WAY.ca, f1, 'Enviar'); pk(o, WAY.as(2), f2, 'e-504');
          o.cnt = [['STATUS', ok ? 'enviado' : 'pago'], ['VERSÃO', ok ? '3' : '2', 'dim'], ['EVENTO', ok ? 'e-504' : '…', 'dim']];
          o.res = ok ? [['PedidoEnviado · v3', 'acc']] : []; } },
      { id: 'grande', dur: 8, title: 'E se der errado: o agregado grande demais', yk: 'UM STREAM PARA A LOJA INTEIRA',
        code: ['stream estoque-loja: todos os SKUs', '  30 comandos/s disputam a próxima versão', '  um passa, os outros: conflito e retry', 'conserto: um stream por SKU', '  caneca na Black Friday: 6 comandos/s'],
        story: 'Suponha que o estoque fosse <b>um</b> agregado só, <code>estoque-loja</code>, com todos os SKUs. Os 30 pedidos/s da Black Friday viram 30 comandos/s no <b>mesmo</b> stream, todos querendo gravar a próxima versão. Só um passa por vez; os outros recebem conflito, releem e tentam de novo (a trava da aula 4), e o stream vira fila. Com um stream <b>por SKU</b>, o mais quente, a caneca azul com ~20% dos pedidos, recebe 6 comandos/s. E há o outro erro: se a regra do agregado estiver errada, o evento que ela deixou passar é "verdadeiro" para sempre.',
        look: 'O trilho de baixo vira estoque-loja e uma pilha vermelha de comandos espera na frente dele.',
        key: 'Agregado grande vira fila: um stream por SKU, nunca um para a loja.',
        f(o, t) { const m = lin(t, 0.4, 4.4, 0, 1); lit(o, 'cmd'); o.on.agg = 'bad'; o.on.stk = 'bad';
          o.rows.stk = STK('estoque-loja');
          o.rows.agg = act('Estoque loja', 'AGREGADO', ['todos os SKUs', 'bad'], ['um stream só', 'bad'], ['30 comandos/s', 'bad']);
          o.rows.cmd = act('pedidos', 'BLACK FRIDAY', ['30 pedidos/s', 'hi'], ['30 Reservar/s', 'dim']);
          o.evs = [...pev(3), ev('k', 0, ['v…', 'GATO', '−1'], 'hi'), ev('k', 1, ['v…', 'CANECA', '−1'], 'hi'), ev('k', 2, ['v…', '…', '−1'], 'bad')];
          o.piles = m > 0 ? [{ p: [440, 340, PL + 8], f: m, v: '30/s' }] : [];
          bm(o, CAB.ca, { on: true, flow: true }); bm(o, CAB.ak, { on: true, flow: true, tone: 'bad' });
          o.cnt = [['NUM STREAM SÓ', '30 comandos/s', 'bad'], ['POR SKU (CANECA)', '6 comandos/s', 'dim'], ['CONSERTO', 'stream por SKU', 'dim']];
          o.res = m >= 1 ? [['um stream só vira fila', 'bad'], ['um por SKU: 6/s na caneca', 'acc']] : [['enchendo…', 'dim']];
          T(o, [735, 330, 30], 'todos querem a próxima versão', 'bad'); } },
    ],
    store: [
      { id: 'tabela', dur: 5, title: 'A tabela eventos: só acréscimo, em ordem por versão', yk: 'PostgreSQL 14 · SELECT', act: ['Gravar com versão velha', 'esperada 2'],
        code: ['SELECT versao, evento_id, tipo FROM eventos', "  WHERE stream_id = 'pedido-1047' ORDER BY versao;", ' 1 | e-501 | PedidoCriado', ' 2 | e-502 | PedidoPago', ' 3 | e-504 | PedidoEnviado', ' 4 | e-505 | PedidoEntregue'],
        story: 'O Event Store é uma tabela de <b>só acréscimo</b>: <code>eventos(id, stream_id, versao, evento_id, tipo, dados jsonb, metadados jsonb, ocorrido_em)</code>, com duas restrições: <code>UNIQUE (evento_id)</code> e <code>eventos_stream_versao UNIQUE (stream_id, versao)</code>. O stream do 1047 foi gravado no PostgreSQL 14 com quatro chamadas a <code>append_evento</code>, cada uma com a <b>versão esperada</b> (0, 1, 2, 3), e o <code>SELECT</code> devolveu os quatro em ordem. A função lê <code>MAX(versao)</code>, recusa se for diferente da esperada e insere <code>versao + 1</code>.',
        look: 'À esquerda, as linhas da tabela eventos; no meio, a função append_evento; à direita, os dois trilhos.',
        key: 'Um log de só acréscimo, um stream por agregado, em ordem por versão.',
        f(o) { lit(o, 'tbl', 'store'); o.evs = [...pev(4, 'acc'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1])];
          o.cnt = [['STREAM', 'pedido-1047'], ['VERSÕES', '1 a 4', 'dim'], ['RESTRIÇÕES', '2 UNIQUE', 'dim']];
          o.res = [['4 linhas, em ordem', 'acc']]; } },
      { id: 'velha', dur: 6, title: 'Versão esperada velha: Concurrency conflict', yk: 'ERRO DA FUNÇÃO', act: ['Repetir o e-502', 'com a versão certa'],
        code: ["append_evento('pedido-1047', 'e-502', …, 2)", '  MAX(versao) = 4', 'ERROR: Concurrency conflict:', '  expected version 2, but current is 4'],
        story: 'Quem decidiu com base na versão 2 está atrasado: o stream já está na 4. A chamada <code>append_evento(\'pedido-1047\', \'e-502\', …, 2)</code> lê <code>MAX(versao) = 4</code> e recusa com a mensagem da própria função: <code>ERROR: Concurrency conflict: expected version 2, but current is 4</code>. É a <b>concorrência otimista</b>: ninguém trava o stream para decidir, mas quem decidiu com dados velhos não grava.',
        look: 'A luz chega à função, que fica vermelha. Nenhum bloco novo entra no trilho.',
        key: 'Versão esperada velha: a função recusa e nada é gravado.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = f >= 1; lit(o, 'cmd', 'store'); o.on.agg = no ? 'bad' : 1; o.evs = [...pev(4), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1])];
          o.rows.cmd = act('psql', 'SESSÃO', ["append_evento(", 'hi'], ["  'pedido-1047', 'e-502',", 'dim'], ['  …, 2)', 'hi']);
          o.rows.agg = act('append_evento', 'FUNÇÃO', ['MAX(versao) = 4', 'hi'], ['esperada 2 ≠ 4', no ? 'bad' : 'hi'], [no ? 'RAISE EXCEPTION' : '…', no ? 'bad' : 'dim']);
          bm(o, CAB.ca, { on: !no, tone: no ? 'bad' : '' }); pk(o, WAY.ca, f, 'esperada 2');
          o.cnt = [['ESPERADA', '2'], ['ATUAL', '4', 'dim'], ['GRAVADO', no ? 'nada' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['Concurrency conflict', 'bad'], ['expected version 2, but current is 4', 'bad']] : [];
          if (no) T(o, [440, 300, 44], 'Concurrency conflict', 'bad'); } },
      { id: 'repetido', dur: 6, title: 'O mesmo e-502 de novo: eventos_evento_id_key', yk: 'ERRO DO UNIQUE (evento_id)', act: ['Dois Reservar', 'ao mesmo tempo'],
        code: ["append_evento('pedido-1047', 'e-502', …, 4)", '  versão ok → tenta inserir v5', 'ERROR: duplicate key value violates', '  unique constraint "eventos_evento_id_key"', 'DETAIL: Key (evento_id)=(e-502)', '  already exists.'],
        story: 'Agora com a versão certa, 4. A função aceita e tenta gravar o v5, mas o <code>evento_id</code> é o mesmo <code>e-502</code> que já está no v2: o <code>e-502</code> duplicado do módulo 6, chegando outra vez. O <code>UNIQUE (evento_id)</code> barra: <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code>, <code>DETAIL: Key (evento_id)=(e-502) already exists.</code> O mesmo fato não entra duas vezes no Store.',
        look: 'Um bloco v5 com e-502 desce sobre o trilho, fica vermelho e some. O v2, o e-502 original, acende em vermelho.',
        key: 'O UNIQUE (evento_id) impede que o mesmo fato seja gravado duas vezes.',
        f(o, t) { const f = lin(t, 0.4, 2, 0, 1), no = t > 2.4, gone = t > 3.8; lit(o, 'cmd', 'store', 'tbl'); o.on.agg = no ? 'bad' : 1;
          o.rows.cmd = act('psql', 'SESSÃO', ["append_evento(", 'hi'], ["  'pedido-1047', 'e-502',", 'dim'], ['  …, 4)', 'hi']);
          o.rows.agg = act('append_evento', 'FUNÇÃO', ['MAX(versao) = 4', 'hi'], ['esperada 4: ok', 'acc'], [no ? 'INSERT v5: duplicate key' : 'INSERT v5…', no ? 'bad' : 'hi']);
          o.rows.tbl.rows[2] = ['pedido-1047 · 2 · e-502', no ? 'bad' : 'hi']; o.rows.tbl.rows[5] = ['UNIQUE (evento_id)', 'acc'];
          o.evs = [...pev(4, i => i === 1 && no ? 'bad' : 'hi'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]),
            ...(f >= 1 && !gone ? [ev('p', 4, ['v5', 'e-502', 'Pago'], no ? 'bad' : 'pend')] : [])];
          bm(o, CAB.ca, { on: f < 0.5 }); bm(o, CAB.as, { on: f >= 0.5 && f < 1 }); pk(o, WAY.ca, f * 2, 'e-502'); pk(o, WAY.as(4), f * 2 - 1, '');
          o.cnt = [['evento_id', 'e-502'], ['JÁ ESTÁ EM', 'v2', 'dim'], ['GRAVADO', no ? 'nada' : '…', no ? 'bad' : 'dim']];
          o.res = no ? [['duplicate key: eventos_evento_id_key', 'bad'], ['Key (evento_id)=(e-502)', 'bad']] : [];
          if (no) T(o, [slot('p', 4)[0], 20, 82], 'e-502 já existe', 'bad'); } },
      { id: 'corrida', dur: 7, title: 'Dois Reservar com versão esperada 2: o B espera', yk: 'pg_stat_activity',
        code: ['A: BEGIN; append_evento(…, 2);', '   pg_sleep(2); COMMIT;', 'B (0,5 s depois): append_evento(…, 2)', 'A → Timeout / PgSleep', 'B → Lock / transactionid'],
        story: 'A corrida de verdade, no <code>estoque-GATO-042</code> em v2. A sessão <b>A</b> abre uma transação, chama <code>append_evento(…, 2)</code> e dorme 2 s antes do <code>COMMIT</code>. Meio segundo depois, a sessão <b>B</b> chama o mesmo, também com esperada 2. As duas leram <code>MAX(versao) = 2</code> (o v3 de A ainda não foi confirmado), as duas passaram na conferência e as duas tentam o v3. O <code>pg_stat_activity</code> mostrou A em <code>Timeout / PgSleep</code> e B em <b><code>Lock / transactionid</code></b>: B está parada no índice único, esperando A.',
        look: 'O v3 de A está no trilho com contorno tracejado (não confirmado). O v3 de B paira acima dele, esperando.',
        key: 'A conferência da função não bastou: as duas leram 2.',
        f(o, t) { const s = lin(t, 0.3, 4.3, 0, 2), b = s >= 0.5; lit(o, 'cmd', 'agg', 'stk');
          o.rows.cmd = act('psql', 'DUAS SESSÕES', ['A: append(…, 2) · dorme 2 s', 'acc'], [b ? 'B: append(…, 2) · espera' : 'B: em 0,5 s', b ? 'hi' : 'dim']);
          o.rows.agg = act('append_evento', 'A e B', ['as duas: MAX = 2', 'hi'], ['esperada 2: ok', 'acc'], ['as duas tentam v3', 'hi']);
          o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · e-lab-A', 'acc'], ['  (A: não confirmado)', 'dim'], ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'e-lab-A', 'A'], 'pend'),
            ...(b ? [ev('k', 2, ['v3', 'B', 'espera'], 'wait', 0, 26)] : [])];
          bm(o, CAB.ak, { on: true, flow: true });
          o.cnt = [['A', 'PgSleep'], ['B', b ? 'Lock / transactionid' : '…', b ? 'bad' : 'dim'], ['TEMPO DE A', `${dec(s)} s`, 'dim']];
          o.res = b ? [['B espera A no índice único', 'acc']] : [['A gravou v3, sem COMMIT', 'dim']];
          if (b) T(o, [slot('k', 2)[0], 236, 64], 'B espera', 'dim'); } },
      { id: 'falha', dur: 7, title: 'A confirma; B falha em eventos_stream_versao', yk: 'ERRO DO UNIQUE (stream_id, versao)',
        code: ['A: COMMIT', 'B: ERROR: duplicate key value violates', '  unique constraint "eventos_stream_versao"', 'DETAIL: Key (stream_id, versao)=', '  (estoque-GATO-042, 3) already exists.', 'v1 e-lab-0 · v2 e-503 · v3 e-lab-A'],
        story: 'Quando A confirma, B acorda e falha com <code>ERROR: duplicate key value violates unique constraint "eventos_stream_versao"</code>, <code>DETAIL: Key (stream_id, versao)=(estoque-GATO-042, 3) already exists.</code> Repare: <b>não</b> é a mensagem amigável da função. Quem segurou a corrida foi a restrição do banco, não a conferência de <code>MAX(versao)</code>. O stream ficou com v1 <code>e-lab-0</code>, v2 <code>e-503</code>, v3 <code>e-lab-A</code>. B precisa <b>reler</b> o stream (agora em v3) e decidir de novo: o retry é de quem chamou.',
        look: 'O v3 de A fica sólido. O bloco de B fica vermelho, sobe e sai do trilho.',
        key: 'A trava é o UNIQUE (stream_id, versao); o retry é do chamador.',
        f(o, t) { const no = t > 1, gone = t > 3.6; lit(o, 'cmd', 'stk'); o.on.agg = no ? 'bad' : 1;
          o.rows.cmd = act('psql', 'DUAS SESSÕES', ['A: COMMIT', 'acc'], [no ? 'B: duplicate key' : 'B: espera…', no ? 'bad' : 'hi'], [no ? 'B: relê e decide de novo' : '', 'dim']);
          o.rows.agg = act('append_evento', 'A e B', ['A: v3 confirmado', 'acc'], [no ? 'B: eventos_stream_versao' : 'B: esperando', no ? 'bad' : 'hi']);
          o.rows.tbl = small(act('eventos', 'EVENT STORE', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · e-lab-A', 'acc'], ['UNIQUE (stream_id, versao)', 'acc']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'e-lab-A', 'A'], 'acc'),
            ...(gone ? [] : [ev('k', 2, ['v3', 'B', no ? 'falhou' : 'espera'], no ? 'bad' : 'wait', 0, no ? 26 + (t - 1) * 20 : 26)])];
          o.cnt = [['A', 'v3 confirmado'], ['B', no ? 'duplicate key' : '…', no ? 'bad' : 'dim'], ['O STREAM', 'v1 · v2 · v3', 'dim']];
          o.res = no ? [['eventos_stream_versao', 'bad'], ['B relê o stream e tenta de novo', 'acc']] : [];
          if (no && !gone) T(o, [slot('k', 2)[0], 236, 80], 'duplicate key', 'bad'); } },
      { id: 'sem-unique', dur: 8, title: 'E se der errado: a trava só na aplicação', yk: 'SEM O UNIQUE (stream_id, versao)',
        code: ['A lê MAX(versao) = 2 → insere v3', 'B lê MAX(versao) = 2 → insere v3', 'sem a restrição: as duas passam', 'estoque-GATO-042: duas versões 3', 'qual veio antes? o stream não sabe'],
        story: 'Tire o <code>UNIQUE (stream_id, versao)</code> e deixe só a conferência da função (ou do código, como o <code>tx.go</code> do lab do autor, que lê <code>COALESCE(MAX(version), 0)</code> e insere <code>version + 1</code>). As duas sessões leem 2 e as duas gravam <b>v3</b>: o stream passa a ter <b>duas versões 3</b>. A ordem, que era a garantia central do Store, deixa de existir, e se o saldo fosse 1 os dois comandos teriam reservado a mesma última unidade. A conferência na aplicação não é trava; a restrição é.',
        look: 'Dois blocos v3 empilhados no trilho do estoque, os dois em vermelho.',
        key: 'Sem o UNIQUE, a mesma versão entra duas vezes e o stream perde a ordem.',
        f(o, t) { const two = t > 1.6; lit(o, 'cmd'); o.on.agg = 'bad'; o.on.stk = two ? 'bad' : 1;
          o.rows.cmd = act('psql', 'DUAS SESSÕES', ['A: MAX = 2 → v3', 'hi'], ['B: MAX = 2 → v3', 'hi']);
          o.rows.agg = act('append_evento', 'SEM UNIQUE', ['A e B leem 2', 'hi'], ['as duas inserem v3', 'bad'], ['nada barra', 'bad']);
          o.rows.tbl = small(act('eventos', 'SEM A RESTRIÇÃO', ['eventos', 'tbl'], ['estoque-GATO-042 · 1 · e-lab-0', 'hi'], ['estoque-GATO-042 · 2 · e-503', 'hi'],
            ['estoque-GATO-042 · 3 · A', 'bad'], [two ? 'estoque-GATO-042 · 3 · B' : '', 'bad'], ['UNIQUE (stream_id, versao): —', 'bad']), 12.5, 16, 37);
          o.evs = [...pev(4, 'dim'), ev('k', 0, ['v1', 'e-lab-0', '+3']), ev('k', 1, KE[1]), ev('k', 2, ['v3', 'A', '−1'], two ? 'bad' : 'acc'),
            ev('k', 2, ['v3', 'B', '−1'], two ? 'bad' : 'wait', 1, two ? 0 : lin(t, 0, 1.6, 30, 0))];
          bm(o, CAB.ak, { on: true, flow: !two, tone: two ? 'bad' : '' });
          o.cnt = [['VERSÕES 3', two ? '2' : '1', two ? 'bad' : ''], ['A ORDEM', two ? 'perdida' : '…', two ? 'bad' : 'dim'], ['A TRAVA', 'só no código', 'bad']];
          o.res = two ? [['duas v3 no mesmo stream', 'bad'], ['a trava é a restrição', 'acc']] : [];
          if (two) T(o, [slot('k', 2)[0], 236, 62], 'duas v3', 'bad'); } },
    ],
    bus: [
      { id: 'cena', dur: 5, title: 'O Store é a fonte; o bus leva as consequências', yk: 'QUEM LÊ, QUEM PUBLICA', act: ['Publicar o e-501', 'pela posição'],
        code: ['Event Store: pedido-1047 (fonte da verdade)', 'publisher: lê o Store depois da posição', 'bus: Kafka, tópico pedidos', '  chave pedido_id → mesma partição', 'consumidor: estoque (grava no estoque-GATO-042)'],
        story: 'O Event Store guarda os fatos; quem leva os fatos para fora é outra peça. O <b>publisher</b> lê o Store em ordem, a partir da <b>posição</b> do último evento que já publicou, e manda cada um para o <b>bus</b> (aqui o Kafka, tópico <code>pedidos</code>, chave <code>pedido_id</code>). Quem escuta, como o <code>estoque</code>, reage e grava os próprios fatos no próprio stream. O bus não é o Store: o tópico do módulo 13 guarda 7 dias, e o Store guarda para sempre.',
        look: 'O trilho do pedido-1047 tem o v1. Um cabo sai dele para o publisher, outro do publisher para o bus, e um terceiro do bus para o estoque.',
        key: 'O Store é a fonte da verdade; o bus é o caminho das consequências.',
        f(o) { lit(o, 'store', 'pub'); o.evs = [...pev(1, 'acc'), ...kev(1)];
          o.cnt = [['NO STORE', 'v1 · e-501'], ['POSIÇÃO', 'nenhum', 'dim'], ['NO BUS', 'nada', 'dim']];
          o.res = [['falta publicar o e-501', 'dim']]; } },
      { id: 'publica', dur: 6, title: 'O publisher publica o e-501 e avança a posição', yk: 'POSIÇÃO: nenhum → v1',
        code: ['lê pedido-1047 depois da posição', '  → v1 e-501 PedidoCriado', 'publish(chave 1047, e-501)', 'posição = v1 (e-501)'],
        story: 'O publisher olha a posição (nada publicado ainda), encontra o v1 e publica o <code>e-501</code> no tópico <code>pedidos</code>, com a chave <code>1047</code>. Só depois de o broker confirmar, ele <b>avança</b> a posição para o v1. Se cair antes disso, volta a publicar o mesmo evento: a entrega é <b>pelo menos uma vez</b>.',
        look: 'A luz sai do v1, passa pelo publisher e entra no bus; a primeira célula do tópico acende.',
        key: 'Publicar e depois avançar a posição: nada se perde, algo pode repetir.',
        f(o, t) { const f1 = lin(t, 0.4, 1.8, 0, 1), f2 = lin(t, 1.8, 3, 0, 1), ok = f2 >= 1; lit(o, 'store', 'pub'); if (ok) lit(o, 'bus');
          o.evs = [...pev(1, 'acc'), ...kev(1)];
          o.rows.pub = act('publisher', 'POSIÇÃO', [ok ? 'último publicado: v1 · e-501' : 'último publicado: nenhum', ok ? 'acc' : 'hi'], ['lê o Store em ordem', 'dim']);
          o.rows.bus = BUS(BTAPE(ok ? 1 : 0));
          bm(o, CAB.sp, { on: f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !ok }); pk(o, WAY.sp(0), f1, 'e-501'); pk(o, WAY.pb, f2, '');
          o.cnt = [['POSIÇÃO', ok ? 'v1' : 'nenhum'], ['NO BUS', ok ? 'e-501' : '…', 'dim'], ['CHAVE', '1047', 'dim']];
          o.res = ok ? [['e-501 no tópico pedidos', 'acc']] : []; } },
      { id: 'reage', dur: 7, title: 'PedidoPago: o estoque escuta e reserva', yk: '14:02:11.000 → 14:02:11.050',
        code: ['14:02:11.000  pedido-1047 v2 · e-502', 'publisher → bus · chave 1047', 'estoque consome e-502', '14:02:11.050  estoque-GATO-042 v2 · e-503', '  saldo 3 → 2'],
        story: 'Às <b>14:02:11.000</b> o <code>PedidoPago</code> (<code>e-502</code>) entra no Store como v2. O publisher o leva ao bus, o <code>estoque</code> consome e, às <b>14:02:11.050</b>, grava <code>EstoqueReservado</code> (<code>e-503</code>) no <b>seu</b> stream, o <code>estoque-GATO-042</code>: saldo 3 → 2. São dois Stores, um por serviço, ligados pelo bus. No exemplo do artigo é o mesmo desenho: uma conta nova vira saldo num serviço e extrato em outro.',
        look: 'O v2 do pedido cai no trilho, segue pelo publisher e pelo bus, desce para o trilho do estoque e acende o v2 dele.',
        key: 'Quem escuta o bus grava os próprios fatos no próprio stream.',
        f(o, t) { const a = t > 0.6, f1 = lin(t, 0.8, 2, 0, 1), f2 = lin(t, 2, 3, 0, 1), f3 = lin(t, 3, 4.2, 0, 1), inB = f2 >= 1, ok = f3 >= 1;
          lit(o, 'store', 'pub'); if (inB) lit(o, 'bus'); if (ok) lit(o, 'stk');
          o.evs = [...pev(a ? 2 : 1, i => i === 1 ? 'acc' : 'hi'), ...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          o.rows.cmd = act('pedidos', 'SERVIÇO', ['Pagar(1047) · COMMIT v2', 'hi']);
          o.rows.pub = act('publisher', 'POSIÇÃO', [`último publicado: ${f1 >= 1 ? 'v2 · e-502' : 'v1 · e-501'}`, 'acc'], ['lê o Store em ordem', 'dim']);
          o.rows.bus = BUS(BTAPE(inB ? 2 : 1, 'ok'));
          bm(o, CAB.st, { on: !a }); bm(o, CAB.sp, { on: a && f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !inB }); bm(o, CAB.bk, { on: inB && !ok });
          pk(o, WAY.st(1), lin(t, 0, 0.6, 0, 1), 'COMMIT v2'); pk(o, WAY.sp(1), f1, 'e-502'); pk(o, WAY.pb, f2, ''); pk(o, WAY.bk(1), f3, 'e-503');
          o.cnt = [['RELÓGIO', ok ? '14:02:11.050' : '14:02:11.000'], ['POSIÇÃO', f1 >= 1 ? 'v2' : 'v1', 'dim'], ['SALDO GATO-042', ok ? '2' : '3', 'dim']];
          o.res = ok ? [['o estoque reservou: 3 → 2', 'acc']] : []; } },
      { id: 'ordem', dur: 6, title: 'Chave pedido_id: a ordem do stream chega inteira', yk: 'UMA CHAVE, UMA PARTIÇÃO', act: ['Derrubar o publisher', 'depois do COMMIT'],
        code: ['publish(chave 1047, e-504)   14:30:00', 'publish(chave 1047, e-505)   19/06 10:40', 'mesma chave → mesma partição (módulo 13)', 'ordem no tópico: e-501 e-502 e-504 e-505', 'entrega: pelo menos uma vez'],
        story: 'O <code>e-504</code> (14:30) e o <code>e-505</code> (19/06 10:40) seguem o mesmo caminho. Como todos levam a chave <code>1047</code>, caem na mesma partição (módulo 13) e chegam na ordem do stream: v1, v2, v3, v4. O bus preserva a ordem <b>por stream</b>, não a da loja inteira, e entrega <b>pelo menos uma vez</b>: o consumidor precisa ser idempotente (aula 10).',
        look: 'As quatro células do tópico acendem na ordem dos blocos do trilho.',
        key: 'Chave = pedido_id: a ordem de um stream vale também no bus.',
        f(o, t) { const n = Math.min(4, 2 + Math.floor(lin(t, 0.4, 3.4, 0, 2.99))); lit(o, 'store', 'pub', 'bus');
          o.evs = [...pev(4, i => i < n ? 'acc' : 'hi'), ...kev(2)];
          o.rows.pub = act('publisher', 'POSIÇÃO', [`último publicado: v${n} · ${PE[n - 1][1]}`, 'acc'], ['lê o Store em ordem', 'dim']);
          o.rows.bus = BUS(BTAPE(n), ['chave 1047 → mesma partição', 'dim']);
          bm(o, CAB.sp, { on: n < 4, flow: n < 4 }); bm(o, CAB.pb, { on: n < 4, flow: n < 4 });
          o.cnt = [['NO TÓPICO', `${n} de 4`], ['CHAVE', '1047', 'dim'], ['ORDEM', 'a do stream', 'dim']];
          o.res = n >= 4 ? [['v1 · v2 · v3 · v4, em ordem', 'acc']] : [['publicando…', 'dim']]; } },
      { id: 'cai', dur: 7, title: 'E se der errado: o publisher cai entre o commit e a publicação', yk: 'ESCRITA DUPLA (lab do autor)', act: ['Religar o publisher', 'ele lê a posição'],
        code: ['14:02:11.000  COMMIT pedido-1047 v2 · e-502', '  o publisher cai antes de publicar', 'bus: só o e-501', 'estoque: nunca vê o e-502', '  GATO-042 fica em 3'],
        story: 'Volte às <b>14:02:11.000</b>: o v2 (<code>e-502</code>) acabou de ser confirmado no Store e o publisher <b>cai</b> antes de publicar. O fato existe, mas não saiu: o bus só tem o <code>e-501</code>, o <code>estoque</code> nunca vê o pagamento e o gato fica em 3, sem reserva. É a escrita dupla do módulo 18. O lab do autor tem esse desenho: o README diz que "a publicação em Kafka é feita após o commit", e quem recupera o que faltou é a rehidratação, disparada à mão.',
        look: 'O v2 está no trilho, aceso. O publisher fica vermelho; o bus tem uma célula só e o estoque não ganha o v2.',
        key: 'Confirmado no Store e não publicado: o fato existe e ninguém fica sabendo.',
        f(o, t) { const dead = t > 1.2; lit(o, 'store'); o.on.pub = dead ? 'bad' : 1; o.on.stk = dead ? 'bad' : 0;
          o.evs = [...pev(2, i => i === 1 ? 'acc' : 'hi'), ...kev(1, dead ? 'bad' : 'hi')];
          o.rows.pub = act('publisher', 'CAIU', ['último publicado: v1 · e-501', 'hi'], [dead ? 'caiu antes de publicar o v2' : 'lendo v2…', dead ? 'bad' : 'dim']);
          o.rows.bus = BUS(BTAPE(1)); o.rows.stk = STK();
          bm(o, CAB.sp, { on: !dead, tone: dead ? 'bad' : '' }); if (!dead) pk(o, WAY.sp(1), lin(t, 0.2, 1.2, 0, 0.6), 'e-502');
          o.cnt = [['NO STORE', 'v2 · e-502'], ['NO BUS', 'só e-501', dead ? 'bad' : 'dim'], ['SALDO GATO-042', dead ? '3 (sem reserva)' : '3', dead ? 'bad' : 'dim']];
          o.res = dead ? [['no Store, fora do bus', 'bad'], ['o estoque não reserva', 'bad']] : [];
          if (dead) T(o, [440, 300, 40], 'publisher caiu', 'bad'); } },
      { id: 'recupera', dur: 7, title: 'O publisher volta e se recupera pela posição', yk: 'POSIÇÃO: v1 → v2',
        code: ['publisher volta · posição = v1 (e-501)', 'lê pedido-1047 depois de v1 → v2 e-502', 'publish(chave 1047, e-502)', 'estoque: e-503 · saldo 3 → 2', 'se já tinha saído: e-502 duas vezes'],
        story: 'Ao voltar, o publisher não confia na memória: lê a <b>posição</b> que gravou (v1) e pede ao <b>próprio Store</b> tudo o que veio depois. Acha o v2 e publica o <code>e-502</code>; o estoque reserva, 3 → 2. Se o publisher tivesse publicado e caído antes de gravar a posição, o <code>e-502</code> sairia <b>duas vezes</b>: por isso o consumidor precisa ser idempotente (aula 10). O jeito de amarrar o commit à publicação é a outbox ou o CDC do módulo 18.',
        look: 'O publisher acende de novo, a luz sai do v2 e percorre o bus até o estoque, que ganha o v2.',
        key: 'O Store é a fonte: o publisher se recupera relendo-o a partir da posição.',
        f(o, t) { const f1 = lin(t, 0.6, 1.8, 0, 1), f2 = lin(t, 1.8, 2.8, 0, 1), f3 = lin(t, 2.8, 4, 0, 1), inB = f2 >= 1, ok = f3 >= 1;
          lit(o, 'store', 'pub'); if (inB) lit(o, 'bus'); if (ok) lit(o, 'stk');
          o.evs = [...pev(2, i => i === 1 ? 'acc' : 'hi'), ...kev(ok ? 2 : 1, i => i === 1 ? 'acc' : 'hi')];
          o.rows.pub = act('publisher', 'VOLTOU', [`posição: ${f1 >= 1 ? 'v2 · e-502' : 'v1 · e-501'}`, 'acc'], ['relê o Store depois dela', 'hi']);
          o.rows.bus = BUS(BTAPE(inB ? 2 : 1));
          bm(o, CAB.sp, { on: f1 < 1 }); bm(o, CAB.pb, { on: f1 >= 1 && !inB }); bm(o, CAB.bk, { on: inB && !ok });
          pk(o, WAY.sp(1), f1, 'e-502'); pk(o, WAY.pb, f2, ''); pk(o, WAY.bk(1), f3, 'e-503');
          o.cnt = [['POSIÇÃO', f1 >= 1 ? 'v2' : 'v1'], ['NO BUS', inB ? 'e-501 · e-502' : 'só e-501', 'dim'], ['SALDO GATO-042', ok ? '2' : '3', 'dim']];
          o.res = ok ? [['recuperado pela posição', 'acc'], ['consumidor idempotente: aula 10', 'dim']] : []; } },
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
    if (d.tape && d.tape.length) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'TÓPICO');
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
    'tabela-x-eventos': () => `<table class="h3-sum"><tr><th>stream · v</th><th>evento_id</th><th>tipo · quando</th></tr><tr${on_(1)}><td>pedido-1047 · 1</td><td>e-501</td><td>PedidoCriado · 14:02:10.000 · total 9.490</td></tr><tr${on_(2, 5, 7)}><td>pedido-1047 · 2</td><td>e-502</td><td>PedidoPago · 14:02:11.000 · 9.490, cartão</td></tr><tr${on_(2)}><td>estoque-GATO-042 · 2</td><td>e-503</td><td>EstoqueReservado · 14:02:11.050 · 3 → 2</td></tr><tr${on_(3)}><td>pedido-1047 · 3</td><td>e-504</td><td>PedidoEnviado · 14:30:00 · LA123456789BR</td></tr><tr${on_(4)}><td>pedido-1047 · 4</td><td>e-505</td><td>PedidoEntregue · 19/06 10:40:00</td></tr></table><li>Rehidratar o <code>pedido-1047</code> (dobrar os 4 em ordem): <code>{pedido_id: 1047, status: entregue, total_centavos: 9490, rastreio: LA123456789BR, versao: 4}</code>; até 14:15: <b><code>pago</code>, versão 2</b></li><li>A tabela: 1 <code>INSERT</code> e 3 <code>UPDATE pedidos SET status = …</code>; sobra só <code>entregue</code></li><li>A versão é por stream; o <code>evento_id</code> é global (os ids <code>e-501</code>, <code>e-502</code>, <code>e-504</code> são os do módulo 6; o <code>e-505</code> é novo)</li><li>Armazenamento: 50 milhões de pedidos × 4 eventos = 200 milhões × ~263 B = <b>~52,6 GB</b> (estimativa); a tabela <code>pedidos</code> do módulo 16 tem 140 GB com índices</li><li>Fowler: Event Sourcing, CQRS, <i>event notification</i> e <i>event-carried state transfer</i> são quatro padrões diferentes</li>`,
    agregado: () => `<table class="h3-sum"><tr><th>comando</th><th>regra</th><th>evento (stream)</th></tr><tr${on_(2)}><td>Pagar</td><td>só em <code>criado</code></td><td>PedidoPago · e-502 (pedido-1047 v2)</td></tr><tr${on_(1, 4)}><td>Enviar</td><td>só em <code>pago</code></td><td>PedidoEnviado · e-504 (pedido-1047 v3)</td></tr><tr${on_(3)}><td>Reservar</td><td>saldo &gt; 0</td><td>EstoqueReservado · e-503 (estoque-GATO-042 v2)</td></tr></table><li>Comando: imperativo, pode ser recusado. Evento: passado, sempre verdadeiro</li><li>O <code>PedidoPago</code> é fato do pedido (o <code>pedidos</code> o grava quando o <code>pagamentos</code> avisa; o <code>e-502</code> fica nos metadados); o <code>EstoqueReservado</code> é fato do estoque</li><li>Tamanho: um pedido, um SKU. Caneca azul na Black Friday: ~20% de 30 pedidos/s = <b>6 eventos/s</b> no <code>estoque-CANECA-007</code>; a 600 comandos/s num stream só, o stream vira gargalo</li><li>O exemplo do estoque-loja (um stream para todos os SKUs) é hipotético, para mostrar o limite</li>`,
    store: () => `<li><code>eventos(id bigserial PK, stream_id text, versao int, evento_id text UNIQUE, tipo text, dados jsonb, metadados jsonb, ocorrido_em timestamptz, CONSTRAINT eventos_stream_versao UNIQUE (stream_id, versao))</code>, adaptada do <code>events</code> do lab do autor</li><table class="h3-sum"><tr><th>chamada (PostgreSQL 14.24)</th><th>resultado</th></tr><tr${on_(0)}><td><code>append_evento(…, 0)</code> … <code>(…, 3)</code></td><td>v1 e-501 · v2 e-502 · v3 e-504 · v4 e-505</td></tr><tr${on_(1)}><td>e-502 com esperada 2 (stream em v4)</td><td><code>Concurrency conflict: expected version 2, but current is 4</code></td></tr><tr${on_(2)}><td>e-502 com esperada 4</td><td><code>duplicate key … "eventos_evento_id_key"</code> · <code>Key (evento_id)=(e-502) already exists.</code></td></tr><tr${on_(3, 4)}><td>A e B, as duas com esperada 2, no estoque-GATO-042</td><td>A: <code>Timeout / PgSleep</code>; B: <code>Lock / transactionid</code>, depois <code>duplicate key … "eventos_stream_versao"</code> · <code>(estoque-GATO-042, 3)</code></td></tr></table><li>Resultado da corrida: v1 <code>e-lab-0</code>, v2 <code>e-503</code>, v3 <code>e-lab-A</code></li><li>Lab do autor (lido, não executado): <code>tx.go</code> lê <code>COALESCE(MAX(version), 0)</code> e insere <code>version + 1</code>; <code>isVersionConflict</code> conta o erro em <code>EventsVersionConflictsTotal</code>; a tabela tem <code>UNIQUE(aggregate_id, version)</code></li><li>Kafka como Event Store de agregados: não há "anexar só se a versão for N" por chave nem "ler o stream inteiro" sem varrer a partição, e a retenção apaga; serve ao bus</li>`,
    bus: () => `<table class="h3-sum"><tr><th>quando</th><th>Store</th><th>bus · estoque</th></tr><tr${on_(1)}><td>14:02:10.000</td><td>pedido-1047 v1 · e-501</td><td>publicado, chave 1047</td></tr><tr${on_(2, 4, 5)}><td>14:02:11.000</td><td>pedido-1047 v2 · e-502</td><td>estoque consome</td></tr><tr${on_(2, 5)}><td>14:02:11.050</td><td>estoque-GATO-042 v2 · e-503</td><td>saldo 3 → 2</td></tr><tr${on_(3)}><td>14:30:00 · 19/06 10:40</td><td>v3 e-504 · v4 e-505</td><td>mesma chave, mesma partição</td></tr></table><li>README do lab do autor: "a publicação em Kafka é feita após o commit": a escrita dupla do módulo 18; a rehidratação (<code>rehydratate</code>) republica à mão o que faltou</li><li>Tópicos do lab: <code>conta_criada</code>, <code>conta_movimentacao</code>, <code>ledger_nova_transacao_confirmada</code>, <code>ledger_saldo_atualizado</code>, <code>ledger_rehydratate_transactions</code></li><li>O bus não é o Store: o tópico do módulo 13 retém 7 dias; o Store guarda tudo</li><li>Entrega pelo menos uma vez: consumidor idempotente (aula 10); atômico de verdade: outbox ou CDC (módulo 18)</li>`,
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
  function readout() { if (active !== 'eventos') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
