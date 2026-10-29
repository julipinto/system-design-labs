// Figura 3D (iso-glow): o pedido 1057 atravessando os serviços da loja, com e sem saga.
// Serviços: pedidos, pagamentos, estoque e entregas na frente, cada um com o seu banco logo abaixo; o Kafka como uma
// esteira no meio; o orquestrador (e o banco da saga) atrás, à direita; o PSP numa prancha à parte, fora da loja.
// State-machine: os 11 estados da saga como ladrilhos (o caminho feliz atrás, a volta no meio, INTERVENCAO na frente)
// e a vigia; a ficha s-1057 anda por eles. Atrás de tudo, o mostrador (relógio e contadores, a conta, o resultado).
// Cenários (botões e ?mode=sem-saga|state-machine|coreografado|orquestrado; ?step=N abre no passo N).
// Dados: docs/escrita/saga-brief.md e as aulas 1–5 (1057 do Davi, 58,00, Pix c-7732, CAMISETA-015 1 → 0 às 20:15:10,
// pago às 20:15:41.200, e-1901…e-1905, CANCELADO às 20:15:44.950; 30 × 41,2 = 1.236; 4/5 eventos, 6/8 + 1 mensagens).
FIGS3D.push({ id: 'saga', name: 'Saga', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  // o relógio da saga: segundos depois de 20:15:00.000
  const pad = (n, k = 2) => String(n).padStart(k, '0');
  const hms = (s, ms = true) => { const tot = Math.round((72900 + s) * 1000), h = Math.floor(tot / 3600000), m = Math.floor(tot / 60000) % 60, sec = Math.floor(tot / 1000) % 60;
    return `${pad(h)}:${pad(m)}` + (ms === null ? '' : `:${pad(sec)}` + (ms ? '.' + pad(tot % 1000, 3) : '')); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['sem-saga', 'state-machine', 'coreografado', 'orquestrado'];
  const SCNAME = { 'sem-saga': 'No saga', 'state-machine': 'State machine', coreografado: 'Choreographed', orquestrado: 'Orchestrated' };
  const SCFULL = { 'sem-saga': 'No saga: the stuck order', 'state-machine': 'The saga as a state machine', coreografado: 'Choreographed saga', orquestrado: 'Orchestrated saga' };
  const AULA = { 'sem-saga': 'aula-1-introducao-e-motivacoes', 'state-machine': 'aula-3-a-proposta-arquitetural-do-saga', coreografado: 'aula-4-saga-coreografado', orquestrado: 'aula-5-saga-orquestrado' };
  let clk = 0, sc = 'orquestrado', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', esp = 0;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-saga3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  const fam = () => sc === 'state-machine' ? 'M' : 'S';

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 790, 452, [[14, 14], [776, 14], [14, 438], [776, 438]]);
  hazeAndShadow(g0, 395, 226, 9.1, 5.6);
  // o PSP mora numa prancha à parte: fora da fronteira da loja
  const pspG = new THREE.Group(); g0.add(pspG);
  plateWith(pspG, 160, 200, [[12, 12], [148, 12], [12, 188], [148, 188]]);
  hazeAndShadow(pspG, 80, 100, 1.9, 2.4);
  const PSPAT = [800, 150]; pspG.position.copy(W(...PSPAT, 0));
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 46, SW = 416, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças das duas famílias; cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // serviços (sem-saga, coreografado, orquestrado)
  const SX = { ped: 30, pag: 218, est: 406, ent: 594 }, SVW = 170, CX = {};
  Object.entries(SX).forEach(([k, x]) => { CX[k] = x + SVW / 2; block(k, x, 285, SVW, 90, 26); block('d' + k, x + 10, 384, 150, 56, 12); });
  block('bus', 30, 190, 735, 58, 12);
  block('orq', 475, 35, 165, 130, 30); block('dorq', 660, 55, 105, 90, 16);
  block('psp', PSPAT[0] + 15, PSPAT[1] + 15, 130, 170, 30);
  // estados (state-machine)
  const TW = 140, TX = i => 30 + i * 155, TC = i => TX(i) + TW / 2, RY = [115, 240, 360], RC = [160, 285, 400];
  const ST = { NOVO: [0, 0], COBRANDO: [1, 0], PAGO: [2, 0], RESERVANDO: [3, 0], RESERVADO: [4, 0], AGENDANDO: [4, 1], FINALIZADO: [4, 2],
    COMPENSANDO: [3, 1], ESTORNANDO: [1, 1], CANCELADO: [0, 1], INTERVENCAO: [1, 2] };
  Object.entries(ST).forEach(([s, [i, r]]) => block('s' + s, TX(i), RY[r], TW, r === 2 ? 80 : 90, 18));
  block('vig', TX(2), 360, TX(3) + TW - TX(2), 80, 14);
  const NAMES = Object.keys(B), SVC = ['ped', 'pag', 'est', 'ent'];
  creases(first);

  // cabos grossos (vigas) e pontos de luz: as mensagens e a ficha da saga
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 44 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 16 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on || b.tone ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
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

  // ── cabos ──
  const rev = pts => pts.slice().reverse();
  // de um serviço a outro pela esteira (o evento sobe, anda no Kafka e desce)
  const via = (a, b, lane = 222) => [[CX[a], 285, ZR], [CX[a], lane, 26], [CX[b], lane, 26], [CX[b], 285, ZR]];
  const OX = 540;   // o orquestrador escreve nos tópicos de comando (pista de trás) e lê os de resposta (pista da frente)
  const cmd = k => [[OX, 165, ZR], [OX, 214, 26], [CX[k] - 14, 214, 26], [CX[k] - 14, 285, ZR]];
  const rep = k => [[CX[k] + 14, 285, ZR], [CX[k] + 14, 232, 26], [OX + 40, 232, 26], [OX + 40, 165, ZR]];
  const PSPC = [[340, 285, ZR], [340, 265, 40], [795, 265, 40], [PSPAT[0] + 15, 265, ZR]];
  const ORQB = [[640, 100, ZR], [660, 100, ZR]];
  // os cabos entre os estados
  const SB = { 'NOVO>COBRANDO': 0, 'COBRANDO>PAGO': 1, 'PAGO>RESERVANDO': 2, 'RESERVANDO>RESERVADO': 3, 'RESERVADO>AGENDANDO': 4, 'AGENDANDO>FINALIZADO': 5 };
  const SBP = [0, 1, 2, 3].map(i => [[TX(i) + TW, 160, ZR], [TX(i + 1), 160, ZR]]).concat([[[TC(4), 205, ZR], [TC(4), 240, ZR]], [[TC(4), 330, ZR], [TC(4), 360, ZR]]]);
  const SDOWN = [[TC(3), 205, ZR], [TC(3), 240, ZR]], SCOMP = [[TX(3), 285, ZR], [TX(1) + TW, 285, ZR]], SCAN = [[TX(1), 285, ZR], [TX(0) + TW, 285, ZR]];
  const SINT = [[TC(1), 330, ZR], [TC(1), 360, ZR]], SVIG = [[TX(2), 400, ZR], [TX(2) - 8, 400, 30], [TX(2) - 8, 222, 40], [TC(1), 222, 40], [TC(1), 205, ZR]];
  // uma mensagem andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);   // fração da viagem entre os instantes a e b do passo
  // manda: acende o cabo enquanto a mensagem anda e diz se ela já chegou
  function send(o, pts, t, a, b, label, tone = '') { const f = go_(t, a, b); if (f > 0 && f < 1) o.beams.push({ pts, on: true, tone }); pk(o, pts, f, label, tone); return f >= 1; }

  // ── conteúdo padrão das peças ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const DB = { ped: '1057 · created', pag: 'c-7732 · open', est: 'CAMISETA-015 · 1', ent: 'nothing scheduled' };
  const db = (o, k, text, tone = 'dim') => { o.rows['d' + k] = act('DB · ' + { ped: 'pedidos', pag: 'pagamentos', est: 'estoque', ent: 'entregas' }[k], '', [text, tone]); };
  // a ficha da saga andando pelos estados: entra em cada um no instante a + i × dt
  const TILE = { NOVO: ['order created'], COBRANDO: ['charges c-7732', 'undo: refund'], PAGO: ['PedidoPago'], RESERVANDO: ['reserves', 'undo: release'],
    RESERVADO: ['stock ok'], AGENDANDO: ['schedules', 'undo: cancel'], FINALIZADO: ['final'], COMPENSANDO: ['picks the undo'],
    ESTORNANDO: ['EstornarCobranca'], CANCELADO: ['final'], INTERVENCAO: ['final: calls a person'] };
  const tile = s => { const [i, r] = ST[s]; return [TC(i), RC[r], 37]; };
  const FAIL = ['NOVO', 'COBRANDO', 'PAGO', 'RESERVANDO', 'COMPENSANDO', 'ESTORNANDO', 'CANCELADO'];
  const HAPPY = ['NOVO', 'COBRANDO', 'PAGO', 'RESERVANDO', 'RESERVADO', 'AGENDANDO', 'FINALIZADO'];
  const LOGT = [0, 0.05, 41.2, 41.22, 41.26, 41.3, 44.95];
  function walk(o, path, t, a, dt, label) {
    const k = clamp((t - a) / dt, 0, path.length - 1), i = Math.floor(k), f = ease(k - i);
    const p0 = tile(path[i]), p1 = tile(path[Math.min(i + 1, path.length - 1)]), p = p0.map((v, j) => v + (p1[j] - v) * f);
    if (f > 0.02 && f < 0.98) p[2] += Math.sin(f * Math.PI) * 14;
    o.dots.push([p, '']); o.tags.push([p[0], p[1], p[2] + 22, label(path[i], i), 'acc']);
    path.slice(0, i + 1).forEach((s, j) => { o.on['s' + s] = j === i ? 1 : 2; });
    return i;
  }
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    if (fam() === 'S') {
      show('bus', 'psp', ...SVC, ...SVC.map(k => 'd' + k)); if (sc === 'orquestrado') show('orq', 'dorq');
      o.rows.ped = act('pedidos', 'SERVICE', ['saves the order', 'dim']);
      o.rows.pag = act('pagamentos', 'SERVICE', ['charges via the PSP', 'dim']);
      o.rows.est = act('estoque', 'SERVICE', ['reserves the T-shirt', 'dim']);
      o.rows.ent = act('entregas', 'SERVICE', ['schedules the delivery', 'dim']);
      SVC.forEach(k => db(o, k, DB[k]));
      o.rows.bus = act('Kafka', sc === 'orquestrado' ? 'COMMANDS AND REPLIES' : 'EVENT BELT',
        [sc === 'orquestrado' ? 'pagamentos-commands · pagamentos-reply · …' : 'anyone can listen', 'dim']);
      o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix', 'dim'], ['c-7732', 'dim']);
      o.rows.orq = act('orchestrator', '', ['saga s-1057', 'dim'], ['—', 'dim']);
      o.rows.dorq = act('DB · saga', '', ['s-1057', 'dim'], ['—', 'dim']);
      o.beams.push(...SVC.map(k => ({ pts: [[CX[k], 285, ZR], [CX[k], 245, ZR]] })), { pts: PSPC });
      if (sc === 'orquestrado') o.beams.push({ pts: [[OX + 20, 165, ZR], [OX + 20, 195, ZR]] }, { pts: ORQB });
    } else {
      show(...Object.keys(ST).map(s => 's' + s), 'vig');
      Object.keys(ST).forEach(s => { o.rows['s' + s] = act(s, '', ...TILE[s].map((l, j) => [l, j ? 'acc' : 'dim'])); });
      o.rows.vig = act('watchdog', 'EVERY MINUTE', ['estado NOT IN (FINALIZADO, CANCELADO)', 'dim'], ['and stalled for over 30 min', 'dim']);
      o.beams.push(...SBP.map(pts => ({ pts })), { pts: SDOWN }, { pts: SCOMP }, { pts: SCAN }, { pts: SINT });
    }
    return o;
  }
  const beamOnSM = (o, pts) => o.beams.push({ pts, on: true });
  // o quadro do orquestrador e o banco da saga
  const orq = (o, st, extra, tone = 'acc') => { o.rows.orq = act('orchestrator', '', ['saga s-1057', 'dim'], [st, tone], extra && [extra, 'dim']); };
  const dorq = (o, st, v) => { o.rows.dorq = act('DB · saga', '', ['s-1057', 'dim'], [st + ' · v' + v, 'acc']); };
  const ESP = [[41.2, '41.2 s'], [300, '5 min'], [1800, '30 min']];

  // ── o que se vê em cada passo ──
  const STEPS = {
    'sem-saga': [
      { id: 'pedido', dur: 5, title: '20:15:00.000: order 1057, 58.00 on Pix', yk: 'THE ORDER',
        code: ['20:15:00.000  pedidos: INSERT 1057, COMMIT', '              publishes PedidoCriado e-1901', '20:15:00.050  pagamentos: Pix charge c-7732', '1 black T-shirt 49.00 + SP shipping 9.00', '= 58.00'],
        story: 'At <b>20:15:00.000</b> on Black Friday, Davi, from SP, creates order <b>1057</b>: <b>1 black T-shirt</b> (<code>CAMISETA-015</code>, 49.00) plus SP shipping (9.00), <b>58.00</b>, to be paid by <b>Pix</b> at an external PSP. <code>pedidos</code> saves it in its database and publishes <code>PedidoCriado</code> (<code>e-1901</code>); <code>pagamentos</code> opens charge <code>c-7732</code> at the PSP. Stock still has <b>1</b> T-shirt.',
        look: 'The PedidoCriado leaves pedidos, runs along the Kafka belt and drops into pagamentos, which sends the charge to the PSP, on the board outside. Under each service, its own database.',
        key: 'Each service writes to its own database; none can see another\'s.',
        f(o, t) { const a = send(o, via('ped', 'pag'), t, 0.6, 2.2, 'PedidoCriado · e-1901'), b = send(o, PSPC, t, 2.5, 3.9, 'Pix charge c-7732');
          lit(o, 'ped', 'dped'); if (a) lit(o, 'pag'); if (b) lit(o, 'psp', 'dpag');
          o.rows.ped = act('pedidos', 'SERVICE', ['order 1057 · Davi, SP', 'dim'], ['58.00', 'acc']);
          if (b) o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], ['waiting for Davi', 'dim']);
          o.cnt = [['CLOCK', b ? '20:15:00.050' : '20:15:00.000'], ['ORDER', '58.00', 'dim'], ['STOCK', '1', 'dim']];
          o.res = b ? [['charge c-7732 open', 'acc']] : []; } },
      { id: 'avaria', dur: 5, title: '20:15:10: the T-shirt disappears', yk: 'THE WRITE-OFF',
        code: ['20:15:10  Logistics: damage write-off', '          CAMISETA-015: 1 → 0', 'order 1057: still standing', 'charge c-7732: waiting for Davi', 'no event goes out'],
        story: 'At <b>20:15:10</b> Logistics writes off the only T-shirt as damaged, and stock goes from 1 to <b>0</b>. Davi\'s order is still standing: he hasn\'t paid yet, and no service knows the stock ran out. The product page said "last unit": that was the 60 s cache from module 5.',
        look: 'The stock database goes from 1 to 0 and turns red. Nothing leaves along the belt: pedidos and pagamentos are not told.',
        key: 'Stock changed in one service\'s database only, and the others carry on with the order.',
        f(o, t) { const z = t > 0.9; lit(o, 'dped'); o.on.dest = z ? 'bad' : 1; o.on.est = 2;
          db(o, 'est', z ? 'CAMISETA-015 · 0' : 'CAMISETA-015 · 1', z ? 'bad' : 'acc');
          o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], ['waiting for Davi', 'dim']); lit(o, 'psp');
          if (z) T(o, [CX.est, 418, 40], 'write-off: 1 → 0', 'bad');
          o.cnt = [['CLOCK', '20:15:10'], ['STOCK', z ? '0' : '1', z ? 'bad' : 'dim'], ['ORDER', 'standing', 'dim']];
          o.res = z ? [['nobody else knows', 'bad']] : []; } },
      { id: 'pix', dur: 6, title: '20:15:41.200: Davi pays, 41.2 s later', yk: 'THE PAYMENT',
        code: ['20:15:41.200  Davi approves the Pix in his bank', '              PSP → webhook: c-7732 paid', '              pagamentos: COMMIT, 58.00', '              publishes PedidoPago e-1902', 'Davi\'s wait: 41.2 s'],
        story: 'At <b>20:15:41.200</b>, <b>41.2 s</b> after creating the order, Davi approves the Pix in his bank app. The PSP tells the store by webhook, <code>pagamentos</code> records the charge as paid and publishes <code>PedidoPago</code> (<code>e-1902</code>), 58.00. <code>pedidos</code> marks 1057 as paid.',
        look: 'The clock runs 41.2 s. Then the webhook comes back from the PSP to pagamentos, and the PedidoPago travels along the belt to pedidos and to stock.',
        key: 'The money already left Davi\'s account: from here on, undoing costs a refund.',
        f(o, t) { const w = lin(t, 0.3, 2.3, 10, 41.2), a = send(o, rev(PSPC), t, 2.4, 3.6, 'webhook: paid'), b = send(o, via('pag', 'est'), t, 3.8, 5.2, 'PedidoPago · e-1902'),
            c = send(o, via('pag', 'ped', 236), t, 3.8, 5.0, '');
          lit(o, 'psp'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          if (a) { lit(o, 'pag', 'dpag'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); }
          if (c) { lit(o, 'ped', 'dped'); db(o, 'ped', '1057 · paid', 'acc'); }
          if (b) lit(o, 'est');
          o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], [w < 41.2 ? 'waiting for Davi' : 'paid: 58.00', 'acc']);
          o.cnt = [['CLOCK', hms(w, w >= 41.2)], ['WAIT', dec(w) + ' s', 'dim'], ['PAID', a ? '58.00' : '…', 'dim']];
          o.res = a ? [['the money left Davi\'s account', 'acc']] : []; } },
      { id: 'falha', dur: 6, title: '20:15:41.260: stock answers "no stock"', yk: 'THE RESERVATION',
        code: ['20:15:41.220  estoque: reserve CAMISETA-015', '              estoque = 0', '20:15:41.260  publishes EstoqueIndisponivel', '              e-1903, reason sem_estoque', 'who listens? nobody'],
        story: 'With the money in hand, the store asks to reserve the T-shirt at <b>20:15:41.220</b>, and <code>estoque</code> answers <code>EstoqueIndisponivel</code> (<code>e-1903</code>), reason <code>sem_estoque</code>, at <b>20:15:41.260</b>. The store\'s order comes from module 6: charge, reserve, schedule delivery.',
        look: 'Stock turns red and publishes the EstoqueIndisponivel on the belt. The event runs to the end of Kafka and no service picks it up.',
        key: 'Running out of stock isn\'t a bug: it\'s a valid answer, and someone needs a plan for it.',
        f(o, t) { const r = t > 0.8; o.on.est = r ? 'bad' : 1; o.on.dest = 'bad'; lit(o, 'dped', 'dpag');
          db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); db(o, 'ped', '1057 · paid', 'acc');
          o.rows.est = act('estoque', 'SERVICE', ['reserve 1?', 'dim'], [r ? 'sem_estoque' : '…', r ? 'bad' : 'dim']);
          const lost = [[CX.est, 285, ZR], [CX.est, 222, 26], [760, 222, 26]], e = send(o, lost, t, 1.2, 3.6, 'EstoqueIndisponivel · e-1903', 'bad');
          if (e) T(o, [740, 222, 50], 'nobody listens', 'bad');
          o.cnt = [['CLOCK', r ? '20:15:41.260' : '20:15:41.220'], ['RESERVATION', r ? 'failed' : '…', r ? 'bad' : 'dim'], ['WHO LISTENS', 'nobody', 'dim']];
          o.res = e ? [['the event passed and nobody acted', 'bad']] : []; } },
      { id: 'preso', dur: 6, title: 'No saga: paid and no T-shirt', yk: 'HOW IT ENDED',
        code: ['pedidos     1057: paid', 'pagamentos  c-7732: paid, 58.00 with the store', 'estoque     CAMISETA-015: 0', 'entregas    nothing to deliver', 'reconciliation: only at 23:00'],
        story: 'Without a saga, nobody knows what to do with the <code>EstoqueIndisponivel</code>. The order stays <code>pago</code>, the money is with the store, the T-shirt doesn\'t exist. Davi is <b>R$ 58.00 poorer</b> and has no T-shirt. The only thing that would catch the case is the <b>23:00</b> reconciliation report (module 6), <b>2 h 44 min</b> after the payment.',
        look: 'The four databases stay as they are: 1057 paid, 58.00 received, stock 0, nothing scheduled. No cable lights up, and the clock runs to 23:00.',
        key: 'Each local COMMIT worked; the whole came out wrong, and nobody owns the whole.',
        f(o, t) { const c = lin(t, 0.5, 4.5, 41.2, 9900);
          lit(o, 'dped', 'dpag'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); db(o, 'ped', '1057 · paid', 'acc');
          o.rows.ped = act('pedidos', 'SERVICE', ['1057: paid', 'acc'], ['no T-shirt', 'bad']);
          T(o, [CX.ped, 300, 54], 'paid and no stock', 'bad');
          o.cnt = [['CLOCK', hms(c, null)], ['UNTIL SOMEONE SEES', c >= 9900 ? '2 h 44 min' : '…', c >= 9900 ? 'bad' : 'dim'], ['DAVI', '−58.00', 'bad']];
          o.res = [['Davi paid and gets nothing', 'bad']]; } },
      { id: '2pc', dur: 7, title: 'What about two-phase commit? The PSP doesn\'t prepare', yk: 'THE 2PC',
        code: ['phase 1  coordinator → "prepare?"', '         estoque   ready (lock open)', '         entregas  ready (lock open)', '         PSP       there is no "prepare the Pix"', 'phase 2  "commit" never goes out'],
        story: 'The store tries <i>two-phase commit</i>: a coordinator asks everyone "prepare?" and, when all answer "ready", sends "commit" (Fowler). There is no "prepare the Pix": charge <code>c-7732</code> already went out the moment Davi approved it in the bank app, and the PSP only knows "charge" and "refund". And if the coordinator goes down between the phases, the databases stay <b>blocked</b> waiting for the decision.',
        look: 'The coordinator comes up at the back and sends "prepare?" to stock, to entregas and to the PSP. Both services answer "ready"; the PSP turns red, with no answer to give.',
        key: '2PC needs everyone to know how to prepare; an outside system doesn\'t.',
        f(o, t) { o.show.orq = 1; o.rows.orq = act('coordinator', '2PC', ['phase 1: prepare?', 'acc'], [t > 4 ? 'waiting for the PSP' : '…', t > 4 ? 'bad' : 'dim']); lit(o, 'orq');
          o.beams.push({ pts: [[OX + 20, 165, ZR], [OX + 20, 195, ZR]] });
          const a = send(o, cmd('est'), t, 0.6, 2.0, 'prepare?'), b = send(o, cmd('ent'), t, 0.8, 2.2, ''), p = send(o, [[640, 120, ZR], [790, 120, 40], [PSPAT[0] + 80, PSPAT[1] + 15, 50]], t, 1.0, 2.4, 'prepare?');
          const ra = send(o, rep('est'), t, 2.6, 3.8, 'ready'), rb = send(o, rep('ent'), t, 2.8, 4.0, '');
          if (a) lit(o, 'est'); if (b) lit(o, 'ent');
          if (ra) { o.rows.est = act('estoque', 'SERVICE', ['ready', 'acc'], ['lock open', 'bad']); o.on.dest = 'bad'; db(o, 'est', 'locked in phase 1', 'bad'); }
          if (rb) { o.rows.ent = act('entregas', 'SERVICE', ['ready', 'acc'], ['lock open', 'bad']); o.on.dent = 'bad'; db(o, 'ent', 'locked in phase 1', 'bad'); }
          if (p) { o.on.psp = 'bad'; o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['prepare?', 'bad'], ['only charges and refunds', 'dim']); T(o, [PSPAT[0] + 80, PSPAT[1] + 100, 60], 'no prepare', 'bad'); }
          o.cnt = [['READY', (ra ? 1 : 0) + (rb ? 1 : 0) + ' of 3'], ['PSP', p ? 'no prepare' : '…', p ? 'bad' : 'dim'], ['LOCKS', ra ? 'open' : '…', 'dim']];
          o.res = rb && p ? [['"commit" never goes out', 'bad']] : []; } },
      { id: 'trava', dur: 8, title: 'What if it goes wrong: the Pix wait holds the lock', yk: 'THE LOCK MATH', act: 'espera',
        code: ['30 orders/s × 41.2 s  = 1,236', '30 orders/s × 300 s   = 9,000', '30 orders/s × 1,800 s = 54,000', 'each one: a connection and a lock', '5 and 30 min: examples'],
        story: 'If <code>estoque</code> held the T-shirt\'s lock while Davi decides, it would stay open for the whole wait. At 30 orders per second, with Davi\'s <b>41.2 s</b>, that would be 30 × 41.2 = <b>1,236</b> transactions open at the same time, each with its own connection and its own lock. Raise the Pix wait with the buttons above and watch the queue grow; then go back to 41.2 s and compare.',
        look: 'The lock sits on CAMISETA-015, in the stock database. Behind it, on the belt, the queue of waiting orders grows while the clock runs.',
        key: 'A lock held during the customer\'s wait stops the store; the saga doesn\'t hold a lock between one step and the next.',
        f(o, t) { const [s, lab] = ESP[esp], k = clamp((t - 0.4) / 4), n = 30 * s * k;
          o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · locked', 'bad');
          o.rows.est = act('estoque', 'LOCK', ['holds the row', 'bad'], ['wait: ' + lab, 'dim']);
          const q = Math.min(12, Math.ceil(k * (esp === 0 ? 6 : esp === 1 ? 10 : 12)));
          for (let i = 0; i < q; i++) o.dots.push([[CX.est - 18 - i * 22, 222, 30], 'bad']);
          o.beams.push({ pts: [[CX.est, 285, ZR], [CX.est, 222, 26], [CX.est - 30 - 22 * 12, 222, 26]], tone: 'bad' });
          T(o, [CX.est - 140, 222, 60], 'queue: ' + thou(n) + ' waiting', 'bad');
          o.cnt = [['OPEN TRANSACTIONS', thou(n), 'bad'], ['PIX WAIT', lab, 'dim'], ['ORDERS/S', '30', 'dim']];
          o.res = k >= 1 ? [['30 × ' + (esp ? thou(s) + ' s' : '41.2 s') + ' = ' + thou(30 * s), 'bad']] : []; } },
    ],
    'state-machine': [
      { id: 'estados', dur: 5, title: 'The states of saga s-1057', yk: 'STEP AND UNDO',
        code: ['CriarPedido      → CancelarPedido', 'CobrarPedido     → EstornarCobranca', 'ReservarEstoque  → LiberarEstoque', 'AgendarEntrega   → CancelarEntrega', 'final: FINALIZADO, CANCELADO, INTERVENCAO'],
        story: 'The saga keeps track of which step the order is at. The store\'s states: the happy path <code>NOVO → COBRANDO → PAGO → RESERVANDO → RESERVADO → AGENDANDO → FINALIZADO</code>; the failure <code>… → COMPENSANDO → ESTORNANDO → CANCELADO</code>; and <code>INTERVENCAO</code>, for when the compensation doesn\'t go through. Each local step has its undo: creating the order (<code>CancelarPedido</code>), charging (<code>EstornarCobranca</code>), reserving (<code>LiberarEstoque</code>), scheduling (<code>CancelarEntrega</code>).',
        look: 'The happy path runs along the back row and goes down the right column to FINALIZADO. The way back runs along the middle row, right to left. At the front, INTERVENCAO, the only final state that calls a person. The s-1057 token is in NOVO.',
        key: 'Each step has an undo, written before the saga runs.',
        f(o, t) { walk(o, ['NOVO'], t, 0, 1, () => 's-1057 · NOVO'); o.on.sFINALIZADO = o.on.sCANCELADO = o.on.sINTERVENCAO = 2;
          o.cnt = [['STATE', 'NOVO'], ['STATES', '11', 'dim'], ['FINAL', '3', 'dim']];
          o.res = [['local steps + compensations', 'acc']]; } },
      { id: 'feliz', dur: 7, title: 'The happy path: up to FINALIZADO', yk: 'ONLY FORWARD',
        code: ['NOVO       → COBRANDO    charges c-7732', 'COBRANDO   → PAGO        PedidoPago', 'PAGO       → RESERVANDO  reserves', 'RESERVANDO → RESERVADO   EstoqueReservado', 'RESERVADO  → AGENDANDO   schedules the delivery', 'AGENDANDO  → FINALIZADO  EntregaAgendada'],
        story: 'If the T-shirt hadn\'t been written off, 1057 would only walk the top and right path: charge, receive the <code>PedidoPago</code>, reserve, schedule the delivery and end in <code>FINALIZADO</code>. No compensation.',
        look: 'The token moves tile by tile along the back row, goes down the right column and stops at FINALIZADO.',
        key: 'On the happy path the saga only moves forward.',
        f(o, t) { const i = walk(o, HAPPY, t, 0.5, 0.8, s => 's-1057 · ' + s);
          for (let j = 0; j < i; j++) beamOnSM(o, SBP[j]);
          o.cnt = [['STATE', HAPPY[i]], ['STEPS DONE', String(i), 'dim'], ['COMPENSATIONS', '0', 'dim']];
          o.res = i === 6 ? [['FINALIZADO, nothing undone', 'acc']] : []; } },
      { id: 'falha', dur: 8, title: 'The real 1057: 2 compensations, in reverse order', yk: 'THE s-1057 LOG',
        code: ['20:15:00.000  NOVO         e-1901', '20:15:00.050  COBRANDO', '20:15:41.200  PAGO         e-1902', '20:15:41.220  RESERVANDO', '20:15:41.260  COMPENSANDO  e-1903', '20:15:41.300  ESTORNANDO', '20:15:44.950  CANCELADO    e-1904'],
        story: 'Now the real 1057. <code>NOVO</code> at 20:15:00.000, <code>COBRANDO</code> at 00.050, <code>PAGO</code> at 41.200, <code>RESERVANDO</code> at 41.220. Stock answers <code>EstoqueIndisponivel</code> (<code>e-1903</code>) and the saga drops to <code>COMPENSANDO</code> at 41.260. It undoes in <b>reverse order</b>: first it refunds the charge (<code>ESTORNANDO</code>, 41.300), then cancels the order: <code>CANCELADO</code> at <b>20:15:44.950</b>. Two compensations; the reservation never existed, so there is nothing to release.',
        look: 'The token walks to RESERVANDO, drops to the middle row and goes back left: ESTORNANDO, then CANCELADO.',
        key: 'You only compensate what was already done, from the newest to the oldest.',
        f(o, t) { const i = walk(o, FAIL, t, 0.5, 0.9, (s, k) => s + ' · ' + hms(LOGT[k]));
          [SBP[0], SBP[1], SBP[2], SDOWN, SCOMP, SCAN].slice(0, i).forEach(p => beamOnSM(o, p));
          if (i >= 4) o.on.sRESERVANDO = 'bad';
          const nc = i >= 6 ? 2 : i >= 5 ? 1 : 0;
          o.cnt = [['STATE', FAIL[i], i >= 4 ? 'bad' : ''], ['CLOCK', hms(LOGT[i]), 'dim'], ['COMPENSATIONS', String(nc), 'dim']];
          o.res = i === 6 ? [['refund, then cancellation', 'acc'], ['44.95 s; Davi gets 58.00 back', 'acc']] : []; } },
      { id: 'isolamento', dur: 6, title: 'No isolation: the middle shows to others', yk: 'ACD WITHOUT THE I',
        code: ['saga in RESERVANDO: the unit stays reserved', 'another customer reads: sold out', 'the saga fails later on: releases', 'the other customer already left', 'semantic lock: RESERVA_PENDENTE'],
        story: 'The Saga is <b>ACD without the I</b>: it has atomicity (by compensation), consistency and durability, but no <b>isolation</b>. While the saga is in <code>RESERVANDO</code>, the T-shirt stays reserved. If the saga is going to fail further on, for a few seconds stock shows "sold out" to <b>other customers</b>, who, by the time the reservation is released, have already left. The most direct countermeasure is the <b>semantic lock</b>: the <code>RESERVA_PENDENTE</code> state is visible, and whoever reads knows that unit may come back.',
        look: 'The token stops at RESERVANDO. Above the tile, what other customers read: first "sold out", then RESERVA_PENDENTE.',
        key: 'The saga\'s in-between states are visible; you have to design for that.',
        f(o, t) { walk(o, ['RESERVANDO'], t, 0, 1, () => 's-1057 · RESERVANDO'); o.on.sNOVO = o.on.sCOBRANDO = o.on.sPAGO = 2;
          [SBP[0], SBP[1], SBP[2]].forEach(p => beamOnSM(o, p)); const sem = t > 3;
          T(o, [TC(3), 150, 80], sem ? 'others read: RESERVA_PENDENTE' : 'other customers read: sold out', sem ? 'acc' : 'bad');
          o.cnt = [['STATE', 'RESERVANDO'], ['OTHER CUSTOMERS', sem ? 'RESERVA_PENDENTE' : 'sold out', sem ? 'dim' : 'bad'], ['ISOLATION', 'none', 'dim']];
          o.res = sem ? [['whoever reads knows the unit may come back', 'acc']] : [['the in-between state leaked', 'bad']]; } },
      { id: 'duplicata', dur: 7, title: 'The PedidoPago arrives twice: f', yk: 'THE CONDITIONAL TRANSITION',
        code: ["UPDATE saga SET estado = 'PAGO',", '       versao = versao + 1', "WHERE saga_id = 's-1057'", "  AND estado = 'COBRANDO';", '0 rows: transitar returns f', 'nothing is written to the log'],
        story: 'At <b>20:15:41.210</b> the same <code>PedidoPago</code> (<code>e-1902</code>) is delivered again. The saga is already in <code>PAGO</code>. The transition is <b>conditional</b>: <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> does <code>UPDATE … WHERE estado = \'COBRANDO\'</code>, doesn\'t find the row and returns <b><code>f</code></b>, without writing to the log. The duplicate was ignored without special code (run on PostgreSQL 14).',
        look: 'The token is in PAGO. A second red light, the copy of e-1902, arrives along the cable from COBRANDO to PAGO and comes back with f.',
        key: 'With the conditional transition, the repeated message doesn\'t move the saga.',
        f(o, t) { walk(o, ['PAGO'], t, 0, 1, () => 's-1057 · PAGO'); o.on.sNOVO = o.on.sCOBRANDO = 2; [SBP[0], SBP[1]].forEach(p => beamOnSM(o, p));
          const path = [[TC(1), 160, 37], [TX(2) - 8, 160, 62], [TC(2) - 20, 160, 50]], a = go_(t, 0.8, 2.6), back = go_(t, 2.8, 4.0);
          if (a > 0 && a < 1) pk(o, path, a, 'e-1902 again · 20:15:41.210', 'bad');
          if (a >= 1 && back < 1) pk(o, rev(path), Math.max(back, 0.001), 'f', 'bad');
          if (back >= 1) T(o, [TX(2) - 8, 160, 66], 'transitar(…) = f', 'bad');
          o.cnt = [['transitar(…)', a >= 1 ? 'f' : '…', a >= 1 ? 'bad' : 'dim'], ['STATE', 'PAGO', 'dim'], ['LOG ROWS', '+0', 'dim']];
          o.res = back >= 1 ? [['the duplicate was ignored', 'acc']] : []; } },
      { id: 'vigia', dur: 7, title: 'What if it goes wrong: the saga that stalled', yk: 'THE WATCHDOG',
        code: ['SELECT saga_id, estado FROM saga', "WHERE estado NOT IN ('FINALIZADO','CANCELADO')", "  AND atualizada_em < now() − interval '30 minutes';", '→ s-teste | COBRANDO (since 19:20)', 'deadline expired: expires and compensates'],
        story: 'The PSP never reports the Pix, and the saga stays in <code>COBRANDO</code> forever: nobody makes a mistake, nothing arrives. The way out is a <b>deadline per state</b> (in the example, the Pix charge expires in 30 min) and a <b>watchdog</b> that looks for sagas stalled past the deadline. In the test, it found <code>s-teste</code>, stalled in <code>COBRANDO</code> since <b>19:20</b>; the watchdog expires the charge and orders the compensation.',
        look: 'The watchdog lights up at the front and pulls a cable to COBRANDO, which turns red: there is s-teste, stalled since 19:20.',
        key: 'A saga that waits forever is only found by someone looking for the silence.',
        f(o, t) { const a = go_(t, 0.6, 2.2), on = a >= 1; lit(o, 'vig');
          o.rows.vig = act('watchdog', 'EVERY MINUTE', ['estado NOT IN (FINALIZADO, CANCELADO)', 'dim'], [on ? 'found: s-teste in COBRANDO' : 'and stalled for over 30 min', on ? 'bad' : 'dim']);
          o.beams.push({ pts: SVIG, on: a > 0 && !on, tone: on ? 'bad' : '' }); pk(o, SVIG, a, 'looks for stalled sagas');
          if (on) { o.on.sCOBRANDO = 'bad'; o.dots.push([tile('COBRANDO'), 'bad']); T(o, [TC(1), 160, 60], 's-teste · COBRANDO since 19:20', 'bad'); }
          o.cnt = [['STALLED SINCE', on ? '19:20' : '…', on ? 'bad' : 'dim'], ['DEADLINE', '30 min', 'dim'], ['FOUND', on ? '1' : '0', 'dim']];
          o.res = on ? [['deadline expired: expires and compensates', 'acc']] : []; } },
    ],
    coreografado: [
      { id: 'criado', dur: 6, title: 'Nobody is in charge: the PedidoCriado', yk: 'WHO LISTENS TO WHAT',
        code: ['pedidos     publishes PedidoCriado', 'pagamentos  listens to PedidoCriado → charges', 'estoque     listens to PedidoPago → reserves', 'entregas    listens to EstoqueReservado', 'pagamentos  listens to EstoqueIndisponivel'],
        story: '<code>pedidos</code> saves 1057 and publishes <code>PedidoCriado</code> (<code>e-1901</code>) at 20:15:00.000. It doesn\'t call anyone: it only says what happened. Whoever is interested listens; here, <code>pagamentos</code>, which opens the Pix charge <code>c-7732</code> at the PSP.',
        look: 'The event leaves pedidos, enters the belt and drops into pagamentos, which sends the charge to the PSP. pedidos doesn\'t know who will hear it.',
        key: 'In choreography, each service publishes a fact, without knowing who listens.',
        f(o, t) { const a = send(o, via('ped', 'pag'), t, 0.6, 2.2, 'PedidoCriado · e-1901'), b = send(o, PSPC, t, 2.5, 3.9, 'charge c-7732');
          lit(o, 'ped', 'dped'); if (a) lit(o, 'pag'); if (b) { lit(o, 'psp', 'dpag'); o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], ['waiting for Davi', 'dim']); }
          o.cnt = [['EVENTS', a ? '1' : '0'], ['CLOCK', '20:15:00.000', 'dim'], ['SAGA OWNER', 'none', 'dim']];
          o.res = a ? [['pagamentos reacted to the fact', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: 'PedidoPago: stock listens', yk: 'THE SECOND EVENT',
        code: ['20:15:41.200  PSP → webhook: c-7732 paid', '              pagamentos: COMMIT, 58.00', '              publishes PedidoPago e-1902', 'estoque listens and tries to reserve'],
        story: 'Davi pays at <b>20:15:41.200</b>, 41.2 s later. The PSP sends a webhook, <code>pagamentos</code> saves it and publishes <code>PedidoPago</code> (<code>e-1902</code>), 58.00. <code>estoque</code> listens to that event and tries to reserve the T-shirt.',
        look: 'The webhook comes back from the PSP to pagamentos; the PedidoPago travels along the belt to stock.',
        key: 'Each step starts because an event arrived, not because someone gave an order.',
        f(o, t) { const a = send(o, rev(PSPC), t, 0.5, 1.8, 'webhook: paid'), b = send(o, via('pag', 'est'), t, 2.0, 3.6, 'PedidoPago · e-1902');
          o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); lit(o, 'psp', 'dped'); if (a) { lit(o, 'pag', 'dpag'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); } if (b) lit(o, 'est');
          o.cnt = [['EVENTS', b ? '2' : '1'], ['CLOCK', '20:15:41.200', 'dim'], ['SAGA OWNER', 'none', 'dim']];
          o.res = b ? [['stock tries to reserve', 'acc']] : []; } },
      { id: 'indisponivel', dur: 7, title: 'EstoqueIndisponivel: pagamentos is the one that undoes', yk: 'CIRCULAR DEPENDENCY',
        code: ['20:15:41.260  estoque publishes EstoqueIndisponivel', '              e-1903, reason sem_estoque', 'pagamentos listens to stock', 'stock listens to pagamentos', '→ each depends on the other'],
        story: 'At <b>20:15:41.260</b> <code>estoque</code> publishes <code>EstoqueIndisponivel</code> (<code>e-1903</code>), reason <code>sem_estoque</code>. The one that undoes is <code>pagamentos</code>, which now <b>listens to stock</b>. And <code>estoque</code> already listened to <code>pagamentos</code> (the <code>PedidoPago</code>): <b>circular dependency</b>.',
        look: 'Stock turns red and the event goes back along the belt to pagamentos. The two cables between them stay lit: one in each direction.',
        key: 'In choreography, whoever compensates has to listen to whoever failed.',
        f(o, t) { o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); lit(o, 'dpag');
          o.rows.est = act('estoque', 'SERVICE', ['listens to PedidoPago', 'dim'], ['sem_estoque', 'bad']);
          const a = send(o, via('est', 'pag', 236), t, 0.6, 2.2, 'EstoqueIndisponivel · e-1903', 'bad');
          if (a) { lit(o, 'pag'); o.rows.pag = act('pagamentos', 'SERVICE', ['listens to PedidoCriado', 'dim'], ['and EstoqueIndisponivel', 'bad']);
            o.beams.push({ pts: via('pag', 'est'), on: true }, { pts: via('est', 'pag', 236), tone: 'bad' }); T(o, [(CX.pag + CX.est) / 2, 229, 50], 'each listens to the other', 'bad'); }
          o.cnt = [['EVENTS', a ? '3' : '2'], ['DEPENDENCY', a ? 'circular' : '…', a ? 'bad' : 'dim'], ['CLOCK', '20:15:41.260', 'dim']];
          o.res = a ? [['pagamentos now listens to stock', 'bad']] : []; } },
      { id: 'estorno', dur: 6, title: 'PagamentoEstornado: 58.00 back', yk: 'THE REFUND',
        code: ['pagamentos → PSP: EstornarCobranca c-7732', '20:15:44.950  PSP: refunded', '              publishes PagamentoEstornado', '              e-1904, 58.00'],
        story: '<code>pagamentos</code> asks the PSP to refund <code>c-7732</code> and, at <b>20:15:44.950</b>, publishes <code>PagamentoEstornado</code> (<code>e-1904</code>), 58.00. The refund is one more entry, not an erasure: the charge stays on Davi\'s statement, with the refund next to it.',
        look: 'The refund request goes from pagamentos to the PSP and back; the PagamentoEstornado travels along the belt to pedidos.',
        key: 'The refund is a new transaction that undoes the effect of the charge.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); lit(o, 'pag');
          const a = send(o, PSPC, t, 0.4, 1.6, 'EstornarCobranca c-7732'), b = send(o, rev(PSPC), t, 1.8, 3.0, 'refunded'), c = send(o, via('pag', 'ped'), t, 3.2, 4.6, 'PagamentoEstornado · e-1904');
          if (a) { lit(o, 'psp'); o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['refund c-7732', 'acc'], ['58.00', 'acc']); }
          db(o, 'pag', b ? 'c-7732 · refunded' : 'c-7732 · paid 58.00', 'acc'); if (b) lit(o, 'dpag'); if (c) lit(o, 'ped');
          o.cnt = [['EVENTS', c ? '4' : '3'], ['CLOCK', b ? '20:15:44.950' : '20:15:41.300', 'dim'], ['REFUND', b ? '58.00' : '…', 'dim']];
          o.res = b ? [['58.00 back to Davi', 'acc']] : []; } },
      { id: 'cancelado', dur: 7, title: 'PedidoCancelado: 5 events on failure', yk: 'THE EVENTS',
        code: ['failure (5): PedidoCriado, PedidoPago,', '  EstoqueIndisponivel, PagamentoEstornado,', '  PedidoCancelado', 'success (4): PedidoCriado, PedidoPago,', '  EstoqueReservado, EntregaAgendada', 'where is the flow? in 4 repositories'],
        story: '<code>pedidos</code> listens to the refund, cancels 1057 and publishes <code>PedidoCancelado</code> (<code>e-1905</code>). On failure that was <b>5</b> events; on the happy path it would be <b>4</b>. The flow isn\'t anywhere: it\'s spread across four repositories, and finding 1057 means putting together the logs of all four by <code>trace_id</code> (module 6).',
        look: 'pedidos publishes the last event. The four services light up together: each one knows only its own part of the path.',
        key: 'With no center, the flow is just the sum of the listeners.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · refunded', 'acc');
          const a = send(o, [[CX.ped, 285, ZR], [CX.ped, 222, 26], [760, 222, 26]], t, 0.6, 2.4, 'PedidoCancelado · e-1905');
          db(o, 'ped', '1057 · canceled', 'acc'); lit(o, 'ped', 'dped');
          if (a) { lit(o, 'pag', 'ent'); o.on.est = 1; SVC.forEach(k => T(o, [CX[k], 335, 50], 'only its part', 'dim')); }
          o.cnt = [['EVENTS', a ? '5' : '4'], ['ON SUCCESS', '4', 'dim'], ['WHERE THE FLOW IS', 'nowhere', 'dim']];
          o.res = a ? [['1057 canceled, 58.00 refunded', 'acc'], ['5 events; the flow has no owner', 'dim']] : []; } },
      { id: 'perdido', dur: 7, title: 'What if it goes wrong: the EstoqueIndisponivel gets lost', yk: 'THE LOST MESSAGE',
        code: ['estoque publishes EstoqueIndisponivel e-1903', 'the event gets lost (lesson 9)', 'pagamentos does not refund', 'pedidos does not cancel', '1057: paid forever'],
        story: '<code>estoque</code> didn\'t find the T-shirt, and the <code>EstoqueIndisponivel</code> (<code>e-1903</code>) <b>never reaches</b> <code>pagamentos</code> (the message got lost; lesson 9 shows how). Nobody compensates. 1057 stays <code>pago</code> <b>forever</b>, and nobody knows: there is no saga owner to notice a reply is missing.',
        look: 'The event leaves stock and vanishes in the middle of the belt. pagamentos and pedidos stay still, with 1057 paid.',
        key: 'With no saga owner, nobody notices the silence.',
        f(o, t) { o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); db(o, 'ped', '1057 · paid', 'acc'); lit(o, 'dped', 'dpag');
          const path = via('est', 'pag', 236), f = go_(t, 0.6, 2.4), gone = f >= 0.55;
          if (!gone) pk(o, path, f, 'EstoqueIndisponivel · e-1903', 'bad'); else T(o, [CX.est - 40, 236, 46], 'lost', 'bad');
          if (gone) T(o, [CX.ped, 300, 54], '1057: paid forever', 'bad');
          o.cnt = [['COMPENSATIONS', '0', 'bad'], ['1057', 'paid', 'bad'], ['WHO NOTICES', 'nobody', 'dim']];
          o.res = gone ? [['nobody compensates, nobody knows', 'bad']] : []; } },
    ],
    orquestrado: [
      { id: 'inicio', dur: 6, title: 'The orchestrator receives 1057: NOVO', yk: 'COMMAND AND REPLY',
        code: ['pedidos-commands      pedidos-reply', 'pagamentos-commands   pagamentos-reply', 'estoque-commands      estoque-reply', 'entregas-commands     entregas-reply', 'the orchestrator writes to the first', 'and reads from the second'],
        story: 'Each service has a <b>command</b> topic and a <b>reply</b> topic (in the author\'s lab, <code>pagamentos-commands</code> and <code>pagamentos-reply</code>, and the same for the others). The orchestrator writes to the first and reads from the second. At 20:15:00.000 the start message arrives, the <code>PedidoCriado</code> (<code>e-1901</code>), and it saves saga <code>s-1057</code> in <code>NOVO</code> in its database.',
        look: 'The PedidoCriado goes from pedidos to the orchestrator, at the back. The orchestrator\'s panel and the saga database, next to it, show NOVO.',
        key: 'In orchestration, a single place holds the saga\'s map.',
        f(o, t) { const a = send(o, rep('ped'), t, 0.6, 2.2, 'PedidoCriado · e-1901'); lit(o, 'ped', 'dped');
          if (a) { lit(o, 'orq', 'dorq'); orq(o, 'NOVO'); dorq(o, 'NOVO', 1); }
          o.cnt = [['MESSAGES', a ? '1' : '0'], ['STATE', a ? 'NOVO' : '…', 'dim'], ['CLOCK', '20:15:00.000', 'dim']];
          o.res = a ? [['s-1057 saved: NOVO', 'acc']] : []; } },
      { id: 'cobrar', dur: 7, title: 'CobrarPedido → PedidoPago, 41.2 s later', yk: 'THE FIRST STEP',
        code: ['20:15:00.050  → CobrarPedido (COBRANDO)', '              pagamentos opens c-7732 at the PSP', '              … Davi takes 41.2 s …', '20:15:41.200  ← PedidoPago e-1902, 58.00', '              PAGO'],
        story: 'The orchestrator sends <code>CobrarPedido</code> and saves <code>COBRANDO</code> (20:15:00.050). <code>pagamentos</code> opens <code>c-7732</code> at the PSP and waits for Davi: <b>41.2 s</b>. At <b>20:15:41.200</b> the reply comes back: <code>PedidoPago</code> (<code>e-1902</code>), 58.00. The saga goes to <code>PAGO</code>.',
        look: 'The command goes down from the orchestrator to pagamentos along the back lane of the belt; the charge goes to the PSP; the clock runs; the reply comes back along the front lane.',
        key: 'The orchestrator sends a command and waits for the reply before the next step.',
        f(o, t) { lit(o, 'dped'); const a = send(o, cmd('pag'), t, 0.4, 1.6, 'CobrarPedido'), b = send(o, PSPC, t, 1.7, 2.6, 'c-7732'),
            w = lin(t, 2.7, 4.3, 0.05, 41.2), c = send(o, rev(PSPC), t, 4.4, 5.2, 'paid'), d = send(o, rep('pag'), t, 5.3, 6.5, 'PedidoPago · e-1902');
          lit(o, 'orq', 'dorq'); orq(o, d ? 'PAGO' : 'COBRANDO', d ? '' : 'waits for the reply'); dorq(o, d ? 'PAGO' : 'COBRANDO', d ? 3 : 2);
          if (a) lit(o, 'pag'); if (b) { lit(o, 'psp'); o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], [c ? 'paid: 58.00' : 'waiting for Davi', 'acc']); }
          if (c) { lit(o, 'dpag'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); }
          if (t >= 2.7 && w >= 10) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); }
          o.cnt = [['MESSAGES', String(1 + (a ? 1 : 0) + (d ? 1 : 0))], ['CLOCK', hms(t < 2.7 ? 0.05 : w, true), 'dim'], ['STATE', d ? 'PAGO' : 'COBRANDO', 'dim']];
          o.res = d ? [['PAGO: next, reserve', 'acc']] : []; } },
      { id: 'reservar', dur: 6, title: 'ReservarEstoque → failure: COMPENSANDO', yk: 'THE SECOND STEP',
        code: ['20:15:41.220  → ReservarEstoque (RESERVANDO)', '20:15:41.260  ← EstoqueIndisponivel e-1903', '              reason sem_estoque', '              COMPENSANDO', 'who decides to compensate: the orchestrator'],
        story: 'At <b>20:15:41.220</b> the orchestrator sends <code>ReservarEstoque</code> and saves <code>RESERVANDO</code>. <code>estoque</code> answers the failure, <code>EstoqueIndisponivel</code> (<code>e-1903</code>), reason <code>sem_estoque</code>, at <b>41.260</b>. The one who decides what to do is the orchestrator: <code>COMPENSANDO</code>.',
        look: 'The command goes down to stock; the reply comes back red. The orchestrator\'s panel changes to COMPENSANDO.',
        key: 'The orchestrator is the one that orders the compensation, not the service that failed.',
        f(o, t) { lit(o, 'dped', 'dpag'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          const a = send(o, cmd('est'), t, 0.4, 1.8, 'ReservarEstoque'), b = send(o, rep('est'), t, 2.2, 3.6, 'EstoqueIndisponivel · e-1903', 'bad');
          if (a) { o.on.est = 'bad'; o.rows.est = act('estoque', 'SERVICE', ['reserve 1?', 'dim'], ['sem_estoque', 'bad']); }
          lit(o, 'orq', 'dorq'); orq(o, b ? 'COMPENSANDO' : 'RESERVANDO', '', b ? 'bad' : 'acc'); dorq(o, b ? 'COMPENSANDO' : 'RESERVANDO', b ? 5 : 4);
          o.cnt = [['MESSAGES', String(3 + (a ? 1 : 0) + (b ? 1 : 0))], ['CLOCK', b ? '20:15:41.260' : '20:15:41.220', 'dim'], ['STATE', b ? 'COMPENSANDO' : 'RESERVANDO', b ? 'bad' : 'dim']];
          o.res = b ? [['business failure: compensate', 'bad']] : []; } },
      { id: 'estornar', dur: 7, title: 'EstornarCobranca → PagamentoEstornado', yk: 'THE COMPENSATION',
        code: ['20:15:41.300  → EstornarCobranca c-7732', '              (ESTORNANDO)', '              pagamentos → PSP: refund', '20:15:44.950  ← PagamentoEstornado e-1904', '              58.00'],
        story: 'At <b>20:15:41.300</b> it sends <code>EstornarCobranca c-7732</code> and saves <code>ESTORNANDO</code>. <code>pagamentos</code> asks the PSP for the refund; at <b>20:15:44.950</b> the reply comes back: <code>PagamentoEstornado</code> (<code>e-1904</code>), 58.00.',
        look: 'The command goes down to pagamentos, the refund goes to the PSP and comes back, and the reply goes up to the orchestrator.',
        key: 'The compensation is also a command with a reply.',
        f(o, t) { lit(o, 'dped'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          const a = send(o, cmd('pag'), t, 0.4, 1.6, 'EstornarCobranca'), b = send(o, PSPC, t, 1.7, 2.6, 'refund c-7732'), c = send(o, rev(PSPC), t, 2.7, 3.6, 'refunded'),
            d = send(o, rep('pag'), t, 3.7, 5.0, 'PagamentoEstornado · e-1904');
          if (a) lit(o, 'pag'); if (b) { lit(o, 'psp'); o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['refund c-7732', 'acc'], ['58.00', 'acc']); }
          lit(o, 'dpag'); db(o, 'pag', c ? 'c-7732 · refunded' : 'c-7732 · paid 58.00', 'acc');
          lit(o, 'orq', 'dorq'); orq(o, 'ESTORNANDO', d ? 'refund ok' : 'waits for the reply'); dorq(o, 'ESTORNANDO', 6);
          o.cnt = [['MESSAGES', String(5 + (a ? 1 : 0) + (d ? 1 : 0))], ['CLOCK', d ? '20:15:44.950' : '20:15:41.300', 'dim'], ['STATE', 'ESTORNANDO', 'dim']];
          o.res = d ? [['58.00 back to Davi', 'acc']] : []; } },
      { id: 'cancelar', dur: 7, title: 'CancelarPedido → CANCELADO: 8 messages', yk: 'THE MESSAGE COUNT',
        code: ['failure: 8 + 1 to start', '  charge + reply, reserve + failure,', '  refund + reply, cancel + reply', 'success: 6 (3 commands + 3 replies)', 'choreography: 5 on failure, 4 on success', 'CANCELADO in the log: 20:15:44.950'],
        story: 'Finally, <code>CancelarPedido</code> to <code>pedidos</code>, which answers <code>PedidoCancelado</code> (<code>e-1905</code>); the saga becomes <code>CANCELADO</code> (in the log, <b>20:15:44.950</b>, 44.95 s after the start). On failure that was <b>8</b> messages plus <b>1</b> to start; on success it would be <b>6</b>. Choreography used 5 and 4: the orchestrator costs more messages and pays with a place that knows everything.',
        look: 'The last command goes down to pedidos and the reply goes up. The orchestrator\'s panel and the saga database show CANCELADO.',
        key: 'More messages, but the whole flow is in one place.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · refunded', 'acc'); lit(o, 'dpag');
          const a = send(o, cmd('ped'), t, 0.4, 1.8, 'CancelarPedido'), b = send(o, rep('ped'), t, 2.0, 3.4, 'PedidoCancelado · e-1905');
          if (a) { lit(o, 'ped', 'dped'); db(o, 'ped', '1057 · canceled', 'acc'); }
          lit(o, 'orq', 'dorq'); orq(o, b ? 'CANCELADO' : 'ESTORNANDO', b ? 'final' : ''); dorq(o, b ? 'CANCELADO' : 'ESTORNANDO', b ? 7 : 6);
          o.cnt = [['MESSAGES', b ? '8 + 1' : (a ? '7 + 1' : '6 + 1')], ['ON SUCCESS', '6', 'dim'], ['CHOREOGRAPHY', '5 / 4', 'dim']];
          o.res = b ? [['CANCELADO: 44.95 s', 'acc'], ['the whole map in one place', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'What if it goes wrong: the orchestrator goes down with 200 sagas in flight', yk: 'THE CRASH',
        code: ['s-1057 in COBRANDO, waiting for the Pix', 'the orchestrator goes down: 200 sagas in flight', 'state in memory → all lost', 'state in the database → they wait for it', 'pagamentos-reply keeps the reply'],
        story: 'Back to 1057 in <code>COBRANDO</code>, waiting for the Pix. The orchestrator goes down with <b>200</b> sagas in progress (example). If their state lived in its <b>memory</b>, all of them would be lost: the services did the steps, and nobody would know which step each order is at. 1057 <b>waits</b>: the <code>PedidoPago</code> stays on the <code>pagamentos-reply</code> topic, with nobody to read it.',
        look: 'The orchestrator turns red. pagamentos\' reply goes up the belt and stops before arriving; the saga database, next to it, still holds COBRANDO.',
        key: 'An orchestrator that keeps the sagas in memory loses them when it goes down.',
        f(o, t) { const down = t > 0.6; lit(o, 'dped', 'dpag', 'dorq'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); o.rows.psp = act('PSP', 'OUTSIDE THE STORE', ['Pix c-7732', 'acc'], ['paid: 58.00', 'acc']);
          o.on.orq = down ? 'bad' : 1; o.rows.orq = act('orchestrator', down ? 'DOWN' : '', ['200 sagas in flight', down ? 'bad' : 'dim'], [down ? 'crashed' : 'COBRANDO', down ? 'bad' : 'acc']);
          dorq(o, 'COBRANDO', 2); const r = rep('pag'), f = Math.min(go_(t, 1.4, 3.6), 0.78); pk(o, r, Math.max(f, 0.001), f >= 0.78 ? 'PedidoPago waiting' : 'PedidoPago · e-1902');
          if (f >= 0.78) o.beams.push({ pts: r, tone: 'bad' });
          o.cnt = [['SAGAS IN FLIGHT', '200', down ? 'bad' : ''], ['1057', 'waiting', 'dim'], ['IN THE DB', 'COBRANDO', 'dim']];
          o.res = down ? [['nobody reads pagamentos-reply', 'bad']] : []; } },
      { id: 'volta', dur: 7, title: 'State in a database: it comes back and carries on', yk: 'THE RESUMPTION',
        code: ['the orchestrator comes back', 'reads the database: s-1057 = COBRANDO', 'reads pagamentos-reply: PedidoPago e-1902', 's-1057 → PAGO', '→ ReservarEstoque', 'the 200 sagas resume from their last state'],
        story: 'That\'s why the state lives in a <b>database</b>. When the orchestrator comes back, it reads the table, sees 1057 in <code>COBRANDO</code> and carries on from where it stopped: it reads the <code>PedidoPago</code> that was waiting on the topic, saves <code>PAGO</code> and sends <code>ReservarEstoque</code>. The other sagas resume from the last saved state. Lesson 6 shows what structure that is.',
        look: 'The orchestrator lights up again, reads the saga database next to it (COBRANDO), gets the reply it was waiting for and sends the next command to stock.',
        key: 'Durable state in a database turns the crash into a pause.',
        f(o, t) { lit(o, 'dped', 'dpag'); db(o, 'pag', 'c-7732 · paid 58.00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); 
          const rd = send(o, rev(ORQB), t, 0.5, 1.4, 'reads: COBRANDO'), a = send(o, rep('pag'), t, 1.6, 2.6, 'PedidoPago · e-1902'), b = send(o, cmd('est'), t, 3.0, 4.4, 'ReservarEstoque');
          lit(o, 'orq', 'dorq'); o.rows.orq = act('orchestrator', 'BACK UP', ['saga s-1057', 'dim'], [a ? (b ? 'RESERVANDO' : 'PAGO') : rd ? 'COBRANDO (read)' : 'starting…', 'acc']);
          dorq(o, a ? (b ? 'RESERVANDO' : 'PAGO') : 'COBRANDO', a ? (b ? 4 : 3) : 2); if (b) lit(o, 'est');
          o.cnt = [['STATE', a ? (b ? 'RESERVANDO' : 'PAGO') : 'COBRANDO'], ['SAGAS LOST', '0', 'dim'], ['RESUMES FROM', 'COBRANDO', 'dim']];
          o.res = b ? [['carried on from where it stopped', 'acc']] : []; } },
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
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.5 : W_ - 10); x.fillText(d.name, u(5), u(13)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 11, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(13)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, small = H_ < 80;
    head(x, u, d, W_, col, small ? 17 : 21); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(25)); x.lineTo(u(W_ - 4), u(25)); x.stroke();
    let y = small ? 39 : 43; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, small ? 14 : 18, W_ - 10); x.fillText(text, u(5), u(y)); } y += small ? 17 : 23; }
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
  const LOGTAB = `<table class="h3-sum"><tr><th>at</th><th>from → to</th><th>event</th></tr>${[['20:15:00', '— → NOVO', 'e-1901'], ['20:15:00.05', 'NOVO → COBRANDO', ''], ['20:15:41.2', 'COBRANDO → PAGO', 'e-1902'], ['20:15:41.22', 'PAGO → RESERVANDO', ''], ['20:15:41.26', 'RESERVANDO → COMPENSANDO', 'e-1903'], ['20:15:41.3', 'COMPENSANDO → ESTORNANDO', ''], ['20:15:44.95', 'ESTORNANDO → CANCELADO', 'e-1904']].map((r, i) => `<tr${i === 6 ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
  const DATA = {
    'sem-saga': () => `<li>Order <b>1057</b> (Davi, SP, Black Friday, 20:15:00.000): 1 black T-shirt <code>CAMISETA-015</code> 49.00 + SP shipping 9.00 = <b>58.00</b>, Pix, charge <code>c-7732</code></li><li>20:15:10: damage write-off, stock <b>1 → 0</b> (the page said "last unit": 60 s cache, module 5)</li><li>20:15:41.200: paid, <b>41.2 s</b> later; 20:15:41.260: <code>EstoqueIndisponivel</code> <code>e-1903</code>, <code>sem_estoque</code></li><table class="h3-sum"><tr><th>calculation</th><th>result</th></tr><tr><td>20:15:41 → 23:00 (reconciliation)</td><td>2 h 44 min</td></tr><tr class="on"><td>30 orders/s × 41.2 s</td><td>1,236 open transactions</td></tr><tr><td>30 × 300 s (example)</td><td>9,000</td></tr><tr><td>30 × 1,800 s (example)</td><td>54,000</td></tr></table><li>2PC (Fowler): "prepare" and then "commit"; it blocks if the coordinator goes down; the PSP and Kafka don\'t take part</li>`,
    'state-machine': () => `<li>Real log of <code>s-1057</code> (PostgreSQL 14.24, Oct 20, 2026): 7 transitions; <code>saga</code> ends in <code>CANCELADO</code>, <code>versao = 7</code></li>${LOGTAB}<li>Duplicate of <code>e-1902</code> at 20:15:41.210: <code>transitar('s-1057','COBRANDO','PAGO',…)</code> = <b>f</b>, nothing in the log</li><li>Watchdog: <code>estado NOT IN ('FINALIZADO','CANCELADO') AND atualizada_em &lt; now() − interval '30 minutes'</code> → <code>s-teste</code> in <code>COBRANDO</code> since 19:20</li><li>Countermeasures for the lack of isolation (microservices.io): semantic lock, commutative updates, reread the value</li>`,
    coreografado: () => `<table class="h3-sum"><tr><th>event</th><th>publishes</th><th>listens</th></tr><tr><td>PedidoCriado e-1901</td><td>pedidos</td><td>pagamentos</td></tr><tr><td>PedidoPago e-1902</td><td>pagamentos</td><td>estoque</td></tr><tr class="on"><td>EstoqueIndisponivel e-1903</td><td>estoque</td><td>pagamentos</td></tr><tr><td>PagamentoEstornado e-1904</td><td>pagamentos</td><td>pedidos</td></tr><tr><td>PedidoCancelado e-1905</td><td>pedidos</td><td>—</td></tr></table><li>Success: 4 events (<code>PedidoCriado</code>, <code>PedidoPago</code>, <code>EstoqueReservado</code>, <code>EntregaAgendada</code>); failure: <b>5</b></li><li>microservices.io: each local transaction publishes domain events that trigger local transactions in other services</li><li>Correction to the article: the service publishes the fact and doesn\'t know who listens; calling the next one directly is a point-to-point chain</li>`,
    orquestrado: () => `<table class="h3-sum"><tr><th>#</th><th>message</th><th>state</th></tr><tr><td>0</td><td>PedidoCriado e-1901 (start)</td><td>NOVO</td></tr><tr><td>1–2</td><td>CobrarPedido · PedidoPago e-1902</td><td>COBRANDO → PAGO</td></tr><tr><td>3–4</td><td>ReservarEstoque · EstoqueIndisponivel e-1903</td><td>RESERVANDO → COMPENSANDO</td></tr><tr><td>5–6</td><td>EstornarCobranca · PagamentoEstornado e-1904</td><td>ESTORNANDO</td></tr><tr class="on"><td>7–8</td><td>CancelarPedido · PedidoCancelado e-1905</td><td>CANCELADO</td></tr></table><li>Success: <b>6</b> (3 commands + 3 replies); failure: <b>8</b>, plus 1 to start; choreography: 4 / 5</li><li>Author\'s lab (read in the code): topics <code>&lt;service&gt;-commands</code> and <code>&lt;service&gt;-reply</code>, table <code>saga_events</code></li><li>200 sagas in flight: example</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botões do passo: a espera do Pix (Sem saga, último passo)
  function actHtml() { if (cur().act !== 'espera') return '';
    return `<div class="o3-mode r3-act" role="group" aria-label="Pix wait">${ESP.map(([s, lab], i) => `<button data-esp="${i}" aria-pressed="${i === esp}">${lab}<small>30 × ${i ? thou(s) + ' s' : '41.2 s'}</small></button>`).join('')}</div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'saga') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'saga' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-saga3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'saga') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const p = e.target.closest('[data-esp]'); if (p) { esp = +p.dataset.esp; lt = 0; render(); SFX.bit(1); } });
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
    // a prancha do PSP afunda junto com ele
    const fp = ease(clamp(B.psp.f)); pspG.visible = B.psp.f > 0.01; pspG.position.copy(W(...PSPAT, -(1 - fp) * 12));
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
      const [x0, x1, y0, y1] = fam() === 'M' ? [24, 790, 20, 445] : [24, 960, 20, 445];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.86 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.47 : nar ? 0.07 + aH * 0.6 : 0.55;
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
    view: NARROW() ? { target: W(490, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(220, 230, 60), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
