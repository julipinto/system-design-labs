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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
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
  const SCNAME = { 'sem-saga': 'Sem saga', 'state-machine': 'State-machine', coreografado: 'Coreografado', orquestrado: 'Orquestrado' };
  const SCFULL = { 'sem-saga': 'Sem saga: o pedido preso', 'state-machine': 'A saga como máquina de estados', coreografado: 'Saga coreografada', orquestrado: 'Saga orquestrada' };
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
  const DB = { ped: '1057 · criado', pag: 'c-7732 · aberta', est: 'CAMISETA-015 · 1', ent: 'nada agendado' };
  const db = (o, k, text, tone = 'dim') => { o.rows['d' + k] = act('banco · ' + { ped: 'pedidos', pag: 'pagamentos', est: 'estoque', ent: 'entregas' }[k], '', [text, tone]); };
  // a ficha da saga andando pelos estados: entra em cada um no instante a + i × dt
  const TILE = { NOVO: ['pedido criado'], COBRANDO: ['cobra c-7732', 'desfaz: estorno'], PAGO: ['PedidoPago'], RESERVANDO: ['reserva', 'desfaz: liberar'],
    RESERVADO: ['estoque ok'], AGENDANDO: ['agenda', 'desfaz: cancelar'], FINALIZADO: ['final'], COMPENSANDO: ['escolhe o desfazer'],
    ESTORNANDO: ['EstornarCobranca'], CANCELADO: ['final'], INTERVENCAO: ['final: chama gente'] };
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
      o.rows.ped = act('pedidos', 'SERVIÇO', ['grava o pedido', 'dim']);
      o.rows.pag = act('pagamentos', 'SERVIÇO', ['cobra pelo PSP', 'dim']);
      o.rows.est = act('estoque', 'SERVIÇO', ['reserva a camiseta', 'dim']);
      o.rows.ent = act('entregas', 'SERVIÇO', ['agenda a entrega', 'dim']);
      SVC.forEach(k => db(o, k, DB[k]));
      o.rows.bus = act('Kafka', sc === 'orquestrado' ? 'COMANDOS E RESPOSTAS' : 'ESTEIRA DE EVENTOS',
        [sc === 'orquestrado' ? 'pagamentos-commands · pagamentos-reply · …' : 'quem quiser escuta', 'dim']);
      o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix', 'dim'], ['c-7732', 'dim']);
      o.rows.orq = act('orquestrador', '', ['saga s-1057', 'dim'], ['—', 'dim']);
      o.rows.dorq = act('banco · saga', '', ['s-1057', 'dim'], ['—', 'dim']);
      o.beams.push(...SVC.map(k => ({ pts: [[CX[k], 285, ZR], [CX[k], 245, ZR]] })), { pts: PSPC });
      if (sc === 'orquestrado') o.beams.push({ pts: [[OX + 20, 165, ZR], [OX + 20, 195, ZR]] }, { pts: ORQB });
    } else {
      show(...Object.keys(ST).map(s => 's' + s), 'vig');
      Object.keys(ST).forEach(s => { o.rows['s' + s] = act(s, '', ...TILE[s].map((l, j) => [l, j ? 'acc' : 'dim'])); });
      o.rows.vig = act('vigia', 'A CADA MINUTO', ['estado NOT IN (FINALIZADO, CANCELADO)', 'dim'], ['e parada há mais de 30 min', 'dim']);
      o.beams.push(...SBP.map(pts => ({ pts })), { pts: SDOWN }, { pts: SCOMP }, { pts: SCAN }, { pts: SINT });
    }
    return o;
  }
  const beamOnSM = (o, pts) => o.beams.push({ pts, on: true });
  // o quadro do orquestrador e o banco da saga
  const orq = (o, st, extra, tone = 'acc') => { o.rows.orq = act('orquestrador', '', ['saga s-1057', 'dim'], [st, tone], extra && [extra, 'dim']); };
  const dorq = (o, st, v) => { o.rows.dorq = act('banco · saga', '', ['s-1057', 'dim'], [st + ' · v' + v, 'acc']); };
  const ESP = [[41.2, '41,2 s'], [300, '5 min'], [1800, '30 min']];

  // ── o que se vê em cada passo ──
  const STEPS = {
    'sem-saga': [
      { id: 'pedido', dur: 5, title: '20:15:00.000: o pedido 1057, 58,00 no Pix', yk: 'O PEDIDO',
        code: ['20:15:00.000  pedidos: INSERT 1057, COMMIT', '              publica PedidoCriado e-1901', '20:15:00.050  pagamentos: cobrança Pix c-7732', '1 camiseta preta 49,00 + frete SP 9,00', '= 58,00'],
        story: 'Às <b>20:15:00.000</b> da Black Friday o Davi, de SP, cria o pedido <b>1057</b>: <b>1 camiseta preta</b> (<code>CAMISETA-015</code>, 49,00) mais frete de SP (9,00), <b>58,00</b>, a pagar por <b>Pix</b> num PSP externo. O <code>pedidos</code> grava no seu banco e publica <code>PedidoCriado</code> (<code>e-1901</code>); o <code>pagamentos</code> abre a cobrança <code>c-7732</code> no PSP. O estoque ainda tem <b>1</b> camiseta.',
        look: 'O PedidoCriado sai do pedidos, anda pela esteira do Kafka e desce no pagamentos, que manda a cobrança ao PSP, na prancha de fora. Embaixo de cada serviço, o seu banco.',
        key: 'Cada serviço grava no seu banco; nenhum enxerga o banco do outro.',
        f(o, t) { const a = send(o, via('ped', 'pag'), t, 0.6, 2.2, 'PedidoCriado · e-1901'), b = send(o, PSPC, t, 2.5, 3.9, 'cobrança Pix c-7732');
          lit(o, 'ped', 'dped'); if (a) lit(o, 'pag'); if (b) lit(o, 'psp', 'dpag');
          o.rows.ped = act('pedidos', 'SERVIÇO', ['pedido 1057 · Davi, SP', 'dim'], ['58,00', 'acc']);
          if (b) o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], ['esperando o Davi', 'dim']);
          o.cnt = [['RELÓGIO', b ? '20:15:00.050' : '20:15:00.000'], ['PEDIDO', '58,00', 'dim'], ['ESTOQUE', '1', 'dim']];
          o.res = b ? [['cobrança c-7732 aberta', 'acc']] : []; } },
      { id: 'avaria', dur: 5, title: '20:15:10: a camiseta some', yk: 'A AVARIA',
        code: ['20:15:10  Logística: baixa por avaria', '          CAMISETA-015: 1 → 0', 'pedido 1057: de pé', 'cobrança c-7732: esperando o Davi', 'nenhum evento sai'],
        story: 'Às <b>20:15:10</b> a Logística dá baixa por avaria da única camiseta, e o estoque vai de 1 para <b>0</b>. O pedido do Davi continua de pé: ele ainda não pagou, e nenhum serviço sabe que o estoque acabou. A página do produto dizia "última unidade": era o cache de 60 s do módulo 5.',
        look: 'O banco do estoque passa de 1 para 0 e fica vermelho. Nada sai pela esteira: o pedidos e o pagamentos não ficam sabendo.',
        key: 'O estoque mudou no banco de um serviço só, e os outros seguem com o pedido.',
        f(o, t) { const z = t > 0.9; lit(o, 'dped'); o.on.dest = z ? 'bad' : 1; o.on.est = 2;
          db(o, 'est', z ? 'CAMISETA-015 · 0' : 'CAMISETA-015 · 1', z ? 'bad' : 'acc');
          o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], ['esperando o Davi', 'dim']); lit(o, 'psp');
          if (z) T(o, [CX.est, 418, 40], 'avaria: 1 → 0', 'bad');
          o.cnt = [['RELÓGIO', '20:15:10'], ['ESTOQUE', z ? '0' : '1', z ? 'bad' : 'dim'], ['PEDIDO', 'de pé', 'dim']];
          o.res = z ? [['ninguém mais sabe', 'bad']] : []; } },
      { id: 'pix', dur: 6, title: '20:15:41.200: o Davi paga, 41,2 s depois', yk: 'O PAGAMENTO',
        code: ['20:15:41.200  o Davi aprova o Pix no banco', '              PSP → webhook: c-7732 paga', '              pagamentos: COMMIT, 58,00', '              publica PedidoPago e-1902', 'espera do Davi: 41,2 s'],
        story: 'Às <b>20:15:41.200</b>, <b>41,2 s</b> depois de criar o pedido, o Davi aprova o Pix no app do banco. O PSP avisa a loja por webhook, o <code>pagamentos</code> grava a cobrança como paga e publica <code>PedidoPago</code> (<code>e-1902</code>), 58,00. O <code>pedidos</code> marca o 1057 como pago.',
        look: 'O relógio corre 41,2 s. Depois o webhook volta do PSP ao pagamentos, e o PedidoPago anda pela esteira até o pedidos e até o estoque.',
        key: 'O dinheiro já saiu da conta do Davi: daqui em diante, desfazer custa um estorno.',
        f(o, t) { const w = lin(t, 0.3, 2.3, 10, 41.2), a = send(o, rev(PSPC), t, 2.4, 3.6, 'webhook: paga'), b = send(o, via('pag', 'est'), t, 3.8, 5.2, 'PedidoPago · e-1902'),
            c = send(o, via('pag', 'ped', 236), t, 3.8, 5.0, '');
          lit(o, 'psp'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          if (a) { lit(o, 'pag', 'dpag'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); }
          if (c) { lit(o, 'ped', 'dped'); db(o, 'ped', '1057 · pago', 'acc'); }
          if (b) lit(o, 'est');
          o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], [w < 41.2 ? 'esperando o Davi' : 'pago: 58,00', 'acc']);
          o.cnt = [['RELÓGIO', hms(w, w >= 41.2)], ['ESPERA', dec(w) + ' s', 'dim'], ['PAGO', a ? '58,00' : '…', 'dim']];
          o.res = a ? [['o dinheiro saiu da conta do Davi', 'acc']] : []; } },
      { id: 'falha', dur: 6, title: '20:15:41.260: o estoque responde "sem estoque"', yk: 'A RESERVA',
        code: ['20:15:41.220  estoque: reservar CAMISETA-015', '              estoque = 0', '20:15:41.260  publica EstoqueIndisponivel', '              e-1903, motivo sem_estoque', 'quem escuta? ninguém'],
        story: 'Com o dinheiro na mão, a loja manda reservar a camiseta às <b>20:15:41.220</b>, e o <code>estoque</code> responde <code>EstoqueIndisponivel</code> (<code>e-1903</code>), motivo <code>sem_estoque</code>, às <b>20:15:41.260</b>. A ordem da loja vem do módulo 6: cobrar, reservar, agendar a entrega.',
        look: 'O estoque fica vermelho e publica o EstoqueIndisponivel na esteira. O evento anda até o fim do Kafka e nenhum serviço o pega.',
        key: 'Faltar estoque não é bug: é uma resposta válida, e alguém precisa ter um plano para ela.',
        f(o, t) { const r = t > 0.8; o.on.est = r ? 'bad' : 1; o.on.dest = 'bad'; lit(o, 'dped', 'dpag');
          db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); db(o, 'ped', '1057 · pago', 'acc');
          o.rows.est = act('estoque', 'SERVIÇO', ['reservar 1?', 'dim'], [r ? 'sem_estoque' : '…', r ? 'bad' : 'dim']);
          const lost = [[CX.est, 285, ZR], [CX.est, 222, 26], [760, 222, 26]], e = send(o, lost, t, 1.2, 3.6, 'EstoqueIndisponivel · e-1903', 'bad');
          if (e) T(o, [740, 222, 50], 'ninguém escuta', 'bad');
          o.cnt = [['RELÓGIO', r ? '20:15:41.260' : '20:15:41.220'], ['RESERVA', r ? 'falhou' : '…', r ? 'bad' : 'dim'], ['QUEM ESCUTA', 'ninguém', 'dim']];
          o.res = e ? [['o evento passou e ninguém agiu', 'bad']] : []; } },
      { id: 'preso', dur: 6, title: 'Sem saga: pago e sem camiseta', yk: 'COMO FICOU',
        code: ['pedidos     1057: pago', 'pagamentos  c-7732: paga, 58,00 com a loja', 'estoque     CAMISETA-015: 0', 'entregas    nada a entregar', 'conciliação: só às 23:00'],
        story: 'Sem saga, ninguém sabe o que fazer com o <code>EstoqueIndisponivel</code>. O pedido fica <code>pago</code>, o dinheiro está com a loja, a camiseta não existe. O Davi tem <b>R$ 58,00 a menos</b> e nenhuma camiseta. O único que acharia o caso é o relatório de conciliação das <b>23:00</b> (módulo 6), <b>2 h 44 min</b> depois do pagamento.',
        look: 'Os quatro bancos ficam como estão: 1057 pago, 58,00 recebidos, estoque 0, nada agendado. Nenhum cabo acende, e o relógio corre até as 23:00.',
        key: 'Cada COMMIT local deu certo; o conjunto ficou errado, e ninguém é dono do conjunto.',
        f(o, t) { const c = lin(t, 0.5, 4.5, 41.2, 9900);
          lit(o, 'dped', 'dpag'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); db(o, 'ped', '1057 · pago', 'acc');
          o.rows.ped = act('pedidos', 'SERVIÇO', ['1057: pago', 'acc'], ['sem camiseta', 'bad']);
          T(o, [CX.ped, 300, 54], 'pago e sem estoque', 'bad');
          o.cnt = [['RELÓGIO', hms(c, null)], ['ATÉ ALGUÉM VER', c >= 9900 ? '2 h 44 min' : '…', c >= 9900 ? 'bad' : 'dim'], ['DAVI', '−58,00', 'bad']];
          o.res = [['o Davi pagou e não leva nada', 'bad']]; } },
      { id: '2pc', dur: 7, title: 'E o two-phase commit? O PSP não prepara', yk: 'O 2PC',
        code: ['fase 1  coordenador → "prepara?"', '        estoque   pronto (trava aberta)', '        entregas  pronto (trava aberta)', '        PSP       não existe "prepara o Pix"', 'fase 2  "efetiva" nunca sai'],
        story: 'A loja tenta o <i>two-phase commit</i>: um coordenador pergunta a todos "prepara?" e, quando todos respondem "pronto", manda "efetiva" (Fowler). Não existe "prepara o Pix": a cobrança <code>c-7732</code> já saiu no momento em que o Davi aprovou no app do banco, e o PSP só conhece "cobrar" e "estornar". E se o coordenador cai entre as fases, os bancos ficam <b>bloqueados</b> esperando a decisão.',
        look: 'O coordenador sobe atrás e manda "prepara?" ao estoque, ao entregas e ao PSP. Os dois serviços respondem "pronto"; o PSP fica vermelho, sem resposta para dar.',
        key: 'O 2PC precisa que todos saibam preparar; um sistema de fora não sabe.',
        f(o, t) { o.show.orq = 1; o.rows.orq = act('coordenador', '2PC', ['fase 1: prepara?', 'acc'], [t > 4 ? 'esperando o PSP' : '…', t > 4 ? 'bad' : 'dim']); lit(o, 'orq');
          o.beams.push({ pts: [[OX + 20, 165, ZR], [OX + 20, 195, ZR]] });
          const a = send(o, cmd('est'), t, 0.6, 2.0, 'prepara?'), b = send(o, cmd('ent'), t, 0.8, 2.2, ''), p = send(o, [[640, 120, ZR], [790, 120, 40], [PSPAT[0] + 80, PSPAT[1] + 15, 50]], t, 1.0, 2.4, 'prepara?');
          const ra = send(o, rep('est'), t, 2.6, 3.8, 'pronto'), rb = send(o, rep('ent'), t, 2.8, 4.0, '');
          if (a) lit(o, 'est'); if (b) lit(o, 'ent');
          if (ra) { o.rows.est = act('estoque', 'SERVIÇO', ['pronto', 'acc'], ['trava aberta', 'bad']); o.on.dest = 'bad'; db(o, 'est', 'travado na fase 1', 'bad'); }
          if (rb) { o.rows.ent = act('entregas', 'SERVIÇO', ['pronto', 'acc'], ['trava aberta', 'bad']); o.on.dent = 'bad'; db(o, 'ent', 'travado na fase 1', 'bad'); }
          if (p) { o.on.psp = 'bad'; o.rows.psp = act('PSP', 'FORA DA LOJA', ['prepara?', 'bad'], ['só cobra e estorna', 'dim']); T(o, [PSPAT[0] + 80, PSPAT[1] + 100, 60], 'não existe prepare', 'bad'); }
          o.cnt = [['PRONTOS', (ra ? 1 : 0) + (rb ? 1 : 0) + ' de 3'], ['PSP', p ? 'sem prepare' : '…', p ? 'bad' : 'dim'], ['TRAVAS', ra ? 'abertas' : '…', 'dim']];
          o.res = rb && p ? [['"efetiva" nunca sai', 'bad']] : []; } },
      { id: 'trava', dur: 8, title: 'E se der errado: a espera do Pix segura a trava', yk: 'A CONTA DA TRAVA', act: 'espera',
        code: ['30 pedidos/s × 41,2 s  = 1.236', '30 pedidos/s × 300 s   = 9.000', '30 pedidos/s × 1.800 s = 54.000', 'cada uma: uma conexão e uma trava', '5 e 30 min: exemplos'],
        story: 'Se o <code>estoque</code> segurasse a trava da camiseta enquanto o Davi decide, ela ficaria aberta a espera inteira. A 30 pedidos por segundo, com os <b>41,2 s</b> do Davi, seriam 30 × 41,2 = <b>1.236</b> transações abertas ao mesmo tempo, cada uma com a sua conexão e a sua trava. Aumente a espera do Pix nos botões acima e veja a fila crescer; depois volte para 41,2 s e compare.',
        look: 'A trava fica sobre a CAMISETA-015, no banco do estoque. Atrás dela, na esteira, a fila de pedidos que esperam cresce enquanto o relógio corre.',
        key: 'Trava aberta durante a espera do cliente para a loja; a saga não segura trava entre um passo e outro.',
        f(o, t) { const [s, lab] = ESP[esp], k = clamp((t - 0.4) / 4), n = 30 * s * k;
          o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · travada', 'bad');
          o.rows.est = act('estoque', 'TRAVA', ['segura a linha', 'bad'], ['espera: ' + lab, 'dim']);
          const q = Math.min(12, Math.ceil(k * (esp === 0 ? 6 : esp === 1 ? 10 : 12)));
          for (let i = 0; i < q; i++) o.dots.push([[CX.est - 18 - i * 22, 222, 30], 'bad']);
          o.beams.push({ pts: [[CX.est, 285, ZR], [CX.est, 222, 26], [CX.est - 30 - 22 * 12, 222, 26]], tone: 'bad' });
          T(o, [CX.est - 140, 222, 60], 'fila: ' + thou(n) + ' esperando', 'bad');
          o.cnt = [['TRANSAÇÕES ABERTAS', thou(n), 'bad'], ['ESPERA DO PIX', lab, 'dim'], ['PEDIDOS/S', '30', 'dim']];
          o.res = k >= 1 ? [['30 × ' + (esp ? thou(s) + ' s' : '41,2 s') + ' = ' + thou(30 * s), 'bad']] : []; } },
    ],
    'state-machine': [
      { id: 'estados', dur: 5, title: 'Os estados da saga s-1057', yk: 'PASSO E DESFAZER',
        code: ['CriarPedido      → CancelarPedido', 'CobrarPedido     → EstornarCobranca', 'ReservarEstoque  → LiberarEstoque', 'AgendarEntrega   → CancelarEntrega', 'finais: FINALIZADO, CANCELADO, INTERVENCAO'],
        story: 'A saga guarda em que passo o pedido está. Os estados da loja: o caminho feliz <code>NOVO → COBRANDO → PAGO → RESERVANDO → RESERVADO → AGENDANDO → FINALIZADO</code>; a falha <code>… → COMPENSANDO → ESTORNANDO → CANCELADO</code>; e <code>INTERVENCAO</code>, para quando a compensação não passa. Cada passo local tem o seu desfazer: criar o pedido (<code>CancelarPedido</code>), cobrar (<code>EstornarCobranca</code>), reservar (<code>LiberarEstoque</code>), agendar (<code>CancelarEntrega</code>).',
        look: 'O caminho feliz anda pela fileira de trás e desce pela coluna da direita até FINALIZADO. A volta corre na fileira do meio, da direita para a esquerda. Na frente, INTERVENCAO, o único estado final que chama gente. A ficha s-1057 está em NOVO.',
        key: 'Cada passo tem um desfazer, escrito antes de a saga rodar.',
        f(o, t) { walk(o, ['NOVO'], t, 0, 1, () => 's-1057 · NOVO'); o.on.sFINALIZADO = o.on.sCANCELADO = o.on.sINTERVENCAO = 2;
          o.cnt = [['ESTADO', 'NOVO'], ['ESTADOS', '11', 'dim'], ['FINAIS', '3', 'dim']];
          o.res = [['passos locais + compensações', 'acc']]; } },
      { id: 'feliz', dur: 7, title: 'O caminho feliz: até FINALIZADO', yk: 'SÓ PARA A FRENTE',
        code: ['NOVO       → COBRANDO    cobra c-7732', 'COBRANDO   → PAGO        PedidoPago', 'PAGO       → RESERVANDO  reserva', 'RESERVANDO → RESERVADO   EstoqueReservado', 'RESERVADO  → AGENDANDO   agenda a entrega', 'AGENDANDO  → FINALIZADO  EntregaAgendada'],
        story: 'Se a camiseta não tivesse sido avariada, o 1057 andaria só pelo caminho de cima e da direita: cobra, recebe o <code>PedidoPago</code>, reserva, agenda a entrega e termina em <code>FINALIZADO</code>. Nenhuma compensação.',
        look: 'A ficha anda de ladrilho em ladrilho pela fileira de trás, desce pela coluna da direita e para em FINALIZADO.',
        key: 'No caminho feliz a saga só anda para a frente.',
        f(o, t) { const i = walk(o, HAPPY, t, 0.5, 0.8, s => 's-1057 · ' + s);
          for (let j = 0; j < i; j++) beamOnSM(o, SBP[j]);
          o.cnt = [['ESTADO', HAPPY[i]], ['PASSOS FEITOS', String(i), 'dim'], ['COMPENSAÇÕES', '0', 'dim']];
          o.res = i === 6 ? [['FINALIZADO, sem desfazer nada', 'acc']] : []; } },
      { id: 'falha', dur: 8, title: 'O 1057 de verdade: 2 compensações, em ordem inversa', yk: 'O LOG DA s-1057',
        code: ['20:15:00.000  NOVO         e-1901', '20:15:00.050  COBRANDO', '20:15:41.200  PAGO         e-1902', '20:15:41.220  RESERVANDO', '20:15:41.260  COMPENSANDO  e-1903', '20:15:41.300  ESTORNANDO', '20:15:44.950  CANCELADO    e-1904'],
        story: 'Agora o 1057 real. <code>NOVO</code> às 20:15:00.000, <code>COBRANDO</code> às 00.050, <code>PAGO</code> às 41.200, <code>RESERVANDO</code> às 41.220. O estoque responde <code>EstoqueIndisponivel</code> (<code>e-1903</code>) e a saga desce para <code>COMPENSANDO</code> às 41.260. Ela desfaz na <b>ordem inversa</b>: primeiro estorna a cobrança (<code>ESTORNANDO</code>, 41.300), depois cancela o pedido: <code>CANCELADO</code> às <b>20:15:44.950</b>. Duas compensações; a reserva nunca existiu, então não há o que liberar.',
        look: 'A ficha anda até RESERVANDO, desce para a fileira do meio e volta para a esquerda: ESTORNANDO, depois CANCELADO.',
        key: 'Compensa-se só o que já foi feito, do mais novo para o mais velho.',
        f(o, t) { const i = walk(o, FAIL, t, 0.5, 0.9, (s, k) => s + ' · ' + hms(LOGT[k]));
          [SBP[0], SBP[1], SBP[2], SDOWN, SCOMP, SCAN].slice(0, i).forEach(p => beamOnSM(o, p));
          if (i >= 4) o.on.sRESERVANDO = 'bad';
          const nc = i >= 6 ? 2 : i >= 5 ? 1 : 0;
          o.cnt = [['ESTADO', FAIL[i], i >= 4 ? 'bad' : ''], ['RELÓGIO', hms(LOGT[i]), 'dim'], ['COMPENSAÇÕES', String(nc), 'dim']];
          o.res = i === 6 ? [['estorno, depois cancelamento', 'acc'], ['44,95 s; o Davi recebe 58,00 de volta', 'acc']] : []; } },
      { id: 'isolamento', dur: 6, title: 'Sem isolamento: o meio aparece para os outros', yk: 'ACD SEM O I',
        code: ['saga em RESERVANDO: a unidade fica reservada', 'outro cliente lê: esgotado', 'a saga falha adiante: libera', 'o outro cliente já foi embora', 'bloqueio semântico: RESERVA_PENDENTE'],
        story: 'A Saga é <b>ACD sem o I</b>: tem atomicidade (por compensação), consistência e durabilidade, mas não tem <b>isolamento</b>. Enquanto a saga está em <code>RESERVANDO</code>, a camiseta fica reservada. Se a saga vai falhar mais adiante, durante alguns segundos o estoque mostra "esgotado" para <b>outros clientes</b>, que, quando a reserva for liberada, já foram embora. A contramedida mais direta é o <b>bloqueio semântico</b>: o estado <code>RESERVA_PENDENTE</code> fica visível, e quem lê sabe que aquela unidade pode voltar.',
        look: 'A ficha para em RESERVANDO. Em cima do ladrilho, o que os outros clientes leem: primeiro "esgotado", depois RESERVA_PENDENTE.',
        key: 'Os estados do meio da saga são visíveis; é preciso desenhar para isso.',
        f(o, t) { walk(o, ['RESERVANDO'], t, 0, 1, () => 's-1057 · RESERVANDO'); o.on.sNOVO = o.on.sCOBRANDO = o.on.sPAGO = 2;
          [SBP[0], SBP[1], SBP[2]].forEach(p => beamOnSM(o, p)); const sem = t > 3;
          T(o, [TC(3), 150, 80], sem ? 'outros leem: RESERVA_PENDENTE' : 'outros clientes leem: esgotado', sem ? 'acc' : 'bad');
          o.cnt = [['ESTADO', 'RESERVANDO'], ['OUTROS CLIENTES', sem ? 'RESERVA_PENDENTE' : 'esgotado', sem ? 'dim' : 'bad'], ['ISOLAMENTO', 'nenhum', 'dim']];
          o.res = sem ? [['quem lê sabe que a unidade pode voltar', 'acc']] : [['o estado do meio vazou', 'bad']]; } },
      { id: 'duplicata', dur: 7, title: 'O PedidoPago chega duas vezes: f', yk: 'A TRANSIÇÃO CONDICIONAL',
        code: ["UPDATE saga SET estado = 'PAGO',", '       versao = versao + 1', "WHERE saga_id = 's-1057'", "  AND estado = 'COBRANDO';", '0 linhas: transitar devolve f', 'nada é escrito no log'],
        story: 'Às <b>20:15:41.210</b> o mesmo <code>PedidoPago</code> (<code>e-1902</code>) é entregue de novo. A saga já está em <code>PAGO</code>. A transição é <b>condicional</b>: <code>transitar(\'s-1057\',\'COBRANDO\',\'PAGO\',…)</code> faz <code>UPDATE … WHERE estado = \'COBRANDO\'</code>, não acha a linha e devolve <b><code>f</code></b>, sem escrever no log. A duplicata foi ignorada sem código especial (rodado no PostgreSQL 14).',
        look: 'A ficha está em PAGO. Uma segunda luz vermelha, a cópia do e-1902, chega pelo cabo de COBRANDO para PAGO e volta com f.',
        key: 'Com a transição condicional, a mensagem repetida não move a saga.',
        f(o, t) { walk(o, ['PAGO'], t, 0, 1, () => 's-1057 · PAGO'); o.on.sNOVO = o.on.sCOBRANDO = 2; [SBP[0], SBP[1]].forEach(p => beamOnSM(o, p));
          const path = [[TC(1), 160, 37], [TX(2) - 8, 160, 62], [TC(2) - 20, 160, 50]], a = go_(t, 0.8, 2.6), back = go_(t, 2.8, 4.0);
          if (a > 0 && a < 1) pk(o, path, a, 'e-1902 de novo · 20:15:41.210', 'bad');
          if (a >= 1 && back < 1) pk(o, rev(path), Math.max(back, 0.001), 'f', 'bad');
          if (back >= 1) T(o, [TX(2) - 8, 160, 66], 'transitar(…) = f', 'bad');
          o.cnt = [['transitar(…)', a >= 1 ? 'f' : '…', a >= 1 ? 'bad' : 'dim'], ['ESTADO', 'PAGO', 'dim'], ['LINHAS NO LOG', '+0', 'dim']];
          o.res = back >= 1 ? [['a duplicata foi ignorada', 'acc']] : []; } },
      { id: 'vigia', dur: 7, title: 'E se der errado: a saga que ficou parada', yk: 'A VIGIA',
        code: ['SELECT saga_id, estado FROM saga', "WHERE estado NOT IN ('FINALIZADO','CANCELADO')", "  AND atualizada_em < agora − interval '30 minutes';", '→ s-teste | COBRANDO (desde 19:20)', 'prazo vencido: expira e compensa'],
        story: 'O PSP nunca avisa o Pix, e a saga fica em <code>COBRANDO</code> para sempre: ninguém erra, nada chega. A saída é um <b>prazo por estado</b> (no exemplo, a cobrança Pix expira em 30 min) e uma <b>vigia</b> que procura sagas paradas além do prazo. No teste, ela achou a <code>s-teste</code>, parada em <code>COBRANDO</code> desde as <b>19:20</b>; a vigia expira a cobrança e manda compensar.',
        look: 'A vigia acende na frente e puxa um cabo até COBRANDO, que fica vermelho: lá está a s-teste, parada desde 19:20.',
        key: 'Uma saga que espera para sempre só é achada por quem procura o silêncio.',
        f(o, t) { const a = go_(t, 0.6, 2.2), on = a >= 1; lit(o, 'vig');
          o.rows.vig = act('vigia', 'A CADA MINUTO', ['estado NOT IN (FINALIZADO, CANCELADO)', 'dim'], [on ? 'achou: s-teste em COBRANDO' : 'e parada há mais de 30 min', on ? 'bad' : 'dim']);
          o.beams.push({ pts: SVIG, on: a > 0 && !on, tone: on ? 'bad' : '' }); pk(o, SVIG, a, 'procura sagas paradas');
          if (on) { o.on.sCOBRANDO = 'bad'; o.dots.push([tile('COBRANDO'), 'bad']); T(o, [TC(1), 160, 60], 's-teste · COBRANDO desde 19:20', 'bad'); }
          o.cnt = [['PARADA DESDE', on ? '19:20' : '…', on ? 'bad' : 'dim'], ['PRAZO', '30 min', 'dim'], ['ACHADAS', on ? '1' : '0', 'dim']];
          o.res = on ? [['prazo vencido: expira e compensa', 'acc']] : []; } },
    ],
    coreografado: [
      { id: 'criado', dur: 6, title: 'Ninguém manda: o PedidoCriado', yk: 'QUEM ESCUTA O QUÊ',
        code: ['pedidos     publica PedidoCriado', 'pagamentos  escuta PedidoCriado → cobra', 'estoque     escuta PedidoPago → reserva', 'entregas    escuta EstoqueReservado', 'pagamentos  escuta EstoqueIndisponivel'],
        story: 'O <code>pedidos</code> grava o 1057 e publica <code>PedidoCriado</code> (<code>e-1901</code>) às 20:15:00.000. Não chama ninguém: só conta o que aconteceu. Quem se interessa escuta; aqui, o <code>pagamentos</code>, que abre a cobrança Pix <code>c-7732</code> no PSP.',
        look: 'O evento sai do pedidos, entra na esteira e desce no pagamentos, que manda a cobrança ao PSP. O pedidos não sabe quem vai ouvir.',
        key: 'Na coreografia, cada serviço publica um fato, sem saber quem escuta.',
        f(o, t) { const a = send(o, via('ped', 'pag'), t, 0.6, 2.2, 'PedidoCriado · e-1901'), b = send(o, PSPC, t, 2.5, 3.9, 'cobrança c-7732');
          lit(o, 'ped', 'dped'); if (a) lit(o, 'pag'); if (b) { lit(o, 'psp', 'dpag'); o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], ['esperando o Davi', 'dim']); }
          o.cnt = [['EVENTOS', a ? '1' : '0'], ['RELÓGIO', '20:15:00.000', 'dim'], ['DONO DA SAGA', 'nenhum', 'dim']];
          o.res = a ? [['o pagamentos reagiu ao fato', 'acc']] : []; } },
      { id: 'pago', dur: 6, title: 'PedidoPago: o estoque escuta', yk: 'O SEGUNDO EVENTO',
        code: ['20:15:41.200  PSP → webhook: c-7732 paga', '              pagamentos: COMMIT, 58,00', '              publica PedidoPago e-1902', 'estoque escuta e tenta reservar'],
        story: 'O Davi paga às <b>20:15:41.200</b>, 41,2 s depois. O PSP avisa por webhook, o <code>pagamentos</code> grava e publica <code>PedidoPago</code> (<code>e-1902</code>), 58,00. O <code>estoque</code> escuta esse evento e tenta reservar a camiseta.',
        look: 'O webhook volta do PSP ao pagamentos; o PedidoPago anda pela esteira até o estoque.',
        key: 'Cada passo começa porque um evento chegou, não porque alguém mandou.',
        f(o, t) { const a = send(o, rev(PSPC), t, 0.5, 1.8, 'webhook: paga'), b = send(o, via('pag', 'est'), t, 2.0, 3.6, 'PedidoPago · e-1902');
          o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); lit(o, 'psp', 'dped'); if (a) { lit(o, 'pag', 'dpag'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); } if (b) lit(o, 'est');
          o.cnt = [['EVENTOS', b ? '2' : '1'], ['RELÓGIO', '20:15:41.200', 'dim'], ['DONO DA SAGA', 'nenhum', 'dim']];
          o.res = b ? [['o estoque tenta reservar', 'acc']] : []; } },
      { id: 'indisponivel', dur: 7, title: 'EstoqueIndisponivel: quem desfaz é o pagamentos', yk: 'DEPENDÊNCIA CIRCULAR',
        code: ['20:15:41.260  estoque publica EstoqueIndisponivel', '              e-1903, motivo sem_estoque', 'pagamentos escuta o estoque', 'estoque escuta o pagamentos', '→ um depende do outro'],
        story: 'Às <b>20:15:41.260</b> o <code>estoque</code> publica <code>EstoqueIndisponivel</code> (<code>e-1903</code>), motivo <code>sem_estoque</code>. Quem desfaz é o <code>pagamentos</code>, que agora <b>escuta o estoque</b>. E o <code>estoque</code> já escutava o <code>pagamentos</code> (o <code>PedidoPago</code>): <b>dependência circular</b>.',
        look: 'O estoque fica vermelho e o evento volta pela esteira até o pagamentos. Os dois cabos entre eles ficam acesos: um em cada sentido.',
        key: 'Na coreografia, quem compensa precisa escutar quem falhou.',
        f(o, t) { o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); lit(o, 'dpag');
          o.rows.est = act('estoque', 'SERVIÇO', ['escuta PedidoPago', 'dim'], ['sem_estoque', 'bad']);
          const a = send(o, via('est', 'pag', 236), t, 0.6, 2.2, 'EstoqueIndisponivel · e-1903', 'bad');
          if (a) { lit(o, 'pag'); o.rows.pag = act('pagamentos', 'SERVIÇO', ['escuta PedidoCriado', 'dim'], ['e EstoqueIndisponivel', 'bad']);
            o.beams.push({ pts: via('pag', 'est'), on: true }, { pts: via('est', 'pag', 236), tone: 'bad' }); T(o, [(CX.pag + CX.est) / 2, 229, 50], 'um escuta o outro', 'bad'); }
          o.cnt = [['EVENTOS', a ? '3' : '2'], ['DEPENDÊNCIA', a ? 'circular' : '…', a ? 'bad' : 'dim'], ['RELÓGIO', '20:15:41.260', 'dim']];
          o.res = a ? [['o pagamentos passou a escutar o estoque', 'bad']] : []; } },
      { id: 'estorno', dur: 6, title: 'PagamentoEstornado: 58,00 de volta', yk: 'O ESTORNO',
        code: ['pagamentos → PSP: EstornarCobranca c-7732', '20:15:44.950  PSP: estornada', '              publica PagamentoEstornado', '              e-1904, 58,00'],
        story: 'O <code>pagamentos</code> pede ao PSP o estorno da <code>c-7732</code> e, às <b>20:15:44.950</b>, publica <code>PagamentoEstornado</code> (<code>e-1904</code>), 58,00. O estorno é um lançamento a mais, não um apagamento: a cobrança continua no extrato do Davi, com o estorno ao lado.',
        look: 'O pedido de estorno vai do pagamentos ao PSP e volta; o PagamentoEstornado anda pela esteira até o pedidos.',
        key: 'O estorno é uma transação nova que desfaz o efeito da cobrança.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); lit(o, 'pag');
          const a = send(o, PSPC, t, 0.4, 1.6, 'EstornarCobranca c-7732'), b = send(o, rev(PSPC), t, 1.8, 3.0, 'estornada'), c = send(o, via('pag', 'ped'), t, 3.2, 4.6, 'PagamentoEstornado · e-1904');
          if (a) { lit(o, 'psp'); o.rows.psp = act('PSP', 'FORA DA LOJA', ['estorno c-7732', 'acc'], ['58,00', 'acc']); }
          db(o, 'pag', b ? 'c-7732 · estornada' : 'c-7732 · paga 58,00', 'acc'); if (b) lit(o, 'dpag'); if (c) lit(o, 'ped');
          o.cnt = [['EVENTOS', c ? '4' : '3'], ['RELÓGIO', b ? '20:15:44.950' : '20:15:41.300', 'dim'], ['ESTORNO', b ? '58,00' : '…', 'dim']];
          o.res = b ? [['58,00 de volta ao Davi', 'acc']] : []; } },
      { id: 'cancelado', dur: 7, title: 'PedidoCancelado: 5 eventos na falha', yk: 'OS EVENTOS',
        code: ['falha (5): PedidoCriado, PedidoPago,', '  EstoqueIndisponivel, PagamentoEstornado,', '  PedidoCancelado', 'sucesso (4): PedidoCriado, PedidoPago,', '  EstoqueReservado, EntregaAgendada', 'onde está o fluxo? em 4 repositórios'],
        story: 'O <code>pedidos</code> escuta o estorno, cancela o 1057 e publica <code>PedidoCancelado</code> (<code>e-1905</code>). Na falha foram <b>5</b> eventos; no caminho feliz seriam <b>4</b>. O fluxo não está em lugar nenhum: está espalhado por quatro repositórios, e achar o 1057 exige juntar os logs dos quatro pelo <code>trace_id</code> (módulo 6).',
        look: 'O pedidos publica o último evento. Os quatro serviços acendem juntos: cada um sabe só a sua parte do caminho.',
        key: 'Sem centro, o fluxo é só a soma das escutas.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · estornada', 'acc');
          const a = send(o, [[CX.ped, 285, ZR], [CX.ped, 222, 26], [760, 222, 26]], t, 0.6, 2.4, 'PedidoCancelado · e-1905');
          db(o, 'ped', '1057 · cancelado', 'acc'); lit(o, 'ped', 'dped');
          if (a) { lit(o, 'pag', 'ent'); o.on.est = 1; SVC.forEach(k => T(o, [CX[k], 335, 50], 'só a sua parte', 'dim')); }
          o.cnt = [['EVENTOS', a ? '5' : '4'], ['NO SUCESSO', '4', 'dim'], ['ONDE ESTÁ O FLUXO', 'em lugar nenhum', 'dim']];
          o.res = a ? [['1057 cancelado, 58,00 estornados', 'acc'], ['5 eventos; o fluxo não tem dono', 'dim']] : []; } },
      { id: 'perdido', dur: 7, title: 'E se der errado: o EstoqueIndisponivel se perde', yk: 'A MENSAGEM PERDIDA',
        code: ['estoque publica EstoqueIndisponivel e-1903', 'o evento se perde (aula 9)', 'pagamentos não estorna', 'pedidos não cancela', '1057: pago para sempre'],
        story: 'O <code>estoque</code> não achou a camiseta, e o <code>EstoqueIndisponivel</code> (<code>e-1903</code>) <b>nunca chega</b> ao <code>pagamentos</code> (a mensagem se perdeu; a aula 9 mostra como). Ninguém compensa. O 1057 fica <code>pago</code> <b>para sempre</b>, e ninguém sabe: não existe um dono da saga que perceba que faltou uma resposta.',
        look: 'O evento sai do estoque e some no meio da esteira. O pagamentos e o pedidos ficam parados, com o 1057 pago.',
        key: 'Sem dono da saga, ninguém percebe o silêncio.',
        f(o, t) { o.on.est = 'bad'; o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); db(o, 'ped', '1057 · pago', 'acc'); lit(o, 'dped', 'dpag');
          const path = via('est', 'pag', 236), f = go_(t, 0.6, 2.4), gone = f >= 0.55;
          if (!gone) pk(o, path, f, 'EstoqueIndisponivel · e-1903', 'bad'); else T(o, [CX.est - 40, 236, 46], 'perdido', 'bad');
          if (gone) T(o, [CX.ped, 300, 54], '1057: pago para sempre', 'bad');
          o.cnt = [['COMPENSAÇÕES', '0', 'bad'], ['1057', 'pago', 'bad'], ['QUEM PERCEBE', 'ninguém', 'dim']];
          o.res = gone ? [['ninguém compensa, ninguém sabe', 'bad']] : []; } },
    ],
    orquestrado: [
      { id: 'inicio', dur: 6, title: 'O orquestrador recebe o 1057: NOVO', yk: 'COMANDO E RESPOSTA',
        code: ['pedidos-commands      pedidos-reply', 'pagamentos-commands   pagamentos-reply', 'estoque-commands      estoque-reply', 'entregas-commands     entregas-reply', 'o orquestrador escreve nos primeiros', 'e lê dos segundos'],
        story: 'Cada serviço tem um tópico de <b>comando</b> e outro de <b>resposta</b> (no laboratório do autor, <code>pagamentos-commands</code> e <code>pagamentos-reply</code>, e o mesmo para os outros). O orquestrador escreve nos primeiros e lê dos segundos. Às 20:15:00.000 chega a mensagem de início, o <code>PedidoCriado</code> (<code>e-1901</code>), e ele grava a saga <code>s-1057</code> em <code>NOVO</code> no seu banco.',
        look: 'O PedidoCriado vai do pedidos ao orquestrador, atrás. O quadro do orquestrador e o banco da saga, ao lado, mostram NOVO.',
        key: 'Na orquestração, um lugar só guarda o mapa da saga.',
        f(o, t) { const a = send(o, rep('ped'), t, 0.6, 2.2, 'PedidoCriado · e-1901'); lit(o, 'ped', 'dped');
          if (a) { lit(o, 'orq', 'dorq'); orq(o, 'NOVO'); dorq(o, 'NOVO', 1); }
          o.cnt = [['MENSAGENS', a ? '1' : '0'], ['ESTADO', a ? 'NOVO' : '…', 'dim'], ['RELÓGIO', '20:15:00.000', 'dim']];
          o.res = a ? [['s-1057 gravada: NOVO', 'acc']] : []; } },
      { id: 'cobrar', dur: 7, title: 'CobrarPedido → PedidoPago, 41,2 s depois', yk: 'O PRIMEIRO PASSO',
        code: ['20:15:00.050  → CobrarPedido (COBRANDO)', '              pagamentos abre c-7732 no PSP', '              … o Davi leva 41,2 s …', '20:15:41.200  ← PedidoPago e-1902, 58,00', '              PAGO'],
        story: 'O orquestrador manda <code>CobrarPedido</code> e grava <code>COBRANDO</code> (20:15:00.050). O <code>pagamentos</code> abre a <code>c-7732</code> no PSP e espera o Davi: <b>41,2 s</b>. Às <b>20:15:41.200</b> a resposta volta: <code>PedidoPago</code> (<code>e-1902</code>), 58,00. A saga vai a <code>PAGO</code>.',
        look: 'O comando desce do orquestrador ao pagamentos pela pista de trás da esteira; a cobrança vai ao PSP; o relógio corre; a resposta volta pela pista da frente.',
        key: 'O orquestrador manda um comando e espera a resposta antes do próximo passo.',
        f(o, t) { lit(o, 'dped'); const a = send(o, cmd('pag'), t, 0.4, 1.6, 'CobrarPedido'), b = send(o, PSPC, t, 1.7, 2.6, 'c-7732'),
            w = lin(t, 2.7, 4.3, 0.05, 41.2), c = send(o, rev(PSPC), t, 4.4, 5.2, 'paga'), d = send(o, rep('pag'), t, 5.3, 6.5, 'PedidoPago · e-1902');
          lit(o, 'orq', 'dorq'); orq(o, d ? 'PAGO' : 'COBRANDO', d ? '' : 'espera a resposta'); dorq(o, d ? 'PAGO' : 'COBRANDO', d ? 3 : 2);
          if (a) lit(o, 'pag'); if (b) { lit(o, 'psp'); o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], [c ? 'pago: 58,00' : 'esperando o Davi', 'acc']); }
          if (c) { lit(o, 'dpag'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); }
          if (t >= 2.7 && w >= 10) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); }
          o.cnt = [['MENSAGENS', String(1 + (a ? 1 : 0) + (d ? 1 : 0))], ['RELÓGIO', hms(t < 2.7 ? 0.05 : w, true), 'dim'], ['ESTADO', d ? 'PAGO' : 'COBRANDO', 'dim']];
          o.res = d ? [['PAGO: próximo, reservar', 'acc']] : []; } },
      { id: 'reservar', dur: 6, title: 'ReservarEstoque → falha: COMPENSANDO', yk: 'O SEGUNDO PASSO',
        code: ['20:15:41.220  → ReservarEstoque (RESERVANDO)', '20:15:41.260  ← EstoqueIndisponivel e-1903', '              motivo sem_estoque', '              COMPENSANDO', 'quem decide compensar: o orquestrador'],
        story: 'Às <b>20:15:41.220</b> o orquestrador manda <code>ReservarEstoque</code> e grava <code>RESERVANDO</code>. O <code>estoque</code> responde a falha, <code>EstoqueIndisponivel</code> (<code>e-1903</code>), motivo <code>sem_estoque</code>, às <b>41.260</b>. Quem decide o que fazer é o orquestrador: <code>COMPENSANDO</code>.',
        look: 'O comando desce ao estoque; a resposta volta vermelha. O quadro do orquestrador passa a COMPENSANDO.',
        key: 'É o orquestrador quem manda compensar, não o serviço que falhou.',
        f(o, t) { lit(o, 'dped', 'dpag'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          const a = send(o, cmd('est'), t, 0.4, 1.8, 'ReservarEstoque'), b = send(o, rep('est'), t, 2.2, 3.6, 'EstoqueIndisponivel · e-1903', 'bad');
          if (a) { o.on.est = 'bad'; o.rows.est = act('estoque', 'SERVIÇO', ['reservar 1?', 'dim'], ['sem_estoque', 'bad']); }
          lit(o, 'orq', 'dorq'); orq(o, b ? 'COMPENSANDO' : 'RESERVANDO', '', b ? 'bad' : 'acc'); dorq(o, b ? 'COMPENSANDO' : 'RESERVANDO', b ? 5 : 4);
          o.cnt = [['MENSAGENS', String(3 + (a ? 1 : 0) + (b ? 1 : 0))], ['RELÓGIO', b ? '20:15:41.260' : '20:15:41.220', 'dim'], ['ESTADO', b ? 'COMPENSANDO' : 'RESERVANDO', b ? 'bad' : 'dim']];
          o.res = b ? [['falha de negócio: compensar', 'bad']] : []; } },
      { id: 'estornar', dur: 7, title: 'EstornarCobranca → PagamentoEstornado', yk: 'A COMPENSAÇÃO',
        code: ['20:15:41.300  → EstornarCobranca c-7732', '              (ESTORNANDO)', '              pagamentos → PSP: estorno', '20:15:44.950  ← PagamentoEstornado e-1904', '              58,00'],
        story: 'Às <b>20:15:41.300</b> ele manda <code>EstornarCobranca c-7732</code> e grava <code>ESTORNANDO</code>. O <code>pagamentos</code> pede o estorno ao PSP; às <b>20:15:44.950</b> a resposta volta: <code>PagamentoEstornado</code> (<code>e-1904</code>), 58,00.',
        look: 'O comando desce ao pagamentos, o estorno vai ao PSP e volta, e a resposta sobe ao orquestrador.',
        key: 'A compensação também é um comando com resposta.',
        f(o, t) { lit(o, 'dped'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad');
          const a = send(o, cmd('pag'), t, 0.4, 1.6, 'EstornarCobranca'), b = send(o, PSPC, t, 1.7, 2.6, 'estorno c-7732'), c = send(o, rev(PSPC), t, 2.7, 3.6, 'estornada'),
            d = send(o, rep('pag'), t, 3.7, 5.0, 'PagamentoEstornado · e-1904');
          if (a) lit(o, 'pag'); if (b) { lit(o, 'psp'); o.rows.psp = act('PSP', 'FORA DA LOJA', ['estorno c-7732', 'acc'], ['58,00', 'acc']); }
          lit(o, 'dpag'); db(o, 'pag', c ? 'c-7732 · estornada' : 'c-7732 · paga 58,00', 'acc');
          lit(o, 'orq', 'dorq'); orq(o, 'ESTORNANDO', d ? 'estorno ok' : 'espera a resposta'); dorq(o, 'ESTORNANDO', 6);
          o.cnt = [['MENSAGENS', String(5 + (a ? 1 : 0) + (d ? 1 : 0))], ['RELÓGIO', d ? '20:15:44.950' : '20:15:41.300', 'dim'], ['ESTADO', 'ESTORNANDO', 'dim']];
          o.res = d ? [['58,00 de volta ao Davi', 'acc']] : []; } },
      { id: 'cancelar', dur: 7, title: 'CancelarPedido → CANCELADO: 8 mensagens', yk: 'A CONTA DAS MENSAGENS',
        code: ['falha: 8 + 1 de início', '  cobrar + resposta, reservar + falha,', '  estornar + resposta, cancelar + resposta', 'sucesso: 6 (3 comandos + 3 respostas)', 'coreografia: 5 na falha, 4 no sucesso', 'CANCELADO no log: 20:15:44.950'],
        story: 'Por fim, <code>CancelarPedido</code> ao <code>pedidos</code>, que responde <code>PedidoCancelado</code> (<code>e-1905</code>); a saga fica <code>CANCELADO</code> (no log, <b>20:15:44.950</b>, 44,95 s depois do início). Na falha foram <b>8</b> mensagens mais <b>1</b> de início; no sucesso seriam <b>6</b>. A coreografia gastou 5 e 4: o orquestrador custa mais mensagens e paga com um lugar que sabe tudo.',
        look: 'O último comando desce ao pedidos e a resposta sobe. O quadro do orquestrador e o banco da saga mostram CANCELADO.',
        key: 'Mais mensagens, mas o fluxo inteiro está num lugar só.',
        f(o, t) { o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); db(o, 'pag', 'c-7732 · estornada', 'acc'); lit(o, 'dpag');
          const a = send(o, cmd('ped'), t, 0.4, 1.8, 'CancelarPedido'), b = send(o, rep('ped'), t, 2.0, 3.4, 'PedidoCancelado · e-1905');
          if (a) { lit(o, 'ped', 'dped'); db(o, 'ped', '1057 · cancelado', 'acc'); }
          lit(o, 'orq', 'dorq'); orq(o, b ? 'CANCELADO' : 'ESTORNANDO', b ? 'final' : ''); dorq(o, b ? 'CANCELADO' : 'ESTORNANDO', b ? 7 : 6);
          o.cnt = [['MENSAGENS', b ? '8 + 1' : (a ? '7 + 1' : '6 + 1')], ['NO SUCESSO', '6', 'dim'], ['COREOGRAFIA', '5 / 4', 'dim']];
          o.res = b ? [['CANCELADO: 44,95 s', 'acc'], ['o mapa inteiro num lugar só', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'E se der errado: o orquestrador cai com 200 sagas no ar', yk: 'A QUEDA',
        code: ['s-1057 em COBRANDO, esperando o Pix', 'o orquestrador cai: 200 sagas no ar', 'estado na memória → todas perdidas', 'estado no banco  → esperam por ele', 'pagamentos-reply guarda a resposta'],
        story: 'Volte ao 1057 em <code>COBRANDO</code>, esperando o Pix. O orquestrador cai com <b>200</b> sagas em andamento (exemplo). Se o estado delas morasse na <b>memória</b> dele, todas se perderiam: os serviços fizeram os passos, e ninguém saberia em que passo cada pedido está. O 1057 <b>espera</b>: o <code>PedidoPago</code> fica no tópico <code>pagamentos-reply</code>, sem ninguém para ler.',
        look: 'O orquestrador fica vermelho. A resposta do pagamentos sobe pela esteira e para antes de chegar; o banco da saga, ao lado, continua com COBRANDO.',
        key: 'Um orquestrador que guarda as sagas na memória as perde quando cai.',
        f(o, t) { const down = t > 0.6; lit(o, 'dped', 'dpag', 'dorq'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); o.rows.psp = act('PSP', 'FORA DA LOJA', ['Pix c-7732', 'acc'], ['pago: 58,00', 'acc']);
          o.on.orq = down ? 'bad' : 1; o.rows.orq = act('orquestrador', down ? 'FORA DO AR' : '', ['200 sagas no ar', down ? 'bad' : 'dim'], [down ? 'caiu' : 'COBRANDO', down ? 'bad' : 'acc']);
          dorq(o, 'COBRANDO', 2); const r = rep('pag'), f = Math.min(go_(t, 1.4, 3.6), 0.78); pk(o, r, Math.max(f, 0.001), f >= 0.78 ? 'PedidoPago esperando' : 'PedidoPago · e-1902');
          if (f >= 0.78) o.beams.push({ pts: r, tone: 'bad' });
          o.cnt = [['SAGAS NO AR', '200', down ? 'bad' : ''], ['1057', 'esperando', 'dim'], ['NO BANCO', 'COBRANDO', 'dim']];
          o.res = down ? [['ninguém lê pagamentos-reply', 'bad']] : []; } },
      { id: 'volta', dur: 7, title: 'O estado em banco: ele volta e continua', yk: 'A RETOMADA',
        code: ['o orquestrador volta', 'lê o banco: s-1057 = COBRANDO', 'lê pagamentos-reply: PedidoPago e-1902', 's-1057 → PAGO', '→ ReservarEstoque', 'as 200 sagas retomam do último estado'],
        story: 'Por isso o estado mora em <b>banco</b>. Quando o orquestrador volta, lê a tabela, vê o 1057 em <code>COBRANDO</code> e continua de onde parou: lê o <code>PedidoPago</code> que esperava no tópico, grava <code>PAGO</code> e manda <code>ReservarEstoque</code>. As outras sagas retomam do último estado gravado. A aula 6 mostra que estrutura é essa.',
        look: 'O orquestrador acende de novo, lê o banco da saga ao lado (COBRANDO), recebe a resposta que esperava e manda o próximo comando ao estoque.',
        key: 'Estado durável em banco faz a queda virar uma pausa.',
        f(o, t) { lit(o, 'dped', 'dpag'); db(o, 'pag', 'c-7732 · paga 58,00', 'acc'); o.on.dest = 'bad'; db(o, 'est', 'CAMISETA-015 · 0', 'bad'); 
          const rd = send(o, rev(ORQB), t, 0.5, 1.4, 'lê: COBRANDO'), a = send(o, rep('pag'), t, 1.6, 2.6, 'PedidoPago · e-1902'), b = send(o, cmd('est'), t, 3.0, 4.4, 'ReservarEstoque');
          lit(o, 'orq', 'dorq'); o.rows.orq = act('orquestrador', 'DE VOLTA', ['saga s-1057', 'dim'], [a ? (b ? 'RESERVANDO' : 'PAGO') : rd ? 'COBRANDO (lido)' : 'subindo…', 'acc']);
          dorq(o, a ? (b ? 'RESERVANDO' : 'PAGO') : 'COBRANDO', a ? (b ? 4 : 3) : 2); if (b) lit(o, 'est');
          o.cnt = [['ESTADO', a ? (b ? 'RESERVANDO' : 'PAGO') : 'COBRANDO'], ['SAGAS PERDIDAS', '0', 'dim'], ['RETOMA DE', 'COBRANDO', 'dim']];
          o.res = b ? [['continuou de onde parou', 'acc']] : []; } },
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
  const LOGTAB = `<table class="h3-sum"><tr><th>em</th><th>de → para</th><th>evento</th></tr>${[['20:15:00', '— → NOVO', 'e-1901'], ['20:15:00.05', 'NOVO → COBRANDO', ''], ['20:15:41.2', 'COBRANDO → PAGO', 'e-1902'], ['20:15:41.22', 'PAGO → RESERVANDO', ''], ['20:15:41.26', 'RESERVANDO → COMPENSANDO', 'e-1903'], ['20:15:41.3', 'COMPENSANDO → ESTORNANDO', ''], ['20:15:44.95', 'ESTORNANDO → CANCELADO', 'e-1904']].map((r, i) => `<tr${i === 6 ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table>`;
  const DATA = {
    'sem-saga': () => `<li>Pedido <b>1057</b> (Davi, SP, Black Friday, 20:15:00.000): 1 camiseta preta <code>CAMISETA-015</code> 49,00 + frete SP 9,00 = <b>58,00</b>, Pix, cobrança <code>c-7732</code></li><li>20:15:10: baixa por avaria, estoque <b>1 → 0</b> (a página dizia "última unidade": cache de 60 s, módulo 5)</li><li>20:15:41.200: pago, <b>41,2 s</b> depois; 20:15:41.260: <code>EstoqueIndisponivel</code> <code>e-1903</code>, <code>sem_estoque</code></li><table class="h3-sum"><tr><th>conta</th><th>resultado</th></tr><tr><td>20:15:41 → 23:00 (conciliação)</td><td>2 h 44 min</td></tr><tr class="on"><td>30 pedidos/s × 41,2 s</td><td>1.236 transações abertas</td></tr><tr><td>30 × 300 s (exemplo)</td><td>9.000</td></tr><tr><td>30 × 1.800 s (exemplo)</td><td>54.000</td></tr></table><li>2PC (Fowler): "prepara" e depois "efetiva"; bloqueia se o coordenador cai; o PSP e o Kafka não participam</li>`,
    'state-machine': () => `<li>Log real da <code>s-1057</code> (PostgreSQL 14.24, 20/10/2026): 7 transições; <code>saga</code> termina em <code>CANCELADO</code>, <code>versao = 7</code></li>${LOGTAB}<li>Duplicata do <code>e-1902</code> às 20:15:41.210: <code>transitar('s-1057','COBRANDO','PAGO',…)</code> = <b>f</b>, nada no log</li><li>Vigia: <code>estado NOT IN ('FINALIZADO','CANCELADO') AND atualizada_em &lt; agora − interval '30 minutes'</code> → <code>s-teste</code> em <code>COBRANDO</code> desde 19:20</li><li>Contramedidas da falta de isolamento (microservices.io): bloqueio semântico, atualizações comutativas, reler o valor</li>`,
    coreografado: () => `<table class="h3-sum"><tr><th>evento</th><th>publica</th><th>escuta</th></tr><tr><td>PedidoCriado e-1901</td><td>pedidos</td><td>pagamentos</td></tr><tr><td>PedidoPago e-1902</td><td>pagamentos</td><td>estoque</td></tr><tr class="on"><td>EstoqueIndisponivel e-1903</td><td>estoque</td><td>pagamentos</td></tr><tr><td>PagamentoEstornado e-1904</td><td>pagamentos</td><td>pedidos</td></tr><tr><td>PedidoCancelado e-1905</td><td>pedidos</td><td>—</td></tr></table><li>Sucesso: 4 eventos (<code>PedidoCriado</code>, <code>PedidoPago</code>, <code>EstoqueReservado</code>, <code>EntregaAgendada</code>); falha: <b>5</b></li><li>microservices.io: cada transação local publica eventos de domínio que disparam transações locais em outros serviços</li><li>Correção ao artigo: o serviço publica o fato e não sabe quem escuta; chamar o próximo direto é cadeia ponto a ponto</li>`,
    orquestrado: () => `<table class="h3-sum"><tr><th>#</th><th>mensagem</th><th>estado</th></tr><tr><td>0</td><td>PedidoCriado e-1901 (início)</td><td>NOVO</td></tr><tr><td>1–2</td><td>CobrarPedido · PedidoPago e-1902</td><td>COBRANDO → PAGO</td></tr><tr><td>3–4</td><td>ReservarEstoque · EstoqueIndisponivel e-1903</td><td>RESERVANDO → COMPENSANDO</td></tr><tr><td>5–6</td><td>EstornarCobranca · PagamentoEstornado e-1904</td><td>ESTORNANDO</td></tr><tr class="on"><td>7–8</td><td>CancelarPedido · PedidoCancelado e-1905</td><td>CANCELADO</td></tr></table><li>Sucesso: <b>6</b> (3 comandos + 3 respostas); falha: <b>8</b>, mais 1 de início; coreografia: 4 / 5</li><li>Laboratório do autor (lido no código): tópicos <code>&lt;serviço&gt;-commands</code> e <code>&lt;serviço&gt;-reply</code>, tabela <code>saga_events</code></li><li>200 sagas no ar: exemplo</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botões do passo: a espera do Pix (Sem saga, último passo)
  function actHtml() { if (cur().act !== 'espera') return '';
    return `<div class="o3-mode r3-act" role="group" aria-label="Espera do Pix">${ESP.map(([s, lab], i) => `<button data-esp="${i}" aria-pressed="${i === esp}">${lab}<small>30 × ${i ? thou(s) + ' s' : '41,2 s'}</small></button>`).join('')}</div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'saga') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(490, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(220, 230, 60), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
