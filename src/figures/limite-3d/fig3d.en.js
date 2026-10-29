// Figura 3D (iso-glow): rate limiting no gw-loja. Black Friday: um robô do concorrente pede o preço do gato (produto 42)
// 500 vezes por segundo, e a Lena (Recife) abre o app no meio do ataque.
// Cena: ao fundo, o mostrador com o que passou, o que levou 429 e o pedido e a resposta HTTP reais. Na frente, os clientes
// (ROBÔ, LENA), os baldes no gw-loja (token bucket com torneira, leaky bucket com furo) e o CATÁLOGO; no throttling, o
// gateway e o tempo de resposta do catálogo; nas réplicas, 3 gateways, o contador no REDIS e o catálogo.
// Cenários (toggle e ?mode=token|leaky|throttle|replicas; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/api-gateways-brief.md): balde 200 / 100 por s, por chave 20 / 10 por s,
// fila 50 / 50 por s, catálogo aguenta 100/s, lento = 2 s, throttling 100 → 50/s, 3 réplicas = 30/s, Redis = 10/s.
FIGS3D.push({ id: 'limite', name: 'Rate limiting', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const S = (t, a, b) => clamp((t - a) / (b - a));
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const GET = 'GET /api/v1/produtos/42', IP = '203.0.113.7';
  const R429 = ['HTTP/1.1 429 Too Many Requests', 'Retry-After: 1'];
  const R429K = [...R429, 'RateLimit-Limit: 10', 'RateLimit-Remaining: 0'];
  const SC = ['token', 'leaky', 'throttle', 'replicas'];
  const SCNAME = { token: 'Token', leaky: 'Leaky', throttle: 'Throttle', replicas: 'Replicas' };
  const SCFULL = { token: 'Token bucket', leaky: 'Leaky bucket', throttle: 'Throttling', replicas: 'Replicas × Redis' };
  const A5 = 'aula-5-rate-limiting-throttling-token-bucket-e-leaky-bucket';
  const AULA = { token: A5, leaky: A5, throttle: A5, replicas: A5 };
  let clk = 0, sc = 'token', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-limite3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7;
  plateWith(g0, 680, 400, [[14, 14], [666, 14], [14, 386], [666, 386]]);
  hazeAndShadow(g0, 340, 200, 8.2, 5.2);
  // mostrador ao fundo, à direita (a faixa da esquerda fica livre para o balão da Lena)
  const SX = 150, SWD = 512, SHT = 125, DW = 460;
  rbox(SX, 12, PL, SWD + 8, 12, SHT + 13, 5, bodyMat, g0);
  const scr = faceCanvas('front', SX + 4, 24, PL + SHT + 10, SWD, SHT, 5, g0), SK = SWD / DW;   // desenhado em 460 × 112 e ampliado
  // blocos: cada um é um grupo que se move entre os lugares de cada cenário
  function block(w, d, h, lab, sub) {
    const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { kind: 'block', g, mat, top, fr, fh, w, d, h, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  // baldes: fundo, quatro paredes, o nível (uma caixa que cresce) e, no de tokens, a torneira; no furado, o cano de saída
  function bucket(w, d, h, lab, tap, outlet) {
    const g = new THREE.Group(); g0.add(g); g.visible = false; const T = 4, mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, 4, 5, mat, g);
    rbox(0, 0, 4, w, T, h - 4, 1, mat, g); rbox(0, T, 4, T, d - 2 * T, h - 4, 1, mat, g);
    rbox(w - T, T, 4, T, d - 2 * T, h - 4, 1, mat, g); rbox(0, d - T, 4, w, T, h - 4, 1, mat, g);
    if (tap) { rbox(w / 2 - 4, 0, h, 8, 6, 46, 1, mat, g); rbox(w / 2 - 4, 0, h + 46, 8, d / 2 + 6, 7, 1, mat, g); rbox(w / 2 - 7, d / 2 - 7, h + 34, 14, 14, 12, 3, mat, g); }
    if (outlet) rbox(w, d / 2 - 8, 4, 18, 16, 14, 2, mat, g);
    const fg = new THREE.Group(); g.add(fg); fg.position.copy(W(0, 0, 4)); const fmat = capMat(); twCaps.push(fmat);
    rbox(T + 1, T + 1, 0, w - 2 * T - 2, d - 2 * T - 2, 1, 3, fmat, fg);
    const ch = h - 8, fr = faceCanvas('front', 4, d, h - 3, w - 8, ch, 5, g);
    return { kind: 'bucket', g, mat, fg, fmat, fr, ch, w, d, h, lab, tap, outlet, key: '', pos: null, from: null, to: null, t0: 0 };
  }
  const B = {
    robo: block(150, 76, 26, 'BOT', 'IP ' + IP), lena: block(150, 76, 26, 'LENA', 'app · Recife'),
    cli: block(150, 110, 26, 'CLIENTS', 'app · site · partner'),
    gw: block(170, 110, 30, 'GW-LOJA', 'global limit'),
    g1: block(170, 66, 22, 'GW-1', 'replica'), g2: block(170, 66, 22, 'GW-2', 'replica'), g3: block(170, 66, 22, 'GW-3', 'replica'),
    cat: block(160, 110, 34, 'CATALOG', 'handles 100/s'), redis: block(160, 70, 24, 'REDIS', 'counter'),
    tb: bucket(170, 95, 56, 'TOKEN BUCKET', true, false), lk: bucket(170, 95, 56, 'LEAKY BUCKET', false, true),
    kl: bucket(150, 80, 44, 'LENA\'S BUCKET', true, false), kr: bucket(150, 80, 44, 'BOT\'S BUCKET', true, false),
  };
  const NAMES = Object.keys(B);
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas (laranja = pedido que passa, vermelho = 429 / descartado)
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const dotBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 48 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 44 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-4.5, -4.5, -4.5, 9, 9, 9, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3;
    const bad = new THREE.Mesh(new THREE.BoxGeometry(9 * TS, 9 * TS, 9 * TS), dotBad); g.add(bad);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow, ok: g.children[0], bad }; });
  let nd = 0;
  function dot(p, tone) { if (nd >= DOTS.length) return; const D = DOTS[nd++], bad = tone === 'bad';
    D.g.visible = true; D.ok.visible = !bad; D.bad.visible = bad; D.g.position.copy(W(...p)); moveGlow(D.glow, p, bad ? 0 : 0.8); }
  function setBeams(list, extra) {
    let n = 0; nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), d = C_.clone().sub(A), len = d.length(); if (len < 1e-6) continue;
        const m = BEAM[n++], th = (b.on ? 5.5 : 3.5) * TS;
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dots) for (const f of b.dots) if (f >= 0 && f <= upto) dot(alongPts(b.pts, cum, f), b.dtone || b.tone);
    }
    for (const p of extra) dot(p, p[3]);
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11)];

  // ── lugares e rotas (no chão, z = 10) ──
  const Z = 10;
  const LAY = {
    token: { robo: [20, 262], lena: [20, 176], tb: [250, 200], cat: [500, 190] },
    leaky: { robo: [20, 262], lena: [20, 176], lk: [250, 200], cat: [500, 190] },
    throttle: { cli: [20, 220], gw: [250, 220], cat: [500, 220] },
    replicas: { robo: [20, 231], g2: [250, 236], cat: [490, 250] },
  };
  const P2 = (...a) => a.map(([x, y]) => [x, y, Z]);
  const GY = [183, 269, 355], CY = [275, 305, 335];
  const R = {
    len: P2([170, 214], [250, 214]), lenB: P2([250, 228], [170, 228]),
    rob: P2([170, 300], [212, 300], [212, 280], [250, 280]), robB: P2([250, 292], [224, 292], [224, 316], [170, 316]),
    out: P2([420, 248], [500, 248]), lout: P2([438, 248], [500, 248]),
    // um balde por chave
    lenK: P2([170, 210], [250, 210]), robK: P2([170, 302], [250, 302]), robKB: P2([250, 316], [170, 316]),
    klOut: P2([400, 210], [460, 210], [460, 225], [500, 225]), krOut: P2([400, 308], [460, 308], [460, 270], [500, 270]),
    // lado a lado
    robT: P2([170, 300], [212, 300], [212, 207], [250, 207]), robL: P2([170, 300], [212, 300], [212, 330], [250, 330]),
    robLB: P2([250, 344], [224, 344], [224, 318], [170, 318]),
    tOut: P2([420, 207], [460, 207], [460, 225], [500, 225]), lOut: P2([438, 330], [470, 330], [470, 270], [500, 270]),
    // throttling
    cg: P2([170, 268], [250, 268]), cgB: P2([250, 284], [170, 284]), gc: P2([420, 275], [500, 275]),
    // réplicas
    one: P2([170, 262], [250, 262]), oneB: P2([250, 280], [170, 280]),
    split: k => P2([170, 262], [204, 262], [204, GY[k] - 6], [250, GY[k] - 6]),
    splitB: k => P2([250, GY[k] + 8], [226, GY[k] + 8], [226, 284], [170, 284]),
    toCat: k => P2([420, GY[k] + 14], [462, GY[k] + 14], [462, CY[k]], [490, CY[k]]),
    toRedis: k => P2([420, GY[k] - 14], [444, GY[k] - 14], [444, 165], [490, 165]),
  };
  // balões: em faixas livres perto de cada peça, nunca em cima do texto dela
  const AT = { robo: [95, 372, 16], lena: [72, 150, 34], cli: [95, 372, 16], tb: [335, 336, 18], lk: [335, 336, 18], cat: [580, 340, 20],
    kl: [325, 150, 64], kr: [325, 380, 16], tbS: [335, 140, 80], lkS: [335, 396, 16], gw: [335, 372, 16], g1: [335, 128, 40], g3: [335, 398, 14],
    catR: [570, 396, 16], redis: [570, 118, 40] };

  // ── conteúdo dos blocos ──
  const rowsOf = (...l) => l;
  const idle = (a, b) => rowsOf([a, 9, 'dim'], [b, 7.4, 'dim']);
  const catRows = (a, b, tone = '') => rowsOf(['GET /produtos/42', 6.8, 'dim'], [a, 11, tone], [b, 7.4, 'dim']);

  // ── o que se vê em cada passo (spec) ──
  function base() {
    const o = { pos: { ...LAY[sc] }, on: {}, rows: {}, bk: {}, beams: [], extra: [], tags: [], msgs: [],
      c: [['PASSED', 0, 'acc'], ['429', 0, 'bad'], ['ARRIVED', 0, 'hi']], cSub: '', g: null, strips: [], req: GET, res: ['…'] };
    o.rows.robo = idle('500 requests/s', GET); o.rows.lena = idle('waiting', 'open the app');
    o.rows.cat = catRows('healthy', 'handles 100/s');
    if (sc === 'token') o.beams.push({ pts: R.rob }, { pts: R.len }, { pts: R.out });
    if (sc === 'leaky') o.beams.push({ pts: R.rob }, { pts: R.len }, { pts: R.lout });
    return o;
  }
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : AT[at]), text, tone]);
  const on = (o, pts, extra = {}) => o.beams.push({ pts, on: true, ...extra });
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  // fluxo contínuo: n pontos espaçados que correm pela viga (vel = voltas por segundo)
  const flow = (o, pts, t, n, vel, tone = '') => o.beams.push({ pts, on: true, tone: tone === 'bad' ? 'bad' : '', dots: Array.from({ length: n }, (_, i) => ((t * vel + i / n) % 1)) });
  // um bolo de pedidos que viaja junto (rajada), com a mensagem real
  function burst(o, t, a, b, pts, n, text, tone = 'acc', hold = 0.4) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { const e = ease(f); o.beams.push({ pts, on: true, tone: tone === 'bad' ? 'bad' : '', dots: f < 1 ? Array.from({ length: n }, (_, i) => e - i * 0.035) : [] });
      if (text) o.msgs.push([pts, e, text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  // gotas da torneira caindo no balde (k = pontos simultâneos)
  function drip(o, nm, t, k = 2, vel = 1.6) { const p = o.pos[nm], Bk = B[nm]; if (!p) return; const top = Bk.h + 32, lv = 4 + (o.bk[nm]?.lvl || 0) * (Bk.h - 8);
    for (let i = 0; i < k; i++) { const f = (t * vel + i / k) % 1; o.extra.push([p[0] + Bk.w / 2, p[1] + Bk.d / 2, PL + top - f * (top - lv), '']); } }
  const C3 = (o, a, b, c) => { o.c[0][1] = a; o.c[1][1] = b; o.c[2][1] = c; };
  const tok = (n, cap, rate) => ({ lvl: n / cap, big: `${Math.round(n)} / ${cap}`, unit: 'tokens', sub: `+${rate}/s` });
  const que = (n, cap) => ({ lvl: n / cap, big: `${Math.round(n)} / ${cap}`, unit: 'in queue', sub: `out ${cap}/s` });
  const strip = (lab, vals, max) => ({ lab, vals, max });

  const STEPS = {
    token: [
      { id: 'cheio', dur: 5, title: 'The bucket: 200 tokens, refills 100 per second',
        story: 'gw-loja puts a token bucket in front of the catalog. The bucket holds up to 200 tokens and a tap drips 100 tokens per second. Each request that gets through spends one token. Before Black Friday starts the bucket is full, and any token that drips in beyond that overflows and is lost.',
        look: 'The tap drips into the bucket, full to the brim: 200 of 200. No request has arrived yet.',
        key: 'Token bucket: the bucket stores the slack for bursts; the tap sets the pace.',
        f(o, t) { const n = 180 + 20 * S(t, 0.3, 1.5); o.bk.tb = tok(n, 200, 100); o.on.tb = 2; drip(o, 'tb', t);
          o.g = ['TOKENS IN THE BUCKET', `${Math.round(n)} / 200`, 'acc', n / 200]; o.req = '(no request yet)'; o.res = ['…'];
          if (t > 1.8) T(o, 'tb', 'bucket full: 200 tokens\nwhat drips in beyond that overflows', 'acc'); } },
      { id: 'rajada', dur: 6, title: 'A burst of 200 at once: it all gets through',
        story: 'Black Friday starts and the competitor\'s bot fires 200 GET /api/v1/produtos/42 requests at once. Each request takes a token: all 200 get through and the bucket goes from 200 to 0. The catalog receives the 200 together. It is a short burst, and the bucket exists precisely to let it through.',
        look: 'The pile of requests leaves the bot and enters the bucket; the level drops to the bottom while the 200 go on to the catalog.',
        key: 'The bucket\'s capacity is the size of the burst that gets through without waiting.',
        f(o, t) { o.on.robo = 1; o.rows.robo = rowsOf(['200 at once', 9, 'acc'], [GET, 7.4]);
          const arr = burst(o, t, 0.4, 1.4, R.rob, 8, '200 × GET /produtos/42', 'hi'), d = S(t, 1.4, 2.6), n = 200 * (1 - d);
          o.bk.tb = tok(n, 200, 100); o.on.tb = arr ? 1 : 2; o.g = ['TOKENS IN THE BUCKET', `${Math.round(n)} / 200`, n < 1 ? 'bad' : 'acc', n / 200];
          if (arr) { C3(o, Math.round(200 * d), 0, 200); o.res = ['HTTP/1.1 200 OK']; }
          if (t > 1.4 && t < 3.0) { flow(o, R.out, t, 6, 1.4); o.on.cat = 1; } else quiet(o, R.out);
          if (t > 2.6) o.rows.cat = catRows('200 at once', 'a single instant', 'acc');
          if (t > 3.0) { T(o, 'tb', 'bucket: 0 tokens\nall 200 got through', 'acc'); T(o, 'cat', 'catalog: 200 together', 'hi'); } } },
      { id: 'ritmo', dur: 7, title: 'Empty bucket: only what drips gets through, 100/s',
        story: 'The bot does not stop: it is 500 requests per second. With the bucket empty, a request only gets through when a token drips in, and the tap drips 100 per second. In 1 second, 500 arrive, 100 get through and 400 come straight back with 429 Too Many Requests. The catalog, which handles 100 per second, receives exactly that.',
        look: 'A thick flow enters the bucket; on the other side a thin, regular thread goes to the catalog, and the rest comes back in red with 429.',
        key: 'After the burst, the throughput is pinned to the refill rate: 100 per second.',
        f(o, t) { const s = S(t, 0.4, 5.4); o.on.robo = 1; o.rows.robo = rowsOf(['500 requests/s', 9, 'acc'], [GET, 7.4]); o.cSub = 'this second';
          o.bk.tb = tok(t > 0.4 ? (t * 7 % 1 < 0.5 ? 1 : 0) : 0, 200, 100); o.on.tb = 1; drip(o, 'tb', t, 2, 2.2);
          C3(o, Math.round(100 * s), Math.round(400 * s), Math.round(500 * s)); o.g = ['TOKENS IN THE BUCKET', '0 / 200 · drips 100/s', 'bad', 0];
          flow(o, R.rob, t, 9, 0.9); if (t > 0.6) { flow(o, R.robB, t, 6, 0.8, 'bad'); flow(o, R.out, t, 2, 0.9); o.on.cat = 1; o.res = R429; }
          o.rows.cat = catRows('100 requests/s', 'at the limit, not degrading', 'acc');
          o.strips = [strip('PASSED EVERY 0.1 s', Array.from({ length: 10 }, (_, i) => s * 10 > i ? 10 : null), 10)];
          if (t > 1.2) o.msgs.push([R.robB, (t * 0.8) % 1, '429 · Retry-After: 1', 'bad']);
          if (t > 5.6) T(o, 'tb', 'in 1 s: 500 arrived\n100 got through · 400 → 429', 'acc'); } },
      { id: 'lena', dur: 7, title: 'Lena gets a 429 too',
        story: 'In the middle of the attack, Lena opens the app in Recife and the app fires 12 requests at once: list, photos, price. They land in the same bucket, empty and contested by the bot\'s 500 per second. Each token that drips in goes to whoever arrives first: of Lena\'s 12, only 2 get through and 10 get a 429. One bucket for everyone punishes whoever did nothing wrong.',
        look: 'Lena\'s 12 requests enter the bucket along with the bot\'s flow; 10 come back red to her.',
        key: 'A global limit protects the catalog, but does not separate the bot from Lena.',
        f(o, t) { o.on.robo = 1; o.rows.robo = rowsOf(['500 requests/s', 9, 'acc'], [GET, 7.4]); o.bk.tb = tok(0, 200, 100); o.on.tb = 1; drip(o, 'tb', t, 2, 2.2);
          o.g = ['TOKENS IN THE BUCKET', '0 / 200 · contested', 'bad', 0]; o.cSub = 'only Lena\'s 12'; o.req = 'GET /api/v1/produtos (Lena\'s app)';
          flow(o, R.rob, t, 7, 0.9); flow(o, R.robB, t, 4, 0.8, 'bad'); flow(o, R.out, t, 2, 0.9); o.on.cat = 1;
          o.on.lena = t > 0.4 ? 1 : 0; o.rows.lena = rowsOf(['12 at once', 9, 'acc'], ['list, photos, price', 7.4]);
          const arr = burst(o, t, 0.5, 1.5, R.len, 6, 'Lena\'s 12 requests', 'hi', 0.1);
          if (arr) { const back = burst(o, t, 1.7, 2.7, R.lenB, 6, '10 × 429', 'bad', 0.6); C3(o, 2, back ? 10 : 0, 12); o.res = R429; o.rows.lena = rowsOf(['10 got a 429', 9, 'bad'], ['only 2 got through', 7.4]); o.on.lena = 'bad'; }
          else quiet(o, R.lenB);
          if (t > 3.2) T(o, 'lena', 'Lena: 2 of 12 got through\n10 got a 429', 'bad'); } },
      { id: 'chave', dur: 6.5, title: 'One bucket per key: Lena gets through whole',
        story: 'The fix is to give each client its own bucket. Lena\'s app comes in with her key (lena-77); the bot, with no key, is counted by IP 203.0.113.7. Each bucket holds 20 tokens and refills 10 per second: the limit of 10 requests per second per key. Lena\'s 12 requests spend 12 of the 20 tokens and all get through; 8 are left.',
        look: 'The big bucket gives way to two smaller ones, one per client. Lena\'s drops from 20 to 8 and the 12 requests go on to the catalog.',
        key: 'Per-client limit: each key has its own bucket, and one does not empty the other\'s.',
        f(o, t) { delete o.pos.tb; o.pos.kl = [250, 170]; o.pos.kr = [250, 268]; o.beams = []; quiet(o, R.robK, R.krOut); o.cSub = 'only Lena\'s 12';
          o.req = 'GET /api/v1/produtos · Authorization: Bearer eyJ… (lena-77)'; o.rows.robo = idle('idle now', 'IP ' + IP);
          o.on.lena = t > 0.6 ? 1 : 0; o.rows.lena = rowsOf(['12 at once', 9, 'acc'], ['key lena-77', 7.4]);
          const arr = burst(o, t, 0.8, 1.8, R.lenK, 6, '12 requests · lena-77', 'hi'), d = S(t, 1.8, 2.6), n = 20 - 12 * d;
          o.bk.kl = tok(n, 20, 10); o.bk.kr = tok(20, 20, 10); o.on.kl = arr ? 1 : 2; o.on.kr = 0; drip(o, 'kr', t, 1, 0.8);
          o.g = ['LENA\'S BUCKET', `${Math.round(n)} / 20 tokens`, 'acc', n / 20];
          if (arr) { C3(o, Math.round(12 * d), 0, 12); o.res = ['HTTP/1.1 200 OK', 'RateLimit-Limit: 10', `RateLimit-Remaining: ${Math.round(n)}`]; }
          if (t > 1.8 && t < 3.2) { flow(o, R.klOut, t, 5, 1.2); o.on.cat = 1; } else quiet(o, R.klOut);
          if (t > 3.2) { T(o, 'kl', 'Lena: 12 of 12 got through\n8 tokens left', 'acc'); T(o, 'kr', 'bot: own bucket, 20 tokens', 'hi'); } } },
      { id: 'robo', dur: 7.5, title: 'What if it goes wrong: the bot goes over the limit and gets a 429',
        story: 'Now the bot, with its 500 requests per second, in its own bucket. The 20 tokens run out in the first 40 ms; from then on one request gets through every 100 ms, when a token drips in. In the first second, 30 get through (the 20 in the bucket plus 10 that dripped in) and 470 come back with 429. From the next second on, 10 per second get through. The response tells the bot when to try again: Retry-After: 1. Lena\'s bucket does not even notice and keeps filling.',
        look: 'The bot\'s bucket empties in a blink; a thin thread goes on to the catalog and the rest comes back red. Lena\'s bucket fills up again.',
        key: 'Whoever goes over the limit gets a 429 with Retry-After; the other clients do not even notice.',
        f(o, t) { delete o.pos.tb; o.pos.kl = [250, 170]; o.pos.kr = [250, 268]; o.beams = []; quiet(o, R.lenK, R.klOut); o.cSub = 'only the bot, in the 1st second'; o.req = GET + ' · IP ' + IP;
          const s = S(t, 0.4, 5.4), arr = 500 * s, pass = Math.min(arr, 20 + 10 * s), n = Math.max(0, Math.min(20, 20 - arr) + (arr >= 20 ? (10 * s - (pass - 20)) : 0));
          o.on.robo = 1; o.rows.robo = rowsOf(['500 requests/s', 9, 'acc'], ['no key: counted by IP', 7.4]); o.rows.lena = idle('already served', 'key lena-77');
          o.bk.kr = tok(n, 20, 10); o.bk.kl = tok(Math.min(20, 8 + 10 * s), 20, 10); o.on.kr = t > 0.4 ? 1 : 0; o.on.kl = 2; drip(o, 'kr', t, 1, 1); drip(o, 'kl', t, 1, 1);
          C3(o, Math.round(pass), Math.round(arr - pass), Math.round(arr)); o.g = ['BOT\'S BUCKET', `${Math.round(n)} / 20 tokens`, n < 1 ? 'bad' : 'acc', n / 20];
          flow(o, R.robK, t, 9, 0.9); if (t > 0.6) { flow(o, R.robKB, t, 6, 0.8, 'bad'); flow(o, R.krOut, t, 1, 0.7); o.on.cat = 1; o.res = R429K; }
          o.strips = [strip('BOT: PASSED EVERY 0.1 s', Array.from({ length: 10 }, (_, i) => s * 10 > i ? (i ? 1 : 21) : null), 21)];
          if (t > 1.2) o.msgs.push([R.robKB, (t * 0.8) % 1, '429 · Retry-After: 1', 'bad']);
          if (t > 5.6) { T(o, 'kr', 'bot: 30 got through, 470 → 429\nthen 10 per second', 'bad'); T(o, 'kl', 'Lena\'s bucket: filling', 'acc'); } } },
    ],
    leaky: [
      { id: 'fila', dur: 5, title: 'A leaky bucket: a queue of 50, leaks 50 per second',
        story: 'Now gw-loja uses a leaky bucket in front of the catalog. It is a queue with room for 50 requests and a hole in the bottom: one request leaves every 20 ms, 50 per second, no more and no less. A request that arrives joins the queue; if the queue is full, it is dropped.',
        look: 'The bucket is empty and the pipe from the hole leads to the catalog. There is no tap: here the requests themselves fill the bucket.',
        key: 'Leaky bucket: the input can come in bursts; the output always has the same pace.',
        f(o, t) { o.bk.lk = que(0, 50); o.on.lk = 2; o.g = ['IN QUEUE', '0 / 50 · 1 leaves every 20 ms', 'hi', 0]; o.req = '(no request yet)'; o.c[1][0] = 'DROPPED';
          o.rows.robo = idle('waiting', 'IP ' + IP);
          if (t > 1.6) T(o, 'lk', 'queue: 50 slots\noutput: 50/s, one every 20 ms', 'acc'); } },
      { id: 'lena', dur: 6.5, title: 'Lena\'s 12 go in and come out one by one',
        story: 'Lena opens the app and 12 requests arrive at once. They all fit in the queue (12 of 50), but the hole does not speed up: one leaves every 20 ms. The 12th leaves 240 ms after it arrived. Nobody was refused; the one who waited was Lena.',
        look: 'The level jumps to 12 at once and drops in equal steps, while the requests leave through the pipe in single file.',
        key: 'The burst does not vanish: it becomes waiting time in the queue.',
        f(o, t) { o.c[1][0] = 'DROPPED'; o.rows.robo = idle('waiting', 'IP ' + IP); o.req = 'GET /api/v1/produtos (Lena\'s app)';
          o.on.lena = t > 0.3 ? 1 : 0; o.rows.lena = rowsOf(['12 at once', 9, 'acc'], ['list, photos, price', 7.4]);
          const arr = burst(o, t, 0.4, 1.3, R.len, 6, 'Lena\'s 12 requests', 'hi', 0.1), s = S(t, 1.5, 5.1), out = arr ? Math.min(12, Math.floor(s * 12 + 1e-6)) : 0, q = arr ? 12 - out : 0;
          o.bk.lk = que(q, 50); o.on.lk = arr ? 1 : 2; o.g = ['IN QUEUE', `${q} / 50`, 'acc', q / 50]; o.cSub = 'only Lena\'s 12';
          if (arr) { C3(o, out, 0, 12); o.res = ['HTTP/1.1 200 OK', `(request ${Math.max(1, out)} waited ${Math.max(1, out) * 20} ms in the queue)`]; }
          if (arr && out < 12) { o.beams = o.beams.filter(b => b.pts !== R.lout); o.beams.push({ pts: R.lout, on: true, dots: [((s * 12) % 1)] }); o.on.cat = 1; }
          o.strips = [strip('OUTPUT EVERY 20 ms', Array.from({ length: 12 }, (_, i) => out > i ? 1 : null), 1)];
          if (t > 5.2) T(o, 'lk', '12 requests, one every 20 ms\nthe 12th left 240 ms later', 'acc'); } },
      { id: 'rajada', dur: 7, title: 'Burst of 200: 50 get in, 150 are dropped',
        story: 'Now comes the bot with 200 requests at once. The queue has 50 places: the first 50 get in and the other 150 are dropped on the spot, with 429. The 50 leave at the usual pace, one every 20 ms, and the last one reaches the catalog 1 s later.',
        look: 'The bucket fills to the brim in an instant and the excess comes back red; through the pipe, the output keeps the same pace.',
        key: 'A full queue means drops. The size of the queue is the longest delay you accept.',
        f(o, t) { o.c[1][0] = 'DROPPED'; o.on.robo = 1; o.rows.robo = rowsOf(['200 at once', 9, 'acc'], [GET, 7.4]);
          const arr = burst(o, t, 0.4, 1.3, R.rob, 8, '200 × GET /produtos/42', 'hi', 0.1), s = S(t, 1.6, 6.0), out = arr ? Math.floor(s * 50 + 1e-6) : 0, q = arr ? 50 - out : 0;
          o.bk.lk = que(q, 50); o.on.lk = arr ? 1 : 2; o.g = ['IN QUEUE', `${q} / 50`, q >= 50 ? 'bad' : 'acc', q / 50];
          if (arr) { burst(o, t, 1.4, 2.4, R.robB, 7, '150 dropped · 429', 'bad', 0.8); C3(o, out, 150, 200); o.res = R429; o.rows.robo = rowsOf(['150 got a 429', 9, 'bad'], ['50 in the queue', 7.4]); }
          else quiet(o, R.robB);
          if (arr && out < 50) { o.beams = o.beams.filter(b => b.pts !== R.lout); flow(o, R.lout, s * 50, 3, 1 / 3); o.on.cat = 1; }
          o.strips = [strip('OUTPUT EVERY 0.1 s', Array.from({ length: 10 }, (_, i) => s * 10 > i ? 5 : null), 5)];
          if (t > 6.1) T(o, 'lk', '50 left in 1 s\n150 dropped on arrival', 'acc'); } },
      { id: 'lado', dur: 7.5, title: 'Side by side: the same burst in both buckets',
        story: 'The same burst of 200 from the bot, in both buckets at the same time. In the token bucket with 200 tokens, all 200 get through at once and the catalog receives the whole peak. In the leaky bucket with a queue of 50, 50 get in and leave over 1 s, and 150 are dropped. One lets the burst through; the other smooths it.',
        look: 'In the back, the token bucket empties at once; in the front, the queue fills and drips through the pipe. The display compares the output of each one every 0.1 s.',
        key: 'Token bucket accepts bursts up to its capacity; leaky bucket delivers a smooth output.',
        f(o, t) { o.pos.tb = [250, 160]; o.pos.lk = [250, 282]; o.beams = []; o.on.robo = 1; o.rows.robo = rowsOf(['200 at once', 9, 'acc'], ['in both buckets', 7.4]);
          o.c = [['TOKEN', 0, 'acc'], ['LEAKY', 0, 'acc'], ['DROPPED', 0, 'bad']]; o.cSub = 'got through, from the burst of 200';
          const a1 = burst(o, t, 0.4, 1.3, R.robT, 6, '200 × GET', 'hi', 0.1), a2 = burst(o, t, 0.4, 1.3, R.robL, 6, null, 'hi', 0.1);
          const d = S(t, 1.4, 2.2), n = a1 ? 200 * (1 - d) : 200, s = S(t, 1.6, 6.0), out = a2 ? Math.floor(s * 50 + 1e-6) : 0, q = a2 ? 50 - out : 0;
          o.bk.tb = tok(n, 200, 100); o.bk.lk = que(q, 50); o.on.tb = a1 ? 1 : 2; o.on.lk = a2 ? 1 : 2;
          if (a1 && t < 2.6) { flow(o, R.tOut, t, 6, 1.4); o.on.cat = 1; } else quiet(o, R.tOut);
          if (a2 && out < 50) { flow(o, R.lOut, s * 50, 3, 1 / 3); o.on.cat = 1; } else quiet(o, R.lOut);
          if (a2) { burst(o, t, 1.4, 2.4, R.robLB, 6, '150 dropped', 'bad', 0.6); C3(o, Math.round(200 * d), out, 150); o.res = ['token: HTTP/1.1 200 OK × 200', 'leaky: 200 OK × 50 (with waiting)', 'leaky: 429 × 150']; }
          else quiet(o, R.robLB);
          o.strips = [strip('TOKEN', Array.from({ length: 10 }, (_, i) => s * 10 > i ? (i ? 0 : 200) : null), 200), strip('LEAKY', Array.from({ length: 10 }, (_, i) => s * 10 > i ? 5 : null), 200)];
          if (t > 2.8) T(o, 'tbS', 'token: all 200 at once', 'acc');
          if (t > 6.1) T(o, 'lkS', 'leaky: 5 every 0.1 s · 150 dropped', 'acc'); } },
      { id: 'cheia', dur: 7.5, title: 'What if it goes wrong: a full queue blocks Lena',
        story: 'The bot is back with 500 requests per second, non-stop. The queue is always full: every 20 ms one leaves and the bot\'s next request takes its place. When Lena\'s 12 arrive, there is no room, and all 12 are dropped. And whoever manages to get in waits 1 s in the queue, because there are 50 ahead leaving at 50 per second.',
        look: 'The bucket stays full to the brim the whole time; Lena\'s requests hit the edge and come back red.',
        key: 'One queue for everyone does not separate clients either, and it adds waiting time.',
        f(o, t) { o.c[1][0] = 'DROPPED'; o.cSub = 'only Lena\'s 12'; o.on.robo = 1; o.rows.robo = rowsOf(['500 requests/s', 9, 'acc'], ['the queue never empties', 7.4]);
          o.bk.lk = que(50, 50); o.on.lk = 'bad'; o.g = ['IN QUEUE', '50 / 50 · wait 1 s', 'bad', 1]; o.req = 'GET /api/v1/produtos (Lena\'s app)';
          o.beams = o.beams.filter(b => b.pts !== R.rob && b.pts !== R.len && b.pts !== R.lout);
          flow(o, R.rob, t, 9, 0.9); flow(o, R.robB, t, 5, 0.8, 'bad'); flow(o, R.lout, t, 3, 0.9); o.on.cat = 1;
          o.on.lena = t > 0.8 ? 1 : 0; o.rows.lena = rowsOf(['12 at once', 9, 'acc'], ['list, photos, price', 7.4]);
          const arr = burst(o, t, 1.0, 2.0, R.len, 6, 'Lena\'s 12 requests', 'hi', 0.1);
          if (arr) { const back = burst(o, t, 2.1, 3.1, R.lenB, 6, '12 × 429 · queue full', 'bad', 0.8); C3(o, 0, back ? 12 : 0, 12); o.res = R429; o.on.lena = 'bad'; o.rows.lena = rowsOf(['12 dropped', 9, 'bad'], ['the queue was full', 7.4]); }
          else quiet(o, R.lenB);
          if (t > 3.6) { T(o, 'lena', 'Lena: 12 of 12 dropped', 'bad'); T(o, 'lk', 'queue full all the time\nwhoever gets in waits 1 s', 'bad'); } } },
    ],
    throttle: [
      { id: 'normal', dur: 5.5, title: 'Global limit of 100/s, catalog healthy',
        story: 'Adding up app, site and partner, 100 requests per second reach the catalog. gw-loja has a global limit of 100 per second, which is what the catalog handles without degrading. Everything gets through and the responses come back fast.',
        look: 'A regular flow crosses the gateway to the catalog. On the display: limit 100/s, normal response time.',
        key: 'Fixed rate limit: a ceiling chosen beforehand, which does not look at the state of the service.',
        f(o, t) { thr(o, t, { lim: 100, lat: 'normal', inflight: '' }); if (t > 1.6) T(o, 'gw', 'global limit: 100/s', 'acc'); } },
      { id: 'lento', dur: 6, title: 'The catalog starts answering in 2 s',
        story: 'The catalog\'s database gets slow and each response starts taking 2 s. The limit stays at 100 per second, so the gateway keeps sending 100 new requests every second while the earlier ones are still waiting. With 2 s per response, that makes 200 requests in flight at the same time inside the catalog.',
        look: 'The catalog\'s response time climbs to 2 s and the number of requests in flight grows to 200.',
        key: 'A slow service with the same input piles up requests: 100/s × 2 s = 200 in flight.',
        f(o, t) { const s = S(t, 0.4, 3.4); thr(o, t, { lim: 100, lat: s < 0.15 ? 'normal' : `${(2 * s).toFixed(1).replace('.0', '')} s`, inflight: s < 0.15 ? '' : Math.round(200 * s), bad: s > 0.5 });
          if (t > 3.6) T(o, 'catR', '2 s per response\n200 requests in flight', 'bad'); } },
      { id: 'reduz', dur: 6.5, title: 'Throttling: the gateway lowers the limit to 50/s',
        story: 'The gateway measures the catalog\'s response time and reacts: it lowers the global limit from 100 to 50 requests per second. Of the 100 that arrive every second, 50 get through and 50 come straight back with 429 and Retry-After: 1. With half the load, the catalog catches its breath and the response time starts to fall.',
        look: 'The limit in the gateway drops to 50/s, half of the flow comes back red and the catalog\'s response time falls.',
        key: 'Throttling is reactive: the limit changes with the health of the service.',
        f(o, t) { const s = S(t, 1.0, 5.0), lat = 2 * (1 - s); thr(o, t, { lim: 50, lat: lat > 0.25 ? `${lat.toFixed(1).replace('.0', '')} s` : 'normal', inflight: lat > 0.25 ? Math.round(50 * lat) : '', rej: true, bad: lat > 1.2 });
          if (t > 0.6) T(o, 'gw', 'throttling: limit 100 → 50/s', 'acc'); if (t > 4.6) T(o, 'catR', 'catalog catching its breath\n50/s, time falling', 'acc'); } },
      { id: 'volta', dur: 5.5, title: 'The time returns to normal and the limit goes back to 100/s',
        story: 'When the response time is back to normal, the gateway gives the limit back, to 100 per second. The 429s stop and everyone gets through again.',
        look: 'The limit in the gateway rises back to 100/s and the red flow disappears.',
        key: 'The low limit is temporary: it lasts as long as the service needs it.',
        f(o, t) { const up = t > 1.2; thr(o, t, { lim: up ? 100 : 50, lat: 'normal', inflight: '', rej: !up }); if (t > 1.6) T(o, 'gw', 'limit back: 100/s', 'acc'); } },
      { id: 'sem', dur: 7.5, title: 'What if it goes wrong: without throttling, the pile only grows',
        story: 'Go back to the moment the catalog got slow, now without throttling. The gateway keeps sending 100 per second and, at 2 s per response, that is already 200 requests in flight. The apps give up waiting and try again, and every new attempt is one more request on the pile. The response time goes up even more, the pile goes past 200 and the catalog goes down: now nobody is served, not even the 100 per second it used to handle.',
        look: 'The flow stays full, the number in flight goes past 200 and the catalog goes dark with an X.',
        key: 'Without reducing the input, a slow service becomes a service that is down.',
        f(o, t) { const s = S(t, 0.4, 4.6), down = t > 4.8;
          thr(o, t, { lim: 100, lat: down ? 'no response' : s < 0.4 ? '2 s' : 'over 2 s', inflight: down ? '—' : s < 0.4 ? 200 : 'over 200', bad: true, down, retry: s > 0.3 && !down });
          if (t > 2.4 && !down) T(o, 'cli', 'the apps retry', 'bad');
          if (down) T(o, 'catR', 'catalog down\n503 for everyone', 'bad'); } },
    ],
    replicas: [
      { id: 'uma', dur: 6, title: 'One gateway: the bot gets 10 per second',
        story: 'With a single gateway, the limit of 10 requests per second per key is a counter in its memory, reset every second. The bot (IP 203.0.113.7) sends 500 in 1 s: the counter climbs to 10, and from the 11th on every request comes back with 429.',
        look: 'The bot\'s flow enters the gateway; the counter climbs to 10/10, a thin thread goes on to the catalog and the rest comes back red.',
        key: 'A local counter works as long as there is only one gateway.',
        f(o, t) { const s = S(t, 0.4, 5.0); rep(o, t, s, [1], false); o.rows.g2 = gwRows(Math.min(10, Math.round(500 * s)), 'local');
          if (t > 5.2) T(o, 'catR', 'bot: 10 got through in 1 s', 'acc'); } },
      { id: 'tres', dur: 7, title: '3 replicas, 3 counters: 30 get through',
        story: 'The store brings up 3 gateway replicas, behind a balancer. Each replica counts only what went through it. The bot is still at 500 per second, spread out: about 167 on each. Each counter lets 10 through, and in total 30 per second get through, triple the limit. It is the same problem as module 5\'s local cache: each replica with its own copy.',
        look: 'The flow splits in three; each gateway reaches 10/10 and lets its own thread through. Three threads arrive at the catalog.',
        key: 'Local counter on N replicas: the limit becomes N times the limit.',
        f(o, t) { const s = S(t, 0.4, 5.6); rep(o, t, s, [0, 1, 2], false); ['g1', 'g2', 'g3'].forEach(nm => o.rows[nm] = gwRows(Math.min(10, Math.round(167 * s)), 'local'));
          if (t > 5.8) T(o, 'catR', 'bot: 30 got through in 1 s\n3 × 10, triple the limit', 'bad'); } },
      { id: 'redis', dur: 7, title: 'One counter in Redis: 10 again',
        story: 'The way out is a shared counter. On each request, the replica runs INCR on a Redis key, per IP and per second, and looks at the result: up to 10, it passes; from 11 on, 429. The 3 replicas add to the same number, and the bot is back to getting only 10 per second, whichever replica it comes through.',
        look: 'Redis appears at the back; the three replicas talk to it and the single counter climbs to 10. Only one thread goes on to the catalog.',
        key: 'Shared counter: the limit applies to the client, not to each replica.',
        f(o, t) { const s = S(t, 0.4, 5.6); rep(o, t, s, [0, 1, 2], true); const n = Math.round(500 * s);
          ['g1', 'g2', 'g3'].forEach(nm => o.rows[nm] = rowsOf(['asks Redis', 9, 'acc'], ['shared counter', 7.4]));
          o.rows.redis = rowsOf([`rl:${IP}`, 9, 'acc'], [`counter: ${n}`, 7.4, n > 10 ? 'bad' : '']); o.on.redis = t > 0.4 ? 1 : 0;
          o.req = `INCR rl:${IP}:<second>`; o.res = n > 10 ? [`(integer) ${n}`, '> 10 → 429', ...R429K.slice(0, 1)] : [`(integer) ${Math.max(1, n)}`, '≤ 10 → passes'];
          if (t > 5.8) T(o, 'redis', 'one counter for all 3\nbot: 10 in 1 s', 'acc'); } },
      { id: 'sync', dur: 6.5, title: 'Eventual consistency: a few extra get through',
        story: 'Going to Redis on every request costs a round trip over the network. To save that, some implementations have the replica gather the count and send it to Redis from time to time. Between one sync and the next, each replica decides with a slightly old number, and a few extra get through: in the example, 12 instead of 10. For a protection limit, that is almost always acceptable.',
        look: 'The replicas talk to Redis in pulses, not on every request; the counter reaches 12 before everyone knows it went past 10.',
        key: 'Shared counter with sync: a little imprecise, much cheaper.',
        f(o, t) { const s = S(t, 0.4, 5.6); rep(o, t, s, [0, 1, 2], true, 12); ['g1', 'g2', 'g3'].forEach(nm => o.rows[nm] = rowsOf(['counts and syncs', 9, 'acc'], ['from time to time', 7.4]));
          o.rows.redis = rowsOf([`rl:${IP}`, 9, 'acc'], [`counter: ${Math.min(12, Math.round(12 * s * 1.4))}`, 7.4]); o.on.redis = (t * 1.5 % 1) < 0.3 ? 1 : 2; o.cSub = 'example: 12 instead of 10';
          o.req = `INCRBY rl:${IP}:<second> 4  (batch)`; o.res = ['(integer) 12', '2 extra got through'];
          if (t > 5.8) T(o, 'redis', 'example: 12 got through\nlimit 10, syncs in pulses', 'hi'); } },
      { id: 'cai', dur: 7.5, title: 'What if it goes wrong: Redis goes down',
        story: 'Now Redis goes down. Without the counter, each replica has to choose: refuse everything or let everything through. Kong\'s default (fault_tolerant: true) is to let it through, with the limit off until Redis is back. The bot\'s 500 requests per second reach the catalog whole, and it handles 100.',
        look: 'Redis goes dark with an X; the red flow of 429s disappears and three thick threads reach the catalog, which turns red.',
        key: 'When the counter goes down, the limit goes down with it: decide beforehand whether the gateway opens or closes.',
        f(o, t) { const s = S(t, 1.0, 5.6); rep(o, t, s, [0, 1, 2], true, 500); o.on.redis = 'bad'; o.rows.redis = rowsOf(['DOWN', 11, 'bad'], ['connection refused', 7.4, 'dim']);
          ['g1', 'g2', 'g3'].forEach(nm => o.rows[nm] = rowsOf(['no counter', 9, 'bad'], ['fault_tolerant: lets through', 7.4]));
          o.req = GET + ' · IP ' + IP; o.res = ['HTTP/1.1 200 OK', '(no limit: Redis is down)']; o.on.cat = 'bad'; o.rows.cat = catRows(`${Math.round(500 * s)} requests/s`, 'handles 100/s', 'bad');
          if (t > 5.8) T(o, 'catR', 'catalog: 500/s arriving\nhandles 100/s', 'bad'); } },
    ],
  };
  // throttling: cena comum aos passos (clientes → gateway → catálogo), com limite, tempo de resposta e pedidos em andamento
  function thr(o, t, { lim, lat, inflight, rej, bad, down, retry }) {
    o.c = [['THROUGH /s', down ? 0 : lim, 'acc'], ['429 /s', rej ? 100 - lim : 0, 'bad'], ['ARRIVING /s', retry ? '100+' : 100, 'hi']];
    o.cSub = retry ? 'plus the new retries' : '';
    o.g = ['RESPONSE TIME', lat, bad ? 'bad' : 'acc', null];
    o.on.cli = 1; o.on.gw = rej ? 1 : 2; o.on.cat = down ? 'bad' : bad ? 'bad' : 1;
    o.rows.cli = rowsOf(['100 requests/s', 9, 'acc'], [retry ? '+ retries' : 'app, site, partner', 7.4, retry ? 'bad' : '']);
    o.rows.gw = rowsOf(['global limit', 6.8, 'dim'], [`${lim} requests/s`, 11, rej ? 'acc' : ''], [rej ? `excess: 429` : 'all pass', 7.4, rej ? 'bad' : '']);
    o.rows.cat = down ? rowsOf(['DOWN', 11, 'bad'], ['503 for everyone', 7.4, 'dim']) : rowsOf(['response: ' + lat, 9, bad ? 'bad' : 'acc'], [inflight !== '' ? `in flight: ${inflight}` : 'healthy', 7.4, bad ? 'bad' : '']);
    o.down = down;
    flow(o, R.cg, t, retry ? 9 : 6, 0.9); if (rej) flow(o, R.cgB, t, 3, 0.8, 'bad'); else quiet(o, R.cgB);
    if (down) o.beams.push({ pts: R.gc, on: true, tone: 'bad', cut: 0.55 }); else flow(o, R.gc, t, lim === 100 ? 6 : 3, 0.9);
    o.req = GET; o.res = down ? ['HTTP/1.1 503 Service Unavailable'] : rej ? R429 : ['HTTP/1.1 200 OK', lat === 'normal' ? '' : `(after ${lat})`].filter(Boolean);
    if (rej) o.msgs.push([R.cgB, (t * 0.8) % 1, '429 · Retry-After: 1', 'bad']);
  }
  // réplicas: robô → (balanceador) → gateways → catálogo; ks = réplicas ativas; pass = quantos passam em 1 s
  const gwRows = (n, how) => rowsOf([`bot: ${n} / 10`, 9, n >= 10 ? 'bad' : 'acc'], [`counter ${how}`, 7.4]);
  function rep(o, t, s, ks, shared, total) {
    const all = ks.length === 3; if (all) { o.pos.g1 = [250, 150]; o.pos.g3 = [250, 322]; }
    if (shared) o.pos.redis = [490, 130];
    const pass = total || (shared ? 10 : 10 * ks.length), open = total === 500;
    o.on.robo = 1; o.rows.robo = rowsOf(['500 requests/s', 9, 'acc'], ['IP ' + IP, 7.4]); o.cSub = 'only the bot, in 1 s';
    C3(o, Math.round(pass * Math.min(1, s * (open ? 1 : 3))), open ? 0 : Math.round(500 * s - pass * Math.min(1, s * 3)), Math.round(500 * s));
    o.g = ['LIMIT PER KEY', open ? 'off' : '10 requests/s', open ? 'bad' : 'acc', null];
    ks.forEach(k => { const nm = ['g1', 'g2', 'g3'][k]; o.on[nm] = 1;
      const inn = all ? R.split(k) : R.one, back = all ? R.splitB(k) : R.oneB;
      flow(o, inn, t + k * 0.13, all ? 4 : 8, 0.9);
      if (!open) flow(o, back, t + k * 0.2, all ? 2 : 5, 0.8, 'bad'); else quiet(o, back);
      flow(o, R.toCat(all ? k : 1), t + k * 0.3, open ? 4 : shared && k ? 0 : 1, open ? 1.1 : 0.6);
      if (shared) { if (open) o.beams.push({ pts: R.toRedis(k), on: true, tone: 'bad', cut: 0.5 }); else flow(o, R.toRedis(k), t + k * 0.33, total ? ((t * 1.5 % 1) < 0.3 ? 1 : 0) : 1, 1.1); } });
    o.on.cat = open ? 'bad' : 1; o.rows.cat = catRows(`bot: ${pass}/s`, 'handles 100/s', open ? 'bad' : pass > 10 ? 'bad' : 'acc');
    o.req = GET + ' · IP ' + IP; o.res = open ? ['HTTP/1.1 200 OK'] : R429K;
    if (!open && t > 1.0) o.msgs.push([all ? R.splitB(1) : R.oneB, (t * 0.8) % 1, '429', 'bad']);
  }
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
  function drawBlock(Bk, rows, on, nm) {
    const key = JSON.stringify([rows, on]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
      const tot = rows.reduce((a, r) => a + Math.max(r[1], 8.2) * 1.25 * 1.45, 0); let y = Math.max(4, (H_ - tot) / 2); x.textAlign = 'left';
      for (const r of rows) { const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.45; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      cv.tex.needsUpdate = true; }
    const fk = Bk.lab + Bk.sub + on + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(6.6, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi; x.font = `700 ${u(big)}px ${MONO3}`; x.fillText(Bk.lab, u(3), u(mid));
      const lw = x.measureText(Bk.lab).width / P; x.fillStyle = INK(); fitFont(x, u, Bk.sub, small, Bk.w - 14 - lw); x.fillText(Bk.sub, u(8 + lw), u(mid));
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  function drawBucket(Bk, d, on) {
    d = d || { lvl: 0, big: '', unit: '', sub: '' }; const lvl = clamp(d.lvl);
    Bk.fg.visible = lvl > 0.004; Bk.fg.scale.y = Math.max(0.01, lvl * (Bk.h - 8));
    Bk.fmat.emissiveIntensity = on === 'bad' ? 0.35 : 0.75; Bk.fmat.emissive.set(on === 'bad' ? 0xff5a4a : accent);
    Bk.mat.emissiveIntensity = on === 1 ? 0.35 : 0;
    const key = JSON.stringify([d.big, d.unit, d.sub, Math.round(lvl * 40), on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(), W_ = Bk.w - 8, H_ = Bk.ch, bad = on === 'bad';
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle';
    x.strokeStyle = bad ? BAD() : on === 1 ? accC() : C.line; x.lineWidth = u(on === 1 || bad ? 1.1 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    const k = H_ / 48, y1 = 9 * k, y2 = 24 * k, yb = 37 * k;
    x.textAlign = 'left'; x.fillStyle = on === 1 ? accC() : C.inkHi; fitFont(x, u, Bk.lab, 10.5 * Math.min(1, k * 1.1), W_ - 50); x.fillText(Bk.lab, u(5), u(y1));
    x.textAlign = 'right'; x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(d.sub, u(W_ - 5), u(y1));
    x.textAlign = 'left'; x.fillStyle = bad ? BAD() : lvl < 0.004 && d.unit === 'tokens' ? BAD() : accC(); x.font = `700 ${u(14 * Math.min(1, k * 1.15))}px ${MONO3}`; x.fillText(d.big, u(5), u(y2));
    const bw = x.measureText(d.big).width / P; x.fillStyle = INK(); x.font = `700 ${u(9)}px ${MONO3}`; x.fillText(d.unit, u(10 + bw), u(y2 + 0.5));
    x.fillStyle = C.line; x.fillRect(u(5), u(yb), u(W_ - 10), u(5 * k)); x.fillStyle = bad ? BAD() : accC(); x.fillRect(u(5), u(yb), u((W_ - 10) * lvl), u(5 * k));
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.c, o.cSub, o.g, o.strips, o.req, o.res, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 76) => { x.fillStyle = INK(); fitFont(x, u, t, 7.8, mw); x.fillText(t, u(X), u(Y)); };
    o.c.forEach(([lab, v, tn], i) => { const X = 8 + i * 82; lbl(lab, X, 9); x.fillStyle = tn === 'bad' && v ? BAD() : tn === 'acc' ? acc : C.inkHi; fitFont(x, u, String(v), 22, 76); x.fillText(String(v), u(X), u(28)); });
    if (o.cSub) { x.fillStyle = INK(); fitFont(x, u, o.cSub, 7.6, 240); x.fillText(o.cSub, u(8), u(43)); }
    if (o.g) { const [lab, val, tn, r] = o.g; lbl(lab, 8, 55, 240); x.fillStyle = tn === 'bad' ? BAD() : tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 15, r != null ? 150 : 240); x.fillText(val, u(8), u(70));
      if (r != null) { x.fillStyle = C.line; x.fillRect(u(170), u(66), u(76), u(7)); x.fillStyle = tn === 'bad' ? BAD() : acc; x.fillRect(u(170), u(66), u(76 * clamp(r)), u(7)); } }
    const two = o.strips.length > 1;
    o.strips.forEach((st, j) => { const n = st.vals.length, X0 = two ? 50 : 8, bw = (246 - X0) / n, Y = two ? 82 + j * 14 : 91, hh = two ? 12 : 15;
      if (two) { x.fillStyle = INK(); fitFont(x, u, st.lab, 7.4, 40); x.fillText(st.lab, u(8), u(Y + hh / 2)); } else lbl(st.lab, 8, 84, 240);
      st.vals.forEach((v, i) => { const X = X0 + i * bw; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(X), u(Y), u(bw - 2), u(hh));
        if (v == null) return; const f = v ? Math.max(0.25, Math.sqrt(v / st.max)) : 0; x.fillStyle = acc; x.globalAlpha = 1; if (f) x.fillRect(u(X + 0.7), u(Y + hh * (1 - f) + 0.7), u(bw - 3.4), u(hh * f - 1.4));
        x.fillStyle = f > 0.6 ? (theme === 'light' ? '#ffffff' : '#141516') : C.inkHi; x.textAlign = 'center'; fitFont(x, u, String(v), 7.4, bw - 3); x.fillText(String(v), u(X + bw / 2 - 1), u(Y + hh / 2 + 0.4)); x.textAlign = 'left'; }); });
    const L0 = 262; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(106)); x.stroke();
    lbl('REQUEST · ' + SCNAME[sc].toUpperCase(), L0, 9, 190); x.fillStyle = C.inkHi; fitFont(x, u, o.req, 8.6, 190); x.fillText(o.req, u(L0), u(22));
    lbl('RESPONSE', L0, 37, 190);
    o.res.slice(0, 5).forEach((l, i) => { x.fillStyle = i === 0 ? (/\b(429|503)\b/.test(l) ? BAD() : /200|integer/.test(l) ? acc : C.inkHi) : C.inkHi; fitFont(x, u, l, 8.6, 190); x.fillText(l, u(L0), u(50 + i * 12.5)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">IP 203.0.113.7 is a documentation address (RFC 5737); the lena-77 key and the numbers are the module\'s example.</li>';
  const DATA = {
    token: () => `<li>Global bucket: <b>200 tokens</b>, refill <b>100/s</b>; each request spends 1 token</li><li>Burst of 200: gets through whole; after that, at most <b>100/s</b></li>
      <li>Bot at 500/s with an empty bucket: <b>100 get through, 400 get a 429</b> per second; of Lena\'s 12, 2 get through</li>
      <li>Per key: <b>20 tokens, 10/s</b>. Lena, 12 at once: all 12 get through, 8 left. Bot: in the 1st second 20 + 10 = <b>30</b> get through and 470 get a 429; after that, 10/s</li>
      <li><b>429 Too Many Requests</b> (RFC 6585) with <b>Retry-After: 1</b> (RFC 9110). RateLimit-Limit and RateLimit-Remaining come from an IETF draft; Kong sends those and the X-RateLimit-* ones.</li>${EX}`,
    leaky: () => `<li>Queue of <b>50</b>, output of <b>50/s</b>: one request every <b>20 ms</b></li><li>Lena, 12 at once: all get in; the 12th leaves <b>240 ms</b> later</li>
      <li>Bot, 200 at once: 50 get in and <b>150 are dropped</b>; the 50 leave over 1 s</li><li>Same burst in the token bucket (200 / 100/s): all 200 get through at once</li>
      <li>Full queue: whoever gets in waits 50 ÷ 50/s = <b>1 s</b>; whoever does not fit is dropped</li>
      <li>The article describes the leaky bucket as a bucket "the size of the refill rate"; what defines it is the queue that leaks at a constant pace (the classic networking definition).</li>
      <li>In NGINX, <b>limit_req</b> follows the leaky bucket (rate=50r/s burst=50); a dropped request returns 503 by default, or 429 with limit_req_status 429.</li>${EX}`,
    throttle: () => `<li>The catalog handles <b>100/s</b> without degrading; normal global limit: 100/s</li><li>Slow catalog (<b>2 s</b> per response) receiving 100/s: 100 × 2 = <b>200 requests in flight</b></li>
      <li>Throttling: the limit drops to <b>50/s</b>; of the 100 per second, 50 get a 429 with Retry-After: 1</li><li>Normal time again: the limit goes back to 100/s</li>
      <li>Without throttling: the retries add to the requests that are waiting, and the catalog goes down (503 for everyone)</li>`,
    replicas: () => `<table class="h3-sum"><tr><th>counter</th><th>replicas</th><th>bot gets through</th></tr><tr><td>local</td><td>1</td><td>10/s</td></tr><tr${step === 1 ? ' class="on"' : ''}><td>local</td><td>3</td><td>30/s</td></tr><tr${step >= 2 ? ' class="on"' : ''}><td>Redis</td><td>3</td><td>10/s</td></tr></table>
      <li>Kong, <b>rate-limiting</b> plugin with <b>second: 10</b>: <b>policy: local</b> counts in each node\'s memory; <b>policy: redis</b> counts in a shared Redis</li>
      <li>In Redis, one counter per IP per second: INCR and expire in 1 s; past 10, 429</li>
      <li><b>fault_tolerant: true</b> (the Kong default): with Redis out, requests go through and the limit stays off until it is back</li>${EX}`,
  };
  function countHtml() { const o = SP || spec(), [a, b, c] = o.c;
    return `<b>${a[1]}</b><span>${a[0].toLowerCase()}</span><i>· ${b[0].toLowerCase()}: ${b[1]} · ${c[0].toLowerCase()}: ${c[1]}${o.cSub ? ' (' + o.cSub + ')' : ''}</i>`; }
  const resHtml = o => `<b>Real request and response</b>${[o.req, ...o.res.map(l => '→ ' + l)].join('\n').replace(/</g, '&lt;')}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="l3count">${countHtml()}</div>
      <div class="i3-sql" id="l3res">${resHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'limite') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.c.map(c => `${c[0].toLowerCase()} ${c[1]}`).join(' / ')}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'limite' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-limite3d-sc', v); } catch (e) {} backLink(); NAMES.forEach(nm => { B[nm].pos = null; }); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'limite') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
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
      if (Bk.kind === 'bucket') drawBucket(Bk, o.bk[nm], o.on[nm] || 0); else drawBlock(Bk, o.rows[nm] || [], o.on[nm] || 0, nm); });
    setBeams(o.beams, o.extra); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 34); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('l3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.getElementById('l3res'), sh = resHtml(SP); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-10, 680, 8, 400];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.78 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.47 : nar ? 0.49 : side + aW / 2, fy = POSTER ? 0.43 : nar ? 0.07 + aH * 0.6 : 0.52;
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => B[nm].kind === 'bucket' ? [B[nm].fr] : [B[nm].top, B[nm].fr]), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); dotBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 200, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 200, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
