// Figura 3D (iso-glow): a última linha do estoque. Resta 1 gato de pelúcia (GATO-042, quantidade = 1) e a Bia (SP) e o Caio (Rio)
// clicam "comprar" com 2 ms de diferença. Cena: à esquerda as duas fichas (Bia e Caio); no meio o serviço estoque (1 ou 2 réplicas)
// com a trava de cada um como uma cancela; à direita o PostgreSQL com a gaveta da linha GATO-042 e a peça do gato; ao fundo o
// Redis (modos com lock distribuído) e o mostrador (t, quantidade, resultado, SQL); na frente, o relógio em ms com os eventos.
// Cenários (toggle e ?mode=race|mutex|condicional|replicas|redis|ttl|deadlock; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/concorrencia-brief.md, aulas 6–8).
FIGS3D.push({ id: 'estoque', name: 'O último gato', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const num = v => Math.round(v).toLocaleString('pt-BR');
  const qs = q => q < 0 ? '−' + Math.abs(q) : String(q);

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['race', 'mutex', 'condicional', 'replicas', 'redis', 'ttl', 'deadlock'];
  const SCNAME = { race: 'Corrida', mutex: 'Mutex', condicional: 'Condicional', replicas: 'Réplicas', redis: 'Redis', ttl: 'TTL', deadlock: 'Deadlock' };
  const SCFULL = { race: 'Corrida: ler e baixar sem trava', mutex: 'Mutex numa réplica', condicional: 'Escrita condicional no banco',
    replicas: 'Duas réplicas, dois mutex', redis: 'Lock distribuído no Redis', ttl: 'TTL vencido e fencing token', deadlock: 'Deadlock: reserva × estorno' };
  const A6 = 'aula-6-problemas-classicos-deadlocks-starvation-e-race-conditions', A7 = 'aula-7-mutex', A8 = 'aula-8-mutex-distribuido-locks-distribuidos';
  const AULA = { race: A6, mutex: A7, condicional: A7, replicas: A8, redis: A8, ttl: A8, deadlock: A6 };
  const SEL = ['SELECT quantidade FROM estoque', "  WHERE sku = 'GATO-042';"];
  const UPD = ['UPDATE estoque', '  SET quantidade = quantidade - 1', "  WHERE sku = 'GATO-042';"];
  const UPDC = ['UPDATE estoque', '  SET quantidade = quantidade - 1', "  WHERE sku = 'GATO-042'", '    AND quantidade > 0;'];
  const KEY = 'lock:estoque:GATO-042';
  const LUA = ['EVAL "if redis.call(\'get\',KEYS[1]) == ARGV[1]', '  then return redis.call(\'del\',KEYS[1])', '  else return 0 end" 1 ' + KEY + ' a1'];
  let clk = 0, sc = 'race', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-estoque3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  // fichas à esquerda (Bia em cima, Caio embaixo), serviço no meio, cancela (mutex) entre o serviço e o banco, banco à direita
  const PL = 7, Z = 10, REP = () => sc === 'replicas' || sc === 'redis' || sc === 'ttl';
  const CLX = 20, CLW = 170, CLD = 70, PX = 250, PW = 180, PD = 70, GX = 450, GW = 60;
  const ROWY = [120, 250], MIDY = 185, DBX = 566, DBY = 150, DBW = 234, DBD = 140;
  const RDX = 20, RDY = 16, RDW = 222, RDD = 80;
  plateWith(g0, 815, 422, [[14, 14], [801, 14], [14, 408], [801, 408]]);
  hazeAndShadow(g0, 407, 211, 9.6, 5.4);
  // mostrador ao fundo
  rbox(262, 12, PL, 540, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 266, 24, 154, 532, 143, 4, g0);
  // relógio no chão, na frente
  const CLK = faceCanvas('top', 14, 358, PL, 787, 52, 5, g0);
  function block(x, y, w, d, h, kind, extra) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'cat' ? 8 : 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, cy: y, w, d, h, kind, key: '', f: 1, ...extra };
  }
  const B = {
    bia: block(CLX, ROWY[0], CLW, CLD, 24, 'cli'), caio: block(CLX, ROWY[1], CLW, CLD, 24, 'cli'),
    p1: block(PX, MIDY, PW, PD, 26, 'pod'), p2: block(PX, ROWY[1], PW, PD, 26, 'pod'),
    g1: block(GX, MIDY, GW, PD, 22, 'gate'), g2: block(GX, ROWY[1], GW, PD, 22, 'gate'),
    lkA: block(PX, ROWY[0], PW, PD, 26, 'pod'), lkB: block(PX, ROWY[1], PW, PD, 26, 'pod'),
    rd: block(RDX, RDY, RDW, RDD, 34, 'redis'),
    db: block(DBX, DBY, DBW, DBD, 40, 'db'), drw: block(600, 291, 170, 56, 22, 'drw'), cat: block(724, 300, 40, 38, 20, 'cat'),
  };
  B.cat.base = 22;   // o gato fica em cima da gaveta
  const NAMES = Object.keys(B);
  const posY = n => n === 'p1' || n === 'g1' ? (REP() ? ROWY[0] : MIDY) : B[n].y;
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 8 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 6 : 4) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera (balões fixos e mensagens que viajam) ──
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
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12)], MSGS = [tag(11), tag(11), tag(11)];

  // ── rotas (no chão, z = 10) ──
  const rev = pts => pts.slice().reverse();
  const P3 = (...l) => l.map(([x, y]) => [x, y, Z]);
  const lane = w => REP() ? (w === 'bia' ? 155 : 285) : (w === 'bia' ? 205 : 235);
  const toPod = w => REP() ? P3([CLX + CLW, lane(w)], [PX, lane(w)])
    : w === 'bia' ? P3([CLX + CLW, 150], [220, 150], [220, 205], [PX, 205]) : P3([CLX + CLW, 290], [220, 290], [220, 235], [PX, 235]);
  const toDb = w => P3([PX + PW, lane(w)], [DBX, lane(w)]);
  const toGate = w => P3([PX + PW, lane(w)], [GX - 2, lane(w)]);
  const toRedis = w => w === 'bia' ? P3([300, ROWY[0]], [300, 106], [210, 106], [210, RDY + RDD]) : P3([PX + PW, 300], [442, 300], [442, 102], [232, 102], [232, RDY + RDD]);
  // deadlock: cada operação vai direto à sua 1ª trava; a 2ª fica do outro lado e as duas rotas se cruzam
  const RA = P3([CLX + CLW, 150], [PX, 150]), CB = P3([CLX + CLW, 290], [PX, 290]);
  const RB = P3([CLX + CLW, 178], [226, 178], [226, 268], [PX, 268]), CA = P3([CLX + CLW, 262], [238, 262], [238, 172], [PX, 172]);
  const LKDB = [P3([PX + PW, 155], [DBX, 155]), P3([PX + PW, 285], [DBX, 285])];
  // balões: na faixa livre ao lado de cada peça
  const ABOVE = k => ({
    bia: [105, 102, 34], caio: [105, 340, 12], p1: REP() ? [340, 102, 34] : [340, 166, 30], p2: [340, 340, 12],
    g1: REP() ? [480, 102, 34] : [480, 166, 30], g2: [480, 340, 12], lkA: [340, 102, 34], lkB: [340, 340, 12],
    rd: [131, 96, 70], db: [683, 136, 60], drw: [520, 332, 26], cat: [744, 290, 44] }[k] || k);
  const T = (o, at, text, tone = 'acc') => o.tags.push([...(Array.isArray(at) ? at : ABOVE(at)), text, tone]);

  // uma mensagem que viaja entre os instantes a e b (em ms do relógio da história), com o texto do dado real
  function leg(o, ms, a, b, pts, text, tone = 'hi', hold) {
    if (ms < a) return false; const f = clamp((ms - a) / (b - a)), h = hold == null ? (b - a) * 0.9 : hold;
    if (f < 1 || ms <= b + h) { o.beams.push({ pts, on: true, dot: f < 1 ? f : null, tone: tone === 'bad' ? 'bad' : '' }); if (text && ms <= b + Math.min(h, (b - a) * 3)) o.msgs.push([pts, f, text, tone]);
      if (f < 1) o.dots.push(alongPts(pts, cumLen(pts), f)); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const wire = (o, pts, on, tone) => o.beams.push({ pts, on, tone });
  const C3 = (...c) => c;   // contadores do mostrador: [rótulo, valor, tom]

  // ── estado de cada cenário num instante ms (as duas fichas, o serviço, as travas e o banco) ──
  function base() {
    const rep = REP(), dl = sc === 'deadlock';
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], msgs: [], dots: [], cnt: [], res: [], ev: [], q: 1, qx: '', ms: 0, sql: null };
    NAMES.forEach(n => o.show[n] = 0);
    o.show.bia = o.show.caio = o.show.db = o.show.drw = 1;
    o.show.p1 = dl ? 0 : 1; o.show.p2 = rep ? 1 : 0; o.show.lkA = o.show.lkB = dl ? 1 : 0;
    o.show.g1 = sc === 'mutex' || sc === 'replicas' ? 1 : 0; o.show.g2 = sc === 'replicas' ? 1 : 0;
    o.show.rd = sc === 'redis' || sc === 'ttl' ? 1 : 0;
    o.rows.bia = { name: 'BIA · SP', lang: '14:02:10.000', rows: [['ainda não clicou', 'dim']] };
    o.rows.caio = { name: 'CAIO · RIO', lang: '14:02:10.002', rows: [['ainda não clicou', 'dim']] };
    o.rows.p1 = { name: 'estoque-1', lang: 'Go · 1 vCPU', rows: [['reservar(GATO-042)', 'dim']] };
    o.rows.p2 = { name: 'estoque-2', lang: 'Go · 1 vCPU', rows: [['reservar(GATO-042)', 'dim']] };
    o.rows.g1 = { name: 'MUTEX', rows: [['livre', 'dim']] }; o.rows.g2 = { name: 'MUTEX', rows: [['livre', 'dim']] };
    o.rows.rd = { name: 'REDIS', lang: '1 ms ida e volta', rows: [[KEY, 'dim'], ['(chave não existe)', 'dim']] };
    o.rows.db = { name: 'POSTGRESQL', lang: 'banco loja', rows: [['tabela estoque', 'dim'], ['2 ms por SELECT/UPDATE', 'dim']] };
    o.rows.lkA = { name: 'TRAVA', lang: 'estoque:GATO-042', rows: [['dona: ninguém', 'dim']] };
    o.rows.lkB = { name: 'TRAVA', lang: 'pedido:1049', rows: [['dona: ninguém', 'dim']] };
    if (dl) { o.rows.bia = { name: 'RESERVAR', lang: 'pedido 1049', rows: [['esperando o pagamento', 'dim']] };
      o.rows.caio = { name: 'CANCELAR', lang: 'pedido 1049', rows: [['a Bia ainda não clicou', 'dim']] }; o.q = 0; }
    return o;
  }
  const st = (o, k, ...rows) => { o.rows[k] = { ...o.rows[k], rows }; };
  const lit = (o, ...ks) => ks.forEach(k => { o.on[k] = 1; });

  const WORLD = {
    // sem trava, 1 réplica: as duas leituras acontecem antes da primeira baixa
    race(o, ms) {
      o.q = ms >= 6 ? -1 : ms >= 4 ? 0 : 1;
      o.ev = [[0, 'Bia SELECT'], [2, 'Caio SELECT'], [4, 'Bia → 0'], [6, 'Caio → −1', 'bad']];
      wire(o, toPod('bia'), ms >= 0 && ms < 6.5); if (ms >= 2) wire(o, toPod('caio'), ms < 6.5);
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'lê 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), 'SELECT'); leg(o, ms, 3, 4, rev(toDb('caio')), 'lê 1', 'acc');
      leg(o, ms, 4, 5, toDb('caio'), 'UPDATE'); leg(o, ms, 5, 6, rev(toDb('caio')), 'UPDATE 1 → −1', 'bad');
      st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 2 ? ['SELECT…'] : ms < 4 ? ['leu 1 · UPDATE…', 'acc'] : ms < 6 ? ['UPDATE ok'] : ['pedido 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 4 ? ['SELECT…'] : ms < 6 ? ['leu 1 · UPDATE…', 'bad'] : ['reserva ok também', 'bad']);
      st(o, 'p1', ['Bia: ' + (ms < 2 ? 'checando' : ms < 4 ? 'q = 1 → baixar' : 'pronto'), ms < 4 && ms >= 0 ? 'acc' : 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 4 ? 'checando' : ms < 6 ? 'q = 1 → baixar' : 'pronto'), ms >= 4 && ms < 6 ? 'bad' : 'dim']);
      const n = (ms >= 4) + (ms >= 6);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''], ['reservas confirmadas', String(n), n > 1 ? 'bad' : '']);
      if (ms >= 3 && ms < 6) T(o, 'p1', 'os dois leram 1', 'bad'); if (ms >= 6) T(o, 'drw', '2 reservas, 1 gato', 'bad');
      o.res = ms >= 6 ? ['Bia: pedido 1049 · Caio: reserva ok', 'quantidade = −1: o gato foi vendido 2 vezes'] : ms >= 4 ? ['Bia: UPDATE 1 (quantidade = 0)'] : ms >= 2 ? ['Bia leu 1 · Caio leu 1'] : ms >= 1 ? ['Bia leu 1'] : [];
    },
    // sync.Mutex numa réplica: o Caio espera a cancela abrir
    mutex(o, ms, v) {
      const defer = v === 'defer';
      o.q = ms >= 4 ? 0 : 1;
      o.ev = [[0, 'Bia Lock'], [2, 'Caio espera'], [4, 'Bia Unlock'], [6, 'Caio 409', 'acc']];
      if (defer) o.ev = [[0, 'Bia Lock'], [4, 'Bia Unlock'], [6, 'Caio 409 sem Unlock', 'bad'], [10, 'Caio de novo'], [2010, 'timeout 2 s', 'bad']];
      const hold = ms < 0 ? '' : ms < 4 ? 'Bia' : ms < 6 || defer ? 'Caio' : '';
      const wait = ms >= 2 && ms < 4 ? 'Caio' : defer && ms >= 10 && ms < 2010 ? 'Caio (2º clique)' : '';
      wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 6.5 || (defer && ms >= 10 && ms < 2011));
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'lê 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      if (ms >= 2 && ms < 4) leg(o, ms, 2, 2.6, toGate('caio'), 'mu.Lock() · espera', 'bad', 2);
      leg(o, ms, 4, 5, toDb('caio'), 'SELECT'); leg(o, ms, 5, 6, rev(toDb('caio')), 'lê 0', 'acc');
      if (defer && ms >= 10) leg(o, ms, 10, 10.6, toGate('caio'), 'mu.Lock() · presa', 'bad', 1e6);
      st(o, 'g1', [hold ? 'dono: ' + hold : 'livre', hold ? (defer && ms >= 6 ? 'bad' : 'acc') : 'dim'], [wait ? 'fila: ' + wait : defer && ms >= 6 ? 'ninguém solta' : '', wait || (defer && ms >= 6) ? 'bad' : 'dim']);
      if (hold) o.on.g1 = defer && ms >= 6 ? 'bad' : 2;
      st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 2 ? ['Lock · SELECT…'] : ms < 4 ? ['leu 1 · UPDATE…', 'acc'] : ['pedido 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 4 ? ['esperando a trava', 'bad'] : ms < 6 ? ['Lock · SELECT…'] : !defer || ms < 10 ? ['409 sem estoque', 'acc']
        : ms < 2010 ? ['2º clique: esperando…', 'bad'] : ['erro: timeout de 2 s', 'bad']);
      st(o, 'p1', ['seção crítica: ' + (hold || 'vazia'), hold ? 'acc' : 'dim'], [defer ? 'Unlock sem defer' : 'defer mu.Unlock()', defer ? 'bad' : 'dim']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q)], defer && ms >= 10 ? ['Caio esperando há', num(Math.min(2000, ms - 10)) + ' ms', 'bad'] : ['trava', hold ? 'dono: ' + hold : 'livre', defer && ms >= 6 ? 'bad' : '']);
      if (ms >= 2.4 && ms < 4) T(o, 'g1', 'Caio espera a Bia soltar', 'bad'); if (!defer && ms >= 6) T(o, 'caio', '409 em t = 6 ms', 'acc');
      if (defer && ms >= 6) T(o, 'g1', 'trava presa: o return\npulou o Unlock', 'bad');
      o.res = defer && ms >= 2010 ? ['2º clique: timeout de 2 s', 'a trava continua presa'] : defer && ms >= 6 ? ['Caio: 409 · Unlock nunca rodou', 'a trava ficou presa'] : ms >= 6 ? ['Bia: pedido 1049 · Caio: 409 sem estoque', 'quantidade = 0'] : ms >= 4 ? ['Bia: UPDATE 1 · Unlock'] : ms >= 2 ? ['Caio parado no mu.Lock()'] : [];
    },
    // o banco decide: UPDATE … AND quantidade > 0 (otimista), SELECT … FOR UPDATE (pessimista), ou sem a condição
    condicional(o, ms, v) {
      const pess = v === 'pess', sem = v === 'sem';
      if (pess) {
        o.q = ms >= 4 ? 0 : 1;
        o.ev = [[0, 'Bia FOR UPDATE'], [1, 'linha travada'], [3, 'Caio espera'], [4, 'COMMIT'], [5, 'Caio lê 0', 'acc']];
        const lockBy = ms >= 1 && ms < 4 ? 'Bia' : ms >= 4 && ms < 5 ? 'Caio' : '';
        o.qx = lockBy ? 'linha travada: ' + lockBy : ms >= 5 ? 'linha livre' : '';
        wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 5.5);
        leg(o, ms, 0, 1, toDb('bia'), 'SELECT … FOR UPDATE'); leg(o, ms, 1, 2, rev(toDb('bia')), 'lê 1 · trava a linha', 'acc');
        leg(o, ms, 2, 3, toDb('bia'), 'UPDATE · COMMIT'); leg(o, ms, 3, 4, rev(toDb('bia')), 'COMMIT ok', 'acc');
        leg(o, ms, 2, 3, toDb('caio'), 'SELECT … FOR UPDATE', ms < 4 ? 'bad' : 'hi', 1); if (ms >= 3 && ms < 4) o.on.db = 'bad';
        leg(o, ms, 4, 5, rev(toDb('caio')), 'lê 0 → ROLLBACK', 'acc');
        st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 2 ? ['SELECT … FOR UPDATE'] : ms < 4 ? ['UPDATE · COMMIT…', 'acc'] : ['pedido 1049 · 88.90', 'acc']);
        st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 4 ? ['espera o COMMIT', 'bad'] : ms < 5 ? ['lendo…'] : ['409 sem estoque', 'acc']);
        st(o, 'db', ['tabela estoque', 'dim'], [lockBy ? 'linha travada: ' + lockBy : 'nenhuma linha travada', lockBy ? 'acc' : 'dim']);
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q)], ['linha travada por', lockBy || '—', lockBy ? 'acc' : 'dim']);
        if (ms >= 3 && ms < 4) T(o, 'db', 'Caio parado: linha travada', 'bad');
        o.res = ms >= 5 ? ['Bia: COMMIT · pedido 1049', 'Caio: leu 0 → ROLLBACK → 409'] : ms >= 3 ? ['Caio parado na linha travada'] : ms >= 2 ? ['Bia leu 1 e travou a linha'] : [];
        return;
      }
      o.q = ms >= 4 && sem ? -1 : ms >= 2 ? 0 : 1;
      o.ev = sem ? [[0, 'Bia UPDATE'], [2, 'Bia: 1 linha'], [4, 'Caio: 1 linha', 'bad']] : [[0, 'Bia UPDATE'], [2, 'Bia: 1 linha'], [4, 'Caio: 0 linhas', 'acc']];
      wire(o, toPod('bia'), ms >= 0 && ms < 2.5); if (ms >= 2) wire(o, toPod('caio'), ms < 4.5);
      leg(o, ms, 0, 1, toDb('bia'), sem ? 'UPDATE (sem condição)' : 'UPDATE … AND q > 0'); leg(o, ms, 1, 2, rev(toDb('bia')), 'UPDATE 1 · q = 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), sem ? 'UPDATE (sem condição)' : 'UPDATE … AND q > 0');
      leg(o, ms, 3, 4, rev(toDb('caio')), sem ? 'UPDATE 1 · q = −1' : 'UPDATE 0 → 409', sem ? 'bad' : 'acc');
      st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 2 ? ['UPDATE…'] : ['1 linha · pedido 1049', 'acc']);
      st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 4 ? ['UPDATE…'] : sem ? ['1 linha · reserva ok', 'bad'] : ['0 linhas · 409', 'acc']);
      st(o, 'p1', ['sem mutex, sem Redis', 'dim'], [sem ? 'só o UPDATE, sem condição' : 'quem decide: o banco', sem ? 'bad' : 'acc']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''],
        ['linhas afetadas', (ms >= 2 ? 'Bia 1' : 'Bia …') + ' · ' + (ms >= 4 ? 'Caio ' + (sem ? 1 : 0) : 'Caio …'), sem && ms >= 4 ? 'bad' : '']);
      if (ms >= 4) T(o, 'drw', sem ? 'os dois afetaram 1 linha' : 'Bia 1 linha · Caio 0 linhas', sem ? 'bad' : 'acc');
      o.res = ms >= 4 ? (sem ? ['Bia: UPDATE 1 · Caio: UPDATE 1', 'quantidade = −1 de novo'] : ['Bia: UPDATE 1 → pedido 1049', 'Caio: UPDATE 0 → 409 sem estoque']) : ms >= 2 ? ['Bia: UPDATE 1 (quantidade = 0)'] : [];
    },
    // duas réplicas: cada uma com o seu sync.Mutex; as duas cancelas abrem
    replicas(o, ms) {
      o.q = ms >= 6 ? -1 : ms >= 4 ? 0 : 1;
      o.ev = [[0, 'Bia Lock (1)'], [2, 'Caio Lock (2)'], [4, 'Bia → 0'], [6, 'Caio → −1', 'bad']];
      const h1 = ms >= 0 && ms < 4, h2 = ms >= 2 && ms < 6;
      wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 6.5);
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'lê 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), 'SELECT'); leg(o, ms, 3, 4, rev(toDb('caio')), 'lê 1', 'bad');
      leg(o, ms, 4, 5, toDb('caio'), 'UPDATE'); leg(o, ms, 5, 6, rev(toDb('caio')), 'UPDATE 1 → −1', 'bad');
      st(o, 'g1', [h1 ? 'dono: Bia' : 'livre', h1 ? 'acc' : 'dim'], ['só no estoque-1', 'dim']); if (h1) o.on.g1 = 2;
      st(o, 'g2', [h2 ? 'dono: Caio' : 'livre', h2 ? 'acc' : 'dim'], ['só no estoque-2', 'dim']); if (h2) o.on.g2 = 2;
      st(o, 'p1', ['memória do processo 1', 'dim'], ['Bia: ' + (ms < 0 ? '—' : ms < 2 ? 'checando' : ms < 4 ? 'q = 1 → baixar' : 'pronto'), 'dim']);
      st(o, 'p2', ['memória do processo 2', 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 4 ? 'checando' : ms < 6 ? 'q = 1 → baixar' : 'pronto'), ms >= 4 && ms < 6 ? 'bad' : 'dim']);
      st(o, 'bia', ms < 0 ? ['LB → estoque-1', 'dim'] : ms < 2 ? ['Lock ok · SELECT…'] : ms < 4 ? ['leu 1 · UPDATE…', 'acc'] : ['pedido 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['LB → estoque-2', 'dim'] : ms < 4 ? ['Lock ok · SELECT…', 'bad'] : ms < 6 ? ['leu 1 · UPDATE…', 'bad'] : ['reserva ok também', 'bad']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''], ['travas com dono', String(h1 + h2), h1 && h2 ? 'bad' : '']);
      if (ms >= 2.2) T(o, 'g2', 'mutex do estoque-2:\nnão vê o do estoque-1', 'bad'); if (ms >= 6) T(o, 'drw', 'quantidade −1 de novo', 'bad');
      o.res = ms >= 6 ? ['dois mutex, dois donos ao mesmo tempo', 'quantidade = −1 de novo'] : ms >= 2 ? ['as duas cancelas abriram'] : [];
    },
    // a cancela vira uma chave no Redis com token e TTL; o Caio tenta de novo a cada 50 ms
    redis(o, ms) {
      o.q = ms >= 5 ? 0 : 1;
      o.ev = [[1, 'Bia SET OK'], [3, 'Caio nil'], [6, 'Bia DEL'], [53, 'Caio tenta'], [54, 'Caio SET OK'], [56, 'Caio 409', 'acc']];
      const own = ms >= 1 && ms < 6 ? ['a1', ms - 1] : ms >= 54 && ms < 57 ? ['b2', ms - 54] : null;
      st(o, 'rd', [KEY, own ? 'acc' : 'dim'], [own ? `= ${own[0]} · TTL ${num(5000 - own[1])} ms` : '(chave não existe)', own ? 'acc' : 'dim']); if (own) o.on.rd = 2;
      wire(o, toPod('bia'), ms >= 0 && ms < 6.5); if (ms >= 2) wire(o, toPod('caio'), ms < 57.5);
      leg(o, ms, 0, 0.5, toRedis('bia'), 'SET … a1 NX PX 5000'); leg(o, ms, 0.5, 1, rev(toRedis('bia')), 'OK', 'acc');
      leg(o, ms, 1, 2, toDb('bia'), 'SELECT'); leg(o, ms, 2, 3, rev(toDb('bia')), 'lê 1', 'acc');
      leg(o, ms, 3, 4, toDb('bia'), 'UPDATE'); leg(o, ms, 4, 5, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 5, 5.5, toRedis('bia'), 'EVAL (DEL se for a1)'); leg(o, ms, 5.5, 6, rev(toRedis('bia')), '1 · apagou', 'acc');
      leg(o, ms, 2, 2.5, toRedis('caio'), 'SET … b2 NX PX 5000'); leg(o, ms, 2.5, 3, rev(toRedis('caio')), 'nil', 'bad', 2);
      leg(o, ms, 53, 53.5, toRedis('caio'), 'SET … b2 NX PX 5000'); leg(o, ms, 53.5, 54, rev(toRedis('caio')), 'OK', 'acc');
      leg(o, ms, 54, 55, toDb('caio'), 'SELECT'); leg(o, ms, 55, 56, rev(toDb('caio')), 'lê 0 → 409', 'acc');
      leg(o, ms, 56, 56.5, toRedis('caio'), 'EVAL (DEL se for b2)'); leg(o, ms, 56.5, 57, rev(toRedis('caio')), '1 · apagou', 'acc');
      st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 1 ? ['SET NX…'] : ms < 5 ? ['trava a1 · trabalhando', 'acc'] : ['pedido 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 3 ? ['SET NX…'] : ms < 53 ? ['nil · dorme 50 ms', 'bad'] : ms < 54 ? ['tenta de novo…'] : ms < 56 ? ['trava b2 · SELECT…', 'acc'] : ['409 sem estoque', 'acc']);
      st(o, 'p1', ['sem mutex local', 'dim'], ['Bia: ' + (ms < 1 ? 'pedindo a trava' : ms < 6 ? 'com a trava a1' : 'soltou'), ms >= 1 && ms < 6 ? 'acc' : 'dim']);
      st(o, 'p2', ['sem mutex local', 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 54 ? 'sem a trava' : ms < 57 ? 'com a trava b2' : 'soltou'), ms >= 3 && ms < 54 ? 'bad' : ms >= 54 && ms < 57 ? 'acc' : 'dim']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['trava', own ? `${own[0]} · TTL ${num(5000 - own[1])} ms` : 'livre', own ? 'acc' : 'dim'], ['quantidade', qs(o.q)]);
      if (ms >= 3 && ms < 53) T(o, 'p2', 'nil: dorme 50 ms', 'bad'); if (ms >= 1 && ms < 6) T(o, 'rd', 'dona: Bia (a1)', 'acc'); if (ms >= 54 && ms < 57) T(o, 'rd', 'dono: Caio (b2)', 'acc');
      o.res = ms >= 56 ? ['Caio: trava b2 · leu 0 → 409', 'Bia: pedido 1049'] : ms >= 6 ? ['Bia soltou a trava em t = 6 ms', 'Caio dorme até t = 53 ms'] : ms >= 3 ? ['Bia: OK (trava a1)', 'Caio: nil (já existe)'] : ms >= 1 ? ['Bia: OK'] : [];
    },
    // e se der errado: o estoque-1 para 6 s, o TTL de 5 s vence e a trava tem dois donos
    ttl(o, ms, v) {
      const fence = v === 'fence', TOK = fence ? { a: '33', b: '34' } : { a: 'a1', b: 'b2' };
      const bUpd = ms >= 6002;
      o.q = ms < 5007 ? 1 : bUpd && !fence ? -1 : 0;
      o.ev = [[1, 'Bia trava'], [3, 'pausa'], [5001, 'TTL vence', 'bad'], [5003, 'Caio trava'], [5007, 'Caio → 0'], [6000, 'Bia acorda'], [6002, fence ? 'Bia recusada' : 'Bia → −1', fence ? 'acc' : 'bad']];
      const own = ms >= 1 && ms < 5001 ? ['a', ms - 1] : ms >= 5003 && ms < 5008 ? ['b', ms - 5003] : null;
      st(o, 'rd', [KEY, own ? 'acc' : 'dim'], [own ? `= ${TOK[own[0]]} · TTL ${num(5000 - own[1])} ms` : ms >= 5001 && ms < 5003 ? 'TTL venceu: a chave sumiu' : '(chave não existe)', own ? 'acc' : ms >= 5001 && ms < 5003 ? 'bad' : 'dim']);
      if (own) o.on.rd = 2; if (ms >= 5001 && ms < 5003.5) o.on.rd = 'bad';
      const paused = ms >= 3 && ms < 6000;
      wire(o, toPod('bia'), ms >= 0 && ms < 6003); if (ms >= 2) wire(o, toPod('caio'), ms < 5009);
      leg(o, ms, 0, 0.5, toRedis('bia'), `SET … ${fence ? 'NX (token 33)' : 'a1 NX PX 5000'}`); leg(o, ms, 0.5, 1, rev(toRedis('bia')), 'OK', 'acc');
      leg(o, ms, 1, 2, toDb('bia'), 'SELECT'); leg(o, ms, 2, 3, rev(toDb('bia')), 'lê 1', 'acc');
      if (paused) { o.on.p1 = 'bad'; }
      leg(o, ms, 6000, 6001, toDb('bia'), fence ? 'UPDATE … token 33' : 'UPDATE', 'bad');
      leg(o, ms, 6001, 6002, rev(toDb('bia')), fence ? 'UPDATE 0 · 33 < 34' : 'UPDATE 1 → −1', fence ? 'acc' : 'bad');
      leg(o, ms, 2, 2.5, toRedis('caio'), 'SET … NX'); leg(o, ms, 2.5, 3, rev(toRedis('caio')), 'nil', 'bad', 0.5);
      // as tentativas do Caio: uma a cada 50 ms (3, 53, 103 … 4.953); a de 5.003 ms é a primeira depois do vencimento
      let tries = ms >= 3 ? 1 : 0;
      if (ms >= 3 && ms < 5003) { const k = Math.floor((ms - 3) / 50), at = 3 + 50 * k; tries = k + 1;
        if (ms < 5001) { leg(o, ms, at, at + 25, toRedis('caio'), `SET NX · ${tries}ª tentativa`, 'bad', 0); if (ms - at >= 25) leg(o, ms, at + 25, at + 50, rev(toRedis('caio')), 'nil', 'bad', 0); } }
      if (ms >= 5003) tries = 101;
      leg(o, ms, 5002.4, 5002.7, toRedis('caio'), 'SET NX · 101ª tentativa', 'hi', 0); leg(o, ms, 5002.7, 5003, rev(toRedis('caio')), 'OK · ' + (fence ? 'token 34' : 'b2'), 'acc');
      leg(o, ms, 5003, 5004, toDb('caio'), 'SELECT'); leg(o, ms, 5004, 5005, rev(toDb('caio')), 'lê 1', 'acc');
      leg(o, ms, 5005, 5006, toDb('caio'), fence ? 'UPDATE … token 34' : 'UPDATE'); leg(o, ms, 5006, 5007, rev(toDb('caio')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 5007, 5007.5, toRedis('caio'), 'EVAL (DEL se for b2)'); leg(o, ms, 5007.5, 5008, rev(toRedis('caio')), '1 · apagou', 'acc', 400);
      if (fence) o.qx = ms >= 5007 ? 'último token = 34' : 'último token = 32';
      st(o, 'p1', ['Bia · trava ' + TOK.a, 'dim'], [paused ? 'PAUSADO (GC / rede)' : ms >= 6000 ? 'acordou: "a trava é minha"' : ms >= 1 ? 'com a trava' : '—', paused || ms >= 6000 ? 'bad' : 'acc']);
      st(o, 'p2', ['Caio · trava ' + TOK.b, 'dim'], [ms < 2 ? '—' : ms < 5003 ? `nil · ${tries}ª tentativa` : ms < 5008 ? 'com a trava' : 'compra feita', ms < 5003 && ms >= 3 ? 'bad' : 'acc']);
      st(o, 'bia', ms < 0 ? ['clica comprar', 'dim'] : ms < 3 ? ['trava ok · leu 1', 'acc'] : ms < 6000 ? ['esperando…', 'dim'] : ms < 6002 ? ['UPDATE…', 'bad'] : fence ? ['recusada pelo banco', 'acc'] : ['reserva ok: 2ª venda', 'bad']);
      st(o, 'caio', ms < 2 ? ['ainda não clicou', 'dim'] : ms < 5003 ? ['tenta a cada 50 ms', 'bad'] : ms < 5007 ? ['trava ok · SELECT…', 'acc'] : ['comprou o gato', 'acc']);
      if (paused) T(o, 'p1', 'estoque-1 parado 6 s', 'bad'); if (ms >= 5001 && ms < 5003) T(o, 'rd', 'TTL venceu: a chave sumiu', 'bad');
      if (ms >= 6002) T(o, 'drw', fence ? '33 < 34: escrita recusada' : 'dois donos: −1', fence ? 'acc' : 'bad');
      const ttl = own ? 5000 - own[1] : 0;
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['TTL da trava', own ? `${TOK[own[0]]} · ${num(ttl)} ms` : ms >= 5001 && ms < 5003 ? 'venceu' : 'livre', own ? 'acc' : ms >= 5001 && ms < 5003 ? 'bad' : 'dim'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : '']);
      o.res = ms >= 6002 ? (fence ? ['Bia: UPDATE 0 (token 33 < 34)', 'quantidade continua 0'] : ['Bia: UPDATE 1 → quantidade = −1', 'dois donos da mesma trava'])
        : ms >= 6000 ? ['estoque-1 acordou após 6 s'] : ms >= 5007 ? ['Caio: UPDATE 1 → comprou'] : ms >= 5003 ? ['Caio: OK · trava ' + TOK.b] : ms >= 5001 ? ['TTL venceu: a chave sumiu'] : ms >= 3 ? [`Caio: nil (${tries}ª tentativa)`, 'estoque-1 parado'] : ms >= 1 ? ['Bia: OK · trava ' + TOK.a] : [];
    },
    // reserva × estorno: duas travas pegas em ordem cruzada
    deadlock(o, ms, v) {
      const ordem = v === 'ordem', pg = v === 'pg', mem = v === 'mem';
      let hA = '', hB = '', wA = '', wB = '';
      if (ordem) {
        o.ev = [[0, 'R trava estoque'], [1, 'C espera estoque'], [2, 'R trava pedido'], [4, 'R COMMIT', 'acc'], [5, 'C trava pedido'], [7, 'C COMMIT', 'acc']];
        hA = ms >= 0 && ms < 4 ? 'reservar' : ms >= 4 && ms < 7 ? 'cancelar' : ''; hB = ms >= 2 && ms < 4 ? 'reservar' : ms >= 5 && ms < 7 ? 'cancelar' : '';
        wA = ms >= 1 && ms < 4 ? 'cancelar' : '';
        leg(o, ms, -0.6, 0, RA, 'trava estoque', 'acc', 4); leg(o, ms, 0.4, 1, CA, 'trava estoque? espera', ms < 4 ? 'bad' : 'acc', 6);
        leg(o, ms, 1.4, 2, RB, 'trava pedido', 'acc', 2); leg(o, ms, 4.4, 5, CB, 'trava pedido', 'acc', 2);
        st(o, 'bia', ms < 4 ? ['estoque → pedido', 'acc'] : ['COMMIT · soltou as 2', 'acc']);
        st(o, 'caio', ms < 1 ? ['vai pedir o estoque', 'dim'] : ms < 4 ? ['espera na 1ª trava', 'bad'] : ms < 7 ? ['estoque → pedido', 'acc'] : ['COMMIT · estorno feito', 'acc']);
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['ordem das travas', 'estoque → pedido'], ['ciclo', 'nenhum', 'acc']);
        if (ms >= 1 && ms < 4) T(o, 'lkA', 'cancelar espera aqui,\nsem segurar nada', 'acc');
        o.res = ms >= 7 ? ['reservar: COMMIT em t = 4 ms', 'cancelar: COMMIT em t = 7 ms'] : ms >= 1 ? ['cancelar espera na 1ª trava', 'sem segurar nada: não há ciclo'] : [];
      } else {
        o.ev = [[0, 'R trava estoque'], [1, 'C trava pedido'], [2, 'R espera'], [3, 'C espera · ciclo', 'bad']];
        if (pg) o.ev.push([1002, '40P01', 'bad'], [1003, 'C segue', 'acc']);
        if (mem) o.ev.push([2000, 'timeout 2 s', 'bad']);
        const dead = pg && ms >= 1002;
        hA = ms >= 0 && !dead ? 'reservar' : dead ? 'cancelar' : ''; hB = ms >= 1 ? 'cancelar' : '';
        wB = ms >= 2 && !dead ? 'reservar' : ''; wA = ms >= 3 && !dead ? 'cancelar' : '';
        const cyc = ms >= 3 && !dead;
        leg(o, ms, -0.6, 0, RA, 'trava estoque', cyc ? 'bad' : 'acc', 1e6); leg(o, ms, 0.4, 1, CB, 'trava pedido', cyc ? 'bad' : 'acc', 1e6);
        if (!dead) { leg(o, ms, 1.4, 2, RB, 'pedido? espera', 'bad', 1e6); leg(o, ms, 2.4, 3, CA, 'estoque? espera', 'bad', 1e6); }
        else { wire(o, RB, false); leg(o, ms, 1002, 1003, CA, 'trava estoque', 'acc', 1e6);
          o.beams.forEach(b => { if (b.pts === RA) { b.on = false; b.tone = ''; } if (b.pts === CB) b.tone = ''; }); }
        if (cyc) { o.on.lkA = o.on.lkB = 'bad'; o.on.bia = o.on.caio = 'bad'; }
        if (pg && ms >= 3 && !dead) o.on.db = 2;
        st(o, 'bia', ms < 0 ? ['pagamento confirmou', 'dim'] : ms < 2 ? ['segura o estoque', 'acc'] : dead ? ['ERROR 40P01 · abortada', 'bad'] : ['segura estoque, quer pedido', 'bad']);
        st(o, 'caio', ms < 1 ? ['a Bia clicou cancelar', 'dim'] : ms < 3 ? ['segura o pedido', 'acc'] : dead ? (ms >= 1004 ? ['segue: estorno feito', 'acc'] : ['pegou o estoque', 'acc'])
          : mem && ms >= 2000 ? ['Bia: erro (timeout 2 s)', 'bad'] : ['segura pedido, quer estoque', 'bad']);
        if (pg) st(o, 'db', ['deadlock_timeout = 1 s', ms >= 3 && !dead ? 'acc' : 'dim'], [dead ? 'deadlock detected' : ms >= 3 ? `checa em ${num(Math.max(0, 1002 - ms))} ms` : 'nenhum ciclo', dead ? 'bad' : 'dim']);
        if (mem) st(o, 'db', ['travas em memória (Go)', 'dim'], ['o banco não vê o ciclo', ms >= 3 ? 'bad' : 'dim']);
        const waitMs = Math.max(0, Math.floor(ms - 3));
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['travas seguras', String((hA ? 1 : 0) + (hB ? 1 : 0))],
          dead ? ['resultado', '40P01 · reservar abortada', 'bad'] : cyc ? ['parados há', num(waitMs) + ' ms', 'bad'] : ['ciclo', ms >= 2 ? 'quase' : 'ainda não', 'dim']);
        if (cyc) T(o, [232, 220, 46], 'ciclo: cada um espera o outro', 'bad'); if (dead) T(o, 'db', 'deadlock detected · 40P01', 'bad');
        o.res = dead ? ['ERROR: deadlock detected', 'SQLSTATE 40P01 · cancelar segue'] : mem && ms >= 2000 ? ['Bia: erro (timeout de 2 s)', 'as 2 goroutines seguem presas'] : cyc ? ['reservar espera cancelar', 'cancelar espera reservar'] : ms >= 1 ? ['cada um segura uma trava'] : [];
      }
      st(o, 'lkA', ['dona: ' + (hA || 'ninguém'), hA ? 'acc' : 'dim'], ['espera: ' + (wA || '—'), wA ? 'bad' : 'dim']);
      st(o, 'lkB', ['dona: ' + (hB || 'ninguém'), hB ? 'acc' : 'dim'], ['espera: ' + (wB || '—'), wB ? 'bad' : 'dim']);
      if (!o.on.lkA && hA) o.on.lkA = 2; if (!o.on.lkB && hB) o.on.lkB = 2;
      o.qx = hA ? 'linha travada: ' + hA : '';
      LKDB.forEach((pts, i) => wire(o, pts, i ? !!hB : !!hA));
    },
  };

  // ── os passos: o que a história conta, o SQL/comando real e a janela do relógio (k = [segundo do passo, ms da história]) ──
  const K = (a, b, run = 2.8) => [[0.4, a], [0.4 + run, b]];
  const STEPS = {
    race: [
      { id: 'cena', k: [[0, -1]], clk: [0, 6], title: 'Resta 1 gato e dois cliques', sk: 'NO CÓDIGO · reservar (Go)',
        sql: ['q := lerQuantidade(sku)   // SELECT (2 ms)', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)               // UPDATE (2 ms)', 'return nil'],
        story: 'Depois do pedido 1048 da Lena, a linha GATO-042 da tabela estoque ficou com quantidade = 1: o último gato de pelúcia. A Bia, em SP, clica "comprar" às 14:02:10.000. O Caio, no Rio, clica 2 ms depois. Os dois caem no mesmo processo, o estoque-1, que roda o reservar: primeiro lê a quantidade, depois baixa.',
        look: 'A gaveta do banco mostra quantidade = 1 e o gato em cima. As duas fichas esperam à esquerda.',
        key: 'Ler e depois baixar são dois passos, e entre eles cabe outra pessoa.' },
      { id: 'bia', k: K(0, 2), clk: [0, 6], title: 't = 0: a Bia lê 1', sk: 'SQL · Bia, t = 0 ms', sql: SEL,
        story: 'Às 14:02:10.000 a reserva da Bia manda o SELECT. O banco responde em 2 ms: quantidade = 1. Ela passa no if q < 1 e vai baixar.',
        look: 'A luz sai do estoque-1 pela faixa da Bia, toca a gaveta e volta com "lê 1".',
        key: 'Até aqui está tudo certo: a Bia leu um estoque que existe.' },
      { id: 'janela', k: K(2, 4), clk: [0, 6], title: 't = 2: o Caio também lê 1', sk: 'SQL · Bia e Caio, t = 2 ms', sql: ['-- Bia:', ...UPD, '-- Caio, no mesmo instante:', ...SEL],
        story: 'Em t = 2 ms a Bia manda o UPDATE e o Caio chega com o SELECT dele. O UPDATE da Bia só confirma em t = 4 ms, então o Caio lê quantidade = 1, o mesmo valor que ela leu. Os dois passam no if.',
        look: 'Duas luzes correm ao mesmo tempo: o UPDATE da Bia e o SELECT do Caio. Em t = 4 a gaveta vai a 0 e o gato some.',
        key: 'A janela da corrida é o tempo entre checar e baixar: 2 ms.' },
      { id: 'menos1', k: K(4, 6), clk: [0, 6], title: 't = 6: quantidade = −1', sk: 'SQL · Caio, t = 4 ms', sql: UPD,
        story: 'Em t = 4 ms o Caio manda o UPDATE dele, baseado na leitura de 1 que ficou velha. Em t = 6 ms o banco confirma: quantidade = −1. A Bia ganha o pedido 1049 (88.90 com o frete de SP) e o Caio também recebe "reserva ok". Duas reservas para um gato.',
        look: 'A gaveta fica vermelha com −1; as duas fichas mostram a reserva confirmada.',
        key: 'Check-then-act sem trava: os dois checam, os dois agem, o estoque fica negativo.' },
      { id: 'ordens', k: [[0, 6]], clk: [0, 6], title: 'E se der errado: 4 de 6 ordens vendem duas vezes', sk: 'AS 6 ORDENS (B = Bia, C = Caio; 1 = checa, 2 = baixa)',
        sql: ['B1 B2 C1 C2  →  0 · Caio 409', 'C1 C2 B1 B2  →  0 · Bia 409', 'B1 C1 B2 C2  → −1', 'B1 C1 C2 B2  → −1', 'C1 B1 B2 C2  → −1', 'C1 B1 C2 B2  → −1'],
        story: 'Com 2 passos para cada um, existem 6 ordens possíveis. Só as 2 em que um pedido inteiro termina antes do outro começar dão certo. As outras 4 deixam a quantidade em −1. O cronômetro decide qual sai, e por isso o defeito aparece um dia e some no outro. O lab do artigo mostra o mesmo com 100 goroutines fazendo grelhados++: o total sai 97, 96, 100, 99…',
        look: 'A cena fica parada em t = 6 ms: −1 na gaveta e as duas reservas confirmadas.',
        key: 'Uma corrida não falha sempre; falha quando as ordens se misturam, e com tráfego elas se misturam.' },
    ],
    mutex: [
      { id: 'lock', k: K(0, 2), clk: [0, 6], title: 'Uma trava em volta do reservar', sk: 'NO CÓDIGO · reservar com sync.Mutex',
        sql: ['mu.Lock()', 'defer mu.Unlock()', 'q := lerQuantidade(sku)   // SELECT', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)               // UPDATE'],
        story: 'O conserto mais direto: um sync.Mutex em volta do reservar inteiro. Quem chega pega a trava; quem chega depois espera ela abrir. A Bia chega em t = 0, pega a trava e manda o SELECT: lê 1.',
        look: 'A cancela MUTEX, entre o estoque-1 e o banco, acende com "dono: Bia". A luz da Bia passa e volta com "lê 1".',
        key: 'Mutex: só uma goroutine por vez dentro da seção crítica.' },
      { id: 'espera', k: K(2, 4), clk: [0, 6], title: 't = 2: o Caio espera na cancela', sk: 'SQL · Bia, t = 2 ms', sql: ['-- Bia, com a trava:', ...UPD, '-- Caio: parado em mu.Lock()'],
        story: 'Em t = 2 ms o Caio chega e chama mu.Lock(). A trava é da Bia, então a goroutine dele dorme. Enquanto isso o UPDATE da Bia confirma em t = 4 ms (quantidade = 0) e o defer solta a trava.',
        look: 'A luz do Caio para vermelha na cancela. A gaveta vai a 0 e o gato some.',
        key: 'Quem chega com a trava ocupada espera, sem gastar CPU.' },
      { id: 'quatrocentos', k: K(4, 6), clk: [0, 6], title: 't = 6: o Caio lê 0 e leva 409', sk: 'SQL · Caio, t = 4 ms', sql: SEL,
        story: 'Em t = 4 ms a trava passa para o Caio. O SELECT dele lê quantidade = 0 e ele recebe 409 sem estoque em t = 6 ms, 4 ms depois de clicar. A Bia fica com o pedido 1049. O Caio não consome número de pedido.',
        look: 'A cancela troca de dono; a luz do Caio volta com "lê 0" e a ficha dele mostra 409.',
        key: 'Com a trava, a segunda leitura já vê o resultado da primeira escrita.' },
      { id: 'custo', k: [[0, 6]], clk: [0, 6], title: 'Quanto custa a trava', sk: 'A CONTA',
        sql: ['seção crítica = SELECT 2 ms + UPDATE 2 ms', '              = 4 ms', '1 s ÷ 4 ms = 250 reservas/s do mesmo SKU', '             nesta réplica'],
        story: 'A seção crítica tem 4 ms: o SELECT e o UPDATE. Enquanto ela dura, ninguém mais reserva o GATO-042 nesta réplica. Isso põe um teto: 1 s ÷ 4 ms = 250 reservas por segundo do mesmo SKU. O lab do artigo exagera de propósito e dorme 100 ms com o mutex travado: 100 itens viram 10 s em série.',
        look: 'O relógio para em t = 6 ms; a cancela está livre e a gaveta em 0.',
        key: 'Trave só o que precisa: cada ms dentro da trava é um ms de fila para todos.' },
      { id: 'defer', v: 'defer', k: [[0.3, 0], [1.6, 6], [2.3, 10], [4.6, 2010]], clk: [0, 2010], title: 'E se der errado: o Unlock que nunca roda', sk: 'NO CÓDIGO · sem defer',
        sql: ['mu.Lock()', 'q := lerQuantidade(sku)', 'if q < 1 { return ErrSemEstoque } // sai travado', 'baixar(sku)', 'mu.Unlock()'],
        story: 'Agora alguém tirou o defer e pôs o mu.Unlock() no fim. A Bia passa normalmente. O Caio lê 0 e sai pelo return ErrSemEstoque, antes do Unlock: a trava fica presa. Em t = 10 ms ele clica de novo e não recebe nem 409; a chamada fica parada na cancela até o timeout de 2 s do cliente. Toda reserva do gato nesta réplica para.',
        look: 'A cancela fica vermelha com "ninguém solta"; a segunda luz do Caio para nela e o relógio corre até 2.010 ms.',
        key: 'Todo caminho de saída precisa soltar a trava; o defer garante isso.' },
    ],
    condicional: [
      { id: 'bia', k: K(0, 2), clk: [0, 4], title: 'O banco checa e baixa num passo só', sk: 'SQL · Bia, t = 0 ms', sql: UPDC,
        story: 'E se o próprio banco checasse? O UPDATE com AND quantidade > 0 junta o checar e o baixar num comando só, atômico. A Bia manda em t = 0 e o banco responde em t = 2 ms: UPDATE 1, uma linha afetada. Quantidade = 0, pedido 1049.',
        look: 'O estoque-1 não tem cancela nenhuma. A luz da Bia volta com "UPDATE 1" e a gaveta vai a 0.',
        key: 'Escrita condicional: a condição vai junto com a escrita, e o banco faz as duas de uma vez.' },
      { id: 'caio', k: K(2, 4), clk: [0, 4], title: 't = 4: o Caio afeta 0 linhas', sk: 'SQL · Caio, t = 2 ms', sql: UPDC,
        story: 'O Caio manda o mesmo UPDATE em t = 2 ms. Agora quantidade > 0 é falso, então nenhuma linha muda: UPDATE 0. O código vê 0 linhas e devolve 409 em t = 4 ms. Sem mutex, sem Redis, e vale para quantas réplicas houver, porque quem decide é o banco.',
        look: 'A luz do Caio volta com "UPDATE 0 → 409"; a gaveta continua em 0.',
        key: 'Lock otimista: age e confere no fim; se outro mexeu antes, afeta 0 linhas e você trata.' },
      { id: 'pess', v: 'pess', k: K(0, 5, 3.4), clk: [0, 6], title: 'O pessimista: travar a linha antes', sk: 'SQL · Bia (e Caio igual)',
        sql: ['BEGIN;', 'SELECT quantidade FROM estoque', "  WHERE sku = 'GATO-042' FOR UPDATE;", 'UPDATE estoque SET quantidade = quantidade - 1', "  WHERE sku = 'GATO-042';", 'COMMIT;'],
        story: 'O outro jeito é travar a linha antes de ler: SELECT … FOR UPDATE. A Bia trava a linha em t = 1 ms, lê 1, baixa e faz COMMIT em t = 4 ms. O SELECT … FOR UPDATE do Caio chega em t = 3 ms e fica parado até o COMMIT dela; aí lê 0, faz ROLLBACK e devolve 409.',
        look: 'A gaveta mostra "linha travada: Bia"; a luz do Caio para vermelha no banco até t = 4 ms.',
        key: 'Lock pessimista: trava antes. Rende quando o conflito é a regra, como no último gato.' },
      { id: 'sem', v: 'sem', k: K(0, 4), clk: [0, 4], title: 'E se der errado: o UPDATE sem a condição', sk: 'SQL · Bia e Caio', sql: UPD,
        story: 'Agora alguém "simplifica" e tira o AND quantidade > 0. O UPDATE da Bia afeta 1 linha (quantidade = 0) e o do Caio também afeta 1 linha: quantidade = −1. A proteção inteira estava naquela condição.',
        look: 'As duas luzes voltam com "UPDATE 1"; a gaveta fica vermelha com −1.',
        key: 'Sem a condição no WHERE, o banco obedece e baixa de novo.' },
    ],
    replicas: [
      { id: 'sobe', k: [[0, -1]], clk: [0, 6], title: 'A Black Friday sobe a 2ª réplica', sk: 'NO CÓDIGO · o mesmo reservar com mutex',
        sql: ['var mu sync.Mutex   // um por processo', 'mu.Lock()', 'defer mu.Unlock()', 'q := lerQuantidade(sku)', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)'],
        story: 'Com a Black Friday, o autoscaling sobe o estoque-2. O load balancer manda a Bia para o estoque-1 e o Caio para o estoque-2. O código é o mesmo, com o sync.Mutex. Só que cada processo tem a sua memória, então cada um tem o seu mutex.',
        look: 'Duas réplicas, cada uma com a sua cancela MUTEX, e as duas faixas indo para a mesma gaveta.',
        key: 'Um mutex só protege as goroutines do mesmo processo.' },
      { id: 'duas', k: K(0, 4), clk: [0, 6], title: 'As duas cancelas abrem', sk: 'SQL · Bia (estoque-1) e Caio (estoque-2)', sql: ['-- estoque-1, t = 0:', ...SEL, '-- estoque-2, t = 2:', ...SEL],
        story: 'A Bia pega o mutex do estoque-1 em t = 0. O Caio pega o mutex do estoque-2 em t = 2 ms: está livre, porque ninguém naquele processo o usou. Os dois leem quantidade = 1.',
        look: 'As duas cancelas acendem ao mesmo tempo, cada uma com um dono.',
        key: 'Duas memórias, duas travas, nenhuma exclusão entre elas.' },
      { id: 'menos1', k: K(4, 6), clk: [0, 6], title: 'E se der errado: −1 de novo', sk: 'SQL · Caio (estoque-2), t = 4 ms', sql: UPD,
        story: 'A Bia baixa para 0 em t = 4 ms. O Caio, com a leitura velha de 1, baixa em t = 6 ms: quantidade = −1. É a corrida da aula 6 de volta, agora com uma trava em cada réplica. Para valer entre processos, a trava precisa morar fora deles.',
        look: 'A gaveta fica vermelha com −1, com as duas cancelas ainda acesas.',
        key: 'Com N réplicas, a trava tem de ser compartilhada: no banco, no Redis ou no ZooKeeper.' },
    ],
    redis: [
      { id: 'set', k: K(-0.2, 1, 2), clk: [0, 6], title: 'A trava vira uma chave no Redis', sk: 'COMANDO · Redis, t = 0 ms', sql: ['SET ' + KEY + ' a1 NX PX 5000', '-- NX: só cria se não existir', '-- PX 5000: some sozinha em 5 s', '-- a1: o token de quem travou'],
        story: 'A trava sai do processo e vai para o Redis, que as duas réplicas enxergam. Um comando só: SET com NX (cria só se não existir) e PX 5000 (TTL de 5 s). A Bia manda com o token a1 e recebe OK em t = 1 ms.',
        look: 'A luz do estoque-1 vai ao REDIS e volta com OK; a chave aparece com "= a1" e o TTL começa a descer.',
        key: 'Lock distribuído: uma chave que só um consegue criar, com prazo para sumir.' },
      { id: 'nil', k: K(1, 3), clk: [0, 6], title: 't = 3: o Caio recebe nil', sk: 'COMANDO · Caio, t = 2 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000', '-- resposta: (nil)', '-- a chave já existe: é da Bia'],
        story: 'A Bia lê 1 no banco. Em t = 2 ms o Caio, no estoque-2, tenta o mesmo SET com o token b2. A chave já existe, então o Redis responde nil em t = 3 ms. O Caio dorme 50 ms e tenta de novo.',
        look: 'A luz do estoque-2 sobe ao REDIS e volta vermelha com nil.',
        key: 'NX faz o checar e o criar num passo só, dentro do Redis.' },
      { id: 'del', k: K(3, 6), clk: [0, 6], title: 't = 6: a Bia baixa e solta', sk: 'COMANDO · Bia, t = 5 ms', sql: LUA,
        story: 'A Bia baixa para 0 em t = 5 ms e solta a trava em t = 6 ms. Solta conferindo o dono: o script Lua só apaga a chave se o valor ainda for a1. Ciclo inteiro: 1 ms de SET, 4 ms de trabalho, 1 ms de DEL.',
        look: 'A gaveta vai a 0; a luz vai ao REDIS com o EVAL e a chave some.',
        key: 'Só quem travou destrava: compare o token antes de apagar.' },
      { id: 'caio', k: [[0.3, 6], [1.4, 53], [2.4, 54], [3.4, 56], [4.0, 57]], clk: [0, 60], title: 't = 54: o Caio entra e leva 409', sk: 'COMANDO e SQL · Caio, t = 53 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000   -- OK', ...SEL, '-- lê 0 → 409 · EVAL solta em t = 57'],
        story: 'O Caio volta em t = 53 ms, recebe OK em t = 54 ms, lê quantidade = 0 e devolve 409 em t = 56 ms. Ele solta a trava em t = 57 ms. A Bia fica com o 1049 e o estoque fecha em 0, mesmo com duas réplicas.',
        look: 'O relógio pula a espera de 50 ms; a chave reaparece com "= b2" e a luz do Caio volta com "lê 0 → 409".',
        key: 'Com a trava fora do processo, as duas réplicas fazem fila na mesma chave.' },
      { id: 'custo', k: [[0, 57]], clk: [0, 60], title: 'Quanto custa: 166 reservas/s', sk: 'A CONTA',
        sql: ['ciclo da trava = SET 1 ms + trabalho 4 ms', '               + DEL 1 ms = 6 ms', '1 s ÷ 6 ms = 166 reservas/s por SKU', '-- o Caio esperou 54 ms (50 de sono)'],
        story: 'Cada reserva agora segura a chave por 6 ms: 1 de SET, 4 de SELECT e UPDATE, 1 de DEL. O teto é 1 s ÷ 6 ms = 166 reservas por segundo do mesmo SKU, somando as réplicas. E o Caio pagou 50 ms de sono porque a trava não tem fila; o ZooKeeper, com nós sequenciais, avisa o próximo da fila.',
        look: 'A cena fica parada em t = 57 ms: chave livre, gaveta em 0.',
        key: 'A trava distribuída custa ida e volta ao Redis e espera sem fila.' },
    ],
    ttl: [
      { id: 'trava', k: K(-0.2, 3, 2.4), clk: [0, 6010], title: 'A Bia trava e lê 1', sk: 'COMANDO e SQL · Bia, t = 0 ms', sql: ['SET ' + KEY + ' a1 NX PX 5000   -- OK', ...SEL, '-- lê 1 em t = 3 ms'],
        story: 'Mesmo começo do cenário Redis: a Bia, no estoque-1, pega a trava a1 com TTL de 5 s e lê quantidade = 1 em t = 3 ms. Falta só o UPDATE.',
        look: 'A chave aparece com "= a1 · TTL 5.000 ms". O relógio da frente vai até 6 s, porque desta vez a história demora.',
        key: 'O TTL existe para a trava não ficar presa se o dono morrer.' },
      { id: 'pausa', k: [[0.3, 3], [4.0, 5001]], clk: [0, 6010], title: 'O estoque-1 para por 6 s', sk: 'COMANDO · Caio, a cada 50 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000', '-- (nil) em t = 3, 53, 103 … 4.953 ms', '-- estoque-1: pausa longa (GC, rede ruim)'],
        story: 'Antes do UPDATE, o estoque-1 para: uma pausa longa de coleta de lixo ou de rede, de 6 s. Ele não morreu, então nada avisa ninguém. O Caio tenta a trava a cada 50 ms e recebe nil 100 vezes. Em t = 5.001 ms o TTL vence e a chave some sozinha.',
        look: 'O estoque-1 fica vermelho, "PAUSADO". O TTL desce até 0 e a chave some; a faixa do Caio pisca a cada tentativa.',
        key: 'O TTL não sabe se o dono morreu ou só está lento.' },
      { id: 'caio', k: [[0.3, 5001], [3.2, 5008]], clk: [0, 6010], title: 't = 5.003: o Caio pega a trava e compra', sk: 'COMANDO e SQL · Caio, t = 5.003 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000   -- OK', ...SEL, ...UPD.slice(0, 1), '-- lê 1, baixa para 0 em t = 5.007 ms'],
        story: 'A primeira tentativa do Caio depois do vencimento, em t = 5.003 ms, recebe OK com o token b2. Ele lê 1, baixa para 0 e compra o gato. Para o Redis está tudo certo: a chave tinha vencido.',
        look: 'A chave volta com "= b2"; a luz do Caio vai ao banco e a gaveta vai a 0.',
        key: 'Para o Redis, a trava venceu e tem dono novo. A Bia ainda não sabe.' },
      { id: 'dois', k: [[0.3, 5008], [1.6, 6000], [3.2, 6002]], clk: [0, 6010], title: 'E se der errado: dois donos, −1', sk: 'SQL · Bia, t = 6.000 ms', sql: UPD,
        story: 'Em t = 6.000 ms o estoque-1 acorda. Para ele, nada aconteceu: ainda tem a trava a1. Manda o UPDATE e o banco aceita: quantidade = −1. Se o Caio ainda estivesse com a trava, o DEL simples do lab (sem conferir o dono) apagaria a dele. O lab do artigo usa TTL de 10 s para um trabalho de 10 s, o mesmo risco.',
        look: 'O estoque-1 acorda e a luz da Bia vai direto ao banco; a gaveta fica vermelha com −1.',
        key: 'Uma trava com TTL pode vencer enquanto o dono ainda trabalha.' },
      { id: 'fence', v: 'fence', k: [[0.3, 5001], [2.2, 5008], [3.0, 6000], [4.4, 6002]], clk: [0, 6010], title: 'Fencing token: 33 < 34, recusado', sk: 'SQL · com fencing token',
        sql: ['-- Caio, token 34:', 'UPDATE estoque SET quantidade = quantidade - 1,', '  ultimo_token = 34', "  WHERE sku = 'GATO-042' AND ultimo_token < 34;", '-- Bia, token 33: mesma coisa com 33 → UPDATE 0'],
        story: 'O remédio de Kleppmann: o serviço de lock entrega um número que só cresce, 33 para a Bia e 34 para o Caio, e o banco recusa escrita com número menor que o maior já visto. A escrita do Caio grava 34. A da Bia, que acorda com 33, afeta 0 linhas. O SET NX do Redis não gera esse número; o ZooKeeper gera. E o UPDATE … AND quantidade > 0 também resolveria, sem depender de relógio.',
        look: 'A gaveta mostra "último token = 34"; a luz da Bia volta com "UPDATE 0 · 33 < 34" e a quantidade fica em 0.',
        key: 'Lock de correção precisa de fencing token ou de checagem no banco.' },
    ],
    deadlock: [
      { id: 'r', k: K(-0.6, 0.6, 1.6), clk: [0, 4], title: 'A reservar trava o estoque', sk: 'SQL · reservar(1049), t = 0 ms', sql: ['BEGIN;', 'SELECT * FROM estoque', "  WHERE sku = 'GATO-042' FOR UPDATE;", '-- depois: SELECT * FROM pedidos', '--   WHERE id = 1049 FOR UPDATE;'],
        story: 'Às 14:02:10.500 o pagamento do 1049 confirma e a reservar(1049) começa. Ela trava primeiro a linha do estoque, depois vai travar a do pedido.',
        look: 'A trava estoque:GATO-042 acende com "dona: reservar".',
        key: 'Cada operação precisa de duas travas: estoque e pedido.' },
      { id: 'c', k: K(0.6, 1.6, 1.6), clk: [0, 4], title: 't = 1: a cancelar trava o pedido', sk: 'SQL · cancelar(1049), t = 1 ms', sql: ['BEGIN;', 'SELECT * FROM pedidos', '  WHERE id = 1049 FOR UPDATE;', '-- depois: SELECT * FROM estoque', "--   WHERE sku = 'GATO-042' FOR UPDATE;"],
        story: 'No mesmo instante a Bia, arrependida, clica "cancelar". A cancelar(1049) faz o estorno na ordem inversa: trava primeiro o pedido, depois o estoque. Em t = 1 ms ela segura a linha do pedido 1049.',
        look: 'A trava pedido:1049 acende com "dona: cancelar". Cada operação segura uma.',
        key: 'Duas operações, as mesmas duas travas, em ordem contrária.' },
      { id: 'ciclo', k: K(1.6, 3.6, 2.4), clk: [0, 4], title: 't = 3: o ciclo fecha', sk: 'QUEM ESPERA QUEM',
        sql: ['reservar: segura estoque, quer pedido', 'cancelar: segura pedido,  quer estoque', '-- exclusão mútua · segura-e-espera', '-- sem preempção · espera circular'],
        story: 'Em t = 2 ms a reservar pede o pedido e espera. Em t = 3 ms a cancelar pede o estoque e espera. Cada uma espera a outra soltar, e nenhuma solta. Estão presentes as 4 condições de Coffman (1971): exclusão mútua, segura-e-espera, sem preempção e espera circular.',
        look: 'As rotas se cruzam em X e tudo fica vermelho: o ciclo está aceso.',
        key: 'Deadlock: um ciclo de espera em que ninguém anda.' },
      { id: 'mem', v: 'mem', k: [[0.3, 3], [3.6, 2000], [4.6, 2600]], clk: [0, 2600], title: 'E se der errado: ninguém desfaz', sk: 'NO CÓDIGO · travas em memória (Go)',
        sql: ['muEstoque.Lock(); muPedido.Lock()   // reservar', 'muPedido.Lock(); muEstoque.Lock()   // cancelar', '-- sync.Mutex não detecta ciclo', '-- nem tem tempo limite'],
        story: 'Se essas travas fossem sync.Mutex em memória, ninguém perceberia. Depois do timeout de 2 s do cliente (módulo 10) a Bia vê um erro, mas as duas goroutines continuam presas segurando as travas. Toda reserva futura do gato também fica pendurada na trava do estoque.',
        look: 'O relógio corre até 2,6 s com tudo vermelho; a ficha da cancelar mostra o erro e as travas continuam com dona.',
        key: 'Travas em memória não têm detector de deadlock: o ciclo dura até o processo reiniciar.' },
      { id: 'pg', v: 'pg', k: [[0.3, 3], [3.0, 1002], [4.2, 1004]], clk: [0, 1010], title: 'O PostgreSQL desfaz em 1 s', sk: 'RESPOSTA DO POSTGRESQL', sql: ['ERROR:  deadlock detected', 'SQLSTATE 40P01', '-- deadlock_timeout = 1 s (padrão)', '-- a reservar é abortada; a cancelar segue'],
        story: 'Com as travas no banco (FOR UPDATE), o PostgreSQL procura ciclos em quem espera há mais de deadlock_timeout, 1 s por padrão. A reservar esperava desde t = 2 ms, então em t = 1.002 ms o banco acha o ciclo e aborta a transação dela com ERROR: deadlock detected (SQLSTATE 40P01). A cancelar pega o estoque e termina o estorno; a aplicação pode repetir a reservar.',
        look: 'O banco acende durante a espera; em t = 1.002 a rota da reservar apaga e a da cancelar fica laranja até a trava do estoque.',
        key: 'O banco detecta o ciclo e mata uma transação; a aplicação precisa tratar o 40P01.' },
      { id: 'ordem', v: 'ordem', k: K(-0.6, 7, 4), clk: [0, 8], title: 'Ordem global: sempre estoque antes de pedido', sk: 'A REGRA', sql: ['-- reservar e cancelar, os dois:', "SELECT * FROM estoque WHERE sku = 'GATO-042' FOR UPDATE;", 'SELECT * FROM pedidos WHERE id = 1049 FOR UPDATE;'],
        story: 'O conserto: todo mundo trava na mesma ordem, estoque antes de pedido. A cancelar chega em t = 1 ms na trava do estoque e espera sem segurar nada. A reservar pega as duas, faz COMMIT em t = 4 ms, e a cancelar segue até t = 7 ms. Sem espera circular não há ciclo. Uma trava só, ou TryLock com tempo limite, também quebram o ciclo.',
        look: 'As duas rotas vão para a trava do estoque; a da cancelar espera, depois acende. Nada fica vermelho no fim.',
        key: 'Ordem global das travas tira a espera circular, e sem ela não existe deadlock.' },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  const msAt = (s, t) => { const k = s.k; if (t <= k[0][0]) return k[0][1];
    for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const [t0, m0] = k[i - 1], [t1, m1] = k[i]; return m0 + (m1 - m0) * (t - t0) / (t1 - t0); }
    return k[k.length - 1][1]; };
  const durOf = s => s.k[s.k.length - 1][0] + 1.4;
  let SP = null;
  function spec() { const s = cur(), o = base(); o.ms = POSTER ? s.k[s.k.length - 1][1] : msAt(s, lt); WORLD[sc](o, o.ms, s.v); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  // tamanhos por tipo de peça: [nome, linhas, altura da linha do nome]; nenhuma linha abaixo de 8 unidades
  const SIZES = { cli: [12.5, 9.6, 14], pod: [12.5, 9.6, 14], redis: [11.5, 9.2, 13], db: [12, 9.6, 14], gate: [9.6, 8.2, 0] };
  function drawBlock(Bk, d, on, o) {
    const key = JSON.stringify([d, on, Bk.kind === 'drw' ? [o.q, o.qx] : 0]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    x.textAlign = 'left';
    if (Bk.kind === 'drw') {   // a gaveta: a linha GATO-042 e a quantidade grande
      const q = o.q, tn = q < 0 ? 'bad' : q > 0 ? 'acc' : '';
      x.fillStyle = INK(); fitFont(x, u, "estoque · 'GATO-042' · SP-1", 8.2, 112); x.fillText("estoque · 'GATO-042' · SP-1", u(5), u(9));
      x.fillStyle = toneC(tn); fitFont(x, u, 'quantidade = ' + qs(q), 14.5, 112); x.fillText('quantidade = ' + qs(q), u(5), u(25));
      if (o.qx) { x.fillStyle = /travada/.test(o.qx) ? accC() : INK(); fitFont(x, u, o.qx, 8.4, 112); x.fillText(o.qx, u(5), u(41)); }
      if (q < 0) { x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.setLineDash([u(3), u(2)]); x.strokeRect(u(121), u(4), u(40), u(38)); x.setLineDash([]);
        x.fillStyle = BAD(); fitFont(x, u, 'falta 1', 8.2, 38); x.textAlign = 'center'; x.fillText('falta 1', u(141), u(23)); }
      cv.tex.needsUpdate = true; return;
    }
    if (Bk.kind === 'cat') { x.textAlign = 'center'; x.fillStyle = accC(); fitFont(x, u, 'GATO', 9.6, 32); x.fillText('GATO', u(W_ / 2), u(H_ / 2 - 5));
      x.fillStyle = INK(); fitFont(x, u, '79.90', 8, 32); x.fillText('79.90', u(W_ / 2), u(H_ / 2 + 7)); cv.tex.needsUpdate = true; return; }
    const [s1, s2, lh] = SIZES[Bk.kind];
    x.fillStyle = on === 'bad' ? BAD() : on === 1 || on === 2 ? accC() : C.inkHi;
    if (Bk.kind === 'gate') {   // a cancela: estreita, nome em cima e duas linhas curtas
      x.textAlign = 'center'; fitFont(x, u, d.name, s1, W_ - 6); x.fillText(d.name, u(W_ / 2), u(10));
      x.strokeStyle = on === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on ? 2.4 : 1); x.beginPath(); x.moveTo(u(4), u(18)); x.lineTo(u(W_ - 4), u(18)); x.stroke();
      d.rows.forEach(([text, tn], i) => { if (!text) return; x.fillStyle = toneC(tn); const parts = text.split(': ');
        const ls = parts.length > 1 ? [parts[0] + ':', parts[1]] : [text]; ls.forEach((l, j) => { fitFont(x, u, l, s2, W_ - 6); x.fillText(l, u(W_ / 2), u(28 + i * 20 + j * 9.5)); }); });
      cv.tex.needsUpdate = true; return;
    }
    let y = lh * 0.62; fitFont(x, u, d.name, s1, W_ - 76); x.fillText(d.name, u(5), u(y));
    if (d.lang) { x.fillStyle = INK(); x.textAlign = 'right'; fitFont(x, u, d.lang, 8.6, 74); x.fillText(d.lang, u(W_ - 5), u(y)); x.textAlign = 'left'; }
    y += lh * 0.5;
    for (const [text, tn] of d.rows) { const l2 = s2 * 1.45; y += l2 / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s2, W_ - 10); x.fillText(text, u(5), u(y)); y += l2 / 2; }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  // o relógio: t grande à esquerda, régua com os eventos do cenário e o cursor no instante atual
  function drawClock(o) {
    const s = cur(), [lo, hi] = s.clk, msR = Math.round(o.ms * 10) / 10;
    if (!once('clk', JSON.stringify([msR, o.ev, s.clk, sc]) + theme + accent.getHex())) return;
    const cv = CLK, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.clearRect(0, 0, cv.c.width, cv.c.height); x.fillStyle = theme === 'light' ? '#f1f1f0' : '#1b1c1f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(0.5), u(0.5), cv.c.width - u(1), cv.c.height - u(1));
    const base = sc === 'deadlock' ? 10500 : 10000, abs = base + Math.max(0, Math.floor(o.ms)), sec = Math.floor(abs / 1000), mil = abs % 1000;
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText('RELÓGIO', u(8), u(9));
    x.fillStyle = acc; fitFont(x, u, `t = ${num(Math.max(0, Math.floor(o.ms)))} ms`, 15, 168); x.fillText(`t = ${num(Math.max(0, Math.floor(o.ms)))} ms`, u(8), u(25));
    x.fillStyle = C.inkHi; x.font = `700 ${u(9)}px ${MONO3}`; x.fillText(`14:02:${String(sec).padStart(2, '0')}.${String(mil).padStart(3, '0')}`, u(8), u(42));
    const X0 = 196, X1 = Wd - 24, RY = 27, px = m => X0 + (X1 - X0) * clamp((m - lo) / (hi - lo));
    x.strokeStyle = C.line; x.lineWidth = u(1.4); x.beginPath(); x.moveTo(u(X0), u(RY)); x.lineTo(u(X1), u(RY)); x.stroke();
    // marcas de escala
    const span = hi - lo, stepTk = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].find(v => span / v <= 8) || 2000;
    x.fillStyle = INK(); x.font = `700 ${u(7.4)}px ${MONO3}`; x.textAlign = 'center';
    for (let m = Math.ceil(lo / stepTk) * stepTk; m <= hi + 1e-9; m += stepTk) { const X = px(m); x.strokeStyle = C.line; x.lineWidth = u(0.8);
      x.beginPath(); x.moveTo(u(X), u(RY - 3)); x.lineTo(u(X), u(RY + 3)); x.stroke(); x.fillText(num(m), u(X), u(RY + 9)); }
    x.fillText('ms', u(X1 + 12), u(RY + 9));
    // eventos: acesos os que já passaram
    // dois andares de rótulos; um rótulo que não cabe em nenhum fica só com o ponto
    const end = [-1e9, -1e9];
    o.ev.forEach(([m, lab, tn]) => { if (m < lo || m > hi) return; const X = px(m), done = o.ms >= m - 1e-6;
      x.fillStyle = done ? (tn === 'bad' ? BAD() : acc) : C.line; x.beginPath(); x.arc(u(X), u(RY), u(done ? 2.6 : 1.8), 0, Math.PI * 2); x.fill();
      x.font = `700 ${u(7.6)}px ${MONO3}`; const tw = x.measureText(lab).width / P, tx = clamp(X, X0 + tw / 2, X1 + 10 - tw / 2);
      const row = tx - tw / 2 > end[0] + 4 ? 0 : tx - tw / 2 > end[1] + 4 ? 1 : -1; if (row < 0) return; end[row] = tx + tw / 2;
      x.fillStyle = done ? (tn === 'bad' ? BAD() : C.inkHi) : INK(); x.fillText(lab, u(tx), u(row ? RY - 17 : RY - 8)); });
    // cursor
    const CX = px(o.ms); x.strokeStyle = acc; x.lineWidth = u(2.2); x.beginPath(); x.moveTo(u(CX), u(RY - 5)); x.lineTo(u(CX), u(RY + 5)); x.stroke();
    x.textAlign = 'left'; cv.tex.needsUpdate = true;
  }
  function drawScreen(o) {
    const s = cur(), yl = s.sql;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 200) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 12 + i * 44; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 19, 196); x.fillText(val, u(10), u(Y + 18)); });
    const L0 = 226; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 10), u(6)); x.lineTo(u(L0 - 10), u(137)); x.stroke();
    lbl(s.sk, L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(25 + i * 12.6)); });
    lbl('RESULTADO', L0, 104);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /−1|409|nil|erro|timeout|presa|ERROR|recus|dois donos|2 vezes|venceu|abort/i.test(l) && !/0 linhas|UPDATE 0|continua 0/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">2 ms por SELECT/UPDATE e 1 ms por comando no Redis são os números de exemplo do módulo, na ordem de grandeza real.</li>';
  const DATA = {
    race: () => `<table class="h3-sum"><tr><th>t (ms)</th><th>Bia</th><th>Caio</th><th>qtd.</th></tr><tr><td>0</td><td>SELECT → 1</td><td>—</td><td>1</td></tr><tr><td>2</td><td>UPDATE…</td><td>SELECT → 1</td><td>1</td></tr><tr><td>4</td><td>UPDATE ok</td><td>UPDATE…</td><td>0</td></tr><tr class="on"><td>6</td><td>pedido 1049</td><td>UPDATE ok</td><td>−1</td></tr></table>
      <li>Pedido <b>1049</b>: gato 79.90 + frete SP 9.00 = <b>88.90</b>.</li><li>Janela da corrida: <b>2 ms</b> (de checar a baixar). Das 6 ordens, <b>4 dão −1</b>.</li><li>Lab <b>race_condition/main.go</b>: 100 goroutines fazem <b>grelhados++</b>; o artigo mostra 97, 96, 100, 99, 97, 100, 99. <b>go run -race</b> acusa a corrida.</li>${EX}`,
    mutex: () => `<li><b>sync.Mutex</b> em volta do reservar; <b>defer mu.Unlock()</b> solta em todo caminho de saída.</li><li>Caio chega em t = 2, espera 2 ms, lê 0 em t = 6: <b>409</b> 4 ms depois de clicar. Não consome número de pedido.</li><li>Seção crítica de <b>4 ms</b> → no máximo <b>250 reservas/s</b> do mesmo SKU por réplica.</li><li>Lab <b>mutex/main.go</b>: dorme 100 ms com a trava; 100 itens = <b>10 s</b> em série (com o Sleep fora da trava, ~100 ms).</li><li>O sync.Mutex do Go entra em <b>starvation mode</b> se alguém espera mais de 1 ms: passa a entregar em ordem.</li>${EX}`,
    condicional: () => `<table class="h3-sum"><tr><th></th><th>otimista</th><th>pessimista</th></tr><tr><td>como</td><td>UPDATE … AND quantidade &gt; 0</td><td>SELECT … FOR UPDATE</td></tr><tr><td>Caio</td><td>UPDATE 0 → 409</td><td>espera o COMMIT → 409</td></tr><tr class="on"><td>rende quando</td><td>conflito é raro</td><td>conflito é a regra</td></tr></table>
      <li>Se os dois UPDATE chegam juntos, o PostgreSQL faz o segundo esperar a trava da linha e reavalia o <b>WHERE</b> depois do COMMIT do primeiro: 0 linhas.</li><li>Funciona com <b>N réplicas</b>: sem mutex, sem Redis.</li><li>Diferente do guarda de versão da aula 6 (<b>event_version &lt; 2</b>): o otimista confere "ninguém mexeu desde que li"; o guarda decide qual versão ganha.</li>${EX}`,
    replicas: () => `<li><b>estoque-1</b> e <b>estoque-2</b>: 2 processos, 2 pods, 2 memórias, 1 vCPU cada.</li><li>O LB manda a Bia para o estoque-1 e o Caio para o estoque-2; cada um pega o <b>seu</b> mutex.</li><li>Resultado: quantidade = <b>−1</b>, igual à corrida sem trava.</li><li>Saídas: escrita condicional no banco (cenário Condicional) ou trava compartilhada (Redis, ZooKeeper).</li>${EX}`,
    redis: () => `<li>Travar: <b>SET ${KEY} a1 NX PX 5000</b> → OK (só um consegue criar; some em 5 s).</li><li>Soltar conferindo o dono (script do doc do Redis): <b>if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end</b></li><li>Ciclo: 1 ms de SET + 4 de trabalho + 1 de DEL = <b>6 ms</b> → no máximo <b>166 reservas/s</b> por SKU.</li><li>O lab do artigo faz <b>GET</b> e depois <b>SetNX</b>, com o valor "locked" igual para todos: sem token, o DEL apaga a trava de outro.</li><li><b>ZooKeeper</b>: nó efêmero e sequencial (/locks/estoque-GATO-042/lock-0000000007); o menor tem a trava, cada um observa só o anterior: fila justa.</li>${EX}`,
    ttl: () => `<table class="h3-sum"><tr><th>t (ms)</th><th>o quê</th></tr><tr><td>1</td><td>Bia: SET a1 NX PX 5000 → OK</td></tr><tr><td>3 … 6.000</td><td>estoque-1 parado (GC / rede)</td></tr><tr><td>5.001</td><td>TTL vence, a chave some</td></tr><tr><td>5.003</td><td>Caio: OK (b2), lê 1, baixa para 0</td></tr><tr class="on"><td>6.002</td><td>Bia: UPDATE → −1 (sem fencing)</td></tr></table>
      <li><b>Fencing token</b> (Kleppmann): 33 para a Bia, 34 para o Caio; o banco recusa número menor que o maior já visto.</li><li>O SET NX do Redis não dá esse número; o ZooKeeper dá (zxid / sequência).</li><li>Lock <b>de eficiência</b> (evita trabalho repetido) aceita Redis simples; lock <b>de correção</b> (vender o gato 2 vezes) precisa de fencing ou de checagem no banco.</li><li><b>Redlock</b> (5 Redis, maioria): Kleppmann diz que depende de suposições de tempo; Sanfilippo responde que são razoáveis.</li>`,
    deadlock: () => `<li>reservar(1049): estoque → pedido · cancelar(1049): pedido → estoque.</li><li>t = 0 R trava estoque · t = 1 C trava pedido · t = 2 R espera · t = 3 C espera: <b>ciclo</b>.</li><li>Coffman (1971): exclusão mútua, segura-e-espera, sem preempção, espera circular.</li><li>PostgreSQL: <b>deadlock_timeout = 1 s</b>; aborta uma com <b>ERROR: deadlock detected</b> (SQLSTATE <b>40P01</b>).</li><li>Consertos: <b>ordem global</b> (estoque antes de pedido), TryLock com tempo limite, ou uma trava só.</li><li class="h3-dim">Nesta figura, R e C começam às 14:02:10.500.</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0)}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l)}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="e3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.sk)}</b>${esc(s.sql.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'estoque') return; const o = SP || spec(), c = o.cnt[1];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · t = ${num(Math.max(0, Math.floor(o.ms)))} ms${c ? ' · ' + c[0] + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'estoque' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-estoque3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'estoque') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  const inRect = (b, p, m = 3) => p[0] > b.x - m && p[0] < b.x + b.w + m && p[1] > b.cy - m && p[1] < b.cy + b.d + m;
  function scene3(dt) {
    const o = SP = spec();
    o.show.cat = o.q >= 1 ? 1 : 0;
    // a peça acende quando a luz passa por ela
    NAMES.forEach(nm => { if (!o.on[nm] && o.show[nm] && o.dots.some(p => inRect(B[nm], p))) o.on[nm] = 1; });
    if (o.q < 0) o.on.drw = 'bad';
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0, ty = posY(nm);
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      Bk.cy += (ty - Bk.cy) * (1 - Math.exp(-dt / 0.18)); if (Math.abs(ty - Bk.cy) < 0.05) Bk.cy = ty;
      const e = ease(clamp(Bk.f)), z0 = PL + (Bk.base || 0); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.cy, z0 - (1 - e) * (Bk.h + 3 + (Bk.base || 0))));
      const on = o.on[nm] || 0; if (Bk.g.visible) drawBlock(Bk, o.rows[nm], on, o);
      Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.cy + Bk.d / 2, z0 + Bk.h + 3], (on === 1 || nm === 'cat') && Bk.f > 0.9 ? 0.9 : 0); });
    setBeams(o.beams); drawScreen(o); drawClock(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 40 + i * 4); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > durOf(cur()) + 2.5) lt = 0;
    scene3(dt);
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('e3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 815, 8, 425];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.8 : nar ? 0.99 : 0.97 - side, aH = POSTER ? 0.7 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.46 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.41 : nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), P = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(P, k);
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, durOf(cur()) + 3)) next(); }
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr, CLK];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); o.show.cat = o.q >= 1 ? 1 : 0; NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; B[nm].cy = posY(nm); }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
