// Figura 3D (iso-glow): o teste de carga do checkout. O gerador (k6), à esquerda, solta os pedidos (pontos de luz) na cadeia
// pedidos → pagamentos → estoque → banco (o anel de shards: shard-0, shard-1, shard-2 e o dedicado do mkt-01 no "plano 2").
// Cada bloco mostra os pods, a capacidade nominal e a carga; o que não cabe vira pilha de 504 na frente do elo.
// Atrás, o mostrador: à esquerda o resumo do k6 (http_reqs, avg, p95, p99, http_req_failed, dropped_iterations, exit) ou o
// contador da janela ao vivo; à direita o gráfico (p95 contra a meta de 800 ms em cima; taxa oferecida, goodput e erros embaixo).
// Cenários (toggle e ?mode=perfis|modelo|smoke|media|estresse|spike|breakpoint|jornada|pre|relatorio; ?step=N abre no passo N).
// Dados: o lab k6 real do módulo (public/labs/testes-de-carga/lab/: resultados-k6.txt e os *.txt de cada rodada) e a história
// canônica (docs/escrita/testes-de-carga-brief.md). As janelas de 10 s, os resumos e os códigos de saída são os medidos.
FIGS3D.push({ id: 'carga', name: 'Testes de carga', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  const pc = u => Math.round(u * 100) + '%';
  const ms = v => v >= 2000 ? '2 s' : thou(v) + ' ms';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['perfis', 'modelo', 'smoke', 'media', 'estresse', 'spike', 'breakpoint', 'jornada', 'pre', 'relatorio'];
  const SCNAME = { perfis: 'Perfis', modelo: 'Modelo', smoke: 'Smoke', media: 'Média', estresse: 'Estresse', spike: 'Spike', breakpoint: 'Breakpoint', jornada: 'Jornada', pre: 'Pré-teste', relatorio: 'Relatório' };
  const SCFULL = { perfis: 'As formas de carga', modelo: 'Modelo aberto × fechado', smoke: 'O smoke', media: 'A carga média', estresse: 'O estresse',
    spike: 'O spike', breakpoint: 'O ponto de quebra', jornada: 'Jornada e mix', pre: 'O pré-teste', relatorio: 'O relatório' };
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
    smoke: { t: 'smoke · "hoje"', reqs: '61', avg: '81,9 ms', p95: '155,6 ms', p: 156, p99: '213,7 ms', fail: '0,00%', drop: '0', exit: 0 },
    media: { t: 'media 30/s · "hoje"', reqs: '3.601', avg: '157,5 ms', p95: '381,3 ms', p: 381, p99: '498,6 ms', fail: '0,00%', drop: '0', exit: 0 },
    m33: { t: 'degrau 33/s · "hoje"', reqs: '3.960', avg: '186,1 ms', p95: '430,7 ms', p: 431, p99: '625,8 ms', fail: '0,00%', drop: '0', exit: 0 },
    m36: { t: 'degrau 36/s · "hoje"', reqs: '4.320', avg: '333,5 ms', p95: '798,1 ms', p: 798, p99: '979,7 ms', fail: '0,00%', drop: '0', exit: 0 },
    mPlano: { t: 'media 125/s · "plano"', reqs: '15.001', avg: '109,9 ms', p95: '247,2 ms', p: 247, p99: '357,4 ms', fail: '0,00%', drop: '0', exit: 0 },
    f20: { t: 'fechado · 20 VUs', reqs: '2.319', avg: '520,4 ms', p95: '1,07 s', p: 1070, p99: '1,21 s', fail: '0,00%', drop: '0', exit: 99 },
    f60: { t: 'fechado · 60 VUs', reqs: '2.549', avg: '1,43 s', p95: '2 s', p: 2000, p99: '2 s', fail: '8,35%', drop: '0', exit: 99 },
    bpHoje: { t: 'breakpoint · "hoje"', reqs: '5.470', avg: '1,02 s', p95: '2 s', p: 2000, p99: '2 s', fail: '18,84%', drop: '19', exit: 99 },
    bpAbort: { t: 'breakpoint · ABORT=1', reqs: '2.764', avg: '248,6 ms', p95: '894,4 ms', p: 894, p99: '1,34 s', fail: '0,00%', drop: '0', exit: 99 },
    bpPlano: { t: 'breakpoint · "plano"', reqs: '42.726', avg: '705,9 ms', p95: '2 s', p: 2000, p99: '2 s', fail: '7,69%', drop: '593', exit: 99 },
    bpPlano2: { t: 'breakpoint · "plano 2"', reqs: '42.831', avg: '543,2 ms', p95: '1,96 s', p: 1960, p99: '2 s', fail: '4,23%', drop: '488', exit: 99 },
    est: { t: 'estresse · "plano 2"', reqs: '59.567', avg: '419,2 ms', p95: '1,48 s', p: 1480, p99: '1,92 s', fail: '0,54%', drop: '182', exit: 99 },
    spike: { t: 'spike · "hoje"', reqs: '4.828', avg: '1,61 s', p95: '2 s', p: 2000, p99: '2 s', fail: '42,58%', drop: '21', exit: 99 },
    pre1: { t: 'pré-teste · 1 pod', reqs: '2.339', avg: '249,0 ms', p95: '1,03 s', p: 1030, p99: '1,38 s', fail: '0,00%', drop: '0', exit: 99 },
    pre2: { t: 'pré-teste · 2 pods', reqs: '4.573', avg: '542,7 ms', p95: '2 s', p: 2000, p99: '2 s', fail: '5,44%', drop: '46', exit: 99 },
    pre3: { t: 'pré-teste · 3 pods', reqs: '6.796', avg: '535,8 ms', p95: '1,99 s', p: 1990, p99: '2 s', fail: '5,10%', drop: '103', exit: 99 },
    pool: { t: 'pool.js · pool único', reqs: '4.302', avg: '146,9 ms', p95: '56,0 ms', p: 56, p99: '5,52 s', fail: '7,90%', drop: '0', exit: 0, note: 'sem thresholds' },
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
  const ENVNAME = { hoje: '"hoje"', plano: '"plano"', plano2: '"plano 2"' };
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
    o.rows.ped = { ...act('pedidos', `${e.ped} ${e.ped > 1 ? 'pods' : 'pod'}`, [`${cap.ped}/s nominal`, 'dim'], [`carga ${pc(L.ped)}`, tn(L.ped)]), pods: pods(e.ped, L.ped) };
    o.rows.pag = inf ? { ...act('pagamentos', '100 pods', ['sem limite', 'dim'], [`carga ${pc(L.pag)}`, 'dim']), pods: { n: 0, inf: true } }
      : { ...act('pagamentos', `${e.pag} pods`, [`${cap.pag}/s nominal`, 'dim'], [`carga ${pc(L.pag)}`, tn(L.pag)]), pods: pods(e.pag, L.pag) };
    o.rows.est = { ...act('estoque', `${e.est} pods`, [`${thou(cap.est)}/s`, 'dim'], [`carga ${pc(L.est)}`, tn(L.est)]), pods: pods(e.est, L.est) };
    ['s0', 's1', 's2'].forEach((k, i) => o.rows[k] = act(`shard-${i}`, k === 's2' && !e.ded ? 'mkt-01' : '', ['teto 150/s', 'dim'], [`carga ${pc(L[k])}`, tn(L[k])]));
    if (e.ded) o.rows.ded = act('dedicado', 'mkt-01 · 2×', ['teto 300/s', 'dim'], [`carga ${pc(L.ded)}`, tn(L.ded)]);
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
  const liveCnt = (o, p, tm) => { o.cnt = [[tm ? 'JANELA' : 'OFERECIDA', tm ? `${p[0] - 5}–${p[0] + 5} s` : dec(p[1]) + '/s'], ['p95', ms(p[3]), p[3] > 800 ? 'bad' : 'dim'],
    ['CONCLUÍDOS', dec(p[2]) + '/s', p[2] < p[1] * 0.97 ? 'bad' : 'dim'], ['ERROS', dec(p[4]) + '%', p[4] > 0.1 ? 'bad' : 'dim']];
    o.live = { t: 'janela de 10 s', rows: [...(tm ? [['tempo', `${p[0] - 5}–${p[0] + 5} s`]] : []), ['oferecida', dec(p[1]) + '/s'],
      ['concluídos', dec(p[2]) + '/s', p[2] < p[1] * 0.97 ? 'bad' : ''], ['p95', ms(p[3]), p[3] > 800 ? 'bad' : 'acc'], ['erros', dec(p[4]) + '%', p[4] > 0.1 ? 'bad' : '']] }; };
  const PCT = (r, mx = 1000) => ({ type: 'rows', title: 'PERCENTIS (ms) × META', max: mx, mark: { v: 800, lab: 'meta 800' },
    rows: [['avg', r[0]], ['med', r[1]], ['p90', r[2]], ['p95', r[3], null, r[3] > 800 ? 'bad' : 'acc'], ['p99', r[4]], ['máx.', r[5]]].map(([l, v, s, tone]) => [l, v, dec(v) + ' ms', tone || 'dim']) });
  const SHAPES = [['smoke', '2/s · 30 s', 'funciona?', [[0, 0], [0.06, 0.08], [0.94, 0.08], [1, 0]]],
    ['média', '30/s · 2 min', 'mantém a meta?', [[0, 0], [0.1, 0.5], [0.9, 0.5], [1, 0]]],
    ['estresse', '100 → 300/s', 'como degrada?', [[0, 0.33], [0.1, 0.33], [0.16, 0.66], [0.31, 0.66], [0.37, 0.83], [0.52, 0.83], [0.58, 1], [0.73, 1], [0.8, 0.33], [1, 0.33]]],
    ['spike', '5 → 60/s', 'aguenta a rajada?', [[0, 0.08], [0.15, 0.08], [0.2, 1], [0.5, 1], [0.55, 0.08], [1, 0.08]]],
    ['breakpoint', '1 → 60/s', 'onde quebra?', [[0, 0.02], [1, 1]]]];

  // ── o que se vê em cada passo ──
  const STEPS = {
    perfis: [
      { id: 'alvo', dur: 6, title: 'O alvo: o checkout de "hoje" e as duas metas', yk: 'AS METAS NO checkout.js', code: ['thresholds: {', "  http_req_duration: ['p(95)<800'],", "  http_req_failed:   ['rate<0.001'] }", 'TIPO=smoke k6 run checkout.js', '61 requisições · p95 155,6 ms · exit 0'],
        story: 'O alvo é o checkout: cada POST /pedidos passa pelo pedidos, pelo pagamentos e pelo estoque e grava no banco. "Hoje" é a Black Friday de 2026, com 3 pods no pedidos e 2 no pagamentos. As metas do módulo 14 entram no k6 como thresholds: p95 até 800 ms e erros até 0,1%. O primeiro resultado é o smoke: 61 requisições, p95 de 155,6 ms, as duas metas passaram.',
        look: 'O k6, à esquerda, solta os pedidos na cadeia. Cada bloco mostra os pods, a capacidade nominal e a carga. O pagamentos, com 2 pods de 20/s, é o elo mais fraco: ~40/s.',
        key: 'Um plano sem teste é uma hipótese; o teste a refuta com número, ponto de medida e meta.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 pedidos/s', '30 s · 5 VUs'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.cnt = [['CAPACIDADE', '~40/s'], ['ELO', 'pagamentos (2 × 20/s)', 'dim'], ['METAS', 'p95 ≤ 800 ms · erros ≤ 0,1%', 'dim']];
          o.res = [['as duas metas passaram: exit 0', 'acc']];
          if (t > 1.2) T(o, TF(449), 'elo: pagamentos\n2 × 20 = 40/s'); } },
      { id: 'formas', dur: 9, title: 'As cinco formas de carga no tempo', yk: 'O MESMO SCRIPT, CINCO PERFIS (TIPO=…)', code: ['smoke       2/s × 30 s', 'media       30/s × 2 min', 'estresse    100 → 300/s em degraus', 'spike       5 → 60/s em 10 s', 'breakpoint  1 → 60/s em 3 min'],
        story: 'O mesmo checkout.js roda os cinco testes; a variável TIPO escolhe a forma da carga. O smoke é mínimo; a carga média é a esperada; o estresse sobe em degraus acima dela; o spike salta de uma vez e volta; o breakpoint sobe em rampa até quebrar. Cada forma responde uma pergunta.',
        look: 'No mostrador, as cinco formas acendem uma a uma, com a taxa que rodou de verdade e a pergunta de cada uma.',
        key: 'Cada forma de carga responde uma pergunta: funciona, mantém a meta, como degrada, aguenta a rajada, onde quebra.',
        f(o, t) { const i = Math.min(4, Math.floor(clamp((t - 0.4) / 1.5) * 5 * 0.999)), s = SHAPES[i], rate = [2, 30, 30, 30, 30][i];
          gen(o, `TIPO=${['smoke', 'media', 'estresse', 'spike', 'breakpoint'][i]}`, s[1], s[2]); cadeia(o, 'hoje', rate);
          o.chart = { type: 'shapes', n: i + 1 };
          o.cnt = [['FORMA', s[0]], ['TAXA', s[1], 'dim'], ['PERGUNTA', s[2], 'dim']];
          o.res = [[`${i + 1} de 5 formas`, 'acc']]; } },
      { id: 'plano', dur: 8, title: 'O "plano": a mesma cadeia, outro ambiente', yk: 'A CONTA × O TESTE', code: ['pedidos     10 × 30 = 300/s', 'pagamentos  15 × 20 = 300/s', 'shard-2     60% × 250 = 150/s (o teto)', 'breakpoint: p95 cruza 800 em ~250/s'],
        story: 'O "plano" do módulo 23 tem 10 pods no pedidos e 15 no pagamentos: 300 pedidos/s nominais. O breakpoint achou outro número. O mkt-01 leva 40% dos pedidos e cai no shard-2, que fica com 60% do tráfego: a 250/s, o shard-2 recebe 150/s, o teto dele. O p95 cruza 800 ms em ~250/s, não em 300.',
        look: 'O shard-2, o maior do anel, fica vermelho, a 100%. No mostrador, a curva do p95 do plano sobe e cruza a linha de 800 ms perto de 250/s.',
        key: 'O teste mostra onde a conta quebra: no plano, o shard quente, a 250/s.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_PLANO), tone: 'acc', lab: '"plano"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'oferecida/s', marks: t > 4 ? [[250, '~250', 'bad'], [300, 'conta 300', 'dim']] : [] });
          gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} pedidos/s`, '1 → 360/s em 4 min'); cadeia(o, 'plano', p[1]); k6(o, 'bpPlano'); liveCnt(o, p);
          o.cnt = [['A META CAI EM', '~250/s', 'bad'], ['NOMINAL', '300/s', 'dim'], ['ELO', 'shard-2 (mkt-01)', 'dim'], ...o.cnt.slice(0, 2)];
          if (p[1] > 200) T(o, TF(768), 'shard-2: 60% × 250\n= 150/s, o teto', 'bad'); } },
      { id: 'errado', dur: 8, title: 'E se der errado: o ambiente não é o de produção', yk: 'A EXTRAPOLAÇÃO INGÊNUA', code: ['pré-produção: 1 pod por serviço', '1 pod do pedidos ≈ 30/s', '× 10 pods = ~300/s ?', 'plano: o shard-2 quente → ~250/s', 'plano 2 (dedicado): ~260/s'],
        story: 'Suponha uma pré-produção com 1 pod por serviço. Um pod do pedidos aguenta 30/s, e a extrapolação diz que 10 pods aguentam ~300/s. A conta fecha e dá confiança. O ambiente do plano mostrou outra coisa: o shard-2, quente por causa do mkt-01, limita o plano em ~250/s, e o "plano 2", com o shard dedicado, em ~260/s. A pré-produção de 1 pod nunca veria o shard quente.',
        look: 'Primeiro um pod só no pedidos, a 30/s, e a conta "× 10". Depois a cadeia do plano com 10 pods: o shard-2 fica vermelho antes de os pods chegarem ao limite.',
        key: 'O ambiente é parte do resultado: ele precisa ter a forma da produção.',
        f(o, t) { const a = t < 3.2;
          if (a) { gen(o, 'ramping-arrival-rate', '30 pedidos/s', 'pré-produção'); cadeia(o, 'hoje', 30, { env: { ped: 1, pag: 100 } }); k6(o, 'pre1');
            T(o, TF(279), '1 pod: ~30/s\n× 10 = 300/s ?'); }
          else { gen(o, 'ramping-arrival-rate', '250 pedidos/s', 'ambiente do plano'); cadeia(o, 'plano', 250); k6(o, 'bpPlano');
            T(o, TF(768), 'shard-2 no teto\n~250/s, não 300', 'bad'); }
          o.chart = { type: 'rows', title: 'CAPACIDADE (PEDIDOS/S)', max: 320, rows: [['1 pod × 10', 300, '~300/s (conta)', 'dim'], ['"plano"', 250, '~250/s (shard-2)', a ? 'dim' : 'bad'], ['"plano 2"', 260, '~260/s (degrau)', 'dim']].slice(0, a ? 1 : 3) };
          o.cnt = a ? [['EXTRAPOLADO', '~300/s'], ['1 POD', '~30/s', 'dim']] : [['MEDIDO', '~250/s', 'bad'], ['EXTRAPOLADO', '~300/s', 'dim'], ['ELO', 'shard-2', 'dim']];
          o.res = a ? [] : [['a pré-produção de 1 pod não vê o shard quente', 'bad']]; } },
    ],
    modelo: [
      { id: 'fechado20', dur: 7, title: 'Modelo fechado: 20 VUs, 38,1/s e 0% de erros', yk: 'executor: constant-vus · VUS=20', code: ['cada VU manda, espera a resposta, manda de novo', 'vazão 38,1/s · média 520 ms · p95 1,07 s', 'Little: 20 = 38,07 × 0,520 s', 'erros 0% · exit 99 (só o p95 falhou)'],
        story: 'No modelo fechado o k6 fixa o número de usuários virtuais. Cada VU manda um pedido, espera a resposta e só então manda o próximo. Com 20 VUs sem pausa, a vazão ficou em 38,1/s, a média em 520 ms e o p95 em 1,07 s. Nenhum erro. A Lei de Little fecha: 20 = 38,07 × 0,520.',
        look: 'No k6, cada quadradinho é um VU; os acesos estão esperando a resposta. Um pedido novo só sai quando um VU fica livre.',
        key: 'No modelo fechado a taxa depende do sistema: quando ele atrasa, o gerador também atrasa.',
        f(o, t) { gen(o, 'constant-vus', '20 VUs · sem pausa', '38,1 pedidos/s', { n: 20, busy: 0.9 }); cadeia(o, 'hoje', 38.1); k6(o, 'f20');
          o.chart = MODEL(1); o.cnt = [['VAZÃO', '38,1/s'], ['ERROS', '0%', 'dim'], ['p95', '1,07 s', 'bad']];
          if (t > 1.2) T(o, TF(94), '20 VUs esperando\na vazão para em 38/s'); } },
      { id: 'fechado60', dur: 7, title: 'Modelo fechado: 60 VUs, 41,1/s e 8,35%', yk: 'VUS=60', code: ['vazão 41,1/s (a capacidade é ~40/s)', 'média 1,43 s · p95 2 s', 'erros 8,35% (504 aos 2 s)', '3 × os VUs, +8% de vazão'],
        story: 'Triplicar os VUs quase não mudou a vazão: 41,1/s, porque a capacidade é ~40/s. O que subiu foi a espera: média de 1,43 s, p95 de 2 s, e 8,35% dos pedidos levaram 504 do lb-loja. Por mais VUs que se ponham, o fechado não passa da capacidade.',
        look: 'Os 60 quadradinhos quase todos acesos, esperando. A pilha de 504 começa na frente do pagamentos.',
        key: 'O gerador fechado se regula: a vazão para na capacidade e só a espera cresce.',
        f(o, t) { gen(o, 'constant-vus', '60 VUs · sem pausa', '41,1 pedidos/s', { n: 60, busy: 0.97 }); cadeia(o, 'hoje', 41.1); k6(o, 'f60');
          if (t > 0.8) pile(o, 'pag', '504 · 8%', 0.3);
          o.chart = MODEL(2); o.cnt = [['VAZÃO', '41,1/s'], ['ERROS', '8,35%', 'bad'], ['MÉDIA', '1,43 s', 'bad']]; } },
      { id: 'aberto', dur: 8, title: 'Modelo aberto: 54 pedidos/s, 52% de erros', yk: 'executor: ramping-arrival-rate (a janela de 54/s)', code: ['a taxa é fixa: chegam 54/s, com resposta ou sem', 'concluídos ~26/s · mediana 2 s', 'erros 52% (504)', 'o k6 sobe os VUs para manter a taxa'],
        story: 'No modelo aberto o k6 fixa a taxa e deixa os VUs variarem. A 54 pedidos/s, a janela do breakpoint "hoje" teve 52% de erros e só ~26 pedidos concluídos por segundo, com mediana de 2 s. É assim que a loja recebe a newsletter das 20:00: a uma taxa, e não a um número de usuários que esperam a vez.',
        look: 'A luz entra no ritmo fixo, mesmo com a cadeia cheia. A pilha de 504 na frente do pagamentos cresce depressa.',
        key: 'No modelo aberto a taxa é a entrada: o sistema não consegue frear o gerador.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '54 pedidos/s', 'VUs até 119'); cadeia(o, 'hoje', 54); k6(o, 'bpHoje');
          if (t > 0.6) pile(o, 'pag', '504 · 52%', (t - 0.6) / 3);
          o.chart = MODEL(3); o.cnt = [['ERROS', '52%', 'bad'], ['CONCLUÍDOS', '~26/s', 'bad'], ['OFERECIDOS', '54/s', 'dim']]; } },
      { id: 'errado', dur: 8, title: 'E se der errado: o teste fechado "passa"', yk: 'COORDINATED OMISSION', code: ['fechado, 20 VUs: erros 0%', 'aberto, 54/s:   erros 52%', 'o fechado omite os pedidos que', 'deveria ter feito enquanto esperava'],
        story: 'Quem lê só os erros do teste fechado de 20 VUs diz que está tudo bem: 0%. O gerador fechado esconde a quebra porque, quando o sistema atrasa, ele também atrasa. A documentação do k6 chama isso de coordinated omission. O cliente da loja não espera a vez; para a newsletter das 20:00 o modelo é o aberto.',
        look: 'A mesma loja alterna entre os dois geradores: 0% de erros no fechado, 52% no aberto. No mostrador, as três rodadas lado a lado.',
        key: 'O modelo fechado esconde a quebra; teste a taxa que a loja recebe.',
        f(o, t) { const ab = Math.floor(t / 2.6) % 2 === 1;
          if (ab) { gen(o, 'ramping-arrival-rate', '54 pedidos/s', 'aberto', null, 'bad'); cadeia(o, 'hoje', 54); pile(o, 'pag', '504 · 52%', 0.8); T(o, TF(449), 'aberto: 52% de erros', 'bad'); }
          else { gen(o, 'constant-vus', '20 VUs · 38,1/s', 'fechado', { n: 20, busy: 0.9 }); cadeia(o, 'hoje', 38.1); T(o, TF(94), 'fechado: 0% de erros'); }
          k6(o, ab ? 'bpHoje' : 'f20'); o.chart = MODEL(3);
          o.cnt = [['FECHADO 20 VUs', '0% de erros'], ['ABERTO 54/s', '52% de erros', 'bad']];
          o.res = [['o fechado esconde a quebra', 'bad']]; } },
    ],
    smoke: [
      { id: 'roda', dur: 6, title: 'Smoke: 2 pedidos/s por 30 s, 61 requisições', yk: 'TIPO=smoke k6 run checkout.js', code: ['constant-arrival-rate · rate 2 · 30 s', 'preAllocatedVUs 5 · maxVUs 20', 'clientes: 40% mkt-01, 60% c-<n>', 'sem fila: 33 + 50 + 2 + 6,67 = 91,7 ms'],
        story: 'O smoke é a menor carga que prova que o teste e o sistema funcionam. Dois pedidos por segundo durante 30 s, no ambiente "hoje": voltaram 61 requisições, com média de 81,9 ms, p95 de 155,6 ms e 0% de erros. A soma dos tempos sem fila é 91,7 ms, e a média de 61 amostras fica em volta disso.',
        look: 'Poucos pontos de luz atravessam a cadeia e chegam aos três shards, porque os clientes do mix são sorteados. No mostrador, as barras dos percentis ficam longe da linha de 800 ms.',
        key: 'O smoke prova que o teste roda; ele não mede capacidade.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 pedidos/s', 'clientes sorteados'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.chart = PCT([81.9, 78.2, 138, 155.6, 213.7, 247.5]); o.cnt = [['REQUISIÇÕES', '61'], ['p95', '155,6 ms', 'dim'], ['ERROS', '0%', 'dim']]; } },
      { id: 'check', dur: 6, title: 'O check e o código de saída: 0 segue, 99 barra', yk: 'O QUE O PIPELINE LÊ', code: ["check(res, { 'status 201': ... })", 'p(95)<800 ✓ · rate<0.001 ✓', 'exit 0 → a versão segue', 'exit 99 → o deploy para (módulo 22)'],
        story: 'Cada resposta passa por um check (status 201) e o teste inteiro passa por duas thresholds. A tabela final é para gente ler; o pipeline lê o código de saída: 0 se tudo passou, 99 se alguma threshold falhou. O módulo 22 roda o smoke depois de cada deploy, e o 99 barra a versão sem ninguém abrir a tabela.',
        look: 'No mostrador, o resumo do k6 termina em exit 0, com as duas metas aprovadas.',
        key: 'A tabela é para gente; o código de saída decide se a versão segue.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 pedidos/s', 'clientes sorteados'); cadeia(o, 'hoje', 2); k6(o, 'smoke');
          o.chart = { type: 'lines', title: 'O FIM DA SAÍDA DO k6', n: 1 + Math.floor(clamp(t / 3) * 4), lines: [["✓ 'status 201'  61 de 61", 'acc'], ['✓ p(95)<800    p(95)=155,6ms', 'acc'], ['✓ rate<0.001   0,00%', 'acc'], ['exit 0 → o deploy segue', 'acc'], ['(exit 99 → o deploy para)', 'dim']] };
          o.cnt = [['CÓDIGO DE SAÍDA', '0'], ['CHECKS', '61 de 61', 'dim']]; } },
      { id: 'lena', dur: 7, title: 'E se der errado: um cliente só, o lena-77', yk: 'murmur3(cliente_id) mod 3', act: ['Usar só o lena-77', 'um cliente só'], code: ['lena-77 → murmur3 mod 3 = 1 → shard-1', 'todos os pedidos no shard-1', 'shard-2 (o do mkt-01): nenhum', 'smoke verde, o shard quente parado'],
        story: 'Um smoke caseiro costuma usar um cliente só. O lena-77 cai sempre no shard-1, porque murmur3 mod 3 dá 1. O smoke fica verde sem nunca tocar o shard-2, o do mkt-01, que é onde o plano quebra.',
        look: 'Todos os pontos de luz descem para o shard-1. O shard-2, o maior, fica apagado.',
        key: 'Um cliente só engana: os dados de teste precisam ser variados.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 pedidos/s', 'cliente: lena-77'); cadeia(o, 'hoje', 2, { only: 's1' }); k6(o, 'smoke');
          o.on.s1 = 1; o.chart = { type: 'rows', title: 'PEDIDOS POR SHARD', max: 61, rows: [['shard-0', 0, '0', 'dim'], ['shard-1', 61, '61 (todos)', 'acc'], ['shard-2', 0, '0 · o do mkt-01', 'bad']] };
          o.cnt = [['SHARD-1', '61 pedidos'], ['SHARD-2', '0', 'bad']]; o.res = [['verde sem tocar o shard quente', 'bad']];
          if (t > 1) T(o, TF(768), 'shard-2: nenhum pedido', 'bad'); } },
      { id: 'mkt', dur: 7, title: 'E se der errado: com o mkt-01, o shard-2 aparece', yk: 'mkt-01 → shard-2', act: ['Trocar para mkt-01', 'outro cliente'], code: ['mkt-01 → murmur3 mod 3 = 2 → shard-2', 'o 201 não confere o frete:', '49,00 × 64,00 passaria (módulo 22)', 'check de conteúdo + dados variados'],
        story: 'Trocando o cliente de teste por mkt-01, o pedido vai para o shard-2. O mesmo smoke também conferia só o 201: o erro de frete do módulo 22 (49,00 no lugar de 64,00) passaria. O check precisa olhar o conteúdo da resposta, e os clientes precisam cobrir os shards.',
        look: 'Agora a luz desce para o shard-2, que acende. O shard-1 fica apagado.',
        key: 'O smoke só diz "pode seguir" se os dados e o check cobrem o que importa.',
        f(o, t) { gen(o, 'constant-arrival-rate', '2 pedidos/s', 'cliente: mkt-01'); cadeia(o, 'hoje', 2, { only: 's2' }); k6(o, 'smoke');
          o.on.s2 = 1; o.chart = { type: 'rows', title: 'PEDIDOS POR SHARD', max: 61, rows: [['shard-0', 0, '0', 'dim'], ['shard-1', 0, '0', 'dim'], ['shard-2', 61, '61 · o do mkt-01', 'acc']] };
          o.cnt = [['SHARD-2', '61 pedidos'], ['FRETE', 'não conferido', 'bad']]; o.res = [['o 201 não confere o frete', 'bad']];
          if (t > 1) T(o, TF(768), 'mkt-01 → shard-2'); } },
    ],
    media: [
      { id: 'trinta', dur: 7, title: 'Carga média: 30 pedidos/s por 2 minutos', yk: 'RATE=30 TIPO=media k6 run checkout.js', code: ['constant-arrival-rate · 30/s · 2 min', '3.601 requisições · 0% de erros', 'avg 157,5 · med 129,5 · p90 309,9', 'p95 381,3 · p99 498,6 · máx. 617,0 ms'],
        story: 'A carga média verifica a meta na carga esperada: 30 pedidos por segundo, a Black Friday de 2026, durante 2 minutos. Foram 3.601 requisições, média de 157,5 ms, p95 de 381,3 ms, p99 de 498,6 ms e nenhum erro. As duas metas passaram. O artigo pede horas ou dias, para achar o que só aparece com o tempo, como vazamento de memória.',
        look: 'A luz corre contínua pela cadeia. O pagamentos está a 75% de carga, aceso; no mostrador, todos os percentis abaixo da linha de 800 ms.',
        key: 'A carga média responde: "a loja normal mantém a meta?"',
        f(o, t) { gen(o, 'constant-arrival-rate', '30 pedidos/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 30); k6(o, 'media');
          o.chart = PCT([157.5, 129.5, 309.9, 381.3, 498.6, 617]); o.cnt = [['p95', '381,3 ms'], ['ERROS', '0%', 'dim'], ['REQUISIÇÕES', '3.601', 'dim']]; } },
      { id: 'mm1', dur: 7, title: 'O M/M/1 dizia ~259 ms; o k6 mediu 157', yk: 'A CONTA DO MÓDULO 23 × A MEDIDA', code: ['M/M/1 por elo, a 30/s:', 'pedidos 49 + pagamentos 200', '+ estoque 2 + banco 7 = ~259 ms', 'k6: 157,5 ms de média'],
        story: 'A conta de filas do módulo 23, um M/M/1 por elo, daria uns 259 ms de média na cadeia a 30/s: 49 no pedidos, 200 no pagamentos, 2 no estoque e 7 no banco. O k6 mediu 157,5 ms. O round robin deixa as chegadas de cada pod mais regulares que um sorteio, e o modelo sai conservador. Medir diz quanto.',
        look: 'No mostrador, a barra do M/M/1 é bem mais longa que a do k6.',
        key: 'O modelo dá a ordem de grandeza; o teste dá o número.',
        f(o, t) { gen(o, 'constant-arrival-rate', '30 pedidos/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 30); k6(o, 'media');
          o.chart = { type: 'rows', title: 'MÉDIA NA CADEIA A 30/s (ms)', max: 300, rows: [['M/M/1', 259, '~259 ms (conta)', 'dim'], ['k6', 157.5, '157,5 ms (medido)', 'acc']] };
          o.cnt = [['MEDIDO', '157,5 ms'], ['M/M/1', '~259 ms', 'dim']]; o.res = [['o modelo é conservador', 'acc']]; } },
      { id: 'trintaeseis', dur: 7, title: '36 pedidos/s: o p95 vai a 798 ms', yk: 'DEGRAU DE 2 MIN (REGIME PERMANENTE)', act: ['Mudar para 36/s', 'regime permanente'], code: ['33/s: p95 431 ms · p99 626 · 0%', '36/s: p95 798 ms · p99 980 · 0%', 'passa por 2 ms (exit 0)', 'pagamentos: 36 ÷ 40 = 90% de carga'],
        story: 'Com a taxa constante em 36 pedidos/s, o p95 em regime permanente foi a 798 ms: a meta passou por 2 ms. A 33/s ele estava em 431 ms. O pagamentos está a 90% de carga, e perto disso cada pedido a mais custa caro em espera.',
        look: 'O pagamentos fica mais aceso, a 90%. No mostrador, a barra do p95 de 36/s encosta na linha de 800 ms.',
        key: 'Perto da capacidade, poucos pedidos a mais levam o p95 até a meta.',
        f(o, t) { gen(o, 'constant-arrival-rate', '36 pedidos/s', '2 min · 50 VUs'); cadeia(o, 'hoje', 36); k6(o, 'm36');
          o.chart = { type: 'rows', title: 'p95 EM REGIME PERMANENTE (ms)', max: 1000, mark: { v: 800, lab: 'meta 800' }, rows: [['30/s', 381.3, '381 ms', 'dim'], ['33/s', 430.7, '431 ms', 'dim'], ['36/s', 798.1, '798 ms', 'acc']] };
          o.cnt = [['p95', '798,1 ms'], ['META', '800 ms', 'dim'], ['PAGAMENTOS', '90%', 'dim']];
          if (t > 1) T(o, TF(449), 'pagamentos a 90%\np95 798 ms'); } },
      { id: 'errado', dur: 8, title: 'E se der errado: a média do dia não é o pico', yk: 'TIPO=media RATE=125 · "plano"', code: ['125/s = 200 × 400 ÷ 640 (a média de 2027)', 'avg 109,9 · p95 247,2 · p99 357,4 ms', '0% de erros · exit 0', 'breakpoint do mesmo ambiente: ~250/s'],
        story: 'A média da Black Friday de 2027 é 125 pedidos/s. No ambiente do plano, a carga média passa com folga: p95 de 247 ms, nenhum erro, e o shard-2 a 50%. O breakpoint do mesmo ambiente quebra em ~250/s, o dobro. O teste respondeu o que perguntou, a carga normal; a Black Friday pede outra pergunta.',
        look: 'A cadeia do plano tranquila, o shard-2 a 50%. No mostrador, a curva do breakpoint do plano, com os 125/s bem antes da quebra.',
        key: 'Um teste responde a pergunta que fez; a média não diz se o pico cabe.',
        f(o, t) { gen(o, 'constant-arrival-rate', '125 pedidos/s', '2 min · "plano"'); cadeia(o, 'plano', 125); k6(o, 'mPlano');
          series(o, t, [{ pts: byRate(BP_PLANO), tone: 'acc', lab: 'breakpoint "plano"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'oferecida/s', marks: [[125, 'média 125', 'acc'], [250, 'quebra ~250', 'bad']] });
          o.cnt = [['MÉDIA', 'p95 247 ms'], ['QUEBRA', '~250/s', 'bad'], ['SHARD-2', '50%', 'dim']]; o.res = [['passa com folga, e o pico é outro', 'bad']]; } },
    ],
    estresse: [
      { id: 'cem', dur: 6, title: 'A escada começa em 100 pedidos/s', yk: 'TIPO=estresse · "plano 2"', code: ['100 → 200 → 250 → 300 → 100/s', '20 s de subida, 45 s de patamar', 'patamar 100/s: p95 208–232 ms', 'concluídos ~100/s · 0%'],
        story: 'O estresse leva a carga acima do esperado em degraus e olha o que degrada primeiro e como volta. No "plano 2" a escada vai de 100 a 200, 250 e 300 pedidos/s e desce de novo a 100. No primeiro patamar, 100/s, o p95 fica entre 208 e 232 ms.',
        look: 'No mostrador, a linha tracejada é a taxa oferecida e a acesa é o goodput, os pedidos concluídos por segundo. As duas andam juntas.',
        key: 'O estresse pergunta o que degrada primeiro e como o sistema volta.',
        f(o, t) { est(o, t, 0, 3); } },
      { id: 'duzentos', dur: 7, title: '200/s, a meta do plano: p95 de 334 a 406 ms', yk: 'PATAMAR 200/s', act: ['Subir para 200/s', 'a meta'], code: ['patamar 200/s (a meta da Black Friday)', 'p95 334–406 ms · p99 445–587', 'concluídos ~200/s · 0%'],
        story: 'O segundo patamar é a meta do plano: 200 pedidos/s. O p95 fica entre 334 e 406 ms, metade da meta, e todos os pedidos concluem. O pedidos e o pagamentos estão a 67% de carga.',
        look: 'O pedidos e o pagamentos ficam mais acesos. O goodput acompanha a taxa no degrau.',
        key: 'Na carga da meta, o "plano 2" tem folga.',
        f(o, t) { est(o, t, 3, 10); } },
      { id: 'duzentosecinquenta', dur: 7, title: '250/s: o p95 encosta na meta (até 738 ms)', yk: 'PATAMAR 250/s', act: ['Subir para 250/s', 'acima da meta'], code: ['patamar 250/s', 'p95 504–738 ms (no limite)', 'p99 639–1.068 ms · 0%', 'pedidos e pagamentos a 83%'],
        story: 'A 250 pedidos/s a meta ainda se sustenta, mas no limite: a pior janela teve p95 de 738 ms, e o p99 passa de 1 s em uma delas. Ainda não há erros.',
        look: 'A curva do p95 sobe e chega perto da linha de 800 ms.',
        key: 'A meta se sustenta até 250/s no "plano 2".',
        f(o, t) { est(o, t, 10, 16); } },
      { id: 'trezentos', dur: 8, title: '300/s, o estresse: p95 de 1,5 a 2 s e erros', yk: 'PATAMAR 300/s', act: ['Subir para 300/s', 'o estresse'], code: ['patamar 300/s', 'p95 1.497–2.000 ms', 'erros 0,7% a 5,1% (504)', 'goodput 280–293/s, abaixo do que chega'],
        story: 'A 300 pedidos/s, o estresse do plano, o p95 vai de 1,5 a 2 s, e entre 0,7% e 5,1% dos pedidos levam 504. O goodput fica entre 280 e 293/s, menos do que chega. O pedidos e o pagamentos estão a 100% juntos.',
        look: 'O pedidos e o pagamentos ficam vermelhos e a pilha de 504 aparece. No mostrador, o p95 passa da linha e surgem as barras de erro.',
        key: 'Acima da capacidade, o p95 vai ao timeout e os erros começam.',
        f(o, t) { est(o, t, 16, 23); } },
      { id: 'volta', dur: 8, title: 'De volta a 100/s: recupera em 10 a 20 s', yk: 'A DESCIDA E O RESUMO', act: ['Descer para 100/s', 'a recuperação'], code: ['1ª janela em 100/s: p95 1.247 ms', '2ª janela: 244 ms · depois ~220', 'total: avg 419 · p95 1,48 s · p99 1,92 s', 'falhas 0,54% · dropped 182 · exit 99'],
        story: 'Quando a carga volta a 100/s, o p95 ainda marca 1.247 ms na primeira janela e cai a 244 ms na segunda: a recuperação leva de 10 a 20 s. É rápida porque o gargalo descarta o que já passou de 2 s. O resumo do teste inteiro dá p95 de 1,48 s, 0,54% de falhas e código 99.',
        look: 'A cadeia esfria e a pilha some. No mostrador, a curva desce logo depois do degrau.',
        key: 'Recuperar é parte do resultado: quanto tempo leva e por quê.',
        f(o, t) { est(o, t, 23, 30); if (t > 4.6) { k6(o, 'est'); o.live = null; } } },
      { id: 'errado', dur: 8, title: 'E se der errado: mais carga, menos pedidos concluídos', yk: 'BREAKPOINT "hoje": GOODPUT × TAXA', code: ['oferecida 45,2/s → concluídos 40,6/s', '51,8/s → 29,1/s', '58,4/s → 25,5/s', 'o pagamentos atende quem já desistiu (2 s)'],
        story: 'No "hoje", acima do teto, mais carga deu menos pedidos concluídos. A 45 pedidos/s oferecidos voltavam 40,6 por segundo; a 58, só 25,5. O pagamentos gasta capacidade em requisições cujo cliente já desistiu aos 2 s, e quem chega depois espera atrás delas.',
        look: 'O pagamentos vermelho e a pilha de 504 crescendo. No mostrador, o goodput sobe com a taxa até ~40/s e depois cai, enquanto a oferecida continua subindo.',
        key: 'Acima do teto o goodput cai: o gargalo gasta tempo com quem já desistiu.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'oferecida/s', over: 5, marks: t > 4 ? [[45.2, 'pico 40,6/s', 'acc'], [58.4, '25,5/s', 'bad']] : [] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} pedidos/s`, '"hoje"'); cadeia(o, 'hoje', p[1]); k6(o, 'bpHoje'); liveCnt(o, p);
          if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, p[4] / 60);
          o.res = p[1] > 45 ? [['mais carga = menos pedidos concluídos', 'bad']] : []; } },
    ],
    spike: [
      { id: 'base', dur: 5, title: 'A base: 5 pedidos/s por 30 s', yk: 'TIPO=spike · as stages', code: ['{ target: 5,  duration: 30s }', '{ target: 60, duration: 10s }', '{ target: 60, duration: 60s }', '{ target: 5,  duration: 10s }', '{ target: 5,  duration: 90s }'],
        story: 'O spike é um salto súbito que volta, como a newsletter das 20:00. A base é calma: 5 pedidos/s durante 30 s, com p95 em torno de 220 ms.',
        look: 'Poucos pontos atravessam a cadeia "hoje". No mostrador, a taxa reta lá embaixo.',
        key: 'O spike pergunta se o sistema absorve a rajada e quanto leva para voltar.',
        f(o, t) { spk(o, t, 0, 3); } },
      { id: 'salto', dur: 6, title: 'O salto: de 5 a 60/s em 10 s', yk: 'A JANELA DO SALTO', act: ['Soltar a rajada', '5 → 60/s'], code: ['janela 30–40 s: a taxa sobe de 5 a 60', 'p95 1.048 ms (1,05 s)', 'ainda 0% de erros'],
        story: 'Em 10 s a taxa sobe de 5 para 60 pedidos/s. Na janela do salto o p95 já vai a 1,05 s: a fila do pagamentos enche antes de qualquer erro.',
        look: 'A luz se adensa de repente e o pagamentos acende.',
        key: 'A fila enche antes de os erros aparecerem.',
        f(o, t) { spk(o, t, 3, 4); } },
      { id: 'topo', dur: 8, title: 'O topo: 60/s oferecidos, 47% a 65% de erros', yk: '60 s NO TOPO', code: ['60/s contra ~40/s de capacidade', 'erros 47–65% por janela', 'goodput 21–30/s', 'p95 2 s (o timeout)'],
        story: 'No topo, 60 pedidos/s por 60 s, bem acima dos ~40/s que o "hoje" aguenta. Os erros ficam entre 47% e 65% por janela e o goodput entre 21 e 30 por segundo, menos que a capacidade.',
        look: 'O pagamentos vermelho e a pilha de 504 crescendo; no mostrador, as barras de erro altas e o goodput abaixo da oferecida.',
        key: 'Uma rajada acima da capacidade vira erro na hora.',
        f(o, t) { spk(o, t, 4, 11); } },
      { id: 'preescala', dur: 8, title: 'Com pré-escala, a mesma rajada cabe', yk: 'A CONTA DO HPA × A PRÉ-ESCALA', act: ['Ligar a pré-escala', 'pagamentos com 4 pods'], code: ['HPA: ~60 s para reagir (módulo 14)', '(60 − 40)/s × 60 s = 1.200 pedidos', 'pré-escala às 19:50 (módulo 23)', 'pagamentos 4 × 20 = 80/s: 60/s a 75%'],
        story: 'O HPA do módulo 14 leva uns 60 s para reagir. Com 20 pedidos/s acima da capacidade durante esses 60 s, são 1.200 pedidos recusados ou atrasados antes de a primeira réplica nova ficar pronta. A rajada é conhecida, então o conserto é pré-escalar às 19:50. Com o pagamentos em 4 pods (80/s), os 60/s do topo cabem a 75% de carga. Isto é conta: esta rodada não foi feita no lab.',
        look: 'O pagamentos já tem 4 pods antes da rajada. A pilha some e a cadeia fica acesa, sem vermelho.',
        key: 'Rajada conhecida se resolve com pré-escala; o HPA é lento para uma rajada de 10 s.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '60 pedidos/s', 'pagamentos pré-escalado'); cadeia(o, 'hoje', 60, { env: { pag: 4 } });
          o.chart = { type: 'rows', title: 'NO TOPO DE 60/s', max: 1200, rows: [['sem pré-escala', 1200, '1.200 pedidos no atraso do HPA', 'bad'], ['erros no topo', 650, '47–65% (medido)', 'bad'], ['com pré-escala', 0, '60 < 80/s: cabe (conta)', 'acc']] };
          o.cnt = [['PAGAMENTOS', '4 × 20 = 80/s'], ['CARGA', '75%', 'dim'], ['SEM PRÉ-ESCALA', '1.200 pedidos', 'bad']];
          o.res = [['a mesma rajada cabe (conta, não rodada)', 'acc']];
          if (t > 1) T(o, TF(449), 'pré-escala: 4 pods\n60/s a 75%'); } },
      { id: 'errado', dur: 8, title: 'E se der errado: a "recuperação" que é erro', yk: 'O QUE O SIMULADOR FEZ COM A FILA', code: ['de volta a 5/s: p95 168 ms na 1ª janela', 'não sobrou fila: ela virou 504', 'total: 42,58% de falhas · exit 99', 'leia o p95 e os erros do topo juntos'],
        story: 'Ao descer para 5/s o p95 voltou a 168 ms já na primeira janela. Parece bom demais, e é: o simulador descarta as requisições que passam de 2 s, porque o cliente desistiu. A fila não esvaziou porque o sistema ficou rápido; esvaziou porque virou 504. Os 47% a 65% de erros do topo são o preço da recuperação.',
        look: 'A cadeia esfria de uma vez. No mostrador, a curva do p95 cai logo depois do topo, ao lado das barras vermelhas de erro.',
        key: 'Recuperar rápido pode ser só erro: leia os erros do topo junto do p95 depois dele.',
        f(o, t) { spk(o, t, 11, 20); if (t > 4.6) { k6(o, 'spike'); o.live = null; }
          if (t > 3) T(o, TF(449), 'a fila virou 504\n47–65% no topo', 'bad'); } },
    ],
    breakpoint: [
      { id: 'rampa', dur: 7, title: 'A rampa: de 1 a 60 pedidos/s em 3 minutos', yk: 'TIPO=breakpoint TOPO=60 DUR=3m ABORT=0', code: ['ramping-arrival-rate: 1 → 60/s em 180 s', 'janelas de 10 s (o CSV do k6)', 'até 35/s: p95 345–383 ms, 0% de erros', 'HPA desligado, como manda o k6'],
        story: 'O breakpoint sobe a carga até quebrar e diz onde. A rampa vai de 1 a 60 pedidos/s em 3 minutos, no "hoje", com a elasticidade desligada. Lendo o CSV em janelas de 10 s, até uns 35/s o p95 fica entre 345 e 383 ms e não há erros.',
        look: 'No mostrador, cada ponto é uma janela: em cima o p95 contra a linha de 800 ms; embaixo a taxa oferecida (tracejada), o goodput (acesa) e os erros (barras).',
        key: '"Quebrar" tem três pontos: a meta, os erros e o colapso.',
        f(o, t) { bph(o, t, 0, 11, []); } },
      { id: 'meta', dur: 7, title: 'Ponto 1, a meta: o p95 passa de 800 ms', yk: 'A META (p95 > 800 ms)', act: ['Subir a taxa', 'até a meta'], code: ['janela de 38,7/s: p95 932 ms', 'outra rodada: 820 ms na de 35,4/s', 'degrau de 2 min a 36/s: p95 798 ms', '→ o "hoje" sustenta 36/s'],
        story: 'O primeiro ponto é a meta. Na janela de 38,7/s o p95 foi a 932 ms; em outra rodada, a 820 ms já na de 35,4/s: a quebra varia entre rodadas. O degrau de 2 minutos confirmou: a 36/s o p95 fica em 798 ms. O "hoje" sustenta 36 pedidos/s.',
        look: 'O ponto do p95 salta acima da linha de 800 ms. O pagamentos chega a 97% de carga.',
        key: 'A rampa localiza; o degrau confirma.',
        f(o, t) { bph(o, t, 11, 12, [[36, 'meta 36', 'acc']]); } },
      { id: 'erros', dur: 7, title: 'Ponto 2, os erros: começam em ~42/s', yk: 'OS ERROS (> 0,1%)', act: ['Subir a taxa', 'até os erros'], code: ['janela de 42,0/s: erros 6,8% (504)', '2 pods × 20/s do pagamentos = 40/s', 'p95 2.001 ms (o timeout)'],
        story: 'O segundo ponto são os erros. Na janela de 42 pedidos/s, 6,8% voltaram com 504: é a capacidade do pagamentos, 2 pods × 20/s, o elo mais fraco do módulo 14. O p95 já está no timeout de 2 s.',
        look: 'O pagamentos fica vermelho e a primeira barra de erro aparece no mostrador.',
        key: 'Os erros aparecem quando a taxa passa da capacidade do elo.',
        f(o, t) { bph(o, t, 12, 13, [[36, 'meta 36', 'acc'], [42, 'erros 42', 'bad']]); } },
      { id: 'colapso', dur: 8, title: 'Ponto 3, o colapso: o goodput cai de ~40 para ~26/s', yk: 'O COLAPSO (O GOODPUT CAI)', act: ['Subir até 60/s', 'o colapso'], code: ['45,2/s → 40,6/s concluídos', '51,8/s → 29,1/s', '58,4/s → 25,5/s · erros 55%', 'total: 5.470 reqs · 18,84% · exit 99'],
        story: 'O terceiro ponto é o colapso. Acima de ~45/s o goodput cai: 40,6 por segundo concluídos a 45, 29,1 a 52, 25,5 a 58. Mais carga, menos pedidos. O resumo final dá 5.470 requisições, 18,84% de falhas e código 99.',
        look: 'Embaixo, a linha do goodput sobe com a taxa e depois desce, enquanto a tracejada continua subindo.',
        key: 'Colapso: depois do teto, cada pedido a mais derruba o que conclui.',
        f(o, t) { bph(o, t, 13, 18, [[36, 'meta 36', 'acc'], [42, 'erros 42', 'bad'], [48, 'colapso', 'bad']]); if (t > 4.8) { k6(o, 'bpHoje'); o.live = null; } } },
      { id: 'acumulado', dur: 8, title: 'Janela × acumulado: o abortOnFail chega 20 s depois', yk: 'ABORT=1: abortOnFail + delayAbortEval 10s', code: ['por janela: p95 820 ms aos 100–110 s (~35/s)', 'acumulado: p95 894 ms, para aos 128 s', '(~43/s) · 2.764 reqs · 0 erros · exit 99', 'para achar o ponto, leia a janela'],
        story: 'Com abortOnFail ligado, o k6 parou o teste aos 128 s, com ~43 pedidos/s e p95 acumulado de 894 ms. Por janela, o p95 já tinha cruzado 800 ms 20 s antes, na janela de 100 a 110 s, perto de 35/s. A threshold olha o teste inteiro, e o corte automático chega atrasado.',
        look: 'No mostrador, as duas marcas: a janela que cruzou a meta e, 8 pedidos/s depois, o ponto onde o acumulado cruzou e o teste parou.',
        key: 'Para localizar o ponto de quebra, use a janela, e não o agregado.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'oferecida/s', upto: 13, marks: [[35.4, 'janela 820 ms', 'acc'], ...(t > 3 ? [[43, 'acumulado: para', 'bad']] : [])] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} pedidos/s`, 'ABORT=1'); cadeia(o, 'hoje', p[1]); k6(o, 'bpAbort');
          o.cnt = [['JANELA', '820 ms aos ~35/s'], ['ACUMULADO', '894 ms aos 128 s', 'bad'], ['ATRASO', '~20 s · ~8/s', 'dim']];
          if (t > 3) T(o, TF(94), 'parou aos 128 s\np95 acumulado 894 ms', 'bad'); } },
      { id: 'plano', dur: 8, title: 'No "plano", ~250/s; no "plano 2", ~260/s', yk: 'TOPO=360 DUR=4m · "plano" × "plano 2"', code: ['plano: p95 cruza 800 em ~250/s (shard-2)', 'plano 2: ~270 na rampa, ~260 no degrau', 'plano 2: erros em ~300/s (10 × 30, 15 × 20)', 'goodput máx.: ~271/s e ~292/s'],
        story: 'No plano, a meta cai em ~250/s: o shard-2 recebe 60% × 250 = 150/s, o teto dele. Com o mkt-01 num shard dedicado de 2×, o "plano 2" cruza 800 ms em ~270/s na rampa e ~260/s no degrau de 2 minutos, e os erros começam em ~300/s, quando pedidos e pagamentos chegam juntos ao limite.',
        look: 'Duas curvas do p95: a do plano (apagada) cruza a linha antes, a do "plano 2" (acesa) depois. Na cadeia, o shard dedicado aparece ao lado do shard-2.',
        key: 'Cada ambiente quebra num elo diferente: primeiro o shard quente, depois pedidos e pagamentos juntos.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(BP_PLANO), tone: 'dim', lab: '"plano"' }, { pts: byRate(BP_PLANO2), tone: 'acc', lab: '"plano 2"' }], { xmax: 360, ymax: 380, xt: [0, 100, 200, 300], xl: 'oferecida/s', marks: t > 4 ? [[250, 'plano 250', 'dim'], [270, 'plano 2', 'acc'], [300, 'erros 300', 'bad']] : [] });
          gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} pedidos/s`, '1 → 360/s em 4 min'); cadeia(o, 'plano2', p[1]); k6(o, 'bpPlano2'); liveCnt(o, p);
          if (p[4] > 0.1) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, p[4] / 35);
          o.cnt = [['"PLANO"', '~250/s'], ['"PLANO 2"', '~260/s (degrau)'], ['ERROS', '~300/s', 'bad']]; } },
      { id: 'errado', dur: 8, title: 'E se der errado: o gerador sem fôlego', yk: 'O GERADOR TAMBÉM É UM SISTEMA', code: ['plano: dropped_iterations 593 (1,4%)', 'vus_max 674 · k6 e simulador na mesma máquina', 'monitore a CPU do gerador e vus × maxVUs', 'ambiente elástico: o HPA esconde o limite'],
        story: 'Na rodada do plano o k6 deixou de mandar 593 iterações: o gerador ficou para trás, porque dividia a máquina com o simulador. Quando o gerador vira o gargalo, a taxa oferecida é menor do que o script diz. Monitore a CPU do gerador e os VUs perto do maxVUs. E rode sem elasticidade: com o HPA ligado, o teste acha o limite da conta da nuvem.',
        look: 'O k6 fica vermelho, com os VUs perto do teto, e as iterações que ele não mandou se empilham na frente dele.',
        key: 'Se o gerador não aguenta, o teste mede o gerador.',
        f(o, t) { gen(o, 'ramping-arrival-rate', 'dropped 593', 'VUs 674 de 1.000', null, 'bad'); cadeia(o, 'plano', 300); o.on.gen = 'bad'; k6(o, 'bpPlano');
          if (t > 0.6) o.piles.push({ p: [CX.gen, 336], lab: 'dropped 593', f: clamp((t - 0.6) / 3) * 0.8 });
          o.chart = { type: 'rows', title: 'O GERADOR NAS RODADAS', max: 700, rows: [['bp "plano"', 593, '593 dropped · vus 674', 'bad'], ['bp "plano 2"', 488, '488 · vus 575', 'bad'], ['estresse', 182, '182 · vus 377', 'acc'], ['bp "hoje"', 19, '19 · vus 119', 'dim']] };
          o.cnt = [['DROPPED', '593 (1,4%)', 'bad'], ['vus_max', '674', 'dim'], ['MÁQUINA', 'a mesma do simulador', 'dim']];
          if (t > 1) T(o, TF(94), 'o gerador ficou para trás\n593 iterações', 'bad'); } },
    ],
    jornada: [
      { id: 'mix', dur: 7, title: 'A jornada: cartão 60 · Pix 35 · estorno 5', yk: 'O MIX DO TESTE (EXEMPLO DECLARADO)', code: ['artigo: cartão 50 · instantâneo 30', '        boleto 15 · estorno 5', 'loja:   cartão 60 · Pix 35 · estorno 5', 'a 200/s: 120 + 70 + 10 por segundo'],
        story: 'Um teste responde uma pergunta, e a pergunta define o mix. A jornada do artigo vira, na loja, cartão 60%, Pix 35% e estorno 5%, um exemplo declarado. A 200 pedidos/s, o k6 manda 120 de cartão, 70 de Pix e 10 de estorno por segundo.',
        look: 'O k6 mostra o mix que solta na cadeia; no mostrador, as três barras.',
        key: 'O mix vem do que o cliente faz, com a frequência com que faz.',
        f(o, t) { gen(o, 'ramping-arrival-rate', '200 pedidos/s', 'cartão 60 · Pix 35 · estorno 5'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'rows', title: 'O MIX A 200 PEDIDOS/S', max: 100, rows: [['cartão', 60, '60% · 120/s', 'acc'], ['Pix', 35, '35% · 70/s', 'acc'], ['estorno', 5, '5% · 10/s', 'acc']] };
          o.cnt = [['CARTÃO', '120/s'], ['PIX', '70/s', 'dim'], ['ESTORNO', '10/s', 'dim']]; } },
      { id: 'vus', dur: 7, title: 'VUs não são TPS: 680 VUs para 200/s', yk: 'LEI DE LITTLE', code: ['VUs = taxa × (resposta + pausa)', '(0,4 s + 3 s) × 200/s = 680 VUs', 'README: 800 VUs ÷ 600 TPS = 1,33 s', 'sem a pausa, os números não se convertem'],
        story: 'O relatório do autor fala em usuários; a meta da loja é uma taxa. A ponte é a Lei de Little: VUs = taxa × (resposta + pausa). Para 200 pedidos/s, com 0,4 s de resposta e 3 s de pausa (o cliente preenchendo o endereço), são 680 VUs. No modelo aberto, o k6 fixa a taxa e só reserva os VUs que ela pedir.',
        look: 'No k6, cada quadradinho é um VU; poucos estão acesos, esperando resposta: a maioria está na pausa.',
        key: 'VUs = taxa × (resposta + pausa).',
        f(o, t) { gen(o, '680 VUs', '200 pedidos/s', '0,4 s + 3 s de pausa', { n: 60, busy: 0.12 }); cadeia(o, 'plano2', 200);
          o.chart = { type: 'rows', title: 'O CICLO DE UM VU (s)', max: 4, rows: [['resposta', 0.4, '0,4 s', 'acc'], ['pausa', 3, '3 s', 'dim'], ['ciclo', 3.4, '3,4 s × 200 = 680 VUs', 'acc']] };
          o.cnt = [['VUs', '680'], ['TAXA', '200/s', 'dim'], ['CICLO', '3,4 s', 'dim']]; } },
      { id: 'pagina', dur: 7, title: 'Só a página: 100 req/s por réplica, 14 réplicas', yk: 'GET /produtos/42 (10 ms DE CPU)', code: ['1 s ÷ 10 ms = 100 req/s por réplica', '950 req/s a ρ ≤ 70%:', '950 ÷ 70 = 13,6 → 14 réplicas'],
        story: 'A pergunta agora é o catálogo. Um teste que bate só em GET /produtos/42 mede uma página de 10 ms de CPU: 100 req/s por réplica. Para os 950 req/s do plano com ρ até 70%, dá 14 réplicas.',
        look: 'O catálogo no lugar da cadeia, com as 14 réplicas acesas.',
        key: 'O endpoint escolhido decide a capacidade medida.',
        f(o, t) { gen(o, 'constant-arrival-rate', '950 req/s', 'GET /produtos/42'); cat(o, 14, 0);
          o.chart = { type: 'rows', title: 'CAPACIDADE POR RÉPLICA (req/s)', max: 120, rows: [['só a página', 100, '100 req/s · 14 réplicas', 'acc']] };
          o.cnt = [['POR RÉPLICA', '100 req/s'], ['RÉPLICAS', '14', 'dim']]; } },
      { id: 'errado', dur: 8, title: 'E se der errado: 5% de busca, e a réplica cai para 74', yk: 'O CUSTO MÉDIO DO MIX', act: ['Pôr 5% de busca', 'o endpoint caro'], code: ['0,95 × 10 + 0,05 × 80 = 13,5 ms', '1 s ÷ 13,5 ms = 74 req/s por réplica', '950 ÷ (74 × 0,7) → 19 réplicas', 'teste só da página: 14 (faltam 5)'],
        story: 'A busca custa 80 ms de CPU. Com 5% de buscas o custo médio vai a 13,5 ms e a réplica aguenta 74 req/s, e não 100. Para os mesmos 950 req/s são 19 réplicas. Quem testou só o endpoint barato dimensionou 14, e as cinco que faltam só aparecem na Black Friday.',
        look: 'Cinco réplicas novas aparecem no catálogo, em vermelho: as que o teste da página não viu.',
        key: 'Testar só o endpoint barato erra a capacidade; o mix entra no teste.',
        f(o, t) { gen(o, 'constant-arrival-rate', '950 req/s', '95% página · 5% busca'); cat(o, 19, 5);
          o.chart = { type: 'rows', title: 'CAPACIDADE POR RÉPLICA (req/s)', max: 120, rows: [['só a página', 100, '100 req/s · 14 réplicas', 'dim'], ['5% de busca', 74, '74 req/s · 19 réplicas', 'bad']] };
          o.cnt = [['POR RÉPLICA', '74 req/s', 'bad'], ['RÉPLICAS', '19 (eram 14)', 'bad']]; o.res = [['faltariam 5 réplicas na Black Friday', 'bad']];
          if (t > 1) T(o, TF(364), '5% de busca: 74 req/s\n14 → 19 réplicas', 'bad'); } },
    ],
    pre: [
      { id: 'um', dur: 7, title: '1 pod do pedidos: a meta cai em ~35/s', yk: 'PRÉ-TESTE: 1 RÉPLICA, RAMPA ATÉ 38/s', code: ['pedidos: 1 pod (33 ms → 30/s nominais)', 'pagamentos: 100 pods ("sem limite")', 'p95 323 ms a 33,4/s → 1.371 ms a 36,5/s', 'sustentável a 70%: ~21/s'],
        story: 'O pré-teste mede uma unidade antes do conjunto. Com 1 pod no pedidos e o resto sobrando (o pagamentos com 100 pods), a rampa até 38/s mostrou o p95 em 323 ms a 33,4/s e 1.371 ms a 36,5/s: a meta cai em ~35/s, perto dos 30 nominais. Sem erros até o fim da rampa.',
        look: 'Um pod só no pedidos, que fica vermelho no fim da rampa; o pagamentos sem limite, apagado.',
        key: 'Primeiro, a capacidade de uma réplica.',
        f(o, t) { pre(o, t, 1); } },
      { id: 'dois', dur: 7, title: '2 pods: a meta cai em ~62/s', yk: 'RAMPA ATÉ 76/s', act: ['Adicionar um pod', '2 pods'], code: ['nominal 2 × 30 = 60/s', 'p95 678 ms a 60,4/s', '     1.485 ms a 66,6/s', 'erros 25,5% a 72,9/s'],
        story: 'Com 2 pods, a rampa vai até 76/s. A meta cai em ~62/s (678 ms a 60,4/s, 1.485 ms a 66,6/s) e os erros chegam a 25,5% a 72,9/s. A capacidade dobrou com o pod.',
        look: 'Dois pods no pedidos. No mostrador, a segunda curva cruza a meta mais à direita.',
        key: 'Enquanto o pedidos é o elo, cada pod soma capacidade.',
        f(o, t) { pre(o, t, 2); } },
      { id: 'tres', dur: 7, title: '3 pods: ~88/s, uns 30 por pod', yk: 'RAMPA ATÉ 114/s', act: ['Adicionar um pod', '3 pods'], code: ['nominal 3 × 30 = 90/s', 'p95 426 ms a 81,0/s', '     1.024 ms a 90,5/s', 'erros 8,8% a 99,9/s', '1 · 2 · 3 pods → ~35 · ~62 · ~88/s'],
        story: 'Com 3 pods a meta cai em ~88/s e os erros começam a 99,9/s. A capacidade escala quase linear, uns 30 pedidos/s por pod, enquanto o pedidos é o elo.',
        look: 'Três curvas, cada uma cruzando a meta uns 30 pedidos/s depois da anterior.',
        key: 'A capacidade escala linear até o elo mudar.',
        f(o, t) { pre(o, t, 3); } },
      { id: 'errado', dur: 8, title: 'E se der errado: o elo muda para o pagamentos', yk: '"HOJE" COM AS DEPENDÊNCIAS DE VERDADE', act: ['Pôr o pagamentos real', '2 pods'], code: ['pré-teste com 3 pods: passa de 80/s', '"hoje": pagamentos 2 × 20 = 40/s', 'a meta cai em 36/s (degrau de 2 min)', 'o elo mudou: do pedidos para o pagamentos'],
        story: 'O pré-teste com o pagamentos sem limite diz que 3 pods passam de 80/s. Com as dependências de verdade, o "hoje" quebra em 36/s, porque o pagamentos, com 2 pods de 20/s, vira o elo antes. O artigo manda repetir até o gargalo passar para a próxima dependência; é exatamente aqui que ele passa.',
        look: 'O pagamentos volta a 2 pods e fica vermelho; o pedidos, com 3 pods, sobra. No mostrador, a curva do "hoje" cruza a meta muito antes da de 3 pods.',
        key: 'Dependências sem limite no pré-teste escondem o elo seguinte.',
        f(o, t) { const p = series(o, t, [{ pts: byRate(PRE[2]), tone: 'dim', lab: '3 pods, sem limite' }, { pts: byRate(BP_HOJE), tone: 'acc', lab: '"hoje"' }], { xmax: 115, ymax: 120, xt: [0, 30, 60, 90], xl: 'oferecida/s', upto: 13, marks: t > 3.5 ? [[36, 'hoje 36', 'bad'], [88, '3 pods ~88', 'dim']] : [] });
          gen(o, 'ramping-arrival-rate', `${dec(p[1])} pedidos/s`, '"hoje"'); cadeia(o, 'hoje', p[1]); k6(o, 'm36'); liveCnt(o, p);
          o.cnt = [['"HOJE"', '36/s', 'bad'], ['PRÉ-TESTE 3 PODS', '~88/s', 'dim'], ['ELO', 'pagamentos', 'bad']];
          if (t > 2) T(o, TF(449), 'o elo mudou:\npagamentos 2 × 20 = 40/s', 'bad'); } },
    ],
    relatorio: [
      { id: 'ficha', dur: 8, title: 'A ficha: visão geral e objetivos', yk: 'O MODELO DO README, PREENCHIDO', code: ['jornada: checkout (POST /pedidos)', 'ambiente: simulador · k6 v2.3.0', 'objetivos: p95 ≤ 800 ms · erros ≤ 0,1%', '≥ 200 pedidos/s (o plano)'],
        story: 'O assessment é o relatório: objetivos, cenários, resultados e backlog, para a engenharia e o produto lerem o mesmo papel. A ficha começa pela visão geral (data, jornada, versão, ambiente, ferramenta) e pelos objetivos: p95 até 800 ms, erros até 0,1% e pelo menos 200 pedidos/s.',
        look: 'No mostrador, a ficha se preenche linha a linha.',
        key: 'O relatório é o entregável do teste.',
        f(o, t) { gen(o, 'checkout.js', '5 cenários', 'k6 v2.3.0'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'lines', title: 'ASSESSMENT · CHECKOUT', n: 1 + Math.floor(clamp((t - 0.3) / 4) * 5), lines: [['data       20–21/10/2026', 'hi'], ['jornada    checkout (POST /pedidos)', 'hi'], ['ambiente   simulador · ferramenta k6 v2.3.0', 'hi'],
            ['objetivos  p95 ≤ 800 ms · erros ≤ 0,1% · ≥ 200/s', 'acc'], ['cenários   pré-teste · média · spike · estresse · breakpoint', 'hi']] };
          o.cnt = [['OBJETIVOS', 'p95 ≤ 800 · erros ≤ 0,1%'], ['TAXA', '≥ 200/s', 'dim']]; } },
      { id: 'resultados', dur: 10, title: 'Os cinco resultados', yk: 'CONCLUSÕES E BACKLOG', act: ['Preencher os resultados', 'os cinco'], code: ['1 "hoje": 36/s (meta) · ~42 (erros) · 40 → 26', '2 plano: ~250/s, o shard quente do mkt-01', '3 plano 2: ~260/s (meta) · ~300 (erros)', '4 nada dentro do pedidos', '5 pendências: PSP, cache, HPA, buscas, Kafka'],
        story: 'As conclusões, com os testes reais. Um: o "hoje" quebra em 36 pedidos/s pela meta e em ~42 pelos erros, com o goodput caindo de 40 para 26. Dois: o plano quebra em ~250/s, por causa do shard quente; a ação é o shard dedicado. Três: com ele, a meta cai em ~260/s e os erros em ~300/s. Quatro: o teste não achou nada dentro do pedidos. Cinco: as pendências que o teste não cobre.',
        look: 'As cinco linhas acendem uma a uma no mostrador.',
        key: 'Cada conclusão sai de uma medida e vira item de backlog.',
        f(o, t) { gen(o, 'checkout.js', '5 cenários', 'k6 v2.3.0'); cadeia(o, 'plano2', 200);
          o.chart = { type: 'lines', title: 'CONCLUSÕES', n: 1 + Math.floor(clamp((t - 0.3) / 6) * 5), lines: [['1 "hoje": 36/s (meta) · ~42 (erros) · goodput 40 → 26', 'bad'], ['2 "plano": ~250/s, o shard quente → shard dedicado', 'bad'],
            ['3 "plano 2": ~260/s (meta) · ~300/s (erros)', 'acc'], ['4 nada dentro do pedidos', 'hi'], ['5 falta: PSP real, cache, réplicas, HPA, buscas, Kafka', 'dim']] };
          o.cnt = [['"HOJE"', '36/s'], ['"PLANO"', '~250/s', 'bad'], ['"PLANO 2"', '~260/s', 'dim']]; } },
      { id: 'ficha23', dur: 8, title: 'A ficha do módulo 23, corrigida', yk: 'A MARGEM DO PLANO EM NÚMERO', code: ['sustentável 210/s (ρ ≤ 70%): fica como política', 'a meta cai em ~260/s', '260 ÷ 210: conservadora em ~24%', 'meta 200/s: ~30% de folga (260 ÷ 200)'],
        story: 'A ficha do plano é corrigida com os números. A sustentável de 210/s era a política de ρ até 70%, e continua como regra de operação. O ponto onde a meta cai é ~260/s: a ficha era conservadora em ~24%, e a meta de 200/s tem ~30% de folga até a quebra.',
        look: 'No mostrador, as marcas lado a lado: 200 (a meta), 210 (a política), ~260 (a quebra medida) e 300 (o nominal).',
        key: 'O teste transforma a margem do plano num número.',
        f(o, t) { gen(o, 'checkout.js', '"plano 2"', 'k6 v2.3.0'); cadeia(o, 'plano2', 260); k6(o, 'bpPlano2');
          o.chart = { type: 'rows', title: 'O PLANO EM PEDIDOS/S', max: 320, rows: [['meta', 200, '200/s', 'acc'], ['sustentável', 210, '210/s (ρ ≤ 70%)', 'dim'], ['quebra', 260, '~260/s (medido)', 'acc'], ['nominal', 300, '300/s (conta)', 'dim']] };
          o.cnt = [['FOLGA', '~30%'], ['FICHA', 'conservadora em ~24%', 'dim']]; } },
      { id: 'misto', dur: 9, title: 'E se der errado: o relatório das 23:00 e o pool único', yk: 'pool.js: TRÊS FLUXOS, UM POOL DE 20', act: ['Rodar o cenário misto', 'pool.js'], code: ['checkout 10/s · status 40/s', 'relatório das 23:00: 10/s de 4 s (20–50 s)', 'checkout: 503 em 33% (83 de 250)', 'status: 503 em 10% (101 de ~1.000)', 'fora da janela: 0%'],
        story: 'O assessment só vê o que o teste cobriu. O checkout.js mede um fluxo; às 23:00 roda o relatório do mkt-01, e o status do pedido é consultado o tempo todo. O cenário misto junta os três contra um pool único de 20 conexões. Na janela do relatório, 1 em 3 pedidos do checkout recebeu 503, e 10% das consultas de status também. Fora dela, 0%.',
        look: 'O pool de 20 conexões enche com o relatório, em vermelho; o checkout e o status ficam sem vaga, e a pilha de 503 cresce.',
        key: 'O teste só vê o que o script cobre: um fluxo derruba o outro por dividir o pool.',
        f(o, t) { const on = t > 1.2, fill = on ? Math.min(20, Math.round((t - 1.2) * 8)) : 0;
          gen(o, 'pool.js', '3 cenários · 60/s', on ? 'relatório: 10/s de 4 s' : 'antes das 23:00', null, on ? 'bad' : 2);
          o.show.pool = 1; o.on.pool = fill >= 20 ? 'bad' : 1;
          o.rows.pool = { ...act('pool do pedidos', '20 conexões', ['checkout 10/s · status 40/s', 'dim'], [on ? `relatório: ${fill} de 20` : 'relatório: 0', on ? 'bad' : 'dim']), slots: { n: 20, r: fill } };
          o.beams.push({ pts: BM.g2c, on: true, tone: on ? 'bad' : '', n: 3 });
          if (fill >= 20) pile(o, 'pool', '503 · 33%', clamp((t - 3.7) / 3));
          k6(o, 'pool');
          o.chart = { type: 'rows', title: 'NA JANELA 25–50 s: 503', max: 100, rows: [['checkout', 33, '33% (83 de 250)', 'bad'], ['status', 10, '10% (101 de ~1.000)', 'bad'], ['relatório', 53, '53% recusado', 'dim'], ['fora da janela', 0, '0%', 'acc']] };
          o.cnt = [['CHECKOUT 503', on && fill >= 20 ? '33%' : '0%', 'bad'], ['STATUS 503', on && fill >= 20 ? '10%' : '0%', 'bad'], ['POOL', `${fill} de 20 com o relatório`, 'dim']];
          o.res = [['um fluxo derrubou o outro (módulo 25)', 'bad']];
          if (fill >= 20) T(o, TF(364), 'pool cheio de relatório\n1 em 3 checkouts: 503', 'bad'); } },
    ],
  };
  // gráficos e pedaços repetidos
  function MODEL(n) { return { type: 'rows', title: 'CONCLUÍDOS/S × ERROS', max: 60, mark: { v: 40, lab: 'capacidade ~40' },
    rows: [['20 VUs', 38.1, '38,1/s · 0%', 'acc'], ['60 VUs', 41.1, '41,1/s · 8,35%', 'bad'], ['aberto 54/s', 25.9, '~26/s · 52%', 'bad']].slice(0, n) }; }
  function est(o, t, a, b) {
    const p = series(o, t, [{ pts: EST, tone: 'acc' }], { xmax: 300, ymax: 320, xt: [0, 100, 200, 300], xl: 's', time: true, reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / EST.length, upto: EST.length });
    gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} pedidos/s`, '"plano 2" · escada'); cadeia(o, 'plano2', p[1]); liveCnt(o, p, true);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4])}%`, 0.2 + p[4] / 8);
    if (p[3] > 800 && p[1] >= 250) T(o, TF(364), `${Math.round(p[1])}/s: p95 ${ms(p[3])}`, 'bad');
  }
  function spk(o, t, a, b) {
    const p = series(o, t, [{ pts: SPIKE, tone: 'acc' }], { xmax: 200, ymax: 70, xt: [0, 50, 100, 150, 200], xl: 's', time: true, reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / SPIKE.length, upto: SPIKE.length });
    gen(o, 'ramping-arrival-rate', `${Math.round(p[1])} pedidos/s`, '"hoje" · spike'); cadeia(o, 'hoje', p[1]); liveCnt(o, p, true);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, 0.2 + p[4] / 80);
  }
  function bph(o, t, a, b, marks) {
    const p = series(o, t, [{ pts: byRate(BP_HOJE), tone: 'acc' }], { xmax: 62, ymax: 65, xt: [0, 20, 40, 60], xl: 'oferecida/s', reveal: (a + (b - a) * sg(t, 0.3, 4.3)) / BP_HOJE.length, upto: BP_HOJE.length, marks });
    gen(o, 'ramping-arrival-rate', `${dec(p[1])} pedidos/s`, '1 → 60/s em 3 min'); cadeia(o, 'hoje', p[1]); liveCnt(o, p);
    if (p[4] > 0) pile(o, 'pag', `504 · ${dec(p[4], 0)}%`, 0.15 + p[4] / 60);
  }
  function pre(o, t, n) {
    const L3 = [{ pts: byRate(PRE[0]), lab: '1 pod' }, { pts: byRate(PRE[1]), lab: '2 pods' }, { pts: byRate(PRE[2]), lab: '3 pods' }].slice(0, n).map((s, i) => ({ ...s, tone: i === n - 1 ? 'acc' : 'dim' }));
    const p = series(o, t, L3, { xmax: 115, ymax: 120, xt: [0, 30, 60, 90], xl: 'oferecida/s', marks: t > 4 ? [[[35, 62, 88][n - 1], `${n} ${n > 1 ? 'pods' : 'pod'} ~${[35, 62, 88][n - 1]}`, 'acc']] : [] });
    gen(o, 'ramping-arrival-rate', `${dec(p[1])} pedidos/s`, `rampa até ${38 * n}/s`); cadeia(o, 'hoje', p[1], { env: { ped: n, pag: 100 } }); k6(o, 'pre' + n); liveCnt(o, p);
    o.cnt = [['A META CAI EM', `~${[35, 62, 88][n - 1]}/s`], ['NOMINAL', `${30 * n}/s`, 'dim'], ...o.cnt.slice(0, 2)];
    if (p[4] > 0.1) pile(o, 'ped', `504 · ${dec(p[4], 0)}%`, p[4] / 30);
  }
  function cat(o, n, bad) { o.show.cat = 1; o.on.cat = bad ? 'bad' : 1;
    o.rows.cat = { ...act('catalogo', `${n} réplicas`, ['página 10 ms · busca 80 ms', 'dim'], [bad ? '74 req/s por réplica' : '100 req/s por réplica', bad ? 'bad' : 'acc']), pods: { n, bad, tone: 'acc' } };
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
      if (o.live) { txt('AO VIVO · ' + o.live.t.toUpperCase(), 8, 9, 8, 142, INK()); const st = o.live.rows.length > 4 ? 22.5 : 27;
        o.live.rows.forEach(([l, v, tn_], i) => { const Y = 25 + i * st; txt(l, 8, Y, 8, 70, INK()); txt(v, 8, Y + 10.5, 11.5, 142, tn_ === 'bad' ? BAD() : tn_ === 'acc' ? acc : C.inkHi); }); }
      else { const k = o.k6, okP = k.p < 800, okF = k.fail === '0,00%';
        txt('k6 · ' + k.t, 8, 10, 8.6, 142, acc);
        const rows = [['http_reqs', k.reqs, 'hi'], ['avg', k.avg, 'hi'], ['p(95)', k.p95 + (okP ? ' ✓' : ' ✗'), okP ? 'acc' : 'bad'], ['p(99)', k.p99, 'hi'],
          ['http_req_failed', k.fail + (okF ? ' ✓' : ' ✗'), okF ? 'acc' : 'bad'], ['dropped_iterations', k.drop, k.drop !== '0' ? 'bad' : 'hi'], ['exit', String(k.exit) + (k.note ? ' (' + k.note + ')' : ''), k.exit ? 'bad' : 'acc']];
        rows.forEach(([l, v, tn_], i) => { const Y = 26 + i * 15.5; txt(l, 8, Y, 8.2, 78, INK()); txt(v, 89, Y, 9.2, 60, tone(tn_)); }); }
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(Hd - 6)); x.stroke(); }
    const R = Wd - 8, AW = R - L0;
    if (!ch) {   // sem gráfico: a conta do passo
      txt(s.yk || 'A CONTA', L0, 10, 8.4, AW, INK());
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
      txt('AS CINCO FORMAS DE CARGA (TAXA × TEMPO)', L0, 10, 8.4, AW, INK());
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
      txt('meta 800 ms', X1, pyT(800) - 5, 7.4, 60, BAD(), 'right');
      txt(`${ch.ymax}/s`, X0 - 3, B0, 7.6, 24, INK(), 'right'); txt('0', X0 - 3, B1, 7.6, 22, INK(), 'right');
      ch.xt.forEach(v => txt(String(v), px(v), B1 + 7, 7.6, 30, INK(), 'center')); txt(ch.xl, X1, B1 + 16, 7.6, 80, INK(), 'right');
      // legenda embaixo, à esquerda do eixo x
      txt('— concluídos  ┄ oferecida  ▮ erros', X0, B1 + 16, 7.4, X1 - X0 - 70, INK());
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
    perfis: () => `<table class="h3-sum"><tr><th>tipo</th><th>forma</th><th>na loja</th></tr><tr${on_(step === 0)}><td>smoke</td><td>poucos VUs</td><td>2/s × 30 s: 61 reqs, p95 156 ms</td></tr><tr><td>carga média</td><td>a esperada</td><td>30/s × 2 min: p95 381 ms</td></tr><tr><td>estresse</td><td>degraus acima</td><td>100 → 300/s no plano 2</td></tr><tr><td>spike</td><td>salto e volta</td><td>5 → 60/s em 10 s: 47–65% de erros</td></tr><tr${on_(step >= 2)}><td>breakpoint</td><td>rampa até quebrar</td><td>1 → 60/s ("hoje"), 1 → 360/s ("plano")</td></tr></table><li>"Hoje": pedidos 3 pods (30/s cada), pagamentos 2 (20/s cada), estoque 2, 3 shards de 150/s</li><li>"Plano": pedidos 10, pagamentos 15, 3 shards; "plano 2": + o shard dedicado de 2× para o <code>mkt-01</code></li><li>Mix do teste: 40% <code>mkt-01</code> (→ <code>shard-2</code>, que fica com 60%) e 60% espalhados</li><li>Simulador: cada pod é uma fila FIFO com tempo exponencial; <code>lb-loja</code> em round robin; prazo de 2 s → 504</li>`,
    modelo: () => `<table class="h3-sum"><tr><th>gerador</th><th>vazão</th><th>média</th><th>p95</th><th>erros</th></tr><tr${on_(step === 0)}><td>fechado, 20 VUs</td><td>38,1/s</td><td>520 ms</td><td>1,07 s</td><td>0%</td></tr><tr${on_(step === 1)}><td>fechado, 60 VUs</td><td>41,1/s</td><td>1,43 s</td><td>2 s</td><td>8,35%</td></tr><tr${on_(step === 2)}><td>aberto, 54/s</td><td>~26/s</td><td>med. 2 s</td><td>2 s</td><td>52%</td></tr></table><li>Little com 20 VUs: 20 = 38,07 × 0,520 s</li><li>VUs = taxa × (resposta + pausa): 800 ÷ 600 = <b>1,33 s</b> de ciclo; 200/s com 0,4 + 3 s = <b>680 VUs</b></li><li>Os dois fechados terminaram com <code>exit 99</code> (o p95 passou de 800 ms), mas só o de 60 VUs teve erros</li><li><i>Coordinated omission</i>: documentação do k6, "Open and closed models"</li>`,
    smoke: () => `<table class="h3-sum"><tr><th>métrica</th><th>valor</th></tr><tr><td>requisições</td><td>61</td></tr><tr><td>avg · med</td><td>81,9 · 78,2 ms</td></tr><tr><td>p90 · p95</td><td>138,0 · 155,6 ms</td></tr><tr><td>p99 · máx.</td><td>213,7 · 247,5 ms</td></tr><tr${on_(step === 1)}><td>erros · exit</td><td>0% · 0</td></tr></table><li>Sem fila: 33 + 50 + 2 + 6,67 = <b>91,7 ms</b></li><li><code>lena-77</code> → <code>murmur3 mod 3</code> = 1 → <code>shard-1</code>; <code>mkt-01</code> → <code>shard-2</code></li><li>Frete do módulo 22: 49,00 × 64,00, e o 201 não confere</li><li>O k6: "poucos VUs; mais de 5 já é mini-carga"</li>`,
    media: () => `<table class="h3-sum"><tr><th>rodada</th><th>avg</th><th>p95</th><th>p99</th><th>erros</th></tr><tr${on_(step <= 1)}><td>"hoje" 30/s</td><td>157,5</td><td>381,3</td><td>498,6</td><td>0%</td></tr><tr><td>"hoje" 33/s</td><td>186</td><td>431</td><td>626</td><td>0%</td></tr><tr${on_(step === 2)}><td>"hoje" 36/s</td><td>334</td><td>798</td><td>980</td><td>0%</td></tr><tr${on_(step === 3)}><td>"plano" 125/s</td><td>109,9</td><td>247,2</td><td>357,4</td><td>0%</td></tr></table><li>Tempos em ms; 33/s e 36/s são degraus de 2 min (regime permanente)</li><li>M/M/1 a 30/s: 49 + 200 + 2 + 7 ≈ <b>259 ms</b>; o k6 mediu <b>157,5</b></li><li>Média de 2027: 200 × 400 ÷ 640 = <b>125/s</b>; o <code>shard-2</code> recebe 75 de 150 (50%)</li>`,
    estresse: () => `<table class="h3-sum"><tr><th>patamar</th><th>p95 (janelas)</th><th>erros</th><th>concluídos</th></tr><tr${on_(step === 0)}><td>100/s</td><td>208–232 ms</td><td>0%</td><td>~100</td></tr><tr${on_(step === 1)}><td>200/s (a meta)</td><td>334–406 ms</td><td>0%</td><td>~200</td></tr><tr${on_(step === 2)}><td>250/s</td><td>504–738 ms</td><td>0%</td><td>~250</td></tr><tr${on_(step === 3)}><td>300/s</td><td>1.497–2.000 ms</td><td>0,7–5,1%</td><td>280–293</td></tr><tr${on_(step === 4)}><td>volta a 100/s</td><td>244 ms (2ª janela)</td><td>0%</td><td>100</td></tr></table><li>Total: 59.567 requisições, avg 419 ms, p95 1,48 s, p99 1,92 s, falhas 0,54%, <code>dropped_iterations</code> 182, <code>exit 99</code></li><li>"Hoje", acima do teto: 45,2 → 40,6/s; 51,8 → 29,1/s; 58,4 → 25,5/s concluídos</li>`,
    spike: () => `<table class="h3-sum"><tr><th>fase</th><th>p95</th><th>erros</th><th>goodput</th></tr><tr${on_(step === 0)}><td>base 5/s</td><td>164–225 ms</td><td>0%</td><td>5/s</td></tr><tr${on_(step === 1)}><td>salto 5 → 60</td><td>1,05 s</td><td>0%</td><td>27/s</td></tr><tr${on_(step === 2)}><td>topo 60/s</td><td>2 s</td><td>47–65%</td><td>21–30/s</td></tr><tr${on_(step === 4)}><td>volta a 5/s</td><td>168 ms (1ª janela)</td><td>0%</td><td>5/s</td></tr></table><li>Total: 4.828 requisições, 42,58% de falhas, <code>dropped_iterations</code> 21, <code>exit 99</code></li><li>HPA do módulo 14: ~60 s → 20/s × 60 s = <b>1.200</b> pedidos sem atendimento</li><li>Pré-escala com 4 pods no pagamentos: <b>conta</b>, não rodada no lab</li>`,
    breakpoint: () => `<table class="h3-sum"><tr><th>oferecida</th><th>concluídos</th><th>p95</th><th>erros</th></tr><tr${on_(step === 0)}><td>32,1/s</td><td>32,8</td><td>357 ms</td><td>0%</td></tr><tr${on_(step === 1)}><td>38,7/s</td><td>36,3</td><td>932 ms</td><td>0%</td></tr><tr${on_(step === 2)}><td>42,0/s</td><td>37,2</td><td>2.001 ms</td><td>6,8%</td></tr><tr${on_(step === 3)}><td>45,2/s</td><td>40,6</td><td>2.000 ms</td><td>6,5%</td></tr><tr${on_(step === 3)}><td>58,4/s</td><td>25,5</td><td>2.002 ms</td><td>55,4%</td></tr></table><li>"Hoje": meta em <b>36/s</b> (degrau: p95 798 ms) · erros em ~42/s · goodput cai a ~26/s</li><li>"Plano": ~250/s (o <code>shard-2</code> a 150/s); "plano 2": ~260/s no degrau, erros em ~300/s</li><li>ABORT=1: parou aos <b>128 s</b> com p95 acumulado de 894 ms; por janela, 820 ms aos 100–110 s</li><li>Rampa × degrau: a rampa de 3–4 min é ~4% otimista; o degrau confirma</li>`,
    jornada: () => `<table class="h3-sum"><tr><th>pergunta</th><th>na loja</th></tr><tr><td>tráfego hoje</td><td>30 pedidos/s (Black Friday de 2026)</td></tr><tr><td>objetivos</td><td>p95 ≤ 800 ms, erros ≤ 0,1%, ρ ≤ 70%</td></tr><tr><td>crescimento</td><td>45 · 200 · 300 pedidos/s</td></tr><tr${on_(step === 0)}><td>jornada</td><td>cartão 60 · Pix 35 · estorno 5</td></tr><tr${on_(step >= 2)}><td>barato × caro</td><td>página 10 ms · busca 80 ms</td></tr></table><li>VUs = taxa × (resposta + pausa) = (0,4 + 3) × 200 = <b>680</b></li><li>5% de busca: 0,95 × 10 + 0,05 × 80 = 13,5 ms → 74 req/s; 950 req/s a 70% → <b>19</b> réplicas (eram 14)</li>`,
    pre: () => `<table class="h3-sum"><tr><th>pods do pedidos</th><th>nominal</th><th>meta cai em</th><th>primeiros erros</th></tr><tr${on_(step === 0)}><td>1</td><td>30/s</td><td>~35/s</td><td>nenhum até 38/s</td></tr><tr${on_(step === 1)}><td>2</td><td>60/s</td><td>~62/s</td><td>72,9/s (25,5%)</td></tr><tr${on_(step === 2)}><td>3</td><td>90/s</td><td>~88/s</td><td>99,9/s (8,8%)</td></tr><tr${on_(step === 3)}><td>"hoje" (pagamentos 2)</td><td>40/s</td><td>36/s</td><td>~42/s</td></tr></table><li>Pré-teste com o pagamentos em 100 pods ("sem limite") e shards sobrando</li><li>Validação assíncrona: o <code>entregas</code> consome 40 eventos/s por partição com a fila cheia, sem morrer</li>`,
    relatorio: () => `<table class="h3-sum"><tr><th>cenário</th><th>resultado</th></tr><tr><td>pré-teste</td><td>~35 · ~62 · ~88/s (1, 2, 3 pods)</td></tr><tr><td>média "hoje" 30/s</td><td>p95 381 ms, 0%</td></tr><tr><td>spike 5 → 60/s</td><td>47–65% de erros no topo</td></tr><tr><td>estresse plano 2</td><td>meta até 250/s; 300/s falha</td></tr><tr${on_(step === 1)}><td>breakpoint plano</td><td>~250/s (shard quente)</td></tr></table><li>Cenário misto (<code>pool.js</code>), pool único de 20: checkout 503 em <b>33%</b> (83 de 250), status em <b>10%</b> (101 de ~1.000), relatório 53% recusado; fora da janela, 0%</li><li>O resumo do <code>pool.js</code> deu p95 de 56 ms e <code>exit 0</code> (sem thresholds): o agregado esconde o 1 em 3</li><li>Módulo 25: o mesmo cenário com o pool dividido 16 + 4 → 0% de 503 no cliente</li>`,
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
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${(i + 1) % 10}">${SCNAME[v]}</button>`).join('')}</div>
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
  function readout() { if (active !== 'carga') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(475, 240, -150), dist: innerWidth < 640 ? 15.5 : 18.5 } : { target: W(190, 240, 60), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–9, 0 · arraste para girar' };
})() });
