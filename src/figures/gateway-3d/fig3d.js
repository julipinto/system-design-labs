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
  const SCNAME = { sem: 'Sem', rota: 'Rota', auth: 'Auth', lb: 'LB', versao: 'Versão' };
  const SCFULL = { sem: 'Sem gateway', rota: 'Roteamento e strip_path', auth: 'Autenticação e autorização', lb: 'Gateway + load balancer', versao: 'Versionamento e canary' };
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
    app: cli('APP', 'Lena · Recife'), site: cli('SITE', 'navegador'), parc: cli('PARCEIRO', 'marketplace'), robo: cli('ROBÔ', 'concorrente'),
    cat: svc('CATALOGO', 'via lb-catalogo'), car: svc('CARRINHO', 'via lb'), ped: svc('PEDIDOS', 'via lb'), cli: svc('CLIENTES', 'via lb'),
    pag: svc('PAGAMENTOS', ''), est: svc('ESTOQUE', ''), ent: svc('ENTREGAS', ''),
    lbc: svc('LB-CATALOGO', 'round robin'), c1: svc('CATALOGO-1', '10.0.1.11'), c2: svc('CATALOGO-2', '10.0.1.12'), c3: svc('CATALOGO-3', '10.0.1.13'),
    pnovo: svc('PEDIDOS·NOVO', 'v1 · por dentro'), pv2: svc('PEDIDOS-V2', 'contrato v2'),
  };
  const NAMES = Object.keys(B);
  // o portão: base com o nome na frente e 4 estações em cima, uma por fileira
  const GW = new THREE.Group(); g0.add(GW);
  rbox(GX, 172, PL, GWD, 282, 14, 8, bodyMat, GW);
  const gwFr = faceCanvas("front", GX + 3, 454, PL + 13, GWD - 6, 12, 9, GW);
  const STN = ['rota', 'auth', 'lim', 'ver'], STNAME = { rota: 'ROTA', auth: 'AUTH', lim: 'LIMITE', ver: 'VERSÃO' };
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
    app: [['Lena · Recife', 8.5, 'dim'], ['app da loja', 10.5], ['token JWT', 8.5, 'dim']],
    site: [['navegador', 8.5, 'dim'], ['loja.com.br', 10.5], ['token JWT', 8.5, 'dim']],
    parc: [['parceiro', 8.5, 'dim'], ['marketplace-xyz', 10.5], ['key=mk_live_…', 8.5, 'dim']],
    robo: [['concorrente', 8.5, 'dim'], ['robô de preços', 10.5], ['500 pedidos/s', 8.5, 'bad']],
  };
  const SEMROWS = { cat: ['catalogo.loja.com.br', 'login: nenhum'], car: ['carrinho.loja.com.br', 'login: token A'], ped: ['pedidos.loja.com.br', 'login: token A'],
    pag: ['pagamentos.loja.com.br', 'login: token B'], est: ['estoque.loja.com.br', 'login: token A'], ent: ['entregas.loja.com.br', 'login: token A'] };
  const svcRows = (a, b, ta = 'hi', tb = 'dim') => [[a, 10, ta], [b, 8.5, tb]];
  const STROWS = {
    rota: [['ROTA', 11], ['4 rotas', 8.6, 'dim'], ['caminho → serviço', 8.6, 'dim']],
    auth: [['AUTH', 11], ['JWT · chave de API', 8.6, 'dim'], ['quem é? pode?', 8.6, 'dim']],
    lim: [['LIMITE', 11], ['10 pedidos/s', 8.6, 'dim'], ['por chave', 8.6, 'dim']],
    ver: [['VERSÃO', 11], ['/api/v1 e /api/v2', 8.6, 'dim'], ['rota por prefixo', 8.6, 'dim']],
  };
  const stRows = (nm, ...l) => [[STNAME[nm], 11], ...l];

  function base() {
    const o = { pos: { ...LAY[sc] }, on: {}, rows: {}, lab: {}, so: {}, srows: { ...STROWS }, beams: [], tags: [], msgs: [],
      m: [], req: [], status: null, body: [], hideGw: sc === 'sem' };
    for (const nm in CLIROWS) o.rows[nm] = CLIROWS[nm];
    if (sc === 'sem') { SEMS.forEach(nm => { o.rows[nm] = svcRows(...SEMROWS[nm], 'hi', 'dim'); o.lab[nm] = [B[nm].lab, '']; });
      o.rows.app = [['Lena · Recife', 8.5, 'dim'], ['app da loja', 10.5], ['conhece 6 URLs', 8.5, 'dim']];
      o.beams = SEMS.map((_, j) => ({ pts: R.dir(0, j), thin: true })); }
    if (sc === 'rota' || sc === 'auth') {
      o.rows.cat = svcRows('/api/v1/produtos', 'público, sem login'); o.rows.car = svcRows('/api/v1/carrinho', 'precisa login');
      o.rows.ped = svcRows('/api/v1/pedidos', 'precisa login'); o.rows.cli = svcRows('/api/v1/clientes', 'precisa login');
      o.beams = [0, 1, 2, 3].flatMap(k => [{ pts: R.cg(k) }, { pts: R.gs(k) }]); }
    if (sc === 'lb') {
      o.rows.lbc = svcRows('203.0.113.10', 'repassa às réplicas'); [1, 2, 3].forEach(r => o.rows['c' + r] = svcRows(`10.0.1.1${r}:8080`, 'cópia igual'));
      o.beams = [{ pts: R.cg(0) }, { pts: R.cg(2) }, { pts: R.cg(3) }, { pts: R.gs(0) }, ...[1, 2, 3].map(r => ({ pts: R.l2r(r) }))]; }
    if (sc === 'versao') {
      o.rows.app = [['Lena · app novo', 8.5, 'dim'], ['usa a v2', 10.5], ['/api/v2/pedidos', 8.5, 'dim']];
      o.rows.site = [['app antigo', 8.5, 'dim'], ['usa a v1', 10.5], ['/api/v1/pedidos', 8.5, 'dim']];
      o.rows.parc = [['marketplace-xyz', 8.5, 'dim'], ['usa a v1', 10.5], ['/api/v1/pedidos', 8.5, 'dim']];
      o.lab.app = ['APP NOVO', 'Lena']; o.lab.site = ['APP ANTIGO', 'sem update'];
      o.rows.ped = svcRows('v1: "total": 94.90', 'número'); o.rows.pnovo = svcRows('v1: mesmo contrato', 'código reescrito'); o.rows.pv2 = svcRows('v2: "total": {…}', 'valor + moeda');
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
      { id: 'urls', dur: 5, title: 'O app conhece 6 endereços',
        story: 'A loja do módulo 6 virou seis serviços, e cada um atende no seu endereço: catalogo.loja.com.br, carrinho.loja.com.br, pedidos.loja.com.br e mais três. A Lena abre o app em Recife, e o app precisa saber todos eles. Para mostrar o gato de pelúcia, ele chama o catálogo direto.',
        look: 'Seis linhas saem do APP, uma para cada serviço. A que acende leva o GET /produtos/42 ao CATALOGO.',
        key: 'Sem gateway, o cliente enxerga a divisão interna da loja.',
        f(o, t) { meters(o, ['URLS QUE O APP CONHECE', '6', 'acc'], ['JEITOS DE LOGIN', '—', 'dim'], ['CERTIFICADOS TLS', '6', 'hi']);
          o.req = ['GET /produtos/42', 'Host: catalogo.loja.com.br'];
          if (t > 0.2) o.on.app = 1; send(o, t, 0.3, 1.3, R.dir(0, 0), 'GET /produtos/42', 'hi');
          if (t > 1.3 && t < 2.6) o.on.cat = 1;
          if (send(o, t, 1.7, 2.7, rev(R.dir(0, 0)), '200 · gato 79.90')) res(o, '200 OK', 'acc', '{"id":42,', ' "nome":"gato de pelúcia",', ' "preco":79.90}');
          if (t > 3.2) T(o, LG(1), 'o app guarda\n6 endereços', 'hi'); } },
      { id: 'login', dur: 6, title: 'Cada serviço confere o login do seu jeito',
        story: 'Para fechar a compra, o app vai ao pedidos, que exige um token no cabeçalho Authorization. O pagamentos confere outro token, num formato diferente, e o catálogo aceita qualquer um. O app carrega três jeitos de provar quem a Lena é, e cada time escreveu o seu código de login.',
        look: 'O pedido vai ao PEDIDOS com o token A e ao PAGAMENTOS com o token B. Cada serviço mostra o login que espera.',
        key: 'Regra comum espalhada: o mesmo problema resolvido em cada serviço.',
        f(o, t) { meters(o, ['URLS QUE O APP CONHECE', '6', 'acc'], ['JEITOS DE LOGIN', t > 3 ? '3' : '2', 'bad'], ['CERTIFICADOS TLS', '6', 'hi']); o.on.app = 1;
          o.req = ['POST /pedidos', 'Host: pedidos.loja.com.br', 'Authorization: token A', '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.3, R.dir(0, 2), 'POST /pedidos · token A', 'hi'); if (t > 1.3 && t < 2.8) o.on.ped = 1;
          if (send(o, t, 1.6, 2.5, rev(R.dir(0, 2)), '201 · pedido 1048', 'acc', 0.3)) res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          if (t > 2.9) o.req = ['POST /pagamentos', 'Host: pagamentos.loja.com.br', 'X-Token: token B', '{"pedido_id":1048,"valor":94.90}'];
          send(o, t, 3.0, 4.0, R.dir(0, 3), 'POST /pagamentos · token B', 'hi'); if (t > 4.0 && t < 5.4) o.on.pag = 1;
          if (send(o, t, 4.3, 5.1, rev(R.dir(0, 3)), '200 · pago', 'acc', 0.3)) res(o, '200 OK', 'acc', '{"pedido_id":1048,', ' "status":"pago"}');
          if (t > 1.2) o.rows.ped = svcRows('pedidos.loja.com.br', 'login: token A', 'hi', 'acc');
          if (t > 3.9) o.rows.pag = svcRows('pagamentos.loja.com.br', 'login: token B', 'hi', 'bad');
          if (t > 5.2) T(o, LG(1), '3 jeitos de login\nnum app só', 'bad'); } },
      { id: 'parceiro', dur: 5.5, title: 'O parceiro precisa das mesmas 6 URLs',
        story: 'A loja abriu uma API para o marketplace-xyz, que revende o gato. O parceiro tem que guardar as mesmas seis URLs e aprender os três jeitos de login. Do lado da operação são 6 certificados TLS, 6 lugares para configurar regras e 6 logs em formatos diferentes para juntar quando algo falha.',
        look: 'Do PARCEIRO saem mais seis linhas, que cruzam as do APP.',
        key: 'Cada cliente novo fica preso ao desenho interno da loja.',
        f(o, t) { meters(o, ['URLS NOS CLIENTES', t > 1 ? '2 × 6' : '6', 'bad'], ['CERTIFICADOS TLS', '6', 'hi'], ['LOGS DIFERENTES', '6', 'hi']);
          SEMS.forEach((_, j) => o.beams.push({ pts: R.dir(2, j), thin: true }));
          o.req = ['GET /produtos/42?key=mk_live_…', 'Host: catalogo.loja.com.br']; o.on.parc = 1;
          send(o, t, 0.4, 1.4, R.dir(2, 0), 'GET /produtos/42', 'hi'); if (t > 1.4 && t < 2.8) o.on.cat = 1;
          if (send(o, t, 1.8, 2.8, rev(R.dir(2, 0)), '200 · 79.90', 'acc', 0.3)) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}');
          if (t > 3.2) { T(o, LG(3), '12 linhas cruzadas\npara 2 clientes', 'bad'); T(o, RG(3), '6 certificados\n6 logs', 'hi'); } } },
      { id: 'robo', dur: 6, title: 'Black Friday: um robô pede 500 por segundo',
        story: 'Na Black Friday, um robô de um concorrente pede o preço do gato 500 vezes por segundo, direto em catalogo.loja.com.br. O catálogo aguenta 100 por segundo sem degradar. Para barrar o robô, alguém teria que pôr a mesma regra no catálogo e, para não deixar brecha, nos outros cinco serviços.',
        look: 'O ROBÔ martela o CATALOGO, que fica vermelho. O mostrador marca 500 pedidos por segundo contra 100.',
        key: 'Sem ponto de entrada único, não existe um lugar só para barrar abuso.',
        f(o, t) { const r = Math.min(500, Math.round(t * 260)); meters(o, ['PEDIDOS/S DO ROBÔ', String(r), r > 100 ? 'bad' : 'hi'], ['O CATÁLOGO AGUENTA', '100/s', 'hi'], ['LUGARES PARA BARRAR', '6', 'bad']);
          o.req = ['GET /produtos/42', 'Host: catalogo.loja.com.br', 'User-Agent: price-bot', '× 500 por segundo']; o.on.robo = 1;
          stream(o, R.dir(3, 0), t, 8, 1.1, r > 100 ? 'bad' : '');
          if (r > 100) { o.on.cat = 'bad'; o.rows.cat = svcRows('500/s chegando', 'aguenta 100/s', 'bad', 'dim'); res(o, 'lento · 2 s', 'bad', 'a página do gato', 'demora para todos'); }
          if (t > 2.6) T(o, LG(3), '500 pedidos/s\ndireto no catálogo', 'bad');
          if (t > 3.6) T(o, RG(0), 'barrar aqui…\ne nos outros 5', 'bad'); } },
      { id: 'troca', dur: 6.5, title: 'E se der errado: o pedidos muda de endereço',
        story: 'O time de pedidos reescreve o serviço e sobe a versão nova num endereço novo, pedidos2.loja.com.br (exemplo). O app instalado no celular da Lena ainda chama o endereço antigo, e o parceiro também. O endereço antigo sai do ar e os dois recebem erro até publicarem código novo. Uma mudança interna virou problema de todo mundo que chama a loja.',
        look: 'O PEDIDOS troca de endereço. As chamadas do APP e do PARCEIRO ao endereço antigo voltam vermelhas.',
        key: 'Sem uma porta única, todo cliente depende do endereço de cada serviço.',
        f(o, t) { meters(o, ['CLIENTES QUEBRADOS', t > 2.2 ? (t > 4.2 ? '2' : '1') : '0', 'bad'], ['URLS PARA TROCAR', '2', 'bad'], ['CERTIFICADOS TLS', '7', 'hi']);
          if (t > 0.8) { o.rows.ped = svcRows('pedidos2.loja.com.br', 'endereço novo', 'acc', 'dim'); o.lab.ped = ['PEDIDOS', 'novo']; o.on.ped = 2; }
          if (t > 0.6 && t < 1.8) T(o, RG(2), 'endereço novo\npedidos2.loja.com.br', 'acc');
          o.req = ['POST /pedidos', 'Host: pedidos.loja.com.br', '(o endereço antigo)'];
          [[0, 1.4], [2, 3.4]].forEach(([k, a]) => { const f = clamp((t - a) / 0.8) * 0.62; if (t > a) { o.on[k ? 'parc' : 'app'] = 'bad';
            o.beams.push({ pts: R.dir(k, 2), on: true, tone: 'bad', cut: f }); if (t < a + 1.6) o.msgs.push([R.dir(k, 2), f, 'pedidos.loja.com.br ✕', 'bad']); } });
          if (t > 2.2) res(o, 'falha de DNS', 'bad', 'pedidos.loja.com.br', 'não existe mais');
          if (t > 4.8) { T(o, LG(0), 'app da Lena\nquebrado', 'bad'); T(o, LG(3), 'parceiro\nquebrado', 'bad'); } } },
    ],
    rota: [
      { id: 'porta', dur: 4.5, title: 'Uma porta só: api.loja.com.br',
        story: 'A loja põe o gw-loja na frente de tudo. O app, o site e o parceiro passam a conhecer um endereço só, api.loja.com.br, e o gateway sabe para onde mandar cada caminho. Os serviços saem da internet e ficam atrás dele, cada um com o seu load balancer.',
        look: 'O portão aparece no meio, com quatro estações. Cada serviço mostra o prefixo da rota que leva até ele.',
        key: 'API Gateway: um ponto de entrada único na frente de vários serviços.',
        f(o, t) { meters(o, ['URLS PÚBLICAS', '1', 'acc'], ['ROTAS', '4', 'hi'], ['CERTIFICADOS TLS', '1', 'hi']);
          o.req = ['tabela de rotas do gw-loja:', '/api/v1/produtos → catalogo', '/api/v1/carrinho → carrinho', '/api/v1/pedidos  → pedidos', '/api/v1/clientes → clientes'];
          if (t > 0.6) lit(o, 'rota', 2); if (t > 0.6) o.srows.rota = stRows('rota', ['api.loja.com.br', 8.6], ['4 rotas · strip_path', 8.6, 'dim']);
          [0, 1, 2, 3].forEach(j => { if (t > 0.9 + j * 0.35) o.on[['cat', 'car', 'ped', 'cli'][j]] = 2; });
          if (t > 2.4) T(o, LG(1), 'todos chamam\napi.loja.com.br', 'acc'); } },
      { id: 'get', dur: 5.5, title: 'GET /api/v1/produtos/42 vai ao catálogo',
        story: 'A Lena abre a página do gato. O app manda GET /api/v1/produtos/42 para api.loja.com.br. A estação ROTA compara o caminho com a tabela, acha o prefixo /api/v1/produtos e escolhe o serviço catalogo. Essa rota é pública: ninguém pede login para ver preço.',
        look: 'O pedido entra no portão, a ROTA sobe e acende com a regra que casou, e a luz segue até o CATALOGO.',
        key: 'Rotear é escolher o serviço pelo caminho (e pelo método).',
        f(o, t) { meters(o, ['PEDIDOS ROTEADOS', t > 2.2 ? '1' : '0', 'acc'], ['URLS PÚBLICAS', '1', 'hi'], ['ROTAS', '4', 'hi']);
          o.req = ['GET /api/v1/produtos/42', 'Host: api.loja.com.br']; o.on.app = 1;
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'rota'); o.srows.rota = stRows('rota', ['/api/v1/produtos/*', 8.8, 'acc'], ['→ catalogo ✓', 9.4, 'acc']); }
          if (send(o, t, 2.2, 3.0, R.gs(0), 'GET … → catalogo', 'hi', 0.2)) o.on.cat = 1;
          if (send(o, t, 3.4, 4.4, rev([...R.cg(0), ...R.gs(0)]), '200 · gato 79.90')) res(o, '200 OK', 'acc', '{"id":42,', ' "nome":"gato de pelúcia",', ' "preco":79.90}');
          if (t > 1.6 && t < 3.4) T(o, LG(1), 'ROTA: casou\n/api/v1/produtos', 'acc'); } },
      { id: 'strip', dur: 5.5, title: 'strip_path: o catálogo recebe /produtos/42',
        story: 'O catálogo não sabe nada de /api/v1: ele atende /produtos/42, como sempre atendeu. Com strip_path ligado, o gateway corta da frente o prefixo da rota antes de repassar. Recebe /api/v1/produtos/42 e entrega /produtos/42. O preço volta, 79.90, e o gateway devolve a resposta para a Lena.',
        look: 'A mensagem muda no portão: entra /api/v1/produtos/42 e sai /produtos/42.',
        key: 'strip_path: o prefixo público fica no gateway; o serviço vê o caminho dele.',
        f(o, t) { meters(o, ['PEDIDOS ROTEADOS', '2', 'acc'], ['URLS PÚBLICAS', '1', 'hi'], ['ROTAS', '4', 'hi']); o.on.app = 1;
          o.req = ['entra: GET /api/v1/produtos/42', 'sai:   GET /produtos/42', 'strip_path: true'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.3);
          if (t > 1.2) { lit(o, 'rota'); o.srows.rota = stRows('rota', ['corta /api/v1', 9, 'acc'], ['strip_path ✓', 9, 'acc']); }
          if (send(o, t, 2.0, 3.0, R.gs(0), 'GET /produtos/42', 'acc', 0.4)) { o.on.cat = 1; o.rows.cat = svcRows('recebeu /produtos/42', 'o caminho dele', 'acc', 'dim'); }
          if (send(o, t, 3.5, 4.5, rev([...R.cg(0), ...R.gs(0)]), '200 · 79.90')) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}');
          if (t > 1.4 && t < 3.6) T(o, RG(1), 'sai /produtos/42\nsem o /api/v1', 'acc'); } },
      { id: 'metodo', dur: 6, title: 'Método + caminho: POST /api/v1/pedidos',
        story: 'A Lena compra o gato. O app manda POST /api/v1/pedidos com { "produto": 42, "qtd": 1 }. A rota casa pelo método e pelo caminho, e essa exige login: a AUTH confere o token (o cenário Auth mostra como). O pedidos cria o pedido 1048: 79.90 do gato mais 15.00 de frete, 94.90.',
        look: 'A luz passa pela ROTA e pela AUTH e vai ao PEDIDOS, na terceira fileira. Volta 201 com o pedido 1048.',
        key: 'A rota olha método e caminho: o mesmo serviço pode ter regras diferentes para GET e POST.',
        f(o, t) { meters(o, ['PEDIDOS ROTEADOS', t > 3.4 ? '3' : '2', 'acc'], ['URLS PÚBLICAS', '1', 'hi'], ['ROTAS', '4', 'hi']); o.on.app = 1;
          o.req = ['POST /api/v1/pedidos', 'Host: api.loja.com.br', ...LENA_JWT, '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.2, R.cg(0), 'POST /api/v1/pedidos', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'rota', t < 2.4 ? 1 : 2); o.srows.rota = stRows('rota', ['POST /api/v1/pedidos', 8.8, 'acc'], ['→ pedidos ✓', 9.4, 'acc']); }
          if (t > 2.0) { lit(o, 'auth', t < 3.2 ? 1 : 2); o.srows.auth = stRows('auth', ['precisa login', 8.8], ['token ok ✓', 9.4, 'acc']); }
          if (send(o, t, 3.0, 4.0, [[GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]], 'POST /pedidos', 'hi', 0.2)) o.on.ped = 1;
          if (t > 4.0) o.rows.ped = svcRows('criou o 1048', '79.90 + 15.00', 'acc', 'dim');
          if (send(o, t, 4.4, 5.3, rev([...R.cg(0), [GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]]), '201 · pedido 1048'))
            res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          if (t > 5.3) T(o, RG(3), 'pedido 1048\ntotal 94.90'); } },
      { id: 'errado', dur: 6, title: 'E se der errado: sem strip_path',
        story: 'Alguém configura a rota do catálogo sem strip_path. O gateway casa a rota direitinho, mas repassa o caminho inteiro: o catálogo recebe /api/v1/produtos/42, não conhece esse caminho e responde 404. O gateway só devolve o erro, e a Lena vê "produto não encontrado" num produto que existe.',
        look: 'A mensagem chega ao CATALOGO com o prefixo ainda grudado e volta vermelha: 404.',
        key: 'Gateway e serviço precisam combinar quem corta o prefixo do caminho.',
        f(o, t) { meters(o, ['PEDIDOS ROTEADOS', '4', 'acc'], ['404 DO CATÁLOGO', t > 3.2 ? '1' : '0', 'bad'], ['ROTAS', '4', 'hi']); o.on.app = 1;
          o.req = ['entra: GET /api/v1/produtos/42', 'sai:   GET /api/v1/produtos/42', 'strip_path: false  ✕'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.3);
          if (t > 1.2) { lit(o, 'rota', 'bad'); o.srows.rota = stRows('rota', ['→ catalogo ✓', 9, 'acc'], ['strip_path: false', 9, 'bad']); }
          if (send(o, t, 1.9, 2.9, R.gs(0), 'GET /api/v1/produtos/42', 'bad', 0.3)) { o.on.cat = 'bad'; o.rows.cat = svcRows('/api/v1/produtos/42?', 'não conheço', 'bad', 'dim'); }
          if (send(o, t, 3.3, 4.4, rev([...R.cg(0), ...R.gs(0)]), '404 Not Found', 'bad')) res(o, '404 Not Found', 'bad', '(do catálogo)', 'Cannot GET', '/api/v1/produtos/42');
          if (t > 4.6) { o.on.app = 'bad'; T(o, LG(1), 'a Lena vê\n"não encontrado"', 'bad'); } } },
    ],
    auth: [
      { id: 'jwt', dur: 5, title: 'A Lena manda o JWT',
        story: 'Quando a Lena entrou no app, recebeu um token JWT. Agora o POST /api/v1/pedidos leva esse token no cabeçalho Authorization: Bearer eyJ…. A estação AUTH confere a assinatura (ninguém mexeu no token) e o exp (ainda vale), e lê o sub: lena-77. Isso é autenticação: saber quem está chamando.',
        look: 'A AUTH sobe e mostra o que leu do token: sub lena-77 e a validade conferida.',
        key: 'Autenticação: quem é você. O gateway confere o token uma vez, por todos os serviços.',
        f(o, t) { meters(o, ['200 / 201', '0', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          o.req = ['POST /api/v1/pedidos', ...LENA_JWT, 'payload do token:', ...PAYLOAD];
          send(o, t, 0.3, 1.3, R.cg(0), 'POST + Bearer eyJ…', 'hi', 0.3);
          if (t > 1.3) { lit(o, 'auth'); o.srows.auth = stRows('auth', [t > 2.2 ? 'assinatura ✓ · exp ✓' : 'conferindo…', 8.8, t > 2.2 ? 'acc' : 'dim'], [t > 3 ? 'sub: lena-77' : '', 9.4, 'acc']); }
          if (t > 3.4) T(o, LG(1), 'AUTH: é a Lena\nsub lena-77', 'acc'); } },
      { id: 'repassa', dur: 6, title: 'O pedidos recebe X-Cliente-Id: lena-77',
        story: 'Depois de saber quem é, a AUTH confere o que ela pode: a rota POST /api/v1/pedidos pede o escopo pedidos:criar, e o token da Lena tem. O gateway repassa o pedido com um cabeçalho novo, X-Cliente-Id: lena-77. O pedidos não abre token nenhum: confia no cabeçalho, cria o pedido 1048 e responde 201.',
        look: 'A luz sai do portão para o PEDIDOS levando o X-Cliente-Id. Volta 201 com o pedido 1048, total 94.90.',
        key: 'Autorização: o que você pode. O escopo pedidos:criar libera a rota.',
        f(o, t) { meters(o, ['200 / 201', t > 4.2 ? '1' : '0', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          lit(o, 'auth', t < 2.4 ? 1 : 2); o.srows.auth = stRows('auth', ['escopo pedidos:criar', 8.8], ['tem ✓', 9.4, 'acc']);
          o.req = ['POST /pedidos', '(ao serviço pedidos)', 'X-Cliente-Id: lena-77', '{"produto":42,"qtd":1}'];
          if (send(o, t, 1.4, 2.6, R.gs(2), 'X-Cliente-Id: lena-77', 'acc', 0.4)) { o.on.ped = 1; o.rows.ped = svcRows('cliente: lena-77', 'cria o 1048', 'acc', 'dim'); }
          if (send(o, t, 3.2, 4.2, rev(R.gs(2)), '201 · pedido 1048', 'acc', 0.2)) res(o, '201 Created', 'acc', '{"id":1048,"total":94.90}');
          send(o, t, 4.3, 5.0, rev(R.cg(0)), '201 · 94.90', 'acc');
          if (t > 5.0) T(o, RG(3), 'pedido 1048\ntotal 94.90'); } },
      { id: 'dona', dur: 6, title: 'GET /api/v1/pedidos/1048: só a dona vê',
        story: 'A Lena abre o pedido 1048 para ver o total. O gateway confere o token e o escopo pedidos:ler e repassa com X-Cliente-Id: lena-77. Quem sabe que o 1048 é da Lena é o pedidos, então é ele que compara o cliente do cabeçalho com a dona do pedido. Bate, e a resposta sai: 200, total 94.90.',
        look: 'O PEDIDOS acende e mostra a comparação: dona lena-77, cabeçalho lena-77.',
        key: 'O escopo, o gateway confere; quem é dono de cada dado, só o serviço sabe.',
        f(o, t) { meters(o, ['200 / 201', t > 4.4 ? '2' : '1', 'acc'], ['401', '0', 'hi'], ['403', '0', 'hi']); o.on.app = 1;
          o.req = ['GET /api/v1/pedidos/1048', ...LENA_JWT, '→ X-Cliente-Id: lena-77'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'auth', t < 2.4 ? 1 : 2); o.srows.auth = stRows('auth', ['lena-77 ✓', 9], ['pedidos:ler ✓', 9, 'acc']); }
          if (send(o, t, 1.9, 2.9, R.gs(2), 'X-Cliente-Id: lena-77', 'acc', 0.2)) { o.on.ped = 1; o.rows.ped = [['1048: dona lena-77', 9.4, 'acc'], ['cabeçalho lena-77 ✓', 8.8, 'acc']]; }
          if (send(o, t, 3.4, 4.2, rev(R.gs(2)), '200 · total 94.90', 'acc', 0.1)) res(o, '200 OK', 'acc', '{"id":1048,"total":94.90}');
          send(o, t, 4.3, 5.0, rev(R.cg(0)), '200 · 94.90', 'acc');
          if (t > 4.6) T(o, RG(3), 'o pedidos confere\na dona: lena-77', 'acc'); } },
      { id: 'sem', dur: 5.5, title: 'Sem token: 401 no portão',
        story: 'Um script qualquer manda POST /api/v1/pedidos sem o cabeçalho Authorization. A AUTH não tem o que conferir e responde 401 Unauthorized ali mesmo. Com um token vencido, de exp no passado, a resposta é a mesma. O pedidos nem fica sabendo que alguém tentou.',
        look: 'A luz vai do SCRIPT ao portão e para na AUTH, que fica vermelha. Nada chega ao PEDIDOS.',
        key: '401: o gateway não sabe quem você é.',
        f(o, t) { meters(o, ['200 / 201', '2', 'acc'], ['401', t > 2 ? '1' : '0', 'bad'], ['403', '0', 'hi']);
          o.lab.robo = ['SCRIPT', 'sem token']; o.rows.robo = [['qualquer um', 8.5, 'dim'], ['sem Authorization', 9.6], ['', 8]]; o.on.robo = 1;
          o.req = ['POST /api/v1/pedidos', 'Host: api.loja.com.br', '(sem Authorization)', '{"produto":42,"qtd":1}'];
          send(o, t, 0.3, 1.3, R.cg(3), 'POST sem token', 'hi', 0.2);
          if (t > 1.3) { lit(o, 'auth', 'bad'); o.srows.auth = stRows('auth', ['sem token ✕', 9.4, 'bad'], ['401 Unauthorized', 8.8, 'bad']); }
          if (send(o, t, 1.9, 2.9, rev(R.cg(3)), '401 Unauthorized', 'bad')) res(o, '401 Unauthorized', 'bad', '{"message":', ' "Unauthorized"}');
          o.rows.ped = svcRows('nada chegou', 'nem ficou sabendo', 'dim', 'dim');
          if (t > 3.2) T(o, RG(3), 'PEDIDOS não\nviu nada', 'hi'); } },
      { id: 'escopo', dur: 6, title: 'O parceiro sem escopo: 403',
        story: 'O marketplace-xyz chama com a chave dele, key=mk_live_…. A AUTH reconhece a chave: é o parceiro, autenticado. Só que essa chave tem só o escopo produtos:ler, e criar pedido pede pedidos:criar. A resposta é 403 Forbidden: o gateway sabe quem é, e quem é não pode fazer isso.',
        look: 'A AUTH acende em vermelho e mostra o escopo que falta. O PEDIDOS continua apagado.',
        key: '401 é "não sei quem você é"; 403 é "sei, e você não pode".',
        f(o, t) { meters(o, ['200 / 201', '2', 'acc'], ['401', '1', 'bad'], ['403', t > 2.6 ? '1' : '0', 'bad']); o.on.parc = 1;
          o.req = ['POST /api/v1/pedidos?key=mk_live_…', 'Host: api.loja.com.br', 'chave → marketplace-xyz', 'escopos: produtos:ler'];
          send(o, t, 0.3, 1.3, R.cg(2), 'POST key=mk_live_…', 'hi', 0.2);
          if (t > 1.3) { lit(o, 'auth', t < 2 ? 1 : 'bad'); o.srows.auth = stRows('auth', ['marketplace-xyz ✓', 9, 'acc'], [t > 2 ? 'falta pedidos:criar' : 'escopo?', 8.8, t > 2 ? 'bad' : 'dim']); }
          if (send(o, t, 2.5, 3.5, rev(R.cg(2)), '403 Forbidden', 'bad')) res(o, '403 Forbidden', 'bad', 'escopo exigido:', ' pedidos:criar', 'a chave tem: produtos:ler');
          if (t > 3.8) T(o, LG(3), 'sei quem é,\nnão pode criar', 'bad'); } },
      { id: 'direto', dur: 7, title: 'E se der errado: chamada direta ao pedidos',
        story: 'O pedidos confia em qualquer X-Cliente-Id porque "o gateway já conferiu". Só que a rede interna está aberta. Alguém com acesso a ela chama o pedidos direto, sem passar pelo portão, e escreve X-Cliente-Id: lena-77 à mão. O pedidos devolve o pedido 1048 da Lena. O conserto: fechar a rede para que só o gateway alcance os serviços e, onde o dado é sensível, o serviço também conferir o token.',
        look: 'Uma linha vermelha contorna o portão pela frente e chega ao PEDIDOS, que devolve o pedido da Lena.',
        key: 'O gateway só protege o que só pode ser alcançado através dele.',
        f(o, t) { meters(o, ['200 / 201', '3', 'bad'], ['401', '1', 'hi'], ['403', '1', 'hi']);
          o.lab.robo = ['INTRUSO', 'rede interna']; o.rows.robo = [['dentro da rede', 8.5, 'dim'], ['finge ser lena-77', 9.6, 'bad'], ['sem token', 8.5, 'dim']]; o.on.robo = 'bad';
          o.req = ['GET /pedidos/1048', 'Host: pedidos:8080', '(direto, sem gateway)', 'X-Cliente-Id: lena-77  (escrito à mão)'];
          lit(o, 'auth', 0); o.srows.auth = stRows('auth', ['nem viu', 9.4, 'dim'], ['o pedido passou por fora', 8.6, 'dim']);
          if (send(o, t, 0.4, 2.0, R.side, 'X-Cliente-Id: lena-77', 'bad', 0.3)) { o.on.ped = 'bad'; o.rows.ped = svcRows('confiou no cabeçalho', 'entregou o 1048', 'bad', 'dim'); }
          if (send(o, t, 2.6, 4.0, rev(R.side), 'pedido 1048 da Lena', 'bad', 0.6)) res(o, '200 OK  ✕', 'bad', '{"id":1048,', ' "cliente":"lena-77",', ' "total":94.90}');
          if (t > 4.4) { T(o, [400, 462, 30], 'passou por fora\ndo portão', 'bad'); T(o, RG(0), 'conserto: só o gateway\nalcança os serviços', 'acc'); } } },
    ],
    lb: [
      { id: 'cadeia', dur: 6, title: 'app → gw-loja → lb-catalogo → réplica',
        story: 'Atrás do gateway continuam os load balancers do módulo 7. A Lena pede GET /api/v1/produtos/42: o gw-loja escolhe o serviço, o catálogo, e entrega ao lb-catalogo. O lb-catalogo escolhe uma das 3 réplicas iguais, em round robin, e a vez é da catalogo-1 (10.0.1.11:8080).',
        look: 'A luz atravessa as três peças: o portão, o LB-CATALOGO e a CATALOGO-1, que acende.',
        key: 'Juntos: o gateway escolhe qual API; o load balancer escolhe qual cópia.',
        f(o, t) { meters(o, ['PEDIDOS', t > 3.4 ? '1' : '0', 'acc'], ['RÉPLICAS', '3', 'hi'], ['PÁGINA DO GATO', '20 ms', 'acc']); o.on.app = 1;
          o.req = ['GET /api/v1/produtos/42', 'Host: api.loja.com.br', '→ lb-catalogo 203.0.113.10', '→ catalogo-1 10.0.1.11:8080'];
          send(o, t, 0.3, 1.1, R.cg(0), 'GET /api/v1/produtos/42', 'hi', 0.2);
          if (t > 1.1) { lit(o, 'rota', t < 2.2 ? 1 : 2); o.srows.rota = stRows('rota', ['→ catalogo', 9.4, 'acc'], ['(qual API)', 8.6, 'dim']); }
          if (send(o, t, 1.6, 2.4, R.gs(0), 'GET /produtos/42', 'hi', 0.2)) o.on.lbc = 1;
          if (t > 2.4) o.rows.lbc = svcRows('round robin', '→ catalogo-1', 'hi', 'acc');
          if (send(o, t, 2.6, 3.4, R.l2r(1), '→ 10.0.1.11', 'acc', 0.2)) o.on.c1 = 1;
          if (send(o, t, 3.8, 4.8, rev([...R.cg(0), ...R.gs(0)]), '200 · 79.90 · 20 ms')) res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}', '(da catalogo-1)');
          if (t > 4.8) T(o, LG(1), 'gateway: qual API\nLB: qual cópia', 'acc'); } },
      { id: 'gw', dur: 7, title: 'O gateway decide qual API, quem e quanto',
        story: 'O parceiro pede o mesmo produto com a chave dele. No portão, as decisões são de governança: qual serviço atende o caminho, quem está chamando, quantos pedidos por segundo essa chave ainda pode fazer, em qual versão da API. Nenhuma delas depende de qual réplica vai responder.',
        look: 'As quatro estações do portão acendem uma depois da outra, cada uma com a decisão que tomou para o pedido do parceiro.',
        key: 'Gateway: várias APIs diferentes, com regras de quem chama o quê, quanto e em qual versão.',
        f(o, t) { meters(o, ['PEDIDOS', '2', 'acc'], ['DECISÕES NO PORTÃO', String(Math.min(4, Math.max(0, Math.floor((t - 1.1) / 0.9) + 1))), 'acc'], ['DO LIMITE (10/s)', 'resta 9', 'hi']); o.on.parc = 1;
          o.req = ['GET /api/v1/produtos/42?key=mk_live_…', 'Host: api.loja.com.br'];
          send(o, t, 0.3, 1.1, R.cg(2), 'GET … key=mk_live_…', 'hi', 0.2);
          const D = { rota: [['→ catalogo', 9.4, 'acc'], ['qual API', 8.6, 'dim']], auth: [['marketplace-xyz', 9.4, 'acc'], ['quem é: produtos:ler ✓', 8.2, 'dim']],
            lim: [['1º pedido neste s', 9, 'acc'], ['resta 9 de 10', 8.6, 'dim']], ver: [['v1', 9.4, 'acc'], ['qual versão', 8.6, 'dim']] };
          STN.forEach((nm, i) => { const a = 1.1 + i * 0.9; if (t > a) { lit(o, nm, t < a + 0.9 ? 1 : 2); o.srows[nm] = stRows(nm, ...D[nm]); } });
          if (send(o, t, 4.9, 5.6, R.gs(0), 'GET /produtos/42', 'hi', 0.1)) o.on.lbc = 1;
          if (send(o, t, 5.7, 6.3, R.l2r(2), '→ 10.0.1.12', 'acc', 0.2)) { o.on.c2 = 1; res(o, '200 OK', 'acc', '{"id":42,"preco":79.90}', '(da catalogo-2)'); }
          if (t > 4.6) T(o, LG(3), 'regras por cliente\nficam no portão', 'acc'); } },
      { id: 'rr', dur: 6, title: 'O LB decide qual réplica',
        story: 'O lb-catalogo não sabe de chave, escopo nem versão. Ele vê três réplicas iguais e reparte: depois da catalogo-2, o próximo pedido vai à catalogo-3, o seguinte volta à 1. É ele também que tira do pool a réplica que falha no health check. Funciona com qualquer protocolo, em L4 ou em L7.',
        look: 'Três pedidos chegam ao LB-CATALOGO, e cada um vai para uma réplica diferente.',
        key: 'Load balancer: N cópias da mesma coisa, com a carga repartida entre elas.',
        f(o, t) { o.rows.lbc = svcRows('round robin', '3 → 1 → 2', 'hi', 'acc'); let n = 0;
          [3, 1, 2].forEach((r, i) => { const a = 0.4 + i * 1.5; if (send(o, t, a, a + 0.7, R.gs(0), `pedido ${i + 3}`, 'hi', 0.05)) o.on.lbc = 1;
            if (send(o, t, a + 0.75, a + 1.35, R.l2r(r), `→ 10.0.1.1${r}`, 'acc', 0.1)) { o.on['c' + r] = 1; n = i + 1; } });
          meters(o, ['PEDIDOS', String(2 + n), 'acc'], ['REPARTIDOS', `${1 + (n >= 2)} · ${1 + (n >= 3)} · ${n >= 1 ? 1 : 0}`, 'hi'], ['PÁGINA DO GATO', '20 ms', 'acc']);
          o.req = ['(o LB não lê chave nem escopo)', 'pool: 10.0.1.11, .12, .13', 'porta 8080 · round robin'];
          if (n) res(o, '200 OK', 'acc', `(da catalogo-${[3, 1, 2][n - 1]})`);
          if (t > 5.0) T(o, RG(3), 'LB: reparte entre\ncópias iguais', 'acc'); } },
      { id: 'robo', dur: 6.5, title: 'O robô para no portão',
        story: 'O robô do concorrente manda 500 pedidos por segundo, com a chave dele. A estação LIMITE deixa passar 10 por segundo por chave e responde 429 Too Many Requests aos outros 490, com Retry-After: 1. Atrás do portão, o lb-catalogo reparte só esses 10 entre as 3 réplicas, e a página da Lena continua em 20 ms.',
        look: 'A LIMITE acende. Quase todos os pontos do ROBÔ voltam vermelhos; só um fio fino segue até o LB.',
        key: 'O limite por cliente fica no gateway, antes de a carga chegar ao serviço.',
        f(o, t) { const r = Math.min(500, Math.round(t * 260)); meters(o, ['429 POR SEGUNDO', String(Math.max(0, r - 10)), 'bad'], ['PASSAM AO LB', r ? '10/s' : '0', 'acc'], ['PÁGINA DO GATO', '20 ms', 'acc']);
          o.on.robo = 1; o.req = ['GET /api/v1/produtos/42?key=…', 'User-Agent: price-bot', '× 500 por segundo'];
          stream(o, R.cg(3), t, 8, 1.0, '');
          if (t > 0.8) { lit(o, 'lim', 'bad'); o.srows.lim = stRows('lim', ['10/s por chave', 9.2], [`429 · ${Math.max(0, r - 10)}/s`, 9.4, 'bad']);
            stream(o, [[GX, CY[3] + 14, Z], [CXL + CW, CY[3] + 14, Z]], t, 6, 0.9, 'bad');
            res(o, '429 Too Many Requests', 'bad', 'Retry-After: 1', 'RateLimit-Limit: 10', 'RateLimit-Remaining: 0'); }
          if (t > 1.4) { o.beams.push({ pts: R.gs(0), on: true, dots: [(t * 0.7) % 1] }); o.on.lbc = 1; [1, 2, 3].forEach(k => o.beams.push({ pts: R.l2r(k), on: true, dots: [((t * 0.7) + k / 3) % 1] })); }
          if (t > 3.4) T(o, LG(2), '490/s → 429\n10/s passam', 'bad'); } },
      { id: 'errado', dur: 7, title: 'E se der errado: só o LB na frente',
        story: 'Agora tire o gateway e deixe o lb-catalogo exposto. Ele faz o que sabe fazer: reparte. Os 500 pedidos por segundo do robô viram uns 167 em cada réplica, e o catálogo aguenta 100 por segundo. As três ficam lentas juntas, e a página da Lena vai de 20 ms para 2 s. O LB espalhou o ataque por igual, porque barrar abuso não é trabalho dele.',
        look: 'O portão some. Os pontos do ROBÔ vão direto ao LB-CATALOGO, e as três réplicas ficam vermelhas.',
        key: 'Load balancer distribui; quem aplica regra por cliente é o gateway.',
        f(o, t) { o.hideGw = true; o.beams = [{ pts: R.rlb }, ...[1, 2, 3].map(r => ({ pts: R.l2r(r) }))];
          const r = Math.min(500, Math.round(t * 200)), slow = r > 100; o.on.robo = 1;
          meters(o, ['PEDIDOS/S NO LB', String(r), slow ? 'bad' : 'hi'], ['POR RÉPLICA', `~${Math.round(r / 3)}/s`, slow ? 'bad' : 'hi'], ['PÁGINA DO GATO', slow ? (t > 3.2 ? '2 s' : '0,8 s') : '20 ms', slow ? 'bad' : 'acc']);
          o.req = ['GET /produtos/42', 'Host: 203.0.113.10  (o LB exposto)', 'User-Agent: price-bot', '× 500 por segundo'];
          stream(o, R.rlb, t, 9, 1.2, slow ? 'bad' : ''); o.on.lbc = 1; o.rows.lbc = svcRows('reparte tudo', 'não barra ninguém', 'hi', slow ? 'bad' : 'dim');
          [1, 2, 3].forEach(k => { stream(o, R.l2r(k), t + k * 0.3, 2, 0.7, slow ? 'bad' : ''); if (slow) { o.on['c' + k] = 'bad'; o.rows['c' + k] = svcRows(`~${Math.round(r / 3)}/s`, 'lenta', 'bad', 'dim'); } });
          if (slow) res(o, t > 3.2 ? 'lento · 2 s' : 'lento · 0,8 s', 'bad', 'a página do gato', 'de 20 ms para 2 s');
          if (t > 3.6) T(o, LG(1), 'sem portão:\nninguém barra', 'bad'); } },
    ],
    versao: [
      { id: 'v1', dur: 5.5, title: 'v1: o total é um número',
        story: 'O app antigo, que ainda está em muitos celulares, chama GET /api/v1/pedidos/1048. A rota /api/v1/pedidos leva ao serviço pedidos, que responde como sempre respondeu: { "id": 1048, "total": 94.90 }. O app antigo e o parceiro leem o total como um número.',
        look: 'A VERSÃO acende com v1 e a luz vai ao PEDIDOS (v1). A resposta traz o total como número.',
        key: 'Contrato: o formato que o cliente espera receber.',
        f(o, t) { meters(o, ['CHAMADAS V1', t > 3.6 ? '1' : '0', 'acc'], ['CHAMADAS V2', '0', 'hi'], ['VERSÕES NO AR', '1', 'hi']); o.on.site = 1;
          o.req = ['GET /api/v1/pedidos/1048', 'Host: api.loja.com.br', '→ pedidos: GET /pedidos/1048'];
          send(o, t, 0.3, 1.2, R.cg(1), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'ver', t < 2.3 ? 1 : 2); o.srows.ver = stRows('ver', ['/api/v1/pedidos', 9, 'acc'], ['→ pedidos (v1)', 9, 'acc']); }
          if (send(o, t, 1.7, 2.5, [[GX + GWD, CY[1], Z], [GX + GWD + 40, CY[1], Z], [GX + GWD + 40, SCY(0), Z], [SX, SCY(0), Z]], 'GET /pedidos/1048', 'hi', 0.2)) o.on.ped = 1;
          if (send(o, t, 2.8, 3.6, rev(R.gs(0)), '{"total": 94.90}', 'acc', 0.4)) res(o, '200 OK  (v1)', 'acc', '{ "id": 1048,', '  "total": 94.90 }');
          if (t > 4.0) T(o, RG(3), 'v1: total é\num número', 'acc'); } },
      { id: 'v2', dur: 6, title: 'v2: o total vira objeto',
        story: 'A loja vai vender em outras moedas, e o time de pedidos muda o formato: o total passa a ser { "valor": 94.90, "moeda": "BRL" }. Isso quebra quem esperava um número, então o formato novo sai como v2, num serviço próprio, o pedidos-v2. O gateway recebe /api/v2/pedidos/1048 e entrega /pedidos/1048 ao pedidos-v2.',
        look: 'O APP NOVO chama /api/v2 e a luz vai ao PEDIDOS-V2. No mostrador, a resposta v2 com o total em objeto.',
        key: 'Um campo mudou de forma: o contrato mudou, e isso pede uma versão nova.',
        f(o, t) { meters(o, ['CHAMADAS V1', '1', 'acc'], ['CHAMADAS V2', t > 3.8 ? '1' : '0', 'acc'], ['VERSÕES NO AR', '2', 'acc']); o.on.app = 1;
          o.req = ['GET /api/v2/pedidos/1048', 'Host: api.loja.com.br', '→ pedidos-v2: GET /pedidos/1048'];
          send(o, t, 0.3, 1.2, R.cg(0), 'GET /api/v2/pedidos/1048', 'hi', 0.2);
          if (t > 1.2) { lit(o, 'ver', t < 2.4 ? 1 : 2); o.srows.ver = stRows('ver', ['/api/v2/pedidos', 9, 'acc'], ['→ pedidos-v2', 9, 'acc']); }
          const p = [[GX + GWD, CY[0], Z], [GX + GWD + 40, CY[0], Z], [GX + GWD + 40, SCY(2), Z], [SX, SCY(2), Z]];
          if (send(o, t, 1.8, 2.7, p, 'GET /pedidos/1048', 'hi', 0.2)) o.on.pv2 = 1;
          if (send(o, t, 3.0, 3.8, rev(p), '{"total": {…}}', 'acc', 0.4)) res(o, '200 OK  (v2)', 'acc', '{ "id": 1048,', '  "total": { "valor": 94.90,', '    "moeda": "BRL" } }');
          if (t > 4.2) { T(o, RG(3), 'v2: total é\num objeto', 'acc'); T(o, LG(1), 'v1: 94.90\nv2: {valor, moeda}', 'hi'); } } },
      { id: 'juntos', dur: 6, title: 'v1 e v2 no ar ao mesmo tempo',
        story: 'As duas versões convivem. O app novo da Lena usa a v2; quem não atualizou o app e o marketplace-xyz seguem na v1. O gateway separa pelo prefixo do caminho, e cada cliente migra quando puder, sem ninguém quebrar no meio.',
        look: 'Três chamadas ao mesmo tempo: duas vão ao PEDIDOS (v1) e uma ao PEDIDOS-V2.',
        key: 'Versionar no caminho deixa cliente velho e cliente novo usarem a loja juntos.',
        f(o, t) { o.on.app = o.on.site = o.on.parc = 1; lit(o, 'ver'); o.srows.ver = stRows('ver', ['v1 → pedidos', 9, 'acc'], ['v2 → pedidos-v2', 9, 'acc']);
          const to1 = k => [[GX + GWD, CY[k], Z], [GX + GWD + 40 + k * 14, CY[k], Z], [GX + GWD + 40 + k * 14, SCY(0) + k * 6 - 6, Z], [SX, SCY(0) + k * 6 - 6, Z]];
          const to2 = [[GX + GWD, CY[0], Z], [GX + GWD + 30, CY[0], Z], [GX + GWD + 30, SCY(2), Z], [SX, SCY(2), Z]];
          stream(o, R.cg(0), t, 2, 1.6); stream(o, R.cg(1), t + 0.5, 2, 1.6); stream(o, R.cg(2), t + 1, 2, 1.6);
          stream(o, to2, t, 2, 1.6); stream(o, to1(1), t + 0.5, 2, 1.6); stream(o, to1(2), t + 1, 2, 1.6);
          o.on.ped = 1; o.on.pv2 = 1; const n = Math.floor(t * 1.25);
          meters(o, ['CHAMADAS V1', String(1 + n * 2), 'acc'], ['CHAMADAS V2', String(1 + n), 'acc'], ['VERSÕES NO AR', '2', 'acc']);
          o.req = ['APP NOVO:   GET /api/v2/pedidos/1048', 'APP ANTIGO: GET /api/v1/pedidos/1048', 'PARCEIRO:   GET /api/v1/pedidos/1048'];
          res(o, '200 OK  (as duas)', 'acc', 'v1 → "total": 94.90', 'v2 → "total": {"valor":94.90,', '      "moeda":"BRL"}');
          if (t > 2.6) T(o, RG(3), 'cada cliente migra\nquando puder', 'acc'); } },
      { id: 'canary', dur: 8, title: 'Canary: 10% → 50% → 100%',
        story: 'O time também reescreveu o pedidos v1 por dentro, sem mudar o contrato. Para não trocar tudo de uma vez, o gateway manda 10% do tráfego da v1 para a implementação nova. Os erros ficam iguais aos da antiga, então sobe para 50% e depois para 100%. Se os erros tivessem subido, era só voltar a 0%.',
        look: 'O PEDIDOS·NOVO recebe uma fatia cada vez maior dos pontos da v1: 1 em cada 10, depois metade, depois todos.',
        key: 'Canary: a versão nova recebe uma fatia do tráfego antes de receber tudo.',
        f(o, t) { const pc = t < 2.6 ? 10 : t < 5.2 ? 50 : 100; o.on.site = o.on.parc = 1;
          lit(o, 'ver'); o.srows.ver = stRows('ver', ['v1: canary', 9, 'acc'], [`${pc}% → novo`, 10, 'acc']);
          meters(o, ['V1 NA IMPLEMENTAÇÃO NOVA', pc + '%', 'acc'], ['ERROS (ANTIGA × NOVA)', 'iguais', 'acc'], ['CONTRATO', 'o mesmo', 'hi']);
          const toOld = [[GX + GWD, CY[1] + 6, Z], [GX + GWD + 50, CY[1] + 6, Z], [GX + GWD + 50, SCY(0), Z], [SX, SCY(0), Z]], toNew = R.gs(1);
          stream(o, R.cg(1), t, 3, 1.2); stream(o, R.cg(2), t + 0.4, 3, 1.2);
          const N = 10, k = Math.round(N * pc / 100);
          if (k < N) stream(o, toOld, t, Math.max(1, Math.round((N - k) / 2.5)), 1.4); else o.beams.push({ pts: toOld });
          stream(o, toNew, t + 0.2, Math.max(1, Math.round(k / 2.5)), 1.4);
          o.on.pnovo = 1; o.on.ped = pc < 100 ? 2 : 0; o.rows.pnovo = svcRows(`recebe ${pc}% da v1`, 'mesmo contrato', 'acc', 'dim');
          o.rows.ped = svcRows(`recebe ${100 - pc}% da v1`, pc < 100 ? 'código antigo' : 'pode sair', pc < 100 ? 'hi' : 'dim', 'dim');
          o.req = ['GET /api/v1/pedidos/1048', `${100 - pc}% → pedidos (antigo)`, `${pc}% → pedidos·novo`, '(o cliente não percebe)'];
          res(o, '200 OK  (v1)', 'acc', '{ "id": 1048,', '  "total": 94.90 }', '(igual nos dois)');
          if (t > 6.2) T(o, RG(3), '100% no novo\nerros iguais', 'acc'); } },
      { id: 'desliga', dur: 7, title: 'E se der errado: a v1 desligada cedo',
        story: 'Com quase todo mundo na v2, alguém remove a rota /api/v1/pedidos do gateway. O marketplace-xyz ainda não tinha migrado: cada chamada dele volta 404, "no Route matched with those values", e o parceiro para de vender o gato. O conserto: avisar com prazo, com os cabeçalhos Deprecation e Sunset nas respostas da v1, e olhar no gateway quem ainda chama a v1 antes de desligar.',
        look: 'A VERSÃO fica vermelha, e as chamadas do PARCEIRO param no portão e voltam 404.',
        key: 'Só desligue uma versão quando o gateway mostrar que ninguém mais chama por ela.',
        f(o, t) { meters(o, ['404 DO PARCEIRO', String(Math.max(0, Math.floor((t - 1.8) * 2))), 'bad'], ['CHAMADAS V2', 'normais', 'acc'], ['VERSÕES NO AR', '1', 'hi']);
          o.on.app = 1; o.on.parc = t > 2 ? 'bad' : 1; o.on.pv2 = 1; o.pos.ped = null; o.pos.pnovo = null; o.pos.site = null;
          o.beams = [{ pts: R.cg(0) }, { pts: R.cg(2) }, { pts: R.gs(2) }];
          o.rows.parc = [['marketplace-xyz', 8.5, 'dim'], ['ainda na v1', 10.5, 'bad'], ['/api/v1/pedidos', 8.5, 'dim']];
          stream(o, R.cg(0), t, 2, 1.6); stream(o, [[GX + GWD, CY[0], Z], [GX + GWD + 30, CY[0], Z], [GX + GWD + 30, SCY(2), Z], [SX, SCY(2), Z]], t, 2, 1.6);
          o.req = ['GET /api/v1/pedidos/1048?key=mk_live_…', 'Host: api.loja.com.br', '(a rota /api/v1/pedidos foi removida)'];
          send(o, t, 0.4, 1.4, R.cg(2), 'GET /api/v1/pedidos/1048', 'hi', 0.2);
          if (t > 1.4) { lit(o, 'ver', 'bad'); o.srows.ver = stRows('ver', ['/api/v1/pedidos', 9, 'bad'], ['rota removida ✕', 9, 'bad']); }
          if (send(o, t, 1.8, 2.8, rev(R.cg(2)), '404 Not Found', 'bad', 0.6)) res(o, '404 Not Found', 'bad', '{"message":', ' "no Route matched', '  with those values"}');
          if (t > 3.6) { T(o, LG(3), 'o parceiro parou\nde vender o gato', 'bad'); T(o, RG(0), 'antes: Deprecation\ne Sunset na v1', 'acc'); } } },
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
    lbl('PEDIDO HTTP · ' + SCNAME[sc].toUpperCase(), 206, 12, 230);
    const rl = o.req.slice(0, 6), fs0 = rl.length > 4 ? 9 : 10.4;
    rl.forEach((l, i) => { x.fillStyle = i === 0 ? C.inkHi : INK(); fitFont(x, u, l, fs0, 232); x.fillText(l, u(206), u(30 + i * (fs0 + 6))); });
    lbl('RESPOSTA', 456, 12, 170);
    if (o.status) { x.fillStyle = toneC(o.status[1]); fitFont(x, u, o.status[0], 14, 168); x.fillText(o.status[0], u(456), u(32));
      o.body.slice(0, 5).forEach((l, i) => { x.fillStyle = C.inkHi; fitFont(x, u, l, 9, 168); x.fillText(l, u(456), u(52 + i * 15)); }); }
    else { x.fillStyle = INK(); x.font = `700 ${u(10)}px ${MONO3}`; x.fillText('…', u(456), u(32)); }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Nomes, chaves e tokens são exemplos do módulo; api.loja.com.br e 203.0.113.10 seguem a faixa de documentação.</li>';
  const DATA = {
    sem: () => `<table class="h3-sum"><tr><th></th><th>sem gateway</th><th>com gateway</th></tr><tr><td>URLs no cliente</td><td>6</td><td>1</td></tr><tr><td>jeitos de login</td><td>3</td><td>1</td></tr><tr><td>certificados TLS</td><td>6</td><td>1</td></tr><tr><td>onde barrar o robô</td><td>6 lugares</td><td>1</td></tr><tr><td>logs</td><td>6 formatos</td><td>1 ponto</td></tr></table>
      <li>Robô na Black Friday: <b>500 pedidos/s</b>; o catálogo aguenta <b>100/s</b> sem degradar</li><li>Com monolito era uma URL só; com microsserviços o cliente passou a ver a divisão interna</li>${EX}`,
    rota: () => `<table class="h3-sum"><tr><th>rota (método + caminho)</th><th>serviço</th><th>login</th></tr><tr><td>GET /api/v1/produtos/*</td><td>catalogo</td><td>não</td></tr><tr><td>POST /api/v1/pedidos</td><td>pedidos</td><td>sim</td></tr><tr><td>GET /api/v1/pedidos/1048</td><td>pedidos</td><td>sim + dona</td></tr><tr><td>/api/v1/carrinho</td><td>carrinho</td><td>sim</td></tr><tr><td>/api/v1/clientes</td><td>clientes</td><td>sim</td></tr></table>
      <li><b>strip_path: true</b>: entra /api/v1/produtos/42, o catálogo recebe <b>/produtos/42</b></li><li>Sem strip_path, o catálogo recebe o caminho inteiro e responde <b>404</b></li><li>Nenhuma rota casa: o próprio gateway responde 404 (no Kong: <b>{"message":"no Route matched with those values"}</b>)</li><li>Pedido 1048: 79.90 + 15.00 de frete = <b>94.90</b></li>${EX}`,
    auth: () => `<li>Cabeçalho: <b>Authorization: Bearer eyJ…</b> (JWT, RFC 7519)</li><li>Payload: <b>{ "sub": "lena-77", "nome": "Lena", "escopos": ["pedidos:ler", "pedidos:criar"], "exp": 1792000000 }</b></li><li>O gateway confere assinatura e exp e repassa <b>X-Cliente-Id: lena-77</b></li>
      <table class="h3-sum"><tr><th>chamada</th><th>resposta</th></tr><tr><td>sem token ou token vencido</td><td>401 Unauthorized</td></tr><tr><td>parceiro (só produtos:ler) cria pedido</td><td>403 Forbidden</td></tr><tr><td>Lena, escopo pedidos:criar</td><td>201 · pedido 1048</td></tr><tr><td>chamada direta ao pedidos pela rede interna</td><td class="h3-dim">200 (o erro)</td></tr></table>
      <li>Conserto: rede interna fechada (só o gateway alcança os serviços) e/ou o serviço também confere o token</li>${EX}`,
    lb: () => `<table class="h3-sum"><tr><th></th><th>gateway</th><th>load balancer</th></tr><tr><td>reparte entre</td><td>várias APIs diferentes</td><td>N réplicas iguais</td></tr><tr><td>decide</td><td>rota, quem, quanto, versão</td><td>qual réplica</td></tr><tr><td>camada</td><td>L7 (HTTP)</td><td>L4 ou L7</td></tr></table>
      <li>Cadeia: <b>app → gw-loja → lb-catalogo (203.0.113.10) → catalogo-1/2/3</b> (10.0.1.11–13:8080)</li><li>Limite: <b>10 pedidos/s por chave</b>; acima, <b>429</b> com <b>Retry-After: 1</b>, <b>RateLimit-Limit: 10</b>, <b>RateLimit-Remaining: 0</b></li><li>Sem gateway: 500/s ÷ 3 ≈ <b>167/s</b> por réplica; a página do gato vai de <b>20 ms a 2 s</b></li>${EX}`,
    versao: () => `<table class="h3-sum"><tr><th>rota</th><th>serviço</th><th>resposta</th></tr><tr><td>/api/v1/pedidos/1048</td><td>pedidos</td><td>{ "id": 1048, "total": 94.90 }</td></tr><tr><td>/api/v2/pedidos/1048</td><td>pedidos-v2</td><td>{ "id": 1048, "total": { "valor": 94.90, "moeda": "BRL" } }</td></tr></table>
      <li>Reescrita: entra <b>/api/v2/pedidos/1048</b>, o pedidos-v2 recebe <b>/pedidos/1048</b></li><li>Canary da v1: <b>10% → 50% → 100%</b> se os erros não aumentarem</li><li>Antes de desligar: cabeçalhos <b>Deprecation</b> e <b>Sunset</b> na v1, e medir no gateway quem ainda chama</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), [m0, ...rest] = o.m; if (!m0) return '';
    return `<b>${m0[1]}</b><span>${m0[0].toLowerCase()}</span><i>· ${rest.map(([l, v]) => `${l.toLowerCase()}: ${v}`).join(' / ')}</i>`; }
  const reqHtml = o => '<b>Pedido HTTP</b>' + o.req.join('\n').replace(/</g, '&lt;');
  const resHtml = o => '<b>Resposta</b>' + (o.status ? [o.status[0], ...o.body].join('\n').replace(/</g, '&lt;') : '…');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="g3count">${countHtml()}</div>
      <div class="g3-http"><div class="i3-sql" id="g3req">${reqHtml(o)}</div><div class="i3-sql" id="g3res">${resHtml(o)}</div></div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'gateway') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.status ? o.status[0] : '…'}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 235, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 235, 60), dist: 14 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
