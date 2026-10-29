// Figura 3D (iso-glow): o banco do pedidos em três sites. SP (pg-sp, o primário) à esquerda; Rio (pg-rio) e Recife (pg-recife)
// à direita, ligados a SP por cabos com o RTT escrito (10 e 80 ms). Na face de cada gabinete, a fita do WAL: cada célula é um
// registro (o 1055 da Lena e os vizinhos); acesa = aplicada, contorno = recebida e ainda não aplicada, vermelha = perdida.
// O registro que viaja é um ponto de luz com o rótulo em cima. Ao lado de Recife, o celular da Lena com "meus pedidos".
// Atrás, o mostrador (contadores, o SQL ou a conta do passo e o resultado).
// Cenários (botões e ?mode=primary-replica|queda|multi|lag|assincrona|semi|sincrona; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/replicacao-brief.md) e as aulas 1–3 (commit 2/12/82 ms; 9 e 24 pedidos;
// RTO 35 s = 1.050 compras; LSN 0/8004430 × 0/8000060 do laboratório em PostgreSQL 14).
FIGS3D.push({ id: 'replicas', name: 'Replicas', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  const hms = ms => '20:10:00.' + String(Math.max(0, Math.round(ms))).padStart(3, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['primary-replica', 'queda', 'multi', 'lag', 'assincrona', 'semi', 'sincrona'];
  const SCNAME = { 'primary-replica': 'Replicas', queda: 'Outage', multi: 'Primary/​Primary', lag: 'Lag', assincrona: 'Async', semi: 'Semi', sincrona: 'Sync' };
  const SCFULL = { 'primary-replica': 'Primary and replicas', queda: 'The primary goes down', multi: 'Primary/Primary', lag: 'Lena and the lag',
    assincrona: 'Asynchronous replication', semi: 'Semi-synchronous replication', sincrona: 'Synchronous replication' };
  const A1 = 'aula-1-introducao', A2 = 'aula-2-modelos-primary-primary-e-primary-replica', A3 = 'aula-3-sincrona-assincrona-semi-sincrona-e-por-logs';
  const AULA = { 'primary-replica': A1, queda: A2, multi: A2, lag: A3, assincrona: A3, semi: A3, sincrona: A3 };
  let clk = 0, sc = 'primary-replica', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', paused = false;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-replicas3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda (o Rio fica na frente da metade direita da prancha)
  const SZ = PL + 46, SW = 500, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // gabinetes: SP maior (o primário), Rio e Recife, o celular da Lena e (só no split brain) os clientes que ainda alcançam SP
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  block('sp', 40, 160, 270, 188, 34); block('rio', 540, 66, 220, 144, 28); block('rec', 540, 272, 220, 144, 28);
  block('lena', 772, 280, 122, 132, 14); block('cli', 60, 372, 230, 58, 14);
  const NAMES = Object.keys(B);
  // os pedidos sem primário: cartões empilhados na frente de SP
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e pontos de luz: os registros do WAL, os acks e as leituras
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 28 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
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
  const TF = x => [x, 430, 22];   // balão na faixa livre da frente da prancha

  // ── cabos ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  const rev = pts => pts.slice().reverse();
  const CAB = { rio: P3([[310, 214], [425, 214], [425, 138], [540, 138]]), rec: P3([[310, 296], [425, 296], [425, 344], [540, 344]]),
    rr: P3([[650, 210], [650, 272]]), lena: P3([[760, 344], [772, 344]]), cli: P3([[175, 372], [175, 348]]) };
  const LENA_SP = [...rev(CAB.lena), ...rev(CAB.rec)];
  // um registro (ou ack, ou leitura) andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }

  // ── conteúdo padrão dos gabinetes ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const W55 = (s55, s54 = 'ok') => [['1053', 'ok'], ['1054', s54], ['1055', s55]];
  // a fita da Black Friday: 10 células de 100 ms; as k últimas ainda não aplicadas (ou perdidas)
  const BF = (k, st = 'recv') => Array.from({ length: 10 }, (_, i) => ['', i >= 10 - k ? st : 'ok']);
  function base() {
    const o = { show: { sp: 1, rio: 1, rec: 1, lena: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [] };
    o.rows.sp = act('pg-sp', 'PRIMARY', ['SP · reads and writes', 'dim']); o.rows.sp.tape = W55('none');
    o.rows.rio = act('pg-rio', 'REPLICA', ['Rio · read-only', 'dim']); o.rows.rio.tape = W55('none');
    o.rows.rec = act('pg-recife', 'REPLICA', ['Recife · read-only', 'dim']); o.rows.rec.tape = W55('none');
    o.rows.lena = act('Lena', 'app', ['my orders', 'dim'], ['1054 · 20:08', 'hi']);
    o.rows.cli = act('CLIENTS', 'that can still reach SP', ['keep buying', 'dim']);
    o.beams.push({ pts: CAB.rio }, { pts: CAB.rec });
    o.rtt = 1;
    return o;
  }
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // o 1055 sai de SP em s0 e chega à réplica depois de metade do RTT; aplica em a (ms do relógio da cena)
  const travel = (ms, s0, ow) => (ms - s0) / ow;
  const tapeAt = (ms, arrive, apply) => ms < arrive ? 'none' : ms < apply ? 'recv' : 'ok';

  // ── o que se vê em cada passo ──
  const STEPS = {
    'primary-replica': [
      { id: 'tres', dur: 5, title: 'One primary and two replicas', yk: 'THE TOPOLOGY', act: ['write', 'Write 1055 in SP'],
        code: ['pg-sp      primary · reads and writes', 'pg-rio     replica · read-only', 'pg-recife  replica · read-only', 'RTT SP–Rio 10 ms · SP–Recife 80 ms', 'Lena reads from Recife: ~2 ms, not 80'],
        story: 'Each <code>pedidos</code> shard now has three copies. The primary lives in SP (<code>pg-sp</code>): it reads and writes. The replicas live in Rio (<code>pg-rio</code>) and Recife (<code>pg-recife</code>) and only read. The distances are examples: a 10 ms round trip to Rio and 80 ms to Recife.',
        look: 'The three cabinets and the two cables with the RTT written on them. On the face of each one, the WAL tape ends at 1054, Lena\'s last order (20:08).',
        key: 'To replicate is to keep the same data in more than one place.',
        f(o, t) { lit(o, 'sp');
          o.cnt = [['COPIES', '3'], ['RIO RTT', '10 ms', 'dim'], ['RECIFE RTT', '80 ms', 'dim']];
          o.res = [['1 primary writes, 2 replicas read', 'acc']]; } },
      { id: 'escreve', dur: 5, title: '1055 enters SP: commit in 2 ms', yk: 'ON THE PRIMARY',
        code: ['INSERT INTO pedidos (id, cliente_id, total)', "  VALUES (1055, 'lena-77', 34.90);", 'COMMIT;  -- WAL on disk: 2 ms', 'SELECT pg_current_wal_lsn();  -- 0/8004430'],
        story: 'At 20:10:00.000 Lena buys 1 blue mug: 19.90 plus 15.00 of shipping, <b>34.90</b>. The <code>INSERT</code> reaches the primary, which writes the record to the WAL (the write-ahead log) and confirms the commit in <b>2 ms</b>. The position of that record in the log is the LSN <code>0/8004430</code>.',
        look: 'Cell 1055 lights up on SP\'s tape. On the replicas it is still empty.',
        key: 'The primary writes to its own log first; the log is what goes to the replicas.',
        f(o, t) { const ms = lin(t, 0.6, 2.4, 0, 2); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['INSERT 1055 · 34.90', 'acc'], [ms >= 2 ? 'COMMIT in 2 ms' : 'writing the WAL…', ms >= 2 ? 'acc' : 'dim'], ms >= 2 ? ['LSN 0/8004430', 'dim'] : null);
          o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.cnt = [['CLOCK', hms(ms)], ['LOCAL COMMIT', '2 ms', 'dim'], ['LSN', '0/8004430', 'dim']];
          o.res = ms >= 2 ? [['done in SP: 2 ms', 'acc']] : []; } },
      { id: 'fita', dur: 7, title: 'The tape reaches Rio in 5 ms and Recife in 40 ms', yk: 'HALF THE RTT, PLUS APPLYING',
        code: ['Rio:    10 ÷ 2 = 5 ms one way', 'Recife: 80 ÷ 2 = 40 ms one way', 'each replica applies the log in order', 'normal day: Rio 15 ms, Recife 60 ms behind', '(40 to travel + 20 to apply)'],
        story: 'After the commit the record leaves SP over both cables. It takes half the RTT to arrive: <b>5 ms</b> to Rio and <b>40 ms</b> to Recife. Each replica receives the record and applies it, in log order. On a normal day Rio is 15 ms behind and Recife 60 ms (40 to travel and 20 to apply). The figure\'s clock counts from the commit.',
        look: 'The point of light reaches Rio almost at once and takes eight times longer on the Recife cable. On each replica\'s tape, cell 1055 shows up as an outline (received) and then lights up (applied).',
        key: 'The replica receives the log, not the row, and falls behind by the travel time plus the apply time.',
        f(o, t) { const ms = lin(t, 0.5, 5, 0, 70); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 confirmed', 'acc'], ['sends the WAL to the replicas', 'dim']); o.rows.sp.tape = W55('ok');
          const rio = tapeAt(ms, 5, 15), rec = tapeAt(ms, 40, 60);
          o.rows.rio = act('pg-rio', 'REPLICA', ['Rio · read-only', 'dim'], [rio === 'none' ? 'waiting' : rio === 'recv' ? 'received: applying' : 'applied in 15 ms', rio === 'ok' ? 'acc' : 'dim']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'REPLICA', ['Recife · read-only', 'dim'], [rec === 'none' ? 'the WAL is on the cable' : rec === 'recv' ? 'received: applying' : 'applied in 60 ms', rec === 'ok' ? 'acc' : 'dim']); o.rows.rec.tape = W55(rec);
          if (rio === 'ok') o.on.rio = 1; if (rec === 'ok') o.on.rec = 1;
          o.beams = [{ pts: CAB.rio, on: ms < 5 }, { pts: CAB.rec, on: ms < 40 }];
          pk(o, CAB.rio, travel(ms, 0, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 0, 40), 'WAL 1055');
          o.cnt = [['AFTER THE COMMIT', '+' + Math.round(ms) + ' ms'], ['IN RIO', rio === 'ok' ? 'applied' : rio === 'recv' ? 'received' : '…', 'dim'], ['IN RECIFE', rec === 'ok' ? 'applied' : rec === 'recv' ? 'received' : '…', 'dim']];
          o.res = rec === 'ok' ? [['all three copies have 1055', 'acc']] : []; } },
      { id: 'perto', dur: 5, title: 'Lena reads from Recife in ~2 ms', yk: 'READ CLOSE BY',
        code: ["SELECT id, total FROM pedidos", " WHERE cliente_id = 'lena-77'", " ORDER BY id DESC LIMIT 1;", '-- on pg-recife: ~2 ms', '-- on pg-sp: + 80 ms round trip'],
        story: 'Lena opens "my orders". The read goes to the Recife replica, in the same city: about <b>2 ms</b>, instead of paying an <b>80 ms</b> round trip to SP. The replicas also share the reads: the primary keeps the writes.',
        look: 'Light runs on the short cable between Recife and the phone. Lena\'s screen shows 1055, 34.90.',
        key: 'A replica close to the reader trades 80 ms for 2 ms.',
        f(o, t) { lit(o, 'rec', 'lena'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok'); o.rows.rec.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'REPLICA', ['serves Lena', 'acc'], ['read in ~2 ms', 'dim']); o.rows.rec.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['my orders', 'dim'], ['1055 · 34.90', 'acc'], ['1054 · 20:08', 'dim']);
          o.beams.push({ pts: CAB.lena, on: true, flow: true });
          o.cnt = [['READ IN RECIFE', '~2 ms'], ['IF IT WERE SP', '80 ms', 'dim'], ['ON SCREEN', '1055', 'dim']];
          o.res = [['read close by: 2 ms', 'acc']]; } },
      { id: 'so-le', dur: 6, title: 'The replica only reads: the INSERT fails', yk: 'ON pg-recife (PORT 55434)',
        code: ["INSERT INTO pedidos … ;", 'ERROR:  cannot execute INSERT', '        in a read-only transaction', 'SHOW transaction_read_only;  -- on', 'SELECT pg_is_in_recovery();  -- t'],
        story: 'What if someone tries to write straight to the replica? In the SDLabs lab, an <code>INSERT INTO pedidos …</code> on port 55434 returns <code>ERROR: cannot execute INSERT in a read-only transaction</code>. The replica is in recovery (<code>pg_is_in_recovery()</code> = <code>t</code>): it only applies the log that comes from the primary.',
        look: 'The Recife cabinet turns red and the balloon shows the error. The tape stays the same.',
        key: 'In Primary/Replica only the primary writes.',
        f(o, t) { o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok'); const err = t > 1;
          o.rows.rec = act('pg-recife', 'REPLICA', ['INSERT INTO pedidos …', 'hi'], err ? ['ERROR: read-only', 'bad'] : null, err ? ['transaction_read_only = on', 'dim'] : null); o.rows.rec.tape = W55('ok');
          o.on.rec = err ? 'bad' : 1;
          o.cnt = [['INSERT ON REPLICA', err ? 'refused' : '…', err ? 'bad' : ''], ['read_only', 'on', 'dim'], ['in_recovery', 't', 'dim']];
          o.res = err ? [['cannot execute INSERT in a', 'bad'], ['read-only transaction', 'bad']] : [];
          if (err) T(o, [650, 262, 52], 'ERROR: read-only', 'bad'); } },
      { id: 'erro', dur: 7, title: 'If it goes wrong: a replica is not a backup', yk: 'AT 20:15, ON THE PRIMARY',
        code: ["DELETE FROM pedidos WHERE status = 'criado';", '-- without looking at the WHERE', 'the WAL carries the DELETE to Rio and Recife', 'in 60 ms (Recife\'s normal lag)', 'three copies of the mistake'],
        story: 'At 20:15 someone runs <code>DELETE FROM pedidos WHERE status = \'criado\'</code> without looking at the <code>WHERE</code>. The primary deletes, the log carries the delete over the same cables and within <b>60 ms</b> (Recife\'s normal lag) all three copies are missing the orders. Going back to a point in time takes a backup, the subject of module 27.',
        look: 'The red DELETE cell enters SP\'s tape and travels over both cables to the replicas, which turn red.',
        key: 'Replication copies the data and copies the mistake.',
        f(o, t) { const ms = lin(t, 0.8, 5.2, 0, 70), DEL = s => [['1054', 'ok'], ['1055', 'ok'], ['DELETE', s]];
          const rio = tapeAt(ms, 5, 15), rec = tapeAt(ms, 40, 60), bad = s => s === 'ok' ? 'bad' : s;
          o.on.sp = 'bad'; o.rows.sp = act('pg-sp', 'PRIMARY', ['DELETE … status = criado', 'bad'], ['orders deleted', 'bad']); o.rows.sp.tape = DEL('bad');
          o.rows.rio = act('pg-rio', 'REPLICA', ['Rio · read-only', 'dim'], rio === 'ok' ? ['deleted too', 'bad'] : null); o.rows.rio.tape = DEL(bad(rio));
          o.rows.rec = act('pg-recife', 'REPLICA', ['Recife · read-only', 'dim'], rec === 'ok' ? ['deleted too', 'bad'] : null); o.rows.rec.tape = DEL(bad(rec));
          if (rio === 'ok') o.on.rio = 'bad'; if (rec === 'ok') o.on.rec = 'bad';
          o.beams = [{ pts: CAB.rio, on: ms < 5, tone: 'bad' }, { pts: CAB.rec, on: ms < 40, tone: 'bad' }];
          pk(o, CAB.rio, travel(ms, 0, 5), 'DELETE', 'bad'); pk(o, CAB.rec, travel(ms, 0, 40), 'DELETE', 'bad');
          const n = 1 + (rio === 'ok') + (rec === 'ok');
          o.cnt = [['COPIES OF THE MISTAKE', String(n), 'bad'], ['AFTER THE DELETE', '+' + Math.round(ms) + ' ms', 'dim'], ['BACKUP', 'module 27', 'dim']];
          o.res = n === 3 ? [['all three copies without the orders', 'bad']] : [];
          if (n === 3) T(o, TF(650), 'a replica is not a backup', 'bad'); } },
    ],
    queda: [
      { id: 'bf', dur: 6, title: 'Black Friday: Rio 300 ms behind, Recife 800 ms', yk: 'WHAT HAS NOT ARRIVED YET',
        code: ['30 orders/s · asynchronous replication', 'Rio    300 ms behind: 30 × 0.3 = 9', 'Recife 800 ms behind: 30 × 0.8 = 24', 'confirmed in SP, not yet', 'applied on the replica'],
        story: 'On Black Friday <b>30 orders per second</b> arrive, and replication is asynchronous: SP confirms and sends the log afterwards. Applying gets slower than generating, and the replicas fall behind: Rio by <b>300 ms</b>, Recife by <b>800 ms</b>. In that lag fit 30 × 0.3 = <b>9</b> orders in Rio and 30 × 0.8 = <b>24</b> in Recife.',
        look: 'Each cell of the tape is 100 ms of log. On Rio\'s tape, the last 3 are outlined (received and not applied); on Recife\'s, 8.',
        key: 'With asynchronous replication, the replica is always a little behind the primary.',
        f(o, t) { lit(o, 'sp'); o.rows.sp = act('pg-sp', 'PRIMARY', ['30 orders/s', 'acc'], ['commit in 2 ms', 'dim']); o.rows.sp.tape = BF(0);
          o.rows.rio = act('pg-rio', 'REPLICA', ['300 ms behind', 'acc'], ['= 9 orders', 'dim']); o.rows.rio.tape = BF(3);
          o.rows.rec = act('pg-recife', 'REPLICA', ['800 ms behind', 'acc'], ['= 24 orders', 'dim']); o.rows.rec.tape = BF(8);
          o.beams = [{ pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }];
          o.cnt = [['RATE', '30 orders/s'], ['BEHIND IN RIO', '9 orders', 'dim'], ['BEHIND IN RECIFE', '24 orders', 'dim']];
          o.res = [['the lag is the loss window', 'acc']]; } },
      { id: 'cai', dur: 6, title: 'SP goes dark: 9 orders never reached Rio, 24 Recife', yk: 'THE PRIMARY STOPS',
        code: ['pg_ctl -D primary -m immediate stop', 'Rio:    what was in the 300 ms is missing → 9', 'Recife: what was in the 800 ms is missing → 24', 'RPO (asynchronous) = rate × lag', 'normal day: 5/s × 0.06 s ≈ 0.3'],
        story: 'The SP primary suddenly goes down. What was already applied on the replicas is safe. What was in the lag is gone: if Rio is promoted, <b>9 orders</b> that the store confirmed cease to exist; if it were Recife, <b>24</b>. On a normal day the same math gives 0.3, practically zero.',
        look: 'SP turns red and the cables go dark. The outlined cells turn red: those are the lost orders.',
        key: 'RPO is how much data is lost: in asynchronous, rate × lag.',
        f(o, t) { const down = t > 0.6; o.on.sp = down ? 'bad' : 1;
          o.rows.sp = act('pg-sp', down ? 'DOWN' : 'PRIMARY', [down ? 'stopped (-m immediate)' : '30 orders/s', down ? 'bad' : 'acc']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', 'REPLICA', [down ? 'lost 9 orders' : '300 ms behind', down ? 'bad' : 'acc']); o.rows.rio.tape = BF(3, down ? 'bad' : 'recv');
          o.rows.rec = act('pg-recife', 'REPLICA', [down ? 'lost 24 orders' : '800 ms behind', down ? 'bad' : 'acc']); o.rows.rec.tape = BF(8, down ? 'bad' : 'recv');
          o.beams = [{ pts: CAB.rio, tone: down ? 'bad' : '', on: !down, flow: true }, { pts: CAB.rec, tone: down ? 'bad' : '', on: !down, flow: true }];
          o.cnt = [['LOST IF RIO', down ? '9' : '…', 'bad'], ['IF RECIFE', down ? '24' : '…', 'bad'], ['PRIMARY', down ? 'none' : 'SP', down ? 'bad' : 'dim']];
          o.res = down ? [['9 (Rio) or 24 (Recife) orders', 'bad'], ['confirmed and lost', 'bad']] : [];
          if (down) T(o, TF(175), 'SP is down', 'bad'); } },
      { id: 'eleicao', dur: 8, title: 'Who becomes leader: Rio, furthest ahead in the log', yk: 'THE ELECTION',
        code: ['Patroni: ttl 30 s without renewing → failover', 'candidates: Rio (300 ms), Recife (800 ms)', 'Raft: vote only for an equal or newer log', 'timeout drawn between 150 and 300 ms', 'quorum: 2 of 3 → Rio'],
        story: 'Nobody promotes the replica at the instant of the outage. Patroni waits for the leader to stop renewing the key: the default is <code>ttl: 30</code> seconds. Then it picks the replica <b>furthest ahead in the log</b>: Rio, 300 ms behind, beats Recife, 800 ms behind. In Raft the rule is the same: the vote only goes to whoever has an equal or more up-to-date log, and the choice needs a quorum, <b>2 of 3</b>. Meanwhile, purchases keep arriving and have nowhere to be written.',
        look: 'The outage clock runs up to 30 s and the pile of purchases without a primary grows in front of SP. Recife sends its vote to Rio over the middle cable.',
        key: 'Promotion picks the replica with the log furthest ahead, with a quorum.',
        f(o, t) { const s = lin(t, 0.3, 5.3, 0, 30); o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'DOWN', ['not renewing the key', 'bad'], [`for ${Math.round(s)} s`, 'dim']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', 'CANDIDATE', ['log ahead: 300 ms', 'acc'], [s >= 30 ? 'votes: 2 of 3' : 'waiting for the ttl', s >= 30 ? 'acc' : 'dim']); o.rows.rio.tape = BF(3, 'bad');
          o.rows.rec = act('pg-recife', 'REPLICA', ['log behind: 800 ms', 'dim'], [s >= 30 ? 'votes for Rio' : 'waiting for the ttl', 'dim']); o.rows.rec.tape = BF(8, 'bad');
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: s >= 30 }];
          if (s >= 30) pk(o, rev(CAB.rr), (lt * 0.6) % 1, 'vote');
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 35 });
          o.cnt = [['WITHOUT A PRIMARY', `${Math.round(s)} s`, 'bad'], ['PURCHASES WITHOUT A PRIMARY', thou(30 * s), 'bad'], ['QUORUM', s >= 30 ? '2 of 3: Rio' : '…', 'dim']];
          o.res = s >= 30 ? [['Rio wins: log furthest ahead', 'acc']] : [['waiting for the 30 s ttl', 'dim']]; } },
      { id: 'promove', dur: 7, title: 'pg_ctl promote: Rio becomes primary, timeline 1 → 2', yk: 'THE PROMOTION',
        code: ['pg_ctl -D rio promote', 'SELECT pg_is_in_recovery();  -- f', "pg_controldata: Latest checkpoint's TimeLineID: 2", 'RTO = 30 s (ttl) + ~5 s = 35 s', '30 orders/s × 35 s = 1,050 attempts'],
        story: 'Rio is promoted: <code>pg_is_in_recovery()</code> becomes <code>f</code> and the <b>timeline</b> goes from 1 to <b>2</b>. With about 5 s to promote and reconnect, the store was <b>35 s</b> without a primary (the RTO): 30 × 35 = <b>1,050</b> purchase attempts. Recife starts following Rio. The old primary only comes back as a replica after a <code>pg_rewind</code>.',
        look: 'Rio lights up as the primary and the middle cable carries Rio\'s log to Recife. The pile stops at 1,050.',
        key: 'RTO is how long the store goes without writing; here, 35 s.',
        f(o, t) { const s = lin(t, 0.3, 2.8, 30, 35), up = s >= 35; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'DOWN', ['comes back only with pg_rewind', 'dim']); o.rows.sp.tape = BF(0, 'ok');
          o.rows.rio = act('pg-rio', up ? 'PRIMARY' : 'PROMOTING', [up ? 'reads and writes' : 'pg_ctl promote', 'acc'], [up ? 'timeline 2' : 'timeline 1', up ? 'acc' : 'dim']); o.rows.rio.tape = BF(3, 'bad');
          o.rows.rec = act('pg-recife', 'REPLICA', [up ? 'follows Rio' : 'waiting', 'dim'], ['timeline ' + (up ? 2 : 1), 'dim']); o.rows.rec.tape = BF(8, 'bad');
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: up, flow: true }];
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 35 });
          o.cnt = [['RTO', `${Math.round(s)} s`, up ? '' : 'bad'], ['ATTEMPTS', thou(30 * s), 'bad'], ['TIMELINE', up ? '1 → 2' : '1', 'dim']];
          o.res = up ? [['35 s and 1,050 purchases without a primary', 'bad']] : [];
          if (up) T(o, [650, 60, 46], 'timeline 2', 'acc'); } },
      { id: 'split', dur: 7, title: 'If it goes wrong: SP isolated, but alive', yk: 'SPLIT BRAIN',
        code: ['the SP cable fails; pg-sp stays alive', 'clients that reach SP write to SP', 'Rio was promoted and writes too', 'two primaries: two different 1056s', 'the same mug sold twice'],
        story: 'Now the primary <b>did not die</b>: only the SP cable failed. <code>pg-sp</code> keeps accepting writes from the clients that can still reach it, and on the other side Rio was promoted. That makes <b>two truths</b>: two primaries, two different orders 1056, the same mug sold twice. It is <i>split brain</i>.',
        look: 'The SP cables turn red and cut. The clients, in front, keep writing to SP, and Rio writes too: both cabinets show PRIMARY.',
        key: 'Split brain: two live primaries accepting writes.',
        f(o, t) { const two = t > 1; o.show.cli = 1; o.on.cli = 2; o.on.sp = 'bad'; o.on.rio = two ? 'bad' : 1;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['isolated, but alive', 'bad'], two ? ['writes 1056 (SP)', 'bad'] : null); o.rows.sp.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'bad' : 'none']];
          o.rows.rio = act('pg-rio', 'PRIMARY', ['promoted: writes', 'acc'], two ? ['writes 1056 (Rio)', 'bad'] : null); o.rows.rio.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'bad' : 'none']];
          o.rows.rec = act('pg-recife', 'REPLICA', ['follows Rio', 'dim']); o.rows.rec.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', two ? 'recv' : 'none']];
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: true, flow: true }, { pts: CAB.cli, on: true, flow: true }];
          o.cnt = [['PRIMARIES', two ? '2' : '…', 'bad'], ['ORDER 1056', two ? '2 different' : '…', 'bad'], ['SP CABLE', 'cut', 'bad']];
          o.res = two ? [['two truths: split brain', 'bad']] : [];
          if (two) { T(o, [425, 255, 40], 'cable cut', 'bad'); T(o, TF(650), 'two primaries', 'bad'); } } },
      { id: 'cerca', dur: 8, title: 'Containment: fencing and SyncRep', yk: 'HOW TO STOP TWO PRIMARIES',
        code: ['fencing: Patroni takes down the leader that', '  does not renew the key within 30 s', 'synchronous: with no ack from any replica,', '  the commit in SP waits:', '  wait_event = SyncRep'],
        story: 'There are two ways to contain it. The first is <b>fencing</b>: Patroni takes down the leader that does not renew the key within 30 s, and the isolated primary shuts itself down. The second is <b>synchronous replication</b>: with no ack from any replica, the commit in SP <b>waits</b> (<code>wait_event = SyncRep</code>), and the order is never confirmed to whoever can only reach SP.',
        look: 'The commit of the SP clients sits stopped in SyncRep; the fencing clock reaches 30 s and SP shuts down. One primary is left: Rio.',
        key: 'Fencing and synchronous replication stop the isolated primary from going on confirming.',
        f(o, t) { const s = lin(t, 0.6, 5, 0, 30), off = s >= 30; o.show.cli = 1; o.on.cli = off ? 0 : 2; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', off ? 'SHUT DOWN' : 'ISOLATED', [off ? 'fencing: taken down' : 'commit waiting', 'bad'], [off ? 'accepts no writes' : 'wait_event = SyncRep', 'dim']); o.rows.sp.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'recv']];
          o.rows.rio = act('pg-rio', 'PRIMARY', ['the only one that writes', 'acc']); o.rows.rio.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'ok']];
          o.rows.rec = act('pg-recife', 'REPLICA', ['follows Rio', 'dim']); o.rows.rec.tape = [['1054', 'ok'], ['1055', 'ok'], ['1056', 'ok']];
          o.rows.cli = act('CLIENTS', 'of SP', [off ? 'no primary in SP' : 'waiting for the commit', 'bad']);
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, tone: 'bad' }, { pts: CAB.rr, on: true, flow: true }, { pts: CAB.cli, on: !off, tone: 'bad' }];
          o.cnt = [['FENCING', `${Math.round(s)} of 30 s`, off ? '' : 'dim'], ['COMMIT IN SP', off ? 'none' : 'SyncRep', 'bad'], ['PRIMARIES', off ? '1: Rio' : '1 confirms', 'dim']];
          o.res = off ? [['a single primary: Rio', 'acc']] : [['SP does not confirm without an ack', 'acc']]; } },
    ],
    multi: [
      { id: 'dois', dur: 5, title: 'Primary/Primary: SP and Recife write', yk: 'TWO OWNERS',
        code: ['SP     accepts writes', 'Recife accepts writes', 'each passes them on to the other', 'no single point of failure', '… and with write conflict'],
        story: 'In Primary/Primary, SP and Recife accept writes, and each passes on to the other what it wrote. If one goes down, the other keeps writing: there is no single point of failure. Rio stays as SP\'s replica. The price shows up when both change the same data at the same time.',
        look: 'SP and Recife lit as primaries; light runs both ways on the cable between them.',
        key: 'Several writers trade the single point of failure for conflict.',
        f(o, t) { lit(o, 'sp', 'rec'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'PRIMARY', ['Recife · reads and writes', 'acc']); o.rows.rec.tape = W55('ok');
          o.beams = [{ pts: CAB.rio, on: true, flow: true }, { pts: CAB.rec, on: true, flow: true }, { pts: rev(CAB.rec), on: true, flow: true }];
          o.cnt = [['PRIMARIES', '2'], ['REPLICAS', '1 (Rio)', 'dim'], ['SINGLE POINT', 'none', 'dim']];
          o.res = [['two writers', 'acc']]; } },
      { id: 'endereco', dur: 7, title: 'Lena\'s address, written on both at the same time', yk: 'TWO WRITES',
        code: ['SP:     support agent → "Rua do Sol, 200"', '        timestamp 20:20:00.100', 'Recife: Lena in the app → "Rua da Aurora, 100"', '        really at 20:20:00.150', '        clock −120 ms: timestamp .030'],
        story: 'At 20:20 the SP support agent changes Lena\'s address to "Rua do Sol, 200", with timestamp <b>20:20:00.100</b>. At the same time, Lena changes it in the app, in Recife, to "Rua da Aurora, 100". Her write is the newest in reality (20:20:00.150), but Recife\'s clock is <b>120 ms behind</b> and stamps <b>20:20:00.030</b>.',
        look: 'Two writes cross the cable in opposite directions, each with its own timestamp.',
        key: 'Two writers can change the same record at the same time.',
        f(o, t) { lit(o, 'sp', 'rec'); const f = lin(t, 1, 5, 0, 1);
          o.rows.sp = act('pg-sp', 'PRIMARY', ['Rua do Sol, 200', 'acc'], ['timestamp .100', 'dim']); o.rows.sp.tape = [['v SP', 'ok'], ['v Rec', f >= 1 ? 'recv' : 'none']];
          o.rows.rec = act('pg-recife', 'PRIMARY', ['Rua da Aurora, 100', 'acc'], ['timestamp .030 (−120 ms)', 'bad']); o.rows.rec.tape = [['v Rec', 'ok'], ['v SP', f >= 1 ? 'recv' : 'none']];
          o.rows.lena = act('Lena', 'app', ['address', 'dim'], ['Rua da Aurora, 100', 'acc'], ['really at .150', 'dim']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          pk(o, CAB.rec, f, 'Rua do Sol · .100'); pk(o, rev(CAB.rec), f, 'Rua da Aurora · .030', 'bad');
          o.cnt = [['SP TIMESTAMP', '.100'], ['RECIFE TIMESTAMP', '.030', 'bad'], ['IN REALITY', '.150 (Recife)', 'dim']];
          o.res = f >= 1 ? [['each side received the other\'s', 'acc']] : []; } },
      { id: 'lww', dur: 6, title: 'LWW: timestamp .100 beats .030', yk: 'LAST WRITE WINS',
        code: ['highest timestamp wins:', '  .100 (SP) > .030 (Recife)', '→ "Rua do Sol, 200" on both', 'the newest write (.150) was lost', 'LWW depends on a clock'],
        story: 'With <i>last write wins</i> (LWW), each site keeps the highest timestamp. Both end up at "Rua do Sol, 200": they converged. But the newest write in reality was Lena\'s, and it vanished with no error. LWW depends on the clock, and a clock 120 ms behind decided the delivery address.',
        look: 'Both cabinets show Rua do Sol, 200. Lena\'s write turns red.',
        key: 'LWW converges, but loses writes and depends on a clock.',
        f(o, t) { lit(o, 'sp'); o.on.rec = t > 1 ? 1 : 0; const done = t > 1;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['Rua do Sol, 200', 'acc'], ['.100 > .030: stays', 'dim']); o.rows.sp.tape = [['v SP', 'ok'], ['v Rec', 'bad']];
          o.rows.rec = act('pg-recife', 'PRIMARY', [done ? 'Rua do Sol, 200' : 'Rua da Aurora, 100', done ? 'acc' : 'hi'], [done ? 'Lena\'s write lost' : 'comparing…', done ? 'bad' : 'dim']); o.rows.rec.tape = [['v Rec', done ? 'bad' : 'ok'], ['v SP', done ? 'ok' : 'recv']];
          o.rows.lena = act('Lena', 'app', ['address', 'dim'], [done ? 'Rua do Sol, 200' : 'Rua da Aurora, 100', done ? 'bad' : 'acc']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          o.cnt = [['WON', 'Rua do Sol, 200'], ['LOST', 'Rua da Aurora, 100', 'bad'], ['RECIFE CLOCK', '−120 ms', 'bad']];
          o.res = done ? [['converged and lost Lena\'s write', 'bad']] : [];
          if (done) T(o, TF(650), 'lost the newest write', 'bad'); } },
      { id: 'vetor', dur: 6, title: 'Version vector: the writes are concurrent', yk: 'NEITHER DOMINATES',
        code: ['SP:     {SP:2, Rec:0}', 'Recife: {SP:1, Rec:1}', 'SP 2 > 1, but Rec 0 < 1', '→ neither vector dominates the other', '→ concurrent: the application decides'],
        story: 'A <b>version vector</b> keeps one counter per site. SP\'s write carries <code>{SP:2, Rec:0}</code>; Recife\'s, <code>{SP:1, Rec:1}</code>. SP is ahead on one field and behind on the other: neither vector dominates, so the writes are <b>concurrent</b>. The database keeps both and the application decides, with no clock.',
        look: 'Both cabinets keep both versions, outlined, waiting for a decision.',
        key: 'The version vector detects the concurrency that the clock hides.',
        f(o, t) { lit(o, 'sp', 'rec'); const dt = t > 1.2;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['{SP:2, Rec:0}', 'acc'], [dt ? 'concurrent' : 'comparing…', dt ? 'acc' : 'dim']); o.rows.sp.tape = [['v SP', 'recv'], ['v Rec', 'recv']];
          o.rows.rec = act('pg-recife', 'PRIMARY', ['{SP:1, Rec:1}', 'acc'], [dt ? 'concurrent' : 'comparing…', dt ? 'acc' : 'dim']); o.rows.rec.tape = [['v Rec', 'recv'], ['v SP', 'recv']];
          o.rows.lena = act('Lena', 'app', ['address', 'dim'], ['which of the two?', 'acc']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true }, { pts: CAB.lena, on: true }];
          o.cnt = [['SP', '{SP:2, Rec:0}'], ['RECIFE', '{SP:1, Rec:1}', 'dim'], ['RESULT', dt ? 'concurrent' : '…', 'dim']];
          o.res = dt ? [['detected: the application decides', 'acc']] : []; } },
      { id: 'colisao', dur: 7, title: 'If it goes wrong: both create order 1056', yk: 'THE PRIMARY KEY COLLIDES',
        code: ['SP:     next free number → 1056', 'Recife: next free number → 1056', 'when passed on: the primary key collides', 'ways out: SP odd, Recife even', '        or UUID / ULID'],
        story: 'Each site creates a "new" order without talking to the other, and both take the next free number: <b>1056</b>. When one passes it on to the other, the primary key collides. (The collision is hypothetical: 1056 is not an order in the story.) Ways out: interleaved ranges, with SP using the odd numbers and Recife the even ones, or ids that need no coordination, such as UUID and ULID.',
        look: 'Both 1056s cross the cable and turn red on arrival.',
        key: 'With two writers, even the order number needs a rule.',
        f(o, t) { const f = lin(t, 0.8, 4, 0, 1), hit = f >= 1; o.on.sp = hit ? 'bad' : 1; o.on.rec = hit ? 'bad' : 1;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['creates 1056', 'acc'], hit ? ['1056 already exists', 'bad'] : null); o.rows.sp.tape = [['1055', 'ok'], ['1056', hit ? 'bad' : 'ok']];
          o.rows.rec = act('pg-recife', 'PRIMARY', ['creates 1056', 'acc'], hit ? ['1056 already exists', 'bad'] : null); o.rows.rec.tape = [['1055', 'ok'], ['1056', hit ? 'bad' : 'ok']];
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: true, tone: hit ? 'bad' : '' }];
          pk(o, CAB.rec, f, '1056 (SP)'); pk(o, rev(CAB.rec), f, '1056 (Recife)');
          o.cnt = [['ORDER 1056', hit ? '2 versions' : '…', 'bad'], ['PRIMARY KEY', hit ? 'collides' : '…', 'bad'], ['WAY OUT', 'odd/even or UUID', 'dim']];
          o.res = hit ? [['two 1056s: the key collides', 'bad']] : [];
          if (hit) T(o, [425, 320, 44], 'primary key collides', 'bad'); } },
    ],
    lag: [
      { id: 'pausa', dur: 5, title: 'Recife 800 ms behind: pause the replay', yk: 'IN THE LAB, ON RECIFE', act: ['pause', 'Pause replay in Recife'],
        code: ['-- Black Friday: Recife 800 ms behind', '-- in the lab, the same effect:', 'SELECT pg_wal_replay_pause();', '-- receives the WAL and does not apply it'],
        story: 'On Black Friday, Recife falls <b>800 ms</b> behind the primary: the WAL arrives in 40 ms, but applying is slower than generating. In the SDLabs lab the same effect is forced by hand: <code>pg_wal_replay_pause()</code> on the Recife replica. It keeps <b>receiving</b> the log and stops <b>applying</b>. Press the button and step forward.',
        look: 'The Recife cabinet shows the replay applying; with the button, it switches to PAUSED.',
        key: 'Receiving the log and applying the log are two different stages.',
        f(o, t) { lit(o, 'sp'); o.rows.sp.tape = W55('none');
          o.rows.rec = act('pg-recife', 'REPLICA', ['Recife · read-only', 'dim'], [paused ? 'replay: PAUSED' : 'replay: applying', paused ? 'bad' : 'dim']); o.rows.rec.tape = W55('none');
          if (paused) o.on.rec = 'bad';
          o.cnt = [['REPLAY IN RECIFE', paused ? 'paused' : 'applying', paused ? 'bad' : ''], ['LAG (BLACK FRIDAY)', '800 ms', 'dim'], ['WAL TRAVEL', '40 ms', 'dim']];
          o.res = paused ? [['pg_wal_replay_pause(): receives, does not apply', 'acc']] : [['press the button in the panel', 'dim']]; } },
      { id: 'commit', dur: 6, title: '20:10:00.002: SP confirms 1055', yk: 'THE COMMIT TOKEN',
        code: ['-- on the primary, when confirming 1055', 'SELECT pg_current_wal_lsn();  -- 0/8004430', 'commit at .002 (asynchronous: 2 ms)', 'the WAL reaches Recife at .042'],
        story: 'At 20:10:00.000 Lena closes order 1055 and the primary confirms at <b>.002</b>. The commit\'s position in the log, <code>0/8004430</code>, is that order\'s <b>token</b>. The record leaves over the cables and reaches Recife at .042, but nobody applies it there.',
        look: '1055 lights up on SP\'s tape. In Recife it arrives and stays outlined: received, not applied.',
        key: 'The commit\'s LSN says exactly how far the replica needs to have applied.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 0, 60); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 · 34.90', 'acc'], [ms >= 2 ? 'commit at .002' : 'writing…', ms >= 2 ? 'acc' : 'dim'], ms >= 2 ? ['LSN 0/8004430', 'dim'] : null); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          const rio = ms < 7 ? 'none' : 'recv', rec = ms < 42 ? 'none' : 'recv';
          o.rows.rio = act('pg-rio', 'REPLICA', ['300 ms behind', 'dim']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'REPLICA', [rec === 'recv' ? 'received 1055' : 'Recife · read-only', 'dim'], [paused ? 'replay: PAUSED' : '800 ms behind', 'bad']); o.rows.rec.tape = W55(rec); o.on.rec = 'bad';
          o.beams = [{ pts: CAB.rio, on: ms < 7 }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['CLOCK', hms(ms)], ['TOKEN', '0/8004430', 'dim'], ['RECIFE', rec === 'recv' ? 'received' : '…', 'dim']];
          o.res = ms >= 2 ? [['Lena already got the "done"', 'acc']] : []; } },
      { id: 'lena', dur: 6, title: '20:10:00.300: Lena does not see 1055', yk: 'MY ORDERS, READ FROM RECIFE',
        code: ["SELECT id, total FROM pedidos", " WHERE cliente_id = 'lena-77'", ' ORDER BY id DESC;', '-- in Recife: 1054 is the last', '-- 1055 does not show up'],
        story: 'At <b>20:10:00.300</b> Lena taps "my orders". The screen reads from the Recife replica, which has not applied 1055 yet, and shows <b>1054</b> (the one from 20:08) as the last order. She just paid and the order is not there. On Black Friday, without a pause, it would only show up at 20:10:00.802. The technical name for what is missing is <i>read-your-writes</i> (Vogels).',
        look: 'The read runs from Recife to the phone, and the screen shows 1054. 1055 stays outlined on Recife\'s tape.',
        key: 'With the replica behind, whoever writes may not see what they just wrote.',
        f(o, t) { lit(o, 'sp', 'lena'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv'); o.on.rec = 'bad';
          o.rows.rio = act('pg-rio', 'REPLICA', ['300 ms behind', 'dim']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'REPLICA', ['1055 received', 'dim'], ['1055 not applied', 'bad']); o.rows.rec.tape = W55('recv');
          const read = t > 1;
          o.rows.lena = act('Lena', 'app', ['my orders', 'dim'], [read ? '1054 · 20:08' : 'loading…', read ? 'hi' : 'dim'], read ? ['where is 1055?', 'bad'] : null);
          o.beams.push({ pts: CAB.lena, on: true, flow: true });
          o.cnt = [['CLOCK', '20:10:00.300'], ['LAST ON SCREEN', read ? '1054' : '…', 'bad'], ['SHOWS UP AT', paused ? 'resume the replay' : '.802', 'dim']];
          o.res = read ? [['1055 does not show up', 'bad']] : [];
          if (read) T(o, [842, 270, 30], '1055?', 'bad'); } },
      { id: 'prova', dur: 6, title: 'The proof: received, but not applied', yk: 'ON THE RECIFE REPLICA',
        code: ['SELECT pg_last_wal_receive_lsn();  -- 0/8004430', 'SELECT pg_last_wal_replay_lsn();   -- 0/8000060', "SELECT pg_last_wal_replay_lsn()", "       >= '0/8004430'::pg_lsn;     -- f"],
        story: 'The lag can be proven with two numbers. In Recife, the last <b>received</b> LSN is <code>0/8004430</code>, the token of 1055. The last <b>applied</b> is <code>0/8000060</code>, behind. The comparison <code>replay_lsn &gt;= token</code> returns <code>f</code>: the application <b>knows</b> the replica has not caught up with the commit and sends the read to the primary.',
        look: 'On Recife\'s face, the two marks: received and applied. The balloon shows the f.',
        key: 'Comparing the applied LSN with the token says whether the replica already has the order.',
        f(o, t) { lit(o, 'sp'); o.on.rec = 'bad'; o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'REPLICA', ['received 0/8004430', 'acc'], ['applied 0/8000060', 'bad'], [t > 1.5 ? 'replay >= token: f' : '', 'bad']); o.rows.rec.tape = W55('recv');
          o.cnt = [['RECEIVED', '0/8004430'], ['APPLIED', '0/8000060', 'bad'], ['replay >= token', t > 1.5 ? 'f' : '…', 'bad']];
          o.res = t > 1.5 ? [['f: the read goes to the primary', 'acc']] : [];
          if (t > 1.5) T(o, [650, 262, 52], "replay >= '0/8004430': f", 'bad'); } },
      { id: 'consertos', dur: 9, title: 'Three fixes: primary, token, remote_apply', yk: 'WHAT EACH ONE COSTS',
        code: ['(a) read from the primary for N s: +80 ms', '(b) token: replay_lsn >= 0/8004430?', '    f → reads from the primary; t → Recife', '(c) remote_apply: the commit waits for', '    Recife to apply: ~82 ms per commit'],
        story: 'Three ways for Lena to see her own order. (a) After writing, her reads go to the primary for a few seconds: it costs the <b>80 ms</b> round trip to SP. (b) The application keeps the <b>token</b> and only reads from Recife once <code>replay_lsn &gt;= token</code>; otherwise, it goes to the primary. (c) <code>remote_apply</code> just on that commit: it waits for Recife to apply, about <b>82 ms</b> on a normal day, and more with Recife 800 ms behind.',
        look: 'Lena\'s read crosses the Recife cable to SP and comes back with 1055. The screen shows the order.',
        key: 'Read-your-writes is fixed by reading from the primary, carrying the token or waiting for the replica to apply.',
        f(o, t) { lit(o, 'sp', 'lena'); o.on.rec = 'bad'; o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('recv');
          const k = t < 3 ? 0 : t < 6 ? 1 : 2, got = k < 2 && (t % 3) > 1.6;
          o.rows.rec = act('pg-recife', 'REPLICA', ['applied 0/8000060', 'bad'], [k === 1 ? 'token: f → SP' : 'behind the token', 'dim']); o.rows.rec.tape = W55('recv');
          o.rows.sp = act('pg-sp', 'PRIMARY', [k === 2 ? 'commit with remote_apply' : 'serves the read', 'acc'], [k === 2 ? 'waits for Recife to apply' : '+80 ms', 'dim']); o.rows.sp.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['my orders', 'dim'], [k === 2 ? 'commit: ~82 ms' : got ? '1055 · 34.90' : 'reading from SP…', k === 2 || got ? 'acc' : 'dim']);
          o.beams.push({ pts: CAB.lena, on: true }); o.beams[1] = { pts: CAB.rec, on: true };
          if (k < 2) pk(o, got ? rev(LENA_SP) : LENA_SP, ((t % 3) / 1.6) % 1, got ? '1055' : 'read', 'acc');
          else pk(o, CAB.rec, ((t - 6) / 1.5) % 1, 'remote_apply');
          o.cnt = [['(a) PRIMARY', '+80 ms', k === 0 ? '' : 'dim'], ['(b) TOKEN', 'f → SP', k === 1 ? '' : 'dim'], ['(c) remote_apply', '~82 ms/commit', k === 2 ? '' : 'dim']];
          o.res = [[['(a) read from the primary for N seconds', '(b) carry the commit token', '(c) remote_apply just on that commit'][k], 'acc']]; } },
      { id: 'errado', dur: 8, title: 'If it goes wrong: Recife never reaches the token', yk: 'THE TOKEN ALWAYS BEHIND', act: ['pause', ''],
        code: ['replay_lsn >= token  -- f, f, f…', 'every read after buying goes to SP', '+80 ms each, on the primary that', 'already takes all the writes', 'SELECT pg_wal_replay_resume();'],
        story: 'If Recife never catches up, the comparison gives <code>f</code> all the time, and every read from someone who just bought goes to the primary: <b>+80 ms</b> each, on the server that already takes all the Black Friday writes. The token protects Lena from seeing the past, and the cost lands on SP. When Recife starts applying again (<code>pg_wal_replay_resume()</code>, or on Black Friday at 20:10:00.802), 1055 shows up there.',
        look: 'The reads run from Recife to SP one after another. Resume the replay in the panel: 1055 lights up in Recife and the read goes back close by.',
        key: 'The token stops Lena from seeing the past, but sends the bill to the primary.',
        f(o, t) { lit(o, 'sp'); o.rows.sp.tape = W55('ok'); o.rows.rio.tape = W55('ok');
          const ok = !paused && t > 2.5;
          o.rows.rio = act('pg-rio', 'REPLICA', ['1055 applied', 'dim']); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'REPLICA', [ok ? '1055 applied' : paused ? 'replay: PAUSED' : '800 ms behind', ok ? 'acc' : 'bad'], [ok ? 'replay >= token: t' : 'replay >= token: f', ok ? 'acc' : 'bad']); o.rows.rec.tape = W55(ok ? 'ok' : 'recv');
          o.on.rec = ok ? 1 : 'bad'; o.on.lena = 1;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['all the writes', 'acc'], [ok ? 'reads go back to Recife' : '+ the post-purchase reads', ok ? 'dim' : 'bad']); o.rows.sp.tape = W55('ok');
          o.rows.lena = act('Lena', 'app', ['my orders', 'dim'], ['1055 · 34.90', 'acc'], [ok ? 'from Recife: ~2 ms' : 'from SP: +80 ms', ok ? 'dim' : 'bad']);
          o.beams.push({ pts: CAB.lena, on: true, flow: ok }); o.beams[1] = { pts: CAB.rec, on: !ok, tone: ok ? '' : 'bad' };
          if (!ok) { pk(o, LENA_SP, (t * 0.7) % 1, 'read', 'bad'); pk(o, LENA_SP, (t * 0.7 + 0.5) % 1, '', 'bad'); }
          o.cnt = [['replay >= token', ok ? 't' : 'f', ok ? '' : 'bad'], ['EACH READ', ok ? '~2 ms' : '+80 ms', ok ? 'dim' : 'bad'], ['REPLAY', paused ? 'paused' : 'applying', 'dim']];
          o.res = ok ? [['1055 arrived: the read goes back to Recife', 'acc']] : [['post-purchase reads weigh on SP', 'bad']];
          if (!ok) T(o, TF(425), 'f → SP: +80 ms per read', 'bad'); } },
    ],
    assincrona: [
      { id: 'pronto', dur: 6, title: 'Asynchronous: done in 2 ms', yk: 'LOCAL DISK ONLY',
        code: ["synchronous_standby_names = ''", 'commit = 2 ms (SP\'s disk only)', '1 s ÷ 2 ms = 500 commits/s per connection', 'the WAL leaves after the "done"'],
        story: 'In asynchronous replication the primary writes 1055 to its own disk (<b>2 ms</b>), answers "done" to Lena and only then sends the log to the replicas. A connection that only does commits gets <b>500 per second</b>. No replica ack enters the math.',
        look: '1055 lights up in SP and the "done" goes out to Lena before any light enters the cables.',
        key: 'Asynchronous: the commit does not wait for any replica.',
        f(o, t) { const ms = lin(t, 0.6, 3.6, 0, 3); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 · local commit', 'acc'], [ms >= 2 ? 'done in 2 ms' : 'writing…', ms >= 2 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          if (ms >= 2) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['order 1055', 'dim'], ['confirmed', 'acc'], ['in 2 ms', 'dim']); }
          o.cnt = [['COMMIT', ms >= 2 ? '2 ms' : '…'], ['COMMITS/S', '500 per connection', 'dim'], ['ACKS AWAITED', '0', 'dim']];
          o.res = ms >= 2 ? [['done: 2 ms', 'acc']] : [];
          if (ms >= 2) T(o, [175, 240, 58], 'done: 2 ms'); } },
      { id: 'depois', dur: 7, title: 'The tapes arrive later', yk: 'THE WINDOW',
        code: ['Rio:    arrives in 5 ms, 300 ms behind', 'Recife: arrives in 40 ms, 800 ms behind', '(Black Friday: applying is slower)', 'until applied, 1055 only exists in SP'],
        story: 'After the "done", the log leaves over the cables: it reaches Rio in 5 ms and Recife in 40 ms. On Black Friday applying is slower than generating, and the replicas fall <b>300 ms</b> (Rio) and <b>800 ms</b> (Recife) behind. Until the replicas apply, the confirmed 1055 only exists applied in SP.',
        look: 'The records run over the cables after the commit. On the replicas 1055 arrives outlined and waits its turn.',
        key: 'The price of asynchronous is the window between the "done" and the copy.',
        f(o, t) { const ms = lin(t, 0.4, 4.4, 2, 60); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 confirmed', 'acc'], ['sends the WAL afterwards', 'dim']); o.rows.sp.tape = W55('ok');
          const rio = ms < 7 ? 'none' : 'recv', rec = ms < 42 ? 'none' : 'recv';
          o.rows.rio = act('pg-rio', 'REPLICA', ['300 ms behind', 'acc']); o.rows.rio.tape = W55(rio);
          o.rows.rec = act('pg-recife', 'REPLICA', ['800 ms behind', 'acc']); o.rows.rec.tape = W55(rec);
          o.beams = [{ pts: CAB.rio, on: ms < 7 }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['CLOCK', hms(ms)], ['APPLIED IN RIO', '.302', 'dim'], ['IN RECIFE', '.802', 'dim']];
          o.res = [['confirmed, not copied yet', 'acc']]; } },
      { id: 'errado', dur: 7, title: 'If it goes wrong: SP goes down inside the window', yk: 'ASYNCHRONOUS RPO',
        code: ['30 orders/s on Black Friday', 'Rio:    30 × 0.3 = 9 orders lost', 'Recife: 30 × 0.8 = 24 orders lost', 'confirmed to the customer, and lost'],
        story: 'If SP goes down inside that window, what did not reach the replicas is gone. At 30 orders per second: <b>9</b> orders if Rio is promoted and <b>24</b> if it were Recife. Each of them got a "done" in 2 ms.',
        look: 'SP turns red; the cells that were on their way turn red on the replicas.',
        key: 'Asynchronous: fast commit, possible loss.',
        f(o, t) { const down = t > 0.8; o.on.sp = down ? 'bad' : 1;
          o.rows.sp = act('pg-sp', down ? 'DOWN' : 'PRIMARY', [down ? 'went down' : '30 orders/s', down ? 'bad' : 'acc']); o.rows.sp.tape = BF(0);
          o.rows.rio = act('pg-rio', 'REPLICA', [down ? 'lost 9' : '300 ms behind', down ? 'bad' : 'acc']); o.rows.rio.tape = BF(3, down ? 'bad' : 'recv');
          o.rows.rec = act('pg-recife', 'REPLICA', [down ? 'lost 24' : '800 ms behind', down ? 'bad' : 'acc']); o.rows.rec.tape = BF(8, down ? 'bad' : 'recv');
          o.beams = [{ pts: CAB.rio, on: !down, flow: true, tone: down ? 'bad' : '' }, { pts: CAB.rec, on: !down, flow: true, tone: down ? 'bad' : '' }];
          o.cnt = [['LOST (RIO)', down ? '9' : '…', 'bad'], ['LOST (RECIFE)', down ? '24' : '…', 'bad'], ['COMMIT', '2 ms', 'dim']];
          o.res = down ? [['9 or 24 confirmed orders vanish', 'bad']] : []; } },
    ],
    semi: [
      { id: 'espera', dur: 7, title: 'Semi-synchronous: waits for Rio, 12 ms', yk: 'ONE ACK',
        code: ['synchronous_standby_names =', "  'FIRST 1 (rio, recife)'", 'commit = 2 + 10 = 12 ms', '1 s ÷ 12 ms = 83 commits/s', 'rio | sync · recife | potential'],
        story: 'In semi-synchronous the primary waits for <b>one</b> replica, the closest: Rio. The commit takes the local disk plus the round trip to Rio: 2 + 10 = <b>12 ms</b>, or 83 commits per second per connection. In PostgreSQL that is <code>FIRST 1 (rio, recife)</code>, and <code>pg_stat_replication</code> shows Rio as <code>sync</code> and Recife as <code>potential</code>.',
        look: 'The record goes to Rio, the ack comes back, and only then does the "done" go out to Lena.',
        key: 'Semi-synchronous: the commit waits for the ack of one replica.',
        f(o, t) { const ms = lin(t, 0.4, 5, 0, 16); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 · waits for Rio', 'acc'], [ms >= 12 ? 'done in 12 ms' : ms >= 7 ? 'ack coming back…' : 'WAL going to Rio…', ms >= 12 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'REPLICA · SYNC', [ms >= 7 ? 'wrote: sends the ack' : 'Rio · read-only', ms >= 7 ? 'acc' : 'dim']); o.rows.rio.tape = W55(ms >= 7 ? 'recv' : 'none'); if (ms >= 7) o.on.rio = 1;
          o.rows.rec = act('pg-recife', 'REPLICA · POTENTIAL', ['receives without waiting', 'dim']);
          if (ms >= 12) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['order 1055', 'dim'], ['confirmed', 'acc'], ['in 12 ms', 'dim']); }
          o.beams = [{ pts: CAB.rio, on: ms > 2 && ms < 12 }, { pts: CAB.rec }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL 1055'); pk(o, rev(CAB.rio), travel(ms, 7, 5), 'ack');
          o.cnt = [['COMMIT', ms >= 12 ? '12 ms' : `${Math.round(ms)} ms…`], ['COMMITS/S', '83 per connection', 'dim'], ['ACKS AWAITED', '1 (Rio)', 'dim']];
          o.res = ms >= 12 ? [['done: 2 + 10 = 12 ms', 'acc']] : []; } },
      { id: 'recife', dur: 6, title: 'Recife receives later, without waiting', yk: 'ZERO RPO WHILE RIO ANSWERS',
        code: ['the confirmed 1055 is already on Rio', 'Recife receives in 40 ms (asynchronous)', 'SP goes down now → promote Rio: loss 0', 'if Rio goes down, Recife becomes sync (82 ms)'],
        story: 'When Lena gets the "done", 1055 is already written on Rio. If SP goes down now, Rio is promoted and nothing is lost: zero RPO while Rio answers. Recife receives the log the asynchronous way, 40 ms later. If Rio goes down, Recife becomes <code>sync</code> and the commit goes to 82 ms.',
        look: 'Rio lights up with 1055; the record is still running over the long cable to Recife.',
        key: 'Semi-synchronous buys zero RPO with a short round trip.',
        f(o, t) { const ms = lin(t, 0.4, 4, 12, 60); lit(o, 'sp', 'rio');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 confirmed', 'acc'], ['in 12 ms', 'dim']); o.rows.sp.tape = W55('ok');
          o.rows.rio = act('pg-rio', 'REPLICA · SYNC', ['has 1055', 'acc'], ['RPO 0', 'acc']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'REPLICA · POTENTIAL', [ms >= 42 ? 'received 1055' : 'receives without waiting', 'dim']); o.rows.rec.tape = W55(ms >= 42 ? 'recv' : 'none');
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, on: ms < 42 }];
          pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055');
          o.cnt = [['RPO', '0 (Rio alive)'], ['RECIFE', ms >= 42 ? 'received' : 'on the way', 'dim'], ['COMMIT', '12 ms', 'dim']];
          o.res = [['zero loss if Rio answers', 'acc']]; } },
      { id: 'errado', dur: 9, title: 'If it goes wrong: Rio disappears and the guarantee goes with it', yk: 'MARIADB / MYSQL',
        code: ['Rio stops sending acks', 'rpl_semi_sync_master_timeout = 10000 ms', '10 s passed: "reverts to asynchronous"', 'no error: the store thinks it has RPO 0', 'PostgreSQL: waits (does not revert)'],
        story: 'In MariaDB and MySQL, semi-synchronous has a deadline. If Rio stops answering, the primary waits for <code>rpl_semi_sync_master_timeout</code>, <b>10,000 ms</b> by default, and then goes back to <b>asynchronous</b>, with no error. The store thinks it has zero RPO and has the loss window again. PostgreSQL does the opposite: with <code>FIRST 1 (rio, recife)</code> it starts waiting for Recife and, with no replica at all, waits forever.',
        look: 'Rio turns red. The clock counts to 10 s with the commits stopped; then the mode switches to asynchronous and the commits go back to 2 ms, with no copy.',
        key: 'MariaDB semi-synchronous trades the guarantee for availability without telling you.',
        f(o, t) { const s = lin(t, 0.6, 5.6, 0, 10), rev_ = s >= 10; o.on.rio = 'bad'; o.on.sp = rev_ ? 'bad' : 1;
          o.rows.sp = act('pg-sp', rev_ ? 'ASYNCHRONOUS' : 'SEMI-SYNC', [rev_ ? 'commit in 2 ms, no copy' : 'commit waiting for Rio', rev_ ? 'bad' : 'acc'], [rev_ ? 'no error' : `for ${dec(s)} s`, 'dim']); o.rows.sp.tape = W55(rev_ ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'DOWN', ['no ack', 'bad']); o.rows.rio.tape = W55('none');
          o.rows.rec = act('pg-recife', 'REPLICA', ['receives when it can', 'dim']);
          o.beams = [{ pts: CAB.rio, tone: 'bad' }, { pts: CAB.rec, on: rev_, flow: rev_ }];
          o.cnt = [['WAITING FOR THE ACK', `${dec(Math.min(s, 10))} s`, rev_ ? 'dim' : ''], ['MODE', rev_ ? 'asynchronous' : 'semi', rev_ ? 'bad' : 'dim'], ['ERROR', 'none', rev_ ? 'bad' : 'dim']];
          o.res = rev_ ? [['went back to asynchronous silently', 'bad']] : [];
          if (rev_) T(o, TF(425), 'reverts to asynchronous', 'bad'); } },
    ],
    sincrona: [
      { id: 'acks', dur: 7, title: 'Synchronous: waits for both acks, 82 ms', yk: 'TWO ACKS',
        code: ['synchronous_standby_names =', "  'FIRST 2 (rio, recife)'", 'commit = 2 + max(10, 80) = 82 ms', '1 s ÷ 82 ms = 12 commits/s', '(lab, no network: 8.1 ms with 1 replica)'],
        story: 'In synchronous mode the primary waits for the <b>ack</b> from Rio and from Recife. The commit takes the local disk plus the slowest replica: 2 + max(10, 80) = <b>82 ms</b>, or 12 commits per second per connection. In the lab, with no network, a commit with one synchronous replica on the same computer took 8.1 ms; the store\'s network adds to that.',
        look: 'Rio\'s ack comes back quickly; the "done" only goes out when Recife\'s crosses the long cable.',
        key: 'Synchronous: the commit waits for the slowest replica.',
        f(o, t) { const ms = lin(t, 0.4, 5.6, 0, 90); lit(o, 'sp');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 · waits for 2 acks', 'acc'], [ms >= 82 ? 'done in 82 ms' : `acks: ${(ms >= 12) + (ms >= 82)} of 2`, ms >= 82 ? 'acc' : 'dim']); o.rows.sp.tape = W55(ms >= 2 ? 'ok' : 'recv');
          o.rows.rio = act('pg-rio', 'REPLICA · SYNC', [ms >= 7 ? 'wrote: ack' : 'Rio · read-only', ms >= 7 ? 'acc' : 'dim']); o.rows.rio.tape = W55(ms >= 7 ? 'recv' : 'none'); if (ms >= 7) o.on.rio = 1;
          o.rows.rec = act('pg-recife', 'REPLICA · SYNC', [ms >= 42 ? 'wrote: ack' : 'Recife · read-only', ms >= 42 ? 'acc' : 'dim']); o.rows.rec.tape = W55(ms >= 42 ? 'recv' : 'none'); if (ms >= 42) o.on.rec = 1;
          if (ms >= 82) { o.on.lena = 1; o.rows.lena = act('Lena', 'app', ['order 1055', 'dim'], ['confirmed', 'acc'], ['in 82 ms', 'dim']); }
          o.beams = [{ pts: CAB.rio, on: ms > 2 && ms < 12 }, { pts: CAB.rec, on: ms > 2 && ms < 82 }];
          pk(o, CAB.rio, travel(ms, 2, 5), 'WAL'); pk(o, rev(CAB.rio), travel(ms, 7, 5), 'ack');
          pk(o, CAB.rec, travel(ms, 2, 40), 'WAL 1055'); pk(o, rev(CAB.rec), travel(ms, 42, 40), 'ack');
          o.cnt = [['COMMIT', ms >= 82 ? '82 ms' : `${Math.round(Math.min(ms, 82))} ms…`], ['COMMITS/S', '12 per connection', 'dim'], ['ACKS', `${(ms >= 12) + (ms >= 82)} of 2`, 'dim']];
          o.res = ms >= 82 ? [['done: 2 + max(10, 80) = 82 ms', 'acc']] : []; } },
      { id: 'rpo', dur: 6, title: 'Zero RPO: 1055 is already on all three copies', yk: 'WHAT THE WAIT BUYS',
        code: ['"done" only after both acks', 'SP goes down now → loss 0', 'on (default): the replica flushed to disk', 'remote_apply: the replica applied', '(only then does a read there see 1055)'],
        story: 'When Lena gets the "done", 1055 is already written on all three copies: if SP goes down now, nothing is lost. An up-to-date read is another matter: with the default level (<code>on</code>) the replica has <b>flushed</b> the log to disk; only with <code>remote_apply</code> has it <b>applied</b> it, and Lena sees the order reading from Recife.',
        look: 'The three tapes with 1055. In Recife it stays outlined until applied.',
        key: 'Synchronous gives zero RPO; an up-to-date read needs remote_apply.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec'); const ap = t > 2.5;
          o.rows.sp = act('pg-sp', 'PRIMARY', ['1055 on 3 copies', 'acc'], ['RPO 0', 'acc']); o.rows.sp.tape = W55('ok');
          o.rows.rio = act('pg-rio', 'REPLICA · SYNC', ['flushed to disk', 'dim']); o.rows.rio.tape = W55('ok');
          o.rows.rec = act('pg-recife', 'REPLICA · SYNC', ['flushed to disk', 'dim'], [ap ? 'applied: visible' : 'applying is another stage', ap ? 'acc' : 'dim']); o.rows.rec.tape = W55(ap ? 'ok' : 'recv');
          o.cnt = [['RPO', '0'], ['COPIES WITH 1055', '3', 'dim'], ['UP-TO-DATE READ', 'remote_apply', 'dim']];
          o.res = [['zero loss if SP goes down', 'acc']]; } },
      { id: 'errado', dur: 9, title: 'If it goes wrong: Recife goes down and the commit blocks', yk: 'pg_stat_activity',
        code: ['wait_event_type = IPC', 'wait_event      = SyncRep', '1055 is not visible to anyone', 'the store stops selling', "fix: synchronous_standby_names = ''"],
        story: 'Recife goes down. With both replicas required, the order\'s <code>INSERT</code> <b>sits waiting</b>: <code>pg_stat_activity</code> shows <code>wait_event_type = IPC</code> and <code>wait_event = SyncRep</code>, and the order is not visible to other sessions. At 30 orders per second, all of them wait: <b>the store stops selling</b>. Once the requirement is removed (<code>synchronous_standby_names = \'\'</code>), the order shows up.',
        look: 'Recife turns red and the long cable goes dark. The commits pile up in front of SP with the clock running.',
        key: 'Synchronous requiring every replica stops the store when one goes down.',
        f(o, t) { const s = lin(t, 0.8, 6.8, 0, 20); o.on.rec = 'bad'; o.on.sp = 'bad'; lit(o, 'rio');
          o.rows.sp = act('pg-sp', 'PRIMARY', ['commit waiting', 'bad'], ['wait_event = SyncRep', 'bad'], [`for ${Math.round(s)} s`, 'dim']); o.rows.sp.tape = W55('recv');
          o.rows.rio = act('pg-rio', 'REPLICA · SYNC', ['ack sent', 'acc']); o.rows.rio.tape = W55('recv');
          o.rows.rec = act('pg-recife', 'DOWN', ['no ack', 'bad']); o.rows.rec.tape = W55('none');
          o.rows.lena = act('Lena', 'app', ['order 1055', 'dim'], ['processing…', 'bad']);
          o.beams = [{ pts: CAB.rio }, { pts: CAB.rec, tone: 'bad' }];
          o.piles.push({ p: [175, 392, PL + 2], v: 30 * s, f: s / 20 });
          o.cnt = [['WAITING', `${Math.round(s)} s`, 'bad'], ['COMMITS STOPPED', thou(30 * s), 'bad'], ['wait_event', 'SyncRep', 'dim']];
          o.res = [['the store stops selling', 'bad']];
          T(o, TF(650), 'Recife down: SyncRep', 'bad'); } },
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
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.48 : W_ - 10); x.fillText(d.name, u(5), u(13)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 12, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(13)); x.textAlign = 'left'; } }
  // a fita do WAL: células em fila; acesa = aplicada, contorno = recebida, vazia = ainda não chegou, vermelha = perdida/erro
  function drawTape(x, u, C, tape, W_, H_) {
    const n = tape.length, gap = 3, cw = Math.min(60, (W_ - 10 - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 5, light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, 'WAL', 10, 30); x.fillText('WAL', u(5), u(y0 - 8));
    tape.forEach(([lab, s], i) => { const X = 5 + i * (cw + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      x.strokeStyle = s === 'recv' ? accC() : s === 'none' ? C.line : s === 'bad' ? BAD() : accC(); x.lineWidth = u(s === 'recv' ? 1.4 : 0.6);
      if (s === 'recv') x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(X + 0.5), u(y0 + 0.5), u(cw - 1), u(ch - 1)); x.setLineDash([]);
      if (lab) { x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : s === 'recv' ? accC() : INK();
        fitFont(x, u, lab, 14, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; } });
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    head(x, u, d, W_, col, 18); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(26)); x.lineTo(u(W_ - 4), u(26)); x.stroke();
    let y = 41; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, 16, W_ - 10); x.fillText(text, u(5), u(y)); } y += 22; }
    if (d.tape) drawTape(x, u, C, d.tape, W_, H_);
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? thou(pl.v) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
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
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const MODES = () => `<table class="h3-sum"><tr><th>mode</th><th>waits for</th><th>commit</th><th>commits/s</th></tr><tr${sc === 'assincrona' ? ' class="on"' : ''}><td>asynchronous</td><td>disk only</td><td>2 ms</td><td>500</td></tr><tr${sc === 'semi' ? ' class="on"' : ''}><td>semi (Rio)</td><td>2 + 10</td><td>12 ms</td><td>83</td></tr><tr${sc === 'sincrona' ? ' class="on"' : ''}><td>synchronous</td><td>2 + max(10, 80)</td><td>82 ms</td><td>12</td></tr></table>`;
  const DATA = {
    'primary-replica': () => `<li>SDLabs lab (PostgreSQL 14): <b>55432</b> = SP, <b>55433</b> = Rio, <b>55434</b> = Recife</li><li><code>pg_stat_replication</code> on the primary (real output):</li><table class="h3-sum"><tr><th></th><th>recife</th><th>rio</th></tr><tr><td>state</td><td>streaming</td><td>streaming</td></tr><tr><td>sync_state</td><td>async</td><td>async</td></tr><tr><td>replay_lsn</td><td>0/8000000</td><td>0/8000000</td></tr><tr><td>write_lag</td><td>00:00:00.100378</td><td>00:00:00.024312</td></tr></table><li>Those 100 and 24 ms come from the lab, with no network; the store's 15 and 60 ms on a normal day are the example</li><li>On the replica: <b>ERROR: cannot execute INSERT in a read-only transaction</b>; <code>pg_is_in_recovery()</code> = t</li><li>Order 1055: 1 blue mug 19.90 + shipping 15.00 = <b>34.90</b>; stock 37 → 36</li>`,
    queda: () => `<table class="h3-sum"><tr><th>math</th><th>result</th></tr><tr><td>30/s × 0.3 s (Rio)</td><td>9 orders</td></tr><tr><td>30/s × 0.8 s (Recife)</td><td>24 orders</td></tr><tr><td>5/s × 0.06 s (normal day)</td><td>~0.3</td></tr><tr class="on"><td>RTO: 30 s (ttl) + 5 s</td><td>35 s</td></tr><tr><td>30/s × 35 s</td><td>1,050 attempts</td></tr></table><li><code>pg_ctl -D rio promote</code> → <code>pg_is_in_recovery()</code> = f; <b>TimeLineID: 2</b>; the old primary comes back with <code>pg_rewind</code></li><li>Patroni (default): <code>ttl: 30</code>, <code>loop_wait: 10</code>, <code>retry_timeout: 10</code></li><li>Raft: election timeout drawn between <b>150 and 300 ms</b>; vote only for an equal or newer log; quorum <b>2 of 3</b></li>`,
    multi: () => `<table class="h3-sum"><tr><th>write</th><th>in reality</th><th>timestamp</th><th>vector</th></tr><tr><td>SP: Rua do Sol, 200</td><td>.100</td><td>.100</td><td>{SP:2, Rec:0}</td></tr><tr class="on"><td>Recife: Rua da Aurora, 100</td><td>.150</td><td>.030 (−120 ms)</td><td>{SP:1, Rec:1}</td></tr></table><li>LWW picks <b>SP</b> (.100 &gt; .030) and loses the newest write</li><li>Version vector: neither dominates → <b>concurrent</b></li><li>1056: hypothetical collision; ways out: odd/even or UUID/ULID</li><li>With the cable cut: Primary/Replica refuses writes in Recife (CP for writes); Primary/Primary accepts on both (AP)</li>`,
    lag: () => `<li>Lab, replay paused in Recife after the <code>INSERT</code> of 1055:</li><table class="h3-sum"><tr><th>query</th><th>result</th></tr><tr><td>pg_current_wal_lsn() (primary)</td><td>0/8004430</td></tr><tr><td>pg_last_wal_receive_lsn()</td><td>0/8004430</td></tr><tr class="on"><td>pg_last_wal_replay_lsn()</td><td>0/8000060</td></tr><tr><td>replay &gt;= '0/8004430'</td><td>f</td></tr></table><li>The lab loads only orders 1041–1052: Lena's query returns only 1051</li><li>On the other replica, without a pause, 1055 already shows up; after <code>pg_wal_replay_resume()</code>, in Recife too</li><li>Fixes: primary <b>+80 ms</b> per read · token · <code>remote_apply</code> <b>~82 ms</b> per commit</li>`,
    assincrona: () => MODES() + `<li>Black Friday: Rio <b>300 ms</b> and Recife <b>800 ms</b> behind; loss 30 × 0.3 = <b>9</b> and 30 × 0.8 = <b>24</b></li><li>Normal day: Rio 15 ms, Recife 60 ms; loss ~0.3</li>`,
    semi: () => MODES() + `<li>PostgreSQL: <code>FIRST 1 (rio, recife)</code> → <code>rio | sync | 1</code>, <code>recife | potential | 2</code>; if Rio goes down, Recife becomes sync</li><li>MariaDB: <code>rpl_semi_sync_master_timeout</code> = <b>10,000 ms</b>; after that "reverts to asynchronous replication"</li>`,
    sincrona: () => MODES() + `<li>Real measurement, no network: commit with 1 synchronous replica on the same computer = <b>8.1 ms</b></li><li>Replicas down: <code>wait_event_type = IPC</code>, <code>wait_event = SyncRep</code>; the order is not visible until the ack</li><li><code>synchronous_commit</code>: off, local, remote_write, <b>on</b> (default: flushed to disk), <b>remote_apply</b> (applied)</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação do passo: escrever o 1055 (Réplicas) e pausar/retomar o replay em Recife (Atraso)
  function actHtml() { const a = cur().act; if (!a) return '';
    const label = a[0] === 'pause' ? (paused ? 'Resume replay in Recife' : 'Pause replay in Recife') : a[1] + ' →';
    const sub = a[0] === 'pause' ? (paused ? 'pg_wal_replay_resume()' : 'pg_wal_replay_pause()') : 'INSERT 1055';
    return `<div class="o3-mode r3-act"><button data-r3="${a[0]}" aria-pressed="${a[0] === 'pause' && paused}">${label}<small>${sub}</small></button></div>`; }
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
  function readout() { if (active !== 'replicas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'replicas' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-replicas3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  // pausar no passo 1 já avança para o commit; nos outros passos só troca o estado (e reinicia o passo)
  function togglePause() { if (sc !== 'lag') return false; paused = !paused; return step === 0 && paused ? go(1) : go(step); }
  function doAct(a) { if (a === 'pause') return togglePause(); if (a === 'write') return next(); return false; }
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'replicas') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const a = e.target.closest("[data-r3]"); if (a) doAct(a.dataset.r3); });
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
    placePiles(o.piles); drawScreen(o);
    // o RTT de cada cabo fica escrito ao lado dele (balões discretos), antes dos balões do passo
    const all = (o.rtt ? [[372, 190, ZR + 10, 'RTT 10 ms', 'dim'], [372, 318, ZR + 10, 'RTT 80 ms', 'dim']] : []).concat(o.tags);
    TAGS.forEach((t, i) => { const g = all[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
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
    if (e.key === 'p' || e.key === 'P') return togglePause();
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · replay: P · drag to rotate' };
})() });
