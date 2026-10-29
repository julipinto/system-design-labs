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
FIGS3D.push({ id: 'compensacao', name: 'Compensação', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['log', 'estorno-falha', 'dual-write', 'reserva-antes', 'lab'];
  const SCNAME = { log: 'Log', 'estorno-falha': 'Estorno', 'dual-write': 'Dual write', 'reserva-antes': 'Reserva antes', lab: 'Lab' };
  const SCFULL = { log: 'O log da saga', 'estorno-falha': 'O estorno que falha', 'dual-write': 'A escrita dupla',
    'reserva-antes': 'Cobrar antes × reservar antes', lab: 'O laboratório do autor' };
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
  // o log real do s-1057 (PostgreSQL 14.24, 20/10/2026)
  const LOG7 = [['1', 'NOVO', 'e-1901', '20:15:00'], ['2', 'COBRANDO', '', '20:15:00.05'], ['3', 'PAGO', 'e-1902', '20:15:41.2'],
    ['4', 'RESERVANDO', '', '20:15:41.22'], ['5', 'COMPENSANDO', 'e-1903', '20:15:41.26'], ['6', 'ESTORNANDO', '', '20:15:41.3'], ['7', 'CANCELADO', 'e-1904', '20:15:44.95']];
  const logRow = ([id, para, ev, em]) => `${id} ${para} ${ev || '·'} ${em.slice(6)}`;
  function logD(n, mark = -1) {
    const d = act('saga_log', `${n} DE 7 LINHAS`, ['id · para · evento · em (20:15:…)', 'dim'],
      ...LOG7.slice(0, n).map((r, i) => [logRow(r), i === mark ? 'mark' : i === n - 1 ? 'acc' : 'hi']));
    d.fs = 15; d.lh = 26; return d;
  }
  const sagaD = (st, v, tone = 'acc', id = 's-1057', extra) => act('saga ' + id, 'TABELA', ['estado ' + st, tone], [extra || 'versao ' + v, 'dim']);
  // a fita das tentativas do estorno: a 1ª e as 5 repetições, com a espera antes de cada uma
  const TRY = ['1ª', '+1 s', '+2 s', '+4 s', '+8 s', '+16 s'], CUM = [0, 1, 3, 7, 15, 31];
  // as duas trilhas da ordem dos passos
  const TA = [['NOVO', 0], ['Pix', 0.05], ['PAGO', 41.2], ['sem estoque', 41.26, 'bad'], ['estorno', 41.3], ['CANCELADO', 44.95]];
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
      o.rows.orq = act('orquestrador', 'SAGA s-1057', ['espera eventos', 'dim']);
      o.rows.saga = sagaD('—', 0, 'dim');
      o.rows.lped = act('pedidos', 'SERVIÇO', ['pedido 1057 · 58,00', 'dim']);
      o.rows.lpag = act('pagamentos', 'PSP · PIX', ['cobrança c-7732', 'dim']);
      o.rows.lest = act('estoque', 'SERVIÇO', ['produto 15: 0', 'dim'], ['avaria às 20:15:10', 'dim']);
      o.rows.log = logD(0);
      o.rows.vig = act('vigia', 'PRAZO 30 MIN', ['procura sagas paradas', 'dim']);
      o.beams.push({ pts: CL.ped }, { pts: CL.pag }, { pts: CL.est }, { pts: CL.log }, { pts: CL.saga }, { pts: CL.vig });
    } else if (F === 'E') {
      show('orq', 'saga', 'eped', 'enot', 'psp', 'gente');
      o.rows.orq = act('orquestrador', 'SAGA s-1057', ['COMPENSANDO', 'acc'], ['motivo sem_estoque', 'dim']);
      o.rows.saga = sagaD('COMPENSANDO', 5);
      o.rows.eped = act('pedidos', 'SERVIÇO', ['pedido 1057', 'hi'], ['pago, sem estoque', 'dim']);
      o.rows.enot = act('notificacoes', 'SERVIÇO', ['para o Davi', 'dim'], ['nada enviado', 'dim']);
      o.rows.psp = withTape(act('PSP', 'PIX c-7732', ['cobrou R$ 58,00', 'hi'], ['chave estorno-c-7732', 'dim']), 'tentativas do estorno', []);
      o.rows.gente = act('plantão', 'GENTE', ['nenhum alerta', 'dim']);
      o.beams.push({ pts: CE.ped }, { pts: CE.not }, { pts: CE.psp }, { pts: CE.gente }, { pts: CL.saga });
    } else if (F === 'D') {
      show('orq', 'ddb', 'drel', 'dkaf', 'dest');
      o.rows.orq = act('orquestrador', 'SAGA s-1057', ['PedidoPago chegou', 'dim'], ['próximo: reservar', 'dim']);
      o.rows.ddb = withTape(act('banco do orquestrador', 'POSTGRESQL', ['saga s-1057', 'dim'], ['estado PAGO', 'hi']), 'outbox', []);
      o.rows.drel = act('relay', 'LÊ A OUTBOX', ['manda ao Kafka', 'dim']);
      o.rows.dkaf = withTape(act('estoque-commands', 'KAFKA'), 'comandos', []);
      o.rows.dest = withTape(act('estoque', 'SERVIÇO', ['reservas da s-1057: 0', 'hi']), 'command_id já vistos', []);
      o.beams.push({ pts: CD.db }, { pts: CD.kaf }, { pts: CD.est }, { pts: CD.rdb }, { pts: CD.rkaf });
    } else if (F === 'R') {
      show('ra', 'rb', 'rdav', 'rpre');
      o.rows.ra = withTape(act('cobrar antes', 'A LOJA', ['cobra, depois reserva', 'dim']), 'o 1057', trackA(-1));
      o.rows.rb = withTape(act('reservar antes', 'O LABORATÓRIO', ['reserva, depois cobra', 'dim']), 'o 1057', trackB(-1));
      o.rows.rdav = act('app do Davi', 'PIX', ['saldo: sem mudança', 'dim']);
      o.rows.rpre = act('reservas presas', '30 PEDIDOS/s', ['20% desistem do Pix', 'dim'], ['reserva dura 10 min', 'dim']); o.rows.rpre.bar = [0, 'acc', '0 unidades'];
      o.beams.push({ pts: CR.dav }, { pts: CR.pre });
    } else {
      show('orq', 'sim', 'bped', 'best', 'bpag', 'bent');
      o.rows.orq = act('orquestrador', 'saga_events', ['PENDING', 'dim']);
      o.rows.sim = act('simulador', '20 PEDIDOS', ['estoque falha 10%', 'dim'], ['pagamento falha 5%', 'dim']); o.rows.sim.grid = grid(0);
      o.rows.bped = act('pedidos', '+ BANCO', ['pedidos-commands/-reply', 'dim']);
      o.rows.best = act('estoque', '+ BANCO', ['estoque-commands/-reply', 'dim']);
      o.rows.bpag = act('pagamentos', '+ BANCO', ['pagamentos-commands/-reply', 'dim']);
      o.rows.bent = act('entregas', '+ BANCO', ['entregas-commands/-reply', 'dim']);
      o.beams.push({ pts: CB.sim }, { pts: CB.ped }, { pts: CB.est }, { pts: CB.pag }, { pts: CB.ent });
    }
    return o;
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    log: [
      { id: 'novo', dur: 6, title: '20:15:00: o 1057 nasce, linhas 1 e 2', yk: 'transitar',
        code: ["transitar('s-1057', NULL, 'NOVO', 'e-1901')", "  → linha 1: NOVO", "transitar('s-1057', 'NOVO', 'COBRANDO')", "  → linha 2: COBRANDO", "manda a cobrança Pix c-7732 (58,00)"],
        story: 'O Davi cria o pedido 1057 às 20:15:00.000: 1 camiseta preta (49,00) e o frete SP (9,00), <b>58,00</b>. Chega <code>PedidoCriado</code> (<code>e-1901</code>) e a função <code>transitar</code> grava a saga <code>s-1057</code> em <code>NOVO</code>: <b>linha 1</b> do <code>saga_log</code>. Cinquenta milissegundos depois a saga vai para <code>COBRANDO</code> e manda a cobrança Pix <code>c-7732</code>: <b>linha 2</b>.',
        look: 'O PedidoCriado sai do pedidos e chega ao orquestrador; a linha 1 aparece no log, à direita. Depois a cobrança vai ao pagamentos e entra a linha 2.',
        key: 'Cada transição da saga vira uma linha que só se acrescenta.',
        f(o, t) { const a = go_(t, 0.4, 1.4), b = go_(t, 2.0, 2.9), n = t > 3.0 ? 2 : t > 1.5 ? 1 : 0, st = ['—', 'NOVO', 'COBRANDO'][n]; lit(o, 'orq');
          if (a > 0 && a < 1) lit(o, 'lped'); if (b > 0) lit(o, 'lpag'); if (n) lit(o, 'log', 'saga');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [n === 2 ? 'manda a cobrança Pix' : n ? 'grava NOVO' : 'chega PedidoCriado', 'acc'], [n ? 'estado ' + st : '', 'dim']);
          o.rows.saga = sagaD(st, n, n ? 'acc' : 'dim'); o.rows.log = logD(n);
          o.rows.lped = act('pedidos', 'SERVIÇO', ['pedido 1057 · 58,00', 'acc'], ['camiseta 49 + frete 9', 'dim']);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [b >= 1 ? 'c-7732 aberta' : 'cobrança c-7732', b >= 1 ? 'acc' : 'dim'], [b >= 1 ? 'espera o Davi pagar' : '', 'dim']);
          beam(o, CL.ped, a > 0 && a < 1); beam(o, CL.pag, b > 0 && b < 1); beam(o, CL.log, n > 0);
          pk(o, CL.ped, a, 'PedidoCriado · e-1901'); pk(o, rev(CL.pag), b, 'cobrar c-7732');
          o.cnt = [['RELÓGIO', n === 2 ? '20:15:00.050' : '20:15:00.000'], ['LINHAS NO LOG', `${n} de 7`, 'dim'], ['ESTADO', st, 'dim']];
          o.res = n === 2 ? [['NOVO e COBRANDO: 2 linhas', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: '20:15:41.200: o Pix chega, linha 3', yk: 'A TRANSIÇÃO CONDICIONAL',
        code: ['UPDATE saga SET estado = \'PAGO\', versao = versao + 1', ' WHERE saga_id = \'s-1057\' AND estado = \'COBRANDO\';', '  → 1 linha afetada', 'INSERT INTO saga_log … (3, PAGO, e-1902)', "transitar(…) → t"],
        story: 'O Davi leva <b>41,2 s</b> para pagar no app do banco. Às 20:15:41.200 o PSP avisa por webhook e chega <code>PedidoPago</code> (<code>e-1902</code>, 58,00). <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> faz o <code>UPDATE … WHERE estado = de</code>: a saga está mesmo em <code>COBRANDO</code>, o <code>UPDATE</code> afeta 1 linha, e só por isso o log ganha a <b>linha 3</b>.',
        look: 'O relógio corre os 41,2 s da espera; o PedidoPago sai do pagamentos e a linha 3, PAGO, entra no log.',
        key: 'A saga só avança do estado em que realmente está.',
        f(o, t) { const w = lin(t, 0.2, 1.6, 0, 41.2), a = go_(t, 1.7, 2.7), n = a >= 1 ? 3 : 2; lit(o, 'orq', 'log', 'saga'); if (a > 0) lit(o, 'lpag');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [a >= 1 ? 'COBRANDO → PAGO: t' : 'espera o Pix', a >= 1 ? 'acc' : 'dim'], ['estado ' + (n === 3 ? 'PAGO' : 'COBRANDO'), 'dim']);
          o.rows.saga = sagaD(n === 3 ? 'PAGO' : 'COBRANDO', n); o.rows.log = logD(n);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [a > 0 ? 'Davi pagou: 58,00' : `espera: ${dec(w)} s`, a > 0 ? 'acc' : 'dim'], [a > 0 ? 'webhook do PSP' : 'cobrança c-7732', 'dim']);
          beam(o, CL.pag, a > 0 && a < 1); pk(o, CL.pag, a, 'PedidoPago · e-1902');
          o.cnt = [['ESPERA DO DAVI', `${dec(w)} s`], ['LINHAS NO LOG', `${n} de 7`, 'dim'], ['UPDATE', a >= 1 ? '1 linha' : '…', 'dim']];
          o.res = a >= 1 ? [['linha 3: PAGO, e-1902', 'acc']] : []; } },
      { id: 'dup', dur: 6, title: '20:15:41.210: o mesmo PedidoPago de novo: f', yk: 'A DUPLICATA (SAÍDA REAL)',
        code: ["transitar('s-1057','COBRANDO','PAGO','e-1902', …)", '  → f   (20:15:41.210, a duplicata)', 'a saga já está em PAGO:', '  o UPDATE afeta 0 linhas', '  nada vai para o log'],
        story: 'Dez milissegundos depois, às 20:15:41.210, o mesmo <code>PedidoPago</code> (<code>e-1902</code>) chega <b>de novo</b>. <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> devolve <b><code>f</code></b>: a saga já não está em <code>COBRANDO</code>, o <code>UPDATE</code> afeta 0 linhas e <b>nada</b> vai para o log. A duplicata foi ignorada sem código especial.',
        look: 'Um segundo PedidoPago anda pelo mesmo cabo e bate no orquestrador. O log continua com 3 linhas e a versão da saga continua 3.',
        key: 'A transição condicional ignora a repetição de graça.',
        f(o, t) { const a = go_(t, 0.6, 1.8), f_ = a >= 1; lit(o, 'orq', 'log', 'saga'); if (a > 0 && a < 1) lit(o, 'lpag');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [f_ ? 'transitar → f' : 'chega e-1902 de novo', 'acc'], [f_ ? 'UPDATE: 0 linhas' : 'estado PAGO', 'dim']);
          o.rows.saga = sagaD('PAGO', 3); o.rows.log = logD(3);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', ['webhook repetido', 'dim'], ['e-1902 · 58,00', 'dim']);
          beam(o, CL.pag, a > 0 && a < 1); pk(o, CL.pag, a, 'PedidoPago · e-1902 (de novo)');
          if (f_) T(o, TF(), 'f: duplicata ignorada', 'acc');
          o.cnt = [['DUPLICATA', f_ ? 'ignorada' : 'chegando'], ['LINHAS NO LOG', '3 de 7', 'dim'], ['RELÓGIO', '20:15:41.210', 'dim']];
          o.res = f_ ? [['f: sem linha nova no log', 'acc'], ['versao continua 3', 'acc']] : []; } },
      { id: 'compensa', dur: 7, title: '20:15:41.260: sem estoque, a linha 5 é COMPENSANDO', yk: 'AS QUATRO PERGUNTAS',
        code: ['Que evento é esse?  EstoqueIndisponivel (e-1903)', 'Onde estou?         RESERVANDO', 'Para onde vou?      COMPENSANDO', 'O que faço aqui?    guardo o motivo sem_estoque', '                    e mando estornar'],
        story: 'Às 20:15:41.220 a saga vai a <code>RESERVANDO</code> (<b>linha 4</b>) e manda <code>ReservarEstoque</code>. A camiseta (produto 15) teve baixa por avaria às 20:15:10: o estoque é <b>0</b>. O <code>estoque</code> responde <code>EstoqueIndisponivel</code> (<code>e-1903</code>, motivo <code>sem_estoque</code>), e a <b>linha 5</b> registra <code>RESERVANDO → COMPENSANDO</code>. É essa linha que diz, depois, por que o 1057 foi desfeito.',
        look: 'O comando vai ao estoque, que acende em vermelho com o 0; a resposta volta e a linha 5 do log fica marcada.',
        key: 'O log guarda o motivo junto da transição.',
        f(o, t) { const a = go_(t, 0.5, 1.4), b = go_(t, 1.7, 2.7), n = b >= 1 ? 5 : t > 0.3 ? 4 : 3; lit(o, 'orq', 'log', 'saga'); if (a > 0) o.on.lest = 'bad';
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [b >= 1 ? 'RESERVANDO → COMPENSANDO' : 'manda ReservarEstoque', 'acc'], [b >= 1 ? 'motivo sem_estoque' : 'estado RESERVANDO', 'dim']);
          o.rows.saga = sagaD(n === 5 ? 'COMPENSANDO' : n === 4 ? 'RESERVANDO' : 'PAGO', n); o.rows.log = logD(n, n === 5 ? 4 : -1);
          o.rows.lest = act('estoque', 'SERVIÇO', ['produto 15: 0', a > 0 ? 'bad' : 'dim'], [b > 0 ? 'EstoqueIndisponivel' : 'avaria às 20:15:10', b > 0 ? 'bad' : 'dim']);
          beam(o, CL.est, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, rev(CL.est), a, 'ReservarEstoque'); pk(o, CL.est, b, 'e-1903 · sem_estoque', 'bad');
          if (b >= 1) T(o, TF(), 'linha 5: COMPENSANDO', 'acc');
          o.cnt = [['RELÓGIO', b >= 1 ? '20:15:41.260' : '20:15:41.220'], ['LINHAS NO LOG', `${n} de 7`, 'dim'], ['MOTIVO', b >= 1 ? 'sem_estoque' : '…', b >= 1 ? 'bad' : 'dim']];
          o.res = b >= 1 ? [['linha 5: RESERVANDO → COMPENSANDO', 'acc'], ['e-1903 · sem_estoque', 'acc']] : []; } },
      { id: 'cancela', dur: 7, title: '20:15:44.950: estornado, a linha 7 é CANCELADO', yk: 'O LOG DO 1057 (SAÍDA REAL)',
        code: ['5 | RESERVANDO  | COMPENSANDO | e-1903 | 41.26', '6 | COMPENSANDO | ESTORNANDO  |        | 41.3', '7 | ESTORNANDO  | CANCELADO   | e-1904 | 44.95', 'saga: CANCELADO, versao = 7', 'compensação: 41.26 → 44.95 = 3,7 s'],
        story: 'A saga vai a <code>ESTORNANDO</code> (<b>linha 6</b>) e manda <code>EstornarCobranca c-7732</code>. Às 20:15:44.950 chega <code>PagamentoEstornado</code> (<code>e-1904</code>, 58,00): <b>linha 7</b>, <code>CANCELADO</code>, <code>versao = 7</code>; depois o pedido é cancelado (<code>e-1905</code>). A compensação inteira levou <b>3,7 s</b>; o 1057 todo, <b>44,95 s</b>, dos quais 41,2 s foram a espera do Davi. Ele recebe "pedido cancelado, estornamos R$ 58,00".',
        look: 'O estorno vai ao pagamentos e volta; o cancelamento vai ao pedidos. O log fecha com 7 linhas e a saga com versão 7.',
        key: 'O estado é a última linha: CANCELADO, versão 7.',
        f(o, t) { const a = go_(t, 0.5, 1.4), b = go_(t, 1.7, 2.6), c = go_(t, 2.9, 3.7), n = b >= 1 ? 7 : 6; lit(o, 'orq', 'log', 'saga'); if (a > 0) lit(o, 'lpag'); if (c > 0) lit(o, 'lped');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [n === 7 ? 'ESTORNANDO → CANCELADO' : 'manda EstornarCobranca', 'acc'], [c >= 1 ? 'avisa o Davi' : 'estado ' + (n === 7 ? 'CANCELADO' : 'ESTORNANDO'), 'dim']);
          o.rows.saga = sagaD(n === 7 ? 'CANCELADO' : 'ESTORNANDO', n); o.rows.log = logD(n);
          o.rows.lpag = act('pagamentos', 'PSP · PIX', [b > 0 ? 'estornou R$ 58,00' : 'estornar c-7732', 'acc'], [b > 0 ? 'e-1904' : 'estorno-c-7732', 'dim']);
          o.rows.lped = act('pedidos', 'SERVIÇO', [c >= 1 ? '1057 cancelado' : 'pedido 1057', c >= 1 ? 'acc' : 'dim'], [c >= 1 ? 'e-1905 PedidoCancelado' : '', 'dim']);
          beam(o, CL.pag, (a > 0 && a < 1) || (b > 0 && b < 1)); beam(o, CL.ped, c > 0 && c < 1);
          pk(o, rev(CL.pag), a, 'EstornarCobranca c-7732'); pk(o, CL.pag, b, 'PagamentoEstornado · e-1904'); pk(o, rev(CL.ped), c, 'CancelarPedido');
          if (c >= 1) T(o, TF(420), 'Davi: "estornamos R$ 58,00"', 'acc');
          o.cnt = [['TOTAL', n === 7 ? '44,95 s' : '…'], ['COMPENSAÇÃO', n === 7 ? '3,7 s' : '…', 'dim'], ['ESPERA DO DAVI', '41,2 s', 'dim']];
          o.res = n === 7 ? [['CANCELADO, versao 7', 'acc'], ['7 linhas, de NOVO a CANCELADO', 'acc']] : []; } },
      { id: 'custo', dur: 7, title: 'O log responde, e cresce: 1,6 bilhão de linhas', yk: 'A CONTA DE 90 DIAS',
        code: ["SELECT de, para, evento_id, em FROM saga_log", " WHERE saga_id = 's-1057' ORDER BY id;", '30 × 86.400 × 90 × 7 = 1.632.960.000 linhas', '× ~200 B ≈ 300 GB (326,6 GB na conta exata)', 'defesa: arquivar FINALIZADO e CANCELADO'],
        story: '"Onde está o 1057?" vira uma consulta por <code>saga_id</code>, em vez de juntar os logs de quatro serviços. A última linha diz de onde <b>retomar</b> depois de uma queda, e a linha 7 é a <b>prova</b> do estorno (<code>e-1904</code>, 58,00, 20:15:44.95). O artigo avisa o preço: a 30 pedidos/s, com 7 linhas por saga e 90 dias, são 30 × 86.400 × 90 × 7 = <b>1.632.960.000</b> linhas, uns <b>300 GB</b> a 200 B. Por isso se arquivam as sagas finais.',
        look: 'A consulta vai ao log e volta com as 7 linhas do 1057; o contador do mostrador sobe até 1,6 bilhão.',
        key: 'Rastreio, retomada e auditoria, ao preço de bilhões de linhas.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.3, 2.1), n = lin(t, 2.2, 5.6, 0, 1632960000); lit(o, 'orq', 'log', 'saga');
          o.rows.orq = act('orquestrador', 'CONSULTA', ['onde está o 1057?', 'acc'], [b >= 1 ? 'última linha: CANCELADO' : "saga_id = 's-1057'", 'dim']);
          o.rows.saga = sagaD('CANCELADO', 7); o.rows.log = logD(7, b >= 1 ? 6 : -1);
          beam(o, CL.log, (a > 0 && a < 1) || (b > 0 && b < 1)); pk(o, CL.log, a, 'SELECT … s-1057'); pk(o, rev(CL.log), b, '7 linhas');
          o.cnt = [['LINHAS EM 90 DIAS', thou(n)], ['A ~200 B', n >= 1632960000 ? '~300 GB' : '…', 'dim'], ['POR SAGA', '7 linhas', 'dim']];
          o.res = n >= 1632960000 ? [['1,6 bilhão de linhas', 'acc'], ['arquivar as sagas finais', 'acc']] : []; } },
      { id: 'vigia', dur: 8, title: 'E se der errado: a saga que ficou parada', yk: 'A VIGIA (RODADA NO POSTGRESQL 14.24)',
        code: ['SELECT saga_id, estado FROM saga', " WHERE estado NOT IN ('FINALIZADO','CANCELADO')", "   AND atualizada_em < agora − interval '30 minutes';", '  → s-teste | COBRANDO   (parada desde 19:20)', 'COBRANDO + prazo vencido → CANCELADO'],
        story: 'Se o webhook do Pix se perde (ou o cliente desiste), a saga fica em <code>COBRANDO</code> <b>para sempre</b>: nenhum evento chega, então nenhuma transição acontece. A saída é um <b>prazo por estado</b> (a cobrança Pix expira em 30 min, no exemplo) e uma <b>vigia</b> que procura as sagas paradas. Rodada no PostgreSQL 14.24, ela achou a <code>s-teste</code>, parada em <code>COBRANDO</code> desde as <b>19:20</b>. A vigia a expira, e a expiração cancela o pedido (nada a estornar).',
        look: 'A vigia, na frente do log, consulta a tabela saga; a s-teste aparece em vermelho, parada desde 19:20, e depois passa a CANCELADO.',
        key: 'Sem prazo e sem vigia, COBRANDO dura para sempre.',
        f(o, t) { const a = go_(t, 0.6, 1.6), found = a >= 1, exp = t > 3.0; lit(o, 'log'); o.on.vig = found && !exp ? 'bad' : 1; o.on.saga = found && !exp ? 'bad' : 1; o.on.lpag = 'bad';
          o.rows.vig = act('vigia', 'PRAZO 30 MIN', [found ? 'achou: s-teste, 19:20' : 'procura sagas paradas', found ? 'bad' : 'dim']);
          o.rows.saga = sagaD(exp ? 'CANCELADO' : 'COBRANDO', 0, exp ? 'acc' : found ? 'bad' : 'hi', 's-teste', exp ? 'prazo vencido' : 'desde 19:20');
          o.rows.lpag = act('pagamentos', 'PSP · PIX', ['webhook perdido', 'bad'], ['nenhum evento chega', 'dim']);
          o.rows.orq = act('orquestrador', 'SAGA s-teste', [exp ? 'prazo vencido: cancela' : 'nenhum evento chega', exp ? 'acc' : 'bad'], [exp ? 'nada a estornar' : 'estado COBRANDO', 'dim']); if (exp) lit(o, 'orq');
          o.rows.log = logD(7);
          beam(o, CL.vig, a > 0 && a < 1); beam(o, CL.pag, false, 'bad'); pk(o, CL.vig, a, 'parada há 30 min?');
          if (found) T(o, TF(420), exp ? 's-teste: CANCELADO' : 's-teste parada desde 19:20', exp ? 'acc' : 'bad');
          o.cnt = [['PARADA DESDE', found ? '19:20' : '…', 'bad'], ['PRAZO', '30 min', 'dim'], ['SAGAS ACHADAS', found ? '1' : '0', 'dim']];
          o.res = exp ? [['s-teste: COBRANDO → CANCELADO', 'acc'], ['a expiração é uma compensação', 'acc']] : found ? [['COBRANDO para sempre', 'bad']] : []; } },
    ],
    'estorno-falha': [
      { id: 'ordem', dur: 6, title: 'Falhou no estoque: desfaz na ordem inversa', yk: 'OS PARES DA LOJA',
        code: ['CriarPedido      / CancelarPedido', 'CobrarPedido     / EstornarCobranca', 'ReservarEstoque  / LiberarEstoque', 'AgendarEntrega   / CancelarEntrega', 'falhou no estoque → estornar, cancelar (2)'],
        story: 'O 1057 cobrou e depois tentou reservar. A reserva falhou, então só se desfaz o que <b>aconteceu</b>, de trás para a frente: <code>EstornarCobranca c-7732</code> e <code>CancelarPedido</code>, <b>2 compensações</b>. A reserva nunca existiu: não há <code>LiberarEstoque</code>. Se a falha fosse na entrega (na ordem do laboratório), seriam 3: estornar, liberar e cancelar.',
        look: 'Os dois cabos que vão desfazer acendem, com a ordem escrita: primeiro o do PSP, depois o do pedidos.',
        key: 'Ordem inversa, e só do que aconteceu.',
        f(o, t) { const a = t > 0.6, b = t > 1.6; lit(o, 'orq', 'saga'); if (a) lit(o, 'psp'); if (b) lit(o, 'eped');
          beam(o, CE.psp, a); beam(o, CE.ped, b);
          if (a) T(o, [560, 150, 40], '1º EstornarCobranca', 'acc'); if (b) T(o, [280, 210, 40], '2º CancelarPedido', 'acc');
          o.cnt = [['COMPENSAÇÕES', b ? '2' : a ? '1' : '…'], ['ONDE FALHOU', 'estoque', 'dim'], ['ESTADO', 'COMPENSANDO', 'dim']];
          o.res = b ? [['estornar, depois cancelar', 'acc'], ['nada a liberar: não houve reserva', 'acc']] : []; } },
      { id: '503', dur: 6, title: '20:15:41.300: o PSP responde 503', yk: 'A PRIMEIRA TENTATIVA',
        code: ['ESTORNANDO: manda EstornarCobranca', '  cobrança c-7732, R$ 58,00', '  chave de idempotência: estorno-c-7732', 'PSP → 503 (fora do ar)', 'o dinheiro do Davi segue com a loja'],
        story: 'A saga vai a <code>ESTORNANDO</code> e manda <code>EstornarCobranca</code> com a chave <code>estorno-c-7732</code>. O PSP está fora e responde <b>503</b>. A compensação também falha: o dinheiro do Davi continua com a loja.',
        look: 'O comando vai ao PSP e volta em vermelho; a primeira célula da fita de tentativas fica vermelha.',
        key: 'A compensação também pode falhar.',
        f(o, t) { const a = go_(t, 0.5, 1.5), b = go_(t, 1.7, 2.6), bad = b >= 1; lit(o, 'orq', 'saga'); o.on.psp = bad ? 'bad' : a > 0 ? 1 : 0;
          o.rows.saga = sagaD('ESTORNANDO', 6); o.rows.orq = act('orquestrador', 'SAGA s-1057', ['ESTORNANDO', 'acc'], [bad ? 'resposta: 503' : 'manda o estorno', bad ? 'bad' : 'dim']);
          o.rows.psp.tape = bad ? [[TRY[0], 'bad']] : []; if (bad) o.rows.psp.rows[0] = ['503: fora do ar', 'bad'];
          beam(o, CE.psp, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, CE.psp, a, 'EstornarCobranca · estorno-c-7732'); pk(o, rev(CE.psp), b, '503', 'bad');
          o.cnt = [['RESPOSTA', bad ? '503' : '…', 'bad'], ['TENTATIVA', '1ª', 'dim'], ['RELÓGIO', '20:15:41.300', 'dim']];
          o.res = bad ? [['o estorno não passou', 'bad']] : []; } },
      { id: 'chave', dur: 7, title: 'Se o PSP volta no meio: a chave estorna uma vez', yk: 'IDEMPOTENTE POR CHAVE',
        code: ['repetição 1 (+1 s): o PSP estorna,', '  mas a resposta se perde', 'repetição 2 (+2 s): mesma chave estorno-c-7732', '  → o PSP devolve o estorno que já fez', 'sem a chave: R$ 116,00 ao Davi'],
        story: 'Repetir só é seguro se o desfazer for <b>idempotente</b>. Suponha que o PSP volte na primeira repetição: ele estorna, mas a resposta se perde, e a saga repete. Como o comando leva a mesma chave <code>estorno-c-7732</code>, o PSP reconhece o pedido e devolve o estorno que já fez. O Davi recebe <b>R$ 58,00 uma vez</b>. Sem a chave, repetir por segurança devolveria <b>R$ 116,00</b>.',
        look: 'A fita mostra a 1ª tentativa vermelha e as duas repetições acesas; o contador de estornos fica em 1.',
        key: 'A chave faz a repetição estornar uma vez só.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.3, 1.9), c = go_(t, 2.3, 3.1), d = go_(t, 3.3, 4.1), done = d >= 1; lit(o, 'orq', 'saga'); if (a > 0) lit(o, 'psp');
          o.rows.saga = sagaD(done ? 'CANCELADO' : 'ESTORNANDO', done ? 7 : 6);
          o.rows.orq = act('orquestrador', 'SAGA s-1057', [done ? 'estorno confirmado' : c > 0 ? 'repete: mesma chave' : 'repete depois de 1 s', 'acc'], [b > 0 && c <= 0 ? 'sem resposta' : '', 'bad']);
          o.rows.psp.rows[0] = [a >= 1 ? 'estornou R$ 58,00' : 'cobrou R$ 58,00', a >= 1 ? 'acc' : 'hi'];
          o.rows.psp.rows[1] = [c >= 1 ? 'chave já vista: o mesmo' : 'chave estorno-c-7732', c >= 1 ? 'acc' : 'dim'];
          o.rows.psp.tape = [[TRY[0], 'bad'], ...(a >= 1 ? [[TRY[1], 'ok']] : []), ...(c >= 1 ? [[TRY[2], 'ok']] : [])];
          beam(o, CE.psp, (a > 0 && a < 1) || (c > 0 && c < 1) || (d > 0 && d < 1));
          pk(o, CE.psp, a, 'estorno-c-7732'); pk(o, rev(CE.psp), b < 1 ? b * 0.5 : 0, 'resposta perdida', 'bad');
          pk(o, CE.psp, c, 'estorno-c-7732 (de novo)'); pk(o, rev(CE.psp), d, 'já estornado · e-1904');
          o.cnt = [['ESTORNOS', a >= 1 ? '1 (R$ 58,00)' : '0'], ['SEM A CHAVE', c >= 1 ? 'R$ 116,00' : '…', 'bad'], ['CHAVE', 'estorno-c-7732', 'dim']];
          o.res = done ? [['repetiu e estornou uma vez', 'acc']] : []; } },
      { id: 'backoff', dur: 9, title: 'Se o PSP não volta: 1, 2, 4, 8 e 16 s', yk: 'BACKOFF',
        code: ['1ª tentativa → 503', 'espera 1 s → 503 · 2 s → 503 · 4 s → 503', 'espera 8 s → 503 · 16 s → 503', '1 + 2 + 4 + 8 + 16 = 31 s', 'cada tentativa leva a chave estorno-c-7732'],
        story: 'Agora o PSP não volta. A saga repete com <b>backoff</b>: espera 1, 2, 4, 8 e 16 s entre as tentativas, a espera dobrando a cada vez. São <b>5 repetições</b> (6 tentativas com a primeira) e <b>31 s</b> de espera somada. Todas recebem 503. Como a chave é sempre <code>estorno-c-7732</code>, nenhuma delas estornaria duas vezes se o PSP voltasse no meio.',
        look: 'A fita do PSP se enche de células vermelhas, uma por tentativa, e o mostrador soma as esperas até 31 s.',
        key: 'Repetível, mas finita: 31 s e depois outra coisa.',
        f(o, t) { const k = Math.min(6, 1 + Math.floor(lin(t, 0.3, 6.3, 0, 5.999))), pulse = (t % 1) < 0.5; lit(o, 'orq', 'saga'); o.on.psp = 'bad';
          o.rows.saga = sagaD('ESTORNANDO', 6); o.rows.orq = act('orquestrador', 'SAGA s-1057', [`tentativa ${k} de 6`, 'acc'], ['resposta: 503', 'bad']);
          o.rows.psp.rows[0] = ['503 a cada tentativa', 'bad']; o.rows.psp.tape = TRY.slice(0, k).map(l => [l, 'bad']);
          beam(o, CE.psp, pulse, 'bad');
          o.cnt = [['ESPERA SOMADA', `${CUM[k - 1]} s`], ['TENTATIVAS', `${k} de 6`, 'dim'], ['RESPOSTA', '503', 'bad']];
          o.res = k === 6 ? [['31 s e ainda 503', 'bad']] : []; } },
      { id: 'intervencao', dur: 8, title: 'E se der errado: INTERVENCAO e o alerta', yk: 'O ALERTA',
        code: ['ESTORNANDO + estorno esgotou as tentativas', '  → INTERVENCAO', 'alerta: saga s-1057 · cobrança c-7732', '        R$ 58,00 · motivo sem_estoque', 'uma pessoa resolve'],
        story: 'A quinta repetição também recebe 503. A saga para de tentar e vai para <code>INTERVENCAO</code>, o único estado final que <b>chama gente</b>, com um alerta e todos os dados: saga <code>s-1057</code>, cobrança <code>c-7732</code>, R$ 58,00, motivo <code>sem_estoque</code>. A Microsoft diz que a mão humana é às vezes o único jeito. E há o que nenhuma compensação desfaz: a taxa do PSP pode não voltar, e um e-mail enviado não se apaga (manda-se outro).',
        look: 'O orquestrador e a tabela saga ficam vermelhos em INTERVENCAO; o alerta anda até o plantão, que acende com os dados do caso.',
        key: 'Quando o desfazer não passa, a saga chama gente.',
        f(o, t) { const a = go_(t, 0.8, 1.8), got = a >= 1; o.on.orq = 'bad'; o.on.saga = 'bad'; o.on.psp = 'bad'; if (got) lit(o, 'gente');
          o.rows.saga = sagaD('INTERVENCAO', 7, 'bad'); o.rows.orq = act('orquestrador', 'SAGA s-1057', ['INTERVENCAO', 'bad'], ['6 tentativas, 31 s', 'dim']);
          o.rows.psp.rows[0] = ['503 a cada tentativa', 'bad']; o.rows.psp.tape = TRY.map(l => [l, 'bad']);
          o.rows.gente = act('plantão', 'GENTE', [got ? 'ALERTA: estorno falhou' : 'nenhum alerta', got ? 'bad' : 'dim'], got ? ['saga s-1057', 'hi'] : null, got ? ['cobrança c-7732', 'hi'] : null,
            got ? ['R$ 58,00', 'hi'] : null, got ? ['motivo sem_estoque', 'hi'] : null);
          beam(o, CE.gente, a > 0 && a < 1, 'bad'); beam(o, CE.psp, false, 'bad'); pk(o, CE.gente, a, 'alerta', 'bad');
          if (got) T(o, TF(735), 'INTERVENCAO: chama gente', 'bad');
          o.cnt = [['ESTADO', 'INTERVENCAO', 'bad'], ['TENTATIVAS', '6 (31 s)', 'dim'], ['QUEM RESOLVE', got ? 'uma pessoa' : '…', 'dim']];
          o.res = got ? [['o único final que chama gente', 'bad']] : []; } },
    ],
    'dual-write': [
      { id: 'duas', dur: 6, title: 'Duas escritas: gravar RESERVANDO e mandar o comando', yk: 'A ESCRITA DUPLA',
        code: ['1. UPDATE saga SET estado = \'RESERVANDO\'  → banco', '2. ReservarEstoque → estoque-commands     → Kafka', 'banco e Kafka: transações separadas', 'nada amarra uma escrita à outra'],
        story: 'O <code>PedidoPago</code> chegou e a saga do 1057 precisa avançar: gravar <code>RESERVANDO</code> no banco e mandar <code>ReservarEstoque</code> ao tópico <code>estoque-commands</code>. O banco e o Kafka não participam da mesma transação: uma escrita pode acontecer sem a outra. Desta vez as duas dão certo.',
        look: 'Do orquestrador saem dois cabos: um para o banco, à esquerda, e outro para o Kafka, à direita. O comando chega ao estoque, que reserva 1.',
        key: 'Gravar o estado e mandar o comando são duas escritas.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.4), c = go_(t, 2.6, 3.2); delete o.show.drel; lit(o, 'orq'); if (a >= 1) lit(o, 'ddb'); if (b >= 1) lit(o, 'dkaf'); if (c >= 1) lit(o, 'dest');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', ['grava e manda', 'acc'], ['duas escritas', 'dim']);
          o.rows.ddb.rows[1] = ['estado ' + (a >= 1 ? 'RESERVANDO' : 'PAGO'), a >= 1 ? 'acc' : 'hi'];
          o.rows.dkaf.tape = b >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservas da s-1057: ' + (c >= 1 ? 1 : 0), c >= 1 ? 'acc' : 'hi'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, b > 0 && b < 1); beam(o, CD.est, c > 0 && c < 1);
          pk(o, CD.db, a, 'RESERVANDO'); pk(o, CD.kaf, b, 'ReservarEstoque'); pk(o, CD.est, c, '');
          o.cnt = [['ESCRITAS', '2 lugares'], ['RESERVAS DA s-1057', c >= 1 ? '1' : '0', 'dim'], ['ATÔMICO?', 'não', 'bad']];
          o.res = c >= 1 ? [['deu certo, desta vez', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'O comando sai e o orquestrador cai antes de gravar', yk: 'O LABORATÓRIO (LIDO, NÃO EXECUTADO)',
        code: ['processReply, resposta de pedidos-reply:', '  linha 346: envia RESERVE_STOCK ao estoque', '  … o processo cai aqui …', '  linha 391: saveEvent (grava o estado)', 'no banco, a última linha ainda diz PAGO'],
        story: 'É a ordem do laboratório do autor: no <code>processReply</code>, a <b>linha 346</b> envia <code>RESERVE_STOCK</code> e só a <b>linha 391</b> grava o estado novo. O orquestrador cai entre as duas. O comando já saiu: o <code>estoque</code> reserva. No banco, a última linha ainda diz <code>PAGO</code>, e ninguém sabe que o passo foi feito.',
        look: 'O comando vai ao Kafka; o orquestrador fica vermelho antes de chegar ao banco, que continua em PAGO, em vermelho. O estoque reserva 1.',
        key: 'Entre mandar e gravar há uma janela, e uma queda nela faz o banco mentir.',
        f(o, t) { const a = go_(t, 0.4, 1.4), down = t > 1.6, c = go_(t, 1.8, 2.4); delete o.show.drel; o.on.orq = down ? 'bad' : 1; if (a >= 1) lit(o, 'dkaf'); if (c >= 1) lit(o, 'dest'); if (down) o.on.ddb = 'bad';
          o.rows.orq = act('orquestrador', down ? 'CAIU' : 'SAGA s-1057', [down ? 'caiu antes da linha 391' : 'linha 346: envia', down ? 'bad' : 'acc']);
          o.rows.ddb.rows[1] = ['estado PAGO', down ? 'bad' : 'hi'];
          o.rows.dkaf.tape = a >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservas da s-1057: ' + (c >= 1 ? 1 : 0), c >= 1 ? 'acc' : 'hi'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.kaf, a > 0 && a < 1); beam(o, CD.db, false, down ? 'bad' : ''); beam(o, CD.est, c > 0 && c < 1);
          pk(o, CD.kaf, a, 'RESERVE_STOCK'); pk(o, CD.est, c, '');
          if (down) T(o, TF(300), 'caiu entre a 346 e a 391', 'bad');
          o.cnt = [['NO BANCO', 'PAGO', down ? 'bad' : 'dim'], ['RESERVAS DA s-1057', c >= 1 ? '1' : '0', 'dim'], ['ORQUESTRADOR', down ? 'caiu' : 'no ar', down ? 'bad' : 'dim']];
          o.res = c >= 1 ? [['o estoque reservou;', 'acc'], ['o banco não sabe', 'bad']] : []; } },
      { id: 'repete', dur: 7, title: 'Ao voltar, lê PAGO e manda de novo', yk: 'O COMANDO DUPLICADO',
        code: ['o orquestrador volta e lê a última linha: PAGO', '→ manda ReservarEstoque de novo', 'consumidor em OffsetNewest (linha 194)', 'command_id e reply_id não são conferidos', '→ o estoque reserva duas vezes'],
        story: 'O orquestrador volta e lê a última linha: <code>PAGO</code>. Para ele, falta reservar, e ele manda <code>ReservarEstoque</code> <b>de novo</b>. O laboratório não confere <code>command_id</code> nem <code>reply_id</code> em lugar nenhum, então a repetição passa direto: o <code>estoque</code> reserva <b>duas vezes</b> para a mesma saga.',
        look: 'O orquestrador acende de novo, lê PAGO no banco e manda um segundo comando. O estoque fica vermelho com 2 reservas.',
        key: 'O passo feito sem registro volta como passo repetido.',
        f(o, t) { const a = go_(t, 0.5, 1.3), b = go_(t, 1.6, 2.6), c = go_(t, 2.8, 3.4), dup = c >= 1; delete o.show.drel; lit(o, 'orq', 'dkaf'); if (dup) o.on.dest = 'bad'; else lit(o, 'dest');
          o.rows.orq = act('orquestrador', 'VOLTOU', [a >= 1 ? 'lê PAGO: falta reservar' : 'lê a última linha', 'acc']);
          o.rows.ddb.rows[1] = ['estado PAGO', 'hi']; if (a > 0 && a < 1) lit(o, 'ddb');
          o.rows.dkaf.tape = [['ReservarEstoque', 'ok'], ...(b >= 1 ? [['de novo', 'bad']] : [])];
          o.rows.dest.rows[0] = ['reservas da s-1057: ' + (dup ? 2 : 1), dup ? 'bad' : 'acc'];
          o.rows.dest.rows[1] = [dup ? 'command_id não conferido' : '', 'bad'];
          o.beams = o.beams.filter(x => x.pts !== CD.rdb && x.pts !== CD.rkaf);
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, b > 0 && b < 1); beam(o, CD.est, c > 0 && c < 1, 'bad');
          pk(o, rev(CD.db), a, 'lê PAGO'); pk(o, CD.kaf, b, 'ReservarEstoque (de novo)', 'bad'); pk(o, CD.est, c, '', 'bad');
          if (dup) T(o, TF(735), 'reservou duas vezes', 'bad');
          o.cnt = [['RESERVAS DA s-1057', dup ? '2' : '1', dup ? 'bad' : ''], ['COMANDOS', b >= 1 ? '2' : '1', 'dim'], ['command_id', 'não conferido', 'bad']];
          o.res = dup ? [['o estoque reservou duas vezes', 'bad']] : []; } },
      { id: 'outbox', dur: 7, title: 'Com outbox: o passo e a mensagem num COMMIT', yk: 'A OUTBOX DENTRO DA SAGA (EXEMPLO)',
        code: ['BEGIN;', "  UPDATE saga SET estado = 'RESERVANDO' … WHERE estado = 'PAGO';", "  INSERT INTO outbox (destino, tipo, payload)", "  VALUES ('estoque-commands', 'ReservarEstoque', …);", 'COMMIT;   -- os dois entram, ou nenhum'],
        story: 'Com a <b>outbox</b>, a saga grava o passo e a mensagem na <b>mesma transação</b>: o <code>UPDATE</code> do estado e o <code>INSERT</code> na tabela <code>outbox</code> entram juntos ou não entram. O orquestrador não fala mais com o Kafka: um <b>relay</b> lê a outbox e envia. Se o orquestrador cair depois do <code>COMMIT</code>, tanto faz: o comando sai mesmo assim.',
        look: 'O relay sobe à esquerda. Um cabo só sai do orquestrador, para o banco, onde o estado e a linha da outbox acendem juntos; depois o orquestrador cai, e o relay leva o comando ao estoque.',
        key: 'Outbox: o comando nasce na mesma transação que o estado.',
        f(o, t) { const a = go_(t, 0.4, 1.4), ok = a >= 1, down = t > 1.8, b = go_(t, 2.1, 2.5), c = go_(t, 2.7, 3.8), d = go_(t, 4.0, 4.5);
          o.on.orq = down ? 'bad' : 1; if (ok) lit(o, 'ddb'); if (b > 0) lit(o, 'drel'); if (c >= 1) lit(o, 'dkaf'); if (d >= 1) lit(o, 'dest');
          o.rows.orq = act('orquestrador', down ? 'CAIU' : 'SAGA s-1057', [down ? 'caiu: tanto faz' : 'BEGIN … COMMIT', down ? 'bad' : 'acc']);
          o.rows.ddb.rows[1] = ['estado ' + (ok ? 'RESERVANDO' : 'PAGO'), ok ? 'acc' : 'hi'];
          o.rows.ddb.tape = ok ? [[c >= 1 ? 'enviada' : 'ReservarEstoque', c >= 1 ? 'none' : 'ok']] : [];
          o.rows.drel = act('relay', 'LÊ A OUTBOX', [c >= 1 ? 'enviou ReservarEstoque' : b > 0 ? 'achou 1 linha' : 'manda ao Kafka', b > 0 ? 'acc' : 'dim']);
          o.rows.dkaf.tape = c >= 1 ? [['ReservarEstoque', 'ok']] : [];
          o.rows.dest.rows[0] = ['reservas da s-1057: ' + (d >= 1 ? 1 : 0), d >= 1 ? 'acc' : 'hi'];
          beam(o, CD.db, a > 0 && a < 1); beam(o, CD.kaf, false); beam(o, CD.rdb, b > 0 && b < 1); beam(o, CD.rkaf, c > 0 && c < 1); beam(o, CD.est, d > 0 && d < 1);
          pk(o, CD.db, a, 'BEGIN … COMMIT'); pk(o, rev(CD.rdb), b, ''); pk(o, CD.rkaf, c, 'ReservarEstoque'); pk(o, CD.est, d, '');
          o.cnt = [['LINHAS NO COMMIT', ok ? '2' : '…'], ['RESERVAS DA s-1057', d >= 1 ? '1' : '0', 'dim'], ['ORQUESTRADOR', down ? 'caiu' : 'no ar', down ? 'bad' : 'dim']];
          o.res = d >= 1 ? [['o estado e o comando, juntos', 'acc']] : ok ? [['os dois entraram', 'acc']] : []; } },
      { id: 'relay', dur: 8, title: 'E se der errado: o relay publica e cai antes de marcar', yk: 'PELO MENOS UMA VEZ',
        code: ['relay: manda ReservarEstoque ao Kafka', '       cai antes de marcar a linha como enviada', 'ao voltar: manda de novo', 'estoque: guarda o command_id', '  o mesmo id → devolve o resultado que já deu'],
        story: 'O relay manda o <code>ReservarEstoque</code> e <b>cai antes de marcar</b> a linha como enviada. Ao voltar, envia de novo: a entrega é <b>pelo menos uma vez</b>, e o comando sai duas vezes. Por isso quem recebe é idempotente: o <code>estoque</code> guarda o <code>command_id</code> e, ao ver o mesmo, responde o resultado que já deu, sem reservar outra vez. A outbox troca "perder" por "repetir".',
        look: 'O comando sai do relay, que fica vermelho; ele volta e manda o mesmo comando. No estoque, a segunda célula do command_id aparece riscada e as reservas ficam em 1.',
        key: 'A outbox garante "pelo menos uma vez"; o command_id evita o efeito duplo.',
        f(o, t) { const a = go_(t, 0.4, 1.3), a2 = go_(t, 1.4, 1.9), down = t > 2.0 && t < 2.8, b = go_(t, 3.0, 3.9), b2 = go_(t, 4.0, 4.5), seen = b2 >= 1;
          lit(o, 'ddb'); o.on.drel = down ? 'bad' : 1; if (a >= 1) lit(o, 'dkaf'); if (a2 >= 1) lit(o, 'dest');
          o.rows.orq = act('orquestrador', 'SAGA s-1057', ['estado RESERVANDO', 'dim']);
          o.rows.ddb.rows[1] = ['estado RESERVANDO', 'acc']; o.rows.ddb.tape = [['não marcada', t > 2.0 ? 'bad' : 'ok']];
          o.rows.drel = act('relay', down ? 'CAIU' : 'LÊ A OUTBOX', [down ? 'caiu antes de marcar' : b > 0 ? 'manda de novo' : 'mandou', down ? 'bad' : 'acc']);
          o.rows.dkaf.tape = [...(a >= 1 ? [['ReservarEstoque', 'ok']] : []), ...(b >= 1 ? [['de novo', 'ok']] : [])];
          o.rows.dest.rows[0] = ['reservas da s-1057: ' + (a2 >= 1 ? 1 : 0), a2 >= 1 ? 'acc' : 'hi'];
          o.rows.dest.rows[1] = [seen ? 'mesmo id: o resultado de antes' : '', 'acc'];
          o.rows.dest.tape = [...(a2 >= 1 ? [['id A', 'ok']] : []), ...(seen ? [['id A de novo', 'off']] : [])];
          beam(o, CD.rkaf, (a > 0 && a < 1) || (b > 0 && b < 1), down ? 'bad' : ''); beam(o, CD.est, (a2 > 0 && a2 < 1) || (b2 > 0 && b2 < 1));
          pk(o, CD.rkaf, a, 'ReservarEstoque'); pk(o, CD.est, a2, ''); pk(o, CD.rkaf, b, 'o mesmo comando'); pk(o, CD.est, b2, '');
          if (seen) T(o, TF(735), 'saiu 2 vezes, reservou 1', 'acc');
          o.cnt = [['RESERVAS DA s-1057', a2 >= 1 ? '1' : '0'], ['COMANDOS ENTREGUES', b2 >= 1 ? '2' : a2 >= 1 ? '1' : '0', 'dim'], ['ENTREGA', 'pelo menos 1 vez', 'dim']];
          o.res = seen ? [['o mesmo command_id: ignorado', 'acc'], ['perder virou repetir', 'acc']] : []; } },
    ],
    'reserva-antes': [
      { id: 'cobrar', dur: 7, title: 'Cobrar antes (a loja): 44,95 s e um estorno', yk: 'A ORDEM DA LOJA',
        code: ['20:15:00.000  NOVO', '20:15:00.050  COBRANDO (Pix c-7732)', '20:15:41.200  PAGO: o Davi viu R$ 58,00 sair', '20:15:41.260  sem estoque → COMPENSANDO', '20:15:44.950  CANCELADO: o estorno volta'],
        story: 'Na ordem da loja (módulo 6), a saga <b>cobra antes de reservar</b>. O 1057 espera o Pix por 41,2 s, o Davi vê <b>R$ 58,00 saírem</b>, só então a reserva falha, e o estorno devolve o dinheiro 3,7 s depois. Do <code>NOVO</code> ao <code>CANCELADO</code>: <b>44,95 s</b>, com 1 estorno e a taxa do PSP no meio.',
        look: 'A trilha de cima se acende etapa por etapa enquanto o relógio corre até 44,95 s; o app do Davi mostra o dinheiro sair e voltar.',
        key: 'Cobrar primeiro faz a falha de estoque virar estorno.',
        f(o, t) { const s = lin(t, 0.3, 4.8, 0, 44.95), paid = s >= 41.2, back = s >= 44.95; lit(o, 'ra'); if (paid) o.on.rdav = back ? 1 : 'bad';
          o.rows.ra.tape = trackA(s); o.rows.ra.rows[0] = [back ? 'CANCELADO em 44,95 s' : `${dec(s, 2)} s`, back ? 'acc' : 'hi'];
          o.rows.rdav = act('app do Davi', 'PIX', [back ? '+ R$ 58,00 de volta' : paid ? '− R$ 58,00' : 'espera para pagar', back ? 'acc' : paid ? 'bad' : 'dim'], [back ? 'estorno e-1904' : paid ? 'cobrança c-7732' : '', 'dim']);
          beam(o, CR.dav, paid, back ? '' : 'bad');
          o.cnt = [['TEMPO ATÉ CANCELADO', `${dec(s, 2)} s`], ['ESTORNOS', back ? '1 (R$ 58,00)' : '0', 'dim'], ['ESPERA DO DAVI', '41,2 s', 'dim']];
          o.res = back ? [['44,95 s e 1 estorno', 'acc'], ['o Davi viu o dinheiro sair', 'bad']] : []; } },
      { id: 'reservar', dur: 6, title: 'Reservar antes (o laboratório): ~100 ms, sem cobrança', yk: 'A ORDEM DO LABORATÓRIO',
        code: ['20:15:00.000  NOVO', '20:15:00.1    RESERVANDO falha: sem estoque', '              → CANCELADO', 'nenhuma cobrança, nenhum estorno', 'é a ordem do repositório do autor'],
        story: 'Com a ordem trocada, como no laboratório do autor, a saga <b>reserva antes de cobrar</b>. A reserva do 1057 falha às 20:15:00.1 e a saga vai a <code>CANCELADO</code> em cerca de <b>100 ms</b>, <b>sem cobrança e sem estorno</b>. O Davi nem chega a abrir o app do banco.',
        look: 'A trilha de baixo vai de NOVO a CANCELADO num instante; o app do Davi não muda.',
        key: 'O que é difícil de desfazer vai por último.',
        f(o, t) { const ms = lin(t, 0.3, 2.3, 0, 100), done = ms >= 100; lit(o, 'rb', 'rdav');
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = ['CANCELADO em 44,95 s', 'dim'];
          o.rows.rb.tape = trackB(ms); o.rows.rb.rows[0] = [done ? 'CANCELADO em ~100 ms' : `${Math.round(ms)} ms`, done ? 'acc' : 'hi'];
          o.rows.rdav = act('app do Davi', 'PIX', ['nenhuma cobrança', 'acc'], ['saldo: sem mudança', 'dim']);
          o.cnt = [['TEMPO ATÉ CANCELADO', done ? '~100 ms' : `${Math.round(ms)} ms`], ['ESTORNOS', '0', 'dim'], ['COBRANÇA', 'nenhuma', 'dim']];
          o.res = done ? [['~100 ms, sem estorno', 'acc']] : []; } },
      { id: 'lado', dur: 7, title: 'Lado a lado: os mesmos 10%, 2,0 estornos × 0', yk: 'A CADA 20 PEDIDOS',
        code: ['falha de estoque: 10% (2,0 de 20)', 'cobrar antes:   2,0 estornos a cada 20', 'reservar antes: 0 estornos', 'tempo do 1057:  44,95 s × ~100 ms', '(com os 5% do pagamento antes, a conta exata dá 1,9)'],
        story: 'Os mesmos <b>10%</b> de falha de estoque custam coisas diferentes nas duas ordens. Na da loja, viram <b>2,0 estornos a cada 20 pedidos</b>: dinheiro que sai e volta, uma taxa possível e um cliente que viu o saldo cair. Na do laboratório, <b>nenhum</b>. (Com os 5% de falha do pagamento vindo antes, a conta exata é 1,9.)',
        look: 'As duas trilhas ficam completas, lado a lado; os contadores somam 20 pedidos e os estornos de cada ordem.',
        key: 'A ordem dos passos decide quanto se compensa.',
        f(o, t) { const n = Math.round(lin(t, 0.4, 4.4, 0, 20)); lit(o, 'ra', 'rb');
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = [`estornos: ${dec(n * 0.1)}`, 'acc'];
          o.rows.rb.tape = trackB(1000); o.rows.rb.rows[0] = ['estornos: 0', 'acc'];
          o.cnt = [['PEDIDOS', String(n)], ['ESTORNOS (LOJA)', dec(n * 0.1), 'dim'], ['ESTORNOS (LAB)', '0', 'dim']];
          o.res = n >= 20 ? [['2,0 estornos × 0', 'acc'], ['44,95 s × ~100 ms', 'acc']] : []; } },
      { id: 'presa', dur: 8, title: 'E se der errado: 3.600 unidades presas', yk: 'A RESERVA PRESA (EXEMPLO)',
        code: ['30 pedidos/s × 20% que desistem do Pix', '× 600 s (reserva de 10 min)', '= 3.600 unidades reservadas e não vendidas', 'por isso a reserva tem prazo:', 'a expiração é uma compensação (LiberarEstoque)'],
        story: 'Reservar antes troca o estorno por outra dívida: enquanto o cliente decide pagar o Pix, a unidade fica <b>reservada e não vendida</b>. Se <b>20%</b> desistem e a reserva dura <b>10 min</b>, a 30 pedidos/s ficam 30 × 0,2 × 600 = <b>3.600 unidades</b> presas (exemplo). Por isso a reserva tem prazo, e a expiração é uma compensação: a vigia libera a reserva que ninguém pagou.',
        look: 'O cabo da trilha de baixo leva reservas para o bloco da direita, e a barra enche até 3.600.',
        key: 'Reservar antes evita o estorno e cria a reserva presa.',
        f(o, t) { const u = lin(t, 0.4, 4.6, 0, 3600), full = u >= 3600; lit(o, 'rb'); o.on.rpre = full ? 'bad' : 1;
          o.rows.ra.tape = trackA(99); o.rows.ra.rows[0] = ['estorno em vez de reserva presa', 'dim'];
          o.rows.rb.tape = trackB(1000); o.rows.rb.rows[0] = ['reserva presa enquanto o cliente paga', 'bad'];
          o.rows.rpre.bar = [u / 3600 * 0.92, full ? 'bad' : 'acc', `${thou(u)} unidades presas`];
          o.rows.rpre.rows[1] = [full ? 'prazo: a vigia libera' : 'reserva dura 10 min', full ? 'acc' : 'dim'];
          o.beams = [{ pts: CR.dav }, { pts: CR.pre, on: !full, flow: !full, tone: full ? 'bad' : '' }];
          if (full) T(o, TF(735), '3.600 unidades paradas', 'bad');
          o.cnt = [['UNIDADES PRESAS', thou(u), full ? 'bad' : ''], ['DESISTÊNCIA', '20%', 'dim'], ['PRAZO DA RESERVA', '10 min', 'dim']];
          o.res = full ? [['30 × 0,2 × 600 = 3.600', 'bad'], ['a expiração é uma compensação', 'acc']] : []; } },
    ],
    lab: [
      { id: 'pecas', dur: 5, title: 'O laboratório: 5 serviços, 5 bancos, Kafka', yk: 'O REPOSITÓRIO (LIDO, NÃO EXECUTADO)',
        code: ['Go 1.23 · Kafka (KRaft) · 5 PostgreSQL', 'orquestrador, pedidos, estoque, pagamentos, entregas', 'tópicos <serviço>-commands e <serviço>-reply', 'simulador: 1 pedido, 20 pedidos, N, monitor', 'só existe a versão orquestrada'],
        story: 'O laboratório público do autor tem <b>5 serviços</b> (<code>orquestrador</code>, <code>pedidos</code>, <code>estoque</code>, <code>pagamentos</code>, <code>entregas</code>), <b>5 bancos</b> PostgreSQL, um por serviço, e o Kafka. Cada serviço tem um tópico de comando e outro de resposta (<code>pagamentos-commands</code> / <code>pagamentos-reply</code>). Um simulador manda 1 pedido, 20 ou N. Só há a versão orquestrada. O que a figura diz dele vem da <b>leitura do código</b>: o laboratório não foi executado.',
        look: 'O orquestrador no meio, o simulador à esquerda e os quatro serviços à direita, cada um com o seu par de tópicos.',
        key: 'Um laboratório se lê como um relatório.',
        f(o, t) { lit(o, 'orq', 'sim', 'bped', 'best', 'bpag', 'bent');
          o.rows.orq = act('orquestrador', 'saga_events', ['máquina de estados', 'acc'], ['PENDING → … → COMPLETED', 'dim'], ['+ COMPENSATING, FAILED', 'dim']);
          o.cnt = [['SERVIÇOS', '5'], ['BANCOS', '5 PostgreSQL', 'dim'], ['VERSÃO', 'orquestrada', 'dim']];
          o.res = [['lido no código, não executado', 'acc']]; } },
      { id: 'sucesso', dur: 7, title: 'Um pedido: reserva, depois cobra', yk: 'O FLUXO DE SUCESSO',
        code: ['VALIDATE_ORDER    → pedidos', 'RESERVE_STOCK     → estoque', 'PROCESS_PAYMENT   → pagamentos', 'SCHEDULE_DELIVERY → entregas', '→ COMPLETED'],
        story: 'O fluxo de sucesso do laboratório: <code>VALIDATE_ORDER → RESERVE_STOCK → PROCESS_PAYMENT → SCHEDULE_DELIVERY → COMPLETED</code>. Repare na ordem: ele <b>reserva o estoque antes de cobrar</b>, o contrário da loja. Os estados gravados em <code>saga_events</code> vão de <code>PENDING</code> a <code>COMPLETED</code>.',
        look: 'O comando vai a cada serviço, um de cada vez, e a resposta volta; o estado do orquestrador avança a cada resposta.',
        key: 'No laboratório, o estoque vem antes do pagamento.',
        f(o, t) { const K = [['bped', CB.ped, 'VALIDATE_ORDER'], ['best', CB.est, 'RESERVE_STOCK'], ['bpag', CB.pag, 'PROCESS_PAYMENT'], ['bent', CB.ent, 'SCHEDULE_DELIVERY']]; let n = 0;
          lit(o, 'orq'); K.forEach(([nm, pts, cmd], k) => { const a = go_(t, 0.3 + k * 1.2, 0.8 + k * 1.2), b = go_(t, 0.9 + k * 1.2, 1.4 + k * 1.2);
            if (b >= 1) n++; if (a > 0 && b < 1) lit(o, nm); beam(o, pts, (a > 0 && a < 1) || (b > 0 && b < 1));
            pk(o, pts, a, cmd); pk(o, rev(pts), b, ''); });
          o.rows.orq = act('orquestrador', 'saga_events', [LABST[n], n === 4 ? 'acc' : 'hi'], [`${n} de 4 respostas`, 'dim']);
          o.cnt = [['ESTADO', LABST[n]], ['RESPOSTAS', `${n} de 4`, 'dim'], ['ORDEM', 'reserva, depois cobra', 'dim']];
          o.res = n === 4 ? [['COMPLETED', 'acc']] : []; } },
      { id: 'vinte', dur: 8, title: '20 pedidos: cerca de 17, 2 e 1', yk: 'AS PROBABILIDADES',
        code: ['sucesso:   0,9 × 0,95 = 85,5% → 17,1 de 20', 'estoque:   10%               →  2,0 de 20', 'pagamento: 0,9 × 0,05 = 4,5%  →  0,9 de 20', 'README: ~17–18 completam, ~2 falham', '        no estoque, ~1 no pagamento'],
        story: 'O <code>estoque</code> falha num sorteio de <b>10%</b> e o <code>pagamento</code> num de <b>5%</b>. Como o estoque vem antes, o sucesso é 0,9 × 0,95 = <b>85,5%</b> (17,1 de 20); a falha no estoque, <b>10%</b> (2,0 de 20); a falha no pagamento, 0,9 × 0,05 = <b>4,5%</b> (0,9 de 20), e aí é preciso liberar o estoque. O README resume: com 20 pedidos, cerca de 17 a 18 completam, 2 falham no estoque e 1 no pagamento.',
        look: 'A grade do simulador se preenche com os 20 pedidos: acesos os completos, vermelhos os que falharam, com "est" ou "pag".',
        key: 'As probabilidades fecham: 85,5% + 10% + 4,5% = 100%.',
        f(o, t) { const n = Math.round(lin(t, 0.3, 5.3, 0, 20)), D = OUT20.slice(0, n), ok = D.filter(r => r === 'ok').length, e = D.filter(r => r === 'E').length, p = D.filter(r => r === 'P').length;
          lit(o, 'orq', 'sim'); o.rows.sim.grid = grid(n); o.rows.sim.rows = [['completos ' + ok, 'acc'], ['falhas: est ' + e + ' · pag ' + p, e + p ? 'bad' : 'dim']];
          o.rows.orq = act('orquestrador', 'saga_events', [`${n} de 20 sagas`, 'acc'], ['COMPLETED ' + ok, 'dim'], ['FAILED ' + (e + p), e + p ? 'bad' : 'dim']);
          o.beams = o.beams.map(b => b.pts === CB.sim ? { pts: CB.sim, on: n < 20, flow: n < 20 } : b);
          o.cnt = [['COMPLETOS', String(ok)], ['FALHA NO ESTOQUE', String(e), 'dim'], ['FALHA NO PAGAMENTO', String(p), 'dim']];
          o.res = n >= 20 ? [['17 / 2 / 1', 'acc'], ['esperado: 17,1 / 2,0 / 0,9', 'acc']] : []; } },
      { id: 'falhapag', dur: 8, title: 'Falha no pagamento: libera, cancela, e FAILED antes', yk: 'startCompensation (LIDO)',
        code: ['PROCESS_PAYMENT falha (estado: STOCK_RESERVED)', '→ COMPENSATING', '→ RELEASE_STOCK e CANCEL_ORDER (linhas 420–428)', '→ FAILED gravado já na linha 432', 'CANCEL_PAYMENT não sai: não há o que estornar'],
        story: 'O pagamento falha. O estado gravado ainda é <code>STOCK_RESERVED</code>, então o orquestrador manda <code>RELEASE_STOCK</code> e <code>CANCEL_ORDER</code>; <code>CANCEL_PAYMENT</code> não sai, e faz sentido (não há o que estornar). Mas as linhas 420 a 428 disparam as compensações <b>sem conferir o retorno</b>, e a linha 432 grava <code>FAILED</code> <b>antes de qualquer resposta</b>. No laboratório, <code>FAILED</code> quer dizer "pedi para compensar".',
        look: 'O pagamento volta em vermelho; saem as duas compensações e o orquestrador já mostra FAILED enquanto elas ainda andam pelos cabos.',
        key: 'FAILED não é "compensada"; é "pedi para compensar".',
        f(o, t) { const a = go_(t, 0.3, 0.9), b = go_(t, 1.0, 1.6), c = go_(t, 1.9, 2.9), fail = t > 2.2, r = go_(t, 3.4, 4.2); lit(o, 'orq');
          const st = fail ? 'FAILED' : b >= 1 ? 'COMPENSATING' : 'STOCK_RESERVED'; if (fail) o.on.orq = 'bad';
          if (b > 0) o.on.bpag = 'bad'; if (c > 0) lit(o, 'best', 'bped');
          o.rows.orq = act('orquestrador', 'saga_events', [st, fail ? 'bad' : 'acc'], [fail && r < 1 ? 'nenhuma resposta ainda' : b >= 1 ? 'RELEASE_STOCK, CANCEL_ORDER' : 'PROCESS_PAYMENT', 'dim']);
          o.rows.bpag = act('pagamentos', '+ BANCO', [b > 0 ? 'falhou (sorteio de 5%)' : 'PROCESS_PAYMENT', b > 0 ? 'bad' : 'dim']);
          o.rows.best = act('estoque', '+ BANCO', [c >= 1 ? 'liberou a reserva' : 'reserva feita', c >= 1 ? 'acc' : 'dim']);
          o.rows.bped = act('pedidos', '+ BANCO', [c >= 1 ? 'pedido cancelado' : 'pedido validado', c >= 1 ? 'acc' : 'dim']);
          beam(o, CB.pag, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : ''); beam(o, CB.est, (c > 0 && c < 1) || (r > 0 && r < 1)); beam(o, CB.ped, (c > 0 && c < 1) || (r > 0 && r < 1));
          pk(o, CB.pag, a, 'PROCESS_PAYMENT'); pk(o, rev(CB.pag), b, 'falhou', 'bad'); pk(o, CB.est, c, 'RELEASE_STOCK'); pk(o, CB.ped, c, 'CANCEL_ORDER');
          pk(o, rev(CB.est), r, ''); pk(o, rev(CB.ped), r, '');
          if (fail && r < 1) T(o, TF(), 'FAILED antes das respostas', 'bad');
          o.cnt = [['ESTADO', st, fail ? 'bad' : ''], ['COMPENSAÇÕES', b >= 1 ? '2 (sem esperar)' : '…', 'dim'], ['CANCEL_PAYMENT', 'não sai', 'dim']];
          o.res = fail ? [['FAILED = "pedi para compensar"', 'bad']] : []; } },
      { id: 'ressuscita', dur: 9, title: 'E se der errado: a saga cancelada ressuscita (lido)', yk: 'processReply (LIDO NO CÓDIGO, NÃO EXECUTADO)',
        code: ['CANCEL_ORDER ok   em pedidos-reply → manda RESERVE_STOCK', 'RELEASE_STOCK ok  em estoque-reply → manda PROCESS_PAYMENT', 'avança pelo tópico, sem conferir o estado', '→ pode chegar a COMPLETED: cobra e agenda', 'conserto: command_type + transição condicional'],
        story: '<b>Lido no código, não executado.</b> As respostas das compensações voltam com <code>Success: true</code> pelos mesmos tópicos <code>*-reply</code>, e o <code>processReply</code> avança <b>pelo tópico</b>, sem olhar o estado. A resposta de <code>CANCEL_ORDER</code> em <code>pedidos-reply</code> faz o orquestrador mandar <code>RESERVE_STOCK</code> de novo; a de <code>RELEASE_STOCK</code> em <code>estoque-reply</code> manda <code>PROCESS_PAYMENT</code>. A saga <code>FAILED</code> <b>ressuscita</b> e pode chegar a <code>COMPLETED</code>: cobra e agenda a entrega de um pedido cancelado. O conserto: a resposta leva o <code>command_type</code> e o orquestrador só avança do estado esperado (a transição condicional da aula 6).',
        look: 'A resposta do cancelamento volta do pedidos e, em vez de encerrar, dispara um RESERVE_STOCK vermelho; a da liberação volta do estoque e dispara um PROCESS_PAYMENT vermelho.',
        key: 'Quem avança pelo tópico, e não pelo estado, lê a compensação como avanço.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.3), c = go_(t, 2.6, 3.4), d = go_(t, 3.6, 4.5), up = b > 0;
          o.on.orq = 'bad'; if (a > 0) lit(o, 'bped'); if (b >= 1) o.on.best = 'bad'; if (d >= 1) o.on.bpag = 'bad';
          o.rows.orq = act('orquestrador', 'saga_events', [up ? 'FAILED → avança de novo' : 'FAILED', 'bad'], [up ? 'lê o tópico, não o estado' : 'esperava nada mais', 'dim']);
          o.rows.bped = act('pedidos', '+ BANCO', ['CANCEL_ORDER: Success true', a > 0 ? 'acc' : 'dim'], ['em pedidos-reply', 'dim']);
          o.rows.best = act('estoque', '+ BANCO', [b >= 1 ? 'RESERVE_STOCK de novo' : 'RELEASE_STOCK: ok', b >= 1 ? 'bad' : 'dim'], ['em estoque-reply', 'dim']);
          o.rows.bpag = act('pagamentos', '+ BANCO', [d >= 1 ? 'PROCESS_PAYMENT: cobra' : 'parado', d >= 1 ? 'bad' : 'dim']);
          beam(o, CB.ped, a > 0 && a < 1); beam(o, CB.est, (b > 0 && b < 1) || (c > 0 && c < 1), 'bad'); beam(o, CB.pag, d > 0 && d < 1, 'bad');
          pk(o, rev(CB.ped), a, 'CANCEL_ORDER ok'); pk(o, CB.est, b, 'RESERVE_STOCK', 'bad'); pk(o, rev(CB.est), c, 'RELEASE_STOCK ok'); pk(o, CB.pag, d, 'PROCESS_PAYMENT', 'bad');
          if (d >= 1) T(o, TF(420), 'lido no código: a cancelada ressuscita', 'bad');
          o.cnt = [['ESTADO', up ? 'FAILED → avança' : 'FAILED', 'bad'], ['LEITURA', 'do código', 'dim'], ['CONSERTO', 'command_type', 'dim']];
          o.res = d >= 1 ? [['cobra um pedido cancelado', 'bad'], ['conserto: transição condicional', 'acc']] : []; } },
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
    log: () => `<li>Saída real do PostgreSQL 14.24 (20/10/2026), <code>saga_log</code> da <code>s-1057</code>:</li><table class="h3-sum"><tr><th>id</th><th>de</th><th>para</th><th>evento</th><th>em</th></tr>${LOG7.map(([id, para, ev, em], i) => `<tr${i === 4 ? ' class="on"' : ''}><td>${id}</td><td>${i ? LOG7[i - 1][1] : ''}</td><td>${para}</td><td>${ev}</td><td>${em}</td></tr>`).join('')}</table><li><code>saga</code> termina com <code>CANCELADO</code> e <code>versao = 7</code></li><li>Duplicata: <code>transitar('s-1057','COBRANDO','PAGO',…)</code> às 20:15:41.210 → <b>f</b>, sem linha no log</li><li>Vigia: achou <code>s-teste</code> parada em <code>COBRANDO</code> desde 19:20</li><li>90 dias a 30 pedidos/s: 30 × 86.400 × 90 × 7 = <b>1.632.960.000</b> linhas, ~300 GB a 200 B</li><li>O laboratório do autor guarda o log em <code>saga_events</code> (<code>saga_id</code>, <code>order_id</code>, <code>state</code>, <code>data</code>, <code>error</code>, <code>created_at</code>); o estado é a última linha</li>`,
    'estorno-falha': () => `<table class="h3-sum"><tr><th>onde falhou</th><th>compensações, na ordem</th><th>quantas</th></tr><tr class="on"><td>estoque (a loja cobrou antes)</td><td>EstornarCobranca, CancelarPedido</td><td>2</td></tr><tr><td>pagamento (laboratório)</td><td>LiberarEstoque, CancelarPedido</td><td>2</td></tr><tr><td>entrega (laboratório)</td><td>EstornarCobranca, LiberarEstoque, CancelarPedido</td><td>3</td></tr></table><li>Backoff: 1 + 2 + 4 + 8 + 16 = <b>31 s</b> (5 repetições, 6 tentativas); depois, <code>INTERVENCAO</code></li><li>Chave <code>estorno-c-7732</code>: repetir estorna uma vez; sem ela, R$ 116,00</li><li>Microsoft: "Compensating transactions don't always work"; cancelar uma reserva "might not entitle the customer to a complete refund"</li><li>Não se desfaz: o e-mail enviado (manda-se outro) e a taxa do PSP</li>`,
    'dual-write': () => `<li>Laboratório do autor (lido, não executado): <code>processReply</code> envia o comando na linha <b>346</b> e só grava o estado (<code>saveEvent</code>) na <b>391</b>; consumidor em <code>OffsetNewest</code> (linha 194); <code>command_id</code> e <code>reply_id</code> não são conferidos</li><table class="h3-sum"><tr><th>caso</th><th>sintoma</th></tr><tr><td>coreografia: grava e cai antes de publicar</td><td>a saga para, sem erro</td></tr><tr class="on"><td>orquestração: manda e cai antes de gravar</td><td>reserva duas vezes</td></tr><tr><td>outbox: o relay publica e cai antes de marcar</td><td>comando duplicado; o <code>command_id</code> segura</td></tr></table><li>"Publicar dentro da transação e só dar commit depois" não é atômico: o <code>COMMIT</code> pode falhar depois do publish</li><li>Confluent, <i>The Dual-Write Problem</i>; microservices.io, <i>Transactional Outbox</i></li>`,
    'reserva-antes': () => `<table class="h3-sum"><tr><th>o 1057 sem estoque</th><th>cobrar antes (a loja)</th><th>reservar antes (o laboratório)</th></tr><tr class="on"><td>até CANCELADO</td><td>44,95 s</td><td>~100 ms</td></tr><tr><td>estorno</td><td>1 (R$ 58,00)</td><td>nenhum</td></tr><tr><td>o Davi vê o dinheiro sair</td><td>sim, e volta em 3,7 s</td><td>não</td></tr><tr><td>o custo</td><td>espera, estorno e taxa do PSP</td><td>reserva presa enquanto o cliente paga</td></tr></table><li>Estornos a cada 20 pedidos (10% de falha de estoque): 2,0 × 0 (1,9 com os 5% do pagamento antes)</li><li>Reserva presa (exemplo): 30 × 0,2 × 600 = <b>3.600</b> unidades</li>`,
    lab: () => `<li>Repositório público do autor, <code>exemplos/saga/orquestrado/</code> (lido, não executado): Go 1.23, Kafka KRaft, 5 PostgreSQL, simulador</li><table class="h3-sum"><tr><th>resultado</th><th>probabilidade</th><th>em 20</th></tr><tr class="on"><td>completa</td><td>0,9 × 0,95 = 85,5%</td><td>17,1</td></tr><tr><td>falha no estoque</td><td>10%</td><td>2,0</td></tr><tr><td>falha no pagamento</td><td>0,9 × 0,05 = 4,5%</td><td>0,9</td></tr></table><li>Compensação: <code>… PROCESS_PAYMENT (falha) → COMPENSATING → RELEASE_STOCK → CANCEL_ORDER → FAILED</code> (o README lista <code>CANCEL_PAYMENT</code>, que só sai numa falha da entrega)</li><li>Observações da leitura: avança pelo tópico; <code>FAILED</code> antes das respostas; comando antes do estado; sem vigia nem idempotência; <code>CANCEL_DELIVERY</code> nunca enviado; o log chamado de "Event Sourcing"</li>`,
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
      ${sc === 'lab' ? '<div class="o3-mode r3-act"><button data-sc="reserva-antes">Reserva antes<small>as duas ordens lado a lado</small></button></div>' : ''}
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'compensacao') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
