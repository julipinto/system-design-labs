// Figura 3D (iso-glow): o dado saindo do dono e chegando às cópias, em três famílias de peças sobre a mesma prancha.
// ECST: o clientes (dono do cadastro) à esquerda, o tópico `clientes` do Kafka como uma esteira no meio e as três cópias
// (pedidos, entregas, notificacoes) à direita; o evento ClienteAtualizado (202 B) anda na esteira.
// CDC, Outbox e Slot: o banco do pedidos (pg-sp) com a fita do WAL na face, o leitor do log (Debezium) e o tópico
// loja.public.pedidos em cima; o polling e o que ele achou embaixo; o serviço pedidos na frente; o estoque ou o disco à direita.
// CRDTs: SP, Rio e Recife ligados por cabos (Recife pode ficar isolado); na face de cada nó, o estado (um campo por site,
// as etiquetas do OR-Set ou as saídas do PN-Counter). Atrás, o mostrador (contadores, o código ou a conta e o resultado).
// Cenários (botões e ?mode=ecst|cdc|outbox|slot|crdt-contador|crdt-carrinho|crdt-limite; ?step=N abre no passo N).
// Dados: docs/escrita/replicacao-brief.md e as aulas 4–6 (202 B × 56 B; test_decoding BEGIN 759/760; 335 B por pedido,
// 6.552 kB retidos, 108 MB/h, 23 dias; G-Counter 273; OR-Set {gato}; PN-Counter −1).
FIGS3D.push({ id: 'fluxo', name: 'Data flow', mod: (() => {
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
  const SC = ['ecst', 'cdc', 'outbox', 'slot', 'crdt-contador', 'crdt-carrinho', 'crdt-limite'];
  const SCNAME = { ecst: 'ECST', cdc: 'CDC', outbox: 'Outbox', slot: 'Slot', 'crdt-contador': 'Counter', 'crdt-carrinho': 'Cart', 'crdt-limite': 'Limit' };
  const SCFULL = { ecst: 'Event-Carried State Transfer', cdc: 'CDC: the log becomes an event', outbox: 'Outbox: no dual write', slot: 'The forgotten slot',
    'crdt-contador': 'CRDT: the G-Counter', 'crdt-carrinho': 'CRDT: the cart (OR-Set)', 'crdt-limite': 'CRDT: the limit (PN-Counter)' };
  const A4 = 'aula-4-event-carried-state-transfer', A5 = 'aula-5-cdc-change-data-capture', A6 = 'aula-6-crdts';
  const AULA = { ecst: A4, cdc: A5, outbox: A5, slot: A5, 'crdt-contador': A6, 'crdt-carrinho': A6, 'crdt-limite': A6 };
  let clk = 0, sc = 'ecst', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-fluxo3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  const fam = () => sc === 'ecst' ? 'E' : sc.startsWith('crdt') ? 'R' : 'C';

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 46, SW = 500, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças das três famílias; cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // ECST
  block('cli', 40, 140, 230, 200, 34); block('top', 300, 195, 220, 95, 12);
  block('ped', 560, 40, 310, 115, 26); block('ent', 560, 185, 310, 115, 26); block('not', 560, 325, 310, 110, 26);
  // CDC, Outbox, Slot
  block('app', 40, 365, 250, 66, 14); block('db', 40, 150, 250, 190, 34);
  block('dbz', 330, 150, 180, 100, 24); block('poll', 330, 280, 180, 100, 24);
  block('tlog', 550, 150, 330, 100, 12); block('tpol', 550, 280, 330, 100, 12);
  block('est', 600, 285, 230, 110, 26); block('disk', 550, 280, 330, 120, 26);
  // CRDTs
  block('sp', 40, 150, 270, 180, 30); block('rio', 540, 50, 210, 140, 28); block('rec', 540, 270, 210, 140, 28);
  block('nb', 60, 362, 210, 68, 14); block('cel', 772, 275, 122, 130, 14);
  const NAMES = Object.keys(B);
  creases(first);

  // cabos grossos (vigas) e pontos de luz: os eventos, as leituras e os estados
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
  const TF = x => [x, 446, 22];   // balão na faixa livre da frente da prancha

  // ── cabos ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const rev = pts => pts.slice().reverse();
  const CE = { pub: P3([[270, 242], [300, 242], [508, 242]], 26), ped: P3([[520, 242], [540, 242], [540, 97], [560, 97]]),
    ent: P3([[520, 242], [560, 242]]), not: P3([[520, 242], [540, 242], [540, 380], [560, 380]]),
    // o GET do entregas ao clientes passa por cima da esteira
    get: [[560, 214, ZR], [548, 214, ZR], [548, 214, 56], [282, 214, 56], [282, 214, ZR], [270, 214, ZR]] };
  const CC = { dbz: P3([[290, 200], [330, 200]]), poll: P3([[290, 330], [330, 330]]), tlog: P3([[510, 200], [550, 200]]), tpol: P3([[510, 330], [550, 330]]),
    app: P3([[165, 365], [165, 340]]), kafka: P3([[290, 398], [530, 398], [530, 226], [550, 226]]), est: P3([[715, 250], [715, 285]]),
    disk: P3([[290, 312], [520, 312], [520, 340], [550, 340]]) };
  const CR = { rio: P3([[310, 200], [425, 200], [425, 120], [540, 120]]), rec: P3([[310, 290], [425, 290], [425, 340], [540, 340]]),
    nb: P3([[165, 362], [165, 330]]), cel: P3([[750, 340], [772, 340]]) };
  // um evento (ou leitura, ou estado) andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);   // fração da viagem entre os instantes a e b do passo

  // ── conteúdo padrão das peças ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const withTape = (d, tl, cells) => { d.tl = tl; d.tape = cells; return d; };
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // ECST: a cópia do cliente lena-77 em cada serviço
  const COPY = { v7: ['v7 · previous address', 'dim'], v8: ['v8 · Rua da Aurora, 100', 'acc'], v9: ['v9 · Rua do Sol, 200', 'acc'] };
  const copy = (nm, v, extra) => act(nm, 'COPY OF lena-77', v, extra);
  const TOPIC = (st8 = 'none', lab = 'lena-77 v7') => [['…', 'none'], ['…', 'none'], [lab, st8]];
  // CDC: a fita do WAL e as esteiras de eventos
  const WALC = (...cells) => [['1054', 'ok'], ...cells];
  // CRDT: um campo por site
  const GC = (s, r, c, hi = '') => [['SP ' + s, hi.includes('s') ? 'ok' : 'none'], ['Rio ' + r, hi.includes('r') ? 'ok' : 'none'], ['Rec ' + c, hi.includes('c') ? 'ok' : 'none']];
  const gnode = (nm, meta, s, r, c, hi, tone = 'acc') => withTape(act(nm, meta, ['views of cat 42', 'dim'], ['total ' + (s + r + c), tone]), 'one counter per site', GC(s, r, c, hi));
  const snode = (nm, meta, set, cells, tone = 'acc') => withTape(act(nm, meta, ['Lena\'s cart', 'dim'], [set, tone]), 'tags', cells);
  const pnode = (nm, meta, n, tone = 'acc', hi = '') => withTape(act(nm, meta, [`P 1 · N ${n[0] + n[1] + n[2]}`, 'dim'], ['stock: ' + String(1 - n[0] - n[1] - n[2]).replace('-', '−'), tone]),
    'N (sales) per site', [['SP ' + n[0], hi.includes('s') ? 'ok' : 'none'], ['Rio ' + n[1], hi.includes('r') ? 'ok' : 'none'], ['Rec ' + n[2], hi.includes('c') ? (tone === 'bad' ? 'bad' : 'ok') : 'none']]);
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    if (fam() === 'E') {
      show('cli', 'top', 'ped', 'ent', 'not');
      o.rows.cli = act('clientes', 'OWNER', ['customer records', 'dim'], ['lena-77 · v7', 'hi'], ['previous address', 'dim']);
      o.rows.top = withTape(act('topic clientes', 'KAFKA'), 'compacted: last version of each key', TOPIC());
      o.rows.ped = copy('pedidos', COPY.v7); o.rows.ent = copy('entregas', COPY.v7); o.rows.not = copy('notificacoes', COPY.v7);
      o.beams.push({ pts: CE.pub }, { pts: CE.ped }, { pts: CE.ent }, { pts: CE.not });
    } else if (fam() === 'C') {
      show('db', 'dbz', 'tlog', 'app');
      if (sc === 'cdc') show('poll', 'tpol'); if (sc === 'outbox') show('est'); if (sc === 'slot') show('disk');
      o.rows.app = act('pedidos', 'SERVICE', ['writes the orders', 'dim']);
      o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['wal_level = logical', 'dim']), 'WAL', WALC());
      o.rows.dbz = act('Debezium', 'READS THE LOG', ['via the replication slot', 'dim']);
      o.rows.poll = act('polling', 'EVERY 5 s', ['"what changed?"', 'dim']);
      o.rows.tlog = withTape(act('loja.public.pedidos', 'VIA THE LOG'), 'events', []);
      o.rows.tpol = withTape(act('polling copy', 'VIA POLLING'), 'events', []);
      o.rows.est = act('estoque', 'CONSUMER', ['blue mug', 'dim'], ['37 units', 'hi']);
      o.rows.disk = act('pg-sp disk', '60 GB FREE', ['WAL retained by the slot', 'dim']); o.rows.disk.bar = [0.01, 'acc', '~0'];
      o.beams.push({ pts: CC.app }, { pts: CC.dbz }, { pts: CC.tlog });
      if (sc === 'cdc') o.beams.push({ pts: CC.poll }, { pts: CC.tpol });
      if (sc === 'outbox') o.beams.push({ pts: CC.est });
      if (sc === 'slot') o.beams.push({ pts: CC.disk });
    } else {
      show('sp', 'rio', 'rec'); if (sc === 'crdt-carrinho') show('nb', 'cel');
      if (sc === 'crdt-contador') { o.rows.sp = gnode('SP', 'G-COUNTER', 120, 80, 50); o.rows.rio = gnode('Rio', 'G-COUNTER', 120, 80, 50); o.rows.rec = gnode('Recife', 'G-COUNTER', 120, 80, 50); }
      if (sc === 'crdt-carrinho') { const c = [['caneca#a', 'ok']];
        o.rows.sp = snode('SP', 'OR-SET', '{caneca}', c); o.rows.rio = snode('Rio', 'OR-SET', '{caneca}', c); o.rows.rec = snode('Recife', 'OR-SET', '{caneca}', c);
        o.rows.nb = act('laptop', 'LENA · SP', ['cart: {caneca}', 'dim']); o.rows.cel = act('phone', '', ['Lena\'s, in Recife', 'dim'], ['{caneca}', 'dim']);
        o.beams.push({ pts: CR.nb }, { pts: CR.cel }); }
      if (sc === 'crdt-limite') { const z = [0, 0, 0]; o.rows.sp = pnode('SP', 'PN-COUNTER', z); o.rows.rio = pnode('Rio', 'PN-COUNTER', z); o.rows.rec = pnode('Recife', 'PN-COUNTER', z); }
      o.beams.push({ pts: CR.rio }, { pts: CR.rec });
    }
    return o;
  }
  // a rede entre SP e Recife: cortada (vermelha) ou de volta
  const cut = o => { o.beams = o.beams.map(b => b.pts === CR.rec ? { pts: CR.rec, tone: 'bad' } : b); T(o, [425, 315, 44], 'partition', 'bad'); };

  // ── o que se vê em cada passo ──
  const STEPS = {
    ecst: [
      { id: 'sem', dur: 5, title: 'Without events: one GET per order, ~7 ms', yk: 'THE CALL TO THE OWNER',
        code: ['GET /clientes/lena-77', '  hop ~5 ms + query 2 ms ≈ 7 ms', '  on every order', 'clientes down → entregas stops'],
        story: '<code>clientes</code> owns the customer records. Today <code>entregas</code> asks it for Lena\'s address on every order: <code>GET /clientes/lena-77</code>, a hop of about <b>5 ms</b> plus the <b>2 ms</b> query, around <b>7 ms</b>. If <code>clientes</code> goes down, <code>entregas</code> stops with it.',
        look: 'The light goes from entregas to clientes over the cable that passes above the conveyor and comes back with the address. The topic conveyor, in the middle, is not used yet.',
        key: 'Without a copy, whoever needs the data depends on the owner on every read.',
        f(o, t) { lit(o, 'ent'); o.on.cli = 2; const ph = (t * 0.45) % 1;
          o.rows.ped = act('pedidos', 'SERVICE', ['no copy', 'dim']); o.rows.not = act('notificacoes', 'SERVICE', ['no copy', 'dim']);
          o.rows.ent = act('entregas', 'SERVICE', ['no local copy', 'dim'], ['GET on every order', 'acc']);
          o.rows.top = withTape(act('topic clientes', 'KAFKA'), 'still empty', [['', 'none'], ['', 'none'], ['', 'none']]);
          o.beams.push({ pts: CE.get, on: true });
          if (ph < 0.5) pk(o, CE.get, ph * 2, 'GET lena-77'); else pk(o, rev(CE.get), (ph - 0.5) * 2, 'address · ~7 ms');
          o.cnt = [['PER ORDER', '~7 ms'], ['HOP', '~5 ms', 'dim'], ['QUERY', '2 ms', 'dim']];
          o.res = [['entregas depends on clientes', 'acc']]; } },
      { id: 'publica', dur: 6, title: 'Lena changes her address: ClienteAtualizado, 202 B', yk: 'THE EVENT (202 B)',
        code: ['{"evento_id":"e-1701","cliente_id":"lena-77",', ' "versao":8,"nome":"Lena","endereco":{', '  "rua":"Rua da Aurora","numero":100,', '  "cidade":"Recife","cep":"50050-000"},', ' "atualizado_em":"2026-11-27T20:20:00.150-03:00"}'],
        story: 'Lena changes her address to "Rua da Aurora, 100". <code>clientes</code> writes <b>version 8</b> and publishes <code>ClienteAtualizado</code> with the customer\'s <b>entire state</b>: <b>202 bytes</b>. The <code>clientes</code> topic is compacted (<code>cleanup.policy=compact</code>): Kafka keeps the last value of each key, and the key is the <code>cliente_id</code>.',
        look: 'The event leaves clientes and runs along the conveyor to the cell for key lena-77, which goes from v7 to v8.',
        key: 'The event carries the entire state, not just a notice that something changed.',
        f(o, t) { const f = go_(t, 0.9, 3.2), in_ = f >= 1; lit(o, 'cli'); if (in_) lit(o, 'top');
          o.rows.cli = act('clientes', 'OWNER', ['lena-77 · v8', 'acc'], ['Rua da Aurora, 100', 'acc'], [in_ ? 'published: 202 B' : 'publishing…', 'dim']);
          o.rows.top.tape = TOPIC(in_ ? 'ok' : 'none', in_ ? 'lena-77 v8' : 'lena-77 v7');
          o.beams[0] = { pts: CE.pub, on: !in_ }; pk(o, CE.pub, f, 'ClienteAtualizado · 202 B');
          o.cnt = [['EVENT', '202 B'], ['VERSION', '8', 'dim'], ['KEY', 'lena-77', 'dim']];
          o.res = in_ ? [['in the topic: lena-77 → v8', 'acc']] : []; } },
      { id: 'copias', dur: 7, title: 'The 3 copies update', yk: 'EACH SERVICE, ITS OWN COPY',
        code: ['pedidos       consumes the topic → local copy', 'entregas      consumes the topic → local copy', 'notificacoes  consumes the topic → local copy', 'between publishing and applying: seconds', 'with the old address (eventual consistency)'],
        story: 'The three services consume the topic and each applies v8 to <b>its own copy</b>, in a local table. Between <code>clientes</code> publishing and <code>entregas</code> applying, a few <b>seconds</b> pass in which the copy still has the old address. It is the BASE from module 3, chosen on purpose: in return, <code>entregas</code> reads without depending on anyone.',
        look: 'The event leaves the end of the conveyor and reaches the three services, one at a time. Each copy switches from v7 to v8.',
        key: 'ECST: each service keeps its own copy and stops calling the owner.',
        f(o, t) { lit(o, 'top'); o.rows.cli = act('clientes', 'OWNER', ['lena-77 · v8', 'acc'], ['Rua da Aurora, 100', 'acc']); o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          const W3 = [['ped', 'pedidos', 0.6, 2.2], ['ent', 'entregas', 1.2, 2.8], ['not', 'notificacoes', 1.8, 3.6]]; let n = 0;
          W3.forEach(([k, nm, a, b]) => { const f = go_(t, a, b), done = f >= 1; n += done; if (done) lit(o, k);
            o.rows[k] = copy(nm, done ? COPY.v8 : COPY.v7, [done ? 'applied' : 'old address', 'dim']); pk(o, CE[k], f, k === 'ent' ? 'v8 · 202 B' : '');
            o.beams.push({ pts: CE[k], on: f > 0 && !done }); });
          o.cnt = [['COPIES UP TO DATE', `${n} of 3`], ['LAG', 'seconds', 'dim'], ['EVENT', '202 B', 'dim']];
          o.res = n === 3 ? [['3 copies with v8', 'acc']] : []; } },
      { id: 'notif', dur: 7, title: 'Full state (202 B) × notification (56 B)', yk: 'THE TWO FORMS',
        code: ['full state: 202 B, no call', 'notification: 56 B', '  {"evento_id":"e-1701",', '   "cliente_id":"lena-77","versao":8}', '  + a GET back to clientes'],
        story: 'The other form is the <b>notification</b>: <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8}</code>, just <b>56 bytes</b>. It says something changed, but not what, and forces <b>one more call</b> back to <code>clientes</code>. It is the distinction from module 13: 202 B with no call, or 56 B plus a <code>GET</code>.',
        look: 'A smaller event, 56 B, reaches entregas, which has to go back to clientes over the top cable to fetch the address.',
        key: 'The notification is smaller, but puts the owner back in the path.',
        f(o, t) { lit(o, 'top', 'ent'); o.on.cli = 2; o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          const a = go_(t, 0.5, 1.8), g = go_(t, 2.0, 3.2), r = go_(t, 3.4, 4.6);
          pk(o, CE.ent, a, 'notification · 56 B'); pk(o, CE.get, g, 'GET lena-77'); pk(o, rev(CE.get), r, 'Rua da Aurora, 100');
          o.beams.push({ pts: CE.get, on: g > 0 && r < 1 });
          o.rows.ent = act('entregas', 'NOTIFICATION', ['received 56 B: just the id', a >= 1 ? 'acc' : 'dim'], [r >= 1 ? 'fetched: Rua da Aurora, 100' : g > 0 ? 'GET to clientes…' : 'address missing', r >= 1 ? 'acc' : 'dim']);
          o.cnt = [['FULL STATE', '202 B'], ['NOTIFICATION', '56 B', 'dim'], ['EXTRA CALLS', g > 0 ? '1 GET' : '0', 'dim']];
          o.res = r >= 1 ? [['56 B + 1 GET to clientes', 'acc']] : []; } },
      { id: 'custo', dur: 6, title: 'The cost: 4 copies, 3.0 GB', yk: 'THE MATH',
        code: ['1.5 million × 500 B = 750 MB per copy', '1 owner + 3 consumers = 4 copies = 3.0 GB', 'topic: 1.5 M keys × ~300 B ≈ 450 MB', 'a new consumer reads from the start:', '1,500,000 ÷ 20,000 events/s = 75 s'],
        story: 'The article calls the pattern "costly, but powerful", and the math shows where: 1.5 million customers × 500 B = <b>750 MB</b> per copy. With 3 consumers that is <b>4 copies, 3.0 GB</b>. The compacted topic holds 1.5 million keys, some <b>450 MB</b>. A new consumer reads the topic from the start to build its copy: at 20,000 events per second (example), <b>75 s</b>.',
        look: 'Each service lights up with the size of its copy, one at a time, and the counter adds up to 3.0 GB.',
        key: 'The price of ECST is space: the whole customer table in every service.',
        f(o, t) { const n = Math.min(4, 1 + Math.floor(lin(t, 0.5, 4.5, 0, 3.99))), ORD = ['cli', 'ped', 'ent', 'not'], NM = { cli: 'clientes', ped: 'pedidos', ent: 'entregas', not: 'notificacoes' };
          ORD.forEach((k, i) => { const on = i < n; if (on) lit(o, k); o.rows[k] = act(NM[k], i ? 'COPY' : 'OWNER', ['1.5 M customers', 'dim'], [on ? '750 MB' : '…', on ? 'acc' : 'dim']); });
          o.rows.top = withTape(act('topic clientes', 'KAFKA'), 'compacted: 1.5 M keys, ~450 MB', TOPIC('ok', 'lena-77 v8'));
          o.cnt = [['SPACE', ['750 MB', '1.5 GB', '2.25 GB', '3.0 GB'][n - 1]], ['COPIES', String(n), 'dim'], ['NEW CONSUMER', '75 s', 'dim']];
          o.res = n === 4 ? [['4 copies = 3.0 GB', 'acc']] : []; } },
      { id: 'cai', dur: 6, title: 'clientes goes down, and the others carry on', yk: 'THE OWNER IS DOWN',
        code: ['clientes: down', 'entregas reads the local copy:', '  lena-77 → Rua da Aurora, 100', 'no GET, no error', 'without events, the GET would fail'],
        story: 'Now <code>clientes</code> goes down. <code>entregas</code> carries on: Lena\'s address is in the local copy, and the delivery goes out to "Rua da Aurora, 100". <code>pedidos</code> and <code>notificacoes</code> carry on too. Without events, the same <code>GET</code> would fail and <code>entregas</code> would stop.',
        look: 'clientes turns red and so does the top cable, the GET one. The three services stay lit, each reading its own copy.',
        key: 'With a local copy, the owner going down does not bring down whoever reads.',
        f(o, t) { const down = t > 0.7; o.on.cli = down ? 'bad' : 1; lit(o, 'ped', 'ent', 'not'); o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          o.rows.cli = act('clientes', down ? 'DOWN' : 'OWNER', [down ? 'not answering' : 'lena-77 · v8', down ? 'bad' : 'acc']);
          o.rows.ped = copy('pedidos', COPY.v8); o.rows.not = copy('notificacoes', COPY.v8);
          o.rows.ent = copy('entregas', COPY.v8, [down ? 'reads the copy: carries on' : 'reads the local copy', 'acc']);
          o.beams.push({ pts: CE.get, tone: down ? 'bad' : '' });
          o.cnt = [['CLIENTES', down ? 'down' : 'up', down ? 'bad' : ''], ['SERVICES UP', '3 of 3', 'dim'], ['GET', 'none', 'dim']];
          o.res = down ? [['all 3 carry on with the copy', 'acc']] : [];
          if (down) T(o, [715, 242, 50], 'delivery → Rua da Aurora, 100', 'acc'); } },
      { id: 'ordem', dur: 8, title: 'If it goes wrong: v9 arrives before v8', yk: 'REPARTITIONING 3 → 6',
        code: ['v8: Rua da Aurora, 100', 'v9: Rua do Sol, 200', 'the topic goes from 3 to 6 partitions', 'entregas receives v9 and then v8', 'applies blindly → v8 (old) stays'],
        story: 'Later Lena changes her address twice: "Rua da Aurora, 100" (<b>v8</b>) and right after "Rua do Sol, 200" (<b>v9</b>). Because of a topic repartitioning (from 3 to 6 partitions, module 13), <code>entregas</code> receives <b>v9 and then v8</b>. If it blindly applies whatever arrived last, it ends up with v8, the <b>old</b> address, and the mug goes to the wrong house.',
        look: 'Two events leave the conveyor for entregas: v9 goes ahead. The copy goes to v9 and then back to v8, in red.',
        key: 'Applying blindly lets the arrival order choose the address.',
        f(o, t) { const a = go_(t, 0.6, 2.2), b = go_(t, 2.6, 4.2), wrong = b >= 1; lit(o, 'top');
          o.rows.cli = act('clientes', 'OWNER', ['lena-77 · v9', 'acc'], ['Rua do Sol, 200', 'acc']);
          o.rows.top = withTape(act('topic clientes', 'KAFKA'), 'partitions: 3 → 6', [['…', 'none'], ['v8', 'ok'], ['v9', 'ok']]);
          o.rows.ped = copy('pedidos', COPY.v9); o.rows.not = copy('notificacoes', COPY.v9);
          o.rows.ent = copy('entregas', wrong ? ['v8 · Rua da Aurora, 100', 'bad'] : a >= 1 ? COPY.v9 : COPY.v7, [wrong ? 'old address' : 'applies what arrives', wrong ? 'bad' : 'dim']);
          o.on.ent = wrong ? 'bad' : 1;
          pk(o, CE.ent, a, 'v9 · Rua do Sol'); pk(o, CE.ent, b, 'v8 · Rua da Aurora'); o.beams.push({ pts: CE.ent, on: a > 0 && !wrong });
          o.cnt = [['ENTREGAS COPY', wrong ? 'v8' : a >= 1 ? 'v9' : 'v7', wrong ? 'bad' : ''], ['ARRIVED', b > 0 ? 'v9, then v8' : a > 0 ? 'v9' : '…', 'dim'], ['RULE', 'none', 'bad']];
          o.res = wrong ? [['v8 beat v9:', 'bad'], ['old address', 'bad']] : [];
          if (wrong) T(o, TF(715), 'v8 won: old address', 'bad'); } },
      { id: 'versao', dur: 7, title: 'With the version, v8 is discarded', yk: 'APPLY ONLY IF THE VERSION IS GREATER',
        code: ['rule: apply only if the event\'s versao', '       is greater than the copy\'s', 'v9 arrives: 9 > 7, applies', 'v8 arrives: 8 > 9? no, discards', 'a duplicate arrives: equal, ignores'],
        story: 'With the rule "apply only if the event\'s <code>versao</code> is greater than the copy\'s", v9 gets in (9 &gt; 7) and v8, which arrives afterwards, is discarded (8 is not greater than 9). The copy stays with "Rua do Sol, 200". The same goes for the <b>duplicated</b> event: the rule ignores it. The other side is left: <code>clientes</code> writing and going down before publishing, the dual write from lesson 5.',
        look: 'The same swapped order. v8 reaches entregas in red and is left out; the copy stays on v9.',
        key: 'The version in the event is the defense against swapped order and repetition.',
        f(o, t) { const a = go_(t, 0.6, 2.2), b = go_(t, 2.6, 4.2), drop = b >= 1; lit(o, 'top', 'ent');
          o.rows.cli = act('clientes', 'OWNER', ['lena-77 · v9', 'acc'], ['Rua do Sol, 200', 'acc']);
          o.rows.top = withTape(act('topic clientes', 'KAFKA'), 'partitions: 3 → 6', [['…', 'none'], ['v8', 'ok'], ['v9', 'ok']]);
          o.rows.ped = copy('pedidos', COPY.v9); o.rows.not = copy('notificacoes', COPY.v9);
          o.rows.ent = copy('entregas', a >= 1 ? COPY.v9 : COPY.v7, [drop ? 'v8 < v9: discarded' : 'only if the version is greater', drop ? 'acc' : 'dim']);
          pk(o, CE.ent, a, 'v9 · Rua do Sol'); pk(o, CE.ent, b, 'v8: discarded', 'bad'); o.beams.push({ pts: CE.ent, on: a > 0 && !drop });
          o.cnt = [['ENTREGAS COPY', a >= 1 ? 'v9' : 'v7'], ['DISCARDED', drop ? '1 (v8)' : '0', 'dim'], ['RULE', 'greater versao', 'dim']];
          o.res = drop ? [['v9 stays: Rua do Sol, 200', 'acc']] : [];
          if (drop) T(o, TF(715), 'v8 discarded: v9 stays', 'acc'); } },
    ],
    cdc: [
      { id: 'tres', dur: 5, title: 'Three ways to capture a change', yk: 'TRIGGER, POLLING, LOG',
        code: ['trigger: runs on every write (costlier write)', 'polling: every 5 s, "what changed?"', 'log:     reads the WAL, everything, in order', 'wal_level = logical'],
        story: 'To copy what changes in the <code>pedidos</code> database without touching the application, there are three ways. The <b>trigger</b> runs inside the database on every write and makes the write more expensive. <b>Periodic polling</b> asks from time to time "what changed?". <b>Log reading</b> uses the WAL, which already has all the changes, in order. The figure puts the last two side by side.',
        look: 'On the left, the database with the WAL tape. On top, the log reader (Debezium) and the loja.public.pedidos topic; below, the polling every 5 s and what it copied.',
        key: 'The database log is already the list of everything that changed.',
        f(o, t) { lit(o, 'db');
          o.cnt = [['VIA THE LOG', '0 events'], ['VIA POLLING', '0 events', 'dim'], ['wal_level', 'logical', 'dim']];
          o.res = [['two columns to compare', 'acc']]; } },
      { id: 'insert', dur: 6, title: '20:10:00: the INSERT of 1055, status criado', yk: 'test_decoding (BEGIN 759)',
        code: ['BEGIN 759', 'table public.pedidos_cdc: INSERT:', "  id:1055 cliente_id:'lena-77'", "  cidade:'Recife' total:34.90", "  status:'criado'"],
        story: 'At 20:10:00 <code>pedidos</code> writes Lena\'s 1055: 1 blue mug, <b>34.90</b>, status <code>criado</code>. The <code>INSERT</code> goes into the WAL. With <code>wal_level = logical</code> PostgreSQL decodes the record into logical rows; Debezium reads it through the slot and publishes an event with <code>op</code> = <code>c</code> (create) to <code>loja.public.pedidos</code>.',
        look: 'The INSERT cell lights up on the WAL tape; the reader picks it up and a c event enters the top conveyor.',
        key: 'Every write to the database becomes a record in the log, and every record becomes an event.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.6, 2.4), c = go_(t, 2.6, 3.4), out = c >= 1; lit(o, 'db');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz'); if (out) lit(o, 'tlog');
          o.rows.app = act('pedidos', 'SERVICE', ['INSERT 1055 · criado', 'acc']);
          o.rows.db.tape = WALC(...(a >= 1 ? [['INSERT', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'READS THE LOG', [b >= 1 ? 'INSERT 1055 → op c' : 'via the replication slot', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = out ? [['c criado', 'ok']] : [];
          pk(o, CC.app, a, 'INSERT 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op c');
          o.cnt = [['VIA THE LOG', out ? '1 event' : '0 events'], ['VIA POLLING', '0 events', 'dim'], ['CLOCK', '20:10:00', 'dim']];
          o.res = out ? [['c: 1055 criado, 34.90', 'acc']] : []; } },
      { id: 'update', dur: 6, title: '20:10:03: the UPDATE to pago', yk: 'test_decoding (COMMIT 759)',
        code: ['table public.pedidos_cdc: UPDATE:', "  id:1055 cliente_id:'lena-77' …", "  status:'pago'", 'COMMIT 759', 'Debezium: op = u'],
        story: 'Three seconds later, at 20:10:03, the payment is approved and an <code>UPDATE</code> changes the status to <code>pago</code>. One more record in the WAL, one more event: <code>op</code> = <code>u</code>. On the top conveyor there are now <b>two</b> events for 1055, in order: <code>criado</code> and <code>pago</code>.',
        look: 'The second cell lights up on the WAL and the second event enters the top conveyor, after the first.',
        key: 'The log reader sees every change, even the one that lasted three seconds.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.6, 2.4), c = go_(t, 2.6, 3.4), out = c >= 1; lit(o, 'db');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz'); lit(o, 'tlog');
          o.rows.app = act('pedidos', 'SERVICE', ['UPDATE 1055 · pago', 'acc']);
          o.rows.db.tape = WALC(['INSERT', 'ok'], ...(a >= 1 ? [['UPDATE', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'READS THE LOG', [b >= 1 ? 'UPDATE 1055 → op u' : 'via the replication slot', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = [['c criado', 'ok'], ...(out ? [['u pago', 'ok']] : [])];
          pk(o, CC.app, a, 'UPDATE 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op u');
          o.cnt = [['VIA THE LOG', out ? '2 events' : '1 event'], ['VIA POLLING', '0 events', 'dim'], ['CLOCK', '20:10:03', 'dim']];
          o.res = out ? [['criado and pago, in order', 'acc']] : []; } },
      { id: 'polling', dur: 7, title: '20:10:05: polling sees only pago', yk: 'EVERY 5 s',
        code: ['20:10:00  INSERT  criado', '20:10:03  UPDATE  pago', '20:10:05  polling: "what changed?"', '          → 1 row: 1055, pago', 'log: 2 events · polling: 1'],
        story: 'Polling runs every <b>5 s</b>. At 20:10:05 it asks "what changed?" and finds the 1055 row as it is <b>now</b>: <code>pago</code>. The <code>criado</code> from 20:10:00 existed for three seconds and was never seen. The two columns compare: the log has <b>two</b> events, polling has <b>one</b>.',
        look: 'The polling clock reaches 20:10:05 and a single event, pago, enters the bottom conveyor. On top, the two are still there.',
        key: 'Polling sees snapshots; what changed between two snapshots disappears.',
        f(o, t) { const s = Math.floor(lin(t, 0.3, 2.6, 3, 5)), a = go_(t, 2.8, 3.5), b = go_(t, 3.7, 4.5), out = b >= 1; lit(o, 'db', 'tlog'); if (s >= 5) lit(o, 'poll'); if (out) lit(o, 'tpol');
          o.rows.db.tape = WALC(['INSERT', 'ok'], ['UPDATE', 'ok']); o.rows.tlog.tape = [['c criado', 'ok'], ['u pago', 'ok']];
          o.rows.poll = act('polling', 'EVERY 5 s', [`20:10:0${s}`, s >= 5 ? 'acc' : 'dim'], [s >= 5 ? '1 row: 1055 pago' : 'waiting', s >= 5 ? 'acc' : 'dim']);
          o.rows.tpol.tape = out ? [['pago', 'ok']] : [];
          pk(o, CC.poll, a, '"what changed?"'); pk(o, CC.tpol, b, 'pago');
          o.cnt = [['VIA THE LOG', '2 events'], ['VIA POLLING', out ? '1 event' : '0 events', out ? 'bad' : 'dim'], ['CLOCK', `20:10:0${s}`, 'dim']];
          o.res = out ? [['criado was never seen', 'bad']] : []; } },
      { id: 'identity', dur: 8, title: 'REPLICA IDENTITY: DEFAULT × FULL', yk: 'THE UPDATE\'s before',
        code: ['DEFAULT: the UPDATE carries only the new row', '         before = only the key (id 1055)', 'ALTER TABLE pedidos_cdc REPLICA IDENTITY FULL;', "FULL:    old-key: … status:'criado'", "         new-tuple: … status:'pago'"],
        story: 'What comes in the event depends on the <b>replica identity</b>. With the default (<code>REPLICA IDENTITY DEFAULT</code>), the <code>UPDATE</code> carries only the <b>new</b> value, and in Debezium the <code>before</code> carries only the <b>key</b>. With <code>ALTER TABLE pedidos_cdc REPLICA IDENTITY FULL</code>, the <code>UPDATE</code> carries <code>old-key:</code> (the whole old row) and <code>new-tuple:</code>, and whoever consumes sees the status go from <code>criado</code> to <code>pago</code>.',
        look: 'The u event on the top conveyor changes: first the before only has the key; after the ALTER TABLE, it carries the old row.',
        key: 'Without FULL, the event says how the row ended up, not how it was.',
        f(o, t) { const full = t > 3.2; lit(o, 'db', 'dbz', 'tlog');
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['REPLICA IDENTITY', 'dim'], [full ? 'FULL' : 'DEFAULT', 'acc']), 'WAL', WALC(['INSERT', 'ok'], ['UPDATE', 'ok']));
          o.rows.dbz = act('Debezium', 'op u', [full ? 'before: status criado' : 'before: only id 1055', full ? 'acc' : 'dim'], ['after: status pago', 'acc']);
          o.rows.tlog.tape = [['c criado', 'ok'], [full ? 'u criado→pago' : 'u ?→pago', 'ok']];
          o.rows.tpol.tape = [['pago', 'ok']];
          o.cnt = [['IDENTITY', full ? 'FULL' : 'DEFAULT'], ['before', full ? 'old row' : 'only the key', 'dim'], ['after', 'status pago', 'dim']];
          o.res = full ? [['old-key + new-tuple', 'acc']] : [['before = only the key', 'acc']];
          T(o, [715, 200, 40], full ? 'before: criado' : 'before: id 1055', 'acc'); } },
      { id: 'errado', dur: 8, title: 'If it goes wrong: the DELETE vanishes in polling', yk: 'test_decoding (BEGIN 760)',
        code: ['BEGIN 760', 'table public.pedidos_cdc: DELETE: id[bigint]:1055', 'COMMIT 760', 'log: op = d (with DEFAULT, only the key)', 'polling: the row is gone → nothing to see'],
        story: 'Now 1055 is deleted. In the log the <code>DELETE</code> enters as one more record, and Debezium publishes <code>op</code> = <code>d</code>; with the default identity, it carries <b>only the key</b>, <code>id 1055</code>. The next poll looks for rows that changed and finds nothing, because the row <b>no longer exists</b>. Whoever copies by polling ends up with an order that was already deleted.',
        look: 'The DELETE cell enters the WAL and becomes a d event on the top conveyor. On the bottom one nothing arrives: the polling copy still has 1055 pago, in red.',
        key: 'Polling does not see what was deleted; the log does.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.1), c = go_(t, 2.3, 3.0), p = go_(t, 3.3, 4.1), miss = p >= 1; lit(o, 'db', 'tlog');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz');
          o.rows.app = act('pedidos', 'SERVICE', ['DELETE 1055', 'acc']);
          o.rows.db.tape = WALC(['INSERT', 'ok'], ['UPDATE', 'ok'], ...(a >= 1 ? [['DELETE', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'READS THE LOG', [b >= 1 ? 'DELETE → op d, id 1055' : 'via the replication slot', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = [['c criado', 'ok'], ['u pago', 'ok'], ...(c >= 1 ? [['d 1055', 'ok']] : [])];
          o.rows.poll = act('polling', 'EVERY 5 s', [miss ? '0 rows: the row is gone' : '"what changed?"', miss ? 'bad' : 'dim']); if (miss) o.on.poll = 'bad';
          o.rows.tpol = withTape(act('polling copy', 'VIA POLLING', miss ? ['still: 1055 pago', 'bad'] : null), 'events', [['pago', miss ? 'bad' : 'ok']]); if (miss) o.on.tpol = 'bad';
          pk(o, CC.app, a, 'DELETE 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op d'); pk(o, CC.poll, p, '"what changed?"');
          o.cnt = [['VIA THE LOG', c >= 1 ? '3 events' : '2 events'], ['VIA POLLING', '1 event', 'bad'], ['THE DELETE', miss ? 'lost in polling' : '…', 'bad']];
          o.res = miss ? [['log: 3 events · polling: 1', 'bad'], ['the copy kept 1055', 'bad']] : [];
          if (miss) T(o, TF(715), 'polling missed the DELETE', 'bad'); } },
    ],
    outbox: [
      { id: 'dupla', dur: 6, title: 'Two writes in two places', yk: 'THE DUAL WRITE',
        code: ['1. INSERT INTO pedidos … (1055)   → database', '2. publishes PedidoCriado          → Kafka', 'two writes, two places', 'nothing ties one to the other'],
        story: '<code>pedidos</code> has to write 1055 and tell the world: <code>estoque</code> decrements the mug from <b>37 to 36</b> when it receives <code>PedidoCriado</code>. The naive way writes to the database and then publishes to Kafka. That is two writes in two places: the <b>dual write</b>.',
        look: 'Two cables leave the service: one to the database and another, direct, to Kafka. This time everything works and the stock goes to 36.',
        key: 'Writing and publishing are two writes, and nothing ties them together.',
        f(o, t) { const a = go_(t, 0.4, 1.0), b = go_(t, 1.3, 2.7), c = go_(t, 2.9, 3.5), done = c >= 1; lit(o, 'app');
          if (a >= 1) lit(o, 'db'); if (b >= 1) lit(o, 'tlog'); if (done) lit(o, 'est');
          o.rows.app = act('pedidos', 'SERVICE', ['writes, then publishes', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', a >= 1 ? 'acc' : 'dim']), 'WAL', WALC(...(a >= 1 ? [['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('pedidos topic', 'KAFKA'), 'events', b >= 1 ? [['PedidoCriado', 'ok']] : []);
          o.rows.est = act('estoque', 'CONSUMER', ['blue mug', 'dim'], [done ? '36 units' : '37 units', done ? 'acc' : 'hi']);
          o.beams.push({ pts: CC.kafka, on: b > 0 && b < 1 });
          pk(o, CC.app, a, 'INSERT 1055'); pk(o, CC.kafka, b, 'PedidoCriado'); pk(o, CC.est, c, '');
          o.cnt = [['MUG STOCK', done ? '36' : '37'], ['WRITES', '2 places', 'dim'], ['ORDER', '1055', 'dim']];
          o.res = done ? [['it worked, this time', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'If it goes wrong: the service crashes at 20:10:00.004', yk: 'BETWEEN THE TWO WRITES',
        code: ['20:10:00.000  INSERT 1055 → COMMIT', '20:10:00.004  pedidos crashes', '              PedidoCriado never goes out', 'mug stock: 37 (should be 36)'],
        story: '<code>pedidos</code> writes 1055 at 20:10:00.000, and at 20:10:00.004 the service crashes <b>before publishing</b> <code>PedidoCriado</code>. The order exists in the database, nobody decrements the stock, and the mug stays at <b>37</b>, when it should be <b>36</b>. No error shows up: just a wrong number.',
        look: '1055 enters the database; the service turns red and so does the cable to Kafka. The stock stays at 37.',
        key: 'In a dual write, a failure between the two writes leaves the data diverging.',
        f(o, t) { const a = go_(t, 0.4, 1.2), ms = Math.round(lin(t, 1.2, 2.6, 0, 4)), down = ms >= 4; lit(o, 'db'); o.on.app = down ? 'bad' : 1;
          o.rows.app = act('pedidos', down ? 'CRASHED' : 'SERVICE', [down ? 'crashed at 20:10:00.004' : `20:10:00.00${ms}`, down ? 'bad' : 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', a >= 1 ? 'acc' : 'dim']), 'WAL', WALC(...(a >= 1 ? [['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('pedidos topic', 'KAFKA', down ? ['nothing arrived', 'bad'] : null), 'events', []);
          o.rows.est = act('estoque', 'CONSUMER', ['blue mug: 37', down ? 'bad' : 'hi'], [down ? 'should be 36' : 'waiting for the event', down ? 'bad' : 'dim']); if (down) o.on.est = 'bad';
          o.beams.push({ pts: CC.kafka, tone: down ? 'bad' : '' }); pk(o, CC.app, a, 'INSERT 1055');
          o.cnt = [['CLOCK', `20:10:00.00${ms}`, down ? 'bad' : ''], ['MUG STOCK', '37', down ? 'bad' : 'dim'], ['PedidoCriado', down ? 'never went out' : '…', 'bad']];
          o.res = down ? [['the order exists, the notice does not', 'bad'], ['stock 37: should be 36', 'bad']] : [];
          if (down) T(o, TF(410), 'crashed before publishing', 'bad'); } },
      { id: 'outbox', dur: 7, title: 'The outbox: both rows in the same transaction', yk: 'ONE TRANSACTION',
        code: ['BEGIN;', 'INSERT INTO pedidos … (1055, …);', "INSERT INTO outbox … ('PedidoCriado', …);", 'COMMIT;', '-- either both rows exist, or neither does'],
        story: 'With the <b>outbox</b>, <code>pedidos</code> writes the <code>pedidos</code> table and an <code>outbox</code> table in the <b>same transaction</b>. Either both rows exist, or neither does. The service no longer talks to Kafka: only to the database.',
        look: 'Only one cable leaves the service, to the database. In the database, the rows pedidos 1055 and outbox PedidoCriado light up together, in the same COMMIT.',
        key: 'Outbox: the notice is born in the same transaction as the data.',
        f(o, t) { const a = go_(t, 0.5, 1.6), ok = a >= 1; lit(o, 'app'); if (ok) lit(o, 'db');
          o.rows.app = act('pedidos', 'SERVICE', ['a single transaction', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', ok ? 'acc' : 'dim'], ['outbox: PedidoCriado', ok ? 'acc' : 'dim']), 'WAL', WALC(...(ok ? [['pedidos', 'ok'], ['outbox', 'ok'], ['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('pedidos topic', 'KAFKA'), 'events', []);
          pk(o, CC.app, a, 'BEGIN … COMMIT');
          o.cnt = [['ROWS IN THE COMMIT', ok ? '2' : '…'], ['WRITES BY THE SERVICE', '1 place', 'dim'], ['MUG STOCK', '37', 'dim']];
          o.res = ok ? [['order and notice, together', 'acc']] : []; } },
      { id: 'publica', dur: 7, title: 'CDC publishes the outbox: the stock goes to 36', yk: 'FROM THE LOG TO KAFKA',
        code: ['20:10:00.000  COMMIT (pedidos + outbox)', '20:10:00.004  pedidos crashes: no matter', 'Debezium reads the outbox row in the WAL', 'publishes PedidoCriado', 'mug stock: 37 → 36'],
        story: 'Debezium reads the WAL, finds the <code>outbox</code> row and publishes <code>PedidoCriado</code>. If the service crashes at 20:10:00.004, after the commit, nothing changes: the event comes out of the log. If the database confirmed, the event exists, and <code>estoque</code> decrements the mug from 37 to <b>36</b>.',
        look: 'The service turns red (crashed), but the light leaves the WAL, goes through Debezium and the conveyor and reaches the stock, which shows 36.',
        key: 'If the database confirmed, the event exists.',
        f(o, t) { const a = go_(t, 0.8, 1.6), b = go_(t, 1.8, 2.6), c = go_(t, 2.8, 3.4), done = c >= 1; o.on.app = t > 0.4 ? 'bad' : 1; lit(o, 'db');
          if (a > 0) lit(o, 'dbz'); if (b >= 1) lit(o, 'tlog'); if (done) lit(o, 'est');
          o.rows.app = act('pedidos', t > 0.4 ? 'CRASHED' : 'SERVICE', [t > 0.4 ? 'crashed at .004: no matter' : 'COMMIT done', t > 0.4 ? 'bad' : 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', 'acc'], ['outbox: PedidoCriado', 'acc']), 'WAL', WALC(['pedidos', 'ok'], ['outbox', 'ok'], ['COMMIT', 'ok']));
          o.rows.dbz = act('Debezium', 'READS THE LOG', [a >= 1 ? 'found the outbox row' : 'via the replication slot', a >= 1 ? 'acc' : 'dim']);
          o.rows.tlog = withTape(act('pedidos topic', 'KAFKA'), 'events', b >= 1 ? [['PedidoCriado', 'ok']] : []);
          o.rows.est = act('estoque', 'CONSUMER', ['blue mug', 'dim'], [done ? '36 units' : '37 units', done ? 'acc' : 'hi']);
          pk(o, CC.dbz, a, 'outbox'); pk(o, CC.tlog, b, 'PedidoCriado'); pk(o, CC.est, c, '');
          o.cnt = [['MUG STOCK', done ? '36' : '37'], ['SERVICE', 'crashed', 'bad'], ['PedidoCriado', b >= 1 ? 'published' : '…', 'dim']];
          o.res = done ? [['the database confirmed: the event exists', 'acc']] : [];
          if (done) T(o, TF(715), 'stock 37 → 36', 'acc'); } },
    ],
    slot: [
      { id: 'segura', dur: 6, title: 'The slot holds the log until Debezium reads it', yk: 'THE REPLICATION SLOT',
        code: ['the slot marks how far Debezium has read', 'PostgreSQL only recycles the WAL', '  that the slot has released', 'with Debezium reading, the WAL does not pile up'],
        story: 'Debezium reads the WAL through a <b>replication slot</b>. The slot keeps the position up to where it has read, and PostgreSQL can only recycle the log that is past that position. With Debezium reading, the WAL comes in and goes out: nothing piles up.',
        look: 'The records leave the WAL tape through the reader and go on to the conveyor. The disk bar, at the bottom right, stays near zero.',
        key: 'The slot is the database\'s promise: I keep it until you read it.',
        f(o, t) { lit(o, 'app', 'db', 'dbz', 'tlog');
          o.rows.app = act('pedidos', 'SERVICE', ['30 orders/s', 'acc']);
          o.rows.db.tape = [['read', 'none'], ['read', 'none'], ['new', 'ok']];
          o.rows.dbz = act('Debezium', 'READING', ['slot: active = t', 'acc']);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok'], ['c', 'ok'], ['u', 'ok']];
          o.beams = o.beams.map(b => b.pts === CC.dbz || b.pts === CC.tlog || b.pts === CC.app ? { pts: b.pts, on: true, flow: true } : b);
          o.cnt = [['WAL RETAINED', '~0'], ['SLOT', 'active = t', 'dim'], ['RATE', '30 orders/s', 'dim']];
          o.res = [['the WAL comes in and goes out', 'acc']]; } },
      { id: 'para', dur: 7, title: 'Debezium stops, and the slot stays', yk: 'LAB: 20,000 ORDERS',
        code: ['20,000 × (INSERT + UPDATE + COMMIT)', 'WAL generated: 6,709,592 bytes', '÷ 20,000 = 335 B per order', 'pg_replication_slots: wal_status = reserved', 'retained by the slot: 6,552 kB'],
        story: 'Debezium stops, and nobody drops the slot. PostgreSQL <b>keeps everything</b>. In the SDLabs lab, 20,000 orders (each with 1 <code>INSERT</code>, 1 <code>UPDATE</code> and 1 <code>COMMIT</code>) generated <b>6,709,592 bytes</b> of WAL: <b>335 per order</b>. <code>pg_replication_slots</code> showed the slot with no consumer at <code>wal_status = reserved</code> and <b>6,552 kB</b> retained.',
        look: 'Debezium turns red, stopped. The tape cells pile up lit and the disk bar starts to fill.',
        key: 'A slot with no consumer: the database keeps the log for someone who never comes.',
        f(o, t) { const n = Math.round(lin(t, 0.6, 4.6, 0, 20000)), kB = Math.round(n * 6709592 / 20000 / 1024); lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVICE', [`${thou(n)} orders`, 'acc']);
          o.rows.db.tape = Array.from({ length: Math.max(1, Math.ceil(n / 2000)) }, () => ['', 'ok']);
          o.rows.dbz = act('Debezium', 'STOPPED', ['slot: active = f', 'bad']);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('pg-sp disk', '60 GB FREE', ['wal_status = reserved', 'acc']); o.rows.disk.bar = [0.02 + n / 20000 * 0.02, 'acc', `${thou(kB)} kB retained`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: true, flow: true });
          o.cnt = [['RETAINED', `${thou(kB)} kB`], ['ORDERS', thou(n), 'dim'], ['WAL PER ORDER', '335 B', 'dim']];
          o.res = n >= 20000 ? [['6,709,592 B ÷ 20,000 = 335 B', 'acc']] : []; } },
      { id: 'taxa', dur: 6, title: 'In the store: 36 MB per hour, 108 with 1 KB', yk: 'THE RATE',
        code: ['335 B × 30 orders/s ≈ 10 KB/s', '10 KB/s × 3,600 s ≈ 36 MB/h', 'with 1 KB per order (example):', '1 KB × 30 × 3,600 s = 108 MB/h'],
        story: 'In the store, at 30 orders per second, 335 B per order gives <b>10 KB/s</b>, or <b>36 MB/h</b>. A real order has items and indexes; with 1 KB per order (example), <b>108 MB/h</b>.',
        look: 'The clock runs a whole day and the disk\'s MB counter climbs hour by hour.',
        key: 'A forgotten slot grows at the pace of the writes.',
        f(o, t) { const h = Math.floor(lin(t, 0.5, 4.5, 0, 24)); lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVICE', ['30 orders/s', 'acc']);
          o.rows.db.tape = Array.from({ length: 10 }, () => ['', 'ok']);
          o.rows.dbz = act('Debezium', 'STOPPED', ['slot: active = f', 'bad']); o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('pg-sp disk', '60 GB FREE', [`after ${h} h`, 'dim']); o.rows.disk.bar = [0.04 + 108 * h / 60000, 'acc', `${thou(108 * h)} MB retained`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: true, flow: true });
          o.cnt = [['RETAINED (1 KB)', `${thou(108 * h)} MB`], ['AT 335 B', `${thou(36 * h)} MB`, 'dim'], ['TIME', `${h} h`, 'dim']];
          o.res = h >= 24 ? [['108 MB/h × 24 h = 2,592 MB', 'acc']] : []; } },
      { id: 'disco', dur: 8, title: 'If it goes wrong: 60 GB run out in 23 days', yk: 'THE DISK',
        code: ['60 GB free (module 16)', '60,000 MB ÷ 108 MB/h = 555 h', '555 h ÷ 24 ≈ 23 days', 'max_slot_wal_keep_size = -1', '  (default: unlimited)'],
        story: 'With <b>60 GB</b> free (module 16) and 108 MB/h, the disk runs out in 60,000 ÷ 108 = <b>555 h</b>, about <b>23 days</b>. The forgotten slot is a <b>slow</b> problem, not a fire, and that is why it goes unnoticed. By default, <code>max_slot_wal_keep_size</code> is <code>-1</code>: unlimited.',
        look: 'The disk bar fills day by day until it turns red on day 23.',
        key: 'The forgotten slot fills the disk slowly, with no alarm.',
        f(o, t) { const d = lin(t, 0.5, 6, 0, 555 / 24), full = d >= 555 / 24 - 0.01, mb = Math.min(60000, 108 * 24 * d); lit(o, 'app', 'db'); o.on.dbz = 'bad'; o.on.disk = full ? 'bad' : 1;
          o.rows.app = act('pedidos', 'SERVICE', ['30 orders/s', 'acc']);
          o.rows.db.tape = Array.from({ length: 10 }, () => ['', full ? 'bad' : 'ok']);
          o.rows.dbz = act('Debezium', 'STOPPED', [`for ${Math.floor(d)} days`, 'bad']); o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('pg-sp disk', full ? 'FULL' : '60 GB FREE', [full ? 'no space left' : `day ${Math.floor(d)}`, full ? 'bad' : 'dim']); o.rows.disk.bar = [mb / 60000, full ? 'bad' : 'acc', `${thou(mb)} of 60,000 MB`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: !full, flow: true, tone: full ? 'bad' : '' });
          o.cnt = [['DAYS', full ? '23' : String(Math.floor(d)), full ? 'bad' : ''], ['RETAINED', `${thou(mb / 1000)} GB`, 'dim'], ['SLOT LIMIT', '-1 (none)', 'bad']];
          o.res = full ? [['555 h ≈ 23 days: disk full', 'bad']] : [];
          if (full) T(o, TF(715), 'disk full on day 23', 'bad'); } },
      { id: 'defesa', dur: 7, title: 'The defense: monitor and set a cap', yk: 'pg_replication_slots',
        code: ['SELECT slot_name, active, wal_status', '  FROM pg_replication_slots;', 'alert: active = f and retained bytes rising', 'max_slot_wal_keep_size: a cap', 'past the cap: wal_status = lost'],
        story: 'The defense is to monitor <code>pg_replication_slots</code> (<code>wal_status</code> and the retained bytes) and limit the damage with <code>max_slot_wal_keep_size</code>, which by default is <code>-1</code>, unlimited. With a cap, the database stops keeping the log for the slot once it passes the limit: the slot becomes <code>lost</code> and CDC has to start over with a snapshot, but the primary\'s disk is safe. The Debezium documentation has a "WAL disk space consumption" section about this.',
        look: 'The alert lights up on the stopped Debezium; the disk bar stops at the cap, far from the end.',
        key: 'A slot is something to monitor, and to cap.',
        f(o, t) { const al = t > 0.8, cap = t > 2.4; lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVICE', ['30 orders/s', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['max_slot_wal_keep_size', 'dim'], [cap ? 'with a cap' : '-1 (unlimited)', cap ? 'acc' : 'bad']), 'WAL', Array.from({ length: 4 }, () => ['', 'ok']));
          o.rows.dbz = act('Debezium', 'STOPPED', [al ? 'ALERT: active = f' : 'slot: active = f', 'bad'], cap ? ['wal_status = lost', 'bad'] : null);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('pg-sp disk', '60 GB FREE', [cap ? 'stopped at the cap' : 'retained rising', cap ? 'acc' : 'dim']); o.rows.disk.bar = [cap ? 0.12 : lin(t, 0, 2.4, 0.04, 0.12), 'acc', cap ? 'cap: the disk is safe' : 'retained rising'];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: !cap, flow: true });
          o.cnt = [['ALERT', al ? 'slot stopped' : '…', al ? 'bad' : 'dim'], ['CAP', cap ? 'active' : '-1', cap ? '' : 'bad'], ['wal_status', cap ? 'lost' : 'reserved', 'dim']];
          o.res = cap ? [['CDC redoes the snapshot;', 'acc'], ['the disk is safe', 'acc']] : [];
          if (al) T(o, [420, 200, 52], 'ALERT: slot stopped', 'bad'); } },
    ],
    'crdt-contador': [
      { id: 'g', dur: 6, title: 'G-Counter: one counter per site', yk: 'THE STATE',
        code: ['visualizacoes of cat 42:', '{SP: 120, Rio: 80, Recife: 50}', 'total = sum = 250', 'each site only adds to its own field'],
        story: 'The <code>visualizacoes</code> of cat 42 are counted on the three sites, and each site accepts writes. The <b>G-Counter</b> (only grows) keeps <b>one counter per site</b>: <code>{SP: 120, Rio: 80, Recife: 50}</code>. The total is the sum, <b>250</b>, and each site only increments <b>its own</b> field.',
        look: 'The three nodes show the same state: three cells, one per site, and the total 250.',
        key: 'In the G-Counter each site owns its piece of the counter.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['TOTAL', '250'], ['SITES', '3', 'dim'], ['STATE', 'same on all 3', 'dim']];
          o.res = [['{SP: 120, Rio: 80, Recife: 50}', 'acc']]; } },
      { id: 'particao', dur: 8, title: 'The partition: SP counts +15, Recife +8', yk: 'NO NETWORK BETWEEN SP AND RECIFE',
        code: ['SP:     {SP: 135, Rio: 80, Recife: 50} = 265', 'Recife: {SP: 120, Rio: 80, Recife: 58} = 258', 'Rio receives SP\'s state: 265', 'each side sees a different total'],
        story: 'The network between SP and Recife goes down. Both keep accepting views: SP counts <b>+15</b> (<code>SP: 135</code>, total 265) and Recife counts <b>+8</b> (<code>Recife: 58</code>, total 258). Rio, still connected to SP, receives SP\'s state. For now each side sees a different total.',
        look: 'The Recife cable turns red. SP\'s cell climbs to 135 and Recife\'s to 58, each on its own node.',
        key: 'In the partition, each site keeps counting in its own field.',
        f(o, t) { const s = 120 + Math.round(lin(t, 0.6, 3.8, 0, 15)), c = 50 + Math.round(lin(t, 0.8, 3.8, 0, 8)); lit(o, 'sp', 'rec', 'rio'); cut(o);
          o.rows.sp = gnode('SP', 'G-COUNTER', s, 80, 50, 's'); o.rows.rio = gnode('Rio', 'G-COUNTER', s, 80, 50, 's'); o.rows.rec = gnode('Recife', 'G-COUNTER', 120, 80, c, 'c');
          o.beams = o.beams.map(b => b.pts === CR.rio ? { pts: CR.rio, on: true, flow: true } : b);
          o.cnt = [['TOTAL IN SP', String(s + 130)], ['TOTAL IN RECIFE', String(c + 200), 'dim'], ['SP–RECIFE NETWORK', 'cut', 'bad']];
          o.res = s === 135 && c === 58 ? [['265 in SP · 258 in Recife', 'acc']] : []; } },
      { id: 'juncao', dur: 8, title: 'The network is back: maximum per site, 273', yk: 'THE MERGE',
        code: ['merge = maximum per site', 'SP:     max(135, 120) = 135', 'Rio:    max(80, 80)   = 80', 'Recife: max(50, 58)   = 58', '135 + 80 + 58 = 273'],
        story: 'The network comes back and the states cross. The <b>merge is the maximum per site</b>: <code>{SP: 135, Rio: 80, Recife: 58}</code>, total <b>273</b>. It gives the same in both directions (SP merges Recife\'s, Recife merges SP\'s) and the same if applied twice. No site decided anything: it is a calculation.',
        look: 'The states cross the cable in both directions; the cells settle and the three totals show 273.',
        key: 'The G-Counter merge is a calculation, not a choice.',
        f(o, t) { const f = go_(t, 0.6, 2.4), m = f >= 1, r = go_(t, 2.6, 3.6); lit(o, 'sp', 'rio', 'rec');
          o.rows.sp = gnode('SP', 'G-COUNTER', 135, 80, m ? 58 : 50, m ? 'c' : 's'); o.rows.rec = gnode('Recife', 'G-COUNTER', m ? 135 : 120, 80, 58, m ? 's' : 'c');
          o.rows.rio = gnode('Rio', 'G-COUNTER', 135, 80, r >= 1 ? 58 : 50, r >= 1 ? 'c' : '');
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, 'SP: 135'); pk(o, rev(CR.rec), f, 'Recife: 58'); pk(o, CR.rio, r, '');
          o.cnt = [['TOTAL', m ? '273' : '…'], ['SP', m ? 'max(135, 120)' : '265', 'dim'], ['RECIFE', m ? 'max(50, 58)' : '258', 'dim']];
          o.res = m ? [['135 + 80 + 58 = 273', 'acc'], ['same in both directions', 'acc']] : [];
          if (m) T(o, TF(425), '273 on all three sites', 'acc'); } },
      { id: 'ordem', dur: 7, title: 'Any order, with duplicates: the same 273', yk: 'COMMUTATIVE, ASSOCIATIVE, IDEMPOTENT',
        code: ['5 messages: 5! = 120 orders', 'with duplicate messages', '→ 1 single final state', 'merge(a, b) = merge(b, a)', 'merge(a, a) = a'],
        story: 'Merging the same set of states in any order, with repeated messages, gives the same result. The test with 5 messages in <b>120 permutations</b> (5!) gave a single final state. It is the commutativity, associativity and idempotence from the article; in Shapiro\'s paper, the merge is the <i>join</i> of a semilattice.',
        look: 'Rio resends the same state twice and nothing changes. The counter of tested orders goes to 120 and the final-states one stays at 1.',
        key: 'The CRDT converges because the merge does not care about order or repetition.',
        f(o, t) { const n = Math.round(lin(t, 0.5, 4.5, 1, 120)); lit(o, 'sp', 'rio', 'rec');
          for (const nm of ['sp', 'rio', 'rec']) o.rows[nm] = gnode({ sp: 'SP', rio: 'Rio', rec: 'Recife' }[nm], 'G-COUNTER', 135, 80, 58);
          const ph = (t * 0.5) % 1; pk(o, rev(CR.rio), ph, 'Rio: the same state'); pk(o, CR.rec, (ph + 0.5) % 1, 'duplicate');
          o.beams = [{ pts: CR.rio, on: true }, { pts: CR.rec, on: true }];
          o.cnt = [['ORDERS TESTED', String(n)], ['FINAL STATES', '1', 'dim'], ['TOTAL', '273', 'dim']];
          o.res = n >= 120 ? [['120 orders, 1 final state', 'acc']] : []; } },
      { id: 'lww', dur: 8, title: 'If it goes wrong: LWW on the total loses 8 or 15', yk: 'LAST WRITE WINS ON THE TOTAL',
        code: ['SP keeps the total: 265', 'Recife keeps the total: 258', 'LWW: the higher timestamp wins', '→ 265 (loses 8) or 258 (loses 15)', 'G-Counter: 273, nothing lost'],
        story: 'What if the store kept only the <b>total</b> and resolved the conflict with <i>last write wins</i>? After the partition, SP has 265 and Recife has 258. LWW keeps one of them: <b>265</b>, and Recife\'s 8 views vanish, or <b>258</b>, and SP\'s 15 vanish. No error shows up. The G-Counter keeps one field per site precisely so it does not have to choose.',
        look: 'The two totals cross the cable; the winner stays on all three sites and the loser disappears, in red, with what was lost.',
        key: 'LWW on a number picks one side and throws the other away.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, alt = t > 4.6, win = alt ? 258 : 265, lost = alt ? 15 : 8; lit(o, 'sp', 'rio', 'rec');
          const tot = (nm, v, tone, cells) => withTape(act(nm, 'LWW ON THE TOTAL', ['views of cat 42', 'dim'], ['total ' + v, tone]), 'total only', cells);
          if (!m) { o.rows.sp = tot('SP', 265, 'acc', [['265', 'ok']]); o.rows.rio = tot('Rio', 265, 'acc', [['265', 'ok']]); o.rows.rec = tot('Recife', 258, 'acc', [['258', 'ok']]); }
          else { const cell = [[String(win), 'ok'], [String(alt ? 265 : 258), 'bad']];
            o.rows.sp = tot('SP', win, alt ? 'bad' : 'acc', cell); o.rows.rio = tot('Rio', win, alt ? 'bad' : 'acc', cell); o.rows.rec = tot('Recife', win, alt ? 'bad' : 'acc', cell);
            o.on[alt ? 'sp' : 'rec'] = 'bad'; }
          o.beams = [{ pts: CR.rio }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, '265'); pk(o, rev(CR.rec), f, '258');
          o.cnt = [['LWW KEEPS', m ? String(win) : '…', m ? 'bad' : ''], ['LOST', m ? String(lost) : '…', 'bad'], ['G-COUNTER', '273', 'dim']];
          o.res = m ? [[`keeps ${win}: ${lost} views vanish`, 'bad'], ['the G-Counter would give 273', 'acc']] : [];
          if (m) T(o, TF(425), `LWW: ${win}, loses ${lost}`, 'bad'); } },
    ],
    'crdt-carrinho': [
      { id: 'set', dur: 5, title: 'Lena\'s cart: {caneca}', yk: 'OR-SET',
        code: ['cart = {caneca}', 'each addition gets its own tag:', '  caneca#a', 'removing = deleting the tags the site saw'],
        story: 'Lena\'s cart is an <b>OR-Set</b> (<i>observed-remove</i>): a set where each addition gets its own <b>tag</b>, and removing deletes only the tags the site saw. On all three sites the cart is <code>{caneca}</code>. Lena uses the laptop (which talks to SP) and the phone (which talks to Recife).',
        look: 'The three nodes with the same tag, caneca#a. In front, Lena\'s laptop; on the right, the phone.',
        key: 'In the OR-Set, each addition has a tag and each removal says which ones it saw.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['CART', '{caneca}'], ['TAGS', 'caneca#a', 'dim'], ['SITES', 'equal', 'dim']];
          o.res = [['{caneca} on all three sites', 'acc']]; } },
      { id: 'particao', dur: 8, title: 'In the partition: the phone adds the cat, the laptop removes the mug', yk: 'TWO INTENTIONS',
        code: ['Recife (phone):  + gato#b', '  → {caneca#a, gato#b}', 'SP (laptop):     − caneca (saw #a)', '  → {}', 'no network between SP and Recife'],
        story: 'The network between SP and Recife goes down. On the <b>phone</b>, which talks to Recife, Lena adds the <code>gato</code>: a new tag, <code>gato#b</code>. On the <b>laptop</b>, which talks to SP, she removes the <code>caneca</code>: SP deletes the tag it saw, <code>caneca#a</code>. Each side now has a different cart.',
        look: 'The Recife cable turns red. From the phone "+ gato" goes out to Recife; from the laptop "− caneca" goes out to SP, and the caneca#a tag is struck through in SP.',
        key: 'In the partition, each side records its own intention.',
        f(o, t) { const a = go_(t, 0.6, 1.6), b = go_(t, 2.0, 3.0); lit(o, 'sp', 'rio', 'rec'); cut(o);
          if (a > 0) lit(o, 'cel'); if (b > 0) lit(o, 'nb');
          o.rows.rec = snode('Recife', 'OR-SET', a >= 1 ? '{caneca, gato}' : '{caneca}', [['caneca#a', 'ok'], ...(a >= 1 ? [['gato#b', 'ok']] : [])]);
          const spC = [['caneca#a', b >= 1 ? 'off' : 'ok']];
          o.rows.sp = snode('SP', 'OR-SET', b >= 1 ? '{}' : '{caneca}', spC); o.rows.rio = snode('Rio', 'OR-SET', b >= 1 ? '{}' : '{caneca}', spC);
          o.rows.cel = act('phone', '', ['Lena\'s, in Recife', 'dim'], ['+ gato', a > 0 ? 'acc' : 'dim']); o.rows.nb = act('laptop', 'LENA · SP', ['− caneca', b > 0 ? 'acc' : 'dim']);
          o.beams = o.beams.map(x => x.pts === CR.rio ? { pts: CR.rio, on: b >= 1, flow: b >= 1 } : x);
          pk(o, CR.cel.slice().reverse(), a, '+ gato'); pk(o, CR.nb, b, '− caneca');
          o.cnt = [['IN SP', b >= 1 ? '{}' : '{caneca}'], ['IN RECIFE', a >= 1 ? '{caneca, gato}' : '{caneca}', 'dim'], ['SP–RECIFE NETWORK', 'cut', 'bad']];
          o.res = a >= 1 && b >= 1 ? [['two different carts', 'acc']] : []; } },
      { id: 'juncao', dur: 7, title: 'The merge: {gato}', yk: 'THE MERGE',
        code: ['additions: caneca#a, gato#b', 'removals:  caneca#a (SP saw it and removed it)', 'what stays: gato#b', '→ {gato} on all three sites', 'both intentions count'],
        story: 'The network comes back and the states merge. The additions are <code>caneca#a</code> and <code>gato#b</code>; the removal deleted <code>caneca#a</code>. What is left is <code>gato#b</code>: the cart is <code>{gato}</code> on all three sites. Both of Lena\'s intentions counted: the cat went in and the mug went out.',
        look: 'The tags cross the cable in both directions; on all three nodes gato#b is lit and caneca#a is struck through.',
        key: 'The OR-Set merge respects the addition and the removal that each side saw.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, r = go_(t, 2.4, 3.4); lit(o, 'sp', 'rio', 'rec');
          const J = [['caneca#a', 'off'], ['gato#b', 'ok']];
          o.rows.sp = snode('SP', 'OR-SET', m ? '{gato}' : '{}', m ? J : [['caneca#a', 'off']]);
          o.rows.rec = snode('Recife', 'OR-SET', m ? '{gato}' : '{caneca, gato}', m ? J : [['caneca#a', 'ok'], ['gato#b', 'ok']]);
          o.rows.rio = snode('Rio', 'OR-SET', r >= 1 ? '{gato}' : '{}', r >= 1 ? J : [['caneca#a', 'off']]);
          o.rows.cel = act('phone', '', ['Lena\'s, in Recife', 'dim'], [m ? '{gato}' : '{caneca, gato}', m ? 'acc' : 'dim']); o.rows.nb = act('laptop', 'LENA · SP', [m ? '{gato}' : '{}', m ? 'acc' : 'dim']);
          if (m) lit(o, 'nb', 'cel');
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }, { pts: CR.nb, on: m }, { pts: CR.cel, on: m }];
          pk(o, CR.rec, f, '− caneca#a'); pk(o, rev(CR.rec), f, '+ gato#b'); pk(o, CR.rio, r, '');
          o.cnt = [['CART', m ? '{gato}' : '…'], ['ADDITIONS', 'caneca#a, gato#b', 'dim'], ['REMOVALS', 'caneca#a', 'dim']];
          o.res = m ? [['{gato}: both intentions count', 'acc']] : [];
          if (m) T(o, TF(425), '{gato} on all three sites', 'acc'); } },
      { id: 'addvence', dur: 8, title: 'If it goes wrong: remove and re-add, and the mug stays', yk: 'ADD WINS',
        code: ['SP removes the mug: deletes #a', 'Recife adds it again: caneca#c', 'on merge: #a removed, #c not seen', '→ the mug stays: "add wins"'],
        story: 'What if one side <b>removes</b> the mug and the other <b>adds it again</b> at the same time? SP\'s removal only deletes the tag SP saw (<code>#a</code>); Recife\'s addition created a new one (<code>#c</code>), which SP never saw. On merge the mug <b>stays</b>: "add wins". If Lena really wanted to take the mug out, it comes back to the cart.',
        look: 'In SP caneca#a is struck through; in Recife caneca#c is born. After the merge, the three nodes show the mug, with the new tag lit.',
        key: 'The OR-Set resolves on its own, but it picks the addition: the mug comes back.',
        f(o, t) { const a = go_(t, 0.6, 1.4), b = go_(t, 1.6, 2.4), f = go_(t, 2.8, 4.2), m = f >= 1; lit(o, 'sp', 'rio', 'rec'); if (!m) cut(o);
          if (a > 0 && !m) lit(o, 'nb'); if (b > 0 && !m) lit(o, 'cel');
          const J = [['caneca#a', 'off'], ['caneca#c', 'bad']];
          o.rows.sp = snode('SP', 'OR-SET', m ? '{caneca}' : a >= 1 ? '{}' : '{caneca}', m ? J : [['caneca#a', a >= 1 ? 'off' : 'ok']], m ? 'bad' : 'acc');
          o.rows.rio = snode('Rio', 'OR-SET', m ? '{caneca}' : a >= 1 ? '{}' : '{caneca}', m ? J : [['caneca#a', a >= 1 ? 'off' : 'ok']], m ? 'bad' : 'acc');
          o.rows.rec = snode('Recife', 'OR-SET', '{caneca}', m ? J : [['caneca#a', 'ok'], ...(b >= 1 ? [['caneca#c', 'ok']] : [])], m ? 'bad' : 'acc');
          o.rows.nb = act('laptop', 'LENA · SP', [m ? 'the mug came back' : '− caneca', m ? 'bad' : a > 0 ? 'acc' : 'dim']);
          o.rows.cel = act('phone', '', ['Lena\'s, in Recife', 'dim'], ['+ caneca', b > 0 ? 'acc' : 'dim']);
          if (m) { o.on.nb = 'bad'; o.beams = [{ pts: CR.rio }, { pts: CR.rec }, { pts: CR.nb }, { pts: CR.cel }]; }
          pk(o, CR.nb, a, '− caneca#a'); pk(o, rev(CR.cel), b, '+ caneca#c');
          if (f > 0 && !m) { pk(o, CR.rec, f, '− #a'); pk(o, rev(CR.rec), f, '+ #c'); }
          o.cnt = [['CART', m ? '{caneca}' : '…', m ? 'bad' : ''], ['REMOVED', 'caneca#a', 'dim'], ['NOT SEEN BY SP', b >= 1 ? 'caneca#c' : '…', 'dim']];
          o.res = m ? [['the mug stays: add wins', 'bad']] : [];
          if (m) T(o, TF(425), 'add wins: the mug stays', 'bad'); } },
    ],
    'crdt-limite': [
      { id: 'estoque', dur: 6, title: 'The mug stock: 1 unit', yk: 'PN-COUNTER',
        code: ['P (inflows):  {SP: 1, Rio: 0, Recife: 0}', 'N (outflows): {SP: 0, Rio: 0, Recife: 0}', 'value = sum(P) − sum(N) = 1', 'two G-Counters: one goes up, the other down'],
        story: 'The <b>PN-Counter</b> goes up and down: it is two G-Counters, one for increments (P) and one for decrements (N), and the value is the difference. The blue mug\'s stock has <b>1</b> unit, and the three sites agree.',
        look: 'The three nodes show P 1, N 0 and stock 1. The cells are each site\'s outflows, all at zero.',
        key: 'The PN-Counter is a pair of G-Counters: inflows minus outflows.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['STOCK', '1'], ['INFLOWS (P)', '1', 'dim'], ['OUTFLOWS (N)', '0', 'dim']];
          o.res = [['1 mug on all three sites', 'acc']]; } },
      { id: 'vende', dur: 8, title: 'In the partition, SP sells 1 and Recife sells 1', yk: 'EACH SIDE SAW 1',
        code: ['SP:     saw 1, sells → N = {SP: 1, …}  → 0', 'Recife: saw 1, sells → N = {…, Recife: 1} → 0', 'both sales were accepted', 'each side, alone, did the right thing'],
        story: 'The network between SP and Recife goes down, and the last mug is sold on both sides. SP sees 1 in stock, sells and now sees <b>0</b>. Recife also sees 1, sells and sees <b>0</b>. Each one, alone, did the right thing.',
        look: 'The Recife cable turns red. The SP 1 cell lights up in SP (and in Rio, which receives from SP); the Rec 1 cell lights up in Recife. All three show stock 0.',
        key: 'In the partition, each side accepts the sale that looks possible.',
        f(o, t) { const s = t > 1.0, c = t > 2.2; lit(o, 'sp', 'rio', 'rec'); cut(o);
          o.rows.sp = pnode('SP', 'PN-COUNTER', [s ? 1 : 0, 0, 0], 'acc', s ? 's' : ''); o.rows.rio = pnode('Rio', 'PN-COUNTER', [s ? 1 : 0, 0, 0], 'acc', s ? 's' : '');
          o.rows.rec = pnode('Recife', 'PN-COUNTER', [0, 0, c ? 1 : 0], 'acc', c ? 'c' : '');
          o.beams = o.beams.map(b => b.pts === CR.rio ? { pts: CR.rio, on: s, flow: s } : b);
          if (s) T(o, [175, 240, 52], 'SP: sells 1 (saw 1)', 'acc'); if (c) T(o, [645, 340, 50], 'Recife: sells 1 (saw 1)', 'acc');
          o.cnt = [['IN SP', s ? '0' : '1'], ['IN RECIFE', c ? '0' : '1', 'dim'], ['SALES ACCEPTED', String(s + c), 'dim']];
          o.res = s && c ? [['two sales of the last mug', 'acc']] : []; } },
      { id: 'menos1', dur: 8, title: 'If it goes wrong: the merge gives −1', yk: 'THE MERGE',
        code: ['P = {SP: 1, Rio: 0, Recife: 0} → 1', 'N = {SP: 1, Rio: 0, Recife: 1} → 2', '1 − 2 = −1 on all three sites', 'converged: everyone agrees', 'violated: stock ≥ 0'],
        story: 'The network comes back and the states merge: P adds up to 1 and N to 2. The stock is <b>−1</b> on all three sites. The CRDT <b>converged</b> (the sites agree) and <b>violated</b> the rule "stock ≥ 0": the last item was sold twice.',
        look: 'The outflows cross the cable; the three nodes turn red with stock −1.',
        key: 'Converging is not being right: the CRDT does not protect the business rule.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, r = go_(t, 2.4, 3.4); lit(o, 'sp', 'rio', 'rec');
          const J = [1, 0, 1];
          o.rows.sp = m ? pnode('SP', 'PN-COUNTER', J, 'bad', 'sc') : pnode('SP', 'PN-COUNTER', [1, 0, 0], 'acc', 's');
          o.rows.rec = m ? pnode('Recife', 'PN-COUNTER', J, 'bad', 'sc') : pnode('Recife', 'PN-COUNTER', [0, 0, 1], 'acc', 'c');
          o.rows.rio = r >= 1 ? pnode('Rio', 'PN-COUNTER', J, 'bad', 'sc') : pnode('Rio', 'PN-COUNTER', [1, 0, 0], 'acc', 's');
          if (m) { o.on.sp = 'bad'; o.on.rec = 'bad'; } if (r >= 1) o.on.rio = 'bad';
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, 'N SP: 1'); pk(o, rev(CR.rec), f, 'N Recife: 1'); pk(o, CR.rio, r, '');
          o.cnt = [['STOCK', m ? '−1' : '0', m ? 'bad' : ''], ['P − N', m ? '1 − 2' : '1 − 1', 'dim'], ['SITES AGREE', m ? 'yes' : '…', 'dim']];
          o.res = m ? [['converged and violated stock ≥ 0', 'bad']] : [];
          if (m) T(o, TF(425), 'stock −1 on all three sites', 'bad'); } },
      { id: 'saida', dur: 7, title: 'For the last item: one owner or a compensation', yk: 'WHAT TO DO',
        code: ['a single owner of the stock (module 11):', '  UPDATE … SET quantidade = quantidade - 1', '   WHERE … AND quantidade > 0', 'or compensate the extra sale:', '  the refund (module 19)'],
        story: 'For the last item, module 11 still applies: a <b>single owner</b> of the stock and the decrement with <code>UPDATE … AND quantidade &gt; 0</code>, which refuses the second sale. Or module 19: accept and <b>compensate</b> the extra sale with a refund. A CRDT suits what can grow without a rule, like the views; the stock has a rule.',
        look: 'SP becomes the owner of the stock. Recife\'s sale goes to SP and comes back refused: the mug stays at 0, not −1.',
        key: 'A business rule asks for an owner or a compensation, not a CRDT.',
        f(o, t) { const a = go_(t, 0.6, 1.8), b = go_(t, 2.0, 3.2), no = b >= 1; lit(o, 'sp');
          o.rows.sp = act('SP', 'STOCK OWNER', ['UPDATE … AND', 'dim'], ['quantidade > 0', 'acc'], ['mug: 0', 'acc']);
          o.rows.rio = act('Rio', 'ASKS THE OWNER', ['mug: 0', 'dim']);
          o.rows.rec = act('Recife', 'ASKS THE OWNER', [no ? 'sale refused' : a > 0 ? 'wants to sell 1' : 'mug: 0', no ? 'bad' : 'dim'], ['no −1', 'acc']);
          o.beams = [{ pts: CR.rio }, { pts: CR.rec, on: a > 0 && !no }];
          pk(o, rev(CR.rec), a, 'sell 1?'); pk(o, CR.rec, b, '0 rows: refused', 'bad');
          o.cnt = [['STOCK', '0'], ['SECOND SALE', no ? 'refused' : '…', no ? 'bad' : 'dim'], ['OR', 'refund (module 19)', 'dim']];
          o.res = no ? [['one owner: the stock never goes below 0', 'acc']] : []; } },
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
  // uma fita de células: acesa = presente, contorno = vazia, vermelha = erro, riscada = removida (o OR-Set)
  function drawTape(x, u, C, tape, W_, H_, label) {
    const n = Math.max(tape.length, 1), gap = 3, cw = Math.min(n > 6 ? 40 : 76, (W_ - 10 - gap * (n - 1)) / n), ch = 22, y0 = H_ - ch - 5, light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, label, 10, W_ - 10); x.fillText(label, u(5), u(y0 - 8));
    if (!tape.length) { x.strokeStyle = C.line; x.lineWidth = u(0.6); x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(5.5), u(y0 + 0.5), u(W_ - 11), u(ch - 1)); x.setLineDash([]);
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'empty', 11, 60); x.fillText('empty', u(W_ / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; return; }
    tape.forEach(([lab, s], i) => { const X = 5 + i * (cw + gap);
      if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(y0), u(cw), u(ch)); }
      x.strokeStyle = s === 'bad' ? BAD() : s === 'ok' ? accC() : C.line; x.lineWidth = u(0.6); x.strokeRect(u(X + 0.5), u(y0 + 0.5), u(cw - 1), u(ch - 1));
      if (lab) { x.textAlign = 'center'; x.fillStyle = s === 'ok' || s === 'bad' ? (light ? '#f6f6f5' : '#141516') : INK();
        fitFont(x, u, lab, 13, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left';
        if (s === 'off') { const tw = Math.min(cw - 4, x.measureText(lab).width / u(1)); x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.beginPath();
          x.moveTo(u(X + cw / 2 - tw / 2), u(y0 + ch / 2)); x.lineTo(u(X + cw / 2 + tw / 2), u(y0 + ch / 2)); x.stroke(); } } });
  }
  // a barra do disco: quanto do espaço livre o WAL retido já ocupou
  function drawBar(x, u, C, [fr, tn, lab], W_, H_) {
    const ch = 22, y0 = H_ - ch - 5, w = W_ - 10, col = tn === 'bad' ? BAD() : accC(), light = theme === 'light';
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, lab, 11, w); x.fillText(lab, u(5), u(y0 - 8));
    x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(5), u(y0), u(w), u(ch));
    x.fillStyle = col; x.fillRect(u(5), u(y0), u(w * clamp(fr)), u(ch));
    x.strokeStyle = col; x.lineWidth = u(0.8); x.strokeRect(u(5.5), u(y0 + 0.5), u(w - 1), u(ch - 1));
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, small = H_ < 80;
    head(x, u, d, W_, col, small ? 15 : 18); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(26)); x.lineTo(u(W_ - 4), u(26)); x.stroke();
    let y = small ? 40 : 41; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, small ? 14 : 16, W_ - 10); x.fillText(text, u(5), u(y)); } y += small ? 18 : 22; }
    if (d.tape) drawTape(x, u, C, d.tape, W_, H_, d.tl || 'WAL');
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
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    ecst: () => `<li><code>ClienteAtualizado</code> (compact JSON, <b>202 B</b>): <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8,"nome":"Lena","endereco":{"rua":"Rua da Aurora","numero":100,"cidade":"Recife","cep":"50050-000"},"atualizado_em":"2026-11-27T20:20:00.150-03:00"}</code></li><li>Notification (<b>56 B</b>): <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8}</code> + a <code>GET</code></li><table class="h3-sum"><tr><th>math</th><th>result</th></tr><tr><td>1.5 M × 500 B</td><td>750 MB per copy</td></tr><tr class="on"><td>1 owner + 3 consumers</td><td>3.0 GB</td></tr><tr><td>topic: 1.5 M × ~300 B</td><td>~450 MB</td></tr><tr><td>1,500,000 ÷ 20,000/s</td><td>75 s</td></tr></table><li>Kafka: <code>cleanup.policy=compact</code> keeps the last value of each key (<code>cliente_id</code>)</li><li>Fowler: ECST is one of the four "event-driven" patterns (with <i>event notification</i>, <i>event sourcing</i> and CQRS)</li>`,
    cdc: () => `<li>Real output of <code>test_decoding</code> (PostgreSQL 14, SDLabs lab):</li><li><code>BEGIN 759</code> · <code>table public.pedidos_cdc: INSERT: id[bigint]:1055 cliente_id[text]:'lena-77' cidade[text]:'Recife' total[numeric]:34.90 status[text]:'criado' …</code></li><li><code>table public.pedidos_cdc: UPDATE: id[bigint]:1055 … status[text]:'pago' …</code> · <code>COMMIT 759</code></li><li><code>BEGIN 760</code> · <code>table public.pedidos_cdc: DELETE: id[bigint]:1055</code> · <code>COMMIT 760</code></li><table class="h3-sum"><tr><th>identity</th><th>UPDATE</th><th>DELETE</th></tr><tr><td>DEFAULT</td><td>only the new row</td><td>only the key</td></tr><tr class="on"><td>FULL</td><td>old-key + new-tuple</td><td>the whole row</td></tr></table><li>Debezium: <code>op</code> = <code>c</code>, <code>u</code>, <code>d</code>, <code>r</code> (snapshot); topic <code>topic.prefix.schema.table</code> → <code>loja.public.pedidos</code></li><li>Polling every 5 s: the <code>INSERT</code> and the <code>UPDATE</code> 3 s apart become <b>1</b> record; the <code>DELETE</code> vanishes</li>`,
    outbox: () => `<table class="h3-sum"><tr><th>moment</th><th>dual write</th><th>outbox</th></tr><tr><td>20:10:00.000</td><td>INSERT 1055</td><td>pedidos + outbox, 1 COMMIT</td></tr><tr class="on"><td>20:10:00.004</td><td>crashes: no PedidoCriado</td><td>crashes: the event is in the log</td></tr><tr><td>mug stock</td><td>37 (wrong)</td><td>36</td></tr></table><li>microservices.io, <i>Transactional Outbox</i>: writes the event to a table in the same transaction and publishes afterwards</li><li>Debezium reads the <code>outbox</code> table in the WAL, like any other</li>`,
    slot: () => `<table class="h3-sum"><tr><th>math</th><th>result</th></tr><tr><td>6,709,592 B ÷ 20,000 (measured)</td><td>335 B per order</td></tr><tr><td>335 B × 30/s</td><td>~10 KB/s, 36 MB/h</td></tr><tr><td>1 KB × 30 × 3,600 s (example)</td><td>108 MB/h</td></tr><tr class="on"><td>60,000 MB ÷ 108 MB/h</td><td>555 h ≈ 23 days</td></tr></table><li><code>pg_replication_slots</code> after the load, with no consumer: <code>wal_status = reserved</code>, <b>6,552 kB</b> retained</li><li><code>max_slot_wal_keep_size</code>: default <b>-1</b> (unlimited)</li><li>Debezium: "WAL disk space consumption" section of the PostgreSQL connector</li>`,
    'crdt-contador': () => `<table class="h3-sum"><tr><th>state</th><th>SP</th><th>Rio</th><th>Recife</th><th>total</th></tr><tr><td>before</td><td>120</td><td>80</td><td>50</td><td>250</td></tr><tr><td>SP in the partition</td><td>135</td><td>80</td><td>50</td><td>265</td></tr><tr><td>Recife in the partition</td><td>120</td><td>80</td><td>58</td><td>258</td></tr><tr class="on"><td>merge (max.)</td><td>135</td><td>80</td><td>58</td><td>273</td></tr></table><li>LWW on the total: 265 or 258, loses <b>8</b> or <b>15</b></li><li>Test (<code>crdt.py</code>): 5 messages, <b>120</b> permutations, with duplicates → 1 final state</li>`,
    'crdt-carrinho': () => `<table class="h3-sum"><tr><th>site</th><th>in the partition</th><th>merge</th></tr><tr><td>SP (laptop)</td><td>− caneca → {}</td><td>{gato}</td></tr><tr><td>Recife (phone)</td><td>+ gato → {caneca, gato}</td><td>{gato}</td></tr><tr class="on"><td>remove × add again</td><td>#a removed, #c new</td><td>{caneca} (add wins)</td></tr></table><li>OR-Set: each addition has a tag; the removal only deletes the tags it saw</li>`,
    'crdt-limite': () => `<table class="h3-sum"><tr><th></th><th>SP</th><th>Rio</th><th>Recife</th><th>sum</th></tr><tr><td>P (inflows)</td><td>1</td><td>0</td><td>0</td><td>1</td></tr><tr class="on"><td>N (outflows)</td><td>1</td><td>0</td><td>1</td><td>2</td></tr></table><li>Value: 1 − 2 = <b>−1</b>, the same on all three sites: it converged and violated "stock ≥ 0"</li><li>Ways out: a single owner with <code>UPDATE … AND quantidade &gt; 0</code> (module 11) or the refund (module 19)</li>`,
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
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'fluxo') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'fluxo' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-fluxo3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'fluxo') return;
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
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
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
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
