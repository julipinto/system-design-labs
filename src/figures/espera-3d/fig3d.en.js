// Figura 3D (iso-glow): esperar o aviso. Uma régua de tempo de 14:05:00 a 14:05:30, o Pix do pedido 1050 do Davi (28.90).
// Três trilhos ao longo da régua: o PSP ao fundo, a loja no meio (com o gw-loja na frente dela) e a tela do Davi na frente.
// Cada requisição é um degrau que sobe da tela até a loja e volta; o que fica aberto (long polling, WebSocket) é uma barra
// que cresce no tempo. O pagamento é a linha em 14:05:23.4 e o cursor marca o relógio. Ao fundo, o mostrador com os contadores.
// No WebSocket a tela vira o app da Lena (rastreio do pedido 1048); no Comparar os trilhos dão lugar a 4 faixas na mesma régua.
// Cenários (toggle e ?mode=curto|longo|webhook|websocket|comparar; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-sincrona-brief.md).
FIGS3D.push({ id: 'espera', name: 'Waiting for the notice', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const dec = (v, n = 2) => String(+v.toFixed(n));
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const HORA = v => '14:05:' + (v < 10 ? '0' : '') + Math.max(0, v).toFixed(2);

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['curto', 'longo', 'webhook', 'websocket', 'comparar'];
  const SCNAME = { curto: 'Short', longo: 'Long', webhook: 'Webhook', websocket: 'WebSocket', comparar: 'Compare' };
  const SCFULL = { curto: 'Short polling: asking every 2 s', longo: 'Long polling: the store holds the question', webhook: 'Webhook: the PSP notifies the store',
    websocket: "WebSocket: Lena's tracking", comparar: 'All four on one timeline' };
  const AULA = { curto: 'aula-3-webhooks-short-polling-e-long-polling', longo: 'aula-3-webhooks-short-polling-e-long-polling', webhook: 'aula-3-webhooks-short-polling-e-long-polling',
    websocket: 'aula-6-websockets', comparar: 'aula-3-webhooks-short-polling-e-long-polling' };
  const PAGO = 23.4, LOJA_SABE = 23.43, LONGO_RESP = 23.45;
  const STATUS = 'GET /api/v1/pedidos/1050/status';
  const EV = '{"evento_id":"ev-8812","tipo":"cobranca.paga","cobranca_id":"c-7731","valor_centavos":2890,"pago_em":"14:05:23"}';
  const POS = '{"pedido":1048,"lat":-8.0476,"lng":-34.877,"eta_min":42}';
  let clk = 0, sc = 'curto', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-espera3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // a régua: x = 120 + 17 por segundo (0 s em 120, 30 s em 630); cada trilho tem o nome na ponta esquerda (14 a 114)
  const PL = 7, Z = 12, ZT = 24, TX = t => 120 + 17 * t, RX0 = 14, RX1 = 652, RW = RX1 - RX0, NAMEW = 98;
  const RL = { psp: { y: 46, d: 40, h: 8 }, loja: { y: 128, d: 46, h: 8 }, gw: { y: 203, d: 23, h: 4 }, tela: { y: 254, d: 46, h: 8 },
    lc: { y: 44, d: 46, h: 8 }, ll: { y: 114, d: 46, h: 8 }, lw: { y: 184, d: 46, h: 8 }, ls: { y: 254, d: 46, h: 8 } };
  const LANES = ['lc', 'll', 'lw', 'ls'];
  const RULY = 308, RULD = 28, COLX = 670;
  plateWith(g0, 694, 350, [[14, 14], [680, 14], [14, 336], [680, 336]]);
  hazeAndShadow(g0, 347, 175, 8.2, 4.2);
  // mostrador ao fundo, à esquerda (à direita ficam a linha do pagamento e os balões do PSP)
  rbox(14, 8, PL, 404, 12, 192, 5, bodyMat, g0);
  const scr = faceCanvas('front', 18, 20, 196, 396, 185, 4, g0);
  // trilhos e faixas: blocos baixos ao longo da régua; os que entram e saem afundam na base
  function block(name) {
    const r = RL[name], g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, RW, r.d, r.h, Math.min(5, r.d / 3), mat, g);
    const top = faceCanvas('top', 2, 2, r.h, RW - 4, r.d - 4, 4, g);
    return { g, mat, top, x: RX0, y: r.y, w: RW, d: r.d, h: r.h, key: '', f: 1 };
  }
  const B = {};
  ['psp', 'loja', 'gw', 'tela', ...LANES].forEach(n => { B[n] = block(n); });
  const NAMES = Object.keys(B);
  const ruler = faceCanvas('top', RX0, RULY, PL, RW, RULD, 4, g0);
  creases(first);

  // conexões grossas (vigas), linhas finas e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const beamInk = new THREE.MeshBasicMaterial({ color: 0xe6e8e9, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 320 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 10 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.w || (b.thin ? (b.on ? 2.4 : 1.8) : b.on ? 6 : 4)) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.tone === 'ink' ? beamInk : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + (b.cap === false ? 0 : th), th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); D.g.scale.setScalar(1); moveGlow(D.glow, p, 0.9); }
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11)], CLOCK = tag(11), PAYT = tag(11);
  const NAMETAG = {};   // o nome de cada trilho, em pé (legível a 390 px); na face do trilho fica só a legenda
  NAMES.forEach(n => { NAMETAG[n] = tag(n === 'gw' ? 9.5 : 11.5); });

  // ── rotas (no chão, z = 12): degraus entre os trilhos, barras ao longo da régua ──
  const rev = pts => pts.slice().reverse();
  const UP = t => [[TX(t), RL.tela.y, Z], [TX(t), RL.loja.y + RL.loja.d, Z]];          // tela → loja
  const PSPL = t => [[TX(t), RL.psp.y + RL.psp.d, Z], [TX(t), RL.loja.y, Z]];          // PSP → loja
  const GWT = t => [[TX(t), RL.gw.y + RL.gw.d, Z], [TX(t), RL.tela.y, Z]];             // gw-loja → tela
  const HOLD = (a, b, dy = 0) => [[TX(a), RL.loja.y + RL.loja.d + 7 + dy, Z], [TX(b), RL.loja.y + RL.loja.d + 7 + dy, Z]];   // a loja segura
  const WSB = (a, b) => [[TX(a), 214, Z], [TX(b), 214, Z]];                             // a conexão do WebSocket aberta
  const PSPW = (a, b) => [[TX(a), RL.psp.y + RL.psp.d + 7, Z], [TX(b), RL.psp.y + RL.psp.d + 7, Z]];   // o PSP esperando
  const LOJAP = (a, b) => [[TX(a), RL.loja.y - 7, Z], [TX(b), RL.loja.y - 7, Z]];       // a loja processando
  const onRail = (n, t, z = 34) => [TX(t), RL[n].y + RL[n].d / 2, z];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── tempo do passo: o relógio vai de t0 (em lt = a) a t1 (em lt = b), em linha reta ──
  const CLK = s => { const [t0, t1 = t0, a = 0.4, b = a + 4] = s.clk || [0]; return [t0, t1, a, b]; };
  function simNow(s, t) { const [t0, t1, a, b] = CLK(s); return t1 === t0 ? t0 : t0 + (t1 - t0) * clamp((t - a) / (b - a)); }
  // segundos reais desde que o relógio passou por ts neste passo (99 = já tinha passado; < 0 = ainda não)
  function since(ts) { const [t0, t1, a, b] = CLK(cur());
    if (t1 === t0) return ts <= t0 + 1e-6 ? 99 : -1; if (ts < t0 - 1e-6) return 99; return lt - (a + (ts - t0) / (t1 - t0) * (b - a)); }
  function flow(o, pts, f, text, tone) { const e = clamp(f); o.beams.push({ pts, on: true, dot: e, tone: tone === 'bad' ? 'bad' : '' });
    if (text) o.msgs.push([pts, e, text, tone]); o.dots.push(alongPts(pts, cumLen(pts), e)); }
  // um degrau: a pergunta sobe, a resposta desce; depois fica (apagado se não trouxe novidade)
  function rung(o, ts, pts, up, down, tone = 'dim', D = 0.34) {
    const s = since(ts); if (s < 0) return 0;
    if (s < D) { flow(o, pts, s / D, up, 'hi'); return 1; }
    if (s < 2 * D) { flow(o, rev(pts), (s - D) / D, down, tone === 'dim' ? 'hi' : tone); return 2; }
    o.beams.push({ pts, on: tone !== 'dim', tone }); return 3;
  }
  // uma mensagem de um sentido só (quadro, webhook): corre e fica
  function one(o, ts, pts, text, tone = 'acc', D = 0.4) { const s = since(ts); if (s < 0) return 0;
    if (s < D) { flow(o, pts, s / D, text, tone); return 1; } o.beams.push({ pts, on: tone !== 'dim', tone }); return 2; }
  // animação no tempo real do passo (segundos de lt), para o que acontece em milissegundos
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { const e = ease(f); o.beams.push({ pts, on: true, dot: f < 1 ? e : null, tone: tone === 'bad' ? 'bad' : '' });
      if (text) o.msgs.push([pts, e, text, tone]); if (f < 1) o.dots.push(alongPts(pts, cumLen(pts), e)); }
    else o.beams.push({ pts, on: tone !== 'dim', tone: tone === 'bad' ? 'bad' : '' });
    return f >= 1;
  }
  const bar = (o, pts, tone = '') => o.beams.push({ pts, on: true, tone });
  const C3 = (...c) => c;   // contadores do mostrador: [rótulo, valor, tom]

  // ── conteúdo dos trilhos: [de, até, texto, tom] em segundos da régua ──
  const q = v => Math.round(v * 10) / 10;
  const st = (now, tc, a, b) => [[0, q(Math.min(now, tc)), a, 'dim'], ...(now > tc ? [[tc, q(now), b, 'acc']] : [])];
  const R = (title, sub, segs = [], extra = {}) => ({ title, sub, segs, ...extra });
  function railsDavi(o, now, seen, { loja = 'pedidos · 1050', gw = '' } = {}) {
    o.rails.psp = R('PSP', 'Pix provider', st(now, PAGO, 'charge c-7731 · pending', 'c-7731 · paid'));
    o.rails.loja = R('STORE', loja, st(now, LOJA_SABE, 'status: aguardando_pagamento', 'status: pago'));
    o.rails.gw = R('gw-loja', '', gw ? [[1, Math.max(1, q(Math.min(now, 9.6))), gw, 'dim']] : []);
    o.rails.tela = R("DAVI'S SCREEN", 'order 1050', st(now, seen, 'waiting for payment', 'PAID'));
  }

  // ── o que se vê em cada modo ──
  function base(now) {
    const cmp = sc === 'comparar', ws = sc === 'websocket';
    const o = { show: {}, on: {}, rails: {}, beams: [], tags: [], msgs: [], dots: [], cnt: [], res: [], now, cursor: !cmp, pay: !ws && now >= PAGO, cols: [] };
    o.show.psp = !cmp && !ws; o.show.loja = !cmp; o.show.tela = !cmp; o.show.gw = sc === 'curto' || sc === 'longo';
    LANES.forEach(k => o.show[k] = cmp);
    NAMES.forEach(n => o.rails[n] = R('', ''));
    return o;
  }
  // short polling: perguntas a cada 2 s até a 12ª (14:05:24) trazer "pago"
  function curto(o, now) {
    railsDavi(o, now, 24);
    let n = 0;
    for (let k = 1; k <= 12; k++) { const ts = 2 * k; if (ts > now + 1e-6) break; n = k;
      rung(o, ts, UP(ts), 'GET …/1050/status', k < 12 ? 'aguardando_pagamento' : '{"status":"pago"}', k < 12 ? 'dim' : 'acc'); }
    if (now >= LOJA_SABE) rung(o, LOJA_SABE, PSPL(LOJA_SABE), 'webhook', '200', 'acc', 0.25);
    return n;
  }
  // long polling: a pergunta fica segura até 10 s ou até o pago
  function longo(o, now, seenAt = LONGO_RESP) {
    railsDavi(o, now, seenAt, { gw: 'cuts at 15 s' });
    let n = 0;
    for (const [a, b] of [[0, 10], [10, 20], [20, LONGO_RESP]]) { if (a > now + 1e-6) break; n++;
      one(o, a, UP(a), STATUS.replace('/api/v1/pedidos', '…') + '?aguardar=pago', 'hi', 0.34);
      if (now > a) o.beams.push({ pts: HOLD(a, Math.min(now, b)), on: now < b || b === LONGO_RESP });
      if (now >= b) one(o, b, rev(UP(b)), b === LONGO_RESP ? '200 {"status":"pago"}' : '200 · waiting (10 s)', b === LONGO_RESP ? 'acc' : 'dim', 0.4); }
    if (now >= LOJA_SABE) one(o, LOJA_SABE, PSPL(LOJA_SABE), 'webhook', 'acc', 0.25);
    return n;
  }
  // WebSocket: quadros a cada 5 s (seq 1, 2, 3...) pela mesma conexão
  function railsLena(o, now, { tela = "LENA'S APP", sub = 'order 1048 · on the way' } = {}) {
    o.rails.loja = R('STORE', 'tracking', [[0, q(now), 'truck position every 5 s', 'dim']]);
    o.rails.tela = R(tela, sub, [[0, q(now), 'tracking map', 'dim']]);
  }

  const STEPS = {
    curto: [
      { id: 'pix', dur: 6, clk: [0], title: 'Davi generated the Pix and now waits', yk: "IN DAVI'S APP · 14:05:00.000",
        yaml: ['POST /api/v1/pedidos', '→ 201 Created', 'Location: /api/v1/pedidos/1050', '# pedidos → pagamentos → PSP:', '#   charge c-7731 of 2890 cents', '# the screen shows the Pix QR'],
        story: 'At 14:05:00 Davi\'s app creates order 1050: the blue mug (19.90) with shipping to SP (9.00), 28.90 in total. The pagamentos asks the PSP for a Pix charge, c-7731, and the screen shows the QR. Davi will open his banking app and pay 23.4 s later. The PSP is the first to find out; the screen knows nothing.',
        look: 'A rung climbs from the screen to the store and comes back with 201; another goes from the store to the PSP and creates the charge. The ruler below runs from 14:05:00 to 14:05:30.',
        key: 'The screen needs a way to find out that the money arrived.',
        f(o, t) { railsDavi(o, 0, 99);
          send(o, t, 0.3, 1.0, UP(0), 'POST /api/v1/pedidos', 'hi', 0.1);
          send(o, t, 1.1, 1.7, rev(UP(0)), '201 · order 1050', 'acc', 0.4);
          send(o, t, 2.0, 2.6, rev(PSPL(0)), 'creates the charge · 2890', 'hi', 0.1);
          const ok = send(o, t, 2.7, 3.2, PSPL(0), 'c-7731 · pending', 'acc', 0.5);
          o.cnt = C3(['CLOCK', '14:05:00.000'], ['ORDER 1050', '28.90 · Pix'], ['CHARGE AT THE PSP', ok ? 'c-7731 · pending' : '…']);
          o.res = t > 1.7 ? ['201 Created · order 1050', ok ? 'charge c-7731 created at the PSP' : ''] : [];
          if (t > 3.6) { T(o, onRail('tela', 4, 36), 'the screen shows the QR\nand waits…', 'dim'); T(o, onRail('psp', 8, 34), 'the PSP finds out first', 'acc'); } } },
      { id: 'pergunta', dur: 7.5, clk: [0.5, 10.6, 0.4, 6.2], title: 'Every 2 s the screen asks: anything yet?', yk: 'ON THE SCREEN · every 2 s',
        yaml: ['setInterval(async () => {', '  const r = await fetch(', '    "/api/v1/pedidos/1050/status")', '  // {"status":"aguardando_pagamento"}', '}, 2000)'],
        story: 'The simplest way is for the screen to ask from time to time. Every 2 s it sends GET /api/v1/pedidos/1050/status; the question goes through the gw-loja, which checks the JWT, reaches the pedidos and comes back with {"status":"aguardando_pagamento"}. The article calls this checking the mailbox: you walk over, open it, it is empty, you walk back.',
        look: 'A rung every 2 s on the ruler: it climbs from the screen, crosses the gw-loja, touches the store and comes back dimmed, with no news.',
        key: 'Short polling: the client asks at a fixed interval, whether there is news or not.',
        f(o, t) { const n = curto(o, o.now);
          o.cnt = C3(['REQUESTS', String(n)], ['EMPTY RESPONSES', String(n)], ['CLOCK', HORA(o.now)]);
          o.res = n ? ['200 OK', '{"status":"aguardando_pagamento"}'] : [];
          if (t > 6.6) T(o, onRail('tela', 6, 36), '5 questions, 5 times "not yet"', 'dim'); } },
      { id: 'paga', dur: 8.5, clk: [10.6, 24.9, 0.4, 6.4], title: 'The Pix lands at 14:05:23.4; the screen sees it at 24.0', yk: 'ON THE SCREEN · the 12th question',
        yaml: [STATUS, '→ 200 {"status":"aguardando_pagamento"}', '   … 11 times, from 14:05:02 to 14:05:22 …', STATUS + '   # 14:05:24', '→ 200 {"status":"pago"}'],
        story: 'The questions go on: 12, 14, 16 s… At 14:05:23.4 Davi pays in his banking app and the PSP notifies the store. But the screen asked at 22 s and only asks again at 24 s. The 12th question is the one that brings "pago". Of the 12, 11 came back empty, and the screen updated 0.6 s after the payment.',
        look: 'The orange payment line crosses the ruler at 23.4; the next rung, at 24, comes back lit and the screen becomes PAID.',
        key: 'In short polling the news waits for the next question: up to a whole interval of delay.',
        f(o, t) { const n = curto(o, o.now), seen = o.now >= 24.68;
          o.cnt = C3(['REQUESTS', String(n)], ['EMPTY RESPONSES', String(Math.min(n, 11))], ['DELAY ON THE SCREEN', seen ? '0.6 s' : '…', seen ? 'acc' : '']);
          o.res = seen ? ['200 OK', '{"status":"pago"}  # às 14:05:24'] : n ? ['200 OK', '{"status":"aguardando_pagamento"}'] : [];
          if (seen) T(o, onRail('tela', 24, 36), '12th question: paid\n0.6 s later', 'acc'); } },
      { id: 'media', dur: 7, clk: [24.9], title: 'The interval math', yk: 'INTERVAL × QUESTIONS × DELAY',
        yaml: ['every   questions  Davi delay  average', '  1 s       24         0.6 s       0.5 s', '  2 s       12         0.6 s       1 s', '  5 s        5         1.6 s       2.5 s', '# the average delay is half the interval'],
        story: 'The delay depends on where the payment falls between two questions. Davi\'s fell 0.6 s before the 12th; had it fallen right after the 11th, at 22.1 s, he would wait 1.9 s. On average, half the interval: 1 s. Asking every 1 s cuts the average delay to 0.5 s and doubles the questions.',
        look: 'The lit stretch between the payment line and the 24 s rung marks the 0.6 s; the 11 dimmed rungs stay on the left.',
        key: 'In short polling, less delay costs more questions, in the same proportion.',
        f(o, t) { curto(o, o.now); o.cursor = false;
          o.beams.push({ pts: [[TX(PAGO), RL.tela.y - 6, ZT + 1], [TX(24), RL.tela.y - 6, ZT + 1]], on: true, w: 5 });
          o.cnt = C3(['USELESS QUESTIONS', '11 of 12'], ["DAVI'S DELAY", '0.6 s'], ['AVERAGE DELAY', '1 s (half of 2 s)']);
          o.res = ['every 1 s: 24 questions, 0.5 s on average'];
          if (t > 0.5) T(o, [TX(23.7), RL.tela.y - 6, 40], '0.6 s', 'acc');
          if (t > 1.6) T(o, onRail('tela', 11, 40), '11 questions with no news', 'dim'); } },
      { id: 'bf', dur: 9, clk: [24.9], title: 'What if it fails: 5,000 screens on Black Friday', yk: 'THE BLACK FRIDAY MATH',
        yaml: ['5,000 screens ÷ 2 s     = 2,500 req/s', '2,500 req/s × 2 ms      = 5 vCPU', 'pedidos: 3 replicas × 1 = 3 vCPU', '2,500 × ~300 B (JWT)    = 750 KB/s', '# almost all of it to hear "not yet"'],
        story: 'Now multiply. On Black Friday there are 5,000 screens waiting for a Pix at the same time, each asking every 2 s: 2,500 requests per second. At 2 ms of CPU each, that is 5 vCPU just to answer "not yet", and the pedidos has 3 (3 replicas of 1 vCPU, module 6). Each question also carries the JWT, ~300 B round trip, and goes through the gw-loja authentication.',
        look: 'The rungs multiply until they become a wall; the store turns red when the math passes 3 vCPU.',
        key: 'Short polling costs per screen and per second, with or without news.',
        f(o, t) { curto(o, o.now); o.cursor = false;
          const k = clamp((t - 0.6) / 3.6), telas = Math.max(1, Math.round(k * k * 5000)), rps = telas / 2, cpu = rps * 0.002;
          const dens = Math.round(k * 150);
          for (let i = 0; i < dens; i++) { const ts = 0.1 + i * 0.2; o.beams.push({ pts: UP(ts), thin: true, on: true, tone: cpu > 3 ? 'bad' : '' }); }
          if (cpu > 3) { o.on.loja = 'bad'; o.rails.loja.sub = 'saturated'; }
          o.cnt = C3(['SCREENS WAITING', fmt(telas)], ['REQ/S AT THE PEDIDOS', fmt(rps), cpu > 3 ? 'bad' : ''], ['CPU', dec(cpu, 1) + ' vCPU of 3', cpu > 3 ? 'bad' : '']);
          o.res = cpu > 3 ? ['pedidos saturated: 5 vCPU needed, 3 exist', '750 KB/s of questions alone'] : [];
          if (t > 4.6) T(o, onRail('loja', 15, 40), '2,500 req/s × 2 ms = 5 vCPU\nthe pedidos has 3', 'bad'); } },
    ],
    longo: [
      { id: 'segura', dur: 7.5, clk: [0, 10.7, 0.4, 5.6], title: 'The screen asks and the store holds the response', yk: 'ON THE SCREEN · long polling',
        yaml: [STATUS, '    ?aguardar=pago&timeout=10', '# the pedidos does not answer right away:', '#   it holds until the status changes', '#   or until 10 s pass'],
        story: 'Long polling (RFC 6202) changes one thing: the store does not answer right away. The screen asks GET /api/v1/pedidos/1050/status?aguardar=pago&timeout=10 and the pedidos holds the request open until the status changes or 10 s pass. At 14:05:10 nothing changed: it answers "waiting" and the screen asks again at once.',
        look: 'A rung climbs at 14:05:00 and becomes an orange bar that grows on the ruler while the store holds; at 10 s the response comes down and another question climbs.',
        key: 'Long polling: the question stays waiting on the server side until there is an answer.',
        f(o, t) { const n = longo(o, o.now), a = o.now >= 10 ? 10 : 0;
          o.cnt = C3(['REQUESTS', String(n)], ['HELD FOR', dec(Math.max(0, o.now - a), 1) + ' s'], ['CLOCK', HORA(o.now)]);
          o.res = o.now >= 10 ? ['200 OK · 10 s later', '{"status":"aguardando_pagamento"}'] : ['… (the store has not answered yet)'];
          if (t > 1.2 && o.now < 10) T(o, [TX(Math.max(2.5, o.now / 2)), RL.loja.y + RL.loja.d + 7, 38], 'the store holds the question', 'acc');
          if (o.now >= 10.2) T(o, onRail('tela', 10, 38), '10 s with no news:\nit answers and the screen asks again', 'dim'); } },
      { id: 'pago', dur: 8.5, clk: [10.7, 24.3, 0.4, 6.4], title: 'The Pix lands and the response goes out 50 ms later', yk: 'AT THE STORE · 3rd question',
        yaml: ['# 3rd question, opened at 14:05:20:', STATUS + '?aguardar=pago', '# 14:05:23.4   Davi pays', '# 14:05:23.45  the pedidos releases the response', '→ 200 {"status":"pago"}'],
        story: 'The second question also hits the 10 s limit, at 14:05:20, and the third begins. At 14:05:23.4 Davi pays; the PSP webhook arrives, the pedidos sees the status change and releases the request it was holding. The response goes out at 14:05:23.45, about 50 ms after the payment. Since 14:05:00 that was 3 questions instead of 12, and the one that brought the news was already waiting.',
        look: 'The third bar stops at the payment line and the rung back lights up almost glued to it.',
        key: 'In long polling the response goes out when the news arrives, not when the screen asks.',
        f(o, t) { const n = longo(o, o.now), seen = o.now >= LONGO_RESP + 0.3;
          o.cnt = C3(['REQUESTS', String(n)], ['DELAY ON THE SCREEN', seen ? '0.05 s' : '…', seen ? 'acc' : ''], ['CLOCK', HORA(o.now)]);
          o.res = seen ? ['200 OK · 14:05:23.45', '{"status":"pago"}'] : ['… (holding)'];
          if (seen) T(o, onRail('tela', 15, 38), 'paid at 23.45\n~50 ms later', 'acc'); } },
      { id: 'custo', dur: 7.5, clk: [24.3], title: 'The price: one open connection per screen', yk: '5,000 SCREENS, NOBODY PAYS',
        yaml: ['5,000 ÷ 10 s      = 500 req/s (worst case)', '500 req/s × 2 ms  = 1 vCPU', '5,000 connections open at the same time', '= 5,000 goroutines + 5,000 descriptors', 'default limit: 1,024 descriptors'],
        story: 'On Black Friday, with 5,000 screens and nobody paying, each one asks once every 10 s: 500 req/s, 5 times fewer than the 2,500 of short polling. The cost moved. Now there are 5,000 connections open at the same time, each with a goroutine (module 11) and a file descriptor, and the default limit of descriptors per process on Linux is usually 1,024.',
        look: 'Several parallel bars stay open at the store at the same time, one per screen.',
        key: 'Long polling trades requests for open connections.',
        f(o, t) { longo(o, o.now); o.cursor = false; const k = clamp((t - 0.5) / 2.5), m = Math.round(k * 5);
          for (let i = 0; i < m; i++) { const a = (i * 3.7) % 10; o.beams.push({ pts: HOLD(a, 24.3, 6 + i * 3.4), thin: true, on: true }); }
          o.cnt = C3(['REQ/S (WORST CASE)', '500'], ['OPEN CONNECTIONS', fmt(Math.max(1, k * 5000))], ['DESCRIPTOR LIMIT', '1,024 (default)', 'bad']);
          o.res = ['short polling: 2,500 req/s', 'long polling: 500 req/s + 5,000 open'];
          if (t > 3.2) T(o, onRail('loja', 12, 42), '5,000 open: 1 goroutine\nand 1 descriptor each', 'acc'); } },
      { id: 'corte', dur: 8.5, clk: [0, 16.6, 0.4, 5.4], title: 'What if it fails: the gw-loja cuts at 15 s', yk: 'ON THE SCREEN · timeout=25',
        yaml: [STATUS, '    ?aguardar=pago&timeout=25', '# the gw-loja cuts a request idle for 15 s', '#   (Envoy uses a 15 s route timeout)', '→ 504 Gateway Timeout   # at 15 s', '# fix: hold 10 s (< 15 s)'],
        story: 'Someone thought 10 s was too little and raised it to timeout=25. But between the screen and the pedidos sits the gw-loja, which cuts any request idle for 15 s (Envoy has a 15 s route timeout by default). At 15 s the gateway gives up and returns 504 Gateway Timeout to the screen, for every screen, every time. The fix is for the store to hold less than the shortest timeout on the path: 10 s.',
        look: 'The bar grows to 15 s and turns red; the rung back comes out of the gw-loja, not the store, with 504.',
        key: 'The server has to release the response before the shortest timeout on the path.',
        f(o, t) { railsDavi(o, o.now, 99, { gw: 'cuts at 15 s' });
          const now = o.now, cut = now >= 15;
          one(o, 0, UP(0), STATUS.replace('/api/v1/pedidos', '…') + '?timeout=25', 'hi', 0.34);
          if (now > 0) bar(o, HOLD(0, Math.min(now, 15)), cut ? 'bad' : '');
          if (cut) { o.on.gw = 'bad'; o.rails.gw.segs = [[1, 9.6, 'cuts at 15 s', 'dim'], [15, q(now), '504', 'bad']];
            one(o, 15, GWT(15), '504 Gateway Timeout', 'bad', 0.45); }
          o.cnt = C3(['HOLDING FOR', dec(Math.min(now, 15), 1) + ' s', cut ? 'bad' : ''], ['GW-LOJA TIMEOUT', '15 s'], ['RESPONSE TO THE SCREEN', cut ? '504' : '…', 'bad']);
          o.res = cut ? ['504 Gateway Timeout', '(the gw-loja is the one that answered)'] : ['… (holding, timeout=25)'];
          if (cut) T(o, [TX(12.5), RL.gw.y + RL.gw.d / 2, 36], 'gw-loja: 15 s idle → 504', 'bad');
          if (t > 6.6) T(o, onRail('tela', 23, 38), 'fix: hold 10 s,\nless than the 15 s of the gw-loja', 'acc'); } },
    ],
    webhook: [
      { id: 'campainha', dur: 7.5, clk: [19.5, 23.7, 0.4, 3.6], title: 'The PSP rings the doorbell', yk: 'FROM THE PSP TO THE STORE · 14:05:23.43',
        yaml: ['POST https://api.loja.com.br/webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=068149…e13a', '{"evento_id":"ev-8812","tipo":"cobranca.paga",', ' "cobranca_id":"c-7731","valor_centavos":2890,', ' "pago_em":"14:05:23"}', '# body: 112 bytes'],
        story: 'Instead of someone asking over and over, whoever knows notifies. When creating the charge, the store left the PSP an address: https://api.loja.com.br/webhooks/psp. At 14:05:23.4 Davi pays and, right after, at 14:05:23.43, the PSP makes a POST to that address with the event cobranca.paga. It is the delivery person ringing the doorbell, instead of you going to check the mailbox.',
        look: 'The payment line appears on the PSP rail and a rung comes down from it to the store with the 112 bytes of the event.',
        key: 'Webhook: the other system calls you when the event happens.',
        f(o, t) { const now = o.now; railsDavi(o, now, 99, { loja: 'pagamentos · pedidos' });
          const r = now >= LOJA_SABE ? one(o, LOJA_SABE, PSPL(LOJA_SABE), 'POST /webhooks/psp · 112 B', 'acc', 0.6) : 0;
          o.cnt = C3(['FROM THE PSP TO THE STORE', r ? '1 request' : '0'], ['BODY', '112 B'], ['CLOCK', HORA(now)]);
          o.res = r ? ['arrived: cobranca.paga · ev-8812'] : [];
          if (r === 2) T(o, onRail('loja', 13, 40), 'ev-8812: cobranca.paga\nc-7731 · 2890', 'acc'); } },
      { id: 'assina', dur: 7.5, clk: [23.7], title: 'The store checks the signature and answers 200', yk: 'AT THE PAGAMENTOS · before believing',
        yaml: ['v1 = HMAC-SHA256(segredo,', '        "1792000000." + body)', '   = 068149…e13a   ✓ same as the header', 't = 1792000000: under 5 min   ✓', 'ev-8812: first time → store it', '→ 200 OK in ~30 ms'],
        story: 'Anyone on the internet can send a POST to that address, so the pagamentos checks before believing. It computes the HMAC-SHA256 of "1792000000." plus the body with the secret agreed with the PSP and compares it with the v1 in the header: it matches. It sees that the t is under 5 min old, stores the evento_id ev-8812 and answers 200 in ~30 ms.',
        look: 'The three checks light up at the store, one at a time; then the 200 goes back up to the PSP.',
        key: 'A webhook is checked: signature, age of the event and evento_id, and only then 200.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          const n = t > 3.0 ? 3 : t > 2.0 ? 2 : t > 1.0 ? 1 : 0; if (n) o.on.loja = 1;
          const ok = send(o, t, 3.7, 4.4, rev(PSPL(LOJA_SABE)), '200 OK · ~30 ms', 'acc', 0.6);
          const L = ['HMAC-SHA256 matches ✓', 't < 5 min ✓', 'ev-8812 stored ✓'].slice(0, n);
          if (n) T(o, onRail('loja', 11, 40), L.join('\n'), 'acc');
          o.cnt = C3(['SIGNATURE (HMAC)', n > 0 ? 'valid' : '…'], ['AGE OF THE EVENT', n > 1 ? '< 5 min' : '…'], ['RESPONSE TO THE PSP', ok ? '200 · 30 ms' : '…']);
          o.res = ok ? ['200 OK', 'ev-8812 stored'] : []; } },
      { id: 'tela', dur: 7.5, clk: [23.7], title: 'The webhook does not reach the screen', yk: 'THE PATH OF THE NOTICE',
        yaml: ['PSP → pagamentos        (webhook)', 'pagamentos → pedidos    1050 paid', 'pedidos → screen        (long polling)', '# the browser has no public', '#   address to receive the POST'],
        story: 'The webhook reaches the store\'s server, not Davi\'s phone: the browser has no public address for the PSP to call. After the 200, the pagamentos tells the pedidos, which marks 1050 as paid and releases the long polling the screen left open since 14:05:20. The webhook handles the PSP → store end; the store → screen end is still long polling (or WebSocket, in lesson 6).',
        look: 'The long polling bar, open since 14:05:20, stops at the payment and returns "pago" to the screen.',
        key: 'A webhook goes from server to server; between it and the screen, someone still has to wait.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          one(o, 20, UP(20), '', 'dim'); bar(o, HOLD(20, LONGO_RESP));
          const ok = send(o, t, 0.8, 1.7, rev(UP(LONGO_RESP)), '200 {"status":"pago"}', 'acc', 0.8);
          if (ok) { o.rails.tela.segs = [[0, 23.4, 'waiting for payment', 'dim'], [23.4, 23.7, '', 'acc']]; o.on.tela = 1; }
          o.cnt = C3(['PATH', 'PSP → store → screen'], ['THE SCREEN RECEIVES VIA', 'long polling'], ['WEBHOOKS ON THE SCREEN', '0']);
          o.res = ok ? ['pedidos → screen: {"status":"pago"}'] : [];
          if (t > 2) T(o, onRail('tela', 6, 38), 'the screen gets no webhook:\nit was waiting on long polling', 'dim');
          if (t > 1) T(o, [TX(20.5), RL.loja.y + RL.loja.d + 7, 40], 'long polling\nopen since 14:05:20', 'acc'); } },
      { id: 'lento', dur: 10, clk: [23.4, 30.6, 0.4, 5.4], title: 'What if it fails: the store takes 12 s and the PSP resends', yk: 'AT THE PSP · resend',
        yaml: ['# the pagamentos does everything before the 200: 12 s', '# the PSP waits 5 s and counts it as failed', '#   resends: 1 min, 5 min, 30 min', '14:06:28  POST /webhooks/psp  ev-8812', '# fix: store the evento_id,', '#   answer 200 right away, process later'],
        story: 'Now the pagamentos does all the work before answering and takes 12 s. The PSP waits 5 s, at 14:05:28 counts the delivery as failed and schedules another (in the example: after 1 min, 5 min and 30 min). At 14:06:28 the ev-8812 arrives again, and a pagamentos that did not store the evento_id marks 1050 as paid twice and releases two PedidoPago. The fix: store the evento_id, answer 200 right away and process later (module 13).',
        look: 'The red bar of the store goes past the end of the ruler; the PSP\'s stops at 5 s with a failure; on the right end the same ev-8812 arrives again.',
        key: 'A webhook arrives at least once: it may arrive twice, and whoever receives it has to cope.',
        f(o, t) { const now = o.now; railsDavi(o, now, 99, { loja: 'pagamentos · pedidos' }); o.payTag = false;
          if (now >= LOJA_SABE) one(o, LOJA_SABE, PSPL(LOJA_SABE), 'ev-8812 · 1st delivery', 'acc', 0.5);
          if (now > LOJA_SABE) { bar(o, LOJAP(LOJA_SABE, Math.min(now, 30.9)), 'bad'); o.on.loja = 'bad'; }
          const fail = now >= 28.43;
          if (now > LOJA_SABE) bar(o, PSPW(LOJA_SABE, Math.min(now, 28.43)), fail ? 'bad' : '');
          if (fail) { o.on.psp = 'bad'; T(o, onRail('psp', 24.5, 62), 'PSP: 5 s with no response\n→ failed, resends in 1 min', 'bad'); }
          const again = t > 6.2 && send(o, t, 6.2, 7.0, PSPL(30.4), 'ev-8812 again · 14:06:28', 'bad', 9);
          if (t > 1.2 && now < 30) T(o, [TX(Math.max(LOJA_SABE + 2, (LOJA_SABE + now) / 2)), RL.loja.y - 7, 40], 'pagamentos processing…\n' + dec(Math.max(0, now - LOJA_SABE), 1) + ' s', 'bad');
          o.cnt = C3(['THE STORE ANSWERS IN', '12 s', 'bad'], ['THE PSP WAITS', '5 s'], ['ev-8812 RECEIVED', again ? '2 times' : '1 time', again ? 'bad' : '']);
          o.res = again ? ['1050 marked paid 2 times', '2 PedidoPago events'] : fail ? ['PSP: delivery failed', 'next attempt: 14:06:28'] : [];
          if (again && t > 7.6) T(o, onRail('tela', 11, 38), 'fix: store the evento_id\nand answer 200 right away', 'acc'); } },
      { id: 'falso', dur: 9, clk: [27.5], title: 'What if it fails: a fake webhook', yk: 'FROM OUTSIDE · not the PSP',
        yaml: ['POST /webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=0000…', '{"tipo":"cobranca.paga", …}', '# unchecked: the order goes out for free', '# checking: the HMAC does not match → 401'],
        story: 'The webhook address is not a secret: it shows up in logs, screenshots, configuration. Someone finds it and sends an invented cobranca.paga, for an order that was never paid. A pagamentos that does not check the signature marks the order as paid, and the goods go out for free. When checking, the HMAC computed with the secret does not match the v1 and the answer is 401.',
        look: 'A red rung comes in from the right, from outside the PSP; the first time the store accepts it, the second time it returns 401.',
        key: 'Without checking the signature, anyone can pass as the PSP.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false; o.payTag = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          const FAKE = [[684, 107, Z], [TX(28), 107, Z], [TX(28), RL.loja.y, Z]];
          const a1 = send(o, t, 0.4, 1.6, FAKE, 'cobranca.paga · v1=0000…', 'bad', 0.2), b1 = a1 && t < 4.2;
          if (b1) { send(o, t, 1.8, 2.6, rev(FAKE), '200 · unchecked', 'bad', 1.6); o.on.loja = 'bad'; }
          if (t > 2.4 && t < 4.2) T(o, onRail('loja', 25.6, 40), 'unchecked:\norder paid for free', 'bad');
          const a2 = t > 4.4 && send(o, t, 4.4, 5.6, FAKE, 'cobranca.paga · v1=0000…', 'bad', 0.2);
          if (a2) send(o, t, 5.8, 6.6, rev(FAKE), '401 · HMAC does not match', 'acc', 9);
          if (t > 6.6) T(o, onRail('loja', 25.6, 40), 'checking: 401\nthe order stays pending', 'acc');
          o.cnt = C3(['ORIGIN', 'not the PSP', 'bad'], ['UNCHECKED', t > 2.4 ? 'order paid for free' : '…', 'bad'], ['CHECKING', t > 6.6 ? '401 · HMAC does not match' : '…']);
          o.res = t > 6.6 ? ['401 Unauthorized', 'invalid signature'] : t > 2.4 ? ['200 OK (unchecked)'] : []; } },
    ],
    websocket: [
      { id: 'handshake', dur: 7.5, clk: [0], title: 'A GET that becomes a connection', yk: 'HANDSHAKE (RFC 6455)',
        yaml: ['GET /rastreio/1048 HTTP/1.1', 'Upgrade: websocket · Connection: Upgrade', 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version: 13', '→ 101 Switching Protocols', 'Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo='],
        story: 'Lena opens the tracking of order 1048, which is on its way. The app sends a plain GET with Upgrade: websocket and a random key. The store answers 101 Switching Protocols with the Sec-WebSocket-Accept (the SHA-1 of the key together with a fixed text from RFC 6455, in base64). After the 101, the same TCP connection stops speaking HTTP and starts carrying frames in both directions.',
        look: 'A rung climbs with the GET and comes back with 101; from there a strip stays open between the app and the store.',
        key: 'WebSocket starts as HTTP and becomes a connection open in both directions.',
        f(o, t) { railsLena(o, 0); o.cursor = false;
          send(o, t, 0.3, 1.1, UP(0), 'GET /rastreio/1048 · Upgrade', 'hi', 0.1);
          const ok = send(o, t, 1.3, 2.0, rev(UP(0)), '101 Switching Protocols', 'acc', 0.6);
          if (ok) { const f = clamp((t - 2.2) / 1.6); if (f > 0) bar(o, WSB(0, f * 2.5)); o.on.tela = o.on.loja = 2; }
          o.cnt = C3(['HTTP REQUESTS', '1'], ['RESPONSE', ok ? '101' : '…'], ['CONNECTION', ok ? 'open' : '…']);
          o.res = ok ? ['101 Switching Protocols', 'from here on: frames'] : [];
          if (t > 3.8) T(o, [TX(4), 214, 36], 'the same TCP connection,\nnow in both directions', 'acc'); } },
      { id: 'quadros', dur: 9.5, clk: [0.2, 30.6, 0.4, 7.4], title: 'The store pushes the position every 5 s', yk: 'TEXT FRAME · store → app',
        yaml: ['{"pedido":1048,"lat":-8.0476,', ' "lng":-34.877,"eta_min":42}', '# 56 B of text + 2 B of header = 58 B', '# from app to store: + 4 B of mask', '# every 20 s: ping → pong (still alive?)'],
        story: 'Now the store speaks first. Every 5 s it pushes the truck position in a frame: the JSON has 56 B and the frame header, 2 B, so 58 B per message. The app asks for nothing. At 20 s the store sends a ping and the app answers pong, just to know the connection is still alive.',
        look: 'The connection strip grows along the ruler; every 5 s a dot comes down from the store to the app, and at 20 s a ping goes and a pong comes back.',
        key: 'In WebSocket the server sends without being asked, with few bytes of header.',
        f(o, t) { const now = o.now; railsLena(o, now); o.beams.push({ pts: UP(0), on: true });
          bar(o, WSB(0, now)); let n = 0;
          for (let k = 1; k <= 6; k++) { const ts = 5 * k; if (ts > now) break; n = k; one(o, ts, rev(UP(ts)), `frame ${k} · 58 B`, 'acc', 0.45); }
          if (now >= 20.4) { one(o, 20.4, rev(UP(20.9)), 'ping', 'hi', 0.3); if (now >= 21.3) one(o, 21.3, UP(21.6), 'pong', 'hi', 0.3); }
          o.cnt = C3(['FRAMES RECEIVED', String(n)], ['BYTES', fmt(n * 58) + ' B'], ['HTTP REQUESTS', '1 (the GET at the start)']);
          o.res = n ? ['frame ' + n + ': 58 B', POS] : [];
          if (n >= 1 && now < 9) T(o, onRail('tela', 5, 38), POS.slice(0, 26) + '…\n56 B + 2 B of header', 'acc'); } },
      { id: 'compara', dur: 8, clk: [30.6], title: 'Versus asking every 5 s', yk: 'BLACK FRIDAY · 1,000 ORDERS ON THE WAY',
        yaml: ['polling: GET /api/v1/pedidos/1048/posicao', '  190 B of request + 127 B of response = 317 B', 'WebSocket: 58 B per position', '200 positions/s:', '  WebSocket 200 × 58 B  = ~11.6 KB/s', '  polling   200 × 317 B = ~63 KB/s'],
        story: 'Without WebSocket, the app would ask GET /api/v1/pedidos/1048/posicao every 5 s: 190 B of request with the JWT and 127 B of response, 317 B per position. On Black Friday, with 1,000 orders on the way, that is 200 positions per second: ~11.6 KB/s over WebSocket against ~63 KB/s asking, and 200 fewer authentications per second at the gw-loja.',
        look: 'Next to each 58 B frame appears, dimmed, the 317 B rung that polling would have made.',
        key: 'For many small messages, the open connection saves header and authentication.',
        f(o, t) { railsLena(o, o.now); o.cursor = false; o.beams.push({ pts: UP(0), on: true }); bar(o, WSB(0, 30.6));
          for (let k = 1; k <= 6; k++) o.beams.push({ pts: rev(UP(5 * k)), on: true });
          const g = t > 0.8; if (g) for (let k = 1; k <= 6; k++) o.beams.push({ pts: UP(5 * k - 1.1), thin: true, on: false });
          if (g) { T(o, [TX(13.9), 236, 40], 'polling: 317 B\n(and 1 JWT checked)', 'dim'); T(o, [TX(20), 196, 40], 'WebSocket: 58 B', 'acc'); }
          o.cnt = C3(['WEBSOCKET', '~11.6 KB/s'], ['SHORT POLLING', '~63 KB/s'], ['AUTHENTICATIONS AT THE GW', '0 against 200/s']);
          o.res = ['1,000 orders on the way', '200 positions per second']; } },
      { id: 'morta', dur: 12, clk: [0.2, 30.6, 0.4, 8.4], title: 'What if it fails: the connection dies without warning', yk: 'IN THE APP · deadline and reconnection',
        yaml: ['# 17 s: the phone switches from 4G to Wi-Fi', '# the connection dies with no FIN: nobody warns', '# 25 s: nothing for 10 s → the app gives up on it', '# waits (backoff + jitter) and reconnects:', 'GET /rastreio/1048?ultimo_seq=3  → 101', '# the store resends frames 4 and 5'],
        story: 'At 17 s Lena\'s phone switches from 4G to Wi-Fi. The connection dies with no warning, no FIN, and the app keeps staring at a connection that looks open. The frames at 20 and 25 s are lost. With a deadline (here, 10 s with nothing), the app notices at 25 s, waits a bit (backoff with jitter) and reconnects saying the last frame it received, ultimo_seq=3. The store resends 4 and 5.',
        look: 'The strip turns red at 17 s; two dots go down and vanish halfway; at 26 s a new rung reopens the connection and the lost frames arrive together.',
        key: 'An open connection may be dead: ping with a deadline, reconnection and resuming by message number.',
        f(o, t) { const now = o.now; railsLena(o, now); o.beams.push({ pts: UP(0), on: true });
          bar(o, WSB(0, Math.min(now, 17)));
          if (now > 17) o.beams.push({ pts: WSB(17, Math.min(now, 26)), thin: true, on: true, tone: 'bad' });
          let got = 0, lost = 0;
          for (let k = 1; k <= 3; k++) if (5 * k <= now) { got = k; one(o, 5 * k, rev(UP(5 * k)), `frame ${k} · 58 B`, 'acc', 0.45); }
          for (const ts of [20, 25]) if (ts <= now) { lost++; const half = [[TX(ts), RL.loja.y + RL.loja.d, Z], [TX(ts), 214, Z]];
            if (one(o, ts, half, `frame ${ts / 5}: lost`, 'bad', 0.45) === 2) o.beams.push({ pts: half, on: true, tone: 'bad', w: 3 }); }
          if (now >= 17) T(o, [TX(17), 214, 40], '17 s: 4G → Wi-Fi\ndied with no FIN', 'bad');
          if (now >= 25) T(o, onRail('tela', 25, 38), '25 s: nothing for 10 s\n→ reconnects', 'acc');
          let state = now < 17 ? 'open' : now < 25 ? 'dead (nobody knows)' : now < 26 ? 'reconnecting' : 'resumed at 4';
          if (now >= 26) { rung(o, 26, UP(26), 'GET …/1048?ultimo_seq=3', '101', 'acc', 0.3); bar(o, WSB(26, now)); lost = 0;
            if (now >= 26.6) { one(o, 26.6, rev(UP(26.6)), 'frames 4 and 5 (resent)', 'acc', 0.45); got = 5; }
            if (now >= 30) { one(o, 30, rev(UP(30)), 'frame 6', 'acc', 0.45); got = 6; } }
          o.cnt = C3(['FRAMES LOST', String(lost), lost ? 'bad' : ''], ['LAST ONE ARRIVED', got ? 'seq ' + got : '…'], ['CONNECTION', state, now >= 17 && now < 26 ? 'bad' : '']);
          o.res = now >= 26.6 ? ['ultimo_seq=3 → resends 4 and 5', 'nothing was lost'] : now >= 20 ? ['frames going out to a dead connection'] : []; } },
      { id: 'massa', dur: 9.5, clk: [0], title: 'What if it fails: 1,000 reconnections in the same second', yk: 'DEPLOY · the tracking pod restarts',
        yaml: ['# 1,000 apps lose the connection together', 'no jitter: all come back in ~1 s', '  → 1,000 handshakes + 1,000 JWT', 'with 0 to 30 s of jitter in the wait:', '  1,000 ÷ 30 s = ~33 reconnections/s'],
        story: 'A deploy restarts the pod that holds the tracking connections, and the 1,000 apps with orders on the way lose the connection at the same instant. If all of them wait the same time to reconnect, that is 1,000 handshakes and 1,000 JWT checks in the same second. With jitter, a random draw from 0 to 30 s in the wait, the returns spread out: ~33 per second.',
        look: 'A red column of 1,000 reconnections rises in the first second; then it breaks into 30 low columns, ~33 in each.',
        key: 'Reconnection needs jitter, or everyone comes back at the same time.',
        f(o, t) { railsLena(o, 30, { tela: '1,000 APPS', sub: 'orders on the way' }); o.cursor = false;
          o.rails.loja.segs = [[0, 30, 'reconnections per second', 'dim']]; o.rails.tela.segs = [];
          const up = ease(clamp((t - 0.4) / 1.6)), down = ease(clamp((t - 4.2) / 1.0)), spread = ease(clamp((t - 5.0) / 1.4));
          const cy = RL.loja.y + RL.loja.d / 2, ZB = PL + RL.loja.h;
          if (down < 1) { const h = 130 * up * (1 - down); if (h > 0.5) o.cols.push({ pts: [[TX(0.5), cy, ZB], [TX(0.5), cy, ZB + h]], tone: 'bad' }); }
          if (spread > 0) for (let k = 0; k < 30; k++) o.cols.push({ pts: [[TX(k + 0.5), cy, ZB], [TX(k + 0.5), cy, ZB + 4.3 * spread]], tone: '' });
          if (t > 2.0 && t < 4.6) { T(o, [TX(0.5) + 60, cy, 150], 'no jitter: 1,000 in the 1st second', 'bad'); o.on.loja = 'bad'; }
          if (t > 6.2) T(o, onRail('loja', 15, 40), 'jitter of 0 to 30 s: ~33 per second', 'acc');
          o.cnt = C3(['CONNECTIONS LOST', '1,000'], ['PEAK WITHOUT JITTER', '1,000 in 1 s', 'bad'], ['WITH JITTER 0–30 S', t > 6.2 ? '~33 per second' : '…']);
          o.res = t > 6.2 ? ['1,000 ÷ 30 s = ~33 reconnections/s'] : t > 2 ? ['1,000 handshakes in the same second'] : []; } },
    ],
    comparar: [
      { id: 'regua', dur: 8, clk: [30], title: 'All four on one timeline', yk: 'WHEN EACH ONE FINDS OUT',
        yaml: ['payment:        14:05:23.4', 'short polling   sees at 24.0  (+0.6 s)', 'long polling    sees at 23.45 (+~0.05 s)', 'webhook         the store knows at 23.43', 'WebSocket       the store pushes as soon as it knows'],
        story: 'Same payment, same ruler. Short polling sees the "pago" on the next question, 0.6 s later (1 s on average). Long polling and WebSocket deliver as soon as the store knows, tens of milliseconds later. The webhook is the piece behind: it is what makes the store know at 14:05:23.43 without having to ask the PSP.',
        look: 'The payment line crosses the four lanes; in each one, the lit stretch starts when that approach found out.',
        key: 'For the screen, the delay depends on when it asks; for the store, on who notifies.',
        f(o, t) { lanes(o, 'atraso');
          o.cnt = C3(['SHORT POLLING', '+0.6 s'], ['LONG · WEBSOCKET', '+~0.05 s'], ['WEBHOOK → STORE', '+0.03 s']);
          o.res = ['payment at 14:05:23.4'];
          if (t > 0.8) T(o, [TX(25.6), RL.lc.y + RL.lc.d / 2, 34], '+0.6 s', 'acc'); } },
      { id: 'carga', dur: 8.5, clk: [30], title: '5,000 screens: what each one costs', yk: '5,000 SCREENS, NOBODY PAYS',
        yaml: ['short polling   2,500 req/s · 5 vCPU', 'long polling      500 req/s · 1 vCPU', 'WebSocket           0 req/s · pings only', 'webhook: 1 POST from the PSP per payment', '# the pedidos has 3 vCPU = 1,500 req/s'],
        story: 'Now the load, with 5,000 screens and nobody paying. Short polling makes 2,500 req/s and asks 5 vCPU of a pedidos that has 3. Long polling makes 500 req/s, 1 vCPU. WebSocket makes no requests at all after the handshake, only small pings. The webhook does not even enter this math: it comes from the PSP, 1 POST per payment, not per screen.',
        look: 'At the end of each lane a column rises the size of its req/s; the short polling one passes the 3 vCPU mark and turns red.',
        key: 'Asking costs per screen and per second; an open connection costs per screen, even idle.',
        f(o, t) { lanes(o, 'carga'); o.payTag = false; const k = ease(clamp((t - 0.4) / 2)), H = v => 110 * v / 2500;
          const col = (lane, v, tone = '') => { const cy = RL[lane].y + RL[lane].d / 2; if (v * k > 0) o.cols.push({ pts: [[COLX, cy, PL], [COLX, cy, PL + H(v) * k]], tone }); };
          col('lc', 2500, k * 2500 > 1500 ? 'bad' : ''); col('ll', 500); col('lw', 0); col('ls', 0);
          const cy = RL.lc.y + RL.lc.d / 2; o.beams.push({ pts: [[COLX - 12, cy, PL + H(1500)], [COLX + 12, cy, PL + H(1500)]], on: true, tone: 'bad', thin: true });
          if (t > 2.4) { T(o, [COLX, cy, PL + 122], '2,500 req/s', 'bad'); T(o, [COLX, RL.ll.y + RL.ll.d / 2, PL + 34], '500', 'acc'); T(o, [COLX - 130, RL.lc.y + RL.lc.d / 2, PL + H(1500)], '3 vCPU = 1,500 req/s', 'bad'); }
          if (k > 0.6) o.on.lc = 'bad';
          o.cnt = C3(['SHORT POLLING', '2,500 req/s', 'bad'], ['LONG POLLING', '500 req/s'], ['WEBSOCKET', '0 req/s']);
          o.res = ['short: 5 vCPU (3 exist) · long: 1 vCPU']; } },
      { id: 'aberto', dur: 9, clk: [30], title: 'What if it fails: too many connections in one process', yk: 'LONG POLLING AND WEBSOCKET',
        yaml: ['5,000 connections = 5,000 descriptors', 'default limit: 1,024 per process', '# from the 1,025th on, Go logs:', 'http: Accept error: accept4:', '  too many open files', '# fix: raise the limit and use replicas'],
        story: 'Long polling and WebSocket trade requests for open connections, and each connection is a file descriptor in the process. With the default limit of 1,024 descriptors, the 1,025th screen cannot even connect: the accept fails with "too many open files" while the others keep working. The fix is to raise the limit (ulimit -n) and spread the connections across several replicas.',
        look: 'The long polling and WebSocket lanes turn red and the connection columns pass the 1,024 mark; short polling and webhook hold nothing open.',
        key: 'An open connection is a resource of the process: count descriptors, memory and replicas.',
        f(o, t) { lanes(o, 'aberto'); o.payTag = false; const k = ease(clamp((t - 0.4) / 2)), H = v => 110 * v / 5000;
          for (const lane of ['ll', 'ls']) { const cy = RL[lane].y + RL[lane].d / 2;
            o.cols.push({ pts: [[COLX, cy, PL], [COLX, cy, PL + Math.max(0.5, H(5000) * k)]], tone: k * 5000 > 1024 ? 'bad' : '' });
            o.beams.push({ pts: [[COLX - 12, cy, PL + H(1024)], [COLX + 12, cy, PL + H(1024)]], on: true, tone: 'ink', thin: true });
            if (k * 5000 > 1024) o.on[lane] = 'bad'; }
          if (t > 2.6) { T(o, [COLX, RL.ll.y + RL.ll.d / 2, PL + 124], '5,000 open', 'bad'); T(o, [COLX - 46, RL.ls.y + RL.ls.d / 2, PL + 30], 'limit 1,024', 'dim'); }
          if (t > 4) T(o, [TX(9), RL.ls.y + RL.ls.d / 2, 40], '1,025th: too many open files', 'bad');
          o.cnt = C3(['CONNECTIONS REQUESTED', fmt(Math.max(1, k * 5000))], ['DEFAULT LIMIT', '1,024', 'bad'], ['ERROR OF THE 1,025TH', t > 4 ? 'too many open files' : '…', 'bad']);
          o.res = t > 4 ? ['accept4: too many open files', 'fix: ulimit -n and replicas'] : []; } },
    ],
  };
  // as quatro faixas do Comparar (o mesmo Pix, o que cada jeito mostra na régua)
  function lanes(o, kind) { o.cursor = false;
    const sub = { atraso: ['+0.6 s · avg 1 s', '+~0.05 s', '+0.03 s to the store', '+~0.05 s'], carga: ['2,500 req/s · 5 vCPU', '500 req/s · 1 vCPU', '1 POST per payment', '0 req/s · pings only'],
      aberto: ['0 idle connections', '5,000 open', "0 (it is the PSP's)", '5,000 open'] }[kind];
    o.rails.lc = R('SHORT POLLING', sub[0], [[0, 24, 'asks every 2 s', 'dim'], [24, 30, 'PAID', 'acc']], { marks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(v => [v, 'dim']).concat([[24, 'acc']]) });
    o.rails.ll = R('LONG POLLING', sub[1], [[0, LONGO_RESP, 'holds up to 10 s per question', 'dim'], [LONGO_RESP, 30, 'PAID', 'acc']], { spans: [[0, 10, 'dim'], [10, 20, 'dim'], [20, LONGO_RESP, 'acc']], marks: [[LONGO_RESP, 'acc']] });
    o.rails.lw = R('WEBHOOK', sub[2], [[0, LOJA_SABE, 'the store waits for the PSP to call', 'dim'], [LOJA_SABE, 30, 'the store knows', 'acc']], { marks: [[LOJA_SABE, 'acc']] });
    o.rails.ls = R('WEBSOCKET', sub[3], [[0, LONGO_RESP, 'open connection, no questions', 'dim'], [LONGO_RESP, 30, 'PAID', 'acc']], { spans: [[0, 30, 'dim']], marks: [[LONGO_RESP, 'acc']] });
  }
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const s = cur(), o = base(simNow(s, lt)); s.f(o, lt); o.pay = sc !== 'websocket' && o.now >= PAGO; return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawRail(Bk, r, on) {
    const key = JSON.stringify([r, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, false, ''), H_ = cv.c.height / cv.P, light = theme === 'light';
    const lx = t => TX(t) - (RX0 + 2), lane = !!(r.marks || r.spans), thin = H_ < 24;
    // faixas de estado ao longo da régua
    const ty = lane ? H_ * 0.68 : H_ / 2;
    for (const [a, b, text, tn] of r.segs) { if (!(b > a)) continue; const X0 = lx(a), X1 = lx(b);
      if (tn === 'acc' || tn === 'bad') { x.fillStyle = tn === 'bad' ? (light ? '#f2dcd9' : '#3a1712') : (light ? '#f3dcc4' : '#3a2611'); x.fillRect(u(X0), u(2.5), u(X1 - X0), u(H_ - 5)); }
      if (text) { x.textAlign = 'left'; x.fillStyle = toneC(tn); x.font = `700 ${u(thin ? 11.5 : 11.5)}px ${MONO3}`; if (x.measureText(text).width < u(X1 - X0 - 8)) x.fillText(text, u(X0 + 4), u(ty)); } }
    for (const [a, b, tn] of r.spans || []) { const X0 = lx(a), X1 = lx(b), y = H_ * 0.26; x.strokeStyle = toneC(tn); x.lineWidth = u(1.4);
      x.beginPath(); x.moveTo(u(X0), u(y)); x.lineTo(u(X1), u(y)); x.moveTo(u(X0), u(y - 4)); x.lineTo(u(X0), u(y + 4)); x.moveTo(u(X1), u(y - 4)); x.lineTo(u(X1), u(y + 4)); x.stroke(); }
    for (const [t, tn] of r.marks || []) { const X0 = lx(t); x.strokeStyle = toneC(tn); x.lineWidth = u(tn === 'acc' ? 2 : 1.3); x.beginPath(); x.moveTo(u(X0), u(3)); x.lineTo(u(X0), u(H_ * 0.46)); x.stroke(); }
    // o nome na ponta esquerda
    x.fillStyle = light ? '#e6e7e7' : '#151618'; if (on === 'bad') x.fillStyle = light ? '#f4e4e2' : '#24130f'; else if (on === 1 || on === 2) x.fillStyle = light ? '#f6ece2' : '#2a1d12';
    x.fillRect(u(1.2), u(1.2), u(NAMEW + 3), u(H_ - 2.4));
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(NAMEW + 4), u(2)); x.lineTo(u(NAMEW + 4), u(H_ - 2)); x.stroke();
    x.textAlign = 'left'; x.fillStyle = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    if (r.sub && !thin) { x.fillStyle = INK(); fitFont(x, u, r.sub, 10.5, NAMEW - 6); x.fillText(r.sub, u(5), u(H_ * 0.7)); }
    // aceso: só a borda (o trilho é comprido; pintar tudo apagaria as faixas de estado)
    if (on) { x.strokeStyle = on === 'bad' ? BAD() : accC(); x.lineWidth = u(on === 2 ? 0.9 : 1.4); x.strokeRect(u(0.8), u(0.8), cv.c.width - u(1.6), cv.c.height - u(1.6)); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawRuler() { const ws = sc === 'websocket'; if (!once('ruler', theme + accent.getHex() + ws)) return;
    const cv = ruler, { x, P } = cv, u = v => v * P, Hh = RULD; x.clearRect(0, 0, cv.c.width, cv.c.height);
    x.fillStyle = theme === 'light' ? '#f1f1f0' : '#1b1c1f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = INK(); x.fillStyle = INK(); x.textBaseline = 'middle';
    const lx = t => TX(t) - RX0;
    x.lineWidth = u(0.8); x.beginPath(); x.moveTo(u(lx(0)), u(4)); x.lineTo(u(lx(30)), u(4)); x.stroke();
    for (let s = 0; s <= 30; s++) { const big = s % 5 === 0; x.lineWidth = u(big ? 1.3 : 0.8); x.beginPath(); x.moveTo(u(lx(s)), u(4)); x.lineTo(u(lx(s)), u(big ? 11 : 8)); x.stroke(); }
    x.font = `700 ${u(10.5)}px ${MONO3}`;
    for (let s = 0; s <= 30; s += 5) { x.textAlign = s === 30 ? 'right' : s === 0 ? 'left' : 'center'; x.fillText(ws ? s + ' s' : (s ? ':' + String(s).padStart(2, '0') : '14:05:00'), u(lx(s) + (s === 30 ? 2 : s === 0 ? -2 : 0)), u(19.5)); }
    x.textAlign = 'left'; x.fillText(ws ? 'TIME' : 'CLOCK', u(5), u(Hh / 2)); cv.tex.needsUpdate = true; }
  // mostrador em duas linhas: 3 contadores em cima; o código (ou a conta) e a resposta embaixo
  function drawScreen(o) {
    const s = cur(), yl = s.yaml;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 120) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    const CW = (Wd - 16) / 3;
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const X = 8 + i * CW; lbl(lab.toUpperCase(), X, 11, CW - 8);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 17, CW - 8); x.fillText(val, u(X), u(32)); });
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(6), u(48)); x.lineTo(u(Wd - 6), u(48)); x.stroke();
    lbl(s.yk, 8, 58, Wd - 16);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 9.6, Wd - 16); x.fillText(l, u(8), u(73 + i * 13)); });
    lbl('RESPONSE', 8, 154);
    const res = o.res.filter(Boolean);
    (res.length ? res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !res.length ? INK() : /^(5|4)\d\d|saturated|failed|too many|2 times|2 events|dead connection/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.6, Wd - 16); x.fillText(l, u(8), u(167 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">2 ms of CPU per question, ~300 B per question with the JWT, the resend at 1, 5 and 30 min, the 10 s deadline of the app and the 1 s backoff are example numbers from the module, at the real order of magnitude.</li>';
  const DATA = {
    curto: () => `<li>Question: <b>${STATUS}</b> every <b>2 s</b> → <b>{"status":"aguardando_pagamento"}</b></li><li>Payment at <b>14:05:23.4</b>; the 12th question, at <b>14:05:24</b>, brings <b>pago</b>: <b>12 requests, 11 empty</b>, a delay of <b>0.6 s</b> (on average, half the interval: 1 s)</li><table class="h3-sum"><tr><th>Black Friday</th><th>math</th></tr><tr><td>screens</td><td>5,000 ÷ 2 s = <b>2,500 req/s</b></td></tr><tr class="on"><td>CPU</td><td>2,500 × 2 ms = <b>5 vCPU</b> (the pedidos has 3)</td></tr><tr><td>network</td><td>2,500 × ~300 B = 750 KB/s</td></tr></table>${EX}`,
    longo: () => `<li>Question: <b>${STATUS}?aguardar=pago&amp;timeout=10</b> (RFC 6202)</li><li>Questions at 14:05:00, :10 and :20; the payment at <b>14:05:23.4</b> releases the 3rd at <b>14:05:23.45</b> (~50 ms)</li><table class="h3-sum"><tr><th>5,000 screens</th><th>short</th><th>long</th></tr><tr><td>req/s (worst case)</td><td>2,500</td><td><b>500</b></td></tr><tr><td>vCPU (2 ms each)</td><td>5</td><td><b>1</b></td></tr><tr class="on"><td>open connections</td><td>0</td><td>5,000</td></tr></table><li>Default descriptor limit per process: <b>1,024</b>. The gw-loja cuts a request idle for <b>15 s</b> (Envoy has a 15 s route timeout): hold <b>10 s</b>, never 25.</li>${EX}`,
    webhook: () => `<li><b>POST https://api.loja.com.br/webhooks/psp</b> at 14:05:23.43, body of <b>112 B</b>: <b>${EV.replace(/"/g, '&quot;')}</b></li><li><b>X-PSP-Signature: t=1792000000,v1=068149938cba8e09bb177226c07dc4123cf00f012211374b314e534c05eee13a</b> = HMAC-SHA256 (RFC 2104) of "1792000000." + body with the example secret <b>segredo-de-exemplo</b></li><li>The store checks the signature, the <b>t</b> (under 5 min) and the <b>evento_id</b>; it answers <b>200 in ~30 ms</b>.</li><li>What if it fails: a response in <b>12 s</b> → the PSP gives up at <b>5 s</b> and resends (1 min, 5 min, 30 min) → ev-8812 arrives <b>2 times</b>; a fake webhook with no check → free order; a resend out of order (<b>pendente</b> after <b>paga</b>) → use the event version (module 11).</li>${EX}`,
    websocket: () => `<li>Handshake: <b>GET /rastreio/1048</b> + <b>Upgrade: websocket</b> → <b>101 Switching Protocols</b>, <b>Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</b> (RFC 6455)</li><li>Frame: <b>${POS}</b> = 56 B + 2 B = <b>58 B</b> (from app to store, +4 B of mask: 62 B)</li><table class="h3-sum"><tr><th>1,000 orders on the way</th><th>per second</th></tr><tr class="on"><td>WebSocket</td><td>200 × 58 B = ~11.6 KB/s</td></tr><tr><td>polling (190 + 127 B)</td><td>200 × 317 B = ~63 KB/s</td></tr></table><li>Ping every 20 s; closing with a close frame (code 1000). Reconnection with backoff, jitter and <b>ultimo_seq</b>; 1,000 reconnections with 0 to 30 s of jitter = ~33/s.</li><li>If only the server talks, Server-Sent Events also works (it reconnects on its own with Last-Event-ID).</li>${EX}`,
    comparar: () => `<table class="h3-sum"><tr><th></th><th>who starts</th><th>delay</th><th>5,000 screens</th></tr><tr><td>short polling</td><td>the screen, every 2 s</td><td>0.6 s (avg 1 s)</td><td>2,500 req/s · 5 vCPU</td></tr><tr><td>long polling</td><td>the screen; the store holds</td><td>~50 ms</td><td>500 req/s · 5,000 open</td></tr><tr><td>webhook</td><td>the PSP</td><td>~30 ms to the store</td><td>1 POST per payment</td></tr><tr><td>WebSocket</td><td>the store pushes</td><td>~50 ms</td><td>0 req/s · 5,000 open</td></tr></table><li>The webhook does not reach the browser: it makes the store know; the screen still uses long polling or WebSocket.</li>${EX}`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="${SCFULL[v]} (key ${i + 1})">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="e3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk)}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'espera') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'espera' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = POSTER ? cur().dur : 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-espera3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'espera') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  const inRect = (b, p, m = 4) => p[0] > b.x - m && p[0] < b.x + b.w + m && p[1] > b.y - m && p[1] < b.y + b.d + m;
  function scene3(dt) {
    const o = SP = spec();
    // o trilho acende quando a luz chega nele
    NAMES.forEach(nm => { if (!o.on[nm] && o.show[nm] && o.dots.some(p => inRect(B[nm], p))) o.on[nm] = 1; });
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible) drawRail(Bk, o.rails[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? 0.25 : on === 2 ? 0.1 : 0; });
    NAMES.forEach(nm => { const Bk = B[nm], r = o.rails[nm], on = o.on[nm];
      if (Bk.f > 0.6 && r.title) NAMETAG[nm].set(r.title, on === 'bad' ? 'bad' : on === 1 ? 'acc' : 'hi').at(RX0 - 8 - NAMETAG[nm].sp.scale.x / TS * 0.42, Bk.y + Bk.d / 2 + NAMETAG[nm].sp.scale.x / TS * 0.42, PL + Bk.h); else NAMETAG[nm].hide(); });
    const beams = o.beams.slice(), now = o.now, top = sc === 'comparar' ? RL.lc.y - 6 : sc === 'websocket' ? RL.loja.y - 6 : RL.psp.y - 6;
    if (o.pay) beams.push({ pts: [[TX(PAGO), top, ZT], [TX(PAGO), RULY + 4, ZT]], on: true, thin: true, cap: false });
    if (o.cursor && now > 0 && now <= 30.9) beams.push({ pts: [[TX(now), top, ZT + 0.6], [TX(now), RULY + RULD, ZT + 0.6]], on: true, thin: true, tone: 'ink', cap: false });
    for (const c of o.cols) beams.push({ pts: c.pts, on: true, tone: c.tone, w: 9, cap: false });
    setBeams(beams); drawScreen(o); drawRuler();
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 46); });
    if (o.cursor && now > 0 && now <= 30.9) CLOCK.set(sc === 'websocket' ? dec(now, 1) + ' s' : HORA(now), 'hi').at(TX(now), RULY + RULD + 12, 4); else CLOCK.hide();
    if (o.pay && o.payTag !== false) PAYT.set('Davi pays · 14:05:23.4', 'acc').at(TX(PAGO), sc === 'comparar' ? RL.lc.y - 2 : RL.psp.y + RL.psp.d / 2, sc === 'comparar' ? 30 : 32); else PAYT.hide();
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    if (!POSTER) { lt += dt; if (lt > cur().dur + 3) lt = 0; } clk += dt;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('e3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-70, 700, 0, 352];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.97 - side, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.44 : nar ? 0.07 + aH * 0.6 : 0.52;
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), ruler, scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); beamInk.color.set(pal3().inkHi); });
  // começa com cada trilho já no lugar do cenário (sem subir na abertura)
  if (POSTER) lt = cur().dur;
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(350, 180, -150), dist: innerWidth < 640 ? 13 : 15 } : { target: W(160, 180, 60), dist: 13 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
