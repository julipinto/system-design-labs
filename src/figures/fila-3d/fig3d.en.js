// Figura 3D (iso-glow): filas, exchanges e tópicos MQTT. A fila é um corredor com as mensagens em fila indiana,
// a exchange é uma estação de triagem que copia a mensagem para as filas certas, e o broker MQTT é um tablado com a
// árvore de tópicos (loja → entregas → caminhao-17 → posicao) por onde o pacote anda.
// Cena: atrás, o mostrador (contadores, a mensagem ou o pacote real e o resultado); no meio e na frente, quem produz,
// as filas (ou a árvore) e quem consome. A peça ativa acende; o que dá errado fica vermelho.
// Cenários (toggle e ?mode=fifo|lote|dlq|mqtt|lab-mqtt|exchange|lab-amqp; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-assincrona-brief.md) e o código do lab público
// (exemplos/protocolos-assincronos: queue/, stack/, messages/mqtt/default/, messages/rabbit-mq/{default,topic,fanout}/).
FIGS3D.push({ id: 'fila', name: 'Queues and exchanges', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const hop = (a, b, f, h = 34) => { const p = mix(a, b, f); p[2] += Math.sin(Math.PI * clamp(f)) * h; return p; };
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['fifo', 'lote', 'dlq', 'mqtt', 'lab-mqtt', 'exchange', 'lab-amqp'];
  const SCNAME = { fifo: 'FIFO', lote: 'Batch', dlq: 'DLQ', mqtt: 'MQTT', 'lab-mqtt': 'MQTT lab', exchange: 'Exchange', 'lab-amqp': 'AMQP lab' };
  const SCFULL = { fifo: 'Queue (FIFO) and stack (LIFO)', lote: 'Batches', dlq: 'DLQ and poison message', mqtt: 'MQTT: the truck',
    'lab-mqtt': 'MQTT: the lab', exchange: 'AMQP: the emails exchange', 'lab-amqp': 'AMQP: the lab' };
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
      o.rows.prod = act('PEDIDOS', 'producer', ['puts on the queue', 'dim']); o.rows.cons = act('NOTIFICACOES', 'consumer', ['reads from the front', 'dim']);
      o.rows.fila = lane('QUEUE emails', 'in at the back → out at the front'); o.rows.pilha = lane('STACK undo 1051', 'LIFO');
      o.rows.cons2 = act('NOTIFICACOES-2', 'another replica', ['reads the same queue', 'dim']);
      o.beams.push({ pts: R.p2f }, { pts: R.f2c });
    }
    if (sc === 'dlq') {
      o.rows.fila = lane('QUEUE emails', 'in at the back → out at the front'); o.rows.fila2 = lane('QUEUE emails.dlq', 'dead messages · alert if > 0');
      o.rows.cons = act('NOTIFICACOES', 'consumer', ['sends the email', 'dim']); o.rows.side = act('PROVIDER', 'email', ['100 emails/s', 'dim']);
      o.beams.push({ pts: R.f2c }, { pts: R.c2v, need: ['side'] }, { pts: R.c2d, need: ['fila2'] });
    }
    if (sc === 'mqtt' || sc === 'lab-mqtt') {
      o.rows.broker = { name: 'MQTT BROKER', meta: 'Mosquitto · port 1883' };
      o.rows.prod = act('caminhao-17', '4G', ['carries order 1048', 'dim'], ['position every 5 s', 'dim']);
      o.rows.side = act('TRACKING', 'subscriber', ['loja/entregas/+/posicao', 'acc']); o.rows.cons = act('SCREEN 1048', 'Lena opens it', ['subscribes to the truck', 'dim']);
      o.rows.n0 = node('loja'); o.rows.n1 = node('entregas'); o.rows.n2 = node('caminhao-17'); o.rows.n3 = node('+ others', '200 on Black Friday');
      o.rows.n4 = node('posicao'); o.rows.n5 = node('status');
      if (sc === 'mqtt') o.beams.push({ pts: R.t2n0 }, { pts: R.e01 }, { pts: R.e12 }, { pts: R.e13 }, { pts: R.e24 }, { pts: R.e25 }, { pts: R.n4r }, { pts: R.n5r });
      else { o.rows.prod = act('producer.go', 'QoS 1', ['producer-<unix>', 'dim'], ['1 message per s', 'dim']); o.rows.side = act('consumer.go', 'QoS 1', ['subscribes to linuxtips/iot', 'acc'], ['CleanSession(true)', 'dim']);
        o.rows.n0 = node('linuxtips'); o.rows.n1 = node('iot'); o.beams.push({ pts: R.t2n0 }, { pts: R.e01 }, { pts: R.n1c }); }
    }
    if (sc === 'exchange' || sc === 'lab-amqp') {
      o.rows.prod = act('NOTIFICACOES', 'producer', ['publishes to the exchange', 'dim']); o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['routes by the', 'dim'], ['routing key', 'dim']);
      o.rows.qa = lane('emails.transacionais', 'email.pedido.*'); o.rows.qb = lane('emails.promocionais', 'email.promo.#'); o.rows.qc = lane('emails.auditoria', 'email.#');
      o.rows.side = act('PROVIDER', 'email', ['100 emails/s', 'dim']); o.rows.cons = act('AUDIT', 'consumer', ['keeps a copy of everything', 'dim']);
      o.beams.push({ pts: R.p2x }, { pts: R.x2a, need: ['qa'] }, { pts: R.x2b, need: ['qb'] }, { pts: R.x2c, need: ['qc'] }, { pts: R.a2v, need: ['qa', 'side'] }, { pts: R.b2v, need: ['qb', 'side'] }, { pts: R.c2a, need: ['qc', 'cons'] });
      if (sc === 'lab-amqp') { o.rows.prod = act('producer.go', 'streadway/amqp', ['port 5672', 'dim']); o.rows.side = act('consumer.go', 'auto-ack false', ['d.Ack(true)', 'dim']); }
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
  const QUEUE_GO = ['type Queue []interface{}', 'func (q *Queue) Enqueue(item interface{}) {', '  *q = append(*q, item)   // at the back', '}', 'func (q *Queue) Dequeue() interface{} {', '  item := (*q)[0]; *q = (*q)[1:]   // from the front'];
  const STACK_GO = ['type Stack []interface{}', 'func (s *Stack) Push(item interface{}) {', '  *s = append(*s, item)   // on top', '}', 'func (s *Stack) Pop() interface{} {', '  item := (*s)[len(*s)-1]   // from the top'];
  const ORD = [1049, 1050, 1051];
  const STEPS = {
    fifo: [
      { id: 'enqueue', dur: 5.5, title: 'Enqueue: 1049, 1050 and 1051 join at the back', yk: 'IN THE LAB · queue/main.go', code: QUEUE_GO,
        story: 'pedidos puts one notice on the emails queue for each paid order: first 1049, then 1050, last Lena\'s 1051. Enqueue puts each one at the back of the queue. 1049 walks to the front; the others stop behind it, in the order they arrived.',
        look: 'Three cards leave PEDIDOS and enter at the back of the lane. 1049 goes to the front, next to NOTIFICACOES.',
        key: 'Queue (FIFO): the first one in is the first one out.',
        f(o, t) { let n = 0; ORD.forEach((id, k) => { const t0 = 0.4 + k * 1.3; if (t < t0) return; n++; C(o, enq(t, t0, SX(k)), String(id), 'email', t < t0 + 1.1 ? 'acc' : ''); });
          if (n) { o.on.prod = 1; o.on.fila = 2; o.rows.prod = act('PEDIDOS', 'producer', ['puts on the queue', 'dim'], [`Enqueue(${ORD[n - 1]})`, 'acc']); }
          o.cnt = [['IN QUEUE', String(n)], ['LAST IN', n ? String(ORD[n - 1]) : '—', 'dim'], ['ORDER', 'FIFO', 'dim']];
          o.res = n ? ['queue: [' + ORD.slice(0, n).join(' ') + ']'] : [];
          if (t > 4.3) T(o, TR(), 'arrival order\n1049 → 1050 → 1051'); } },
      { id: 'dequeue', dur: 6.5, title: 'Dequeue: the first one in comes out', yk: 'IN THE LAB · queue/main.go', code: QUEUE_GO,
        story: 'Now notificacoes reads. Dequeue always takes from the front of the queue: 1049 comes out, the ones behind move up a spot, then 1050, then 1051. It is what the lab does with Pizza, Hamburger and Churrasco: they come out in the order they went in.',
        look: 'The front card hops to NOTIFICACOES; the others move one spot forward. The OUT list grows 1049, 1050, 1051.',
        key: 'Dequeue takes from the front; the exit order is the arrival order.',
        f(o, t) { const out = [];
          ORD.forEach((id, k) => { const tk = 0.5 + k * 1.8, slid = ORD.slice(0, k).reduce((a, _, j) => a + sg(t, 0.5 + j * 1.8 + 0.5, 0.5 + j * 1.8 + 1.1), 0);
            if (t < tk) return C(o, [SX(k - slid), LY, ZL], String(id), 'email');
            if (t < tk + 0.8) { o.on.cons = 1; return C(o, hop([SX(0), LY, ZL], CONSP, ease((t - tk) / 0.8), 34), String(id), 'Dequeue()', 'acc'); }
            out.push(id); if (t < tk + 1.5) { o.on.cons = 1; C(o, CONSP, String(id), 'sent', 'acc'); } });
          const cur = out.length ? out[out.length - 1] : null;
          if (cur) o.rows.cons = act('NOTIFICACOES', 'consumer', [`Dequeue() → ${cur}`, 'acc'], ['email sent', 'dim']);
          o.cnt = [['OUT', out.length ? out.join(' ') : '—'], ['IN QUEUE', String(3 - out.length), 'dim'], ['ORDER', 'arrival order', 'dim']];
          o.res = out.length ? ['Output: ' + out.join(', ')] : [];
          if (out.length === 3) T(o, TR(), 'out 1049 → 1050 → 1051\nsame order'); } },
      { id: 'pilha', dur: 5.5, title: 'Stack (LIFO): the actions for 1051 pile up', yk: 'IN THE LAB · stack/main.go', code: STACK_GO,
        story: 'The stack does the opposite of the queue: the last one in comes out first. Its proper place in the store is undoing. For order 1051 the store did three things in order: pay, reserve stock and create the shipment. Each goes on top of the stack.',
        look: 'Next to the queue, three tall cards drop on top of each other: pay at the bottom, create shipment on top.',
        key: 'Stack (LIFO): the last one in is the first one out.',
        f(o, t) { o.show.pilha = 1; o.on.pilha = 2; const acts = ['pay', 'reserve stock', 'create shipment']; let n = 0;
          acts.forEach((a, k) => { const t0 = 0.4 + k * 1.3; if (t < t0) return; n++; const f = sg(t, t0, t0 + 0.8);
            S(o, [PILHAP[0], PILHAP[1], ZL + k * SH + (1 - f) * 120], a, `Push · #${k + 1}`, k === n - 1 ? 'acc' : ''); });
          o.cnt = [['IN STACK', String(n)], ['TOP', n ? acts[n - 1] : '—', 'dim'], ['ORDER', 'LIFO', 'dim']];
          o.res = n ? ['top: ' + acts[n - 1]] : [];
          if (t > 4.2) T(o, TR(), 'top: create shipment'); } },
      { id: 'desfazer', dur: 7, title: 'Undo: the top one comes out first', yk: 'IN THE LAB · stack/main.go', code: STACK_GO,
        story: 'If 1051 has to be undone, the right order is the reverse. Pop takes from the top: first it cancels the shipment, then returns the stock, last it refunds the payment. It is the same Churrasco, Hamburger, Pizza from the lab, and it is the compensation that module 19 will use.',
        look: 'The cards leave the top of the stack, one at a time, and become the undo actions in the lane, front to back.',
        key: 'Undo comes out in reverse order: LIFO.',
        f(o, t) { o.show.pilha = 1; o.rows.fila = lane('UNDO 1051', 'exit order →'); const acts = ['pay', 'reserve stock', 'create shipment'], undo = ['refund payment', 'return stock', 'cancel shipment'];
          const DX = [590, 434, 278], out = [];
          acts.forEach((a, k) => { const j = 2 - k, tj = 0.5 + j * 1.8, home = [PILHAP[0], PILHAP[1], ZL + k * SH];
            if (t < tj) return S(o, home, a, `Push · #${k + 1}`, k === 2 - Math.min(2, Math.floor(Math.max(0, t - 0.5) / 1.8)) ? 'acc' : '');
            const f = clamp((t - tj) / 1.0), p = hop(home, [DX[j], LY, ZL], ease(f), 50); out.push(undo[k]);
            S(o, p, f < 0.5 ? a : undo[k], f < 0.5 ? 'Pop()' : `#${j + 1} out`, f < 1 ? 'acc' : '', 0.85); });
          o.on.pilha = out.length < 3 ? 1 : 0; o.on.fila = out.length ? 2 : 0;
          o.cnt = [['IN STACK', String(3 - out.length)], ['CAME OUT', out.length ? out[out.length - 1] : '—', 'dim'], ['ORDER', 'reverse', 'dim']];
          o.res = out.length ? ['Output: ' + out.slice(0, 2).join(', ') + (out.length > 2 ? ',' : ''), out[2] || ''] : [];
          if (out.length === 3 && t > 6) T(o, TR(), 'shipment → stock → payment\nreverse order'); } },
      { id: 'lento', dur: 6, title: 'What if it goes wrong: a slow consumer holds up the queue', yk: 'ON THE emails QUEUE', code: ['# the email for 1049 is slow at the provider', 'Dequeue() → 1049   // processing…', '# 1050 and 1051 wait behind it', '# the order is guaranteed,', '# and the price is waiting'],
        story: 'The ordering guarantee has a price. The provider takes a long time to accept the email for 1049, and notificacoes is stuck on it. 1050 and 1051 are ready, but the queue only hands out the next one when the first is done.',
        look: '1049 turns red on top of NOTIFICACOES; 1050 and 1051 stay parked in the lane.',
        key: 'In a queue with one consumer, the slow one holds up everything behind it.',
        f(o, t) { const tk = 0.4, gone = t > tk;
          if (!gone) C(o, [SX(0), LY, ZL], '1049', 'email'); else { o.on.cons = 'bad'; C(o, hop([SX(0), LY, ZL], CONSP, sg(t, tk, tk + 0.8), 34), '1049', 'processing', t > tk + 0.8 ? 'bad' : 'acc'); }
          C(o, [SX(1), LY, ZL], '1050', 'waiting', t > 1.6 ? 'bad' : ''); C(o, [SX(2), LY, ZL], '1051', 'waiting', t > 1.6 ? 'bad' : '');
          if (gone) o.rows.cons = act('NOTIFICACOES', 'consumer', ['1049: processing…', 'bad'], ['the provider is not answering', 'dim']);
          o.cnt = [['WAITING', t > 1.2 ? '2' : '0', t > 1.2 ? 'bad' : ''], ['IN THE CONSUMER', gone ? '1049' : '—', 'dim'], ['OUT', '0', 'dim']];
          o.res = t > 1.6 ? ['1050 and 1051 stalled behind 1049'] : [];
          if (t > 2) T(o, TR(), '1050 and 1051 ready\nbut the queue waits for 1049', 'bad'); } },
      { id: 'dois', dur: 7, title: 'What if it goes wrong: two consumers scramble the order', yk: 'ON THE emails QUEUE', code: ['# 2 replicas reading the same queue', 'replica 1: Dequeue() → 1049 (slow)', 'replica 2: Dequeue() → 1050', 'replica 2: Dequeue() → 1051', 'replica 1: finishes 1049', '# output: 1050, 1051, 1049'],
        story: 'The obvious way out is a second replica of notificacoes reading the same queue. The queue moves again, but the order is gone: replica 2 takes 1050 and 1051 and finishes before replica 1 is done with 1049. The queue hands them out in order; it is the processing that does not finish in order.',
        look: 'NOTIFICACOES-2 shows up in the back and takes 1050 and 1051; 1049 comes out last. The EXIT ORDER turns red.',
        key: 'Several consumers on the same queue lose the global order.',
        f(o, t) { o.show.cons2 = 1; const out = [];
          if (t < 0.4) C(o, [SX(0), LY, ZL], '1049', 'email'); else if (t < 5.4) { o.on.cons = 'bad'; C(o, hop([SX(0), LY, ZL], CONSP, sg(t, 0.4, 1.2), 34), '1049', 'processing', t > 1.2 ? 'bad' : 'acc'); }
          [[1050, 1.6], [1051, 3.2]].forEach(([id, tk], j) => { const slid = sg(t, 0.9, 1.4) + (j ? sg(t, tk - 1.0, tk - 0.5) : 0);
            if (t < tk) return C(o, [SX(j + 1 - slid), LY, ZL], String(id), 'email');
            if (t < tk + 0.8) { o.on.cons2 = 1; return C(o, hop([SX(0), LY, ZL], CONS2P, ease((t - tk) / 0.8), 40), String(id), 'replica 2', 'acc'); }
            out.push(id); if (t < tk + 1.3) C(o, CONS2P, String(id), 'sent', 'acc'); });
          if (t > 5.4) { out.push(1049); if (t < 6.2) C(o, CONSP, '1049', 'sent', 'acc'); }
          o.rows.cons = act('NOTIFICACOES', 'replica 1', t > 5.4 ? ['1049: sent', 'acc'] : ['1049: processing…', 'bad']);
          o.rows.cons2 = act('NOTIFICACOES-2', 'replica 2', [out.filter(v => v !== 1049).length ? `sent ${out.filter(v => v !== 1049).join(', ')}` : 'reads the same queue', out.length ? 'acc' : 'dim']);
          const bad = out.length && out[0] !== 1049;
          o.cnt = [['EXIT ORDER', out.length ? out.join(' ') : '—', bad ? 'bad' : ''], ['ARRIVAL ORDER', '1049 1050 1051', 'dim'], ['REPLICAS', '2', 'dim']];
          o.res = out.length === 3 ? ['came out 1050, 1051, 1049: order lost'] : [];
          if (out.length === 3) T(o, TR(), 'output: 1050 → 1051 → 1049\nthe global order is lost', 'bad'); } },
    ],
    lote: [
      { id: 'dia', dur: 7, title: 'Batch processing: the 23:00 close', yk: 'THE BATCH FROM MODULE 11', code: ['-- 23:00, once a day', 'SELECT … FROM itens_pedido', ' WHERE dia = hoje;   -- 400k rows', '# 1 core: 40 + 2 = 42 s', '# 4 cores: 10 + 2 = 12 s'],
        story: 'Batch has two meanings. The first is batch processing: the 23:00 close from module 11 gathers the whole day, 400 thousand rows of itens_pedido, and processes everything at once. On 4 cores it takes 12 s, and the day summary is ready at 23:00:12.',
        look: 'The lane becomes the day\'s itens_pedido and fills up as the clock moves; at 23:00 everything hops at once to RELATORIOS.',
        key: 'Batch processing: gather everything and process it at once, at the scheduled time.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'the whole day', ['writes itens_pedido', 'dim']); o.rows.fila = lane('the day\'s itens_pedido', 'gathers and waits until 23:00');
          o.rows.cons = act('RELATORIOS', 'runs at 23:00', ['4 cores', 'dim']);
          const day = clamp((t - 0.3) / 3.7), hh = Math.floor(day * 23), lines = Math.round(day * 400), run = t > 4.2, done = t > 5.2;
          const n = Math.min(6, Math.ceil(day * 6));
          for (let i = 0; i < n && t < 5.3; i++) { const p = [SX(i), LY, ZL]; C(o, run ? hop(p, CONSP, sg(t, 4.2 + i * 0.05, 5.0 + i * 0.05), 40) : p, 'rows', `${(i + 1) * 66}k`, run ? 'acc' : '', 0.9); }
          if (t > 0.3 && !run) { o.on.prod = 2; o.on.fila = 2; }
          if (run && !done) o.on.cons = 1; if (done) { o.rows.cons = act('RELATORIOS', '23:00:12', ['400k rows in 12 s', 'acc'], ['day summary saved', 'dim']); o.on.cons = 2; }
          o.cnt = [['TIME', run ? (done ? '23:00:12' : '23:00') : `${String(hh).padStart(2, '0')}:00`], ['ROWS', `${lines}k`, 'dim'], ['BATCH TIME', done ? '12 s' : '—', 'dim']];
          o.res = done ? ['day summary ready at 23:00:12'] : [];
          if (done) T(o, TR(), '400k rows\n12 s on 4 cores'); } },
      { id: 'sem', dur: 5.5, title: 'No batching on send: one request per event', yk: 'KAFKA PRODUCER · p0', code: ['linger.ms = 0', '# each event leaves on its own', '40 events/s on p0 → 40 sends/s', '3 partitions → 120 sends/s'],
        story: 'The second meaning is batching on send, a producer decision. On Black Friday 40 events per second arrive on each partition of the pedidos topic. If every event goes to the broker on its own, that is 40 requests per second on p0 alone, 120 across the three partitions.',
        look: 'Each event leaves PEDIDOS and hops to kafka-1 on its own, one behind the other.',
        key: 'Without a batch, every event costs a request.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'Kafka producer', ['linger.ms = 0', 'acc']); o.rows.fila = lane('NO BATCH · linger.ms = 0', 'each event leaves on its own');
          o.rows.cons = act('kafka-1', 'p0 leader', ['gets 40 sends/s', 'acc']); o.on.prod = 2; o.on.cons = 1;
          for (let j = Math.max(0, Math.floor((t - 1.3) / 0.3)); j <= Math.floor((t - 0.3) / 0.3); j++) { const tj = 0.3 + j * 0.3; if (t < tj || t > tj + 1) continue;
            C(o, hop(PRODP, CONSP, ease(t - tj), 50), 'event', '1 send', 'acc', 0.6); }
          lit(o, R.p2f); lit(o, R.f2c);
          o.cnt = [['SENDS/s ON p0', '40'], ['EVENTS PER SEND', '1', 'dim'], ['ACROSS 3 PARTITIONS', '120 sends/s', 'dim']];
          o.res = ['120 requests per second'];
          if (t > 2) T(o, TR(), '40 events/s = 40 sends/s\non p0 alone'); } },
      { id: 'linger', dur: 8, title: 'linger.ms = 200: 8 events per send', yk: 'KAFKA PRODUCER · p0', code: ['linger.ms = 200', '40 events/s × 0.2 s = 8 per batch', '1 s ÷ 0.2 s = 5 sends/s on p0', '3 partitions: 15 sends/s (instead of 120)', '# batch.size (default 16384) is in bytes'],
        story: 'With linger.ms = 200, the producer waits up to 200 ms before sending and gathers whatever arrives in that time. At 40 events per second, 8 arrive in 200 ms. Instead of 40 sends per second on p0 there are 5, and 15 in total: 8× fewer requests, at the cost of up to 200 ms of delay.',
        look: 'The events fill the BATCH lane up to 8; when the clock hits 200 ms, the 8 hop together to kafka-1.',
        key: 'Batching on send: fewer requests in exchange for a little waiting.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'Kafka producer', ['linger.ms = 200', 'acc']); o.rows.fila = lane('BATCH · linger.ms = 200', 'gathers up to 200 ms');
          o.rows.cons = act('kafka-1', 'p0 leader', ['gets 5 batches/s', 'acc']); o.on.prod = 2;
          const ph = Math.max(0, t - 0.4) % 2.0, cyc = Math.floor(Math.max(0, t - 0.4) / 2.0), fill = ph < 1.6, n = fill ? Math.min(8, Math.floor(ph / 0.2) + (t > 0.4 ? 1 : 0)) : 8;
          for (let i = 0; i < n; i++) { const slot = [628 - i * 54, LY, ZL], ti = i * 0.2;
            const p = fill ? (ph < ti + 0.25 ? hop(PRODP, slot, ease((ph - ti) / 0.25), 26) : slot) : hop(slot, CONSP, sg(ph, 1.6, 1.95), 46);
            if (!fill && ph > 1.95) continue; C(o, p, 'event', fill ? `${i + 1} of 8` : 'batch', fill ? '' : 'acc', 0.7); }
          o.on.fila = fill ? 2 : 1; if (!fill) { o.on.cons = 1; lit(o, R.f2c); }
          const ms = fill ? Math.round(ph / 1.6 * 200) : 200;
          o.cnt = [['IN THE BATCH', `${n} of 8`], ['WAIT', `${ms} ms`, 'dim'], ['SENDS/s ON p0', '5', 'dim']];
          o.res = cyc > 0 || !fill ? ['15 sends/s instead of 120: 8× fewer'] : [];
          if (!fill) T(o, TR(), 'batch of 8\n1 send'); } },
      { id: 'baixo', dur: 6, title: 'What if it goes wrong: PedidoPago waits 200 ms for nothing', yk: 'KAFKA PRODUCER · p0', code: ['linger.ms = 200', '# small hours: almost no events', 'PedidoPago 1051 enters an empty batch', '# nobody else arrives within 200 ms', '→ leaves alone, 200 ms later'],
        story: 'Batching charges the delay even when there is no batch to make. With low traffic, the PedidoPago for 1051 enters alone and waits the full 200 ms. No other event arrives, and it leaves alone, 200 ms later. linger.ms is a trade between throughput and delay.',
        look: 'A single card sits in the BATCH lane while the WAIT climbs to 200 ms; then it hops to kafka-1 on its own.',
        key: 'A high linger.ms with little traffic only adds delay.',
        f(o, t) { o.rows.prod = act('PEDIDOS', 'Kafka producer', ['linger.ms = 200', 'acc']); o.rows.fila = lane('BATCH · linger.ms = 200', 'low traffic');
          o.rows.cons = act('kafka-1', 'p0 leader', ['waiting for the batch', 'dim']);
          const slot = [628, LY, ZL], ms = Math.round(clamp((t - 0.8) / 3.8) * 200), sent = t > 4.6;
          if (t > 0.4) C(o, sent ? hop(slot, CONSP, sg(t, 4.6, 5.3), 46) : t < 0.8 ? hop(PRODP, slot, ease((t - 0.4) / 0.4), 26) : slot, 'PedidoPago', '1051', sent ? 'acc' : t > 1.5 ? 'bad' : '', 0.9);
          if (t > 0.4 && !sent) o.on.fila = 'bad'; if (sent) { o.on.cons = 1; lit(o, R.f2c); o.rows.cons = act('kafka-1', 'p0 leader', ['batch of 1 event', 'bad'], ['200 ms later', 'dim']); }
          o.cnt = [['WAIT', `${ms} ms`, ms > 50 ? 'bad' : ''], ['IN THE BATCH', t > 0.4 ? '1' : '0', 'dim'], ['GAIN', 'none', 'dim']];
          o.res = sent ? ['+200 ms on Lena\'s payment, for nothing'] : [];
          if (t > 2) T(o, TR(), 'alone in the batch\nwaits the full 200 ms', 'bad'); } },
    ],
    dlq: [
      { id: 'falha', dur: 6, title: 'The email for 1051 fails: 550', yk: 'MESSAGE ON THE emails QUEUE', code: ['{ "pedido_id": 1051,', '  "tipo": "confirmacao",', '  "para": "Lena" }', '', 'provider → 550 invalid address'],
        story: 'Now a message that does not work out. notificacoes takes the confirmation email for 1051 off the queue and hands it to the provider. The provider answers 550 invalid address. Behind 1051, other emails wait their turn.',
        look: 'Card 1051 hops to NOTIFICACOES, the light goes to the PROVIDER and comes back red with the 550.',
        key: 'A message that fails cannot just vanish or block the queue.',
        f(o, t) { const tk = 0.4; C(o, t < tk ? [SX(0), LY, ZL] : hop([SX(0), LY, ZL], CONSP, sg(t, tk, tk + 0.8), 34), '1051', 'email', t > 3 ? 'bad' : t > tk ? 'acc' : '');
          [1, 2, 3].forEach(i => C(o, [SX(i - sg(t, 0.9, 1.4)), LY, ZL], 'email', 'other order'));
          if (t > tk) o.on.cons = t > 3 ? 'bad' : 1;
          send(o, t, 1.4, 2.0, R.c2v, 'email 1051', 'acc', 0.2); if (t > 1.8 && t < 3) o.on.side = 1;
          if (send(o, t, 2.4, 3.0, rev(R.c2v), '550 invalid address', 'bad', 1.2)) { o.rows.cons = act('NOTIFICACOES', 'consumer', ['1051: 550', 'bad'], ['invalid address', 'dim']); }
          o.cnt = [['ATTEMPTS', '0 of 3'], ['TIME', '0 s', 'dim'], ['IN THE DLQ', '0', 'dim']];
          o.res = t > 3 ? ['failed: 550 invalid address'] : [];
          if (t > 3.4) T(o, TR(), '550 invalid address', 'bad'); } },
      { id: 'retry', dur: 9.5, title: '3 attempts: wait 1 s, 5 s and 30 s', yk: 'NOTIFICACOES ATTEMPTS', code: ['fails → wait 1 s  → attempt 1 → 550', '        wait 5 s  → attempt 2 → 550', '        wait 30 s → attempt 3 → 550', '# longer and longer waits (backoff)', '# 1 + 5 + 30 = 36 s after the 1st failure'],
        story: 'A failure may be temporary, so notificacoes tries again. It waits 1 s and tries: 550. Waits 5 s and tries: 550. Waits 30 s and tries a third time: 550. Thirty-six seconds after the first failure, the address is still invalid.',
        look: 'The light goes back and forth three times between NOTIFICACOES and the PROVIDER, always red. The TIME jumps from 1 s to 6 s and 36 s.',
        key: 'Retrying fixes temporary failures; this one is not temporary.',
        f(o, t) { C(o, CONSP, '1051', 'email', 'bad'); [1, 2, 3].forEach(i => C(o, [SX(i - 1), LY, ZL], 'email', 'waiting'));
          const W_ = [1, 5, 30], AT = [0.6, 3.4, 6.2]; let n = 0, tm = 0;
          AT.forEach((a, k) => { if (t < a) return; tm = W_.slice(0, k + 1).reduce((x, y) => x + y, 0);
            send(o, t, a + 0.9, a + 1.4, R.c2v, `attempt ${k + 1}`, 'acc', 0.1); if (send(o, t, a + 1.7, a + 2.2, rev(R.c2v), '550', 'bad', 0.4)) n = k + 1;
            if (t > a + 1.3 && t < a + 2.2) o.on.side = 1; });
          o.on.cons = 'bad'; const wait = AT.findIndex((a, k) => t >= a && t < a + 0.9);
          o.rows.cons = act('NOTIFICACOES', 'consumer', [wait >= 0 ? `waits ${W_[wait]} s` : n ? `attempt ${n}: 550` : 'failed: 550', 'bad'], [`${n} of 3 attempts`, 'dim']);
          o.cnt = [['ATTEMPTS', `${n} of 3`, n ? 'bad' : ''], ['TIME', `${tm} s`, 'dim'], ['IN THE DLQ', '0', 'dim']];
          o.res = n === 3 ? ['3 attempts, 3 times 550'] : [];
          if (n === 3) T(o, TR(), 'attempt 3 of 3: 550\n36 s later', 'bad'); } },
      { id: 'dlq', dur: 7, title: 'It goes to emails.dlq; the queue moves on', yk: 'MESSAGE ON emails.dlq', code: ['{ "pedido_id": 1051,', '  "tipo": "confirmacao",', '  "motivo": "550 endereço inválido",', '  "tentativas": 3 }', '# alert: emails.dlq > 0'],
        story: 'With the 3 attempts used up, notificacoes sends the message to emails.dlq, the dead letter queue, with the reason attached. The main queue starts moving again and the other emails go out. Someone looks at the DLQ later: it has an alert if it goes above 0.',
        look: 'Card 1051 hops to the emails.dlq lane and stays there, red. The other emails move up and go out to the PROVIDER.',
        key: 'The DLQ takes the bad message out of the way and keeps the reason for someone to look at.',
        f(o, t) { const p0 = CONSP, p1 = [SX(0), DLQY, ZL], f = sg(t, 0.4, 1.3); C(o, hop(p0, p1, f, 50), '1051', f >= 1 ? '550 · 3 tries' : 'to the DLQ', 'bad');
          if (t > 0.4) { lit(o, R.c2d, 'bad'); o.on.fila2 = 'bad'; }
          const sent = [];
          [1, 2, 3].forEach(i => { const tk = 1.6 + (i - 1) * 1.6, slid = [1, 2, 3].slice(0, i - 1).reduce((a, j) => a + sg(t, 1.6 + (j - 1) * 1.6 + 0.5, 1.6 + (j - 1) * 1.6 + 1.0), 0);
            if (t < tk) return C(o, [SX(i - 1 - slid), LY, ZL], 'email', 'other order');
            if (t < tk + 0.7) { o.on.cons = 1; return C(o, hop([SX(0), LY, ZL], CONSP, ease((t - tk) / 0.7), 34), 'email', 'leaving', 'acc'); }
            sent.push(i); if (t < tk + 1.2) { send(o, t, tk + 0.7, tk + 1.1, R.c2v, '', 'acc', 0); o.on.side = 1; } });
          o.rows.cons = act('NOTIFICACOES', 'consumer', [sent.length ? `${sent.length} emails sent` : '1051 → emails.dlq', sent.length ? 'acc' : 'bad']);
          o.rows.fila2 = lane('QUEUE emails.dlq', '1 message · alert!');
          o.cnt = [['IN THE DLQ', t > 1.3 ? '1' : '0', 'bad'], ['TIME', '36 s', 'dim'], ['MAIN QUEUE', sent.length ? `${sent.length} out` : 'moving', 'dim']];
          o.res = t > 1.3 ? ['emails.dlq: 1 · the main queue moved on'] : [];
          if (t > 1.6) T(o, TR(), 'alert: emails.dlq > 0', 'bad'); } },
      { id: 'veneno', dur: 8, title: 'What if it goes wrong: without a DLQ, the bad message blocks the queue', yk: 'NO DLQ · nack + requeue', code: ['# no DLQ: the message goes back to the front', 'try 1051 → 550 → back', 'try 1051 → 550 → back …', '40 events/s × 60 s = 2,400 per minute', '# on Kafka p0 it is the same: the offset', '# does not advance while the event fails'],
        story: 'Without a DLQ, the message that fails goes back to the front and is tried again, forever. That is the poison message. Nobody behind it gets out. If this queue were p0 of the pedidos topic, at 40 events per second, the line behind it would grow 2,400 events per minute.',
        look: '1051 goes back and forth between the queue and NOTIFICACOES, red. Behind it the cards pile up and the BEHIND IT counter keeps climbing.',
        key: 'Poison message: without a DLQ, one bad message stops the whole queue.',
        f(o, t) { o.show.fila2 = 0; o.rows.fila = lane('QUEUE WITHOUT DLQ (or p0)', '40 events/s arriving'); o.on.fila = 'bad'; o.on.cons = 'bad';
          const ph = (t % 1.8) / 1.8, tries = Math.floor(t / 1.8) + 1, head = [SX(0), LY, ZL];
          C(o, ph < 0.5 ? hop(head, CONSP, ease(ph * 2), 34) : hop(CONSP, head, ease((ph - 0.5) * 2), 34), '1051', ph < 0.5 ? `attempt ${tries}` : 'back', 'bad');
          if (ph > 0.3 && ph < 0.6) { lit(o, R.c2v, 'bad'); o.on.side = 1; }
          const n = Math.min(5, 1 + Math.floor(t / 1.2)); for (let i = 1; i <= n; i++) C(o, [SX(i), LY, ZL], i === 5 ? `+${thou(clamp(t / 7) * 2400)}` : 'event', i === 5 ? 'behind' : 'waiting', i > 2 ? 'bad' : '');
          o.rows.cons = act('NOTIFICACOES', 'consumer', [`attempt ${tries}: 550`, 'bad'], ['and back to the queue', 'dim']);
          o.cnt = [['BEHIND IT', thou(clamp(t / 7) * 2400), 'bad'], ['ATTEMPTS', String(tries), 'bad'], ['PROCESSED', '0', 'dim']];
          o.res = ['queue stuck: 2,400 per minute behind'];
          if (t > 2) T(o, TR(), 'poison message\nnobody behind it gets out', 'bad'); } },
    ],
    mqtt: [
      { id: 'publica', dur: 6.5, title: 'PUBLISH: 77 bytes every 5 s', yk: 'PUBLISH PACKET · MQTT 3.1.1 · QoS 1', code: ['topic: loja/entregas/caminhao-17/posicao', 'payload: {"lat":-8.0476,"lng":-34.877,"vel":62}', '1 (type) + 1 (length) + 2 + 33 (topic)', '+ 2 (packet id) + 38 (payload)', '= 77 bytes'],
        story: 'caminhao-17 carries Lena\'s order 1048 to Recife. Its tracker publishes the position every 5 s, over a 4G link that drops in bad stretches. The PUBLISH packet is 77 bytes and goes to the topic loja/entregas/caminhao-17/posicao. tracking subscribed to loja/entregas/+/posicao: the + matches any truck, so it receives it.',
        look: 'The packet leaves the truck and walks the tree: loja, entregas, caminhao-17, posicao. Each node lights up as it passes; then it continues to TRACKING.',
        key: 'MQTT: the publisher sends to a topic; the broker delivers to whoever subscribed.',
        f(o, t) { o.on.prod = 1;
          if (send(o, t, 0.4, 1.0, R.t2n0, 'PUBLISH · 77 B', 'acc', 0)) o.on.n0 = 1;
          if (send(o, t, 1.0, 1.3, R.e01, '', 'acc', 0)) o.on.n1 = 1;
          if (send(o, t, 1.3, 1.7, R.e12, '', 'acc', 0)) o.on.n2 = 1;
          if (send(o, t, 1.7, 2.1, R.e24, '', 'acc', 0)) { o.on.n4 = 1; o.rows.n4 = node('posicao', '-8.0476, -34.877'); }
          if (t > 1.0) lit(o, R.t2n0); if (t > 1.3) lit(o, R.e01); if (t > 1.7) lit(o, R.e12); if (t > 2.1) lit(o, R.e24);
          if (send(o, t, 2.5, 3.2, R.n4r, 'position · 62 km/h', 'acc', 2)) { o.on.side = 1; o.rows.side = act('TRACKING', 'subscriber', ['loja/entregas/+/posicao', 'acc'], ['-8.0476, -34.877', 'hi'], ['62 km/h', 'dim']); }
          o.cnt = [['PACKET', '77 B'], ['QoS', '1', 'dim'], ['EVERY', '5 s', 'dim']];
          o.res = t > 3.2 ? ['TRACKING received: the + matched caminhao-17'] : t > 2.1 ? ['broker: does the topic match the filter?'] : [];
          if (t > 3.4) T(o, TR(), 'filter loja/entregas/+/posicao\n+ = one level'); } },
      { id: 'puback', dur: 5.5, title: 'QoS 1: the broker confirms with 4 bytes', yk: 'PUBACK PACKET · MQTT 3.1.1', code: ['PUBACK: 40 02 + packet id (2 bytes)', '= 4 bytes', '# without PUBACK, the truck resends with DUP = 1', '# that is why QoS 1 can duplicate', 'round trip: 77 + 4 = 81 B (HTTP + JWT: ~234 B)'],
        story: 'With QoS 1, the truck keeps the PUBLISH until the broker confirms. The confirmation is a 4-byte PUBACK. If the PUBACK gets lost, the truck resends with the DUP flag and tracking may receive the same position twice. QoS 1 is "at least once". The same data in an HTTP POST with a JWT would be about 234 bytes.',
        look: 'The PUBACK travels back from the posicao node to the truck. The counter shows 77 + 4 = 81 bytes round trip.',
        key: 'QoS 1: guaranteed delivery, with a chance of duplicates.',
        f(o, t) { ['n0', 'n1', 'n2', 'n4'].forEach(n => o.on[n] = 2); [R.t2n0, R.e01, R.e12, R.e24].forEach(p => lit(o, p)); o.rows.n4 = node('posicao', '-8.0476, -34.877');
          const back = [...rev(R.e24), ...rev(R.e12).slice(1), ...rev(R.e01).slice(1), ...rev(R.t2n0).slice(1)];
          if (send(o, t, 0.6, 2.2, back, 'PUBACK · 4 B', 'acc', 2)) { o.on.prod = 1; o.rows.prod = act('caminhao-17', '4G', ['PUBACK received', 'acc'], ['deletes its copy', 'dim']); }
          o.cnt = [['PUBACK', '4 B'], ['ROUND TRIP', '81 B', 'dim'], ['HTTP + JWT', '~234 B', 'dim']];
          o.res = t > 2.2 ? ['QoS 1: at least once (may duplicate)'] : [];
          if (t > 2.4) T(o, TR(), 'PUBACK: 4 bytes'); } },
      { id: 'retida', dur: 6, title: 'Retained message: the screen opens and already sees the truck', yk: 'RETAIN', code: ['PUBLISH … retain = 1', '# the broker keeps the last position of the topic', 'SUBSCRIBE loja/entregas/caminhao-17/posicao', '→ the broker delivers the retained one at once', '# without retain: the screen waits up to 5 s'],
        story: 'Lena opens the screen for order 1048. With nothing stored, the screen would stay blank until the next position, up to 5 s away. Because the truck publishes with retain, the broker keeps the last position of each topic and delivers it right away to whoever subscribes later.',
        look: 'SCREEN 1048 appears, sends the SUBSCRIBE, and the retained position on the posicao node goes straight to it.',
        key: 'Retained: the broker keeps the topic\'s last message for whoever arrives later.',
        f(o, t) { o.show.cons = 1; o.on.n4 = 1; o.rows.n4 = node('posicao', 'retained: -8.0476…');
          if (t > 0.5) send(o, t, 0.6, 1.3, rev(R.n4t), 'SUBSCRIBE', 'hi', 0.2);
          if (send(o, t, 1.7, 2.4, R.n4t, 'retained · at once', 'acc', 2)) { o.on.cons = 1; o.rows.cons = act('SCREEN 1048', 'Lena', ['-8.0476, -34.877', 'acc'], ['truck at 62 km/h', 'dim']); }
          o.cnt = [['RETAINED', '1 per topic'], ['SCREEN WAIT', t > 2.4 ? '0 s' : '…', 'dim'], ['WITHOUT RETAIN', 'up to 5 s', 'dim']];
          o.res = t > 2.4 ? ['the screen already opens with the truck'] : [];
          if (t > 2.6) T(o, TR(), 'opened and already saw\nthe last position'); } },
      { id: 'will', dur: 8, title: 'Last Will: the broker says the truck is gone', yk: 'CONNECT · LAST WILL', code: ['CONNECT caminhao-17 · keep-alive 60 s · 25 bytes', 'will: loja/entregas/caminhao-17/status', '      = offline', '# 1.5 × 60 s = 90 s without any packet', '→ the broker publishes the will for the truck'],
        story: 'The truck connected with a 60 s keep-alive and left a will: if it disappears without saying goodbye, publish offline to loja/entregas/caminhao-17/status. The 4G drops. After 90 s with no packet (1.5 × keep-alive), the broker declares the connection dead and publishes the will on the truck\'s behalf.',
        look: 'The truck turns red; the NO SIGNAL counter climbs to 90 s; then the status node lights up and the offline goes to TRACKING.',
        key: 'Last Will: the broker speaks for the client that dropped without warning.',
        f(o, t) { const s = Math.round(clamp((t - 0.4) / 4.4) * 90), dead = t > 4.8; o.on.prod = 'bad'; o.rows.prod = act('caminhao-17', 'no signal', [`${s} s without a packet`, 'bad']);
          if (dead) { o.on.n5 = 1; o.rows.n5 = node('status', 'offline'); lit(o, R.e25); }
          if (send(o, t, 5.2, 5.9, R.n5r, 'status = offline', 'bad', 3)) { o.on.side = 'bad'; o.rows.side = act('TRACKING', 'subscriber', ['caminhao-17: offline', 'bad'], ['notice from the broker', 'dim']); }
          o.cnt = [['NO SIGNAL', `${s} s`, 'bad'], ['LIMIT', '90 s (1.5 × 60)', 'dim'], ['STATUS', dead ? 'offline' : 'online', dead ? 'bad' : 'dim']];
          o.res = t > 5.9 ? ['status = offline: the broker spoke for the truck'] : [];
          if (t > 6) T(o, TR(), 'will published\nby the broker', 'bad'); } },
      { id: 'sinal', dur: 9, title: 'What if it goes wrong: 3 min without signal are 36 positions', yk: 'QoS AND A BAD CONNECTION', code: ['3 min × 60 s ÷ 5 s = 36 positions', 'QoS 0: lost', 'QoS 1: the truck keeps them and resends', '# the broker only keeps messages for subscribers,', '# not for publishers', '# position: the most recent by timestamp wins'],
        story: 'The truck enters a stretch with no signal for 3 minutes: that is 36 positions. With QoS 0, they are lost. With QoS 1, the truck\'s client has to keep them and resend when the network is back, because the broker only stores messages for subscribers. Since a position is idempotent, tracking keeps the most recent one by timestamp.',
        look: 'The positions pile up on top of the red truck until 36; when the signal returns, they all run to the broker.',
        key: 'A publisher on a bad network has to keep and resend: the broker does not do it for them.',
        f(o, t) { const n = Math.min(36, Math.round(clamp((t - 0.4) / 4.6) * 36)), back = t > 5.6;
          o.on.prod = back ? 1 : 'bad'; o.rows.prod = act('caminhao-17', back ? 'signal is back' : 'no signal', [back ? 'resending 36' : `kept ${n}`, back ? 'acc' : 'bad']);
          const drawn = Math.min(12, Math.ceil(n / 3));
          for (let i = 0; i < drawn; i++) { const p = [40 + (i % 4) * 28, 352 + Math.floor(i / 4) * 17, ZA], f = back ? sg(t, 5.6 + i * 0.12, 6.4 + i * 0.12) : 0;
            if (f >= 1) continue; C(o, f > 0 ? hop(p, ND('n0'), f, 40) : p, '', '', back ? 'acc' : 'bad', 0.34); }
          if (back) { send(o, t, 5.6, 7.6, R.t2n0, '36 positions', 'acc', 1); o.on.n0 = 1; }
          o.cnt = [['POSITIONS', String(n), back ? '' : 'bad'], ['NO SIGNAL', back ? '3 min' : `${Math.round(clamp((t - 0.4) / 4.6) * 180)} s`, 'dim'], ['WITH QoS 0', `${n} lost`, 'bad']];
          o.res = back ? ['QoS 1: the truck resent all 36'] : [];
          if (t > 2) T(o, TR(), back ? 'resends what it kept' : 'QoS 0: lost\nQoS 1: kept on the truck', back ? 'acc' : 'bad'); } },
    ],
    'lab-mqtt': [
      { id: 'lab', dur: 7, title: 'The lab: linuxtips/iot every 1 s', yk: 'IN THE LAB · messages/mqtt/default/producer.go', code: ['broker := "tcp://localhost:1883"', 'topic := "linuxtips/iot"', 'clientID := fmt.Sprintf("producer-%d", time.Now().Unix())', 'time.Sleep(3 * time.Second)   // waits for the consumer', 'client.Publish(topic, 1, false, message)', 'time.Sleep(1 * time.Second)'],
        story: 'The lab swaps the truck for a test producer. producer.go connects to Mosquitto at tcp://localhost:1883, waits 3 s for the consumer to be ready and publishes "Mensagem #N" with QoS 1 to the topic linuxtips/iot, one per second. consumer.go subscribes to the same topic.',
        look: 'producer.go connects, the counter waits 3 s, and then one message per second walks through linuxtips → iot to consumer.go.',
        key: 'In the lab, linuxtips/iot plays the role of loja/entregas/caminhao-17/posicao.',
        f(o, t) { o.on.prod = 1; const wait = Math.min(3, Math.max(0, t - 0.4) * 1.5), go = t > 2.4;
          if (!go) o.rows.prod = act('producer.go', 'connected', [`time.Sleep: ${wait.toFixed(1)} s`, 'acc']);
          let n = 0; if (go) { n = Math.floor((t - 2.4) / 1.1) + 1; const ph = (t - 2.4) % 1.1;
            send(o, ph, 0, 0.35, R.t2n0, `Mensagem #${n}`, 'acc', 0); send(o, ph, 0.35, 0.5, R.e01, '', 'acc', 0); if (send(o, ph, 0.5, 0.9, R.n1c, '', 'acc', 0.2)) o.on.side = 1;
            if (ph > 0.3) o.on.n0 = 1; if (ph > 0.45) o.on.n1 = 1;
            o.rows.prod = act('producer.go', 'publishing', [`Mensagem #${n}`, 'acc'], ['QoS 1 · every 1 s', 'dim']);
            o.rows.side = act('consumer.go', 'subscriber', [`received #${Math.max(1, ph > 0.9 ? n : n - 1)}`, 'acc'], ['linuxtips/iot', 'dim']); }
          o.cnt = [['PUBLISHED', String(n)], ['INITIAL WAIT', '3 s', 'dim'], ['INTERVAL', '1 s', 'dim']];
          o.res = n ? [`Mensagem #${n} - <RFC3339 time>`] : ['connected; waiting 3 s'];
          if (t > 3) T(o, TR(), 'README says 5 s and linuxtips/demo\nthe code uses 1 s and linuxtips/iot', 'dim'); } },
      { id: 'atrasado', dur: 7.5, title: 'Late consumer: CleanSession(true) loses messages', yk: 'IN THE LAB · consumer.go', code: ['opts.SetCleanSession(true)', 'client.Subscribe("linuxtips/iot", 1, …)', '# the consumer starts after the producer', '# with no stored session, nobody is subscribed', '# whatever went out before is lost'],
        story: 'The consumer starts after the producer. With CleanSession(true), the broker stores nothing for it: while nobody is subscribed, each message reaches the topic and vanishes. When consumer.go connects, it only receives what comes from then on.',
        look: 'consumer.go is red and offline; the messages reach the iot node and fade out there. When it comes up, they start arriving.',
        key: 'Clean session: the broker forgets the subscriber when it drops.',
        f(o, t) { const up = t > 4.6, n = Math.floor(t / 0.9) + 1, ph = t % 0.9; o.on.prod = 1; o.rows.prod = act('producer.go', 'publishing', [`Mensagem #${n}`, 'acc']);
          send(o, ph, 0, 0.3, R.t2n0, `#${n}`, 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', 'acc', 0);
          if (up) { if (send(o, ph, 0.45, 0.8, R.n1c, '', 'acc', 0.1)) o.on.side = 1; } else if (ph > 0.45 && ph < 0.8) { o.on.n1 = 'bad'; o.rows.n1 = node('iot', 'nobody subscribed'); }
          const lost = Math.min(n, Math.floor(4.6 / 0.9) + 1);
          o.rows.side = up ? act('consumer.go', 'just started', ['receives from now on', 'acc'], ['CleanSession(true)', 'dim']) : act('consumer.go', 'offline', ['not started yet', 'bad']); if (!up) o.on.side = 'bad';
          o.cnt = [['LOST', String(up ? lost : n), 'bad'], ['SESSION', 'clean', 'dim'], ['CONSUMER', up ? 'online' : 'offline', up ? 'dim' : 'bad']];
          o.res = up ? [`lost: ${lost} (sent before it came up)`] : [];
          if (t > 1.5 && !up) T(o, TR(), 'nobody subscribed:\nthe message vanishes', 'bad'); } },
      { id: 'sessao', dur: 8, title: 'Persistent session: the broker keeps 600', yk: 'PERSISTENT SESSION', code: ['opts.SetCleanSession(false)', 'fixed clientID (no time.Now().Unix())', 'Subscribe with QoS 1', '# 10 min away × 1 msg/s = 600 stored', '# max_queued_messages: 1000 per client (default)'],
        story: 'To avoid losing messages, the consumer uses CleanSession(false), a fixed clientID and QoS 1. Now the broker stores the subscriber\'s messages while it is away. Ten minutes away, at one message per second, is 600 in the session queue. When it comes back, it receives the 600.',
        look: 'The broker bar fills up to 600 of 1,000 while consumer.go is away; when it comes back, the bar empties and the messages run to it.',
        key: 'Persistent session: the broker stores for the subscriber that dropped, up to a limit.',
        f(o, t) { const q = Math.round(clamp((t - 0.4) / 4.4) * 600), up = t > 5.2, d = up ? Math.round(sg(t, 5.2, 7.2) * 600) : 0; o.on.prod = 1;
          o.rows.prod = act('producer.go', 'publishing', ['1 msg/s', 'acc']); if (!up) { o.on.side = 'bad'; o.rows.side = act('consumer.go', 'offline', [`${Math.round(q / 60)} min away`, 'bad'], ['CleanSession(false)', 'dim']); }
          else { o.on.side = 1; o.rows.side = act('consumer.go', 'back', [`received ${d} of 600`, 'acc'], ['CleanSession(false)', 'dim']); send(o, t, 5.2, 7.2, R.n1c, '600 stored', 'acc', 1); }
          if (t > 0.4 && !up) { const ph = t % 0.8; send(o, ph, 0, 0.3, R.t2n0, '', 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', 'acc', 0); o.on.n1 = 1; }
          o.rows.broker = { name: 'MQTT BROKER', meta: 'Mosquitto · port 1883', bar: { f: (q - d) / 1000, lab: `consumer session queue: ${q - d} of 1,000`, tone: '' } };
          o.cnt = [['IN THE SESSION', String(q - d)], ['LIMIT', '1,000', 'dim'], ['LOST', '0', 'dim']];
          o.res = up ? [`reconnected: received ${d} of 600`] : [];
          if (t > 1) T(o, TR(), `${up ? 'delivering' : 'storing'}: 10 min × 1/s = 600`); } },
      { id: 'limite', dur: 8, title: 'What if it goes wrong: 20 min away, 200 dropped', yk: 'PERSISTENT SESSION · LIMIT', code: ['20 min away × 1 msg/s = 1,200', 'max_queued_messages = 1000', '→ 1,200 − 1,000 = 200 dropped', '# check the limit on your Mosquitto version', '# and measure how long the consumer stays away'],
        story: 'The persistent session has a ceiling. In Mosquitto, the per-client queue holds 1,000 messages by default (max_queued_messages). With the consumer 20 minutes away, 1,200 arrive: the 200 beyond the limit are dropped, and nobody tells the consumer.',
        look: 'The broker bar reaches the end at 1,000 and turns red; the DROPPED counter climbs to 200.',
        key: 'The broker stores up to a limit; whatever goes past it is lost.',
        f(o, t) { const q = Math.round(clamp((t - 0.4) / 5) * 1200), kept = Math.min(1000, q), drop = q - kept; o.on.prod = 1; o.on.side = 'bad';
          o.rows.prod = act('producer.go', 'publishing', ['1 msg/s', 'acc']); o.rows.side = act('consumer.go', 'offline', [`${Math.round(q / 60)} min away`, 'bad']);
          if (t > 0.4) { const ph = t % 0.8; send(o, ph, 0, 0.3, R.t2n0, '', drop ? 'bad' : 'acc', 0); send(o, ph, 0.3, 0.45, R.e01, '', drop ? 'bad' : 'acc', 0); o.on.n1 = drop ? 'bad' : 1; }
          o.rows.broker = { name: 'MQTT BROKER', meta: 'Mosquitto · port 1883', bar: { f: kept / 1000, lab: drop ? `full: 1,000 · ${drop} dropped` : `session queue: ${kept} of 1,000`, tone: drop ? 'bad' : '' } };
          if (drop) o.on.broker = 'bad';
          o.cnt = [['DROPPED', String(drop), drop ? 'bad' : ''], ['ARRIVED', thou(q), 'dim'], ['STORED', thou(kept), 'dim']];
          o.res = drop ? [`${drop} messages dropped without warning`] : [];
          if (drop) T(o, TR(), 'went past 1,000:\nthe broker drops', 'bad'); } },
    ],
    exchange: [
      { id: 'rota', dur: 7, title: 'The exchange routes by the routing key', yk: 'basic.publish · AMQP 0-9-1', code: ['exchange: emails (topic)', 'routing key: email.pedido.confirmacao', 'body: { "pedido_id": 1051, "para": "Lena" }', 'email.pedido.*  ✓ → emails.transacionais', 'email.promo.#   ✗', 'email.#         ✓ → emails.auditoria'],
        story: 'notificacoes does not pick a queue: it publishes to the emails exchange with the routing key email.pedido.confirmacao. The exchange compares the key with each queue\'s binding. email.pedido.* matches (the * stands for one word), email.promo.# does not, email.# matches (the # stands for any rest). The confirmation for 1051 becomes two copies.',
        look: 'The card enters the EXCHANGE and comes out as two: one to emails.transacionais, another to emails.auditoria. The promotional lane stays dark.',
        key: 'Exchange: the broker picks the queues by comparing the routing key with the bindings.',
        f(o, t) { const m = 'confirmation', s = '1051';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); } if (t > 1.2 && t < 2.8) o.on.exch = 1;
          if (t > 1.6) { o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✓', 'acc'], ['promo.#  ✗', 'dim'], ['#        ✓', 'acc']);
            ['qa', 'qc'].forEach(q => { const f = sg(t, 1.8, 2.7); C(o, hop(XP.exch, [QX(0), QY[q], ZL], f, 30), m, s, 'acc', 0.75); if (f > 0.9) o.on[q] = 1; lit(o, q === 'qa' ? R.x2a : R.x2c); }); }
          if (t > 3.6) { const f = sg(t, 3.6, 4.4); if (f < 1) C(o, hop([QX(0), QY.qa, ZL], XP.prov, f, 30), m, s, 'acc', 0.75); else { o.on.side = 1; o.rows.side = act('PROVIDER', 'email', ['confirmation 1051', 'acc'], ['to Lena', 'dim']); }
            lit(o, R.a2v); }
          o.cnt = [['MATCHING QUEUES', t > 1.6 ? '2 of 3' : '…'], ['ROUTING KEY', 'email.pedido.confirmacao', 'dim'], ['COPIES', t > 1.8 ? '2' : '0', 'dim']];
          o.res = t > 2.7 ? ['→ emails.transacionais + emails.auditoria'] : [];
          if (t > 2.8) T(o, TR(), 'pedido.* ✓   promo.# ✗   # ✓\n2 copies'); } },
      { id: 'promo', dur: 6, title: 'email.promo.bf: promotional and audit', yk: 'basic.publish · AMQP 0-9-1', code: ['exchange: emails (topic)', 'routing key: email.promo.bf', 'body: Black Friday newsletter', 'email.pedido.*  ✗', 'email.promo.#   ✓ → emails.promocionais', 'email.#         ✓ → emails.auditoria'],
        story: 'The Black Friday newsletter goes out with the key email.promo.bf. The binding email.pedido.* does not match; email.promo.# matches; email.# matches again. The newsletter goes to promocionais and auditoria and never enters the transacionais queue.',
        look: 'The promo card enters the EXCHANGE and goes out to emails.promocionais and emails.auditoria; the transactional lane stays dark.',
        key: 'Each key lands in the queues whose binding matches it.',
        f(o, t) { const m = 'promo', s = 'bf';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); } if (t > 1.2 && t < 2.8) o.on.exch = 1;
          if (t > 1.6) { o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✗', 'dim'], ['promo.#  ✓', 'acc'], ['#        ✓', 'acc']);
            ['qb', 'qc'].forEach(q => { const f = sg(t, 1.8, 2.7); C(o, hop(XP.exch, [QX(0), QY[q], ZL], f, 30), m, s, 'acc', 0.75); if (f > 0.9) o.on[q] = 1; lit(o, q === 'qb' ? R.x2b : R.x2c); }); }
          o.cnt = [['MATCHING QUEUES', t > 1.6 ? '2 of 3' : '…'], ['ROUTING KEY', 'email.promo.bf', 'dim'], ['IN TRANSACTIONAL', '0', 'dim']];
          o.res = t > 2.7 ? ['→ emails.promocionais + emails.auditoria'] : [];
          if (t > 2.8) T(o, TR(), 'pedido.* ✗   promo.# ✓   # ✓'); } },
      { id: 'unica', dur: 8, title: 'Single queue: Lena\'s email behind 50,000', yk: 'THE SINGLE-QUEUE MATH', code: ['50,000 promotional emails ahead', '÷ 100 emails/s (provider limit)', '= 500 s = 8 min 20 s', '# Lena\'s email only goes out after them'],
        story: 'To see why we split queues, imagine a single queue. The newsletter of 50,000 emails goes in first and the confirmation for 1051 goes in behind it. The provider accepts 100 emails per second. Lena waits 50,000 ÷ 100 = 500 s, 8 min 20 s, for a confirmation email.',
        look: 'One lane only, emails, with the promotional emails in front and the 1051 confirmation at the back. The promotional ones leave one by one; Lena\'s clock climbs to 500 s.',
        key: 'In a single queue, the urgent one waits behind the volume.',
        f(o, t) { o.show.qa = 0; o.show.qc = 0; o.show.cons = 0; o.rows.qb = lane('emails (single queue)', 'everything together, in arrival order'); o.rows.exch = act('EXCHANGE', 'direct', ['emails', 'acc'], ['1 queue only', 'dim']);
          const w = Math.round(clamp((t - 0.6) / 5.4) * 500), done = t > 6.2;
          ['promo', 'promo', 'promo'].forEach((m, i) => C(o, [QX(i), QY.qb, ZL], m, 'bf', '', 0.75));
          if (!done) { C(o, [QX(3), QY.qb, ZL], `+${thou(Math.max(0, 49997 - w * 100))}`, 'promo', '', 0.75); C(o, [QX(4), QY.qb, ZL], 'confirmation', '1051', 'bad', 0.75); }
          const ph = (t % 0.7) / 0.7; if (t > 0.6 && !done) { C(o, hop([QX(0), QY.qb, ZL], XP.prov, ph, 24), 'promo', 'bf', 'acc', 0.75); o.on.side = 1; lit(o, R.b2v); }
          if (done) { C(o, hop([QX(4), QY.qb, ZL], XP.prov, sg(t, 6.2, 7.0), 30), 'confirmation', '1051', 'acc', 0.75); o.rows.side = act('PROVIDER', 'email', ['confirmation 1051', 'bad'], ['after 500 s', 'dim']); }
          else o.rows.side = act('PROVIDER', 'email', ['100 emails/s', 'acc'], ['promotional only', 'dim']);
          o.on.qb = 2;
          o.cnt = [['LENA\'S WAIT', w >= 500 ? '8 min 20 s' : `${w} s`, 'bad'], ['AHEAD OF HER', thou(Math.max(0, 50000 - w * 100)), 'dim'], ['PROVIDER', '100/s', 'dim']];
          o.res = done ? ['Lena: 500 s waiting (8 min 20 s)'] : [];
          if (t > 1.5) T(o, TR(), '50,000 ÷ 100/s = 500 s', 'bad'); } },
      { id: 'separadas', dur: 7, title: 'Separate queues: out in under 1 s', yk: 'WITH THE emails EXCHANGE', code: ['emails.transacionais: 1 message (the one for 1051)', 'emails.promocionais: 50,000', 'the provider serves both queues', '→ the confirmation goes out in under 1 s'],
        story: 'With the emails exchange, the confirmation for 1051 lands in emails.transacionais, which is almost empty, and the newsletter stays in its own queue. The provider serves both. The confirmation goes out in under 1 s, while the promotional emails carry on at their own pace.',
        look: 'The 1051 confirmation is alone in the top lane and hops to the PROVIDER right away; the promotional ones keep leaving the middle lane.',
        key: 'Separate queues take the transactional email from behind the volume.',
        f(o, t) { o.show.qc = 0; o.show.cons = 0;
          ['promo', 'promo', 'promo'].forEach((m, i) => C(o, [QX(i), QY.qb, ZL], m, 'bf', '', 0.75)); C(o, [QX(3), QY.qb, ZL], '+49,997', 'promo', '', 0.75);
          const ph = (t % 0.9) / 0.9; C(o, hop([QX(0), QY.qb, ZL], XP.prov, ph, 24), 'promo', 'bf', 'acc', 0.75); lit(o, R.b2v); o.on.qb = 2; o.on.side = 1;
          const f = sg(t, 0.8, 1.5); if (f < 1) C(o, f > 0 ? hop([QX(0), QY.qa, ZL], XP.prov, f, 30) : [QX(0), QY.qa, ZL], 'confirmation', '1051', 'acc', 0.75); else o.rows.side = act('PROVIDER', 'email', ['confirmation 1051', 'acc'], ['in under 1 s', 'dim']);
          if (t > 0.8) { o.on.qa = 1; lit(o, R.a2v); }
          o.cnt = [['LENA\'S WAIT', t > 1.5 ? '< 1 s' : '…'], ['PROMOTIONAL', '500 s, no hurry', 'dim'], ['QUEUES', '2', 'dim']];
          o.res = t > 1.5 ? ['Lena: under 1 s'] : [];
          if (t > 1.8) T(o, TR(), 'confirmation: < 1 s\n(before: 8 min 20 s)'); } },
      { id: 'typo', dur: 8, title: 'What if it goes wrong: a typo in the key, silent drop', yk: 'NO ROUTE · AMQP 0-9-1', code: ['routing key: emails.pedido.confirmacao   (plural)', 'email.pedido.*  ✗   (1st word: emails)', 'email.promo.#   ✗', 'email.#         ✗', '# no queue: dropped; the producer never knows', 'mandatory = true → basic.return 312 NO_ROUTE'],
        story: 'A typo: the producer publishes with emails.pedido.confirmacao, in the plural. No binding matches, not even the audit queue\'s email.#, because the first word is emails. With no queue, the exchange drops the message silently and the producer thinks it was sent. With mandatory = true, the broker returns the message (basic.return, 312 NO_ROUTE).',
        look: 'The card enters the EXCHANGE, the three bindings turn ✗ and it falls, red. Then, with mandatory, it goes back to NOTIFICACOES.',
        key: 'A message with no route vanishes without an error; mandatory, alternate exchange and an alert bring the error back.',
        f(o, t) { const m = 'confirmation', s = 'emails.…';
          if (t > 0.4 && t < 1.6) C(o, hop(XP.prod, XP.exch, sg(t, 0.4, 1.2), 34), m, s, 'acc', 0.75);
          if (t > 0.4) { o.on.prod = 1; lit(o, R.p2x); }
          if (t > 1.4) { o.on.exch = 'bad'; o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc'], ['pedido.* ✗', 'bad'], ['promo.#  ✗', 'bad'], ['#        ✗', 'bad']); }
          if (t > 1.6 && t < 3.4) { const f = sg(t, 1.6, 3.2); C(o, [XP.exch[0], XP.exch[1] + 60 * f, ZX + 10 - 40 * f], m, 'no route', 'bad', 0.75); }
          if (t > 1.6 && t < 4.6) o.rows.prod = act('NOTIFICACOES', 'producer', ['published: ok', 'acc'], ['thinks it was sent', 'dim']);
          if (t > 4.6) { const f = sg(t, 4.6, 5.6); C(o, hop(XP.exch, XP.prod, f, 34), m, '312 NO_ROUTE', 'bad', 0.75); lit(o, rev(R.p2x), 'bad');
            if (f >= 1) { o.on.prod = 'bad'; o.rows.prod = act('NOTIFICACOES', 'mandatory = true', ['basic.return', 'bad'], ['312 NO_ROUTE', 'bad']); } }
          o.cnt = [['MATCHING QUEUES', t > 1.4 ? '0' : '…', t > 1.4 ? 'bad' : ''], ['DELIVERED', '0', 'dim'], ['ERROR IN PRODUCER', t > 5.6 ? 'with mandatory' : 'none', t > 5.6 ? 'dim' : 'bad']];
          o.res = t > 5.6 ? ['mandatory: the broker returned it (312 NO_ROUTE)'] : t > 3.2 ? ['dropped silently: Lena gets nothing'] : [];
          if (t > 2.4 && t < 4.6) T(o, TR(), 'no route: dropped\nsilently', 'bad'); } },
    ],
    'lab-amqp': [
      { id: 'direct', dur: 7, title: 'default/: direct exchange and the cobrar queue', yk: 'IN THE LAB · rabbit-mq/default/', code: ['ExchangeDeclare("ecommerce.nova.venda", "direct", durable)', 'QueueDeclare("cobrar", durable)', 'QueueBind("cobrar", "cobrar", "ecommerce.nova.venda")', 'Publish(…, "cobrar", text/plain "id:<uuid>")', 'consumer: auto-ack false · d.Ack(true)'],
        story: 'The lab starts with a direct exchange, ecommerce.nova.venda, and a queue cobrar bound by the key cobrar. Direct wants a key equal to the binding. producer.go publishes id:<uuid> with the key cobrar; consumer.go reads with auto-ack off and confirms with d.Ack(true).',
        look: 'The messages pass through the direct EXCHANGE and enter only the cobrar lane; consumer.go lights up on every ack.',
        key: 'Direct: the routing key has to equal the binding.',
        f(o, t) { o.rows.exch = act('EXCHANGE', 'direct', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['key = cobrar', 'dim']); o.rows.qa = lane('cobrar', 'binding: cobrar');
          const ph = (t % 1.4) / 1.4, k = Math.floor(t / 1.4) + 1; o.on.prod = 1;
          if (ph < 0.3) C(o, hop(XP.prod, XP.exch, ph / 0.3, 30), 'id:<uuid>', 'cobrar', 'acc', 0.75);
          else if (ph < 0.6) { o.on.exch = 1; C(o, hop(XP.exch, [QX(0), QY.qa, ZL], (ph - 0.3) / 0.3, 28), 'id:<uuid>', 'cobrar', 'acc', 0.75); }
          else { o.on.qa = 1; C(o, hop([QX(0), QY.qa, ZL], XP.prov, (ph - 0.6) / 0.4, 28), 'id:<uuid>', 'Ack', 'acc', 0.75); if (ph > 0.85) o.on.side = 1; }
          [R.p2x, R.x2a, R.a2v].forEach(p => lit(o, p));
          o.cnt = [['PUBLISHED', String(k)], ['TYPE', 'direct', 'dim'], ['THE LOOP RUNS TO', '3 billion', 'dim']];
          o.res = ['key = binding: lands in cobrar'];
          if (t > 2) T(o, TR(), '3-billion loop, no confirms\nfills the queue and memory', 'dim'); } },
      { id: 'topic', dur: 8.5, title: 'topic/: 20 messages, the datalake gets all of them', yk: 'IN THE LAB · rabbit-mq/topic/', code: ['exchange: ecommerce.nova.venda.faturamento (topic)', 'queue.faturamento ← faturamento.prioridade.default', 'queue.faturamento.prioritario ← faturamento.prioridade.alta', 'queue.faturamento.datalake ← faturamento.prioridade.*', 'for i := 0; i < 20; i++ { if rand.Float64() < 0.1 → alta }'],
        story: 'In topic/, the producer sends 20 messages. Each has a 10% chance of going out with faturamento.prioridade.alta; the rest go out with faturamento.prioridade.default. The datalake subscribed to faturamento.prioridade.* and receives all 20. In this run, 2 went out as alta.',
        look: 'The messages pass through the topic EXCHANGE: the default ones go to the middle lane, the alta ones to the top, and all of them also go to the datalake below.',
        key: 'A binding with * gets a copy of every key at that level.',
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
          o.res = cnt.qc === 20 ? ['this run: 2 alta, 18 default; datalake 20'] : [];
          if (cnt.qc === 20) T(o, TR(), 'datalake: all 20\n(* = one word)'); } },
      { id: 'fanout', dur: 7.5, title: 'fanout/: each of the 3 queues gets all 1,000', yk: 'IN THE LAB · rabbit-mq/fanout/', code: ['ExchangeDeclare("ecommerce.nova.venda", "fanout")', 'cobrar_pedido · reservar_estoque · informar_logistica', '# fanout ignores the routing key', 'for i := 0; i < 1000; i++ { Publish(…) }', '→ each queue gets all 1,000'],
        story: 'In fanout/, the exchange copies every message to all the bound queues, without looking at the key. The producer publishes 1,000 messages and cobrar_pedido, reservar_estoque and informar_logistica get all 1,000 each. It is the same idea as the 3 Kafka groups reading PedidoPago, now with queues.',
        look: 'Each message enters the fanout EXCHANGE and comes out as three copies, one for each lane; the counters of the 3 queues climb together to 1,000.',
        key: 'Fanout: 1 message published, N copies, one per queue.',
        f(o, t) { o.show.qb = 1; o.show.qc = 1; o.show.side = 0; o.rows.exch = act('EXCHANGE', 'fanout', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['copies to all', 'dim']);
          const n = Math.round(clamp((t - 0.4) / 5.6) * 1000); o.on.prod = 1;
          o.rows.qa = lane('cobrar_pedido', `${thou(n)} messages`); o.rows.qb = lane('reservar_estoque', `${thou(n)} messages`); o.rows.qc = lane('informar_logistica', `${thou(n)} messages`);
          if (t > 0.4 && t < 6.2) { const ph = (t % 0.8) / 0.8; if (ph < 0.4) C(o, hop(XP.prod, XP.exch, ph / 0.4, 24), 'id:<uuid>', 'sale', 'acc', 0.6);
            else { o.on.exch = 1; ['qa', 'qb', 'qc'].forEach(q => { C(o, hop(XP.exch, [QX(0), QY[q], ZL], (ph - 0.4) / 0.6, 22), 'copy', 'sale', 'acc', 0.6); o.on[q] = 1; }); } }
          [R.p2x, R.x2a, R.x2b, R.x2c].forEach(p => lit(o, p));
          o.cnt = [['PER QUEUE', thou(n)], ['PUBLISHED', thou(n), 'dim'], ['IN THE 3 QUEUES', thou(n * 3), 'dim']];
          o.res = n >= 1000 ? ['3 × 1,000 = 3,000 messages in the queues'] : [];
          if (n >= 1000) T(o, TR(), '1,000 published\n1,000 in each queue'); } },
      { id: 'conflito', dur: 7, title: 'What if it goes wrong: same name, two types', yk: 'RABBITMQ · ERROR 406', code: ['# 1st ran default/: creates ecommerce.nova.venda as direct', '# 2nd runs fanout/: declares the same name as fanout', 'Exception (406) PRECONDITION_FAILED -', "inequivalent arg 'type' for exchange 'ecommerce.nova.venda'", "in vhost '/': received 'fanout' but current is 'direct'", '# fix: delete the exchange or use another name'],
        story: 'default/ and fanout/ declare the same exchange, ecommerce.nova.venda, with different types. Whoever runs default/ first creates a direct. When fanout/ declares the same name as fanout, RabbitMQ refuses with 406 PRECONDITION_FAILED and closes the channel: no message is published.',
        look: 'The EXCHANGE stays direct; the request to declare it as fanout comes back red to producer.go, and the fanout queues stay empty.',
        key: 'An existing exchange does not change type: declaring it differently takes the channel down.',
        f(o, t) { o.show.qb = 1; o.show.qc = 1; o.show.side = 0; o.rows.exch = act('EXCHANGE', 'direct', ['ecommerce.', 'acc'], ['nova.venda', 'acc'], ['created by default/', 'dim']);
          o.rows.prod = act('producer.go', 'fanout/', ['declares: fanout', 'acc']); o.rows.qa = lane('cobrar_pedido', '0 messages'); o.rows.qb = lane('reservar_estoque', '0 messages'); o.rows.qc = lane('informar_logistica', '0 messages');
          send(o, t, 0.5, 1.3, R.p2x, 'ExchangeDeclare fanout', 'hi', 0.2); if (t > 1.2) o.on.exch = 'bad';
          if (send(o, t, 1.8, 2.6, rev(R.p2x), '406 PRECONDITION_FAILED', 'bad', 4)) { o.on.prod = 'bad'; o.rows.prod = act('producer.go', 'fanout/', ['channel closed', 'bad'], ['error 406', 'bad']); }
          o.cnt = [['ERROR', t > 2.6 ? '406' : '…', 'bad'], ['CURRENT TYPE', 'direct', 'dim'], ['PUBLISHED', '0', 'dim']];
          o.res = t > 2.6 ? ['channel closed: nothing was published'] : [];
          if (t > 2.8) T(o, TR(), "received 'fanout'\nbut current is 'direct'", 'bad'); } },
      { id: 'duplicado', dur: 9, title: 'What if it goes wrong: crash before the ack, double email', yk: 'MANUAL ACK · email consumer', code: ['d := <-msgs', 'enviarEmail(d.Body)   // the email went out', '# the process crashes here', 'd.Ack(false)          // never runs', '→ RabbitMQ redelivers with redelivered = true', '# fix: message_id per email and idempotency'],
        story: 'Back to the emails. The consumer takes the 1051 confirmation from emails.transacionais, hands it to the provider and crashes before the ack. As far as RabbitMQ knows, the message was not confirmed: it goes back to the queue with redelivered = true. The consumer starts up, reads it again and sends it again. Lena gets the email twice.',
        look: 'The card goes to the CONSUMER, the email goes out to the PROVIDER, the CONSUMER turns red and the card goes back to the queue marked redelivered; the email goes out a second time.',
        key: 'Manual ack gives at least once: without idempotency, it duplicates.',
        f(o, t) { o.rows.qa = lane('emails.transacionais', 'manual ack'); o.rows.exch = act('EXCHANGE', 'topic', ['emails', 'acc']); o.show.cons = 1;
          o.rows.side = act('CONSUMER', 'email', ['manual ack', 'dim']); o.rows.cons = act('PROVIDER', 'email', ['100 emails/s', 'dim']);
          const m = 'confirmation', head = [QX(0), QY.qa, ZL], CP = XP.prov; let sent = 0;
          if (t < 0.4) C(o, head, m, '1051', ''); else if (t < 2.6) { C(o, t < 1.2 ? hop(head, CP, sg(t, 0.4, 1.2), 28) : CP, m, '1051', 'acc', 0.75); o.on.side = 1; lit(o, R.a2v); }
          if (send(o, t, 1.4, 2.0, R.s2c, 'email 1', 'acc', 0.4)) sent = 1;
          if (t > 2.6 && t < 4.6) { o.on.side = 'bad'; o.rows.side = act('CONSUMER', 'crashed', ['before the ack', 'bad']); C(o, hop(CP, head, sg(t, 3.0, 3.8), 28), m, 'redelivered', 'bad', 0.75); }
          if (t >= 4.6) { o.on.side = 1; o.rows.side = act('CONSUMER', 'back', ['reads again', 'acc']); if (t < 6.4) C(o, t < 5.3 ? hop(head, CP, sg(t, 4.6, 5.3), 28) : CP, m, 'redelivered', 'bad', 0.75); lit(o, R.a2v); }
          if (send(o, t, 5.5, 6.1, R.s2c, 'email 2', 'bad', 3)) sent = 2;
          if (sent) { o.on.cons = sent > 1 ? 'bad' : 1; o.rows.cons = act('PROVIDER', 'email', [`${sent}× confirmation 1051`, sent > 1 ? 'bad' : 'acc'], ['to Lena', 'dim']); }
          o.cnt = [['EMAILS TO LENA', String(sent), sent > 1 ? 'bad' : ''], ['ACK', t > 6.1 ? 'only now' : 'none', 'dim'], ['REDELIVERED', t > 3 ? 'true' : 'false', t > 3 ? 'bad' : 'dim']];
          o.res = sent > 1 ? ['Lena gets the confirmation twice'] : [];
          if (sent > 1) T(o, TR(), 'double email\nfix: message_id', 'bad'); } },
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
    lbl(s.yk || 'REAL MESSAGE', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /lost|dropped|stuck|twice|closed|406|waiting|stalled|for nothing|500 s/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    fifo: () => `<li><b>emails</b> queue: <b>1049, 1050, 1051</b> go in; <b>1049, 1050, 1051</b> come out</li><li>Stack for 1051: Push <b>pay → reserve stock → create shipment</b>; Pop <b>cancel shipment → return stock → refund payment</b></li><li>Lab: queue/main.go and stack/main.go with <b>Pizza, Hamburger, Churrasco</b> (the stack returns Churrasco, Hamburger, Pizza)</li><li>Message brokers almost never offer a LIFO queue: a stack is a data structure</li><li>2 consumers on the same queue: output <b>1050, 1051, 1049</b>; ordering per key is what a Kafka partition gives (lesson 5)</li>`,
    lote: () => `<li>23:00 batch (module 11): <b>400k</b> rows; 1 core <b>42 s</b>, 4 cores <b>12 s</b> → ready at <b>23:00:12</b></li><table class="h3-sum"><tr><th>linger.ms</th><th>per send</th><th>sends/s on p0</th><th>on all 3</th></tr><tr><td>0</td><td>1 event</td><td>40</td><td>120</td></tr><tr class="on"><td>200</td><td>8 events</td><td>5</td><td>15</td></tr></table><li><b>batch.size</b> is in bytes (default 16384); <b>linger.ms</b> defaults to 0 up to Kafka 3.x and <b>5 ms</b> from 4.0</li><li>Low traffic with linger.ms = 200: up to <b>+200 ms</b> per event, with no batch</li>`,
    dlq: () => `<li>Provider: <b>550 invalid address</b> for the email of 1051</li><li>Attempts: wait <b>1 s, 5 s and 30 s</b> → <b>36 s</b> after the 1st failure it goes to <b>emails.dlq</b>, with the reason</li><li>The DLQ has an alert if it goes above <b>0</b></li><li>Without a DLQ (poison message), on p0 at 40 events/s: <b>2,400</b> events per minute stuck behind it</li><li>RabbitMQ: DLQ via <b>dead letter exchange</b> (lesson 9); Kafka has no native DLQ for consumers: the team creates <b>pedidos.dlq</b></li>`,
    mqtt: () => `<table class="h3-sum"><tr><th>packet</th><th>bytes</th></tr><tr class="on"><td>PUBLISH QoS 1</td><td>1 + 1 + 2 + 33 + 2 + 38 = 77</td></tr><tr><td>PUBACK</td><td>4</td></tr><tr><td>CONNECT (keep-alive 60 s)</td><td>25</td></tr><tr><td>the same data in an HTTP POST + JWT</td><td>~234</td></tr></table><li>QoS 0 at most once · <b>QoS 1</b> at least once (PUBACK; may duplicate) · QoS 2 exactly once (PUBREC, PUBREL, PUBCOMP)</li><li>Filter <b>loja/entregas/+/posicao</b> (+ = one level; # = several)</li><li>Last Will after <b>1.5 × 60 = 90 s</b> without a packet</li><li>3 min without signal ÷ 5 s = <b>36 positions</b></li>`,
    'lab-mqtt': () => `<li>Mosquitto <b>eclipse-mosquitto:2.0</b>, ports <b>1883</b> and 9001; <b>allow_anonymous true</b>, <b>persistence true</b></li><li>producer.go: waits <b>3 s</b>, publishes <b>Mensagem #N - &lt;time&gt;</b> with QoS 1 to <b>linuxtips/iot</b> every <b>1 s</b> (the README says linuxtips/demo and 5 s)</li><li>consumer.go: <b>CleanSession(true)</b>; the clientID changes on every run (time.Now().Unix())</li><li>Persistent session: 10 min × 1/s = <b>600</b> stored; 20 min = <b>1,200</b> &gt; <b>1,000</b> (max_queued_messages) → <b>200</b> dropped</li><li>paho.mqtt.golang v1.4.3 speaks MQTT 3.1.1: shared subscriptions ($share) are an MQTT 5.0 feature</li>`,
    exchange: () => `<table class="h3-sum"><tr><th>routing key</th><th>transac.</th><th>promo</th><th>audit.</th></tr><tr class="on"><td>email.pedido.confirmacao</td><td>✓</td><td>✗</td><td>✓</td></tr><tr><td>email.pedido.enviado</td><td>✓</td><td>✗</td><td>✓</td></tr><tr><td>email.promo.bf</td><td>✗</td><td>✓</td><td>✓</td></tr><tr><td>emails.pedido.confirmacao</td><td>✗</td><td>✗</td><td>✗</td></tr></table><li>Bindings: <b>email.pedido.*</b>, <b>email.promo.#</b>, <b>email.#</b> (* = one word; # = zero or more)</li><li>Single queue: 50,000 ÷ 100/s = <b>500 s (8 min 20 s)</b>; separate queues: <b>&lt; 1 s</b></li><li>No route: silent drop; <b>mandatory = true</b> returns it (basic.return 312 NO_ROUTE); <b>alternate exchange</b> receives whatever nobody routed</li>`,
    'lab-amqp': () => `<table class="h3-sum"><tr><th>folder</th><th>exchange</th><th>queues</th><th>messages</th></tr><tr><td>default/</td><td>ecommerce.nova.venda (direct)</td><td>cobrar</td><td>3-billion loop</td></tr><tr><td>topic/</td><td>…faturamento (topic)</td><td>default, prioritario, datalake</td><td>20 (10% alta)</td></tr><tr><td>fanout/</td><td>ecommerce.nova.venda (fanout)</td><td>cobrar_pedido, reservar_estoque, informar_logistica</td><td>1,000</td></tr></table><li>default/ and fanout/ use the <b>same name</b> with different types: whichever runs second gets <b>406 PRECONDITION_FAILED</b></li><li>text/plain messages <b>without persistent DeliveryMode</b>; no consumer calls <b>ch.Qos</b> (no prefetch); <b>d.Ack(true)</b> uses multiple = true</li><li>streadway/amqp is archived; the replacement is <b>rabbitmq/amqp091-go</b></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Real message')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'fila') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
