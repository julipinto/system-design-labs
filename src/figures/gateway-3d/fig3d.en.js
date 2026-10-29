// Figura 3D (iso-glow): API Gateway. A loja abriu um app e uma API para parceiros, e precisa de uma porta só.
// Cena: ao fundo, o mostrador com os contadores, o pedido HTTP real e a resposta. À esquerda, os clientes (APP da Lena,
// SITE, PARCEIRO marketplace-xyz, ROBÔ do concorrente); no meio, o portão gw-loja com 4 estações (ROTA, AUTH, LIMITE,
// VERSÃO), e a estação que trabalha sobe e acende; à direita, os serviços (cada um atrás do seu load balancer).
// Mensagens correm nas vigas com o dado real (GET /api/v1/produtos/42, Authorization: Bearer eyJ…, 401, 403, 429, 404).
// Cenários (toggle e ?mode=sem|rota|auth|lb|versao; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/api-gateways-brief.md).
FIGS3D.push({ id: 'gateway', name: 'API Gateway', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['sem', 'rota', 'auth', 'lb', 'versao'];
  const SCNAME = { sem: 'Without', rota: 'Route', auth: 'Auth', lb: 'LB', versao: 'Version' };
  const SCFULL = { sem: 'Without gateway', rota: 'Routing and strip_path', auth: 'Authentication and authorization', lb: 'Gateway + load balancer', versao: 'Versioning and canary' };
  const AULA = { sem: 'aula-1-introducao-e-problemas-operacionais', rota: 'aula-4-roteamento-autenticacao-e-autorizacao', auth: 'aula-4-roteamento-autenticacao-e-autorizacao',
    lb: 'aula-3-api-gateway-vs-load-balancer', versao: 'aula-6-versionamento-de-apis' };
  let clk = 0, sc = 'rota', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-gateway3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // fileiras (y) comuns a clientes, estações e serviços; colunas (x): clientes 10–160, portão 290–470, serviços 600–780
  const PL = 7, ROW = [180, 250, 320, 390], CY = ROW.map(y => y + 28);
  const CXL = 10, CW = 150, GX = 290, GWD = 180, SX = 600, SW = 180, SD = 44;
  plateWith(g0, 800, 470, [[14, 14], [786, 14], [14, 456], [786, 456]]);
  hazeAndShadow(g0, 400, 235, 9.4, 5.8);
  // mostrador ao fundo
  rbox(150, 12, PL, 640, 12, 148, 5, bodyMat, g0);
  const SCW = 632, SCH = 135, scr = faceCanvas('front', 154, 24, 152, SCW, SCH, 5, g0);
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(w, d, h, lab, sub) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { g, mat, top, fr, fh, w, h, d, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const cli = (lab, sub) => block(CW, 56, 22, lab, sub), svc = (lab, sub) => block(SW, SD, 26, lab, sub);
  const B = {
    app: cli('APP', 'Lena · Recife'), site: cli('SITE', 'browser'), parc: cli('PARTNER', 'marketplace'), robo: cli('BOT', 'competitor'),
    cat: svc('CATALOGO', 'via lb-loja'), car: svc('CARRINHO', 'via lb'), ped: svc('PEDIDOS', 'via lb'), cli: svc('CLIENTES', 'via lb'),
    pag: svc('PAGAMENTOS', ''), est: svc('ESTOQUE', ''), ent: svc('ENTREGAS', ''),
    lbc: svc('LB-CATALOGO', 'round robin'), c1: svc('CATALOGO-1', '10.0.1.11'), c2: svc('CATALOGO-2', '10.0.1.12'), c3: svc('CATALOGO-3', '10.0.1.13'),
    pnovo: svc('PEDIDOS·NEW', 'v1 · inside'), pv2: svc('PEDIDOS-V2', 'v2 contract'),
  };
  const NAMES = Object.keys(B);
  // o portão: base com o nome na frente e 4 estações em cima, uma por fileira
  const GW = new THREE.Group(); g0.add(GW);
  rbox(GX, 172, PL, GWD, 282, 14, 8, bodyMat, GW);
  const gwFr = faceCanvas("front", GX + 3, 454, PL + 13, GWD - 6, 12, 9, GW);
  const STN = ['rota', 'auth', 'lim', 'ver'], STNAME = { rota: 'ROUTE', auth: 'AUTH', lim: 'LIMIT', ver: 'VERSION' };
  const ST = {};
  STN.forEach((nm, i) => { const g = new THREE.Group(); GW.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 166, 60, 12, 5, mat, g); const top = faceCanvas('top', 3, 3, 12, 160, 54, 5, g);
    ST[nm] = { g, mat, top, key: '', z: 0, y: ROW[i] - 2 }; g.position.copy(W(GX + 7, ROW[i] - 2, PL + 14)); });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const dotBad = capMat(); dotBad.emissive.set(0xff3a2a); dotBad.emissiveIntensity = 1.3;
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.on ? 5.5 : b.thin ? 2.4 : 3.5) * TS, d = C_.clone().sub(A), len = d.length();
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      for (const dt of (b.dots || (b.on && b.dot != null ? [b.dot] : []))) { if (nd >= DOTS.length) break; const D = DOTS[nd++], p = alongPts(b.pts, cum, dt);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, b.tone === 'bad' ? 0 : 0.9);
        D.g.children[0].material = b.tone === 'bad' ? dotBad : D.mat; }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera (balões fixos e mensagens que viajam) ──
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
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12)], MSGS = [tag(11), tag(11)];

  // ── lugares e rotas (no chão, z = 12) ──
  const Z = 12, SY = j => ROW[j] + 6, SCY = j => ROW[j] + 28;          // serviço na fileira j (centro em y)
  const SEMY = j => 172 + j * 48, SEMC = j => SEMY(j) + 22;             // sem gateway: 6 serviços mais juntos
  const CLI = { app: [CXL, ROW[0]], site: [CXL, ROW[1]], parc: [CXL, ROW[2]], robo: [CXL, ROW[3]] };
  const LAY = {
    sem: { ...CLI, cat: [SX, SEMY(0)], car: [SX, SEMY(1)], ped: [SX, SEMY(2)], pag: [SX, SEMY(3)], est: [SX, SEMY(4)], ent: [SX, SEMY(5)] },
    rota: { ...CLI, cat: [SX, SY(0)], car: [SX, SY(1)], ped: [SX, SY(2)], cli: [SX, SY(3)] },
    lb: { ...CLI, lbc: [SX, SY(0)], c1: [SX, SY(1)], c2: [SX, SY(2)], c3: [SX, SY(3)] },
    versao: { app: CLI.app, site: CLI.site, parc: CLI.parc, ped: [SX, SY(0)], pnovo: [SX, SY(1)], pv2: [SX, SY(2)] },
  };
  LAY.auth = LAY.rota;
  const SEMS = ['cat', 'car', 'ped', 'pag', 'est', 'ent'];
  const R = {
    cg: k => [[CXL + CW, CY[k], Z], [GX, CY[k], Z]],                   // cliente k → portão
    gs: j => [[GX + GWD, SCY(j), Z], [SX, SCY(j), Z]],                  // portão → serviço na fileira j
    dir: (k, j) => { const x = 200 + j * 46; return [[CXL + CW, CY[k], Z], [x, CY[k], Z], [x, SEMC(j), Z], [SX, SEMC(j), Z]]; },
    l2r: r => [[SX + SW, SCY(0) - 6, Z], [SX + SW + 12, SCY(0) - 6, Z], [SX + SW + 12, SCY(r), Z], [SX + SW, SCY(r), Z]],
    side: [[CXL + CW, CY[3], Z], [236, CY[3], Z], [236, 463, Z], [548, 463, Z], [548, SCY(2), Z], [SX, SCY(2), Z]],   // contorna o portão
    rlb: [[CXL + CW, CY[3], Z], [520, CY[3], Z], [520, SCY(0) + 8, Z], [SX, SCY(0) + 8, Z]],                              // robô direto ao LB
  };
  const rev = pts => pts.slice().reverse();
  const LG = r => [225, CY[r], 18], RG = r => [535, CY[r], 18];          // balões: nas faixas livres entre as colunas

  // ── conteúdo padrão ──
  const CLIROWS = {
    app: [['Lena · Recife', 8.5, 'dim'], ['store app', 10.5], ['token JWT', 8.5, 'dim']],
    site: [['browser', 8.5, 'dim'], ['loja.com.br', 10.5], ['token JWT', 8.5, 'dim']],
    parc: [['partner', 8.5, 'dim'], ['marketplace-xyz', 10.5], ['key=mk_live_…', 8.5, 'dim']],
    robo: [['competitor', 8.5, 'dim'], ['price bot', 10.5], ['500 requests/s', 8.5, 'bad']],
  };
  const SEMROWS = { cat: ['catalogo.loja.com.br', 'login: none'], car: ['carrinho.loja.com.br', 'login: token A'], ped: ['pedidos.loja.com.br', 'login: token A'],
    pag: ['pagamentos.loja.com.br', 'login: token B'], est: ['estoque.loja.com.br', 'login: token A'], ent: ['entregas.loja.com.br', 'login: token A'] };
  const svcRows = (a, b, ta = 'hi', tb = 'dim') => [[a, 10, ta], [b, 8.5, tb]];
  const STROWS = {
    rota: [['ROUTE', 11], ['4 routes', 8.6, 'dim'], ['path → service', 8.6, 'dim']],
    auth: [['AUTH', 11], ['JWT · API key', 8.6, 'dim'], ['who? allowed?', 8.6, 'dim']],
    lim: [['LIMIT', 11], ['10 requests/s', 8.6, 'dim'], ['per key', 8.6, 'dim']],
    ver: [['VERSION', 11], ['/api/v1 and /api/v2', 8.6, 'dim'], ['route by prefix', 8.6, 'dim']],
  };
  const stRows = (nm, ...l) => [[STNAME[nm], 11], ...l];

  function base() {
    const o = { pos: { ...LAY[sc] }, on: {}, rows: {}, lab: {}, so: {}, srows: { ...STROWS }, beams: [], tags: [], msgs: [],
      m: [], req: [], status: null, body: [], hideGw: sc === 'sem' };
    for (const nm in CLIROWS) o.rows[nm] = CLIROWS[nm];
    if (sc === 'sem') { SEMS.forEach(nm => { o.rows[nm] = svcRows(...SEMROWS[nm], 'hi', 'dim'); o.lab[nm] = [B[nm].lab, '']; });
      o.rows.app = [['Lena · Recife', 8.5, 'dim'], ['store app', 10.5], ['knows 6 URLs', 8.5, 'dim']];
      o.beams = SEMS.map((_, j) => ({ pts: R.dir(0, j), thin: true })); }
    if (sc === 'rota' || sc === 'auth') {
      o.rows.cat = svcRows('/api/v1/produtos', 'public, no login'); o.rows.car = svcRows('/api/v1/carrinho', 'needs login');
      o.rows.ped = svcRows('/api/v1/pedidos', 'needs login'); o.rows.cli = svcRows('/api/v1/clientes', 'needs login');
      o.beams = [0, 1, 2, 3].flatMap(k => [{ pts: R.cg(k) }, { pts: R.gs(k) }]); }
    if (sc === 'lb') {
      o.rows.lbc = svcRows('203.0.113.10', 'passes to replicas'); [1, 2, 3].forEach(r => o.rows['c' + r] = svcRows(`10.0.1.1${r}:8080`, 'identical copy'));
      o.beams = [{ pts: R.cg(0) }, { pts: R.cg(2) }, { pts: R.cg(3) }, { pts: R.gs(0) }, ...[1, 2, 3].map(r => ({ pts: R.l2r(r) }))]; }
    if (sc === 'versao') {
      o.rows.app = [['Lena · new app', 8.5, 'dim'], ['uses v2', 10.5], ['/api/v2/pedidos', 8.5, 'dim']];
      o.rows.site = [['old app', 8.5, 'dim'], ['uses v1', 10.5], ['/api/v1/pedidos', 8.5, 'dim']];
      o.rows.parc = [['marketplace-xyz', 8.5, 'dim'], ['uses v1', 10.5], ['/api/v1/pedidos', 8.5, 'dim']];
      o.lab.app = ['NEW APP', 'Lena']; o.lab.site = ['OLD APP', 'not updated'];
      o.rows.ped = svcRows('v1: "total": 94.90', 'number'); o.rows.pnovo = svcRows('v1: same contract', 'rewritten code'); o.rows.pv2 = svcRows('v2: "total": {…}', 'value + currency');
      o.lab.ped = ['PEDIDOS', 'v1'];
      o.beams = [{ pts: R.cg(0) }, { pts: R.cg(1) }, { pts: R.cg(2) }, { pts: R.gs(0) }, { pts: R.gs(1) }, { pts: R.gs(2) }]; }
    return o;
  }
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  // fluxo contínuo de pontos numa rota (rajadas, robô, canary): n pontos por volta de per segundos
  const stream = (o, pts, t, n, per, tone = '', cut) => o.beams.push({ pts, on: true, tone, cut, dots: Array.from({ length: n }, (_, i) => ((t / per + i / n) % 1) * (cut || 1)) });
  const meters = (o, ...m) => { o.m = m; };
  const res = (o, st, tone, ...body) => { o.status = [st, tone]; o.body = body; };
  const lit = (o, nm, v = 1) => { o.so[nm] = v; };

  const LENA_JWT = ['Authorization: Bearer eyJhbGciOi…'];
  const PAYLOAD = ['sub: lena-77', 'escopos: pedidos:ler,', '  pedidos:criar', 'exp: 1792000000'];

  const STEPS = {
    sem: [
      { id: 'urls', dur: 5, title: 'The app knows 6 addresses',
        story: 'The store from module 6 became six services, and each one answers at its own address: catalogo.loja.com.br, carrinho.loja.com.br, pedidos.loja.com.br and three more. Lena opens the app in Recife, and the app has to know all of them. To show the plush cat, it calls the catalog directly.',
        look: 'Six lines leave the APP, one for each service. The one that lights up carries GET /produtos/42 to CATALOGO.',
        key: 'Without a gateway, the client sees the store\'s internal split.',
        f(o, t) { meters(o, ['URLS THE APP KNOWS', '6', 'acc'], ['LOGIN METHODS', '—', 'dim'], ['TLS CERTIFICATES', '6', 'hi']);
          o.req = ['GET /produtos/42', 'Host: catalogo.loja.com.br'];
          if (t > 0.2) o.on.app = 1; send(o, t, 0.3, 1.3, R.dir(0, 0), 'GET /produtos/42', 'hi');
          if (t > 1.3 && t < 2.6) o.on.cat = 1;
          if (send(o, t, 1.7, 2.7, rev(R.dir(0, 0)), '200 · plush cat 79.90')) res(o, '200 OK', 'acc', '{"id":42,', ' "nome":"gato de pelúcia",', ' "preco":79.90}');
          if (t > 3.2) T(o, LG(1), 'the app stores\n6 addresses', 'hi'); } },
      { id: 'login', dur: 6, title: 'Each service checks the login its own way',
        story: 'To check out, the app goes to pedidos, which requires a token in the Authorization header. pagamentos checks a different token, in a different format, and the catalog accepts any of them. The app carries three ways of proving who Lena is, and each team wrote its own login code.',
        look: 'The request goes to PEDIDOS with token A and to PAGAMENTOS with token B. Each service shows the login it expects.',
        key: 'A common rule spread around: the same problem solved in every service.',
        f(o, t) { meters(o, ['URLS THE APP KNOWS', '6', 'acc'], ['LOGIN METHODS', t > 3 ? '3' : '2', 'bad'], ['TLS CERTIFICATES', '6', 'hi']); o.on.app = 1;
          o.req = ['POST /pedidos', 'Host: pedidos.loja.com.br', 'Authorization: token A', '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.3, R.dir(0, 2), 'POST /pedidos · token A', 'hi'); if (t > 1.3 && t < 2.8) o.on.ped = 1;
          if (send(o, t, 1.6, 2.5, rev(R.dir(0, 2)), '201 · order 1048', 'acc', 0.3)) res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          if (t > 2.9) o.req = ['POST /pagamentos', 'Host: pagamentos.loja.com.br', 'X-Token: token B', '{"pedido_id":1048,"valor":94.90}'];
          send(o, t, 3.0, 4.0, R.dir(0, 3), 'POST /pagamentos · token B', 'hi'); if (t > 4.0 && t < 5.4) o.on.pag = 1;
          if (send(o, t, 4.3, 5.1, rev(R.dir(0, 3)), '200 · pago', 'acc', 0.3)) res(o, '200 OK', 'acc', '{"pedido_id":1048,', ' "status":"pago"}');
          if (t > 1.2) o.rows.ped = svcRows('pedidos.loja.com.br', 'login: token A', 'hi', 'acc');
          if (t > 3.9) o.rows.pag = svcRows('pagamentos.loja.com.br', 'login: token B', 'hi', 'bad');
          if (t > 5.2) T(o, LG(1), '3 login methods\nin one app', 'bad'); } },
      { id: 'parceiro', dur: 5.5, title: 'The partner needs the same 6 URLs',
        story: 'The store opened an API for marketplace-xyz, which resells the plush cat. The partner has to keep the same six URLs and learn the three login methods. On the operations side that is 6 TLS certificates, 6 places to configure rules and 6 logs in different formats to join when something fails.',
        look: 'Six more lines leave the PARTNER and cross the APP\'s lines.',
        key: 'Every new client gets tied to the store\'s internal design.',
        f(o, t) { meters(o, ['URLS IN THE CLIENTS', t > 1 ? '2 × 6' : '6', 'bad'], ['TLS CERTIFICATES', '6', 'hi'], ['DIFFERENT LOGS', '6', 'hi']);
          SEMS.forEach((_, j) => o.beams.push({ pts: R.dir(2, j), thin: true }));
          o.req = ['GET /produtos/42?key=mk_live_…', 'Host: catalogo.loja.com.br']; o.on.parc = 1;
          send(o, t, 0.4, 1.4, R.dir(2, 0), 'GET /produtos/42', 'hi'); if (t > 1.4 && t < 2.8) o.on.cat = 1;
          if (send(o, t, 1.8, 2.8, rev(R.dir(2, 0)), '200 · 79.90', 'acc', 0.3)) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}');
          if (t > 3.2) { T(o, LG(3), '12 crossed lines\nfor 2 clients', 'bad'); T(o, RG(3), '6 certificates\n6 logs', 'hi'); } } },
      { id: 'robo', dur: 6, title: 'Black Friday: a bot asks 500 per second',
        story: 'On Black Friday, a competitor\'s bot asks for the plush cat\'s price 500 times per second, straight at catalogo.loja.com.br. The catalog handles 100 per second without degrading. To stop the bot, someone would have to put the same rule in the catalog and, to leave no gap, in the other five services.',
        look: 'The BOT hammers CATALOGO, which turns red. The display shows 500 requests per second against 100.',
        key: 'With no single entry point, there is no single place to block abuse.',
        f(o, t) { const r = Math.min(500, Math.round(t * 260)); meters(o, ['BOT REQUESTS/S', String(r), r > 100 ? 'bad' : 'hi'], ['THE CATALOG HANDLES', '100/s', 'hi'], ['PLACES TO BLOCK', '6', 'bad']);
          o.req = ['GET /produtos/42', 'Host: catalogo.loja.com.br', 'User-Agent: price-bot', '× 500 per second']; o.on.robo = 1;
          stream(o, R.dir(3, 0), t, 8, 1.1, r > 100 ? 'bad' : '');
          if (r > 100) { o.on.cat = 'bad'; o.rows.cat = svcRows('500/s arriving', 'handles 100/s', 'bad', 'dim'); res(o, 'slow · 2 s', 'bad', 'the plush cat page', 'is slow for everyone'); }
          if (t > 2.6) T(o, LG(3), '500 requests/s\nstraight at the catalog', 'bad');
          if (t > 3.6) T(o, RG(0), 'block here...\nand in the other 5', 'bad'); } },
      { id: 'troca', dur: 6.5, title: 'What if it goes wrong: pedidos changes address',
        story: 'The pedidos team rewrites the service and deploys the new version at a new address, pedidos2.loja.com.br (an example). The app installed on Lena\'s phone still calls the old address, and so does the partner. The old address goes offline and both get an error until they ship new code. An internal change became a problem for everyone who calls the store.',
        look: 'PEDIDOS changes address. The calls from APP and PARTNER to the old address come back red.',
        key: 'Without a single door, every client depends on the address of each service.',
        f(o, t) { meters(o, ['BROKEN CLIENTS', t > 2.2 ? (t > 4.2 ? '2' : '1') : '0', 'bad'], ['URLS TO CHANGE', '2', 'bad'], ['TLS CERTIFICATES', '7', 'hi']);
          if (t > 0.8) { o.rows.ped = svcRows('pedidos2.loja.com.br', 'new address', 'acc', 'dim'); o.lab.ped = ['PEDIDOS', 'new']; o.on.ped = 2; }
          if (t > 0.6 && t < 1.8) T(o, RG(2), 'new address\npedidos2.loja.com.br', 'acc');
          o.req = ['POST /pedidos', 'Host: pedidos.loja.com.br', '(the old address)'];
          [[0, 1.4], [2, 3.4]].forEach(([k, a]) => { const f = clamp((t - a) / 0.8) * 0.62; if (t > a) { o.on[k ? 'parc' : 'app'] = 'bad';
            o.beams.push({ pts: R.dir(k, 2), on: true, tone: 'bad', cut: f }); if (t < a + 1.6) o.msgs.push([R.dir(k, 2), f, 'pedidos.loja.com.br ✕', 'bad']); } });
          if (t > 2.2) res(o, 'DNS failure', 'bad', 'pedidos.loja.com.br', 'no longer exists');
          if (t > 4.8) { T(o, LG(0), 'Lena\'s app\nbroken', 'bad'); T(o, LG(3), 'partner\nbroken', 'bad'); } } },
    ],
    rota: [
      { id: 'porta', dur: 4.5, title: 'One door: api.loja.com.br',
        story: 'The store puts gw-loja in front of everything. The app, the site and the partner now know a single address, api.loja.com.br, and the gateway knows where to send each path. The services leave the internet and sit behind it, each with its own load balancer.',
        look: 'The gate appears in the middle, with four stations. Each service shows the route prefix that leads to it.',
        key: 'API Gateway: a single entry point in front of several services.',
        f(o, t) { meters(o, ['PUBLIC URLS', '1', 'acc'], ['ROUTES', '4', 'hi'], ['TLS CERTIFICATES', '1', 'hi']);
          o.req = ['gw-loja route table:', '/api/v1/produtos → catalogo', '/api/v1/carrinho → carrinho', '/api/v1/pedidos  → pedidos', '/api/v1/clientes → clientes'];
          if (t > 0.6) lit(o, 'rota', 2); if (t > 0.6) o.srows.rota = stRows('rota', ['api.loja.com.br', 8.6], ['4 routes · strip_path', 8.6, 'dim']);
          [0, 1, 2, 3].forEach(j => { if (t > 0.9 + j * 0.35) o.on[['cat', 'car', 'ped', 'cli'][j]] = 2; });
          if (t > 2.4) T(o, LG(1), 'everyone calls\napi.loja.com.br', 'acc'); } },
      { id: 'get', dur: 5.5, title: 'GET /api/v1/produtos/42 goes to the catalog',
        story: 'Lena opens the plush cat\'s page. The app sends GET /api/v1/produtos/42 to api.loja.com.br. The ROUTE station compares the path with the table, finds the prefix /api/v1/produtos and picks the catalogo service. This route is public: nobody asks for a login to see a price.',
        look: 'The request enters the gate, ROUTE rises and lights up with the rule that matched, and the light follows to CATALOGO.',
        key: 'Routing is picking the service by the path (and by the method).',
        f(o, t) { meters(o, ['ROUTED REQUESTS', t > 2.2 ? '1' : '0', 'acc'], ['PUBLIC URLS', '1', 'hi'], ['ROUTES', '4', 'hi']);
          o.req = ['GET /api/v1/produtos/42', 'Host: api.loja.com.br']; o.on.app = 1;
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'rota'); o.srows.rota = stRows('rota', ['/api/v1/produtos/*', 8.8, 'acc'], ['→ catalogo ✓', 9.4, 'acc']); }
          if (send(o, t, 2.2, 3.0, R.gs(0), 'GET … → catalogo', 'hi', 0.2)) o.on.cat = 1;
          if (send(o, t, 3.4, 4.4, rev([...R.cg(0), ...R.gs(0)]), '200 · plush cat 79.90')) res(o, '200 OK', 'acc', '{"id":42,', ' "nome":"gato de pelúcia",', ' "preco":79.90}');
          if (t > 1.6 && t < 3.4) T(o, LG(1), 'ROUTE: matched\n/api/v1/produtos', 'acc'); } },
      { id: 'strip', dur: 5.5, title: 'strip_path: the catalog receives /produtos/42',
        story: 'The catalog knows nothing about /api/v1: it serves /produtos/42, as it always did. With strip_path on, the gateway cuts the route prefix off the front before passing the request on. It receives /api/v1/produtos/42 and hands over /produtos/42. The price comes back, 79.90, and the gateway returns the response to Lena.',
        look: 'The message changes at the gate: /api/v1/produtos/42 goes in and /produtos/42 comes out.',
        key: 'strip_path: the public prefix stays in the gateway; the service sees its own path.',
        f(o, t) { meters(o, ['ROUTED REQUESTS', '2', 'acc'], ['PUBLIC URLS', '1', 'hi'], ['ROUTES', '4', 'hi']); o.on.app = 1;
          o.req = ['in:  GET /api/v1/produtos/42', 'out: GET /produtos/42', 'strip_path: true'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.3);
          if (t > 1.2) { lit(o, 'rota'); o.srows.rota = stRows('rota', ['cuts /api/v1', 9, 'acc'], ['strip_path ✓', 9, 'acc']); }
          if (send(o, t, 2.0, 3.0, R.gs(0), 'GET /produtos/42', 'acc', 0.4)) { o.on.cat = 1; o.rows.cat = svcRows('received /produtos/42', 'its own path', 'acc', 'dim'); }
          if (send(o, t, 3.5, 4.5, rev([...R.cg(0), ...R.gs(0)]), '200 · 79.90')) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}');
          if (t > 1.4 && t < 3.6) T(o, RG(1), 'out: /produtos/42\nno /api/v1', 'acc'); } },
      { id: 'metodo', dur: 6, title: 'Method + path: POST /api/v1/pedidos',
        story: 'Lena buys the plush cat. The app sends POST /api/v1/pedidos with { "produto": 42, "qtd": 1 }. The route matches by method and path, and this one requires login: AUTH checks the token (the Auth scenario shows how). pedidos creates order 1048: 79.90 for the plush cat plus 15.00 shipping, 94.90.',
        look: 'The light passes through ROUTE and AUTH and goes to PEDIDOS, in the third row. A 201 comes back with order 1048.',
        key: 'The route looks at method and path: the same service can have different rules for GET and POST.',
        f(o, t) { meters(o, ['ROUTED REQUESTS', t > 3.4 ? '3' : '2', 'acc'], ['PUBLIC URLS', '1', 'hi'], ['ROUTES', '4', 'hi']); o.on.app = 1;
          o.req = ['POST /api/v1/pedidos', 'Host: api.loja.com.br', ...LENA_JWT, '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.2, R.cg(0), 'POST /api/v1/pedidos', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'rota', t < 2.4 ? 1 : 2); o.srows.rota = stRows('rota', ['POST /api/v1/pedidos', 8.8, 'acc'], ['→ pedidos ✓', 9.4, 'acc']); }
          if (t > 2.0) { lit(o, 'auth', t < 3.2 ? 1 : 2); o.srows.auth = stRows('auth', ['needs login', 8.8], ['token ok ✓', 9.4, 'acc']); }
          if (send(o, t, 3.0, 4.0, [[GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]], 'POST /pedidos', 'hi', 0.2)) o.on.ped = 1;
          if (t > 4.0) o.rows.ped = svcRows('created 1048', '79.90 + 15.00', 'acc', 'dim');
          if (send(o, t, 4.4, 5.3, rev([...R.cg(0), [GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]]), '201 · order 1048'))
            res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          if (t > 5.3) T(o, RG(3), 'order 1048\ntotal 94.90'); } },
      { id: 'errado', dur: 6, title: 'What if it goes wrong: without strip_path',
        story: 'Someone configures the catalog route without strip_path. The gateway matches the route fine, but passes the whole path on: the catalog receives /api/v1/produtos/42, does not know that path and answers 404. The gateway only returns the error, and Lena sees "product not found" for a product that exists.',
        look: 'The message reaches CATALOGO with the prefix still attached and comes back red: 404.',
        key: 'Gateway and service have to agree on who cuts the path prefix.',
        f(o, t) { meters(o, ['ROUTED REQUESTS', '4', 'acc'], ['CATALOG 404s', t > 3.2 ? '1' : '0', 'bad'], ['ROUTES', '4', 'hi']); o.on.app = 1;
          o.req = ['in:  GET /api/v1/produtos/42', 'out: GET /api/v1/produtos/42', 'strip_path: false  ✕'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.3);
          if (t > 1.2) { lit(o, 'rota', 'bad'); o.srows.rota = stRows('rota', ['→ catalogo ✓', 9, 'acc'], ['strip_path: false', 9, 'bad']); }
          if (send(o, t, 1.9, 2.9, R.gs(0), 'GET /api/v1/produtos/42', 'bad', 0.3)) { o.on.cat = 'bad'; o.rows.cat = svcRows('/api/v1/produtos/42?', 'unknown path', 'bad', 'dim'); }
          if (send(o, t, 3.3, 4.4, rev([...R.cg(0), ...R.gs(0)]), '404 Not Found', 'bad')) res(o, '404 Not Found', 'bad', '(from the catalog)', 'Cannot GET', '/api/v1/produtos/42');
          if (t > 4.6) { o.on.app = 'bad'; T(o, LG(1), 'Lena sees\n"not found"', 'bad'); } } },
    ],
    auth: [
      { id: 'jwt', dur: 5, title: 'Lena sends the JWT',
        story: 'When Lena signed in to the app, she received a JWT. Now POST /api/v1/pedidos carries that token in the Authorization: Bearer eyJ… header. The AUTH station checks the signature (nobody tampered with the token) and the exp (it is still valid), and reads the sub: lena-77. That is authentication: knowing who is calling.',
        look: 'AUTH rises and shows what it read from the token: sub lena-77 and the validity checked.',
        key: 'Authentication: who you are. The gateway checks the token once, for all the services.',
        f(o, t) { meters(o, ['200 / 201', '0', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          o.req = ['POST /api/v1/pedidos', ...LENA_JWT, 'token payload:', ...PAYLOAD];
          send(o, t, 0.3, 1.3, R.cg(0), 'POST + Bearer eyJ…', 'hi', 0.3);
          if (t > 1.3) { lit(o, 'auth'); o.srows.auth = stRows('auth', [t > 2.2 ? 'signature ✓ · exp ✓' : 'checking…', 8.8, t > 2.2 ? 'acc' : 'dim'], [t > 3 ? 'sub: lena-77' : '', 9.4, 'acc']); }
          if (t > 3.4) T(o, LG(1), 'AUTH: it is Lena\nsub lena-77', 'acc'); } },
      { id: 'repassa', dur: 6, title: 'pedidos receives X-Cliente-Id: lena-77',
        story: 'Once it knows who she is, AUTH checks what she can do: the POST /api/v1/pedidos route asks for the pedidos:criar scope, and Lena\'s token has it. The gateway passes the request on with a new header, X-Cliente-Id: lena-77. pedidos opens no token: it trusts the header, creates order 1048 and answers 201.',
        look: 'The light leaves the gate for PEDIDOS carrying X-Cliente-Id. A 201 comes back with order 1048, total 94.90.',
        key: 'Authorization: what you can do. The pedidos:criar scope unlocks the route.',
        f(o, t) { meters(o, ['200 / 201', t > 4.2 ? '1' : '0', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          lit(o, 'auth', t < 2.4 ? 1 : 2); o.srows.auth = stRows('auth', ['scope pedidos:criar', 8.8], ['has it ✓', 9.4, 'acc']);
          o.req = ['POST /pedidos', '(to the pedidos service)', 'X-Cliente-Id: lena-77', '{"produto":42,"qtd":1}'];
          if (send(o, t, 1.4, 2.6, R.gs(2), 'X-Cliente-Id: lena-77', 'acc', 0.4)) { o.on.ped = 1; o.rows.ped = svcRows('client: lena-77', 'creates 1048', 'acc', 'dim'); }
          if (send(o, t, 3.2, 4.2, rev(R.gs(2)), '201 · order 1048', 'acc', 0.2)) res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          send(o, t, 4.3, 5.0, rev(R.cg(0)), '201 · 94.90', 'acc');
          if (t > 5.0) T(o, RG(3), 'order 1048\ntotal 94.90'); } },
      { id: 'dona', dur: 6, title: 'GET /api/v1/pedidos/1048: only the owner sees it',
        story: 'Lena opens order 1048 to see the total. The gateway checks the token and the pedidos:ler scope and passes it on with X-Cliente-Id: lena-77. Only pedidos knows that 1048 belongs to Lena, so it is the one that compares the header\'s client with the order\'s owner. They match, and the response goes out: 200, total 94.90.',
        look: 'PEDIDOS lights up and shows the comparison: owner lena-77, header lena-77.',
        key: 'The gateway checks the scope; only the service knows who owns each piece of data.',
        f(o, t) { meters(o, ['200 / 201', t > 4.4 ? '2' : '1', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          o.req = ['GET /api/v1/pedidos/1048', ...LENA_JWT, '→ X-Cliente-Id: lena-77'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'auth', t < 2.4 ? 1 : 2); o.srows.auth = stRows('auth', ['lena-77 ✓', 9], ['pedidos:ler ✓', 9, 'acc']); }
          if (send(o, t, 1.9, 2.9, R.gs(2), 'X-Cliente-Id: lena-77', 'acc', 0.2)) { o.on.ped = 1; o.rows.ped = [['1048: owner lena-77', 9.4, 'acc'], ['header lena-77 ✓', 8.8, 'acc']]; }
          if (send(o, t, 3.4, 4.2, rev(R.gs(2)), '200 · total 94.90', 'acc', 0.1)) res(o, '200 OK', 'acc', '{"id":1048,"total":94.90}');
          send(o, t, 4.3, 5.0, rev(R.cg(0)), '200 · 94.90', 'acc');
          if (t > 4.6) T(o, RG(3), 'pedidos checks\nthe owner: lena-77', 'acc'); } },
      { id: 'sem', dur: 5.5, title: 'No token: 401 at the gate',
        story: 'Some script sends POST /api/v1/pedidos without the Authorization header. AUTH has nothing to check and answers 401 Unauthorized right there. With an expired token, whose exp is in the past, the answer is the same. pedidos never even finds out that someone tried.',
        look: 'The light goes from the SCRIPT to the gate and stops at AUTH, which turns red. Nothing reaches PEDIDOS.',
        key: '401: the gateway does not know who you are.',
        f(o, t) { meters(o, ['200 / 201', '2', 'acc'], ['401', t > 2 ? '1' : '0', 'bad'], ['403', '0', 'hi']);
          o.lab.robo = ['SCRIPT', 'no token']; o.rows.robo = [['anyone', 8.5, 'dim'], ['no Authorization', 9.6], ['', 8]]; o.on.robo = 1;
          o.req = ['POST /api/v1/pedidos', 'Host: api.loja.com.br', '(no Authorization)', '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.3, R.cg(3), 'POST, no token', 'hi', 0.2);
          if (t > 1.3) { lit(o, 'auth', 'bad'); o.srows.auth = stRows('auth', ['no token ✕', 9.4, 'bad'], ['401 Unauthorized', 8.8, 'bad']); }
          if (send(o, t, 1.9, 2.9, rev(R.cg(3)), '401 Unauthorized', 'bad')) res(o, '401 Unauthorized', 'bad', '{"message":', ' "Unauthorized"}');
          o.rows.ped = svcRows('nothing arrived', 'never found out', 'dim', 'dim');
          if (t > 3.2) T(o, RG(3), 'PEDIDOS saw\nnothing', 'hi'); } },
      { id: 'escopo', dur: 6, title: 'The partner without scope: 403',
        story: 'marketplace-xyz calls with its own key, key=mk_live_…. AUTH recognizes the key: it is the partner, authenticated. But that key only has the produtos:ler scope, and creating an order requires pedidos:criar. The answer is 403 Forbidden: the gateway knows who it is, and who it is cannot do this.',
        look: 'AUTH lights up red and shows the missing scope. PEDIDOS stays dark.',
        key: '401 means "I don\'t know who you are"; 403 means "I know, and you can\'t."',
        f(o, t) { meters(o, ['200 / 201', '2', 'acc'], ['401', '1', 'bad'], ['403', t > 2.6 ? '1' : '0', 'bad']); o.on.parc = 1;
          o.req = ['POST /api/v1/pedidos?key=mk_live_…', 'Host: api.loja.com.br', 'key → marketplace-xyz', 'scopes: produtos:ler'];
          send(o, t, 0.3, 1.3, R.cg(2), 'POST key=mk_live_…', 'hi', 0.2);
          if (t > 1.3) { lit(o, 'auth', t < 2 ? 1 : 'bad'); o.srows.auth = stRows('auth', ['marketplace-xyz ✓', 9, 'acc'], [t > 2 ? 'missing pedidos:criar' : 'scope?', 8.8, t > 2 ? 'bad' : 'dim']); }
          if (send(o, t, 2.5, 3.5, rev(R.cg(2)), '403 Forbidden', 'bad')) res(o, '403 Forbidden', 'bad', 'required scope:', ' pedidos:criar', 'the key has: produtos:ler');
          if (t > 3.8) T(o, LG(3), 'known caller,\ncannot create', 'bad'); } },
      { id: 'direto', dur: 7, title: 'What if it goes wrong: direct call to pedidos',
        story: 'pedidos trusts any X-Cliente-Id because "the gateway already checked". But the internal network is open. Someone with access to it calls pedidos directly, without going through the gate, and writes X-Cliente-Id: lena-77 by hand. pedidos returns Lena\'s order 1048. The fix: close the network so that only the gateway reaches the services and, where the data is sensitive, have the service check the token too.',
        look: 'A red line goes around the gate at the front and reaches PEDIDOS, which returns Lena\'s order.',
        key: 'The gateway only protects what can only be reached through it.',
        f(o, t) { meters(o, ['200 / 201', '3', 'bad'], ['401', '1', 'hi'], ['403', '1', 'hi']);
          o.lab.robo = ['INTRUDER', 'internal network']; o.rows.robo = [['inside the network', 8.5, 'dim'], ['pretends to be lena-77', 9.6, 'bad'], ['no token', 8.5, 'dim']]; o.on.robo = 'bad';
          o.req = ['GET /pedidos/1048', 'Host: pedidos:8080', '(direct, no gateway)', 'X-Cliente-Id: lena-77  (written by hand)'];
          lit(o, 'auth', 0); o.srows.auth = stRows('auth', ['never saw it', 9.4, 'dim'], ['the request went around', 8.6, 'dim']);
          if (send(o, t, 0.4, 2.0, R.side, 'X-Cliente-Id: lena-77', 'bad', 0.3)) { o.on.ped = 'bad'; o.rows.ped = svcRows('trusted the header', 'handed over 1048', 'bad', 'dim'); }
          if (send(o, t, 2.6, 4.0, rev(R.side), 'Lena\'s order 1048', 'bad', 0.6)) res(o, '200 OK  ✕', 'bad', '{"id":1048,', ' "cliente":"lena-77",', ' "total":94.90}');
          if (t > 4.4) { T(o, [400, 462, 30], 'went around\nthe gate', 'bad'); T(o, RG(0), 'fix: only the gateway\nreaches the services', 'acc'); } } },
    ],
    lb: [
      { id: 'cadeia', dur: 6, title: 'app → gw-loja → lb-loja → replica',
        story: 'Behind the gateway, the load balancers from module 7 are still there. Lena asks for GET /api/v1/produtos/42: gw-loja picks the service, the catalog, and hands it to lb-loja. lb-loja picks one of the 3 identical replicas, in round robin, and it is catalogo-1\'s turn (10.0.1.11:8080).',
        look: 'The light crosses the three pieces: the gate, LB-CATALOGO and CATALOGO-1, which lights up.',
        key: 'Together: the gateway picks which API; the load balancer picks which copy.',
        f(o, t) { meters(o, ['REQUESTS', t > 3.4 ? '1' : '0', 'acc'], ['REPLICAS', '3', 'hi'], ['PLUSH CAT PAGE', '20 ms', 'acc']); o.on.app = 1;
          o.req = ['GET /api/v1/produtos/42', 'Host: api.loja.com.br', '→ lb-loja 203.0.113.10', '→ catalogo-1 10.0.1.11:8080'];
          send(o, t, 0.3, 1.1, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.2);
          if (t > 1.1) { lit(o, 'rota', t < 2.2 ? 1 : 2); o.srows.rota = stRows('rota', ['→ catalogo', 9.4, 'acc'], ['(which API)', 8.6, 'dim']); }
          if (send(o, t, 1.6, 2.4, R.gs(0), 'GET /produtos/42', 'hi', 0.2)) o.on.lbc = 1;
          if (t > 2.4) o.rows.lbc = svcRows('round robin', '→ catalogo-1', 'hi', 'acc');
          if (send(o, t, 2.6, 3.4, R.l2r(1), '→ 10.0.1.11', 'acc', 0.2)) o.on.c1 = 1;
          if (send(o, t, 3.8, 4.8, rev([...R.cg(0), ...R.gs(0)]), '200 · 79.90 · 20 ms')) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}', '(from catalogo-1)');
          if (t > 4.8) T(o, LG(1), 'gateway: which API\nLB: which copy', 'acc'); } },
      { id: 'gw', dur: 7, title: 'The gateway decides which API, who and how much',
        story: 'The partner asks for the same product with its key. At the gate, the decisions are about governance: which service answers the path, who is calling, how many requests per second this key can still make, in which version of the API. None of them depends on which replica answers.',
        look: 'The gate\'s four stations light up one after the other, each with the decision it made for the partner\'s request.',
        key: 'Gateway: several different APIs, with rules for who calls what, how much and in which version.',
        f(o, t) { meters(o, ['REQUESTS', '2', 'acc'], ['DECISIONS AT THE GATE', String(Math.min(4, Math.max(0, Math.floor((t - 1.1) / 0.9) + 1))), 'acc'], ['LIMIT (10/s)', '9 left', 'hi']); o.on.parc = 1;
          o.req = ['GET /api/v1/produtos/42?key=mk_live_…', 'Host: api.loja.com.br'];
          send(o, t, 0.3, 1.1, R.cg(2), 'GET … key=mk_live_…', 'hi', 0.2);
          const D = { rota: [['→ catalogo', 9.4, 'acc'], ['which API', 8.6, 'dim']], auth: [['marketplace-xyz', 9.4, 'acc'], ['who: produtos:ler ✓', 8.2, 'dim']],
            lim: [['1st request this s', 9, 'acc'], ['9 of 10 left', 8.6, 'dim']], ver: [['v1', 9.4, 'acc'], ['which version', 8.6, 'dim']] };
          STN.forEach((nm, i) => { const a = 1.1 + i * 0.9; if (t > a) { lit(o, nm, t < a + 0.9 ? 1 : 2); o.srows[nm] = stRows(nm, ...D[nm]); } });
          if (send(o, t, 4.9, 5.6, R.gs(0), 'GET /produtos/42', 'hi', 0.1)) o.on.lbc = 1;
          if (send(o, t, 5.7, 6.3, R.l2r(2), '→ 10.0.1.12', 'acc', 0.2)) { o.on.c2 = 1; res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}', '(from catalogo-2)'); }
          if (t > 4.6) T(o, LG(3), 'per-client rules\nstay at the gate', 'acc'); } },
      { id: 'rr', dur: 6, title: 'The LB decides which replica',
        story: 'lb-loja knows nothing about keys, scopes or versions. It sees three identical replicas and spreads the load: after catalogo-2, the next request goes to catalogo-3, and the following one goes back to 1. It is also the one that takes a replica out of the pool when it fails the health check. It works with any protocol, at L4 or L7.',
        look: 'Three requests arrive at LB-CATALOGO, and each one goes to a different replica.',
        key: 'Load balancer: N copies of the same thing, with the load spread among them.',
        f(o, t) { o.rows.lbc = svcRows('round robin', '3 → 1 → 2', 'hi', 'acc'); let n = 0;
          [3, 1, 2].forEach((r, i) => { const a = 0.4 + i * 1.5; if (send(o, t, a, a + 0.7, R.gs(0), `request ${i + 3}`, 'hi', 0.05)) o.on.lbc = 1;
            if (send(o, t, a + 0.75, a + 1.35, R.l2r(r), `→ 10.0.1.1${r}`, 'acc', 0.1)) { o.on['c' + r] = 1; n = i + 1; } });
          meters(o, ['REQUESTS', String(2 + n), 'acc'], ['SPREAD', `${1 + (n >= 2)} · ${1 + (n >= 3)} · ${n >= 1 ? 1 : 0}`, 'hi'], ['PLUSH CAT PAGE', '20 ms', 'acc']);
          o.req = ['(the LB reads no key or scope)', 'pool: 10.0.1.11, .12, .13', 'port 8080 · round robin'];
          if (n) res(o, '200 OK', 'acc', `(from catalogo-${[3, 1, 2][n - 1]})`);
          if (t > 5.0) T(o, RG(3), 'LB: spreads across\nidentical copies', 'acc'); } },
      { id: 'robo', dur: 6.5, title: 'The bot stops at the gate',
        story: 'The competitor\'s bot sends 500 requests per second, with its own key. The LIMIT station lets 10 per second per key through and answers 429 Too Many Requests to the other 490, with Retry-After: 1. Behind the gate, lb-loja spreads only those 10 among the 3 replicas, and Lena\'s page stays at 20 ms.',
        look: 'LIMIT lights up. Almost all of the BOT\'s dots come back red; only a thin thread goes on to the LB.',
        key: 'The per-client limit sits in the gateway, before the load reaches the service.',
        f(o, t) { const r = Math.min(500, Math.round(t * 260)); meters(o, ['429s PER SECOND', String(Math.max(0, r - 10)), 'bad'], ['REACH THE LB', r ? '10/s' : '0', 'acc'], ['PLUSH CAT PAGE', '20 ms', 'acc']);
          o.on.robo = 1; o.req = ['GET /api/v1/produtos/42?key=…', 'User-Agent: price-bot', '× 500 per second'];
          stream(o, R.cg(3), t, 8, 1.0, '');
          if (t > 0.8) { lit(o, 'lim', 'bad'); o.srows.lim = stRows('lim', ['10/s per key', 9.2], [`429 · ${Math.max(0, r - 10)}/s`, 9.4, 'bad']);
            stream(o, [[GX, CY[3] + 14, Z], [CXL + CW, CY[3] + 14, Z]], t, 6, 0.9, 'bad');
            res(o, '429 Too Many Requests', 'bad', 'Retry-After: 1', 'RateLimit-Limit: 10', 'RateLimit-Remaining: 0'); }
          if (t > 1.4) { o.beams.push({ pts: R.gs(0), on: true, dots: [(t * 0.7) % 1] }); o.on.lbc = 1; [1, 2, 3].forEach(k => o.beams.push({ pts: R.l2r(k), on: true, dots: [((t * 0.7) + k / 3) % 1] })); }
          if (t > 3.4) T(o, LG(2), '490/s → 429\n10/s get through', 'bad'); } },
      { id: 'errado', dur: 7, title: 'What if it goes wrong: only the LB in front',
        story: 'Now take the gateway away and leave lb-loja exposed. It does what it knows how to do: it spreads the load. The bot\'s 500 requests per second become about 167 on each replica, and the catalog handles 100 per second. All three slow down together, and Lena\'s page goes from 20 ms to 2 s. The LB spread the attack evenly, because blocking abuse is not its job.',
        look: 'The gate disappears. The BOT\'s dots go straight to LB-CATALOGO, and the three replicas turn red.',
        key: 'The load balancer distributes; the gateway is what applies per-client rules.',
        f(o, t) { o.hideGw = true; o.beams = [{ pts: R.rlb }, ...[1, 2, 3].map(r => ({ pts: R.l2r(r) }))];
          const r = Math.min(500, Math.round(t * 200)), slow = r > 100; o.on.robo = 1;
          meters(o, ['REQUESTS/S AT THE LB', String(r), slow ? 'bad' : 'hi'], ['PER REPLICA', `~${Math.round(r / 3)}/s`, slow ? 'bad' : 'hi'], ['PLUSH CAT PAGE', slow ? (t > 3.2 ? '2 s' : '0.8 s') : '20 ms', slow ? 'bad' : 'acc']);
          o.req = ['GET /produtos/42', 'Host: 203.0.113.10  (the exposed LB)', 'User-Agent: price-bot', '× 500 per second'];
          stream(o, R.rlb, t, 9, 1.2, slow ? 'bad' : ''); o.on.lbc = 1; o.rows.lbc = svcRows('spreads everything', 'blocks nobody', 'hi', slow ? 'bad' : 'dim');
          [1, 2, 3].forEach(k => { stream(o, R.l2r(k), t + k * 0.3, 2, 0.7, slow ? 'bad' : ''); if (slow) { o.on['c' + k] = 'bad'; o.rows['c' + k] = svcRows(`~${Math.round(r / 3)}/s`, 'slow', 'bad', 'dim'); } });
          if (slow) res(o, t > 3.2 ? 'slow · 2 s' : 'slow · 0.8 s', 'bad', 'the plush cat page', 'from 20 ms to 2 s');
          if (t > 3.6) T(o, LG(1), 'no gate:\nnobody blocks', 'bad'); } },
    ],
    versao: [
      { id: 'v1', dur: 5.5, title: 'v1: the total is a number',
        story: 'The old app, which is still on many phones, calls GET /api/v1/pedidos/1048. The /api/v1/pedidos route leads to the pedidos service, which answers as it always did: { "id": 1048, "total": 94.90 }. The old app and the partner read the total as a number.',
        look: 'VERSION lights up with v1 and the light goes to PEDIDOS (v1). The response carries the total as a number.',
        key: 'Contract: the format the client expects to receive.',
        f(o, t) { meters(o, ['V1 CALLS', t > 3.6 ? '1' : '0', 'acc'], ['V2 CALLS', '0', 'hi'], ['VERSIONS LIVE', '1', 'hi']); o.on.site = 1;
          o.req = ['GET /api/v1/pedidos/1048', 'Host: api.loja.com.br', '→ pedidos: GET /pedidos/1048'];
          send(o, t, 0.3, 1.2, R.cg(1), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'ver', t < 2.3 ? 1 : 2); o.srows.ver = stRows('ver', ['/api/v1/pedidos', 9, 'acc'], ['→ pedidos (v1)', 9, 'acc']); }
          if (send(o, t, 1.7, 2.5, [[GX + GWD, CY[1], Z], [GX + GWD + 40, CY[1], Z], [GX + GWD + 40, SCY(0), Z], [SX, SCY(0), Z]], 'GET /pedidos/1048', 'hi', 0.2)) o.on.ped = 1;
          if (send(o, t, 2.8, 3.6, rev(R.gs(0)), '{"total": 94.90}', 'acc', 0.4)) res(o, '200 OK  (v1)', 'acc', '{ "id": 1048,', '  "total": 94.90 }');
          if (t > 4.0) T(o, RG(3), 'v1: total is\na number', 'acc'); } },
      { id: 'v2', dur: 6, title: 'v2: the total becomes an object',
        story: 'The store is going to sell in other currencies, and the pedidos team changes the format: the total becomes { "valor": 94.90, "moeda": "BRL" }. That breaks whoever expected a number, so the new format ships as v2, in a service of its own, pedidos-v2. The gateway receives /api/v2/pedidos/1048 and hands /pedidos/1048 to pedidos-v2.',
        look: 'The NEW APP calls /api/v2 and the light goes to PEDIDOS-V2. On the display, the v2 response with the total as an object.',
        key: 'A field changed shape: the contract changed, and that calls for a new version.',
        f(o, t) { meters(o, ['V1 CALLS', '1', 'acc'], ['V2 CALLS', t > 3.8 ? '1' : '0', 'acc'], ['VERSIONS LIVE', '2', 'acc']); o.on.app = 1;
          o.req = ['GET /api/v2/pedidos/1048', 'Host: api.loja.com.br', '→ pedidos-v2: GET /pedidos/1048'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v2/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'ver', t < 2.4 ? 1 : 2); o.srows.ver = stRows('ver', ['/api/v2/pedidos', 9, 'acc'], ['→ pedidos-v2', 9, 'acc']); }
          const p = [[GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]];
          if (send(o, t, 1.8, 2.7, p, 'GET /pedidos/1048', 'hi', 0.2)) o.on.pv2 = 1;
          if (send(o, t, 3.0, 3.8, rev(p), '{"total": {…}}', 'acc', 0.4)) res(o, '200 OK  (v2)', 'acc', '{ "id": 1048,', '  "total": { "valor": 94.90,', '    "moeda": "BRL" } }');
          if (t > 4.2) { T(o, RG(3), 'v2: total is\nan object', 'acc'); T(o, LG(1), 'v1: 94.90\nv2: {valor, moeda}', 'hi'); } } },
      { id: 'juntos', dur: 6, title: 'v1 and v2 live at the same time',
        story: 'Both versions coexist. Lena\'s new app uses v2; whoever did not update the app, and marketplace-xyz, stay on v1. The gateway tells them apart by the path prefix, and each client migrates when it can, with nobody breaking in the middle.',
        look: 'Three calls at the same time: two go to PEDIDOS (v1) and one to PEDIDOS-V2.',
        key: 'Versioning in the path lets old and new clients use the store together.',
        f(o, t) { o.on.app = o.on.site = o.on.parc = 1; lit(o, 'ver'); o.srows.ver = stRows('ver', ['v1 → pedidos', 9, 'acc'], ['v2 → pedidos-v2', 9, 'acc']);
          const to1 = k => [[GX + GWD, CY[k], Z], [GX + GWD + 40 + k * 14, CY[k], Z], [GX + GWD + 40 + k * 14, SCY(0) + k * 6 - 6, Z], [SX, SCY(0) + k * 6 - 6, Z]];
          const to2 = [[GX + GWD, CY[0], Z], [GX + GWD + 30, CY[0], Z], [GX + GWD + 30, SCY(2), Z], [SX, SCY(2), Z]];
          stream(o, R.cg(0), t, 2, 1.6); stream(o, R.cg(1), t + 0.5, 2, 1.6); stream(o, R.cg(2), t + 1, 2, 1.6);
          stream(o, to2, t, 2, 1.6); stream(o, to1(1), t + 0.5, 2, 1.6); stream(o, to1(2), t + 1, 2, 1.6);
          o.on.ped = 1; o.on.pv2 = 1; const n = Math.floor(t * 1.25);
          meters(o, ['V1 CALLS', String(1 + n * 2), 'acc'], ['V2 CALLS', String(1 + n), 'acc'], ['VERSIONS LIVE', '2', 'acc']);
          o.req = ['NEW APP:   GET /api/v2/pedidos/1048', 'OLD APP:   GET /api/v1/pedidos/1048', 'PARTNER:   GET /api/v1/pedidos/1048'];
          res(o, '200 OK  (both)', 'acc', 'v1 → "total": 94.90', 'v2 → "total": {"valor":94.90,', '      "moeda":"BRL"}');
          if (t > 2.6) T(o, RG(3), 'each client migrates\nwhen it can', 'acc'); } },
      { id: 'canary', dur: 8, title: 'Canary: 10% → 50% → 100%',
        story: 'The team also rewrote pedidos v1 inside, without changing the contract. To avoid swapping everything at once, the gateway sends 10% of the v1 traffic to the new implementation. The errors stay the same as the old one\'s, so it goes up to 50% and then to 100%. If the errors had risen, it would just go back to 0%.',
        look: 'PEDIDOS·NEW receives a bigger and bigger slice of the v1 dots: 1 in 10, then half, then all.',
        key: 'Canary: the new version gets a slice of the traffic before it gets all of it.',
        f(o, t) { const pc = t < 2.6 ? 10 : t < 5.2 ? 50 : 100; o.on.site = o.on.parc = 1;
          lit(o, 'ver'); o.srows.ver = stRows('ver', ['v1: canary', 9, 'acc'], [`${pc}% → new`, 10, 'acc']);
          meters(o, ['V1 ON THE NEW IMPLEMENTATION', pc + '%', 'acc'], ['ERRORS (OLD × NEW)', 'equal', 'acc'], ['CONTRACT', 'the same', 'hi']);
          const toOld = [[GX + GWD, CY[1] + 6, Z], [GX + GWD + 50, CY[1] + 6, Z], [GX + GWD + 50, SCY(0), Z], [SX, SCY(0), Z]], toNew = R.gs(1);
          stream(o, R.cg(1), t, 3, 1.2); stream(o, R.cg(2), t + 0.4, 3, 1.2);
          const N = 10, k = Math.round(N * pc / 100);
          if (k < N) stream(o, toOld, t, Math.max(1, Math.round((N - k) / 2.5)), 1.4); else o.beams.push({ pts: toOld });
          stream(o, toNew, t + 0.2, Math.max(1, Math.round(k / 2.5)), 1.4);
          o.on.pnovo = 1; o.on.ped = pc < 100 ? 2 : 0; o.rows.pnovo = svcRows(`gets ${pc}% of v1`, 'same contract', 'acc', 'dim');
          o.rows.ped = svcRows(`gets ${100 - pc}% of v1`, pc < 100 ? 'old code' : 'can go', pc < 100 ? 'hi' : 'dim', 'dim');
          o.req = ['GET /api/v1/pedidos/1048', `${100 - pc}% → pedidos (old)`, `${pc}% → pedidos·new`, '(the client does not notice)'];
          res(o, '200 OK  (v1)', 'acc', '{ "id": 1048,', '  "total": 94.90 }', '(same in both)');
          if (t > 6.2) T(o, RG(3), '100% on the new one\nsame errors', 'acc'); } },
      { id: 'desliga', dur: 7, title: 'What if it goes wrong: v1 shut down early',
        story: 'With almost everyone on v2, someone removes the /api/v1/pedidos route from the gateway. marketplace-xyz had not migrated yet: each of its calls comes back 404, "no Route matched with those values", and the partner stops selling the plush cat. The fix: warn with a deadline, using the Deprecation and Sunset headers in the v1 responses, and check in the gateway who still calls v1 before shutting it down.',
        look: 'VERSION turns red, and the PARTNER\'s calls stop at the gate and come back 404.',
        key: 'Only shut a version down when the gateway shows that nobody calls it anymore.',
        f(o, t) { meters(o, ['PARTNER 404s', String(Math.max(0, Math.floor((t - 1.8) * 2))), 'bad'], ['V2 CALLS', 'normal', 'acc'], ['VERSIONS LIVE', '1', 'hi']);
          o.on.app = 1; o.on.parc = t > 2 ? 'bad' : 1; o.on.pv2 = 1; o.pos.ped = null; o.pos.pnovo = null; o.pos.site = null;
          o.beams = [{ pts: R.cg(0) }, { pts: R.cg(2) }, { pts: R.gs(2) }];
          o.rows.parc = [['marketplace-xyz', 8.5, 'dim'], ['still on v1', 10.5, 'bad'], ['/api/v1/pedidos', 8.5, 'dim']];
          stream(o, R.cg(0), t, 2, 1.6); stream(o, [[GX + GWD, CY[0], Z], [GX + GWD + 30, CY[0], Z], [GX + GWD + 30, SCY(2), Z], [SX, SCY(2), Z]], t, 2, 1.6);
          o.req = ['GET /api/v1/pedidos/1048?key=mk_live_…', 'Host: api.loja.com.br', '(the /api/v1/pedidos route was removed)'];
          send(o, t, 0.4, 1.4, R.cg(2), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.4) { lit(o, 'ver', 'bad'); o.srows.ver = stRows('ver', ['/api/v1/pedidos', 9, 'bad'], ['route removed ✕', 9, 'bad']); }
          if (send(o, t, 1.8, 2.8, rev(R.cg(2)), '404 Not Found', 'bad', 0.6)) res(o, '404 Not Found', 'bad', '{"message":', ' "no Route matched', '  with those values"}');
          if (t > 3.6) { T(o, LG(3), 'the partner stopped\nselling the plush cat', 'bad'); T(o, RG(0), 'before: Deprecation\nand Sunset on v1', 'acc'); } } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW, min = 6.8) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(min, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawRows(cv, rows, on, Wd) {
    const { x, u } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : '');
    let y = 3; x.textAlign = 'left';
    for (const [text, s0, tn] of rows) { const s = Math.max(s0 * 1.3, 9.6), lh = s * 1.3; y += lh / 2; if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, s, Wd - 10, 7.5); x.fillText(text, u(5), u(y)); } y += lh / 2; }
    cv.tex.needsUpdate = true;
  }
  function drawBlock(Bk, rows, on, lab) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key; drawRows(Bk.top, rows, on, Bk.w - 6); }
    const [l, sub] = lab || [Bk.lab, Bk.sub];
    const fk = l + sub + on + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(7, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; x.font = `700 ${u(big)}px ${MONO3}`; x.fillText(l, u(3), u(mid));
      const lw = x.measureText(l).width / P; if (sub) { x.fillStyle = INK(); fitFont(x, u, sub, small, Bk.w - 14 - lw, 7); x.fillText(sub, u(9 + lw), u(mid)); }
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  function drawGwFront() {
    const k = theme + accent.getHex(); if (drawGwFront.k === k) return; drawGwFront.k = k;
    const cv = gwFr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = accC(); x.font = `700 ${u(10)}px ${MONO3}`; x.fillText('GW-LOJA', u(3), u(6.3));
    const lw = x.measureText('GW-LOJA').width / P; x.fillStyle = INK(); x.font = `700 ${u(8)}px ${MONO3}`; x.fillText('api.loja.com.br', u(9 + lw), u(6.3));
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.m, o.req, o.status, o.body, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P, u = v => v * P, C = pal3();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, w = 180) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, w); x.fillText(t, u(X), u(Y)); };
    o.m.forEach(([l, v, tn], i) => { lbl(l, 10, 12 + i * 42, 176); x.fillStyle = toneC(tn); fitFont(x, u, v, 20, 176); x.fillText(v, u(10), u(32 + i * 42)); });
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(196), u(6)); x.lineTo(u(196), u(129)); x.moveTo(u(446), u(6)); x.lineTo(u(446), u(129)); x.stroke();
    lbl('HTTP REQUEST · ' + SCNAME[sc].toUpperCase(), 206, 12, 230);
    const rl = o.req.slice(0, 6), fs0 = rl.length > 4 ? 9 : 10.4;
    rl.forEach((l, i) => { x.fillStyle = i === 0 ? C.inkHi : INK(); fitFont(x, u, l, fs0, 232); x.fillText(l, u(206), u(30 + i * (fs0 + 6))); });
    lbl('RESPONSE', 456, 12, 170);
    if (o.status) { x.fillStyle = toneC(o.status[1]); fitFont(x, u, o.status[0], 14, 168); x.fillText(o.status[0], u(456), u(32));
      o.body.slice(0, 5).forEach((l, i) => { x.fillStyle = C.inkHi; fitFont(x, u, l, 9, 168); x.fillText(l, u(456), u(52 + i * 15)); }); }
    else { x.fillStyle = INK(); x.font = `700 ${u(10)}px ${MONO3}`; x.fillText('…', u(456), u(32)); }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Names, keys and tokens are examples from the module; api.loja.com.br and 203.0.113.10 follow the documentation range.</li>';
  const DATA = {
    sem: () => `<table class="h3-sum"><tr><th></th><th>without gateway</th><th>with gateway</th></tr><tr><td>URLs in the client</td><td>6</td><td>1</td></tr><tr><td>login methods</td><td>3</td><td>1</td></tr><tr><td>TLS certificates</td><td>6</td><td>1</td></tr><tr><td>where to block the bot</td><td>6 places</td><td>1</td></tr><tr><td>logs</td><td>6 formats</td><td>1 place</td></tr></table>
      <li>Bot on Black Friday: <b>500 requests/s</b>; the catalog handles <b>100/s</b> without degrading</li><li>With a monolith there was a single URL; with microservices the client started to see the internal split</li>${EX}`,
    rota: () => `<table class="h3-sum"><tr><th>route (method + path)</th><th>service</th><th>login</th></tr><tr><td>GET /api/v1/produtos/*</td><td>catalogo</td><td>no</td></tr><tr><td>POST /api/v1/pedidos</td><td>pedidos</td><td>yes</td></tr><tr><td>GET /api/v1/pedidos/1048</td><td>pedidos</td><td>yes + owner</td></tr><tr><td>/api/v1/carrinho</td><td>carrinho</td><td>yes</td></tr><tr><td>/api/v1/clientes</td><td>clientes</td><td>yes</td></tr></table>
      <li><b>strip_path: true</b>: /api/v1/produtos/42 comes in, the catalog receives <b>/produtos/42</b></li><li>Without strip_path, the catalog receives the whole path and answers <b>404</b></li><li>No route matches: the gateway itself answers 404 (in Kong: <b>{"message":"no Route matched with those values"}</b>)</li><li>Order 1048: 79.90 + 15.00 shipping = <b>94.90</b></li>${EX}`,
    auth: () => `<li>Header: <b>Authorization: Bearer eyJ…</b> (JWT, RFC 7519)</li><li>Payload: <b>{ "sub": "lena-77", "nome": "Lena", "escopos": ["pedidos:ler", "pedidos:criar"], "exp": 1792000000 }</b></li><li>The gateway checks the signature and exp and passes on <b>X-Cliente-Id: lena-77</b></li>
      <table class="h3-sum"><tr><th>call</th><th>response</th></tr><tr><td>no token or expired token</td><td>401 Unauthorized</td></tr><tr><td>partner (only produtos:ler) creates an order</td><td>403 Forbidden</td></tr><tr><td>Lena, scope pedidos:criar</td><td>201 · order 1048</td></tr><tr><td>direct call to pedidos over the internal network</td><td class="h3-dim">200 (the mistake)</td></tr></table>
      <li>Fix: internal network closed (only the gateway reaches the services) and/or the service also checks the token</li>${EX}`,
    lb: () => `<table class="h3-sum"><tr><th></th><th>gateway</th><th>load balancer</th></tr><tr><td>spreads across</td><td>several different APIs</td><td>N identical replicas</td></tr><tr><td>decides</td><td>route, who, how much, version</td><td>which replica</td></tr><tr><td>layer</td><td>L7 (HTTP)</td><td>L4 ou L7</td></tr></table>
      <li>Chain: <b>app → gw-loja → lb-loja (203.0.113.10) → catalogo-1/2/3</b> (10.0.1.11–13:8080)</li><li>Limit: <b>10 requests/s per key</b>; above that, <b>429</b> with <b>Retry-After: 1</b>, <b>RateLimit-Limit: 10</b>, <b>RateLimit-Remaining: 0</b></li><li>Without a gateway: 500/s ÷ 3 ≈ <b>167/s</b> per replica; the plush cat page goes from <b>20 ms to 2 s</b></li>${EX}`,
    versao: () => `<table class="h3-sum"><tr><th>route</th><th>service</th><th>response</th></tr><tr><td>/api/v1/pedidos/1048</td><td>pedidos</td><td>{ "id": 1048, "total": 94.90 }</td></tr><tr><td>/api/v2/pedidos/1048</td><td>pedidos-v2</td><td>{ "id": 1048, "total": { "valor": 94.90, "moeda": "BRL" } }</td></tr></table>
      <li>Rewrite: <b>/api/v2/pedidos/1048</b> comes in, pedidos-v2 receives <b>/pedidos/1048</b></li><li>Canary for v1: <b>10% → 50% → 100%</b> if the errors do not go up</li><li>Before shutting it down: <b>Deprecation</b> and <b>Sunset</b> headers on v1, and measure in the gateway who still calls it</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), [m0, ...rest] = o.m; if (!m0) return '';
    return `<b>${m0[1]}</b><span>${m0[0].toLowerCase()}</span><i>· ${rest.map(([l, v]) => `${l.toLowerCase()}: ${v}`).join(' / ')}</i>`; }
  const reqHtml = o => '<b>HTTP request</b>' + o.req.join('\n').replace(/</g, '&lt;');
  const resHtml = o => '<b>Response</b>' + (o.status ? [o.status[0], ...o.body].join('\n').replace(/</g, '&lt;') : '…');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="g3count">${countHtml()}</div>
      <div class="g3-http"><div class="i3-sql" id="g3req">${reqHtml(o)}</div><div class="i3-sql" id="g3res">${resHtml(o)}</div></div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'gateway') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.status ? o.status[0] : '…'}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'gateway' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-gateway3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'gateway') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm], vis = !!p;
      Bk.g.visible = vis; if (!vis) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, o.lab[nm]); });
    GW.visible = !o.hideGw;
    if (GW.visible) { drawGwFront();
      STN.forEach(nm => { const S = ST[nm], on = o.so[nm] || 0, up = on === 1 || on === 'bad' ? 12 : 0;
        S.z += (up - S.z) * Math.min(1, 0.18); S.g.position.copy(W(GX + 7, S.y, PL + 14 + S.z));
        const key = JSON.stringify([o.srows[nm], on]) + theme + accent.getHex(); if (S.key !== key) { S.key = key; drawRows(S.top, o.srows[nm], on, 160); }
        S.mat.emissiveIntensity = on === 1 ? 0.6 : on === 2 ? 0.2 : 0; }); }
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 40); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('g3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const rq = document.getElementById('g3req'), rs = document.getElementById('g3res'), a = reqHtml(SP), b = resHtml(SP);
      if (rq && rq.innerHTML !== a) rq.innerHTML = a; if (rs && rs.innerHTML !== b) rs.innerHTML = b; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 800, 8, 470];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.8 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.46 : nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
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
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), ...STN.map(nm => ST[nm].top), gwFr, scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; }); STN.forEach(nm => ST[nm].key = ''); drawGwFront.k = '';
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); dotBad.emissive.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 235, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 235, 60), dist: 14 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
