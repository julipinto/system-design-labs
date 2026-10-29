// 3D figure (iso-glow), English copy: the store's hull. A cutaway ship with bulkheads (the analogy, once) and the 20-connection pool
// of the orders database as a hull of 20 compartments (4 × 5 cells; the bulkhead rises between the 16 interactive and the 4 batch).
// Fichas: checkout em amarelo-sódio (a cor de destaque), status do pedido em grafite, o relatório das 23:00 grande e lento.
// Os nós aparecem como andares de um galpão, com os pods em cima. Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=casco|pool|fisico|raio|funcional|operacional|referencia; ?step=N abre no passo N).
// Dados: docs/escrita/bulkhead-brief.md e as aulas 1 a 5 (Little 0.2 + 0.2 + 40 > 20; k6 v2.3.0 na janela 25–50 s: pool único
// 83 e 101 × 503 (66.8% e 89.9% ok), relatório 47.2% ok, p95 12.0 s; 16 + 4: 0 × 503, relatório 14.0% ok, 215 × 503, p95 7.4 s;
// 4 + 4 e 12 devolvidas; 1 consulta/s, 10 → 100 min; raio 1 ÷ N, 20 · 20 · 60 e 20 · 20 · 20 · 40, estoque 100%;
// réplica do Rio (lag 300 ms); lanes 12 · 6 · 2; newsletter 50,000 ÷ 120/s = 417 s; teto de 100 req/s, 900 garantidos, 400 com 429;
// 3 lanes × 4 shards = 12 compartimentos, × 2 = 24 pods onde 10 bastavam). O vazamento do relatorios (físico) é qualitativo.
FIGS3D.push({ id: 'anteparas', name: 'Bulkheads', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 1) => v.toFixed(d);
  const hhmm = m => { const t = (23 * 60 + Math.round(m)) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['casco', 'pool', 'fisico', 'raio', 'funcional', 'operacional', 'referencia'];
  const SCNAME = { casco: 'Hull', pool: 'Pool', fisico: 'Physical', raio: 'Radius', funcional: 'Functional', operacional: 'Operational', referencia: 'Reference' };
  const SCFULL = { casco: 'The hull and the bulkheads', pool: 'The 20-connection pool', fisico: 'Logical and physical: the nodes',
    raio: 'The blast radius', funcional: 'Functional bulkhead', operacional: 'Operational bulkhead', referencia: 'The six reference designs' };
  const AULA = { casco: 'aula-1-introducao-ao-bulkhead', pool: 'aula-1-introducao-ao-bulkhead', fisico: 'aula-2-bulkheads-logicos-e-fisicos',
    raio: 'aula-3-bulkheads-e-blast-radius', funcional: 'aula-4-bulkhead-e-sharding-funcional-e-operacional',
    operacional: 'aula-4-bulkhead-e-sharding-funcional-e-operacional', referencia: 'aula-5-arquiteturas-de-referencia' };
  let clk = 0, sc = 'pool', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-anteparas3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0); zb = onde a base pousa
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 20, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 }, POD = { s1: 13, fs: 11.5, lh: 14, y0: 33 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5, zb = PL) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y, zb] };
  }
  // Casco: o navio em corte (popa, 1 ou 6 compartimentos, proa)
  const HX = 90, HY = 170, HW = 700, HD = 130, HH = 30, HG = 6, CWd = (HW - 5 * HG) / 6, HCX = k => HX + k * (CWd + HG);
  block('h1', HX, HY, HW, HD, HH);
  for (let k = 0; k < 6; k++) block('hc' + k, HCX(k), HY, CWd, HD, HH, SMALL);
  // Pool: os três fluxos, o pool (4 × 5 casas) e o banco
  block('chk', 40, 40, 180, 110, 16); block('sts', 40, 170, 180, 110, 16); block('rel', 40, 300, 180, 120, 22);
  block('pool', 330, 40, 300, 380, 18); block('bd', 680, 150, 190, 160, 24);
  // Físico: o pod com os compartimentos lógicos; um nó só; dois pools de nós
  block('podL', 250, 50, 420, 330, 18);
  const NH = 12, NZ = PL + NH;
  block('nA', 60, 120, 780, 240, NH, SMALL);
  [90, 250, 410].forEach((x, k) => block('pp' + k, x, 175, 140, 120, 22, POD, 5, NZ)); block('prel', 600, 175, 210, 120, 22, POD, 5, NZ);
  block('nC', 60, 120, 500, 240, NH, SMALL); block('nB', 590, 120, 260, 240, NH, SMALL);
  [80, 237, 394].forEach((x, k) => block('cp' + k, x, 175, 145, 120, 22, POD, 5, NZ)); block('brel', 615, 175, 210, 120, 22, POD, 5, NZ);
  // Raio: a tabela (N casas) e os shards com a fração do tráfego como largura
  block('ncel', 60, 50, 780, 300, 14);
  const S3 = [[60, 150], [225, 150], [390, 450]], S4 = [[60, 147], [222, 147], [384, 147], [546, 294]];
  S3.forEach(([x, w], k) => block('o3' + k, x, 190, w, 130, 22)); S4.forEach(([x, w], k) => block('o4' + k, x, 190, w, 130, 22));
  block('hsh', 270, 40, 360, 96, 16, SMALL); block('oglob', 60, 360, 780, 74, 14, SMALL);
  // Funcional: as três funções, primário e réplica, o tópico; as lanes; a newsletter
  block('fped', 40, 40, 230, 110, 18); block('frel', 40, 170, 230, 110, 18); block('fent', 40, 300, 230, 110, 18);
  block('fsp', 330, 40, 240, 120, 26); block('frio', 330, 190, 240, 100, 22); block('fkaf', 620, 300, 250, 110, 16);
  block('lanes', 300, 50, 330, 330, 16); block('la', 690, 60, 180, 90, 16, SMALL); block('ln', 690, 180, 180, 90, 16, SMALL); block('lb', 690, 300, 180, 90, 16, SMALL);
  block('nnews', 40, 300, 230, 110, 18); block('nkaf', 330, 40, 250, 120, 18); block('nrab', 330, 300, 250, 110, 18);
  block('nent', 630, 40, 240, 120, 18); block('nmail', 630, 300, 240, 110, 18);
  // Referência: seis desenhos em 3 × 2 e o contador de pods
  const RX = [40, 245, 450], RY = [50, 225];
  const REF = ['prio', 'crit', 'uso', 'seg', 'hash', 'ten'];
  REF.forEach((nm, k) => block('r_' + nm, RX[k % 3], RY[Math.floor(k / 3)], 190, 160, 16, SMALL));
  block('pods', 680, 50, 190, 335, 18, SMALL);
  const NAMES = Object.keys(B);
  // a popa e a proa do navio (só no Casco), num grupo que afunda junto com o casco
  const ship = new THREE.Group(); g0.add(ship); ship.visible = false;
  rbox(HX - 46, HY, 0, 50, HD, HH, 22, bodyMat, ship);
  { const sh = new THREE.Shape(); sh.moveTo(HX + HW - 4, -HY); sh.lineTo(HX + HW + 74, -(HY + HD / 2)); sh.lineTo(HX + HW - 4, -(HY + HD)); sh.lineTo(HX + HW - 4, -HY);
    const g = new THREE.ExtrudeGeometry(sh, { depth: HH + 6, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.scale(TS, TS, TS);
    const m = new THREE.Mesh(g, bodyMat); addOutline(m); twMeshes.push(m); ship.add(m); }
  // as anteparas do navio: 5 lâminas que sobem entre os compartimentos e passam do convés
  const HWALLS = Array.from({ length: 5 }, (_, k) => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, HG, HD + 10, HH + 16, 1, mat, g); return { g, mat, f: 0, x: HCX(k + 1) - HG }; });
  // a antepara do pool: uma lâmina na horizontal, entre as fileiras (16 | 4 ou 4 | 4)
  const PX = 330 + 2.5, PY = 40 + 2.5, GX = 6, GY = 30, GW = 300 - 5 - 12, GH = 315, PCOL = 4, PROW = 5, COLW = GW / PCOL, RH = GH / PROW;
  const PWALL = (() => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, GW + 8, 5, 20, 1, mat, g); return { g, mat, f: 0, row: 4 }; })();
  // pilhas: 503 recusados, consultas na fila
  const KW = 46, KD = 40, KH = 8, KMAX = 6;
  const CARDS = Array.from({ length: 14 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos grossos (vigas) e fichas de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 64 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 24 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-6, -6, -6, 12, 12, 12, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c), grayEm = new THREE.Color(0x8d9399);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : tone === 'gray' ? grayEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : tone === 'gray' ? 0.3 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.thin ? 2.6 : b.on || b.tone === 'bad' ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if ((b.on || b.tone === 'bad') && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
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
  const TF = x => [x, 446, 24];   // balão na faixa livre da frente da prancha

  // ── cabos (pontas nas bordas dos blocos) ──
  const P3 = (pts, z = Z) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const CAB = {
    // Pool
    chk: P3([[220, 75], [330, 75]]), sts: P3([[220, 205], [330, 205]]), rel: P3([[220, 360], [330, 360]]), bd: P3([[630, 230], [680, 230]]),
    // Casco: o cano que atravessa as anteparas, no convés
    cano: P3([[HX + 20, HY + 40], [HX + HW - 20, HY + 40]], PL + HH + 10),
    // Físico: o nó compartilhado e os dois pools
    // Raio e Operacional: o roteador desce para os shards; os shards descem para o estoque e a configuração
    hdown: P3([[450, 136], [450, 160]]),
    // Funcional
    fped: P3([[270, 95], [330, 95]]), frelsp: P3([[270, 200], [300, 200], [300, 140], [330, 140]]), frelrio: P3([[270, 240], [330, 240]]),
    frep: P3([[450, 160], [450, 190]]), fkaf: P3([[620, 355], [270, 355]]),
    la: P3([[690, 105], [630, 105]]), ln: P3([[690, 225], [630, 225]]), lb: P3([[690, 345], [630, 345]]),
    nped: P3([[270, 95], [330, 95]]), nent: P3([[580, 100], [630, 100]]), nnews: P3([[270, 355], [330, 355]]), nmail: P3([[580, 355], [630, 355]]),
    nwrong: P3([[240, 300], [240, 220], [300, 220], [300, 140], [330, 140]]),
  };
  // ramais do barramento do roteador até o topo de cada shard
  const shardsOf = n => (n === 3 ? S3 : S4).map(([x, w]) => x + w / 2);
  const hbus = n => { const c = shardsOf(n); return P3([[c[0], 160], [c[c.length - 1], 160]]); };
  const hBranches = (n, f = () => ({})) => shardsOf(n).map((cx, k) => ({ pts: P3([[cx, 160], [cx, 190]]), ...f(k) }));
  const toDeps = (n, f = () => ({})) => shardsOf(n).map((cx, k) => ({ pts: P3([[cx, 320], [cx, 360]]), ...f(k) }));
  function pk(o, pts, f, label, tone = '') {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone]);
    if (label) o.tags.push([p[0], p[1], p[2] + 18, label, tone || 'acc']);
  }
  const rev = pts => pts.slice().reverse();
  // fichas num cabo: período per (s), a ficha k sai em k × per; bad(k) diz se ela volta recusada (do meio do cabo em diante)
  function tokens(o, pts, per, tone, bad = () => false, travel = 1.2) {
    for (let k = Math.floor((clk - travel * 2) / per); k <= Math.floor(clk / per); k++) {
      const a = clk - k * per; if (a < 0) continue; const f = a / travel; const no = bad(k);
      if (no) { if (f < 1) pk(o, pts, f, '', tone); else if (f < 1.8) pk(o, rev(pts), f - 1 + 0.001, '', 'bad'); }
      else if (f < 1) pk(o, pts, f, '', tone);
    }
  }

  // ── conteúdo dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], walls: 0, hwalls: 0, sink: {}, ship: 0 }; }

  // Pool: cells = 20 códigos ('c' checkout, 's' status, 'r' relatório, 'x' devolvida, '' livre); split = 0 (único), 16 ou 4
  function poolBase(o, split = 0) {
    show(o, 'chk', 'sts', 'rel', 'pool', 'bd');
    o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], ['in use: 0.2', 'dim']);
    o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], ['in use: 0.2', 'dim']);
    o.rows.rel = act('report', '23:00', ['10/s × 4 s', 'dim'], ['asks: 40', 'dim']);
    o.rows.pool = act('pool · 20 connections', 'pedidos DB'); o.rows.pool.pool = { split, cells: Array(20).fill(''), relTone: '' };
    o.rows.bd = act('pg pedidos', 'PRIMARY', ['max_connections', 'dim'], ['100 (97 non-super)', 'dim']);
    o.walls = split ? 1 : 0; o.wallRow = split === 4 ? 1 : 4;
    o.beams = [{ pts: CAB.chk, on: 1 }, { pts: CAB.sts, on: 1 }, { pts: CAB.rel }, { pts: CAB.bd, on: 1 }];
  }
  const cellsOf = o => o.rows.pool.pool.cells;
  // o tráfego do cliente piscando em duas casas livres (0.4 de 20 em uso)
  const blink = (o, a = 0, b = 1) => { const c = cellsOf(o); if ((clk * 2.2) % 1 < 0.55) c[a] = 'c'; if ((clk * 3.1 + 0.4) % 1 < 0.5) c[b] = 's'; };
  // Casco: o navio com 1 ou 6 compartimentos; water = { k: fração }
  function hullBase(o, six, water = {}, sink = 0) {
    o.ship = 1; o.hwalls = six ? 1 : 0;
    if (!six) { show(o, 'h1'); const f = water[0] || 0; o.rows.h1 = act('hull', '1 COMPARTMENT', [f ? `water: ${Math.round(f * 100)}%` : 'dry', f ? 'bad' : 'dim']); o.rows.h1.water = f; if (f) bad(o, 'h1'); o.sink.h1 = sink; }
    else for (let k = 0; k < 6; k++) { const nm = 'hc' + k, f = water[k] || 0; show(o, nm);
      o.rows[nm] = act('comp. ' + (k + 1), '', [f ? `water ${Math.round(f * 100)}%` : 'dry', f ? 'bad' : 'dim']); o.rows[nm].water = f; if (f) bad(o, nm); o.sink[nm] = sink; }
    o.shipSink = sink;
  }
  // Raio e Operacional: shards com a fração do tráfego; st[k] = 'bad' derruba o shard k
  function shards(o, n, st = {}, mk = true) {
    const fr = n === 3 ? [20, 20, 60] : [20, 20, 20, 40];
    fr.forEach((p, k) => { const nm = (n === 3 ? 'o3' : 'o4') + k, isMk = mk && k === n - 1; show(o, nm);
      o.rows[nm] = act(n === 4 && k === 3 ? 'mkt-01 shard' : 'shard-' + k, st[k] === 'bad' ? 'DOWN' : 'ORDERS',
        [`${p}% of traffic`, st[k] === 'bad' ? 'bad' : isMk ? 'acc' : 'dim'], isMk ? [n === 3 ? '+ mkt-01 (40%)' : 'mkt-01 only', st[k] === 'bad' ? 'bad' : 'acc'] : ['regular customers', 'dim']);
      if (st[k] === 'bad') bad(o, nm); else if (st[k] === 'on') lit(o, nm); });
  }
  const routerRows = (...r) => act('lb-loja', 'HASH(cliente_id)', ...r);
  // Físico: um nó ou dois pools de nós; mem = fração de memória ocupada
  const podRow = (nm, meta, ...r) => act(nm, meta, ...r);
  // Referência: o que cada desenho responde, divide e cobra
  const REFD = {
    prio: { n: 'priority', q: 'what comes first?', loja: 'lanes 12 · 6 · 2', rec: 'workers, queues', preco: 'idle quiet lanes' },
    crit: { n: 'criticality', q: 'what must not fail?', loja: 'pagamentos: own nodes', rec: 'nodes, cluster', preco: 'dedicated infra' },
    uso: { n: 'type of use', q: 'interactive or batch?', loja: 'report and newsletter', rec: 'queues, workers', preco: 'two pipelines' },
    seg: { n: 'segment', q: 'who shares the fate?', loja: 'individuals × partners', rec: 'pods per segment', preco: 'capacity of each' },
    hash: { n: 'hashing', q: 'where does the burst land?', loja: '200-slot ring', rec: 'shards', preco: 'resharding' },
    ten: { n: 'tenants', q: 'what about the noisy neighbor?', loja: 'mkt-01: 100 req/s cap', rec: 'capacity per tenant', preco: 'limits to maintain' },
  };
  function refBase(o, onSet = [], hot = '') {
    REF.forEach(k => { const nm = 'r_' + k, D = REFD[k], on = onSet.includes(k); show(o, nm);
      o.rows[nm] = on ? act(D.n, k === hot ? 'TURNED ON' : 'ON', [D.loja, 'acc'], [D.rec, 'dim'], ['price: ' + D.preco, k === hot ? 'bad' : 'dim'])
        : act(D.n, '', [D.q, 'dim']);
      if (on) o.on[nm] = k === hot ? 1 : 2; });
    show(o, 'pods');
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    casco: [
      { id: 'casco', dur: 5, title: 'A hull with no bulkheads', yk: 'THE CUTAWAY SHIP',
        code: ['hull: 1 compartment', 'hole: none', 'floats: yes', 'bulkhead = a wall', '  that divides the hull'],
        story: 'A cutaway ship, seen from above. This hull has <b>a single compartment</b>, from stern to bow, with no wall in the middle. As long as the hull is intact, it floats. This is the only time the ship appears in the module: it lends the word <i>bulkhead</i>.',
        look: 'The whole hull is a single block. In the next steps, a hole and then the walls.',
        key: 'With no walls, the whole hull is one compartment.',
        f(o) { hullBase(o, false); o.on.h1 = 2;
          o.cnt = [['COMPARTMENTS', '1'], ['FLOODED', '0%', 'dim'], ['FLOATS', 'yes', 'dim']];
          o.res = [['whole hull, dry', 'acc']]; } },
      { id: 'furo', dur: 7, title: 'One hole floods the whole hull', yk: '1 COMPARTMENT, 1 HOLE', act: ['Puncture the hull', '1 compartment'],
        code: ['hole in the single compartment', 'water runs from end to end', 'flooded: 100%', 'floats: no'],
        story: 'A hole near the bow. With no wall at all, the water runs from end to end and fills the whole hull. The ship sinks from <b>one</b> hole. This is the store\'s single pool: one bad flow takes everything.',
        look: 'The hull turns red, the water reaches 100% and the hull sinks on the plate.',
        key: 'With a single compartment, one hole takes the whole ship.',
        f(o, t) { const w = lin(t, 0.8, 4, 0, 1), s = lin(t, 4, 6, 0, 0.6); hullBase(o, false, { 0: w }, s);
          o.cnt = [['FLOODED', Math.round(w * 100) + '%', w ? 'bad' : 'dim'], ['COMPARTMENTS', '1', 'dim'], ['FLOATS', w >= 1 ? 'no' : '…', w >= 1 ? 'bad' : 'dim']];
          o.res = w >= 1 ? [['one hole, the whole ship', 'bad']] : [];
          T(o, [HX + 560, HY + HD + 20, 26], 'hole', 'bad'); } },
      { id: 'seis', dur: 8, title: 'Six compartments: only one floods', yk: '6 COMPARTMENTS, THE SAME HOLE', act: ['Raise the bulkheads', '6 compartments'],
        code: ['hull: 6 compartments', 'hole in compartment 5', 'floods: 1 of 6 = 16.7%', 'the other 5: dry', 'floats: yes'],
        story: 'Now five bulkheads divide the hull into <b>6 compartments</b>. The same hole fills only compartment 5: <b>1 of 6</b>, 16.7% of the hull. The other five stay dry and the ship floats. The wall does not prevent the hole. It prevents the <b>sinking</b>.',
        look: 'The bulkheads rise between the compartments; the water stops at the wall of compartment 5.',
        key: 'The bulkhead does not prevent the hole: it limits how far the water reaches.',
        f(o, t) { const w = lin(t, 2.2, 5, 0, 1); hullBase(o, true, { 4: w });
          for (let k = 0; k < 6; k++) if (k !== 4) o.on['hc' + k] = 2;
          o.cnt = [['FLOODED', w >= 1 ? '16.7%' : Math.round(w * 16.7) + '%', w ? 'bad' : 'dim'], ['COMPARTMENTS', '6', 'dim'], ['FLOATS', 'yes', 'dim']];
          o.res = w >= 1 ? [['1 of 6 flooded, the rest floats', 'acc']] : [['walls rising…', 'dim']];
          T(o, [HCX(4) + CWd / 2, HY + HD + 20, 26], 'hole', 'bad'); } },
      { id: 'pool', dur: 8, title: 'The same idea in the store\'s pool', yk: 'THE STORE\'S HULL',
        code: ['the store\'s hull: 20 connections', 'bulkhead: 16 interactive | 4 batch', 'the report floods its own 4', 'checkout and status: in the 16', 'see the Pool mode'],
        story: 'The store\'s hull is the <b>pool of 20 connections</b> to the <code>pedidos</code> database. The bulkhead sets aside <b>16</b> connections for checkout and order status and <b>4</b> for the 23:00 report. When the report arrives, it fills its own 4, and the customer\'s 16 stay dry.',
        look: 'The report takes the front row (the 4 for batch); checkout and status blink in the 16.',
        key: 'The split pool is a hull with bulkheads.',
        f(o, t) { poolBase(o, 16); const c = cellsOf(o), n = Math.round(lin(t, 0.6, 3, 0, 4)); for (let i = 0; i < n; i++) c[16 + i] = 'r'; blink(o, 0, 5);
          lit(o, 'chk', 'sts', 'pool'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1 };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['BATCH', `${n} of 4`, 'acc'], ['INTERACTIVE', '16 free', 'dim'], ['CUSTOMER 503', '0', 'dim']];
          o.res = [['batch floods only its own', 'acc']]; } },
      { id: 'cano', dur: 9, title: 'And if it goes wrong: a pipe runs through the bulkheads', yk: 'THE HIDDEN CHANNEL', act: ['Run a pipe', 'through all the walls'],
        code: ['6 compartments, 1 pipe on the deck', 'the pipe crosses every wall', 'hole in 5: water enters the pipe', 'and flows into the other 5', 'flooded: 100%  (in the store: estoque)'],
        story: 'The six walls are there, but a pipe runs through all of them. The water from compartment 5 enters the pipe and flows into the other five. With 6 compartments, the hull floods completely. In the store, the pipe is a <b>global dependency</b>: the same <code>estoque</code> for every shard (lesson 3). The article calls this a <b>hidden channel</b>.',
        look: 'The pipe on the deck turns red and the compartments flood one after another.',
        key: 'A wall with a pipe running through it separates nothing.',
        f(o, t) { const w5 = lin(t, 0.6, 2.4, 0, 1), water = { 4: w5 }; [3, 5, 2, 1, 0].forEach((k, i) => { water[k] = lin(t, 2.6 + i * 0.7, 3.6 + i * 0.7, 0, 1); });
          const all = water[0] >= 1, s = lin(t, 6.6, 8, 0, 0.6); hullBase(o, true, water, s);
          o.beams = [{ pts: CAB.cano, tone: w5 >= 1 ? 'bad' : '', on: 1, flow: w5 >= 1 }];
          const n = Object.values(water).filter(v => v > 0.02).length;
          o.cnt = [['FLOODED', `${n} of 6`, n ? 'bad' : 'dim'], ['WALLS', '6 (with a pipe)', 'dim'], ['FLOATS', all ? 'no' : '…', all ? 'bad' : 'dim']];
          o.res = all ? [['6 walls, a single fate', 'bad']] : [];
          T(o, [HX + HW / 2, HY + 40, PL + HH + 34], 'pipe', 'bad'); } },
    ],
    pool: [
      { id: 'normal', dur: 6, title: 'Three flows, one pool of 20 connections', yk: 'LITTLE\'S LAW: L = λ × W',
        code: ['checkout   10/s × 0.020 s = 0.2', 'status     40/s × 0.005 s = 0.2', 'without the report: 0.4 of 20', '  = 2% of the pool', 'full pool: instant 503 (semaphore)'],
        story: 'The <code>pedidos</code> database serves at most <b>20 connections</b> at a time, shared by three flows. <b>Checkout</b> (10/s, ~20 ms) and <b>order status</b> (40/s, ~5 ms, the <i>short polling</i> from Lena\'s app) use, together, <b>0.4</b> connections on average. Almost all are left. In this model, whoever cannot find a connection gets a <code>503</code> right away, with no queue.',
        look: 'The yellow (checkout) and gray (status) chips enter the pool and light one or two cells out of twenty.',
        key: 'Without the report, the customer uses 2% of the pool.',
        f(o) { poolBase(o, 0); blink(o, 0, 5); lit(o, 'chk', 'sts', 'pool');
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['IN USE', '0.4 of 20'], ['503', '0', 'dim'], ['REPORT', 'off', 'dim']];
          o.res = [['pool to spare', 'acc']]; } },
      { id: 'relatorio', dur: 10, title: '23:00: the report asks for 40 connections of 20', yk: 'K6: SINGLE POOL, 25–50 s WINDOW', act: ['Turn on the report', 'single pool'],
        code: ['report    10/s × 4 s = 40 (> 20)', 'checkout:  83 of 250 with 503', 'status:   101 of 1,001 with 503', 'report:   132 with 503, p95 12.0 s', '1 in 3 orders · 1 in 10 status'],
        story: 'At 23:00 the report arrives: <b>10 queries/s of 4 s</b>, or <b>40 connections</b> requested for a pool of 20. All twenty cells fill with 4 s queries, and the customer\'s 5 ms queries find no slot. In k6, in the 25 s to 50 s window: <b>83</b> of the 250 checkout orders and <b>101</b> of the 1,001 status queries got a <code>503</code>.',
        look: 'The report fills the 20 cells; the customer\'s chips hit the full pool and come back red to the 503 stacks.',
        key: 'In the single pool, the report pushes the customer out.',
        f(o, t) { poolBase(o, 0); const n = Math.round(lin(t, 0.4, 2.6, 0, 20)), full = n >= 20, c = cellsOf(o); for (let i = 0; i < n; i++) c[i] = 'r';
          if (!full) blink(o, 18, 19); o.rows.pool.pool.relTone = full ? 'bad' : '';
          const a = Math.round(lin(t, 2.8, 8, 0, 83)), b = Math.round(lin(t, 2.8, 8, 0, 101));
          lit(o, 'rel'); if (full) bad(o, 'pool', 'chk', 'sts'); else lit(o, 'pool', 'chk', 'sts');
          o.rows.rel = act('report', '23:00', ['10/s × 4 s', 'dim'], [`asks: 40 of 20`, full ? 'bad' : 'acc']);
          o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], [`503: ${a} of 250`, a ? 'bad' : 'dim']);
          o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], [`503: ${b} of 1,001`, b ? 'bad' : 'dim']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: full ? 'bad' : '' };
          tokens(o, CAB.chk, 0.6, '', k => full && k % 3 === 0); tokens(o, CAB.sts, 0.35, 'gray', k => full && k % 10 === 0);
          if (a) o.piles.push({ p: [272, 128, PL + 2], v: a, f: a / 83, lab: '503' }); if (b) o.piles.push({ p: [272, 258, PL + 2], v: b, f: b / 101, lab: '503' });
          o.cnt = [['503 IN CHECKOUT', String(a), a ? 'bad' : 'dim'], ['503 IN STATUS', String(b), b ? 'bad' : 'dim'], ['POOL', `${n} of 20`, full ? 'bad' : 'acc']];
          o.res = a >= 83 ? [['1 in 3 orders, 1 in 10 status', 'bad']] : full ? [['full pool…', 'bad']] : []; } },
      { id: 'lena', dur: 7, title: 'Lena\'s order 1054 status hits a 503', yk: 'K6: % OK IN THE WINDOW',
        code: ['checkout   66.8% ok   p95 66 ms', 'status     89.9% ok   p95 15 ms', 'report     47.2% ok   p95 12.0 s', 'before and after the window:', '  all at 100%'],
        story: 'Lena opens the app to check order <b>1054</b>. The query takes 5 ms, but it needs a connection, and all 20 are held by 4 s queries. She gets a <code>503</code>. In the report window, only <b>89.9%</b> of status queries and <b>66.8%</b> of checkout orders went through. Before and after the window, both stayed at 100%: the problem is that the pool belongs to <b>everyone</b> when the report arrives.',
        look: 'The 1054 chip leaves status, hits the full pool and comes back red.',
        key: 'Someone with no fault at all loses the slot.',
        f(o, t) { poolBase(o, 0); const c = cellsOf(o); for (let i = 0; i < 20; i++) c[i] = 'r'; o.rows.pool.pool.relTone = 'bad';
          lit(o, 'rel'); bad(o, 'pool', 'sts'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: 'bad' };
          const f = lin(t, 0.4, 2.2, 0, 1), back = lin(t, 2.2, 3.6, 0, 1);
          if (f < 1) pk(o, CAB.sts, f, '1054', 'gray'); else if (back < 1) pk(o, rev(CAB.sts), back, '503', 'bad');
          o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], [back >= 1 || f >= 1 ? '1054: 503' : '1054: querying…', f >= 1 ? 'bad' : 'acc']);
          o.rows.chk = act('checkout', 'POST', ['66.8% ok', 'bad'], ['83 × 503', 'bad']); bad(o, 'chk');
          o.piles.push({ p: [272, 128, PL + 2], v: 83, f: 1, lab: '503' }, { p: [272, 258, PL + 2], v: 101, f: 1, lab: '503' });
          o.cnt = [['STATUS OK', '89.9%', 'bad'], ['CHECKOUT OK', '66.8%', 'bad'], ['REPORT OK', '47.2%', 'dim']];
          o.res = back >= 1 ? [["Lena's 1054: 503", 'bad']] : [];
          if (back >= 1) T(o, [130, 225, 50], 'Lena: 503', 'bad'); } },
      { id: 'divide', dur: 10, title: '16 + 4: the report stays in its 4', yk: 'K6: POOL 16 + 4, 25–50 s WINDOW', act: ['Split 16 + 4', 'the bulkhead'],
        code: ['interactive 16 · batch 4', 'checkout:   0 × 503, p95 54 ms', 'status:     0 × 503, p95 15 ms', 'report: 215 of 250 with 503', '  14.0% ok, p95 7.4 s'],
        story: 'The bulkhead rises: <b>16</b> connections for checkout and status, <b>4</b> for the report. It still asks for 40, but can only take its own 4. In k6: <b>0</b> <code>503</code> in checkout and status, and the report had <b>215</b> of its 250 queries refused (14.0% ok). The bulkhead did not create capacity. <b>It chose who waits.</b>',
        look: 'The wall rises between the front row and the other four. The report fills its own; the customer\'s chips get through.',
        key: 'With the wall, the customer loses nothing and the batch pays.',
        f(o, t) { poolBase(o, 16); const c = cellsOf(o), n = Math.round(lin(t, 1, 2.5, 0, 4)); for (let i = 0; i < n; i++) c[16 + i] = 'r'; blink(o, 0, 5);
          o.rows.pool.pool.relTone = n >= 4 ? 'bad' : '';
          const r = Math.round(lin(t, 2.8, 8, 0, 215));
          lit(o, 'chk', 'sts', 'pool'); if (n >= 4) bad(o, 'rel'); else lit(o, 'rel');
          o.rows.rel = act('report', '23:00', ['10/s × 4 s', 'dim'], [`503: ${r} of 250`, r ? 'bad' : 'dim']);
          o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], ['503: 0', 'acc']); o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], ['503: 0', 'acc']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: n >= 4 ? 'bad' : '' };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          if (r) o.piles.push({ p: [272, 408, PL + 2], v: r, f: r / 215, lab: '503' });
          o.cnt = [['CUSTOMER 503', '0'], ['REPORT REFUSED', r >= 215 ? '86%' : String(r), r ? 'bad' : 'dim'], ['REPORT P95', '7.4 s', 'dim']];
          o.res = r >= 215 ? [['customer 100%, batch pays', 'acc']] : [['the report fills the 4…', 'dim']];
          if (t > 1.2) T(o, [480, 360, 70], 'bulkhead', 'acc'); } },
      { id: 'little', dur: 7, title: 'Little sizes it: 4 + 4 are enough', yk: 'CONNECTIONS = λ × W × HEADROOM', act: ['Size it', 'λ × W × headroom'],
        code: ['interactive: (0.2 + 0.2) × 10 = 4', 'batch: cap of 4 (the DB can take it)', 'split pool: 4 + 4 = 8', '20 − 8 = 12 go back to the DB', '  (max_connections 100)'],
        story: 'How much to give each compartment? Interactive uses <b>0.4</b> connections; with <b>10×</b> headroom for variability, <b>4</b> is enough. Batch wants 40, but the database can only take a few heavy queries together: a cap of <b>4</b>. That makes <b>4 + 4 = 8</b>, and the other <b>12</b> go back to the database\'s <code>max_connections</code>. Splitting can save connections.',
        look: 'The wall moves down to the second row: 4 customer cells, 4 report cells and 12 dashed, returned to the database.',
        key: 'The size of the compartment comes from a calculation, not a guess.',
        f(o) { poolBase(o, 4); const c = cellsOf(o); for (let i = 0; i < 4; i++) c[4 + i] = 'r'; for (let i = 8; i < 20; i++) c[i] = 'x'; blink(o, 0, 2);
          lit(o, 'chk', 'sts', 'rel', 'pool'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1 };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['INTERACTIVE', '4'], ['BATCH', '4', 'dim'], ['RETURNED', '12', 'dim']];
          o.res = [['4 + 4 = 8; 12 go back to the DB', 'acc']]; } },
      { id: 'lento', dur: 10, title: 'And if it goes wrong: the report gets 10× slower', yk: 'THE PRICE OF THE WALL', act: ['Run the job', '6,000 queries'],
        code: ['batch: 4 connections ÷ 4 s = 1 query/s', 'job: 6,000 queries', '  at 10/s: 10 min (until 23:10)', '  at 1/s: 100 min (until 00:40)', 'batch queues (module 13)'],
        story: 'The wall protects the customer and punishes the batch. With 4 connections and 4 s per query, the report serves <b>1 query/s</b> instead of 10. A job of <b>6,000</b> queries, which took 10 minutes, now takes <b>100</b>: it ends at <b>00:40</b> instead of 23:10. Batch tolerates delay and queues. The better fix is physical: read from the <b>Rio replica</b> (Functional mode).',
        look: 'The queue stack grows next to the report and the job clock runs up to 00:40.',
        key: 'The bulkhead chooses who waits; here, the report.',
        f(o, t) { poolBase(o, 4); const c = cellsOf(o); for (let i = 0; i < 4; i++) c[4 + i] = 'r'; for (let i = 8; i < 20; i++) c[i] = 'x'; blink(o, 0, 2);
          o.rows.pool.pool.relTone = 'bad'; lit(o, 'chk', 'sts', 'pool'); bad(o, 'rel');
          const m = lin(t, 0.6, 8, 0, 100), done = m >= 100, left = Math.round(6000 - m * 60);
          o.rows.rel = act('report', 'QUEUE', ['1 query/s', 'bad'], [`${thou(left)} left`, 'bad']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: 'bad' };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          if (left > 0) o.piles.push({ p: [272, 408, PL + 2], v: left, f: left / 6000, lab: 'queue' });
          o.cnt = [['JOB', `${Math.round(m)} min`, 'bad'], ['CLOCK', hhmm(m), 'dim'], ['REPORT', '1 query/s', 'dim']];
          o.res = done ? [['00:40 instead of 23:10', 'bad']] : [['queueing…', 'dim']];
          if (done) T(o, [130, 360, 50], 'ends 00:40', 'bad'); } },
    ],
    fisico: [
      { id: 'logico', dur: 6, title: 'Logical: compartments inside the process', yk: 'LOGICAL BULKHEADS',
        code: ['connection pool: 16 + 4', 'semaphore: maxConcurrentCalls', 'thread pool: 1 per dependency', 'PgBouncer: default_pool_size', 'Envoy: 1,024 pending per destination'],
        story: '<b>Logical</b> bulkheads split execution resources inside the process: the connection pool (16 + 4), the Resilience4j <b>semaphore</b> (<code>maxConcurrentCalls</code>, no queue, on the caller\'s thread), the Hystrix <b>thread pool</b> per dependency (isolates blocking, costs context switching and a queue), PgBouncer and the Envoy limits. They are cheap: a configuration.',
        look: 'The pedidos pod with its walls on the inside, one per line.',
        key: 'Logical splits threads, connections, queues and limits: it is cheap.',
        f(o) { show(o, 'podL'); lit(o, 'podL');
          o.rows.podL = act('pedidos pod', 'LOGICAL', ['connections: 16 + 4', 'acc'], ['semaphore: maxConcurrentCalls', 'hi'], ['threads: 1 pool per dependency', 'hi'], ['PgBouncer: default_pool_size', 'dim'], ['Envoy: 1,024 per destination', 'dim'], ['node memory: ?', 'bad']);
          o.cnt = [['COST', 'configuration'], ['ISOLATES', 'execution', 'dim'], ['DOES NOT ISOLATE', 'the machine', 'bad']];
          o.res = [['cheap, but lives on a node', 'acc']]; } },
      { id: 'no', dur: 6, title: 'Everything on the same node', yk: 'THE SHARED NODE',
        code: ['node-1: 3 pedidos pods', '      + 1 relatorios pod', 'relatorios: no memory limits', 'each pod with its own thread pool', 'the node\'s memory: shared by all'],
        story: 'Pods run on <b>nodes</b>, the cluster\'s machines. Here, a single floor of the warehouse: <b>3 <code>pedidos</code> pods</b> and the <code>relatorios</code> pod on the same node. Each pod has its own pools, but the <b>node\'s memory</b> is not a pool: it is shared by all. And <code>relatorios</code> has no memory <code>limits</code>.',
        look: 'The four pods on top of the same node; the node\'s memory bar, below, still has room.',
        key: 'The logical compartment sits on top of a resource nobody split.',
        f(o) { show(o, 'nA', 'pp0', 'pp1', 'pp2', 'prel'); o.on.nA = 2; lit(o, 'pp0', 'pp1', 'pp2', 'prel');
          o.rows.nA = act('node-1', 'ONE NODE FOR ALL'); o.rows.nA.mem = { f: 0.35, label: 'node memory' };
          [0, 1, 2].forEach(k => { o.rows['pp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['threads: ok', 'acc'], ['connections: ok', 'dim']); });
          o.rows.prel = podRow('relatorios', 'NO LIMITS', ['memory: free', 'bad'], ['23:00', 'dim']);
          o.cnt = [['NODES', '1'], ['PODS', '4', 'dim'], ['LIMITS ON relatorios', 'none', 'bad']];
          o.res = [['four pods, a single fate', 'dim']]; } },
      { id: 'vaza', dur: 9, title: 'And if it goes wrong: the leak reaches the neighbors', yk: 'SHARED FATE (QUALITATIVE)', act: ['Turn on the leak', 'all on the same node'],
        code: ['relatorios leaks memory', 'the node comes under memory pressure', 'kubelet: node-pressure eviction', 'OOM hits the neighboring pods', 'thread pools: intact'],
        story: '<code>relatorios</code> leaks memory. The node comes under <b>memory pressure</b>, the kubelet starts evicting pods and the OOM killer hits the neighbors: the <code>pedidos</code> pods go down with their thread pools <b>intact</b>. The article calls this <i>shared fate</i>. The resource that ran out was <b>underneath</b> the compartment. Qualitative scenario: it was not run on Kubernetes.',
        look: 'The node\'s memory bar fills up; the pedidos pods turn red one by one.',
        key: 'Logical on a shared node has a hole: the machine.',
        f(o, t) { show(o, 'nA', 'pp0', 'pp1', 'pp2', 'prel'); const m = lin(t, 0.5, 4, 0.35, 1), full = m >= 1, hit = Math.floor(lin(t, 4.2, 6.6, 0, 3.99));
          bad(o, 'prel'); o.on.nA = full ? 'bad' : 2;
          o.rows.nA = act('node-1', full ? 'MEMORY PRESSURE' : 'ONE NODE FOR ALL'); o.rows.nA.mem = { f: m, label: full ? 'node memory: full' : 'node memory', tone: 'bad' };
          [0, 1, 2].forEach(k => { const h = full && k < hit; o.rows['pp' + k] = podRow('pedidos-' + (k + 1), h ? 'EVICTED' : 'POD', ['threads: intact', h ? 'dim' : 'acc'], [h ? 'pod down' : 'connections: ok', h ? 'bad' : 'dim']); if (h) bad(o, 'pp' + k); else lit(o, 'pp' + k); });
          o.rows.prel = podRow('relatorios', 'LEAKING', ['memory: rising', 'bad'], ['no limits', 'bad']);
          o.cnt = [['NODE MEMORY', full ? 'full' : 'rising', 'bad'], ['PEDIDOS HIT', `${full ? hit : 0} of 3`, hit && full ? 'bad' : 'dim'], ['THREAD POOL', 'intact', 'dim']];
          o.res = full && hit >= 3 ? [['shared fate: the neighbor went down too', 'bad']] : [['pressuring the node…', 'bad']]; } },
      { id: 'pools', dur: 6, title: 'Physical: a node pool for each', yk: 'TAINTS AND TOLERATIONS', act: ['Separate the nodes', 'checkout · batch'],
        code: ['checkout node pool: 3 pedidos pods', 'batch node pool: relatorios', 'taint on batch; only batch tolerates it', 'requests and limits on each pod', '  (they set the QoS class)'],
        story: 'The fix is <b>physical</b> and completes the logical one: one <b>node pool</b> for <code>checkout</code> and another for <code>batch</code>, with <i>taints</i> and <i>tolerations</i>, and <code>requests</code> and <code>limits</code> on each pod (which set the QoS class). Now it is a separate machine, not a library setting. It costs nodes.',
        look: 'Two floors in the warehouse: the 3 pedidos pods on one, relatorios on the other.',
        key: 'Physical splits machines: it is expensive and stronger.',
        f(o) { show(o, 'nC', 'nB', 'cp0', 'cp1', 'cp2', 'brel'); o.on.nC = 2; o.on.nB = 2; lit(o, 'cp0', 'cp1', 'cp2', 'brel');
          o.rows.nC = act('checkout pool', 'CUSTOMER NODES'); o.rows.nC.mem = { f: 0.3, label: 'memory' };
          o.rows.nB = act('batch pool', 'TAINT: batch'); o.rows.nB.mem = { f: 0.3, label: 'memory' };
          [0, 1, 2].forEach(k => { o.rows['cp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['limits: yes', 'acc'], ['checkout node', 'dim']); });
          o.rows.brel = podRow('relatorios', 'TOLERATES batch', ['limits: yes', 'acc'], ['batch node', 'dim']);
          o.cnt = [['NODE POOLS', '2'], ['CHECKOUT', '3 pods', 'dim'], ['BATCH', '1 pod', 'dim']];
          o.res = [['separate machines', 'acc']]; } },
      { id: 'vaza2', dur: 8, title: 'The leak again: only batch feels it', yk: 'PHYSICAL HOLDS', act: ['Turn on the leak', 'with two node pools'],
        code: ['relatorios leaks again', 'hits its own limit: OOMKilled', 'pressure only on the batch node', 'pedidos-1, -2, -3: intact', 'the report is late; checkout is not'],
        story: 'The same leak, now with two node pools. <code>relatorios</code> hits its own <code>limit</code> and is killed by OOM; the pressure, if any, stays on the <b>batch</b> node. The three <code>pedidos</code> pods do not even notice. The report runs late, and batch tolerates delay. The customer does not.',
        look: 'Only the batch floor turns red; the checkout floor stays lit.',
        key: 'Physical completes logical: the hole stays on its own floor.',
        f(o, t) { show(o, 'nC', 'nB', 'cp0', 'cp1', 'cp2', 'brel'); const m = lin(t, 0.5, 4, 0.3, 1), full = m >= 1;
          o.on.nC = 2; o.on.nB = full ? 'bad' : 2; lit(o, 'cp0', 'cp1', 'cp2'); bad(o, 'brel');
          o.rows.nC = act('checkout pool', 'CUSTOMER NODES'); o.rows.nC.mem = { f: 0.3, label: 'memory' };
          o.rows.nB = act('batch pool', full ? 'ONLY THIS ONE SUFFERS' : 'TAINT: batch'); o.rows.nB.mem = { f: m, label: full ? 'memory: at the limit' : 'memory', tone: 'bad' };
          [0, 1, 2].forEach(k => { o.rows['cp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['intact', 'acc'], ['checkout node', 'dim']); });
          o.rows.brel = podRow('relatorios', full ? 'OOMKilled' : 'LEAKING', [full ? 'restarts' : 'memory: rising', 'bad'], ['batch node', 'dim']);
          o.cnt = [['PEDIDOS HIT', '0 of 3'], ['relatorios', full ? 'OOMKilled' : 'leaking', 'bad'], ['NODE POOL', 'batch only', 'dim']];
          o.res = full ? [['the hole stayed on the batch floor', 'acc']] : [['leaking…', 'bad']]; } },
    ],
    raio: [
      { id: 'um', dur: 6, title: 'One compartment: radius of 100%', yk: 'RADIUS = FRACTION OF TRAFFIC',
        code: ['N = 1', 'one incident takes down 1 ÷ 1 = 100%', 'availability during the incident: 0%', 'it is the single pool, the hull with no walls'],
        story: 'The <b>blast radius</b> is the fraction of traffic that goes down when a compartment goes down. With <b>one</b> compartment, an incident takes down <b>100%</b>: it is the single pool, the hull with no walls.',
        look: 'A single cell, all red.',
        key: 'With no split, the radius is the whole store.',
        f(o, t) { show(o, 'ncel'); const d = t > 1; o.on.ncel = d ? 'bad' : 2;
          o.rows.ncel = act('compartments', 'N = 1'); o.rows.ncel.cells = { n: 1, bad: d, raio: '100%', disp: '0%' };
          o.cnt = [['RADIUS', d ? '100%' : '…', 'bad'], ['AVAILABILITY', d ? '0%' : '…', 'dim'], ['N', '1', 'dim']];
          o.res = d ? [['one incident, the whole store', 'bad']] : []; } },
      { id: 'tres', dur: 6, title: 'Three compartments: 33.3%', yk: 'THE ARTICLE\'S TABLE, CHECKED', act: ['Go to 3', 'compartments'],
        code: ['N = 3', 'radius: 1 ÷ 3 = 33.3%', 'availability: 66.7%', 'the article rounds: 33% and 66%', 'assumes uniform traffic'],
        story: 'With <b>3</b> compartments of equal traffic, an incident takes down <b>1 ÷ 3 = 33.3%</b> and the store carries on with <b>66.7%</b>. The article rounds to 33% and 66%. The math assumes <b>uniform</b> traffic: each compartment with the same fraction.',
        look: 'Three cells; one turns red and the other two stay lit.',
        key: 'With N equal ones, the radius is 1 ÷ N.',
        f(o, t) { show(o, 'ncel'); const d = t > 1.2; o.on.ncel = 2;
          o.rows.ncel = act('compartments', 'N = 3'); o.rows.ncel.cells = { n: 3, bad: d, raio: '33.3%', disp: '66.7%' };
          o.cnt = [['RADIUS', d ? '33.3%' : '…', 'bad'], ['AVAILABILITY', d ? '66.7%' : '…'], ['N', '3', 'dim']];
          o.res = d ? [['2 of 3 carry on', 'acc']] : []; } },
      { id: 'tabela', dur: 9, title: 'Up to 100: the radius falls to 1%', yk: '1 ÷ N, FROM 5 TO 100', act: ['Go up to 100', '5 · 10 · 20 · 50 · 100'],
        code: ['N =   5  radius 20%  avail. 80%', 'N =  10  radius 10%  avail. 90%', 'N =  20  radius  5%  avail. 95%', 'N =  50  radius  2%  avail. 98%', 'N = 100  radius  1%  avail. 99%'],
        story: 'The table goes on: 5 compartments, 20%; 10, 10%; 20, 5%; 50, 2%; <b>100, 1%</b>. More compartments, smaller incident. The table hides two things: the number of incidents <b>rises</b> with N (1 − 0.999<sup>N</sup>: 0.10% with 1, 4.88% with 50) and the <b>total</b> outage disappears (p<sup>N</sup>).',
        look: 'The cells split up to 100; only one turns red.',
        key: 'The radius falls; the number of small incidents rises.',
        f(o, t) { show(o, 'ncel'); o.on.ncel = 2; const L_ = [[5, '20%', '80%'], [10, '10%', '90%'], [20, '5%', '95%'], [50, '2%', '98%'], [100, '1%', '99%']];
          const [n, r, a] = L_[Math.floor(lin(t, 0.3, 6.5, 0, 4.99))];
          o.rows.ncel = act('compartments', 'N = ' + n); o.rows.ncel.cells = { n, bad: true, raio: r, disp: a };
          o.cnt = [['RADIUS', r, 'bad'], ['AVAILABILITY', a], ['N', String(n), 'dim']];
          o.res = n === 100 ? [['1% per incident', 'acc']] : [['splitting…', 'dim']]; } },
      { id: 'mkt', dur: 7, title: 'mkt-01: the hot shard takes 60%', yk: 'TRAFFIC IS NOT UNIFORM', act: ['Turn on mkt-01', '20 · 20 · 60'],
        code: ['3 shards by cliente_id (module 16)', 'mkt-01 alone: 40% of traffic', 'shard-2 = 20% + 40% = 60%', 'average of the three: 33.3%', 'worst case: 60%'],
        story: 'The 3 <code>pedidos</code> shards do not weigh the same. <code>mkt-01</code> (module 16) lives on <code>shard-2</code>, which carries <b>60%</b> of the traffic; the other two, 20% each. The average of the three is still 33.3%, but when the hot shard goes down, the radius is <b>60%</b>. The radius is the fraction of traffic, not 1 ÷ N.',
        look: 'The width of each shard is its fraction; shard-2, the widest, turns red.',
        key: 'With one huge customer, the worst case rules.',
        f(o, t) { const d = t > 1.6; shards(o, 3, d ? { 2: 'bad' } : { 0: 'on', 1: 'on', 2: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['3 shards', 'dim'], ['mkt-01 → shard-2', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(3), on: 1 }, ...hBranches(3, k => d && k === 2 ? { tone: 'bad' } : { on: 1, flow: k === 2 })];
          o.cnt = [['WORST CASE', d ? '60%' : '…', 'bad'], ['AVERAGE', '33.3%', 'dim'], ['1 ÷ N PROMISED', '33.3%', 'dim']];
          o.res = d ? [['60%, not 33%', 'bad']] : [];
          if (d) T(o, [615, 190, 60], '60% down', 'bad'); } },
      { id: 'dedicado', dur: 7, title: 'The dedicated shard: the worst case falls to 40%', yk: '4 SHARDS: 20 · 20 · 20 · 40', act: ['Give mkt-01 a shard', '4 shards'],
        code: ['dedicated shard for mkt-01', 'fractions: 20 · 20 · 20 · 40', 'worst case: 40% (was 60%)', 'still not 25%', 'efficiency 55.6% (module 16)'],
        story: '<code>mkt-01</code> gets a shard of its own. Now there are <b>4</b>: three for regular customers at 20% and the dedicated one at <b>40%</b>. The worst case falls from 60% to <b>40%</b>, and it is still not 25%: the dedicated one carries a customer that alone weighs 40%.',
        look: 'Four shards; the mkt-01 one, the widest, turns red, and the radius is 40%.',
        key: 'Isolating the biggest customer reduces the worst case.',
        f(o, t) { const d = t > 1.6; shards(o, 4, d ? { 3: 'bad' } : { 0: 'on', 1: 'on', 2: 'on', 3: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['mkt-01 → dedicated', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => d && k === 3 ? { tone: 'bad' } : { on: 1, flow: k === 3 })];
          o.cnt = [['WORST CASE', d ? '40%' : '…', 'bad'], ['BEFORE', '60%', 'dim'], ['SHARDS', '4', 'dim']];
          o.res = d ? [['60% → 40%', 'acc']] : [];
          if (d) T(o, [693, 190, 60], '40% down', 'bad'); } },
      { id: 'estoque', dur: 8, title: 'And if it goes wrong: the global inventory, radius of 100%', yk: 'THE HIDDEN CHANNEL', act: ['Take down estoque', 'the same for all'],
        code: ['4 shards, but all of them call:', '  the same estoque', '  the same pagamentos and Redis', '  the same lb-loja', 'estoque down: radius 100%'],
        story: 'The shards split the database, but all of them call the <b>same</b> <code>estoque</code>, the same <code>pagamentos</code>, the same Redis and the same <code>lb-loja</code>. When <code>estoque</code> goes down, the radius is <b>100%</b>, with 4 shards. It is the pipe running through the bulkheads. The math starts from the shared dependencies, not from the number of shards.',
        look: 'estoque turns red at the bottom, and the four shards turn red with it.',
        key: 'A global one breaks the math: radius of 100%.',
        f(o, t) { const d = t > 1.4, w = Math.floor(lin(t, 1.6, 3.6, 0, 4.99)); const st = {}; for (let k = 0; k < 4; k++) st[k] = d && k < w ? 'bad' : 'on';
          shards(o, 4, st); show(o, 'hsh', 'oglob'); lit(o, 'hsh'); if (d) bad(o, 'oglob'); else lit(o, 'oglob');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['lb-loja: just one', 'bad']);
          o.rows.oglob = act('estoque', d ? 'DOWN' : 'GLOBAL', [d ? 'not answering: all 4 shards stop' : 'the same for all 4 shards', d ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, () => ({ on: 1 })), ...toDeps(4, k => ({ on: !(d && k < w), tone: d && k < w ? 'bad' : '', flow: d && k < w }))];
          o.cnt = [['RADIUS', d && w >= 4 ? '100%' : '…', 'bad'], ['SHARDS DOWN', `${d ? Math.min(w, 4) : 0} of 4`, 'bad'], ['1 ÷ N PROMISED', '25%', 'dim']];
          o.res = d && w >= 4 ? [['4 shards, a single fate', 'bad']] : []; } },
    ],
    funcional: [
      { id: 'funcoes', dur: 6, title: 'Three functions, three profiles', yk: 'BY FUNCTION: THE Y AXIS',
        code: ['pedidos     transactional  p95 ≤ 800 ms', 'relatorios  analytical     the 23:00 one', 'entregas    asynchronous   Kafka', 'each with its own resources', 'Y axis of the cube (module 15)'],
        story: 'The <b>functional</b> bulkhead splits by what the system <b>does</b>, the Y axis of the cube (module 15). The store has three functions with opposite profiles: <code>pedidos</code> is transactional (p95 ≤ 800 ms), <code>relatorios</code> is analytical (the 23:00 report) and <code>entregas</code> is asynchronous, reading the Kafka <code>pedidos</code> topic.',
        look: 'The three functions on the left; the SP primary, the Rio replica and the topic on the right.',
        key: 'Functional cuts by what the system does.',
        f(o) { show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); lit(o, 'fped', 'frel', 'fent'); o.on.fsp = 2;
          o.rows.fped = act('pedidos', 'TRANSACTIONAL', ['p95 ≤ 800 ms', 'dim'], ['writes to the primary', 'dim']);
          o.rows.frel = act('relatorios', 'ANALYTICAL', ['23:00 report', 'dim'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASYNCHRONOUS', ['3 consumers', 'dim'], ['reads from Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMARY', ['pool of 20', 'dim'], ['pedidos writes', 'dim']);
          o.rows.frio = act('pg-rio', 'REPLICA', ['read-only', 'dim'], ['lag 300 ms', 'dim']);
          o.rows.fkaf = act('pedidos topic', 'KAFKA', ['order events', 'dim']);
          o.beams = [{ pts: CAB.fped, on: 1, flow: 1 }, { pts: CAB.frelsp, on: 1 }, { pts: CAB.frelrio }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['FUNCTIONS', '3'], ['PROFILES', 'opposite', 'dim'], ['REPORT READS', 'the primary', 'bad']];
          o.res = [['still need to get the report off the primary', 'dim']]; } },
      { id: 'primario', dur: 7, title: 'The report on the primary', yk: 'THE SAME POOL AS IN POOL MODE',
        code: ['relatorios → pg-sp (primary)', 'asks for 40 connections of 20', 'checkout: 83 of 250 with 503', 'status: 101 of 1,001 with 503', 'the same machine as checkout'],
        story: 'Today the report queries the SP <b>primary</b>, the same database as checkout. This is the Pool mode case: 40 connections requested of 20, and in k6 <b>1 in 3</b> checkout orders and <b>1 in 10</b> status queries get a <code>503</code>. The split by function exists in the code, but not in the database.',
        look: 'The report\'s cable to the primary turns red and so does the primary.',
        key: 'Function separated in the code, machine shared in the database.',
        f(o) { show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); bad(o, 'fsp', 'fped'); lit(o, 'frel', 'fent');
          o.rows.fped = act('pedidos', 'TRANSACTIONAL', ['503: 1 in 3', 'bad'], ['no connection', 'bad']);
          o.rows.frel = act('relatorios', 'ANALYTICAL', ['reads from primary', 'bad'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASYNCHRONOUS', ['3 consumers', 'dim'], ['reads from Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMARY', ['40 of 20 requested', 'bad'], ['full pool', 'bad']);
          o.rows.frio = act('pg-rio', 'REPLICA', ['idle at 23:00', 'dim']);
          o.rows.fkaf = act('pedidos topic', 'KAFKA', ['order events', 'dim']);
          o.beams = [{ pts: CAB.fped, tone: 'bad' }, { pts: CAB.frelsp, tone: 'bad', flow: 1 }, { pts: CAB.frelrio }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['PRIMARY', '40 of 20', 'bad'], ['503 IN CHECKOUT', '33%', 'bad'], ['REPLICA', 'idle', 'dim']];
          o.res = [['the report on the checkout database', 'bad']]; } },
      { id: 'rio', dur: 7, title: 'The report goes to the Rio replica', yk: 'FUNCTIONAL THAT BECOMES PHYSICAL', act: ['Send to Rio', 'replica, lag 300 ms'],
        code: ['relatorios → pg-rio (replica)', 'lag 300 ms: irrelevant for a report', 'primary: 0 heavy queries', '  0% of the write capacity', 'checkout and status: no 503'],
        story: 'The report now reads from the <b>Rio replica</b> (module 17). The <b>300 ms</b> lag does not matter to a report, and the heavy query <b>does not touch the primary</b>: 0 connections and 0% of the write capacity. It is a functional split that became physical: another machine, another disk.',
        look: 'The report\'s cable moves to the replica; the primary lights up again with pedidos only.',
        key: 'The report left the primary so the checkout 503 does not happen.',
        f(o, t) { const d = t > 1.2; show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); lit(o, 'fped', 'frel', 'fent', 'fsp'); if (d) lit(o, 'frio');
          o.rows.fped = act('pedidos', 'TRANSACTIONAL', ['503: 0', 'acc'], ['writes to the primary', 'dim']);
          o.rows.frel = act('relatorios', 'ANALÍTICO', [d ? 'reads from Rio' : 'switching…', 'acc'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASYNCHRONOUS', ['3 consumers', 'dim'], ['reads from Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMARY', ['heavy queries: 0', 'acc'], ['writes only', 'dim']);
          o.rows.frio = act('pg-rio', 'REPLICA', ['23:00 report', 'acc'], ['lag 300 ms', 'dim']);
          o.rows.fkaf = act('pedidos topic', 'KAFKA', ['order events', 'dim']);
          o.beams = [{ pts: CAB.fped, on: 1, flow: 1 }, { pts: CAB.frelsp }, { pts: CAB.frelrio, on: d, flow: d }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['PRIMARY', '0 heavy'], ['RIO LAG', '300 ms', 'dim'], ['503 IN CHECKOUT', '0', 'dim']];
          o.res = d ? [['the primary with pedidos only', 'acc']] : []; } },
      { id: 'lanes', dur: 8, title: 'Priority: the same load in three queues', yk: 'LANES 12 · 6 · 2', act: ['Split into lanes', 'high · normal · low'],
        code: ['20 pedidos workers', 'high 12:   customer checkout', 'normal 6: refunds and partners', 'low 2:     reprocessing', 'burst of low: never past 2'],
        story: 'Inside a function you split too. The <b>20 workers</b> of <code>pedidos</code> become three queues: <b>high 12</b> (customer checkout), <b>normal 6</b> (refunds and partners) and <b>low 2</b> (reprocessing). A burst of low, like the 500/s bot from module 8 or the reconciliation, <b>never goes past 2 workers</b>, and checkout keeps its 12.',
        look: 'The burst enters through the low lane and fills only its 2 cells; the 12 of high stay free for checkout.',
        key: 'Priority: the burst stays in its own lane.',
        f(o, t) { const s = t > 1.6; show(o, 'lanes', 'la', 'ln', 'lb'); lit(o, 'lanes', 'la', 'ln'); if (s) bad(o, 'lb'); else lit(o, 'lb');
          o.rows.lanes = act('workers · 20', 'PEDIDOS'); o.rows.lanes.lanes = { used: [3, 1, s ? 2 : 0], surge: s };
          o.rows.la = act('high', 'CHECKOUT', ['12 workers', 'acc']); o.rows.ln = act('normal', 'REFUNDS', ['6 workers', 'dim']);
          o.rows.lb = act('low', s ? 'BURST' : 'REPROC.', [s ? 'bot 500/s' : '2 workers', s ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.la, on: 1, flow: 1 }, { pts: CAB.ln, on: 1, flow: 1 }, { pts: CAB.lb, on: !s, tone: s ? 'bad' : '', flow: 1 }];
          o.cnt = [['HIGH', '12 for checkout'], ['LOW', s ? '2 of 2 full' : '0 of 2', s ? 'bad' : 'dim'], ['BURST GOES PAST', '2 workers? no', 'dim']];
          o.res = s ? [['the burst stayed at 2 workers', 'acc']] : []; } },
      { id: 'news', dur: 7, title: 'The newsletter on RabbitMQ: delay 0', yk: 'TOPICS SEPARATED BY DOMAIN',
        code: ['newsletter: 50,000 emails (module 13)', '  → RabbitMQ (AMQP)', 'pedidos → pedidos topic (Kafka)', 'entregas: 3 × 40/s = 120/s', 'order delay: 0'],
        story: 'The <b>50,000-email</b> newsletter (module 13) goes through <b>RabbitMQ</b>, separate from the Kafka <code>pedidos</code> topic. The 3 <code>entregas</code> consumers read <b>120 events/s</b> (40 each) and only see order events. The order delay is <b>0</b>. Queues and topics are compartments too.',
        look: 'Two pipelines: pedidos → Kafka → entregas on top, newsletter → RabbitMQ → email below.',
        key: 'Each domain on its own topic: one does not wait for the other.',
        f(o) { show(o, 'fped', 'nnews', 'nkaf', 'nrab', 'nent', 'nmail'); lit(o, 'fped', 'nkaf', 'nent', 'nnews', 'nrab', 'nmail');
          o.rows.fped = act('pedidos', 'PUBLISHES', ['order events', 'dim']);
          o.rows.nnews = act('newsletter', 'MODULE 13', ['50,000 emails', 'dim']);
          o.rows.nkaf = act('pedidos topic', 'KAFKA', ['orders only', 'acc']); o.rows.nrab = act('newsletter queue', 'RABBITMQ', ['50,000 emails', 'dim']);
          o.rows.nent = act('entregas', '3 × 40/s', ['120 events/s', 'dim'], ['delay: 0', 'acc']); o.rows.nmail = act('email sending', 'WORKERS', ['the newsletter', 'dim']);
          o.beams = [{ pts: CAB.nped, on: 1, flow: 1 }, { pts: CAB.nent, on: 1, flow: 1 }, { pts: CAB.nnews, on: 1, flow: 1 }, { pts: CAB.nmail, on: 1, flow: 1 }];
          o.cnt = [['ORDER DELAY', '0 s'], ['ENTREGAS', '120/s', 'dim'], ['NEWSLETTER', 'RabbitMQ', 'dim']];
          o.res = [['two pipelines, nobody waits', 'acc']]; } },
      { id: 'topico', dur: 9, title: 'And if it goes wrong: the newsletter on the orders topic', yk: '50,000 ÷ 120/s', act: ['Put it on the same topic', '50,000 emails'],
        code: ['newsletter → pedidos topic', 'entregas reads 120 events/s', '50,000 ÷ 120 = 417 s ≈ 7 min', 'the orders wait behind', '  the emails'],
        story: 'Someone publishes the newsletter on the <b>same</b> <code>pedidos</code> topic. The 3 <code>entregas</code> consumers read 120 events/s, and the 50,000 emails go in front: the order events wait <b>50,000 ÷ 120 = 417 s</b>, almost 7 minutes. The same topic is the same compartment.',
        look: 'The newsletter cable moves up to Kafka, the stack grows in front of the topic and the delay runs up to 417 s.',
        key: 'The same topic is the same compartment.',
        f(o, t) { show(o, 'fped', 'nnews', 'nkaf', 'nrab', 'nent', 'nmail'); const s = lin(t, 0.8, 7, 0, 417), left = Math.round(50000 - s * 120);
          lit(o, 'fped', 'nnews'); bad(o, 'nkaf', 'nent'); o.on.nrab = 0;
          o.rows.fped = act('pedidos', 'PUBLISHES', ['order events', 'dim'], ['waiting in line', 'bad']);
          o.rows.nnews = act('newsletter', 'WRONG TOPIC', ['50,000 emails', 'bad']);
          o.rows.nkaf = act('pedidos topic', 'KAFKA', ['emails in front', 'bad'], [`${thou(Math.max(0, left))} left`, 'bad']); o.rows.nrab = act('newsletter queue', 'RABBITMQ', ['empty', 'dim']);
          o.rows.nent = act('entregas', '3 × 40/s', ['120 events/s', 'dim'], [`delay: ${Math.round(s)} s`, 'bad']); o.rows.nmail = act('email sending', 'WORKERS', ['stopped', 'dim']);
          o.beams = [{ pts: CAB.nped, on: 1, flow: 1 }, { pts: CAB.nent, tone: 'bad', flow: 1 }, { pts: CAB.nwrong, tone: 'bad', flow: 1 }, { pts: CAB.nnews }, { pts: CAB.nmail }];
          if (left > 0) o.piles.push({ p: [455, 205, PL + 2], v: left, f: left / 50000, lab: 'emails' });
          o.cnt = [['ORDER DELAY', `${Math.round(s)} s`, 'bad'], ['IN FRONT', thou(Math.max(0, left)), 'dim'], ['ENTREGAS', '120/s', 'dim']];
          o.res = s >= 417 ? [['417 s ≈ 7 min of delay', 'bad']] : [['consuming emails…', 'bad']]; } },
    ],
    operacional: [
      { id: 'shards', dur: 6, title: 'By customer: 3 shards by cliente_id', yk: 'BY VOLUME OR CUSTOMER: THE Z AXIS',
        code: ['hash(cliente_id) → 200-slot ring', '3 pedidos shards (module 16)', 'fractions: 20 · 20 · 60', 'mkt-01 (40%) lives on shard-2', 'Z axis of the cube'],
        story: 'The <b>operational</b> bulkhead splits by <b>how much and whose</b>, the Z axis of the cube. <code>lb-loja</code> sends each <code>cliente_id</code> to a point on the 200-slot ring (module 16) and from there to one of the <b>3 shards</b>. <code>mkt-01</code>, alone 40% of the traffic, makes <code>shard-2</code> weigh <b>60%</b>.',
        look: 'The router on top, the three shards below, each as wide as its fraction.',
        key: 'Operational cuts by customer and volume.',
        f(o) { shards(o, 3, { 0: 'on', 1: 'on', 2: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['200-slot ring', 'dim'], ['3 shards', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(3), on: 1 }, ...hBranches(3, () => ({ on: 1 }))];
          o.cnt = [['SHARDS', '3'], ['WORST CASE', '60%', 'bad'], ['mkt-01', '40% of traffic', 'dim']];
          o.res = [['one hot shard', 'dim']]; } },
      { id: 'dedicado', dur: 7, title: 'The dedicated mkt-01 shard', yk: 'THE BIGGEST CUSTOMER IN ITS OWN COMPARTMENT', act: ['Give mkt-01 a shard', '20 · 20 · 20 · 40'],
        code: ['4 shards: 20 · 20 · 20 · 40', 'mkt-01: its own shard', 'worst case: 60% → 40%', 'per-customer rate limit + reservation', '  is also an operational bulkhead'],
        story: '<code>mkt-01</code> gets a shard <b>of its own</b>. The worst case falls from 60% to <b>40%</b> (the math from lesson 3), and the partner\'s burst now fills its own compartment. The per-customer rate limit from module 8, when it comes with a guaranteed reservation for the others, is another form of the same cut.',
        look: 'Four shards; the hash sends mkt-01 only to the widest one, on the right.',
        key: 'The biggest customer gets its own compartment.',
        f(o) { shards(o, 4, { 0: 'on', 1: 'on', 2: 'on', 3: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['200-slot ring', 'dim'], ['mkt-01 → dedicated', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => ({ on: 1, flow: k === 3 }))];
          o.cnt = [['WORST CASE', '40%'], ['BEFORE', '60%', 'dim'], ['SHARDS', '4', 'dim']];
          o.res = [['60% → 40%', 'acc']]; } },
      { id: 'rajada', dur: 7, title: 'The mkt-01 burst stays on its shard', yk: 'THE WHOLE PATH', act: ['Turn on the burst', 'from mkt-01'],
        code: ['mkt-01 burst', 'hash(mkt-01) → always the dedicated one', 'shard-0, -1, -2: do not even notice', 'it truly isolates if the whole path', '  is its own: LB, app, DB, queue'],
        story: '<code>mkt-01</code> fires a burst. The hash sends all of it to the dedicated shard, and the other three do not even notice. With the module 7 <i>round robin</i> the same burst would leak to the whole fleet. The isolation is only real if the shard\'s whole path is its own: load balancer, application, database and queue.',
        look: 'Only the dedicated shard heats up; the three on the left carry on with normal traffic.',
        key: 'The hash routes; the separate resources are what isolate.',
        f(o, t) { const s = t > 1; shards(o, 4, { 0: 'on', 1: 'on', 2: 'on', 3: s ? 'bad' : 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['mkt-01 burst', s ? 'bad' : 'dim'], ['→ dedicated only', 'acc']);
          if (s) o.rows.o43 = act('mkt-01 shard', 'BURST', ['40% of traffic', 'bad'], ['only mkt-01 feels it', 'bad']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => k === 3 && s ? { tone: 'bad', flow: 1 } : { on: 1 })];
          o.cnt = [['SHARDS HIT', s ? '1 of 4' : '0', s ? 'bad' : 'dim'], ['REGULAR CUSTOMERS', 'ok', 'dim'], ['ROUND ROBIN', 'would leak', 'dim']];
          o.res = s ? [['the burst stayed in its compartment', 'acc']] : []; } },
      { id: 'global', dur: 9, title: 'And if it goes wrong: the inventory and the global configuration', yk: 'THE HIDDEN CHANNEL', act: ['Break the configuration', 'the same for all 4'],
        code: ['dedicated shard: its own database', 'but the same estoque', 'and the same global configuration', 'wrong config: all 4 at the same time', '4 boxes, a single fate'],
        story: 'The dedicated shard has its own database, but it keeps calling the <b>same</b> <code>estoque</code> and reading the <b>same global configuration</b>. A wrong configuration, or an <code>estoque</code> saturated by the bot, hits all <b>4 shards</b> at the same time. This is the hidden channel: without separating the whole path, the design has 4 boxes and a single fate.',
        look: 'The global configuration turns red at the bottom and the red climbs to the four shards.',
        key: 'A global dependency links shards that looked isolated.',
        f(o, t) { const d = t > 1.4, w = Math.floor(lin(t, 1.6, 3.6, 0, 4.99)); const st = {}; for (let k = 0; k < 4; k++) st[k] = d && k < w ? 'bad' : 'on';
          shards(o, 4, st); show(o, 'hsh', 'oglob'); if (d) bad(o, 'oglob'); else lit(o, 'oglob'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['config: global', d ? 'bad' : 'dim']);
          o.rows.oglob = act('estoque · configuration', d ? 'WRONG CONFIG' : 'GLOBAL', [d ? 'the wrong config applies to all 4' : 'the same for all 4 shards', d ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, () => ({ on: 1 })),
            ...toDeps(4, k => ({ on: !(d && k < w), tone: d && k < w ? 'bad' : '', flow: d && k < w }))];
          o.cnt = [['SHARDS HIT', `${d ? Math.min(w, 4) : 0} of 4`, 'bad'], ['RADIUS', d && w >= 4 ? '100%' : '…', 'bad'], ['WORST CASE PROMISED', '40%', 'dim']];
          o.res = d && w >= 4 ? [['4 boxes, a single fate', 'bad']] : []; } },
    ],
    referencia: [
      { id: 'seis', dur: 6, title: 'Six designs, six questions', yk: 'THE ARTICLE\'S DESIGNS',
        code: ['priority     what comes first?', 'criticality  what must not fail?', 'type of use  interactive or batch?', 'segment      who shares the fate?', 'hashing      where does the burst land?', 'tenants      what about the noisy neighbor?'],
        story: 'The article closes with six reference designs. Each one answers a different <b>question</b>, splits a different resource and charges a different price. The store uses all six together. Turn them on one at a time and read the price.',
        look: 'Six dark plates, each with its question; on the right, the pod counter.',
        key: 'Six designs, six questions: they are not synonyms.',
        f(o) { refBase(o); o.rows.pods = act('pods', 'IN THE STORE'); o.rows.pods.pods = { n: 10, need: 10 };
          o.cnt = [['DESIGNS', '0 of 6'], ['PODS', '10', 'dim'], ['PRICE', '—', 'dim']];
          o.res = [['turn on one at a time', 'dim']]; } },
      ...['prio', 'crit', 'uso', 'seg', 'hash', 'ten'].map((k, i) => {
        const D = REFD[k];
        const X = {
          prio: { title: 'Priority: checkout before reprocessing', story: 'The workers become lanes: <b>12</b> for checkout, <b>6</b> for refunds and partners, <b>2</b> for reprocessing. Priority changes from moment to moment: it is what gets served <b>first</b> right now. The price is idle capacity in the quiet lanes.', code: ['question: what comes first?', 'in the store: 12 · 6 · 2 workers', 'splits: workers and queues', 'price: idle quiet lanes'] },
          crit: { title: 'Criticality: pagamentos on its own nodes', story: 'Criticality is what <b>must never fail</b>: <code>pagamentos</code>, with card scope and audit, gets its own <b>node pool</b> and network. It belongs to the design, not to the moment. The price is dedicated infrastructure.', code: ['question: what must not fail?', 'in the store: pagamentos (card, auditable)', 'splits: nodes, namespaces, cluster', 'price: dedicated infrastructure'] },
          uso: { title: 'Type of use: interactive × batch', story: 'The 23:00 report and the newsletter get <b>their own</b> queue and workers. Batch can be delayed or <b>paused</b> without touching checkout\'s p95. The price: two pipelines to operate.', code: ['question: interactive or batch?', 'in the store: report and newsletter apart', 'splits: queues, workers, pipeline', 'price: two pipelines to operate'] },
          seg: { title: 'Segment: individuals × partners', story: 'Individual customers and partners (<code>mkt-01</code>, module 8) do not share the fate: each segment has its own pods and pools. The price is planning the capacity of each.', code: ['question: who shares the fate?', 'in the store: individuals × partners (mkt-01)', 'splits: pods and pools per segment', 'price: capacity of each'] },
          hash: { title: 'Consistent hashing: the burst stays on its shard', story: 'The <code>cliente_id</code> lands on a point of the 200-slot ring (module 16), and one customer\'s burst stays <b>on their shard</b>. With the module 7 <i>round robin</i> it would leak to the whole fleet. The price is resharding: when N changes, 25% of keys migrate.', code: ['question: where does the burst land?', 'in the store: cliente_id → 200-slot ring', 'splits: shards', 'price: resharding (25% migrate)'] },
          ten: { title: 'Tenants: reservation and cap for mkt-01', story: 'The <code>mkt-01</code> bot sends <b>500 req/s</b> to <code>catalogo</code> (10 replicas, <b>1,000 req/s</b>): with no compartment, it takes 50% of the fleet. With the <b>100 req/s cap</b>, the other <b>900</b> are guaranteed and the <b>400</b> excess requests get a <code>429</code> in its own compartment.', code: ['mkt-01 bot: 500 req/s', 'catalogo: 1,000 req/s (10 replicas)', 'no cap: 50% of the fleet', 'cap 100: 900 guaranteed to the others', 'excess: 400 req/s with 429'] },
        }[k];
        return { id: k, dur: 6, title: X.title, yk: D.n.toUpperCase(), act: ['Turn on ' + D.n, D.q], code: X.code, story: X.story,
          look: `The "${D.n}" plate lights up with what it splits in the store and the price in red.`,
          key: `${D.n[0].toUpperCase() + D.n.slice(1)}: ${D.q}`,
          f(o) { const set = REF.slice(0, i + 1); refBase(o, set, k);
            o.rows.pods = act('pods', 'IN THE STORE'); o.rows.pods.pods = { n: 10, need: 10 };
            o.cnt = [['DESIGNS', `${i + 1} of 6`], ['PRICE', D.preco, 'bad'], ['SPLITS', D.rec, 'dim']];
            o.res = [[D.loja, 'acc']];
            if (k === 'ten') { o.cnt = [['GUARANTEED', '900 req/s'], ['BOT 429', '400 req/s', 'bad'], ['NO CAP', '50% of the fleet', 'dim']]; o.res = [['the bot pays in its own compartment', 'acc']]; }
          } };
      }),
      { id: 'demais', dur: 8, title: 'And if it goes wrong: too many bulkheads', yk: '3 LANES × 4 SHARDS', act: ['Turn on all six', 'and count the pods'],
        code: ['3 lanes × 4 shards = 12 compartments', 'each with N+1 pods (1 + 1 spare)', '12 × 2 = 24 pods', '10 were enough', 'which real incident does each prevent?'],
        story: 'With everything on, <b>3 lanes</b> across <b>4 shards</b> make <b>12 compartments</b>. Each one needs N+1 pods, one working and one spare: <b>24 pods</b> where <b>10</b> were enough. That is idle capacity and more to watch (saturation per compartment) and operate. Each split reduces the radius and increases the bill. The question is: <b>which real incident</b> does this compartment prevent?',
        look: 'The six plates lit; the pod counter goes from 10 to 24, and the extra 14 turn red.',
        key: 'Each wall reduces the radius and increases the bill.',
        f(o, t) { refBase(o, REF); REF.forEach(k => o.on['r_' + k] = 1); const n = Math.round(lin(t, 0.8, 4.5, 10, 24));
          o.rows.pods = act('pods', n > 10 ? 'IDLE ONES IN RED' : 'IN THE STORE'); o.rows.pods.pods = { n, need: 10 }; if (n >= 24) bad(o, 'pods'); else lit(o, 'pods');
          o.cnt = [['PODS', String(n), n > 10 ? 'bad' : 'acc'], ['COMPARTMENTS', '12', 'dim'], ['WERE ENOUGH', '10', 'dim']];
          o.res = n >= 24 ? [['24 pods where 10 were enough', 'bad']] : [['adding up…', 'dim']]; } },
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
    const y = s1 > 15 ? 13 : s1 > 13 ? 11 : 10;
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  const GRAF = () => theme === 'light' ? '#3f4448' : '#c9cdd0', PAPER = () => theme === 'light' ? '#f6f6f5' : '#141516', EMPTY = () => theme === 'light' ? '#ececeb' : '#17181a';
  const RELC = () => theme === 'light' ? '#5c3a2e' : '#9c7f6c';
  // o pool: 20 casas em 4 colunas × 5 fileiras; a fileira de trás é a 0
  function drawPool(x, u, C, p, W_) {
    const LAB = { c: 'checkout', s: 'status', r: 'report', x: '→ DB' };
    for (let i = 0; i < 20; i++) {
      const v = p.cells[i], col = i % PCOL, row = Math.floor(i / PCOL), X = GX + col * COLW + 2, Y = GY + row * RH + 2, w = COLW - 4, h = RH - 4;
      const fill = v === 'c' ? accC() : v === 's' ? GRAF() : v === 'r' ? (p.relTone === 'bad' ? BAD() : RELC()) : EMPTY();
      if (v === 'x') { x.setLineDash([u(2.5), u(2)]); x.strokeStyle = INK(); x.lineWidth = u(0.8); x.strokeRect(u(X), u(Y), u(w), u(h)); x.setLineDash([]); }
      else { x.fillStyle = fill; x.fillRect(u(X), u(Y), u(w), u(h)); if (!v) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(w), u(h)); } }
      if (v) { x.fillStyle = v === 'x' ? INK() : PAPER(); x.textAlign = 'center'; fitFont(x, u, LAB[v], 10, w - 4); x.fillText(LAB[v], u(X + w / 2), u(Y + h / 2)); x.textAlign = 'left'; }
    }
    const ly = GY + GH + 10; x.textAlign = 'center'; x.fillStyle = toneC('hi');
    const lab = p.split === 16 ? '16 interactive │ 4 batch' : p.split === 4 ? '4 + 4 · 12 returned' : 'single pool · 20 connections';
    fitFont(x, u, lab, 12, W_ - 12); x.fillText(lab, u(W_ / 2), u(ly)); x.textAlign = 'left';
  }
  // um compartimento do casco: a água sobe da frente para trás
  function drawWater(x, u, f, W_, H_) {
    if (!f) return; const h = (H_ - 26) * f, light = theme === 'light';
    x.fillStyle = light ? 'rgba(140,23,14,.22)' : 'rgba(255,90,74,.25)'; x.fillRect(u(3), u(H_ - 3 - h), u(W_ - 6), u(h));
    x.strokeStyle = BAD(); x.lineWidth = u(0.8); for (let y = H_ - 3 - h + 6; y < H_ - 4; y += 9) { x.beginPath();
      for (let X = 4; X <= W_ - 4; X += 2) { const yy = y + Math.sin(X / 5) * 1.4; X === 4 ? x.moveTo(u(X), u(yy)) : x.lineTo(u(X), u(yy)); } x.stroke(); }
  }
  // a barra de memória de um nó, na faixa da frente
  function drawMem(x, u, C, m, W_, H_) {
    const y = H_ - 30, w = W_ - 12; x.fillStyle = EMPTY(); x.fillRect(u(6), u(y), u(w), u(14)); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(6), u(y), u(w), u(14));
    x.fillStyle = m.f >= 1 || (m.tone === 'bad' && m.f > 0.6) ? BAD() : accC(); x.fillRect(u(6), u(y), u(w * clamp(m.f)), u(14));
    x.fillStyle = INK(); fitFont(x, u, m.label, 11, w); x.fillText(m.label, u(6), u(y - 9));
  }
  // a tabela 1 ÷ N: N casas, a primeira cai
  function drawCells(x, u, C, cl, W_, H_) {
    const n = cl.n, top = 28, bot = H_ - 46, aw = W_ - 16, ah = bot - top;
    const cols = n <= 10 ? n : n <= 50 ? 10 : 20, rows = Math.ceil(n / cols), s = Math.min(aw / cols, ah / rows), gap = Math.min(6, s * 0.12);
    const x0 = 8 + (aw - cols * s) / 2, y0 = top + (ah - rows * s) / 2;
    for (let i = 0; i < n; i++) { const X = x0 + (i % cols) * s + gap / 2, Y = y0 + Math.floor(i / cols) * s + gap / 2;
      x.fillStyle = cl.bad && i === 0 ? BAD() : accC(); x.globalAlpha = cl.bad && i === 0 ? 1 : 0.55; x.fillRect(u(X), u(Y), u(s - gap), u(s - gap)); x.globalAlpha = 1; }
    x.textAlign = 'center'; const txt = `radius ${cl.raio} · availability ${cl.disp}`; x.fillStyle = cl.bad ? BAD() : toneC('hi');
    fitFont(x, u, cl.bad ? txt : `${n} compartment${n > 1 ? 's' : ''}`, 18, W_ - 16); x.fillText(cl.bad ? txt : `${n} compartment${n > 1 ? 's' : ''}`, u(W_ / 2), u(H_ - 22)); x.textAlign = 'left';
  }
  // os pods: os primeiros "need" são necessários; o resto, ocioso
  function drawPods(x, u, C, p, W_, H_) {
    const cols = 4, s = (W_ - 16) / cols, top = 30;
    for (let i = 0; i < p.n; i++) { const X = 8 + (i % cols) * s + 3, Y = top + Math.floor(i / cols) * (s * 0.62) + 3, w = s - 6, h = s * 0.62 - 6;
      if (i < p.need) { x.fillStyle = accC(); x.fillRect(u(X), u(Y), u(w), u(h)); }
      else { x.strokeStyle = BAD(); x.lineWidth = u(1); x.strokeRect(u(X), u(Y), u(w), u(h)); } }
    x.textAlign = 'center'; x.fillStyle = p.n > p.need ? BAD() : toneC('hi'); const t = p.n > p.need ? `${p.n} pods · ${p.need} were enough` : `${p.n} pods`;
    fitFont(x, u, t, 13, W_ - 10); x.fillText(t, u(W_ / 2), u(H_ - 14)); x.textAlign = 'left';
  }
  // as lanes: 12 · 6 · 2 casas
  function drawLanes(x, u, C, l, W_, H_) {
    const G = [['high · 12', 12, l.used[0], ''], ['normal · 6', 6, l.used[1], ''], ['low · 2', 2, l.used[2], l.surge ? 'bad' : '']];
    let y = 34; const s = (W_ - 16) / 6;
    G.forEach(([lab, n, used, tn]) => { x.fillStyle = tn === 'bad' ? BAD() : toneC('hi'); fitFont(x, u, lab, 12, W_ - 10); x.fillText(lab, u(8), u(y)); y += 10;
      for (let i = 0; i < n; i++) { const X = 8 + (i % 6) * s + 2, Y = y + Math.floor(i / 6) * (s * 0.7) + 2;
        x.fillStyle = i < used ? (tn === 'bad' ? BAD() : accC()) : EMPTY(); x.fillRect(u(X), u(Y), u(s - 4), u(s * 0.7 - 4));
        if (i >= used) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(s - 4), u(s * 0.7 - 4)); } }
      y += Math.ceil(n / 6) * s * 0.7 + 18; });
    if (l.surge) { x.fillStyle = BAD(); fitFont(x, u, 'low queue: the bot waits', 11, W_ - 10); x.fillText('low queue: the bot waits', u(8), u(H_ - 14)); }
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    if (d.water) drawWater(x, u, d.water, W_, H_);
    head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : cf.s1 > 13 ? 21 : 19;
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke();
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.pool) drawPool(x, u, C, d.pool, W_);
    if (d.mem) drawMem(x, u, C, d.mem, W_, H_);
    if (d.cells) drawCells(x, u, C, d.cells, W_, H_);
    if (d.pods) drawPods(x, u, C, d.pods, W_, H_);
    if (d.lanes) drawLanes(x, u, C, d.lanes, W_, H_);
    cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); const [a, b] = lab.split('\n');
      if (b) { fitFont(x, u, a, 11, W_ - 5); x.fillText(a, u(W_ / 2), u(H_ / 2 - 7)); fitFont(x, u, b, 9, W_ - 5); x.fillText(b, u(W_ / 2), u(H_ / 2 + 8)); }
      else { fitFont(x, u, a, 13, W_ - 5); x.fillText(a, u(W_ / 2), u(H_ / 2)); } x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { if (pl.v <= 0) continue; const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? thou(pl.v) + (pl.lab ? '\n' + pl.lab : '') : '';
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
  const on_ = (c) => c ? ' class="on"' : '';
  const K6 = () => `<table class="h3-sum"><tr><th>k6, 25–50 s</th><th>single pool</th><th>16 + 4</th></tr><tr${on_(sc === 'pool' && step >= 1)}><td>checkout (250)</td><td>66.8% ok · 83 × 503 · p95 66 ms</td><td>100% · 0 × 503 · p95 54 ms</td></tr><tr${on_(sc === 'pool' && step >= 1)}><td>status (~1,000)</td><td>89.9% ok · 101 × 503 · p95 15 ms</td><td>100% · p95 15 ms</td></tr><tr${on_(sc === 'pool' && step >= 3)}><td>report (250)</td><td>47.2% ok · 132 × 503 · p95 12.0 s</td><td>14.0% ok · 215 × 503 · p95 7.4 s</td></tr></table>`;
  const DATA = {
    casco: () => `<li>Bulkhead: the wall that divides the hull into compartments; the analogy comes from the article and from the Azure text ("Bulkhead pattern")</li><li>1 compartment: a hole floods <b>100%</b>; 6 compartments: <b>1 of 6 = 16.7%</b></li><li>The store's hull: the <b>20-connection</b> pool to the <code>pedidos</code> database, split <b>16 + 4</b> in k6</li><li>The pipe: a global dependency (<code>estoque</code>, the configuration) that runs through the walls, the article's "hidden channel"</li>`,
    pool: () => `${K6()}<li>Little (L = λ × W): checkout 10 × 0.02 = <b>0.2</b> · status 40 × 0.005 = <b>0.2</b> · report 10 × 4 = <b>40</b> (> 20)</li><li>Outside the report window, every flow stays at <b>100%</b> in both pools</li><li>Checkout loses more (33%) than status (10%) because k6 arrives at regular intervals: the POST and the report arrive at the same instants</li><li>Lab: <code>loja-pool.js</code> (<code>MODE=shared</code> or <code>bulkhead</code>) and <code>pool.js</code>, k6 v2.3.0, in <code>public/labs/bulkhead/lab/</code></li><li>Sizing: 4 + 4 = 8; batch serves 4 ÷ 4 s = <b>1 query/s</b>; 6,000 queries: 10 min → <b>100 min</b></li>`,
    fisico: () => `<table class="h3-sum"><tr><th>logical</th><th>physical</th></tr><tr${on_(step === 0)}><td>semaphore, thread pool, connections, queues, limits</td><td>nodes, node pools, clusters, zones, regions</td></tr><tr><td>cheap: a configuration</td><td>expensive: machines</td></tr></table><li>Resilience4j: <code>SemaphoreBulkhead</code> (<code>maxConcurrentCalls</code>) and <code>FixedThreadPoolBulkhead</code></li><li>PostgreSQL <code>max_connections</code> 100 (3 reserved for the superuser); Envoy: 1,024 per cluster</li><li>Kubernetes: <i>taints</i> and <i>tolerations</i>, QoS by <code>requests</code> and <code>limits</code>, <i>node-pressure eviction</i></li><li>The <code>relatorios</code> leak is <b>qualitative</b>: it was not run on Kubernetes</li>`,
    raio: () => `<table class="h3-sum"><tr><th>N</th><th>radius</th><th>avail.</th><th>some down (p = 0.1%)</th></tr><tr${on_(step === 0)}><td>1</td><td>100%</td><td>0%</td><td>0.10%</td></tr><tr${on_(step === 1)}><td>3</td><td>33.3%</td><td>66.7%</td><td>0.30%</td></tr><tr><td>10</td><td>10%</td><td>90%</td><td>1.00%</td></tr><tr><td>50</td><td>2%</td><td>98%</td><td>4.88%</td></tr><tr${on_(step === 2)}><td>100</td><td>1%</td><td>99%</td><td>9.52%</td></tr></table><li>With <code>mkt-01</code>: 20 · 20 · 60 → worst case <b>60%</b>; dedicated: 20 · 20 · 20 · 40 → <b>40%</b></li><li>All down at the same time: p<sup>N</sup> = 0.1% (N = 1), 10<sup>−9</sup> (N = 3); each customer stays at 0.1%</li><li>Shuffle sharding, 2 of 10: fixed groups 20%, 45 pairs → <b>2.2%</b></li><li>Global dependencies of the shards: <code>estoque</code>, <code>pagamentos</code>, Redis, <code>lb-loja</code></li>`,
    funcional: () => `<table class="h3-sum"><tr><th>function</th><th>profile</th><th>resource</th></tr><tr${on_(step <= 2)}><td>pedidos</td><td>transactional, p95 ≤ 800 ms</td><td>SP primary</td></tr><tr${on_(step === 2)}><td>relatorios</td><td>analytical (23:00)</td><td>Rio replica, lag 300 ms</td></tr><tr${on_(step >= 4)}><td>entregas</td><td>asynchronous</td><td>pedidos topic (Kafka)</td></tr></table><li>Priority lanes: <b>12 · 6 · 2</b> of 20 workers</li><li>Newsletter: 50,000 ÷ 120/s (3 consumers × 40/s) = <b>417 s ≈ 7 min</b> if it is on the orders topic; 0 on RabbitMQ</li><li>The report on the replica: 0 connections and 0% of the primary's write capacity</li>`,
    operacional: () => `<table class="h3-sum"><tr><th>cut</th><th>fractions</th><th>worst case</th></tr><tr${on_(step === 0)}><td>3 shards by cliente_id</td><td>20 · 20 · 60</td><td>60%</td></tr><tr${on_(step >= 1 && step <= 2)}><td>+ dedicated mkt-01 shard</td><td>20 · 20 · 20 · 40</td><td>40%</td></tr><tr${on_(step === 3)}><td>global estoque or config</td><td>all 4 together</td><td>100%</td></tr></table><li>Hash of <code>cliente_id</code> on a 200-slot ring (module 16); when N changes, 25% of keys migrate</li><li>The region is also an operational cut (module 26 splits the whole stack)</li><li>Per-customer rate limit with reservation (the 100 req/s cap on <code>mkt-01</code>) is an operational bulkhead</li>`,
    referencia: () => `<table class="h3-sum"><tr><th>design</th><th>splits</th><th>price</th></tr>${REF.map((k, i) => `<tr${on_(step === i + 1)}><td>${REFD[k].n}</td><td>${REFD[k].rec}</td><td>${REFD[k].preco}</td></tr>`).join('')}</table><li>Noisy neighbor: <b>500 req/s</b> bot × <code>catalogo</code> of <b>1,000</b> = 50% of the fleet; cap of <b>100</b>: 900 guaranteed, <b>400</b> with <code>429</code></li><li>Too many bulkheads: 3 lanes × 4 shards = 12 compartments × 2 pods = <b>24</b> (10 were enough)</li><li>The AWS text on App Mesh describes a service discontinued on 09/30/2026: history only</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (furar, ligar, dividir…) e leva até ele
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
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
  function readout() { if (active !== 'anteparas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'anteparas' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-anteparas3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'anteparas') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const ease1 = (v, want, dt, sp) => v + Math.sign(want - v) * Math.min(Math.abs(want - v), dt / sp);
  let shipF = 0, shipSink = 0;
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f = ease1(Bk.f, want, dt, 0.55); Bk.sk = ease1(Bk.sk || 0, o.sink[nm] || 0, dt, 1.2);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], Bk.pos[2] - (1 - e) * (Bk.h + 3) - Bk.sk * Bk.h));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, Bk.pos[2] + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    // o navio: popa e proa sobem com o casco e afundam com ele
    shipF = ease1(shipF, o.ship ? 1 : 0, dt, 0.55); shipSink = ease1(shipSink, o.shipSink || 0, dt, 1.2);
    ship.visible = shipF > 0.01; ship.position.copy(W(0, 0, PL - (1 - ease(clamp(shipF))) * (HH + 9) - shipSink * HH));
    HWALLS.forEach(Wl => { Wl.f = ease1(Wl.f, o.hwalls && shipF > 0.9 ? 1 : 0, dt, 0.7); const e = ease(clamp(Wl.f)); Wl.g.visible = Wl.f > 0.01;
      if (Wl.g.visible) Wl.g.position.copy(W(Wl.x, HY - 5, PL - (1 - e) * (HH + 16) - shipSink * HH)); Wl.mat.emissive.copy(accent); Wl.mat.emissiveIntensity = 0.35 * e; });
    // a antepara do pool sobe entre as fileiras (e desliza quando muda de 16 | 4 para 4 | 4)
    const pool = B.pool, ptop = PL + pool.h;
    PWALL.f = ease1(PWALL.f, o.walls && pool.f > 0.9 ? 1 : 0, dt, 0.7); PWALL.row = ease1(PWALL.row, o.wallRow || 4, dt, 0.25);
    { const e = ease(clamp(PWALL.f)); PWALL.g.visible = PWALL.f > 0.01 && pool.g.visible;
      if (PWALL.g.visible) PWALL.g.position.copy(W(PX + GX - 4, PY + GY + PWALL.row * RH - 2.5, ptop - 20 + e * 20)); PWALL.mat.emissive.copy(accent); PWALL.mat.emissiveIntensity = 0.4 * e; }
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn]) => dot(p, tn));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placePiles(o.piles); drawScreen(o);
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
      const [x0, x1, y0, y1] = [24, 880, 20, 446];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = (POSTER ? 0.9 : nar ? 1 : 0.88) * Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); shipF = o.ship ? 1 : 0; HWALLS.forEach(Wl => { Wl.f = o.hwalls ? 1 : 0; });
    PWALL.f = o.walls ? 1 : 0; PWALL.row = o.wallRow || 4; }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–7 · drag to rotate' };
})() });
