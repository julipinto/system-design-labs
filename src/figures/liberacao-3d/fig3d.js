// Figura 3D (iso-glow): liberar sem ser o incidente. O que muda no dado, a cópia do tráfego, a flag e os anéis, cada
// cenário com as suas peças; as de um cenário sobem e as dos outros descem para dentro da prancha.
// Migração: a migration e a fila de lock à esquerda; a tabela pedidos com a gaveta da coluna frete no meio; os 3 pods
// e quem lê o quê (ou os shards) à direita.
// Shadow: o app da Lena e a malha à esquerda; o estável e a sombra no meio; o comparador e o pagamentos à direita.
// Flag: o serviço de flags e a métrica à esquerda; os 3 pods no meio; o painel de buckets dos 5 clientes à direita.
// Anéis: a métrica e os clientes sintéticos à esquerda; o pipeline no meio; os 3 shards (20 · 20 · 60%) à direita.
// Atrás, o mostrador (contadores, a conta ou o código, o resultado).
// Cenários (botões e ?mode=migracao|shadow|flag|aneis; ?step=N abre no passo N).
// Dados: docs/escrita/deployment-brief.md (aulas 8–12): PostgreSQL 14 com 1.000.000 de linhas (3,2 ms · 7,9 s · 8,0 s ·
// +100% × +22% · 4,0 s × 1,0 s); 1059 da Lena 64,00 × 49,00; 150 cópias, 30 de Recife; R$ 9.600; buckets 3 · 19 · 38 · 41 · 94;
// 985 · 9.878; anéis 20 · 20 · 60%.
FIGS3D.push({ id: 'liberacao', name: 'Liberação', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  const brl = v => thou(Math.floor(v)) + ',' + String(Math.round((v % 1) * 100)).padStart(2, '0');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['migracao', 'shadow', 'flag', 'aneis'];
  const SCNAME = { migracao: 'Migração', shadow: 'Shadow', flag: 'Flag', aneis: 'Anéis' };
  const SCFULL = { migracao: 'O dado que não volta', shadow: 'A cópia do tráfego', flag: 'Publicar × liberar', aneis: 'Anéis por shard' };
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
  function tabD(rows, mb, cols, tone = 'acc') { const d = act('pedidos', 'TABELA', ...rows); d.tl = 'colunas'; d.tape = cols;
    d.bar = [mb / 3950, tone, `${thou(mb)} MB (escala: 3.950)`]; return d; }
  const freD = (f, sub, tone = 'acc') => ({ name: 'frete', meta: '', col: [f, sub, tone] });
  const pods = (...v) => v.map(s => [s, s === '2.4.0' ? 'none' : s === 'erro' ? 'bad' : 'ok']);
  // os 5 clientes da amostra e o bucket de cada um na frete_v2 (murmur3 mod 100)
  const CLI5 = [['caio-58', 3, 'Rio'], ['lena-77', 19, 'Recife'], ['bia-31', 38, ''], ['mkt-01', 41, 'parceiro'], ['davi-12', 94, 'SP']];
  const bkD = (pct, { show = 5, bad = [], rows } = {}) => { const d = act('buckets frete_v2', '0 A 99', ...(rows || [[`percentual: ${pct}%`, pct ? 'acc' : 'dim']]));
    d.bk = { pct, items: CLI5.map(([id, b, c], i) => [id, i < show ? b : null, c, bad.includes(id) ? 'bad' : '']), foot: '100.000 clientes: <1 → 985 · <10 → 9.878 · <50 → 49.909' }; return d; };
  const LENA6 = ['1042', '1044', '1047', '1048', '1051', '1054'];
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [] };
    const show = (...nm) => nm.forEach(n => o.show[n] = 1);
    const F = fam();
    if (F === 'M') {
      show('mig', 'fila', 'tab', 'fre', 'mpods', 'shd');
      o.rows.mig = act('migration', 'PSQL', ["lock_timeout = '1s'", 'dim'], ['espera a vez', 'dim']);
      o.rows.fila = withTape(act('fila de lock', 'ACCESS EXCLUSIVE', ['ninguém esperando', 'dim']), 'quem espera', []);
      o.rows.tab = tabD([['1.000.000 linhas', 'hi'], ['~2 KB por linha', 'dim']], 1975, COLS('none'));
      o.rows.fre = freD(0, 'NULL');
      o.rows.mpods = withTape(act('pedidos', '3 PODS', ['2.4.0 em todos', 'dim']), 'pods', pods('2.4.0', '2.4.0', '2.4.0'));
      o.rows.shd = act('quem lê o quê', 'VERSÕES', ['2.4.0: grava e lê total', 'dim'], ['2.5.0: ainda não', 'dim']);
      o.beams.push({ pts: CM.mig }, { pts: CM.fila }, { pts: CM.pods }, { pts: CM.rd });
    } else if (F === 'S') {
      show('cli', 'lb', 'est', 'som', 'cmp', 'pag');
      o.rows.cli = act('app da Lena', 'RECIFE', ['pedido 1059', 'hi'], ['camiseta 49 + frete 15', 'dim']);
      o.rows.lb = act('malha', 'ISTIO', ['5 pedidos/s', 'hi'], ['estável: 100%', 'dim'], ['mirror: desligado', 'dim']);
      o.rows.est = act('pedidos 2.4.0', 'ESTÁVEL', ['responde ao cliente', 'dim']);
      o.rows.som = act('pedidos 2.5.0', 'SOMBRA', ['recebe a cópia', 'dim'], ['resposta descartada', 'dim']);
      o.rows.cmp = act('comparador', 'POR x-request-id', ['nada comparado ainda', 'dim']);
      o.rows.pag = act('pagamentos · Kafka', 'EFEITOS', ['nada vindo da sombra', 'dim']);
      o.beams.push({ pts: CS.cli }, { pts: CS.est }, { pts: CS.som }, { pts: CS.ce }, { pts: CS.cs }, { pts: CS.pag });
    } else if (F === 'F') {
      show('flg', 'fmet', 'fpods', 'bkt');
      o.rows.flg = act('serviço de flags', 'OPENFEATURE', ['frete_v2: 0%', 'acc'], ['padrão: false', 'dim']);
      o.rows.fmet = act('frete_zero', 'POR CIDADE', ['SP 0 · Rio 0', 'dim'], ['Recife 0', 'dim']);
      o.rows.fpods = withTape(act('pedidos 2.5.0', '3 PODS', ['código novo em todos', 'hi'], ['cache da flag: 30 s', 'dim']), 'frete_v2 em cada pod',
        [['desl.', 'none'], ['desl.', 'none'], ['desl.', 'none']]);
      o.rows.bkt = bkD(0);
      o.beams.push({ pts: CF.flg }, { pts: CF.met }, { pts: CF.bkt });
    } else {
      show('amet', 'sin', 'pipe', 'r0', 'r1', 'r2');
      o.rows.amet = act('frete_zero', 'POR ANEL', ['anel 0: 0', 'dim'], ['anel 1: 0', 'dim'], ['anel 2: 0', 'dim']);
      o.rows.sin = act('clientes sintéticos', 'ONE-BOX', ['desligados', 'dim']);
      o.rows.pipe = withTape(act('pipeline', 'BAKE TIME', ['pedidos 2.5.0', 'hi'], ['anel a anel', 'dim']), 'anéis', [['anel 0', 'none'], ['anel 1', 'none'], ['anel 2', 'none']]);
      o.rows.pipe.bar = [0, 'acc', 'exposição: 0%'];
      o.rows.r0 = act('anel 0 · shard-0', '20%', ['davi-12 (SP)', 'dim'], ['2.4.0', 'dim']);
      o.rows.r1 = act('anel 1 · shard-1', '20%', ['lena-77 · bia-31', 'dim'], ['2.4.0', 'dim']);
      o.rows.r2 = act('anel 2 · shard-2', '60%', ['caio-58 · mkt-01', 'dim'], ['2.4.0', 'dim']);
      o.beams.push({ pts: CA.r0 }, { pts: CA.r1 }, { pts: CA.r2 }, { pts: CA.met }, { pts: CA.sin });
    }
    return o;
  }
  const SHD25 = () => act('quem lê o quê', 'VERSÕES', ['2.5.0: grava total e frete', 'acc'], ['e lê total', 'dim']);
  const ring = (o, i, v, tn) => { const r = o.rows['r' + i]; r.rows[1] = [v, tn || (v === '2.5.0' ? 'acc' : 'dim')]; };

  // ── o que se vê em cada passo ──
  const STEPS = {
    migracao: [
      { id: 'expandir', dur: 6, title: 'Expandir: a coluna frete nasce vazia', yk: 'EXPANDIR (POSTGRESQL 14, 1M LINHAS)',
        code: ["SET lock_timeout = '1s';", 'ALTER TABLE pedidos', '  ADD COLUMN frete numeric(10,2);', '  → 3,2 ms: só o catálogo', 'com DEFAULT random(): 7,9 s (reescreve tudo)'],
        story: 'A 2.5.0 vai gravar o frete numa coluna própria; hoje ele só existe dentro do <code>total</code> e do JSON <code>detalhes</code>. O primeiro passo vem <b>antes</b> do deploy: <code>ADD COLUMN frete</code>, nula. Numa tabela <code>pedidos</code> de 1.000.000 de linhas (1.975 MB), no PostgreSQL 14, levou <b>3,2 ms</b>: só o catálogo muda. Um padrão constante também é barato (<code>moeda text NOT NULL DEFAULT \'BRL\'</code>: 1,9 ms); um padrão volátil como <code>random()</code> reescreve a tabela inteira (<b>7,9 s</b>). A 2.4.0 não sabe que a coluna existe, e não precisa saber.',
        look: 'A migration manda o ALTER à tabela e, ao lado dela, sobe uma gaveta nova: a coluna frete, vazia. Os 3 pods continuam na 2.4.0.',
        key: 'Expandir é acrescentar sem quebrar quem já está lá.',
        f(o, t) { const a = go_(t, 0.4, 1.3), born = a >= 1; if (!born) delete o.show.fre; lit(o, 'mig'); if (a > 0) lit(o, 'tab'); if (born) lit(o, 'fre');
          o.rows.mig = act('migration', 'PSQL', ['ADD COLUMN frete', 'acc'], ["lock_timeout = '1s'", 'dim']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], [born ? 'coluna nova: frete' : '~2 KB por linha', born ? 'acc' : 'dim']], 1975, COLS(born ? 'none' : null));
          beam(o, CM.mig, a > 0 && a < 1); pk(o, CM.mig, a, 'ADD COLUMN frete');
          if (born) T(o, [520, 150, 70], 'frete: NULL', 'acc');
          o.cnt = [['ALTER', born ? '3,2 ms' : '…'], ['LINHAS', '1.000.000', 'dim'], ['TAMANHO', '1.975 MB', 'dim']];
          o.res = born ? [['só o catálogo: 3,2 ms', 'acc'], ['a 2.4.0 nem percebe', 'acc']] : []; } },
      { id: 'fila', dur: 8, title: 'A fila de lock: o ALTER de 3 ms que trava todo mundo', yk: 'A FILA (MEDIDA)',
        code: ['transação longa: SELECT aberto, 6 s', 'ALTER pede ACCESS EXCLUSIVE → espera', 'SELECT novo chega → espera atrás do ALTER', '  esperou 4,0 s', "com lock_timeout = '1s': o ALTER desiste em 1,0 s", 'ERROR: canceling statement due to lock timeout'],
        story: 'O <code>ALTER</code> é rápido, mas precisa de um lock <code>ACCESS EXCLUSIVE</code>, e o lock entra numa <b>fila</b>. Uma transação longa (6 s) segura um <code>SELECT</code> aberto; o <code>ALTER</code> espera por ela; um <code>SELECT</code> simples que chegou depois esperou <b>4,0 s</b> atrás do <code>ALTER</code>. A fila trava todo mundo, até as leituras. Com <code>SET lock_timeout = \'1s\'</code>, o <code>ALTER</code> desiste em <b>1,0 s</b> (<code>ERROR: canceling statement due to lock timeout</code>) e o <code>SELECT</code> passa. Toda migration em produção leva <code>lock_timeout</code> e tenta de novo.',
        look: 'A fila, à esquerda, se enche: a transação de 6 s, o ALTER e o SELECT, que fica vermelho enquanto espera. Na segunda volta, com lock_timeout, o ALTER sai riscado da fila e o SELECT passa.',
        key: 'Migration em produção leva lock_timeout e tenta de novo.',
        f(o, t) { const w = lin(t, 0.8, 4.0, 0, 4.0), lt_ = t > 4.6, w2 = lin(t, 4.6, 5.6, 0, 1.0), pass = t > 5.7; lit(o, 'mig');
          o.on.fila = lt_ && pass ? 1 : 'bad'; o.on.tab = lt_ && pass ? 1 : 'bad';
          o.rows.mig = act('migration', 'PSQL', [lt_ ? (pass ? 'desistiu: lock timeout' : 'espera, até 1 s') : 'ALTER esperando', lt_ ? 'acc' : 'bad'], [lt_ ? "lock_timeout = '1s'" : 'sem lock_timeout', 'dim']);
          o.rows.fila.rows = [[lt_ ? (pass ? 'SELECT passou' : `SELECT espera ${dec(w2)} s`) : `SELECT espera ${dec(w)} s`, pass ? 'acc' : 'bad']];
          o.rows.fila.tape = [['tx 6 s', 'ok'], ['ALTER', pass ? 'off' : 'bad'], ['SELECT', pass ? 'ok' : 'bad']];
          beam(o, CM.fila, true, pass ? '' : 'bad'); beam(o, CM.mig, true, pass ? '' : 'bad');
          if (pass) T(o, TF(), 'ALTER desistiu em 1,0 s; tenta de novo', 'acc'); else if (t > 2) T(o, TF(), 'a fila trava até a leitura', 'bad');
          o.cnt = [['SELECT ESPEROU', lt_ ? `${dec(Math.min(w2, 1))} s` : `${dec(w)} s`, pass ? '' : 'bad'], ['SEM lock_timeout', '4,0 s', 'dim'], ['COM lock_timeout', '1,0 s', 'dim']];
          o.res = pass ? [['4,0 s × 1,0 s', 'acc'], ['o ALTER volta depois', 'acc']] : t > 4 ? [['SELECT preso 4,0 s', 'bad']] : []; } },
      { id: 'publicar', dur: 8, title: 'Publicar a 2.5.0: grava total e frete, lê total', yk: 'O ROLLING DE 90 S',
        code: ['2.5.0: INSERT … (total, frete)', '2.4.0: INSERT … (total)  → frete NULL', 'as duas leem total', '3 pods: 0 → 33 → 67 → 100% em 90 s', 'cada passo serve à N e à N−1'],
        story: 'Com a coluna no lugar, publica-se a 2.5.0. Ela grava <code>total</code> <b>e</b> <code>frete</code>, e continua lendo <code>total</code>. Durante o rolling de <b>90 s</b> (3 ondas de 30 s), as duas versões convivem: a 2.4.0 grava sem frete (fica <code>NULL</code>) e ignora a coluna que não conhece. Como cada versão funciona com o esquema que existe, o rolling, o canary e o blue/green são seguros, e voltar para a 2.4.0 também.',
        look: 'Os pods trocam um por um de 2.4.0 para 2.5.0, e as escritas chegam à tabela; a gaveta frete começa a receber valor nas linhas novas.',
        key: 'O esquema serve à versão N e à N−1 ao mesmo tempo.',
        f(o, t) { const s = lin(t, 0.4, 5.8, 0, 90), k = Math.min(3, Math.floor(s / 30 + 1e-6)), pct = [0, 33, 67, 100][k]; lit(o, 'mpods', 'tab', 'fre');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [`${pct}% na 2.5.0`, 'acc'], ['ondas de 30 s', 'dim']), 'pods', pods(...[0, 1, 2].map(i => i < k ? '2.5.0' : '2.4.0')));
          o.rows.shd = act('quem lê o quê', 'VERSÕES', ['2.4.0: grava total', 'dim'], ['2.5.0: grava total e frete', k ? 'acc' : 'dim'], ['as duas leem total', 'hi']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], ['linhas novas com frete', k ? 'acc' : 'dim']], 1975, COLS(k ? 'ok' : 'none'));
          o.rows.fre = freD(k ? 0.04 * k : 0, k ? 'só linhas novas' : 'NULL');
          beam(o, CM.pods, true, '', true); beam(o, CM.rd, k > 0);
          o.cnt = [['% NA 2.5.0', `${pct}%`], ['RELÓGIO', `${Math.round(s)} s de 90`, 'dim'], ['ERROS DE ESQUEMA', '0', 'dim']];
          o.res = k === 3 ? [['2.4.0 e 2.5.0 conviveram 90 s', 'acc'], ['nenhum erro de esquema', 'acc']] : []; } },
      { id: 'backfill', dur: 9, title: 'Backfill em lotes: 100 lotes de 10.000 linhas', yk: 'BACKFILL (MEDIDO)',
        code: ['UPDATE pedidos', "  SET frete = (detalhes->>'frete')::numeric", '  WHERE id BETWEEN … (10.000 linhas)', '~66 ms por lote; VACUUM a cada 10', '1.975 → 2.407 MB (+22%)'],
        story: 'As linhas antigas ainda têm <code>frete</code> nulo. O <b>backfill</b> copia o valor que está no JSON <code>detalhes</code> (o 1054 guarda <code>"frete": 15.00</code>) para a coluna, em <b>lotes de 10.000 linhas</b>, com <code>VACUUM</code> a cada 10 lotes: ~66 ms por lote, 14,3 s no total, e a tabela cresce de 1.975 para <b>2.407 MB (+22%)</b>. Na loja, com 16,67 milhões de linhas por shard e 1 s de pausa entre lotes, são 1.667 lotes e uns <b>30 min por shard</b>, nos 3 em paralelo. Cada lote segura poucas linhas por pouco tempo.',
        look: 'A gaveta frete se enche lote a lote e a barra de tamanho da tabela anda pouco: para em 2.407 MB.',
        key: 'Lotes pequenos, pausa entre eles, e o espaço cresce pouco.',
        f(o, t) { const n = Math.round(lin(t, 0.3, 6.3, 0, 100)), mb = 1975 + (2407 - 1975) * n / 100; lit(o, 'mig', 'tab', 'fre'); o.rows.shd = SHD25();
          o.rows.mpods.rows = [['2.5.0 em todos', 'acc']]; o.rows.mpods.tape = pods('2.5.0', '2.5.0', '2.5.0');
          o.rows.mig = act('migration', 'PSQL', [n >= 100 ? 'backfill pronto' : `lote ${n} de 100`, 'acc'], ['~66 ms por lote', 'dim']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], [`${thou(n * 10000)} preenchidas`, 'acc']], mb, COLS('ok'));
          o.rows.fre = freD(n / 100, n >= 100 ? 'cheia' : `${n}%`);
          beam(o, CM.mig, n < 100, '', n < 100);
          o.cnt = [['LOTES', `${n} de 100`], ['TAMANHO', `${thou(mb)} MB`, 'dim'], ['NA LOJA', '~30 min/shard', 'dim']];
          o.res = n >= 100 ? [['+22% de espaço', 'acc'], ['frete preenchido', 'acc']] : []; } },
      { id: 'unico', dur: 7, title: 'O mesmo UPDATE de uma vez: 8,0 s e o dobro do espaço', yk: 'UPDATE ÚNICO (MEDIDO)',
        code: ['UPDATE pedidos SET frete = 15.00;', '  1 comando, 1.000.000 linhas: 8,0 s', '  1.975 → 3.950 MB (+100%)', 'VACUUM comum: continua 3.950 MB', 'na loja: +33 GB e ~2 min por shard'],
        story: 'Para comparar, o mesmo <code>UPDATE</code> num comando só: <b>8,0 s</b>, e a tabela vai de 1.975 para <b>3.950 MB (+100%)</b>. No PostgreSQL, o <code>UPDATE</code> escreve uma versão nova de cada linha; a antiga só vira espaço livre depois, e o <code>VACUUM</code> comum não devolve esse espaço ao disco (continuou em 3.950 MB). Na loja seriam <b>+33 GB por shard</b> e as linhas presas por uns 2 min (8 s × 16,67 ≈ 133 s).',
        look: 'A barra de tamanho dispara até o fim da escala e fica vermelha; a gaveta frete se enche de uma vez.',
        key: 'O UPDATE único dobra a tabela; em lotes, +22%.',
        f(o, t) { const p = go_(t, 0.4, 3.2), mb = 1975 + 1975 * p, done = p >= 1; lit(o, 'mig', 'fre'); o.on.tab = done ? 'bad' : 1; o.rows.shd = SHD25();
          o.rows.mpods.rows = [['2.5.0 em todos', 'acc']]; o.rows.mpods.tape = pods('2.5.0', '2.5.0', '2.5.0');
          o.rows.mig = act('migration', 'PSQL', [done ? 'UPDATE: 8,0 s' : 'UPDATE de uma vez', 'acc'], ['1 comando', 'dim']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], [done ? 'tamanho dobrou' : 'reescrevendo tudo', done ? 'bad' : 'acc']], mb, COLS('ok'), done ? 'bad' : 'acc');
          o.rows.fre = freD(p, done ? 'cheia' : '…');
          beam(o, CM.mig, !done, '', !done);
          o.cnt = [['TAMANHO', `${thou(mb)} MB`, done ? 'bad' : ''], ['TEMPO', done ? '8,0 s' : `${dec(p * 8)} s`, 'dim'], ['EM LOTES', '2.407 MB (+22%)', 'dim']];
          o.res = done ? [['+100% de espaço', 'bad'], ['em lotes: +22%', 'acc']] : []; } },
      { id: 'contrair', dur: 8, title: 'Ler da coluna nova e, depois, contrair', yk: 'O PLANO, NA ORDEM',
        code: ['1. expandir: ADD COLUMN frete (antes)', '2. publicar a 2.5.0: grava os dois', '3. backfill em lotes', '4. a 2.6.0 lê frete (atrás de uma flag)', '5. contrair: SET NOT NULL, depois de 7 dias'],
        story: 'Com a coluna cheia, a <b>2.6.0</b> passa a <b>ler</b> <code>frete</code>, atrás de uma flag. O <code>total</code> e o <code>detalhes</code> continuam sendo gravados enquanto ainda for possível voltar. Só depois da janela de rollback (7 dias, no exemplo) vem o <b>contrair</b>: <code>SET NOT NULL</code> e remover o código velho. A migration roda <b>antes</b> do deploy (expandir) e <b>depois</b> dele (contrair), nunca <b>dentro</b>.',
        look: 'Os pods viram 2.6.0 e o cabo de leitura passa a sair da gaveta frete; no fim, a gaveta ganha o rótulo NOT NULL.',
        key: 'A migration roda antes e depois do deploy, nunca dentro.',
        f(o, t) { const v6 = t > 1.6, nn = t > 4.4; lit(o, 'mpods', 'fre'); if (nn) lit(o, 'mig');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [v6 ? '2.6.0 em todos' : '2.5.0 em todos', 'acc'], [v6 ? 'lê frete' : 'lê total', 'dim']), 'pods', pods(...Array(3).fill(v6 ? '2.6.0' : '2.5.0')));
          o.rows.shd = act('quem lê o quê', 'VERSÕES', ['2.5.0: lê total', v6 ? 'dim' : 'acc'], ['2.6.0: lê frete', v6 ? 'acc' : 'dim'], [nn ? '7 dias depois: contrair' : 'janela de 7 dias', nn ? 'acc' : 'dim']);
          o.rows.mig = act('migration', 'PSQL', [nn ? 'SET NOT NULL' : 'espera a janela', nn ? 'acc' : 'dim'], [nn ? 'remove o código velho' : '', 'dim']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], ['frete preenchido', 'acc']], 2407, COLS('ok'));
          o.rows.fre = freD(1, nn ? 'NOT NULL' : 'cheia');
          beam(o, CM.pods, true, '', true); beam(o, CM.rd, v6, '', v6); beam(o, CM.mig, nn && t < 5.4);
          if (nn) T(o, [520, 150, 70], 'frete NOT NULL', 'acc');
          const ph = nn ? '5 contrair' : v6 ? '4 ler a nova' : '3 backfill feito';
          o.cnt = [['PASSO', ph], ['JANELA DE ROLLBACK', '7 dias', 'dim'], ['QUEBRAS', '0', 'dim']];
          o.res = nn ? [['antes e depois, nunca dentro', 'acc']] : []; } },
      { id: 'rename', dur: 7, title: 'E se der errado (1): um RENAME junto com o deploy', yk: 'SAÍDA REAL',
        code: ['ALTER TABLE pedidos', '  RENAME COLUMN total TO valor_total;', '  → milissegundos', 'a 2.4.0, ainda no ar durante o rolling:', 'ERROR: column "total" does not exist'],
        story: 'O atalho tentador: renomear <code>total</code> para <code>valor_total</code> junto com o deploy. O <code>RENAME</code> leva milissegundos, mas o rolling dura 90 s, e nesse tempo ainda há pods na 2.4.0 fazendo <code>SELECT total</code>. A saída real: <code>ERROR: column "total" does not exist</code>. Com <code>DROP</code> é igual, e pior: o dado vai junto. Renomear também se faz em expandir e contrair: coluna nova, gravar nas duas, copiar, ler da nova, apagar a velha.',
        look: 'A coluna total da tabela fica vermelha com o nome novo; os dois pods que ainda são 2.4.0 recebem o erro de volta.',
        key: 'RENAME e DROP no deploy quebram a versão que ainda está no ar.',
        f(o, t) { const r = t > 0.9, a = go_(t, 1.4, 2.6), err = a >= 1; lit(o, 'mig'); if (r) o.on.tab = 'bad'; if (err) o.on.mpods = 'bad'; o.rows.shd = act('quem lê o quê', 'VERSÕES', ['2.4.0: SELECT total', 'bad'], ['2.5.0: grava total e frete', 'acc']);
          o.rows.mig = act('migration', 'PSQL', [r ? 'RENAME feito: ms' : 'RENAME total', 'acc'], ['no meio do rolling', 'bad']);
          o.rows.tab = tabD([['1.000.000 linhas', 'hi'], [r ? 'total → valor_total' : 'coluna total', r ? 'bad' : 'dim']], 1975, COLS('ok', r ? ['valor_total', 'bad'] : ['total', 'ok']));
          o.rows.fre = freD(0.08, 'só linhas novas');
          o.rows.mpods = withTape(act('pedidos', '3 PODS', [err ? '2 pods com erro' : '33% na 2.5.0', err ? 'bad' : 'acc'], ['2.4.0 faz SELECT total', 'dim']), 'pods', pods('2.5.0', err ? 'erro' : '2.4.0', err ? 'erro' : '2.4.0'));
          o.rows.mpods.tape = [['2.5.0', 'ok'], ['2.4.0', err ? 'bad' : 'none'], ['2.4.0', err ? 'bad' : 'none']];
          beam(o, CM.mig, t > 0.2 && !r); pk(o, CM.mig, go_(t, 0.2, 0.9), 'RENAME COLUMN');
          beam(o, CM.pods, a > 0, a > 0 ? 'bad' : ''); pk(o, rev(CM.pods), a, 'column "total" does not exist', 'bad');
          o.cnt = [['PODS COM ERRO', err ? '2 de 3' : '0', 'bad'], ['RENAME', 'milissegundos', 'dim'], ['ROLLING', '90 s', 'dim']];
          o.res = err ? [['a 2.4.0 quebra', 'bad'], ['renomear = expandir e contrair', 'acc']] : []; } },
      { id: 'mod4', dur: 9, title: 'E se der errado (2): a 2.6.0 troca mod 3 por mod 4', yk: 'A FUNÇÃO DE ROTEAMENTO',
        code: ['2.4.0: shard = hash(cliente_id) mod 3', '2.6.0: shard = hash(cliente_id) mod 4', '75,2% das chaves mudam de shard', 'lena-77 1 → 0 · bia-31 1 → 3 · caio-58 2 → 1', '~113 de 150 pedidos num shard errado'],
        story: 'A segunda bomba vem do módulo 16: a 2.6.0 troca <code>mod 3</code> por <code>mod 4</code>. Durante os 90 s do rolling ela recebe 0 → 33 → 67 → 100% dos pedidos (150 no total), e <b>75,2%</b> das chaves mudam de shard: <b>~113</b> pedidos vão para onde a 2.4.0 não procura. Depois do rolling, a 2.6.0 consulta o status dos pedidos da Lena e <b>não acha</b> 1042, 1044, 1047, 1048, 1051 e 1054: estão no <code>shard-1</code>, e ela procura no <code>shard-0</code>. A tela "meus pedidos" lê a projeção e continua certa; quem erra é o que lê o <code>pedidos</code>. A função de roteamento é dado versionado: mudar também é expandir e contrair (copiar com CDC, ler dos dois, trocar o mapa, só então apagar a origem).',
        look: 'À direita, os seis pedidos da Lena estão no shard-1; a 2.6.0 vai procurá-los no shard-0, volta vazia, e eles ficam vermelhos.',
        key: 'A função de roteamento também é dado, e muda em expandir e contrair.',
        f(o, t) { const a = go_(t, 0.6, 1.8), b = go_(t, 2.0, 3.0), lost = b >= 1; lit(o, 'mpods'); o.on.shd = lost ? 'bad' : 1;
          o.rows.mpods = withTape(act('pedidos', '3 PODS', ['2.6.0: mod 4', 'acc'], ['a 2.4.0 usava mod 3', 'dim']), 'pods', pods('2.6.0', '2.6.0', '2.6.0'));
          o.rows.shd = withTape(act('shards', 'mod 3 → mod 4', ['pedidos da Lena: shard-1', 'hi'], ['a 2.6.0 procura no shard-0', a > 0 ? 'bad' : 'dim'], [lost ? '6 pedidos "sumidos"' : 'status de 1042 … 1054', lost ? 'bad' : 'dim']),
            'pedidos da Lena', LENA6.map(n => [n, lost ? 'bad' : 'ok']));
          beam(o, CM.shd, (a > 0 && a < 1) || (b > 0 && b < 1), b > 0 ? 'bad' : '');
          pk(o, CM.shd, a, 'status: shard-0?'); pk(o, rev(CM.shd), b, 'não achado', 'bad');
          if (lost) T(o, TF(), 'status do 1054: não achado', 'bad');
          o.cnt = [['PEDIDOS NO SHARD ERRADO', '~113', 'bad'], ['CHAVES QUE MUDAM', '75,2%', 'dim'], ['DA LENA "SUMIDOS"', lost ? '6' : '…', 'bad']];
          o.res = lost ? [['6 pedidos da Lena "sumiram"', 'bad'], ['roteamento é dado versionado', 'acc']] : []; } },
    ],
    shadow: [
      { id: 'espelho', dur: 7, title: 'Espelho a 10%: o estável continua com 100%', yk: 'VirtualService (ISTIO)',
        code: ['route: pedidos 2.4.0  weight: 100', 'mirror: pedidos 2.5.0', 'mirrorPercentage: { value: 10.0 }', 'a cópia vai com o Host …-shadow', 'fire and forget: a resposta é descartada'],
        story: 'Terça, 14:00, 5 pedidos/s. A malha manda <b>100%</b> para a 2.4.0, como sempre, e uma <b>cópia</b> de 10% (0,5 pedido/s) para a 2.5.0. O espelho duplica, não divide: o estável não perde nada. A cópia vai com o <code>Host</code> terminado em <code>-shadow</code> e é "fire and forget": a malha descarta a resposta. A Lena faz o pedido <b>1059</b> (camiseta preta 49,00 + frete Recife 15,00) e paga <b>64,00</b>, calculado pela 2.4.0. Nenhum cliente vê a 2.5.0: <b>0%</b> exposto.',
        look: 'O 1059 vai do app à malha e segue para a 2.4.0, que responde 64,00. Uma cópia desce para a sombra; a resposta dela (49,00) volta e morre na malha.',
        key: 'O shadow copia o tráfego real e não expõe ninguém.',
        f(o, t) { const a = go_(t, 0.3, 1.0), b = go_(t, 1.1, 2.1), c = go_(t, 2.3, 3.2), d = go_(t, 3.3, 3.9), e = go_(t, 2.3, 3.2);
          lit(o, 'lb'); if (a > 0) lit(o, 'cli'); if (b > 0) lit(o, 'est', 'som');
          o.rows.lb = act('malha', 'ISTIO', ['5 pedidos/s', 'hi'], ['estável: 100%', 'acc'], ['cópia: 10% → sombra', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SOMBRA', ['0,5 cópia/s', 'acc'], [e >= 1 ? 'respondeu 49,00' : 'calcula o 1059', e >= 1 ? 'bad' : 'dim'], ['resposta descartada', 'dim']);
          o.rows.est = act('pedidos 2.4.0', 'ESTÁVEL', ['100% do tráfego', 'acc'], [c > 0 ? '201 · total 64,00' : 'calcula o 1059', c > 0 ? 'acc' : 'dim']);
          o.rows.cli.rows[0] = [d >= 1 ? 'pagou 64,00' : 'pedido 1059', d >= 1 ? 'acc' : 'hi'];
          beam(o, CS.cli, (a > 0 && a < 1) || (d > 0 && d < 1)); beam(o, CS.est, (b > 0 && b < 1) || (c > 0 && c < 1)); beam(o, CS.som, (b > 0 && b < 1) || (e > 0 && e < 1));
          pk(o, CS.cli, a, '1059'); pk(o, CS.est, b, '1059'); pk(o, CS.som, b, 'cópia do 1059');
          pk(o, rev(CS.est), c, '64,00', 'acc'); pk(o, rev(CS.som), e, '49,00 (descartada)', 'bad'); pk(o, rev(CS.cli), d, '64,00');
          if (e >= 1) T(o, [150, 300, 60], 'resposta da sombra: descartada', 'dim');
          o.cnt = [['CLIENTES NA 2.5.0', '0%'], ['CÓPIA', '0,5 pedido/s', 'dim'], ['A LENA PAGOU', d >= 1 ? '64,00' : '…', 'dim']];
          o.res = d >= 1 ? [['estável 100% + cópia 10%', 'acc'], ['ninguém exposto', 'acc']] : []; } },
      { id: 'compara', dur: 9, title: 'O comparador: 64,00 × 49,00', yk: 'O DIFF, CAMPO A CAMPO',
        code: ['x-request-id do 1059', 'total   2.4.0: 64,00 · 2.5.0: 49,00', 'frete   2.4.0: 15,00 · 2.5.0: 0,00', 'status  201 · 201 (igual)', '5 min: 150 cópias, 30 de Recife, 30 diferentes'],
        story: 'A malha joga fora a resposta da sombra; para aprender algo, alguém precisa guardá-la. A 2.5.0-sombra registra a sua com o <code>x-request-id</code>, e um <b>comparador</b> junta com a da 2.4.0, campo a campo. Status: 201 nas duas. Latência: igual. <code>total</code>: <b>64,00 × 49,00</b>. Em 5 min, a 10%, são <b>150 cópias</b>; 30 são de Recife, e <b>as 30 divergem</b>. O defeito aparece sem nenhum cliente pagar por ele: <b>R$ 0</b> de perda. Sem comparador, o shadow só custa dinheiro.',
        look: 'As duas respostas andam até o comparador; a grade das cópias de Recife se enche de células vermelhas, uma por divergência.',
        key: 'Sem comparador, o shadow só custa dinheiro.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 6.5, 0, 150)), rec = Math.floor(n / 5); lit(o, 'lb', 'est', 'som', 'cmp');
          o.rows.lb = act('malha', 'ISTIO', ['5 pedidos/s', 'hi'], ['cópia: 10% → sombra', 'acc']);
          o.rows.est = act('pedidos 2.4.0', 'ESTÁVEL', ['grava a resposta', 'acc'], ['com x-request-id', 'dim']);
          o.rows.som = act('pedidos 2.5.0', 'SOMBRA', ['grava a resposta', 'acc'], ['com x-request-id', 'dim']);
          o.rows.cmp = act('comparador', 'POR x-request-id', ['total 64,00 × 49,00', rec ? 'bad' : 'dim'], ['frete 15,00 × 0,00', rec ? 'bad' : 'dim'], ['status 201 = 201', 'dim']);
          o.rows.cmp.grid = Array.from({ length: 30 }, (_, i) => i < rec ? ['≠', 'bad'] : ['', 'none']); o.rows.cmp.cols = 10;
          beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', true); beam(o, CS.ce, true, '', true); beam(o, CS.cs, true, 'bad', true);
          o.cnt = [['CÓPIAS', `${n} de 150`], ['DE RECIFE, DIFERENTES', `${rec} de 30`, 'bad'], ['PERDA', 'R$ 0', 'dim']];
          o.res = n >= 150 ? [['30 de 30 divergem', 'bad'], ['R$ 0 perdidos', 'acc']] : []; } },
      { id: 'dryrun', dur: 7, title: 'Dry-run: a sombra grava e desfaz', yk: 'O CÓDIGO DO ARTIGO (GO)',
        code: ['tx := db.Begin()', '… INSERT do pedido, cálculo do frete …', 'if ENVIRONMENT == "shadow" {', '    tx.Rollback()', '} else {', '    tx.Commit() }'],
        story: 'O <code>pedidos</code> escreve, e uma sombra que gravasse no mesmo banco duplicaria o 1059. O artigo resolve com <b>dry-run</b>: a sombra abre a transação, faz o <code>INSERT</code>, calcula tudo e, no fim, chama <code>tx.Rollback()</code> em vez de <code>tx.Commit()</code>. A tabela só guarda o 1059 gravado pela 2.4.0.',
        look: 'A sombra acende com o INSERT dentro da transação e depois mostra o Rollback; o contador de linhas gravadas por ela volta a 0.',
        key: 'Dry-run: tudo acontece, e no fim nada é gravado.',
        f(o, t) { const ins = t > 0.6, rb = t > 2.6; lit(o, 'lb', 'est'); if (ins) lit(o, 'som');
          o.rows.lb = act('malha', 'ISTIO', ['cópia: 10% → sombra', 'acc']);
          o.rows.est = act('pedidos 2.4.0', 'ESTÁVEL', ['tx.Commit()', 'acc'], ['1059 gravado', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SOMBRA', [rb ? 'tx.Rollback()' : ins ? 'BEGIN · INSERT 1059' : 'recebe a cópia', 'acc'], [rb ? 'linhas gravadas: 0' : ins ? 'dentro da transação' : '', 'dim'], ['ENVIRONMENT = shadow', 'dim']);
          beam(o, CS.som, t < 0.6, '', t < 0.6); beam(o, CS.est, true);
          if (rb) T(o, [420, 300, 60], 'Rollback: nada gravado', 'acc');
          o.cnt = [['LINHAS DA SOMBRA', rb ? '0' : ins ? '1 (na tx)' : '0'], ['1059 NO BANCO', '1 (da 2.4.0)', 'dim'], ['DUPLICATAS', '0', 'dim']];
          o.res = rb ? [['dry-run: desfeito no fim', 'acc']] : []; } },
      { id: 'catalogo', dur: 7, title: 'O caso ideal: espelhar leitura no catalogo', yk: 'A CONTA (MÓDULO 14)',
        code: ['catalogo: 640 req/s no estável', 'espelho de 10% → 64 req/s', '1 réplica nova aguenta 100 req/s', 'ρ = 64 / 100 = 64% · R = 37,8 ms', 'mede a busca nova com tráfego real'],
        story: 'Leitura é o caso ideal do artigo: não há nada a desfazer. Espelhar 10% das <b>640 req/s</b> do <code>catalogo</code> dá <b>64 req/s</b> para <b>1</b> réplica da versão nova, que aguenta 100: ρ = <b>64%</b> e R = <b>37,8 ms</b> (a tabela do módulo 14). Dá para medir o p95 da busca nova (a de 900 ms) com tráfego real, sem nenhum cliente exposto.',
        look: 'O mesmo arranjo, agora com o catalogo: a cópia desce para a réplica nova, e a barra de CPU dela para em 64%.',
        key: 'Espelhar leitura é seguro; a sombra precisa de capacidade para a cópia.',
        f(o, t) { const r = lin(t, 0.4, 3.0, 0, 64); lit(o, 'lb', 'est', 'som', 'cmp');
          o.rows.cli = act('clientes', 'BUSCAS', ['640 req/s', 'hi'], ['no catálogo', 'dim']);
          o.rows.lb = act('malha', 'ISTIO', ['640 req/s', 'hi'], ['estável: 100%', 'acc'], ['cópia: 10% → sombra', 'acc']);
          o.rows.est = act('catalogo atual', 'ESTÁVEL', ['640 req/s', 'acc'], ['responde ao cliente', 'dim']);
          o.rows.som = act('catalogo novo', 'SOMBRA · 1 RÉPLICA', [`${Math.round(r)} req/s`, 'acc'], ['R = 37,8 ms', 'dim']); o.rows.som.bar = [r / 100, 'acc', `CPU ${Math.round(r)}%`];
          o.rows.cmp = act('comparador', 'p95 DA BUSCA', ['tráfego real, 0 exposto', 'acc']);
          o.rows.pag = act('nada a desfazer', 'LEITURA', ['sem cobrança, sem evento', 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', true); beam(o, CS.cs, true);
          o.cnt = [['NA SOMBRA', `${Math.round(r)} req/s`], ['ρ DA SOMBRA', `${Math.round(r)}%`, 'dim'], ['R', '37,8 ms', 'dim']];
          o.res = r >= 64 ? [['64 req/s em 1 réplica: 64%', 'acc']] : []; } },
      { id: 'cobranca', dur: 9, title: 'E se der errado: o Rollback não desfaz a cobrança', yk: 'O QUE SAIU DA TRANSAÇÃO',
        code: ['tx.Rollback() desfaz o INSERT', 'mas a sombra já chamou o pagamentos', 'e publicou o evento no Kafka', '0,5/s × 5 min = 150 cobranças duplicadas', '× R$ 64,00 médios = R$ 9.600'],
        story: 'O <code>Rollback</code> só desfaz o que está dentro da transação. A 2.5.0-sombra também <b>chamou o <code>pagamentos</code> de verdade</b> e <b>publicou o evento</b> no Kafka. A 0,5 cópia por segundo, em 5 min são <b>150 cobranças duplicadas</b>, × R$ 64,00 médios = <b>R$ 9.600</b>. O conserto: a sombra chama um <b>stub</b> do <code>pagamentos</code> (ou manda <code>Idempotency-Key</code> e <code>x-shadow: 1</code>, que o <code>pagamentos</code> se recusa a efetivar) e publica num tópico <code>pedidos.shadow</code>, nunca no <code>pedidos</code>.',
        look: 'Da sombra sai um cabo vermelho até o pagamentos e o Kafka; o contador de cobranças duplicadas sobe até 150.',
        key: 'O Rollback não desfaz o que saiu da transação.',
        f(o, t) { const n = Math.round(lin(t, 0.8, 6.0, 0, 150)); lit(o, 'lb', 'est'); o.on.som = 'bad'; o.on.pag = n ? 'bad' : 0;
          o.rows.lb = act('malha', 'ISTIO', ['cópia: 10% → sombra', 'acc']);
          o.rows.som = act('pedidos 2.5.0', 'SOMBRA', ['tx.Rollback()', 'acc'], ['mas chamou o pagamentos', 'bad'], ['e publicou o evento', 'bad']);
          o.rows.pag = act('pagamentos · Kafka', 'EFEITOS', [`cobranças duplicadas: ${n}`, 'bad'], ['evento da sombra publicado', 'bad']);
          beam(o, CS.som, true, '', true); beam(o, CS.pag, true, 'bad', true);
          if (n >= 150) T(o, TE([735, 300, 60]), 'conserto: stub + pedidos.shadow', 'acc');
          o.cnt = [['COBRANÇAS DUPLICADAS', String(n), 'bad'], ['VALOR', `R$ ${thou(n * 64)}`, 'bad'], ['CONSERTO', 'stub + x-shadow', 'dim']];
          o.res = n >= 150 ? [['R$ 9.600 cobrados a mais', 'bad'], ['conserto: stub e pedidos.shadow', 'acc']] : []; } },
      { id: 'lab', dur: 8, title: 'O lab do autor: mirror de 1% para o chip-shadow', yk: 'shadow/chip.yml (LIDO, NÃO EXECUTADO)',
        code: ['istio.virtualService.mirror:', '  enabled: true', '  host: chip.shadow.svc.cluster.local', '  port: "8080"', '  percent: 1', 'chip-shadow (shadow.yml): v9, min 1, max 1'],
        story: 'No repositório público do autor, o app <code>chip</code> (10 réplicas) tem <code>mirror</code> com <code>percent: 1</code> para <code>chip.shadow.svc.cluster.local</code>. O <code>chip-shadow</code> (namespace <code>shadow</code>, versão <code>v9</code>) roda <b>1</b> réplica, sem autoscaling. São dois apps: a sombra mora fora do namespace do estável. O que falta para a loja: <b>comparador</b> (o lab só olha o <code>/metrics</code> do Prometheus); <b>amostra</b> (1% de 5 pedidos/s = 0,05/s, 3 pedidos por minuto, pouco para o <code>pedidos</code>); e <b>capacidade</b> (1 réplica de sombra para 10 do estável). O lab só roda no cluster do autor; aqui ele foi lido, não executado.',
        look: 'A cópia fina, de 1%, desce para o chip-shadow; o lugar do comparador fica vermelho: ele não existe no lab.',
        key: 'O lab mostra o espelho; falta o comparador.',
        f(o, t) { lit(o, 'lb', 'est', 'som'); o.on.cmp = 'bad';
          o.rows.cli = act('clientes', 'TRÁFEGO', ['5 pedidos/s', 'hi']);
          o.rows.lb = act('malha', 'ISTIO', ['mirror: percent 1', 'acc'], ['0,05/s = 3 por min', 'dim']);
          o.rows.est = act('chip', 'ESTÁVEL · 10 RÉPLICAS', ['responde normal', 'acc']);
          o.rows.som = act('chip-shadow', 'NAMESPACE shadow', ['v9 · 1 réplica', 'acc'], ['sem autoscaling', 'dim']);
          o.rows.cmp = act('comparador', 'NÃO EXISTE', ['só o /metrics', 'bad'], ['nenhum diff', 'dim']);
          o.rows.pag = act('o que falta', 'PARA A LOJA', ['comparador · amostra', 'dim'], ['capacidade da sombra', 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, '', (clk % 4) < 1.3); beam(o, CS.cs, false, 'bad');
          o.cnt = [['ESPELHO', '1%'], ['NO pedidos', '3 pedidos/min', 'dim'], ['COMPARADOR', 'nenhum', 'bad']];
          o.res = [['lido, não executado', 'dim'], ['falta o comparador', 'bad']]; } },
      { id: 'cem', dur: 8, title: 'E se der errado: espelho de 100% em 1 réplica', yk: 'A CONTA',
        code: ['catalogo: 640 req/s, espelho de 100%', '1 réplica de sombra: 100 req/s', 'ρ = 640 / 100 = 640%', 'a fila cresce sem parar', 'a resposta é descartada: ninguém vê'],
        story: 'Suba o espelho do <code>catalogo</code> para <b>100%</b>: 640 req/s para <b>1</b> réplica que aguenta 100. A conta dá <b>640%</b> de CPU, e a fila cresce sem parar. Como a malha descarta a resposta, nenhum cliente nota: só a métrica da própria sombra mostra o estrago. E, se a sombra divide banco ou cache com o estável, o estável sente. A sombra precisa de capacidade para o que copia: 10% × 640 = 64 req/s cabe em 100.',
        look: 'A cópia engrossa até 100%; a barra de CPU da sombra passa do fim e fica vermelha, enquanto o estável segue normal.',
        key: 'A sombra precisa aguentar a cópia que recebe.',
        f(o, t) { const pct = lin(t, 0.4, 4.0, 10, 100), load = 640 * pct / 100, over = load > 100; lit(o, 'lb', 'est'); o.on.som = over ? 'bad' : 1;
          o.rows.cli = act('clientes', 'BUSCAS', ['640 req/s', 'hi']);
          o.rows.lb = act('malha', 'ISTIO', [`cópia: ${Math.round(pct)}% → sombra`, over ? 'bad' : 'acc']);
          o.rows.est = act('catalogo atual', 'ESTÁVEL', ['640 req/s', 'acc'], ['responde normal', 'dim']);
          o.rows.som = act('catalogo novo', 'SOMBRA · 1 RÉPLICA', [`${Math.round(load)} req/s`, over ? 'bad' : 'acc'], [over ? 'fila crescendo' : 'cabe', over ? 'bad' : 'dim']);
          o.rows.som.bar = [load / 640, over ? 'bad' : 'acc', `CPU ${Math.round(load)}% (escala: 640%)`];
          o.rows.cmp = act('clientes que notam', 'NENHUM', ['a resposta é descartada', 'dim']);
          o.rows.pag = act('banco e cache', 'SE COMPARTILHADOS', [over ? 'o estável sente' : 'tranquilo', over ? 'bad' : 'dim']);
          beam(o, CS.cli, true, '', true); beam(o, CS.est, true, '', true); beam(o, CS.som, true, over ? 'bad' : '', true);
          o.cnt = [['ESPELHO', `${Math.round(pct)}%`], ['CPU DA SOMBRA', `${Math.round(load)}%`, over ? 'bad' : ''], ['CLIENTES QUE NOTAM', '0', 'dim']];
          o.res = pct >= 100 ? [['640%: fila infinita', 'bad'], ['10% → 64 req/s cabe', 'acc']] : []; } },
    ],
    flag: [
      { id: 'publica', dur: 7, title: 'Publicar com a flag desligada', yk: 'PUBLICAR × LIBERAR',
        code: ['deploy: pedidos 2.5.0 em 3 de 3 pods', 'flag frete_v2: 0% (desligada)', 'if frete_v2 { tabela nova por CEP }', 'else       { cálculo antigo }', 'liberar = ligar a flag, sem deploy'],
        story: 'O código da 2.5.0 vai a <b>100% dos pods</b> com a flag <code>frete_v2</code> <b>desligada</b>. O rolling acontece sem efeito para o cliente: todo pedido ainda passa pelo cálculo antigo do frete. <b>Publicar</b> (deploy) e <b>liberar</b> (release) viram duas decisões separadas: liberar é ligar a flag, e quem liga pode ser o negócio, sem deploy. A Lena faz o 1059 e paga 64,00.',
        look: 'Os 3 pods acendem com o código novo, mas a flag de cada um está desligada; no painel de buckets, ninguém está do lado ligado.',
        key: 'A flag separa publicar de liberar.',
        f(o, t) { const a = go_(t, 0.4, 1.4); lit(o, 'fpods', 'flg'); if (a > 0) lit(o, 'bkt');
          beam(o, CF.flg, a > 0 && a < 1); pk(o, CF.flg, a, 'frete_v2: 0%');
          o.cnt = [['CÓDIGO NOVO EM', '3 de 3 pods'], ['FLAG LIGADA PARA', '0%', 'dim'], ['A LENA PAGA', '64,00', 'dim']];
          o.res = a >= 1 ? [['publicado, não liberado', 'acc']] : []; } },
      { id: 'bucket', dur: 7, title: 'Quem cai de qual lado: o bucket', yk: 'O CÁLCULO',
        code: ['bucket = murmur3("frete_v2:" + cliente_id) mod 100', 'ligada = bucket < percentual', 'caio-58 → 3 · lena-77 → 19', 'bia-31 → 38 · mkt-01 → 41', 'davi-12 → 94'],
        story: 'Ligar para 10% não é sortear 10% das requisições: é escolher 10% dos <b>clientes</b>, sempre os mesmos. O cálculo é <code>bucket = murmur3("frete_v2:" + cliente_id) mod 100</code>, e a flag liga quando o bucket é menor que o percentual. Na amostra da loja: <code>caio-58</code> → <b>3</b>, <code>lena-77</code> → <b>19</b>, <code>bia-31</code> → <b>38</b>, <code>mkt-01</code> → <b>41</b>, <code>davi-12</code> → <b>94</b>. O nome da flag entra como sal: na <code>nova_home</code> do módulo 9, a mesma Lena cai em 80.',
        look: 'O painel da direita põe cada cliente na régua de 0 a 99, um por vez.',
        key: 'O mesmo cliente cai sempre do mesmo lado.',
        f(o, t) { const k = Math.min(5, Math.floor(lin(t, 0.3, 3.8, 0, 5.99))); lit(o, 'fpods', 'bkt');
          o.rows.bkt = bkD(0, { show: k, rows: [['murmur3 mod 100', 'acc']] });
          beam(o, CF.bkt, k < 5, '', k < 5);
          o.cnt = [['CLIENTES NA RÉGUA', `${k} de 5`], ['MESMO CLIENTE', 'mesmo bucket', 'dim'], ['nova_home DA LENA', '80', 'dim']];
          o.res = k >= 5 ? [['3 · 19 · 38 · 41 · 94', 'acc']] : []; } },
      { id: 'um', dur: 6, title: '1%: ninguém da amostra', yk: '1%',
        code: ['percentual = 1 → bucket < 1', 'amostra: nenhum dos 5', '100.000 clientes: 985 ligados', 'perto dos 1.000 esperados'],
        story: 'A 1%, a flag liga para quem tem bucket 0. Ninguém da amostra está lá. Entre 100.000 clientes (<code>c-0</code> a <code>c-99999</code>), <b>985</b> têm bucket abaixo de 1, perto dos 1.000 esperados: a função espalha bem. É um degrau de fumaça: pouca gente, só para ver que nada explode.',
        look: 'A linha do percentual aparece no começo da régua; nenhum dos cinco fica do lado aceso.',
        key: '1% é pouca gente, e sempre a mesma.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.5, 0, 1)); lit(o, 'flg', 'fpods', 'bkt');
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p);
          o.rows.fpods.tape = [['1%', 'ok'], ['1%', 'ok'], ['1%', 'ok']];
          beam(o, CF.flg, t < 1.6, '', t < 1.6);
          o.cnt = [['PERCENTUAL', `${p}%`], ['LIGADOS EM 100.000', p ? '985' : '0', 'dim'], ['DA AMOSTRA', '0 de 5', 'dim']];
          o.res = p ? [['985 de 100.000', 'acc']] : []; } },
      { id: 'dez', dur: 8, title: '10%: só o Caio, do Rio, e a métrica já acusa', yk: '10% POR 5 MIN',
        code: ['percentual = 10 → bucket < 10', 'amostra: caio-58 (3), do Rio', '100.000 clientes: 9.878 ligados', '5 pedidos/s × 300 s × 10% = 150 pedidos', '20% de Recife: 30 × 15,00 = R$ 450'],
        story: 'A 10% liga o Caio (bucket 3), que é do Rio: na amostra, ninguém vê o defeito. Mas 10% da loja são <b>9.878</b> de 100.000 clientes, e 20% dos pedidos vão para Recife. Em 5 min são 150 pedidos com a flag ligada, <b>30</b> de Recife com frete 0,00: <b>R$ 450</b>. A métrica <code>frete_zero</code> por cidade, separando quem tem a flag ligada, mostra Recife fora da curva.',
        look: 'A linha do percentual anda até 10 e o Caio acende. À esquerda, a métrica frete_zero de Recife começa a subir.',
        key: 'Quem decide é a métrica de negócio, por bucket.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.5, 1, 10)), n = Math.round(lin(t, 1.8, 6.0, 0, 30)); lit(o, 'flg', 'fpods', 'bkt'); if (n) o.on.fmet = 'bad';
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p);
          o.rows.fpods.tape = [[p + '%', 'ok'], [p + '%', 'ok'], [p + '%', 'ok']];
          o.rows.fmet = act('frete_zero', 'FLAG LIGADA', ['SP 0 · Rio 0', 'dim'], [`Recife ${n}`, n ? 'bad' : 'dim']);
          beam(o, CF.met, n > 0, n > 0 ? 'bad' : '', n > 0 && n < 30);
          o.cnt = [['PERCENTUAL', `${p}%`], ['FRETE ZERO EM RECIFE', String(n), 'bad'], ['PERDA', `R$ ${thou(n * 15)}`, 'dim']];
          o.res = n >= 30 ? [['30 pedidos, R$ 450', 'bad'], ['a métrica acusa a 10%', 'acc']] : []; } },
      { id: 'vinte', dur: 8, title: '20%: a Lena entra, e o 1059 sai por 49,00', yk: '20%',
        code: ['percentual = 20 → bucket < 20', 'amostra: caio-58 (3), lena-77 (19)', 'pedido 1059: 49,00 + frete 0,00', 'deveria ser 49,00 + 15,00 = 64,00', 'a 50%: Caio, Lena, Bia e mkt-01'],
        story: 'A 20% entra a Lena (bucket 19). O 1059, uma camiseta preta de 49,00 para Recife, sai por <b>49,00</b>: a tabela nova não tem a faixa de CEP 50000–52999 e devolve frete 0,00. Status 201, latência igual, 0% de erros: só a métrica de negócio acusa. Se ninguém olhasse, o próximo degrau seria 50%: Caio, Lena, Bia e <code>mkt-01</code>.',
        look: 'A linha do percentual passa do 19 e a Lena entra no lado aceso, em vermelho, com o 1059 a 49,00.',
        key: 'O defeito de Recife precisa de um cliente de Recife do lado ligado.',
        f(o, t) { const p = Math.round(lin(t, 0.3, 1.6, 10, 20)), in_ = p > 19; lit(o, 'flg', 'fpods'); o.on.bkt = in_ ? 'bad' : 1; o.on.fmet = 'bad';
          o.rows.flg.rows[0] = [`frete_v2: ${p}%`, 'acc']; o.rows.bkt = bkD(p, { bad: in_ ? ['lena-77'] : [] });
          o.rows.fpods.tape = [[p + '%', 'ok'], [p + '%', 'ok'], [p + '%', 'ok']];
          o.rows.fmet = act('frete_zero', 'FLAG LIGADA', ['SP 0 · Rio 0', 'dim'], ['Recife subindo', 'bad']);
          const a = go_(t, 2.0, 3.0); beam(o, CF.bkt, a > 0 && a < 1, 'bad'); pk(o, rev(CF.bkt), a, '1059: 49,00', 'bad');
          if (in_) T(o, TE([890, 130, 50]), 'lena-77 · 1059: 49,00', 'bad');
          o.cnt = [['PERCENTUAL', `${p}%`], ['PEDIDO 1059', in_ ? '49,00' : '64,00', in_ ? 'bad' : ''], ['DEVERIA SER', '64,00', 'dim']];
          o.res = in_ ? [['a Lena entrou: frete 0,00', 'bad']] : []; } },
      { id: 'kill', dur: 9, title: 'Kill switch: desliga, e leva até 30 s', yk: 'O CACHE DE 30 S',
        code: ['frete_v2 → 0%', 'cada pod relê a flag quando o cache vence', 'TTL 30 s: até 30 s para os 3 concordarem', 'nesse intervalo, dois pods discordam', 'por isso o cálculo é por cliente'],
        story: 'A métrica disparou: desliga-se a flag. Não há deploy nem rollback de imagem; o código da 2.5.0 continua nos pods, desligado. Mas cada pod guarda a flag num cache local de <b>30 s</b>, então a mudança leva até 30 s para chegar a todos. Nesse intervalo dois pods podem discordar, e um pedido da Lena pode cair num pod que ainda tem a flag ligada. Por isso o cálculo é por cliente, e não por requisição: fora dessa janela, ela vê sempre a mesma versão. A API padrão para esse tipo de flag é a do OpenFeature.',
        look: 'O serviço de flags manda 0%; os pods desligam um a um, conforme o cache de cada um vence, até os 3 concordarem.',
        key: 'Desligar é imediato no serviço e leva até 30 s nos pods.',
        f(o, t) { const s = lin(t, 0.6, 6.6, 0, 30), exp = [8, 19, 30], k = exp.filter(e => s >= e).length; lit(o, 'flg', 'fpods'); o.on.bkt = k < 3 ? 'bad' : 1;
          o.rows.flg.rows[0] = ['frete_v2: 0%', 'acc'];
          o.rows.fpods.rows = [[k < 3 ? `${3 - k} pod(s) ainda ligados` : '3 pods desligados', k < 3 ? 'bad' : 'acc'], ['cache da flag: 30 s', 'dim']];
          o.rows.fpods.tape = exp.map(e => s >= e ? ['0%', 'ok'] : ['20%', 'bad']);
          o.rows.bkt = bkD(k < 3 ? 20 : 0, { bad: k < 3 ? ['lena-77'] : [], rows: [[k < 3 ? 'em transição: 20% ou 0%' : 'percentual: 0%', k < 3 ? 'bad' : 'acc']] });
          beam(o, CF.flg, s < 30, '', s < 30);
          o.cnt = [['DESDE O DESLIGAR', `${Math.round(s)} s`], ['PODS DESLIGADOS', `${k} de 3`, 'dim'], ['DEPLOY', 'nenhum', 'dim']];
          o.res = k === 3 ? [['desligado em ≤ 30 s', 'acc'], ['sem deploy, sem rollback', 'acc']] : []; } },
      { id: 'padrao', dur: 9, title: 'E se der errado: o serviço de flags cai e o padrão é true', yk: 'O PADRÃO COMPILADO',
        code: ['serviço de flags: fora do ar', 'pod: usa o último valor do cache', 'cache vence → usa o padrão do código', 'padrão = true → frete_v2 ligada para 100%', 'regra: padrão = comportamento antigo (false)'],
        story: 'O serviço de flags cai. Cada pod segue com o último valor que tinha no cache; quando o cache vence, usa o <b>padrão</b> escrito no código. Se alguém deixou o padrão em <code>true</code> depois do lançamento, a feature liga para <b>todos</b> de uma vez, sem deploy e sem canary: até o Davi (bucket 94). Regra: o padrão é o comportamento antigo (<code>false</code>), e a flag sai do código assim que chega a 100% e estabiliza. Flag velha é dívida: cada uma dobra os estados possíveis, e 5 flags são 32 combinações.',
        look: 'O serviço de flags fica vermelho; quando o cache vence, a linha do percentual pula para o fim da régua e os cinco clientes entram, a Lena em vermelho.',
        key: 'O padrão da flag é o comportamento antigo.',
        f(o, t) { const down = t > 0.6, all = t > 3.2; o.on.flg = down ? 'bad' : 1; lit(o, 'fpods'); o.on.bkt = all ? 'bad' : 0; if (all) o.on.fmet = 'bad';
          o.rows.flg = act('serviço de flags', 'OPENFEATURE', [down ? 'fora do ar' : 'frete_v2: 0%', down ? 'bad' : 'acc'], ['padrão no código: true', all ? 'bad' : 'dim']);
          o.rows.fpods.rows = [[all ? 'usa o padrão: true' : down ? 'usa o cache: 0%' : 'cache: 0%', all ? 'bad' : 'acc'], ['cache da flag: 30 s', 'dim']];
          o.rows.fpods.tape = Array(3).fill(all ? ['100%', 'bad'] : ['0%', 'ok']);
          o.rows.bkt = bkD(all ? 100 : 0, { bad: all ? ['lena-77'] : [], rows: [[all ? 'percentual: 100% (padrão)' : 'percentual: 0%', all ? 'bad' : 'acc']] });
          o.rows.fmet = act('frete_zero', 'POR CIDADE', ['SP 0 · Rio 0', 'dim'], [all ? 'Recife: todos' : 'Recife 0', all ? 'bad' : 'dim']);
          beam(o, CF.flg, false, down ? 'bad' : '');
          if (all) T(o, TF(), 'liga para todos, sem deploy', 'bad');
          o.cnt = [['frete_v2 LIGADA PARA', all ? '100%' : '0%', all ? 'bad' : ''], ['FONTE', all ? 'padrão do código' : down ? 'cache' : 'serviço', 'dim'], ['CERTO SERIA', 'false', 'dim']];
          o.res = all ? [['padrão true: 100% de uma vez', 'bad'], ['padrão = false; remover a flag', 'acc']] : []; } },
    ],
    aneis: [
      { id: 'aneis', dur: 7, title: 'Três shards, três anéis: 20 → 40 → 100%', yk: 'OS ANÉIS DA LOJA',
        code: ['anel 0 = shard-0 (20%): davi-12', 'anel 1 = shard-1 (20%): lena-77, bia-31', 'anel 2 = shard-2 (60%): caio-58, mkt-01', 'exposição acumulada: 20% → 40% → 100%', 'só passa ao próximo depois do bake time'],
        story: 'Os shards por <code>cliente_id</code> do módulo 16 já são anéis prontos: cada um é uma fração do tráfego. A mesma versão vai anel por anel, em ordem de risco, e só passa ao próximo se o anterior ficar saudável pelo <b>bake time</b> (a ideia da AWS: <i>one-box</i>, ondas, <i>bake time</i>). O <code>mkt-01</code> mora no <code>shard-2</code>, por isso ele tem 60% do tráfego. Exposição acumulada: <b>20%</b>, <b>40%</b>, <b>100%</b>.',
        look: 'Os três shards da direita acendem em ordem; o maior, o shard-2, carrega 60% do tráfego.',
        key: 'Cada shard é um anel: uma fração do tráfego que recebe a versão por vez.',
        f(o, t) { const k = Math.min(3, Math.floor(lin(t, 0.4, 3.4, 0, 3.99))); lit(o, 'pipe'); for (let i = 0; i < k; i++) lit(o, 'r' + i);
          o.rows.pipe.tape = [0, 1, 2].map(i => ['anel ' + i, i < k ? 'ok' : 'none']); o.rows.pipe.bar = [0, 'acc', 'exposição: 0% (ainda na 2.4.0)'];
          [CA.r0, CA.r1, CA.r2].forEach((c, i) => beam(o, c, i < k));
          o.cnt = [['ANÉIS', String(k)], ['EXPOSIÇÃO', '20 → 40 → 100%', 'dim'], ['VERSÃO NOVA', '2.5.0', 'dim']];
          o.res = k >= 3 ? [['20% · 20% · 60%', 'acc']] : []; } },
      { id: 'anel0', dur: 8, title: 'Anel 0: o Davi não exercita Recife', yk: 'ANEL 0 + BAKE TIME',
        code: ['2.5.0 no shard-0: 20% do tráfego', 'davi-12 compra para SP: frete certo', 'bake time: frete_zero = 0', 'anel 0 saudável → segue para o anel 1'],
        story: 'A 2.5.0 vai ao <code>shard-0</code>, 20% do tráfego. Na amostra da loja, quem está ali é o Davi, que compra para SP: a faixa de CEP dele existe na tabela nova e o frete sai certo. O bake time passa com <code>frete_zero</code> em 0, e o pipeline segue para o anel 1. O anel não estava errado: só não exercitava o código defeituoso.',
        look: 'A versão desce para o anel 0; o relógio do bake corre no pipeline e a métrica, à esquerda, fica em 0.',
        key: 'Um anel saudável só prova o que ele exercitou.',
        f(o, t) { const a = go_(t, 0.4, 1.4), bake = lin(t, 1.6, 5.0, 0, 1), ok = bake >= 1; lit(o, 'pipe', 'amet'); if (a >= 1) { lit(o, 'r0'); ring(o, 0, '2.5.0'); }
          o.rows.pipe.tape = [['anel 0', a >= 1 ? 'ok' : 'none'], ['anel 1', 'none'], ['anel 2', 'none']];
          o.rows.pipe.rows[1] = [ok ? 'bake passou: segue' : a >= 1 ? `bake ${Math.round(bake * 100)}%` : 'manda ao anel 0', ok ? 'acc' : 'dim'];
          o.rows.pipe.bar = [a >= 1 ? 0.2 : 0, 'acc', `exposição: ${a >= 1 ? 20 : 0}%`];
          beam(o, CA.r0, a > 0, '', a > 0 && !ok); pk(o, CA.r0, a, '2.5.0'); beam(o, CA.met, a >= 1);
          o.cnt = [['EXPOSTO', a >= 1 ? '20%' : '0%'], ['FRETE ZERO', '0', 'dim'], ['BAKE', ok ? 'passou' : '…', 'dim']];
          o.res = ok ? [['anel 0 saudável', 'acc'], ['o Davi é de SP', 'dim']] : []; } },
      { id: 'anel1', dur: 9, title: 'Anel 1: a Lena, e o defeito aparece com 40% exposto', yk: 'ANEL 1',
        code: ['2.5.0 no shard-1: exposição 40%', 'lena-77, pedido 1059: 49,00 (frete 0,00)', 'frete_zero de Recife sobe', 'o pipeline para e volta o anel 1', 'o anel 2 (60%) não recebe nada'],
        story: 'No anel 1 está a Lena. O 1059 sai por <b>49,00</b> e a métrica <code>frete_zero</code> de Recife sobe. O pipeline para e volta o anel 1 para a 2.4.0; o anel 2, com 60% do tráfego, nem chega a receber a versão. Mas o defeito só apareceu com <b>40%</b> do tráfego já na 2.5.0. Quem exercita o código importa mais que o tamanho do anel.',
        look: 'A versão desce ao anel 1, que fica vermelho com o 1059 a 49,00; a métrica à esquerda acende e, no fim, o anel 1 volta à 2.4.0.',
        key: 'Quem exercita o código importa mais que o tamanho do anel.',
        f(o, t) { const a = go_(t, 0.4, 1.3), bad = t > 2.0, back = t > 5.0; lit(o, 'pipe', 'r0'); ring(o, 0, '2.5.0');
          if (a >= 1 && !back) { o.on.r1 = bad ? 'bad' : 1; ring(o, 1, bad ? '2.5.0 · 1059: 49,00' : '2.5.0', bad ? 'bad' : 'acc'); } else if (back) { lit(o, 'r1'); ring(o, 1, 'voltou: 2.4.0', 'acc'); }
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[1] = ['anel 1: Recife sobe', 'bad']; }
          o.rows.pipe.tape = [['anel 0', 'ok'], ['anel 1', bad ? 'bad' : a >= 1 ? 'ok' : 'none'], ['anel 2', 'none']];
          o.rows.pipe.rows[1] = [back ? 'parou: anel 1 de volta' : bad ? 'frete_zero: para' : 'manda ao anel 1', bad ? 'bad' : 'dim'];
          o.rows.pipe.bar = [back ? 0.2 : a >= 1 ? 0.4 : 0.2, bad && !back ? 'bad' : 'acc', `exposição: ${back ? 20 : a >= 1 ? 40 : 20}%`];
          beam(o, CA.r1, a > 0, bad && !back ? 'bad' : ''); pk(o, CA.r1, a, '2.5.0'); beam(o, CA.met, bad, 'bad', bad && !back); beam(o, CA.r0, true);
          if (bad && !back) T(o, TE([890, 250, 46]), 'lena-77 · 1059: 49,00', 'bad');
          o.cnt = [['EXPOSTO QUANDO APARECEU', '40%', 'bad'], ['PEDIDO 1059', bad ? '49,00' : '…', 'bad'], ['ANEL 2', 'não recebeu', 'dim']];
          o.res = bad ? [['apareceu com 40% exposto', 'bad'], ['o anel 2 ficou de fora', 'acc']] : []; } },
      { id: 'sinteticos', dur: 9, title: 'Conserto: clientes sintéticos no anel 0', yk: 'ONE-BOX COM SINTÉTICOS',
        code: ['anel 0 + clientes sintéticos', 'pedidos de teste para SP, Rio e Recife', 'Recife sintético: frete 0,00 → para', 'exposição quando parou: 20%', 'k-means agrupa; não diz quem é de baixo risco'],
        story: 'O conserto é fazer o primeiro anel exercitar tudo: <b>clientes sintéticos</b> com pedidos em todas as cidades rodam no anel 0 (o <i>one-box</i> da AWS). O pedido sintético para Recife volta com frete 0,00 e o pipeline para ainda no anel 0, com 20%: a Lena nem chega a ver a 2.5.0. O artigo sugere escolher o primeiro anel por <b>cluster</b> de clientes (k-means sobre segmento, volume e região). Correção: o k-means só descobre grupos parecidos; não diz quais são de baixo risco. O primeiro anel se escolhe por risco e negócio (funcionários, sintéticos, regiões pequenas), e o clustering ajuda no passo seguinte.',
        look: 'Os sintéticos, à esquerda, mandam pedidos ao pipeline, que os leva ao anel 0; o de Recife volta vermelho e o pipeline para ali.',
        key: 'O primeiro anel precisa exercitar todos os caminhos.',
        f(o, t) { const a = go_(t, 0.4, 1.3), b = go_(t, 1.4, 2.3), bad = t > 2.6; lit(o, 'sin', 'pipe'); o.on.r0 = bad ? 'bad' : b > 0 ? 1 : 0; ring(o, 0, bad ? 'Recife sintético: 0,00' : '2.5.0', bad ? 'bad' : 'acc');
          o.rows.sin = act('clientes sintéticos', 'ONE-BOX', ['SP · Rio · Recife', 'acc'], [bad ? 'Recife: frete 0,00' : 'pedidos de teste', bad ? 'bad' : 'dim']);
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[0] = ['anel 0: Recife (teste)', 'bad']; }
          o.rows.pipe.tape = [['anel 0', bad ? 'bad' : 'ok'], ['anel 1', 'none'], ['anel 2', 'none']];
          o.rows.pipe.rows[1] = [bad ? 'parou no anel 0' : 'anel 0 + sintéticos', bad ? 'bad' : 'dim'];
          o.rows.pipe.bar = [0.2, 'acc', 'exposição: 20%'];
          beam(o, CA.sin, a > 0 && a < 1); beam(o, CA.r0, b > 0, bad ? 'bad' : ''); beam(o, CA.met, bad, 'bad');
          pk(o, CA.sin, a, 'pedido sintético · Recife'); pk(o, CA.r0, b, 'Recife (teste)');
          if (bad) T(o, TF(), 'parou no anel 0: a Lena nem viu', 'acc');
          o.cnt = [['PAROU NO', bad ? 'anel 0' : '…', bad ? '' : 'dim'], ['EXPOSTO', '20%', 'dim'], ['LENA AFETADA', 'não', 'dim']];
          o.res = bad ? [['pego no anel 0, com 20%', 'acc'], ['k-means: grupos, não risco', 'dim']] : []; } },
      { id: 'custo', dur: 7, title: 'O custo: pods e versões por anel', yk: 'A CONTA DOS PODS',
        code: ['3 pods do pedidos → 1 por shard, 30/s cada', 'shard-2: 60% de 30 pedidos/s = 18/s (cabe)', 'Black Friday: 60 × 60% = 36/s > 30', 'o anel quente precisa de mais pods', 'e uma versão por anel para operar'],
        story: 'Anéis custam. Os 3 pods do <code>pedidos</code> viram <b>1 por shard</b>, de 30 pedidos/s cada. Com 30 pedidos/s na loja, o <code>shard-2</code> recebe 60%: <b>18/s</b>, cabe. Com o tráfego dobrado da Black Friday, 60 × 60% = <b>36/s</b> passa de 30: o anel quente precisa de mais pods. E há uma versão por anel para operar e monitorar. É o bulkhead aplicado à mudança (o anel é o raio de explosão da mudança), e o caminho para as células do módulo 26.',
        look: 'A barra de carga do shard-2 sobe de 18/s para 36/s e passa do limite de 30, em vermelho.',
        key: 'Cada anel precisa de capacidade própria.',
        f(o, t) { const l = lin(t, 1.0, 4.0, 18, 36), over = l > 30; lit(o, 'pipe', 'r0', 'r1'); o.on.r2 = over ? 'bad' : 1;
          o.rows.r0.rows = [['1 pod · 30/s', 'dim'], ['20%', 'dim']]; o.rows.r1.rows = [['1 pod · 30/s', 'dim'], ['20%', 'dim']];
          o.rows.r2.rows = [['1 pod · aguenta 30/s', 'hi'], [`carga ${Math.round(l)}/s`, over ? 'bad' : 'acc']]; o.rows.r2.bar = [l / 40, over ? 'bad' : 'acc', `${Math.round(l)} de 30/s (escala: 40)`];
          o.rows.pipe.rows[1] = ['uma versão por anel', 'dim'];
          o.cnt = [['SHARD-2', `${Math.round(l)}/s`, over ? 'bad' : ''], ['UM POD AGUENTA', '30/s', 'dim'], ['BLACK FRIDAY', '36/s', 'bad']];
          o.res = over ? [['o anel quente precisa de mais pods', 'bad']] : [['18/s: cabe', 'acc']]; } },
      { id: 'ultimo', dur: 8, title: 'E se der errado: o último degrau é de 40% para 100%', yk: 'OS DEGRAUS',
        code: ['anel 0: 20% · anel 1: +20% · anel 2: +60%', 'o maior salto é o último', 'defeito que só aparece sob a carga do mkt-01:', '  passa limpo pelos anéis 0 e 1', 'conserto: dividir o anel 2 ou um anel no meio'],
        story: 'Os anéis crescem 20, 20 e 60: o último degrau, de <b>40% para 100%</b>, é o maior e o mais arriscado. Se o defeito só aparece sob a carga do <code>mkt-01</code>, ele passa limpo pelos anéis 0 e 1 e explode no anel 2, com 60% do tráfego de uma vez. Conserto: dividir o anel 2 (o <code>shard-2</code> dedicado do módulo 16) ou pôr um anel intermediário.',
        look: 'Os anéis 0 e 1 ficam acesos e saudáveis; a versão chega ao anel 2 e a exposição salta de 40% para 100%, em vermelho.',
        key: 'O degrau final é o maior: divida o anel grande.',
        f(o, t) { const a = go_(t, 0.8, 1.8), bad = t > 2.4, ex = lin(t, 0.8, 1.8, 40, 100); lit(o, 'pipe', 'r0', 'r1'); ring(o, 0, '2.5.0'); ring(o, 1, '2.5.0');
          if (a >= 1) { o.on.r2 = bad ? 'bad' : 1; ring(o, 2, bad ? '2.5.0 · explode sob carga' : '2.5.0', bad ? 'bad' : 'acc'); }
          o.rows.pipe.tape = [['anel 0', 'ok'], ['anel 1', 'ok'], ['anel 2', bad ? 'bad' : a >= 1 ? 'ok' : 'none']];
          o.rows.pipe.bar = [ex / 100, bad ? 'bad' : 'acc', `exposição: ${Math.round(ex)}%`];
          o.rows.pipe.rows[1] = [bad ? 'salto de 60% de uma vez' : 'anéis 0 e 1 saudáveis', bad ? 'bad' : 'acc'];
          if (bad) { o.on.amet = 'bad'; o.rows.amet.rows[2] = ['anel 2: carga do mkt-01', 'bad']; }
          beam(o, CA.r0, true); beam(o, CA.r1, true); beam(o, CA.r2, a > 0, bad ? 'bad' : ''); pk(o, CA.r2, a, '2.5.0 · +60%');
          if (bad) T(o, TE([735, 260, 70]), 'dividir o anel 2', 'acc');
          o.cnt = [['SALTO', '40% → 100%', 'bad'], ['ANEL 2', '60%', 'dim'], ['CONSERTO', 'dividir o anel 2', 'dim']];
          o.res = bad ? [['o maior degrau é o último', 'bad'], ['dividir o anel 2', 'acc']] : []; } },
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
      x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, 'vazia', 11, 60); x.fillText('vazia', u(W_ / 2), u(y0 + ch / 2 + 0.5)); x.textAlign = 'left'; return; }
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    const nl = Math.min(6, yl.length), lh = nl > 5 ? 11.6 : 13;
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * lh)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    migracao: () => `<li>Medido num PostgreSQL 14.24 local (20/10/2026), tabela <code>pedidos</code> de 1.000.000 de linhas de ~2 KB (1.975 MB). Ordem de grandeza: não extrapolar em linha reta.</li><table class="h3-sum"><tr><th>operação</th><th>tempo</th><th>efeito</th></tr><tr class="on"><td><code>ADD COLUMN frete numeric(10,2)</code></td><td>3,2 ms</td><td>só o catálogo</td></tr><tr><td><code>ADD COLUMN moeda … DEFAULT 'BRL'</code></td><td>1,9 ms</td><td>padrão nos metadados</td></tr><tr><td><code>ADD COLUMN … DEFAULT random()</code></td><td>7,9 s</td><td>reescreve a tabela</td></tr><tr><td><code>UPDATE</code> de uma vez</td><td>8,0 s</td><td>3.950 MB (+100%)</td></tr><tr class="on"><td>100 lotes de 10.000</td><td>~66 ms/lote</td><td>2.407 MB (+22%)</td></tr><tr><td><code>CREATE INDEX</code></td><td>2,0 s</td><td><code>INSERT</code> esperou 1,03 s</td></tr><tr><td><code>… CONCURRENTLY</code></td><td>2,95 s</td><td><code>INSERT</code> esperou 28 ms</td></tr><tr><td><code>RENAME COLUMN</code></td><td>ms</td><td>a 2.4.0 quebra</td></tr></table><li>Fila de lock: <code>SELECT</code> esperou <b>4,0 s</b> atrás do <code>ALTER</code>; com <code>lock_timeout = '1s'</code>, o <code>ALTER</code> desiste em <b>1,0 s</b></li><li>Na loja: 16,67M linhas por shard, lotes de 10.000 com 1 s de pausa ≈ <b>30 min por shard</b></li><li><code>mod 3</code> → <code>mod 4</code>: 75,2% das chaves mudam; ~113 de 150 pedidos no shard errado; a Lena "perde" 1042, 1044, 1047, 1048, 1051 e 1054</li>`,
    shadow: () => `<table class="h3-sum"><tr><th>caso</th><th>na sombra</th><th>resultado</th></tr><tr class="on"><td><code>pedidos</code>, espelho 10%</td><td>0,5 pedido/s</td><td>150 cópias em 5 min; 30 de Recife, todas diferentes (64,00 × 49,00)</td></tr><tr><td><code>catalogo</code>, 10% de 640 req/s</td><td>64 req/s em 1 réplica</td><td>ρ 64%, R 37,8 ms</td></tr><tr><td><code>catalogo</code>, 100%</td><td>640 req/s em 1 réplica</td><td>640%: fila sem fim</td></tr><tr><td>lab, <code>percent: 1</code></td><td>0,05 pedido/s</td><td>3 por minuto</td></tr></table><li>Clientes expostos à 2.5.0: <b>0%</b>; perda: <b>R$ 0</b></li><li>Sem stub: 150 cobranças duplicadas × R$ 64,00 = <b>R$ 9.600</b> em 5 min</li><li>Istio: <code>mirror</code> + <code>mirrorPercentage</code>; a cópia vai com <code>Host</code> terminado em <code>-shadow</code>, "fire and forget"</li><li>Lab do autor (lido, não executado): <code>shadow/chip.yml</code> e <code>shadow/shadow.yml</code> (<code>chip-shadow</code>, <code>v9</code>, 1 réplica)</li>`,
    flag: () => `<table class="h3-sum"><tr><th>cliente</th><th>frete_v2</th><th>nova_home</th><th>liga a partir de</th></tr>${CLI5.map(([id, b]) => `<tr${id === 'lena-77' ? ' class="on"' : ''}><td>${id}</td><td>${b}</td><td>${{ 'caio-58': 72, 'lena-77': 80, 'bia-31': 2, 'mkt-01': 87, 'davi-12': 67 }[id]}</td><td>${b + 1}%</td></tr>`).join('')}</table><li><code>bucket = murmur3("frete_v2:" + cliente_id) mod 100</code>; ligada se <code>bucket &lt; percentual</code></li><li>Em 100.000 clientes: <b>985</b> abaixo de 1, <b>9.878</b> abaixo de 10, <b>49.909</b> abaixo de 50</li><li>A 10% por 5 min: 150 pedidos, 30 de Recife, <b>R$ 450</b></li><li>Cache local de 30 s: desligar leva até 30 s; padrão sempre <code>false</code></li><li>Tipos (Fowler): release, experiment, ops (kill switch), permission</li>`,
    aneis: () => `<table class="h3-sum"><tr><th>anel</th><th>shard</th><th>tráfego</th><th>acumulado</th><th>amostra</th></tr><tr><td>0</td><td>shard-0</td><td>20%</td><td>20%</td><td>davi-12</td></tr><tr class="on"><td>1</td><td>shard-1</td><td>20%</td><td>40%</td><td>lena-77, bia-31</td></tr><tr><td>2</td><td>shard-2</td><td>60%</td><td>100%</td><td>caio-58, mkt-01</td></tr></table><li>O defeito de Recife aparece no anel 1, com <b>40%</b> exposto; com sintéticos no anel 0, com <b>20%</b></li><li>1 pod por shard, 30 pedidos/s: shard-2 a 18/s cabe; na Black Friday, 36/s não cabe</li><li>Correção ao artigo: k-means agrupa clientes parecidos, não escolhe os de baixo risco</li><li>AWS Builders' Library: <i>one-box</i>, ondas, <i>bake time</i></li>`,
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
  function readout() { if (active !== 'liberacao') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
