// Figura 3D (iso-glow): a última linha do estoque. Resta 1 gato de pelúcia (GATO-042, quantidade = 1) e a Bia (SP) e o Caio (Rio)
// clicam "comprar" com 2 ms de diferença. Cena: à esquerda as duas fichas (Bia e Caio); no meio o serviço estoque (1 ou 2 réplicas)
// com a trava de cada um como uma cancela; à direita o PostgreSQL com a gaveta da linha GATO-042 e a peça do gato; ao fundo o
// Redis (modos com lock distribuído) e o mostrador (t, quantidade, resultado, SQL); na frente, o relógio em ms com os eventos.
// Cenários (toggle e ?mode=race|mutex|condicional|replicas|redis|ttl|deadlock; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/concorrencia-brief.md, aulas 6–8).
FIGS3D.push({ id: 'estoque', name: 'The last cat', mod: (() => {
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
  const num = v => Math.round(v).toLocaleString('en-US');
  const qs = q => q < 0 ? '−' + Math.abs(q) : String(q);

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['race', 'mutex', 'condicional', 'replicas', 'redis', 'ttl', 'deadlock'];
  const SCNAME = { race: 'Race', mutex: 'Mutex', condicional: 'Conditional', replicas: 'Replicas', redis: 'Redis', ttl: 'TTL', deadlock: 'Deadlock' };
  const SCFULL = { race: 'Race: read and decrement without a lock', mutex: 'Mutex on one replica', condicional: 'Conditional write in the database',
    replicas: 'Two replicas, two mutexes', redis: 'Distributed lock in Redis', ttl: 'Expired TTL and fencing token', deadlock: 'Deadlock: reserve × cancel' };
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
    o.rows.bia = { name: 'BIA · SP', lang: '14:02:10.000', rows: [['hasn\'t clicked yet', 'dim']] };
    o.rows.caio = { name: 'CAIO · RIO', lang: '14:02:10.002', rows: [['hasn\'t clicked yet', 'dim']] };
    o.rows.p1 = { name: 'estoque-1', lang: 'Go · 1 vCPU', rows: [['reservar(GATO-042)', 'dim']] };
    o.rows.p2 = { name: 'estoque-2', lang: 'Go · 1 vCPU', rows: [['reservar(GATO-042)', 'dim']] };
    o.rows.g1 = { name: 'MUTEX', rows: [['free', 'dim']] }; o.rows.g2 = { name: 'MUTEX', rows: [['free', 'dim']] };
    o.rows.rd = { name: 'REDIS', lang: '1 ms round trip', rows: [[KEY, 'dim'], ['(key does not exist)', 'dim']] };
    o.rows.db = { name: 'POSTGRESQL', lang: 'store DB', rows: [['estoque table', 'dim'], ['2 ms per SELECT/UPDATE', 'dim']] };
    o.rows.lkA = { name: 'LOCK', lang: 'estoque:GATO-042', rows: [['owner: nobody', 'dim']] };
    o.rows.lkB = { name: 'LOCK', lang: 'pedido:1049', rows: [['owner: nobody', 'dim']] };
    if (dl) { o.rows.bia = { name: 'RESERVE', lang: 'order 1049', rows: [['waiting for payment', 'dim']] };
      o.rows.caio = { name: 'CANCEL', lang: 'order 1049', rows: [['Bia hasn\'t clicked yet', 'dim']] }; o.q = 0; }
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
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'reads 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), 'SELECT'); leg(o, ms, 3, 4, rev(toDb('caio')), 'reads 1', 'acc');
      leg(o, ms, 4, 5, toDb('caio'), 'UPDATE'); leg(o, ms, 5, 6, rev(toDb('caio')), 'UPDATE 1 → −1', 'bad');
      st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 2 ? ['SELECT…'] : ms < 4 ? ['read 1 · UPDATE…', 'acc'] : ms < 6 ? ['UPDATE ok'] : ['order 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 4 ? ['SELECT…'] : ms < 6 ? ['read 1 · UPDATE…', 'bad'] : ['reservation ok too', 'bad']);
      st(o, 'p1', ['Bia: ' + (ms < 2 ? 'checking' : ms < 4 ? 'q = 1 → decrement' : 'done'), ms < 4 && ms >= 0 ? 'acc' : 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 4 ? 'checking' : ms < 6 ? 'q = 1 → decrement' : 'done'), ms >= 4 && ms < 6 ? 'bad' : 'dim']);
      const n = (ms >= 4) + (ms >= 6);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''], ['confirmed reservations', String(n), n > 1 ? 'bad' : '']);
      if (ms >= 3 && ms < 6) T(o, 'p1', 'both read 1', 'bad'); if (ms >= 6) T(o, 'drw', '2 reservations, 1 cat', 'bad');
      o.res = ms >= 6 ? ['Bia: order 1049 · Caio: reservation ok', 'quantidade = −1: the cat was sold twice'] : ms >= 4 ? ['Bia: UPDATE 1 (quantidade = 0)'] : ms >= 2 ? ['Bia read 1 · Caio read 1'] : ms >= 1 ? ['Bia read 1'] : [];
    },
    // sync.Mutex numa réplica: o Caio espera a cancela abrir
    mutex(o, ms, v) {
      const defer = v === 'defer';
      o.q = ms >= 4 ? 0 : 1;
      o.ev = [[0, 'Bia Lock'], [2, 'Caio waits'], [4, 'Bia Unlock'], [6, 'Caio 409', 'acc']];
      if (defer) o.ev = [[0, 'Bia Lock'], [4, 'Bia Unlock'], [6, 'Caio 409 no Unlock', 'bad'], [10, 'Caio again'], [2010, 'timeout 2 s', 'bad']];
      const hold = ms < 0 ? '' : ms < 4 ? 'Bia' : ms < 6 || defer ? 'Caio' : '';
      const wait = ms >= 2 && ms < 4 ? 'Caio' : defer && ms >= 10 && ms < 2010 ? 'Caio (2nd click)' : '';
      wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 6.5 || (defer && ms >= 10 && ms < 2011));
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'reads 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      if (ms >= 2 && ms < 4) leg(o, ms, 2, 2.6, toGate('caio'), 'mu.Lock() · waits', 'bad', 2);
      leg(o, ms, 4, 5, toDb('caio'), 'SELECT'); leg(o, ms, 5, 6, rev(toDb('caio')), 'reads 0', 'acc');
      if (defer && ms >= 10) leg(o, ms, 10, 10.6, toGate('caio'), 'mu.Lock() · stuck', 'bad', 1e6);
      st(o, 'g1', [hold ? 'owner: ' + hold : 'free', hold ? (defer && ms >= 6 ? 'bad' : 'acc') : 'dim'], [wait ? 'queue: ' + wait : defer && ms >= 6 ? 'nobody releases' : '', wait || (defer && ms >= 6) ? 'bad' : 'dim']);
      if (hold) o.on.g1 = defer && ms >= 6 ? 'bad' : 2;
      st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 2 ? ['Lock · SELECT…'] : ms < 4 ? ['read 1 · UPDATE…', 'acc'] : ['order 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 4 ? ['waiting for the lock', 'bad'] : ms < 6 ? ['Lock · SELECT…'] : !defer || ms < 10 ? ['409 out of stock', 'acc']
        : ms < 2010 ? ['2nd click: waiting…', 'bad'] : ['error: 2 s timeout', 'bad']);
      st(o, 'p1', ['critical section: ' + (hold || 'empty'), hold ? 'acc' : 'dim'], [defer ? 'Unlock without defer' : 'defer mu.Unlock()', defer ? 'bad' : 'dim']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q)], defer && ms >= 10 ? ['Caio waiting for', num(Math.min(2000, ms - 10)) + ' ms', 'bad'] : ['lock', hold ? 'owner: ' + hold : 'free', defer && ms >= 6 ? 'bad' : '']);
      if (ms >= 2.4 && ms < 4) T(o, 'g1', 'Caio waits for Bia to release', 'bad'); if (!defer && ms >= 6) T(o, 'caio', '409 at t = 6 ms', 'acc');
      if (defer && ms >= 6) T(o, 'g1', 'lock stuck: the return\nskipped the Unlock', 'bad');
      o.res = defer && ms >= 2010 ? ['2nd click: 2 s timeout', 'the lock is still stuck'] : defer && ms >= 6 ? ['Caio: 409 · Unlock never ran', 'the lock got stuck'] : ms >= 6 ? ['Bia: order 1049 · Caio: 409 out of stock', 'quantidade = 0'] : ms >= 4 ? ['Bia: UPDATE 1 · Unlock'] : ms >= 2 ? ['Caio stopped at mu.Lock()'] : [];
    },
    // o banco decide: UPDATE … AND quantidade > 0 (otimista), SELECT … FOR UPDATE (pessimista), ou sem a condição
    condicional(o, ms, v) {
      const pess = v === 'pess', sem = v === 'sem';
      if (pess) {
        o.q = ms >= 4 ? 0 : 1;
        o.ev = [[0, 'Bia FOR UPDATE'], [1, 'row locked'], [3, 'Caio waits'], [4, 'COMMIT'], [5, 'Caio reads 0', 'acc']];
        const lockBy = ms >= 1 && ms < 4 ? 'Bia' : ms >= 4 && ms < 5 ? 'Caio' : '';
        o.qx = lockBy ? 'row locked: ' + lockBy : ms >= 5 ? 'row free' : '';
        wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 5.5);
        leg(o, ms, 0, 1, toDb('bia'), 'SELECT … FOR UPDATE'); leg(o, ms, 1, 2, rev(toDb('bia')), 'reads 1 · locks the row', 'acc');
        leg(o, ms, 2, 3, toDb('bia'), 'UPDATE · COMMIT'); leg(o, ms, 3, 4, rev(toDb('bia')), 'COMMIT ok', 'acc');
        leg(o, ms, 2, 3, toDb('caio'), 'SELECT … FOR UPDATE', ms < 4 ? 'bad' : 'hi', 1); if (ms >= 3 && ms < 4) o.on.db = 'bad';
        leg(o, ms, 4, 5, rev(toDb('caio')), 'reads 0 → ROLLBACK', 'acc');
        st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 2 ? ['SELECT … FOR UPDATE'] : ms < 4 ? ['UPDATE · COMMIT…', 'acc'] : ['order 1049 · 88.90', 'acc']);
        st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 4 ? ['waits for the COMMIT', 'bad'] : ms < 5 ? ['reading…'] : ['409 out of stock', 'acc']);
        st(o, 'db', ['estoque table', 'dim'], [lockBy ? 'row locked: ' + lockBy : 'no row locked', lockBy ? 'acc' : 'dim']);
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q)], ['row locked by', lockBy || '—', lockBy ? 'acc' : 'dim']);
        if (ms >= 3 && ms < 4) T(o, 'db', 'Caio stopped: row locked', 'bad');
        o.res = ms >= 5 ? ['Bia: COMMIT · order 1049', 'Caio: read 0 → ROLLBACK → 409'] : ms >= 3 ? ['Caio stopped on the locked row'] : ms >= 2 ? ['Bia read 1 and locked the row'] : [];
        return;
      }
      o.q = ms >= 4 && sem ? -1 : ms >= 2 ? 0 : 1;
      o.ev = sem ? [[0, 'Bia UPDATE'], [2, 'Bia: 1 row'], [4, 'Caio: 1 row', 'bad']] : [[0, 'Bia UPDATE'], [2, 'Bia: 1 row'], [4, 'Caio: 0 rows', 'acc']];
      wire(o, toPod('bia'), ms >= 0 && ms < 2.5); if (ms >= 2) wire(o, toPod('caio'), ms < 4.5);
      leg(o, ms, 0, 1, toDb('bia'), sem ? 'UPDATE (no condition)' : 'UPDATE … AND q > 0'); leg(o, ms, 1, 2, rev(toDb('bia')), 'UPDATE 1 · q = 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), sem ? 'UPDATE (no condition)' : 'UPDATE … AND q > 0');
      leg(o, ms, 3, 4, rev(toDb('caio')), sem ? 'UPDATE 1 · q = −1' : 'UPDATE 0 → 409', sem ? 'bad' : 'acc');
      st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 2 ? ['UPDATE…'] : ['1 row · order 1049', 'acc']);
      st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 4 ? ['UPDATE…'] : sem ? ['1 row · reservation ok', 'bad'] : ['0 rows · 409', 'acc']);
      st(o, 'p1', ['no mutex, no Redis', 'dim'], [sem ? 'just the UPDATE, no condition' : 'who decides: the database', sem ? 'bad' : 'acc']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''],
        ['rows affected', (ms >= 2 ? 'Bia 1' : 'Bia …') + ' · ' + (ms >= 4 ? 'Caio ' + (sem ? 1 : 0) : 'Caio …'), sem && ms >= 4 ? 'bad' : '']);
      if (ms >= 4) T(o, 'drw', sem ? 'both affected 1 row' : 'Bia 1 row · Caio 0 rows', sem ? 'bad' : 'acc');
      o.res = ms >= 4 ? (sem ? ['Bia: UPDATE 1 · Caio: UPDATE 1', 'quantidade = −1 again'] : ['Bia: UPDATE 1 → order 1049', 'Caio: UPDATE 0 → 409 out of stock']) : ms >= 2 ? ['Bia: UPDATE 1 (quantidade = 0)'] : [];
    },
    // duas réplicas: cada uma com o seu sync.Mutex; as duas cancelas abrem
    replicas(o, ms) {
      o.q = ms >= 6 ? -1 : ms >= 4 ? 0 : 1;
      o.ev = [[0, 'Bia Lock (1)'], [2, 'Caio Lock (2)'], [4, 'Bia → 0'], [6, 'Caio → −1', 'bad']];
      const h1 = ms >= 0 && ms < 4, h2 = ms >= 2 && ms < 6;
      wire(o, toPod('bia'), ms >= 0 && ms < 4.5); if (ms >= 2) wire(o, toPod('caio'), ms < 6.5);
      leg(o, ms, 0, 1, toDb('bia'), 'SELECT'); leg(o, ms, 1, 2, rev(toDb('bia')), 'reads 1', 'acc');
      leg(o, ms, 2, 3, toDb('bia'), 'UPDATE'); leg(o, ms, 3, 4, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 2, 3, toDb('caio'), 'SELECT'); leg(o, ms, 3, 4, rev(toDb('caio')), 'reads 1', 'bad');
      leg(o, ms, 4, 5, toDb('caio'), 'UPDATE'); leg(o, ms, 5, 6, rev(toDb('caio')), 'UPDATE 1 → −1', 'bad');
      st(o, 'g1', [h1 ? 'owner: Bia' : 'free', h1 ? 'acc' : 'dim'], ['only in estoque-1', 'dim']); if (h1) o.on.g1 = 2;
      st(o, 'g2', [h2 ? 'owner: Caio' : 'free', h2 ? 'acc' : 'dim'], ['only in estoque-2', 'dim']); if (h2) o.on.g2 = 2;
      st(o, 'p1', ['memory of process 1', 'dim'], ['Bia: ' + (ms < 0 ? '—' : ms < 2 ? 'checking' : ms < 4 ? 'q = 1 → decrement' : 'done'), 'dim']);
      st(o, 'p2', ['memory of process 2', 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 4 ? 'checking' : ms < 6 ? 'q = 1 → decrement' : 'done'), ms >= 4 && ms < 6 ? 'bad' : 'dim']);
      st(o, 'bia', ms < 0 ? ['LB → estoque-1', 'dim'] : ms < 2 ? ['Lock ok · SELECT…'] : ms < 4 ? ['read 1 · UPDATE…', 'acc'] : ['order 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['LB → estoque-2', 'dim'] : ms < 4 ? ['Lock ok · SELECT…', 'bad'] : ms < 6 ? ['read 1 · UPDATE…', 'bad'] : ['reservation ok too', 'bad']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : ''], ['locks with an owner', String(h1 + h2), h1 && h2 ? 'bad' : '']);
      if (ms >= 2.2) T(o, 'g2', 'estoque-2\'s mutex:\ndoes not see estoque-1\'s', 'bad'); if (ms >= 6) T(o, 'drw', 'quantidade −1 again', 'bad');
      o.res = ms >= 6 ? ['two mutexes, two owners at once', 'quantidade = −1 again'] : ms >= 2 ? ['both gates opened'] : [];
    },
    // a cancela vira uma chave no Redis com token e TTL; o Caio tenta de novo a cada 50 ms
    redis(o, ms) {
      o.q = ms >= 5 ? 0 : 1;
      o.ev = [[1, 'Bia SET OK'], [3, 'Caio nil'], [6, 'Bia DEL'], [53, 'Caio tries'], [54, 'Caio SET OK'], [56, 'Caio 409', 'acc']];
      const own = ms >= 1 && ms < 6 ? ['a1', ms - 1] : ms >= 54 && ms < 57 ? ['b2', ms - 54] : null;
      st(o, 'rd', [KEY, own ? 'acc' : 'dim'], [own ? `= ${own[0]} · TTL ${num(5000 - own[1])} ms` : '(key does not exist)', own ? 'acc' : 'dim']); if (own) o.on.rd = 2;
      wire(o, toPod('bia'), ms >= 0 && ms < 6.5); if (ms >= 2) wire(o, toPod('caio'), ms < 57.5);
      leg(o, ms, 0, 0.5, toRedis('bia'), 'SET … a1 NX PX 5000'); leg(o, ms, 0.5, 1, rev(toRedis('bia')), 'OK', 'acc');
      leg(o, ms, 1, 2, toDb('bia'), 'SELECT'); leg(o, ms, 2, 3, rev(toDb('bia')), 'reads 1', 'acc');
      leg(o, ms, 3, 4, toDb('bia'), 'UPDATE'); leg(o, ms, 4, 5, rev(toDb('bia')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 5, 5.5, toRedis('bia'), 'EVAL (DEL if it is a1)'); leg(o, ms, 5.5, 6, rev(toRedis('bia')), '1 · deleted', 'acc');
      leg(o, ms, 2, 2.5, toRedis('caio'), 'SET … b2 NX PX 5000'); leg(o, ms, 2.5, 3, rev(toRedis('caio')), 'nil', 'bad', 2);
      leg(o, ms, 53, 53.5, toRedis('caio'), 'SET … b2 NX PX 5000'); leg(o, ms, 53.5, 54, rev(toRedis('caio')), 'OK', 'acc');
      leg(o, ms, 54, 55, toDb('caio'), 'SELECT'); leg(o, ms, 55, 56, rev(toDb('caio')), 'reads 0 → 409', 'acc');
      leg(o, ms, 56, 56.5, toRedis('caio'), 'EVAL (DEL if it is b2)'); leg(o, ms, 56.5, 57, rev(toRedis('caio')), '1 · deleted', 'acc');
      st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 1 ? ['SET NX…'] : ms < 5 ? ['lock a1 · working', 'acc'] : ['order 1049 · 88.90', 'acc']);
      st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 3 ? ['SET NX…'] : ms < 53 ? ['nil · sleeps 50 ms', 'bad'] : ms < 54 ? ['trying again…'] : ms < 56 ? ['lock b2 · SELECT…', 'acc'] : ['409 out of stock', 'acc']);
      st(o, 'p1', ['no local mutex', 'dim'], ['Bia: ' + (ms < 1 ? 'asking for the lock' : ms < 6 ? 'holding lock a1' : 'released'), ms >= 1 && ms < 6 ? 'acc' : 'dim']);
      st(o, 'p2', ['no local mutex', 'dim'], ['Caio: ' + (ms < 2 ? '—' : ms < 54 ? 'without the lock' : ms < 57 ? 'holding lock b2' : 'released'), ms >= 3 && ms < 54 ? 'bad' : ms >= 54 && ms < 57 ? 'acc' : 'dim']);
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['lock', own ? `${own[0]} · TTL ${num(5000 - own[1])} ms` : 'free', own ? 'acc' : 'dim'], ['quantidade', qs(o.q)]);
      if (ms >= 3 && ms < 53) T(o, 'p2', 'nil: sleeps 50 ms', 'bad'); if (ms >= 1 && ms < 6) T(o, 'rd', 'owner: Bia (a1)', 'acc'); if (ms >= 54 && ms < 57) T(o, 'rd', 'owner: Caio (b2)', 'acc');
      o.res = ms >= 56 ? ['Caio: lock b2 · read 0 → 409', 'Bia: order 1049'] : ms >= 6 ? ['Bia released the lock at t = 6 ms', 'Caio sleeps until t = 53 ms'] : ms >= 3 ? ['Bia: OK (lock a1)', 'Caio: nil (already exists)'] : ms >= 1 ? ['Bia: OK'] : [];
    },
    // e se der errado: o estoque-1 para 6 s, o TTL de 5 s vence e a trava tem dois donos
    ttl(o, ms, v) {
      const fence = v === 'fence', TOK = fence ? { a: '33', b: '34' } : { a: 'a1', b: 'b2' };
      const bUpd = ms >= 6002;
      o.q = ms < 5007 ? 1 : bUpd && !fence ? -1 : 0;
      o.ev = [[1, 'Bia locks'], [3, 'pausa'], [5001, 'TTL expires', 'bad'], [5003, 'Caio locks'], [5007, 'Caio → 0'], [6000, 'Bia wakes up'], [6002, fence ? 'Bia refused' : 'Bia → −1', fence ? 'acc' : 'bad']];
      const own = ms >= 1 && ms < 5001 ? ['a', ms - 1] : ms >= 5003 && ms < 5008 ? ['b', ms - 5003] : null;
      st(o, 'rd', [KEY, own ? 'acc' : 'dim'], [own ? `= ${TOK[own[0]]} · TTL ${num(5000 - own[1])} ms` : ms >= 5001 && ms < 5003 ? 'TTL expired: the key is gone' : '(key does not exist)', own ? 'acc' : ms >= 5001 && ms < 5003 ? 'bad' : 'dim']);
      if (own) o.on.rd = 2; if (ms >= 5001 && ms < 5003.5) o.on.rd = 'bad';
      const paused = ms >= 3 && ms < 6000;
      wire(o, toPod('bia'), ms >= 0 && ms < 6003); if (ms >= 2) wire(o, toPod('caio'), ms < 5009);
      leg(o, ms, 0, 0.5, toRedis('bia'), `SET … ${fence ? 'NX (token 33)' : 'a1 NX PX 5000'}`); leg(o, ms, 0.5, 1, rev(toRedis('bia')), 'OK', 'acc');
      leg(o, ms, 1, 2, toDb('bia'), 'SELECT'); leg(o, ms, 2, 3, rev(toDb('bia')), 'reads 1', 'acc');
      if (paused) { o.on.p1 = 'bad'; }
      leg(o, ms, 6000, 6001, toDb('bia'), fence ? 'UPDATE … token 33' : 'UPDATE', 'bad');
      leg(o, ms, 6001, 6002, rev(toDb('bia')), fence ? 'UPDATE 0 · 33 < 34' : 'UPDATE 1 → −1', fence ? 'acc' : 'bad');
      leg(o, ms, 2, 2.5, toRedis('caio'), 'SET … NX'); leg(o, ms, 2.5, 3, rev(toRedis('caio')), 'nil', 'bad', 0.5);
      // as tentativas do Caio: uma a cada 50 ms (3, 53, 103 … 4.953); a de 5.003 ms é a primeira depois do vencimento
      let tries = ms >= 3 ? 1 : 0;
      if (ms >= 3 && ms < 5003) { const k = Math.floor((ms - 3) / 50), at = 3 + 50 * k; tries = k + 1;
        if (ms < 5001) { leg(o, ms, at, at + 25, toRedis('caio'), `SET NX · attempt ${tries}`, 'bad', 0); if (ms - at >= 25) leg(o, ms, at + 25, at + 50, rev(toRedis('caio')), 'nil', 'bad', 0); } }
      if (ms >= 5003) tries = 101;
      leg(o, ms, 5002.4, 5002.7, toRedis('caio'), 'SET NX · attempt 101', 'hi', 0); leg(o, ms, 5002.7, 5003, rev(toRedis('caio')), 'OK · ' + (fence ? 'token 34' : 'b2'), 'acc');
      leg(o, ms, 5003, 5004, toDb('caio'), 'SELECT'); leg(o, ms, 5004, 5005, rev(toDb('caio')), 'reads 1', 'acc');
      leg(o, ms, 5005, 5006, toDb('caio'), fence ? 'UPDATE … token 34' : 'UPDATE'); leg(o, ms, 5006, 5007, rev(toDb('caio')), 'UPDATE 1 → 0', 'acc');
      leg(o, ms, 5007, 5007.5, toRedis('caio'), 'EVAL (DEL if it is b2)'); leg(o, ms, 5007.5, 5008, rev(toRedis('caio')), '1 · deleted', 'acc', 400);
      if (fence) o.qx = ms >= 5007 ? 'last token = 34' : 'last token = 32';
      st(o, 'p1', ['Bia · lock ' + TOK.a, 'dim'], [paused ? 'PAUSED (GC / network)' : ms >= 6000 ? 'woke up: "the lock is mine"' : ms >= 1 ? 'holding the lock' : '—', paused || ms >= 6000 ? 'bad' : 'acc']);
      st(o, 'p2', ['Caio · lock ' + TOK.b, 'dim'], [ms < 2 ? '—' : ms < 5003 ? `nil · attempt ${tries}` : ms < 5008 ? 'holding the lock' : 'purchase done', ms < 5003 && ms >= 3 ? 'bad' : 'acc']);
      st(o, 'bia', ms < 0 ? ['clicks buy', 'dim'] : ms < 3 ? ['lock ok · read 1', 'acc'] : ms < 6000 ? ['waiting…', 'dim'] : ms < 6002 ? ['UPDATE…', 'bad'] : fence ? ['refused by the database', 'acc'] : ['reservation ok: 2nd sale', 'bad']);
      st(o, 'caio', ms < 2 ? ['hasn\'t clicked yet', 'dim'] : ms < 5003 ? ['tries every 50 ms', 'bad'] : ms < 5007 ? ['lock ok · SELECT…', 'acc'] : ['bought the cat', 'acc']);
      if (paused) T(o, 'p1', 'estoque-1 paused 6 s', 'bad'); if (ms >= 5001 && ms < 5003) T(o, 'rd', 'TTL expired: the key is gone', 'bad');
      if (ms >= 6002) T(o, 'drw', fence ? '33 < 34: write refused' : 'two owners: −1', fence ? 'acc' : 'bad');
      const ttl = own ? 5000 - own[1] : 0;
      o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['lock TTL', own ? `${TOK[own[0]]} · ${num(ttl)} ms` : ms >= 5001 && ms < 5003 ? 'expired' : 'free', own ? 'acc' : ms >= 5001 && ms < 5003 ? 'bad' : 'dim'], ['quantidade', qs(o.q), o.q < 0 ? 'bad' : '']);
      o.res = ms >= 6002 ? (fence ? ['Bia: UPDATE 0 (token 33 < 34)', 'quantidade stays 0'] : ['Bia: UPDATE 1 → quantidade = −1', 'two owners of the same lock'])
        : ms >= 6000 ? ['estoque-1 woke up after 6 s'] : ms >= 5007 ? ['Caio: UPDATE 1 → bought'] : ms >= 5003 ? ['Caio: OK · lock ' + TOK.b] : ms >= 5001 ? ['TTL expired: the key is gone'] : ms >= 3 ? [`Caio: nil (attempt ${tries})`, 'estoque-1 paused'] : ms >= 1 ? ['Bia: OK · lock ' + TOK.a] : [];
    },
    // reserva × estorno: duas travas pegas em ordem cruzada
    deadlock(o, ms, v) {
      const ordem = v === 'ordem', pg = v === 'pg', mem = v === 'mem';
      let hA = '', hB = '', wA = '', wB = '';
      if (ordem) {
        o.ev = [[0, 'R locks estoque'], [1, 'C waits for estoque'], [2, 'R locks pedido'], [4, 'R COMMIT', 'acc'], [5, 'C locks pedido'], [7, 'C COMMIT', 'acc']];
        hA = ms >= 0 && ms < 4 ? 'reservar' : ms >= 4 && ms < 7 ? 'cancelar' : ''; hB = ms >= 2 && ms < 4 ? 'reservar' : ms >= 5 && ms < 7 ? 'cancelar' : '';
        wA = ms >= 1 && ms < 4 ? 'cancelar' : '';
        leg(o, ms, -0.6, 0, RA, 'lock estoque', 'acc', 4); leg(o, ms, 0.4, 1, CA, 'lock estoque? waits', ms < 4 ? 'bad' : 'acc', 6);
        leg(o, ms, 1.4, 2, RB, 'lock pedido', 'acc', 2); leg(o, ms, 4.4, 5, CB, 'lock pedido', 'acc', 2);
        st(o, 'bia', ms < 4 ? ['estoque → pedido', 'acc'] : ['COMMIT · released both', 'acc']);
        st(o, 'caio', ms < 1 ? ['about to ask for estoque', 'dim'] : ms < 4 ? ['waits on the 1st lock', 'bad'] : ms < 7 ? ['estoque → pedido', 'acc'] : ['COMMIT · cancel done', 'acc']);
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['lock order', 'estoque → pedido'], ['cycle', 'none', 'acc']);
        if (ms >= 1 && ms < 4) T(o, 'lkA', 'cancelar waits here,\nholding nothing', 'acc');
        o.res = ms >= 7 ? ['reservar: COMMIT at t = 4 ms', 'cancelar: COMMIT at t = 7 ms'] : ms >= 1 ? ['cancelar waits on the 1st lock', 'holding nothing: there is no cycle'] : [];
      } else {
        o.ev = [[0, 'R locks estoque'], [1, 'C locks pedido'], [2, 'R waits'], [3, 'C waits · cycle', 'bad']];
        if (pg) o.ev.push([1002, '40P01', 'bad'], [1003, 'C goes on', 'acc']);
        if (mem) o.ev.push([2000, 'timeout 2 s', 'bad']);
        const dead = pg && ms >= 1002;
        hA = ms >= 0 && !dead ? 'reservar' : dead ? 'cancelar' : ''; hB = ms >= 1 ? 'cancelar' : '';
        wB = ms >= 2 && !dead ? 'reservar' : ''; wA = ms >= 3 && !dead ? 'cancelar' : '';
        const cyc = ms >= 3 && !dead;
        leg(o, ms, -0.6, 0, RA, 'lock estoque', cyc ? 'bad' : 'acc', 1e6); leg(o, ms, 0.4, 1, CB, 'lock pedido', cyc ? 'bad' : 'acc', 1e6);
        if (!dead) { leg(o, ms, 1.4, 2, RB, 'pedido? waits', 'bad', 1e6); leg(o, ms, 2.4, 3, CA, 'estoque? waits', 'bad', 1e6); }
        else { wire(o, RB, false); leg(o, ms, 1002, 1003, CA, 'lock estoque', 'acc', 1e6);
          o.beams.forEach(b => { if (b.pts === RA) { b.on = false; b.tone = ''; } if (b.pts === CB) b.tone = ''; }); }
        if (cyc) { o.on.lkA = o.on.lkB = 'bad'; o.on.bia = o.on.caio = 'bad'; }
        if (pg && ms >= 3 && !dead) o.on.db = 2;
        st(o, 'bia', ms < 0 ? ['payment confirmed', 'dim'] : ms < 2 ? ['holds estoque', 'acc'] : dead ? ['ERROR 40P01 · aborted', 'bad'] : ['holds estoque, wants pedido', 'bad']);
        st(o, 'caio', ms < 1 ? ['Bia clicked cancel', 'dim'] : ms < 3 ? ['holds pedido', 'acc'] : dead ? (ms >= 1004 ? ['goes on: cancel done', 'acc'] : ['got estoque', 'acc'])
          : mem && ms >= 2000 ? ['Bia: error (2 s timeout)', 'bad'] : ['holds pedido, wants estoque', 'bad']);
        if (pg) st(o, 'db', ['deadlock_timeout = 1 s', ms >= 3 && !dead ? 'acc' : 'dim'], [dead ? 'deadlock detected' : ms >= 3 ? `checks in ${num(Math.max(0, 1002 - ms))} ms` : 'no cycle', dead ? 'bad' : 'dim']);
        if (mem) st(o, 'db', ['in-memory locks (Go)', 'dim'], ['the database does not see the cycle', ms >= 3 ? 'bad' : 'dim']);
        const waitMs = Math.max(0, Math.floor(ms - 3));
        o.cnt = C3(['t', num(Math.max(0, Math.floor(ms))) + ' ms'], ['locks held', String((hA ? 1 : 0) + (hB ? 1 : 0))],
          dead ? ['result', '40P01 · reservar aborted', 'bad'] : cyc ? ['stuck for', num(waitMs) + ' ms', 'bad'] : ['cycle', ms >= 2 ? 'almost' : 'not yet', 'dim']);
        if (cyc) T(o, [232, 220, 46], 'cycle: each one waits for the other', 'bad'); if (dead) T(o, 'db', 'deadlock detected · 40P01', 'bad');
        o.res = dead ? ['ERROR: deadlock detected', 'SQLSTATE 40P01 · cancelar goes on'] : mem && ms >= 2000 ? ['Bia: error (2 s timeout)', 'the 2 goroutines stay stuck'] : cyc ? ['reservar waits for cancelar', 'cancelar waits for reservar'] : ms >= 1 ? ['each one holds a lock'] : [];
      }
      st(o, 'lkA', ['owner: ' + (hA || 'nobody'), hA ? 'acc' : 'dim'], ['waits: ' + (wA || '—'), wA ? 'bad' : 'dim']);
      st(o, 'lkB', ['owner: ' + (hB || 'nobody'), hB ? 'acc' : 'dim'], ['waits: ' + (wB || '—'), wB ? 'bad' : 'dim']);
      if (!o.on.lkA && hA) o.on.lkA = 2; if (!o.on.lkB && hB) o.on.lkB = 2;
      o.qx = hA ? 'row locked: ' + hA : '';
      LKDB.forEach((pts, i) => wire(o, pts, i ? !!hB : !!hA));
    },
  };

  // ── os passos: o que a história conta, o SQL/comando real e a janela do relógio (k = [segundo do passo, ms da história]) ──
  const K = (a, b, run = 2.8) => [[0.4, a], [0.4 + run, b]];
  const STEPS = {
    race: [
      { id: 'cena', k: [[0, -1]], clk: [0, 6], title: '1 cat left and two clicks', sk: 'IN THE CODE · reservar (Go)',
        sql: ['q := lerQuantidade(sku)   // SELECT (2 ms)', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)               // UPDATE (2 ms)', 'return nil'],
        story: 'After Lena\'s order 1048, the GATO-042 row of the estoque table was left with quantidade = 1: the last plush cat. Bia, in SP, clicks "buy" at 14:02:10.000. Caio, in Rio, clicks 2 ms later. Both land in the same process, estoque-1, which runs reservar: first it reads the quantity, then it decrements.',
        look: 'The database drawer shows quantidade = 1 with the cat on top. The two cards wait on the left.',
        key: 'Reading and then decrementing are two steps, and someone else fits in between them.' },
      { id: 'bia', k: K(0, 2), clk: [0, 6], title: 't = 0: Bia reads 1', sk: 'SQL · Bia, t = 0 ms', sql: SEL,
        story: 'At 14:02:10.000 Bia\'s reservation sends the SELECT. The database answers in 2 ms: quantidade = 1. She passes the if q < 1 and goes on to decrement.',
        look: 'Light leaves estoque-1 along Bia\'s lane, touches the drawer and comes back with "reads 1".',
        key: 'So far everything is fine: Bia read a stock that exists.' },
      { id: 'janela', k: K(2, 4), clk: [0, 6], title: 't = 2: Caio reads 1 too', sk: 'SQL · Bia and Caio, t = 2 ms', sql: ['-- Bia:', ...UPD, '-- Caio, at the same instant:', ...SEL],
        story: 'At t = 2 ms Bia sends the UPDATE and Caio arrives with his SELECT. Bia\'s UPDATE only commits at t = 4 ms, so Caio reads quantidade = 1, the same value she read. Both pass the if.',
        look: 'Two lights run at the same time: Bia\'s UPDATE and Caio\'s SELECT. At t = 4 the drawer goes to 0 and the cat disappears.',
        key: 'The race window is the time between checking and decrementing: 2 ms.' },
      { id: 'menos1', k: K(4, 6), clk: [0, 6], title: 't = 6: quantidade = −1', sk: 'SQL · Caio, t = 4 ms', sql: UPD,
        story: 'At t = 4 ms Caio sends his UPDATE, based on the read of 1 that went stale. At t = 6 ms the database commits: quantidade = −1. Bia gets order 1049 (88.90 with SP shipping) and Caio also gets "reservation ok". Two reservations for one cat.',
        look: 'The drawer turns red with −1; both cards show the confirmed reservation.',
        key: 'Check-then-act without a lock: both check, both act, the stock goes negative.' },
      { id: 'ordens', k: [[0, 6]], clk: [0, 6], title: 'What if it goes wrong: 4 of 6 orders sell twice', sk: 'THE 6 ORDERS (B = Bia, C = Caio; 1 = checks, 2 = decrements)',
        sql: ['B1 B2 C1 C2  →  0 · Caio 409', 'C1 C2 B1 B2  →  0 · Bia 409', 'B1 C1 B2 C2  → −1', 'B1 C1 C2 B2  → −1', 'C1 B1 B2 C2  → −1', 'C1 B1 C2 B2  → −1'],
        story: 'With 2 steps each, there are 6 possible orders. Only the 2 in which one whole order finishes before the other starts work out. The other 4 leave the quantity at −1. The stopwatch decides which one comes out, and that is why the defect shows up one day and disappears the next. The article\'s lab shows the same with 100 goroutines doing grelhados++: the total comes out 97, 96, 100, 99…',
        look: 'The scene stays frozen at t = 6 ms: −1 in the drawer and both reservations confirmed.',
        key: 'A race does not fail every time; it fails when the orders mix, and with traffic they mix.' },
    ],
    mutex: [
      { id: 'lock', k: K(0, 2), clk: [0, 6], title: 'A lock around reservar', sk: 'IN THE CODE · reservar with sync.Mutex',
        sql: ['mu.Lock()', 'defer mu.Unlock()', 'q := lerQuantidade(sku)   // SELECT', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)               // UPDATE'],
        story: 'The most direct fix: a sync.Mutex around the whole reservar. Whoever arrives takes the lock; whoever arrives later waits for it to open. Bia arrives at t = 0, takes the lock and sends the SELECT: reads 1.',
        look: 'The MUTEX gate, between estoque-1 and the database, lights up with "owner: Bia". Bia\'s light goes through and comes back with "reads 1".',
        key: 'Mutex: only one goroutine at a time inside the critical section.' },
      { id: 'espera', k: K(2, 4), clk: [0, 6], title: 't = 2: Caio waits at the gate', sk: 'SQL · Bia, t = 2 ms', sql: ['-- Bia, with the lock:', ...UPD, '-- Caio: stopped at mu.Lock()'],
        story: 'At t = 2 ms Caio arrives and calls mu.Lock(). The lock is Bia\'s, so his goroutine sleeps. Meanwhile Bia\'s UPDATE commits at t = 4 ms (quantidade = 0) and the defer releases the lock.',
        look: 'Caio\'s light stops, red, at the gate. The drawer goes to 0 and the cat disappears.',
        key: 'Whoever arrives with the lock taken waits, without spending CPU.' },
      { id: 'quatrocentos', k: K(4, 6), clk: [0, 6], title: 't = 6: Caio reads 0 and gets 409', sk: 'SQL · Caio, t = 4 ms', sql: SEL,
        story: 'At t = 4 ms the lock passes to Caio. His SELECT reads quantidade = 0 and he gets 409 out of stock at t = 6 ms, 4 ms after clicking. Bia keeps order 1049. Caio does not consume an order number.',
        look: 'The gate changes owner; Caio\'s light comes back with "reads 0" and his card shows 409.',
        key: 'With the lock, the second read already sees the result of the first write.' },
      { id: 'custo', k: [[0, 6]], clk: [0, 6], title: 'What the lock costs', sk: 'THE MATH',
        sql: ['critical section = SELECT 2 ms + UPDATE 2 ms', '              = 4 ms', '1 s ÷ 4 ms = 250 reservations/s of the same SKU', '             on this replica'],
        story: 'The critical section is 4 ms: the SELECT and the UPDATE. While it lasts, nobody else reserves GATO-042 on this replica. That sets a ceiling: 1 s ÷ 4 ms = 250 reservations per second of the same SKU. The article\'s lab exaggerates on purpose and sleeps 100 ms with the mutex locked: 100 items become 10 s in series.',
        look: 'The clock stops at t = 6 ms; the gate is free and the drawer at 0.',
        key: 'Lock only what you need: every ms inside the lock is a ms of queue for everyone.' },
      { id: 'defer', v: 'defer', k: [[0.3, 0], [1.6, 6], [2.3, 10], [4.6, 2010]], clk: [0, 2010], title: 'What if it goes wrong: the Unlock that never runs', sk: 'IN THE CODE · without defer',
        sql: ['mu.Lock()', 'q := lerQuantidade(sku)', 'if q < 1 { return ErrSemEstoque } // leaves locked', 'baixar(sku)', 'mu.Unlock()'],
        story: 'Now someone removed the defer and put mu.Unlock() at the end. Bia goes through normally. Caio reads 0 and leaves through the return ErrSemEstoque, before the Unlock: the lock stays stuck. At t = 10 ms he clicks again and does not even get a 409; the call sits at the gate until the client\'s 2 s timeout. Every reservation of the cat on this replica stops.',
        look: 'The gate turns red with "nobody releases"; Caio\'s second light stops there and the clock runs up to 2,010 ms.',
        key: 'Every exit path has to release the lock; the defer guarantees that.' },
    ],
    condicional: [
      { id: 'bia', k: K(0, 2), clk: [0, 4], title: 'The database checks and decrements in one step', sk: 'SQL · Bia, t = 0 ms', sql: UPDC,
        story: 'What if the database itself did the checking? The UPDATE with AND quantidade > 0 joins the check and the decrement in a single, atomic command. Bia sends it at t = 0 and the database answers at t = 2 ms: UPDATE 1, one row affected. Quantidade = 0, order 1049.',
        look: 'estoque-1 has no gate at all. Bia\'s light comes back with "UPDATE 1" and the drawer goes to 0.',
        key: 'Conditional write: the condition travels with the write, and the database does both at once.' },
      { id: 'caio', k: K(2, 4), clk: [0, 4], title: 't = 4: Caio affects 0 rows', sk: 'SQL · Caio, t = 2 ms', sql: UPDC,
        story: 'Caio sends the same UPDATE at t = 2 ms. Now quantidade > 0 is false, so no row changes: UPDATE 0. The code sees 0 rows and returns 409 at t = 4 ms. No mutex, no Redis, and it holds for as many replicas as there are, because the database is the one deciding.',
        look: 'Caio\'s light comes back with "UPDATE 0 → 409"; the drawer stays at 0.',
        key: 'Optimistic lock: acts and checks at the end; if someone else touched it first, it affects 0 rows and you handle that.' },
      { id: 'pess', v: 'pess', k: K(0, 5, 3.4), clk: [0, 6], title: 'The pessimistic one: lock the row first', sk: 'SQL · Bia (and Caio the same)',
        sql: ['BEGIN;', 'SELECT quantidade FROM estoque', "  WHERE sku = 'GATO-042' FOR UPDATE;", 'UPDATE estoque SET quantidade = quantidade - 1', "  WHERE sku = 'GATO-042';", 'COMMIT;'],
        story: 'The other way is to lock the row before reading: SELECT … FOR UPDATE. Bia locks the row at t = 1 ms, reads 1, decrements and commits at t = 4 ms. Caio\'s SELECT … FOR UPDATE arrives at t = 3 ms and sits there until her COMMIT; then he reads 0, does a ROLLBACK and returns 409.',
        look: 'The drawer shows "row locked: Bia"; Caio\'s light stops, red, at the database until t = 4 ms.',
        key: 'Pessimistic lock: locks first. It pays off when the conflict is the rule, as with the last cat.' },
      { id: 'sem', v: 'sem', k: K(0, 4), clk: [0, 4], title: 'What if it goes wrong: the UPDATE without the condition', sk: 'SQL · Bia and Caio', sql: UPD,
        story: 'Now someone "simplifies" and removes the AND quantidade > 0. Bia\'s UPDATE affects 1 row (quantidade = 0) and Caio\'s also affects 1 row: quantidade = −1. The whole protection was in that condition.',
        look: 'Both lights come back with "UPDATE 1"; the drawer turns red with −1.',
        key: 'Without the condition in the WHERE, the database obeys and decrements again.' },
    ],
    replicas: [
      { id: 'sobe', k: [[0, -1]], clk: [0, 6], title: 'Black Friday brings up the 2nd replica', sk: 'IN THE CODE · the same reservar with a mutex',
        sql: ['var mu sync.Mutex   // one per process', 'mu.Lock()', 'defer mu.Unlock()', 'q := lerQuantidade(sku)', 'if q < 1 { return ErrSemEstoque }', 'baixar(sku)'],
        story: 'With Black Friday, autoscaling brings up estoque-2. The load balancer sends Bia to estoque-1 and Caio to estoque-2. The code is the same, with the sync.Mutex. But each process has its own memory, so each one has its own mutex.',
        look: 'Two replicas, each with its own MUTEX gate, and both lanes going to the same drawer.',
        key: 'A mutex only protects the goroutines of the same process.' },
      { id: 'duas', k: K(0, 4), clk: [0, 6], title: 'Both gates open', sk: 'SQL · Bia (estoque-1) and Caio (estoque-2)', sql: ['-- estoque-1, t = 0:', ...SEL, '-- estoque-2, t = 2:', ...SEL],
        story: 'Bia takes estoque-1\'s mutex at t = 0. Caio takes estoque-2\'s mutex at t = 2 ms: it is free, because nobody in that process has used it. Both read quantidade = 1.',
        look: 'Both gates light up at the same time, each with an owner.',
        key: 'Two memories, two locks, no exclusion between them.' },
      { id: 'menos1', k: K(4, 6), clk: [0, 6], title: 'What if it goes wrong: −1 again', sk: 'SQL · Caio (estoque-2), t = 4 ms', sql: UPD,
        story: 'Bia decrements to 0 at t = 4 ms. Caio, with the stale read of 1, decrements at t = 6 ms: quantidade = −1. It is the race from lesson 6 back, now with one lock per replica. To hold across processes, the lock has to live outside them.',
        look: 'The drawer turns red with −1, with both gates still lit.',
        key: 'With N replicas, the lock has to be shared: in the database, in Redis or in ZooKeeper.' },
    ],
    redis: [
      { id: 'set', k: K(-0.2, 1, 2), clk: [0, 6], title: 'The lock becomes a key in Redis', sk: 'COMMAND · Redis, t = 0 ms', sql: ['SET ' + KEY + ' a1 NX PX 5000', '-- NX: only creates if it does not exist', '-- PX 5000: disappears on its own in 5 s', '-- a1: the token of whoever locked'],
        story: 'The lock leaves the process and goes to Redis, which both replicas can see. A single command: SET with NX (creates only if it does not exist) and PX 5000 (5 s TTL). Bia sends it with token a1 and gets OK at t = 1 ms.',
        look: 'Light from estoque-1 goes to REDIS and comes back with OK; the key appears with "= a1" and the TTL starts counting down.',
        key: 'Distributed lock: a key that only one can create, with a deadline to disappear.' },
      { id: 'nil', k: K(1, 3), clk: [0, 6], title: 't = 3: Caio gets nil', sk: 'COMMAND · Caio, t = 2 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000', '-- reply: (nil)', '-- the key already exists: it is Bia\'s'],
        story: 'Bia reads 1 in the database. At t = 2 ms Caio, on estoque-2, tries the same SET with token b2. The key already exists, so Redis answers nil at t = 3 ms. Caio sleeps 50 ms and tries again.',
        look: 'Light from estoque-2 goes up to REDIS and comes back red with nil.',
        key: 'NX does the check and the create in a single step, inside Redis.' },
      { id: 'del', k: K(3, 6), clk: [0, 6], title: 't = 6: Bia decrements and releases', sk: 'COMMAND · Bia, t = 5 ms', sql: LUA,
        story: 'Bia decrements to 0 at t = 5 ms and releases the lock at t = 6 ms. She releases while checking the owner: the Lua script only deletes the key if the value is still a1. Full cycle: 1 ms of SET, 4 ms of work, 1 ms of DEL.',
        look: 'The drawer goes to 0; the light goes to REDIS with the EVAL and the key disappears.',
        key: 'Only whoever locked unlocks: compare the token before deleting.' },
      { id: 'caio', k: [[0.3, 6], [1.4, 53], [2.4, 54], [3.4, 56], [4.0, 57]], clk: [0, 60], title: 't = 54: Caio gets in and gets 409', sk: 'COMMAND and SQL · Caio, t = 53 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000   -- OK', ...SEL, '-- reads 0 → 409 · EVAL releases at t = 57'],
        story: 'Caio comes back at t = 53 ms, gets OK at t = 54 ms, reads quantidade = 0 and returns 409 at t = 56 ms. He releases the lock at t = 57 ms. Bia keeps 1049 and the stock closes at 0, even with two replicas.',
        look: 'The clock skips the 50 ms wait; the key reappears with "= b2" and Caio\'s light comes back with "reads 0 → 409".',
        key: 'With the lock outside the process, both replicas queue up on the same key.' },
      { id: 'custo', k: [[0, 57]], clk: [0, 60], title: 'What it costs: 166 reservations/s', sk: 'THE MATH',
        sql: ['lock cycle = SET 1 ms + work 4 ms', '               + DEL 1 ms = 6 ms', '1 s ÷ 6 ms = 166 reservations/s per SKU', '-- Caio waited 54 ms (50 of sleep)'],
        story: 'Each reservation now holds the key for 6 ms: 1 for SET, 4 for SELECT and UPDATE, 1 for DEL. The ceiling is 1 s ÷ 6 ms = 166 reservations per second of the same SKU, adding up the replicas. And Caio paid 50 ms of sleep because the lock has no queue; ZooKeeper, with sequential nodes, notifies the next in line.',
        look: 'The scene stays frozen at t = 57 ms: key free, drawer at 0.',
        key: 'The distributed lock costs a round trip to Redis and waits without a queue.' },
    ],
    ttl: [
      { id: 'trava', k: K(-0.2, 3, 2.4), clk: [0, 6010], title: 'Bia locks and reads 1', sk: 'COMMAND and SQL · Bia, t = 0 ms', sql: ['SET ' + KEY + ' a1 NX PX 5000   -- OK', ...SEL, '-- reads 1 at t = 3 ms'],
        story: 'Same start as the Redis scenario: Bia, on estoque-1, takes lock a1 with a 5 s TTL and reads quantidade = 1 at t = 3 ms. Only the UPDATE is left.',
        look: 'The key appears with "= a1 · TTL 5,000 ms". The front clock goes up to 6 s, because this time the story takes longer.',
        key: 'The TTL exists so the lock does not get stuck if the owner dies.' },
      { id: 'pausa', k: [[0.3, 3], [4.0, 5001]], clk: [0, 6010], title: 'estoque-1 stops for 6 s', sk: 'COMMAND · Caio, every 50 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000', '-- (nil) at t = 3, 53, 103 … 4,953 ms', '-- estoque-1: long pause (GC, bad network)'],
        story: 'Before the UPDATE, estoque-1 stops: a long garbage-collection or network pause, of 6 s. It did not die, so nothing warns anyone. Caio tries the lock every 50 ms and gets nil 100 times. At t = 5,001 ms the TTL expires and the key disappears on its own.',
        look: 'estoque-1 turns red, "PAUSED". The TTL goes down to 0 and the key disappears; Caio\'s lane flashes on each attempt.',
        key: 'The TTL does not know whether the owner died or is just slow.' },
      { id: 'caio', k: [[0.3, 5001], [3.2, 5008]], clk: [0, 6010], title: 't = 5,003: Caio takes the lock and buys', sk: 'COMMAND and SQL · Caio, t = 5,003 ms', sql: ['SET ' + KEY + ' b2 NX PX 5000   -- OK', ...SEL, ...UPD.slice(0, 1), '-- reads 1, decrements to 0 at t = 5,007 ms'],
        story: 'Caio\'s first attempt after the expiry, at t = 5,003 ms, gets OK with token b2. He reads 1, decrements to 0 and buys the cat. For Redis everything is fine: the key had expired.',
        look: 'The key comes back with "= b2"; Caio\'s light goes to the database and the drawer goes to 0.',
        key: 'For Redis, the lock expired and has a new owner. Bia does not know yet.' },
      { id: 'dois', k: [[0.3, 5008], [1.6, 6000], [3.2, 6002]], clk: [0, 6010], title: 'What if it goes wrong: two owners, −1', sk: 'SQL · Bia, t = 6,000 ms', sql: UPD,
        story: 'At t = 6,000 ms estoque-1 wakes up. For it, nothing happened: it still has lock a1. It sends the UPDATE and the database accepts: quantidade = −1. If Caio still held the lock, the lab\'s plain DEL (without checking the owner) would delete his. The article\'s lab uses a 10 s TTL for 10 s of work, the same risk.',
        look: 'estoque-1 wakes up and Bia\'s light goes straight to the database; the drawer turns red with −1.',
        key: 'A lock with a TTL can expire while the owner is still working.' },
      { id: 'fence', v: 'fence', k: [[0.3, 5001], [2.2, 5008], [3.0, 6000], [4.4, 6002]], clk: [0, 6010], title: 'Fencing token: 33 < 34, refused', sk: 'SQL · with fencing token',
        sql: ['-- Caio, token 34:', 'UPDATE estoque SET quantidade = quantidade - 1,', '  ultimo_token = 34', "  WHERE sku = 'GATO-042' AND ultimo_token < 34;", '-- Bia, token 33: same thing with 33 → UPDATE 0'],
        story: 'Kleppmann\'s remedy: the lock service hands out a number that only grows, 33 for Bia and 34 for Caio, and the database refuses a write with a number lower than the highest already seen. Caio\'s write stores 34. Bia\'s, which wakes up with 33, affects 0 rows. Redis\'s SET NX does not generate this number; ZooKeeper does. And the UPDATE … AND quantidade > 0 would also solve it, without depending on a clock.',
        look: 'The drawer shows "last token = 34"; Bia\'s light comes back with "UPDATE 0 · 33 < 34" and the quantity stays at 0.',
        key: 'A correctness lock needs a fencing token or a check in the database.' },
    ],
    deadlock: [
      { id: 'r', k: K(-0.6, 0.6, 1.6), clk: [0, 4], title: 'reservar locks estoque', sk: 'SQL · reservar(1049), t = 0 ms', sql: ['BEGIN;', 'SELECT * FROM estoque', "  WHERE sku = 'GATO-042' FOR UPDATE;", '-- then: SELECT * FROM pedidos', '--   WHERE id = 1049 FOR UPDATE;'],
        story: 'At 14:02:10.500 the payment for 1049 is confirmed and reservar(1049) starts. It locks the estoque row first, then goes on to lock the pedido one.',
        look: 'The estoque:GATO-042 lock lights up with "owner: reservar".',
        key: 'Each operation needs two locks: estoque and pedido.' },
      { id: 'c', k: K(0.6, 1.6, 1.6), clk: [0, 4], title: 't = 1: cancelar locks pedido', sk: 'SQL · cancelar(1049), t = 1 ms', sql: ['BEGIN;', 'SELECT * FROM pedidos', '  WHERE id = 1049 FOR UPDATE;', '-- then: SELECT * FROM estoque', "--   WHERE sku = 'GATO-042' FOR UPDATE;"],
        story: 'At the same instant Bia, regretting it, clicks "cancel". cancelar(1049) does the refund in the opposite order: it locks the order first, then the stock. At t = 1 ms it holds the pedido 1049 row.',
        look: 'The pedido:1049 lock lights up with "owner: cancelar". Each operation holds one.',
        key: 'Two operations, the same two locks, in opposite order.' },
      { id: 'ciclo', k: K(1.6, 3.6, 2.4), clk: [0, 4], title: 't = 3: the cycle closes', sk: 'WHO WAITS FOR WHOM',
        sql: ['reservar: holds estoque, wants pedido', 'cancelar: holds pedido,  wants estoque', '-- mutual exclusion · hold and wait', '-- no preemption · circular wait'],
        story: 'At t = 2 ms reservar asks for pedido and waits. At t = 3 ms cancelar asks for estoque and waits. Each one waits for the other to release, and neither does. All 4 Coffman conditions (1971) are present: mutual exclusion, hold and wait, no preemption and circular wait.',
        look: 'The lanes cross in an X and everything turns red: the cycle is lit.',
        key: 'Deadlock: a wait cycle in which nobody moves.' },
      { id: 'mem', v: 'mem', k: [[0.3, 3], [3.6, 2000], [4.6, 2600]], clk: [0, 2600], title: 'What if it goes wrong: nobody undoes it', sk: 'IN THE CODE · in-memory locks (Go)',
        sql: ['muEstoque.Lock(); muPedido.Lock()   // reservar', 'muPedido.Lock(); muEstoque.Lock()   // cancelar', '-- sync.Mutex does not detect a cycle', '-- nor does it have a time limit'],
        story: 'If these locks were in-memory sync.Mutex, nobody would notice. After the client\'s 2 s timeout (module 10) Bia sees an error, but the two goroutines stay stuck holding the locks. Every future reservation of the cat also hangs on the estoque lock.',
        look: 'The clock runs up to 2.6 s with everything red; cancelar\'s card shows the error and the locks still have owners.',
        key: 'In-memory locks have no deadlock detector: the cycle lasts until the process restarts.' },
      { id: 'pg', v: 'pg', k: [[0.3, 3], [3.0, 1002], [4.2, 1004]], clk: [0, 1010], title: 'PostgreSQL undoes it in 1 s', sk: 'POSTGRESQL RESPONSE', sql: ['ERROR:  deadlock detected', 'SQLSTATE 40P01', '-- deadlock_timeout = 1 s (default)', '-- reservar is aborted; cancelar goes on'],
        story: 'With the locks in the database (FOR UPDATE), PostgreSQL looks for cycles among whoever has been waiting more than deadlock_timeout, 1 s by default. reservar had been waiting since t = 2 ms, so at t = 1,002 ms the database finds the cycle and aborts its transaction with ERROR: deadlock detected (SQLSTATE 40P01). cancelar takes the estoque lock and finishes the refund; the application can retry reservar.',
        look: 'The database lights up during the wait; at t = 1,002 reservar\'s lane goes out and cancelar\'s turns orange up to the estoque lock.',
        key: 'The database detects the cycle and kills one transaction; the application has to handle the 40P01.' },
      { id: 'ordem', v: 'ordem', k: K(-0.6, 7, 4), clk: [0, 8], title: 'Global order: always estoque before pedido', sk: 'THE RULE', sql: ['-- reservar and cancelar, both:', "SELECT * FROM estoque WHERE sku = 'GATO-042' FOR UPDATE;", 'SELECT * FROM pedidos WHERE id = 1049 FOR UPDATE;'],
        story: 'The fix: everyone locks in the same order, estoque before pedido. cancelar arrives at t = 1 ms at the estoque lock and waits holding nothing. reservar takes both, commits at t = 4 ms, and cancelar goes on until t = 7 ms. Without circular wait there is no cycle. A single lock, or a TryLock with a time limit, also breaks the cycle.',
        look: 'Both lanes go to the estoque lock; cancelar\'s waits, then lights up. Nothing is red at the end.',
        key: 'A global lock order removes the circular wait, and without it there is no deadlock.' },
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
      if (o.qx) { x.fillStyle = /locked/.test(o.qx) ? accC() : INK(); fitFont(x, u, o.qx, 8.4, 112); x.fillText(o.qx, u(5), u(41)); }
      if (q < 0) { x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.setLineDash([u(3), u(2)]); x.strokeRect(u(121), u(4), u(40), u(38)); x.setLineDash([]);
        x.fillStyle = BAD(); fitFont(x, u, '1 missing', 8.2, 38); x.textAlign = 'center'; x.fillText('1 missing', u(141), u(23)); }
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
    x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText('CLOCK', u(8), u(9));
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
    lbl('RESULT', L0, 104);
    (o.res.length ? o.res : ['…']).slice(0, 2).forEach((l, i) => { x.fillStyle = !o.res.length ? INK() : /−1|409|nil|error|timeout|stuck|ERROR|refus|two owners|twice|expired|abort/i.test(l) && !/0 rows|UPDATE 0|stays 0/.test(l) ? BAD() : acc;
      fitFont(x, u, l, 9.2, Wd - L0 - 8); x.fillText(l, u(L0), u(117 + i * 12)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">2 ms per SELECT/UPDATE and 1 ms per Redis command are the module\'s example numbers, in the order of magnitude of the real ones.</li>';
  const DATA = {
    race: () => `<table class="h3-sum"><tr><th>t (ms)</th><th>Bia</th><th>Caio</th><th>qty.</th></tr><tr><td>0</td><td>SELECT → 1</td><td>—</td><td>1</td></tr><tr><td>2</td><td>UPDATE…</td><td>SELECT → 1</td><td>1</td></tr><tr><td>4</td><td>UPDATE ok</td><td>UPDATE…</td><td>0</td></tr><tr class="on"><td>6</td><td>order 1049</td><td>UPDATE ok</td><td>−1</td></tr></table>
      <li>Order <b>1049</b>: cat 79.90 + SP shipping 9.00 = <b>88.90</b>.</li><li>Race window: <b>2 ms</b> (from checking to decrementing). Of the 6 orders, <b>4 give −1</b>.</li><li>Lab <b>race_condition/main.go</b>: 100 goroutines do <b>grelhados++</b>; the article shows 97, 96, 100, 99, 97, 100, 99. <b>go run -race</b> flags the race.</li>${EX}`,
    mutex: () => `<li><b>sync.Mutex</b> around reservar; <b>defer mu.Unlock()</b> releases on every exit path.</li><li>Caio arrives at t = 2, waits 2 ms, reads 0 at t = 6: <b>409</b> 4 ms after clicking. Does not consume an order number.</li><li>A <b>4 ms</b> critical section → at most <b>250 reservations/s</b> of the same SKU per replica.</li><li>Lab <b>mutex/main.go</b>: sleeps 100 ms with the lock; 100 items = <b>10 s</b> in series (with the Sleep outside the lock, ~100 ms).</li><li>Go's sync.Mutex enters <b>starvation mode</b> if someone waits more than 1 ms: it starts handing over in order.</li>${EX}`,
    condicional: () => `<table class="h3-sum"><tr><th></th><th>optimistic</th><th>pessimistic</th></tr><tr><td>how</td><td>UPDATE … AND quantidade &gt; 0</td><td>SELECT … FOR UPDATE</td></tr><tr><td>Caio</td><td>UPDATE 0 → 409</td><td>waits for the COMMIT → 409</td></tr><tr class="on"><td>pays off when</td><td>conflict is rare</td><td>conflict is the rule</td></tr></table>
      <li>If both UPDATEs arrive together, PostgreSQL makes the second wait for the row lock and re-evaluates the <b>WHERE</b> after the first one's COMMIT: 0 rows.</li><li>Works with <b>N replicas</b>: no mutex, no Redis.</li><li>Different from the version guard in lesson 6 (<b>event_version &lt; 2</b>): the optimistic one checks "nobody touched it since I read"; the guard decides which version wins.</li>${EX}`,
    replicas: () => `<li><b>estoque-1</b> and <b>estoque-2</b>: 2 processes, 2 pods, 2 memories, 1 vCPU each.</li><li>The LB sends Bia to estoque-1 and Caio to estoque-2; each one takes <b>its own</b> mutex.</li><li>Result: quantidade = <b>−1</b>, same as the race without a lock.</li><li>Ways out: a conditional write in the database (Conditional scenario) or a shared lock (Redis, ZooKeeper).</li>${EX}`,
    redis: () => `<li>Lock: <b>SET ${KEY} a1 NX PX 5000</b> → OK (only one can create it; it disappears in 5 s).</li><li>Release while checking the owner (script from the Redis doc): <b>if redis.call("get",KEYS[1]) == ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end</b></li><li>Cycle: 1 ms of SET + 4 of work + 1 of DEL = <b>6 ms</b> → at most <b>166 reservations/s</b> per SKU.</li><li>The article's lab does a <b>GET</b> and then a <b>SetNX</b>, with the value "locked" the same for everyone: without a token, the DEL deletes someone else's lock.</li><li><b>ZooKeeper</b>: ephemeral and sequential node (/locks/estoque-GATO-042/lock-0000000007); the lowest holds the lock, each one watches only the previous one: a fair queue.</li>${EX}`,
    ttl: () => `<table class="h3-sum"><tr><th>t (ms)</th><th>what</th></tr><tr><td>1</td><td>Bia: SET a1 NX PX 5000 → OK</td></tr><tr><td>3 … 6,000</td><td>estoque-1 paused (GC / network)</td></tr><tr><td>5,001</td><td>TTL expires, the key disappears</td></tr><tr><td>5,003</td><td>Caio: OK (b2), reads 1, decrements to 0</td></tr><tr class="on"><td>6,002</td><td>Bia: UPDATE → −1 (no fencing)</td></tr></table>
      <li><b>Fencing token</b> (Kleppmann): 33 for Bia, 34 for Caio; the database refuses a number lower than the highest already seen.</li><li>Redis's SET NX does not give this number; ZooKeeper does (zxid / sequence).</li><li><b>Efficiency</b> lock (avoids repeated work) accepts a simple Redis; <b>correctness</b> lock (selling the cat twice) needs fencing or a check in the database.</li><li><b>Redlock</b> (5 Redis, majority): Kleppmann says it depends on timing assumptions; Sanfilippo answers that they are reasonable.</li>`,
    deadlock: () => `<li>reservar(1049): estoque → pedido · cancelar(1049): pedido → estoque.</li><li>t = 0 R locks estoque · t = 1 C locks pedido · t = 2 R waits · t = 3 C waits: <b>cycle</b>.</li><li>Coffman (1971): mutual exclusion, hold and wait, no preemption, circular wait.</li><li>PostgreSQL: <b>deadlock_timeout = 1 s</b>; aborts one with <b>ERROR: deadlock detected</b> (SQLSTATE <b>40P01</b>).</li><li>Fixes: <b>global order</b> (estoque before pedido), TryLock with a time limit, or a single lock.</li><li class="h3-dim">In this figure, R and C start at 14:02:10.500.</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0)}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l)}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="e3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.sk)}</b>${esc(s.sql.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'estoque') return; const o = SP || spec(), c = o.cnt[1];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · t = ${num(Math.max(0, Math.floor(o.ms)))} ms${c ? ' · ' + c[0] + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 220, -150), dist: innerWidth < 640 ? 14 : 17 } : { target: W(150, 220, 60), dist: 15.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
