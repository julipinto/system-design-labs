// Figura 3D (iso-glow): desfazer, registrar e não perder. O orquestrador da saga do 1057 no meio da prancha, com o que
// cada cenário precisa em volta; as peças de um cenário sobem e as dos outros descem para dentro da prancha.
// Log: pedidos, pagamentos (PSP, Pix c-7732) e estoque à esquerda; a tabela saga embaixo do orquestrador; o saga_log
// como uma pilha de linhas à direita e a vigia na frente dele.
// Estorno: pedidos e notificacoes à esquerda; o PSP (com a fita das tentativas) e o plantão (INTERVENCAO) à direita.
// Dual write: o banco do orquestrador (saga + outbox) e o relay à esquerda; o tópico estoque-commands e o estoque à direita.
// Reserva antes: as duas ordens como duas trilhas lado a lado; o app do Davi e as reservas presas à direita.
// Lab: o simulador (20 pedidos numa grade) à esquerda; pedidos, estoque, pagamentos e entregas do repositório à direita.
// Atrás, o mostrador (contadores, a conta ou o código, o resultado).
// Cenários (botões e ?mode=log|estorno-falha|dual-write|reserva-antes|lab; ?step=N abre no passo N).
// Dados: docs/escrita/saga-brief.md e as aulas 6–10 (log real do s-1057 com 7 linhas; duplicata e-1902 → f; vigia s-teste
// 19:20; backoff 1, 2, 4, 8, 16 s = 31 s; 44,95 s × ~100 ms; 3.600 unidades; 85,5% / 10% / 4,5%; 1.632.960.000 linhas).
FIGS3D.push({ id: 'compensacao', name: 'Compensation', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['log', 'estorno-falha', 'dual-write', 'reserva-antes', 'lab'];
  const SCNAME = { log: 'Log', 'estorno-falha': 'Refund', 'dual-write': 'Dual write', 'reserva-antes': 'Reserve first', lab: 'Lab' };
  const SCFULL = { log: 'The saga log', 'estorno-falha': 'The refund that fails', 'dual-write': 'The dual write',
    'reserva-antes': 'Charge first × reserve first', lab: 'The author\'s lab' };
  const AULA = { log: 'aula-8-logs-de-saga', 'estorno-falha': 'aula-7-fluxos-de-compensacao', 'dual-write': 'aula-9-dual-write',
    'reserva-antes': 'aula-10-exemplo-de-sistema-de-pedidos-distribuido', lab: 'aula-10-exemplo-de-sistema-de-pedidos-distribuido' };
  let clk = 0, sc = 'log', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-compensacao3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  const fam = () => ({ log: 'L', 'estorno-falha': 'E', 'dual-write': 'D', 'reserva-antes': 'R', lab: 'B' })[sc];

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 46, SW = 500, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças dos cinco cenários; cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // comuns: o orquestrador e a tabela saga
  block('orq', 300, 150, 240, 180, 34); block('saga', 300, 350, 240, 85, 18);
  // Log
  block('lped', 40, 150, 220, 80, 22); block('lpag', 40, 250, 220, 80, 22); block('lest', 40, 350, 220, 85, 22);
  block('log', 580, 40, 310, 300, 26); block('vig', 580, 360, 310, 75, 14);
  // Estorno
  block('eped', 40, 150, 220, 120, 24); block('enot', 40, 300, 220, 135, 24);
  block('psp', 580, 40, 310, 170, 26); block('gente', 580, 240, 310, 195, 26);
  // Dual write
  block('ddb', 40, 150, 220, 180, 34); block('drel', 40, 350, 220, 85, 18);
  block('dkaf', 580, 40, 310, 110, 12); block('dest', 580, 190, 310, 160, 26);
  // Reserva antes
  block('ra', 40, 150, 500, 130, 20); block('rb', 40, 305, 500, 130, 20);
  block('rdav', 580, 40, 310, 150, 26); block('rpre', 580, 230, 310, 205, 26);
  // Lab
  block('sim', 40, 150, 220, 285, 26);
  block('bped', 580, 40, 310, 88, 22); block('best', 580, 140, 310, 88, 22); block('bpag', 580, 240, 310, 88, 22); block('bent', 580, 340, 310, 88, 22);
  const NAMES = Object.keys(B);
  creases(first);

  // cabos grossos (vigas) e pontos de luz: os eventos, os comandos e as respostas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 34 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
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
  const TAGS = Array.from({ length: 7 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TF = () => NARROW() && !POSTER ? [560, 14, 112] : [760, 14, 100];   // balão no canto livre do fundo, à direita do mostrador

  // ── cabos ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const rev = pts => pts.slice().reverse();
  const CL = { ped: P3([[260, 190], [300, 190]]), pag: P3([[260, 290], [300, 290]]), est: P3([[260, 392], [280, 392], [280, 318], [300, 318]]),
    log: P3([[540, 200], [580, 200]]), saga: P3([[420, 330], [420, 350]]), vig: P3([[580, 397], [540, 397]]) };
  const CE = { ped: P3([[300, 210], [260, 210]]), not: P3([[300, 300], [280, 300], [280, 367], [260, 367]]),
    psp: P3([[540, 180], [560, 180], [560, 125], [580, 125]]), gente: P3([[540, 300], [560, 300], [560, 337], [580, 337]]) };
  const CD = { db: P3([[300, 240], [260, 240]]), kaf: P3([[540, 190], [560, 190], [560, 95], [580, 95]]), est: P3([[735, 150], [735, 190]]),
    rdb: P3([[150, 350], [150, 330]]), rkaf: P3([[260, 392], [550, 392], [550, 125], [580, 125]]) };
  const CR = { dav: P3([[540, 215], [560, 215], [560, 115], [580, 115]]), pre: P3([[540, 370], [580, 370]]) };
  const CB = { sim: P3([[260, 240], [300, 240]]), ped: P3([[540, 160], [560, 160], [560, 84], [580, 84]]), est: P3([[540, 184], [580, 184]]),
    pag: P3([[540, 284], [580, 284]]), ent: P3([[540, 320], [560, 320], [560, 384], [580, 384]]) };
  // uma mensagem andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);   // fração da viagem entre os instantes a e b do passo
  const beam = (o, pts, on, tone = '') => { const b = o.beams.find(x => x.pts === pts); if (b) { b.on = on; b.tone = tone; } else o.beams.push({ pts, on, tone }); };

  // ── conteúdo padrão das peças ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const withTape = (d, tl, cells) => { d.tl = tl; d.tape = cells; return d; };
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // o log real do s-1057 (PostgreSQL 14.24, Oct 20, 2026)
  const LOG7 = [['1', 'NOVO', 'e-1901', '20:15:00'], ['2', 'COBRANDO', '', '20:15:00.05'], ['3', 'PAGO', 'e-1902', '20:15:41.2'],
    ['4', 'RESERVANDO', '', '20:15:41.22'], ['5', 'COMPENSANDO', 'e-1903', '20:15:41.26'], ['6', 'ESTORNANDO', '', '20:15:41.3'], ['7', 'CANCELADO', 'e-1904', '20:15:44.95']];
  const logRow = ([id, para, ev, em]) => `${id} ${para} ${ev || '·'} ${em.slice(6)}`;
  function logD(n, mark = -1) {
    const d = act('saga_log', `${n} OF 7 ROWS`, ['id · to · event · at (20:15:…)', 'dim'],
      ...LOG7.slice(0, n).map((r, i) => [logRow(r), i === mark ? 'mark' : i === n - 1 ? 'acc' : 'hi']));
    d.fs = 15; d.lh = 26; return d;
  }
  const sagaD = (st, v, tone = 'acc', id = 's-1057', extra) => act('saga ' + id, 'TABLE', ['state ' + st, tone], [extra || 'versao ' + v, 'dim']);
  // a fita das tentativas do estorno: a 1ª e as 5 repetições, com a espera antes de cada uma
  const TRY = ['1st', '+1 s', '+2 s', '+4 s', '+8 s', '+16 s'], CUM = [0, 1, 3, 7, 15, 31];
  // as duas trilhas da ordem dos passos
  const TA = [['NOVO', 0], ['Pix', 0.05], ['PAGO', 41.2], ['no stock', 41.26, 'bad'], ['refund', 41.3], ['CANCELADO', 44.95]];
  const TB = [['NOVO', 0], ['RESERVANDO', 0.1, 'bad'], ['CANCELADO', 0.1]];
  const trackA = s => TA.map(([l, at, tn]) => [l, s >= at ? (tn || 'ok') : 'none']);
  const trackB = ms => TB.map(([l, at, tn]) => [l, ms >= at * 1000 ? (tn || 'ok') : 'none']);
  // os 20 pedidos do simulador: 17 completos, 2 falhas no estoque, 1 no pagamento (a conta dá 17,1 / 2,0 / 0,9)
  const OUT20 = Array.from({ length: 20 }, (_, i) => i === 5 || i === 13 ? 'E' : i === 10 ? 'P' : 'ok');
  const grid = n => OUT20.map((r, i) => i >= n ? [String(i + 1), 'none'] : r === 'ok' ? [String(i + 1), 'ok'] : [r === 'E' ? 'est' : 'pag', 'bad']);
  const LABST = ['PENDING', 'ORDER_VALIDATED', 'STOCK_RESERVED', 'PAYMENT_PROCESSED', 'DELIVERY_SCHEDULED', 'COMPLETED'];
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    const F = fam();
    if (F === 'L') {
      show('orq', 'saga', 'lped', 'lpag', 'lest', 'log', 'vig');
      o.rows.orq = act('orchestrator', 'SAGA s-1057', ['waits for events', 'dim']);
      o.rows.saga = sagaD('—', 0, 'dim');
      o.rows.lped = act('pedidos', 'SERVICE', ['order 1057 · 58.00', 'dim']);
      o.rows.lpag = act('pagamentos', 'PSP · PIX', ['charge c-7732', 'dim']);
      o.rows.lest = act('estoque', 'SERVICE', ['product 15: 0', 'dim'], ['damage write-off at 20:15:10', 'dim']);
      o.rows.log = logD(0);
      o.rows.vig = act('watchdog', 'DEADLINE 30 MIN', ['looks for stalled sagas', 'dim']);
      o.beams.push({ pts: CL.ped }, { pts: CL.pag }, { pts: CL.est }, { pts: CL.log }, { pts: CL.saga }, { pts: CL.vig });
    } else if (F === 'E') {
      show('orq', 'saga', 'eped', 'enot', 'psp', 'gente');
      o.rows.orq = act('orchestrator', 'SAGA s-1057', ['COMPENSANDO', 'acc'], ['reason sem_estoque', 'dim']);
      o.rows.saga = sagaD('COMPENSANDO', 5);
      o.rows.eped = act('pedidos', 'SERVICE', ['order 1057', 'hi'], ['paid, no stock', 'dim']);
      o.rows.enot = act('notificacoes', 'SERVICE', ['for Davi', 'dim'], ['nothing sent', 'dim']);
      o.rows.psp = withTape(act('PSP', 'PIX c-7732', ['charged R$ 58.00', 'hi'], ['key estorno-c-7732', 'dim']), 'refund attempts', []);
      o.rows.gente = act('on-call', 'PEOPLE', ['no alert', 'dim']);
      o.beams.push({ pts: CE.ped }, { pts: CE.not }, { pts: CE.psp }, { pts: CE.gente }, { pts: CL.saga });
    } else if (F === 'D') {
      show('orq', 'ddb', 'drel', 'dkaf', 'dest');
      o.rows.orq = act('orchestrator', 'SAGA s-1057', ['PedidoPago arrived', 'dim'], ['next: reserve', 'dim']);
      o.rows.ddb = withTape(act('orchestrator DB', 'POSTGRESQL', ['saga s-1057', 'dim'], ['state PAGO', 'hi']), 'outbox', []);
      o.rows.drel = act('relay', 'READS THE OUTBOX', ['sends to Kafka', 'dim']);
      o.rows.dkaf = withTape(act('estoque-commands', 'KAFKA'), 'commands', []);
      o.rows.dest = withTape(act('estoque', 'SERVICE', ['reservations of s-1057: 0', 'hi']), 'command_ids already seen', []);
      o.beams.push({ pts: CD.db }, { pts: CD.kaf }, { pts: CD.est }, { pts: CD.rdb }, { pts: CD.rkaf });
    } else if (F === 'R') {
      show('ra', 'rb', 'rdav', 'rpre');
      o.rows.ra = withTape(act('charge first', 'THE STORE', ['charges, then reserves', 'dim']), 'order 1057', trackA(-1));
      o.rows.rb = withTape(act('reserve first', 'THE LAB', ['reserves, then charges', 'dim']), 'order 1057', trackB(-1));
      o.rows.rdav = act('Davi\'s app', 'PIX', ['balance: unchanged', 'dim']);
      o.rows.rpre = act('stuck reservations', '30 ORDERS/s', ['20% drop off the Pix', 'dim'], ['reservation lasts 10 min', 'dim']); o.rows.rpre.bar = [0, 'acc', '0 units'];
      o.beams.push({ pts: CR.dav }, { pts: CR.pre });
    } else {
      show('orq', 'sim', 'bped', 'best', 'bpag', 'bent');
      o.rows.orq = act('orchestrator', 'saga_events', ['PENDING', 'dim']);
      o.rows.sim = act('simulador', '20 ORDERS', ['stock fails 10%', 'dim'], ['payment fails 5%', 'dim']); o.rows.sim.grid = grid(0);
      o.rows.bped = act('pedidos', '+ DB', ['pedidos-commands/-reply', 'dim']);
      o.rows.best = act('estoque', '+ DB', ['estoque-commands/-reply', 'dim']);
      o.rows.bpag = act('pagamentos', '+ DB', ['pagamentos-commands/-reply', 'dim']);
      o.rows.bent = act('entregas', '+ DB', ['entregas-commands/-reply', 'dim']);
      o.beams.push({ pts: CB.sim }, { pts: CB.ped }, { pts: CB.est }, { pts: CB.pag }, { pts: CB.ent });
    }
    return o;
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    log: [
      { id: 'novo', dur: 6, title: '20:15:00: 1057 is born, rows 1 and 2', yk: 'transitar',
        code: ["transitar('s-1057', NULL, 'NOVO', 'e-1901')", "  → row 1: NOVO", "transitar('s-1057', 'NOVO', 'COBRANDO')", "  → row 2: COBRANDO", "sends the Pix charge c-7732 (58.00)"],
        story: 'Davi creates order 1057 at 20:15:00.000: 1 black T-shirt (49.00) and SP shipping (9.00), <b>58.00</b>. <code>PedidoCriado</code> (<code>e-1901</code>) arrives and the <code>transitar</code> function saves saga <code>s-1057</code> in <code>NOVO</code>: <b>row 1</b> of <code>saga_log</code>. Fifty milliseconds later the saga goes to <code>COBRANDO</code> and sends the Pix charge <code>c-7732</code>: <b>row 2</b>.',
        look: 'The PedidoCriado leaves pedidos and reaches the orchestrator; row 1 shows up in the log, on the right. Then the charge goes to pagamentos and row 2 comes in.',
        key: 'Each saga transition becomes a row that is only appended.',
        f(o, t) { const a = go_(t, 0.4, 1.4), b = go_(t, 2.0, 2.9), n = t > 3.0 ? 2 : t > 1.5 ? 1 : 0, st = ['—', 'NOVO', 'COBRANDO'][n]; lit(o, 'orq');
          if (a > 0 && a < 1) lit(o, 'lped'); if (b > 0) lit(o, 'lpag'); if (n) lit(o, 'log', 'saga');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [n === 2 ? 'sends the Pix charge' : n ? 'saves NOVO' : 'PedidoCriado arrives', 'acc'], [n ? 'state ' + st : '', 'dim']);
          o.rows.saga = sagaD(st, n, n ? 'acc' : 'dim'); o.rows.log = logD(n);
          o.rows.lped = act('pedidos', 'SERVICE', ['order 1057 · 58.00', 'acc'], ['T-shirt 49 + shipping 9', 'dim']);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [b >= 1 ? 'c-7732 open' : 'charge c-7732', b >= 1 ? 'acc' : 'dim'], [b >= 1 ? 'waits for Davi to pay' : '', 'dim']);
          beam(o, CL.ped, a > 0 && a < 1); beam(o, CL.pag, b > 0 && b < 1); beam(o, CL.log, n > 0);
          pk(o, CL.ped, a, 'PedidoCriado · e-1901'); pk(o, rev(CL.pag), b, 'charge c-7732');
          o.cnt = [['CLOCK', n === 2 ? '20:15:00.050' : '20:15:00.000'], ['LOG ROWS', `${n} of 7`, 'dim'], ['STATE', st, 'dim']];
          o.res = n === 2 ? [['NOVO and COBRANDO: 2 rows', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: '20:15:41.200: the Pix arrives, row 3', yk: 'THE CONDITIONAL TRANSITION',
        code: ['UPDATE saga SET estado = \'PAGO\', versao = versao + 1', ' WHERE saga_id = \'s-1057\' AND estado = \'COBRANDO\';', '  → 1 row affected', 'INSERT INTO saga_log … (3, PAGO, e-1902)', "transitar(…) → t"],
        story: 'Davi takes <b>41.2 s</b> to pay in his bank app. At 20:15:41.200 the PSP sends a webhook and <code>PedidoPago</code> arrives (<code>e-1902</code>, 58.00). <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> runs the <code>UPDATE … WHERE estado = de</code>: the saga really is in <code>COBRANDO</code>, the <code>UPDATE</code> affects 1 row, and only for that reason the log gets <b>row 3</b>.',
        look: 'The clock runs the 41.2 s of waiting; the PedidoPago leaves pagamentos and row 3, PAGO, enters the log.',
        key: 'The saga only advances from the state it is really in.',
        f(o, t) { const w = lin(t, 0.2, 1.6, 0, 41.2), a = go_(t, 1.7, 2.7), n = a >= 1 ? 3 : 2; lit(o, 'orq', 'log', 'saga'); if (a > 0) lit(o, 'lpag');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [a >= 1 ? 'COBRANDO → PAGO: t' : 'waits for the Pix', a >= 1 ? 'acc' : 'dim'], ['state ' + (n === 3 ? 'PAGO' : 'COBRANDO'), 'dim']);
          o.rows.saga = sagaD(n === 3 ? 'PAGO' : 'COBRANDO', n); o.rows.log = logD(n);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [a > 0 ? 'Davi paid: 58.00' : `wait: ${dec(w)} s`, a > 0 ? 'acc' : 'dim'], [a > 0 ? 'PSP webhook' : 'charge c-7732', 'dim']);
          beam(o, CL.pag, a > 0 && a < 1); pk(o, CL.pag, a, 'PedidoPago · e-1902');
          o.cnt = [['DAVI\'S WAIT', `${dec(w)} s`], ['LOG ROWS', `${n} of 7`, 'dim'], ['UPDATE', a >= 1 ? '1 row' : '…', 'dim']];
          o.res = a >= 1 ? [['row 3: PAGO, e-1902', 'acc']] : []; } },
      { id: 'dup', dur: 6, title: '20:15:41.210: the same PedidoPago again: f', yk: 'THE DUPLICATE (REAL OUTPUT)',
        code: ["transitar('s-1057','COBRANDO','PAGO','e-1902', …)", '  → f   (20:15:41.210, the duplicate)', 'the saga is already in PAGO:', '  the UPDATE affects 0 rows', '  nothing goes to the log'],
        story: 'Ten milliseconds later, at 20:15:41.210, the same <code>PedidoPago</code> (<code>e-1902</code>) arrives <b>again</b>. <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> returns <b><code>f</code></b>: the saga is no longer in <code>COBRANDO</code>, the <code>UPDATE</code> affects 0 rows and <b>nothing</b> goes to the log. The duplicate was ignored without special code.',
        look: 'A second PedidoPago travels along the same cable and hits the orchestrator. The log stays at 3 rows and the saga version stays at 3.',
        key: 'The conditional transition ignores the repeat for free.',
        f(o, t) { const a = go_(t, 0.6, 1.8), f_ = a >= 1; lit(o, 'orq', 'log', 'saga'); if (a > 0 && a < 1) lit(o, 'lpag');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [f_ ? 'transitar → f' : 'e-1902 arrives again', 'acc'], [f_ ? 'UPDATE: 0 rows' : 'state PAGO', 'dim']);
          o.rows.saga = sagaD('PAGO', 3); o.rows.log = logD(3);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', ['repeated webhook', 'dim'], ['e-1902 · 58.00', 'dim']);
          beam(o, CL.pag, a > 0 && a < 1); pk(o, CL.pag, a, 'PedidoPago · e-1902 (again)');
          if (f_) T(o, TF(), 'f: duplicate ignored', 'acc');
          o.cnt = [['DUPLICATE', f_ ? 'ignored' : 'arriving'], ['LOG ROWS', '3 of 7', 'dim'], ['CLOCK', '20:15:41.210', 'dim']];
          o.res = f_ ? [['f: no new row in the log', 'acc'], ['versao stays 3', 'acc']] : []; } },
      { id: 'compensa', dur: 7, title: '20:15:41.260: no stock, row 5 is COMPENSANDO', yk: 'THE FOUR QUESTIONS',
        code: ['What event is this?  EstoqueIndisponivel (e-1903)', 'Where am I?         RESERVANDO', 'Where do I go?      COMPENSANDO', 'What do I do here?  store the reason sem_estoque', '                    and order the refund'],
        story: 'At 20:15:41.220 the saga goes to <code>RESERVANDO</code> (<b>row 4</b>) and sends <code>ReservarEstoque</code>. The T-shirt (product 15) was written off as damaged at 20:15:10: stock is <b>0</b>. <code>estoque</code> answers <code>EstoqueIndisponivel</code> (<code>e-1903</code>, reason <code>sem_estoque</code>), and <b>row 5</b> records <code>RESERVANDO → COMPENSANDO</code>. That row is what later says why 1057 was undone.',
        look: 'The command goes to stock, which lights up red with the 0; the reply comes back and row 5 of the log gets marked.',
        key: 'The log keeps the reason next to the transition.',
        f(o, t) { const a = go_(t, 0.5, 1.4), b = go_(t, 1.7, 2.7), n = b >= 1 ? 5 : t > 0.3 ? 4 : 3; lit(o, 'orq', 'log', 'saga'); if (a > 0) o.on.lest = 'bad';
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [b >= 1 ? 'RESERVANDO → COMPENSANDO' : 'sends ReservarEstoque', 'acc'], [b >= 1 ? 'reason sem_estoque' : 'state RESERVANDO', 'dim']);
          o.rows.saga = sagaD(n === 5 ? 'COMPENSANDO' : n === 4 ? 'RESERVANDO' : 'PAGO', n); o.rows.log = logD(n, n === 5 ? 4 : -1);
          o.rows.lest = act('estoque', 'SERVICE', ['product 15: 0', a > 0 ? 'bad' : 'dim'], [b > 0 ? 'EstoqueIndisponivel' : 'damage write-off at 20:15:10', b > 0 ? 'bad' : 'dim']);
          beam(o, CL.est, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, rev(CL.est), a, 'ReservarEstoque'); pk(o, CL.est, b, 'e-1903 · sem_estoque', 'bad');
          if (b >= 1) T(o, TF(), 'row 5: COMPENSANDO', 'acc');
          o.cnt = [['CLOCK', b >= 1 ? '20:15:41.260' : '20:15:41.220'], ['LOG ROWS', `${n} of 7`, 'dim'], ['REASON', b >= 1 ? 'sem_estoque' : '…', b >= 1 ? 'bad' : 'dim']];
          o.res = b >= 1 ? [['row 5: RESERVANDO → COMPENSANDO', 'acc'], ['e-1903 · sem_estoque', 'acc']] : []; } },
      { id: 'cancela', dur: 7, title: '20:15:44.950: refunded, row 7 is CANCELADO', yk: '1057\'S LOG (REAL OUTPUT)',
        code: ['5 | RESERVANDO  | COMPENSANDO | e-1903 | 41.26', '6 | COMPENSANDO | ESTORNANDO  |        | 41.3', '7 | ESTORNANDO  | CANCELADO   | e-1904 | 44.95', 'saga: CANCELADO, versao = 7', 'compensation: 41.26 → 44.95 = 3.7 s'],
        story: 'The saga goes to <code>ESTORNANDO</code> (<b>row 6</b>) and sends <code>EstornarCobranca c-7732</code>. At 20:15:44.950 <code>PagamentoEstornado</code> arrives (<code>e-1904</code>, 58.00): <b>row 7</b>, <code>CANCELADO</code>, <code>versao = 7</code>; then the order is canceled (<code>e-1905</code>). The whole compensation took <b>3.7 s</b>; the whole 1057, <b>44.95 s</b>, of which 41.2 s was Davi\'s wait. He gets "order canceled, we refunded R$ 58.00".',
        look: 'The refund goes to pagamentos and back; the cancellation goes to pedidos. The log closes at 7 rows and the saga at version 7.',
        key: 'The state is the last row: CANCELADO, version 7.',
        f(o, t) { const a = go_(t, 0.5, 1.4), b = go_(t, 1.7, 2.6), c = go_(t, 2.9, 3.7), n = b >= 1 ? 7 : 6; lit(o, 'orq', 'log', 'saga'); if (a > 0) lit(o, 'lpag'); if (c > 0) lit(o, 'lped');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [n === 7 ? 'ESTORNANDO → CANCELADO' : 'sends EstornarCobranca', 'acc'], [c >= 1 ? 'notifies Davi' : 'state ' + (n === 7 ? 'CANCELADO' : 'ESTORNANDO'), 'dim']);
          o.rows.saga = sagaD(n === 7 ? 'CANCELADO' : 'ESTORNANDO', n); o.rows.log = logD(n);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [b > 0 ? 'refunded R$ 58.00' : 'refund c-7732', 'acc'], [b > 0 ? 'e-1904' : 'estorno-c-7732', 'dim']);
          o.rows.lped = act('pedidos', 'SERVICE', [c >= 1 ? '1057 canceled' : 'order 1057', c >= 1 ? 'acc' : 'dim'], [c >= 1 ? 'e-1905 PedidoCancelado' : '', 'dim']);
          beam(o, CL.pag, (a > 0 && a < 1) || (b > 0 && b < 1)); beam(o, CL.ped, c > 0 && c < 1);
          pk(o, rev(CL.pag), a, 'EstornarCobranca c-7732'); pk(o, CL.pag, b, 'PagamentoEstornado · e-1904'); pk(o, rev(CL.ped), c, 'CancelarPedido');
          if (c >= 1) T(o, TF(420), 'Davi: "we refunded R$ 58.00"', 'acc');
          o.cnt = [['TOTAL', n === 7 ? '44.95 s' : '…'], ['COMPENSATION', n === 7 ? '3.7 s' : '…', 'dim'], ['DAVI\'S WAIT', '41.2 s', 'dim']];
          o.res = n === 7 ? [['CANCELADO, versao 7', 'acc'], ['7 rows, from NOVO to CANCELADO', 'acc']] : []; } },
      { id: 'custo', dur: 7, title: 'The log answers, and grows: 1.6 billion rows', yk: 'THE 90-DAY MATH',
        code: ["SELECT de, para, evento_id, em FROM saga_log", " WHERE saga_id = 's-1057' ORDER BY id;", '30 × 86,400 × 90 × 7 = 1,632,960,000 rows', '× ~200 B ≈ 300 GB (326.6 GB in the exact calculation)', 'defense: archive FINALIZADO and CANCELADO'],
        story: '"Where is 1057?" becomes a query by <code>saga_id</code>, instead of putting together the logs of four services. The last row says where to <b>resume</b> after a crash, and row 7 is the <b>proof</b> of the refund (<code>e-1904</code>, 58.00, 20:15:44.95). The article warns about the price: at 30 orders/s, with 7 rows per saga and 90 days, that is 30 × 86,400 × 90 × 7 = <b>1,632,960,000</b> rows, about <b>300 GB</b> at 200 B. That\'s why the final sagas are archived.',
        look: 'The query goes to the log and comes back with 1057\'s 7 rows; the counter on the display climbs to 1.6 billion.',
        key: 'Tracing, resumption and audit, at the price of billions of rows.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.3, 2.1), n = lin(t, 2.2, 5.6, 0, 1632960000); lit(o, 'orq', 'log', 'saga');
          o.rows.orq = act('orchestrator', 'QUERY', ['where is 1057?', 'acc'], [b >= 1 ? 'last row: CANCELADO' : "saga_id = 's-1057'", 'dim']);
          o.rows.saga = sagaD('CANCELADO', 7); o.rows.log = logD(7, b >= 1 ? 6 : -1);
          beam(o, CL.log, (a > 0 && a < 1) || (b > 0 && b < 1)); pk(o, CL.log, a, 'SELECT … s-1057'); pk(o, rev(CL.log), b, '7 rows');
          o.cnt = [['ROWS IN 90 DAYS', thou(n)], ['AT ~200 B', n >= 1632960000 ? '~300 GB' : '…', 'dim'], ['PER SAGA', '7 rows', 'dim']];
          o.res = n >= 1632960000 ? [['1.6 billion rows', 'acc'], ['archive the final sagas', 'acc']] : []; } },
      { id: 'vigia', dur: 8, title: 'What if it goes wrong: the saga that stalled', yk: 'THE WATCHDOG (RUN ON POSTGRESQL 14.24)',
        code: ['SELECT saga_id, estado FROM saga', " WHERE estado NOT IN ('FINALIZADO','CANCELADO')", "   AND atualizada_em < now() − interval '30 minutes';", '  → s-teste | COBRANDO   (stalled since 19:20)', 'COBRANDO + deadline expired → CANCELADO'],
        story: 'If the Pix webhook gets lost (or the customer gives up), the saga stays in <code>COBRANDO</code> <b>forever</b>: no event arrives, so no transition happens. The way out is a <b>deadline per state</b> (the Pix charge expires in 30 min, in the example) and a <b>watchdog</b> that looks for stalled sagas. Run on PostgreSQL 14.24, it found <code>s-teste</code>, stalled in <code>COBRANDO</code> since <b>19:20</b>. The watchdog expires it, and the expiry cancels the order (nothing to refund).',
        look: 'The watchdog, in front of the log, queries the saga table; s-teste shows up in red, stalled since 19:20, and then becomes CANCELADO.',
        key: 'With no deadline and no watchdog, COBRANDO lasts forever.',
        f(o, t) { const a = go_(t, 0.6, 1.6), found = a >= 1, exp = t > 3.0; lit(o, 'log'); o.on.vig = found && !exp ? 'bad' : 1; o.on.saga = found && !exp ? 'bad' : 1; o.on.lpag = 'bad';
          o.rows.vig = act('watchdog', 'DEADLINE 30 MIN', [found ? 'found: s-teste, 19:20' : 'looks for stalled sagas', found ? 'bad' : 'dim']);
          o.rows.saga = sagaD(exp ? 'CANCELADO' : 'COBRANDO', 0, exp ? 'acc' : found ? 'bad' : 'hi', 's-teste', exp ? 'deadline expired' : 'since 19:20');
          o.rows.lpag = act('pagamentos', 'PSP · PIX', ['webhook lost', 'bad'], ['no event arrives', 'dim']);
          o.rows.orq = act('orchestrator', 'SAGA s-teste', [exp ? 'deadline expired: cancels' : 'no event arrives', exp ? 'acc' : 'bad'], [exp ? 'nothing to refund' : 'state COBRANDO', 'dim']); if (exp) lit(o, 'orq');
          o.rows.log = logD(7);
          beam(o, CL.vig, a > 0 && a < 1); beam(o, CL.pag, false, 'bad'); pk(o, CL.vig, a, 'stalled for 30 min?');
          if (found) T(o, TF(420), exp ? 's-teste: CANCELADO' : 's-teste stalled since 19:20', exp ? 'acc' : 'bad');
          o.cnt = [['STALLED SINCE', found ? '19:20' : '…', 'bad'], ['DEADLINE', '30 min', 'dim'], ['SAGAS FOUND', found ? '1' : '0', 'dim']];
          o.res = exp ? [['s-teste: COBRANDO → CANCELADO', 'acc'], ['the expiry is a compensation', 'acc']] : found ? [['COBRANDO forever', 'bad']] : []; } },
    ],
    'estorno-falha': [
      { id: 'ordem', dur: 6, title: 'It failed on stock: undo in reverse order', yk: 'THE STORE\'S PAIRS',
        code: ['CriarPedido      / CancelarPedido', 'CobrarPedido     / EstornarCobranca', 'ReservarEstoque  / LiberarEstoque', 'AgendarEntrega   / CancelarEntrega', 'failed on stock → refund, cancel (2)'],
        story: '1057 charged and then tried to reserve. The reservation failed, so you only undo what <b>happened</b>, from back to front: <code>EstornarCobranca c-7732</code> and <code>CancelarPedido</code>, <b>2 compensations</b>. The reservation never existed: there is no <code>LiberarEstoque</code>. If the failure were in delivery (in the lab\'s order), there would be 3: refund, release and cancel.',
        look: 'The two cables that will undo light up, with the order written: first the PSP\'s, then pedidos\'.',
        key: 'Reverse order, and only what happened.',
        f(o, t) { const a = t > 0.6, b = t > 1.6; lit(o, 'orq', 'saga'); if (a) lit(o, 'psp'); if (b) lit(o, 'eped');
          beam(o, CE.psp, a); beam(o, CE.ped, b);
          if (a) T(o, [560, 150, 40], '1st EstornarCobranca', 'acc'); if (b) T(o, [280, 210, 40], '2nd CancelarPedido', 'acc');
          o.cnt = [['COMPENSATIONS', b ? '2' : a ? '1' : '…'], ['WHERE IT FAILED', 'stock', 'dim'], ['STATE', 'COMPENSANDO', 'dim']];
          o.res = b ? [['refund, then cancel', 'acc'], ['nothing to release: no reservation', 'acc']] : []; } },
      { id: '503', dur: 6, title: '20:15:41.300: the PSP answers 503', yk: 'THE FIRST ATTEMPT',
        code: ['ESTORNANDO: sends EstornarCobranca', '  charge c-7732, R$ 58.00', '  idempotency key: estorno-c-7732', 'PSP → 503 (down)', 'Davi\'s money stays with the store'],
        story: 'The saga goes to <code>ESTORNANDO</code> and sends <code>EstornarCobranca</code> with the key <code>estorno-c-7732</code>. The PSP is down and answers <b>503</b>. The compensation fails too: Davi\'s money stays with the store.',
        look: 'The command goes to the PSP and comes back red; the first cell of the attempts tape turns red.',
        key: 'The compensation can fail too.',
        f(o, t) { const a = go_(t, 0.5, 1.5), b = go_(t, 1.7, 2.6), bad = b >= 1; lit(o, 'orq', 'saga'); o.on.psp = bad ? 'bad' : a > 0 ? 1 : 0;
          o.rows.saga = sagaD('ESTORNANDO', 6); o.rows.orq = act('orchestrator', 'SAGA s-1057', ['ESTORNANDO', 'acc'], [bad ? 'reply: 503' : 'sends the refund', bad ? 'bad' : 'dim']);
          o.rows.psp.tape = bad ? [[TRY[0], 'bad']] : []; if (bad) o.rows.psp.rows[0] = ['503: down', 'bad'];
          beam(o, CE.psp, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, CE.psp, a, 'EstornarCobranca · estorno-c-7732'); pk(o, rev(CE.psp), b, '503', 'bad');
          o.cnt = [['REPLY', bad ? '503' : '…', 'bad'], ['ATTEMPT', '1st', 'dim'], ['CLOCK', '20:15:41.300', 'dim']];
          o.res = bad ? [['the refund didn\'t go through', 'bad']] : []; } },
      { id: 'chave', dur: 7, title: 'If the PSP comes back in the middle: the key refunds once', yk: 'IDEMPOTENT BY KEY',
        code: ['retry 1 (+1 s): the PSP refunds,', '  but the reply gets lost', 'retry 2 (+2 s): same key estorno-c-7732', '  → the PSP returns the refund it already made', 'without the key: R$ 116.00 to Davi'],
        story: 'Repeating is only safe if the undo is <b>idempotent</b>. Suppose the PSP comes back on the first retry: it refunds, but the reply gets lost, and the saga retries. Since the command carries the same key <code>estorno-c-7732</code>, the PSP recognizes the request and returns the refund it already made. Davi gets <b>R$ 58.00 once</b>. Without the key, repeating to be safe would give back <b>R$ 116.00</b>.',
        look: 'The tape shows the 1st attempt red and the two retries lit; the refund counter stays at 1.',
        key: 'The key makes the repeat refund only once.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.3, 1.9), c = go_(t, 2.3, 3.1), d = go_(t, 3.3, 4.1), done = d >= 1; lit(o, 'orq', 'saga'); if (a > 0) lit(o, 'psp');
          o.rows.saga = sagaD(done ? 'CANCELADO' : 'ESTORNANDO', done ? 7 : 6);
          o.rows.orq = act('orchestrator', 'SAGA s-1057', [done ? 'refund confirmed' : c > 0 ? 'retries: same key' : 'retries after 1 s', 'acc'], [b > 0 && c <= 0 ? 'no reply' : '', 'bad']);
          o.rows.psp.rows[0] = [a >= 1 ? 'refunded R$ 58.00' : 'charged R$ 58.00', a >= 1 ? 'acc' : 'hi'];
          o.rows.psp.rows[1] = [c >= 1 ? 'key already seen: same one' : 'key estorno-c-7732', c >= 1 ? 'acc' : 'dim'];
          o.rows.psp.tape = [[TRY[0], 'bad'], ...(a >= 1 ? [[TRY[1], 'ok']] : []), ...(c >= 1 ? [[TRY[2], 'ok']] : [])];
          beam(o, CE.psp, (a > 0 && a < 1) || (c > 0 && c < 1) || (d > 0 && d < 1));
          pk(o, CE.psp, a, 'estorno-c-7732'); pk(o, rev(CE.psp), b < 1 ? b * 0.5 : 0, 'reply lost', 'bad');
          pk(o, CE.psp, c, 'estorno-c-7732 (again)'); pk(o, rev(CE.psp), d, 'already refunded · e-1904');
          o.cnt = [['REFUNDS', a >= 1 ? '1 (R$ 58.00)' : '0'], ['WITHOUT THE KEY', c >= 1 ? 'R$ 116.00' : '…', 'bad'], ['KEY', 'estorno-c-7732', 'dim']];
          o.res = done ? [['retried and refunded once', 'acc']] : []; } },
      { id: 'backoff', dur: 9, title: 'If the PSP doesn\'t come back: 1, 2, 4, 8 and 16 s', yk: 'BACKOFF',
        code: ['1st attempt → 503', 'wait 1 s → 503 · 2 s → 503 · 4 s → 503', 'wait 8 s → 503 · 16 s → 503', '1 + 2 + 4 + 8 + 16 = 31 s', 'every attempt carries the key estorno-c-7732'],
        story: 'Now the PSP doesn\'t come back. The saga retries with <b>backoff</b>: it waits 1, 2, 4, 8 and 16 s between attempts, the wait doubling each time. That is <b>5 retries</b> (6 attempts counting the first) and <b>31 s</b> of total wait. All of them get 503. Since the key is always <code>estorno-c-7732</code>, none of them would refund twice if the PSP came back in the middle.',
        look: 'The PSP\'s tape fills with red cells, one per attempt, and the display sums the waits up to 31 s.',
        key: 'Repeatable, but finite: 31 s and then something else.',
        f(o, t) { const k = Math.min(6, 1 + Math.floor(lin(t, 0.3, 6.3, 0, 5.999))), pulse = (t % 1) < 0.5; lit(o, 'orq', 'saga'); o.on.psp = 'bad';
          o.rows.saga = sagaD('ESTORNANDO', 6); o.rows.orq = act('orchestrator', 'SAGA s-1057', [`attempt ${k} of 6`, 'acc'], ['reply: 503', 'bad']);
          o.rows.psp.rows[0] = ['503 on every attempt', 'bad']; o.rows.psp.tape = TRY.slice(0, k).map(l => [l, 'bad']);
          beam(o, CE.psp, pulse, 'bad');
          o.cnt = [['TOTAL WAIT', `${CUM[k - 1]} s`], ['ATTEMPTS', `${k} of 6`, 'dim'], ['REPLY', '503', 'bad']];
          o.res = k === 6 ? [['31 s and still 503', 'bad']] : []; } },
      { id: 'intervencao', dur: 8, title: 'What if it goes wrong: INTERVENCAO and the alert', yk: 'THE ALERT',
        code: ['ESTORNANDO + refund ran out of retries', '  → INTERVENCAO', 'alert: saga s-1057 · charge c-7732', '       R$ 58.00 · reason sem_estoque', 'a person sorts it out'],
        story: 'The fifth retry also gets 503. The saga stops trying and goes to <code>INTERVENCAO</code>, the only final state that <b>calls a person</b>, with an alert and all the data: saga <code>s-1057</code>, charge <code>c-7732</code>, R$ 58.00, reason <code>sem_estoque</code>. Microsoft says the human hand is sometimes the only way. And there is what no compensation undoes: the PSP fee may not come back, and an email that was sent can\'t be erased (you send another).',
        look: 'The orchestrator and the saga table turn red in INTERVENCAO; the alert travels to the on-call board, which lights up with the case data.',
        key: 'When the undo doesn\'t go through, the saga calls a person.',
        f(o, t) { const a = go_(t, 0.8, 1.8), got = a >= 1; o.on.orq = 'bad'; o.on.saga = 'bad'; o.on.psp = 'bad'; if (got) lit(o, 'gente');
          o.rows.saga = sagaD('INTERVENCAO', 7, 'bad'); o.rows.orq = act('orchestrator', 'SAGA s-1057', ['INTERVENCAO', 'bad'], ['6 attempts, 31 s', 'dim']);
          o.rows.psp.rows[0] = ['503 on every attempt', 'bad']; o.rows.psp.tape = TRY.map(l => [l, 'bad']);
          o.rows.gente = act('on-call', 'PEOPLE', [got ? 'ALERT: refund failed' : 'no alert', got ? 'bad' : 'dim'], got ? ['saga s-1057', 'hi'] : null, got ? ['charge c-7732', 'hi'] : null,
            got ? ['R$ 58.00', 'hi'] : null, got ? ['reason sem_estoque', 'hi'] : null);
          beam(o, CE.gente, a > 0 && a < 1, 'bad'); beam(o, CE.psp, false, 'bad'); pk(o, CE.gente, a, 'alert', 'bad');
          if (got) T(o, TF(735), 'INTERVENCAO: calls a person', 'bad');
          o.cnt = [['STATE', 'INTERVENCAO', 'bad'], ['ATTEMPTS', '6 (31 s)', 'dim'], ['WHO SORTS IT OUT', got ? 'a person' : '…', 'dim']];
          o.res = got ? [['the only final state that calls a person', 'bad']] : []; } },
    ],
    'dual-write': [
      { id: 'duas', dur: 6, title: 'Two writes: save RESERVANDO and send the command', yk: 'THE DUAL WRITE',
        code: ['1. UPDATE saga SET estado = \'RESERVANDO\'  → database', '2. ReservarEstoque → estoque-commands     → Kafka', 'database and Kafka: separate transactions', 'nothing ties one write to the other'],
        story: 'The <code>PedidoPago</code> arrived and 1057\'s saga has to advance: save <code>RESERVANDO</code> in the database and send <code>ReservarEstoque</code> to the <code>estoque-commands</code> topic. The database and Kafka don\'t share a transaction: one write can happen without the other. This time both work.',
        look: 'Two cables leave the orchestrator: one to the database, on the left, and another to Kafka, on the right. The command reaches stock, which reserves 1.',
        key: 'Saving the state and sending the command are two writes.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.4), c = go_(t, 2.6, 3.2); delete o.show.drel; lit(o, 'orq'); if (a >= 1) lit(o, 'ddb'); if (b >= 1) lit(o, 'dkaf'); if (c >= 1) lit(o, 'dest');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', ['saves and sends', 'acc'], ['two writes', 'dim']);
          o.rows.ddb.rows[1] = ['state ' + (a >= 1 ? 'RESERVANDO' : 'PAGO'), a >= 1 ? 'acc' : 'hi'];
          o.rows.dkaf.tape = b >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservations of s-1057: ' + (c >= 1 ? 1 : 0), c >= 1 ? 'acc' : 'hi'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, b > 0 && b < 1); beam(o, CD.est, c > 0 && c < 1);
          pk(o, CD.db, a, 'RESERVANDO'); pk(o, CD.kaf, b, 'ReservarEstoque'); pk(o, CD.est, c, '');
          o.cnt = [['WRITES', '2 places'], ['RESERVATIONS OF s-1057', c >= 1 ? '1' : '0', 'dim'], ['ATOMIC?', 'no', 'bad']];
          o.res = c >= 1 ? [['it worked, this time', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'The command goes out and the orchestrator goes down before saving', yk: 'THE LAB (READ, NOT RUN)',
        code: ['processReply, reply from pedidos-reply:', '  line 346: sends RESERVE_STOCK to stock', '  … the process dies here …', '  line 391: saveEvent (saves the state)', 'in the database, the last row still says PAGO'],
        story: 'This is the author\'s lab order: in <code>processReply</code>, <b>line 346</b> sends <code>RESERVE_STOCK</code> and only <b>line 391</b> saves the new state. The orchestrator goes down between the two. The command already went out: <code>estoque</code> reserves. In the database, the last row still says <code>PAGO</code>, and nobody knows the step was done.',
        look: 'The command goes to Kafka; the orchestrator turns red before reaching the database, which stays in PAGO, in red. Stock reserves 1.',
        key: 'Between sending and saving there is a window, and a crash in it makes the database lie.',
        f(o, t) { const a = go_(t, 0.4, 1.4), down = t > 1.6, c = go_(t, 1.8, 2.4); delete o.show.drel; o.on.orq = down ? 'bad' : 1; if (a >= 1) lit(o, 'dkaf'); if (c >= 1) lit(o, 'dest'); if (down) o.on.ddb = 'bad';
          o.rows.orq = act('orchestrator', down ? 'DOWN' : 'SAGA s-1057', [down ? 'went down before line 391' : 'line 346: sends', down ? 'bad' : 'acc']);
          o.rows.ddb.rows[1] = ['state PAGO', down ? 'bad' : 'hi'];
          o.rows.dkaf.tape = a >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservations of s-1057: ' + (c >= 1 ? 1 : 0), c >= 1 ? 'acc' : 'hi'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.kaf, a > 0 && a < 1); beam(o, CD.db, false, down ? 'bad' : ''); beam(o, CD.est, c > 0 && c < 1);
          pk(o, CD.kaf, a, 'RESERVE_STOCK'); pk(o, CD.est, c, '');
          if (down) T(o, TF(300), 'went down between 346 and 391', 'bad');
          o.cnt = [['IN THE DB', 'PAGO', down ? 'bad' : 'dim'], ['RESERVATIONS OF s-1057', c >= 1 ? '1' : '0', 'dim'], ['ORCHESTRATOR', down ? 'down' : 'up', down ? 'bad' : 'dim']];
          o.res = c >= 1 ? [['stock reserved;', 'acc'], ['the DB doesn\'t know', 'bad']] : []; } },
      { id: 'repete', dur: 7, title: 'When it comes back, it reads PAGO and sends again', yk: 'THE DUPLICATE COMMAND',
        code: ['the orchestrator comes back and reads the last row: PAGO', '→ sends ReservarEstoque again', 'consumer at OffsetNewest (line 194)', 'command_id and reply_id are not checked', '→ stock reserves twice'],
        story: 'The orchestrator comes back and reads the last row: <code>PAGO</code>. To it, the reservation is still missing, and it sends <code>ReservarEstoque</code> <b>again</b>. The lab doesn\'t check <code>command_id</code> or <code>reply_id</code> anywhere, so the repeat goes straight through: <code>estoque</code> reserves <b>twice</b> for the same saga.',
        look: 'The orchestrator lights up again, reads PAGO in the database and sends a second command. Stock turns red with 2 reservations.',
        key: 'A step done with no record comes back as a repeated step.',
        f(o, t) { const a = go_(t, 0.5, 1.3), b = go_(t, 1.6, 2.6), c = go_(t, 2.8, 3.4), dup = c >= 1; delete o.show.drel; lit(o, 'orq', 'dkaf'); if (dup) o.on.dest = 'bad'; else lit(o, 'dest');
          o.rows.orq = act('orchestrator', 'BACK UP', [a >= 1 ? 'reads PAGO: still to reserve' : 'reads the last row', 'acc']);
          o.rows.ddb.rows[1] = ['state PAGO', 'hi']; if (a > 0 && a < 1) lit(o, 'ddb');
          o.rows.dkaf.tape = [['ReservarEstoque', 'ok'], ...(b >= 1 ? [['again', 'bad']] : [])];
          o.rows.dest.rows[0] = ['reservations of s-1057: ' + (dup ? 2 : 1), dup ? 'bad' : 'acc'];
          o.rows.dest.rows[1] = [dup ? 'command_id not checked' : '', 'bad'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, b > 0 && b < 1); beam(o, CD.est, c > 0 && c < 1, 'bad');
          pk(o, rev(CD.db), a, 'reads PAGO'); pk(o, CD.kaf, b, 'ReservarEstoque (again)', 'bad'); pk(o, CD.est, c, '', 'bad');
          if (dup) T(o, TF(735), 'reserved twice', 'bad');
          o.cnt = [['RESERVATIONS OF s-1057', dup ? '2' : '1', dup ? 'bad' : ''], ['COMMANDS', b >= 1 ? '2' : '1', 'dim'], ['command_id', 'not checked', 'bad']];
          o.res = dup ? [['stock reserved twice', 'bad']] : []; } },
      { id: 'outbox', dur: 7, title: 'With an outbox: the step and the message in one COMMIT', yk: 'THE OUTBOX INSIDE THE SAGA (EXAMPLE)',
        code: ['BEGIN;', "  UPDATE saga SET estado = 'RESERVANDO' … WHERE estado = 'PAGO';", "  INSERT INTO outbox (destino, tipo, payload)", "  VALUES ('estoque-commands', 'ReservarEstoque', …);", 'COMMIT;   -- both go in, or neither'],
        story: 'With the <b>outbox</b>, the saga saves the step and the message in the <b>same transaction</b>: the state <code>UPDATE</code> and the <code>INSERT</code> into the <code>outbox</code> table go in together or not at all. The orchestrator no longer talks to Kafka: a <b>relay</b> reads the outbox and sends. If the orchestrator goes down after the <code>COMMIT</code>, no matter: the command goes out anyway.',
        look: 'The relay comes up on the left. A single cable leaves the orchestrator, to the database, where the state and the outbox row light up together; then the orchestrator goes down, and the relay carries the command to stock.',
        key: 'Outbox: the command is born in the same transaction as the state.',
        f(o, t) { const a = go_(t, 0.4, 1.4), ok = a >= 1, down = t > 1.8, b = go_(t, 2.1, 2.5), c = go_(t, 2.7, 3.8), d = go_(t, 4.0, 4.5);
          o.on.orq = down ? 'bad' : 1; if (ok) lit(o, 'ddb'); if (b > 0) lit(o, 'drel'); if (c >= 1) lit(o, 'dkaf'); if (d >= 1) lit(o, 'dest');
          o.rows.orq = act('orchestrator', down ? 'DOWN' : 'SAGA s-1057', [down ? 'down: no matter' : 'BEGIN … COMMIT', down ? 'bad' : 'acc']);
          o.rows.ddb.rows[1] = ['state ' + (ok ? 'RESERVANDO' : 'PAGO'), ok ? 'acc' : 'hi'];
          o.rows.ddb.tape = ok ? [[c >= 1 ? 'sent' : 'ReservarEstoque', c >= 1 ? 'none' : 'ok']] : [];
          o.rows.drel = act('relay', 'READS THE OUTBOX', [c >= 1 ? 'sent ReservarEstoque' : b > 0 ? 'found 1 row' : 'sends to Kafka', b > 0 ? 'acc' : 'dim']);
          o.rows.dkaf.tape = c >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservations of s-1057: ' + (d >= 1 ? 1 : 0), d >= 1 ? 'acc' : 'hi'];
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, false); beam(o, CD.rdb, b > 0 && b < 1); beam(o, CD.rkaf, c > 0 && c < 1); beam(o, CD.est, d > 0 && d < 1);
          pk(o, CD.db, a, 'BEGIN … COMMIT'); pk(o, rev(CD.rdb), b, ''); pk(o, CD.rkaf, c, 'ReservarEstoque'); pk(o, CD.est, d, '');
          o.cnt = [['ROWS IN THE COMMIT', ok ? '2' : '…'], ['RESERVATIONS OF s-1057', d >= 1 ? '1' : '0', 'dim'], ['ORCHESTRATOR', down ? 'down' : 'up', down ? 'bad' : 'dim']];
          o.res = d >= 1 ? [['the state and the command, together', 'acc']] : ok ? [['both went in', 'acc']] : []; } },
      { id: 'relay', dur: 8, title: 'What if it goes wrong: the relay publishes and goes down before marking', yk: 'AT LEAST ONCE',
        code: ['relay: sends ReservarEstoque to Kafka', '       goes down before marking the row as sent', 'when it comes back: sends again', 'stock: stores the command_id', '  the same id → returns the result it already gave'],
        story: 'The relay sends the <code>ReservarEstoque</code> and <b>goes down before marking</b> the row as sent. When it comes back, it sends again: delivery is <b>at least once</b>, and the command goes out twice. That\'s why the receiver is idempotent: <code>estoque</code> stores the <code>command_id</code> and, on seeing the same one, answers with the result it already gave, without reserving again. The outbox swaps "lose" for "repeat".',
        look: 'The command leaves the relay, which turns red; it comes back and sends the same command. At stock, the second command_id cell shows up struck through and the reservations stay at 1.',
        key: 'The outbox guarantees "at least once"; the command_id avoids the double effect.',
        f(o, t) { const a = go_(t, 0.4, 1.3), a2 = go_(t, 1.4, 1.9), down = t > 2.0 && t < 2.8, b = go_(t, 3.0, 3.9), b2 = go_(t, 4.0, 4.5), seen = b2 >= 1;
          lit(o, 'ddb'); o.on.drel = down ? 'bad' : 1; if (a >= 1) lit(o, 'dkaf'); if (a2 >= 1) lit(o, 'dest');
          o.rows.orq = act('orchestrator', 'SAGA s-1057', ['state RESERVANDO', 'dim']);
          o.rows.ddb.rows[1] = ['state RESERVANDO', 'acc']; o.rows.ddb.tape = [['not marked', t > 2.0 ? 'bad' : 'ok']];
          o.rows.drel = act('relay', down ? 'DOWN' : 'READS THE OUTBOX', [down ? 'down before marking' : b > 0 ? 'sends again' : 'sent', down ? 'bad' : 'acc']);
          o.rows.dkaf.tape = [...(a >= 1 ? [['ReservarEstoque', 'ok']] : []), ...(b >= 1 ? [['again', 'ok']] : [])];
          o.rows.dest.rows[0] = ['reservations of s-1057: ' + (a2 >= 1 ? 1 : 0), a2 >= 1 ? 'acc' : 'hi'];
          o.rows.dest.rows[1] = [seen ? 'same id: the earlier result' : '', 'acc'];
          o.rows.dest.tape = [...(a2 >= 1 ? [['id A', 'ok']] : []), ...(seen ? [['id A again', 'off']] : [])];
          beam(o, CD.rkaf, (a > 0 && a < 1) || (b > 0 && b < 1), down ? 'bad' : ''); beam(o, CD.est, (a2 > 0 && a2 < 1) || (b2 > 0 && b2 < 1));
          pk(o, CD.rkaf, a, 'ReservarEstoque'); pk(o, CD.est, a2, ''); pk(o, CD.rkaf, b, 'the same command'); pk(o, CD.est, b2, '');
          if (seen) T(o, TF(735), 'went out twice, reserved 1', 'acc');
          o.cnt = [['RESERVATIONS OF s-1057', a2 >= 1 ? '1' : '0'], ['COMMANDS DELIVERED', b2 >= 1 ? '2' : a2 >= 1 ? '1' : '0', 'dim'], ['DELIVERY', 'at least once', 'dim']];
          o.res = seen ? [['the same command_id: ignored', 'acc'], ['"lose" became "repeat"', 'acc']] : []; } },
    ],
    'reserva-antes': [
      { id: 'cobrar', dur: 7, title: 'Charge first (the store): 44.95 s and a refund', yk: 'THE STORE\'S ORDER',
        code: ['20:15:00.000  NOVO', '20:15:00.050  COBRANDO (Pix c-7732)', '20:15:41.200  PAGO: Davi saw R$ 58.00 leave', '20:15:41.260  no stock → COMPENSANDO', '20:15:44.950  CANCELADO: the refund comes back'],
        story: 'In the store\'s order (module 6), the saga <b>charges before reserving</b>. 1057 waits for the Pix for 41.2 s, Davi sees <b>R$ 58.00 leave</b>, only then does the reservation fail, and the refund gives the money back 3.7 s later. From <code>NOVO</code> to <code>CANCELADO</code>: <b>44.95 s</b>, with 1 refund and the PSP fee in the middle.',
        look: 'The top track lights up stage by stage while the clock runs to 44.95 s; Davi\'s app shows the money leave and come back.',
        key: 'Charging first turns the stock failure into a refund.',
        f(o, t) { const s = lin(t, 0.3, 4.8, 0, 44.95), paid = s >= 41.2, back = s >= 44.95; lit(o, 'ra'); if (paid) o.on.rdav = back ? 1 : 'bad';
          o.rows.ra.tape = trackA(s); o.rows.ra.rows[0] = [back ? 'CANCELADO in 44.95 s' : `${dec(s, 2)} s`, back ? 'acc' : 'hi'];
          o.rows.rdav = act('Davi\'s app', 'PIX', [back ? '+ R$ 58.00 back' : paid ? '− R$ 58.00' : 'waits to pay', back ? 'acc' : paid ? 'bad' : 'dim'], [back ? 'refund e-1904' : paid ? 'charge c-7732' : '', 'dim']);
          beam(o, CR.dav, paid, back ? '' : 'bad');
          o.cnt = [['TIME TO CANCELADO', `${dec(s, 2)} s`], ['REFUNDS', back ? '1 (R$ 58.00)' : '0', 'dim'], ['DAVI\'S WAIT', '41.2 s', 'dim']];
          o.res = back ? [['44.95 s and 1 refund', 'acc'], ['Davi saw the money leave', 'bad']] : []; } },
      { id: 'reservar', dur: 6, title: 'Reserve first (the lab): ~100 ms, no charge', yk: 'THE LAB\'S ORDER',
        code: ['20:15:00.000  NOVO', '20:15:00.1    RESERVANDO fails: no stock', '              → CANCELADO', 'no charge, no refund', 'it\'s the order in the author\'s repository'],
        story: 'With the order swapped, as in the author\'s lab, the saga <b>reserves before charging</b>. 1057\'s reservation fails at 20:15:00.1 and the saga goes to <code>CANCELADO</code> in about <b>100 ms</b>, <b>with no charge and no refund</b>. Davi never even opens his bank app.',
        look: 'The bottom track goes from NOVO to CANCELADO in an instant; Davi\'s app doesn\'t change.',
        key: 'What\'s hard to undo goes last.',
        f(o, t) { const ms = lin(t, 0.3, 2.3, 0, 100), done = ms >= 100; lit(o, 'rb', 'rdav');
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = ['CANCELADO in 44.95 s', 'dim'];
          o.rows.rb.tape = trackB(ms); o.rows.rb.rows[0] = [done ? 'CANCELADO in ~100 ms' : `${Math.round(ms)} ms`, done ? 'acc' : 'hi'];
          o.rows.rdav = act('Davi\'s app', 'PIX', ['no charge', 'acc'], ['balance: unchanged', 'dim']);
          o.cnt = [['TIME TO CANCELADO', done ? '~100 ms' : `${Math.round(ms)} ms`], ['REFUNDS', '0', 'dim'], ['CHARGE', 'none', 'dim']];
          o.res = done ? [['~100 ms, no refund', 'acc']] : []; } },
      { id: 'lado', dur: 7, title: 'Side by side: the same 10%, 2.0 refunds × 0', yk: 'PER 20 ORDERS',
        code: ['stock failure: 10% (2.0 of 20)', 'charge first:   2.0 refunds per 20', 'reserve first:  0 refunds', '1057\'s time:    44.95 s × ~100 ms', '(with the 5% payment failure first, the exact math gives 1.9)'],
        story: 'The same <b>10%</b> stock failure costs different things in the two orders. In the store\'s, it becomes <b>2.0 refunds per 20 orders</b>: money that leaves and comes back, a possible fee and a customer who saw the balance drop. In the lab\'s, <b>none</b>. (With the 5% payment failure coming first, the exact math is 1.9.)',
        look: 'The two tracks get completed, side by side; the counters sum up 20 orders and each order\'s refunds.',
        key: 'The order of the steps decides how much you compensate.',
        f(o, t) { const n = Math.round(lin(t, 0.4, 4.4, 0, 20)); lit(o, 'ra', 'rb');
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = [`refunds: ${dec(n * 0.1)}`, 'acc'];
          o.rows.rb.tape = trackB(1000); o.rows.rb.rows[0] = ['refunds: 0', 'acc'];
          o.cnt = [['ORDERS', String(n)], ['REFUNDS (STORE)', dec(n * 0.1), 'dim'], ['REFUNDS (LAB)', '0', 'dim']];
          o.res = n >= 20 ? [['2.0 refunds × 0', 'acc'], ['44.95 s × ~100 ms', 'acc']] : []; } },
      { id: 'presa', dur: 8, title: 'What if it goes wrong: 3,600 units stuck', yk: 'THE STUCK RESERVATION (EXAMPLE)',
        code: ['30 orders/s × 20% who drop off the Pix', '× 600 s (10 min reservation)', '= 3,600 units reserved and not sold', 'that\'s why the reservation has a deadline:', 'the expiry is a compensation (LiberarEstoque)'],
        story: 'Reserving first swaps the refund for another debt: while the customer decides to pay the Pix, the unit stays <b>reserved and unsold</b>. If <b>20%</b> drop off and the reservation lasts <b>10 min</b>, at 30 orders/s there are 30 × 0.2 × 600 = <b>3,600 units</b> stuck (example). That\'s why the reservation has a deadline, and the expiry is a compensation: the watchdog releases the reservation nobody paid for.',
        look: 'The bottom track\'s cable carries reservations to the block on the right, and the bar fills up to 3,600.',
        key: 'Reserving first avoids the refund and creates the stuck reservation.',
        f(o, t) { const u = lin(t, 0.4, 4.6, 0, 3600), full = u >= 3600; lit(o, 'rb'); o.on.rpre = full ? 'bad' : 1;
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = ['refund instead of stuck reservation', 'dim'];
          o.rows.rb.tape = trackB(1000); o.rows.rb.rows[0] = ['reservation stuck while the customer pays', 'bad'];
          o.rows.rpre.bar = [u / 3600 * 0.92, full ? 'bad' : 'acc', `${thou(u)} units stuck`];
          o.rows.rpre.rows[1] = [full ? 'deadline: the watchdog releases' : 'reservation lasts 10 min', full ? 'acc' : 'dim'];
          o.beams = [{ pts: CR.dav }, { pts: CR.pre, on: !full, flow: !full, tone: full ? 'bad' : '' }];
          if (full) T(o, TF(735), '3,600 units sitting idle', 'bad');
          o.cnt = [['STUCK UNITS', thou(u), full ? 'bad' : ''], ['DROP-OFF', '20%', 'dim'], ['RESERVATION DEADLINE', '10 min', 'dim']];
          o.res = full ? [['30 × 0.2 × 600 = 3,600', 'bad'], ['the expiry is a compensation', 'acc']] : []; } },
    ],
    lab: [
      { id: 'pecas', dur: 5, title: 'The lab: 5 services, 5 databases, Kafka', yk: 'THE REPOSITORY (READ, NOT RUN)',
        code: ['Go 1.23 · Kafka (KRaft) · 5 PostgreSQL', 'orquestrador, pedidos, estoque, pagamentos, entregas', 'topics <service>-commands and <service>-reply', 'simulator: 1 order, 20 orders, N, monitor', 'only the orchestrated version exists'],
        story: 'The author\'s public lab has <b>5 services</b> (<code>orquestrador</code>, <code>pedidos</code>, <code>estoque</code>, <code>pagamentos</code>, <code>entregas</code>), <b>5 PostgreSQL databases</b>, one per service, and Kafka. Each service has a command topic and a reply topic (<code>pagamentos-commands</code> / <code>pagamentos-reply</code>). A simulator sends 1 order, 20 or N. Only the orchestrated version exists. What the figure says about it comes from <b>reading the code</b>: the lab was not run.',
        look: 'The orchestrator in the middle, the simulator on the left and the four services on the right, each with its pair of topics.',
        key: 'A lab reads like a report.',
        f(o, t) { lit(o, 'orq', 'sim', 'bped', 'best', 'bpag', 'bent');
          o.rows.orq = act('orchestrator', 'saga_events', ['state machine', 'acc'], ['PENDING → … → COMPLETED', 'dim'], ['+ COMPENSATING, FAILED', 'dim']);
          o.cnt = [['SERVICES', '5'], ['DATABASES', '5 PostgreSQL', 'dim'], ['VERSION', 'orchestrated', 'dim']];
          o.res = [['read in the code, not run', 'acc']]; } },
      { id: 'sucesso', dur: 7, title: 'One order: reserve, then charge', yk: 'THE SUCCESS FLOW',
        code: ['VALIDATE_ORDER    → pedidos', 'RESERVE_STOCK     → estoque', 'PROCESS_PAYMENT   → pagamentos', 'SCHEDULE_DELIVERY → entregas', '→ COMPLETED'],
        story: 'The lab\'s success flow: <code>VALIDATE_ORDER → RESERVE_STOCK → PROCESS_PAYMENT → SCHEDULE_DELIVERY → COMPLETED</code>. Note the order: it <b>reserves the stock before charging</b>, the opposite of the store. The states saved in <code>saga_events</code> go from <code>PENDING</code> to <code>COMPLETED</code>.',
        look: 'The command goes to each service, one at a time, and the reply comes back; the orchestrator\'s state advances with each reply.',
        key: 'In the lab, stock comes before payment.',
        f(o, t) { const K = [['bped', CB.ped, 'VALIDATE_ORDER'], ['best', CB.est, 'RESERVE_STOCK'], ['bpag', CB.pag, 'PROCESS_PAYMENT'], ['bent', CB.ent, 'SCHEDULE_DELIVERY']]; let n = 0;
          lit(o, 'orq'); K.forEach(([nm, pts, cmd], k) => { const a = go_(t, 0.3 + k * 1.2, 0.8 + k * 1.2), b = go_(t, 0.9 + k * 1.2, 1.4 + k * 1.2);
            if (b >= 1) n++; if (a > 0 && b < 1) lit(o, nm); beam(o, pts, (a > 0 && a < 1) || (b > 0 && b < 1));
            pk(o, pts, a, cmd); pk(o, rev(pts), b, ''); });
          o.rows.orq = act('orchestrator', 'saga_events', [LABST[n], n === 4 ? 'acc' : 'hi'], [`${n} of 4 replies`, 'dim']);
          o.cnt = [['STATE', LABST[n]], ['REPLIES', `${n} of 4`, 'dim'], ['ORDER', 'reserve, then charge', 'dim']];
          o.res = n === 4 ? [['COMPLETED', 'acc']] : []; } },
      { id: 'vinte', dur: 8, title: '20 orders: about 17, 2 and 1', yk: 'THE PROBABILITIES',
        code: ['success:   0.9 × 0.95 = 85.5% → 17.1 of 20', 'stock:     10%               →  2.0 of 20', 'payment:   0.9 × 0.05 = 4.5%  →  0.9 of 20', 'README: ~17–18 complete, ~2 fail', '        on stock, ~1 on payment'],
        story: '<code>estoque</code> fails on a <b>10%</b> draw and <code>pagamento</code> on a <b>5%</b> one. Since stock comes first, success is 0.9 × 0.95 = <b>85.5%</b> (17.1 of 20); the stock failure, <b>10%</b> (2.0 of 20); the payment failure, 0.9 × 0.05 = <b>4.5%</b> (0.9 of 20), and then the stock has to be released. The README sums it up: with 20 orders, about 17 to 18 complete, 2 fail on stock and 1 on payment.',
        look: 'The simulator grid fills up with the 20 orders: the completed ones lit, the failed ones red, with "est" or "pag".',
        key: 'The probabilities add up: 85.5% + 10% + 4.5% = 100%.',
        f(o, t) { const n = Math.round(lin(t, 0.3, 5.3, 0, 20)), D = OUT20.slice(0, n), ok = D.filter(r => r === 'ok').length, e = D.filter(r => r === 'E').length, p = D.filter(r => r === 'P').length;
          lit(o, 'orq', 'sim'); o.rows.sim.grid = grid(n); o.rows.sim.rows = [['completed ' + ok, 'acc'], ['failures: est ' + e + ' · pag ' + p, e + p ? 'bad' : 'dim']];
          o.rows.orq = act('orchestrator', 'saga_events', [`${n} of 20 sagas`, 'acc'], ['COMPLETED ' + ok, 'dim'], ['FAILED ' + (e + p), e + p ? 'bad' : 'dim']);
          o.beams = o.beams.map(b => b.pts === CB.sim ? { pts: CB.sim, on: n < 20, flow: n < 20 } : b);
          o.cnt = [['COMPLETED', String(ok)], ['STOCK FAILURE', String(e), 'dim'], ['PAYMENT FAILURE', String(p), 'dim']];
          o.res = n >= 20 ? [['17 / 2 / 1', 'acc'], ['expected: 17.1 / 2.0 / 0.9', 'acc']] : []; } },
      { id: 'falhapag', dur: 8, title: 'Payment failure: releases, cancels, and FAILED first', yk: 'startCompensation (READ)',
        code: ['PROCESS_PAYMENT fails (state: STOCK_RESERVED)', '→ COMPENSATING', '→ RELEASE_STOCK and CANCEL_ORDER (lines 420–428)', '→ FAILED saved already on line 432', 'CANCEL_PAYMENT is not sent: nothing to refund'],
        story: 'Payment fails. The saved state is still <code>STOCK_RESERVED</code>, so the orchestrator sends <code>RELEASE_STOCK</code> and <code>CANCEL_ORDER</code>; <code>CANCEL_PAYMENT</code> isn\'t sent, which makes sense (nothing to refund). But lines 420 to 428 fire the compensations <b>without checking the return</b>, and line 432 saves <code>FAILED</code> <b>before any reply</b>. In the lab, <code>FAILED</code> means "I asked to compensate".',
        look: 'Payment comes back red; the two compensations go out and the orchestrator already shows FAILED while they are still on the cables.',
        key: 'FAILED doesn\'t mean "compensated"; it means "I asked to compensate".',
        f(o, t) { const a = go_(t, 0.3, 0.9), b = go_(t, 1.0, 1.6), c = go_(t, 1.9, 2.9), fail = t > 2.2, r = go_(t, 3.4, 4.2); lit(o, 'orq');
          const st = fail ? 'FAILED' : b >= 1 ? 'COMPENSATING' : 'STOCK_RESERVED'; if (fail) o.on.orq = 'bad';
          if (b > 0) o.on.bpag = 'bad'; if (c > 0) lit(o, 'best', 'bped');
          o.rows.orq = act('orchestrator', 'saga_events', [st, fail ? 'bad' : 'acc'], [fail && r < 1 ? 'no reply yet' : b >= 1 ? 'RELEASE_STOCK, CANCEL_ORDER' : 'PROCESS_PAYMENT', 'dim']);
          o.rows.bpag = act('pagamentos', '+ DB', [b > 0 ? 'failed (5% draw)' : 'PROCESS_PAYMENT', b > 0 ? 'bad' : 'dim']);
          o.rows.best = act('estoque', '+ DB', [c >= 1 ? 'released the reservation' : 'reservation made', c >= 1 ? 'acc' : 'dim']);
          o.rows.bped = act('pedidos', '+ DB', [c >= 1 ? 'order canceled' : 'order validated', c >= 1 ? 'acc' : 'dim']);
          beam(o, CB.pag, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : ''); beam(o, CB.est, (c > 0 && c < 1) || (r > 0 && r < 1)); beam(o, CB.ped, (c > 0 && c < 1) || (r > 0 && r < 1));
          pk(o, CB.pag, a, 'PROCESS_PAYMENT'); pk(o, rev(CB.pag), b, 'failed', 'bad'); pk(o, CB.est, c, 'RELEASE_STOCK'); pk(o, CB.ped, c, 'CANCEL_ORDER');
          pk(o, rev(CB.est), r, ''); pk(o, rev(CB.ped), r, '');
          if (fail && r < 1) T(o, TF(), 'FAILED before the replies', 'bad');
          o.cnt = [['STATE', st, fail ? 'bad' : ''], ['COMPENSATIONS', b >= 1 ? '2 (without waiting)' : '…', 'dim'], ['CANCEL_PAYMENT', 'not sent', 'dim']];
          o.res = fail ? [['FAILED = "I asked to compensate"', 'bad']] : []; } },
      { id: 'ressuscita', dur: 9, title: 'What if it goes wrong: the canceled saga comes back to life (read)', yk: 'processReply (READ IN THE CODE, NOT RUN)',
        code: ['CANCEL_ORDER ok   on pedidos-reply → sends RESERVE_STOCK', 'RELEASE_STOCK ok  on estoque-reply → sends PROCESS_PAYMENT', 'advances by the topic, without checking the state', '→ can reach COMPLETED: charges and schedules', 'fix: command_type + conditional transition'],
        story: '<b>Read in the code, not run.</b> The compensation replies come back with <code>Success: true</code> through the same <code>*-reply</code> topics, and <code>processReply</code> advances <b>by the topic</b>, without looking at the state. The <code>CANCEL_ORDER</code> reply on <code>pedidos-reply</code> makes the orchestrator send <code>RESERVE_STOCK</code> again; the <code>RELEASE_STOCK</code> one on <code>estoque-reply</code> sends <code>PROCESS_PAYMENT</code>. The <code>FAILED</code> saga <b>comes back to life</b> and can reach <code>COMPLETED</code>: it charges and schedules delivery for a canceled order. The fix: the reply carries the <code>command_type</code> and the orchestrator only advances from the expected state (the conditional transition from lesson 6).',
        look: 'The cancellation reply comes back from pedidos and, instead of closing, triggers a red RESERVE_STOCK; the release reply comes back from stock and triggers a red PROCESS_PAYMENT.',
        key: 'Whoever advances by the topic, and not by the state, reads the compensation as an advance.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.3), c = go_(t, 2.6, 3.4), d = go_(t, 3.6, 4.5), up = b > 0;
          o.on.orq = 'bad'; if (a > 0) lit(o, 'bped'); if (b >= 1) o.on.best = 'bad'; if (d >= 1) o.on.bpag = 'bad';
          o.rows.orq = act('orchestrator', 'saga_events', [up ? 'FAILED → advances again' : 'FAILED', 'bad'], [up ? 'reads the topic, not the state' : 'expected nothing more', 'dim']);
          o.rows.bped = act('pedidos', '+ DB', ['CANCEL_ORDER: Success true', a > 0 ? 'acc' : 'dim'], ['on pedidos-reply', 'dim']);
          o.rows.best = act('estoque', '+ DB', [b >= 1 ? 'RESERVE_STOCK again' : 'RELEASE_STOCK: ok', b >= 1 ? 'bad' : 'dim'], ['on estoque-reply', 'dim']);
          o.rows.bpag = act('pagamentos', '+ DB', [d >= 1 ? 'PROCESS_PAYMENT: charges' : 'idle', d >= 1 ? 'bad' : 'dim']);
          beam(o, CB.ped, a > 0 && a < 1); beam(o, CB.est, (b > 0 && b < 1) || (c > 0 && c < 1), 'bad'); beam(o, CB.pag, d > 0 && d < 1, 'bad');
          pk(o, rev(CB.ped), a, 'CANCEL_ORDER ok'); pk(o, CB.est, b, 'RESERVE_STOCK', 'bad'); pk(o, rev(CB.est), c, 'RELEASE_STOCK ok'); pk(o, CB.pag, d, 'PROCESS_PAYMENT', 'bad');
          if (d >= 1) T(o, TF(420), 'read in the code: the canceled one comes back', 'bad');
          o.cnt = [['STATE', up ? 'FAILED → advances' : 'FAILED', 'bad'], ['READING', 'from the code', 'dim'], ['FIX', 'command_type', 'dim']];
          o.res = d >= 1 ? [['charges a canceled order', 'bad'], ['fix: conditional transition', 'acc']] : []; } },
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
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, papel à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.56 : W_ - 10); x.fillText(d.name, u(5), u(13)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 12, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(13)); x.textAlign = 'left'; } }
  // uma fita de células: acesa = presente, contorno = vazia, vermelha = erro, riscada = ignorada
  function drawTape(x, u, C, tape, W_, H_, label) {
    const n = Math.max(tape.length, 1), gap = 3, cw = Math.min(n > 6 ? 40 : 96, (W_ - 10 - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 5, light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, label, 10, W_ - 10); x.fillText(label, u(5), u(y0 - 8));
    if (!tape.length) { x.strokeStyle = C.line; x.lineWidth = u(0.6); x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(5.5), u(y0 + 0.5), u(W_ - 11), u(ch - 1)); x.setLineDash([]);
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'vazio', 11, 60); x.fillText('vazio', u(W_ / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; return; }
    tape.forEach(([lab, s], i) => { const X = 5 + i * (cw + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      x.strokeStyle = s === 'bad' ? BAD() : s === 'ok' ? accC() : C.line; x.lineWidth = u(0.6); x.strokeRect(u(X + 0.5), u(y0 + 0.5), u(cw - 1), u(ch - 1));
      if (lab) { x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : INK();
        fitFont(x, u, lab, 12, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left';
        if (s === 'off') { const tw = Math.min(cw - 4, x.measureText(lab).width / u(1)); x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.beginPath();
          x.moveTo(u(X + cw / 2 - tw / 2), u(y0 + ch / 2)); x.lineTo(u(X + cw / 2 + tw / 2), u(y0 + ch / 2)); x.stroke(); } } });
  }
  // a grade do simulador: um quadrado por pedido, 5 por linha
  function drawGrid(x, u, C, cells, W_, H_) {
    const cols = 5, rows = Math.ceil(cells.length / cols), gap = 4, y0 = 92, cw = (W_ - 10 - gap * (cols - 1)) / cols, ch = Math.min(40, (H_ - y0 - 6) / rows - gap), light = theme === 'light';
    cells.forEach(([lab, s], i) => { const X = 5 + (i % cols) * (cw + gap), Y = y0 + Math.floor(i / cols) * (ch + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(Y), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(Y), u(cw), u(ch)); }
      x.strokeStyle = s === 'bad' ? BAD() : s === 'ok' ? accC() : C.line; x.lineWidth = u(0.6); x.strokeRect(u(X + 0.5), u(Y + 0.5), u(cw - 1), u(ch - 1));
      x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : INK();
      fitFont(x, u, lab, 13, cw - 4); x.fillText(lab, u(X + cw / 2), u(Y + ch / 2 + 0.5)); x.textAlign = 'left'; });
  }
  // a barra das reservas presas
  function drawBar(x, u, C, [fr, tn, lab], W_, H_) {
    const ch = 22, y0 = H_ - ch - 5, w = W_ - 10, col = tn === 'bad' ? BAD() : accC(), light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, lab, 12, w); x.fillText(lab, u(5), u(y0 - 9));
    x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(5), u(y0), u(w), u(ch));
    x.fillStyle = col; x.fillRect(u(5), u(y0), u(w * clamp(fr)), u(ch));
    x.strokeStyle = col; x.lineWidth = u(0.8); x.strokeRect(u(5.5), u(y0 + 0.5), u(w - 1), u(ch - 1));
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, small = H_ < 80, light = theme === 'light';
    head(x, u, d, W_, col, small ? 15 : 18); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(26)); x.lineTo(u(W_ - 4), u(26)); x.stroke();
    const fs = d.fs || (small ? 14 : 16), lh = d.lh || (small ? 18 : 22);
    let y = small ? 40 : 41; for (const [text, tn] of d.rows || []) { if (text) {
      if (tn === 'mark') { x.fillStyle = accC(); x.fillRect(u(3), u(y - lh / 2 - 2.5), u(W_ - 6), u(lh)); }
      x.fillStyle = tn === 'mark' ? (light ? '#f6f6f5' : '#141516') : toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; }
    if (d.tape) drawTape(x, u, C, d.tape, W_, H_, d.tl || '');
    if (d.grid) drawGrid(x, u, C, d.grid, W_, H_);
    if (d.bar) drawBar(x, u, C, d.bar, W_, H_);
    cv.tex.needsUpdate = true;
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
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    log: () => `<li>Real output from PostgreSQL 14.24 (Oct 20, 2026), <code>saga_log</code> of <code>s-1057</code>:</li><table class="h3-sum"><tr><th>id</th><th>de</th><th>para</th><th>event</th><th>at</th></tr>${LOG7.map(([id, para, ev, em], i) => `<tr${i === 4 ? ' class="on"' : ''}><td>${id}</td><td>${i ? LOG7[i - 1][1] : ''}</td><td>${para}</td><td>${ev}</td><td>${em}</td></tr>`).join('')}</table><li><code>saga</code> ends with <code>CANCELADO</code> and <code>versao = 7</code></li><li>Duplicate: <code>transitar('s-1057','COBRANDO','PAGO',…)</code> at 20:15:41.210 → <b>f</b>, no row in the log</li><li>Watchdog: found <code>s-teste</code> stalled in <code>COBRANDO</code> since 19:20</li><li>90 days at 30 orders/s: 30 × 86,400 × 90 × 7 = <b>1,632,960,000</b> rows, ~300 GB at 200 B</li><li>The author\'s lab keeps the log in <code>saga_events</code> (<code>saga_id</code>, <code>order_id</code>, <code>state</code>, <code>data</code>, <code>error</code>, <code>created_at</code>); the state is the last row</li>`,
    'estorno-falha': () => `<table class="h3-sum"><tr><th>where it failed</th><th>compensations, in order</th><th>how many</th></tr><tr class="on"><td>stock (the store charged first)</td><td>EstornarCobranca, CancelarPedido</td><td>2</td></tr><tr><td>payment (lab)</td><td>LiberarEstoque, CancelarPedido</td><td>2</td></tr><tr><td>delivery (lab)</td><td>EstornarCobranca, LiberarEstoque, CancelarPedido</td><td>3</td></tr></table><li>Backoff: 1 + 2 + 4 + 8 + 16 = <b>31 s</b> (5 retries, 6 attempts); after that, <code>INTERVENCAO</code></li><li>Key <code>estorno-c-7732</code>: repeating refunds once; without it, R$ 116.00</li><li>Microsoft: "Compensating transactions don't always work"; canceling a reservation "might not entitle the customer to a complete refund"</li><li>What can\'t be undone: the email that was sent (you send another) and the PSP fee</li>`,
    'dual-write': () => `<li>Author\'s lab (read, not run): <code>processReply</code> sends the command on line <b>346</b> and only saves the state (<code>saveEvent</code>) on <b>391</b>; consumer at <code>OffsetNewest</code> (line 194); <code>command_id</code> and <code>reply_id</code> are not checked</li><table class="h3-sum"><tr><th>case</th><th>symptom</th></tr><tr><td>choreography: saves and goes down before publishing</td><td>the saga stops, with no error</td></tr><tr class="on"><td>orchestration: sends and goes down before saving</td><td>reserves twice</td></tr><tr><td>outbox: the relay publishes and goes down before marking</td><td>duplicate command; the <code>command_id</code> holds it</td></tr></table><li>"Publish inside the transaction and only commit afterward" is not atomic: the <code>COMMIT</code> can fail after the publish</li><li>Confluent, <i>The Dual-Write Problem</i>; microservices.io, <i>Transactional Outbox</i></li>`,
    'reserva-antes': () => `<table class="h3-sum"><tr><th>1057 with no stock</th><th>charge first (the store)</th><th>reserve first (the lab)</th></tr><tr class="on"><td>to CANCELADO</td><td>44.95 s</td><td>~100 ms</td></tr><tr><td>refund</td><td>1 (R$ 58.00)</td><td>none</td></tr><tr><td>Davi sees the money leave</td><td>yes, and it comes back in 3.7 s</td><td>no</td></tr><tr><td>the cost</td><td>waiting, refund and PSP fee</td><td>reservation stuck while the customer pays</td></tr></table><li>Refunds per 20 orders (10% stock failure): 2.0 × 0 (1.9 with the 5% payment failure first)</li><li>Stuck reservation (example): 30 × 0.2 × 600 = <b>3,600</b> units</li>`,
    lab: () => `<li>Author\'s public repository, <code>exemplos/saga/orquestrado/</code> (read, not run): Go 1.23, Kafka KRaft, 5 PostgreSQL, simulator</li><table class="h3-sum"><tr><th>outcome</th><th>probability</th><th>in 20</th></tr><tr class="on"><td>completes</td><td>0.9 × 0.95 = 85.5%</td><td>17.1</td></tr><tr><td>stock failure</td><td>10%</td><td>2.0</td></tr><tr><td>payment failure</td><td>0.9 × 0.05 = 4.5%</td><td>0.9</td></tr></table><li>Compensation: <code>… PROCESS_PAYMENT (fails) → COMPENSATING → RELEASE_STOCK → CANCEL_ORDER → FAILED</code> (the README lists <code>CANCEL_PAYMENT</code>, which is only sent on a delivery failure)</li><li>Observations from the reading: advances by the topic; <code>FAILED</code> before the replies; command before state; no watchdog or idempotency; <code>CANCEL_DELIVERY</code> never sent; the log called "Event Sourcing"</li>`,
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
      ${sc === 'lab' ? '<div class="o3-mode r3-act"><button data-sc="reserva-antes">Reserve first<small>the two orders side by side</small></button></div>' : ''}
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'compensacao') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'compensacao' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-compensacao3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'compensacao') return;
    const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
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
      const [x0, x1, y0, y1] = [24, 900, 30, 440];
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
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
