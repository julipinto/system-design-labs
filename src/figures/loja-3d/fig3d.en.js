// 3D figure (iso-glow): the map of the whole store, the figure that closes SDLabs (English version of fig3d.js). Each piece is a block with its real name and
// the module number on a label; the map grows block by block (1–5, 6–10, 11–13, 14–17, 18–21, 22–25, 26–28). The block in focus lights up
// in sodium (the accent color) and the earlier ones turn graphite; blocks that do not exist yet do not show up.
// Modes (buttons and ?mode=fundacoes|partir|conversar|crescer|consistencia|operar|celulas|tudo|falha; ?step=N opens at step N):
// one per block, "tudo" (the 1060 sheet across the 14 hops) and "falha" (click a piece to take it down: the stain, the number and the
// module that warned about it; at the end, the router and the map together show that edge-loja is the ceiling).
// Data: docs/escrita/provas-finais-brief.md, docs/escrita/historia-mestre.md and lessons 1 to 7 (src/content/_en/provas-finais/).
FIGS3D.push({ id: 'loja', name: 'Store', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── modos ──
  const SC = ['fundacoes', 'partir', 'conversar', 'crescer', 'consistencia', 'operar', 'celulas', 'tudo', 'falha'];
  const SCNAME = { fundacoes: 'Foundations', partir: 'Split', conversar: 'Talk', crescer: 'Grow', consistencia: 'Consistency',
    operar: 'Operate', celulas: 'Cells', tudo: 'All', falha: 'Failure' };
  const SCFULL = { fundacoes: 'Block 1 · A one-server store', partir: 'Block 2 · Split and connect', conversar: 'Block 3 · Talk and compete',
    crescer: 'Block 4 · Grow and spread', consistencia: 'Block 5 · Consistency and resilience', operar: 'Block 6 · Change, plan, test, isolate',
    celulas: 'Block 7 · Cells, disaster and signals', tudo: 'The whole store · order 1060', falha: 'Take a piece out' };
  const BLK = { fundacoes: 1, partir: 2, conversar: 3, crescer: 4, consistencia: 5, operar: 6, celulas: 7, tudo: 7, falha: 7 };
  const AULA = { fundacoes: 'aula-1-a-loja-de-um-servidor', partir: 'aula-2-partir-e-ligar', conversar: 'aula-3-conversar-e-disputar',
    crescer: 'aula-4-crescer-e-espalhar', consistencia: 'aula-5-consistencia-e-resiliencia', operar: 'aula-6-mudar-planejar-testar-isolar',
    celulas: 'aula-7-celulas-desastre-e-sinais', tudo: 'aula-7-celulas-desastre-e-sinais', falha: 'aula-7-celulas-desastre-e-sinais' };
  // os 28 módulos: slug, nome e o número que fica (src/scripts/provas-finais/dados.js)
  const MOD = [null,
    ['protocolos-de-rede', 'Network Protocols', '215 slices · RTT 80 ms'], ['storage-raid-io', 'Storage, RAID and I/O', '1 · 2 · 4 · 6 · 2 I/Os'],
    ['cap-acid-base', 'CAP Theorem, ACID and BASE', '2-of-3 quorum · ~80 ms'], ['databases', 'Databases, Data Models and Indexing', 'order 1042 · B-Tree'],
    ['cache', 'Cache Strategies', 'h = 90% → 5 ms · 89.90 → 79.90'], ['microsservicos', 'Microservices, Monoliths and Domains', '180 → 200 ms · 80 × 25 vCPU'],
    ['load-balancers', 'Load Balancers and Reverse Proxies', '2.7 s · 5 s × 3 = 15 s'], ['api-gateways', 'API Gateways', '401 × 403 · JWT · token bucket'],
    ['bff', 'Backend for Frontends (BFF)', '480 ms · 180 KB → 150 ms · 12 KB'], ['service-mesh', 'Service Mesh', '27 calls · sidecar 3 vCPU · 1.5 GB'],
    ['concorrencia', 'Concurrency and Parallelism', '2 ms + 18 ms → 50/s · ceiling 500/s · 409'], ['comunicacao-sincrona', 'Synchronous Communication', '11 bytes · 210 ms'],
    ['comunicacao-assincrona', 'Asynchronous Communication: Messaging, Events and Streaming', '4 events · 120/s · 40/s per partition · 1049 → p0'],
    ['performance', 'Performance, Capacity and Scalability', 'average 135 · p50 32 · p95 800 · p99 2,000 ms'], ['scale-cube', 'Scale Cube', '(10, 9, 1) → (10, 9, 3) · 90 → 150 → 200'],
    ['sharding', 'Sharding and Partitioning', '40% → 55.6% · 75.2% × 25.7% · 45 pairs'], ['replicacao', 'Data Replication', '2 · 12 · 82 ms · lag 300/800 ms · RPO 9/24 · RTO 35 s'],
    ['cqrs', 'CQRS', '1,787 B · 235 ms × 0.021 ms'], ['saga', 'Saga Pattern', '85.5% · 1 · 2 · 4 · 8 · 16 s · estorno-c-7732'],
    ['event-sourcing', 'Event Sourcing', '1,800 ms × 13 ms · 2 h 47 min'], ['resiliencia', 'Resilience Patterns', '1.67 s · 27 · 1.3 s · 50/30/20'],
    ['deployment', 'Deployment Models', 'R$ 54,000 × R$ 450 · 40 s × 90 s'], ['capacity-planning', 'Capacity Planning', '14 · 10 · 15 · 2 = 41 vCPU · 950 req/s · 200 orders/s'],
    ['testes-de-carga', 'Load and Stress Testing', '36/s × ~250/s · p95 ≤ 800 ms · errors ≤ 0.1%'], ['bulkhead', 'Bulkhead Pattern', 'pool 20 → 16 + 4 · 33% and 10% of 503 · 60% → 40%'],
    ['cell-based', 'Cell-Based Architecture', '4 cells · 7,200 × 2,880 · 41 → 53 vCPU'], ['disaster-recovery', 'Single Point of Failure and Disaster Recovery', 'RTO 65 s (30 + 35) · RPO 2.97 · the 1061'],
    ['observabilidade', 'Observability and Monitoring', '43.2 min · 14.4× · 1.9 s × 275 ms']];
  const BLOCOS = [null, [1, 5], [6, 10], [11, 13], [14, 17], [18, 21], [22, 25], [26, 28]];
  let clk = 0, sc = 'tudo', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-loja3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria: a prancha e as peças ──
  const PW = 1170, PD = 765, PL = 7, Z = 17;
  plateWith(g0, PW, PD, [[14, 14], [PW - 14, 14], [14, PD - 14], [PW - 14, PD - 14]]);
  hazeAndShadow(g0, PW / 2, PD / 2, 13.5, 9.6);
  const MAP = { s1: 17, fs: 13, lh: 17, y0: 40 };
  // id, nome, etiqueta do módulo (por bloco), bloco em que nasce, bloco em que some, x, y, largura, fundo, altura, linhas por bloco
  // Colunas: A (20–160) cliente e o cubo · B (185–315) a porta · C e D (335–635) os serviços · E (655–795) os dados
  // · F (815–955) eventos e leitura · G (1000–1150) fora da célula. Ao fundo, as regiões; na frente, a operação.
  const BX = [
    { id: 'sp', n: 'SP', m: { 1: 'M3', 4: 'M17', 7: 'M26' }, b: 1, x: 176, y: 20, w: 236, d: 90, h: 16,
      r: { 1: ['site 1', 'quorum: 2 of 3'], 4: ['pg-sp · primary', 'commit 2 ms'], 7: ['celula-sp 33%', 'holds the passives'] } },
    { id: 'rio', n: 'Rio', m: { 1: 'M3', 4: 'M17', 7: 'M26' }, b: 1, x: 432, y: 20, w: 236, d: 90, h: 16,
      r: { 1: ['site 2', 'RTT SP–Rio 10 ms'], 4: ['pg-rio · replica', 'lag 300 ms'], 7: ['celula-rio 15%', '4.5 orders/s'] } },
    { id: 'rec', n: 'Recife', m: { 1: 'M3', 4: 'M17', 7: 'M26' }, b: 1, x: 688, y: 20, w: 236, d: 90, h: 16,
      r: { 1: ['site 3', 'sync write ~80 ms'], 4: ['pg-recife · replica', 'lag 800 ms'], 7: ['celula-recife 12%', 'the frame: this stack'] } },
    { id: 'mkt', n: 'celula-mkt', m: 'M26', b: 7, x: 944, y: 20, w: 206, d: 90, h: 16, r: { 7: ['40% · 12.0 orders/s', 'mkt-01 alone'] } },
    { id: 'edge', n: 'edge-loja', m: 'M26', b: 7, x: 20, y: 140, w: 140, d: 85, h: 24, r: { 7: ['reads cliente_id', 'map 150 MB', '99.99%'] } },
    { id: 'app', n: 'app', m: 'M1', b: 1, x: 20, y: 245, w: 140, d: 110, h: 22, r: { 1: ['Lena · Recife', 'DNS · TCP · TLS', 'HTTP', 'RTT 80 ms'] } },
    { id: 'cdn', n: 'CDN', m: 'M5', b: 1, x: 20, y: 375, w: 140, d: 80, h: 16, r: { 1: ['edge in Recife', 'cat photo'] } },
    { id: 'cubo', n: 'cube', m: 'M15', b: 4, x: 20, y: 475, w: 140, d: 80, h: 16, r: { 4: ['X · Y · Z', '(10, 9, 3)'] } },
    { id: 'metr', n: 'measure', m: 'M14', b: 4, x: 185, y: 575, w: 130, d: 75, h: 16, r: { 4: ['p95 800 ms', 'fleet 67.5%'] } },
    { id: 'gw', n: 'gw-loja', m: 'M8', b: 2, x: 185, y: 140, w: 130, d: 85, h: 20, r: { 2: ['JWT: 401 × 403', 'rate limit', '/v1 · /v2'] } },
    { id: 'lb', n: 'lb-loja', m: 'M7', b: 2, x: 185, y: 245, w: 130, d: 85, h: 20, r: { 2: ['203.0.113.10', 'healthcheck 15 s'] } },
    { id: 'bff', n: 'bff-app', m: 'M9', b: 2, x: 185, y: 350, w: 130, d: 105, h: 20, r: { 2: ['+ bff-web', '+ bff-voz', '480 → 150 ms'] } },
    { id: 'mesh', n: 'malha', m: 'M10', b: 2, x: 185, y: 475, w: 130, d: 80, h: 16, r: { 2: ['sidecar per pod', 'mTLS · retry'] } },
    { id: 'loja', n: 'loja', m: 'M2', b: 1, u: 1, x: 335, y: 140, w: 300, d: 415, h: 24,
      r: { 1: ['one server · 8 vCPU', 'one program only:', 'catalog, cart,', 'orders, payments,', 'stock, delivery', 'and the report', 'at 23:00'] } },
    { id: 'catalogo', n: 'catalogo', m: 'M6', b: 2, x: 335, y: 140, w: 140, d: 85, h: 18, r: { 2: ['Storefront', '3 replicas'] } },
    { id: 'carrinho', n: 'carrinho', m: 'M6', b: 2, x: 335, y: 245, w: 140, d: 85, h: 18, r: { 2: ['Checkout'] } },
    { id: 'pedidos', n: 'pedidos', m: 'M6', b: 2, x: 335, y: 350, w: 140, d: 105, h: 22,
      r: { 2: ['Checkout', '1047 · 94.90'], 6: ['Checkout', 'v2.4.0'], 7: ['Checkout', '@2.6.0'] } },
    { id: 'relatorios', n: 'relatorios', m: 'M6', b: 2, x: 335, y: 475, w: 140, d: 80, h: 18, r: { 2: ['23:00', 'the noisy neighbor'] } },
    { id: 'pagamentos', n: 'pagamentos', m: 'M6', b: 2, x: 495, y: 140, w: 140, d: 85, h: 18,
      r: { 2: ['Checkout'], 3: ['Checkout', 'REST · gRPC'], 5: ['timeout 1 s', 'breaker'] } },
    { id: 'estoque', n: 'estoque', m: 'M6', b: 2, x: 495, y: 245, w: 140, d: 85, h: 18,
      r: { 2: ['Logistics', 'cat: 3 → 2'], 3: ['Logistics', 'lock on the cat'], 7: ['lock on the cat', 'REC-1: 2 cats'] } },
    { id: 'pool', n: 'pool', m: 'M25', b: 6, x: 495, y: 350, w: 140, d: 105, h: 16, r: { 6: ['20 connections', '16 + 4'] } },
    { id: 'entregas', n: 'entregas', m: 'M6', b: 2, x: 495, y: 475, w: 140, d: 80, h: 18, r: { 2: ['Logistics'], 3: ['Logistics', 'Kafka group'] } },
    { id: 'redis', n: 'Redis', m: { 1: 'M5', 3: 'M11' }, b: 1, x: 655, y: 140, w: 140, d: 85, h: 18,
      r: { 1: ['hit rate 90%', 'average 5 ms'], 3: ['cache 5 ms', 'distributed lock'] } },
    { id: 'pg', n: 'PostgreSQL', m: 'M4', b: 1, x: 655, y: 245, w: 140, d: 210, h: 26,
      r: { 1: ['pedidos table', '1042 · Lena', '89.90', 'B-Tree index'], 4: ['pedidos table', 'primary in SP', 'database: 150/s', 'B-Tree index'],
        5: ['pedidos table', '+ outbox', 'same transaction', 'B-Tree index'], 7: ['of celula-recife', 'primary: Recife', '+ outbox', 'B-Tree index'] } },
    { id: 'shards', n: 'shards', m: 'M16', b: 4, x: 655, y: 475, w: 140, d: 90, h: 18, r: { 4: [] } },
    { id: 'disco', n: 'RAID 10', m: 'M2', b: 1, x: 655, y: 585, w: 140, d: 70, h: 16, r: { 1: ['2 I/Os per write', 'photos: obj. storage'] } },
    { id: 'saga', n: 'saga', m: 'M19', b: 5, x: 815, y: 140, w: 140, d: 85, h: 18, r: { 5: ['orchestrated', 'compensates: refund'] } },
    { id: 'mp', n: 'meus-pedidos', m: 'M18', b: 5, x: 815, y: 245, w: 140, d: 85, h: 18, r: { 5: ['projection', 'lena-77: 1,787 B'] } },
    { id: 'kafka', n: 'Kafka', m: 'M13', b: 3, x: 815, y: 350, w: 140, d: 105, h: 20, r: { 3: ['topic pedidos', '3 partitions', 'key pedido_id', 'DLQ'] } },
    { id: 'es', n: 'event store', m: 'M20', b: 5, x: 815, y: 475, w: 140, d: 80, h: 18, r: { 5: ['streams', 'snapshot 13 ms'] } },
    { id: 'filas', n: 'AMQP · MQTT', m: 'M13', b: 3, x: 815, y: 575, w: 140, d: 75, h: 16, r: { 3: ['emails', 'truck'] } },
    { id: 'psp', n: 'PSP-A', m: { 3: 'M12', 5: 'M21' }, b: 3, x: 1000, y: 140, w: 150, d: 85, h: 18,
      r: { 3: ['Pix · card', '210 ms · webhook'], 5: ['p50 180 ms', 'breaker in front'] } },
    { id: 'pspb', n: 'PSP-B', m: 'M21', b: 5, x: 1000, y: 245, w: 150, d: 85, h: 18, r: { 5: ['reserve', 'p50 300 ms'] } },
    { id: 'obs', n: 'signals', m: 'M28', b: 7, x: 1000, y: 350, w: 150, d: 130, h: 20, r: { 7: ['logs · metrics', 'traces', 'SLO 99.9%', '43.2 min / 30 d'] } },
    { id: 'dr', n: 'DR', m: 'M27', b: 7, x: 1000, y: 500, w: 150, d: 150, h: 18, r: { 7: ['probes 10 s × 3', 'MTTD 30 s', 'RTO 65 s', 'runbook', '12 links · 5 SPoFs'] } },
    { id: 'pipe', n: 'pipeline', m: 'M22', b: 6, x: 335, y: 675, w: 140, d: 70, h: 14, r: { 6: ['canary 10→50→100', 'flag frete_v2'] } },
    { id: 'plano', n: 'plan', m: 'M23', b: 6, x: 495, y: 675, w: 140, d: 70, h: 14, r: { 6: ['41 vCPU', 'BF Nov 26, 2027'] } },
    { id: 'k6', n: 'k6', m: 'M24', b: 6, x: 655, y: 675, w: 140, d: 70, h: 14, r: { 6: ['today: 36/s', 'plan: ~250/s'] } },
  ];
  const B = {}, GID = new Map();
  for (const b of BX) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, b.w, b.d, b.h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, b.h, b.w - 5, b.d - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[b.id] = { ...b, g, mat, top, glow, key: '', f: 0, sk: 0, pos: [b.x, b.y, PL] }; GID.set(g, b.id);
  }
  const NAMES = Object.keys(B);
  creases(first);
  const pick = (o, blk) => { if (typeof o !== 'object') return o; let k = 0; for (const s in o) if (+s <= blk && +s > k) k = +s; return o[k]; };
  const CX = id => B[id].x + B[id].w / 2, CY = id => B[id].y + B[id].d / 2, TOP = id => PL + B[id].h;

  // cabos grossos (vigas) e fichas de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 220 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 24 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-7, -7, -7, 14, 14, 14, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c), grayEm = new THREE.Color(0x8d9399);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : tone === 'gray' ? grayEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : tone === 'gray' ? 0.3 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? 2.6 : b.on || b.tone === 'bad' ? 6 : 3.4) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if ((b.on || b.tone === 'bad') && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
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
  const TAGS = Array.from({ length: 10 }, () => tag(12));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TB = (o, id, text, tone = 'acc', dz = 24) => T(o, [CX(id), CY(id), TOP(id) + dz], text, tone);

  // ── cabos (pontas nas bordas das peças); [id, pontos, bloco em que nasce, bloco em que some] ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const bus = cx => [[90, 140], [90, 65], [166, 65], [166, 65, 44], [cx, 65, 44], [cx, 65, 24]];
  const LINKS = [
    ['app>loja', [[160, 300], [335, 300]], 1, 1], ['loja>redis', [[635, 182], [655, 182]], 1, 1], ['loja>pg', [[635, 400], [655, 400]], 1, 1],
    ['app>cdn', [[90, 355], [90, 375]], 1], ['pg>disco', [[795, 440], [805, 440], [805, 620], [795, 620]], 1],
    ['sp>rio', [[412, 65], [432, 65]], 1], ['rio>rec', [[668, 65], [688, 65]], 1], ['rec>mkt', [[924, 65], [944, 65]], 7],
    ['sp~rec', [[294, 65, 23], [294, 65, 62], [806, 65, 62], [806, 65, 23]], 4, 6],
    ['app>gw', [[160, 270], [170, 270], [170, 182], [185, 182]], 2, 6],
    ['app>edge', [[90, 245], [90, 225]], 7], ['edge>gw', [[160, 182], [185, 182]], 7],
    ['edge>sp', [[90, 140], [90, 65], [176, 65]], 7], ['edge>rio', bus(550), 7], ['edge>rec', bus(806), 7], ['edge>mkt', bus(1047), 7],
    ['gw>lb', [[250, 225], [250, 245]], 2], ['lb>bff', [[250, 330], [250, 350]], 2], ['bff>pedidos', [[315, 402], [335, 402]], 2],
    ['bff>catalogo', [[315, 365], [325, 365], [325, 182], [335, 182]], 2], ['catalogo>redis', [[405, 225], [405, 235], [725, 235], [725, 225]], 2],
    ['pedidos>pagamentos', [[475, 372], [485, 372], [485, 182], [495, 182]], 2], ['pedidos>estoque', [[475, 372], [485, 372], [485, 288], [495, 288]], 2],
    ['pedidos>pg', [[475, 415], [655, 415]], 2, 5], ['pedidos>pool', [[475, 415], [495, 415]], 6], ['pool>pg', [[635, 415], [655, 415]], 6],
    ['estoque>redis', [[635, 265], [645, 265], [645, 200], [655, 200]], 3],
    ['pagamentos>psp', [[565, 140], [565, 130], [990, 130], [990, 182], [1000, 182]], 3],
    ['pagamentos>pspb', [[565, 140], [565, 130], [990, 130], [990, 288], [1000, 288]], 5],
    ['pg>kafka', [[795, 400], [815, 400]], 3], ['kafka>entregas', [[835, 455], [835, 465], [565, 465], [565, 475]], 3],
    ['kafka>mp', [[885, 350], [885, 330]], 5], ['kafka>es', [[885, 455], [885, 475]], 5],
    ['pg~sp', [[725, 350, 34], [725, 350, 84], [294, 65, 84], [294, 65, 24]], 7],
  ];
  const LK = {}; LINKS.forEach(([id, pts, b0, b1 = 9]) => { LK[id] = { pts: P3(pts), b0, b1 }; });
  const pathOf = keys => keys.reduce((a, k) => { const rv = k[0] === '-', p = LK[rv ? k.slice(1) : k].pts; return a.concat(rv ? p.slice().reverse() : p); }, []);
  const FRAME = P3([[176, 118], [966, 118], [966, 662], [176, 662], [176, 118]], PL + 2);
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 22, label, tone || 'acc']);
  }
  const fly = (o, keys, f, label, tone = '') => pk(o, pathOf(keys), f, label, tone);
  // fichas num caminho: período per (s), a ficha k sai em k × per; bad(k) diz se ela volta recusada
  function toks(o, keys, per, tone = '', bad = () => false, travel = 1.4) {
    const pts = pathOf(keys);
    for (let k = Math.floor((clk - travel * 2) / per); k <= Math.floor(clk / per); k++) {
      const a = clk - k * per; if (a < 0) continue; const f = a / travel;
      if (bad(k)) { if (f < 1) pk(o, pts, f, '', tone); else if (f < 1.8) pk(o, pts.slice().reverse(), f - 1 + 0.001, '', 'bad'); }
      else if (f < 1) pk(o, pts, f, '', tone);
    }
  }

  // ── o estado de cada passo ──
  const act = (name, meta, ...rows) => ({ name, meta, rows });
  const R = rows => rows.map(r => Array.isArray(r) ? r : [r, 'dim']);
  function base() { return { blk: 1, show: {}, on: {}, rows: {}, lk: {}, tags: [], dots: [], cnt: [], res: [], sink: {}, frame: 0 }; }
  function stage(o, blk) {
    o.blk = blk;
    for (const b of BX) if (b.b <= blk && (!b.u || blk <= b.u)) { o.show[b.id] = 1; o.rows[b.id] = act(b.n, pick(b.m, blk), ...R(pick(b.r, blk) || [])); }
    for (const id in LK) if (LK[id].b0 <= blk && blk <= LK[id].b1) o.lk[id] = {};
    if (blk >= 7) o.frame = 'dim';
    if (blk >= 4) shardCols(o, false);
    if (blk >= 6) poolStrip(o, 16, 0, 0);
  }
  const lit = (o, ...ids) => ids.forEach(i => { if (o.show[i]) o.on[i] = 1; });
  const soft = (o, ...ids) => ids.forEach(i => { if (o.show[i] && !o.on[i]) o.on[i] = 2; });
  const bad = (o, ...ids) => ids.forEach(i => { if (o.show[i]) o.on[i] = 'bad'; });
  const sink = (o, id, v = 0.65) => { o.sink[id] = v; bad(o, id); };
  const L = (o, id, st = 1) => { if (o.lk[id]) o.lk[id] = st === 'bad' ? { on: 1, tone: 'bad', flow: 1 } : st === 'on' ? { on: 1 } : { on: 1, flow: 1 }; };
  const rw = (o, id, ...rows) => { if (o.rows[id]) o.rows[id] = { ...o.rows[id], rows: R(rows) }; };
  const blockOn = (o, n, lv = 1) => BX.forEach(b => { if (b.b === n || (n === 4 && ['sp', 'rio', 'rec'].includes(b.id)) || (n === 3 && b.id === 'redis') || (n === 7 && ['sp', 'rio', 'rec'].includes(b.id))) lv === 1 ? lit(o, b.id) : soft(o, b.id); });
  const linksOn = (o, n) => { for (const id in LK) if (LK[id].b0 === n && o.lk[id]) L(o, id, 'on'); };
  function over(o, blk) { stage(o, blk); blockOn(o, blk); linksOn(o, blk); }
  // os shards (16): colunas com a fração das linhas; mk liga o mkt-01
  function shardCols(o, mk, f = 1, four = false) {
    if (!o.rows.shards) return;
    const fr = four ? [20, 20, 20, 40] : mk ? [lin(f, 0, 1, 33.3, 20), lin(f, 0, 1, 33.3, 20), lin(f, 0, 1, 33.3, 60)] : null;
    const names = four ? ['s-0', 's-1', 's-2', 'mkt'] : ['shard-0', 'shard-1', 'shard-2'];
    o.rows.shards = { ...o.rows.shards, rows: [], cols: names.map((n, k) => [n, fr ? fr[k] / 100 : 1 / 3, fr ? Math.round(fr[k]) + '%' : '', fr && fr[k] > 50 ? 'bad' : '']), colMax: 0.6 };
  }
  // o pool de 20 conexões (25): split = 16 ou 0; c e r = quantas casas do cliente e do relatório estão em uso
  function poolStrip(o, split, c, r, tone = '') {
    if (!o.rows.pool) return; const fill = Array(20).fill('');
    for (let i = 0; i < c; i++) fill[i] = 'c'; for (let i = 0; i < r; i++) fill[split ? 16 + i : 19 - i] = tone === 'bad' ? 'b' : 'r';
    o.rows.pool = { ...o.rows.pool, strip: { split, fill } };
  }
  const SVC = ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas', 'relatorios'];

  // ── o que se vê em cada passo ──
  // fb = as peças que a câmera enquadra; m = o módulo do passo (o link do painel)
  const STEPS = {
    fundacoes: [
      { id: 'b1', title: 'A one-server store', yk: 'BLOCK 1 · MODULES 1 TO 5', fb: 'all', dur: 6,
        code: ['the data arrives (1)', 'the data stays (2)', 'the databases agree (3)', 'the data is found (4)', 'the page is fast (5)'],
        story: 'At the start the store is <b>one program and one disk</b>: Lena\'s app, in Recife, talks to the <code>loja</code> server, PostgreSQL holds the <code>pedidos</code> table and Redis holds the cat page. Five problems show up, one per module: the data travels and takes time, the disk burns, the databases disagree, the row gets lost among millions and the page gets slow.',
        look: 'Block 1 pieces light up in sodium. The rest of the store does not exist yet: it shows up block by block, in the other modes.',
        key: 'A one-server store needs five things before anyone thinks about scale.',
        f(o) { over(o, 1); L(o, 'app>loja'); L(o, 'loja>pg'); L(o, 'loja>redis');
          o.cnt = [['PIECES', '7'], ['SERVERS', '1', 'dim'], ['vCPU', '8', 'dim']]; o.res = [['one program, one disk', 'acc']]; } },
      { id: 'chega', m: 1, title: 'The data arrives: DNS, TCP, TLS and HTTP', yk: 'THE PHOTO\'S TRIP', fb: ['app', 'loja', 'cdn'], dur: 7,
        code: ['DNS: finds loja.com.br', 'TCP: opens the connection', 'TLS: encrypts', 'HTTP: asks for the page', '313 KB photo = 215 slices', '  of up to 1,460 B · RTT 80 ms'],
        story: 'Lena opens the app in Recife: DNS finds <code>loja.com.br</code>, TCP opens the connection, TLS encrypts and HTTP asks for the page. The 313 KB photo becomes <b>215 slices</b> of up to 1,460 B, and each round trip to SP costs <b>80 ms</b>.',
        look: 'Tokens leave Lena\'s app and cross over to the loja server; the counter adds up the slices.',
        key: 'Each Recife–SP round trip costs 80 ms.',
        f(o, t) { stage(o, 1); lit(o, 'app', 'loja'); L(o, 'app>loja'); toks(o, ['app>loja'], 0.35);
          const n = Math.round(lin(t, 0.5, 5.5, 0, 215)); rw(o, 'app', ['Lena · Recife', 'acc'], 'DNS · TCP · TLS', 'HTTP', [`slices: ${n} of 215`, 'acc']);
          o.cnt = [['SLICES', String(n)], ['RTT TO SP', '80 ms', 'dim'], ['SLICE', '≤ 1,460 B', 'dim']]; o.res = n >= 215 ? [['the photo arrived', 'acc']] : []; } },
      { id: 'fica', m: 2, title: 'The data stays: RAID 10', yk: 'SMALL WRITE, IN I/Os', fb: ['loja', 'pg', 'disco'], dur: 5,
        code: ['RAID 0 · 1 · 5 · 6 · 10', '     1 · 2 · 4 · 6 · 2', 'pedidos.db: RAID 10 (2 I/Os)', 'photos: object storage', 'RAID 0: the 1st disk that burns', '  takes everything'],
        story: 'With the data arriving, it has to survive a burned disk. <code>pedidos.db</code> goes onto a <b>RAID 10</b>, whose small write costs <b>2 I/Os</b>, and the photos go to <i>object storage</i>. On RAID 0 the write costs 1 I/O and the first disk that burns takes everything.',
        look: 'RAID 10 lights up under the database, tied to it by a cable.',
        key: 'Protection costs I/O: RAID 10 pays 2 per write.',
        f(o) { stage(o, 1); lit(o, 'disco'); soft(o, 'pg'); L(o, 'pg>disco'); L(o, 'loja>pg');
          o.cnt = [['I/Os PER WRITE', '2'], ['RAID', '10', 'dim'], ['ON RAID 0', '1 I/O', 'dim']]; o.res = [['two disks for each piece of data', 'acc']]; } },
      { id: 'concordam', m: 3, title: 'The databases agree: 2-of-3 quorum', yk: 'CAP DURING THE PARTITION', fb: ['sp', 'rio', 'rec'], dur: 6,
        code: ['3 sites: SP · Rio · Recife', 'majority: 2 of 3', 'partition: Recife isolated', '  C: refuse the write', '  A: accept and diverge', 'synchronous write to Recife ~80 ms'],
        story: 'When the data lives in three sites (SP, Rio and Recife), they can lose the network between them. CAP forces a choice, <b>during the partition</b>, between refusing (consistency) and accepting (availability). The majority is the <b>2-of-3 quorum</b>, and the synchronous write to Recife takes ~80 ms.',
        look: 'The Rio–Recife cable turns red: Recife is isolated, and SP with Rio are still a majority.',
        key: 'During the partition, refuse or accept: CAP forces a choice.',
        f(o, t) { stage(o, 1); lit(o, 'sp', 'rio'); L(o, 'sp>rio'); const cut = t > 2;
          if (cut) { bad(o, 'rec'); L(o, 'rio>rec', 'bad'); rw(o, 'rec', 'site 3', ['isolated: refuse?', 'bad']); } else { lit(o, 'rec'); L(o, 'rio>rec'); }
          rw(o, 'sp', 'site 1', ['majority: SP + Rio', 'acc']);
          o.cnt = [['QUORUM', '2 of 3'], ['PARTITION', cut ? 'Recife isolated' : 'none', cut ? 'bad' : 'dim'], ['SYNC WRITE', '~80 ms', 'dim']];
          o.res = cut ? [['C refuses · A accepts and diverges', 'bad']] : []; } },
      { id: 'achado', m: 4, title: 'The data is found: the B-Tree index', yk: 'FINDING 1042', fb: ['loja', 'pg'], dur: 5,
        code: ['SELECT * FROM pedidos', '  WHERE id = 1042;', 'B-Tree index: a few pages', '1 million rows: wins', '6 rows: ties (1 page)'],
        story: 'The <code>pedidos</code> table holds <b>1042</b> (Lena, cat, 89.90). The <b>B-Tree index</b> finds the row in a few page reads. At 1 million rows it beats the scan; at 6 rows it ties, because everything fits in one page.',
        look: 'The database lights up and the 1042 token goes down from the server to the table.',
        key: 'The index wins when the table does not fit in one page.',
        f(o, t) { stage(o, 1); lit(o, 'pg'); soft(o, 'loja'); L(o, 'loja>pg'); fly(o, ['loja>pg'], lin(t, 0.4, 2.6, 0, 0.999), '1042');
          rw(o, 'pg', 'pedidos table', ['1042 · Lena', 'acc'], ['cat · 89.90', 'acc'], 'B-Tree index');
          o.cnt = [['ORDER', '1042'], ['AMOUNT', '89.90', 'dim'], ['INDEX', 'B-Tree', 'dim']]; o.res = [['a few page reads', 'acc']]; } },
      { id: 'rapida', m: 5, title: 'The page is fast: Redis and CDN', yk: 'THE HIT RATE BECOMES MATH', fb: ['app', 'cdn', 'loja', 'redis'], dur: 6,
        code: ['hit rate h = 90%', 'average = h × 1 + (1 − h) × 41', '        = 0.9 × 1 + 0.1 × 41', '        = 5 ms', 'CDN: the photo close to Lena', 'price: 89.90 → 79.90'],
        story: 'Finding fast is still not enough for the page everyone opens. <b>Redis</b> keeps the response, and with a 90% hit rate the average time is 0.9 × 1 + 0.1 × 41 = <b>5 ms</b>. The <b>CDN</b> in Recife brings the photo closer, and the promotion drops the price from <b>89.90 to 79.90</b>.',
        look: 'Redis and the CDN light up; nine out of ten tokens stop at Redis.',
        key: 'The hit rate becomes math: a 90% hit rate gives 5 ms.',
        f(o) { stage(o, 1); lit(o, 'redis', 'cdn'); L(o, 'loja>redis'); L(o, 'app>cdn'); L(o, 'app>loja'); toks(o, ['loja>pg'], 1.2, 'gray');
          rw(o, 'cdn', 'edge in Recife', ['cat: 79.90', 'acc']);
          o.cnt = [['AVERAGE TIME', '5 ms'], ['HIT RATE', '90%', 'dim'], ['PRICE', '79.90', 'dim']]; o.res = [['9 in 10 stop at Redis', 'acc']]; } },
      { id: 'semcache', m: 5, title: 'If it goes wrong: no cache', yk: 'TAKE A PIECE OUT: THE CACHE', fb: ['loja', 'redis', 'pg'], dur: 6, act: ['Turn off the cache', '5 → 41 ms'],
        code: ['without Redis: everything hits the database', 'average = 41 ms (8.2×)', 'catalog at 640 req/s:', '  with an 80% hit rate: 128 to the origin', '  without the cache: 640 to the origin'],
        story: 'Without the cache, the average time goes from <b>5 ms</b> to <b>41 ms</b>, 8.2 times more, and the catalog at 640 req/s sends everything to the origin instead of the 128 req/s that arrive with an 80% hit rate. Modules 5 and 21 warned about it.',
        look: 'Redis sinks and turns red; all the tokens go down to the database, which turns red too.',
        key: 'Take out the cache and the cat page gets 8.2 times slower.',
        f(o, t) { stage(o, 1); sink(o, 'redis'); bad(o, 'pg'); L(o, 'loja>pg', 'bad'); toks(o, ['loja>pg'], 0.25, 'bad');
          const v = Math.round(lin(t, 0.5, 3, 5, 41)); rw(o, 'pg', 'pedidos table', ['everything lands here', 'bad'], `average ${v} ms`, 'B-Tree index');
          o.cnt = [['AVERAGE TIME', v + ' ms', 'bad'], ['TO THE ORIGIN', '640 req/s', 'bad'], ['WITH CACHE', '128 req/s', 'dim']];
          o.res = v >= 41 ? [['8.2× slower', 'bad']] : []; } },
    ],
    partir: [
      { id: 'b2', m: 6, title: 'The program becomes seven services', yk: 'BLOCK 2 · MODULES 6 TO 10', fb: 'all', dur: 7,
        code: ['catalogo · carrinho · pedidos', 'pagamentos · estoque · entregas', 'relatorios: each with its own database', 'checkout: 180 → 200 ms', '  (4 hops of 5 ms)', 'Black Friday: 80 × 25 vCPU'],
        story: 'At 23:00 the report took the whole program down, checkout included. The program becomes <b>7 services</b>, each with <b>its own database</b>, and each new piece solves the problem the previous one created. The price is the network: the 180 ms checkout becomes <b>200 ms</b>, with 4 hops of 5 ms. On Black Friday, instead of 10 copies of the monolith (<b>80 vCPU</b>), only the heavy services scale (<b>25 vCPU</b>). Lena\'s order is <b>1047</b>.',
        look: 'The loja server is gone: seven services take its place. Block 2 lights up in sodium and block 1 turns graphite.',
        key: 'Splitting isolates and scales only what is heavy, and charges for the network.',
        f(o, t) { over(o, 2); fly(o, ['app>gw', 'gw>lb', 'lb>bff', 'bff>pedidos'], (t % 5) / 4, '1047');
          o.cnt = [['CHECKOUT', '200 ms'], ['SERVICES', '7', 'dim'], ['BLACK FRIDAY', '25 vCPU', 'dim']]; o.res = [['each service with its own database', 'acc']]; } },
      { id: 'lb', m: 7, title: 'Distribute: lb-loja', yk: 'WHO SERVES LENA', fb: ['gw', 'lb', 'bff', 'catalogo'], dur: 5,
        code: ['lb-loja · 203.0.113.10', 'round robin: 1 order for each', '3 searches of 900 ms', '  on the same replica = 2.7 s', 'healthcheck 5 s × 3 failures', '  = replica out in 15 s'],
        story: 'With several services and several replicas, someone has to pick the replica. <code>lb-loja</code> (203.0.113.10) uses algorithms, and a round robin that is "fair" in number of orders is not fair in work: 3 searches of 900 ms can land on the same replica and add up to <b>2.7 s</b>. A 5 s <i>healthcheck</i> with 3 failures takes the replica out in <b>15 s</b>.',
        look: 'lb-loja lights up between the door and the BFF, and the tokens pass through it.',
        key: '"Fair" in number of orders is not fair in work.',
        f(o) { stage(o, 2); lit(o, 'lb'); soft(o, 'gw', 'bff'); L(o, 'gw>lb'); L(o, 'lb>bff'); toks(o, ['gw>lb', 'lb>bff'], 0.5);
          o.cnt = [['3 SEARCHES', '2.7 s'], ['HEALTHCHECK', '15 s', 'dim'], ['IP', '203.0.113.10', 'dim']]; o.res = [['fair in number, not in work', 'acc']]; } },
      { id: 'gw', m: 8, title: 'One door: gw-loja', yk: 'THE SINGLE DOOR', fb: ['app', 'gw', 'lb'], dur: 5,
        code: ['no token: 401', 'token without the scope: 403', 'rate limit: token bucket', '/v1 and /v2', 'X-Cliente-Id: lena-77', 'order 1048 · 94.90'],
        story: 'Behind the balancer the app still knew every service. <code>gw-loja</code> brings them behind one door: it validates the <b>JWT</b> (no token, <code>401</code>; token without the scope, <code>403</code>), applies <i>rate limiting</i>, separates <code>/v1</code> from <code>/v2</code> and forwards <code>X-Cliente-Id: lena-77</code>. The order is <b>1048</b>.',
        look: 'The 1048 token leaves the app, passes through gw-loja and goes on to the balancer.',
        key: 'One door, one rule.',
        f(o, t) { stage(o, 2); lit(o, 'gw'); soft(o, 'app', 'lb'); L(o, 'app>gw'); L(o, 'gw>lb'); fly(o, ['app>gw', 'gw>lb'], lin(t, 0.3, 3.3, 0, 0.999), '1048');
          o.cnt = [['ORDER', '1048'], ['NO TOKEN', '401', 'dim'], ['NO SCOPE', '403', 'dim']]; o.res = [['X-Cliente-Id: lena-77', 'acc']]; } },
      { id: 'bff', m: 9, title: 'One screen: bff-app', yk: 'THE APP\'S HOME SCREEN', fb: ['lb', 'bff', 'catalogo', 'pedidos'], dur: 5,
        code: ['without a BFF: 4 calls × 120 ms', '  = 480 ms and 180 KB', 'with bff-app, in parallel:', '  150 ms and 12 KB', 'recomendacoes goes down: waits 100 ms', '  and responds "recomendado": []'],
        story: 'The door is single, but the app\'s home screen still makes 4 calls of 120 ms: <b>480 ms and 180 KB</b>. <code>bff-app</code> makes the calls in parallel and delivers <b>150 ms and 12 KB</b>. If <code>recomendacoes</code> goes down, it waits 100 ms and responds without the section (<code>"recomendado": []</code>).',
        look: 'bff-app calls catalogo and pedidos at the same time.',
        key: 'One BFF per screen gathers the calls and cuts the weight.',
        f(o) { stage(o, 2); lit(o, 'bff'); soft(o, 'catalogo', 'pedidos'); L(o, 'bff>catalogo'); L(o, 'bff>pedidos'); L(o, 'lb>bff', 'on');
          o.cnt = [['SCREEN', '150 ms'], ['BEFORE', '480 ms', 'dim'], ['WEIGHT', '180 → 12 KB', 'dim']]; o.res = [['the 4 calls in parallel', 'acc']]; } },
      { id: 'malha', m: 10, title: 'One standard: the mesh', yk: 'RETRY WITH A RULE', fb: ['mesh', 'pedidos', 'pagamentos', 'estoque'], dur: 5,
        code: ['one sidecar per pod', '30 sidecars = 3 vCPU · 1.5 GB', 'mTLS between the services', 'retry with a rule', 'without a rule: 3 layers × 3', '  = 27 calls per click'],
        story: 'With everything connected, each service repeated retry, timeout and mTLS its own way. The <b>mesh</b> takes that out of the code: one <i>sidecar</i> per pod (30 sidecars add up to <b>3 vCPU and 1.5 GB</b>), mTLS and retry with a rule. Without a rule, 3 layers of 3 attempts make <b>27</b> calls to <code>pagamentos</code> per click.',
        look: 'Each service gets a sidecar (the little square in the corner) and the mesh lights up underneath.',
        key: 'The mesh takes the standard out of the code, and retry without a rule multiplies.',
        f(o) { stage(o, 2); lit(o, 'mesh'); soft(...[o].concat(SVC)); SVC.forEach(id => { o.rows[id] = { ...o.rows[id], side: 1 }; });
          L(o, 'pedidos>pagamentos'); L(o, 'pedidos>estoque');
          o.cnt = [['NO RULE', '27 calls'], ['SIDECARS', '30', 'dim'], ['COST', '3 vCPU · 1.5 GB', 'dim']]; o.res = [['the standard leaves the code', 'acc']]; } },
      { id: 'relat', m: 6, title: 'relatorios goes down on its own', yk: '23:00, WITH SERVICES', fb: ['bff', 'pedidos', 'relatorios', 'catalogo', 'entregas'], dur: 5, act: ['Take down relatorios', '23:00'],
        code: ['relatorios: down', 'catalogo · carrinho · pedidos: ok', 'pagamentos · estoque · entregas: ok', 'blast radius: 1 service'],
        story: 'At 23:00 the heavy report goes down. In the single program, that took the whole store with it. Now <code>relatorios</code> goes down <b>alone</b>: the storefront, the cart and checkout keep selling.',
        look: 'relatorios sinks in red; the checkout tokens keep running.',
        key: 'The blast radius shrank from the whole store to one service.',
        f(o) { stage(o, 2); sink(o, 'relatorios'); lit(o, 'pedidos', 'catalogo'); L(o, 'bff>pedidos'); L(o, 'bff>catalogo'); toks(o, ['bff>pedidos'], 0.5);
          o.cnt = [['DOWN', 'relatorios', 'bad'], ['SELLING', 'yes'], ['RADIUS', '1 of 7', 'dim']]; o.res = [['checkout goes on', 'acc']]; } },
      { id: 'entregas', m: 6, title: 'entregas goes down and the store sells', yk: 'WHO DOES NOT HAVE TO ANSWER RIGHT AWAY', fb: ['bff', 'pedidos', 'pagamentos', 'entregas'], dur: 5, act: ['Take down entregas', 'later'],
        code: ['entregas: down', 'the order is created and paid', 'the PedidoPago event waits', '  in the queue and is delivered', '  when entregas comes back'],
        story: 'Now <code>entregas</code> goes down, which in the single program took all seven with it. The store keeps selling: the <code>PedidoPago</code> event waits in the queue and is delivered when <code>entregas</code> comes back.',
        look: 'entregas sinks; the order tokens go on to pagamentos.',
        key: 'Whoever does not have to answer right away can go down without taking the sale with it.',
        f(o) { stage(o, 2); sink(o, 'relatorios'); sink(o, 'entregas'); lit(o, 'pedidos', 'pagamentos'); L(o, 'bff>pedidos'); L(o, 'pedidos>pagamentos');
          toks(o, ['bff>pedidos', 'pedidos>pagamentos'], 0.6); rw(o, 'pagamentos', 'Checkout', ['PedidoPago: in the queue', 'acc']);
          o.cnt = [['DOWN', 'relatorios, entregas', 'bad'], ['SELLING', 'yes'], ['EVENT', 'waits in the queue', 'dim']]; o.res = [['the sale does not wait for delivery', 'acc']]; } },
      { id: 'semgw', m: 8, title: 'If it goes wrong: no gateway', yk: 'TAKE A PIECE OUT: THE GATEWAY', fb: ['app', 'gw', 'lb', 'catalogo', 'pagamentos', 'entregas'], dur: 5, act: ['Take out the gateway', 'the single door'],
        code: ['without gw-loja:', 'the app knows 6 addresses', 'each service: its own login', 'each service: its own rate limit', 'the 500 req/s bot arrives directly'],
        story: 'Without the gateway, the app knows <b>6 addresses</b>, each service does its own login and <i>rate limiting</i>, and the 500 req/s bot reaches the service directly. Module 8 warned about it.',
        look: 'gw-loja sinks and six services turn red, exposed to the app.',
        key: 'Without the single door, every service becomes a door.',
        f(o) { stage(o, 2); sink(o, 'gw'); bad(o, 'catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'); L(o, 'app>gw', 'bad');
          o.cnt = [['ADDRESSES', '6', 'bad'], ['BOT', '500 req/s', 'bad'], ['LOGIN', '6 ways', 'dim']]; o.res = [['every service becomes a door', 'bad']]; } },
    ],
    conversar: [
      { id: 'b3', title: 'Who gets the last cat?', yk: 'BLOCK 3 · MODULES 11 TO 13', fb: 'all', dur: 6,
        code: ['compete: the lock (11)', 'wait: synchronous (12)', 'do not wait: Kafka (13)', 'each choice trades', '  latency for coupling'],
        story: 'The store ended up with 7 services connected by a door, a screen and a mesh. When they talk, two different problems show up: <b>competing</b> for the same resource (concurrency) and <b>waiting</b> for the response (synchronous) or <b>not waiting</b> (asynchronous).',
        look: 'The lock on Redis, PSP-A, Kafka and the queues light up in sodium.',
        key: 'Competing and waiting are different problems.',
        f(o) { over(o, 3); toks(o, ['pg>kafka', 'kafka>entregas'], 0.8);
          o.cnt = [['CAT STOCK', '1'], ['PSP', '210 ms', 'dim'], ['KAFKA', '3 partitions', 'dim']]; o.res = [['compete, wait, do not wait', 'acc']]; } },
      { id: 'semlock', m: 11, title: 'Bia and Caio, without the lock', yk: 'THE LAST CAT', fb: ['pedidos', 'estoque', 'redis'], dur: 6, act: ['Send Bia and Caio', 'without the lock'],
        code: ['cat stock: 1', 'replica A reads 1 and sells', 'replica B reads 1 and sells', 'stock: 1 − 2 = −1', 'mutex in the process: 2 memories'],
        story: 'Bia and Caio click "buy" at the same instant, and <b>one</b> cat was left. The 2 replicas of <code>estoque</code> read 1 at the same time and both sell: stock goes to <b>−1</b>. A <i>mutex</i> in the process does not fix it, because there are 2 replicas and 2 memories.',
        look: 'Bia\'s and Caio\'s tokens reach stock together, and it turns red at −1.',
        key: 'With 2 replicas, the local mutex protects nothing.',
        f(o, t) { stage(o, 3); const f = lin(t, 0.4, 2.8, 0, 1), done = f >= 1;
          if (!done) { fly(o, ['pedidos>estoque'], f, 'Bia'); fly(o, ['pedidos>estoque'], Math.max(0.001, f - 0.12), 'Caio', 'gray'); }
          if (done) { bad(o, 'estoque'); rw(o, 'estoque', 'Logistics', ['cat: 1 → −1', 'bad']); TB(o, 'estoque', 'sold 2×', 'bad'); } else lit(o, 'estoque');
          L(o, 'pedidos>estoque'); soft(o, 'pedidos');
          o.cnt = [['STOCK', done ? '−1' : '1', done ? 'bad' : 'acc'], ['SOLD', done ? '2' : '0', done ? 'bad' : 'dim'], ['CATS', '1', 'dim']];
          o.res = done ? [['one cat sold twice', 'bad']] : []; } },
      { id: 'lock', m: 11, title: 'With the distributed lock', yk: 'WHOEVER GETS IT FIRST WINS', fb: ['pedidos', 'estoque', 'redis'], dur: 6, act: ['Turn on the lock', 'on Redis'],
        code: ['distributed lock on Redis', 'Bia gets the lock: 1049', '  79.90 + SP shipping 9.00 = 88.90', 'Caio receives 409', '2 ms of CPU + 18 ms of waiting', '  = 50/s at a time · ceiling 500/s'],
        story: 'A <b>distributed lock</b> on Redis comes in. Whoever gets it first wins (Bia, <b>1049</b>, 79.90 + SP shipping 9.00 = 88.90) and the other receives <code>409</code>. The math: 2 ms of CPU + 18 ms of waiting give 50 orders/s at a time and a ceiling of <b>500/s</b>. The study also covers <i>deadlock</i> and <i>starvation</i>.',
        look: 'The cable between stock and Redis lights up; Bia\'s token goes through and Caio\'s comes back red with 409.',
        key: 'The lock decides who wins; the other receives 409.',
        f(o, t) { stage(o, 3); lit(o, 'estoque', 'redis'); soft(o, 'pedidos'); L(o, 'pedidos>estoque'); L(o, 'estoque>redis');
          const f = lin(t, 0.4, 2.6, 0, 1), back = lin(t, 2.6, 4, 0, 1);
          if (f < 1) { fly(o, ['pedidos>estoque'], f, 'Bia'); fly(o, ['pedidos>estoque'], Math.max(0.001, f - 0.12), 'Caio', 'gray'); }
          else if (back < 1) fly(o, ['-pedidos>estoque'], back, '409', 'bad');
          if (f >= 1) { TB(o, 'estoque', 'Bia: 1049'); rw(o, 'estoque', 'Logistics', ['cat: 1 → 0', 'acc'], ['Caio: 409', 'bad']); }
          rw(o, 'redis', 'cache 5 ms', ['lock: Bia', 'acc']);
          o.cnt = [['BIA', f >= 1 ? '1049' : '…'], ['CAIO', f >= 1 ? '409' : '…', 'bad'], ['CEILING', '500/s', 'dim']]; o.res = f >= 1 ? [['one cat, one sale', 'acc']] : []; } },
      { id: 'sinc', m: 12, title: 'Wait: the synchronous call and the webhook', yk: 'THE FORMAT AND THE HOP HAVE A COST', fb: ['pedidos', 'pagamentos', 'psp'], dur: 6,
        code: ['pedidos → pagamentos:', '  REST/JSON × gRPC/Protobuf', '  1050 in Protobuf: 11 bytes', 'the PSP answers in 210 ms', 'webhook: Davi\'s Pix went through', '  order 1050 · charge c-7731'],
        story: 'With the lock solved, what is left is the cost of each call. REST with JSON × gRPC with Protobuf: 1050 in Protobuf is <b>11 bytes</b> (without the gRPC header), and the PSP answers in <b>210 ms</b>. When the PSP says Davi\'s Pix went through without the store asking, that is the <b>webhook</b> for <b>1050</b>; <i>short</i> and <i>long polling</i> ask, the WebSocket keeps the connection open and GraphQL lets the client choose the fields.',
        look: 'The token goes from pagamentos to PSP-A; then the webhook comes back from the PSP without anyone asking.',
        key: 'The format and the hop have a cost.',
        f(o, t) { stage(o, 3); lit(o, 'psp', 'pagamentos'); L(o, 'pagamentos>psp'); const a = lin(t, 0.3, 2.3, 0, 1), b = lin(t, 3, 5, 0, 1);
          if (a < 1) fly(o, ['pagamentos>psp'], a, '1050 · 11 B'); else if (b > 0 && b < 1) fly(o, ['-pagamentos>psp'], b, 'webhook');
          o.cnt = [['PSP', '210 ms'], ['1050 IN PROTOBUF', '11 bytes', 'dim'], ['WEBHOOK', 'c-7731', 'dim']]; o.res = b >= 1 ? [['the PSP said so on its own', 'acc']] : []; } },
      { id: 'kafka', m: 13, title: 'Do not wait: Kafka', yk: 'THE PEDIDOS TOPIC', fb: ['pg', 'kafka', 'entregas', 'filas'], dur: 6,
        code: ['topic pedidos: 3 partitions', 'the pedido_id key decides', '  1049 lands on p0', '4 events per order', 'Black Friday: 120/s on the topic', '  40/s per partition'],
        story: 'Not everything needs a response right away. In <b>Kafka</b>, the <code>pedidos</code> topic has 3 partitions and the <code>pedido_id</code> key picks the partition (1049 lands on <code>p0</code>). Each order generates <b>4 events</b>; on Black Friday that is <b>120/s</b> on the topic and <b>40/s per partition</b>. The <code>estoque</code>, <code>entregas</code> and <code>notificacoes</code> groups consume, and the <b>DLQ</b> holds the message that cannot be processed. MQTT talks to the truck and AMQP to the emails.',
        look: 'The events leave the database for Kafka and go down to entregas.',
        key: 'The key decides the partition, and order only holds inside it.',
        f(o) { stage(o, 3); lit(o, 'kafka', 'filas'); soft(o, 'entregas'); L(o, 'pg>kafka'); L(o, 'kafka>entregas'); toks(o, ['pg>kafka', 'kafka>entregas'], 0.45);
          rw(o, 'kafka', 'topic pedidos', ['1049 → p0', 'acc'], '4 events/order', 'DLQ');
          o.cnt = [['EVENTS', '120/s'], ['PER PARTITION', '40/s', 'dim'], ['1049', 'p0', 'dim']]; o.res = [['nobody waits for delivery', 'acc']]; } },
      { id: 'semdlq', m: 13, title: 'If it goes wrong: no DLQ', yk: 'THE MESSAGE THAT BLOCKS THE PARTITION', fb: ['kafka', 'filas', 'entregas'], dur: 7, act: ['Take out the DLQ', 'an invalid email'],
        code: ['notificacoes: email for 1051', 'provider: 550 invalid address', 'without a DLQ: the message comes back', '  forever and blocks p0', 'at 40 events/s:', '  +2,400 events per minute'],
        story: 'The DLQ holds the message that cannot be processed. Without it, the invalid email for 1051 comes back forever and <b>blocks p0</b>: at 40 events/s, the queue behind the bad message grows <b>2,400 events per minute</b>. Module 13 warned about it.',
        look: 'Kafka turns red and the counter of events stuck on p0 goes up.',
        key: 'One bad message without a DLQ stops the whole partition.',
        f(o, t) { stage(o, 3); bad(o, 'kafka', 'filas'); L(o, 'pg>kafka', 'bad'); toks(o, ['pg>kafka'], 0.3, 'bad');
          const n = lin(t, 0.5, 6, 0, 2400); rw(o, 'kafka', 'topic pedidos', ['p0 blocked', 'bad'], [`stuck: ${thou(n)}`, 'bad'], 'no DLQ');
          o.cnt = [['STUCK ON P0', thou(n), 'bad'], ['RATE', '40/s', 'dim'], ['PER MINUTE', '2,400', 'bad']]; o.res = n >= 2400 ? [['one minute of p0 blocked', 'bad']] : []; } },
    ],
    crescer: [
      { id: 'b4', title: '20:03: Black Friday measures the store', yk: 'BLOCK 4 · MODULES 14 TO 17', fb: 'all', dur: 6,
        code: ['measure (14)', 'choose the axis (15)', 'split by a key (16)', 'copy (17)', 'ordinary day: 5 orders/s', '20:03 peak: 30/s'],
        story: 'The block 3 store works on an ordinary day, at 5 orders per second. At <b>20:03</b> on Black Friday the peak reaches 30 per second and almost everything it built starts being measured for real. Growing is not buying machines: it is knowing <b>what</b> is slow and <b>where</b> to cut.',
        look: 'Measurement, the cube, the shards and the replicas at the sites light up in sodium.',
        key: 'Growing is measuring, choosing the axis, splitting and copying.',
        f(o) { over(o, 4); toks(o, ['bff>pedidos', 'pedidos>pg'], 0.25);
          o.cnt = [['PEAK', '30/s'], ['ORDINARY DAY', '5/s', 'dim'], ['P95 GOAL', '≤ 300 ms', 'dim']]; o.res = [['measure before growing', 'acc']]; } },
      { id: 'medir', m: 14, title: 'Measure: the average misleads', yk: 'THE 100 REQUESTS OF 20:03', fb: ['metr', 'catalogo', 'pagamentos', 'relatorios'], dur: 5,
        code: ['average 135 ms · p50 32 ms', 'p95 800 ms · p99 2,000 ms', 'catalogo-3 at 99%', 'fleet: (9 × 64 + 99) ÷ 10 = 67.5%', 'weakest link: pagamentos 40/s', 'final ceiling: the database, 150/s'],
        story: 'The average is <b>135 ms</b> and the p50 is <b>32 ms</b>, but the p95 is <b>800 ms</b> and the p99 is <b>2,000 ms</b>. <code>catalogo-3</code> is at 99% and the whole fleet reads <b>67.5%</b>: (9 × 64 + 99) ÷ 10. The weakest link rules: <code>pagamentos</code> does <b>40/s</b> and the <code>pedidos</code> database, <b>150/s</b>. Davi\'s order is <b>1052</b>.',
        look: 'Measurement lights up; catalogo shows the hot replica and pagamentos turns red: it is the weakest link.',
        key: 'The average hides; the weakest link rules.',
        f(o) { stage(o, 4); lit(o, 'metr', 'catalogo', 'pg'); bad(o, 'pagamentos');
          rw(o, 'catalogo', ['catalogo-3: 99%', 'bad'], 'fleet: 67.5%'); rw(o, 'pagamentos', ['40 orders/s', 'bad'], 'the weakest link'); rw(o, 'pg', 'pedidos table', 'primary in SP', ['database: 150/s', 'acc'], 'B-Tree index');
          rw(o, 'metr', ['p95 800 ms', 'acc'], 'average 135 ms');
          o.cnt = [['P95', '800 ms'], ['AVERAGE', '135 ms', 'dim'], ['WEAKEST LINK', '40/s', 'bad']]; o.res = [['the average dashboard says: all fine', 'bad']]; } },
      { id: 'cubo', m: 15, title: 'Choose the axis: the cube', yk: 'X, Y AND Z', fb: ['cubo', 'bff', 'catalogo', 'pedidos'], dur: 6,
        code: ['X: clone (replicas)', 'Y: split by function (services)', 'Z: split by data (customers)', '(10, 9, 1) → (10, 9, 3)', 'output: 90 → 150 → 200 orders/s', 'order 1053 · Caio'],
        story: 'With the bottleneck measured, what is left is how to grow. On the cube, <b>X</b> clones (replicas), <b>Y</b> splits by function (services) and <b>Z</b> splits by data (customers). The store goes from <b>(10, 9, 1)</b> to <b>(10, 9, 3)</b>, and the output rises from <b>90 to 150 to 200</b> orders per second. Caio\'s order is <b>1053</b>.',
        look: 'The cube lights up; Z points to the shards just below the database.',
        key: 'X clones, Y splits by function, Z splits by data.',
        f(o, t) { stage(o, 4); lit(o, 'cubo'); soft(o, 'shards', 'catalogo', 'pedidos');
          const v = t < 2 ? 90 : t < 4 ? 150 : 200; rw(o, 'cubo', 'X · Y · Z', [t < 2 ? '(10, 9, 1)' : '(10, 9, 3)', 'acc']);
          o.cnt = [['OUTPUT', v + '/s'], ['COORDINATES', t < 2 ? '(10, 9, 1)' : '(10, 9, 3)', 'dim'], ['ORDER', '1053', 'dim']]; o.res = v >= 200 ? [['Z: 3 only on pedidos', 'acc']] : []; } },
      { id: 'shards', m: 16, title: 'Split by a key: 3 shards', yk: 'MURMUR3(CLIENTE_ID) MOD 3', fb: ['pg', 'shards', 'disco', 'pool'], dur: 5,
        code: ['3 shards by cliente_id', 'murmur3 over 50 million rows', 'lena-77 → shard-1: the 1054', 'mod 3 → 4: moves 75.2%', 'ring: moves 25.7%', 'shuffle: 45 pairs'],
        story: 'The Z axis needs a key. That is <b>3 <i>shards</i></b> by <code>cliente_id</code> with <code>murmur3</code> over <b>50 million</b> rows, and Lena\'s 1054 lands on <code>shard-1</code>. Going from 3 to 4 shards moves <b>75.2%</b> of the data with <code>mod</code> and <b>25.7%</b> with the ring. The <i>shuffle</i> forms <b>45</b> pairs.',
        look: 'The shards light up under the database; the 1054 token goes down to shard-1.',
        key: 'The key decides where each row goes.',
        f(o, t) { stage(o, 4); lit(o, 'shards'); soft(o, 'pg'); fly(o, ['pedidos>pg'], lin(t, 0.3, 2.3, 0, 0.999), '1054');
          if (t > 2.3) TB(o, 'shards', 'lena-77 → shard-1');
          o.cnt = [['1054', 'shard-1'], ['ROWS', '50 million', 'dim'], ['MOD 3 → 4', '75.2%', 'dim']]; o.res = [['ring: only 25.7% moves', 'acc']]; } },
      { id: 'mkt', m: 16, title: 'mkt-01 heats up shard-2', yk: 'THE HOT SHARD', fb: ['pg', 'shards', 'disco', 'pool'], dur: 6, act: ['Turn on mkt-01', '40% of the rows'],
        code: ['mkt-01: 40% of the pedidos table', 'shard-2: 60% · the others: 20%', 'efficiency = average ÷ largest', '  = 33.3% ÷ 60% = 55.6%'],
        story: '<code>mkt-01</code>, the partner marketplace, has 40% of the rows and leaves <code>shard-2</code> with <b>60%</b>. The other two get 20% each, and the cluster\'s efficiency drops to <b>55.6%</b>: the fullest shard rules.',
        look: 'The shard-2 column grows to 60% and turns red.',
        key: 'The key decides what heats up.',
        f(o, t) { stage(o, 4); const f = lin(t, 0.4, 3, 0, 1); shardCols(o, true, f); f >= 1 ? bad(o, 'shards') : lit(o, 'shards');
          const e = 100 / 3 / lin(f, 0, 1, 33.3, 60) * 100;
          o.cnt = [['EFFICIENCY', (f >= 1 ? '55.6' : e.toFixed(1)) + '%', f >= 1 ? 'bad' : 'acc'], ['SHARD-2', Math.round(lin(f, 0, 1, 33.3, 60)) + '%', f >= 1 ? 'bad' : 'dim'], ['MKT-01', '40%', 'dim']];
          o.res = f >= 1 ? [['the fullest shard rules', 'bad']] : []; } },
      { id: 'copiar', m: 17, title: 'Copy: primary and replicas', yk: 'LATENCY OR DATA', fb: ['sp', 'rio', 'rec', 'pg'], dur: 6,
        code: ['primary: pg-sp', 'replicas: pg-rio and pg-recife', 'commit: 2 ms (asynchronous)', '  12 ms (semi) · 82 ms (synchronous)', 'lag: Rio 300 ms · Recife 800 ms', 'RPO 9 to 24 orders · RTO 35 s'],
        story: 'Splitting does not protect against a burned disk: each shard needs a replica. With the primary in SP and replicas in Rio and Recife, the commit costs <b>2 ms</b> (asynchronous), <b>12 ms</b> (semi) or <b>82 ms</b> (synchronous). The lag is <b>300 ms</b> in Rio and <b>800 ms</b> in Recife; the RPO is <b>9 to 24</b> orders and the RTO, <b>35 s</b>. Lena does not see <b>1055</b>: she reads the Recife replica, 800 ms behind.',
        look: 'Two cables leave the primary in SP: one to Rio and an arc to Recife, which arrives 800 ms behind.',
        key: 'Each copy costs either latency or data.',
        f(o, t) { stage(o, 4); lit(o, 'sp', 'rio'); L(o, 'sp>rio'); L(o, 'sp~rec'); const late = t > 1.5 && t < 4;
          late ? bad(o, 'rec') : lit(o, 'rec'); rw(o, 'rec', 'pg-recife · replica', [late ? 'no 1055 yet' : 'lag 800 ms', late ? 'bad' : 'dim']);
          if (late) TB(o, 'rec', 'Lena: where is 1055?', 'bad');
          o.cnt = [['RECIFE LAG', '800 ms', 'bad'], ['COMMIT', '2 · 12 · 82 ms', 'dim'], ['RTO', '35 s', 'dim']]; o.res = [['Lena reads the past', 'bad']]; } },
      { id: 'semrep', m: 17, title: 'If it goes wrong: no replicas', yk: 'TAKE A PIECE OUT: THE REPLICAS', fb: ['sp', 'rio', 'rec', 'pg', 'shards'], dur: 5, act: ['Take out the replicas', 'shard-1 goes down'],
        code: ['without replicas:', 'shard-1 goes down', 'Lena and Bia: no orders', 'a burned disk takes the data'],
        story: 'Without replicas, <code>shard-1</code> goes down and Lena and Bia <b>are left with no orders</b>, and a burned disk takes the data. Modules 16 and 17 warned about it.',
        look: 'shard-1 turns red and the Rio and Recife replicas go dark.',
        key: 'Splitting without copying swaps one fragile database for three.',
        f(o) { stage(o, 4); bad(o, 'shards'); o.rows.shards.cols[1] = ['shard-1', 1 / 3, 'down', 'bad'];
          rw(o, 'rio', 'no replica', ['nothing to promote', 'bad']); rw(o, 'rec', 'no replica', ['nothing to promote', 'bad']); bad(o, 'rio', 'rec');
          TB(o, 'shards', 'Lena and Bia: no orders', 'bad');
          o.cnt = [['SHARD-1', 'down', 'bad'], ['LENA AND BIA', 'no orders', 'bad'], ['REPLICAS', '0', 'bad']]; o.res = [['one disk takes the data', 'bad']]; } },
    ],
    consistencia: [
      { id: 'b5', title: 'Without a transaction that covers everything', yk: 'BLOCK 5 · MODULES 18 TO 21', fb: 'all', dur: 6,
        code: ['read from another model (18)', 'compensate (19)', 'store the facts (20)', 'fail small and fast (21)'],
        story: 'The data ended up spread across shards and replicas, and three symptoms showed up: Lena\'s screen reads the <b>past</b>, the payment was approved and the stock had already hit zero, and the PSP answered in 8 s. There is no longer a single transaction that covers everything, so consistency comes in <b>three ways</b> and the store stays up through <b>layers</b>.',
        look: 'meus-pedidos, the saga, the event store and PSP-B light up in sodium.',
        key: 'Without a global transaction: read from another model, compensate, store the facts.',
        f(o) { over(o, 5); toks(o, ['pg>kafka', 'kafka>mp'], 0.7);
          o.cnt = [['MODULES', '18 to 21'], ['PSP-A', '8 s', 'bad'], ['GLOBAL TRANSACTION', 'none', 'dim']]; o.res = [['the right data by another route', 'acc']]; } },
      { id: 'cqrs', m: 18, title: 'Read from another model: CQRS and outbox', yk: 'ORDER 1056', fb: ['pg', 'kafka', 'mp', 'es'], dur: 6,
        code: ['outbox: the event in the same', '  transaction as order 1056', 'projector: 100 events/s', 'meus_pedidos:lena-77 = 1,787 B', 'report: 235 ms → 0.021 ms'],
        story: 'The "my orders" screen now reads from <code>meus-pedidos</code>, a model built for reading. The <b>outbox</b> writes the event in the same transaction as the order, and the projector updates the model at 100 ev/s. Lena\'s document is <b>1,787 B</b>, and the report drops from <b>235 ms to 0.021 ms</b>. The order is <b>1056</b>.',
        look: 'The event leaves the outbox in the database, passes through Kafka and reaches meus-pedidos.',
        key: 'Read from a model built for reading.',
        f(o, t) { stage(o, 5); lit(o, 'mp', 'pg'); soft(o, 'kafka'); L(o, 'pg>kafka'); L(o, 'kafka>mp'); fly(o, ['pg>kafka', 'kafka>mp'], lin(t, 0.3, 3.3, 0, 0.999), '1056');
          rw(o, 'pg', 'pedidos table', ['+ outbox', 'acc'], 'same transaction', 'B-Tree index');
          o.cnt = [['DOCUMENT', '1,787 B'], ['PROJECTOR', '100 ev/s', 'dim'], ['REPORT', '0.021 ms', 'dim']]; o.res = [['the screen reads the projection', 'acc']]; } },
      { id: 'saga', m: 19, title: 'Compensate: saga s-1057', yk: 'NO GLOBAL ROLLBACK', fb: ['saga', 'pagamentos', 'estoque', 'psp'], dur: 6,
        code: ['s-1057: PAID → RESERVING', 'stock hit zero (damage)', 'without a global ROLLBACK:', '  compensates with estorno-c-7732', 'success: 0.9 × 0.95 = 85.5%', 'backoff: 1 · 2 · 4 · 8 · 16 s'],
        story: 'Davi\'s payment was approved and stock hit zero (<code>s-1057</code>): with no global <code>ROLLBACK</code>, the saga <b>compensates</b> with <code>estorno-c-7732</code>. Orchestrated, a conductor decides; choreographed, each service reacts to events. With 10% failure on stock and 5% on payment, success is <b>85.5%</b>, and the <i>backoff</i> waits <b>1 · 2 · 4 · 8 · 16 s</b>. The order is <b>1057</b>.',
        look: 'The saga lights up; stock turns red and the refund goes back from pagamentos to the PSP.',
        key: 'Without a global transaction, you compensate.',
        f(o, t) { stage(o, 5); lit(o, 'saga', 'pagamentos'); bad(o, 'estoque'); L(o, 'pagamentos>psp'); const b = lin(t, 1.5, 3.8, 0, 1);
          rw(o, 'estoque', ['CAMISETA-015', 'bad'], ['1 → 0: damage', 'bad']); rw(o, 'saga', ['s-1057', 'acc'], t < 1.5 ? 'PAID → RESERVING' : ['COMPENSATING', 'bad']);
          if (b > 0 && b < 1) fly(o, ['pagamentos>psp'], b, 'refund');
          o.cnt = [['SUCCESS', '85.5%'], ['REFUND', 'c-7732', b >= 1 ? 'acc' : 'dim'], ['BACKOFF', '31 s', 'dim']]; o.res = b >= 1 ? [['saga cancelled, Pix refunded', 'acc']] : []; } },
      { id: 'es', m: 20, title: 'Store the facts: the event store', yk: 'THE PEDIDO-1047 STREAM', fb: ['kafka', 'es', 'mp'], dur: 5,
        code: ['pedido-1047 stream:', '  e-501 · e-502 · e-504 · e-505', 'state = replay the events', 'without a snapshot: ~1,800 ms', 'with a snapshot: ~13 ms', 'full replay: 2 h 47 min'],
        story: 'In <i>event sourcing</i>, the state of <code>pedido-1047</code> is the result of replaying the stream\'s events. Without a <i>snapshot</i> the rehydration takes ~<b>1,800 ms</b>; with it, ~<b>13 ms</b>. A full <i>replay</i> takes <b>2 h 47 min</b>.',
        look: 'The event store lights up and the events go down from Kafka to it.',
        key: 'The state is the sum of the facts; the snapshot shortens the replay.',
        f(o) { stage(o, 5); lit(o, 'es'); soft(o, 'kafka'); L(o, 'kafka>es'); toks(o, ['kafka>es'], 0.5); rw(o, 'es', ['pedido-1047', 'acc'], 'snapshot 13 ms');
          o.cnt = [['WITH SNAPSHOT', '13 ms'], ['WITHOUT', '1,800 ms', 'dim'], ['REPLAY', '2 h 47 min', 'dim']]; o.res = [['the state is the sum of the facts', 'acc']]; } },
      { id: 'breaker', m: 21, title: 'PSP-A at 8 s, with the breaker', yk: 'FAIL SMALL AND FAST', fb: ['pagamentos', 'psp', 'pspb', 'pool'], dur: 6, act: ['Take down PSP-A', 'with the breaker'],
        code: ['20:20: PSP-A answers in 8 s', 'PSP timeout: 1 s (critical 1.67 s)', 'the breaker opens in 1.3 s', 'PSP-B takes over (p50 300 ms)', 'outbound bulkheads: 50/30/20', 'Idempotency-Key: the retry does not duplicate'],
        story: 'With the data right, what is left is surviving PSP-A at 8 s. The PSP <i>timeout</i> drops to <b>1 s</b> (the critical one is 50 ÷ 30 = <b>1.67 s</b>), retry uses <i>full jitter</i>, the <i>breaker</i> opens in <b>1.3 s</b> and PSP-B takes over. The outbound <i>bulkheads</i> split the pool into <b>50/30/20</b>, and the <code>Idempotency-Key</code> keeps retry from duplicating. Caio\'s order is <b>1058</b>.',
        look: 'PSP-A\'s cable turns red; when the breaker opens, the tokens start going to PSP-B.',
        key: 'Fail fast and switch paths.',
        f(o, t) { stage(o, 5); bad(o, 'psp'); const open = t > 1.3; lit(o, 'pagamentos'); open ? lit(o, 'pspb') : soft(o, 'pspb');
          L(o, 'pagamentos>psp', 'bad'); if (open) { L(o, 'pagamentos>pspb'); toks(o, ['pagamentos>pspb'], 0.4); } else toks(o, ['pagamentos>psp'], 0.3, 'bad');
          rw(o, 'pagamentos', ['breaker: ' + (open ? 'open' : 'closed'), open ? 'acc' : 'dim'], 'timeout 1 s'); rw(o, 'psp', ['8 s', 'bad'], '20:20:00–20:21:30');
          if (open) TB(o, 'pspb', 'PSP-B takes over');
          o.cnt = [['BREAKER', open ? 'open' : 'closed', open ? 'acc' : 'dim'], ['PSP-A', '8 s', 'bad'], ['PSP-B', 'p50 300 ms', 'dim']]; o.res = open ? [['1058 goes through PSP-B', 'acc']] : []; } },
      { id: 'sembreaker', m: 21, title: 'If it goes wrong: no breaker', yk: 'TAKE A PIECE OUT: THE BREAKER', fb: ['pagamentos', 'psp', 'entregas', 'filas', 'pspb'], dur: 6, act: ['Take out the breaker', 'and the fallback'],
        code: ['the PSP at 8 s, 30 orders/s', 'pool of 50 connections to the PSP', '50 ÷ 30 = 1.67 s to fill up', 'pool full: shipping and email', '  wait along with it'],
        story: 'Without the <i>breaker</i> and the <i>fallback</i>, the PSP at 8 s fills the pool of 50 in <b>1.67 s</b> and takes shipping and email down with it. Module 21 warned about it.',
        look: 'The pagamentos pool fills up and turns red; then entregas and the queues turn red.',
        key: 'Without the breaker, a slow neighbor takes over the whole pool.',
        f(o, t) { stage(o, 5); bad(o, 'psp'); L(o, 'pagamentos>psp', 'bad'); toks(o, ['pagamentos>psp'], 0.2, 'bad'); const n = Math.min(50, Math.round(t * 30)), full = n >= 50;
          full ? bad(o, 'pagamentos', 'entregas', 'filas') : lit(o, 'pagamentos'); o.rows.pagamentos = { ...o.rows.pagamentos, rows: R([[`pool: ${n} of 50`, full ? 'bad' : 'acc']]), bars: [['', n / 50, full ? 'bad' : '']] };
          o.cnt = [['POOL', n + ' of 50', full ? 'bad' : 'acc'], ['FILLS IN', '1.67 s', 'bad'], ['PSP-A', '8 s', 'bad']]; o.res = full ? [['shipping and email wait along with it', 'bad']] : []; } },
    ],
    operar: [
      { id: 'b6', title: 'Changing without a net', yk: 'BLOCK 6 · MODULES 22 TO 25', fb: 'all', dur: 6,
        code: ['release with a small radius (22)', 'plan for the peak (23)', 'test the plan (24)', 'split what is shared (25)'],
        story: 'The block 5 store survives one failure at a time, but it <b>changes without a net</b>: every new version goes straight to the customers. The most common cause of incidents is change, and the four pieces in this block <b>anticipate</b> the incident instead of reacting to it.',
        look: 'The pipeline, the plan, k6 and the 16 + 4 pool light up in sodium.',
        key: 'Anticipate the incident instead of reacting to it.',
        f(o) { over(o, 6); toks(o, ['pedidos>pool', 'pool>pg'], 0.5); poolStrip(o, 16, 2, 4);
          o.cnt = [['MODULES', '22 to 25'], ['VERSION', '2.4.0', 'dim'], ['BF 2027', 'Nov 26', 'dim']]; o.res = [['anticipate, do not react', 'acc']]; } },
      { id: 'canary', m: 22, title: '2.5.0 by canary: R$ 450', yk: 'A DEPLOY\'S RADIUS', fb: ['pipe', 'pedidos', 'pool', 'relatorios'], dur: 6, act: ['Release by canary', '10%'],
        code: ['2.5.0: 201 with shipping 0.00', '  in Recife: healthy and wrong', 'canary: 10 → 50 → 100%', 'radius = fraction × time × cost', '10% canary: R$ 450', 'the business metric catches the shipping'],
        story: '<code>pedidos</code> goes from 2.4.0 to 2.5.0, which returns <code>201</code> with <b>shipping 0.00</b> in Recife: healthy, no error, wrong. With the <i>canary</i>, only 10% receive 2.5.0, and the business metric catches the zeroed shipping. The radius is fraction × time × cost: <b>R$ 450</b>. Lena\'s order is <b>1059</b>.',
        look: 'The pipeline lights up and 2.5.0 reaches a small slice of pedidos.',
        key: 'A deploy\'s radius is fraction × time × cost.',
        f(o, t) { stage(o, 6); lit(o, 'pipe'); const f = t > 1.5 ? 0.1 : lin(t, 0.3, 1.5, 0, 0.1); lit(o, 'pedidos');
          o.rows.pedidos = { ...o.rows.pedidos, rows: R(['2.4.0: 90%', [`2.5.0: ${Math.round(f * 100)}%`, 'bad']]), bars: [['', f, 'bad']] };
          if (t > 3) TB(o, 'pedidos', 'shipping 0.00: caught', 'acc');
          o.cnt = [['LOSS', 'R$ 450'], ['FRACTION', Math.round(f * 100) + '%', 'dim'], ['SHIPPING', '0.00', 'bad']]; o.res = t > 3 ? [['rollback at 10%', 'acc']] : []; } },
      { id: 'plano', m: 23, title: 'Plan for the peak: 41 vCPU', yk: 'LITTLE AND THE TARGET Ρ', fb: ['plano', 'catalogo', 'pedidos', 'pagamentos', 'estoque'], dur: 5,
        code: ['BF Nov 26, 2027', 'L = λ × W · target ρ 70%', 'catalogo 14 · pedidos 10', 'pagamentos 15 · estoque 2', '= 41 vCPU', 'for 950 req/s and 200 orders/s'],
        story: 'Changing well does not say whether the store survives <b>Black Friday on November 26, 2027</b>. Little\'s Law (L = λ × W) and the <b>70%</b> target ρ (near the knee the wait explodes) give the plan for <code>catalogo</code>, <code>pedidos</code>, <code>pagamentos</code> and <code>estoque</code>: <b>14 · 10 · 15 · 2 = 41 vCPU</b>, for 950 req/s and 200 orders/s.',
        look: 'The plan lights up and each service shows its share of the 41 vCPU.',
        key: 'Plan before the peak, with Little and a 70% target ρ.',
        f(o) { stage(o, 6); lit(o, 'plano', 'catalogo', 'pedidos', 'pagamentos', 'estoque');
          [['catalogo', 14], ['pedidos', 10], ['pagamentos', 15], ['estoque', 2]].forEach(([id, v]) => rw(o, id, [`plan: ${v} vCPU`, 'acc']));
          o.cnt = [['PLAN', '41 vCPU'], ['CATALOG', '950 req/s', 'dim'], ['CHECKOUT', '200/s', 'dim']]; o.res = [['14 + 10 + 15 + 2 = 41', 'acc']]; } },
      { id: 'k6', m: 24, title: 'Test the plan: k6', yk: 'THE TEST GOALS', fb: ['k6', 'pedidos', 'pool', 'relatorios', 'pg'], dur: 7,
        code: ['goals: p95 ≤ 800 ms', '       errors ≤ 0.1%', '"today" breaks at 36/s', '"plan" reaches ~250/s', 'mixed scenario: the 23:00', '  report fights for the pool'],
        story: 'A plan without a test is a hypothesis. k6 shows that the store "today" breaks at <b>36/s</b> and the "plan" reaches <b>~250/s</b>, with goals of p95 ≤ <b>800 ms</b> and errors ≤ <b>0.1%</b>. The mixed scenario finds what the math did not: the <b>23:00 report</b> fighting for the pool.',
        look: 'The k6 tokens climb onto checkout; relatorios lights up alongside in the mixed scenario and fights for the pool.',
        key: 'A plan without a test is a hypothesis.',
        f(o, t) { stage(o, 6); lit(o, 'k6', 'pedidos'); const r = Math.round(lin(t, 0.4, 5, 0, 250)), mix = t > 3; mix ? bad(o, 'relatorios', 'pool') : soft(o, 'pool');
          L(o, 'pedidos>pool'); L(o, 'pool>pg'); toks(o, ['pedidos>pool', 'pool>pg'], 0.25); poolStrip(o, 0, mix ? 4 : 8, mix ? 16 : 0, mix ? 'bad' : '');
          rw(o, 'k6', [`load: ${r}/s`, 'acc'], 'today breaks: 36/s'); if (mix) TB(o, 'relatorios', 'mixed: the report', 'bad');
          o.cnt = [['LOAD', r + '/s'], ['BREAKS TODAY', '36/s', 'bad'], ['P95 GOAL', '≤ 800 ms', 'dim']]; o.res = mix ? [['the report fights for the pool', 'bad']] : []; } },
      { id: 'pool', m: 25, title: 'Split what is shared: 16 + 4', yk: 'THE PEDIDOS DATABASE POOL', fb: ['pedidos', 'pool', 'pg', 'relatorios', 'shards'], dur: 6,
        code: ['pool of 20 connections', '  16: checkout and status', '  4: the 23:00 report', '503: 33% and 10% → 0', 'hot shard radius: 60% → 40%', 'lanes 12 · 6 · 2'],
        story: 'The test\'s finding has a remedy: the <b>20-connection</b> pool becomes <b>16 + 4</b>. Without the split, the report leaves <b>33%</b> of checkout and <b>10%</b> of status with <code>503</code>. With it, the hot shard\'s radius drops from <b>60% to 40%</b>. The <i>lanes</i> are <b>12 · 6 · 2</b> and <code>mkt-01</code> has a ceiling of 100 req/s on the catalog.',
        look: 'The pool lights up between pedidos and the database: the report stays in its 4 and the customer\'s 16 stay free.',
        key: 'The bulkhead chooses who waits.',
        f(o, t) { stage(o, 6); lit(o, 'pool'); soft(o, 'pedidos', 'relatorios'); L(o, 'pedidos>pool'); L(o, 'pool>pg'); toks(o, ['pedidos>pool', 'pool>pg'], 0.35);
          poolStrip(o, 16, 2, Math.round(lin(t, 0.4, 2.4, 0, 4))); shardCols(o, true, 1, true); rw(o, 'pool', '16 + 4', ['customer 503: 0', 'acc']);
          o.cnt = [['CHECKOUT 503', '0'], ['POOL', '16 + 4', 'dim'], ['RADIUS', '60% → 40%', 'dim']]; o.res = [['the report waits, the customer does not', 'acc']]; } },
      { id: 'rolling', m: 22, title: 'If it goes wrong: 2.5.0 by rolling', yk: 'TAKE A PIECE OUT: THE CANARY', fb: ['pipe', 'pedidos', 'pool', 'relatorios'], dur: 8, act: ['Release by rolling', 'without a canary'],
        code: ['rolling: 90 s to 100%', 'shipping 0.00 for everyone', 'lasts 60 min: R$ 54,000', 'if only the 23:00 report', '  finds it: R$ 486,000'],
        story: 'With <i>rolling</i>, 2.5.0 reaches everyone in 90 s, and without the <i>canary</i> and the business metric shipping 0.00 lasts <b>60 min</b> and costs <b>R$ 54,000</b> (or <b>R$ 486,000</b>, if only the 23:00 report finds it). Modules 22, 24 and 25 warned about it.',
        look: '2.5.0 takes over all of pedidos, which turns red, and the loss climbs on the panel.',
        key: 'Without a canary, the defect reaches everyone.',
        f(o, t) { stage(o, 6); lit(o, 'pipe'); bad(o, 'pedidos'); const f = lin(t, 0.3, 2.5, 0, 1), loss = lin(t, 2.5, 7, 450, 54000);
          o.rows.pedidos = { ...o.rows.pedidos, rows: R([[`2.5.0: ${Math.round(f * 100)}%`, 'bad'], ['shipping 0.00', 'bad']]), bars: [['', f, 'bad']] };
          o.cnt = [['LOSS', 'R$ ' + thou(t < 2.5 ? 0 : loss), 'bad'], ['FRACTION', Math.round(f * 100) + '%', 'bad'], ['CANARY', 'R$ 450', 'dim']]; o.res = loss >= 54000 ? [['60 min of free shipping', 'bad']] : []; } },
    ],
    celulas: [
      { id: 'b7', title: 'Where a failure can reach', yk: 'BLOCK 7 · MODULES 26 TO 28', fb: 'all', dur: 6,
        code: ['divide the stack (26)', 'come back from the disaster (27)', 'know (28)'],
        story: 'A bulkhead separates resources <b>inside</b> one stack, and the <code>mkt-01</code> poison pill showed that this is not enough when the whole stack goes down together. The last block does not add a feature: it says <b>where a failure can reach</b>, <b>how you come back</b> when a region goes down and <b>how you know</b> what happened.',
        look: 'edge-loja, the four cells, DR and the signals light up; the frame marks celula-recife, a whole stack.',
        key: 'Cells, DR and signals sell nothing: they limit and show the failure.',
        f(o) { over(o, 7); o.frame = 'acc'; toks(o, ['app>edge', 'edge>gw'], 0.6);
          o.cnt = [['CELLS', '4'], ['VERSION', '@2.6.0', 'dim'], ['MODULES', '26 to 28', 'dim']]; o.res = [['the whole stack becomes a compartment', 'acc']]; } },
      { id: 'celulas', m: 26, title: 'Divide the stack: 4 cells', yk: 'EDGE-LOJA AND THE MAP', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt'], dur: 6,
        code: ['celula-sp 33% · celula-rio 15%', 'celula-recife 12% · celula-mkt 40%', 'edge-loja: cliente_id → map', 'shuffle 2 of 10: 1 ÷ 45 = 2.2%', '2027 plan: 41 → 53 vCPU', 'order 1060 · celula-recife'],
        story: 'The whole stack becomes <b>4 cells</b>: <code>celula-sp</code> (33%), <code>celula-rio</code> (15%), <code>celula-recife</code> (12%) and <code>celula-mkt</code> (40%). <code>edge-loja</code> reads the <code>cliente_id</code> on the map and routes. Each cell has a <b>passive</b> one, the <i>shuffle</i> of 2 in 10 limits the downed pair to 1 ÷ 45 = 2.2% of customers, and the 2027 plan goes from <b>41 to 53 vCPU</b>. Lena\'s order is <b>1060</b>.',
        look: 'The 1060 token leaves the app, passes through edge-loja and enters the celula-recife frame.',
        key: 'The whole stack as a compartment.',
        f(o, t) { stage(o, 7); o.frame = 'acc'; lit(o, 'edge', 'sp', 'rio', 'rec', 'mkt'); ['edge>sp', 'edge>rio', 'edge>rec', 'edge>mkt'].forEach(k => L(o, k, 'on'));
          [['sp', 0.33], ['rio', 0.15], ['rec', 0.12], ['mkt', 0.4]].forEach(([id, f]) => { o.rows[id] = { ...o.rows[id], bars: [['', f, '']] }; });
          L(o, 'app>edge'); L(o, 'edge>gw'); fly(o, ['app>edge', 'edge>gw'], lin(t, 0.3, 3, 0, 0.999), '1060');
          o.cnt = [['CELLS', '4'], ['COST', '41 → 53 vCPU', 'dim'], ['SHUFFLE', '2.2%', 'dim']]; o.res = [['lena-77 → celula-recife', 'acc']]; } },
      { id: 'veneno', m: 26, title: 'The mkt-01 poison pill stays in celula-mkt', yk: 'THE 20:25 POISON PILL', fb: ['edge', 'sp', 'rio', 'rec', 'mkt', 'app'], dur: 7, act: ['Send the poison pill', 'mkt-01'],
        code: ['20:25:00: quantity 2147483648', 'single stack: 7,200 attempts', '  lost in 4 min', 'cells: 2,880, only from mkt-01', 'celula-recife: 1060 goes through'],
        story: 'At <b>20:25:00</b> <code>mkt-01</code> sends the <i>poison pill</i> (<code>quantidade: 2147483648</code>). With a single stack, in 4 min there would be <b>7,200</b> lost attempts; with cells, <b>2,880</b>, all from <code>mkt-01</code> itself. <code>celula-mkt</code> goes down alone, and Lena\'s 1060 goes through on <code>celula-recife</code>.',
        look: 'The red token goes from edge-loja to celula-mkt, which turns red; the other three stay lit.',
        key: 'The poison pill takes down only the cell of whoever sent it.',
        f(o, t) { stage(o, 7); o.frame = 'acc'; lit(o, 'edge', 'sp', 'rio', 'rec'); const a = lin(t, 0.3, 2.3, 0, 1), down = a >= 1;
          L(o, 'edge>mkt', down ? 'bad' : 'on'); if (!down) fly(o, ['edge>mkt'], a, 'mkt-01', 'bad'); down ? bad(o, 'mkt') : lit(o, 'mkt');
          L(o, 'app>edge'); L(o, 'edge>gw'); fly(o, ['app>edge', 'edge>gw'], lin(t, 2.5, 5, 0, 0.999), '1060');
          const n = lin(t, 2.3, 6.5, 0, 2880); if (down) rw(o, 'mkt', ['down: the poison pill', 'bad'], [`lost: ${thou(n)}`, 'bad']);
          o.cnt = [['LOST', thou(n), 'bad'], ['SINGLE STACK', '7,200', 'dim'], ['CELULA-RECIFE', 'selling']]; o.res = down ? [['only celula-mkt goes down', 'acc']] : []; } },
      { id: 'sp', m: 27, title: 'SP goes down: RTO of 65 s', yk: 'THE 20:40:00.150 OUTAGE', fb: ['sp', 'rio'], dur: 9, act: ['Take down SP', '20:40:00.150'],
        code: ['probes every 10 s · 3 failures', '  MTTD = 30 s', 'Rio promotion: MTTR 35 s', 'RTO = 30 + 35 = 65 s', 'expected RPO: 9.9 × 0.3 = 2.97', 'Bia\'s 1061: lost'],
        story: 'Cells help, but a region can still go down. At <b>20:40:00.150</b> SP goes down. The 10 s probes need 3 failures: <b>30 s MTTD</b>. The passive cell in Rio is promoted, the MTTR is 35 s and the <b>RTO is 65 s</b>. The expected RPO of <code>celula-sp</code> is <b>2.97</b> orders: Bia\'s <b>1061</b> (108.80) was lost, and the promoted database\'s sequence reused the number with Davi. The audit finds <b>12 links and 5 SPoFs</b>.',
        look: 'SP turns red; DR lights up, the clock runs to 65 s and Rio takes over.',
        key: 'The RTO counts from the interruption, and the RPO is math.',
        f(o, t) { stage(o, 7); o.frame = 'dim'; bad(o, 'sp'); lit(o, 'dr'); const s = Math.min(65, Math.round(lin(t, 0.5, 7, 0, 65))), ok = s >= 65;
          ok ? lit(o, 'rio') : soft(o, 'rio'); L(o, 'sp>rio', ok ? 'on' : 'bad'); rw(o, 'sp', ['down since 20:40:00.150', 'bad'], ['Bia\'s 1061: lost', 'bad']);
          rw(o, 'dr', [s < 30 ? 'probes: failure ' + Math.min(3, Math.floor(s / 10) + 1) + ' of 3' : 'MTTD 30 s', 'acc'], s >= 30 ? ['promoting Rio', ok ? 'dim' : 'acc'] : 'waiting', ok ? ['RTO 65 s', 'acc'] : 'RTO …', 'runbook', '12 links · 5 SPoFs');
          TB(o, 'sp', `clock: ${s} s`, ok ? 'acc' : 'bad'); if (ok) { rw(o, 'rio', 'celula-rio 15%', ['+ celula-sp: took over', 'acc']); TB(o, 'rio', 'Rio took over'); }
          o.cnt = [['CLOCK', s + ' s', ok ? 'acc' : 'bad'], ['MTTD', '30 s', 'dim'], ['RPO', '2.97', 'dim']]; o.res = ok ? [['RTO 65 s · the 1061 was lost', 'bad']] : []; } },
      { id: 'sinais', m: 28, title: 'Know: logs, metrics and traces', yk: 'ORDER 1063', fb: ['obs', 'pedidos', 'estoque', 'pool', 'pspb'], dur: 6,
        code: ['1063: 1,895 ms (normal: 275)', 'lock wait on stock: 1,620 ms', 'SLO 99.9% over 30 d · SLA 99.5%', 'budget: 43.2 min', 'burn rate 14.4×: 2% in 1 h', 'USE · RED · four signals'],
        story: 'Coming back fast only matters if someone notices the outage. The <b>three signals</b> (logs, metrics and traces) tied together by the <code>traceparent</code> show <b>1063</b> at 1.9 s, where normal is 275 ms: a lock wait of 1,620 ms on <code>estoque</code>. The alert wakes you by symptom, the SLI becomes a <b>99.9% SLO</b> (and a 99.5% SLA), the budget is <b>43.2 min</b> and a <i>burn rate</i> of <b>14.4×</b> consumes 2% in 1 h.',
        look: 'The signals light up; the 1063 trace points to stock in red, the slow hop.',
        key: 'See per order and decide by error budget.',
        f(o) { stage(o, 7); lit(o, 'obs'); bad(o, 'estoque'); soft(o, 'pedidos'); L(o, 'pedidos>estoque', 'bad');
          rw(o, 'estoque', ['lock: 1,620 ms', 'bad'], 'on 1063'); rw(o, 'obs', ['1063 trace', 'acc'], ['1,895 ms', 'bad'], 'SLO 99.9%', '43.2 min / 30 d');
          TB(o, 'estoque', 'slow span', 'bad');
          o.cnt = [['1063', '1.9 s', 'bad'], ['NORMAL', '275 ms', 'dim'], ['BUDGET', '43.2 min', 'dim']]; o.res = [['what, where, why', 'acc']]; } },
      { id: 'semsinais', m: 28, title: 'If it goes wrong: no observability', yk: 'TAKE A PIECE OUT: THE SIGNALS', fb: ['obs', 'dr', 'estoque', 'pedidos', 'sp'], dur: 5, act: ['Take out the signals', 'logs, metrics, traces'],
        code: ['MTTD: 30 s → 60 min', 'Lena waits 1.9 s', '  and nobody knows where', 'without the passive cell and DR:', '  RTO ~48 min · R$ 2.28 million'],
        story: 'Without observability, the MTTD goes back from <b>30 s to 60 min</b>, and Lena waits <b>1.9 s</b> with nobody knowing where. Without the passive cell and DR, SP goes down with an RTO of <b>~48 min</b> and R$ <b>2.28 million</b> lost. Without the router per cell, the poison pill takes down the <b>3 pods</b> of <code>pedidos</code> in 150 ms. Modules 26, 27 and 28 warned about it.',
        look: 'The signals sink; stock turns red and no alert lights up.',
        key: 'Without signals, the one who finds out about the incident is Lena.',
        f(o) { stage(o, 7); sink(o, 'obs'); bad(o, 'estoque'); rw(o, 'estoque', ['slow: nobody sees', 'bad']); rw(o, 'dr', ['MTTD 60 min', 'bad'], 'no alert');
          o.cnt = [['MTTD', '60 min', 'bad'], ['WITH SIGNALS', '30 s', 'dim'], ['1063', '1.9 s', 'bad']]; o.res = [['Lena finds out first', 'bad']]; } },
    ],
  };

  // ── tudo: os 14 saltos do 1060 ──
  const SAL = [
    { t: 'The app resolves and connects', mods: [1, 26], path: ['app>edge'], lit: ['app', 'edge'], fb: ['app', 'edge', 'gw', 'cdn'], k: ['RTT TO SP', 'off the path'],
      s: 'Lena\'s app (Recife) resolves <code>loja.com.br</code> (DNS) and opens the connection (TCP + TLS). The Recife cell takes the 80 ms of RTT to SP out of the path.' },
    { t: 'edge-loja looks at the map', mods: [26, 8], path: ['edge>gw'], lit: ['edge', 'rec'], fb: ['app', 'edge', 'gw', 'sp', 'rec'], k: ['CELL', 'celula-recife'],
      s: '<code>edge-loja</code> reads the <code>cliente_id</code> from the JWT and looks at the map (150 MB): <code>lena-77</code> → <code>celula-recife</code>.' },
    { t: 'The door, the balancer and the BFF', mods: [8, 7, 9], path: ['gw>lb', 'lb>bff'], lit: ['gw', 'lb', 'bff'], fb: ['edge', 'gw', 'lb', 'bff'], k: ['ROUTE', 'gw → lb → bff-app'],
      s: 'In the cell, <code>gw-loja</code> validates the token and applies <i>rate limiting</i>; <code>lb</code> picks a <code>bff-app</code>.' },
    { t: 'The POST with a deadline and Idempotency-Key', mods: [21, 10], path: ['bff>pedidos'], lit: ['bff', 'pedidos', 'mesh'], fb: ['bff', 'pedidos', 'mesh', 'lb'], k: ['POST /PEDIDOS', 'does not duplicate'],
      s: '<code>bff-app</code> calls <code>pedidos</code> with a deadline through the mesh (mTLS, retry with a rule); with the <code>Idempotency-Key</code>, <code>POST /pedidos</code> does not duplicate.' },
    { t: 'Stock reserves the 2 cats', mods: [11, 26], path: ['pedidos>estoque', 'estoque>redis'], lit: ['estoque', 'redis'], fb: ['pedidos', 'estoque', 'redis'], k: ['REC-1', '2 → 0'],
      s: '<code>pedidos</code> reserves the stock: the <i>lock</i> on the cat\'s row and the cell\'s allocation, <code>REC-1</code>, from 2 to 0 (cat 19 → 17).' },
    { t: 'pagamentos charges on PSP-A', mods: [12, 21, 25], path: ['pedidos>pagamentos', 'pagamentos>psp'], lit: ['pagamentos', 'psp', 'pspb'], fb: ['pedidos', 'pagamentos', 'psp', 'pspb'], k: ['POOL', '50 · 50/30/20'],
      s: '<code>pagamentos</code> charges on PSP-A (REST/Pix), with a <i>breaker</i>, PSP-B as a reserve and the pool of 50 in <i>bulkheads</i> 50/30/20.' },
    { t: 'The database writes, with the outbox', mods: [4, 18], path: ['pedidos>pool', 'pool>pg'], lit: ['pool', 'pg'], fb: ['pedidos', 'pool', 'pg'], k: ['WROTE', '1060 + PedidoCriado'],
      s: '<code>pedidos</code> writes to the cell\'s PostgreSQL, with a B-Tree index, and the <code>PedidoCriado</code> event goes to the outbox in the same transaction.' },
    { t: 'The relay publishes to Kafka', mods: [13], path: ['pg>kafka', 'kafka>entregas'], lit: ['kafka', 'entregas'], fb: ['pg', 'kafka', 'entregas', 'es'], k: ['KEY', 'pedido_id'],
      s: 'The <i>relay</i> (CDC) publishes to the cell\'s Kafka, with the <code>pedido_id</code> key; the <code>estoque</code>, <code>entregas</code> and <code>notificacoes</code> groups consume.' },
    { t: 'The saga goes on', mods: [19], path: [], lit: ['saga', 'pagamentos', 'estoque', 'entregas'], fb: ['saga', 'pagamentos', 'estoque', 'entregas'], k: ['SAGA', 'paid · reserved · scheduled'],
      s: 'The saga goes on: paid, reserved, scheduled the delivery. If a step failed, it would compensate with the refund.' },
    { t: 'The stream and the projection', mods: [20, 18], path: ['kafka>es'], lit: ['es', 'mp'], fb: ['kafka', 'es', 'mp'], k: ['STREAM', 'pedido-1060'],
      s: 'The events form the <code>pedido-1060</code> stream, and the projector updates <code>meus_pedidos:lena-77</code>.' },
    { t: 'Lena reads her own cell', mods: [18, 26], path: ['-kafka>mp'], lit: ['mp', 'rec'], fb: ['mp', 'kafka', 'rec', 'pg'], k: ['THE 1055', 'does not repeat'],
      s: 'The "my orders" screen reads the projection from her own cell. With the primary in Recife, the replica 800 ms behind from module 17 no longer exists: 1055 (the order Lena did not see) does not happen again.' },
    { t: 'The passive cell in SP gets the copy', mods: [17, 26], path: ['pg~sp'], lit: ['pg', 'sp'], fb: ['pg', 'sp', 'rio', 'rec'], k: ['LAG', '800 ms · RPO 2.88'],
      s: 'The cell\'s database replicates to the passive cell in SP: lag of 800 ms, expected RPO of 3.6 × 0.8 = 2.88 orders.' },
    { t: 'The same trace_id everywhere', mods: [28], path: [], lit: ['obs'], fb: ['obs', 'pedidos', 'pagamentos', 'pg', 'kafka'], k: ['SLI', '+1 good (2xx, ≤ 800 ms)'],
      s: 'Each hop leaves a log, a metric and a trace with the same <code>trace_id</code>; the checkout SLI (2xx and ≤ 800 ms) counts one more "good".' },
    { t: 'If it goes wrong: the poison pill at the same moment', mods: [26], path: ['edge>mkt'], lit: ['rec', 'edge'], fb: ['edge', 'sp', 'rio', 'rec', 'mkt'], k: ['LENA', 'does not notice'],
      s: 'If the <code>mkt-01</code> poison pill arrived at the same moment, Lena would not notice: <code>celula-mkt</code> goes down alone, and 1060 goes on in <code>celula-recife</code>.' },
  ];
  const FULL = ['app>edge', 'edge>gw', 'gw>lb', 'lb>bff', 'bff>pedidos', 'pedidos>estoque', 'pedidos>pagamentos', 'pagamentos>psp', 'pedidos>pool', 'pool>pg', 'pg>kafka', 'kafka>entregas', 'kafka>es', 'kafka>mp'];
  const PATHB = ['app', 'edge', 'gw', 'lb', 'bff', 'pedidos', 'estoque', 'pagamentos', 'psp', 'pool', 'pg', 'kafka', 'entregas', 'es', 'mp'];
  STEPS.tudo = [
    { id: 'tudo', title: 'The whole store: order 1060', yk: 'LENA · CELULA-RECIFE · 20:25:00.000', fb: 'all', dur: 10,
      code: ['2 cats 159.80 + shipping 15.00', '  = 174.80 · cat 19 → 17', '14 hops · 28 modules', '7 blocks lit', 'no new order'],
      story: 'The Lena order that crosses the most pieces is <b>1060</b> (<code>celula-recife</code>, 20:25:00.000, 2 cats at 159.80 + shipping of 15.00 = <b>174.80</b>). It hops through 14 pieces, and each one comes from a module. The order is right if, for each hop, you can say which problem it solved and what would make it fail.',
      look: 'All seven layers are on the map. The 1060 token walks the whole path; advance to follow it hop by hop.',
      key: 'Each hop of 1060 is a module you have already studied.',
      f(o, t) { stage(o, 7); o.frame = 'acc'; soft(o, ...PATHB); FULL.forEach(k => L(o, k, 'on'));
        const order = ['app>edge', 'edge>gw', 'gw>lb', 'lb>bff', 'bff>pedidos', 'pedidos>pool', 'pool>pg', 'pg>kafka', 'kafka>entregas'];
        fly(o, order, (t % 9.5) / 9, '1060');
        o.cnt = [['ORDER', '1060'], ['TOTAL', '174.80', 'dim'], ['HOPS', '14', 'dim']]; o.res = [['14 hops, 28 modules', 'acc']]; } },
    ...SAL.map((s, i) => ({ id: 'salto' + (i + 1), m: s.mods[0], mods: s.mods, title: `Hop ${i + 1}: ${s.t}`, yk: `HOP ${i + 1} OF 14 · MODULES ${s.mods.join(' · ')}`, fb: s.fb, dur: 5,
      act: i === 13 ? ['Send the poison pill', 'at the same moment'] : null,
      code: [s.s.replace(/<[^>]+>/g, '')], story: s.s,
      look: i === 13 ? 'The red mkt-01 token lands on celula-mkt; celula-recife stays lit with 1060.'
        : s.path.length ? 'The 1060 token walks along this hop\'s cable; the hop\'s pieces light up in sodium.' : 'The hop\'s pieces light up in sodium; the rest of the path stays lit in a dim tone.',
      key: i === 13 ? 'With cells, one customer\'s poison pill does not reach another\'s order.' : `Hop ${i + 1}: module${s.mods.length > 1 ? 's' : ''} ${s.mods.join(', ')}.`,
      f(o, t) { stage(o, 7); o.frame = 'acc'; soft(o, ...PATHB); FULL.forEach(k => L(o, k, 'on')); lit(o, ...s.lit);
        if (i === 13) { const a = lin(t, 0.3, 2.3, 0, 1); L(o, 'edge>mkt', a >= 1 ? 'bad' : 'on'); if (a < 1) fly(o, ['edge>mkt'], a, 'poison pill', 'bad'); else bad(o, 'mkt');
          fly(o, ['app>edge', 'edge>gw'], lin(t, 0.6, 3, 0, 0.999), '1060'); }
        else if (s.path.length) { s.path.forEach(k => L(o, k[0] === '-' ? k.slice(1) : k)); fly(o, s.path, lin(t, 0.3, 3, 0, 0.999), '1060'); }
        if (i === 8) ['paid', 'reserved', 'scheduled'].forEach((w, j) => { if (t > 0.5 + j * 1.2) TB(o, ['pagamentos', 'estoque', 'entregas'][j], w); });
        if (i === 10) TB(o, 'mp', 'Lena reads here');
        if (i === 12) ['pedidos', 'pagamentos', 'pg', 'kafka'].forEach(id => TB(o, id, 'trace_id', 'acc', 18));
        if (i === 4) rw(o, 'estoque', 'lock on the cat', ['REC-1: 2 → 0', 'acc']);
        o.cnt = [['HOP', `${i + 1} of 14`], [s.k[0], s.k[1], i === 13 ? 'acc' : 'dim'], ['MODULES', s.mods.join(' · '), 'dim']];
        o.res = [[s.k[1], i === 13 ? 'acc' : 'acc']]; } })),
  ];

  // ── falha: tire uma peça (as 13 da tabela) ──
  const PEC = [
    { p: 'the cache', mod: 5, av: '5 and 21', down: ['redis'], mancha: ['pg', 'catalogo'], n: '5 ms → 41 ms', q: 'The average time goes from 5 ms (h = 90%) to 41 ms, 8.2 times more, and the catalog sends 640 req/s to the origin instead of 128.', fb: ['catalogo', 'redis', 'pg'] },
    { p: 'the load balancer', mod: 7, av: '7', down: ['lb'], mancha: ['catalogo', 'bff'], n: '20 ms → 1.8 s', q: 'The first 9 orders go to catalogo-1: CPU at 100% and 20 ms becomes 1.8 s.', fb: ['gw', 'lb', 'bff', 'catalogo'] },
    { p: 'the gateway', mod: 8, av: '8', down: ['gw'], mancha: ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'], n: '6 addresses · 500/s', q: 'The app comes to know 6 addresses; each service does its own login and rate limiting; the 500/s bot arrives directly.', fb: ['edge', 'gw', 'catalogo', 'pagamentos', 'entregas'] },
    { p: 'the distributed lock', mod: 11, av: '11', down: [], mancha: ['estoque'], at: 'estoque', n: 'stock −1', q: 'Two replicas of estoque sell the last cat twice.', fb: ['pedidos', 'estoque', 'redis'] },
    { p: 'idempotency', mod: 21, av: '21', down: [], mancha: ['pedidos', 'pagamentos', 'psp'], at: 'pedidos', n: '2 orders · 2 charges', q: 'The POST retry creates two orders and two charges.', fb: ['bff', 'pedidos', 'pagamentos', 'psp'] },
    { p: 'the replicas', mod: 17, av: '16 and 17', down: ['shards'], mancha: ['mp', 'sp'], n: 'shard-1 down', q: 'shard-1 goes down and Lena and Bia are left with no orders; a burned disk takes the data.', fb: ['pg', 'shards', 'sp', 'mp'] },
    { p: 'the outbox', mod: 18, av: '18', down: [], mancha: ['pg', 'kafka', 'mp', 'es'], at: 'pg', n: '1 write, 2 systems', q: 'The order is written and the event never leaves: two systems, one write.', fb: ['pg', 'kafka', 'mp', 'es'] },
    { p: 'the breaker and the fallback', mod: 21, av: '21', down: ['pspb'], mancha: ['pagamentos', 'psp', 'entregas', 'filas'], n: '1.67 s · pool of 50', q: 'The PSP at 8 s fills the pool in 1.67 s and takes shipping and email down with it.', fb: ['pagamentos', 'psp', 'pspb', 'entregas'] },
    { p: 'the canary and the business metric', mod: 22, av: '22', down: ['pipe'], mancha: ['pedidos'], n: 'R$ 54,000 · R$ 486,000', q: 'Shipping 0.00 lasts 60 min: R$ 54,000 (and R$ 486,000 if only the 23:00 report finds it).', fb: ['pipe', 'pedidos', 'pool', 'relatorios'] },
    { p: 'the pool\'s bulkhead', mod: 25, av: '25', down: ['pool'], mancha: ['pedidos', 'mp'], n: '33% · 10% of 503', q: 'The 23:00 report leaves 33% of checkout and 10% of status with 503.', fb: ['pedidos', 'pool', 'pg', 'relatorios'] },
    { p: 'the router per cell', mod: 26, av: '26', down: ['edge'], mancha: ['pedidos', 'sp', 'rio', 'rec', 'mkt'], n: '7,200 attempts · 150 ms', q: 'The mkt-01 poison pill takes down the 3 pods of pedidos in 150 ms: 7,200 attempts, 100% of them.', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt'] },
    { p: 'the passive cell and DR', mod: 27, av: '27', down: ['dr'], mancha: ['sp'], n: '65 s × ~48 min · R$ 2.28 million', q: 'SP goes down. With a warm passive cell the RTO is 65 s (643.5 attempts fail); with backup only the RTO is ~48 min and costs R$ 2.28 million.', fb: ['sp', 'rio', 'dr', 'obs'] },
    { p: 'observability', mod: 28, av: '28', down: ['obs'], mancha: ['estoque'], n: '30 s → 60 min · 1.9 s', q: 'The MTTD goes back from 30 s to 60 min; Lena waits 1.9 s and nobody knows where.', fb: ['obs', 'dr', 'estoque', 'pedidos'] },
  ];
  // em que passo cai cada clique (as peças sem linha na tabela não fazem nada)
  const CLICK = { redis: 1, cdn: 1, lb: 2, gw: 3, estoque: 4, pedidos: 5, bff: 5, shards: 6, rio: 6, rec: 6, pg: 7, kafka: 7, mp: 7, es: 7,
    pagamentos: 8, psp: 8, pspb: 8, pipe: 9, pool: 10, edge: 11, mkt: 11, dr: 12, sp: 12, obs: 13 };
  STEPS.falha = [
    { id: 'falha', title: 'Take a piece out: click a piece', yk: 'THE FINAL EXAM · 13 PIECES', fb: 'all', dur: 6,
      code: ['click a piece on the map', '  to take it down', 'red: the stain', 'the panel: what breaks,', '  the number and who warned', '→ walks the 13 in order'],
      story: 'The final exam looks at "if it goes wrong" backwards: take a piece out and say what breaks. <b>Click a piece on the map</b> to take it down, or advance with the arrow to follow the 13 in the table in order. Each one shows the stain (the pieces it drags down with it), the number and the module that warned about it.',
      look: 'The whole map is lit. The pieces with a row in the table are Redis, lb-loja, gw-loja, stock, pedidos, the shards, the database, pagamentos, the pipeline, the pool, edge-loja, DR and the signals.',
      key: 'A piece is understood when you know what breaks without it.',
      f(o) { stage(o, 7); o.frame = 'dim'; Object.keys(CLICK).forEach(id => soft(o, id));
        o.cnt = [['PIECES', '13'], ['BLOCKS', '7', 'dim'], ['QUESTIONS', '80', 'dim']]; o.res = [['click a piece', 'acc']]; } },
    ...PEC.map((c, i) => ({ id: 'peca' + (i + 1), m: c.mod, title: `Without ${c.p}`, yk: `TAKE A PIECE OUT · ${i + 1} OF 13`, fb: c.fb, dur: 5,
      code: [c.q], story: `${c.q} Warned by: module${c.av.includes(' and ') ? 's' : ''} ${c.av}.`,
      look: c.down.length ? 'The piece sinks and turns red; the stain pieces turn red with it.' : 'This piece is a rule, not a box: the stain pieces turn red.',
      key: `Without ${c.p}: ${c.n}.`,
      f(o) { stage(o, 7); o.frame = 'dim'; c.down.forEach(id => sink(o, id)); bad(o, ...c.mancha);
        if (i === 3) rw(o, 'estoque', ['cat: 1 → −1', 'bad'], 'no lock');         if (i === 6) rw(o, 'pg', 'pedidos table', ['no outbox', 'bad'], 'the event does not leave', 'B-Tree index');
        if (i === 9) poolStrip(o, 0, 4, 16, 'bad');
        TB(o, c.at || c.down[0] || c.mancha[0], c.n, 'bad', 30);
        o.cnt = [['THE NUMBER', c.n, 'bad'], ['PIECE', c.p, 'dim'], ['WARNED BY', 'module ' + c.av, 'dim']]; o.res = [[c.n, 'bad']]; } })),
    { id: 'teto', m: 26, title: 'If it goes wrong: the router and the map together', yk: 'THE STORE\'S CEILING', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt', 'gw'], dur: 6, act: ['Take down the router', 'and the map, together'],
      code: ['cells isolate the failure', '  of one cell', 'edge-loja and the map: just one', '  in front of all of them', 'edge-loja: 99.99%', 'is the availability ceiling'],
      story: 'Taking down the router and the map at the same time shows the limit of cells: they isolate the failure of one cell, but <code>edge-loja</code> sits in front of all of them. With both out, no cell receives orders, and the <b>99.99%</b> of <code>edge-loja</code> is the store\'s availability ceiling.',
      look: 'edge-loja sinks; the four cells turn red together, even though they are intact.',
      key: 'The cells\' router is the ceiling of the whole store.',
      f(o, t) { stage(o, 7); o.frame = 'bad'; sink(o, 'edge'); const d = t > 1.2; if (d) bad(o, 'sp', 'rio', 'rec', 'mkt', 'app');
        rw(o, 'edge', ['router: down', 'bad'], [d ? 'map: down' : 'map 150 MB', d ? 'bad' : 'dim']);
        ['edge>sp', 'edge>rio', 'edge>rec', 'edge>mkt', 'app>edge'].forEach(k => L(o, k, d ? 'bad' : 'on'));
        o.cnt = [['CEILING', '99.99%', 'bad'], ['CELLS DOWN', d ? '4 of 4' : '…', 'bad'], ['PIECE', 'edge-loja', 'dim']]; o.res = d ? [['no cell receives', 'bad']] : []; } },
  ];

  const Lst = () => STEPS[sc], N = () => Lst().length, cur = () => Lst()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on === 1 ? (light ? '#f6ece2' : '#2a1d12') : on === 2 ? (light ? '#f3eee9' : '#1f1a15') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on === 1 || tone === 'bad' ? 1.4 : on === 2 ? 0.8 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  // o nome à esquerda e a etiqueta do módulo à direita, na primeira linha
  function head(x, u, d, W_, col, mcol, s1) {
    let mw = 0; const y = 13;
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = mcol; fitFont(x, u, d.meta, 10.5, 40); x.fillText(d.meta, u(W_ - 5), u(y)); mw = x.measureText(d.meta).width / u(1); }
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, W_ - 10 - (mw ? mw + 6 : 0)); x.fillText(d.name, u(5), u(y)); }
  const PAPER = () => theme === 'light' ? '#f6f6f5' : '#141516', EMPTY = () => theme === 'light' ? '#e6e6e4' : '#222427';
  const RELC = () => theme === 'light' ? '#5c3a2e' : '#9c7f6c';
  function drawBars(x, u, C, bars, W_, H_) {
    bars.forEach(([lab, f, tn], k) => { const y = H_ - 13 - k * 13, w = W_ - 10;
      x.fillStyle = EMPTY(); x.fillRect(u(5), u(y), u(w), u(8)); x.fillStyle = tn === 'bad' ? BAD() : accC(); x.fillRect(u(5), u(y), u(w * clamp(f)), u(8)); });
  }
  function drawCols(x, u, C, cols, mx, W_, H_) {
    const n = cols.length, gap = 5, cw = (W_ - 10 - gap * (n - 1)) / n, top = 31, base_ = H_ - 6, ah = base_ - top - 26;
    cols.forEach(([lab, f, val, tn], k) => { const X = 5 + k * (cw + gap);
      x.textAlign = 'center'; x.fillStyle = tn === 'bad' ? BAD() : toneC('hi'); fitFont(x, u, lab, 10, cw - 2); x.fillText(lab, u(X + cw / 2), u(top + 2));
      if (val) { x.fillStyle = tn === 'bad' ? BAD() : accC(); fitFont(x, u, val, 10.5, cw - 2); x.fillText(val, u(X + cw / 2), u(top + 15)); }
      x.fillStyle = EMPTY(); x.fillRect(u(X), u(base_ - ah), u(cw), u(ah));
      const h = ah * clamp(f / mx); x.fillStyle = tn === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(base_ - h), u(cw), u(h)); });
    x.textAlign = 'left';
  }
  function drawStrip(x, u, C, s, W_, H_) {
    const n = 20, cw = (W_ - 10) / n, y = H_ - 22;
    for (let i = 0; i < n; i++) { const v = s.fill[i];
      x.fillStyle = v === 'c' ? accC() : v === 'r' ? RELC() : v === 'b' ? BAD() : EMPTY(); x.fillRect(u(5 + i * cw + 0.6), u(y), u(cw - 1.2), u(14)); }
    if (s.split) { x.fillStyle = toneC('hi'); x.fillRect(u(5 + s.split * cw - 0.8), u(y - 4), u(1.6), u(22)); }
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 ? 1 : on === 2 ? 2 : 0, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, mcol = on === 'bad' ? BAD() : on ? accC() : INK();
    head(x, u, d, W_, col, mcol, MAP.s1);
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(25)); x.lineTo(u(W_ - 4), u(25)); x.stroke();
    let y = MAP.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, MAP.fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += MAP.lh; });
    if (d.bars) drawBars(x, u, C, d.bars, W_, H_);
    if (d.cols) drawCols(x, u, C, d.cols, d.colMax || 1, W_, H_);
    if (d.strip) drawStrip(x, u, C, d.strip, W_, H_);
    if (d.side) { x.fillStyle = on === 'bad' ? BAD() : accC(); x.fillRect(u(W_ - 19), u(H_ - 15), u(13), u(9)); }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = c => c ? ' class="on"' : '';
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const modLink = n => `<a class="o3-modl" href="../../${MOD[n][0]}/" target="_top">Module ${n} · ${MOD[n][1]} →</a>`;
  function dataHtml() {
    const s = cur();
    if (sc === 'tudo') return `<ol class="h3-now">${SAL.map((x, i) => `<li${on_(step === i + 1)}>${x.t} <span>(${x.mods.join(', ')})</span></li>`).join('')}</ol>`;
    if (sc === 'falha') return `<table class="h3-sum"><tr><th>if you take out…</th><th>the number</th><th>warned by</th></tr>${PEC.map((c, i) => `<tr${on_(step === i + 1)}><td>${c.p}</td><td>${c.n}</td><td>${c.av}</td></tr>`).join('')}</table><li>The final exam bands: 72 or more correct (90%) · 56 to 71 (70% to 89%) · below 56</li><li><code>edge-loja</code> (99.99%) is the store\'s availability ceiling</li>`;
    const [a, b] = BLOCOS[BLK[sc]], ms = Array.isArray(s.mods) ? s.mods : [s.m];
    let h = `<table class="h3-sum"><tr><th>module</th><th>the number that stays</th></tr>`;
    for (let n = a; n <= b; n++) h += `<tr${on_(ms.includes(n))}><td><a href="../../${MOD[n][0]}/" target="_top">${n} · ${MOD[n][1]}</a></td><td>${MOD[n][2]}</td></tr>`;
    return h + `</table><li>Each new piece lights up in sodium; those from earlier blocks stay graphite</li><li>Pieces that do not exist yet in this block do not show up</li>`;
  }
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (derrubar, ligar, publicar…) e leva até ele
  function actHtml() { const nx = Lst()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      ${s.m ? modLink(s.m) : ''}
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${dataHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'loja') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'loja' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-loja3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'loja') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const ease1 = (v, want, dt, sp) => v + Math.sign(want - v) * Math.min(Math.abs(want - v), dt / sp);
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f = ease1(Bk.f, want, dt, 0.55); Bk.sk = ease1(Bk.sk, o.sink[nm] || 0, dt, 0.9);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], Bk.pos[2] - (1 - e) * (Bk.h + 3) - Bk.sk * Bk.h));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.08 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, Bk.pos[2] + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0;
    const list = Object.entries(o.lk).filter(([id, st]) => !id.includes('~') || st.on).map(([id, st]) => ({ pts: LK[id].pts, ...st }));
    if (o.frame) list.unshift({ pts: FRAME, thin: 1, on: o.frame === 'acc' ? 1 : 0, tone: o.frame === 'bad' ? 'bad' : '' });
    setBeams(list); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    if (o.frame) o.tags.push([186, 650, PL + 16, 'celula-recife · 12%', o.frame === 'bad' ? 'bad' : o.frame === 'acc' ? 'acc' : 'dim']);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera: enquadra as peças do passo na área livre (à direita do painel no desktop, acima dele no celular/embed) ──
  function focusBox() {
    const o = SP || spec(), fb = !cur().fb || cur().fb === 'all' || POSTER ? NAMES.filter(n => o.show[n]) : cur().fb;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    fb.forEach(id => { const b = B[id]; x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.w); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y + b.d); });
    const m = 20; return [x0 - m, x1 + m, y0 - m, y1 + m];
  }
  // acha o alvo e a distância que põem as quinas da caixa dentro do retângulo livre da tela (frações: x0, x1, y0, y1; y para baixo)
  const cam2 = new THREE.PerspectiveCamera(), Rv = new THREE.Vector3(), Uv = new THREE.Vector3();
  function frameTo([x0, x1, y0, y1], [r0, r1, r2, r3]) {
    const pts = []; for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [PL, PL + 28]) pts.push(W(x, y, z));
    const dir = camera.position.clone().sub(controls.target).normalize();
    cam2.fov = persp.fov; cam2.aspect = innerWidth / innerHeight; cam2.near = 0.1; cam2.far = 400; cam2.up.copy(camera.up); cam2.updateProjectionMatrix();
    const Tg = W((x0 + x1) / 2, (y0 + y1) / 2, 15), tn = Math.tan(cam2.fov * Math.PI / 360); let D = 20;
    const wx0 = r0 * 2 - 1, wx1 = r1 * 2 - 1, wy0 = 1 - r3 * 2, wy1 = 1 - r2 * 2;
    for (let it = 0; it < 6; it++) {
      cam2.position.copy(Tg).addScaledVector(dir, D); cam2.lookAt(Tg); cam2.updateMatrixWorld();
      let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
      for (const p of pts) { const v = p.clone().project(cam2); a = Math.min(a, v.x); b = Math.max(b, v.x); c = Math.min(c, v.y); d = Math.max(d, v.y); }
      Rv.setFromMatrixColumn(cam2.matrixWorld, 0); Uv.setFromMatrixColumn(cam2.matrixWorld, 1);
      Tg.addScaledVector(Rv, ((a + b) / 2 - (wx0 + wx1) / 2) / 2 * 2 * D * tn * cam2.aspect).addScaledVector(Uv, ((c + d) / 2 - (wy0 + wy1) / 2) / 2 * 2 * D * tn);
      D *= Math.max((b - a) / (wx1 - wx0), (d - c) / (wy1 - wy0));
    }
    return { Tg, P: Tg.clone().addScaledVector(dir, D) };
  }
  function freeRect() {
    if (POSTER) return [0.03, 0.97, 0.05, 0.95];
    if (NARROW()) return [0.02, 0.98, 110 / innerHeight, 1 - (0.4 * innerHeight + 76) / innerHeight];
    return [500 / innerWidth, 1 - 215 / innerWidth, 0.1, 0.93];
  }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    // espera a animação de entrada da galeria (camAnim) terminar antes de enquadrar
    if (camAnim) followT = Math.max(followT, 1.6); else followT -= dt;
    if (followT > 0 && dt > 0 && !camAnim) {
      const { Tg, P } = frameTo(focusBox(), freeRect()), k = 1 - Math.exp(-dt / 0.45);
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
    if (/^[1-9]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  // no modo falha, clicar numa peça a derruba (vai ao passo dela); fora da prancha ou nos outros modos, avança
  function click(hit) {
    if (sc === 'falha' && hit) { let ob = hit.object, id = null; while (ob && !id) { id = GID.get(ob); ob = ob.parent; }
      if (id) { if (CLICK[id] != null) go(CLICK[id]); return; } }
    next();
  }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => NAMES.map(nm => B[nm].top);
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    NAMES.forEach(nm => { B[nm].key = ''; }); beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do modo (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; B[nm].sk = o.sink[nm] || 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(585, 400, -200), dist: innerWidth < 640 ? 24 : 26 } : { target: W(420, 380, 60), dist: 22 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–9 · in the Failure scenario, click a piece · drag to rotate' };
})() });
