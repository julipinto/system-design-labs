// Figura 3D (iso-glow): o teste de carga do checkout. O gerador (k6), à esquerda, solta os pedidos (pontos de luz) na cadeia
// pedidos → pagamentos → estoque → banco (o anel de shards: shard-0, shard-1, shard-2 e o dedicado do mkt-01 no "plano 2").
// Cada bloco mostra os pods, a capacidade nominal e a carga; o que não cabe vira pilha de 504 na frente do elo.
// Atrás, o mostrador: à esquerda o resumo do k6 (http_reqs, avg, p95, p99, http_req_failed, dropped_iterations, exit) ou o
// contador da janela ao vivo; à direita o gráfico (p95 contra a meta de 800 ms em cima; taxa oferecida, goodput e erros embaixo).
// Cenários (toggle e ?mode=perfis|modelo|smoke|media|estresse|spike|breakpoint|jornada|pre|relatorio; ?step=N abre no passo N).
// Dados: o lab k6 real do módulo (public/labs/testes-de-carga/lab/: resultados-k6.txt e os *.txt de cada rodada) e a história
// canônica (docs/escrita/testes-de-carga-brief.md). As janelas de 10 s, os resumos e os códigos de saída são os medidos.
FIGS3D.push({ id: 'carga', name: 'Load testing', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  const pc = u => Math.round(u * 100) + '%';
  const ms = v => v >= 2000 ? '2 s' : thou(v) + ' ms';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['perfis', 'modelo', 'smoke', 'media', 'estresse', 'spike', 'breakpoint', 'jornada', 'pre', 'relatorio'];
  const SCNAME = { perfis: 'Profiles', modelo: 'Model', smoke: 'Smoke', media: 'Average', estresse: 'Stress', spike: 'Spike', breakpoint: 'Breakpoint', jornada: 'Journey', pre: 'Pre-test', relatorio: 'Report' };
  const SCFULL = { perfis: 'The load shapes', modelo: 'Open vs. closed model', smoke: 'The smoke', media: 'The average load', estresse: 'The stress',
    spike: 'The spike', breakpoint: 'The breaking point', jornada: 'Journey and mix', pre: 'The pre-test', relatorio: 'The report' };
  const AULA = { perfis: 'aula-1-importancia-dos-testes-de-carga', modelo: 'aula-2-testes-de-carga-vs-estresse', smoke: 'aula-3-smoke-tests',
    media: 'aula-4-teste-de-media-average-load', estresse: 'aula-5-teste-de-estresse', spike: 'aula-6-teste-de-spike', breakpoint: 'aula-7-teste-de-breakpoint',
    jornada: 'aula-8-respondendo-a-perguntas-chave', pre: 'aula-10-estrategias-de-pre-teste', relatorio: 'aula-11-assessment-de-performance' };
  let clk = 0, sc = 'perfis', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-carga3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── dados reais (janelas de 10 s do CSV do k6) ──
  // breakpoints: [taxa oferecida, concluídos/s, p95 ms, erros %]
  const BP_HOJE = [[2.6, 2.8, 192, 0], [5.9, 6.1, 243, 0], [9.2, 9.3, 224, 0], [12.5, 12.7, 217, 0], [15.8, 15.9, 280, 0], [19, 19.3, 274, 0], [22.3, 22.5, 255, 0],
    [25.6, 25.2, 364, 0], [28.9, 29, 383, 0], [32.1, 32.8, 357, 0], [35.4, 34.9, 345, 0], [38.7, 36.3, 932, 0], [42, 37.2, 2001, 6.8], [45.2, 40.6, 2000, 6.5],
    [48.5, 36.7, 2001, 22.6], [51.8, 29.1, 2001, 42], [55.1, 25.9, 2001, 52.2], [58.4, 25.5, 2001, 55.4]];
  const BP_PLANO = [[8.5, 9.5, 215, 0], [23.4, 24.2, 208, 0], [38.4, 39.2, 196, 0], [53.4, 54.6, 217, 0], [68.3, 69.4, 216, 0], [83.3, 83.9, 225, 0], [98.2, 99.1, 213, 0],
    [113.2, 114, 247, 0], [128.1, 128.9, 245, 0], [143.1, 144, 266, 0], [158.1, 158.6, 284, 0], [173, 174.5, 298, 0], [188, 188.5, 388, 0], [202.9, 202.3, 444, 0],
    [217.9, 217.7, 488, 0], [232.9, 232, 491, 0], [247.8, 242.4, 763, 0], [262.8, 258.7, 928, 0], [277.7, 252.3, 1576, 0.3], [292.7, 262.1, 1997, 4.8],
    [307.6, 261.4, 2001, 11.4], [322.6, 271.3, 2001, 13.4], [337.6, 245, 2001, 23.8], [352.5, 195.1, 2001, 40.9]];
  const BP_PLANO2 = [[8.5, 8.5, 221, 0], [23.4, 23.8, 229, 0], [38.4, 38.4, 204, 0], [53.4, 53.8, 206, 0], [68.3, 68.6, 199, 0], [83.3, 83.4, 219, 0], [98.2, 98.3, 216, 0],
    [113.2, 113.5, 234, 0], [128.1, 128.5, 241, 0], [143.1, 143, 236, 0], [158.1, 158.1, 248, 0], [173, 173, 292, 0], [188, 187.6, 338, 0], [202.9, 201.1, 394, 0],
    [217.9, 218.6, 421, 0], [232.9, 231.9, 583, 0], [247.8, 246, 574, 0], [262.8, 261.3, 728, 0], [277.7, 267.5, 1003, 0], [292.7, 283.1, 1155, 0],
    [307.6, 289.2, 1573, 0.6], [322.6, 291.7, 1935, 3.1], [337.6, 281.6, 2001, 10.6], [352.5, 230.2, 2001, 32.2]];
  const PRE = [
    [[2.5, 2.8, 188, 0], [5.6, 5.9, 219, 0], [8.7, 9, 185, 0], [11.8, 12, 241, 0], [14.9, 15.1, 220, 0], [18, 18.2, 216, 0], [21, 21.3, 258, 0], [24.1, 24.1, 299, 0],
      [27.2, 27.1, 391, 0], [30.3, 30.6, 418, 0], [33.4, 33.8, 323, 0], [36.5, 32, 1371, 0]],
    [[4.1, 4, 230, 0], [10.4, 10.3, 178, 0], [16.6, 16.6, 241, 0], [22.9, 22.6, 207, 0], [29.1, 29.1, 247, 0], [35.4, 35.6, 238, 0], [41.6, 41.2, 271, 0],
      [47.9, 47.6, 340, 0], [54.1, 53.8, 334, 0], [60.4, 59.2, 678, 0], [66.6, 58.4, 1485, 0], [72.9, 47.9, 2001, 25.5]],
    [[5.7, 6.1, 255, 0], [15.1, 15.5, 179, 0], [24.5, 24.7, 205, 0], [34, 34.5, 207, 0], [43.4, 43.7, 229, 0], [52.8, 53, 247, 0], [62.2, 62.1, 264, 0],
      [71.6, 72.4, 274, 0], [81, 80.6, 426, 0], [90.5, 85.8, 1024, 0], [99.9, 81.9, 2001, 8.8], [109.3, 76.4, 2001, 20.5]]];
  // ponto do gráfico: [x, oferecida, concluídos, p95, erros]
  const byRate = a => a.map(r => [r[0], r[0], r[1], r[2], r[3]]);
  // no tempo: a oferecida sai das stages do checkout.js (no meio da janela); concluídos, p95 e erros são os medidos
  const ramp = (st, t) => { let at = 0, v = st[0][0]; for (const [to, d] of st.slice(1)) { if (t <= at + d) return v + (to - v) * (t - at) / d; at += d; v = to; } return v; };
  const ST_SPIKE = [[5], [5, 30], [60, 10], [60, 60], [5, 10], [5, 90]];
  const ST_EST = [[100], [100, 30], [200, 20], [200, 45], [250, 20], [250, 45], [300, 20], [300, 45], [100, 20], [100, 60]];
  const byTime = (a, st) => a.map((r, i) => [i * 10 + 5, ramp(st, i * 10 + 5), r[0], r[1], r[2]]);
  const SPIKE = byTime([[5, 164, 0], [5, 225, 0], [5, 219, 0], [26.8, 1048, 0], [27.9, 2001, 47.3], [29.6, 2001, 50.8], [30.4, 2001, 49.1], [22.6, 2001, 62.2],
    [21.3, 2001, 64.6], [25.6, 2001, 57.5], [33.1, 2001, 23.4], [5, 168, 0], [5, 196, 0], [5, 208, 0], [5, 203, 0], [5, 204, 0], [4.9, 242, 0], [5.1, 190, 0],
    [5, 173, 0], [4.9, 210, 0]], ST_SPIKE);
  const EST = byTime([[98.7, 232, 0], [100.2, 208, 0], [99.9, 218, 0], [124.3, 252, 0], [173.2, 280, 0], [201.5, 334, 0], [198, 369, 0], [200.6, 384, 0],
    [199.6, 382, 0], [202.5, 406, 0], [224.5, 485, 0], [242.5, 621, 0], [254.5, 687, 0], [248.5, 526, 0], [249.8, 738, 0], [251.3, 504, 0], [256.2, 605, 0],
    [276.6, 1241, 0], [282.7, 1497, 0.7], [290, 1887, 2.5], [292.6, 1789, 0.9], [279.3, 2000, 5.1], [289.8, 1893, 1.8], [223, 1247, 0], [113.2, 244, 0],
    [100.1, 219, 0], [100.1, 218, 0], [99.7, 213, 0], [100.1, 228, 0], [100.1, 223, 0]], ST_EST);
  // resumos finais do k6 (os *.txt do lab); p = p95 em ms, para marcar a meta
  const K = {
    smoke: { t: 'smoke · "today"', reqs: '61', avg: '81.9 ms', p95: '155.6 ms', p: 156, p99: '213.7 ms', fail: '0.00%', drop: '0', exit: 0 },
    media: { t: 'average 30/s · "today"', reqs: '3,601', avg: '157.5 ms', p95: '381.3 ms', p: 381, p99: '498.6 ms', fail: '0.00%', drop: '0', exit: 0 },
    m33: { t: 'step 33/s · "today"', reqs: '3,960', avg: '186.1 ms', p95: '430.7 ms', p: 431, p99: '625.8 ms', fail: '0.00%', drop: '0', exit: 0 },
    m36: { t: 'step 36/s · "today"', reqs: '4,320', avg: '333.5 ms', p95: '798.1 ms', p: 798, p99: '979.7 ms', fail: '0.00%', drop: '0', exit: 0 },
    mPlano: { t: 'average 125/s · "plan"', reqs: '15,001', avg: '109.9 ms', p95: '247.2 ms', p: 247, p99: '357.4 ms', fail: '0.00%', drop: '0', exit: 0 },
    f20: { t: 'closed · 20 VUs', reqs: '2,319', avg: '520.4 ms', p95: '1.07 s', p: 1070, p99: '1.21 s', fail: '0.00%', drop: '0', exit: 99 },
    f60: { t: 'closed · 60 VUs', reqs: '2,549', avg: '1.43 s', p95: '2 s', p: 2000, p99: '2 s', fail: '8.35%', drop: '0', exit: 99 },
    bpHoje: { t: 'breakpoint · "today"', reqs: '5,470', avg: '1.02 s', p95: '2 s', p: 2000, p99: '2 s', fail: '18.84%', drop: '19', exit: 99 },
    bpAbort: { t: 'breakpoint · ABORT=1', reqs: '2,764', avg: '248.6 ms', p95: '894.4 ms', p: 894, p99: '1.34 s', fail: '0.00%', drop: '0', exit: 99 },
    bpPlano: { t: 'breakpoint · "plan"', reqs: '42,726', avg: '705.9 ms', p95: '2 s', p: 2000, p99: '2 s', fail: '7.69%', drop: '593', exit: 99 },
    bpPlano2: { t: 'breakpoint · "plan 2"', reqs: '42,831', avg: '543.2 ms', p95: '1.96 s', p: 1960, p99: '2 s', fail: '4.23%', drop: '488', exit: 99 },
    est: { t: 'stress · "plan 2"', reqs: '59,567', avg: '419.2 ms', p95: '1.48 s', p: 1480, p99: '1.92 s', fail: '0.54%', drop: '182', exit: 99 },
    spike: { t: 'spike · "today"', reqs: '4,828', avg: '1.61 s', p95: '2 s', p: 2000, p99: '2 s', fail: '42.58%', drop: '21', exit: 99 },
    pre1: { t: 'pre-test · 1 pod', reqs: '2,339', avg: '249.0 ms', p95: '1.03 s', p: 1030, p99: '1.38 s', fail: '0.00%', drop: '0', exit: 99 },
    pre2: { t: 'pre-test · 2 pods', reqs: '4,573', avg: '542.7 ms', p95: '2 s', p: 2000, p99: '2 s', fail: '5.44%', drop: '46', exit: 99 },
    pre3: { t: 'pre-test · 3 pods', reqs: '6,796', avg: '535.8 ms', p95: '1.99 s', p: 1990, p99: '2 s', fail: '5.10%', drop: '103', exit: 99 },
    pool: { t: 'pool.js · single pool', reqs: '4,302', avg: '146.9 ms', p95: '56.0 ms', p: 56, p99: '5.52 s', fail: '7.90%', drop: '0', exit: 0, note: 'no thresholds' },
  };

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 950, 480, [[14, 14], [936, 14], [14, 466], [936, 466]]);
  hazeAndShadow(g0, 475, 240, 10.8, 5.8);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 700, 12, 240, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(694, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 139,5 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 22, SZ + 236, 692, 232, 4, g0), SK = 692 / 416;
  function block(nm, w, d, h, kind, x, y, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, kind, key: '', f: 0, pos: [x, y] };
  }
  const B = {};
  block('gen', 160, 104, 34, 'gen', 14, 196);
  block('ped', 130, 90, 26, 'svc', 214, 205); block('pag', 130, 90, 26, 'svc', 384, 205); block('est', 110, 90, 26, 'svc', 554, 205);
  block('s0', 92, 72, 22, 'shard', 722, 78); block('s1', 92, 72, 22, 'shard', 836, 78);
  block('s2', 104, 86, 28, 'shard', 716, 192); block('ded', 98, 82, 26, 'shard', 836, 196);
  block('cat', 300, 100, 26, 'svc', 214, 200); block('pool', 300, 110, 26, 'pool', 214, 196);
  const NAMES = Object.keys(B);
  // o represado: cartões empilhados na frente do elo (504, 503 ou as iterações que o gerador deixou cair)
  const KW = 50, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 16 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz (os pedidos) que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 34 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      const k = b.on ? (b.n ?? 2) : 0, sp = b.sp ?? 0.45;
      for (let j = 0; j < k; j++) dot(alongPts(b.pts, cum, (clk * sp + j / k) % 1), b.tone);
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
  const TAGS = [tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // balões na faixa livre da frente da prancha
  const TF = x => [x, 420, 24];
  const CX = { gen: 94, ped: 279, pag: 449, est: 609, s0: 768, s1: 882, s2: 768, ded: 885, cat: 364, pool: 364 };

  // ── a cadeia: ambientes, carga de cada elo e as vigas ──
  const ENV = { hoje: { ped: 3, pag: 2, est: 2, ded: 0 }, plano: { ped: 10, pag: 15, est: 2, ded: 0 }, plano2: { ped: 10, pag: 15, est: 2, ded: 1 } };
  const ENVNAME = { hoje: '"today"', plano: '"plan"', plano2: '"plan 2"' };
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  const BM = { g2p: P3([[174, 250], [214, 250]]), p2g: P3([[344, 250], [384, 250]]), g2e: P3([[514, 250], [554, 250]]), e2h: P3([[664, 250], [700, 250], [700, 174]]),
    bus: P3([[700, 174], [885, 174]]), s0: P3([[768, 174], [768, 150]]), s1: P3([[882, 174], [882, 150]]), s2: P3([[768, 174], [768, 192]]), ded: P3([[885, 174], [885, 196]]),
    g2c: P3([[174, 250], [214, 250]]) };
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const tn = u => u >= 0.995 ? 'bad' : u >= 0.7 ? 'acc' : 'dim';
  const nDots = r => r <= 0 ? 0 : r < 4 ? 1 : r < 25 ? 2 : r < 100 ? 3 : 4;
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], piles: [], cnt: [], res: [], k6: null, chart: null }; }
  function gen(o, exe, l1, l2, vu, on = 2) { o.show.gen = 1; o.on.gen = on; o.rows.gen = { ...act('k6', 'v2.3.0', [exe, 'dim'], [l1, on === 'bad' ? 'bad' : 'acc'], l2 ? [l2, 'dim'] : null), vu }; }
  // e: ambiente; rate: pedidos/s oferecidos; opt.only: um shard só (um cliente só); opt.env: troca de pods
  function cadeia(o, ek, rate, opt = {}) {
    const e = { ...ENV[ek], ...(opt.env || {}) }, inf = e.pag >= 100;
    const cap = { ped: e.ped * 30, pag: e.pag * 20, est: e.est * 500, s0: 150, s1: 150, s2: 150, ded: 300 };
    const sh = opt.only ? { [opt.only]: 1 } : e.ded ? { s0: 0.2, s1: 0.2, s2: 0.2, ded: 0.4 } : { s0: 0.2, s1: 0.2, s2: 0.6 };
    const ks = ['ped', 'pag', 'est', 's0', 's1', 's2', ...(e.ded ? ['ded'] : [])];
    const L = {}; ks.forEach(k => L[k] = (k[0] === 's' || k === 'ded' ? (sh[k] || 0) : 1) * rate / cap[k]);
    const elo = ks.reduce((a, k) => L[k] > L[a] ? k : a, 'ped');
    ks.forEach(k => { o.show[k] = 1; o.on[k] = L[k] >= 0.995 ? 'bad' : k === elo && L[k] >= 0.5 ? 1 : 0; });
    const pods = (n, u) => ({ n, tone: u >= 0.995 ? 'bad' : u >= 0.7 ? 'acc' : '' });
    o.rows.ped = { ...act('pedidos', `${e.ped} ${e.ped > 1 ? 'pods' : 'pod'}`, [`${cap.ped}/s nominal`, 'dim'], [`load ${pc(L.ped)}`, tn(L.ped)]), pods: pods(e.ped, L.ped) };
    o.rows.pag = inf ? { ...act('pagamentos', '100 pods', ['unlimited', 'dim'], [`load ${pc(L.pag)}`, 'dim']), pods: { n: 0, inf: true } }
      : { ...act('pagamentos', `${e.pag} pods`, [`${cap.pag}/s nominal`, 'dim'], [`load ${pc(L.pag)}`, tn(L.pag)]), pods: pods(e.pag, L.pag) };
    o.rows.est = { ...act('estoque', `${e.est} pods`, [`${thou(cap.est)}/s`, 'dim'], [`load ${pc(L.est)}`, tn(L.est)]), pods: pods(e.est, L.est) };
    ['s0', 's1', 's2'].forEach((k, i) => o.rows[k] = act(`shard-${i}`, k === 's2' && !e.ded ? 'mkt-01' : '', ['ceiling 150/s', 'dim'], [`load ${pc(L[k])}`, tn(L[k])]));
    if (e.ded) o.rows.ded = act('dedicated', 'mkt-01 · 2×', ['ceiling 300/s', 'dim'], [`load ${pc(L.ded)}`, tn(L.ded)]);
    // vigas: vermelhas até o elo quando a taxa passa da capacidade dele
    const over = L[elo] >= 0.995, n = nDots(rate), order = ['g2p', 'p2g', 'g2e', 'e2h', 'bus'], upto = { ped: 0, pag: 1, est: 2 }[elo] ?? 4;
    order.forEach((k, i) => o.beams.push({ pts: BM[k], on: rate > 0, tone: over && i <= upto ? 'bad' : '', n: k === 'bus' ? 0 : n }));
    ['s0', 's1', 's2', 'ded'].forEach(k => { if (k === 'ded' && !e.ded) return; const live = (sh[k] || 0) > 0 && rate > 0;
      o.beams.push({ pts: BM[k], on: live, tone: L[k] >= 0.995 ? 'bad' : '', n: live ? 1 : 0, sp: 0.6 }); });
    if (rate > 0) o.on.gen = o.on.gen ?? 2;
    return { elo, L, over, cap: Math.min(...ks.map(k => cap[k] / (k[0] === 's' || k === 'ded' ? (sh[k] || 1e-9) : 1))) };
  }
  const pile = (o, k, lab, f) => o.piles.push({ p: [CX[k], 336], lab, f: clamp(f) });
  const k6 = (o, k) => { o.k6 = K[k]; };
  // série no gráfico: revela os pontos com o tempo do passo e devolve o último revelado (o contador ao vivo)
  function series(o, t, list, opt = {}) {
    const main = list[list.length - 1], n = Math.max(1, Math.ceil(clamp(opt.reveal ?? sg(t, 0.3, opt.over ?? 4.5)) * (opt.upto ?? main.pts.length)));
    o.chart = { type: 'series', list, n, ...opt };
    const p = main.pts[Math.min(n, main.pts.length) - 1]; return p;
  }
  const liveCnt = (o, p, tm) => { o.cnt = [[tm ? 'WINDOW' : 'OFFERED', tm ? `${p[0] - 5}–${p[0] + 5} s` : dec(p[1]) + '/s'], ['p95', ms(p[3]), p[3] > 800 ? 'bad' : 'dim'],
    ['COMPLETED', dec(p[2]) + '/s', p[2] < p[1] * 0.97 ? 'bad' : 'dim'], ['ERRORS', dec(p[4]) + '%', p[4] > 0.1 ? 'bad' : 'dim']];
    o.live = { t: '10 s window', rows: [...(tm ? [['time', `${p[0] - 5}–${p[0] + 5} s`]] : []), ['offered', dec(p[1]) + '/s'],
      ['completed', dec(p[2]) + '/s', p[2] < p[1] * 0.97 ? 'bad' : ''], ['p95', ms(p[3]), p[3] > 800 ? 'bad' : 'acc'], ['errors', dec(p[4]) + '%', p[4] > 0.1 ? 'bad' : '']] }; };
  const PCT = (r, mx = 1000) => ({ type: 'rows', title: 'PERCENTILES (ms) × TARGET', max: mx, mark: { v: 800, lab: 'target 800' },
    rows: [['avg', r[0]], ['med', r[1]], ['p90', r[2]], ['p95', r[3], null, r[3] > 800 ? 'bad' : 'acc'], ['p99', r[4]], ['max.', r[5]]].map(([l, v, s, tone]) => [l, v, dec(v) + ' ms', tone || 'dim']) });
  const SHAPES = [['smoke', '2/s · 30 s', 'works?', [[0, 0], [0.06, 0.08], [0.94, 0.08], [1, 0]]],
    ['average', '30/s · 2 min', 'holds the target?', [[0, 0], [0.1, 0.5], [0.9, 0.5], [1, 0]]],
    ['estresse', '100 → 300/s', 'how does it degrade?', [[0, 0.33], [0.1, 0.33], [0.16, 0.66], [0.31, 0.66], [0.37, 0.83], [0.52, 0.83], [0.58, 1], [0.73, 1], [0.8, 0.33], [1, 0.33]]],
    ['spike', '5 → 60/s', 'survives the burst?', [[0, 0.08], [0.15, 0.08], [0.2, 1], [0.5, 1], [0.55, 0.08], [1, 0.08]]],
    ['breakpoint', '1 → 60/s', 'where does it break?', [[0, 0.02], [1, 1]]]];

  // ── o que se vê em cada passo ──
  const STEPS = {
    perfis: [
      { id: 'alvo', dur: 6, title: 'The target: the "today" checkout and the two targets', yk: 'THE TARGETS IN checkout.js', code: ['thresholds: {', "  http_req_duration: ['p(95)<800'],", "  http_req_failed:   ['rate<0.001'] }", 'TIPO=smoke k6 run checkout.js', '61 requests · p95 155.6 ms · exit 0'],
        story: 'The target is the checkout: each POST /pedidos goes through pedidos, pagamentos and estoque and writes to the DB. "Today" is Black Friday 2026, with 3 pods on pedidos and 2 on pagamentos. Module 14\'s targets go into k6 as thresholds: p95 up to 800 ms and errors up to 0.1%. The first result is the smoke: 61 requests, p95 of 155.6 ms, both targets passed.',
        look: 'k6, on the left, releases the orders into the chain. Each block shows the pods, the nominal capacity and the load. pagamentos, with 2 pods of 20/s, is the weakest link: ~40/s.',
        key: 'A plan without a test is a hypothesis; the test refutes it with a number, a measuring point and a target.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 orders/s', '30 s · 5 VUs'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.cnt = [['CAPACITY', '~40/s'], ['LINK', 'pagamentos (2 × 20/s)', 'dim'], ['TARGETS', 'p95 ≤ 800 ms · errors ≤ 0.1%', 'dim']];
          o.res = [['both targets passed: exit 0', 'acc']];
          if (t > 1.2) T(o, TF(449), 'link: pagamentos\n2 × 20 = 40/s'); } },
      { id: 'formas', dur: 9, title: 'The five load shapes over time', yk: 'THE SAME SCRIPT, FIVE PROFILES (TIPO=…)', code: ['smoke       2/s × 30 s', 'average     30/s × 2 min', 'stress      100 → 300/s in steps', 'spike       5 → 60/s in 10 s', 'breakpoint  1 → 60/s in 3 min'],
        story: 'The same checkout.js runs the five tests; the TIPO variable picks the shape of the load. The smoke is minimal; the average load is the expected one; the stress climbs in steps above it; the spike jumps at once and comes back; the breakpoint ramps up until it breaks. Each shape answers a question.',
        look: 'On the display, the five shapes light up one by one, with the rate that really ran and the question each one asks.',
        key: 'Each load shape answers a question: does it work, does it hold the target, how does it degrade, does it survive the burst, where does it break.',
        f(o, t) { const i = Math.min(4, Math.floor(clamp((t - 0.4) / 1.5) * 5 * 0.999)), s = SHAPES[i], rate = [2, 30, 30, 30, 30][i];
          gen(o, `TIPO=${['smoke', 'media', 'estresse', 'spike', 'breakpoint'][i]}`, s[1], s[2]); cadeia(o, 'hoje', rate);
          o.chart = { type: 'shapes', n: i + 1 };
          o.cnt = [['SHAPE', s[0]], ['RATE', s[1], 'dim'], ['QUESTION', s[2], 'dim']];
          o.res = [[`${i + 1} of 5 shapes`, 'acc']]; } },
      { id: 'plano', dur: 8, title: 'The "plan": the same chain, another environment', yk: 'THE MATH × THE TEST', code: ['pedidos     10 × 30 = 300/s', 'pagamentos  15 × 20 = 300/s', 'shard-2     60% × 250 = 150/s (the ceiling)', 'breakpoint: p95 crosses 800 at ~250/s'],
        story: 'Module 23\'s "plan" has 10 pods on pedidos and 15 on pagamentos: 300 orders/s nominal. The breakpoint found another number. mkt-01 takes 40% of the orders and lands on shard-2, which ends up with 60% of the traffic: at 250/s, shard-2 gets 150/s, its ceiling. The p95 crosses 800 ms at ~250/s, not at 300.',
        look: 'shard-2, the biggest in the ring, turns red, at 100%. On the display, the plan\'s p95 curve climbs and crosses the 800 ms line near 250/s.',
        key: 'The test shows where the math breaks: on the plan, the hot shard, at 250/s.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_PLANO), tone: 'acc', lab: '"plan"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'offered/s', marks: t > 4 ? [[250, '~250', 'bad'], [300, 'math 300', 'dim']] : [] });
          gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} orders/s`, '1 → 360/s in 4 min'); cadeia(o, 'plano', p[1]); k6(o, 'bpPlano'); liveCnt(o, p);
          o.cnt = [['THE TARGET FALLS AT', '~250/s', 'bad'], ['NOMINAL', '300/s', 'dim'], ['LINK', 'shard-2 (mkt-01)', 'dim'], ...o.cnt.slice(0, 2)];
          if (p[1] > 200) T(o, TF(768), 'shard-2: 60% × 250\n= 150/s, the ceiling', 'bad'); } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the environment is not production', yk: 'THE NAIVE EXTRAPOLATION', code: ['pre-production: 1 pod per service', '1 pedidos pod ≈ 30/s', '× 10 pods = ~300/s ?', 'plan: the hot shard-2 → ~250/s', 'plan 2 (dedicated): ~260/s'],
        story: 'Suppose a pre-production with 1 pod per service. One pedidos pod handles 30/s, and the extrapolation says 10 pods handle ~300/s. The math matches and gives confidence. The plan\'s environment showed something else: shard-2, hot because of mkt-01, caps the plan at ~250/s, and "plan 2", with the dedicated shard, at ~260/s. A 1-pod pre-production would never see the hot shard.',
        look: 'First a single pod on pedidos, at 30/s, and the "× 10" math. Then the plan\'s chain with 10 pods: shard-2 turns red before the pods reach their limit.',
        key: 'The environment is part of the result: it has to have the shape of production.',
        f(o, t) { const a = t < 3.2;
          if (a) { gen(o, 'ramping-arrival-rate', '30 orders/s', 'pre-production'); cadeia(o, 'hoje', 30, { env: { ped: 1, pag: 100 } }); k6(o, 'pre1');
            T(o, TF(279), '1 pod: ~30/s\n× 10 = 300/s ?'); }
          else { gen(o, 'ramping-arrival-rate', '250 orders/s', 'plan\'s environment'); cadeia(o, 'plano', 250); k6(o, 'bpPlano');
            T(o, TF(768), 'shard-2 at the ceiling\n~250/s, not 300', 'bad'); }
          o.chart = { type: 'rows', title: 'CAPACITY (ORDERS/S)', max: 320, rows: [['1 pod × 10', 300, '~300/s (math)', 'dim'], ['"plan"', 250, '~250/s (shard-2)', a ? 'dim' : 'bad'], ['"plan 2"', 260, '~260/s (step)', 'dim']].slice(0, a ? 1 : 3) };
          o.cnt = a ? [['EXTRAPOLATED', '~300/s'], ['1 POD', '~30/s', 'dim']] : [['MEASURED', '~250/s', 'bad'], ['EXTRAPOLATED', '~300/s', 'dim'], ['LINK', 'shard-2', 'dim']];
          o.res = a ? [] : [['the 1-pod pre-production does not see the hot shard', 'bad']]; } },
    ],
    modelo: [
      { id: 'fechado20', dur: 7, title: 'Closed model: 20 VUs, 38.1/s and 0% errors', yk: 'executor: constant-vus · VUS=20', code: ['each VU sends, waits for the response, sends again', 'throughput 38.1/s · average 520 ms · p95 1.07 s', 'Little: 20 = 38.07 × 0.520 s', 'errors 0% · exit 99 (only the p95 failed)'],
        story: 'In the closed model k6 fixes the number of virtual users. Each VU sends an order, waits for the response and only then sends the next. With 20 VUs and no pause, throughput stayed at 38.1/s, the average at 520 ms and the p95 at 1.07 s. No errors. Little\'s Law checks out: 20 = 38.07 × 0.520.',
        look: 'In k6, each little square is a VU; the lit ones are waiting for the response. A new order only goes out when a VU is free.',
        key: 'In the closed model the rate depends on the system: when it slows down, the generator slows down too.',
        f(o, t) { gen(o, 'constant-vus', '20 VUs · no pause', '38.1 orders/s', { n: 20, busy: 0.9 }); cadeia(o, 'hoje', 38.1); k6(o, 'f20');
          o.chart = MODEL(1); o.cnt = [['THROUGHPUT', '38.1/s'], ['ERRORS', '0%', 'dim'], ['p95', '1.07 s', 'bad']];
          if (t > 1.2) T(o, TF(94), '20 VUs waiting\nthroughput stops at 38/s'); } },
      { id: 'fechado60', dur: 7, title: 'Closed model: 60 VUs, 41.1/s and 8.35%', yk: 'VUS=60', code: ['throughput 41.1/s (capacity is ~40/s)', 'average 1.43 s · p95 2 s', 'errors 8.35% (504 at 2 s)', '3 × the VUs, +8% throughput'],
        story: 'Tripling the VUs barely changed the throughput: 41.1/s, because the capacity is ~40/s. What went up was the wait: average of 1.43 s, p95 of 2 s, and 8.35% of the orders got a 504 from the lb-loja. No matter how many VUs you add, the closed model does not go past the capacity.',
        look: 'The 60 little squares almost all lit, waiting. The pile of 504s starts in front of pagamentos.',
        key: 'The closed generator regulates itself: throughput stops at the capacity and only the wait grows.',
        f(o, t) { gen(o, 'constant-vus', '60 VUs · no pause', '41.1 orders/s', { n: 60, busy: 0.97 }); cadeia(o, 'hoje', 41.1); k6(o, 'f60');
          if (t > 0.8) pile(o, 'pag', '504 · 8%', 0.3);
          o.chart = MODEL(2); o.cnt = [['THROUGHPUT', '41.1/s'], ['ERRORS', '8.35%', 'bad'], ['AVERAGE', '1.43 s', 'bad']]; } },
      { id: 'aberto', dur: 8, title: 'Open model: 54 orders/s, 52% errors', yk: 'executor: ramping-arrival-rate (the 54/s window)', code: ['the rate is fixed: 54/s arrive, answered or not', 'completed ~26/s · median 2 s', 'errors 52% (504)', 'k6 raises the VUs to keep the rate'],
        story: 'In the open model k6 fixes the rate and lets the VUs vary. At 54 orders/s, the "today" breakpoint window had 52% errors and only ~26 orders completed per second, with a median of 2 s. This is how the store receives the 8 PM newsletter: at a rate, not at a number of users waiting their turn.',
        look: 'The light comes in at a fixed pace, even with the chain full. The pile of 504s in front of pagamentos grows fast.',
        key: 'In the open model the rate is the input: the system cannot brake the generator.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '54 orders/s', 'VUs up to 119'); cadeia(o, 'hoje', 54); k6(o, 'bpHoje');
          if (t > 0.6) pile(o, 'pag', '504 · 52%', (t - 0.6) / 3);
          o.chart = MODEL(3); o.cnt = [['ERRORS', '52%', 'bad'], ['COMPLETED', '~26/s', 'bad'], ['OFFERED', '54/s', 'dim']]; } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the closed test "passes"', yk: 'COORDINATED OMISSION', code: ['closed, 20 VUs: errors 0%', 'open, 54/s:      errors 52%', 'the closed model omits the orders it', 'should have sent while it was waiting'],
        story: 'Whoever reads only the errors of the 20 VU closed test says everything is fine: 0%. The closed generator hides the break because when the system slows down, it slows down too. The k6 documentation calls this coordinated omission. The store\'s customer does not wait their turn; for the 8 PM newsletter the model is the open one.',
        look: 'The same store alternates between the two generators: 0% errors on the closed one, 52% on the open one. On the display, the three rounds side by side.',
        key: 'The closed model hides the break; test the rate the store receives.',
        f(o, t) { const ab = Math.floor(t / 2.6) % 2 === 1;
          if (ab) { gen(o, 'ramping-arrival-rate', '54 orders/s', 'aberto', null, 'bad'); cadeia(o, 'hoje', 54); pile(o, 'pag', '504 · 52%', 0.8); T(o, TF(449), 'open: 52% errors', 'bad'); }
          else { gen(o, 'constant-vus', '20 VUs · 38.1/s', 'fechado', { n: 20, busy: 0.9 }); cadeia(o, 'hoje', 38.1); T(o, TF(94), 'closed: 0% errors'); }
          k6(o, ab ? 'bpHoje' : 'f20'); o.chart = MODEL(3);
          o.cnt = [['CLOSED 20 VUs', '0% errors'], ['OPEN 54/s', '52% errors', 'bad']];
          o.res = [['the closed model hides the break', 'bad']]; } },
    ],
    smoke: [
      { id: 'roda', dur: 6, title: 'Smoke: 2 orders/s for 30 s, 61 requests', yk: 'TIPO=smoke k6 run checkout.js', code: ['constant-arrival-rate · rate 2 · 30 s', 'preAllocatedVUs 5 · maxVUs 20', 'customers: 40% mkt-01, 60% c-<n>', 'no queue: 33 + 50 + 2 + 6.67 = 91.7 ms'],
        story: 'The smoke is the smallest load that proves the test and the system work. Two orders per second for 30 s, in the "today" environment: 61 requests came back, with an average of 81.9 ms, p95 of 155.6 ms and 0% errors. The sum of the times with no queue is 91.7 ms, and the average of 61 samples lands around that.',
        look: 'A few points of light cross the chain and reach the three shards, because the mix\'s customers are drawn at random. On the display, the percentile bars stay far from the 800 ms line.',
        key: 'The smoke proves the test runs; it does not measure capacity.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 orders/s', 'customers drawn'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.chart = PCT([81.9, 78.2, 138, 155.6, 213.7, 247.5]); o.cnt = [['REQUESTS', '61'], ['p95', '155.6 ms', 'dim'], ['ERRORS', '0%', 'dim']]; } },
      { id: 'check', dur: 6, title: 'The check and the exit code: 0 goes on, 99 blocks', yk: 'WHAT THE PIPELINE READS', code: ["check(res, { 'status 201': ... })", 'p(95)<800 ✓ · rate<0.001 ✓', 'exit 0 → the version goes on', 'exit 99 → the deploy stops (module 22)'],
        story: 'Each response goes through a check (status 201) and the whole test goes through two thresholds. The final table is for people to read; the pipeline reads the exit code: 0 if everything passed, 99 if a threshold failed. Module 22 runs the smoke after every deploy, and the 99 blocks the version without anyone opening the table.',
        look: 'On the display, the k6 summary ends in exit 0, with both targets approved.',
        key: 'The table is for people; the exit code decides whether the version goes on.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 orders/s', 'customers drawn'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.chart = { type: 'lines', title: 'THE END OF k6\'S OUTPUT', n: 1 + Math.floor(clamp(t / 3) * 4), lines: [["✓ 'status 201'  61 of 61", 'acc'], ['✓ p(95)<800    p(95)=155.6ms', 'acc'], ['✓ rate<0.001   0.00%', 'acc'], ['exit 0 → the deploy goes on', 'acc'], ['(exit 99 → the deploy stops)', 'dim']] };
          o.cnt = [['EXIT CODE', '0'], ['CHECKS', '61 of 61', 'dim']]; } },
      { id: 'lena', dur: 7, title: 'What if it goes wrong: a single customer, lena-77', yk: 'murmur3(cliente_id) mod 3', act: ['Using only lena-77', 'a single customer'], code: ['lena-77 → murmur3 mod 3 = 1 → shard-1', 'all orders on shard-1', 'shard-2 (mkt-01\'s): none', 'green smoke, the hot shard idle'],
        story: 'A homemade smoke usually uses a single customer. lena-77 always lands on shard-1, because murmur3 mod 3 gives 1. The smoke stays green without ever touching shard-2, the mkt-01 one, which is where the plan breaks.',
        look: 'All the points of light go down to shard-1. shard-2, the biggest, stays dark.',
        key: 'A single customer misleads: the test data has to vary.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 orders/s', 'customer: lena-77'); cadeia(o, 'hoje', 2, { only: 's1' }); k6(o, 'smoke');
          o.on.s1 = 1; o.chart = { type: 'rows', title: 'ORDERS PER SHARD', max: 61, rows: [['shard-0', 0, '0', 'dim'], ['shard-1', 61, '61 (all)', 'acc'], ['shard-2', 0, '0 · mkt-01\'s', 'bad']] };
          o.cnt = [['SHARD-1', '61 orders'], ['SHARD-2', '0', 'bad']]; o.res = [['green without touching the hot shard', 'bad']];
          if (t > 1) T(o, TF(768), 'shard-2: no orders', 'bad'); } },
      { id: 'mkt', dur: 7, title: 'What if it goes wrong: with mkt-01, shard-2 shows up', yk: 'mkt-01 → shard-2', act: ['Switch to mkt-01', 'another customer'], code: ['mkt-01 → murmur3 mod 3 = 2 → shard-2', 'the 201 does not check the shipping:', '49.00 × 64.00 would pass (module 22)', 'content check + varied data'],
        story: 'Switching the test customer to mkt-01, the order goes to shard-2. The same smoke also checked only the 201: the module 22 shipping error (49.00 in place of 64.00) would get through. The check has to look at the response content, and the customers have to cover the shards.',
        look: 'Now the light goes down to shard-2, which lights up. shard-1 stays dark.',
        key: 'The smoke only says "you can go on" if the data and the check cover what matters.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 orders/s', 'customer: mkt-01'); cadeia(o, 'hoje', 2, { only: 's2' }); k6(o, 'smoke');
          o.on.s2 = 1; o.chart = { type: 'rows', title: 'ORDERS PER SHARD', max: 61, rows: [['shard-0', 0, '0', 'dim'], ['shard-1', 0, '0', 'dim'], ['shard-2', 61, '61 · mkt-01\'s', 'acc']] };
          o.cnt = [['SHARD-2', '61 orders'], ['SHIPPING', 'not checked', 'bad']]; o.res = [['the 201 does not check the shipping', 'bad']];
          if (t > 1) T(o, TF(768), 'mkt-01 → shard-2'); } },
    ],
    media: [
      { id: 'trinta', dur: 7, title: 'Average load: 30 orders/s for 2 minutes', yk: 'RATE=30 TIPO=media k6 run checkout.js', code: ['constant-arrival-rate · 30/s · 2 min', '3,601 requests · 0% errors', 'avg 157.5 · med 129.5 · p90 309.9', 'p95 381.3 · p99 498.6 · max. 617.0 ms'],
        story: 'Average load checks the target at the expected load: 30 orders per second, Black Friday 2026, for 2 minutes. There were 3,601 requests, an average of 157.5 ms, p95 of 381.3 ms, p99 of 498.6 ms and no errors. Both targets passed. The article asks for hours or days, to find what only shows up with time, like memory leaks.',
        look: 'The light runs continuously through the chain. pagamentos is at 75% load, lit; on the display, all the percentiles are below the 800 ms line.',
        key: 'Average load answers: "does the normal store hold the target?"',
        f(o, t) { gen(o, 'constant-arrival-rate', '30 orders/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 30); k6(o, 'media');
          o.chart = PCT([157.5, 129.5, 309.9, 381.3, 498.6, 617]); o.cnt = [['p95', '381.3 ms'], ['ERRORS', '0%', 'dim'], ['REQUESTS', '3.601', 'dim']]; } },
      { id: 'mm1', dur: 7, title: 'M/M/1 said ~259 ms; k6 measured 157', yk: 'MODULE 23\'S MATH × THE MEASUREMENT', code: ['M/M/1 per link, at 30/s:', 'pedidos 49 + pagamentos 200', '+ estoque 2 + DB 7 = ~259 ms', 'k6: 157.5 ms average'],
        story: 'Module 23\'s queueing math, one M/M/1 per link, would give about 259 ms average across the chain at 30/s: 49 on pedidos, 200 on pagamentos, 2 on estoque and 7 on the DB. k6 measured 157.5 ms. Round robin makes each pod\'s arrivals more regular than a random draw, and the model comes out conservative. Measuring tells you by how much.',
        look: 'On the display, the M/M/1 bar is much longer than k6\'s.',
        key: 'The model gives the order of magnitude; the test gives the number.',
        f(o, t) { gen(o, 'constant-arrival-rate', '30 orders/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 30); k6(o, 'media');
          o.chart = { type: 'rows', title: 'AVERAGE ACROSS THE CHAIN AT 30/s (ms)', max: 300, rows: [['M/M/1', 259, '~259 ms (math)', 'dim'], ['k6', 157.5, '157.5 ms (measured)', 'acc']] };
          o.cnt = [['MEASURED', '157.5 ms'], ['M/M/1', '~259 ms', 'dim']]; o.res = [['the model is conservative', 'acc']]; } },
      { id: 'trintaeseis', dur: 7, title: '36 orders/s: the p95 goes to 798 ms', yk: '2 MIN STEP (STEADY STATE)', act: ['Change to 36/s', 'steady state'], code: ['33/s: p95 431 ms · p99 626 · 0%', '36/s: p95 798 ms · p99 980 · 0%', 'passes by 2 ms (exit 0)', 'pagamentos: 36 ÷ 40 = 90% load'],
        story: 'With the rate constant at 36 orders/s, the steady-state p95 went to 798 ms: the target passed by 2 ms. At 33/s it was at 431 ms. pagamentos is at 90% load, and near that every extra order costs a lot in waiting.',
        look: 'pagamentos lights up more, at 90%. On the display, the 36/s p95 bar touches the 800 ms line.',
        key: 'Near capacity, a few more orders take the p95 up to the target.',
        f(o, t) { gen(o, 'constant-arrival-rate', '36 orders/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 36); k6(o, 'm36');
          o.chart = { type: 'rows', title: 'STEADY-STATE p95 (ms)', max: 1000, mark: { v: 800, lab: 'target 800' }, rows: [['30/s', 381.3, '381 ms', 'dim'], ['33/s', 430.7, '431 ms', 'dim'], ['36/s', 798.1, '798 ms', 'acc']] };
          o.cnt = [['p95', '798.1 ms'], ['TARGET', '800 ms', 'dim'], ['PAGAMENTOS', '90%', 'dim']];
          if (t > 1) T(o, TF(449), 'pagamentos at 90%\np95 798 ms'); } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the day\'s average is not the peak', yk: 'TIPO=media RATE=125 · "plan"', code: ['125/s = 200 × 400 ÷ 640 (the 2027 average)', 'avg 109.9 · p95 247.2 · p99 357.4 ms', '0% errors · exit 0', 'same environment\'s breakpoint: ~250/s'],
        story: 'The Black Friday 2027 average is 125 orders/s. In the plan\'s environment, average load passes with room to spare: p95 of 247 ms, no errors, and shard-2 at 50%. The same environment\'s breakpoint breaks at ~250/s, double. The test answered what it was asked, the normal load; Black Friday asks another question.',
        look: 'The plan\'s chain calm, shard-2 at 50%. On the display, the plan\'s breakpoint curve, with the 125/s well before the break.',
        key: 'A test answers the question it asked; the average does not say whether the peak fits.',
        f(o, t) { gen(o, 'constant-arrival-rate', '125 orders/s', '2 min · "plan"'); cadeia(o, 'plano', 125); k6(o, 'mPlano');
          series(o, t, [{ pts: byRate(BP_PLANO), tone: 'acc', lab: 'breakpoint "plan"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'offered/s', marks: [[125, 'average 125', 'acc'], [250, 'breaks ~250', 'bad']] });
          o.cnt = [['AVERAGE', 'p95 247 ms'], ['BREAK', '~250/s', 'bad'], ['SHARD-2', '50%', 'dim']]; o.res = [['passes with room to spare, and the peak is another thing', 'bad']]; } },
    ],
    estresse: [
      { id: 'cem', dur: 6, title: 'The staircase starts at 100 orders/s', yk: 'TIPO=stress · "plan 2"', code: ['100 → 200 → 250 → 300 → 100/s', '20 s climbs, 45 s levels', 'level 100/s: p95 208–232 ms', 'completed ~100/s · 0%'],
        story: 'Stress takes the load above the expected in steps and looks at what degrades first and how it comes back. On "plan 2" the staircase goes from 100 to 200, 250 and 300 orders/s and back down to 100. At the first level, 100/s, the p95 sits between 208 and 232 ms.',
        look: 'On the display, the dashed line is the offered rate and the lit one is the goodput, the orders completed per second. The two move together.',
        key: 'Stress asks what degrades first and how the system comes back.',
        f(o, t) { est(o, t, 0, 3); } },
      { id: 'duzentos', dur: 7, title: '200/s, the plan\'s target: p95 of 334 to 406 ms', yk: 'LEVEL 200/s', act: ['Climb to 200/s', 'the target'], code: ['level 200/s (the Black Friday target)', 'p95 334–406 ms · p99 445–587', 'completed ~200/s · 0%'],
        story: 'The second level is the plan\'s target: 200 orders/s. The p95 sits between 334 and 406 ms, half the target, and every order completes. pedidos and pagamentos are at 67% load.',
        look: 'pedidos and pagamentos light up more. The goodput follows the rate on the step.',
        key: 'At the target load, "plan 2" has room to spare.',
        f(o, t) { est(o, t, 3, 10); } },
      { id: 'duzentosecinquenta', dur: 7, title: '250/s: the p95 touches the target (up to 738 ms)', yk: 'LEVEL 250/s', act: ['Climb to 250/s', 'above the target'], code: ['level 250/s', 'p95 504–738 ms (at the limit)', 'p99 639–1,068 ms · 0%', 'pedidos and pagamentos at 83%'],
        story: 'At 250 orders/s the target still holds, but at the limit: the worst window had a p95 of 738 ms, and the p99 goes past 1 s in one of them. There are still no errors.',
        look: 'The p95 curve climbs and gets near the 800 ms line.',
        key: 'The target holds up to 250/s on "plan 2".',
        f(o, t) { est(o, t, 10, 16); } },
      { id: 'trezentos', dur: 8, title: '300/s, the stress: p95 of 1.5 to 2 s and errors', yk: 'LEVEL 300/s', act: ['Climb to 300/s', 'the stress'], code: ['level 300/s', 'p95 1,497–2,000 ms', 'errors 0.7% to 5.1% (504)', 'goodput 280–293/s, below what arrives'],
        story: 'At 300 orders/s, the plan\'s stress, the p95 goes from 1.5 to 2 s, and between 0.7% and 5.1% of the orders get a 504. The goodput sits between 280 and 293/s, less than what arrives. pedidos and pagamentos are at 100% together.',
        look: 'pedidos and pagamentos turn red and the pile of 504s shows up. On the display, the p95 goes past the line and the error bars appear.',
        key: 'Above the capacity, the p95 goes to the timeout and errors begin.',
        f(o, t) { est(o, t, 16, 23); } },
      { id: 'volta', dur: 8, title: 'Back to 100/s: recovers in 10 to 20 s', yk: 'THE DESCENT AND THE SUMMARY', act: ['Descend to 100/s', 'the recovery'], code: ['1st window at 100/s: p95 1,247 ms', '2nd window: 244 ms · then ~220', 'total: avg 419 · p95 1.48 s · p99 1.92 s', 'failures 0.54% · dropped 182 · exit 99'],
        story: 'When the load goes back to 100/s, the p95 still reads 1,247 ms in the first window and falls to 244 ms in the second: the recovery takes 10 to 20 s. It is fast because the bottleneck discards what already went past 2 s. The summary of the whole test gives a p95 of 1.48 s, 0.54% failures and code 99.',
        look: 'The chain cools down and the pile disappears. On the display, the curve drops right after the step.',
        key: 'Recovering is part of the result: how long it takes and why.',
        f(o, t) { est(o, t, 23, 30); if (t > 4.6) { k6(o, 'est'); o.live = null; } } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: more load, fewer completed orders', yk: 'BREAKPOINT "today": GOODPUT × RATE', code: ['offered 45.2/s → completed 40.6/s', '51.8/s → 29.1/s', '58.4/s → 25.5/s', 'pagamentos serves those who already gave up (2 s)'],
        story: 'On "today", above the ceiling, more load gave fewer completed orders. At 45 orders/s offered, 40.6 per second came back; at 58, only 25.5. pagamentos spends capacity on requests whose customer already gave up at 2 s, and whoever arrives later waits behind them.',
        look: 'pagamentos red and the pile of 504s growing. On the display, the goodput climbs with the rate up to ~40/s and then drops, while the offered one keeps climbing.',
        key: 'Above the ceiling the goodput drops: the bottleneck spends time on those who already gave up.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'offered/s', over: 5, marks: t > 4 ? [[45.2, 'peak 40.6/s', 'acc'], [58.4, '25.5/s', 'bad']] : [] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} orders/s`, '"today"'); cadeia(o, 'hoje', p[1]); k6(o, 'bpHoje'); liveCnt(o, p);
          if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, p[4] / 60);
          o.res = p[1] > 45 ? [['more load = fewer completed orders', 'bad']] : []; } },
    ],
    spike: [
      { id: 'base', dur: 5, title: 'The base: 5 orders/s for 30 s', yk: 'TIPO=spike · the stages', code: ['{ target: 5,  duration: 30s }', '{ target: 60, duration: 10s }', '{ target: 60, duration: 60s }', '{ target: 5,  duration: 10s }', '{ target: 5,  duration: 90s }'],
        story: 'The spike is a sudden jump that comes back, like the 8 PM newsletter. The base is calm: 5 orders/s for 30 s, with a p95 around 220 ms.',
        look: 'A few points cross the "today" chain. On the display, the rate is flat down at the bottom.',
        key: 'The spike asks whether the system absorbs the burst and how long it takes to come back.',
        f(o, t) { spk(o, t, 0, 3); } },
      { id: 'salto', dur: 6, title: 'The jump: from 5 to 60/s in 10 s', yk: 'THE JUMP WINDOW', act: ['Release the burst', '5 → 60/s'], code: ['30–40 s window: the rate goes from 5 to 60', 'p95 1,048 ms (1.05 s)', 'still 0% errors'],
        story: 'In 10 s the rate goes from 5 to 60 orders/s. In the jump window the p95 already goes to 1.05 s: the pagamentos queue fills before any error.',
        look: 'The light suddenly thickens and pagamentos lights up.',
        key: 'The queue fills before the errors show up.',
        f(o, t) { spk(o, t, 3, 4); } },
      { id: 'topo', dur: 8, title: 'The top: 60/s offered, 47% to 65% errors', yk: '60 s AT THE TOP', code: ['60/s against ~40/s of capacity', 'errors 47–65% per window', 'goodput 21–30/s', 'p95 2 s (the timeout)'],
        story: 'At the top, 60 orders/s for 60 s, well above the ~40/s that "today" handles. Errors stay between 47% and 65% per window and the goodput between 21 and 30 per second, less than the capacity.',
        look: 'pagamentos red and the pile of 504s growing; on the display, the error bars high and the goodput below the offered one.',
        key: 'A burst above the capacity turns into errors right away.',
        f(o, t) { spk(o, t, 4, 11); } },
      { id: 'preescala', dur: 8, title: 'With pre-scaling, the same burst fits', yk: 'THE HPA\'S MATH × PRE-SCALING', act: ['Turn on pre-scaling', 'pagamentos with 4 pods'], code: ['HPA: ~60 s to react (module 14)', '(60 − 40)/s × 60 s = 1,200 orders', 'pre-scale at 7:50 PM (module 23)', 'pagamentos 4 × 20 = 80/s: 60/s at 75%'],
        story: 'Module 14\'s HPA takes about 60 s to react. With 20 orders/s above capacity during those 60 s, that is 1,200 orders refused or delayed before the first new replica is ready. The burst is known, so the fix is to pre-scale at 7:50 PM. With pagamentos on 4 pods (80/s), the 60/s at the top fit at 75% load. This is math: this round was not run in the lab.',
        look: 'pagamentos already has 4 pods before the burst. The pile disappears and the chain stays lit, with no red.',
        key: 'A known burst is solved with pre-scaling; the HPA is slow for a 10 s burst.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '60 orders/s', 'pagamentos pre-scaled'); cadeia(o, 'hoje', 60, { env: { pag: 4 } });
          o.chart = { type: 'rows', title: 'AT THE TOP OF 60/s', max: 1200, rows: [['without pre-scaling', 1200, '1,200 orders in the HPA\'s delay', 'bad'], ['errors at the top', 650, '47–65% (measured)', 'bad'], ['with pre-scaling', 0, '60 < 80/s: fits (math)', 'acc']] };
          o.cnt = [['PAGAMENTOS', '4 × 20 = 80/s'], ['LOAD', '75%', 'dim'], ['WITHOUT PRE-SCALING', '1,200 orders', 'bad']];
          o.res = [['the same burst fits (math, not run)', 'acc']];
          if (t > 1) T(o, TF(449), 'pre-scaling: 4 pods\n60/s at 75%'); } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the "recovery" that is error', yk: 'WHAT THE SIMULATOR DID WITH THE QUEUE', code: ['back to 5/s: p95 168 ms in the 1st window', 'no queue left: it turned into 504', 'total: 42.58% failures · exit 99', 'read the p95 and the top errors together'],
        story: 'On going down to 5/s the p95 went back to 168 ms in the very first window. It looks too good, and it is: the simulator discards requests that go past 2 s, because the customer gave up. The queue did not empty because the system got fast; it emptied because it turned into 504. The 47% to 65% errors at the top are the price of the recovery.',
        look: 'The chain cools down at once. On the display, the p95 curve falls right after the top, next to the red error bars.',
        key: 'Recovering fast can be only error: read the top errors along with the p95 after it.',
        f(o, t) { spk(o, t, 11, 20); if (t > 4.6) { k6(o, 'spike'); o.live = null; }
          if (t > 3) T(o, TF(449), 'the queue turned into 504\n47–65% at the top', 'bad'); } },
    ],
    breakpoint: [
      { id: 'rampa', dur: 7, title: 'The ramp: from 1 to 60 orders/s in 3 minutes', yk: 'TIPO=breakpoint TOPO=60 DUR=3m ABORT=0', code: ['ramping-arrival-rate: 1 → 60/s in 180 s', '10 s windows (k6\'s CSV)', 'up to 35/s: p95 345–383 ms, 0% errors', 'HPA off, as k6 says'],
        story: 'The breakpoint raises the load until it breaks and says where. The ramp goes from 1 to 60 orders/s in 3 minutes, on "today", with elasticity off. Reading the CSV in 10 s windows, up to about 35/s the p95 stays between 345 and 383 ms and there are no errors.',
        look: 'On the display, each point is a window: on top the p95 against the 800 ms line; below the offered rate (dashed), the goodput (lit) and the errors (bars).',
        key: '"Breaking" has three points: the target, the errors and the collapse.',
        f(o, t) { bph(o, t, 0, 11, []); } },
      { id: 'meta', dur: 7, title: 'Point 1, the target: the p95 goes past 800 ms', yk: 'THE TARGET (p95 > 800 ms)', act: ['Raise the rate', 'up to the target'], code: ['38.7/s window: p95 932 ms', 'another round: 820 ms at 35.4/s', '2 min step at 36/s: p95 798 ms', '→ "today" sustains 36/s'],
        story: 'The first point is the target. In the 38.7/s window the p95 went to 932 ms; in another round, to 820 ms already at 35.4/s: the break varies between rounds. The 2 minute step confirmed it: at 36/s the p95 stays at 798 ms. "Today" sustains 36 orders/s.',
        look: 'The p95 point jumps above the 800 ms line. pagamentos reaches 97% load.',
        key: 'The ramp locates; the step confirms.',
        f(o, t) { bph(o, t, 11, 12, [[36, 'target 36', 'acc']]); } },
      { id: 'erros', dur: 7, title: 'Point 2, the errors: they start at ~42/s', yk: 'THE ERRORS (> 0.1%)', act: ['Raise the rate', 'up to the errors'], code: ['42.0/s window: errors 6.8% (504)', '2 pods × 20/s of pagamentos = 40/s', 'p95 2,001 ms (the timeout)'],
        story: 'The second point is the errors. In the 42 orders/s window, 6.8% came back with 504: it is pagamentos\'s capacity, 2 pods × 20/s, the weakest link from module 14. The p95 is already at the 2 s timeout.',
        look: 'pagamentos turns red and the first error bar shows up on the display.',
        key: 'Errors show up when the rate goes past the link\'s capacity.',
        f(o, t) { bph(o, t, 12, 13, [[36, 'target 36', 'acc'], [42, 'errors 42', 'bad']]); } },
      { id: 'colapso', dur: 8, title: 'Point 3, the collapse: the goodput falls from ~40 to ~26/s', yk: 'THE COLLAPSE (THE GOODPUT DROPS)', act: ['Raise it up to 60/s', 'the collapse'], code: ['45.2/s → 40.6/s completed', '51.8/s → 29.1/s', '58.4/s → 25.5/s · errors 55%', 'total: 5,470 reqs · 18.84% · exit 99'],
        story: 'The third point is the collapse. Above ~45/s the goodput drops: 40.6 per second completed at 45, 29.1 at 52, 25.5 at 58. More load, fewer orders. The final summary gives 5,470 requests, 18.84% failures and code 99.',
        look: 'Below, the goodput line climbs with the rate and then falls, while the dashed one keeps climbing.',
        key: 'Collapse: past the ceiling, each extra order knocks down what completes.',
        f(o, t) { bph(o, t, 13, 18, [[36, 'target 36', 'acc'], [42, 'errors 42', 'bad'], [48, 'collapse', 'bad']]); if (t > 4.8) { k6(o, 'bpHoje'); o.live = null; } } },
      { id: 'acumulado', dur: 8, title: 'Window × cumulative: abortOnFail comes 20 s later', yk: 'ABORT=1: abortOnFail + delayAbortEval 10s', code: ['per window: p95 820 ms at 100–110 s (~35/s)', 'cumulative: p95 894 ms, stops at 128 s', '(~43/s) · 2,764 reqs · 0 errors · exit 99', 'to find the point, read the window'],
        story: 'With abortOnFail on, k6 stopped the test at 128 s, at ~43 orders/s and a cumulative p95 of 894 ms. By window, the p95 had already crossed 800 ms 20 s earlier, in the 100 to 110 s window, near 35/s. The threshold looks at the whole test, and the automatic cut comes late.',
        look: 'On the display, the two marks: the window that crossed the target and, 8 orders/s later, the point where the cumulative crossed and the test stopped.',
        key: 'To locate the breaking point, use the window, not the aggregate.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'offered/s', upto: 13, marks: [[35.4, 'window 820 ms', 'acc'], ...(t > 3 ? [[43, 'cumulative: stops', 'bad']] : [])] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} orders/s`, 'ABORT=1'); cadeia(o, 'hoje', p[1]); k6(o, 'bpAbort');
          o.cnt = [['WINDOW', '820 ms at ~35/s'], ['CUMULATIVE', '894 ms at 128 s', 'bad'], ['DELAY', '~20 s · ~8/s', 'dim']];
          if (t > 3) T(o, TF(94), 'stopped at 128 s\ncumulative p95 894 ms', 'bad'); } },
      { id: 'plano', dur: 8, title: 'On the "plan", ~250/s; on "plan 2", ~260/s', yk: 'TOPO=360 DUR=4m · "plan" × "plan 2"', code: ['plan: p95 crosses 800 at ~250/s (shard-2)', 'plan 2: ~270 on the ramp, ~260 on the step', 'plan 2: errors at ~300/s (10 × 30, 15 × 20)', 'max. goodput: ~271/s and ~292/s'],
        story: 'On the plan, the target falls at ~250/s: shard-2 gets 60% × 250 = 150/s, its ceiling. With mkt-01 on a 2× dedicated shard, "plan 2" crosses 800 ms at ~270/s on the ramp and ~260/s on the 2 minute step, and errors start at ~300/s, when pedidos and pagamentos reach the limit together.',
        look: 'Two p95 curves: the plan\'s (dim) crosses the line first, "plan 2"\'s (lit) later. On the chain, the dedicated shard shows up next to shard-2.',
        key: 'Each environment breaks at a different link: first the hot shard, then pedidos and pagamentos together.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_PLANO), tone: 'dim', lab: '"plan"' }, { pts: byRate(BP_PLANO2), tone: 'acc', lab: '"plan 2"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'offered/s', marks: t > 4 ? [[250, 'plan 250', 'dim'], [270, 'plan 2', 'acc'], [300, 'errors 300', 'bad']] : [] });
          gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} orders/s`, '1 → 360/s in 4 min'); cadeia(o, 'plano2', p[1]); k6(o, 'bpPlano2'); liveCnt(o, p);
          if (p[4] > 0.1) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, p[4] / 35);
          o.cnt = [['"PLAN"', '~250/s'], ['"PLAN 2"', '~260/s (step)'], ['ERRORS', '~300/s', 'bad']]; } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the generator out of breath', yk: 'THE GENERATOR IS ALSO A SYSTEM', code: ['plan: dropped_iterations 593 (1.4%)', 'vus_max 674 · k6 and simulator on the same machine', 'monitor the generator\'s CPU and vus × maxVUs', 'elastic environment: the HPA hides the limit'],
        story: 'In the plan\'s round k6 stopped sending 593 iterations: the generator fell behind, because it shared the machine with the simulator. When the generator becomes the bottleneck, the offered rate is lower than the script says. Monitor the generator\'s CPU and the VUs near maxVUs. And run without elasticity: with the HPA on, the test finds the limit of the cloud bill.',
        look: 'k6 turns red, with the VUs near the ceiling, and the iterations it did not send pile up in front of it.',
        key: 'If the generator cannot keep up, the test measures the generator.',
        f(o, t) { gen(o, 'ramping-arrival-rate', 'dropped 593', 'VUs 674 of 1,000', null, 'bad'); cadeia(o, 'plano', 300); o.on.gen = 'bad'; k6(o, 'bpPlano');
          if (t > 0.6) o.piles.push({ p: [CX.gen, 336], lab: 'dropped 593', f: clamp((t - 0.6) / 3) * 0.8 });
          o.chart = { type: 'rows', title: 'THE GENERATOR IN THE ROUNDS', max: 700, rows: [['bp "plan"', 593, '593 dropped · vus 674', 'bad'], ['bp "plan 2"', 488, '488 · vus 575', 'bad'], ['estresse', 182, '182 · vus 377', 'acc'], ['bp "today"', 19, '19 · vus 119', 'dim']] };
          o.cnt = [['DROPPED', '593 (1.4%)', 'bad'], ['vus_max', '674', 'dim'], ['MACHINE', 'the simulator\'s own', 'dim']];
          if (t > 1) T(o, TF(94), 'the generator fell behind\n593 iterations', 'bad'); } },
    ],
    jornada: [
      { id: 'mix', dur: 7, title: 'The journey: card 60 · Pix 35 · refund 5', yk: 'THE TEST MIX (DECLARED EXAMPLE)', code: ['article: card 50 · instant 30', '        boleto 15 · refund 5', 'store:   card 60 · Pix 35 · refund 5', 'at 200/s: 120 + 70 + 10 per second'],
        story: 'A test answers one question, and the question defines the mix. The article\'s journey becomes, in the store, card 60%, Pix 35% and refund 5%, a declared example. At 200 orders/s, k6 sends 120 card, 70 Pix and 10 refunds per second.',
        look: 'k6 shows the mix it releases into the chain; on the display, the three bars.',
        key: 'The mix comes from what the customer does, and how often.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '200 orders/s', 'card 60 · Pix 35 · refund 5'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'rows', title: 'THE MIX AT 200 ORDERS/S', max: 100, rows: [['card', 60, '60% · 120/s', 'acc'], ['Pix', 35, '35% · 70/s', 'acc'], ['refund', 5, '5% · 10/s', 'acc']] };
          o.cnt = [['CARD', '120/s'], ['PIX', '70/s', 'dim'], ['REFUND', '10/s', 'dim']]; } },
      { id: 'vus', dur: 7, title: 'VUs are not TPS: 680 VUs for 200/s', yk: 'LITTLE\'S LAW', code: ['VUs = rate × (response + pause)', '(0.4 s + 3 s) × 200/s = 680 VUs', 'README: 800 VUs ÷ 600 TPS = 1.33 s', 'without the pause, the numbers do not convert'],
        story: 'The author\'s report talks about users; the store\'s target is a rate. The bridge is Little\'s Law: VUs = rate × (response + pause). For 200 orders/s, with 0.4 s of response and a 3 s pause (the customer filling in the address), that is 680 VUs. In the open model, k6 fixes the rate and only reserves the VUs it asks for.',
        look: 'In k6, each little square is a VU; few are lit, waiting for a response: most are in the pause.',
        key: 'VUs = rate × (response + pause).',
        f(o, t) { gen(o, '680 VUs', '200 orders/s', '0.4 s + 3 s pause', { n: 60, busy: 0.12 }); cadeia(o, 'plano2', 200);
          o.chart = { type: 'rows', title: 'A VU\'S CYCLE (s)', max: 4, rows: [['response', 0.4, '0.4 s', 'acc'], ['pause', 3, '3 s', 'dim'], ['cycle', 3.4, '3.4 s × 200 = 680 VUs', 'acc']] };
          o.cnt = [['VUs', '680'], ['RATE', '200/s', 'dim'], ['CYCLE', '3.4 s', 'dim']]; } },
      { id: 'pagina', dur: 7, title: 'Page only: 100 req/s per replica, 14 replicas', yk: 'GET /produtos/42 (10 ms OF CPU)', code: ['1 s ÷ 10 ms = 100 req/s per replica', '950 req/s at ρ ≤ 70%:', '950 ÷ 70 = 13.6 → 14 replicas'],
        story: 'The question now is the catalog. A test that hits only GET /produtos/42 measures a page of 10 ms of CPU: 100 req/s per replica. For the plan\'s 950 req/s with ρ up to 70%, that gives 14 replicas.',
        look: 'The catalog in place of the chain, with the 14 replicas lit.',
        key: 'The chosen endpoint decides the measured capacity.',
        f(o, t) { gen(o, 'constant-arrival-rate', '950 req/s', 'GET /produtos/42'); cat(o, 14, 0);
          o.chart = { type: 'rows', title: 'CAPACITY PER REPLICA (req/s)', max: 120, rows: [['page only', 100, '100 req/s · 14 replicas', 'acc']] };
          o.cnt = [['PER REPLICA', '100 req/s'], ['REPLICAS', '14', 'dim']]; } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: 5% search, and the replica drops to 74', yk: 'THE MIX\'S AVERAGE COST', act: ['Add 5% search', 'the expensive endpoint'], code: ['0.95 × 10 + 0.05 × 80 = 13.5 ms', '1 s ÷ 13.5 ms = 74 req/s per replica', '950 ÷ (74 × 0.7) → 19 replicas', 'page-only test: 14 (5 missing)'],
        story: 'Search costs 80 ms of CPU. With 5% searches the average cost goes to 13.5 ms and the replica handles 74 req/s, not 100. For the same 950 req/s that is 19 replicas. Whoever tested only the cheap endpoint sized 14, and the five that are missing only show up on Black Friday.',
        look: 'Five new replicas show up on the catalog, in red: the ones the page test did not see.',
        key: 'Testing only the cheap endpoint gets the capacity wrong; the mix goes into the test.',
        f(o, t) { gen(o, 'constant-arrival-rate', '950 req/s', '95% page · 5% search'); cat(o, 19, 5);
          o.chart = { type: 'rows', title: 'CAPACITY PER REPLICA (req/s)', max: 120, rows: [['page only', 100, '100 req/s · 14 replicas', 'dim'], ['5% search', 74, '74 req/s · 19 replicas', 'bad']] };
          o.cnt = [['PER REPLICA', '74 req/s', 'bad'], ['REPLICAS', '19 (were 14)', 'bad']]; o.res = [['5 replicas would be missing on Black Friday', 'bad']];
          if (t > 1) T(o, TF(364), '5% search: 74 req/s\n14 → 19 replicas', 'bad'); } },
    ],
    pre: [
      { id: 'um', dur: 7, title: '1 pedidos pod: the target falls at ~35/s', yk: 'PRE-TEST: 1 REPLICA, RAMP UP TO 38/s', code: ['pedidos: 1 pod (33 ms → 30/s nominal)', 'pagamentos: 100 pods ("unlimited")', 'p95 323 ms at 33.4/s → 1,371 ms at 36.5/s', 'sustainable at 70%: ~21/s'],
        story: 'The pre-test measures one unit before the whole. With 1 pod on pedidos and everything else plentiful (pagamentos with 100 pods), the ramp up to 38/s showed the p95 at 323 ms at 33.4/s and 1,371 ms at 36.5/s: the target falls at ~35/s, close to the nominal 30. No errors until the end of the ramp.',
        look: 'A single pod on pedidos, which turns red at the end of the ramp; pagamentos unlimited, dark.',
        key: 'First, the capacity of one replica.',
        f(o, t) { pre(o, t, 1); } },
      { id: 'dois', dur: 7, title: '2 pods: the target falls at ~62/s', yk: 'RAMP UP TO 76/s', act: ['Add a pod', '2 pods'], code: ['nominal 2 × 30 = 60/s', 'p95 678 ms at 60.4/s', '     1,485 ms at 66.6/s', 'errors 25.5% at 72.9/s'],
        story: 'With 2 pods, the ramp goes up to 76/s. The target falls at ~62/s (678 ms at 60.4/s, 1,485 ms at 66.6/s) and errors reach 25.5% at 72.9/s. The capacity doubled with the pod.',
        look: 'Two pods on pedidos. On the display, the second curve crosses the target further right.',
        key: 'While pedidos is the link, each pod adds capacity.',
        f(o, t) { pre(o, t, 2); } },
      { id: 'tres', dur: 7, title: '3 pods: ~88/s, about 30 per pod', yk: 'RAMP UP TO 114/s', act: ['Add a pod', '3 pods'], code: ['nominal 3 × 30 = 90/s', 'p95 426 ms at 81.0/s', '     1,024 ms at 90.5/s', 'errors 8.8% at 99.9/s', '1 · 2 · 3 pods → ~35 · ~62 · ~88/s'],
        story: 'With 3 pods the target falls at ~88/s and errors start at 99.9/s. The capacity scales almost linearly, about 30 orders/s per pod, while pedidos is the link.',
        look: 'Three curves, each one crossing the target about 30 orders/s after the previous one.',
        key: 'The capacity scales linearly until the link changes.',
        f(o, t) { pre(o, t, 3); } },
      { id: 'errado', dur: 8, title: 'What if it goes wrong: the link changes to pagamentos', yk: '"TODAY" WITH THE REAL DEPENDENCIES', act: ['Put in the real pagamentos', '2 pods'], code: ['pre-test with 3 pods: goes past 80/s', '"today": pagamentos 2 × 20 = 40/s', 'the target falls at 36/s (2 min step)', 'the link changed: from pedidos to pagamentos'],
        story: 'The pre-test with pagamentos unlimited says 3 pods go past 80/s. With the real dependencies, "today" breaks at 36/s, because pagamentos, with 2 pods of 20/s, becomes the link first. The article says to repeat until the bottleneck moves to the next dependency; this is exactly where it moves.',
        look: 'pagamentos goes back to 2 pods and turns red; pedidos, with 3 pods, has room to spare. On the display, the "today" curve crosses the target much earlier than the 3-pod one.',
        key: 'Unlimited dependencies in the pre-test hide the next link.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(PRE[2]), tone: 'dim', lab: '3 pods, unlimited' }, { pts: byRate(BP_HOJE), tone: 'acc', lab: '"today"' }], { xmax: 115, ymax: 120, xt: [0, 30, 60, 90], xl: 'offered/s', upto: 13, marks: t > 3.5 ? [[36, 'today 36', 'bad'], [88, '3 pods ~88', 'dim']] : [] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} orders/s`, '"today"'); cadeia(o, 'hoje', p[1]); k6(o, 'm36'); liveCnt(o, p);
          o.cnt = [['"TODAY"', '36/s', 'bad'], ['PRE-TEST 3 PODS', '~88/s', 'dim'], ['LINK', 'pagamentos', 'bad']];
          if (t > 2) T(o, TF(449), 'the link changed:\npagamentos 2 × 20 = 40/s', 'bad'); } },
    ],
    relatorio: [
      { id: 'ficha', dur: 8, title: 'The sheet: overview and goals', yk: 'THE README\'S TEMPLATE, FILLED IN', code: ['journey: checkout (POST /pedidos)', 'environment: simulator · k6 v2.3.0', 'goals: p95 ≤ 800 ms · errors ≤ 0.1%', '≥ 200 orders/s (the plan)'],
        story: 'The assessment is the report: goals, scenarios, results and backlog, so engineering and product read the same paper. The sheet starts with the overview (date, journey, version, environment, tool) and the goals: p95 up to 800 ms, errors up to 0.1% and at least 200 orders/s.',
        look: 'On the display, the sheet fills in line by line.',
        key: 'The report is the deliverable of the test.',
        f(o, t) { gen(o, 'checkout.js', '5 scenarios', 'k6 v2.3.0'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'lines', title: 'ASSESSMENT · CHECKOUT', n: 1 + Math.floor(clamp((t - 0.3) / 4) * 5), lines: [['date       10/20–21/2026', 'hi'], ['journey    checkout (POST /pedidos)', 'hi'], ['environment simulator · tool k6 v2.3.0', 'hi'],
            ['goals      p95 ≤ 800 ms · errors ≤ 0.1% · ≥ 200/s', 'acc'], ['scenarios  pre-test · average · spike · stress · breakpoint', 'hi']] };
          o.cnt = [['GOALS', 'p95 ≤ 800 · errors ≤ 0.1%'], ['RATE', '≥ 200/s', 'dim']]; } },
      { id: 'resultados', dur: 10, title: 'The five results', yk: 'CONCLUSIONS AND BACKLOG', act: ['Fill in the results', 'the five'], code: ['1 "today": 36/s (target) · ~42 (errors) · 40 → 26', '2 plan: ~250/s, mkt-01\'s hot shard', '3 plan 2: ~260/s (target) · ~300 (errors)', '4 nothing inside pedidos', '5 pending: PSP, cache, HPA, searches, Kafka'],
        story: 'The conclusions, with the real tests. One: "today" breaks at 36 orders/s by the target and at ~42 by the errors, with the goodput dropping from 40 to 26. Two: the plan breaks at ~250/s, because of the hot shard; the action is the dedicated shard. Three: with it, the target falls at ~260/s and the errors at ~300/s. Four: the test found nothing inside pedidos. Five: the pending items the test does not cover.',
        look: 'The five lines light up one by one on the display.',
        key: 'Each conclusion comes from a measurement and becomes a backlog item.',
        f(o, t) { gen(o, 'checkout.js', '5 scenarios', 'k6 v2.3.0'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'lines', title: 'CONCLUSIONS', n: 1 + Math.floor(clamp((t - 0.3) / 6) * 5), lines: [['1 "today": 36/s (target) · ~42 (errors) · goodput 40 → 26', 'bad'], ['2 "plan": ~250/s, the hot shard → dedicated shard', 'bad'],
            ['3 "plan 2": ~260/s (target) · ~300/s (errors)', 'acc'], ['4 nothing inside pedidos', 'hi'], ['5 missing: real PSP, cache, replicas, HPA, searches, Kafka', 'dim']] };
          o.cnt = [['"TODAY"', '36/s'], ['"PLAN"', '~250/s', 'bad'], ['"PLAN 2"', '~260/s', 'dim']]; } },
      { id: 'ficha23', dur: 8, title: 'Module 23\'s sheet, corrected', yk: 'THE PLAN\'S MARGIN IN NUMBERS', code: ['sustainable 210/s (ρ ≤ 70%): stays as policy', 'the target falls at ~260/s', '260 ÷ 210: conservative by ~24%', '200/s target: ~30% headroom (260 ÷ 200)'],
        story: 'The plan\'s sheet is corrected with the numbers. The sustainable 210/s was the ρ up to 70% policy, and it stays as an operating rule. The point where the target falls is ~260/s: the sheet was conservative by ~24%, and the 200/s target has ~30% headroom up to the break.',
        look: 'On the display, the marks side by side: 200 (the target), 210 (the policy), ~260 (the measured break) and 300 (the nominal).',
        key: 'The test turns the plan\'s margin into a number.',
        f(o, t) { gen(o, 'checkout.js', '"plan 2"', 'k6 v2.3.0'); cadeia(o, 'plano2', 260); k6(o, 'bpPlano2');
          o.chart = { type: 'rows', title: 'THE PLAN IN ORDERS/S', max: 320, rows: [['target', 200, '200/s', 'acc'], ['sustainable', 210, '210/s (ρ ≤ 70%)', 'dim'], ['break', 260, '~260/s (measured)', 'acc'], ['nominal', 300, '300/s (math)', 'dim']] };
          o.cnt = [['HEADROOM', '~30%'], ['SHEET', 'conservative by ~24%', 'dim']]; } },
      { id: 'misto', dur: 9, title: 'What if it goes wrong: the 11 PM report and the single pool', yk: 'pool.js: THREE FLOWS, ONE POOL OF 20', act: ['Run the mixed scenario', 'pool.js'], code: ['checkout 10/s · status 40/s', '11 PM report: 10/s of 4 s (20–50 s)', 'checkout: 503 on 33% (83 of 250)', 'status: 503 on 10% (101 of ~1,000)', 'outside the window: 0%'],
        story: 'The assessment only sees what the test covered. checkout.js measures one flow; at 11 PM the mkt-01 report runs, and the order status is queried all the time. The mixed scenario puts the three against a single pool of 20 connections. In the report window, 1 in 3 checkout orders got a 503, and 10% of the status queries too. Outside it, 0%.',
        look: 'The 20-connection pool fills up with the report, in red; the checkout and the status are left without a slot, and the pile of 503s grows.',
        key: 'The test only sees what the script covers: one flow knocks over another by sharing the pool.',
        f(o, t) { const on = t > 1.2, fill = on ? Math.min(20, Math.round((t - 1.2) * 8)) : 0;
          gen(o, 'pool.js', '3 scenarios · 60/s', on ? 'report: 10/s of 4 s' : 'before 11 PM', null, on ? 'bad' : 2);
          o.show.pool = 1; o.on.pool = fill >= 20 ? 'bad' : 1;
          o.rows.pool = { ...act('pedidos pool', '20 connections', ['checkout 10/s · status 40/s', 'dim'], [on ? `report: ${fill} of 20` : 'report: 0', on ? 'bad' : 'dim']), slots: { n: 20, r: fill } };
          o.beams.push({ pts: BM.g2c, on: true, tone: on ? 'bad' : '', n: 3 });
          if (fill >= 20) pile(o, 'pool', '503 · 33%', clamp((t - 3.7) / 3));
          k6(o, 'pool');
          o.chart = { type: 'rows', title: 'IN THE 25–50 s WINDOW: 503', max: 100, rows: [['checkout', 33, '33% (83 of 250)', 'bad'], ['status', 10, '10% (101 of ~1,000)', 'bad'], ['report', 53, '53% refused', 'dim'], ['outside the window', 0, '0%', 'acc']] };
          o.cnt = [['CHECKOUT 503', on && fill >= 20 ? '33%' : '0%', 'bad'], ['STATUS 503', on && fill >= 20 ? '10%' : '0%', 'bad'], ['POOL', `${fill} of 20 with the report`, 'dim']];
          o.res = [['one flow knocked over the other (module 25)', 'bad']];
          if (fill >= 20) T(o, TF(364), 'pool full of report\n1 in 3 checkouts: 503', 'bad'); } },
    ],
  };
  // gráficos e pedaços repetidos
  function MODEL(n) { return { type: 'rows', title: 'COMPLETED/S × ERRORS', max: 60, mark: { v: 40, lab: 'capacity ~40' },
    rows: [['20 VUs', 38.1, '38.1/s · 0%', 'acc'], ['60 VUs', 41.1, '41.1/s · 8.35%', 'bad'], ['open 54/s', 25.9, '~26/s · 52%', 'bad']].slice(0, n) }; }
  function est(o, t, a, b) {
    const p = series(o, t, [{ pts: EST, tone: 'acc' }], { xmax: 300, ymax: 320, xt: [0, 100, 200, 300], xl: 's', time: true, reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / EST.length, upto: EST.length });
    gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} orders/s`, '"plan 2" · staircase'); cadeia(o, 'plano2', p[1]); liveCnt(o, p, true);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4])}%`, 0.2 + p[4] / 8);
    if (p[3] > 800 && p[1] >= 250) T(o, TF(364), `${Math.round(p[1])}/s: p95 ${ms(p[3])}`, 'bad');
  }
  function spk(o, t, a, b) {
    const p = series(o, t, [{ pts: SPIKE, tone: 'acc' }], { xmax: 200, ymax: 70, xt: [0, 50, 100, 150, 200], xl: 's', time: true, reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / SPIKE.length, upto: SPIKE.length });
    gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} orders/s`, '"today" · spike'); cadeia(o, 'hoje', p[1]); liveCnt(o, p, true);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, 0.2 + p[4] / 80);
  }
  function bph(o, t, a, b, marks) {
    const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'offered/s', reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / BP_HOJE.length, upto: BP_HOJE.length, marks });
    gen(o, 'ramping-arrival-rate', `${dec(p[1])} orders/s`, '1 → 60/s in 3 min'); cadeia(o, 'hoje', p[1]); liveCnt(o, p);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, 0.15 + p[4] / 60);
  }
  function pre(o, t, n) {
    const L3 = [{ pts: byRate(PRE[0]), lab: '1 pod' }, { pts: byRate(PRE[1]), lab: '2 pods' }, { pts: byRate(PRE[2]), lab: '3 pods' }].slice(0, n).map((s, i) => ({ ...s, tone: i === n - 1 ? 'acc' : 'dim' }));
    const p = series(o, t, L3, { xmax: 115, ymax: 120, xt: [0, 30, 60, 90], xl: 'offered/s', marks: t > 4 ? [[[35, 62, 88][n - 1], `${n} ${n > 1 ? 'pods' : 'pod'} ~${[35, 62, 88][n - 1]}`, 'acc']] : [] });
    gen(o, 'ramping-arrival-rate', `${dec(p[1])} orders/s`, `ramp up to ${38 * n}/s`); cadeia(o, 'hoje', p[1], { env: { ped: n, pag: 100 } }); k6(o, 'pre' + n); liveCnt(o, p);
    o.cnt = [['THE TARGET FALLS AT', `~${[35, 62, 88][n - 1]}/s`], ['NOMINAL', `${30 * n}/s`, 'dim'], ...o.cnt.slice(0, 2)];
    if (p[4] > 0.1) pile(o, 'ped', `504 · ${dec(p[4], 0)}%`, p[4] / 30);
  }
  function cat(o, n, bad) { o.show.cat = 1; o.on.cat = bad ? 'bad' : 1;
    o.rows.cat = { ...act('catalogo', `${n} replicas`, ['page 10 ms · search 80 ms', 'dim'], [bad ? '74 req/s per replica' : '100 req/s per replica', bad ? 'bad' : 'acc']), pods: { n, bad, tone: 'acc' } };
    o.beams.push({ pts: BM.g2c, on: true, n: 3 }); }

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
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  const sqOff = () => theme === 'light' ? '#d4d6d6' : '#2a2c2e';
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, sm = Bk.kind === 'shard';
    head(x, u, d, W_, col, sm ? 12 : Bk.kind === 'gen' ? 16 : 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
    let y = sm ? 31 : 33; for (const [text, tnn] of d.rows || []) { x.fillStyle = toneC(tnn); fitFont(x, u, text, sm ? 11 : 12, W_ - 10); x.fillText(text, u(5), u(y)); y += sm ? 15 : 17; }
    // VUs do gerador: quadradinhos acesos = esperando a resposta
    if (d.vu) { const n = d.vu.n, per = n > 20 ? 30 : 20, sz = (W_ - 10) / per, rows = Math.ceil(n / per), y0 = H_ - 5 - rows * sz, busy = Math.round(n * d.vu.busy);
      for (let i = 0; i < n; i++) { const cx = 5 + (i % per) * sz, cy = y0 + Math.floor(i / per) * sz; x.fillStyle = i < busy ? accC() : sqOff(); x.fillRect(u(cx + 0.6), u(cy + 0.6), u(sz - 1.2), u(sz - 1.2)); } }
    // pods (ou réplicas) do serviço
    if (d.pods) { const p = d.pods;
      if (p.inf) { x.fillStyle = INK(); fitFont(x, u, '∞ pods', 11, W_ - 10); x.fillText('∞ pods', u(5), u(H_ - 9)); }
      else { const n = p.n, per = Math.max(n, 10), sz = Math.min(9, (W_ - 10) / per);
        for (let i = 0; i < n; i++) { const bad = p.bad && i >= n - p.bad; x.fillStyle = bad ? BAD() : p.tone === 'bad' ? BAD() : p.tone === 'acc' ? accC() : INK();
          x.fillRect(u(5 + i * sz + 0.7), u(H_ - 5 - sz + 0.7), u(sz - 1.4), u(sz - 1.4)); } } }
    // as 20 conexões do pool: as do relatório em vermelho
    if (d.slots) { const n = d.slots.n, sz = (W_ - 10) / n;
      for (let i = 0; i < n; i++) { x.fillStyle = i < d.slots.r ? BAD() : i < d.slots.r + 3 ? accC() : sqOff(); x.fillRect(u(5 + i * sz + 0.8), u(H_ - 6 - sz * 1.4), u(sz - 1.6), u(sz * 1.4)); } }
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 11, W_ - 4); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = PL;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? pl.lab : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), ch = o.chart;
    const key = JSON.stringify([o.k6, o.live, ch, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P, Hd = cv.c.height / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const txt = (t, X, Y, size, mw, col, al = 'left') => { x.textAlign = al; x.fillStyle = col; fitFont(x, u, t, size, mw); x.fillText(t, u(X), u(Y)); x.textAlign = 'left'; };
    const tone = t => t === 'bad' ? BAD() : t === 'acc' ? acc : t === 'dim' ? INK() : C.inkHi;
    // coluna da esquerda: o resumo do k6 (ou a janela ao vivo)
    let L0 = 8;
    if (o.live || o.k6) { L0 = 158;
      if (o.live) { txt('LIVE · ' + o.live.t.toUpperCase(), 8, 9, 8, 142, INK()); const st = o.live.rows.length > 4 ? 22.5 : 27;
        o.live.rows.forEach(([l, v, tn_], i) => { const Y = 25 + i * st; txt(l, 8, Y, 8, 70, INK()); txt(v, 8, Y + 10.5, 11.5, 142, tn_ === 'bad' ? BAD() : tn_ === 'acc' ? acc : C.inkHi); }); }
      else { const k = o.k6, okP = k.p < 800, okF = k.fail === '0.00%';
        txt('k6 · ' + k.t, 8, 10, 8.6, 142, acc);
        const rows = [['http_reqs', k.reqs, 'hi'], ['avg', k.avg, 'hi'], ['p(95)', k.p95 + (okP ? ' ✓' : ' ✗'), okP ? 'acc' : 'bad'], ['p(99)', k.p99, 'hi'],
          ['http_req_failed', k.fail + (okF ? ' ✓' : ' ✗'), okF ? 'acc' : 'bad'], ['dropped_iterations', k.drop, k.drop !== '0' ? 'bad' : 'hi'], ['exit', String(k.exit) + (k.note ? ' (' + k.note + ')' : ''), k.exit ? 'bad' : 'acc']];
        rows.forEach(([l, v, tn_], i) => { const Y = 26 + i * 15.5; txt(l, 8, Y, 8.2, 78, INK()); txt(v, 89, Y, 9.2, 60, tone(tn_)); }); }
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(Hd - 6)); x.stroke(); }
    const R = Wd - 8, AW = R - L0;
    if (!ch) {   // sem gráfico: a conta do passo
      txt(s.yk || 'THE MATH', L0, 10, 8.4, AW, INK());
      s.code.slice(0, 6).forEach((l, i) => txt(l, L0, 26 + i * 14, 9, AW, C.inkHi));
      if (o.res.length) o.res.slice(0, 1).forEach(([l, tn_]) => txt(l, L0, Hd - 12, 9.4, AW, tone(tn_)));
    } else if (ch.type === 'rows') {
      txt(ch.title, L0, 10, 8.4, AW, INK());
      const lw = 62, bx = L0 + lw, bw = AW - lw, rh = Math.min(24, (Hd - 30) / ch.rows.length);
      if (ch.mark) { const mx = bx + bw * ch.mark.v / ch.max; x.setLineDash([u(2.5), u(2)]); x.strokeStyle = INK(); x.lineWidth = u(0.8);
        x.beginPath(); x.moveTo(u(mx), u(20)); x.lineTo(u(mx), u(24 + rh * ch.rows.length)); x.stroke(); x.setLineDash([]);
        txt(ch.mark.lab, Math.min(mx, R - 2), 10, 8, 80, INK(), mx > R - 50 ? 'right' : 'center'); }
      ch.rows.forEach(([l, v, tx, tn_], i) => { const Y = 28 + i * rh + rh * 0.3, col = tone(tn_);
        txt(l, L0, Y, 8.6, lw - 4, INK());
        x.fillStyle = sqOff(); x.fillRect(u(bx), u(Y - 5.5), u(bw), u(11));
        x.fillStyle = col; x.fillRect(u(bx), u(Y - 5.5), u(bw * clamp(v / ch.max)), u(11));
        const inside = v / ch.max > 0.55; txt(tx, inside ? bx + 4 : bx + bw * clamp(v / ch.max) + 4, Y, 8.6, inside ? bw - 8 : bw * (1 - clamp(v / ch.max)) - 6, inside ? (theme === 'light' ? '#f6f6f5' : '#141516') : col); });
    } else if (ch.type === 'lines') {
      txt(ch.title, L0, 10, 8.4, AW, INK());
      ch.lines.slice(0, ch.n).forEach(([l, tn_], i) => txt(l, L0, 27 + i * 17, 9.4, AW, tone(tn_)));
    } else if (ch.type === 'shapes') {
      txt('THE FIVE LOAD SHAPES (RATE × TIME)', L0, 10, 8.4, AW, INK());
      const pw = AW / 5;
      SHAPES.forEach(([nm, rate, q, pts], i) => { const X0 = L0 + i * pw + 3, X1 = X0 + pw - 9, Y0 = 46, Y1 = 98, lit = i < ch.n, col = lit ? (i === ch.n - 1 ? acc : C.inkHi) : C.line;
        txt(nm, X0, 24, 9.6, pw - 8, lit ? col : INK()); txt(rate, X0, 35, 8, pw - 8, INK());
        x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(X0), u(Y0 - 2)); x.lineTo(u(X0), u(Y1)); x.lineTo(u(X1), u(Y1)); x.stroke();
        if (lit) { x.strokeStyle = col; x.lineWidth = u(1.8); x.beginPath(); pts.forEach(([a, b], j) => { const X = u(X0 + a * (X1 - X0)), Y = u(Y1 - b * (Y1 - Y0)); j ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
          txt(q, X0, 112, 8, pw - 6, i === ch.n - 1 ? acc : INK()); } });
    } else if (ch.type === 'series') {
      // em cima: p95 (0 a 2 s) contra a meta; embaixo: oferecida (tracejada), concluídos (acesa) e erros (barras)
      const X0 = L0 + 24, X1 = R - 4, T0 = 20, T1 = 64, B0 = 78, B1 = 116, px = v => X0 + clamp(v / ch.xmax) * (X1 - X0), pyT = v => T1 - clamp(v / 2000) * (T1 - T0), pyB = v => B1 - clamp(v / ch.ymax) * (B1 - B0);
      x.strokeStyle = C.line; x.lineWidth = u(0.5);
      [[T0, T1], [B0, B1]].forEach(([a, b]) => { x.beginPath(); x.moveTo(u(X0), u(a - 2)); x.lineTo(u(X0), u(b)); x.lineTo(u(X1), u(b)); x.stroke(); });
      txt('p95', L0, 10, 8.4, 30, INK()); txt('2 s', X0 - 3, T0, 7.6, 22, INK(), 'right'); txt('0', X0 - 3, T1, 7.6, 22, INK(), 'right');
      x.setLineDash([u(2.5), u(2)]); x.strokeStyle = BAD(); x.lineWidth = u(0.8); x.beginPath(); x.moveTo(u(X0), u(pyT(800))); x.lineTo(u(X1), u(pyT(800))); x.stroke(); x.setLineDash([]);
      txt('target 800 ms', X1, pyT(800) - 5, 7.4, 60, BAD(), 'right');
      txt(`${ch.ymax}/s`, X0 - 3, B0, 7.6, 24, INK(), 'right'); txt('0', X0 - 3, B1, 7.6, 22, INK(), 'right');
      ch.xt.forEach(v => txt(String(v), px(v), B1 + 7, 7.6, 30, INK(), 'center')); txt(ch.xl, X1, B1 + 16, 7.6, 80, INK(), 'right');
      // legenda embaixo, à esquerda do eixo x
      txt('— completed  ┄ offered  ▮ errors', X0, B1 + 16, 7.4, X1 - X0 - 70, INK());
      const main = ch.list[ch.list.length - 1], n = ch.n;
      ch.list.forEach((S, si) => { const pts = si === ch.list.length - 1 ? S.pts.slice(0, n) : S.pts, col = S.tone === 'dim' ? INK() : acc;
        x.strokeStyle = col; x.lineWidth = u(S.tone === 'dim' ? 1 : 1.6); x.beginPath(); pts.forEach((p, j) => { const X = u(px(p[0])), Y = u(pyT(p[3])); j ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
        if (S.tone !== 'dim') pts.forEach(p => { x.fillStyle = p[3] > 800 ? BAD() : acc; x.beginPath(); x.arc(u(px(p[0])), u(pyT(p[3])), u(1.6), 0, Math.PI * 2); x.fill(); });
        if (S.lab && ch.list.length > 1) { const lp = pts[Math.min(pts.length - 1, Math.floor(pts.length * 0.42))]; txt(S.lab, px(lp[0]), pyT(lp[3]) - 6, 7.4, 70, col, 'center'); } });
      const pts = main.pts.slice(0, n), bw = Math.max(1.5, (X1 - X0) / main.pts.length * 0.5);
      pts.forEach(p => { if (p[4] > 0) { x.fillStyle = BAD(); const h = clamp(p[4] / 100) * (B1 - B0); x.fillRect(u(px(p[0]) - bw / 2), u(B1 - h), u(bw), u(h)); } });
      x.setLineDash([u(2), u(1.6)]); x.strokeStyle = INK(); x.lineWidth = u(0.9); x.beginPath(); pts.forEach((p, j) => { const X = u(px(p[0])), Y = u(pyB(p[1])); j ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke(); x.setLineDash([]);
      x.strokeStyle = acc; x.lineWidth = u(1.6); x.beginPath(); pts.forEach((p, j) => { const X = u(px(p[0])), Y = u(pyB(p[2])); j ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.stroke();
      (ch.marks || []).forEach(([v, lab, tn_], i) => { const X = px(v), col = tone(tn_); x.strokeStyle = col; x.lineWidth = u(0.9); x.setLineDash([u(1.5), u(1.5)]);
        x.beginPath(); x.moveTo(u(X), u(T0 - 2)); x.lineTo(u(X), u(B1)); x.stroke(); x.setLineDash([]);
        txt(lab, X, i % 2 ? (T1 + B0) / 2 : 10, 7.6, 64, col, X > X1 - 30 ? 'right' : X < X0 + 30 ? 'left' : 'center'); });
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = b => b ? ' class="on"' : '';
  const DATA = {
    perfis: () => `<table class="h3-sum"><tr><th>type</th><th>shape</th><th>in the store</th></tr><tr${on_(step === 0)}><td>smoke</td><td>few VUs</td><td>2/s × 30 s: 61 reqs, p95 156 ms</td></tr><tr><td>average load</td><td>the expected</td><td>30/s × 2 min: p95 381 ms</td></tr><tr><td>stress</td><td>steps above</td><td>100 → 300/s on plan 2</td></tr><tr><td>spike</td><td>jump and back</td><td>5 → 60/s in 10 s: 47–65% errors</td></tr><tr${on_(step >= 2)}><td>breakpoint</td><td>ramp until it breaks</td><td>1 → 60/s ("today"), 1 → 360/s ("plan")</td></tr></table><li>"Today": pedidos 3 pods (30/s each), pagamentos 2 (20/s each), estoque 2, 3 shards of 150/s</li><li>"Plan": pedidos 10, pagamentos 15, 3 shards; "plan 2": + the 2× dedicated shard for <code>mkt-01</code></li><li>Test mix: 40% <code>mkt-01</code> (→ <code>shard-2</code>, which ends up with 60%) and 60% spread out</li><li>Simulator: each pod is a FIFO queue with exponential time; <code>lb-loja</code> on round robin; 2 s deadline → 504</li>`,
    modelo: () => `<table class="h3-sum"><tr><th>generator</th><th>throughput</th><th>average</th><th>p95</th><th>errors</th></tr><tr${on_(step === 0)}><td>closed, 20 VUs</td><td>38.1/s</td><td>520 ms</td><td>1.07 s</td><td>0%</td></tr><tr${on_(step === 1)}><td>closed, 60 VUs</td><td>41.1/s</td><td>1.43 s</td><td>2 s</td><td>8.35%</td></tr><tr${on_(step === 2)}><td>open, 54/s</td><td>~26/s</td><td>med. 2 s</td><td>2 s</td><td>52%</td></tr></table><li>Little with 20 VUs: 20 = 38.07 × 0.520 s</li><li>VUs = rate × (response + pause): 800 ÷ 600 = <b>1.33 s</b> of cycle; 200/s with 0.4 + 3 s = <b>680 VUs</b></li><li>Both closed ones ended with <code>exit 99</code> (the p95 went past 800 ms), but only the 60 VU one had errors</li><li><i>Coordinated omission</i>: k6 documentation, "Open and closed models"</li>`,
    smoke: () => `<table class="h3-sum"><tr><th>metric</th><th>value</th></tr><tr><td>requests</td><td>61</td></tr><tr><td>avg · med</td><td>81.9 · 78.2 ms</td></tr><tr><td>p90 · p95</td><td>138.0 · 155.6 ms</td></tr><tr><td>p99 · max.</td><td>213.7 · 247.5 ms</td></tr><tr${on_(step === 1)}><td>errors · exit</td><td>0% · 0</td></tr></table><li>No queue: 33 + 50 + 2 + 6.67 = <b>91.7 ms</b></li><li><code>lena-77</code> → <code>murmur3 mod 3</code> = 1 → <code>shard-1</code>; <code>mkt-01</code> → <code>shard-2</code></li><li>Module 22 shipping: 49.00 × 64.00, and the 201 does not check it</li><li>k6: "few VUs; more than 5 is already a mini-load"</li>`,
    media: () => `<table class="h3-sum"><tr><th>round</th><th>avg</th><th>p95</th><th>p99</th><th>errors</th></tr><tr${on_(step <= 1)}><td>"today" 30/s</td><td>157.5</td><td>381.3</td><td>498.6</td><td>0%</td></tr><tr><td>"today" 33/s</td><td>186</td><td>431</td><td>626</td><td>0%</td></tr><tr${on_(step === 2)}><td>"today" 36/s</td><td>334</td><td>798</td><td>980</td><td>0%</td></tr><tr${on_(step === 3)}><td>"plan" 125/s</td><td>109.9</td><td>247.2</td><td>357.4</td><td>0%</td></tr></table><li>Times in ms; 33/s and 36/s are 2 min steps (steady state)</li><li>M/M/1 at 30/s: 49 + 200 + 2 + 7 ≈ <b>259 ms</b>; k6 measured <b>157.5</b></li><li>2027 average: 200 × 400 ÷ 640 = <b>125/s</b>; <code>shard-2</code> gets 75 of 150 (50%)</li>`,
    estresse: () => `<table class="h3-sum"><tr><th>level</th><th>p95 (windows)</th><th>errors</th><th>completed</th></tr><tr${on_(step === 0)}><td>100/s</td><td>208–232 ms</td><td>0%</td><td>~100</td></tr><tr${on_(step === 1)}><td>200/s (the target)</td><td>334–406 ms</td><td>0%</td><td>~200</td></tr><tr${on_(step === 2)}><td>250/s</td><td>504–738 ms</td><td>0%</td><td>~250</td></tr><tr${on_(step === 3)}><td>300/s</td><td>1,497–2,000 ms</td><td>0.7–5.1%</td><td>280–293</td></tr><tr${on_(step === 4)}><td>back to 100/s</td><td>244 ms (2nd window)</td><td>0%</td><td>100</td></tr></table><li>Total: 59,567 requests, avg 419 ms, p95 1.48 s, p99 1.92 s, failures 0.54%, <code>dropped_iterations</code> 182, <code>exit 99</code></li><li>"Today", above the ceiling: 45.2 → 40.6/s; 51.8 → 29.1/s; 58.4 → 25.5/s completed</li>`,
    spike: () => `<table class="h3-sum"><tr><th>phase</th><th>p95</th><th>errors</th><th>goodput</th></tr><tr${on_(step === 0)}><td>base 5/s</td><td>164–225 ms</td><td>0%</td><td>5/s</td></tr><tr${on_(step === 1)}><td>jump 5 → 60</td><td>1.05 s</td><td>0%</td><td>27/s</td></tr><tr${on_(step === 2)}><td>top 60/s</td><td>2 s</td><td>47–65%</td><td>21–30/s</td></tr><tr${on_(step === 4)}><td>back to 5/s</td><td>168 ms (1st window)</td><td>0%</td><td>5/s</td></tr></table><li>Total: 4,828 requests, 42.58% failures, <code>dropped_iterations</code> 21, <code>exit 99</code></li><li>Module 14 HPA: ~60 s → 20/s × 60 s = <b>1,200</b> orders unserved</li><li>Pre-scaling with 4 pods on pagamentos: <b>math</b>, not run in the lab</li>`,
    breakpoint: () => `<table class="h3-sum"><tr><th>offered</th><th>completed</th><th>p95</th><th>errors</th></tr><tr${on_(step === 0)}><td>32.1/s</td><td>32.8</td><td>357 ms</td><td>0%</td></tr><tr${on_(step === 1)}><td>38.7/s</td><td>36.3</td><td>932 ms</td><td>0%</td></tr><tr${on_(step === 2)}><td>42.0/s</td><td>37.2</td><td>2,001 ms</td><td>6.8%</td></tr><tr${on_(step === 3)}><td>45.2/s</td><td>40.6</td><td>2,000 ms</td><td>6.5%</td></tr><tr${on_(step === 3)}><td>58.4/s</td><td>25.5</td><td>2,002 ms</td><td>55.4%</td></tr></table><li>"Today": target at <b>36/s</b> (step: p95 798 ms) · errors at ~42/s · goodput drops to ~26/s</li><li>"Plan": ~250/s (<code>shard-2</code> at 150/s); "plan 2": ~260/s on the step, errors at ~300/s</li><li>ABORT=1: stopped at <b>128 s</b> with a cumulative p95 of 894 ms; by window, 820 ms at 100–110 s</li><li>Ramp × step: the 3–4 min ramp is ~4% optimistic; the step confirms</li>`,
    jornada: () => `<table class="h3-sum"><tr><th>question</th><th>in the store</th></tr><tr><td>traffic today</td><td>30 orders/s (Black Friday 2026)</td></tr><tr><td>goals</td><td>p95 ≤ 800 ms, errors ≤ 0.1%, ρ ≤ 70%</td></tr><tr><td>growth</td><td>45 · 200 · 300 orders/s</td></tr><tr${on_(step === 0)}><td>journey</td><td>card 60 · Pix 35 · refund 5</td></tr><tr${on_(step >= 2)}><td>cheap × expensive</td><td>page 10 ms · search 80 ms</td></tr></table><li>VUs = rate × (response + pause) = (0.4 + 3) × 200 = <b>680</b></li><li>5% search: 0.95 × 10 + 0.05 × 80 = 13.5 ms → 74 req/s; 950 req/s at 70% → <b>19</b> replicas (were 14)</li>`,
    pre: () => `<table class="h3-sum"><tr><th>pedidos pods</th><th>nominal</th><th>target falls at</th><th>first errors</th></tr><tr${on_(step === 0)}><td>1</td><td>30/s</td><td>~35/s</td><td>none up to 38/s</td></tr><tr${on_(step === 1)}><td>2</td><td>60/s</td><td>~62/s</td><td>72.9/s (25.5%)</td></tr><tr${on_(step === 2)}><td>3</td><td>90/s</td><td>~88/s</td><td>99.9/s (8.8%)</td></tr><tr${on_(step === 3)}><td>"today" (pagamentos 2)</td><td>40/s</td><td>36/s</td><td>~42/s</td></tr></table><li>Pre-test with pagamentos on 100 pods ("unlimited") and plenty of shards</li><li>Async validation: <code>entregas</code> consumes 40 events/s per partition with the queue full, without dying</li>`,
    relatorio: () => `<table class="h3-sum"><tr><th>scenario</th><th>result</th></tr><tr><td>pre-test</td><td>~35 · ~62 · ~88/s (1, 2, 3 pods)</td></tr><tr><td>average "today" 30/s</td><td>p95 381 ms, 0%</td></tr><tr><td>spike 5 → 60/s</td><td>47–65% errors at the top</td></tr><tr><td>stress plan 2</td><td>target up to 250/s; 300/s fails</td></tr><tr${on_(step === 1)}><td>breakpoint plan</td><td>~250/s (hot shard)</td></tr></table><li>Mixed scenario (<code>pool.js</code>), single pool of 20: checkout 503 on <b>33%</b> (83 of 250), status on <b>10%</b> (101 of ~1,000), report 53% refused; outside the window, 0%</li><li><code>pool.js</code>'s summary gave a p95 of 56 ms and <code>exit 0</code> (no thresholds): the aggregate hides the 1 in 3</li><li>Module 25: the same scenario with the pool split 16 + 4 → 0% of 503 for the customer</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (subir a taxa, trocar o cliente, pôr um pod…) e leva até ele
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>\n      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${(i + 1) % 10}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>\n      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>\n      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'carga') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'carga' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-carga3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'carga') return;
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
    nDot = 0; setBeams(o.beams);
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
      const [x0, x1, y0, y1] = [0, 950, 8, 470];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn_ = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.86 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn_ * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn_ * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.47 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn_ * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn_);
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
    if (/^[0-9]$/.test(e.key)) return setSc(SC[(+e.key + 9) % 10]);
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
    view: NARROW() ? { target: W(475, 240, -150), dist: innerWidth < 640 ? 15.5 : 18.5 } : { target: W(190, 240, 60), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–9, 0 · drag to rotate' };
})() });
