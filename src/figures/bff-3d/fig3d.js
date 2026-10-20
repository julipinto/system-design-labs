// Figura 3D (iso-glow): Backend for Frontends. A tela inicial do app da Lena (Recife, 4G) precisa de 4 coisas de 4 serviços.
// Cena: à esquerda os clientes (o celular da Lena, o site num monitor, o alto-falante da voz); o gw-loja; os BFFs como balcões
// por canal; os 4 serviços atrás (catalogo, carrinho, recomendacoes, pedidos). Ao fundo, o mostrador com o relógio de ms,
// os KB que chegam ao celular e a resposta real. Mensagens correm nas vigas com o dado real (GET /app/home, 79.90, 1048).
// Cenários (toggle e ?mode=sem|compor|canais|versao|falha|metricas; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/bff-brief.md): 4G 120 ms, 480 ms e 180 KB sem BFF, 25 ms o serviço
// mais lento, ~150 ms e 12 KB com o bff-app, timeout 100 ms, p95 150/300 ms, erros 2% / 0,1%.
FIGS3D.push({ id: 'bff', name: 'BFF', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const ramp = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const br = n => String(n).replace('.', ',');
  const fmtMs = v => Math.round(v) + ' ms';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const RTT = 120, SLOW = 25, MONTA = 5, KB_SITE = 180, KB_APP = 12;
  const JSON_APP = ['{', '  "destaque": { "id": 42, "nome": "gato de pelúcia",', '                "preco": 79.90, "foto": "gato-320.webp" },',
    '  "carrinho": { "itens": 1 },', '  "recomendado": [{ "id": 7, "nome": "caneca azul", "preco": 19.90 }],', '  "pedido": { "id": 1048, "status": "a caminho" }', '}'];
  // a mesma resposta em linhas curtas, para o mostrador
  const JSON_SCR = [['"destaque": { "id": 42, "nome": "gato de pelúcia",', 0], ['   "preco": 79.90, "foto": "gato-320.webp" },', 0],
    ['"carrinho": { "itens": 1 },', 1], ['"recomendado": [{ "id": 7, "nome": "caneca azul",', 2], ['   "preco": 19.90 }],', 2], ['"pedido": { "id": 1048, "status": "a caminho" }', 3]];
  const SITE_JSON = ['GET /produtos/42   (resposta feita para o site)', '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90,', '  "descricao": "Gato de pelúcia macio, 30 cm ... (3 parágrafos)",',
    '  "fotos": ["gato-1.jpg", "gato-2.jpg", "... (8 fotos em alta)"],', '  "custo_fornecedor": 31.20 }'];
  const SC = ['sem', 'compor', 'canais', 'versao', 'falha', 'metricas'];
  const SCNAME = { sem: 'Sem BFF', compor: 'Compor', canais: 'Canais', versao: 'Versões', falha: 'Falha', metricas: 'Métricas' };
  const SCFULL = { sem: 'Sem BFF: 4 chamadas pelo 4G', compor: 'API composition no bff-app', canais: 'Um BFF por canal', versao: 'Versões e feature toggle', falha: 'Timeout, fallback e raio de explosão', metricas: 'Métricas por canal' };
  const AULA = { sem: 'aula-1-introducao-e-responsabilidades', compor: 'aula-2-api-composition', canais: 'aula-3-canais-e-dispositivos',
    versao: 'aula-5-versionamento-e-deployment', falha: 'aula-6-resiliencia-e-blast-radius', metricas: 'aula-7-metricas-e-experiencia' };
  let clk = 0, sc = 'sem', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-bff3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria (unidades iso; x: dos clientes aos serviços, y: as linhas de cada canal) ──
  const PL = 7, Z = 10;
  const RY = [182, 284, 386];                 // centro de cada linha: app, site, voz
  const SY = [168, 246, 324, 402];            // centro de cada serviço
  const CX1 = 100, GX0 = 160, GX1 = 270, GXm = 215, BX0 = 330, BX1 = 500, SX0 = 570, SX1 = 730;
  plateWith(g0, 750, 452, [[14, 14], [736, 14], [14, 438], [736, 438]]);
  hazeAndShadow(g0, 375, 226, 9.2, 5.9);
  // mostrador ao fundo
  rbox(150, 12, PL, 560, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 154, 24, 154, 552, 140, 5, g0);
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(w, d, h, lab, sub) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { g, mat, top, fr, fh, w, h, d, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const SVC = ['catalogo', 'carrinho', 'recomendacoes', 'pedidos'];
  const B = {
    gw: block(GX1 - GX0, 308, 36, 'GW-LOJA', 'gateway'),
    bA: block(BX1 - BX0, 84, 30, 'BFF-APP', 'iOS · Android'), bB: block(BX1 - BX0, 84, 30, 'BFF-WEB', 'site'), bC: block(BX1 - BX0, 84, 30, 'BFF-VOZ', 'assistente'),
    one: block(BX1 - BX0, 288, 30, 'BACKEND ÚNICO', 'todos os canais'),
  };
  SVC.forEach((s, i) => { B['s' + i] = block(SX1 - SX0, 56, 24, s.toUpperCase(), ''); });
  // clientes: o celular (2, para o v3 e o v4), o monitor do site e o alto-falante da voz
  function phone(y) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, y - 30, PL, CX1, 60, 5, 6, bodyMat, g);
    rbox(5, y + 10, PL + 5, 90, 10, 160, 10, mat, g);
    const sc_ = faceCanvas('front', 8, y + 20, PL + 5 + 157, 84, 154, 6, g);
    return { g, mat, scr: sc_, key: '' };
  }
  const PH = { A: phone(RY[0]), B: phone(RY[1]) };
  const MON = (() => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat); const y = RY[1];
    rbox(10, y - 26, PL, 80, 48, 5, 6, bodyMat, g); rbox(44, y - 6, PL + 5, 12, 8, 20, 2, bodyMat, g);
    rbox(-6, y + 2, PL + 22, 112, 8, 80, 5, mat, g);
    return { g, mat, scr: faceCanvas('front', -3, y + 10, PL + 22 + 77, 106, 74, 6, g), key: '' }; })();
  const SPK = (() => { const g = new THREE.Group(); g0.add(g); const y = RY[2];
    rbox(22, y - 28, PL, 56, 56, 62, 24, bodyMat, g);
    const ring = capMat(); twCaps.push(ring); rbox(30, y - 20, PL + 62, 40, 40, 3, 16, ring, g);
    const glow = glowPoints([W(50, y, PL + 70)], 0.5); g0.add(glow);
    return { g, ring, glow }; })();
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 10 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.on ? 5.5 : 3.5) * TS, d = C_.clone().sub(A), len = d.length();
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11), tag(11), tag(11)], WHO = [tag(10), tag(10), tag(10)];

  // ── lugares e rotas (no chão, z = 10) ──
  const BPOS = { bA: [BX0, RY[0] - 42], bB: [BX0, RY[1] - 42], bC: [BX0, RY[2] - 42] };
  const POS0 = { gw: [GX0, 132], s0: [SX0, SY[0] - 28], s1: [SX0, SY[1] - 28], s2: [SX0, SY[2] - 28], s3: [SX0, SY[3] - 28] };
  const LAY = { sem: { ...POS0 }, compor: { ...POS0, bA: BPOS.bA }, canais: { ...POS0, ...BPOS }, versao: { ...POS0, bA: BPOS.bA, bB: BPOS.bB },
    falha: { ...POS0, bA: BPOS.bA, bB: BPOS.bB }, metricas: { ...POS0, bA: BPOS.bA, bB: BPOS.bB } };
  const CLI = { sem: { A: 1 }, compor: { A: 1 }, canais: { A: 1, mon: 1, spk: 1 }, versao: { A: 1, B: 1 }, falha: { A: 1, mon: 1 }, metricas: { A: 1, mon: 1 } };
  const R = {
    c2b: r => [[CX1, RY[r], Z], [BX0, RY[r], Z]],                                                  // cliente → gw → BFF (passa por dentro do gw)
    b2s: (r, s) => { const ex = 522 + r * 16; return [[BX1, RY[r], Z], [ex, RY[r], Z], [ex, SY[s], Z], [SX0, SY[s], Z]]; },
    c2s: s => [[CX1, RY[0], Z], [GXm, RY[0], Z], [GXm, SY[s], Z], [SX0, SY[s], Z]],                 // sem BFF: o celular vai ao serviço pelo gw
    c2one: r => [[CX1, RY[r], Z], [BX0, RY[r], Z]],
    one2s: s => [[BX1, SY[s], Z], [SX0, SY[s], Z]],
  };
  const rev = pts => pts.slice().reverse();
  // balões: acima da frente de cada peça
  const AT = { gw: [GXm, 420, 40], bA: [415, 112, 26], bB: [548, RY[1] + 10, 46], bC: [415, RY[2] + 48, 12], one: [415, 112, 26],
    s0: [650, SY[0] + 34, 8], s1: [650, SY[1] + 34, 8], s2: [650, SY[2] + 34, 8], s3: [650, SY[3] + 34, 8],
    A: [50, RY[0] + 40, 190], B: [50, RY[1] + 40, 190], mon: [70, RY[1] + 30, 124], spk: [190, 446, 46] };

  // ── conteúdo dos blocos ──
  const SVCROWS = [[['produto 42', 11, 'acc'], ['gato de pelúcia · 79.90', 7.4]], [['carrinho da Lena', 9.5], ['1 item', 9, 'acc']],
    [['quem comprou 42', 9.5], ['caneca azul · 19.90', 7.4, 'acc']], [['pedido 1048', 11, 'acc'], ['"a caminho"', 8.6]]];
  const DOWN = [['FORA DO AR', 12, 'bad'], ['não responde', 8, 'dim']];
  const HOME = { d: ['gato de pelúcia', 'R$ 79,90'], c: ['carrinho', '1 item'], r: ['recomendado', 'caneca azul'], p: ['pedido 1048', 'a caminho'] };
  // tela do celular: cartões com estado skel (ainda não chegou), ok, new (acabou de chegar), bad, dim (tela antiga), gone (a seção some)
  const home = (st = {}, head = 'loja · app', extra) => ({ head, cards: ['d', 'c', 'r', 'p'].map(k => { const v = st[k] || 'skel', a = Array.isArray(v) ? v : [v];
    return [HOME[k][0], a[1] || HOME[k][1], a[0]]; }), ...extra });
  const ALL = s => ({ d: s, c: s, r: s, p: s });
  const gwRows = (...l) => [['api.loja.com.br', 6.8, 'dim'], ['confere o JWT', 8.2], ['limita o robô', 8.2], ...l];

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { pos: { ...LAY[sc] }, cli: { ...CLI[sc] }, on: {}, rows: {}, lab: {}, beams: [], tags: [], msgs: [], who: [],
      stats: [], tl: null, bars: null, resT: 'RESPOSTA', res: [], cmd: [], ph: {}, mon: null, spk: 0 };
    o.rows.gw = gwRows(['repassa ao serviço', 8.2, 'dim']);
    SVC.forEach((s, i) => o.rows['s' + i] = SVCROWS[i]);
    o.ph.A = home({}, 'loja · app');
    if (o.cli.mon) o.mon = { head: 'loja.com.br', lines: [['site da loja', 'dim']] };
    return o;
  }
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : AT[at]), text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  const down = (o, nm) => { o.rows[nm] = DOWN; o.on[nm] = 'bad'; };
  // relógio e bytes do celular (sem e compor)
  const clock = (o, ms, kb, calls, segs, max = 480) => { o.stats = [['RELÓGIO (4G)', fmtMs(ms), ms > 150 ? 'bad' : 'acc'], ['NO CELULAR', kb + ' KB', kb > KB_APP ? 'bad' : 'acc'], ['CHAMADAS PELO 4G', String(calls)]];
    o.tl = { max, now: ms, segs }; o.ms = ms; o.kb = kb; };
  const SEGS4 = k => [0, 1, 2, 3].slice(0, k).map(i => [i * RTT, (i + 1) * RTT, SVC[i].slice(0, 4), 'bad']);
  const REQ = ['GET /produtos/42', 'GET /carrinho/resumo', 'GET /recomendacoes/42', 'GET /pedidos/ultimo'];
  const RESP = ['42 · 79.90 · 45 KB', '1 item · 45 KB', 'caneca azul · 45 KB', '1048 · 45 KB'];
  const KEYS4 = ['d', 'c', 'r', 'p'];
  const JSONK = k => JSON_SCR.filter(l => l[1] < k).map(l => [l[0], 'acc']);

  // passo k da fila sem BFF: o celular pede, o gw repassa, o serviço responde com JSON do site
  function semCall(o, t, k) {
    const st = {}; for (let i = 0; i < k; i++) st[KEYS4[i]] = 'ok';
    o.ph.A = home(st, 'loja · app · 4G'); o.on.gw = 1; o.rows.gw = gwRows([`chamada ${k + 1} de 4`, 8.2, 'acc'], ['repassa ao serviço', 8.2, 'dim']);
    for (let i = 0; i < 4; i++) if (i !== k) quiet(o, R.c2s(i));
    const ms = ramp(t, 0.3, 3.1, k * RTT, (k + 1) * RTT);
    send(o, t, 0.3, 1.6, R.c2s(k), REQ[k], 'hi', 0.1); if (t > 1.4 && t < 2.2) o.on['s' + k] = 1;
    const back = send(o, t, 1.8, 3.1, rev(R.c2s(k)), RESP[k], 'bad', 0.6);
    if (back) { st[KEYS4[k]] = 'new'; o.ph.A = home(st, 'loja · app · 4G'); }
    clock(o, ms, (k + (back ? 1 : 0)) * 45, k + 1, [...SEGS4(k), [k * RTT, ms, SVC[k].slice(0, 4), 'bad']]);
    o.cmd = [REQ[k], back ? `200 OK · 45 KB (JSON feito para o site)` : '…'];
    o.resT = 'RESPOSTA ' + (k + 1) + ' DE 4 (FEITA PARA O SITE)';
    o.res = k === 0 ? SITE_JSON.slice(1).map((l, i) => [l, i === 3 ? 'bad' : 'hi']) : [[`${REQ[k]} → 200 OK`, 'hi'], ['45 KB: o formato completo do site', 'dim'], [`até agora: ${(k + (back ? 1 : 0)) * 45} KB`, 'bad']];
    return back;
  }
  // compor: a mesma home montada pelo bff-app
  const PAR = [{ s: 0, back: 2.6, txt: '42 · 79.90 · 25 ms' }, { s: 1, back: 1.5, txt: '1 item' }, { s: 2, back: 1.8, txt: 'caneca azul' }, { s: 3, back: 2.1, txt: '1048 · a caminho' }];
  const bffRows = (...l) => [['GET /app/home', 8.6, 'dim'], ...l];

  const STEPS = {
    sem: [
      { id: 'pede', dur: 5, title: 'A tela inicial pede 4 coisas a 4 serviços',
        story: 'A Lena, em Recife, no 4G, abre o app. A tela inicial precisa do gato de pelúcia (produto 42, R$ 79,90) do catalogo, do carrinho (1 item) do carrinho, do "quem comprou também comprou" (a caneca azul) do recomendacoes e do status do pedido 1048 ("a caminho") do pedidos. Ainda não existe BFF: o celular vai buscar cada uma pelo gw-loja.',
        look: 'No celular, as 4 seções estão vazias. À direita, os 4 serviços acendem um por um com o que cada um guarda.',
        key: 'Uma tela, quatro serviços: alguém precisa fazer as quatro chamadas.',
        f(o, t) { clock(o, 0, 0, 0, []); o.ph.A = home({}, 'loja · app · 4G'); for (let i = 0; i < 4; i++) { quiet(o, R.c2s(i)); if (t > 0.5 + i * 0.8) o.on['s' + i] = 1; }
          o.cmd = ['a tela precisa de:', 'catalogo → produto 42', 'carrinho → 1 item', 'recomendacoes → caneca azul', 'pedidos → pedido 1048'];
          o.resT = 'O QUE A TELA PRECISA'; o.res = [['destaque: gato de pelúcia · R$ 79,90', 'hi'], ['carrinho: 1 item', 'hi'], ['recomendado: caneca azul', 'hi'], ['pedido 1048: a caminho', 'hi']];
          if (t > 3.6) T(o, 'A', '4 seções vazias\n4 serviços para chamar', 'hi'); } },
      { id: 'c1', dur: 5, title: 'Chamada 1: catalogo, 120 ms',
        story: 'O celular pede o produto 42 ao gateway, que repassa ao catalogo. A ida e volta no 4G leva 120 ms. A resposta foi feita para o site: descrição longa, 8 fotos em alta e um campo interno, custo_fornecedor, que nunca devia sair da rede da loja.',
        look: 'A luz sai do celular, atravessa o gw-loja e chega ao catalogo. Volta vermelha com 45 KB, e o relógio do mostrador vai a 120 ms.',
        key: 'Cada chamada pelo 4G custa uma ida e volta inteira: 120 ms.',
        f(o, t) { if (semCall(o, t, 0) && t > 3.4) T(o, 's0', 'custo_fornecedor: 31.20\nfoi junto para o celular', 'bad'); } },
      { id: 'c2', dur: 5, title: 'Chamada 2: carrinho, 240 ms',
        story: 'Só agora o celular pede o carrinho. Cada chamada espera a anterior voltar para saber o que pedir em seguida, então elas andam em fila. Mais 120 ms de 4G: o relógio já marca 240 ms e a tela ainda tem duas seções vazias.',
        look: 'A segunda viagem faz o mesmo caminho, até o carrinho. No mostrador, a linha do tempo ganha o segundo bloco de 120 ms.',
        key: 'Em fila, os tempos se somam.',
        f(o, t) { semCall(o, t, 1); } },
      { id: 'c3', dur: 5, title: 'Chamada 3: recomendacoes, 360 ms',
        story: 'O recomendacoes precisa do id do produto que veio na primeira resposta (42) para dizer quem comprou também comprou: a caneca azul. Terceira viagem pelo 4G, mais 120 ms. Já são 360 ms e 135 KB.',
        look: 'A luz vai ao recomendacoes e volta. A seção "recomendado" aparece no celular.',
        key: 'Uma chamada que depende de outra não pode sair antes dela.',
        f(o, t) { semCall(o, t, 2); } },
      { id: 'c4', dur: 5.5, title: 'Chamada 4: pedidos, 480 ms',
        story: 'Por último, o status do pedido 1048: "a caminho". Quatro viagens em fila somam 4 × 120 = 480 ms só de rede antes de a tela ficar inteira, e chegaram 180 KB de JSON ao celular da Lena.',
        look: 'A quarta luz volta e o relógio para em 480 ms; o contador de KB, em 180.',
        key: 'Sem BFF: 4 chamadas pelo 4G, 480 ms, 180 KB.',
        f(o, t) { if (semCall(o, t, 3) && t > 3.6) T(o, 'A', '480 ms · 180 KB\ntela inteira, enfim', 'bad'); } },
      { id: 'erro', dur: 6, title: 'E se der errado: 180 KB que a tela joga fora',
        story: 'A tela usa um nome, um preço, uma foto pequena, um número de itens e uma frase de status. O resto dos 180 KB (descrição longa, 8 fotos em alta) é jogado fora, e o plano de dados da Lena pagou por eles. Pior: o custo_fornecedor, de 31.20, chegou ao celular de quem abriu o app. Ninguém ficou entre a tela e os serviços para decidir o que passa.',
        look: 'O celular está completo, mas o balão vermelho mostra o campo interno que chegou até ele. No mostrador, 480 ms e 180 KB em vermelho.',
        key: 'Sem ninguém no meio, o celular paga as viagens, os bytes e ainda vê o que não devia.',
        f(o, t) { clock(o, 480, 180, 4, SEGS4(4)); o.ph.A = home(ALL('ok'), 'loja · app · 4G'); for (let i = 0; i < 4; i++) quiet(o, R.c2s(i));
          o.cmd = SITE_JSON; o.resT = 'O QUE CHEGOU AO CELULAR'; o.res = SITE_JSON.slice(1).map((l, i) => [l, i === 3 ? 'bad' : i ? 'dim' : 'hi']);
          if (t > 0.6) T(o, 'A', 'custo_fornecedor: 31.20\nno celular da Lena', 'bad');
          if (t > 2.0) T(o, 's0', '8 fotos em alta\ndescrição de 3 parágrafos', 'bad'); } },
    ],
    compor: [
      { id: 'uma', dur: 5, title: 'Uma chamada: GET /app/home',
        story: 'Agora existe o bff-app. O app faz uma chamada só, GET /app/home, com o token. O gw-loja confere o JWT, como no módulo 8, e entrega o pedido ao bff-app, que já está dentro da rede da loja, ao lado dos serviços.',
        look: 'A luz sai do celular, passa pelo gw-loja e para no balcão do bff-app. O relógio anda a metade da ida e volta do 4G: 60 ms.',
        key: 'Pelo 4G, uma viagem só.',
        f(o, t) { o.ph.A = home({}, 'loja · app · 4G'); const ms = ramp(t, 0.3, 1.8, 0, RTT / 2); clock(o, ms, 0, 1, [[0, ms, '4G ida', 'acc']]);
          for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          if (send(o, t, 0.3, 1.8, R.c2b(0), 'GET /app/home · JWT', 'hi', 0.6)) { o.on.bA = 1; o.rows.bA = bffRows(['chegou o pedido', 9, 'acc'], ['vai chamar 4 serviços', 8]); }
          if (t > 0.8 && t < 1.6) { o.on.gw = 1; o.rows.gw = gwRows(['JWT ok', 9, 'acc'], ['/app/ → bff-app', 8.2]); }
          o.rows.bA = o.rows.bA || bffRows(['esperando', 9, 'dim']);
          o.cmd = ['GET /app/home', 'Authorization: Bearer <JWT>']; o.resT = 'PEDIDO'; o.res = [['GET /app/home', 'hi'], ['Authorization: Bearer <JWT>', 'dim'], ['1 chamada pelo 4G (antes: 4)', 'acc']];
          if (t > 2.6) T(o, 'gw', 'JWT conferido\n→ bff-app'); } },
      { id: 'par', dur: 5.5, title: 'O bff-app chama os 4 ao mesmo tempo',
        story: 'O bff-app dispara as quatro chamadas juntas: catalogo, carrinho, recomendacoes e pedidos. Elas não passam pelo 4G, ficam na rede da loja. Como saíram ao mesmo tempo, o BFF espera só a mais lenta, o catalogo: 25 ms. Em fila, seriam a soma dos quatro tempos.',
        look: 'Quatro luzes saem do bff-app ao mesmo tempo e voltam em momentos diferentes; a última é a do catalogo, com 25 ms.',
        key: 'Em paralelo, o tempo é o do serviço mais lento.',
        f(o, t) { o.ph.A = home({}, 'loja · app · 4G'); o.on.bA = 1; let got = 0;
          PAR.forEach(p => { send(o, t, 0.3, 1.0, R.b2s(0, p.s), null, 'hi', 0.05); if (t > 0.9 && t < p.back + 0.2) o.on['s' + p.s] = 1;
            if (send(o, t, p.back - 0.4 + 0.2, p.back + 0.2, rev(R.b2s(0, p.s)), p.txt, 'acc', 0.5)) got++; });
          const ms = 60 + ramp(t, 0.3, 2.6, 0, SLOW); clock(o, ms, 0, 1, [[0, 60, '4G ida', 'acc'], [60, ms, 'rede da loja', 'acc']]);
          o.rows.bA = bffRows([`respostas: ${got} de 4`, 9.5, 'acc'], ['em paralelo', 8], [got === 4 ? 'o mais lento: 25 ms' : 'esperando o mais lento', 8, got === 4 ? 'acc' : 'dim']);
          o.cmd = ['g.Go(catalogo.Produto(ctx, 42))', 'g.Go(carrinho.Resumo(ctx, lena))', 'g.Go(recomendacoes.Para(ctx, 42))', 'g.Go(pedidos.Ultimo(ctx, lena))', 'g.Wait()  // espera o mais lento'];
          o.resT = 'CHAMADAS DO BFF (EM PARALELO)'; o.res = PAR.map(p => [`${SVC[p.s]}: ${t > p.back + 0.2 ? p.txt : '…'}`, t > p.back + 0.2 ? 'acc' : 'dim']);
          if (t > 3.0) T(o, 's0', 'o mais lento: 25 ms\n(4G: 120 ms)'); } },
      { id: 'monta', dur: 5.5, title: 'Monta a resposta, pedaço por pedaço',
        story: 'Com as quatro respostas na mão, o bff-app monta o JSON da tela: só os campos que ela desenha, uma foto em miniatura (gato-320.webp) e nada de custo_fornecedor. Destaque, carrinho, recomendado e pedido entram um de cada vez. Ficam 12 KB, e a montagem leva uns 5 ms.',
        look: 'No balcão do bff-app e no mostrador, a resposta cresce de um pedaço por vez; o contador de KB sobe até 12.',
        key: 'O BFF corta e adapta: a resposta tem o formato da tela, não o do serviço.',
        f(o, t) { o.ph.A = home({}, 'loja · app · 4G'); o.on.bA = 2; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          const k = t < 0.5 ? 0 : Math.min(4, 1 + Math.floor((t - 0.5) / 0.8)), names = ['"destaque"', '"carrinho"', '"recomendado"', '"pedido"'];
          o.rows.bA = [['monta o JSON', 8.6, 'dim'], ...names.map((n, i) => [i < k ? n + ' ✓' : n, 8.4, i < k ? 'acc' : 'dim'])];
          const ms = 85 + ramp(t, 0.5, 3.7, 0, MONTA); clock(o, ms, k * 3, 1, [[0, 60, '4G ida', 'acc'], [60, 85, 'loja', 'acc'], [85, ms, '', 'acc']]);
          o.resT = `RESPOSTA DO BFF-APP · ${k * 3} KB`; o.res = JSONK(k); o.cmd = ['{', ...JSON_APP.filter((l, i) => i > 0 && i < 6 && [0, 0, 1, 2, 3][i - 1] < k), '}'];
          if (t > 3.9) T(o, 'bA', '12 KB · 1 foto pequena\nsem custo_fornecedor'); } },
      { id: 'volta', dur: 5.5, title: 'Volta ao celular: ~150 ms e 12 KB',
        story: 'A resposta volta pelo gw-loja e pelo 4G: mais 60 ms. O total fica em ~150 ms (120 de rede, 25 do serviço mais lento, ~5 de montagem) e chegam 12 KB. Antes eram 480 ms e 180 KB. O app não precisa saber quais serviços existem nem em que ordem chamá-los.',
        look: 'A luz volta do bff-app ao celular e as 4 seções da tela aparecem juntas. O relógio para em 150 ms.',
        key: 'Com o BFF: 1 chamada pelo 4G, ~150 ms, 12 KB.',
        f(o, t) { o.ph.A = home({}, 'loja · app · 4G'); o.rows.bA = [['resposta pronta', 8.6, 'dim'], ['12 KB', 11, 'acc'], ['4 seções', 8.4]]; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          const ms = 90 + ramp(t, 0.3, 1.8, 0, 60), back = send(o, t, 0.3, 1.8, rev(R.c2b(0)), '200 OK · 12 KB', 'acc', 0.6);
          clock(o, back ? 150 : ms, KB_APP, 1, [[0, 60, '4G ida', 'acc'], [60, 90, 'loja', 'acc'], [90, back ? 150 : ms, '4G volta', 'acc']]);
          if (back) o.ph.A = home(ALL('new'), 'loja · app · 4G');
          o.cmd = ['200 OK', ...JSON_APP]; o.resT = 'RESPOSTA REAL · 12 KB'; o.res = JSONK(4);
          if (t > 2.4) T(o, 'A', '~150 ms · 12 KB\nantes: 480 ms · 180 KB'); } },
      { id: 'erro', dur: 6.5, title: 'E se der errado: um serviço falha e a tela inteira falha',
        story: 'Do jeito que está, o bff-app espera os quatro serviços e, se um deles falha, devolve erro para a tela toda. O recomendacoes cai e a Lena recebe 502 Bad Gateway: nem o gato, nem o carrinho, nem o pedido. A tela passa a depender dos quatro ao mesmo tempo. Se cada um responde bem em 99,9% das vezes, ela responde bem em 0,999⁴ ≈ 99,6%.',
        look: 'O recomendacoes fica vermelho. As outras três respostas chegam, mas o bff-app devolve 502 e a tela do celular fica vazia, com o erro.',
        key: 'Composição sem plano B: qualquer falha derruba a tela inteira (aula 6).',
        f(o, t) { o.ph.A = home({}, 'loja · app · 4G'); o.on.bA = 1; down(o, 's2');
          [0, 1, 3].forEach(s => { send(o, t, 0.3, 1.0, R.b2s(0, s), null, 'hi', 0.05); send(o, t, 1.2, 1.8, rev(R.b2s(0, s)), null, 'acc', 0.3); });
          o.beams.push({ pts: R.b2s(0, 2), on: true, tone: 'bad', cut: clamp((t - 0.3) / 0.7) * 0.7 });
          o.rows.bA = bffRows(['g.Wait() → erro', 9, 'bad'], ['recomendacoes falhou', 8, 'bad']); o.on.bA = t > 2.2 ? 'bad' : 1;
          const back = send(o, t, 2.4, 3.6, rev(R.c2b(0)), '502 Bad Gateway', 'bad', 0.6);
          clock(o, 0, 0, 1, []); o.stats = [['RESPOSTA', back ? '502' : '…', 'bad'], ['TELA', back ? 'vazia' : '…', 'bad'], ['CHAMADAS PELO 4G', '1']]; o.tl = null;
          o.bars = [['disponibilidade de cada serviço', 0.999, '', '99,9%'], ['da tela que precisa dos 4', 0.996, 'bad', '99,6%']];
          if (back) o.ph.A = { head: 'loja · app · 4G', cards: [], err: ['502', 'não foi possível', 'carregar a tela'] };
          o.cmd = ['if err := g.Wait(); err != nil {', '  // qualquer falha derruba a tela inteira', '  http.Error(w, "bad gateway", 502)', '}'];
          o.resT = 'RESPOSTA'; o.res = [['HTTP/1.1 502 Bad Gateway', 'bad'], ['recomendacoes não respondeu', 'dim'], ['as outras 3 respostas foram jogadas fora', 'dim'], ['0,999 × 0,999 × 0,999 × 0,999 ≈ 99,6%', 'hi']];
          if (t > 3.8) T(o, 'A', '502: a tela inteira caiu\npor causa de uma seção', 'bad'); } },
    ],
    canais: [
      { id: 'app', dur: 5, title: 'App: o pedido 1048 em miniatura',
        story: 'A Lena pergunta pelo pedido 1048 no app. O gw-loja manda /app/ para o bff-app, que chama o pedidos e responde com JSON pequeno, uma miniatura e paginação curta. Ele confia no JWT que o gateway já conferiu.',
        look: 'A luz vai do celular ao bff-app, que pergunta ao pedidos; a resposta volta e o celular mostra o cartão do pedido com a foto pequena.',
        key: 'O bff-app conhece o formato do app: pequeno, com miniatura.',
        f(o, t) { o.ph.A = { head: 'loja · app', cards: [['pedido 1048', '…', 'skel']] }; quiet(o, R.c2b(1), R.c2b(2), R.b2s(1, 3), R.b2s(2, 3));
          send(o, t, 0.3, 1.3, R.c2b(0), 'GET /app/pedidos/1048', 'hi', 0.1); if (t > 1.3) o.on.bA = 1;
          send(o, t, 1.4, 1.9, R.b2s(0, 3), null, 'hi', 0.1); if (t > 1.8 && t < 2.6) o.on.s3 = 1;
          send(o, t, 2.1, 2.6, rev(R.b2s(0, 3)), '1048 · a caminho', 'acc', 0.2);
          if (send(o, t, 2.8, 3.8, rev(R.c2b(0)), 'JSON · miniatura', 'acc', 0.5)) o.ph.A = { head: 'loja · app', cards: [['pedido 1048', 'a caminho', 'new'], ['[foto 320 px]', 'chega quinta', 'ok']] };
          o.rows.bA = bffRows(['JSON pequeno', 9, 'acc'], ['miniatura · JWT', 8]); o.rows.bA[0] = ['/app/', 8.6, 'dim'];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'acc'], ['/web/ → bff-web', 8.2, 'dim'], ['/voz/ → bff-voz', 8.2, 'dim']);
          o.stats = [['CANAL', 'app', 'acc'], ['FORMATO', 'JSON', 'hi'], ['FOTO', 'miniatura', 'hi']];
          o.cmd = ['GET /app/pedidos/1048', '{ "id": 1048, "status": "a caminho",', '  "foto": "gato-320.webp" }']; o.resT = 'O QUE O APP RECEBE';
          o.res = [['{ "id": 1048, "status": "a caminho",', 'acc'], ['  "foto": "gato-320.webp" }', 'acc'], ['JSON pequeno · miniatura · paginação curta', 'dim']];
          if (t > 4.0) T(o, 'bA', 'app: miniatura'); } },
      { id: 'web', dur: 5, title: 'Site: uma página com fotos grandes',
        story: 'A Bia abre o mesmo pedido no site. O gw-loja manda /web/ para o bff-web, que pergunta ao mesmo pedidos, renderiza a página no servidor (SSR), com fotos grandes, e guarda a sessão num cache central, o Redis do módulo 5.',
        look: 'A luz vai do monitor ao bff-web e ao pedidos. Volta uma página inteira, que aparece no monitor com a foto grande.',
        key: 'O bff-web conhece o site: HTML pronto, fotos grandes, sessão no Redis.',
        f(o, t) { o.ph.A = { head: 'loja · app', cards: [['pedido 1048', 'a caminho', 'ok'], ['[foto 320 px]', 'chega quinta', 'ok']] }; quiet(o, R.c2b(0), R.c2b(2), R.b2s(0, 3), R.b2s(2, 3));
          o.mon = { head: 'loja.com.br/pedidos/1048', lines: [['carregando…', 'dim']] };
          send(o, t, 0.3, 1.3, R.c2b(1), 'GET /web/pedidos/1048', 'hi', 0.1); if (t > 1.3) o.on.bB = 1;
          send(o, t, 1.4, 1.9, R.b2s(1, 3), null, 'hi', 0.1); if (t > 1.8 && t < 2.6) o.on.s3 = 1;
          send(o, t, 2.1, 2.6, rev(R.b2s(1, 3)), '1048 · a caminho', 'acc', 0.2);
          if (send(o, t, 2.8, 3.8, rev(R.c2b(1)), 'HTML (SSR) · fotos grandes', 'acc', 0.5)) o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Pedido 1048', 'hi'], ['a caminho · chega quinta', 'acc'], ['gato de pelúcia · R$ 79,90', 'dim']] };
          o.rows.bB = [['/web/', 8.6, 'dim'], ['renderiza (SSR)', 9, 'acc'], ['sessão no Redis', 8]];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'dim'], ['/web/ → bff-web', 8.2, 'acc'], ['/voz/ → bff-voz', 8.2, 'dim']);
          o.stats = [['CANAL', 'site', 'acc'], ['FORMATO', 'HTML', 'hi'], ['FOTO', 'grande', 'hi']];
          o.cmd = ['GET /web/pedidos/1048', '200 OK · text/html', '(página renderizada no servidor, fotos grandes)']; o.resT = 'O QUE O SITE RECEBE';
          o.res = [['200 OK · Content-Type: text/html', 'acc'], ['<h1>Pedido 1048</h1> <p>a caminho</p>', 'hi'], ['<img src="gato-1.jpg"> (foto grande)', 'hi'], ['sessão da Bia no Redis (módulo 5)', 'dim']];
          if (t > 4.0) T(o, 'bB', 'site: página e foto grande'); } },
      { id: 'voz', dur: 5.5, title: 'Voz: uma frase, nenhuma foto',
        story: 'A Lena pergunta ao assistente: "cadê meu pedido?". O gw-loja manda /voz/ para o bff-voz, que pergunta ao mesmo pedidos e devolve texto curto, sem foto: "Seu pedido 1048 está a caminho e chega quinta."',
        look: 'A luz sai do alto-falante, passa pelo bff-voz e pelo pedidos; o anel do alto-falante acende e a frase aparece ao lado dele.',
        key: 'O bff-voz conhece a voz: só texto, curto, para ser falado.',
        f(o, t) { o.ph.A = { head: 'loja · app', cards: [['pedido 1048', 'a caminho', 'ok'], ['[foto 320 px]', 'chega quinta', 'ok']] }; quiet(o, R.c2b(0), R.c2b(1), R.b2s(0, 3), R.b2s(1, 3));
          o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Pedido 1048', 'hi'], ['a caminho · chega quinta', 'acc'], ['gato de pelúcia · R$ 79,90', 'dim']] };
          if (t > 0.1 && t < 1.0) T(o, 'spk', '"cadê meu pedido?"', 'hi');
          send(o, t, 0.6, 1.5, R.c2b(2), 'GET /voz/pedido', 'hi', 0.1); if (t > 1.5) o.on.bC = 1;
          send(o, t, 1.6, 2.1, R.b2s(2, 3), null, 'hi', 0.1); if (t > 2.0 && t < 2.8) o.on.s3 = 1;
          send(o, t, 2.3, 2.8, rev(R.b2s(2, 3)), '1048 · a caminho', 'acc', 0.2);
          const said = send(o, t, 3.0, 3.9, rev(R.c2b(2)), 'texto · 0 fotos', 'acc', 0.4); if (said) { o.spk = 1; T(o, 'spk', '"Seu pedido 1048 está a caminho\ne chega quinta."'); }
          o.rows.bC = [['/voz/', 8.6, 'dim'], ['texto curto', 9, 'acc'], ['sem foto', 8]];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'dim'], ['/web/ → bff-web', 8.2, 'dim'], ['/voz/ → bff-voz', 8.2, 'acc']);
          o.stats = [['CANAL', 'voz', 'acc'], ['FORMATO', 'texto', 'hi'], ['FOTO', 'nenhuma', 'hi']];
          o.cmd = ['GET /voz/pedido', '"Seu pedido 1048 está a caminho e chega quinta."']; o.resT = 'O QUE A VOZ RECEBE';
          o.res = [['"Seu pedido 1048 está a caminho', 'acc'], [' e chega quinta."', 'acc'], ['texto para ser falado · nenhuma foto', 'dim']]; } },
      { id: 'tres', dur: 5, title: 'Um dado, três formas',
        story: 'Os três BFFs chamaram o mesmo serviço, o pedidos. O dado é um só, o pedido 1048 a caminho, e o que muda é a forma: miniatura no app, página no site, frase na voz. Cada canal evolui sozinho. O parceiro marketplace-xyz não ganha BFF: continua no gateway, com a API pública genérica, porque BFF é para frontend próprio.',
        look: 'As três linhas acendem juntas e terminam no mesmo pedidos. Cada cliente mostra o 1048 do seu jeito.',
        key: 'Um BFF por canal: o mesmo dado, no formato de cada frontend.',
        f(o, t) { o.ph.A = { head: 'loja · app', cards: [['pedido 1048', 'a caminho', 'ok'], ['[foto 320 px]', 'chega quinta', 'ok']] };
          o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Pedido 1048', 'hi'], ['a caminho · chega quinta', 'acc'], ['gato de pelúcia · R$ 79,90', 'dim']] };
          [0, 1, 2].forEach(r => { const a = 0.3 + r * 0.25; o.beams.push({ pts: R.c2b(r), on: t > a, dot: t > a && t < a + 1 ? ease(t - a) : null }); o.beams.push({ pts: R.b2s(r, 3), on: t > a + 1, dot: t > a + 1 && t < a + 1.6 ? ease((t - a - 1) / 0.6) : null }); if (t > a + 0.8) o.on[['bA', 'bB', 'bC'][r]] = 1; });
          if (t > 1.6) o.on.s3 = 2; o.spk = t > 2.2 ? 1 : 0;
          o.rows.bA = [['/app/', 8.6, 'dim'], ['JSON + miniatura', 9, 'acc']]; o.rows.bB = [['/web/', 8.6, 'dim'], ['HTML + foto grande', 9, 'acc']]; o.rows.bC = [['/voz/', 8.6, 'dim'], ['uma frase', 9, 'acc']];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'acc'], ['/web/ → bff-web', 8.2, 'acc'], ['/voz/ → bff-voz', 8.2, 'acc'], ['/ → API pública', 8.2, 'dim'], ['(marketplace-xyz)', 7.4, 'dim']);
          o.stats = [['CANAIS', '3', 'acc'], ['SERVIÇO', 'pedidos', 'hi'], ['DADO', '1048', 'hi']];
          o.cmd = ['- match: { prefix: "/app/" }', '  route: { cluster: bff-app, timeout: 1s }', '- match: { prefix: "/web/" }', '  route: { cluster: bff-web, timeout: 3s }', '- match: { prefix: "/voz/" }', '  route: { cluster: bff-voz, timeout: 1s }', '- match: { prefix: "/" }   # marketplace-xyz', '  route: { cluster: api-publica }'];
          o.resT = 'O MESMO PEDIDO 1048'; o.res = [['app: { "id": 1048, "status": "a caminho", "foto": … }', 'acc'], ['site: <h1>Pedido 1048</h1> + foto grande', 'acc'], ['voz: "Seu pedido 1048 está a caminho…"', 'acc'], ['marketplace-xyz: API pública, sem BFF', 'dim']];
          if (t > 2.6) T(o, 's3', 'um serviço só\npara os 3 canais', 'hi'); } },
      { id: 'erro', dur: 7, title: 'E se der errado: um backend só, um if por canal',
        story: 'Volte ao começo, sem um BFF por canal: um backend só atende o app, o site e a voz. Cada endpoint decide pelo canal com um if, e o if cresce a cada endpoint novo. Cada regra nova de um canal passa por esse código, e quem mexe nele para o app pode quebrar a voz.',
        look: 'Os três balcões se juntam num backend único. No topo dele, os if (canal == …) se acumulam, um endpoint depois do outro.',
        key: 'Sem BFF por canal, o formato de cada canal vira if dentro de um backend só.',
        f(o, t) { const merged = t > 1.0; if (!merged) { o.pos.bA = BPOS.bB; o.pos.bC = BPOS.bB; } else { delete o.pos.bA; delete o.pos.bB; delete o.pos.bC; o.pos.one = [BX0, 140]; }
          o.ph.A = { head: 'loja · app', cards: [['pedido 1048', 'a caminho', 'ok']] }; o.mon = { head: 'loja.com.br/pedidos/1048', lines: [['Pedido 1048', 'hi'], ['a caminho', 'acc']] };
          [0, 1, 2].forEach(r => quiet(o, R.c2one(r))); quiet(o, R.one2s(3));
          const EP = ['/home', '/pedido', '/carrinho', '/produto'], n = merged ? Math.min(4, 1 + Math.floor((t - 1.2) / 1.0)) : 0;
          o.rows.one = [['um backend, 3 canais', 8.6, 'dim']]; for (let i = 0; i < n; i++) o.rows.one.push([`${EP[i]}:`, 8.6, 'hi'], ['if (canal == "app") …', 8.2, 'bad'], ['else if (canal == "web") …', 8.2, 'bad'], ['else if (canal == "voz") …', 8.2, 'bad']);
          o.rows.one = o.rows.one.slice(0, 1).concat(o.rows.one.slice(1).slice(-12)); if (merged) o.on.one = n >= 3 ? 'bad' : 1;
          o.rows.gw = gwRows(['tudo → backend', 8.2, 'dim']);
          o.stats = [['BACKENDS', merged ? '1' : '3', merged ? 'bad' : 'hi'], ['ENDPOINTS', String(n), 'hi'], ['IFs POR CANAL', String(n * 3), n ? 'bad' : 'hi']];
          o.cmd = ['if (canal == "app") {', '  resposta = { id, status, foto: miniatura }', '} else if (canal == "web") {', '  resposta = renderizarPagina(pedido, fotos: grandes)', '} else if (canal == "voz") {', '  resposta = "Seu pedido " + id + " está a caminho e chega quinta."', '}'];
          o.resT = 'O CÓDIGO DO BACKEND ÚNICO'; o.res = [[`${n} endpoints × 3 canais = ${n * 3} ramos de if`, n ? 'bad' : 'hi'], ['mexer no ramo do app pode quebrar a voz', 'bad'], ['um deploy para os 3 canais', 'dim']];
          if (t > 5.4) T(o, 'one', 'quem mexe para o app\npode quebrar a voz', 'bad'); } },
    ],
    versao: null, falha: null, metricas: null,
  };

  // versões: o v3 (30% dos celulares) e o v4 (nova home) rodam lado a lado; a toggle nova_home libera aos poucos
  const PCT = [10, 50, 100];
  const verBase = (o, pct, v3use = 30, v3on = true) => {
    o.lab.bA = ['BFF-APP-V3', 'tela antiga']; o.lab.bB = ['BFF-APP-V4', 'nova home'];
    o.rows.gw = gwRows(['x-app-version:', 8.2, 'dim'], ['4.x → bff-app-v4', 8.2, 'acc'], ['3.x → bff-app-v3', 8.2]);
    o.rows.bA = v3on ? [['contrato do v3', 8.6, 'dim'], ['tela antiga', 9.5], [`uso do v3: ${br(v3use)}%`, 8.6, v3use < 1 ? 'acc' : 'hi']] : [['desligado', 11, v3use < 1 ? 'dim' : 'bad'], [`uso do v3: ${br(v3use)}%`, 8.6, v3use < 1 ? 'dim' : 'bad']];
    o.rows.bB = pct == null ? [['contrato do v4', 8.6, 'dim'], ['nova_home: desligada', 9, 'dim']] : [['nova_home', 8.6, 'dim'], { grid: 10, on: pct / 10 }, [`${pct}% dos usuários do v4`, 8.6, 'acc']];
    o.ph.A = home(ALL('dim'), 'app v3 · tela antiga'); o.ph.B = pct >= 50 ? home(ALL('ok'), 'app v4 · nova home ✦') : home(ALL('dim'), 'app v4 · tela antiga');
    o.stats = [['NOVA_HOME (v4)', pct == null ? 'off' : pct + '%', 'acc'], ['USO DO V3', br(v3use) + '%', v3use < 1 ? 'acc' : 'hi'], ['BFFs DO APP', v3on ? '2' : '1', 'hi']];
    o.bars = [['nova_home nos usuários do v4', (pct || 0) / 100, '', (pct == null ? 0 : pct) + '%'], ['celulares ainda no v3', v3use / 100, v3use < 1 ? '' : 'dim', br(v3use) + '%'], ['limite para desligar o v3', 0.01, 'dim', '1%']];
    for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s), R.b2s(1, s));
  };
  const flowVer = (o, t, a = 0.3) => {
    send(o, t, a, a + 1.0, R.c2b(0), 'X-App-Version: 3.9', 'hi', 0.3); send(o, t, a + 0.4, a + 1.4, R.c2b(1), 'X-App-Version: 4.0.0', 'hi', 0.3);
    if (t > a + 1.0) o.on.bA = o.on.bA || 1; if (t > a + 1.4) o.on.bB = 1;
  };
  const togCmd = pct => ['{ "name": "nova_home",', '  "strategies": [{ "name": "flexibleRollout",', `    "parameters": { "rollout": "${pct}", "stickiness": "userId" } }] }`];
  STEPS.versao = [
    { id: 'dois', dur: 5.5, title: 'Dois apps no ar, dois BFFs',
      story: 'O app v3, antigo, ainda está instalado em 30% dos celulares, e o v4 traz a nova tela inicial. O app manda a versão em cada pedido (X-App-Version: 4.0.0) e o gw-loja escolhe o BFF: 4.x para o bff-app-v4, o resto para o bff-app-v3. O v3 continua recebendo a tela antiga, que ele sabe desenhar.',
      look: 'Dois celulares, duas luzes: o de cima (v3) vai ao bff-app-v3, o de baixo (v4) ao bff-app-v4. A toggle ainda está desligada.',
      key: 'Um BFF por versão: o contrato do v3 não quebra quando o v4 muda.',
      f(o, t) { verBase(o, null); flowVer(o, t);
        o.cmd = ['- match: { prefix: "/app/", headers:', '    [{ name: x-app-version, string_match: { prefix: "4." } }] }', '  route: { cluster: bff-app-v4 }', '- match: { prefix: "/app/" }   # sem cabeçalho ou 3.x', '  route: { cluster: bff-app-v3 }'];
        o.resT = 'ROTA NO GW-LOJA'; o.res = [['x-app-version: 4.x → bff-app-v4', 'acc'], ['sem cabeçalho ou 3.x → bff-app-v3', 'hi'], ['v3: 30% dos celulares', 'dim']];
        if (t > 2.6) { T(o, 'bA', 'v3: 30% dos celulares', 'hi'); } } },
    ...PCT.map((pct, i) => ({ id: 'p' + pct, dur: 5, pct,
      title: pct === 10 ? 'nova_home em 10% dos usuários do v4' : pct === 50 ? 'Sem erros: sobe para 50%' : '100%: todo o v4 vê a nova home',
      story: pct === 10 ? 'Dentro do v4, a feature toggle nova_home liga a tela nova para 10% dos usuários. O resto do v4 continua vendo a tela antiga. A escolha usa um hash do id de cada pessoa, para a mesma pessoa ver sempre a mesma tela; a Lena ainda não caiu nos 10%.'
        : pct === 50 ? 'Com 10% e nenhum erro, a toggle sobe para 50%. Agora a Lena entra: o celular dela, no v4, passa a receber a nova home. Se a tela nova der problema, voltar atrás é desligar a toggle, sem deploy e sem nova versão do app.'
        : 'Sem erros de novo, a toggle chega a 100% dos usuários do v4. O v3 continua igual, no bff-app-v3. Agora o código da tela antiga do v4 deve sair: toggle que ninguém remove vira if.',
      look: `No balcão do bff-app-v4, ${pct / 10} de 10 quadradinhos acesos: ${pct}% dos usuários do v4. ${pct >= 50 ? 'O celular de baixo mostra a nova home.' : 'O celular de baixo ainda mostra a tela antiga.'}`,
      key: pct === 10 ? 'A toggle decide quem vê a mudança dentro de uma versão.' : pct === 50 ? 'Liberar aos poucos: se der problema, só uma parte viu.' : 'Com 100%, a toggle cumpriu o papel e deve sair do código.',
      f(o, t) { verBase(o, pct); flowVer(o, t, 0.2); o.cmd = togCmd(pct);
        o.resT = 'FEATURE TOGGLE NOVA_HOME'; o.res = [[`rollout: ${pct}% · stickiness: userId`, 'acc'], [`${pct}% do v4 vê a nova home`, 'hi'], [pct >= 50 ? 'a Lena (v4) vê a nova home' : 'a Lena (v4) ainda vê a tela antiga', 'dim'], ['o v3 não muda: bff-app-v3', 'dim']];
        if (t > 2.4) T(o, 'bB', `nova_home: ${pct}%`); if (pct === 100 && t > 3.4) T(o, 'B', 'tela antiga do v4:\nhora de tirar o código', 'hi'); } })),
    { id: 'aposenta', dur: 6.5, title: 'Aposentar o v3: só abaixo de 1%',
      story: 'Com o tempo, as pessoas atualizam o app e o uso do v3, medido no próprio bff-app-v3, vai caindo: 30%, 12%, 4%, 0,8%. Só quando ele fica abaixo de 1% a loja desliga o bff-app-v3. Quem ainda está no v3 recebe um aviso para atualizar.',
      look: 'O número de uso do v3 desce no mostrador e no balcão; ao passar de 1%, o bff-app-v3 apaga.',
      key: 'Desligar uma versão é decisão com dado: o uso medido no BFF.',
      f(o, t) { const use = t < 3.6 ? [30, 12, 4, 0.8][Math.min(3, Math.floor(t / 0.9))] : 0.8, off = t > 4.2; verBase(o, 100, use, !off);
        if (!off) { send(o, t, 0.2, 1.0, R.c2b(0), 'v3', 'hi', 0.1); o.on.bA = use < 1 ? 1 : 0; } else { o.on.bA = 'off'; quiet(o, R.c2b(0)); }
        send(o, t, 0.2, 1.0, R.c2b(1), null, 'hi', 3); o.on.bB = 1;
        if (off) o.ph.A = { head: 'app v3', cards: [], err: ['v3', 'atualize o app', 'para continuar'], tone: 'dim' };
        o.cmd = ['uso do v3 (medido no bff-app-v3):', '30% → 12% → 4% → 0,8%', off ? '< 1%: bff-app-v3 desligado' : 'desligar só abaixo de 1%'];
        o.resT = 'USO DO V3'; o.res = [[`agora: ${br(use)}% dos celulares`, use < 1 ? 'acc' : 'hi'], ['limite: 1%', 'dim'], [off ? 'bff-app-v3 desligado' : 'bff-app-v3 no ar', off ? 'acc' : 'hi']];
        if (off) T(o, 'bA', 'abaixo de 1%: desligado'); } },
    { id: 'erro', dur: 6.5, title: 'E se der errado: desligar o v3 com 30% no ar',
      story: 'Volte ao começo, com o v3 ainda em 30% dos celulares, e imagine que a loja desliga o bff-app-v3 junto com o lançamento do v4. O gw-loja manda os pedidos do v3 para um BFF que não existe mais, e o app antigo não sabe desenhar a tela nova. Quase um terço das pessoas fica sem tela inicial.',
      look: 'O bff-app-v3 está apagado. A luz do celular v3 volta vermelha e a tela dele fica com o erro.',
      key: 'O app no celular não se atualiza quando a loja quer: o BFF da versão velha fica até o uso cair.',
      f(o, t) { verBase(o, 100, 30, false); o.on.bA = 'bad'; o.on.bB = 1; send(o, t, 0.2, 1.0, R.c2b(1), null, 'hi', 5);
        const got = send(o, t, 0.3, 1.3, R.c2b(0), 'X-App-Version: 3.9', 'hi', 0.1);
        if (got) { o.beams.push({ pts: R.c2b(0), on: true, tone: 'bad' }); o.ph.A = { head: 'app v3', cards: [], err: ['503', 'tela inicial', 'indisponível'] }; }
        o.stats[1][2] = 'bad'; o.stats[2] = ['SEM TELA', got ? '30%' : '…', 'bad'];
        o.cmd = ['GET /app/home  (X-App-Version: 3.9)', '→ bff-app-v3: desligado', '503 Service Unavailable']; o.resT = 'O QUE O V3 RECEBE';
        o.res = [['HTTP/1.1 503 Service Unavailable', 'bad'], ['30% dos celulares ainda estão no v3', 'bad'], ['o v3 não sabe desenhar a nova home', 'dim']];
        if (t > 2.2) T(o, 'A', '30% dos celulares\nsem tela inicial', 'bad'); } },
  ];

  // falha: timeout de 100 ms e fallback; sem timeout, o BFF trava; o catalogo cai e os dois canais sentem
  const falBase = o => { o.lab.bB = ['BFF-WEB', 'site']; o.rows.bB = [['/web/', 8.6, 'dim'], ['página do site', 9]];
    o.mon = { head: 'loja.com.br', photo: 1, lines: [['gato de pelúcia', 'hi'], ['R$ 79,90', 'acc']] }; for (let s = 0; s < 4; s++) quiet(o, R.b2s(1, s)); quiet(o, R.c2b(1)); };
  const fanOut = (o, t, skip, a = 0.3) => [0, 1, 2, 3].forEach(s => { send(o, t, a, a + 0.6, R.b2s(0, s), null, 'hi', 0.05); if (!skip.includes(s)) send(o, t, a + 0.8, a + 1.3, rev(R.b2s(0, s)), null, 'acc', 0.3); });
  const waitStat = (ms, conns, tela, tone = 'acc') => [['ESPERA DO BFF', ms >= 1000 ? br((ms / 1000).toFixed(ms < 10000 ? 1 : 0)) + ' s' : fmtMs(ms), ms > 100 ? 'bad' : tone], ['CONEXÕES ABERTAS', conns.toLocaleString('pt-BR'), conns > 100 ? 'bad' : 'hi'], ['TELA', tela, tela === 'some' ? 'bad' : 'acc']];
  STEPS.falha = [
    { id: 'cai', dur: 5, title: 'O recomendacoes não responde',
      story: 'A Lena abre o app e o bff-app chama os quatro serviços ao mesmo tempo, como na aula 2. Três respondem. O recomendacoes está fora do ar e não responde. Só que agora o bff-app espera no máximo 100 ms por cada serviço.',
      look: 'Três luzes voltam ao bff-app; a do recomendacoes fica presa no meio do caminho. No balcão, o relógio da espera sobe até 100 ms.',
      key: 'Cada chamada do BFF tem um prazo: o timeout.',
      f(o, t) { falBase(o); down(o, 's2'); send(o, t, 0.1, 0.6, R.c2b(0), 'GET /app/home', 'hi', 5); o.on.bA = 1; fanOut(o, t, [2], 0.6);
        const w = ramp(t, 0.9, 3.4, 0, 100); o.beams.push({ pts: R.b2s(0, 2), on: true, tone: 'bad', cut: 0.6 });
        o.ph.A = home({}, 'loja · app');
        o.rows.bA = bffRows(['3 de 4 responderam', 9, 'acc'], [`recomendacoes: ${Math.round(w)} ms`, 8.6, 'bad'], ['timeout: 100 ms', 8.2, 'dim']);
        o.stats = waitStat(w, 1, '…'); o.bars = [['espera pelo recomendacoes', w / 100, w >= 100 ? 'bad' : '', fmtMs(w)], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['ctx, cancel := context.WithTimeout(ctx, 100*time.Millisecond)', 'r, err := recomendacoes.Para(ctx, 42)'];
        o.resT = 'CHAMADAS DO BFF'; o.res = [['catalogo: 42 · 79.90', 'acc'], ['carrinho: 1 item', 'acc'], ['pedidos: 1048 · a caminho', 'acc'], [`recomendacoes: … ${Math.round(w)} ms`, 'bad']];
        if (t > 3.4) T(o, 's2', 'não respondeu\nem 100 ms', 'bad'); } },
    { id: 'fallback', dur: 5.5, title: 'Timeout de 100 ms e fallback',
      story: 'Passados os 100 ms, o bff-app desiste daquela chamada, e só daquela. Em vez de falhar, usa o plano B (fallback): monta a tela sem a seção "quem comprou também comprou", com "recomendado": []. A tela chega, só um pouco menor. A Lena nem percebe.',
      look: 'O BFF responde ao celular; a tela aparece com destaque, carrinho e pedido, e a seção de recomendados some.',
      key: 'Fallback: quando um enfeite falha, a tela sai sem ele.',
      f(o, t) { falBase(o); down(o, 's2'); o.on.bA = 1; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s)); o.beams.push({ pts: R.b2s(0, 2), tone: 'bad', on: true, cut: 0.6 });
        o.rows.bA = bffRows(['timeout: 100 ms', 9, 'acc'], ['"recomendado": []', 9, 'acc'], ['fallback', 8.2, 'dim']);
        const back = send(o, t, 0.6, 1.8, rev(R.c2b(0)), '200 OK · sem recomendados', 'acc', 0.6);
        o.ph.A = back ? home({ d: 'new', c: 'new', r: 'gone', p: 'new' }, 'loja · app') : home({}, 'loja · app');
        o.stats = waitStat(100, 1, back ? 'inteira' : '…'); o.bars = [['espera pelo recomendacoes', 1, 'acc', '100 ms'], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['if err != nil { // timeout, erro ou serviço fora', '  return []Produto{} // fallback: tela sem a seção', '}'];
        o.resT = 'RESPOSTA COM FALLBACK'; o.res = [['"destaque": { "id": 42, … "preco": 79.90 },', 'acc'], ['"carrinho": { "itens": 1 },', 'acc'], ['"recomendado": [],', 'acc'], ['"pedido": { "id": 1048, "status": "a caminho" }', 'acc']];
        if (back && t > 2.4) T(o, 'A', 'a Lena nem percebe:\na tela chegou'); } },
    { id: 'pedidos', dur: 5.5, title: 'O pedidos cai: "status indisponível agora"',
      story: 'Agora quem cai é o pedidos. A regra é a mesma: 100 ms de prazo e um plano B para aquela seção. O status do pedido é informação, não enfeite, então a seção não some: mostra "status indisponível agora". O resto da tela continua inteiro.',
      look: 'O pedidos fica vermelho. No celular, o cartão do pedido aparece em vermelho com "status indisponível agora"; as outras seções chegam normais.',
      key: 'Cada seção tem o seu plano B: some, avisa ou bloqueia.',
      f(o, t) { falBase(o); down(o, 's3'); o.on.bA = 1; send(o, t, 0.1, 0.6, R.c2b(0), 'GET /app/home', 'hi', 5); fanOut(o, t, [3], 0.6); o.beams.push({ pts: R.b2s(0, 3), tone: 'bad', on: true, cut: clamp((t - 0.6) / 0.6) * 0.6 });
        const w = ramp(t, 0.9, 2.2, 0, 100), back = send(o, t, 2.5, 3.5, rev(R.c2b(0)), '200 OK · pedido indisponível', 'acc', 0.6);
        o.rows.bA = bffRows([`pedidos: ${Math.round(w)} ms`, 8.6, 'bad'], [w >= 100 ? 'fallback: avisa' : 'timeout: 100 ms', 8.6, w >= 100 ? 'acc' : 'dim']);
        o.ph.A = back ? home({ d: 'new', c: 'new', r: 'new', p: ['bad', 'status\nindisponível agora'] }, 'loja · app') : home({}, 'loja · app');
        o.stats = waitStat(w, 1, back ? 'inteira' : '…'); o.bars = [['espera pelo pedidos', w / 100, '', fmtMs(w)], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['"pedido": { "id": 1048, "status": "indisponível agora" }']; o.resT = 'SEÇÃO DO PEDIDO';
        o.res = [['enfeite (recomendações): some a seção', 'dim'], ['informação (pedido): "indisponível agora"', 'acc'], ['indispensável (preço no checkout): avisa e não deixa pagar', 'dim']];
        if (back && t > 3.8) T(o, 'A', 'só a seção do pedido\navisa; o resto chegou'); } },
    { id: 'semtimeout', dur: 7.5, title: 'E se der errado: sem timeout, o BFF trava',
      story: 'Agora sem timeout. O bff-app espera o recomendacoes por 30 s. Enquanto isso chegam mais telas, cada uma presa na mesma espera. Com 100 telas por segundo, são 100 × 30 = 3.000 conexões abertas. Elas se acumulam até o BFF cair, e a tela inicial inteira some. Um serviço que só enfeita a tela derrubou o app.',
      look: 'A espera no mostrador corre até 30 s e as conexões abertas sobem até 3.000. O bff-app fica vermelho e o celular perde a tela.',
      key: 'Sem timeout, um serviço lento prende o BFF inteiro.',
      f(o, t) { falBase(o); down(o, 's2'); const w = ramp(t, 0.6, 5.0, 0, 30000), conns = Math.round(w / 1000 * 100), dead = t > 5.0;
        o.beams.push({ pts: R.b2s(0, 2), tone: 'bad', on: true, cut: 0.6 }); [0, 1, 3].forEach(s => quiet(o, R.b2s(0, s)));
        if (!dead) o.beams.push({ pts: R.c2b(0), on: true, dot: (t * 1.6) % 1 }); else o.beams.push({ pts: R.c2b(0), on: true, tone: 'bad' });
        o.on.bA = dead ? 'bad' : 1; o.rows.bA = dead ? [['FORA DO AR', 12, 'bad'], ['3.000 conexões presas', 8.6, 'bad']] : bffRows(['sem timeout', 9, 'bad'], [`esperando: ${br((w / 1000).toFixed(1))} s`, 8.6, 'bad'], [`conexões: ${conns.toLocaleString('pt-BR')}`, 8.6, 'bad']);
        o.ph.A = dead ? { head: 'loja · app', cards: [], err: ['✕', 'a tela inicial', 'some'] } : home({}, 'loja · app');
        o.stats = waitStat(w, conns, dead ? 'some' : '…'); o.bars = [['espera pelo recomendacoes', w / 30000, 'bad', br((w / 1000).toFixed(0)) + ' s'], ['conexões abertas', conns / 3000, 'bad', conns.toLocaleString('pt-BR')]];
        o.cmd = ['r, err := recomendacoes.Para(r.Context(), 42)', '// sem prazo: espera o quanto for', '100 telas/s × 30 s = 3.000 conexões abertas'];
        o.resT = 'SEM TIMEOUT'; o.res = [['100 telas por segundo × 30 s', 'hi'], ['= 3.000 conexões abertas', 'bad'], ['com timeout de 100 ms: umas 10', 'acc']];
        if (dead) T(o, 'bA', 'o BFF caiu:\na tela inteira some', 'bad'); } },
    { id: 'catalogo', dur: 7, title: 'E se der errado: o catalogo cai e os dois canais sentem',
      story: 'O bff-app e o bff-web dependem do mesmo catalogo. Se ele cai, os dois canais sentem: o destaque some do app e a página do produto falha no site. Separar BFF por canal limita o raio de explosão de um BFF que cai, mas não separa as dependências compartilhadas. Isolar essas chamadas (bulkhead) é assunto de resiliência, para outro módulo.',
      look: 'O catalogo fica vermelho e duas linhas vermelhas saem dele: uma para o bff-app, outra para o bff-web. O celular e o monitor mostram o erro.',
      key: 'Raio de explosão: o alcance de uma falha. Um serviço compartilhado atinge todos os canais.',
      f(o, t) { falBase(o); down(o, 's0'); o.on.bA = 1; o.on.bB = 1;
        [1, 2, 3].forEach(s => quiet(o, R.b2s(0, s), R.b2s(1, s)));
        const hit = t > 1.4; o.beams.push({ pts: rev(R.b2s(0, 0)), on: t > 0.4, tone: 'bad', cut: clamp((t - 0.4) / 1.0) }); o.beams.push({ pts: rev(R.b2s(1, 0)), on: t > 0.4, tone: 'bad', cut: clamp((t - 0.4) / 1.0) });
        if (hit) { o.on.bA = 'bad'; o.on.bB = 'bad'; }
        const reach = t > 2.4; if (t > 1.6) { o.beams.push({ pts: rev(R.c2b(0)), on: true, tone: 'bad', cut: clamp((t - 1.6) / 0.8) }); o.beams.push({ pts: rev(R.c2b(1)), on: true, tone: 'bad', cut: clamp((t - 1.6) / 0.8) }); }
        o.rows.bA = bffRows(['catalogo fora', 9, 'bad'], ['destaque indisponível', 8.2, 'bad']); o.rows.bB = [['/web/', 8.6, 'dim'], ['catalogo fora', 9, 'bad'], ['produto não carrega', 8.2, 'bad']];
        o.ph.A = reach ? home({ d: ['bad', 'indisponível'], c: 'ok', r: 'ok', p: 'ok' }, 'loja · app') : home(ALL('ok'), 'loja · app');
        if (reach) o.mon = { head: 'loja.com.br/produto/42', lines: [['erro ao carregar', 'bad'], ['o produto 42', 'bad'], ['tente de novo', 'dim']] };
        o.stats = [['CANAIS ATINGIDOS', reach ? '2 de 2' : '…', 'bad'], ['SERVIÇO', 'catalogo', 'bad'], ['BFFs', '2', 'hi']]; o.bars = null;
        o.cmd = ['bff-app → catalogo', 'bff-web → catalogo', '(a mesma dependência nos dois canais)']; o.resT = 'RAIO DE EXPLOSÃO';
        o.res = [['catalogo fora → bff-app e bff-web', 'bad'], ['um BFF que cai: só o seu canal', 'acc'], ['um serviço compartilhado: todos', 'bad'], ['isolar chamadas (bulkhead): outro módulo', 'dim']];
        if (reach) T(o, 's0', 'catalogo fora:\nos 2 canais sentem', 'bad'); } },
  ];

  // métricas: cada BFF mede o seu; os 2% do app vêm do v3 em Android antigo; juntos, viram 0,6%
  const dash = (p95, err, tone) => [['p95', 7.4, 'dim'], [p95, 11, 'acc'], [`erros ${err}`, 9.5, tone]];
  const metBase = o => { o.lab.bB = ['BFF-WEB', 'site']; o.mon = { head: 'loja.com.br', photo: 1, lines: [['gato de pelúcia', 'hi'], ['R$ 79,90', 'acc']] };
    o.ph.A = home(ALL('ok'), 'loja · app'); for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s), R.b2s(1, s)); };
  const traffic = (o, t, ...rows) => rows.forEach(r => o.beams.push({ pts: R.c2b(r), on: true, dot: ((t * 0.9) + r * 0.37) % 1 }));
  STEPS.metricas = [
    { id: 'mede', dur: 5, title: 'Cada BFF mede os próprios pedidos',
      story: 'Com um BFF por canal, cada um mede o seu: quantos pedidos chegam, quantos dão erro e quanto tempo levam. O bff-app mede só o app; o bff-web, só o site.',
      look: 'Pedidos correm do celular ao bff-app e do monitor ao bff-web; os números de cada balcão vão se formando.',
      key: 'Um BFF por canal dá, de graça, uma métrica por canal.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; const f = clamp(t / 3.5);
        o.rows.bA = dash(fmtMs(150 * f), br((2 * f).toFixed(1)) + '%', 'hi'); o.rows.bB = dash(fmtMs(300 * f), br((0.1 * f).toFixed(2)) + '%', 'hi');
        o.stats = [['BFF-APP p95', fmtMs(150 * f), 'acc'], ['BFF-WEB p95', fmtMs(300 * f), 'acc'], ['MEDIDO EM', '2 BFFs', 'hi']];
        o.cmd = ['histogram_quantile(0.95,', '  sum by (le, canal, versao)', '    (rate(http_request_duration_seconds_bucket[5m])))'];
        o.resT = 'O MÍNIMO DE CADA PAINEL'; o.res = [['volume: pedidos por segundo', 'hi'], ['erros: 5xx e fallbacks acionados', 'hi'], ['tempo: p50, p95, p99', 'hi'], ['corte: versão do app e sistema', 'hi']]; } },
    { id: 'numeros', dur: 5.5, title: 'bff-app: p95 150 ms e 2% de erros',
      story: 'O bff-app mostra p95 de 150 ms (o tempo da aula 2) e 2% de erros. O bff-web, p95 de 300 ms, que inclui renderizar a página no servidor, e 0,1% de erros. Comparar os dois pelo número solto engana: cada canal tem o seu objetivo. Mas os 2% do app chamam atenção.',
      look: 'Os dois balcões mostram os números finais; os 2% do bff-app estão em vermelho.',
      key: 'p95: 95 de cada 100 pedidos foram mais rápidos que aquele tempo.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; o.rows.bA = dash('150 ms', '2%', 'bad'); o.rows.bB = dash('300 ms', '0,1%', 'acc');
        o.stats = [['ERROS APP', '2%', 'bad'], ['ERROS WEB', '0,1%', 'acc'], ['p95 APP · WEB', '150 · 300', 'hi']];
        o.bars = [['bff-app · erros', 0.02 / 0.025, 'bad', '2%'], ['bff-web · erros', 0.001 / 0.025, '', '0,1%'], ['bff-app · p95', 150 / 400, '', '150 ms'], ['bff-web · p95', 300 / 400, '', '300 ms']];
        o.cmd = ['sum by (canal, versao) (rate(http_requests_total{status=~"5.."}[5m]))', '  / sum by (canal, versao) (rate(http_requests_total[5m]))'];
        o.resT = 'POR CANAL'; o.res = [['bff-app: p95 150 ms · erros 2%', 'bad'], ['bff-web: p95 300 ms · erros 0,1%', 'acc'], ['cada canal contra o seu objetivo', 'dim']];
        if (t > 2.2) T(o, 'bA', '2% de erros: de onde?', 'bad'); } },
    { id: 'corte', dur: 5.5, title: 'Os 2% vêm só do v3 em Android antigo',
      story: 'Cortando os pedidos do bff-app por versão e sistema, os erros aparecem num lugar só: o app v3 em Android antigo. O v4 e o v3 no iOS estão bem. Com o problema isolado, o time do app corrige o v3, ou decide a hora de aposentá-lo (aula 5), sem mexer no site.',
      look: 'O painel do bff-app se abre por versão e sistema; só a linha "v3 · Android antigo" fica vermelha.',
      key: 'O corte por versão e sistema leva o erro até quem pode corrigir.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; o.rows.bB = dash('300 ms', '0,1%', 'acc');
        o.rows.bA = [['erros por versão', 8.2, 'dim'], ['v4 · iOS e Android: ok', 8.2, 'acc'], ['v3 · iOS: ok', 8.2, 'acc'], ['v3 · Android antigo ✕', 8.6, 'bad']];
        o.stats = [['ERROS APP', '2%', 'bad'], ['ONDE', 'v3 · Android', 'bad'], ['ERROS WEB', '0,1%', 'acc']];
        o.bars = [['v4 · iOS e Android', 0, '', 'ok'], ['v3 · iOS', 0, '', 'ok'], ['v3 · Android antigo', 1, 'bad', 'todos os erros']];
        o.cmd = ['sum by (canal, versao, sistema)', '  (rate(http_requests_total{canal="app", status=~"5.."}[5m]))'];
        o.resT = 'ERROS DO BFF-APP, POR CORTE'; o.res = [['v4 · iOS e Android: sem erros', 'acc'], ['v3 · iOS: sem erros', 'acc'], ['v3 · Android antigo: os 2%', 'bad']];
        if (t > 2.4) T(o, 'A', 'v3 · Android antigo', 'bad'); } },
    { id: 'erro', dur: 7, title: 'E se der errado: medidos juntos, 0,6%',
      story: 'Num backend único, os dois canais cairiam na mesma conta. Num exemplo em que 26 de cada 100 pedidos são do app, a média seria 0,26 × 2% + 0,74 × 0,1% ≈ 0,6%. É um número que ninguém investiga, e os erros do v3 em Android antigo passariam despercebidos.',
      look: 'Os dois balcões se juntam num backend único. O painel dele mostra 0,6% de erros, sem vermelho: parece tudo bem.',
      key: 'O total esconde o canal pequeno.',
      f(o, t) { metBase(o); const merged = t > 1.0; if (!merged) { o.pos.bA = [BX0, 233]; o.pos.bB = [BX0, 233]; } else { delete o.pos.bA; delete o.pos.bB; o.pos.one = [BX0, 140]; o.on.one = 1; }
        o.beams.push({ pts: R.c2one(0), on: true, dot: (t * 0.9) % 1 }, { pts: R.c2one(1), on: true, dot: (t * 0.9 + 0.4) % 1 }); quiet(o, R.one2s(0), R.one2s(1), R.one2s(2), R.one2s(3));
        o.lab.one = ['BACKEND ÚNICO', 'app + site'];
        const f = clamp((t - 1.2) / 2); o.rows.one = [['app + site juntos', 8.6, 'dim'], ['erros', 7.4, 'dim'], [br((0.6 * f).toFixed(1)) + '%', 14, 'hi'], ['parece tudo bem', 8.6, 'dim'], ['', 6.8], ['v3 · Android antigo:', 8.2, 'dim'], ['diluído na média', 8.2, 'dim']];
        o.stats = [['ERROS (TUDO JUNTO)', br((0.6 * f).toFixed(1)) + '%', 'hi'], ['ERROS DO APP', 'escondidos', 'bad'], ['BACKENDS', merged ? '1' : '2', 'hi']];
        o.bars = [['app sozinho', 0.02 / 0.025, 'bad', '2%'], ['site sozinho', 0.001 / 0.025, '', '0,1%'], ['tudo junto (26% app)', 0.006 / 0.025 * f, '', br((0.6 * f).toFixed(1)) + '%']];
        o.cmd = ['0,26 × 2% + 0,74 × 0,1%', '= 0,52% + 0,074%', '≈ 0,6%']; o.resT = 'A CONTA DA MÉDIA';
        o.res = [['0,26 × 2% + 0,74 × 0,1% ≈ 0,6%', 'hi'], ['26 de cada 100 pedidos são do app (exemplo)', 'dim'], ['2% no app é visível; 0,6% no total, não', 'bad']];
        if (t > 4.4) T(o, 'one', '0,6%: ninguém investiga', 'bad'); } },
  ];

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
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(Bk, rows, on, lab, sub) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
      if (on === 'off') { x.fillStyle = theme === 'light' ? '#e2e3e3' : '#0b0c0d'; x.fillRect(0, 0, cv.c.width, cv.c.height); }
      let y = 5; x.textAlign = 'left';   // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro
      for (const r of rows) {
        if (r.grid) { y += 3; for (let i = 0; i < r.grid; i++) { const X = 6 + i * 15.4; x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(X), u(y), u(12.4), u(11));
            if (i < r.on) { x.fillStyle = accC(); x.fillRect(u(X + 1), u(y + 1), u(10.4), u(9)); } } y += 15; continue; }
        const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.4; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (on === 'bad' && rows === DOWN) { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 34), u(8)); x.lineTo(u(W_ - 10), u(32)); x.moveTo(u(W_ - 10), u(8)); x.lineTo(u(W_ - 34), u(32)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    const fk = lab + sub + on + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(), FW = Bk.w - 6; x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(6.6, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; fitFont(x, u, lab, big, FW - 6); x.fillText(lab, u(3), u(mid));
      const lw = x.measureText(lab).width / P; if (sub) { x.fillStyle = INK(); x.font = `700 ${u(small)}px ${MONO3}`; if (x.measureText(sub).width / P < FW - lw - 10) x.fillText(sub, u(8 + lw), u(mid)); }
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  // tela do celular: cabeçalho, cartões das seções ou um erro de tela inteira
  function drawPhone(Ph, d) {
    const key = JSON.stringify(d) + theme + accent.getHex(); if (Ph.key === key) return; Ph.key = key;
    const cv = Ph.scr, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', WW = cv.c.width / P, HH = cv.c.height / P;
    x.fillStyle = light ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(0.5), u(0.5), u(WW - 1), u(HH - 1));
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, d.head, 8.2, WW - 8); x.fillText(d.head, u(4), u(7.5));
    x.fillStyle = C.line; x.fillRect(u(4), u(14), u(WW - 8), u(0.6));
    if (d.err) { const bad = d.tone !== 'dim'; x.textAlign = 'center'; x.fillStyle = bad ? BAD() : C.inkHi; x.font = `700 ${u(22)}px ${MONO3}`; x.fillText(d.err[0], u(WW / 2), u(58));
      x.fillStyle = bad ? BAD() : INK(); d.err.slice(1).forEach((l, i) => { fitFont(x, u, l, 9, WW - 8); x.fillText(l, u(WW / 2), u(82 + i * 13)); });
      Ph.mat.emissiveIntensity = 0; cv.tex.needsUpdate = true; return; }
    let y = 18; const cards = d.cards.filter(c => c[2] !== 'gone'), ch = 32;
    cards.forEach(([t1, t2, st]) => {
      const lines = String(t2).split('\n'), h = ch + (lines.length - 1) * 10.5;
      const on = st === 'new' || st === 'ok', bad = st === 'bad', skel = st === 'skel';
      x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : st === 'new' ? (light ? '#f6ece2' : '#2a1d12') : light ? '#eeeeed' : '#1a1b1d'; x.fillRect(u(4), u(y), u(WW - 8), u(h - 3));
      x.strokeStyle = bad ? BAD() : st === 'new' ? accC() : C.line; x.lineWidth = u(st === 'new' || bad ? 1.1 : 0.5); if (skel) x.setLineDash([u(1.6), u(1.2)]);
      x.strokeRect(u(4), u(y), u(WW - 8), u(h - 3)); x.setLineDash([]);
      x.textAlign = 'left'; x.fillStyle = skel ? INK() : C.inkHi; fitFont(x, u, t1, 9, WW - 14); x.fillText(t1, u(7), u(y + 8));
      if (skel) { x.fillStyle = C.line; x.fillRect(u(7), u(y + 17), u(34), u(6)); }
      else { x.fillStyle = bad ? BAD() : on ? accC() : INK(); lines.forEach((l, i) => { fitFont(x, u, l, 9, WW - 14); x.fillText(l, u(7), u(y + 20 + i * 10.5)); }); }
      y += h; });
    Ph.mat.emissiveIntensity = d.cards.some(c => c[2] === 'new') ? 0.35 : 0;
    cv.tex.needsUpdate = true;
  }
  function drawMon(d) {
    const key = JSON.stringify(d) + theme + accent.getHex(); if (MON.key === key) return; MON.key = key;
    const cv = MON.scr, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', WW = cv.c.width / P, HH = cv.c.height / P;
    x.fillStyle = light ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(0.5), u(0.5), u(WW - 1), u(HH - 1));
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, d.head, 7.4, WW - 8); x.fillText(d.head, u(4), u(7));
    x.fillStyle = C.line; x.fillRect(u(4), u(13), u(WW - 8), u(0.6));
    let tx = 4; if (d.photo) { x.fillStyle = light ? '#e6dccf' : '#2a2018'; x.fillRect(u(4), u(18), u(40), u(50)); x.strokeStyle = accC(); x.lineWidth = u(0.8); x.strokeRect(u(4), u(18), u(40), u(50));
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'foto', 7.4, 36); x.fillText('foto', u(24), u(36)); fitFont(x, u, 'grande', 7.4, 36); x.fillText('grande', u(24), u(48)); x.textAlign = 'left'; tx = 48; }
    d.lines.forEach(([l, tn], i) => { x.fillStyle = toneC(tn); fitFont(x, u, l, i ? 7.8 : 9.5, WW - tx - 4); x.fillText(l, u(tx), u(24 + i * 14)); });
    MON.mat.emissiveIntensity = 0; cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.stats, o.tl, o.bars, o.resT, o.res, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 120) => { x.fillStyle = INK(); fitFont(x, u, t, 8.2, mw); x.fillText(t, u(X), u(Y)); };
    const LW = 272;
    o.stats.slice(0, 3).forEach(([l, v, tn], i) => { const X = 8 + i * 88; lbl(l, X, 11, 84); x.fillStyle = toneC(tn); fitFont(x, u, v, 21, 84); x.fillText(v, u(X), u(32)); });
    if (o.tl) { const { max, now, segs } = o.tl, X0 = 8, X1 = LW - 14, sx = v => X0 + (X1 - X0) * clamp(v / max);
      lbl(`LINHA DO TEMPO · 0 a ${max} ms`, X0, 56, 250);
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(X0), u(64), u(X1 - X0), u(22));
      segs.forEach(([a, b, lab, tn]) => { if (b <= a) return; x.fillStyle = tn === 'bad' ? BAD() : acc; x.fillRect(u(sx(a) + 0.4), u(64.6), u(Math.max(0.5, sx(b) - sx(a) - 0.8)), u(20.8));
        if (lab && sx(b) - sx(a) > 26) { x.fillStyle = theme === 'light' ? '#ffffff' : '#141516'; x.textAlign = 'center'; fitFont(x, u, lab, 8.2, sx(b) - sx(a) - 4); x.fillText(lab, u((sx(a) + sx(b)) / 2), u(75.5)); x.textAlign = 'left'; } });
      for (let v = 0; v <= max; v += max / 4) { const X = sx(v); x.fillStyle = INK(); x.fillRect(u(X - 0.3), u(86), u(0.6), u(4)); x.textAlign = v === 0 ? 'left' : v === max ? 'right' : 'center'; fitFont(x, u, String(v), 7.6, 30); x.fillText(String(v), u(X), u(96)); }
      x.textAlign = 'left'; x.fillStyle = acc; x.fillRect(u(sx(now) - 0.7), u(60), u(1.4), u(30));
      if (o.ms != null) { x.fillStyle = C.inkHi; fitFont(x, u, `agora: ${fmtMs(now)} · ${o.kb} KB no celular`, 8.6, 250); x.fillText(`agora: ${fmtMs(now)} · ${o.kb} KB no celular`, u(X0), u(116)); } }
    else if (o.bars) { const n = o.bars.length, top = 52, rh = Math.min(22, (132 - top) / n);
      o.bars.forEach(([l, f, tn, v], i) => { const Y = top + i * rh; lbl(l, 8, Y + 4, 180); x.textAlign = 'right'; x.fillStyle = toneC(tn || 'acc'); fitFont(x, u, v, 8.6, 70); x.fillText(v, u(LW - 14), u(Y + 4)); x.textAlign = 'left';
        x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(8), u(Y + 10), u(LW - 22), u(6)); x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc; x.fillRect(u(8.5), u(Y + 10.5), u(Math.max(0, (LW - 23) * clamp(f))), u(5)); }); }
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(LW - 4), u(6)); x.lineTo(u(LW - 4), u(134)); x.stroke();
    lbl(o.resT, LW + 6, 11, 268);
    const rl = o.res.slice(0, 8); rl.forEach(([l, tn], i) => { x.fillStyle = toneC(tn); fitFont(x, u, l, 8.8, 270); x.fillText(l, u(LW + 6), u(28 + i * 13.5)); });
    if (!rl.length) { x.fillStyle = INK(); x.font = `700 ${u(8.8)}px ${MONO3}`; x.fillText('…', u(LW + 6), u(28)); }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">Os caminhos dos pedidos aos serviços e a divisão dos 180 KB em 4 × 45 KB são de exemplo; o texto da aula dá só o total.</li>';
  const DATA = {
    sem: () => `<table class="h3-sum"><tr><th>chamada</th><th>serviço</th><th>relógio</th><th>KB</th></tr>${SVC.map((s, i) => `<tr><td>${i + 1}ª</td><td>${s}</td><td>${(i + 1) * RTT} ms</td><td>${(i + 1) * 45}</td></tr>`).join('')}</table>
      <li>Ida e volta no 4G: <b>120 ms</b> · 4 em fila: 4 × 120 = <b>480 ms</b></li><li>JSON feito para o site: <b>180 KB</b> (descrição longa, 8 fotos em alta, <b>custo_fornecedor</b>)</li><li>A tela usa um nome, um preço, uma foto pequena, um número de itens e uma frase de status.</li>${EX}`,
    compor: () => `<table class="h3-sum"><tr><th>trecho</th><th>ms</th></tr><tr><td>4G (ida e volta)</td><td>120</td></tr><tr><td>4 serviços em paralelo (o mais lento)</td><td>25</td></tr><tr><td>montagem no BFF</td><td>~5</td></tr><tr class="on"><td>total</td><td>~150</td></tr></table>
      <li>Resposta: <b>12 KB</b> (antes: 180 KB) · 1 foto em miniatura · sem custo_fornecedor</li><li>Em fila, o BFF somaria os 4 tempos; em paralelo, espera só o mais lento.</li><li>Sem fallback: 0,999⁴ ≈ <b>99,6%</b> de tela boa, mesmo com cada serviço em 99,9%.</li>`,
    canais: () => `<table class="h3-sum"><tr><th>canal</th><th>BFF</th><th>o pedido 1048 vira</th></tr><tr><td>app</td><td>bff-app</td><td>JSON + miniatura</td></tr><tr><td>site</td><td>bff-web</td><td>página SSR + foto grande</td></tr><tr><td>voz</td><td>bff-voz</td><td>"Seu pedido 1048 está a caminho e chega quinta."</td></tr><tr><td>parceiro</td><td>nenhum</td><td>API pública no gateway</td></tr></table>
      <li>O gw-loja escolhe o BFF pelo prefixo: <b>/app/</b>, <b>/web/</b>, <b>/voz/</b></li><li>Sessão do site no Redis (módulo 5); o app usa só o JWT.</li>`,
    versao: () => `<li>App <b>v3</b> em <b>30%</b> dos celulares · app <b>v4</b> com a nova home</li><li>Rota por cabeçalho: <b>X-App-Version: 4.x</b> → bff-app-v4; o resto → bff-app-v3</li><li>Toggle <b>nova_home</b>: 10% → 50% → 100% dos usuários do v4 (hash do userId)</li><li>Desligar o bff-app-v3 só com uso do v3 <b>abaixo de 1%</b>, medido no BFF</li><li class="h3-dim">Os passos 30% → 12% → 4% → 0,8% da queda do v3 são de exemplo.</li>`,
    falha: () => `<li>Timeout do bff-app: <b>100 ms</b> por serviço · fallback do recomendacoes: <b>"recomendado": []</b></li><li>pedidos fora: <b>"status indisponível agora"</b></li><li>Sem timeout: 30 s de espera · 100 telas/s × 30 s = <b>3.000</b> conexões (com 100 ms, umas 10)</li><li>catalogo fora: <b>bff-app e bff-web</b> sentem (raio de explosão)</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>BFF</th><th>p95</th><th>erros</th></tr><tr class="on"><td>bff-app</td><td>150 ms</td><td>2%</td></tr><tr><td>bff-web</td><td>300 ms</td><td>0,1%</td></tr></table>
      <li>Os 2% vêm do <b>v3 em Android antigo</b></li><li>Juntos (exemplo: 26 de cada 100 pedidos do app): 0,26 × 2% + 0,74 × 0,1% ≈ <b>0,6%</b></li>`,
  };
  function countHtml() { const o = SP || spec(), [m, ...r] = o.stats; if (!m) return '';
    return `<b${m[2] === 'bad' ? ' class="bad"' : ''}>${m[1]}</b><span>${m[0].toLowerCase()}</span><i>${r.map(s => `· ${s[0].toLowerCase()}: ${s[1]}`).join(' ')}</i>`; }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${sc === 'versao' ? `<div class="o3-mode b3-tog" role="group" aria-label="Toggle nova_home">${PCT.map((p, i) => `<button data-pct="${i + 1}" aria-pressed="${s.pct === p}">nova_home ${p}%</button>`).join('')}</div>` : ''}
      <h2>${s.title}</h2>
      <div class="i3-count" id="b3count">${countHtml()}</div>
      <div class="i3-sql"><b>Pedido e resposta reais</b>${esc(o.cmd.join('\n'))}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'bff') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.stats.map(s => s[1]).join(' · ')}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'bff' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-bff3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'bff') return; const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const p = e.target.closest('[data-pct]'); if (p) go(+p.dataset.pct); });
  backLink();

  // ── um quadro da cena ──
  const NAMES = ['gw', 'bA', 'bB', 'bC', 'one', 's0', 's1', 's2', 's3'];
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm];
      Bk.g.visible = !!p; if (!p) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      const lb = o.lab[nm] || [Bk.lab, Bk.sub]; drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, lb[0], lb[1]); });
    PH.A.g.visible = !!o.cli.A; PH.B.g.visible = !!o.cli.B; MON.g.visible = !!o.cli.mon; SPK.g.visible = !!o.cli.spk;
    if (o.cli.A) drawPhone(PH.A, o.ph.A); if (o.cli.B) drawPhone(PH.B, o.ph.B || home()); if (o.cli.mon && o.mon) drawMon(o.mon);
    SPK.ring.emissiveIntensity = o.cli.spk && o.spk ? 0.9 : 0; SPK.glow.material.uniforms.intensity.value = o.cli.spk && o.spk ? 0.9 : 0;
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    const who = [o.cli.A && [sc === 'versao' ? 'app v3 · Lena' : 'app · Lena · 4G', 0], o.cli.B && ['app v4 · Lena', 1], o.cli.mon && ['site · Bia', 1], o.cli.spk && ['voz · Lena', 2]].filter(Boolean);
    WHO.forEach((t, i) => { const w = who[i]; if (!w) return t.hide(); t.set(w[0], 'dim').at(20, RY[w[1]] + 46, 6); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 36); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('b3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.querySelector('#info .i3-sql'), sh = '<b>Pedido e resposta reais</b>' + esc(SP.cmd.join('\n')); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-40, 740, 8, 452];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.92 : nar ? 0.98 : 0.97 - side - 120 / innerWidth, aH = POSTER ? 0.8 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = (POSTER ? 1.22 : nar ? 1.02 : 0.86) * Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.49 : side + aW / 2, fy = POSTER ? 0.46 : nar ? 0.07 + aH * 0.6 : 0.52;
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), PH.A.scr, PH.B.scr, MON.scr, scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; }); PH.A.key = PH.B.key = MON.key = '';
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 220, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 220, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
