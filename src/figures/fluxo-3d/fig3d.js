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
FIGS3D.push({ id: 'fluxo', name: 'Fluxo de dados', mod: (() => {
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
  const SC = ['ecst', 'cdc', 'outbox', 'slot', 'crdt-contador', 'crdt-carrinho', 'crdt-limite'];
  const SCNAME = { ecst: 'ECST', cdc: 'CDC', outbox: 'Outbox', slot: 'Slot', 'crdt-contador': 'Contador', 'crdt-carrinho': 'Carrinho', 'crdt-limite': 'Limite' };
  const SCFULL = { ecst: 'Event-Carried State Transfer', cdc: 'CDC: o log vira evento', outbox: 'Outbox: sem escrita dupla', slot: 'O slot esquecido',
    'crdt-contador': 'CRDT: o G-Counter', 'crdt-carrinho': 'CRDT: o carrinho (OR-Set)', 'crdt-limite': 'CRDT: o limite (PN-Counter)' };
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
  const COPY = { v7: ['v7 · endereço anterior', 'dim'], v8: ['v8 · Rua da Aurora, 100', 'acc'], v9: ['v9 · Rua do Sol, 200', 'acc'] };
  const copy = (nm, v, extra) => act(nm, 'CÓPIA DE lena-77', v, extra);
  const TOPIC = (st8 = 'none', lab = 'lena-77 v7') => [['…', 'none'], ['…', 'none'], [lab, st8]];
  // CDC: a fita do WAL e as esteiras de eventos
  const WALC = (...cells) => [['1054', 'ok'], ...cells];
  // CRDT: um campo por site
  const GC = (s, r, c, hi = '') => [['SP ' + s, hi.includes('s') ? 'ok' : 'none'], ['Rio ' + r, hi.includes('r') ? 'ok' : 'none'], ['Rec ' + c, hi.includes('c') ? 'ok' : 'none']];
  const gnode = (nm, meta, s, r, c, hi, tone = 'acc') => withTape(act(nm, meta, ['visualizações do gato 42', 'dim'], ['total ' + (s + r + c), tone]), 'um contador por site', GC(s, r, c, hi));
  const snode = (nm, meta, set, cells, tone = 'acc') => withTape(act(nm, meta, ['carrinho da Lena', 'dim'], [set, tone]), 'etiquetas', cells);
  const pnode = (nm, meta, n, tone = 'acc', hi = '') => withTape(act(nm, meta, [`P 1 · N ${n[0] + n[1] + n[2]}`, 'dim'], ['estoque: ' + String(1 - n[0] - n[1] - n[2]).replace('-', '−'), tone]),
    'N (saídas) por site', [['SP ' + n[0], hi.includes('s') ? 'ok' : 'none'], ['Rio ' + n[1], hi.includes('r') ? 'ok' : 'none'], ['Rec ' + n[2], hi.includes('c') ? (tone === 'bad' ? 'bad' : 'ok') : 'none']]);
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    if (fam() === 'E') {
      show('cli', 'top', 'ped', 'ent', 'not');
      o.rows.cli = act('clientes', 'DONO', ['cadastro de clientes', 'dim'], ['lena-77 · v7', 'hi'], ['endereço anterior', 'dim']);
      o.rows.top = withTape(act('tópico clientes', 'KAFKA'), 'compactado: última versão de cada chave', TOPIC());
      o.rows.ped = copy('pedidos', COPY.v7); o.rows.ent = copy('entregas', COPY.v7); o.rows.not = copy('notificacoes', COPY.v7);
      o.beams.push({ pts: CE.pub }, { pts: CE.ped }, { pts: CE.ent }, { pts: CE.not });
    } else if (fam() === 'C') {
      show('db', 'dbz', 'tlog', 'app');
      if (sc === 'cdc') show('poll', 'tpol'); if (sc === 'outbox') show('est'); if (sc === 'slot') show('disk');
      o.rows.app = act('pedidos', 'SERVIÇO', ['grava os pedidos', 'dim']);
      o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['wal_level = logical', 'dim']), 'WAL', WALC());
      o.rows.dbz = act('Debezium', 'LÊ O LOG', ['pelo slot de replicação', 'dim']);
      o.rows.poll = act('polling', 'A CADA 5 s', ['"o que mudou?"', 'dim']);
      o.rows.tlog = withTape(act('loja.public.pedidos', 'PELO LOG'), 'eventos', []);
      o.rows.tpol = withTape(act('cópia pelo polling', 'PELO POLLING'), 'eventos', []);
      o.rows.est = act('estoque', 'CONSUMIDOR', ['caneca azul', 'dim'], ['37 unidades', 'hi']);
      o.rows.disk = act('disco do pg-sp', '60 GB LIVRES', ['WAL retido pelo slot', 'dim']); o.rows.disk.bar = [0.01, 'acc', '~0'];
      o.beams.push({ pts: CC.app }, { pts: CC.dbz }, { pts: CC.tlog });
      if (sc === 'cdc') o.beams.push({ pts: CC.poll }, { pts: CC.tpol });
      if (sc === 'outbox') o.beams.push({ pts: CC.est });
      if (sc === 'slot') o.beams.push({ pts: CC.disk });
    } else {
      show('sp', 'rio', 'rec'); if (sc === 'crdt-carrinho') show('nb', 'cel');
      if (sc === 'crdt-contador') { o.rows.sp = gnode('SP', 'G-COUNTER', 120, 80, 50); o.rows.rio = gnode('Rio', 'G-COUNTER', 120, 80, 50); o.rows.rec = gnode('Recife', 'G-COUNTER', 120, 80, 50); }
      if (sc === 'crdt-carrinho') { const c = [['caneca#a', 'ok']];
        o.rows.sp = snode('SP', 'OR-SET', '{caneca}', c); o.rows.rio = snode('Rio', 'OR-SET', '{caneca}', c); o.rows.rec = snode('Recife', 'OR-SET', '{caneca}', c);
        o.rows.nb = act('notebook', 'LENA · SP', ['carrinho: {caneca}', 'dim']); o.rows.cel = act('celular', '', ['da Lena, em Recife', 'dim'], ['{caneca}', 'dim']);
        o.beams.push({ pts: CR.nb }, { pts: CR.cel }); }
      if (sc === 'crdt-limite') { const z = [0, 0, 0]; o.rows.sp = pnode('SP', 'PN-COUNTER', z); o.rows.rio = pnode('Rio', 'PN-COUNTER', z); o.rows.rec = pnode('Recife', 'PN-COUNTER', z); }
      o.beams.push({ pts: CR.rio }, { pts: CR.rec });
    }
    return o;
  }
  // a rede entre SP e Recife: cortada (vermelha) ou de volta
  const cut = o => { o.beams = o.beams.map(b => b.pts === CR.rec ? { pts: CR.rec, tone: 'bad' } : b); T(o, [425, 315, 44], 'partição', 'bad'); };

  // ── o que se vê em cada passo ──
  const STEPS = {
    ecst: [
      { id: 'sem', dur: 5, title: 'Sem eventos: um GET por pedido, ~7 ms', yk: 'A CHAMADA AO DONO',
        code: ['GET /clientes/lena-77', '  salto ~5 ms + consulta 2 ms ≈ 7 ms', '  a cada pedido', 'clientes fora do ar → entregas para'],
        story: 'O <code>clientes</code> é o dono do cadastro. Hoje o <code>entregas</code> pergunta a ele o endereço da Lena a cada pedido: <code>GET /clientes/lena-77</code>, um salto de uns <b>5 ms</b> mais a consulta de <b>2 ms</b>, cerca de <b>7 ms</b>. Se o <code>clientes</code> cair, o <code>entregas</code> para junto.',
        look: 'A luz vai do entregas ao clientes pelo cabo que passa por cima da esteira e volta com o endereço. A esteira do tópico, no meio, ainda não é usada.',
        key: 'Sem cópia, quem precisa do dado depende do dono a cada leitura.',
        f(o, t) { lit(o, 'ent'); o.on.cli = 2; const ph = (t * 0.45) % 1;
          o.rows.ped = act('pedidos', 'SERVIÇO', ['sem cópia', 'dim']); o.rows.not = act('notificacoes', 'SERVIÇO', ['sem cópia', 'dim']);
          o.rows.ent = act('entregas', 'SERVIÇO', ['sem cópia local', 'dim'], ['GET a cada pedido', 'acc']);
          o.rows.top = withTape(act('tópico clientes', 'KAFKA'), 'ainda vazio', [['', 'none'], ['', 'none'], ['', 'none']]);
          o.beams.push({ pts: CE.get, on: true });
          if (ph < 0.5) pk(o, CE.get, ph * 2, 'GET lena-77'); else pk(o, rev(CE.get), (ph - 0.5) * 2, 'endereço · ~7 ms');
          o.cnt = [['POR PEDIDO', '~7 ms'], ['SALTO', '~5 ms', 'dim'], ['CONSULTA', '2 ms', 'dim']];
          o.res = [['o entregas depende do clientes', 'acc']]; } },
      { id: 'publica', dur: 6, title: 'A Lena muda o endereço: ClienteAtualizado, 202 B', yk: 'O EVENTO (202 B)',
        code: ['{"evento_id":"e-1701","cliente_id":"lena-77",', ' "versao":8,"nome":"Lena","endereco":{', '  "rua":"Rua da Aurora","numero":100,', '  "cidade":"Recife","cep":"50050-000"},', ' "atualizado_em":"2026-11-27T20:20:00.150-03:00"}'],
        story: 'A Lena muda o endereço para "Rua da Aurora, 100". O <code>clientes</code> grava a <b>versão 8</b> e publica <code>ClienteAtualizado</code> com o <b>estado inteiro</b> do cliente: <b>202 bytes</b>. O tópico <code>clientes</code> é compactado (<code>cleanup.policy=compact</code>): o Kafka guarda o último valor de cada chave, e a chave é o <code>cliente_id</code>.',
        look: 'O evento sai do clientes e anda pela esteira até a célula da chave lena-77, que passa de v7 a v8.',
        key: 'O evento leva o estado inteiro, não só o aviso de que algo mudou.',
        f(o, t) { const f = go_(t, 0.9, 3.2), in_ = f >= 1; lit(o, 'cli'); if (in_) lit(o, 'top');
          o.rows.cli = act('clientes', 'DONO', ['lena-77 · v8', 'acc'], ['Rua da Aurora, 100', 'acc'], [in_ ? 'publicou: 202 B' : 'publicando…', 'dim']);
          o.rows.top.tape = TOPIC(in_ ? 'ok' : 'none', in_ ? 'lena-77 v8' : 'lena-77 v7');
          o.beams[0] = { pts: CE.pub, on: !in_ }; pk(o, CE.pub, f, 'ClienteAtualizado · 202 B');
          o.cnt = [['EVENTO', '202 B'], ['VERSÃO', '8', 'dim'], ['CHAVE', 'lena-77', 'dim']];
          o.res = in_ ? [['no tópico: lena-77 → v8', 'acc']] : []; } },
      { id: 'copias', dur: 7, title: 'As 3 cópias se atualizam', yk: 'CADA SERVIÇO, A SUA CÓPIA',
        code: ['pedidos       consome o tópico → cópia local', 'entregas      consome o tópico → cópia local', 'notificacoes  consome o tópico → cópia local', 'entre publicar e aplicar: segundos', 'com o endereço velho (consistência eventual)'],
        story: 'Os três serviços consomem o tópico e cada um aplica a v8 na <b>sua cópia</b>, numa tabela local. Entre o <code>clientes</code> publicar e o <code>entregas</code> aplicar passam alguns <b>segundos</b> em que a cópia ainda tem o endereço velho. É o BASE do módulo 3, escolhido de propósito: em troca, o <code>entregas</code> lê sem depender de ninguém.',
        look: 'O evento sai da ponta da esteira e chega aos três serviços, um de cada vez. Cada cópia troca de v7 para v8.',
        key: 'ECST: cada serviço guarda a sua cópia e deixa de chamar o dono.',
        f(o, t) { lit(o, 'top'); o.rows.cli = act('clientes', 'DONO', ['lena-77 · v8', 'acc'], ['Rua da Aurora, 100', 'acc']); o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          const W3 = [['ped', 'pedidos', 0.6, 2.2], ['ent', 'entregas', 1.2, 2.8], ['not', 'notificacoes', 1.8, 3.6]]; let n = 0;
          W3.forEach(([k, nm, a, b]) => { const f = go_(t, a, b), done = f >= 1; n += done; if (done) lit(o, k);
            o.rows[k] = copy(nm, done ? COPY.v8 : COPY.v7, [done ? 'aplicada' : 'endereço velho', 'dim']); pk(o, CE[k], f, k === 'ent' ? 'v8 · 202 B' : '');
            o.beams.push({ pts: CE[k], on: f > 0 && !done }); });
          o.cnt = [['CÓPIAS EM DIA', `${n} de 3`], ['ATRASO', 'segundos', 'dim'], ['EVENTO', '202 B', 'dim']];
          o.res = n === 3 ? [['3 cópias com a v8', 'acc']] : []; } },
      { id: 'notif', dur: 7, title: 'Estado inteiro (202 B) × notificação (56 B)', yk: 'AS DUAS FORMAS',
        code: ['estado inteiro: 202 B, nenhuma chamada', 'notificação: 56 B', '  {"evento_id":"e-1701",', '   "cliente_id":"lena-77","versao":8}', '  + um GET de volta ao clientes'],
        story: 'A outra forma é a <b>notificação</b>: <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8}</code>, só <b>56 bytes</b>. Ela avisa que algo mudou, mas não diz o quê, e obriga <b>mais uma chamada</b> de volta ao <code>clientes</code>. É a distinção do módulo 13: 202 B sem chamada, ou 56 B mais um <code>GET</code>.',
        look: 'Um evento menor, de 56 B, chega ao entregas, que precisa voltar ao clientes pelo cabo de cima para buscar o endereço.',
        key: 'A notificação é menor, mas põe o dono de volta no caminho.',
        f(o, t) { lit(o, 'top', 'ent'); o.on.cli = 2; o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          const a = go_(t, 0.5, 1.8), g = go_(t, 2.0, 3.2), r = go_(t, 3.4, 4.6);
          pk(o, CE.ent, a, 'notificação · 56 B'); pk(o, CE.get, g, 'GET lena-77'); pk(o, rev(CE.get), r, 'Rua da Aurora, 100');
          o.beams.push({ pts: CE.get, on: g > 0 && r < 1 });
          o.rows.ent = act('entregas', 'NOTIFICAÇÃO', ['recebeu 56 B: só o id', a >= 1 ? 'acc' : 'dim'], [r >= 1 ? 'buscou: Rua da Aurora, 100' : g > 0 ? 'GET ao clientes…' : 'falta o endereço', r >= 1 ? 'acc' : 'dim']);
          o.cnt = [['ESTADO INTEIRO', '202 B'], ['NOTIFICAÇÃO', '56 B', 'dim'], ['CHAMADAS EXTRAS', g > 0 ? '1 GET' : '0', 'dim']];
          o.res = r >= 1 ? [['56 B + 1 GET ao clientes', 'acc']] : []; } },
      { id: 'custo', dur: 6, title: 'O custo: 4 cópias, 3,0 GB', yk: 'A CONTA',
        code: ['1,5 milhão × 500 B = 750 MB por cópia', '1 dono + 3 consumidores = 4 cópias = 3,0 GB', 'tópico: 1,5 M chaves × ~300 B ≈ 450 MB', 'consumidor novo lê do início:', '1.500.000 ÷ 20.000 eventos/s = 75 s'],
        story: 'O artigo chama o padrão de "custosa, porém poderosa", e a conta mostra onde: 1,5 milhão de clientes × 500 B = <b>750 MB</b> por cópia. Com 3 consumidores são <b>4 cópias, 3,0 GB</b>. O tópico compactado guarda 1,5 milhão de chaves, uns <b>450 MB</b>. Um consumidor novo lê o tópico do início para montar a sua cópia: a 20.000 eventos por segundo (exemplo), <b>75 s</b>.',
        look: 'Cada serviço acende com o tamanho da sua cópia, um de cada vez, e o contador soma até 3,0 GB.',
        key: 'O preço do ECST é espaço: o cadastro inteiro em cada serviço.',
        f(o, t) { const n = Math.min(4, 1 + Math.floor(lin(t, 0.5, 4.5, 0, 3.99))), ORD = ['cli', 'ped', 'ent', 'not'], NM = { cli: 'clientes', ped: 'pedidos', ent: 'entregas', not: 'notificacoes' };
          ORD.forEach((k, i) => { const on = i < n; if (on) lit(o, k); o.rows[k] = act(NM[k], i ? 'CÓPIA' : 'DONO', ['1,5 M clientes', 'dim'], [on ? '750 MB' : '…', on ? 'acc' : 'dim']); });
          o.rows.top = withTape(act('tópico clientes', 'KAFKA'), 'compactado: 1,5 M chaves, ~450 MB', TOPIC('ok', 'lena-77 v8'));
          o.cnt = [['ESPAÇO', ['750 MB', '1,5 GB', '2,25 GB', '3,0 GB'][n - 1]], ['CÓPIAS', String(n), 'dim'], ['CONSUMIDOR NOVO', '75 s', 'dim']];
          o.res = n === 4 ? [['4 cópias = 3,0 GB', 'acc']] : []; } },
      { id: 'cai', dur: 6, title: 'O clientes cai, e os outros seguem', yk: 'O DONO FORA DO AR',
        code: ['clientes: fora do ar', 'entregas lê a cópia local:', '  lena-77 → Rua da Aurora, 100', 'sem GET, sem erro', 'sem eventos, o GET falharia'],
        story: 'Agora o <code>clientes</code> cai. O <code>entregas</code> continua: o endereço da Lena está na cópia local, e a entrega sai para "Rua da Aurora, 100". O <code>pedidos</code> e o <code>notificacoes</code> também seguem. Sem eventos, o mesmo <code>GET</code> falharia e o <code>entregas</code> pararia.',
        look: 'O clientes fica vermelho e o cabo de cima, do GET, também. Os três serviços continuam acesos, cada um lendo a própria cópia.',
        key: 'Com a cópia local, a queda do dono não derruba quem lê.',
        f(o, t) { const down = t > 0.7; o.on.cli = down ? 'bad' : 1; lit(o, 'ped', 'ent', 'not'); o.rows.top.tape = TOPIC('ok', 'lena-77 v8');
          o.rows.cli = act('clientes', down ? 'FORA DO AR' : 'DONO', [down ? 'não responde' : 'lena-77 · v8', down ? 'bad' : 'acc']);
          o.rows.ped = copy('pedidos', COPY.v8); o.rows.not = copy('notificacoes', COPY.v8);
          o.rows.ent = copy('entregas', COPY.v8, [down ? 'lê a cópia: segue' : 'lê a cópia local', 'acc']);
          o.beams.push({ pts: CE.get, tone: down ? 'bad' : '' });
          o.cnt = [['CLIENTES', down ? 'fora do ar' : 'no ar', down ? 'bad' : ''], ['SERVIÇOS NO AR', '3 de 3', 'dim'], ['GET', 'nenhum', 'dim']];
          o.res = down ? [['os 3 seguem com a cópia', 'acc']] : [];
          if (down) T(o, [715, 242, 50], 'entrega → Rua da Aurora, 100', 'acc'); } },
      { id: 'ordem', dur: 8, title: 'E se der errado: a v9 chega antes da v8', yk: 'REPARTICIONAMENTO 3 → 6',
        code: ['v8: Rua da Aurora, 100', 'v9: Rua do Sol, 200', 'o tópico passa de 3 para 6 partições', 'o entregas recebe a v9 e depois a v8', 'aplica às cegas → fica a v8 (velha)'],
        story: 'Mais tarde a Lena muda o endereço duas vezes: "Rua da Aurora, 100" (<b>v8</b>) e logo depois "Rua do Sol, 200" (<b>v9</b>). Por causa de um reparticionamento do tópico (de 3 para 6 partições, módulo 13), o <code>entregas</code> recebe a <b>v9 e depois a v8</b>. Se aplicar às cegas o que chegou por último, termina com a v8, o endereço <b>velho</b>, e a caneca vai para a casa errada.',
        look: 'Dois eventos saem da esteira para o entregas: o v9 passa na frente. A cópia vai a v9 e depois volta a v8, em vermelho.',
        key: 'Aplicar às cegas deixa a ordem de chegada escolher o endereço.',
        f(o, t) { const a = go_(t, 0.6, 2.2), b = go_(t, 2.6, 4.2), wrong = b >= 1; lit(o, 'top');
          o.rows.cli = act('clientes', 'DONO', ['lena-77 · v9', 'acc'], ['Rua do Sol, 200', 'acc']);
          o.rows.top = withTape(act('tópico clientes', 'KAFKA'), 'partições: 3 → 6', [['…', 'none'], ['v8', 'ok'], ['v9', 'ok']]);
          o.rows.ped = copy('pedidos', COPY.v9); o.rows.not = copy('notificacoes', COPY.v9);
          o.rows.ent = copy('entregas', wrong ? ['v8 · Rua da Aurora, 100', 'bad'] : a >= 1 ? COPY.v9 : COPY.v7, [wrong ? 'endereço velho' : 'aplica o que chega', wrong ? 'bad' : 'dim']);
          o.on.ent = wrong ? 'bad' : 1;
          pk(o, CE.ent, a, 'v9 · Rua do Sol'); pk(o, CE.ent, b, 'v8 · Rua da Aurora'); o.beams.push({ pts: CE.ent, on: a > 0 && !wrong });
          o.cnt = [['CÓPIA DO ENTREGAS', wrong ? 'v8' : a >= 1 ? 'v9' : 'v7', wrong ? 'bad' : ''], ['CHEGARAM', b > 0 ? 'v9, depois v8' : a > 0 ? 'v9' : '…', 'dim'], ['REGRA', 'nenhuma', 'bad']];
          o.res = wrong ? [['a v8 venceu a v9:', 'bad'], ['endereço velho', 'bad']] : [];
          if (wrong) T(o, TF(715), 'v8 venceu: endereço velho', 'bad'); } },
      { id: 'versao', dur: 7, title: 'Com a versão, a v8 é descartada', yk: 'APLICA SE A VERSÃO FOR MAIOR',
        code: ['regra: aplica só se a versao do evento', '       for maior que a da cópia', 'chega a v9: 9 > 7, aplica', 'chega a v8: 8 > 9? não, descarta', 'chega duplicado: igual, ignora'],
        story: 'Com a regra "aplica só se a <code>versao</code> do evento for maior que a da cópia", a v9 entra (9 &gt; 7) e a v8, que chega depois, é descartada (8 não é maior que 9). A cópia fica com "Rua do Sol, 200". O mesmo vale para o evento <b>duplicado</b>: a regra o ignora. Resta o outro lado: o <code>clientes</code> gravar e cair antes de publicar, a escrita dupla da aula 5.',
        look: 'A mesma ordem trocada. A v8 chega ao entregas em vermelho e fica de fora; a cópia continua na v9.',
        key: 'A versão no evento é a defesa contra a ordem trocada e a repetição.',
        f(o, t) { const a = go_(t, 0.6, 2.2), b = go_(t, 2.6, 4.2), drop = b >= 1; lit(o, 'top', 'ent');
          o.rows.cli = act('clientes', 'DONO', ['lena-77 · v9', 'acc'], ['Rua do Sol, 200', 'acc']);
          o.rows.top = withTape(act('tópico clientes', 'KAFKA'), 'partições: 3 → 6', [['…', 'none'], ['v8', 'ok'], ['v9', 'ok']]);
          o.rows.ped = copy('pedidos', COPY.v9); o.rows.not = copy('notificacoes', COPY.v9);
          o.rows.ent = copy('entregas', a >= 1 ? COPY.v9 : COPY.v7, [drop ? 'v8 < v9: descartada' : 'só se a versão for maior', drop ? 'acc' : 'dim']);
          pk(o, CE.ent, a, 'v9 · Rua do Sol'); pk(o, CE.ent, b, 'v8: descartada', 'bad'); o.beams.push({ pts: CE.ent, on: a > 0 && !drop });
          o.cnt = [['CÓPIA DO ENTREGAS', a >= 1 ? 'v9' : 'v7'], ['DESCARTADOS', drop ? '1 (v8)' : '0', 'dim'], ['REGRA', 'versao maior', 'dim']];
          o.res = drop ? [['fica a v9: Rua do Sol, 200', 'acc']] : [];
          if (drop) T(o, TF(715), 'v8 descartada: fica a v9', 'acc'); } },
    ],
    cdc: [
      { id: 'tres', dur: 5, title: 'Três jeitos de capturar uma mudança', yk: 'GATILHO, POLLING, LOG',
        code: ['gatilho: roda a cada escrita (escrita mais cara)', 'polling: a cada 5 s, "o que mudou?"', 'log:     lê o WAL, tudo, na ordem', 'wal_level = logical'],
        story: 'Para copiar o que muda no banco do <code>pedidos</code> sem mexer na aplicação, há três jeitos. O <b>gatilho</b> (trigger) roda dentro do banco a cada escrita e deixa a escrita mais cara. A <b>consulta periódica</b> (polling) pergunta de tempos em tempos "o que mudou?". A <b>leitura do log</b> usa o WAL, que já tem todas as mudanças, na ordem. A figura põe os dois últimos lado a lado.',
        look: 'À esquerda, o banco com a fita do WAL. Em cima, o leitor do log (o Debezium) e o tópico loja.public.pedidos; embaixo, o polling a cada 5 s e o que ele copiou.',
        key: 'O log do banco já é a lista de tudo o que mudou.',
        f(o, t) { lit(o, 'db');
          o.cnt = [['PELO LOG', '0 eventos'], ['PELO POLLING', '0 eventos', 'dim'], ['wal_level', 'logical', 'dim']];
          o.res = [['duas colunas para comparar', 'acc']]; } },
      { id: 'insert', dur: 6, title: '20:10:00: o INSERT do 1055, status criado', yk: 'test_decoding (BEGIN 759)',
        code: ['BEGIN 759', 'table public.pedidos_cdc: INSERT:', "  id:1055 cliente_id:'lena-77'", "  cidade:'Recife' total:34.90", "  status:'criado'"],
        story: 'Às 20:10:00 o <code>pedidos</code> grava o 1055 da Lena: 1 caneca azul, <b>34,90</b>, status <code>criado</code>. O <code>INSERT</code> entra no WAL. Com <code>wal_level = logical</code> o PostgreSQL decodifica o registro em linhas lógicas; o Debezium o lê pelo slot e publica um evento com <code>op</code> = <code>c</code> (criar) em <code>loja.public.pedidos</code>.',
        look: 'A célula INSERT acende na fita do WAL; o leitor a pega e um evento c entra na esteira de cima.',
        key: 'Cada escrita no banco vira um registro no log, e cada registro vira um evento.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.6, 2.4), c = go_(t, 2.6, 3.4), out = c >= 1; lit(o, 'db');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz'); if (out) lit(o, 'tlog');
          o.rows.app = act('pedidos', 'SERVIÇO', ['INSERT 1055 · criado', 'acc']);
          o.rows.db.tape = WALC(...(a >= 1 ? [['INSERT', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'LÊ O LOG', [b >= 1 ? 'INSERT 1055 → op c' : 'pelo slot de replicação', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = out ? [['c criado', 'ok']] : [];
          pk(o, CC.app, a, 'INSERT 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op c');
          o.cnt = [['PELO LOG', out ? '1 evento' : '0 eventos'], ['PELO POLLING', '0 eventos', 'dim'], ['RELÓGIO', '20:10:00', 'dim']];
          o.res = out ? [['c: 1055 criado, 34,90', 'acc']] : []; } },
      { id: 'update', dur: 6, title: '20:10:03: o UPDATE para pago', yk: 'test_decoding (COMMIT 759)',
        code: ['table public.pedidos_cdc: UPDATE:', "  id:1055 cliente_id:'lena-77' …", "  status:'pago'", 'COMMIT 759', 'Debezium: op = u'],
        story: 'Três segundos depois, às 20:10:03, o pagamento é aprovado e um <code>UPDATE</code> muda o status para <code>pago</code>. Mais um registro no WAL, mais um evento: <code>op</code> = <code>u</code>. Na esteira de cima já há <b>dois</b> eventos do 1055, na ordem: <code>criado</code> e <code>pago</code>.',
        look: 'A segunda célula acende no WAL e o segundo evento entra na esteira de cima, depois do primeiro.',
        key: 'O leitor do log vê cada mudança, mesmo a que durou três segundos.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.6, 2.4), c = go_(t, 2.6, 3.4), out = c >= 1; lit(o, 'db');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz'); lit(o, 'tlog');
          o.rows.app = act('pedidos', 'SERVIÇO', ['UPDATE 1055 · pago', 'acc']);
          o.rows.db.tape = WALC(['INSERT', 'ok'], ...(a >= 1 ? [['UPDATE', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'LÊ O LOG', [b >= 1 ? 'UPDATE 1055 → op u' : 'pelo slot de replicação', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = [['c criado', 'ok'], ...(out ? [['u pago', 'ok']] : [])];
          pk(o, CC.app, a, 'UPDATE 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op u');
          o.cnt = [['PELO LOG', out ? '2 eventos' : '1 evento'], ['PELO POLLING', '0 eventos', 'dim'], ['RELÓGIO', '20:10:03', 'dim']];
          o.res = out ? [['criado e pago, na ordem', 'acc']] : []; } },
      { id: 'polling', dur: 7, title: '20:10:05: o polling vê só o pago', yk: 'A CADA 5 s',
        code: ['20:10:00  INSERT  criado', '20:10:03  UPDATE  pago', '20:10:05  polling: "o que mudou?"', '          → 1 linha: 1055, pago', 'log: 2 eventos · polling: 1'],
        story: 'O polling roda a cada <b>5 s</b>. Às 20:10:05 ele pergunta "o que mudou?" e acha a linha do 1055 como ela está <b>agora</b>: <code>pago</code>. O <code>criado</code> de 20:10:00 existiu por três segundos e nunca foi visto. As duas colunas comparam: o log tem <b>dois</b> eventos, o polling tem <b>um</b>.',
        look: 'O relógio do polling chega a 20:10:05 e um único evento, pago, entra na esteira de baixo. Em cima continuam os dois.',
        key: 'O polling vê fotografias; o que mudou entre duas fotos some.',
        f(o, t) { const s = Math.floor(lin(t, 0.3, 2.6, 3, 5)), a = go_(t, 2.8, 3.5), b = go_(t, 3.7, 4.5), out = b >= 1; lit(o, 'db', 'tlog'); if (s >= 5) lit(o, 'poll'); if (out) lit(o, 'tpol');
          o.rows.db.tape = WALC(['INSERT', 'ok'], ['UPDATE', 'ok']); o.rows.tlog.tape = [['c criado', 'ok'], ['u pago', 'ok']];
          o.rows.poll = act('polling', 'A CADA 5 s', [`20:10:0${s}`, s >= 5 ? 'acc' : 'dim'], [s >= 5 ? '1 linha: 1055 pago' : 'esperando', s >= 5 ? 'acc' : 'dim']);
          o.rows.tpol.tape = out ? [['pago', 'ok']] : [];
          pk(o, CC.poll, a, '"o que mudou?"'); pk(o, CC.tpol, b, 'pago');
          o.cnt = [['PELO LOG', '2 eventos'], ['PELO POLLING', out ? '1 evento' : '0 eventos', out ? 'bad' : 'dim'], ['RELÓGIO', `20:10:0${s}`, 'dim']];
          o.res = out ? [['o criado nunca foi visto', 'bad']] : []; } },
      { id: 'identity', dur: 8, title: 'REPLICA IDENTITY: DEFAULT × FULL', yk: 'O before DO UPDATE',
        code: ['DEFAULT: o UPDATE traz só a linha nova', '         before = só a chave (id 1055)', 'ALTER TABLE pedidos_cdc REPLICA IDENTITY FULL;', "FULL:    old-key: … status:'criado'", "         new-tuple: … status:'pago'"],
        story: 'O que vem no evento depende da <b>identidade da réplica</b>. Com o padrão (<code>REPLICA IDENTITY DEFAULT</code>), o <code>UPDATE</code> traz só o valor <b>novo</b>, e no Debezium o <code>before</code> traz só a <b>chave</b>. Com <code>ALTER TABLE pedidos_cdc REPLICA IDENTITY FULL</code>, o <code>UPDATE</code> traz <code>old-key:</code> (a linha antiga inteira) e <code>new-tuple:</code>, e quem consome vê que o status saiu de <code>criado</code> para <code>pago</code>.',
        look: 'O evento u da esteira de cima muda: primeiro o before só tem a chave; depois do ALTER TABLE, traz a linha antiga.',
        key: 'Sem FULL, o evento diz como a linha ficou, não como estava.',
        f(o, t) { const full = t > 3.2; lit(o, 'db', 'dbz', 'tlog');
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['REPLICA IDENTITY', 'dim'], [full ? 'FULL' : 'DEFAULT', 'acc']), 'WAL', WALC(['INSERT', 'ok'], ['UPDATE', 'ok']));
          o.rows.dbz = act('Debezium', 'op u', [full ? 'before: status criado' : 'before: só id 1055', full ? 'acc' : 'dim'], ['after: status pago', 'acc']);
          o.rows.tlog.tape = [['c criado', 'ok'], [full ? 'u criado→pago' : 'u ?→pago', 'ok']];
          o.rows.tpol.tape = [['pago', 'ok']];
          o.cnt = [['IDENTIDADE', full ? 'FULL' : 'DEFAULT'], ['before', full ? 'linha antiga' : 'só a chave', 'dim'], ['after', 'status pago', 'dim']];
          o.res = full ? [['old-key + new-tuple', 'acc']] : [['before = só a chave', 'acc']];
          T(o, [715, 200, 40], full ? 'before: criado' : 'before: id 1055', 'acc'); } },
      { id: 'errado', dur: 8, title: 'E se der errado: o DELETE some no polling', yk: 'test_decoding (BEGIN 760)',
        code: ['BEGIN 760', 'table public.pedidos_cdc: DELETE: id[bigint]:1055', 'COMMIT 760', 'log: op = d (com DEFAULT, só a chave)', 'polling: a linha sumiu → nada a ver'],
        story: 'Agora o 1055 é apagado. No log o <code>DELETE</code> entra como mais um registro, e o Debezium publica <code>op</code> = <code>d</code>; com a identidade padrão, ele traz <b>só a chave</b>, <code>id 1055</code>. O polling seguinte procura linhas que mudaram e não acha nada, porque a linha <b>não existe mais</b>. Quem copia pelo polling fica com um pedido que já foi apagado.',
        look: 'A célula DELETE entra no WAL e vira um evento d na esteira de cima. Na de baixo nada chega: a cópia do polling continua com o 1055 pago, em vermelho.',
        key: 'O polling não vê o que foi apagado; o log vê.',
        f(o, t) { const a = go_(t, 0.4, 1.2), b = go_(t, 1.4, 2.1), c = go_(t, 2.3, 3.0), p = go_(t, 3.3, 4.1), miss = p >= 1; lit(o, 'db', 'tlog');
          if (a > 0 && a < 1) lit(o, 'app'); if (b > 0) lit(o, 'dbz');
          o.rows.app = act('pedidos', 'SERVIÇO', ['DELETE 1055', 'acc']);
          o.rows.db.tape = WALC(['INSERT', 'ok'], ['UPDATE', 'ok'], ...(a >= 1 ? [['DELETE', 'ok']] : []));
          o.rows.dbz = act('Debezium', 'LÊ O LOG', [b >= 1 ? 'DELETE → op d, id 1055' : 'pelo slot de replicação', b >= 1 ? 'acc' : 'dim']);
          o.rows.tlog.tape = [['c criado', 'ok'], ['u pago', 'ok'], ...(c >= 1 ? [['d 1055', 'ok']] : [])];
          o.rows.poll = act('polling', 'A CADA 5 s', [miss ? '0 linhas: a linha sumiu' : '"o que mudou?"', miss ? 'bad' : 'dim']); if (miss) o.on.poll = 'bad';
          o.rows.tpol = withTape(act('cópia pelo polling', 'PELO POLLING', miss ? ['ainda: 1055 pago', 'bad'] : null), 'eventos', [['pago', miss ? 'bad' : 'ok']]); if (miss) o.on.tpol = 'bad';
          pk(o, CC.app, a, 'DELETE 1055'); pk(o, CC.dbz, b, ''); pk(o, CC.tlog, c, 'op d'); pk(o, CC.poll, p, '"o que mudou?"');
          o.cnt = [['PELO LOG', c >= 1 ? '3 eventos' : '2 eventos'], ['PELO POLLING', '1 evento', 'bad'], ['O DELETE', miss ? 'perdido no polling' : '…', 'bad']];
          o.res = miss ? [['log: 3 eventos · polling: 1', 'bad'], ['a cópia ficou com o 1055', 'bad']] : [];
          if (miss) T(o, TF(715), 'o polling não viu o DELETE', 'bad'); } },
    ],
    outbox: [
      { id: 'dupla', dur: 6, title: 'Duas escritas em dois lugares', yk: 'A ESCRITA DUPLA',
        code: ['1. INSERT INTO pedidos … (1055)   → banco', '2. publica PedidoCriado            → Kafka', 'duas escritas, dois lugares', 'nada amarra uma à outra'],
        story: 'O <code>pedidos</code> precisa gravar o 1055 e avisar o mundo: o <code>estoque</code> baixa a caneca de <b>37 para 36</b> quando recebe o <code>PedidoCriado</code>. O jeito ingênuo grava no banco e depois publica no Kafka. São duas escritas em dois lugares: a <b>escrita dupla</b> (dual write).',
        look: 'Do serviço saem dois cabos: um para o banco e outro, direto, para o Kafka. Desta vez tudo dá certo e o estoque vai a 36.',
        key: 'Gravar e publicar são duas escritas, e nada as amarra.',
        f(o, t) { const a = go_(t, 0.4, 1.0), b = go_(t, 1.3, 2.7), c = go_(t, 2.9, 3.5), done = c >= 1; lit(o, 'app');
          if (a >= 1) lit(o, 'db'); if (b >= 1) lit(o, 'tlog'); if (done) lit(o, 'est');
          o.rows.app = act('pedidos', 'SERVIÇO', ['grava, depois publica', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', a >= 1 ? 'acc' : 'dim']), 'WAL', WALC(...(a >= 1 ? [['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('tópico de pedidos', 'KAFKA'), 'eventos', b >= 1 ? [['PedidoCriado', 'ok']] : []);
          o.rows.est = act('estoque', 'CONSUMIDOR', ['caneca azul', 'dim'], [done ? '36 unidades' : '37 unidades', done ? 'acc' : 'hi']);
          o.beams.push({ pts: CC.kafka, on: b > 0 && b < 1 });
          pk(o, CC.app, a, 'INSERT 1055'); pk(o, CC.kafka, b, 'PedidoCriado'); pk(o, CC.est, c, '');
          o.cnt = [['ESTOQUE DA CANECA', done ? '36' : '37'], ['ESCRITAS', '2 lugares', 'dim'], ['PEDIDO', '1055', 'dim']];
          o.res = done ? [['deu certo, desta vez', 'acc']] : []; } },
      { id: 'cai', dur: 7, title: 'E se der errado: o serviço cai às 20:10:00.004', yk: 'ENTRE AS DUAS ESCRITAS',
        code: ['20:10:00.000  INSERT 1055 → COMMIT', '20:10:00.004  o pedidos cai', '              o PedidoCriado nunca sai', 'estoque da caneca: 37 (devia ser 36)'],
        story: 'O <code>pedidos</code> grava o 1055 às 20:10:00.000, e às 20:10:00.004 o serviço cai <b>antes de publicar</b> o <code>PedidoCriado</code>. O pedido existe no banco, ninguém baixa o estoque, e a caneca fica em <b>37</b>, quando deveria ser <b>36</b>. Nenhum erro aparece: só um número errado.',
        look: 'O 1055 entra no banco; o serviço fica vermelho e o cabo para o Kafka também. O estoque continua em 37.',
        key: 'Na escrita dupla, a falha entre as duas escritas deixa os dados divergentes.',
        f(o, t) { const a = go_(t, 0.4, 1.2), ms = Math.round(lin(t, 1.2, 2.6, 0, 4)), down = ms >= 4; lit(o, 'db'); o.on.app = down ? 'bad' : 1;
          o.rows.app = act('pedidos', down ? 'CAIU' : 'SERVIÇO', [down ? 'caiu às 20:10:00.004' : `20:10:00.00${ms}`, down ? 'bad' : 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', a >= 1 ? 'acc' : 'dim']), 'WAL', WALC(...(a >= 1 ? [['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('tópico de pedidos', 'KAFKA', down ? ['nada chegou', 'bad'] : null), 'eventos', []);
          o.rows.est = act('estoque', 'CONSUMIDOR', ['caneca azul: 37', down ? 'bad' : 'hi'], [down ? 'devia ser 36' : 'esperando o evento', down ? 'bad' : 'dim']); if (down) o.on.est = 'bad';
          o.beams.push({ pts: CC.kafka, tone: down ? 'bad' : '' }); pk(o, CC.app, a, 'INSERT 1055');
          o.cnt = [['RELÓGIO', `20:10:00.00${ms}`, down ? 'bad' : ''], ['ESTOQUE DA CANECA', '37', down ? 'bad' : 'dim'], ['PedidoCriado', down ? 'nunca saiu' : '…', 'bad']];
          o.res = down ? [['o pedido existe, o aviso não', 'bad'], ['estoque 37: devia ser 36', 'bad']] : [];
          if (down) T(o, TF(410), 'caiu antes de publicar', 'bad'); } },
      { id: 'outbox', dur: 7, title: 'O outbox: as duas linhas na mesma transação', yk: 'UMA TRANSAÇÃO',
        code: ['BEGIN;', 'INSERT INTO pedidos … (1055, …);', "INSERT INTO outbox … ('PedidoCriado', …);", 'COMMIT;', '-- ou as duas linhas existem, ou nenhuma'],
        story: 'Com o <b>outbox</b>, o <code>pedidos</code> grava a tabela <code>pedidos</code> e uma tabela <code>outbox</code> na <b>mesma transação</b>. Ou as duas linhas existem, ou nenhuma. O serviço não fala mais com o Kafka: só com o banco.',
        look: 'Um cabo só sai do serviço, para o banco. No banco, as linhas pedidos 1055 e outbox PedidoCriado acendem juntas, no mesmo COMMIT.',
        key: 'Outbox: o aviso nasce na mesma transação que o dado.',
        f(o, t) { const a = go_(t, 0.5, 1.6), ok = a >= 1; lit(o, 'app'); if (ok) lit(o, 'db');
          o.rows.app = act('pedidos', 'SERVIÇO', ['uma transação só', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', ok ? 'acc' : 'dim'], ['outbox: PedidoCriado', ok ? 'acc' : 'dim']), 'WAL', WALC(...(ok ? [['pedidos', 'ok'], ['outbox', 'ok'], ['COMMIT', 'ok']] : [])));
          o.rows.tlog = withTape(act('tópico de pedidos', 'KAFKA'), 'eventos', []);
          pk(o, CC.app, a, 'BEGIN … COMMIT');
          o.cnt = [['LINHAS NO COMMIT', ok ? '2' : '…'], ['ESCRITAS DO SERVIÇO', '1 lugar', 'dim'], ['ESTOQUE DA CANECA', '37', 'dim']];
          o.res = ok ? [['pedido e aviso, juntos', 'acc']] : []; } },
      { id: 'publica', dur: 7, title: 'O CDC publica o outbox: o estoque vai a 36', yk: 'DO LOG PARA O KAFKA',
        code: ['20:10:00.000  COMMIT (pedidos + outbox)', '20:10:00.004  o pedidos cai: tanto faz', 'o Debezium lê a linha do outbox no WAL', 'publica PedidoCriado', 'estoque da caneca: 37 → 36'],
        story: 'O Debezium lê o WAL, acha a linha do <code>outbox</code> e publica o <code>PedidoCriado</code>. Se o serviço cair às 20:10:00.004, depois do commit, nada muda: o evento sai do log. Se o banco confirmou, o evento existe, e o <code>estoque</code> baixa a caneca de 37 para <b>36</b>.',
        look: 'O serviço fica vermelho (caiu), mas a luz sai do WAL, passa pelo Debezium e pela esteira e chega ao estoque, que mostra 36.',
        key: 'Se o banco confirmou, o evento existe.',
        f(o, t) { const a = go_(t, 0.8, 1.6), b = go_(t, 1.8, 2.6), c = go_(t, 2.8, 3.4), done = c >= 1; o.on.app = t > 0.4 ? 'bad' : 1; lit(o, 'db');
          if (a > 0) lit(o, 'dbz'); if (b >= 1) lit(o, 'tlog'); if (done) lit(o, 'est');
          o.rows.app = act('pedidos', t > 0.4 ? 'CAIU' : 'SERVIÇO', [t > 0.4 ? 'caiu às .004: tanto faz' : 'COMMIT feito', t > 0.4 ? 'bad' : 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['pedidos: 1055', 'acc'], ['outbox: PedidoCriado', 'acc']), 'WAL', WALC(['pedidos', 'ok'], ['outbox', 'ok'], ['COMMIT', 'ok']));
          o.rows.dbz = act('Debezium', 'LÊ O LOG', [a >= 1 ? 'achou a linha do outbox' : 'pelo slot de replicação', a >= 1 ? 'acc' : 'dim']);
          o.rows.tlog = withTape(act('tópico de pedidos', 'KAFKA'), 'eventos', b >= 1 ? [['PedidoCriado', 'ok']] : []);
          o.rows.est = act('estoque', 'CONSUMIDOR', ['caneca azul', 'dim'], [done ? '36 unidades' : '37 unidades', done ? 'acc' : 'hi']);
          pk(o, CC.dbz, a, 'outbox'); pk(o, CC.tlog, b, 'PedidoCriado'); pk(o, CC.est, c, '');
          o.cnt = [['ESTOQUE DA CANECA', done ? '36' : '37'], ['SERVIÇO', 'caiu', 'bad'], ['PedidoCriado', b >= 1 ? 'publicado' : '…', 'dim']];
          o.res = done ? [['o banco confirmou: o evento existe', 'acc']] : [];
          if (done) T(o, TF(715), 'estoque 37 → 36', 'acc'); } },
    ],
    slot: [
      { id: 'segura', dur: 6, title: 'O slot segura o log até o Debezium ler', yk: 'O SLOT DE REPLICAÇÃO',
        code: ['o slot marca até onde o Debezium leu', 'o PostgreSQL só recicla o WAL', '  que o slot já liberou', 'com o Debezium lendo, o WAL não acumula'],
        story: 'O Debezium lê o WAL por um <b>slot de replicação</b>. O slot guarda a posição até onde ele leu, e o PostgreSQL só pode reciclar o log que já passou dessa posição. Com o Debezium lendo, o WAL entra e sai: nada acumula.',
        look: 'Os registros saem da fita do WAL pelo leitor e seguem para a esteira. A barra do disco, embaixo à direita, fica perto de zero.',
        key: 'O slot é a promessa do banco: eu guardo até você ler.',
        f(o, t) { lit(o, 'app', 'db', 'dbz', 'tlog');
          o.rows.app = act('pedidos', 'SERVIÇO', ['30 pedidos/s', 'acc']);
          o.rows.db.tape = [['lido', 'none'], ['lido', 'none'], ['novo', 'ok']];
          o.rows.dbz = act('Debezium', 'LENDO', ['slot: active = t', 'acc']);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok'], ['c', 'ok'], ['u', 'ok']];
          o.beams = o.beams.map(b => b.pts === CC.dbz || b.pts === CC.tlog || b.pts === CC.app ? { pts: b.pts, on: true, flow: true } : b);
          o.cnt = [['WAL RETIDO', '~0'], ['SLOT', 'active = t', 'dim'], ['TAXA', '30 pedidos/s', 'dim']];
          o.res = [['o WAL entra e sai', 'acc']]; } },
      { id: 'para', dur: 7, title: 'O Debezium para, e o slot continua', yk: 'LABORATÓRIO: 20.000 PEDIDOS',
        code: ['20.000 × (INSERT + UPDATE + COMMIT)', 'WAL gerado: 6.709.592 bytes', '÷ 20.000 = 335 B por pedido', 'pg_replication_slots: wal_status = reserved', 'retido pelo slot: 6.552 kB'],
        story: 'O Debezium para, e ninguém desliga o slot. O PostgreSQL <b>guarda tudo</b>. No laboratório do SDLabs, 20.000 pedidos (cada um com 1 <code>INSERT</code>, 1 <code>UPDATE</code> e 1 <code>COMMIT</code>) geraram <b>6.709.592 bytes</b> de WAL: <b>335 por pedido</b>. O <code>pg_replication_slots</code> mostrou o slot sem consumidor com <code>wal_status = reserved</code> e <b>6.552 kB</b> retidos.',
        look: 'O Debezium fica vermelho, parado. As células da fita se acumulam acesas e a barra do disco começa a encher.',
        key: 'Slot sem consumidor: o banco guarda o log para alguém que não vem.',
        f(o, t) { const n = Math.round(lin(t, 0.6, 4.6, 0, 20000)), kB = Math.round(n * 6709592 / 20000 / 1024); lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVIÇO', [`${thou(n)} pedidos`, 'acc']);
          o.rows.db.tape = Array.from({ length: Math.max(1, Math.ceil(n / 2000)) }, () => ['', 'ok']);
          o.rows.dbz = act('Debezium', 'PARADO', ['slot: active = f', 'bad']);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('disco do pg-sp', '60 GB LIVRES', ['wal_status = reserved', 'acc']); o.rows.disk.bar = [0.02 + n / 20000 * 0.02, 'acc', `${thou(kB)} kB retidos`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: true, flow: true });
          o.cnt = [['RETIDO', `${thou(kB)} kB`], ['PEDIDOS', thou(n), 'dim'], ['WAL POR PEDIDO', '335 B', 'dim']];
          o.res = n >= 20000 ? [['6.709.592 B ÷ 20.000 = 335 B', 'acc']] : []; } },
      { id: 'taxa', dur: 6, title: 'Na loja: 36 MB por hora, 108 com 1 KB', yk: 'A TAXA',
        code: ['335 B × 30 pedidos/s ≈ 10 KB/s', '10 KB/s × 3.600 s ≈ 36 MB/h', 'com 1 KB por pedido (exemplo):', '1 KB × 30 × 3.600 s = 108 MB/h'],
        story: 'Na loja, a 30 pedidos por segundo, 335 B por pedido dão <b>10 KB/s</b>, ou <b>36 MB/h</b>. Um pedido de verdade tem itens e índices; com 1 KB por pedido (exemplo), <b>108 MB/h</b>.',
        look: 'O relógio corre um dia inteiro e o contador de MB do disco sobe hora a hora.',
        key: 'Um slot esquecido cresce no ritmo das escritas.',
        f(o, t) { const h = Math.floor(lin(t, 0.5, 4.5, 0, 24)); lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVIÇO', ['30 pedidos/s', 'acc']);
          o.rows.db.tape = Array.from({ length: 10 }, () => ['', 'ok']);
          o.rows.dbz = act('Debezium', 'PARADO', ['slot: active = f', 'bad']); o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('disco do pg-sp', '60 GB LIVRES', [`depois de ${h} h`, 'dim']); o.rows.disk.bar = [0.04 + 108 * h / 60000, 'acc', `${thou(108 * h)} MB retidos`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: true, flow: true });
          o.cnt = [['RETIDO (1 KB)', `${thou(108 * h)} MB`], ['A 335 B', `${thou(36 * h)} MB`, 'dim'], ['TEMPO', `${h} h`, 'dim']];
          o.res = h >= 24 ? [['108 MB/h × 24 h = 2.592 MB', 'acc']] : []; } },
      { id: 'disco', dur: 8, title: 'E se der errado: 60 GB acabam em 23 dias', yk: 'O DISCO',
        code: ['60 GB livres (módulo 16)', '60.000 MB ÷ 108 MB/h = 555 h', '555 h ÷ 24 ≈ 23 dias', 'max_slot_wal_keep_size = -1', '  (padrão: ilimitado)'],
        story: 'Com <b>60 GB</b> livres (módulo 16) e 108 MB/h, o disco acaba em 60.000 ÷ 108 = <b>555 h</b>, cerca de <b>23 dias</b>. O slot esquecido é um problema <b>lento</b>, não um incêndio, e por isso passa despercebido. Por padrão, <code>max_slot_wal_keep_size</code> vale <code>-1</code>: ilimitado.',
        look: 'A barra do disco enche dia a dia até ficar vermelha no dia 23.',
        key: 'O slot esquecido enche o disco devagar, sem alarme.',
        f(o, t) { const d = lin(t, 0.5, 6, 0, 555 / 24), full = d >= 555 / 24 - 0.01, mb = Math.min(60000, 108 * 24 * d); lit(o, 'app', 'db'); o.on.dbz = 'bad'; o.on.disk = full ? 'bad' : 1;
          o.rows.app = act('pedidos', 'SERVIÇO', ['30 pedidos/s', 'acc']);
          o.rows.db.tape = Array.from({ length: 10 }, () => ['', full ? 'bad' : 'ok']);
          o.rows.dbz = act('Debezium', 'PARADO', [`há ${Math.floor(d)} dias`, 'bad']); o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('disco do pg-sp', full ? 'CHEIO' : '60 GB LIVRES', [full ? 'sem espaço' : `dia ${Math.floor(d)}`, full ? 'bad' : 'dim']); o.rows.disk.bar = [mb / 60000, full ? 'bad' : 'acc', `${thou(mb)} de 60.000 MB`];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: !full, flow: true, tone: full ? 'bad' : '' });
          o.cnt = [['DIAS', full ? '23' : String(Math.floor(d)), full ? 'bad' : ''], ['RETIDO', `${thou(mb / 1000)} GB`, 'dim'], ['LIMITE DO SLOT', '-1 (nenhum)', 'bad']];
          o.res = full ? [['555 h ≈ 23 dias: disco cheio', 'bad']] : [];
          if (full) T(o, TF(715), 'disco cheio no dia 23', 'bad'); } },
      { id: 'defesa', dur: 7, title: 'A defesa: monitorar e pôr um teto', yk: 'pg_replication_slots',
        code: ['SELECT slot_name, active, wal_status', '  FROM pg_replication_slots;', 'alerta: active = f e bytes retidos subindo', 'max_slot_wal_keep_size: um teto', 'passou do teto: wal_status = lost'],
        story: 'A defesa é monitorar <code>pg_replication_slots</code> (<code>wal_status</code> e os bytes retidos) e limitar o estrago com <code>max_slot_wal_keep_size</code>, que por padrão vale <code>-1</code>, ilimitado. Com um teto, o banco para de guardar o log para o slot quando passa do limite: o slot fica <code>lost</code> e o CDC precisa recomeçar com um snapshot, mas o disco do primário fica salvo. A documentação do Debezium tem uma seção "WAL disk space consumption" sobre isso.',
        look: 'O alerta acende no Debezium parado; a barra do disco para no teto, longe do fim.',
        key: 'Slot é coisa de monitorar, e com teto.',
        f(o, t) { const al = t > 0.8, cap = t > 2.4; lit(o, 'app', 'db', 'disk'); o.on.dbz = 'bad';
          o.rows.app = act('pedidos', 'SERVIÇO', ['30 pedidos/s', 'acc']);
          o.rows.db = withTape(act('pg-sp · pedidos', 'POSTGRESQL', ['max_slot_wal_keep_size', 'dim'], [cap ? 'com teto' : '-1 (ilimitado)', cap ? 'acc' : 'bad']), 'WAL', Array.from({ length: 4 }, () => ['', 'ok']));
          o.rows.dbz = act('Debezium', 'PARADO', [al ? 'ALERTA: active = f' : 'slot: active = f', 'bad'], cap ? ['wal_status = lost', 'bad'] : null);
          o.rows.tlog.tape = [['c', 'ok'], ['u', 'ok']];
          o.rows.disk = act('disco do pg-sp', '60 GB LIVRES', [cap ? 'parou no teto' : 'retido subindo', cap ? 'acc' : 'dim']); o.rows.disk.bar = [cap ? 0.12 : lin(t, 0, 2.4, 0.04, 0.12), 'acc', cap ? 'teto: o disco fica salvo' : 'retido subindo'];
          o.beams = o.beams.map(b => b.pts === CC.dbz ? { pts: CC.dbz, tone: 'bad' } : b.pts === CC.app ? { pts: CC.app, on: true, flow: true } : b);
          o.beams.push({ pts: CC.disk, on: !cap, flow: true });
          o.cnt = [['ALERTA', al ? 'slot parado' : '…', al ? 'bad' : 'dim'], ['TETO', cap ? 'ativo' : '-1', cap ? '' : 'bad'], ['wal_status', cap ? 'lost' : 'reserved', 'dim']];
          o.res = cap ? [['o CDC refaz o snapshot;', 'acc'], ['o disco fica salvo', 'acc']] : [];
          if (al) T(o, [420, 200, 52], 'ALERTA: slot parado', 'bad'); } },
    ],
    'crdt-contador': [
      { id: 'g', dur: 6, title: 'G-Counter: um contador por site', yk: 'O ESTADO',
        code: ['visualizacoes do gato 42:', '{SP: 120, Rio: 80, Recife: 50}', 'total = soma = 250', 'cada site só soma no próprio campo'],
        story: 'As <code>visualizacoes</code> do gato 42 são contadas nos três sites, e cada site aceita escrita. O <b>G-Counter</b> (só cresce) guarda <b>um contador por site</b>: <code>{SP: 120, Rio: 80, Recife: 50}</code>. O total é a soma, <b>250</b>, e cada site só incrementa o <b>seu</b> campo.',
        look: 'Os três nós mostram o mesmo estado: três células, uma por site, e o total 250.',
        key: 'No G-Counter cada site é dono do seu pedaço do contador.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['TOTAL', '250'], ['SITES', '3', 'dim'], ['ESTADO', 'igual nos 3', 'dim']];
          o.res = [['{SP: 120, Rio: 80, Recife: 50}', 'acc']]; } },
      { id: 'particao', dur: 8, title: 'A partição: SP conta +15, Recife +8', yk: 'SEM REDE ENTRE SP E RECIFE',
        code: ['SP:     {SP: 135, Rio: 80, Recife: 50} = 265', 'Recife: {SP: 120, Rio: 80, Recife: 58} = 258', 'o Rio recebe o estado de SP: 265', 'cada lado vê um total diferente'],
        story: 'A rede entre SP e Recife cai. Os dois continuam aceitando visualizações: SP conta <b>+15</b> (<code>SP: 135</code>, total 265) e Recife conta <b>+8</b> (<code>Recife: 58</code>, total 258). O Rio, ainda ligado a SP, recebe o estado de SP. Por enquanto cada lado vê um total diferente.',
        look: 'O cabo de Recife fica vermelho. A célula de SP sobe até 135 e a de Recife até 58, cada uma no seu nó.',
        key: 'Na partição, cada site continua contando no próprio campo.',
        f(o, t) { const s = 120 + Math.round(lin(t, 0.6, 3.8, 0, 15)), c = 50 + Math.round(lin(t, 0.8, 3.8, 0, 8)); lit(o, 'sp', 'rec', 'rio'); cut(o);
          o.rows.sp = gnode('SP', 'G-COUNTER', s, 80, 50, 's'); o.rows.rio = gnode('Rio', 'G-COUNTER', s, 80, 50, 's'); o.rows.rec = gnode('Recife', 'G-COUNTER', 120, 80, c, 'c');
          o.beams = o.beams.map(b => b.pts === CR.rio ? { pts: CR.rio, on: true, flow: true } : b);
          o.cnt = [['TOTAL EM SP', String(s + 130)], ['TOTAL EM RECIFE', String(c + 200), 'dim'], ['REDE SP–RECIFE', 'cortada', 'bad']];
          o.res = s === 135 && c === 58 ? [['265 em SP · 258 em Recife', 'acc']] : []; } },
      { id: 'juncao', dur: 8, title: 'A rede volta: máximo por site, 273', yk: 'A JUNÇÃO',
        code: ['junção = máximo por site', 'SP:     máx(135, 120) = 135', 'Rio:    máx(80, 80)   = 80', 'Recife: máx(50, 58)   = 58', '135 + 80 + 58 = 273'],
        story: 'A rede volta e os estados se cruzam. A <b>junção é o máximo por site</b>: <code>{SP: 135, Rio: 80, Recife: 58}</code>, total <b>273</b>. Dá o mesmo nos dois sentidos (SP junta o de Recife, Recife junta o de SP) e dá o mesmo se aplicada duas vezes. Nenhum site decidiu nada: é uma conta.',
        look: 'Os estados cruzam o cabo nos dois sentidos; as células se acertam e os três totais mostram 273.',
        key: 'A junção do G-Counter é uma conta, não uma escolha.',
        f(o, t) { const f = go_(t, 0.6, 2.4), m = f >= 1, r = go_(t, 2.6, 3.6); lit(o, 'sp', 'rio', 'rec');
          o.rows.sp = gnode('SP', 'G-COUNTER', 135, 80, m ? 58 : 50, m ? 'c' : 's'); o.rows.rec = gnode('Recife', 'G-COUNTER', m ? 135 : 120, 80, 58, m ? 's' : 'c');
          o.rows.rio = gnode('Rio', 'G-COUNTER', 135, 80, r >= 1 ? 58 : 50, r >= 1 ? 'c' : '');
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, 'SP: 135'); pk(o, rev(CR.rec), f, 'Recife: 58'); pk(o, CR.rio, r, '');
          o.cnt = [['TOTAL', m ? '273' : '…'], ['SP', m ? 'máx(135, 120)' : '265', 'dim'], ['RECIFE', m ? 'máx(50, 58)' : '258', 'dim']];
          o.res = m ? [['135 + 80 + 58 = 273', 'acc'], ['igual nos dois sentidos', 'acc']] : [];
          if (m) T(o, TF(425), '273 nos três sites', 'acc'); } },
      { id: 'ordem', dur: 7, title: 'Qualquer ordem, com duplicatas: o mesmo 273', yk: 'COMUTATIVA, ASSOCIATIVA, IDEMPOTENTE',
        code: ['5 mensagens: 5! = 120 ordens', 'com mensagens duplicadas', '→ 1 único estado final', 'junção(a, b) = junção(b, a)', 'junção(a, a) = a'],
        story: 'Juntar o mesmo conjunto de estados em qualquer ordem, com mensagens repetidas, dá o mesmo resultado. O teste com 5 mensagens em <b>120 permutações</b> (5!) deu um único estado final. É a comutatividade, a associatividade e a idempotência do artigo; no paper de Shapiro, a junção é o <i>join</i> de um semirreticulado.',
        look: 'O Rio reenvia o mesmo estado duas vezes e nada muda. O contador de ordens testadas vai a 120 e o de estados finais fica em 1.',
        key: 'O CRDT converge porque a junção não liga para ordem nem repetição.',
        f(o, t) { const n = Math.round(lin(t, 0.5, 4.5, 1, 120)); lit(o, 'sp', 'rio', 'rec');
          for (const nm of ['sp', 'rio', 'rec']) o.rows[nm] = gnode({ sp: 'SP', rio: 'Rio', rec: 'Recife' }[nm], 'G-COUNTER', 135, 80, 58);
          const ph = (t * 0.5) % 1; pk(o, rev(CR.rio), ph, 'Rio: o mesmo estado'); pk(o, CR.rec, (ph + 0.5) % 1, 'duplicata');
          o.beams = [{ pts: CR.rio, on: true }, { pts: CR.rec, on: true }];
          o.cnt = [['ORDENS TESTADAS', String(n)], ['ESTADOS FINAIS', '1', 'dim'], ['TOTAL', '273', 'dim']];
          o.res = n >= 120 ? [['120 ordens, 1 estado final', 'acc']] : []; } },
      { id: 'lww', dur: 8, title: 'E se der errado: o LWW sobre o total perde 8 ou 15', yk: 'LAST WRITE WINS NO TOTAL',
        code: ['SP guarda o total: 265', 'Recife guarda o total: 258', 'LWW: o carimbo maior vence', '→ 265 (perde 8) ou 258 (perde 15)', 'G-Counter: 273, nada perdido'],
        story: 'E se a loja guardasse só o <b>total</b> e resolvesse o conflito com <i>last write wins</i>? Depois da partição, SP tem 265 e Recife tem 258. O LWW fica com um deles: <b>265</b>, e somem as 8 visualizações de Recife, ou <b>258</b>, e somem as 15 de SP. Nenhum erro aparece. O G-Counter guarda um campo por site justamente para não precisar escolher.',
        look: 'Os dois totais cruzam o cabo; o vencedor fica nos três sites e o perdedor some, em vermelho, com o que se perdeu.',
        key: 'O LWW sobre um número escolhe um lado e joga o outro fora.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, alt = t > 4.6, win = alt ? 258 : 265, lost = alt ? 15 : 8; lit(o, 'sp', 'rio', 'rec');
          const tot = (nm, v, tone, cells) => withTape(act(nm, 'LWW NO TOTAL', ['visualizações do gato 42', 'dim'], ['total ' + v, tone]), 'só o total', cells);
          if (!m) { o.rows.sp = tot('SP', 265, 'acc', [['265', 'ok']]); o.rows.rio = tot('Rio', 265, 'acc', [['265', 'ok']]); o.rows.rec = tot('Recife', 258, 'acc', [['258', 'ok']]); }
          else { const cell = [[String(win), 'ok'], [String(alt ? 265 : 258), 'bad']];
            o.rows.sp = tot('SP', win, alt ? 'bad' : 'acc', cell); o.rows.rio = tot('Rio', win, alt ? 'bad' : 'acc', cell); o.rows.rec = tot('Recife', win, alt ? 'bad' : 'acc', cell);
            o.on[alt ? 'sp' : 'rec'] = 'bad'; }
          o.beams = [{ pts: CR.rio }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, '265'); pk(o, rev(CR.rec), f, '258');
          o.cnt = [['LWW FICA COM', m ? String(win) : '…', m ? 'bad' : ''], ['PERDIDAS', m ? String(lost) : '…', 'bad'], ['G-COUNTER', '273', 'dim']];
          o.res = m ? [[`fica ${win}: somem ${lost} visualizações`, 'bad'], ['o G-Counter daria 273', 'acc']] : [];
          if (m) T(o, TF(425), `LWW: ${win}, perde ${lost}`, 'bad'); } },
    ],
    'crdt-carrinho': [
      { id: 'set', dur: 5, title: 'O carrinho da Lena: {caneca}', yk: 'OR-SET',
        code: ['carrinho = {caneca}', 'cada adição ganha uma etiqueta própria:', '  caneca#a', 'remover = apagar as etiquetas que o site viu'],
        story: 'O carrinho da Lena é um <b>OR-Set</b> (<i>observed-remove</i>): um conjunto em que cada adição ganha uma <b>etiqueta</b> própria, e remover apaga só as etiquetas que o site viu. Nos três sites o carrinho é <code>{caneca}</code>. A Lena usa o notebook (que fala com SP) e o celular (que fala com Recife).',
        look: 'Os três nós com a mesma etiqueta, caneca#a. Na frente, o notebook da Lena; à direita, o celular.',
        key: 'No OR-Set, cada adição tem uma etiqueta e cada remoção diz quais viu.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['CARRINHO', '{caneca}'], ['ETIQUETAS', 'caneca#a', 'dim'], ['SITES', 'iguais', 'dim']];
          o.res = [['{caneca} nos três sites', 'acc']]; } },
      { id: 'particao', dur: 8, title: 'Na partição: o celular põe o gato, o notebook tira a caneca', yk: 'DUAS INTENÇÕES',
        code: ['Recife (celular):  + gato#b', '  → {caneca#a, gato#b}', 'SP (notebook):     − caneca (viu #a)', '  → {}', 'sem rede entre SP e Recife'],
        story: 'A rede entre SP e Recife cai. No <b>celular</b>, que fala com Recife, a Lena adiciona o <code>gato</code>: nova etiqueta, <code>gato#b</code>. No <b>notebook</b>, que fala com SP, ela remove a <code>caneca</code>: SP apaga a etiqueta que viu, <code>caneca#a</code>. Cada lado tem agora um carrinho diferente.',
        look: 'O cabo de Recife fica vermelho. Do celular sai “+ gato” para Recife; do notebook sai “− caneca” para SP, e a etiqueta caneca#a fica riscada em SP.',
        key: 'Na partição, cada lado registra a sua intenção.',
        f(o, t) { const a = go_(t, 0.6, 1.6), b = go_(t, 2.0, 3.0); lit(o, 'sp', 'rio', 'rec'); cut(o);
          if (a > 0) lit(o, 'cel'); if (b > 0) lit(o, 'nb');
          o.rows.rec = snode('Recife', 'OR-SET', a >= 1 ? '{caneca, gato}' : '{caneca}', [['caneca#a', 'ok'], ...(a >= 1 ? [['gato#b', 'ok']] : [])]);
          const spC = [['caneca#a', b >= 1 ? 'off' : 'ok']];
          o.rows.sp = snode('SP', 'OR-SET', b >= 1 ? '{}' : '{caneca}', spC); o.rows.rio = snode('Rio', 'OR-SET', b >= 1 ? '{}' : '{caneca}', spC);
          o.rows.cel = act('celular', '', ['da Lena, em Recife', 'dim'], ['+ gato', a > 0 ? 'acc' : 'dim']); o.rows.nb = act('notebook', 'LENA · SP', ['− caneca', b > 0 ? 'acc' : 'dim']);
          o.beams = o.beams.map(x => x.pts === CR.rio ? { pts: CR.rio, on: b >= 1, flow: b >= 1 } : x);
          pk(o, CR.cel.slice().reverse(), a, '+ gato'); pk(o, CR.nb, b, '− caneca');
          o.cnt = [['EM SP', b >= 1 ? '{}' : '{caneca}'], ['EM RECIFE', a >= 1 ? '{caneca, gato}' : '{caneca}', 'dim'], ['REDE SP–RECIFE', 'cortada', 'bad']];
          o.res = a >= 1 && b >= 1 ? [['dois carrinhos diferentes', 'acc']] : []; } },
      { id: 'juncao', dur: 7, title: 'A junção: {gato}', yk: 'A JUNÇÃO',
        code: ['adições:  caneca#a, gato#b', 'remoções: caneca#a (SP viu e removeu)', 'fica:     gato#b', '→ {gato} nos três sites', 'as duas intenções valem'],
        story: 'A rede volta e os estados se juntam. As adições são <code>caneca#a</code> e <code>gato#b</code>; a remoção apagou <code>caneca#a</code>. Sobra <code>gato#b</code>: o carrinho é <code>{gato}</code> nos três sites. As duas intenções da Lena valeram: o gato entrou e a caneca saiu.',
        look: 'As etiquetas cruzam o cabo nos dois sentidos; nos três nós fica gato#b aceso e caneca#a riscada.',
        key: 'A junção do OR-Set respeita a adição e a remoção que cada lado viu.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, r = go_(t, 2.4, 3.4); lit(o, 'sp', 'rio', 'rec');
          const J = [['caneca#a', 'off'], ['gato#b', 'ok']];
          o.rows.sp = snode('SP', 'OR-SET', m ? '{gato}' : '{}', m ? J : [['caneca#a', 'off']]);
          o.rows.rec = snode('Recife', 'OR-SET', m ? '{gato}' : '{caneca, gato}', m ? J : [['caneca#a', 'ok'], ['gato#b', 'ok']]);
          o.rows.rio = snode('Rio', 'OR-SET', r >= 1 ? '{gato}' : '{}', r >= 1 ? J : [['caneca#a', 'off']]);
          o.rows.cel = act('celular', '', ['da Lena, em Recife', 'dim'], [m ? '{gato}' : '{caneca, gato}', m ? 'acc' : 'dim']); o.rows.nb = act('notebook', 'LENA · SP', [m ? '{gato}' : '{}', m ? 'acc' : 'dim']);
          if (m) lit(o, 'nb', 'cel');
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }, { pts: CR.nb, on: m }, { pts: CR.cel, on: m }];
          pk(o, CR.rec, f, '− caneca#a'); pk(o, rev(CR.rec), f, '+ gato#b'); pk(o, CR.rio, r, '');
          o.cnt = [['CARRINHO', m ? '{gato}' : '…'], ['ADIÇÕES', 'caneca#a, gato#b', 'dim'], ['REMOÇÕES', 'caneca#a', 'dim']];
          o.res = m ? [['{gato}: as duas intenções valem', 'acc']] : [];
          if (m) T(o, TF(425), '{gato} nos três sites', 'acc'); } },
      { id: 'addvence', dur: 8, title: 'E se der errado: tira e põe de novo, e a caneca fica', yk: 'ADD VENCE',
        code: ['SP remove a caneca: apaga #a', 'Recife adiciona de novo: caneca#c', 'na junção: #a removida, #c não vista', '→ a caneca fica: "add vence"'],
        story: 'E se um lado <b>remove</b> a caneca e o outro a <b>adiciona de novo</b> ao mesmo tempo? A remoção de SP só apaga a etiqueta que SP viu (<code>#a</code>); a adição de Recife criou uma nova (<code>#c</code>), que SP nunca viu. Na junção a caneca <b>fica</b>: "add vence". Se a Lena queria mesmo tirar a caneca, ela volta ao carrinho.',
        look: 'Em SP a caneca#a fica riscada; em Recife nasce caneca#c. Depois da junção, os três nós mostram a caneca, com a etiqueta nova acesa.',
        key: 'O OR-Set resolve sozinho, mas escolhe a adição: a caneca volta.',
        f(o, t) { const a = go_(t, 0.6, 1.4), b = go_(t, 1.6, 2.4), f = go_(t, 2.8, 4.2), m = f >= 1; lit(o, 'sp', 'rio', 'rec'); if (!m) cut(o);
          if (a > 0 && !m) lit(o, 'nb'); if (b > 0 && !m) lit(o, 'cel');
          const J = [['caneca#a', 'off'], ['caneca#c', 'bad']];
          o.rows.sp = snode('SP', 'OR-SET', m ? '{caneca}' : a >= 1 ? '{}' : '{caneca}', m ? J : [['caneca#a', a >= 1 ? 'off' : 'ok']], m ? 'bad' : 'acc');
          o.rows.rio = snode('Rio', 'OR-SET', m ? '{caneca}' : a >= 1 ? '{}' : '{caneca}', m ? J : [['caneca#a', a >= 1 ? 'off' : 'ok']], m ? 'bad' : 'acc');
          o.rows.rec = snode('Recife', 'OR-SET', '{caneca}', m ? J : [['caneca#a', 'ok'], ...(b >= 1 ? [['caneca#c', 'ok']] : [])], m ? 'bad' : 'acc');
          o.rows.nb = act('notebook', 'LENA · SP', [m ? 'a caneca voltou' : '− caneca', m ? 'bad' : a > 0 ? 'acc' : 'dim']);
          o.rows.cel = act('celular', '', ['da Lena, em Recife', 'dim'], ['+ caneca', b > 0 ? 'acc' : 'dim']);
          if (m) { o.on.nb = 'bad'; o.beams = [{ pts: CR.rio }, { pts: CR.rec }, { pts: CR.nb }, { pts: CR.cel }]; }
          pk(o, CR.nb, a, '− caneca#a'); pk(o, rev(CR.cel), b, '+ caneca#c');
          if (f > 0 && !m) { pk(o, CR.rec, f, '− #a'); pk(o, rev(CR.rec), f, '+ #c'); }
          o.cnt = [['CARRINHO', m ? '{caneca}' : '…', m ? 'bad' : ''], ['REMOVIDA', 'caneca#a', 'dim'], ['NÃO VISTA POR SP', b >= 1 ? 'caneca#c' : '…', 'dim']];
          o.res = m ? [['a caneca fica: add vence', 'bad']] : [];
          if (m) T(o, TF(425), 'add vence: a caneca fica', 'bad'); } },
    ],
    'crdt-limite': [
      { id: 'estoque', dur: 6, title: 'O estoque da caneca: 1 unidade', yk: 'PN-COUNTER',
        code: ['P (entradas): {SP: 1, Rio: 0, Recife: 0}', 'N (saídas):   {SP: 0, Rio: 0, Recife: 0}', 'valor = soma(P) − soma(N) = 1', 'dois G-Counters: um sobe, outro desce'],
        story: 'O <b>PN-Counter</b> sobe e desce: são dois G-Counters, um de incrementos (P) e um de decrementos (N), e o valor é a diferença. O estoque da caneca azul tem <b>1</b> unidade, e os três sites concordam.',
        look: 'Os três nós mostram P 1, N 0 e estoque 1. As células são as saídas de cada site, todas em zero.',
        key: 'O PN-Counter é um par de G-Counters: entradas menos saídas.',
        f(o, t) { lit(o, 'sp', 'rio', 'rec');
          o.cnt = [['ESTOQUE', '1'], ['ENTRADAS (P)', '1', 'dim'], ['SAÍDAS (N)', '0', 'dim']];
          o.res = [['1 caneca nos três sites', 'acc']]; } },
      { id: 'vende', dur: 8, title: 'Na partição, SP vende 1 e Recife vende 1', yk: 'CADA LADO VIA 1',
        code: ['SP:     viu 1, vende → N = {SP: 1, …}  → 0', 'Recife: viu 1, vende → N = {…, Recife: 1} → 0', 'as duas vendas foram aceitas', 'cada lado, sozinho, fez a coisa certa'],
        story: 'A rede entre SP e Recife cai, e a última caneca é vendida nos dois lados. SP vê 1 em estoque, vende e passa a ver <b>0</b>. Recife também vê 1, vende e vê <b>0</b>. Cada um, sozinho, fez a coisa certa.',
        look: 'O cabo de Recife fica vermelho. A célula SP 1 acende em SP (e no Rio, que recebe de SP); a célula Rec 1 acende em Recife. Os três mostram estoque 0.',
        key: 'Na partição, cada lado aceita a venda que parece possível.',
        f(o, t) { const s = t > 1.0, c = t > 2.2; lit(o, 'sp', 'rio', 'rec'); cut(o);
          o.rows.sp = pnode('SP', 'PN-COUNTER', [s ? 1 : 0, 0, 0], 'acc', s ? 's' : ''); o.rows.rio = pnode('Rio', 'PN-COUNTER', [s ? 1 : 0, 0, 0], 'acc', s ? 's' : '');
          o.rows.rec = pnode('Recife', 'PN-COUNTER', [0, 0, c ? 1 : 0], 'acc', c ? 'c' : '');
          o.beams = o.beams.map(b => b.pts === CR.rio ? { pts: CR.rio, on: s, flow: s } : b);
          if (s) T(o, [175, 240, 52], 'SP: vende 1 (via 1)', 'acc'); if (c) T(o, [645, 340, 50], 'Recife: vende 1 (via 1)', 'acc');
          o.cnt = [['EM SP', s ? '0' : '1'], ['EM RECIFE', c ? '0' : '1', 'dim'], ['VENDAS ACEITAS', String(s + c), 'dim']];
          o.res = s && c ? [['duas vendas da última caneca', 'acc']] : []; } },
      { id: 'menos1', dur: 8, title: 'E se der errado: a junção dá −1', yk: 'A JUNÇÃO',
        code: ['P = {SP: 1, Rio: 0, Recife: 0} → 1', 'N = {SP: 1, Rio: 0, Recife: 1} → 2', '1 − 2 = −1 nos três sites', 'convergiu: todos concordam', 'violou: estoque ≥ 0'],
        story: 'A rede volta e os estados se juntam: P soma 1 e N soma 2. O estoque é <b>−1</b> nos três sites. O CRDT <b>convergiu</b> (os sites concordam) e <b>violou</b> a regra "estoque ≥ 0": o último item foi vendido duas vezes.',
        look: 'As saídas cruzam o cabo; os três nós ficam vermelhos com estoque −1.',
        key: 'Convergir não é acertar: o CRDT não protege a regra do negócio.',
        f(o, t) { const f = go_(t, 0.6, 2.2), m = f >= 1, r = go_(t, 2.4, 3.4); lit(o, 'sp', 'rio', 'rec');
          const J = [1, 0, 1];
          o.rows.sp = m ? pnode('SP', 'PN-COUNTER', J, 'bad', 'sc') : pnode('SP', 'PN-COUNTER', [1, 0, 0], 'acc', 's');
          o.rows.rec = m ? pnode('Recife', 'PN-COUNTER', J, 'bad', 'sc') : pnode('Recife', 'PN-COUNTER', [0, 0, 1], 'acc', 'c');
          o.rows.rio = r >= 1 ? pnode('Rio', 'PN-COUNTER', J, 'bad', 'sc') : pnode('Rio', 'PN-COUNTER', [1, 0, 0], 'acc', 's');
          if (m) { o.on.sp = 'bad'; o.on.rec = 'bad'; } if (r >= 1) o.on.rio = 'bad';
          o.beams = [{ pts: CR.rio, on: r > 0 && r < 1 }, { pts: CR.rec, on: !m }];
          pk(o, CR.rec, f, 'N SP: 1'); pk(o, rev(CR.rec), f, 'N Recife: 1'); pk(o, CR.rio, r, '');
          o.cnt = [['ESTOQUE', m ? '−1' : '0', m ? 'bad' : ''], ['P − N', m ? '1 − 2' : '1 − 1', 'dim'], ['SITES DE ACORDO', m ? 'sim' : '…', 'dim']];
          o.res = m ? [['convergiu e violou estoque ≥ 0', 'bad']] : [];
          if (m) T(o, TF(425), 'estoque −1 nos três sites', 'bad'); } },
      { id: 'saida', dur: 7, title: 'Para o último item: um dono ou uma compensação', yk: 'O QUE FAZER',
        code: ['um único dono do estoque (módulo 11):', '  UPDATE … SET quantidade = quantidade - 1', '   WHERE … AND quantidade > 0', 'ou compensar a venda a mais:', '  o estorno (módulo 19)'],
        story: 'Para o último item continua valendo o módulo 11: um <b>único dono</b> do estoque e a baixa com <code>UPDATE … AND quantidade &gt; 0</code>, que recusa a segunda venda. Ou o módulo 19: aceitar e <b>compensar</b> a venda a mais com o estorno. O CRDT serve para o que pode crescer sem regra, como as visualizações; o estoque tem regra.',
        look: 'SP vira o dono do estoque. A venda de Recife vai até SP e volta recusada: a caneca fica em 0, não em −1.',
        key: 'Regra de negócio pede um dono ou uma compensação, não um CRDT.',
        f(o, t) { const a = go_(t, 0.6, 1.8), b = go_(t, 2.0, 3.2), no = b >= 1; lit(o, 'sp');
          o.rows.sp = act('SP', 'DONO DO ESTOQUE', ['UPDATE … AND', 'dim'], ['quantidade > 0', 'acc'], ['caneca: 0', 'acc']);
          o.rows.rio = act('Rio', 'PERGUNTA AO DONO', ['caneca: 0', 'dim']);
          o.rows.rec = act('Recife', 'PERGUNTA AO DONO', [no ? 'venda recusada' : a > 0 ? 'quer vender 1' : 'caneca: 0', no ? 'bad' : 'dim'], ['sem −1', 'acc']);
          o.beams = [{ pts: CR.rio }, { pts: CR.rec, on: a > 0 && !no }];
          pk(o, rev(CR.rec), a, 'vende 1?'); pk(o, CR.rec, b, '0 linhas: recusado', 'bad');
          o.cnt = [['ESTOQUE', '0'], ['SEGUNDA VENDA', no ? 'recusada' : '…', no ? 'bad' : 'dim'], ['OU', 'estorno (módulo 19)', 'dim']];
          o.res = no ? [['um dono: o estoque não passa de 0', 'acc']] : []; } },
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
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'vazio', 11, 60); x.fillText('vazio', u(W_ / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; return; }
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    ecst: () => `<li><code>ClienteAtualizado</code> (JSON compacto, <b>202 B</b>): <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8,"nome":"Lena","endereco":{"rua":"Rua da Aurora","numero":100,"cidade":"Recife","cep":"50050-000"},"atualizado_em":"2026-11-27T20:20:00.150-03:00"}</code></li><li>Notificação (<b>56 B</b>): <code>{"evento_id":"e-1701","cliente_id":"lena-77","versao":8}</code> + um <code>GET</code></li><table class="h3-sum"><tr><th>conta</th><th>resultado</th></tr><tr><td>1,5 M × 500 B</td><td>750 MB por cópia</td></tr><tr class="on"><td>1 dono + 3 consumidores</td><td>3,0 GB</td></tr><tr><td>tópico: 1,5 M × ~300 B</td><td>~450 MB</td></tr><tr><td>1.500.000 ÷ 20.000/s</td><td>75 s</td></tr></table><li>Kafka: <code>cleanup.policy=compact</code> guarda o último valor de cada chave (<code>cliente_id</code>)</li><li>Fowler: o ECST é um dos quatro padrões de "event-driven" (com <i>event notification</i>, <i>event sourcing</i> e CQRS)</li>`,
    cdc: () => `<li>Saída real do <code>test_decoding</code> (PostgreSQL 14, laboratório do SDLabs):</li><li><code>BEGIN 759</code> · <code>table public.pedidos_cdc: INSERT: id[bigint]:1055 cliente_id[text]:'lena-77' cidade[text]:'Recife' total[numeric]:34.90 status[text]:'criado' …</code></li><li><code>table public.pedidos_cdc: UPDATE: id[bigint]:1055 … status[text]:'pago' …</code> · <code>COMMIT 759</code></li><li><code>BEGIN 760</code> · <code>table public.pedidos_cdc: DELETE: id[bigint]:1055</code> · <code>COMMIT 760</code></li><table class="h3-sum"><tr><th>identidade</th><th>UPDATE</th><th>DELETE</th></tr><tr><td>DEFAULT</td><td>só a linha nova</td><td>só a chave</td></tr><tr class="on"><td>FULL</td><td>old-key + new-tuple</td><td>a linha inteira</td></tr></table><li>Debezium: <code>op</code> = <code>c</code>, <code>u</code>, <code>d</code>, <code>r</code> (snapshot); tópico <code>topic.prefix.schema.tabela</code> → <code>loja.public.pedidos</code></li><li>Polling a cada 5 s: o <code>INSERT</code> e o <code>UPDATE</code> com 3 s de intervalo viram <b>1</b> registro; o <code>DELETE</code> some</li>`,
    outbox: () => `<table class="h3-sum"><tr><th>instante</th><th>escrita dupla</th><th>outbox</th></tr><tr><td>20:10:00.000</td><td>INSERT 1055</td><td>pedidos + outbox, 1 COMMIT</td></tr><tr class="on"><td>20:10:00.004</td><td>cai: sem PedidoCriado</td><td>cai: o evento está no log</td></tr><tr><td>estoque da caneca</td><td>37 (errado)</td><td>36</td></tr></table><li>microservices.io, <i>Transactional Outbox</i>: grava o evento numa tabela na mesma transação e publica depois</li><li>O Debezium lê a tabela <code>outbox</code> no WAL, como qualquer outra</li>`,
    slot: () => `<table class="h3-sum"><tr><th>conta</th><th>resultado</th></tr><tr><td>6.709.592 B ÷ 20.000 (medido)</td><td>335 B por pedido</td></tr><tr><td>335 B × 30/s</td><td>~10 KB/s, 36 MB/h</td></tr><tr><td>1 KB × 30 × 3.600 s (exemplo)</td><td>108 MB/h</td></tr><tr class="on"><td>60.000 MB ÷ 108 MB/h</td><td>555 h ≈ 23 dias</td></tr></table><li><code>pg_replication_slots</code> depois da carga, sem consumidor: <code>wal_status = reserved</code>, <b>6.552 kB</b> retidos</li><li><code>max_slot_wal_keep_size</code>: padrão <b>-1</b> (ilimitado)</li><li>Debezium: seção "WAL disk space consumption" do conector do PostgreSQL</li>`,
    'crdt-contador': () => `<table class="h3-sum"><tr><th>estado</th><th>SP</th><th>Rio</th><th>Recife</th><th>total</th></tr><tr><td>antes</td><td>120</td><td>80</td><td>50</td><td>250</td></tr><tr><td>SP na partição</td><td>135</td><td>80</td><td>50</td><td>265</td></tr><tr><td>Recife na partição</td><td>120</td><td>80</td><td>58</td><td>258</td></tr><tr class="on"><td>junção (máx.)</td><td>135</td><td>80</td><td>58</td><td>273</td></tr></table><li>LWW sobre o total: 265 ou 258, perde <b>8</b> ou <b>15</b></li><li>Teste (<code>crdt.py</code>): 5 mensagens, <b>120</b> permutações, com duplicatas → 1 estado final</li>`,
    'crdt-carrinho': () => `<table class="h3-sum"><tr><th>site</th><th>na partição</th><th>junção</th></tr><tr><td>SP (notebook)</td><td>− caneca → {}</td><td>{gato}</td></tr><tr><td>Recife (celular)</td><td>+ gato → {caneca, gato}</td><td>{gato}</td></tr><tr class="on"><td>remove × adiciona de novo</td><td>#a removida, #c nova</td><td>{caneca} (add vence)</td></tr></table><li>OR-Set: cada adição tem uma etiqueta; a remoção só apaga as etiquetas que viu</li>`,
    'crdt-limite': () => `<table class="h3-sum"><tr><th></th><th>SP</th><th>Rio</th><th>Recife</th><th>soma</th></tr><tr><td>P (entradas)</td><td>1</td><td>0</td><td>0</td><td>1</td></tr><tr class="on"><td>N (saídas)</td><td>1</td><td>0</td><td>1</td><td>2</td></tr></table><li>Valor: 1 − 2 = <b>−1</b>, igual nos três sites: convergiu e violou "estoque ≥ 0"</li><li>Saídas: um único dono com <code>UPDATE … AND quantidade &gt; 0</code> (módulo 11) ou o estorno (módulo 19)</li>`,
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
      <h2>${s.title}</h2>
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'fluxo') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
