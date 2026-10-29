// Figura 3D (iso-glow): o log do tópico pedidos. O serviço pedidos (produtor) à esquerda, as partições como trilhos
// com os eventos numerados pelo offset, os grupos de consumo (ou os consumidores de um grupo) à direita e,
// na frente, os 3 brokers com líderes e seguidores. Atrás, o mostrador (contadores, o código do passo e o resultado).
// O evento acende ao andar; o que dá errado fica vermelho.
// Cenários (toggle e ?mode=topico|chave|grupos|replicas|particoes|lab; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/comunicacao-assincrona-brief.md).
FIGS3D.push({ id: 'kafka', name: 'Kafka', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp = (a, b, f) => a + (b - a) * f;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['topico', 'chave', 'grupos', 'replicas', 'particoes', 'lab'];
  const SCNAME = { topico: 'Topic', chave: 'Key', grupos: 'Groups', replicas: 'Replicas', particoes: 'Partitions', lab: 'Lab' };
  const SCFULL = { topico: 'The log of the pedidos topic', chave: 'The key picks the partition', grupos: 'Consumer groups and lag',
    replicas: 'Leader, followers and acks', particoes: 'From 3 to 6 partitions', lab: 'The lab: 1 broker, sarama' };
  const A5 = 'aula-5-kafka-e-event-driven-produtores-consumidores-topicos-particoes-e-replicacao';
  const AULA = { topico: 'aula-4-streaming-de-dados', chave: A5, grupos: A5, replicas: A5, particoes: A5, lab: 'aula-6-kafka-exemplo' };
  let clk = 0, sc = 'topico', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-kafka3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // atrás: o mostrador suspenso; no meio: o produtor (esquerda), os trilhos das partições e os grupos (direita);
  // na frente: os 3 brokers e, à direita, o grupo novo (ou o kafka-ui do lab)
  const PL = 7, RX = 150, RW = 400, RD = 52, R6D = 28, GX = 576, GW = 204, BY = 352, BD = 80, BH = 16, BWB = 124, GAPX = 563, PCX = 74, PX = 128;
  const RY = i => 140 + i * 62, R6Y = i => 136 + i * 33, KY = i => 136 + i * 33;
  const BXB = i => 150 + i * 138;
  plateWith(g0, 800, 452, [[14, 14], [786, 14], [14, 438], [786, 438]]);
  hazeAndShadow(g0, 400, 226, 9.4, 5.6);
  const SZ = PL + 46;
  rbox(24, 10, SZ, 424, 12, 150, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(418, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + 147, 416, 143, 4, g0);
  function block(x, y, w, d, h, kind, extra = {}) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'rail' || kind === 'rail6' ? 4 : 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, extra.P || 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, w, d, h, kind, z0: PL, key: '', f: 1, ...extra };
  }
  const B = {};
  B.prod = block(20, 140, 108, 176, 22, 'svc');
  for (let i = 0; i < 3; i++) B['r' + i] = block(RX, RY(i), RW, RD, 10, 'rail', { i, P: 4 });
  for (let i = 0; i < 6; i++) B['s' + i] = block(RX, R6Y(i), RW, R6D, 8, 'rail6', { i, P: 4 });
  for (let i = 0; i < 3; i++) B['g' + i] = block(GX, RY(i), GW, RD, 16, 'grp', { i });
  for (let i = 0; i < 6; i++) B['k' + i] = block(GX, KY(i), GW, 28, 12, 'cons', { i });
  for (let i = 0; i < 3; i++) B['b' + i] = block(BXB(i), BY, BWB, BD, BH, 'broker', { i });
  B.side = block(GX, BY, GW, BD, BH, 'grp');
  const NAMES = Object.keys(B);
  creases(first);
  const TOP = nm => PL + B[nm].h;

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 140 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 12 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-4, -4, -4, 8, 8, 8, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? (b.on ? 2.6 : 1.8) : b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.8); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }
  // fichas: cada evento em viagem é uma ficha; acesa = andando, apagada = parada, vermelha = problema
  const badEm = new THREE.Color(0xe0180c);
  const TOK = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-8, -8, 0, 16, 16, 10, 3, mat, g, { lines: false }); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  function setTokens(list) {
    TOK.forEach((T_, i) => { const k = list[i]; if (!k) { T_.g.visible = false; T_.glow.material.uniforms.intensity.value = 0; return; }
      T_.g.visible = true; const s = k.s || 1, z = k.p[2] != null ? k.p[2] : PL + 12; T_.g.scale.set(s, s, s); T_.g.position.copy(W(k.p[0], k.p[1], z));
      if (k.tone === 'bad') { T_.mat.emissive.copy(badEm); T_.mat.emissiveIntensity = 1.1; } else { T_.mat.emissive.copy(accent); T_.mat.emissiveIntensity = k.tone === 'dim' ? 0.12 : 1.1; }
      moveGlow(T_.glow, [k.p[0], k.p[1], z + 12], k.tone === 'dim' ? 0 : k.tone === 'bad' ? 0.5 : 0.75); });
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
  const TAGS = [tag(12), tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // lugares livres para balões: acima de cada trilho (na faixa de trás), acima dos grupos e na frente dos brokers
  const SPOT = { r: i => [RX + 230, RY(i) + 4, 50], g: i => [GX + GW / 2, RY(i) + 6, 52], b: i => [BXB(i) + 62, 440, 8], prod: [PCX, 150, 66], side: [GX + GW / 2, 440, 8] };

  // ── trilhos: as células (eventos) de cada partição ──
  // célula: { o: offset ou chave, l: rótulo, tn }; vão: { gap: 'texto' } (offsets de outros pedidos)
  const HX = { rail: 42, rail6: 32 };
  function layout(kind, cells) {
    const W_ = RW - 5, x0 = HX[kind], x1 = W_ - 4, wt = cells.map(c => c.gap ? 0.42 : 1), sum = wt.reduce((a, b) => a + b, 0) || 1;
    const unit = (x1 - x0) / Math.max(sum, kind === 'rail6' ? 6 : 5.4); let x = x0;
    return cells.map((c, i) => { const w = wt[i] * unit, r = [x, w]; x += w; return r; });
  }
  // centro da célula idx do trilho nm, em coordenadas da base
  const cellX = (nm, cells, idx) => { const L_ = layout(B[nm].kind, cells)[idx]; return RX + 2.5 + L_[0] + L_[1] / 2; };
  const cy = nm => B[nm].y + B[nm].d / 2 + (B[nm].kind === 'rail' ? 4 : 0);
  const ev = (o, l, tn = 'acc') => ({ o: String(o), l, tn });
  const gap = text => ({ gap: text });
  // a p0 do pedido 1051: 48210, 48213, 48217 e 48301, com os offsets de outros pedidos entre eles
  function p0of1051(n, tone = []) {
    const c = [];
    if (n > 0) c.push(ev(48210, 'PedidoCriado', tone[0] || 'acc'));
    if (n > 1) c.push(gap('+2'), ev(48213, 'PedidoPago', tone[1] || 'acc'));
    if (n > 2) c.push(gap('+3'), ev(48217, 'EstoqueReservado', tone[2] || 'acc'));
    if (n > 3) c.push(gap('+83'), ev(48301, 'PedidoEnviado', tone[3] || 'acc'));
    return c;
  }
  const idxOf = (cells, o) => cells.findIndex(c => c.o === String(o));
  // a p0 num instante: 48210 a 48219 escritos; 48220 é o próximo (LOG-END-OFFSET)
  const p0window = (lo = 48210, hi = 48219) => [...Array.from({ length: hi - lo + 1 }, (_, i) => ev(lo + i, lo + i === 48213 ? 'PedidoPago' : '', 'dim')), { o: String(hi + 1), l: 'next', tn: 'new' }];

  // ── conteúdo padrão dos blocos ──
  const grp = (name, meta, ...rows) => ({ name, meta, rows });
  const brk = (i, parts, foot = '', ftn = 'dim', meta) => ({ name: `kafka-${i + 1}`, meta: meta || `id ${i + 1}`, parts, foot: [foot, ftn] });
  const LEAD = [0, 1, 2];   // líder de cada partição: p0 → kafka-1, p1 → kafka-2, p2 → kafka-3
  const roles = i => [0, 1, 2].map(p => [`p${p}`, LEAD[p] === i ? 'leader' : 'follower', '', LEAD[p] === i ? 'acc' : '']);
  const ZB = PL + BH + 2;
  // vigas: do produtor ao trilho e dos trilhos aos grupos
  const toRail = (nm, x1) => [[PX, cy(nm), TOP(nm) + 3], [x1, cy(nm), TOP(nm) + 3]];
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  const lit = (o, pts, tone, dot, thin) => o.beams.push({ pts, on: true, tone, dot, thin });
  // um evento que sai do produtor e para na célula idx do trilho nm entre t0 e t0 + d
  function send(o, t, t0, nm, cells, idx, tone = 'acc', d = 1.1) {
    if (t < t0) return 0; const f = ease(clamp((t - t0) / d)), x1 = cellX(nm, cells, idx), X = lerp(PX, x1, f), z = TOP(nm) + 1;
    if (f < 1) { lit(o, toRail(nm, x1), tone === 'bad' ? 'bad' : '', f); o.tok.push({ p: [X, cy(nm), z], tone }); }
    return f;
  }
  // ponteiro de um grupo (ou consumidor) até a célula: corre pela faixa de trás do trilho (dy separa os grupos)
  function pointer(o, from, nm, x1, dy, tone, f = 1) {
    const yb = B[nm].y + 5 + dy, z = TOP(nm) + 2, xg = GAPX - 2 + dy * 0.6;
    lit(o, [[GX, from, z + 6], [xg, from, z + 6], [xg, yb, z + 6], [x1, yb, z], [x1, yb + 6, z]], tone, f, true);
  }
  const C3 = (...c) => c;   // contadores: [rótulo, valor, tom]

  // ── o que se vê em cada cenário ──
  const SHOW = {
    topico: ['prod', 'r0', 'r1', 'r2', 'g0', 'g1', 'g2', 'b0', 'b1', 'b2'],
    chave: ['prod', 'r0', 'r1', 'r2', 'b0', 'b1', 'b2'],
    grupos: ['prod', 'r0', 'r1', 'r2', 'g0', 'g1', 'g2', 'b0', 'b1', 'b2'],
    replicas: ['prod', 'r0', 'r1', 'r2', 'b0', 'b1', 'b2'],
    particoes: ['prod', 'r0', 'r1', 'r2', 'k0', 'k1', 'k2', 'b0', 'b1', 'b2'],
    lab: ['prod', 'r0', 'b0', 'side'],
  };
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], tok: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    o.rows.prod = grp('pedidos', 'producer', ['key: pedido_id', 'dim'], ['acks = all', 'dim'], ['topic: pedidos', 'dim']);
    for (let i = 0; i < 3; i++) o.rows['r' + i] = { name: 'p' + i, meta: `leader ${i + 1}`, cells: [] };
    for (let i = 0; i < 6; i++) o.rows['s' + i] = { name: 'p' + i, cells: [] };
    o.rows.g0 = grp('estoque', 'group', ['listens to PedidoPago', 'dim']); o.rows.g1 = grp('entregas', 'group', ['listens to EstoqueReservado', 'dim']);
    o.rows.g2 = grp('notificacoes', 'group', ['listens to PedidoCriado', 'dim']);
    for (let i = 0; i < 6; i++) o.rows['k' + i] = grp(`entregas-${i + 1}`, '', ['no partition', 'dim']);
    for (let i = 0; i < 3; i++) o.rows['b' + i] = brk(i, roles(i), 'ISR in sync', 'dim');
    o.rows.side = grp('antifraude', 'new group', ['does not exist yet', 'dim']);
    if (sc === 'chave') o.rows.prod = grp('pedidos', 'producer', ['key: pedido_id', 'dim'], ['murmur2(key)', 'dim'], ['mod 3 = partition', 'dim']);
    return o;
  }
  // o tópico de pé: brokers ligados, trilhos com os pedidos de outras chaves (1047 na p1; 1048 e 1050 na p2)
  const others = { 1: [ev('1047', 'other order', 'dim')], 2: [ev('1048', 'other order', 'dim'), ev('1050', 'other order', 'dim')] };
  function standing(o) { o.rows.r1.cells = others[1]; o.rows.r2.cells = others[2]; }

  const STEPS = {
    topico: [
      { id: 'topico', dur: 5, title: 'The pedidos topic: 3 partitions', yk: 'IN THE TERMINAL',
        code: ['$ kafka-topics --describe --topic pedidos', 'Topic: pedidos  PartitionCount: 3  ReplicationFactor: 3', '  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3', '  Partition: 1  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1', '  Partition: 2  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2', '# retention: 168 h = 7 days'],
        story: 'Module 12 stopped at the PedidoPago for 1050, which had to reach stock, deliveries and notifications without the payment waiting for all three. The place those events travel through is the pedidos topic: a log where you only append at the end, split into 3 partitions, kept on the 3 brokers for 7 days.',
        look: 'The 3 tracks p0, p1 and p2 light up one by one; in front, the brokers kafka-1, kafka-2 and kafka-3, each one the leader of a partition.',
        key: 'Topic: an append-only log, split into partitions and copied across brokers.',
        f(o, t) { for (let i = 0; i < 3; i++) if (t > 0.4 + i * 0.5) { o.on['r' + i] = 1; o.on['b' + i] = 2; }
          o.cnt = C3(['TOPIC', 'pedidos'], ['PARTITIONS', '3 (p0, p1, p2)'], ['RETENTION', '7 days']);
          o.res = ['3 partitions · replication factor 3', 'min.insync.replicas = 2'];
          if (t > 1.8) T(o, SPOT.r(0), 'partition = a track of the log'); if (t > 2.6) T(o, SPOT.b(0), 'each broker leads 1 partition'); } },
      { id: 'criado', dur: 5.5, title: 'PedidoCriado lands on p0 @ 48210', yk: 'THE EVENT · 14:20:01.100',
        code: ['key: "1051"', 'value: PedidoCriado {', '  evento_id: "e-901", pedido_id: 1051, cliente: "Lena",', '  itens: [{ produto: 7, qtd: 2, preco: 19.90 }],', '  frete: 15.00, total: 54.80 }', '→ partition 0, offset 48210'],
        story: 'At 14:20:01.100 Lena closes order 1051: 2 blue mugs (39.80) and shipping to Recife (15.00), total 54.80. The pedidos service publishes PedidoCriado with key 1051. The key sends the event to p0, and the broker gives it the next free position in the log: offset 48210.',
        look: 'The token leaves the producer, runs along the p0 track and becomes cell 48210.',
        key: 'Offset: the position of each event inside the partition; it only grows.',
        f(o, t) { standing(o); o.on.prod = 1; const c = p0of1051(t > 1.6 ? 1 : 0), all = p0of1051(1); o.rows.r0.cells = c;
          send(o, t, 0.4, 'r0', all, 0); if (t > 1.6) o.on.r0 = 1;
          o.rows.prod = grp('pedidos', 'producer', ['key: 1051', 'acc'], ['PedidoCriado · e-901', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['KEY', '1051'], ['PARTITION', 'p0'], ['OFFSET', t > 1.6 ? '48210' : '…']);
          o.res = t > 1.6 ? ['p0 @ 48210 · 14:20:01.100'] : [];
          if (t > 1.8) T(o, [cellX('r0', c, 0), RY(0) + 4, 44], 'p0 @ 48210'); } },
      { id: 'pago', dur: 5.5, title: 'PedidoPago: p0 @ 48213', yk: 'THE EVENT · 14:20:03.000',
        code: ['key: "1051"', 'value: PedidoPago {', '  evento_id: "e-902", pedido_id: 1051, valor: 54.80 }', '# 72 bytes', '→ partition 0, offset 48213', '# 48211 and 48212: other orders on p0'],
        story: 'At 14:20:03.000 Lena\'s Pix payment is confirmed and PedidoPago goes out, 72 bytes. Same key, same partition: p0. But two events from other orders landed on p0 between her two events, so PedidoPago sits at offset 48213.',
        look: 'The second token stops after a gap of +2 others: cell 48213 lights up.',
        key: 'Same key, same partition: the events of one order stay in order.',
        f(o, t) { standing(o); o.on.prod = 1; o.on.r0 = 1; const all = p0of1051(2); o.rows.r0.cells = t > 1.6 ? all : p0of1051(1);
          send(o, t, 0.4, 'r0', all, 2);
          o.rows.prod = grp('pedidos', 'producer', ['key: 1051', 'acc'], ['PedidoPago · e-902', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['KEY', '1051'], ['PARTITION', 'p0'], ['OFFSET', t > 1.6 ? '48213' : '48210']);
          o.res = t > 1.6 ? ['p0 @ 48213 · 14:20:03.000', '48211 e 48212: outros pedidos'] : [];
          if (t > 1.8) T(o, [cellX('r0', all, 2), RY(0) + 4, 44], 'p0 @ 48213'); } },
      { id: 'reservado', dur: 6, title: 'Stock reacts: EstoqueReservado @ 48217', yk: 'THE EVENT · 14:20:03.040',
        code: ['# estoque read PedidoPago and took 40 → 38', 'key: "1051"', 'value: EstoqueReservado {', '  evento_id: "e-903", sku: "CANECA-007",', '  antes: 40, depois: 38 }', '→ partition 0, offset 48217'],
        story: 'The estoque group reads PedidoPago, takes 2 mugs off stock with the same locking UPDATE from module 11 (40 → 38) and publishes EstoqueReservado with the same key 1051. Forty milliseconds after the payment, the event lands at offset 48217.',
        look: 'The estoque group lights up and sends a token back to the p0 track; cell 48217 lights up.',
        key: 'Consumers also produce: estoque reacts to PedidoPago with another event.',
        f(o, t) { standing(o); o.on.r0 = 1; const all = p0of1051(3); o.rows.r0.cells = t > 2.2 ? all : p0of1051(2);
          if (t > 0.3) { o.on.g0 = 1; pointer(o, cy('g0'), 'r0', cellX('r0', all, 2), 0, '', t < 1.3 ? (t - 0.3) : null); }
          o.rows.g0 = grp('estoque', 'group', ['read p0 @ 48213', 'acc'], [t > 1.2 ? 'CANECA-007: 40 → 38' : 'decrementing…', 'acc']);
          if (t > 1.2 && t < 2.2) { const f = ease(clamp((t - 1.2) / 1)), x1 = cellX('r0', all, 4); o.tok.push({ p: [lerp(GX, x1, f), cy('r0'), TOP('r0') + 1] }); lit(o, [[GX, cy('r0'), TOP('r0') + 3], [x1, cy('r0'), TOP('r0') + 3]], '', f); }
          o.cnt = C3(['STOCK CANECA-007', t > 1.2 ? '40 → 38' : '40'], ['PARTITION', 'p0'], ['OFFSET', t > 2.2 ? '48217' : '48213']);
          o.res = t > 2.2 ? ['p0 @ 48217 · 14:20:03.040', 'CANECA-007: 40 → 38'] : [];
          if (t > 2.4) T(o, [cellX('r0', all, 4), RY(0) + 4, 44], 'p0 @ 48217'); } },
      { id: 'enviado', dur: 5.5, title: 'PedidoEnviado @ 48301: the story in order', yk: 'THE EVENT · 15:10:00',
        code: ['key: "1051"', 'value: PedidoEnviado {', '  evento_id: "e-904", pedido_id: 1051,', '  rastreio: "LA123456790BR" }', '→ partition 0, offset 48301', '# 48218 to 48300: 83 events from other orders'],
        story: 'At 15:10 the mugs ship with tracking code LA123456790BR, and PedidoEnviado goes to offset 48301. The four events of 1051 are on p0, in the order they happened, with events from other orders in between. Whoever reads p0 from start to end sees Lena\'s story in the right order.',
        look: 'The fourth cell, 48301, lights up at the end of the p0 track; the four from 1051 stay lit.',
        key: 'Order holds inside the partition: 48210 < 48213 < 48217 < 48301.',
        f(o, t) { standing(o); o.on.prod = 1; o.on.r0 = 1; const all = p0of1051(4); o.rows.r0.cells = t > 1.6 ? all : p0of1051(3);
          send(o, t, 0.4, 'r0', all, 6);
          o.rows.prod = grp('pedidos', 'producer', ['key: 1051', 'acc'], ['PedidoEnviado · e-904', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['EVENTS OF 1051', t > 1.6 ? '4' : '3'], ['PARTITION', 'p0'], ['OFFSETS', t > 1.6 ? '48210 → 48301' : '48210 → 48217']);
          o.res = t > 1.6 ? ['p0 @ 48301 · 15:10:00', 'e-901 → e-904, in order'] : [];
          if (t > 1.8) T(o, [cellX('r0', all, 6), RY(0) + 4, 44], 'p0 @ 48301'); } },
      { id: 'replay', dur: 6.5, title: 'The log keeps everything: a new group rereads from the start', yk: 'IN THE CODE · consumer',
        code: ['# queue: the message goes away when someone acks', '# log: the event stays 7 days, read or not', 'group.id = antifraude   # new group', 'auto.offset.reset = earliest', '# (in the lab: sarama.OffsetOldest)', '→ reads from the first stored offset'],
        story: 'In a queue, the message goes away when someone acknowledges it. The log does not erase on read: events stay for 7 days. So a group born today, antifraude, can start at the first stored offset and go through the roughly 48 thousand events of the day. The other groups never notice.',
        look: 'The antifraude block rises in front; its pointer starts at the beginning of p0 and runs to the end.',
        key: 'The log is reread; the queue is consumed.',
        f(o, t) { standing(o); o.on.r0 = 1; o.show.side = 1; o.on.side = t > 0.6 ? 1 : 2; const all = p0of1051(4); o.rows.r0.cells = all;
          const f = clamp((t - 1) / 3.6), n = Math.round(f * 48301);
          if (t > 1) { const x1 = lerp(RX + 50, cellX('r0', all, 6), f); lit(o, [[(GX + GW / 2), BY, TOP('side') + 6], [(GX + GW / 2), 330, TOP('side') + 6], [x1, 330, TOP('r0') + 6], [x1, RY(0) + 8, TOP('r0') + 2]], '', null, true);
            o.tok.push({ p: [x1, RY(0) + 8, TOP('r0') + 2], s: 0.6 }); }
          o.rows.side = grp('antifraude', 'new group', ['earliest: from 1st offset', 'acc'], [`read up to ${mil(n)}`, f >= 1 ? 'acc' : 'dim']);
          o.cnt = C3(['ANTIFRAUDE READ', `${mil(n)} events`], ['RETENTION', '7 days'], ['OTHER GROUPS', 'untouched']);
          o.res = f >= 1 ? ['antifraude reached the end of p0', 'the log erased nothing'] : t > 1 ? ['re-reading p0 from the start'] : [];
          if (t > 1.4) T(o, SPOT.side, 'new group: reads from the start'); } },
      { id: 'lag', dur: 7, title: 'What if it goes wrong: the consumer falls behind', yk: 'THE MATH',
        code: ['# Black Friday: 120 events/s = 40/s per partition', '# a consumer that spends 100 ms per event:', '#   1000 ÷ 100 = 10 events/s', 'lag grows 40 − 10 = 30 per second', '         = 1,800 per minute', '# lag = last offset − group offset'],
        story: 'On Black Friday 120 events arrive per second, 40 on each partition. A consumer that spends 100 ms per event reads 10 per second. The difference becomes lag, the distance between the end of the log and the group\'s pointer: it grows 30 per second, 1,800 per minute, without stopping. Lesson 5 shows what to do.',
        look: 'The end of p0 runs off to the right; the group\'s pointer moves slowly and the gap between them turns red.',
        key: 'Lag is the distance between the last offset and the group\'s; if it only grows, capacity is missing.',
        f(o, t) { standing(o); o.on.r0 = 'bad'; o.on.prod = 1; const s = clamp((t - 0.6) / 5) * 60, end = Math.round(s * 40), rd = Math.round(s * 10), lag = end - rd;
          o.rows.r0.cells = [ev(`+${mil(rd)}`, 'group here', 'acc'), gap(`lag ${mil(lag)}`), ev(`+${mil(end)}`, 'end of log', 'bad')];
          o.rows.r0.meta = '40/s';
          o.on.g1 = 'bad'; o.rows.g1 = grp('entregas', 'group', ['100 ms per event: 10/s', 'bad'], [`LAG ${mil(lag)}`, 'bad']);
          pointer(o, cy('g1'), 'r0', cellX('r0', o.rows.r0.cells, 0), 4, 'bad');
          if (t > 0.6 && s < 60) { const f = (t * 1.4) % 1; lit(o, toRail('r0', cellX('r0', o.rows.r0.cells, 2)), '', f); }
          o.cnt = C3(['LAG', mil(lag), 'bad'], ['ARRIVING', '40/s on p0'], ['LEAVING', '10/s', 'bad']);
          o.res = [`after ${Math.round(s)} s: lag ${mil(lag)}`, '+30 per second, 1,800 per minute'];
          if (t > 1.6) T(o, SPOT.r(0), 'lag only grows', 'bad'); } },
    ],
    chave: [
      { id: 'hash', dur: 6, title: 'Key 1051 lands on p0', yk: 'IN THE CODE · partitioner (Java)',
        code: ['h = murmur2(bytes("1051"))', '  = -395860997', 'positive: h & 0x7fffffff', '  = 1751622651', '1751622651 mod 3 = 0', '→ partition 0'],
        story: 'The producer picks the partition, not the broker. The Java client runs the key\'s bytes through murmur2, drops the sign (& 0x7fffffff) and divides by the number of partitions: the remainder is the partition. For key 1051, the hash is −395,860,997, positive 1,751,622,651, and the remainder of the division by 3 is 0.',
        look: 'The producer shows the math line by line; the 1051 token runs to p0.',
        key: 'partition = murmur2(key) mod number of partitions: the same key always lands in the same place.',
        f(o, t) { standing(o); o.rows.r1.cells = []; o.rows.r2.cells = []; o.on.prod = 1; const c = [ev('1051', 'PedidoCriado')];
          const ln = [['key: 1051', 'acc'], ['murmur2 = -395860997', t > 0.8 ? 'acc' : 'dim'], ['& 0x7fffffff = 1751622651', t > 1.6 ? 'acc' : 'dim'], ['mod 3 = 0 → p0', t > 2.4 ? 'acc' : 'dim']];
          o.rows.prod = grp('pedidos', 'producer', ...ln.slice(0, 1 + Math.min(3, Math.floor(t / 0.8))));
          send(o, t, 2.6, 'r0', c, 0); if (t > 3.7) { o.rows.r0.cells = c; o.on.r0 = 1; }
          o.cnt = C3(['KEY', '1051'], ['MURMUR2', t > 0.8 ? '-395860997' : '…'], ['PARTITION', t > 2.4 ? 'p0' : '…']);
          o.res = t > 2.4 ? ['1751622651 mod 3 = 0', '1051 → p0'] : [];
          if (t > 3.8) T(o, SPOT.r(0), '1051 → p0'); } },
      { id: 'cinco', dur: 8, title: 'Five orders, three tracks', yk: 'IN THE CODE · murmur2 mod 3',
        code: ['key    positive murmur2  mod 3', '1047   2117896504        1 → p1', '1048   1636681634        2 → p2', '1049   1782996405        0 → p0', '1050    834011288        2 → p2', '1051   1751622651        0 → p0'],
        story: 'Orders 1047 to 1051 go through the same math. 1047 goes to p1; 1048 and 1050 go to p2; 1049 and 1051 go to p0. The spread does not follow the number order, and that is what divides the load across partitions.',
        look: 'Five tokens leave the producer, one at a time, and each lands on the track the math sent it to.',
        key: 'The hash spreads the keys; the same key never changes track (as long as the number of partitions stays the same).',
        f(o, t) { o.on.prod = 1; const K = [[1047, 1], [1048, 2], [1049, 0], [1050, 2], [1051, 0]], cells = { 0: [], 1: [], 2: [] }, final = { 0: [], 1: [], 2: [] };
          K.forEach(([k, p]) => final[p].push(ev(k, 'order ' + k)));
          let cur_ = null;
          K.forEach(([k, p], i) => { const t0 = 0.4 + i * 1.2, idx = final[p].findIndex(c => c.o === String(k));
            if (t > t0 + 1) { cells[p].push(final[p][idx]); } else if (t >= t0) cur_ = [k, p]; send(o, t, t0, 'r' + p, final[p], idx); });
          for (let p = 0; p < 3; p++) { o.rows['r' + p].cells = cells[p]; if (cells[p].length) o.on['r' + p] = 1; }
          o.rows.prod = grp('pedidos', 'producer', ['key: ' + (cur_ ? cur_[0] : '…'), 'acc'], ['murmur2(key) mod 3', 'dim'], [cur_ ? `→ p${cur_[1]}` : '', 'acc']);
          const n = cells[0].length + cells[1].length + cells[2].length;
          o.cnt = C3(['ORDERS', `${n} of 5`], ['p0 · p1 · p2', `${cells[0].length} · ${cells[1].length} · ${cells[2].length}`], ['LAST', cur_ ? `${cur_[0]} → p${cur_[1]}` : n ? '1051 → p0' : '…']);
          o.res = n === 5 ? ['p0: 1049, 1051 · p1: 1047', 'p2: 1048, 1050'] : [];
          if (n === 5) { T(o, SPOT.r(1), 'p1: 1047'); T(o, SPOT.r(2), 'p2: 1048 and 1050'); } } },
      { id: 'ordem', dur: 7, title: 'Same key, one consumer at a time', yk: 'IN THE GROUP · estoque',
        code: ['# in the estoque group, each partition has 1 owner', 'p0 → estoque-1   # reads 48210, 48213, 48217…', 'p1 → estoque-2', 'p2 → estoque-3', '# the events of 1051 pass one at a time', '# no mutex: the partition plays the role of the lock'],
        story: 'The four events of 1051 are on p0, and inside a group each partition is read by a single consumer. So estoque-1 gets PedidoCriado, then PedidoPago, then EstoqueReservado, never two at once. The lock from module 11 is still in the database, but order 1051 already arrives in a line.',
        look: 'p0 lights up with the four cells of 1051; a single pointer passes through them, one at a time.',
        key: 'Same key + one consumer per partition = the events of an order in series, no lock.',
        f(o, t) { standing(o); const all = p0of1051(4); o.rows.r0.cells = all; o.on.r0 = 1;
          const seq = [0, 2, 4, 6], k = Math.min(3, Math.floor(Math.max(0, t - 0.6) / 1.2));
          all.forEach((c, i) => { if (!c.gap) c.tn = seq.indexOf(i) < k ? 'dim' : seq[k] === i ? 'acc' : 'dim'; });
          const x = cellX('r0', all, seq[k]);
          lit(o, [[PX - 40, 316, ZB], [PX - 40, 330, ZB], [x, 330, TOP('r0') + 6], [x, RY(0) + 8, TOP('r0') + 2]], '', null, true);
          o.rows.prod = grp('estoque-1', 'owner of p0', [`reading ${all[seq[k]].o}`, 'acc'], [all[seq[k]].l, 'acc'], ['one event at a time', 'dim']);
          o.cnt = C3(['OWNER OF p0', 'estoque-1'], ['READING', all[seq[k]].o], ['AT THE SAME TIME', '1']);
          o.res = [`estoque-1: ${all[seq[k]].l}`, 'the others wait their turn'];
          if (t > 1) T(o, [x, RY(0) + 4, 44], 'one at a time'); } },
      { id: 'sem-chave', dur: 7.5, title: 'What if it goes wrong: publishing without a key', yk: 'IN THE CODE · producer',
        code: ['// key = null', 'producer.send(new ProducerRecord<>("pedidos", evento));', '# no key: sticky partition, one per batch (KIP-480)', '# PedidoCriado → p0 · PedidoPago, in another batch → p2', '# different consumers, different paces'],
        story: 'A team publishes without a key. Now the client picks the partition per batch (the sticky partitioner): 1051\'s PedidoCriado lands in a batch that went to p0 and the PedidoPago, in the next batch, goes to p2. Each partition has its own consumer and its own pace, and the p2 consumer can process the payment before the p0 one sees the order created.',
        look: 'The 1051 tokens split apart: one to p0, the other to p2, in red.',
        key: 'Order only exists inside the partition; with no key, no partition is guaranteed.',
        f(o, t) { standing(o); o.on.prod = 'bad'; const c0 = [ev('1051', 'PedidoCriado', 'bad')], c2 = [...others[2], ev('1051', 'PedidoPago', 'bad')];
          o.rows.prod = grp('pedidos', 'producer', ['key: null', 'bad'], ['sticky: 1 partition per batch', 'dim'], ['batch 1 → p0 · batch 2 → p2', 'bad']);
          send(o, t, 0.4, 'r0', c0, 0, 'bad'); send(o, t, 1.6, 'r2', c2, 2, 'bad');
          if (t > 1.5) { o.rows.r0.cells = c0; o.on.r0 = 'bad'; } if (t > 2.7) { o.rows.r2.cells = c2; o.on.r2 = 'bad'; } else o.rows.r2.cells = others[2];
          o.cnt = C3(['KEY', 'none', 'bad'], ['PedidoCriado', t > 1.5 ? 'p0' : '…'], ['PedidoPago', t > 2.7 ? 'p2' : '…', 'bad']);
          o.res = t > 2.7 ? ['1051 in two partitions', 'paid can arrive before created'] : [];
          if (t > 3) T(o, SPOT.r(2), 'PedidoPago on p2:\ndoes not wait for p0', 'bad'); } },
    ],
    grupos: [
      { id: 'tres', dur: 6, title: 'Three groups, the same log', yk: 'IN THE TERMINAL · kafka-consumer-groups',
        code: ['GROUP         PARTITION  CURRENT  LOG-END  LAG', 'estoque       0          48220    48220    0', 'notificacoes  0          48219    48220    1', 'entregas      0          48210    48220    10', '# each group keeps its own offset'],
        story: 'estoque, entregas and notificacoes are three consumer groups of the same topic. Each group receives every event and keeps its own offset per partition. On p0, right now, the log ends at 48220: estoque is up to date, notificacoes is 1 behind and entregas is 10 behind.',
        look: 'Three pointers leave the groups and stop at different places on p0: 48220, 48219 and 48210.',
        key: 'Each group reads everything and moves at its own pace; the offset belongs to the group, not to the event.',
        f(o, t) { standing(o); const c = p0window(); o.rows.r0.cells = c; o.on.r0 = 1; o.rows.r0.meta = 'LOG-END 48220';
          const P = [['g0', 48220, 0], ['g2', 48219, 1], ['g1', 48210, 10]];
          P.forEach(([g, cur_, lag], i) => { if (t < 0.4 + i * 0.7) return; o.on[g] = lag > 5 ? 'bad' : 1; pointer(o, cy(g), 'r0', cellX('r0', c, idxOf(c, cur_)), i * 4, lag > 5 ? 'bad' : '');
            o.rows[g] = grp(o.rows[g].name, 'group', [`p0 at ${cur_}`, 'acc'], [`LAG ${lag}`, lag > 5 ? 'bad' : lag ? 'acc' : 'dim']); });
          o.cnt = C3(['LOG-END p0', '48220'], ['LAG', 'estoque 0 · notif. 1'], ['LAG ENTREGAS', '10', 'bad']);
          o.res = ['3 groups · 3 offsets on the same p0', 'entregas: 10 events behind'];
          if (t > 2.6) T(o, SPOT.g(1), 'lag 10 = 1 s behind', 'bad'); } },
      { id: 'ritmo', dur: 7, title: 'Each group moves at its own pace', yk: 'IN THE CODE · consumer_faturamento (lab)',
        code: ['for msg := range claim.Messages() {', '    time.Sleep(100 * time.Millisecond)', '    sess.MarkMessage(msg, "")', '}', '# 100 ms per event = 10 events/s', '# 10 of lag = 1 s to catch up'],
        story: 'entregas spends 100 ms per event, like the lab\'s faturamento consumer: 10 events per second. With no new events, it catches up to the end of p0 in 1 s. estoque and notificacoes do not wait for it, and it does not slow anyone down.',
        look: 'The entregas pointer moves cell by cell from 48210 to 48220; the other two stay parked at the end.',
        key: 'A slow group does not hold back the others: each one has its own pointer.',
        f(o, t) { standing(o); const c = p0window(); o.rows.r0.cells = c; o.on.r0 = 1; o.rows.r0.meta = 'LOG-END 48220';
          const ms = clamp((t - 0.8) / 4.4) * 1000, cur_ = 48210 + Math.floor(ms / 100), lag = 48220 - cur_;
          [['g0', 48220, 0], ['g2', 48220, 0], ['g1', cur_, lag]].forEach(([g, cu, lg], i) => { o.on[g] = g === 'g1' ? 1 : 2; pointer(o, cy(g), 'r0', cellX('r0', c, idxOf(c, cu)), i * 4, '');
            o.rows[g] = grp(o.rows[g].name, 'group', [`p0 at ${cu}`, 'acc'], [`LAG ${lg}`, lg ? 'acc' : 'dim']); });
          o.cnt = C3(['LAG ENTREGAS', String(lag)], ['TIME', `${Math.round(ms)} ms`], ['PACE', '100 ms per event']);
          o.res = lag ? [`entregas at ${cur_}`] : ['entregas caught up: lag 0 in 1 s'];
          if (t > 1) T(o, SPOT.g(1), '10 events/s'); } },
      { id: 'dentro', dur: 6.5, title: 'Inside the group: one partition, one consumer', yk: 'IN THE TERMINAL · entregas group',
        code: ['GROUP     PARTITION  CONSUMER-ID', 'entregas  0          entregas-1', 'entregas  1          entregas-2', 'entregas  2          entregas-3', '# 3 partitions: at most 3 useful consumers'],
        story: 'The entregas group runs on 3 replicas. Kafka splits the partitions among them: p0 to entregas-1, p1 to entregas-2, p2 to entregas-3. Each partition has a single owner inside the group, and that is what keeps the order of each key.',
        look: 'The entregas group opens into 3 consumers; each track connects to just one.',
        key: 'Inside the group, each partition goes to one consumer; the whole group splits the topic.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) o.on['r' + i] = 1;
          ['g0', 'g1', 'g2'].forEach(g => o.show[g] = 0); for (let i = 0; i < 3; i++) o.show['k' + i] = 1;
          for (let i = 0; i < 3; i++) { if (t < 0.6 + i * 0.6) continue; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, [`reads only p${i}`, 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.6 + i * 0.3) % 1); }
          o.cnt = C3(['CONSUMERS', '3'], ['PARTITIONS', '3'], ['OWNER PER PARTITION', '1']);
          o.res = ['p0 → entregas-1 · p1 → entregas-2', 'p2 → entregas-3'];
          if (t > 2.4) T(o, [(GX + GW / 2), 120, 40], 'group entregas'); } },
      { id: 'ociosos', dur: 7, title: 'What if it goes wrong: 5 replicas, 3 partitions', yk: 'IN THE TERMINAL · entregas group',
        code: ['GROUP     PARTITION  CONSUMER-ID', 'entregas  0          entregas-1', 'entregas  1          entregas-2', 'entregas  2          entregas-3', 'entregas  -          entregas-4   # no partition', 'entregas  -          entregas-5   # no partition'],
        story: 'Black Friday heats up and someone scales entregas to 5 replicas. The topic still has 3 partitions, and each partition has only one owner in the group. entregas-4 and entregas-5 join the group, get no partition and read nothing: they cost machines and add no throughput.',
        look: 'Two new replicas come up and stay dark, with no track connected.',
        key: 'Useful consumers in a group = at most the number of partitions.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) o.on['r' + i] = 1;
          ['g0', 'g1', 'g2'].forEach(g => o.show[g] = 0); for (let i = 0; i < 5; i++) o.show['k' + i] = i < 3 || t > 0.5 + (i - 3) * 0.6 ? 1 : 0;
          for (let i = 0; i < 3; i++) { o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10 events/s', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.6 + i * 0.3) % 1); }
          for (let i = 3; i < 5; i++) { o.on['k' + i] = 'bad'; o.rows['k' + i] = grp(`entregas-${i + 1}`, 'idle', ['no partition', 'bad']); }
          o.cnt = C3(['REPLICAS', '5'], ['USEFUL', '3 of 5'], ['IDLE', '2', 'bad']);
          o.res = ['entregas-4 and entregas-5: no partition', 'more replicas, same throughput'];
          if (t > 1.8) T(o, [(GX + GW / 2), KY(4) + 26, 30], '2 idle replicas', 'bad'); } },
    ],
    replicas: [
      { id: 'lider', dur: 6, title: 'Each partition: one leader and two followers', yk: 'IN THE TERMINAL',
        code: ['$ kafka-topics --describe --topic pedidos', '  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3', '  Partition: 1  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1', '  Partition: 2  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2', '# ISR: the replicas in sync with the leader'],
        story: 'Replication factor 3: each partition has a copy on all 3 brokers. One of them is the leader, which takes the writes and serves the reads; the other two follow, copying what the leader writes. The leader of p0 is kafka-1. The ISR (in-sync replicas) is the list of copies that are up to date: today, all three.',
        look: 'On each broker, the cell of the partition it leads lights up; beams link the leader of p0 to the two followers.',
        key: 'The leader writes and reads; followers copy; the ISR is whoever is in sync.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(1); for (let i = 0; i < 3; i++) { o.on['b' + i] = t > 0.4 + i * 0.4 ? 1 : 2; if (t > 0.4) o.on['r' + i] = 2; }
          if (t > 1.8) { o.on.r0 = 1; for (const j of [1, 2]) lit(o, repl(0, j), '', ((t - 1.8) * 0.5 + j * 0.3) % 1); }
          o.cnt = C3(['LEADER OF p0', 'kafka-1'], ['FOLLOWERS', 'kafka-2, kafka-3'], ['ISR p0', '1, 2, 3']);
          o.res = ['p0: leader 1 · p1: leader 2 · p2: leader 3'];
          if (t > 2) T(o, SPOT.b(0), 'kafka-1: leader of p0'); } },
      { id: 'acks-all', dur: 7, title: 'acks=all: confirms only with 2 copies', yk: 'IN THE CODE · producer',
        code: ['acks = all                 # default since Kafka 3.0', 'enable.idempotence = true', '# on the topic: min.insync.replicas = 2', 't = 0 ms   PedidoPago reaches kafka-1', 't ≈ 10 ms followers copy it', '          → confirmation to the producer'],
        story: '1051\'s PedidoPago reaches kafka-1, the leader of p0. With acks=all and min.insync.replicas = 2, the leader only answers after the ISR has the event, and the ISR must have at least 2 replicas. The followers copy it in about 10 ms, and then the producer gets the confirmation.',
        look: 'The token goes to kafka-1; beams carry the copy to kafka-2 and kafka-3; only then does the confirmation go back to the producer.',
        key: 'acks=all: confirmation after the in-sync replicas have written it, never just the leader.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(1); const ms = clamp((t - 0.6) * 4, 0, 14);
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2; o.on.b0 = 1;
          const have = [ms > 0, ms >= 10, ms >= 10];
          if (ms > 0 && ms < 10) for (const j of [1, 2]) lit(o, repl(0, j), '', ms / 10);
          brokersWith(o, have, '48213');
          if (ms >= 10) { o.on.r0 = 1; o.rows.r0.cells = p0of1051(2); lit(o, ackPath(), '', clamp((ms - 10) / 3)); }
          o.rows.prod = grp('pedidos', 'producer', ['acks = all', 'acc'], [ms >= 12 ? 'confirmed ✓' : 'waiting…', ms >= 12 ? 'acc' : 'dim'], ['p0 @ 48213', 'acc']);
          o.cnt = C3(['TIME', `${Math.round(ms)} ms`], ['REPLICAS WITH THE EVENT', `${have.filter(Boolean).length} of 3`], ['CONFIRMED', ms >= 12 ? 'yes' : 'not yet']);
          o.res = ms >= 12 ? ['confirmed in ≈ 10 ms', '3 copies of p0 @ 48213'] : ms > 0 ? ['leader wrote; waiting for the ISR'] : [];
          if (ms >= 10) T(o, SPOT.b(1), 'copy in ≈ 10 ms'); } },
      { id: 'acks1', dur: 9, title: 'What if it goes wrong: acks=1 and the leader dies at 5 ms', yk: 'TIMELINE · acks=1',
        code: ['acks = 1                   # leader only', 't = 0 ms   kafka-1 writes 48213 and confirms', 't = 5 ms   kafka-1 dies', 't ≈ 10 ms the copy that would come never happens', 'up to ~9 s later: kafka-2 becomes leader of p0', '# without 48213: estoque never sees the payment'],
        story: 'Now with acks=1. kafka-1 writes the PedidoPago and confirms right away: the producer moves on happy. At 5 ms kafka-1 dies, before the followers copy (that would take about 10 ms). Within about 9 s kafka-2 is elected leader of p0, and it does not have 48213. Lena\'s payment vanished, and stock will never know.',
        look: 'The confirmation comes back fast; kafka-1 turns red; kafka-2 becomes leader without cell 48213.',
        key: 'acks=1 confirms before the copy: if the leader dies in that gap, the confirmed event is lost.',
        f(o, t) { standing(o); const ms = clamp((t - 0.6) * 3, 0, 15), down = ms >= 5, elect = t > 6;
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          if (ms > 0) lit(o, ackPath(), '', clamp(ms / 2));
          brokersWith(o, [ms > 0, false, false], '48213');
          if (ms > 0 && ms < 5) for (const j of [1, 2]) lit(o, repl(0, j), '', ms / 10);
          if (down) { o.on.b0 = 'bad'; o.rows.b0 = brk(0, [['p0', 'down', '48213', 'bad'], ['p1', 'down', '', 'bad'], ['p2', 'down', '', 'bad']], 'went down at t = 5 ms', 'bad', 'down');
            for (const j of [1, 2]) o.beams.push({ pts: repl(0, j), on: true, tone: 'bad' }); }
          if (elect) { o.on.b1 = 1; o.rows.b1 = brk(1, [['p0', 'leader', 'no 48213', 'bad'], ['p1', 'leader', '', 'acc'], ['p2', 'follower', '', '']], 'new leader of p0', 'acc'); }
          o.rows.r0.cells = elect ? p0of1051(1).concat(gap('+2'), ev(48213, 'does not exist', 'bad')) : ms > 0 ? p0of1051(2) : p0of1051(1);
          o.on.r0 = elect ? 'bad' : ms > 0 ? 1 : 2; o.rows.r0.meta = elect ? 'leader 2' : 'leader 1';
          o.rows.prod = grp('pedidos', 'producer', ['acks = 1', 'bad'], [ms > 0 ? 'confirmed ✓ (t = 0)' : 'sending…', 'acc'], ['thinks it worked', ms > 0 ? 'bad' : 'dim']);
          o.cnt = C3(['TIME', elect ? '~9 s later' : `${Math.round(ms)} ms`, down ? 'bad' : ''], ['COPIES OF 48213', down ? '0' : ms > 0 ? '1 (leader only)' : '0', 'bad'], ['LEADER OF p0', elect ? 'kafka-2' : down ? 'none' : 'kafka-1', down ? 'bad' : '']);
          o.res = elect ? ['kafka-2 leader, without 48213', 'PedidoPago confirmed and lost'] : down ? ['kafka-1 went down at t = 5 ms', 'the copy never arrived'] : ms > 0 ? ['confirmed at t = 0 (leader only)'] : [];
          if (down) T(o, SPOT.b(0), 'went down before the copy', 'bad'); if (elect) T(o, SPOT.b(1), 'new leader, without 48213', 'bad'); } },
      { id: 'repete', dur: 8, title: 'With acks=all, the same crash does not lose the event', yk: 'TIMELINE · acks=all',
        code: ['acks = all, enable.idempotence = true', 't = 0 ms   kafka-1 writes 48213, does not confirm', 't = 5 ms   kafka-1 dies: the producer gets no ok', 'the producer retries (retries) on the new leader', 'kafka-2 writes; the ISR copies; it confirms', '# idempotence: the retry does not duplicate'],
        story: 'The same crash with acks=all. kafka-1 writes, but does not confirm, because the ISR does not have 2 copies yet. It dies at 5 ms. With no confirmation, the producer retries the send, now to kafka-2, which became leader. kafka-2 writes, kafka-3 copies, and the producer gets the ok. Idempotence makes sure the retry does not become two payments.',
        look: 'kafka-1 turns red without confirming; the token goes back to the producer and on to kafka-2, which lights up with the event.',
        key: 'With no confirmation, the producer retries; with idempotence, retrying is safe.',
        f(o, t) { standing(o); const ms = clamp((t - 0.6) * 3, 0, 15), down = ms >= 5, retry = t > 4.6;
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          brokersWith(o, [ms > 0, retry && t > 5.8, retry && t > 6.4], '48213');
          if (down) { o.on.b0 = 'bad'; o.rows.b0 = brk(0, [['p0', 'down', '', 'bad'], ['p1', 'down', '', 'bad'], ['p2', 'down', '', 'bad']], 'went down at t = 5 ms', 'bad', 'down'); }
          if (retry) { o.on.b1 = 1; o.rows.b1.parts[0] = ['p0', 'leader', t > 5.8 ? '48213 ✓' : '', 'acc']; o.rows.b1.foot = ['new leader of p0', 'acc'];
            const f = clamp((t - 4.6) / 1.2); lit(o, [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(1) + 30, 392, ZB]], '', f); if (f < 1) o.tok.push({ p: [lerp(PCX, BXB(1) + 30, f), 392, ZB] });
            if (t > 5.8 && t < 6.6) lit(o, repl(1, 2), '', (t - 5.8) / 0.8); if (t > 6.6) lit(o, [[BXB(1) + 30, 392, ZB], [PCX, 392, ZB], [PCX, 316, ZB]], '', clamp((t - 6.6) / 0.8)); }
          o.rows.r0.cells = t > 6.4 ? p0of1051(2) : p0of1051(1); o.on.r0 = t > 6.4 ? 1 : 2; o.rows.r0.meta = retry ? 'leader 2' : 'leader 1';
          const ok = t > 7.2;
          o.rows.prod = grp('pedidos', 'producer', ['acks = all', 'acc'], [ok ? 'confirmed ✓' : retry ? 'retrying on kafka-2' : down ? 'no response' : 'waiting…', ok ? 'acc' : down ? 'bad' : 'dim'], ['idempotent', 'dim']);
          o.cnt = C3(['TIME', retry ? 'new attempt' : `${Math.round(ms)} ms`], ['CONFIRMED', ok ? 'yes' : 'not yet', ok ? '' : down ? 'bad' : ''], ['COPIES OF 48213', ok ? '2 (kafka-2, kafka-3)' : down ? '0 standing' : '1']);
          o.res = ok ? ['48213 on kafka-2 and kafka-3', 'nothing lost, nothing duplicated'] : down ? ['kafka-1 went down without confirming'] : [];
          if (down && !retry) T(o, SPOT.b(0), 'not confirmed: the producer retries', 'bad'); if (ok) T(o, SPOT.b(1), 'kafka-2 writes and confirms'); } },
      { id: 'dois', dur: 8, title: 'What if it goes wrong: two brokers die', yk: 'IN THE LOG · producer',
        code: ['# kafka-1 and kafka-2 down: ISR of p0 = {3}', '# 1 replica in sync < min.insync.replicas = 2', 'NotEnoughReplicasException:', '  Messages are rejected since there are fewer', '  in-sync replicas than required.', '# the topic stops accepting writes on p0'],
        story: 'Now kafka-1 and kafka-2 die. kafka-3 takes over p0, but the ISR is left with just it: 1 replica, fewer than the 2 required. The producer gets NotEnoughReplicas and p0 stops accepting writes. Kafka prefers to be unavailable over confirming an event that exists on a single machine: it is the CAP choice from module 3.',
        look: 'Two brokers turn red; kafka-3 alone lights up, and the producer\'s token comes back red.',
        key: 'min.insync.replicas = 2: with a single copy, Kafka refuses the write so it does not lose data.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(2); const d1 = t > 0.6, d2 = t > 1.6, err = t > 3;
          for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          const off = i => brk(i, [['p0', 'down', '', 'bad'], ['p1', 'down', '', 'bad'], ['p2', 'down', '', 'bad']], 'down', 'bad', 'down');
          if (d1) { o.on.b0 = 'bad'; o.rows.b0 = off(0); } if (d2) { o.on.b1 = 'bad'; o.rows.b1 = off(1); }
          if (d2) { o.on.b2 = 1; o.rows.b2 = brk(2, [['p0', 'leader', 'ISR {3}', 'bad'], ['p1', 'leader', '', 'acc'], ['p2', 'leader', '', 'acc']], 'ISR = {3} < 2', 'bad'); }
          if (t > 2.2) { const f = clamp((t - 2.2) / 0.8); lit(o, [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(2) + 30, 392, ZB]], err ? 'bad' : '', f); }
          o.on.r0 = err ? 'bad' : 2; o.rows.r0.meta = d2 ? 'leader 3' : d1 ? 'leader 2' : 'leader 1';
          o.on.prod = err ? 'bad' : 0;
          o.rows.prod = grp('pedidos', 'producer', ['acks = all', 'acc'], [err ? 'NotEnoughReplicas' : 'sending…', err ? 'bad' : 'dim'], [err ? 'write refused' : '', 'bad']);
          o.cnt = C3(['BROKERS UP', d2 ? '1 of 3' : d1 ? '2 of 3' : '3 of 3', d1 ? 'bad' : ''], ['ISR OF p0', d2 ? '{3}' : d1 ? '{2, 3}' : '{1, 2, 3}', d2 ? 'bad' : ''], ['WRITES TO p0', err ? 'refused' : 'accepted', err ? 'bad' : '']);
          o.res = err ? ['NotEnoughReplicasException', 'no loss, no availability'] : [];
          if (err) T(o, SPOT.b(2), 'ISR = {3}: refuses to write', 'bad'); } },
    ],
    particoes: [
      { id: 'limite', dur: 6.5, title: 'entregas is at its limit', yk: 'THE MATH',
        code: ['# Black Friday: 30 EstoqueReservado/s on the topic', '# 3 partitions → 3 useful consumers', '30 ÷ 3 = 10 events/s per consumer', '# each spends 100 ms: handles 10/s', '→ 100% busy, no slack'],
        story: 'On Black Friday 30 EstoqueReservado go out per second, which is what entregas has to handle. With 3 partitions, that is 3 useful consumers, 10 events per second for each. At 100 ms per event, each handles exactly 10 per second. It is at the limit: any burst becomes lag.',
        look: 'The three consumers light up full, each one linked to a track.',
        key: 'Group capacity = useful consumers × events/s of each one.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) { o.on['r' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10/s · 100% busy', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 1.2 + i * 0.3) % 1); }
          o.cnt = C3(['CAPACITY', '30 events/s'], ['ARRIVING', '30 events/s'], ['SLACK', '0', 'bad']);
          o.res = ['3 × 10/s = 30/s', 'no slack for a burst'];
          if (t > 1.6) T(o, [(GX + GW / 2), KY(3) + 14, 30], '100% busy', 'bad'); } },
      { id: 'replicas', dur: 6.5, title: 'More replicas do not help', yk: 'THE MATH',
        code: ['# entregas with 5 replicas', 'useful = min(5 replicas, 3 partitions) = 3', 'capacity = 3 × 10/s = 30/s', '# entregas-4 and entregas-5: no partition'],
        story: 'The reflex is to add replicas. With 5, the math does not change: only 3 get a partition, and capacity stays at 30 per second. The ceiling here is not the number of machines, it is the number of partitions.',
        look: 'Two more consumers come up and stay dark; capacity does not leave 30/s.',
        key: 'The number of partitions is the parallelism ceiling of a group.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 5; i++) o.show['k' + i] = i < 3 || t > 0.5 + (i - 3) * 0.5 ? 1 : 0;
          for (let i = 0; i < 3; i++) { o.on['r' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10/s · 100% busy', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 1.2 + i * 0.3) % 1); }
          for (let i = 3; i < 5; i++) { o.on['k' + i] = 'bad'; o.rows['k' + i] = grp(`entregas-${i + 1}`, 'idle', ['no partition', 'bad']); }
          o.cnt = C3(['CAPACITY', '30 events/s'], ['REPLICAS', '5'], ['USEFUL', '3 of 5', 'bad']);
          o.res = ['min(5, 3) = 3 useful consumers', 'capacity: 30/s, same'];
          if (t > 1.6) T(o, [(GX + GW / 2), KY(4) + 26, 30], '2 idle', 'bad'); } },
      { id: 'seis', dur: 7, title: '6 partitions: 6 useful consumers', yk: 'IN THE TERMINAL',
        code: ['$ kafka-topics --alter --topic pedidos --partitions 6', '# entregas with 6 replicas: 1 partition each', 'capacity = 6 × 10/s = 60/s', '30/s ÷ 6 = 5/s per consumer (50%)', '# partitions only go up: you cannot go back to 3'],
        story: 'Raising the topic to 6 partitions fixes the math: entregas can have 6 useful consumers, 60 events per second of capacity, each at 50%. But the number of partitions also goes into the key math. And partitions only go up: you cannot go back to 3 afterwards.',
        look: 'The 3 tracks become 6 thinner ones; six consumers light up, each linked to its own.',
        key: 'More partitions, more parallelism; and the key math changes.',
        f(o, t) { const six = t > 0.6; for (let i = 0; i < 3; i++) o.show['r' + i] = six ? 0 : 1; for (let i = 0; i < 6; i++) { o.show['s' + i] = six ? 1 : 0; o.show['k' + i] = six ? 1 : i < 3 ? 1 : 0; }
          for (let i = 0; i < 6; i++) { if (!six) break; o.on['s' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['5/s · 50%', 'acc']);
            const y = cy('s' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('s' + i) + 3], [GAPX, y, TOP('s' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.7 + i * 0.17) % 1); }
          for (let i = 0; i < 3; i++) { o.rows['b' + i] = brk(i, roles(i), six ? `+ p${i + 3} (leader)` : 'ISR in sync', six ? 'acc' : 'dim'); o.on['b' + i] = 2; }
          o.cnt = C3(['CAPACITY', six ? '60 events/s' : '30 events/s'], ['PARTITIONS', six ? '6' : '3'], ['SLACK', six ? '50%' : '0']);
          o.res = six ? ['6 × 10/s = 60/s', 'each consumer at 50%'] : [];
          if (t > 2) T(o, [(GX + GW / 2), 112, 40], '6 useful consumers'); } },
      { id: 'salto', dur: 9, title: 'What if it goes wrong: key 1051 changes track', yk: 'murmur2 mod 3 → mod 6',
        code: ['key    mod 3  mod 6', '1047   p1  →  p4', '1048   p2  →  p2', '1049   p0  →  p3', '1050   p2  →  p2', '1051   p0  →  p3   # Lena\'s order changes track'],
        story: 'The key math was murmur2 mod 3; now it is mod 6. 1048 and 1050 stay on p2, but 1051 leaves p0 and goes to p3 (so does 1049). If the switch happens in the middle of Lena\'s order, PedidoCriado stayed on p0 and PedidoPago lands on p3. Those are different consumers, each at its own pace: the payment can be handled before the order created. The order\'s sequence breaks.',
        look: 'The 1051 token leaves the producer and, instead of p0, lands on p3; the two 1051 cells turn red on different tracks.',
        key: 'Changing the number of partitions changes where keys go: per-key order breaks at the transition.',
        f(o, t) { for (let i = 0; i < 3; i++) o.show['r' + i] = 0; for (let i = 0; i < 6; i++) { o.show['s' + i] = 1; o.show['k' + i] = 1; o.on['k' + i] = 2; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['5/s', 'dim']); o.on['s' + i] = 2; }
          o.on.prod = 1; o.rows.prod = grp('pedidos', 'producer', ['key: 1051', 'acc'], ['murmur2 mod 6 = 3', t > 0.6 ? 'bad' : 'dim'], ['was p0, now p3', t > 0.6 ? 'bad' : 'dim']);
          const c0 = [ev('1051', 'PedidoCriado', t > 2 ? 'bad' : 'acc'), ev('1049', 'other order', 'dim')], c3 = [ev('1051', 'PedidoPago', 'bad')];
          o.rows.s0.cells = c0; o.rows.s2.cells = [ev('1048', '', 'dim'), ev('1050', '', 'dim')];
          send(o, t, 0.8, 's3', c3, 0, 'bad'); if (t > 1.9) { o.rows.s3.cells = c3; o.on.s3 = 'bad'; o.on.s0 = 'bad'; o.on.k3 = 'bad'; o.on.k0 = 'bad';
            o.rows.k0 = grp('entregas-1', 'p0', ['PedidoCriado of 1051', 'bad']); o.rows.k3 = grp('entregas-4', 'p3', ['PedidoPago of 1051', 'bad']); }
          o.cnt = C3(['1051', t > 1.9 ? 'p0 and p3' : 'p0', t > 1.9 ? 'bad' : ''], ['KEYS THAT MOVED', '1047, 1049, 1051'], ['ORDER OF 1051', t > 1.9 ? 'broken' : 'ok', t > 1.9 ? 'bad' : '']);
          o.res = t > 1.9 ? ['PedidoCriado on p0, PedidoPago on p3', 'different consumers: no order'] : [];
          if (t > 2.2) { T(o, [cellX('s0', c0, 0), R6Y(0) + 2, 40], 'created: p0', 'bad'); T(o, [cellX('s3', c3, 0), R6Y(3) + 2, 40], 'paid: p3', 'bad'); } } },
    ],
    lab: [
      { id: 'compose', dur: 6, title: 'The lab: 1 broker, and pedidos with 1 partition', yk: 'IN THE TERMINAL · kafka/',
        code: ['$ docker compose up -d', '# confluentinc/cp-kafka:7.5.0, KRaft, 1 node', '# 9092 and 9093 · kafka-ui at localhost:8080', 'KAFKA_LOG_RETENTION_HOURS: 168', '# pedidos is created on the 1st send (auto-create)', '# num.partitions = 1 → 1 partition'],
        story: 'The author\'s lab starts a single-node Kafka, in KRaft mode (no ZooKeeper), and kafka-ui on port 8080. The pedidos topic is not created by hand: it is born on the first send, with the default of 1 partition and replication factor 1. So there are no partitions to see here and no replicas to kill.',
        look: 'A single broker in front; a single track, pedidos; on the right, kafka-ui.',
        key: 'The lab shows producer, consumer and group; partitions and replicas stay with the story.',
        f(o, t) { o.on.b0 = 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 node', parts: [['p0', 'leader', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['factor 1: no copy', 'bad'] };
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells: t > 1 ? [ev(0, 'PEDIDO-00001', 'acc')] : [] }; if (t > 1) o.on.r0 = 1;
          o.rows.prod = grp('producer', 'main.go', ['sarama', 'dim'], ['topic: pedidos', 'acc'], ['auto-create', 'dim']); o.on.prod = 2;
          o.on.side = 1; o.rows.side = grp('kafka-ui', ':8080', ['pedidos · 1 partition', 'acc'], ['replication factor 1', 'dim']);
          send(o, t, 0.2, 'r0', [ev(0, '')], 0);
          o.cnt = C3(['BROKERS', '1'], ['PARTITIONS OF pedidos', '1'], ['REPLICAS', '1']);
          o.res = ['1 node · 1 partition · factor 1'];
          if (t > 1.4) T(o, SPOT.r(0), 'num.partitions = 1'); } },
      { id: 'particionado', dur: 6, title: 'pedidos-particionados: 3 partitions', yk: 'IN THE TERMINAL · partition_key/setup.sh',
        code: ['kafka-topics --create \\', '  --topic pedidos-particionados \\', '  --partitions 3 --replication-factor 1', '# producer: NewHashPartitioner, key = cliente_id', '# SequenciaCliente proves each client\'s order'],
        story: 'To see partitions, the lab has the partition_key folder: setup.sh creates pedidos-particionados with 3 partitions, still with factor 1, because there is only one broker. The producer uses the cliente_id key and numbers each client\'s sequence, to show that it comes out in order.',
        look: '3 tracks appear, all led by the same single broker.',
        key: 'In the lab, the key is cliente_id; in the store, pedido_id: the key chooses what stays in order.',
        f(o, t) { for (let i = 1; i < 3; i++) o.show['r' + i] = t > 0.5 ? 1 : 0;
          o.on.b0 = 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 node', parts: [['p0', 'leader', '', 'acc'], ['p1', 'leader', '', 'acc'], ['p2', 'leader', '', 'acc']], foot: ['factor 1: no copy', 'bad'] };
          for (let i = 0; i < 3; i++) { o.rows['r' + i] = { name: 'p' + i, meta: 'partitioned', cells: [] }; if (t > 0.8 + i * 0.3) o.on['r' + i] = 1; }
          o.rows.prod = grp('producer', 'partition_key', ['key: cliente_id', 'acc'], ['NewHashPartitioner', 'dim'], ['SequenciaCliente', 'dim']); o.on.prod = 1;
          o.on.side = 2; o.rows.side = grp('kafka-ui', ':8080', ['pedidos-particionados', 'acc'], ['3 partitions · factor 1', 'dim']);
          o.cnt = C3(['TOPIC', 'pedidos-particionados'], ['PARTITIONS', '3'], ['REPLICAS', '1']);
          o.res = ['3 partitions, all on the same broker'];
          if (t > 1.6) T(o, SPOT.b(0), 'one broker: leader of everything'); } },
      { id: 'producer', dur: 7, title: 'The lab producer and the lag that grows', yk: 'IN THE CODE · producer/main.go',
        code: ['config.Producer.RequiredAcks = sarama.WaitForAll', 'config.Producer.Retry.Max = 5', 'config.Producer.Compression = sarama.CompressionSnappy', '// key = pedido.ID ("PEDIDO-00001"…), 1 ms ticker', 'log: Partition: 0 | Offset: N', '// faturamento: time.Sleep(100ms) → 10 events/s'],
        story: 'The lab producer waits for all replicas (WaitForAll, the acks=all), retries up to 5 times and compresses with Snappy. It tries to send one event per millisecond, with key PEDIDO-00001, PEDIDO-00002…; the synchronous send slows it a little. On the other side, the faturamento consumer sleeps 100 ms per event: 10 per second. kafka-ui shows the LAG column climbing.',
        look: 'The pedidos offsets run; the faturamento-consumer-group pointer moves slowly and the gap turns red.',
        key: 'Fast producer, slow consumer: the lag shows up in kafka-ui.',
        f(o, t) { const s = Math.max(0, t - 0.5), rd = Math.floor(s * 10), lag = Math.floor(s * 1000) - rd;
          o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 node', parts: [['p0', 'leader', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['pedidos · 1 partition', 'dim'] }; o.on.b0 = 2;
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells: [ev(rd, 'faturamento', 'acc'), gap('lag'), ev(Math.floor(s * 1000), 'end of log', 'bad')] }; o.on.r0 = 1;
          o.show.g0 = o.show.g1 = 1; o.on.g0 = 1; o.on.g1 = 'bad';
          o.rows.g0 = grp('estoque-consumer-group', '', ['keeps up with the end', 'acc']); o.rows.g1 = grp('faturamento-consumer-group', '', ['100 ms per event', 'bad'], ['LAG growing', 'bad']);
          pointer(o, cy('g0'), 'r0', cellX('r0', o.rows.r0.cells, 2), 0, ''); pointer(o, cy('g1'), 'r0', cellX('r0', o.rows.r0.cells, 0), 4, 'bad');
          o.rows.prod = grp('producer', 'main.go', ['WaitForAll · Retry 5', 'acc'], [`PEDIDO-${String(Math.floor(s * 1000) + 1).padStart(5, '0')}`, 'acc'], ['ticker: 1 ms', 'dim']); o.on.prod = 1;
          lit(o, toRail('r0', cellX('r0', o.rows.r0.cells, 2)), '', (t * 1.6) % 1);
          o.on.side = 'bad'; o.rows.side = grp('kafka-ui', ':8080', ['faturamento: LAG ↑', 'bad'], ['estoque: LAG ≈ 0', 'dim']);
          o.cnt = C3(['PRODUCER', 'up to 1 per ms'], ['FATURAMENTO', '10 events/s', 'bad'], ['LAG', 'grows', 'bad']);
          o.res = ['Partition: 0 | Offset: …', 'faturamento falls behind'];
          if (t > 1.6) T(o, SPOT.g(1), 'LAG grows', 'bad'); } },
      { id: 'duplicados', dur: 8, title: 'What if it goes wrong: it dies before the commit', yk: 'IN THE CODE · consumer_faturamento',
        code: ['config.Consumer.Offsets.AutoCommit.Interval = 1 * time.Second', '// processes, MarkMessage, and the commit goes out every 1 s', '// dies between processing and the commit:', '//   restarts from the last stored offset', '//   reprocesses up to 1 s = ~10 events (100 ms each)', '// fix: idempotency by evento_id or manual commit'],
        story: 'faturamento marks each event after processing it, but the offset commit only goes to Kafka every 1 s. If it dies in the middle of that second, it restarts from the last stored offset and processes again what it had already done: up to 10 events, at 100 ms each. This is at-least-once delivery. The fix is to make processing idempotent by evento_id (the repeated e-502 from module 6) or to store the commit together with the result.',
        look: 'Ten cells light up as done; the consumer dies; the same ten come back red.',
        key: 'At-least-once: dying before the commit = reprocessing; the consumer needs to be idempotent.',
        f(o, t) { const n = Math.min(10, Math.floor(Math.max(0, t - 0.4) / 0.25)), down = t > 3.2, again = t > 4.4;
          o.show.g1 = 1; o.on.g1 = down && !again ? 'bad' : 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 node', parts: [['p0', 'leader', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['saved commit: o', 'dim'] }; o.on.b0 = 2;
          const cells = [ev('o', 'last commit', 'acc'), ...Array.from({ length: 10 }, (_, i) => ev(`o+${i + 1}`, i < n ? (again ? 'again' : 'done') : '', again && i < n ? 'bad' : i < n ? 'acc' : 'dim'))];
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells }; o.on.r0 = again ? 'bad' : 1;
          const at = again ? Math.min(10, Math.floor((t - 4.4) / 0.25)) : n;
          o.rows.g1 = grp('faturamento-consumer-group', '', [down && !again ? 'down' : again ? 'back from commit' : `processed ${n}`, down ? 'bad' : 'acc'], [`no commit: ${n}`, n ? 'bad' : 'dim']);
          if (!down || again) pointer(o, cy('g1'), 'r0', cellX('r0', cells, at), 4, again ? 'bad' : '');
          o.on.side = again ? 'bad' : 2; o.rows.side = grp('faturamento', 'result', [again ? `${at} events twice` : `${n} events billed`, again ? 'bad' : 'acc'], ['commit every 1 s', 'dim']);
          o.cnt = C3(['NO COMMIT', String(n), n ? 'bad' : ''], ['CONSUMER', down && !again ? 'down' : again ? 'back' : 'up', down ? 'bad' : ''], ['DUPLICATES', again ? String(at) : '0', again ? 'bad' : '']);
          o.res = again ? [`${at} events processed again`, 'fix: idempotency by evento_id'] : down ? ['went down before the 1 s commit'] : [];
          if (again) T(o, SPOT.r(0), 'same events, again', 'bad'); } },
      { id: 'fnv', dur: 8, title: 'What if it goes wrong: FNV in Go, murmur2 in Java', yk: 'THE MATH · same key, two clients',
        code: ['key    Java murmur2  sarama FNV-1a', '1049   p0            p2', '1050   p2            p0', '1051   p0            p2', '// sarama: NewHashPartitioner uses FNV-1a', '// to match Java: your own murmur2 hasher'],
        story: 'The NewHashPartitioner in sarama, the lab\'s Go client, does not use the Java client\'s murmur2: it uses FNV-1a. The same key lands on different partitions. With 3 partitions, 1051 goes to p0 in Java and to p2 in Go. If pedidos publishes in Java and estoque in Go, the events of 1051 end up in two partitions and lose their order. sarama does not ship a ready-made murmur2 partitioner (I checked the package: v1.42.1 and v1.46.3); to match Java you have to pass your own murmur2 hasher.',
        look: 'Two tokens with key 1051: the Java one lands on p0, the Go one lands on p2, in red.',
        key: 'The partition depends on the client\'s hash: mix clients only if they use the same partitioner.',
        f(o, t) { for (let i = 1; i < 3; i++) o.show['r' + i] = 1;
          o.on.b0 = 2; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 node', parts: [['p0', 'leader', '', 'acc'], ['p1', 'leader', '', 'acc'], ['p2', 'leader', '', 'acc']], foot: ['3 partitions', 'dim'] };
          const c0 = [ev('1051', 'Java · murmur2', 'acc')], c2 = [ev('1051', 'Go · FNV-1a', 'bad')];
          for (let i = 0; i < 3; i++) o.rows['r' + i] = { name: 'p' + i, meta: '', cells: [] };
          send(o, t, 0.4, 'r0', c0, 0); send(o, t, 1.8, 'r2', c2, 0, 'bad');
          if (t > 1.5) { o.rows.r0.cells = c0; o.on.r0 = 1; } if (t > 2.9) { o.rows.r2.cells = c2; o.on.r2 = 'bad'; }
          o.rows.prod = grp('key 1051', '2 clients', ['Java: murmur2 → p0', 'acc'], ['Go: FNV-1a → p2', t > 1.8 ? 'bad' : 'dim'], ['same key, 2 tracks', t > 2.9 ? 'bad' : 'dim']); o.on.prod = t > 2.9 ? 'bad' : 1;
          o.on.side = 2; o.rows.side = grp('sarama', 'partitioner.go', ['NewHashPartitioner: FNV', 'bad'], ['murmur2: custom hasher', 'acc']);
          o.cnt = C3(['KEY', '1051'], ['JAVA', 'p0'], ['GO (sarama)', t > 1.8 ? 'p2' : '…', 'bad']);
          o.res = t > 2.9 ? ['1051 on p0 and on p2', 'event order broken'] : [];
          if (t > 3) T(o, SPOT.r(2), 'Go: 1051 → p2', 'bad'); } },
    ],
  };
  // vigas entre brokers (cópia do líder ao seguidor) e do produtor ao líder
  const BC = i => BXB(i) + 20;   // centro da célula p0 dentro do broker
  function repl(a, b) { const y = BY + 30; return [[BC(a), y, ZB], [BC(a), y, ZB + 16], [BC(b), y, ZB + 16], [BC(b), y, ZB]]; }
  const ackPath = () => [[BC(0), BY, ZB], [BC(0), 336, ZB + 4], [PCX, 336, ZB + 4], [PCX, 316, ZB]];
  function prodToLeader(o, t, t0) { o.on.prod = 1; if (t < t0) return; const f = clamp((t - t0) / 0.7), pts = [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(0), 392, ZB]];
    lit(o, pts, '', f); if (f < 1) o.tok.push({ p: alongPts(pts, cumLen(pts), f) }); }
  function brokersWith(o, have, off) { for (let i = 0; i < 3; i++) { o.rows['b' + i] = brk(i, roles(i), 'ISR in sync', 'dim'); o.rows['b' + i].parts[0][2] = have[i] ? off + ' ✓' : ''; } }
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
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.6 : W_ - 10); x.fillText(d.name, u(5), u(8.5)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 8.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(8.5)); x.textAlign = 'left'; } }
  const cellFill = (tn, light) => tn === 'bad' ? (light ? '#f0d6d2' : '#3a1712') : tn === 'acc' ? (light ? '#f1dcc4' : '#3a2512') : light ? '#ebebea' : '#17181a';
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P, light = theme === 'light';
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, k = Bk.kind;
    if (k === 'rail' || k === 'rail6') {
      const thin = k === 'rail6', hx = HX[k];
      x.fillStyle = col; fitFont(x, u, d.name, thin ? 13 : 20, hx - 8); x.fillText(d.name, u(5), u(thin ? H_ / 2 : 18));
      if (d.meta && !thin) { x.fillStyle = INK(); fitFont(x, u, d.meta, 8, hx - 7); x.fillText(d.meta, u(5), u(34)); }
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(hx - 3), u(3)); x.lineTo(u(hx - 3), u(H_ - 3)); x.stroke();
      const y0 = thin ? 3 : 13, hh = H_ - y0 - 3, L_ = layout(k, d.cells);
      d.cells.forEach((c, i) => { const [X, w] = L_[i];
        if (c.gap) { x.textAlign = 'center'; x.fillStyle = INK(); fitFont(x, u, c.gap, thin ? 8 : 9.6, w - 2); x.fillText(c.gap, u(X + w / 2), u(y0 + hh / 2)); x.textAlign = 'left'; return; }
        const tn = c.tn;
        if (tn === 'new') { x.setLineDash([u(2), u(2)]); x.strokeStyle = C.line; x.lineWidth = u(0.6); x.strokeRect(u(X + 1.5), u(y0), u(w - 3), u(hh)); x.setLineDash([]); }
        else { x.fillStyle = cellFill(tn, light); x.fillRect(u(X + 1.5), u(y0), u(w - 3), u(hh)); x.strokeStyle = tn === 'bad' ? BAD() : tn === 'acc' ? accC() : C.line; x.lineWidth = u(tn === 'acc' || tn === 'bad' ? 1 : 0.5); x.strokeRect(u(X + 1.5), u(y0), u(w - 3), u(hh)); }
        x.textAlign = 'center'; const vc = tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'new' ? INK() : C.inkHi;
        if (thin || !c.l) { x.fillStyle = vc; fitFont(x, u, c.o, thin ? 11 : 13, w - 6); x.fillText(c.o, u(X + w / 2), u(y0 + hh / 2)); if (thin && c.l && w > 60) {} }
        else { x.fillStyle = vc; fitFont(x, u, c.o, 13, w - 6); x.fillText(c.o, u(X + w / 2), u(y0 + hh * 0.33)); x.fillStyle = tn === 'bad' ? BAD() : INK(); fitFont(x, u, c.l, 9, w - 4); x.fillText(c.l, u(X + w / 2), u(y0 + hh * 0.72)); }
        x.textAlign = 'left'; });
      if (thin) { const c = d.cells.find(c => c.l && c.o === '1051'); if (c) { const i = d.cells.indexOf(c), [X, w] = L_[i]; x.fillStyle = c.tn === 'bad' ? BAD() : INK(); fitFont(x, u, c.l, 8, 150); x.fillText(c.l, u(X + w + 4), u(H_ / 2)); } }
    }
    else if (k === 'broker') { head(x, u, d, W_, col, 13);
      const n = 3, sw = (W_ - 10) / n, y0 = 18, hh = 38;
      d.parts.forEach(([p, role, sub, tn], i) => { const X = 5 + i * sw; if (!p) return; const tone = on === 'bad' ? 'bad' : tn;
        x.fillStyle = cellFill(tone === 'bad' ? 'bad' : tone === 'acc' ? 'acc' : '', light); x.fillRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.strokeStyle = tone === 'bad' ? BAD() : tone === 'acc' ? accC() : C.line; x.lineWidth = u(tone ? 1 : 0.5); x.strokeRect(u(X + 1), u(y0), u(sw - 2), u(hh));
        x.textAlign = 'center'; x.fillStyle = tone === 'bad' ? BAD() : tone === 'acc' ? accC() : C.inkHi; fitFont(x, u, p, 13, sw - 4); x.fillText(p, u(X + sw / 2), u(y0 + 9));
        x.fillStyle = tone === 'bad' ? BAD() : INK(); fitFont(x, u, role, 8.6, sw - 4); x.fillText(role, u(X + sw / 2), u(y0 + 21));
        if (sub) { x.fillStyle = /no |ISR/.test(sub) || tone === 'bad' ? BAD() : accC(); fitFont(x, u, sub, 8.6, sw - 4); x.fillText(sub, u(X + sw / 2), u(y0 + 31)); }
        x.textAlign = 'left'; });
      const [ft, ftn] = d.foot; if (ft) { x.fillStyle = on === 'bad' ? BAD() : toneC(ftn); fitFont(x, u, ft, 10, W_ - 10); x.fillText(ft, u(5), u(H_ - 8)); } }
    else {   // svc, grp, cons: nome, meta e linhas
      const s1 = k === 'svc' ? 15 : k === 'cons' ? 10.5 : 13; head(x, u, d, W_, col, s1);
      if (k === 'svc') { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(19)); x.lineTo(u(W_ - 4), u(19)); x.stroke(); }
      let y = k === 'svc' ? 36 : k === 'cons' ? 20 : 27; const lh = k === 'svc' ? 24 : 15;
      for (const [text, tn] of d.rows || []) { if (!text) { y += lh; continue; } x.fillStyle = on === 'bad' && tn !== 'acc' ? BAD() : toneC(tn); fitFont(x, u, text, k === 'svc' ? 12.5 : k === 'cons' ? 9.4 : 11, W_ - 10); x.fillText(text, u(5), u(y)); y += lh; } }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(147)); x.stroke();
    lbl(s.yk || 'IN THE CODE', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /NotEnough|lost|broken|no slack|no order|no loss|no partition|went down|twice|again|duplic|never|without|p0 and p3|p0 and on p2|falls behind|lag |two partitions/.test(l) ? BAD() : acc; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    topico: () => `<table class="h3-sum"><tr><th>time</th><th>event of 1051</th><th>p @ offset</th></tr><tr><td>14:20:01.100</td><td>PedidoCriado · e-901</td><td>p0 @ 48210</td></tr><tr class="on"><td>14:20:03.000</td><td>PedidoPago · e-902 (72 B)</td><td>p0 @ 48213</td></tr><tr><td>14:20:03.040</td><td>EstoqueReservado · e-903</td><td>p0 @ 48217</td></tr><tr><td>15:10:00</td><td>PedidoEnviado · e-904</td><td>p0 @ 48301</td></tr></table><li>Topic <b>pedidos</b>: <b>3 partitions</b>, replication factor <b>3</b>, <b>min.insync.replicas = 2</b>, retention <b>7 days</b> (168 h)</li><li>Volume: normal day <b>20 events/s</b>; Black Friday <b>120/s</b> (40/s per partition); average event ≈ <b>100 B</b>; the 4 events of 1051 add up to <b>400 B</b> (151 + 72 + 89 + 88)</li><li>Order 1051 (Lena, Recife): 2 blue mugs 39.80 + shipping 15.00 = <b>54.80</b>; CANECA-007: <b>40 → 38</b></li>`,
    chave: () => `<li>Java client partitioner: <b>(murmur2(key) &amp; 0x7fffffff) mod number of partitions</b></li><li>Checked against Kafka's test vectors: murmur2("21") = <b>−973932308</b>; murmur2("foobar") = <b>−790332482</b></li><table class="h3-sum"><tr><th>key</th><th>murmur2</th><th>mod 3</th></tr><tr><td>1047</td><td>−29587144</td><td>p1</td></tr><tr><td>1048</td><td>1636681634</td><td>p2</td></tr><tr><td>1049</td><td>−364487243</td><td>p0</td></tr><tr><td>1050</td><td>834011288</td><td>p2</td></tr><tr class="on"><td>1051</td><td>−395860997</td><td>p0</td></tr></table><li>With no key: sticky partition per batch (KIP-480)</li>`,
    grupos: () => `<table class="h3-sum"><tr><th>group</th><th>CURRENT</th><th>LAG</th></tr><tr><td>estoque</td><td>48220</td><td>0</td></tr><tr><td>notificacoes</td><td>48219</td><td>1</td></tr><tr class="on"><td>entregas</td><td>48210</td><td>10</td></tr></table><li>p0 with <b>LOG-END-OFFSET 48220</b>; entregas at <b>100 ms</b> per event = <b>10/s</b></li><li>Useful consumers in a group ≤ number of partitions: entregas with <b>5</b> replicas and <b>3</b> partitions = <b>2 idle</b></li>`,
    replicas: () => `<li>3 brokers <b>kafka-1, kafka-2, kafka-3</b> (ids 1, 2, 3), KRaft (no ZooKeeper)</li><li><b>acks</b>: 0 (does not wait), 1 (leader only), <b>all</b> (the ISR; default since Kafka 3.0, with enable.idempotence = true)</li><li>Copy to the follower ≈ <b>10 ms</b>; with acks=1 the leader dies at <b>5 ms</b>: the PedidoPago (p0 @ 48213) is lost</li><li>2 brokers down: ISR = {3} &lt; 2 → <b>NotEnoughReplicas</b>; leader election in up to about <b>9 s</b> (example: <b>broker.session.timeout.ms = 9000</b>, the default in KRaft)</li>`,
    particoes: () => `<li>entregas: <b>30</b> EstoqueReservado/s ÷ 3 consumers = <b>10/s</b> each = the 100 ms per event limit</li><table class="h3-sum"><tr><th>key</th><th>mod 3</th><th>mod 6</th></tr><tr><td>1047</td><td>p1</td><td>p4</td></tr><tr><td>1048</td><td>p2</td><td>p2</td></tr><tr><td>1049</td><td>p0</td><td>p3</td></tr><tr><td>1050</td><td>p2</td><td>p2</td></tr><tr class="on"><td>1051</td><td>p0</td><td>p3</td></tr></table><li>A topic's number of partitions only goes up</li>`,
    lab: () => `<li><b>cp-kafka 7.5.0</b>, KRaft, 1 node, ports 9092/9093; <b>kafka-ui</b> at localhost:8080; Go client <b>IBM/sarama</b></li><li>pedidos created automatically with <b>1 partition</b> (num.partitions = 1); <b>pedidos-particionados</b>: 3 partitions, factor 1</li><li>Producer: <b>WaitForAll</b>, Retry.Max <b>5</b>, Snappy, key PEDIDO-00001…; faturamento: <b>100 ms</b> per event, auto-commit every <b>1 s</b></li><table class="h3-sum"><tr><th>key</th><th>Java (murmur2)</th><th>sarama (FNV-1a)</th></tr><tr><td>1049</td><td>p0</td><td>p2</td></tr><tr><td>1050</td><td>p2</td><td>p0</td></tr><tr class="on"><td>1051</td><td>p0</td><td>p2</td></tr></table>`,
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
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'In the code')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'kafka') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'kafka' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-kafka3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'kafka') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, Bk.z0 - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? (Bk.kind === 'rail' || Bk.kind === 'rail6' ? 0.3 : 0.5) : on === 2 ? 0.12 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.kind === 'broker' ? 0.8 : 0); });
    setBeams(o.beams); setTokens(o.tok); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('k3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-10, 812, 8, 455];
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
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–6 · drag to rotate' };
})() });
