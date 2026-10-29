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
FIGS3D.push({ id: 'sinais', name: 'Sinais', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const clk2 = s => { const v = Math.floor(s), m = 20 + Math.floor(v / 60); return `20:${m}:${String(v % 60).padStart(2, '0')}`; };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['pilares', 'metricas', 'logs', 'traces', 'alerta', 'correlacao'];
  const SCNAME = { pilares: 'Pilares', metricas: 'Métricas', logs: 'Logs', traces: 'Traces', alerta: 'Alerta', correlacao: 'Correlação' };
  const SCFULL = { pilares: 'Os três sinais do 1063', metricas: 'Métricas: o histograma', logs: 'Logs: o diário do pedido',
    traces: 'Traces: a cascata', correlacao: 'Que, onde e por quê', alerta: 'Alertas: os 90 s do PSP-A' };
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
    o.dots.push([r.p, tone]); T(o, [r.p[0], r.p[1], r.p[2] + 20], r.wait ? lab + ' · esperando lock' : lab, tone === 'bad' ? 'bad' : 'acc');
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
  const SVROLE = ['raiz · JWT', 'app', 'validar', 'reservar', 'PSP-A'];
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
  const SPANMS = ['4 ms', '6 ms', '14 ms', '1.640', '210 ms'];

  // ── dados: a cascata, o histograma, os logs, os alertas ──
  // [nome, início normal, duração normal, envolve os filhos até o fim]
  const SPANS = [['POST /pedidos', 0, 4, 1], ['bff-app', 4, 6, 1], ['pedidos', 10, 14, 1], ['↳ carrinho', 24, 12, 0],
    ['↳ estoque', 36, 20, 0], ['↳ pagamentos', 56, 210, 0], ['↳ INSERT', 266, 6, 0], ['↳ Kafka', 272, 3, 0]];
  const HIST = { le: ['0,05', '0,1', '0,25', '0,5', '0,8', '1', '2,5', '5', '+Inf'], cnt: [0, 0, 400, 575, 17, 0, 8, 0, 0], hot: 6 };
  const HIST2 = { le: ['0,05', '0,1', '0,25', '0,5', '0,8', '1', '2', '2,5', '5', '+Inf'], cnt: [0, 0, 400, 575, 17, 0, 8, 0, 0, 0], hot: 6 };
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
    A: { lab: 'A · erro > 5% por 5 min', pend: [0, 90], fire: null, txt: 'nunca' },
    B: { lab: 'B · erro > 5% por 1 min', pend: [0, 60], fire: 60, txt: '60–75 s' },
    C: { lab: 'C · sonda 10 s × 3', probes: [10, 20, 30], fire: 30, txt: '30 s' },
    D: { lab: 'D · burn rate 14,4×', pend: [0, 51.84], fire: 51.84, txt: '~52–67 s' } };

  // ── o que se vê em cada passo ──
  const STEPS = {
    pilares: [
      { id: 'verde', dur: 6, title: 'Quinta, 15:30: o painel está verde', yk: 'O PAINEL DE POST /pedidos',
        code: ['5 pedidos/s, dia comum', 'média ~0,3 s', '5xx: 0%', 'p95: 0,489 s  (SLO: ≤ 0,8 s)', 'tudo dentro: verde'],
        story: 'Quinta-feira, 03/12/2026, 15:30. A newsletter anuncia "caneca em dobro" e os pedidos chegam a <b>5 por segundo</b>, um dia comum. O painel de <code>POST /pedidos</code> mostra média de ~0,3 s, <b>0%</b> de <code>5xx</code> e p95 de <b>0,489 s</b>, dentro do SLO de 0,8 s. Tudo verde.',
        look: 'As cinco caixas da <code>celula-recife</code> em fila; as fichas cinza são os pedidos comuns. O painel, na frente à esquerda, só tem marcas de OK.',
        key: 'O painel responde às perguntas que alguém já fez.',
        f(o) { esteira(o); stream(o); show(o, 'pnl'); lit(o, 'pnl'); o.on.pnl = 2;
          o.rows.pnl = act('painel', 'POST /pedidos', ['média  ~0,3 s   OK', 'acc'], ['5xx    0%       OK', 'acc'], ['p95    0,489 s  OK', 'acc'], ['SLO p95 ≤ 0,8 s', 'dim'], ['5 pedidos/s', 'dim'], ['tudo verde', 'acc']);
          o.cnt = [['P95', '0,489 s'], ['5XX', '0%', 'dim'], ['PAINEL', 'verde', 'dim']];
          o.res = [['nenhum alerta', 'acc']]; } },
      { id: 'lena', dur: 9, title: 'A Lena espera 1,9 s pelo pedido 1063', yk: 'PEDIDO 1063 · 15:30:07.412', act: ['Mandar o 1063', 'a ficha da Lena'],
        code: ['3 canecas azuis: 59,70', 'frete Recife: 15,00', 'total: 74,70', 'confirmado em 1,9 s (normal ~0,3 s)', 'código de suporte: 9c1e5a7b'],
        story: 'A Lena, de Recife, compra <b>3 canecas azuis</b> (59,70 + frete 15,00 = <b>74,70</b>). O app confirma o pedido <b>1063</b> depois de <b>1,9 s</b>, quando o normal é ~0,3 s. Ela reclama no chat e manda o código de suporte que o app mostra: <code>9c1e5a7b</code>, os 8 primeiros hexadecimais do <code>trace_id</code>. O painel continua verde.',
        look: 'A ficha amarela é o 1063. Ela para muito tempo no <code>estoque</code>, que fica vermelho, e só depois segue. O painel não muda.',
        key: 'O painel está verde e a Lena esperou 1,9 s.',
        f(o, t) { esteira(o); stream(o, 1.1); show(o, 'pnl', 'lena'); o.on.pnl = 2;
          o.rows.pnl = act('painel', 'POST /pedidos', ['média  ~0,3 s   OK', 'acc'], ['5xx    0%       OK', 'acc'], ['p95    0,489 s  OK', 'acc'], ['SLO p95 ≤ 0,8 s', 'dim'], ['nada mudou', 'dim']);
          const r = ficha(o, t, true), done = t > RIDE_END(true);
          o.rows.lena = act('chat · Lena', 'lena-77', ['pedido 1063 · 74,70', 'dim'], [done ? 'confirmado em 1,9 s' : 'esperando…', done ? 'bad' : 'acc'], done ? ['"por que demorou?"', 'hi'] : null, done ? ['código 9c1e5a7b', 'acc'] : null);
          if (done) lit(o, 'lena'); else o.on.lena = 2;
          const ms = Math.round(lin(t, 0.4, RIDE_END(true), 0, 1895));
          o.cnt = [['A LENA ESPEROU', done ? '1,9 s' : dec(ms / 1000, 1) + ' s', done ? 'bad' : 'acc'], ['NORMAL', '~0,3 s', 'dim'], ['PAINEL', 'verde', 'dim']];
          o.res = done ? [['verde no painel, 1,9 s na Lena', 'bad']] : []; } },
      { id: 'marcas', dur: 8, title: 'Cada caixa deixa três marcas', yk: 'OS TRÊS SINAIS DO 1063', act: ['Soltar as marcas', 'log, métrica, span'],
        code: ['log:     5 linhas com o trace_id', 'métrica: +1 no contador, +1 num bucket', 'span:    8 da tabela (12 com os internos)', 'trace_id: 9c1e5a7b3d8f4a2e…', 'métrica não leva trace_id'],
        story: 'Por onde o 1063 passa, cada caixa deixa <b>três marcas</b>. Um <b>log</b> (uma linha JSON com o <code>trace_id</code>), uma <b>métrica</b> (o contador sobe 1, o histograma ganha 1 num <i>bucket</i>) e um <b><i>span</i></b> (o pedaço do caminho com início e duração). O artigo chama isso de três pilares; a OpenTelemetry chama de <b>sinais</b>. O log e o <i>span</i> levam o <code>trace_id</code>; a métrica, não, porque ela agrega todos os pedidos.',
        look: 'Os cartões caem na frente de cada caixa: log e span com o código 9c1e5a7b, métrica com +1. O span do estoque diz 1.640.',
        key: 'Um pedido deixa log, métrica e span; o trace_id liga dois deles.',
        f(o, t) { esteira(o); show(o, 'lena', 'sig'); lit(o, 'sig'); o.on.lena = 2;
          o.rows.lena = act('chat · Lena', 'lena-77', ['pedido 1063 · 74,70', 'dim'], ['confirmado em 1,9 s', 'bad'], ['código 9c1e5a7b', 'acc']);
          const f = lin(t, 0.6, 3.2, 0, 1);
          marks(o, f, (k, kd) => kd === 'l' ? 'log\nid ✓' : kd === 'm' ? 'métrica\n+1' : 'span\n' + SPANMS[k], (k, kd) => k === 3 && kd === 's' ? 'bad' : kd === 'm' ? 'gray' : 'acc');
          o.rows.sig = act('sinais do 1063', 'trace_id', ['log      5 linhas', 'acc'], ['métrica  +1 (sem id)', 'dim'], ['span     8 (12)', 'acc'], ['id: 9c1e5a7b…', 'acc'], ['correlação: o id', 'dim']);
          o.cnt = [['MARCAS', String(Math.round(f * 15)) + ' de 15'], ['LOGS DO 1063', '5', 'dim'], ['SPANS', '8 (12)', 'dim']];
          o.res = f >= 1 ? [['três sinais, um trace_id', 'acc']] : []; } },
      { id: 'pergunta', dur: 8, title: 'Pergunta conhecida × pergunta nova', yk: 'MONITORAMENTO × OBSERVABILIDADE', act: ['Fazer a pergunta', 'da Lena'],
        code: ['conhecida: erro > 5%?  → não', 'conhecida: p95 > 0,8 s? → não', 'nova: por que o 9c1e5a7b', '  levou 1,9 s?', 'ciclo: alerta → métrica → trace → log'],
        story: 'O <b>monitoramento</b> responde a perguntas que alguém já fez: "o erro passou de 5%?", "o p95 passou de 0,8 s?". As duas dão <b>não</b>. A Lena traz uma pergunta <b>nova</b>: por que <b>este</b> pedido levou 1,9 s? A <b>observabilidade</b> é a propriedade de conseguir responder sem mudar o código, juntando as marcas pelo <code>trace_id</code>. A ideia vem da teoria de controle (Kalman, anos 1960): inferir o estado interno pelas saídas. O que ela achar vira, depois, um alerta novo.',
        look: 'O painel responde "não" às duas perguntas dele; à direita, a pergunta da Lena acende as marcas com o código 9c1e5a7b.',
        key: 'Monitorar é perguntar o conhecido; observar é poder perguntar o novo.',
        f(o, t) { esteira(o); show(o, 'pnl', 'lena', 'sig'); o.on.pnl = 2;
          o.rows.pnl = act('monitoramento', 'CONHECIDAS', ['erro > 5%?', 'dim'], ['  não', 'acc'], ['p95 > 0,8 s?', 'dim'], ['  não', 'acc'], ['nada a dizer', 'dim']);
          o.rows.lena = act('chat · Lena', 'lena-77', ['confirmado em 1,9 s', 'bad'], ['"por que demorou?"', 'hi'], ['código 9c1e5a7b', 'acc']); lit(o, 'lena');
          const q = t > 2.2; if (q) lit(o, 'sig');
          o.rows.sig = act('observabilidade', 'NOVA', ['por que o', 'dim'], ['9c1e5a7b levou', 'dim'], ['1,9 s?', 'acc'], [q ? 'filtre pelo trace_id' : '…', q ? 'acc' : 'dim']);
          marks(o, 1, (k, kd) => kd === 'l' ? 'log\nid ✓' : kd === 'm' ? 'métrica\n+1' : 'span\n' + SPANMS[k], (k, kd) => kd === 'm' ? 'gray' : q ? (k === 3 && kd === 's' ? 'bad' : 'acc') : 'gray');
          o.cnt = [['PERGUNTAS DO PAINEL', '2 × não'], ['PERGUNTA NOVA', '1', 'dim'], ['CHAVE', '9c1e5a7b', 'dim']];
          o.res = q ? [['o id junta as marcas', 'acc']] : []; } },
      { id: 'semid', dur: 8, title: 'E se der errado: marcas sem trace_id', yk: 'FERRAMENTA CARA, NENHUMA RESPOSTA', act: ['Tirar o trace_id', 'dos logs'],
        code: ['logs sem trace_id', 'métricas sem o rótulo celula', 'traces que partem no Kafka', '50 painéis e nenhum id', 'a pergunta da Lena: sem resposta'],
        story: 'Agora a mesma loja, com os mesmos três sinais, mas os logs saíram <b>sem <code>trace_id</code></b>, as métricas sem o rótulo <code>celula</code> e os traces partem no Kafka. Há marcas de sobra e nenhuma liga com a outra. Para achar o 1063 é preciso cruzar horários de cinco serviços na mão. Ter os três sinais não é ter observabilidade; falta a <b>correlação</b>.',
        look: 'Os cartões de log ficam vermelhos e sem código; a pergunta da Lena fica sem resposta.',
        key: 'Sem o id em comum, três sinais são três pilhas soltas.',
        f(o, t) { esteira(o); show(o, 'pnl', 'lena', 'sig'); o.on.pnl = 2;
          o.rows.pnl = act('painel', '50 PAINÉIS', ['erro 0%', 'dim'], ['p95 0,489 s', 'dim'], ['sem celula', 'bad'], ['tudo verde', 'dim']);
          o.rows.lena = act('chat · Lena', 'lena-77', ['confirmado em 1,9 s', 'bad'], ['"por que demorou?"', 'hi'], ['código 9c1e5a7b', 'acc']); o.on.lena = 2;
          const off = t > 1.2; if (off) bad(o, 'sig'); else o.on.sig = 2;
          o.rows.sig = act('observabilidade', off ? 'SEM ID' : 'NOVA', ['por que o', 'dim'], ['9c1e5a7b levou', 'dim'], ['1,9 s?', 'dim'], [off ? 'nenhuma linha com o id' : '…', off ? 'bad' : 'dim']);
          marks(o, 1, (k, kd) => kd === 'l' ? (off ? 'log\nsem id' : 'log\nid ✓') : kd === 'm' ? 'métrica\n+1' : 'span\n' + (k >= 2 && off ? 'partido' : SPANMS[k]),
            (k, kd) => kd === 'm' ? 'gray' : off && (kd === 'l' || k >= 2) ? 'bad' : 'gray');
          o.cnt = [['LOGS COM O ID', off ? '0 de 5' : '5 de 5', off ? 'bad' : 'acc'], ['PAINÉIS', '50', 'dim'], ['RESPOSTA', off ? 'nenhuma' : '…', off ? 'bad' : 'dim']];
          o.res = off ? [['marcas soltas: nada se liga', 'bad']] : []; } },
    ],
    metricas: [
      { id: 'tipos', dur: 7, title: 'Três tipos de métrica', yk: 'CONTADOR · GAUGE · HISTOGRAMA',
        code: ['contador:   http_server_requests_total', '  só sobe; rate() = 5/s', 'gauge:      db_pool_connections_in_use', '  sobe e desce', 'histograma: ..._duration_seconds'],
        story: 'A métrica é o sinal <b>mais barato e mais agregado</b>: um número por série a cada coleta, para todos os pedidos juntos. Há três tipos. O <b>contador</b> só sobe (ou zera no reinício) e se lê com <code>rate()</code>: 5 pedidos/s. O <b><i>gauge</i></b> sobe e desce, como as conexões em uso ou o <code>replication_lag_seconds</code>. O <b>histograma</b> conta quantas requisições caíram em cada faixa de duração. O artigo põe "tempo de resposta" como <i>gauge</i>; o certo é histograma, porque o último valor perde a distribuição.',
        look: 'As fichas passam pela esteira; o cartão à direita mostra os três tipos. O histograma da frente ainda está vazio.',
        key: 'Tempo de resposta é histograma, não gauge.',
        f(o) { esteira(o, k => ['5/s', 'dim']); stream(o, 0.5); show(o, 'hist', 'typ', 'card'); lit(o, 'typ'); o.on.card = 2;
          o.rows.typ = act('tipos', '', ['contador   ↑ rate() 5/s', 'acc'], ['gauge      ↕ pool, lag', 'acc'], ['histograma ▮ buckets', 'acc'], ['tempo: histograma', 'dim']);
          o.rows.card = act('rótulos', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f: 0, pct: [] };
          o.cnt = [['PEDIDOS/S', '5'], ['TIPOS', '3', 'dim'], ['NO HISTOGRAMA', '0', 'dim']];
          o.res = [['métrica: o mais barato', 'acc']]; } },
      { id: 'baldes', dur: 9, title: '1.000 requisições caem nos buckets', yk: 'BUCKETS ACUMULADOS (le)', act: ['Encher o histograma', '1.000 requisições'],
        code: ['janela: 1.000 req (200 s a 5/s)', 'le=0,25 → 400   le=0,5 → 975', 'le=0,8  → 992   le=1   → 992', 'le=2,5  → 1.000 (_count)', 'os 8 lentos: entre 1 e 2,5 s'],
        story: 'Numa janela de <b>1.000 requisições</b> (200 s a 5/s), cada uma cai no <i>bucket</i> da sua duração. O Prometheus guarda as contagens <b>acumuladas</b>: <code>le=0,25</code> → 400, <code>le=0,5</code> → 975, <code>le=0,8</code> → 992 (o 0,8 é o limite do SLO), <code>le=1</code> → 992, <code>le=2,5</code> → 1.000. Os <b>8</b> pedidos do episódio das 15:30, entre eles o 1063, caem todos entre 1 e 2,5 s.',
        look: 'As colunas sobem; embaixo de cada uma, o limite (<code>le</code>) e a contagem acumulada. A coluna vermelha baixinha são os 8 lentos.',
        key: 'O histograma guarda quantos caíram em cada faixa, não cada duração.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); stream(o, 0.5); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          const f = lin(t, 0.5, 6, 0, 1);
          o.rows.typ = act('tipos', '', ['contador   ↑', 'dim'], ['gauge      ↕', 'dim'], ['histograma ▮', 'acc']);
          o.rows.card = act('rótulos', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f, pct: [] };
          o.cnt = [['REQUISIÇÕES', thou(f * 1000)], ['ACIMA DE 1 S', String(Math.round(f * 8)), f > 0.2 ? 'bad' : 'dim'], ['DENTRO DO SLO', thou(f * 992), 'dim']];
          o.res = f >= 1 ? [['8 de 1.000 entre 1 e 2,5 s', 'acc']] : []; } },
      { id: 'percentis', dur: 8, title: 'Os percentis saem dos buckets', yk: 'histogram_quantile: INTERPOLAÇÃO', act: ['Calcular', 'p50 a p99,9'],
        code: ['p50   = 0,25 + 100 ÷ 575 × 0,25 = 0,293', 'p95   = 0,489 s', 'p99   = 0,765 s  (< 0,8: verde)', 'p99,9 = 2,3125 s (o real: ~1,9)', '8 em 1.000 = 0,8%: p95 e p99 parados'],
        story: 'O <code>histogram_quantile</code> estima o percentil por <b>interpolação linear dentro do <i>bucket</i></b>. O p50 fica em <b>0,293 s</b>, o p95 em <b>0,489</b> e o p99 em <b>0,765</b>, abaixo do 0,8 do SLO. Os 8 lentos são 0,8% da janela: <b>não movem nem o p95 nem o p99</b>, e por isso o painel ficou verde. Só o p99,9 os vê, e mal: <b>2,3125 s</b> para um valor real de ~1,9 s, porque o <i>bucket</i> de 1 a 2,5 s é largo.',
        look: 'A lista à direita: p50, p95 e p99 em amarelo; o p99,9 em vermelho, com 2,3125 s.',
        key: 'O episódio da Lena não move o p99: o painel não tinha como ficar vermelho.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          o.rows.typ = act('não some percentis', '', ['média dos p99:', 'dim'], ['  269 ms', 'bad'], ['p99 de verdade:', 'dim'], ['  2.000 ms', 'acc']);
          o.rows.card = act('rótulos', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          const n = Math.floor(lin(t, 0.4, 3.6, 0, 4.99));
          const P = [['p50', '0,293 s', 'acc'], ['p95', '0,489 s', 'acc'], ['p99', '0,765 s', 'acc'], ['p99,9', '2,3125 s', 'bad']].slice(0, n);
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f: 1, pct: P };
          o.cnt = [['P99', '0,765 s'], ['P99,9', n >= 4 ? '2,3125 s' : '…', n >= 4 ? 'bad' : 'dim'], ['O 1063', '~1,9 s', 'dim']];
          o.res = n >= 4 ? [['p95 e p99 verdes; o 1063, não', 'bad']] : []; } },
      { id: 'balde2', dur: 7, title: 'Um bucket em 2,0 s', yk: 'ONDE PÔR OS BUCKETS', act: ['Pôr um bucket', 'em 2,0 s'],
        code: ['buckets novos: … 1 · 2 · 2,5 …', 'le=1 → 992   le=2 → 1.000', 'p99,9 = 1 + 7 ÷ 8 × (2 − 1)', '      = 1,875 s (o real: ~1,9)', 'bucket perto do SLO e do que você teme'],
        story: 'Os <i>buckets</i> decidem a precisão. Com um limite novo em <b>2,0 s</b>, os 8 lentos caem entre 1 e 2, e o p99,9 passa a <b>1,875 s</b>, perto do ~1,9 real. A regra prática: ponha um <i>bucket</i> perto do SLO (o 0,8 já está lá) e outro perto do valor que você teme. E como percentis <b>não se somam</b>, para juntar instâncias somam-se os <i>buckets</i> e calcula-se de novo.',
        look: 'Aparece a coluna "2" entre o 1 e o 2,5; os 8 lentos passam para ela e o p99,9 cai para 1,875 s.',
        key: 'A precisão do percentil é a largura do bucket.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); lit(o, 'hist'); o.on.typ = 2; o.on.card = 2;
          o.rows.typ = act('não some percentis', '', ['some os buckets', 'acc'], ['de cada instância', 'dim'], ['e calcule de novo', 'dim']);
          o.rows.card = act('rótulos', 'POST /pedidos', ['rota · status · celula', 'dim'], ['servico · versao', 'dim']);
          const nw = t > 1.2;
          o.rows.hist = act('http_server_request_duration_seconds', nw ? 'COM le=2' : 'le · acumulado');
          o.rows.hist.hist = nw ? { ...HIST2, f: 1, pct: [['p50', '0,293 s', 'acc'], ['p95', '0,489 s', 'acc'], ['p99', '0,765 s', 'acc'], ['p99,9', '1,875 s', 'acc']] }
            : { ...HIST, f: 1, pct: [['p50', '0,293 s', 'acc'], ['p95', '0,489 s', 'acc'], ['p99', '0,765 s', 'acc'], ['p99,9', '2,3125 s', 'bad']] };
          o.cnt = [['P99,9', nw ? '1,875 s' : '2,3125 s', nw ? 'acc' : 'bad'], ['VALOR REAL', '~1,9 s', 'dim'], ['BUCKETS', nw ? '10' : '9', 'dim']];
          o.res = nw ? [['bucket estreito: perto do real', 'acc']] : []; } },
      { id: 'cardinalidade', dur: 9, title: 'E se der errado: o cliente_id como rótulo', yk: 'CARDINALIDADE', act: ['Pôr o cliente_id', 'como rótulo'],
        code: ['servico 7 × rota 12 × status 6', '  × celula 4 = 2.016 combinações', '× 11 séries do histograma = 22.176', '× cliente_id (1,5 milhão)', '  = 33,3 bilhões de séries'],
        story: 'Cada combinação de rótulos é uma série. <code>servico</code> (7) × <code>rota</code> (12) × <code>status</code> (6) × <code>celula</code> (4) dão <b>2.016</b> combinações; o histograma gera 11 séries por combinação (8 <code>le</code> + <code>+Inf</code> + <code>_sum</code> + <code>_count</code>): <b>22.176</b>. Alguém quer achar o pedido da Lena pela métrica e põe o <code>cliente_id</code> como rótulo: 22.176 × 1.500.000 = <b>33,3 bilhões</b> de séries. O <code>cliente_id</code>, o <code>pedido_id</code> e o <code>trace_id</code> vão no log e no trace.',
        look: 'O cartão de rótulos multiplica e fica vermelho quando o <code>cliente_id</code> entra.',
        key: 'Id de cliente não é rótulo: é campo de log e de trace.',
        f(o, t) { esteira(o, k => ['5/s', 'dim']); show(o, 'hist', 'typ', 'card'); o.on.hist = 2; o.on.typ = 2;
          const s = t < 1.6 ? 0 : t < 3.2 ? 1 : 2;
          o.rows.typ = act('séries', '', ['por combinação: 11', 'dim'], ['8 le + Inf', 'dim'], ['+ _sum + _count', 'dim']);
          o.rows.card = act('rótulos', s === 2 ? '+ cliente_id' : 'POST /pedidos', ['7 × 12 × 6 × 4', 'dim'], ['= 2.016', s === 0 ? 'acc' : 'dim'], s >= 1 ? ['× 11 = 22.176', s === 1 ? 'acc' : 'dim'] : null, s === 2 ? ['× 1,5 M = 33,3 bi', 'bad'] : null);
          if (s === 2) bad(o, 'card'); else lit(o, 'card');
          o.rows.hist = act('http_server_request_duration_seconds', 'le · acumulado'); o.rows.hist.hist = { ...HIST, f: 1, pct: [['p99', '0,765 s', 'acc']] };
          o.cnt = [['SÉRIES', ['2.016', '22.176', '33,3 bi'][s], s === 2 ? 'bad' : 'acc'], ['CLIENTE_ID', '1,5 milhão', 'dim'], ['RÓTULOS', s === 2 ? '5' : '4', 'dim']];
          o.res = s === 2 ? [['33,3 bilhões de séries', 'bad']] : []; } },
    ],
    logs: [
      { id: 'ilhas', dur: 7, title: 'Cada serviço escreve o seu diário', yk: 'LOGS: ILHAS POR SERVIÇO',
        code: ['5 serviços, ~3 linhas INFO cada', '~300 B por linha (JSON)', '4,5 KB por pedido', 'as linhas do 1063 misturadas', '  com as dos outros pedidos'],
        story: 'O log é o <b>diário de um evento</b>: o que aconteceu com <b>aquele</b> pedido. Cada serviço escreve o seu, em JSON, com ~3 linhas de INFO por pedido e ~300 B por linha. No mesmo segundo do 1063 passam outros pedidos, o catálogo e o <code>bff-app</code>, e as linhas se misturam. Sem um campo em comum, cada serviço é uma ilha.',
        look: 'O quadro da frente mostra linhas de vários serviços na ordem em que chegaram; as do 1063 estão no meio das outras.',
        key: 'Um log solto conta a história de um serviço, não a do pedido.',
        f(o, t) { esteira(o, k => ['~3 linhas/pedido', 'dim']); stream(o, 0.5); show(o, 'log', 'lvl', 'vol'); lit(o, 'log'); o.on.lvl = 2; o.on.vol = 2;
          const all = [...LOG1063, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1);
          o.rows.log = act('logs · 15:30', 'TODOS'); o.rows.log.logs = { lines: all.map(l => [...l, 'dim']), n: Math.round(lin(t, 0.3, 3, 0, all.length)) };
          o.rows.lvl = act('níveis', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'dim'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', 'DIA COMUM', ['4,5 KB/pedido', 'dim'], ['2,81 GB/dia', 'acc']);
          o.cnt = [['LINHAS NA TELA', '9'], ['DO 1063', '5', 'dim'], ['SERVIÇOS', '5', 'dim']];
          o.res = [['as do 1063 estão no meio', 'dim']]; } },
      { id: 'filtro', dur: 8, title: 'Filtrar pelo trace_id do 1063', yk: 'trace_id = 9c1e5a7b3d8f4a2e…', act: ['Filtrar', 'pelo trace_id'],
        code: ['trace_id="9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52"', '07.412 gw-loja  POST /pedidos', '07.436 pedidos  pedido aceito', '09.068 estoque  WARN espera por lock', '09.304 pedidos · 09.307 gw-loja 201'],
        story: 'A Lena mandou <code>9c1e5a7b</code>. Uma busca por <code>trace_id</code> traz as <b>5 linhas</b> do 1063, de três serviços, em ordem: a entrada no <code>gw-loja</code> às 07.412, o "pedido aceito", um <b>WARN</b> do <code>estoque</code> às 09.068, o "pedido criado" e a resposta <code>201</code> com <code>duracao_ms=1895</code>. Entre 07.436 e 09.068 há um buraco de 1,6 s.',
        look: 'As linhas dos outros pedidos somem e as 5 do 1063 ficam em ordem, em amarelo; a do WARN, em vermelho.',
        key: 'O trace_id transforma cinco ilhas num diário só.',
        f(o, t) { esteira(o, k => ['~3 linhas/pedido', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log'); o.on.lvl = 2; o.on.vol = 2;
          const fl = t > 1.4;
          const lines = fl ? LOG1063.map(l => [...l, l[1] === 'WARN' ? 'bad' : 'acc']) : [...LOG1063, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1).map(l => [...l, l[3] === TID ? 'acc' : 'dim']);
          o.rows.log = act('logs · 15:30', fl ? 'trace_id = 9c1e5a7b…' : 'TODOS'); o.rows.log.logs = { lines, n: 99 };
          [0, 2, 3].forEach(k => { if (fl) lit(o, SVN[k]); });
          o.rows.lvl = act('níveis', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'acc'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', 'DIA COMUM', ['4,5 KB/pedido', 'dim'], ['2,81 GB/dia', 'acc']);
          o.cnt = [['LINHAS DO 1063', fl ? '5' : '…', 'acc'], ['SERVIÇOS', fl ? '3' : '5', 'dim'], ['BURACO', fl ? '1,6 s' : '…', fl ? 'bad' : 'dim']];
          o.res = fl ? [['5 linhas, um buraco de 1,6 s', 'acc']] : []; } },
      { id: 'warn', dur: 8, title: 'O WARN do estoque diz quem segurou', yk: 'A LINHA DO estoque (JSON)', act: ['Abrir o WARN', 'do estoque'],
        code: ['"level":"WARN","servico":"estoque"', '"msg":"espera por lock"', '"sku":"CANECA-007"', '"lock_wait_ms":1620', '"holder":"contagem-estoque","holder_pid":4412'],
        story: 'A linha do <code>estoque</code> é um <b>WARN acionável</b>: emitida antes de a Lena reclamar, ela diz o que aconteceu e com quem. O pedido esperou <b>1.620 ms</b> por um <i>lock</i> na linha <code>CANECA-007</code>, e quem segurava era a <b><code>contagem-estoque</code></b> (pid 4412), uma tarefa do próprio serviço. O log responde ao <b>por quê</b>.',
        look: 'A linha vermelha se abre embaixo com os campos do JSON; a caixa do estoque fica vermelha.',
        key: 'Um bom WARN já traz o nome de quem segurou o lock.',
        f(o, t) { esteira(o, k => ['~3 linhas/pedido', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log', 'lvl'); o.on.vol = 2; bad(o, 'est');
          o.rows.log = act('logs · 15:30', 'trace_id = 9c1e5a7b…'); o.rows.log.logs = { lines: LOG1063.map(l => [...l, l[1] === 'WARN' ? 'bad' : 'dim']), n: 99, open: t > 1 ? 2 : -1 };
          o.rows.lvl = act('níveis', 'WARN', ['INFO: o normal', 'dim'], ['WARN: acionável', 'bad'], ['ERROR: triagem', 'dim'], ['FATAL: o fim', 'dim']);
          o.rows.vol = act('volume', 'DIA COMUM', ['4,5 KB/pedido', 'dim'], ['2,81 GB/dia', 'acc']);
          o.cnt = [['LOCK_WAIT', '1.620 ms', 'bad'], ['HOLDER', 'contagem-estoque', 'dim'], ['SKU', 'CANECA-007', 'dim']];
          o.res = t > 1 ? [['por quê: a contagem-estoque', 'bad']] : []; } },
      { id: 'indice', dur: 8, title: 'Estruturar e indexar só alguns campos', yk: 'O QUE SE INDEXA',
        code: ['índice: trace_id · pedido_id · celula', '        servico · versao · level', 'o resto (msg, sku…): só guardado', 'níveis: TRACE DEBUG INFO', '        WARN ERROR FATAL'],
        story: 'O custo do log é indexar o texto todo. Com JSON de <b>campos fixos</b>, indexa-se só o que serve para achar: <code>trace_id</code>, <code>pedido_id</code>, <code>celula</code>, <code>servico</code>, <code>versao</code> e <code>level</code>. O resto vai junto, mas não entra no índice. Os seis níveis (TRACE a FATAL) decidem o que se escreve: <b>ERROR</b> é para triagem, <b>FATAL</b> é o processo que não segue. O <code>cliente_id</code> pode ir; CPF e token, não: se aparecerem, mascare.',
        look: 'No quadro, as colunas indexadas acendem; a mensagem e os campos extras ficam apagados.',
        key: 'Indexe o que acha a linha, não a linha inteira.',
        f(o, t) { esteira(o, k => ['~3 linhas/pedido', 'dim']); show(o, 'log', 'lvl', 'vol'); lit(o, 'log', 'lvl'); o.on.vol = 2;
          o.rows.log = act('logs · 15:30', 'ÍNDICE'); o.rows.log.logs = { lines: LOG1063.map(l => [...l, 'dim']), n: 99, idx: t > 1 };
          o.rows.lvl = act('níveis', '', ['TRACE  DEBUG', 'dim'], ['INFO   WARN', 'acc'], ['ERROR  FATAL', 'dim'], ['CPF e token: não', 'bad']);
          o.rows.vol = act('volume', 'DIA COMUM', ['4,5 KB/pedido', 'dim'], ['2,81 GB/dia', 'acc']);
          o.cnt = [['CAMPOS INDEXADOS', '6'], ['NÍVEIS', '6', 'dim'], ['POR LINHA', '~300 B', 'dim']];
          o.res = [['índice pequeno, busca rápida', 'acc']]; } },
      { id: 'debug', dur: 9, title: 'E se der errado: DEBUG na Black Friday', yk: 'VOLUME DE LOG', act: ['Ligar o DEBUG', 'no pico'],
        code: ['dia comum: 22,5 + 10 KB/s = 2,81 GB/dia', 'pico (30 pedidos/s, 640 req/s):', '  135 + 160 KB/s = 25,5 GB/dia', '  × 30 dias = 765 GB', 'DEBUG (~10×): 255 GB/dia'],
        story: 'No dia comum, 5 pedidos/s a 4,5 KB e o catálogo a 40 req/s dão <b>2,81 GB/dia</b>. Se o pico da Black Friday (30 pedidos/s, 640 req/s) durasse o dia todo: <b>25,5 GB/dia</b>, <b>765 GB</b> em 30 dias de retenção. Alguém liga o <b>DEBUG</b> "para a crise" e esquece: ~10×, <b>255 GB/dia</b>. A conta cresce e a busca fica lenta justo quando é preciso achar uma linha.',
        look: 'O cartão de volume sobe de 2,81 para 25,5 e depois para 255 GB/dia, e fica vermelho.',
        key: 'DEBUG ligado no pico custa dez vezes e esconde o WARN.',
        f(o, t) { esteira(o, k => [t > 3.4 ? 'DEBUG ligado' : '~3 linhas/pedido', t > 3.4 ? 'bad' : 'dim']); stream(o, t > 1.4 ? 0.2 : 0.5); show(o, 'log', 'lvl', 'vol'); o.on.log = 2;
          const s = t < 1.4 ? 0 : t < 3.4 ? 1 : 2;
          o.rows.log = act('logs · 15:30', s === 2 ? 'DEBUG' : 'INFO'); o.rows.log.logs = { lines: (s === 2 ? [...LOG1063, ...NOISE, ...NOISE].sort((a, b) => a[0] < b[0] ? -1 : 1) : LOG1063).map(l => [...l, l[1] === 'WARN' ? 'bad' : 'dim']), n: 99 };
          o.rows.lvl = act('níveis', s === 2 ? 'DEBUG' : 'INFO', ['TRACE  DEBUG', s === 2 ? 'bad' : 'dim'], ['INFO   WARN', 'dim'], ['ERROR  FATAL', 'dim']);
          o.rows.vol = act('volume', ['DIA COMUM', 'PICO', 'PICO + DEBUG'][s], [['2,81 GB/dia', '25,5 GB/dia', '255 GB/dia'][s], s === 2 ? 'bad' : 'acc'], s ? ['30 dias: 765 GB', 'dim'] : ['4,5 KB/pedido', 'dim']);
          if (s === 2) bad(o, 'vol', 'lvl'); else lit(o, 'vol');
          o.cnt = [['GB/DIA', ['2,81', '25,5', '255'][s], s === 2 ? 'bad' : 'acc'], ['30 DIAS (INFO)', '765 GB', 'dim'], ['NÍVEL', s === 2 ? 'DEBUG' : 'INFO', s === 2 ? 'bad' : 'dim']];
          o.res = s === 2 ? [['10× o custo, o WARN no meio', 'bad']] : []; } },
    ],
    traces: [
      { id: 'normal', dur: 7, title: 'Um pedido normal: 275 ms em 8 spans', yk: 'A CASCATA (ms)',
        code: ['POST /pedidos  0 → 4', 'bff-app 4 · pedidos 10 · carrinho 24', 'estoque 36 → 56 (20)', 'pagamentos 56 → 266 (210)', 'INSERT 266 · Kafka 272 → 275'],
        story: 'O <i>trace</i> é o caminho de ponta a ponta de uma requisição: uma árvore de <b><i>spans</i></b>, cada um com início, duração, pai e atributos. Num pedido normal são <b>8</b>: a raiz no <code>gw-loja</code>, o <code>bff-app</code>, o <code>pedidos</code> e as chamadas dele (carrinho, estoque, pagamentos, o <code>INSERT</code> e o Kafka). Total: <b>275 ms</b>, e o maior pedaço são os 210 ms do <code>pagamentos</code> (180 deles no PSP-A).',
        look: 'Cada barra cai da caixa para a cascata. O contorno das três primeiras mostra que elas esperam os filhos até o fim; a parte cheia é o trabalho próprio.',
        key: 'O trace diz onde o tempo foi gasto.',
        f(o, t) { esteira(o, k => [['4 ms', '6 ms', '14 ms', '20 ms', '210 ms'][k], 'dim']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.tp = 2; o.on.smp = 2;
          ficha(o, t, false, 'normal', 'gray');
          o.rows.cas = act('trace · POST /pedidos', 'NORMAL'); o.rows.cas.cas = { slow: false, n: Math.round(lin(t, 0.4, 3.2, 0, 8)) };
          o.rows.tp = act('traceparent', 'W3C', ['00-<32 hex>', 'dim'], ['-<16 hex>-01', 'dim']);
          o.rows.smp = act('amostragem', '', ['4,8 KB por trace', 'dim'], ['12 spans × 400 B', 'dim']);
          o.cnt = [['TOTAL', '275 ms'], ['SPANS', '8', 'dim'], ['MAIOR', 'pagamentos 210', 'dim']];
          o.res = [['o PSP-A é o maior pedaço', 'acc']]; } },
      { id: 'lento', dur: 9, title: 'O 1063: 1.895 ms, 86,5% no estoque', yk: 'A CASCATA DO 1063 (ms)', act: ['Abrir o trace', 'do 1063'],
        code: ['estoque reservar: 36 → 1.676', '  20 de trabalho + 1.620 de espera', 'pagamentos 1.676 → 1.886', 'total: 1.895 ms', 'estoque: 1.640 ÷ 1.895 = 86,5%'],
        story: 'O trace do 1063 tem as mesmas barras, com uma diferença: o <code>estoque reservar</code> durou <b>1.640 ms</b> (20 de trabalho e <b>1.620</b> de espera por <i>lock</i>). Tudo o que vem depois é empurrado: o total vai a <b>1.895 ms</b>, e o <code>estoque</code> é <b>86,5%</b> do tempo. A métrica disse <b>que</b> 8 pedidos demoraram; o trace diz <b>onde</b>.',
        look: 'A barra do estoque se estica em vermelho; as do pagamentos, do INSERT e do Kafka andam para a direita.',
        key: 'Um span de 1.640 ms em 1.895: o lugar está achado.',
        f(o, t) { esteira(o, k => [['4 ms', '6 ms', '14 ms', '1.640 ms', '210 ms'][k], k === 3 ? 'bad' : 'dim']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.tp = 2; o.on.smp = 2;
          ficha(o, t, true);
          const g = lin(t, 0.8, 3.6, 0, 1);
          o.rows.cas = act('trace 9c1e5a7b…', '1063'); o.rows.cas.cas = { slow: g, n: 8 };
          o.rows.tp = act('traceparent', 'W3C', ['00-9c1e5a7b…', 'acc'], ['-a3c4d5e6…-01', 'dim']);
          o.rows.smp = act('amostragem', '', ['4,8 KB por trace', 'dim'], ['12 spans × 400 B', 'dim']);
          const tot = Math.round(275 + 1620 * g);
          o.cnt = [['TOTAL', thou(tot) + ' ms', g > 0.5 ? 'bad' : 'acc'], ['ESTOQUE', thou(20 + 1620 * g) + ' ms', g > 0.5 ? 'bad' : 'dim'], ['PARTE DO ESTOQUE', g >= 1 ? '86,5%' : '…', 'dim']];
          o.res = g >= 1 ? [['onde: o estoque, 86,5%', 'bad']] : []; } },
      { id: 'traceparent', dur: 9, title: 'O traceparent viaja nos cabeçalhos', yk: 'traceparent (W3C)', act: ['Seguir o cabeçalho', 'de caixa em caixa'],
        code: ['00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52', '  -a3c4d5e6f7a8b9c0-01', 'versão 00 · trace_id 32 hex', 'span pai 16 hex · flags 01 (amostrado)', 'HTTP e Kafka: o mesmo cabeçalho'],
        story: 'Como cinco serviços sabem que estão no mesmo trace? Cada chamada leva o cabeçalho <code>traceparent</code> do W3C: <code>versão-trace_id-span pai-flags</code>. Cada serviço lê o <code>trace_id</code>, cria o seu <i>span</i> com o pai certo e repassa o cabeçalho adiante, em HTTP e nas mensagens do Kafka. Isso é a <b>propagação de contexto</b>. A OpenTelemetry faz isso por você; a ideia vem do Dapper, do Google.',
        look: 'A ficha leva o cabeçalho; cada caixa que ela toca acende e passa a mostrar o mesmo 9c1e5a7b.',
        key: 'O trace existe porque cada serviço repassa o traceparent.',
        f(o, t) { const r = ride(t, false, 0.4);
          esteira(o, k => [r.at >= k || r.done || (r.at < 0 && t > 0.4 && ROW[k][0] <= r.p[0]) ? 'trace 9c1e5a7b' : 'esperando…', r.at >= k || r.done || (r.at < 0 && t > 0.4 && ROW[k][0] <= r.p[0]) ? 'acc' : 'dim']);
          show(o, 'cas', 'tp', 'smp'); lit(o, 'tp'); o.on.cas = 2; o.on.smp = 2;
          ficha(o, t, false, 'traceparent');
          o.rows.cas = act('trace 9c1e5a7b…', '1063'); o.rows.cas.cas = { slow: 1, n: 8 };
          o.rows.tp = act('traceparent', 'W3C', ['00 · versão', 'dim'], ['9c1e5a7b… · trace', 'acc'], ['a3c4d5e6… · pai', 'dim'], ['01 · amostrado', 'dim']);
          o.rows.smp = act('amostragem', '', ['4,8 KB por trace', 'dim'], ['12 spans × 400 B', 'dim']);
          o.cnt = [['TRACE_ID', '9c1e5a7b…'], ['SPAN PAI', '16 hex', 'dim'], ['FLAGS', '01', 'dim']];
          o.res = [['o mesmo id em todo o caminho', 'acc']]; } },
      { id: 'amostra', dur: 9, title: 'Head × tail: guardar os traces lentos', yk: 'AMOSTRAGEM A 30 PEDIDOS/S', act: ['Ligar o tail', 'sampling'],
        code: ['12 spans × 400 B = 4,8 KB por trace', '100%: 12,4 GB/dia · 1%: 124 MB/dia', 'head 1%: 1 − 0,99⁸ = 7,7%', '  de guardar ao menos um dos 8', 'tail (5xx, > 800 ms, 1%): os 8'],
        story: 'Guardar todos os traces a 30 pedidos/s custa <b>12,4 GB/dia</b>; com 1%, <b>124 MB</b>. O <i><b>head sampling</b></i> decide no começo, antes de saber se o pedido vai ser lento: com 1%, a chance de guardar <b>pelo menos um</b> dos 8 lentos é 1 − 0,99⁸ = <b>7,7%</b>. O <i><b>tail sampling</b></i> decide depois de ver o trace inteiro: guarda todos os <code>5xx</code>, todos acima de 800 ms e 1% do resto. Fica com os <b>8</b>, o da Lena entre eles.',
        look: 'O cartão de amostragem troca de head para tail; a chance de ter o 1063 vai de 7,7% para os 8 de 8.',
        key: 'Decida depois de ver o trace e o lento fica guardado.',
        f(o, t) { esteira(o, k => ['30 pedidos/s', 'dim']); stream(o, 0.3); show(o, 'cas', 'tp', 'smp'); lit(o, 'smp'); o.on.tp = 2; o.on.cas = 2;
          const tl = t > 2.6;
          o.rows.cas = act('trace 9c1e5a7b…', tl ? 'GUARDADO' : 'TALVEZ'); o.rows.cas.cas = { slow: 1, n: 8, ghost: !tl };
          o.rows.tp = act('custo', '', ['100%: 12,4 GB/dia', 'dim'], ['1%: 124 MB/dia', 'acc']);
          o.rows.smp = act('amostragem', tl ? 'TAIL' : 'HEAD 1%', [tl ? 'lentos: 8 de 8' : 'lentos: 7,7%', tl ? 'acc' : 'bad'], [tl ? '5xx + > 800 ms' : 'decide no começo', 'dim']);
          o.cnt = [['GUARDA UM DOS 8', tl ? '100%' : '7,7%', tl ? 'acc' : 'bad'], ['100% DOS TRACES', '12,4 GB/dia', 'dim'], ['1% DOS TRACES', '124 MB/dia', 'dim']];
          o.res = tl ? [['tail: o 1063 fica', 'acc']] : [['head: o 1063 quase some', 'bad']]; } },
      { id: 'kafka', dur: 9, title: 'E se der errado: o contexto se perde no Kafka', yk: 'PROPAGAÇÃO QUEBRADA', act: ['Perder o contexto', 'no Kafka'],
        code: ['pedidos publica PedidoCriado', '  com o traceparent no cabeçalho', 'o consumidor (estoque) não repassa', 'o consumo vira um trace novo, órfão', 'o caminho do 1063 parte ao meio'],
        story: 'O <code>pedidos</code> publica <code>PedidoCriado</code> no Kafka com o <code>traceparent</code> no cabeçalho da mensagem. Do outro lado, o consumidor (<code>estoque</code>) não lê o cabeçalho e começa um trace com um <code>trace_id</code> novo. O caminho do 1063 <b>parte ao meio</b>: a busca pelo 9c1e5a7b mostra a compra e não mostra a baixa do estoque, e o trace da baixa fica <b>órfão</b>.',
        look: 'A última barra (Kafka) fica vermelha e a linha de baixo mostra o trace órfão, sem pai.',
        key: 'Um serviço que não repassa o contexto corta o trace em dois.',
        f(o, t) { esteira(o, k => [k === 2 ? 'publica no Kafka' : 'trace 9c1e5a7b', k === 2 && t > 1.6 ? 'bad' : 'acc']); show(o, 'cas', 'tp', 'smp'); lit(o, 'cas'); o.on.smp = 2;
          const lost = t > 1.6; if (lost) bad(o, 'tp'); else o.on.tp = 2;
          o.rows.cas = act('trace 9c1e5a7b…', lost ? 'PARTIDO' : '1063'); o.rows.cas.cas = { slow: 1, n: 8, orphan: lost };
          o.rows.tp = act('estoque', 'CONSUMIDOR', [lost ? 'sem traceparent' : 'lê o cabeçalho', lost ? 'bad' : 'acc'], [lost ? 'trace_id novo' : '9c1e5a7b…', lost ? 'bad' : 'dim']);
          o.rows.smp = act('amostragem', 'TAIL', ['lentos: 8 de 8', 'acc'], ['5xx + > 800 ms', 'dim']);
          if (lost) T(o, [SVC(2), SVY + SVD + 14, ZT + 10], 'Kafka: sem traceparent', 'bad');
          o.cnt = [['TRACES DO 1063', lost ? '2 (1 órfão)' : '1', lost ? 'bad' : 'acc'], ['ELO PERDIDO', lost ? 'estoque' : '—', lost ? 'bad' : 'dim'], ['SPANS LIGADOS', '8', 'dim']];
          o.res = lost ? [['o caminho partiu ao meio', 'bad']] : []; } },
    ],
    correlacao: [
      { id: 'que', dur: 7, title: 'Que: a métrica acha 8 pedidos lentos', yk: '1 · A MÉTRICA',
        code: ['estoque_reservar_duracao_segundos', '  8 pedidos acima de 1 s', '  às 15:30', 'p99 de POST /pedidos: 0,765 s', 'que algo mudou, e quanto; não quais'],
        story: 'A investigação tem três passos, do sinal mais barato para o mais detalhado. O primeiro é a <b>métrica</b>: o histograma de <code>estoque_reservar_duracao_segundos</code> mostra <b>8 pedidos acima de 1 s</b> às 15:30. Ela diz <b>que</b> algo mudou e quanto. Não diz <b>quais</b> pedidos: a métrica não carrega <code>trace_id</code>.',
        look: 'O primeiro quadro acende: 8 pedidos acima de 1 s. Os outros dois esperam.',
        key: 'A métrica diz que.',
        f(o) { esteira(o); stream(o); show(o, 'q1', 'q2', 'q3'); lit(o, 'q1', 'est'); o.on.q2 = 0; o.on.q3 = 0;
          o.rows.q1 = act('1 · que', 'MÉTRICA', ['estoque_reservar_', 'dim'], ['duracao_segundos', 'dim'], ['8 acima de 1 s', 'bad'], ['às 15:30', 'acc'], ['quais? não diz', 'dim']);
          o.rows.q2 = act('2 · onde', 'TRACE', ['…', 'dim']); o.rows.q3 = act('3 · por quê', 'LOG', ['…', 'dim']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]] }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]] });
          o.cnt = [['ACIMA DE 1 S', '8', 'bad'], ['P99', '0,765 s', 'dim'], ['QUAIS', '?', 'dim']];
          o.res = [['que: 8 lentos no estoque', 'acc']]; } },
      { id: 'onde', dur: 8, title: 'Onde: o trace do 1063 aponta o estoque', yk: '2 · O TRACE', act: ['Abrir um trace', 'o 9c1e5a7b'],
        code: ['trace 9c1e5a7b (o código da Lena,', '  ou um dos 8 do tail sampling)', 'total: 1.895 ms', 'estoque reservar: 1.640 ms', '86,5% do tempo no estoque'],
        story: 'O segundo passo é o <b>trace</b>. O código da Lena (ou qualquer um dos 8 que o <i>tail sampling</i> guardou) abre a cascata do 1063: <b>1.895 ms</b>, dos quais <b>1.640</b> no <code>estoque reservar</code>, ou <b>86,5%</b>. O trace diz <b>onde</b>. Ainda não diz <b>por quê</b>: o <i>span</i> mostra a espera, não quem a causou.',
        look: 'A ficha do 1063 para no estoque; o segundo quadro acende com 1.640 de 1.895.',
        key: 'O trace diz onde.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; lit(o, 'q2'); ficha(o, t, true);
          o.rows.q1 = act('1 · que', 'MÉTRICA', ['8 acima de 1 s', 'bad'], ['às 15:30', 'dim']);
          o.rows.q2 = act('2 · onde', 'TRACE', ['9c1e5a7b…', 'acc'], ['total 1.895 ms', 'dim'], ['estoque 1.640', 'bad'], ['= 86,5%', 'bad'], ['por quê? não diz', 'dim']);
          o.rows.q3 = act('3 · por quê', 'LOG', ['…', 'dim']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]] });
          o.cnt = [['ESTOQUE', '1.640 ms', 'bad'], ['TOTAL', '1.895 ms', 'dim'], ['PARTE', '86,5%', 'dim']];
          o.res = [['onde: o estoque', 'acc']]; } },
      { id: 'porque', dur: 8, title: 'Por quê: o log nomeia a contagem-estoque', yk: '3 · O LOG', act: ['Buscar o log', 'pelo trace_id'],
        code: ['trace_id=9c1e5a7b… servico=estoque', 'WARN espera por lock', 'sku=CANECA-007 lock_wait_ms=1620', 'holder=contagem-estoque', 'holder_pid=4412'],
        story: 'O terceiro passo é o <b>log</b>, buscado pelo mesmo <code>trace_id</code> e pelo <code>span_id</code> do estoque. A linha WARN diz que o pedido esperou <b>1.620 ms</b> pelo <i>lock</i> de <code>CANECA-007</code> e que quem segurava era a <b><code>contagem-estoque</code></b>. O log diz <b>por quê</b>. Três sinais, uma chave: o <code>trace_id</code>.',
        look: 'O terceiro quadro acende com o holder; os três ficam ligados pelo cabo amarelo.',
        key: 'O log diz por quê.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2; lit(o, 'q3'); bad(o, 'est');
          o.rows.q1 = act('1 · que', 'MÉTRICA', ['8 acima de 1 s', 'bad'], ['às 15:30', 'dim']);
          o.rows.q2 = act('2 · onde', 'TRACE', ['estoque 1.640', 'bad'], ['= 86,5%', 'dim']);
          o.rows.q3 = act('3 · por quê', 'LOG', ['WARN estoque', 'bad'], ['lock_wait 1.620', 'dim'], ['CANECA-007', 'dim'], ['holder:', 'dim'], ['contagem-estoque', 'bad']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], on: 1 });
          o.cnt = [['HOLDER', 'contagem-estoque', 'bad'], ['LOCK_WAIT', '1.620 ms', 'dim'], ['CHAVE', 'trace_id', 'dim']];
          o.res = [['que → onde → por quê', 'acc']]; } },
      { id: 'causa', dur: 8, title: 'A causa: um cron dentro do estoque', yk: 'A CONTA DO EPISÓDIO',
        code: ['contagem-estoque: cron às :00 e :30', 'transação de 1,6 s com FOR UPDATE', '  na linha CANECA-007', '5 pedidos/s × 1,6 s = 8 pedidos', 'conserto: contar por snapshot'],
        story: 'A <code>contagem-estoque</code> é um <i>cron</i> do próprio serviço, às :00 e às :30. Ela abre uma transação de <b>1,6 s</b> que trava a linha <code>CANECA-007</code>, e no "caneca em dobro" <b>todo</b> pedido leva a caneca: a 5 pedidos/s, <b>8 pedidos</b> esperam por ela. Não é o <code>relatorios</code>, que lê da réplica do Rio. O conserto (fora do escopo) é contar por <i>snapshot</i> em vez de <code>FOR UPDATE</code>.',
        look: 'As fichas do episódio param juntas no estoque; o contador chega a 8.',
        key: '5 pedidos/s × 1,6 s de lock = os 8 lentos.',
        f(o, t) { esteira(o); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2; lit(o, 'q3'); bad(o, 'est');
          const n = Math.min(8, Math.floor(lin(t, 0.5, 3.7, 0, 8.99)));
          for (let k = 0; k < n; k++) o.dots.push([[SVX(3) + 18 + (k % 4) * 38, SVY + 30 + Math.floor(k / 4) * 40, ZT], k === 0 ? '' : 'gray']);
          o.rows.q1 = act('1 · que', 'MÉTRICA', ['8 acima de 1 s', 'bad'], ['às 15:30', 'dim']);
          o.rows.q2 = act('2 · onde', 'TRACE', ['estoque 1.640', 'bad'], ['= 86,5%', 'dim']);
          o.rows.q3 = act('contagem-estoque', 'CRON', ['às :00 e :30', 'dim'], ['FOR UPDATE 1,6 s', 'bad'], ['5/s × 1,6 s = 8', 'acc'], ['conserto: snapshot', 'acc']);
          o.rows.est = act('estoque', 'LOCK', ['CANECA-007', 'bad'], [`esperando: ${n}`, 'bad']);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], on: 1 });
          o.cnt = [['ESPERANDO O LOCK', String(n), n ? 'bad' : 'dim'], ['LOCK', '1,6 s', 'dim'], ['PEDIDOS/S', '5', 'dim']];
          o.res = n >= 8 ? [['5/s × 1,6 s = 8 pedidos', 'acc']] : []; } },
      { id: 'horario', dur: 9, title: 'E se der errado: juntar pelo horário', yk: 'CORRELAÇÃO POR HORÁRIO', act: ['Juntar', 'pelo horário'],
        code: ['busca: 15:30:07 a 15:30:09', 'todas as linhas de todos os serviços', 'o relatorios também roda nessa hora', '  (lê da réplica do Rio)', 'suspeito errado; relógios diferentes'],
        story: 'Sem o <code>trace_id</code>, a tentação é juntar os sinais <b>pelo horário</b>: tudo o que aconteceu entre 15:30:07 e 15:30:09. Em 2 s passam uns 10 pedidos, o catálogo e o que mais estiver rodando, e cada serviço tem o seu relógio. O suspeito óbvio é o <code>relatorios</code>, que não tem nada com isso: lê da réplica do Rio. Por isso se correlaciona por <b>id</b>, não por hora (é o ponto do artigo de Lamport sobre relógios).',
        look: 'O terceiro quadro aponta para o relatorios, em vermelho; o cabo entre o trace e o log fica cinza.',
        key: 'Correlacione por id: o horário junta o que só aconteceu ao mesmo tempo.',
        f(o, t) { esteira(o); stream(o, 0.4); show(o, 'q1', 'q2', 'q3'); o.on.q1 = 2; o.on.q2 = 2;
          const w = t > 1.6; if (w) bad(o, 'q3'); else o.on.q3 = 2;
          o.rows.q1 = act('1 · que', 'MÉTRICA', ['8 acima de 1 s', 'bad'], ['às 15:30', 'dim']);
          o.rows.q2 = act('2 · onde', 'TRACE', ['estoque 1.640', 'bad'], ['sem trace_id no log', 'dim']);
          o.rows.q3 = act('3 · por quê?', 'POR HORÁRIO', ['15:30:07 a :09', 'dim'], ['~10 pedidos', 'dim'], ['+ catálogo, bff…', 'dim'], [w ? 'suspeito: relatorios' : 'buscando…', w ? 'bad' : 'dim'], w ? ['(está na réplica)', 'dim'] : null);
          o.beams.push({ pts: [[300, FY + 115, Z], [320, FY + 115, Z]], on: 1 }, { pts: [[580, FY + 115, Z], [600, FY + 115, Z]], tone: w ? 'bad' : '' });
          o.cnt = [['LINHAS NA JANELA', 'dezenas', 'dim'], ['SUSPEITO', w ? 'relatorios' : '…', w ? 'bad' : 'dim'], ['CHAVE', 'horário', 'bad']];
          o.res = w ? [['o horário acusa o errado', 'bad']] : []; } },
    ],
    alerta: [
      { id: 'incidente', dur: 9, title: '20:20:00: o PSP-A falha por 90 s', yk: 'O INCIDENTE DO MÓDULO 21',
        code: ['20:20:00 a 20:21:30 (90 s)', '30 pedidos/s, sem breaker nem fallback', '100% de erro: 2.700 falhas', 'regras avaliadas a cada 15 s', 'burn rate de 100% de erro: 1.000×'],
        story: 'Volte ao incidente do módulo 21: das <b>20:20:00 às 20:21:30</b>, o PSP-A falha. A loja está a <b>30 pedidos/s</b> e, sem o <i>breaker</i> e o <i>fallback</i>, <b>100%</b> dos pedidos dão erro: <b>2.700 falhas</b>. Ter os três sinais é poder ver. Mas ninguém olha painel às 20:20. A pergunta agora é <b>quando o sistema chama alguém</b>, e com qual regra.',
        look: 'O pagamentos fica vermelho; na linha do tempo, a faixa vermelha do incidente cresce até 90 s e o relógio corre.',
        key: 'Alerta é transformar um estado conhecido em chamado para uma pessoa.',
        f(o, t) { const cur = lin(t, 0.4, 6.4, 0, 90);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: erro' : 'voltou', cur < 90 ? 'bad' : 'acc'] : ['30 pedidos/s', 'dim']); if (cur > 0 && cur < 90) bad(o, 'pag');
          stream(o, 0.3); show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.pg = 2; o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'AVALIA A CADA 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: [] };
          o.rows.pg = act('quem é chamado', '', ['página: ninguém ainda', 'dim'], ['ticket: —', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['erro: ' + (cur > 0 && cur < 90 ? '100%' : '0%'), cur > 0 && cur < 90 ? 'bad' : 'dim'], ['30 pedidos/s', 'dim']);
          o.cnt = [['FALHAS', thou(cur * 30), cur ? 'bad' : 'dim'], ['RELÓGIO', clk2(cur), 'dim'], ['ERRO', '100%', 'dim']];
          o.res = cur >= 90 ? [['2.700 falhas em 90 s', 'bad']] : []; } },
      { id: 'janela', dur: 10, title: 'A e B: o for que chega depois', yk: 'for: 5m × for: 1m', act: ['Ligar A e B', 'erro > 5%'],
        code: ['A: erro > 5% por 5 min', '  o incidente acaba em 90 s: nunca', 'B: erro > 5% por 1 min', '  dispara 20:21:00–20:21:15', '  MTTD 60 a 75 s (avaliação a cada 15 s)'],
        story: 'A regra <b>A</b> pede erro acima de 5% <b>por 5 minutos</b> (<code>for: 5m</code>). O incidente dura 90 s: ela <b>nunca</b> dispara. A regra <b>B</b> pede 1 minuto: a condição vale desde 20:20:00, e como a avaliação roda a cada 15 s, ela dispara entre <b>20:21:00 e 20:21:15</b>, um MTTD de <b>60 a 75 s</b>. O <code>for</code> evita alarme por um pico de segundos, e cobra em atraso.',
        look: 'A barra de A cresce e some quando o incidente acaba, sem disparar; a de B chega a 60 s e acende o losango.',
        key: 'Um for de 5 min nunca vê um incidente de 90 s.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: erro' : 'voltou', cur < 90 ? 'bad' : 'acc'] : ['30 pedidos/s', 'dim']); if (cur < 90) bad(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'AVALIA A CADA 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: ['A', 'B'] };
          const pg = cur >= 60; if (pg) lit(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('quem é chamado', '', [pg ? 'página: B, 20:21:00–15' : 'página: ninguém ainda', pg ? 'acc' : 'dim'], ['A: nunca', cur >= 90 ? 'bad' : 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['erro: ' + (cur < 90 ? '100%' : '0%'), cur < 90 ? 'bad' : 'dim'], ['30 pedidos/s', 'dim']);
          o.cnt = [['MTTD DE B', cur >= 60 ? '60–75 s' : '…', cur >= 60 ? 'acc' : 'dim'], ['MTTD DE A', cur >= 90 ? 'nunca' : '…', cur >= 90 ? 'bad' : 'dim'], ['RELÓGIO', clk2(cur), 'dim']];
          o.res = cur >= 90 ? [['A nunca dispara', 'bad'], ['B: 60 a 75 s', 'acc']] : []; } },
      { id: 'sonda', dur: 10, title: 'C e D: a sonda e o burn rate', yk: 'SONDA × BURN RATE', act: ['Ligar C e D', 'sonda e burn rate'],
        code: ['C: sonda a cada 10 s, 3 falhas seguidas', '  20:20:30: MTTD 30 s', 'D: burn rate 14,4× (1 h e 5 min, SLO 99,9%)', '  14,4 × 0,001 × 3.600 = 51,84 s de erro', '  MTTD ~52 a 67 s'],
        story: 'A regra <b>C</b> é a <b>sonda sintética</b> do módulo 27: um pedido de teste a cada 10 s, que chama alguém depois de 3 falhas seguidas: <b>20:20:30</b>, MTTD de <b>30 s</b>. A regra <b>D</b> olha o orçamento de erro: com SLO de 99,9%, 100% de erro queima a <b>1.000×</b>; a janela de 1 h passa de 14,4× depois de 14,4 × 0,001 × 3.600 = <b>51,84 s</b> de erro, e com a avaliação a cada 15 s ela dispara entre <b>~52 e 67 s</b>.',
        look: 'As três marcas da sonda caem em 10, 20 e 30 s e o losango de C acende; o de D acende em 51,84 s.',
        key: 'A sonda é a mais rápida; o burn rate liga o alerta ao orçamento.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'PSP-A: erro' : 'voltou', cur < 90 ? 'bad' : 'acc'] : ['30 pedidos/s', 'dim']); if (cur < 90) bad(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl'); o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'AVALIA A CADA 15 s'); o.rows.tl.tl = { cur, inc: 90, rules: ['A', 'B', 'C', 'D'] };
          if (cur >= 30) lit(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('quem é chamado', '', [cur >= 30 ? 'página: C, 20:20:30' : 'página: ninguém ainda', cur >= 30 ? 'acc' : 'dim'], [cur >= 51.84 ? 'D: ~52–67 s · B: 60–75 s' : '…', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['erro: ' + (cur < 90 ? '100%' : '0%'), cur < 90 ? 'bad' : 'dim'], ['burn: 1.000×', cur < 90 ? 'bad' : 'dim']);
          o.cnt = [['MTTD DE C', cur >= 30 ? '30 s' : '…', 'acc'], ['MTTD DE D', cur >= 51.84 ? '~52 s' : '…', 'dim'], ['RELÓGIO', clk2(cur), 'dim']];
          o.res = cur >= 52 ? [['nunca · 60–75 · 30 · ~52 s', 'acc']] : []; } },
      { id: 'breaker', dur: 9, title: 'Com o breaker: nenhuma página, e está certo', yk: 'SINTOMA × CAUSA', act: ['Ligar o breaker', 'e o fallback'],
        code: ['breaker abre em 1,3 s: ~39 falhas', '1,44% no instante (14,4×)', '0,036% em 1 h (0,36×)', '0,43% em 5 min (4,3×)', 'breaker_state=aberto → ticket'],
        story: 'Agora com as defesas do módulo 21: o <i>breaker</i> abre em <b>1,3 s</b> e o <i>fallback</i> leva ao PSP-B. Falham só <b>~39</b> pedidos (30 × 1,3 s). No instante são 1,44%, mas em 1 h são <b>0,036%</b> (0,36×) e em 5 min, <b>0,43%</b> (4,3×). Nenhuma regra de página dispara, e <b>não deve</b>: o cliente não sentiu. O <code>breaker_state{dependencia="psp-a"}=aberto</code> é a <b>causa</b> e vira <b>ticket</b>. A regra do SRE book: página para sintoma, causa para depurar.',
        look: 'A faixa vermelha do incidente fica fininha (1,3 s); nenhum losango acende; o cartão de baixo mostra o ticket.',
        key: 'Página para o que o cliente sente; o resto vira ticket.',
        f(o, t) { const cur = lin(t, 0.4, 7.4, 0, 120);
          esteira(o, k => k === 4 ? [cur < 90 ? 'breaker aberto' : 'fechado', cur < 90 ? 'acc' : 'dim'] : ['30 pedidos/s', 'dim']); if (cur < 90 && cur > 0) lit(o, 'pag');
          show(o, 'tl', 'pg', 'apm'); lit(o, 'tl', 'pg'); o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'COM BREAKER'); o.rows.tl.tl = { cur, inc: 1.3, rules: ['A', 'B', 'C', 'D'], quiet: 1 };
          o.rows.pg = act('quem é chamado', '', ['página: ninguém', 'acc'], [cur > 2 ? 'ticket: breaker_state=aberto' : 'ticket: —', cur > 2 ? 'acc' : 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['erro em 1 h: 0,036%', 'dim'], ['PSP-B: fallback', 'acc']);
          o.cnt = [['FALHAS', String(Math.round(Math.min(cur, 1.3) * 30)), 'dim'], ['EM 1 H', '0,036%', 'dim'], ['PÁGINAS', '0', 'acc']];
          o.res = cur > 2 ? [['causa → ticket, sem página', 'acc']] : []; } },
      { id: 'apm', dur: 8, title: 'APM: os sinais em volta da experiência', yk: 'POR OPERAÇÃO, ROTA E VERSÃO',
        code: ['POST /pedidos: p99, erro, chamadas/s', 'por dependência: estoque, PSP-A', 'por versão: 2.6.0 depois do deploy', 'o 1063: 8 em 1.500 (5 min) = 5,3×', '        0,044% em 1 h = 0,44×: nada'],
        story: 'O <b>APM</b> organiza os mesmos sinais em volta da <b>experiência</b>: por operação (<code>POST /pedidos</code>), por rota, por dependência (o <code>estoque</code>, o PSP-A) e por versão, para ver uma regressão logo depois de um deploy. E o 1063? O episódio das 15:30 tem <b>8 ruins em 1.500</b> numa janela de 5 min: 5,3×, abaixo de 14,4×, e <b>0,44×</b> em 1 h. Nenhum alerta dispara. A Lena foi achada pela reclamação; o APM mostra a dependência <code>estoque</code> com cauda longa às :00 e :30.',
        look: 'O cartão do APM acende com as visões por operação, dependência e versão; o burn rate do 1063 fica abaixo da linha.',
        key: 'O APM mostra o caminho do usuário; nem todo episódio vira alerta.',
        f(o, t) { esteira(o, k => ['5 pedidos/s', 'dim']); stream(o); show(o, 'tl', 'pg', 'apm'); lit(o, 'apm'); o.on.tl = 2; o.on.pg = 2;
          o.rows.tl = act('regras de alerta', 'O 1063 · 15:30'); o.rows.tl.tl = { cur: 0, inc: 0, rules: [], burn: 1 };
          o.rows.pg = act('o 1063', 'BURN RATE', ['5 min: 5,3× (< 14,4×)', 'dim'], ['1 h: 0,44× · nada dispara', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['estoque: cauda às :00/:30', 'acc'], ['versão 2.6.0 · PSP-A 180 ms', 'dim']);
          o.cnt = [['BURN 5 MIN', '5,3×'], ['BURN 1 H', '0,44×', 'dim'], ['ALERTAS', '0', 'dim']];
          o.res = [['o 1063 não acorda ninguém', 'dim']]; } },
      { id: 'ruido', dur: 9, title: 'E se der errado: o alerta que acorda por causa', yk: 'FADIGA DE ALERTA', act: ['Paginar', 'o breaker'],
        code: ['regra: breaker_state=aberto → página', '03:00: o PSP-A oscila, o breaker abre', 'fallback no PSP-B: o cliente não sente', 'alguém acorda para nada', 'depois de 10 noites: ninguém olha'],
        story: 'O contrário também quebra. Alguém faz do <code>breaker_state=aberto</code> uma <b>página</b>. Às 3 h o PSP-A oscila, o <i>breaker</i> abre, o <i>fallback</i> funciona e o cliente não sente nada, mas alguém acorda. Depois de algumas noites assim, a equipe silencia o alerta ou para de olhar, e o dia em que a página importa passa batido. Isso é a <b>fadiga de alerta</b>: causa vai para ticket e painel.',
        look: 'O cartão de quem é chamado fica vermelho às 03:00, com o cliente em 0% de erro.',
        key: 'Alerta por causa vira ruído, e ruído ensina a ignorar.',
        f(o, t) { esteira(o, k => k === 4 ? ['breaker aberto', 'acc'] : ['03:00', 'dim']); lit(o, 'pag'); show(o, 'tl', 'pg', 'apm'); o.on.tl = 2; o.on.apm = 2;
          o.rows.tl = act('regras de alerta', 'COM BREAKER'); o.rows.tl.tl = { cur: 120, inc: 1.3, rules: ['A', 'B', 'C', 'D'], quiet: 1 };
          const w = t > 1.4; if (w) bad(o, 'pg'); else o.on.pg = 2;
          o.rows.pg = act('quem é chamado', '03:00', [w ? 'PÁGINA: breaker aberto' : 'página: ninguém', w ? 'bad' : 'dim'], [w ? 'o cliente: 0% de erro' : '…', 'dim']);
          o.rows.apm = act('APM', 'POST /pedidos', ['erro: 0%', 'acc'], ['PSP-B: fallback', 'dim']);
          o.cnt = [['PÁGINAS', w ? '1' : '0', w ? 'bad' : 'dim'], ['ERRO DO CLIENTE', '0%', 'dim'], ['HORA', '03:00', 'dim']];
          o.res = w ? [['acordou alguém para nada', 'bad']] : []; } },
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
        if (ww > 70) { x.fillStyle = BAD(); x.textAlign = 'center'; fitFont(x, u, 'espera por lock 1.620', 12, ww - 8); x.fillText('espera por lock 1.620', u(xw + ww / 2), u(by - 4.5)); } }
      const lab = thou(dur); x.textAlign = 'left'; x.fillStyle = est && g > 0.3 ? BAD() : toneC('hi'); fitFont(x, u, lab, 12.5, 64);
      const xe = sx(st + dur) + 4; x.fillText(lab, u(Math.min(xe, W_ - 64)), u(Y + rh / 2));
    });
    x.globalAlpha = 1;
    // eixo e total
    const ay = H_ - 18; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(bx0), u(ay - 8)); x.lineTo(u(bx1), u(ay - 8)); x.stroke();
    if (c.orphan) { x.fillStyle = BAD(); x.textAlign = 'left'; const s = 'estoque ← PedidoCriado: trace órfão, trace_id novo'; fitFont(x, u, s, 13, W_ - 12); x.fillText(s, u(6), u(ay + 2)); }
    else { x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, '0 ms', 11, 60); x.fillText('0 ms', u(bx0), u(ay + 2));
      const s = `${thou(total)} ms` + (g >= 1 ? ' · estoque 86,5%' : ''); x.textAlign = 'right'; x.fillStyle = g > 0.3 ? BAD() : toneC('hi'); fitFont(x, u, s, 13, 300); x.fillText(s, u(bx1 + 64), u(ay + 2)); }
    if (c.ghost) { x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, 'head 1%: 7,7% de chance de existir', 13, W_ - 40); x.fillText('head 1%: 7,7% de chance de existir', u(W_ / 2), u(top + rh * 3.5)); }
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
      x.textAlign = 'center'; x.fillStyle = h.le[i] === '0,8' ? accC() : toneC('hi'); fitFont(x, u, h.le[i], 12.5, cw - 1); x.fillText(h.le[i], u(X + w / 2), u(bot + 11));
      x.fillStyle = INK(); fitFont(x, u, thou(cum), 11, cw - 1); x.fillText(thou(cum), u(X + w / 2), u(bot + 27)); });
    x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, 'le (s) e acumulado', 10.5, ax1 - ax0); x.fillText('le (s) e acumulado', u(ax0 + 2), u(bot + 42));
    const px = ax1 + 14; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(px - 7), u(top - 6)); x.lineTo(u(px - 7), u(bot + 30)); x.stroke();
    x.fillStyle = INK(); fitFont(x, u, 'PERCENTIS', 11, W_ - px - 6); x.fillText('PERCENTIS', u(px), u(top));
    h.pct.forEach(([l, v, tn], i) => { const Y = top + 24 + i * 38; x.fillStyle = INK(); fitFont(x, u, l, 12.5, 70); x.fillText(l, u(px), u(Y));
      x.fillStyle = toneC(tn); fitFont(x, u, v, 19, W_ - px - 8); x.fillText(v, u(px), u(Y + 17)); });
    if (!h.pct.length) { x.fillStyle = INK(); fitFont(x, u, 'SLO: p95 ≤ 0,8 s', 13, W_ - px - 6); x.fillText('SLO: p95 ≤ 0,8 s', u(px), u(top + 26)); }
  }
  // os logs: uma linha por evento; open = índice da linha aberta (campos extras embaixo); idx = destaca as colunas indexadas
  function drawLogs(x, u, C, l, W_, H_) {
    const COLS = [[6, 'hora', 0], [66, 'nível', 1], [124, 'serviço', 2], [226, 'trace_id', 3], [316, 'mensagem', 4]];
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
    if (l.idx) { x.fillStyle = accC(); const s = '▲ indexados: trace_id · pedido_id · celula · servico · versao · level'; fitFont(x, u, s, 12, W_ - 12); x.fillText(s, u(6), u(H_ - 14)); }
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
      x.fillStyle = BAD(); x.textAlign = 'center'; fitFont(x, u, 'página: 14,4×', 13, 140); x.fillText('página: 14,4×', u(lxx), u(top + 76)); x.textAlign = 'left'; return; }
    // o incidente (faixa vermelha) e o cursor
    x.fillStyle = BADBG(); const ie = Math.min(a.inc, a.cur); if (ie > 0) x.fillRect(u(sx(0)), u(top - 8), u(Math.max(1.5, sx(ie) - sx(0))), u(rh * 4 + 6));
    [0, 30, 60, 90, 120].forEach(s => { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(sx(s)), u(top - 8)); x.lineTo(u(sx(s)), u(top + rh * 4)); x.stroke();
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, clk2(s), 11.5, 80); x.fillText(clk2(s), u(sx(s)), u(top + rh * 4 + 9)); });
    ['A', 'B', 'C', 'D'].forEach((id, i) => { const R = RULES[id], on = a.rules.includes(id), Y = top + i * rh + rh / 2 - 4;
      x.textAlign = 'left'; x.fillStyle = on ? toneC('hi') : INK(); fitFont(x, u, R.lab, 13, ax0 - lx - 8); x.fillText(R.lab, u(lx), u(Y));
      if (!on) return;
      if (a.quiet) { x.fillStyle = accC(); fitFont(x, u, 'não dispara', 13, 120); x.fillText('não dispara', u(ax1 + 8), u(Y)); return; }
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const SPANTAB = () => `<table class="h3-sum"><tr><th>span</th><th>início</th><th>normal</th><th>1063</th></tr>${SPANS.map(([nm, s0, d], i) =>
    `<tr${on_(i === 4 && sc === 'traces' && step >= 1)}><td>${nm.replace('↳ ', '')}</td><td>${s0 > 36 ? thou(s0) + ' → ' + thou(s0 + 1620) : s0}</td><td>${d}</td><td>${i === 4 ? '<b>1.640</b>' : d}</td></tr>`).join('')}<tr><td>total</td><td></td><td>275</td><td><b>1.895</b></td></tr></table>`;
  const DATA = {
    pilares: () => `<li>Pedido <b>1063</b>: Lena (<code>lena-77</code>, <code>celula-recife</code>), quinta 03/12/2026 15:30:07.412; 3 canecas azuis 59,70 + frete 15,00 = <b>74,70</b>; caneca 29 → 26</li><li><code>trace_id</code> <code>9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52</code> (código de suporte <code>9c1e5a7b</code>); o do 1047 (módulo 6): <code>7f3a9c0e5b2d4186a9e3c7d1f0b84e26</code></li><li>1,9 s (1.895 ms) contra ~0,3 s (275 ms) do normal; o painel: <code>5xx</code> 0%, p95 0,489 s ≤ 0,8 s</li><li>A OpenTelemetry fala em <b>sinais</b> (traces, métricas, logs e <i>baggage</i>); "três pilares" é a forma do artigo</li><li>Observabilidade é propriedade, não ferramenta: sem o <code>trace_id</code> em tudo, não há correlação</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>le (s)</th><th>acumulado</th></tr>${HIST.le.map((l, i) => `<tr${on_(i === 6)}><td>${l}</td><td>${thou(HIST.cnt.slice(0, i + 1).reduce((a, b) => a + b, 0))}</td></tr>`).join('')}</table><li>p50 <b>0,293</b> · p95 <b>0,489</b> · p99 <b>0,765</b> · p99,9 <b>2,3125</b> s (o real ~1,9); com <code>le=2</code>: <b>1,875</b> s (conta nossa)</li><li>Percentis não se somam nem se tiram média: a "média dos p99" do módulo 14 dava 269 ms contra o p99 verdadeiro de 2.000 ms</li><li>Cardinalidade: 7 × 12 × 6 × 4 = <b>2.016</b>; × 11 = <b>22.176</b>; × 1,5 M de <code>cliente_id</code> = <b>33,3 bilhões</b></li><li>Métrica de negócio: <code>pedidos_frete_zero_total{cidade="recife"}</code> (a que achou o frete do módulo 22)</li><li>A janela de 1.000 requisições é definida no brief, não medida num Prometheus</li>`,
    logs: () => `<li><code>{"ts":"2026-12-03T15:30:09.068-03:00","level":"WARN","servico":"estoque","celula":"recife","versao":"2.6.0","trace_id":"9c1e5a7b…","span_id":"6d1f0a2b9e3c4a58","msg":"espera por lock","sku":"CANECA-007","lock_wait_ms":1620,"holder":"contagem-estoque","holder_pid":4412}</code></li><li>As 5 linhas do 1063: <code>gw-loja</code> (2), <code>pedidos</code> (2), <code>estoque</code> (1). Os horários 07.436, 09.304 e 09.307 saem da tabela de spans; as linhas de outros pedidos são ilustrativas</li><li>Volume: 5 serviços × ~3 linhas × ~300 B = <b>4,5 KB</b> por pedido; dia comum <b>2,81 GB/dia</b>; pico o dia todo <b>25,5 GB/dia</b> (765 GB em 30 dias); com DEBUG <b>255 GB/dia</b></li><li>Níveis do artigo: TRACE, DEBUG, INFO, WARN, ERROR, FATAL</li>`,
    traces: () => `${SPANTAB()}<li><code>traceparent: 00-9c1e5a7b3d8f4a2e8b6c0d4f7a1e3b52-a3c4d5e6f7a8b9c0-01</code> (W3C Trace Context)</li><li>12 spans × ~400 B = <b>4,8 KB</b>; a 30 pedidos/s: 100% = <b>12,4 GB/dia</b>, 1% = <b>124 MB/dia</b></li><li>Head 1%: 1 − 0,99⁸ = <b>7,7%</b>; tail (todos os <code>5xx</code>, todos &gt; 800 ms, 1% do resto): os <b>8</b></li><li>As durações dos spans são exemplo do brief; não foi rodado um OpenTelemetry</li>`,
    correlacao: () => `<table class="h3-sum"><tr><th>sinal</th><th>responde</th><th>no 1063</th></tr><tr${on_(step === 0)}><td>métrica</td><td>que</td><td>8 pedidos &gt; 1 s</td></tr><tr${on_(step === 1)}><td>trace</td><td>onde</td><td>estoque, 86,5%</td></tr><tr${on_(step >= 2 && step <= 3)}><td>log</td><td>por quê</td><td>holder contagem-estoque</td></tr></table><li><code>contagem-estoque</code>: cron às :00 e :30, transação de 1,6 s com <code>FOR UPDATE</code> em <code>CANECA-007</code>; 5/s × 1,6 s = <b>8</b> pedidos</li><li>Não é o <code>relatorios</code>: ele lê da réplica do Rio (módulo 25). Conserto (fora do escopo): contar por <i>snapshot</i></li><li>Lamport, <i>Time, Clocks, and the Ordering of Events</i>: relógios de máquinas diferentes não ordenam eventos; o id, sim</li>`,
    alerta: () => `<table class="h3-sum"><tr><th>regra</th><th>dispara</th><th>MTTD</th></tr><tr${on_(step === 1)}><td>A: &gt; 5% por 5 min</td><td>nunca</td><td>∞</td></tr><tr${on_(step === 1)}><td>B: &gt; 5% por 1 min</td><td>20:21:00–15</td><td>60–75 s</td></tr><tr${on_(step === 2)}><td>C: sonda 10 s × 3</td><td>20:20:30</td><td>30 s</td></tr><tr${on_(step === 2)}><td>D: burn 14,4× (1 h e 5 min)</td><td>51,84 s de erro</td><td>~52–67 s</td></tr></table><li>Sem defesas: 30/s × 90 s = <b>2.700</b> falhas; burn de 100% de erro = 1 ÷ 0,001 = <b>1.000×</b></li><li>Com o breaker (abre em 1,3 s): ~<b>39</b> falhas; 1,44% (14,4×) no instante, 0,036% (0,36×) em 1 h, 0,43% (4,3×) em 5 min</li><li>O 1063: 8 em 1.500 em 5 min = 0,53% = <b>5,3×</b>; 0,044% em 1 h = <b>0,44×</b></li><li>SRE book: página para sintoma, causa para depurar</li>`,
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
  function readout() { if (active !== 'sinais') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
