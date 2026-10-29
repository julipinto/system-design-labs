// Figura 3D (iso-glow): a frota do catálogo no minuto das 20:03 da Black Friday. Dez trilhos (catalogo-1 … catalogo-10),
// cada um com a torre de CPU da réplica na ponta; as 100 requisições da amostra como blocos cuja altura é o tempo em ms;
// o navegador da Lena em Recife, o lb-loja e os três cronômetros (navegador, balanceador, réplica).
// Cena: atrás, o mostrador (contadores, a conta real e o resultado); na frente, os trilhos ou a régua onde os blocos se ordenam.
// Cenários (toggle e ?mode=medir|percentis|quente|joelho; ?step=N abre no passo N; ?sem=1 tira a catalogo-3 da amostra; ?t=S congela o passo em S segundos).
// Dados: a história canônica do módulo 14 (docs/escrita/performance-brief.md); contas refeitas aqui (média, posto mais próximo, Little, R(ρ)).
FIGS3D.push({ id: 'latencia', name: 'Latency', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const nf = (v, d = 1) => Number(v).toLocaleString('en-US', { maximumFractionDigits: d });
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['medir', 'percentis', 'quente', 'joelho'];
  const SCNAME = { medir: 'Measure', percentis: 'Percentiles', quente: 'Hot', joelho: 'Knee' };
  const SCFULL = { medir: 'Three measuring points', percentis: 'Average and percentiles', quente: 'The hot replica', joelho: 'The knee curve' };
  const AULA = { medir: 'aula-1-definindo-e-metrificando-performance', percentis: 'aula-2-metricas-de-performance',
    quente: 'aula-2-metricas-de-performance', joelho: 'aula-3-entendendo-a-capacidade-em-sistemas' };
  let clk = 0, sc = 'medir', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', sem = false, TFIX = null;   // ?t=S congela o relógio do passo (para as prévias)
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; if (q.get('sem') === '1') sem = true; if (q.has('t')) TFIX = +q.get('t'); } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-latencia3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── os dados: a amostra de 100 requisições do minuto das 20:03 (ms no lb-loja) ──
  const NR = 10, HOT = 2, RN = i => 'catalogo-' + (i + 1);
  // 9 réplicas saudáveis: 26 ×20 · 32 ×30 · 40 ×25 · 55 ×10 · 74 ×5; o p99 (= máximo) é 74 em cinco delas e 55 nas outras quatro
  const MIX74 = [74, 55, 40, 40, 40, 32, 32, 32, 26, 26], MA = [55, 55, 40, 40, 40, 32, 32, 32, 26, 26],
    MB = [55, 40, 40, 40, 32, 32, 32, 32, 26, 26], MC = [55, 40, 40, 32, 32, 32, 32, 26, 26, 26];
  const HOTV = [150, 300, 450, 600, 800, 1000, 1200, 1500, 2000, 2100];   // a catalogo-3 em ordem de chegada (a fila crescendo)
  const PERM = [3, 7, 0, 9, 5, 1, 8, 2, 6, 4];                               // ordem de chegada nos trilhos saudáveis
  const RAILV = [MIX74, MA, HOTV, MIX74, MB, MIX74, MC, MIX74, MC, MIX74];
  const shuf = (arr, r) => arr.map((_, j) => arr[PERM[(j + r * 3) % 10]]);
  const VAL = RAILV.flatMap((arr, r) => r === HOT ? arr : shuf(arr, r));
  // depois de corrigir o balanceamento (módulo 7): 28 ×20 · 34 ×30 · 42 ×25 · 56 ×15 · 58 ×8 · 73 ×2, todas a 67,5%
  const S2 = [[28, 20], [34, 30], [42, 25], [56, 15], [58, 8], [73, 2]].flatMap(([v, n]) => Array(n).fill(v));
  const VAL2 = Array(100); S2.forEach((v, n) => { VAL2[(n % 10) * 10 + Math.floor(n / 10)] = v; });
  for (let r = 0; r < NR; r++) { const a = shuf(VAL2.slice(r * 10, r * 10 + 10), r); a.forEach((v, j) => VAL2[r * 10 + j] = v); }
  const rankOf = vals => { const ids = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b] || a - b), rk = Array(100); ids.forEach((id, n) => rk[id] = n); return { ids, rk }; };
  const RK1 = rankOf(VAL), RK2 = rankOf(VAL2);
  const stats = vals => { const s = vals.slice().sort((a, b) => a - b), pr = p => s[Math.ceil(p / 100 * s.length) - 1];
    return { mean: vals.reduce((a, b) => a + b, 0) / vals.length, p50: pr(50), p90: pr(90), p95: pr(95), p99: pr(99), max: s[s.length - 1], err: vals.filter(v => v > 2000).length }; };
  const ST1 = stats(VAL), ST2 = stats(VAL2);
  const p99r = r => Math.max(...VAL.slice(r * 10, r * 10 + 10));
  const MEANP99 = Array.from({ length: NR }, (_, r) => p99r(r)).reduce((a, b) => a + b, 0) / NR;   // 269
  const Rr = rho => 10 + 10 / (1 - rho);                                                             // R(ρ) em ms
  // em voo (Little): 64,6 na catalogo-3, 2,4 em cada saudável → 65 cubos lá e 22 espalhados (3 ou 2 por trilho)
  const INFL = [3, 2, 65, 3, 2, 3, 2, 2, 3, 2];

  // ── geometria ──
  const PL = 7, LZ = PL + 4;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 600, 12, 211, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(594, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + 207.5, 592, 203.5, 4, g0), SK = 592 / 416;
  const RY = i => 34 + i * 38, YC = i => RY(i) + 15, YF = i => RY(i) + 26;
  const RX0 = 190, HX = 806, HW = 76, HB = 20;
  function block(nm, w, d, h, kind, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'head' ? 4 : kind === 'lane' || kind === 'ruler' ? 3 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, kind, key: '', f: 0, pos: null, hh: h };
  }
  const B = {};
  block('cli', 140, 96, 26, 'actor'); block('lb', 140, 110, 26, 'actor'); block('one', 140, 130, 26, 'actor');
  for (let i = 0; i < NR; i++) block('r' + i, 610, 30, 4, 'lane', 4);
  for (let i = 0; i < NR; i++) block('h' + i, HW, 30, HB, 'head', 6);
  block('regua', 692, 100, 4, 'ruler', 4);
  const NAMES = Object.keys(B);
  // as 100 requisições: uma caixa de 10 × 10 × 10 que se estica até o tamanho de cada passo (bloco de ms, cubo na fila, barra da curva)
  const REQ = Array.from({ length: 100 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 10, 10, 10, 1.2, mat, g); return { g, mat, cur: null }; });
  creases(first);

  // conexões grossas (vigas), pontos de luz que correm nelas e linhas de marca (média, meta, timeout)
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 140 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const LINES = Array.from({ length: 3 }, () => { const m = new THREE.Mesh(BOX, beamOn); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const mkDot = () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = Array.from({ length: 12 }, mkDot), PTS = Array.from({ length: 2 }, mkDot);
  const badEm = new THREE.Color(0xe0180c);
  // no claro o shader de preenchimento pinta de sódio tudo que brilha: o vermelho vai na cor da peça, sem brilho
  const LBAD = new THREE.Color(0xd6574b);
  function paint(mat, tone, k) { const light = theme === 'light';
    if (tone === 'bad' && light) { mat.color.copy(LBAD); mat.emissiveIntensity = 0; return; }
    mat.color.set(THEMES[theme].body); mat.emissive.copy(tone === 'bad' ? badEm : accent); mat.emissiveIntensity = k; }
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); D.mat.emissive.copy(b.tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, b.tone === 'bad' ? 0.5 : 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }
  function setLines(list) {
    LINES.forEach((m, i) => { const l = list[i]; if (!l) { m.visible = false; return; }
      const th = (l.tone === 'dim' ? 1.6 : 2.4) * TS; m.visible = true; m.material = l.tone === 'bad' ? beamBad : l.tone === 'dim' ? beamOff : beamOn;
      m.position.copy(W((l.x0 + l.x1) / 2, l.y, l.z)); m.quaternion.identity(); m.scale.set((l.x1 - l.x0) * TS, th, (l.d || 2.5) * TS); });
  }
  function setPts(list) {
    PTS.forEach((D, i) => { const p = list[i]; if (!p) { D.g.visible = false; D.glow.material.uniforms.intensity.value = 0; return; }
      D.g.visible = true; D.g.position.copy(W(...p.p)); D.g.scale.setScalar(1.3); paint(D.mat, p.tone, 1.3); moveGlow(D.glow, p.p, p.tone === 'bad' ? 0.6 : 1); });
  }

  // ── rótulos que olham para a câmera (balões fixos e textos que viajam com o pedido) ──
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
  const TAGS = [tag(12), tag(12), tag(12), tag(12)], MSGS = [tag(10.5), tag(10.5)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── lugares (canto de trás-esquerda de cada bloco) e rotas ──
  const LAY = { cli: [24, 330], lb: [24, 160], one: [24, 150], regua: [190, 163] };
  for (let i = 0; i < NR; i++) { LAY['r' + i] = [RX0, RY(i)]; LAY['h' + i] = [HX, RY(i)]; }
  const RAILS = Array.from({ length: NR }, (_, i) => 'r' + i), HEADS = Array.from({ length: NR }, (_, i) => 'h' + i);
  const SHOW = { medir: ['cli', 'lb', ...RAILS, ...HEADS], percentis: [...RAILS, ...HEADS], quente: ['lb', ...RAILS, ...HEADS], joelho: ['one', 'regua'] };
  const P3 = (pts, z) => pts.map(p => [p[0], p[1], p.length > 2 ? p[2] : z]);
  const R = {
    c2l: P3([[94, 330], [94, 270]], 20),
    l2r: i => P3([[164, 215, 16], [177, 215, 14], [177, YF(i), 14], [RX0, YF(i), 14]]),
    al: i => P3([[RX0, YF(i)], [HX, YF(i)]], LZ + 2),
    l2h: i => P3([[164, 215, 16], [177, 215, 14], [177, YF(i), 14], [HX, YF(i), LZ + 2], [HX + 30, YC(i), LZ + 26]]),
  };
  const rev = pts => pts.slice().reverse();
  // posições dos blocos: no trilho (10 por réplica, perto da ponta), na régua (pelo posto) e na fila (cubos encostados na réplica)
  const KMS = 0.1, KJ = 0.16, hMs = v => Math.max(2.5, v * KMS);
  const railP = (id, v) => { const r = Math.floor(id / 10), j = id % 10; return { x: 606 + j * 19.5, y: YC(r), z: LZ, w: 15, d: 18, h: hMs(v) }; };
  const XR = n => 196 + n * 6.85 + 2.7, RGY = 213;
  const rulerP = (n, v) => ({ x: XR(n), y: RGY, z: LZ, w: 5.4, d: 56, h: hMs(v) });
  const queueP = (r, q) => ({ x: HX - 7 - q * 7.5, y: YC(r), z: LZ, w: 6, d: 20, h: 12 });

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows });
  const lane = (name, meta) => ({ name, meta });
  const cpuH = c => HB * (0.4 + c / 100 * 0.6);   // a torre de CPU: 40% da altura parada, o resto acompanha a CPU
  function setCpu(o, i, c, tone) { o.rows['h' + i] = { pct: nf(c) + '%', f: c / 100, sub: 'CPU' }; o.hgt['h' + i] = cpuH(c); if (tone) o.on['h' + i] = tone; }
  function base() {
    const o = { show: {}, pos: { ...LAY }, on: {}, rows: {}, hgt: {}, beams: [], tags: [], msgs: [], reqs: [], lines: [], pts: [], cnt: [], res: [], code: null };
    SHOW[sc].forEach(n => o.show[n] = 1);
    for (let i = 0; i < NR; i++) { o.rows['r' + i] = lane(RN(i), ''); o.rows['h' + i] = { pct: '—', f: 0, sub: 'CPU' }; o.hgt['h' + i] = cpuH(0); }
    if (sc === 'medir') {
      o.rows.cli = act('BROWSER', 'Lena · Recife', ['GET /produtos/42', 'dim'], ['the cat page', 'dim']);
      o.rows.lb = act('lb-loja', 'SP', ['round robin', 'dim'], ['timeout 2 s', 'dim']);
      o.beams.push({ pts: R.c2l }); for (let i = 0; i < NR; i++) o.beams.push({ pts: R.l2r(i) }, { pts: R.al(i) });
    }
    if (sc === 'quente') {
      o.rows.lb = act('lb-loja', '640 req/s', ['round robin', 'dim'], ['unweighted', 'dim']);
      for (let i = 0; i < NR; i++) o.beams.push({ pts: R.l2r(i) }, { pts: R.al(i) });
    }
    if (sc === 'percentis') for (let i = 0; i < NR; i++) o.rows['r' + i] = lane(RN(i), '10 in the sample');
    if (sc === 'joelho') o.rows.regua = { name: 'R(ρ) from 0% to 99% CPU', ticks: [[0, '0%'], [40, '40%'], [70, '70%'], [90, '90%'], [99, '99%']] };
    return o;
  }
  const Q = (o, i, p, tone = '') => { o.reqs[i] = { ...p, tone }; };
  // um pedido que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.3) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    return f >= 1;
  }
  const lit = (o, pts, tone) => o.beams.push({ pts, on: true, tone });

  // ── medir: a viagem de um pedido e os três cronômetros ──
  // fases (s de animação): ida Recife → SP 40 ms, salto até a réplica ~0 ms, processamento, volta ao lb ~0 ms, volta a Recife 40 ms
  function trip(o, t, rail, proc, aProc, lights, hot) {
    const a0 = 0.4, a1 = a0 + 1.1, a2 = a1 + 0.8, a3 = a2 + aProc, a4 = a3 + 0.8, a5 = a4 + 1.1;
    const ms = t < a0 ? 0 : t < a1 ? 40 * (t - a0) / (a1 - a0) : t < a2 ? 40 : t < a3 ? 40 + proc * (t - a2) / (a3 - a2) : t < a4 ? 40 + proc : t < a5 ? 40 + proc + 40 * (t - a4) / (a5 - a4) : 80 + proc;
    const tone = hot ? 'bad' : 'acc';
    send(o, t, a0, a1, R.c2l, 'going · 40 ms', 'acc', 0); if (t >= a1 && t < a2) send(o, t, a1, a2, R.l2h(rail), 'GET /produtos/42', 'acc', 0);
    if (t >= a2 && t < a3) { lit(o, R.l2h(rail), hot ? 'bad' : ''); o.on['h' + rail] = hot ? 'bad' : 1; }
    if (t >= a3 && t < a4) send(o, t, a3, a4, rev(R.l2h(rail)), '200 OK', tone, 0); if (t >= a4) send(o, t, a4, a5, rev(R.c2l), 'back · 40 ms', tone, 0.4);
    const nav = ms, lbv = t < a1 ? 0 : clamp(ms - 40, 0, proc), rep = t < a2 ? 0 : clamp(ms - 40, 0, proc);
    const done = t >= a5;
    if (t >= a0 && t < a5) o.on.cli = 1; if (t >= a1 && t < a4) o.on.lb = 1;
    const v = (on, x, d) => on ? nf(Math.round(x), 0) + ' ms' : '—';
    o.cnt = [['BROWSER', v(lights.nav, nav), lights.nav ? (hot && nav > 1000 ? 'bad' : '') : 'dim'], ['LB-LOJA', v(lights.lb, lbv), lights.lb ? (hot && lbv > 1000 ? 'bad' : '') : 'dim'], ['REPLICA', v(lights.rep, rep), hot && rep > 1000 ? 'bad' : '']];
    const top = (x, y, z, on, val, nm) => { if (on && t >= a0) T(o, [x, y, z], `${nm}\n${nf(Math.round(val), 0)} ms`, hot && val > 1000 ? 'bad' : 'acc'); };
    top(94, 382, 110, lights.nav, nav, 'browser'); top(94, 215, 112, lights.lb, lbv, 'lb-loja'); top(HX + 20, YC(rail), 125, lights.rep, rep, RN(rail));
    return { done, nav, lbv, rep };
  }
  const flightCubes = (o, n3, tone3 = 'bad') => { let k = 0; for (let r = 0; r < NR; r++) { const n = r === HOT ? n3 : INFL[r];
    for (let q = 0; q < n && k < 100; q++) Q(o, k++, queueP(r, q), r === HOT ? (q < n - 2 ? tone3 : '') : ''); } };
  const fleet2003 = o => { for (let i = 0; i < NR; i++) setCpu(o, i, i === HOT ? 99 : 64, i === HOT ? 'bad' : 0);
    o.rows['r' + HOT] = lane(RN(HOT), '99% · 1,010 ms'); };

  // ── percentis: blocos no trilho, na régua, marcas ──
  const cur2 = () => sem && !cur().noSem;
  const vals = () => cur2() ? VAL2 : VAL, rks = () => cur2() ? RK2 : RK1, stt = () => cur2() ? ST2 : ST1;
  const onRails = (o, toneOf) => { const V = vals(); for (let id = 0; id < 100; id++) Q(o, id, railP(id, V[id]), toneOf ? toneOf(id, V[id]) : ''); };
  const onRuler = (o, toneOf) => { const V = vals(), K = rks(); for (let id = 0; id < 100; id++) Q(o, id, rulerP(K.rk[id], V[id]), toneOf ? toneOf(id, V[id], K.rk[id]) : ''); };
  const rulerRows = (o, extra = []) => { o.rows.regua = { name: cur2() ? '100 requests sorted · after the fix' : '100 requests sorted', ticks: [[0, '1st'], [49, '50th'], [94, '95th'], [98, '99th'], ...extra] }; };
  const pMark = (o, n, lab, v, tone, dz = 26, dx = 0) => T(o, [XR(n) + dx, RGY, LZ + hMs(v) + dz], `${lab}\n${nf(v)} ms`, tone);
  const lineAt = (o, v, tone, x0 = 190) => o.lines.push({ x0, x1: 882, y: RGY - 30, z: LZ + v * KMS, d: 2.5, tone });
  const percFleet = o => { if (cur2()) for (let i = 0; i < NR; i++) setCpu(o, i, 67.5); else fleet2003(o); };

  // ── joelho: a curva R(ρ) feita com as 100 barras, o ponto que anda e a faixa segura ──
  const curve = (o, t, grow, hiTone) => { for (let n = 0; n < 100; n++) { const f = grow ? sg(t, 0.2 + n * 0.012, 0.6 + n * 0.012) : 1;
    if (f <= 0) continue; Q(o, n, { x: XR(n), y: RGY, z: LZ, w: 5.4, d: 56, h: Math.max(1.8, Rr(n / 100) * KJ * f) }, (hiTone && hiTone(n)) || 'mid'); } };
  function point(o, rho, tone = 'acc', label = true, tagAt) {
    const n = Math.min(99, rho * 100), x = 196 + n * 6.85 + 2.7, R_ = Rr(Math.min(0.99, rho)), z = LZ + R_ * KJ + 8;
    o.pts.push({ p: [x, RGY, z], tone });
    if (label) T(o, tagAt || [x, RGY, z + 26], `${nf(rho * 100)}% CPU\n${nf(R_)} ms`, tone);
    return R_;
  }
  const oneRows = (o, rho, tone) => { const R_ = Rr(rho); o.rows.one = act('ONE REPLICA', '1 vCPU', [`ρ = ${nf(rho * 100)}%`, tone || 'acc'], [`${nf(rho * 100)} of 100 req/s`, 'dim'], [`R = ${nf(R_)} ms`, tone || 'acc']); o.on.one = tone === 'bad' ? 'bad' : 1; };

  // ── o que se vê em cada passo ──
  const STEPS = {
    medir: [
      { id: 'replica', dur: 7, title: 'The replica measures 20 ms', yk: 'IN THE catalogo-1 LOG',
        code: ['GET /produtos/42   (the cat page)', 'CPU building the page ....... 10 ms', 'waiting for cache and DB ..... 10 ms', 'time on the replica .......... 20 ms'],
        story: 'A request with no queue: Lena opens the cat page. catalogo-1 spends 10 ms of CPU building the page and waits 10 ms for the cache and the document DB. The replica\'s stopwatch reads 20 ms, and that is the number that shows up on the server dashboard.',
        look: 'The request leaves the BROWSER, goes through lb-loja and stops at catalogo-1. Only the replica stopwatch is on.',
        key: 'The replica measures only the processing time.',
        f(o, t) { const r = trip(o, t, 0, 20, 1.6, { nav: false, lb: false, rep: true }); o.res = r.rep >= 20 ? [['replica: 20 ms', 'acc']] : []; } },
      { id: 'lb', dur: 7, title: 'lb-loja also measures 20 ms', yk: 'IN THE lb-loja LOG',
        code: ['GET /produtos/42', 'upstream ......... catalogo-1', 'upstream_time .... 20 ms', 'status ........... 200'],
        story: 'Now turn on the second measuring point, at lb-loja. It starts counting when the request arrives and stops when it hands back the response. Inside the datacenter the hop to the replica is negligible, so the load balancer also reads 20 ms.',
        look: 'Two stopwatches lit, lb-loja and replica, both at 20 ms.',
        key: 'Load balancer and replica read the same time when the network between them is short.',
        f(o, t) { const r = trip(o, t, 0, 20, 1.6, { nav: false, lb: true, rep: true }); o.res = r.lbv >= 20 ? [['lb-loja: 20 ms · replica: 20 ms', 'acc']] : []; } },
      { id: 'nav', dur: 7.5, title: 'Lena\'s browser measures 100 ms', yk: 'THE THREE MEASUREMENTS',
        code: ['browser .... 40 + 20 + 40 = 100 ms', 'lb-loja .......................... 20 ms', 'replica .......................... 20 ms', 'RTT Recife ⇄ SP: 80 ms'],
        story: 'The third point sits in the browser, in Recife. Between Recife and São Paulo the round trip takes 80 ms. The browser adds it all up: 40 ms going, 20 ms on the server and 40 ms coming back. Lena feels 100 ms, five times what the server dashboard shows.',
        look: 'The request crosses the Recife → SP beam twice; the BROWSER stopwatch stops at 100 ms.',
        key: 'Response time = network latency + processing time.',
        f(o, t) { const r = trip(o, t, 0, 20, 1.6, { nav: true, lb: true, rep: true }); o.res = r.done ? [['browser 100 ms = 80 network + 20 server', 'acc']] : []; } },
      { id: 'bf', dur: 9, title: '20:03:07: the cat page takes 2.08 s', yk: 'IN THE lb-loja LOG',
        code: ['20:03:07 GET /produtos/42', 'upstream ......... catalogo-3', 'upstream_time .... 2000 ms', 'status ........... 200'],
        story: 'Black Friday, the 20:03 minute, 640 req/s. Round robin sends Lena\'s request to catalogo-3, which is at 99% CPU with about 65 requests in flight. The replica reads 2,000 ms, lb-loja does too, and the browser reads 2,000 + 80 = 2.08 s.',
        look: 'catalogo-3 turns red, with the queue of cubes stretching along the rail. The three stopwatches climb together.',
        key: 'With three measuring points you can say where the time went: on the replica, not on the network.',
        f(o, t) { fleet2003(o); flightCubes(o, 65); o.rows.lb = act('lb-loja', '640 req/s', ['round robin', 'dim'], ['timeout 2 s', 'dim']);
          const r = trip(o, t, HOT, 2000, 3.4, { nav: true, lb: true, rep: true }, true);
          o.res = r.done ? [['browser 2,080 ms · lb 2,000 · replica 2,000', 'bad'], ['the network added the same 80 ms', 'acc']] : []; } },
      { id: 'media', dur: 6, title: 'If it goes wrong: the dashboard shows the average', yk: 'THE AVERAGE RESPONSE TIME DASHBOARD',
        code: ['average time (1 min) ..... 135 ms', 'goal (example) ........... 300 ms', 'dashboard ................ green', 'Lena (20:03:07) .......... 2,080 ms'],
        story: 'The store dashboard shows the average time for the minute: 135 ms, under the 300 ms goal, and it stays green. Lena waited 2.08 s for the cat page. The average mixes 90 fast responses with 10 slow ones and hides whoever waited.',
        look: 'The display reads 135 ms with the goal met; the balloon above the BROWSER shows Lena\'s 2.08 s in red.',
        key: 'An average within the goal does not mean nobody waited.',
        f(o, t) { fleet2003(o); flightCubes(o, 65);
          o.cnt = [['AVERAGE TIME FOR THE MINUTE', '135 ms', 'acc'], ['GOAL', '300 ms · green', 'dim'], ['LENA WAITED', '2,080 ms', 'bad']];
          if (t > 0.6) { T(o, [94, 382, 110], 'Lena waited\n2.08 s', 'bad'); o.on.cli = 'bad'; }
          if (t > 1.6) T(o, [440, 40, 60], 'dashboard: 135 ms\nbelow the 300 goal', 'acc');
          o.res = t > 1.6 ? [['green dashboard: 135 ms', 'acc'], ['Lena waited 2.08 s', 'bad']] : []; } },
    ],
    percentis: [
      { id: 'amostra', dur: 5, title: 'The 20:03 sample: 100 requests', yk: 'THE SAMPLE (ms at lb-loja)',
        code: () => cur2() ? ['after fixing the balancing:', '28 ×20 · 34 ×30 · 42 ×25', '56 ×15 · 58 ×8 · 73 ×2', 'all replicas at 67.5%']
          : ['9 replicas: 26 · 32 · 40 · 55 · 74', '   (20 · 30 · 25 · 10 · 5 times)', 'catalogo-3: 150 300 450 600 800', '   1,000 1,200 1,500 2,000 2,100'],
        story: () => 'The 20:03 minute produced 38,400 requests, 640 per second. We drew 100. Round robin gives every replica the same number of requests, so that is 10 per rail, and the height of each block is the time measured at lb-loja.' +
          (cur2() ? ' This is the sample after the module 7 fix: no block goes past 73 ms.' : ''),
        look: () => cur2() ? 'The ten rails have low blocks, from 28 to 73 ms; no towers.' : 'Nine rails with tiny blocks (26 to 74 ms) and catalogo-3 with ten towers, from 150 to 2,100 ms.',
        key: 'A sample is a handful of real measurements. The question is how to summarize it.',
        f(o, t) { percFleet(o); onRails(o, (id, v) => v > 300 ? 'acc' : '');
          const s = stt(); o.cnt = [['SAMPLE', '100 of 38,400'], ['THROUGHPUT', '640 req/s', 'dim'], ['SLOWEST', nf(s.max) + ' ms', cur2() ? 'dim' : 'bad']];
          if (t > 1) T(o, [700, YC(HOT) - 6, LZ + hMs(s.max) + 30], cur2() ? 'catalogo-3\n10 blocks up to 73 ms' : 'catalogo-3\n150 to 2,100 ms', cur2() ? 'acc' : 'bad');
          o.res = [['10 requests per replica', 'acc']]; } },
      { id: 'ordena', dur: 6.5, title: 'Sorted: the p50', yk: 'NEAREST RANK',
        code: () => ['rank = ⌈ p% × n ⌉   (n = 100)', `p50 → 50th → ${stt().p50} ms`, 'p95 → 95th', 'p99 → 99th'],
        title2: () => `Sorted: the p50 is ${stt().p50} ms`,
        story: () => `To find a percentile, put the 100 in order and count. The p50 is the 50th: ${stt().p50} ms. Half the customers got the page in ${stt().p50} ms or less.` + (cur2() ? '' : ' The ten towers of catalogo-3 all go to the end of the ruler.'),
        look: 'The blocks leave the rails and line up on the ruler, fastest to slowest. The balloon marks the 50th.',
        key: 'The pN is the value at position ⌈N% × n⌉ of the sorted list.',
        f(o, t) { const V = vals(), K = rks(); o.show.regua = 1; rulerRows(o); const gone = t > 1.2 + 99 * 0.022 + 0.9;
          if (gone) RAILS.concat(HEADS).forEach(n => o.show[n] = 0); else percFleet(o);
          for (let id = 0; id < 100; id++) { const n = K.rk[id], a = 0.5 + n * 0.022, f = sg(t, a, a + 0.9), A = railP(id, V[id]), Bp = rulerP(n, V[id]);
            const p = mix([A.x, A.y, A.z, A.w, A.d], [Bp.x, Bp.y, Bp.z, Bp.w, Bp.d], f); p[2] += Math.sin(Math.PI * f) * 40;
            Q(o, id, { x: p[0], y: p[1], z: p[2], w: p[3], d: p[4], h: Bp.h }, n === 49 && f >= 1 ? 'acc' : V[id] > 300 ? 'acc' : ''); }
          const s = stt(); o.cnt = [['p50', s.p50 + ' ms'], ['RANK', '50th of 100', 'dim'], ['ORDER', 'smallest to largest', 'dim']];
          if (gone) { pMark(o, 49, 'p50 · 50th', s.p50, 'acc', 30); o.res = [[`half at ${s.p50} ms or less`, 'acc']]; } } },
      { id: 'media', dur: 5, title: 'The average and the goal', yk: 'THE AVERAGE',
        title2: () => `The average: ${nf(stt().mean)} ms, below the goal`,
        code: () => cur2() ? ['sum ÷ n = 4,080 ÷ 100', '= 40.8 ms', 'p95 goal: 300 ms'] : ['sum ÷ n = 13,500 ÷ 100', '= 135 ms', 'p95 goal: 300 ms', 'no block is 135 ms'],
        story: () => cur2() ? 'The average adds everything and divides by 100: 4,080 ÷ 100 = 40.8 ms. Without the hot replica, the blocks stay close to the average, and the average tells the story well.'
          : 'The average adds everything and divides by 100: 13,500 ÷ 100 = 135 ms. It sits below the 300 ms goal, and the average-time dashboard stays green. But 90 blocks are well below the average line and 10 well above: no customer got 135 ms.',
        look: 'The average line runs a little above the low blocks; the gray goal line (300 ms) sits above it.',
        key: 'The average mixes fast and slow into one number that may belong to nobody.',
        f(o, t) { o.show.regua = 1; RAILS.concat(HEADS).forEach(n => o.show[n] = 0); rulerRows(o); onRuler(o, (id, v) => v > 300 ? 'acc' : '');
          const s = stt(); lineAt(o, 300, 'dim'); if (t > 0.6) lineAt(o, s.mean, 'acc');
          o.cnt = [['AVERAGE', nf(s.mean) + ' ms'], ['GOAL (p95)', '300 ms', 'dim'], ['AVERAGE DASHBOARD', 'green', 'dim']];
          T(o, [250, RGY, LZ + 300 * KMS + 22], 'goal · 300 ms', 'dim'); if (t > 0.9) T(o, [470, RGY, LZ + s.mean * KMS + 18], `average · ${nf(s.mean)} ms`, 'acc');
          o.res = t > 0.9 ? [[`average ${nf(s.mean)} ms < 300: green`, 'acc']] : []; } },
      { id: 'p95', dur: 5.5, title: 'p95 and p99', yk: 'THE TAIL',
        title2: () => `p95 = ${nf(stt().p95)} ms, p99 = ${nf(stt().p99)} ms`,
        code: () => [`95th block → p95 = ${nf(stt().p95)} ms`, `99th block → p99 = ${nf(stt().p99)} ms`, 'goal: p95 ≤ 300 ms', cur2() ? 'percentile dashboard: green' : 'percentile dashboard: red'],
        story: () => cur2() ? 'Without the hot replica, the 95th block is 58 ms and the 99th is 73 ms. The p95 sits far below the 300 ms goal, and the average (40.8) and the percentiles tell the same story.'
          : 'The 95th block is 800 ms: 5 in every 100 customers waited 800 ms or more. The p95 goes past the 300 ms goal, and the percentile dashboard turns red. The 99th is Lena\'s request, 2,000 ms. The average said 135.',
        look: () => cur2() ? 'The p95 and p99 balloons sit tight on the low blocks, below the goal line.' : 'The p95 and p99 balloons rise with the towers at the end of the ruler, above the goal line.',
        key: 'The percentile shows the tail that the average hides.',
        f(o, t) { o.show.regua = 1; RAILS.concat(HEADS).forEach(n => o.show[n] = 0); rulerRows(o); const s = stt(), bad = s.p95 > 300;
          onRuler(o, (id, v, n) => n === 94 || n === 98 ? (bad ? 'bad' : 'acc') : v > 300 ? 'acc' : ''); lineAt(o, 300, 'dim'); lineAt(o, s.mean, 'acc');
          T(o, [250, RGY, LZ + 300 * KMS + 22], 'goal · 300 ms', 'dim');
          if (t > 0.5) pMark(o, 94, 'p95 · 95th', s.p95, bad ? 'bad' : 'acc', cur2() ? 30 : 24, cur2() ? -70 : 0);
          if (t > 1.3) pMark(o, 98, cur2() ? 'p99 · 99th' : 'p99 · Lena', s.p99, bad ? 'bad' : 'acc', cur2() ? 70 : 24, cur2() ? 10 : 0);
          o.cnt = [['p95', nf(s.p95) + ' ms', bad ? 'bad' : 'acc'], ['p99', nf(s.p99) + ' ms', bad ? 'bad' : 'dim'], ['AVERAGE', nf(s.mean) + ' ms', 'dim']];
          o.res = t > 1.3 ? [[bad ? 'p95 800 > goal 300: red' : 'p95 58 < goal 300', bad ? 'bad' : 'acc']] : []; } },
      { id: 'erros', dur: 5.5, title: 'Errors: what goes past the timeout', yk: 'IN THE lb-loja LOG',
        title2: () => cur2() ? 'Errors: none goes past the timeout' : 'Errors: 1 in 100 goes past the timeout',
        code: () => cur2() ? ['lb-loja timeout: 2 s', 'slowest: 73 ms', 'errors: 0 ÷ 100 = 0%'] : ['20:03:12 GET /produtos/… (black t-shirt)', 'upstream catalogo-3 · 2100 ms', 'status 504   (2 s timeout)', 'errors: 1 ÷ 100 × 100 = 1%'],
        story: () => cur2() ? 'lb-loja gives up after 2 s. In the corrected sample the slowest takes 73 ms: no 504, 0% errors.'
          : 'lb-loja gives up after 2 s. Davi\'s request (20:03:12, the black t-shirt page) took 2,100 ms and became a 504. That is 1 error in 100 requests, 1%, ten times the 0.1% goal. Davi reloads and the second attempt takes 61 ms.',
        look: () => cur2() ? 'The timeout line sits way up high, far from every block.' : 'The last block crosses the red timeout line and turns red.',
        key: 'Error rate = errors ÷ total × 100.',
        f(o, t) { o.show.regua = 1; RAILS.concat(HEADS).forEach(n => o.show[n] = 0); rulerRows(o, [[99, '100th']]); const s = stt(), on = t > 0.8;
          onRuler(o, (id, v) => v > 2000 && on ? 'bad' : v > 300 ? 'acc' : ''); lineAt(o, 2000, 'bad', 690); lineAt(o, 300, 'dim');
          T(o, [730, RGY - 30, LZ + 2000 * KMS + 22], 'timeout · 2 s', 'bad');
          if (on && s.err) T(o, [XR(99) - 10, RGY, LZ + hMs(s.max) + 52], 'Davi · 2,100 ms\n504', 'bad');
          o.cnt = [['ERRORS', s.err + '%', s.err ? 'bad' : 'acc'], ['GOAL', '0.1%', 'dim'], ['TIMEOUT', '2 s', 'dim']];
          o.res = on ? (s.err ? [['1 in 100 = 1%: ten times the goal', 'bad'], ['Davi reloads: 61 ms', 'acc']] : [['0 in 100 = 0%', 'acc']]) : []; } },
      { id: 'p99m', dur: 6.5, noSem: true, title: 'If it goes wrong: the average of the p99s', yk: 'THE PER-REPLICA DASHBOARD',
        code: ['(4 × 55 + 5 × 74 + 2,100) ÷ 10', '= (220 + 370 + 2,100) ÷ 10', '= 269 ms   ← the dashboard', 'fleet p99 = 2,000 ms'],
        story: 'Each replica computes its own p99, and the dashboard averages the ten. With 10 requests per replica, each one\'s p99 is its maximum: 55 ms on four, 74 ms on five and 2,100 ms on catalogo-3. The average comes out at 269 ms, under the goal. The true fleet p99 is 2,000 ms.',
        look: 'The blocks go back to the rails; the tallest on each rail lights up, and the balloons compare 269 with 2,000.',
        key: 'You do not average percentiles: merge the histograms and compute again.',
        f(o, t) { fleet2003(o); const mx = Array.from({ length: NR }, (_, r) => VAL.slice(r * 10, r * 10 + 10).indexOf(p99r(r)) + r * 10);
          onRails(o, id => t > 0.8 && mx.includes(id) ? (Math.floor(id / 10) === HOT ? 'bad' : 'acc') : '');
          for (let r = 0; r < NR; r++) o.rows['r' + r] = lane(RN(r), t > 0.8 ? `p99 ${nf(p99r(r))} ms` : '10 in the sample');
          if (t > 1.8) T(o, [470, YC(8), 46], `average of the p99s\n${nf(MEANP99)} ms`, 'acc');
          if (t > 2.8) T(o, [690, YC(HOT) - 6, LZ + hMs(2100) + 30], 'fleet p99\n2,000 ms', 'bad');
          o.cnt = [['AVERAGE OF THE p99s', t > 1.8 ? nf(MEANP99) + ' ms' : '—', 'acc'], ['TRUE p99', t > 2.8 ? '2,000 ms' : '—', 'bad'], ['SAMPLES/REPLICA', '10', 'dim']];
          o.res = t > 2.8 ? [['the dashboard says 269 ms; the fleet has 2,000', 'bad'], ['merge the histograms, not the p99s', 'acc']] : []; } },
    ],
    quente: [
      { id: 'rr', dur: 5.5, title: 'Round robin: 64 req/s to each replica', yk: 'THE MATH',
        code: ['640 req/s ÷ 10 replicas = 64 req/s', '64 × 10 ms of CPU = 640 ms per second', '= 64% CPU on each replica'],
        story: 'At the 20:03 peak, 640 req/s arrive at lb-loja. Round robin hands one request to each replica, in turn: 64 per second to each. Each page costs 10 ms of CPU, so each replica sits at 64%.',
        look: 'The dots leave lb-loja and split evenly across the ten rails; the CPU towers all sit at 64%.',
        key: 'Round robin splits requests, not effort.',
        f(o, t) { for (let i = 0; i < NR; i++) { const c = 64 * sg(t, 0.3, 1.6); setCpu(o, i, c); o.rows['r' + i] = lane(RN(i), '64 req/s');
            o.beams.push({ pts: R.l2h(i).slice(0, 4), on: true, dot: ((t * 0.45 + i * 0.37) % 1) }); }
          for (let r = 0; r < NR; r++) for (let q = 0; q < INFL[r === HOT ? 0 : r]; q++) Q(o, r * 10 + q, queueP(r, q));
          o.on.lb = 1; o.cnt = [['THROUGHPUT', '640 req/s'], ['PER REPLICA', '64 req/s', 'dim'], ['CPU', '64%', 'dim']];
          o.res = [['10 replicas × 64% CPU', 'acc']]; } },
      { id: 'busca', dur: 6, title: 'The heavy searches land on catalogo-3', yk: 'THE MODULE 7 SEARCH',
        code: ['GET /busca?q=pelucia&ordem=preco', 'time: 900 ms', 'round robin counts requests, not effort', 'catalogo-3: 64% + 35 points = 99%'],
        story: 'Along with the pages come the heavy searches from module 7, GET /busca?q=pelucia&ordem=preco, 900 ms each. Round robin counts requests, and almost all of them land on catalogo-3. Its CPU climbs 35 points: the 64% from pages plus the searches make 99%.',
        look: 'Only the catalogo-3 rail receives the searches; its tower rises from 64% to 99% and turns red.',
        key: 'The same number of requests is not the same load.',
        f(o, t) { const c3 = 64 + 35 * sg(t, 1.2, 3.6); for (let i = 0; i < NR; i++) { setCpu(o, i, i === HOT ? c3 : 64, i === HOT && c3 > 90 ? 'bad' : 0); o.rows['r' + i] = lane(RN(i), '64 req/s'); }
          for (let r = 0; r < NR; r++) for (let q = 0; q < INFL[r === HOT ? 0 : r]; q++) Q(o, r * 10 + q, queueP(r, q));
          for (let k = 0; k < 3; k++) send(o, t, 0.4 + k * 1.1, 1.4 + k * 1.1, R.l2h(HOT).slice(0, 4), k === 0 ? 'GET /busca · 900 ms' : '', 'bad', 0);
          o.on.lb = 1; T(o, [HX + 38, YC(HOT), 74], `catalogo-3\n${nf(c3, 0)}% CPU`, c3 > 90 ? 'bad' : 'acc');
          o.cnt = [['catalogo-3 CPU', nf(c3, 0) + '%', c3 > 90 ? 'bad' : 'acc'], ['THE OTHER NINE', '64%', 'dim'], ['REQUESTS PER REPLICA', '64/s (equal)', 'dim']];
          o.res = c3 > 98.5 ? [['catalogo-3 at 99%', 'bad']] : []; } },
      { id: 'fila', dur: 6, title: 'The catalogo-3 queue grows', yk: 'THE KNEE CURVE',
        code: ['R(ρ) = 10 + 10 ÷ (1 − ρ)', 'catalogo-3: ρ = 99% → 1,010 ms', 'the others: ρ = 64% → 37.8 ms'],
        story: 'At 99% CPU there is almost no free time left, and whoever arrives waits. On the knee curve, 99% gives 1,010 ms average time on catalogo-3, against 37.8 ms on the other nine. The queue grows until it spans the rail.',
        look: 'The cubes (requests in flight) line up on the catalogo-3 rail; on the others there are two or three.',
        key: 'Near 100% CPU, response time becomes queue time.',
        f(o, t) { fleet2003(o); const n3 = Math.round(2 + 63 * sg(t, 0.4, 3.6)); flightCubes(o, n3);
          for (let i = 0; i < NR; i++) if (i !== HOT) o.rows['r' + i] = lane(RN(i), '37.8 ms');
          T(o, [HX - 7 - n3 * 7.5 + 40, YC(HOT) - 4, 40], `catalogo-3 · ${n3} in queue\n1,010 ms`, 'bad'); if (t > 1) T(o, [HX - 60, YC(7), 34], 'the others\n37.8 ms', 'acc');
          o.cnt = [['TIME ON catalogo-3', n3 >= 65 ? '1,010 ms' : '…', 'bad'], ['ON THE OTHERS', '37.8 ms', 'dim'], ['CPU', '99% × 64%', 'dim']];
          o.res = n3 >= 65 ? [['1,010 ms against 37.8: 27 times', 'bad']] : []; } },
      { id: 'little', dur: 6, title: 'Little\'s law: 86.4 in flight, 64.6 on one replica', yk: 'L = λ × W',
        code: ['fleet:       640 × 0.135  = 86.4', 'catalogo-3:  64 × 1.01   = 64.6', 'healthy:     64 × 0.0378 =  2.4', '64.6 ÷ 86.4 = 75% on one replica'],
        story: 'Little\'s law counts how many requests are in flight: L = λ × W, arrivals per second times the time each one takes. For the fleet, 640 × 0.135 s = 86.4. On catalogo-3 alone, 64 × 1.01 s = 64.6, three quarters of everything. On each healthy replica, 64 × 0.0378 s = 2.4.',
        look: 'The counter shows 86.4 in flight: 65 cubes on the catalogo-3 rail and 22 spread across the other nine.',
        key: 'In flight = throughput × response time.',
        f(o, t) { fleet2003(o); flightCubes(o, 65); for (let i = 0; i < NR; i++) if (i !== HOT) o.rows['r' + i] = lane(RN(i), '2.4 in flight');
          o.rows['r' + HOT] = lane(RN(HOT), '64.6 in flight');
          if (t > 0.6) T(o, [480, YC(HOT) - 4, 40], 'catalogo-3 · 64.6 in flight\n64 × 1.01 s', 'bad'); if (t > 1.4) T(o, [HX - 60, YC(7), 34], 'healthy · 2.4\n64 × 0.0378 s', 'acc');
          o.cnt = [['IN FLIGHT IN THE FLEET', '86.4'], ['ON catalogo-3', '64.6 (75%)', 'bad'], ['ON EACH HEALTHY ONE', '2.4', 'dim']];
          o.res = t > 1.4 ? [['75% of what is in flight on one replica', 'bad']] : []; } },
      { id: 'media', dur: 7.5, title: 'If it goes wrong: the fleet average CPU is 67.5%', yk: 'THE CPU DASHBOARD',
        code: ['average CPU = (9 × 64 + 99) ÷ 10', '= 675 ÷ 10 = 67.5%', 'below 70%: "plenty of headroom"', 'catalogo-3: 99% · 1,010 ms'],
        story: 'The CPU dashboard shows the average of the ten: (9 × 64 + 99) ÷ 10 = 67.5%. Below 70%, it looks like there is headroom. The average erases catalogo-3, which is at 99% with a 1,010 ms average time. To see the hot replica you have to look replica by replica.',
        look: 'The towers all come to the same height, 67.5%, as the dashboard sees it; then they separate, and catalogo-3 goes back to 99%.',
        key: 'The fleet average hides the hot replica.',
        f(o, t) { const f = sg(t, 0.4, 1.4) * (1 - sg(t, 3.8, 4.8)); flightCubes(o, 65, t > 4.4 ? 'bad' : '');
          for (let i = 0; i < NR; i++) { const real = i === HOT ? 99 : 64, c = real + (67.5 - real) * f; setCpu(o, i, c, i === HOT && f < 0.5 ? 'bad' : 0); }
          if (f > 0.5) T(o, [HX + 38, YC(4), 78], 'fleet dashboard\n67.5% CPU', 'acc');
          if (t > 4.6) T(o, [HX + 38, YC(HOT), 74], 'catalogo-3\n99% · 1,010 ms', 'bad');
          o.cnt = [['AVERAGE CPU', '67.5%', 'acc'], ['catalogo-3', t > 4.4 ? '99%' : '—', 'bad'], ['HEADROOM TARGET', '70%', 'dim']];
          o.res = t > 4.6 ? [['67.5% on average, 99% on catalogo-3', 'bad']] : f > 0.5 ? [['67.5% < 70%: looks like headroom', 'acc']] : []; } },
    ],
    joelho: [
      { id: 'zero', dur: 5.5, rho: 0, title: 'No queue: 20 ms', yk: 'THE MODEL (toy M/M/1 queue)',
        code: ['R(ρ) = 10 ms + 10 ms ÷ (1 − ρ)', 'ρ = 0 → 10 + 10 ÷ 1 = 20 ms', 'capacity = 1 s ÷ 10 ms of CPU', '= 100 req/s per replica'],
        story: 'A replica with 1 vCPU spends 10 ms of CPU per page and waits 10 ms for the cache and the DB. With nobody ahead of it, the response takes 20 ms. Since CPU is the resource that runs out, capacity is 1 s ÷ 10 ms = 100 req/s.',
        look: 'The 100 bars on the ruler are the R(ρ) curve, from 0% to 99% CPU. The point starts at 0%, with 20 ms.',
        key: 'Capacity of one replica: 100 req/s.',
        f(o, t) { curve(o, t, true); oneRows(o, 0); point(o, 0, 'acc', t > 1);
          o.cnt = [['RESPONSE TIME', '20 ms'], ['CPU (ρ)', '0%', 'dim'], ['CAPACITY', '100 req/s', 'dim']]; o.res = [['no queue: 10 + 10 = 20 ms', 'acc']]; } },
      { id: '64', dur: 5, rho: 0.64, title: '64%: the 20:03 peak', yk: 'THE MATH',
        code: ['ρ = 64 ÷ 100 = 0.64', 'R = 10 + 10 ÷ 0.36', '= 37.8 ms'],
        story: 'At the 20:03 peak each healthy replica receives 64 req/s; on a replica of 100, that is 64% CPU. The math gives 10 + 10 ÷ 0.36 = 37.8 ms, nearly double the 20 ms and still far from the goal.',
        look: 'The point moves along the curve up to 64%; the bars are still rising slowly.',
        key: 'Up to here, more load costs little time.',
        f(o, t) { const rho = 0.64 * sg(t, 0.3, 2.3); curve(o, t, false, n => n === 64 && t > 2.3 ? 'acc' : ''); oneRows(o, rho); point(o, rho);
          o.cnt = [['RESPONSE TIME', nf(Rr(rho)) + ' ms'], ['CPU (ρ)', nf(rho * 100, 0) + '%', 'dim'], ['REQ/S ON THE REPLICA', nf(rho * 100, 0), 'dim']];
          o.res = t > 2.3 ? [['64% → 37.8 ms', 'acc']] : []; } },
      { id: '70', dur: 5, rho: 0.7, band: true, title: '70%: the safe limit', yk: 'THE MATH',
        code: ['ρ = 0.70 → 10 + 10 ÷ 0.30', '= 43.3 ms', 'fleet: 1,000 req/s of capacity', 'safe up to 700 req/s (70%)'],
        story: 'At 70% the average response is 43.3 ms. Up to here the curve rises slowly; from here on each point of CPU costs more time than the last. That is why 70% becomes the safe limit: the 1,000 req/s fleet is safe up to 700.',
        look: 'The band from 0% to 70% lights up on the floor of the ruler; the point stops at its edge.',
        key: 'Safe limit: the load at which the curve is still nearly flat.',
        f(o, t) { const rho = 0.64 + 0.06 * sg(t, 0.3, 1.6); curve(o, t, false, n => n <= 70 && t > 1.6 ? 'acc' : ''); oneRows(o, rho); point(o, rho);
          o.cnt = [['RESPONSE TIME', nf(Rr(rho)) + ' ms'], ['CPU (ρ)', nf(rho * 100, 0) + '%', 'dim'], ['FLEET SAFE UP TO', '700 req/s', 'dim']];
          o.res = t > 1.6 ? [['70% → 43.3 ms: the safe limit', 'acc']] : []; } },
      { id: '95', dur: 5, rho: 0.95, band: true, title: '95%: 210 ms', yk: 'THE MATH',
        code: ['ρ = 0.95 → 10 + 10 ÷ 0.05', '= 210 ms', 'fleet: 950 req/s (next Black Friday)'],
        story: 'At 95%, which for the fleet is 950 req/s (next year\'s Black Friday), the average response goes to 210 ms: ten times that of an idle replica. The 25 points of CPU above 70% cost almost five times the time.',
        look: 'The point leaves the safe band and starts climbing fast.',
        key: 'Past the knee, a few points of CPU multiply the time.',
        f(o, t) { const rho = 0.7 + 0.25 * sg(t, 0.3, 2.3); curve(o, t, false, n => n <= 70 ? 'acc' : ''); oneRows(o, rho, rho > 0.9 ? 'bad' : ''); point(o, rho, rho > 0.9 ? 'bad' : 'acc');
          o.cnt = [['RESPONSE TIME', nf(Rr(rho)) + ' ms', rho > 0.9 ? 'bad' : 'acc'], ['CPU (ρ)', nf(rho * 100, 0) + '%', 'dim'], ['FLEET', nf(rho * 1000, 0) + ' req/s', 'dim']];
          o.res = t > 2.3 ? [['95% → 210 ms: 4.8× the 70% time', 'bad']] : []; } },
      { id: '99', dur: 5.5, rho: 0.99, band: true, title: '99%: 1,010 ms, catalogo-3', yk: 'THE MATH',
        code: ['ρ = 0.99 → 10 + 10 ÷ 0.01', '= 1,010 ms', 'from 70% to 99%: 43 ms → 1 s', 'that is catalogo-3 at 20:03'],
        story: 'At 99% the math gives 10 + 10 ÷ 0.01 = 1,010 ms. That is catalogo-3 in the 20:03 minute. From 70% to 99% the response went from 43 ms to 1 s: that is the knee of the curve.',
        look: 'The point reaches the top of the last bar and turns red; the bars at the end become a wall.',
        key: 'The knee: near 100%, response time shoots up.',
        f(o, t) { const rho = 0.95 + 0.04 * sg(t, 0.3, 2.0); curve(o, t, false, n => n <= 70 ? 'acc' : n >= 95 ? 'bad' : ''); oneRows(o, rho, 'bad'); point(o, rho, 'bad', true, [XR(99) - 60, RGY, LZ + Rr(rho) * KJ + 26]);
          o.rows.one = act('catalogo-3', '1 vCPU', [`ρ = ${nf(rho * 100, 0)}%`, 'bad'], ['64 pages + searches', 'dim'], [`R = ${nf(Rr(rho), 0)} ms`, 'bad']);
          o.cnt = [['RESPONSE TIME', nf(Rr(rho), 0) + ' ms', 'bad'], ['CPU (ρ)', nf(rho * 100, 0) + '%', 'dim'], ['AT 70%', '43.3 ms', 'dim']];
          o.res = t > 2 ? [['99% → 1,010 ms', 'bad'], ['70% → 43 ms', 'acc']] : []; } },
      { id: 'media', dur: 6.5, rho: 0.675, band: true, title: 'If it goes wrong: the average hides the knee', yk: 'AVERAGE OF THE INPUTS × AVERAGE OF THE OUTPUTS',
        code: ['average CPU 67.5% → R = 40.8 ms', 'measured: (9 × 37.8 + 1,010) ÷ 10 = 135 ms', 'average of the p99s = 269 ms', 'fleet p99 = 2,000 ms'],
        story: 'The fleet average CPU is 67.5%, and on the curve that gives 40.8 ms. The measured average time was 135 ms, because catalogo-3 sits at the knee, at 99%. The same mistake shows up in the percentiles: the average of the replicas\' p99s gives 269 ms, and the true p99 is 2,000 ms.',
        look: 'Two points on the curve: the fleet average (67.5%) at the bottom, catalogo-3 (99%) in red at the top.',
        key: 'On a curve with a knee, the average of the inputs does not give the average of the outputs.',
        f(o, t) { curve(o, t, false, n => n === 99 ? 'bad' : n <= 70 ? 'acc' : ''); oneRows(o, 0.675);
          o.rows.one = act('THE FLEET', '10 replicas', ['average CPU 67.5%', 'acc'], ['R(67.5%) = 40.8 ms', 'acc'], ['measured: 135 ms', 'bad']);
          point(o, 0.675, 'acc', true, [XR(67.5) - 70, RGY, LZ + 40.8 * KJ + 34]); if (t > 1.2) point(o, 0.99, 'bad', true, [XR(99) - 60, RGY, LZ + 1010 * KJ + 26]);
          o.cnt = [['THE CURVE SAYS', '40.8 ms', 'acc'], ['MEASURED', '135 ms', 'bad'], ['AVERAGE OF THE p99s', '269 × 2,000', 'bad']];
          o.res = t > 1.2 ? [['67.5% on average, 135 ms for real', 'bad'], ['average of the p99s: 269; real: 2,000', 'bad']] : []; } },
    ],
  };
  // o joelho começa cada passo onde o anterior parou
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); if (sc === 'joelho') o.rows.regua.band = cur().band ? 1 : 0; return o; }
  const val = v => typeof v === 'function' ? v() : v;

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, k = Bk.kind;
    if (k === 'head') {   // a torre de CPU: o número grande e a barra
      x.textAlign = 'center'; x.fillStyle = on === 'bad' || on === 1 ? col : theme === 'light' ? '#111416' : col; fitFont(x, u, d.pct, 16, W_ - 6); x.fillText(d.pct, u(W_ / 2), u(10));
      const bw = W_ - 10; x.fillStyle = theme === 'light' ? '#dcdcdb' : '#26282a'; x.fillRect(u(5), u(19.5), u(bw), u(3.5));
      x.fillStyle = on === 'bad' ? BAD() : accC(); x.fillRect(u(5), u(19.5), u(bw * clamp(d.f)), u(3.5)); x.textAlign = 'left'; }
    else if (k === 'lane') { x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, 17, 140); x.fillText(d.name, u(5), u(H_ / 2 + 0.5)); const nw = x.measureText(d.name).width / u(1);
      if (d.meta) { x.fillStyle = INK(); fitFont(x, u, d.meta, 13, 200); x.fillText(d.meta, u(nw + 16), u(H_ / 2 + 0.5)); }
      x.strokeStyle = theme === 'light' ? '#c3c6c8' : '#2b2e30'; x.lineWidth = u(1.1); const my = H_ / 2;
      for (let X = 380; X < W_ - 10; X += 60) { x.beginPath(); x.moveTo(u(X), u(my - 5)); x.lineTo(u(X + 5), u(my)); x.lineTo(u(X), u(my + 5)); x.stroke(); } }
    else if (k === 'ruler') {
      const ux = n => XR(n) - 192.5;
      if (d.band) { x.fillStyle = theme === 'light' ? 'rgba(255,157,60,.22)' : 'rgba(255,157,60,.16)'; x.fillRect(u(ux(0) - 3), u(18), u(ux(70) - ux(0) + 6), u(60));
        x.fillStyle = accC(); fitFont(x, u, 'safe band: up to 70%', 11, 200); x.textAlign = 'right'; x.fillText('safe band: up to 70%', u(ux(70)), u(10)); x.textAlign = 'left'; }
      x.fillStyle = col; fitFont(x, u, d.name, 13, d.band ? 300 : W_ - 10); x.fillText(d.name, u(5), u(10));
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(81)); x.lineTo(u(W_ - 4), u(81)); x.stroke();
      x.textAlign = 'center'; for (const [n, lab] of d.ticks || []) { x.strokeStyle = C.inkHi; x.lineWidth = u(0.8); x.beginPath(); x.moveTo(u(ux(n)), u(79)); x.lineTo(u(ux(n)), u(84)); x.stroke();
        x.fillStyle = INK(); fitFont(x, u, lab, 11, 60); x.fillText(lab, u(Math.min(W_ - 14, Math.max(12, ux(n)))), u(90)); } x.textAlign = 'left'; }
    else {   // actor: nome, meta e linhas
      head(x, u, d, W_, col, 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
      let y = 34; for (const [text, tn] of d.rows || []) { x.fillStyle = on === 'bad' && tn !== 'acc' && tn !== 'dim' ? BAD() : toneC(tn); fitFont(x, u, text, 12, W_ - 10); x.fillText(text, u(5), u(y)); y += 18; } }
    cv.tex.needsUpdate = true;
  }
  // as requisições deslizam até o lugar e o tamanho do passo; quem sai encolhe até sumir
  function placeReqs(list, dt) {
    const k = dt > 0 ? 1 - Math.exp(-dt / 0.13) : 1;
    REQ.forEach((Rq, i) => { const tg = list[i];
      if (!tg) { if (Rq.cur) { Rq.cur.h += (0 - Rq.cur.h) * k; if (Rq.cur.h < 0.4) { Rq.cur = null; Rq.g.visible = false; } } }
      else if (!Rq.cur) Rq.cur = { ...tg, h: 0.5 };
      else for (const p of ['x', 'y', 'z', 'w', 'd', 'h']) Rq.cur[p] += (tg[p] - Rq.cur[p]) * k;
      if (!Rq.cur) return; const c = Rq.cur; Rq.g.visible = true;
      Rq.g.position.copy(W(c.x - c.w / 2, c.y - c.d / 2, c.z)); Rq.g.scale.set(c.w / 10, Math.max(0.05, c.h) / 10, c.d / 10);
      const tone = tg ? tg.tone : '';
      paint(Rq.mat, tone, tone === 'bad' ? 0.65 : tone === 'acc' ? 0.5 : tone === 'mid' ? 0.2 : 0.07); });
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = o.code || val(s.code);
    const key = JSON.stringify([o.cnt, o.res, yl, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 9, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, v, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase().replace('CATALOGO', 'catalogo'), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, v, 18, 142); x.fillText(v, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'DADO REAL', L0, 10, Wd - L0 - 8);
    x.fillStyle = theme === 'light' ? '#14171a' : C.inkHi; yl.slice(0, 5).forEach((l, i) => { fitFont(x, u, l, 11, Wd - L0 - 6); x.fillText(l, u(L0), u(26 + i * 16)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 10, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    medir: () => `<li>Response time = <b>network latency + processing time</b></li><table class="h3-sum"><tr><th>point</th><th>no queue</th><th>20:03:07</th></tr><tr><td>browser (Recife)</td><td>100 ms</td><td>2,080 ms</td></tr><tr class="on"><td>lb-loja (SP)</td><td>20 ms</td><td>2,000 ms</td></tr><tr><td>replica</td><td>20 ms</td><td>2,000 ms</td></tr></table><li>Replica: <b>10 ms of CPU + 10 ms</b> waiting for cache and DB; RTT Recife ⇄ SP: <b>80 ms</b> (example)</li><li>Goal (example): p95 ≤ <b>300 ms</b> and errors ≤ <b>0.1%</b>, measured at lb-loja; lb-loja timeout <b>2 s</b></li><li>Dashboards often call response time "latency"; the article uses latency only for the network</li>`,
    percentis: () => `<table class="h3-sum"><tr><th></th><th>20:03</th><th>after the fix</th></tr><tr><td>average</td><td>135 ms</td><td>40.8 ms</td></tr><tr><td>p50</td><td>32 ms</td><td>34 ms</td></tr><tr class="on"><td>p95</td><td>800 ms</td><td>58 ms</td></tr><tr><td>p99</td><td>2,000 ms</td><td>73 ms</td></tr><tr><td>maximum</td><td>2,100 ms</td><td>73 ms</td></tr><tr><td>errors (&gt; 2 s)</td><td>1%</td><td>0%</td></tr></table><li>Nearest rank: the pN is the value at position <b>⌈N% × n⌉</b> (p90 of the 20:03 sample = <b>74 ms</b>)</li><li>Average of the per-replica p99s: <b>269 ms</b>; fleet p99: <b>2,000 ms</b>. You do not add percentiles or average them: merge the histograms (buckets, as in Prometheus) and compute again</li><li>With 100 samples the p99 is <b>a single value</b> (the 99th); it only becomes stable with thousands</li><li>Block height: <b>0.06 per ms</b> (2,100 ms = the tallest tower)</li>`,
    quente: () => `<table class="h3-sum"><tr><th>replica</th><th>CPU</th><th>average time</th><th>in flight</th></tr><tr><td>9 healthy</td><td>64%</td><td>37.8 ms</td><td>2.4 each</td></tr><tr class="on"><td>catalogo-3</td><td>99%</td><td>1,010 ms</td><td>64.6</td></tr><tr><td>fleet</td><td>67.5% (average)</td><td>135 ms</td><td>86.4</td></tr></table><li>640 req/s ÷ 10 = <b>64 req/s</b> per replica (unweighted round robin)</li><li>Searches <b>GET /busca?q=pelucia&amp;ordem=preco</b> of 900 ms almost all on catalogo-3: <b>+35 points</b> of CPU</li><li>Little's law: <b>L = λ × W</b> (in flight = arrivals per second × response time)</li><li>One cube ≈ one request in flight: 65 on catalogo-3 and 22 on the other nine</li><li>Fix: least outstanding requests and weights on lb-loja (module 7), and p95/p99 per replica</li>`,
    joelho: () => `<table class="h3-sum"><tr><th>ρ</th><th>R (ms)</th></tr>${[[0, '20'], [40, '26.7'], [50, '30'], [64, '37.8'], [67.5, '40.8'], [70, '43.3'], [80, '60'], [90, '110'], [95, '210'], [99, '1,010']].map(([p, r]) => `<tr${p === Math.round((cur().rho || 0) * 1000) / 10 ? ' class="on"' : ''}><td>${nf(p)}%</td><td>${r}</td></tr>`).join('')}</table><li><b>R(ρ) = 10 ms + 10 ms ÷ (1 − ρ)</b>: simplified M/M/1 queue, a toy model</li><li>Capacity: 1 s ÷ 10 ms of CPU = <b>100 req/s</b> per replica; 10 replicas = <b>1,000</b>, safe up to <b>700</b></li><li>Bar height: <b>0.12 per ms</b> (the 99% bar is 1,010 ms)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur(), tg = sc === 'percentis' ? `<div class="o3-mode l3-tg"><button data-tg aria-pressed="${sem && !s.noSem}"${s.noSem ? ' disabled title="this step uses the 20:03 sample"' : ''}>${sem && !s.noSem ? 'Put catalogo-3 back' : 'Remove catalogo-3'} <kbd>X</kbd></button></div>` : '';
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${tg}<h2>${val(s.title2) || s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${val(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${val(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Real data')}</b>${esc(val(s.code).join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'latencia') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'latencia' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-latencia3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  // tirar a catalogo-3: troca a amostra das 20:03 pela de depois do conserto, sem sair do passo
  const toggleSem = () => { if (sc !== 'percentis' || cur().noSem) return false; sem = !sem; render(); SFX.bit(1); return true; };
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'latencia') return; const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-tg]')) toggleSem(); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] && o.pos[nm] ? 1 : 0, to = o.pos[nm];
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      if (to) { if (!Bk.pos || Bk.f < 0.02) Bk.pos = to.slice(); else { const k = 1 - Math.exp(-dt / 0.25); Bk.pos = mix(Bk.pos, to, k); } }
      const hh = o.hgt[nm] || Bk.h; Bk.hh += (hh - Bk.hh) * (dt > 0 ? 1 - Math.exp(-dt / 0.2) : 1);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01 && !!Bk.pos;
      if (Bk.g.visible) { Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.hh + 3))); Bk.g.scale.y = Bk.hh / Bk.h; }
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      paint(Bk.mat, on === 'bad' ? 'bad' : '', on === 1 ? (Bk.kind === 'lane' || Bk.kind === 'ruler' ? 0.22 : 0.55) : on === 'bad' ? 0.35 : on === 2 ? 0.12 : 0);
      moveGlow(Bk.glow, Bk.pos ? [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.hh + 3] : [0, 0, 0], (on === 1 || on === 'bad') && Bk.f > 0.9 && Bk.kind === 'actor' ? (on === 'bad' ? 0.5 : 0.8) : 0); });
    setBeams(o.beams); setLines(o.lines); setPts(o.pts); placeReqs(o.reqs, dt); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], p[2] + 30); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0; if (TFIX != null) lt = TFIX;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-10, 920, 8, 455];
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
    if (e.key === 'x' || e.key === 'X') return toggleSem();
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] && o.pos[nm] ? 1 : 0; if (o.pos[nm]) B[nm].pos = o.pos[nm].slice(); B[nm].hh = o.hgt[nm] || B[nm].h; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · X removes catalogo-3 · drag to rotate' };
})() });
