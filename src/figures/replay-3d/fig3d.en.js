// Figura 3D (iso-glow): derivar, reconstruir, ordenar. À esquerda o Event Store (um trilho com os blocos do stream), o leitor
// (comando, chegada ou consumidor) e a tabela de apoio (snapshots, tópico); no meio o dobrador, que aplica os eventos em ordem;
// à direita os modelos de leitura (status do 1047, meus_pedidos, o saldo do estoque) e a tabela de processados.
// Atrás, o mostrador (contadores de eventos e de ms, a conta do passo e o resultado). O snapshot é uma foto presa ao trilho.
// Cenários (botões e ?mode=projecao|rehidratacao|snapshot|versao|idempotencia; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/event-sourcing-brief.md): o pedido-1047 (e-501, e-502, e-504, e-505), o
// estoque-GATO-042 (3 → 2), o estoque-CANECA-007 com 1.000.000 de eventos (1.935 · 1.801 · 1.770 ms; com snapshot na v999.000:
// 13,1 · 19,6 · 12,1 ms), a reconstrução de 200 milhões de eventos a 20.000/s (2 h 47 min), a chegada e-501, e-504, e-505,
// e-502, e-502 (último vence → pago v2; versão maior → entregue v4) e o e-502 duplicado no estoque (3 → 2 → 1 × 3 → 2).
FIGS3D.push({ id: 'replay', name: 'Derive, rebuild, order', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['projecao', 'rehidratacao', 'snapshot', 'versao', 'idempotencia'];
  const SCNAME = { projecao: 'Projection', rehidratacao: 'Rehydration', snapshot: 'Snapshot', versao: 'Version', idempotencia: 'Idempotency' };
  const SCFULL = { projecao: 'Projections and read models', rehidratacao: 'Rehydration', snapshot: 'Snapshot', versao: 'Order and version', idempotencia: 'Idempotency' };
  const AULA = { projecao: 'aula-6-projections-e-read-models', rehidratacao: 'aula-7-rehidratacao', snapshot: 'aula-8-snapshotting',
    versao: 'aula-9-ordenacao-versionamento-e-last-write-wins', idempotencia: 'aula-10-idempotencia' };
  let clk = 0, sc = 'projecao', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  let pol = 2;                                        // política de snapshot escolhida (0 nenhum, 1 a cada 10.000, 2 a cada 1.000)
  const ORD0 = [0, 2, 3, 1, 1];                       // a chegada do texto: e-501, e-504, e-505, e-502, e-502 (índices em PE)
  let ord = ORD0.slice();
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-replay3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17, ZT = 34;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  const B = {};
  const BIG = { s1: 18, fs: 14, lh: 18, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  block('store', 40, 40, 300, 140, 10, SMALL); block('cmd', 40, 212, 300, 96, 20); block('aux', 40, 330, 300, 90, 12, SMALL);
  block('fold', 370, 140, 190, 150, 30);
  block('rm1', 590, 40, 290, 140, 24); block('rm2', 590, 212, 290, 104, 20); block('proc', 590, 340, 290, 84, 16, SMALL);
  const NAMES = Object.keys(B);
  // os eventos: blocos sobre o trilho do Store, 5 vagas; a foto (snapshot) é um bloco suspenso sobre uma vaga
  const EW = 52, EG = 5.5, EH = 12;
  const RAIL = { x: 46, y: 46, z: PL + 10, d: 100 };
  const EV = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, EW, RAIL.d, EH, 3, mat, g); const top = faceCanvas('top', 1.5, 1.5, EH, EW - 3, RAIL.d - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, key: '', at: null }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz
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

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const CAB = {
    sf: P3([[340, 110], [355, 110], [355, 200], [370, 200]]),            // Store → dobrador
    cf: P3([[340, 260], [370, 260]]),                                    // leitor → dobrador
    af: P3([[340, 375], [440, 375], [440, 290]]),                        // apoio (snapshot, tópico) → dobrador
    f1: P3([[560, 180], [575, 180], [575, 110], [590, 110]]),            // dobrador → modelo 1
    f2: P3([[560, 250], [575, 250], [575, 264], [590, 264]]),            // dobrador → modelo 2
    fp: P3([[500, 290], [500, 382], [590, 382]]),                        // dobrador → processados
    cs: P3([[190, 212], [190, 180]]),                                    // leitor → Store (pede a versão que falta)
  };
  const slot = i => [RAIL.x + i * (EW + EG) + EW / 2, RAIL.y + RAIL.d / 2];
  const FC = [465, 215, 46];
  const WAY = {
    sf: i => P3([[...slot(i), 36], [340, 110], [355, 110], [355, 200], [370, 200], FC]),
    cf: P3([[190, 260, ZT], [340, 260], [370, 260], FC]),
    af: P3([[190, 375, 26], [340, 375], [440, 375], [440, 290], FC]),
    f1: P3([FC, [560, 180], [575, 180], [575, 110], [590, 110], [735, 110, 40]]),
    f2: P3([FC, [560, 250], [575, 250], [575, 264], [590, 264], [735, 264, 34]]),
    fp: P3([FC, [500, 290], [500, 382], [590, 382], [735, 382, 30]]),
    cs: i => P3([[190, 260, ZT], [190, 212], [190, 180], [...slot(i), 36]]),
  };
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const small = (d, fs = 13, lh = 17.5, y0 = 39) => { d.fs = fs; d.lh = lh; d.y0 = y0; return d; };
  const PE = [['v1', 'e-501', 'Criado'], ['v2', 'e-502', 'Pago'], ['v3', 'e-504', 'Enviado'], ['v4', 'e-505', 'Entregue']];
  const CE = [['v1', '+100', 'Ajustado'], ['v2', '−1', 'Reservado'], ['…', '', ''], ['v999,000', '−1', 'Reservado'], ['v1,000,000', '−1', 'Reservado']];
  const ev = (i, l, tn = 'hi', lv = 0, dz = 0) => ({ i, l, tn, lv, dz });
  const pev = (n, tn = 'hi') => PE.slice(0, n).map((l, i) => ev(i, l, typeof tn === 'function' ? tn(i) : tn));
  const cev = (tn = 'hi') => CE.map((l, i) => ev(i, l, typeof tn === 'function' ? tn(i) : tn));
  const ST = ['criado', 'pago', 'enviado', 'entregue'];
  // o saldo da caneca depois de n eventos (a cada 100: um +100 e 99 −1)
  const saldo = n => Math.floor(n / 100) + (n % 100 ? 101 - n % 100 : 0);
  const STATUS = (k, tn = 'hi', ...extra) => act('status of 1047', 'READ MODEL',
    k < 0 ? ['empty', 'dim'] : [`${ST[k]} · version ${k + 1}`, tn], k >= 2 ? ['rastreio LA123456789BR', 'dim'] : null, ...extra);
  const MEUS = (k, tn = 'hi') => act('meus_pedidos', 'lena-77', k < 0 ? ['empty', 'dim'] : [`1047 · ${ST[k]} · 9,490`, tn]);
  const STK = (s, tn = 'hi', ...extra) => act('stock GATO-042', 'CONSUMER', [`balance ${s}`, tn], ...extra);
  const SHOW = { projecao: ['store', 'fold', 'rm1', 'rm2'], rehidratacao: ['store', 'cmd', 'fold', 'rm1'], snapshot: ['store', 'cmd', 'aux', 'fold', 'rm1'],
    versao: ['store', 'cmd', 'fold', 'rm1', 'rm2'], idempotencia: ['store', 'cmd', 'fold', 'rm2', 'proc'] };
  const STORE = (name, meta = 'EVENT STORE') => ({ ...act(name, meta), foot: 1 });
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], evs: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    const caneca = sc === 'rehidratacao' || sc === 'snapshot';
    o.rows.store = STORE(caneca ? 'estoque-CANECA-007' : 'pedido-1047');
    o.evs = caneca ? cev() : pev(sc === 'idempotencia' ? 2 : 4);
    o.rows.fold = act('projection', 'FOLD', ['state = {}', 'dim']);
    o.rows.rm1 = STATUS(-1); o.rows.rm2 = MEUS(-1);
    o.rows.aux = act('snapshots', 'TABLE', ['no photo', 'dim']);
    o.rows.cmd = act('command', 'READER', ['', 'dim']);
    o.rows.proc = act('eventos_processados', 'TABLE', ['off', 'dim']);
    o.beams.push({ pts: CAB.sf });
    if (sc === 'projecao') o.beams.push({ pts: CAB.f1 }, { pts: CAB.f2 });
    else if (sc === 'rehidratacao') o.beams.push({ pts: CAB.cf }, { pts: CAB.f1 });
    else if (sc === 'snapshot') o.beams.push({ pts: CAB.cf }, { pts: CAB.af }, { pts: CAB.f1 });
    else if (sc === 'versao') { o.beams.length = 0; o.beams.push({ pts: CAB.cf }, { pts: CAB.f1 }, { pts: CAB.f2 }); }
    else o.beams.push({ pts: CAB.cf }, { pts: CAB.f2 }, { pts: CAB.fp });
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bm = (o, pts, p) => { const b = o.beams.find(b => b.pts === pts); if (b) Object.assign(b, p); else o.beams.push({ pts, ...p }); };
  // a foto presa ao trilho: um bloco suspenso sobre a vaga i, com um pino até ele
  function photo(o, i, l, tn = 'acc') { o.evs.push(ev(i, l, tn, 2, 4)); const [x, y] = slot(i);
    o.beams.push({ pts: [[x, y, RAIL.z + EH], [x, y, RAIL.z + 2 * (EH + 1) + 4]], on: tn !== 'dim', tone: tn === 'bad' ? 'bad' : '' }); }
  // os 4 eventos do 1047 passando um a um pelo dobrador: k = quantos já aplicados; devolve [k, fração do atual]
  const seq = (t, a, per, n = 4) => { const s = lin(t, a, a + per * n, 0, n); return [Math.min(n, Math.floor(s)), s - Math.floor(s)]; };
  // a chegada embaralhada: o que cada regra tem depois de j chegadas
  function arrive(order, j) {
    let lw = -1, vm = -1; const log = [];
    order.slice(0, j).forEach(k => { lw = k; const okv = k > vm; if (okv) vm = k; log.push(okv); });
    return { lw, vm, log };
  }
  const shuffle = () => { let a; do { a = [0, 1, 2, 3, 1]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
    while (a.join() === ord.join()); ord = a; };
  const ARR = order => order.map(k => PE[k][1]);

  // ── o que se vê em cada passo ──
  const POL = [
    { name: 'None', n: 1000000, ms: '~1,800 ms', how: 'measured', tail: 'all 1,000,000' },
    { name: 'Every 10,000', n: 10000, ms: '~29 ms', how: 'estimate', tail: 'up to 10,000 after the photo' },
    { name: 'Every 1,000', n: 1000, ms: '~13 ms', how: 'measured', tail: 'up to 1,000 after the photo' },
  ];
  const STEPS = {
    projecao: [
      { id: 'cena', dur: 5, title: 'The same facts, another way to read', yk: 'THE STORE AND TWO MODELS', act: ['Project the events', 'v1 a v4'],
        code: ['Store: pedido-1047 v1…v4', 'projection: listens and folds', 'model 1: status of 1047', '  (the tracking screen)', 'model 2: meus_pedidos of lena-77', '  (the one from module 18)'],
        story: 'On the left, the Event Store with the <code>pedido-1047</code> stream: the four facts of Lena\'s order, <code>e-501</code> to <code>e-505</code>. On the right, two still-empty <b>read models</b>: the <b>status of 1047</b>, which the tracking screen reads, and the module 18 <code>meus_pedidos</code>. In the middle, the <b>projection</b>: the code that listens to the events and maintains each model. It is the CQRS of module 18 with the Event Store in place of the write database.',
        look: 'The Store rail has four blocks. The folder in the middle and the two models on the right are empty.',
        key: 'The projection turns the list of facts into a table that is good for reading.',
        f(o) { lit(o, 'store');
          o.cnt = [['APPLIED', '0 of 4'], ['STATUS', 'empty', 'dim'], ['STORE', '4 events', 'dim']];
          o.res = [['the facts are in the Store; the screens are not yet', 'dim']];
          T(o, [190, 110, 34], 'the source of truth', 'dim'); T(o, [735, 110, 40], 'derived', 'dim'); } },
      { id: 'dobra', dur: 6, title: 'Each event updates both models', yk: 'THE PROJECTION, EVENT BY EVENT',
        code: ['PedidoCriado  → status criado, v1', 'PedidoPago    → status pago, v2', 'PedidoEnviado → enviado, tracking, v3', 'PedidoEntregue → entregue, v4', 'meus_pedidos: 1047 · entregue · 9,490'],
        story: 'The projection reads the stream in order and applies each event. <code>PedidoCriado</code> creates the 1047 row (<code>criado</code>, 9,490 cents); <code>PedidoPago</code> switches to <code>pago</code>; <code>PedidoEnviado</code> writes the tracking <code>LA123456789BR</code>; <code>PedidoEntregue</code> closes at <code>entregue</code>. Both models end up equal to the <code>pedidos</code> table from before, but now the table is a <b>consequence</b> of the events.',
        look: 'One block at a time leaves the rail, goes through the folder and lights up the two models, which change from criado to entregue.',
        key: 'The read model is the result of applying the events in order.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 1.1); lit(o, 'store', 'fold'); if (k > 0) lit(o, 'rm1', 'rm2');
          o.evs = pev(4, i => i < k ? 'acc' : 'hi');
          if (k < 4) { pk(o, WAY.sf(k), Math.min(1, fr * 2), PE[k][1]); pk(o, WAY.f1, fr * 2 - 1, ''); pk(o, WAY.f2, fr * 2 - 1, ''); }
          o.rows.fold = act('projection', 'FOLD', [k ? `applied ${PE[k - 1][2]}` : 'reading v1…', 'hi'], [k ? `status ${ST[k - 1]} · v${k}` : '', 'dim']);
          o.rows.rm1 = STATUS(k - 1, 'acc'); o.rows.rm2 = MEUS(k - 1, 'acc');
          o.cnt = [['APPLIED', `${k} of 4`], ['STATUS', k ? ST[k - 1] : 'empty', 'dim'], ['VERSION', k ? String(k) : '0', 'dim']];
          o.res = k >= 4 ? [['entregue · version 4', 'acc'], ['both models up to date', 'acc']] : []; } },
      { id: 'jeitos', dur: 6, title: 'Where the projection runs: three ways', yk: 'TRANSACTIONAL · SEMI-SYNCHRONOUS · ASYNCHRONOUS',
        code: ['transactional: in the same transaction as the event', '  reads always up to date; weighs on the Store', 'semi-synchronous: the Store notifies, the projection', '  updates right after', 'asynchronous: over the bus; decoupled,', '  eventual consistency'],
        story: 'The article describes three ways to connect the projection to the Store. <b>Transactional</b>: the projection writes the model <b>in the same transaction</b> as the event; reads never lag, but every write to the Store gets heavier and becomes a bottleneck. <b>Semi-synchronous</b>: the Store publishes and the projection updates right after. <b>Asynchronous</b>: the projection consumes from the bus (lesson 5), decoupled, and the model lags a little: eventual consistency. The status screen of 1047 can take a few seconds of lag; a balance that decides a sale maybe cannot.',
        look: 'The cable from the Store to the folder runs nonstop: that is how the projection receives, whether in the transaction, by notice or over the bus.',
        key: 'The closer to the transaction, the more up to date the read and the more expensive the Store.',
        f(o) { lit(o, 'store', 'fold', 'rm1', 'rm2'); o.evs = pev(4, 'acc'); bm(o, CAB.sf, { on: true, flow: true });
          o.rows.fold = act('projection', 'WHERE IT RUNS', ['transactional', 'hi'], ['semi-synchronous', 'hi'], ['asynchronous (bus)', 'hi']);
          o.rows.rm1 = STATUS(3); o.rows.rm2 = MEUS(3);
          o.cnt = [['TRANSACTIONAL', 'up to date, heavy'], ['SEMI-SYNCHRONOUS', 'right after', 'dim'], ['ASYNCHRONOUS', 'eventual', 'dim']];
          o.res = [['each model picks the lag it can take', 'acc']]; } },
      { id: 'pura', dur: 7, title: 'Pure function: running again gives the same', yk: 'SAME SEQUENCE → SAME RESULT', act: ['Break the projection', 'a bug in the deploy'],
        code: ['project(v1..v4) = entregue, v4', 'project(v1..v4) again = entregue, v4', 'no now(), no external call,', '  no random number', 'so: the model is disposable'],
        story: 'The property that holds everything up: the projection is a <b>pure function</b> of the events. With the same sequence, it gives the same result, today or a year from now. For that it cannot read the clock (<code>now()</code>), call another service or draw anything random: everything it needs is in the event. That is why the read model is <b>disposable</b>: if it gets corrupted, you delete it and rebuild it from the Store.',
        look: 'The four events go through the folder again and the models do not change: they stay at entregue, version 4.',
        key: 'Pure function of the events: the model can be deleted and redone.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.9); lit(o, 'store', 'fold', 'rm1', 'rm2'); o.evs = pev(4, i => i < k ? 'acc' : 'hi');
          if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          o.rows.fold = act('projection', 'AGAIN', [`replay ${k} of 4`, 'hi'], ['no now()', 'dim'], ['no external call', 'dim']);
          o.rows.rm1 = STATUS(3, 'acc'); o.rows.rm2 = MEUS(3, 'acc');
          o.cnt = [['REPLAY', `${k} of 4`], ['STATUS', 'entregue', 'dim'], ['CHANGED?', k >= 4 ? 'nothing' : '…', 'dim']];
          o.res = k >= 4 ? [['same result: entregue, v4', 'acc']] : []; } },
      { id: 'defeito', dur: 7, title: 'What if it goes wrong: the projection with a bug', yk: 'A DEPLOY WITHOUT PedidoEntregue', act: ['Delete the model', 'TRUNCATE'],
        code: ['new projection (with a bug):', '  switch (tipo) { … }  // PedidoEntregue is missing', 'v4 e-505 PedidoEntregue → ignored', 'status of 1047: enviado (wrong)', 'the Store is still right: v1…v4'],
        story: 'A deploy swaps the projection, and the new version forgot to handle <code>PedidoEntregue</code> (example). It ignores <code>e-505</code>, and the status of 1047 stays at <code>enviado</code>: Lena already received the cat and the screen says it is still on the way. The same goes for every order delivered after the deploy. Note that the <b>Store did not change at all</b>: the four facts are there, correct. The error is only in the derived model.',
        look: 'v4 goes through the folder, which turns red and does not apply it. The models turn red at enviado.',
        key: 'The error lives in the derived model; the Store is still right.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.8); lit(o, 'store'); o.evs = pev(4, i => i === 3 && k >= 4 ? 'bad' : i < k ? 'acc' : 'hi');
          const bug = k >= 4; o.on.fold = bug ? 'bad' : 1; if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          const s = Math.min(k, 3) - 1; o.on.rm1 = o.on.rm2 = bug ? 'bad' : 1;
          o.rows.fold = act('projection v2', 'WITH BUG', ['PedidoEntregue missing', bug ? 'bad' : 'dim'], [bug ? 'e-505 ignored' : `applied v${k}`, bug ? 'bad' : 'dim']);
          o.rows.rm1 = STATUS(s, bug ? 'bad' : 'acc', bug ? ['should be: entregue · v4', 'bad'] : null); o.rows.rm2 = MEUS(s, bug ? 'bad' : 'acc');
          o.cnt = [['STATUS ON SCREEN', bug ? 'enviado' : '…', bug ? 'bad' : ''], ['IN THE STORE', 'v1…v4 correct', 'dim'], ['CULPRIT', 'the projection', 'dim']];
          o.res = bug ? [['the screen shows enviado', 'bad'], ['the Store is right', 'acc']] : []; } },
      { id: 'apagar', dur: 5, title: 'Delete the model: nothing is lost', yk: 'TRUNCATE status_pedidos', act: ['Reprocess', 'from the Store, since v1'],
        code: ['fix the projection (handle PedidoEntregue)', 'TRUNCATE status_pedidos;', 'TRUNCATE meus_pedidos;', 'the Store: intact, 4 events', 'the reader\'s position goes back to the start'],
        story: 'With the projection fixed, the repair is not an <code>UPDATE</code> by hand on each order. You delete the whole model (<code>TRUNCATE</code>) and move the reader\'s position back to the start of the Store. Deleting a read model sounds drastic, but no fact is lost: they are all in the Store, and the model is just a way to read the facts.',
        look: 'Both models empty out. The Store rail keeps its four blocks lit.',
        key: 'Deleting the model is safe because the Store keeps everything.',
        f(o) { lit(o, 'store', 'fold'); o.evs = pev(4, 'acc');
          o.rows.fold = act('projection v3', 'FIXED', ['handles PedidoEntregue', 'acc'], ['position: start', 'dim']);
          o.cnt = [['MODELS', 'empty', 'dim'], ['STORE', '4 events', ''], ['POSITION', 'v1', 'dim']];
          o.res = [['model deleted; Store intact', 'acc']]; } },
      { id: 'reprocessar', dur: 8, title: 'Reprocess: 200 million events, 2 h 47 min', yk: 'REBUILD FROM SCRATCH',
        code: ['1047: v1…v4 → entregue · v4', 'the whole store: 200 million events', '  writing to the model at 20,000/s', '  200.000.000 ÷ 20.000 = 10.000 s', '  = 2 h 47 min', 'reading the Store: ~555 thousand events/s (not the bottleneck)'],
        story: 'The fixed projection reads the Store from the beginning. For 1047 that is 4 events and the status goes back to <code>entregue</code>, version 4. For the whole store it is the <b>200 million</b> events (50 million orders × 4). Reading the Store is fast (we measured ~555 thousand events/s in lesson 7); the bottleneck is <b>writing</b> to the model, at 20,000 per second as in module 18: 10,000 s, <b>2 h 47 min</b>. During that time, the screen reads the old model or a new one that is still filling up.',
        look: 'The blocks run from the rail to the models; the display counts the events up to 200 million and the clock up to 2 h 47 min.',
        key: 'With the Store, a corrupted model can be rebuilt: it costs hours, not data.',
        f(o, t) { const [k, fr] = seq(t, 0.3, 0.6), g = lin(t, 0.3, 6.5, 0, 1), done = g >= 1; lit(o, 'store', 'fold', 'rm1', 'rm2');
          o.evs = pev(4, i => i < k ? 'acc' : 'hi'); if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          bm(o, CAB.f1, { on: !done, flow: !done }); bm(o, CAB.f2, { on: !done, flow: !done });
          o.rows.fold = act('projection v3', 'REPROCESSES', [`${fmt(g * 200)} M of 200 M`, 'hi'], ['20,000 events/s', 'dim']);
          o.rows.rm1 = STATUS(Math.min(k, 4) - 1, 'acc'); o.rows.rm2 = MEUS(Math.min(k, 4) - 1, 'acc');
          const s = g * 10000, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
          o.cnt = [['EVENTS', `${fmt(g * 200)} M`], ['TIME', `${h} h ${String(m).padStart(2, '0')} min`, 'dim'], ['RATE', '20.000/s', 'dim']];
          o.res = done ? [['200 million in 2 h 47 min', 'acc'], ['1047: entregue · v4', 'acc']] : [['reprocessando…', 'dim']]; } },
      { id: 'sem-store', dur: 7, title: 'What if there were only the 7-day topic?', yk: 'WITHOUT EVENT STORE',
        code: ['Kafka · pedidos: 7-day retention', '  (module 13)', '1047 is from 06/18: already deleted', 'model deleted + empty topic', '  = nowhere to rebuild from'],
        story: 'Now the same accident without an Event Store: the events only went through the Kafka topic, which keeps <b>7 days</b> (module 13). 1047 is from 06/18; a month later, the four facts have already been deleted from the topic. Deleting the faulty model, here, means losing the order status forever: there is nowhere to reprocess from. The bus carries the facts; whoever <b>keeps</b> them is the Store.',
        look: 'The Store disappears. At the bottom left, the 7-day topic shows up empty, and the models turn red.',
        key: 'Without the Store, a corrupted model has nowhere to be redone from.',
        f(o) { o.show.store = 0; o.show.aux = 1; o.evs = []; o.on.aux = 'bad'; o.on.rm1 = o.on.rm2 = 'bad'; o.on.fold = 'bad';
          o.beams = [{ pts: CAB.af, tone: 'bad', on: true }, { pts: CAB.f1 }, { pts: CAB.f2 }];
          o.rows.aux = act('Kafka · pedidos', 'TOPIC · 7 DAYS', ['06/18: e-501…e-505 deleted', 'bad'], ['retention: 7 days', 'dim']);
          o.rows.fold = act('projection v3', 'NO SOURCE', ['nothing to read', 'bad']);
          o.rows.rm1 = STATUS(-1, 'bad', ['lost', 'bad']); o.rows.rm2 = MEUS(-1);
          o.cnt = [['SOURCE', '7-day topic', 'bad'], ['O 1047', 'erased', 'bad'], ['REBUILD', 'impossible', 'bad']];
          o.res = [['without the Store, no replay', 'bad']]; } },
    ],
    rehidratacao: [
      { id: 'cena', dur: 5, title: 'A stream with 1,000,000 events', yk: 'estoque-CANECA-007', act: ['Rehydrate', '1,000,000 events'],
        code: ['for every 100 events:', '  1 EstoqueAjustado +100', '  99 EstoqueReservado −1', '1,000,000 events · final balance 10,000', 'table + indexes: 263 MB (~263 B/event)'],
        story: '<code>estoque-CANECA-007</code> is the blue mug\'s stream, the store\'s hottest SKU. It has <b>1,000,000 events</b>: for every 100, one <code>EstoqueAjustado</code> of +100 and 99 <code>EstoqueReservado</code> of −1. To decide a new <code>Reservar</code>, the aggregate needs to know the balance, and the balance is stored nowhere: you have to <b>rehydrate</b>, folding the whole stream in order. This stream was actually written on PostgreSQL 14: 263 MB with the indexes.',
        look: 'On the rail, the beginning (v1 +100, v2 −1), the ellipsis and the end (v999,000, v1,000,000). The command waits on the left.',
        key: 'Rehydrating is folding the stream\'s events to know the state right now.',
        f(o) { lit(o, 'store', 'cmd');
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMMAND', ['needs the balance', 'hi'], ['load the aggregate', 'dim']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', ['not yet', 'dim']);
          o.cnt = [['EVENTS', '1.000.000'], ['SIZE', '263 MB', 'dim'], ['BALANCE', '?', 'dim']];
          o.res = [['the balance is not stored', 'dim']]; } },
      { id: 'dobrar', dur: 6, title: 'Fold everything: ~1,800 ms', yk: 'MEASURED · PostgreSQL 14 + Python',
        code: ['SELECT tipo, dados FROM eventos', "  WHERE stream_id = 'estoque-CANECA-007'", '  ORDER BY versao;', 'balance = 0; for each event: balance += Δ', '3 runs: 1,935 · 1,801 · 1,770 ms', '~555 thousand events/s · balance 10,000'],
        story: 'The aggregate reads the whole stream, in version order, and adds up: +100, −1, −1… Measured (Python client reading with <code>psql COPY</code>): <b>1,935, 1,801 and 1,770 ms</b> in three runs, about <b>555 thousand events per second</b>, and the balance comes to <b>10,000</b>. The cost is <b>linear</b> in the size of the stream: with 10 million, it would be about 18 s. Almost two seconds before each <code>Reservar</code> is too slow for a command.',
        look: 'The event counter runs up to 1,000,000 in almost two seconds, in the real time of the measurement; the balance climbs to 10,000.',
        key: 'Rehydrating costs time proportional to the stream: 1 million, ~1.8 s.',
        f(o, t) { const g = lin(t, 0.5, 2.3, 0, 1), n = g * 1e6, done = g >= 1; lit(o, 'store', 'cmd', 'fold'); if (done) lit(o, 'rm1');
          o.evs = cev(i => done || (i === 0 || i === 1) ? 'acc' : i === 3 && n >= 999000 ? 'acc' : 'hi');
          bm(o, CAB.sf, { on: g > 0 && !done, flow: g > 0 && !done }); bm(o, CAB.f1, { on: done });
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMMAND', [done ? 'balance known' : 'esperando…', done ? 'acc' : 'hi']);
          o.rows.fold = act('rehydrate', 'FOLD', [`v${fmt(n)}`, 'hi'], [`balance ${fmt(n ? saldo(Math.round(n)) : 0)}`, 'acc']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', done ? ['balance 10,000 · v1,000,000', 'acc'] : ['…', 'dim']);
          o.cnt = [['EVENTS READ', fmt(n)], ['MS', fmt(g * 1800), 'dim'], ['BALANCE', fmt(n ? saldo(Math.round(n)) : 0), 'dim']];
          o.res = done ? [['~1,800 ms · balance 10,000', 'acc'], ['1,935 · 1,801 · 1,770 ms measured', 'dim']] : []; } },
      { id: 'pedido', dur: 6, title: 'The common case: 1047 has 4 events', yk: 'REHYDRATE pedido-1047',
        code: ['{}', '+ PedidoCriado  → criado, total 9,490', '+ PedidoPago    → pago', '+ PedidoEnviado → enviado, LA123456789BR', '+ PedidoEntregue → entregue', '= {status: entregue, versao: 4}'],
        story: 'The typical aggregate is small. Before deciding a command on 1047, <code>pedidos</code> rehydrates <code>pedido-1047</code>: 4 events, folded in fractions of a millisecond. It starts empty; <code>PedidoCriado</code> gives <code>{status: criado, cliente: lena-77, total: 9490}</code>; <code>PedidoPago</code> switches to <code>pago</code>; <code>PedidoEnviado</code> adds the tracking; <code>PedidoEntregue</code> closes at <code>entregue</code>, version 4. Rehydrating on every command is only cheap because the stream is short.',
        look: 'The rail swaps the mug for 1047, and the four blocks go through the folder, which shows the state grow.',
        key: 'Small aggregate, cheap rehydration: 4 events, under 1 ms.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.9); lit(o, 'store', 'fold'); if (k >= 4) lit(o, 'rm1');
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i < k ? 'acc' : 'hi'); if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          o.rows.cmd = act('pedidos', 'COMMAND', ['decide on 1047', 'hi']);
          o.rows.fold = act('rehydrate', 'FOLD', [k ? `status ${ST[k - 1]}` : '{}', 'hi'], [k ? `version ${k}` : '', 'dim'], [k >= 3 ? 'LA123456789BR' : k ? 'total 9,490' : '', 'dim']);
          o.rows.rm1 = act('Pedido aggregate', 'LOADED', k >= 4 ? ['entregue · version 4', 'acc'] : ['…', 'dim']);
          o.cnt = [['EVENTS READ', `${k} of 4`], ['MS', '< 1', 'dim'], ['STATUS', k ? ST[k - 1] : '{}', 'dim']];
          o.res = k >= 4 ? [['entregue · version 4', 'acc']] : []; } },
      { id: 'audit', dur: 6, title: 'Auditing: fold only up to version 2', yk: 'WHAT LENA SAW AT 14:15',
        code: ['fold up to ocorrido_em ≤ 14:15', '  v1 PedidoCriado 14:02:10 → criado', '  v2 PedidoPago   14:02:11 → pago', '  v3 is 14:30: left out', '= pago · version 2'],
        story: 'Rehydrating is also going back in time. To answer what Lena saw at <b>14:15</b>, you fold the stream only up to the events of that time: v1 gives <code>criado</code>, v2 gives <code>pago</code>, and v3 is from 14:30. Answer: <b><code>pago</code>, version 2</b>. It is the same fold, with a stopping point.',
        look: 'Only v1 and v2 light up; v3 and v4 stay dark, after the cut.',
        key: 'Auditing is rehydrating up to a point: at 14:15, pago, version 2.',
        f(o, t) { const ok = t > 1.6; lit(o, 'store', 'fold'); if (ok) lit(o, 'rm1');
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i < 2 ? 'acc' : 'dim'); pk(o, WAY.sf(1), lin(t, 0.4, 1.6, 0, 1), 'up to v2');
          o.rows.cmd = act('audit', 'QUESTION', ['status at 14:15?', 'hi']);
          o.rows.fold = act('rehydrate', 'UP TO 14:15', ['v1 criado', 'hi'], ['v2 pago', ok ? 'acc' : 'dim'], ['v3: 14:30, out', 'dim']);
          o.rows.rm1 = act('answer', '14:15', ok ? ['pago · version 2', 'acc'] : ['…', 'dim']);
          o.cnt = [['AT 14:15', ok ? 'pago' : '…'], ['VERSION', ok ? '2' : '…', 'dim'], ['READ', '2 of 4', 'dim']];
          o.res = ok ? [['pago, version 2', 'acc']] : [];
          if (ok) T(o, [slot(2)[0], 30, 70], 'after 14:15', 'dim'); } },
      { id: 'recuperar', dur: 7, title: 'Recovering a domain: republishing the events', yk: 'The author lab\'s rehydratate',
        code: ['lab: rehydratate/listener.go', '  reads the aggregate\'s events', '  ORDER BY version ASC', '  (optional date filter)', '  and republishes the balance', 'whoever lost data rebuilds itself'],
        story: 'The second use is <b>recovery</b>. If a domain lost data (the <code>estoque</code> balance fell behind, an event never left the publisher), you read the stream again and <b>republish</b> to it. That is what the author\'s lab does in <code>rehydratate/listener.go</code> (read, not executed): it reads all the aggregate\'s events in version order, with an optional date filter, and republishes the balance. It only works if whoever receives is idempotent (lesson 10).',
        look: 'The events leave the rail, go through the folder and light up the model on the right, which gets its balance back.',
        key: 'Rehydrating and republishing recovers a domain that lost data.',
        f(o, t) { const g = lin(t, 0.4, 3.4, 0, 1), done = g >= 1; lit(o, 'store', 'cmd', 'fold'); o.on.rm1 = done ? 1 : 'bad';
          o.evs = cev('acc'); bm(o, CAB.sf, { on: !done, flow: !done }); bm(o, CAB.f1, { on: !done, flow: !done });
          o.rows.cmd = act('rehydratate', 'AUTHOR\'S LAB', ['ORDER BY version ASC', 'hi'], ['date filter (optional)', 'dim']);
          o.rows.fold = act('republish', 'FOLD', [`${Math.round(g * 100)}%`, 'hi']);
          o.rows.rm1 = act('balance (ScyllaDB)', 'DOMAIN', done ? ['balance 10,000', 'acc'] : ['out of date', 'bad'], ['redone from the Store', 'dim']);
          o.cnt = [['REPUBLISHED', `${Math.round(g * 100)}%`], ['BALANCE', done ? '10.000' : '?', 'dim'], ['REQUIRES', 'idempotency', 'dim']];
          o.res = done ? [['the domain rebuilt itself', 'acc']] : []; } },
      { id: 'upcasting', dur: 8, title: 'What if it goes wrong: the event in an old format', yk: 'UPCASTING ON READ',
        code: ['Old PedidoCriado: {frete: 15.00}', 'today\'s code reads: frete_centavos', '  → missing: wrong total', 'upcaster (on read):', '  frete_centavos = frete × 100 = 1,500', '  total 9,490 again'],
        story: 'Events are forever, and code changes. Suppose 1047\'s <code>PedidoCriado</code> was written when the field was <code>frete</code>, a number in reais (15.00), and today the code reads <code>frete_centavos</code> (example). Rehydrating with the new code gives a missing shipping value and a wrong total. The event <b>is not edited</b>; the way out is <b>upcasting</b> (Axon): convert the old event to the new format <b>on read</b>, before folding. And there is the other mistake from the lesson: republishing everything to a domain that is not idempotent duplicates the effect (lesson 10).',
        look: 'v1 turns red and so does the folder. Then the upcaster converts the event and the total goes back to 9,490.',
        key: 'An old event is not edited: it is converted on read (upcasting).',
        f(o, t) { const fix = t > 3.2; lit(o, 'store', 'cmd'); o.on.fold = fix ? 1 : 'bad'; if (fix) lit(o, 'rm1'); else o.on.rm1 = 'bad';
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i === 0 ? (fix ? 'acc' : 'bad') : 'hi');
          pk(o, WAY.sf(0), lin(t, 0.4, 1.6, 0, 1), 'frete: 15.00', 'bad');
          o.rows.cmd = act('upcaster', fix ? 'ON' : 'OFF', ['frete → frete_centavos', fix ? 'acc' : 'dim'], ['× 100, on read', 'dim']);
          o.rows.fold = act('rehydrate', 'NEW CODE', [fix ? 'frete_centavos 1,500' : 'frete_centavos: ?', fix ? 'acc' : 'bad'], [fix ? 'total 9,490' : 'wrong total', fix ? 'acc' : 'bad']);
          o.rows.rm1 = act('Pedido aggregate', 'LOADED', [fix ? 'entregue · total 9,490' : 'wrong total', fix ? 'acc' : 'bad']);
          if (fix) bm(o, CAB.cf, { on: true, flow: true });
          o.cnt = [['THE EVENT', 'frete: 15.00', fix ? 'dim' : 'bad'], ['THE CODE READS', 'frete_centavos', 'dim'], ['TOTAL', fix ? '9.490' : 'wrong', fix ? '' : 'bad']];
          o.res = fix ? [['upcasting: converts on read', 'acc'], ['the event stays the same', 'dim']] : [['the new code reads it wrong', 'bad']]; } },
    ],
    snapshot: [
      { id: 'cena', dur: 5, title: 'Without a snapshot: 1,000,000 events every time', yk: 'POLICY: NONE', act: ['Take the photo', 'at v999,000'],
        code: ['rehydrate estoque-CANECA-007', '  reads v1 … v1,000,000', '  ~1,800 ms (measured)', 'snapshots: empty', 'author\'s lab: has the table and does not read it'],
        story: 'In lesson 7, rehydrating the mug cost ~1,800 ms because the aggregate re-reads the million events every time. At the bottom left is the <code>snapshots(stream_id, versao, estado)</code> table, still empty. It is like that in the author\'s lab: the table exists, but no Go code uses it, and rehydration always reads everything.',
        look: 'The whole rail is lit: everything will be read. The snapshots table, at the bottom, is empty.',
        key: 'Without a photo, every rehydration re-reads the whole stream.',
        f(o) { lit(o, 'store', 'cmd'); o.evs = cev('acc');
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMMAND', ['load the aggregate', 'hi']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', ['balance 10,000', 'hi'], ['in ~1,800 ms', 'dim']);
          o.cnt = [['EVENTS READ', '1.000.000'], ['MS', '~1.800', 'dim'], ['PHOTOS', '0', 'dim']];
          o.res = [['reads everything, every time', 'dim']]; } },
      { id: 'foto', dur: 6, title: 'The photo: the state at v999,000', yk: 'INSERT INTO snapshots', act: ['Rehydrate with the photo', 'photo + 1,000'],
        code: ['every 1,000 events, in the background:', "INSERT INTO snapshots VALUES", "  ('estoque-CANECA-007', 999000,", "   '{\"saldo\": 9990}')", 'off the command path'],
        story: 'A <b>snapshot</b> is a photo of the state at a version. With the policy "every 1,000 events", a <b>background</b> process (never on the command path) folds up to v999,000 and writes the photo: balance <b>9,990</b> at that version. The photo stays pinned to the rail, over the block it was taken from.',
        look: 'A photo rises and is pinned over the v999,000 block; the snapshots table gets a row.',
        key: 'The snapshot keeps the state at a version so the math is not redone.',
        f(o, t) { const ok = t > 1.4; lit(o, 'store'); if (ok) lit(o, 'aux'); o.evs = cev(i => i <= 3 ? 'acc' : 'hi');
          if (ok) photo(o, 3, ['PHOTO', 'v999.000', 'balance 9,990']); pk(o, WAY.af.slice().reverse(), lin(t, 0.3, 1.4, 0, 1), '');
          o.rows.cmd = act('snapshotter', 'BACKGROUND', ['every 1,000 events', 'hi']);
          o.rows.aux = act('snapshots', 'TABLE', ok ? ['CANECA-007 · 999,000 · 9,990', 'acc'] : ['no photo', 'dim']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', ['not yet', 'dim']);
          o.cnt = [['PHOTO AT', ok ? 'v999.000' : '…'], ['BALANCE IN PHOTO', ok ? '9.990' : '…', 'dim'], ['POLICY', 'every 1,000', 'dim']];
          o.res = ok ? [['photo written: v999,000', 'acc']] : []; } },
      { id: 'com-foto', dur: 6, title: 'Photo + 1,000 events: ~13 ms', yk: 'MEASURED · PostgreSQL 14',
        code: ['1. SELECT estado FROM snapshots → 9,990', '2. eventos WHERE versao > 999000', '   → 1,000 events', '3 runs: 13.1 · 19.6 · 12.1 ms', '  (includes starting psql twice)', '1,800 ÷ ~13 ≈ 140× · balance 10,000'],
        story: 'Now rehydration reads the photo (balance 9,990 at v999,000) and only the events <b>after</b> it: 1,000. Measured: <b>13.1, 19.6 and 12.1 ms</b>, counting the cost of opening <code>psql</code> twice. That is <b>1,000× fewer events</b> and about <b>140× less time</b> (1,800 ÷ ~13). The balance on both paths is the same: <b>10,000</b>.',
        look: 'The folder reads the photo first, then only the end of the rail; the event counter stops at 1,000.',
        key: 'With a snapshot, rehydrating is photo + tail: 1,800 ms becomes ~13 ms.',
        f(o, t) { const f1 = lin(t, 0.4, 1.2, 0, 1), g = lin(t, 1.2, 1.6, 0, 1), done = g >= 1; lit(o, 'store', 'aux', 'cmd', 'fold'); if (done) lit(o, 'rm1');
          o.evs = cev(i => i === 4 ? 'acc' : 'dim'); photo(o, 3, ['PHOTO', 'v999.000', 'balance 9,990']);
          pk(o, WAY.af, f1, 'photo'); bm(o, CAB.sf, { on: f1 >= 1 && !done, flow: f1 >= 1 && !done });
          o.rows.aux = act('snapshots', 'TABLE', ['CANECA-007 · 999,000 · 9,990', 'acc']);
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMMAND', [done ? 'balance known' : 'esperando…', done ? 'acc' : 'hi']);
          o.rows.fold = act('rehydrate', 'PHOTO + TAIL', ['photo: 9,990', f1 >= 1 ? 'acc' : 'dim'], [`+ ${fmt(g * 1000)} events`, 'hi'], [`balance ${fmt(f1 >= 1 ? 9990 + g * 10 : 0)}`, 'acc']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', done ? ['balance 10,000', 'acc'] : ['…', 'dim'], done ? ['in ~13 ms', 'acc'] : null);
          o.cnt = [['EVENTS READ', fmt(g * 1000)], ['MS', done ? '~13' : '…', 'dim'], ['BEFORE', '1,000,000 · 1,800 ms', 'dim']];
          o.res = done ? [['~13 ms · 140× faster', 'acc'], ['balance 10,000 on both', 'acc']] : []; } },
      { id: 'politica', dur: 6, title: 'Compare the policies', yk: 'NONE · EVERY 10,000 · EVERY 1,000',
        opts: POL.map(p => [p.name, `${fmt(p.n)} events`]),
        code: ['none: 1,000,000 events · ~1,800 ms (measured)', 'every 10,000: ≤ 10,000 events', '  ~29 ms (estimate: 18 ms of reading', '  + the fixed cost of the measurement)', 'every 1,000: ≤ 1,000 events · ~13 ms (measured)'],
        story: 'Pick the policy on the buttons above and watch the counter. <b>None</b>: re-reads the million, ~1,800 ms. <b>Every 10,000</b> (the article\'s example): at most 10,000 events after the photo, 100× fewer; we did not measure it, and the math gives about 29 ms (18 ms of reading at 555 thousand/s plus the fixed cost that showed up in the measurement). <b>Every 1,000</b>: at most 1,000 events, ~13 ms measured. More frequent photos shorten the tail and cost more background writes.',
        look: 'The photo moves along the rail according to the policy; the event and ms counters change with it.',
        key: 'The closer to the end the photo is, the smaller the tail to fold.',
        f(o) { const p = POL[pol]; lit(o, 'store', 'fold', 'rm1'); if (pol) lit(o, 'aux');
          o.evs = cev(i => pol === 0 ? 'acc' : i === 4 ? 'acc' : 'dim');
          if (pol === 1) photo(o, 3, ['PHOTO', 'v990.000', 'balance 9,900']); if (pol === 2) photo(o, 3, ['PHOTO', 'v999.000', 'balance 9,990']);
          o.rows.aux = act('snapshots', 'TABLE', pol ? [pol === 1 ? 'last: v990,000' : 'last: v999,000', 'acc'] : ['no photo', 'dim']);
          o.rows.cmd = act('policy', 'SNAPSHOT', [p.name, 'hi']);
          o.rows.fold = act('rehydrate', p.how.toUpperCase(), [`${fmt(p.n)} events`, 'hi'], [p.ms, 'acc']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', ['balance 10,000', 'acc'], [`in ${p.ms}`, 'dim']);
          bm(o, CAB.sf, { on: true, flow: true }); if (pol) bm(o, CAB.af, { on: true });
          o.cnt = [['EVENTS READ', fmt(p.n)], ['MS', `${p.ms} (${p.how})`, 'dim'], ['POLICY', p.name, 'dim']];
          o.res = [[`${p.name}: ${p.ms}`, 'acc'], [p.tail, 'dim']]; } },
      { id: 'descartavel', dur: 6, title: 'Derived and disposable', yk: 'DELETE FROM snapshots',
        code: ['DELETE FROM snapshots;', '  → the next rehydration reads everything', '  → ~1,800 ms, balance 10,000', 'no fact is lost', 'the source of truth is still the Store'],
        story: 'The photo is <b>derived</b>: you can delete all of them and the system stays right, only slower (it goes back to ~1,800 ms until the snapshotter takes new photos). The Store is still the only source of truth. That gives freedom: change the policy, swap the format, redo the photos, all without fear of losing data.',
        look: 'The photo vanishes from the rail and the table empties out; the folder goes back to reading the whole rail.',
        key: 'Deleting the snapshots only makes reads slower.',
        f(o, t) { const gone = t > 1.2; lit(o, 'store', 'fold', 'rm1'); o.evs = cev(gone ? 'acc' : i => i === 4 ? 'acc' : 'dim');
          if (!gone) photo(o, 3, ['PHOTO', 'v999.000', 'balance 9,990'], 'bad');
          o.on.aux = gone ? 0 : 'bad'; o.rows.aux = act('snapshots', 'TABLE', [gone ? 'empty' : 'DELETE…', gone ? 'dim' : 'bad']);
          o.rows.cmd = act('operator', 'DELETE', ['DELETE FROM snapshots', 'hi']);
          o.rows.fold = act('rehydrate', 'NO PHOTO', [gone ? '1,000,000 events' : '…', 'hi'], [gone ? '~1,800 ms' : '', 'dim']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', ['balance 10,000', 'acc'], ['right, slower', 'dim']);
          bm(o, CAB.sf, { on: gone, flow: gone });
          o.cnt = [['PHOTOS', gone ? '0' : '1'], ['MS', gone ? '~1.800' : '~13', 'dim'], ['BALANCE', '10.000', 'dim']];
          o.res = gone ? [['slower, still right', 'acc']] : []; } },
      { id: 'codigo-antigo', dur: 7, title: 'What if it goes wrong: the photo from old code', yk: 'STATE FORMAT CHANGED',
        code: ["photo: {saldo: 9990} (code v1)", "code v2 expects {disponivel, reservado}", '  → the photo is not read', 'discard the photo · rehydrate from scratch', '  ~1,800 ms · generate the new photo', 'keep the code version in the photo'],
        story: 'The state format changes: the new code stores <code>{disponivel, reservado}</code> and the old photo has only <code>{saldo}</code> (example). The photo is no longer usable. Since it is disposable, the way out is simple: <b>discard</b> it, rehydrate from scratch (~1,800 ms once) and write the photo in the new format. That is why it pays to keep in the photo the <b>code version</b> that generated it: the reader knows right away whether it can use it.',
        look: 'The photo turns red and falls; the folder re-reads the whole rail and a new photo is pinned in its place.',
        key: 'A photo in an old format: it is discarded and redone from the events.',
        f(o, t) { const redo = t > 2.2, fresh = t > 4; lit(o, 'store'); o.on.fold = redo ? 1 : 'bad'; o.on.aux = fresh ? 1 : 'bad'; if (fresh) lit(o, 'rm1');
          o.evs = cev(redo ? 'acc' : i => i === 4 ? 'hi' : 'dim');
          if (!redo) photo(o, 3, ['PHOTO v1', 'v999.000', '{saldo}'], 'bad'); else if (fresh) photo(o, 3, ['PHOTO v2', 'v999.000', 'available']);
          bm(o, CAB.sf, { on: redo && !fresh, flow: redo && !fresh });
          o.rows.aux = act('snapshots', 'TABLE', [fresh ? '999,000 · code v2' : '999,000 · code v1', fresh ? 'acc' : 'bad']);
          o.rows.cmd = act('code v2', 'DEPLOY', ['{disponivel, reservado}', 'hi']);
          o.rows.fold = act('rehydrate', redo ? 'FROM SCRATCH' : 'PHOTO?', [redo ? '1,000,000 events' : 'format v1: cannot read', redo ? 'hi' : 'bad'], [redo ? '~1,800 ms, once' : '', 'dim']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', fresh ? ['available 10,000', 'acc'] : ['…', 'dim']);
          o.cnt = [['THE PHOTO', fresh ? 'new (v2)' : redo ? 'discarded' : 'format v1', fresh ? '' : 'bad'], ['MS', redo ? '~1,800 once' : '…', 'dim'], ['AFTER', '~13 ms', 'dim']];
          o.res = fresh ? [['discarded, redid, new photo', 'acc']] : [['the old photo is no good', 'bad']]; } },
      { id: 'corrompida', dur: 8, title: 'What if it goes wrong: the corrupted photo', yk: 'CHECK BY SAMPLING',
        code: ['photo generated with a bug: v999,000 · balance 9,890', '  photo + 1,000 events = 9,900 (wrong)', 'and so on forever, as long as the photo exists', 'sample: rehydrate everything → 10,000', '  difference → delete the photo and redo it'],
        story: 'Worse than an unreadable photo is a <b>wrong</b> photo. If the snapshotter has a bug and writes balance 9,890 at v999,000 (example), every rehydration gives 9,900 instead of 10,000, and the error <b>propagates forever</b>, because nobody re-reads the start of the stream. The defense: keep the version of the code that generated the photo and <b>check by sampling</b>, from time to time, the photo + tail against the full rehydration. Difference found, the photo is deleted and redone.',
        look: 'The red photo gives 9,900; the full check lights up the whole rail and reaches 10,000. The photo is redone.',
        key: 'A wrong snapshot repeats the error every time: check it against the full rehydration.',
        f(o, t) { const chk = t > 2.4, fixd = t > 4.6; lit(o, 'store', 'aux'); o.on.rm1 = fixd ? 1 : 'bad'; o.on.fold = chk && !fixd ? 1 : fixd ? 1 : 'bad';
          o.evs = cev(chk ? 'acc' : i => i === 4 ? 'hi' : 'dim');
          photo(o, 3, ['PHOTO', 'v999.000', fixd ? 'balance 9,990' : 'balance 9,890'], fixd ? 'acc' : 'bad');
          bm(o, CAB.sf, { on: chk && !fixd, flow: chk && !fixd }); o.on.aux = fixd ? 1 : 'bad';
          o.rows.aux = act('snapshots', 'TABLE', [fixd ? '999,000 · 9,990 (redone)' : '999.000 · 9.890', fixd ? 'acc' : 'bad']);
          o.rows.cmd = act('check', 'SAMPLE', [chk ? 'rehydrate everything' : 'scheduled', 'hi'], [chk ? 'full: 10,000' : '', 'acc']);
          o.rows.fold = act('rehydrate', 'PHOTO + TAIL', [fixd ? 'balance 10,000' : 'balance 9,900', fixd ? 'acc' : 'bad']);
          o.rows.rm1 = act('Estoque aggregate', 'LOADED', [fixd ? 'balance 10,000' : 'balance 9,900 (wrong)', fixd ? 'acc' : 'bad']);
          o.cnt = [['PHOTO + TAIL', fixd ? '10.000' : '9.900', fixd ? '' : 'bad'], ['FULL', chk ? '10.000' : '…', 'dim'], ['PHOTO', fixd ? 'redone' : 'wrong', fixd ? 'dim' : 'bad']];
          o.res = fixd ? [['redone: 10,000 again', 'acc']] : chk ? [['difference: 9,900 ≠ 10,000', 'bad']] : [['the error repeats on every read', 'bad']]; } },
    ],
    versao: [
      { id: 'cena', dur: 5, title: 'In order in the Store, out of order on arrival', yk: 'THE ARRIVAL AT THE STATUS MODEL', act: ['Deliver the 5', 'last wins'],
        code: ['in the Store: v1 e-501 · v2 e-502 · v3 e-504 · v4 e-505', 'on arrival at the consumer:', '  e-501 (v1) · e-504 (v3) · e-505 (v4)', '  e-502 (v2) · e-502 (v2, again)', 'partitions, retries, parallel consumers'],
        story: 'The Store guarantees order <b>within the stream</b>: v1, v2, v3, v4. Whoever consumes does not necessarily receive it in that order: a retry delays <code>e-502</code>, another parallel consumer delivers <code>e-504</code> first, and <code>e-502</code> even arrives twice. The queue on the left shows the arrival at 1047\'s status model: <code>e-501</code>, <code>e-504</code>, <code>e-505</code>, <code>e-502</code>, <code>e-502</code>. On the right, two rules will process the same arrival.',
        look: 'In the Store, the four in order. In the arrival queue, the shuffled order. On the right, the two models still empty.',
        key: 'The Store orders the stream; the arrival at the consumer does not respect that order.',
        f(o) { lit(o, 'store', 'cmd');
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: ARR(ORD0).map(l => [l, 'none']), tapeLabel: 'QUEUE' };
          o.rows.rm1 = act('last wins', 'MODEL A', ['empty', 'dim']); o.rows.rm2 = act('higher version', 'MODEL B', ['empty', 'dim']);
          o.rows.fold = act('consumer', 'RULES', ['A: writes what arrived', 'hi'], ['B: only if version >', 'hi']);
          o.cnt = [['ARRIVALS', '0 of 5'], ['A', 'empty', 'dim'], ['B', 'empty', 'dim']];
          o.res = [['same arrival, two rules', 'dim']]; } },
      { id: 'ultimo', dur: 7, title: 'Last to arrive wins: ends at pago', yk: 'UPDATE … SET status = $s', act: ['Higher version only', 'the same arrival'],
        code: ['e-501 v1 → criado', 'e-504 v3 → enviado', 'e-505 v4 → entregue', 'e-502 v2 → pago   (goes back in time)', 'e-502 v2 → pago', '= pago · version 2 (wrong)'],
        story: 'The naive rule writes whatever arrived last. The model goes through <code>criado</code>, <code>enviado</code> and <code>entregue</code>, and then the late <code>e-502</code> arrives and takes it back to <code>pago</code>. The duplicate repeats the damage. End: <b><code>pago</code>, version 2</b>, and the order was already delivered. If <code>e-505</code> had arrived last, the rule would get it right, by luck.',
        look: 'Each block of the queue lights up and goes to model A, top right, which ends red at pago.',
        key: 'Last to arrive wins: the late one erases the newest.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 0.9, 5), a = arrive(ORD0, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold');
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: ARR(ORD0).map((l, i) => [l, i < j ? 'ok' : i === j ? 'recv' : 'none']), tapeLabel: 'QUEUE' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), PE[ORD0[j]][1]); pk(o, WAY.f1, fr * 2 - 1, ''); }
          o.on.rm1 = done ? 'bad' : j ? 1 : 0;
          o.rows.rm1 = act('last wins', 'MODEL A', a.lw < 0 ? ['empty', 'dim'] : [`${ST[a.lw]} · version ${a.lw + 1}`, done ? 'bad' : 'acc'], done ? ['should be: entregue · v4', 'bad'] : null);
          o.rows.rm2 = act('higher version', 'MODEL B', ['waits', 'dim']);
          o.rows.fold = act('rule A', 'LAST WINS', [j ? `arrived ${PE[ORD0[j - 1]][1]}` : '…', 'hi'], ['always writes', 'dim']);
          o.cnt = [['ARRIVALS', `${j} of 5`], ['A', a.lw < 0 ? 'empty' : `${ST[a.lw]} v${a.lw + 1}`, done ? 'bad' : 'dim'], ['RIGHT', 'entregue v4', 'dim']];
          o.res = done ? [['pago · version 2: wrong', 'bad']] : []; } },
      { id: 'maior', dur: 7, title: 'Apply only if the version is higher: entregue', yk: 'UPDATE … WHERE versao < $v', act: ['Shuffle', 'another order'],
        code: ['UPDATE status_pedidos SET status = $s,', '  versao = $v', '  WHERE pedido_id = 1047 AND versao < $v;', 'e-501 v1 applies · e-504 v3 applies', 'e-505 v4 applies · e-502 v2 discards (×2)', '= entregue · version 4'],
        story: 'The second rule keeps the version next to the status and only applies the event if its version is <b>higher</b> than the stored one: <code>UPDATE … WHERE pedido_id = 1047 AND versao &lt; $v</code>. <code>e-501</code> applies, <code>e-504</code> (v3) applies, <code>e-505</code> (v4) applies, and both <code>e-502</code>s (v2 &lt; 4) are <b>discarded</b>. End: <b><code>entregue</code>, version 4</b>. The author\'s lab does the same on ScyllaDB with <code>UPDATE … IF version &lt; ?</code>.',
        look: 'The same queue goes to model B; both e-502s turn red (discarded) and the model ends at entregue.',
        key: 'Higher version only: the late one is discarded and the state stays right.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 0.9, 5), a = arrive(ORD0, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold'); if (j) lit(o, 'rm2');
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: ARR(ORD0).map((l, i) => [l, i < j ? (a.log[i] ? 'ok' : 'bad') : i === j ? 'recv' : 'none']), tapeLabel: 'QUEUE' };
          if (!done) { const okv = ORD0[j] > a.vm; pk(o, WAY.cf, Math.min(1, fr * 2), PE[ORD0[j]][1], okv ? '' : 'bad'); if (okv) pk(o, WAY.f2, fr * 2 - 1, ''); }
          o.on.rm1 = 'bad'; o.rows.rm1 = act('last wins', 'MODEL A', ['pago · version 2', 'bad']);
          o.rows.rm2 = act('higher version', 'MODEL B', a.vm < 0 ? ['empty', 'dim'] : [`${ST[a.vm]} · version ${a.vm + 1}`, 'acc'], ['discarded: ' + a.log.filter(x => !x).length, 'dim']);
          o.rows.fold = act('rule B', 'HIGHER VERSION', [j ? `${PE[ORD0[j - 1]][1]}: ${a.log[j - 1] ? 'applies' : 'discards'}` : '…', j && !a.log[j - 1] ? 'bad' : 'hi'], ['WHERE versao < $v', 'dim']);
          o.cnt = [['ARRIVALS', `${j} of 5`], ['B', a.vm < 0 ? 'empty' : `${ST[a.vm]} v${a.vm + 1}`, 'dim'], ['DISCARDS', String(a.log.filter(x => !x).length), 'dim']];
          o.res = done ? [['entregue · version 4', 'acc'], ['pago · v2 with last wins', 'bad']] : []; } },
      { id: 'embaralhar', dur: 7, title: 'Shuffle: the higher version always gets it right', yk: 'ANOTHER ARRIVAL ORDER', act: ['Shuffle again', 'another order', 'shuf'],
        code: ['any order of the 5:', '  higher version → entregue · v4', '  last wins → the status of whoever arrived last', 'version: assigned by the Store, no clock', 'timestamp: depends on the clock', '  (the 120 ms skew from module 17)'],
        story: 'Shuffle the arrival as many times as you like. The version rule <b>always</b> ends at <code>entregue</code>, version 4. "Last wins" ends at the status of whoever arrived last, and is only right when that is <code>e-505</code>. The article offers comparing "by timestamp or version"; the timestamp depends on a clock, and the 120 ms skew from module 17 is enough to swap two events. The <b>version</b> is assigned by the Store and grows by 1 within the stream, with no clock at all.',
        look: 'The queue changes order on every click of Shuffle; model B always ends at entregue, A changes.',
        key: 'With the version, the arrival order stops mattering.',
        f(o, t) { const [j, fr] = seq(t, 0.3, 0.6, 5), a = arrive(ord, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold'); if (j) lit(o, 'rm2');
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: ARR(ord).map((l, i) => [l, i < j ? (a.log[i] ? 'ok' : 'bad') : i === j ? 'recv' : 'none']), tapeLabel: 'QUEUE' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), PE[ord[j]][1]); pk(o, WAY.f1, fr * 2 - 1, ''); pk(o, WAY.f2, fr * 2 - 1, ''); }
          const lwOk = a.lw === 3; o.on.rm1 = done ? (lwOk ? 1 : 'bad') : j ? 1 : 0;
          o.rows.rm1 = act('last wins', 'MODEL A', a.lw < 0 ? ['empty', 'dim'] : [`${ST[a.lw]} · version ${a.lw + 1}`, done && !lwOk ? 'bad' : 'acc'], done ? [lwOk ? 'right, by luck' : 'wrong', lwOk ? 'dim' : 'bad'] : null);
          o.rows.rm2 = act('higher version', 'MODEL B', a.vm < 0 ? ['empty', 'dim'] : [`${ST[a.vm]} · version ${a.vm + 1}`, 'acc'], ['discarded: ' + a.log.filter(x => !x).length, 'dim']);
          o.rows.fold = act('the two rules', 'SAME QUEUE', [ARR(ord).join(' '), 'hi']);
          o.cnt = [['A (LAST)', a.lw < 0 ? '…' : `${ST[a.lw]} v${a.lw + 1}`, done && !lwOk ? 'bad' : 'dim'], ['B (VERSION)', a.vm < 0 ? '…' : `${ST[a.vm]} v${a.vm + 1}`], ['ARRIVALS', `${j} of 5`, 'dim']];
          o.res = done ? [['B: entregue · v4', 'acc'], [lwOk ? 'A: right by luck' : `A: ${ST[a.lw]} (wrong)`, lwOk ? 'dim' : 'bad']] : []; } },
      { id: 'soma', dur: 7, title: 'The limit: in a model that adds up, discarding loses', yk: 'LAST STATE × SUM', act: ['Simulate the gap', 'v2 does not arrive'],
        code: ['stock balance (example):', '  v1 +3 · v3 −1 (another order) · v2 −1 late', '  "higher version": v2 < 3 → discards', '  balance 2 (the right answer is 1)', 'here: idempotency by evento_id (lesson 10)', '  and commutative operations (CRDT, module 17)'],
        story: 'The rule "discard the lower version" suits <b>last-state</b> models, like the status: only the newest matters. In a model that <b>adds up</b>, like a balance, every event counts. Example: stock receives v1 (+3), v3 (−1, another order) and then the late v2 (−1). Discarding it as "lower version" <b>loses</b> a reservation: balance 2 instead of 1. There the defense is different: apply each <code>evento_id</code> only once (lesson 10), with operations that give the same result in any order (the idea behind the CRDTs of module 17).',
        look: 'Model B becomes a balance; the late v2 turns red, discarded, and the balance stays at 2.',
        key: 'Higher version suits last state; a sum needs evento_id.',
        f(o, t) { const late = t > 2; lit(o, 'store', 'cmd'); o.on.fold = late ? 'bad' : 1; o.on.rm2 = late ? 'bad' : 1;
          o.rows.store = STORE('stock (example)'); o.evs = [ev(0, ['v1', 'balance', '+3']), ev(1, ['v2', 'reservation', '−1'], late ? 'bad' : 'hi'), ev(2, ['v3', 'reservation', '−1'])];
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: [['v1 +3', 'ok'], ['v3 −1', 'ok'], ['v2 −1', late ? 'bad' : 'recv']], tapeLabel: 'QUEUE' };
          pk(o, WAY.cf, lin(t, 0.6, 2, 0, 1), 'v2 −1');
          o.rows.fold = act('rule B', 'ON A SUM', ['v2 < 3: discards', late ? 'bad' : 'dim']);
          o.rows.rm1 = act('status of 1047', 'LAST STATE', ['entregue · v4: ok', 'acc']);
          o.rows.rm2 = act('balance', 'SUM', [late ? 'balance 2' : 'balance 2 …', late ? 'bad' : 'hi'], ['the right answer: 1', 'dim']);
          o.cnt = [['BALANCE', late ? '2' : '…', late ? 'bad' : ''], ['RIGHT', '1', 'dim'], ['LOST', late ? 'one reservation' : '…', 'dim']];
          o.res = late ? [['discarding on a sum loses', 'bad'], ['use evento_id (lesson 10)', 'acc']] : []; } },
      { id: 'buraco', dur: 8, title: 'What if it goes wrong: the v2 that never arrives', yk: 'versao ≠ last + 1',
        code: ['v1 arrived, then v3', '  3 ≠ 1 + 1: v2 is missing', 'apply v3 and move on: a gap', 'detect: wait for v2 or ask the Store', "  SELECT … WHERE stream_id = 'pedido-1047'", '  AND versao = 2  → e-502'],
        story: 'The v2 is now lost: the consumer receives v1 and then v3. The higher-version rule would apply v3 and move on, and the model would have a <b>gap</b>: it never learned about the payment. The careful consumer checks <code>versao = last + 1</code>; if it does not match, it <b>waits</b> a little for v2 or <b>asks the Store</b> for what is missing (or rebuilds the model from the stream). Only then does it apply v3. That is why the Store has to answer "give me version 2 of this stream".',
        look: 'v3 is dashed, waiting. A cable runs from the consumer to the Store, fetches e-502 and only then are the two applied.',
        key: 'A version that skips is a gap: the consumer waits or fetches the missing one.',
        f(o, t) { const ask = t > 2, got = t > 3.6, done = t > 4.6; lit(o, 'store', 'cmd'); o.on.fold = got ? 1 : 'bad'; if (done) lit(o, 'rm2');
          o.evs = pev(4, i => i === 1 && ask ? 'acc' : 'hi');
          o.rows.cmd = { ...act('consumer', 'ARRIVAL'), tape: [['e-501', 'ok'], ['e-504', got ? 'ok' : 'recv'], ['e-505', 'none'], ['e-502', ask ? (got ? 'ok' : 'recv') : 'none']], tapeLabel: 'QUEUE' };
          if (ask) { bm(o, CAB.cs, { on: !got, tone: '' }); pk(o, WAY.cs(1), lin(t, 2, 3.6, 0, 1), 'version 2?'); }
          o.rows.fold = act('consumer', 'CHECKS', ['last: v1 · v3 arrived', ask ? 'hi' : 'bad'], [got ? 'v2 fetched: applies v2, v3' : '3 ≠ 1 + 1: waits', got ? 'acc' : 'bad']);
          o.rows.rm1 = act('no check', 'MODEL A', ['enviado · v3', 'bad'], ['never learned about pago', 'bad']); o.on.rm1 = 'bad';
          o.rows.rm2 = act('checking', 'MODEL B', done ? ['enviado · version 3', 'acc'] : ['criado · v1 (waiting)', 'dim'], done ? ['no gap', 'dim'] : null);
          o.cnt = [['LAST', got ? 'v3' : 'v1'], ['ARRIVED', 'v3', 'dim'], ['MISSING', got ? 'nothing' : 'v2', got ? 'dim' : 'bad']];
          o.res = done ? [['fetched v2 and applied in order', 'acc']] : ask ? [['asking the Store for v2', 'dim']] : [['gap: v2 is missing', 'bad']]; } },
    ],
    idempotencia: [
      { id: 'cena', dur: 5, title: 'e-502 may arrive more than once', yk: 'AT LEAST ONCE', act: ['Deliver e-502', 'no protection'],
        code: ['the stock consumer listens to PedidoPago', '  and reserves 1 cat: balance − 1', 'balance of GATO-042: 3', 'delivery is "at least once":', '  the relay resends, the consumer crashes,', '  rehydration republishes'],
        story: 'The stock consumer listens to <code>PedidoPago</code> and reserves the cat: balance minus 1. The <code>GATO-042</code> balance is <b>3</b>. The bus delivers <b>at least once</b> (lesson 5): the outbox relay resends when it does not know whether the message arrived, the consumer can crash after applying and before acknowledging, and rehydration (lesson 7) republishes on purpose. Module 6\'s <code>e-502</code> is going to arrive twice.',
        look: 'The Store has 1047 up to v2, e-502. On the right, the stock balance at 3 and the processed table switched off.',
        key: 'If delivery is at least once, the consumer will see duplicates.',
        f(o) { lit(o, 'store', 'rm2'); o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'DELIVERY'), tape: [['e-502', 'none'], ['e-502', 'none']], tapeLabel: 'QUEUE' };
          o.rows.fold = act('consumer', 'STOCK', ['PedidoPago → balance − 1', 'hi']);
          o.rows.rm2 = STK(3);
          o.cnt = [['BALANCE', '3'], ['DELIVERIES', '0 of 2', 'dim'], ['PROTECTION', 'none', 'dim']];
          o.res = [['e-502 is going to arrive twice', 'dim']]; } },
      { id: 'sem', dur: 7, title: 'No protection: 3 → 2 → 1', yk: 'MODULE 6\'S STOCK', act: ['With the table', 'eventos_processados'],
        code: ['1st delivery of e-502:', "  UPDATE estoque SET saldo = saldo − 1  → 2", '2nd delivery of e-502 (the same):', "  UPDATE estoque SET saldo = saldo − 1  → 1", '1 cat sold, 2 reserved'],
        story: 'Without protection, each delivery applies again. The first takes the balance from 3 to <b>2</b>, as it should. The second is the same fact, but the consumer does not know that, and the balance goes to <b>1</b>. The store sold one cat and reserved two: it is the module 6 defect, now on the consuming side.',
        look: 'Two lights leave the queue; each one lowers the balance by one. The balance turns red at 1.',
        key: 'Without idempotency, the duplicate becomes a double effect.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 1.4, 2), s = 3 - j, done = j >= 2; lit(o, 'store', 'cmd', 'fold'); o.on.rm2 = done ? 'bad' : 1;
          o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'DELIVERY'), tape: [['e-502', j > 0 ? 'ok' : 'recv'], ['e-502', j > 1 ? 'bad' : j === 1 ? 'recv' : 'none']], tapeLabel: 'QUEUE' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), 'e-502', j ? 'bad' : ''); pk(o, WAY.f2, fr * 2 - 1, '−1', j ? 'bad' : ''); }
          o.rows.fold = act('consumer', 'NO PROTECTION', [`applied ${j} time${j === 1 ? '' : 's'}`, j > 1 ? 'bad' : 'hi']);
          o.rows.rm2 = STK(s, done ? 'bad' : 'acc', done ? ['the right answer: 2', 'bad'] : null);
          o.cnt = [['BALANCE', String(s), done ? 'bad' : ''], ['DELIVERIES', `${j} of 2`, 'dim'], ['THE RIGHT ONE', '2', 'dim']];
          o.res = done ? [['3 → 2 → 1: one cat too many reserved', 'bad']] : []; } },
      { id: 'com', dur: 7, title: 'With the processed table: 3 → 2', yk: 'IN THE SAME TRANSACTION',
        code: ['BEGIN;', "INSERT INTO eventos_processados (evento_id)", "  VALUES ('e-502') ON CONFLICT DO NOTHING;", '-- 0 rows = already processed: does not apply', "UPDATE estoque SET saldo = saldo − 1 …;", 'COMMIT;'],
        story: 'Now the consumer writes the <code>evento_id</code> to an <code>eventos_processados</code> table <b>in the same transaction</b> that applies the effect. On the first delivery, the <code>INSERT</code> goes in and the balance goes to 2. On the second, <code>ON CONFLICT DO NOTHING</code> inserts 0 rows: <code>e-502</code> was already processed, and the consumer acknowledges without applying anything. Final balance: <b>2</b>. The same transaction is what matters: if the id and the effect were written at different moments, a crash between the two would reopen the duplication.',
        look: 'The first light writes e-502 to the table below and lowers the balance; the second hits the table and stops, red.',
        key: 'Keeping the evento_id together with the effect, in the same transaction, makes the consumer idempotent.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 1.4, 2), done = j >= 2; lit(o, 'store', 'cmd', 'fold', 'rm2'); if (j) lit(o, 'proc');
          o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'DELIVERY'), tape: [['e-502', j > 0 ? 'ok' : 'recv'], ['e-502', j > 1 ? 'bad' : j === 1 ? 'recv' : 'none']], tapeLabel: 'QUEUE' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), 'e-502'); pk(o, WAY.fp, fr * 2 - 1, j ? '0 rows' : 'INSERT', j ? 'bad' : ''); if (!j) pk(o, WAY.f2, fr * 2 - 1, '−1'); }
          o.rows.fold = act('consumer', 'IDEMPOTENTE', [j > 1 ? 'e-502: already processed' : j ? 'applied 1 time' : '…', j > 1 ? 'acc' : 'hi'], ['BEGIN … COMMIT', 'dim']);
          o.rows.rm2 = STK(j ? 2 : 3, 'acc');
          o.rows.proc = act('eventos_processados', 'TABLE', j ? ['e-502', 'acc'] : ['empty', 'dim'], j > 1 ? ['2nd: 0 rows inserted', 'bad'] : null);
          o.cnt = [['BALANCE', j ? '2' : '3'], ['DELIVERIES', `${j} of 2`, 'dim'], ['IGNORED', j > 1 ? '1' : '0', 'dim']];
          o.res = done ? [['3 → 2: the duplicate changes nothing', 'acc']] : []; } },
      { id: 'store', dur: 6, title: 'In the Store, the UNIQUE (evento_id) blocks its own', yk: 'PostgreSQL 14 · eventos_evento_id_key',
        code: ["append_evento('pedido-1047', 'e-502', …, 4)", 'ERROR: duplicate key value violates', '  unique constraint "eventos_evento_id_key"', 'DETAIL: Key (evento_id)=(e-502)', '  already exists.'],
        story: 'The Store already had its own defense: the <code>UNIQUE (evento_id)</code>. Trying to write <code>e-502</code> again to <code>pedido-1047</code>, even with the right expected version (4), fails with <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code>, <code>DETAIL: Key (evento_id)=(e-502) already exists.</code> (measured on PostgreSQL 14). But that protects the <b>write</b>. On the consuming side, each consumer needs its own protection.',
        look: 'An e-502 comes down onto the rail as v5, turns red and disappears. The original v2 lights up in red.',
        key: 'The Store blocks the repeated fact; the consumer has to block the repeated delivery.',
        f(o, t) { const no = t > 1.8, gone = t > 3.4; lit(o, 'store'); o.evs = pev(4, i => i === 1 && no ? 'bad' : 'hi');
          if (!gone) o.evs.push(ev(4, ['v5?', 'e-502', 'Pago'], no ? 'bad' : 'pend', 0, (1 - clamp(t / 1.8)) * 30));
          o.rows.cmd = act('psql', 'SESSION', ["append_evento(…, 'e-502',", 'hi'], ['  …, 4)', 'hi']);
          o.rows.fold = act('Store', 'UNIQUE', ['(evento_id)', no ? 'bad' : 'hi']);
          o.rows.rm2 = STK(2); o.rows.proc = act('eventos_processados', 'TABLE', ['e-502', 'hi']);
          o.cnt = [['IN THE STORE', no ? 'refused' : '…', no ? 'bad' : ''], ['CONSTRAINT', 'evento_id_key', 'dim'], ['WRITTEN', no ? 'nothing' : '…', 'dim']];
          o.res = no ? [['duplicate key: eventos_evento_id_key', 'bad'], ['Key (evento_id)=(e-502)', 'bad']] : []; } },
      { id: 'jeitos', dur: 6, title: 'Three ways to be idempotent', yk: 'DEPENDING ON THE MODEL', act: ['Reprocess everything', 'no protection'],
        code: ['(a) by version: last-state model', '    the duplicate does not pass versao < $v', '(b) by evento_id: model that adds up', '    eventos_processados in the same transaction', '(c) by natural key: _id = movimentacao_id', '    MongoDB: duplicate 11000 ignored'],
        story: 'The way depends on the model. <b>(a) By version</b>, in last state: the duplicate has the same version and does not pass <code>versao &lt; $v</code> (lesson 9). <b>(b) By <code>evento_id</code></b>, in a model that adds up: the processed table we just saw. <b>(c) By natural key</b>: the destination uses the fact\'s identifier as the key. The author lab\'s statement writes to MongoDB with <code>_id = movimentacao_id</code> and <b>ignores</b> the duplicate error <code>11000</code> (read, not executed).',
        look: 'The three models light up on the right, each with its defense written out.',
        key: 'Last state uses version; sum uses evento_id; natural key blocks at the destination.',
        f(o) { lit(o, 'store', 'fold', 'rm1', 'rm2', 'proc'); o.show.rm1 = 1; o.evs = pev(4);
          o.rows.rm1 = act('status of 1047', '(a) VERSION', ['WHERE versao < $v', 'acc']);
          o.rows.rm2 = act('stock GATO-042', '(b) evento_id', ['eventos_processados', 'acc']);
          o.rows.proc = act('statement (MongoDB)', '(c) KEY', ['_id = movimentacao_id', 'acc'], ['11000: ignored', 'dim']);
          o.rows.cmd = act('consumers', 'THREE', ['each with its own defense', 'hi']);
          o.rows.fold = act('defense', 'BY MODEL', ['last state: version', 'hi'], ['sum: evento_id', 'hi'], ['destination: key', 'hi']);
          bm(o, CAB.f1, { on: true }); bm(o, CAB.f2, { on: true }); bm(o, CAB.fp, { on: true });
          o.cnt = [['LAST STATE', 'version'], ['SUM', 'evento_id', 'dim'], ['DESTINATION', 'natural key', 'dim']];
          o.res = [['each model, its own defense', 'acc']]; } },
      { id: 'replay', dur: 8, title: 'What if it goes wrong: reprocessing everything without protection', yk: 'REPLAY OF THE PERIOD',
        code: ['rehydration republishes e-501…e-505', 'stock consumer with no protection:', '  e-502 again → balance 2 → 1', 'and so on for every paid order in the period', 'with eventos_processados: nothing changes', 'it takes just one unprotected consumer'],
        story: 'The rehydration from lesson 7 republishes the whole period on purpose. In a consumer <b>without</b> protection, each <code>PedidoPago</code> in the period reserves stock again: 1047 takes the cat from 2 to 1, and the same happens on <b>every</b> order paid in the period. The replay, which was supposed to fix things, becomes mass duplication. It takes <b>one</b> non-idempotent consumer for that. And the processed table has its own limit: it grows forever. You define a <b>window</b> (7 days, like the topic retention) and whatever is older is decided by version.',
        look: 'The queue fills with the republished events; the balance drops again and turns red. At the bottom, the processed table shows the 7-day window.',
        key: 'Reprocessing requires every consumer to be idempotent.',
        f(o, t) { const g = lin(t, 0.4, 3.4, 0, 1), done = g >= 1; lit(o, 'store', 'cmd'); o.on.fold = 'bad'; o.on.rm2 = done ? 'bad' : 1; o.on.proc = 2;
          o.evs = pev(4, 'acc');
          o.rows.cmd = { ...act('rehydration', 'REPUBLISHES'), tape: PE.map((l, i) => [l[1], g * 4 > i ? (i === 1 ? 'bad' : 'ok') : 'none']), tapeLabel: 'QUEUE' };
          bm(o, CAB.sf, { on: !done, flow: !done }); bm(o, CAB.cf, { on: !done, flow: !done, tone: 'bad' });
          o.rows.fold = act('consumer', 'NO PROTECTION', ['e-502 again: − 1', 'bad'], ['every order in the period', 'bad']);
          o.rows.rm2 = STK(g * 4 > 1 ? 1 : 2, g * 4 > 1 ? 'bad' : 'hi', ['the right answer: 2', 'dim']);
          o.rows.proc = act('eventos_processados', 'WINDOW', ['keeps 7 days', 'hi'], ['older: by version', 'dim']);
          o.cnt = [['BALANCE', g * 4 > 1 ? '1' : '2', g * 4 > 1 ? 'bad' : ''], ['REPUBLISHED', `${Math.min(4, Math.floor(g * 4))} of 4`, 'dim'], ['IN THE PERIOD', 'all the paid ones', 'bad']];
          o.res = done ? [['replay becomes mass duplication', 'bad'], ['processed: 7-day window', 'dim']] : []; } },
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
  function head(x, u, d, W_, col, s1 = 11, y = s1 > 15 ? 13 : 11) {
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.5 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  // uma fita: células em fila; acesa = chegou/aplicada, contorno = chegando, vazia = ainda não, vermelha = descartada/duplicada
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
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.tape && d.tape.length) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'QUEUE');
    cv.tex.needsUpdate = true;
  }
  // um evento no trilho: versão grande, evento_id e tipo; acc = aceso, pend = a caminho (tracejado), bad = erro, dim = fora da conta
  function evFace(cv, l, tn) { const { x, P } = cv, u = v => v * P, light = theme === 'light', C = pal3(), W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = tn === 'bad' ? (light ? '#f4e4e2' : '#24130f') : tn === 'acc' ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    const strong = tn === 'acc' || tn === 'bad' || tn === 'pend';
    x.strokeStyle = tn === 'bad' ? BAD() : strong ? accC() : C.line; x.lineWidth = u(strong ? 1.4 : 0.6);
    if (tn === 'pend') x.setLineDash([u(2.6), u(1.8)]);
    x.strokeRect(u(0.8), u(0.8), cv.c.width - u(1.6), cv.c.height - u(1.6)); x.setLineDash([]);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const ys = [0.2, 0.5, 0.76], fs = [15, 10.5, 10.5];
    const c0 = tn === 'bad' ? BAD() : tn === 'acc' || tn === 'pend' ? accC() : tn === 'dim' ? INK() : C.inkHi, c1 = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : C.inkHi;
    l.forEach((s, i) => { if (!s) return; x.fillStyle = i ? c1 : c0; fitFont(x, u, s, fs[i], W_ - 5); x.fillText(s, u(W_ / 2), u(H_ * ys[i])); });
    cv.tex.needsUpdate = true; }
  function placeEvents(list, dt) {
    EV.forEach((E, j) => { const e = list[j];
      if (!e) { E.g.visible = false; E.at = null; E.glow.material.uniforms.intensity.value = 0; return; }
      const tgt = [RAIL.x + e.i * (EW + EG), RAIL.y, RAIL.z + e.lv * (EH + 1) + e.dz];
      if (!E.at || !E.g.visible || E.lv !== e.lv) E.at = [tgt[0], tgt[1], tgt[2] + (POSTER ? 0 : 46)];
      E.lv = e.lv;
      const k = 1 - Math.exp(-dt / 0.16); for (let q = 0; q < 3; q++) E.at[q] += (tgt[q] - E.at[q]) * k;
      E.g.visible = true; E.g.position.copy(W(...E.at));
      const key = JSON.stringify([e.l, e.tn]) + theme + accent.getHex(); if (E.key !== key) { E.key = key; evFace(E.top, e.l, e.tn); }
      E.mat.emissive.copy(e.tn === 'bad' ? badEm : accent); E.mat.emissiveIntensity = e.tn === 'acc' || e.tn === 'bad' ? 0.3 : 0;
      moveGlow(E.glow, [E.at[0] + EW / 2, E.at[1] + RAIL.d / 2, E.at[2] + EH + 2], e.tn === 'acc' ? 0.25 : 0); });
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
    projecao: () => `<table class="h3-sum"><tr><th>event (pedido-1047)</th><th>status of 1047</th><th>meus_pedidos</th></tr><tr${on_(1)}><td>v1 · e-501 · PedidoCriado</td><td>criado · v1</td><td>1047 · criado · 9,490</td></tr><tr${on_(1)}><td>v2 · e-502 · PedidoPago</td><td>pago · v2</td><td>1047 · pago</td></tr><tr${on_(1)}><td>v3 · e-504 · PedidoEnviado</td><td>enviado · v3 · LA123456789BR</td><td>1047 · enviado</td></tr><tr${on_(1, 4)}><td>v4 · e-505 · PedidoEntregue</td><td>entregue · v4</td><td>1047 · entregue</td></tr></table><li>Rebuilding a store model: 50 million orders × 4 = <b>200 million</b> events; writing at 20,000/s (the module 18 rate) = <b>10,000 s = 2 h 47 min</b>; reading the Store is not the bottleneck (~555 thousand events/s measured)</li><li>The article's three ways: <b>transactional</b> (same transaction), <b>semi-synchronous</b> (the Store publishes, the projection updates right after) and <b>asynchronous</b> (over the bus, eventual consistency)</li><li>The projection is deterministic with respect to the <b>sequence of events</b> (no <code>now()</code> and no external call); that is why the model is disposable</li><li>The Kafka topic (module 13) keeps 7 days: without the Store, there is nowhere to reprocess 1047 from 06/18</li><li>The faulty projection (without <code>PedidoEntregue</code>) is an example</li>`,
    rehidratacao: () => `<table class="h3-sum"><tr><th>stream</th><th>events</th><th>rehydrate (measured)</th></tr><tr${on_(0, 1)}><td>estoque-CANECA-007</td><td>1,000,000</td><td>1,935 · 1,801 · 1,770 ms · balance 10,000</td></tr><tr${on_(2, 3)}><td>pedido-1047</td><td>4</td><td>entregue · v4; up to 14:15: pago · v2</td></tr></table><li>The mug: for every 100 events, one <code>EstoqueAjustado +100</code> and 99 <code>EstoqueReservado −1</code>; table + indexes <b>263 MB</b> (~263 B per event); local PostgreSQL 14.24, Python client via <code>psql COPY</code>; ~<b>555 thousand events/s</b></li><li>Linear: 10 million events would take ~18 s (estimate at the same rate)</li><li>Author's lab (read, not executed): <code>rehydratate/listener.go</code> reads all the aggregate's events (<code>ORDER BY version ASC</code>, optional date filter) and republishes the balance</li><li>The old <code>{frete: 15.00}</code> is an example of format evolution; the fix is <i>upcasting</i> on read (Axon)</li>`,
    snapshot: () => `<table class="h3-sum"><tr><th>policy</th><th>events read</th><th>time</th></tr><tr${on_(0) || (step === 3 && pol === 0 ? ' class="on"' : '')}><td>none</td><td>1,000,000</td><td>1,935 · 1,801 · 1,770 ms (measured)</td></tr><tr${step === 3 && pol === 1 ? ' class="on"' : ''}><td>every 10,000</td><td>≤ 10,000</td><td>~29 ms (estimate, not measured)</td></tr><tr${on_(2) || (step === 3 && pol === 2 ? ' class="on"' : '')}><td>every 1,000</td><td>1,000 (photo at v999,000)</td><td>13.1 · 19.6 · 12.1 ms (measured)</td></tr></table><li>Photo at v999,000: balance 9,990; photo + 1,000 events = <b>10,000</b>, the same as the full path</li><li>~<b>140×</b> faster (1,800 ÷ ~13) and <b>1,000×</b> fewer events; the ~13 ms include starting <code>psql</code> twice</li><li><code>snapshots(stream_id PK, versao, estado jsonb, criado_em)</code>; the author's lab has the <code>snapshots</code> table and no Go code uses it</li><li>The <code>{disponivel, reservado}</code> state and the photo with 9,890 are examples of the two errors</li>`,
    versao: () => `<table class="h3-sum"><tr><th>arrival</th><th>last wins</th><th>higher version</th></tr>${ORD0.map((k, i) => { const a = arrive(ORD0, i + 1), b = arrive(ORD0, i); return `<tr${step === 1 || step === 2 ? ' class="on"' : ''}><td>${PE[k][1]} (v${k + 1})</td><td>${ST[k]} · v${k + 1}</td><td>${k > b.vm ? 'applies' : 'discards'} → ${ST[a.vm]} · v${a.vm + 1}</td></tr>`; }).join('')}</table><li>End: "last to arrive wins" → <b><code>pago</code>, version 2</b> (wrong); "apply only if the version is higher" (<code>UPDATE … WHERE pedido_id = 1047 AND versao &lt; $v</code>) → <b><code>entregue</code>, version 4</b></li><li>Author's lab: the balance in ScyllaDB uses <code>UPDATE … IF version &lt; ?</code> (lightweight transaction): the same principle</li><li>The Store never does LWW, it only appends; the rule holds in the consumer, with version (not timestamp: the module 17 clock lagged 120 ms)</li><li>The balance with v1 +3, v3 −1 and a late v2 is an example</li>`,
    idempotencia: () => `<table class="h3-sum"><tr><th>delivery of e-502</th><th>no protection</th><th>with eventos_processados</th></tr><tr${on_(1, 2)}><td>1st</td><td>3 → 2</td><td>INSERT e-502 · 3 → 2</td></tr><tr${on_(1, 2)}><td>2nd (the same)</td><td>2 → 1</td><td>0 rows · stays 2</td></tr></table><li>In the Store (PostgreSQL 14): <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code> · <code>DETAIL: Key (evento_id)=(e-502) already exists.</code></li><li>Three ways: by version (last state), by <code>evento_id</code> (sum, in the same transaction), by natural key (author's lab: MongoDB with <code>_id = movimentacao_id</code>, error <code>11000</code> ignored; read, not executed)</li><li>The processed table keeps a window (7 days, the topic retention); whatever is older is decided by version</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo (avança, ou embaralha a chegada) e as opções (a política de snapshot)
  function actHtml() { const s = cur(), a = s.act;
    const opts = s.opts ? `<div class="o3-mode r3-opt" role="group" aria-label="Policy">${s.opts.map(([n, d], i) => `<button data-opt="${i}" aria-pressed="${i === pol}">${n}<small>${d}</small></button>`).join('')}</div>` : '';
    return opts + (a ? `<div class="o3-mode r3-act"><button data-q3="${a[2] || 'next'}">${a[0]} ${a[2] ? '↻' : '→'}<small>${a[1]}</small></button></div>` : ''); }
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
  function readout() { if (active !== 'replay') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'replay' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-replay3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const again = () => { lt = 0; dwell = 0; render(); SFX.bit(1); return true; };
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'replay') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const op = e.target.closest('[data-opt]'); if (op) { pol = +op.dataset.opt; return again(); }
    const q = e.target.closest('[data-q3]'); if (!q) return;
    if (q.dataset.q3 === 'shuf') { shuffle(); return again(); }
    next(); });
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
    placeEvents(B.store.f > 0.5 ? o.evs : [], dt); drawScreen(o);
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...EV.map(e => e.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); EV.forEach(e => e.key = '');
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
