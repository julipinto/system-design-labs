// Figura 3D (iso-glow): derivar, reconstruir, ordenar. À esquerda o Event Store (um trilho com os blocos do stream), o leitor
// (comando, chegada ou consumidor) e a tabela de apoio (snapshots, tópico); no meio o dobrador, que aplica os eventos em ordem;
// à direita os modelos de leitura (status do 1047, meus_pedidos, o saldo do estoque) e a tabela de processados.
// Atrás, o mostrador (contadores de eventos e de ms, a conta do passo e o resultado). O snapshot é uma foto presa ao trilho.
// Cenários (botões e ?mode=projecao|rehidratacao|snapshot|versao|idempotencia; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/event-sourcing-brief.md): o pedido-1047 (e-501, e-502, e-504, e-505), o
// estoque-GATO-042 (3 → 2), o estoque-CANECA-007 com 1.000.000 de eventos (1.935 · 1.801 · 1.770 ms; com snapshot na v999.000:
// 13,1 · 19,6 · 12,1 ms), a reconstrução de 200 milhões de eventos a 20.000/s (2 h 47 min), a chegada e-501, e-504, e-505,
// e-502, e-502 (último vence → pago v2; versão maior → entregue v4) e o e-502 duplicado no estoque (3 → 2 → 1 × 3 → 2).
FIGS3D.push({ id: 'replay', name: 'Derivar, reconstruir, ordenar', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const fmt = n => Math.round(n).toLocaleString('pt-BR');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['projecao', 'rehidratacao', 'snapshot', 'versao', 'idempotencia'];
  const SCNAME = { projecao: 'Projeção', rehidratacao: 'Rehidratação', snapshot: 'Snapshot', versao: 'Versão', idempotencia: 'Idempotência' };
  const SCFULL = { projecao: 'Projeções e modelos de leitura', rehidratacao: 'Rehidratação', snapshot: 'Snapshot', versao: 'Ordem e versão', idempotencia: 'Idempotência' };
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
  const CE = [['v1', '+100', 'Ajustado'], ['v2', '−1', 'Reservado'], ['…', '', ''], ['v999.000', '−1', 'Reservado'], ['v1.000.000', '−1', 'Reservado']];
  const ev = (i, l, tn = 'hi', lv = 0, dz = 0) => ({ i, l, tn, lv, dz });
  const pev = (n, tn = 'hi') => PE.slice(0, n).map((l, i) => ev(i, l, typeof tn === 'function' ? tn(i) : tn));
  const cev = (tn = 'hi') => CE.map((l, i) => ev(i, l, typeof tn === 'function' ? tn(i) : tn));
  const ST = ['criado', 'pago', 'enviado', 'entregue'];
  // o saldo da caneca depois de n eventos (a cada 100: um +100 e 99 −1)
  const saldo = n => Math.floor(n / 100) + (n % 100 ? 101 - n % 100 : 0);
  const STATUS = (k, tn = 'hi', ...extra) => act('status do 1047', 'MODELO DE LEITURA',
    k < 0 ? ['vazio', 'dim'] : [`${ST[k]} · versão ${k + 1}`, tn], k >= 2 ? ['rastreio LA123456789BR', 'dim'] : null, ...extra);
  const MEUS = (k, tn = 'hi') => act('meus_pedidos', 'lena-77', k < 0 ? ['vazio', 'dim'] : [`1047 · ${ST[k]} · 9.490`, tn]);
  const STK = (s, tn = 'hi', ...extra) => act('estoque GATO-042', 'CONSUMIDOR', [`saldo ${s}`, tn], ...extra);
  const SHOW = { projecao: ['store', 'fold', 'rm1', 'rm2'], rehidratacao: ['store', 'cmd', 'fold', 'rm1'], snapshot: ['store', 'cmd', 'aux', 'fold', 'rm1'],
    versao: ['store', 'cmd', 'fold', 'rm1', 'rm2'], idempotencia: ['store', 'cmd', 'fold', 'rm2', 'proc'] };
  const STORE = (name, meta = 'EVENT STORE') => ({ ...act(name, meta), foot: 1 });
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], evs: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    const caneca = sc === 'rehidratacao' || sc === 'snapshot';
    o.rows.store = STORE(caneca ? 'estoque-CANECA-007' : 'pedido-1047');
    o.evs = caneca ? cev() : pev(sc === 'idempotencia' ? 2 : 4);
    o.rows.fold = act('projeção', 'DOBRA', ['estado = {}', 'dim']);
    o.rows.rm1 = STATUS(-1); o.rows.rm2 = MEUS(-1);
    o.rows.aux = act('snapshots', 'TABELA', ['nenhuma foto', 'dim']);
    o.rows.cmd = act('comando', 'LEITOR', ['', 'dim']);
    o.rows.proc = act('eventos_processados', 'TABELA', ['desligada', 'dim']);
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
    { name: 'Nenhum', n: 1000000, ms: '~1.800 ms', how: 'medido', tail: 'todos os 1.000.000' },
    { name: 'A cada 10.000', n: 10000, ms: '~29 ms', how: 'estimativa', tail: 'até 10.000 depois da foto' },
    { name: 'A cada 1.000', n: 1000, ms: '~13 ms', how: 'medido', tail: 'até 1.000 depois da foto' },
  ];
  const STEPS = {
    projecao: [
      { id: 'cena', dur: 5, title: 'Os mesmos fatos, outra forma de ler', yk: 'O STORE E DOIS MODELOS', act: ['Projetar os eventos', 'v1 a v4'],
        code: ['Store: pedido-1047 v1…v4', 'projeção: escuta e dobra', 'modelo 1: status do 1047', '  (a tela de acompanhamento)', 'modelo 2: meus_pedidos da lena-77', '  (o do módulo 18)'],
        story: 'À esquerda, o Event Store com o stream <code>pedido-1047</code>: os quatro fatos do pedido da Lena, de <code>e-501</code> a <code>e-505</code>. À direita, dois <b>modelos de leitura</b> ainda vazios: o <b>status do 1047</b>, que a tela de acompanhamento lê, e o <code>meus_pedidos</code> do módulo 18. No meio, a <b>projeção</b>: o código que escuta os eventos e mantém cada modelo. É o CQRS do módulo 18 com o Event Store no lugar do banco de escrita.',
        look: 'O trilho do Store tem quatro blocos. O dobrador no meio e os dois modelos à direita estão vazios.',
        key: 'A projeção transforma a lista de fatos numa tabela boa de ler.',
        f(o) { lit(o, 'store');
          o.cnt = [['APLICADOS', '0 de 4'], ['STATUS', 'vazio', 'dim'], ['STORE', '4 eventos', 'dim']];
          o.res = [['os fatos estão no Store; as telas, ainda não', 'dim']];
          T(o, [190, 110, 34], 'a fonte da verdade', 'dim'); T(o, [735, 110, 40], 'derivado', 'dim'); } },
      { id: 'dobra', dur: 6, title: 'Cada evento atualiza os dois modelos', yk: 'A PROJEÇÃO, EVENTO A EVENTO',
        code: ['PedidoCriado  → status criado, v1', 'PedidoPago    → status pago, v2', 'PedidoEnviado → enviado, rastreio, v3', 'PedidoEntregue → entregue, v4', 'meus_pedidos: 1047 · entregue · 9.490'],
        story: 'A projeção lê o stream em ordem e aplica cada evento. <code>PedidoCriado</code> cria a linha do 1047 (<code>criado</code>, 9.490 centavos); <code>PedidoPago</code> troca para <code>pago</code>; <code>PedidoEnviado</code> grava o rastreio <code>LA123456789BR</code>; <code>PedidoEntregue</code> fecha em <code>entregue</code>. Os dois modelos terminam iguais à tabela <code>pedidos</code> de antes, mas agora a tabela é <b>consequência</b> dos eventos.',
        look: 'Um bloco de cada vez sai do trilho, passa pelo dobrador e acende os dois modelos, que mudam de criado até entregue.',
        key: 'O modelo de leitura é o resultado de aplicar os eventos em ordem.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 1.1); lit(o, 'store', 'fold'); if (k > 0) lit(o, 'rm1', 'rm2');
          o.evs = pev(4, i => i < k ? 'acc' : 'hi');
          if (k < 4) { pk(o, WAY.sf(k), Math.min(1, fr * 2), PE[k][1]); pk(o, WAY.f1, fr * 2 - 1, ''); pk(o, WAY.f2, fr * 2 - 1, ''); }
          o.rows.fold = act('projeção', 'DOBRA', [k ? `aplicou ${PE[k - 1][2]}` : 'lendo v1…', 'hi'], [k ? `status ${ST[k - 1]} · v${k}` : '', 'dim']);
          o.rows.rm1 = STATUS(k - 1, 'acc'); o.rows.rm2 = MEUS(k - 1, 'acc');
          o.cnt = [['APLICADOS', `${k} de 4`], ['STATUS', k ? ST[k - 1] : 'vazio', 'dim'], ['VERSÃO', k ? String(k) : '0', 'dim']];
          o.res = k >= 4 ? [['entregue · versão 4', 'acc'], ['os dois modelos em dia', 'acc']] : []; } },
      { id: 'jeitos', dur: 6, title: 'Onde a projeção roda: três jeitos', yk: 'TRANSACIONAL · SEMISSÍNCRONO · ASSÍNCRONO',
        code: ['transacional: na mesma transação do evento', '  leitura sempre em dia; pesa o Store', 'semissíncrono: o Store avisa, a projeção', '  atualiza em seguida', 'assíncrono: pelo bus; desacoplado,', '  consistência eventual'],
        story: 'O artigo descreve três jeitos de ligar a projeção ao Store. <b>Transacional</b>: a projeção grava o modelo <b>na mesma transação</b> do evento; a leitura nunca fica atrás, mas cada gravação no Store fica mais pesada e vira gargalo. <b>Semissíncrono</b>: o Store publica e a projeção atualiza logo em seguida. <b>Assíncrono</b>: a projeção consome do bus (aula 5), desacoplada, e o modelo fica um pouco atrás: consistência eventual. A tela de status do 1047 aguenta alguns segundos de atraso; um saldo que decide uma venda talvez não.',
        look: 'O cabo do Store até o dobrador corre sem parar: é por ele que a projeção recebe, seja na transação, por aviso ou pelo bus.',
        key: 'Quanto mais perto da transação, mais em dia a leitura e mais caro o Store.',
        f(o) { lit(o, 'store', 'fold', 'rm1', 'rm2'); o.evs = pev(4, 'acc'); bm(o, CAB.sf, { on: true, flow: true });
          o.rows.fold = act('projeção', 'ONDE RODA', ['transacional', 'hi'], ['semissíncrono', 'hi'], ['assíncrono (bus)', 'hi']);
          o.rows.rm1 = STATUS(3); o.rows.rm2 = MEUS(3);
          o.cnt = [['TRANSACIONAL', 'em dia, pesa'], ['SEMISSÍNCRONO', 'logo depois', 'dim'], ['ASSÍNCRONO', 'eventual', 'dim']];
          o.res = [['cada modelo escolhe o atraso que aguenta', 'acc']]; } },
      { id: 'pura', dur: 7, title: 'Função pura: rodar de novo dá o mesmo', yk: 'MESMA SEQUÊNCIA → MESMO RESULTADO', act: ['Quebrar a projeção', 'um bug no deploy'],
        code: ['projetar(v1..v4) = entregue, v4', 'projetar(v1..v4) de novo = entregue, v4', 'sem now(), sem chamada externa,', '  sem número aleatório', 'logo: o modelo é descartável'],
        story: 'A propriedade que sustenta tudo: a projeção é uma <b>função pura</b> dos eventos. Com a mesma sequência, dá o mesmo resultado, hoje ou daqui a um ano. Para isso ela não pode ler o relógio (<code>now()</code>), chamar outro serviço nem sortear nada: tudo o que precisa está no evento. Por isso o modelo de leitura é <b>descartável</b>: se estragar, apaga-se e reconstrói-se do Store.',
        look: 'Os quatro eventos passam outra vez pelo dobrador e os modelos não mudam: continuam em entregue, versão 4.',
        key: 'Função pura dos eventos: o modelo pode ser apagado e refeito.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.9); lit(o, 'store', 'fold', 'rm1', 'rm2'); o.evs = pev(4, i => i < k ? 'acc' : 'hi');
          if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          o.rows.fold = act('projeção', 'DE NOVO', [`replay ${k} de 4`, 'hi'], ['sem now()', 'dim'], ['sem chamada externa', 'dim']);
          o.rows.rm1 = STATUS(3, 'acc'); o.rows.rm2 = MEUS(3, 'acc');
          o.cnt = [['REPLAY', `${k} de 4`], ['STATUS', 'entregue', 'dim'], ['MUDOU?', k >= 4 ? 'nada' : '…', 'dim']];
          o.res = k >= 4 ? [['mesmo resultado: entregue, v4', 'acc']] : []; } },
      { id: 'defeito', dur: 7, title: 'E se der errado: a projeção com defeito', yk: 'UM DEPLOY SEM O PedidoEntregue', act: ['Apagar o modelo', 'TRUNCATE'],
        code: ['projeção nova (com bug):', '  switch (tipo) { … }  // falta PedidoEntregue', 'v4 e-505 PedidoEntregue → ignorado', 'status do 1047: enviado (errado)', 'o Store continua certo: v1…v4'],
        story: 'Um deploy troca a projeção, e a versão nova esqueceu de tratar o <code>PedidoEntregue</code> (exemplo). Ela ignora o <code>e-505</code>, e o status do 1047 fica em <code>enviado</code>: a Lena já recebeu o gato e a tela diz que ainda está a caminho. O mesmo vale para todos os pedidos entregues depois do deploy. Repare que o <b>Store não mudou nada</b>: os quatro fatos estão lá, certos. O erro está só no modelo derivado.',
        look: 'O v4 passa pelo dobrador, que fica vermelho e não o aplica. Os modelos ficam vermelhos em enviado.',
        key: 'O erro mora no modelo derivado; o Store continua certo.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.8); lit(o, 'store'); o.evs = pev(4, i => i === 3 && k >= 4 ? 'bad' : i < k ? 'acc' : 'hi');
          const bug = k >= 4; o.on.fold = bug ? 'bad' : 1; if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          const s = Math.min(k, 3) - 1; o.on.rm1 = o.on.rm2 = bug ? 'bad' : 1;
          o.rows.fold = act('projeção v2', 'COM BUG', ['falta PedidoEntregue', bug ? 'bad' : 'dim'], [bug ? 'e-505 ignorado' : `aplicou v${k}`, bug ? 'bad' : 'dim']);
          o.rows.rm1 = STATUS(s, bug ? 'bad' : 'acc', bug ? ['deveria: entregue · v4', 'bad'] : null); o.rows.rm2 = MEUS(s, bug ? 'bad' : 'acc');
          o.cnt = [['STATUS NA TELA', bug ? 'enviado' : '…', bug ? 'bad' : ''], ['NO STORE', 'v1…v4 certos', 'dim'], ['CULPADO', 'a projeção', 'dim']];
          o.res = bug ? [['a tela mostra enviado', 'bad'], ['o Store está certo', 'acc']] : []; } },
      { id: 'apagar', dur: 5, title: 'Apagar o modelo: nada se perde', yk: 'TRUNCATE status_pedidos', act: ['Reprocessar', 'do Store, desde v1'],
        code: ['corrige a projeção (trata PedidoEntregue)', 'TRUNCATE status_pedidos;', 'TRUNCATE meus_pedidos;', 'o Store: intacto, 4 eventos', 'a posição do leitor volta para o início'],
        story: 'Com a projeção corrigida, o conserto não é um <code>UPDATE</code> à mão em cada pedido. Apaga-se o modelo inteiro (<code>TRUNCATE</code>) e volta-se a posição do leitor para o começo do Store. Apagar um modelo de leitura parece drástico, mas nenhum fato se perde: eles estão todos no Store, e o modelo é só uma forma de ler os fatos.',
        look: 'Os dois modelos esvaziam. O trilho do Store continua com os quatro blocos acesos.',
        key: 'Apagar o modelo é seguro porque o Store guarda tudo.',
        f(o) { lit(o, 'store', 'fold'); o.evs = pev(4, 'acc');
          o.rows.fold = act('projeção v3', 'CORRIGIDA', ['trata PedidoEntregue', 'acc'], ['posição: início', 'dim']);
          o.cnt = [['MODELOS', 'vazios', 'dim'], ['STORE', '4 eventos', ''], ['POSIÇÃO', 'v1', 'dim']];
          o.res = [['modelo apagado; Store intacto', 'acc']]; } },
      { id: 'reprocessar', dur: 8, title: 'Reprocessar: 200 milhões de eventos, 2 h 47 min', yk: 'RECONSTRUIR DO ZERO',
        code: ['1047: v1…v4 → entregue · v4', 'a loja inteira: 200 milhões de eventos', '  escrita no modelo a 20.000/s', '  200.000.000 ÷ 20.000 = 10.000 s', '  = 2 h 47 min', 'ler o Store: ~555 mil eventos/s (não é o gargalo)'],
        story: 'A projeção corrigida lê o Store desde o começo. Para o 1047 são 4 eventos e o status volta a <code>entregue</code>, versão 4. Para a loja inteira são os <b>200 milhões</b> de eventos (50 milhões de pedidos × 4). Ler o Store vai rápido (medimos ~555 mil eventos/s na aula 7); o gargalo é <b>escrever</b> no modelo, a 20.000 por segundo como no módulo 18: 10.000 s, <b>2 h 47 min</b>. Durante esse tempo, a tela lê o modelo velho ou um novo que ainda está enchendo.',
        look: 'Os blocos correm do trilho até os modelos; o mostrador conta os eventos até 200 milhões e o relógio até 2 h 47 min.',
        key: 'Com o Store, um modelo estragado se reconstrói: custa horas, não dados.',
        f(o, t) { const [k, fr] = seq(t, 0.3, 0.6), g = lin(t, 0.3, 6.5, 0, 1), done = g >= 1; lit(o, 'store', 'fold', 'rm1', 'rm2');
          o.evs = pev(4, i => i < k ? 'acc' : 'hi'); if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          bm(o, CAB.f1, { on: !done, flow: !done }); bm(o, CAB.f2, { on: !done, flow: !done });
          o.rows.fold = act('projeção v3', 'REPROCESSA', [`${fmt(g * 200)} mi de 200 mi`, 'hi'], ['20.000 eventos/s', 'dim']);
          o.rows.rm1 = STATUS(Math.min(k, 4) - 1, 'acc'); o.rows.rm2 = MEUS(Math.min(k, 4) - 1, 'acc');
          const s = g * 10000, h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
          o.cnt = [['EVENTOS', `${fmt(g * 200)} mi`], ['TEMPO', `${h} h ${String(m).padStart(2, '0')} min`, 'dim'], ['RITMO', '20.000/s', 'dim']];
          o.res = done ? [['200 milhões em 2 h 47 min', 'acc'], ['1047: entregue · v4', 'acc']] : [['reprocessando…', 'dim']]; } },
      { id: 'sem-store', dur: 7, title: 'E se só houvesse o tópico de 7 dias?', yk: 'SEM EVENT STORE',
        code: ['Kafka · pedidos: retenção de 7 dias', '  (módulo 13)', 'o 1047 é de 18/06: já foi apagado', 'modelo apagado + tópico vazio', '  = não há de onde reconstruir'],
        story: 'Agora o mesmo acidente sem Event Store: os eventos só passaram pelo tópico do Kafka, que guarda <b>7 dias</b> (módulo 13). O 1047 é de 18/06; um mês depois, os quatro fatos já foram apagados do tópico. Apagar o modelo com defeito, aqui, é perder o status do pedido para sempre: não há de onde reprocessar. O bus leva os fatos; quem os <b>guarda</b> é o Store.',
        look: 'O Store some. Embaixo à esquerda, o tópico de 7 dias aparece vazio, e os modelos ficam vermelhos.',
        key: 'Sem o Store, um modelo estragado não tem de onde ser refeito.',
        f(o) { o.show.store = 0; o.show.aux = 1; o.evs = []; o.on.aux = 'bad'; o.on.rm1 = o.on.rm2 = 'bad'; o.on.fold = 'bad';
          o.beams = [{ pts: CAB.af, tone: 'bad', on: true }, { pts: CAB.f1 }, { pts: CAB.f2 }];
          o.rows.aux = act('Kafka · pedidos', 'TÓPICO · 7 DIAS', ['18/06: e-501…e-505 apagados', 'bad'], ['retenção: 7 dias', 'dim']);
          o.rows.fold = act('projeção v3', 'SEM FONTE', ['nada para ler', 'bad']);
          o.rows.rm1 = STATUS(-1, 'bad', ['perdido', 'bad']); o.rows.rm2 = MEUS(-1);
          o.cnt = [['FONTE', 'tópico de 7 dias', 'bad'], ['O 1047', 'apagado', 'bad'], ['RECONSTRUIR', 'impossível', 'bad']];
          o.res = [['sem Store, não há replay', 'bad']]; } },
    ],
    rehidratacao: [
      { id: 'cena', dur: 5, title: 'Um stream com 1.000.000 de eventos', yk: 'estoque-CANECA-007', act: ['Rehidratar', '1.000.000 de eventos'],
        code: ['a cada 100 eventos:', '  1 EstoqueAjustado +100', '  99 EstoqueReservado −1', '1.000.000 de eventos · saldo final 10.000', 'tabela + índices: 263 MB (~263 B/evento)'],
        story: 'O <code>estoque-CANECA-007</code> é o stream da caneca azul, o SKU mais quente da loja. Ele tem <b>1.000.000 de eventos</b>: a cada 100, um <code>EstoqueAjustado</code> de +100 e 99 <code>EstoqueReservado</code> de −1. Para decidir um novo <code>Reservar</code>, o agregado precisa saber o saldo, e o saldo não está guardado em lugar nenhum: é preciso <b>rehidratar</b>, dobrar o stream inteiro em ordem. Esse stream foi gravado de verdade num PostgreSQL 14: 263 MB com os índices.',
        look: 'No trilho, o começo (v1 +100, v2 −1), as reticências e o fim (v999.000, v1.000.000). O comando espera à esquerda.',
        key: 'Rehidratar é dobrar os eventos do stream para saber o estado de agora.',
        f(o) { lit(o, 'store', 'cmd');
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMANDO', ['precisa do saldo', 'hi'], ['carregar o agregado', 'dim']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', ['ainda não', 'dim']);
          o.cnt = [['EVENTOS', '1.000.000'], ['TAMANHO', '263 MB', 'dim'], ['SALDO', '?', 'dim']];
          o.res = [['o saldo não está guardado', 'dim']]; } },
      { id: 'dobrar', dur: 6, title: 'Dobrar tudo: ~1.800 ms', yk: 'MEDIDO · PostgreSQL 14 + Python',
        code: ['SELECT tipo, dados FROM eventos', "  WHERE stream_id = 'estoque-CANECA-007'", '  ORDER BY versao;', 'saldo = 0; para cada evento: saldo += Δ', '3 execuções: 1.935 · 1.801 · 1.770 ms', '~555 mil eventos/s · saldo 10.000'],
        story: 'O agregado lê o stream inteiro, na ordem das versões, e soma: +100, −1, −1… Medido (cliente Python lendo com <code>psql COPY</code>): <b>1.935, 1.801 e 1.770 ms</b> em três execuções, uns <b>555 mil eventos por segundo</b>, e o saldo dá <b>10.000</b>. O custo é <b>linear</b> no tamanho do stream: com 10 milhões, seriam uns 18 s. Quase dois segundos antes de cada <code>Reservar</code> é lento demais para um comando.',
        look: 'O contador de eventos corre até 1.000.000 em quase dois segundos, no tempo real da medição; o saldo sobe até 10.000.',
        key: 'Rehidratar custa tempo proporcional ao stream: 1 milhão, ~1,8 s.',
        f(o, t) { const g = lin(t, 0.5, 2.3, 0, 1), n = g * 1e6, done = g >= 1; lit(o, 'store', 'cmd', 'fold'); if (done) lit(o, 'rm1');
          o.evs = cev(i => done || (i === 0 || i === 1) ? 'acc' : i === 3 && n >= 999000 ? 'acc' : 'hi');
          bm(o, CAB.sf, { on: g > 0 && !done, flow: g > 0 && !done }); bm(o, CAB.f1, { on: done });
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMANDO', [done ? 'saldo conhecido' : 'esperando…', done ? 'acc' : 'hi']);
          o.rows.fold = act('rehidratar', 'DOBRA', [`v${fmt(n)}`, 'hi'], [`saldo ${fmt(n ? saldo(Math.round(n)) : 0)}`, 'acc']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', done ? ['saldo 10.000 · v1.000.000', 'acc'] : ['…', 'dim']);
          o.cnt = [['EVENTOS LIDOS', fmt(n)], ['MS', fmt(g * 1800), 'dim'], ['SALDO', fmt(n ? saldo(Math.round(n)) : 0), 'dim']];
          o.res = done ? [['~1.800 ms · saldo 10.000', 'acc'], ['1.935 · 1.801 · 1.770 ms medidos', 'dim']] : []; } },
      { id: 'pedido', dur: 6, title: 'O caso comum: o 1047 tem 4 eventos', yk: 'REHIDRATAR pedido-1047',
        code: ['{}', '+ PedidoCriado  → criado, total 9.490', '+ PedidoPago    → pago', '+ PedidoEnviado → enviado, LA123456789BR', '+ PedidoEntregue → entregue', '= {status: entregue, versao: 4}'],
        story: 'O agregado típico é pequeno. Antes de decidir um comando sobre o 1047, o <code>pedidos</code> rehidrata o <code>pedido-1047</code>: 4 eventos, dobrados em frações de milissegundo. Começa vazio; <code>PedidoCriado</code> dá <code>{status: criado, cliente: lena-77, total: 9490}</code>; <code>PedidoPago</code> troca para <code>pago</code>; <code>PedidoEnviado</code> põe o rastreio; <code>PedidoEntregue</code> fecha em <code>entregue</code>, versão 4. Rehidratar a cada comando só é barato porque o stream é curto.',
        look: 'O trilho troca a caneca pelo 1047, e os quatro blocos passam pelo dobrador, que mostra o estado crescer.',
        key: 'Agregado pequeno, rehidratação barata: 4 eventos, menos de 1 ms.',
        f(o, t) { const [k, fr] = seq(t, 0.4, 0.9); lit(o, 'store', 'fold'); if (k >= 4) lit(o, 'rm1');
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i < k ? 'acc' : 'hi'); if (k < 4) pk(o, WAY.sf(k), fr, PE[k][1]);
          o.rows.cmd = act('pedidos', 'COMANDO', ['decidir sobre o 1047', 'hi']);
          o.rows.fold = act('rehidratar', 'DOBRA', [k ? `status ${ST[k - 1]}` : '{}', 'hi'], [k ? `versão ${k}` : '', 'dim'], [k >= 3 ? 'LA123456789BR' : k ? 'total 9.490' : '', 'dim']);
          o.rows.rm1 = act('agregado Pedido', 'CARREGADO', k >= 4 ? ['entregue · versão 4', 'acc'] : ['…', 'dim']);
          o.cnt = [['EVENTOS LIDOS', `${k} de 4`], ['MS', '< 1', 'dim'], ['STATUS', k ? ST[k - 1] : '{}', 'dim']];
          o.res = k >= 4 ? [['entregue · versão 4', 'acc']] : []; } },
      { id: 'auditoria', dur: 6, title: 'Auditoria: dobrar só até a versão 2', yk: 'O QUE A LENA VIA ÀS 14:15',
        code: ['dobrar até ocorrido_em ≤ 14:15', '  v1 PedidoCriado 14:02:10 → criado', '  v2 PedidoPago   14:02:11 → pago', '  v3 é 14:30: fica de fora', '= pago · versão 2'],
        story: 'Rehidratar também é voltar no tempo. Para responder o que a Lena via às <b>14:15</b>, dobra-se o stream só até os eventos daquela hora: v1 dá <code>criado</code>, v2 dá <code>pago</code>, e o v3 é das 14:30. Resposta: <b><code>pago</code>, versão 2</b>. É a mesma dobra, com um ponto de parada.',
        look: 'Só v1 e v2 acendem; v3 e v4 ficam apagados, depois do corte.',
        key: 'Auditar é rehidratar até um ponto: às 14:15, pago, versão 2.',
        f(o, t) { const ok = t > 1.6; lit(o, 'store', 'fold'); if (ok) lit(o, 'rm1');
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i < 2 ? 'acc' : 'dim'); pk(o, WAY.sf(1), lin(t, 0.4, 1.6, 0, 1), 'até v2');
          o.rows.cmd = act('auditoria', 'PERGUNTA', ['status às 14:15?', 'hi']);
          o.rows.fold = act('rehidratar', 'ATÉ 14:15', ['v1 criado', 'hi'], ['v2 pago', ok ? 'acc' : 'dim'], ['v3: 14:30, fora', 'dim']);
          o.rows.rm1 = act('resposta', '14:15', ok ? ['pago · versão 2', 'acc'] : ['…', 'dim']);
          o.cnt = [['ÀS 14:15', ok ? 'pago' : '…'], ['VERSÃO', ok ? '2' : '…', 'dim'], ['LIDOS', '2 de 4', 'dim']];
          o.res = ok ? [['pago, versão 2', 'acc']] : [];
          if (ok) T(o, [slot(2)[0], 30, 70], 'depois das 14:15', 'dim'); } },
      { id: 'recuperar', dur: 7, title: 'Recuperar um domínio: republicar os eventos', yk: 'O rehydratate DO LAB DO AUTOR',
        code: ['lab: rehydratate/listener.go', '  lê os eventos do agregado', '  ORDER BY version ASC', '  (filtro opcional por data)', '  e republica o saldo', 'quem perdeu dados se reconstrói'],
        story: 'O segundo uso é a <b>recuperação</b>. Se um domínio perdeu dados (o saldo do <code>estoque</code> ficou para trás, um evento nunca saiu do publisher), lê-se o stream de novo e <b>republica-se</b> para ele. É o que o lab do autor faz no <code>rehydratate/listener.go</code> (lido, não executado): lê todos os eventos do agregado em ordem de versão, com um filtro opcional por data, e republica o saldo. Só funciona se quem recebe for idempotente (aula 10).',
        look: 'Os eventos saem do trilho, passam pelo dobrador e acendem o modelo à direita, que volta a ter o saldo.',
        key: 'Rehidratar e republicar recupera um domínio que perdeu dados.',
        f(o, t) { const g = lin(t, 0.4, 3.4, 0, 1), done = g >= 1; lit(o, 'store', 'cmd', 'fold'); o.on.rm1 = done ? 1 : 'bad';
          o.evs = cev('acc'); bm(o, CAB.sf, { on: !done, flow: !done }); bm(o, CAB.f1, { on: !done, flow: !done });
          o.rows.cmd = act('rehydratate', 'LAB DO AUTOR', ['ORDER BY version ASC', 'hi'], ['filtro por data (opcional)', 'dim']);
          o.rows.fold = act('republicar', 'DOBRA', [`${Math.round(g * 100)}%`, 'hi']);
          o.rows.rm1 = act('saldo (ScyllaDB)', 'DOMÍNIO', done ? ['saldo 10.000', 'acc'] : ['desatualizado', 'bad'], ['refeito a partir do Store', 'dim']);
          o.cnt = [['REPUBLICADO', `${Math.round(g * 100)}%`], ['SALDO', done ? '10.000' : '?', 'dim'], ['EXIGE', 'idempotência', 'dim']];
          o.res = done ? [['o domínio se reconstruiu', 'acc']] : []; } },
      { id: 'upcasting', dur: 8, title: 'E se der errado: o evento de formato antigo', yk: 'UPCASTING NA LEITURA',
        code: ['PedidoCriado antigo: {frete: 15.00}', 'código de hoje lê: frete_centavos', '  → ausente: total errado', 'upcaster (na leitura):', '  frete_centavos = frete × 100 = 1.500', '  total 9.490 de novo'],
        story: 'Eventos são para sempre, e o código muda. Suponha que o <code>PedidoCriado</code> do 1047 tenha sido gravado quando o campo era <code>frete</code>, um número em reais (15,00), e hoje o código lê <code>frete_centavos</code> (exemplo). Rehidratar com o código novo dá o frete ausente e um total errado. O evento <b>não se edita</b>; a saída é o <b>upcasting</b> (Axon): converter o evento velho para o formato novo <b>na leitura</b>, antes de dobrar. E há o outro erro da aula: republicar tudo para um domínio que não é idempotente duplica o efeito (aula 10).',
        look: 'O v1 fica vermelho e o dobrador também. Depois o upcaster converte o evento e o total volta a 9.490.',
        key: 'Evento velho não se edita: converte-se na leitura (upcasting).',
        f(o, t) { const fix = t > 3.2; lit(o, 'store', 'cmd'); o.on.fold = fix ? 1 : 'bad'; if (fix) lit(o, 'rm1'); else o.on.rm1 = 'bad';
          o.rows.store = STORE('pedido-1047'); o.evs = pev(4, i => i === 0 ? (fix ? 'acc' : 'bad') : 'hi');
          pk(o, WAY.sf(0), lin(t, 0.4, 1.6, 0, 1), 'frete: 15.00', 'bad');
          o.rows.cmd = act('upcaster', fix ? 'LIGADO' : 'DESLIGADO', ['frete → frete_centavos', fix ? 'acc' : 'dim'], ['× 100, na leitura', 'dim']);
          o.rows.fold = act('rehidratar', 'CÓDIGO NOVO', [fix ? 'frete_centavos 1.500' : 'frete_centavos: ?', fix ? 'acc' : 'bad'], [fix ? 'total 9.490' : 'total errado', fix ? 'acc' : 'bad']);
          o.rows.rm1 = act('agregado Pedido', 'CARREGADO', [fix ? 'entregue · total 9.490' : 'total errado', fix ? 'acc' : 'bad']);
          if (fix) bm(o, CAB.cf, { on: true, flow: true });
          o.cnt = [['O EVENTO', 'frete: 15.00', fix ? 'dim' : 'bad'], ['O CÓDIGO LÊ', 'frete_centavos', 'dim'], ['TOTAL', fix ? '9.490' : 'errado', fix ? '' : 'bad']];
          o.res = fix ? [['upcasting: converte na leitura', 'acc'], ['o evento continua igual', 'dim']] : [['o código novo lê errado', 'bad']]; } },
    ],
    snapshot: [
      { id: 'cena', dur: 5, title: 'Sem snapshot: 1.000.000 de eventos a cada vez', yk: 'POLÍTICA: NENHUM', act: ['Tirar a foto', 'na v999.000'],
        code: ['rehidratar estoque-CANECA-007', '  lê v1 … v1.000.000', '  ~1.800 ms (medido)', 'snapshots: vazia', 'lab do autor: tem a tabela e não a lê'],
        story: 'Na aula 7, rehidratar a caneca custou ~1.800 ms porque o agregado relê o milhão de eventos a cada vez. Embaixo à esquerda está a tabela <code>snapshots(stream_id, versao, estado)</code>, ainda vazia. É assim no lab do autor: a tabela existe, mas nenhum código Go a usa, e a rehidratação sempre lê tudo.',
        look: 'O trilho inteiro está aceso: tudo será lido. A tabela de snapshots, embaixo, está vazia.',
        key: 'Sem foto, cada rehidratação relê o stream inteiro.',
        f(o) { lit(o, 'store', 'cmd'); o.evs = cev('acc');
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMANDO', ['carregar o agregado', 'hi']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', ['saldo 10.000', 'hi'], ['em ~1.800 ms', 'dim']);
          o.cnt = [['EVENTOS LIDOS', '1.000.000'], ['MS', '~1.800', 'dim'], ['FOTOS', '0', 'dim']];
          o.res = [['lê tudo, toda vez', 'dim']]; } },
      { id: 'foto', dur: 6, title: 'A foto: o estado na v999.000', yk: 'INSERT INTO snapshots', act: ['Rehidratar com a foto', 'foto + 1.000'],
        code: ['a cada 1.000 eventos, em segundo plano:', "INSERT INTO snapshots VALUES", "  ('estoque-CANECA-007', 999000,", "   '{\"saldo\": 9990}')", 'fora do caminho do comando'],
        story: 'Um <b>snapshot</b> é uma foto do estado numa versão. Com a política "a cada 1.000 eventos", um processo em <b>segundo plano</b> (nunca no caminho do comando) dobra até a v999.000 e grava a foto: saldo <b>9.990</b> naquela versão. A foto fica presa ao trilho, sobre o bloco de onde foi tirada.',
        look: 'Uma foto sobe e fica presa por um pino sobre o bloco v999.000; a tabela de snapshots ganha uma linha.',
        key: 'O snapshot guarda o estado numa versão para não refazer a conta.',
        f(o, t) { const ok = t > 1.4; lit(o, 'store'); if (ok) lit(o, 'aux'); o.evs = cev(i => i <= 3 ? 'acc' : 'hi');
          if (ok) photo(o, 3, ['FOTO', 'v999.000', 'saldo 9.990']); pk(o, WAY.af.slice().reverse(), lin(t, 0.3, 1.4, 0, 1), '');
          o.rows.cmd = act('snapshotter', 'SEGUNDO PLANO', ['a cada 1.000 eventos', 'hi']);
          o.rows.aux = act('snapshots', 'TABELA', ok ? ['CANECA-007 · 999.000 · 9.990', 'acc'] : ['nenhuma foto', 'dim']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', ['ainda não', 'dim']);
          o.cnt = [['FOTO NA', ok ? 'v999.000' : '…'], ['SALDO NA FOTO', ok ? '9.990' : '…', 'dim'], ['POLÍTICA', 'a cada 1.000', 'dim']];
          o.res = ok ? [['foto gravada: v999.000', 'acc']] : []; } },
      { id: 'com-foto', dur: 6, title: 'Foto + 1.000 eventos: ~13 ms', yk: 'MEDIDO · PostgreSQL 14',
        code: ['1. SELECT estado FROM snapshots → 9.990', '2. eventos WHERE versao > 999000', '   → 1.000 eventos', '3 execuções: 13,1 · 19,6 · 12,1 ms', '  (inclui subir o psql duas vezes)', '1.800 ÷ ~13 ≈ 140× · saldo 10.000'],
        story: 'Agora a rehidratação lê a foto (saldo 9.990 na v999.000) e só os eventos <b>depois</b> dela: 1.000. Medido: <b>13,1, 19,6 e 12,1 ms</b>, contando o custo de abrir o <code>psql</code> duas vezes. São <b>1.000× menos eventos</b> e uns <b>140× menos tempo</b> (1.800 ÷ ~13). O saldo dos dois caminhos é o mesmo: <b>10.000</b>.',
        look: 'O dobrador lê primeiro a foto, depois só o fim do trilho; o contador de eventos para em 1.000.',
        key: 'Com snapshot, rehidratar é foto + cauda: 1.800 ms viram ~13 ms.',
        f(o, t) { const f1 = lin(t, 0.4, 1.2, 0, 1), g = lin(t, 1.2, 1.6, 0, 1), done = g >= 1; lit(o, 'store', 'aux', 'cmd', 'fold'); if (done) lit(o, 'rm1');
          o.evs = cev(i => i === 4 ? 'acc' : 'dim'); photo(o, 3, ['FOTO', 'v999.000', 'saldo 9.990']);
          pk(o, WAY.af, f1, 'foto'); bm(o, CAB.sf, { on: f1 >= 1 && !done, flow: f1 >= 1 && !done });
          o.rows.aux = act('snapshots', 'TABELA', ['CANECA-007 · 999.000 · 9.990', 'acc']);
          o.rows.cmd = act('Reservar(CANECA-007)', 'COMANDO', [done ? 'saldo conhecido' : 'esperando…', done ? 'acc' : 'hi']);
          o.rows.fold = act('rehidratar', 'FOTO + CAUDA', ['foto: 9.990', f1 >= 1 ? 'acc' : 'dim'], [`+ ${fmt(g * 1000)} eventos`, 'hi'], [`saldo ${fmt(f1 >= 1 ? 9990 + g * 10 : 0)}`, 'acc']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', done ? ['saldo 10.000', 'acc'] : ['…', 'dim'], done ? ['em ~13 ms', 'acc'] : null);
          o.cnt = [['EVENTOS LIDOS', fmt(g * 1000)], ['MS', done ? '~13' : '…', 'dim'], ['ANTES', '1.000.000 · 1.800 ms', 'dim']];
          o.res = done ? [['~13 ms · 140× mais rápido', 'acc'], ['saldo 10.000 nos dois', 'acc']] : []; } },
      { id: 'politica', dur: 6, title: 'Compare as políticas', yk: 'NENHUM · A CADA 10.000 · A CADA 1.000',
        opts: POL.map(p => [p.name, `${fmt(p.n)} eventos`]),
        code: ['nenhum: 1.000.000 eventos · ~1.800 ms (medido)', 'a cada 10.000: ≤ 10.000 eventos', '  ~29 ms (estimativa: 18 ms de leitura', '  + o custo fixo da medição)', 'a cada 1.000: ≤ 1.000 eventos · ~13 ms (medido)'],
        story: 'Escolha a política nos botões acima e veja o contador. <b>Nenhum</b>: relê o milhão, ~1.800 ms. <b>A cada 10.000</b> (o exemplo do artigo): no máximo 10.000 eventos depois da foto, 100× menos; não medimos, e a conta dá uns 29 ms (18 ms de leitura a 555 mil/s mais o custo fixo que apareceu na medição). <b>A cada 1.000</b>: no máximo 1.000 eventos, ~13 ms medidos. Fotos mais frequentes encurtam a cauda e custam mais gravações em segundo plano.',
        look: 'A foto muda de lugar no trilho conforme a política; os contadores de eventos e de ms mudam com ela.',
        key: 'Quanto mais perto do fim a foto, menor a cauda a dobrar.',
        f(o) { const p = POL[pol]; lit(o, 'store', 'fold', 'rm1'); if (pol) lit(o, 'aux');
          o.evs = cev(i => pol === 0 ? 'acc' : i === 4 ? 'acc' : 'dim');
          if (pol === 1) photo(o, 3, ['FOTO', 'v990.000', 'saldo 9.900']); if (pol === 2) photo(o, 3, ['FOTO', 'v999.000', 'saldo 9.990']);
          o.rows.aux = act('snapshots', 'TABELA', pol ? [pol === 1 ? 'última: v990.000' : 'última: v999.000', 'acc'] : ['nenhuma foto', 'dim']);
          o.rows.cmd = act('política', 'SNAPSHOT', [p.name, 'hi']);
          o.rows.fold = act('rehidratar', p.how.toUpperCase(), [`${fmt(p.n)} eventos`, 'hi'], [p.ms, 'acc']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', ['saldo 10.000', 'acc'], [`em ${p.ms}`, 'dim']);
          bm(o, CAB.sf, { on: true, flow: true }); if (pol) bm(o, CAB.af, { on: true });
          o.cnt = [['EVENTOS LIDOS', fmt(p.n)], ['MS', `${p.ms} (${p.how})`, 'dim'], ['POLÍTICA', p.name, 'dim']];
          o.res = [[`${p.name}: ${p.ms}`, 'acc'], [p.tail, 'dim']]; } },
      { id: 'descartavel', dur: 6, title: 'Derivado e descartável', yk: 'DELETE FROM snapshots',
        code: ['DELETE FROM snapshots;', '  → a próxima rehidratação lê tudo', '  → ~1.800 ms, saldo 10.000', 'nenhum fato se perde', 'a fonte da verdade continua sendo o Store'],
        story: 'A foto é <b>derivada</b>: dá para apagar todas e o sistema continua certo, só mais lento (volta a ~1.800 ms até o snapshotter tirar fotos novas). O Store continua sendo a única fonte da verdade. Isso dá liberdade: mudar a política, trocar o formato, refazer as fotos, tudo sem medo de perder dados.',
        look: 'A foto some do trilho e a tabela esvazia; o dobrador volta a ler o trilho inteiro.',
        key: 'Apagar os snapshots só deixa a leitura mais lenta.',
        f(o, t) { const gone = t > 1.2; lit(o, 'store', 'fold', 'rm1'); o.evs = cev(gone ? 'acc' : i => i === 4 ? 'acc' : 'dim');
          if (!gone) photo(o, 3, ['FOTO', 'v999.000', 'saldo 9.990'], 'bad');
          o.on.aux = gone ? 0 : 'bad'; o.rows.aux = act('snapshots', 'TABELA', [gone ? 'vazia' : 'DELETE…', gone ? 'dim' : 'bad']);
          o.rows.cmd = act('operador', 'DELETE', ['DELETE FROM snapshots', 'hi']);
          o.rows.fold = act('rehidratar', 'SEM FOTO', [gone ? '1.000.000 eventos' : '…', 'hi'], [gone ? '~1.800 ms' : '', 'dim']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', ['saldo 10.000', 'acc'], ['certo, mais lento', 'dim']);
          bm(o, CAB.sf, { on: gone, flow: gone });
          o.cnt = [['FOTOS', gone ? '0' : '1'], ['MS', gone ? '~1.800' : '~13', 'dim'], ['SALDO', '10.000', 'dim']];
          o.res = gone ? [['mais lento, ainda certo', 'acc']] : []; } },
      { id: 'codigo-antigo', dur: 7, title: 'E se der errado: a foto do código antigo', yk: 'FORMATO DO ESTADO MUDOU',
        code: ["foto: {saldo: 9990} (código v1)", "código v2 espera {disponivel, reservado}", '  → a foto não é lida', 'descarta a foto · rehidrata do zero', '  ~1.800 ms · gera a foto nova', 'guarde a versão do código na foto'],
        story: 'O formato do estado muda: o código novo guarda <code>{disponivel, reservado}</code> e a foto antiga tem só <code>{saldo}</code> (exemplo). A foto não serve mais. Como ela é descartável, a saída é simples: <b>descartar</b>, rehidratar do zero (~1.800 ms uma vez) e gravar a foto no formato novo. Por isso vale guardar na foto a <b>versão do código</b> que a gerou: o leitor sabe na hora se pode usá-la.',
        look: 'A foto fica vermelha e cai; o dobrador relê o trilho todo e uma foto nova é presa no lugar.',
        key: 'Foto de formato velho: descarta-se e refaz-se a partir dos eventos.',
        f(o, t) { const redo = t > 2.2, fresh = t > 4; lit(o, 'store'); o.on.fold = redo ? 1 : 'bad'; o.on.aux = fresh ? 1 : 'bad'; if (fresh) lit(o, 'rm1');
          o.evs = cev(redo ? 'acc' : i => i === 4 ? 'hi' : 'dim');
          if (!redo) photo(o, 3, ['FOTO v1', 'v999.000', '{saldo}'], 'bad'); else if (fresh) photo(o, 3, ['FOTO v2', 'v999.000', 'disponível']);
          bm(o, CAB.sf, { on: redo && !fresh, flow: redo && !fresh });
          o.rows.aux = act('snapshots', 'TABELA', [fresh ? '999.000 · código v2' : '999.000 · código v1', fresh ? 'acc' : 'bad']);
          o.rows.cmd = act('código v2', 'DEPLOY', ['{disponivel, reservado}', 'hi']);
          o.rows.fold = act('rehidratar', redo ? 'DO ZERO' : 'FOTO?', [redo ? '1.000.000 eventos' : 'formato v1: não lê', redo ? 'hi' : 'bad'], [redo ? '~1.800 ms, uma vez' : '', 'dim']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', fresh ? ['disponível 10.000', 'acc'] : ['…', 'dim']);
          o.cnt = [['A FOTO', fresh ? 'nova (v2)' : redo ? 'descartada' : 'formato v1', fresh ? '' : 'bad'], ['MS', redo ? '~1.800 uma vez' : '…', 'dim'], ['DEPOIS', '~13 ms', 'dim']];
          o.res = fresh ? [['descartou, refez, foto nova', 'acc']] : [['a foto velha não serve', 'bad']]; } },
      { id: 'corrompida', dur: 8, title: 'E se der errado: a foto corrompida', yk: 'CONFERIR POR AMOSTRAGEM',
        code: ['foto gerada com bug: v999.000 · saldo 9.890', '  foto + 1.000 eventos = 9.900 (errado)', 'e assim para sempre, enquanto a foto existir', 'amostra: rehidratar tudo → 10.000', '  diferença → apaga a foto e refaz'],
        story: 'Pior que a foto ilegível é a foto <b>errada</b>. Se o snapshotter tiver um bug e gravar saldo 9.890 na v999.000 (exemplo), toda rehidratação dá 9.900 em vez de 10.000, e o erro <b>se propaga para sempre</b>, porque ninguém relê o começo do stream. A defesa: guardar a versão do código que gerou a foto e <b>conferir por amostragem</b>, de tempos em tempos, a foto + cauda contra a rehidratação completa. Diferença achada, a foto é apagada e refeita.',
        look: 'A foto vermelha dá 9.900; a conferência completa acende o trilho inteiro e chega a 10.000. A foto é refeita.',
        key: 'Snapshot errado repete o erro sempre: confira contra a rehidratação completa.',
        f(o, t) { const chk = t > 2.4, fixd = t > 4.6; lit(o, 'store', 'aux'); o.on.rm1 = fixd ? 1 : 'bad'; o.on.fold = chk && !fixd ? 1 : fixd ? 1 : 'bad';
          o.evs = cev(chk ? 'acc' : i => i === 4 ? 'hi' : 'dim');
          photo(o, 3, ['FOTO', 'v999.000', fixd ? 'saldo 9.990' : 'saldo 9.890'], fixd ? 'acc' : 'bad');
          bm(o, CAB.sf, { on: chk && !fixd, flow: chk && !fixd }); o.on.aux = fixd ? 1 : 'bad';
          o.rows.aux = act('snapshots', 'TABELA', [fixd ? '999.000 · 9.990 (refeita)' : '999.000 · 9.890', fixd ? 'acc' : 'bad']);
          o.rows.cmd = act('conferência', 'AMOSTRA', [chk ? 'rehidratar tudo' : 'agendada', 'hi'], [chk ? 'completo: 10.000' : '', 'acc']);
          o.rows.fold = act('rehidratar', 'FOTO + CAUDA', [fixd ? 'saldo 10.000' : 'saldo 9.900', fixd ? 'acc' : 'bad']);
          o.rows.rm1 = act('agregado Estoque', 'CARREGADO', [fixd ? 'saldo 10.000' : 'saldo 9.900 (errado)', fixd ? 'acc' : 'bad']);
          o.cnt = [['FOTO + CAUDA', fixd ? '10.000' : '9.900', fixd ? '' : 'bad'], ['COMPLETO', chk ? '10.000' : '…', 'dim'], ['FOTO', fixd ? 'refeita' : 'errada', fixd ? 'dim' : 'bad']];
          o.res = fixd ? [['refeita: 10.000 de novo', 'acc']] : chk ? [['diferença: 9.900 ≠ 10.000', 'bad']] : [['o erro se repete a cada leitura', 'bad']]; } },
    ],
    versao: [
      { id: 'cena', dur: 5, title: 'Em ordem no Store, fora de ordem na chegada', yk: 'A CHEGADA AO MODELO DE STATUS', act: ['Entregar os 5', 'último vence'],
        code: ['no Store: v1 e-501 · v2 e-502 · v3 e-504 · v4 e-505', 'na chegada ao consumidor:', '  e-501 (v1) · e-504 (v3) · e-505 (v4)', '  e-502 (v2) · e-502 (v2, de novo)', 'partições, retentativas, consumidores em paralelo'],
        story: 'O Store garante a ordem <b>dentro do stream</b>: v1, v2, v3, v4. Quem consome não recebe necessariamente nessa ordem: uma retentativa atrasa o <code>e-502</code>, outro consumidor em paralelo entrega o <code>e-504</code> antes, e o <code>e-502</code> ainda chega duas vezes. A fila à esquerda mostra a chegada ao modelo de status do 1047: <code>e-501</code>, <code>e-504</code>, <code>e-505</code>, <code>e-502</code>, <code>e-502</code>. À direita, duas regras vão processar a mesma chegada.',
        look: 'No Store, os quatro em ordem. Na fila da chegada, a ordem embaralhada. À direita, os dois modelos ainda vazios.',
        key: 'O Store ordena o stream; a chegada ao consumidor não respeita essa ordem.',
        f(o) { lit(o, 'store', 'cmd');
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: ARR(ORD0).map(l => [l, 'none']), tapeLabel: 'FILA' };
          o.rows.rm1 = act('último vence', 'MODELO A', ['vazio', 'dim']); o.rows.rm2 = act('versão maior', 'MODELO B', ['vazio', 'dim']);
          o.rows.fold = act('consumidor', 'REGRAS', ['A: grava o que chegou', 'hi'], ['B: só se versão >', 'hi']);
          o.cnt = [['CHEGADAS', '0 de 5'], ['A', 'vazio', 'dim'], ['B', 'vazio', 'dim']];
          o.res = [['mesma chegada, duas regras', 'dim']]; } },
      { id: 'ultimo', dur: 7, title: 'Último a chegar vence: termina em pago', yk: 'UPDATE … SET status = $s', act: ['Só versão maior', 'a mesma chegada'],
        code: ['e-501 v1 → criado', 'e-504 v3 → enviado', 'e-505 v4 → entregue', 'e-502 v2 → pago   (volta no tempo)', 'e-502 v2 → pago', '= pago · versão 2 (errado)'],
        story: 'A regra ingênua grava o que chegou por último. O modelo passa por <code>criado</code>, <code>enviado</code> e <code>entregue</code>, e aí o <code>e-502</code> atrasado chega e o leva de volta a <code>pago</code>. A duplicata repete o estrago. Final: <b><code>pago</code>, versão 2</b>, e o pedido já foi entregue. Se o <code>e-505</code> tivesse chegado por último, a regra acertaria, por sorte.',
        look: 'Cada bloco da fila acende e vai ao modelo A, à direita em cima, que termina vermelho em pago.',
        key: 'Último a chegar vence: o atrasado apaga o mais novo.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 0.9, 5), a = arrive(ORD0, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold');
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: ARR(ORD0).map((l, i) => [l, i < j ? 'ok' : i === j ? 'recv' : 'none']), tapeLabel: 'FILA' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), PE[ORD0[j]][1]); pk(o, WAY.f1, fr * 2 - 1, ''); }
          o.on.rm1 = done ? 'bad' : j ? 1 : 0;
          o.rows.rm1 = act('último vence', 'MODELO A', a.lw < 0 ? ['vazio', 'dim'] : [`${ST[a.lw]} · versão ${a.lw + 1}`, done ? 'bad' : 'acc'], done ? ['deveria: entregue · v4', 'bad'] : null);
          o.rows.rm2 = act('versão maior', 'MODELO B', ['espera', 'dim']);
          o.rows.fold = act('regra A', 'ÚLTIMO VENCE', [j ? `chegou ${PE[ORD0[j - 1]][1]}` : '…', 'hi'], ['grava sempre', 'dim']);
          o.cnt = [['CHEGADAS', `${j} de 5`], ['A', a.lw < 0 ? 'vazio' : `${ST[a.lw]} v${a.lw + 1}`, done ? 'bad' : 'dim'], ['CERTO', 'entregue v4', 'dim']];
          o.res = done ? [['pago · versão 2: errado', 'bad']] : []; } },
      { id: 'maior', dur: 7, title: 'Só aplica se a versão for maior: entregue', yk: 'UPDATE … WHERE versao < $v', act: ['Embaralhar', 'outra ordem'],
        code: ['UPDATE status_pedidos SET status = $s,', '  versao = $v', '  WHERE pedido_id = 1047 AND versao < $v;', 'e-501 v1 aplica · e-504 v3 aplica', 'e-505 v4 aplica · e-502 v2 descarta (×2)', '= entregue · versão 4'],
        story: 'A segunda regra guarda a versão junto do status e só aplica o evento se a versão dele for <b>maior</b> que a guardada: <code>UPDATE … WHERE pedido_id = 1047 AND versao &lt; $v</code>. O <code>e-501</code> aplica, o <code>e-504</code> (v3) aplica, o <code>e-505</code> (v4) aplica, e os dois <code>e-502</code> (v2 &lt; 4) são <b>descartados</b>. Final: <b><code>entregue</code>, versão 4</b>. O lab do autor faz o mesmo no ScyllaDB com <code>UPDATE … IF version &lt; ?</code>.',
        look: 'A mesma fila vai ao modelo B; os dois e-502 ficam vermelhos (descartados) e o modelo termina em entregue.',
        key: 'Só versão maior: o atrasado é descartado e o estado fica certo.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 0.9, 5), a = arrive(ORD0, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold'); if (j) lit(o, 'rm2');
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: ARR(ORD0).map((l, i) => [l, i < j ? (a.log[i] ? 'ok' : 'bad') : i === j ? 'recv' : 'none']), tapeLabel: 'FILA' };
          if (!done) { const okv = ORD0[j] > a.vm; pk(o, WAY.cf, Math.min(1, fr * 2), PE[ORD0[j]][1], okv ? '' : 'bad'); if (okv) pk(o, WAY.f2, fr * 2 - 1, ''); }
          o.on.rm1 = 'bad'; o.rows.rm1 = act('último vence', 'MODELO A', ['pago · versão 2', 'bad']);
          o.rows.rm2 = act('versão maior', 'MODELO B', a.vm < 0 ? ['vazio', 'dim'] : [`${ST[a.vm]} · versão ${a.vm + 1}`, 'acc'], ['descartados: ' + a.log.filter(x => !x).length, 'dim']);
          o.rows.fold = act('regra B', 'VERSÃO MAIOR', [j ? `${PE[ORD0[j - 1]][1]}: ${a.log[j - 1] ? 'aplica' : 'descarta'}` : '…', j && !a.log[j - 1] ? 'bad' : 'hi'], ['WHERE versao < $v', 'dim']);
          o.cnt = [['CHEGADAS', `${j} de 5`], ['B', a.vm < 0 ? 'vazio' : `${ST[a.vm]} v${a.vm + 1}`, 'dim'], ['DESCARTES', String(a.log.filter(x => !x).length), 'dim']];
          o.res = done ? [['entregue · versão 4', 'acc'], ['pago · v2 com o último vence', 'bad']] : []; } },
      { id: 'embaralhar', dur: 7, title: 'Embaralhe: a versão maior sempre acerta', yk: 'OUTRA ORDEM DE CHEGADA', act: ['Embaralhar de novo', 'outra ordem', 'shuf'],
        code: ['qualquer ordem dos 5:', '  versão maior → entregue · v4', '  último vence → o status do último a chegar', 'versão: atribuída pelo Store, sem relógio', 'timestamp: depende do relógio', '  (o desvio de 120 ms do módulo 17)'],
        story: 'Embaralhe a chegada quantas vezes quiser. A regra da versão termina <b>sempre</b> em <code>entregue</code>, versão 4. O "último vence" termina no status de quem chegou por último, e só acerta quando é o <code>e-505</code>. O artigo oferece comparar "por timestamp ou version"; o timestamp depende de relógio, e o desvio de 120 ms do módulo 17 basta para trocar dois eventos. A <b>versão</b> é atribuída pelo Store e cresce de 1 em 1 dentro do stream, sem relógio nenhum.',
        look: 'A fila muda de ordem a cada clique em Embaralhar; o modelo B termina sempre em entregue, o A muda.',
        key: 'Com a versão, a ordem de chegada deixa de importar.',
        f(o, t) { const [j, fr] = seq(t, 0.3, 0.6, 5), a = arrive(ord, j), done = j >= 5; lit(o, 'store', 'cmd', 'fold'); if (j) lit(o, 'rm2');
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: ARR(ord).map((l, i) => [l, i < j ? (a.log[i] ? 'ok' : 'bad') : i === j ? 'recv' : 'none']), tapeLabel: 'FILA' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), PE[ord[j]][1]); pk(o, WAY.f1, fr * 2 - 1, ''); pk(o, WAY.f2, fr * 2 - 1, ''); }
          const lwOk = a.lw === 3; o.on.rm1 = done ? (lwOk ? 1 : 'bad') : j ? 1 : 0;
          o.rows.rm1 = act('último vence', 'MODELO A', a.lw < 0 ? ['vazio', 'dim'] : [`${ST[a.lw]} · versão ${a.lw + 1}`, done && !lwOk ? 'bad' : 'acc'], done ? [lwOk ? 'certo, por sorte' : 'errado', lwOk ? 'dim' : 'bad'] : null);
          o.rows.rm2 = act('versão maior', 'MODELO B', a.vm < 0 ? ['vazio', 'dim'] : [`${ST[a.vm]} · versão ${a.vm + 1}`, 'acc'], ['descartados: ' + a.log.filter(x => !x).length, 'dim']);
          o.rows.fold = act('as duas regras', 'MESMA FILA', [ARR(ord).join(' '), 'hi']);
          o.cnt = [['A (ÚLTIMO)', a.lw < 0 ? '…' : `${ST[a.lw]} v${a.lw + 1}`, done && !lwOk ? 'bad' : 'dim'], ['B (VERSÃO)', a.vm < 0 ? '…' : `${ST[a.vm]} v${a.vm + 1}`], ['CHEGADAS', `${j} de 5`, 'dim']];
          o.res = done ? [['B: entregue · v4', 'acc'], [lwOk ? 'A: certo por sorte' : `A: ${ST[a.lw]} (errado)`, lwOk ? 'dim' : 'bad']] : []; } },
      { id: 'soma', dur: 7, title: 'O limite: num modelo que soma, descartar perde', yk: 'ÚLTIMO ESTADO × SOMA', act: ['Simular o buraco', 'a v2 não chega'],
        code: ['saldo do estoque (exemplo):', '  v1 +3 · v3 −1 (outro pedido) · v2 −1 atrasado', '  "versão maior": v2 < 3 → descarta', '  saldo 2 (o certo é 1)', 'aqui: idempotência por evento_id (aula 10)', '  e operações comutativas (CRDT, módulo 17)'],
        story: 'A regra "descartar versão menor" serve a modelos de <b>último estado</b>, como o status: só o mais novo importa. Num modelo que <b>soma</b>, como um saldo, cada evento conta. Exemplo: o estoque recebe v1 (+3), v3 (−1, outro pedido) e depois a v2 atrasada (−1). Descartá-la por "versão menor" <b>perde</b> uma reserva: saldo 2 em vez de 1. Ali a defesa é outra: aplicar cada <code>evento_id</code> uma vez só (aula 10), com operações que dão o mesmo resultado em qualquer ordem (a ideia dos CRDTs do módulo 17).',
        look: 'O modelo B vira um saldo; a v2 atrasada fica vermelha, descartada, e o saldo fica em 2.',
        key: 'Versão maior serve ao último estado; a soma precisa de evento_id.',
        f(o, t) { const late = t > 2; lit(o, 'store', 'cmd'); o.on.fold = late ? 'bad' : 1; o.on.rm2 = late ? 'bad' : 1;
          o.rows.store = STORE('estoque (exemplo)'); o.evs = [ev(0, ['v1', 'saldo', '+3']), ev(1, ['v2', 'reserva', '−1'], late ? 'bad' : 'hi'), ev(2, ['v3', 'reserva', '−1'])];
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: [['v1 +3', 'ok'], ['v3 −1', 'ok'], ['v2 −1', late ? 'bad' : 'recv']], tapeLabel: 'FILA' };
          pk(o, WAY.cf, lin(t, 0.6, 2, 0, 1), 'v2 −1');
          o.rows.fold = act('regra B', 'NUMA SOMA', ['v2 < 3: descarta', late ? 'bad' : 'dim']);
          o.rows.rm1 = act('status do 1047', 'ÚLTIMO ESTADO', ['entregue · v4: ok', 'acc']);
          o.rows.rm2 = act('saldo', 'SOMA', [late ? 'saldo 2' : 'saldo 2 …', late ? 'bad' : 'hi'], ['o certo: 1', 'dim']);
          o.cnt = [['SALDO', late ? '2' : '…', late ? 'bad' : ''], ['CERTO', '1', 'dim'], ['PERDEU', late ? 'uma reserva' : '…', 'dim']];
          o.res = late ? [['descartar numa soma perde', 'bad'], ['use evento_id (aula 10)', 'acc']] : []; } },
      { id: 'buraco', dur: 8, title: 'E se der errado: a v2 que nunca chega', yk: 'versao ≠ última + 1',
        code: ['chegou v1, depois v3', '  3 ≠ 1 + 1: falta a v2', 'aplicar v3 e seguir: um buraco', 'detectar: esperar a v2 ou pedir ao Store', "  SELECT … WHERE stream_id = 'pedido-1047'", '  AND versao = 2  → e-502'],
        story: 'Agora a v2 se perde: o consumidor recebe a v1 e depois a v3. A regra da versão maior aplicaria a v3 e seguiria em frente, e o modelo teria um <b>buraco</b>: nunca soube do pagamento. O consumidor atento confere <code>versao = última + 1</code>; se não bate, ele <b>espera</b> um pouco pela v2 ou <b>pede ao Store</b> o que falta (ou reconstrói o modelo do stream). Só então aplica a v3. É por isso que o Store precisa responder "me dê a versão 2 deste stream".',
        look: 'A v3 fica tracejada, esperando. Um cabo sai do consumidor até o Store, busca o e-502 e só então as duas são aplicadas.',
        key: 'Versão que pula é buraco: o consumidor espera ou busca a que falta.',
        f(o, t) { const ask = t > 2, got = t > 3.6, done = t > 4.6; lit(o, 'store', 'cmd'); o.on.fold = got ? 1 : 'bad'; if (done) lit(o, 'rm2');
          o.evs = pev(4, i => i === 1 && ask ? 'acc' : 'hi');
          o.rows.cmd = { ...act('consumidor', 'CHEGADA'), tape: [['e-501', 'ok'], ['e-504', got ? 'ok' : 'recv'], ['e-505', 'none'], ['e-502', ask ? (got ? 'ok' : 'recv') : 'none']], tapeLabel: 'FILA' };
          if (ask) { bm(o, CAB.cs, { on: !got, tone: '' }); pk(o, WAY.cs(1), lin(t, 2, 3.6, 0, 1), 'versão 2?'); }
          o.rows.fold = act('consumidor', 'CONFERE', ['última: v1 · chegou v3', ask ? 'hi' : 'bad'], [got ? 'v2 buscada: aplica v2, v3' : '3 ≠ 1 + 1: espera', got ? 'acc' : 'bad']);
          o.rows.rm1 = act('sem conferir', 'MODELO A', ['enviado · v3', 'bad'], ['nunca soube do pago', 'bad']); o.on.rm1 = 'bad';
          o.rows.rm2 = act('conferindo', 'MODELO B', done ? ['enviado · versão 3', 'acc'] : ['criado · v1 (esperando)', 'dim'], done ? ['sem buraco', 'dim'] : null);
          o.cnt = [['ÚLTIMA', got ? 'v3' : 'v1'], ['CHEGOU', 'v3', 'dim'], ['FALTA', got ? 'nada' : 'v2', got ? 'dim' : 'bad']];
          o.res = done ? [['buscou a v2 e aplicou em ordem', 'acc']] : ask ? [['pedindo a v2 ao Store', 'dim']] : [['buraco: falta a v2', 'bad']]; } },
    ],
    idempotencia: [
      { id: 'cena', dur: 5, title: 'O e-502 pode chegar mais de uma vez', yk: 'PELO MENOS UMA VEZ', act: ['Entregar o e-502', 'sem proteção'],
        code: ['o consumidor do estoque escuta PedidoPago', '  e reserva 1 gato: saldo − 1', 'saldo do GATO-042: 3', 'a entrega é "pelo menos uma vez":', '  o relay reenvia, o consumidor cai,', '  a rehidratação republica'],
        story: 'O consumidor do estoque escuta o <code>PedidoPago</code> e reserva o gato: saldo menos 1. O saldo do <code>GATO-042</code> está em <b>3</b>. O bus entrega <b>pelo menos uma vez</b> (aula 5): o relay da outbox reenvia quando não sabe se a mensagem chegou, o consumidor pode cair depois de aplicar e antes de confirmar, e a rehidratação (aula 7) republica de propósito. O <code>e-502</code> do módulo 6 vai chegar duas vezes.',
        look: 'O Store tem o 1047 até o v2, o e-502. À direita, o saldo do estoque em 3 e a tabela de processados desligada.',
        key: 'Se a entrega é pelo menos uma vez, o consumidor vai ver duplicatas.',
        f(o) { lit(o, 'store', 'rm2'); o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'ENTREGA'), tape: [['e-502', 'none'], ['e-502', 'none']], tapeLabel: 'FILA' };
          o.rows.fold = act('consumidor', 'ESTOQUE', ['PedidoPago → saldo − 1', 'hi']);
          o.rows.rm2 = STK(3);
          o.cnt = [['SALDO', '3'], ['ENTREGAS', '0 de 2', 'dim'], ['PROTEÇÃO', 'nenhuma', 'dim']];
          o.res = [['o e-502 vai chegar duas vezes', 'dim']]; } },
      { id: 'sem', dur: 7, title: 'Sem proteção: 3 → 2 → 1', yk: 'O ESTOQUE DO MÓDULO 6', act: ['Com a tabela', 'eventos_processados'],
        code: ['1ª entrega e-502:', "  UPDATE estoque SET saldo = saldo − 1  → 2", '2ª entrega e-502 (a mesma):', "  UPDATE estoque SET saldo = saldo − 1  → 1", '1 gato vendido, 2 reservados'],
        story: 'Sem proteção, cada entrega aplica de novo. A primeira leva o saldo de 3 para <b>2</b>, como deve. A segunda é o mesmo fato, mas o consumidor não sabe disso, e o saldo vai para <b>1</b>. A loja vendeu um gato e reservou dois: é o defeito do módulo 6, agora do lado de quem consome.',
        look: 'Duas luzes saem da fila; cada uma desce o saldo de um. O saldo fica vermelho em 1.',
        key: 'Sem idempotência, a duplicata vira efeito em dobro.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 1.4, 2), s = 3 - j, done = j >= 2; lit(o, 'store', 'cmd', 'fold'); o.on.rm2 = done ? 'bad' : 1;
          o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'ENTREGA'), tape: [['e-502', j > 0 ? 'ok' : 'recv'], ['e-502', j > 1 ? 'bad' : j === 1 ? 'recv' : 'none']], tapeLabel: 'FILA' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), 'e-502', j ? 'bad' : ''); pk(o, WAY.f2, fr * 2 - 1, '−1', j ? 'bad' : ''); }
          o.rows.fold = act('consumidor', 'SEM PROTEÇÃO', [`aplicou ${j} vez${j === 1 ? '' : 'es'}`, j > 1 ? 'bad' : 'hi']);
          o.rows.rm2 = STK(s, done ? 'bad' : 'acc', done ? ['o certo: 2', 'bad'] : null);
          o.cnt = [['SALDO', String(s), done ? 'bad' : ''], ['ENTREGAS', `${j} de 2`, 'dim'], ['O CERTO', '2', 'dim']];
          o.res = done ? [['3 → 2 → 1: um gato a mais reservado', 'bad']] : []; } },
      { id: 'com', dur: 7, title: 'Com a tabela de processados: 3 → 2', yk: 'NA MESMA TRANSAÇÃO',
        code: ['BEGIN;', "INSERT INTO eventos_processados (evento_id)", "  VALUES ('e-502') ON CONFLICT DO NOTHING;", '-- 0 linhas = já processado: não aplica', "UPDATE estoque SET saldo = saldo − 1 …;", 'COMMIT;'],
        story: 'Agora o consumidor grava o <code>evento_id</code> numa tabela <code>eventos_processados</code> <b>na mesma transação</b> em que aplica o efeito. Na primeira entrega, o <code>INSERT</code> entra e o saldo vai a 2. Na segunda, o <code>ON CONFLICT DO NOTHING</code> insere 0 linhas: o <code>e-502</code> já foi processado, e o consumidor confirma sem aplicar nada. Saldo final: <b>2</b>. A mesma transação é o que importa: se o id e o efeito fossem gravados em momentos diferentes, uma queda entre os dois reabriria a duplicidade.',
        look: 'A primeira luz grava e-502 na tabela de baixo e desce o saldo; a segunda bate na tabela e para, vermelha.',
        key: 'Guardar o evento_id com o efeito, na mesma transação, torna o consumidor idempotente.',
        f(o, t) { const [j, fr] = seq(t, 0.4, 1.4, 2), done = j >= 2; lit(o, 'store', 'cmd', 'fold', 'rm2'); if (j) lit(o, 'proc');
          o.evs = pev(2, i => i === 1 ? 'acc' : 'hi');
          o.rows.cmd = { ...act('Kafka · pedidos', 'ENTREGA'), tape: [['e-502', j > 0 ? 'ok' : 'recv'], ['e-502', j > 1 ? 'bad' : j === 1 ? 'recv' : 'none']], tapeLabel: 'FILA' };
          if (!done) { pk(o, WAY.cf, Math.min(1, fr * 2), 'e-502'); pk(o, WAY.fp, fr * 2 - 1, j ? '0 linhas' : 'INSERT', j ? 'bad' : ''); if (!j) pk(o, WAY.f2, fr * 2 - 1, '−1'); }
          o.rows.fold = act('consumidor', 'IDEMPOTENTE', [j > 1 ? 'e-502: já processado' : j ? 'aplicou 1 vez' : '…', j > 1 ? 'acc' : 'hi'], ['BEGIN … COMMIT', 'dim']);
          o.rows.rm2 = STK(j ? 2 : 3, 'acc');
          o.rows.proc = act('eventos_processados', 'TABELA', j ? ['e-502', 'acc'] : ['vazia', 'dim'], j > 1 ? ['2ª: 0 linhas inseridas', 'bad'] : null);
          o.cnt = [['SALDO', j ? '2' : '3'], ['ENTREGAS', `${j} de 2`, 'dim'], ['IGNORADAS', j > 1 ? '1' : '0', 'dim']];
          o.res = done ? [['3 → 2: a duplicata não muda nada', 'acc']] : []; } },
      { id: 'store', dur: 6, title: 'No Store, o UNIQUE (evento_id) barra o dele', yk: 'PostgreSQL 14 · eventos_evento_id_key',
        code: ["append_evento('pedido-1047', 'e-502', …, 4)", 'ERROR: duplicate key value violates', '  unique constraint "eventos_evento_id_key"', 'DETAIL: Key (evento_id)=(e-502)', '  already exists.'],
        story: 'O Store já tinha a sua defesa: o <code>UNIQUE (evento_id)</code>. Tentar gravar o <code>e-502</code> de novo no <code>pedido-1047</code>, mesmo com a versão esperada certa (4), falha com <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code>, <code>DETAIL: Key (evento_id)=(e-502) already exists.</code> (medido no PostgreSQL 14). Mas isso protege a <b>gravação</b>. Do lado de quem consome, cada consumidor precisa da própria proteção.',
        look: 'Um e-502 desce sobre o trilho como v5, fica vermelho e some. O v2 original acende em vermelho.',
        key: 'O Store barra o fato repetido; o consumidor precisa barrar a entrega repetida.',
        f(o, t) { const no = t > 1.8, gone = t > 3.4; lit(o, 'store'); o.evs = pev(4, i => i === 1 && no ? 'bad' : 'hi');
          if (!gone) o.evs.push(ev(4, ['v5?', 'e-502', 'Pago'], no ? 'bad' : 'pend', 0, (1 - clamp(t / 1.8)) * 30));
          o.rows.cmd = act('psql', 'SESSÃO', ["append_evento(…, 'e-502',", 'hi'], ['  …, 4)', 'hi']);
          o.rows.fold = act('Store', 'UNIQUE', ['(evento_id)', no ? 'bad' : 'hi']);
          o.rows.rm2 = STK(2); o.rows.proc = act('eventos_processados', 'TABELA', ['e-502', 'hi']);
          o.cnt = [['NO STORE', no ? 'recusado' : '…', no ? 'bad' : ''], ['RESTRIÇÃO', 'evento_id_key', 'dim'], ['GRAVADO', no ? 'nada' : '…', 'dim']];
          o.res = no ? [['duplicate key: eventos_evento_id_key', 'bad'], ['Key (evento_id)=(e-502)', 'bad']] : []; } },
      { id: 'jeitos', dur: 6, title: 'Três jeitos de ser idempotente', yk: 'CONFORME O MODELO', act: ['Reprocessar tudo', 'sem proteção'],
        code: ['(a) por versão: modelo de último estado', '    a duplicata não passa o versao < $v', '(b) por evento_id: modelo que soma', '    eventos_processados na mesma transação', '(c) por chave natural: _id = movimentacao_id', '    MongoDB: duplicata 11000 ignorada'],
        story: 'O jeito depende do modelo. <b>(a) Por versão</b>, no último estado: a duplicata tem a mesma versão e não passa o <code>versao &lt; $v</code> (aula 9). <b>(b) Por <code>evento_id</code></b>, num modelo que soma: a tabela de processados que acabamos de ver. <b>(c) Por chave natural</b>: o destino usa o identificador do fato como chave. O extrato do lab do autor grava no MongoDB com <code>_id = movimentacao_id</code> e <b>ignora</b> o erro <code>11000</code> de duplicata (lido, não executado).',
        look: 'Os três modelos acendem à direita, cada um com a sua defesa escrita.',
        key: 'Último estado usa versão; soma usa evento_id; chave natural barra no destino.',
        f(o) { lit(o, 'store', 'fold', 'rm1', 'rm2', 'proc'); o.show.rm1 = 1; o.evs = pev(4);
          o.rows.rm1 = act('status do 1047', '(a) VERSÃO', ['WHERE versao < $v', 'acc']);
          o.rows.rm2 = act('estoque GATO-042', '(b) evento_id', ['eventos_processados', 'acc']);
          o.rows.proc = act('extrato (MongoDB)', '(c) CHAVE', ['_id = movimentacao_id', 'acc'], ['11000: ignorado', 'dim']);
          o.rows.cmd = act('consumidores', 'TRÊS', ['cada um com a sua defesa', 'hi']);
          o.rows.fold = act('defesa', 'POR MODELO', ['último estado: versão', 'hi'], ['soma: evento_id', 'hi'], ['destino: chave', 'hi']);
          bm(o, CAB.f1, { on: true }); bm(o, CAB.f2, { on: true }); bm(o, CAB.fp, { on: true });
          o.cnt = [['ÚLTIMO ESTADO', 'versão'], ['SOMA', 'evento_id', 'dim'], ['DESTINO', 'chave natural', 'dim']];
          o.res = [['cada modelo, a sua defesa', 'acc']]; } },
      { id: 'replay', dur: 8, title: 'E se der errado: reprocessar tudo sem proteção', yk: 'REPLAY DO PERÍODO',
        code: ['rehidratação republica e-501…e-505', 'consumidor do estoque sem proteção:', '  e-502 de novo → saldo 2 → 1', 'e assim em todo pedido pago do período', 'com eventos_processados: nada muda', 'basta um consumidor sem proteção'],
        story: 'A rehidratação da aula 7 republica o período inteiro de propósito. Num consumidor <b>sem</b> proteção, cada <code>PedidoPago</code> do período reserva estoque de novo: o 1047 leva o gato de 2 para 1, e o mesmo acontece em <b>todos</b> os pedidos pagos do período. O replay, que devia consertar, vira duplicidade em massa. Basta <b>um</b> consumidor não idempotente para isso. E a tabela de processados tem o seu próprio limite: cresce para sempre. Define-se uma <b>janela</b> (7 dias, como a retenção do tópico) e o que é mais velho se decide por versão.',
        look: 'A fila enche com os eventos republicados; o saldo cai de novo e fica vermelho. Embaixo, a tabela de processados mostra a janela de 7 dias.',
        key: 'Reprocessar exige que todos os consumidores sejam idempotentes.',
        f(o, t) { const g = lin(t, 0.4, 3.4, 0, 1), done = g >= 1; lit(o, 'store', 'cmd'); o.on.fold = 'bad'; o.on.rm2 = done ? 'bad' : 1; o.on.proc = 2;
          o.evs = pev(4, 'acc');
          o.rows.cmd = { ...act('rehidratação', 'REPUBLICA'), tape: PE.map((l, i) => [l[1], g * 4 > i ? (i === 1 ? 'bad' : 'ok') : 'none']), tapeLabel: 'FILA' };
          bm(o, CAB.sf, { on: !done, flow: !done }); bm(o, CAB.cf, { on: !done, flow: !done, tone: 'bad' });
          o.rows.fold = act('consumidor', 'SEM PROTEÇÃO', ['e-502 de novo: − 1', 'bad'], ['todo pedido do período', 'bad']);
          o.rows.rm2 = STK(g * 4 > 1 ? 1 : 2, g * 4 > 1 ? 'bad' : 'hi', ['o certo: 2', 'dim']);
          o.rows.proc = act('eventos_processados', 'JANELA', ['guarda 7 dias', 'hi'], ['mais velho: por versão', 'dim']);
          o.cnt = [['SALDO', g * 4 > 1 ? '1' : '2', g * 4 > 1 ? 'bad' : ''], ['REPUBLICADOS', `${Math.min(4, Math.floor(g * 4))} de 4`, 'dim'], ['NO PERÍODO', 'todos os pagos', 'bad']];
          o.res = done ? [['replay vira duplicidade em massa', 'bad'], ['processados: janela de 7 dias', 'dim']] : []; } },
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
    if (d.tape && d.tape.length) drawTape(x, u, C, d.tape, W_, H_, d.tapeLabel || 'FILA');
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
    projecao: () => `<table class="h3-sum"><tr><th>evento (pedido-1047)</th><th>status do 1047</th><th>meus_pedidos</th></tr><tr${on_(1)}><td>v1 · e-501 · PedidoCriado</td><td>criado · v1</td><td>1047 · criado · 9.490</td></tr><tr${on_(1)}><td>v2 · e-502 · PedidoPago</td><td>pago · v2</td><td>1047 · pago</td></tr><tr${on_(1)}><td>v3 · e-504 · PedidoEnviado</td><td>enviado · v3 · LA123456789BR</td><td>1047 · enviado</td></tr><tr${on_(1, 4)}><td>v4 · e-505 · PedidoEntregue</td><td>entregue · v4</td><td>1047 · entregue</td></tr></table><li>Reconstruir um modelo da loja: 50 milhões de pedidos × 4 = <b>200 milhões</b> de eventos; escrita a 20.000/s (o ritmo do módulo 18) = <b>10.000 s = 2 h 47 min</b>; ler o Store não é o gargalo (~555 mil eventos/s medidos)</li><li>Os três jeitos do artigo: <b>transacional</b> (mesma transação), <b>semissíncrono</b> (o Store publica, a projeção atualiza em seguida) e <b>assíncrono</b> (via bus, consistência eventual)</li><li>A projeção é determinística em relação à <b>sequência de eventos</b> (sem <code>now()</code> nem chamada externa); por isso o modelo é descartável</li><li>O tópico do Kafka (módulo 13) retém 7 dias: sem o Store, não há de onde reprocessar o 1047 de 18/06</li><li>A projeção com defeito (sem <code>PedidoEntregue</code>) é um exemplo</li>`,
    rehidratacao: () => `<table class="h3-sum"><tr><th>stream</th><th>eventos</th><th>rehidratar (medido)</th></tr><tr${on_(0, 1)}><td>estoque-CANECA-007</td><td>1.000.000</td><td>1.935 · 1.801 · 1.770 ms · saldo 10.000</td></tr><tr${on_(2, 3)}><td>pedido-1047</td><td>4</td><td>entregue · v4; até 14:15: pago · v2</td></tr></table><li>A caneca: a cada 100 eventos, um <code>EstoqueAjustado +100</code> e 99 <code>EstoqueReservado −1</code>; tabela + índices <b>263 MB</b> (~263 B por evento); PostgreSQL 14.24 local, cliente Python via <code>psql COPY</code>; ~<b>555 mil eventos/s</b></li><li>Linear: 10 milhões de eventos dariam ~18 s (estimativa pelo mesmo ritmo)</li><li>Lab do autor (lido, não executado): <code>rehydratate/listener.go</code> lê todos os eventos do agregado (<code>ORDER BY version ASC</code>, filtro opcional por data) e republica o saldo</li><li>O <code>{frete: 15.00}</code> antigo é um exemplo de evolução de formato; o conserto é o <i>upcasting</i> na leitura (Axon)</li>`,
    snapshot: () => `<table class="h3-sum"><tr><th>política</th><th>eventos lidos</th><th>tempo</th></tr><tr${on_(0) || (step === 3 && pol === 0 ? ' class="on"' : '')}><td>nenhum</td><td>1.000.000</td><td>1.935 · 1.801 · 1.770 ms (medido)</td></tr><tr${step === 3 && pol === 1 ? ' class="on"' : ''}><td>a cada 10.000</td><td>≤ 10.000</td><td>~29 ms (estimativa, não medido)</td></tr><tr${on_(2) || (step === 3 && pol === 2 ? ' class="on"' : '')}><td>a cada 1.000</td><td>1.000 (foto na v999.000)</td><td>13,1 · 19,6 · 12,1 ms (medido)</td></tr></table><li>Foto na v999.000: saldo 9.990; foto + 1.000 eventos = <b>10.000</b>, o mesmo do caminho completo</li><li>~<b>140×</b> mais rápido (1.800 ÷ ~13) e <b>1.000×</b> menos eventos; os ~13 ms incluem subir o <code>psql</code> duas vezes</li><li><code>snapshots(stream_id PK, versao, estado jsonb, criado_em)</code>; o lab do autor tem a tabela <code>snapshots</code> e nenhum código Go a usa</li><li>O estado <code>{disponivel, reservado}</code> e a foto com 9.890 são exemplos dos dois erros</li>`,
    versao: () => `<table class="h3-sum"><tr><th>chegada</th><th>último vence</th><th>versão maior</th></tr>${ORD0.map((k, i) => { const a = arrive(ORD0, i + 1), b = arrive(ORD0, i); return `<tr${step === 1 || step === 2 ? ' class="on"' : ''}><td>${PE[k][1]} (v${k + 1})</td><td>${ST[k]} · v${k + 1}</td><td>${k > b.vm ? 'aplica' : 'descarta'} → ${ST[a.vm]} · v${a.vm + 1}</td></tr>`; }).join('')}</table><li>Final: "último a chegar vence" → <b><code>pago</code>, versão 2</b> (errado); "só aplica se a versão for maior" (<code>UPDATE … WHERE pedido_id = 1047 AND versao &lt; $v</code>) → <b><code>entregue</code>, versão 4</b></li><li>Lab do autor: o saldo no ScyllaDB usa <code>UPDATE … IF version &lt; ?</code> (transação leve): o mesmo princípio</li><li>O Store nunca faz LWW, só acrescenta; a regra vale no consumidor, com versão (não timestamp: o relógio do módulo 17 atrasava 120 ms)</li><li>O saldo com v1 +3, v3 −1 e v2 atrasada é um exemplo</li>`,
    idempotencia: () => `<table class="h3-sum"><tr><th>entrega do e-502</th><th>sem proteção</th><th>com eventos_processados</th></tr><tr${on_(1, 2)}><td>1ª</td><td>3 → 2</td><td>INSERT e-502 · 3 → 2</td></tr><tr${on_(1, 2)}><td>2ª (a mesma)</td><td>2 → 1</td><td>0 linhas · fica 2</td></tr></table><li>No Store (PostgreSQL 14): <code>ERROR: duplicate key value violates unique constraint "eventos_evento_id_key"</code> · <code>DETAIL: Key (evento_id)=(e-502) already exists.</code></li><li>Três jeitos: por versão (último estado), por <code>evento_id</code> (soma, na mesma transação), por chave natural (lab do autor: MongoDB com <code>_id = movimentacao_id</code>, erro <code>11000</code> ignorado; lido, não executado)</li><li>A tabela de processados guarda uma janela (7 dias, a retenção do tópico); o mais velho se decide por versão</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo (avança, ou embaralha a chegada) e as opções (a política de snapshot)
  function actHtml() { const s = cur(), a = s.act;
    const opts = s.opts ? `<div class="o3-mode r3-opt" role="group" aria-label="Política">${s.opts.map(([n, d], i) => `<button data-opt="${i}" aria-pressed="${i === pol}">${n}<small>${d}</small></button>`).join('')}</div>` : '';
    return opts + (a ? `<div class="o3-mode r3-act"><button data-q3="${a[2] || 'next'}">${a[0]} ${a[2] ? '↻' : '→'}<small>${a[1]}</small></button></div>` : ''); }
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
  function readout() { if (active !== 'replay') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
