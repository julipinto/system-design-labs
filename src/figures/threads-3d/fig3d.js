// Figura 3D (iso-glow): processos, threads, núcleos e o pool. O pod do estoque-1 (Go, 1 vCPU) com a memória dele,
// as goroutines como trilhos que atravessam o pod do banco (atrás) até os núcleos (bancadas na frente),
// o relatorios das 23:00 em 4 núcleos, o spinlock num nó de 8 núcleos e o pool de 10 conexões com o PostgreSQL.
// Cena: atrás, o PostgreSQL (loja) e o mostrador (contadores, o código do passo e o resultado); no meio, os pods
// (ou as réplicas); na frente, os núcleos de CPU. A peça ativa acende; o que dá errado fica vermelho.
// Cenários (toggle e ?mode=processo|um-nucleo|quatro-nucleos|interno-externo|spin|pool|conexoes; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/concorrencia-brief.md).
FIGS3D.push({ id: 'threads', name: 'Threads e núcleos', mod: (() => {
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
  const dec = (v, n = 1) => v.toFixed(n).replace('.', ',');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['processo', 'um-nucleo', 'quatro-nucleos', 'interno-externo', 'spin', 'pool', 'conexoes'];
  const SCNAME = { processo: 'Processo', 'um-nucleo': '1 núcleo', 'quatro-nucleos': '4 núcleos', 'interno-externo': 'Int × ext', spin: 'Spin', pool: 'Pool', conexoes: 'Conexões' };
  const SCFULL = { processo: 'Processo × threads', 'um-nucleo': 'Concorrência em 1 vCPU', 'quatro-nucleos': 'Paralelismo em 4 núcleos',
    'interno-externo': 'Paralelismo interno × externo', spin: 'Spinlock × mutex', pool: 'Semáforo e pool de conexões', conexoes: 'Réplicas × max_connections' };
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
  const MEM1 = [['variáveis (heap)', 'dim'], ['pilhas das goroutines', 'dim'], ['código do estoque', 'dim']];
  const mem = (meta, rows = MEM1) => ({ name: 'MEMÓRIA', meta, rows });
  const core = (i, st = 'livre', tn = 'dim', sub = '') => ({ name: 'NÚCLEO ' + (i + 1), rows: [[st, tn], [sub, 'dim']] });
  const dbRows = (...rows) => ({ name: 'POSTGRESQL', meta: 'banco loja', rows });
  const STOCK = [['estoque: GATO-042 · quantidade 1', 'dim'], ['SELECT ou UPDATE: 2 ms cada', 'dim']];

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
    o.rows.coreW = { name: 'NÚCLEO · 1 vCPU', meta: `CPU ${Math.round(busy * 100)}%`, slots, cur: Math.floor((tau - w0) / 2) };
    o.rows.db = dbRows([`esperando o banco: ${wait} pedido${wait === 1 ? '' : 's'}`, wait ? 'acc' : 'dim'], ['SELECT ou UPDATE: 2 ms cada', 'dim']);
    if (wait) o.on.db = 2;
    return { tau, busy, rps, onCpu, wait, queue, done: S.done, P: S.P };
  }

  // ── relatorios: fatias de linhas somadas por threads; seg = segundos do fechamento ──
  function slices(n, done, tone = '') { return Array.from({ length: n }, (_, i) => [`fatia ${i + 1}`, `${Math.round(400 / n * done[i])} de ${Math.round(400 / n)} mil`, done[i], done[i] >= 1 ? 'acc' : tone]); }

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
    o.rows.podA = pod('estoque-1', 'processo Go · 1 vCPU'); o.rows.podB = pod('estoque-2', 'processo Go · 1 vCPU');
    o.rows.podB1 = pod('estoque-1', '1 vCPU'); o.rows.podB2 = pod('estoque-2', '1 vCPU'); o.rows.podW = pod('estoque', 'nó de 8 núcleos');
    o.rows.memA = mem('estoque-1'); o.rows.memB = mem('estoque-2'); o.rows.memB1 = mem('estoque-1', [['só do estoque-1', 'dim']]); o.rows.memB2 = mem('estoque-2', [['só do estoque-2', 'dim']]);
    o.rows.memR = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(1, [0]) }; o.rows.memRB = { name: 'MEMÓRIA', meta: 'relatorios-2', sl: slices(4, [0, 0, 0, 0]) };
    o.rows.memRW = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(8, Array(8).fill(0)) };
    o.rows.lock = { name: 'TRAVA', meta: 'livre', rows: [] };
    o.rows.sem = { name: 'SEMÁFORO', meta: '10 vagas', cells: Array(10).fill(0) }; o.rows.fila = { name: 'FILA', n: 0, of: 0 };
    for (let i = 0; i < 8; i++) o.rows['c' + i] = core(i);
    o.rows.coreW = { name: 'NÚCLEO · 1 vCPU', meta: 'CPU 0%', slots: Array(10).fill([-1, 0]), cur: -1 };
    for (let i = 0; i < 16; i++) o.rows['r' + i] = { name: `estoque-${i + 1}`, meta: 'pool 10', rows: [['10 conexões', 'dim']] };
    if (sc === 'quatro-nucleos' || sc === 'interno-externo') { o.rows.podA = pod('relatorios', 'processo · 4 vCPU'); o.rows.db = dbRows(['itens_pedido: 400 mil linhas do dia', 'dim'], ['resumo do dia: gravado às 23:00', 'dim']); }
    if (sc === 'pool' || sc === 'conexoes') o.rows.db = { ...dbRows(), grid: { used: 0, bad: 0, max: 100 } };
    return o;
  }

  const STEPS = {
    processo: [
      { id: 'processo', dur: 5, title: 'O estoque-1 é um processo', yk: 'NO CLUSTER',
        code: ['$ kubectl get pods -l app=estoque', 'NAME        READY   STATUS', 'estoque-1   1/1     Running', '# 1 container = 1 processo Go', '# memória própria · limite de 1 vCPU'],
        story: 'O módulo 10 cuidou da conversa entre os serviços. Agora a lupa entra num pod só: o estoque-1. Ele é um processo, um programa rodando com memória própria e 1 vCPU. Tudo o que o estoque guarda em variáveis mora nesse bloco de memória.',
        look: 'O pod estoque-1 acende com o bloco MEMÓRIA dentro e o núcleo dele na frente.',
        key: 'Processo: um programa rodando, com memória própria e isolada dos outros.',
        f(o, t) { if (t > 0.3) { o.on.podA = 2; o.on.memA = t > 1.2 ? 1 : 0; } if (t > 2) o.on.c0 = 2; o.rows.c0 = core(0, 'estoque-1', 'acc', '1 vCPU');
          o.cnt = C3(['PROCESSO', 'estoque-1'], ['MEMÓRIA', 'própria'], ['CPU', '1 vCPU']);
          o.res = ['1 processo · 1 memória · 1 núcleo'];
          if (t > 1.4) T(o, SPOT.uA, 'processo = programa rodando\ncom memória própria'); } },
      { id: 'threads', dur: 6, title: 'Várias goroutines, a mesma memória', yk: 'NO CÓDIGO · estoque (Go)',
        code: ['// cada chamada ganha uma goroutine', 'go reservar("GATO-042")  // g1', 'go reservar("GATO-042")  // g2', 'go reservar("GATO-042")  // g3', 'go reservar("GATO-042")  // g4', '// as 4 leem e escrevem a mesma memória'],
        story: 'Dentro de um processo cabem várias linhas de execução: as threads. No Go, o programa usa goroutines. Quatro chamadas de reservar chegam e cada uma ganha a sua goroutine. As quatro enxergam a mesma memória: o que uma escreve, as outras leem.',
        look: '4 trilhos cruzam o pod; cada ficha encosta no bloco MEMÓRIA quando lê ou escreve.',
        key: 'Thread: uma linha de execução dentro do processo, dividindo a memória dele.',
        f(o, t) { o.on.podA = 2; o.on.memA = 1; o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU');
          o.rows.memA = mem('estoque-1', [['lida e escrita pelas 4', 'acc'], ['pilhas: g1 g2 g3 g4', 'dim'], ['código do estoque', 'dim']]);
          const n = t > 0.3 ? Math.min(4, 1 + Math.floor((t - 0.3) / 0.5)) : 0;
          for (let i = 0; i < 4; i++) { const x = 214 + i * 56; quiet(o, rail(x, 160, 322)); if (i >= n) continue;
            const ph = (t * 0.45 + i * 0.27) % 1, y = lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
            o.tok.push({ p: [x, y], tone: 'acc' }); lit(o, rail(x, 160, 322));
            if (Math.abs(ph - 0.5) < 0.2 || t > 4.2) lit(o, [[x, y, ZR + 4], [176, y, ZR + 4]], '', 1 - ((ph * 3) % 1)); }
          o.cnt = C3(['GOROUTINES', String(n)], ['MEMÓRIA', '1, compartilhada'], ['PROCESSOS', '1']);
          o.res = n ? [`${n} goroutine${n > 1 ? 's' : ''} · mesma memória`] : [];
          if (t > 2.4) T(o, SPOT.fA, 'g1 a g4: a mesma memória'); } },
      { id: 'pilhas', dur: 6.5, title: '200 pedidos: 400 KB, não 1,6 GB', yk: 'CONTA DA PILHA',
        code: ['# goroutine: pilha começa com ~2 KB', '200 × 2 KB = 400 KB', '# thread do sistema: 8 MB reservados', '#   (ulimit -s, endereço virtual)', '200 × 8 MB = 1,6 GB', '# o runtime põe as 200 em poucas threads'],
        story: 'No pico chegam 200 pedidos ao mesmo tempo. Uma thread do sistema reserva 8 MB de pilha por padrão: 200 delas seriam 1,6 GB de endereço virtual. Uma goroutine começa com cerca de 2 KB, e o runtime do Go encaixa as 200 em poucas threads do sistema: 400 KB de pilha.',
        look: 'Os trilhos se multiplicam até 10 desenhados (+190); o contador de pilha sobe a 400 KB, contra 1,6 GB em threads.',
        key: 'Goroutine é leve: milhares cabem onde poucas threads do sistema pesariam.',
        f(o, t) { o.on.podA = 2; o.on.memA = 1; o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU');
          const n = Math.round(4 + clamp((t - 0.4) / 3.2) * 196), drawn = Math.min(10, Math.ceil(n / 20));
          for (let i = 0; i < 10; i++) { const x = 200 + i * 24; if (i >= drawn) { quiet(o, rail(x, 160, 322)); continue; } lit(o, rail(x, 160, 322));
            const ph = (t * 0.5 + i * 0.13) % 1; o.tok.push({ p: [x, lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2))], s: 0.8, tone: 'acc' }); }
          const kb = n * 2, gb = n * 8;
          o.rows.memA = mem('estoque-1', [[`${n} pilhas × 2 KB`, 'acc'], [`= ${kb} KB`, 'acc'], ['variáveis (heap)', 'dim']]);
          o.cnt = C3(['PEDIDOS AO MESMO TEMPO', String(n)], ['PILHA EM GOROUTINES', `${kb} KB`], ['SE FOSSEM THREADS', gb >= 1000 ? dec(gb / 1000) + ' GB' : gb + ' MB', 'bad']);
          o.res = n >= 200 ? ['200 goroutines: 400 KB', '200 threads: 1,6 GB'] : [];
          if (t > 3.8) { T(o, SPOT.fA, '10 trilhos desenhados\n+190 goroutines', 'acc'); T(o, SPOT.uA, '200 × 8 MB = 1,6 GB\nse cada uma fosse thread', 'bad'); } } },
      { id: 'isolado', dur: 6, title: 'O estoque-2 não enxerga essa memória', yk: 'NO CLUSTER',
        code: ['$ kubectl get pods -l app=estoque', 'estoque-1   1/1     Running', 'estoque-2   1/1     Running', '# 2 processos, 2 pods, 2 memórias', '# o que um guarda, o outro não vê', '# o que os dois veem igual: o banco'],
        story: 'Às 14:02 a corrida do dia sobe uma segunda réplica, o estoque-2. É outro processo, em outro pod, com outra memória. Uma variável que o estoque-1 escreve não existe para o estoque-2. Entre os dois, só o banco é comum.',
        look: 'O estoque-2 sobe à direita com a MEMÓRIA dele; a ponte entre as duas memórias fica vermelha e cortada.',
        key: 'Processos não dividem memória; threads do mesmo processo dividem.',
        f(o, t) { o.show.podB = o.show.memB = o.show.c4 = t > 0.3 ? 1 : 0; o.on.podA = o.on.podB = 2; o.on.memA = 1; o.on.memB = t > 1.4 ? 1 : 0;
          o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU'); o.rows.c4 = core(0, 'estoque-2', 'dim', '1 vCPU');
          if (t > 1.8) { const f = clamp((t - 1.8) / 1); o.beams.push({ pts: [[176, 236, ZR + 10], [lerp(176, 320, f), 236, ZR + 10]], on: true, tone: 'bad' }); if (t > 2.8) { o.on.memB = 'bad'; } }
          if (t > 3) { lit(o, [[106, 158, ZR], [106, 108, ZR]], '', ((t - 3) * 0.6) % 1); lit(o, [[538, 158, ZR], [538, 118, ZR], [420, 118, ZR], [420, 108, ZR]], '', ((t - 3) * 0.6 + 0.5) % 1); o.on.db = 1; }
          o.rows.memB = mem('estoque-2', [['outra memória', t > 2.8 ? 'bad' : 'dim'], ['não vê a do estoque-1', t > 2.8 ? 'bad' : 'dim'], ['código do estoque', 'dim']]);
          o.cnt = C3(['PROCESSOS', t > 0.3 ? '2' : '1'], ['MEMÓRIAS', t > 0.3 ? '2, separadas' : '1'], ['O QUE É COMUM', t > 3 ? 'só o banco' : '…']);
          o.res = t > 2.8 ? ['estoque-2 não lê a memória do estoque-1'] : [];
          if (t > 2.8) T(o, [330, 236, 40], 'memória não passa\nde um processo ao outro', 'bad');
          if (t > 3.4) T(o, SPOT.db, 'o comum aos dois: o banco'); } },
      { id: 'panic', dur: 7.5, title: 'E se der errado: um panic derruba o processo', yk: 'NO LOG · estoque-1',
        code: ['panic: runtime error: invalid memory', '  address or nil pointer dereference', 'goroutine 3 [running]:', 'main.reservar(...)', 'exit status 2', '# sem recover: cai o processo inteiro'],
        story: 'Uma goroutine do estoque-1 acessa um ponteiro nulo e entra em panic. Sem recover, o Go não derruba só ela: derruba o processo inteiro, com as outras goroutines e os pedidos que elas atendiam. É o raio de explosão do módulo 6, agora dentro de um processo. O estoque-2, com outra memória, continua atendendo.',
        look: 'A goroutine 3 fica vermelha, depois o pod estoque-1 inteiro; o estoque-2 continua aceso.',
        key: 'Threads dividem a memória e também o destino: um panic sem recover leva o processo todo.',
        f(o, t) { o.show.podB = o.show.memB = o.show.c4 = 1; o.on.podB = 2; o.on.memB = 1;
          o.rows.c0 = core(0, 'estoque-1', 'dim', '1 vCPU'); o.rows.c4 = core(0, 'estoque-2', 'acc', 'atendendo'); o.on.c4 = 1;
          const boom = t > 2.2;
          for (let i = 0; i < 4; i++) { const x = 214 + i * 56, ph = (Math.min(t, 2.2) * 0.45 + i * 0.27) % 1, y = lerp(170, 306, 0.5 - 0.5 * Math.cos(ph * Math.PI * 2));
            const bad = boom || (i === 2 && t > 1);
            o.beams.push({ pts: rail(x, 160, 322), on: true, tone: bad ? 'bad' : '' }); if (!boom || t < 3.6) o.tok.push({ p: [x, y], tone: bad ? 'bad' : 'acc' }); }
          if (t > 1) o.on.memA = 1;
          if (boom) { o.on.podA = o.on.memA = o.on.c0 = 'bad'; o.rows.c0 = core(0, 'estoque-1', 'bad', 'processo caiu');
            o.rows.memA = mem('estoque-1', [['processo encerrado', 'bad'], ['memória perdida', 'bad'], ['exit status 2', 'bad']]); }
          if (t > 4.2) o.show.memA = 0;
          lit(o, [[538, 158, ZR], [538, 118, ZR], [420, 118, ZR], [420, 108, ZR]], '', (t * 0.6) % 1);
          o.cnt = C3(['estoque-1', boom ? 'caiu' : t > 1 ? 'panic na g3' : 'de pé', boom || t > 1 ? 'bad' : ''], ['GOROUTINES PERDIDAS', boom ? 'todas' : '0', boom ? 'bad' : ''], ['estoque-2', 'de pé']);
          o.res = boom ? ['panic: nil pointer dereference', 'exit status 2'] : t > 1 ? ['goroutine 3: panic'] : [];
          if (t > 1 && t < 2.6) T(o, [326, 250, 40], 'g3: panic, sem recover', 'bad');
          if (t > 2.6) T(o, SPOT.uA, 'caiu o processo inteiro:\ntodas as goroutines junto', 'bad');
          if (t > 3.6) T(o, SPOT.uB, 'estoque-2: outra memória,\nsegue atendendo'); } },
    ],
    'um-nucleo': [
      { id: 'um', dur: 8, title: 'Um pedido por vez: 50 por segundo', yk: 'NO CÓDIGO · reservar',
        code: ['func reservar(sku string) error {', '  q := lerQuantidade(sku)   // banco', '  if q < 1 { return ErrSemEstoque }', '  baixar(sku)               // banco', '  return nil', '} // 2 ms de CPU + 18 ms esperando'],
        story: 'Cada chamada de reservar no estoque-1 gasta 2 ms de CPU e 18 ms esperando o banco: 20 ms no total. Atendendo um pedido de cada vez, são 50 pedidos por segundo. Durante os 18 ms de espera, o único núcleo fica parado.',
        look: 'O pedido passa 2 ms no núcleo e vai ao banco; na fita do núcleo, 1 das 10 casas de 2 ms acende e as outras 9 ficam vazias.',
        key: 'Sem concorrência, a CPU fica parada enquanto o pedido espera.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 1, 2, 18, 5);
          o.cnt = C3(['VAZÃO', '50 pedidos/s'], ['CPU OCUPADA', '10%'], ['PEDIDOS EM ANDAMENTO', '1']);
          o.res = [`${r.done} pedido${r.done === 1 ? '' : 's'} em ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? 'P1 na CPU: 2 ms' : 'P1 esperando o banco: 18 ms'];
          if (t > 1) T(o, SPOT.fB, '9 de 10 casas vazias:\no núcleo espera junto', 'bad'); } },
      { id: 'dois', dur: 8, title: 'Enquanto um espera, outro usa a CPU', yk: 'NO CÓDIGO · estoque (Go)',
        code: ['// cada chamada numa goroutine:', 'go reservar("GATO-042")  // P1', 'go reservar("GATO-042")  // P2', '// vazão = min(N × 50, 500) pedidos/s', '// N = 2 → 100 pedidos/s'],
        story: 'Com dois pedidos em andamento, o segundo usa o núcleo enquanto o primeiro espera o banco. O núcleo nunca roda os dois ao mesmo tempo, mas agora trabalha 4 ms a cada 20. São 100 pedidos por segundo com a mesma CPU.',
        look: 'Duas casas da fita acendem, P1 e P2, uma depois da outra.',
        key: 'Concorrência: intercalar tarefas para aproveitar a espera de cada uma.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 2, 2, 18, 5);
          o.cnt = C3(['VAZÃO', '100 pedidos/s'], ['CPU OCUPADA', '20%'], ['PEDIDOS EM ANDAMENTO', '2']);
          o.res = [`${r.done} pedidos em ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} na CPU, ${r.wait} no banco` : `${r.wait} esperando o banco`];
          if (t > 1) T(o, SPOT.fB, 'P2 usa a CPU enquanto\nP1 espera o banco'); } },
      { id: 'dez', dur: 8, title: '10 pedidos: a CPU fecha cheia', yk: 'A CONTA',
        code: ['// vazão = min(N × 50, 500)', '// N = 10 → 10 × 50 = 500 pedidos/s', '// teto: 1 s ÷ 2 ms = 500/s', '// sempre 1 pedido no núcleo', '//   e 9 esperando o banco'],
        story: 'Com 10 pedidos em andamento, cada um usa o núcleo por 2 ms enquanto os outros 9 esperam o banco. As 10 casas de 2 ms ficam ocupadas: 100% de CPU e 10 × 50 = 500 pedidos por segundo. É o teto, porque 1 s ÷ 2 ms = 500.',
        look: 'As 10 casas da fita acendem, de P1 a P10; sempre há exatamente um pedido no núcleo.',
        key: 'Com espera longa e CPU curta, concorrência multiplica a vazão até a CPU encher.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 10, 2, 18, 5);
          o.cnt = C3(['VAZÃO', '500 pedidos/s'], ['CPU OCUPADA', '100%'], ['PEDIDOS EM ANDAMENTO', '10']);
          o.res = [`${r.done} pedidos em ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} na CPU, ${r.wait} no banco` : ''];
          if (t > 1) T(o, SPOT.fB, '10 de 10 casas: CPU cheia\n10 × 50 = 500/s'); } },
      { id: 'vinte', dur: 8, title: '20 pedidos: o teto continua 500/s', yk: 'A CONTA',
        code: ['// N = 20 → min(20 × 50, 500) = 500/s', '// o núcleo já estava cheio:', '//   metade espera a vez da CPU', '// tempo de cada pedido:', '//   20 ÷ 500/s = 40 ms (era 20 ms)'],
        story: 'Dobrar para 20 pedidos não dobra nada. O núcleo já estava cheio, então metade dos pedidos espera a vez da CPU. A vazão fica em 500 por segundo e cada pedido leva 40 ms em vez de 20 (20 pedidos ÷ 500/s).',
        look: 'Os pedidos que voltam do banco fazem fila na beira do núcleo; a fita continua com 10 de 10.',
        key: 'Depois que a CPU enche, mais concorrência só cria fila.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 20, 2, 18, 5);
          o.cnt = C3(['VAZÃO', '500 pedidos/s'], ['CPU OCUPADA', '100%'], ['NA FILA DA CPU', String(r.queue), r.queue ? 'bad' : '']);
          o.res = ['cada pedido: 40 ms (era 20)', `${r.queue} esperando a CPU, ${r.wait} no banco`];
          if (t > 1) T(o, SPOT.fB, 'fila na beira do núcleo:\n500/s, cada um em 40 ms', 'bad'); } },
      { id: 'cpu20', dur: 9, title: 'E se der errado: 20 ms de CPU por pedido', yk: 'A CONTA',
        code: ['// se reservar gastasse 20 ms de CPU', '//   (em vez de 2 ms):', '// teto: 1 s ÷ 20 ms = 50 pedidos/s', '// com N = 10: continua 50/s', '// concorrência só rende para quem espera'],
        story: 'Agora imagine que cada reservar gastasse 20 ms de CPU em vez de 2. O núcleo vira o gargalo: 1 s ÷ 20 ms = 50 pedidos por segundo. Com 10 pedidos em andamento, um usa a CPU e os outros fazem fila por ela. Mais concorrência não ajuda, porque não sobra espera para aproveitar.',
        look: 'Um pedido ocupa as 10 casas da fita sozinho; os outros esperam na beira do núcleo, em vermelho.',
        key: 'Concorrência só rende para quem espera; conta pesada precisa de mais núcleos.',
        f(o, t) { o.on.podA = 2; const r = oneCore(o, t, 10, 20, 18, 25); if (r.onCpu >= 0) o.on.coreW = 'bad';
          o.cnt = C3(['VAZÃO', '50 pedidos/s', 'bad'], ['CPU OCUPADA', '100%'], ['NA FILA DA CPU', String(r.queue), 'bad']);
          o.res = [`${r.done} pedidos em ${Math.round(r.tau)} ms`, r.onCpu >= 0 ? `P${r.onCpu + 1} ocupa a CPU por 20 ms` : ''];
          if (t > 1) T(o, SPOT.fB, '1 pedido enche a fita:\nteto de 50/s', 'bad'); } },
    ],
    'quatro-nucleos': [
      { id: 'sequencial', dur: 10.5, title: 'Num núcleo só: 42 s', yk: 'FECHAMENTO DAS 23:00',
        code: ['// relatorios, 1 thread:', 'linhas := lerItensDoDia()  // 400 mil', 'total := somar(linhas)     // 40 s de CPU', 'gravarResumo(total)        // 2 s', '// 1 núcleo trabalhando: 42 s'],
        story: 'Às 23:00 o relatorios fecha o dia: lê as 400 mil linhas de itens_pedido e soma tudo. Somar é conta pura, só CPU: 40 s num núcleo, mais 2 s para juntar e gravar o resumo. O pod tem 4 vCPU, mas uma thread só usa um núcleo por vez.',
        look: 'A fatia única de 400 mil linhas enche devagar no núcleo 1; os núcleos 2, 3 e 4 ficam apagados.',
        key: 'Uma thread usa um núcleo; os outros ficam parados.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; const s = clamp((t - 0.4) * 5, 0, 42), f = clamp(s / 40);
          o.rows.memR = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(1, [f]) };
          lit(o, rail(BC(0), 206, 356), '', s < 42 ? (t * 0.7) % 1 : null); for (let i = 1; i < 4; i++) quiet(o, rail(BC(i), 206, 356));
          if (s < 42) o.tok.push({ p: [BC(0), 340, PL], tone: 'acc' });
          o.on.c0 = s > 0 && s < 42 ? 1 : 2; o.rows.c0 = core(0, s < 40 ? 'somando' : s < 42 ? 'juntando · 2 s' : 'pronto', 'acc', `${Math.round(f * 400)} mil linhas`);
          for (let i = 1; i < 4; i++) o.rows['c' + i] = core(i, 'parado', 'dim');
          o.cnt = C3(['TEMPO', `${dec(s)} s`], ['NÚCLEOS EM USO', '1 de 4'], ['LINHAS SOMADAS', `${Math.round(f * 400)} mil de 400 mil`]);
          o.res = s >= 42 ? ['resumo gravado em 42 s'] : [];
          if (t > 1.5) T(o, SPOT.fB, '3 núcleos parados\nenquanto o 1 trabalha', 'bad'); } },
      { id: 'fatias', dur: 5.5, title: 'Em 4 fatias: 12 s', yk: 'NO CÓDIGO · relatorios',
        code: ['// 4 threads, uma fatia de 100 mil cada', 'for i := 0; i < 4; i++ {', '  go somar(fatia[i])  // 1 núcleo cada', '}', 'wg.Wait()           // 10 s, as 4 juntas', 'gravarResumo(juntar(parciais))  // 2 s'],
        story: 'Agora o relatorios parte as 400 mil linhas em 4 fatias de 100 mil, uma thread por fatia, cada uma no seu núcleo. As 4 terminam juntas em 10 s. Depois, 2 s para juntar as 4 somas e gravar: 12 s no total. 42 ÷ 12 = 3,5 vezes mais rápido.',
        look: 'As 4 fatias enchem ao mesmo tempo, uma em cada núcleo; no fim, só o núcleo 1 acende para juntar.',
        key: 'Paralelismo: partes do trabalho rodando ao mesmo tempo, em núcleos diferentes.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; const s = clamp((t - 0.4) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { const run = s > 0 && s < 10; if (run || (i === 0 && s < 12 && s > 0)) { lit(o, rail(BC(i), 206, 356), '', run ? (t * 0.8 + i * 0.2) % 1 : null); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 10 ? `fatia ${i + 1}` : i === 0 && s < 12 ? 'juntando · 2 s' : 'pronto', i === 0 || s < 10 ? 'acc' : 'dim', `${Math.round(f * 100)} mil linhas`); }
          const use = s > 0 && s < 10 ? 4 : s < 12 && s > 0 ? 1 : 0;
          o.cnt = C3(['TEMPO', `${dec(s)} s`], ['NÚCLEOS EM USO', `${use} de 4`], ['ACELERAÇÃO', s >= 12 ? '42 ÷ 12 = 3,5×' : '…']);
          o.res = s >= 12 ? ['resumo gravado em 12 s', 'antes: 42 s'] : [];
          if (s >= 10) T(o, SPOT.fB, 'os 2 s de juntar\nrodam num núcleo só', 'acc'); } },
      { id: 'amdahl', dur: 6.5, wide: true, title: 'Por que 3,5× e não 4×', yk: 'LEI DE AMDAHL',
        code: ['# parte serial: 2 ÷ 42 = 4,8%', '4 núcleos: 1 ÷ (0,048 + 0,952/4) = 3,5×', '8 núcleos: 1 ÷ (0,048 + 0,952/8) = 6,0×', '# 8 núcleos: 5 s + 2 s = 7 s', '# os 2 s de juntar não se dividem', '# teto com núcleos infinitos: 21×'],
        story: 'Os 2 s de juntar e gravar não se dividem: rodam num núcleo só, com 4 ou com 40. Essa parte serial é 2 de 42 s, 4,8%. Com 8 núcleos as fatias caem para 5 s, mas os 2 s ficam: 7 s, 6 vezes mais rápido, não 8. É a lei de Amdahl.',
        look: 'O pod cresce para 8 núcleos; as 8 fatias enchem em 5 s e o núcleo 1 fica sozinho nos 2 s finais.',
        key: 'A parte que não se divide limita o ganho de qualquer número de núcleos.',
        f(o, t) { o.show.podA = o.show.memR = 0; o.show.podW = o.show.memRW = 1; for (let i = 0; i < 8; i++) o.show['c' + i] = 1;
          o.rows.podW = pod('relatorios', 'exemplo: 8 vCPU'); o.on.podW = 2; o.on.memRW = 1;
          const s = clamp((t - 0.9) * 5, 0, 7), f = clamp(s / 5);
          o.rows.memRW = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(8, Array(8).fill(f)) };
          for (let i = 0; i < 8; i++) { const run = s > 0 && s < 5; if (run || (i === 0 && s > 0 && s < 7)) { lit(o, rail(BC(i), 206, 356), '', run ? (t * 0.8 + i * 0.1) % 1 : null); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 5 ? `fatia ${i + 1}` : i === 0 && s < 7 ? 'juntando · 2 s' : 'parado', i === 0 || s < 5 ? 'acc' : 'dim', `${Math.round(f * 50)} mil linhas`); }
          o.cnt = C3(['TEMPO', `${dec(s)} s`], ['NÚCLEOS', '8'], ['ACELERAÇÃO', s >= 7 ? '42 ÷ 7 = 6,0×' : '…']);
          o.res = s >= 7 ? ['8 núcleos: 6,0× (eficiência 75%)', '4 núcleos: 3,5× (88%)'] : [];
          if (s >= 5) T(o, SPOT.fB, 'nos 2 s finais, 7 núcleos\nficam parados', 'bad'); } },
      { id: 'umvcpu', dur: 10, title: 'E se der errado: 4 threads em 1 vCPU', yk: 'NO DEPLOY · relatorios',
        code: ['resources:', '  limits: { cpu: "1" }   # 1 vCPU', '# as mesmas 4 threads, 1 núcleo:', '# revezam, uma de cada vez', '# 4 × 10 s = 40 s + 2 s + trocas', '# ≈ 42 s: nenhum ganho'],
        story: 'Alguém sobe o relatorios num pod de 1 vCPU e mantém as 4 threads, esperando os mesmos 12 s. As 4 fatias revezam o único núcleo: 4 × 10 s continuam 40 s de CPU, mais os 2 s, mais o custo de trocar de thread. Threads sem núcleos livres não aceleram conta.',
        look: 'Os 4 trilhos descem para o núcleo 1; as fatias enchem em revezamento, cada uma a 1/4 da velocidade.',
        key: 'Paralelismo precisa de núcleos de verdade; threads sozinhas não bastam.',
        f(o, t) { for (let i = 1; i < 4; i++) o.show['c' + i] = 0; o.rows.podA = pod('relatorios', 'processo · 1 vCPU'); o.on.podA = 'bad'; o.on.memR = 1;
          const s = clamp((t - 0.4) * 5, 0, 42), f = clamp(s / 40), who = Math.floor(s * 2.5) % 4;
          o.rows.memR = { name: 'MEMÓRIA', meta: 'itens_pedido do dia', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { const pts = [[BC(i), 206, ZR], [BC(i), 300, ZR], [BC(0) + (i - 1.5) * 8, 300, ZR], [BC(0) + (i - 1.5) * 8, 356, ZR]];
            if (s < 40 && i === who) { lit(o, pts); o.tok.push({ p: [BC(0), 340, PL], tone: 'acc' }); } else { quiet(o, pts); if (s < 40) o.tok.push({ p: [BC(i), 260], tone: 'dim', s: 0.85 }); } }
          o.on.c0 = s > 0 && s < 42 ? 1 : 2; o.rows.c0 = core(0, s < 40 ? `fatia ${who + 1} · vez dela` : s < 42 ? 'juntando · 2 s' : 'pronto', 'acc', `${Math.round(f * 400)} mil de 400 mil`);
          o.cnt = C3(['TEMPO', `${dec(s)} s`, s > 12 ? 'bad' : ''], ['NÚCLEOS', '1 (limite do pod)'], ['ACELERAÇÃO', s >= 42 ? '1,0×: nenhuma' : '…', 'bad']);
          o.res = s > 12 ? [`${dec(s)} s e contando`, 'esperado: 12 s · real: 42 s + trocas'] : [];
          if (t > 2) T(o, SPOT.fB, '4 threads, 1 núcleo:\numa de cada vez', 'bad'); } },
    ],
    'interno-externo': [
      { id: 'interno', dur: 6, title: 'Paralelismo interno: 4 threads, 1 memória', yk: 'NO CÓDIGO · relatorios',
        code: ['// 1 processo, 4 threads', 'var parciais [4]int64   // memória comum', 'go somar(fatia[0], &parciais[0])', '...', 'go somar(fatia[3], &parciais[3])', '// as 4 escrevem no mesmo processo'],
        story: 'O fechamento das 23:00 do relatorios é paralelismo interno: 4 threads dentro de um processo, cada uma no seu núcleo, escrevendo na mesma memória. Coordenar é barato, porque todas veem as mesmas variáveis.',
        look: 'À esquerda, as 4 fatias do relatorios enchem juntas e cada trilho escreve a soma no mesmo bloco de memória.',
        key: 'Paralelismo interno: várias threads num processo, com memória compartilhada.',
        f(o, t) { o.on.podA = 2; o.on.memR = 1; o.on.podB1 = o.on.podB2 = 0;
          const s = clamp((t - 0.4) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMÓRIA', meta: 'compartilhada pelas 4', sl: slices(4, [f, f, f, f]) };
          for (let i = 0; i < 4; i++) { if (s < 10) { lit(o, rail(BC(i), 206, 356), '', 1 - (t * 0.8 + i * 0.2) % 1); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i, s < 10 ? `thread ${i + 1}` : 'pronto', 'acc', 'relatorios'); }
          o.rows.c4 = core(0, 'estoque-1', 'dim'); o.rows.c6 = core(0, 'estoque-2', 'dim');
          o.cnt = C3(['PROCESSOS', '1'], ['THREADS', '4'], ['MEMÓRIA', 'compartilhada']);
          o.res = s >= 10 ? ['4 somas parciais, 1 memória'] : [];
          if (t > 1.5) T(o, SPOT.fA, 'interno: 4 threads,\num processo, uma memória'); } },
      { id: 'externo', dur: 7, title: 'Paralelismo externo: 2 réplicas, 2 memórias', yk: 'NO LOAD BALANCER',
        code: ['# o LB do módulo 7 reparte as chamadas', 'Bia  (SP)  → estoque-1', 'Caio (Rio) → estoque-2', '# 2 processos, 2 pods, 2 memórias', '# o que os dois veem igual: o banco'],
        story: 'À direita, as duas réplicas do estoque também rodam ao mesmo tempo, mas em processos separados. O load balancer manda a Bia para o estoque-1 e o Caio para o estoque-2. Cada réplica tem a sua memória e nenhuma vê as variáveis da outra. Para combinar qualquer coisa, as duas dependem de algo de fora, como o banco.',
        look: 'A Bia entra no estoque-1 e o Caio no estoque-2; cada um acende a própria memória e o próprio núcleo.',
        key: 'Paralelismo externo: processos separados, que só se coordenam por fora.',
        f(o, t) { o.on.podA = 0; o.on.podB1 = o.on.podB2 = 2; o.rows.memR = { name: 'MEMÓRIA', meta: 'relatorios', sl: slices(4, [1, 1, 1, 1]) };
          for (let i = 0; i < 4; i++) { quiet(o, rail(BC(i), 206, 356)); o.rows['c' + i] = core(i, 'relatorios', 'dim'); }
          const xb = BC(4), xc = BC(6), pb = [[920, 342, ZR], [xb, 342, ZR], [xb, 214, ZR]], pc = [[920, 336, ZR], [xc, 336, ZR], [xc, 214, ZR]];
          const fb = clamp((t - 0.4) / 1.6), fc = clamp((t - 0.6) / 1.6);
          if (t > 0.4) { lit(o, pb); o.tok.push({ p: alongPts(pb, cumLen(pb), ease(fb)), tone: 'acc' }); }
          if (t > 0.6) { lit(o, pc); o.tok.push({ p: alongPts(pc, cumLen(pc), ease(fc)), tone: 'acc' }); }
          if (fb >= 1) { o.on.memB1 = 1; o.on.c4 = 1; o.rows.memB1 = mem('estoque-1', [['pedido da Bia', 'acc']]); lit(o, rail(xb, 214, 356)); }
          if (fc >= 1) { o.on.memB2 = 1; o.on.c6 = 1; o.rows.memB2 = mem('estoque-2', [['pedido do Caio', 'acc']]); lit(o, rail(xc, 214, 356)); }
          o.rows.c4 = core(0, fb >= 1 ? 'Bia' : 'estoque-1', fb >= 1 ? 'acc' : 'dim', 'estoque-1'); o.rows.c6 = core(0, fc >= 1 ? 'Caio' : 'estoque-2', fc >= 1 ? 'acc' : 'dim', 'estoque-2');
          if (t > 3) { lit(o, [[560, 158, ZR], [560, 118, ZR], [400, 118, ZR], [400, 108, ZR]], '', ((t - 3) * 0.6) % 1); lit(o, [[776, 158, ZR], [776, 114, ZR], [420, 114, ZR], [420, 108, ZR]], '', ((t - 3) * 0.6 + 0.5) % 1); o.on.db = 1; }
          o.cnt = C3(['PROCESSOS', '2'], ['MEMÓRIAS', '2, separadas'], ['COORDENAÇÃO', t > 3 ? 'pelo banco' : '…']);
          o.res = fc >= 1 ? ['Bia → estoque-1 · Caio → estoque-2'] : [];
          if (t > 2.2) T(o, [668, 452, 6], 'externo: 2 processos,\n2 memórias'); if (t > 3.4) T(o, SPOT.db, 'o que as duas veem igual'); } },
      { id: 'duas-vezes', dur: 8, title: 'E se der errado: o fechamento roda 2 vezes', yk: 'AGENDADOR · 23:00',
        code: ['# o relatorios ganhou a 2ª réplica', '# o agendador mora no código: roda nas 2', 'relatorios-1  23:00  fechamento → grava', 'relatorios-2  23:00  fechamento → grava', '# resumo do dia gravado 2 vezes', '# receita do dia dobrada'],
        story: 'O relatorios ganha uma segunda réplica. O agendador do fechamento das 23:00 mora no código, então roda nas duas. Cada réplica lê as 400 mil linhas, soma certo e grava o resumo. O dia fica com dois resumos e a receita aparece dobrada. Nenhuma réplica errou sozinha: faltou coordenação entre os processos.',
        look: 'O relatorios-2 sobe à direita; as duas réplicas gravam no banco e o resumo do dia aparece duas vezes, em vermelho.',
        key: 'Threads se coordenam pela memória; réplicas precisam de coordenação de fora.',
        f(o, t) { ['podB1', 'memB1', 'podB2', 'memB2', 'c6'].forEach(n => o.show[n] = 0); o.show.podB = o.show.memRB = 1; for (let i = 4; i < 8; i++) o.show['c' + i] = 1;
          o.rows.podA = pod('relatorios-1', 'réplica 1 · 4 vCPU'); o.rows.podB = pod('relatorios-2', 'réplica 2 · 4 vCPU'); o.on.podA = o.on.podB = 2;
          const s = clamp((t - 0.6) * 5, 0, 12), f = clamp(s / 10);
          o.rows.memR = { name: 'MEMÓRIA', meta: 'relatorios-1', sl: slices(4, [f, f, f, f]) }; o.rows.memRB = { name: 'MEMÓRIA', meta: 'relatorios-2', sl: slices(4, [f, f, f, f]) };
          o.on.memR = o.on.memRB = 1;
          for (let i = 0; i < 8; i++) { if (s > 0 && s < 10) { lit(o, rail(BC(i), 206, 356)); o.tok.push({ p: [BC(i), 340, PL], tone: 'acc' }); o.on['c' + i] = 1; } else quiet(o, rail(BC(i), 206, 356));
            o.rows['c' + i] = core(i % 4, s < 10 ? `fatia ${(i % 4) + 1}` : 'pronto', 'acc', i < 4 ? 'relatorios-1' : 'relatorios-2'); }
          const w1 = s >= 12 || t > 3.4, w2 = t > 4.2;
          if (t > 3) lit(o, [[236, 158, ZR], [236, 108, ZR]], '', clamp((t - 3) / 0.4));
          if (t > 3.8) lit(o, [[668, 158, ZR], [668, 118, ZR], [300, 118, ZR], [300, 108, ZR]], 'bad', clamp((t - 3.8) / 0.4));
          o.rows.db = dbRows([`resumo do dia: ${w2 ? 2 : w1 ? 1 : 0} linha${w2 ? 's' : ''}`, w2 ? 'bad' : w1 ? 'acc' : 'dim'], [w2 ? 'receita do dia: dobrada' : 'itens_pedido: 400 mil linhas', w2 ? 'bad' : 'dim']);
          if (w2) o.on.db = 'bad'; else if (w1) o.on.db = 1;
          o.cnt = C3(['FECHAMENTOS', t > 0.6 ? '2' : '0', 'bad'], ['RESUMOS GRAVADOS', w2 ? '2' : w1 ? '1' : '0', w2 ? 'bad' : ''], ['RECEITA NO RELATÓRIO', w2 ? 'dobrada' : '…', 'bad']);
          o.res = w2 ? ['resumo do dia gravado 2 vezes', 'faltou coordenar os processos'] : [];
          if (t > 1) T(o, SPOT.fB, 'a réplica 2 também\nroda o das 23:00', 'bad');
          if (t > 4.6) T(o, SPOT.db, '2 resumos do mesmo dia', 'bad'); } },
    ],
    spin: [
      { id: 'cas', dur: 6, title: 'Seção de 20 ns: girar vale a pena', yk: 'NO CÓDIGO · spinlock',
        code: ['for !atomic.CompareAndSwapInt32(&trava, 0, 1) {', '  // gira: pergunta de novo, sem dormir', '}', 'reservas_total++              // ≈ 20 ns', 'atomic.StoreInt32(&trava, 0)  // solta'],
        story: 'Um spinlock não dorme. Quem chega e acha a trava ocupada fica girando, perguntando "está livre?" com compare-and-swap. Para incrementar reservas_total, que leva uns 20 ns, isso compensa: dormir e ser acordado custa microssegundos, bem mais do que a espera.',
        look: 'A goroutine 1 pega a trava e solta num piscar; a 2 gira um instante no núcleo dela e entra logo depois.',
        key: 'Spinlock: esperar girando; só compensa quando a seção crítica é mais curta que dormir e acordar.',
        f(o, t) { o.on.podW = 2; const cyc = (t * 0.7) % 1, own = cyc < 0.5 ? 0 : 1;
          o.rows.lock = { name: 'TRAVA', meta: `ocupada · g${own + 1}`, rows: [['reservas_total++ · ≈ 20 ns', 'acc']] }; o.on.lock = 1;
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356);
            if (i < 2) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc', spin: i !== own && (cyc % 0.5) < 0.12 }); o.on['c' + i] = 1; o.rows['c' + i] = core(i, i === own ? 'g' + (i + 1) + ': trava' : 'g' + (i + 1) + ': gira', 'acc', i === own ? '20 ns' : 'por ns'); }
            else { quiet(o, pts); o.rows['c' + i] = core(i, 'livre', 'dim'); } }
          o.cnt = C3(['SEÇÃO CRÍTICA', '≈ 20 ns'], ['DORMIR E ACORDAR', 'microssegundos'], ['CPU GASTA GIRANDO', 'quase nada']);
          o.res = ['g1 e g2 se revezam na trava', 'cada uma espera nanossegundos'];
          if (t > 1.2) T(o, SPOT.fA, 'gira poucos ns:\nmais barato que dormir'); } },
      { id: 'mutex', dur: 7, title: 'Em volta do reservar, o mutex dorme', yk: 'NO CÓDIGO · sync.Mutex',
        code: ['mu.Lock()                 // ocupada? dorme', 'defer mu.Unlock()', 'q := lerQuantidade(sku)   // banco', 'baixar(sku)               // banco', '// seção crítica: 5 ms', '// quem espera não gasta CPU'],
        story: 'O reservar é outra história: segura a trava por 5 ms, quase tudo esperando o banco. Com sync.Mutex, a goroutine 1 entra e as outras 7 dormem até a trava abrir. Dormindo, não usam CPU, e os núcleos 2 a 8 ficam livres para outro trabalho. O mutex do Go até gira um pouquinho antes de dormir, mas não por 5 ms.',
        look: 'A goroutine 1 fica no núcleo 1; as outras 7 recuam nos trilhos e apagam; os núcleos 2 a 8 ficam livres.',
        key: 'Mutex põe quem espera para dormir: espera longa não queima CPU.',
        f(o, t) { o.on.podW = 2; o.on.lock = 1; o.rows.lock = { name: 'TRAVA', meta: 'sync.Mutex · dono g1', rows: [['reservar · 5 ms de banco', 'acc']] };
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356), back = clamp((t - 0.6) / 1.2);
            if (i === 0) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc' }); o.on.c0 = 1; o.rows.c0 = core(0, 'g1: reservar', 'acc', '5 ms'); }
            else { quiet(o, pts); o.tok.push({ p: [x, lerp(340, 222, ease(back))], tone: back > 0.5 ? 'dim' : 'acc' }); o.rows['c' + i] = core(i, back >= 1 ? 'livre' : 'g' + (i + 1), 'dim', back >= 1 ? 'g' + (i + 1) + ' dorme' : ''); } }
          o.cnt = C3(['SEÇÃO CRÍTICA', '5 ms'], ['GOROUTINES DORMINDO', t > 1.8 ? '7' : '…'], ['CPU QUEIMADA ESPERANDO', '0%']);
          o.res = t > 1.8 ? ['7 goroutines dormindo', 'núcleos 2 a 8 livres'] : [];
          if (t > 2) T(o, SPOT.fB, '7 dormem: os núcleos\nficam livres', 'acc'); } },
      { id: 'gira', dur: 7, title: 'E se der errado: spinlock em volta do reservar', yk: 'NO CÓDIGO · spinlock',
        code: ['for !atomic.CompareAndSwapInt32(&trava, 0, 1) {}', 'q := lerQuantidade(sku)   // 5 ms de banco', 'baixar(sku)', 'atomic.StoreInt32(&trava, 0)', '// 7 goroutines girando por 5 ms', '// 7 de 8 núcleos = 87,5% queimados'],
        story: 'Troque o mutex por um spinlock em volta do mesmo reservar. A goroutine 1 segura a trava por 5 ms e as outras 7 giram, cada uma num núcleo, perguntando sem parar. São 7 de 8 núcleos, 87,5% da CPU do nó, queimados sem fazer nada útil.',
        look: 'As 7 goroutines giram nos núcleos 2 a 8, em vermelho; o contador de CPU queimada sobe a 87,5%.',
        key: 'Spinlock em seção longa transforma espera em CPU desperdiçada.',
        f(o, t) { o.on.podW = 2; o.on.lock = 1; o.rows.lock = { name: 'TRAVA', meta: 'spinlock · dono g1', rows: [['reservar · 5 ms de banco', 'bad']] };
          const n = Math.min(7, Math.max(0, Math.floor((t - 0.4) / 0.25)));
          for (let i = 0; i < 8; i++) { const x = BC(i), pts = rail(x, 200, 356);
            if (i === 0) { lit(o, pts); o.tok.push({ p: [x, 340, PL], tone: 'acc' }); o.on.c0 = 1; o.rows.c0 = core(0, 'g1: reservar', 'acc', '5 ms'); }
            else if (i <= n) { o.beams.push({ pts, on: true, tone: 'bad' }); o.tok.push({ p: [x, 340, PL], tone: 'bad', spin: true }); o.on['c' + i] = 'bad'; o.rows['c' + i] = core(i, 'g' + (i + 1) + ': girando', 'bad', 'CAS sem parar'); }
            else { quiet(o, pts); o.tok.push({ p: [x, 222], tone: 'dim' }); } }
          o.cnt = C3(['CPU QUEIMADA', `${dec(n / 8 * 100)}%`, 'bad'], ['GIRANDO', `${n} goroutines`, 'bad'], ['SEÇÃO CRÍTICA', '5 ms']);
          o.res = n >= 7 ? ['7 de 8 núcleos girando', '87,5% da CPU sem trabalho útil'] : [];
          if (t > 2.5) T(o, SPOT.fB, '7 de 8 núcleos = 87,5%\nqueimados esperando', 'bad'); } },
      { id: 'um', dur: 8.5, title: 'Num pod de 1 vCPU é pior', yk: 'NO CÓDIGO · lab spinlock/main.go',
        code: ['for !atomic.CompareAndSwapInt32(&l.state, 0, 1) {', '  runtime.Gosched()  // cede a vez', '}', '# sem o Gosched, quem gira ocupa o núcleo', '#   e o dono não roda para soltar'],
        story: 'Num pod de 1 vCPU, quem gira ocupa o único núcleo. A goroutine 1, que tem a trava, precisa da CPU para terminar e soltar, e fica esperando a vez. O spinlock do lab chama runtime.Gosched() a cada volta para ceder o núcleo; por isso funciona, mas já não é um spinlock puro. E a ordem de chegada não vale: no log do lab, o amigo 6 foi servido por último.',
        look: 'Só o núcleo 1 sobra; a goroutine 2 gira nele e a 1, dona da trava, espera do lado, em vermelho. Com o Gosched, a 2 cede e a 1 solta.',
        key: 'Spinlock só faz sentido com núcleo sobrando e seção curtíssima.',
        f(o, t) { for (let i = 1; i < 8; i++) o.show['c' + i] = 0; o.rows.podW = pod('estoque', 'pod de 1 vCPU'); o.on.podW = 'bad'; o.on.lock = 1;
          const yield_ = t > 4.4;
          o.rows.lock = { name: 'TRAVA', meta: yield_ && t > 5.6 ? 'livre' : 'dono g1', rows: [[yield_ ? 'g2 chamou Gosched: cedeu' : 'g1 não consegue rodar', yield_ ? 'acc' : 'bad']] };
          const x0 = BC(0);
          for (let i = 0; i < 8; i++) { const pts = [[BC(i), 200, ZR], [BC(i), 300, ZR], [x0 + (i - 3.5) * 6, 300, ZR], [x0 + (i - 3.5) * 6, 356, ZR]];
            if (i === 1 && !yield_) { o.beams.push({ pts, on: true, tone: 'bad' }); o.tok.push({ p: [x0, 340, PL], tone: 'bad', spin: true }); }
            else if (i === 0) { if (yield_) { lit(o, pts); o.tok.push({ p: [x0, 340, PL], tone: 'acc' }); } else { quiet(o, pts); o.tok.push({ p: [BC(0) + 30, 296], tone: 'bad' }); } }
            else { quiet(o, pts); if (i < 8) o.tok.push({ p: [BC(i), 240], tone: 'dim', s: 0.85 }); } }
          o.on.c0 = yield_ ? 1 : 'bad'; o.rows.c0 = core(0, yield_ ? 'g1: termina e solta' : 'g2: girando', yield_ ? 'acc' : 'bad', yield_ ? 'graças ao Gosched' : 'g1 sem CPU');
          o.cnt = C3(['NÚCLEOS', '1'], ['NA CPU', yield_ ? 'g1, dona da trava' : 'g2, girando', yield_ ? '' : 'bad'], ['DONO DA TRAVA', yield_ ? 'roda e solta' : 'esperando a CPU', yield_ ? '' : 'bad']);
          o.res = yield_ ? ['lab: 10 amigos × 1 s = 10 s', 'ordem: 10 3 5 1 9 2 8 7 4 6'] : ['g2 gira no único núcleo', 'g1 tem a trava e não roda'];
          if (t > 1) T(o, SPOT.fA, yield_ ? 'Gosched: g2 cede a vez' : 'g1 tem a trava,\nmas não tem CPU', yield_ ? 'acc' : 'bad'); } },
    ],
    pool: [
      { id: 'vagas', dur: 6, title: 'Um semáforo de 10 vagas', yk: 'NO CÓDIGO · estoque (Go)',
        code: ['sem := make(chan struct{}, 10)  // 10 vagas', 'sem <- struct{}{}         // pega uma (ou espera)', 'defer func() { <-sem }()  // devolve', 'q := lerQuantidade(sku)   // usa 1 conexão', '// no máximo 10 conexões com o banco'],
        story: 'O estoque-1 conversa com o PostgreSQL por um pool de 10 conexões. Quem controla é um semáforo contador: 10 vagas; cada chamada pega uma antes de ir ao banco e devolve ao terminar. Chegam 10 pedidos e os 10 entram.',
        look: 'As 10 vagas do SEMÁFORO acendem e 10 conexões ligam o pod ao banco: 10 casas de 100 no PostgreSQL.',
        key: 'Semáforo: N vagas; quem chega com tudo ocupado espera.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan de 10', 'acc'], ['variáveis (heap)', 'dim'], ['código do estoque', 'dim']]);
          const n = Math.min(10, Math.max(0, Math.floor((t - 0.3) / 0.2) + 1));
          o.rows.sem = { name: 'SEMÁFORO', meta: '10 vagas', cells: Array.from({ length: 10 }, (_, i) => i < n ? i + 1 : 0) };
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (k < n) lit(o, pts, '', ((t * 0.9 + k * 0.1) % 1)); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: n, bad: 0, max: 100 } }; if (n) o.on.db = 1;
          o.cnt = C3(['VAGAS OCUPADAS', `${n} de 10`], ['CONEXÕES NO BANCO', `${n} de 100`], ['NA FILA', '0']);
          o.res = n >= 10 ? ['10 pedidos · 10 conexões'] : [];
          if (t > 2.4) T(o, SPOT.db, '10 de 100 conexões'); } },
      { id: 'espera', dur: 7, title: 'O 11º pedido espera uma vaga', yk: 'NO CÓDIGO · estoque (Go)',
        code: ['// 11ª chamada, com as 10 vagas ocupadas:', 'sem <- struct{}{}   // canal cheio: bloqueia', '// 20 ms depois, o pedido 1 termina:', '<-sem               // devolve a vaga', '// o 11º entra; o banco segue com 10'],
        story: 'Chega o 11º pedido com as 10 vagas ocupadas. Ele não abre uma conexão nova: espera na fila. Em 20 ms o pedido 1 termina, devolve a vaga e o 11º entra. O banco continua vendo 10 conexões.',
        look: 'O pedido 11 para na FILA; quando a vaga 1 apaga, ele sobe e ocupa o lugar.',
        key: 'O semáforo segura o excesso na fila do app, longe do banco.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan de 10', 'acc'], ['variáveis (heap)', 'dim'], ['código do estoque', 'dim']]);
          const ms = clamp((t - 0.5) / 3.5) * 20, freed = ms >= 20, inn = t > 4.6;
          const cells = Array.from({ length: 10 }, (_, i) => i + 1); if (freed) cells[0] = inn ? 11 : 0;
          o.rows.sem = { name: 'SEMÁFORO', meta: freed && !inn ? '1 vaga livre' : '10 vagas', cells };
          o.rows.fila = { name: 'FILA', n: inn ? 0 : t > 0.5 ? 1 : 0, of: 1 }; o.on.fila = t > 0.5 && !inn ? 1 : 0;
          if (t > 0.5 && !inn) o.tok.push({ p: freed ? [lerp(300, 208, clamp((t - 4) / 0.6)), lerp(290, 200, clamp((t - 4) / 0.6))] : [300, 290], tone: 'acc' });
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (cells[k]) lit(o, pts, '', ((t * 0.9 + k * 0.1) % 1)); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: freed && !inn ? 9 : 10, bad: 0, max: 100 } }; o.on.db = 1;
          o.cnt = C3(['NA FILA', inn ? '0' : t > 0.5 ? '1' : '0'], ['TEMPO', `${Math.round(ms)} ms`], ['CONEXÕES NO BANCO', `${freed && !inn ? 9 : 10} de 100`]);
          o.res = inn ? ['o 11º entrou na vaga 1', 'o banco nunca passou de 10'] : freed ? ['pedido 1 terminou: vaga livre'] : t > 0.5 ? ['pedido 11 esperando'] : [];
          if (t > 0.8 && !inn) T(o, [318, 452, 6], 'pedido 11: sem vaga,\nespera na fila', 'acc'); } },
      { id: 'lotes', dur: 10, title: '200 pedidos de uma vez: 20 lotes', yk: 'A CONTA · Little',
        code: ['# Black Friday: 200 pedidos por réplica', 'lotes = 200 ÷ 10 vagas = 20', 'último = 20 × 20 ms = 400 ms', 'média = 20 ms × (1+2+…+20) ÷ 20 = 210 ms', 'vazão = 10 ÷ 20 ms = 500/s', 'Little: 500/s × 20 ms = 10 conexões'],
        story: 'Na Black Friday chegam 200 pedidos ao mesmo tempo na réplica. As 10 vagas atendem em lotes de 10: o primeiro lote termina em 20 ms e o último, o 20º, em 400 ms. Em média, um pedido leva 210 ms. A vazão fica em 500 por segundo, e a conta de Little fecha: 500/s × 20 ms = 10 conexões.',
        look: 'A FILA desce de 190 a 0 em degraus de 10, a cada 20 ms; o relógio para em 400 ms.',
        key: 'Lei de Little: conexões necessárias = vazão × tempo de cada consulta.',
        f(o, t) { o.on.podA = 2; o.on.sem = 1; o.rows.memA = mem('estoque-1', [['sem: chan de 10', 'acc'], ['variáveis (heap)', 'dim'], ['código do estoque', 'dim']]);
          const ms = clamp((t - 0.5) * 50, 0, 400), lote = Math.min(20, Math.floor(ms / 20) + 1), done = Math.min(200, Math.floor(ms / 20) * 10), fila = Math.max(0, 200 - done - 10);
          const end = ms >= 400;
          o.rows.sem = { name: 'SEMÁFORO', meta: end ? '10 vagas' : `lote ${lote} de 20`, cells: Array.from({ length: 10 }, (_, i) => end ? 0 : (lote - 1) * 10 + i + 1) };
          o.rows.fila = { name: 'FILA', n: end ? 0 : fila, of: 190 }; o.on.fila = fila ? 1 : 0;
          for (let k = 0; k < 10; k++) { const x = 208 + k * 24, pts = [[x, 158, ZR + 10], [x, 108, ZR + 10]]; if (!end) lit(o, pts, '', (ms % 20) / 20); else quiet(o, pts); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: end ? 0 : 10, bad: 0, max: 100 } }; o.on.db = end ? 0 : 1;
          o.cnt = C3(['TEMPO', `${Math.round(ms)} ms`], ['PRONTOS', `${done} de 200`], ['NA FILA', String(end ? 0 : fila)]);
          o.res = end ? ['último em 400 ms · média 210 ms', 'vazão: 500 pedidos/s'] : [`lote ${lote} de 20 no banco`];
          if (end) T(o, SPOT.fA, '20 lotes × 20 ms = 400 ms\nmédia: 210 ms'); } },
      { id: 'sem-pool', dur: 7.5, title: 'E se der errado: sem pool, 200 conexões', yk: 'NO LOG · PostgreSQL',
        code: ['# sem semáforo: cada pedido abre a sua', '200 conexões > max_connections = 100', 'FATAL:  sorry, too many clients already', '# 100 pedidos levam erro na hora'],
        story: 'Sem o semáforo, cada um dos 200 pedidos abre a sua conexão. O PostgreSQL aceita no máximo 100 (o padrão de max_connections). As primeiras 100 entram; as outras 100 levam FATAL: sorry, too many clients already. O pool não deixava isso acontecer: segurava o excesso na fila.',
        look: 'O semáforo some; as 100 casas do banco enchem e o contador de recusadas sobe a 100, em vermelho.',
        key: 'Sem limite do lado do app, o limite do banco vira erro para o cliente.',
        f(o, t) { o.on.podA = 'bad'; o.show.sem = o.show.fila = 0; o.rows.memA = mem('estoque-1', [['sem pool: 1 conexão', 'bad'], ['por pedido', 'bad'], ['código do estoque', 'dim']]);
          const n = Math.round(clamp((t - 0.4) / 3) * 200), ok = Math.min(100, n), bad = Math.max(0, n - 100);
          for (let k = 0; k < 20; k++) { const x = 200 + k * 12, pts = [[x, 316, ZR], [x, 108, ZR]]; if (k * 10 < n) o.beams.push({ pts, on: true, tone: k >= 10 ? 'bad' : '' }); }
          o.rows.db = { ...dbRows(), meta: 'max_connections = 100', grid: { used: ok, bad, max: 100 } }; o.on.db = bad ? 'bad' : 1;
          o.cnt = C3(['CONEXÕES PEDIDAS', String(n)], ['ACEITAS', `${ok} de 100`], ['RECUSADAS', String(bad), bad ? 'bad' : '']);
          o.res = bad ? ['FATAL: sorry, too many clients already', `${bad} pedidos com erro`] : [];
          if (bad) T(o, SPOT.db, 'too many clients already', 'bad'); } },
    ],
    conexoes: [
      { id: 'uma', dur: 5, title: '1 réplica × 10 conexões', yk: 'A CONTA',
        code: ['# cada réplica do estoque: pool de 10', 'conexões = réplicas × pool', '1 × 10 = 10', 'max_connections = 100 (padrão)'],
        story: 'O pool de 10 resolve uma réplica. Mas o banco é um só para todas as réplicas do estoque. Com uma réplica, são 10 das 100 conexões que o PostgreSQL aceita.',
        look: 'Uma réplica acende e 10 das 100 casas do banco.',
        key: 'O limite do banco é dividido entre todas as réplicas.',
        f(o, t) { reps(o, t, 1, 10); o.cnt = C3(['RÉPLICAS', '1'], ['CONEXÕES', '10 de 100'], ['SOBRA', '90']); o.res = ['1 × 10 = 10'];
          if (t > 1) T(o, SPOT.db, '10 de 100'); } },
      { id: 'hpa', dur: 8, title: 'O HPA sobe até 10 réplicas', yk: 'NO CLUSTER',
        code: ['# CPU alta → o HPA cria réplicas', '$ kubectl get hpa estoque', 'NAME      MINPODS  MAXPODS  REPLICAS', 'estoque   1        12       10', '# 10 × 10 = 100 = max_connections'],
        story: 'A Black Friday aperta e o HPA escala o estoque, réplica por réplica, cada uma com o seu pool de 10. Com 10 réplicas, são exatamente 100 conexões. Cabe, mas sem folga nenhuma.',
        look: 'As réplicas sobem uma a uma; as casas do banco enchem até 100 de 100.',
        key: 'Cada réplica nova traz o pool inteiro junto.',
        f(o, t) { const n = Math.min(10, 1 + Math.floor(clamp((t - 0.4) / 4.5) * 9.999)); reps(o, t, n, 10);
          o.cnt = C3(['RÉPLICAS', String(n)], ['CONEXÕES', `${n * 10} de 100`], ['SOBRA', String(100 - n * 10), n >= 10 ? 'bad' : '']);
          o.res = [`${n} × 10 = ${n * 10}`]; if (n >= 10) T(o, SPOT.db, '100 de 100: cheio', 'acc'); } },
      { id: 'estoura', dur: 7, title: 'E se der errado: 12 réplicas, 120 conexões', yk: 'NO LOG · PostgreSQL',
        code: ['12 × 10 = 120 > max_connections = 100', 'FATAL:  sorry, too many clients already', '# estoque-11 e estoque-12 sem conexão', '# escalar mais réplicas só piora'],
        story: 'O HPA continua e sobe para 12 réplicas: 12 × 10 = 120 conexões, e o banco aceita 100. As réplicas 11 e 12 não conseguem conexão e cada reserva delas falha com too many clients. Escalar o estoque, aqui, só aumenta o erro.',
        look: 'As réplicas 11 e 12 sobem em vermelho; o banco cheio recusa as 20 conexões delas.',
        key: 'Réplicas × pool precisa caber no max_connections do banco.',
        f(o, t) { const n = t > 1.6 ? 12 : t > 0.8 ? 11 : 10; reps(o, t, n, 10);
          o.cnt = C3(['RÉPLICAS', String(n)], ['CONEXÕES PEDIDAS', `${n * 10}`, n > 10 ? 'bad' : ''], ['RECUSADAS', String(Math.max(0, n * 10 - 100)), n > 10 ? 'bad' : '']);
          o.res = n > 10 ? ['FATAL: sorry, too many clients already', `${n * 10} > 100`] : [];
          if (n > 10) T(o, [340, 290, 50], 'sem conexão:\ntoo many clients', 'bad'); } },
      { id: 'conserto', dur: 6, title: 'A conta que fecha: 12 × 8 = 96', yk: 'TRÊS SAÍDAS',
        code: ['# 1. pool menor em cada réplica', '12 × 8 = 96 ≤ 100', '# 2. PgBouncer na frente do banco', '#    (muitas conexões de app, poucas no banco)', '# 3. subir max_connections', '#    (cada conexão custa memória no banco)'],
        story: 'Três saídas. Diminuir o pool de cada réplica para 8: 12 × 8 = 96, cabe. Pôr um pooler como o PgBouncer entre as réplicas e o banco, que junta muitas conexões de app em poucas no banco. Ou subir max_connections, pagando memória no banco por conexão.',
        look: 'Cada réplica fica com pool de 8; 96 casas acesas e 4 sobrando no banco.',
        key: 'Some os pools de todas as réplicas antes de deixar o HPA escalar.',
        f(o, t) { reps(o, t, 12, t > 0.8 ? 8 : 10);
          o.cnt = C3(['RÉPLICAS', '12'], ['CONEXÕES', t > 0.8 ? '96 de 100' : '120', t > 0.8 ? '' : 'bad'], ['SOBRA', t > 0.8 ? '4' : '—']);
          o.res = t > 0.8 ? ['12 × 8 = 96 ≤ 100', 'todas as réplicas conectadas'] : [];
          if (t > 1.4) T(o, SPOT.db, '96 de 100: cabe'); } },
    ],
  };
  // réplicas do estoque, cada uma com o seu pool; o banco recusa o que passa de 100
  function reps(o, t, n, per) {
    let used = 0, bad = 0;
    for (let i = 0; i < 16; i++) { const on = i < n; o.show['r' + i] = on ? 1 : 0; if (!on) continue;
      const fits = used + per <= 100; if (fits) used += per; else bad += per;
      o.on['r' + i] = fits ? 1 : 'bad'; o.rows['r' + i] = { name: `estoque-${i + 1}`, meta: `pool ${per}`, rows: [[fits ? `${per} conexões` : 'sem conexão', fits ? 'acc' : 'bad']] };
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
      x.textAlign = 'left'; x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText('0 ms', u(5), u(56)); x.textAlign = 'center'; x.fillText('10 casas de 2 ms', u(W_ / 2), u(56)); x.textAlign = 'right'; x.fillText('20 ms', u(W_ - 5), u(56)); x.textAlign = 'left';
      x.fillStyle = INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText('— : núcleo parado', u(5), u(66)); }
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
        if (bad) { x.textAlign = 'right'; x.fillStyle = BAD(); fitFont(x, u, `+${bad} recusadas`, 10, 120); x.fillText(`+${bad} recusadas`, u(W_ * 0.62), u(8.5)); x.textAlign = 'left'; } }
      else { let y = 26; for (const [text, tn] of d.rows) { x.fillStyle = toneC(tn); fitFont(x, u, text, 10.5, W_ - 10); x.fillText(text, u(5), u(y)); y += 16; } } }
    else if (k === 'sem') { head(x, u, d, W_, col, 10.5);
      const n = d.cells.length, sw = (W_ - 10) / n, y0 = 19, hh = H_ - y0 - 5;
      d.cells.forEach((c, i) => { const X = 5 + i * sw; x.fillStyle = c ? (theme === 'light' ? '#f1dcc4' : '#3a2512') : (theme === 'light' ? '#ebebea' : '#17181a'); x.fillRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.strokeStyle = c ? accC() : C.line; x.lineWidth = u(c ? 0.9 : 0.5); x.strokeRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.textAlign = 'center'; x.fillStyle = c ? accC() : INK(); const lab = c ? String(c) : 'livre'; fitFont(x, u, lab, c > 99 ? 8 : 10, sw - 3); x.fillText(lab, u(X + sw / 2), u(y0 + hh / 2)); x.textAlign = 'left'; }); }
    else if (k === 'fila') { head(x, u, { name: d.name, meta: 'quem espera uma vaga' }, W_, col, 10.5);
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
    lbl(s.yk || 'NO CÓDIGO', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /FATAL|panic|exit|recus|sem conexão|2 vezes|não /.test(l) ? BAD() : acc; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    processo: () => `<li>Goroutine: pilha inicial de ~<b>2 KB</b>; thread do sistema: <b>8 MB</b> reservados por padrão (<b>ulimit -s</b>)</li><li>200 pedidos: <b>200 × 2 KB = 400 KB</b> em goroutines; <b>200 × 8 MB = 1,6 GB</b> de endereço virtual em threads</li><li>estoque-1 e estoque-2: <b>1 vCPU</b> cada; 2 processos, 2 memórias; a 2ª réplica sobe às <b>14:02</b></li><li>panic sem recover numa goroutine: o processo inteiro sai com <b>exit status 2</b></li>`,
    'um-nucleo': () => `<li>reservar: <b>2 ms de CPU + 18 ms</b> esperando o banco = <b>20 ms</b></li><li>vazão = <b>min(N × 50, 500)</b> pedidos/s; teto = 1 s ÷ 2 ms = <b>500/s</b></li><table class="h3-sum"><tr><th>N</th><th>CPU</th><th>vazão</th></tr><tr><td>1</td><td>10%</td><td>50/s</td></tr><tr><td>2</td><td>20%</td><td>100/s</td></tr><tr class="on"><td>10</td><td>100%</td><td>500/s</td></tr><tr><td>20</td><td>100%</td><td>500/s (40 ms cada)</td></tr><tr><td>10, com 20 ms de CPU</td><td>100%</td><td>50/s</td></tr></table>`,
    'quatro-nucleos': () => `<li>Fechamento das 23:00: <b>400 mil</b> linhas de itens_pedido; <b>40 s</b> de CPU + <b>2 s</b> para juntar e gravar</li><table class="h3-sum"><tr><th>núcleos</th><th>tempo</th><th>aceleração</th></tr><tr><td>1</td><td>40 + 2 = 42 s</td><td>1×</td></tr><tr class="on"><td>4</td><td>10 + 2 = 12 s</td><td>3,5× (88%)</td></tr><tr><td>8</td><td>5 + 2 = 7 s</td><td>6,0× (75%)</td></tr><tr><td>4 threads em 1 vCPU</td><td>≈ 42 s + trocas</td><td>nenhuma</td></tr></table><li>Amdahl: 1 ÷ (s + (1 − s) ÷ n), com s = 2/42 = <b>4,8%</b>; teto = 1 ÷ s = <b>21×</b></li><li class="h3-dim">O churrasco do lab usa time.Sleep, que não gasta CPU: mostra espera sobreposta, não paralelismo de CPU.</li>`,
    'interno-externo': () => `<table class="h3-sum"><tr><th></th><th>interno</th><th>externo</th></tr><tr><td>exemplo</td><td>relatorios: 4 threads</td><td>estoque-1 e estoque-2</td></tr><tr><td>processos</td><td>1</td><td>2 (2 pods)</td></tr><tr><td>memória</td><td>compartilhada</td><td>uma por processo</td></tr><tr class="on"><td>coordenação</td><td>pela memória</td><td>por fora (banco, lock distribuído)</td></tr></table><li>Bia (SP) → estoque-1 · Caio (Rio) → estoque-2, pelo LB do módulo 7</li><li>2 réplicas do relatorios, agendador nas duas: resumo das 23:00 gravado <b>2 vezes</b></li>`,
    spin: () => `<li>Seção de <b>≈ 20 ns</b> (reservas_total++): girar custa menos que dormir e acordar (microssegundos)</li><li>Seção de <b>5 ms</b> (reservar): 7 goroutines girando em 7 de 8 núcleos = <b>87,5%</b> da CPU do nó queimada</li><li>sync.Mutex: gira um pouco e dorme; se alguém espera mais de <b>1 ms</b>, entra em starvation mode e passa a servir em ordem</li><li>Lab (spinlock/main.go): CAS + <b>runtime.Gosched()</b> a cada volta; 10 amigos × 1 s = <b>10 s</b>; ordem de entrada 10, 3, 5, 1, 9, 2, 8, 7, 4, <b>6</b></li>`,
    pool: () => `<li>Semáforo de <b>10</b> vagas: <b>make(chan struct{}, 10)</b></li><li>Little: <b>500/s × 20 ms = 10</b> conexões</li><li>200 pedidos, 10 vagas, 20 ms: <b>20 lotes</b>; último em <b>400 ms</b>; média <b>210 ms</b>; vazão <b>500/s</b></li><li>Sem pool: 200 conexões &gt; max_connections <b>100</b> → <b>FATAL: sorry, too many clients already</b></li><li class="h3-dim">O semáforo do lab cria uma goroutine por tarefa e só limita quantas rodam (3 vagas, 10 tarefas de 2 s: 4 ondas = 8 s). Um worker pool tem workers fixos lendo de uma fila.</li>`,
    conexoes: () => `<table class="h3-sum"><tr><th>réplicas</th><th>pool</th><th>conexões</th></tr><tr><td>1</td><td>10</td><td>10 de 100</td></tr><tr><td>10</td><td>10</td><td>100 de 100</td></tr><tr><td>12</td><td>10</td><td><b>120: 20 recusadas</b></td></tr><tr class="on"><td>12</td><td>8</td><td>96 de 100</td></tr></table><li>Saídas: pool menor por réplica, um pooler (PgBouncer) ou subir max_connections (custa memória no banco)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="t3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'No código')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'threads') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
