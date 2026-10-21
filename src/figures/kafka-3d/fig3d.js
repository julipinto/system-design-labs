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
  const mil = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['topico', 'chave', 'grupos', 'replicas', 'particoes', 'lab'];
  const SCNAME = { topico: 'Tópico', chave: 'Chave', grupos: 'Grupos', replicas: 'Réplicas', particoes: 'Partições', lab: 'Lab' };
  const SCFULL = { topico: 'O log do tópico pedidos', chave: 'A chave decide a partição', grupos: 'Grupos de consumo e lag',
    replicas: 'Líder, seguidores e acks', particoes: 'De 3 para 6 partições', lab: 'O lab: 1 broker, sarama' };
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
  const p0window = (lo = 48210, hi = 48219) => [...Array.from({ length: hi - lo + 1 }, (_, i) => ev(lo + i, lo + i === 48213 ? 'PedidoPago' : '', 'dim')), { o: String(hi + 1), l: 'próximo', tn: 'new' }];

  // ── conteúdo padrão dos blocos ──
  const grp = (name, meta, ...rows) => ({ name, meta, rows });
  const brk = (i, parts, foot = '', ftn = 'dim', meta) => ({ name: `kafka-${i + 1}`, meta: meta || `id ${i + 1}`, parts, foot: [foot, ftn] });
  const LEAD = [0, 1, 2];   // líder de cada partição: p0 → kafka-1, p1 → kafka-2, p2 → kafka-3
  const roles = i => [0, 1, 2].map(p => [`p${p}`, LEAD[p] === i ? 'líder' : 'seguidor', '', LEAD[p] === i ? 'acc' : '']);
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
    o.rows.prod = grp('pedidos', 'produtor', ['chave: pedido_id', 'dim'], ['acks = all', 'dim'], ['tópico: pedidos', 'dim']);
    for (let i = 0; i < 3; i++) o.rows['r' + i] = { name: 'p' + i, meta: `líder ${i + 1}`, cells: [] };
    for (let i = 0; i < 6; i++) o.rows['s' + i] = { name: 'p' + i, cells: [] };
    o.rows.g0 = grp('estoque', 'grupo', ['ouve PedidoPago', 'dim']); o.rows.g1 = grp('entregas', 'grupo', ['ouve EstoqueReservado', 'dim']);
    o.rows.g2 = grp('notificacoes', 'grupo', ['ouve PedidoCriado', 'dim']);
    for (let i = 0; i < 6; i++) o.rows['k' + i] = grp(`entregas-${i + 1}`, '', ['sem partição', 'dim']);
    for (let i = 0; i < 3; i++) o.rows['b' + i] = brk(i, roles(i), 'ISR em dia', 'dim');
    o.rows.side = grp('antifraude', 'grupo novo', ['ainda não existe', 'dim']);
    if (sc === 'chave') o.rows.prod = grp('pedidos', 'produtor', ['chave: pedido_id', 'dim'], ['murmur2(chave)', 'dim'], ['mod 3 = partição', 'dim']);
    return o;
  }
  // o tópico de pé: brokers ligados, trilhos com os pedidos de outras chaves (1047 na p1; 1048 e 1050 na p2)
  const others = { 1: [ev('1047', 'outro pedido', 'dim')], 2: [ev('1048', 'outro pedido', 'dim'), ev('1050', 'outro pedido', 'dim')] };
  function standing(o) { o.rows.r1.cells = others[1]; o.rows.r2.cells = others[2]; }

  const STEPS = {
    topico: [
      { id: 'topico', dur: 5, title: 'O tópico pedidos: 3 partições', yk: 'NO TERMINAL',
        code: ['$ kafka-topics --describe --topic pedidos', 'Topic: pedidos  PartitionCount: 3  ReplicationFactor: 3', '  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3', '  Partition: 1  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1', '  Partition: 2  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2', '# retenção: 168 h = 7 dias'],
        story: 'O módulo 12 parou no PedidoPago do 1050, que precisava chegar ao estoque, às entregas e às notificações sem o pagamento esperar os três. O lugar por onde esses eventos viajam é o tópico pedidos: um log onde só se acrescenta no fim, dividido em 3 partições, guardado nos 3 brokers por 7 dias.',
        look: 'Os 3 trilhos p0, p1 e p2 acendem um a um; na frente, os brokers kafka-1, kafka-2 e kafka-3, cada um líder de uma partição.',
        key: 'Tópico: um log de só-acréscimo, dividido em partições e copiado entre brokers.',
        f(o, t) { for (let i = 0; i < 3; i++) if (t > 0.4 + i * 0.5) { o.on['r' + i] = 1; o.on['b' + i] = 2; }
          o.cnt = C3(['TÓPICO', 'pedidos'], ['PARTIÇÕES', '3 (p0, p1, p2)'], ['RETENÇÃO', '7 dias']);
          o.res = ['3 partições · fator de replicação 3', 'min.insync.replicas = 2'];
          if (t > 1.8) T(o, SPOT.r(0), 'partição = trilho do log'); if (t > 2.6) T(o, SPOT.b(0), 'cada broker lidera 1 partição'); } },
      { id: 'criado', dur: 5.5, title: 'PedidoCriado entra na p0 @ 48210', yk: 'O EVENTO · 14:20:01.100',
        code: ['chave: "1051"', 'valor: PedidoCriado {', '  evento_id: "e-901", pedido_id: 1051, cliente: "Lena",', '  itens: [{ produto: 7, qtd: 2, preco: 19.90 }],', '  frete: 15.00, total: 54.80 }', '→ partição 0, offset 48210'],
        story: 'Às 14:20:01.100 a Lena fecha o pedido 1051: 2 canecas azuis (39,80) e o frete de Recife (15,00), total 54,80. O serviço pedidos publica PedidoCriado com a chave 1051. A chave manda o evento para a p0, e o broker dá a ele a próxima posição livre do log: o offset 48210.',
        look: 'A ficha sai do produtor, corre pelo trilho p0 e vira a célula 48210.',
        key: 'Offset: a posição de cada evento dentro da partição; só cresce.',
        f(o, t) { standing(o); o.on.prod = 1; const c = p0of1051(t > 1.6 ? 1 : 0), all = p0of1051(1); o.rows.r0.cells = c;
          send(o, t, 0.4, 'r0', all, 0); if (t > 1.6) o.on.r0 = 1;
          o.rows.prod = grp('pedidos', 'produtor', ['chave: 1051', 'acc'], ['PedidoCriado · e-901', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['CHAVE', '1051'], ['PARTIÇÃO', 'p0'], ['OFFSET', t > 1.6 ? '48210' : '…']);
          o.res = t > 1.6 ? ['p0 @ 48210 · 14:20:01.100'] : [];
          if (t > 1.8) T(o, [cellX('r0', c, 0), RY(0) + 4, 44], 'p0 @ 48210'); } },
      { id: 'pago', dur: 5.5, title: 'PedidoPago: p0 @ 48213', yk: 'O EVENTO · 14:20:03.000',
        code: ['chave: "1051"', 'valor: PedidoPago {', '  evento_id: "e-902", pedido_id: 1051, valor: 54.80 }', '# 72 bytes', '→ partição 0, offset 48213', '# 48211 e 48212: outros pedidos na p0'],
        story: 'Às 14:20:03.000 o Pix da Lena é confirmado e sai o PedidoPago, 72 bytes. Mesma chave, mesma partição: p0. Só que entre os dois eventos dela caíram dois de outros pedidos na p0, então o PedidoPago fica no offset 48213.',
        look: 'A segunda ficha para depois de um vão com +2 outros: a célula 48213 acende.',
        key: 'Mesma chave, mesma partição: os eventos de um pedido ficam em ordem.',
        f(o, t) { standing(o); o.on.prod = 1; o.on.r0 = 1; const all = p0of1051(2); o.rows.r0.cells = t > 1.6 ? all : p0of1051(1);
          send(o, t, 0.4, 'r0', all, 2);
          o.rows.prod = grp('pedidos', 'produtor', ['chave: 1051', 'acc'], ['PedidoPago · e-902', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['CHAVE', '1051'], ['PARTIÇÃO', 'p0'], ['OFFSET', t > 1.6 ? '48213' : '48210']);
          o.res = t > 1.6 ? ['p0 @ 48213 · 14:20:03.000', '48211 e 48212: outros pedidos'] : [];
          if (t > 1.8) T(o, [cellX('r0', all, 2), RY(0) + 4, 44], 'p0 @ 48213'); } },
      { id: 'reservado', dur: 6, title: 'O estoque reage: EstoqueReservado @ 48217', yk: 'O EVENTO · 14:20:03.040',
        code: ['# o estoque leu o PedidoPago e baixou 40 → 38', 'chave: "1051"', 'valor: EstoqueReservado {', '  evento_id: "e-903", sku: "CANECA-007",', '  antes: 40, depois: 38 }', '→ partição 0, offset 48217'],
        story: 'O grupo estoque lê o PedidoPago, baixa as 2 canecas com o mesmo UPDATE com trava do módulo 11 (40 → 38) e publica EstoqueReservado com a mesma chave 1051. Quarenta milissegundos depois do pagamento, o evento entra no offset 48217.',
        look: 'O grupo estoque acende e manda a ficha de volta para o trilho p0; a célula 48217 acende.',
        key: 'Quem consome também produz: o estoque reage ao PedidoPago com outro evento.',
        f(o, t) { standing(o); o.on.r0 = 1; const all = p0of1051(3); o.rows.r0.cells = t > 2.2 ? all : p0of1051(2);
          if (t > 0.3) { o.on.g0 = 1; pointer(o, cy('g0'), 'r0', cellX('r0', all, 2), 0, '', t < 1.3 ? (t - 0.3) : null); }
          o.rows.g0 = grp('estoque', 'grupo', ['leu p0 @ 48213', 'acc'], [t > 1.2 ? 'CANECA-007: 40 → 38' : 'baixando…', 'acc']);
          if (t > 1.2 && t < 2.2) { const f = ease(clamp((t - 1.2) / 1)), x1 = cellX('r0', all, 4); o.tok.push({ p: [lerp(GX, x1, f), cy('r0'), TOP('r0') + 1] }); lit(o, [[GX, cy('r0'), TOP('r0') + 3], [x1, cy('r0'), TOP('r0') + 3]], '', f); }
          o.cnt = C3(['ESTOQUE CANECA-007', t > 1.2 ? '40 → 38' : '40'], ['PARTIÇÃO', 'p0'], ['OFFSET', t > 2.2 ? '48217' : '48213']);
          o.res = t > 2.2 ? ['p0 @ 48217 · 14:20:03.040', 'CANECA-007: 40 → 38'] : [];
          if (t > 2.4) T(o, [cellX('r0', all, 4), RY(0) + 4, 44], 'p0 @ 48217'); } },
      { id: 'enviado', dur: 5.5, title: 'PedidoEnviado @ 48301: a história em ordem', yk: 'O EVENTO · 15:10:00',
        code: ['chave: "1051"', 'valor: PedidoEnviado {', '  evento_id: "e-904", pedido_id: 1051,', '  rastreio: "LA123456790BR" }', '→ partição 0, offset 48301', '# 48218 a 48300: 83 eventos de outros pedidos'],
        story: 'Às 15:10 as canecas saem com o rastreio LA123456790BR, e o PedidoEnviado vai para o offset 48301. Os quatro eventos do 1051 estão na p0, na ordem em que aconteceram, com eventos de outros pedidos no meio. Quem ler a p0 do começo ao fim vê a história da Lena na ordem certa.',
        look: 'A quarta célula, 48301, acende no fim do trilho p0; as quatro do 1051 ficam acesas.',
        key: 'A ordem vale dentro da partição: 48210 < 48213 < 48217 < 48301.',
        f(o, t) { standing(o); o.on.prod = 1; o.on.r0 = 1; const all = p0of1051(4); o.rows.r0.cells = t > 1.6 ? all : p0of1051(3);
          send(o, t, 0.4, 'r0', all, 6);
          o.rows.prod = grp('pedidos', 'produtor', ['chave: 1051', 'acc'], ['PedidoEnviado · e-904', 'acc'], ['→ p0', 'acc']);
          o.cnt = C3(['EVENTOS DO 1051', t > 1.6 ? '4' : '3'], ['PARTIÇÃO', 'p0'], ['OFFSETS', t > 1.6 ? '48210 → 48301' : '48210 → 48217']);
          o.res = t > 1.6 ? ['p0 @ 48301 · 15:10:00', 'e-901 → e-904, em ordem'] : [];
          if (t > 1.8) T(o, [cellX('r0', all, 6), RY(0) + 4, 44], 'p0 @ 48301'); } },
      { id: 'replay', dur: 6.5, title: 'O log guarda: um grupo novo relê do começo', yk: 'NO CÓDIGO · consumidor',
        code: ['# fila: a mensagem some quando alguém confirma', '# log: o evento fica 7 dias, leu ou não', 'group.id = antifraude   # grupo novo', 'auto.offset.reset = earliest', '# (no lab: sarama.OffsetOldest)', '→ lê do primeiro offset guardado'],
        story: 'Numa fila, a mensagem some quando alguém confirma. O log não apaga ao ler: os eventos ficam 7 dias. Por isso um grupo que nasce hoje, o antifraude, pode começar do primeiro offset guardado e passar pelos cerca de 48 mil eventos do dia. Os outros grupos nem percebem.',
        look: 'O bloco antifraude sobe na frente; o ponteiro dele parte do começo da p0 e corre até o fim.',
        key: 'O log é relido; a fila é consumida.',
        f(o, t) { standing(o); o.on.r0 = 1; o.show.side = 1; o.on.side = t > 0.6 ? 1 : 2; const all = p0of1051(4); o.rows.r0.cells = all;
          const f = clamp((t - 1) / 3.6), n = Math.round(f * 48301);
          if (t > 1) { const x1 = lerp(RX + 50, cellX('r0', all, 6), f); lit(o, [[(GX + GW / 2), BY, TOP('side') + 6], [(GX + GW / 2), 330, TOP('side') + 6], [x1, 330, TOP('r0') + 6], [x1, RY(0) + 8, TOP('r0') + 2]], '', null, true);
            o.tok.push({ p: [x1, RY(0) + 8, TOP('r0') + 2], s: 0.6 }); }
          o.rows.side = grp('antifraude', 'grupo novo', ['earliest: do 1º offset', 'acc'], [`lidos até ${mil(n)}`, f >= 1 ? 'acc' : 'dim']);
          o.cnt = C3(['ANTIFRAUDE LEU', `${mil(n)} eventos`], ['RETENÇÃO', '7 dias'], ['OUTROS GRUPOS', 'intactos']);
          o.res = f >= 1 ? ['antifraude chegou ao fim da p0', 'o log não apagou nada'] : t > 1 ? ['relendo a p0 do começo'] : [];
          if (t > 1.4) T(o, SPOT.side, 'grupo novo: lê do começo'); } },
      { id: 'lag', dur: 7, title: 'E se der errado: o consumidor fica para trás', yk: 'A CONTA',
        code: ['# Black Friday: 120 eventos/s = 40/s por partição', '# consumidor que gasta 100 ms por evento:', '#   1000 ÷ 100 = 10 eventos/s', 'lag cresce 40 − 10 = 30 por segundo', '         = 1.800 por minuto', '# lag = último offset − offset do grupo'],
        story: 'Na Black Friday chegam 120 eventos por segundo, 40 em cada partição. Um consumidor que gasta 100 ms por evento lê 10 por segundo. A diferença vira lag, a distância entre o fim do log e o ponteiro do grupo: cresce 30 por segundo, 1.800 por minuto, sem parar. A aula 5 mostra o que fazer.',
        look: 'O fim da p0 foge para a direita; o ponteiro do grupo anda devagar e o vão entre os dois fica vermelho.',
        key: 'Lag é a distância entre o último offset e o do grupo; se só cresce, falta capacidade.',
        f(o, t) { standing(o); o.on.r0 = 'bad'; o.on.prod = 1; const s = clamp((t - 0.6) / 5) * 60, end = Math.round(s * 40), rd = Math.round(s * 10), lag = end - rd;
          o.rows.r0.cells = [ev(`+${mil(rd)}`, 'grupo aqui', 'acc'), gap(`lag ${mil(lag)}`), ev(`+${mil(end)}`, 'fim do log', 'bad')];
          o.rows.r0.meta = '40/s';
          o.on.g1 = 'bad'; o.rows.g1 = grp('entregas', 'grupo', ['100 ms por evento: 10/s', 'bad'], [`LAG ${mil(lag)}`, 'bad']);
          pointer(o, cy('g1'), 'r0', cellX('r0', o.rows.r0.cells, 0), 4, 'bad');
          if (t > 0.6 && s < 60) { const f = (t * 1.4) % 1; lit(o, toRail('r0', cellX('r0', o.rows.r0.cells, 2)), '', f); }
          o.cnt = C3(['LAG', mil(lag), 'bad'], ['CHEGAM', '40/s na p0'], ['SAEM', '10/s', 'bad']);
          o.res = [`após ${Math.round(s)} s: lag ${mil(lag)}`, '+30 por segundo, 1.800 por minuto'];
          if (t > 1.6) T(o, SPOT.r(0), 'o lag só cresce', 'bad'); } },
    ],
    chave: [
      { id: 'hash', dur: 6, title: 'A chave 1051 cai na p0', yk: 'NO CÓDIGO · particionador (Java)',
        code: ['h = murmur2(bytes("1051"))', '  = -395860997', 'positivo: h & 0x7fffffff', '  = 1751622651', '1751622651 mod 3 = 0', '→ partição 0'],
        story: 'Quem escolhe a partição é o produtor, não o broker. O cliente Java passa os bytes da chave pelo murmur2, tira o sinal (& 0x7fffffff) e divide pelo número de partições: o resto é a partição. Para a chave 1051, o hash dá −395.860.997, positivo 1.751.622.651, e o resto da divisão por 3 é 0.',
        look: 'O produtor mostra a conta linha a linha; a ficha do 1051 corre para a p0.',
        key: 'partição = murmur2(chave) mod nº de partições: a mesma chave cai sempre no mesmo lugar.',
        f(o, t) { standing(o); o.rows.r1.cells = []; o.rows.r2.cells = []; o.on.prod = 1; const c = [ev('1051', 'PedidoCriado')];
          const ln = [['chave: 1051', 'acc'], ['murmur2 = -395860997', t > 0.8 ? 'acc' : 'dim'], ['& 0x7fffffff = 1751622651', t > 1.6 ? 'acc' : 'dim'], ['mod 3 = 0 → p0', t > 2.4 ? 'acc' : 'dim']];
          o.rows.prod = grp('pedidos', 'produtor', ...ln.slice(0, 1 + Math.min(3, Math.floor(t / 0.8))));
          send(o, t, 2.6, 'r0', c, 0); if (t > 3.7) { o.rows.r0.cells = c; o.on.r0 = 1; }
          o.cnt = C3(['CHAVE', '1051'], ['MURMUR2', t > 0.8 ? '-395860997' : '…'], ['PARTIÇÃO', t > 2.4 ? 'p0' : '…']);
          o.res = t > 2.4 ? ['1751622651 mod 3 = 0', '1051 → p0'] : [];
          if (t > 3.8) T(o, SPOT.r(0), '1051 → p0'); } },
      { id: 'cinco', dur: 8, title: 'Cinco pedidos, três trilhos', yk: 'NO CÓDIGO · murmur2 mod 3',
        code: ['chave  murmur2 positivo  mod 3', '1047   2117896504        1 → p1', '1048   1636681634        2 → p2', '1049   1782996405        0 → p0', '1050    834011288        2 → p2', '1051   1751622651        0 → p0'],
        story: 'Os pedidos 1047 a 1051 passam pela mesma conta. O 1047 vai para a p1; o 1048 e o 1050, para a p2; o 1049 e o 1051, para a p0. O espalhamento não segue a ordem dos números, e é isso que divide a carga entre as partições.',
        look: 'Cinco fichas saem do produtor, uma por vez, e cada uma cai no trilho que a conta mandou.',
        key: 'O hash espalha as chaves; a mesma chave nunca muda de trilho (enquanto o nº de partições não muda).',
        f(o, t) { o.on.prod = 1; const K = [[1047, 1], [1048, 2], [1049, 0], [1050, 2], [1051, 0]], cells = { 0: [], 1: [], 2: [] }, final = { 0: [], 1: [], 2: [] };
          K.forEach(([k, p]) => final[p].push(ev(k, 'pedido ' + k)));
          let cur_ = null;
          K.forEach(([k, p], i) => { const t0 = 0.4 + i * 1.2, idx = final[p].findIndex(c => c.o === String(k));
            if (t > t0 + 1) { cells[p].push(final[p][idx]); } else if (t >= t0) cur_ = [k, p]; send(o, t, t0, 'r' + p, final[p], idx); });
          for (let p = 0; p < 3; p++) { o.rows['r' + p].cells = cells[p]; if (cells[p].length) o.on['r' + p] = 1; }
          o.rows.prod = grp('pedidos', 'produtor', ['chave: ' + (cur_ ? cur_[0] : '…'), 'acc'], ['murmur2(chave) mod 3', 'dim'], [cur_ ? `→ p${cur_[1]}` : '', 'acc']);
          const n = cells[0].length + cells[1].length + cells[2].length;
          o.cnt = C3(['PEDIDOS', `${n} de 5`], ['p0 · p1 · p2', `${cells[0].length} · ${cells[1].length} · ${cells[2].length}`], ['ÚLTIMA', cur_ ? `${cur_[0]} → p${cur_[1]}` : n ? '1051 → p0' : '…']);
          o.res = n === 5 ? ['p0: 1049, 1051 · p1: 1047', 'p2: 1048, 1050'] : [];
          if (n === 5) { T(o, SPOT.r(1), 'p1: 1047'); T(o, SPOT.r(2), 'p2: 1048 e 1050'); } } },
      { id: 'ordem', dur: 7, title: 'Mesma chave, um consumidor por vez', yk: 'NO GRUPO · estoque',
        code: ['# no grupo estoque, cada partição tem 1 dono', 'p0 → estoque-1   # lê 48210, 48213, 48217…', 'p1 → estoque-2', 'p2 → estoque-3', '# os eventos do 1051 passam um de cada vez', '# sem mutex: a partição faz o papel da trava'],
        story: 'Os quatro eventos do 1051 estão na p0, e dentro de um grupo cada partição é lida por um consumidor só. Então o estoque-1 recebe o PedidoCriado, depois o PedidoPago, depois o EstoqueReservado, nunca dois ao mesmo tempo. A trava do módulo 11 continua no banco, mas o pedido 1051 já chega em fila.',
        look: 'A p0 acende com as quatro células do 1051; um único ponteiro passa por elas, uma de cada vez.',
        key: 'Chave igual + um consumidor por partição = os eventos de um pedido em série, sem lock.',
        f(o, t) { standing(o); const all = p0of1051(4); o.rows.r0.cells = all; o.on.r0 = 1;
          const seq = [0, 2, 4, 6], k = Math.min(3, Math.floor(Math.max(0, t - 0.6) / 1.2));
          all.forEach((c, i) => { if (!c.gap) c.tn = seq.indexOf(i) < k ? 'dim' : seq[k] === i ? 'acc' : 'dim'; });
          const x = cellX('r0', all, seq[k]);
          lit(o, [[PX - 40, 316, ZB], [PX - 40, 330, ZB], [x, 330, TOP('r0') + 6], [x, RY(0) + 8, TOP('r0') + 2]], '', null, true);
          o.rows.prod = grp('estoque-1', 'dono da p0', [`lendo ${all[seq[k]].o}`, 'acc'], [all[seq[k]].l, 'acc'], ['um evento por vez', 'dim']);
          o.cnt = C3(['DONO DA p0', 'estoque-1'], ['LENDO', all[seq[k]].o], ['AO MESMO TEMPO', '1']);
          o.res = [`estoque-1: ${all[seq[k]].l}`, 'os outros esperam a vez'];
          if (t > 1) T(o, [x, RY(0) + 4, 44], 'um de cada vez'); } },
      { id: 'sem-chave', dur: 7.5, title: 'E se der errado: publicar sem chave', yk: 'NO CÓDIGO · produtor',
        code: ['// chave = null', 'producer.send(new ProducerRecord<>("pedidos", evento));', '# sem chave: partição sticky, uma por lote (KIP-480)', '# PedidoCriado → p0 · PedidoPago, noutro lote → p2', '# consumidores diferentes, ritmos diferentes'],
        story: 'Um time publica sem chave. Aí o cliente escolhe a partição por lote (o particionador sticky): o PedidoCriado do 1051 cai num lote que foi para a p0 e o PedidoPago, no lote seguinte, vai para a p2. Cada partição tem o seu consumidor e o seu ritmo, e o consumidor da p2 pode processar o pagamento antes de o da p0 ver o pedido criado.',
        look: 'As fichas do 1051 se separam: uma para a p0, a outra para a p2, em vermelho.',
        key: 'Ordem só existe dentro da partição; sem chave, não há partição garantida.',
        f(o, t) { standing(o); o.on.prod = 'bad'; const c0 = [ev('1051', 'PedidoCriado', 'bad')], c2 = [...others[2], ev('1051', 'PedidoPago', 'bad')];
          o.rows.prod = grp('pedidos', 'produtor', ['chave: null', 'bad'], ['sticky: 1 partição por lote', 'dim'], ['lote 1 → p0 · lote 2 → p2', 'bad']);
          send(o, t, 0.4, 'r0', c0, 0, 'bad'); send(o, t, 1.6, 'r2', c2, 2, 'bad');
          if (t > 1.5) { o.rows.r0.cells = c0; o.on.r0 = 'bad'; } if (t > 2.7) { o.rows.r2.cells = c2; o.on.r2 = 'bad'; } else o.rows.r2.cells = others[2];
          o.cnt = C3(['CHAVE', 'nenhuma', 'bad'], ['PedidoCriado', t > 1.5 ? 'p0' : '…'], ['PedidoPago', t > 2.7 ? 'p2' : '…', 'bad']);
          o.res = t > 2.7 ? ['1051 em duas partições', 'pago pode chegar antes de criado'] : [];
          if (t > 3) T(o, SPOT.r(2), 'PedidoPago na p2:\nnão espera o da p0', 'bad'); } },
    ],
    grupos: [
      { id: 'tres', dur: 6, title: 'Três grupos, o mesmo log', yk: 'NO TERMINAL · kafka-consumer-groups',
        code: ['GROUP         PARTITION  CURRENT  LOG-END  LAG', 'estoque       0          48220    48220    0', 'notificacoes  0          48219    48220    1', 'entregas      0          48210    48220    10', '# cada grupo guarda o próprio offset'],
        story: 'O estoque, as entregas e as notificações são três grupos de consumo do mesmo tópico. Cada grupo recebe todos os eventos e guarda o seu próprio offset por partição. Na p0, neste instante, o log termina em 48220: o estoque está em dia, as notificações estão 1 atrás e as entregas, 10.',
        look: 'Três ponteiros saem dos grupos e param em lugares diferentes da p0: 48220, 48219 e 48210.',
        key: 'Cada grupo lê tudo e anda no seu ritmo; o offset é do grupo, não do evento.',
        f(o, t) { standing(o); const c = p0window(); o.rows.r0.cells = c; o.on.r0 = 1; o.rows.r0.meta = 'LOG-END 48220';
          const P = [['g0', 48220, 0], ['g2', 48219, 1], ['g1', 48210, 10]];
          P.forEach(([g, cur_, lag], i) => { if (t < 0.4 + i * 0.7) return; o.on[g] = lag > 5 ? 'bad' : 1; pointer(o, cy(g), 'r0', cellX('r0', c, idxOf(c, cur_)), i * 4, lag > 5 ? 'bad' : '');
            o.rows[g] = grp(o.rows[g].name, 'grupo', [`p0 em ${cur_}`, 'acc'], [`LAG ${lag}`, lag > 5 ? 'bad' : lag ? 'acc' : 'dim']); });
          o.cnt = C3(['LOG-END p0', '48220'], ['LAG', 'estoque 0 · notif. 1'], ['LAG ENTREGAS', '10', 'bad']);
          o.res = ['3 grupos · 3 offsets na mesma p0', 'entregas: 10 eventos atrás'];
          if (t > 2.6) T(o, SPOT.g(1), 'lag 10 = 1 s de atraso', 'bad'); } },
      { id: 'ritmo', dur: 7, title: 'Cada grupo anda no seu ritmo', yk: 'NO CÓDIGO · consumer_faturamento (lab)',
        code: ['for msg := range claim.Messages() {', '    time.Sleep(100 * time.Millisecond)', '    sess.MarkMessage(msg, "")', '}', '# 100 ms por evento = 10 eventos/s', '# 10 de lag = 1 s até alcançar'],
        story: 'O entregas gasta 100 ms por evento, como o consumidor de faturamento do lab: 10 eventos por segundo. Sem eventos novos, ele alcança o fim da p0 em 1 s. O estoque e as notificações não esperam por ele, e ele não atrasa ninguém.',
        look: 'O ponteiro do entregas anda célula a célula de 48210 até 48220; os outros dois ficam parados no fim.',
        key: 'Um grupo lento não segura os outros: cada um tem o seu ponteiro.',
        f(o, t) { standing(o); const c = p0window(); o.rows.r0.cells = c; o.on.r0 = 1; o.rows.r0.meta = 'LOG-END 48220';
          const ms = clamp((t - 0.8) / 4.4) * 1000, cur_ = 48210 + Math.floor(ms / 100), lag = 48220 - cur_;
          [['g0', 48220, 0], ['g2', 48220, 0], ['g1', cur_, lag]].forEach(([g, cu, lg], i) => { o.on[g] = g === 'g1' ? 1 : 2; pointer(o, cy(g), 'r0', cellX('r0', c, idxOf(c, cu)), i * 4, '');
            o.rows[g] = grp(o.rows[g].name, 'grupo', [`p0 em ${cu}`, 'acc'], [`LAG ${lg}`, lg ? 'acc' : 'dim']); });
          o.cnt = C3(['LAG ENTREGAS', String(lag)], ['TEMPO', `${Math.round(ms)} ms`], ['RITMO', '100 ms por evento']);
          o.res = lag ? [`entregas em ${cur_}`] : ['entregas alcançou: lag 0 em 1 s'];
          if (t > 1) T(o, SPOT.g(1), '10 eventos/s'); } },
      { id: 'dentro', dur: 6.5, title: 'Dentro do grupo: uma partição, um consumidor', yk: 'NO TERMINAL · grupo entregas',
        code: ['GROUP     PARTITION  CONSUMER-ID', 'entregas  0          entregas-1', 'entregas  1          entregas-2', 'entregas  2          entregas-3', '# 3 partições: no máximo 3 consumidores úteis'],
        story: 'O grupo entregas roda em 3 réplicas. O Kafka divide as partições entre elas: a p0 para a entregas-1, a p1 para a entregas-2, a p2 para a entregas-3. Cada partição tem um dono só dentro do grupo, e é isso que mantém a ordem de cada chave.',
        look: 'O grupo entregas se abre em 3 consumidores; cada trilho liga a um só.',
        key: 'Dentro do grupo, cada partição vai para um consumidor; o grupo inteiro divide o tópico.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) o.on['r' + i] = 1;
          ['g0', 'g1', 'g2'].forEach(g => o.show[g] = 0); for (let i = 0; i < 3; i++) o.show['k' + i] = 1;
          for (let i = 0; i < 3; i++) { if (t < 0.6 + i * 0.6) continue; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, [`lê só a p${i}`, 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.6 + i * 0.3) % 1); }
          o.cnt = C3(['CONSUMIDORES', '3'], ['PARTIÇÕES', '3'], ['DONO POR PARTIÇÃO', '1']);
          o.res = ['p0 → entregas-1 · p1 → entregas-2', 'p2 → entregas-3'];
          if (t > 2.4) T(o, [(GX + GW / 2), 120, 40], 'grupo entregas'); } },
      { id: 'ociosos', dur: 7, title: 'E se der errado: 5 réplicas, 3 partições', yk: 'NO TERMINAL · grupo entregas',
        code: ['GROUP     PARTITION  CONSUMER-ID', 'entregas  0          entregas-1', 'entregas  1          entregas-2', 'entregas  2          entregas-3', 'entregas  -          entregas-4   # sem partição', 'entregas  -          entregas-5   # sem partição'],
        story: 'A Black Friday aperta e alguém sobe o entregas para 5 réplicas. O tópico continua com 3 partições, e cada partição só tem um dono no grupo. A entregas-4 e a entregas-5 entram no grupo, ficam sem partição e não leem nada: custam máquina e não somam vazão.',
        look: 'Duas réplicas novas sobem e ficam apagadas, sem trilho ligado.',
        key: 'Consumidores úteis num grupo = no máximo o nº de partições.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) o.on['r' + i] = 1;
          ['g0', 'g1', 'g2'].forEach(g => o.show[g] = 0); for (let i = 0; i < 5; i++) o.show['k' + i] = i < 3 || t > 0.5 + (i - 3) * 0.6 ? 1 : 0;
          for (let i = 0; i < 3; i++) { o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10 eventos/s', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.6 + i * 0.3) % 1); }
          for (let i = 3; i < 5; i++) { o.on['k' + i] = 'bad'; o.rows['k' + i] = grp(`entregas-${i + 1}`, 'parada', ['sem partição', 'bad']); }
          o.cnt = C3(['RÉPLICAS', '5'], ['ÚTEIS', '3 de 5'], ['PARADAS', '2', 'bad']);
          o.res = ['entregas-4 e entregas-5: sem partição', 'mais réplicas, mesma vazão'];
          if (t > 1.8) T(o, [(GX + GW / 2), KY(4) + 26, 30], '2 réplicas paradas', 'bad'); } },
    ],
    replicas: [
      { id: 'lider', dur: 6, title: 'Cada partição: um líder e dois seguidores', yk: 'NO TERMINAL',
        code: ['$ kafka-topics --describe --topic pedidos', '  Partition: 0  Leader: 1  Replicas: 1,2,3  Isr: 1,2,3', '  Partition: 1  Leader: 2  Replicas: 2,3,1  Isr: 2,3,1', '  Partition: 2  Leader: 3  Replicas: 3,1,2  Isr: 3,1,2', '# ISR: as réplicas em dia com o líder'],
        story: 'Fator de replicação 3: cada partição tem cópia nos 3 brokers. Uma delas é a líder, que recebe as escritas e serve as leituras; as outras duas seguem, copiando o que o líder grava. A p0 tem como líder o kafka-1. A ISR (in-sync replicas) é a lista das cópias que estão em dia: hoje, as três.',
        look: 'Em cada broker, a célula da partição que ele lidera acende; vigas ligam o líder da p0 aos dois seguidores.',
        key: 'Líder escreve e lê; seguidores copiam; a ISR é quem está em dia.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(1); for (let i = 0; i < 3; i++) { o.on['b' + i] = t > 0.4 + i * 0.4 ? 1 : 2; if (t > 0.4) o.on['r' + i] = 2; }
          if (t > 1.8) { o.on.r0 = 1; for (const j of [1, 2]) lit(o, repl(0, j), '', ((t - 1.8) * 0.5 + j * 0.3) % 1); }
          o.cnt = C3(['LÍDER DA p0', 'kafka-1'], ['SEGUIDORES', 'kafka-2, kafka-3'], ['ISR p0', '1, 2, 3']);
          o.res = ['p0: líder 1 · p1: líder 2 · p2: líder 3'];
          if (t > 2) T(o, SPOT.b(0), 'kafka-1: líder da p0'); } },
      { id: 'acks-all', dur: 7, title: 'acks=all: só confirma com 2 cópias', yk: 'NO CÓDIGO · produtor',
        code: ['acks = all                 # padrão desde o Kafka 3.0', 'enable.idempotence = true', '# no tópico: min.insync.replicas = 2', 't = 0 ms   PedidoPago chega ao kafka-1', 't ≈ 10 ms seguidores copiam', '          → confirmação ao produtor'],
        story: 'O PedidoPago do 1051 chega ao kafka-1, líder da p0. Com acks=all e min.insync.replicas = 2, o líder só responde depois que a ISR tem o evento, e a ISR precisa ter pelo menos 2 réplicas. Os seguidores copiam em cerca de 10 ms, e aí o produtor recebe a confirmação.',
        look: 'A ficha vai ao kafka-1; as vigas levam a cópia ao kafka-2 e ao kafka-3; só então volta a confirmação ao produtor.',
        key: 'acks=all: confirmação depois que as réplicas em dia gravaram, nunca só o líder.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(1); const ms = clamp((t - 0.6) * 4, 0, 14);
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2; o.on.b0 = 1;
          const have = [ms > 0, ms >= 10, ms >= 10];
          if (ms > 0 && ms < 10) for (const j of [1, 2]) lit(o, repl(0, j), '', ms / 10);
          brokersWith(o, have, '48213');
          if (ms >= 10) { o.on.r0 = 1; o.rows.r0.cells = p0of1051(2); lit(o, ackPath(), '', clamp((ms - 10) / 3)); }
          o.rows.prod = grp('pedidos', 'produtor', ['acks = all', 'acc'], [ms >= 12 ? 'confirmado ✓' : 'esperando…', ms >= 12 ? 'acc' : 'dim'], ['p0 @ 48213', 'acc']);
          o.cnt = C3(['TEMPO', `${Math.round(ms)} ms`], ['RÉPLICAS COM O EVENTO', `${have.filter(Boolean).length} de 3`], ['CONFIRMADO', ms >= 12 ? 'sim' : 'ainda não']);
          o.res = ms >= 12 ? ['confirmado em ≈ 10 ms', '3 cópias de p0 @ 48213'] : ms > 0 ? ['líder gravou; esperando a ISR'] : [];
          if (ms >= 10) T(o, SPOT.b(1), 'cópia em ≈ 10 ms'); } },
      { id: 'acks1', dur: 9, title: 'E se der errado: acks=1 e o líder cai em 5 ms', yk: 'LINHA DO TEMPO · acks=1',
        code: ['acks = 1                   # só o líder', 't = 0 ms   kafka-1 grava 48213 e confirma', 't = 5 ms   kafka-1 cai', 't ≈ 10 ms a cópia que viria não acontece', 'até ~9 s depois: kafka-2 vira líder da p0', '# sem o 48213: o estoque nunca vê o pagamento'],
        story: 'Agora com acks=1. O kafka-1 grava o PedidoPago e confirma na hora: o produtor segue feliz. Em 5 ms o kafka-1 cai, antes de os seguidores copiarem (isso levaria uns 10 ms). Em até cerca de 9 s o kafka-2 é eleito líder da p0, e ele não tem o 48213. O pagamento da Lena sumiu, e o estoque nunca vai saber.',
        look: 'A confirmação volta logo; o kafka-1 fica vermelho; o kafka-2 vira líder sem a célula 48213.',
        key: 'acks=1 confirma antes da cópia: se o líder cai nesse intervalo, o evento confirmado se perde.',
        f(o, t) { standing(o); const ms = clamp((t - 0.6) * 3, 0, 15), down = ms >= 5, elect = t > 6;
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          if (ms > 0) lit(o, ackPath(), '', clamp(ms / 2));
          brokersWith(o, [ms > 0, false, false], '48213');
          if (ms > 0 && ms < 5) for (const j of [1, 2]) lit(o, repl(0, j), '', ms / 10);
          if (down) { o.on.b0 = 'bad'; o.rows.b0 = brk(0, [['p0', 'fora', '48213', 'bad'], ['p1', 'fora', '', 'bad'], ['p2', 'fora', '', 'bad']], 'caiu em t = 5 ms', 'bad', 'fora do ar');
            for (const j of [1, 2]) o.beams.push({ pts: repl(0, j), on: true, tone: 'bad' }); }
          if (elect) { o.on.b1 = 1; o.rows.b1 = brk(1, [['p0', 'líder', 'sem 48213', 'bad'], ['p1', 'líder', '', 'acc'], ['p2', 'seguidor', '', '']], 'novo líder da p0', 'acc'); }
          o.rows.r0.cells = elect ? p0of1051(1).concat(gap('+2'), ev(48213, 'não existe', 'bad')) : ms > 0 ? p0of1051(2) : p0of1051(1);
          o.on.r0 = elect ? 'bad' : ms > 0 ? 1 : 2; o.rows.r0.meta = elect ? 'líder 2' : 'líder 1';
          o.rows.prod = grp('pedidos', 'produtor', ['acks = 1', 'bad'], [ms > 0 ? 'confirmado ✓ (t = 0)' : 'enviando…', 'acc'], ['acha que deu certo', ms > 0 ? 'bad' : 'dim']);
          o.cnt = C3(['TEMPO', elect ? '~9 s depois' : `${Math.round(ms)} ms`, down ? 'bad' : ''], ['CÓPIAS DO 48213', down ? '0' : ms > 0 ? '1 (só o líder)' : '0', 'bad'], ['LÍDER DA p0', elect ? 'kafka-2' : down ? 'nenhum' : 'kafka-1', down ? 'bad' : '']);
          o.res = elect ? ['kafka-2 líder, sem o 48213', 'PedidoPago confirmado e perdido'] : down ? ['kafka-1 caiu em t = 5 ms', 'a cópia não chegou'] : ms > 0 ? ['confirmado em t = 0 (só o líder)'] : [];
          if (down) T(o, SPOT.b(0), 'caiu antes da cópia', 'bad'); if (elect) T(o, SPOT.b(1), 'líder novo, sem o 48213', 'bad'); } },
      { id: 'repete', dur: 8, title: 'Com acks=all, a mesma queda não perde o evento', yk: 'LINHA DO TEMPO · acks=all',
        code: ['acks = all, enable.idempotence = true', 't = 0 ms   kafka-1 grava 48213, não confirma', 't = 5 ms   kafka-1 cai: o produtor não recebe ok', 'o produtor repete (retries) no novo líder', 'kafka-2 grava; a ISR copia; confirma', '# idempotência: a repetição não duplica'],
        story: 'A mesma queda com acks=all. O kafka-1 grava, mas não confirma, porque a ISR ainda não tem 2 cópias. Ele cai em 5 ms. Sem confirmação, o produtor repete o envio, agora para o kafka-2, que virou líder. O kafka-2 grava, o kafka-3 copia, e o produtor recebe o ok. A idempotência garante que a repetição não vire dois pagamentos.',
        look: 'O kafka-1 fica vermelho sem confirmar; a ficha volta ao produtor e segue para o kafka-2, que acende com o evento.',
        key: 'Sem confirmação, o produtor repete; com idempotência, repetir é seguro.',
        f(o, t) { standing(o); const ms = clamp((t - 0.6) * 3, 0, 15), down = ms >= 5, retry = t > 4.6;
          prodToLeader(o, t, 0.6); for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          brokersWith(o, [ms > 0, retry && t > 5.8, retry && t > 6.4], '48213');
          if (down) { o.on.b0 = 'bad'; o.rows.b0 = brk(0, [['p0', 'fora', '', 'bad'], ['p1', 'fora', '', 'bad'], ['p2', 'fora', '', 'bad']], 'caiu em t = 5 ms', 'bad', 'fora do ar'); }
          if (retry) { o.on.b1 = 1; o.rows.b1.parts[0] = ['p0', 'líder', t > 5.8 ? '48213 ✓' : '', 'acc']; o.rows.b1.foot = ['novo líder da p0', 'acc'];
            const f = clamp((t - 4.6) / 1.2); lit(o, [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(1) + 30, 392, ZB]], '', f); if (f < 1) o.tok.push({ p: [lerp(PCX, BXB(1) + 30, f), 392, ZB] });
            if (t > 5.8 && t < 6.6) lit(o, repl(1, 2), '', (t - 5.8) / 0.8); if (t > 6.6) lit(o, [[BXB(1) + 30, 392, ZB], [PCX, 392, ZB], [PCX, 316, ZB]], '', clamp((t - 6.6) / 0.8)); }
          o.rows.r0.cells = t > 6.4 ? p0of1051(2) : p0of1051(1); o.on.r0 = t > 6.4 ? 1 : 2; o.rows.r0.meta = retry ? 'líder 2' : 'líder 1';
          const ok = t > 7.2;
          o.rows.prod = grp('pedidos', 'produtor', ['acks = all', 'acc'], [ok ? 'confirmado ✓' : retry ? 'repetindo no kafka-2' : down ? 'sem resposta' : 'esperando…', ok ? 'acc' : down ? 'bad' : 'dim'], ['idempotente', 'dim']);
          o.cnt = C3(['TEMPO', retry ? 'nova tentativa' : `${Math.round(ms)} ms`], ['CONFIRMADO', ok ? 'sim' : 'ainda não', ok ? '' : down ? 'bad' : ''], ['CÓPIAS DO 48213', ok ? '2 (kafka-2, kafka-3)' : down ? '0 em pé' : '1']);
          o.res = ok ? ['48213 no kafka-2 e no kafka-3', 'nada perdido, nada duplicado'] : down ? ['kafka-1 caiu sem confirmar'] : [];
          if (down && !retry) T(o, SPOT.b(0), 'não confirmou: o produtor repete', 'bad'); if (ok) T(o, SPOT.b(1), 'kafka-2 grava e confirma'); } },
      { id: 'dois', dur: 8, title: 'E se der errado: dois brokers caem', yk: 'NO LOG · produtor',
        code: ['# kafka-1 e kafka-2 fora: ISR da p0 = {3}', '# 1 réplica em dia < min.insync.replicas = 2', 'NotEnoughReplicasException:', '  Messages are rejected since there are fewer', '  in-sync replicas than required.', '# o tópico para de aceitar escrita na p0'],
        story: 'Agora caem o kafka-1 e o kafka-2. O kafka-3 assume a p0, mas a ISR fica só com ele: 1 réplica, menos que as 2 exigidas. O produtor recebe NotEnoughReplicas e a p0 para de aceitar escrita. O Kafka prefere ficar indisponível a confirmar um evento que só existe numa máquina: é a escolha do CAP do módulo 3.',
        look: 'Dois brokers ficam vermelhos; o kafka-3 sozinho acende, e a ficha do produtor volta vermelha.',
        key: 'min.insync.replicas = 2: com uma cópia só, o Kafka recusa a escrita para não perder dado.',
        f(o, t) { standing(o); o.rows.r0.cells = p0of1051(2); const d1 = t > 0.6, d2 = t > 1.6, err = t > 3;
          for (let i = 0; i < 3; i++) o.on['b' + i] = 2;
          const off = i => brk(i, [['p0', 'fora', '', 'bad'], ['p1', 'fora', '', 'bad'], ['p2', 'fora', '', 'bad']], 'fora do ar', 'bad', 'fora do ar');
          if (d1) { o.on.b0 = 'bad'; o.rows.b0 = off(0); } if (d2) { o.on.b1 = 'bad'; o.rows.b1 = off(1); }
          if (d2) { o.on.b2 = 1; o.rows.b2 = brk(2, [['p0', 'líder', 'ISR {3}', 'bad'], ['p1', 'líder', '', 'acc'], ['p2', 'líder', '', 'acc']], 'ISR = {3} < 2', 'bad'); }
          if (t > 2.2) { const f = clamp((t - 2.2) / 0.8); lit(o, [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(2) + 30, 392, ZB]], err ? 'bad' : '', f); }
          o.on.r0 = err ? 'bad' : 2; o.rows.r0.meta = d2 ? 'líder 3' : d1 ? 'líder 2' : 'líder 1';
          o.on.prod = err ? 'bad' : 0;
          o.rows.prod = grp('pedidos', 'produtor', ['acks = all', 'acc'], [err ? 'NotEnoughReplicas' : 'enviando…', err ? 'bad' : 'dim'], [err ? 'escrita recusada' : '', 'bad']);
          o.cnt = C3(['BROKERS DE PÉ', d2 ? '1 de 3' : d1 ? '2 de 3' : '3 de 3', d1 ? 'bad' : ''], ['ISR DA p0', d2 ? '{3}' : d1 ? '{2, 3}' : '{1, 2, 3}', d2 ? 'bad' : ''], ['ESCRITA NA p0', err ? 'recusada' : 'aceita', err ? 'bad' : '']);
          o.res = err ? ['NotEnoughReplicasException', 'sem perda, sem disponibilidade'] : [];
          if (err) T(o, SPOT.b(2), 'ISR = {3}: recusa escrever', 'bad'); } },
    ],
    particoes: [
      { id: 'limite', dur: 6.5, title: 'O entregas está no limite', yk: 'A CONTA',
        code: ['# Black Friday: 30 EstoqueReservado/s no tópico', '# 3 partições → 3 consumidores úteis', '30 ÷ 3 = 10 eventos/s por consumidor', '# cada um gasta 100 ms: aguenta 10/s', '→ 100% ocupados, sem folga'],
        story: 'Na Black Friday saem 30 EstoqueReservado por segundo, que é o que o entregas precisa tratar. Com 3 partições, são 3 consumidores úteis, 10 eventos por segundo para cada. A 100 ms por evento, cada um aguenta exatamente 10 por segundo. Está no limite: qualquer rajada vira lag.',
        look: 'Os três consumidores acendem cheios, cada um ligado a um trilho.',
        key: 'Capacidade do grupo = consumidores úteis × eventos/s de cada um.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 3; i++) { o.on['r' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10/s · 100% ocupado', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 1.2 + i * 0.3) % 1); }
          o.cnt = C3(['CAPACIDADE', '30 eventos/s'], ['CHEGAM', '30 eventos/s'], ['FOLGA', '0', 'bad']);
          o.res = ['3 × 10/s = 30/s', 'sem folga para rajada'];
          if (t > 1.6) T(o, [(GX + GW / 2), KY(3) + 14, 30], '100% ocupados', 'bad'); } },
      { id: 'replicas', dur: 6.5, title: 'Mais réplicas não adiantam', yk: 'A CONTA',
        code: ['# entregas com 5 réplicas', 'úteis = min(5 réplicas, 3 partições) = 3', 'capacidade = 3 × 10/s = 30/s', '# entregas-4 e entregas-5: sem partição'],
        story: 'O reflexo é subir réplicas. Com 5, a conta não muda: só 3 recebem partição, e a capacidade fica em 30 por segundo. O teto aqui não é o número de máquinas, é o número de partições.',
        look: 'Mais dois consumidores sobem e ficam apagados; a capacidade não sai de 30/s.',
        key: 'O nº de partições é o teto de paralelismo de um grupo.',
        f(o, t) { standing(o); o.rows.r0.cells = p0window(48214, 48219); for (let i = 0; i < 5; i++) o.show['k' + i] = i < 3 || t > 0.5 + (i - 3) * 0.5 ? 1 : 0;
          for (let i = 0; i < 3; i++) { o.on['r' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['10/s · 100% ocupado', 'acc']);
            const y = cy('r' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('r' + i) + 3], [GAPX, y, TOP('r' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 1.2 + i * 0.3) % 1); }
          for (let i = 3; i < 5; i++) { o.on['k' + i] = 'bad'; o.rows['k' + i] = grp(`entregas-${i + 1}`, 'parada', ['sem partição', 'bad']); }
          o.cnt = C3(['CAPACIDADE', '30 eventos/s'], ['RÉPLICAS', '5'], ['ÚTEIS', '3 de 5', 'bad']);
          o.res = ['min(5, 3) = 3 consumidores úteis', 'capacidade: 30/s, igual'];
          if (t > 1.6) T(o, [(GX + GW / 2), KY(4) + 26, 30], '2 paradas', 'bad'); } },
      { id: 'seis', dur: 7, title: '6 partições: 6 consumidores úteis', yk: 'NO TERMINAL',
        code: ['$ kafka-topics --alter --topic pedidos --partitions 6', '# entregas com 6 réplicas: 1 partição cada', 'capacidade = 6 × 10/s = 60/s', '30/s ÷ 6 = 5/s por consumidor (50%)', '# partição só aumenta: não dá para voltar a 3'],
        story: 'Subir o tópico para 6 partições resolve a conta: o entregas pode ter 6 consumidores úteis, 60 eventos por segundo de capacidade, cada um a 50%. Só que o número de partições também entra na conta da chave. E partição só aumenta: não dá para voltar a 3 depois.',
        look: 'Os 3 trilhos viram 6 mais finos; seis consumidores acendem, cada um ligado ao seu.',
        key: 'Mais partições, mais paralelismo; e a conta das chaves muda.',
        f(o, t) { const six = t > 0.6; for (let i = 0; i < 3; i++) o.show['r' + i] = six ? 0 : 1; for (let i = 0; i < 6; i++) { o.show['s' + i] = six ? 1 : 0; o.show['k' + i] = six ? 1 : i < 3 ? 1 : 0; }
          for (let i = 0; i < 6; i++) { if (!six) break; o.on['s' + i] = 1; o.on['k' + i] = 1; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['5/s · 50%', 'acc']);
            const y = cy('s' + i), yk = KY(i) + 14; lit(o, [[RX + RW, y, TOP('s' + i) + 3], [GAPX, y, TOP('s' + i) + 3], [GAPX, yk, TOP('k' + i) + 3], [GX, yk, TOP('k' + i) + 3]], '', (t * 0.7 + i * 0.17) % 1); }
          for (let i = 0; i < 3; i++) { o.rows['b' + i] = brk(i, roles(i), six ? `+ p${i + 3} (líder)` : 'ISR em dia', six ? 'acc' : 'dim'); o.on['b' + i] = 2; }
          o.cnt = C3(['CAPACIDADE', six ? '60 eventos/s' : '30 eventos/s'], ['PARTIÇÕES', six ? '6' : '3'], ['FOLGA', six ? '50%' : '0']);
          o.res = six ? ['6 × 10/s = 60/s', 'cada consumidor a 50%'] : [];
          if (t > 2) T(o, [(GX + GW / 2), 112, 40], '6 consumidores úteis'); } },
      { id: 'salto', dur: 9, title: 'E se der errado: a chave 1051 muda de trilho', yk: 'murmur2 mod 3 → mod 6',
        code: ['chave  mod 3  mod 6', '1047   p1  →  p4', '1048   p2  →  p2', '1049   p0  →  p3', '1050   p2  →  p2', '1051   p0  →  p3   # o pedido da Lena muda de trilho'],
        story: 'A conta da chave era murmur2 mod 3; agora é mod 6. A 1048 e a 1050 ficam na p2, mas a 1051 sai da p0 e vai para a p3 (a 1049 também). Se a troca acontece no meio do pedido da Lena, o PedidoCriado ficou na p0 e o PedidoPago entra na p3. São consumidores diferentes, cada um no seu ritmo: o pagamento pode ser tratado antes do pedido criado. A ordem do pedido se parte.',
        look: 'A ficha do 1051 sai do produtor e, em vez da p0, cai na p3; as duas células do 1051 ficam vermelhas em trilhos diferentes.',
        key: 'Mudar o nº de partições muda o destino das chaves: a ordem por chave quebra na transição.',
        f(o, t) { for (let i = 0; i < 3; i++) o.show['r' + i] = 0; for (let i = 0; i < 6; i++) { o.show['s' + i] = 1; o.show['k' + i] = 1; o.on['k' + i] = 2; o.rows['k' + i] = grp(`entregas-${i + 1}`, `p${i}`, ['5/s', 'dim']); o.on['s' + i] = 2; }
          o.on.prod = 1; o.rows.prod = grp('pedidos', 'produtor', ['chave: 1051', 'acc'], ['murmur2 mod 6 = 3', t > 0.6 ? 'bad' : 'dim'], ['era p0, agora p3', t > 0.6 ? 'bad' : 'dim']);
          const c0 = [ev('1051', 'PedidoCriado', t > 2 ? 'bad' : 'acc'), ev('1049', 'outro pedido', 'dim')], c3 = [ev('1051', 'PedidoPago', 'bad')];
          o.rows.s0.cells = c0; o.rows.s2.cells = [ev('1048', '', 'dim'), ev('1050', '', 'dim')];
          send(o, t, 0.8, 's3', c3, 0, 'bad'); if (t > 1.9) { o.rows.s3.cells = c3; o.on.s3 = 'bad'; o.on.s0 = 'bad'; o.on.k3 = 'bad'; o.on.k0 = 'bad';
            o.rows.k0 = grp('entregas-1', 'p0', ['PedidoCriado do 1051', 'bad']); o.rows.k3 = grp('entregas-4', 'p3', ['PedidoPago do 1051', 'bad']); }
          o.cnt = C3(['1051', t > 1.9 ? 'p0 e p3' : 'p0', t > 1.9 ? 'bad' : ''], ['CHAVES QUE MUDARAM', '1047, 1049, 1051'], ['ORDEM DO 1051', t > 1.9 ? 'partida' : 'ok', t > 1.9 ? 'bad' : '']);
          o.res = t > 1.9 ? ['PedidoCriado na p0, PedidoPago na p3', 'consumidores diferentes: sem ordem'] : [];
          if (t > 2.2) { T(o, [cellX('s0', c0, 0), R6Y(0) + 2, 40], 'criado: p0', 'bad'); T(o, [cellX('s3', c3, 0), R6Y(3) + 2, 40], 'pago: p3', 'bad'); } } },
    ],
    lab: [
      { id: 'compose', dur: 6, title: 'O lab: 1 broker, e o pedidos com 1 partição', yk: 'NO TERMINAL · kafka/',
        code: ['$ docker compose up -d', '# confluentinc/cp-kafka:7.5.0, KRaft, 1 nó', '# 9092 e 9093 · kafka-ui em localhost:8080', 'KAFKA_LOG_RETENTION_HOURS: 168', '# pedidos é criado no 1º envio (auto-create)', '# num.partitions = 1 → 1 partição'],
        story: 'O lab do autor sobe um Kafka de um nó só, em KRaft (sem ZooKeeper), e o kafka-ui na porta 8080. O tópico pedidos não é criado à mão: nasce no primeiro envio, com o padrão de 1 partição e fator de replicação 1. Então aqui não há partições para ver nem réplicas para cair.',
        look: 'Um broker só na frente; um trilho só, o pedidos; à direita, o kafka-ui.',
        key: 'O lab mostra produtor, consumidor e grupo; partições e réplicas ficam com a história.',
        f(o, t) { o.on.b0 = 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 nó', parts: [['p0', 'líder', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['fator 1: sem cópia', 'bad'] };
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells: t > 1 ? [ev(0, 'PEDIDO-00001', 'acc')] : [] }; if (t > 1) o.on.r0 = 1;
          o.rows.prod = grp('producer', 'main.go', ['sarama', 'dim'], ['tópico: pedidos', 'acc'], ['auto-create', 'dim']); o.on.prod = 2;
          o.on.side = 1; o.rows.side = grp('kafka-ui', ':8080', ['pedidos · 1 partição', 'acc'], ['fator de replicação 1', 'dim']);
          send(o, t, 0.2, 'r0', [ev(0, '')], 0);
          o.cnt = C3(['BROKERS', '1'], ['PARTIÇÕES DO pedidos', '1'], ['RÉPLICAS', '1']);
          o.res = ['1 nó · 1 partição · fator 1'];
          if (t > 1.4) T(o, SPOT.r(0), 'num.partitions = 1'); } },
      { id: 'particionado', dur: 6, title: 'pedidos-particionados: 3 partições', yk: 'NO TERMINAL · partition_key/setup.sh',
        code: ['kafka-topics --create \\', '  --topic pedidos-particionados \\', '  --partitions 3 --replication-factor 1', '# produtor: NewHashPartitioner, chave = cliente_id', '# SequenciaCliente prova a ordem de cada cliente'],
        story: 'Para ver partições, o lab tem a pasta partition_key: o setup.sh cria o pedidos-particionados com 3 partições, ainda com fator 1, porque só há um broker. O produtor usa a chave cliente_id e numera a sequência de cada cliente, para mostrar que ela sai em ordem.',
        look: 'Surgem 3 trilhos, todos com líder no mesmo e único broker.',
        key: 'No lab, a chave é o cliente_id; na loja, o pedido_id: a chave escolhe o que fica em ordem.',
        f(o, t) { for (let i = 1; i < 3; i++) o.show['r' + i] = t > 0.5 ? 1 : 0;
          o.on.b0 = 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 nó', parts: [['p0', 'líder', '', 'acc'], ['p1', 'líder', '', 'acc'], ['p2', 'líder', '', 'acc']], foot: ['fator 1: sem cópia', 'bad'] };
          for (let i = 0; i < 3; i++) { o.rows['r' + i] = { name: 'p' + i, meta: 'particionados', cells: [] }; if (t > 0.8 + i * 0.3) o.on['r' + i] = 1; }
          o.rows.prod = grp('producer', 'partition_key', ['chave: cliente_id', 'acc'], ['NewHashPartitioner', 'dim'], ['SequenciaCliente', 'dim']); o.on.prod = 1;
          o.on.side = 2; o.rows.side = grp('kafka-ui', ':8080', ['pedidos-particionados', 'acc'], ['3 partições · fator 1', 'dim']);
          o.cnt = C3(['TÓPICO', 'pedidos-particionados'], ['PARTIÇÕES', '3'], ['RÉPLICAS', '1']);
          o.res = ['3 partições, todas no mesmo broker'];
          if (t > 1.6) T(o, SPOT.b(0), 'um broker: líder de tudo'); } },
      { id: 'produtor', dur: 7, title: 'O produtor do lab e o lag que cresce', yk: 'NO CÓDIGO · producer/main.go',
        code: ['config.Producer.RequiredAcks = sarama.WaitForAll', 'config.Producer.Retry.Max = 5', 'config.Producer.Compression = sarama.CompressionSnappy', '// chave = pedido.ID ("PEDIDO-00001"…), ticker de 1 ms', 'log: Partition: 0 | Offset: N', '// faturamento: time.Sleep(100ms) → 10 eventos/s'],
        story: 'O produtor do lab espera todas as réplicas (WaitForAll, o acks=all), repete até 5 vezes e comprime com Snappy. Ele tenta mandar um evento por milissegundo, com a chave PEDIDO-00001, PEDIDO-00002…; o envio síncrono segura um pouco. Do outro lado, o consumidor de faturamento dorme 100 ms por evento: 10 por segundo. O kafka-ui mostra a coluna LAG subindo.',
        look: 'Os offsets do pedidos correm; o ponteiro do faturamento-consumer-group anda devagar e o vão fica vermelho.',
        key: 'Produtor rápido e consumidor lento: o lag aparece no kafka-ui.',
        f(o, t) { const s = Math.max(0, t - 0.5), rd = Math.floor(s * 10), lag = Math.floor(s * 1000) - rd;
          o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 nó', parts: [['p0', 'líder', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['pedidos · 1 partição', 'dim'] }; o.on.b0 = 2;
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells: [ev(rd, 'faturamento', 'acc'), gap('lag'), ev(Math.floor(s * 1000), 'fim do log', 'bad')] }; o.on.r0 = 1;
          o.show.g0 = o.show.g1 = 1; o.on.g0 = 1; o.on.g1 = 'bad';
          o.rows.g0 = grp('estoque-consumer-group', '', ['acompanha o fim', 'acc']); o.rows.g1 = grp('faturamento-consumer-group', '', ['100 ms por evento', 'bad'], ['LAG crescendo', 'bad']);
          pointer(o, cy('g0'), 'r0', cellX('r0', o.rows.r0.cells, 2), 0, ''); pointer(o, cy('g1'), 'r0', cellX('r0', o.rows.r0.cells, 0), 4, 'bad');
          o.rows.prod = grp('producer', 'main.go', ['WaitForAll · Retry 5', 'acc'], [`PEDIDO-${String(Math.floor(s * 1000) + 1).padStart(5, '0')}`, 'acc'], ['ticker: 1 ms', 'dim']); o.on.prod = 1;
          lit(o, toRail('r0', cellX('r0', o.rows.r0.cells, 2)), '', (t * 1.6) % 1);
          o.on.side = 'bad'; o.rows.side = grp('kafka-ui', ':8080', ['faturamento: LAG ↑', 'bad'], ['estoque: LAG ≈ 0', 'dim']);
          o.cnt = C3(['PRODUTOR', 'até 1 por ms'], ['FATURAMENTO', '10 eventos/s', 'bad'], ['LAG', 'cresce', 'bad']);
          o.res = ['Partition: 0 | Offset: …', 'faturamento fica para trás'];
          if (t > 1.6) T(o, SPOT.g(1), 'LAG cresce', 'bad'); } },
      { id: 'duplicados', dur: 8, title: 'E se der errado: cai antes do commit', yk: 'NO CÓDIGO · consumer_faturamento',
        code: ['config.Consumer.Offsets.AutoCommit.Interval = 1 * time.Second', '// processa, MarkMessage, e o commit sai a cada 1 s', '// cai entre processar e o commit:', '//   volta do último offset gravado', '//   reprocessa até 1 s = ~10 eventos (100 ms cada)', '// conserto: idempotência pelo evento_id ou commit manual'],
        story: 'O faturamento marca cada evento depois de processar, mas o commit do offset só vai ao Kafka a cada 1 s. Se ele cai no meio desse segundo, volta do último offset gravado e processa de novo o que já tinha feito: até 10 eventos, a 100 ms cada. É a entrega pelo menos uma vez. O conserto é tornar o processamento idempotente pelo evento_id (o e-502 repetido do módulo 6) ou gravar o commit junto com o resultado.',
        look: 'Dez células acendem como feitas; o consumidor cai; as mesmas dez voltam vermelhas.',
        key: 'At-least-once: cair antes do commit = reprocessar; o consumidor precisa ser idempotente.',
        f(o, t) { const n = Math.min(10, Math.floor(Math.max(0, t - 0.4) / 0.25)), down = t > 3.2, again = t > 4.4;
          o.show.g1 = 1; o.on.g1 = down && !again ? 'bad' : 1; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 nó', parts: [['p0', 'líder', '', 'acc'], ['', '', '', ''], ['', '', '', '']], foot: ['commit guardado: o', 'dim'] }; o.on.b0 = 2;
          const cells = [ev('o', 'último commit', 'acc'), ...Array.from({ length: 10 }, (_, i) => ev(`o+${i + 1}`, i < n ? (again ? 'de novo' : 'feito') : '', again && i < n ? 'bad' : i < n ? 'acc' : 'dim'))];
          o.rows.r0 = { name: 'p0', meta: 'pedidos', cells }; o.on.r0 = again ? 'bad' : 1;
          const at = again ? Math.min(10, Math.floor((t - 4.4) / 0.25)) : n;
          o.rows.g1 = grp('faturamento-consumer-group', '', [down && !again ? 'caiu' : again ? 'voltou do commit' : `processou ${n}`, down ? 'bad' : 'acc'], [`sem commit: ${n}`, n ? 'bad' : 'dim']);
          if (!down || again) pointer(o, cy('g1'), 'r0', cellX('r0', cells, at), 4, again ? 'bad' : '');
          o.on.side = again ? 'bad' : 2; o.rows.side = grp('faturamento', 'resultado', [again ? `${at} eventos duas vezes` : `${n} eventos faturados`, again ? 'bad' : 'acc'], ['commit a cada 1 s', 'dim']);
          o.cnt = C3(['SEM COMMIT', String(n), n ? 'bad' : ''], ['CONSUMIDOR', down && !again ? 'caiu' : again ? 'voltou' : 'de pé', down ? 'bad' : ''], ['DUPLICADOS', again ? String(at) : '0', again ? 'bad' : '']);
          o.res = again ? [`${at} eventos processados de novo`, 'conserto: idempotência pelo evento_id'] : down ? ['caiu antes do commit de 1 s'] : [];
          if (again) T(o, SPOT.r(0), 'mesmos eventos, de novo', 'bad'); } },
      { id: 'fnv', dur: 8, title: 'E se der errado: FNV no Go, murmur2 no Java', yk: 'A CONTA · mesma chave, dois clientes',
        code: ['chave  Java murmur2  sarama FNV-1a', '1049   p0           p2', '1050   p2           p0', '1051   p0           p2', '// sarama: NewHashPartitioner usa FNV-1a', '// para bater com o Java: NewMurmur2Partitioner'],
        story: 'O NewHashPartitioner do sarama, o cliente Go do lab, não usa o murmur2 do cliente Java: usa FNV-1a. A mesma chave cai em partições diferentes. Com 3 partições, o 1051 vai para a p0 no Java e para a p2 no Go. Se o pedidos publica em Java e o estoque, em Go, os eventos do 1051 ficam em duas partições e perdem a ordem. O sarama tem o NewMurmur2Partitioner para ficar igual ao Java.',
        look: 'Duas fichas com a chave 1051: a do Java cai na p0, a do Go cai na p2, em vermelho.',
        key: 'A partição depende do hash do cliente: misture clientes só com o mesmo particionador.',
        f(o, t) { for (let i = 1; i < 3; i++) o.show['r' + i] = 1;
          o.on.b0 = 2; o.rows.b0 = { name: 'kafka', meta: 'KRaft · 1 nó', parts: [['p0', 'líder', '', 'acc'], ['p1', 'líder', '', 'acc'], ['p2', 'líder', '', 'acc']], foot: ['3 partições', 'dim'] };
          const c0 = [ev('1051', 'Java · murmur2', 'acc')], c2 = [ev('1051', 'Go · FNV-1a', 'bad')];
          for (let i = 0; i < 3; i++) o.rows['r' + i] = { name: 'p' + i, meta: '', cells: [] };
          send(o, t, 0.4, 'r0', c0, 0); send(o, t, 1.8, 'r2', c2, 0, 'bad');
          if (t > 1.5) { o.rows.r0.cells = c0; o.on.r0 = 1; } if (t > 2.9) { o.rows.r2.cells = c2; o.on.r2 = 'bad'; }
          o.rows.prod = grp('chave 1051', '2 clientes', ['Java: murmur2 → p0', 'acc'], ['Go: FNV-1a → p2', t > 1.8 ? 'bad' : 'dim'], ['mesma chave, 2 trilhos', t > 2.9 ? 'bad' : 'dim']); o.on.prod = t > 2.9 ? 'bad' : 1;
          o.on.side = 2; o.rows.side = grp('sarama', 'partitioner.go', ['NewHashPartitioner: FNV', 'bad'], ['NewMurmur2Partitioner', 'acc']);
          o.cnt = C3(['CHAVE', '1051'], ['JAVA', 'p0'], ['GO (sarama)', t > 1.8 ? 'p2' : '…', 'bad']);
          o.res = t > 2.9 ? ['1051 em p0 e em p2', 'ordem do pedido partida'] : [];
          if (t > 3) T(o, SPOT.r(2), 'Go: 1051 → p2', 'bad'); } },
    ],
  };
  // vigas entre brokers (cópia do líder ao seguidor) e do produtor ao líder
  const BC = i => BXB(i) + 20;   // centro da célula p0 dentro do broker
  function repl(a, b) { const y = BY + 30; return [[BC(a), y, ZB], [BC(a), y, ZB + 16], [BC(b), y, ZB + 16], [BC(b), y, ZB]]; }
  const ackPath = () => [[BC(0), BY, ZB], [BC(0), 336, ZB + 4], [PCX, 336, ZB + 4], [PCX, 316, ZB]];
  function prodToLeader(o, t, t0) { o.on.prod = 1; if (t < t0) return; const f = clamp((t - t0) / 0.7), pts = [[PCX, 316, ZB], [PCX, 392, ZB], [BXB(0), 392, ZB]];
    lit(o, pts, '', f); if (f < 1) o.tok.push({ p: alongPts(pts, cumLen(pts), f) }); }
  function brokersWith(o, have, off) { for (let i = 0; i < 3; i++) { o.rows['b' + i] = brk(i, roles(i), 'ISR em dia', 'dim'); o.rows['b' + i].parts[0][2] = have[i] ? off + ' ✓' : ''; } }
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
        if (sub) { x.fillStyle = /sem|ISR/.test(sub) || tone === 'bad' ? BAD() : accC(); fitFont(x, u, sub, 8.6, sw - 4); x.fillText(sub, u(X + sw / 2), u(y0 + 31)); }
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
    lbl(s.yk || 'NO CÓDIGO', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /NotEnough|perd|partid|sem |caiu|duas|de novo|duplic|não |p0 e p3|p0 e em p2|fica para trás|lag /.test(l) ? BAD() : acc; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    topico: () => `<table class="h3-sum"><tr><th>hora</th><th>evento do 1051</th><th>p @ offset</th></tr><tr><td>14:20:01.100</td><td>PedidoCriado · e-901</td><td>p0 @ 48210</td></tr><tr class="on"><td>14:20:03.000</td><td>PedidoPago · e-902 (72 B)</td><td>p0 @ 48213</td></tr><tr><td>14:20:03.040</td><td>EstoqueReservado · e-903</td><td>p0 @ 48217</td></tr><tr><td>15:10:00</td><td>PedidoEnviado · e-904</td><td>p0 @ 48301</td></tr></table><li>Tópico <b>pedidos</b>: <b>3 partições</b>, fator de replicação <b>3</b>, <b>min.insync.replicas = 2</b>, retenção <b>7 dias</b> (168 h)</li><li>Volume: dia comum <b>20 eventos/s</b>; Black Friday <b>120/s</b> (40/s por partição); evento médio ≈ <b>100 B</b>; os 4 eventos do 1051 somam <b>400 B</b> (151 + 72 + 89 + 88)</li><li>Pedido 1051 (Lena, Recife): 2 canecas azuis 39,80 + frete 15,00 = <b>54,80</b>; CANECA-007: <b>40 → 38</b></li>`,
    chave: () => `<li>Particionador do cliente Java: <b>(murmur2(chave) &amp; 0x7fffffff) mod nº de partições</b></li><li>Conferido com os vetores do Kafka: murmur2("21") = <b>−973932308</b>; murmur2("foobar") = <b>−790332482</b></li><table class="h3-sum"><tr><th>chave</th><th>murmur2</th><th>mod 3</th></tr><tr><td>1047</td><td>−29587144</td><td>p1</td></tr><tr><td>1048</td><td>1636681634</td><td>p2</td></tr><tr><td>1049</td><td>−364487243</td><td>p0</td></tr><tr><td>1050</td><td>834011288</td><td>p2</td></tr><tr class="on"><td>1051</td><td>−395860997</td><td>p0</td></tr></table><li>Sem chave: partição sticky por lote (KIP-480)</li>`,
    grupos: () => `<table class="h3-sum"><tr><th>grupo</th><th>CURRENT</th><th>LAG</th></tr><tr><td>estoque</td><td>48220</td><td>0</td></tr><tr><td>notificacoes</td><td>48219</td><td>1</td></tr><tr class="on"><td>entregas</td><td>48210</td><td>10</td></tr></table><li>p0 com <b>LOG-END-OFFSET 48220</b>; entregas a <b>100 ms</b> por evento = <b>10/s</b></li><li>Consumidores úteis num grupo ≤ nº de partições: entregas com <b>5</b> réplicas e <b>3</b> partições = <b>2 paradas</b></li>`,
    replicas: () => `<li>3 brokers <b>kafka-1, kafka-2, kafka-3</b> (ids 1, 2, 3), KRaft (sem ZooKeeper)</li><li><b>acks</b>: 0 (não espera), 1 (só o líder), <b>all</b> (a ISR; padrão desde o Kafka 3.0, com enable.idempotence = true)</li><li>Cópia ao seguidor ≈ <b>10 ms</b>; com acks=1 o líder cai em <b>5 ms</b>: o PedidoPago (p0 @ 48213) se perde</li><li>2 brokers fora: ISR = {3} &lt; 2 → <b>NotEnoughReplicas</b>; eleição de líder em até cerca de <b>9 s</b> (exemplo: <b>broker.session.timeout.ms = 9000</b>, o padrão no KRaft)</li>`,
    particoes: () => `<li>entregas: <b>30</b> EstoqueReservado/s ÷ 3 consumidores = <b>10/s</b> cada = o limite de 100 ms por evento</li><table class="h3-sum"><tr><th>chave</th><th>mod 3</th><th>mod 6</th></tr><tr><td>1047</td><td>p1</td><td>p4</td></tr><tr><td>1048</td><td>p2</td><td>p2</td></tr><tr><td>1049</td><td>p0</td><td>p3</td></tr><tr><td>1050</td><td>p2</td><td>p2</td></tr><tr class="on"><td>1051</td><td>p0</td><td>p3</td></tr></table><li>O nº de partições de um tópico só aumenta</li>`,
    lab: () => `<li><b>cp-kafka 7.5.0</b>, KRaft, 1 nó, portas 9092/9093; <b>kafka-ui</b> em localhost:8080; cliente Go <b>IBM/sarama</b></li><li>pedidos criado sozinho com <b>1 partição</b> (num.partitions = 1); <b>pedidos-particionados</b>: 3 partições, fator 1</li><li>Produtor: <b>WaitForAll</b>, Retry.Max <b>5</b>, Snappy, chave PEDIDO-00001…; faturamento: <b>100 ms</b> por evento, auto-commit a cada <b>1 s</b></li><table class="h3-sum"><tr><th>chave</th><th>Java (murmur2)</th><th>sarama (FNV-1a)</th></tr><tr><td>1049</td><td>p0</td><td>p2</td></tr><tr><td>1050</td><td>p2</td><td>p0</td></tr><tr class="on"><td>1051</td><td>p0</td><td>p2</td></tr></table>`,
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
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'No código')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'kafka') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · arraste para girar' };
})() });
