// 3D figure (iso-glow), English copy: releasing without being the incident. What changes in the data, the traffic copy, the flag and the rings, each
// scenario with its own pieces; those of one scenario go up and those of the others sink into the plate.
// Migration: the migration and the lock queue on the left; the pedidos table with the frete column drawer in the middle; the 3 pods
// and who reads what (or the shards) on the right.
// Shadow: Lena's app and the mesh on the left; the stable one and the shadow in the middle; the comparator and pagamentos on the right.
// Flag: the flag service and the metric on the left; the 3 pods in the middle; the bucket panel of the 5 customers on the right.
// Rings: the metric and the synthetic customers on the left; the pipeline in the middle; the 3 shards (20 · 20 · 60%) on the right.
// At the back, the display (counters, the math or the code, the result).
// Scenarios (buttons and ?mode=migracao|shadow|flag|aneis; ?step=N opens at step N).
// Data: docs/escrita/deployment-brief.md (lessons 8–12): PostgreSQL 14 with 1,000,000 rows (3.2 ms · 7.9 s · 8.0 s ·
// +100% × +22% · 4.0 s × 1.0 s); Lena's 1059 64.00 × 49.00; 150 copies, 30 from Recife; R$ 9,600; buckets 3 · 19 · 38 · 41 · 94;
// 985 · 9,878; rings 20 · 20 · 60%.
FIGS3D.push({ id: 'liberacao', name: 'Release', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  const brl = v => thou(Math.floor(v)) + '.' + String(Math.round((v % 1) * 100)).padStart(2, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['migracao', 'shadow', 'flag', 'aneis'];
  const SCNAME = { migracao: 'Migration', shadow: 'Shadow', flag: 'Flag', aneis: 'Rings' };
  const SCFULL = { migracao: 'The data that does not come back', shadow: 'Copying the traffic', flag: 'Deploy × release', aneis: 'Rings by shard' };
  const AULA = { migracao: 'aula-8-migrations-e-versoes-de-dados', shadow: 'aula-9-shadow-traffic', flag: 'aula-11-feature-flags',
    aneis: 'aula-12-sharding-bulkheads-e-ring-deployments' };
  let clk = 0, sc = 'migracao', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-liberacao3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  const fam = () => ({ migracao: 'M', shadow: 'S', flag: 'F', aneis: 'A' })[sc];

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 46, SW = 500, SH = SW * 143 / 416;
  rbox(24, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SW - 6, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças dos quatro cenários; cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // Migração
  block('mig', 40, 150, 220, 120, 22); block('fila', 40, 300, 220, 135, 22);
  block('tab', 300, 150, 190, 285, 34); block('fre', 500, 150, 40, 285, 34);
  block('mpods', 580, 40, 310, 150, 26); block('shd', 580, 220, 310, 215, 26);
  // Shadow
  block('cli', 40, 150, 220, 110, 22); block('lb', 40, 290, 220, 145, 22);
  block('est', 300, 150, 240, 110, 26); block('som', 300, 290, 240, 145, 26);
  block('cmp', 580, 40, 310, 230, 26); block('pag', 580, 300, 310, 135, 22);
  // Flag
  block('flg', 40, 150, 220, 130, 22); block('fmet', 40, 305, 220, 130, 22);
  block('fpods', 300, 150, 240, 285, 30); block('bkt', 580, 40, 310, 395, 26);
  // Anéis
  block('amet', 40, 150, 220, 150, 22); block('sin', 40, 325, 220, 110, 22);
  block('pipe', 300, 150, 240, 285, 30);
  block('r0', 580, 40, 310, 95, 26); block('r1', 580, 150, 310, 95, 26); block('r2', 580, 260, 310, 175, 34);
  const NAMES = Object.keys(B);
  creases(first);

  // cabos grossos (vigas) e pontos de luz: as escritas, as cópias, as respostas
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
  const TE = p => NARROW() && !POSTER ? TF() : p;   // balão na borda direita; no celular, no canto do fundo para não sair da tela
  const TF = (x = 760) => NARROW() && !POSTER ? [Math.min(x, 600), 14, 112] : [x, 14, 100];   // balão no canto livre do fundo, à direita do mostrador

  // ── cabos ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const rev = pts => pts.slice().reverse();
  const CM = { mig: P3([[260, 210], [300, 210]]), fila: P3([[260, 367], [300, 367]]), pods: P3([[580, 115], [400, 115], [400, 150]]),
    rd: P3([[580, 330], [540, 330]]), shd: P3([[735, 190], [735, 220]]) };
  const CS = { cli: P3([[150, 260], [150, 290]]), est: P3([[260, 320], [280, 320], [280, 205], [300, 205]]), som: P3([[260, 380], [300, 380]]),
    ce: P3([[540, 190], [560, 190], [560, 155], [580, 155]]), cs: P3([[540, 330], [565, 330], [565, 240], [580, 240]]), pag: P3([[540, 400], [580, 400]]) };
  const CF = { flg: P3([[260, 215], [300, 215]]), met: P3([[300, 370], [260, 370]]), bkt: P3([[540, 290], [580, 290]]) };
  const CA = { r0: P3([[540, 180], [560, 180], [560, 87], [580, 87]]), r1: P3([[540, 200], [580, 200]]), r2: P3([[540, 350], [580, 350]]),
    met: P3([[300, 225], [260, 225]]), sin: P3([[260, 380], [300, 380]]) };
  // uma mensagem andando num cabo: f de 0 a 1; fora disso não aparece
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);   // fração da viagem entre os instantes a e b do passo
  const beam = (o, pts, on, tone = '', flow = false) => { const b = o.beams.find(x => x.pts === pts); if (b) { b.on = on; b.tone = tone; b.flow = flow; } else o.beams.push({ pts, on, tone, flow }); };

  // ── conteúdo padrão das peças ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const withTape = (d, tl, cells) => { d.tl = tl; d.tape = cells; return d; };
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  // a tabela pedidos (1.000.000 de linhas, PostgreSQL 14): texto, barra de tamanho e as colunas
  const COLS = (frete, total = ['total', 'ok']) => [total, ['detalhes', 'ok'], ...(frete ? [['frete', frete]] : [])];
  function tabD(rows, mb, cols, tone = 'acc') { const d = act('pedidos', 'TABLE', ...rows); d.tl = 'columns'; d.tape = cols;
    d.bar = [mb / 3950, tone, `${thou(mb)} MB (scale: 3,950)`]; return d; }
  const freD = (f, sub, tone = 'acc') => ({ name: 'frete', meta: '', col: [f, sub, tone] });
  const pods = (...v) => v.map(s => [s, s === '2.4.0' ? 'none' : s === 'error' ? 'bad' : 'ok']);
  // os 5 clientes da amostra e o bucket de cada um na frete_v2 (murmur3 mod 100)
  const CLI5 = [['caio-58', 3, 'Rio'], ['lena-77', 19, 'Recife'], ['bia-31', 38, ''], ['mkt-01', 41, 'partner'], ['davi-12', 94, 'SP']];
  const bkD = (pct, { show = 5, bad = [], rows } = {}) => { const d = act('buckets frete_v2', '0 TO 99', ...(rows || [[`percentage: ${pct}%`, pct ? 'acc' : 'dim']]));
    d.bk = { pct, items: CLI5.map(([id, b, c], i) => [id, i < show ? b : null, c, bad.includes(id) ? 'bad' : '']), foot: '100,000 customers: <1 → 985 · <10 → 9,878 · <50 → 49,909' }; return d; };
  const LENA8 = ['1042', '1044', '1047', '1048', '1051', '1054', '1055', '1056'];
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    const F = fam();
    if (F === 'M') {
      show('mig', 'fila', 'tab', 'fre', 'mpods', 'shd');
      o.rows.mig = act('migration', 'PSQL', ["lock_timeout = '1s'", 'dim'], ['waits its turn', 'dim']);
      o.rows.fila = withTape(act('lock queue', 'ACCESS EXCLUSIVE', ['nobody waiting', 'dim']), 'waiting', []);
      o.rows.tab = tabD([['1,000,000 rows', 'hi'], ['~2 KB per row', 'dim']], 1975, COLS('none'));
      o.rows.fre = freD(0, 'NULL');
      o.rows.mpods = withTape(act('pedidos', '3 PODS', ['2.4.0 on all', 'dim']), 'pods', pods('2.4.0', '2.4.0', '2.4.0'));
      o.rows.shd = act('who reads what', 'VERSIONS', ['2.4.0: writes and reads total', 'dim'], ['2.5.0: not yet', 'dim']);
      o.beams.push({ pts: CM.mig }, { pts: CM.fila }, { pts: CM.pods }, { pts: CM.rd });
    } else if (F === 'S') {
      show('cli', 'lb', 'est', 'som', 'cmp', 'pag');
      o.rows.cli = act('Lena\'s app', 'RECIFE', ['order 1059', 'hi'], ['T-shirt 49 + shipping 15', 'dim']);
      o.rows.lb = act('mesh', 'ISTIO', ['5 orders/s', 'hi'], ['stable: 100%', 'dim'], ['mirror: off', 'dim']);
      o.rows.est = act('pedidos 2.4.0', 'STABLE', ['answers the customer', 'dim']);
      o.rows.som = act('pedidos 2.5.0', 'SHADOW', ['receives the copy', 'dim'], ['response discarded', 'dim']);
      o.rows.cmp = act('comparator', 'BY x-request-id', ['nothing compared yet', 'dim']);
      o.rows.pag = act('pagamentos · Kafka', 'EFEITOS', ['nothing from the shadow', 'dim']);
      o.beams.push({ pts: CS.cli }, { pts: CS.est }, { pts: CS.som }, { pts: CS.ce }, { pts: CS.cs }, { pts: CS.pag });
    } else if (F === 'F') {
      show('flg', 'fmet', 'fpods', 'bkt');
      o.rows.flg = act('flag service', 'OPENFEATURE', ['frete_v2: 0%', 'acc'], ['default: false', 'dim']);
      o.rows.fmet = act('frete_zero', 'BY CITY', ['SP 0 · Rio 0', 'dim'], ['Recife 0', 'dim']);
      o.rows.fpods = withTape(act('pedidos 2.5.0', '3 PODS', ['new code on all', 'hi'], ['flag cache: 30 s', 'dim']), 'frete_v2 on each pod',
        [['off', 'none'], ['off', 'none'], ['off', 'none']]);
      o.rows.bkt = bkD(0);
      o.beams.push({ pts: CF.flg }, { pts: CF.met }, { pts: CF.bkt });
    } else {
      show('amet', 'sin', 'pipe', 'r0', 'r1', 'r2');
      o.rows.amet = act('frete_zero', 'BY RING', ['ring 0: 0', 'dim'], ['ring 1: 0', 'dim'], ['ring 2: 0', 'dim']);
      o.rows.sin = act('synthetic customers', 'ONE-BOX', ['off', 'dim']);
      o.rows.pipe = withTape(act('pipeline', 'BAKE TIME', ['pedidos 2.5.0', 'hi'], ['ring by ring', 'dim']), 'rings', [['ring 0', 'none'], ['ring 1', 'none'], ['ring 2', 'none']]);
      o.rows.pipe.bar = [0, 'acc', 'exposure: 0%'];
      o.rows.r0 = act('ring 0 · shard-0', '20%', ['davi-12 (SP)', 'dim'], ['2.4.0', 'dim']);
      o.rows.r1 = act('ring 1 · shard-1', '20%', ['lena-77 · bia-31', 'dim'], ['2.4.0', 'dim']);
      o.rows.r2 = act('ring 2 · shard-2', '60%', ['caio-58 · mkt-01', 'dim'], ['2.4.0', 'dim']);
      o.beams.push({ pts: CA.r0 }, { pts: CA.r1 }, { pts: CA.r2 }, { pts: CA.met }, { pts: CA.sin });
    }
    return o;
  }
  const SHD25 = () => act('who reads what', 'VERSIONS', ['2.5.0: writes total and frete', 'acc'], ['and reads total', 'dim']);
  const ring = (o, i, v, tn) => { const r = o.rows['r' + i]; r.rows[1] = [v, tn || (v === '2.5.0' ? 'acc' : 'dim')]; };

  // ── o que se vê em cada passo ──
  const STEPS = {
    migracao: [
      { id: 'expandir', dur: 6, title: 'Expand: the frete column is born empty', yk: 'EXPAND (POSTGRESQL 14, 1M ROWS)',
        code: ["SET lock_timeout = '1s';", 'ALTER TABLE pedidos', '  ADD COLUMN frete numeric(10,2);', '  → 3.2 ms: catalog only', 'with DEFAULT random(): 7.9 s (rewrites everything)'],
        story: '2.5.0 will write the shipping in its own column; today it only exists inside <code>total</code> and the <code>detalhes</code> JSON. The first step comes <b>before</b> the deploy: <code>ADD COLUMN frete</code>, null. On a <code>pedidos</code> table of 1,000,000 rows (1,975 MB), on PostgreSQL 14, it took <b>3.2 ms</b>: only the catalog changes. A constant default is also cheap (<code>moeda text NOT NULL DEFAULT \'BRL\'</code>: 1.9 ms); a volatile default like <code>random()</code> rewrites the whole table (<b>7.9 s</b>). 2.4.0 does not know the column exists, and does not need to.',
        look: 'The migration sends the ALTER to the table and, next to it, a new drawer rises: the frete column, empty. The 3 pods stay on 2.4.0.',
        key: 'Expanding is adding without breaking whoever is already there.',
        f(o, t) { const a = go_(t, 0.4, 1.3), born = a >= 1; if (!born) delete o.show.fre; lit(o, 'mig'); if (a > 0) lit(o, 'tab'); if (born) lit(o, 'fre');
          o.rows.mig = act('migration', 'PSQL', ['ADD COLUMN frete', 'acc'], ["lock_timeout = '1s'", 'dim']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], [born ? 'new column: frete' : '~2 KB per row', born ? 'acc' : 'dim']], 1975, COLS(born ? 'none' : null));
          beam(o, CM.mig, a > 0 && a < 1); pk(o, CM.mig, a, 'ADD COLUMN frete');
          if (born) T(o, [520, 150, 70], 'frete: NULL', 'acc');
          o.cnt = [['ALTER', born ? '3.2 ms' : '…'], ['ROWS', '1,000,000', 'dim'], ['SIZE', '1,975 MB', 'dim']];
          o.res = born ? [['catalog only: 3.2 ms', 'acc'], ['2.4.0 does not even notice', 'acc']] : []; } },
      { id: 'fila', dur: 8, title: 'The lock queue: the 3 ms ALTER that blocks everyone', yk: 'THE QUEUE (MEASURED)',
        code: ['long transaction: open SELECT, 6 s', 'ALTER asks for ACCESS EXCLUSIVE → waits', 'new SELECT arrives → waits behind the ALTER', '  waited 4.0 s', "with lock_timeout = '1s': the ALTER gives up in 1.0 s", 'ERROR: canceling statement due to lock timeout'],
        story: 'The <code>ALTER</code> is fast, but it needs an <code>ACCESS EXCLUSIVE</code> lock, and the lock joins a <b>queue</b>. A long transaction (6 s) holds an open <code>SELECT</code>; the <code>ALTER</code> waits for it; a simple <code>SELECT</code> that arrived later waited <b>4.0 s</b> behind the <code>ALTER</code>. The queue blocks everyone, even the reads. With <code>SET lock_timeout = \'1s\'</code>, the <code>ALTER</code> gives up in <b>1.0 s</b> (<code>ERROR: canceling statement due to lock timeout</code>) and the <code>SELECT</code> goes through. Every production migration carries <code>lock_timeout</code> and retries.',
        look: 'The queue, on the left, fills up: the 6 s transaction, the ALTER and the SELECT, which turns red while it waits. On the second round, with lock_timeout, the ALTER is struck out of the queue and the SELECT goes through.',
        key: 'A production migration carries lock_timeout and retries.',
        f(o, t) { const w = lin(t, 0.8, 4.0, 0, 4.0), lt_ = t > 4.6, w2 = lin(t, 4.6, 5.6, 0, 1.0), pass = t > 5.7; lit(o, 'mig');
          o.on.fila = lt_ && pass ? 1 : 'bad'; o.on.tab = lt_ && pass ? 1 : 'bad';
          o.rows.mig = act('migration', 'PSQL', [lt_ ? (pass ? 'gave up: lock timeout' : 'waits, up to 1 s') : 'ALTER waiting', lt_ ? 'acc' : 'bad'], [lt_ ? "lock_timeout = '1s'" : 'no lock_timeout', 'dim']);
          o.rows.fila.rows = [[lt_ ? (pass ? 'SELECT went through' : `SELECT waits ${dec(w2)} s`) : `SELECT waits ${dec(w)} s`, pass ? 'acc' : 'bad']];
          o.rows.fila.tape = [['tx 6 s', 'ok'], ['ALTER', pass ? 'off' : 'bad'], ['SELECT', pass ? 'ok' : 'bad']];
          beam(o, CM.fila, true, pass ? '' : 'bad'); beam(o, CM.mig, true, pass ? '' : 'bad');
          if (pass) T(o, TF(), 'ALTER gave up in 1.0 s; retries', 'acc'); else if (t > 2) T(o, TF(), 'the queue blocks even the read', 'bad');
          o.cnt = [['SELECT WAITED', lt_ ? `${dec(Math.min(w2, 1))} s` : `${dec(w)} s`, pass ? '' : 'bad'], ['WITHOUT lock_timeout', '4.0 s', 'dim'], ['WITH lock_timeout', '1.0 s', 'dim']];
          o.res = pass ? [['4.0 s × 1.0 s', 'acc'], ['the ALTER comes back later', 'acc']] : t > 4 ? [['SELECT stuck 4.0 s', 'bad']] : []; } },
      { id: 'publicar', dur: 8, title: 'Deploy 2.5.0: writes total and frete, reads total', yk: 'THE 90 S ROLLING',
        code: ['2.5.0: INSERT … (total, frete)', '2.4.0: INSERT … (total)  → frete NULL', 'both read total', '3 pods: 0 → 33 → 67 → 100% in 90 s', 'each step serves N and N−1'],
        story: 'With the column in place, 2.5.0 is deployed. It writes <code>total</code> <b>and</b> <code>frete</code>, and keeps reading <code>total</code>. During the <b>90 s</b> rolling (3 waves of 30 s), the two versions coexist: 2.4.0 writes without shipping (it stays <code>NULL</code>) and ignores the column it does not know. Since each version works with the schema that exists, rolling, canary and blue/green are safe, and so is going back to 2.4.0.',
        look: 'The pods swap one by one from 2.4.0 to 2.5.0, and the writes reach the table; the frete drawer starts to receive values on the new rows.',
        key: 'The schema serves version N and N−1 at the same time.',
        f(o, t) { const s = lin(t, 0.4, 5.8, 0, 90), k = Math.min(3, Math.floor(s / 30 + 1e-6)), pct = [0, 33, 67, 100][k]; lit(o, 'mpods', 'tab', 'fre');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [`${pct}% on 2.5.0`, 'acc'], ['waves of 30 s', 'dim']), 'pods', pods(...[0, 1, 2].map(i => i < k ? '2.5.0' : '2.4.0')));
          o.rows.shd = act('who reads what', 'VERSIONS', ['2.4.0: writes total', 'dim'], ['2.5.0: writes total and frete', k ? 'acc' : 'dim'], ['both read total', 'hi']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], ['new rows with frete', k ? 'acc' : 'dim']], 1975, COLS(k ? 'ok' : 'none'));
          o.rows.fre = freD(k ? 0.04 * k : 0, k ? 'new rows only' : 'NULL');
          beam(o, CM.pods, true, '', true); beam(o, CM.rd, k > 0);
          o.cnt = [['% ON 2.5.0', `${pct}%`], ['CLOCK', `${Math.round(s)} s of 90`, 'dim'], ['SCHEMA ERRORS', '0', 'dim']];
          o.res = k === 3 ? [['2.4.0 and 2.5.0 coexisted 90 s', 'acc'], ['no schema errors', 'acc']] : []; } },
      { id: 'backfill', dur: 9, title: 'Backfill in batches: 100 batches of 10,000 rows', yk: 'BACKFILL (MEASURED)',
        code: ['UPDATE pedidos', "  SET frete = (detalhes->>'frete')::numeric", '  WHERE id BETWEEN … (10,000 rows)', '~66 ms per batch; VACUUM every 10', '1,975 → 2,407 MB (+22%)'],
        story: 'The old rows still have a null <code>frete</code>. The <b>backfill</b> copies the value that is in the <code>detalhes</code> JSON (1054 holds <code>"frete": 15.00</code>) into the column, in <b>batches of 10,000 rows</b>, with <code>VACUUM</code> every 10 batches: ~66 ms per batch, 14.3 s in total, and the table grows from 1,975 to <b>2,407 MB (+22%)</b>. In the store, with 16.67 million rows per shard and a 1 s pause between batches, that is 1,667 batches and about <b>30 min per shard</b>, on all 3 in parallel. Each batch holds few rows for a short time.',
        look: 'The frete drawer fills up batch by batch and the table size bar barely moves: it stops at 2,407 MB.',
        key: 'Small batches, a pause between them, and the space grows little.',
        f(o, t) { const n = Math.round(lin(t, 0.3, 6.3, 0, 100)), mb = 1975 + (2407 - 1975) * n / 100; lit(o, 'mig', 'tab', 'fre'); o.rows.shd = SHD25();
          o.rows.mpods.rows = [['2.5.0 on all', 'acc']]; o.rows.mpods.tape = pods('2.5.0', '2.5.0', '2.5.0');
          o.rows.mig = act('migration', 'PSQL', [n >= 100 ? 'backfill done' : `batch ${n} of 100`, 'acc'], ['~66 ms per batch', 'dim']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], [`${thou(n * 10000)} filled`, 'acc']], mb, COLS('ok'));
          o.rows.fre = freD(n / 100, n >= 100 ? 'full' : `${n}%`);
          beam(o, CM.mig, n < 100, '', n < 100);
          o.cnt = [['BATCHES', `${n} of 100`], ['SIZE', `${thou(mb)} MB`, 'dim'], ['IN THE STORE', '~30 min/shard', 'dim']];
          o.res = n >= 100 ? [['+22% of space', 'acc'], ['frete filled in', 'acc']] : []; } },
      { id: 'unico', dur: 7, title: 'The same UPDATE at once: 8.0 s and double the space', yk: 'SINGLE UPDATE (MEASURED)',
        code: ['UPDATE pedidos SET frete = 15.00;', '  1 statement, 1,000,000 rows: 8.0 s', '  1,975 → 3,950 MB (+100%)', 'plain VACUUM: still 3,950 MB', 'in the store: +33 GB and ~2 min per shard'],
        story: 'For comparison, the same <code>UPDATE</code> in a single statement: <b>8.0 s</b>, and the table goes from 1,975 to <b>3,950 MB (+100%)</b>. In PostgreSQL, the <code>UPDATE</code> writes a new version of each row; the old one only becomes free space later, and a plain <code>VACUUM</code> does not give that space back to the disk (it stayed at 3,950 MB). In the store it would be <b>+33 GB per shard</b> and the rows held for about 2 min (8 s × 16.67 ≈ 133 s).',
        look: 'The size bar shoots to the end of the scale and turns red; the frete drawer fills up all at once.',
        key: 'The single UPDATE doubles the table; in batches, +22%.',
        f(o, t) { const p = go_(t, 0.4, 3.2), mb = 1975 + 1975 * p, done = p >= 1; lit(o, 'mig', 'fre'); o.on.tab = done ? 'bad' : 1; o.rows.shd = SHD25();
          o.rows.mpods.rows = [['2.5.0 on all', 'acc']]; o.rows.mpods.tape = pods('2.5.0', '2.5.0', '2.5.0');
          o.rows.mig = act('migration', 'PSQL', [done ? 'UPDATE: 8.0 s' : 'UPDATE at once', 'acc'], ['1 statement', 'dim']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], [done ? 'size doubled' : 'rewriting everything', done ? 'bad' : 'acc']], mb, COLS('ok'), done ? 'bad' : 'acc');
          o.rows.fre = freD(p, done ? 'full' : '…');
          beam(o, CM.mig, !done, '', !done);
          o.cnt = [['SIZE', `${thou(mb)} MB`, done ? 'bad' : ''], ['TIME', done ? '8.0 s' : `${dec(p * 8)} s`, 'dim'], ['IN BATCHES', '2,407 MB (+22%)', 'dim']];
          o.res = done ? [['+100% of space', 'bad'], ['in batches: +22%', 'acc']] : []; } },
      { id: 'contrair', dur: 8, title: 'Read from the new column and, afterwards, contract', yk: 'THE PLAN, IN ORDER',
        code: ['1. expand: ADD COLUMN frete (before)', '2. deploy 2.5.0: writes both', '3. backfill in batches', '4. 2.6.0 reads frete (behind a flag)', '5. contract: SET NOT NULL, after 7 days'],
        story: 'With the column full, <b>2.6.0</b> starts to <b>read</b> <code>frete</code>, behind a flag. <code>total</code> and <code>detalhes</code> keep being written while going back is still possible. Only after the rollback window (7 days, in the example) comes the <b>contract</b>: <code>SET NOT NULL</code> and removing the old code. The migration runs <b>before</b> the deploy (expand) and <b>after</b> it (contract), never <b>inside</b>.',
        look: 'The pods become 2.6.0 and the read cable starts to leave the frete drawer; at the end, the drawer gets the NOT NULL label.',
        key: 'The migration runs before and after the deploy, never inside.',
        f(o, t) { const v6 = t > 1.6, nn = t > 4.4; lit(o, 'mpods', 'fre'); if (nn) lit(o, 'mig');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [v6 ? '2.6.0 on all' : '2.5.0 on all', 'acc'], [v6 ? 'reads frete' : 'reads total', 'dim']), 'pods', pods(...Array(3).fill(v6 ? '2.6.0' : '2.5.0')));
          o.rows.shd = act('who reads what', 'VERSIONS', ['2.5.0: reads total', v6 ? 'dim' : 'acc'], ['2.6.0: reads frete', v6 ? 'acc' : 'dim'], [nn ? '7 days later: contract' : '7-day window', nn ? 'acc' : 'dim']);
          o.rows.mig = act('migration', 'PSQL', [nn ? 'SET NOT NULL' : 'waits for the window', nn ? 'acc' : 'dim'], [nn ? 'removes the old code' : '', 'dim']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], ['frete filled in', 'acc']], 2407, COLS('ok'));
          o.rows.fre = freD(1, nn ? 'NOT NULL' : 'full');
          beam(o, CM.pods, true, '', true); beam(o, CM.rd, v6, '', v6); beam(o, CM.mig, nn && t < 5.4);
          if (nn) T(o, [520, 150, 70], 'frete NOT NULL', 'acc');
          const ph = nn ? '5 contract' : v6 ? '4 read the new one' : '3 backfill done';
          o.cnt = [['STEP', ph], ['ROLLBACK WINDOW', '7 days', 'dim'], ['BREAKS', '0', 'dim']];
          o.res = nn ? [['before and after, never inside', 'acc']] : []; } },
      { id: 'rename', dur: 7, title: 'What if it goes wrong (1): a RENAME along with the deploy', yk: 'REAL OUTPUT',
        code: ['ALTER TABLE pedidos', '  RENAME COLUMN total TO valor_total;', '  → milliseconds', '2.4.0, still live during the rolling:', 'ERROR: column "total" does not exist'],
        story: 'The tempting shortcut: renaming <code>total</code> to <code>valor_total</code> along with the deploy. The <code>RENAME</code> takes milliseconds, but the rolling lasts 90 s, and in that time there are still pods on 2.4.0 running <code>SELECT total</code>. The real output: <code>ERROR: column "total" does not exist</code>. <code>DROP</code> is the same, and worse: the data goes with it. Renaming is also done with expand and contract: new column, write to both, copy, read from the new one, drop the old one.',
        look: 'The table\'s total column turns red with the new name; the two pods that are still 2.4.0 get the error back.',
        key: 'RENAME and DROP in the deploy break the version that is still live.',
        f(o, t) { const r = t > 0.9, a = go_(t, 1.4, 2.6), err = a >= 1; lit(o, 'mig'); if (r) o.on.tab = 'bad'; if (err) o.on.mpods = 'bad'; o.rows.shd = act('who reads what', 'VERSIONS', ['2.4.0: SELECT total', 'bad'], ['2.5.0: writes total and frete', 'acc']);
          o.rows.mig = act('migration', 'PSQL', [r ? 'RENAME done: ms' : 'RENAME total', 'acc'], ['in the middle of the rolling', 'bad']);
          o.rows.tab = tabD([['1,000,000 rows', 'hi'], [r ? 'total → valor_total' : 'total column', r ? 'bad' : 'dim']], 1975, COLS('ok', r ? ['valor_total', 'bad'] : ['total', 'ok']));
          o.rows.fre = freD(0.08, 'new rows only');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [err ? '2 pods with errors' : '33% on 2.5.0', err ? 'bad' : 'acc'], ['2.4.0 runs SELECT total', 'dim']), 'pods', pods('2.5.0', err ? 'error' : '2.4.0', err ? 'error' : '2.4.0'));
          o.rows.mpods.tape = [['2.5.0', 'ok'], ['2.4.0', err ? 'bad' : 'none'], ['2.4.0', err ? 'bad' : 'none']];
          beam(o, CM.mig, t > 0.2 && !r); pk(o, CM.mig, go_(t, 0.2, 0.9), 'RENAME COLUMN');
          beam(o, CM.pods, a > 0, a > 0 ? 'bad' : ''); pk(o, rev(CM.pods), a, 'column "total" does not exist', 'bad');
          o.cnt = [['PODS WITH ERRORS', err ? '2 of 3' : '0', 'bad'], ['RENAME', 'milliseconds', 'dim'], ['ROLLING', '90 s', 'dim']];
          o.res = err ? [['2.4.0 breaks', 'bad'], ['renaming = expand and contract', 'acc']] : []; } },
      { id: 'mod4', dur: 9, title: 'What if it goes wrong (2): 2.6.0 swaps mod 3 for mod 4', yk: 'THE ROUTING FUNCTION',
        code: ['2.4.0: shard = hash(cliente_id) mod 3', '2.6.0: shard = hash(cliente_id) mod 4', '75.2% of the keys change shard', 'lena-77 1 → 0 · bia-31 1 → 3 · caio-58 2 → 1', '~113 of 150 orders on the wrong shard'],
        story: 'The second bomb comes from module 16: 2.6.0 swaps <code>mod 3</code> for <code>mod 4</code>. During the 90 s of the rolling it receives 0 → 33 → 67 → 100% of the orders (150 in total), and <b>75.2%</b> of the keys change shard: <b>~113</b> orders go where 2.4.0 does not look. After the rolling, 2.6.0 queries the status of Lena\'s orders and <b>does not find</b> all 8: 1042, 1044, 1047, 1048, 1051, 1054, 1055 and 1056: they are on <code>shard-1</code>, and it looks on <code>shard-0</code>. The "my orders" screen reads the projection and stays right; whoever errs is whoever reads <code>pedidos</code>. The routing function is versioned data: changing it is also expand and contract (copy with CDC, read from both, swap the map, only then delete the source).',
        look: 'On the right, Lena\'s eight orders are on shard-1; 2.6.0 goes looking for them on shard-0, comes back empty, and they turn red.',
        key: 'The routing function is data too, and it changes through expand and contract.',
        f(o, t) { const a = go_(t, 0.6, 1.8), b = go_(t, 2.0, 3.0), lost = b >= 1; lit(o, 'mpods'); o.on.shd = lost ? 'bad' : 1;
          o.rows.mpods = withTape(act('pedidos', '3 PODS', ['2.6.0: mod 4', 'acc'], ['2.4.0 used mod 3', 'dim']), 'pods', pods('2.6.0', '2.6.0', '2.6.0'));
          o.rows.shd = withTape(act('shards', 'mod 3 → mod 4', ['Lena\'s orders: shard-1', 'hi'], ['2.6.0 looks on shard-0', a > 0 ? 'bad' : 'dim'], [lost ? '8 orders "gone"' : 'status of 1042 … 1056', lost ? 'bad' : 'dim']),
            'Lena\'s orders', LENA8.map(n => [n, lost ? 'bad' : 'ok']));
          beam(o, CM.shd, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, CM.shd, a, 'status: shard-0?'); pk(o, rev(CM.shd), b, 'not found', 'bad');
          if (lost) T(o, TF(), 'status of 1056: not found', 'bad');
          o.cnt = [['ORDERS ON THE WRONG SHARD', '~113', 'bad'], ['KEYS THAT CHANGE', '75.2%', 'dim'], ['LENA\'S "GONE"', lost ? '8' : '…', 'bad']];
          o.res = lost ? [['8 of Lena\'s orders "vanished"', 'bad'], ['routing is versioned data', 'acc']] : []; } },
    ],
    shadow: [
      { id: 'espelho', dur: 7, title: 'Mirror at 10%: the stable one keeps 100%', yk: 'VirtualService (ISTIO)',
        code: ['route: pedidos 2.4.0  weight: 100', 'mirror: pedidos 2.5.0', 'mirrorPercentage: { value: 10.0 }', 'the copy carries the Host …-shadow', 'fire and forget: the response is discarded'],
        story: 'Tuesday, 14:00, 5 orders/s. The mesh sends <b>100%</b> to 2.4.0, as always, and a <b>copy</b> of 10% (0.5 order/s) to 2.5.0. The mirror duplicates, it does not split: the stable one loses nothing. The copy carries the <code>Host</code> ending in <code>-shadow</code> and is "fire and forget": the mesh discards the response. Lena places order <b>1059</b> (black T-shirt 49.00 + Recife shipping 15.00) and pays <b>64.00</b>, calculated by 2.4.0. No customer sees 2.5.0: <b>0%</b> exposed.',
        look: 'The 1059 goes from the app to the mesh and on to 2.4.0, which answers 64.00. A copy goes down to the shadow; its response (49.00) comes back and dies in the mesh.',
        key: 'Shadow copies real traffic and exposes nobody.',
        f(o, t) { const a = go_(t, 0.3, 1.0), b = go_(t, 1.1, 2.1), c = go_(t, 2.3, 3.2), d = go_(t, 3.3, 3.9), e = go_(t, 2.3, 3.2);
          lit(o, 'lb'); if (a > 0) lit(o, 'cli'); if (b > 0) lit(o, 'est', 'som');
          o.rows.lb = act('mesh', 'ISTIO', ['5 orders/s', 'hi'], ['stable: 100%', 'acc'], ['copy: 10% → shadow', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SHADOW', ['0.5 copy/s', 'acc'], [e >= 1 ? 'answered 49.00' : 'calculating the 1059', e >= 1 ? 'bad' : 'dim'], ['response discarded', 'dim']);
          o.rows.est = act('pedidos 2.4.0', 'STABLE', ['100% of the traffic', 'acc'], [c > 0 ? '201 · total 64.00' : 'calculating the 1059', c > 0 ? 'acc' : 'dim']);
          o.rows.cli.rows[0] = [d >= 1 ? 'paid 64.00' : 'order 1059', d >= 1 ? 'acc' : 'hi'];
          beam(o, CS.cli, (a > 0 && a < 1) || (d > 0 && d < 1)); beam(o, CS.est, (b > 0 && b < 1) || (c > 0 && c < 1)); beam(o, CS.som, (b > 0 && b < 1) || (e > 0 && e < 1));
          pk(o, CS.cli, a, '1059'); pk(o, CS.est, b, '1059'); pk(o, CS.som, b, 'copy of the 1059');
          pk(o, rev(CS.est), c, '64.00', 'acc'); pk(o, rev(CS.som), e, '49.00 (discarded)', 'bad'); pk(o, rev(CS.cli), d, '64.00');
          if (e >= 1) T(o, [150, 300, 60], 'shadow response: discarded', 'dim');
          o.cnt = [['CUSTOMERS ON 2.5.0', '0%'], ['COPY', '0.5 order/s', 'dim'], ['LENA PAID', d >= 1 ? '64.00' : '…', 'dim']];
          o.res = d >= 1 ? [['stable 100% + copy 10%', 'acc'], ['nobody exposed', 'acc']] : []; } },
      { id: 'compara', dur: 9, title: 'The comparator: 64.00 × 49.00', yk: 'THE DIFF, FIELD BY FIELD',
        code: ['x-request-id of the 1059', 'total   2.4.0: 64.00 · 2.5.0: 49.00', 'frete   2.4.0: 15.00 · 2.5.0: 0.00', 'status  201 · 201 (same)', '5 min: 150 copies, 30 from Recife, 30 different'],
        story: 'The mesh throws away the shadow\'s response; to learn anything, someone has to keep it. Shadow 2.5.0 records its own with the <code>x-request-id</code>, and a <b>comparator</b> joins it with 2.4.0\'s, field by field. Status: 201 on both. Latency: same. <code>total</code>: <b>64.00 × 49.00</b>. In 5 min, at 10%, that is <b>150 copies</b>; 30 are from Recife, and <b>all 30 diverge</b>. The defect shows up without any customer paying for it: <b>R$ 0</b> of loss. Without a comparator, shadow only costs money.',
        look: 'The two responses walk to the comparator; the grid of Recife copies fills with red cells, one per divergence.',
        key: 'Without a comparator, shadow only costs money.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 6.5, 0, 150)), rec = Math.floor(n / 5); lit(o, 'lb', 'est', 'som', 'cmp');
          o.rows.lb = act('mesh', 'ISTIO', ['5 orders/s', 'hi'], ['copy: 10% → shadow', 'acc']);
          o.rows.est = act('pedidos 2.4.0', 'STABLE', ['records the response', 'acc'], ['with x-request-id', 'dim']);
          o.rows.som = act('pedidos 2.5.0', 'SHADOW', ['records the response', 'acc'], ['with x-request-id', 'dim']);
          o.rows.cmp = act('comparator', 'BY x-request-id', ['total 64.00 × 49.00', rec ? 'bad' : 'dim'], ['frete 15.00 × 0.00', rec ? 'bad' : 'dim'], ['status 201 = 201', 'dim']);
          o.rows.cmp.grid = Array.from({ length: 30 }, (_, i) => i < rec ? ['≠', 'bad'] : ['', 'none']); o.rows.cmp.cols = 10;
          beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', true); beam(o, CS.ce, true, '', true); beam(o, CS.cs, true, 'bad', true);
          o.cnt = [['COPIES', `${n} of 150`], ['FROM RECIFE, DIFFERENT', `${rec} of 30`, 'bad'], ['LOSS', 'R$ 0', 'dim']];
          o.res = n >= 150 ? [['30 of 30 diverge', 'bad'], ['R$ 0 lost', 'acc']] : []; } },
      { id: 'dryrun', dur: 7, title: 'Dry-run: the shadow writes and undoes', yk: 'THE ARTICLE\'S CODE (GO)',
        code: ['tx := db.Begin()', '… order INSERT, shipping calculation …', 'if ENVIRONMENT == "shadow" {', '    tx.Rollback()', '} else {', '    tx.Commit() }'],
        story: '<code>pedidos</code> writes, and a shadow that wrote to the same database would duplicate the 1059. The article solves it with <b>dry-run</b>: the shadow opens the transaction, does the <code>INSERT</code>, calculates everything and, at the end, calls <code>tx.Rollback()</code> instead of <code>tx.Commit()</code>. The table only keeps the 1059 saved by 2.4.0.',
        look: 'The shadow lights up with the INSERT inside the transaction and then shows the Rollback; the counter of rows it saved goes back to 0.',
        key: 'Dry-run: everything happens, and at the end nothing is saved.',
        f(o, t) { const ins = t > 0.6, rb = t > 2.6; lit(o, 'lb', 'est'); if (ins) lit(o, 'som');
          o.rows.lb = act('mesh', 'ISTIO', ['copy: 10% → shadow', 'acc']);
          o.rows.est = act('pedidos 2.4.0', 'STABLE', ['tx.Commit()', 'acc'], ['1059 saved', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SHADOW', [rb ? 'tx.Rollback()' : ins ? 'BEGIN · INSERT 1059' : 'receives the copy', 'acc'], [rb ? 'rows saved: 0' : ins ? 'inside the transaction' : '', 'dim'], ['ENVIRONMENT = shadow', 'dim']);
          beam(o, CS.som, t < 0.6, '', t < 0.6); beam(o, CS.est, true);
          if (rb) T(o, [420, 300, 60], 'Rollback: nothing saved', 'acc');
          o.cnt = [['SHADOW ROWS', rb ? '0' : ins ? '1 (in the tx)' : '0'], ['1059 IN THE DB', '1 (from 2.4.0)', 'dim'], ['DUPLICATES', '0', 'dim']];
          o.res = rb ? [['dry-run: undone at the end', 'acc']] : []; } },
      { id: 'catalogo', dur: 7, title: 'The ideal case: mirroring reads on catalogo', yk: 'THE MATH (MODULE 14)',
        code: ['catalogo: 640 req/s on the stable one', '10% mirror → 64 req/s', '1 new replica handles 100 req/s', 'ρ = 64 / 100 = 64% · R = 37.8 ms', 'measures the new search with real traffic'],
        story: 'Reads are the article\'s ideal case: there is nothing to undo. Mirroring 10% of <code>catalogo</code>\'s <b>640 req/s</b> gives <b>64 req/s</b> to <b>1</b> replica of the new version, which handles 100: ρ = <b>64%</b> and R = <b>37.8 ms</b> (the table from module 14). You can measure the new search\'s p95 (the 900 ms one) with real traffic, with no customer exposed.',
        look: 'The same arrangement, now with catalogo: the copy goes down to the new replica, and its CPU bar stops at 64%.',
        key: 'Mirroring reads is safe; the shadow needs capacity for the copy.',
        f(o, t) { const r = lin(t, 0.4, 3.0, 0, 64); lit(o, 'lb', 'est', 'som', 'cmp');
          o.rows.cli = act('customers', 'SEARCHES', ['640 req/s', 'hi'], ['on the catalog', 'dim']);
          o.rows.lb = act('mesh', 'ISTIO', ['640 req/s', 'hi'], ['stable: 100%', 'acc'], ['copy: 10% → shadow', 'acc']);
          o.rows.est = act('current catalogo', 'STABLE', ['640 req/s', 'acc'], ['answers the customer', 'dim']);
          o.rows.som = act('new catalogo', 'SHADOW · 1 REPLICA', [`${Math.round(r)} req/s`, 'acc'], ['R = 37.8 ms', 'dim']); o.rows.som.bar = [r / 100, 'acc', `CPU ${Math.round(r)}%`];
          o.rows.cmp = act('comparator', 'SEARCH p95', ['real traffic, 0 exposed', 'acc']);
          o.rows.pag = act('nothing to undo', 'READ', ['no charge, no event', 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', true); beam(o, CS.cs, true);
          o.cnt = [['ON THE SHADOW', `${Math.round(r)} req/s`], ['SHADOW ρ', `${Math.round(r)}%`, 'dim'], ['R', '37.8 ms', 'dim']];
          o.res = r >= 64 ? [['64 req/s on 1 replica: 64%', 'acc']] : []; } },
      { id: 'cobranca', dur: 9, title: 'What if it goes wrong: Rollback does not undo the charge', yk: 'WHAT LEFT THE TRANSACTION',
        code: ['tx.Rollback() undoes the INSERT', 'but the shadow already called pagamentos', 'and published the event to Kafka', '0.5/s × 5 min = 150 duplicate charges', '× R$ 64.00 on average = R$ 9,600'],
        story: '<code>Rollback</code> only undoes what is inside the transaction. Shadow 2.5.0 also <b>really called <code>pagamentos</code></b> and <b>published the event</b> to Kafka. At 0.5 copy per second, in 5 min that is <b>150 duplicate charges</b>, × R$ 64.00 on average = <b>R$ 9,600</b>. The fix: the shadow calls a <b>stub</b> of <code>pagamentos</code> (or sends <code>Idempotency-Key</code> and <code>x-shadow: 1</code>, which <code>pagamentos</code> refuses to carry out) and publishes to a <code>pedidos.shadow</code> topic, never to <code>pedidos</code>.',
        look: 'A red cable leaves the shadow to pagamentos and Kafka; the duplicate charges counter climbs to 150.',
        key: 'Rollback does not undo what left the transaction.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 6.0, 0, 150)); lit(o, 'lb', 'est'); o.on.som = 'bad'; o.on.pag = n ? 'bad' : 0;
          o.rows.lb = act('mesh', 'ISTIO', ['copy: 10% → shadow', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SHADOW', ['tx.Rollback()', 'acc'], ['but it called pagamentos', 'bad'], ['and published the event', 'bad']);
          o.rows.pag = act('pagamentos · Kafka', 'EFFECTS', [`duplicate charges: ${n}`, 'bad'], ['shadow event published', 'bad']);
          beam(o, CS.som, true, '', true); beam(o, CS.pag, true, 'bad', true);
          if (n >= 150) T(o, TE([735, 300, 60]), 'fix: stub + pedidos.shadow', 'acc');
          o.cnt = [['DUPLICATE CHARGES', String(n), 'bad'], ['AMOUNT', `R$ ${thou(n * 64)}`, 'bad'], ['FIX', 'stub + x-shadow', 'dim']];
          o.res = n >= 150 ? [['R$ 9,600 charged extra', 'bad'], ['fix: stub and pedidos.shadow', 'acc']] : []; } },
      { id: 'lab', dur: 8, title: 'The author\'s lab: 1% mirror to chip-shadow', yk: 'shadow/chip.yml (READ, NOT RUN)',
        code: ['istio.virtualService.mirror:', '  enabled: true', '  host: chip.shadow.svc.cluster.local', '  port: "8080"', '  percent: 1', 'chip-shadow (shadow.yml): v9, min 1, max 1'],
        story: 'In the author\'s public repository, the <code>chip</code> app (10 replicas) has <code>mirror</code> with <code>percent: 1</code> to <code>chip.shadow.svc.cluster.local</code>. <code>chip-shadow</code> (namespace <code>shadow</code>, version <code>v9</code>) runs <b>1</b> replica, with no autoscaling. They are two apps: the shadow lives outside the stable one\'s namespace. What the store is missing: a <b>comparator</b> (the lab only looks at Prometheus\'s <code>/metrics</code>); a <b>sample</b> (1% of 5 orders/s = 0.05/s, 3 orders per minute, little for <code>pedidos</code>); and <b>capacity</b> (1 shadow replica for 10 of the stable one). The lab only runs on the author\'s cluster; here it was read, not run.',
        look: 'The thin 1% copy goes down to chip-shadow; the place of the comparator is red: it does not exist in the lab.',
        key: 'The lab shows the mirror; the comparator is missing.',
        f(o, t) { lit(o, 'lb', 'est', 'som'); o.on.cmp = 'bad';
          o.rows.cli = act('customers', 'TRAFFIC', ['5 orders/s', 'hi']);
          o.rows.lb = act('mesh', 'ISTIO', ['mirror: percent 1', 'acc'], ['0.05/s = 3 per min', 'dim']);
          o.rows.est = act('chip', 'STABLE · 10 REPLICAS', ['answers as normal', 'acc']);
          o.rows.som = act('chip-shadow', 'NAMESPACE shadow', ['v9 · 1 replica', 'acc'], ['no autoscaling', 'dim']);
          o.rows.cmp = act('comparator', 'DOES NOT EXIST', ['only /metrics', 'bad'], ['no diff', 'dim']);
          o.rows.pag = act('what is missing', 'FOR THE STORE', ['comparator · sample', 'dim'], ['shadow capacity', 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', (clk % 4) < 1.3); beam(o, CS.cs, false, 'bad');
          o.cnt = [['MIRROR', '1%'], ['ON pedidos', '3 orders/min', 'dim'], ['COMPARATOR', 'none', 'bad']];
          o.res = [['read, not run', 'dim'], ['the comparator is missing', 'bad']]; } },
      { id: 'cem', dur: 8, title: 'What if it goes wrong: a 100% mirror onto 1 replica', yk: 'THE MATH',
        code: ['catalogo: 640 req/s, 100% mirror', '1 shadow replica: 100 req/s', 'ρ = 640 / 100 = 640%', 'the queue grows without stopping', 'the response is discarded: nobody sees'],
        story: 'Raise the <code>catalogo</code> mirror to <b>100%</b>: 640 req/s to <b>1</b> replica that handles 100. The math gives <b>640%</b> CPU, and the queue grows without stopping. Since the mesh discards the response, no customer notices: only the shadow\'s own metric shows the damage. And, if the shadow shares a database or cache with the stable one, the stable one feels it. The shadow needs capacity for what it copies: 10% × 640 = 64 req/s fits in 100.',
        look: 'The copy thickens up to 100%; the shadow\'s CPU bar goes past the end and turns red, while the stable one keeps running normally.',
        key: 'The shadow has to handle the copy it receives.',
        f(o, t) { const pct = lin(t, 0.4, 4.0, 10, 100), load = 640 * pct / 100, over = load > 100; lit(o, 'lb', 'est'); o.on.som = over ? 'bad' : 1;
          o.rows.cli = act('customers', 'SEARCHES', ['640 req/s', 'hi']);
          o.rows.lb = act('mesh', 'ISTIO', [`copy: ${Math.round(pct)}% → shadow`, over ? 'bad' : 'acc']);
          o.rows.est = act('current catalogo', 'STABLE', ['640 req/s', 'acc'], ['answers as normal', 'dim']);
          o.rows.som = act('new catalogo', 'SHADOW · 1 REPLICA', [`${Math.round(load)} req/s`, over ? 'bad' : 'acc'], [over ? 'queue growing' : 'fits', over ? 'bad' : 'dim']);
          o.rows.som.bar = [load / 640, over ? 'bad' : 'acc', `CPU ${Math.round(load)}% (scale: 640%)`];
          o.rows.cmp = act('customers who notice', 'NONE', ['the response is discarded', 'dim']);
          o.rows.pag = act('database and cache', 'IF SHARED', [over ? 'the stable one feels it' : 'fine', over ? 'bad' : 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, over ? 'bad' : '', true);
          o.cnt = [['MIRROR', `${Math.round(pct)}%`], ['SHADOW CPU', `${Math.round(load)}%`, over ? 'bad' : ''], ['CUSTOMERS WHO NOTICE', '0', 'dim']];
          o.res = pct >= 100 ? [['640%: infinite queue', 'bad'], ['10% → 64 req/s fits', 'acc']] : []; } },
    ],
    flag: [
      { id: 'publica', dur: 7, title: 'Deploy with the flag off', yk: 'DEPLOY × RELEASE',
        code: ['deploy: pedidos 2.5.0 on 3 of 3 pods', 'flag frete_v2: 0% (off)', 'if frete_v2 { new table by ZIP }', 'else       { old calculation }', 'releasing = turning the flag on, no deploy'],
        story: 'The 2.5.0 code goes to <b>100% of the pods</b> with the <code>frete_v2</code> flag <b>off</b>. The rolling happens with no effect on the customer: every order still goes through the old shipping calculation. <b>Deploying</b> and <b>releasing</b> become two separate decisions: releasing is turning the flag on, and whoever turns it on can be the business, without a deploy. Lena places the 1059 and pays 64.00.',
        look: 'The 3 pods light up with the new code, but each one\'s flag is off; in the bucket panel, nobody is on the on side.',
        key: 'The flag separates deploying from releasing.',
        f(o, t) { const a = go_(t, 0.4, 1.4); lit(o, 'fpods', 'flg'); if (a > 0) lit(o, 'bkt');
          beam(o, CF.flg, a > 0 && a < 1); pk(o, CF.flg, a, 'frete_v2: 0%');
          o.cnt = [['NEW CODE ON', '3 of 3 pods'], ['FLAG ON FOR', '0%', 'dim'], ['LENA PAYS', '64.00', 'dim']];
          o.res = a >= 1 ? [['deployed, not released', 'acc']] : []; } },
      { id: 'bucket', dur: 7, title: 'Who lands on which side: the bucket', yk: 'THE CALCULATION',
        code: ['bucket = murmur3("frete_v2:" + cliente_id) mod 100', 'on = bucket < percentage', 'caio-58 → 3 · lena-77 → 19', 'bia-31 → 38 · mkt-01 → 41', 'davi-12 → 94'],
        story: 'Turning it on for 10% is not drawing 10% of the requests: it is choosing 10% of the <b>customers</b>, always the same ones. The calculation is <code>bucket = murmur3("frete_v2:" + cliente_id) mod 100</code>, and the flag turns on when the bucket is lower than the percentage. In the store\'s sample: <code>caio-58</code> → <b>3</b>, <code>lena-77</code> → <b>19</b>, <code>bia-31</code> → <b>38</b>, <code>mkt-01</code> → <b>41</b>, <code>davi-12</code> → <b>94</b>. The flag name goes in as salt: on <code>nova_home</code> from module 9, the same Lena lands on 80.',
        look: 'The panel on the right puts each customer on the 0 to 99 ruler, one at a time.',
        key: 'The same customer always lands on the same side.',
        f(o, t) { const k = Math.min(5, Math.floor(lin(t, 0.3, 3.8, 0, 5.99))); lit(o, 'fpods', 'bkt');
          o.rows.bkt = bkD(0, { show: k, rows: [['murmur3 mod 100', 'acc']] });
          beam(o, CF.bkt, k < 5, '', k < 5);
          o.cnt = [['CUSTOMERS ON THE RULER', `${k} of 5`], ['SAME CUSTOMER', 'same bucket', 'dim'], ['LENA\'S nova_home', '80', 'dim']];
          o.res = k >= 5 ? [['3 · 19 · 38 · 41 · 94', 'acc']] : []; } },
      { id: 'um', dur: 6, title: '1%: nobody in the sample', yk: '1%',
        code: ['percentage = 1 → bucket < 1', 'sample: none of the 5', '100,000 customers: 985 on', 'close to the expected 1,000'],
        story: 'At 1%, the flag turns on for whoever has bucket 0. Nobody in the sample is there. Among 100,000 customers (<code>c-0</code> to <code>c-99999</code>), <b>985</b> have a bucket below 1, close to the expected 1,000: the function spreads well. It is a smoke step: few people, just to see that nothing blows up.',
        look: 'The percentage line shows at the start of the ruler; none of the five is on the lit side.',
        key: '1% is few people, and always the same ones.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.5, 0, 1)); lit(o, 'flg', 'fpods', 'bkt');
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p);
          o.rows.fpods.tape = [['1%', 'ok'], ['1%', 'ok'], ['1%', 'ok']];
          beam(o, CF.flg, t < 1.6, '', t < 1.6);
          o.cnt = [['PERCENTAGE', `${p}%`], ['ON IN 100,000', p ? '985' : '0', 'dim'], ['IN THE SAMPLE', '0 of 5', 'dim']];
          o.res = p ? [['985 of 100,000', 'acc']] : []; } },
      { id: 'dez', dur: 8, title: '10%: only Caio, from Rio, and the metric already flags it', yk: '10% FOR 5 MIN',
        code: ['percentage = 10 → bucket < 10', 'sample: caio-58 (3), from Rio', '100,000 customers: 9,878 on', '5 orders/s × 300 s × 10% = 150 orders', '20% from Recife: 30 × 15.00 = R$ 450'],
        story: 'At 10% Caio comes in (bucket 3), who is from Rio: in the sample, nobody sees the defect. But 10% of the store is <b>9,878</b> of 100,000 customers, and 20% of the orders go to Recife. In 5 min that is 150 orders with the flag on, <b>30</b> from Recife with frete 0.00: <b>R$ 450</b>. The <code>frete_zero</code> metric by city, separating whoever has the flag on, shows Recife off the curve.',
        look: 'The percentage line moves up to 10 and Caio lights up. On the left, Recife\'s frete_zero metric starts to climb.',
        key: 'What decides is the business metric, by bucket.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.5, 1, 10)), n = Math.round(lin(t, 1.8, 6.0, 0, 30)); lit(o, 'flg', 'fpods', 'bkt'); if (n) o.on.fmet = 'bad';
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p);
          o.rows.fpods.tape = [[p + '%', 'ok'], [p + '%', 'ok'], [p + '%', 'ok']];
          o.rows.fmet = act('frete_zero', 'FLAG ON', ['SP 0 · Rio 0', 'dim'], [`Recife ${n}`, n ? 'bad' : 'dim']);
          beam(o, CF.met, n > 0, n > 0 ? 'bad' : '', n > 0 && n < 30);
          o.cnt = [['PERCENTAGE', `${p}%`], ['ZERO SHIPPING IN RECIFE', String(n), 'bad'], ['LOSS', `R$ ${thou(n * 15)}`, 'dim']];
          o.res = n >= 30 ? [['30 orders, R$ 450', 'bad'], ['the metric flags it at 10%', 'acc']] : []; } },
      { id: 'vinte', dur: 8, title: '20%: Lena comes in, and the 1059 goes out for 49.00', yk: '20%',
        code: ['percentage = 20 → bucket < 20', 'sample: caio-58 (3), lena-77 (19)', 'order 1059: 49.00 + frete 0.00', 'should be 49.00 + 15.00 = 64.00', 'at 50%: Caio, Lena, Bia and mkt-01'],
        story: 'At 20% Lena comes in (bucket 19). The 1059, a black T-shirt of 49.00 to Recife, goes out for <b>49.00</b>: the new table does not have the ZIP range 50000–52999 and returns frete 0.00. Status 201, same latency, 0% errors: only the business metric flags it. If nobody looked, the next step would be 50%: Caio, Lena, Bia and <code>mkt-01</code>.',
        look: 'The percentage line passes 19 and Lena enters the lit side, in red, with the 1059 at 49.00.',
        key: 'The Recife defect needs a Recife customer on the on side.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.6, 10, 20)), in_ = p > 19; lit(o, 'flg', 'fpods'); o.on.bkt = in_ ? 'bad' : 1; o.on.fmet = 'bad';
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p, { bad: in_ ? ['lena-77'] : [] });
          o.rows.fpods.tape = [[p + '%', 'ok'], [p + '%', 'ok'], [p + '%', 'ok']];
          o.rows.fmet = act('frete_zero', 'FLAG ON', ['SP 0 · Rio 0', 'dim'], ['Recife climbing', 'bad']);
          const a = go_(t, 2.0, 3.0); beam(o, CF.bkt, a > 0 && a < 1, 'bad'); pk(o, rev(CF.bkt), a, '1059: 49.00', 'bad');
          if (in_) T(o, TE([890, 130, 50]), 'lena-77 · 1059: 49.00', 'bad');
          o.cnt = [['PERCENTAGE', `${p}%`], ['ORDER 1059', in_ ? '49.00' : '64.00', in_ ? 'bad' : ''], ['SHOULD BE', '64.00', 'dim']];
          o.res = in_ ? [['Lena came in: frete 0.00', 'bad']] : []; } },
      { id: 'kill', dur: 9, title: 'Kill switch: turn it off, and it takes up to 30 s', yk: 'THE 30 S CACHE',
        code: ['frete_v2 → 0%', 'each pod rereads the flag when its cache expires', 'TTL 30 s: up to 30 s for the 3 to agree', 'in that interval, two pods disagree', 'that is why the calculation is per customer'],
        story: 'The metric spiked: the flag is turned off. There is no deploy or image rollback; the 2.5.0 code stays on the pods, switched off. But each pod keeps the flag in a local cache of <b>30 s</b>, so the change takes up to 30 s to reach all of them. In that interval two pods can disagree, and one of Lena\'s orders can land on a pod that still has the flag on. That is why the calculation is per customer, not per request: outside that window, she always sees the same version. The standard API for this kind of flag is OpenFeature\'s.',
        look: 'The flag service sends 0%; the pods turn off one by one, as each one\'s cache expires, until the 3 agree.',
        key: 'Turning it off is immediate in the service and takes up to 30 s on the pods.',
        f(o, t) { const s = lin(t, 0.6, 6.6, 0, 30), exp = [8, 19, 30], k = exp.filter(e => s >= e).length; lit(o, 'flg', 'fpods'); o.on.bkt = k < 3 ? 'bad' : 1;
          o.rows.flg.rows[0] = ['frete_v2: 0%', 'acc'];
          o.rows.fpods.rows = [[k < 3 ? `${3 - k} pod(s) still on` : '3 pods off', k < 3 ? 'bad' : 'acc'], ['flag cache: 30 s', 'dim']];
          o.rows.fpods.tape = exp.map(e => s >= e ? ['0%', 'ok'] : ['20%', 'bad']);
          o.rows.bkt = bkD(k < 3 ? 20 : 0, { bad: k < 3 ? ['lena-77'] : [], rows: [[k < 3 ? 'in transition: 20% or 0%' : 'percentage: 0%', k < 3 ? 'bad' : 'acc']] });
          beam(o, CF.flg, s < 30, '', s < 30);
          o.cnt = [['SINCE TURNING OFF', `${Math.round(s)} s`], ['PODS OFF', `${k} of 3`, 'dim'], ['DEPLOY', 'none', 'dim']];
          o.res = k === 3 ? [['off in ≤ 30 s', 'acc'], ['no deploy, no rollback', 'acc']] : []; } },
      { id: 'padrao', dur: 9, title: 'What if it goes wrong: the flag service goes down and the default is true', yk: 'THE COMPILED DEFAULT',
        code: ['flag service: down', 'pod: uses the last cached value', 'cache expires → uses the code default', 'default = true → frete_v2 on for 100%', 'rule: default = old behavior (false)'],
        story: 'The flag service goes down. Each pod keeps the last value it had in the cache; when the cache expires, it uses the <b>default</b> written in the code. If someone left the default as <code>true</code> after the launch, the feature turns on for <b>everyone</b> at once, with no deploy and no canary: even Davi (bucket 94). Rule: the default is the old behavior (<code>false</code>), and the flag leaves the code as soon as it reaches 100% and stabilizes. An old flag is debt: each one doubles the possible states, and 5 flags are 32 combinations.',
        look: 'The flag service turns red; when the cache expires, the percentage line jumps to the end of the ruler and all five customers come in, Lena in red.',
        key: 'The flag\'s default is the old behavior.',
        f(o, t) { const down = t > 0.6, all = t > 3.2; o.on.flg = down ? 'bad' : 1; lit(o, 'fpods'); o.on.bkt = all ? 'bad' : 0; if (all) o.on.fmet = 'bad';
          o.rows.flg = act('flag service', 'OPENFEATURE', [down ? 'down' : 'frete_v2: 0%', down ? 'bad' : 'acc'], ['default in code: true', all ? 'bad' : 'dim']);
          o.rows.fpods.rows = [[all ? 'uses the default: true' : down ? 'uses the cache: 0%' : 'cache: 0%', all ? 'bad' : 'acc'], ['flag cache: 30 s', 'dim']];
          o.rows.fpods.tape = Array(3).fill(all ? ['100%', 'bad'] : ['0%', 'ok']);
          o.rows.bkt = bkD(all ? 100 : 0, { bad: all ? ['lena-77'] : [], rows: [[all ? 'percentage: 100% (default)' : 'percentage: 0%', all ? 'bad' : 'acc']] });
          o.rows.fmet = act('frete_zero', 'BY CITY', ['SP 0 · Rio 0', 'dim'], [all ? 'Recife: everyone' : 'Recife 0', all ? 'bad' : 'dim']);
          beam(o, CF.flg, false, down ? 'bad' : '');
          if (all) T(o, TF(), 'turns on for everyone, no deploy', 'bad');
          o.cnt = [['frete_v2 ON FOR', all ? '100%' : '0%', all ? 'bad' : ''], ['SOURCE', all ? 'code default' : down ? 'cache' : 'service', 'dim'], ['CORRECT WOULD BE', 'false', 'dim']];
          o.res = all ? [['default true: 100% at once', 'bad'], ['default = false; remove the flag', 'acc']] : []; } },
    ],
    aneis: [
      { id: 'aneis', dur: 7, title: 'Three shards, three rings: 20 → 40 → 100%', yk: 'THE STORE\'S RINGS',
        code: ['ring 0 = shard-0 (20%): davi-12', 'ring 1 = shard-1 (20%): lena-77, bia-31', 'ring 2 = shard-2 (60%): caio-58, mkt-01', 'accumulated exposure: 20% → 40% → 100%', 'only moves on after the bake time'],
        story: 'The shards by <code>cliente_id</code> from module 16 are already rings: each one is a fraction of the traffic. The same version goes ring by ring, in order of risk, and only moves on to the next if the previous one stays healthy for the <b>bake time</b> (the AWS idea: <i>one-box</i>, waves, <i>bake time</i>). <code>mkt-01</code> lives on <code>shard-2</code>, which is why it has 60% of the traffic. Accumulated exposure: <b>20%</b>, <b>40%</b>, <b>100%</b>.',
        look: 'The three shards on the right light up in order; the biggest, shard-2, carries 60% of the traffic.',
        key: 'Each shard is a ring: a fraction of the traffic that receives the version in turn.',
        f(o, t) { const k = Math.min(3, Math.floor(lin(t, 0.4, 3.4, 0, 3.99))); lit(o, 'pipe'); for (let i = 0; i < k; i++) lit(o, 'r' + i);
          o.rows.pipe.tape = [0, 1, 2].map(i => ['ring ' + i, i < k ? 'ok' : 'none']); o.rows.pipe.bar = [0, 'acc', 'exposure: 0% (still on 2.4.0)'];
          [CA.r0, CA.r1, CA.r2].forEach((c, i) => beam(o, c, i < k));
          o.cnt = [['RINGS', String(k)], ['EXPOSURE', '20 → 40 → 100%', 'dim'], ['NEW VERSION', '2.5.0', 'dim']];
          o.res = k >= 3 ? [['20% · 20% · 60%', 'acc']] : []; } },
      { id: 'anel0', dur: 8, title: 'Ring 0: Davi does not exercise Recife', yk: 'RING 0 + BAKE TIME',
        code: ['2.5.0 on shard-0: 20% of the traffic', 'davi-12 buys for SP: correct shipping', 'bake time: frete_zero = 0', 'ring 0 healthy → moves on to ring 1'],
        story: '2.5.0 goes to <code>shard-0</code>, 20% of the traffic. In the store\'s sample, whoever is there is Davi, who buys for SP: his ZIP range exists in the new table and the shipping comes out right. The bake time passes with <code>frete_zero</code> at 0, and the pipeline moves on to ring 1. The ring was not wrong: it just did not exercise the defective code.',
        look: 'The version goes down to ring 0; the bake clock runs on the pipeline and the metric, on the left, stays at 0.',
        key: 'A healthy ring only proves what it exercised.',
        f(o, t) { const a = go_(t, 0.4, 1.4), bake = lin(t, 1.6, 5.0, 0, 1), ok = bake >= 1; lit(o, 'pipe', 'amet'); if (a >= 1) { lit(o, 'r0'); ring(o, 0, '2.5.0'); }
          o.rows.pipe.tape = [['ring 0', a >= 1 ? 'ok' : 'none'], ['ring 1', 'none'], ['ring 2', 'none']];
          o.rows.pipe.rows[1] = [ok ? 'bake passed: moves on' : a >= 1 ? `bake ${Math.round(bake * 100)}%` : 'sends to ring 0', ok ? 'acc' : 'dim'];
          o.rows.pipe.bar = [a >= 1 ? 0.2 : 0, 'acc', `exposure: ${a >= 1 ? 20 : 0}%`];
          beam(o, CA.r0, a > 0, '', a > 0 && !ok); pk(o, CA.r0, a, '2.5.0'); beam(o, CA.met, a >= 1);
          o.cnt = [['EXPOSED', a >= 1 ? '20%' : '0%'], ['ZERO SHIPPING', '0', 'dim'], ['BAKE', ok ? 'passed' : '…', 'dim']];
          o.res = ok ? [['ring 0 healthy', 'acc'], ['Davi is from SP', 'dim']] : []; } },
      { id: 'anel1', dur: 9, title: 'Ring 1: Lena, and the defect shows up with 40% exposed', yk: 'RING 1',
        code: ['2.5.0 on shard-1: exposure 40%', 'lena-77, order 1059: 49.00 (frete 0.00)', 'Recife frete_zero goes up', 'the pipeline stops and rolls ring 1 back', 'ring 2 (60%) receives nothing'],
        story: 'In ring 1 is Lena. The 1059 goes out for <b>49.00</b> and the Recife <code>frete_zero</code> metric climbs. The pipeline stops and rolls ring 1 back to 2.4.0; ring 2, with 60% of the traffic, never even gets the version. But the defect only showed up with <b>40%</b> of the traffic already on 2.5.0. Who exercises the code matters more than the size of the ring.',
        look: 'The version goes down to ring 1, which turns red with the 1059 at 49.00; the metric on the left lights up and, at the end, ring 1 goes back to 2.4.0.',
        key: 'Who exercises the code matters more than the size of the ring.',
        f(o, t) { const a = go_(t, 0.4, 1.3), bad = t > 2.0, back = t > 5.0; lit(o, 'pipe', 'r0'); ring(o, 0, '2.5.0');
          if (a >= 1 && !back) { o.on.r1 = bad ? 'bad' : 1; ring(o, 1, bad ? '2.5.0 · 1059: 49.00' : '2.5.0', bad ? 'bad' : 'acc'); } else if (back) { lit(o, 'r1'); ring(o, 1, 'back: 2.4.0', 'acc'); }
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[1] = ['ring 1: Recife climbs', 'bad']; }
          o.rows.pipe.tape = [['ring 0', 'ok'], ['ring 1', bad ? 'bad' : a >= 1 ? 'ok' : 'none'], ['ring 2', 'none']];
          o.rows.pipe.rows[1] = [back ? 'stopped: ring 1 rolled back' : bad ? 'frete_zero: stop' : 'sends to ring 1', bad ? 'bad' : 'dim'];
          o.rows.pipe.bar = [back ? 0.2 : a >= 1 ? 0.4 : 0.2, bad && !back ? 'bad' : 'acc', `exposure: ${back ? 20 : a >= 1 ? 40 : 20}%`];
          beam(o, CA.r1, a > 0, bad && !back ? 'bad' : ''); pk(o, CA.r1, a, '2.5.0'); beam(o, CA.met, bad, 'bad', bad && !back); beam(o, CA.r0, true);
          if (bad && !back) T(o, TE([890, 250, 46]), 'lena-77 · 1059: 49.00', 'bad');
          o.cnt = [['EXPOSED WHEN IT SHOWED UP', '40%', 'bad'], ['ORDER 1059', bad ? '49.00' : '…', 'bad'], ['RING 2', 'received nothing', 'dim']];
          o.res = bad ? [['showed up with 40% exposed', 'bad'], ['ring 2 stayed out', 'acc']] : []; } },
      { id: 'sinteticos', dur: 9, title: 'Fix: synthetic customers in ring 0', yk: 'ONE-BOX WITH SYNTHETICS',
        code: ['ring 0 + synthetic customers', 'test orders for SP, Rio and Recife', 'synthetic Recife: frete 0.00 → stops', 'exposure when it stopped: 20%', 'k-means groups; does not say who is low risk'],
        story: 'The fix is to make the first ring exercise everything: <b>synthetic customers</b> with orders in every city run in ring 0 (the AWS <i>one-box</i>). The synthetic order for Recife comes back with frete 0.00 and the pipeline stops still in ring 0, at 20%: Lena never even sees 2.5.0. The article suggests choosing the first ring by customer <b>cluster</b> (k-means over segment, volume and region). Correction: k-means only discovers similar groups; it does not say which are low risk. The first ring is chosen by risk and business (employees, synthetics, small regions), and clustering helps with the next step.',
        look: 'The synthetics, on the left, send orders to the pipeline, which takes them to ring 0; the Recife one comes back red and the pipeline stops there.',
        key: 'The first ring has to exercise every path.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.4, 2.3), bad = t > 2.6; lit(o, 'sin', 'pipe'); o.on.r0 = bad ? 'bad' : b > 0 ? 1 : 0; ring(o, 0, bad ? 'synthetic Recife: 0.00' : '2.5.0', bad ? 'bad' : 'acc');
          o.rows.sin = act('synthetic customers', 'ONE-BOX', ['SP · Rio · Recife', 'acc'], [bad ? 'Recife: frete 0.00' : 'test orders', bad ? 'bad' : 'dim']);
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[0] = ['ring 0: Recife (test)', 'bad']; }
          o.rows.pipe.tape = [['ring 0', bad ? 'bad' : 'ok'], ['ring 1', 'none'], ['ring 2', 'none']];
          o.rows.pipe.rows[1] = [bad ? 'stopped at ring 0' : 'ring 0 + synthetics', bad ? 'bad' : 'dim'];
          o.rows.pipe.bar = [0.2, 'acc', 'exposure: 20%'];
          beam(o, CA.sin, a > 0 && a < 1); beam(o, CA.r0, b > 0, bad ? 'bad' : ''); beam(o, CA.met, bad, 'bad');
          pk(o, CA.sin, a, 'synthetic order · Recife'); pk(o, CA.r0, b, 'Recife (test)');
          if (bad) T(o, TF(), 'stopped at ring 0: Lena never saw it', 'acc');
          o.cnt = [['STOPPED AT', bad ? 'ring 0' : '…', bad ? '' : 'dim'], ['EXPOSED', '20%', 'dim'], ['LENA AFFECTED', 'no', 'dim']];
          o.res = bad ? [['caught in ring 0, at 20%', 'acc'], ['k-means: groups, not risk', 'dim']] : []; } },
      { id: 'custo', dur: 7, title: 'The cost: pods and versions per ring', yk: 'THE POD MATH',
        code: ['3 pods of pedidos → 1 per shard, 30/s each', 'shard-2: 60% of 30 orders/s = 18/s (fits)', 'Black Friday: 60 × 60% = 36/s > 30', 'the hot ring needs more pods', 'and one version per ring to operate'],
        story: 'Rings cost. The 3 <code>pedidos</code> pods become <b>1 per shard</b>, of 30 orders/s each. With 30 orders/s in the store, <code>shard-2</code> receives 60%: <b>18/s</b>, it fits. With Black Friday traffic doubled, 60 × 60% = <b>36/s</b> goes over 30: the hot ring needs more pods. And there is one version per ring to operate and monitor. It is the bulkhead applied to change (the ring is the blast radius of the change), and the path to the cells of module 26.',
        look: 'The load bar of shard-2 rises from 18/s to 36/s and goes past the limit of 30, in red.',
        key: 'Each ring needs its own capacity.',
        f(o, t) { const l = lin(t, 1.0, 4.0, 18, 36), over = l > 30; lit(o, 'pipe', 'r0', 'r1'); o.on.r2 = over ? 'bad' : 1;
          o.rows.r0.rows = [['1 pod · 30/s', 'dim'], ['20%', 'dim']]; o.rows.r1.rows = [['1 pod · 30/s', 'dim'], ['20%', 'dim']];
          o.rows.r2.rows = [['1 pod · handles 30/s', 'hi'], [`load ${Math.round(l)}/s`, over ? 'bad' : 'acc']]; o.rows.r2.bar = [l / 40, over ? 'bad' : 'acc', `${Math.round(l)} of 30/s (scale: 40)`];
          o.rows.pipe.rows[1] = ['one version per ring', 'dim'];
          o.cnt = [['SHARD-2', `${Math.round(l)}/s`, over ? 'bad' : ''], ['ONE POD HANDLES', '30/s', 'dim'], ['BLACK FRIDAY', '36/s', 'bad']];
          o.res = over ? [['the hot ring needs more pods', 'bad']] : [['18/s: fits', 'acc']]; } },
      { id: 'ultimo', dur: 8, title: 'What if it goes wrong: the last step is from 40% to 100%', yk: 'THE STEPS',
        code: ['ring 0: 20% · ring 1: +20% · ring 2: +60%', 'the biggest jump is the last one', 'a defect that only shows under mkt-01\'s load:', '  passes clean through rings 0 and 1', 'fix: split ring 2 or add a ring in between'],
        story: 'The rings grow 20, 20 and 60: the last step, from <b>40% to 100%</b>, is the biggest and the riskiest. If the defect only shows up under <code>mkt-01</code>\'s load, it passes clean through rings 0 and 1 and blows up in ring 2, with 60% of the traffic at once. Fix: split ring 2 (the dedicated <code>shard-2</code> from module 16) or add an intermediate ring.',
        look: 'Rings 0 and 1 stay lit and healthy; the version reaches ring 2 and the exposure jumps from 40% to 100%, in red.',
        key: 'The final step is the biggest: split the big ring.',
        f(o, t) { const a = go_(t, 0.8, 1.8), bad = t > 2.4, ex = lin(t, 0.8, 1.8, 40, 100); lit(o, 'pipe', 'r0', 'r1'); ring(o, 0, '2.5.0'); ring(o, 1, '2.5.0');
          if (a >= 1) { o.on.r2 = bad ? 'bad' : 1; ring(o, 2, bad ? '2.5.0 · blows up under load' : '2.5.0', bad ? 'bad' : 'acc'); }
          o.rows.pipe.tape = [['ring 0', 'ok'], ['ring 1', 'ok'], ['ring 2', bad ? 'bad' : a >= 1 ? 'ok' : 'none']];
          o.rows.pipe.bar = [ex / 100, bad ? 'bad' : 'acc', `exposure: ${Math.round(ex)}%`];
          o.rows.pipe.rows[1] = [bad ? 'jump of 60% at once' : 'rings 0 and 1 healthy', bad ? 'bad' : 'acc'];
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[2] = ['ring 2: mkt-01\'s load', 'bad']; }
          beam(o, CA.r0, true); beam(o, CA.r1, true); beam(o, CA.r2, a > 0, bad ? 'bad' : ''); pk(o, CA.r2, a, '2.5.0 · +60%');
          if (bad) T(o, TE([735, 260, 70]), 'split ring 2', 'acc');
          o.cnt = [['JUMP', '40% → 100%', 'bad'], ['RING 2', '60%', 'dim'], ['FIX', 'split ring 2', 'dim']];
          o.res = bad ? [['the biggest step is the last', 'bad'], ['split ring 2', 'acc']] : []; } },
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
  const cellFill = (x, u, C, s, X, Y, w, h) => { const light = theme === 'light';
    if (s === 'ok' || s === 'bad') { x.fillStyle = s === 'bad' ? BAD() : accC(); x.fillRect(u(X), u(Y), u(w), u(h)); }
    else { x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(X), u(Y), u(w), u(h)); }
    x.strokeStyle = s === 'bad' ? BAD() : s === 'ok' ? accC() : C.line; x.lineWidth = u(0.6); x.strokeRect(u(X + 0.5), u(Y + 0.5), u(w - 1), u(h - 1)); };
  const cellInk = s => s === 'ok' || s === 'bad' ? (theme === 'light' ? '#f6f6f5' : '#141516') : INK();
  // uma fita de células apoiada em `bottom`: acesa = presente, contorno = vazia, vermelha = erro, riscada = desistiu
  function drawTape(x, u, C, tape, W_, bottom, label) {
    const n = Math.max(tape.length, 1), gap = 3, cw = Math.min(n > 6 ? 46 : 96, (W_ - 10 - gap * (n - 1)) / n), ch = 22, y0 = bottom - ch - 5;
    x.fillStyle = INK(); x.textAlign = 'left'; fitFont(x, u, label, 11, W_ - 10); x.fillText(label, u(5), u(y0 - 8));
    if (!tape.length) { x.strokeStyle = C.line; x.lineWidth = u(0.6); x.setLineDash([u(2.2), u(1.6)]); x.strokeRect(u(5.5), u(y0 + 0.5), u(W_ - 11), u(ch - 1)); x.setLineDash([]);
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'empty', 11, 60); x.fillText('empty', u(W_ / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; return; }
    tape.forEach(([lab, s], i) => { const X = 5 + i * (cw + gap); cellFill(x, u, C, s, X, y0, cw, ch);
      if (lab) { x.textAlign = 'center'; x.fillStyle = cellInk(s);
        fitFont(x, u, lab, 12, cw - 4); x.fillText(lab, u(X + cw / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left';
        if (s === 'off') { const tw = Math.min(cw - 4, x.measureText(lab).width / u(1)); x.strokeStyle = BAD(); x.lineWidth = u(1.4); x.beginPath();
          x.moveTo(u(X + cw / 2 - tw / 2 - 2), u(y0 + ch / 2)); x.lineTo(u(X + cw / 2 + tw / 2 + 2), u(y0 + ch / 2)); x.stroke(); } } });
  }
  // uma grade de células (as cópias de Recife no comparador)
  function drawGrid(x, u, C, cells, cols, W_, H_, y0) {
    const rows = Math.ceil(cells.length / cols), gap = 4, cw = (W_ - 10 - gap * (cols - 1)) / cols, ch = Math.min(34, (H_ - y0 - 6) / rows - gap);
    cells.forEach(([lab, s], i) => { const X = 5 + (i % cols) * (cw + gap), Y = y0 + Math.floor(i / cols) * (ch + gap); cellFill(x, u, C, s, X, Y, cw, ch);
      if (lab) { x.textAlign = 'center'; x.fillStyle = cellInk(s); fitFont(x, u, lab, 14, cw - 4); x.fillText(lab, u(X + cw / 2), u(Y + ch / 2 + 0.5)); x.textAlign = 'left'; } });
  }
  // uma barra apoiada em `bottom` (tamanho da tabela, CPU, exposição, carga)
  function drawBar(x, u, C, [fr, tn, lab], W_, bottom) {
    const ch = 20, y0 = bottom - ch - 5, w = W_ - 10, col = tn === 'bad' ? BAD() : accC(), light = theme === 'light';
    x.fillStyle = tn === 'bad' ? BAD() : INK(); x.textAlign = 'left'; fitFont(x, u, lab, 12, w); x.fillText(lab, u(5), u(y0 - 9));
    x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(5), u(y0), u(w), u(ch));
    x.fillStyle = col; x.fillRect(u(5), u(y0), u(w * clamp(fr)), u(ch));
    x.strokeStyle = col; x.lineWidth = u(0.8); x.strokeRect(u(5.5), u(y0 + 0.5), u(w - 1), u(ch - 1));
  }
  // a régua dos buckets: um cliente por linha, a marca no bucket dele, a linha do percentual atravessando tudo
  function drawBk(x, u, C, bk, W_, H_, y0) {
    const L0 = 8, tw = W_ - 16, n = bk.items.length, rh = Math.min(60, (H_ - y0 - 34) / n), X = b => L0 + tw * b / 100;
    if (bk.pct > 0) { x.globalAlpha = 0.16; x.fillStyle = accC(); x.fillRect(u(L0), u(y0 - 4), u(tw * Math.min(100, bk.pct) / 100), u(n * rh + 2)); x.globalAlpha = 1; }
    bk.items.forEach(([id, b, city, tn], i) => { const Y = y0 + i * rh, inside = b != null && b < bk.pct, col = tn === 'bad' ? BAD() : inside ? accC() : INK();
      x.textAlign = 'left'; x.fillStyle = col; const lab = id + (city ? ' · ' + city : ''); fitFont(x, u, lab, 16, tw * 0.74); x.fillText(lab, u(L0), u(Y + 10));
      x.textAlign = 'right'; const bl = b == null ? '?' : String(b); fitFont(x, u, bl, 17, 40); x.fillText(bl, u(L0 + tw), u(Y + 10));
      const ty = Y + 24, th = 12; x.fillStyle = theme === 'light' ? '#ececeb' : '#17181a'; x.fillRect(u(L0), u(ty), u(tw), u(th));
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(L0 + 0.25), u(ty + 0.25), u(tw - 0.5), u(th - 0.5));
      if (b != null) { x.fillStyle = col; x.fillRect(u(X(b) - 3), u(ty - 4), u(6), u(th + 8)); } });
    if (bk.pct > 0 && bk.pct < 100) { const xx = X(bk.pct); x.strokeStyle = accC(); x.lineWidth = u(1.6); x.setLineDash([u(3), u(2)]); x.beginPath(); x.moveTo(u(xx), u(y0 - 6)); x.lineTo(u(xx), u(y0 + n * rh)); x.stroke(); x.setLineDash([]); }
    x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, bk.foot, 11, W_ - 10); x.fillText(bk.foot, u(5), u(H_ - 12));
  }
  // a gaveta da coluna frete: estreita e comprida, enche de baixo para cima
  function drawCol(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P, [f, sub, tn] = d.col, light = theme === 'light';
    const top = 6, hh = H_ - 12, col = tn === 'bad' ? BAD() : accC();
    x.fillStyle = light ? '#ececeb' : '#17181a'; x.fillRect(u(4), u(top), u(W_ - 8), u(hh));
    x.fillStyle = col; x.globalAlpha = 0.85; x.fillRect(u(4), u(top + hh * (1 - clamp(f))), u(W_ - 8), u(hh * clamp(f))); x.globalAlpha = 1;
    x.strokeStyle = on ? col : C.line; x.lineWidth = u(0.8); x.strokeRect(u(4.5), u(top + 0.5), u(W_ - 9), u(hh - 1));
    x.save(); x.translate(u(W_ / 2), u(H_ / 2)); x.rotate(-Math.PI / 2); x.textAlign = 'center';
    const txt = `frete · ${sub}`, ink = f > 0.55 ? (light ? '#f6f6f5' : '#141516') : (on ? accC() : INK());
    x.fillStyle = light ? 'rgba(246,246,245,.9)' : 'rgba(20,21,22,.85)'; fitFont(x, u, txt, 15, hh - 16); const tw = x.measureText(txt).width;
    if (f > 0.05 && f < 0.95) x.fillRect(-tw / 2 - u(3), -u(9), tw + u(6), u(18));
    x.fillStyle = f > 0.05 && f < 0.95 ? (on ? accC() : INK()) : ink; x.fillText(txt, 0, u(0.5)); x.restore();
    cv.tex.needsUpdate = true;
  }
  function drawBlock(Bk, d, on) {
    if (d.col) return drawCol(Bk, d, on);
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, small = H_ < 80, light = theme === 'light';
    head(x, u, d, W_, col, small ? 15 : 18); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(26)); x.lineTo(u(W_ - 4), u(26)); x.stroke();
    const fs = d.fs || (small ? 14 : 16), lh = d.lh || (small ? 18 : 22);
    let y = small ? 40 : 41; for (const [text, tn] of d.rows || []) { if (text) {
      if (tn === 'mark') { x.fillStyle = accC(); x.fillRect(u(3), u(y - lh / 2 - 2.5), u(W_ - 6), u(lh)); }
      x.fillStyle = tn === 'mark' ? (light ? '#f6f6f5' : '#141516') : toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; }
    let bottom = H_;
    if (d.tape) { drawTape(x, u, C, d.tape, W_, bottom, d.tl || ''); bottom -= 49; }
    if (d.bar) drawBar(x, u, C, d.bar, W_, bottom);
    if (d.grid) drawGrid(x, u, C, d.grid, d.cols || 5, W_, H_, y - lh / 2 + 6);
    if (d.bk) drawBk(x, u, C, d.bk, W_, H_, y - lh / 2 + 10);
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
    const nl = Math.min(6, yl.length), lh = nl > 5 ? 11.6 : 13;
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * lh)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    migracao: () => `<li>Measured on a local PostgreSQL 14.24 (2026-10-20), <code>pedidos</code> table of 1,000,000 rows of ~2 KB (1,975 MB). Order of magnitude: do not extrapolate in a straight line.</li><table class="h3-sum"><tr><th>operation</th><th>time</th><th>effect</th></tr><tr class="on"><td><code>ADD COLUMN frete numeric(10,2)</code></td><td>3.2 ms</td><td>catalog only</td></tr><tr><td><code>ADD COLUMN moeda … DEFAULT 'BRL'</code></td><td>1.9 ms</td><td>default in the metadata</td></tr><tr><td><code>ADD COLUMN … DEFAULT random()</code></td><td>7.9 s</td><td>rewrites the table</td></tr><tr><td><code>UPDATE</code> at once</td><td>8.0 s</td><td>3,950 MB (+100%)</td></tr><tr class="on"><td>100 batches of 10,000</td><td>~66 ms/batch</td><td>2,407 MB (+22%)</td></tr><tr><td><code>CREATE INDEX</code></td><td>2.0 s</td><td><code>INSERT</code> waited 1.03 s</td></tr><tr><td><code>… CONCURRENTLY</code></td><td>2.95 s</td><td><code>INSERT</code> waited 28 ms</td></tr><tr><td><code>RENAME COLUMN</code></td><td>ms</td><td>2.4.0 breaks</td></tr></table><li>Lock queue: <code>SELECT</code> waited <b>4.0 s</b> behind the <code>ALTER</code>; with <code>lock_timeout = '1s'</code>, the <code>ALTER</code> gives up in <b>1.0 s</b></li><li>In the store: 16.67M rows per shard, batches of 10,000 with a 1 s pause ≈ <b>30 min per shard</b></li><li><code>mod 3</code> → <code>mod 4</code>: 75.2% of the keys change; ~113 of 150 orders on the wrong shard; Lena "loses" 1042, 1044, 1047, 1048, 1051, 1054, 1055 and 1056</li>`,
    shadow: () => `<table class="h3-sum"><tr><th>case</th><th>on the shadow</th><th>result</th></tr><tr class="on"><td><code>pedidos</code>, 10% mirror</td><td>0.5 order/s</td><td>150 copies in 5 min; 30 from Recife, all different (64.00 × 49.00)</td></tr><tr><td><code>catalogo</code>, 10% of 640 req/s</td><td>64 req/s on 1 replica</td><td>ρ 64%, R 37.8 ms</td></tr><tr><td><code>catalogo</code>, 100%</td><td>640 req/s on 1 replica</td><td>640%: endless queue</td></tr><tr><td>lab, <code>percent: 1</code></td><td>0.05 order/s</td><td>3 per minute</td></tr></table><li>Customers exposed to 2.5.0: <b>0%</b>; loss: <b>R$ 0</b></li><li>Without a stub: 150 duplicate charges × R$ 64.00 = <b>R$ 9,600</b> in 5 min</li><li>Istio: <code>mirror</code> + <code>mirrorPercentage</code>; the copy carries a <code>Host</code> ending in <code>-shadow</code>, "fire and forget"</li><li>The author's lab (read, not run): <code>shadow/chip.yml</code> and <code>shadow/shadow.yml</code> (<code>chip-shadow</code>, <code>v9</code>, 1 replica)</li>`,
    flag: () => `<table class="h3-sum"><tr><th>customer</th><th>frete_v2</th><th>nova_home</th><th>on from</th></tr>${CLI5.map(([id, b]) => `<tr${id === 'lena-77' ? ' class="on"' : ''}><td>${id}</td><td>${b}</td><td>${{ 'caio-58': 72, 'lena-77': 80, 'bia-31': 2, 'mkt-01': 87, 'davi-12': 67 }[id]}</td><td>${b + 1}%</td></tr>`).join('')}</table><li><code>bucket = murmur3("frete_v2:" + cliente_id) mod 100</code>; on if <code>bucket &lt; percentage</code></li><li>Across 100,000 customers: <b>985</b> below 1, <b>9,878</b> below 10, <b>49,909</b> below 50</li><li>At 10% for 5 min: 150 orders, 30 from Recife, <b>R$ 450</b></li><li>30 s local cache: turning it off takes up to 30 s; default always <code>false</code></li><li>Types (Fowler): release, experiment, ops (kill switch), permission</li>`,
    aneis: () => `<table class="h3-sum"><tr><th>ring</th><th>shard</th><th>traffic</th><th>accumulated</th><th>sample</th></tr><tr><td>0</td><td>shard-0</td><td>20%</td><td>20%</td><td>davi-12</td></tr><tr class="on"><td>1</td><td>shard-1</td><td>20%</td><td>40%</td><td>lena-77, bia-31</td></tr><tr><td>2</td><td>shard-2</td><td>60%</td><td>100%</td><td>caio-58, mkt-01</td></tr></table><li>The Recife defect shows up in ring 1, with <b>40%</b> exposed; with synthetics in ring 0, with <b>20%</b></li><li>1 pod per shard, 30 orders/s: shard-2 at 18/s fits; on Black Friday, 36/s does not</li><li>Correction to the article: k-means groups similar customers, it does not pick the low-risk ones</li><li>AWS Builders' Library: <i>one-box</i>, waves, <i>bake time</i></li>`,
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
  function readout() { if (active !== 'liberacao') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'liberacao' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-liberacao3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'liberacao') return;
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
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
