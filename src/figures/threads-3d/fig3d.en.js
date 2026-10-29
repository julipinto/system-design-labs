// Figura 3D (iso-glow): processos, threads, núcleos e o pool. O pod do estoque-1 (Go, 1 vCPU) com a memória dele,
// as goroutines como trilhos que atravessam o pod do banco (atrás) até os núcleos (bancadas na frente),
// o relatorios das 23:00 em 4 núcleos, o spinlock num nó de 8 núcleos e o pool de 10 conexões com o PostgreSQL.
// Cena: atrás, o PostgreSQL (loja) e o mostrador (contadores, o código do passo e o resultado); no meio, os pods
// (ou as réplicas); na frente, os núcleos de CPU. A peça ativa acende; o que dá errado fica vermelho.
// Cenários (toggle e ?mode=processo|um-nucleo|quatro-nucleos|interno-externo|spin|pool|conexoes; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/concorrencia-brief.md).
FIGS3D.push({ id: 'threads', name: 'Threads and cores', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp = (a, b, f) => a + (b - a) * f;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const dec = (v, n = 1) => v.toFixed(n);

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['processo', 'um-nucleo', 'quatro-nucleos', 'interno-externo', 'spin', 'pool', 'conexoes'];
  const SCNAME = { processo: 'Process', 'um-nucleo': '1 core', 'quatro-nucleos': '4 cores', 'interno-externo': 'Int × ext', spin: 'Spin', pool: 'Pool', conexoes: 'Connections' };
  const SCFULL = { processo: 'Process × threads', 'um-nucleo': 'Concurrency on 1 vCPU', 'quatro-nucleos': 'Parallelism on 4 cores',
    'interno-externo': 'Internal × external parallelism', spin: 'Spinlock × mutex', pool: 'Semaphore and connection pool', conexoes: 'Replicas × max_connections' };
  const AULA = { processo: 'aula-1-introducao-processos-threads-e-multithreading', 'um-nucleo': 'aula-2-concorrencia', 'quatro-nucleos': 'aula-3-paralelismo',
    'interno-externo': 'aula-4-paralelismo-interno-e-externo', spin: 'aula-9-spinlocks', pool: 'aula-10-semaforos-e-thread-pools', conexoes: 'aula-10-semaforos-e-thread-pools' };
  let clk = 0, sc = 'um-nucleo', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-threads3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // atrás: o banco (esquerda) e o mostrador (direita); no meio: os pods; na frente: 8 lugares de núcleo (bancadas)
  const PL = 7, PODY = 128, PODD = 200, PODH = 8, ZP = PL + PODH, BY = 352, BW = 100, BD = 76, BH = 16;
  const BX = i => 24 + i * 108, BC = i => BX(i) + BW / 2;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás do banco, em dois pés, para o banco não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 424, 12, 150, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(418, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + 147, 416, 143, 4, g0);
  // blocos fixos no lugar; os que entram e saem afundam na base
  function block(x, y, w, d, h, kind, extra = {}) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'pod' ? 8 : 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, extra.P || 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, w, d, h, kind, z0: extra.z0 || PL, key: '', f: 1, ...extra };
  }
  const B = {};
  B.db = block(24, 22, 424, 86, 30, 'db');
  B.podA = block(24, PODY, 424, PODD, PODH, 'pod', { P: 4 });
  B.podB = block(456, PODY, 424, PODD, PODH, 'pod', { P: 4 });
  B.podB1 = block(456, PODY, 208, PODD, PODH, 'pod', { P: 4 });
  B.podB2 = block(672, PODY, 208, PODD, PODH, 'pod', { P: 4 });
  B.podW = block(24, PODY, 856, PODD, PODH, 'pod', { P: 3.5 });
  // o que fica dentro do pod é baixo (10) e começa em y 158, para não cobrir o nome do pod na faixa de trás
  B.memA = block(36, 158, 140, 158, 10, 'mem', { z0: ZP });
  B.memB = block(468, 158, 140, 158, 10, 'mem', { z0: ZP });
  B.memB1 = block(468, 158, 184, 52, 10, 'mem', { z0: ZP });
  B.memB2 = block(684, 158, 184, 52, 10, 'mem', { z0: ZP });
  B.memR = block(36, 158, 400, 48, 10, 'slices', { z0: ZP });
  B.memRB = block(468, 158, 400, 48, 10, 'slices', { z0: ZP });
  B.memRW = block(36, 158, 832, 48, 10, 'slices', { z0: ZP, P: 4 });
  B.lock = block(36, 158, 832, 42, 10, 'lock', { z0: ZP, P: 4 });
  B.sem = block(196, 158, 244, 58, 10, 'sem', { z0: ZP });
  B.fila = block(196, 236, 244, 80, 10, 'fila', { z0: ZP });
  for (let i = 0; i < 8; i++) B['c' + i] = block(BX(i), BY, BW, BD, BH, 'core', { i });
  B.coreW = block(24, BY, 424, BD, BH, 'coreW');
  for (let i = 0; i < 16; i++) B['r' + i] = block(24 + (i % 8) * 108, PODY + Math.floor(i / 8) * 104, BW, 96, 12, 'rep', { i });
  const NAMES = Object.keys(B);
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 170 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-4, -4, -4, 8, 8, 8, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? (b.on ? 2.6 : 1.8) : b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.8); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }
  // fichas: cada goroutine (ou pedido) é uma ficha que corre no trilho; acesa = rodando, apagada = dormindo, vermelha = problema
  const badEm = new THREE.Color(0xe0180c);
  const TOK = Array.from({ length: 24 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-7, -7, 0, 14, 14, 11, 3, mat, g, { lines: false }); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  function setTokens(list, dt) {
    TOK.forEach((T_, i) => { const k = list[i]; if (!k) { T_.g.visible = false; T_.glow.material.uniforms.intensity.value = 0; return; }
      T_.g.visible = true; const s = k.s || 1; T_.g.scale.set(s, s, s); T_.g.position.copy(W(k.p[0], k.p[1], k.p[2] != null ? k.p[2] : ZP + 1));
      if (k.spin) T_.g.rotation.y += dt * 9; else T_.g.rotation.y = 0;
      if (k.tone === 'bad') { T_.mat.emissive.copy(badEm); T_.mat.emissiveIntensity = 1.1; } else { T_.mat.emissive.copy(accent); T_.mat.emissiveIntensity = k.tone === 'dim' ? 0.12 : 1.1; }
      moveGlow(T_.glow, [k.p[0], k.p[1], (k.p[2] != null ? k.p[2] : ZP + 1) + 12], k.tone === 'dim' ? 0 : k.tone === 'bad' ? 0.5 : 0.75); });
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
      tex.needsUpdate = true; const k = (innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1) * (isWide() ? 1.3 : 1); sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // lugares livres para balões: na frente das bancadas (embaixo de cada metade) e no alto, acima de cada metade
  const SPOT = { fA: [190, 452, 6], get fB() { return isWide() ? [640, 452, 6] : [520, 410, 6]; }, uA: [236, 250, 58], uB: [668, 250, 58], get db() { return isWide() ? [600, 64, 14] : [130, 124, 56]; } };

  // ── conteúdo padrão dos blocos ──
  const pod = (name, meta) => ({ name, meta });
  const MEM1 = [['variables (heap)', 'dim'], ['goroutine stacks', 'dim'], ['estoque code', 'dim']];
  const mem = (meta, rows = MEM1) => ({ name: 'MEMORY', meta, rows });
  const core = (i, st = 'free', tn = 'dim', sub = '') => ({ name: 'CORE ' + (i + 1), rows: [[st, tn], [sub, 'dim']] });
  const dbRows = (...rows) => ({ name: 'POSTGRESQL', meta: 'store DB', rows });
  const STOCK = [['estoque: GATO-042 · quantidade 1', 'dim'], ['SELECT or UPDATE: 2 ms each', 'dim']];

  // ── trilhos (no chão do pod, z = ZP + 1) ──
  const ZR = ZP + 1;
  const rail = (x, y0, y1) => [[x, y0, ZR], [x, y1, ZR]];
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  const lit = (o, pts, tone, dot) => o.beams.push({ pts, on: true, tone, dot });
  const C3 = (...c) => c;   // contadores: [rótulo, valor, tom]

  // ── 1 vCPU: cada pedido usa cpu ms do núcleo e espera db ms pelo banco; N pedidos em andamento ──
  // período de cada pedido = max(cpu + db, N × cpu): com o núcleo cheio, o resto vira fila pela CPU
  function sched(N, cpu, db, tau) {
    const P = Math.max(cpu + db, N * cpu), ph = [];
    for (let i = 0; i < N; i++) ph.push(((tau - i * cpu) % P + P) % P);
    let done = 0; for (let i = 0; i < N; i++) { const k = tau - i * cpu - (cpu + db); if (k >= 0) done += Math.floor(k / P) + 1; }
    return { P, ph, done, occ: m => { for (let i = 0; i < N; i++) { const p = ((m - i * cpu) % P + P) % P; if (p < cpu) return i; } return -1; } };
  }
  function oneCore(o, t, N, cpu, db, rate) {
    const tau = Math.max(0, t - 0.4) * rate, S = sched(N, cpu, db, tau), x0 = 196, span = 244, RX = i => x0 + (i + 0.5) * span / N;
    let onCpu = -1, wait = 0, queue = 0;
    for (let i = 0; i < N; i++) { const x = RX(i), p = S.ph[i];
      if (p < cpu) { onCpu = i; o.tok.push({ p: [x, 340, PL], s: N > 10 ? 0.75 : 1, tone: 'acc' }); lit(o, [[x, 318, ZR], [x, 356, ZR]]); }
      else if (p < cpu + db) { wait++; const f = (p - cpu) / db, y = f < 0.5 ? lerp(318, 114, f * 2) : lerp(114, 318, f * 2 - 1);
        o.tok.push({ p: [x, y, ZR], s: N > 10 ? 0.75 : 1, tone: 'dim' }); }
      else { queue++; o.tok.push({ p: [x, 322, ZR], s: N > 10 ? 0.75 : 1, tone: cpu > 2 ? 'bad' : 'dim' }); }
      quiet(o, [[x, 108, ZR], [x, 356, ZR]]); }
    // a fita do núcleo: 10 casas de 2 ms na janela de 20 ms que está passando
    const w0 = Math.floor(tau / 20) * 20, slots = [];
    for (let k = 0; k < 10; k++) { const m = w0 + 2 * k + 1; slots.push([S.occ(m), m <= tau + 1 ? 1 : 0]); }   // [quem usa a casa, já passou]
    const busy = N * cpu / S.P, rps = Math.round(N / S.P * 1000);
    o.on.coreW = onCpu >= 0 ? 1 : 0;
    o.rows.coreW = { name: 'CORE · 1 vCPU', meta: `CPU ${Math.round(busy * 100)}%`, slots, cur: Math.floor((tau - w0) / 2) };
    o.rows.db = dbRows([`waiting for the database: ${wait} order${wait === 1 ? '' : 's'}`, wait ? 'acc' : 'dim'], ['SELECT or UPDATE: 2 ms each', 'dim']);
    if (wait) o.on.db = 2;
    return { tau, busy, rps, onCpu, wait, queue, done: S.done, P: S.P };
  }

  // ── relatorios: fatias de linhas somadas por threads; seg = segundos do fechamento ──
  function slices(n, done, tone = '') { return Array.from({ length: n }, (_, i) => [`slice ${i + 1}`, `${Math.round(400 / n * done[i])}k of ${Math.round(400 / n)}k`, done[i], done[i] >= 1 ? 'acc' : tone]); }

  // ── o que se vê em cada passo (spec) ──
  const SHOW = {
    processo: ['db', 'podA', 'memA', 'c0'],
    'um-nucleo': ['db', 'podA', 'memA', 'coreW'],
    'quatro-nucleos': ['db', 'podA', 'memR', 'c0', 'c1', 'c2', 'c3'],
    'interno-externo': ['db', 'podA', 'memR', 'c0', 'c1', 'c2', 'c3', 'podB1', 'memB1', 'c4', 'podB2', 'memB2', 'c6'],
    spin: ['db', 'podW', 'lock', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
    pool: ['db', 'podA', 'memA', 'sem', 'fila', 'c0'],
    conexoes: ['db', 'r0'],
  };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], tok: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.db = dbRows(...STOCK);
    o.rows.podA = pod('estoque-1', 'Go process · 1 vCPU'); o.rows.podB = pod('estoque-2', 'Go process · 1 vCPU');
    o.rows.podB1 = pod('estoque-1', '1 vCPU'); o.rows.podB2 = pod('estoque-2', '1 vCPU'); o.rows.podW = pod('estoque', '8-core node');
    o.rows.memA = mem('estoque-1'); o.rows.memB = mem('estoque-2'); o.rows.memB1 = mem('estoque-1', [['estoque-1 only', 'dim']]); o.rows.memB2 = mem('estoque-2', [['estoque-2 only', 'dim']]);
    o.rows.memR = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(1, [0]) }; o.rows.memRB = { name: 'MEMORY', meta: 'relatorios-2', sl: slices(4, [0, 0, 0, 0]) };
    o.rows.memRW = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(8, Array(8).fill(0)) };
    o.rows.lock = { name: 'LOCK', meta: 'free', rows: [] };
    o.rows.sem = { name: 'SEMAPHORE', meta: '10 slots', cells: Array(10).fill(0) }; o.rows.fila = { name: 'QUEUE', n: 0, of: 0 };
    for (let i = 0; i < 8; i++) o.rows['c' + i] = core(i);
    o.rows.coreW = { name: 'CORE · 1 vCPU', meta: 'CPU 0%', slots: Array(10).fill([-1, 0]), cur: -1 };
    for (let i = 0; i < 16; i++) o.rows['r' + i] = { name: `estoque-${i + 1}`, meta: 'pool 10', rows: [['10 connections', 'dim']] };
    if (sc === 'quatro-nucleos' || sc === 'interno-externo') { o.rows.podA = pod('relatorios', 'process · 4 vCPU'); o.rows.db = dbRows(['itens_pedido: 400k rows of the day', 'dim'], ['day summary: saved at 23:00', 'dim']); }
    if (sc === 'pool' || sc === 'conexoes') o.rows.db = { ...dbRows(), grid: { used: 0, bad: 0, max: 100 } };
    return o;
  }

  const STEPS = {
    processo: [
      { id: 'processo', dur: 5, title: 'estoque-1 is a process', yk: 'IN THE CLUSTER',
        code: ['$ kubectl get pods -l app=estoque', 'NAME        READY   STATUS', 'estoque-1   1/1     Running', '# 1 container = 1 Go process', '# own memory · 1 vCPU limit'],
        story: 'Module 10 took care of the conversation between services. Now the magnifying glass goes into a single pod: estoque-1. It is a process, a running program with its own memory and 1 vCPU. Everything estoque keeps in variables lives in that block of memory.',
        look: 'The estoque-1 pod lights up with the MEMORY block inside and its core in front.',
        key: 'Process: a running program, with its own memory, isolated from the others.',
        f(o, t) { if (t > 0.3) { o.on.podA = 2; o.on.memA = t > 1.2 ? 1 : 0; } if (t > 2) o.on.c0 = 2; o.rows.c0 = core(0, 'estoque-1', 'acc', '1 vCPU');
          o.cnt = C3(['PROCESS', 'estoque-1'], ['MEMORY', 'its own'], ['CPU', '1 vCPU']);
          o.res = ['1 process · 1 memory · 1 core'];
          if (t > 1.4) T(o, SPOT.uA, 'process = running program\nwith its own memory'); } },
      { id: 'threads', dur: 6, title: 'Several goroutines, the same memory', yk: 'IN THE CODE · estoque (Go)',
        code: ['// each call gets a goroutine', 'go reservar("GATO-042")  // g1', 'go reservar("GATO-042")  // g2', 'go reservar("GATO-042")  // g3', 'go reservar("GATO-042")  // g4', '// all 4 read and write the same memory'],
        story: 'Inside a process there is room for several lines of execution: threads. In Go, the program uses goroutines. Four reservar calls arrive and each one gets its own goroutine. All four see the same memory: what one writes, the others read.',
        look: '4 tracks cross the pod; each card touches the MEMORY block when it reads or writes.',
        key: 'Thread: a line of execution inside the process, sharing its memory.',
        f(o, t) { o.on.podA = 2; o.on.memA = 1; o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU');
          o.rows.memA = mem('estoque-1', [['read and written by all 4', 'acc'], ['stacks: g1 g2 g3 g4', 'dim'], ['estoque code', 'dim']]);
          const n = t > 0.3 ? Math.min(4, 1 + Math.floor((t - 0.3) / 0.5)) : 0;
          for (let i = 0; i < 4; i++) { const x = 214 + i * 56; quiet(o, rail(x, 160, 322)); if (i >= n) continue;
            const ph = (t * 0.45 + i * 0.27) % 1, y = lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
            o.tok.push({ p: [x, y], tone: 'acc' }); lit(o, rail(x, 160, 322));
            if (Math.abs(ph - 0.5) < 0.2 || t > 4.2) lit(o, [[x, y, ZR + 4], [176, y, ZR + 4]], '', 1 - ((ph * 3) % 1)); }
          o.cnt = C3(['GOROUTINES', String(n)], ['MEMORY', '1, shared'], ['PROCESSES', '1']);
          o.res = n ? [`${n} goroutine${n > 1 ? 's' : ''} · same memory`] : [];
          if (t > 2.4) T(o, SPOT.fA, 'g1 to g4: the same memory'); } },
      { id: 'pilhas', dur: 6.5, title: '200 orders: 400 KB, not 1.6 GB', yk: 'STACK MATH',
        code: ['# goroutine: stack starts at ~2 KB', '200 × 2 KB = 400 KB', '# system thread: 8 MB reserved', '#   (ulimit -s, virtual address space)', '200 × 8 MB = 1.6 GB', '# the runtime puts the 200 on a few threads'],
        story: 'At the peak, 200 orders arrive at the same time. A system thread reserves 8 MB of stack by default: 200 of them would be 1.6 GB of virtual address space. A goroutine starts with about 2 KB, and the Go runtime fits the 200 onto a few system threads: 400 KB of stack.',
        look: 'The tracks multiply up to 10 drawn (+190); the stack counter goes up to 400 KB, against 1.6 GB in threads.',
        key: 'A goroutine is light: thousands fit where a few system threads would weigh.',
        f(o, t) { o.on.podA = 2; o.on.memA = 1; o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU');
          const n = Math.round(4 + clamp((t - 0.4) / 3.2) * 196), drawn = Math.min(10, Math.ceil(n / 20));
          for (let i = 0; i < 10; i++) { const x = 200 + i * 24; if (i >= drawn) { quiet(o, rail(x, 160, 322)); continue; } lit(o, rail(x, 160, 322));
            const ph = (t * 0.5 + i * 0.13) % 1; o.tok.push({ p: [x, lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2))], s: 0.8, tone: 'acc' }); }
          const kb = n * 2, gb = n * 8;
          o.rows.memA = mem('estoque-1', [[`${n} stacks × 2 KB`, 'acc'], [`= ${kb} KB`, 'acc'], ['variables (heap)', 'dim']]);
          o.cnt = C3(['ORDERS AT THE SAME TIME', String(n)], ['STACK IN GOROUTINES', `${kb} KB`], ['IF THEY WERE THREADS', gb >= 1000 ? dec(gb / 1000) + ' GB' : gb + ' MB', 'bad']);
          o.res = n >= 200 ? ['200 goroutines: 400 KB', '200 threads: 1.6 GB'] : [];
          if (t > 3.8) { T(o, SPOT.fA, '10 tracks drawn\n+190 goroutines', 'acc'); T(o, SPOT.uA, '200 × 8 MB = 1.6 GB\nif each one were a thread', 'bad'); } } },
      { id: 'isolado', dur: 6, title: 'estoque-2 does not see this memory', yk: 'IN THE CLUSTER',
        code: ['$ kubectl get pods -l app=estoque', 'estoque-1   1/1     Running', 'estoque-2   1/1     Running', '# 2 processes, 2 pods, 2 memories', '# what one keeps, the other does not see', '# what both see the same: the database'],
        story: 'At 14:02 the day\'s rush brings up a second replica, estoque-2. It is another process, in another pod, with another memory. A variable that estoque-1 writes does not exist for estoque-2. Between the two, only the database is common.',
        look: 'estoque-2 comes up on the right with its own MEMORY; the bridge between the two memories is red and cut.',
        key: 'Processes do not share memory; threads of the same process do.',
        f(o, t) { o.show.podB = o.show.memB = o.show.c4 = t > 0.3 ? 1 : 0; o.on.podA = o.on.podB = 2; o.on.memA = 1; o.on.memB = t > 1.4 ? 1 : 0;
          o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU'); o.rows.c4 = core(0, 'estoque-2', 'dim', '1 vCPU');
          if (t > 1.8) { const f = clamp((t - 1.8) / 1); o.beams.push({ pts: [[176, 236, ZR + 10], [lerp(176, 320, f), 236, ZR + 10]], on: true, tone: 'bad' }); if (t > 2.8) { o.on.memB = 'bad'; } }
          if (t > 3) { lit(o, [[106, 158, ZR], [106, 108, ZR]], '', ((t - 3) * 0.6) % 1); lit(o, [[538, 158, ZR], [538, 118, ZR], [420, 118, ZR], [420, 108, ZR]], '', ((t - 3) * 0.6 + 0.5) % 1); o.on.db = 1; }
          o.rows.memB = mem('estoque-2', [['another memory', t > 2.8 ? 'bad' : 'dim'], ['does not see estoque-1\'s', t > 2.8 ? 'bad' : 'dim'], ['estoque code', 'dim']]);
          o.cnt = C3(['PROCESSES', t > 0.3 ? '2' : '1'], ['MEMORIES', t > 0.3 ? '2, separate' : '1'], ['WHAT IS COMMON', t > 3 ? 'only the database' : '…']);
          o.res = t > 2.8 ? ['estoque-2 does not read estoque-1\'s memory'] : [];
          if (t > 2.8) T(o, [330, 236, 40], 'memory does not pass\nfrom one process to the other', 'bad');
          if (t > 3.4) T(o, SPOT.db, 'the common part: the database'); } },
      { id: 'panic', dur: 7.5, title: 'What if it goes wrong: a panic takes down the process', yk: 'IN THE LOG · estoque-1',
        code: ['panic: runtime error: invalid memory', '  address or nil pointer dereference', 'goroutine 3 [running]:', 'main.reservar(...)', 'exit status 2', '# without recover: the whole process goes down'],
        story: 'A goroutine in estoque-1 dereferences a null pointer and panics. Without recover, Go does not take down just that one: it takes down the whole process, with the other goroutines and the orders they were serving. It is the blast radius from module 6, now inside a process. estoque-2, with another memory, keeps serving.',
        look: 'Goroutine 3 turns red, then the whole estoque-1 pod; estoque-2 stays lit.',
        key: 'Threads share memory and also fate: a panic without recover takes the whole process.',
        f(o, t) { o.show.podB = o.show.memB = o.show.c4 = 1; o.on.podB = 2; o.on.memB = 1;
          o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU'); o.rows.c4 = core(0, 'estoque-2', 'acc', 'atendendo'); o.on.c4 = 1;
          const boom = t > 2.2;
          for (let i = 0; i < 4; i++) { const x = 214 + i * 56, ph = (Math.min(t, 2.2) * 0.45 + i * 0.27) % 1, y = lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
            const bad = boom || (i === 2 && t > 1);
            o.beams.push({ pts: rail(x, 160, 322), on: true, tone: bad ? 'bad' : '' }); if (!boom || t < 3.6) o.tok.push({ p: [x, y], tone: bad ? 'bad' : 'acc' }); }
          if (t > 1) o.on.memA = 1;
          if (boom) { o.on.podA = o.on.memA = o.on.c0 = 'bad'; o.rows.c0 = core(0, 'estoque-1', 'bad', 'process went down');
            o.rows.memA = mem('estoque-1', [['process terminated', 'bad'], ['memory lost', 'bad'], ['exit status 2', 'bad']]); }
          if (t > 4.2) o.show.memA = 0;
          lit(o, [[538, 158, ZR], [538, 118, ZR], [420, 118, ZR], [420, 108, ZR]], '', (t * 0.6) % 1);
          o.cnt = C3(['estoque-1', boom ? 'down' : t > 1 ? 'panic in g3' : 'up', boom || t > 1 ? 'bad' : ''], ['GOROUTINES LOST', boom ? 'all' : '0', boom ? 'bad' : ''], ['estoque-2', 'up']);
          o.res = boom ? ['panic: nil pointer dereference', 'exit status 2'] : t > 1 ? ['goroutine 3: panic'] : [];
          if (t > 1 && t < 2.6) T(o, [326, 250, 40], 'g3: panic, no recover', 'bad');
          if (t > 2.6) T(o, SPOT.uA, 'the whole process went down:\nall goroutines with it', 'bad');
          if (t > 3.6) T(o, SPOT.uB, 'estoque-2: another memory,\nkeeps serving'); } },
    ],
    'um-nucleo': [
      { id: 'um', dur: 8, title: 'One order at a time: 50 per second', yk: 'IN THE CODE · reservar',
        code: ['func reservar(sku string) error {', '  q := lerQuantidade(sku)   // database', '  if q < 1 { return ErrSemEstoque }', '  baixar(sku)               // database', '  return nil', '} // 2 ms of CPU + 18 ms waiting'],
        story: 'Each reservar call on estoque-1 spends 2 ms of CPU and 18 ms waiting for the database: 20 ms in total. Serving one order at a time, that is 50 orders per second. During the 18 ms of waiting, the only core sits idle.',
        look: 'The order spends 2 ms on the core and goes to the database; on the core\'s strip, 1 of the 10 slots of 2 ms lights up and the other 9 stay empty.',
        key: 'Without concurrency, the CPU sits idle while the order waits.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 1, 2, 18, 5);
          o.cnt = C3(['THROUGHPUT', '50 orders/s'], ['CPU BUSY', '10%'], ['ORDERS IN FLIGHT', '1']);
          o.res = [`${r.done} order${r.done === 1 ? '' : 's'} in ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? 'P1 on CPU: 2 ms' : 'P1 waiting for the database: 18 ms'];
          if (t > 1) T(o, SPOT.fB, '9 of 10 slots empty:\nthe core waits too', 'bad'); } },
      { id: 'dois', dur: 8, title: 'While one waits, another uses the CPU', yk: 'IN THE CODE · estoque (Go)',
        code: ['// each call in a goroutine:', 'go reservar("GATO-042")  // P1', 'go reservar("GATO-042")  // P2', '// throughput = min(N × 50, 500) orders/s', '// N = 2 → 100 orders/s'],
        story: 'With two orders in flight, the second uses the core while the first waits for the database. The core never runs both at the same time, but now it works 4 ms out of every 20. That is 100 orders per second with the same CPU.',
        look: 'Two slots on the strip light up, P1 and P2, one after the other.',
        key: 'Concurrency: interleaving tasks to make use of each one\'s wait.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 2, 2, 18, 5);
          o.cnt = C3(['THROUGHPUT', '100 orders/s'], ['CPU BUSY', '20%'], ['ORDERS IN FLIGHT', '2']);
          o.res = [`${r.done} orders in ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} on CPU, ${r.wait} in the database` : `${r.wait} waiting for the database`];
          if (t > 1) T(o, SPOT.fB, 'P2 uses the CPU while\nP1 waits for the database'); } },
      { id: 'dez', dur: 8, title: '10 orders: the CPU is full', yk: 'THE MATH',
        code: ['// throughput = min(N × 50, 500)', '// N = 10 → 10 × 50 = 500 orders/s', '// ceiling: 1 s ÷ 2 ms = 500/s', '// always 1 order on the core', '//   and 9 waiting for the database'],
        story: 'With 10 orders in flight, each one uses the core for 2 ms while the other 9 wait for the database. The 10 slots of 2 ms are all busy: 100% CPU and 10 × 50 = 500 orders per second. That is the ceiling, because 1 s ÷ 2 ms = 500.',
        look: 'The 10 slots on the strip light up, from P1 to P10; there is always exactly one order on the core.',
        key: 'With a long wait and short CPU, concurrency multiplies throughput until the CPU fills up.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 10, 2, 18, 5);
          o.cnt = C3(['THROUGHPUT', '500 orders/s'], ['CPU BUSY', '100%'], ['ORDERS IN FLIGHT', '10']);
          o.res = [`${r.done} orders in ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} on CPU, ${r.wait} in the database` : ''];
          if (t > 1) T(o, SPOT.fB, '10 of 10 slots: CPU full\n10 × 50 = 500/s'); } },
      { id: 'vinte', dur: 8, title: '20 orders: the ceiling is still 500/s', yk: 'THE MATH',
        code: ['// N = 20 → min(20 × 50, 500) = 500/s', '// the core was already full:', '//   half wait for their turn on the CPU', '// time of each order:', '//   20 ÷ 500/s = 40 ms (was 20 ms)'],
        story: 'Doubling to 20 orders doubles nothing. The core was already full, so half of the orders wait for their turn on the CPU. Throughput stays at 500 per second and each order takes 40 ms instead of 20 (20 orders ÷ 500/s).',
        look: 'Orders coming back from the database queue at the edge of the core; the strip stays at 10 of 10.',
        key: 'Once the CPU is full, more concurrency only creates a queue.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 20, 2, 18, 5);
          o.cnt = C3(['THROUGHPUT', '500 orders/s'], ['CPU BUSY', '100%'], ['IN THE CPU QUEUE', String(r.queue), r.queue ? 'bad' : '']);
          o.res = ['each order: 40 ms (was 20)', `${r.queue} waiting for the CPU, ${r.wait} in the database`];
          if (t > 1) T(o, SPOT.fB, 'queue at the edge of the core:\n500/s, each in 40 ms', 'bad'); } },
      { id: 'cpu20', dur: 9, title: 'What if it goes wrong: 20 ms of CPU per order', yk: 'THE MATH',
        code: ['// if reservar spent 20 ms of CPU', '//   (instead of 2 ms):', '// ceiling: 1 s ÷ 20 ms = 50 orders/s', '// with N = 10: still 50/s', '// concurrency only pays off for work that waits'],
        story: 'Now imagine each reservar spent 20 ms of CPU instead of 2. The core becomes the bottleneck: 1 s ÷ 20 ms = 50 orders per second. With 10 orders in flight, one uses the CPU and the others queue for it. More concurrency does not help, because there is no wait left to make use of.',
        look: 'One order occupies all 10 slots of the strip by itself; the others wait at the edge of the core, in red.',
        key: 'Concurrency only pays off for work that waits; heavy calculation needs more cores.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 10, 20, 18, 25); if (r.onCpu >= 0) o.on.coreW = 'bad';
          o.cnt = C3(['THROUGHPUT', '50 orders/s', 'bad'], ['CPU BUSY', '100%'], ['IN THE CPU QUEUE', String(r.queue), 'bad']);
          o.res = [`${r.done} orders in ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} occupies the CPU for 20 ms` : ''];
          if (t > 1) T(o, SPOT.fB, '1 order fills the strip:\nceiling of 50/s', 'bad'); } },
    ],
    'quatro-nucleos': [
      { id: 'sequencial', dur: 10.5, title: 'On a single core: 42 s', yk: '23:00 CLOSE',
        code: ['// relatorios, 1 thread:', 'linhas := lerItensDoDia()  // 400k', 'total := somar(linhas)     // 40 s of CPU', 'gravarResumo(total)        // 2 s', '// 1 core working: 42 s'],
        story: 'At 23:00 relatorios closes the day: it reads the 400 thousand rows of itens_pedido and sums everything. Summing is pure calculation, CPU only: 40 s on one core, plus 2 s to merge and save the summary. The pod has 4 vCPU, but a single thread uses one core at a time.',
        look: 'The single slice of 400 thousand rows fills slowly on core 1; cores 2, 3 and 4 stay dark.',
        key: 'One thread uses one core; the others sit idle.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; const s = clamp((t - 0.4) * 5, 0, 42), f = clamp(s / 40);
          o.rows.memR = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(1, [f]) };
          lit(o, rail(BC(0), 206, 356), '', s < 42 ? (t * 0.7) % 1 : null); for (let i = 1; i < 4; i++) quiet(o, rail(BC(i), 206, 356));
          if (s < 42) o.tok.push({ p: [BC(0), 340, PL], tone: 'acc' });
          o.on.c0 = s > 0 && s < 42 ? 1 : 2; o.rows.c0 = core(0, s < 40 ? 'summing' : s < 42 ? 'merging · 2 s' : 'done', 'acc', `${Math.round(f * 400)}k rows`);
          for (let i = 1; i < 4; i++) o.rows['c' + i] = core(i, 'idle', 'dim');
          o.cnt = C3(['TIME', `${dec(s)} s`], ['CORES IN USE', '1 de 4'], ['ROWS SUMMED', `${Math.round(f * 400)}k of 400k`]);
          o.res = s >= 42 ? ['summary saved in 42 s'] : [];
          if (t > 1.5) T(o, SPOT.fB, '3 cores idle\nwhile core 1 works', 'bad'); } },
      { id: 'fatias', dur: 5.5, title: 'In 4 slices: 12 s', yk: 'IN THE CODE · relatorios',
        code: ['// 4 threads, one slice of 100k each', 'for i := 0; i < 4; i++ {', '  go somar(fatia[i])  // 1 core each', '}', 'wg.Wait()           // 10 s, all 4 together', 'gravarResumo(juntar(parciais))  // 2 s'],
        story: 'Now relatorios splits the 400 thousand rows into 4 slices of 100 thousand, one thread per slice, each on its own core. All 4 finish together in 10 s. Then, 2 s to merge the 4 sums and save: 12 s in total. 42 ÷ 12 = 3.5 times faster.',
        look: 'The 4 slices fill at the same time, one on each core; at the end, only core 1 lights up to merge.',
        key: 'Parallelism: parts of the work running at the same time, on different cores.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; const s = clamp((t - 0.4) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { const run = s > 0 && s < 10; if (run || (i === 0 && s < 12 && s > 0)) { lit(o, rail(BC(i), 206, 356), '', run ? (t * 0.8 + i * 0.2) % 1 : null); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 10 ? `slice ${i + 1}` : i === 0 && s < 12 ? 'merging · 2 s' : 'done', i === 0 || s < 10 ? 'acc' : 'dim', `${Math.round(f * 100)}k rows`); }
          const use = s > 0 && s < 10 ? 4 : s < 12 && s > 0 ? 1 : 0;
          o.cnt = C3(['TIME', `${dec(s)} s`], ['CORES IN USE', `${use} de 4`], ['SPEEDUP', s >= 12 ? '42 ÷ 12 = 3.5×' : '…']);
          o.res = s >= 12 ? ['summary saved in 12 s', 'before: 42 s'] : [];
          if (s >= 10) T(o, SPOT.fB, 'the 2 s of merging\nrun on a single core', 'acc'); } },
      { id: 'amdahl', dur: 6.5, wide: true, title: 'Why 3.5× and not 4×', yk: 'AMDAHL\'S LAW',
        code: ['# serial part: 2 ÷ 42 = 4.8%', '4 cores: 1 ÷ (0.048 + 0.952/4) = 3.5×', '8 cores: 1 ÷ (0.048 + 0.952/8) = 6.0×', '# 8 cores: 5 s + 2 s = 7 s', '# the 2 s of merging do not split', '# ceiling with infinite cores: 21×'],
        story: 'The 2 s of merging and saving do not split: they run on a single core, with 4 or with 40. That serial part is 2 of the 42 s, 4.8%. With 8 cores the slices drop to 5 s, but the 2 s stay: 7 s, 6 times faster, not 8. That is Amdahl\'s law.',
        look: 'The pod grows to 8 cores; the 8 slices fill in 5 s and core 1 is left alone for the final 2 s.',
        key: 'The part that does not split limits the gain of any number of cores.',
        f(o, t) { o.show.podA = o.show.memR = 0; o.show.podW = o.show.memRW = 1; for (let i = 0; i < 8; i++) o.show['c' + i] = 1;
          o.rows.podW = pod('relatorios', 'example: 8 vCPU'); o.on.podW = 2; o.on.memRW = 1;
          const s = clamp((t - 0.9) * 5, 0, 7), f = clamp(s / 5);
          o.rows.memRW = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(8, Array(8).fill(f)) };
          for (let i = 0; i < 8; i++) { const run = s > 0 && s < 5; if (run || (i === 0 && s > 0 && s < 7)) { lit(o, rail(BC(i), 206, 356), '', run ? (t * 0.8 + i * 0.1) % 1 : null); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 5 ? `slice ${i + 1}` : i === 0 && s < 7 ? 'merging · 2 s' : 'idle', i === 0 || s < 5 ? 'acc' : 'dim', `${Math.round(f * 50)}k rows`); }
          o.cnt = C3(['TIME', `${dec(s)} s`], ['CORES', '8'], ['SPEEDUP', s >= 7 ? '42 ÷ 7 = 6.0×' : '…']);
          o.res = s >= 7 ? ['8 cores: 6.0× (75% efficiency)', '4 cores: 3.5× (88%)'] : [];
          if (s >= 5) T(o, SPOT.fB, 'in the final 2 s, 7 cores\nsit idle', 'bad'); } },
      { id: 'umvcpu', dur: 10, title: 'What if it goes wrong: 4 threads on 1 vCPU', yk: 'IN THE DEPLOY · relatorios',
        code: ['resources:', '  limits: { cpu: "1" }   # 1 vCPU', '# the same 4 threads, 1 core:', '# they take turns, one at a time', '# 4 × 10 s = 40 s + 2 s + switches', '# ≈ 42 s: no gain'],
        story: 'Someone deploys relatorios on a 1 vCPU pod and keeps the 4 threads, expecting the same 12 s. The 4 slices take turns on the only core: 4 × 10 s is still 40 s of CPU, plus the 2 s, plus the cost of switching threads. Threads with no free cores do not speed up calculation.',
        look: 'The 4 tracks go down to core 1; the slices fill in turns, each at 1/4 of the speed.',
        key: 'Parallelism needs real cores; threads alone are not enough.',
        f(o, t) { for (let i = 1; i < 4; i++) o.show['c' + i] = 0; o.rows.podA = pod('relatorios', 'process · 1 vCPU'); o.on.podA = 'bad'; o.on.memR = 1;
          const s = clamp((t - 0.4) * 5, 0, 42), f = clamp(s / 40), who = Math.floor(s * 2.5) % 4;
          o.rows.memR = { name: 'MEMORY', meta: 'day\'s itens_pedido', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { const pts = [[BC(i), 206, ZR], [BC(i), 300, ZR], [BC(0) + (i - 1.5) * 8, 300, ZR], [BC(0) + (i - 1.5) * 8, 356, ZR]];
            if (s < 40 && i === who) { lit(o, pts); o.tok.push({ p: [BC(0), 340, PL], tone: 'acc' }); } else { quiet(o, pts); if (s < 40) o.tok.push({ p: [BC(i), 260], tone: 'dim', s: 0.85 }); } }
          o.on.c0 = s > 0 && s < 42 ? 1 : 2; o.rows.c0 = core(0, s < 40 ? `slice ${who + 1} · its turn` : s < 42 ? 'merging · 2 s' : 'done', 'acc', `${Math.round(f * 400)}k of 400k`);
          o.cnt = C3(['TIME', `${dec(s)} s`, s > 12 ? 'bad' : ''], ['CORES', '1 (pod limit)'], ['SPEEDUP', s >= 42 ? '1.0×: none' : '…', 'bad']);
          o.res = s > 12 ? [`${dec(s)} s and counting`, 'expected: 12 s · actual: 42 s + switches'] : [];
          if (t > 2) T(o, SPOT.fB, '4 threads, 1 core:\none at a time', 'bad'); } },
    ],
    'interno-externo': [
      { id: 'interno', dur: 6, title: 'Internal parallelism: 4 threads, 1 memory', yk: 'IN THE CODE · relatorios',
        code: ['// 1 process, 4 threads', 'var parciais [4]int64   // shared memory', 'go somar(fatia[0], &parciais[0])', '...', 'go somar(fatia[3], &parciais[3])', '// all 4 write in the same process'],
        story: 'The 23:00 close of relatorios is internal parallelism: 4 threads inside one process, each on its own core, writing to the same memory. Coordinating is cheap, because all of them see the same variables.',
        look: 'On the left, the 4 slices of relatorios fill together and each track writes its sum into the same memory block.',
        key: 'Internal parallelism: several threads in a process, with shared memory.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; o.on.podB1 = o.on.podB2 = 0;
          const s = clamp((t - 0.4) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMORY', meta: 'shared by all 4', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { if (s < 10) { lit(o, rail(BC(i), 206, 356), '', 1 - (t * 0.8 + i * 0.2) % 1); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 10 ? `thread ${i + 1}` : 'done', 'acc', 'relatorios'); }
          o.rows.c4 = core(0, 'estoque-1', 'dim'); o.rows.c6 = core(0, 'estoque-2', 'dim');
          o.cnt = C3(['PROCESSES', '1'], ['THREADS', '4'], ['MEMORY', 'compartilhada']);
          o.res = s >= 10 ? ['4 partial sums, 1 memory'] : [];
          if (t > 1.5) T(o, SPOT.fA, 'internal: 4 threads,\none process, one memory'); } },
      { id: 'externo', dur: 7, title: 'External parallelism: 2 replicas, 2 memories', yk: 'AT THE LOAD BALANCER',
        code: ['# the module 7 LB splits the calls', 'Bia  (SP)  → estoque-1', 'Caio (Rio) → estoque-2', '# 2 processes, 2 pods, 2 memories', '# what both see the same: the database'],
        story: 'On the right, the two estoque replicas also run at the same time, but in separate processes. The load balancer sends Bia to estoque-1 and Caio to estoque-2. Each replica has its own memory and neither sees the other\'s variables. To agree on anything, the two depend on something outside, like the database.',
        look: 'Bia goes into estoque-1 and Caio into estoque-2; each one lights up its own memory and its own core.',
        key: 'External parallelism: separate processes, which only coordinate from the outside.',
        f(o, t) { o.on.podA = 0; o.on.podB1 = o.on.podB2 = 2; o.rows.memR = { name: 'MEMORY', meta: 'relatorios', sl: slices(4, [1, 1, 1, 1]) };
          for (let i = 0; i < 4; i++) { quiet(o, rail(BC(i), 206, 356)); o.rows['c' + i] = core(i, 'relatorios', 'dim'); }
          const xb = BC(4), xc = BC(6), pb = [[920, 342, ZR], [xb, 342, ZR], [xb, 214, ZR]], pc = [[920, 336, ZR], [xc, 336, ZR], [xc, 214, ZR]];
          const fb = clamp((t - 0.4) / 1.6), fc = clamp((t - 0.6) / 1.6);
          if (t > 0.4) { lit(o, pb); o.tok.push({ p: alongPts(pb, cumLen(pb), ease(fb)), tone: 'acc' }); }
          if (t > 0.6) { lit(o, pc); o.tok.push({ p: alongPts(pc, cumLen(pc), ease(fc)), tone: 'acc' }); }
          if (fb >= 1) { o.on.memB1 = 1; o.on.c4 = 1; o.rows.memB1 = mem('estoque-1', [['Bia\'s order', 'acc']]); lit(o, rail(xb, 214, 356)); }
          if (fc >= 1) { o.on.memB2 = 1; o.on.c6 = 1; o.rows.memB2 = mem('estoque-2', [['Caio\'s order', 'acc']]); lit(o, rail(xc, 214, 356)); }
          o.rows.c4 = core(0, fb >= 1 ? 'Bia' : 'estoque-1', fb >= 1 ? 'acc' : 'dim', 'estoque-1'); o.rows.c6 = core(0, fc >= 1 ? 'Caio' : 'estoque-2', fc >= 1 ? 'acc' : 'dim', 'estoque-2');
          if (t > 3) { lit(o, [[560, 158, ZR], [560, 118, ZR], [400, 118, ZR], [400, 108, ZR]], '', ((t - 3) * 0.6) % 1); lit(o, [[776, 158, ZR], [776, 114, ZR], [420, 114, ZR], [420, 108, ZR]], '', ((t - 3) * 0.6 + 0.5) % 1); o.on.db = 1; }
          o.cnt = C3(['PROCESSES', '2'], ['MEMORIES', '2, separate'], ['COORDINATION', t > 3 ? 'through the database' : '…']);
          o.res = fc >= 1 ? ['Bia → estoque-1 · Caio → estoque-2'] : [];
          if (t > 2.2) T(o, [668, 452, 6], 'external: 2 processes,\n2 memories'); if (t > 3.4) T(o, SPOT.db, 'what both see the same'); } },
      { id: 'duas-vezes', dur: 8, title: 'What if it goes wrong: the close runs twice', yk: 'SCHEDULER · 23:00',
        code: ['# relatorios got its 2nd replica', '# the scheduler lives in the code: it runs on both', 'relatorios-1  23:00  close → saves', 'relatorios-2  23:00  close → saves', '# day summary saved twice', '# day\'s revenue doubled'],
        story: 'relatorios gets a second replica. The scheduler for the 23:00 close lives in the code, so it runs on both. Each replica reads the 400 thousand rows, sums correctly and saves the summary. The day ends up with two summaries and the revenue shows up doubled. Neither replica was wrong on its own: coordination between the processes was missing.',
        look: 'relatorios-2 comes up on the right; both replicas write to the database and the day summary shows up twice, in red.',
        key: 'Threads coordinate through memory; replicas need coordination from the outside.',
        f(o, t) { ['podB1', 'memB1', 'podB2', 'memB2', 'c6'].forEach(n => o.show[n] = 0); o.show.podB = o.show.memRB = 1; for (let i = 4; i < 8; i++) o.show['c' + i] = 1;
          o.rows.podA = pod('relatorios-1', 'replica 1 · 4 vCPU'); o.rows.podB = pod('relatorios-2', 'replica 2 · 4 vCPU'); o.on.podA = o.on.podB = 2;
          const s = clamp((t - 0.6) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMORY', meta: 'relatorios-1', sl: slices(4, [f, f, f, f]) }; o.rows.memRB = { name: 'MEMORY', meta: 'relatorios-2', sl: slices(4, [f, f, f, f]) };
          o.on.memR = o.on.memRB = 1;
          for (let i = 0; i < 8; i++) { if (s > 0 && s < 10) { lit(o, rail(BC(i), 206, 356)); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i % 4, s < 10 ? `slice ${(i % 4) + 1}` : 'done', 'acc', i < 4 ? 'relatorios-1' : 'relatorios-2'); }
          const w1 = s >= 12 || t > 3.4, w2 = t > 4.2;
          if (t > 3) lit(o, [[236, 158, ZR], [236, 108, ZR]], '', clamp((t - 3) / 0.4));
          if (t > 3.8) lit(o, [[668, 158, ZR], [668, 118, ZR], [300, 118, ZR], [300, 108, ZR]], 'bad', clamp((t - 3.8) / 0.4));
          o.rows.db = dbRows([`day summary: ${w2 ? 2 : w1 ? 1 : 0} row${w2 ? 's' : ''}`, w2 ? 'bad' : w1 ? 'acc' : 'dim'], [w2 ? 'day\'s revenue: doubled' : 'itens_pedido: 400k rows', w2 ? 'bad' : 'dim']);
          if (w2) o.on.db = 'bad'; else if (w1) o.on.db = 1;
          o.cnt = C3(['CLOSES', t > 0.6 ? '2' : '0', 'bad'], ['SUMMARIES SAVED', w2 ? '2' : w1 ? '1' : '0', w2 ? 'bad' : ''], ['REVENUE IN THE REPORT', w2 ? 'dobrada' : '…', 'bad']);
          o.res = w2 ? ['day summary saved twice', 'processes were not coordinated'] : [];
          if (t > 1) T(o, SPOT.fB, 'replica 2 also\nruns the 23:00 one', 'bad');
          if (t > 4.6) T(o, SPOT.db, '2 summaries of the same day', 'bad'); } },
    ],
    spin: [
      { id: 'cas', dur: 6, title: '20 ns section: spinning pays off', yk: 'IN THE CODE · spinlock',
        code: ['for !atomic.CompareAndSwapInt32(&trava, 0, 1) {', '  // spins: asks again, without sleeping', '}', 'reservas_total++              // ≈ 20 ns', 'atomic.StoreInt32(&trava, 0)  // releases'],
        story: 'A spinlock does not sleep. Whoever arrives and finds the lock taken keeps spinning, asking "is it free?" with compare-and-swap. To increment reservas_total, which takes about 20 ns, that pays off: sleeping and being woken up costs microseconds, much more than the wait.',
        look: 'Goroutine 1 takes the lock and releases it in a blink; goroutine 2 spins for an instant on its core and gets in right after.',
        key: 'Spinlock: waiting by spinning; it only pays off when the critical section is shorter than sleeping and waking up.',
        f(o, t) { o.on.podW = 2; const cyc = (t * 0.7) % 1, own = cyc < 0.5 ? 0 : 1;
          o.rows.lock = { name: 'LOCK', meta: `taken · g${own + 1}`, rows: [['reservas_total++ · ≈ 20 ns', 'acc']] }; o.on.lock = 1;
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356);
            if (i < 2) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc', spin: i !== own && (cyc % 0.5) < 0.12 }); o.on['c' + i] = 1; o.rows['c' + i] = core(i, i === own ? 'g' + (i + 1) + ': lock' : 'g' + (i + 1) + ': spins', 'acc', i === own ? '20 ns' : 'for ns'); }
            else { quiet(o, pts); o.rows['c' + i] = core(i, 'free', 'dim'); } }
          o.cnt = C3(['CRITICAL SECTION', '≈ 20 ns'], ['SLEEP AND WAKE UP', 'microseconds'], ['CPU SPENT SPINNING', 'almost nothing']);
          o.res = ['g1 and g2 take turns on the lock', 'each one waits nanoseconds'];
          if (t > 1.2) T(o, SPOT.fA, 'spins a few ns:\ncheaper than sleeping'); } },
      { id: 'mutex', dur: 7, title: 'Around reservar, the mutex sleeps', yk: 'IN THE CODE · sync.Mutex',
        code: ['mu.Lock()                 // taken? sleeps', 'defer mu.Unlock()', 'q := lerQuantidade(sku)   // database', 'baixar(sku)               // database', '// critical section: 5 ms', '// whoever waits spends no CPU'],
        story: 'reservar is a different story: it holds the lock for 5 ms, almost all of it waiting for the database. With sync.Mutex, goroutine 1 gets in and the other 7 sleep until the lock opens. Asleep, they use no CPU, and cores 2 to 8 are free for other work. Go\'s mutex even spins a little before sleeping, but not for 5 ms.',
        look: 'Goroutine 1 stays on core 1; the other 7 back off along the tracks and go dark; cores 2 to 8 are free.',
        key: 'A mutex puts whoever waits to sleep: a long wait does not burn CPU.',
        f(o, t) { o.on.podW = 2; o.on.lock = 1; o.rows.lock = { name: 'LOCK', meta: 'sync.Mutex · owner g1', rows: [['reservar · 5 ms of database', 'acc']] };
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356), back = clamp((t - 0.6) / 1.2);
            if (i === 0) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc' }); o.on.c0 = 1; o.rows.c0 = core(0, 'g1: reservar', 'acc', '5 ms'); }
            else { quiet(o, pts); o.tok.push({ p: [x, lerp(340, 222, ease(back))], tone: back > 0.5 ? 'dim' : 'acc' }); o.rows['c' + i] = core(i, back >= 1 ? 'free' : 'g' + (i + 1), 'dim', back >= 1 ? 'g' + (i + 1) + ' sleeps' : ''); } }
          o.cnt = C3(['CRITICAL SECTION', '5 ms'], ['GOROUTINES ASLEEP', t > 1.8 ? '7' : '…'], ['CPU BURNED WAITING', '0%']);
          o.res = t > 1.8 ? ['7 goroutines asleep', 'cores 2 to 8 free'] : [];
          if (t > 2) T(o, SPOT.fB, '7 sleep: the cores\nstay free', 'acc'); } },
      { id: 'gira', dur: 7, title: 'What if it goes wrong: spinlock around reservar', yk: 'IN THE CODE · spinlock',
        code: ['for !atomic.CompareAndSwapInt32(&trava, 0, 1) {}', 'q := lerQuantidade(sku)   // 5 ms of database', 'baixar(sku)', 'atomic.StoreInt32(&trava, 0)', '// 7 goroutines spinning for 5 ms', '// 7 of 8 cores = 87.5% burned'],
        story: 'Swap the mutex for a spinlock around the same reservar. Goroutine 1 holds the lock for 5 ms and the other 7 spin, each on its own core, asking nonstop. That is 7 of 8 cores, 87.5% of the node\'s CPU, burned doing nothing useful.',
        look: 'The 7 goroutines spin on cores 2 to 8, in red; the burned CPU counter goes up to 87.5%.',
        key: 'A spinlock on a long section turns waiting into wasted CPU.',
        f(o, t) { o.on.podW = 2; o.on.lock = 1; o.rows.lock = { name: 'LOCK', meta: 'spinlock · owner g1', rows: [['reservar · 5 ms of database', 'bad']] };
          const n = Math.min(7, Math.max(0, Math.floor((t - 0.4) / 0.25)));
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356);
            if (i === 0) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc' }); o.on.c0 = 1; o.rows.c0 = core(0, 'g1: reservar', 'acc', '5 ms'); }
            else if (i <= n) { o.beams.push({ pts, on: true, tone: 'bad' }); o.tok.push({ p: [x, 340, PL], tone: 'bad', spin: true }); o.on['c' + i] = 'bad'; o.rows['c' + i] = core(i, 'g' + (i + 1) + ': spinning', 'bad', 'CAS nonstop'); }
            else { quiet(o, pts); o.tok.push({ p: [x, 222], tone: 'dim' }); } }
          o.cnt = C3(['CPU BURNED', `${dec(n / 8 * 100)}%`, 'bad'], ['SPINNING', `${n} goroutines`, 'bad'], ['CRITICAL SECTION', '5 ms']);
          o.res = n >= 7 ? ['7 of 8 cores spinning', '87.5% of the CPU with no useful work'] : [];
          if (t > 2.5) T(o, SPOT.fB, '7 of 8 cores = 87.5%\nburned waiting', 'bad'); } },
      { id: 'um', dur: 8.5, title: 'On a 1 vCPU pod it is worse', yk: 'IN THE CODE · lab spinlock/main.go',
        code: ['for !atomic.CompareAndSwapInt32(&l.state, 0, 1) {', '  runtime.Gosched()  // yields', '}', '# without Gosched, whoever spins takes the core', '#   and the owner does not run to release'],
        story: 'On a 1 vCPU pod, whoever spins takes the only core. Goroutine 1, which has the lock, needs the CPU to finish and release, and waits for its turn. The lab\'s spinlock calls runtime.Gosched() on every turn to yield the core; that is why it works, but it is no longer a pure spinlock. And arrival order does not count: in the lab log, friend 6 was served last.',
        look: 'Only core 1 is left; goroutine 2 spins on it and goroutine 1, the lock owner, waits on the side, in red. With Gosched, 2 yields and 1 releases.',
        key: 'A spinlock only makes sense with spare cores and a very short section.',
        f(o, t) { for (let i = 1; i < 8; i++) o.show['c' + i] = 0; o.rows.podW = pod('estoque', '1 vCPU pod'); o.on.podW = 'bad'; o.on.lock = 1;
          const yield_ = t > 4.4;
          o.rows.lock = { name: 'LOCK', meta: yield_ && t > 5.6 ? 'free' : 'owner g1', rows: [[yield_ ? 'g2 called Gosched: yielded' : 'g1 cannot run', yield_ ? 'acc' : 'bad']] };
          const x0 = BC(0);
          for (let i = 0; i < 8; i++) { const pts = [[BC(i), 200, ZR], [BC(i), 300, ZR], [x0 + (i - 3.5) * 6, 300, ZR], [x0 + (i - 3.5) * 6, 356, ZR]];
            if (i === 1 && !yield_) { o.beams.push({ pts, on: true, tone: 'bad' }); o.tok.push({ p: [x0, 340, PL], tone: 'bad', spin: true }); }
            else if (i === 0) { if (yield_) { lit(o, pts); o.tok.push({ p: [x0, 340, PL], tone: 'acc' }); } else { quiet(o, pts); o.tok.push({ p: [BC(0) + 30, 296], tone: 'bad' }); } }
            else { quiet(o, pts); if (i < 8) o.tok.push({ p: [BC(i), 240], tone: 'dim', s: 0.85 }); } }
          o.on.c0 = yield_ ? 1 : 'bad'; o.rows.c0 = core(0, yield_ ? 'g1: finishes and releases' : 'g2: spinning', yield_ ? 'acc' : 'bad', yield_ ? 'thanks to Gosched' : 'g1 without CPU');
          o.cnt = C3(['CORES', '1'], ['ON THE CPU', yield_ ? 'g1, lock owner' : 'g2, spinning', yield_ ? '' : 'bad'], ['LOCK OWNER', yield_ ? 'runs and releases' : 'waiting for the CPU', yield_ ? '' : 'bad']);
          o.res = yield_ ? ['lab: 10 friends × 1 s = 10 s', 'order: 10 3 5 1 9 2 8 7 4 6'] : ['g2 spins on the only core', 'g1 has the lock and does not run'];
          if (t > 1) T(o, SPOT.fA, yield_ ? 'Gosched: g2 yields' : 'g1 has the lock,\nbut no CPU', yield_ ? 'acc' : 'bad'); } },
    ],
    pool: [
      { id: 'vagas', dur: 6, title: 'A semaphore with 10 slots', yk: 'IN THE CODE · estoque (Go)',
        code: ['sem := make(chan struct{}, 10)  // 10 slots', 'sem <- struct{}{}         // takes one (or waits)', 'defer func() { <-sem }()  // gives it back', 'q := lerQuantidade(sku)   // uses 1 connection', '// at most 10 connections to the database'],
        story: 'estoque-1 talks to PostgreSQL through a pool of 10 connections. What controls it is a counting semaphore: 10 slots; each call takes one before going to the database and gives it back when done. 10 orders arrive and all 10 get in.',
        look: 'The 10 SEMAPHORE slots light up and 10 connections link the pod to the database: 10 slots out of 100 in PostgreSQL.',
        key: 'Semaphore: N slots; whoever arrives with everything taken waits.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan of 10', 'acc'], ['variables (heap)', 'dim'], ['estoque code', 'dim']]);
          const n = Math.min(10, Math.max(0, Math.floor((t - 0.3) / 0.2) + 1));
          o.rows.sem = { name: 'SEMAPHORE', meta: '10 slots', cells: Array.from({ length: 10 }, (_, i) => i < n ? i + 1 : 0) };
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (k < n) lit(o, pts, '', ((t * 0.9 + k * 0.1) % 1)); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: n, bad: 0, max: 100 } }; if (n) o.on.db = 1;
          o.cnt = C3(['SLOTS TAKEN', `${n} de 10`], ['CONNECTIONS IN THE DB', `${n} de 100`], ['IN THE QUEUE', '0']);
          o.res = n >= 10 ? ['10 orders · 10 connections'] : [];
          if (t > 2.4) T(o, SPOT.db, '10 of 100 connections'); } },
      { id: 'espera', dur: 7, title: 'The 11th order waits for a slot', yk: 'IN THE CODE · estoque (Go)',
        code: ['// 11th call, with all 10 slots taken:', 'sem <- struct{}{}   // channel full: blocks', '// 20 ms later, order 1 finishes:', '<-sem               // gives the slot back', '// the 11th gets in; the database keeps seeing 10'],
        story: 'The 11th order arrives with all 10 slots taken. It does not open a new connection: it waits in the queue. In 20 ms order 1 finishes, gives the slot back and the 11th gets in. The database keeps seeing 10 connections.',
        look: 'Order 11 stops in the QUEUE; when slot 1 goes dark, it moves up and takes its place.',
        key: 'The semaphore holds the excess in the app\'s queue, away from the database.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan of 10', 'acc'], ['variables (heap)', 'dim'], ['estoque code', 'dim']]);
          const ms = clamp((t - 0.5) / 3.5) * 20, freed = ms >= 20, inn = t > 4.6;
          const cells = Array.from({ length: 10 }, (_, i) => i + 1); if (freed) cells[0] = inn ? 11 : 0;
          o.rows.sem = { name: 'SEMAPHORE', meta: freed && !inn ? '1 slot free' : '10 slots', cells };
          o.rows.fila = { name: 'QUEUE', n: inn ? 0 : t > 0.5 ? 1 : 0, of: 1 }; o.on.fila = t > 0.5 && !inn ? 1 : 0;
          if (t > 0.5 && !inn) o.tok.push({ p: freed ? [lerp(300, 208, clamp((t - 4) / 0.6)), lerp(290, 200, clamp((t - 4) / 0.6))] : [300, 290], tone: 'acc' });
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (cells[k]) lit(o, pts, '', ((t * 0.9 + k * 0.1) % 1)); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: freed && !inn ? 9 : 10, bad: 0, max: 100 } }; o.on.db = 1;
          o.cnt = C3(['IN THE QUEUE', inn ? '0' : t > 0.5 ? '1' : '0'], ['TIME', `${Math.round(ms)} ms`], ['CONNECTIONS IN THE DB', `${freed && !inn ? 9 : 10} de 100`]);
          o.res = inn ? ['the 11th got into slot 1', 'the database never went past 10'] : freed ? ['order 1 finished: slot free'] : t > 0.5 ? ['order 11 waiting'] : [];
          if (t > 0.8 && !inn) T(o, [318, 452, 6], 'order 11: no slot,\nwaits in the queue', 'acc'); } },
      { id: 'lotes', dur: 10, title: '200 orders at once: 20 batches', yk: 'THE MATH · Little',
        code: ['# Black Friday: 200 orders per replica', 'batches = 200 ÷ 10 slots = 20', 'last = 20 × 20 ms = 400 ms', 'average = 20 ms × (1+2+…+20) ÷ 20 = 210 ms', 'throughput = 10 ÷ 20 ms = 500/s', 'Little: 500/s × 20 ms = 10 connections'],
        story: 'On Black Friday, 200 orders arrive at the same time on the replica. The 10 slots serve them in batches of 10: the first batch finishes in 20 ms and the last, the 20th, in 400 ms. On average, an order takes 210 ms. Throughput stays at 500 per second, and Little\'s math works out: 500/s × 20 ms = 10 connections.',
        look: 'The QUEUE goes down from 190 to 0 in steps of 10, every 20 ms; the clock stops at 400 ms.',
        key: 'Little\'s law: connections needed = throughput × time of each query.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan of 10', 'acc'], ['variables (heap)', 'dim'], ['estoque code', 'dim']]);
          const ms = clamp((t - 0.5) * 50, 0, 400), lote = Math.min(20, Math.floor(ms / 20) + 1), done = Math.min(200, Math.floor(ms / 20) * 10), fila = Math.max(0, 200 - done - 10);
          const end = ms >= 400;
          o.rows.sem = { name: 'SEMAPHORE', meta: end ? '10 slots' : `batch ${lote} de 20`, cells: Array.from({ length: 10 }, (_, i) => end ? 0 : (lote - 1) * 10 + i + 1) };
          o.rows.fila = { name: 'QUEUE', n: end ? 0 : fila, of: 190 }; o.on.fila = fila ? 1 : 0;
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (!end) lit(o, pts, '', (ms % 20) / 20); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: end ? 0 : 10, bad: 0, max: 100 } }; o.on.db = end ? 0 : 1;
          o.cnt = C3(['TIME', `${Math.round(ms)} ms`], ['DONE', `${done} de 200`], ['IN THE QUEUE', String(end ? 0 : fila)]);
          o.res = end ? ['last at 400 ms · average 210 ms', 'throughput: 500 orders/s'] : [`batch ${lote} of 20 in the database`];
          if (end) T(o, SPOT.fA, '20 batches × 20 ms = 400 ms\naverage: 210 ms'); } },
      { id: 'sem-pool', dur: 7.5, title: 'What if it goes wrong: no pool, 200 connections', yk: 'IN THE LOG · PostgreSQL',
        code: ['# without the semaphore: each order opens its own', '200 connections > max_connections = 100', 'FATAL:  sorry, too many clients already', '# 100 orders get an error right away'],
        story: 'Without the semaphore, each of the 200 orders opens its own connection. PostgreSQL accepts at most 100 (the default max_connections). The first 100 get in; the other 100 get FATAL: sorry, too many clients already. The pool did not let that happen: it held the excess in the queue.',
        look: 'The semaphore disappears; the 100 database slots fill up and the refused counter goes up to 100, in red.',
        key: 'With no limit on the app side, the database\'s limit becomes an error for the client.',
        f(o, t) { o.on.podA = 'bad'; o.show.sem = o.show.fila = 0; o.rows.memA = mem('estoque-1', [['no pool: 1 connection', 'bad'], ['per order', 'bad'], ['estoque code', 'dim']]);
          const n = Math.round(clamp((t - 0.4) / 3) * 200), ok = Math.min(100, n), bad = Math.max(0, n - 100);
          for (let k = 0; k < 20; k++) { const x = 200 + k * 12, pts = [[x, 316, ZR], [x, 108, ZR]]; if (k * 10 < n) o.beams.push({ pts, on: true, tone: k >= 10 ? 'bad' : '' }); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: ok, bad, max: 100 } }; o.on.db = bad ? 'bad' : 1;
          o.cnt = C3(['CONNECTIONS ASKED', String(n)], ['ACCEPTED', `${ok} de 100`], ['REFUSED', String(bad), bad ? 'bad' : '']);
          o.res = bad ? ['FATAL: sorry, too many clients already', `${bad} orders with an error`] : [];
          if (bad) T(o, SPOT.db, 'too many clients already', 'bad'); } },
    ],
    conexoes: [
      { id: 'uma', dur: 5, title: '1 replica × 10 connections', yk: 'THE MATH',
        code: ['# each estoque replica: pool of 10', 'connections = replicas × pool', '1 × 10 = 10', 'max_connections = 100 (default)'],
        story: 'A pool of 10 solves one replica. But the database is a single one for all estoque replicas. With one replica, that is 10 of the 100 connections PostgreSQL accepts.',
        look: 'One replica lights up and 10 of the 100 database slots.',
        key: 'The database\'s limit is split among all replicas.',
        f(o, t) { reps(o, t, 1, 10); o.cnt = C3(['REPLICAS', '1'], ['CONNECTIONS', '10 de 100'], ['SPARE', '90']); o.res = ['1 × 10 = 10'];
          if (t > 1) T(o, SPOT.db, '10 de 100'); } },
      { id: 'hpa', dur: 8, title: 'The HPA goes up to 10 replicas', yk: 'IN THE CLUSTER',
        code: ['# high CPU → the HPA creates replicas', '$ kubectl get hpa estoque', 'NAME      MINPODS  MAXPODS  REPLICAS', 'estoque   1        12       10', '# 10 × 10 = 100 = max_connections'],
        story: 'Black Friday heats up and the HPA scales estoque, replica by replica, each with its own pool of 10. With 10 replicas, that is exactly 100 connections. It fits, but with no slack at all.',
        look: 'The replicas come up one by one; the database slots fill up to 100 of 100.',
        key: 'Each new replica brings a whole pool with it.',
        f(o, t) { const n = Math.min(10, 1 + Math.floor(clamp((t - 0.4) / 4.5) * 9.999)); reps(o, t, n, 10);
          o.cnt = C3(['REPLICAS', String(n)], ['CONNECTIONS', `${n * 10} de 100`], ['SPARE', String(100 - n * 10), n >= 10 ? 'bad' : '']);
          o.res = [`${n} × 10 = ${n * 10}`]; if (n >= 10) T(o, SPOT.db, '100 of 100: full', 'acc'); } },
      { id: 'estoura', dur: 7, title: 'What if it goes wrong: 12 replicas, 120 connections', yk: 'IN THE LOG · PostgreSQL',
        code: ['12 × 10 = 120 > max_connections = 100', 'FATAL:  sorry, too many clients already', '# estoque-11 and estoque-12 with no connection', '# scaling more replicas only makes it worse'],
        story: 'The HPA keeps going and scales up to 12 replicas: 12 × 10 = 120 connections, and the database accepts 100. Replicas 11 and 12 cannot get a connection and each reservation on them fails with too many clients. Scaling estoque, here, only increases the errors.',
        look: 'Replicas 11 and 12 come up in red; the full database refuses their 20 connections.',
        key: 'Replicas × pool has to fit in the database\'s max_connections.',
        f(o, t) { const n = t > 1.6 ? 12 : t > 0.8 ? 11 : 10; reps(o, t, n, 10);
          o.cnt = C3(['REPLICAS', String(n)], ['CONNECTIONS ASKED', `${n * 10}`, n > 10 ? 'bad' : ''], ['REFUSED', String(Math.max(0, n * 10 - 100)), n > 10 ? 'bad' : '']);
          o.res = n > 10 ? ['FATAL: sorry, too many clients already', `${n * 10} > 100`] : [];
          if (n > 10) T(o, [340, 290, 50], 'no connection:\ntoo many clients', 'bad'); } },
      { id: 'conserto', dur: 6, title: 'The math that works: 12 × 8 = 96', yk: 'THREE WAYS OUT',
        code: ['# 1. a smaller pool on each replica', '12 × 8 = 96 ≤ 100', '# 2. PgBouncer in front of the database', '#    (many app connections, few in the database)', '# 3. raise max_connections', '#    (each connection costs memory in the database)'],
        story: 'Three ways out. Shrink each replica\'s pool to 8: 12 × 8 = 96, it fits. Put a pooler like PgBouncer between the replicas and the database, which merges many app connections into a few in the database. Or raise max_connections, paying memory in the database per connection.',
        look: 'Each replica gets a pool of 8; 96 slots lit and 4 spare in the database.',
        key: 'Add up the pools of all replicas before letting the HPA scale.',
        f(o, t) { reps(o, t, 12, t > 0.8 ? 8 : 10);
          o.cnt = C3(['REPLICAS', '12'], ['CONNECTIONS', t > 0.8 ? '96 de 100' : '120', t > 0.8 ? '' : 'bad'], ['SPARE', t > 0.8 ? '4' : '—']);
          o.res = t > 0.8 ? ['12 × 8 = 96 ≤ 100', 'all replicas connected'] : [];
          if (t > 1.4) T(o, SPOT.db, '96 of 100: fits'); } },
    ],
  };
  // réplicas do estoque, cada uma com o seu pool; o banco recusa o que passa de 100
  function reps(o, t, n, per) {
    let used = 0, bad = 0;
    for (let i = 0; i < 16; i++) { const on = i < n; o.show['r' + i] = on ? 1 : 0; if (!on) continue;
      const fits = used + per <= 100; if (fits) used += per; else bad += per;
      o.on['r' + i] = fits ? 1 : 'bad'; o.rows['r' + i] = { name: `estoque-${i + 1}`, meta: `pool ${per}`, rows: [[fits ? `${per} connections` : 'no connection', fits ? 'acc' : 'bad']] };
      // as réplicas da direita chegam ao banco pelo corredor de trás (y 118), cada uma por uma entrada
      const x = BC(i % 8), y = PODY + Math.floor(i / 8) * 104, px = 300 + (i % 8 - 4) * 30;
      const pts = x <= 430 ? [[x, y, ZR + 12], [x, 108, ZR + 12]] : [[x, y, ZR + 12], [x, 118, ZR + 12], [px, 118, ZR + 12], [px, 108, ZR + 12]];
      o.beams.push({ pts, on: true, tone: fits ? '' : 'bad', dot: fits ? ((t * 0.5 + i * 0.13) % 1) : null }); }
    o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used, bad, max: 100 } }; o.on.db = bad ? 'bad' : 1;
  }
  // metade esquerda (um pod só) ou a base inteira
  const WIDE = { processo: true, 'um-nucleo': false, 'quatro-nucleos': false, 'interno-externo': true, spin: true, pool: false, conexoes: true };
  const isWide = () => cur().wide != null ? cur().wide : WIDE[sc];
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
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, W_ * 0.55); x.fillText(d.name, u(5), u(8.5)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 8.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(8.5)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, k = Bk.kind;
    if (k === 'pod') { head(x, u, d, W_, col, 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(17)); x.lineTo(u(W_ - 4), u(17)); x.stroke(); }
    else if (k === 'core') { x.fillStyle = INK(); fitFont(x, u, d.name, 9.4, W_ - 10); x.fillText(d.name, u(5), u(10));
      const [st, tn] = d.rows[0]; x.fillStyle = on === 'bad' ? BAD() : toneC(tn); fitFont(x, u, st, 14, W_ - 10); x.fillText(st, u(5), u(31));
      if (d.rows[1] && d.rows[1][0]) { x.fillStyle = INK(); fitFont(x, u, d.rows[1][0], 10, W_ - 10); x.fillText(d.rows[1][0], u(5), u(52)); } }
    else if (k === 'coreW') { head(x, u, d, W_, col, 10.5);
      const n = d.slots.length, sx = 5, sw = (W_ - 10) / n, y0 = 19, hh = 26;
      d.slots.forEach(([s, past], i) => { const X = sx + i * sw; const curr = i === d.cur; x.globalAlpha = past ? 1 : 0.45;
        x.fillStyle = s >= 0 ? (on === 'bad' ? (theme === 'light' ? '#f0d6d2' : '#3a1712') : (theme === 'light' ? '#f1dcc4' : '#3a2512')) : (theme === 'light' ? '#ebebea' : '#17181a'); x.fillRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.strokeStyle = curr ? (on === 'bad' ? BAD() : accC()) : C.line; x.lineWidth = u(curr ? 1.4 : 0.5); x.strokeRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.textAlign = 'center'; const lab = s >= 0 ? 'P' + (s + 1) : '—'; x.fillStyle = s >= 0 ? (on === 'bad' ? BAD() : accC()) : INK(); fitFont(x, u, lab, 10, sw - 4); x.fillText(lab, u(X + sw / 2), u(y0 + hh / 2)); x.globalAlpha = 1; });
      x.textAlign = 'left'; x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText('0 ms', u(5), u(56)); x.textAlign = 'center'; x.fillText('10 slots of 2 ms', u(W_ / 2), u(56)); x.textAlign = 'right'; x.fillText('20 ms', u(W_ - 5), u(56)); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText('— : idle core', u(5), u(66)); }
    else if (k === 'slices') { head(x, u, d, W_, col, 10.5);
      const n = d.sl.length, sw = (W_ - 10) / n, y0 = 17, hh = H_ - y0 - 3;
      d.sl.forEach(([lab, val, f, tn], i) => { const X = 5 + i * sw;
        x.fillStyle = theme === 'light' ? '#f1dcc4' : '#3a2512'; x.fillRect(u(X + 1), u(y0), u((sw - 2) * clamp(f)), u(hh));
        x.strokeStyle = f >= 1 ? accC() : C.line; x.lineWidth = u(f >= 1 ? 1 : 0.5); x.strokeRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.fillStyle = INK(); fitFont(x, u, lab, 8.6, sw - 8); x.fillText(lab, u(X + 4), u(y0 + 8)); x.fillStyle = tn === 'acc' ? accC() : C.inkHi; fitFont(x, u, val, 9.4, sw - 8); x.fillText(val, u(X + 4), u(y0 + 21)); }); }
    else if (k === 'db') { head(x, u, d, W_, col, 11);
      if (d.grid) { const { used, bad, max } = d.grid, cols = 25, rows = max / cols, gx = 5, gy = 18, cw = (W_ - 10) / cols, ch = (H_ - gy - 4) / rows;
        for (let i = 0; i < max; i++) { const X = gx + (i % cols) * cw, Y = gy + Math.floor(i / cols) * ch;
          x.fillStyle = i < used ? (bad ? (theme === 'light' ? '#c98a3f' : accC()) : accC()) : (theme === 'light' ? '#e2e2e1' : '#202124'); x.fillRect(u(X + 0.8), u(Y + 0.8), u(cw - 1.6), u(ch - 1.6)); }
        if (bad) { x.textAlign = 'right'; x.fillStyle = BAD(); fitFont(x, u, `+${bad} refused`, 10, 120); x.fillText(`+${bad} refused`, u(W_ * 0.62), u(8.5)); x.textAlign = 'left'; } }
      else { let y = 26; for (const [text, tn] of d.rows) { x.fillStyle = toneC(tn); fitFont(x, u, text, 10.5, W_ - 10); x.fillText(text, u(5), u(y)); y += 16; } } }
    else if (k === 'sem') { head(x, u, d, W_, col, 10.5);
      const n = d.cells.length, sw = (W_ - 10) / n, y0 = 19, hh = H_ - y0 - 5;
      d.cells.forEach((c, i) => { const X = 5 + i * sw; x.fillStyle = c ? (theme === 'light' ? '#f1dcc4' : '#3a2512') : (theme === 'light' ? '#ebebea' : '#17181a'); x.fillRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.strokeStyle = c ? accC() : C.line; x.lineWidth = u(c ? 0.9 : 0.5); x.strokeRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.textAlign = 'center'; x.fillStyle = c ? accC() : INK(); const lab = c ? String(c) : 'free'; fitFont(x, u, lab, c > 99 ? 8 : 10, sw - 3); x.fillText(lab, u(X + sw / 2), u(y0 + hh / 2)); x.textAlign = 'left'; }); }
    else if (k === 'fila') { head(x, u, { name: d.name, meta: 'whoever waits for a slot' }, W_, col, 10.5);
      x.fillStyle = d.n ? accC() : INK(); fitFont(x, u, String(d.n), 22, 80); x.fillText(String(d.n), u(5), u(38)); const nw = x.measureText(String(d.n)).width / u(1);
      x.fillStyle = INK(); fitFont(x, u, d.n === 1 ? 'pedido' : 'pedidos', 9.4, 120); x.fillText(d.n === 1 ? 'pedido' : 'pedidos', u(nw + 10), u(40));
      if (d.of) { const bw = W_ - 10; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(5), u(56), u(bw), u(9)); x.fillStyle = accC(); x.fillRect(u(5), u(56), u(bw * clamp(d.n / d.of)), u(9)); } }
    else {   // mem, lock, rep: nome, meta e linhas
      head(x, u, d, W_, col, k === 'rep' ? 10 : 10.5); let y = k === 'lock' ? 27 : 26;
      for (const [text, tn] of d.rows || []) { x.fillStyle = on === 'bad' && tn !== 'acc' ? BAD() : toneC(tn); fitFont(x, u, text, k === 'rep' ? 9.6 : 9.4, W_ - 10); x.fillText(text, u(5), u(y)); y += 14; } }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(147)); x.stroke();
    lbl(s.yk || 'IN THE CODE', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /FATAL|panic|exit|refus|no connection|twice|not /.test(l) ? BAD() : acc; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    processo: () => `<li>Goroutine: initial stack of ~<b>2 KB</b>; system thread: <b>8 MB</b> reserved by default (<b>ulimit -s</b>)</li><li>200 orders: <b>200 × 2 KB = 400 KB</b> in goroutines; <b>200 × 8 MB = 1.6 GB</b> of virtual address space in threads</li><li>estoque-1 and estoque-2: <b>1 vCPU</b> each; 2 processes, 2 memories; the 2nd replica comes up at <b>14:02</b></li><li>panic without recover in a goroutine: the whole process exits with <b>exit status 2</b></li>`,
    'um-nucleo': () => `<li>reservar: <b>2 ms of CPU + 18 ms</b> waiting for the database = <b>20 ms</b></li><li>throughput = <b>min(N × 50, 500)</b> orders/s; ceiling = 1 s ÷ 2 ms = <b>500/s</b></li><table class="h3-sum"><tr><th>N</th><th>CPU</th><th>throughput</th></tr><tr><td>1</td><td>10%</td><td>50/s</td></tr><tr><td>2</td><td>20%</td><td>100/s</td></tr><tr class="on"><td>10</td><td>100%</td><td>500/s</td></tr><tr><td>20</td><td>100%</td><td>500/s (40 ms each)</td></tr><tr><td>10, with 20 ms of CPU</td><td>100%</td><td>50/s</td></tr></table>`,
    'quatro-nucleos': () => `<li>23:00 close: <b>400 thousand</b> rows of itens_pedido; <b>40 s</b> of CPU + <b>2 s</b> to merge and save</li><table class="h3-sum"><tr><th>cores</th><th>time</th><th>speedup</th></tr><tr><td>1</td><td>40 + 2 = 42 s</td><td>1×</td></tr><tr class="on"><td>4</td><td>10 + 2 = 12 s</td><td>3.5× (88%)</td></tr><tr><td>8</td><td>5 + 2 = 7 s</td><td>6.0× (75%)</td></tr><tr><td>4 threads on 1 vCPU</td><td>≈ 42 s + switches</td><td>none</td></tr></table><li>Amdahl: 1 ÷ (s + (1 − s) ÷ n), with s = 2/42 = <b>4.8%</b>; ceiling = 1 ÷ s = <b>21×</b></li><li class="h3-dim">The lab's barbecue uses time.Sleep, which does not spend CPU: it shows overlapping waits, not CPU parallelism.</li>`,
    'interno-externo': () => `<table class="h3-sum"><tr><th></th><th>internal</th><th>external</th></tr><tr><td>example</td><td>relatorios: 4 threads</td><td>estoque-1 and estoque-2</td></tr><tr><td>processes</td><td>1</td><td>2 (2 pods)</td></tr><tr><td>memory</td><td>shared</td><td>one per process</td></tr><tr class="on"><td>coordination</td><td>through memory</td><td>from outside (database, distributed lock)</td></tr></table><li>Bia (SP) → estoque-1 · Caio (Rio) → estoque-2, through the module 7 LB</li><li>2 relatorios replicas, scheduler on both: the 23:00 summary saved <b>2 times</b></li>`,
    spin: () => `<li><b>≈ 20 ns</b> section (reservas_total++): spinning costs less than sleeping and waking up (microseconds)</li><li><b>5 ms</b> section (reservar): 7 goroutines spinning on 7 of 8 cores = <b>87.5%</b> of the node's CPU burned</li><li>sync.Mutex: spins a little and sleeps; if someone waits more than <b>1 ms</b>, it enters starvation mode and starts serving in order</li><li>Lab (spinlock/main.go): CAS + <b>runtime.Gosched()</b> on every turn; 10 friends × 1 s = <b>10 s</b>; entry order 10, 3, 5, 1, 9, 2, 8, 7, 4, <b>6</b></li>`,
    pool: () => `<li><b>10</b>-slot semaphore: <b>make(chan struct{}, 10)</b></li><li>Little: <b>500/s × 20 ms = 10</b> connections</li><li>200 orders, 10 slots, 20 ms: <b>20 batches</b>; last at <b>400 ms</b>; average <b>210 ms</b>; throughput <b>500/s</b></li><li>No pool: 200 connections &gt; max_connections <b>100</b> → <b>FATAL: sorry, too many clients already</b></li><li class="h3-dim">The lab's semaphore creates one goroutine per task and only limits how many run (3 slots, 10 tasks of 2 s: 4 waves = 8 s). A worker pool has fixed workers reading from a queue.</li>`,
    conexoes: () => `<table class="h3-sum"><tr><th>replicas</th><th>pool</th><th>connections</th></tr><tr><td>1</td><td>10</td><td>10 of 100</td></tr><tr><td>10</td><td>10</td><td>100 of 100</td></tr><tr><td>12</td><td>10</td><td><b>120: 20 refused</b></td></tr><tr class="on"><td>12</td><td>8</td><td>96 of 100</td></tr></table><li>Ways out: a smaller pool per replica, a pooler (PgBouncer) or raising max_connections (costs memory in the database)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="t3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'In the code')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'threads') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'threads' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-threads3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'threads') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, Bk.z0 - (1 - e) * (Bk.h + 3 + Bk.z0 - PL)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? (Bk.kind === 'pod' ? 0.25 : 0.55) : on === 2 ? 0.15 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && (Bk.kind === 'core' || Bk.kind === 'coreW') ? 0.9 : 0); });
    setBeams(o.beams); setTokens(o.tok, dt); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('t3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const wide = isWide(), [x0, x1, y0, y1] = wide ? [-10, 920, 8, 455] : [-10, 470, 8, 455];
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
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
