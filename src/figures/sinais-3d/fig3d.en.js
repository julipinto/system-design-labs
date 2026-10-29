// Figura 3D (iso-glow): o pedido que deixa rastro. A loja como uma esteira de 5 caixas (gw-loja, bff-app, pedidos, estoque,
// pagamentos) da celula-recife; o 1063 da Lena como uma ficha amarelo-sódio que a atravessa. Cada caixa solta três marcas
// (um cartão de log com o trace_id, uma métrica, um span). Na frente, a peça do modo (o painel, o histograma, os logs,
// a cascata, as três perguntas, a linha do tempo dos alertas). Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=pilares|metricas|logs|traces|alerta|correlacao; ?step=N abre no passo N).
// Dados: docs/escrita/observabilidade-brief.md (pedido 1063, quinta 03/12/2026 15:30:07.412; trace_id 9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52;
// spans 4 · 6 · 14 · 12 · 20 (1.640) · 210 · 6 · 3 = 275 ms (1.895 ms), estoque 86,5%; histograma 0,25→400 · 0,5→975 · 0,8→992 ·
// 1→992 · 2,5→1.000, p50 0,293 · p95 0,489 · p99 0,765 · p99,9 2,3125; cardinalidade 2.016 · 22.176 · 33,3 bilhões; logs 2,81 · 25,5 ·
// 255 GB/dia; traces 4,8 KB, 12,4 GB × 124 MB/dia, head 1% = 7,7%; alertas nunca · 60–75 s · 30 s · 51,84 s; breaker 39 falhas).
// Conta nossa: com um bucket em 2,0 o p99,9 vira 1 + 7 ÷ 8 × 1 = 1,875 s. Os horários das linhas de log fora 07.412 e 09.068 saem
// da tabela de spans (início de cada span); as linhas de outros pedidos no passo "ilhas" são ilustrativas.
FIGS3D.push({ id: 'sinais', name: 'Signals', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 1) => v.toFixed(d);
  const clk2 = s => { const v = Math.floor(s), m = 20 + Math.floor(v / 60); return `20:${m}:${String(v % 60).padStart(2, '0')}`; };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['pilares', 'metricas', 'logs', 'traces', 'alerta', 'correlacao'];
  const SCNAME = { pilares: 'Pillars', metricas: 'Metrics', logs: 'Logs', traces: 'Traces', alerta: 'Alerts', correlacao: 'Correlation' };
  const SCFULL = { pilares: 'The three signals of 1063', metricas: 'Metrics: the histogram', logs: 'Logs: the order\'s diary',
    traces: 'Traces: the waterfall', correlacao: 'What, where and why', alerta: 'Alerts: the 90 s of PSP-A' };
  const AULA = { pilares: 'aula-2-observabilidade-vs-monitoramento', metricas: 'aula-3-metricas', logs: 'aula-4-logs',
    traces: 'aula-5-traces', correlacao: 'aula-5-traces', alerta: 'aula-6-alerting-e-apm' };
  let clk = 0, sc = 'pilares', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-sinais3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0)
  const B = {};
  const BIG = { s1: 20, fs: 18, lh: 27, y0: 47 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5, zb = PL) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y, zb] };
  }
  // a esteira: as 5 caixas da celula-recife
  const SVX = k => 40 + k * 166, SVW = 150, SVY = 40, SVD = 100, SVH = 18, SVC = k => SVX(k) + SVW / 2;
  const SVN = ['gw', 'bff', 'ped', 'est', 'pag'];
  const SVNAME = ['gw-loja', 'bff-app', 'pedidos', 'estoque', 'pagamentos'];
  SVN.forEach((nm, k) => block(nm, SVX(k), SVY, SVW, SVD, SVH, SMALL));
  // a frente: a peça de cada modo (y de 205 a 435)
  const FY = 205, FD = 230;
  block('pnl', 40, FY, 260, FD, 16); block('lena', 320, FY, 260, FD, 16); block('sig', 600, FY, 260, FD, 16);
  block('hist', 40, FY, 560, FD, 16); block('typ', 620, FY, 240, 110, 16, SMALL); block('card', 620, FY + 120, 240, 110, 16, SMALL);
  block('log', 40, FY, 600, FD, 16); block('lvl', 660, FY, 200, 110, 16, SMALL); block('vol', 660, FY + 120, 200, 110, 16, SMALL);
  block('cas', 40, FY, 600, FD, 16); block('tp', 660, FY, 200, 110, 16, SMALL); block('smp', 660, FY + 120, 200, 110, 16, SMALL);
  block('q1', 40, FY, 260, FD, 16); block('q2', 320, FY, 260, FD, 16); block('q3', 600, FY, 260, FD, 16);
  block('tl', 40, FY, 820, 152, 16); block('pg', 40, FY + 162, 400, 68, 16, SMALL); block('apm', 460, FY + 162, 400, 68, 16, SMALL);
  const NAMES = Object.keys(B);
  // as marcas que cada caixa solta: 3 cartões por caixa (log, métrica, span)
  const KW = 46, KD = 50, KH = 7;
  const CARDS = Array.from({ length: 15 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e fichas de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 32 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 16 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c), grayEm = new THREE.Color(0x8d9399);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : tone === 'gray' ? grayEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : tone === 'gray' ? 0.3 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? 2.6 : b.on || b.tone === 'bad' ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
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
  const TAGS = Array.from({ length: 6 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── a esteira e a ficha ──
  const ZT = PL + SVH + 12;
  const ROW = SVN.map((_, k) => [SVC(k), SVY + SVD / 2, ZT]);
  const LINKS = [0, 1, 2, 3].map(k => [[SVX(k) + SVW, SVY + SVD / 2, Z], [SVX(k + 1), SVY + SVD / 2, Z]]);
  // a ficha para em cada caixa (dw = quanto fica) e anda 0,45 s entre elas; slow = a espera por lock no estoque
  function ride(t, slow, t0 = 0.4) {
    const dw = [0.4, 0.4, 0.5, slow ? 2.6 : 0.4, 0.7], TR = 0.45; let a = t - t0;
    if (a < 0) return { p: ROW[0], at: -1, done: false, wait: false };
    for (let k = 0; k < 5; k++) {
      if (a < dw[k]) return { p: ROW[k], at: k, done: false, wait: slow && k === 3 && a > 0.25 };
      a -= dw[k];
      if (k < 4) { if (a < TR) { const f = ease(a / TR), P0 = ROW[k], P1 = ROW[k + 1]; return { p: [P0[0] + (P1[0] - P0[0]) * f, P0[1], ZT + Math.sin(f * Math.PI) * 6], at: -1, done: false }; } a -= TR; }
    }
    return { p: ROW[4], at: 4, done: true };
  }
  const RIDE_END = slow => 0.4 + 0.4 + 0.4 + 0.5 + (slow ? 2.6 : 0.4) + 0.7 + 4 * 0.45;
  function ficha(o, t, slow, lab = '1063', tone = '') {
    const r = ride(t, slow); if (r.at >= 0) lit(o, SVN[r.at]);
    o.dots.push([r.p, tone]); T(o, [r.p[0], r.p[1], r.p[2] + 20], r.wait ? lab + ' · waiting for lock' : lab, tone === 'bad' ? 'bad' : 'acc');
    if (r.wait) bad(o, 'est'); return r;
  }
  // um fluxo de pedidos comuns (fichas cinza a 0,6 s), sem rótulo
  function stream(o, per = 0.7, travel = 2.4) {
    for (let k = Math.floor((clk - travel) / per); k <= Math.floor(clk / per); k++) {
      const f = (clk - k * per) / travel; if (f <= 0 || f >= 1) continue;
      const x = ROW[0][0] + (ROW[4][0] - ROW[0][0]) * f; o.dots.push([[x, ROW[0][1], ZT], 'gray']);
    }
  }

  // ── conteúdo dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], marks: [], cnt: [], res: [] }; }
  const SVROLE = ['root · JWT', 'app', 'validate', 'reserve', 'PSP-A'];
  function esteira(o, line = k => ['celula-recife', 'dim']) {
    SVN.forEach((nm, k) => { show(o, nm); o.rows[nm] = act(SVNAME[k], SVROLE[k], line(k)); });
    o.beams = LINKS.map(pts => ({ pts }));
  }
  // as marcas: 3 cartões por caixa, que caem da caixa até o chão (f de 0 a 1); kinds = quais (l, m, s)
  const MK = { l: 0, m: 1, s: 2 };
  function marks(o, f, lab, tone = () => 'acc', kinds = 'lms') {
    for (let k = 0; k < 5; k++) for (const kd of kinds) { const i = MK[kd], fk = clamp(f * 1.6 - k * 0.15);
      if (fk <= 0) continue;
      o.marks.push({ p: [SVX(k) + 1 + i * 52, 148, PL + (1 - ease(fk)) * 40], lab: lab(k, kd), tone: tone(k, kd) }); }
  }
  const SPANMS = ['4 ms', '6 ms', '14 ms', '1,640', '210 ms'];

  // ── dados: a cascata, o histograma, os logs, os alertas ──
  // [nome, início normal, duração normal, envolve os filhos até o fim]
  const SPANS = [['POST /pedidos', 0, 4, 1], ['bff-app', 4, 6, 1], ['pedidos', 10, 14, 1], ['↳ carrinho', 24, 12, 0],
    ['↳ estoque', 36, 20, 0], ['↳ pagamentos', 56, 210, 0], ['↳ INSERT', 266, 6, 0], ['↳ Kafka', 272, 3, 0]];
  const HIST = { le: ['0.05', '0.1', '0.25', '0.5', '0.8', '1', '2.5', '5', '+Inf'], cnt: [0, 0, 400, 575, 17, 0, 8, 0, 0], hot: 6 };
  const HIST2 = { le: ['0.05', '0.1', '0.25', '0.5', '0.8', '1', '2', '2.5', '5', '+Inf'], cnt: [0, 0, 400, 575, 17, 0, 8, 0, 0, 0], hot: 6 };
  const TID = '9c1e5a7b…';
  // [hora, nível, serviço, trace, mensagem, extra]
  const LOG1063 = [['07.412', 'INFO', 'gw-loja', TID, 'POST /pedidos', 'cliente_id=lena-77'],
    ['07.436', 'INFO', 'pedidos', TID, 'pedido aceito', 'pedido_id=1063 total=74.70'],
    ['09.068', 'WARN', 'estoque', TID, 'espera por lock', 'sku=CANECA-007 lock_wait_ms=1620 holder=contagem-estoque'],
    ['09.304', 'INFO', 'pedidos', TID, 'pedido criado', 'pedido_id=1063 total=74.70'],
    ['09.307', 'INFO', 'gw-loja', TID, 'resposta', 'status=201 duracao_ms=1895']];
  const NOISE = [['07.405', 'INFO', 'catalogo', '1b8e40c2…', 'GET /produtos/7', ''], ['07.590', 'INFO', 'gw-loja', 'e2a91f37…', 'POST /pedidos', ''],
    ['08.120', 'INFO', 'pagamentos', '5f0c7d18…', 'autorizado PSP-A', ''], ['08.733', 'DEBUG', 'bff-app', '—', 'cache do catálogo', '']];
  const RULES = {
    A: { lab: 'A · error > 5% for 5 min', pend: [0, 90], fire: null, txt: 'never' },
    B: { lab: 'B · error > 5% for 1 min', pend: [0, 60], fire: 60, txt: '60–75 s' },
    C: { lab: 'C · probe 10 s × 3', probes: [10, 20, 30], fire: 30, txt: '30 s' },
    D: { lab: 'D · burn rate 14.4×', pend: [0, 51.84], fire: 51.84, txt: '~52–67 s' } };

  // ── o que se vê em cada passo ──
  const STEPS = {
    pilares: [
      { id: 'verde', dur: 6, title: 'Thursday, 15:30: the dashboard is green', yk: 'THE POST /pedidos DASHBOARD',
        code: ['5 orders/s, normal day', 'average ~0.3 s', '5xx: 0%', 'p95: 0.489 s  (SLO: ≤ 0.8 s)', 'all within limits: green'],
        story: 'Thursday, 12/03/2026, 15:30. The newsletter announces "double mugs" and orders arrive at <b>5 per second</b>, a normal day. The <code>POST /pedidos</code> dashboard shows an average of ~0.3 s, <b>0%</b> of <code>5xx</code> and a p95 of <b>0.489 s</b>, within the 0.8 s SLO. All green.',
        look: 'The five boxes of <code>celula-recife</code> in a row; the gray tokens are the ordinary orders. The dashboard, front left, only has OK marks.',
        key: 'The dashboard answers the questions someone already asked.',
        f(o) { esteira(o); stream(o); show(o, 'pnl'); lit(o, 'pnl'); o.on.pnl = 2;
          o.rows.pnl = act('dashboard', 'POST /pedidos', ['avg    ~0.3 s   OK', 'acc'], ['5xx    0%       OK', 'acc'], ['p95    0.489 s  OK', 'acc'], ['SLO p95 ≤ 0.8 s', 'dim'], ['5 orders/s', 'dim'], ['all green', 'acc']);
          o.cnt = [['P95', '0.489 s'], ['5XX', '0%', 'dim'], ['DASHBOARD', 'green', 'dim']];
          o.res = [['no alert', 'acc']]; } },
      { id: 'lena', dur: 9, title: 'Lena waits 1.9 s for order 1063', yk: 'ORDER 1063 · 15:30:07.412', act: ['Send 1063', 'Lena\'s token'],
        code: ['3 blue mugs: 59.70', 'Recife shipping: 15.00', 'total: 74.70', 'confirmed in 1.9 s (normal ~0.3 s)', 'support code: 9c1e5a7b'],
        story: 'Lena, from Recife, buys <b>3 blue mugs</b> (59.70 + shipping 15.00 = <b>74.70</b>). The app confirms order <b>1063</b> after <b>1.9 s</b>, when normal is ~0.3 s. She complains in the chat and sends the support code the app shows: <code>9c1e5a7b</code>, the first 8 hex characters of the <code>trace_id</code>. The dashboard stays green.',
        look: 'The yellow token is 1063. It stops for a long time at <code>estoque</code>, which turns red, and only then moves on. The dashboard does not change.',
        key: 'The dashboard is green and Lena waited 1.9 s.',
        f(o, t) { esteira(o); stream(o, 1.1); show(o, 'pnl', 'lena'); o.on.pnl = 2;
          o.rows.pnl = act('dashboard', 'POST /pedidos', ['avg    ~0.3 s   OK', 'acc'], ['5xx    0%       OK', 'acc'], ['p95    0.489 s  OK', 'acc'], ['SLO p95 ≤ 0.8 s', 'dim'], ['nothing changed', 'dim']);
          const r = ficha(o, t, true), done = t > RIDE_END(true);
          o.rows.lena = act('chat · Lena', 'lena-77', ['order 1063 · 74.70', 'dim'], [done ? 'confirmed in 1.9 s' : 'waiting…', done ? 'bad' : 'acc'], done ? ['"why did it take so long?"', 'hi'] : null, done ? ['code 9c1e5a7b', 'acc'] : null);
          if (done) lit(o, 'lena'); else o.on.lena = 2;
          const ms = Math.round(lin(t, 0.4, RIDE_END(true), 0, 1895));
          o.cnt = [['LENA WAITED', done ? '1.9 s' : dec(ms / 1000, 1) + ' s', done ? 'bad' : 'acc'], ['NORMAL', '~0.3 s', 'dim'], ['DASHBOARD', 'green', 'dim']];
          o.res = done ? [['green on the dashboard, 1.9 s for Lena', 'bad']] : []; } },
      { id: 'marcas', dur: 8, title: 'Each box leaves three marks', yk: 'THE THREE SIGNALS OF 1063', act: ['Drop the marks', 'log, metric, span'],
        code: ['log:     5 lines with the trace_id', 'metric: +1 on the counter, +1 in a bucket', 'span:   8 from the table (12 with internals)', 'trace_id: 9c1e5a7b3d8f4a2e…', 'the metric carries no trace_id'],
        story: 'Wherever 1063 passes, each box leaves <b>three marks</b>. A <b>log</b> (a JSON line with the <code>trace_id</code>), a <b>metric</b> (the counter goes up 1, the histogram gets 1 in a <i>bucket</i>) and a <b><i>span</i></b> (the piece of the path with a start and a duration). The article calls this three pillars; OpenTelemetry calls them <b>signals</b>. The log and the <i>span</i> carry the <code>trace_id</code>; the metric does not, because it aggregates all the orders.',
        look: 'The cards fall in front of each box: log and span with the code 9c1e5a7b, metric with +1. The estoque span says 1,640.',
        key: 'One order leaves a log, a metric and a span; the trace_id links two of them.',
        f(o, t) { esteira(o); show(o, 'lena', 'sig'); lit(o, 'sig'); o.on.lena = 2;
          o.rows.lena = act('chat · Lena', 'lena-77', ['order 1063 · 74.70', 'dim'], ['confirmed in 1.9 s', 'bad'], ['code 9c1e5a7b', 'acc']);
          const f = lin(t, 0.6, 3.2, 0, 1);
          marks(o, f, (k, kd) => kd === 'l' ? 'log\nid ✓' : kd === 'm' ? 'metric\n+1' : 'span\n' + SPANMS[k], (k, kd) => k === 3 && kd === 's' ? 'bad' : kd === 'm' ? 'gray' : 'acc');
          o.rows.sig = act('signals of 1063', 'trace_id', ['log      5 lines', 'acc'], ['metric   +1 (no id)', 'dim'], ['span     8 (12)', 'acc'], ['id: 9c1e5a7b…', 'acc'], ['correlation: the id', 'dim']);
          o.cnt = [['MARKS', String(Math.round(f * 15)) + ' of 15'], ['LOGS OF 1063', '5', 'dim'], ['SPANS', '8 (12)', 'dim']];
          o.res = f >= 1 ? [['three signals, one trace_id', 'acc']] : []; } },
      { id: 'pergunta', dur: 8, title: 'Known question × new question', yk: 'MONITORING × OBSERVABILITY', act: ['Ask Lena\'s', 'question'],
        code: ['known: error > 5%?  → no', 'known: p95 > 0.8 s? → no', 'new: why did 9c1e5a7b', '  take 1.9 s?', 'cycle: alert → metric → trace → log'],
        story: '<b>Monitoring</b> answers questions someone already asked: "did errors go above 5%?", "did p95 go above 0.8 s?". Both give <b>no</b>. Lena brings a <b>new</b> question: why did <b>this</b> order take 1.9 s? <b>Observability</b> is the property of being able to answer without changing the code, by joining the marks through the <code>trace_id</code>. The idea comes from control theory (Kalman, 1960s): inferring the internal state from the outputs. What it finds becomes, afterwards, a new alert.',
        look: 'The dashboard answers "no" to its two questions; on the right, Lena\'s question lights up the marks with the code 9c1e5a7b.',
        key: 'Monitoring is asking the known; observing is being able to ask the new.',
        f(o, t) { esteira(o); show(o, 'pnl', 'lena', 'sig'); o.on.pnl = 2;
          o.rows.pnl = act('monitoring', 'KNOWN', ['error > 5%?', 'dim'], ['  no', 'acc'], ['p95 > 0.8 s?', 'dim'], ['  no', 'acc'], ['nothing to say', 'dim']);
          o.rows.lena = act('chat · Lena', 'lena-77', ['confirmed in 1.9 s', 'bad'], ['"why did it take so long?"', 'hi'], ['code 9c1e5a7b', 'acc']); lit(o, 'lena');
          const q = t > 2.2; if (q) lit(o, 'sig');
          o.rows.sig = act('observability', 'NEW', ['why did', 'dim'], ['9c1e5a7b take', 'dim'], ['1.9 s?', 'acc'], [q ? 'filter by trace_id' : '…', q ? 'acc' : 'dim']);
          marks(o, 1, (k, kd) => kd === 'l' ? 'log\nid ✓' : kd === 'm' ? 'metric\n+1' : 'span\n' + SPANMS[k], (k, kd) => kd === 'm' ? 'gray' : q ? (k === 3 && kd === 's' ? 'bad' : 'acc') : 'gray');
          o.cnt = [['DASHBOARD QUESTIONS', '2 × no'], ['NEW QUESTION', '1', 'dim'], ['KEY', '9c1e5a7b', 'dim']];
          o.res = q ? [['the id joins the marks', 'acc']] : []; } },
      { id: 'semid', dur: 8, title: 'And if it goes wrong: marks without a trace_id', yk: 'EXPENSIVE TOOL, NO ANSWER', act: ['Remove the trace_id', 'from the logs'],
        code: ['logs without trace_id', 'metrics without the celula label', 'traces that break at Kafka', '50 dashboards and no id', 'Lena\'s question: no answer'],
        story: 'Now the same store, with the same three signals, but the logs came out <b>without a <code>trace_id</code></b>, the metrics without the <code>celula</code> label and the traces break at Kafka. There are plenty of marks and none links to another. To find 1063 you have to cross the timestamps of five services by hand. Having the three signals is not having observability; <b>correlation</b> is missing.',
        look: 'The log cards turn red and show no code; Lena\'s question goes unanswered.',
        key: 'Without a shared id, three signals are three loose piles.',
        f(o, t) { esteira(o); show(o, 'pnl', 'lena', 'sig'); o.on.pnl = 2;
          o.rows.pnl = act('dashboard', '50 DASHBOARDS', ['error 0%', 'dim'], ['p95 0.489 s', 'dim'], ['no celula', 'bad'], ['all green', 'dim']);
          o.rows.lena = act('chat · Lena', 'lena-77', ['confirmed in 1.9 s', 'bad'], ['"why did it take so long?"', 'hi'], ['code 9c1e5a7b', 'acc']); o.on.lena = 2;
          const off = t > 1.2; if (off) bad(o, 'sig'); else o.on.sig = 2;
          o.rows.sig = act('observability', off ? 'NO ID' : 'NEW', ['why did', 'dim'], ['9c1e5a7b take', 'dim'], ['1.9 s?', 'dim'], [off ? 'no line with the id' : '…', off ? 'bad' : 'dim']);
          marks(o, 1, (k, kd) => kd === 'l' ? (off ? 'log\nno id' : 'log\nid ✓') : kd === 'm' ? 'metric\n+1' : 'span\n' + (k >= 2 && off ? 'broken' : SPANMS[k]),
            (k, kd) => kd === 'm' ? 'gray' : off && (kd === 'l' || k >= 2) ? 'bad' : 'gray');
          o.cnt = [['LOGS WITH THE ID', off ? '0 of 5' : '5 of 5', off ? 'bad' : 'acc'], ['DASHBOARDS', '50', 'dim'], ['ANSWER', off ? 'none' : '…', off ? 'bad' : 'dim']];
          o.res = off ? [['loose marks: nothing links', 'bad']] : []; } },
    ],
    metricas: [
      { id: 'tipos', dur: 7, title: 'Three types of metric', yk: 'COUNTER · GAUGE · HISTOGRAM',
        code: ['counter:   http_server_requests_total', '  only goes up; rate() = 5/s', 'gauge:     db_pool_connections_in_use', '  goes up and down', 'histogram: ..._duration_seconds'],
        story: 'The metric is the <b>cheapest and most aggregated</b> signal: one number per series at each scrape, for all the orders together. There are three types. The <b>counter</b> only goes up (or resets on restart) and is read with <code>rate()</code>: 5 orders/s. The <b><i>gauge</i></b> goes up and down, like connections in use or <code>replication_lag_seconds</code>. The <b>histogram</b> counts how many requests fell in each duration range. The article puts "response time" as a <i>gauge</i>; the right type is a histogram, because the last value loses the distribution.',
        look: 'The tokens move along the belt; the card on the right shows the three types. The histogram in front is still empty.',
        key: 'Response time is a histogram, not a gauge.',
        f(o) { esteira(o, k => ['5/s', 'dim']); stream(o, 0.5); show(o, 'hist', 'typ', 'card'); lit(o, 'typ'); o.on.card = 2;
          o.rows.typ = act('types', '', ['counter   ↑ rate() 5/s', 'acc'], ['gauge     ↕ pool, lag', 'acc'], ['histogram ▮ buckets', 'acc'], ['time: histogram', 'dim']);
          o.rows.card = act('labels', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · cumulative'); o.rows.hist.hist = { ...HIST, f: 0, pct: [] };
          o.cnt = [['ORDERS/S', '5'], ['TYPES', '3', 'dim'], ['IN THE HISTOGRAM', '0', 'dim']];
          o.res = [['metric: the cheapest', 'acc']]; } },
      { id: 'baldes', dur: 9, title: '1,000 requests fall into the buckets', yk: 'CUMULATIVE BUCKETS (le)', act: ['Fill the histogram', '1,000 requests'],
        code: ['window: 1,000 req (200 s at 5/s)', 'le=0.25 → 400   le=0.5 → 975', 'le=0.8  → 992   le=1   → 992', 'le=2.5  → 1,000 (_count)', 'the 8 slow ones: between 1 and 2.5 s'],
        story: 'In a window of <b>1,000 requests</b> (200 s at 5/s), each one falls in the <i>bucket</i> of its duration. Prometheus stores the <b>cumulative</b> counts: <code>le=0.25</code> → 400, <code>le=0.5</code> → 975, <code>le=0.8</code> → 992 (0.8 is the SLO limit), <code>le=1</code> → 992, <code>le=2.5</code> → 1,000. The <b>8</b> orders of the 15:30 episode, 1063 among them, all fall between 1 and 2.5 s.',
        look: 'The columns rise; under each one, the limit (<code>le</code>) and the cumulative count. The short red column is the 8 slow ones.',
        key: 'The histogram keeps how many fell in each range, not each duration.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); stream(o, 0.5); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          const f = lin(t, 0.5, 6, 0, 1);
          o.rows.typ = act('types', '', ['counter   ↑', 'dim'], ['gauge     ↕', 'dim'], ['histogram ▮', 'acc']);
          o.rows.card = act('labels', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f, pct: [] };
          o.cnt = [['REQUESTS', thou(f * 1000)], ['ABOVE 1 S', String(Math.round(f * 8)), f > 0.2 ? 'bad' : 'dim'], ['WITHIN THE SLO', thou(f * 992), 'dim']];
          o.res = f >= 1 ? [['8 of 1,000 between 1 and 2.5 s', 'acc']] : []; } },
      { id: 'percentis', dur: 8, title: 'The percentiles come out of the buckets', yk: 'histogram_quantile: INTERPOLATION', act: ['Calculate', 'p50 to p99.9'],
        code: ['p50   = 0.25 + 100 ÷ 575 × 0.25 = 0.293', 'p95   = 0.489 s', 'p99   = 0.765 s  (< 0.8: green)', 'p99.9 = 2.3125 s (the real one: ~1.9)', '8 in 1,000 = 0.8%: p95 and p99 stay put'],
        story: '<code>histogram_quantile</code> estimates the percentile by <b>linear interpolation inside the <i>bucket</i></b>. p50 lands at <b>0.293 s</b>, p95 at <b>0.489</b> and p99 at <b>0.765</b>, below the 0.8 SLO. The 8 slow ones are 0.8% of the window: they <b>move neither p95 nor p99</b>, and that is why the dashboard stayed green. Only p99.9 sees them, and barely: <b>2.3125 s</b> for a real value of ~1.9 s, because the 1 to 2.5 s <i>bucket</i> is wide.',
        look: 'The list on the right: p50, p95 and p99 in yellow; p99.9 in red, with 2.3125 s.',
        key: 'Lena\'s episode does not move p99: the dashboard had no way of turning red.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          o.rows.typ = act('do not add percentiles', '', ['average of the p99s:', 'dim'], ['  269 ms', 'bad'], ['true p99:', 'dim'], ['  2,000 ms', 'acc']);
          o.rows.card = act('labels', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          const n = Math.floor(lin(t, 0.4, 3.6, 0, 4.99));
          const P = [['p50', '0.293 s', 'acc'], ['p95', '0.489 s', 'acc'], ['p99', '0.765 s', 'acc'], ['p99.9', '2.3125 s', 'bad']].slice(0, n);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · cumulative'); o.rows.hist.hist = { ...HIST, f: 1, pct: P };
          o.cnt = [['P99', '0.765 s'], ['P99.9', n >= 4 ? '2.3125 s' : '…', n >= 4 ? 'bad' : 'dim'], ['THE 1063', '~1.9 s', 'dim']];
          o.res = n >= 4 ? [['p95 and p99 green; the 1063, not', 'bad']] : []; } },
      { id: 'balde2', dur: 7, title: 'A bucket at 2.0 s', yk: 'WHERE TO PUT THE BUCKETS', act: ['Put a bucket', 'at 2.0 s'],
        code: ['new buckets: … 1 · 2 · 2.5 …', 'le=1 → 992   le=2 → 1,000', 'p99.9 = 1 + 7 ÷ 8 × (2 − 1)', '      = 1.875 s (the real one: ~1.9)', 'a bucket near the SLO and near what you fear'],
        story: 'The <i>buckets</i> decide the precision. With a new limit at <b>2.0 s</b>, the 8 slow ones fall between 1 and 2, and p99.9 becomes <b>1.875 s</b>, close to the real ~1.9. The practical rule: put a <i>bucket</i> near the SLO (0.8 is already there) and another near the value you fear. And since percentiles <b>cannot be added</b>, to combine instances you sum the <i>buckets</i> and compute again.',
        look: 'The "2" column appears between the 1 and the 2.5; the 8 slow ones move into it and p99.9 drops to 1.875 s.',
        key: 'The precision of the percentile is the width of the bucket.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          o.rows.typ = act('do not add percentiles', '', ['sum the buckets', 'acc'], ['of each instance', 'dim'], ['and compute again', 'dim']);
          o.rows.card = act('labels', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          const nw = t > 1.2;
          o.rows.hist = act('http_server_request_duration_seconds', nw ? 'WITH le=2' : 'le · cumulative');
          o.rows.hist.hist = nw ? { ...HIST2, f: 1, pct: [['p50', '0.293 s', 'acc'], ['p95', '0.489 s', 'acc'], ['p99', '0.765 s', 'acc'], ['p99.9', '1.875 s', 'acc']] }
            : { ...HIST, f: 1, pct: [['p50', '0.293 s', 'acc'], ['p95', '0.489 s', 'acc'], ['p99', '0.765 s', 'acc'], ['p99.9', '2.3125 s', 'bad']] };
          o.cnt = [['P99.9', nw ? '1.875 s' : '2.3125 s', nw ? 'acc' : 'bad'], ['REAL VALUE', '~1.9 s', 'dim'], ['BUCKETS', nw ? '10' : '9', 'dim']];
          o.res = nw ? [['narrow bucket: close to the real one', 'acc']] : []; } },
      { id: 'cardinalidade', dur: 9, title: 'And if it goes wrong: cliente_id as a label', yk: 'CARDINALITY', act: ['Put cliente_id', 'as a label'],
        code: ['servico 7 × rota 12 × status 6', '  × celula 4 = 2,016 combinations', '× 11 histogram series = 22,176', '× cliente_id (1.5 million)', '  = 33.3 billion series'],
        story: 'Each label combination is a series. <code>servico</code> (7) × <code>rota</code> (12) × <code>status</code> (6) × <code>celula</code> (4) give <b>2,016</b> combinations; the histogram generates 11 series per combination (8 <code>le</code> + <code>+Inf</code> + <code>_sum</code> + <code>_count</code>): <b>22,176</b>. Someone wants to find Lena\'s order through the metric and puts <code>cliente_id</code> as a label: 22,176 × 1,500,000 = <b>33.3 billion</b> series. <code>cliente_id</code>, <code>pedido_id</code> and <code>trace_id</code> go in the log and the trace.',
        look: 'The labels card multiplies and turns red when <code>cliente_id</code> comes in.',
        key: 'A customer id is not a label: it is a log and trace field.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); o.on.hist = 2; o.on.typ = 2;
          const s = t < 1.6 ? 0 : t < 3.2 ? 1 : 2;
          o.rows.typ = act('series', '', ['per combination: 11', 'dim'], ['8 le + Inf', 'dim'], ['+ _sum + _count', 'dim']);
          o.rows.card = act('labels', s === 2 ? '+ cliente_id' : 'POST /pedidos', ['7 × 12 × 6 × 4', 'dim'], ['= 2,016', s === 0 ? 'acc' : 'dim'], s >= 1 ? ['× 11 = 22,176', s === 1 ? 'acc' : 'dim'] : null, s === 2 ? ['× 1.5 M = 33.3 bn', 'bad'] : null);
          if (s === 2) bad(o, 'card'); else lit(o, 'card');
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f: 1, pct: [['p99', '0.765 s', 'acc']] };
          o.cnt = [['SERIES', ['2,016', '22,176', '33.3 bn'][s], s === 2 ? 'bad' : 'acc'], ['CLIENTE_ID', '1.5 million', 'dim'], ['LABELS', s === 2 ? '5' : '4', 'dim']];
          o.res = s === 2 ? [['33.3 billion series', 'bad']] : []; } },
    ],
    logs: [
      { id: 'ilhas', dur: 7, title: 'Each service writes its own diary', yk: 'LOGS: ISLANDS PER SERVICE',
        code: ['5 services, ~3 INFO lines each', '~300 B per line (JSON)', '4.5 KB per order', 'the 1063 lines mixed in', '  with those of the other orders'],
        story: 'The log is the <b>diary of an event</b>: what happened to <b>that</b> order. Each service writes its own, in JSON, with ~3 INFO lines per order and ~300 B per line. In the same second as 1063, other orders, the catalog and <code>bff-app</code> go by, and the lines get mixed up. Without a shared field, each service is an island.',
        look: 'The board in front shows lines from several services in the order they arrived; the 1063 ones are in the middle of the others.',
        key: 'A loose log tells one service\'s story, not the order\'s.',
        f(o, t) { esteira(o, k => ['~3 lines/order', 'dim']); stream(o, 0.5); show(o, 'log', 'lvl', 'vol'); lit(o, 'log'); o.on.lvl = 2; o.on.vol = 2;
          const all = [...LOG1063, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1);
          o.rows.log = act('logs · 15:30', 'ALL'); o.rows.log.logs = { lines: all.map(l => [...l, 'dim']), n: Math.round(lin(t, 0.3, 3, 0, all.length)) };
          o.rows.lvl = act('levels', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'dim'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', 'NORMAL DAY', ['4.5 KB/order', 'dim'], ['2.81 GB/day', 'acc']);
          o.cnt = [['LINES ON SCREEN', '9'], ['OF THE 1063', '5', 'dim'], ['SERVICES', '5', 'dim']];
          o.res = [['the 1063 ones are in the middle', 'dim']]; } },
      { id: 'filtro', dur: 8, title: 'Filter by the trace_id of 1063', yk: 'trace_id = 9c1e5a7b3d8f4a2e…', act: ['Filter', 'by trace_id'],
        code: ['trace_id="9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52"', '07.412 gw-loja  POST /pedidos', '07.436 pedidos  pedido aceito', '09.068 estoque  WARN espera por lock', '09.304 pedidos · 09.307 gw-loja 201'],
        story: 'Lena sent <code>9c1e5a7b</code>. A search by <code>trace_id</code> brings the <b>5 lines</b> of 1063, from three services, in order: the entry at <code>gw-loja</code> at 07.412, the "pedido aceito", a <b>WARN</b> from <code>estoque</code> at 09.068, the "pedido criado" and the <code>201</code> response with <code>duracao_ms=1895</code>. Between 07.436 and 09.068 there is a 1.6 s gap.',
        look: 'The lines of the other orders disappear and the 5 of 1063 stay in order, in yellow; the WARN one, in red.',
        key: 'The trace_id turns five islands into a single diary.',
        f(o, t) { esteira(o, k => ['~3 lines/order', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log'); o.on.lvl = 2; o.on.vol = 2;
          const fl = t > 1.4;
          const lines = fl ? LOG1063.map(l => [...l, l[1] === 'WARN' ? 'bad' : 'acc']) : [...LOG1063, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1).map(l => [...l, l[3] === TID ? 'acc' : 'dim']);
          o.rows.log = act('logs · 15:30', fl ? 'trace_id = 9c1e5a7b…' : 'ALL'); o.rows.log.logs = { lines, n: 99 };
          [0, 2, 3].forEach(k => { if (fl) lit(o, SVN[k]); });
          o.rows.lvl = act('levels', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'acc'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', 'NORMAL DAY', ['4.5 KB/order', 'dim'], ['2.81 GB/day', 'acc']);
          o.cnt = [['LINES OF 1063', fl ? '5' : '…', 'acc'], ['SERVICES', fl ? '3' : '5', 'dim'], ['GAP', fl ? '1.6 s' : '…', fl ? 'bad' : 'dim']];
          o.res = fl ? [['5 lines, a 1.6 s gap', 'acc']] : []; } },
      { id: 'warn', dur: 8, title: 'The estoque WARN says who held it', yk: 'THE estoque LINE (JSON)', act: ['Open the WARN', 'from estoque'],
        code: ['"level":"WARN","servico":"estoque"', '"msg":"espera por lock"', '"sku":"CANECA-007"', '"lock_wait_ms":1620', '"holder":"contagem-estoque","holder_pid":4412'],
        story: 'The <code>estoque</code> line is an <b>actionable WARN</b>: emitted before Lena complained, it says what happened and with whom. The order waited <b>1,620 ms</b> for a <i>lock</i> on the <code>CANECA-007</code> row, and whoever held it was <b><code>contagem-estoque</code></b> (pid 4412), a job of the service itself. The log answers <b>why</b>.',
        look: 'The red line opens below with the JSON fields; the estoque box turns red.',
        key: 'A good WARN already carries the name of whoever held the lock.',
        f(o, t) { esteira(o, k => ['~3 lines/order', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log', 'lvl'); o.on.vol = 2; bad(o, 'est');
          o.rows.log = act('logs · 15:30', 'trace_id = 9c1e5a7b…'); o.rows.log.logs = { lines: LOG1063.map(l => [...l, l[1] === 'WARN' ? 'bad' : 'dim']), n: 99, open: t > 1 ? 2 : -1 };
          o.rows.lvl = act('levels', 'WARN', ['INFO: the normal', 'dim'], ['WARN: actionable', 'bad'], ['ERROR: triage', 'dim'], ['FATAL: the end', 'dim']);
          o.rows.vol = act('volume', 'NORMAL DAY', ['4.5 KB/order', 'dim'], ['2.81 GB/day', 'acc']);
          o.cnt = [['LOCK_WAIT', '1,620 ms', 'bad'], ['HOLDER', 'contagem-estoque', 'dim'], ['SKU', 'CANECA-007', 'dim']];
          o.res = t > 1 ? [['why: contagem-estoque', 'bad']] : []; } },
      { id: 'indice', dur: 8, title: 'Structure and index only some fields', yk: 'WHAT GETS INDEXED',
        code: ['index: trace_id · pedido_id · celula', '       servico · versao · level', 'the rest (msg, sku…): only stored', 'levels: TRACE DEBUG INFO', '        WARN ERROR FATAL'],
        story: 'The cost of the log is indexing the whole text. With JSON of <b>fixed fields</b>, you index only what helps find it: <code>trace_id</code>, <code>pedido_id</code>, <code>celula</code>, <code>servico</code>, <code>versao</code> and <code>level</code>. The rest goes along, but does not enter the index. The six levels (TRACE to FATAL) decide what gets written: <b>ERROR</b> is for triage, <b>FATAL</b> is the process that cannot go on. The <code>cliente_id</code> can go in; CPF and token cannot: if they show up, mask them.',
        look: 'On the board, the indexed columns light up; the message and the extra fields stay dimmed.',
        key: 'Index what finds the line, not the whole line.',
        f(o, t) { esteira(o, k => ['~3 lines/order', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log', 'lvl'); o.on.vol = 2;
          o.rows.log = act('logs · 15:30', 'INDEX'); o.rows.log.logs = { lines: LOG1063.map(l => [...l, 'dim']), n: 99, idx: t > 1 };
          o.rows.lvl = act('levels', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'acc'], ['ERROR  FATAL', 'dim'], ['CPF and token: no', 'bad']);
          o.rows.vol = act('volume', 'NORMAL DAY', ['4.5 KB/order', 'dim'], ['2.81 GB/day', 'acc']);
          o.cnt = [['INDEXED FIELDS', '6'], ['LEVELS', '6', 'dim'], ['PER LINE', '~300 B', 'dim']];
          o.res = [['small index, fast search', 'acc']]; } },
      { id: 'debug', dur: 9, title: 'And if it goes wrong: DEBUG on Black Friday', yk: 'LOG VOLUME', act: ['Turn on DEBUG', 'at the peak'],
        code: ['normal day: 22.5 + 10 KB/s = 2.81 GB/day', 'peak (30 orders/s, 640 req/s):', '  135 + 160 KB/s = 25.5 GB/day', '  × 30 days = 765 GB', 'DEBUG (~10×): 255 GB/day'],
        story: 'On a normal day, 5 orders/s at 4.5 KB and the catalog at 40 req/s give <b>2.81 GB/day</b>. If the Black Friday peak (30 orders/s, 640 req/s) lasted all day: <b>25.5 GB/day</b>, <b>765 GB</b> over 30 days of retention. Someone turns on <b>DEBUG</b> "for the crisis" and forgets: ~10×, <b>255 GB/day</b>. The bill grows and search gets slow exactly when you need to find a line.',
        look: 'The volume card goes from 2.81 to 25.5 and then to 255 GB/day, and turns red.',
        key: 'DEBUG on at the peak costs ten times as much and hides the WARN.',
        f(o, t) { esteira(o, k => [t > 3.4 ? 'DEBUG on' : '~3 lines/order', t > 3.4 ? 'bad' : 'dim']); stream(o, t > 1.4 ? 0.2 : 0.5); show(o, 'log', 'lvl', 'vol'); o.on.log = 2;
          const s = t < 1.4 ? 0 : t < 3.4 ? 1 : 2;
          o.rows.log = act('logs · 15:30', s === 2 ? 'DEBUG' : 'INFO'); o.rows.log.logs = { lines: (s === 2 ? [...LOG1063, ...NOISE, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1) : LOG1063).map(l => [...l, l[1] === 'WARN' ? 'bad' : 'dim']), n: 99 };
          o.rows.lvl = act('levels', s === 2 ? 'DEBUG' : 'INFO', ['TRACE  DEBUG', s === 2 ? 'bad' : 'dim'], ['INFO   WARN', 'dim'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', ['NORMAL DAY', 'PEAK', 'PEAK + DEBUG'][s], [['2.81 GB/day', '25.5 GB/day', '255 GB/day'][s], s === 2 ? 'bad' : 'acc'], s ? ['30 days: 765 GB', 'dim'] : ['4.5 KB/order', 'dim']);
          if (s === 2) bad(o, 'vol', 'lvl'); else lit(o, 'vol');
          o.cnt = [['GB/DAY', ['2.81', '25.5', '255'][s], s === 2 ? 'bad' : 'acc'], ['30 DAYS (INFO)', '765 GB', 'dim'], ['LEVEL', s === 2 ? 'DEBUG' : 'INFO', s === 2 ? 'bad' : 'dim']];
          o.res = s === 2 ? [['10× the cost, the WARN in the middle', 'bad']] : []; } },
    ],
    traces: [
      { id: 'normal', dur: 7, title: 'A normal order: 275 ms in 8 spans', yk: 'THE WATERFALL (ms)',
        code: ['POST /pedidos  0 → 4', 'bff-app 4 · pedidos 10 · carrinho 24', 'estoque 36 → 56 (20)', 'pagamentos 56 → 266 (210)', 'INSERT 266 · Kafka 272 → 275'],
        story: 'The <i>trace</i> is the end-to-end path of a request: a tree of <b><i>spans</i></b>, each with a start, a duration, a parent and attributes. A normal order has <b>8</b>: the root at <code>gw-loja</code>, <code>bff-app</code>, <code>pedidos</code> and its calls (carrinho, estoque, pagamentos, the <code>INSERT</code> and Kafka). Total: <b>275 ms</b>, and the biggest piece is the 210 ms of <code>pagamentos</code> (180 of them at PSP-A).',
        look: 'Each bar drops from the box into the waterfall. The outline of the first three shows they wait for their children until the end; the filled part is their own work.',
        key: 'The trace says where the time was spent.',
        f(o, t) { esteira(o, k => [['4 ms', '6 ms', '14 ms', '20 ms', '210 ms'][k], 'dim']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.tp = 2; o.on.smp = 2;
          ficha(o, t, false, 'normal', 'gray');
          o.rows.cas = act('trace · POST /pedidos', 'NORMAL'); o.rows.cas.cas = { slow: false, n: Math.round(lin(t, 0.4, 3.2, 0, 8)) };
          o.rows.tp = act('traceparent', 'W3C', ['00-<32 hex>', 'dim'], ['-<16 hex>-01', 'dim']);
          o.rows.smp = act('sampling', '', ['4.8 KB per trace', 'dim'], ['12 spans × 400 B', 'dim']);
          o.cnt = [['TOTAL', '275 ms'], ['SPANS', '8', 'dim'], ['LARGEST', 'pagamentos 210', 'dim']];
          o.res = [['PSP-A is the biggest piece', 'acc']]; } },
      { id: 'lento', dur: 9, title: 'The 1063: 1,895 ms, 86.5% in estoque', yk: 'THE 1063 WATERFALL (ms)', act: ['Open the trace', 'of 1063'],
        code: ['estoque reservar: 36 → 1,676', '  20 of work + 1,620 of waiting', 'pagamentos 1,676 → 1,886', 'total: 1,895 ms', 'estoque: 1,640 ÷ 1,895 = 86.5%'],
        story: 'The 1063 trace has the same bars, with one difference: <code>estoque reservar</code> lasted <b>1,640 ms</b> (20 of work and <b>1,620</b> of <i>lock</i> wait). Everything that comes after is pushed back: the total goes to <b>1,895 ms</b>, and <code>estoque</code> is <b>86.5%</b> of the time. The metric said <b>that</b> 8 orders were slow; the trace says <b>where</b>.',
        look: 'The estoque bar stretches in red; the ones for pagamentos, the INSERT and Kafka move to the right.',
        key: 'A 1,640 ms span out of 1,895: the place is found.',
        f(o, t) { esteira(o, k => [['4 ms', '6 ms', '14 ms', '1,640 ms', '210 ms'][k], k === 3 ? 'bad' : 'dim']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.tp = 2; o.on.smp = 2;
          ficha(o, t, true);
          const g = lin(t, 0.8, 3.6, 0, 1);
          o.rows.cas = act('trace 9c1e5a7b…', '1063'); o.rows.cas.cas = { slow: g, n: 8 };
          o.rows.tp = act('traceparent', 'W3C', ['00-9c1e5a7b…', 'acc'], ['-a3c4d5e6…-01', 'dim']);
          o.rows.smp = act('sampling', '', ['4.8 KB per trace', 'dim'], ['12 spans × 400 B', 'dim']);
          const tot = Math.round(275 + 1620 * g);
          o.cnt = [['TOTAL', thou(tot) + ' ms', g > 0.5 ? 'bad' : 'acc'], ['ESTOQUE', thou(20 + 1620 * g) + ' ms', g > 0.5 ? 'bad' : 'dim'], ['SHARE OF ESTOQUE', g >= 1 ? '86.5%' : '…', 'dim']];
          o.res = g >= 1 ? [['where: estoque, 86.5%', 'bad']] : []; } },
      { id: 'traceparent', dur: 9, title: 'The traceparent travels in the headers', yk: 'traceparent (W3C)', act: ['Follow the header', 'from box to box'],
        code: ['00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52', '  -a3c4d5e6f7a8b9c0-01', 'version 00 · trace_id 32 hex', 'parent span 16 hex · flags 01 (sampled)', 'HTTP and Kafka: the same header'],
        story: 'How do five services know they are in the same trace? Each call carries the W3C <code>traceparent</code> header: <code>version-trace_id-parent span-flags</code>. Each service reads the <code>trace_id</code>, creates its <i>span</i> with the right parent and passes the header on, over HTTP and in Kafka messages. That is <b>context propagation</b>. OpenTelemetry does it for you; the idea comes from Dapper, at Google.',
        look: 'The token carries the header; each box it touches lights up and starts showing the same 9c1e5a7b.',
        key: 'The trace exists because each service passes on the traceparent.',
        f(o, t) { const r = ride(t, false, 0.4);
          esteira(o, k => [r.at >= k || r.done || (r.at < 0 && t > 0.4 && ROW[k][0] <= r.p[0]) ? 'trace 9c1e5a7b' : 'waiting…', r.at >= k || r.done || (r.at < 0 && t > 0.4 && ROW[k][0] <= r.p[0]) ? 'acc' : 'dim']);
          show(o, 'cas', 'tp', 'smp'); lit(o, 'tp'); o.on.cas = 2; o.on.smp = 2;
          ficha(o, t, false, 'traceparent');
          o.rows.cas = act('trace 9c1e5a7b…', '1063'); o.rows.cas.cas = { slow: 1, n: 8 };
          o.rows.tp = act('traceparent', 'W3C', ['00 · version', 'dim'], ['9c1e5a7b… · trace', 'acc'], ['a3c4d5e6… · parent', 'dim'], ['01 · sampled', 'dim']);
          o.rows.smp = act('sampling', '', ['4.8 KB per trace', 'dim'], ['12 spans × 400 B', 'dim']);
          o.cnt = [['TRACE_ID', '9c1e5a7b…'], ['PARENT SPAN', '16 hex', 'dim'], ['FLAGS', '01', 'dim']];
          o.res = [['the same id all along the path', 'acc']]; } },
      { id: 'amostra', dur: 9, title: 'Head × tail: keeping the slow traces', yk: 'SAMPLING AT 30 ORDERS/S', act: ['Turn on tail', 'sampling'],
        code: ['12 spans × 400 B = 4.8 KB per trace', '100%: 12.4 GB/day · 1%: 124 MB/day', 'head 1%: 1 − 0.99⁸ = 7.7%', '  of keeping at least one of the 8', 'tail (5xx, > 800 ms, 1%): all 8'],
        story: 'Keeping every trace at 30 orders/s costs <b>12.4 GB/day</b>; with 1%, <b>124 MB</b>. <i><b>Head sampling</b></i> decides at the start, before knowing whether the order will be slow: with 1%, the chance of keeping <b>at least one</b> of the 8 slow ones is 1 − 0.99⁸ = <b>7.7%</b>. <i><b>Tail sampling</b></i> decides after seeing the whole trace: it keeps every <code>5xx</code>, everything above 800 ms and 1% of the rest. It keeps all <b>8</b>, Lena\'s among them.',
        look: 'The sampling card switches from head to tail; the chance of having 1063 goes from 7.7% to 8 of 8.',
        key: 'Decide after seeing the trace and the slow one is kept.',
        f(o, t) { esteira(o, k => ['30 orders/s', 'dim']); stream(o, 0.3); show(o, 'cas', 'tp', 'smp'); lit(o, 'smp'); o.on.tp = 2; o.on.cas = 2;
          const tl = t > 2.6;
          o.rows.cas = act('trace 9c1e5a7b…', tl ? 'KEPT' : 'MAYBE'); o.rows.cas.cas = { slow: 1, n: 8, ghost: !tl };
          o.rows.tp = act('cost', '', ['100%: 12.4 GB/day', 'dim'], ['1%: 124 MB/day', 'acc']);
          o.rows.smp = act('sampling', tl ? 'TAIL' : 'HEAD 1%', [tl ? 'slow: 8 of 8' : 'slow: 7.7%', tl ? 'acc' : 'bad'], [tl ? '5xx + > 800 ms' : 'decides at the start', 'dim']);
          o.cnt = [['KEEPS ONE OF THE 8', tl ? '100%' : '7.7%', tl ? 'acc' : 'bad'], ['100% OF TRACES', '12.4 GB/day', 'dim'], ['1% OF TRACES', '124 MB/day', 'dim']];
          o.res = tl ? [['tail: the 1063 stays', 'acc']] : [['head: the 1063 almost vanishes', 'bad']]; } },
      { id: 'kafka', dur: 9, title: 'And if it goes wrong: the context is lost at Kafka', yk: 'BROKEN PROPAGATION', act: ['Lose the context', 'at Kafka'],
        code: ['pedidos publishes PedidoCriado', '  with the traceparent in the header', 'the consumer (entregas) does not pass it on', 'the consumption becomes a new, orphan trace', 'the 1063 path breaks in half'],
        story: '<code>pedidos</code> publishes <code>PedidoCriado</code> to Kafka with the <code>traceparent</code> in the message header. On the other side, the consumer (<code>entregas</code>) does not read the header and starts a trace with a new <code>trace_id</code>. The 1063 path <b>breaks in half</b>: a search for 9c1e5a7b shows the purchase and does not show the delivery, and the delivery trace becomes <b>orphan</b>.',
        look: 'The last bar (Kafka) turns red and the bottom line shows the orphan trace, with no parent.',
        key: 'A service that does not pass on the context cuts the trace in two.',
        f(o, t) { esteira(o, k => [k === 2 ? 'publishes to Kafka' : 'trace 9c1e5a7b', k === 2 && t > 1.6 ? 'bad' : 'acc']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.smp = 2;
          const lost = t > 1.6; if (lost) bad(o, 'tp'); else o.on.tp = 2;
          o.rows.cas = act('trace 9c1e5a7b…', lost ? 'BROKEN' : '1063'); o.rows.cas.cas = { slow: 1, n: 8, orphan: lost };
          o.rows.tp = act('entregas', 'CONSUMER', [lost ? 'no traceparent' : 'reads the header', lost ? 'bad' : 'acc'], [lost ? 'new trace_id' : '9c1e5a7b…', lost ? 'bad' : 'dim']);
          o.rows.smp = act('sampling', 'TAIL', ['slow: 8 of 8', 'acc'], ['5xx + > 800 ms', 'dim']);
          if (lost) T(o, [SVC(2), SVY + SVD + 14, ZT + 10], 'Kafka: no traceparent', 'bad');
          o.cnt = [['TRACES OF 1063', lost ? '2 (1 orphan)' : '1', lost ? 'bad' : 'acc'], ['LOST LINK', lost ? 'entregas' : '—', lost ? 'bad' : 'dim'], ['LINKED SPANS', '8', 'dim']];
          o.res = lost ? [['the path broke in half', 'bad']] : []; } },
    ],
    correlacao: [
      { id: 'que', dur: 7, title: 'What: the metric finds 8 slow orders', yk: '1 · THE METRIC',
        code: ['estoque_reservar_duracao_segundos', '  8 orders above 1 s', '  at 15:30', 'p99 of POST /pedidos: 0.765 s', 'that something changed, and how much; not which'],
        story: 'The investigation has three steps, from the cheapest signal to the most detailed. The first is the <b>metric</b>: the <code>estoque_reservar_duracao_segundos</code> histogram shows <b>8 orders above 1 s</b> at 15:30. It says <b>that</b> something changed and how much. It does not say <b>which</b> orders: the metric carries no <code>trace_id</code>.',
        look: 'The first board lights up: 8 orders above 1 s. The other two wait.',
        key: 'The metric says what.',
        f(o) { esteira(o); stream(o); show(o, 'q1', 'q2', 'q3'); lit(o, 'q1', 'est'); o.on.q2 = 0; o.on.q3 = 0;
          o.rows.q1 = act('1 · what', 'METRIC', ['estoque_reservar_', 'dim'], ['duracao_segundos', 'dim'], ['8 above 1 s', 'bad'], ['at 15:30', 'acc'], ['which? it does not say', 'dim']);
          o.rows.q2 = act('2 · where', 'TRACE', ['…', 'dim']); o.rows.q3 = act('3 · why', 'LOG', ['…', 'dim']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]] }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]] });
          o.cnt = [['ABOVE 1 S', '8', 'bad'], ['P99', '0.765 s', 'dim'], ['WHICH', '?', 'dim']];
          o.res = [['what: 8 slow in estoque', 'acc']]; } },
      { id: 'onde', dur: 8, title: 'Where: the 1063 trace points to estoque', yk: '2 · THE TRACE', act: ['Open a trace', 'the 9c1e5a7b'],
        code: ['trace 9c1e5a7b (Lena\'s code,', '  or one of the 8 kept by tail sampling)', 'total: 1,895 ms', 'estoque reservar: 1,640 ms', '86.5% of the time in estoque'],
        story: 'The second step is the <b>trace</b>. Lena\'s code (or any of the 8 that <i>tail sampling</i> kept) opens the 1063 waterfall: <b>1,895 ms</b>, of which <b>1,640</b> in <code>estoque reservar</code>, or <b>86.5%</b>. The trace says <b>where</b>. It does not say <b>why</b> yet: the <i>span</i> shows the wait, not who caused it.',
        look: 'The 1063 token stops at estoque; the second board lights up with 1,640 of 1,895.',
        key: 'The trace says where.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; lit(o, 'q2'); ficha(o, t, true);
          o.rows.q1 = act('1 · what', 'METRIC', ['8 above 1 s', 'bad'], ['at 15:30', 'dim']);
          o.rows.q2 = act('2 · where', 'TRACE', ['9c1e5a7b…', 'acc'], ['total 1,895 ms', 'dim'], ['estoque 1,640', 'bad'], ['= 86.5%', 'bad'], ['why? it does not say', 'dim']);
          o.rows.q3 = act('3 · why', 'LOG', ['…', 'dim']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]] });
          o.cnt = [['ESTOQUE', '1,640 ms', 'bad'], ['TOTAL', '1,895 ms', 'dim'], ['SHARE', '86.5%', 'dim']];
          o.res = [['where: estoque', 'acc']]; } },
      { id: 'porque', dur: 8, title: 'Why: the log names contagem-estoque', yk: '3 · THE LOG', act: ['Search the log', 'by trace_id'],
        code: ['trace_id=9c1e5a7b… servico=estoque', 'WARN espera por lock', 'sku=CANECA-007 lock_wait_ms=1620', 'holder=contagem-estoque', 'holder_pid=4412'],
        story: 'The third step is the <b>log</b>, searched by the same <code>trace_id</code> and by the estoque <code>span_id</code>. The WARN line says the order waited <b>1,620 ms</b> for the <code>CANECA-007</code> <i>lock</i> and that whoever held it was <b><code>contagem-estoque</code></b>. The log says <b>why</b>. Three signals, one key: the <code>trace_id</code>.',
        look: 'The third board lights up with the holder; the three are linked by the yellow cable.',
        key: 'The log says why.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2; lit(o, 'q3'); bad(o, 'est');
          o.rows.q1 = act('1 · what', 'METRIC', ['8 above 1 s', 'bad'], ['at 15:30', 'dim']);
          o.rows.q2 = act('2 · where', 'TRACE', ['estoque 1,640', 'bad'], ['= 86.5%', 'dim']);
          o.rows.q3 = act('3 · why', 'LOG', ['WARN estoque', 'bad'], ['lock_wait 1,620', 'dim'], ['CANECA-007', 'dim'], ['holder:', 'dim'], ['contagem-estoque', 'bad']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], on: 1 });
          o.cnt = [['HOLDER', 'contagem-estoque', 'bad'], ['LOCK_WAIT', '1,620 ms', 'dim'], ['KEY', 'trace_id', 'dim']];
          o.res = [['what → where → why', 'acc']]; } },
      { id: 'causa', dur: 8, title: 'The cause: a cron inside estoque', yk: 'THE EPISODE MATH',
        code: ['contagem-estoque: cron at :00 and :30', '1.6 s transaction with FOR UPDATE', '  on the CANECA-007 row', '5 orders/s × 1.6 s = 8 orders', 'fix: count by snapshot'],
        story: '<code>contagem-estoque</code> is a <i>cron</i> of the service itself, at :00 and :30. It opens a <b>1.6 s</b> transaction that locks the <code>CANECA-007</code> row, and in the "double mugs" campaign <b>every</b> order takes the mug: at 5 orders/s, <b>8 orders</b> wait for it. It is not <code>relatorios</code>, which reads from the Rio replica. The fix (out of scope) is counting by <i>snapshot</i> instead of <code>FOR UPDATE</code>.',
        look: 'The episode tokens stop together at estoque; the counter reaches 8.',
        key: '5 orders/s × 1.6 s of lock = the 8 slow ones.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2; lit(o, 'q3'); bad(o, 'est');
          const n = Math.min(8, Math.floor(lin(t, 0.5, 3.7, 0, 8.99)));
          for (let k = 0; k < n; k++) o.dots.push([[SVX(3) + 18 + (k % 4) * 38, SVY + 30 + Math.floor(k / 4) * 40, ZT], k === 0 ? '' : 'gray']);
          o.rows.q1 = act('1 · what', 'METRIC', ['8 above 1 s', 'bad'], ['at 15:30', 'dim']);
          o.rows.q2 = act('2 · where', 'TRACE', ['estoque 1,640', 'bad'], ['= 86.5%', 'dim']);
          o.rows.q3 = act('contagem-estoque', 'CRON', ['at :00 and :30', 'dim'], ['FOR UPDATE 1.6 s', 'bad'], ['5/s × 1.6 s = 8', 'acc'], ['fix: snapshot', 'acc']);
          o.rows.est = act('estoque', 'LOCK', ['CANECA-007', 'bad'], [`waiting: ${n}`, 'bad']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], on: 1 });
          o.cnt = [['WAITING FOR THE LOCK', String(n), n ? 'bad' : 'dim'], ['LOCK', '1.6 s', 'dim'], ['ORDERS/S', '5', 'dim']];
          o.res = n >= 8 ? [['5/s × 1.6 s = 8 orders', 'acc']] : []; } },
      { id: 'horario', dur: 9, title: 'And if it goes wrong: joining by timestamp', yk: 'CORRELATION BY TIME', act: ['Join', 'by timestamp'],
        code: ['search: 15:30:07 to 15:30:09', 'every line from every service', 'relatorios also runs at that time', '  (reads from the Rio replica)', 'wrong suspect; different clocks'],
        story: 'Without the <code>trace_id</code>, the temptation is to join the signals <b>by timestamp</b>: everything that happened between 15:30:07 and 15:30:09. In 2 s about 10 orders go by, the catalog and whatever else is running, and each service has its own clock. The obvious suspect is <code>relatorios</code>, which has nothing to do with it: it reads from the Rio replica. That is why you correlate by <b>id</b>, not by time (it is the point of Lamport\'s article on clocks).',
        look: 'The third board points to relatorios, in red; the cable between the trace and the log turns gray.',
        key: 'Correlate by id: the timestamp joins what merely happened at the same time.',
        f(o, t) { esteira(o); stream(o, 0.4); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2;
          const w = t > 1.6; if (w) bad(o, 'q3'); else o.on.q3 = 2;
          o.rows.q1 = act('1 · what', 'METRIC', ['8 above 1 s', 'bad'], ['at 15:30', 'dim']);
          o.rows.q2 = act('2 · where', 'TRACE', ['estoque 1,640', 'bad'], ['no trace_id in the log', 'dim']);
          o.rows.q3 = act('3 · why?', 'BY TIME', ['15:30:07 to :09', 'dim'], ['~10 orders', 'dim'], ['+ catalog, bff…', 'dim'], [w ? 'suspect: relatorios' : 'searching…', w ? 'bad' : 'dim'], w ? ['(it is on the replica)', 'dim'] : null);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], tone: w ? 'bad' : '' });
          o.cnt = [['LINES IN THE WINDOW', 'dozens', 'dim'], ['SUSPECT', w ? 'relatorios' : '…', w ? 'bad' : 'dim'], ['KEY', 'timestamp', 'bad']];
          o.res = w ? [['the timestamp accuses the wrong one', 'bad']] : []; } },
    ],
    alerta: [
      { id: 'incidente', dur: 9, title: '20:20:00: PSP-A fails for 90 s', yk: 'THE MODULE 21 INCIDENT',
        code: ['20:20:00 to 20:21:30 (90 s)', '30 orders/s, no breaker or fallback', '100% errors: 2,700 failures', 'rules evaluated every 15 s', 'burn rate of 100% errors: 1,000×'],
        story: 'Go back to the module 21 incident: from <b>20:20:00 to 20:21:30</b>, PSP-A fails. The store is at <b>30 orders/s</b> and, without the <i>breaker</i> and the <i>fallback</i>, <b>100%</b> of the orders error out: <b>2,700 failures</b>. Having the three signals is being able to see. But nobody watches a dashboard at 20:20. The question now is <b>when the system calls someone</b>, and with which rule.',
        look: 'pagamentos turns red; on the timeline, the red incident band grows up to 90 s and the clock runs.',
        key: 'An alert turns a known state into a call to a person.',
        f(o, t) { const cur = lin(t, 0.4, 6.4, 0, 90);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: error' : 'back', cur < 90 ? 'bad' : 'acc'] : ['30 orders/s', 'dim']); if (cur > 0 && cur < 90) bad(o, 'pag');
          stream(o, 0.3); show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.pg = 2; o.on.apm = 2;
          o.rows.tl = act('alert rules', 'EVALUATES EVERY 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: [] };
          o.rows.pg = act('who gets called', '', ['page: nobody yet', 'dim'], ['ticket: —', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['error: ' + (cur > 0 && cur < 90 ? '100%' : '0%'), cur > 0 && cur < 90 ? 'bad' : 'dim'], ['30 orders/s', 'dim']);
          o.cnt = [['FAILURES', thou(cur * 30), cur ? 'bad' : 'dim'], ['CLOCK', clk2(cur), 'dim'], ['ERROR', '100%', 'dim']];
          o.res = cur >= 90 ? [['2,700 failures in 90 s', 'bad']] : []; } },
      { id: 'janela', dur: 10, title: 'A and B: the for that arrives later', yk: 'for: 5m × for: 1m', act: ['Turn on A and B', 'error > 5%'],
        code: ['A: error > 5% for 5 min', '  the incident ends in 90 s: never', 'B: error > 5% for 1 min', '  fires 20:21:00–20:21:15', '  MTTD 60 to 75 s (evaluation every 15 s)'],
        story: 'Rule <b>A</b> asks for errors above 5% <b>for 5 minutes</b> (<code>for: 5m</code>). The incident lasts 90 s: it <b>never</b> fires. Rule <b>B</b> asks for 1 minute: the condition holds from 20:20:00, and since evaluation runs every 15 s, it fires between <b>20:21:00 and 20:21:15</b>, an MTTD of <b>60 to 75 s</b>. The <code>for</code> avoids an alarm for a spike of a few seconds, and charges for it in delay.',
        look: 'The A bar grows and disappears when the incident ends, without firing; the B one reaches 60 s and lights the diamond.',
        key: 'A 5 min for never sees a 90 s incident.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: error' : 'back', cur < 90 ? 'bad' : 'acc'] : ['30 orders/s', 'dim']); if (cur < 90) bad(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.apm = 2;
          o.rows.tl = act('alert rules', 'EVALUATES EVERY 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: ['A', 'B'] };
          const pg = cur >= 60; if (pg) lit(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('who gets called', '', [pg ? 'page: B, 20:21:00–15' : 'page: nobody yet', pg ? 'acc' : 'dim'], ['A: never', cur >= 90 ? 'bad' : 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['error: ' + (cur < 90 ? '100%' : '0%'), cur < 90 ? 'bad' : 'dim'], ['30 orders/s', 'dim']);
          o.cnt = [['MTTD OF B', cur >= 60 ? '60–75 s' : '…', cur >= 60 ? 'acc' : 'dim'], ['MTTD OF A', cur >= 90 ? 'never' : '…', cur >= 90 ? 'bad' : 'dim'], ['CLOCK', clk2(cur), 'dim']];
          o.res = cur >= 90 ? [['A never fires', 'bad'], ['B: 60 to 75 s', 'acc']] : []; } },
      { id: 'sonda', dur: 10, title: 'C and D: the probe and the burn rate', yk: 'PROBE × BURN RATE', act: ['Turn on C and D', 'probe and burn rate'],
        code: ['C: probe every 10 s, 3 failures in a row', '  20:20:30: MTTD 30 s', 'D: burn rate 14.4× (1 h and 5 min, SLO 99.9%)', '  14.4 × 0.001 × 3,600 = 51.84 s of errors', '  MTTD ~52 to 67 s'],
        story: 'Rule <b>C</b> is the <b>synthetic probe</b> from module 27: a test order every 10 s, which calls someone after 3 failures in a row: <b>20:20:30</b>, an MTTD of <b>30 s</b>. Rule <b>D</b> looks at the error budget: with a 99.9% SLO, 100% errors burn at <b>1,000×</b>; the 1 h window passes 14.4× after 14.4 × 0.001 × 3,600 = <b>51.84 s</b> of errors, and with evaluation every 15 s it fires between <b>~52 and 67 s</b>.',
        look: 'The three probe marks fall at 10, 20 and 30 s and the C diamond lights up; the D one lights up at 51.84 s.',
        key: 'The probe is the fastest; the burn rate ties the alert to the budget.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: error' : 'back', cur < 90 ? 'bad' : 'acc'] : ['30 orders/s', 'dim']); if (cur < 90) bad(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.apm = 2;
          o.rows.tl = act('alert rules', 'EVALUATES EVERY 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: ['A', 'B', 'C', 'D'] };
          if (cur >= 30) lit(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('who gets called', '', [cur >= 30 ? 'page: C, 20:20:30' : 'page: nobody yet', cur >= 30 ? 'acc' : 'dim'], [cur >= 51.84 ? 'D: ~52–67 s · B: 60–75 s' : '…', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['error: ' + (cur < 90 ? '100%' : '0%'), cur < 90 ? 'bad' : 'dim'], ['burn: 1,000×', cur < 90 ? 'bad' : 'dim']);
          o.cnt = [['MTTD OF C', cur >= 30 ? '30 s' : '…', 'acc'], ['MTTD OF D', cur >= 51.84 ? '~52 s' : '…', 'dim'], ['CLOCK', clk2(cur), 'dim']];
          o.res = cur >= 52 ? [['never · 60–75 · 30 · ~52 s', 'acc']] : []; } },
      { id: 'breaker', dur: 9, title: 'With the breaker: no page, and that is right', yk: 'SYMPTOM × CAUSE', act: ['Turn on the breaker', 'and the fallback'],
        code: ['breaker opens in 1.3 s: ~39 failures', '1.44% at that instant (14.4×)', '0.036% in 1 h (0.36×)', '0.43% in 5 min (4.3×)', 'breaker_state=aberto → ticket'],
        story: 'Now with the module 21 defenses: the <i>breaker</i> opens in <b>1.3 s</b> and the <i>fallback</i> takes orders to PSP-B. Only <b>~39</b> orders fail (30 × 1.3 s). At that instant it is 1.44%, but over 1 h it is <b>0.036%</b> (0.36×) and over 5 min, <b>0.43%</b> (4.3×). No page rule fires, and <b>it should not</b>: the customer did not feel it. <code>breaker_state{dependencia="psp-a"}=aberto</code> is the <b>cause</b> and becomes a <b>ticket</b>. The SRE book rule: page for a symptom, cause for debugging.',
        look: 'The red incident band gets thin (1.3 s); no diamond lights up; the card below shows the ticket.',
        key: 'Page for what the customer feels; the rest becomes a ticket.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'breaker open' : 'closed', cur < 90 ? 'acc' : 'dim'] : ['30 orders/s', 'dim']); if (cur < 90 && cur > 0) lit(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl', 'pg'); o.on.apm = 2;
          o.rows.tl = act('alert rules', 'WITH BREAKER'); o.rows.tl.tl = { cur, inc: 1.3, rules: ['A', 'B', 'C', 'D'], quiet: 1 };
          o.rows.pg = act('who gets called', '', ['page: nobody', 'acc'], [cur > 2 ? 'ticket: breaker_state=aberto' : 'ticket: —', cur > 2 ? 'acc' : 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['error in 1 h: 0.036%', 'dim'], ['PSP-B: fallback', 'acc']);
          o.cnt = [['FAILURES', String(Math.round(Math.min(cur, 1.3) * 30)), 'dim'], ['IN 1 H', '0.036%', 'dim'], ['PAGES', '0', 'acc']];
          o.res = cur > 2 ? [['cause → ticket, no page', 'acc']] : []; } },
      { id: 'apm', dur: 8, title: 'APM: the signals around the experience', yk: 'PER OPERATION, ROUTE AND VERSION',
        code: ['POST /pedidos: p99, error, calls/s', 'per dependency: estoque, PSP-A', 'per version: 2.6.0 after the deploy', 'the 1063: 8 in 1,500 (5 min) = 5.3×', '          0.044% in 1 h = 0.44×: nothing'],
        story: '<b>APM</b> organizes the same signals around the <b>experience</b>: per operation (<code>POST /pedidos</code>), per route, per dependency (<code>estoque</code>, PSP-A) and per version, to see a regression right after a deploy. And 1063? The 15:30 episode has <b>8 bad out of 1,500</b> in a 5 min window: 5.3×, below 14.4×, and <b>0.44×</b> over 1 h. No alert fires. Lena was found through her complaint; APM shows the <code>estoque</code> dependency with a long tail at :00 and :30.',
        look: 'The APM card lights up with the per-operation, dependency and version views; the 1063 burn rate stays below the line.',
        key: 'APM shows the user\'s path; not every episode becomes an alert.',
        f(o, t) { esteira(o, k => ['5 orders/s', 'dim']); stream(o); show(o, 'tl', 'pg', 'apm'); lit(o, 'apm'); o.on.tl = 2; o.on.pg = 2;
          o.rows.tl = act('alert rules', 'THE 1063 · 15:30'); o.rows.tl.tl = { cur: 0, inc: 0, rules: [], burn: 1 };
          o.rows.pg = act('the 1063', 'BURN RATE', ['5 min: 5.3× (< 14.4×)', 'dim'], ['1 h: 0.44× · nothing fires', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['estoque: tail at :00/:30', 'acc'], ['version 2.6.0 · PSP-A 180 ms', 'dim']);
          o.cnt = [['BURN 5 MIN', '5.3×'], ['BURN 1 H', '0.44×', 'dim'], ['ALERTS', '0', 'dim']];
          o.res = [['the 1063 wakes nobody', 'dim']]; } },
      { id: 'ruido', dur: 9, title: 'And if it goes wrong: the alert that wakes someone for a cause', yk: 'ALERT FATIGUE', act: ['Page on', 'the breaker'],
        code: ['rule: breaker_state=aberto → page', '03:00: PSP-A flickers, the breaker opens', 'fallback to PSP-B: the customer does not feel it', 'someone wakes up for nothing', 'after 10 nights: nobody looks'],
        story: 'The opposite breaks too. Someone makes <code>breaker_state=aberto</code> a <b>page</b>. At 3 a.m. PSP-A flickers, the <i>breaker</i> opens, the <i>fallback</i> works and the customer feels nothing, but someone wakes up. After a few nights like that, the team mutes the alert or stops looking, and the day the page matters goes by unnoticed. That is <b>alert fatigue</b>: a cause goes to a ticket and a dashboard.',
        look: 'The who-gets-called card turns red at 03:00, with the customer at 0% errors.',
        key: 'An alert for a cause becomes noise, and noise teaches people to ignore.',
        f(o, t) { esteira(o, k => k === 4 ? ['breaker open', 'acc'] : ['03:00', 'dim']); lit(o, 'pag'); show(o, 'tl', 'pg', 'apm'); o.on.tl = 2; o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'COM BREAKER'); o.rows.tl.tl = { cur: 120, inc: 1.3, rules: ['A', 'B', 'C', 'D'], quiet: 1 };
          const w = t > 1.4; if (w) bad(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('who gets called', '03:00', [w ? 'PAGE: breaker open' : 'page: nobody', w ? 'bad' : 'dim'], [w ? 'the customer: 0% errors' : '…', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['error: 0%', 'acc'], ['PSP-B: fallback', 'dim']);
          o.cnt = [['PAGES', w ? '1' : '0', w ? 'bad' : 'dim'], ['CUSTOMER ERROR', '0%', 'dim'], ['TIME', '03:00', 'dim']];
          o.res = w ? [['woke someone for nothing', 'bad']] : []; } },
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
  function fitFont(x, u, text, size, maxW, wt = 700) { let s = size; x.font = `${wt} ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `${wt} ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, papel à direita, na primeira linha
    const y = s1 > 15 ? 13 : s1 > 13 ? 11 : 10;
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  const EMPTY = () => theme === 'light' ? '#ececeb' : '#17181a', GRAF = () => theme === 'light' ? '#3f4448' : '#c9cdd0';
  const BADBG = () => theme === 'light' ? 'rgba(140,23,14,.14)' : 'rgba(255,90,74,.18)';
  // a cascata: barras de tempo próprio; as três primeiras com o contorno até o fim (esperam os filhos)
  function drawCascade(x, u, C, c, W_, H_) {
    const g = typeof c.slow === 'number' ? c.slow : c.slow ? 1 : 0, wait = 1620 * g, total = 275 + wait;
    const lx = 6, bx0 = 150, bx1 = W_ - 70, top = 34, rh = (H_ - top - 30) / 8, sx = v => bx0 + (bx1 - bx0) * v / total;
    if (c.ghost) x.globalAlpha = 0.55;
    SPANS.forEach(([nm, s0, d, par], i) => {
      if (i >= c.n) return;
      const est = i === 4, st = s0 + (s0 > 36 ? wait : 0), dur = est ? d + wait : d, Y = top + i * rh, bh = rh * 0.62, by = Y + (rh - bh) / 2;
      x.fillStyle = est && g > 0.3 ? BAD() : INK(); fitFont(x, u, nm, 13, bx0 - lx - 6); x.textAlign = 'left'; x.fillText(nm, u(lx), u(Y + rh / 2));
      if (par) { x.strokeStyle = C.line; x.lineWidth = u(0.7); x.strokeRect(u(sx(st)), u(by), u(sx(total) - sx(st)), u(bh)); }
      const xa = sx(st), wWork = Math.max(2, sx(st + (est ? d : dur)) - xa);
      x.fillStyle = c.orphan && i === 7 ? BAD() : accC(); x.fillRect(u(xa), u(by), u(wWork), u(bh));
      if (est && wait > 0) { const xw = xa + wWork, ww = sx(st + dur) - xw; x.fillStyle = BADBG(); x.fillRect(u(xw), u(by), u(ww), u(bh));
        x.strokeStyle = BAD(); x.lineWidth = u(1); x.strokeRect(u(xw), u(by), u(ww), u(bh));
        x.save(); x.beginPath(); x.rect(u(xw), u(by), u(ww), u(bh)); x.clip(); x.lineWidth = u(0.7);
        for (let k = xw - bh; k < xw + ww; k += 5) { x.beginPath(); x.moveTo(u(k), u(by + bh)); x.lineTo(u(k + bh), u(by)); x.stroke(); } x.restore();
        if (ww > 70) { x.fillStyle = BAD(); x.textAlign = 'center'; fitFont(x, u, 'lock wait 1,620', 12, ww - 8); x.fillText('lock wait 1,620', u(xw + ww / 2), u(by - 4.5)); } }
      const lab = thou(dur); x.textAlign = 'left'; x.fillStyle = est && g > 0.3 ? BAD() : toneC('hi'); fitFont(x, u, lab, 12.5, 64);
      const xe = sx(st + dur) + 4; x.fillText(lab, u(Math.min(xe, W_ - 64)), u(Y + rh / 2));
    });
    x.globalAlpha = 1;
    // eixo e total
    const ay = H_ - 18; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(bx0), u(ay - 8)); x.lineTo(u(bx1), u(ay - 8)); x.stroke();
    if (c.orphan) { x.fillStyle = BAD(); x.textAlign = 'left'; const s = 'entregas ← PedidoCriado: orphan trace, new trace_id'; fitFont(x, u, s, 13, W_ - 12); x.fillText(s, u(6), u(ay + 2)); }
    else { x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, '0 ms', 11, 60); x.fillText('0 ms', u(bx0), u(ay + 2));
      const s = `${thou(total)} ms` + (g >= 1 ? ' · estoque 86.5%' : ''); x.textAlign = 'right'; x.fillStyle = g > 0.3 ? BAD() : toneC('hi'); fitFont(x, u, s, 13, 300); x.fillText(s, u(bx1 + 64), u(ay + 2)); }
    if (c.ghost) { x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, 'head 1%: 7.7% chance of existing', 13, W_ - 40); x.fillText('head 1%: 7.7% chance of existing', u(W_ / 2), u(top + rh * 3.5)); }
    x.textAlign = 'left';
  }
  // o histograma: colunas (não acumuladas) e, embaixo, o limite e a contagem acumulada; à direita, os percentis
  function drawHist(x, u, C, h, W_, H_) {
    const n = h.le.length, ax0 = 6, ax1 = W_ * 0.66, top = 44, bot = H_ - 52, cw = (ax1 - ax0) / n, mx = 575;
    let cum = 0;
    h.cnt.forEach((c, i) => { const v = Math.round(c * h.f); cum += v; const X = ax0 + i * cw + 3, w = cw - 6, hh = v ? Math.max(3, (bot - top) * v / mx) : 0, hot = i === h.hot;
      x.fillStyle = EMPTY(); x.fillRect(u(X), u(top), u(w), u(bot - top));
      if (hh) { x.fillStyle = hot ? BAD() : accC(); x.fillRect(u(X), u(bot - hh), u(w), u(hh)); }
      if (v) { x.textAlign = 'center'; x.fillStyle = hot ? BAD() : toneC('hi'); fitFont(x, u, thou(v), 12, cw); x.fillText(thou(v), u(X + w / 2), u(bot - hh - 8)); }
      x.textAlign = 'center'; x.fillStyle = h.le[i] === '0.8' ? accC() : toneC('hi'); fitFont(x, u, h.le[i], 12.5, cw - 1); x.fillText(h.le[i], u(X + w / 2), u(bot + 11));
      x.fillStyle = INK(); fitFont(x, u, thou(cum), 11, cw - 1); x.fillText(thou(cum), u(X + w / 2), u(bot + 27)); });
    x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, 'le (s) and cumulative', 10.5, ax1 - ax0); x.fillText('le (s) and cumulative', u(ax0 + 2), u(bot + 42));
    const px = ax1 + 14; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(px - 7), u(top - 6)); x.lineTo(u(px - 7), u(bot + 30)); x.stroke();
    x.fillStyle = INK(); fitFont(x, u, 'PERCENTILES', 11, W_ - px - 6); x.fillText('PERCENTILES', u(px), u(top));
    h.pct.forEach(([l, v, tn], i) => { const Y = top + 24 + i * 38; x.fillStyle = INK(); fitFont(x, u, l, 12.5, 70); x.fillText(l, u(px), u(Y));
      x.fillStyle = toneC(tn); fitFont(x, u, v, 19, W_ - px - 8); x.fillText(v, u(px), u(Y + 17)); });
    if (!h.pct.length) { x.fillStyle = INK(); fitFont(x, u, 'SLO: p95 ≤ 0.8 s', 13, W_ - px - 6); x.fillText('SLO: p95 ≤ 0.8 s', u(px), u(top + 26)); }
  }
  // os logs: uma linha por evento; open = índice da linha aberta (campos extras embaixo); idx = destaca as colunas indexadas
  function drawLogs(x, u, C, l, W_, H_) {
    const COLS = [[6, 'time', 0], [66, 'level', 1], [124, 'service', 2], [226, 'trace_id', 3], [316, 'message', 4]];
    const nl = Math.min(l.lines.length, 14), top = 36, lh = nl > 9 ? 13.5 : nl > 5 ? 19 : 25, fz = nl > 9 ? 10.5 : nl > 5 ? 12 : 13.5; let y = top;
    COLS.forEach(([cx, nm, ci]) => { const ix = l.idx && (ci === 1 || ci === 2 || ci === 3); x.fillStyle = ix ? accC() : INK(); fitFont(x, u, ix ? nm + ' ▲' : nm, 11, 90); x.textAlign = 'left'; x.fillText(ix ? nm + ' ▲' : nm, u(cx), u(y)); });
    y += lh;
    l.lines.slice(0, Math.min(l.n, 14)).forEach((ln, i) => {
      const tn = ln[6];
      COLS.forEach(([cx, , ci]) => { const ix = l.idx && (ci === 1 || ci === 2 || ci === 3), dimmed = l.idx && !ix && ci !== 0;
        x.fillStyle = dimmed ? INK() : ix ? accC() : toneC(tn === 'dim' ? 'dim' : tn); fitFont(x, u, ln[ci], fz, ci === 4 ? W_ - cx - 6 : 96, ci === 4 ? 600 : 700); x.fillText(ln[ci], u(cx), u(y)); });
      y += lh;
      if (l.open === i) { x.fillStyle = BADBG(); x.fillRect(u(4), u(y - lh / 2), u(W_ - 8), u(lh * 2.2));
        x.fillStyle = BAD(); const a = 'sku=CANECA-007  lock_wait_ms=1620', b = 'holder=contagem-estoque  holder_pid=4412';
        fitFont(x, u, a, 13, W_ - 20); x.fillText(a, u(14), u(y + 1)); fitFont(x, u, b, 13, W_ - 20); x.fillText(b, u(14), u(y + lh)); y += lh * 2.2; }
    });
    if (l.idx) { x.fillStyle = accC(); const s = '▲ indexed: trace_id · pedido_id · celula · servico · versao · level'; fitFont(x, u, s, 12, W_ - 12); x.fillText(s, u(6), u(H_ - 14)); }
  }
  // a linha do tempo dos alertas: 0 a 120 s a partir de 20:20:00
  function drawTimeline(x, u, C, a, W_, H_) {
    const lx = 6, ax0 = 236, ax1 = W_ - 130, top = 40, rh = 24, T1 = 120, sx = s => ax0 + (ax1 - ax0) * clamp(s / T1);
    if (a.burn) { // o 1063: o burn rate de 5 min e o de 1 h contra a linha de 14,4×
      const bars = [['5 min', 5.3], ['1 h', 0.44]], bx = 120, bw = W_ - bx - 120, mx = 16;
      bars.forEach(([l, v], i) => { const Y = top + 8 + i * 30; x.fillStyle = toneC('hi'); fitFont(x, u, 'burn ' + l, 14, 110); x.textAlign = 'left'; x.fillText('burn ' + l, u(lx), u(Y + 7));
        x.fillStyle = EMPTY(); x.fillRect(u(bx), u(Y), u(bw), u(14)); x.fillStyle = accC(); x.fillRect(u(bx), u(Y), u(bw * v / mx), u(14));
        x.fillStyle = toneC('hi'); fitFont(x, u, dec(v, v < 1 ? 2 : 1) + '×', 14, 100); x.fillText(dec(v, v < 1 ? 2 : 1) + '×', u(bx + bw + 8), u(Y + 7)); });
      const lxx = bx + bw * 14.4 / mx; x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.setLineDash([u(3), u(2)]); x.beginPath(); x.moveTo(u(lxx), u(top)); x.lineTo(u(lxx), u(top + 64)); x.stroke(); x.setLineDash([]);
      x.fillStyle = BAD(); x.textAlign = 'center'; fitFont(x, u, 'page: 14.4×', 13, 140); x.fillText('page: 14.4×', u(lxx), u(top + 76)); x.textAlign = 'left'; return; }
    // o incidente (faixa vermelha) e o cursor
    x.fillStyle = BADBG(); const ie = Math.min(a.inc, a.cur); if (ie > 0) x.fillRect(u(sx(0)), u(top - 8), u(Math.max(1.5, sx(ie) - sx(0))), u(rh * 4 + 6));
    [0, 30, 60, 90, 120].forEach(s => { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(sx(s)), u(top - 8)); x.lineTo(u(sx(s)), u(top + rh * 4)); x.stroke();
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, clk2(s), 11.5, 80); x.fillText(clk2(s), u(sx(s)), u(top + rh * 4 + 9)); });
    ['A', 'B', 'C', 'D'].forEach((id, i) => { const R = RULES[id], on = a.rules.includes(id), Y = top + i * rh + rh / 2 - 4;
      x.textAlign = 'left'; x.fillStyle = on ? toneC('hi') : INK(); fitFont(x, u, R.lab, 13, ax0 - lx - 8); x.fillText(R.lab, u(lx), u(Y));
      if (!on) return;
      if (a.quiet) { x.fillStyle = accC(); fitFont(x, u, 'does not fire', 13, 120); x.fillText('does not fire', u(ax1 + 8), u(Y)); return; }
      if (R.pend) { const e = Math.min(a.cur, R.pend[1], a.inc); if (e > 0) { x.fillStyle = accC(); x.globalAlpha = 0.45; x.fillRect(u(sx(R.pend[0])), u(Y - 4), u(sx(e) - sx(R.pend[0])), u(8)); x.globalAlpha = 1; } }
      if (R.probes) R.probes.forEach(s => { if (a.cur >= s) { x.fillStyle = BAD(); x.fillRect(u(sx(s) - 2.5), u(Y - 5), u(5), u(10)); } });
      const fired = R.fire != null && a.cur >= R.fire;
      if (fired) { const X = sx(R.fire); x.fillStyle = accC(); x.beginPath(); x.moveTo(u(X), u(Y - 9)); x.lineTo(u(X + 8), u(Y)); x.lineTo(u(X), u(Y + 9)); x.lineTo(u(X - 8), u(Y)); x.closePath(); x.fill(); }
      const done = fired || (R.fire == null && a.cur >= a.inc);
      x.fillStyle = R.fire == null ? BAD() : accC(); fitFont(x, u, done ? R.txt : '…', 13, 120); x.fillText(done ? R.txt : '…', u(ax1 + 8), u(Y)); });
    if (a.cur > 0 && a.cur < T1) { const X = sx(a.cur); x.strokeStyle = toneC('hi'); x.lineWidth = u(1); x.beginPath(); x.moveTo(u(X), u(top - 10)); x.lineTo(u(X), u(top + rh * 4)); x.stroke(); }
    x.textAlign = 'left';
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : cf.s1 > 13 ? 21 : 19;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.cas) drawCascade(x, u, C, d.cas, W_, H_);
    if (d.hist) drawHist(x, u, C, d.hist, W_, H_);
    if (d.logs) drawLogs(x, u, C, d.logs, W_, H_);
    if (d.tl) drawTimeline(x, u, C, d.tl, W_, H_);
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab, tone) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    const b = tone === 'bad', a = tone === 'acc';
    x.fillStyle = b ? (light ? '#f4e4e2' : '#24130f') : a ? (light ? '#f6ece2' : '#2a1d12') : pal3().recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    const col = b ? BAD() : a ? accC() : light ? GRAF() : pal3().inkHi;
    x.strokeStyle = b ? BAD() : a ? accC() : pal3().line; x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = col; const [l1, l2] = lab.split('\n');
    fitFont(x, u, l1, 12, W_ - 4); x.fillText(l1, u(W_ / 2), u(H_ / 2 - 9)); if (l2) { fitFont(x, u, l2, 12, W_ - 4); x.fillText(l2, u(W_ / 2), u(H_ / 2 + 9)); }
    x.textAlign = 'left'; cv.tex.needsUpdate = true; }
  function placeMarks(list) {
    list.forEach((m, i) => { if (i >= CARDS.length) return; const Cd = CARDS[i]; Cd.g.visible = true; Cd.g.position.copy(W(...m.p));
      const key = m.lab + m.tone + theme + accent.getHex(); if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, m.lab, m.tone); }
      Cd.mat.emissive.copy(m.tone === 'bad' ? badEm : accent); Cd.mat.emissiveIntensity = m.tone === 'gray' ? 0 : 0.25;
      moveGlow(Cd.glow, [m.p[0] + KW / 2, m.p[1] + KD / 2, m.p[2] + KH + 2], m.tone === 'bad' ? 0.35 : 0); });
    for (let i = list.length; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
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
  const on_ = (c) => c ? ' class="on"' : '';
  const SPANTAB = () => `<table class="h3-sum"><tr><th>span</th><th>start</th><th>normal</th><th>1063</th></tr>${SPANS.map(([nm, s0, d], i) =>
    `<tr${on_(i === 4 && sc === 'traces' && step >= 1)}><td>${nm.replace('↳ ', '')}</td><td>${s0 > 36 ? thou(s0) + ' → ' + thou(s0 + 1620) : s0}</td><td>${d}</td><td>${i === 4 ? '<b>1,640</b>' : d}</td></tr>`).join('')}<tr><td>total</td><td></td><td>275</td><td><b>1,895</b></td></tr></table>`;
  const DATA = {
    pilares: () => `<li>Order <b>1063</b>: Lena (<code>lena-77</code>, <code>celula-recife</code>), Thursday 12/03/2026 15:30:07.412; 3 blue mugs 59.70 + shipping 15.00 = <b>74.70</b>; mug 29 → 26</li><li><code>trace_id</code> <code>9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52</code> (support code <code>9c1e5a7b</code>); the one from 1047 (module 6): <code>7f3a9c0e5b2d4186a9e3c7d1f0b84e26</code></li><li>1.9 s (1,895 ms) against ~0.3 s (275 ms) normal; the dashboard: <code>5xx</code> 0%, p95 0.489 s ≤ 0.8 s</li><li>OpenTelemetry talks about <b>signals</b> (traces, metrics, logs and <i>baggage</i>); "three pillars" is the article\'s wording</li><li>Observability is a property, not a tool: without the <code>trace_id</code> on everything, there is no correlation</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>le (s)</th><th>cumulative</th></tr>${HIST.le.map((l, i) => `<tr${on_(i === 6)}><td>${l}</td><td>${thou(HIST.cnt.slice(0, i + 1).reduce((a, b) => a + b, 0))}</td></tr>`).join('')}</table><li>p50 <b>0.293</b> · p95 <b>0.489</b> · p99 <b>0.765</b> · p99.9 <b>2.3125</b> s (the real one ~1.9); with <code>le=2</code>: <b>1.875</b> s (our math)</li><li>Percentiles cannot be added or averaged: the "average of the p99s" from module 14 gave 269 ms against a true p99 of 2,000 ms</li><li>Cardinality: 7 × 12 × 6 × 4 = <b>2,016</b>; × 11 = <b>22,176</b>; × 1.5 M of <code>cliente_id</code> = <b>33.3 billion</b></li><li>Business metric: <code>pedidos_frete_zero_total{cidade="recife"}</code> (the one that found the module 22 shipping)</li><li>The 1,000-request window is defined in the brief, not measured on a Prometheus</li>`,
    logs: () => `<li><code>{"ts":"2026-12-03T15:30:09.068-03:00","level":"WARN","servico":"estoque","celula":"recife","versao":"2.6.0","trace_id":"9c1e5a7b…","span_id":"6d1f0a2b9e3c4a58","msg":"espera por lock","sku":"CANECA-007","lock_wait_ms":1620,"holder":"contagem-estoque","holder_pid":4412}</code></li><li>The 5 lines of 1063: <code>gw-loja</code> (2), <code>pedidos</code> (2), <code>estoque</code> (1). The times 07.436, 09.304 and 09.307 come from the span table; the lines of other orders are illustrative</li><li>Volume: 5 services × ~3 lines × ~300 B = <b>4.5 KB</b> per order; normal day <b>2.81 GB/day</b>; peak all day <b>25.5 GB/day</b> (765 GB in 30 days); with DEBUG <b>255 GB/day</b></li><li>Levels from the article: TRACE, DEBUG, INFO, WARN, ERROR, FATAL</li>`,
    traces: () => `${SPANTAB()}<li><code>traceparent: 00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52-a3c4d5e6f7a8b9c0-01</code> (W3C Trace Context)</li><li>12 spans × ~400 B = <b>4.8 KB</b>; at 30 orders/s: 100% = <b>12.4 GB/day</b>, 1% = <b>124 MB/day</b></li><li>Head 1%: 1 − 0.99⁸ = <b>7.7%</b>; tail (every <code>5xx</code>, everything &gt; 800 ms, 1% of the rest): all <b>8</b></li><li>The span durations are an example from the brief; no OpenTelemetry was run</li>`,
    correlacao: () => `<table class="h3-sum"><tr><th>signal</th><th>answers</th><th>in 1063</th></tr><tr${on_(step === 0)}><td>metric</td><td>what</td><td>8 orders &gt; 1 s</td></tr><tr${on_(step === 1)}><td>trace</td><td>where</td><td>estoque, 86.5%</td></tr><tr${on_(step >= 2 && step <= 3)}><td>log</td><td>why</td><td>holder contagem-estoque</td></tr></table><li><code>contagem-estoque</code>: cron at :00 and :30, 1.6 s transaction with <code>FOR UPDATE</code> on <code>CANECA-007</code>; 5/s × 1.6 s = <b>8</b> orders</li><li>It is not <code>relatorios</code>: it reads from the Rio replica (module 25). Fix (out of scope): count by <i>snapshot</i></li><li>Lamport, <i>Time, Clocks, and the Ordering of Events</i>: clocks on different machines do not order events; the id does</li>`,
    alerta: () => `<table class="h3-sum"><tr><th>rule</th><th>fires</th><th>MTTD</th></tr><tr${on_(step === 1)}><td>A: &gt; 5% for 5 min</td><td>never</td><td>∞</td></tr><tr${on_(step === 1)}><td>B: &gt; 5% for 1 min</td><td>20:21:00–15</td><td>60–75 s</td></tr><tr${on_(step === 2)}><td>C: probe 10 s × 3</td><td>20:20:30</td><td>30 s</td></tr><tr${on_(step === 2)}><td>D: burn 14.4× (1 h and 5 min)</td><td>51.84 s of errors</td><td>~52–67 s</td></tr></table><li>Without defenses: 30/s × 90 s = <b>2,700</b> failures; burn of 100% errors = 1 ÷ 0.001 = <b>1,000×</b></li><li>With the breaker (opens in 1.3 s): ~<b>39</b> failures; 1.44% (14.4×) at that instant, 0.036% (0.36×) over 1 h, 0.43% (4.3×) over 5 min</li><li>The 1063: 8 in 1,500 in 5 min = 0.53% = <b>5.3×</b>; 0.044% over 1 h = <b>0.44×</b></li><li>SRE book: page for a symptom, cause for debugging</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte e leva até ele
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
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
      <div class="i3-sql"><b>${esc(s.yk || 'THE MATH')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'sinais') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'sinais' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-sinais3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'sinais') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const ease1 = (v, want, dt, sp) => v + Math.sign(want - v) * Math.min(Math.abs(want - v), dt / sp);
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f = ease1(Bk.f, want, dt, 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], Bk.pos[2] - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, Bk.pos[2] + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placeMarks(o.marks); drawScreen(o);
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
      const span = x1 - x0 + y1 - y0, D = (POSTER ? 0.9 : nar ? 1 : 0.88) * Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
