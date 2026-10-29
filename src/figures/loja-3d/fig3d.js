// Figura 3D (iso-glow): o mapa da loja inteira, a figura que fecha o SDLabs. Cada peça é um bloco com o nome real e o número
// do módulo numa etiqueta; o mapa cresce bloco a bloco (1–5, 6–10, 11–13, 14–17, 18–21, 22–25, 26–28). O bloco em foco acende
// em sódio (a cor de destaque) e os anteriores ficam em grafite; os blocos que ainda não existem não aparecem.
// Modos (botões e ?mode=fundacoes|partir|conversar|crescer|consistencia|operar|celulas|tudo|falha; ?step=N abre no passo N):
// um por bloco, "tudo" (a ficha do 1060 nos 14 saltos) e "falha" (clique numa peça para derrubá-la: a mancha, o número e o
// módulo que avisou; no fim, o roteador e o mapa juntos mostram que o edge-loja é o teto).
// Dados: docs/escrita/provas-finais-brief.md, docs/escrita/historia-mestre.md e as aulas 1 a 7 (src/content/provas-finais/).
FIGS3D.push({ id: 'loja', name: 'Loja', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── modos ──
  const SC = ['fundacoes', 'partir', 'conversar', 'crescer', 'consistencia', 'operar', 'celulas', 'tudo', 'falha'];
  const SCNAME = { fundacoes: 'Fundações', partir: 'Partir', conversar: 'Conversar', crescer: 'Crescer', consistencia: 'Consistência',
    operar: 'Operar', celulas: 'Células', tudo: 'Tudo', falha: 'Falha' };
  const SCFULL = { fundacoes: 'Bloco 1 · a loja de um servidor', partir: 'Bloco 2 · partir e ligar', conversar: 'Bloco 3 · conversar e disputar',
    crescer: 'Bloco 4 · crescer e espalhar', consistencia: 'Bloco 5 · consistência e resiliência', operar: 'Bloco 6 · mudar, planejar, testar, isolar',
    celulas: 'Bloco 7 · células, desastre e sinais', tudo: 'A loja inteira · o pedido 1060', falha: 'Tire uma peça' };
  const BLK = { fundacoes: 1, partir: 2, conversar: 3, crescer: 4, consistencia: 5, operar: 6, celulas: 7, tudo: 7, falha: 7 };
  const AULA = { fundacoes: 'aula-1-a-loja-de-um-servidor', partir: 'aula-2-partir-e-ligar', conversar: 'aula-3-conversar-e-disputar',
    crescer: 'aula-4-crescer-e-espalhar', consistencia: 'aula-5-consistencia-e-resiliencia', operar: 'aula-6-mudar-planejar-testar-isolar',
    celulas: 'aula-7-celulas-desastre-e-sinais', tudo: 'aula-7-celulas-desastre-e-sinais', falha: 'aula-7-celulas-desastre-e-sinais' };
  // os 28 módulos: slug, nome e o número que fica (src/scripts/provas-finais/dados.js)
  const MOD = [null,
    ['protocolos-de-rede', 'Protocolos de Rede', '215 fatias · RTT 80 ms'], ['storage-raid-io', 'Storage, RAID e I/O', '1 · 2 · 4 · 6 · 2 I/Os'],
    ['cap-acid-base', 'CAP, ACID e BASE', 'quórum 2 em 3 · ~80 ms'], ['databases', 'Databases e Indexação', 'pedido 1042 · B-Tree'],
    ['cache', 'Estratégias de Cache', 'h = 90% → 5 ms · 89,90 → 79,90'], ['microsservicos', 'Microsserviços', '180 → 200 ms · 80 × 25 vCPU'],
    ['load-balancers', 'Load Balancers', '2,7 s · 5 s × 3 = 15 s'], ['api-gateways', 'API Gateways', '401 × 403 · JWT · token bucket'],
    ['bff', 'BFF', '480 ms · 180 KB → 150 ms · 12 KB'], ['service-mesh', 'Service Mesh', '27 chamadas · sidecar 3 vCPU · 1,5 GB'],
    ['concorrencia', 'Concorrência e Paralelismo', '2 ms + 18 ms → 50/s · teto 500/s · 409'], ['comunicacao-sincrona', 'Comunicação Síncrona', '11 bytes · 210 ms'],
    ['comunicacao-assincrona', 'Comunicação Assíncrona', '4 eventos · 120/s · 40/s por partição · 1049 → p0'],
    ['performance', 'Performance', 'média 135 · p50 32 · p95 800 · p99 2.000 ms'], ['scale-cube', 'Scale Cube', '(10, 9, 1) → (10, 9, 3) · 90 → 150 → 200'],
    ['sharding', 'Sharding', '40% → 55,6% · 75,2% × 25,7% · 45 pares'], ['replicacao', 'Replicação', '2 · 12 · 82 ms · lag 300/800 ms · RPO 9/24 · RTO 35 s'],
    ['cqrs', 'CQRS', '1.787 B · 235 ms × 0,021 ms'], ['saga', 'Saga Pattern', '85,5% · 1 · 2 · 4 · 8 · 16 s · estorno-c-7732'],
    ['event-sourcing', 'Event Sourcing', '1.800 ms × 13 ms · 2 h 47 min'], ['resiliencia', 'Patterns de Resiliência', '1,67 s · 27 · 1,3 s · 50/30/20'],
    ['deployment', 'Modelos de Deployment', 'R$ 54.000 × R$ 450 · 40 s × 90 s'], ['capacity-planning', 'Capacity Planning', '14 · 10 · 15 · 2 = 41 vCPU · 950 req/s · 200 pedidos/s'],
    ['testes-de-carga', 'Testes de Carga', '36/s × ~250/s · p95 ≤ 800 ms · erros ≤ 0,1%'], ['bulkhead', 'Bulkhead Pattern', 'pool 20 → 16 + 4 · 33% e 10% de 503 · 60% → 40%'],
    ['cell-based', 'Cell-Based Architecture', '4 células · 7.200 × 2.880 · 41 → 53 vCPU'], ['disaster-recovery', 'SPoF e Disaster Recovery', 'RTO 65 s (30 + 35) · RPO 2,97 · o 1061'],
    ['observabilidade', 'Observabilidade', '43,2 min · 14,4× · 1,9 s × 275 ms']];
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
      r: { 1: ['site 1', 'quórum: 2 de 3'], 4: ['pg-sp · primário', 'commit 2 ms'], 7: ['celula-sp 33%', 'guarda as passivas'] } },
    { id: 'rio', n: 'Rio', m: { 1: 'M3', 4: 'M17', 7: 'M26' }, b: 1, x: 432, y: 20, w: 236, d: 90, h: 16,
      r: { 1: ['site 2', 'RTT SP–Rio 10 ms'], 4: ['pg-rio · réplica', 'lag 300 ms'], 7: ['celula-rio 15%', '4,5 pedidos/s'] } },
    { id: 'rec', n: 'Recife', m: { 1: 'M3', 4: 'M17', 7: 'M26' }, b: 1, x: 688, y: 20, w: 236, d: 90, h: 16,
      r: { 1: ['site 3', 'escrita síncrona ~80 ms'], 4: ['pg-recife · réplica', 'lag 800 ms'], 7: ['celula-recife 12%', 'a moldura: esta pilha'] } },
    { id: 'mkt', n: 'celula-mkt', m: 'M26', b: 7, x: 944, y: 20, w: 206, d: 90, h: 16, r: { 7: ['40% · 12,0 pedidos/s', 'o mkt-01 sozinho'] } },
    { id: 'edge', n: 'edge-loja', m: 'M26', b: 7, x: 20, y: 140, w: 140, d: 85, h: 24, r: { 7: ['lê o cliente_id', 'mapa 150 MB', '99,99%'] } },
    { id: 'app', n: 'app', m: 'M1', b: 1, x: 20, y: 245, w: 140, d: 110, h: 22, r: { 1: ['Lena · Recife', 'DNS · TCP · TLS', 'HTTP', 'RTT 80 ms'] } },
    { id: 'cdn', n: 'CDN', m: 'M5', b: 1, x: 20, y: 375, w: 140, d: 80, h: 16, r: { 1: ['edge em Recife', 'foto do gato'] } },
    { id: 'cubo', n: 'cubo', m: 'M15', b: 4, x: 20, y: 475, w: 140, d: 80, h: 16, r: { 4: ['X · Y · Z', '(10, 9, 3)'] } },
    { id: 'metr', n: 'medir', m: 'M14', b: 4, x: 185, y: 575, w: 130, d: 75, h: 16, r: { 4: ['p95 800 ms', 'frota 67,5%'] } },
    { id: 'gw', n: 'gw-loja', m: 'M8', b: 2, x: 185, y: 140, w: 130, d: 85, h: 20, r: { 2: ['JWT: 401 × 403', 'rate limit', '/v1 · /v2'] } },
    { id: 'lb', n: 'lb-loja', m: 'M7', b: 2, x: 185, y: 245, w: 130, d: 85, h: 20, r: { 2: ['203.0.113.10', 'healthcheck 15 s'] } },
    { id: 'bff', n: 'bff-app', m: 'M9', b: 2, x: 185, y: 350, w: 130, d: 105, h: 20, r: { 2: ['+ bff-web', '+ bff-voz', '480 → 150 ms'] } },
    { id: 'mesh', n: 'malha', m: 'M10', b: 2, x: 185, y: 475, w: 130, d: 80, h: 16, r: { 2: ['sidecar por pod', 'mTLS · retry'] } },
    { id: 'loja', n: 'loja', m: 'M2', b: 1, u: 1, x: 335, y: 140, w: 300, d: 415, h: 24,
      r: { 1: ['um servidor · 8 vCPU', 'um programa só:', 'catálogo, carrinho,', 'pedidos, pagamentos,', 'estoque, entregas', 'e o relatório', 'das 23:00'] } },
    { id: 'catalogo', n: 'catalogo', m: 'M6', b: 2, x: 335, y: 140, w: 140, d: 85, h: 18, r: { 2: ['Vitrine', '3 réplicas'] } },
    { id: 'carrinho', n: 'carrinho', m: 'M6', b: 2, x: 335, y: 245, w: 140, d: 85, h: 18, r: { 2: ['Checkout'] } },
    { id: 'pedidos', n: 'pedidos', m: 'M6', b: 2, x: 335, y: 350, w: 140, d: 105, h: 22,
      r: { 2: ['Checkout', '1047 · 94,90'], 6: ['Checkout', 'v2.4.0'], 7: ['Checkout', '@2.6.0'] } },
    { id: 'relatorios', n: 'relatorios', m: 'M6', b: 2, x: 335, y: 475, w: 140, d: 80, h: 18, r: { 2: ['23:00', 'o vizinho pesado'] } },
    { id: 'pagamentos', n: 'pagamentos', m: 'M6', b: 2, x: 495, y: 140, w: 140, d: 85, h: 18,
      r: { 2: ['Checkout'], 3: ['Checkout', 'REST · gRPC'], 5: ['timeout 1 s', 'breaker'] } },
    { id: 'estoque', n: 'estoque', m: 'M6', b: 2, x: 495, y: 245, w: 140, d: 85, h: 18,
      r: { 2: ['Logística', 'gato: 3 → 2'], 3: ['Logística', 'lock no gato'], 7: ['lock no gato', 'REC-1: 2 de gato'] } },
    { id: 'pool', n: 'pool', m: 'M25', b: 6, x: 495, y: 350, w: 140, d: 105, h: 16, r: { 6: ['20 conexões', '16 + 4'] } },
    { id: 'entregas', n: 'entregas', m: 'M6', b: 2, x: 495, y: 475, w: 140, d: 80, h: 18, r: { 2: ['Logística'], 3: ['Logística', 'grupo do Kafka'] } },
    { id: 'redis', n: 'Redis', m: { 1: 'M5', 3: 'M11' }, b: 1, x: 655, y: 140, w: 140, d: 85, h: 18,
      r: { 1: ['hit rate 90%', 'média 5 ms'], 3: ['cache 5 ms', 'lock distribuído'] } },
    { id: 'pg', n: 'PostgreSQL', m: 'M4', b: 1, x: 655, y: 245, w: 140, d: 210, h: 26,
      r: { 1: ['tabela pedidos', '1042 · Lena', '89,90', 'índice B-Tree'], 4: ['tabela pedidos', 'primário em SP', 'banco: 150/s', 'índice B-Tree'],
        5: ['tabela pedidos', '+ outbox', 'mesma transação', 'índice B-Tree'], 7: ['da celula-recife', 'primário: Recife', '+ outbox', 'índice B-Tree'] } },
    { id: 'shards', n: 'shards', m: 'M16', b: 4, x: 655, y: 475, w: 140, d: 90, h: 18, r: { 4: [] } },
    { id: 'disco', n: 'RAID 10', m: 'M2', b: 1, x: 655, y: 585, w: 140, d: 70, h: 16, r: { 1: ['2 I/Os por escrita', 'fotos: obj. storage'] } },
    { id: 'saga', n: 'saga', m: 'M19', b: 5, x: 815, y: 140, w: 140, d: 85, h: 18, r: { 5: ['orquestrada', 'compensa: estorno'] } },
    { id: 'mp', n: 'meus-pedidos', m: 'M18', b: 5, x: 815, y: 245, w: 140, d: 85, h: 18, r: { 5: ['projeção', 'lena-77: 1.787 B'] } },
    { id: 'kafka', n: 'Kafka', m: 'M13', b: 3, x: 815, y: 350, w: 140, d: 105, h: 20, r: { 3: ['tópico pedidos', '3 partições', 'chave pedido_id', 'DLQ'] } },
    { id: 'es', n: 'event store', m: 'M20', b: 5, x: 815, y: 475, w: 140, d: 80, h: 18, r: { 5: ['streams', 'snapshot 13 ms'] } },
    { id: 'filas', n: 'AMQP · MQTT', m: 'M13', b: 3, x: 815, y: 575, w: 140, d: 75, h: 16, r: { 3: ['e-mails', 'caminhão'] } },
    { id: 'psp', n: 'PSP-A', m: { 3: 'M12', 5: 'M21' }, b: 3, x: 1000, y: 140, w: 150, d: 85, h: 18,
      r: { 3: ['Pix · cartão', '210 ms · webhook'], 5: ['p50 180 ms', 'breaker na frente'] } },
    { id: 'pspb', n: 'PSP-B', m: 'M21', b: 5, x: 1000, y: 245, w: 150, d: 85, h: 18, r: { 5: ['de reserva', 'p50 300 ms'] } },
    { id: 'obs', n: 'sinais', m: 'M28', b: 7, x: 1000, y: 350, w: 150, d: 130, h: 20, r: { 7: ['logs · métricas', 'traces', 'SLO 99,9%', '43,2 min / 30 d'] } },
    { id: 'dr', n: 'DR', m: 'M27', b: 7, x: 1000, y: 500, w: 150, d: 150, h: 18, r: { 7: ['sondas 10 s × 3', 'MTTD 30 s', 'RTO 65 s', 'runbook', '12 elos · 5 SPoFs'] } },
    { id: 'pipe', n: 'pipeline', m: 'M22', b: 6, x: 335, y: 675, w: 140, d: 70, h: 14, r: { 6: ['canary 10→50→100', 'flag frete_v2'] } },
    { id: 'plano', n: 'plano', m: 'M23', b: 6, x: 495, y: 675, w: 140, d: 70, h: 14, r: { 6: ['41 vCPU', 'BF 26/11/2027'] } },
    { id: 'k6', n: 'k6', m: 'M24', b: 6, x: 655, y: 675, w: 140, d: 70, h: 14, r: { 6: ['hoje: 36/s', 'plano: ~250/s'] } },
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
      { id: 'b1', title: 'A loja de um servidor', yk: 'O BLOCO 1 · MÓDULOS 1 A 5', fb: 'all', dur: 6,
        code: ['o dado chega (1)', 'o dado fica (2)', 'os bancos concordam (3)', 'o dado é achado (4)', 'a página é rápida (5)'],
        story: 'No começo a loja é <b>um programa e um disco</b>: o app da Lena, em Recife, fala com o servidor <code>loja</code>, o PostgreSQL guarda a tabela <code>pedidos</code> e o Redis guarda a página do gato. Cinco problemas aparecem, um por módulo: o dado viaja e demora, o disco queima, os bancos discordam, a linha some entre milhões e a página fica lenta.',
        look: 'As peças do bloco 1 acendem em sódio. O resto da loja ainda não existe: aparece bloco a bloco, nos outros modos.',
        key: 'Uma loja de um servidor precisa de cinco coisas antes de pensar em escala.',
        f(o) { over(o, 1); L(o, 'app>loja'); L(o, 'loja>pg'); L(o, 'loja>redis');
          o.cnt = [['PEÇAS', '7'], ['SERVIDORES', '1', 'dim'], ['vCPU', '8', 'dim']]; o.res = [['um programa, um disco', 'acc']]; } },
      { id: 'chega', m: 1, title: 'O dado chega: DNS, TCP, TLS e HTTP', yk: 'A VIAGEM DA FOTO', fb: ['app', 'loja', 'cdn'], dur: 7,
        code: ['DNS: acha loja.com.br', 'TCP: abre a conexão', 'TLS: cifra', 'HTTP: pede a página', 'foto de 313 KB = 215 fatias', '  de até 1.460 B · RTT 80 ms'],
        story: 'A Lena abre o app em Recife: o DNS acha <code>loja.com.br</code>, o TCP abre a conexão, o TLS cifra e o HTTP pede a página. A foto de 313 KB vira <b>215 fatias</b> de até 1.460 B, e cada ida e volta até SP custa <b>80 ms</b>.',
        look: 'As fichas saem do app da Lena e atravessam até o servidor loja; o contador soma as fatias.',
        key: 'Cada ida e volta Recife–SP custa 80 ms.',
        f(o, t) { stage(o, 1); lit(o, 'app', 'loja'); L(o, 'app>loja'); toks(o, ['app>loja'], 0.35);
          const n = Math.round(lin(t, 0.5, 5.5, 0, 215)); rw(o, 'app', ['Lena · Recife', 'acc'], 'DNS · TCP · TLS', 'HTTP', [`fatias: ${n} de 215`, 'acc']);
          o.cnt = [['FATIAS', String(n)], ['RTT ATÉ SP', '80 ms', 'dim'], ['FATIA', '≤ 1.460 B', 'dim']]; o.res = n >= 215 ? [['a foto chegou', 'acc']] : []; } },
      { id: 'fica', m: 2, title: 'O dado fica: RAID 10', yk: 'ESCRITA PEQUENA, EM I/Os', fb: ['loja', 'pg', 'disco'], dur: 5,
        code: ['RAID 0 · 1 · 5 · 6 · 10', '     1 · 2 · 4 · 6 · 2', 'pedidos.db: RAID 10 (2 I/Os)', 'fotos: object storage', 'RAID 0: o 1º disco que queima', '  leva tudo'],
        story: 'Com o dado chegando, ele precisa sobreviver a um disco queimado. O <code>pedidos.db</code> vai para um <b>RAID 10</b>, cuja escrita pequena custa <b>2 I/Os</b>, e as fotos vão para um <i>object storage</i>. No RAID 0 a escrita custa 1 I/O e o primeiro disco que queima leva tudo.',
        look: 'O RAID 10 acende embaixo do banco, ligado a ele por um cabo.',
        key: 'Proteção custa I/O: o RAID 10 paga 2 por escrita.',
        f(o) { stage(o, 1); lit(o, 'disco'); soft(o, 'pg'); L(o, 'pg>disco'); L(o, 'loja>pg');
          o.cnt = [['I/Os POR ESCRITA', '2'], ['RAID', '10', 'dim'], ['NO RAID 0', '1 I/O', 'dim']]; o.res = [['dois discos para cada dado', 'acc']]; } },
      { id: 'concordam', m: 3, title: 'Os bancos concordam: quórum de 2 em 3', yk: 'CAP NA PARTIÇÃO', fb: ['sp', 'rio', 'rec'], dur: 6,
        code: ['3 sites: SP · Rio · Recife', 'maioria: 2 de 3', 'partição: Recife isolado', '  C: recusar a escrita', '  A: aceitar e divergir', 'escrita síncrona até Recife ~80 ms'],
        story: 'Quando o dado fica em três sites (SP, Rio e Recife), eles podem perder a rede entre si. O CAP obriga a escolher, <b>durante a partição</b>, entre recusar (consistência) e aceitar (disponibilidade). A maioria é o <b>quórum de 2 em 3</b>, e a escrita síncrona até Recife leva ~80 ms.',
        look: 'O cabo Rio–Recife fica vermelho: Recife está isolado, e SP com o Rio ainda são maioria.',
        key: 'Na partição, recusar ou aceitar: o CAP obriga a escolher.',
        f(o, t) { stage(o, 1); lit(o, 'sp', 'rio'); L(o, 'sp>rio'); const cut = t > 2;
          if (cut) { bad(o, 'rec'); L(o, 'rio>rec', 'bad'); rw(o, 'rec', 'site 3', ['isolado: recusa?', 'bad']); } else { lit(o, 'rec'); L(o, 'rio>rec'); }
          rw(o, 'sp', 'site 1', ['maioria: SP + Rio', 'acc']);
          o.cnt = [['QUÓRUM', '2 de 3'], ['PARTIÇÃO', cut ? 'Recife isolado' : 'nenhuma', cut ? 'bad' : 'dim'], ['ESCRITA SÍNCRONA', '~80 ms', 'dim']];
          o.res = cut ? [['C recusa · A aceita e diverge', 'bad']] : []; } },
      { id: 'achado', m: 4, title: 'O dado é achado: o índice B-Tree', yk: 'ACHAR O 1042', fb: ['loja', 'pg'], dur: 5,
        code: ['SELECT * FROM pedidos', '  WHERE id = 1042;', 'índice B-Tree: poucas páginas', '1 milhão de linhas: ganha', '6 linhas: empata (1 página)'],
        story: 'A tabela <code>pedidos</code> guarda o <b>1042</b> (Lena, gato, 89,90). O <b>índice B-Tree</b> acha a linha em poucas leituras de página. Em 1 milhão de linhas ele ganha da varredura; em 6 linhas empata, porque tudo cabe numa página.',
        look: 'O banco acende e a ficha 1042 desce do servidor até a tabela.',
        key: 'O índice ganha quando a tabela não cabe numa página.',
        f(o, t) { stage(o, 1); lit(o, 'pg'); soft(o, 'loja'); L(o, 'loja>pg'); fly(o, ['loja>pg'], lin(t, 0.4, 2.6, 0, 0.999), '1042');
          rw(o, 'pg', 'tabela pedidos', ['1042 · Lena', 'acc'], ['gato · 89,90', 'acc'], 'índice B-Tree');
          o.cnt = [['PEDIDO', '1042'], ['VALOR', '89,90', 'dim'], ['ÍNDICE', 'B-Tree', 'dim']]; o.res = [['poucas leituras de página', 'acc']]; } },
      { id: 'rapida', m: 5, title: 'A página é rápida: Redis e CDN', yk: 'O HIT RATE VIRA CONTA', fb: ['app', 'cdn', 'loja', 'redis'], dur: 6,
        code: ['hit rate h = 90%', 'média = h × 1 + (1 − h) × 41', '      = 0,9 × 1 + 0,1 × 41', '      = 5 ms', 'CDN: a foto perto da Lena', 'preço: 89,90 → 79,90'],
        story: 'Achar rápido ainda não basta para a página que todo mundo abre. O <b>Redis</b> guarda a resposta, e com hit rate de 90% o tempo médio é 0,9 × 1 + 0,1 × 41 = <b>5 ms</b>. A <b>CDN</b> em Recife aproxima a foto, e a promoção baixa o preço de <b>89,90 para 79,90</b>.',
        look: 'O Redis e a CDN acendem; nove de cada dez fichas param no Redis.',
        key: 'O hit rate vira conta: 90% de acerto dá 5 ms.',
        f(o) { stage(o, 1); lit(o, 'redis', 'cdn'); L(o, 'loja>redis'); L(o, 'app>cdn'); L(o, 'app>loja'); toks(o, ['loja>pg'], 1.2, 'gray');
          rw(o, 'cdn', 'edge em Recife', ['gato: 79,90', 'acc']);
          o.cnt = [['TEMPO MÉDIO', '5 ms'], ['HIT RATE', '90%', 'dim'], ['PREÇO', '79,90', 'dim']]; o.res = [['9 em 10 param no Redis', 'acc']]; } },
      { id: 'semcache', m: 5, title: 'E se der errado: sem o cache', yk: 'TIRE UMA PEÇA: O CACHE', fb: ['loja', 'redis', 'pg'], dur: 6, act: ['Desligar o cache', '5 → 41 ms'],
        code: ['sem o Redis: tudo vai ao banco', 'média = 41 ms (8,2×)', 'catálogo a 640 req/s:', '  com 80% de acerto: 128 à origem', '  sem o cache: 640 à origem'],
        story: 'Sem o cache, o tempo médio vai de <b>5 ms</b> a <b>41 ms</b>, 8,2 vezes mais, e o catálogo a 640 req/s manda tudo à origem em vez dos 128 req/s que chegam com 80% de acerto. Quem avisou foram os módulos 5 e 21.',
        look: 'O Redis afunda e fica vermelho; todas as fichas descem ao banco, que fica vermelho também.',
        key: 'Tire o cache e a página do gato fica 8,2 vezes mais lenta.',
        f(o, t) { stage(o, 1); sink(o, 'redis'); bad(o, 'pg'); L(o, 'loja>pg', 'bad'); toks(o, ['loja>pg'], 0.25, 'bad');
          const v = Math.round(lin(t, 0.5, 3, 5, 41)); rw(o, 'pg', 'tabela pedidos', ['tudo chega aqui', 'bad'], `média ${v} ms`, 'índice B-Tree');
          o.cnt = [['TEMPO MÉDIO', v + ' ms', 'bad'], ['À ORIGEM', '640 req/s', 'bad'], ['COM CACHE', '128 req/s', 'dim']];
          o.res = v >= 41 ? [['8,2× mais lento', 'bad']] : []; } },
    ],
    partir: [
      { id: 'b2', m: 6, title: 'O programa vira sete serviços', yk: 'O BLOCO 2 · MÓDULOS 6 A 10', fb: 'all', dur: 7,
        code: ['catalogo · carrinho · pedidos', 'pagamentos · estoque · entregas', 'relatorios: cada um com seu banco', 'checkout: 180 → 200 ms', '  (4 saltos de 5 ms)', 'Black Friday: 80 × 25 vCPU'],
        story: 'Às 23:00 o relatório derrubava o programa inteiro, checkout junto. O programa vira <b>7 serviços</b>, cada um com o <b>seu banco</b>, e cada peça nova resolve o problema que a anterior criou. O preço é a rede: o checkout de 180 ms passa a <b>200 ms</b>, com 4 saltos de 5 ms. Na Black Friday, em vez de 10 cópias do monolito (<b>80 vCPU</b>) escalam só os serviços que pesam (<b>25 vCPU</b>). O pedido da Lena é o <b>1047</b>.',
        look: 'O servidor loja sumiu: no lugar dele, sete serviços. O bloco 2 acende em sódio e o bloco 1 fica em grafite.',
        key: 'Partir isola e escala só o que pesa, e cobra a rede.',
        f(o, t) { over(o, 2); fly(o, ['app>gw', 'gw>lb', 'lb>bff', 'bff>pedidos'], (t % 5) / 4, '1047');
          o.cnt = [['CHECKOUT', '200 ms'], ['SERVIÇOS', '7', 'dim'], ['BLACK FRIDAY', '25 vCPU', 'dim']]; o.res = [['cada serviço com seu banco', 'acc']]; } },
      { id: 'lb', m: 7, title: 'Repartir: o lb-loja', yk: 'QUEM ATENDE A LENA', fb: ['gw', 'lb', 'bff', 'catalogo'], dur: 5,
        code: ['lb-loja · 203.0.113.10', 'round robin: 1 pedido para cada', '3 buscas de 900 ms', '  na mesma réplica = 2,7 s', 'healthcheck 5 s × 3 falhas', '  = réplica fora em 15 s'],
        story: 'Com vários serviços e várias réplicas, alguém precisa escolher a réplica. O <code>lb-loja</code> (203.0.113.10) usa algoritmos, e o round robin "justo" no número de pedidos não é justo no trabalho: 3 buscas de 900 ms podem cair na mesma réplica e somar <b>2,7 s</b>. O <i>healthcheck</i> de 5 s com 3 falhas tira a réplica em <b>15 s</b>.',
        look: 'O lb-loja acende entre a porta e o BFF, e as fichas passam por ele.',
        key: '"Justo" no número de pedidos não é justo no trabalho.',
        f(o) { stage(o, 2); lit(o, 'lb'); soft(o, 'gw', 'bff'); L(o, 'gw>lb'); L(o, 'lb>bff'); toks(o, ['gw>lb', 'lb>bff'], 0.5);
          o.cnt = [['3 BUSCAS', '2,7 s'], ['HEALTHCHECK', '15 s', 'dim'], ['IP', '203.0.113.10', 'dim']]; o.res = [['justo no número, não no trabalho', 'acc']]; } },
      { id: 'gw', m: 8, title: 'Uma porta: o gw-loja', yk: 'A PORTA ÚNICA', fb: ['app', 'gw', 'lb'], dur: 5,
        code: ['sem token: 401', 'token sem o escopo: 403', 'rate limit: token bucket', '/v1 e /v2', 'X-Cliente-Id: lena-77', 'pedido 1048 · 94,90'],
        story: 'Atrás do balanceador o app ainda conhecia cada serviço. O <code>gw-loja</code> junta a porta: valida o <b>JWT</b> (sem token, <code>401</code>; token sem o escopo, <code>403</code>), aplica o <i>rate limit</i>, separa <code>/v1</code> de <code>/v2</code> e repassa <code>X-Cliente-Id: lena-77</code>. O pedido é o <b>1048</b>.',
        look: 'A ficha 1048 sai do app, passa pelo gw-loja e segue para o balanceador.',
        key: 'Uma porta, uma regra.',
        f(o, t) { stage(o, 2); lit(o, 'gw'); soft(o, 'app', 'lb'); L(o, 'app>gw'); L(o, 'gw>lb'); fly(o, ['app>gw', 'gw>lb'], lin(t, 0.3, 3.3, 0, 0.999), '1048');
          o.cnt = [['PEDIDO', '1048'], ['SEM TOKEN', '401', 'dim'], ['SEM ESCOPO', '403', 'dim']]; o.res = [['X-Cliente-Id: lena-77', 'acc']]; } },
      { id: 'bff', m: 9, title: 'Uma tela: o bff-app', yk: 'A TELA INICIAL DO APP', fb: ['lb', 'bff', 'catalogo', 'pedidos'], dur: 5,
        code: ['sem BFF: 4 chamadas × 120 ms', '  = 480 ms e 180 KB', 'com o bff-app, em paralelo:', '  150 ms e 12 KB', 'recomendacoes cai: espera 100 ms', '  e responde "recomendado": []'],
        story: 'A porta é única, mas a tela inicial do app ainda faz 4 chamadas de 120 ms: <b>480 ms e 180 KB</b>. O <code>bff-app</code> faz as chamadas em paralelo e entrega <b>150 ms e 12 KB</b>. Se o <code>recomendacoes</code> cair, ele espera 100 ms e responde sem a seção (<code>"recomendado": []</code>).',
        look: 'O bff-app chama o catalogo e o pedidos ao mesmo tempo.',
        key: 'Um BFF por tela junta as chamadas e corta o peso.',
        f(o) { stage(o, 2); lit(o, 'bff'); soft(o, 'catalogo', 'pedidos'); L(o, 'bff>catalogo'); L(o, 'bff>pedidos'); L(o, 'lb>bff', 'on');
          o.cnt = [['TELA', '150 ms'], ['ANTES', '480 ms', 'dim'], ['PESO', '180 → 12 KB', 'dim']]; o.res = [['as 4 chamadas em paralelo', 'acc']]; } },
      { id: 'malha', m: 10, title: 'Um padrão: a malha', yk: 'RETRY COM REGRA', fb: ['mesh', 'pedidos', 'pagamentos', 'estoque'], dur: 5,
        code: ['um sidecar por pod', '30 sidecars = 3 vCPU · 1,5 GB', 'mTLS entre os serviços', 'retry com regra', 'sem regra: 3 camadas × 3', '  = 27 chamadas por clique'],
        story: 'Com tudo ligado, cada serviço repetia retry, timeout e mTLS do seu jeito. A <b>malha</b> tira isso do código: um <i>sidecar</i> por pod (30 sidecars somam <b>3 vCPU e 1,5 GB</b>), mTLS e retry com regra. Sem regra, 3 camadas de 3 tentativas fazem <b>27</b> chamadas ao <code>pagamentos</code> por clique.',
        look: 'Cada serviço ganha um sidecar (o quadradinho no canto) e a malha acende embaixo.',
        key: 'A malha tira o padrão do código, e o retry sem regra multiplica.',
        f(o) { stage(o, 2); lit(o, 'mesh'); soft(...[o].concat(SVC)); SVC.forEach(id => { o.rows[id] = { ...o.rows[id], side: 1 }; });
          L(o, 'pedidos>pagamentos'); L(o, 'pedidos>estoque');
          o.cnt = [['SEM REGRA', '27 chamadas'], ['SIDECARS', '30', 'dim'], ['CUSTO', '3 vCPU · 1,5 GB', 'dim']]; o.res = [['o padrão sai do código', 'acc']]; } },
      { id: 'relat', m: 6, title: 'O relatorios cai sozinho', yk: '23:00, COM SERVIÇOS', fb: ['bff', 'pedidos', 'relatorios', 'catalogo', 'entregas'], dur: 5, act: ['Derrubar o relatorios', '23:00'],
        code: ['relatorios: fora', 'catalogo · carrinho · pedidos: ok', 'pagamentos · estoque · entregas: ok', 'raio de explosão: 1 serviço'],
        story: 'Às 23:00 o relatório pesado cai. No programa único, isso levava a loja inteira. Agora o <code>relatorios</code> cai <b>sozinho</b>: a vitrine, o carrinho e o checkout continuam vendendo.',
        look: 'O relatorios afunda em vermelho; as fichas do checkout continuam correndo.',
        key: 'O raio de explosão encolheu da loja inteira para um serviço.',
        f(o) { stage(o, 2); sink(o, 'relatorios'); lit(o, 'pedidos', 'catalogo'); L(o, 'bff>pedidos'); L(o, 'bff>catalogo'); toks(o, ['bff>pedidos'], 0.5);
          o.cnt = [['FORA', 'relatorios', 'bad'], ['VENDENDO', 'sim'], ['RAIO', '1 de 7', 'dim']]; o.res = [['o checkout segue', 'acc']]; } },
      { id: 'entregas', m: 6, title: 'O entregas cai e a loja vende', yk: 'QUEM NÃO PRECISA RESPONDER NA HORA', fb: ['bff', 'pedidos', 'pagamentos', 'entregas'], dur: 5, act: ['Derrubar o entregas', 'depois'],
        code: ['entregas: fora', 'o pedido é criado e pago', 'o evento PedidoPago espera', '  na fila e é entregue', '  quando o entregas volta'],
        story: 'Agora cai o <code>entregas</code>, que no programa único derrubava os sete. A loja continua vendendo: o evento <code>PedidoPago</code> espera na fila e é entregue quando o <code>entregas</code> volta.',
        look: 'O entregas afunda; as fichas do pedido seguem até o pagamentos.',
        key: 'Quem não precisa responder na hora pode cair sem levar a venda.',
        f(o) { stage(o, 2); sink(o, 'relatorios'); sink(o, 'entregas'); lit(o, 'pedidos', 'pagamentos'); L(o, 'bff>pedidos'); L(o, 'pedidos>pagamentos');
          toks(o, ['bff>pedidos', 'pedidos>pagamentos'], 0.6); rw(o, 'pagamentos', 'Checkout', ['PedidoPago: na fila', 'acc']);
          o.cnt = [['FORA', 'relatorios, entregas', 'bad'], ['VENDENDO', 'sim'], ['EVENTO', 'espera na fila', 'dim']]; o.res = [['a venda não espera a entrega', 'acc']]; } },
      { id: 'semgw', m: 8, title: 'E se der errado: sem o gateway', yk: 'TIRE UMA PEÇA: O GATEWAY', fb: ['app', 'gw', 'lb', 'catalogo', 'pagamentos', 'entregas'], dur: 5, act: ['Tirar o gateway', 'a porta única'],
        code: ['sem o gw-loja:', 'o app conhece 6 endereços', 'cada serviço: o seu login', 'cada serviço: o seu rate limit', 'o robô de 500 req/s chega direto'],
        story: 'Sem o gateway, o app conhece <b>6 endereços</b>, cada serviço faz login e <i>rate limit</i> do seu jeito, e o robô de 500 req/s chega direto ao serviço. Quem avisou foi o módulo 8.',
        look: 'O gw-loja afunda e seis serviços ficam vermelhos, expostos ao app.',
        key: 'Sem a porta única, cada serviço vira uma porta.',
        f(o) { stage(o, 2); sink(o, 'gw'); bad(o, 'catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'); L(o, 'app>gw', 'bad');
          o.cnt = [['ENDEREÇOS', '6', 'bad'], ['ROBÔ', '500 req/s', 'bad'], ['LOGIN', '6 jeitos', 'dim']]; o.res = [['cada serviço vira uma porta', 'bad']]; } },
    ],
    conversar: [
      { id: 'b3', title: 'Quem leva o último gato?', yk: 'O BLOCO 3 · MÓDULOS 11 A 13', fb: 'all', dur: 6,
        code: ['disputar: o lock (11)', 'esperar: a síncrona (12)', 'não esperar: o Kafka (13)', 'cada escolha troca', '  latência por acoplamento'],
        story: 'A loja ficou com 7 serviços ligados por porta, tela e malha. Quando eles conversam aparecem dois problemas diferentes: <b>disputar</b> o mesmo recurso (concorrência) e <b>esperar</b> a resposta (síncrono) ou <b>não esperar</b> (assíncrono).',
        look: 'O lock no Redis, o PSP-A, o Kafka e as filas acendem em sódio.',
        key: 'Disputar e esperar são problemas diferentes.',
        f(o) { over(o, 3); toks(o, ['pg>kafka', 'kafka>entregas'], 0.8);
          o.cnt = [['ESTOQUE DO GATO', '1'], ['PSP', '210 ms', 'dim'], ['KAFKA', '3 partições', 'dim']]; o.res = [['disputar, esperar, não esperar', 'acc']]; } },
      { id: 'semlock', m: 11, title: 'Bia e Caio, sem o lock', yk: 'O ÚLTIMO GATO', fb: ['pedidos', 'estoque', 'redis'], dur: 6, act: ['Mandar Bia e Caio', 'sem o lock'],
        code: ['estoque do gato: 1', 'réplica A lê 1 e vende', 'réplica B lê 1 e vende', 'estoque: 1 − 2 = −1', 'mutex no processo: 2 memórias'],
        story: 'A Bia e o Caio clicam "comprar" no mesmo instante, e restava <b>um</b> gato. As 2 réplicas do <code>estoque</code> leem 1 ao mesmo tempo e as duas vendem: o estoque vai a <b>−1</b>. Um <i>mutex</i> no processo não resolve, porque são 2 réplicas e 2 memórias.',
        look: 'As fichas da Bia e do Caio chegam juntas ao estoque, que fica vermelho em −1.',
        key: 'Com 2 réplicas, o mutex local não protege nada.',
        f(o, t) { stage(o, 3); const f = lin(t, 0.4, 2.8, 0, 1), done = f >= 1;
          if (!done) { fly(o, ['pedidos>estoque'], f, 'Bia'); fly(o, ['pedidos>estoque'], Math.max(0.001, f - 0.12), 'Caio', 'gray'); }
          if (done) { bad(o, 'estoque'); rw(o, 'estoque', 'Logística', ['gato: 1 → −1', 'bad']); TB(o, 'estoque', 'vendido 2×', 'bad'); } else lit(o, 'estoque');
          L(o, 'pedidos>estoque'); soft(o, 'pedidos');
          o.cnt = [['ESTOQUE', done ? '−1' : '1', done ? 'bad' : 'acc'], ['VENDIDOS', done ? '2' : '0', done ? 'bad' : 'dim'], ['GATOS', '1', 'dim']];
          o.res = done ? [['um gato vendido duas vezes', 'bad']] : []; } },
      { id: 'lock', m: 11, title: 'Com o lock distribuído', yk: 'QUEM PEGA PRIMEIRO LEVA', fb: ['pedidos', 'estoque', 'redis'], dur: 6, act: ['Ligar o lock', 'no Redis'],
        code: ['lock distribuído no Redis', 'a Bia pega o lock: 1049', '  79,90 + frete SP 9,00 = 88,90', 'o Caio recebe 409', '2 ms de CPU + 18 ms de espera', '  = 50/s por vez · teto 500/s'],
        story: 'Entra um <b>lock distribuído</b> no Redis. Quem pegar primeiro leva (a Bia, o <b>1049</b>, 79,90 + frete SP 9,00 = 88,90) e o outro recebe <code>409</code>. A conta: 2 ms de CPU + 18 ms de espera dão 50 pedidos/s por vez e um teto de <b>500/s</b>. O estudo ainda cobre <i>deadlock</i> e <i>starvation</i>.',
        look: 'O cabo entre o estoque e o Redis acende; a ficha da Bia passa e a do Caio volta vermelha com 409.',
        key: 'O lock decide quem leva; o outro recebe 409.',
        f(o, t) { stage(o, 3); lit(o, 'estoque', 'redis'); soft(o, 'pedidos'); L(o, 'pedidos>estoque'); L(o, 'estoque>redis');
          const f = lin(t, 0.4, 2.6, 0, 1), back = lin(t, 2.6, 4, 0, 1);
          if (f < 1) { fly(o, ['pedidos>estoque'], f, 'Bia'); fly(o, ['pedidos>estoque'], Math.max(0.001, f - 0.12), 'Caio', 'gray'); }
          else if (back < 1) fly(o, ['-pedidos>estoque'], back, '409', 'bad');
          if (f >= 1) { TB(o, 'estoque', 'Bia: 1049'); rw(o, 'estoque', 'Logística', ['gato: 1 → 0', 'acc'], ['Caio: 409', 'bad']); }
          rw(o, 'redis', 'cache 5 ms', ['lock: Bia', 'acc']);
          o.cnt = [['BIA', f >= 1 ? '1049' : '…'], ['CAIO', f >= 1 ? '409' : '…', 'bad'], ['TETO', '500/s', 'dim']]; o.res = f >= 1 ? [['um gato, uma venda', 'acc']] : []; } },
      { id: 'sinc', m: 12, title: 'Esperar: a chamada síncrona e o webhook', yk: 'O FORMATO E O SALTO TÊM CUSTO', fb: ['pedidos', 'pagamentos', 'psp'], dur: 6,
        code: ['pedidos → pagamentos:', '  REST/JSON × gRPC/Protobuf', '  o 1050 em Protobuf: 11 bytes', 'o PSP responde em 210 ms', 'webhook: o Pix do Davi caiu', '  pedido 1050 · cobrança c-7731'],
        story: 'Com o lock resolvido, falta o custo de cada chamada. REST com JSON × gRPC com Protobuf: o 1050 em Protobuf tem <b>11 bytes</b> (sem o cabeçalho gRPC), e o PSP responde em <b>210 ms</b>. Quando o PSP avisa que o Pix do Davi caiu sem a loja perguntar, é o <b>webhook</b> do <b>1050</b>; <i>short</i> e <i>long polling</i> perguntam, o WebSocket deixa a conexão aberta e o GraphQL deixa o cliente escolher os campos.',
        look: 'A ficha vai do pagamentos ao PSP-A; depois o webhook volta do PSP sem ninguém perguntar.',
        key: 'O formato e o salto têm custo.',
        f(o, t) { stage(o, 3); lit(o, 'psp', 'pagamentos'); L(o, 'pagamentos>psp'); const a = lin(t, 0.3, 2.3, 0, 1), b = lin(t, 3, 5, 0, 1);
          if (a < 1) fly(o, ['pagamentos>psp'], a, '1050 · 11 B'); else if (b > 0 && b < 1) fly(o, ['-pagamentos>psp'], b, 'webhook');
          o.cnt = [['PSP', '210 ms'], ['1050 EM PROTOBUF', '11 bytes', 'dim'], ['WEBHOOK', 'c-7731', 'dim']]; o.res = b >= 1 ? [['o PSP avisou sozinho', 'acc']] : []; } },
      { id: 'kafka', m: 13, title: 'Não esperar: o Kafka', yk: 'O TÓPICO PEDIDOS', fb: ['pg', 'kafka', 'entregas', 'filas'], dur: 6,
        code: ['tópico pedidos: 3 partições', 'a chave pedido_id decide', '  o 1049 cai em p0', '4 eventos por pedido', 'Black Friday: 120/s no tópico', '  40/s por partição'],
        story: 'Nem tudo precisa de resposta na hora. No <b>Kafka</b>, o tópico <code>pedidos</code> tem 3 partições e a chave <code>pedido_id</code> decide a partição (o 1049 cai em <code>p0</code>). Cada pedido gera <b>4 eventos</b>; na Black Friday são <b>120/s</b> no tópico e <b>40/s por partição</b>. Os grupos <code>estoque</code>, <code>entregas</code> e <code>notificacoes</code> consomem, e a <b>DLQ</b> guarda a mensagem que não se consegue processar. O MQTT fala com o caminhão e o AMQP, com os e-mails.',
        look: 'Os eventos saem do banco para o Kafka e descem até o entregas.',
        key: 'A chave decide a partição, e a ordem só vale dentro dela.',
        f(o) { stage(o, 3); lit(o, 'kafka', 'filas'); soft(o, 'entregas'); L(o, 'pg>kafka'); L(o, 'kafka>entregas'); toks(o, ['pg>kafka', 'kafka>entregas'], 0.45);
          rw(o, 'kafka', 'tópico pedidos', ['1049 → p0', 'acc'], '4 eventos/pedido', 'DLQ');
          o.cnt = [['EVENTOS', '120/s'], ['POR PARTIÇÃO', '40/s', 'dim'], ['1049', 'p0', 'dim']]; o.res = [['ninguém espera a entrega', 'acc']]; } },
      { id: 'semdlq', m: 13, title: 'E se der errado: sem a DLQ', yk: 'A MENSAGEM QUE TRAVA A PARTIÇÃO', fb: ['kafka', 'filas', 'entregas'], dur: 7, act: ['Tirar a DLQ', 'um e-mail inválido'],
        code: ['notificacoes: e-mail do 1051', 'provedor: 550 endereço inválido', 'sem DLQ: a mensagem volta', '  para sempre e trava a p0', 'a 40 eventos/s:', '  +2.400 eventos por minuto'],
        story: 'A DLQ guarda a mensagem que não se consegue processar. Sem ela, o e-mail inválido do 1051 volta para sempre e <b>trava a p0</b>: a 40 eventos/s, a fila atrás da mensagem ruim cresce <b>2.400 eventos por minuto</b>. Quem avisou foi o módulo 13.',
        look: 'O Kafka fica vermelho e o contador de eventos parados na p0 sobe.',
        key: 'Uma mensagem ruim sem DLQ para a partição inteira.',
        f(o, t) { stage(o, 3); bad(o, 'kafka', 'filas'); L(o, 'pg>kafka', 'bad'); toks(o, ['pg>kafka'], 0.3, 'bad');
          const n = lin(t, 0.5, 6, 0, 2400); rw(o, 'kafka', 'tópico pedidos', ['p0 travada', 'bad'], [`parados: ${thou(n)}`, 'bad'], 'sem DLQ');
          o.cnt = [['PARADOS NA P0', thou(n), 'bad'], ['TAXA', '40/s', 'dim'], ['POR MINUTO', '2.400', 'bad']]; o.res = n >= 2400 ? [['um minuto de p0 parada', 'bad']] : []; } },
    ],
    crescer: [
      { id: 'b4', title: '20:03: a Black Friday mede a loja', yk: 'O BLOCO 4 · MÓDULOS 14 A 17', fb: 'all', dur: 6,
        code: ['medir (14)', 'escolher o eixo (15)', 'partir por uma chave (16)', 'copiar (17)', 'dia comum: 5 pedidos/s', 'pico das 20:03: 30/s'],
        story: 'A loja do bloco 3 funciona em dia comum, com 5 pedidos por segundo. Às <b>20:03</b> da Black Friday o pico chega a 30 por segundo e quase tudo o que ela construiu começa a ser medido de verdade. Crescer não é comprar máquina: é saber <b>o que</b> está lento e <b>onde</b> cortar.',
        look: 'A medição, o cubo, os shards e as réplicas nos sites acendem em sódio.',
        key: 'Crescer é medir, escolher o eixo, partir e copiar.',
        f(o) { over(o, 4); toks(o, ['bff>pedidos', 'pedidos>pg'], 0.25);
          o.cnt = [['PICO', '30/s'], ['DIA COMUM', '5/s', 'dim'], ['META P95', '≤ 300 ms', 'dim']]; o.res = [['medir antes de crescer', 'acc']]; } },
      { id: 'medir', m: 14, title: 'Medir: a média engana', yk: 'AS 100 REQUISIÇÕES DAS 20:03', fb: ['metr', 'catalogo', 'pagamentos', 'relatorios'], dur: 5,
        code: ['média 135 ms · p50 32 ms', 'p95 800 ms · p99 2.000 ms', 'catalogo-3 a 99%', 'frota: (9 × 64 + 99) ÷ 10 = 67,5%', 'elo mais fraco: pagamentos 40/s', 'teto final: o banco, 150/s'],
        story: 'A média é <b>135 ms</b> e o p50, <b>32 ms</b>, mas o p95 é <b>800 ms</b> e o p99, <b>2.000 ms</b>. A <code>catalogo-3</code> está a 99% e a frota inteira marca <b>67,5%</b>: (9 × 64 + 99) ÷ 10. O elo mais fraco manda: o <code>pagamentos</code> faz <b>40/s</b> e o banco do <code>pedidos</code>, <b>150/s</b>. O pedido do Davi é o <b>1052</b>.',
        look: 'A medição acende; o catalogo mostra a réplica quente e o pagamentos fica vermelho: é o elo mais fraco.',
        key: 'A média esconde; o elo mais fraco manda.',
        f(o) { stage(o, 4); lit(o, 'metr', 'catalogo', 'pg'); bad(o, 'pagamentos');
          rw(o, 'catalogo', ['catalogo-3: 99%', 'bad'], 'frota: 67,5%'); rw(o, 'pagamentos', ['40 pedidos/s', 'bad'], 'o elo mais fraco'); rw(o, 'pg', 'tabela pedidos', 'primário em SP', ['banco: 150/s', 'acc'], 'índice B-Tree');
          rw(o, 'metr', ['p95 800 ms', 'acc'], 'média 135 ms');
          o.cnt = [['P95', '800 ms'], ['MÉDIA', '135 ms', 'dim'], ['ELO FRACO', '40/s', 'bad']]; o.res = [['o painel de média diz: tudo bem', 'bad']]; } },
      { id: 'cubo', m: 15, title: 'Escolher o eixo: o cubo', yk: 'X, Y E Z', fb: ['cubo', 'bff', 'catalogo', 'pedidos'], dur: 6,
        code: ['X: clonar (réplicas)', 'Y: partir por função (serviços)', 'Z: partir por dado (clientes)', '(10, 9, 1) → (10, 9, 3)', 'saída: 90 → 150 → 200 pedidos/s', 'pedido 1053 · Caio'],
        story: 'Com o gargalo medido, resta saber como crescer. No cubo, <b>X</b> clona (réplicas), <b>Y</b> parte por função (serviços) e <b>Z</b> parte por dado (clientes). A loja vai de <b>(10, 9, 1)</b> a <b>(10, 9, 3)</b>, e a saída sobe de <b>90 a 150 e a 200</b> pedidos por segundo. O pedido do Caio é o <b>1053</b>.',
        look: 'O cubo acende; o Z aponta para os shards logo abaixo do banco.',
        key: 'X clona, Y parte por função, Z parte por dado.',
        f(o, t) { stage(o, 4); lit(o, 'cubo'); soft(o, 'shards', 'catalogo', 'pedidos');
          const v = t < 2 ? 90 : t < 4 ? 150 : 200; rw(o, 'cubo', 'X · Y · Z', [t < 2 ? '(10, 9, 1)' : '(10, 9, 3)', 'acc']);
          o.cnt = [['SAÍDA', v + '/s'], ['COORDENADAS', t < 2 ? '(10, 9, 1)' : '(10, 9, 3)', 'dim'], ['PEDIDO', '1053', 'dim']]; o.res = v >= 200 ? [['Z: 3 só no pedidos', 'acc']] : []; } },
      { id: 'shards', m: 16, title: 'Partir por uma chave: 3 shards', yk: 'MURMUR3(CLIENTE_ID) MOD 3', fb: ['pg', 'shards', 'disco', 'pool'], dur: 5,
        code: ['3 shards por cliente_id', 'murmur3 sobre 50 milhões de linhas', 'lena-77 → shard-1: o 1054', 'mod 3 → 4: move 75,2%', 'anel: move 25,7%', 'shuffle: 45 pares'],
        story: 'O eixo Z pede uma chave. São <b>3 <i>shards</i></b> por <code>cliente_id</code> com <code>murmur3</code> sobre <b>50 milhões</b> de linhas, e o 1054 da Lena cai no <code>shard-1</code>. Passar de 3 para 4 shards move <b>75,2%</b> dos dados com <code>mod</code> e <b>25,7%</b> com o anel. O <i>shuffle</i> forma <b>45</b> pares.',
        look: 'Os shards acendem embaixo do banco; a ficha 1054 desce até o shard-1.',
        key: 'A chave decide para onde vai cada linha.',
        f(o, t) { stage(o, 4); lit(o, 'shards'); soft(o, 'pg'); fly(o, ['pedidos>pg'], lin(t, 0.3, 2.3, 0, 0.999), '1054');
          if (t > 2.3) TB(o, 'shards', 'lena-77 → shard-1');
          o.cnt = [['1054', 'shard-1'], ['LINHAS', '50 milhões', 'dim'], ['MOD 3 → 4', '75,2%', 'dim']]; o.res = [['anel: só 25,7% se move', 'acc']]; } },
      { id: 'mkt', m: 16, title: 'O mkt-01 esquenta o shard-2', yk: 'O SHARD QUENTE', fb: ['pg', 'shards', 'disco', 'pool'], dur: 6, act: ['Ligar o mkt-01', '40% das linhas'],
        code: ['mkt-01: 40% da tabela pedidos', 'shard-2: 60% · os outros: 20%', 'eficiência = média ÷ maior', '  = 33,3% ÷ 60% = 55,6%'],
        story: 'O <code>mkt-01</code>, o marketplace parceiro, tem 40% das linhas e deixa o <code>shard-2</code> com <b>60%</b>. Os outros dois ficam com 20% cada, e a eficiência do cluster cai a <b>55,6%</b>: o shard mais cheio manda.',
        look: 'A coluna do shard-2 cresce até 60% e fica vermelha.',
        key: 'A chave decide o que esquenta.',
        f(o, t) { stage(o, 4); const f = lin(t, 0.4, 3, 0, 1); shardCols(o, true, f); f >= 1 ? bad(o, 'shards') : lit(o, 'shards');
          const e = 100 / 3 / lin(f, 0, 1, 33.3, 60) * 100;
          o.cnt = [['EFICIÊNCIA', (f >= 1 ? '55,6' : e.toFixed(1).replace('.', ',')) + '%', f >= 1 ? 'bad' : 'acc'], ['SHARD-2', Math.round(lin(f, 0, 1, 33.3, 60)) + '%', f >= 1 ? 'bad' : 'dim'], ['MKT-01', '40%', 'dim']];
          o.res = f >= 1 ? [['o shard mais cheio manda', 'bad']] : []; } },
      { id: 'copiar', m: 17, title: 'Copiar: primário e réplicas', yk: 'LATÊNCIA OU DADO', fb: ['sp', 'rio', 'rec', 'pg'], dur: 6,
        code: ['primário: pg-sp', 'réplicas: pg-rio e pg-recife', 'commit: 2 ms (assíncrona)', '  12 ms (semi) · 82 ms (síncrona)', 'lag: Rio 300 ms · Recife 800 ms', 'RPO 9 a 24 pedidos · RTO 35 s'],
        story: 'Partir não protege contra o disco queimado: cada shard precisa de réplica. Com o primário em SP e réplicas no Rio e em Recife, o commit custa <b>2 ms</b> (assíncrono), <b>12 ms</b> (semi) ou <b>82 ms</b> (síncrono). O lag é de <b>300 ms</b> no Rio e <b>800 ms</b> em Recife; o RPO é de <b>9 a 24</b> pedidos e o RTO, de <b>35 s</b>. A Lena não vê o <b>1055</b>: lê a réplica de Recife, 800 ms atrás.',
        look: 'Do primário em SP saem dois cabos: um para o Rio e um arco para Recife, que chega 800 ms atrás.',
        key: 'Cada cópia custa ou latência ou dado.',
        f(o, t) { stage(o, 4); lit(o, 'sp', 'rio'); L(o, 'sp>rio'); L(o, 'sp~rec'); const late = t > 1.5 && t < 4;
          late ? bad(o, 'rec') : lit(o, 'rec'); rw(o, 'rec', 'pg-recife · réplica', [late ? 'sem o 1055 ainda' : 'lag 800 ms', late ? 'bad' : 'dim']);
          if (late) TB(o, 'rec', 'Lena: cadê o 1055?', 'bad');
          o.cnt = [['LAG RECIFE', '800 ms', 'bad'], ['COMMIT', '2 · 12 · 82 ms', 'dim'], ['RTO', '35 s', 'dim']]; o.res = [['a Lena lê o passado', 'bad']]; } },
      { id: 'semrep', m: 17, title: 'E se der errado: sem as réplicas', yk: 'TIRE UMA PEÇA: AS RÉPLICAS', fb: ['sp', 'rio', 'rec', 'pg', 'shards'], dur: 5, act: ['Tirar as réplicas', 'o shard-1 cai'],
        code: ['sem réplica:', 'o shard-1 cai', 'a Lena e a Bia: sem pedidos', 'um disco queimado leva o dado'],
        story: 'Sem réplicas, o <code>shard-1</code> cai e a Lena e a Bia <b>ficam sem pedidos</b>, e um disco queimado leva o dado. Quem avisou foram os módulos 16 e 17.',
        look: 'O shard-1 fica vermelho e as réplicas do Rio e de Recife se apagam.',
        key: 'Partir sem copiar troca um banco frágil por três.',
        f(o) { stage(o, 4); bad(o, 'shards'); o.rows.shards.cols[1] = ['shard-1', 1 / 3, 'fora', 'bad'];
          rw(o, 'rio', 'sem réplica', ['nada a promover', 'bad']); rw(o, 'rec', 'sem réplica', ['nada a promover', 'bad']); bad(o, 'rio', 'rec');
          TB(o, 'shards', 'Lena e Bia: sem pedidos', 'bad');
          o.cnt = [['SHARD-1', 'fora', 'bad'], ['LENA E BIA', 'sem pedidos', 'bad'], ['RÉPLICAS', '0', 'bad']]; o.res = [['um disco leva o dado', 'bad']]; } },
    ],
    consistencia: [
      { id: 'b5', title: 'Sem uma transação que cubra tudo', yk: 'O BLOCO 5 · MÓDULOS 18 A 21', fb: 'all', dur: 6,
        code: ['ler de outro modelo (18)', 'compensar (19)', 'guardar os fatos (20)', 'falhar pequeno e rápido (21)'],
        story: 'O dado ficou espalhado em shards e réplicas, e três sintomas apareceram: a tela da Lena lê o <b>passado</b>, o pagamento foi aprovado e o estoque já tinha zerado, e o PSP respondeu em 8 s. Não existe mais uma transação que cubra tudo, então a consistência vem de <b>três jeitos</b> e a loja continua de pé por <b>camadas</b>.',
        look: 'O meus-pedidos, a saga, o event store e o PSP-B acendem em sódio.',
        key: 'Sem transação global: ler de outro modelo, compensar, guardar os fatos.',
        f(o) { over(o, 5); toks(o, ['pg>kafka', 'kafka>mp'], 0.7);
          o.cnt = [['MÓDULOS', '18 a 21'], ['PSP-A', '8 s', 'bad'], ['TRANSAÇÃO GLOBAL', 'nenhuma', 'dim']]; o.res = [['o dado certo por outro caminho', 'acc']]; } },
      { id: 'cqrs', m: 18, title: 'Ler de outro modelo: CQRS e outbox', yk: 'O PEDIDO 1056', fb: ['pg', 'kafka', 'mp', 'es'], dur: 6,
        code: ['outbox: o evento na mesma', '  transação do pedido 1056', 'projetor: 100 eventos/s', 'meus_pedidos:lena-77 = 1.787 B', 'relatório: 235 ms → 0,021 ms'],
        story: 'A tela "meus pedidos" passa a ler de <code>meus-pedidos</code>, um modelo feito para ler. O <b>outbox</b> grava o evento na mesma transação do pedido, e o projetor atualiza o modelo a 100 ev/s. O documento da Lena tem <b>1.787 B</b>, e o relatório cai de <b>235 ms para 0,021 ms</b>. O pedido é o <b>1056</b>.',
        look: 'O evento sai do outbox no banco, passa pelo Kafka e chega ao meus-pedidos.',
        key: 'Ler de um modelo feito para ler.',
        f(o, t) { stage(o, 5); lit(o, 'mp', 'pg'); soft(o, 'kafka'); L(o, 'pg>kafka'); L(o, 'kafka>mp'); fly(o, ['pg>kafka', 'kafka>mp'], lin(t, 0.3, 3.3, 0, 0.999), '1056');
          rw(o, 'pg', 'tabela pedidos', ['+ outbox', 'acc'], 'mesma transação', 'índice B-Tree');
          o.cnt = [['DOCUMENTO', '1.787 B'], ['PROJETOR', '100 ev/s', 'dim'], ['RELATÓRIO', '0,021 ms', 'dim']]; o.res = [['a tela lê a projeção', 'acc']]; } },
      { id: 'saga', m: 19, title: 'Compensar: a saga s-1057', yk: 'SEM ROLLBACK GLOBAL', fb: ['saga', 'pagamentos', 'estoque', 'psp'], dur: 6,
        code: ['s-1057: PAGO → RESERVANDO', 'o estoque zerou (avaria)', 'sem ROLLBACK global:', '  compensa com estorno-c-7732', 'sucesso: 0,9 × 0,95 = 85,5%', 'backoff: 1 · 2 · 4 · 8 · 16 s'],
        story: 'O pagamento do Davi foi aprovado e o estoque zerou (<code>s-1057</code>): sem <code>ROLLBACK</code> global, a saga <b>compensa</b> com o <code>estorno-c-7732</code>. Orquestrada, um maestro decide; coreografada, cada serviço reage a eventos. Com 10% de falha no estoque e 5% no pagamento, o sucesso é <b>85,5%</b>, e o <i>backoff</i> espera <b>1 · 2 · 4 · 8 · 16 s</b>. O pedido é o <b>1057</b>.',
        look: 'A saga acende; o estoque fica vermelho e o estorno volta do pagamentos ao PSP.',
        key: 'Sem transação global, compensa-se.',
        f(o, t) { stage(o, 5); lit(o, 'saga', 'pagamentos'); bad(o, 'estoque'); L(o, 'pagamentos>psp'); const b = lin(t, 1.5, 3.8, 0, 1);
          rw(o, 'estoque', ['CAMISETA-015', 'bad'], ['1 → 0: avaria', 'bad']); rw(o, 'saga', ['s-1057', 'acc'], t < 1.5 ? 'PAGO → RESERVANDO' : ['COMPENSANDO', 'bad']);
          if (b > 0 && b < 1) fly(o, ['pagamentos>psp'], b, 'estorno');
          o.cnt = [['SUCESSO', '85,5%'], ['ESTORNO', 'c-7732', b >= 1 ? 'acc' : 'dim'], ['BACKOFF', '31 s', 'dim']]; o.res = b >= 1 ? [['saga cancelada, Pix estornado', 'acc']] : []; } },
      { id: 'es', m: 20, title: 'Guardar os fatos: o event store', yk: 'O STREAM PEDIDO-1047', fb: ['kafka', 'es', 'mp'], dur: 5,
        code: ['stream pedido-1047:', '  e-501 · e-502 · e-504 · e-505', 'estado = reaplicar os eventos', 'sem snapshot: ~1.800 ms', 'com snapshot: ~13 ms', 'replay completo: 2 h 47 min'],
        story: 'Em <i>event sourcing</i>, o estado do <code>pedido-1047</code> é o resultado de reaplicar os eventos do stream. Sem <i>snapshot</i> a rehidratação leva ~<b>1.800 ms</b>; com ele, ~<b>13 ms</b>. Um <i>replay</i> completo leva <b>2 h 47 min</b>.',
        look: 'O event store acende e os eventos descem do Kafka até ele.',
        key: 'O estado é a soma dos fatos; o snapshot encurta o replay.',
        f(o) { stage(o, 5); lit(o, 'es'); soft(o, 'kafka'); L(o, 'kafka>es'); toks(o, ['kafka>es'], 0.5); rw(o, 'es', ['pedido-1047', 'acc'], 'snapshot 13 ms');
          o.cnt = [['COM SNAPSHOT', '13 ms'], ['SEM', '1.800 ms', 'dim'], ['REPLAY', '2 h 47 min', 'dim']]; o.res = [['o estado é a soma dos fatos', 'acc']]; } },
      { id: 'breaker', m: 21, title: 'O PSP-A a 8 s, com o breaker', yk: 'FALHAR PEQUENO E RÁPIDO', fb: ['pagamentos', 'psp', 'pspb', 'pool'], dur: 6, act: ['Derrubar o PSP-A', 'com o breaker'],
        code: ['20:20: o PSP-A responde em 8 s', 'timeout do PSP: 1 s (crítico 1,67 s)', 'o breaker abre em 1,3 s', 'o PSP-B assume (p50 300 ms)', 'bulkheads de saída: 50/30/20', 'Idempotency-Key: o retry não duplica'],
        story: 'Com o dado certo, falta sobreviver ao PSP-A a 8 s. O <i>timeout</i> do PSP cai para <b>1 s</b> (o crítico é 50 ÷ 30 = <b>1,67 s</b>), o retry usa <i>full jitter</i>, o <i>breaker</i> abre em <b>1,3 s</b> e o PSP-B assume. Os <i>bulkheads</i> de saída dividem o pool em <b>50/30/20</b>, e a <code>Idempotency-Key</code> impede o retry de duplicar. O pedido do Caio é o <b>1058</b>.',
        look: 'O cabo do PSP-A fica vermelho; quando o breaker abre, as fichas passam a ir ao PSP-B.',
        key: 'Falhar rápido e trocar de caminho.',
        f(o, t) { stage(o, 5); bad(o, 'psp'); const open = t > 1.3; lit(o, 'pagamentos'); open ? lit(o, 'pspb') : soft(o, 'pspb');
          L(o, 'pagamentos>psp', 'bad'); if (open) { L(o, 'pagamentos>pspb'); toks(o, ['pagamentos>pspb'], 0.4); } else toks(o, ['pagamentos>psp'], 0.3, 'bad');
          rw(o, 'pagamentos', ['breaker: ' + (open ? 'aberto' : 'fechado'), open ? 'acc' : 'dim'], 'timeout 1 s'); rw(o, 'psp', ['8 s', 'bad'], '20:20:00–20:21:30');
          if (open) TB(o, 'pspb', 'PSP-B assume');
          o.cnt = [['BREAKER', open ? 'aberto' : 'fechado', open ? 'acc' : 'dim'], ['PSP-A', '8 s', 'bad'], ['PSP-B', 'p50 300 ms', 'dim']]; o.res = open ? [['o 1058 passa pelo PSP-B', 'acc']] : []; } },
      { id: 'sembreaker', m: 21, title: 'E se der errado: sem o breaker', yk: 'TIRE UMA PEÇA: O BREAKER', fb: ['pagamentos', 'psp', 'entregas', 'filas', 'pspb'], dur: 6, act: ['Tirar o breaker', 'e o fallback'],
        code: ['o PSP a 8 s, 30 pedidos/s', 'pool de 50 conexões ao PSP', '50 ÷ 30 = 1,67 s para encher', 'pool cheio: o frete e o e-mail', '  esperam junto'],
        story: 'Sem o <i>breaker</i> e o <i>fallback</i>, o PSP a 8 s enche o pool de 50 em <b>1,67 s</b> e leva o frete e o e-mail junto. Quem avisou foi o módulo 21.',
        look: 'O pool do pagamentos enche e fica vermelho; depois o entregas e as filas ficam vermelhos.',
        key: 'Sem o breaker, um vizinho lento ocupa o pool inteiro.',
        f(o, t) { stage(o, 5); bad(o, 'psp'); L(o, 'pagamentos>psp', 'bad'); toks(o, ['pagamentos>psp'], 0.2, 'bad'); const n = Math.min(50, Math.round(t * 30)), full = n >= 50;
          full ? bad(o, 'pagamentos', 'entregas', 'filas') : lit(o, 'pagamentos'); o.rows.pagamentos = { ...o.rows.pagamentos, rows: R([[`pool: ${n} de 50`, full ? 'bad' : 'acc']]), bars: [['', n / 50, full ? 'bad' : '']] };
          o.cnt = [['POOL', n + ' de 50', full ? 'bad' : 'acc'], ['ENCHE EM', '1,67 s', 'bad'], ['PSP-A', '8 s', 'bad']]; o.res = full ? [['o frete e o e-mail esperam junto', 'bad']] : []; } },
    ],
    operar: [
      { id: 'b6', title: 'Mudar sem rede', yk: 'O BLOCO 6 · MÓDULOS 22 A 25', fb: 'all', dur: 6,
        code: ['publicar com raio pequeno (22)', 'planejar o pico (23)', 'testar o plano (24)', 'dividir o compartilhado (25)'],
        story: 'A loja do bloco 5 aguenta uma falha por vez, mas <b>muda sem rede</b>: cada versão nova vai direto para os clientes. A causa mais comum de incidente é a mudança, e as quatro peças deste bloco <b>antecipam</b> o incidente em vez de reagir a ele.',
        look: 'O pipeline, o plano, o k6 e o pool 16 + 4 acendem em sódio.',
        key: 'Antecipar o incidente em vez de reagir a ele.',
        f(o) { over(o, 6); toks(o, ['pedidos>pool', 'pool>pg'], 0.5); poolStrip(o, 16, 2, 4);
          o.cnt = [['MÓDULOS', '22 a 25'], ['VERSÃO', '2.4.0', 'dim'], ['BF 2027', '26/11', 'dim']]; o.res = [['antecipar, não reagir', 'acc']]; } },
      { id: 'canary', m: 22, title: 'A 2.5.0 por canary: R$ 450', yk: 'O RAIO DE UM DEPLOY', fb: ['pipe', 'pedidos', 'pool', 'relatorios'], dur: 6, act: ['Publicar por canary', '10%'],
        code: ['2.5.0: 201 com frete 0,00', '  em Recife: saudável e errada', 'canary: 10 → 50 → 100%', 'raio = fração × tempo × custo', 'canary de 10%: R$ 450', 'a métrica de negócio pega o frete'],
        story: 'O <code>pedidos</code> sai da 2.4.0 para a 2.5.0, que devolve <code>201</code> com <b>frete 0,00</b> em Recife: saudável, sem erro, errada. Pelo <i>canary</i>, só 10% recebem a 2.5.0, e a métrica de negócio pega o frete zerado. O raio é fração × tempo × custo: <b>R$ 450</b>. O pedido da Lena é o <b>1059</b>.',
        look: 'O pipeline acende e a 2.5.0 chega a uma fatia pequena do pedidos.',
        key: 'O raio de um deploy é fração × tempo × custo.',
        f(o, t) { stage(o, 6); lit(o, 'pipe'); const f = t > 1.5 ? 0.1 : lin(t, 0.3, 1.5, 0, 0.1); lit(o, 'pedidos');
          o.rows.pedidos = { ...o.rows.pedidos, rows: R(['2.4.0: 90%', [`2.5.0: ${Math.round(f * 100)}%`, 'bad']]), bars: [['', f, 'bad']] };
          if (t > 3) TB(o, 'pedidos', 'frete 0,00: pego', 'acc');
          o.cnt = [['PERDA', 'R$ 450'], ['FRAÇÃO', Math.round(f * 100) + '%', 'dim'], ['FRETE', '0,00', 'bad']]; o.res = t > 3 ? [['rollback com 10%', 'acc']] : []; } },
      { id: 'plano', m: 23, title: 'Planejar o pico: 41 vCPU', yk: 'LITTLE E O Ρ ALVO', fb: ['plano', 'catalogo', 'pedidos', 'pagamentos', 'estoque'], dur: 5,
        code: ['BF de 26/11/2027', 'L = λ × W · ρ alvo 70%', 'catalogo 14 · pedidos 10', 'pagamentos 15 · estoque 2', '= 41 vCPU', 'para 950 req/s e 200 pedidos/s'],
        story: 'Mudar bem não diz se a loja aguenta a <b>Black Friday de 26/11/2027</b>. A Lei de Little (L = λ × W) e o ρ alvo de <b>70%</b> (perto do joelho a espera explode) dão o plano de <code>catalogo</code>, <code>pedidos</code>, <code>pagamentos</code> e <code>estoque</code>: <b>14 · 10 · 15 · 2 = 41 vCPU</b>, para 950 req/s e 200 pedidos/s.',
        look: 'O plano acende e cada serviço mostra a sua parte dos 41 vCPU.',
        key: 'Planejar antes do pico, com Little e ρ alvo de 70%.',
        f(o) { stage(o, 6); lit(o, 'plano', 'catalogo', 'pedidos', 'pagamentos', 'estoque');
          [['catalogo', 14], ['pedidos', 10], ['pagamentos', 15], ['estoque', 2]].forEach(([id, v]) => rw(o, id, [`plano: ${v} vCPU`, 'acc']));
          o.cnt = [['PLANO', '41 vCPU'], ['CATÁLOGO', '950 req/s', 'dim'], ['CHECKOUT', '200/s', 'dim']]; o.res = [['14 + 10 + 15 + 2 = 41', 'acc']]; } },
      { id: 'k6', m: 24, title: 'Testar o plano: o k6', yk: 'METAS DO TESTE', fb: ['k6', 'pedidos', 'pool', 'relatorios', 'pg'], dur: 7,
        code: ['metas: p95 ≤ 800 ms', '       erros ≤ 0,1%', '"hoje" quebra em 36/s', '"plano" chega a ~250/s', 'cenário misto: o relatório', '  das 23:00 disputa o pool'],
        story: 'Um plano sem teste é hipótese. O k6 mostra que a loja "hoje" quebra em <b>36/s</b> e o "plano" chega a <b>~250/s</b>, com metas de p95 ≤ <b>800 ms</b> e erros ≤ <b>0,1%</b>. O cenário misto acha o que a conta não achou: o <b>relatório das 23:00</b> disputando o pool.',
        look: 'As fichas do k6 sobem no checkout; o relatorios acende junto no cenário misto e disputa o pool.',
        key: 'Plano sem teste é hipótese.',
        f(o, t) { stage(o, 6); lit(o, 'k6', 'pedidos'); const r = Math.round(lin(t, 0.4, 5, 0, 250)), mix = t > 3; mix ? bad(o, 'relatorios', 'pool') : soft(o, 'pool');
          L(o, 'pedidos>pool'); L(o, 'pool>pg'); toks(o, ['pedidos>pool', 'pool>pg'], 0.25); poolStrip(o, 0, mix ? 4 : 8, mix ? 16 : 0, mix ? 'bad' : '');
          rw(o, 'k6', [`carga: ${r}/s`, 'acc'], 'hoje quebra: 36/s'); if (mix) TB(o, 'relatorios', 'misto: o relatório', 'bad');
          o.cnt = [['CARGA', r + '/s'], ['HOJE QUEBRA', '36/s', 'bad'], ['META P95', '≤ 800 ms', 'dim']]; o.res = mix ? [['o relatório disputa o pool', 'bad']] : []; } },
      { id: 'pool', m: 25, title: 'Dividir o compartilhado: 16 + 4', yk: 'O POOL DO BANCO DO PEDIDOS', fb: ['pedidos', 'pool', 'pg', 'relatorios', 'shards'], dur: 6,
        code: ['pool de 20 conexões', '  16: checkout e status', '  4: o relatório das 23:00', '503: 33% e 10% → 0', 'raio do shard quente: 60% → 40%', 'lanes 12 · 6 · 2'],
        story: 'O achado do teste tem remédio: o pool de <b>20 conexões</b> vira <b>16 + 4</b>. Sem a divisão, o relatório deixa <b>33%</b> do checkout e <b>10%</b> do status com <code>503</code>. Com ela, o raio do shard quente cai de <b>60% para 40%</b>. As <i>lanes</i> são <b>12 · 6 · 2</b> e o <code>mkt-01</code> tem teto de 100 req/s no catálogo.',
        look: 'O pool acende entre o pedidos e o banco: o relatório fica nas 4 dele e as 16 do cliente seguem livres.',
        key: 'O bulkhead escolhe quem espera.',
        f(o, t) { stage(o, 6); lit(o, 'pool'); soft(o, 'pedidos', 'relatorios'); L(o, 'pedidos>pool'); L(o, 'pool>pg'); toks(o, ['pedidos>pool', 'pool>pg'], 0.35);
          poolStrip(o, 16, 2, Math.round(lin(t, 0.4, 2.4, 0, 4))); shardCols(o, true, 1, true); rw(o, 'pool', '16 + 4', ['503 do cliente: 0', 'acc']);
          o.cnt = [['503 NO CHECKOUT', '0'], ['POOL', '16 + 4', 'dim'], ['RAIO', '60% → 40%', 'dim']]; o.res = [['o relatório espera, o cliente não', 'acc']]; } },
      { id: 'rolling', m: 22, title: 'E se der errado: a 2.5.0 por rolling', yk: 'TIRE UMA PEÇA: O CANARY', fb: ['pipe', 'pedidos', 'pool', 'relatorios'], dur: 8, act: ['Publicar por rolling', 'sem canary'],
        code: ['rolling: 90 s até 100%', 'frete 0,00 para todos', 'dura 60 min: R$ 54.000', 'se só o relatório das 23:00', '  achar: R$ 486.000'],
        story: 'Pelo <i>rolling</i>, a 2.5.0 chega a todos em 90 s, e sem o <i>canary</i> e a métrica de negócio o frete 0,00 dura <b>60 min</b> e custa <b>R$ 54.000</b> (ou <b>R$ 486.000</b>, se só o relatório das 23:00 achar). Quem avisou foram os módulos 22, 24 e 25.',
        look: 'A 2.5.0 toma o pedidos inteiro, que fica vermelho, e a perda sobe no painel.',
        key: 'Sem canary, o defeito chega a todos.',
        f(o, t) { stage(o, 6); lit(o, 'pipe'); bad(o, 'pedidos'); const f = lin(t, 0.3, 2.5, 0, 1), loss = lin(t, 2.5, 7, 450, 54000);
          o.rows.pedidos = { ...o.rows.pedidos, rows: R([[`2.5.0: ${Math.round(f * 100)}%`, 'bad'], ['frete 0,00', 'bad']]), bars: [['', f, 'bad']] };
          o.cnt = [['PERDA', 'R$ ' + thou(t < 2.5 ? 0 : loss), 'bad'], ['FRAÇÃO', Math.round(f * 100) + '%', 'bad'], ['CANARY', 'R$ 450', 'dim']]; o.res = loss >= 54000 ? [['60 min de frete grátis', 'bad']] : []; } },
    ],
    celulas: [
      { id: 'b7', title: 'Onde a falha pode chegar', yk: 'O BLOCO 7 · MÓDULOS 26 A 28', fb: 'all', dur: 6,
        code: ['dividir a pilha (26)', 'voltar do desastre (27)', 'saber (28)'],
        story: 'Um bulkhead separa recursos <b>dentro</b> de uma pilha, e o veneno do <code>mkt-01</code> mostrou que isso não basta quando a pilha inteira cai junto. O último bloco não adiciona uma funcionalidade: diz <b>onde a falha pode chegar</b>, <b>como se volta</b> quando uma região cai e <b>como se sabe</b> o que aconteceu.',
        look: 'O edge-loja, as quatro células, o DR e os sinais acendem; a moldura marca a celula-recife, uma pilha inteira.',
        key: 'Células, DR e sinais não vendem nada: limitam e mostram a falha.',
        f(o) { over(o, 7); o.frame = 'acc'; toks(o, ['app>edge', 'edge>gw'], 0.6);
          o.cnt = [['CÉLULAS', '4'], ['VERSÃO', '@2.6.0', 'dim'], ['MÓDULOS', '26 a 28', 'dim']]; o.res = [['a pilha inteira vira compartimento', 'acc']]; } },
      { id: 'celulas', m: 26, title: 'Dividir a pilha: 4 células', yk: 'O EDGE-LOJA E O MAPA', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt'], dur: 6,
        code: ['celula-sp 33% · celula-rio 15%', 'celula-recife 12% · celula-mkt 40%', 'edge-loja: cliente_id → mapa', 'shuffle 2 de 10: 1 ÷ 45 = 2,2%', 'plano de 2027: 41 → 53 vCPU', 'pedido 1060 · celula-recife'],
        story: 'A pilha inteira vira <b>4 células</b>: <code>celula-sp</code> (33%), <code>celula-rio</code> (15%), <code>celula-recife</code> (12%) e <code>celula-mkt</code> (40%). O <code>edge-loja</code> lê o <code>cliente_id</code> no mapa e roteia. Cada célula tem uma <b>passiva</b>, o <i>shuffle</i> de 2 em 10 limita o par caído a 1 ÷ 45 = 2,2% dos clientes, e o plano de 2027 passa de <b>41 para 53 vCPU</b>. O pedido da Lena é o <b>1060</b>.',
        look: 'A ficha 1060 sai do app, passa pelo edge-loja e entra na moldura da celula-recife.',
        key: 'A pilha inteira como compartimento.',
        f(o, t) { stage(o, 7); o.frame = 'acc'; lit(o, 'edge', 'sp', 'rio', 'rec', 'mkt'); ['edge>sp', 'edge>rio', 'edge>rec', 'edge>mkt'].forEach(k => L(o, k, 'on'));
          [['sp', 0.33], ['rio', 0.15], ['rec', 0.12], ['mkt', 0.4]].forEach(([id, f]) => { o.rows[id] = { ...o.rows[id], bars: [['', f, '']] }; });
          L(o, 'app>edge'); L(o, 'edge>gw'); fly(o, ['app>edge', 'edge>gw'], lin(t, 0.3, 3, 0, 0.999), '1060');
          o.cnt = [['CÉLULAS', '4'], ['CUSTO', '41 → 53 vCPU', 'dim'], ['SHUFFLE', '2,2%', 'dim']]; o.res = [['lena-77 → celula-recife', 'acc']]; } },
      { id: 'veneno', m: 26, title: 'O veneno do mkt-01 fica na celula-mkt', yk: 'A POISON PILL DAS 20:25', fb: ['edge', 'sp', 'rio', 'rec', 'mkt', 'app'], dur: 7, act: ['Mandar o veneno', 'mkt-01'],
        code: ['20:25:00: quantidade 2147483648', 'pilha única: 7.200 tentativas', '  perdidas em 4 min', 'células: 2.880, só do mkt-01', 'celula-recife: o 1060 passa'],
        story: 'Às <b>20:25:00</b> o <code>mkt-01</code> manda a <i>poison pill</i> (<code>quantidade: 2147483648</code>). Com a pilha única, em 4 min seriam <b>7.200</b> tentativas perdidas; com células, <b>2.880</b>, todas do próprio <code>mkt-01</code>. A <code>celula-mkt</code> cai sozinha, e o 1060 da Lena passa na <code>celula-recife</code>.',
        look: 'A ficha vermelha vai do edge-loja à celula-mkt, que fica vermelha; as outras três seguem acesas.',
        key: 'O veneno derruba só a célula de quem o mandou.',
        f(o, t) { stage(o, 7); o.frame = 'acc'; lit(o, 'edge', 'sp', 'rio', 'rec'); const a = lin(t, 0.3, 2.3, 0, 1), down = a >= 1;
          L(o, 'edge>mkt', down ? 'bad' : 'on'); if (!down) fly(o, ['edge>mkt'], a, 'mkt-01', 'bad'); down ? bad(o, 'mkt') : lit(o, 'mkt');
          L(o, 'app>edge'); L(o, 'edge>gw'); fly(o, ['app>edge', 'edge>gw'], lin(t, 2.5, 5, 0, 0.999), '1060');
          const n = lin(t, 2.3, 6.5, 0, 2880); if (down) rw(o, 'mkt', ['fora: o veneno', 'bad'], [`perdidas: ${thou(n)}`, 'bad']);
          o.cnt = [['PERDIDAS', thou(n), 'bad'], ['PILHA ÚNICA', '7.200', 'dim'], ['CELULA-RECIFE', 'vendendo']]; o.res = down ? [['só a celula-mkt cai', 'acc']] : []; } },
      { id: 'sp', m: 27, title: 'SP cai: RTO de 65 s', yk: 'A QUEDA DAS 20:40:00.150', fb: ['sp', 'rio'], dur: 9, act: ['Derrubar SP', '20:40:00.150'],
        code: ['sondas de 10 s · 3 falhas', '  MTTD = 30 s', 'promoção do Rio: MTTR 35 s', 'RTO = 30 + 35 = 65 s', 'RPO esperado: 9,9 × 0,3 = 2,97', 'o 1061 da Bia: perdido'],
        story: 'Células ajudam, mas uma região ainda pode cair. Às <b>20:40:00.150</b> cai SP. As sondas de 10 s precisam de 3 falhas: <b>MTTD de 30 s</b>. A passiva no Rio é promovida, o MTTR é de 35 s e o <b>RTO, de 65 s</b>. O RPO esperado da <code>celula-sp</code> é <b>2,97</b> pedidos: o <b>1061</b> da Bia (108,80) se perdeu, e a sequência do banco promovido reusou o número com o Davi. A auditoria acha <b>12 elos e 5 SPoFs</b>.',
        look: 'SP fica vermelha; o DR acende, o relógio corre até 65 s e o Rio assume.',
        key: 'O RTO conta da interrupção, e o RPO é conta.',
        f(o, t) { stage(o, 7); o.frame = 'dim'; bad(o, 'sp'); lit(o, 'dr'); const s = Math.min(65, Math.round(lin(t, 0.5, 7, 0, 65))), ok = s >= 65;
          ok ? lit(o, 'rio') : soft(o, 'rio'); L(o, 'sp>rio', ok ? 'on' : 'bad'); rw(o, 'sp', ['fora desde 20:40:00.150', 'bad'], ['1061 da Bia: perdido', 'bad']);
          rw(o, 'dr', [s < 30 ? 'sondas: falha ' + Math.min(3, Math.floor(s / 10) + 1) + ' de 3' : 'MTTD 30 s', 'acc'], s >= 30 ? ['promovendo o Rio', ok ? 'dim' : 'acc'] : 'esperando', ok ? ['RTO 65 s', 'acc'] : 'RTO …', 'runbook', '12 elos · 5 SPoFs');
          TB(o, 'sp', `relógio: ${s} s`, ok ? 'acc' : 'bad'); if (ok) { rw(o, 'rio', 'celula-rio 15%', ['+ celula-sp: assumiu', 'acc']); TB(o, 'rio', 'Rio assumiu'); }
          o.cnt = [['RELÓGIO', s + ' s', ok ? 'acc' : 'bad'], ['MTTD', '30 s', 'dim'], ['RPO', '2,97', 'dim']]; o.res = ok ? [['RTO 65 s · o 1061 se perdeu', 'bad']] : []; } },
      { id: 'sinais', m: 28, title: 'Saber: logs, métricas e traces', yk: 'O PEDIDO 1063', fb: ['obs', 'pedidos', 'estoque', 'pool', 'pspb'], dur: 6,
        code: ['1063: 1.895 ms (normal: 275)', 'espera de lock no estoque: 1.620 ms', 'SLO 99,9% em 30 d · SLA 99,5%', 'orçamento: 43,2 min', 'burn rate 14,4×: 2% em 1 h', 'USE · RED · quatro sinais'],
        story: 'Voltar rápido só vale se alguém percebe a queda. Os <b>três sinais</b> (logs, métricas e traces) ligados pelo <code>traceparent</code> mostram o <b>1063</b> de 1,9 s, onde o normal são 275 ms: uma espera de lock de 1.620 ms no <code>estoque</code>. O alerta acorda por sintoma, o SLI vira <b>SLO de 99,9%</b> (e SLA de 99,5%), o orçamento é de <b>43,2 min</b> e o <i>burn rate</i> de <b>14,4×</b> consome 2% em 1 h.',
        look: 'Os sinais acendem; o trace do 1063 aponta o estoque em vermelho, o salto lento.',
        key: 'Ver por pedido e decidir por orçamento de erro.',
        f(o) { stage(o, 7); lit(o, 'obs'); bad(o, 'estoque'); soft(o, 'pedidos'); L(o, 'pedidos>estoque', 'bad');
          rw(o, 'estoque', ['lock: 1.620 ms', 'bad'], 'no 1063'); rw(o, 'obs', ['trace do 1063', 'acc'], ['1.895 ms', 'bad'], 'SLO 99,9%', '43,2 min / 30 d');
          TB(o, 'estoque', 'span lento', 'bad');
          o.cnt = [['1063', '1,9 s', 'bad'], ['NORMAL', '275 ms', 'dim'], ['ORÇAMENTO', '43,2 min', 'dim']]; o.res = [['que, onde, por quê', 'acc']]; } },
      { id: 'semsinais', m: 28, title: 'E se der errado: sem a observabilidade', yk: 'TIRE UMA PEÇA: OS SINAIS', fb: ['obs', 'dr', 'estoque', 'pedidos', 'sp'], dur: 5, act: ['Tirar os sinais', 'logs, métricas, traces'],
        code: ['MTTD: 30 s → 60 min', 'a Lena espera 1,9 s', '  e ninguém sabe onde', 'sem a passiva e o DR:', '  RTO ~48 min · R$ 2,28 mi'],
        story: 'Sem a observabilidade, o MTTD volta de <b>30 s para 60 min</b>, e a Lena espera <b>1,9 s</b> sem que ninguém saiba onde. Sem a passiva e o DR, SP cai com RTO de <b>~48 min</b> e R$ <b>2,28 mi</b> perdidos. Sem o roteador por célula, o veneno derruba os <b>3 pods</b> do <code>pedidos</code> em 150 ms. Quem avisou foram os módulos 26, 27 e 28.',
        look: 'Os sinais afundam; o estoque fica vermelho e nenhum alerta acende.',
        key: 'Sem sinais, quem descobre o incidente é a Lena.',
        f(o) { stage(o, 7); sink(o, 'obs'); bad(o, 'estoque'); rw(o, 'estoque', ['lento: ninguém vê', 'bad']); rw(o, 'dr', ['MTTD 60 min', 'bad'], 'sem alerta');
          o.cnt = [['MTTD', '60 min', 'bad'], ['COM SINAIS', '30 s', 'dim'], ['1063', '1,9 s', 'bad']]; o.res = [['a Lena descobre antes', 'bad']]; } },
    ],
  };

  // ── tudo: os 14 saltos do 1060 ──
  const SAL = [
    { t: 'O app resolve e conecta', mods: [1, 26], path: ['app>edge'], lit: ['app', 'edge'], fb: ['app', 'edge', 'gw', 'cdn'], k: ['RTT ATÉ SP', 'fora do caminho'],
      s: 'O app da Lena (Recife) resolve <code>loja.com.br</code> (DNS) e abre a conexão (TCP + TLS). A célula de Recife tira do caminho os 80 ms de RTT até SP.' },
    { t: 'O edge-loja olha o mapa', mods: [26, 8], path: ['edge>gw'], lit: ['edge', 'rec'], fb: ['app', 'edge', 'gw', 'sp', 'rec'], k: ['CÉLULA', 'celula-recife'],
      s: 'O <code>edge-loja</code> lê o <code>cliente_id</code> do JWT e olha o mapa (150 MB): <code>lena-77</code> → <code>celula-recife</code>.' },
    { t: 'A porta, o balanceador e o BFF', mods: [8, 7, 9], path: ['gw>lb', 'lb>bff'], lit: ['gw', 'lb', 'bff'], fb: ['edge', 'gw', 'lb', 'bff'], k: ['ROTA', 'gw → lb → bff-app'],
      s: 'Na célula, o <code>gw-loja</code> valida o token e aplica o <i>rate limit</i>; o <code>lb</code> escolhe um <code>bff-app</code>.' },
    { t: 'O POST com prazo e Idempotency-Key', mods: [21, 10], path: ['bff>pedidos'], lit: ['bff', 'pedidos', 'mesh'], fb: ['bff', 'pedidos', 'mesh', 'lb'], k: ['POST /PEDIDOS', 'não duplica'],
      s: 'O <code>bff-app</code> chama o <code>pedidos</code> com prazo pela malha (mTLS, retry com regra); com a <code>Idempotency-Key</code>, o <code>POST /pedidos</code> não duplica.' },
    { t: 'O estoque reserva os 2 gatos', mods: [11, 26], path: ['pedidos>estoque', 'estoque>redis'], lit: ['estoque', 'redis'], fb: ['pedidos', 'estoque', 'redis'], k: ['REC-1', '2 → 0'],
      s: 'O <code>pedidos</code> reserva o estoque: o <i>lock</i> na linha do gato e a alocação da célula, <code>REC-1</code>, de 2 para 0 (gato 19 → 17).' },
    { t: 'O pagamentos cobra no PSP-A', mods: [12, 21, 25], path: ['pedidos>pagamentos', 'pagamentos>psp'], lit: ['pagamentos', 'psp', 'pspb'], fb: ['pedidos', 'pagamentos', 'psp', 'pspb'], k: ['POOL', '50 · 50/30/20'],
      s: 'O <code>pagamentos</code> cobra no PSP-A (REST/Pix), com <i>breaker</i>, o PSP-B de reserva e o pool de 50 em <i>bulkheads</i> 50/30/20.' },
    { t: 'O banco grava, com outbox', mods: [4, 18], path: ['pedidos>pool', 'pool>pg'], lit: ['pool', 'pg'], fb: ['pedidos', 'pool', 'pg'], k: ['GRAVOU', '1060 + PedidoCriado'],
      s: 'O <code>pedidos</code> grava no PostgreSQL da célula, com índice B-Tree, e o evento <code>PedidoCriado</code> vai ao outbox na mesma transação.' },
    { t: 'O relay publica no Kafka', mods: [13], path: ['pg>kafka', 'kafka>entregas'], lit: ['kafka', 'entregas'], fb: ['pg', 'kafka', 'entregas', 'es'], k: ['CHAVE', 'pedido_id'],
      s: 'O <i>relay</i> (CDC) publica no Kafka da célula, com a chave <code>pedido_id</code>; os grupos <code>estoque</code>, <code>entregas</code> e <code>notificacoes</code> consomem.' },
    { t: 'A saga segue', mods: [19], path: [], lit: ['saga', 'pagamentos', 'estoque', 'entregas'], fb: ['saga', 'pagamentos', 'estoque', 'entregas'], k: ['SAGA', 'pagou · reservou · agendou'],
      s: 'A saga segue: pagou, reservou, agendou a entrega. Se um passo falhasse, ela compensaria com o estorno.' },
    { t: 'O stream e a projeção', mods: [20, 18], path: ['kafka>es'], lit: ['es', 'mp'], fb: ['kafka', 'es', 'mp'], k: ['STREAM', 'pedido-1060'],
      s: 'Os eventos formam o stream <code>pedido-1060</code>, e o projetor atualiza <code>meus_pedidos:lena-77</code>.' },
    { t: 'A Lena lê a própria célula', mods: [18, 26], path: ['-kafka>mp'], lit: ['mp', 'rec'], fb: ['mp', 'kafka', 'rec', 'pg'], k: ['O 1055', 'não se repete'],
      s: 'A tela "meus pedidos" lê a projeção da própria célula. Com o primário em Recife, a réplica 800 ms atrás do módulo 17 não existe mais: o 1055 (o pedido que a Lena não via) não se repete.' },
    { t: 'A passiva em SP recebe a cópia', mods: [17, 26], path: ['pg~sp'], lit: ['pg', 'sp'], fb: ['pg', 'sp', 'rio', 'rec'], k: ['LAG', '800 ms · RPO 2,88'],
      s: 'O banco da célula replica para a célula passiva em SP: lag de 800 ms, RPO esperado de 3,6 × 0,8 = 2,88 pedidos.' },
    { t: 'O mesmo trace_id em tudo', mods: [28], path: [], lit: ['obs'], fb: ['obs', 'pedidos', 'pagamentos', 'pg', 'kafka'], k: ['SLI', '+1 bom (2xx, ≤ 800 ms)'],
      s: 'Cada salto deixa log, métrica e trace com o mesmo <code>trace_id</code>; o SLI do checkout (2xx e ≤ 800 ms) conta mais um "bom".' },
    { t: 'E se der errado: o veneno no mesmo instante', mods: [26], path: ['edge>mkt'], lit: ['rec', 'edge'], fb: ['edge', 'sp', 'rio', 'rec', 'mkt'], k: ['A LENA', 'não nota'],
      s: 'Se o veneno do <code>mkt-01</code> chegasse no mesmo instante, a Lena não notaria: a <code>celula-mkt</code> cai sozinha, e o 1060 segue na <code>celula-recife</code>.' },
  ];
  const FULL = ['app>edge', 'edge>gw', 'gw>lb', 'lb>bff', 'bff>pedidos', 'pedidos>estoque', 'pedidos>pagamentos', 'pagamentos>psp', 'pedidos>pool', 'pool>pg', 'pg>kafka', 'kafka>entregas', 'kafka>es', 'kafka>mp'];
  const PATHB = ['app', 'edge', 'gw', 'lb', 'bff', 'pedidos', 'estoque', 'pagamentos', 'psp', 'pool', 'pg', 'kafka', 'entregas', 'es', 'mp'];
  STEPS.tudo = [
    { id: 'tudo', title: 'A loja inteira: o pedido 1060', yk: 'LENA · CELULA-RECIFE · 20:25:00.000', fb: 'all', dur: 10,
      code: ['2 gatos 159,80 + frete 15,00', '  = 174,80 · gato 19 → 17', '14 saltos · 28 módulos', '7 blocos acesos', 'nenhum pedido novo'],
      story: 'O pedido da Lena que atravessa mais peças é o <b>1060</b> (<code>celula-recife</code>, 20:25:00.000, 2 gatos de 159,80 + frete de 15,00 = <b>174,80</b>). Ele salta por 14 peças, e cada uma vem de um módulo. O pedido está certo se você diz, de cada salto, qual problema resolveu e o que o faria falhar.',
      look: 'As sete camadas estão no mapa. A ficha do 1060 percorre o caminho inteiro; avance para seguir salto por salto.',
      key: 'Cada salto do 1060 é um módulo que você já estudou.',
      f(o, t) { stage(o, 7); o.frame = 'acc'; soft(o, ...PATHB); FULL.forEach(k => L(o, k, 'on'));
        const order = ['app>edge', 'edge>gw', 'gw>lb', 'lb>bff', 'bff>pedidos', 'pedidos>pool', 'pool>pg', 'pg>kafka', 'kafka>entregas'];
        fly(o, order, (t % 9.5) / 9, '1060');
        o.cnt = [['PEDIDO', '1060'], ['TOTAL', '174,80', 'dim'], ['SALTOS', '14', 'dim']]; o.res = [['14 saltos, 28 módulos', 'acc']]; } },
    ...SAL.map((s, i) => ({ id: 'salto' + (i + 1), m: s.mods[0], mods: s.mods, title: `Salto ${i + 1}: ${s.t}`, yk: `SALTO ${i + 1} DE 14 · MÓDULOS ${s.mods.join(' · ')}`, fb: s.fb, dur: 5,
      act: i === 13 ? ['Mandar o veneno', 'no mesmo instante'] : null,
      code: [s.s.replace(/<[^>]+>/g, '')], story: s.s,
      look: i === 13 ? 'A ficha vermelha do mkt-01 cai na celula-mkt; a celula-recife segue acesa com o 1060.'
        : s.path.length ? 'A ficha do 1060 anda pelo cabo deste salto; as peças do salto acendem em sódio.' : 'As peças do salto acendem em sódio; o resto do caminho fica aceso em tom fraco.',
      key: i === 13 ? 'Com células, o veneno de um não chega ao pedido de outro.' : `Salto ${i + 1}: módulo${s.mods.length > 1 ? 's' : ''} ${s.mods.join(', ')}.`,
      f(o, t) { stage(o, 7); o.frame = 'acc'; soft(o, ...PATHB); FULL.forEach(k => L(o, k, 'on')); lit(o, ...s.lit);
        if (i === 13) { const a = lin(t, 0.3, 2.3, 0, 1); L(o, 'edge>mkt', a >= 1 ? 'bad' : 'on'); if (a < 1) fly(o, ['edge>mkt'], a, 'veneno', 'bad'); else bad(o, 'mkt');
          fly(o, ['app>edge', 'edge>gw'], lin(t, 0.6, 3, 0, 0.999), '1060'); }
        else if (s.path.length) { s.path.forEach(k => L(o, k[0] === '-' ? k.slice(1) : k)); fly(o, s.path, lin(t, 0.3, 3, 0, 0.999), '1060'); }
        if (i === 8) ['pagou', 'reservou', 'agendou'].forEach((w, j) => { if (t > 0.5 + j * 1.2) TB(o, ['pagamentos', 'estoque', 'entregas'][j], w); });
        if (i === 10) TB(o, 'mp', 'Lena lê aqui');
        if (i === 12) ['pedidos', 'pagamentos', 'pg', 'kafka'].forEach(id => TB(o, id, 'trace_id', 'acc', 18));
        if (i === 4) rw(o, 'estoque', 'lock no gato', ['REC-1: 2 → 0', 'acc']);
        o.cnt = [['SALTO', `${i + 1} de 14`], [s.k[0], s.k[1], i === 13 ? 'acc' : 'dim'], ['MÓDULOS', s.mods.join(' · '), 'dim']];
        o.res = [[s.k[1], i === 13 ? 'acc' : 'acc']]; } })),
  ];

  // ── falha: tire uma peça (as 13 da tabela) ──
  const PEC = [
    { p: 'o cache', mod: 5, av: '5 e 21', down: ['redis'], mancha: ['pg', 'catalogo'], n: '5 ms → 41 ms', q: 'O tempo médio vai de 5 ms (h = 90%) a 41 ms, 8,2 vezes mais, e o catálogo manda 640 req/s à origem em vez de 128.', fb: ['catalogo', 'redis', 'pg'] },
    { p: 'o balanceador', mod: 7, av: '7', down: ['lb'], mancha: ['catalogo', 'bff'], n: '20 ms → 1,8 s', q: 'Os 9 primeiros pedidos vão para o catalogo-1: CPU em 100% e 20 ms viram 1,8 s.', fb: ['gw', 'lb', 'bff', 'catalogo'] },
    { p: 'o gateway', mod: 8, av: '8', down: ['gw'], mancha: ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas'], n: '6 endereços · 500/s', q: 'O app passa a conhecer 6 endereços; cada serviço faz login e rate limit do seu jeito; o robô de 500/s chega direto.', fb: ['edge', 'gw', 'catalogo', 'pagamentos', 'entregas'] },
    { p: 'o lock distribuído', mod: 11, av: '11', down: [], mancha: ['estoque'], at: 'estoque', n: 'estoque −1', q: 'Duas réplicas do estoque vendem o último gato duas vezes.', fb: ['pedidos', 'estoque', 'redis'] },
    { p: 'a idempotência', mod: 21, av: '21', down: [], mancha: ['pedidos', 'pagamentos', 'psp'], at: 'pedidos', n: '2 pedidos · 2 cobranças', q: 'O retry do POST cria dois pedidos e duas cobranças.', fb: ['bff', 'pedidos', 'pagamentos', 'psp'] },
    { p: 'as réplicas', mod: 17, av: '16 e 17', down: ['shards'], mancha: ['mp', 'sp'], n: 'shard-1 fora do ar', q: 'O shard-1 cai e a Lena e a Bia ficam sem pedidos; um disco queimado leva o dado.', fb: ['pg', 'shards', 'sp', 'mp'] },
    { p: 'o outbox', mod: 18, av: '18', down: [], mancha: ['pg', 'kafka', 'mp', 'es'], at: 'pg', n: '1 gravação, 2 sistemas', q: 'O pedido é gravado e o evento nunca sai: dois sistemas, uma gravação só.', fb: ['pg', 'kafka', 'mp', 'es'] },
    { p: 'o breaker e o fallback', mod: 21, av: '21', down: ['pspb'], mancha: ['pagamentos', 'psp', 'entregas', 'filas'], n: '1,67 s · pool de 50', q: 'O PSP a 8 s enche o pool em 1,67 s e leva o frete e o e-mail junto.', fb: ['pagamentos', 'psp', 'pspb', 'entregas'] },
    { p: 'o canary e a métrica de negócio', mod: 22, av: '22', down: ['pipe'], mancha: ['pedidos'], n: 'R$ 54.000 · R$ 486.000', q: 'O frete 0,00 dura 60 min: R$ 54.000 (e R$ 486.000 se só o relatório das 23:00 achar).', fb: ['pipe', 'pedidos', 'pool', 'relatorios'] },
    { p: 'o bulkhead do pool', mod: 25, av: '25', down: ['pool'], mancha: ['pedidos', 'mp'], n: '33% · 10% de 503', q: 'O relatório das 23:00 deixa 33% do checkout e 10% do status com 503.', fb: ['pedidos', 'pool', 'pg', 'relatorios'] },
    { p: 'o roteador por célula', mod: 26, av: '26', down: ['edge'], mancha: ['pedidos', 'sp', 'rio', 'rec', 'mkt'], n: '7.200 tentativas · 150 ms', q: 'O veneno do mkt-01 derruba os 3 pods do pedidos em 150 ms: 7.200 tentativas, 100% delas.', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt'] },
    { p: 'a passiva e o DR', mod: 27, av: '27', down: ['dr'], mancha: ['sp'], n: '65 s × ~48 min · R$ 2,28 mi', q: 'SP cai. Com a passiva warm o RTO é 65 s (643,5 tentativas falham); só com backup o RTO é ~48 min e custa R$ 2,28 mi.', fb: ['sp', 'rio', 'dr', 'obs'] },
    { p: 'a observabilidade', mod: 28, av: '28', down: ['obs'], mancha: ['estoque'], n: '30 s → 60 min · 1,9 s', q: 'O MTTD volta de 30 s para 60 min; a Lena espera 1,9 s e ninguém sabe onde.', fb: ['obs', 'dr', 'estoque', 'pedidos'] },
  ];
  // em que passo cai cada clique (as peças sem linha na tabela não fazem nada)
  const CLICK = { redis: 1, cdn: 1, lb: 2, gw: 3, estoque: 4, pedidos: 5, bff: 5, shards: 6, rio: 6, rec: 6, pg: 7, kafka: 7, mp: 7, es: 7,
    pagamentos: 8, psp: 8, pspb: 8, pipe: 9, pool: 10, edge: 11, mkt: 11, dr: 12, sp: 12, obs: 13 };
  STEPS.falha = [
    { id: 'falha', title: 'Tire uma peça: clique numa peça', yk: 'A PROVA FINAL · 13 PEÇAS', fb: 'all', dur: 6,
      code: ['clique numa peça do mapa', '  para derrubá-la', 'vermelho: a mancha', 'o painel: o que quebra,', '  o número e quem avisou', '→ percorre as 13 em ordem'],
      story: 'A prova final olha o "e se der errado" ao contrário: tire uma peça e diga o que quebra. <b>Clique numa peça do mapa</b> para derrubá-la, ou avance com a seta para seguir as 13 da tabela em ordem. Cada uma mostra a mancha (as peças que ela leva junto), o número e o módulo que avisou.',
      look: 'O mapa inteiro está aceso. As peças com linha na tabela são o Redis, o lb-loja, o gw-loja, o estoque, o pedidos, os shards, o banco, o pagamentos, o pipeline, o pool, o edge-loja, o DR e os sinais.',
      key: 'Uma peça está entendida quando você sabe o que quebra sem ela.',
      f(o) { stage(o, 7); o.frame = 'dim'; Object.keys(CLICK).forEach(id => soft(o, id));
        o.cnt = [['PEÇAS', '13'], ['BLOCOS', '7', 'dim'], ['PERGUNTAS', '80', 'dim']]; o.res = [['clique numa peça', 'acc']]; } },
    ...PEC.map((c, i) => ({ id: 'peca' + (i + 1), m: c.mod, title: `Sem ${c.p}`, yk: `TIRE UMA PEÇA · ${i + 1} DE 13`, fb: c.fb, dur: 5,
      code: [c.q], story: `${c.q} Quem avisou: módulo${c.av.includes(' e ') ? 's' : ''} ${c.av}.`,
      look: c.down.length ? 'A peça afunda e fica vermelha; as peças da mancha ficam vermelhas com ela.' : 'Esta peça é uma regra, não uma caixa: as peças da mancha ficam vermelhas.',
      key: `Sem ${c.p}: ${c.n}.`,
      f(o) { stage(o, 7); o.frame = 'dim'; c.down.forEach(id => sink(o, id)); bad(o, ...c.mancha);
        if (i === 3) rw(o, 'estoque', ['gato: 1 → −1', 'bad'], 'sem lock');         if (i === 6) rw(o, 'pg', 'tabela pedidos', ['sem outbox', 'bad'], 'o evento não sai', 'índice B-Tree');
        if (i === 9) poolStrip(o, 0, 4, 16, 'bad');
        TB(o, c.at || c.down[0] || c.mancha[0], c.n, 'bad', 30);
        o.cnt = [['O NÚMERO', c.n, 'bad'], ['PEÇA', c.p, 'dim'], ['AVISOU', 'módulo ' + c.av, 'dim']]; o.res = [[c.n, 'bad']]; } })),
    { id: 'teto', m: 26, title: 'E se der errado: o roteador e o mapa juntos', yk: 'O TETO DA LOJA', fb: ['app', 'edge', 'sp', 'rio', 'rec', 'mkt', 'gw'], dur: 6, act: ['Derrubar o roteador', 'e o mapa, juntos'],
      code: ['as células isolam a falha', '  de uma célula', 'o edge-loja e o mapa: um só', '  na frente de todas', 'edge-loja: 99,99%', 'é o teto de disponibilidade'],
      story: 'Derrubar o roteador e o mapa ao mesmo tempo mostra o limite das células: elas isolam a falha de uma célula, mas o <code>edge-loja</code> fica na frente de todas. Com os dois fora, nenhuma célula recebe pedido, e os <b>99,99%</b> do <code>edge-loja</code> são o teto de disponibilidade da loja.',
      look: 'O edge-loja afunda; as quatro células ficam vermelhas juntas, mesmo inteiras.',
      key: 'O roteador das células é o teto da loja inteira.',
      f(o, t) { stage(o, 7); o.frame = 'bad'; sink(o, 'edge'); const d = t > 1.2; if (d) bad(o, 'sp', 'rio', 'rec', 'mkt', 'app');
        rw(o, 'edge', ['roteador: fora', 'bad'], [d ? 'mapa: fora' : 'mapa 150 MB', d ? 'bad' : 'dim']);
        ['edge>sp', 'edge>rio', 'edge>rec', 'edge>mkt', 'app>edge'].forEach(k => L(o, k, d ? 'bad' : 'on'));
        o.cnt = [['TETO', '99,99%', 'bad'], ['CÉLULAS FORA', d ? '4 de 4' : '…', 'bad'], ['PEÇA', 'edge-loja', 'dim']]; o.res = d ? [['nenhuma célula recebe', 'bad']] : []; } },
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
  const modLink = n => `<a class="o3-modl" href="../../${MOD[n][0]}/" target="_top">Módulo ${n} · ${MOD[n][1]} →</a>`;
  function dataHtml() {
    const s = cur();
    if (sc === 'tudo') return `<ol class="h3-now">${SAL.map((x, i) => `<li${on_(step === i + 1)}>${x.t} <span>(${x.mods.join(', ')})</span></li>`).join('')}</ol>`;
    if (sc === 'falha') return `<table class="h3-sum"><tr><th>se você tira…</th><th>o número</th><th>avisou</th></tr>${PEC.map((c, i) => `<tr${on_(step === i + 1)}><td>${c.p}</td><td>${c.n}</td><td>${c.av}</td></tr>`).join('')}</table><li>As faixas da prova final: 72 ou mais acertos (90%) · 56 a 71 (70% a 89%) · abaixo de 56</li><li>O <code>edge-loja</code> (99,99%) é o teto de disponibilidade da loja</li>`;
    const [a, b] = BLOCOS[BLK[sc]], ms = Array.isArray(s.mods) ? s.mods : [s.m];
    let h = `<table class="h3-sum"><tr><th>módulo</th><th>o número que fica</th></tr>`;
    for (let n = a; n <= b; n++) h += `<tr${on_(ms.includes(n))}><td><a href="../../${MOD[n][0]}/" target="_top">${n} · ${MOD[n][1]}</a></td><td>${MOD[n][2]}</td></tr>`;
    return h + `</table><li>Cada peça nova acende em sódio; as dos blocos anteriores ficam em grafite</li><li>As peças que ainda não existem neste bloco não aparecem</li>`;
  }
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (derrubar, ligar, publicar…) e leva até ele
  function actHtml() { const nx = Lst()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Modo">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      ${s.m ? modLink(s.m) : ''}
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${dataHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'loja') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar modo', 'C', cycleSc]],
    view: NARROW() ? { target: W(585, 400, -200), dist: innerWidth < 640 ? 24 : 26 } : { target: W(420, 380, 60), dist: 22 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · modo: C ou 1–9 · no modo Falha, clique numa peça · arraste para girar' };
})() });
