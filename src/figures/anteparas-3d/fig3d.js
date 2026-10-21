// Figura 3D (iso-glow): o casco da loja. Um navio em corte com anteparas (a analogia, uma vez) e o pool de 20 conexões do banco
// do pedidos como um casco de 20 compartimentos (4 × 5 casas; a antepara sobe entre as 16 do interativo e as 4 do batch).
// Fichas: checkout em amarelo-sódio (a cor de destaque), status do pedido em grafite, o relatório das 23:00 grande e lento.
// Os nós aparecem como andares de um galpão, com os pods em cima. Atrás, o mostrador (três números do passo, a conta e o resultado).
// Cenários (botões e ?mode=casco|pool|fisico|raio|funcional|operacional|referencia; ?step=N abre no passo N).
// Dados: docs/escrita/bulkhead-brief.md e as aulas 1 a 5 (Little 0,2 + 0,2 + 40 > 20; k6 v2.3.0 na janela 25–50 s: pool único
// 83 e 101 × 503 (66,8% e 89,9% ok), relatório 47,2% ok, p95 12,0 s; 16 + 4: 0 × 503, relatório 14,0% ok, 215 × 503, p95 7,4 s;
// 4 + 4 e 12 devolvidas; 1 consulta/s, 10 → 100 min; raio 1 ÷ N, 20 · 20 · 60 e 20 · 20 · 20 · 40, estoque 100%;
// réplica do Rio (lag 300 ms); lanes 12 · 6 · 2; newsletter 50.000 ÷ 120/s = 417 s; teto de 100 req/s, 900 garantidos, 400 com 429;
// 3 lanes × 4 shards = 12 compartimentos, × 2 = 24 pods onde 10 bastavam). O vazamento do relatorios (físico) é qualitativo.
FIGS3D.push({ id: 'anteparas', name: 'Anteparas', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const hhmm = m => { const t = (23 * 60 + Math.round(m)) % 1440; return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['casco', 'pool', 'fisico', 'raio', 'funcional', 'operacional', 'referencia'];
  const SCNAME = { casco: 'Casco', pool: 'Pool', fisico: 'Físico', raio: 'Raio', funcional: 'Funcional', operacional: 'Operacional', referencia: 'Referência' };
  const SCFULL = { casco: 'O casco e as anteparas', pool: 'O pool de 20 conexões', fisico: 'Lógico e físico: os nós',
    raio: 'O raio de explosão', funcional: 'Bulkhead funcional', operacional: 'Bulkhead operacional', referencia: 'Os seis desenhos de referência' };
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
    o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], ['em uso: 0,2', 'dim']);
    o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], ['em uso: 0,2', 'dim']);
    o.rows.rel = act('relatório', '23:00', ['10/s × 4 s', 'dim'], ['pede: 40', 'dim']);
    o.rows.pool = act('pool · 20 conexões', 'BANCO DO pedidos'); o.rows.pool.pool = { split, cells: Array(20).fill(''), relTone: '' };
    o.rows.bd = act('pg pedidos', 'PRIMÁRIO', ['max_connections', 'dim'], ['100 (97 sem super)', 'dim']);
    o.walls = split ? 1 : 0; o.wallRow = split === 4 ? 1 : 4;
    o.beams = [{ pts: CAB.chk, on: 1 }, { pts: CAB.sts, on: 1 }, { pts: CAB.rel }, { pts: CAB.bd, on: 1 }];
  }
  const cellsOf = o => o.rows.pool.pool.cells;
  // o tráfego do cliente piscando em duas casas livres (0,4 de 20 em uso)
  const blink = (o, a = 0, b = 1) => { const c = cellsOf(o); if ((clk * 2.2) % 1 < 0.55) c[a] = 'c'; if ((clk * 3.1 + 0.4) % 1 < 0.5) c[b] = 's'; };
  // Casco: o navio com 1 ou 6 compartimentos; water = { k: fração }
  function hullBase(o, six, water = {}, sink = 0) {
    o.ship = 1; o.hwalls = six ? 1 : 0;
    if (!six) { show(o, 'h1'); const f = water[0] || 0; o.rows.h1 = act('casco', '1 COMPARTIMENTO', [f ? `água: ${Math.round(f * 100)}%` : 'seco', f ? 'bad' : 'dim']); o.rows.h1.water = f; if (f) bad(o, 'h1'); o.sink.h1 = sink; }
    else for (let k = 0; k < 6; k++) { const nm = 'hc' + k, f = water[k] || 0; show(o, nm);
      o.rows[nm] = act('comp. ' + (k + 1), '', [f ? `água ${Math.round(f * 100)}%` : 'seco', f ? 'bad' : 'dim']); o.rows[nm].water = f; if (f) bad(o, nm); o.sink[nm] = sink; }
    o.shipSink = sink;
  }
  // Raio e Operacional: shards com a fração do tráfego; st[k] = 'bad' derruba o shard k
  function shards(o, n, st = {}, mk = true) {
    const fr = n === 3 ? [20, 20, 60] : [20, 20, 20, 40];
    fr.forEach((p, k) => { const nm = (n === 3 ? 'o3' : 'o4') + k, isMk = mk && k === n - 1; show(o, nm);
      o.rows[nm] = act(n === 4 && k === 3 ? 'shard mkt-01' : 'shard-' + k, st[k] === 'bad' ? 'FORA' : 'PEDIDOS',
        [`${p}% do tráfego`, st[k] === 'bad' ? 'bad' : isMk ? 'acc' : 'dim'], isMk ? [n === 3 ? '+ o mkt-01 (40%)' : 'só o mkt-01', st[k] === 'bad' ? 'bad' : 'acc'] : ['clientes comuns', 'dim']);
      if (st[k] === 'bad') bad(o, nm); else if (st[k] === 'on') lit(o, nm); });
  }
  const routerRows = (...r) => act('lb-loja', 'HASH(cliente_id)', ...r);
  // Físico: um nó ou dois pools de nós; mem = fração de memória ocupada
  const podRow = (nm, meta, ...r) => act(nm, meta, ...r);
  // Referência: o que cada desenho responde, divide e cobra
  const REFD = {
    prio: { n: 'prioridade', q: 'o que vem primeiro?', loja: 'lanes 12 · 6 · 2', rec: 'workers e filas', preco: 'lanes quietas ociosas' },
    crit: { n: 'criticidade', q: 'o que não pode falhar?', loja: 'pagamentos: nós próprios', rec: 'nós, cluster', preco: 'infra dedicada' },
    uso: { n: 'tipo de uso', q: 'interativo ou batch?', loja: 'relatório e newsletter', rec: 'filas, workers', preco: 'duas esteiras' },
    seg: { n: 'segmento', q: 'quem divide o destino?', loja: 'PF × parceiros', rec: 'pods por segmento', preco: 'capacidade de cada um' },
    hash: { n: 'hashing', q: 'onde cai a rajada?', loja: 'anel de 200 pontos', rec: 'shards', preco: 'resharding' },
    ten: { n: 'tenants', q: 'e o vizinho barulhento?', loja: 'mkt-01: teto 100 req/s', rec: 'capacidade por tenant', preco: 'limites a manter' },
  };
  function refBase(o, onSet = [], hot = '') {
    REF.forEach(k => { const nm = 'r_' + k, D = REFD[k], on = onSet.includes(k); show(o, nm);
      o.rows[nm] = on ? act(D.n, k === hot ? 'LIGADO' : 'ON', [D.loja, 'acc'], [D.rec, 'dim'], ['preço: ' + D.preco, k === hot ? 'bad' : 'dim'])
        : act(D.n, '', [D.q, 'dim']);
      if (on) o.on[nm] = k === hot ? 1 : 2; });
    show(o, 'pods');
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    casco: [
      { id: 'casco', dur: 5, title: 'Um casco sem anteparas', yk: 'O NAVIO EM CORTE',
        code: ['casco: 1 compartimento', 'furo: nenhum', 'flutua: sim', 'antepara (bulkhead) = parede', '  que divide o casco'],
        story: 'Um navio em corte, visto de cima. Este casco tem <b>um compartimento só</b>, da popa à proa, sem nenhuma parede no meio. Enquanto o casco está inteiro, ele flutua. É a única vez que o navio aparece no módulo: ele empresta a palavra <i>bulkhead</i> (antepara).',
        look: 'O casco inteiro é um bloco só. Nos próximos passos, um furo e depois as paredes.',
        key: 'Sem paredes, o casco inteiro é um compartimento.',
        f(o) { hullBase(o, false); o.on.h1 = 2;
          o.cnt = [['COMPARTIMENTOS', '1'], ['ALAGADO', '0%', 'dim'], ['FLUTUA', 'sim', 'dim']];
          o.res = [['casco inteiro, seco', 'acc']]; } },
      { id: 'furo', dur: 7, title: 'Um furo alaga o casco inteiro', yk: '1 COMPARTIMENTO, 1 FURO', act: ['Furar o casco', '1 compartimento'],
        code: ['furo no compartimento único', 'a água corre de ponta a ponta', 'alagado: 100%', 'flutua: não'],
        story: 'Um furo perto da proa. Como não há parede nenhuma, a água corre de ponta a ponta e enche o casco inteiro. O navio afunda por <b>um</b> furo. É o pool único da loja: um fluxo ruim ocupa tudo.',
        look: 'O casco fica vermelho, a água chega a 100% e o casco afunda na prancha.',
        key: 'Com um compartimento só, um furo leva o navio inteiro.',
        f(o, t) { const w = lin(t, 0.8, 4, 0, 1), s = lin(t, 4, 6, 0, 0.6); hullBase(o, false, { 0: w }, s);
          o.cnt = [['ALAGADO', Math.round(w * 100) + '%', w ? 'bad' : 'dim'], ['COMPARTIMENTOS', '1', 'dim'], ['FLUTUA', w >= 1 ? 'não' : '…', w >= 1 ? 'bad' : 'dim']];
          o.res = w >= 1 ? [['um furo, o navio inteiro', 'bad']] : [];
          T(o, [HX + 560, HY + HD + 20, 26], 'furo', 'bad'); } },
      { id: 'seis', dur: 8, title: 'Seis compartimentos: só um alaga', yk: '6 COMPARTIMENTOS, O MESMO FURO', act: ['Subir as anteparas', '6 compartimentos'],
        code: ['casco: 6 compartimentos', 'furo no compartimento 5', 'alaga: 1 de 6 = 16,7%', 'os outros 5: secos', 'flutua: sim'],
        story: 'Agora cinco anteparas dividem o casco em <b>6 compartimentos</b>. O mesmo furo enche só o compartimento 5: <b>1 de 6</b>, 16,7% do casco. Os outros cinco continuam secos e o navio flutua. A parede não impede o furo. Impede o <b>naufrágio</b>.',
        look: 'As anteparas sobem entre os compartimentos; a água para na parede do compartimento 5.',
        key: 'A antepara não evita o furo: limita até onde a água chega.',
        f(o, t) { const w = lin(t, 2.2, 5, 0, 1); hullBase(o, true, { 4: w });
          for (let k = 0; k < 6; k++) if (k !== 4) o.on['hc' + k] = 2;
          o.cnt = [['ALAGADO', w >= 1 ? '16,7%' : Math.round(w * 16.7) + '%', w ? 'bad' : 'dim'], ['COMPARTIMENTOS', '6', 'dim'], ['FLUTUA', 'sim', 'dim']];
          o.res = w >= 1 ? [['1 de 6 alagado, o resto flutua', 'acc']] : [['paredes subindo…', 'dim']];
          T(o, [HCX(4) + CWd / 2, HY + HD + 20, 26], 'furo', 'bad'); } },
      { id: 'pool', dur: 8, title: 'A mesma ideia no pool da loja', yk: 'O CASCO DA LOJA',
        code: ['o casco da loja: 20 conexões', 'antepara: 16 interativo | 4 batch', 'o relatório alaga os 4 dele', 'checkout e status: nas 16', 'veja o modo Pool'],
        story: 'O casco da loja é o <b>pool de 20 conexões</b> ao banco do <code>pedidos</code>. A antepara separa <b>16</b> conexões para o checkout e o status do pedido e <b>4</b> para o relatório das 23:00. Quando o relatório chega, ele enche as 4 dele, e as 16 do cliente continuam secas.',
        look: 'O relatório ocupa a fileira da frente (as 4 do batch); o checkout e o status piscam nas 16.',
        key: 'O pool dividido é um casco com anteparas.',
        f(o, t) { poolBase(o, 16); const c = cellsOf(o), n = Math.round(lin(t, 0.6, 3, 0, 4)); for (let i = 0; i < n; i++) c[16 + i] = 'r'; blink(o, 0, 5);
          lit(o, 'chk', 'sts', 'pool'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1 };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['BATCH', `${n} de 4`, 'acc'], ['INTERATIVO', '16 livres', 'dim'], ['503 DO CLIENTE', '0', 'dim']];
          o.res = [['o batch alaga só o dele', 'acc']]; } },
      { id: 'cano', dur: 9, title: 'E se der errado: um cano atravessa as anteparas', yk: 'O CANAL OCULTO', act: ['Passar um cano', 'por todas as paredes'],
        code: ['6 compartimentos, 1 cano no convés', 'o cano passa por todas as paredes', 'furo no 5: a água entra no cano', 'e desce nos outros 5', 'alagado: 100%  (na loja: o estoque)'],
        story: 'As seis paredes estão lá, mas um cano atravessa todas elas. A água do compartimento 5 entra no cano e desce nos outros cinco. Com 6 compartimentos, o casco alaga inteiro. Na loja, o cano é uma <b>dependência global</b>: o mesmo <code>estoque</code> para todos os shards (aula 3). O artigo chama isso de <b>canal oculto</b>.',
        look: 'O cano no convés fica vermelho e os compartimentos alagam um depois do outro.',
        key: 'Uma parede com um cano passando não separa nada.',
        f(o, t) { const w5 = lin(t, 0.6, 2.4, 0, 1), water = { 4: w5 }; [3, 5, 2, 1, 0].forEach((k, i) => { water[k] = lin(t, 2.6 + i * 0.7, 3.6 + i * 0.7, 0, 1); });
          const all = water[0] >= 1, s = lin(t, 6.6, 8, 0, 0.6); hullBase(o, true, water, s);
          o.beams = [{ pts: CAB.cano, tone: w5 >= 1 ? 'bad' : '', on: 1, flow: w5 >= 1 }];
          const n = Object.values(water).filter(v => v > 0.02).length;
          o.cnt = [['ALAGADOS', `${n} de 6`, n ? 'bad' : 'dim'], ['PAREDES', '6 (com cano)', 'dim'], ['FLUTUA', all ? 'não' : '…', all ? 'bad' : 'dim']];
          o.res = all ? [['6 paredes, um destino só', 'bad']] : [];
          T(o, [HX + HW / 2, HY + 40, PL + HH + 34], 'cano', 'bad'); } },
    ],
    pool: [
      { id: 'normal', dur: 6, title: 'Três fluxos, um pool de 20 conexões', yk: 'LEI DE LITTLE: L = λ × W',
        code: ['checkout   10/s × 0,020 s = 0,2', 'status     40/s × 0,005 s = 0,2', 'sem o relatório: 0,4 de 20', '  = 2% do pool', 'pool cheio: 503 na hora (semáforo)'],
        story: 'O banco do <code>pedidos</code> atende no máximo <b>20 conexões</b> por vez, divididas por três fluxos. O <b>checkout</b> (10/s, ~20 ms) e o <b>status do pedido</b> (40/s, ~5 ms, o <i>short polling</i> do app da Lena) usam, juntos, <b>0,4</b> conexão em média. Sobram quase todas. Neste modelo, quem não acha conexão recebe <code>503</code> na hora, sem fila.',
        look: 'As fichas amarelas (checkout) e cinza (status) entram no pool e acendem uma ou duas casas de vinte.',
        key: 'Sem o relatório, o cliente usa 2% do pool.',
        f(o) { poolBase(o, 0); blink(o, 0, 5); lit(o, 'chk', 'sts', 'pool');
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['EM USO', '0,4 de 20'], ['503', '0', 'dim'], ['RELATÓRIO', 'desligado', 'dim']];
          o.res = [['sobra pool', 'acc']]; } },
      { id: 'relatorio', dur: 10, title: '23:00: o relatório pede 40 conexões de 20', yk: 'O K6: POOL ÚNICO, JANELA 25–50 s', act: ['Ligar o relatório', 'pool único'],
        code: ['relatório  10/s × 4 s = 40 (> 20)', 'checkout:  83 de 250 com 503', 'status:   101 de 1.001 com 503', 'relatório: 132 com 503, p95 12,0 s', '1 em 3 pedidos · 1 em 10 status'],
        story: 'Às 23:00 o relatório chega: <b>10 consultas/s de 4 s</b>, ou <b>40 conexões</b> pedidas para um pool de 20. As vinte casas se enchem de consultas de 4 s, e as de 5 ms do cliente não acham vaga. No k6, na janela de 25 s a 50 s: <b>83</b> dos 250 pedidos do checkout e <b>101</b> das 1.001 consultas de status receberam <code>503</code>.',
        look: 'O relatório enche as 20 casas; as fichas do cliente batem no pool cheio e voltam vermelhas para as pilhas de 503.',
        key: 'No pool único, o relatório expulsa o cliente.',
        f(o, t) { poolBase(o, 0); const n = Math.round(lin(t, 0.4, 2.6, 0, 20)), full = n >= 20, c = cellsOf(o); for (let i = 0; i < n; i++) c[i] = 'r';
          if (!full) blink(o, 18, 19); o.rows.pool.pool.relTone = full ? 'bad' : '';
          const a = Math.round(lin(t, 2.8, 8, 0, 83)), b = Math.round(lin(t, 2.8, 8, 0, 101));
          lit(o, 'rel'); if (full) bad(o, 'pool', 'chk', 'sts'); else lit(o, 'pool', 'chk', 'sts');
          o.rows.rel = act('relatório', '23:00', ['10/s × 4 s', 'dim'], [`pede: 40 de 20`, full ? 'bad' : 'acc']);
          o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], [`503: ${a} de 250`, a ? 'bad' : 'dim']);
          o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], [`503: ${b} de 1.001`, b ? 'bad' : 'dim']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: full ? 'bad' : '' };
          tokens(o, CAB.chk, 0.6, '', k => full && k % 3 === 0); tokens(o, CAB.sts, 0.35, 'gray', k => full && k % 10 === 0);
          if (a) o.piles.push({ p: [272, 128, PL + 2], v: a, f: a / 83, lab: '503' }); if (b) o.piles.push({ p: [272, 258, PL + 2], v: b, f: b / 101, lab: '503' });
          o.cnt = [['503 NO CHECKOUT', String(a), a ? 'bad' : 'dim'], ['503 NO STATUS', String(b), b ? 'bad' : 'dim'], ['POOL', `${n} de 20`, full ? 'bad' : 'acc']];
          o.res = a >= 83 ? [['1 em 3 pedidos, 1 em 10 status', 'bad']] : full ? [['pool cheio…', 'bad']] : []; } },
      { id: 'lena', dur: 7, title: 'O status do 1054 da Lena bate em 503', yk: 'O K6: % OK NA JANELA',
        code: ['checkout   66,8% ok   p95 66 ms', 'status     89,9% ok   p95 15 ms', 'relatório  47,2% ok   p95 12,0 s', 'antes e depois da janela:', '  todos em 100%'],
        story: 'A Lena abre o app para ver o pedido <b>1054</b>. A consulta leva 5 ms, mas precisa de uma conexão, e as 20 estão presas por consultas de 4 s. Ela recebe <code>503</code>. Na janela do relatório, só <b>89,9%</b> das consultas de status e <b>66,8%</b> dos pedidos do checkout passaram. Antes e depois da janela, os dois ficaram em 100%: o problema é o pool ser <b>de todo mundo</b> quando o relatório chega.',
        look: 'A ficha do 1054 sai do status, bate no pool cheio e volta vermelha.',
        key: 'Quem não tem culpa nenhuma perde a vaga.',
        f(o, t) { poolBase(o, 0); const c = cellsOf(o); for (let i = 0; i < 20; i++) c[i] = 'r'; o.rows.pool.pool.relTone = 'bad';
          lit(o, 'rel'); bad(o, 'pool', 'sts'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: 'bad' };
          const f = lin(t, 0.4, 2.2, 0, 1), back = lin(t, 2.2, 3.6, 0, 1);
          if (f < 1) pk(o, CAB.sts, f, '1054', 'gray'); else if (back < 1) pk(o, rev(CAB.sts), back, '503', 'bad');
          o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], [back >= 1 || f >= 1 ? '1054: 503' : '1054: consultando…', f >= 1 ? 'bad' : 'acc']);
          o.rows.chk = act('checkout', 'POST', ['66,8% ok', 'bad'], ['83 × 503', 'bad']); bad(o, 'chk');
          o.piles.push({ p: [272, 128, PL + 2], v: 83, f: 1, lab: '503' }, { p: [272, 258, PL + 2], v: 101, f: 1, lab: '503' });
          o.cnt = [['STATUS OK', '89,9%', 'bad'], ['CHECKOUT OK', '66,8%', 'bad'], ['RELATÓRIO OK', '47,2%', 'dim']];
          o.res = back >= 1 ? [['o 1054 da Lena: 503', 'bad']] : [];
          if (back >= 1) T(o, [130, 225, 50], 'Lena: 503', 'bad'); } },
      { id: 'divide', dur: 10, title: '16 + 4: o relatório fica nos 4 dele', yk: 'O K6: POOL 16 + 4, JANELA 25–50 s', act: ['Dividir 16 + 4', 'a antepara'],
        code: ['interativo 16 · batch 4', 'checkout:   0 × 503, p95 54 ms', 'status:     0 × 503, p95 15 ms', 'relatório: 215 de 250 com 503', '  14,0% ok, p95 7,4 s'],
        story: 'A antepara sobe: <b>16</b> conexões para o checkout e o status, <b>4</b> para o relatório. Ele continua pedindo 40, mas só consegue ocupar as 4 dele. No k6: <b>0</b> <code>503</code> no checkout e no status, e o relatório teve <b>215</b> das 250 consultas recusadas (14,0% ok). O bulkhead não criou capacidade. <b>Escolheu quem espera.</b>',
        look: 'A parede sobe entre a fileira da frente e as outras quatro. O relatório enche a dele; as fichas do cliente passam.',
        key: 'Com a parede, o cliente não perde nada e o batch paga.',
        f(o, t) { poolBase(o, 16); const c = cellsOf(o), n = Math.round(lin(t, 1, 2.5, 0, 4)); for (let i = 0; i < n; i++) c[16 + i] = 'r'; blink(o, 0, 5);
          o.rows.pool.pool.relTone = n >= 4 ? 'bad' : '';
          const r = Math.round(lin(t, 2.8, 8, 0, 215));
          lit(o, 'chk', 'sts', 'pool'); if (n >= 4) bad(o, 'rel'); else lit(o, 'rel');
          o.rows.rel = act('relatório', '23:00', ['10/s × 4 s', 'dim'], [`503: ${r} de 250`, r ? 'bad' : 'dim']);
          o.rows.chk = act('checkout', 'POST', ['10/s × 20 ms', 'dim'], ['503: 0', 'acc']); o.rows.sts = act('status 1054', 'GET · LENA', ['40/s × 5 ms', 'dim'], ['503: 0', 'acc']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: n >= 4 ? 'bad' : '' };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          if (r) o.piles.push({ p: [272, 408, PL + 2], v: r, f: r / 215, lab: '503' });
          o.cnt = [['503 DO CLIENTE', '0'], ['RELATÓRIO RECUSADO', r >= 215 ? '86%' : String(r), r ? 'bad' : 'dim'], ['RELATÓRIO P95', '7,4 s', 'dim']];
          o.res = r >= 215 ? [['cliente 100%, o batch paga', 'acc']] : [['o relatório enche os 4…', 'dim']];
          if (t > 1.2) T(o, [480, 360, 70], 'antepara', 'acc'); } },
      { id: 'little', dur: 7, title: 'Little dimensiona: 4 + 4 bastam', yk: 'CONEXÕES = λ × W × FOLGA', act: ['Dimensionar', 'λ × W × folga'],
        code: ['interativo: (0,2 + 0,2) × 10 = 4', 'batch: teto de 4 (o banco aguenta)', 'pool dividido: 4 + 4 = 8', '20 − 8 = 12 voltam ao banco', '  (max_connections 100)'],
        story: 'Quanto dar a cada compartimento? O interativo usa <b>0,4</b> conexão; com folga de <b>10×</b> para a variabilidade, bastam <b>4</b>. O batch quer 40, mas o banco só aguenta algumas consultas pesadas juntas: um teto de <b>4</b>. São <b>4 + 4 = 8</b>, e as outras <b>12</b> voltam para o <code>max_connections</code> do banco. Dividir pode economizar conexões.',
        look: 'A parede desce para a segunda fileira: 4 casas do cliente, 4 do relatório e 12 tracejadas, devolvidas ao banco.',
        key: 'O tamanho do compartimento sai de uma conta, não de um palpite.',
        f(o) { poolBase(o, 4); const c = cellsOf(o); for (let i = 0; i < 4; i++) c[4 + i] = 'r'; for (let i = 8; i < 20; i++) c[i] = 'x'; blink(o, 0, 2);
          lit(o, 'chk', 'sts', 'rel', 'pool'); o.beams[2] = { pts: CAB.rel, on: 1, flow: 1 };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          o.cnt = [['INTERATIVO', '4'], ['BATCH', '4', 'dim'], ['DEVOLVIDAS', '12', 'dim']];
          o.res = [['4 + 4 = 8; 12 voltam ao banco', 'acc']]; } },
      { id: 'lento', dur: 10, title: 'E se der errado: o relatório fica 10× mais lento', yk: 'O PREÇO DA PAREDE', act: ['Rodar o job', '6.000 consultas'],
        code: ['batch: 4 conexões ÷ 4 s = 1 consulta/s', 'job: 6.000 consultas', '  a 10/s: 10 min (até 23:10)', '  a 1/s: 100 min (até 00:40)', 'o batch enfileira (módulo 13)'],
        story: 'A parede protege o cliente e castiga o batch. Com 4 conexões e 4 s por consulta, o relatório atende <b>1 consulta/s</b> em vez de 10. Um job de <b>6.000</b> consultas, que levava 10 minutos, passa a levar <b>100</b>: termina às <b>00:40</b> em vez de 23:10. O batch tolera atraso e enfileira. O conserto melhor é físico: ler da <b>réplica do Rio</b> (modo Funcional).',
        look: 'A pilha da fila cresce ao lado do relatório e o relógio do job corre até 00:40.',
        key: 'O bulkhead escolhe quem espera; aqui, o relatório.',
        f(o, t) { poolBase(o, 4); const c = cellsOf(o); for (let i = 0; i < 4; i++) c[4 + i] = 'r'; for (let i = 8; i < 20; i++) c[i] = 'x'; blink(o, 0, 2);
          o.rows.pool.pool.relTone = 'bad'; lit(o, 'chk', 'sts', 'pool'); bad(o, 'rel');
          const m = lin(t, 0.6, 8, 0, 100), done = m >= 100, left = Math.round(6000 - m * 60);
          o.rows.rel = act('relatório', 'FILA', ['1 consulta/s', 'bad'], [`faltam ${thou(left)}`, 'bad']);
          o.beams[2] = { pts: CAB.rel, on: 1, flow: 1, tone: 'bad' };
          tokens(o, CAB.chk, 0.6, ''); tokens(o, CAB.sts, 0.35, 'gray');
          if (left > 0) o.piles.push({ p: [272, 408, PL + 2], v: left, f: left / 6000, lab: 'fila' });
          o.cnt = [['JOB', `${Math.round(m)} min`, 'bad'], ['RELÓGIO', hhmm(m), 'dim'], ['RELATÓRIO', '1 consulta/s', 'dim']];
          o.res = done ? [['00:40 em vez de 23:10', 'bad']] : [['enfileirando…', 'dim']];
          if (done) T(o, [130, 360, 50], 'termina 00:40', 'bad'); } },
    ],
    fisico: [
      { id: 'logico', dur: 6, title: 'Lógico: compartimentos dentro do processo', yk: 'BULKHEADS LÓGICOS',
        code: ['pool de conexões: 16 + 4', 'semáforo: maxConcurrentCalls', 'pool de threads: 1 por dependência', 'PgBouncer: default_pool_size', 'Envoy: 1.024 pendentes por destino'],
        story: 'Os bulkheads <b>lógicos</b> dividem recursos de execução dentro do processo: o pool de conexões (16 + 4), o <b>semáforo</b> do Resilience4j (<code>maxConcurrentCalls</code>, sem fila, na thread de quem chama), o <b>pool de threads</b> por dependência do Hystrix (isola o bloqueio, custa troca de contexto e fila), o PgBouncer e os limites do Envoy. São baratos: uma configuração.',
        look: 'O pod do pedidos com as suas paredes por dentro, uma por linha.',
        key: 'Lógico divide threads, conexões, filas e limites: é barato.',
        f(o) { show(o, 'podL'); lit(o, 'podL');
          o.rows.podL = act('pod pedidos', 'LÓGICO', ['conexões: 16 + 4', 'acc'], ['semáforo: maxConcurrentCalls', 'hi'], ['threads: 1 pool por dependência', 'hi'], ['PgBouncer: default_pool_size', 'dim'], ['Envoy: 1.024 por destino', 'dim'], ['memória do nó: ?', 'bad']);
          o.cnt = [['CUSTO', 'configuração'], ['ISOLA', 'execução', 'dim'], ['NÃO ISOLA', 'a máquina', 'bad']];
          o.res = [['barato, mas mora num nó', 'acc']]; } },
      { id: 'no', dur: 6, title: 'Tudo no mesmo nó', yk: 'O NÓ COMPARTILHADO',
        code: ['nó-1: 3 pods do pedidos', '      + 1 pod do relatorios', 'relatorios: sem limits de memória', 'cada pod com seu pool de threads', 'a memória do nó: de todos'],
        story: 'Os pods rodam em <b>nós</b>, as máquinas do cluster. Aqui, um andar só do galpão: <b>3 pods do <code>pedidos</code></b> e o pod do <code>relatorios</code> no mesmo nó. Cada pod tem os seus pools, mas a <b>memória do nó</b> não é um pool: é de todos. E o <code>relatorios</code> está sem <code>limits</code> de memória.',
        look: 'Os quatro pods em cima do mesmo nó; a barra de memória do nó, embaixo, ainda folgada.',
        key: 'O compartimento lógico mora em cima de um recurso que ninguém dividiu.',
        f(o) { show(o, 'nA', 'pp0', 'pp1', 'pp2', 'prel'); o.on.nA = 2; lit(o, 'pp0', 'pp1', 'pp2', 'prel');
          o.rows.nA = act('nó-1', 'UM NÓ PARA TUDO'); o.rows.nA.mem = { f: 0.35, label: 'memória do nó' };
          [0, 1, 2].forEach(k => { o.rows['pp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['threads: ok', 'acc'], ['conexões: ok', 'dim']); });
          o.rows.prel = podRow('relatorios', 'SEM LIMITS', ['memória: livre', 'bad'], ['23:00', 'dim']);
          o.cnt = [['NÓS', '1'], ['PODS', '4', 'dim'], ['LIMITS NO relatorios', 'nenhum', 'bad']];
          o.res = [['quatro pods, um destino', 'dim']]; } },
      { id: 'vaza', dur: 9, title: 'E se der errado: o vazamento alcança os vizinhos', yk: 'SHARED FATE (QUALITATIVO)', act: ['Ligar o vazamento', 'tudo no mesmo nó'],
        code: ['relatorios vaza memória', 'o nó entra em pressão de memória', 'kubelet: node-pressure eviction', 'OOM atinge os pods vizinhos', 'pools de threads: intactos'],
        story: 'O <code>relatorios</code> vaza memória. O nó entra em <b>pressão de memória</b>, o kubelet passa a evictar pods e o OOM atinge os vizinhos: os pods do <code>pedidos</code> caem com os pools de threads <b>intactos</b>. O artigo chama isso de <i>shared fate</i>. O recurso que acabou estava <b>embaixo</b> do compartimento. Cenário qualitativo: não foi rodado no Kubernetes.',
        look: 'A barra de memória do nó enche; os pods do pedidos ficam vermelhos um a um.',
        key: 'Lógico em nó compartilhado tem um buraco: a máquina.',
        f(o, t) { show(o, 'nA', 'pp0', 'pp1', 'pp2', 'prel'); const m = lin(t, 0.5, 4, 0.35, 1), full = m >= 1, hit = Math.floor(lin(t, 4.2, 6.6, 0, 3.99));
          bad(o, 'prel'); o.on.nA = full ? 'bad' : 2;
          o.rows.nA = act('nó-1', full ? 'PRESSÃO DE MEMÓRIA' : 'UM NÓ PARA TUDO'); o.rows.nA.mem = { f: m, label: full ? 'memória do nó: cheia' : 'memória do nó', tone: 'bad' };
          [0, 1, 2].forEach(k => { const h = full && k < hit; o.rows['pp' + k] = podRow('pedidos-' + (k + 1), h ? 'EVICTADO' : 'POD', ['threads: intactas', h ? 'dim' : 'acc'], [h ? 'pod fora' : 'conexões: ok', h ? 'bad' : 'dim']); if (h) bad(o, 'pp' + k); else lit(o, 'pp' + k); });
          o.rows.prel = podRow('relatorios', 'VAZANDO', ['memória: subindo', 'bad'], ['sem limits', 'bad']);
          o.cnt = [['MEMÓRIA DO NÓ', full ? 'cheia' : 'subindo', 'bad'], ['PEDIDOS ATINGIDOS', `${full ? hit : 0} de 3`, hit && full ? 'bad' : 'dim'], ['POOL DE THREADS', 'intacto', 'dim']];
          o.res = full && hit >= 3 ? [['shared fate: o vizinho caiu junto', 'bad']] : [['pressionando o nó…', 'bad']]; } },
      { id: 'pools', dur: 6, title: 'Físico: um pool de nós para cada um', yk: 'TAINTS E TOLERATIONS', act: ['Separar os nós', 'checkout · batch'],
        code: ['pool de nós checkout: 3 pods pedidos', 'pool de nós batch: relatorios', 'taint no batch; só tolera quem é batch', 'requests e limits em cada pod', '  (definem a classe de QoS)'],
        story: 'O conserto é <b>físico</b> e completa o lógico: um <b>pool de nós</b> para o <code>checkout</code> e outro para o <code>batch</code>, com <i>taints</i> e <i>tolerations</i>, e <code>requests</code> e <code>limits</code> em cada pod (que definem a classe de QoS). Agora é máquina separada, não configuração de biblioteca. Custa nós.',
        look: 'Dois andares no galpão: os 3 pods do pedidos num, o relatorios no outro.',
        key: 'Físico divide máquinas: é caro e mais forte.',
        f(o) { show(o, 'nC', 'nB', 'cp0', 'cp1', 'cp2', 'brel'); o.on.nC = 2; o.on.nB = 2; lit(o, 'cp0', 'cp1', 'cp2', 'brel');
          o.rows.nC = act('pool checkout', 'NÓS DO CLIENTE'); o.rows.nC.mem = { f: 0.3, label: 'memória' };
          o.rows.nB = act('pool batch', 'TAINT: batch'); o.rows.nB.mem = { f: 0.3, label: 'memória' };
          [0, 1, 2].forEach(k => { o.rows['cp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['limits: sim', 'acc'], ['nó do checkout', 'dim']); });
          o.rows.brel = podRow('relatorios', 'TOLERA batch', ['limits: sim', 'acc'], ['nó do batch', 'dim']);
          o.cnt = [['POOLS DE NÓS', '2'], ['CHECKOUT', '3 pods', 'dim'], ['BATCH', '1 pod', 'dim']];
          o.res = [['máquinas separadas', 'acc']]; } },
      { id: 'vaza2', dur: 8, title: 'O vazamento de novo: só o batch sente', yk: 'O FÍSICO SEGURA', act: ['Ligar o vazamento', 'com dois pools de nós'],
        code: ['relatorios vaza de novo', 'bate no próprio limit: OOMKilled', 'pressão só no nó do batch', 'pedidos-1, -2, -3: intactos', 'o relatório atrasa; o checkout não'],
        story: 'O mesmo vazamento, agora com dois pools de nós. O <code>relatorios</code> bate no próprio <code>limit</code> e é morto por OOM; a pressão, se houver, fica no nó do <b>batch</b>. Os três pods do <code>pedidos</code> nem notam. O relatório atrasa, e o batch tolera atraso. O cliente, não.',
        look: 'Só o andar do batch fica vermelho; o andar do checkout continua aceso.',
        key: 'O físico completa o lógico: o furo fica no andar dele.',
        f(o, t) { show(o, 'nC', 'nB', 'cp0', 'cp1', 'cp2', 'brel'); const m = lin(t, 0.5, 4, 0.3, 1), full = m >= 1;
          o.on.nC = 2; o.on.nB = full ? 'bad' : 2; lit(o, 'cp0', 'cp1', 'cp2'); bad(o, 'brel');
          o.rows.nC = act('pool checkout', 'NÓS DO CLIENTE'); o.rows.nC.mem = { f: 0.3, label: 'memória' };
          o.rows.nB = act('pool batch', full ? 'SÓ ESTE SOFRE' : 'TAINT: batch'); o.rows.nB.mem = { f: m, label: full ? 'memória: no limit' : 'memória', tone: 'bad' };
          [0, 1, 2].forEach(k => { o.rows['cp' + k] = podRow('pedidos-' + (k + 1), 'POD', ['intacto', 'acc'], ['nó do checkout', 'dim']); });
          o.rows.brel = podRow('relatorios', full ? 'OOMKilled' : 'VAZANDO', [full ? 'reinicia' : 'memória: subindo', 'bad'], ['nó do batch', 'dim']);
          o.cnt = [['PEDIDOS ATINGIDOS', '0 de 3'], ['relatorios', full ? 'OOMKilled' : 'vazando', 'bad'], ['POOL DE NÓS', 'só o batch', 'dim']];
          o.res = full ? [['o furo ficou no andar do batch', 'acc']] : [['vazando…', 'bad']]; } },
    ],
    raio: [
      { id: 'um', dur: 6, title: 'Um compartimento: raio de 100%', yk: 'RAIO = FRAÇÃO DO TRÁFEGO',
        code: ['N = 1', 'um incidente derruba 1 ÷ 1 = 100%', 'disponibilidade no incidente: 0%', 'é o pool único, o casco sem paredes'],
        story: 'O <b>raio de explosão</b> (<i>blast radius</i>) é a fração do tráfego que cai quando um compartimento cai. Com <b>um</b> compartimento, um incidente derruba <b>100%</b>: é o pool único, o casco sem paredes.',
        look: 'Uma casa só, toda vermelha.',
        key: 'Sem divisão, o raio é a loja inteira.',
        f(o, t) { show(o, 'ncel'); const d = t > 1; o.on.ncel = d ? 'bad' : 2;
          o.rows.ncel = act('compartimentos', 'N = 1'); o.rows.ncel.cells = { n: 1, bad: d, raio: '100%', disp: '0%' };
          o.cnt = [['RAIO', d ? '100%' : '…', 'bad'], ['DISPONIBILIDADE', d ? '0%' : '…', 'dim'], ['N', '1', 'dim']];
          o.res = d ? [['um incidente, a loja toda', 'bad']] : []; } },
      { id: 'tres', dur: 6, title: 'Três compartimentos: 33,3%', yk: 'A TABELA DO ARTIGO, CONFERIDA', act: ['Passar para 3', 'compartimentos'],
        code: ['N = 3', 'raio: 1 ÷ 3 = 33,3%', 'disponibilidade: 66,7%', 'o artigo arredonda: 33% e 66%', 'supõe tráfego uniforme'],
        story: 'Com <b>3</b> compartimentos de tráfego igual, um incidente derruba <b>1 ÷ 3 = 33,3%</b> e a loja segue com <b>66,7%</b>. O artigo arredonda para 33% e 66%. A conta supõe tráfego <b>uniforme</b>: cada compartimento com a mesma fração.',
        look: 'Três casas; uma fica vermelha e as outras duas seguem acesas.',
        key: 'Com N iguais, o raio é 1 ÷ N.',
        f(o, t) { show(o, 'ncel'); const d = t > 1.2; o.on.ncel = 2;
          o.rows.ncel = act('compartimentos', 'N = 3'); o.rows.ncel.cells = { n: 3, bad: d, raio: '33,3%', disp: '66,7%' };
          o.cnt = [['RAIO', d ? '33,3%' : '…', 'bad'], ['DISPONIBILIDADE', d ? '66,7%' : '…'], ['N', '3', 'dim']];
          o.res = d ? [['2 de 3 seguem', 'acc']] : []; } },
      { id: 'tabela', dur: 9, title: 'Até 100: o raio cai para 1%', yk: '1 ÷ N, DE 5 A 100', act: ['Ir até 100', '5 · 10 · 20 · 50 · 100'],
        code: ['N =   5  raio 20%  disp. 80%', 'N =  10  raio 10%  disp. 90%', 'N =  20  raio  5%  disp. 95%', 'N =  50  raio  2%  disp. 98%', 'N = 100  raio  1%  disp. 99%'],
        story: 'A tabela segue: 5 compartimentos, 20%; 10, 10%; 20, 5%; 50, 2%; <b>100, 1%</b>. Mais compartimentos, menor o incidente. A tabela esconde duas coisas: o número de incidentes <b>sobe</b> com N (1 − 0,999<sup>N</sup>: 0,10% com 1, 4,88% com 50) e a parada <b>total</b> some (p<sup>N</sup>).',
        look: 'As casas se dividem até 100; só uma fica vermelha.',
        key: 'O raio cai; o número de incidentes pequenos sobe.',
        f(o, t) { show(o, 'ncel'); o.on.ncel = 2; const L_ = [[5, '20%', '80%'], [10, '10%', '90%'], [20, '5%', '95%'], [50, '2%', '98%'], [100, '1%', '99%']];
          const [n, r, a] = L_[Math.floor(lin(t, 0.3, 6.5, 0, 4.99))];
          o.rows.ncel = act('compartimentos', 'N = ' + n); o.rows.ncel.cells = { n, bad: true, raio: r, disp: a };
          o.cnt = [['RAIO', r, 'bad'], ['DISPONIBILIDADE', a], ['N', String(n), 'dim']];
          o.res = n === 100 ? [['1% por incidente', 'acc']] : [['dividindo…', 'dim']]; } },
      { id: 'mkt', dur: 7, title: 'O mkt-01: o shard quente leva 60%', yk: 'O TRÁFEGO NÃO É UNIFORME', act: ['Ligar o mkt-01', '20 · 20 · 60'],
        code: ['3 shards por cliente_id (módulo 16)', 'o mkt-01 sozinho: 40% do tráfego', 'shard-2 = 20% + 40% = 60%', 'média dos três: 33,3%', 'pior caso: 60%'],
        story: 'Os 3 shards do <code>pedidos</code> não pesam igual. O <code>mkt-01</code> (módulo 16) mora no <code>shard-2</code>, que fica com <b>60%</b> do tráfego; os outros dois, 20% cada. A média dos três ainda é 33,3%, mas quando o shard quente cai, o raio é <b>60%</b>. O raio é a fração do tráfego, não 1 ÷ N.',
        look: 'A largura de cada shard é a sua fração; o shard-2, o mais largo, fica vermelho.',
        key: 'Com um cliente enorme, vale o pior caso.',
        f(o, t) { const d = t > 1.6; shards(o, 3, d ? { 2: 'bad' } : { 0: 'on', 1: 'on', 2: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['3 shards', 'dim'], ['mkt-01 → shard-2', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(3), on: 1 }, ...hBranches(3, k => d && k === 2 ? { tone: 'bad' } : { on: 1, flow: k === 2 })];
          o.cnt = [['PIOR CASO', d ? '60%' : '…', 'bad'], ['MÉDIA', '33,3%', 'dim'], ['1 ÷ N PROMETIA', '33,3%', 'dim']];
          o.res = d ? [['60%, não 33%', 'bad']] : [];
          if (d) T(o, [615, 190, 60], '60% fora', 'bad'); } },
      { id: 'dedicado', dur: 7, title: 'O shard dedicado: o pior caso cai para 40%', yk: '4 SHARDS: 20 · 20 · 20 · 40', act: ['Dar um shard ao mkt-01', '4 shards'],
        code: ['shard dedicado para o mkt-01', 'frações: 20 · 20 · 20 · 40', 'pior caso: 40% (era 60%)', 'ainda não é 25%', 'eficiência 55,6% (módulo 16)'],
        story: 'O <code>mkt-01</code> ganha um shard só dele. Agora são <b>4</b>: três de clientes comuns a 20% e o dedicado a <b>40%</b>. O pior caso cai de 60% para <b>40%</b>, e ainda não é 25%: o dedicado carrega um cliente que sozinho pesa 40%.',
        look: 'Quatro shards; o do mkt-01, o mais largo, fica vermelho, e o raio é 40%.',
        key: 'Isolar o maior cliente reduz o pior caso.',
        f(o, t) { const d = t > 1.6; shards(o, 4, d ? { 3: 'bad' } : { 0: 'on', 1: 'on', 2: 'on', 3: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['mkt-01 → dedicado', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => d && k === 3 ? { tone: 'bad' } : { on: 1, flow: k === 3 })];
          o.cnt = [['PIOR CASO', d ? '40%' : '…', 'bad'], ['ANTES', '60%', 'dim'], ['SHARDS', '4', 'dim']];
          o.res = d ? [['60% → 40%', 'acc']] : [];
          if (d) T(o, [693, 190, 60], '40% fora', 'bad'); } },
      { id: 'estoque', dur: 8, title: 'E se der errado: o estoque global, raio de 100%', yk: 'O CANAL OCULTO', act: ['Derrubar o estoque', 'o mesmo para todos'],
        code: ['4 shards, mas todos chamam:', '  o mesmo estoque', '  o mesmo pagamentos e Redis', '  o mesmo lb-loja', 'estoque fora: raio 100%'],
        story: 'Os shards dividem o banco, mas todos chamam o <b>mesmo</b> <code>estoque</code>, o mesmo <code>pagamentos</code>, o mesmo Redis e o mesmo <code>lb-loja</code>. Quando o <code>estoque</code> cai, o raio é <b>100%</b>, com 4 shards. É o cano que atravessa as anteparas. A conta começa pelas dependências compartilhadas, não pelo número de shards.',
        look: 'O estoque fica vermelho embaixo, e os quatro shards ficam vermelhos com ele.',
        key: 'Um global derruba a conta: raio de 100%.',
        f(o, t) { const d = t > 1.4, w = Math.floor(lin(t, 1.6, 3.6, 0, 4.99)); const st = {}; for (let k = 0; k < 4; k++) st[k] = d && k < w ? 'bad' : 'on';
          shards(o, 4, st); show(o, 'hsh', 'oglob'); lit(o, 'hsh'); if (d) bad(o, 'oglob'); else lit(o, 'oglob');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['lb-loja: um só', 'bad']);
          o.rows.oglob = act('estoque', d ? 'FORA' : 'GLOBAL', [d ? 'não responde: os 4 shards param' : 'o mesmo para os 4 shards', d ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, () => ({ on: 1 })), ...toDeps(4, k => ({ on: !(d && k < w), tone: d && k < w ? 'bad' : '', flow: d && k < w }))];
          o.cnt = [['RAIO', d && w >= 4 ? '100%' : '…', 'bad'], ['SHARDS FORA', `${d ? Math.min(w, 4) : 0} de 4`, 'bad'], ['1 ÷ N PROMETIA', '25%', 'dim']];
          o.res = d && w >= 4 ? [['4 shards, um destino', 'bad']] : []; } },
    ],
    funcional: [
      { id: 'funcoes', dur: 6, title: 'Três funções, três perfis', yk: 'POR FUNÇÃO: O EIXO Y',
        code: ['pedidos     transacional  p95 ≤ 800 ms', 'relatorios  analítico     o das 23:00', 'entregas    assíncrono    Kafka', 'cada um com recursos próprios', 'eixo Y do cubo (módulo 15)'],
        story: 'O bulkhead <b>funcional</b> divide pelo que o sistema <b>faz</b>, o eixo Y do cubo (módulo 15). A loja tem três funções com perfis opostos: o <code>pedidos</code> é transacional (p95 ≤ 800 ms), o <code>relatorios</code> é analítico (o relatório das 23:00) e o <code>entregas</code> é assíncrono, lendo o tópico <code>pedidos</code> do Kafka.',
        look: 'As três funções à esquerda; o primário de SP, a réplica do Rio e o tópico à direita.',
        key: 'Funcional corta pelo que o sistema faz.',
        f(o) { show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); lit(o, 'fped', 'frel', 'fent'); o.on.fsp = 2;
          o.rows.fped = act('pedidos', 'TRANSACIONAL', ['p95 ≤ 800 ms', 'dim'], ['escreve no primário', 'dim']);
          o.rows.frel = act('relatorios', 'ANALÍTICO', ['relatório 23:00', 'dim'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASSÍNCRONO', ['3 consumidores', 'dim'], ['lê do Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMÁRIO', ['pool de 20', 'dim'], ['escritas do pedidos', 'dim']);
          o.rows.frio = act('pg-rio', 'RÉPLICA', ['só leitura', 'dim'], ['lag 300 ms', 'dim']);
          o.rows.fkaf = act('tópico pedidos', 'KAFKA', ['eventos de pedido', 'dim']);
          o.beams = [{ pts: CAB.fped, on: 1, flow: 1 }, { pts: CAB.frelsp, on: 1 }, { pts: CAB.frelrio }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['FUNÇÕES', '3'], ['PERFIS', 'opostos', 'dim'], ['RELATÓRIO LÊ', 'o primário', 'bad']];
          o.res = [['falta tirar o relatório do primário', 'dim']]; } },
      { id: 'primario', dur: 7, title: 'O relatório no primário', yk: 'O MESMO POOL DO MODO POOL',
        code: ['relatorios → pg-sp (primário)', 'pede 40 conexões de 20', 'checkout: 83 de 250 com 503', 'status: 101 de 1.001 com 503', 'a mesma máquina do checkout'],
        story: 'Hoje o relatório consulta o <b>primário</b> de SP, o mesmo banco do checkout. É o caso do modo Pool: 40 conexões pedidas de 20, e no k6 <b>1 em 3</b> pedidos do checkout e <b>1 em 10</b> consultas de status com <code>503</code>. A divisão por função existe no código, mas não no banco.',
        look: 'O cabo do relatório ao primário fica vermelho e o primário também.',
        key: 'Função separada no código, máquina compartilhada no banco.',
        f(o) { show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); bad(o, 'fsp', 'fped'); lit(o, 'frel', 'fent');
          o.rows.fped = act('pedidos', 'TRANSACIONAL', ['503: 1 em 3', 'bad'], ['sem conexão', 'bad']);
          o.rows.frel = act('relatorios', 'ANALÍTICO', ['lê do primário', 'bad'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASSÍNCRONO', ['3 consumidores', 'dim'], ['lê do Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMÁRIO', ['40 de 20 pedidas', 'bad'], ['pool cheio', 'bad']);
          o.rows.frio = act('pg-rio', 'RÉPLICA', ['ociosa às 23:00', 'dim']);
          o.rows.fkaf = act('tópico pedidos', 'KAFKA', ['eventos de pedido', 'dim']);
          o.beams = [{ pts: CAB.fped, tone: 'bad' }, { pts: CAB.frelsp, tone: 'bad', flow: 1 }, { pts: CAB.frelrio }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['PRIMÁRIO', '40 de 20', 'bad'], ['503 NO CHECKOUT', '33%', 'bad'], ['RÉPLICA', 'ociosa', 'dim']];
          o.res = [['o relatório no banco do checkout', 'bad']]; } },
      { id: 'rio', dur: 7, title: 'O relatório vai para a réplica do Rio', yk: 'FUNCIONAL QUE VIRA FÍSICO', act: ['Mandar para o Rio', 'réplica, lag 300 ms'],
        code: ['relatorios → pg-rio (réplica)', 'lag 300 ms: irrelevante para relatório', 'primário: 0 consultas pesadas', '  0% da capacidade de escrita', 'checkout e status: sem 503'],
        story: 'O relatório passa a ler da <b>réplica do Rio</b> (módulo 17). O lag de <b>300 ms</b> não importa para um relatório, e a consulta pesada <b>não toca o primário</b>: 0 conexões e 0% da capacidade de escrita. É uma divisão funcional que virou física: outra máquina, outro disco.',
        look: 'O cabo do relatório muda para a réplica; o primário volta a acender só com o pedidos.',
        key: 'O relatório saiu do primário para o 503 do checkout não acontecer.',
        f(o, t) { const d = t > 1.2; show(o, 'fped', 'frel', 'fent', 'fsp', 'frio', 'fkaf'); lit(o, 'fped', 'frel', 'fent', 'fsp'); if (d) lit(o, 'frio');
          o.rows.fped = act('pedidos', 'TRANSACIONAL', ['503: 0', 'acc'], ['escreve no primário', 'dim']);
          o.rows.frel = act('relatorios', 'ANALÍTICO', [d ? 'lê do Rio' : 'mudando…', 'acc'], ['10/s × 4 s', 'dim']);
          o.rows.fent = act('entregas', 'ASSÍNCRONO', ['3 consumidores', 'dim'], ['lê do Kafka', 'dim']);
          o.rows.fsp = act('pg-sp', 'PRIMÁRIO', ['consultas pesadas: 0', 'acc'], ['só escritas', 'dim']);
          o.rows.frio = act('pg-rio', 'RÉPLICA', ['relatório 23:00', 'acc'], ['lag 300 ms', 'dim']);
          o.rows.fkaf = act('tópico pedidos', 'KAFKA', ['eventos de pedido', 'dim']);
          o.beams = [{ pts: CAB.fped, on: 1, flow: 1 }, { pts: CAB.frelsp }, { pts: CAB.frelrio, on: d, flow: d }, { pts: CAB.frep, thin: 1, on: 1 }, { pts: CAB.fkaf, on: 1, flow: 1 }];
          o.cnt = [['PRIMÁRIO', '0 pesadas'], ['LAG DO RIO', '300 ms', 'dim'], ['503 NO CHECKOUT', '0', 'dim']];
          o.res = d ? [['o primário só com o pedidos', 'acc']] : []; } },
      { id: 'lanes', dur: 8, title: 'Prioridade: a mesma carga em três filas', yk: 'LANES 12 · 6 · 2', act: ['Dividir em lanes', 'alta · normal · baixa'],
        code: ['20 workers do pedidos', 'alta 12:   checkout de cliente', 'normal 6:  estorno e parceiros', 'baixa 2:   reprocessamento', 'surto de baixa: não passa de 2'],
        story: 'Dentro de uma função também se divide. Os <b>20 workers</b> do <code>pedidos</code> viram três filas: <b>alta 12</b> (o checkout de cliente), <b>normal 6</b> (estorno e parceiros) e <b>baixa 2</b> (reprocessamento). Um surto de baixa, como o robô de 500/s do módulo 8 ou a reconciliação, <b>não passa de 2 workers</b>, e o checkout continua com 12.',
        look: 'O surto entra pela lane baixa e enche só as 2 casas dela; as 12 da alta seguem livres para o checkout.',
        key: 'Prioridade: o surto fica na lane dele.',
        f(o, t) { const s = t > 1.6; show(o, 'lanes', 'la', 'ln', 'lb'); lit(o, 'lanes', 'la', 'ln'); if (s) bad(o, 'lb'); else lit(o, 'lb');
          o.rows.lanes = act('workers · 20', 'PEDIDOS'); o.rows.lanes.lanes = { used: [3, 1, s ? 2 : 0], surge: s };
          o.rows.la = act('alta', 'CHECKOUT', ['12 workers', 'acc']); o.rows.ln = act('normal', 'ESTORNO', ['6 workers', 'dim']);
          o.rows.lb = act('baixa', s ? 'SURTO' : 'REPROC.', [s ? 'robô 500/s' : '2 workers', s ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.la, on: 1, flow: 1 }, { pts: CAB.ln, on: 1, flow: 1 }, { pts: CAB.lb, on: !s, tone: s ? 'bad' : '', flow: 1 }];
          o.cnt = [['ALTA', '12 do checkout'], ['BAIXA', s ? '2 de 2 cheias' : '0 de 2', s ? 'bad' : 'dim'], ['SURTO PASSA DE', '2 workers? não', 'dim']];
          o.res = s ? [['o surto ficou em 2 workers', 'acc']] : []; } },
      { id: 'news', dur: 7, title: 'A newsletter no RabbitMQ: atraso 0', yk: 'TÓPICOS SEPARADOS POR DOMÍNIO',
        code: ['newsletter: 50.000 e-mails (módulo 13)', '  → RabbitMQ (AMQP)', 'pedidos → tópico pedidos (Kafka)', 'entregas: 3 × 40/s = 120/s', 'atraso dos pedidos: 0'],
        story: 'A newsletter de <b>50.000 e-mails</b> (módulo 13) passa pelo <b>RabbitMQ</b>, separada do tópico <code>pedidos</code> do Kafka. Os 3 consumidores do <code>entregas</code> leem <b>120 eventos/s</b> (40 cada) e só veem eventos de pedido. O atraso dos pedidos é <b>0</b>. Fila e tópico também são compartimentos.',
        look: 'Duas esteiras: pedidos → Kafka → entregas em cima, newsletter → RabbitMQ → e-mail embaixo.',
        key: 'Cada domínio no seu tópico: um não espera o outro.',
        f(o) { show(o, 'fped', 'nnews', 'nkaf', 'nrab', 'nent', 'nmail'); lit(o, 'fped', 'nkaf', 'nent', 'nnews', 'nrab', 'nmail');
          o.rows.fped = act('pedidos', 'PUBLICA', ['eventos de pedido', 'dim']);
          o.rows.nnews = act('newsletter', 'MÓDULO 13', ['50.000 e-mails', 'dim']);
          o.rows.nkaf = act('tópico pedidos', 'KAFKA', ['só pedidos', 'acc']); o.rows.nrab = act('fila newsletter', 'RABBITMQ', ['50.000 e-mails', 'dim']);
          o.rows.nent = act('entregas', '3 × 40/s', ['120 eventos/s', 'dim'], ['atraso: 0', 'acc']); o.rows.nmail = act('envio de e-mail', 'WORKERS', ['a newsletter', 'dim']);
          o.beams = [{ pts: CAB.nped, on: 1, flow: 1 }, { pts: CAB.nent, on: 1, flow: 1 }, { pts: CAB.nnews, on: 1, flow: 1 }, { pts: CAB.nmail, on: 1, flow: 1 }];
          o.cnt = [['ATRASO DOS PEDIDOS', '0 s'], ['ENTREGAS', '120/s', 'dim'], ['NEWSLETTER', 'RabbitMQ', 'dim']];
          o.res = [['duas esteiras, nenhuma espera', 'acc']]; } },
      { id: 'topico', dur: 9, title: 'E se der errado: a newsletter no tópico de pedidos', yk: '50.000 ÷ 120/s', act: ['Pôr no mesmo tópico', '50.000 e-mails'],
        code: ['newsletter → tópico pedidos', 'entregas lê 120 eventos/s', '50.000 ÷ 120 = 417 s ≈ 7 min', 'os pedidos esperam atrás', '  dos e-mails'],
        story: 'Alguém publica a newsletter no <b>mesmo</b> tópico <code>pedidos</code>. Os 3 consumidores do <code>entregas</code> leem 120 eventos/s, e os 50.000 e-mails entram na frente: os eventos de pedido esperam <b>50.000 ÷ 120 = 417 s</b>, quase 7 minutos. O mesmo tópico é o mesmo compartimento.',
        look: 'O cabo da newsletter sobe para o Kafka, a pilha cresce na frente do tópico e o atraso corre até 417 s.',
        key: 'O mesmo tópico é o mesmo compartimento.',
        f(o, t) { show(o, 'fped', 'nnews', 'nkaf', 'nrab', 'nent', 'nmail'); const s = lin(t, 0.8, 7, 0, 417), left = Math.round(50000 - s * 120);
          lit(o, 'fped', 'nnews'); bad(o, 'nkaf', 'nent'); o.on.nrab = 0;
          o.rows.fped = act('pedidos', 'PUBLICA', ['eventos de pedido', 'dim'], ['esperam na fila', 'bad']);
          o.rows.nnews = act('newsletter', 'TÓPICO ERRADO', ['50.000 e-mails', 'bad']);
          o.rows.nkaf = act('tópico pedidos', 'KAFKA', ['e-mails na frente', 'bad'], [`faltam ${thou(Math.max(0, left))}`, 'bad']); o.rows.nrab = act('fila newsletter', 'RABBITMQ', ['vazia', 'dim']);
          o.rows.nent = act('entregas', '3 × 40/s', ['120 eventos/s', 'dim'], [`atraso: ${Math.round(s)} s`, 'bad']); o.rows.nmail = act('envio de e-mail', 'WORKERS', ['parado', 'dim']);
          o.beams = [{ pts: CAB.nped, on: 1, flow: 1 }, { pts: CAB.nent, tone: 'bad', flow: 1 }, { pts: CAB.nwrong, tone: 'bad', flow: 1 }, { pts: CAB.nnews }, { pts: CAB.nmail }];
          if (left > 0) o.piles.push({ p: [455, 205, PL + 2], v: left, f: left / 50000, lab: 'e-mails' });
          o.cnt = [['ATRASO DOS PEDIDOS', `${Math.round(s)} s`, 'bad'], ['NA FRENTE', thou(Math.max(0, left)), 'dim'], ['ENTREGAS', '120/s', 'dim']];
          o.res = s >= 417 ? [['417 s ≈ 7 min de atraso', 'bad']] : [['consumindo e-mails…', 'bad']]; } },
    ],
    operacional: [
      { id: 'shards', dur: 6, title: 'Por cliente: 3 shards por cliente_id', yk: 'POR VOLUME OU CLIENTE: O EIXO Z',
        code: ['hash(cliente_id) → anel de 200 pontos', '3 shards do pedidos (módulo 16)', 'frações: 20 · 20 · 60', 'o mkt-01 (40%) mora no shard-2', 'eixo Z do cubo'],
        story: 'O bulkhead <b>operacional</b> divide por <b>quanto e de quem</b>, o eixo Z do cubo. O <code>lb-loja</code> manda cada <code>cliente_id</code> para um ponto do anel de 200 (módulo 16) e daí para um dos <b>3 shards</b>. O <code>mkt-01</code>, sozinho 40% do tráfego, faz o <code>shard-2</code> pesar <b>60%</b>.',
        look: 'O roteador em cima, os três shards embaixo, com a largura da sua fração.',
        key: 'Operacional corta por cliente e volume.',
        f(o) { shards(o, 3, { 0: 'on', 1: 'on', 2: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['anel de 200 pontos', 'dim'], ['3 shards', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(3), on: 1 }, ...hBranches(3, () => ({ on: 1 }))];
          o.cnt = [['SHARDS', '3'], ['PIOR CASO', '60%', 'bad'], ['mkt-01', '40% do tráfego', 'dim']];
          o.res = [['um shard quente', 'dim']]; } },
      { id: 'dedicado', dur: 7, title: 'O shard dedicado do mkt-01', yk: 'O MAIOR CLIENTE NO SEU COMPARTIMENTO', act: ['Dar um shard ao mkt-01', '20 · 20 · 20 · 40'],
        code: ['4 shards: 20 · 20 · 20 · 40', 'mkt-01: o shard dele', 'pior caso: 60% → 40%', 'rate limit por cliente + reserva', '  também é bulkhead operacional'],
        story: 'O <code>mkt-01</code> ganha um shard <b>só dele</b>. O pior caso cai de 60% para <b>40%</b> (a conta da aula 3), e a rajada do parceiro passa a encher o compartimento dele. O rate limit por cliente do módulo 8, quando vem com reserva garantida para os outros, é outra forma do mesmo corte.',
        look: 'Quatro shards; o hash manda o mkt-01 só para o mais largo, à direita.',
        key: 'O maior cliente ganha o seu compartimento.',
        f(o) { shards(o, 4, { 0: 'on', 1: 'on', 2: 'on', 3: 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['anel de 200 pontos', 'dim'], ['mkt-01 → dedicado', 'acc']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => ({ on: 1, flow: k === 3 }))];
          o.cnt = [['PIOR CASO', '40%'], ['ANTES', '60%', 'dim'], ['SHARDS', '4', 'dim']];
          o.res = [['60% → 40%', 'acc']]; } },
      { id: 'rajada', dur: 7, title: 'A rajada do mkt-01 fica no shard dele', yk: 'O CAMINHO INTEIRO', act: ['Ligar a rajada', 'do mkt-01'],
        code: ['rajada do mkt-01', 'hash(mkt-01) → sempre o dedicado', 'shard-0, -1, -2: nem notam', 'isola de verdade se o caminho', '  todo for dele: LB, app, banco, fila'],
        story: 'O <code>mkt-01</code> dispara uma rajada. O hash manda tudo dele para o shard dedicado, e os outros três nem notam. No <i>round robin</i> do módulo 7 a mesma rajada vazaria para a frota toda. O isolamento só é real se o caminho inteiro do shard for dele: balanceador, aplicação, banco e fila.',
        look: 'Só o shard dedicado esquenta; os três da esquerda seguem com o tráfego normal.',
        key: 'O hash roteia; os recursos separados é que isolam.',
        f(o, t) { const s = t > 1; shards(o, 4, { 0: 'on', 1: 'on', 2: 'on', 3: s ? 'bad' : 'on' }); show(o, 'hsh'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['rajada do mkt-01', s ? 'bad' : 'dim'], ['→ só o dedicado', 'acc']);
          if (s) o.rows.o43 = act('shard mkt-01', 'RAJADA', ['40% do tráfego', 'bad'], ['só o mkt-01 sente', 'bad']);
          o.beams = [{ pts: CAB.hdown, on: 1, flow: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, k => k === 3 && s ? { tone: 'bad', flow: 1 } : { on: 1 })];
          o.cnt = [['SHARDS ATINGIDOS', s ? '1 de 4' : '0', s ? 'bad' : 'dim'], ['CLIENTES COMUNS', 'ok', 'dim'], ['ROUND ROBIN', 'vazaria', 'dim']];
          o.res = s ? [['a rajada ficou no compartimento dela', 'acc']] : []; } },
      { id: 'global', dur: 9, title: 'E se der errado: o estoque e a configuração global', yk: 'O CANAL OCULTO', act: ['Errar a configuração', 'a mesma para os 4'],
        code: ['shard dedicado: banco próprio', 'mas o mesmo estoque', 'e a mesma configuração global', 'config errada: os 4 ao mesmo tempo', '4 caixas, um destino só'],
        story: 'O shard dedicado tem banco próprio, mas continua chamando o <b>mesmo</b> <code>estoque</code> e lendo a <b>mesma configuração global</b>. Uma configuração errada, ou um <code>estoque</code> saturado pelo robô, atinge os <b>4 shards</b> ao mesmo tempo. É o canal oculto: sem separar o caminho inteiro, o desenho tem 4 caixas e um destino só.',
        look: 'A configuração global fica vermelha embaixo e o vermelho sobe para os quatro shards.',
        key: 'Uma dependência global liga shards que pareciam isolados.',
        f(o, t) { const d = t > 1.4, w = Math.floor(lin(t, 1.6, 3.6, 0, 4.99)); const st = {}; for (let k = 0; k < 4; k++) st[k] = d && k < w ? 'bad' : 'on';
          shards(o, 4, st); show(o, 'hsh', 'oglob'); if (d) bad(o, 'oglob'); else lit(o, 'oglob'); lit(o, 'hsh');
          o.rows.hsh = routerRows(['4 shards', 'dim'], ['config: global', d ? 'bad' : 'dim']);
          o.rows.oglob = act('estoque · configuração', d ? 'CONFIG ERRADA' : 'GLOBAIS', [d ? 'a config errada vale para os 4' : 'os mesmos para os 4 shards', d ? 'bad' : 'dim']);
          o.beams = [{ pts: CAB.hdown, on: 1 }, { pts: hbus(4), on: 1 }, ...hBranches(4, () => ({ on: 1 })),
            ...toDeps(4, k => ({ on: !(d && k < w), tone: d && k < w ? 'bad' : '', flow: d && k < w }))];
          o.cnt = [['SHARDS ATINGIDOS', `${d ? Math.min(w, 4) : 0} de 4`, 'bad'], ['RAIO', d && w >= 4 ? '100%' : '…', 'bad'], ['PIOR CASO PROMETIDO', '40%', 'dim']];
          o.res = d && w >= 4 ? [['4 caixas, um destino', 'bad']] : []; } },
    ],
    referencia: [
      { id: 'seis', dur: 6, title: 'Seis desenhos, seis perguntas', yk: 'OS DESENHOS DO ARTIGO',
        code: ['prioridade   o que vem primeiro?', 'criticidade  o que não pode falhar?', 'tipo de uso  interativo ou batch?', 'segmento     quem divide o destino?', 'hashing      onde cai a rajada?', 'tenants      e o vizinho barulhento?'],
        story: 'O artigo fecha com seis desenhos de referência. Cada um responde a <b>uma pergunta</b> diferente, divide um recurso diferente e cobra um preço diferente. A loja usa os seis juntos. Ligue um de cada vez e leia o preço.',
        look: 'Seis placas apagadas, cada uma com a sua pergunta; à direita, o contador de pods.',
        key: 'Seis desenhos, seis perguntas: não são sinônimos.',
        f(o) { refBase(o); o.rows.pods = act('pods', 'NA LOJA'); o.rows.pods.pods = { n: 10, need: 10 };
          o.cnt = [['DESENHOS', '0 de 6'], ['PODS', '10', 'dim'], ['PREÇO', '—', 'dim']];
          o.res = [['ligue um de cada vez', 'dim']]; } },
      ...['prio', 'crit', 'uso', 'seg', 'hash', 'ten'].map((k, i) => {
        const D = REFD[k];
        const X = {
          prio: { title: 'Prioridade: checkout antes do reprocessamento', story: 'Os workers viram lanes: <b>12</b> para o checkout, <b>6</b> para estorno e parceiros, <b>2</b> para o reprocessamento. Prioridade muda de momento para momento: é o que se atende <b>primeiro</b> agora. O preço é capacidade ociosa nas lanes quietas.', code: ['pergunta: o que vem primeiro?', 'na loja: 12 · 6 · 2 workers', 'divide: workers e filas', 'preço: lanes quietas ociosas'] },
          crit: { title: 'Criticidade: o pagamentos em nós próprios', story: 'Criticidade é o que <b>não pode falhar</b> nunca: o <code>pagamentos</code>, com escopo de cartão e auditoria, ganha <b>pool de nós</b> e rede próprios. É do desenho, não do momento. O preço é infraestrutura dedicada.', code: ['pergunta: o que não pode falhar?', 'na loja: pagamentos (cartão, auditável)', 'divide: nós, namespaces, cluster', 'preço: infraestrutura dedicada'] },
          uso: { title: 'Tipo de uso: interativo × batch', story: 'O relatório das 23:00 e a newsletter ganham fila e workers <b>próprios</b>. O batch pode atrasar ou <b>pausar</b> sem tocar o p95 do checkout. O preço: duas esteiras para operar.', code: ['pergunta: interativo ou batch?', 'na loja: relatório e newsletter à parte', 'divide: filas, workers, pipeline', 'preço: duas esteiras para operar'] },
          seg: { title: 'Segmento: pessoa física × parceiros', story: 'Clientes pessoa física e parceiros (o <code>mkt-01</code>, módulo 8) não dividem o destino: cada segmento com os seus pods e pools. O preço é planejar a capacidade de cada um.', code: ['pergunta: quem divide o destino?', 'na loja: PF × parceiros (mkt-01)', 'divide: pods e pools por segmento', 'preço: capacidade de cada um'] },
          hash: { title: 'Hashing consistente: a rajada fica no shard dela', story: 'O <code>cliente_id</code> cai num ponto do anel de 200 (módulo 16), e a rajada de um cliente fica <b>no shard dele</b>. No <i>round robin</i> do módulo 7 ela vazaria para a frota toda. O preço é o resharding: ao mudar N, 25% das chaves migram.', code: ['pergunta: onde cai a rajada?', 'na loja: cliente_id → anel de 200', 'divide: shards', 'preço: resharding (25% migram)'] },
          ten: { title: 'Tenants: reserva e teto para o mkt-01', story: 'O robô do <code>mkt-01</code> manda <b>500 req/s</b> ao <code>catalogo</code> (10 réplicas, <b>1.000 req/s</b>): sem compartimento, leva 50% da frota. Com o <b>teto de 100 req/s</b>, os outros <b>900</b> ficam garantidos e os <b>400</b> excedentes recebem <code>429</code> no compartimento dele.', code: ['robô do mkt-01: 500 req/s', 'catalogo: 1.000 req/s (10 réplicas)', 'sem teto: 50% da frota', 'teto 100: 900 garantidos aos outros', 'excedente: 400 req/s com 429'] },
        }[k];
        return { id: k, dur: 6, title: X.title, yk: D.n.toUpperCase(), act: ['Ligar ' + D.n, D.q], code: X.code, story: X.story,
          look: `A placa "${D.n}" acende com o que divide na loja e o preço em vermelho.`,
          key: `${D.n[0].toUpperCase() + D.n.slice(1)}: ${D.q}`,
          f(o) { const set = REF.slice(0, i + 1); refBase(o, set, k);
            o.rows.pods = act('pods', 'NA LOJA'); o.rows.pods.pods = { n: 10, need: 10 };
            o.cnt = [['DESENHOS', `${i + 1} de 6`], ['PREÇO', D.preco, 'bad'], ['DIVIDE', D.rec, 'dim']];
            o.res = [[D.loja, 'acc']];
            if (k === 'ten') { o.cnt = [['GARANTIDOS', '900 req/s'], ['429 DO ROBÔ', '400 req/s', 'bad'], ['SEM TETO', '50% da frota', 'dim']]; o.res = [['o robô paga no compartimento dele', 'acc']]; }
          } };
      }),
      { id: 'demais', dur: 8, title: 'E se der errado: bulkhead demais', yk: '3 LANES × 4 SHARDS', act: ['Ligar os seis', 'e contar os pods'],
        code: ['3 lanes × 4 shards = 12 compartimentos', 'cada um com N+1 pods (1 + 1 reserva)', '12 × 2 = 24 pods', 'bastavam 10', 'qual incidente real cada um evita?'],
        story: 'Com tudo ligado, <b>3 lanes</b> em <b>4 shards</b> dão <b>12 compartimentos</b>. Cada um precisa de N+1 pods, um de trabalho e um de reserva: <b>24 pods</b> onde <b>10</b> bastavam. É capacidade ociosa e mais coisa para observar (a saturação por compartimento) e operar. Cada divisão reduz o raio e aumenta a conta. A pergunta é: <b>qual incidente real</b> este compartimento evita?',
        look: 'As seis placas acesas; o contador de pods passa de 10 para 24, e os 14 a mais ficam vermelhos.',
        key: 'Cada parede reduz o raio e aumenta a conta.',
        f(o, t) { refBase(o, REF); REF.forEach(k => o.on['r_' + k] = 1); const n = Math.round(lin(t, 0.8, 4.5, 10, 24));
          o.rows.pods = act('pods', n > 10 ? 'OCIOSOS EM VERMELHO' : 'NA LOJA'); o.rows.pods.pods = { n, need: 10 }; if (n >= 24) bad(o, 'pods'); else lit(o, 'pods');
          o.cnt = [['PODS', String(n), n > 10 ? 'bad' : 'acc'], ['COMPARTIMENTOS', '12', 'dim'], ['BASTAVAM', '10', 'dim']];
          o.res = n >= 24 ? [['24 pods onde 10 bastavam', 'bad']] : [['somando…', 'dim']]; } },
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
    const LAB = { c: 'checkout', s: 'status', r: 'relatório', x: '→ banco' };
    for (let i = 0; i < 20; i++) {
      const v = p.cells[i], col = i % PCOL, row = Math.floor(i / PCOL), X = GX + col * COLW + 2, Y = GY + row * RH + 2, w = COLW - 4, h = RH - 4;
      const fill = v === 'c' ? accC() : v === 's' ? GRAF() : v === 'r' ? (p.relTone === 'bad' ? BAD() : RELC()) : EMPTY();
      if (v === 'x') { x.setLineDash([u(2.5), u(2)]); x.strokeStyle = INK(); x.lineWidth = u(0.8); x.strokeRect(u(X), u(Y), u(w), u(h)); x.setLineDash([]); }
      else { x.fillStyle = fill; x.fillRect(u(X), u(Y), u(w), u(h)); if (!v) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(w), u(h)); } }
      if (v) { x.fillStyle = v === 'x' ? INK() : PAPER(); x.textAlign = 'center'; fitFont(x, u, LAB[v], 10, w - 4); x.fillText(LAB[v], u(X + w / 2), u(Y + h / 2)); x.textAlign = 'left'; }
    }
    const ly = GY + GH + 10; x.textAlign = 'center'; x.fillStyle = toneC('hi');
    const lab = p.split === 16 ? '16 interativo │ 4 batch' : p.split === 4 ? '4 + 4 · 12 devolvidas' : 'pool único · 20 conexões';
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
    x.textAlign = 'center'; const txt = `raio ${cl.raio} · disponibilidade ${cl.disp}`; x.fillStyle = cl.bad ? BAD() : toneC('hi');
    fitFont(x, u, cl.bad ? txt : `${n} compartimento${n > 1 ? 's' : ''}`, 18, W_ - 16); x.fillText(cl.bad ? txt : `${n} compartimento${n > 1 ? 's' : ''}`, u(W_ / 2), u(H_ - 22)); x.textAlign = 'left';
  }
  // os pods: os primeiros "need" são necessários; o resto, ocioso
  function drawPods(x, u, C, p, W_, H_) {
    const cols = 4, s = (W_ - 16) / cols, top = 30;
    for (let i = 0; i < p.n; i++) { const X = 8 + (i % cols) * s + 3, Y = top + Math.floor(i / cols) * (s * 0.62) + 3, w = s - 6, h = s * 0.62 - 6;
      if (i < p.need) { x.fillStyle = accC(); x.fillRect(u(X), u(Y), u(w), u(h)); }
      else { x.strokeStyle = BAD(); x.lineWidth = u(1); x.strokeRect(u(X), u(Y), u(w), u(h)); } }
    x.textAlign = 'center'; x.fillStyle = p.n > p.need ? BAD() : toneC('hi'); const t = p.n > p.need ? `${p.n} pods · bastavam ${p.need}` : `${p.n} pods`;
    fitFont(x, u, t, 13, W_ - 10); x.fillText(t, u(W_ / 2), u(H_ - 14)); x.textAlign = 'left';
  }
  // as lanes: 12 · 6 · 2 casas
  function drawLanes(x, u, C, l, W_, H_) {
    const G = [['alta · 12', 12, l.used[0], ''], ['normal · 6', 6, l.used[1], ''], ['baixa · 2', 2, l.used[2], l.surge ? 'bad' : '']];
    let y = 34; const s = (W_ - 16) / 6;
    G.forEach(([lab, n, used, tn]) => { x.fillStyle = tn === 'bad' ? BAD() : toneC('hi'); fitFont(x, u, lab, 12, W_ - 10); x.fillText(lab, u(8), u(y)); y += 10;
      for (let i = 0; i < n; i++) { const X = 8 + (i % 6) * s + 2, Y = y + Math.floor(i / 6) * (s * 0.7) + 2;
        x.fillStyle = i < used ? (tn === 'bad' ? BAD() : accC()) : EMPTY(); x.fillRect(u(X), u(Y), u(s - 4), u(s * 0.7 - 4));
        if (i >= used) { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(X), u(Y), u(s - 4), u(s * 0.7 - 4)); } }
      y += Math.ceil(n / 6) * s * 0.7 + 18; });
    if (l.surge) { x.fillStyle = BAD(); fitFont(x, u, 'fila da baixa: o robô espera', 11, W_ - 10); x.fillText('fila da baixa: o robô espera', u(8), u(H_ - 14)); }
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const K6 = () => `<table class="h3-sum"><tr><th>k6, 25–50 s</th><th>pool único</th><th>16 + 4</th></tr><tr${on_(sc === 'pool' && step >= 1)}><td>checkout (250)</td><td>66,8% ok · 83 × 503 · p95 66 ms</td><td>100% · 0 × 503 · p95 54 ms</td></tr><tr${on_(sc === 'pool' && step >= 1)}><td>status (~1.000)</td><td>89,9% ok · 101 × 503 · p95 15 ms</td><td>100% · p95 15 ms</td></tr><tr${on_(sc === 'pool' && step >= 3)}><td>relatório (250)</td><td>47,2% ok · 132 × 503 · p95 12,0 s</td><td>14,0% ok · 215 × 503 · p95 7,4 s</td></tr></table>`;
  const DATA = {
    casco: () => `<li>Antepara (<i>bulkhead</i>): a parede que divide o casco em compartimentos; a analogia é do artigo e do texto do Azure ("Bulkhead pattern")</li><li>1 compartimento: um furo alaga <b>100%</b>; 6 compartimentos: <b>1 de 6 = 16,7%</b></li><li>O casco da loja: o pool de <b>20 conexões</b> ao banco do <code>pedidos</code>, dividido <b>16 + 4</b> no k6</li><li>O cano: uma dependência global (o <code>estoque</code>, a configuração) que atravessa as paredes, o "canal oculto" do artigo</li>`,
    pool: () => `${K6()}<li>Little (L = λ × W): checkout 10 × 0,02 = <b>0,2</b> · status 40 × 0,005 = <b>0,2</b> · relatório 10 × 4 = <b>40</b> (> 20)</li><li>Fora da janela do relatório, todos os fluxos ficam em <b>100%</b> nos dois pools</li><li>O checkout perde mais (33%) que o status (10%) porque o k6 chega em intervalos regulares: o POST e o relatório chegam nos mesmos instantes</li><li>Lab: <code>loja-pool.js</code> (<code>MODE=shared</code> ou <code>bulkhead</code>) e <code>pool.js</code>, k6 v2.3.0, em <code>public/labs/bulkhead/lab/</code></li><li>Dimensionar: 4 + 4 = 8; o batch atende 4 ÷ 4 s = <b>1 consulta/s</b>; 6.000 consultas: 10 min → <b>100 min</b></li>`,
    fisico: () => `<table class="h3-sum"><tr><th>lógico</th><th>físico</th></tr><tr${on_(step === 0)}><td>semáforo, pool de threads, conexões, filas, limites</td><td>nós, pools de nós, clusters, zonas, regiões</td></tr><tr><td>barato: uma configuração</td><td>caro: máquinas</td></tr></table><li>Resilience4j: <code>SemaphoreBulkhead</code> (<code>maxConcurrentCalls</code>) e <code>FixedThreadPoolBulkhead</code></li><li>PostgreSQL <code>max_connections</code> 100 (3 reservadas ao superusuário); Envoy: 1.024 por cluster</li><li>Kubernetes: <i>taints</i> e <i>tolerations</i>, QoS por <code>requests</code> e <code>limits</code>, <i>node-pressure eviction</i></li><li>O vazamento do <code>relatorios</code> é <b>qualitativo</b>: não foi rodado no Kubernetes</li>`,
    raio: () => `<table class="h3-sum"><tr><th>N</th><th>raio</th><th>disp.</th><th>algum fora (p = 0,1%)</th></tr><tr${on_(step === 0)}><td>1</td><td>100%</td><td>0%</td><td>0,10%</td></tr><tr${on_(step === 1)}><td>3</td><td>33,3%</td><td>66,7%</td><td>0,30%</td></tr><tr><td>10</td><td>10%</td><td>90%</td><td>1,00%</td></tr><tr><td>50</td><td>2%</td><td>98%</td><td>4,88%</td></tr><tr${on_(step === 2)}><td>100</td><td>1%</td><td>99%</td><td>9,52%</td></tr></table><li>Com o <code>mkt-01</code>: 20 · 20 · 60 → pior caso <b>60%</b>; dedicado: 20 · 20 · 20 · 40 → <b>40%</b></li><li>Todos fora ao mesmo tempo: p<sup>N</sup> = 0,1% (N = 1), 10<sup>−9</sup> (N = 3); cada cliente segue com 0,1%</li><li>Shuffle sharding, 2 de 10: grupos fixos 20%, 45 pares → <b>2,2%</b></li><li>Dependências globais dos shards: <code>estoque</code>, <code>pagamentos</code>, Redis, <code>lb-loja</code></li>`,
    funcional: () => `<table class="h3-sum"><tr><th>função</th><th>perfil</th><th>recurso</th></tr><tr${on_(step <= 2)}><td>pedidos</td><td>transacional, p95 ≤ 800 ms</td><td>primário de SP</td></tr><tr${on_(step === 2)}><td>relatorios</td><td>analítico (23:00)</td><td>réplica do Rio, lag 300 ms</td></tr><tr${on_(step >= 4)}><td>entregas</td><td>assíncrono</td><td>tópico pedidos (Kafka)</td></tr></table><li>Lanes de prioridade: <b>12 · 6 · 2</b> de 20 workers</li><li>Newsletter: 50.000 ÷ 120/s (3 consumidores × 40/s) = <b>417 s ≈ 7 min</b> se estiver no tópico de pedidos; 0 no RabbitMQ</li><li>O relatório na réplica: 0 conexões e 0% da capacidade de escrita do primário</li>`,
    operacional: () => `<table class="h3-sum"><tr><th>corte</th><th>frações</th><th>pior caso</th></tr><tr${on_(step === 0)}><td>3 shards por cliente_id</td><td>20 · 20 · 60</td><td>60%</td></tr><tr${on_(step >= 1 && step <= 2)}><td>+ shard dedicado do mkt-01</td><td>20 · 20 · 20 · 40</td><td>40%</td></tr><tr${on_(step === 3)}><td>estoque ou config global</td><td>os 4 juntos</td><td>100%</td></tr></table><li>Hash do <code>cliente_id</code> num anel de 200 pontos (módulo 16); ao mudar N, 25% das chaves migram</li><li>A região também é um corte operacional (módulo 26 divide a pilha inteira)</li><li>Rate limit por cliente com reserva (o teto de 100 req/s do <code>mkt-01</code>) é bulkhead operacional</li>`,
    referencia: () => `<table class="h3-sum"><tr><th>desenho</th><th>divide</th><th>preço</th></tr>${REF.map((k, i) => `<tr${on_(step === i + 1)}><td>${REFD[k].n}</td><td>${REFD[k].rec}</td><td>${REFD[k].preco}</td></tr>`).join('')}</table><li>Vizinho barulhento: robô de <b>500 req/s</b> × <code>catalogo</code> de <b>1.000</b> = 50% da frota; teto de <b>100</b>: 900 garantidos, <b>400</b> com <code>429</code></li><li>Bulkhead demais: 3 lanes × 4 shards = 12 compartimentos × 2 pods = <b>24</b> (bastavam 10)</li><li>O texto da AWS sobre o App Mesh descreve um serviço descontinuado em 30/09/2026: só histórico</li>`,
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
  function readout() { if (active !== 'anteparas') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
