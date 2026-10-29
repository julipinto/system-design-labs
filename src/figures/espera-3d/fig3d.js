// Figura 3D (iso-glow): esperar o aviso. Uma régua de tempo de 14:05:00 a 14:05:30, o Pix do pedido 1050 do Davi (28.90).
// Três trilhos ao longo da régua: o PSP ao fundo, a loja no meio (com o gw-loja na frente dela) e a tela do Davi na frente.
// Cada requisição é um degrau que sobe da tela até a loja e volta; o que fica aberto (long polling, WebSocket) é uma barra
// que cresce no tempo. O pagamento é a linha em 14:05:23.4 e o cursor marca o relógio. Ao fundo, o mostrador com os contadores.
// No WebSocket a tela vira o app da Lena (rastreio do pedido 1048); no Comparar os trilhos dão lugar a 4 faixas na mesma régua.
// Cenários (toggle e ?mode=curto|longo|webhook|websocket|comparar; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-sincrona-brief.md).
FIGS3D.push({ id: 'espera', name: 'Esperar o aviso', mod: (() => {
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
  const dec = (v, n = 2) => String(+v.toFixed(n)).replace('.', ',');
  const fmt = n => Math.round(n).toLocaleString('pt-BR');
  const HORA = v => '14:05:' + (v < 10 ? '0' : '') + Math.max(0, v).toFixed(2);

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['curto', 'longo', 'webhook', 'websocket', 'comparar'];
  const SCNAME = { curto: 'Short', longo: 'Long', webhook: 'Webhook', websocket: 'WebSocket', comparar: 'Comparar' };
  const SCFULL = { curto: 'Short polling: perguntar a cada 2 s', longo: 'Long polling: a loja segura a pergunta', webhook: 'Webhook: o PSP avisa a loja',
    websocket: 'WebSocket: o rastreio da Lena', comparar: 'Os quatro na mesma régua' };
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
    o.rails.psp = R('PSP', 'provedor do Pix', st(now, PAGO, 'cobrança c-7731 · pendente', 'c-7731 · paga'));
    o.rails.loja = R('LOJA', loja, st(now, LOJA_SABE, 'status: aguardando_pagamento', 'status: pago'));
    o.rails.gw = R('gw-loja', '', gw ? [[1, Math.max(1, q(Math.min(now, 9.6))), gw, 'dim']] : []);
    o.rails.tela = R('TELA DO DAVI', 'pedido 1050', st(now, seen, 'aguardando pagamento', 'PAGO'));
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
    railsDavi(o, now, seenAt, { gw: 'corta em 15 s' });
    let n = 0;
    for (const [a, b] of [[0, 10], [10, 20], [20, LONGO_RESP]]) { if (a > now + 1e-6) break; n++;
      one(o, a, UP(a), STATUS.replace('/api/v1/pedidos', '…') + '?aguardar=pago', 'hi', 0.34);
      if (now > a) o.beams.push({ pts: HOLD(a, Math.min(now, b)), on: now < b || b === LONGO_RESP });
      if (now >= b) one(o, b, rev(UP(b)), b === LONGO_RESP ? '200 {"status":"pago"}' : '200 · aguardando (10 s)', b === LONGO_RESP ? 'acc' : 'dim', 0.4); }
    if (now >= LOJA_SABE) one(o, LOJA_SABE, PSPL(LOJA_SABE), 'webhook', 'acc', 0.25);
    return n;
  }
  // WebSocket: quadros a cada 5 s (seq 1, 2, 3...) pela mesma conexão
  function railsLena(o, now, { tela = 'APP DA LENA', sub = 'pedido 1048 · a caminho' } = {}) {
    o.rails.loja = R('LOJA', 'rastreio', [[0, q(now), 'posição do caminhão a cada 5 s', 'dim']]);
    o.rails.tela = R(tela, sub, [[0, q(now), 'mapa do rastreio', 'dim']]);
  }

  const STEPS = {
    curto: [
      { id: 'pix', dur: 6, clk: [0], title: 'O Davi gerou o Pix e agora espera', yk: 'NO APP DO DAVI · 14:05:00.000',
        yaml: ['POST /api/v1/pedidos', '→ 201 Created', 'Location: /api/v1/pedidos/1050', '# pedidos → pagamentos → PSP:', '#   cobrança c-7731 de 2890 centavos', '# a tela mostra o QR do Pix'],
        story: 'Às 14:05:00 o app do Davi cria o pedido 1050: a caneca azul (19.90) com o frete para SP (9.00), 28.90 no total. O pagamentos pede ao PSP uma cobrança Pix, a c-7731, e a tela mostra o QR. O Davi vai abrir o app do banco e pagar 23,4 s depois. Quem fica sabendo primeiro é o PSP; a tela não sabe de nada.',
        look: 'Um degrau sobe da tela até a loja e volta com 201; outro vai da loja ao PSP e cria a cobrança. A régua embaixo vai de 14:05:00 a 14:05:30.',
        key: 'A tela precisa de um jeito de saber que o dinheiro entrou.',
        f(o, t) { railsDavi(o, 0, 99);
          send(o, t, 0.3, 1.0, UP(0), 'POST /api/v1/pedidos', 'hi', 0.1);
          send(o, t, 1.1, 1.7, rev(UP(0)), '201 · pedido 1050', 'acc', 0.4);
          send(o, t, 2.0, 2.6, rev(PSPL(0)), 'cria a cobrança · 2890', 'hi', 0.1);
          const ok = send(o, t, 2.7, 3.2, PSPL(0), 'c-7731 · pendente', 'acc', 0.5);
          o.cnt = C3(['RELÓGIO', '14:05:00.000'], ['PEDIDO 1050', '28.90 · Pix'], ['COBRANÇA NO PSP', ok ? 'c-7731 · pendente' : '…']);
          o.res = t > 1.7 ? ['201 Created · pedido 1050', ok ? 'cobrança c-7731 criada no PSP' : ''] : [];
          if (t > 3.6) { T(o, onRail('tela', 4, 36), 'a tela mostra o QR\ne espera…', 'dim'); T(o, onRail('psp', 8, 34), 'o PSP vai saber primeiro', 'acc'); } } },
      { id: 'pergunta', dur: 7.5, clk: [0.5, 10.6, 0.4, 6.2], title: 'A cada 2 s a tela pergunta: e aí?', yk: 'NA TELA · a cada 2 s',
        yaml: ['setInterval(async () => {', '  const r = await fetch(', '    "/api/v1/pedidos/1050/status")', '  // {"status":"aguardando_pagamento"}', '}, 2000)'],
        story: 'O jeito mais simples é a tela perguntar de tempos em tempos. A cada 2 s ela manda GET /api/v1/pedidos/1050/status; a pergunta passa pelo gw-loja, que confere o JWT, chega ao pedidos e volta com {"status":"aguardando_pagamento"}. O artigo chama isso de olhar a caixa de correio: você vai até lá, abre, está vazia, volta.',
        look: 'Um degrau a cada 2 s na régua: sobe da tela, atravessa o gw-loja, toca a loja e volta apagado, sem novidade.',
        key: 'Short polling: o cliente pergunta num intervalo fixo, tenha ou não novidade.',
        f(o, t) { const n = curto(o, o.now);
          o.cnt = C3(['REQUISIÇÕES', String(n)], ['RESPOSTAS VAZIAS', String(n)], ['RELÓGIO', HORA(o.now)]);
          o.res = n ? ['200 OK', '{"status":"aguardando_pagamento"}'] : [];
          if (t > 6.6) T(o, onRail('tela', 6, 36), '5 perguntas, 5 vezes "ainda não"', 'dim'); } },
      { id: 'paga', dur: 8.5, clk: [10.6, 24.9, 0.4, 6.4], title: 'O Pix entra às 14:05:23.4; a tela vê às 24.0', yk: 'NA TELA · a 12ª pergunta',
        yaml: [STATUS, '→ 200 {"status":"aguardando_pagamento"}', '   … 11 vezes, de 14:05:02 a 14:05:22 …', STATUS + '   # 14:05:24', '→ 200 {"status":"pago"}'],
        story: 'As perguntas seguem: 12, 14, 16 s… Às 14:05:23.4 o Davi paga no app do banco e o PSP avisa a loja. Só que a tela perguntou às 22 s e só pergunta de novo às 24 s. É a 12ª pergunta que traz "pago". Das 12, 11 voltaram vazias, e a tela atualizou 0,6 s depois do pagamento.',
        look: 'A linha laranja do pagamento cruza a régua em 23,4; o degrau seguinte, em 24, volta aceso e a tela fica PAGO.',
        key: 'No short polling a notícia espera a próxima pergunta: até um intervalo inteiro de atraso.',
        f(o, t) { const n = curto(o, o.now), seen = o.now >= 24.68;
          o.cnt = C3(['REQUISIÇÕES', String(n)], ['RESPOSTAS VAZIAS', String(Math.min(n, 11))], ['ATRASO NA TELA', seen ? '0,6 s' : '…', seen ? 'acc' : '']);
          o.res = seen ? ['200 OK', '{"status":"pago"}  # às 14:05:24'] : n ? ['200 OK', '{"status":"aguardando_pagamento"}'] : [];
          if (seen) T(o, onRail('tela', 24, 36), '12ª pergunta: pago\n0,6 s depois', 'acc'); } },
      { id: 'media', dur: 7, clk: [24.9], title: 'A conta do intervalo', yk: 'INTERVALO × PERGUNTAS × ATRASO',
        yaml: ['a cada  perguntas  atraso do Davi  médio', '  1 s       24         0,6 s       0,5 s', '  2 s       12         0,6 s       1 s', '  5 s        5         1,6 s       2,5 s', '# o atraso médio é metade do intervalo'],
        story: 'O atraso depende de onde o pagamento cai entre duas perguntas. O do Davi caiu 0,6 s antes da 12ª; se tivesse caído logo depois da 11ª, às 22,1 s, ele esperaria 1,9 s. Em média, metade do intervalo: 1 s. Perguntar a cada 1 s corta o atraso médio para 0,5 s e dobra as perguntas.',
        look: 'O trecho aceso entre a linha do pagamento e o degrau de 24 s marca os 0,6 s; os 11 degraus apagados ficam à esquerda.',
        key: 'No short polling, menos atraso custa mais perguntas, na mesma proporção.',
        f(o, t) { curto(o, o.now); o.cursor = false;
          o.beams.push({ pts: [[TX(PAGO), RL.tela.y - 6, ZT + 1], [TX(24), RL.tela.y - 6, ZT + 1]], on: true, w: 5 });
          o.cnt = C3(['PERGUNTAS INÚTEIS', '11 de 12'], ['ATRASO DO DAVI', '0,6 s'], ['ATRASO MÉDIO', '1 s (metade de 2 s)']);
          o.res = ['a cada 1 s: 24 perguntas, 0,5 s em média'];
          if (t > 0.5) T(o, [TX(23.7), RL.tela.y - 6, 40], '0,6 s', 'acc');
          if (t > 1.6) T(o, onRail('tela', 11, 40), '11 perguntas sem novidade', 'dim'); } },
      { id: 'bf', dur: 9, clk: [24.9], title: 'E se der errado: 5.000 telas na Black Friday', yk: 'A CONTA DA BLACK FRIDAY',
        yaml: ['5.000 telas ÷ 2 s       = 2.500 req/s', '2.500 req/s × 2 ms      = 5 vCPU', 'pedidos: 3 réplicas × 1 = 3 vCPU', '2.500 × ~300 B (JWT)    = 750 KB/s', '# quase tudo para ouvir "ainda não"'],
        story: 'Agora multiplique. Na Black Friday são 5.000 telas esperando Pix ao mesmo tempo, cada uma perguntando a cada 2 s: 2.500 requisições por segundo. A 2 ms de CPU cada, são 5 vCPU só para responder "ainda não", e o pedidos tem 3 (3 réplicas de 1 vCPU, módulo 6). Cada pergunta ainda leva o JWT, ~300 B de ida e volta, e passa pela autenticação do gw-loja.',
        look: 'Os degraus se multiplicam até virar uma parede; a loja fica vermelha quando a conta passa de 3 vCPU.',
        key: 'Short polling custa por tela e por segundo, com ou sem novidade.',
        f(o, t) { curto(o, o.now); o.cursor = false;
          const k = clamp((t - 0.6) / 3.6), telas = Math.max(1, Math.round(k * k * 5000)), rps = telas / 2, cpu = rps * 0.002;
          const dens = Math.round(k * 150);
          for (let i = 0; i < dens; i++) { const ts = 0.1 + i * 0.2; o.beams.push({ pts: UP(ts), thin: true, on: true, tone: cpu > 3 ? 'bad' : '' }); }
          if (cpu > 3) { o.on.loja = 'bad'; o.rails.loja.sub = 'saturado'; }
          o.cnt = C3(['TELAS ESPERANDO', fmt(telas)], ['REQ/S NO PEDIDOS', fmt(rps), cpu > 3 ? 'bad' : ''], ['CPU', dec(cpu, 1) + ' vCPU de 3', cpu > 3 ? 'bad' : '']);
          o.res = cpu > 3 ? ['pedidos saturado: 5 vCPU pedidos, 3 existem', '750 KB/s só de perguntas'] : [];
          if (t > 4.6) T(o, onRail('loja', 15, 40), '2.500 req/s × 2 ms = 5 vCPU\no pedidos tem 3', 'bad'); } },
    ],
    longo: [
      { id: 'segura', dur: 7.5, clk: [0, 10.7, 0.4, 5.6], title: 'A tela pergunta e a loja segura a resposta', yk: 'NA TELA · long polling',
        yaml: [STATUS, '    ?aguardar=pago&timeout=10', '# o pedidos não responde na hora:', '#   segura até o status mudar', '#   ou até 10 s passarem'],
        story: 'O long polling (RFC 6202) muda uma coisa: a loja não responde na hora. A tela pergunta GET /api/v1/pedidos/1050/status?aguardar=pago&timeout=10 e o pedidos segura a requisição aberta até o status mudar ou 10 s passarem. Às 14:05:10 nada mudou: ele responde "aguardando" e a tela pergunta de novo na mesma hora.',
        look: 'Um degrau sobe às 14:05:00 e vira uma barra laranja que cresce na régua enquanto a loja segura; aos 10 s a resposta desce e outra pergunta sobe.',
        key: 'Long polling: a pergunta fica esperando do lado do servidor até ter resposta.',
        f(o, t) { const n = longo(o, o.now), a = o.now >= 10 ? 10 : 0;
          o.cnt = C3(['REQUISIÇÕES', String(n)], ['SEGURADA HÁ', dec(Math.max(0, o.now - a), 1) + ' s'], ['RELÓGIO', HORA(o.now)]);
          o.res = o.now >= 10 ? ['200 OK · 10 s depois', '{"status":"aguardando_pagamento"}'] : ['… (a loja ainda não respondeu)'];
          if (t > 1.2 && o.now < 10) T(o, [TX(Math.max(2.5, o.now / 2)), RL.loja.y + RL.loja.d + 7, 38], 'a loja segura a pergunta', 'acc');
          if (o.now >= 10.2) T(o, onRail('tela', 10, 38), '10 s sem novidade:\nresponde e a tela pergunta de novo', 'dim'); } },
      { id: 'pago', dur: 8.5, clk: [10.7, 24.3, 0.4, 6.4], title: 'O Pix entra e a resposta sai 50 ms depois', yk: 'NA LOJA · 3ª pergunta',
        yaml: ['# 3ª pergunta, aberta às 14:05:20:', STATUS + '?aguardar=pago', '# 14:05:23.4   o Davi paga', '# 14:05:23.45  o pedidos solta a resposta', '→ 200 {"status":"pago"}'],
        story: 'A segunda pergunta também estoura os 10 s, às 14:05:20, e a terceira começa. Às 14:05:23.4 o Davi paga; o webhook do PSP chega, o pedidos vê o status mudar e solta a requisição que estava segurando. A resposta sai às 14:05:23.45, uns 50 ms depois do pagamento. Desde 14:05:00 foram 3 perguntas em vez de 12, e a que trouxe a notícia já estava esperando.',
        look: 'A terceira barra para na linha do pagamento e o degrau de volta acende quase colado nela.',
        key: 'No long polling a resposta sai quando a notícia chega, não quando a tela pergunta.',
        f(o, t) { const n = longo(o, o.now), seen = o.now >= LONGO_RESP + 0.3;
          o.cnt = C3(['REQUISIÇÕES', String(n)], ['ATRASO NA TELA', seen ? '0,05 s' : '…', seen ? 'acc' : ''], ['RELÓGIO', HORA(o.now)]);
          o.res = seen ? ['200 OK · 14:05:23.45', '{"status":"pago"}'] : ['… (segurando)'];
          if (seen) T(o, onRail('tela', 15, 38), 'pago às 23.45\n~50 ms depois', 'acc'); } },
      { id: 'custo', dur: 7.5, clk: [24.3], title: 'O preço: uma conexão aberta por tela', yk: '5.000 TELAS, NINGUÉM PAGA',
        yaml: ['5.000 ÷ 10 s      = 500 req/s (pior caso)', '500 req/s × 2 ms  = 1 vCPU', '5.000 conexões abertas ao mesmo tempo', '= 5.000 goroutines + 5.000 descritores', 'limite padrão: 1.024 descritores'],
        story: 'Na Black Friday, com 5.000 telas e ninguém pagando, cada uma faz uma pergunta a cada 10 s: 500 req/s, 5 vezes menos que as 2.500 do short polling. O custo mudou de lugar. Agora são 5.000 conexões abertas ao mesmo tempo, cada uma com uma goroutine (módulo 11) e um descritor de arquivo, e o limite padrão de descritores por processo no Linux costuma ser 1.024.',
        look: 'Várias barras paralelas ficam abertas na loja ao mesmo tempo, uma por tela.',
        key: 'Long polling troca requisições por conexões abertas.',
        f(o, t) { longo(o, o.now); o.cursor = false; const k = clamp((t - 0.5) / 2.5), m = Math.round(k * 5);
          for (let i = 0; i < m; i++) { const a = (i * 3.7) % 10; o.beams.push({ pts: HOLD(a, 24.3, 6 + i * 3.4), thin: true, on: true }); }
          o.cnt = C3(['REQ/S (PIOR CASO)', '500'], ['CONEXÕES ABERTAS', fmt(Math.max(1, k * 5000))], ['LIMITE DE DESCRITORES', '1.024 (padrão)', 'bad']);
          o.res = ['short polling: 2.500 req/s', 'long polling: 500 req/s + 5.000 abertas'];
          if (t > 3.2) T(o, onRail('loja', 12, 42), '5.000 abertas: 1 goroutine\ne 1 descritor cada', 'acc'); } },
      { id: 'corte', dur: 8.5, clk: [0, 16.6, 0.4, 5.4], title: 'E se der errado: o gw-loja corta aos 15 s', yk: 'NA TELA · timeout=25',
        yaml: [STATUS, '    ?aguardar=pago&timeout=25', '# o gw-loja corta requisição parada há 15 s', '#   (o Envoy usa 15 s de timeout de rota)', '→ 504 Gateway Timeout   # aos 15 s', '# conserto: segurar 10 s (< 15 s)'],
        story: 'Alguém achou 10 s pouco e subiu para timeout=25. Só que entre a tela e o pedidos está o gw-loja, que corta qualquer requisição parada há 15 s (o Envoy tem 15 s de timeout de rota por padrão). Aos 15 s o gateway desiste e devolve 504 Gateway Timeout à tela, com todas as telas, toda vez. O conserto é a loja segurar menos que o menor timeout do caminho: 10 s.',
        look: 'A barra cresce até 15 s e fica vermelha; o degrau de volta sai do gw-loja, não da loja, com 504.',
        key: 'O servidor tem que soltar a resposta antes do menor timeout do caminho.',
        f(o, t) { railsDavi(o, o.now, 99, { gw: 'corta em 15 s' });
          const now = o.now, cut = now >= 15;
          one(o, 0, UP(0), STATUS.replace('/api/v1/pedidos', '…') + '?timeout=25', 'hi', 0.34);
          if (now > 0) bar(o, HOLD(0, Math.min(now, 15)), cut ? 'bad' : '');
          if (cut) { o.on.gw = 'bad'; o.rails.gw.segs = [[1, 9.6, 'corta em 15 s', 'dim'], [15, q(now), '504', 'bad']];
            one(o, 15, GWT(15), '504 Gateway Timeout', 'bad', 0.45); }
          o.cnt = C3(['SEGURANDO HÁ', dec(Math.min(now, 15), 1) + ' s', cut ? 'bad' : ''], ['TIMEOUT DO GW-LOJA', '15 s'], ['RESPOSTA À TELA', cut ? '504' : '…', 'bad']);
          o.res = cut ? ['504 Gateway Timeout', '(quem respondeu foi o gw-loja)'] : ['… (segurando, timeout=25)'];
          if (cut) T(o, [TX(12.5), RL.gw.y + RL.gw.d / 2, 36], 'gw-loja: 15 s parado → 504', 'bad');
          if (t > 6.6) T(o, onRail('tela', 23, 38), 'conserto: segurar 10 s,\nmenos que os 15 s do gw-loja', 'acc'); } },
    ],
    webhook: [
      { id: 'campainha', dur: 7.5, clk: [19.5, 23.7, 0.4, 3.6], title: 'O PSP toca a campainha', yk: 'DO PSP PARA A LOJA · 14:05:23.43',
        yaml: ['POST https://api.loja.com.br/webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=068149…e13a', '{"evento_id":"ev-8812","tipo":"cobranca.paga",', ' "cobranca_id":"c-7731","valor_centavos":2890,', ' "pago_em":"14:05:23"}', '# corpo: 112 bytes'],
        story: 'Em vez de alguém ficar perguntando, quem sabe avisa. Ao criar a cobrança, a loja deixou com o PSP um endereço: https://api.loja.com.br/webhooks/psp. Às 14:05:23.4 o Davi paga e, logo depois, às 14:05:23.43, o PSP faz um POST nesse endereço com o evento cobranca.paga. É o entregador que toca a campainha, em vez de você ir olhar a caixa de correio.',
        look: 'A linha do pagamento aparece no trilho do PSP e um degrau desce dele até a loja com os 112 bytes do evento.',
        key: 'Webhook: o outro sistema chama você quando o evento acontece.',
        f(o, t) { const now = o.now; railsDavi(o, now, 99, { loja: 'pagamentos · pedidos' });
          const r = now >= LOJA_SABE ? one(o, LOJA_SABE, PSPL(LOJA_SABE), 'POST /webhooks/psp · 112 B', 'acc', 0.6) : 0;
          o.cnt = C3(['DO PSP PARA A LOJA', r ? '1 requisição' : '0'], ['CORPO', '112 B'], ['RELÓGIO', HORA(now)]);
          o.res = r ? ['chegou: cobranca.paga · ev-8812'] : [];
          if (r === 2) T(o, onRail('loja', 13, 40), 'ev-8812: cobranca.paga\nc-7731 · 2890', 'acc'); } },
      { id: 'assina', dur: 7.5, clk: [23.7], title: 'A loja confere a assinatura e responde 200', yk: 'NO PAGAMENTOS · antes de acreditar',
        yaml: ['v1 = HMAC-SHA256(segredo,', '        "1792000000." + corpo)', '   = 068149…e13a   ✓ igual ao cabeçalho', 't = 1792000000: menos de 5 min   ✓', 'ev-8812: primeira vez → guarda', '→ 200 OK em ~30 ms'],
        story: 'Qualquer um na internet pode mandar um POST para esse endereço, então o pagamentos confere antes de acreditar. Ele calcula o HMAC-SHA256 de "1792000000." mais o corpo com o segredo combinado com o PSP e compara com o v1 do cabeçalho: bate. Vê que o t tem menos de 5 min, guarda o evento_id ev-8812 e responde 200 em ~30 ms.',
        look: 'As três conferências acendem na loja, uma de cada vez; depois o 200 sobe de volta ao PSP.',
        key: 'Webhook se confere: assinatura, idade do evento e evento_id, e só então 200.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          const n = t > 3.0 ? 3 : t > 2.0 ? 2 : t > 1.0 ? 1 : 0; if (n) o.on.loja = 1;
          const ok = send(o, t, 3.7, 4.4, rev(PSPL(LOJA_SABE)), '200 OK · ~30 ms', 'acc', 0.6);
          const L = ['HMAC-SHA256 confere ✓', 't < 5 min ✓', 'ev-8812 guardado ✓'].slice(0, n);
          if (n) T(o, onRail('loja', 11, 40), L.join('\n'), 'acc');
          o.cnt = C3(['ASSINATURA (HMAC)', n > 0 ? 'válida' : '…'], ['IDADE DO EVENTO', n > 1 ? '< 5 min' : '…'], ['RESPOSTA AO PSP', ok ? '200 · 30 ms' : '…']);
          o.res = ok ? ['200 OK', 'ev-8812 guardado'] : []; } },
      { id: 'tela', dur: 7.5, clk: [23.7], title: 'O webhook não chega na tela', yk: 'O CAMINHO DO AVISO',
        yaml: ['PSP → pagamentos        (webhook)', 'pagamentos → pedidos    1050 pago', 'pedidos → tela          (long polling)', '# o navegador não tem endereço', '#   público para receber o POST'],
        story: 'O webhook chega ao servidor da loja, não ao celular do Davi: o navegador não tem um endereço público para o PSP chamar. Depois do 200, o pagamentos avisa o pedidos, que marca o 1050 como pago e solta o long polling que a tela deixou aberto desde 14:05:20. O webhook cuida da ponta PSP → loja; a ponta loja → tela continua sendo long polling (ou WebSocket, na aula 6).',
        look: 'A barra do long polling, aberta desde 14:05:20, para no pagamento e devolve "pago" à tela.',
        key: 'Webhook é de servidor para servidor; até a tela, alguém ainda precisa esperar.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          one(o, 20, UP(20), '', 'dim'); bar(o, HOLD(20, LONGO_RESP));
          const ok = send(o, t, 0.8, 1.7, rev(UP(LONGO_RESP)), '200 {"status":"pago"}', 'acc', 0.8);
          if (ok) { o.rails.tela.segs = [[0, 23.4, 'aguardando pagamento', 'dim'], [23.4, 23.7, '', 'acc']]; o.on.tela = 1; }
          o.cnt = C3(['CAMINHO', 'PSP → loja → tela'], ['A TELA RECEBE POR', 'long polling'], ['WEBHOOKS NA TELA', '0']);
          o.res = ok ? ['pedidos → tela: {"status":"pago"}'] : [];
          if (t > 2) T(o, onRail('tela', 6, 38), 'a tela não recebe webhook:\nela esperava no long polling', 'dim');
          if (t > 1) T(o, [TX(20.5), RL.loja.y + RL.loja.d + 7, 40], 'long polling\naberto desde 14:05:20', 'acc'); } },
      { id: 'lento', dur: 10, clk: [23.4, 30.6, 0.4, 5.4], title: 'E se der errado: a loja demora 12 s e o PSP reenvia', yk: 'NO PSP · reenvio',
        yaml: ['# o pagamentos faz tudo antes do 200: 12 s', '# o PSP espera 5 s e dá como falha', '#   reenvia: 1 min, 5 min, 30 min', '14:06:28  POST /webhooks/psp  ev-8812', '# conserto: guardar o evento_id,', '#   responder 200 logo, processar depois'],
        story: 'Agora o pagamentos faz o trabalho todo antes de responder e leva 12 s. O PSP espera 5 s, às 14:05:28 dá a entrega como falha e agenda outra (no exemplo: depois de 1 min, 5 min e 30 min). Às 14:06:28 o ev-8812 chega de novo, e um pagamentos que não guardou o evento_id marca o 1050 como pago duas vezes e solta dois PedidoPago. O conserto: guardar o evento_id, responder 200 logo e processar depois (módulo 13).',
        look: 'A barra vermelha da loja passa do fim da régua; a do PSP para aos 5 s com falha; na ponta direita chega o mesmo ev-8812 outra vez.',
        key: 'Webhook chega pelo menos uma vez: pode chegar duas, e quem recebe tem que aguentar.',
        f(o, t) { const now = o.now; railsDavi(o, now, 99, { loja: 'pagamentos · pedidos' }); o.payTag = false;
          if (now >= LOJA_SABE) one(o, LOJA_SABE, PSPL(LOJA_SABE), 'ev-8812 · 1ª entrega', 'acc', 0.5);
          if (now > LOJA_SABE) { bar(o, LOJAP(LOJA_SABE, Math.min(now, 30.9)), 'bad'); o.on.loja = 'bad'; }
          const fail = now >= 28.43;
          if (now > LOJA_SABE) bar(o, PSPW(LOJA_SABE, Math.min(now, 28.43)), fail ? 'bad' : '');
          if (fail) { o.on.psp = 'bad'; T(o, onRail('psp', 24.5, 62), 'PSP: 5 s sem resposta\n→ falhou, reenvia em 1 min', 'bad'); }
          const again = t > 6.2 && send(o, t, 6.2, 7.0, PSPL(30.4), 'ev-8812 de novo · 14:06:28', 'bad', 9);
          if (t > 1.2 && now < 30) T(o, [TX(Math.max(LOJA_SABE + 2, (LOJA_SABE + now) / 2)), RL.loja.y - 7, 40], 'pagamentos processando…\n' + dec(Math.max(0, now - LOJA_SABE), 1) + ' s', 'bad');
          o.cnt = C3(['A LOJA RESPONDE EM', '12 s', 'bad'], ['O PSP ESPERA', '5 s'], ['ev-8812 RECEBIDO', again ? '2 vezes' : '1 vez', again ? 'bad' : '']);
          o.res = again ? ['1050 marcado pago 2 vezes', '2 eventos PedidoPago'] : fail ? ['PSP: entrega falhou', 'próxima tentativa: 14:06:28'] : [];
          if (again && t > 7.6) T(o, onRail('tela', 11, 38), 'conserto: guardar o evento_id\ne responder 200 logo', 'acc'); } },
      { id: 'falso', dur: 9, clk: [27.5], title: 'E se der errado: um webhook falso', yk: 'DE FORA · não é o PSP',
        yaml: ['POST /webhooks/psp', 'X-PSP-Signature: t=1792000000,v1=0000…', '{"tipo":"cobranca.paga", …}', '# sem conferir: o pedido sai de graça', '# conferindo: o HMAC não bate → 401'],
        story: 'O endereço do webhook não é segredo: aparece em log, em print, em configuração. Alguém o descobre e manda um cobranca.paga inventado, para um pedido que nunca foi pago. Um pagamentos que não confere a assinatura marca o pedido como pago, e a mercadoria sai de graça. Conferindo, o HMAC calculado com o segredo não bate com o v1 e a resposta é 401.',
        look: 'Um degrau vermelho entra pela direita, de fora do PSP; da primeira vez a loja aceita, da segunda devolve 401.',
        key: 'Sem conferir a assinatura, qualquer um se passa pelo PSP.',
        f(o, t) { railsDavi(o, o.now, 99, { loja: 'pagamentos · pedidos' }); o.cursor = false; o.payTag = false;
          o.beams.push({ pts: PSPL(LOJA_SABE), on: true });
          const FAKE = [[684, 107, Z], [TX(28), 107, Z], [TX(28), RL.loja.y, Z]];
          const a1 = send(o, t, 0.4, 1.6, FAKE, 'cobranca.paga · v1=0000…', 'bad', 0.2), b1 = a1 && t < 4.2;
          if (b1) { send(o, t, 1.8, 2.6, rev(FAKE), '200 · sem conferir', 'bad', 1.6); o.on.loja = 'bad'; }
          if (t > 2.4 && t < 4.2) T(o, onRail('loja', 25.6, 40), 'sem conferir:\npedido pago de graça', 'bad');
          const a2 = t > 4.4 && send(o, t, 4.4, 5.6, FAKE, 'cobranca.paga · v1=0000…', 'bad', 0.2);
          if (a2) send(o, t, 5.8, 6.6, rev(FAKE), '401 · HMAC não bate', 'acc', 9);
          if (t > 6.6) T(o, onRail('loja', 25.6, 40), 'conferindo: 401\no pedido continua pendente', 'acc');
          o.cnt = C3(['ORIGEM', 'não é o PSP', 'bad'], ['SEM CONFERIR', t > 2.4 ? 'pedido pago de graça' : '…', 'bad'], ['CONFERINDO', t > 6.6 ? '401 · HMAC não bate' : '…']);
          o.res = t > 6.6 ? ['401 Unauthorized', 'assinatura inválida'] : t > 2.4 ? ['200 OK (sem conferir)'] : []; } },
    ],
    websocket: [
      { id: 'handshake', dur: 7.5, clk: [0], title: 'Um GET que vira conexão', yk: 'HANDSHAKE (RFC 6455)',
        yaml: ['GET /rastreio/1048 HTTP/1.1', 'Upgrade: websocket · Connection: Upgrade', 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version: 13', '→ 101 Switching Protocols', 'Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo='],
        story: 'A Lena abre o rastreio do pedido 1048, que está a caminho. O app manda um GET comum com Upgrade: websocket e uma chave aleatória. A loja responde 101 Switching Protocols com o Sec-WebSocket-Accept (o SHA-1 da chave junto com um texto fixo da RFC 6455, em base64). Depois do 101, a mesma conexão TCP deixa de falar HTTP e passa a carregar quadros nos dois sentidos.',
        look: 'Um degrau sobe com o GET e volta com 101; dali sai uma faixa que fica aberta entre o app e a loja.',
        key: 'WebSocket começa como HTTP e vira uma conexão aberta nos dois sentidos.',
        f(o, t) { railsLena(o, 0); o.cursor = false;
          send(o, t, 0.3, 1.1, UP(0), 'GET /rastreio/1048 · Upgrade', 'hi', 0.1);
          const ok = send(o, t, 1.3, 2.0, rev(UP(0)), '101 Switching Protocols', 'acc', 0.6);
          if (ok) { const f = clamp((t - 2.2) / 1.6); if (f > 0) bar(o, WSB(0, f * 2.5)); o.on.tela = o.on.loja = 2; }
          o.cnt = C3(['REQUISIÇÕES HTTP', '1'], ['RESPOSTA', ok ? '101' : '…'], ['CONEXÃO', ok ? 'aberta' : '…']);
          o.res = ok ? ['101 Switching Protocols', 'a partir daqui: quadros'] : [];
          if (t > 3.8) T(o, [TX(4), 214, 36], 'a mesma conexão TCP,\nagora nos dois sentidos', 'acc'); } },
      { id: 'quadros', dur: 9.5, clk: [0.2, 30.6, 0.4, 7.4], title: 'A loja empurra a posição a cada 5 s', yk: 'QUADRO DE TEXTO · loja → app',
        yaml: ['{"pedido":1048,"lat":-8.0476,', ' "lng":-34.877,"eta_min":42}', '# 56 B de texto + 2 B de cabeçalho = 58 B', '# do app para a loja: + 4 B de máscara', '# a cada 20 s: ping → pong (está viva?)'],
        story: 'Agora quem fala primeiro é a loja. A cada 5 s ela empurra a posição do caminhão num quadro: o JSON tem 56 B e o cabeçalho do quadro, 2 B, então 58 B por mensagem. O app não pergunta nada. Aos 20 s a loja manda um ping e o app responde pong, só para saber que a conexão continua viva.',
        look: 'A faixa da conexão cresce pela régua; a cada 5 s um ponto desce da loja ao app, e aos 20 s um ping vai e um pong volta.',
        key: 'No WebSocket o servidor envia sem ser perguntado, com poucos bytes de cabeçalho.',
        f(o, t) { const now = o.now; railsLena(o, now); o.beams.push({ pts: UP(0), on: true });
          bar(o, WSB(0, now)); let n = 0;
          for (let k = 1; k <= 6; k++) { const ts = 5 * k; if (ts > now) break; n = k; one(o, ts, rev(UP(ts)), `quadro ${k} · 58 B`, 'acc', 0.45); }
          if (now >= 20.4) { one(o, 20.4, rev(UP(20.9)), 'ping', 'hi', 0.3); if (now >= 21.3) one(o, 21.3, UP(21.6), 'pong', 'hi', 0.3); }
          o.cnt = C3(['QUADROS RECEBIDOS', String(n)], ['BYTES', fmt(n * 58) + ' B'], ['REQUISIÇÕES HTTP', '1 (o GET do início)']);
          o.res = n ? ['quadro ' + n + ': 58 B', POS] : [];
          if (n >= 1 && now < 9) T(o, onRail('tela', 5, 38), POS.slice(0, 26) + '…\n56 B + 2 B de cabeçalho', 'acc'); } },
      { id: 'compara', dur: 8, clk: [30.6], title: 'Contra perguntar a cada 5 s', yk: 'BLACK FRIDAY · 1.000 PEDIDOS A CAMINHO',
        yaml: ['polling: GET /api/v1/pedidos/1048/posicao', '  190 B de pedido + 127 B de resposta = 317 B', 'WebSocket: 58 B por posição', '200 posições/s:', '  WebSocket 200 × 58 B  = ~11,6 KB/s', '  polling   200 × 317 B = ~63 KB/s'],
        story: 'Sem WebSocket, o app perguntaria GET /api/v1/pedidos/1048/posicao a cada 5 s: 190 B de pedido com o JWT e 127 B de resposta, 317 B por posição. Na Black Friday, com 1.000 pedidos a caminho, são 200 posições por segundo: ~11,6 KB/s pelo WebSocket contra ~63 KB/s perguntando, e 200 autenticações por segundo a menos no gw-loja.',
        look: 'Ao lado de cada quadro de 58 B aparece, apagado, o degrau de 317 B que o polling teria feito.',
        key: 'Para muitas mensagens pequenas, a conexão aberta economiza cabeçalho e autenticação.',
        f(o, t) { railsLena(o, o.now); o.cursor = false; o.beams.push({ pts: UP(0), on: true }); bar(o, WSB(0, 30.6));
          for (let k = 1; k <= 6; k++) o.beams.push({ pts: rev(UP(5 * k)), on: true });
          const g = t > 0.8; if (g) for (let k = 1; k <= 6; k++) o.beams.push({ pts: UP(5 * k - 1.1), thin: true, on: false });
          if (g) { T(o, [TX(13.9), 236, 40], 'polling: 317 B\n(e 1 JWT conferido)', 'dim'); T(o, [TX(20), 196, 40], 'WebSocket: 58 B', 'acc'); }
          o.cnt = C3(['WEBSOCKET', '~11,6 KB/s'], ['SHORT POLLING', '~63 KB/s'], ['AUTENTICAÇÕES NO GW', '0 contra 200/s']);
          o.res = ['1.000 pedidos a caminho', '200 posições por segundo']; } },
      { id: 'morta', dur: 12, clk: [0.2, 30.6, 0.4, 8.4], title: 'E se der errado: a conexão morre sem aviso', yk: 'NO APP · prazo e reconexão',
        yaml: ['# 17 s: o celular troca de 4G para Wi-Fi', '# a conexão morre sem FIN: ninguém avisa', '# 25 s: nada há 10 s → o app desiste dela', '# espera (backoff + jitter) e reconecta:', 'GET /rastreio/1048?ultimo_seq=3  → 101', '# a loja reenvia os quadros 4 e 5'],
        story: 'Aos 17 s o celular da Lena troca do 4G para o Wi-Fi. A conexão morre sem aviso, sem FIN, e o app fica olhando para uma conexão que parece aberta. Os quadros dos 20 e 25 s se perdem. Com um prazo (aqui, 10 s sem nada), o app percebe aos 25 s, espera um pouco (backoff com jitter) e reconecta dizendo o último quadro que recebeu, ultimo_seq=3. A loja reenvia o 4 e o 5.',
        look: 'A faixa fica vermelha aos 17 s; dois pontos descem e somem no meio; aos 26 s um degrau novo reabre a conexão e os quadros perdidos chegam juntos.',
        key: 'Conexão aberta pode estar morta: ping com prazo, reconexão e retomada pelo número da mensagem.',
        f(o, t) { const now = o.now; railsLena(o, now); o.beams.push({ pts: UP(0), on: true });
          bar(o, WSB(0, Math.min(now, 17)));
          if (now > 17) o.beams.push({ pts: WSB(17, Math.min(now, 26)), thin: true, on: true, tone: 'bad' });
          let got = 0, lost = 0;
          for (let k = 1; k <= 3; k++) if (5 * k <= now) { got = k; one(o, 5 * k, rev(UP(5 * k)), `quadro ${k} · 58 B`, 'acc', 0.45); }
          for (const ts of [20, 25]) if (ts <= now) { lost++; const half = [[TX(ts), RL.loja.y + RL.loja.d, Z], [TX(ts), 214, Z]];
            if (one(o, ts, half, `quadro ${ts / 5}: perdido`, 'bad', 0.45) === 2) o.beams.push({ pts: half, on: true, tone: 'bad', w: 3 }); }
          if (now >= 17) T(o, [TX(17), 214, 40], '17 s: 4G → Wi-Fi\nmorreu sem FIN', 'bad');
          if (now >= 25) T(o, onRail('tela', 25, 38), '25 s: nada há 10 s\n→ reconecta', 'acc');
          let state = now < 17 ? 'aberta' : now < 25 ? 'morta (ninguém sabe)' : now < 26 ? 'reconectando' : 'retomada no 4';
          if (now >= 26) { rung(o, 26, UP(26), 'GET …/1048?ultimo_seq=3', '101', 'acc', 0.3); bar(o, WSB(26, now)); lost = 0;
            if (now >= 26.6) { one(o, 26.6, rev(UP(26.6)), 'quadros 4 e 5 (reenvio)', 'acc', 0.45); got = 5; }
            if (now >= 30) { one(o, 30, rev(UP(30)), 'quadro 6', 'acc', 0.45); got = 6; } }
          o.cnt = C3(['QUADROS PERDIDOS', String(lost), lost ? 'bad' : ''], ['ÚLTIMO QUE CHEGOU', got ? 'seq ' + got : '…'], ['CONEXÃO', state, now >= 17 && now < 26 ? 'bad' : '']);
          o.res = now >= 26.6 ? ['ultimo_seq=3 → reenvia 4 e 5', 'nada se perdeu'] : now >= 20 ? ['quadros saindo para uma conexão morta'] : []; } },
      { id: 'massa', dur: 9.5, clk: [0], title: 'E se der errado: 1.000 reconexões no mesmo segundo', yk: 'DEPLOY · o pod do rastreio reinicia',
        yaml: ['# 1.000 apps perdem a conexão juntos', 'sem jitter: todos voltam em ~1 s', '  → 1.000 handshakes + 1.000 JWT', 'com jitter de 0 a 30 s na espera:', '  1.000 ÷ 30 s = ~33 reconexões/s'],
        story: 'Um deploy reinicia o pod que segura as conexões do rastreio, e os 1.000 apps de pedidos a caminho perdem a conexão no mesmo instante. Se todos esperam o mesmo tempo para reconectar, são 1.000 handshakes e 1.000 conferências de JWT no mesmo segundo. Com jitter, um sorteio de 0 a 30 s na espera, as voltas se espalham: ~33 por segundo.',
        look: 'Uma coluna vermelha de 1.000 reconexões sobe no primeiro segundo; depois ela se desfaz em 30 colunas baixas, ~33 em cada.',
        key: 'Reconexão precisa de jitter, senão todos voltam ao mesmo tempo.',
        f(o, t) { railsLena(o, 30, { tela: '1.000 APPS', sub: 'pedidos a caminho' }); o.cursor = false;
          o.rails.loja.segs = [[0, 30, 'reconexões por segundo', 'dim']]; o.rails.tela.segs = [];
          const up = ease(clamp((t - 0.4) / 1.6)), down = ease(clamp((t - 4.2) / 1.0)), spread = ease(clamp((t - 5.0) / 1.4));
          const cy = RL.loja.y + RL.loja.d / 2, ZB = PL + RL.loja.h;
          if (down < 1) { const h = 130 * up * (1 - down); if (h > 0.5) o.cols.push({ pts: [[TX(0.5), cy, ZB], [TX(0.5), cy, ZB + h]], tone: 'bad' }); }
          if (spread > 0) for (let k = 0; k < 30; k++) o.cols.push({ pts: [[TX(k + 0.5), cy, ZB], [TX(k + 0.5), cy, ZB + 4.3 * spread]], tone: '' });
          if (t > 2.0 && t < 4.6) { T(o, [TX(0.5) + 60, cy, 150], 'sem jitter: 1.000 no 1º segundo', 'bad'); o.on.loja = 'bad'; }
          if (t > 6.2) T(o, onRail('loja', 15, 40), 'jitter de 0 a 30 s: ~33 por segundo', 'acc');
          o.cnt = C3(['CONEXÕES PERDIDAS', '1.000'], ['PICO SEM JITTER', '1.000 em 1 s', 'bad'], ['COM JITTER 0–30 S', t > 6.2 ? '~33 por segundo' : '…']);
          o.res = t > 6.2 ? ['1.000 ÷ 30 s = ~33 reconexões/s'] : t > 2 ? ['1.000 handshakes no mesmo segundo'] : []; } },
    ],
    comparar: [
      { id: 'regua', dur: 8, clk: [30], title: 'Os quatro na mesma régua', yk: 'QUANDO CADA UM FICA SABENDO',
        yaml: ['pagamento:      14:05:23.4', 'short polling   vê às 24.0    (+0,6 s)', 'long polling    vê às 23.45   (+~0,05 s)', 'webhook         a loja sabe às 23.43', 'WebSocket       a loja empurra assim que sabe'],
        story: 'Mesmo pagamento, mesma régua. O short polling vê o "pago" na próxima pergunta, 0,6 s depois (1 s em média). O long polling e o WebSocket entregam assim que a loja sabe, dezenas de milissegundos depois. O webhook é a peça de trás: é ele que faz a loja saber às 14:05:23.43 sem ter que perguntar ao PSP.',
        look: 'A linha do pagamento atravessa as quatro faixas; em cada uma, o trecho aceso começa quando aquele jeito ficou sabendo.',
        key: 'Para a tela, o atraso depende de quando ela pergunta; para a loja, de quem avisa.',
        f(o, t) { lanes(o, 'atraso');
          o.cnt = C3(['SHORT POLLING', '+0,6 s'], ['LONG · WEBSOCKET', '+~0,05 s'], ['WEBHOOK → LOJA', '+0,03 s']);
          o.res = ['pagamento às 14:05:23.4'];
          if (t > 0.8) T(o, [TX(25.6), RL.lc.y + RL.lc.d / 2, 34], '+0,6 s', 'acc'); } },
      { id: 'carga', dur: 8.5, clk: [30], title: '5.000 telas: quanto cada um custa', yk: '5.000 TELAS, NINGUÉM PAGA',
        yaml: ['short polling   2.500 req/s · 5 vCPU', 'long polling      500 req/s · 1 vCPU', 'WebSocket           0 req/s · só pings', 'webhook: 1 POST do PSP por pagamento', '# o pedidos tem 3 vCPU = 1.500 req/s'],
        story: 'Agora a carga, com 5.000 telas e ninguém pagando. O short polling faz 2.500 req/s e pede 5 vCPU a um pedidos que tem 3. O long polling faz 500 req/s, 1 vCPU. O WebSocket não faz requisição nenhuma depois do handshake, só pings pequenos. O webhook nem entra nessa conta: ele vem do PSP, 1 POST por pagamento, não por tela.',
        look: 'Na ponta de cada faixa sobe uma coluna do tamanho das req/s; a do short polling passa da marca de 3 vCPU e fica vermelha.',
        key: 'Perguntar custa por tela e por segundo; conexão aberta custa por tela, mesmo parada.',
        f(o, t) { lanes(o, 'carga'); o.payTag = false; const k = ease(clamp((t - 0.4) / 2)), H = v => 110 * v / 2500;
          const col = (lane, v, tone = '') => { const cy = RL[lane].y + RL[lane].d / 2; if (v * k > 0) o.cols.push({ pts: [[COLX, cy, PL], [COLX, cy, PL + H(v) * k]], tone }); };
          col('lc', 2500, k * 2500 > 1500 ? 'bad' : ''); col('ll', 500); col('lw', 0); col('ls', 0);
          const cy = RL.lc.y + RL.lc.d / 2; o.beams.push({ pts: [[COLX - 12, cy, PL + H(1500)], [COLX + 12, cy, PL + H(1500)]], on: true, tone: 'bad', thin: true });
          if (t > 2.4) { T(o, [COLX, cy, PL + 122], '2.500 req/s', 'bad'); T(o, [COLX, RL.ll.y + RL.ll.d / 2, PL + 34], '500', 'acc'); T(o, [COLX - 130, RL.lc.y + RL.lc.d / 2, PL + H(1500)], '3 vCPU = 1.500 req/s', 'bad'); }
          if (k > 0.6) o.on.lc = 'bad';
          o.cnt = C3(['SHORT POLLING', '2.500 req/s', 'bad'], ['LONG POLLING', '500 req/s'], ['WEBSOCKET', '0 req/s']);
          o.res = ['short: 5 vCPU (há 3) · long: 1 vCPU']; } },
      { id: 'aberto', dur: 9, clk: [30], title: 'E se der errado: conexões demais num processo', yk: 'LONG POLLING E WEBSOCKET',
        yaml: ['5.000 conexões = 5.000 descritores', 'limite padrão: 1.024 por processo', '# da 1.025ª em diante, o Go registra:', 'http: Accept error: accept4:', '  too many open files', '# conserto: subir o limite e usar réplicas'],
        story: 'Long polling e WebSocket trocam requisições por conexões abertas, e cada conexão é um descritor de arquivo no processo. Com o limite padrão de 1.024 descritores, a 1.025ª tela nem consegue conectar: o accept falha com "too many open files" enquanto as outras funcionam. O conserto é subir o limite (ulimit -n) e espalhar as conexões por várias réplicas.',
        look: 'As faixas do long polling e do WebSocket ficam vermelhas e as colunas de conexões passam da marca de 1.024; short polling e webhook não seguram nada aberto.',
        key: 'Conexão aberta é recurso do processo: conte descritores, memória e réplicas.',
        f(o, t) { lanes(o, 'aberto'); o.payTag = false; const k = ease(clamp((t - 0.4) / 2)), H = v => 110 * v / 5000;
          for (const lane of ['ll', 'ls']) { const cy = RL[lane].y + RL[lane].d / 2;
            o.cols.push({ pts: [[COLX, cy, PL], [COLX, cy, PL + Math.max(0.5, H(5000) * k)]], tone: k * 5000 > 1024 ? 'bad' : '' });
            o.beams.push({ pts: [[COLX - 12, cy, PL + H(1024)], [COLX + 12, cy, PL + H(1024)]], on: true, tone: 'ink', thin: true });
            if (k * 5000 > 1024) o.on[lane] = 'bad'; }
          if (t > 2.6) { T(o, [COLX, RL.ll.y + RL.ll.d / 2, PL + 124], '5.000 abertas', 'bad'); T(o, [COLX - 46, RL.ls.y + RL.ls.d / 2, PL + 30], 'limite 1.024', 'dim'); }
          if (t > 4) T(o, [TX(9), RL.ls.y + RL.ls.d / 2, 40], '1.025ª: too many open files', 'bad');
          o.cnt = C3(['CONEXÕES PEDIDAS', fmt(Math.max(1, k * 5000))], ['LIMITE PADRÃO', '1.024', 'bad'], ['ERRO DA 1.025ª', t > 4 ? 'too many open files' : '…', 'bad']);
          o.res = t > 4 ? ['accept4: too many open files', 'conserto: ulimit -n e réplicas'] : []; } },
    ],
  };
  // as quatro faixas do Comparar (o mesmo Pix, o que cada jeito mostra na régua)
  function lanes(o, kind) { o.cursor = false;
    const sub = { atraso: ['+0,6 s · média 1 s', '+~0,05 s', '+0,03 s até a loja', '+~0,05 s'], carga: ['2.500 req/s · 5 vCPU', '500 req/s · 1 vCPU', '1 POST por pagamento', '0 req/s · só pings'],
      aberto: ['0 conexões paradas', '5.000 abertas', '0 (é do PSP)', '5.000 abertas'] }[kind];
    o.rails.lc = R('SHORT POLLING', sub[0], [[0, 24, 'pergunta a cada 2 s', 'dim'], [24, 30, 'PAGO', 'acc']], { marks: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(v => [v, 'dim']).concat([[24, 'acc']]) });
    o.rails.ll = R('LONG POLLING', sub[1], [[0, LONGO_RESP, 'segura até 10 s por pergunta', 'dim'], [LONGO_RESP, 30, 'PAGO', 'acc']], { spans: [[0, 10, 'dim'], [10, 20, 'dim'], [20, LONGO_RESP, 'acc']], marks: [[LONGO_RESP, 'acc']] });
    o.rails.lw = R('WEBHOOK', sub[2], [[0, LOJA_SABE, 'a loja espera o PSP chamar', 'dim'], [LOJA_SABE, 30, 'a loja sabe', 'acc']], { marks: [[LOJA_SABE, 'acc']] });
    o.rails.ls = R('WEBSOCKET', sub[3], [[0, LONGO_RESP, 'conexão aberta, sem perguntas', 'dim'], [LONGO_RESP, 30, 'PAGO', 'acc']], { spans: [[0, 30, 'dim']], marks: [[LONGO_RESP, 'acc']] });
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
    x.textAlign = 'left'; x.fillText(ws ? 'TEMPO' : 'HORA', u(5), u(Hh / 2)); cv.tex.needsUpdate = true; }
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
    lbl('RESPOSTA', 8, 154);
    const res = o.res.filter(Boolean);
    (res.length ? res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !res.length ? INK() : /^(5|4)\d\d|perdid|saturad|falhou|too many|2 vezes|2 eventos|morta/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.6, Wd - 16); x.fillText(l, u(8), u(167 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">2 ms de CPU por pergunta, ~300 B por pergunta com o JWT, o reenvio em 1, 5 e 30 min, o prazo de 10 s do app e o backoff de 1 s são números de exemplo do módulo, na ordem de grandeza real.</li>';
  const DATA = {
    curto: () => `<li>Pergunta: <b>${STATUS}</b> a cada <b>2 s</b> → <b>{"status":"aguardando_pagamento"}</b></li><li>Pagamento às <b>14:05:23.4</b>; a 12ª pergunta, às <b>14:05:24</b>, traz <b>pago</b>: <b>12 requisições, 11 vazias</b>, atraso de <b>0,6 s</b> (em média, metade do intervalo: 1 s)</li><table class="h3-sum"><tr><th>Black Friday</th><th>conta</th></tr><tr><td>telas</td><td>5.000 ÷ 2 s = <b>2.500 req/s</b></td></tr><tr class="on"><td>CPU</td><td>2.500 × 2 ms = <b>5 vCPU</b> (o pedidos tem 3)</td></tr><tr><td>rede</td><td>2.500 × ~300 B = 750 KB/s</td></tr></table>${EX}`,
    longo: () => `<li>Pergunta: <b>${STATUS}?aguardar=pago&amp;timeout=10</b> (RFC 6202)</li><li>Perguntas às 14:05:00, :10 e :20; o pagamento às <b>14:05:23.4</b> solta a 3ª às <b>14:05:23.45</b> (~50 ms)</li><table class="h3-sum"><tr><th>5.000 telas</th><th>short</th><th>long</th></tr><tr><td>req/s (pior caso)</td><td>2.500</td><td><b>500</b></td></tr><tr><td>vCPU (2 ms cada)</td><td>5</td><td><b>1</b></td></tr><tr class="on"><td>conexões abertas</td><td>0</td><td>5.000</td></tr></table><li>Limite padrão de descritores por processo: <b>1.024</b>. O gw-loja corta requisição parada há <b>15 s</b> (o Envoy tem 15 s de timeout de rota): segurar <b>10 s</b>, nunca 25.</li>${EX}`,
    webhook: () => `<li><b>POST https://api.loja.com.br/webhooks/psp</b> às 14:05:23.43, corpo de <b>112 B</b>: <b>${EV.replace(/"/g, '&quot;')}</b></li><li><b>X-PSP-Signature: t=1792000000,v1=068149938cba8e09bb177226c07dc4123cf00f012211374b314e534c05eee13a</b> = HMAC-SHA256 (RFC 2104) de "1792000000." + corpo com o segredo de exemplo <b>segredo-de-exemplo</b></li><li>A loja confere a assinatura, o <b>t</b> (menos de 5 min) e o <b>evento_id</b>; responde <b>200 em ~30 ms</b>.</li><li>E se der errado: resposta em <b>12 s</b> → o PSP desiste aos <b>5 s</b> e reenvia (1 min, 5 min, 30 min) → ev-8812 chega <b>2 vezes</b>; webhook falso sem conferir → pedido de graça; reenvio fora de ordem (<b>pendente</b> depois de <b>paga</b>) → usar a versão do evento (módulo 11).</li>${EX}`,
    websocket: () => `<li>Handshake: <b>GET /rastreio/1048</b> + <b>Upgrade: websocket</b> → <b>101 Switching Protocols</b>, <b>Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=</b> (RFC 6455)</li><li>Quadro: <b>${POS}</b> = 56 B + 2 B = <b>58 B</b> (do app para a loja, +4 B de máscara: 62 B)</li><table class="h3-sum"><tr><th>1.000 pedidos a caminho</th><th>por segundo</th></tr><tr class="on"><td>WebSocket</td><td>200 × 58 B = ~11,6 KB/s</td></tr><tr><td>polling (190 + 127 B)</td><td>200 × 317 B = ~63 KB/s</td></tr></table><li>Ping a cada 20 s; fechamento com quadro close (código 1000). Reconexão com backoff, jitter e <b>ultimo_seq</b>; 1.000 reconexões com jitter de 0 a 30 s = ~33/s.</li><li>Se só o servidor fala, Server-Sent Events também serve (reconecta sozinho com Last-Event-ID).</li>${EX}`,
    comparar: () => `<table class="h3-sum"><tr><th></th><th>quem inicia</th><th>atraso</th><th>5.000 telas</th></tr><tr><td>short polling</td><td>a tela, a cada 2 s</td><td>0,6 s (média 1 s)</td><td>2.500 req/s · 5 vCPU</td></tr><tr><td>long polling</td><td>a tela; a loja segura</td><td>~50 ms</td><td>500 req/s · 5.000 abertas</td></tr><tr><td>webhook</td><td>o PSP</td><td>~30 ms até a loja</td><td>1 POST por pagamento</td></tr><tr><td>WebSocket</td><td>a loja empurra</td><td>~50 ms</td><td>0 req/s · 5.000 abertas</td></tr></table><li>O webhook não chega ao navegador: ele faz a loja saber; a tela ainda usa long polling ou WebSocket.</li>${EX}`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="${SCFULL[v]} (tecla ${i + 1})">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="e3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk)}</b>${esc(s.yaml.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'espera') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    if (o.pay && o.payTag !== false) PAYT.set('Davi paga · 14:05:23.4', 'acc').at(TX(PAGO), sc === 'comparar' ? RL.lc.y - 2 : RL.psp.y + RL.psp.d / 2, sc === 'comparar' ? 30 : 32); else PAYT.hide();
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(350, 180, -150), dist: innerWidth < 640 ? 13 : 15 } : { target: W(160, 180, 60), dist: 13 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
