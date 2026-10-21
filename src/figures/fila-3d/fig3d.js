// Figura 3D (iso-glow): filas, exchanges e tópicos MQTT. A fila é um corredor com as mensagens em fila indiana,
// a exchange é uma estação de triagem que copia a mensagem para as filas certas, e o broker MQTT é um tablado com a
// árvore de tópicos (loja → entregas → caminhao-17 → posicao) por onde o pacote anda.
// Cena: atrás, o mostrador (contadores, a mensagem ou o pacote real e o resultado); no meio e na frente, quem produz,
// as filas (ou a árvore) e quem consome. A peça ativa acende; o que dá errado fica vermelho.
// Cenários (toggle e ?mode=fifo|lote|dlq|mqtt|lab-mqtt|exchange|lab-amqp; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-assincrona-brief.md) e o código do lab público
// (exemplos/protocolos-assincronos: queue/, stack/, messages/mqtt/default/, messages/rabbit-mq/{default,topic,fanout}/).
FIGS3D.push({ id: 'fila', name: 'Filas e exchanges', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const hop = (a, b, f, h = 34) => { const p = mix(a, b, f); p[2] += Math.sin(Math.PI * clamp(f)) * h; return p; };
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['fifo', 'lote', 'dlq', 'mqtt', 'lab-mqtt', 'exchange', 'lab-amqp'];
  const SCNAME = { fifo: 'FIFO', lote: 'Lote', dlq: 'DLQ', mqtt: 'MQTT', 'lab-mqtt': 'Lab MQTT', exchange: 'Exchange', 'lab-amqp': 'Lab AMQP' };
  const SCFULL = { fifo: 'Fila (FIFO) e pilha (LIFO)', lote: 'Lotes (batches)', dlq: 'DLQ e poison message', mqtt: 'MQTT: o caminhão',
    'lab-mqtt': 'MQTT: o lab', exchange: 'AMQP: a exchange emails', 'lab-amqp': 'AMQP: o lab' };
  const A3 = 'aula-3-conceitos-de-mensageria-fifo-lifo-dlqs-e-batches';
  const AULA = { fifo: A3, lote: A3, dlq: A3, mqtt: 'aula-7-mqtt', 'lab-mqtt': 'aula-8-mqtt-exemplo', exchange: 'aula-9-amqp', 'lab-amqp': 'aula-10-amqp-exemplo' };
  let clk = 0, sc = 'fifo', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-fila3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, ZA = PL + 26, ZL = PL + 6, ZX = PL + 30, ZB = PL + 8, ZN = ZB + 12, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 600, 12, 211, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(594, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 22, SZ + 207.5, 592, 203.5, 4, g0), SK = 592 / 416;
  // blocos: cada um tem tamanho fixo; o lugar vem do cenário (desliza quando muda) e quem sai afunda na base
  function block(nm, w, d, h, kind, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'node' ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, kind, key: '', f: 0, pos: null };
  }
  const B = {};
  block('prod', 140, 100, 26, 'actor'); block('cons', 190, 100, 26, 'actor'); block('side', 190, 100, 26, 'actor'); block('cons2', 190, 100, 26, 'actor');
  block('fila', 476, 100, 6, 'lane', 4); block('fila2', 476, 90, 6, 'lane', 4); block('pilha', 190, 110, 6, 'lane');
  block('exch', 150, 150, 30, 'exch'); ['qa', 'qb', 'qc'].forEach(n => block(n, 330, 80, 6, 'lane', 4));
  block('broker', 500, 300, 8, 'slab', 3);
  for (let i = 0; i < 6; i++) block('n' + i, 92, 40, 12, 'node', 6);
  const NAMES = Object.keys(B);
  // mensagens: cartões que andam pelos corredores; a pilha usa cartões altos, com o nome na frente
  const CW = 70, CD = 46, CH = 10, SW = 170, SD = 62, SH = 16;
  const CARDS = Array.from({ length: 22 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, CW, CD, CH, 3, mat, g); const top = faceCanvas('top', 1.5, 1.5, CH, CW - 3, CD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.28); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  const STK = Array.from({ length: 3 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, SW, SD, SH, 4, mat, g); const top = faceCanvas('top', 2, 2, SH, SW - 4, SD - 4, 5, g); const fr = faceCanvas('front', 3, SD, SH - 2, SW - 6, SH - 4, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, fr, glow, key: '' }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 90 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 8 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
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

  // ── rótulos que olham para a câmera (balões fixos e textos que viajam com o pacote) ──
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
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(10.5), tag(10.5)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // balão no canto livre de trás de cada cenário (nunca em cima dos cartões)
  const TR = () => sc === "exchange" || sc === "lab-amqp" ? [790, 30, 75] : sc === "mqtt" || sc === "lab-mqtt" ? [800, 30, 85] : [740, 60, 34];

  // ── lugares de cada cenário (canto de trás-esquerda de cada bloco) ──
  const NODEP = { n0: [196, 250], n1: [314, 250], n2: [432, 200], n3: [432, 300], n4: [550, 160], n5: [550, 240] };
  const L1 = { prod: [24, 300], fila: [196, 300], cons: [690, 300], pilha: [690, 150], cons2: [690, 160] };
  const LX = { prod: [24, 200], exch: [184, 175], qa: [352, 110], qb: [352, 205], qc: [352, 300], side: [700, 130], cons: [700, 290] };
  const LAY = { fifo: L1, lote: L1, dlq: { fila: [196, 300], cons: [690, 300], side: [690, 160], fila2: [196, 170] },
    mqtt: { prod: [24, 300], broker: [184, 120], side: [700, 140], cons: [700, 290], ...NODEP }, 'lab-mqtt': { prod: [24, 300], broker: [184, 120], side: [700, 220], n0: NODEP.n0, n1: NODEP.n1 },
    exchange: LX, 'lab-amqp': LX };
  const SHOW = { fifo: ['prod', 'fila', 'cons'], lote: ['prod', 'fila', 'cons'], dlq: ['fila', 'cons', 'side', 'fila2'],
    mqtt: ['prod', 'broker', 'side', 'n0', 'n1', 'n2', 'n3', 'n4', 'n5'], 'lab-mqtt': ['prod', 'broker', 'side', 'n0', 'n1'],
    exchange: ['prod', 'exch', 'qa', 'qb', 'qc', 'side', 'cons'], 'lab-amqp': ['prod', 'exch', 'qa', 'side'] };
  // pontos de cada cenário (centros, com a altura do topo)
  const LY = 359, SX = i => 630 - i * 78, PRODP = [94, 350, ZA], CONSP = [785, 350, ZA], TAIL = [240, LY, ZL];
  const PILHAP = [785, 205], DLQY = 224, PROVP = [785, 210, ZA], CONS2P = [785, 210, ZA];
  const XP = { prod: [94, 250, ZA], exch: [259, 250, ZX], prov: [795, 180, ZA], aud: [795, 340, ZA] }, QY = { qa: 159, qb: 254, qc: 349 }, QX = i => 640 - i * 58;
  const TRUCK = [94, 330, ZA], ND = nm => [NODEP[nm][0] + 46, NODEP[nm][1] + 20, ZN];
  const ZT = ZB + 9, P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  const R = {
    // fila e lote
    p2f: P3([[164, 350], [196, 350]]), f2c: P3([[672, 350], [690, 350]]),
    // dlq
    c2v: P3([[785, 300], [785, 260]], 20), c2d: P3([[700, 300], [700, 282], [672, 282], [672, 240]]),
    // mqtt
    t2n0: P3([[164, 330], [180, 330], [180, 270], [196, 270]], ZT), e01: P3([[288, 270], [314, 270]], ZT),
    e12: P3([[406, 270], [419, 270], [419, 220], [432, 220]], ZT), e13: P3([[419, 270], [419, 320], [432, 320]], ZT),
    e24: P3([[524, 220], [537, 220], [537, 180], [550, 180]], ZT), e25: P3([[537, 220], [537, 260], [550, 260]], ZT),
    n4r: P3([[642, 180], [700, 180]], ZT), n5r: P3([[642, 260], [671, 260], [671, 220], [700, 220]], ZT), n4t: P3([[642, 190], [684, 190], [684, 330], [700, 330]], ZT),
    n1c: P3([[406, 270], [700, 270]], ZT),
    // exchange
    p2x: P3([[164, 250], [184, 250]]), x2a: P3([[334, 240], [343, 240], [343, 159], [352, 159]]), x2b: P3([[334, 254], [352, 254]]),
    x2c: P3([[334, 262], [343, 262], [343, 349], [352, 349]]), a2v: P3([[682, 159], [700, 159]]), b2v: P3([[682, 254], [691, 254], [691, 215], [700, 215]]),
    c2a: P3([[682, 349], [700, 349]]), s2c: P3([[795, 230], [795, 290]]),
  };
  const rev = pts => pts.slice().reverse();

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows });
  const lane = (name, meta) => ({ name, meta });
  const node = (name, sub = '') => ({ name, sub });
  function base() {
    const o = { show: {}, pos: { ...LAY[sc] }, on: {}, rows: {}, beams: [], tags: [], msgs: [], cards: [], stk: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    if (sc === 'fifo' || sc === 'lote') {
      o.rows.prod = act('PEDIDOS', 'produtor', ['põe na fila', 'dim']); o.rows.cons = act('NOTIFICACOES', 'consumidor', ['lê do começo', 'dim']);
      o.rows.fila = lane('FILA emails', 'entra no fim → sai no começo'); o.rows.pilha = lane('PILHA desfazer 1051', 'LIFO');
      o.rows.cons2 = act('NOTIFICACOES-2', 'outra réplica', ['lê da mesma fila', 'dim']);
      o.beams.push({ pts: R.p2f }, { pts: R.f2c });
    }
    if (sc === 'dlq') {
      o.rows.fila = lane('FILA emails', 'entra no fim → sai no começo'); o.rows.fila2 = lane('FILA emails.dlq', 'mensagens mortas · alerta se > 0');
      o.rows.cons = act('NOTIFICACOES', 'consumidor', ['manda o e-mail', 'dim']); o.rows.side = act('PROVEDOR', 'de e-mail', ['100 e-mails/s', 'dim']);
      o.beams.push({ pts: R.f2c }, { pts: R.c2v, need: ['side'] }, { pts: R.c2d, need: ['fila2'] });
    }
    if (sc === 'mqtt' || sc === 'lab-mqtt') {
      o.rows.broker = { name: 'BROKER MQTT', meta: 'Mosquitto · porta 1883' };
      o.rows.prod = act('caminhao-17', '4G', ['leva o pedido 1048', 'dim'], ['posição a cada 5 s', 'dim']);
      o.rows.side = act('RASTREIO', 'assinante', ['loja/entregas/+/posicao', 'acc']); o.rows.cons = act('TELA 1048', 'a Lena abre', ['assina o caminhão', 'dim']);
      o.rows.n0 = node('loja'); o.rows.n1 = node('entregas'); o.rows.n2 = node('caminhao-17'); o.rows.n3 = node('+ outros', '200 na Black Friday');
      o.rows.n4 = node('posicao'); o.rows.n5 = node('status');
      if (sc === 'mqtt') o.beams.push({ pts: R.t2n0 }, { pts: R.e01 }, { pts: R.e12 }, { pts: R.e13 }, { pts: R.e24 }, { pts: R.e25 }, { pts: R.n4r }, { pts: R.n5r });
      else { o.rows.prod = act('producer.go', 'QoS 1', ['producer-<unix>', 'dim'], ['1 mensagem por s', 'dim']); o.rows.side = act('consumer.go', 'QoS 1', ['assina linuxtips/iot', 'acc'], ['CleanSession(true)', 'dim']);
        o.rows.n0 = node('linuxtips'); o.rows.n1 = node('iot'); o.beams.push({ pts: R.t2n0 }, { pts: R.e01 }, { pts: R.n1c }); }
    }
    if (sc === 'exchange' || sc === 'lab-amqp') {
      o.rows.prod = act('NOTIFICACOES', 'produtor', ['publica na exchange', 'dim']); o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['roteia pela', 'dim'], ['routing key', 'dim']);
      o.rows.qa = lane('emails.transacionais', 'email.pedido.*'); o.rows.qb = lane('emails.promocionais', 'email.promo.#'); o.rows.qc = lane('emails.auditoria', 'email.#');
      o.rows.side = act('PROVEDOR', 'de e-mail', ['100 e-mails/s', 'dim']); o.rows.cons = act('AUDITORIA', 'consumidor', ['guarda cópia de tudo', 'dim']);
      o.beams.push({ pts: R.p2x }, { pts: R.x2a, need: ['qa'] }, { pts: R.x2b, need: ['qb'] }, { pts: R.x2c, need: ['qc'] }, { pts: R.a2v, need: ['qa', 'side'] }, { pts: R.b2v, need: ['qb', 'side'] }, { pts: R.c2a, need: ['qc', 'cons'] });
      if (sc === 'lab-amqp') { o.rows.prod = act('producer.go', 'streadway/amqp', ['porta 5672', 'dim']); o.rows.side = act('consumer.go', 'auto-ack false', ['d.Ack(true)', 'dim']); }
    }
    return o;
  }
  const C = (o, p, lab, sub = '', tone = '', s = 1) => o.cards.push({ p, lab, sub, tone, s });
  const S = (o, p, lab, sub = '', tone = '', s = 1) => o.stk.push({ p, lab, sub, tone, s });
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o texto do dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.6) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    return f >= 1;
  }
  const lit = (o, pts, tone) => o.beams.push({ pts, on: true, tone });
  // cartão que sai do produtor, entra pelo fim do corredor e anda até a vaga i
  const enq = (t, t0, x, y = LY, s = 1, from = PRODP, tail = TAIL) => { const f = clamp((t - t0) / 1.1);
    return f < 0.4 ? hop(from, [tail[0], y, ZL], ease(f / 0.4), 30) : mix([tail[0], y, ZL], [x, y, ZL], ease((f - 0.4) / 0.6)); };

  // ── o que se vê em cada passo ──
  const QUEUE_GO = ['type Queue []interface{}', 'func (q *Queue) Enqueue(item interface{}) {', '  *q = append(*q, item)   // no fim', '}', 'func (q *Queue) Dequeue() interface{} {', '  item := (*q)[0]; *q = (*q)[1:]   // do começo'];
  const STACK_GO = ['type Stack []interface{}', 'func (s *Stack) Push(item interface{}) {', '  *s = append(*s, item)   // no topo', '}', 'func (s *Stack) Pop() interface{} {', '  item := (*s)[len(*s)-1]   // do topo'];
  const ORD = [1049, 1050, 1051];
  const STEPS = {
    fifo: [
      { id: 'enqueue', dur: 5.5, title: 'Enqueue: 1049, 1050 e 1051 entram pelo fim', yk: 'NO LAB · queue/main.go', code: QUEUE_GO,
        story: 'O pedidos põe na fila emails um aviso para cada pedido pago: primeiro o 1049, depois o 1050, por último o 1051 da Lena. Enqueue põe cada um no fim da fila. O 1049 anda até o começo; os outros param atrás dele, na ordem em que chegaram.',
        look: 'Três cartões saem do PEDIDOS e entram pelo fim do corredor. O 1049 vai até a frente, perto do NOTIFICACOES.',
        key: 'Fila (FIFO): o primeiro que entra é o primeiro que sai.',
        f(o, t) { let n = 0; ORD.forEach((id, k) => { const t0 = 0.4 + k * 1.3; if (t < t0) return; n++; C(o, enq(t, t0, SX(k)), String(id), 'e-mail', t < t0 + 1.1 ? 'acc' : ''); });
          if (n) { o.on.prod = 1; o.on.fila = 2; o.rows.prod = act('PEDIDOS', 'produtor', ['põe na fila', 'dim'], [`Enqueue(${ORD[n - 1]})`, 'acc']); }
          o.cnt = [['NA FILA', String(n)], ['ÚLTIMO A ENTRAR', n ? String(ORD[n - 1]) : '—', 'dim'], ['ORDEM', 'FIFO', 'dim']];
          o.res = n ? ['fila: [' + ORD.slice(0, n).join(' ') + ']'] : [];
          if (t > 4.3) T(o, TR(), 'ordem de chegada\n1049 → 1050 → 1051'); } },
      { id: 'dequeue', dur: 6.5, title: 'Dequeue: sai o primeiro que entrou', yk: 'NO LAB · queue/main.go', code: QUEUE_GO,
        story: 'Agora o notificacoes lê. Dequeue tira sempre do começo da fila: sai o 1049, os de trás andam uma vaga, sai o 1050, depois o 1051. É o que o lab faz com Pizza, Hamburger e Churrasco: saem na mesma ordem em que entraram.',
        look: 'O cartão da frente pula para o NOTIFICACOES; os outros andam uma vaga para frente. A lista SAÍRAM cresce 1049, 1050, 1051.',
        key: 'Dequeue tira do começo; a ordem de saída é a de chegada.',
        f(o, t) { const out = [];
          ORD.forEach((id, k) => { const tk = 0.5 + k * 1.8, slid = ORD.slice(0, k).reduce((a, _, j) => a + sg(t, 0.5 + j * 1.8 + 0.5, 0.5 + j * 1.8 + 1.1), 0);
            if (t < tk) return C(o, [SX(k - slid), LY, ZL], String(id), 'e-mail');
            if (t < tk + 0.8) { o.on.cons = 1; return C(o, hop([SX(0), LY, ZL], CONSP, ease((t - tk) / 0.8), 34), String(id), 'Dequeue()', 'acc'); }
            out.push(id); if (t < tk + 1.5) { o.on.cons = 1; C(o, CONSP, String(id), 'enviado', 'acc'); } });
          const cur = out.length ? out[out.length - 1] : null;
          if (cur) o.rows.cons = act('NOTIFICACOES', 'consumidor', [`Dequeue() → ${cur}`, 'acc'], ['e-mail enviado', 'dim']);
          o.cnt = [['SAÍRAM', out.length ? out.join(' ') : '—'], ['NA FILA', String(3 - out.length), 'dim'], ['ORDEM', 'a de chegada', 'dim']];
          o.res = out.length ? ['Output: ' + out.join(', ')] : [];
          if (out.length === 3) T(o, TR(), 'saiu 1049 → 1050 → 1051\na mesma ordem'); } },
      { id: 'pilha', dur: 5.5, title: 'Pilha (LIFO): as ações do 1051 empilham', yk: 'NO LAB · stack/main.go', code: STACK_GO,
        story: 'A pilha faz o contrário da fila: sai o que entrou por último. O lugar certo dela na loja é o desfazer. Para o pedido 1051, a loja fez três coisas em ordem: pagar, reservar estoque e criar a remessa. Cada uma vai para o topo da pilha.',
        look: 'Ao lado da fila, três cartões altos caem um em cima do outro: pagar embaixo, criar remessa no topo.',
        key: 'Pilha (LIFO): o último que entra é o primeiro que sai.',
        f(o, t) { o.show.pilha = 1; o.on.pilha = 2; const acts = ['pagar', 'reservar estoque', 'criar remessa']; let n = 0;
          acts.forEach((a, k) => { const t0 = 0.4 + k * 1.3; if (t < t0) return; n++; const f = sg(t, t0, t0 + 0.8);
            S(o, [PILHAP[0], PILHAP[1], ZL + k * SH + (1 - f) * 120], a, `Push · ${k + 1}º`, k === n - 1 ? 'acc' : ''); });
          o.cnt = [['NA PILHA', String(n)], ['TOPO', n ? acts[n - 1] : '—', 'dim'], ['ORDEM', 'LIFO', 'dim']];
          o.res = n ? ['topo: ' + acts[n - 1]] : [];
          if (t > 4.2) T(o, TR(), 'topo: criar remessa'); } },
      { id: 'desfazer', dur: 7, title: 'Desfazer: sai o de cima primeiro', yk: 'NO LAB · stack/main.go', code: STACK_GO,
        story: 'Se o 1051 precisar ser desfeito, a ordem certa é a inversa. Pop tira do topo: primeiro cancela a remessa, depois devolve o estoque, por último estorna o pagamento. É o mesmo Churrasco, Hamburger, Pizza do lab, e é a compensação que o módulo 19 vai usar.',
        look: 'Os cartões saem do topo da pilha, um por vez, e viram as ações de desfazer no corredor, da frente para trás.',
        key: 'O desfazer sai na ordem inversa: LIFO.',
        f(o, t) { o.show.pilha = 1; o.rows.fila = lane('DESFAZER 1051', 'ordem de saída →'); const acts = ['pagar', 'reservar estoque', 'criar remessa'], undo = ['estornar pagamento', 'devolver estoque', 'cancelar remessa'];
          const DX = [590, 434, 278], out = [];
          acts.forEach((a, k) => { const j = 2 - k, tj = 0.5 + j * 1.8, home = [PILHAP[0], PILHAP[1], ZL + k * SH];
            if (t < tj) return S(o, home, a, `Push · ${k + 1}º`, k === 2 - Math.min(2, Math.floor(Math.max(0, t - 0.5) / 1.8)) ? 'acc' : '');
            const f = clamp((t - tj) / 1.0), p = hop(home, [DX[j], LY, ZL], ease(f), 50); out.push(undo[k]);
            S(o, p, f < 0.5 ? a : undo[k], f < 0.5 ? 'Pop()' : `${j + 1}º a sair`, f < 1 ? 'acc' : '', 0.85); });
          o.on.pilha = out.length < 3 ? 1 : 0; o.on.fila = out.length ? 2 : 0;
          o.cnt = [['NA PILHA', String(3 - out.length)], ['SAIU', out.length ? out[out.length - 1] : '—', 'dim'], ['ORDEM', 'inversa', 'dim']];
          o.res = out.length ? ['Output: ' + out.slice(0, 2).join(', ') + (out.length > 2 ? ',' : ''), out[2] || ''] : [];
          if (out.length === 3 && t > 6) T(o, TR(), 'remessa → estoque → pagamento\nordem inversa'); } },
      { id: 'lento', dur: 6, title: 'E se der errado: um consumidor lento segura a fila', yk: 'NA FILA emails', code: ['# o e-mail do 1049 demora no provedor', 'Dequeue() → 1049   // processando…', '# 1050 e 1051 esperam atrás dele', '# a ordem está garantida,', '# e o preço é esperar'],
        story: 'A garantia de ordem tem preço. O provedor demora para aceitar o e-mail do 1049, e o notificacoes fica parado nele. O 1050 e o 1051 estão prontos, mas a fila só entrega o próximo quando o primeiro termina.',
        look: 'O 1049 fica vermelho em cima do NOTIFICACOES; o 1050 e o 1051 continuam parados no corredor.',
        key: 'Numa fila com um consumidor, o lento segura todos os de trás.',
        f(o, t) { const tk = 0.4, gone = t > tk;
          if (!gone) C(o, [SX(0), LY, ZL], '1049', 'e-mail'); else { o.on.cons = 'bad'; C(o, hop([SX(0), LY, ZL], CONSP, sg(t, tk, tk + 0.8), 34), '1049', 'processando', t > tk + 0.8 ? 'bad' : 'acc'); }
          C(o, [SX(1), LY, ZL], '1050', 'esperando', t > 1.6 ? 'bad' : ''); C(o, [SX(2), LY, ZL], '1051', 'esperando', t > 1.6 ? 'bad' : '');
          if (gone) o.rows.cons = act('NOTIFICACOES', 'consumidor', ['1049: processando…', 'bad'], ['o provedor não responde', 'dim']);
          o.cnt = [['ESPERANDO', t > 1.2 ? '2' : '0', t > 1.2 ? 'bad' : ''], ['NO CONSUMIDOR', gone ? '1049' : '—', 'dim'], ['SAÍRAM', '0', 'dim']];
          o.res = t > 1.6 ? ['1050 e 1051 parados atrás do 1049'] : [];
          if (t > 2) T(o, TR(), '1050 e 1051 prontos\nmas a fila espera o 1049', 'bad'); } },
      { id: 'dois', dur: 7, title: 'E se der errado: dois consumidores embaralham a ordem', yk: 'NA FILA emails', code: ['# 2 réplicas lendo a mesma fila', 'réplica 1: Dequeue() → 1049 (lento)', 'réplica 2: Dequeue() → 1050', 'réplica 2: Dequeue() → 1051', 'réplica 1: termina o 1049', '# saída: 1050, 1051, 1049'],
        story: 'A saída óbvia é pôr uma segunda réplica do notificacoes lendo a mesma fila. A fila anda de novo, mas a ordem some: a réplica 2 pega o 1050 e o 1051 e termina antes de a réplica 1 acabar o 1049. A fila entrega em ordem; quem processa é que não termina em ordem.',
        look: 'O NOTIFICACOES-2 aparece atrás e leva o 1050 e o 1051; o 1049 sai por último. A ORDEM DE SAÍDA fica vermelha.',
        key: 'Vários consumidores na mesma fila perdem a ordem global.',
        f(o, t) { o.show.cons2 = 1; const out = [];
          if (t < 0.4) C(o, [SX(0), LY, ZL], '1049', 'e-mail'); else if (t < 5.4) { o.on.cons = 'bad'; C(o, hop([SX(0), LY, ZL], CONSP, sg(t, 0.4, 1.2), 34), '1049', 'processando', t > 1.2 ? 'bad' : 'acc'); }
          [[1050, 1.6], [1051, 3.2]].forEach(([id, tk], j) => { const slid = sg(t, 0.9, 1.4) + (j ? sg(t, tk - 1.0, tk - 0.5) : 0);
            if (t < tk) return C(o, [SX(j + 1 - slid), LY, ZL], String(id), 'e-mail');
            if (t < tk + 0.8) { o.on.cons2 = 1; return C(o, hop([SX(0), LY, ZL], CONS2P, ease((t - tk) / 0.8), 40), String(id), 'réplica 2', 'acc'); }
            out.push(id); if (t < tk + 1.3) C(o, CONS2P, String(id), 'enviado', 'acc'); });
          if (t > 5.4) { out.push(1049); if (t < 6.2) C(o, CONSP, '1049', 'enviado', 'acc'); }
          o.rows.cons = act('NOTIFICACOES', 'réplica 1', t > 5.4 ? ['1049: enviado', 'acc'] : ['1049: processando…', 'bad']);
          o.rows.cons2 = act('NOTIFICACOES-2', 'réplica 2', [out.filter(v => v !== 1049).length ? `enviou ${out.filter(v => v !== 1049).join(', ')}` : 'lê da mesma fila', out.length ? 'acc' : 'dim']);
          const bad = out.length && out[0] !== 1049;
          o.cnt = [['ORDEM DE SAÍDA', out.length ? out.join(' ') : '—', bad ? 'bad' : ''], ['ORDEM DE CHEGADA', '1049 1050 1051', 'dim'], ['RÉPLICAS', '2', 'dim']];
          o.res = out.length === 3 ? ['saiu 1050, 1051, 1049: ordem perdida'] : [];
          if (out.length === 3) T(o, TR(), 'saída: 1050 → 1051 → 1049\na ordem global se perdeu', 'bad'); } },
    ],
    lote: [
      { id: 'dia', dur: 7, title: 'Lote no processamento: o fechamento das 23:00', yk: 'O BATCH DO MÓDULO 11', code: ['-- 23:00, uma vez por dia', 'SELECT … FROM itens_pedido', ' WHERE dia = hoje;   -- 400 mil linhas', '# 1 núcleo: 40 + 2 = 42 s', '# 4 núcleos: 10 + 2 = 12 s'],
        story: 'Lote tem dois sentidos. O primeiro é processar em lote: o fechamento das 23:00 do módulo 11 junta o dia inteiro, 400 mil linhas de itens_pedido, e processa tudo de uma vez. Em 4 núcleos leva 12 s, e o resumo do dia fica pronto às 23:00:12.',
        look: 'O corredor vira itens_pedido do dia e enche enquanto o relógio anda; às 23:00 tudo pula de uma vez para o RELATORIOS.',
        key: 'Processamento em lote: junta tudo e processa de uma vez, no horário marcado.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'o dia inteiro', ['grava itens_pedido', 'dim']); o.rows.fila = lane('itens_pedido do dia', 'junta e espera as 23:00');
          o.rows.cons = act('RELATORIOS', 'roda às 23:00', ['4 núcleos', 'dim']);
          const day = clamp((t - 0.3) / 3.7), hh = Math.floor(day * 23), lines = Math.round(day * 400), run = t > 4.2, done = t > 5.2;
          const n = Math.min(6, Math.ceil(day * 6));
          for (let i = 0; i < n && t < 5.3; i++) { const p = [SX(i), LY, ZL]; C(o, run ? hop(p, CONSP, sg(t, 4.2 + i * 0.05, 5.0 + i * 0.05), 40) : p, 'linhas', `${(i + 1) * 66} mil`, run ? 'acc' : '', 0.9); }
          if (t > 0.3 && !run) { o.on.prod = 2; o.on.fila = 2; }
          if (run && !done) o.on.cons = 1; if (done) { o.rows.cons = act('RELATORIOS', '23:00:12', ['400 mil linhas em 12 s', 'acc'], ['resumo do dia gravado', 'dim']); o.on.cons = 2; }
          o.cnt = [['HORA', run ? (done ? '23:00:12' : '23:00') : `${String(hh).padStart(2, '0')}:00`], ['LINHAS', `${lines} mil`, 'dim'], ['TEMPO DO LOTE', done ? '12 s' : '—', 'dim']];
          o.res = done ? ['resumo do dia pronto às 23:00:12'] : [];
          if (done) T(o, TR(), '400 mil linhas\n12 s em 4 núcleos'); } },
      { id: 'sem', dur: 5.5, title: 'Sem lote no envio: uma requisição por evento', yk: 'PRODUTOR KAFKA · p0', code: ['linger.ms = 0', '# cada evento sai sozinho', '40 eventos/s na p0 → 40 envios/s', '3 partições → 120 envios/s'],
        story: 'O segundo sentido é o lote no envio, uma decisão do produtor. Na Black Friday chegam 40 eventos por segundo em cada partição do tópico pedidos. Se cada evento vai sozinho para o broker, são 40 requisições por segundo só na p0, 120 nas três partições.',
        look: 'Cada evento sai do PEDIDOS e pula sozinho até o kafka-1, um atrás do outro.',
        key: 'Sem lote, cada evento custa uma requisição.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'produtor Kafka', ['linger.ms = 0', 'acc']); o.rows.fila = lane('SEM LOTE · linger.ms = 0', 'cada evento sai sozinho');
          o.rows.cons = act('kafka-1', 'líder da p0', ['recebe 40 envios/s', 'acc']); o.on.prod = 2; o.on.cons = 1;
          for (let j = Math.max(0, Math.floor((t - 1.3) / 0.3)); j <= Math.floor((t - 0.3) / 0.3); j++) { const tj = 0.3 + j * 0.3; if (t < tj || t > tj + 1) continue;
            C(o, hop(PRODP, CONSP, ease(t - tj), 50), 'evento', '1 envio', 'acc', 0.6); }
          lit(o, R.p2f); lit(o, R.f2c);
          o.cnt = [['ENVIOS/s NA p0', '40'], ['EVENTOS POR ENVIO', '1', 'dim'], ['NAS 3 PARTIÇÕES', '120 envios/s', 'dim']];
          o.res = ['120 requisições por segundo'];
          if (t > 2) T(o, TR(), '40 eventos/s = 40 envios/s\nsó na p0'); } },
      { id: 'linger', dur: 8, title: 'linger.ms = 200: 8 eventos por envio', yk: 'PRODUTOR KAFKA · p0', code: ['linger.ms = 200', '40 eventos/s × 0,2 s = 8 por lote', '1 s ÷ 0,2 s = 5 envios/s na p0', '3 partições: 15 envios/s (em vez de 120)', '# batch.size (padrão 16384) é em bytes'],
        story: 'Com linger.ms = 200, o produtor espera até 200 ms antes de mandar, e junta o que chegar nesse tempo. A 40 eventos por segundo, chegam 8 em 200 ms. Em vez de 40 envios por segundo na p0 são 5, e 15 no total: 8× menos requisições, ao custo de até 200 ms de atraso.',
        look: 'Os eventos enchem o corredor LOTE até 8; quando o relógio bate 200 ms, os 8 pulam juntos para o kafka-1.',
        key: 'Lote no envio: menos requisições em troca de um pouco de espera.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'produtor Kafka', ['linger.ms = 200', 'acc']); o.rows.fila = lane('LOTE · linger.ms = 200', 'junta até 200 ms');
          o.rows.cons = act('kafka-1', 'líder da p0', ['recebe 5 lotes/s', 'acc']); o.on.prod = 2;
          const ph = Math.max(0, t - 0.4) % 2.0, cyc = Math.floor(Math.max(0, t - 0.4) / 2.0), fill = ph < 1.6, n = fill ? Math.min(8, Math.floor(ph / 0.2) + (t > 0.4 ? 1 : 0)) : 8;
          for (let i = 0; i < n; i++) { const slot = [628 - i * 54, LY, ZL], ti = i * 0.2;
            const p = fill ? (ph < ti + 0.25 ? hop(PRODP, slot, ease((ph - ti) / 0.25), 26) : slot) : hop(slot, CONSP, sg(ph, 1.6, 1.95), 46);
            if (!fill && ph > 1.95) continue; C(o, p, 'evento', fill ? `${i + 1} de 8` : 'lote', fill ? '' : 'acc', 0.7); }
          o.on.fila = fill ? 2 : 1; if (!fill) { o.on.cons = 1; lit(o, R.f2c); }
          const ms = fill ? Math.round(ph / 1.6 * 200) : 200;
          o.cnt = [['NO LOTE', `${n} de 8`], ['ESPERA', `${ms} ms`, 'dim'], ['ENVIOS/s NA p0', '5', 'dim']];
          o.res = cyc > 0 || !fill ? ['15 envios/s em vez de 120: 8× menos'] : [];
          if (!fill) T(o, TR(), 'lote de 8\n1 envio'); } },
      { id: 'baixo', dur: 6, title: 'E se der errado: o PedidoPago espera 200 ms por nada', yk: 'PRODUTOR KAFKA · p0', code: ['linger.ms = 200', '# madrugada: quase nenhum evento', 'PedidoPago 1051 entra no lote vazio', '# ninguém mais chega em 200 ms', '→ sai sozinho, 200 ms depois'],
        story: 'O lote cobra o atraso mesmo quando não há lote para fazer. Com tráfego baixo, o PedidoPago do 1051 entra sozinho e espera os 200 ms inteiros. Nenhum outro evento chega, e ele sai sozinho, 200 ms mais tarde. O linger.ms é uma troca entre vazão e atraso.',
        look: 'Um cartão só fica parado no corredor LOTE enquanto a ESPERA sobe até 200 ms; depois pula sozinho para o kafka-1.',
        key: 'linger.ms alto com pouco tráfego só acrescenta atraso.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'produtor Kafka', ['linger.ms = 200', 'acc']); o.rows.fila = lane('LOTE · linger.ms = 200', 'tráfego baixo');
          o.rows.cons = act('kafka-1', 'líder da p0', ['esperando o lote', 'dim']);
          const slot = [628, LY, ZL], ms = Math.round(clamp((t - 0.8) / 3.8) * 200), sent = t > 4.6;
          if (t > 0.4) C(o, sent ? hop(slot, CONSP, sg(t, 4.6, 5.3), 46) : t < 0.8 ? hop(PRODP, slot, ease((t - 0.4) / 0.4), 26) : slot, 'PedidoPago', '1051', sent ? 'acc' : t > 1.5 ? 'bad' : '', 0.9);
          if (t > 0.4 && !sent) o.on.fila = 'bad'; if (sent) { o.on.cons = 1; lit(o, R.f2c); o.rows.cons = act('kafka-1', 'líder da p0', ['lote de 1 evento', 'bad'], ['200 ms depois', 'dim']); }
          o.cnt = [['ESPERA', `${ms} ms`, ms > 50 ? 'bad' : ''], ['NO LOTE', t > 0.4 ? '1' : '0', 'dim'], ['GANHO', 'nenhum', 'dim']];
          o.res = sent ? ['+200 ms no pagamento da Lena, por nada'] : [];
          if (t > 2) T(o, TR(), 'sozinho no lote\nespera os 200 ms', 'bad'); } },
    ],
    dlq: [
      { id: 'falha', dur: 6, title: 'O e-mail do 1051 falha: 550', yk: 'MENSAGEM NA FILA emails', code: ['{ "pedido_id": 1051,', '  "tipo": "confirmacao",', '  "para": "Lena" }', '', 'provedor → 550 endereço inválido'],
        story: 'Agora uma mensagem que não dá certo. O notificacoes tira da fila o e-mail de confirmação do 1051 e entrega ao provedor. O provedor responde 550 endereço inválido. Atrás do 1051, outros e-mails esperam a vez.',
        look: 'O cartão 1051 pula para o NOTIFICACOES, a luz vai ao PROVEDOR e volta vermelha com o 550.',
        key: 'Uma mensagem que falha não pode simplesmente sumir nem travar a fila.',
        f(o, t) { const tk = 0.4; C(o, t < tk ? [SX(0), LY, ZL] : hop([SX(0), LY, ZL], CONSP, sg(t, tk, tk + 0.8), 34), '1051', 'e-mail', t > 3 ? 'bad' : t > tk ? 'acc' : '');
          [1, 2, 3].forEach(i => C(o, [SX(i - sg(t, 0.9, 1.4)), LY, ZL], 'e-mail', 'outro pedido'));
          if (t > tk) o.on.cons = t > 3 ? 'bad' : 1;
          send(o, t, 1.4, 2.0, R.c2v, 'e-mail 1051', 'acc', 0.2); if (t > 1.8 && t < 3) o.on.side = 1;
          if (send(o, t, 2.4, 3.0, rev(R.c2v), '550 endereço inválido', 'bad', 1.2)) { o.rows.cons = act('NOTIFICACOES', 'consumidor', ['1051: 550', 'bad'], ['endereço inválido', 'dim']); }
          o.cnt = [['TENTATIVAS', '0 de 3'], ['TEMPO', '0 s', 'dim'], ['NA DLQ', '0', 'dim']];
          o.res = t > 3 ? ['falhou: 550 endereço inválido'] : [];
          if (t > 3.4) T(o, TR(), '550 endereço inválido', 'bad'); } },
      { id: 'retry', dur: 9.5, title: '3 tentativas: espera 1 s, 5 s e 30 s', yk: 'TENTATIVAS DO NOTIFICACOES', code: ['falha → espera 1 s  → tentativa 1 → 550', '       espera 5 s  → tentativa 2 → 550', '       espera 30 s → tentativa 3 → 550', '# esperas cada vez maiores (backoff)', '# 1 + 5 + 30 = 36 s depois da 1ª falha'],
        story: 'Uma falha pode ser passageira, então o notificacoes tenta de novo. Espera 1 s e tenta: 550. Espera 5 s e tenta: 550. Espera 30 s e tenta pela terceira vez: 550. Trinta e seis segundos depois da primeira falha, o endereço continua inválido.',
        look: 'A luz vai e volta três vezes entre o NOTIFICACOES e o PROVEDOR, sempre vermelha. O TEMPO pula de 1 s para 6 s e 36 s.',
        key: 'Tentar de novo resolve falhas passageiras; esta não é.',
        f(o, t) { C(o, CONSP, '1051', 'e-mail', 'bad'); [1, 2, 3].forEach(i => C(o, [SX(i - 1), LY, ZL], 'e-mail', 'esperando'));
          const W_ = [1, 5, 30], AT = [0.6, 3.4, 6.2]; let n = 0, tm = 0;
          AT.forEach((a, k) => { if (t < a) return; tm = W_.slice(0, k + 1).reduce((x, y) => x + y, 0);
            send(o, t, a + 0.9, a + 1.4, R.c2v, `tentativa ${k + 1}`, 'acc', 0.1); if (send(o, t, a + 1.7, a + 2.2, rev(R.c2v), '550', 'bad', 0.4)) n = k + 1;
            if (t > a + 1.3 && t < a + 2.2) o.on.side = 1; });
          o.on.cons = 'bad'; const wait = AT.findIndex((a, k) => t >= a && t < a + 0.9);
          o.rows.cons = act('NOTIFICACOES', 'consumidor', [wait >= 0 ? `espera ${W_[wait]} s` : n ? `tentativa ${n}: 550` : 'falhou: 550', 'bad'], [`${n} de 3 tentativas`, 'dim']);
          o.cnt = [['TENTATIVAS', `${n} de 3`, n ? 'bad' : ''], ['TEMPO', `${tm} s`, 'dim'], ['NA DLQ', '0', 'dim']];
          o.res = n === 3 ? ['3 tentativas, 3 vezes 550'] : [];
          if (n === 3) T(o, TR(), 'tentativa 3 de 3: 550\n36 s depois', 'bad'); } },
      { id: 'dlq', dur: 7, title: 'Vai para emails.dlq; a fila segue', yk: 'MENSAGEM NA emails.dlq', code: ['{ "pedido_id": 1051,', '  "tipo": "confirmacao",', '  "motivo": "550 endereço inválido",', '  "tentativas": 3 }', '# alerta: emails.dlq > 0'],
        story: 'Esgotadas as 3 tentativas, o notificacoes manda a mensagem para emails.dlq, a fila de mensagens mortas, com o motivo junto. A fila principal volta a andar e os outros e-mails saem. Alguém olha a DLQ depois: ela tem alerta se passar de 0.',
        look: 'O cartão 1051 pula para o corredor emails.dlq e fica lá, vermelho. Os outros e-mails andam e saem para o PROVEDOR.',
        key: 'A DLQ tira a mensagem ruim da frente e guarda o motivo para alguém olhar.',
        f(o, t) { const p0 = CONSP, p1 = [SX(0), DLQY, ZL], f = sg(t, 0.4, 1.3); C(o, hop(p0, p1, f, 50), '1051', f >= 1 ? '550 · 3 tent.' : 'para a DLQ', 'bad');
          if (t > 0.4) { lit(o, R.c2d, 'bad'); o.on.fila2 = 'bad'; }
          const sent = [];
          [1, 2, 3].forEach(i => { const tk = 1.6 + (i - 1) * 1.6, slid = [1, 2, 3].slice(0, i - 1).reduce((a, j) => a + sg(t, 1.6 + (j - 1) * 1.6 + 0.5, 1.6 + (j - 1) * 1.6 + 1.0), 0);
            if (t < tk) return C(o, [SX(i - 1 - slid), LY, ZL], 'e-mail', 'outro pedido');
            if (t < tk + 0.7) { o.on.cons = 1; return C(o, hop([SX(0), LY, ZL], CONSP, ease((t - tk) / 0.7), 34), 'e-mail', 'saindo', 'acc'); }
            sent.push(i); if (t < tk + 1.2) { send(o, t, tk + 0.7, tk + 1.1, R.c2v, '', 'acc', 0); o.on.side = 1; } });
          o.rows.cons = act('NOTIFICACOES', 'consumidor', [sent.length ? `${sent.length} e-mails enviados` : '1051 → emails.dlq', sent.length ? 'acc' : 'bad']);
          o.rows.fila2 = lane('FILA emails.dlq', '1 mensagem · alerta!');
          o.cnt = [['NA DLQ', t > 1.3 ? '1' : '0', 'bad'], ['TEMPO', '36 s', 'dim'], ['FILA PRINCIPAL', sent.length ? `${sent.length} saíram` : 'andando', 'dim']];
          o.res = t > 1.3 ? ['emails.dlq: 1 · a fila principal seguiu'] : [];
          if (t > 1.6) T(o, TR(), 'alerta: emails.dlq > 0', 'bad'); } },
      { id: 'veneno', dur: 8, title: 'E se der errado: sem DLQ, a mensagem ruim trava a fila', yk: 'SEM DLQ · nack + reenfileirar', code: ['# sem DLQ: a mensagem volta para o começo', 'tenta 1051 → 550 → volta', 'tenta 1051 → 550 → volta …', '40 eventos/s × 60 s = 2.400 por minuto', '# na p0 do Kafka é igual: o offset', '# não anda enquanto o evento falha'],
        story: 'Sem DLQ, a mensagem que falha volta para o começo e é tentada de novo, para sempre. É a poison message, a mensagem envenenada. Ninguém atrás dela sai. Se essa fila fosse a p0 do tópico pedidos, a 40 eventos por segundo, a fila atrás dela cresceria 2.400 eventos por minuto.',
        look: 'O 1051 vai e volta entre a fila e o NOTIFICACOES, vermelho. Atrás dele os cartões se acumulam e o contador ATRÁS DELA não para de subir.',
        key: 'Poison message: sem DLQ, uma mensagem ruim para a fila inteira.',
        f(o, t) { o.show.fila2 = 0; o.rows.fila = lane('FILA SEM DLQ (ou a p0)', '40 eventos/s chegando'); o.on.fila = 'bad'; o.on.cons = 'bad';
          const ph = (t % 1.8) / 1.8, tries = Math.floor(t / 1.8) + 1, head = [SX(0), LY, ZL];
          C(o, ph < 0.5 ? hop(head, CONSP, ease(ph * 2), 34) : hop(CONSP, head, ease((ph - 0.5) * 2), 34), '1051', ph < 0.5 ? `tentativa ${tries}` : 'volta', 'bad');
          if (ph > 0.3 && ph < 0.6) { lit(o, R.c2v, 'bad'); o.on.side = 1; }
          const n = Math.min(5, 1 + Math.floor(t / 1.2)); for (let i = 1; i <= n; i++) C(o, [SX(i), LY, ZL], i === 5 ? `+${thou(clamp(t / 7) * 2400)}` : 'evento', i === 5 ? 'atrás' : 'esperando', i > 2 ? 'bad' : '');
          o.rows.cons = act('NOTIFICACOES', 'consumidor', [`tentativa ${tries}: 550`, 'bad'], ['e volta para a fila', 'dim']);
          o.cnt = [['ATRÁS DELA', thou(clamp(t / 7) * 2400), 'bad'], ['TENTATIVAS', String(tries), 'bad'], ['PROCESSADOS', '0', 'dim']];
          o.res = ['fila travada: 2.400 por minuto atrás'];
          if (t > 2) T(o, TR(), 'poison message\nninguém atrás dela sai', 'bad'); } },
    ],
    mqtt: [
      { id: 'publica', dur: 6.5, title: 'PUBLISH: 77 bytes a cada 5 s', yk: 'PACOTE PUBLISH · MQTT 3.1.1 · QoS 1', code: ['tópico: loja/entregas/caminhao-17/posicao', 'payload: {"lat":-8.0476,"lng":-34.877,"vel":62}', '1 (tipo) + 1 (tamanho) + 2 + 33 (tópico)', '+ 2 (id do pacote) + 38 (payload)', '= 77 bytes'],
        story: 'O caminhao-17 leva o pedido 1048 da Lena para Recife. O rastreador dele publica a posição a cada 5 s, por um 4G que cai em trechos ruins. O pacote PUBLISH tem 77 bytes e vai para o tópico loja/entregas/caminhao-17/posicao. O rastreio assinou loja/entregas/+/posicao: o + vale qualquer caminhão, então recebe.',
        look: 'O pacote sai do caminhão e anda pela árvore: loja, entregas, caminhao-17, posicao. Cada nó acende quando ele passa; depois segue para o RASTREIO.',
        key: 'MQTT: quem publica manda para um tópico; o broker entrega a quem assina.',
        f(o, t) { o.on.prod = 1;
          if (send(o, t, 0.4, 1.0, R.t2n0, 'PUBLISH · 77 B', 'acc', 0)) o.on.n0 = 1;
          if (send(o, t, 1.0, 1.3, R.e01, '', 'acc', 0)) o.on.n1 = 1;
          if (send(o, t, 1.3, 1.7, R.e12, '', 'acc', 0)) o.on.n2 = 1;
          if (send(o, t, 1.7, 2.1, R.e24, '', 'acc', 0)) { o.on.n4 = 1; o.rows.n4 = node('posicao', '-8.0476, -34.877'); }
          if (t > 1.0) lit(o, R.t2n0); if (t > 1.3) lit(o, R.e01); if (t > 1.7) lit(o, R.e12); if (t > 2.1) lit(o, R.e24);
          if (send(o, t, 2.5, 3.2, R.n4r, 'posição · 62 km/h', 'acc', 2)) { o.on.side = 1; o.rows.side = act('RASTREIO', 'assinante', ['loja/entregas/+/posicao', 'acc'], ['-8.0476, -34.877', 'hi'], ['62 km/h', 'dim']); }
          o.cnt = [['PACOTE', '77 B'], ['QoS', '1', 'dim'], ['A CADA', '5 s', 'dim']];
          o.res = t > 3.2 ? ['RASTREIO recebeu: o + casou com caminhao-17'] : t > 2.1 ? ['broker: tópico casa com o filtro?'] : [];
          if (t > 3.4) T(o, TR(), 'filtro loja/entregas/+/posicao\n+ = um nível'); } },
      { id: 'puback', dur: 5.5, title: 'QoS 1: o broker confirma com 4 bytes', yk: 'PACOTE PUBACK · MQTT 3.1.1', code: ['PUBACK: 40 02 + id do pacote (2 bytes)', '= 4 bytes', '# sem PUBACK, o caminhão reenvia com DUP = 1', '# por isso QoS 1 pode duplicar', 'ida e volta: 77 + 4 = 81 B (HTTP + JWT: ~234 B)'],
        story: 'Com QoS 1, o caminhão guarda o PUBLISH até o broker confirmar. A confirmação é um PUBACK de 4 bytes. Se o PUBACK se perde, o caminhão reenvia com a flag DUP e o rastreio pode receber a mesma posição duas vezes. QoS 1 é "pelo menos uma vez". O mesmo dado num POST HTTP com JWT daria uns 234 bytes.',
        look: 'O PUBACK volta do nó posicao até o caminhão. O contador mostra 77 + 4 = 81 bytes na ida e volta.',
        key: 'QoS 1: entrega garantida, com chance de duplicar.',
        f(o, t) { ['n0', 'n1', 'n2', 'n4'].forEach(n => o.on[n] = 2); [R.t2n0, R.e01, R.e12, R.e24].forEach(p => lit(o, p)); o.rows.n4 = node('posicao', '-8.0476, -34.877');
          const back = [...rev(R.e24), ...rev(R.e12).slice(1), ...rev(R.e01).slice(1), ...rev(R.t2n0).slice(1)];
          if (send(o, t, 0.6, 2.2, back, 'PUBACK · 4 B', 'acc', 2)) { o.on.prod = 1; o.rows.prod = act('caminhao-17', '4G', ['PUBACK recebido', 'acc'], ['apaga a cópia', 'dim']); }
          o.cnt = [['PUBACK', '4 B'], ['IDA E VOLTA', '81 B', 'dim'], ['HTTP + JWT', '~234 B', 'dim']];
          o.res = t > 2.2 ? ['QoS 1: pelo menos uma vez (pode duplicar)'] : [];
          if (t > 2.4) T(o, TR(), 'PUBACK: 4 bytes'); } },
      { id: 'retida', dur: 6, title: 'Mensagem retida: a tela abre e já vê o caminhão', yk: 'RETAIN', code: ['PUBLISH … retain = 1', '# o broker guarda a última posição do tópico', 'SUBSCRIBE loja/entregas/caminhao-17/posicao', '→ o broker entrega a retida na hora', '# sem retain: a tela espera até 5 s'],
        story: 'A Lena abre a tela do pedido 1048. Sem nada guardado, a tela ficaria em branco até a próxima posição, em até 5 s. Como o caminhão publica com retain, o broker guarda a última posição de cada tópico e entrega na hora a quem assina depois.',
        look: 'A TELA 1048 aparece, manda o SUBSCRIBE, e a posição retida no nó posicao vai direto para ela.',
        key: 'Retida: o broker guarda a última mensagem do tópico para quem chegar depois.',
        f(o, t) { o.show.cons = 1; o.on.n4 = 1; o.rows.n4 = node('posicao', 'retida: -8.0476…');
          if (t > 0.5) send(o, t, 0.6, 1.3, rev(R.n4t), 'SUBSCRIBE', 'hi', 0.2);
          if (send(o, t, 1.7, 2.4, R.n4t, 'retida · na hora', 'acc', 2)) { o.on.cons = 1; o.rows.cons = act('TELA 1048', 'a Lena', ['-8.0476, -34.877', 'acc'], ['caminhão a 62 km/h', 'dim']); }
          o.cnt = [['RETIDA', '1 por tópico'], ['ESPERA DA TELA', t > 2.4 ? '0 s' : '…', 'dim'], ['SEM RETAIN', 'até 5 s', 'dim']];
          o.res = t > 2.4 ? ['a tela já abre com o caminhão'] : [];
          if (t > 2.6) T(o, TR(), 'abriu e já viu\na última posição'); } },
      { id: 'will', dur: 8, title: 'Last Will: o broker avisa que o caminhão sumiu', yk: 'CONNECT · LAST WILL', code: ['CONNECT caminhao-17 · keep-alive 60 s · 25 bytes', 'will: loja/entregas/caminhao-17/status', '      = offline', '# 1,5 × 60 s = 90 s sem nenhum pacote', '→ o broker publica o will pelo caminhão'],
        story: 'O caminhão conectou com keep-alive de 60 s e deixou um testamento: se sumir sem se despedir, publiquem offline em loja/entregas/caminhao-17/status. O 4G cai. Passados 90 s sem nenhum pacote (1,5 × keep-alive), o broker declara a conexão morta e publica o will em nome do caminhão.',
        look: 'O caminhão fica vermelho; o contador SEM SINAL sobe até 90 s; então o nó status acende e o offline vai para o RASTREIO.',
        key: 'Last Will: o broker fala pelo cliente que caiu sem avisar.',
        f(o, t) { const s = Math.round(clamp((t - 0.4) / 4.4) * 90), dead = t > 4.8; o.on.prod = 'bad'; o.rows.prod = act('caminhao-17', 'sem sinal', [`${s} s sem pacote`, 'bad']);
          if (dead) { o.on.n5 = 1; o.rows.n5 = node('status', 'offline'); lit(o, R.e25); }
          if (send(o, t, 5.2, 5.9, R.n5r, 'status = offline', 'bad', 3)) { o.on.side = 'bad'; o.rows.side = act('RASTREIO', 'assinante', ['caminhao-17: offline', 'bad'], ['aviso do broker', 'dim']); }
          o.cnt = [['SEM SINAL', `${s} s`, 'bad'], ['LIMITE', '90 s (1,5 × 60)', 'dim'], ['STATUS', dead ? 'offline' : 'online', dead ? 'bad' : 'dim']];
          o.res = t > 5.9 ? ['status = offline: o broker falou pelo caminhão'] : [];
          if (t > 6) T(o, TR(), 'will publicado\npelo broker', 'bad'); } },
      { id: 'sinal', dur: 9, title: 'E se der errado: 3 min sem sinal são 36 posições', yk: 'QoS E CONEXÃO RUIM', code: ['3 min × 60 s ÷ 5 s = 36 posições', 'QoS 0: perdidas', 'QoS 1: o caminhão guarda e reenvia', '# o broker só guarda para quem assina,', '# não para quem publica', '# posição: vale a mais recente pelo horário'],
        story: 'O caminhão entra num trecho sem sinal por 3 minutos: são 36 posições. Com QoS 0, elas se perdem. Com QoS 1, o cliente do caminhão precisa guardá-las e reenviar quando a rede voltar, porque o broker só guarda mensagens para quem assina. Como posição é idempotente, o rastreio fica com a mais recente pelo horário.',
        look: 'As posições se empilham em cima do caminhão vermelho até 36; quando o sinal volta, elas correm todas para o broker.',
        key: 'Quem publica numa rede ruim precisa guardar e reenviar: o broker não faz isso por ele.',
        f(o, t) { const n = Math.min(36, Math.round(clamp((t - 0.4) / 4.6) * 36)), back = t > 5.6;
          o.on.prod = back ? 1 : 'bad'; o.rows.prod = act('caminhao-17', back ? 'sinal voltou' : 'sem sinal', [back ? 'reenviando 36' : `guardou ${n}`, back ? 'acc' : 'bad']);
          const drawn = Math.min(12, Math.ceil(n / 3));
          for (let i = 0; i < drawn; i++) { const p = [40 + (i % 4) * 28, 352 + Math.floor(i / 4) * 17, ZA], f = back ? sg(t, 5.6 + i * 0.12, 6.4 + i * 0.12) : 0;
            if (f >= 1) continue; C(o, f > 0 ? hop(p, ND('n0'), f, 40) : p, '', '', back ? 'acc' : 'bad', 0.34); }
          if (back) { send(o, t, 5.6, 7.6, R.t2n0, '36 posições', 'acc', 1); o.on.n0 = 1; }
          o.cnt = [['POSIÇÕES', String(n), back ? '' : 'bad'], ['SEM SINAL', back ? '3 min' : `${Math.round(clamp((t - 0.4) / 4.6) * 180)} s`, 'dim'], ['COM QoS 0', `${n} perdidas`, 'bad']];
          o.res = back ? ['QoS 1: o caminhão reenviou as 36'] : [];
          if (t > 2) T(o, TR(), back ? 'reenvia o que guardou' : 'QoS 0: perdidas\nQoS 1: guarda no caminhão', back ? 'acc' : 'bad'); } },
    ],
    'lab-mqtt': [
      { id: 'lab', dur: 7, title: 'O lab: linuxtips/iot a cada 1 s', yk: 'NO LAB · messages/mqtt/default/producer.go', code: ['broker := "tcp://localhost:1883"', 'topic := "linuxtips/iot"', 'clientID := fmt.Sprintf("producer-%d", time.Now().Unix())', 'time.Sleep(3 * time.Second)   // espera o consumer', 'client.Publish(topic, 1, false, message)', 'time.Sleep(1 * time.Second)'],
        story: 'O lab troca o caminhão por um produtor de teste. O producer.go conecta no Mosquitto em tcp://localhost:1883, espera 3 s para o consumidor ficar pronto e publica "Mensagem #N" com QoS 1 no tópico linuxtips/iot, uma por segundo. O consumer.go assina o mesmo tópico.',
        look: 'O producer.go conecta, o contador espera 3 s, e então uma mensagem por segundo anda por linuxtips → iot até o consumer.go.',
        key: 'No lab, linuxtips/iot faz o papel de loja/entregas/caminhao-17/posicao.',
        f(o, t) { o.on.prod = 1; const wait = Math.min(3, Math.max(0, t - 0.4) * 1.5), go = t > 2.4;
          if (!go) o.rows.prod = act('producer.go', 'conectado', [`time.Sleep: ${wait.toFixed(1).replace('.', ',')} s`, 'acc']);
          let n = 0; if (go) { n = Math.floor((t - 2.4) / 1.1) + 1; const ph = (t - 2.4) % 1.1;
            send(o, ph, 0, 0.35, R.t2n0, `Mensagem #${n}`, 'acc', 0); send(o, ph, 0.35, 0.5, R.e01, '', 'acc', 0); if (send(o, ph, 0.5, 0.9, R.n1c, '', 'acc', 0.2)) o.on.side = 1;
            if (ph > 0.3) o.on.n0 = 1; if (ph > 0.45) o.on.n1 = 1;
            o.rows.prod = act('producer.go', 'publicando', [`Mensagem #${n}`, 'acc'], ['QoS 1 · a cada 1 s', 'dim']);
            o.rows.side = act('consumer.go', 'assinante', [`recebeu #${Math.max(1, ph > 0.9 ? n : n - 1)}`, 'acc'], ['linuxtips/iot', 'dim']); }
          o.cnt = [['PUBLICADAS', String(n)], ['ESPERA INICIAL', '3 s', 'dim'], ['INTERVALO', '1 s', 'dim']];
          o.res = n ? [`Mensagem #${n} - <hora RFC3339>`] : ['conectado; esperando 3 s'];
          if (t > 3) T(o, TR(), 'README diz 5 s e linuxtips/demo\no código usa 1 s e linuxtips/iot', 'dim'); } },
      { id: 'atrasado', dur: 7.5, title: 'Consumidor atrasado: CleanSession(true) perde', yk: 'NO LAB · consumer.go', code: ['opts.SetCleanSession(true)', 'client.Subscribe("linuxtips/iot", 1, …)', '# o consumidor sobe depois do produtor', '# sem sessão guardada, ninguém assina', '# o que saiu antes se perde'],
        story: 'O consumidor sobe depois do produtor. Com CleanSession(true), o broker não guarda nada para ele: enquanto ninguém assina, cada mensagem chega ao tópico e some. Quando o consumer.go conecta, recebe só dali em diante.',
        look: 'O consumer.go está vermelho e fora do ar; as mensagens chegam ao nó iot e apagam ali. Quando ele sobe, elas passam a chegar.',
        key: 'Sessão limpa: o broker esquece o assinante quando ele cai.',
        f(o, t) { const up = t > 4.6, n = Math.floor(t / 0.9) + 1, ph = t % 0.9; o.on.prod = 1; o.rows.prod = act('producer.go', 'publicando', [`Mensagem #${n}`, 'acc']);
          send(o, ph, 0, 0.3, R.t2n0, `#${n}`, 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', 'acc', 0);
          if (up) { if (send(o, ph, 0.45, 0.8, R.n1c, '', 'acc', 0.1)) o.on.side = 1; } else if (ph > 0.45 && ph < 0.8) { o.on.n1 = 'bad'; o.rows.n1 = node('iot', 'ninguém assina'); }
          const lost = Math.min(n, Math.floor(4.6 / 0.9) + 1);
          o.rows.side = up ? act('consumer.go', 'subiu agora', ['recebe daqui em diante', 'acc'], ['CleanSession(true)', 'dim']) : act('consumer.go', 'fora do ar', ['ainda não subiu', 'bad']); if (!up) o.on.side = 'bad';
          o.cnt = [['PERDIDAS', String(up ? lost : n), 'bad'], ['SESSÃO', 'limpa', 'dim'], ['CONSUMIDOR', up ? 'no ar' : 'fora', up ? 'dim' : 'bad']];
          o.res = up ? [`perdidas: ${lost} (enviadas antes de ele subir)`] : [];
          if (t > 1.5 && !up) T(o, TR(), 'ninguém assina:\na mensagem some', 'bad'); } },
      { id: 'sessao', dur: 8, title: 'Sessão persistente: o broker guarda 600', yk: 'SESSÃO PERSISTENTE', code: ['opts.SetCleanSession(false)', 'clientID fixo (sem time.Now().Unix())', 'Subscribe com QoS 1', '# 10 min fora × 1 msg/s = 600 guardadas', '# max_queued_messages: 1000 por cliente (padrão)'],
        story: 'Para não perder, o consumidor usa CleanSession(false), um clientID fixo e QoS 1. Agora o broker guarda as mensagens do assinante enquanto ele está fora. Dez minutos fora, a uma mensagem por segundo, são 600 na fila da sessão. Quando volta, recebe as 600.',
        look: 'A barra do broker enche até 600 de 1.000 enquanto o consumer.go está fora; quando ele volta, a barra esvazia e as mensagens correm para ele.',
        key: 'Sessão persistente: o broker guarda para o assinante que caiu, até um limite.',
        f(o, t) { const q = Math.round(clamp((t - 0.4) / 4.4) * 600), up = t > 5.2, d = up ? Math.round(sg(t, 5.2, 7.2) * 600) : 0; o.on.prod = 1;
          o.rows.prod = act('producer.go', 'publicando', ['1 msg/s', 'acc']); if (!up) { o.on.side = 'bad'; o.rows.side = act('consumer.go', 'fora do ar', [`${Math.round(q / 60)} min fora`, 'bad'], ['CleanSession(false)', 'dim']); }
          else { o.on.side = 1; o.rows.side = act('consumer.go', 'voltou', [`recebeu ${d} de 600`, 'acc'], ['CleanSession(false)', 'dim']); send(o, t, 5.2, 7.2, R.n1c, '600 guardadas', 'acc', 1); }
          if (t > 0.4 && !up) { const ph = t % 0.8; send(o, ph, 0, 0.3, R.t2n0, '', 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', 'acc', 0); o.on.n1 = 1; }
          o.rows.broker = { name: 'BROKER MQTT', meta: 'Mosquitto · porta 1883', bar: { f: (q - d) / 1000, lab: `fila da sessão do consumer: ${q - d} de 1.000`, tone: '' } };
          o.cnt = [['NA SESSÃO', String(q - d)], ['LIMITE', '1.000', 'dim'], ['PERDIDAS', '0', 'dim']];
          o.res = up ? [`reconectou: recebeu ${d} de 600`] : [];
          if (t > 1) T(o, TR(), `${up ? 'entregando' : 'guardando'}: 10 min × 1/s = 600`); } },
      { id: 'limite', dur: 8, title: 'E se der errado: 20 min fora, 200 descartadas', yk: 'SESSÃO PERSISTENTE · LIMITE', code: ['20 min fora × 1 msg/s = 1.200', 'max_queued_messages = 1000', '→ 1.200 − 1.000 = 200 descartadas', '# conferir o limite na versão do Mosquitto', '# e medir quanto tempo o consumidor fica fora'],
        story: 'A sessão persistente tem teto. No Mosquitto, a fila por cliente tem 1.000 mensagens por padrão (max_queued_messages). Com o consumidor 20 minutos fora, chegam 1.200: as 200 que passam do limite são descartadas, e ninguém avisa o consumidor.',
        look: 'A barra do broker chega ao fim em 1.000 e fica vermelha; o contador DESCARTADAS sobe até 200.',
        key: 'O broker guarda até um limite; o que passa disso se perde.',
        f(o, t) { const q = Math.round(clamp((t - 0.4) / 5) * 1200), kept = Math.min(1000, q), drop = q - kept; o.on.prod = 1; o.on.side = 'bad';
          o.rows.prod = act('producer.go', 'publicando', ['1 msg/s', 'acc']); o.rows.side = act('consumer.go', 'fora do ar', [`${Math.round(q / 60)} min fora`, 'bad']);
          if (t > 0.4) { const ph = t % 0.8; send(o, ph, 0, 0.3, R.t2n0, '', drop ? 'bad' : 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', drop ? 'bad' : 'acc', 0); o.on.n1 = drop ? 'bad' : 1; }
          o.rows.broker = { name: 'BROKER MQTT', meta: 'Mosquitto · porta 1883', bar: { f: kept / 1000, lab: drop ? `cheia: 1.000 · ${drop} descartadas` : `fila da sessão: ${kept} de 1.000`, tone: drop ? 'bad' : '' } };
          if (drop) o.on.broker = 'bad';
          o.cnt = [['DESCARTADAS', String(drop), drop ? 'bad' : ''], ['CHEGARAM', thou(q), 'dim'], ['GUARDADAS', thou(kept), 'dim']];
          o.res = drop ? [`${drop} mensagens descartadas sem aviso`] : [];
          if (drop) T(o, TR(), 'passou de 1.000:\no broker descarta', 'bad'); } },
    ],
    exchange: [
      { id: 'rota', dur: 7, title: 'A exchange roteia pela routing key', yk: 'basic.publish · AMQP 0-9-1', code: ['exchange: emails (topic)', 'routing key: email.pedido.confirmacao', 'body: { "pedido_id": 1051, "para": "Lena" }', 'email.pedido.*  ✓ → emails.transacionais', 'email.promo.#   ✗', 'email.#         ✓ → emails.auditoria'],
        story: 'O notificacoes não escolhe fila: publica na exchange emails com a routing key email.pedido.confirmacao. A exchange compara a chave com o binding de cada fila. email.pedido.* casa (o * vale uma palavra), email.promo.# não casa, email.# casa (o # vale qualquer resto). A confirmação do 1051 vira duas cópias.',
        look: 'O cartão entra na EXCHANGE e sai em dois: um para emails.transacionais, outro para emails.auditoria. O corredor das promocionais fica apagado.',
        key: 'Exchange: o broker decide as filas comparando a routing key com os bindings.',
        f(o, t) { const m = 'confirmação', s = '1051';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); } if (t > 1.2 && t < 2.8) o.on.exch = 1;
          if (t > 1.6) { o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✓', 'acc'], ['promo.#  ✗', 'dim'], ['#        ✓', 'acc']);
            ['qa', 'qc'].forEach(q => { const f = sg(t, 1.8, 2.7); C(o, hop(XP.exch, [QX(0), QY[q], ZL], f, 30), m, s, 'acc', 0.75); if (f > 0.9) o.on[q] = 1; lit(o, q === 'qa' ? R.x2a : R.x2c); }); }
          if (t > 3.6) { const f = sg(t, 3.6, 4.4); if (f < 1) C(o, hop([QX(0), QY.qa, ZL], XP.prov, f, 30), m, s, 'acc', 0.75); else { o.on.side = 1; o.rows.side = act('PROVEDOR', 'de e-mail', ['confirmação 1051', 'acc'], ['para a Lena', 'dim']); }
            lit(o, R.a2v); }
          o.cnt = [['FILAS QUE CASAM', t > 1.6 ? '2 de 3' : '…'], ['ROUTING KEY', 'email.pedido.confirmacao', 'dim'], ['CÓPIAS', t > 1.8 ? '2' : '0', 'dim']];
          o.res = t > 2.7 ? ['→ emails.transacionais + emails.auditoria'] : [];
          if (t > 2.8) T(o, TR(), 'pedido.* ✓   promo.# ✗   # ✓\n2 cópias'); } },
      { id: 'promo', dur: 6, title: 'email.promo.bf: promocionais e auditoria', yk: 'basic.publish · AMQP 0-9-1', code: ['exchange: emails (topic)', 'routing key: email.promo.bf', 'body: newsletter da Black Friday', 'email.pedido.*  ✗', 'email.promo.#   ✓ → emails.promocionais', 'email.#         ✓ → emails.auditoria'],
        story: 'A newsletter da Black Friday sai com a chave email.promo.bf. O binding email.pedido.* não casa; email.promo.# casa; email.# casa de novo. A newsletter vai para promocionais e auditoria e nunca entra na fila das transacionais.',
        look: 'O cartão promo entra na EXCHANGE e sai para emails.promocionais e emails.auditoria; o corredor das transacionais fica apagado.',
        key: 'Cada chave cai nas filas cujo binding casa com ela.',
        f(o, t) { const m = 'promo', s = 'bf';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); } if (t > 1.2 && t < 2.8) o.on.exch = 1;
          if (t > 1.6) { o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✗', 'dim'], ['promo.#  ✓', 'acc'], ['#        ✓', 'acc']);
            ['qb', 'qc'].forEach(q => { const f = sg(t, 1.8, 2.7); C(o, hop(XP.exch, [QX(0), QY[q], ZL], f, 30), m, s, 'acc', 0.75); if (f > 0.9) o.on[q] = 1; lit(o, q === 'qb' ? R.x2b : R.x2c); }); }
          o.cnt = [['FILAS QUE CASAM', t > 1.6 ? '2 de 3' : '…'], ['ROUTING KEY', 'email.promo.bf', 'dim'], ['NAS TRANSACIONAIS', '0', 'dim']];
          o.res = t > 2.7 ? ['→ emails.promocionais + emails.auditoria'] : [];
          if (t > 2.8) T(o, TR(), 'pedido.* ✗   promo.# ✓   # ✓'); } },
      { id: 'unica', dur: 8, title: 'Fila única: o e-mail da Lena atrás de 50.000', yk: 'A CONTA DA FILA ÚNICA', code: ['50.000 promocionais na frente', '÷ 100 e-mails/s (limite do provedor)', '= 500 s = 8 min 20 s', '# o e-mail da Lena só sai depois deles'],
        story: 'Para ver por que separar, imagine uma fila só. A newsletter de 50.000 e-mails entra primeiro e a confirmação do 1051 entra atrás. O provedor aceita 100 e-mails por segundo. A Lena espera 50.000 ÷ 100 = 500 s, 8 min 20 s, por um e-mail de confirmação.',
        look: 'Um corredor só, emails, com os promocionais na frente e a confirmação do 1051 no fim. Os promocionais saem um a um; o relógio da Lena sobe até 500 s.',
        key: 'Numa fila única, o urgente espera atrás do volume.',
        f(o, t) { o.show.qa = 0; o.show.qc = 0; o.show.cons = 0; o.rows.qb = lane('emails (fila única)', 'tudo junto, na ordem de chegada'); o.rows.exch = act('EXCHANGE', 'direct', ['emails', 'acc'], ['1 fila só', 'dim']);
          const w = Math.round(clamp((t - 0.6) / 5.4) * 500), done = t > 6.2;
          ['promo', 'promo', 'promo'].forEach((m, i) => C(o, [QX(i), QY.qb, ZL], m, 'bf', '', 0.75));
          if (!done) { C(o, [QX(3), QY.qb, ZL], `+${thou(Math.max(0, 49997 - w * 100))}`, 'promo', '', 0.75); C(o, [QX(4), QY.qb, ZL], 'confirmação', '1051', 'bad', 0.75); }
          const ph = (t % 0.7) / 0.7; if (t > 0.6 && !done) { C(o, hop([QX(0), QY.qb, ZL], XP.prov, ph, 24), 'promo', 'bf', 'acc', 0.75); o.on.side = 1; lit(o, R.b2v); }
          if (done) { C(o, hop([QX(4), QY.qb, ZL], XP.prov, sg(t, 6.2, 7.0), 30), 'confirmação', '1051', 'acc', 0.75); o.rows.side = act('PROVEDOR', 'de e-mail', ['confirmação 1051', 'bad'], ['depois de 500 s', 'dim']); }
          else o.rows.side = act('PROVEDOR', 'de e-mail', ['100 e-mails/s', 'acc'], ['só promocionais', 'dim']);
          o.on.qb = 2;
          o.cnt = [['ESPERA DA LENA', w >= 500 ? '8 min 20 s' : `${w} s`, 'bad'], ['NA FRENTE DELA', thou(Math.max(0, 50000 - w * 100)), 'dim'], ['PROVEDOR', '100/s', 'dim']];
          o.res = done ? ['Lena: 500 s esperando (8 min 20 s)'] : [];
          if (t > 1.5) T(o, TR(), '50.000 ÷ 100/s = 500 s', 'bad'); } },
      { id: 'separadas', dur: 7, title: 'Filas separadas: sai em menos de 1 s', yk: 'COM A EXCHANGE emails', code: ['emails.transacionais: 1 mensagem (a do 1051)', 'emails.promocionais: 50.000', 'o provedor atende as duas filas', '→ a confirmação sai em menos de 1 s'],
        story: 'Com a exchange emails, a confirmação do 1051 cai em emails.transacionais, que está quase vazia, e a newsletter fica na sua fila. O provedor atende as duas. A confirmação sai em menos de 1 s, enquanto os promocionais continuam no ritmo deles.',
        look: 'A confirmação do 1051 está sozinha no corredor de cima e pula logo para o PROVEDOR; os promocionais seguem saindo do corredor do meio.',
        key: 'Filas separadas tiram o transacional de trás do volume.',
        f(o, t) { o.show.qc = 0; o.show.cons = 0;
          ['promo', 'promo', 'promo'].forEach((m, i) => C(o, [QX(i), QY.qb, ZL], m, 'bf', '', 0.75)); C(o, [QX(3), QY.qb, ZL], '+49.997', 'promo', '', 0.75);
          const ph = (t % 0.9) / 0.9; C(o, hop([QX(0), QY.qb, ZL], XP.prov, ph, 24), 'promo', 'bf', 'acc', 0.75); lit(o, R.b2v); o.on.qb = 2; o.on.side = 1;
          const f = sg(t, 0.8, 1.5); if (f < 1) C(o, f > 0 ? hop([QX(0), QY.qa, ZL], XP.prov, f, 30) : [QX(0), QY.qa, ZL], 'confirmação', '1051', 'acc', 0.75); else o.rows.side = act('PROVEDOR', 'de e-mail', ['confirmação 1051', 'acc'], ['em menos de 1 s', 'dim']);
          if (t > 0.8) { o.on.qa = 1; lit(o, R.a2v); }
          o.cnt = [['ESPERA DA LENA', t > 1.5 ? '< 1 s' : '…'], ['PROMOCIONAIS', '500 s, sem pressa', 'dim'], ['FILAS', '2', 'dim']];
          o.res = t > 1.5 ? ['Lena: menos de 1 s'] : [];
          if (t > 1.8) T(o, TR(), 'confirmação: < 1 s\n(antes: 8 min 20 s)'); } },
      { id: 'typo', dur: 8, title: 'E se der errado: chave com erro, descarte em silêncio', yk: 'SEM ROTA · AMQP 0-9-1', code: ['routing key: emails.pedido.confirmacao   (plural)', 'email.pedido.*  ✗   (1ª palavra: emails)', 'email.promo.#   ✗', 'email.#         ✗', '# sem fila: descartada; o produtor nem sabe', 'mandatory = true → basic.return 312 NO_ROUTE'],
        story: 'Um erro de digitação: o produtor publica com emails.pedido.confirmacao, no plural. Nenhum binding casa, nem o email.# da auditoria, porque a primeira palavra é emails. Sem fila, a exchange descarta a mensagem em silêncio e o produtor acha que enviou. Com mandatory = true, o broker devolve a mensagem (basic.return, 312 NO_ROUTE).',
        look: 'O cartão entra na EXCHANGE, os três bindings ficam ✗ e ele cai, vermelho. Depois, com mandatory, ele volta ao NOTIFICACOES.',
        key: 'Mensagem sem rota some sem erro; mandatory, alternate exchange e alerta trazem o erro de volta.',
        f(o, t) { const m = 'confirmação', s = 'emails.…';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); }
          if (t > 1.4) { o.on.exch = 'bad'; o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✗', 'bad'], ['promo.#  ✗', 'bad'], ['#        ✗', 'bad']); }
          if (t > 1.6 && t < 3.4) { const f = sg(t, 1.6, 3.2); C(o, [XP.exch[0], XP.exch[1] + 60 * f, ZX + 10 - 40 * f], m, 'sem rota', 'bad', 0.75); }
          if (t > 1.6 && t < 4.6) o.rows.prod = act('NOTIFICACOES', 'produtor', ['publicou: ok', 'acc'], ['acha que enviou', 'dim']);
          if (t > 4.6) { const f = sg(t, 4.6, 5.6); C(o, hop(XP.exch, XP.prod, f, 34), m, '312 NO_ROUTE', 'bad', 0.75); lit(o, rev(R.p2x), 'bad');
            if (f >= 1) { o.on.prod = 'bad'; o.rows.prod = act('NOTIFICACOES', 'mandatory = true', ['basic.return', 'bad'], ['312 NO_ROUTE', 'bad']); } }
          o.cnt = [['FILAS QUE CASAM', t > 1.4 ? '0' : '…', t > 1.4 ? 'bad' : ''], ['ENTREGUES', '0', 'dim'], ['ERRO NO PRODUTOR', t > 5.6 ? 'com mandatory' : 'nenhum', t > 5.6 ? 'dim' : 'bad']];
          o.res = t > 5.6 ? ['mandatory: o broker devolveu (312 NO_ROUTE)'] : t > 3.2 ? ['descartada em silêncio: a Lena não recebe'] : [];
          if (t > 2.4 && t < 4.6) T(o, TR(), 'sem rota: descartada\nem silêncio', 'bad'); } },
    ],
    'lab-amqp': [
      { id: 'direct', dur: 7, title: 'default/: exchange direct e a fila cobrar', yk: 'NO LAB · rabbit-mq/default/', code: ['ExchangeDeclare("ecommerce.nova.venda", "direct", durable)', 'QueueDeclare("cobrar", durable)', 'QueueBind("cobrar", "cobrar", "ecommerce.nova.venda")', 'Publish(…, "cobrar", text/plain "id:<uuid>")', 'consumer: auto-ack false · d.Ack(true)'],
        story: 'O lab começa com uma exchange direct, ecommerce.nova.venda, e uma fila cobrar ligada pela chave cobrar. Direct quer chave igual ao binding. O producer.go publica id:<uuid> com a chave cobrar; o consumer.go lê com auto-ack desligado e confirma com d.Ack(true).',
        look: 'As mensagens passam pela EXCHANGE direct e entram só no corredor cobrar; o consumer.go acende a cada ack.',
        key: 'Direct: a routing key tem de ser igual ao binding.',
        f(o, t) { o.rows.exch = act('EXCHANGE', 'direct', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['chave = cobrar', 'dim']); o.rows.qa = lane('cobrar', 'binding: cobrar');
          const ph = (t % 1.4) / 1.4, k = Math.floor(t / 1.4) + 1; o.on.prod = 1;
          if (ph < 0.3) C(o, hop(XP.prod, XP.exch, ph / 0.3, 30), 'id:<uuid>', 'cobrar', 'acc', 0.75);
          else if (ph < 0.6) { o.on.exch = 1; C(o, hop(XP.exch, [QX(0), QY.qa, ZL], (ph - 0.3) / 0.3, 28), 'id:<uuid>', 'cobrar', 'acc', 0.75); }
          else { o.on.qa = 1; C(o, hop([QX(0), QY.qa, ZL], XP.prov, (ph - 0.6) / 0.4, 28), 'id:<uuid>', 'Ack', 'acc', 0.75); if (ph > 0.85) o.on.side = 1; }
          [R.p2x, R.x2a, R.a2v].forEach(p => lit(o, p));
          o.cnt = [['PUBLICADAS', String(k)], ['TIPO', 'direct', 'dim'], ['O LAÇO VAI ATÉ', '3 bilhões', 'dim']];
          o.res = ['chave = binding: cai em cobrar'];
          if (t > 2) T(o, TR(), 'laço de 3 bilhões, sem confirms\nenche a fila e a memória', 'dim'); } },
      { id: 'topic', dur: 8.5, title: 'topic/: 20 mensagens, o datalake recebe todas', yk: 'NO LAB · rabbit-mq/topic/', code: ['exchange: ecommerce.nova.venda.faturamento (topic)', 'queue.faturamento ← faturamento.prioridade.default', 'queue.faturamento.prioritario ← faturamento.prioridade.alta', 'queue.faturamento.datalake ← faturamento.prioridade.*', 'for i := 0; i < 20; i++ { if rand.Float64() < 0.1 → alta }'],
        story: 'No topic/, o produtor manda 20 mensagens. Cada uma tem 10% de chance de sair com faturamento.prioridade.alta; o resto sai com faturamento.prioridade.default. O datalake assinou faturamento.prioridade.* e recebe todas as 20. Nesta execução, 2 saíram com alta.',
        look: 'As mensagens passam pela EXCHANGE topic: as default vão para o corredor do meio, as alta para o de cima, e todas também para o datalake embaixo.',
        key: 'Um binding com * recebe cópia de todas as chaves daquele nível.',
        f(o, t) { o.show.qb = 1; o.show.qc = 1; o.rows.exch = act('EXCHANGE', 'topic', ['ecommerce.', 'acc'], ['nova.venda.', 'acc'], ['faturamento', 'acc']);
          const HI = [6, 15], cnt = { qa: 0, qb: 0, qc: 0 }; o.on.prod = 1;
          for (let j = 0; j < 20; j++) { const tj = 0.4 + j * 0.33, hi = HI.includes(j), q = hi ? 'qa' : 'qb', lab = hi ? 'alta' : 'default';
            if (t < tj) continue; if (t >= tj + 0.75) { cnt[q]++; cnt.qc++; continue; }
            if (t < tj + 0.3) C(o, hop(XP.prod, XP.exch, (t - tj) / 0.3, 24), lab, `#${j + 1}`, hi ? 'acc' : '', 0.6);
            else { o.on.exch = 1; [q, 'qc'].forEach(qq => { C(o, hop(XP.exch, [QX(0), QY[qq], ZL], (t - tj - 0.3) / 0.45, 22), lab, `#${j + 1}`, hi ? 'acc' : '', 0.6); o.on[qq] = 1; }); } }
          o.rows.qa = lane('queue.faturamento.prioritario', `…prioridade.alta · ${cnt.qa}`); o.rows.qb = lane('queue.faturamento', `…prioridade.default · ${cnt.qb}`);
          o.rows.qc = lane('queue.faturamento.datalake', `…prioridade.* · ${cnt.qc}`); o.show.side = 0;
          [R.p2x, R.x2a, R.x2b, R.x2c].forEach(p => lit(o, p));
          o.cnt = [['DATALAKE', String(cnt.qc)], ['DEFAULT', String(cnt.qb), 'dim'], ['ALTA', String(cnt.qa), 'dim']];
          o.res = cnt.qc === 20 ? ['nesta execução: 2 alta, 18 default; datalake 20'] : [];
          if (cnt.qc === 20) T(o, TR(), 'datalake: as 20\n(* = uma palavra)'); } },
      { id: 'fanout', dur: 7.5, title: 'fanout/: cada uma das 3 filas recebe as 1.000', yk: 'NO LAB · rabbit-mq/fanout/', code: ['ExchangeDeclare("ecommerce.nova.venda", "fanout")', 'cobrar_pedido · reservar_estoque · informar_logistica', '# fanout ignora a routing key', 'for i := 0; i < 1000; i++ { Publish(…) }', '→ cada fila recebe as 1.000'],
        story: 'No fanout/, a exchange copia cada mensagem para todas as filas ligadas, sem olhar a chave. O produtor publica 1.000 mensagens e cobrar_pedido, reservar_estoque e informar_logistica recebem as 1.000 cada uma. É a mesma ideia dos 3 grupos do Kafka lendo o PedidoPago, agora com filas.',
        look: 'Cada mensagem entra na EXCHANGE fanout e sai em três cópias, uma para cada corredor; os contadores das 3 filas sobem juntos até 1.000.',
        key: 'Fanout: 1 mensagem publicada, N cópias, uma por fila.',
        f(o, t) { o.show.qb = 1; o.show.qc = 1; o.show.side = 0; o.rows.exch = act('EXCHANGE', 'fanout', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['copia para todas', 'dim']);
          const n = Math.round(clamp((t - 0.4) / 5.6) * 1000); o.on.prod = 1;
          o.rows.qa = lane('cobrar_pedido', `${thou(n)} mensagens`); o.rows.qb = lane('reservar_estoque', `${thou(n)} mensagens`); o.rows.qc = lane('informar_logistica', `${thou(n)} mensagens`);
          if (t > 0.4 && t < 6.2) { const ph = (t % 0.8) / 0.8; if (ph < 0.4) C(o, hop(XP.prod, XP.exch, ph / 0.4, 24), 'id:<uuid>', 'venda', 'acc', 0.6);
            else { o.on.exch = 1; ['qa', 'qb', 'qc'].forEach(q => { C(o, hop(XP.exch, [QX(0), QY[q], ZL], (ph - 0.4) / 0.6, 22), 'cópia', 'venda', 'acc', 0.6); o.on[q] = 1; }); } }
          [R.p2x, R.x2a, R.x2b, R.x2c].forEach(p => lit(o, p));
          o.cnt = [['POR FILA', thou(n)], ['PUBLICADAS', thou(n), 'dim'], ['NAS 3 FILAS', thou(n * 3), 'dim']];
          o.res = n >= 1000 ? ['3 × 1.000 = 3.000 mensagens nas filas'] : [];
          if (n >= 1000) T(o, TR(), '1.000 publicadas\n1.000 em cada fila'); } },
      { id: 'conflito', dur: 7, title: 'E se der errado: o mesmo nome, dois tipos', yk: 'RABBITMQ · ERRO 406', code: ['# 1º rodou default/: cria ecommerce.nova.venda como direct', '# 2º roda fanout/: declara o mesmo nome como fanout', 'Exception (406) PRECONDITION_FAILED -', "inequivalent arg 'type' for exchange 'ecommerce.nova.venda'", "in vhost '/': received 'fanout' but current is 'direct'", '# conserto: apagar a exchange ou usar outro nome'],
        story: 'O default/ e o fanout/ declaram a mesma exchange, ecommerce.nova.venda, com tipos diferentes. Quem roda o default/ primeiro cria uma direct. Quando o fanout/ declara o mesmo nome como fanout, o RabbitMQ recusa com 406 PRECONDITION_FAILED e fecha o canal: nenhuma mensagem é publicada.',
        look: 'A EXCHANGE continua direct; o pedido de declaração como fanout volta vermelho para o producer.go, e as filas do fanout ficam vazias.',
        key: 'Uma exchange existente não muda de tipo: declarar diferente derruba o canal.',
        f(o, t) { o.show.qb = 1; o.show.qc = 1; o.show.side = 0; o.rows.exch = act('EXCHANGE', 'direct', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['criada pelo default/', 'dim']);
          o.rows.prod = act('producer.go', 'fanout/', ['declara: fanout', 'acc']); o.rows.qa = lane('cobrar_pedido', '0 mensagens'); o.rows.qb = lane('reservar_estoque', '0 mensagens'); o.rows.qc = lane('informar_logistica', '0 mensagens');
          send(o, t, 0.5, 1.3, R.p2x, 'ExchangeDeclare fanout', 'hi', 0.2); if (t > 1.2) o.on.exch = 'bad';
          if (send(o, t, 1.8, 2.6, rev(R.p2x), '406 PRECONDITION_FAILED', 'bad', 4)) { o.on.prod = 'bad'; o.rows.prod = act('producer.go', 'fanout/', ['canal fechado', 'bad'], ['erro 406', 'bad']); }
          o.cnt = [['ERRO', t > 2.6 ? '406' : '…', 'bad'], ['TIPO ATUAL', 'direct', 'dim'], ['PUBLICADAS', '0', 'dim']];
          o.res = t > 2.6 ? ['canal fechado: nada foi publicado'] : [];
          if (t > 2.8) T(o, TR(), "received 'fanout'\nbut current is 'direct'", 'bad'); } },
      { id: 'duplicado', dur: 9, title: 'E se der errado: caiu antes do ack, e-mail em dobro', yk: 'ACK MANUAL · consumidor de e-mail', code: ['d := <-msgs', 'enviarEmail(d.Body)   // o e-mail saiu', '# o processo cai aqui', 'd.Ack(false)          // nunca roda', '→ o RabbitMQ reentrega com redelivered = true', '# conserto: message_id por e-mail e idempotência'],
        story: 'Volte aos e-mails. O consumidor tira a confirmação do 1051 de emails.transacionais, entrega ao provedor e cai antes do ack. Para o RabbitMQ, a mensagem não foi confirmada: ela volta para a fila com redelivered = true. O consumidor sobe, lê de novo e manda de novo. A Lena recebe o e-mail duas vezes.',
        look: 'O cartão vai ao CONSUMIDOR, o e-mail sai para o PROVEDOR, o CONSUMIDOR fica vermelho e o cartão volta para a fila marcado redelivered; o e-mail sai pela segunda vez.',
        key: 'Ack manual dá pelo menos uma vez: sem idempotência, duplica.',
        f(o, t) { o.rows.qa = lane('emails.transacionais', 'ack manual'); o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc']); o.show.cons = 1;
          o.rows.side = act('CONSUMIDOR', 'de e-mail', ['ack manual', 'dim']); o.rows.cons = act('PROVEDOR', 'de e-mail', ['100 e-mails/s', 'dim']);
          const m = 'confirmação', head = [QX(0), QY.qa, ZL], CP = XP.prov; let sent = 0;
          if (t < 0.4) C(o, head, m, '1051', ''); else if (t < 2.6) { C(o, t < 1.2 ? hop(head, CP, sg(t, 0.4, 1.2), 28) : CP, m, '1051', 'acc', 0.75); o.on.side = 1; lit(o, R.a2v); }
          if (send(o, t, 1.4, 2.0, R.s2c, 'e-mail 1', 'acc', 0.4)) sent = 1;
          if (t > 2.6 && t < 4.6) { o.on.side = 'bad'; o.rows.side = act('CONSUMIDOR', 'caiu', ['antes do ack', 'bad']); C(o, hop(CP, head, sg(t, 3.0, 3.8), 28), m, 'redelivered', 'bad', 0.75); }
          if (t >= 4.6) { o.on.side = 1; o.rows.side = act('CONSUMIDOR', 'voltou', ['lê de novo', 'acc']); if (t < 6.4) C(o, t < 5.3 ? hop(head, CP, sg(t, 4.6, 5.3), 28) : CP, m, 'redelivered', 'bad', 0.75); lit(o, R.a2v); }
          if (send(o, t, 5.5, 6.1, R.s2c, 'e-mail 2', 'bad', 3)) sent = 2;
          if (sent) { o.on.cons = sent > 1 ? 'bad' : 1; o.rows.cons = act('PROVEDOR', 'de e-mail', [`${sent}× confirmação 1051`, sent > 1 ? 'bad' : 'acc'], ['para a Lena', 'dim']); }
          o.cnt = [['E-MAILS PARA A LENA', String(sent), sent > 1 ? 'bad' : ''], ['ACK', t > 6.1 ? 'só agora' : 'nenhum', 'dim'], ['REDELIVERED', t > 3 ? 'true' : 'false', t > 3 ? 'bad' : 'dim']];
          o.res = sent > 1 ? ['a Lena recebe a confirmação 2 vezes'] : [];
          if (sent > 1) T(o, TR(), 'e-mail em dobro\nconserto: message_id', 'bad'); } },
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
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, k = Bk.kind;
    if (k === 'node') { x.textAlign = 'center'; x.fillStyle = col; fitFont(x, u, d.name, 13, W_ - 8); x.fillText(d.name, u(W_ / 2), u(d.sub ? 12 : H_ / 2));
      if (d.sub) { x.fillStyle = on === 'bad' ? BAD() : INK(); fitFont(x, u, d.sub, 9, W_ - 8); x.fillText(d.sub, u(W_ / 2), u(27)); } x.textAlign = 'left'; }
    else if (k === 'lane') { head(x, u, d, W_, col, 13); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(19)); x.lineTo(u(W_ - 4), u(19)); x.stroke();
      // setas no chão do corredor, apontando para a saída
      x.strokeStyle = theme === 'light' ? '#c3c6c8' : '#2b2e30'; x.lineWidth = u(1.2); const my = (19 + H_) / 2;
      for (let X = 30; X < W_ - 10; X += 46) { x.beginPath(); x.moveTo(u(X), u(my - 6)); x.lineTo(u(X + 6), u(my)); x.lineTo(u(X), u(my + 6)); x.stroke(); } }
    else if (k === 'slab') { head(x, u, d, W_, col, 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(18)); x.lineTo(u(W_ - 4), u(18)); x.stroke();
      if (d.bar) { const by = H_ - 26, bw = W_ - 12; x.fillStyle = theme === 'light' ? '#e2e2e1' : '#202124'; x.fillRect(u(6), u(by), u(bw), u(8));
        x.fillStyle = d.bar.tone === 'bad' ? BAD() : accC(); x.fillRect(u(6), u(by), u(bw * clamp(d.bar.f)), u(8));
        x.fillStyle = d.bar.tone === 'bad' ? BAD() : C.inkHi; fitFont(x, u, d.bar.lab, 10, bw); x.fillText(d.bar.lab, u(6), u(by + 17)); } }
    else {   // actor e exch: nome, meta e linhas
      head(x, u, d, W_, col, k === 'exch' ? 12 : 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
      let y = 34; for (const [text, tn] of d.rows || []) { x.fillStyle = on === 'bad' && tn !== 'acc' && tn !== 'dim' ? BAD() : toneC(tn); fitFont(x, u, text, k === 'exch' ? 11.5 : 12, W_ - 10); x.fillText(text, u(5), u(y)); y += k === 'exch' ? 17 : 18; } }
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, d, small) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', on = d.tone === 'acc', bad = d.tone === 'bad', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : (light ? '#eeeeed' : '#17181a'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = bad ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || bad ? 1.4 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; x.textAlign = 'center'; const col = bad ? BAD() : on ? accC() : C.inkHi;
    if (small) { x.fillStyle = col; fitFont(x, u, d.lab, 9, W_ - 4); x.fillText(d.lab, u(W_ / 2), u(H_ / 2)); }
    else { x.fillStyle = col; fitFont(x, u, d.lab, 13, W_ - 6); x.fillText(d.lab, u(W_ / 2), u(d.sub ? H_ * 0.38 : H_ / 2));
      if (d.sub) { x.fillStyle = bad ? BAD() : INK(); fitFont(x, u, d.sub, 9, W_ - 6); x.fillText(d.sub, u(W_ / 2), u(H_ * 0.74)); } }
    x.textAlign = 'left'; cv.tex.needsUpdate = true; }
  function placeCards(pool, list, w, d, h) {
    pool.forEach((Cd, i) => { const k = list[i]; if (!k) { Cd.g.visible = false; Cd.glow.material.uniforms.intensity.value = 0; return; }
      const s = k.s || 1, [cx, cy, z] = k.p; Cd.g.visible = true; Cd.g.scale.setScalar(s); Cd.g.position.copy(W(cx - w * s / 2, cy - d * s / 2, z));
      const key = JSON.stringify([k.lab, k.sub, k.tone]) + theme + accent.getHex();
      if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, k, false); if (Cd.fr) cardFace(Cd.fr, { lab: k.lab, tone: k.tone }, true); }
      if (k.tone === 'bad') { Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.6; } else { Cd.mat.emissive.copy(accent); Cd.mat.emissiveIntensity = k.tone === 'acc' ? 0.5 : 0; }
      moveGlow(Cd.glow, [cx, cy, z + h * s + 3], k.tone === 'acc' ? 0.6 : k.tone === 'bad' ? 0.35 : 0); });
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
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'MENSAGEM REAL', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /perd|descart|trav|silêncio|2 vezes|dobro|fechado|406|espera|parad|por nada|500 s|ordem perdida/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    fifo: () => `<li>Fila <b>emails</b>: entram <b>1049, 1050, 1051</b>; saem <b>1049, 1050, 1051</b></li><li>Pilha do 1051: Push <b>pagar → reservar estoque → criar remessa</b>; Pop <b>cancelar remessa → devolver estoque → estornar pagamento</b></li><li>Lab: queue/main.go e stack/main.go com <b>Pizza, Hamburger, Churrasco</b> (a pilha devolve Churrasco, Hamburger, Pizza)</li><li>Brokers de mensagem quase nunca oferecem fila LIFO: pilha é estrutura de dados</li><li>2 consumidores na mesma fila: saída <b>1050, 1051, 1049</b>; ordem por chave é o que a partição do Kafka dá (aula 5)</li>`,
    lote: () => `<li>Batch das 23:00 (módulo 11): <b>400 mil</b> linhas; 1 núcleo <b>42 s</b>, 4 núcleos <b>12 s</b> → pronto às <b>23:00:12</b></li><table class="h3-sum"><tr><th>linger.ms</th><th>por envio</th><th>envios/s na p0</th><th>nas 3</th></tr><tr><td>0</td><td>1 evento</td><td>40</td><td>120</td></tr><tr class="on"><td>200</td><td>8 eventos</td><td>5</td><td>15</td></tr></table><li><b>batch.size</b> é em bytes (padrão 16384); <b>linger.ms</b> padrão 0 até o Kafka 3.x e <b>5 ms</b> a partir do 4.0</li><li>Tráfego baixo com linger.ms = 200: até <b>+200 ms</b> por evento, sem lote</li>`,
    dlq: () => `<li>Provedor: <b>550 endereço inválido</b> para o e-mail do 1051</li><li>Tentativas: espera <b>1 s, 5 s e 30 s</b> → <b>36 s</b> depois da 1ª falha vai para <b>emails.dlq</b>, com o motivo</li><li>A DLQ tem alerta se passar de <b>0</b></li><li>Sem DLQ (poison message), na p0 a 40 eventos/s: <b>2.400</b> eventos por minuto parados atrás</li><li>RabbitMQ: DLQ via <b>dead letter exchange</b> (aula 9); Kafka não tem DLQ nativa para consumidores: o time cria <b>pedidos.dlq</b></li>`,
    mqtt: () => `<table class="h3-sum"><tr><th>pacote</th><th>bytes</th></tr><tr class="on"><td>PUBLISH QoS 1</td><td>1 + 1 + 2 + 33 + 2 + 38 = 77</td></tr><tr><td>PUBACK</td><td>4</td></tr><tr><td>CONNECT (keep-alive 60 s)</td><td>25</td></tr><tr><td>o mesmo dado em POST HTTP + JWT</td><td>~234</td></tr></table><li>QoS 0 no máximo uma vez · <b>QoS 1</b> pelo menos uma vez (PUBACK; pode duplicar) · QoS 2 exatamente uma vez (PUBREC, PUBREL, PUBCOMP)</li><li>Filtro <b>loja/entregas/+/posicao</b> (+ = um nível; # = vários)</li><li>Last Will depois de <b>1,5 × 60 = 90 s</b> sem pacote</li><li>3 min sem sinal ÷ 5 s = <b>36 posições</b></li>`,
    'lab-mqtt': () => `<li>Mosquitto <b>eclipse-mosquitto:2.0</b>, portas <b>1883</b> e 9001; <b>allow_anonymous true</b>, <b>persistence true</b></li><li>producer.go: espera <b>3 s</b>, publica <b>Mensagem #N - &lt;hora&gt;</b> com QoS 1 em <b>linuxtips/iot</b> a cada <b>1 s</b> (o README diz linuxtips/demo e 5 s)</li><li>consumer.go: <b>CleanSession(true)</b>; clientID muda a cada execução (time.Now().Unix())</li><li>Sessão persistente: 10 min × 1/s = <b>600</b> guardadas; 20 min = <b>1.200</b> &gt; <b>1.000</b> (max_queued_messages) → <b>200</b> descartadas</li><li>paho.mqtt.golang v1.4.3 fala MQTT 3.1.1: assinatura compartilhada ($share) é do MQTT 5.0</li>`,
    exchange: () => `<table class="h3-sum"><tr><th>routing key</th><th>transac.</th><th>promo</th><th>audit.</th></tr><tr class="on"><td>email.pedido.confirmacao</td><td>✓</td><td>✗</td><td>✓</td></tr><tr><td>email.pedido.enviado</td><td>✓</td><td>✗</td><td>✓</td></tr><tr><td>email.promo.bf</td><td>✗</td><td>✓</td><td>✓</td></tr><tr><td>emails.pedido.confirmacao</td><td>✗</td><td>✗</td><td>✗</td></tr></table><li>Bindings: <b>email.pedido.*</b>, <b>email.promo.#</b>, <b>email.#</b> (* = uma palavra; # = zero ou mais)</li><li>Fila única: 50.000 ÷ 100/s = <b>500 s (8 min 20 s)</b>; filas separadas: <b>&lt; 1 s</b></li><li>Sem rota: descarte em silêncio; <b>mandatory = true</b> devolve (basic.return 312 NO_ROUTE); <b>alternate exchange</b> recebe o que ninguém roteou</li>`,
    'lab-amqp': () => `<table class="h3-sum"><tr><th>pasta</th><th>exchange</th><th>filas</th><th>mensagens</th></tr><tr><td>default/</td><td>ecommerce.nova.venda (direct)</td><td>cobrar</td><td>laço de 3 bilhões</td></tr><tr><td>topic/</td><td>…faturamento (topic)</td><td>default, prioritario, datalake</td><td>20 (10% alta)</td></tr><tr><td>fanout/</td><td>ecommerce.nova.venda (fanout)</td><td>cobrar_pedido, reservar_estoque, informar_logistica</td><td>1.000</td></tr></table><li>default/ e fanout/ usam o <b>mesmo nome</b> com tipos diferentes: o segundo a rodar recebe <b>406 PRECONDITION_FAILED</b></li><li>Mensagens text/plain <b>sem DeliveryMode persistente</b>; nenhum consumidor chama <b>ch.Qos</b> (sem prefetch); <b>d.Ack(true)</b> usa multiple = true</li><li>streadway/amqp está arquivado; o substituto é <b>rabbitmq/amqp091-go</b></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Mensagem real')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'fila') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'fila' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-fila3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'fila') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] && o.pos[nm] ? 1 : 0, to = o.pos[nm];
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      if (to) { if (!Bk.pos || Bk.f < 0.02) Bk.pos = to.slice(); else { const k = 1 - Math.exp(-dt / 0.25); Bk.pos = mix(Bk.pos, to, k); } }
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01 && !!Bk.pos;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? (Bk.kind === 'lane' || Bk.kind === 'slab' ? 0.22 : 0.55) : on === 2 ? 0.12 : 0;
      moveGlow(Bk.glow, Bk.pos ? [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3] : [0, 0, 0], on === 1 && Bk.f > 0.9 && (Bk.kind === 'actor' || Bk.kind === 'node' || Bk.kind === 'exch') ? 0.8 : 0); });
    setBeams(o.beams.filter(b => !b.need || b.need.every(n => o.show[n]))); placeCards(CARDS, o.cards, CW, CD, CH); placeCards(STK, o.stk, SW, SD, SH); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], p[2] + 30); });
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
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), ...STK.flatMap(c => [c.top, c.fr]), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); [...CARDS, ...STK].forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] && o.pos[nm] ? 1 : 0; if (o.pos[nm]) B[nm].pos = o.pos[nm].slice(); }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
