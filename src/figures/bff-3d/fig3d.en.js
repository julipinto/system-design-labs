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
  const br = n => String(n);
  const fmtMs = v => Math.round(v) + ' ms';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const RTT = 120, SLOW = 25, MONTA = 5, KB_SITE = 180, KB_APP = 12;
  const JSON_APP = ['{', '  "destaque": { "id": 42, "nome": "gato de pelúcia",', '                "preco": 79.90, "foto": "gato-320.webp" },',
    '  "carrinho": { "itens": 1 },', '  "recomendado": [{ "id": 7, "nome": "caneca azul", "preco": 19.90 }],', '  "pedido": { "id": 1048, "status": "a caminho" }', '}'];
  // a mesma resposta em linhas curtas, para o mostrador
  const JSON_SCR = [['"destaque": { "id": 42, "nome": "gato de pelúcia",', 0], ['   "preco": 79.90, "foto": "gato-320.webp" },', 0],
    ['"carrinho": { "itens": 1 },', 1], ['"recomendado": [{ "id": 7, "nome": "caneca azul",', 2], ['   "preco": 19.90 }],', 2], ['"pedido": { "id": 1048, "status": "a caminho" }', 3]];
  const SITE_JSON = ['GET /produtos/42   (response made for the website)', '{ "id": 42, "nome": "gato de pelúcia", "preco": 79.90,', '  "descricao": "Gato de pelúcia macio, 30 cm ... (3 paragraphs)",',
    '  "fotos": ["gato-1.jpg", "gato-2.jpg", "... (8 high-res photos)"],', '  "custo_fornecedor": 31.20 }'];
  const SC = ['sem', 'compor', 'canais', 'versao', 'falha', 'metricas'];
  const SCNAME = { sem: 'No BFF', compor: 'Compose', canais: 'Channels', versao: 'Versions', falha: 'Failure', metricas: 'Metrics' };
  const SCFULL = { sem: 'No BFF: 4 calls over 4G', compor: 'API composition in bff-app', canais: 'One BFF per channel', versao: 'Versions and feature toggle', falha: 'Timeout, fallback and blast radius', metricas: 'Metrics per channel' };
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
    bA: block(BX1 - BX0, 84, 30, 'BFF-APP', 'iOS · Android'), bB: block(BX1 - BX0, 84, 30, 'BFF-WEB', 'website'), bC: block(BX1 - BX0, 84, 30, 'BFF-VOZ', 'assistant'),
    one: block(BX1 - BX0, 288, 30, 'SINGLE BACKEND', 'all channels'),
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
  const SVCROWS = [[['product 42', 11, 'acc'], ['plush cat · 79.90', 7.4]], [["Lena's cart", 9.5], ['1 item', 9, 'acc']],
    [['bought with 42', 9.5], ['blue mug · 19.90', 7.4, 'acc']], [['order 1048', 11, 'acc'], ['"a caminho"', 8.6]]];
  const DOWN = [['DOWN', 12, 'bad'], ['not responding', 8, 'dim']];
  const HOME = { d: ['plush cat', 'R$ 79.90'], c: ['cart', '1 item'], r: ['recommended', 'blue mug'], p: ['order 1048', 'on its way'] };
  // tela do celular: cartões com estado skel (ainda não chegou), ok, new (acabou de chegar), bad, dim (tela antiga), gone (a seção some)
  const home = (st = {}, head = 'store · app', extra) => ({ head, cards: ['d', 'c', 'r', 'p'].map(k => { const v = st[k] || 'skel', a = Array.isArray(v) ? v : [v];
    return [HOME[k][0], a[1] || HOME[k][1], a[0]]; }), ...extra });
  const ALL = s => ({ d: s, c: s, r: s, p: s });
  const gwRows = (...l) => [['api.loja.com.br', 6.8, 'dim'], ['checks the JWT', 8.2], ['limits the bot', 8.2], ...l];

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { pos: { ...LAY[sc] }, cli: { ...CLI[sc] }, on: {}, rows: {}, lab: {}, beams: [], tags: [], msgs: [], who: [],
      stats: [], tl: null, bars: null, resT: 'RESPONSE', res: [], cmd: [], ph: {}, mon: null, spk: 0 };
    o.rows.gw = gwRows(['forwards to service', 8.2, 'dim']);
    SVC.forEach((s, i) => o.rows['s' + i] = SVCROWS[i]);
    o.ph.A = home({}, 'store · app');
    if (o.cli.mon) o.mon = { head: 'loja.com.br', lines: [['store website', 'dim']] };
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
  const clock = (o, ms, kb, calls, segs, max = 480) => { o.stats = [['CLOCK (4G)', fmtMs(ms), ms > 150 ? 'bad' : 'acc'], ['ON THE PHONE', kb + ' KB', kb > KB_APP ? 'bad' : 'acc'], ['CALLS OVER 4G', String(calls)]];
    o.tl = { max, now: ms, segs }; o.ms = ms; o.kb = kb; };
  const SEGS4 = k => [0, 1, 2, 3].slice(0, k).map(i => [i * RTT, (i + 1) * RTT, SVC[i].slice(0, 4), 'bad']);
  const REQ = ['GET /produtos/42', 'GET /carrinho/resumo', 'GET /recomendacoes/42', 'GET /pedidos/ultimo'];
  const RESP = ['42 · 79.90 · 45 KB', '1 item · 45 KB', 'blue mug · 45 KB', '1048 · 45 KB'];
  const KEYS4 = ['d', 'c', 'r', 'p'];
  const JSONK = k => JSON_SCR.filter(l => l[1] < k).map(l => [l[0], 'acc']);

  // passo k da fila sem BFF: o celular pede, o gw repassa, o serviço responde com JSON do site
  function semCall(o, t, k) {
    const st = {}; for (let i = 0; i < k; i++) st[KEYS4[i]] = 'ok';
    o.ph.A = home(st, 'store · app · 4G'); o.on.gw = 1; o.rows.gw = gwRows([`call ${k + 1} of 4`, 8.2, 'acc'], ['forwards to service', 8.2, 'dim']);
    for (let i = 0; i < 4; i++) if (i !== k) quiet(o, R.c2s(i));
    const ms = ramp(t, 0.3, 3.1, k * RTT, (k + 1) * RTT);
    send(o, t, 0.3, 1.6, R.c2s(k), REQ[k], 'hi', 0.1); if (t > 1.4 && t < 2.2) o.on['s' + k] = 1;
    const back = send(o, t, 1.8, 3.1, rev(R.c2s(k)), RESP[k], 'bad', 0.6);
    if (back) { st[KEYS4[k]] = 'new'; o.ph.A = home(st, 'store · app · 4G'); }
    clock(o, ms, (k + (back ? 1 : 0)) * 45, k + 1, [...SEGS4(k), [k * RTT, ms, SVC[k].slice(0, 4), 'bad']]);
    o.cmd = [REQ[k], back ? `200 OK · 45 KB (JSON made for the website)` : '…'];
    o.resT = 'RESPONSE ' + (k + 1) + ' OF 4 (MADE FOR THE WEBSITE)';
    o.res = k === 0 ? SITE_JSON.slice(1).map((l, i) => [l, i === 3 ? 'bad' : 'hi']) : [[`${REQ[k]} → 200 OK`, 'hi'], ['45 KB: the full website format', 'dim'], [`so far: ${(k + (back ? 1 : 0)) * 45} KB`, 'bad']];
    return back;
  }
  // compor: a mesma home montada pelo bff-app
  const PAR = [{ s: 0, back: 2.6, txt: '42 · 79.90 · 25 ms' }, { s: 1, back: 1.5, txt: '1 item' }, { s: 2, back: 1.8, txt: 'blue mug' }, { s: 3, back: 2.1, txt: '1048 · on its way' }];
  const bffRows = (...l) => [['GET /app/home', 8.6, 'dim'], ...l];

  const STEPS = {
    sem: [
      { id: 'pede', dur: 5, title: 'The home screen asks 4 services for 4 things',
        story: 'Lena, in Recife, on 4G, opens the app. The home screen needs the plush cat (product 42, R$ 79.90) from the catalogo, the cart (1 item) from the carrinho, "customers who bought this also bought" (the blue mug) from the recomendacoes and the status of order 1048 ("a caminho") from the pedidos. There is no BFF yet: the phone fetches each one through the gw-loja.',
        look: 'On the phone, the 4 sections are empty. On the right, the 4 services light up one by one with what each one stores.',
        key: 'One screen, four services: someone has to make the four calls.',
        f(o, t) { clock(o, 0, 0, 0, []); o.ph.A = home({}, 'store · app · 4G'); for (let i = 0; i < 4; i++) { quiet(o, R.c2s(i)); if (t > 0.5 + i * 0.8) o.on['s' + i] = 1; }
          o.cmd = ['the screen needs:', 'catalogo → product 42', 'carrinho → 1 item', 'recomendacoes → blue mug', 'pedidos → order 1048'];
          o.resT = 'WHAT THE SCREEN NEEDS'; o.res = [['highlight: plush cat · R$ 79.90', 'hi'], ['cart: 1 item', 'hi'], ['recommended: blue mug', 'hi'], ['order 1048: on its way', 'hi']];
          if (t > 3.6) T(o, 'A', '4 empty sections\n4 services to call', 'hi'); } },
      { id: 'c1', dur: 5, title: 'Call 1: catalogo, 120 ms',
        story: 'The phone asks the gateway for product 42, which forwards it to the catalogo. The 4G round trip takes 120 ms. The response was made for the website: a long description, 8 high-res photos and an internal field, custo_fornecedor, that should never leave the store\'s network.',
        look: 'The light leaves the phone, crosses the gw-loja and reaches the catalogo. It comes back red with 45 KB, and the clock on the display goes to 120 ms.',
        key: 'Every call over 4G costs a whole round trip: 120 ms.',
        f(o, t) { if (semCall(o, t, 0) && t > 3.4) T(o, 's0', 'custo_fornecedor: 31.20\ncame along to the phone', 'bad'); } },
      { id: 'c2', dur: 5, title: 'Call 2: carrinho, 240 ms',
        story: 'Only now does the phone ask for the cart. Each call waits for the previous one to come back to know what to ask next, so they go in a queue. Another 120 ms of 4G: the clock already reads 240 ms and the screen still has two empty sections.',
        look: 'The second trip takes the same path, to the carrinho. On the display, the timeline gets its second 120 ms block.',
        key: 'In a queue, the times add up.',
        f(o, t) { semCall(o, t, 1); } },
      { id: 'c3', dur: 5, title: 'Call 3: recomendacoes, 360 ms',
        story: 'The recomendacoes needs the product id that came in the first response (42) to say who bought it too: the blue mug. Third trip over 4G, another 120 ms. That is already 360 ms and 135 KB.',
        look: 'The light goes to the recomendacoes and comes back. The "recommended" section appears on the phone.',
        key: 'A call that depends on another one cannot leave before it.',
        f(o, t) { semCall(o, t, 2); } },
      { id: 'c4', dur: 5.5, title: 'Call 4: pedidos, 480 ms',
        story: 'Last, the status of order 1048: "a caminho". Four trips in a queue add up to 4 × 120 = 480 ms of network alone before the screen is complete, and 180 KB of JSON reached Lena\'s phone.',
        look: 'The fourth light comes back and the clock stops at 480 ms; the KB counter, at 180.',
        key: 'No BFF: 4 calls over 4G, 480 ms, 180 KB.',
        f(o, t) { if (semCall(o, t, 3) && t > 3.6) T(o, 'A', '480 ms · 180 KB\nfull screen, at last', 'bad'); } },
      { id: 'erro', dur: 6, title: 'What if it goes wrong: 180 KB the screen throws away',
        story: 'The screen uses a name, a price, a small photo, an item count and a status phrase. The rest of the 180 KB (long description, 8 high-res photos) is thrown away, and Lena\'s data plan paid for it. Worse: custo_fornecedor, 31.20, reached the phone of whoever opened the app. Nobody stood between the screen and the services to decide what gets through.',
        look: 'The phone is complete, but the red bubble shows the internal field that reached it. On the display, 480 ms and 180 KB in red.',
        key: 'With nobody in the middle, the phone pays for the trips, pays for the bytes and still sees what it shouldn\'t.',
        f(o, t) { clock(o, 480, 180, 4, SEGS4(4)); o.ph.A = home(ALL('ok'), 'store · app · 4G'); for (let i = 0; i < 4; i++) quiet(o, R.c2s(i));
          o.cmd = SITE_JSON; o.resT = 'WHAT REACHED THE PHONE'; o.res = SITE_JSON.slice(1).map((l, i) => [l, i === 3 ? 'bad' : i ? 'dim' : 'hi']);
          if (t > 0.6) T(o, 'A', 'custo_fornecedor: 31.20\non Lena\'s phone', 'bad');
          if (t > 2.0) T(o, 's0', '8 high-res photos\n3-paragraph description', 'bad'); } },
    ],
    compor: [
      { id: 'uma', dur: 5, title: 'One call: GET /app/home',
        story: 'Now the bff-app exists. The app makes a single call, GET /app/home, with the token. The gw-loja checks the JWT, as in module 8, and hands the request to the bff-app, which is already inside the store\'s network, next to the services.',
        look: 'The light leaves the phone, passes through the gw-loja and stops at the bff-app counter. The clock moves half of the 4G round trip: 60 ms.',
        key: 'Over 4G, just one trip.',
        f(o, t) { o.ph.A = home({}, 'store · app · 4G'); const ms = ramp(t, 0.3, 1.8, 0, RTT / 2); clock(o, ms, 0, 1, [[0, ms, '4G out', 'acc']]);
          for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          if (send(o, t, 0.3, 1.8, R.c2b(0), 'GET /app/home · JWT', 'hi', 0.6)) { o.on.bA = 1; o.rows.bA = bffRows(['request arrived', 9, 'acc'], ['will call 4 services', 8]); }
          if (t > 0.8 && t < 1.6) { o.on.gw = 1; o.rows.gw = gwRows(['JWT ok', 9, 'acc'], ['/app/ → bff-app', 8.2]); }
          o.rows.bA = o.rows.bA || bffRows(['waiting', 9, 'dim']);
          o.cmd = ['GET /app/home', 'Authorization: Bearer <JWT>']; o.resT = 'REQUEST'; o.res = [['GET /app/home', 'hi'], ['Authorization: Bearer <JWT>', 'dim'], ['1 call over 4G (before: 4)', 'acc']];
          if (t > 2.6) T(o, 'gw', 'JWT checked\n→ bff-app'); } },
      { id: 'par', dur: 5.5, title: 'The bff-app calls all 4 at the same time',
        story: 'The bff-app fires the four calls together: catalogo, carrinho, recomendacoes and pedidos. They don\'t go over 4G, they stay inside the store\'s network. Since they left at the same time, the BFF waits only for the slowest, the catalogo: 25 ms. In a queue, it would be the sum of the four times.',
        look: 'Four lights leave the bff-app at the same time and come back at different moments; the last one is the catalogo\'s, at 25 ms.',
        key: 'In parallel, the time is the slowest service\'s.',
        f(o, t) { o.ph.A = home({}, 'store · app · 4G'); o.on.bA = 1; let got = 0;
          PAR.forEach(p => { send(o, t, 0.3, 1.0, R.b2s(0, p.s), null, 'hi', 0.05); if (t > 0.9 && t < p.back + 0.2) o.on['s' + p.s] = 1;
            if (send(o, t, p.back - 0.4 + 0.2, p.back + 0.2, rev(R.b2s(0, p.s)), p.txt, 'acc', 0.5)) got++; });
          const ms = 60 + ramp(t, 0.3, 2.6, 0, SLOW); clock(o, ms, 0, 1, [[0, 60, '4G out', 'acc'], [60, ms, 'store network', 'acc']]);
          o.rows.bA = bffRows([`responses: ${got} of 4`, 9.5, 'acc'], ['in parallel', 8], [got === 4 ? 'slowest: 25 ms' : 'waiting for the slowest', 8, got === 4 ? 'acc' : 'dim']);
          o.cmd = ['g.Go(catalogo.Produto(ctx, 42))', 'g.Go(carrinho.Resumo(ctx, lena))', 'g.Go(recomendacoes.Para(ctx, 42))', 'g.Go(pedidos.Ultimo(ctx, lena))', 'g.Wait()  // waits for the slowest'];
          o.resT = 'BFF CALLS (IN PARALLEL)'; o.res = PAR.map(p => [`${SVC[p.s]}: ${t > p.back + 0.2 ? p.txt : '…'}`, t > p.back + 0.2 ? 'acc' : 'dim']);
          if (t > 3.0) T(o, 's0', 'slowest: 25 ms\n(4G: 120 ms)'); } },
      { id: 'monta', dur: 5.5, title: 'Builds the response, piece by piece',
        story: 'With the four responses in hand, the bff-app builds the screen\'s JSON: only the fields it draws, a thumbnail photo (gato-320.webp) and no custo_fornecedor. Highlight, cart, recommended and order go in one at a time. That leaves 12 KB, and building it takes about 5 ms.',
        look: 'On the bff-app counter and on the display, the response grows one piece at a time; the KB counter climbs to 12.',
        key: 'The BFF cuts and adapts: the response has the screen\'s format, not the service\'s.',
        f(o, t) { o.ph.A = home({}, 'store · app · 4G'); o.on.bA = 2; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          const k = t < 0.5 ? 0 : Math.min(4, 1 + Math.floor((t - 0.5) / 0.8)), names = ['"destaque"', '"carrinho"', '"recomendado"', '"pedido"'];
          o.rows.bA = [['builds the JSON', 8.6, 'dim'], ...names.map((n, i) => [i < k ? n + ' ✓' : n, 8.4, i < k ? 'acc' : 'dim'])];
          const ms = 85 + ramp(t, 0.5, 3.7, 0, MONTA); clock(o, ms, k * 3, 1, [[0, 60, '4G out', 'acc'], [60, 85, 'store', 'acc'], [85, ms, '', 'acc']]);
          o.resT = `BFF-APP RESPONSE · ${k * 3} KB`; o.res = JSONK(k); o.cmd = ['{', ...JSON_APP.filter((l, i) => i > 0 && i < 6 && [0, 0, 1, 2, 3][i - 1] < k), '}'];
          if (t > 3.9) T(o, 'bA', '12 KB · 1 small photo\nno custo_fornecedor'); } },
      { id: 'volta', dur: 5.5, title: 'Back to the phone: ~150 ms and 12 KB',
        story: 'The response comes back through the gw-loja and over 4G: another 60 ms. The total is ~150 ms (120 of network, 25 from the slowest service, ~5 to build it) and 12 KB arrive. Before it was 480 ms and 180 KB. The app doesn\'t need to know which services exist or in what order to call them.',
        look: 'The light goes from the bff-app back to the phone and the 4 sections of the screen appear together. The clock stops at 150 ms.',
        key: 'With the BFF: 1 call over 4G, ~150 ms, 12 KB.',
        f(o, t) { o.ph.A = home({}, 'store · app · 4G'); o.rows.bA = [['response ready', 8.6, 'dim'], ['12 KB', 11, 'acc'], ['4 sections', 8.4]]; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s));
          const ms = 90 + ramp(t, 0.3, 1.8, 0, 60), back = send(o, t, 0.3, 1.8, rev(R.c2b(0)), '200 OK · 12 KB', 'acc', 0.6);
          clock(o, back ? 150 : ms, KB_APP, 1, [[0, 60, '4G out', 'acc'], [60, 90, 'store', 'acc'], [90, back ? 150 : ms, '4G back', 'acc']]);
          if (back) o.ph.A = home(ALL('new'), 'store · app · 4G');
          o.cmd = ['200 OK', ...JSON_APP]; o.resT = 'REAL RESPONSE · 12 KB'; o.res = JSONK(4);
          if (t > 2.4) T(o, 'A', '~150 ms · 12 KB\nbefore: 480 ms · 180 KB'); } },
      { id: 'erro', dur: 6.5, title: 'What if it goes wrong: one service fails and the whole screen fails',
        story: 'As it stands, the bff-app waits for the four services and, if one of them fails, returns an error for the whole screen. The recomendacoes goes down and Lena gets 502 Bad Gateway: no plush cat, no cart, no order. The screen now depends on all four at once. If each one answers well 99.9% of the time, the screen answers well 99.6% of the time (0.999⁴).',
        look: 'The recomendacoes turns red. The other three responses arrive, but the bff-app returns 502 and the phone screen goes empty, with the error.',
        key: 'Composition with no plan B: any failure takes down the whole screen (lesson 6).',
        f(o, t) { o.ph.A = home({}, 'store · app · 4G'); o.on.bA = 1; down(o, 's2');
          [0, 1, 3].forEach(s => { send(o, t, 0.3, 1.0, R.b2s(0, s), null, 'hi', 0.05); send(o, t, 1.2, 1.8, rev(R.b2s(0, s)), null, 'acc', 0.3); });
          o.beams.push({ pts: R.b2s(0, 2), on: true, tone: 'bad', cut: clamp((t - 0.3) / 0.7) * 0.7 });
          o.rows.bA = bffRows(['g.Wait() → error', 9, 'bad'], ['recomendacoes failed', 8, 'bad']); o.on.bA = t > 2.2 ? 'bad' : 1;
          const back = send(o, t, 2.4, 3.6, rev(R.c2b(0)), '502 Bad Gateway', 'bad', 0.6);
          clock(o, 0, 0, 1, []); o.stats = [['RESPONSE', back ? '502' : '…', 'bad'], ['SCREEN', back ? 'empty' : '…', 'bad'], ['CALLS OVER 4G', '1']]; o.tl = null;
          o.bars = [['availability of each service', 0.999, '', '99.9%'], ['of a screen that needs all 4', 0.996, 'bad', '99.6%']];
          if (back) o.ph.A = { head: 'store · app · 4G', cards: [], err: ['502', 'could not', 'load the screen'] };
          o.cmd = ['if err := g.Wait(); err != nil {', '  // any failure takes down the whole screen', '  http.Error(w, "bad gateway", 502)', '}'];
          o.resT = 'RESPONSE'; o.res = [['HTTP/1.1 502 Bad Gateway', 'bad'], ['recomendacoes did not respond', 'dim'], ['the other 3 responses were thrown away', 'dim'], ['0.999 × 0.999 × 0.999 × 0.999 ≈ 99.6%', 'hi']];
          if (t > 3.8) T(o, 'A', '502: the whole screen fell\nbecause of one section', 'bad'); } },
    ],
    canais: [
      { id: 'app', dur: 5, title: 'App: order 1048 as a thumbnail',
        story: 'Lena asks about order 1048 in the app. The gw-loja sends /app/ to the bff-app, which calls the pedidos and answers with small JSON, a thumbnail and short pagination. It trusts the JWT the gateway already checked.',
        look: 'The light goes from the phone to the bff-app, which asks the pedidos; the response comes back and the phone shows the order card with the small photo.',
        key: 'The bff-app knows the app\'s format: small, with a thumbnail.',
        f(o, t) { o.ph.A = { head: 'store · app', cards: [['order 1048', '…', 'skel']] }; quiet(o, R.c2b(1), R.c2b(2), R.b2s(1, 3), R.b2s(2, 3));
          send(o, t, 0.3, 1.3, R.c2b(0), 'GET /app/pedidos/1048', 'hi', 0.1); if (t > 1.3) o.on.bA = 1;
          send(o, t, 1.4, 1.9, R.b2s(0, 3), null, 'hi', 0.1); if (t > 1.8 && t < 2.6) o.on.s3 = 1;
          send(o, t, 2.1, 2.6, rev(R.b2s(0, 3)), '1048 · on its way', 'acc', 0.2);
          if (send(o, t, 2.8, 3.8, rev(R.c2b(0)), 'JSON · thumbnail', 'acc', 0.5)) o.ph.A = { head: 'store · app', cards: [['order 1048', 'on its way', 'new'], ['[320 px photo]', 'arrives Thu', 'ok']] };
          o.rows.bA = bffRows(['small JSON', 9, 'acc'], ['thumbnail · JWT', 8]); o.rows.bA[0] = ['/app/', 8.6, 'dim'];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'acc'], ['/web/ → bff-web', 8.2, 'dim'], ['/voz/ → bff-voz', 8.2, 'dim']);
          o.stats = [['CHANNEL', 'app', 'acc'], ['FORMAT', 'JSON', 'hi'], ['PHOTO', 'thumbnail', 'hi']];
          o.cmd = ['GET /app/pedidos/1048', '{ "id": 1048, "status": "a caminho",', '  "foto": "gato-320.webp" }']; o.resT = 'WHAT THE APP GETS';
          o.res = [['{ "id": 1048, "status": "a caminho",', 'acc'], ['  "foto": "gato-320.webp" }', 'acc'], ['small JSON · thumbnail · short pagination', 'dim']];
          if (t > 4.0) T(o, 'bA', 'app: thumbnail'); } },
      { id: 'web', dur: 5, title: 'Website: a page with large photos',
        story: 'Bia opens the same order on the website. The gw-loja sends /web/ to the bff-web, which asks the same pedidos, renders the page on the server (SSR), with large photos, and keeps the session in a central cache, the module 5 Redis.',
        look: 'The light goes from the monitor to the bff-web and the pedidos. A whole page comes back and appears on the monitor with the large photo.',
        key: 'The bff-web knows the website: ready-made HTML, large photos, session in Redis.',
        f(o, t) { o.ph.A = { head: 'store · app', cards: [['order 1048', 'on its way', 'ok'], ['[320 px photo]', 'arrives Thu', 'ok']] }; quiet(o, R.c2b(0), R.c2b(2), R.b2s(0, 3), R.b2s(2, 3));
          o.mon = { head: 'loja.com.br/pedidos/1048', lines: [['loading…', 'dim']] };
          send(o, t, 0.3, 1.3, R.c2b(1), 'GET /web/pedidos/1048', 'hi', 0.1); if (t > 1.3) o.on.bB = 1;
          send(o, t, 1.4, 1.9, R.b2s(1, 3), null, 'hi', 0.1); if (t > 1.8 && t < 2.6) o.on.s3 = 1;
          send(o, t, 2.1, 2.6, rev(R.b2s(1, 3)), '1048 · on its way', 'acc', 0.2);
          if (send(o, t, 2.8, 3.8, rev(R.c2b(1)), 'HTML (SSR) · large photos', 'acc', 0.5)) o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Order 1048', 'hi'], ['on its way · arrives Thu', 'acc'], ['plush cat · R$ 79.90', 'dim']] };
          o.rows.bB = [['/web/', 8.6, 'dim'], ['renders (SSR)', 9, 'acc'], ['session in Redis', 8]];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'dim'], ['/web/ → bff-web', 8.2, 'acc'], ['/voz/ → bff-voz', 8.2, 'dim']);
          o.stats = [['CHANNEL', 'website', 'acc'], ['FORMAT', 'HTML', 'hi'], ['PHOTO', 'large', 'hi']];
          o.cmd = ['GET /web/pedidos/1048', '200 OK · text/html', '(page rendered on the server, large photos)']; o.resT = 'WHAT THE WEBSITE GETS';
          o.res = [['200 OK · Content-Type: text/html', 'acc'], ['<h1>Pedido 1048</h1> <p>a caminho</p>', 'hi'], ['<img src="gato-1.jpg"> (large photo)', 'hi'], ['Bia\'s session in Redis (module 5)', 'dim']];
          if (t > 4.0) T(o, 'bB', 'website: page and large photo'); } },
      { id: 'voz', dur: 5.5, title: 'Voice: one sentence, no photo',
        story: 'Lena asks the assistant: "where is my order?". The gw-loja sends /voz/ to the bff-voz, which asks the same pedidos and returns short text, no photo: "Your order 1048 is on its way and arrives Thursday."',
        look: 'The light leaves the speaker and passes through the bff-voz and the pedidos; the speaker ring lights up and the sentence appears next to it.',
        key: 'The bff-voz knows voice: just text, short, made to be spoken.',
        f(o, t) { o.ph.A = { head: 'store · app', cards: [['order 1048', 'on its way', 'ok'], ['[320 px photo]', 'arrives Thu', 'ok']] }; quiet(o, R.c2b(0), R.c2b(1), R.b2s(0, 3), R.b2s(1, 3));
          o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Order 1048', 'hi'], ['on its way · arrives Thu', 'acc'], ['plush cat · R$ 79.90', 'dim']] };
          if (t > 0.1 && t < 1.0) T(o, 'spk', '"where is my order?"', 'hi');
          send(o, t, 0.6, 1.5, R.c2b(2), 'GET /voz/pedido', 'hi', 0.1); if (t > 1.5) o.on.bC = 1;
          send(o, t, 1.6, 2.1, R.b2s(2, 3), null, 'hi', 0.1); if (t > 2.0 && t < 2.8) o.on.s3 = 1;
          send(o, t, 2.3, 2.8, rev(R.b2s(2, 3)), '1048 · on its way', 'acc', 0.2);
          const said = send(o, t, 3.0, 3.9, rev(R.c2b(2)), 'text · 0 photos', 'acc', 0.4); if (said) { o.spk = 1; T(o, 'spk', '"Your order 1048 is on its way\nand arrives Thursday."'); }
          o.rows.bC = [['/voz/', 8.6, 'dim'], ['short text', 9, 'acc'], ['no photo', 8]];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'dim'], ['/web/ → bff-web', 8.2, 'dim'], ['/voz/ → bff-voz', 8.2, 'acc']);
          o.stats = [['CHANNEL', 'voice', 'acc'], ['FORMAT', 'text', 'hi'], ['PHOTO', 'none', 'hi']];
          o.cmd = ['GET /voz/pedido', '"Your order 1048 is on its way and arrives Thursday."']; o.resT = 'WHAT THE VOICE GETS';
          o.res = [['"Your order 1048 is on its way', 'acc'], [' and arrives Thursday."', 'acc'], ['text to be spoken · no photo', 'dim']]; } },
      { id: 'tres', dur: 5, title: 'One piece of data, three shapes',
        story: 'The three BFFs called the same service, the pedidos. The data is one, order 1048 on its way, and what changes is the shape: thumbnail in the app, page on the website, sentence in voice. Each channel evolves on its own. The partner marketplace-xyz doesn\'t get a BFF: it stays on the gateway, with the generic public API, because a BFF is for your own frontend.',
        look: 'The three lines light up together and end at the same pedidos. Each client shows 1048 its own way.',
        key: 'One BFF per channel: the same data, in each frontend\'s format.',
        f(o, t) { o.ph.A = { head: 'store · app', cards: [['order 1048', 'on its way', 'ok'], ['[320 px photo]', 'arrives Thu', 'ok']] };
          o.mon = { head: 'loja.com.br/pedidos/1048', photo: 1, lines: [['Order 1048', 'hi'], ['on its way · arrives Thu', 'acc'], ['plush cat · R$ 79.90', 'dim']] };
          [0, 1, 2].forEach(r => { const a = 0.3 + r * 0.25; o.beams.push({ pts: R.c2b(r), on: t > a, dot: t > a && t < a + 1 ? ease(t - a) : null }); o.beams.push({ pts: R.b2s(r, 3), on: t > a + 1, dot: t > a + 1 && t < a + 1.6 ? ease((t - a - 1) / 0.6) : null }); if (t > a + 0.8) o.on[['bA', 'bB', 'bC'][r]] = 1; });
          if (t > 1.6) o.on.s3 = 2; o.spk = t > 2.2 ? 1 : 0;
          o.rows.bA = [['/app/', 8.6, 'dim'], ['JSON + thumbnail', 9, 'acc']]; o.rows.bB = [['/web/', 8.6, 'dim'], ['HTML + large photo', 9, 'acc']]; o.rows.bC = [['/voz/', 8.6, 'dim'], ['one sentence', 9, 'acc']];
          o.rows.gw = gwRows(['/app/ → bff-app', 8.2, 'acc'], ['/web/ → bff-web', 8.2, 'acc'], ['/voz/ → bff-voz', 8.2, 'acc'], ['/ → public API', 8.2, 'dim'], ['(marketplace-xyz)', 7.4, 'dim']);
          o.stats = [['CHANNELS', '3', 'acc'], ['SERVICE', 'pedidos', 'hi'], ['DATA', '1048', 'hi']];
          o.cmd = ['- match: { prefix: "/app/" }', '  route: { cluster: bff-app, timeout: 1s }', '- match: { prefix: "/web/" }', '  route: { cluster: bff-web, timeout: 3s }', '- match: { prefix: "/voz/" }', '  route: { cluster: bff-voz, timeout: 1s }', '- match: { prefix: "/" }   # marketplace-xyz', '  route: { cluster: api-publica }'];
          o.resT = 'THE SAME ORDER 1048'; o.res = [['app: { "id": 1048, "status": "a caminho", "foto": … }', 'acc'], ['website: <h1>Pedido 1048</h1> + large photo', 'acc'], ['voice: "Your order 1048 is on its way…"', 'acc'], ['marketplace-xyz: public API, no BFF', 'dim']];
          if (t > 2.6) T(o, 's3', 'one service\nfor all 3 channels', 'hi'); } },
      { id: 'erro', dur: 7, title: 'What if it goes wrong: one backend, one if per channel',
        story: 'Go back to the start, with no BFF per channel: a single backend serves the app, the website and voice. Each endpoint decides by channel with an if, and the if grows with every new endpoint. Every new rule for one channel goes through that code, and whoever edits it for the app can break voice.',
        look: 'The three counters merge into a single backend. On top of it, the if (canal == …) pile up, one endpoint after another.',
        key: 'Without a BFF per channel, each channel\'s format becomes an if inside a single backend.',
        f(o, t) { const merged = t > 1.0; if (!merged) { o.pos.bA = BPOS.bB; o.pos.bC = BPOS.bB; } else { delete o.pos.bA; delete o.pos.bB; delete o.pos.bC; o.pos.one = [BX0, 140]; }
          o.ph.A = { head: 'store · app', cards: [['order 1048', 'on its way', 'ok']] }; o.mon = { head: 'loja.com.br/pedidos/1048', lines: [['Order 1048', 'hi'], ['on its way', 'acc']] };
          [0, 1, 2].forEach(r => quiet(o, R.c2one(r))); quiet(o, R.one2s(3));
          const EP = ['/home', '/pedido', '/carrinho', '/produto'], n = merged ? Math.min(4, 1 + Math.floor((t - 1.2) / 1.0)) : 0;
          o.rows.one = [['one backend, 3 channels', 8.6, 'dim']]; for (let i = 0; i < n; i++) o.rows.one.push([`${EP[i]}:`, 8.6, 'hi'], ['if (canal == "app") …', 8.2, 'bad'], ['else if (canal == "web") …', 8.2, 'bad'], ['else if (canal == "voz") …', 8.2, 'bad']);
          o.rows.one = o.rows.one.slice(0, 1).concat(o.rows.one.slice(1).slice(-12)); if (merged) o.on.one = n >= 3 ? 'bad' : 1;
          o.rows.gw = gwRows(['everything → backend', 8.2, 'dim']);
          o.stats = [['BACKENDS', merged ? '1' : '3', merged ? 'bad' : 'hi'], ['ENDPOINTS', String(n), 'hi'], ['IFs PER CHANNEL', String(n * 3), n ? 'bad' : 'hi']];
          o.cmd = ['if (canal == "app") {', '  resposta = { id, status, foto: miniatura }', '} else if (canal == "web") {', '  resposta = renderizarPagina(pedido, fotos: grandes)', '} else if (canal == "voz") {', '  resposta = "Your order " + id + " is on its way and arrives Thursday."', '}'];
          o.resT = 'THE SINGLE BACKEND\'S CODE'; o.res = [[`${n} endpoints × 3 channels = ${n * 3} if branches`, n ? 'bad' : 'hi'], ['editing the app branch can break voice', 'bad'], ['one deploy for all 3 channels', 'dim']];
          if (t > 5.4) T(o, 'one', 'whoever edits for the app\ncan break voice', 'bad'); } },
    ],
    versao: null, falha: null, metricas: null,
  };

  // versões: o v3 (30% dos celulares) e o v4 (nova home) rodam lado a lado; a toggle nova_home libera aos poucos
  const PCT = [10, 50, 100];
  const verBase = (o, pct, v3use = 30, v3on = true) => {
    o.lab.bA = ['BFF-APP-V3', 'old screen']; o.lab.bB = ['BFF-APP-V4', 'new home'];
    o.rows.gw = gwRows(['x-app-version:', 8.2, 'dim'], ['4.x → bff-app-v4', 8.2, 'acc'], ['3.x → bff-app-v3', 8.2]);
    o.rows.bA = v3on ? [['v3 contract', 8.6, 'dim'], ['old screen', 9.5], [`v3 usage: ${br(v3use)}%`, 8.6, v3use < 1 ? 'acc' : 'hi']] : [['turned off', 11, v3use < 1 ? 'dim' : 'bad'], [`v3 usage: ${br(v3use)}%`, 8.6, v3use < 1 ? 'dim' : 'bad']];
    o.rows.bB = pct == null ? [['v4 contract', 8.6, 'dim'], ['nova_home: off', 9, 'dim']] : [['nova_home', 8.6, 'dim'], { grid: 10, on: pct / 10 }, [`${pct}% of v4 users`, 8.6, 'acc']];
    o.ph.A = home(ALL('dim'), 'app v3 · old screen'); o.ph.B = pct >= 50 ? home(ALL('ok'), 'app v4 · new home ✦') : home(ALL('dim'), 'app v4 · old screen');
    o.stats = [['NOVA_HOME (v4)', pct == null ? 'off' : pct + '%', 'acc'], ['V3 USAGE', br(v3use) + '%', v3use < 1 ? 'acc' : 'hi'], ['APP BFFs', v3on ? '2' : '1', 'hi']];
    o.bars = [['nova_home among v4 users', (pct || 0) / 100, '', (pct == null ? 0 : pct) + '%'], ['phones still on v3', v3use / 100, v3use < 1 ? '' : 'dim', br(v3use) + '%'], ['limit to turn v3 off', 0.01, 'dim', '1%']];
    for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s), R.b2s(1, s));
  };
  const flowVer = (o, t, a = 0.3) => {
    send(o, t, a, a + 1.0, R.c2b(0), 'X-App-Version: 3.9', 'hi', 0.3); send(o, t, a + 0.4, a + 1.4, R.c2b(1), 'X-App-Version: 4.0.0', 'hi', 0.3);
    if (t > a + 1.0) o.on.bA = o.on.bA || 1; if (t > a + 1.4) o.on.bB = 1;
  };
  const togCmd = pct => ['{ "name": "nova_home",', '  "strategies": [{ "name": "flexibleRollout",', `    "parameters": { "rollout": "${pct}", "stickiness": "userId" } }] }`];
  STEPS.versao = [
    { id: 'dois', dur: 5.5, title: 'Two apps live, two BFFs',
      story: 'The old v3 app is still installed on 30% of phones, and v4 brings the new home screen. The app sends its version with every request (X-App-Version: 4.0.0) and the gw-loja picks the BFF: 4.x goes to bff-app-v4, everything else to bff-app-v3. The v3 keeps receiving the old screen, which it knows how to draw.',
      look: 'Two phones, two lights: the top one (v3) goes to bff-app-v3, the bottom one (v4) to bff-app-v4. The toggle is still off.',
      key: 'One BFF per version: the v3 contract doesn\'t break when v4 changes.',
      f(o, t) { verBase(o, null); flowVer(o, t);
        o.cmd = ['- match: { prefix: "/app/", headers:', '    [{ name: x-app-version, string_match: { prefix: "4." } }] }', '  route: { cluster: bff-app-v4 }', '- match: { prefix: "/app/" }   # no header or 3.x', '  route: { cluster: bff-app-v3 }'];
        o.resT = 'ROUTE IN THE GW-LOJA'; o.res = [['x-app-version: 4.x → bff-app-v4', 'acc'], ['no header or 3.x → bff-app-v3', 'hi'], ['v3: 30% of phones', 'dim']];
        if (t > 2.6) { T(o, 'bA', 'v3: 30% of phones', 'hi'); } } },
    ...PCT.map((pct, i) => ({ id: 'p' + pct, dur: 5, pct,
      title: pct === 10 ? 'nova_home at 10% of v4 users' : pct === 50 ? 'No errors: goes up to 50%' : '100%: all of v4 sees the new home',
      story: pct === 10 ? 'Inside v4, the nova_home feature toggle turns the new screen on for 10% of users. The rest of v4 keeps seeing the old screen. The choice uses a hash of each person\'s id, so the same person always sees the same screen; Lena hasn\'t landed in the 10% yet.'
        : pct === 50 ? 'With 10% and no errors, the toggle goes up to 50%. Now Lena is in: her phone, on v4, starts receiving the new home. If the new screen causes trouble, going back is turning the toggle off, with no deploy and no new app version.'
        : 'No errors again, and the toggle reaches 100% of v4 users. The v3 stays the same, on bff-app-v3. Now the old v4 screen code should go: a toggle nobody removes becomes an if.',
      look: `On the bff-app-v4 counter, ${pct / 10} of 10 squares are lit: ${pct}% of v4 users. ${pct >= 50 ? 'The bottom phone shows the new home.' : 'The bottom phone still shows the old screen.'}`,
      key: pct === 10 ? 'The toggle decides who sees the change inside a version.' : pct === 50 ? 'Release gradually: if something breaks, only part of the users saw it.' : 'At 100%, the toggle did its job and should leave the code.',
      f(o, t) { verBase(o, pct); flowVer(o, t, 0.2); o.cmd = togCmd(pct);
        o.resT = 'NOVA_HOME FEATURE TOGGLE'; o.res = [[`rollout: ${pct}% · stickiness: userId`, 'acc'], [`${pct}% of v4 sees the new home`, 'hi'], [pct >= 50 ? 'Lena (v4) sees the new home' : 'Lena (v4) still sees the old screen', 'dim'], ['v3 does not change: bff-app-v3', 'dim']];
        if (t > 2.4) T(o, 'bB', `nova_home: ${pct}%`); if (pct === 100 && t > 3.4) T(o, 'B', 'old v4 screen:\ntime to remove the code', 'hi'); } })),
    { id: 'aposenta', dur: 6.5, title: 'Retiring v3: only below 1%',
      story: 'Over time, people update the app and v3 usage, measured in bff-app-v3 itself, keeps falling: 30%, 12%, 4%, 0.8%. Only when it drops below 1% does the store turn off bff-app-v3. Anyone still on v3 gets a notice to update.',
      look: 'The v3 usage number goes down on the display and on the counter; once it drops below 1%, the bff-app-v3 goes dark.',
      key: 'Turning off a version is a data-driven decision: the usage measured in the BFF.',
      f(o, t) { const use = t < 3.6 ? [30, 12, 4, 0.8][Math.min(3, Math.floor(t / 0.9))] : 0.8, off = t > 4.2; verBase(o, 100, use, !off);
        if (!off) { send(o, t, 0.2, 1.0, R.c2b(0), 'v3', 'hi', 0.1); o.on.bA = use < 1 ? 1 : 0; } else { o.on.bA = 'off'; quiet(o, R.c2b(0)); }
        send(o, t, 0.2, 1.0, R.c2b(1), null, 'hi', 3); o.on.bB = 1;
        if (off) o.ph.A = { head: 'app v3', cards: [], err: ['v3', 'update the app', 'to continue'], tone: 'dim' };
        o.cmd = ['v3 usage (measured in bff-app-v3):', '30% → 12% → 4% → 0.8%', off ? '< 1%: bff-app-v3 turned off' : 'turn off only below 1%'];
        o.resT = 'V3 USAGE'; o.res = [[`now: ${br(use)}% of phones`, use < 1 ? 'acc' : 'hi'], ['limit: 1%', 'dim'], [off ? 'bff-app-v3 turned off' : 'bff-app-v3 live', off ? 'acc' : 'hi']];
        if (off) T(o, 'bA', 'below 1%: turned off'); } },
    { id: 'erro', dur: 6.5, title: 'What if it goes wrong: turning off v3 with 30% still live',
      story: 'Go back to the start, with v3 still on 30% of phones, and imagine the store turns off bff-app-v3 together with the v4 launch. The gw-loja sends v3 requests to a BFF that no longer exists, and the old app doesn\'t know how to draw the new screen. Almost a third of people are left with no home screen.',
      look: 'The bff-app-v3 is dark. The v3 phone\'s light comes back red and its screen shows the error.',
      key: 'The app on the phone doesn\'t update when the store wants: the old version\'s BFF stays until usage drops.',
      f(o, t) { verBase(o, 100, 30, false); o.on.bA = 'bad'; o.on.bB = 1; send(o, t, 0.2, 1.0, R.c2b(1), null, 'hi', 5);
        const got = send(o, t, 0.3, 1.3, R.c2b(0), 'X-App-Version: 3.9', 'hi', 0.1);
        if (got) { o.beams.push({ pts: R.c2b(0), on: true, tone: 'bad' }); o.ph.A = { head: 'app v3', cards: [], err: ['503', 'home screen', 'unavailable'] }; }
        o.stats[1][2] = 'bad'; o.stats[2] = ['NO SCREEN', got ? '30%' : '…', 'bad'];
        o.cmd = ['GET /app/home  (X-App-Version: 3.9)', '→ bff-app-v3: turned off', '503 Service Unavailable']; o.resT = 'WHAT V3 GETS';
        o.res = [['HTTP/1.1 503 Service Unavailable', 'bad'], ['30% of phones are still on v3', 'bad'], ['v3 cannot draw the new home', 'dim']];
        if (t > 2.2) T(o, 'A', '30% of phones\nwith no home screen', 'bad'); } },
  ];

  // falha: timeout de 100 ms e fallback; sem timeout, o BFF trava; o catalogo cai e os dois canais sentem
  const falBase = o => { o.lab.bB = ['BFF-WEB', 'website']; o.rows.bB = [['/web/', 8.6, 'dim'], ['website page', 9]];
    o.mon = { head: 'loja.com.br', photo: 1, lines: [['plush cat', 'hi'], ['R$ 79.90', 'acc']] }; for (let s = 0; s < 4; s++) quiet(o, R.b2s(1, s)); quiet(o, R.c2b(1)); };
  const fanOut = (o, t, skip, a = 0.3) => [0, 1, 2, 3].forEach(s => { send(o, t, a, a + 0.6, R.b2s(0, s), null, 'hi', 0.05); if (!skip.includes(s)) send(o, t, a + 0.8, a + 1.3, rev(R.b2s(0, s)), null, 'acc', 0.3); });
  const waitStat = (ms, conns, tela, tone = 'acc') => [['BFF WAIT', ms >= 1000 ? br((ms / 1000).toFixed(ms < 10000 ? 1 : 0)) + ' s' : fmtMs(ms), ms > 100 ? 'bad' : tone], ['OPEN CONNECTIONS', conns.toLocaleString('en-US'), conns > 100 ? 'bad' : 'hi'], ['SCREEN', tela, tela === 'gone' ? 'bad' : 'acc']];
  STEPS.falha = [
    { id: 'cai', dur: 5, title: 'The recomendacoes does not respond',
      story: 'Lena opens the app and the bff-app calls the four services at the same time, as in lesson 2. Three answer. The recomendacoes is down and doesn\'t respond. But now the bff-app waits at most 100 ms for each service.',
      look: 'Three lights return to the bff-app; the recomendacoes one gets stuck halfway. On the counter, the wait clock climbs to 100 ms.',
      key: 'Every BFF call has a deadline: the timeout.',
      f(o, t) { falBase(o); down(o, 's2'); send(o, t, 0.1, 0.6, R.c2b(0), 'GET /app/home', 'hi', 5); o.on.bA = 1; fanOut(o, t, [2], 0.6);
        const w = ramp(t, 0.9, 3.4, 0, 100); o.beams.push({ pts: R.b2s(0, 2), on: true, tone: 'bad', cut: 0.6 });
        o.ph.A = home({}, 'store · app');
        o.rows.bA = bffRows(['3 of 4 responded', 9, 'acc'], [`recomendacoes: ${Math.round(w)} ms`, 8.6, 'bad'], ['timeout: 100 ms', 8.2, 'dim']);
        o.stats = waitStat(w, 1, '…'); o.bars = [['wait for recomendacoes', w / 100, w >= 100 ? 'bad' : '', fmtMs(w)], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['ctx, cancel := context.WithTimeout(ctx, 100*time.Millisecond)', 'r, err := recomendacoes.Para(ctx, 42)'];
        o.resT = 'BFF CALLS'; o.res = [['catalogo: 42 · 79.90', 'acc'], ['carrinho: 1 item', 'acc'], ['pedidos: 1048 · on its way', 'acc'], [`recomendacoes: … ${Math.round(w)} ms`, 'bad']];
        if (t > 3.4) T(o, 's2', 'did not respond\nin 100 ms', 'bad'); } },
    { id: 'fallback', dur: 5.5, title: '100 ms timeout and fallback',
      story: 'After 100 ms, the bff-app gives up on that call, and only that one. Instead of failing, it uses plan B (fallback): builds the screen without the "customers who bought this also bought" section, with "recomendado": []. The screen arrives, just a bit smaller. Lena doesn\'t even notice.',
      look: 'The BFF answers the phone; the screen appears with highlight, cart and order, and the recommended section is gone.',
      key: 'Fallback: when a decoration fails, the screen ships without it.',
      f(o, t) { falBase(o); down(o, 's2'); o.on.bA = 1; for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s)); o.beams.push({ pts: R.b2s(0, 2), tone: 'bad', on: true, cut: 0.6 });
        o.rows.bA = bffRows(['timeout: 100 ms', 9, 'acc'], ['"recomendado": []', 9, 'acc'], ['fallback', 8.2, 'dim']);
        const back = send(o, t, 0.6, 1.8, rev(R.c2b(0)), '200 OK · no recommended', 'acc', 0.6);
        o.ph.A = back ? home({ d: 'new', c: 'new', r: 'gone', p: 'new' }, 'store · app') : home({}, 'store · app');
        o.stats = waitStat(100, 1, back ? 'whole' : '…'); o.bars = [['wait for recomendacoes', 1, 'acc', '100 ms'], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['if err != nil { // timeout, error or service down', '  return []Produto{} // fallback: screen without the section', '}'];
        o.resT = 'RESPONSE WITH FALLBACK'; o.res = [['"destaque": { "id": 42, … "preco": 79.90 },', 'acc'], ['"carrinho": { "itens": 1 },', 'acc'], ['"recomendado": [],', 'acc'], ['"pedido": { "id": 1048, "status": "a caminho" }', 'acc']];
        if (back && t > 2.4) T(o, 'A', 'Lena doesn\'t even notice:\nthe screen arrived'); } },
    { id: 'pedidos', dur: 5.5, title: 'The pedidos goes down: "status unavailable right now"',
      story: 'Now it\'s the pedidos that goes down. Same rule: 100 ms deadline and a plan B for that section. The order status is information, not decoration, so the section doesn\'t disappear: it shows "status unavailable right now". The rest of the screen stays whole.',
      look: 'The pedidos turns red. On the phone, the order card appears in red with "status unavailable right now"; the other sections arrive normally.',
      key: 'Each section has its own plan B: disappear, warn or block.',
      f(o, t) { falBase(o); down(o, 's3'); o.on.bA = 1; send(o, t, 0.1, 0.6, R.c2b(0), 'GET /app/home', 'hi', 5); fanOut(o, t, [3], 0.6); o.beams.push({ pts: R.b2s(0, 3), tone: 'bad', on: true, cut: clamp((t - 0.6) / 0.6) * 0.6 });
        const w = ramp(t, 0.9, 2.2, 0, 100), back = send(o, t, 2.5, 3.5, rev(R.c2b(0)), '200 OK · order unavailable', 'acc', 0.6);
        o.rows.bA = bffRows([`pedidos: ${Math.round(w)} ms`, 8.6, 'bad'], [w >= 100 ? 'fallback: warns' : 'timeout: 100 ms', 8.6, w >= 100 ? 'acc' : 'dim']);
        o.ph.A = back ? home({ d: 'new', c: 'new', r: 'new', p: ['bad', 'status unavailable\nright now'] }, 'store · app') : home({}, 'store · app');
        o.stats = waitStat(w, 1, back ? 'whole' : '…'); o.bars = [['wait for pedidos', w / 100, '', fmtMs(w)], ['timeout', 1, 'dim', '100 ms']];
        o.cmd = ['"pedido": { "id": 1048, "status": "unavailable right now" }']; o.resT = 'ORDER SECTION';
        o.res = [['decoration (recommendations): section disappears', 'dim'], ['information (order): "unavailable right now"', 'acc'], ['essential (price at checkout): warns and blocks payment', 'dim']];
        if (back && t > 3.8) T(o, 'A', 'only the order section\nwarns; the rest arrived'); } },
    { id: 'semtimeout', dur: 7.5, title: 'What if it goes wrong: with no timeout, the BFF hangs',
      story: 'Now with no timeout. The bff-app waits for the recomendacoes for 30 s. Meanwhile more screens arrive, each stuck in the same wait. At 100 screens per second, that is 100 × 30 = 3,000 open connections. They pile up until the BFF falls, and the whole home screen disappears. A service that only decorates the screen took down the app.',
      look: 'The wait on the display runs up to 30 s and the open connections climb to 3,000. The bff-app turns red and the phone loses the screen.',
      key: 'With no timeout, one slow service traps the whole BFF.',
      f(o, t) { falBase(o); down(o, 's2'); const w = ramp(t, 0.6, 5.0, 0, 30000), conns = Math.round(w / 1000 * 100), dead = t > 5.0;
        o.beams.push({ pts: R.b2s(0, 2), tone: 'bad', on: true, cut: 0.6 }); [0, 1, 3].forEach(s => quiet(o, R.b2s(0, s)));
        if (!dead) o.beams.push({ pts: R.c2b(0), on: true, dot: (t * 1.6) % 1 }); else o.beams.push({ pts: R.c2b(0), on: true, tone: 'bad' });
        o.on.bA = dead ? 'bad' : 1; o.rows.bA = dead ? [['DOWN', 12, 'bad'], ['3,000 connections stuck', 8.6, 'bad']] : bffRows(['no timeout', 9, 'bad'], [`waiting: ${br((w / 1000).toFixed(1))} s`, 8.6, 'bad'], [`connections: ${conns.toLocaleString('en-US')}`, 8.6, 'bad']);
        o.ph.A = dead ? { head: 'store · app', cards: [], err: ['✕', 'the home screen', 'disappears'] } : home({}, 'store · app');
        o.stats = waitStat(w, conns, dead ? 'gone' : '…'); o.bars = [['wait for recomendacoes', w / 30000, 'bad', br((w / 1000).toFixed(0)) + ' s'], ['open connections', conns / 3000, 'bad', conns.toLocaleString('en-US')]];
        o.cmd = ['r, err := recomendacoes.Para(r.Context(), 42)', '// no deadline: waits as long as it takes', '100 screens/s × 30 s = 3,000 open connections'];
        o.resT = 'NO TIMEOUT'; o.res = [['100 screens per second × 30 s', 'hi'], ['= 3,000 open connections', 'bad'], ['with a 100 ms timeout: about 10', 'acc']];
        if (dead) T(o, 'bA', 'the BFF fell:\nthe whole screen disappears', 'bad'); } },
    { id: 'catalogo', dur: 7, title: 'What if it goes wrong: the catalogo goes down and both channels feel it',
      story: 'The bff-app and the bff-web depend on the same catalogo. If it goes down, both channels feel it: the highlight disappears from the app and the product page fails on the website. Separating BFFs by channel limits the blast radius of a BFF that falls, but it doesn\'t separate shared dependencies. Isolating those calls (bulkhead) is a resilience topic, for another module.',
      look: 'The catalogo turns red and two red lines leave it: one to the bff-app, another to the bff-web. The phone and the monitor show the error.',
      key: 'Blast radius: how far a failure reaches. A shared service hits every channel.',
      f(o, t) { falBase(o); down(o, 's0'); o.on.bA = 1; o.on.bB = 1;
        [1, 2, 3].forEach(s => quiet(o, R.b2s(0, s), R.b2s(1, s)));
        const hit = t > 1.4; o.beams.push({ pts: rev(R.b2s(0, 0)), on: t > 0.4, tone: 'bad', cut: clamp((t - 0.4) / 1.0) }); o.beams.push({ pts: rev(R.b2s(1, 0)), on: t > 0.4, tone: 'bad', cut: clamp((t - 0.4) / 1.0) });
        if (hit) { o.on.bA = 'bad'; o.on.bB = 'bad'; }
        const reach = t > 2.4; if (t > 1.6) { o.beams.push({ pts: rev(R.c2b(0)), on: true, tone: 'bad', cut: clamp((t - 1.6) / 0.8) }); o.beams.push({ pts: rev(R.c2b(1)), on: true, tone: 'bad', cut: clamp((t - 1.6) / 0.8) }); }
        o.rows.bA = bffRows(['catalogo down', 9, 'bad'], ['highlight unavailable', 8.2, 'bad']); o.rows.bB = [['/web/', 8.6, 'dim'], ['catalogo down', 9, 'bad'], ['product won\'t load', 8.2, 'bad']];
        o.ph.A = reach ? home({ d: ['bad', 'unavailable'], c: 'ok', r: 'ok', p: 'ok' }, 'store · app') : home(ALL('ok'), 'store · app');
        if (reach) o.mon = { head: 'loja.com.br/produto/42', lines: [['error loading', 'bad'], ['product 42', 'bad'], ['try again', 'dim']] };
        o.stats = [['CHANNELS HIT', reach ? '2 of 2' : '…', 'bad'], ['SERVICE', 'catalogo', 'bad'], ['BFFs', '2', 'hi']]; o.bars = null;
        o.cmd = ['bff-app → catalogo', 'bff-web → catalogo', '(the same dependency in both channels)']; o.resT = 'BLAST RADIUS';
        o.res = [['catalogo down → bff-app and bff-web', 'bad'], ['a BFF that falls: only its channel', 'acc'], ['a shared service: all of them', 'bad'], ['isolating calls (bulkhead): another module', 'dim']];
        if (reach) T(o, 's0', 'catalogo down:\nboth channels feel it', 'bad'); } },
  ];

  // métricas: cada BFF mede o seu; os 2% do app vêm do v3 em Android antigo; juntos, viram 0,6%
  const dash = (p95, err, tone) => [['p95', 7.4, 'dim'], [p95, 11, 'acc'], [`errors ${err}`, 9.5, tone]];
  const metBase = o => { o.lab.bB = ['BFF-WEB', 'website']; o.mon = { head: 'loja.com.br', photo: 1, lines: [['plush cat', 'hi'], ['R$ 79.90', 'acc']] };
    o.ph.A = home(ALL('ok'), 'store · app'); for (let s = 0; s < 4; s++) quiet(o, R.b2s(0, s), R.b2s(1, s)); };
  const traffic = (o, t, ...rows) => rows.forEach(r => o.beams.push({ pts: R.c2b(r), on: true, dot: ((t * 0.9) + r * 0.37) % 1 }));
  STEPS.metricas = [
    { id: 'mede', dur: 5, title: 'Each BFF measures its own requests',
      story: 'With one BFF per channel, each one measures its own: how many requests arrive, how many fail and how long they take. The bff-app measures only the app; the bff-web, only the website.',
      look: 'Requests run from the phone to the bff-app and from the monitor to the bff-web; each counter\'s numbers build up.',
      key: 'One BFF per channel gives you a metric per channel for free.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; const f = clamp(t / 3.5);
        o.rows.bA = dash(fmtMs(150 * f), br((2 * f).toFixed(1)) + '%', 'hi'); o.rows.bB = dash(fmtMs(300 * f), br((0.1 * f).toFixed(2)) + '%', 'hi');
        o.stats = [['BFF-APP p95', fmtMs(150 * f), 'acc'], ['BFF-WEB p95', fmtMs(300 * f), 'acc'], ['MEASURED IN', '2 BFFs', 'hi']];
        o.cmd = ['histogram_quantile(0.95,', '  sum by (le, canal, versao)', '    (rate(http_request_duration_seconds_bucket[5m])))'];
        o.resT = 'THE MINIMUM FOR EACH PANEL'; o.res = [['volume: requests per second', 'hi'], ['errors: 5xx and fallbacks triggered', 'hi'], ['time: p50, p95, p99', 'hi'], ['breakdown: app version and OS', 'hi']]; } },
    { id: 'numeros', dur: 5.5, title: 'bff-app: p95 150 ms and 2% errors',
      story: 'The bff-app shows a p95 of 150 ms (the lesson 2 time) and 2% errors. The bff-web, a p95 of 300 ms, which includes rendering the page on the server, and 0.1% errors. Comparing the two by the bare number is misleading: each channel has its own goal. But the app\'s 2% stands out.',
      look: 'Both counters show the final numbers; the bff-app\'s 2% is in red.',
      key: 'p95: 95 of every 100 requests were faster than that time.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; o.rows.bA = dash('150 ms', '2%', 'bad'); o.rows.bB = dash('300 ms', '0.1%', 'acc');
        o.stats = [['APP ERRORS', '2%', 'bad'], ['WEB ERRORS', '0.1%', 'acc'], ['p95 APP · WEB', '150 · 300', 'hi']];
        o.bars = [['bff-app · errors', 0.02 / 0.025, 'bad', '2%'], ['bff-web · errors', 0.001 / 0.025, '', '0.1%'], ['bff-app · p95', 150 / 400, '', '150 ms'], ['bff-web · p95', 300 / 400, '', '300 ms']];
        o.cmd = ['sum by (canal, versao) (rate(http_requests_total{status=~"5.."}[5m]))', '  / sum by (canal, versao) (rate(http_requests_total[5m]))'];
        o.resT = 'PER CHANNEL'; o.res = [['bff-app: p95 150 ms · errors 2%', 'bad'], ['bff-web: p95 300 ms · errors 0.1%', 'acc'], ['each channel against its own goal', 'dim']];
        if (t > 2.2) T(o, 'bA', '2% errors: from where?', 'bad'); } },
    { id: 'corte', dur: 5.5, title: 'The 2% come only from v3 on old Android',
      story: 'Breaking down the bff-app requests by version and OS, the errors show up in one place: the v3 app on old Android. v4 and v3 on iOS are fine. With the problem isolated, the app team fixes v3, or decides when to retire it (lesson 5), without touching the website.',
      look: 'The bff-app panel opens up by version and OS; only the "v3 · old Android" line turns red.',
      key: 'Breaking down by version and OS takes the error to whoever can fix it.',
      f(o, t) { metBase(o); traffic(o, t, 0, 1); o.on.bA = 1; o.on.bB = 1; o.rows.bB = dash('300 ms', '0.1%', 'acc');
        o.rows.bA = [['errors by version', 8.2, 'dim'], ['v4 · iOS and Android: ok', 8.2, 'acc'], ['v3 · iOS: ok', 8.2, 'acc'], ['v3 · old Android ✕', 8.6, 'bad']];
        o.stats = [['APP ERRORS', '2%', 'bad'], ['WHERE', 'v3 · Android', 'bad'], ['WEB ERRORS', '0.1%', 'acc']];
        o.bars = [['v4 · iOS and Android', 0, '', 'ok'], ['v3 · iOS', 0, '', 'ok'], ['v3 · old Android', 1, 'bad', 'all errors']];
        o.cmd = ['sum by (canal, versao, sistema)', '  (rate(http_requests_total{canal="app", status=~"5.."}[5m]))'];
        o.resT = 'BFF-APP ERRORS, BY BREAKDOWN'; o.res = [['v4 · iOS and Android: no errors', 'acc'], ['v3 · iOS: no errors', 'acc'], ['v3 · old Android: the 2%', 'bad']];
        if (t > 2.4) T(o, 'A', 'v3 · old Android', 'bad'); } },
    { id: 'erro', dur: 7, title: 'What if it goes wrong: measured together, 0.6%',
      story: 'In a single backend, both channels would fall into the same count. In an example where 26 of every 100 requests come from the app, the average would be 0.26 × 2% + 0.74 × 0.1% ≈ 0.6%. It\'s a number nobody investigates, and the v3 errors on old Android would go unnoticed.',
      look: 'The two counters merge into a single backend. Its panel shows 0.6% errors, with no red: everything looks fine.',
      key: 'The total hides the small channel.',
      f(o, t) { metBase(o); const merged = t > 1.0; if (!merged) { o.pos.bA = [BX0, 233]; o.pos.bB = [BX0, 233]; } else { delete o.pos.bA; delete o.pos.bB; o.pos.one = [BX0, 140]; o.on.one = 1; }
        o.beams.push({ pts: R.c2one(0), on: true, dot: (t * 0.9) % 1 }, { pts: R.c2one(1), on: true, dot: (t * 0.9 + 0.4) % 1 }); quiet(o, R.one2s(0), R.one2s(1), R.one2s(2), R.one2s(3));
        o.lab.one = ['SINGLE BACKEND', 'app + web'];
        const f = clamp((t - 1.2) / 2); o.rows.one = [['app + web together', 8.6, 'dim'], ['errors', 7.4, 'dim'], [br((0.6 * f).toFixed(1)) + '%', 14, 'hi'], ['looks fine', 8.6, 'dim'], ['', 6.8], ['v3 · old Android:', 8.2, 'dim'], ['diluted in the average', 8.2, 'dim']];
        o.stats = [['ERRORS (ALL TOGETHER)', br((0.6 * f).toFixed(1)) + '%', 'hi'], ['APP ERRORS', 'hidden', 'bad'], ['BACKENDS', merged ? '1' : '2', 'hi']];
        o.bars = [['app alone', 0.02 / 0.025, 'bad', '2%'], ['website alone', 0.001 / 0.025, '', '0.1%'], ['all together (26% app)', 0.006 / 0.025 * f, '', br((0.6 * f).toFixed(1)) + '%']];
        o.cmd = ['0.26 × 2% + 0.74 × 0.1%', '= 0.52% + 0.074%', '≈ 0.6%']; o.resT = 'THE AVERAGE CALCULATION';
        o.res = [['0.26 × 2% + 0.74 × 0.1% ≈ 0.6%', 'hi'], ['26 of every 100 requests are from the app (example)', 'dim'], ['2% in the app is visible; 0.6% in total is not', 'bad']];
        if (t > 4.4) T(o, 'one', '0.6%: nobody investigates', 'bad'); } },
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
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'photo', 7.4, 36); x.fillText('photo', u(24), u(36)); fitFont(x, u, 'large', 7.4, 36); x.fillText('large', u(24), u(48)); x.textAlign = 'left'; tx = 48; }
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
      lbl(`TIMELINE · 0 to ${max} ms`, X0, 56, 250);
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(X0), u(64), u(X1 - X0), u(22));
      segs.forEach(([a, b, lab, tn]) => { if (b <= a) return; x.fillStyle = tn === 'bad' ? BAD() : acc; x.fillRect(u(sx(a) + 0.4), u(64.6), u(Math.max(0.5, sx(b) - sx(a) - 0.8)), u(20.8));
        if (lab && sx(b) - sx(a) > 26) { x.fillStyle = theme === 'light' ? '#ffffff' : '#141516'; x.textAlign = 'center'; fitFont(x, u, lab, 8.2, sx(b) - sx(a) - 4); x.fillText(lab, u((sx(a) + sx(b)) / 2), u(75.5)); x.textAlign = 'left'; } });
      for (let v = 0; v <= max; v += max / 4) { const X = sx(v); x.fillStyle = INK(); x.fillRect(u(X - 0.3), u(86), u(0.6), u(4)); x.textAlign = v === 0 ? 'left' : v === max ? 'right' : 'center'; fitFont(x, u, String(v), 7.6, 30); x.fillText(String(v), u(X), u(96)); }
      x.textAlign = 'left'; x.fillStyle = acc; x.fillRect(u(sx(now) - 0.7), u(60), u(1.4), u(30));
      if (o.ms != null) { x.fillStyle = C.inkHi; fitFont(x, u, `now: ${fmtMs(now)} · ${o.kb} KB on the phone`, 8.6, 250); x.fillText(`now: ${fmtMs(now)} · ${o.kb} KB on the phone`, u(X0), u(116)); } }
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
  const EX = '<li class="h3-dim">The paths from the requests to the services and the split of the 180 KB into 4 × 45 KB are examples; the lesson text only gives the total.</li>';
  const DATA = {
    sem: () => `<table class="h3-sum"><tr><th>call</th><th>service</th><th>clock</th><th>KB</th></tr>${SVC.map((s, i) => `<tr><td>${i + 1}</td><td>${s}</td><td>${(i + 1) * RTT} ms</td><td>${(i + 1) * 45}</td></tr>`).join('')}</table>
      <li>4G round trip: <b>120 ms</b> · 4 in a queue: 4 × 120 = <b>480 ms</b></li><li>JSON made for the website: <b>180 KB</b> (long description, 8 high-res photos, <b>custo_fornecedor</b>)</li><li>The screen uses a name, a price, a small photo, an item count and a status phrase.</li>${EX}`,
    compor: () => `<table class="h3-sum"><tr><th>segment</th><th>ms</th></tr><tr><td>4G (round trip)</td><td>120</td></tr><tr><td>4 services in parallel (the slowest)</td><td>25</td></tr><tr><td>assembly in the BFF</td><td>~5</td></tr><tr class="on"><td>total</td><td>~150</td></tr></table>
      <li>Response: <b>12 KB</b> (before: 180 KB) · 1 thumbnail photo · no custo_fornecedor</li><li>In a queue, the BFF would add the 4 times; in parallel, it waits only for the slowest.</li><li>With no fallback: 0.999⁴ ≈ <b>99.6%</b> of good screens, even with each service at 99.9%.</li>`,
    canais: () => `<table class="h3-sum"><tr><th>channel</th><th>BFF</th><th>order 1048 becomes</th></tr><tr><td>app</td><td>bff-app</td><td>JSON + thumbnail</td></tr><tr><td>website</td><td>bff-web</td><td>SSR page + large photo</td></tr><tr><td>voice</td><td>bff-voz</td><td>"Your order 1048 is on its way and arrives Thursday."</td></tr><tr><td>partner</td><td>none</td><td>public API on the gateway</td></tr></table>
      <li>The gw-loja picks the BFF by prefix: <b>/app/</b>, <b>/web/</b>, <b>/voz/</b></li><li>Website session in Redis (module 5); the app uses only the JWT.</li>`,
    versao: () => `<li>App <b>v3</b> on <b>30%</b> of phones · app <b>v4</b> with the new home</li><li>Route by header: <b>X-App-Version: 4.x</b> → bff-app-v4; everything else → bff-app-v3</li><li><b>nova_home</b> toggle: 10% → 50% → 100% of v4 users (hash of userId)</li><li>Turn off bff-app-v3 only when v3 usage is <b>below 1%</b>, measured in the BFF</li><li class="h3-dim">The steps 30% → 12% → 4% → 0.8% for the v3 decline are examples.</li>`,
    falha: () => `<li>bff-app timeout: <b>100 ms</b> per service · recomendacoes fallback: <b>"recomendado": []</b></li><li>pedidos down: <b>"status unavailable right now"</b></li><li>No timeout: 30 s wait · 100 screens/s × 30 s = <b>3,000</b> connections (with 100 ms, about 10)</li><li>catalogo down: <b>bff-app and bff-web</b> both feel it (blast radius)</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>BFF</th><th>p95</th><th>errors</th></tr><tr class="on"><td>bff-app</td><td>150 ms</td><td>2%</td></tr><tr><td>bff-web</td><td>300 ms</td><td>0.1%</td></tr></table>
      <li>The 2% come from <b>v3 on old Android</b></li><li>Together (example: 26 of every 100 requests from the app): 0.26 × 2% + 0.74 × 0.1% ≈ <b>0.6%</b></li>`,
  };
  function countHtml() { const o = SP || spec(), [m, ...r] = o.stats; if (!m) return '';
    return `<b${m[2] === 'bad' ? ' class="bad"' : ''}>${m[1]}</b><span>${m[0].toLowerCase()}</span><i>${r.map(s => `· ${s[0].toLowerCase()}: ${s[1]}`).join(' ')}</i>`; }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${sc === 'versao' ? `<div class="o3-mode b3-tog" role="group" aria-label="nova_home toggle">${PCT.map((p, i) => `<button data-pct="${i + 1}" aria-pressed="${s.pct === p}">nova_home ${p}%</button>`).join('')}</div>` : ''}
      <h2>${s.title}</h2>
      <div class="i3-count" id="b3count">${countHtml()}</div>
      <div class="i3-sql"><b>Real request and response</b>${esc(o.cmd.join('\n'))}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'bff') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.stats.map(s => s[1]).join(' · ')}`; }
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
    const who = [o.cli.A && [sc === 'versao' ? 'app v3 · Lena' : 'app · Lena · 4G', 0], o.cli.B && ['app v4 · Lena', 1], o.cli.mon && ['web · Bia', 1], o.cli.spk && ['voice · Lena', 2]].filter(Boolean);
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
      const sq = document.querySelector('#info .i3-sql'), sh = '<b>Real request and response</b>' + esc(SP.cmd.join('\n')); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 220, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 220, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
