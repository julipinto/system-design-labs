// Figura 3D (iso-glow): da carga ao plano da Black Friday de 2027. Uma prancha com o mostrador suspenso atrás e, na frente,
// as peças de cada cenário: o relevo do tráfego (colunas que sobem e descem: o dia, a semana, o ano, a Black Friday, a série
// 2023–2026 e a projeção), a frota de réplicas (um cubo = 1 vCPU) que se multiplica, a cadeia do checkout como uma tubulação
// cuja largura é a capacidade de cada elo, o tópico do entregas com o lag empilhado e a ficha de limites.
// Cenários (botões e ?mode=carga|perfis|projecao|cadeia|plano; ?step=N abre no passo N).
// Dados: docs/escrita/capacity-planning-brief.md e as aulas 5 a 9 (640 req/s, 38.400 em 60 s, L = 24,2, 20 KB, 105 · 156 · 171 Mbit/s;
// mix 10/80 ms, 5% → 13,5 ms, 74,1 req/s, 19 réplicas, 10% → 24; rajada de 10 ms, 64 × 10 = 640 ms; dia comum 40 de média e pico
// 81,5 às 21h; sexta 1,15; novembro 1,45 = 58; Black Friday 400 de média e 640 às 20:03; série 300 · 410 · 520 · 640, reta 750,
// composta 824, evento 950, margem 1.140; checkout 30 · 45 · 200 · 300; cadeia 90 · 40 · 1.000 · 250 → 300; shard quente 80%;
// entregas 3 × 40 = 120, lag 1.152.000, 2,8 h, 8 partições a 62,5%; plano 14 · 10 · 15 · 2 = 41 vCPU, 984 × 344 réplica-horas).
FIGS3D.push({ id: 'bf', name: 'Capacity Planning', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, d = 1) => v.toFixed(d);
  const num = v => Number.isInteger(v) ? thou(v) : dec(v, 1);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['carga', 'perfis', 'projecao', 'cadeia', 'plano'];
  const SCNAME = { carga: 'Load', perfis: 'Profiles', projecao: 'Projection', cadeia: 'Chain', plano: 'Plan' };
  const SCFULL = { carga: 'Load modeling', perfis: 'Traffic profiles', projecao: 'Growth projection',
    cadeia: 'End-to-end capacity', plano: 'The BF 2027 plan' };
  const AULA = { carga: 'aula-5-modelagem-de-carga', perfis: 'aula-6-perfis-de-trafego', projecao: 'aula-7-projecao-de-crescimento',
    cadeia: 'aula-8-capacidade-end-to-end', plano: 'aula-9-planejamento-de-capacidade' };
  let clk = 0, sc = 'carga', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-bf3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, Z = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 500, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW - 6, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos: cfg = tamanho do nome (s1), da linha (fs), altura da linha (lh) e onde começa a primeira (y0)
  const B = {};
  const BIG = { s1: 18, fs: 15, lh: 19, y0: 41 }, SMALL = { s1: 14, fs: 13, lh: 16, y0: 37 }, SLAB = { s1: 20, fs: 13, lh: 15, y0: 40 };
  function block(nm, x, y, w, d, h, cfg = BIG, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, cfg, key: '', f: 0, pos: [x, y] };
  }
  // Carga: a carga do catálogo, o mix e a frota (24 lugares)
  block('dem', 40, 60, 250, 130, 20); block('mix', 40, 226, 250, 150, 16);
  block('frota', 330, 60, 534, 340, 6, SLAB, 4);
  // Perfis: o relevo inteiro
  block('rel', 40, 100, 824, 336, 6, SLAB, 4);
  // Projeção: o relevo à esquerda, a frota (15 lugares) ou o bloco do checkout à direita
  block('relL', 40, 100, 470, 336, 6, SLAB, 4); block('frotaP', 540, 100, 324, 336, 6, SLAB, 4); block('chk', 540, 100, 324, 336, 18);
  // Cadeia: a demanda e os quatro elos atrás, a tubulação no meio, o tópico e o entregas na frente
  const LX = [40, 212, 384, 556, 728], LW = 150, LY = 50, LD = 140;
  ['dem2', 'ped', 'pag', 'est', 'db'].forEach((nm, i) => block(nm, LX[i], LY, LW, LD, 22));
  block('top', 40, 300, 380, 130, 16); block('ent', 450, 300, 210, 130, 16);
  // Plano: as quatro frotas por serviço, os shards, as partições e a ficha
  const GP = { gCat: [40, 232, 5], gPed: [292, 190, 4], gPag: [502, 232, 5], gEst: [754, 110, 2] };
  Object.entries(GP).forEach(([nm, [x, w]]) => block(nm, x, 56, w, 184, 6, SLAB, 4));
  block('shards', 40, 270, 250, 160, 16, SMALL); block('parts', 310, 270, 220, 160, 16, SMALL); block('ficha', 550, 270, 314, 160, 18, SMALL);
  const NAMES = Object.keys(B);

  // colunas do relevo: caixas de 10 × 10 × 10 escaladas (altura animada)
  const BARS = Array.from({ length: 24 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 10, 10, 10, 0.8, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, glow, h: 0, f: 0 }; });
  // a frota: cubos de 10 escalados, com o número no topo
  const CUBES = Array.from({ length: 48 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, 10, 10, 10, 1, mat, g); const top = faceCanvas('top', 0.6, 0.6, 10, 8.8, 8.8, 14, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, f: 0, key: '', s: 10, z: 0, flat: 1 }; });
  // pilhas: o lag do entregas, a rajada
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 8 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // cabos e a tubulação (caixas sem contorno) e pontos de luz
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const PIPE = Array.from({ length: 6 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return { m, w: 10 }; });
  const DOTS = Array.from({ length: 22 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
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
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on || b.tone === 'bad' ? 6 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if ((b.on || b.tone === 'bad') && b.flow) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
  }
  // a tubulação: um trecho por elo, com a largura (em y) igual à capacidade; a altura é fixa
  const PIPE_Y = 248, PIPE_H = 10;
  const pw = cap => 6 + 34 * Math.sqrt(cap / 1000);
  function setPipes(list, dt) {
    PIPE.forEach((P, i) => { const p = list[i]; if (!p) { P.m.visible = false; return; }
      P.w += (pw(p.cap) - P.w) * Math.min(1, dt / 0.35);
      P.m.visible = true; P.m.material = p.tone === 'bad' ? beamBad : p.on ? beamOn : beamOff;
      P.m.position.copy(W((p.x0 + p.x1) / 2, PIPE_Y, PL + PIPE_H / 2 + 0.5)); P.m.quaternion.identity(); P.m.scale.set((p.x1 - p.x0) * TS, PIPE_H * TS, P.w * TS); });
    // pontos correndo pela tubulação inteira
    if (list.length && list.flow) { const pts = [[list[0].x0, PIPE_Y, PL + PIPE_H + 6], [list[list.length - 1].x1, PIPE_Y, PL + PIPE_H + 6]], cum = cumLen(pts);
      for (let k = 0; k < 3; k++) dot(alongPts(pts, cum, (clk * 0.22 + k / 3) % 1), ''); }
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
  const TAGS = Array.from({ length: 8 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── peças de cada passo ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const lit = (o, ...nm) => nm.forEach(n => o.on[n] = 1);
  const bad = (o, ...nm) => nm.forEach(n => o.on[n] = 'bad');
  const show = (o, ...nm) => nm.forEach(n => o.show[n] = 1);
  function base() { return { show: {}, on: {}, rows: {}, beams: [], tags: [], dots: [], piles: [], cnt: [], res: [], bars: [], fleet: [], pipes: [] }; }

  // o relevo: vals = [[rótulo, valor, tom, texto do valor?]], dentro do bloco nm; hmax = valor que vira a altura máxima
  const RELH = 150;
  function relief(o, nm, vals, hmax, { y = 190, d = 100, maxW = 90, hgt = RELH } = {}) {
    const Bk = B[nm], x0 = Bk.pos[0] + 20, wAll = Bk.w - 40, n = vals.length, pitch = wAll / n, w = Math.min(pitch * 0.72, maxW);
    const axis = [];
    vals.forEach(([lab, v, tn, vt], i) => { const x = x0 + pitch * i + (pitch - w) / 2;
      o.bars.push({ x, y, w, d, h: Math.max(0.6, v / hmax * hgt), st: tn || 'dim' });
      const hi = tn === 'acc' || tn === 'bad', dense = n > 12;
      if (!dense || hi || i % 3 === 0) axis.push([x + w / 2 - Bk.pos[0], lab, dense && !hi ? '' : vt ?? num(v), hi ? tn : 'dim']); });
    o.rows[nm] = o.rows[nm] || act('', ''); o.rows[nm].axis = axis; o.rows[nm].pitch = pitch;
    return i => [x0 + pitch * i + pitch / 2, y + d / 2, PL + 6 + vals[i][1] / hmax * hgt + 16];   // onde fica o topo da coluna i
  }
  // a frota: n cubos em grade, a partir de (x0, y0); st(i) devolve o estado do cubo i (0…)
  function fleet(o, n, { x0, y0, cols, px, py, s }, st = () => 'on', lab = i => String(i + 1), off = 0) {
    for (let i = 0; i < n; i++) { const c = i % cols, r = Math.floor(i / cols);
      o.fleet[off + i] = { x: x0 + c * px, y: y0 + r * py, s, st: st(i), lab: lab(i) }; }
  }
  // Carga: 24 lugares em 8 × 3 sobre a laje da frota
  const FC = { x0: 352, y0: 84, cols: 8, px: 64, py: 80, s: 46 };
  // Projeção: a frota fica à direita, 5 × 3 lugares
  const FP = { x0: 562, y0: 128, cols: 5, px: 58, py: 66, s: 40 };
  const fcPos = i => [FC.x0 + (i % 8) * 64 + 23, FC.y0 + Math.floor(i / 8) * 80 + 23];
  function cargaBase(o, { busca = 0, reps = 14, rps } = {}) {
    show(o, 'dem', 'mix', 'frota');
    const cpu = 10 + 0.7 * busca; rps = rps ?? 1000 / cpu;
    o.rows.dem = act('catalog', 'LOAD', ['2026 peak: 640 req/s', 'dim'], ['2027 goal: 950 req/s', 'hi'], ['CPU target: 70%', 'dim']);
    o.rows.mix = act('the mix', 'CPU PER REQUEST', ['page: 10 ms', 'dim'], ['search: 80 ms', 'dim'], [`search: ${dec(busca, busca % 1 ? 1 : 0)}% of traffic`, busca ? 'acc' : 'dim'],
      [`avg CPU: ${dec(cpu, 1)} ms`, busca ? 'acc' : 'dim'], [`${dec(rps, 1)} req/s per replica`, busca ? 'acc' : 'dim']);
    o.rows.frota = act('catalog fleet', '1 CUBE = 1 vCPU');
    o.after = o => { const n = o.fleet.filter(c => c && c.st !== 'ghost').length; o.rows.frota.foot = [[`${n} replicas × ${dec(rps, 1)} req/s = ${thou(n * rps)} req/s`, 'hi']]; };
    o.beams = [{ pts: [[290, 125, Z], [330, 125, Z]], on: 1, flow: 1 }];
    return { cpu, rps };
  }
  const repsFor = (dem, rps) => Math.ceil(dem / (0.7 * rps) - 1e-9);
  // Chain: caps = capacity of each link (pedidos, pagamentos, estoque, DB)
  const LINKS = ['ped', 'pag', 'est', 'db'];
  function chain(o, caps, { pods = [3, 2, 2], db = 'hoje', demand = 200, hot } = {}) {
    show(o, 'dem2', 'ped', 'pag', 'est', 'db', 'top', 'ent');
    const mn = Math.min(...caps), gi = caps.map((c, i) => c === mn ? i : -1).filter(i => i >= 0);
    o.rows.dem2 = act('demand', 'GOAL', [`${demand} orders/s`, 'hi'], ['2027 checkout', 'dim']);
    const per = [30, 20, 500], nm = ['pedidos', 'pagamentos', 'estoque'];
    [0, 1, 2].forEach(i => { const g = gi.includes(i);
      o.rows[LINKS[i]] = act(nm[i], g ? 'BOTTLENECK' : 'LINK', [`${num(pods[i])} pods × ${per[i]}/s`, 'dim'], [`= ${thou(caps[i])}/s`, g ? 'bad' : 'hi']);
      if (g) bad(o, LINKS[i]); else lit(o, LINKS[i]); });
    const g3 = gi.includes(3);
    o.rows.db = act('DB', g3 ? 'BOTTLENECK' : 'PEDIDOS', [db === 'ded' ? '3 shards + 1 dedicated' : '3 shards × 150/s', 'dim'], [`= ${thou(caps[3])}/s effective`, g3 ? 'bad' : 'hi']);
    o.rows.db.shards = hot || (db === 'ded' ? { n: 4, loads: [26.7, 26.7, 26.7, 26.7], ded: 3 } : { n: 3, loads: [26.7, 26.7, 80] });
    if (g3) bad(o, 'db'); else lit(o, 'db');
    lit(o, 'dem2');
    const segs = [demand, ...caps].map((cap, i) => ({ x0: LX[i] - (i ? 11 : 0), x1: LX[i] + LW + (i < 4 ? 11 : 0), cap, on: 1, tone: i && gi.includes(i - 1) ? 'bad' : '' }));
    segs.flow = 1; o.pipes = segs;
    o.rows.top = act('pedidos topic', 'KAFKA', ['3 partitions', 'dim']); o.rows.top.parts = { n: 3, on: 3 };
    o.rows.ent = act('entregas', 'CONSUMER', ['40 events/s per partition', 'dim'], ['3 × 40 = 120/s', 'dim']);
    o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]] }, { pts: [[420, 365, Z], [450, 365, Z]] }];
    return { mn, gi };
  }
  // Plan: services with their fleets; n = [catalog, pedidos, pagamentos, estoque], prev = the 2026 one (the new ones light up more)
  const GN = ['gCat', 'gPed', 'gPag', 'gEst'], GNAME = ['catalog', 'pedidos', 'pagamentos', 'estoque'], GOFF = [0, 14, 24, 39];
  function planBase(o, n, prev, st) {
    GN.forEach((g, k) => { show(o, g); const [x, w, cols] = GP[g];
      o.rows[g] = act(GNAME[k], `${n[k]} vCPU`); o.rows[g].foot = [[`${n[k]} replica${n[k] > 1 ? 's' : ''}`, 'hi']];
      fleet(o, n[k], { x0: x + 14, y0: 70, cols, px: 42, py: 38, s: 30 }, i => st ? st(k, i) : prev && i >= prev[k] ? 'new' : 'on', undefined, GOFF[k]); });
    show(o, 'shards', 'parts', 'ficha');
  }
  const SHARDS = (n4) => ({ n: n4 ? 4 : 3, loads: n4 ? [26.7, 26.7, 26.7, 26.7] : [26.7, 26.7, 80], ded: n4 ? 3 : -1 });

  // ── o que se vê em cada passo ──
  const DAY = [8.2, 6.1, 4.1, 4.1, 4.1, 8.2, 16.3, 28.5, 40.8, 48.9, 53.0, 57.1, 61.1, 53.0, 48.9, 48.9, 53.0, 57.1, 61.1, 69.3, 77.5, 81.5, 48.9, 20.4];
  const WEEK = [['Mon', 1.05], ['Tue', 1.00], ['Wed', 1.00], ['Thu', 1.05], ['Fri', 1.15], ['Sat', 0.90], ['Sun', 0.85]];
  const YEAR = [['Jan', .85], ['Feb', .80], ['Mar', .90], ['Apr', .90], ['May', 1.00], ['Jun', .95], ['Jul', .90], ['Aug', .95], ['Sep', 1.00], ['Oct', 1.10], ['Nov', 1.45], ['Dec', 1.20]];
  const HIST = [['2023', 300], ['2024', 410], ['2025', 520], ['2026', 640]];
  const STEPS = {
    carga: [
      { id: 'tps', dur: 5, title: 'TPS: 640 req/s in the 20:03 minute', yk: 'TPS = WORK ÷ SECONDS',
        code: ['38,400 requests in 60 s', '38,400 ÷ 60 = 640 req/s', '2026 fleet: 10 replicas', '1 replica = 1 vCPU = 100 req/s', '  (page only, 10 ms of CPU)'],
        story: 'The 2026 catalog peak was <b>640 req/s</b>: 38,400 requests in the 20:03 minute. The fleet had <b>10 replicas</b> of 1 vCPU, each serving 100 req/s of page. But "640 req/s" is a single number, and very different loads fit inside it.',
        look: 'The load leaves the block on the left and enters the fleet: 10 cubes, one per replica.',
        key: 'TPS is work divided by time, and it is only the first of the three dimensions.',
        f(o) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC);
          o.rows.dem = act('catalog', 'LOAD', ['38,400 req in 60 s', 'dim'], ['= 640 req/s', 'acc'], ['10 replicas (2026)', 'dim']);
          o.cnt = [['TPS', '640 req/s'], ['WORK', '38,400 req', 'dim'], ['WINDOW', '60 s', 'dim']];
          o.res = [['640 req/s: a single number', 'acc']]; } },
      { id: 'concorrencia', dur: 5, title: 'Concurrency: 24.2 in flight', yk: 'LITTLE\'S LAW: L = λ × W',
        code: ['λ = 640 req/s', 'W = 37.8 ms (64% per replica)', 'L = 640 × 0.0378 = 24.2', '≈ 2.4 in flight on each of the 10', 'module 14: 86.4 with the hot replica'],
        story: 'The second dimension is <b>concurrency</b>: how many requests are inside the system at the same time. By Little\'s Law, L = 640 × 0.0378 s = <b>24.2</b> in flight on the healthy replicas, about 2.4 on each. In module 14, with the hot replica at 99%, it was 86.4 across the fleet.',
        look: 'The points of light inside the fleet are the requests in flight, about two per replica.',
        key: 'Concurrency is TPS times response time.',
        f(o) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC);
          for (let i = 0; i < 10; i++) { const [x, y] = fcPos(i); o.dots.push([[x, y, PL + 6 + 46 + 12 + 6 * Math.sin(clk * 3 + i)], '']); }
          o.rows.dem = act('catalog', 'LOAD', ['λ = 640 req/s', 'dim'], ['W = 37.8 ms', 'dim'], ['L = 24.2 in flight', 'acc']);
          o.cnt = [['IN FLIGHT', '24.2'], ['λ', '640 req/s', 'dim'], ['W', '37.8 ms', 'dim']];
          o.res = [['24.2 requests at the same time', 'acc']]; T(o, [610, 60, 80], '24.2 in flight', 'acc'); } },
      { id: 'banda', dur: 6, title: 'Payload and bandwidth: 105 Mbit/s', yk: 'BANDWIDTH = TPS × BYTES',
        code: ['GET /produtos/42: 1 KB + 19 KB', '= 20 KB per transaction (example)', '640 × 20 KB = 13.1 MB/s = 105 Mbit/s', '950 req/s: 156 Mbit/s', '+10% retries: 171 Mbit/s'],
        story: 'The third dimension is the <b>payload</b>. <code>GET /produtos/42</code> carries 1 KB of request and 19 KB of response (example): <b>20 KB</b> per transaction. Bandwidth is TPS × payload: 640 × 20 KB = <b>105 Mbit/s</b>. At 950 req/s it rises to 156 Mbit/s, and with 10% retries to 171.',
        look: 'The load cable thickens with each line of the math: 105, 156 and 171 Mbit/s.',
        key: 'The payload decides the bandwidth, and the payload tail decides when it runs out.',
        f(o, t) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC); const k = t < 2 ? 0 : t < 4 ? 1 : 2, v = ['105', '156', '171'][k];
          o.rows.dem = act('catalog', 'BANDWIDTH', [['640', '950', '950'][k] + ' req/s × 20 KB', 'dim'], [k === 2 ? '+10% retries' : 'no retries', 'dim'], [`= ${v} Mbit/s`, 'acc']);
          o.cnt = [['BANDWIDTH', v + ' Mbit/s'], ['PAYLOAD', '20 KB', 'dim'], ['TPS', k ? '950 req/s' : '640 req/s', 'dim']];
          o.res = [[`${v} Mbit/s on the wire`, 'acc']]; T(o, [310, 125, 44], v + ' Mbit/s', 'acc'); } },
      { id: 'pagina', dur: 5, title: '950 req/s, page only: 14 replicas', yk: 'REPLICAS = ⌈ DEMAND ÷ (0.7 × μ) ⌉',
        code: ['2027 demand: 950 req/s', 'page only: 10 ms → 100 req/s', 'CPU target: 70%', '950 ÷ (0.7 × 100) = 13.6', '⌈ 13.6 ⌉ = 14 replicas'],
        story: 'For 2027 the catalog expects <b>950 req/s</b> (lesson 7 explains where it comes from). If every request were the page (10 ms of CPU, 100 req/s per replica), the math with the 70% target would be ⌈ 950 ÷ 70 ⌉ = <b>14 replicas</b>. It is the module 14 HPA math.',
        look: 'The fleet grows from 10 to 14 cubes. The mix is still at 0% search.',
        key: 'The replica math uses the CPU cost per request.',
        f(o) { cargaBase(o); lit(o, 'dem', 'frota'); fleet(o, 14, FC, i => i >= 10 ? 'new' : 'on');
          o.cnt = [['REPLICAS', '14'], ['PER REPLICA', '100 req/s', 'dim'], ['SEARCH', '0%', 'dim']];
          o.res = [['14 replicas, if it were page only', 'acc']]; } },
      { id: 'busca', dur: 6, title: '5% search: 19 replicas, not 14', yk: 'THE MIX CHANGES THE CPU PER REQUEST', act: ['Turn on 5% search', '14 → 19 replicas'],
        code: ['CPU = 0.95 × 10 + 0.05 × 80', '    = 13.5 ms → 74.1 req/s per replica', '950 ÷ (0.7 × 74.1) = 18.3', '⌈ 18.3 ⌉ = 19 replicas', 'capacity is measured per type'],
        story: 'Now 5% of the traffic is the heavy search from module 7, with <b>80 ms</b> of CPU. The average CPU goes from 10 to 0.95 × 10 + 0.05 × 80 = <b>13.5 ms</b>, and each replica serves <b>74.1 req/s</b>, not 100. The math becomes ⌈ 950 ÷ (0.7 × 74.1) ⌉ = <b>19 replicas</b>. The TPS is the same and the fleet is different.',
        look: 'The mix rises from 0% to 5% search and five new cubes appear in the fleet.',
        key: 'The same TPS with 5% search needs 19 replicas, not 14.',
        f(o, t) { const b = lin(t, 0.4, 2.6, 0, 5), { rps } = cargaBase(o, { busca: b }), n = repsFor(950, rps);
          lit(o, 'mix', 'frota'); fleet(o, n, FC, i => i >= 14 ? 'new' : 'on');
          o.cnt = [['REPLICAS', String(n)], ['AVG CPU', dec(10 + 0.7 * b, 1) + ' ms', 'dim'], ['PER REPLICA', dec(rps, 1) + ' req/s', 'dim']];
          o.res = n >= 19 ? [['19 replicas, not 14', 'acc']] : [['the mix is rising…', 'dim']]; } },
      { id: 'busca10', dur: 6, title: '10% search: 24 replicas', yk: 'EVERY 5% OF SEARCH, +5 REPLICAS', act: ['Raise to 10% search', '19 → 24'],
        code: ['CPU = 0.90 × 10 + 0.10 × 80', '    = 17 ms → 58.8 req/s per replica', '950 ÷ (0.7 × 58.8) = 23.1', '⌈ 23.1 ⌉ = 24 replicas', 'search 0% · 5% · 10% = 14 · 19 · 24'],
        story: 'With <b>10%</b> search the average CPU goes to <b>17 ms</b>, the replica to <b>58.8 req/s</b> and the fleet to <b>24 replicas</b>. Each heavy request in the mix weighs more than eight pages. That is why capacity is measured <b>per request type</b> (module 24).',
        look: 'Five more cubes: the fleet fills all 24 spots on the slab.',
        key: '0% · 5% · 10% search = 14 · 19 · 24 replicas.',
        f(o, t) { const b = lin(t, 0.4, 2.6, 5, 10), { rps } = cargaBase(o, { busca: b }), n = repsFor(950, rps);
          lit(o, 'mix', 'frota'); fleet(o, n, FC, i => i >= 19 ? 'new' : 'on');
          o.cnt = [['REPLICAS', String(n)], ['AVG CPU', dec(10 + 0.7 * b, 1) + ' ms', 'dim'], ['PER REPLICA', dec(rps, 1) + ' req/s', 'dim']];
          o.res = n >= 24 ? [['24 replicas with 10% search', 'acc']] : [['the mix is rising…', 'dim']]; } },
      { id: 'rajada', dur: 7, title: 'The burst: the same 640 in 10 ms', yk: 'THE SECOND\'S AVERAGE HIDES THE QUEUE', act: ['Release the newsletter', '10 ms burst'],
        code: ['spread over the second: 64% per replica', '  R = 37.8 ms', 'in 10 ms (20:00 newsletter):', '  64 per replica at once', 'the last waits 64 × 10 ms = 640 ms', 'the average: ~320 ms'],
        story: 'The 640 req/s spread over the second leave each replica at 64% (R = 37.8 ms). The <b>same</b> 640 arriving in a <b>10 ms</b> burst, like the 20:00 newsletter, are <b>64 per replica at once</b>. The replica serves 1 every 10 ms, and the last in line waits 64 × 10 ms = <b>640 ms</b> (the average, about 320). The average TPS is the same.',
        look: 'The pile in front of the first replica gathers the burst\'s 64 requests; the replica turns red.',
        key: 'The burst lives inside the second, and the per-second average does not show the queue.',
        f(o, t) { cargaBase(o); lit(o, 'dem'); const n = Math.round(lin(t, 0.5, 2.5, 0, 64)), w = n * 10;
          fleet(o, 10, FC, i => n >= 64 ? 'bad' : 'on');
          o.rows.dem = act('catalog', 'BURST', ['640 req in 10 ms', 'bad'], ['= 64 per replica', 'bad'], ['1 every 10 ms', 'dim']);
          o.piles.push({ p: [375, 350, PL + 7], v: n, f: n / 64 });
          o.cnt = [['LAST ONE WAITS', w + ' ms', 'bad'], ['IN THE QUEUE', `${n} of 64`, 'dim'], ['SPREAD OUT', '37.8 ms', 'dim']];
          o.res = n >= 64 ? [['640 ms for the last in line', 'bad']] : [['the burst is arriving…', 'dim']];
          if (n >= 64) T(o, [375, 330, 100], '640 ms', 'bad'); } },
      { id: 'errado', dur: 6, title: 'If it goes wrong: "100 req/s per replica" with search', yk: 'PLANNED 14, NEEDED 19',
        code: ['plan: 950 ÷ 70 → 14 replicas', 'real traffic: 5% search', '  74.1 req/s per replica', '950 ÷ (14 × 74.1) = 91.6% CPU', 'search on sale: goes past 95%', '5 replicas short'],
        story: 'The team plans with the page\'s 100 req/s and forgets that 5% of the traffic is search. For 950 req/s it builds <b>14 replicas</b> where <b>19</b> were needed. With 5% search the fleet starts at 950 ÷ (14 × 74.1) = <b>91.6%</b> CPU at the peak, and goes past 95% the day search goes on sale: far beyond the 70% target, already at the knee of the curve.',
        look: 'The 14 cubes turn red and the 5 missing spots show up empty.',
        key: 'TPS alone doesn\'t size anything: the mix changes the number of replicas.',
        f(o) { cargaBase(o, { busca: 5 }); bad(o, 'frota'); fleet(o, 19, FC, i => i >= 14 ? 'ghost' : 'bad', i => i >= 14 ? 'gap' : String(i + 1));
          o.cnt = [['CPU AT PEAK', '91.6%', 'bad'], ['PLANNED', '14', 'dim'], ['NEEDED', '19', 'dim']];
          o.res = [['5 replicas short: at the knee', 'bad']]; T(o, [702, 300, 70], '5 short', 'bad'); } },
    ],
    perfis: [
      { id: 'dia', dur: 5, title: 'An ordinary day: peak of 81.5 at 9 pm', yk: 'THE DAILY PROFILE (EXAMPLE)',
        code: ['catalog on an ordinary day, hour by hour', 'average: 40 req/s', 'minimum: 4.1 at 2 am', 'lunch: 61.1 at 12 pm', 'peak: 81.5 at 9 pm = 2.04 × the average'],
        story: 'Each column is an hour of an ordinary catalog day (example). The average is <b>40 req/s</b>, the minimum is <b>4.1</b> at 2 am, lunch rises to 61.1 and the <b>peak</b> is at <b>9 pm</b>, with <b>81.5 req/s</b>: 2.04 times the average. The plan looks at the peak, not the average.',
        look: 'The day\'s relief: the lit column at 9 pm is the peak, and the 2 am valley almost vanishes.',
        key: 'The daily profile shows when the system gets tight and when it sits idle.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', DAY.map((v, i) => [i + 'h', v, i === 21 ? 'acc' : i === 2 ? 'dim' : 'dim']), 81.5);
          o.rows.rel.name = 'an ordinary catalog day'; o.rows.rel.meta = 'REQ/S PER HOUR';
          o.cnt = [['PEAK', '81.5 req/s'], ['AVERAGE', '40 req/s', 'dim'], ['MINIMUM', '4.1', 'dim']];
          o.res = [['the day\'s peak: 9 pm', 'acc']]; T(o, top(21), '81.5 · 9 pm', 'acc'); T(o, top(2), '4.1 · 2 am', 'dim'); } },
      { id: 'semana', dur: 5, title: 'The week: Friday has 1.15', yk: 'THE WEEKLY PROFILE',
        code: ['factor over the weekly average', 'Mon 1.05 · Tue 1.00 · Wed 1.00', 'Thu 1.05 · Fri 1.15', 'Sat 0.90 · Sun 0.85', 'sum 7.00: the average stays 40'],
        story: 'In the week, each day has a <b>factor</b> over the average: <b>Friday</b> is the busiest day, with <b>1.15</b> (46 req/s on average); Sunday, the emptiest, with 0.85. The factors add up to 7.00, so the weekly average stays at 40. Black Friday falls on a Friday.',
        look: 'Seven columns; Friday is the tallest.',
        key: 'The weekly profile says which day carries the most.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', WEEK.map(([d, f]) => [d, 40 * f, d === 'Fri' ? 'acc' : 'dim', dec(f, 2)]), 46);
          o.rows.rel.name = 'the catalog week'; o.rows.rel.meta = 'FACTOR × 40 REQ/S';
          o.cnt = [['FRIDAY', '× 1.15'], ['SUNDAY', '× 0.85', 'dim'], ['SUM', '7.00', 'dim']];
          o.res = [['Friday: 46 req/s on average', 'acc']]; T(o, top(4), 'Fri · 46 req/s', 'acc'); } },
      { id: 'ano', dur: 5, title: 'The year: November has 1.45', yk: 'THE SEASONAL PROFILE',
        code: ['month index over the yearly average', 'Jan 0.85 · Feb 0.80 · Mar 0.90 …', 'Oct 1.10 · Nov 1.45 · Dec 1.20', 'November: 1.45 × 40 = 58 req/s', 'sum 12.00: the average stays 40'],
        story: 'In the year, each month has an <b>index</b>. <b>November</b> is the highest, <b>1.45</b>: 1.45 × 40 = <b>58 req/s</b> on average for the month. December comes next, with 1.20. The indexes add up to 12.00, and the yearly average stays 40.',
        look: 'Twelve columns; November is the peak of the year.',
        key: 'The seasonal profile says which month carries the most.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', YEAR.map(([m, f]) => [m, 40 * f, m === 'Nov' ? 'acc' : 'dim', dec(f, 2)]), 58);
          o.rows.rel.name = 'the catalog year'; o.rows.rel.meta = 'INDEX × 40 REQ/S';
          o.cnt = [['NOVEMBER', '58 req/s'], ['INDEX', '1.45', 'dim'], ['YEAR AVERAGE', '40', 'dim']];
          o.res = [['November: 58 req/s on average', 'acc']]; T(o, top(10), 'Nov · 58 req/s', 'acc'); } },
      { id: 'bf', dur: 6, title: 'Black Friday: 640 at 20:03', yk: 'THE DAY THAT BREAKS THE PATTERN', act: ['Open Black Friday', 'the day that breaks the pattern'],
        code: ['ordinary day: peak of 81.5 at 9 pm', 'Black Friday 2026:', '  day average: 400 req/s (10 × 40)', '  20:03 peak: 640 req/s', '640 ÷ 81.5 = 7.9 × the ordinary peak', 'the 20:00 newsletter has a set time'],
        story: 'Black Friday doesn\'t follow the profile. The <b>day average</b> was <b>400 req/s</b>, 10 times the yearly average, and the <b>20:03 peak</b> was <b>640</b>: 7.9 times the peak of an ordinary day. It is the newsletter minute, which the store <b>knows</b> (20:00). Next to it, the ordinary day\'s relief becomes a plain.',
        look: 'The mountain: the 640 column beside the 400 average and the ordinary peak of 81.5.',
        key: 'Black Friday is 7.9 times the peak of an ordinary day.',
        f(o, t) { show(o, 'rel'); const g = lin(t, 0.3, 2.3, 0, 1);
          const top = relief(o, 'rel', [['ordinary peak', 81.5, 'dim'], ['BF: day avg', 400 * g, 'on', '400'], ['BF: 20:03', 640 * g, 'acc', '640']], 640, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'ordinary day × Black Friday'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['20:03 PEAK', '640 req/s'], ['BF AVERAGE', '400', 'dim'], ['× ORDINARY PEAK', '7.9', 'dim']];
          o.res = [['640 ÷ 81.5 = 7.9 times', 'acc']]; if (g >= 1) { T(o, top(2), '640 · 20:03', 'acc'); T(o, top(0), '81.5', 'dim'); } } },
      { id: 'janela', dur: 8, title: 'The window: 640 → 400 → 58', yk: 'THE LARGER THE WINDOW, THE SMALLER THE PEAK', act: ['Switch the scale', 'minute → day → month'],
        code: ['the same night in three windows:', '  1 minute (20:03): 640 req/s', '  1 day (BF average): 400', '  1 month (November): 58', 'the month\'s average hides the day', '  and the day hides the minute'],
        story: 'The same night, measured in different windows. In the <b>minute</b> at 20:03 it is <b>640 req/s</b>; in the <b>day</b> average, <b>400</b>; in the November <b>month</b> average, <b>58</b>. Black Friday vanishes from the monthly chart. That is why the aggregation window is part of the plan: 1 to 10 minutes for the day, hours for the week, days for the year.',
        look: 'The Black Friday column shrinks with each window change, until it is smaller than an ordinary day\'s peak.',
        key: 'The month\'s average hides the day, and the day hides the minute.',
        f(o, t) { show(o, 'rel'); const k = t < 2.5 ? 0 : t < 5 ? 1 : 2, v = [640, 400, 58][k], J = ['1 minute', '1 day', '1 month'][k];
          const top = relief(o, 'rel', [['ordinary peak (1 h)', 81.5, 'dim'], [`BF · ${J} window`, v, k === 2 ? 'bad' : 'acc']], 640, { maxW: 110, hgt: 220, d: 90 });
          o.rows.rel.name = 'Black Friday in three windows'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['PEAK SEEN', v + ' req/s', k === 2 ? 'bad' : 'acc'], ['WINDOW', J, 'dim'], ['IN THE MINUTE', '640', 'dim']];
          o.res = k === 2 ? [['in the month, BF becomes 58', 'bad']] : [[`${J} window: ${v}`, 'acc']];
          T(o, top(1), `${v} · ${J}`, k === 2 ? 'bad' : 'acc'); } },
      { id: 'rajada', dur: 6, title: '1,300 req/s at 20:20: the burst of seconds', yk: 'THE SAME EFFECT, INSIDE THE MINUTE',
        code: ['module 21: 1,300 req/s at 20:20', 'it is a burst of seconds', 'in the 1-minute window: ~650', 'not another peak: another window', 'the plan picks the window that matters'],
        story: 'In module 21 the same night shows up with <b>1,300 req/s at 20:20</b>. It isn\'t another peak: it is a <b>burst of seconds</b>. In the 1-minute window, that night shows up as about <b>650</b>. Aggregation hides the burst the same way the month hides Black Friday.',
        look: 'Two columns for the same instant: the 1-second one goes to 1,300; the 1-minute one stays near 650.',
        key: 'The burst lives inside the window; changing the window changes the number.',
        f(o) { show(o, 'rel');
          const top = relief(o, 'rel', [['20:20 · 1 s window', 1300, 'bad', '1,300'], ['20:20 · 1 min window', 650, 'acc', '~650'], ['20:03 · 1 min', 640, 'dim']], 1300, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'the same night, another window'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['BURST', '1,300 req/s', 'bad'], ['IN THE MINUTE', '~650', 'dim'], ['20:03 PEAK', '640', 'dim']];
          o.res = [['the 1 min window hides the burst', 'acc']]; T(o, top(0), '1,300 · 20:20', 'bad'); } },
      { id: 'errado', dur: 6, title: 'If it goes wrong: planning by the month', yk: 'THE PEAK OF THE WINDOW THAT MATTERS',
        code: ['replicas at 70% (100 req/s each):', '  November month, 58 → 1 replica', '  ordinary peak, 81.5 → 2 replicas', '  BF at 20:03, 640 → 10 replicas', 'BF = 11 × the month, 7.9 × the ordinary peak'],
        story: 'The plan uses the monthly index (November, <b>58 req/s</b>) or the peak of an ordinary day (<b>81.5</b>). With 100 req/s per replica and a 70% target, that gives 1 or 2 replicas, when the 20:03 minute asks for <b>10</b>. Black Friday is <b>11 times</b> the month\'s average and 7.9 times the ordinary peak. What gets planned is the peak of the window that matters.',
        look: 'Above each column, how many replicas it asks for: 1, 2 and 10.',
        key: 'Planning by the month\'s average is planning 1 replica for a night that asks for 10.',
        f(o) { show(o, 'rel');
          const top = relief(o, 'rel', [['Nov · month avg', 58, 'bad'], ['ordinary day · peak', 81.5, 'bad'], ['BF · 20:03', 640, 'acc']], 640, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'which number becomes the plan?'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['BF ÷ MONTH', '11 ×', 'bad'], ['BF ÷ ORDINARY PEAK', '7.9 ×', 'dim'], ['REPLICAS', '1 · 2 · 10', 'dim']];
          o.res = [['by the month: 1 replica; the night asks for 10', 'bad']];
          T(o, top(0), '→ 1 replica', 'bad'); T(o, top(1), '→ 2 replicas', 'bad'); T(o, top(2), '→ 10 replicas', 'acc'); } },
    ],
    projecao: [
      { id: 'serie', dur: 5, title: 'The series: 300 · 410 · 520 · 640', yk: 'THE CATALOG PEAK (EXAMPLE)',
        code: ['2023: 300 req/s', '2024: 410', '2025: 520', '2026: 640', 'jumps: × 1.37 · × 1.27 · × 1.23'],
        story: 'The catalog peak over the last four years (example): <b>300 · 410 · 520 · 640</b>. Black Friday 2027 is the same night a year later, on Friday 11/26/2027. The question has two sources: what the series shows and what the business is going to change. On the right, the 2026 fleet: <b>10 replicas</b>, 1,000 req/s.',
        look: 'Four columns, one per year; the 10-cube fleet waits for the projection.',
        key: 'History is the starting point of the projection.',
        f(o) { show(o, 'relL', 'frotaP'); relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, a === '2026' ? 'acc' : 'on']), ['2027', 0, 'dim', '?']], 1140, { maxW: 64 });
          o.rows.relL.name = 'catalog peak'; o.rows.relL.meta = 'REQ/S';
          o.rows.frotaP = act('catalog', '10 REPLICAS'); o.rows.frotaP.foot = [['10 × 100 = 1,000 req/s', 'hi'], ['2027: ?', 'dim']];
          fleet(o, 10, FP, () => 'dim');
          o.cnt = [['2026', '640 req/s'], ['JUMPS', '1.37 · 1.27 · 1.23', 'dim'], ['2027', '?', 'dim']];
          o.res = [['the series climbs, ever more slowly', 'acc']]; } },
      { id: 'reta', dur: 5, title: 'Linear: 750 in 2027', yk: 'LEAST-SQUARES LINE', act: ['Project by the line', 'least squares'],
        code: ['slope: +113 per year', '2027: 298 + 113 × 4 = 750', 'with 10 replicas (1,000 req/s):', '  750 ÷ 1,000 = 75%', '  R = 10 + 10 ÷ 0.25 = 50 ms'],
        story: 'The least-squares line grows <b>113 per year</b> and gives <b>750 req/s</b> in 2027. With the 10-replica fleet, the catalog would sit at <b>75%</b> (R = 50 ms): above the 70% target, but far from the knee. It is the trend, if nothing changes.',
        look: 'The 2027 column climbs to 750; the fleet lights up at 75%.',
        key: 'The line is the floor of the projection, not the plan.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1); const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['2027 · reta', 750 * g, 'acc', '750']], 1140, { maxW: 64 });
          o.rows.relL.name = 'catalog peak'; o.rows.relL.meta = 'REQ/S'; lit(o, 'frotaP');
          o.rows.frotaP = act('catalog', '10 REPLICAS'); o.rows.frotaP.foot = [['750 ÷ 1,000 = 75%', 'acc'], ['R = 50 ms', 'dim']];
          fleet(o, 10, FP);
          o.cnt = [['2027 (LINE)', '750'], ['PER YEAR', '+113', 'dim'], ['10 REPLICAS', '75%', 'dim']];
          o.res = [['750: 10 replicas at 75%', 'acc']]; if (g >= 1) T(o, top(4), '750', 'acc'); } },
      { id: 'composta', dur: 5, title: 'Compound: 28.7% per year → 824', yk: 'COMPOUND GROWTH',
        code: ['rate = (640 ÷ 300)^(1/3) − 1 = 28.7%', '2027: 640 × 1.287 = 824', 'with 10 replicas: 82%', 'the jumps fall (1.37 → 1.23):', '  the compound is optimistic'],
        story: 'The compound uses the average rate: (640 ÷ 300)^(1/3) = <b>28.7% per year</b>, and gives <b>824</b>. The 10 replicas would sit at <b>82%</b>, already at the knee. The real jumps are falling (1.37 · 1.27 · 1.23), so the compound is optimistic for the history alone. That is why both appear.',
        look: 'Next to the line, the compound column, taller; the fleet goes to 82%.',
        key: 'The line and the compound say what happens if nothing changes.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1);
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['line', 750, 'dim'], ['compound', 824 * g, 'acc', '824']], 1140, { maxW: 64 });
          o.rows.relL.name = 'catalog peak'; o.rows.relL.meta = 'REQ/S'; lit(o, 'frotaP');
          o.rows.frotaP = act('catalog', '10 REPLICAS'); o.rows.frotaP.foot = [['824 ÷ 1,000 = 82%', 'acc'], ['at the knee', 'dim']];
          fleet(o, 10, FP);
          o.cnt = [['2027 (COMPOUND)', '824'], ['RATE', '28.7%/year', 'dim'], ['10 REPLICAS', '82%', 'dim']];
          o.res = [['824: 10 replicas at 82%', 'acc']]; if (g >= 1) T(o, top(5), '824', 'acc'); } },
      { id: 'evento', dur: 6, title: 'The event: the new screen, +15% → 950', yk: 'PROJECTION BY BUSINESS EVENT', act: ['Turn on the event', 'the new screen, +15%'],
        code: ['new home screen (module 9):', '  +15% requests per visit', '824 × 1.15 = 947.6 ≈ 950', 'with 10 replicas: 95%', '  R = 10 + 10 ÷ 0.05 = 210 ms'],
        story: 'The business is going to change the load: the module 9 new home screen makes <b>15% more requests</b> to the catalog per visit (example). 824 × 1.15 = <b>950</b>, the module 14 number. With the 2026 10 replicas, the catalog would go to <b>95%</b> (R = 210 ms): the plan made from the trend can\'t take the event.',
        look: 'The event column passes the others and the 10-cube fleet turns red.',
        key: 'The event has a date and an owner, and changes the projection more than history does.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1), on = g >= 1;
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['line', 750, 'dim'], ['comp.', 824, 'dim'], ['event', 824 + 126 * g, on ? 'bad' : 'acc', '950']], 1140, { maxW: 64 });
          o.rows.relL.name = 'catalog peak'; o.rows.relL.meta = 'REQ/S'; on ? bad(o, 'frotaP') : lit(o, 'frotaP');
          o.rows.frotaP = act('catalog', '10 REPLICAS'); o.rows.frotaP.foot = [['950 ÷ 1,000 = 95%', on ? 'bad' : 'acc'], ['R = 210 ms', on ? 'bad' : 'dim']];
          fleet(o, 10, FP, () => on ? 'bad' : 'on');
          o.cnt = [['10 REPLICAS', on ? '95%' : '82%', on ? 'bad' : 'acc'], ['2027 (EVENT)', '950', 'dim'], ['R', on ? '210 ms' : '…', 'dim']];
          o.res = on ? [['10 replicas at 95%: doesn\'t fit', 'bad']] : [['turning on the event…', 'dim']]; if (on) T(o, top(6), '950', 'bad'); } },
      { id: 'faixa', dur: 6, title: 'The 750 – 950 – 1,140 range with 14 replicas', yk: 'THE PLANNING RANGE', act: ['Raise to 14 replicas', '1,400 req/s'],
        code: ['margin: 950 × 1.2 = 1,140', '14 replicas = 1,400 req/s', '  750 → 53.6%', '  950 → 67.9%  (target: 70%)', '  1,140 → 81.4%  (the knee)'],
        story: 'The range the plan covers goes from <b>750</b> (the line) to <b>1,140</b> (950 × 1.2, the error margin), with <b>950</b> in the middle. With <b>14 replicas</b> (1,400 req/s), 950 sits at <b>67.9%</b>, within the target; 750 at 53.6%; and 1,140 at 81.4%, at the knee. The range shows how much each choice covers.',
        look: 'The margin column appears; the fleet gains 4 new cubes.',
        key: '14 replicas cover 950 at 67.9% and take 1,140 at the knee.',
        f(o) { show(o, 'relL', 'frotaP'); lit(o, 'frotaP');
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['line', 750, 'on'], ['comp.', 824, 'dim'], ['event', 950, 'acc'], ['margin', 1140, 'bad', '1,140']], 1140, { maxW: 56 });
          o.rows.relL.name = '2027 range'; o.rows.relL.meta = 'REQ/S';
          o.rows.frotaP = act('catalog', '14 REPLICAS'); o.rows.frotaP.foot = [['950 ÷ 1,400 = 67.9%', 'acc'], ['1,140 → 81.4% · 750 → 53.6%', 'dim']];
          fleet(o, 14, FP, i => i >= 10 ? 'new' : 'on');
          o.cnt = [['950 → 14 REPLICAS', '67.9%'], ['750', '53.6%', 'dim'], ['1,140', '81.4%', 'dim']];
          o.res = [['950 within the 70% target', 'acc']]; T(o, top(7), '1,140 → 81.4%', 'bad'); } },
      { id: 'checkout', dur: 6, title: 'The checkout: 45 · 200 · 300 orders/s', yk: 'THREE SCENARIOS',
        code: ['today: 30 orders/s', 'trend: 30 × (950 ÷ 640) = 44.5 ≈ 45', 'sales goal: 200', 'stress: 1.5 × the goal = 300', 'the extra 155: partners through the API'],
        story: 'For the checkout the math is different. Today it is <b>30 orders/s</b>. The trend gives 30 × 1.484 = <b>45/s</b>. The <b>sales goal is 200/s</b>, and the difference of <b>155/s</b> only exists if partners through the API sell without browsing the catalog. The planner asks the business where the 155 come from, and calculates what it costs to carry each scenario.',
        look: 'The relief changes scale: today, trend, goal and stress. The block beside it shows the conversion the goal requires.',
        key: 'Capacity planning doesn\'t predict: it calculates what each scenario costs.',
        f(o) { show(o, 'relL', 'chk'); lit(o, 'chk');
          const top = relief(o, 'relL', [['today', 30, 'on'], ['trend', 45, 'on'], ['goal', 200, 'acc'], ['stress', 300, 'dim']], 300, { maxW: 80 });
          o.rows.relL.name = '2027 checkout'; o.rows.relL.meta = 'ORDERS/S';
          o.rows.chk = act('where do the 155/s come from?', 'THE BUSINESS', ['goal − trend = 155/s', 'acc'], ['partners through the API', 'hi'], ['(without browsing the catalog)', 'dim'],
            ['conversion today:', 'dim'], ['  30 ÷ 640 = 4.7%', 'dim'], ['conversion of the goal:', 'dim'], ['  200 ÷ 950 = 21%', 'acc']);
          o.cnt = [['GOAL', '200/s'], ['TREND', '45/s', 'dim'], ['STRESS', '300/s', 'dim']];
          o.res = [['155/s come from partners', 'acc']]; T(o, top(2), '200 · goal', 'acc'); } },
      { id: 'errado', dur: 6, title: 'If it goes wrong: the goal that isn\'t the trend', yk: 'UNPLANNED NONLINEAR GROWTH',
        code: ['the plan follows the trend: 45/s', 'sales closes the goal: 200/s', 'today\'s chain takes 40/s', '  (pagamentos, 2 pods × 20/s)', '200 ÷ 40 = 5 × the capacity', 'p95 back to 800 ms, and worse'],
        story: 'The worst mistake isn\'t the catalog at 95%: it is <b>nonlinear</b> growth nobody planned. If the plan follows the trend (45/s) and sales closes the partners, <b>200 orders/s</b> arrive at a chain that today takes <b>40/s</b>, <code>pagamentos</code>. That is <b>5 times</b> the capacity, on a system already operating near its maximum.',
        look: 'The goal column goes far past today\'s capacity, the short column marked as the chain.',
        key: 'The business goal goes into the plan before it becomes traffic.',
        f(o) { show(o, 'relL', 'chk'); bad(o, 'chk');
          const top = relief(o, 'relL', [['chain today', 40, 'acc'], ['trend', 45, 'on'], ['goal', 200, 'bad'], ['stress', 300, 'dim']], 300, { maxW: 80 });
          o.rows.relL.name = 'demand × capacity'; o.rows.relL.meta = 'ORDERS/S';
          o.rows.chk = act('today\'s chain', 'CHECKOUT', ['pedidos: 90/s', 'dim'], ['pagamentos: 40/s', 'bad'], ['estoque: 1,000/s', 'dim'], ['DB: 250/s', 'dim'],
            ['minimum: 40/s', 'bad'], ['200 ÷ 40 = 5 ×', 'bad']);
          o.cnt = [['GOAL ÷ CHAIN', '5 ×', 'bad'], ['GOAL', '200/s', 'dim'], ['CHAIN TODAY', '40/s', 'dim']];
          o.res = [['200 on a chain of 40', 'bad']]; T(o, top(2), '200', 'bad'); T(o, top(0), '40 · today', 'acc'); } },
    ],
    cadeia: [
      { id: 'elos', dur: 6, title: 'Each link has its own limit', yk: 'SYSTEMIC TPS = MIN (…)',
        code: ['pedidos     3 × 30  =    90/s', 'pagamentos  2 × 20  =    40/s', 'estoque     2 × 500 = 1,000/s', 'DB (mkt-01 at 60%) = 250/s', 'minimum: 40/s → pagamentos'],
        story: 'The checkout crosses four links. Each has its own limit: <code>pedidos</code> <b>90/s</b>, <code>pagamentos</code> <b>40/s</b>, <code>estoque</code> <b>1,000/s</b> and the DB <b>250/s</b> effective. The chain is worth the minimum: <b>40/s</b>, <code>pagamentos</code>. The goal is 200.',
        look: 'The pipe is as wide as each link\'s capacity. The thinnest section, in red, is pagamentos.',
        key: 'The capacity the customer sees is that of the weakest link.',
        f(o) { chain(o, [90, 40, 1000, 250]);
          o.cnt = [['SYSTEMIC', '40/s', 'bad'], ['BOTTLENECK', 'pagamentos', 'dim'], ['DEMAND', '200/s', 'dim']];
          o.res = [['the whole chain is worth 40/s', 'bad']]; T(o, [LX[2] + 75, PIPE_Y, 60], '40/s', 'bad'); } },
      { id: 'pag', dur: 7, title: 'pagamentos 2 → 15 pods: the bottleneck moves', yk: 'FIXING ONE LINK', act: ['Scale pagamentos', '2 → 15 pods'],
        code: ['pagamentos: 15 × 20 = 300/s', 'minimum: 40 → 90/s', 'the bottleneck moves to pedidos', '  3 pods × 30/s = 90/s'],
        story: '<code>pagamentos</code> goes from 2 to <b>15 pods</b>: 15 × 20 = <b>300/s</b>. Its section widens, and the chain is now worth <b>90/s</b>. The bottleneck didn\'t disappear: it moved to <code>pedidos</code>, which is now the weakest.',
        look: 'The pagamentos section widens and the red jumps to the pedidos section.',
        key: 'Fixing one link reveals the next.',
        f(o, t) { const p = Math.round(lin(t, 0.4, 3, 2, 15)), { mn, gi } = chain(o, [90, p * 20, 1000, 250], { pods: [3, p, 2] });
          o.cnt = [['SYSTEMIC', mn + '/s', 'bad'], ['BOTTLENECK', gi.map(i => ['pedidos', 'pagamentos', 'estoque', 'DB'][i]).join(' and '), 'dim'], ['PAGAMENTOS', `${p} pods`, 'dim']];
          o.res = p >= 15 ? [['the bottleneck moved: pedidos, 90/s', 'bad']] : [['scaling…', 'dim']];
          if (p >= 15) T(o, [LX[1] + 75, PIPE_Y, 60], '90/s', 'bad'); } },
      { id: 'ped', dur: 7, title: 'pedidos 3 → 10 pods: now it is the DB', yk: 'THE BOTTLENECK MOVES AGAIN', act: ['Scale pedidos', '3 → 10 pods'],
        code: ['pedidos: 10 × 30 = 300/s', 'minimum: 90 → 250/s', 'the bottleneck moves to the DB', '  3 shards × 150, shard-2 hot'],
        story: '<code>pedidos</code> goes from 3 to <b>10 pods</b>: <b>300/s</b>. The minimum goes to <b>250/s</b>, and the bottleneck is now the <b>DB</b>. The 3 shards add up to 450/s nominal, but <code>shard-2</code>, with <code>mkt-01</code>, gets 60% of the traffic and limits the whole to 250.',
        look: 'The pedidos section widens and the red jumps to the DB.',
        key: 'Each step of the plan finds the next link.',
        f(o, t) { const p = Math.round(lin(t, 0.4, 3, 3, 10)), { mn, gi } = chain(o, [p * 30, 300, 1000, 250], { pods: [p, 15, 2] });
          o.cnt = [['SYSTEMIC', mn + '/s', 'bad'], ['BOTTLENECK', gi.map(i => ['pedidos', 'pagamentos', 'estoque', 'DB'][i]).join(' and '), 'dim'], ['PEDIDOS', `${p} pods`, 'dim']];
          o.res = p >= 10 ? [['the bottleneck moved: the DB, 250/s', 'bad']] : [['scaling…', 'dim']];
          if (p >= 10) T(o, [LX[4] + 75, PIPE_Y, 60], '250/s', 'bad'); } },
      { id: 'quente', dur: 6, title: 'The DB: mkt-01\'s hot shard', yk: '200 × 0.6 = 120/s ON A 150 SHARD',
        code: ['mkt-01: 60% of the traffic on shard-2', '200 × 0.6 = 120/s → 80% (the knee)', 'shard-0 and shard-1: 40/s → 26.7%', 'efficiency: 250 of 450 nominal', 'more equal shards don\'t fix it'],
        story: 'Inside the DB: <code>mkt-01</code> sends <b>60%</b> of the traffic to <code>shard-2</code>. With the 200/s goal, that is 200 × 0.6 = <b>120/s on a 150 shard</b>: <b>80%</b>, at the knee. The other two get 40/s each, at 26.7%. Adding equal shards doesn\'t fix it, because <code>mkt-01</code> stays whole on one of them.',
        look: 'In the DB block, the shard-2 bar goes to 80%, in red; the other two stay low.',
        key: 'Uneven load: the hot shard limits the whole DB.',
        f(o) { chain(o, [300, 300, 1000, 250], { pods: [10, 15, 2] });
          o.rows.db = act('DB', 'HOT SHARD', ['shard-2: 120 of 150/s', 'bad']); o.rows.db.shards = { n: 3, loads: [26.7, 26.7, 80] };
          o.cnt = [['SHARD-2', '80%', 'bad'], ['OTHERS', '26.7%', 'dim'], ['EFFECTIVE', '250/s', 'dim']];
          o.res = [['mkt-01 heats up shard-2', 'bad']]; T(o, [LX[4] + 75, LY + 20, 120], 'shard-2 · 80%', 'bad'); } },
      { id: 'dedicado', dur: 6, title: 'Dedicated 2× shard for mkt-01: 300/s', yk: 'THE T = 750 MATH (MODULE 16)', act: ['Give it a dedicated shard', '2× for mkt-01'],
        code: ['dedicated 2× (300/s): mkt-01, 80/s', '  → 26.7%', '3 normal: (200 − 80) ÷ 3 = 40/s', '  → 26.7% each', 'DB: 750/s; minimum: 300/s', 'sustainable: 70% × 300 = 210/s'],
        story: '<code>mkt-01</code> gets a <b>dedicated 2× shard</b> (300/s). With 40% of the orders (80/s), it sits at <b>26.7%</b>, and the three normal ones, with 40/s each, do too. The DB goes to <b>750/s</b> and the chain to <b>300/s</b>, with <code>pedidos</code> and <code>pagamentos</code> tied. That is <b>nominal</b> capacity: the <b>sustainable</b> one is 70% of it, <b>210/s</b>, against the goal of 200. It fits, with about 5% slack.',
        look: 'The DB gains the fourth shard, a bigger one; the pipe gets wide from end to end and the red goes to the two tied services.',
        key: 'Sustainable is not nominal: 210 against 200, with 5% slack.',
        f(o) { const { mn } = chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' });
          o.cnt = [['SYSTEMIC', mn + '/s'], ['SUSTAINABLE', '210/s', 'dim'], ['SLACK', '~5%', 'dim']];
          o.res = [['210 sustainable against 200', 'acc']]; T(o, [LX[4] + 75, PIPE_Y, 60], '750/s', 'acc'); } },
      { id: 'lag', dur: 9, title: 'The asynchronous link: the entregas lag', yk: '3 PARTITIONS × 40/s = 120/s',
        code: ['200 events/s arrive', 'consumes 3 × 40 = 120/s', 'the lag grows 80/s', '4 h of event: 1,152,000 events', 'afterwards (5/s): 115/s net', '  10,017 s ≈ 2.8 h to drain'],
        story: '<code>pedidos</code> publishes to the Kafka <code>pedidos</code> topic, and <code>entregas</code> consumes with <b>3 partitions</b> of 40 events/s: <b>120/s</b> against 200/s arriving. The lag grows <b>80 per second</b>, and over the event\'s 4 hours it reaches <b>1,152,000</b> events. After the peak it takes <b>2.8 h</b> to drain. It doesn\'t take down the checkout, but it delays tracking.',
        look: 'The pile to the right of entregas grows hour by hour up to 1,152,000.',
        key: 'The asynchronous link doesn\'t take the chain down: it delays it.',
        f(o, t) { chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' }); const h = lin(t, 0.5, 7, 0, 4), lag = 80 * 3600 * h;
          bad(o, 'ent'); lit(o, 'top');
          o.rows.ent = act('entregas', 'DELAYED', ['3 × 40 = 120/s', 'bad'], ['200/s arrive', 'dim'], [`lag: +80/s · ${dec(h, 1)} h`, 'bad']);
          o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]], on: 1, flow: 1 }, { pts: [[420, 365, Z], [450, 365, Z]], tone: 'bad', flow: 1 }];
          o.piles.push({ p: [760, 365, PL + 2], v: lag, f: lag / 1152000 });
          o.cnt = [['LAG', thou(lag), 'bad'], ['TIME', dec(h, 1) + ' h', 'dim'], ['TO DRAIN', '2.8 h', 'dim']];
          o.res = h >= 4 ? [['1,152,000 delayed events', 'bad']] : [['the lag is growing…', 'dim']]; } },
      { id: 'particoes', dur: 6, title: '3 → 8 partitions: ρ = 62.5%', yk: 'THE ENTREGAS PLAN', act: ['Go to 8 partitions', '320/s'],
        code: ['8 partitions × 40/s = 320/s', 'ρ = 200 ÷ 320 = 62.5%', 'lag: doesn\'t grow', 'careful (module 16): N changes murmur2 mod N', '  3 → 6 moves ~50% of the keys'],
        story: 'The plan takes the topic from 3 to <b>8 partitions</b>: 8 × 40 = <b>320/s</b>, and <code>entregas</code> sits at <b>62.5%</b>. The lag stops growing. A module 16 caution: changing the number of partitions changes <code>murmur2 mod N</code>, and going from 3 to 6 moves about half the keys. It is changed before the event, not during it.',
        look: 'The topic gains 8 lit lanes and the pile disappears.',
        key: 'A partition is the consumer\'s unit of parallelism.',
        f(o) { chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' }); lit(o, 'top', 'ent');
          o.rows.top = act('pedidos topic', 'KAFKA', ['8 partitions', 'acc']); o.rows.top.parts = { n: 8, on: 8 };
          o.rows.ent = act('entregas', 'CONSUMER', ['8 × 40 = 320/s', 'acc'], ['200/s arrive', 'dim'], ['ρ = 62.5%', 'acc']);
          o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]], on: 1, flow: 1 }, { pts: [[420, 365, Z], [450, 365, Z]], on: 1, flow: 1 }];
          o.cnt = [['ENTREGAS', '62.5%'], ['CONSUMPTION', '320/s', 'dim'], ['LAG', 'stable', 'dim']];
          o.res = [['320/s against 200: no lag', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'If it goes wrong: scaling the most expensive link', yk: 'THE BOTTLENECK IS THE MINIMUM', act: ['Scale estoque', '2 → 4 pods'],
        code: ['back to today\'s chain', 'estoque: 2 → 4 pods (2,000/s)', '"stock is critical"', 'chain output: 40/s', '  the same as before'],
        story: 'Back to today\'s chain. The team scales <code>estoque</code> from 2 to 4 pods, because "stock is critical". Its section becomes the widest in the pipe, <b>2,000/s</b>, and the chain\'s output stays at <b>40/s</b>. The bottleneck is the <b>minimum</b>, not the most expensive or the most important one.',
        look: 'The estoque section fattens; the thin red pagamentos section stays the same.',
        key: 'Scaling another link spends money without moving the output.',
        f(o, t) { const p = t > 1 ? 4 : 2; chain(o, [90, 40, p * 500, 250], { pods: [3, 2, p] });
          o.cnt = [['OUTPUT', '40/s', 'bad'], ['ESTOQUE', thou(p * 500) + '/s', 'dim'], ['SPENT', p > 2 ? '+2 pods' : '…', 'dim']];
          o.res = p > 2 ? [['+2 pods and the output didn\'t change', 'bad']] : [];
          if (p > 2) { T(o, [LX[3] + 75, PIPE_Y, 70], '2,000/s', 'dim'); T(o, [LX[2] + 75, PIPE_Y, 60], '40/s', 'bad'); } } },
    ],
    plano: [
      { id: 'hoje', dur: 5, title: 'Black Friday 2026: 17 vCPU', yk: '1 REPLICA = 1 vCPU',
        code: ['catalog     10', 'pedidos      3', 'pagamentos   2', 'estoque      2', 'total       17 vCPU (ordinary day: 9)'],
        story: 'The starting point: Black Friday 2026 ran with catalog <b>10</b> + <code>pedidos</code> <b>3</b> + <code>pagamentos</code> <b>2</b> + <code>estoque</code> <b>2</b> = <b>17 vCPU</b>, with the DB on 3 shards and the topic on 3 partitions. On an ordinary day it is 9. That fleet left the checkout at 40 orders/s.',
        look: 'One slab per service, one cube per replica; in front, the shards, the partitions and the blank sheet.',
        key: 'The plan starts from what exists.',
        f(o) { planBase(o, [10, 3, 2, 2]);
          o.rows.shards = act('pedidos DB', '3 SHARDS'); o.rows.shards.shards = SHARDS(false);
          o.rows.parts = act('pedidos topic', '3 PARTITIONS'); o.rows.parts.parts = { n: 3, on: 3 };
          o.rows.ficha = act('limits sheet', '2027', ['to be filled in', 'dim']);
          o.cnt = [['vCPU', '17'], ['ORDINARY DAY', '9', 'dim'], ['CHECKOUT', '40/s', 'dim']];
          o.res = [['17 vCPU in 2026', 'acc']]; } },
      { id: 'pecas', dur: 6, title: 'The 2027 plan: 41 vCPU', yk: '14 · 10 · 15 · 2 + 4 SHARDS + 8 PARTITIONS', act: ['Assemble the 2027 plan', '14 · 10 · 15 · 2'],
        code: ['catalog     14  (19 with 5% search)', 'pedidos     10', 'pagamentos  15', 'estoque      2', 'total       41 vCPU (+24)', 'DB 4 shards · topic 8 partitions'],
        story: 'The 2027 plan puts together the previous lessons: catalog <b>14</b> (19 if the mix has 5% search), <code>pedidos</code> <b>10</b>, <code>pagamentos</code> <b>15</b>, <code>estoque</code> <b>2</b>: <b>41 vCPU</b>, 24 more than in 2026. The DB goes to <b>4 shards</b> (the dedicated 2× one for <code>mkt-01</code>) and the topic to <b>8 partitions</b>.',
        look: 'New cubes light up on each slab; the fourth shard and the five new partitions appear.',
        key: '41 vCPU at the peak, 24 more than in 2026.',
        f(o) { planBase(o, [14, 10, 15, 2], [10, 3, 2, 2]); GN.forEach(g => lit(o, g));
          o.rows.gCat.foot = [['14 replicas', 'hi'], ['19 with 5% search', 'dim']];
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true); lit(o, 'shards');
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 }; lit(o, 'parts');
          o.rows.ficha = act('limits sheet', '2027', ['to be filled in', 'dim']);
          o.cnt = [['vCPU', '41'], ['IN 2026', '17', 'dim'], ['EXTRA', '+24', 'dim']];
          o.res = [['41 vCPU at the 2027 peak', 'acc']]; } },
      { id: 'horas', dur: 10, title: 'Replica-hours: 984 fixed × 344 elastic', yk: 'THE DAY\'S COST',
        code: ['fixed fleet: 24 h × 41 = 984', 'elastic: 41 in the 4 peak hours', '  and 9 in the other 20', '  4 × 41 + 20 × 9 = 344', '344 ÷ 984 = 35% of the fixed one', 'module 14: 33%, the same range'],
        story: 'A <b>fixed</b> fleet of 41 all day costs 24 × 41 = <b>984 replica-hours</b>. An <b>elastic</b> fleet has 41 only in the 4 peak hours and 9 the rest: 4 × 41 + 20 × 9 = <b>344</b>, 35% of the fixed one. The plan counts the day\'s cost, not just the size of the peak.',
        look: 'The clock runs 24 hours: the fleet stays at 9 cubes until the evening, grows to 41 at the peak and the counter adds up the replica-hours.',
        key: 'The elastic fleet costs 35% of the fixed one.',
        f(o, t) { const h = lin(t, 0.3, 8.3, 0, 24), peak = h >= 20, rh = 9 * Math.min(h, 20) + 41 * Math.max(0, h - 20);
          const COMUM = [2, 3, 2, 2]; planBase(o, peak ? [14, 10, 15, 2] : COMUM, null, () => peak ? 'on' : 'on'); GN.forEach(g => lit(o, g));
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('replica-hours', 'PER DAY', [`${String(Math.floor(h)).padStart(2, '0')}h · fleet: ${peak ? 41 : 9}`, peak ? 'acc' : 'dim'], [`elastic: ${thou(rh)}`, 'acc'], [`fixed: ${thou(41 * h)}`, 'dim']); lit(o, 'ficha');
          o.cnt = [['ELASTIC', thou(rh)], ['FIXED', thou(41 * h), 'dim'], ['HOUR', String(Math.floor(h)).padStart(2, '0') + 'h', 'dim']];
          o.res = h >= 24 ? [['344 × 984: 35% of the fixed one', 'acc']] : [[peak ? 'peak: 41 replicas' : 'ordinary day: 9 replicas', 'dim']]; } },
      { id: 'preescala', dur: 6, title: 'Pre-scale at 19:50', yk: 'THE EVENT HAS A SET TIME',
        code: ['HPA: reacts in ~60 s (module 14)', 'newsletter: 20:00 (known)', 'scheduled scaling: 19:50 → 41', 'at 20:00 the fleet is already there', 'freeze: 3 days before'],
        story: 'The HPA reacts in about <b>60 s</b>, and the newsletter burst arrives in seconds. Since the time is <b>known</b> (20:00), the plan says to <b>pre-scale at 19:50</b> with a scheduled scaling, instead of waiting for the metric to climb. And there is a <b>freeze</b>: code changes stop 3 days before Black Friday, except for operation flags.',
        look: 'The whole fleet is already up before the burst; the sheet shows 19:50.',
        key: 'A known event is scaled before, not after.',
        f(o) { planBase(o, [14, 10, 15, 2]); GN.forEach(g => lit(o, g));
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('the night\'s schedule', 'BF 2027', ['19:50 scheduled scaling → 41', 'acc'], ['20:00 newsletter', 'hi'], ['HPA: ~60 s, arrives late', 'dim'], ['freeze: 3 days before', 'dim']); lit(o, 'ficha');
          o.cnt = [['PRE-SCALE', '19:50'], ['NEWSLETTER', '20:00', 'dim'], ['HPA', '~60 s', 'dim']];
          o.res = [['at 20:00 the fleet is already there', 'acc']]; } },
      { id: 'emergencia', dur: 6, title: 'The emergency slack: 1,867 and 2,333 req/s', yk: 'DEGRADING IS THE LAST RESORT',
        code: ['module 21 levels (catalog):', '  7.5 ms → 133 req/s per replica', '  6 ms → 167 req/s per replica', '14 × 133 = 1,867 req/s', '14 × 167 = 2,333 req/s', 'the plan counts it, but doesn\'t depend on it'],
        story: 'The module 21 emergency capacity also enters the math. By degrading the catalog, a replica spends 7.5 ms (133 req/s) or 6 ms (167 req/s), and the same 14 replicas serve <b>1,867</b> or <b>2,333 req/s</b> with none extra. The plan <b>counts</b> this slack but <b>doesn\'t depend</b> on it: degrading is the last resort.',
        look: 'The catalog slab shows the three capacities of the same 14 replicas.',
        key: 'The degradation slack exists, and the plan doesn\'t lean on it.',
        f(o) { planBase(o, [14, 10, 15, 2]); lit(o, 'gCat');
          o.rows.gCat.foot = [['1,400 · 1,867 · 2,333', 'acc'], ['req/s (normal · level 1 · 2)', 'dim']];
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('emergency', 'MODULE 21', ['14 × 133 = 1,867 req/s', 'acc'], ['14 × 167 = 2,333 req/s', 'acc'], ['counts, doesn\'t depend', 'dim']);
          o.cnt = [['DEGRADED', '2,333 req/s'], ['LEVEL 1', '1,867', 'dim'], ['NORMAL', '1,400', 'dim']];
          o.res = [['known slack, not planned', 'acc']]; } },
      { id: 'ficha', dur: 6, title: 'The limits sheet', yk: 'THE DELIVERABLE IS THE SHEET, NOT A NUMBER',
        code: ['sustainable: 980 req/s · 210 orders/s', 'p95 ≤ 300 ms (catalog) · ≤ 800 (checkout)', 'errors ≤ 0.1% · ρ ≤ 70%', 'pagamentos target L: 4 per pod', 'PSP pool: 150 connections', 'trigger: > 210/s, > 980 or L > 4'],
        story: 'The result of the plan is a <b>limits sheet</b>: sustainable <b>980 req/s</b> on the catalog (14 × 100 × 0.7) and <b>210 orders/s</b> on the checkout; p95 ≤ 300 and ≤ 800 ms; errors ≤ 0.1%; ρ ≤ 70%; <code>pagamentos</code> target L = 4 per pod; PSP pool with 150 connections. And the <b>re-evaluation trigger</b>: past 210/s, 980 req/s or L = 4, the math is redone.',
        look: 'The sheet lights up with the limits; it is the paper sales and the on-call read.',
        key: 'The plan is a sheet with limits and triggers.',
        f(o) { planBase(o, [14, 10, 15, 2]); lit(o, 'ficha');
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('limits sheet', '2027', ['980 req/s · 210 orders/s', 'acc'], ['p95 ≤ 300 · ≤ 800 ms', 'hi'], ['errors ≤ 0.1% · ρ ≤ 70%', 'hi'], ['target L 4 · PSP pool 150', 'hi'], ['trigger: > 210/s or L > 4', 'acc']);
          o.cnt = [['SUSTAINABLE', '210/s'], ['CATALOG', '980 req/s', 'dim'], ['TRIGGER', 'L > 4', 'dim']];
          o.res = [['limits, goals and triggers', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'If it goes wrong: the nominal 300 with no test', yk: 'A PLAN WITHOUT A TEST IS A HYPOTHESIS',
        code: ['the plan says 300/s (nominal)', 'nobody measured:', '  the DB\'s max_connections', '  the Kafka queue · the PSP limit', '  the BF mix × the ordinary day\'s', 'the breakpoint may come before 300'],
        story: 'The plan says <b>300/s</b>, and the math is <b>nominal</b> capacity: each pod\'s CPU and the DB per primary. Nobody measured the connection pool (<code>max_connections</code>), the Kafka queue, the PSP limit or the difference between the ordinary day\'s mix and Black Friday\'s. A plan without a test is a <b>hypothesis</b>, and the <i>breakpoint</i> test may find the limit before 300.',
        look: 'Each piece gets its own question in red: what hasn\'t been measured yet.',
        key: 'Every number was calculated; module 24 says which ones hold up.',
        f(o) { planBase(o, [14, 10, 15, 2]); bad(o, 'ficha');
          o.rows.shards = act('pedidos DB', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('pedidos topic', '8 PARTITIONS'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('limits sheet', 'HYPOTHESIS', ['300/s nominal', 'bad'], ['measured: ?', 'bad'], ['next: load test', 'acc'], ['(module 24)', 'dim']);
          o.cnt = [['NOMINAL', '300/s', 'bad'], ['MEASURED', '?', 'dim'], ['NEXT', 'module 24', 'dim']];
          o.res = [['300 is math, not measured', 'bad']];
          T(o, [156, 140, 70], 'the mix?', 'bad'); T(o, [618, 140, 70], 'PSP limit?', 'bad'); T(o, [165, 300, 50], 'max_connections?', 'bad'); T(o, [420, 300, 50], 'Kafka queue?', 'bad'); } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); if (o.after) o.after(o); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11, y = s1 > 15 ? 13 : 11) {   // nome à esquerda, papel à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(y)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, Math.min(11, s1 - 2), W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(y)); x.textAlign = 'left'; } }
  // shards: uma caixa por shard com a barra da carga (o dedicado é mais largo)
  function drawShards(x, u, C, p, W_, H_, y0) {
    const n = p.n, gap = 5, unit = (W_ - 10 - gap * (n - 1)) / (n + (p.ded >= 0 ? 1 : 0)), h = H_ - y0 - 8;
    let X = 5;
    for (let i = 0; i < n; i++) { const w = unit * (i === p.ded ? 2 : 1), ld = p.loads[i], hot = ld >= 70, tn = hot ? BAD() : accC();
      x.strokeStyle = hot ? BAD() : C.line; x.lineWidth = u(0.6); x.strokeRect(u(X), u(y0), u(w), u(h));
      const bh = (h - 32) * ld / 100; x.fillStyle = tn; x.fillRect(u(X + 3), u(y0 + h - 3 - bh), u(w - 6), u(bh));
      x.textAlign = 'center'; x.fillStyle = hot ? BAD() : toneC('hi'); const lab = i === p.ded ? (w < 60 ? 'mkt-01' : 'mkt-01 2×') : (w < 34 ? 's-' : 'shard-') + i;
      fitFont(x, u, lab, 12, w - 3); x.fillText(lab, u(X + w / 2), u(y0 + 9));
      x.fillStyle = hot ? BAD() : toneC('hi'); fitFont(x, u, dec(ld, 1) + '%', 12, w - 3); x.fillText(dec(ld, 1) + '%', u(X + w / 2), u(y0 + 23));
      X += w + gap; }
    x.textAlign = 'left';
  }
  // partições: n faixas verticais
  function drawParts(x, u, C, p, W_, H_, y0) {
    const n = p.n, gap = 4, w = (W_ - 10 - gap * 7) / 8, h = H_ - y0 - 8;
    for (let i = 0; i < 8; i++) { const X = 5 + i * (w + gap), have = i < n;
      x.strokeStyle = have ? accC() : C.line; x.lineWidth = u(have ? 0.9 : 0.4); x.setLineDash(have ? [] : [u(2), u(2)]); x.strokeRect(u(X), u(y0), u(w), u(h)); x.setLineDash([]);
      if (have) { x.fillStyle = accC(); x.globalAlpha = 0.35; x.fillRect(u(X + 2), u(y0 + 2), u(w - 4), u(h - 4)); x.globalAlpha = 1;
        x.fillStyle = toneC('hi'); x.textAlign = 'center'; fitFont(x, u, 'p' + i, 12, w - 2); x.fillText('p' + i, u(X + w / 2), u(y0 + h / 2)); x.textAlign = 'left'; } }
  }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, cf = Bk.cfg, fs = d.fs || cf.fs, lh = d.lh || cf.lh;
    // lajes (colunas e cubos em cima): nome, rodapé e eixo vão para a borda da frente, que nada tapa
    if (cf === SLAB) { if (d.name) head(x, u, d, W_, col, cf.s1, H_ - 12);
      (d.foot || []).forEach(([text, tn], i, a) => { x.fillStyle = toneC(tn); fitFont(x, u, text, i ? 12 : 15, W_ - 10); x.fillText(text, u(5), u(H_ - 32 - (a.length - 1 - i) * 18)); }); }
    else if (d.name) { head(x, u, d, W_, col, cf.s1); const ly = cf.s1 > 15 ? 25 : cf.s1 > 13 ? 21 : 20;
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(ly)); x.lineTo(u(W_ - 4), u(ly)); x.stroke(); }
    let y = d.y0 || cf.y0;
    (d.rows || []).forEach(([text, tn]) => { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, fs, W_ - 10); x.fillText(text, u(5), u(y)); } y += lh; });
    if (d.shards) drawShards(x, u, C, d.shards, W_, H_, d.rows && d.rows.length ? y - 4 : 28);
    if (d.parts) drawParts(x, u, C, d.parts, W_, H_, d.rows && d.rows.length ? y - 4 : 28);
    // eixo do relevo: rótulo e valor embaixo de cada coluna
    if (d.axis) { x.textAlign = 'center'; const mw = Math.max(14, d.pitch * (d.axis.length < 12 && d.pitch < 40 ? 2.6 : 1) - 3);
      d.axis.forEach(([xl, lab, val, tn]) => { const X = xl - 2.5;
        x.fillStyle = toneC(tn === 'dim' ? 'dim' : tn); fitFont(x, u, lab, Math.min(14, mw * 0.24), mw); x.fillText(lab, u(X), u(H_ - 58));
        if (val) { x.fillStyle = toneC(tn === 'dim' ? 'hi' : tn); fitFont(x, u, val, Math.min(17, mw * 0.3), mw); x.fillText(val, u(X), u(H_ - 37)); } });
      x.textAlign = 'left'; }
    cv.tex.needsUpdate = true;
  }
  function cubeFace(Cb, lab, st) {
    const key = lab + st + theme + accent.getHex(); if (Cb.key === key) return; Cb.key = key;
    const cv = Cb.top, { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P, C = pal3();
    const b = st === 'bad' || st === 'ghost', on = st === 'on' || st === 'new';
    x.fillStyle = b ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = b ? BAD() : on ? accC() : C.line; x.lineWidth = u(0.5); x.strokeRect(u(0.3), u(0.3), cv.c.width - u(0.6), cv.c.height - u(0.6));
    x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = b ? BAD() : on ? accC() : INK();
    let fs = lab.length > 2 ? 3 : 4.4; x.font = `700 ${u(fs)}px ${MONO3}`; const tw = x.measureText(lab).width;
    if (tw > u(W_ - 1.2)) { fs *= u(W_ - 1.2) / tw; x.font = `700 ${u(fs)}px ${MONO3}`; } x.fillText(lab, u(W_ / 2), u(H_ / 2 + 0.2)); x.textAlign = 'left'; cv.tex.needsUpdate = true;
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { if (pl.v <= 0) continue; const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
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
  const on_ = (c) => c ? ' class="on"' : '';
  const DATA = {
    carga: () => `<table class="h3-sum"><tr><th>search</th><th>avg CPU</th><th>per replica</th><th>950 at 70%</th></tr><tr${on_(step === 3)}><td>0%</td><td>10 ms</td><td>100 req/s</td><td>14</td></tr><tr${on_(step === 4 || step === 7)}><td>5%</td><td>13.5 ms</td><td>74.1 req/s</td><td>19</td></tr><tr${on_(step === 5)}><td>10%</td><td>17 ms</td><td>58.8 req/s</td><td>24</td></tr></table><li>TPS: 38,400 ÷ 60 = <b>640 req/s</b> (2026 peak, 20:03)</li><li>Concurrency: L = 640 × 0.0378 = <b>24.2</b> in flight</li><li>Bandwidth: 640 × 20 KB = <b>105 Mbit/s</b>; 950 req/s: 156; +10% retries: 171</li><li>10 ms burst: 64 per replica, the last waits <b>640 ms</b> (average ~320); spread out, 37.8 ms</li><li>With 14 replicas and 5% search: 950 ÷ (14 × 74.1) = <b>91.6%</b> CPU</li>`,
    perfis: () => `<table class="h3-sum"><tr><th>window</th><th>what it shows</th></tr><tr${on_(step === 4)}><td>1 minute (20:03)</td><td>640 req/s</td></tr><tr${on_(step === 3 || step === 4)}><td>1 day (Black Friday)</td><td>400 req/s average</td></tr><tr${on_(step === 2 || step === 4)}><td>1 month (November)</td><td>58 req/s average</td></tr><tr${on_(step === 0)}><td>ordinary day, peak</td><td>81.5 req/s at 9 pm</td></tr><tr${on_(step === 5)}><td>1 second (20:20)</td><td>1,300 req/s (module 21)</td></tr></table><li>Ordinary day (example, average 40): 8.2 · 6.1 · <b>4.1</b> · 4.1 · 4.1 · 8.2 · 16.3 · 28.5 · 40.8 · 48.9 · 53.0 · 57.1 · 61.1 · 53.0 · 48.9 · 48.9 · 53.0 · 57.1 · 61.1 · 69.3 · 77.5 · <b>81.5</b> · 48.9 · 20.4</li><li>Week: Mon 1.05 · Tue 1.00 · Wed 1.00 · Thu 1.05 · <b>Fri 1.15</b> · Sat 0.90 · Sun 0.85 (sum 7.00)</li><li>Year: Jan 0.85 · Feb 0.80 · Mar 0.90 · Apr 0.90 · May 1.00 · Jun 0.95 · Jul 0.90 · Aug 0.95 · Sep 1.00 · Oct 1.10 · <b>Nov 1.45</b> · Dec 1.20 (sum 12.00)</li><li>640 ÷ 81.5 = <b>7.9</b>; 640 ÷ 58 = <b>11</b></li>`,
    projecao: () => `<table class="h3-sum"><tr><th>demand</th><th>10 replicas</th><th>14 replicas</th></tr><tr${on_(step === 1)}><td>750 · line</td><td>75% (R = 50 ms)</td><td>53.6%</td></tr><tr${on_(step === 2)}><td>824 · compound</td><td>82%</td><td>—</td></tr><tr${on_(step === 3 || step === 4)}><td>950 · event</td><td>95% (R = 210 ms)</td><td>67.9%</td></tr><tr${on_(step === 4)}><td>1,140 · margin</td><td>—</td><td>81.4% (the knee)</td></tr></table><li>Series (example): 2023: 300 · 2024: 410 · 2025: 520 · 2026: 640</li><li>Line: +113 per year → <b>750</b>; compound: 28.7% per year → <b>824</b>; event: 824 × 1.15 → <b>950</b></li><li>R(ρ) = 10 ms + 10 ms ÷ (1 − ρ) on the catalog (module 14)</li><li>Checkout: today 30 · trend 45 · goal 200 · stress 300 orders/s; conversion 4.7% → 21%</li>`,
    cadeia: () => `<table class="h3-sum"><tr><th>step</th><th>ped.</th><th>pag.</th><th>DB</th><th>min.</th></tr><tr${on_(step === 0 || step === 7)}><td>today</td><td>90</td><td>40</td><td>250</td><td>40</td></tr><tr${on_(step === 1)}><td>pagamentos 2 → 15</td><td>90</td><td>300</td><td>250</td><td>90</td></tr><tr${on_(step === 2 || step === 3)}><td>pedidos 3 → 10</td><td>300</td><td>300</td><td>250</td><td>250</td></tr><tr${on_(step >= 4 && step <= 6)}><td>dedicated 2× shard</td><td>300</td><td>300</td><td>750</td><td>300</td></tr></table><li>Estoque: 2 pods × 500/s = 1,000/s (with 4 pods, 2,000/s, and the output doesn't change)</li><li>Sustainable: 70% × 300 = <b>210/s</b> against the goal of 200 (~5% slack); at 300/s the chain goes to 100%</li><li>Hot shard: 200 × 0.6 = 120/s on a 150 shard (80%); dedicated 2×: 80/s on 300 (26.7%)</li><li>Entregas: 3 × 40 = 120/s against 200/s → lag of <b>1,152,000</b> in 4 h, 2.8 h to drain; 8 partitions: 320/s, ρ = 62.5%</li>`,
    plano: () => `<table class="h3-sum"><tr><th>service</th><th>ordinary day</th><th>BF 2026</th><th>BF 2027</th></tr><tr><td>catalog</td><td>2</td><td>10</td><td>14 (19 with search)</td></tr><tr><td>pedidos</td><td>3</td><td>3</td><td>10</td></tr><tr><td>pagamentos</td><td>2</td><td>2</td><td>15</td></tr><tr><td>estoque</td><td>2</td><td>2</td><td>2</td></tr><tr class="on"><td>vCPU</td><td>9</td><td>17</td><td>41</td></tr></table><li>DB: 4 shards (the dedicated 2× one for <code>mkt-01</code>); <code>pedidos</code> topic: 8 partitions</li><li>Replica-hours per day: fixed 24 × 41 = <b>984</b>; elastic 4 × 41 + 20 × 9 = <b>344</b> (35%)</li><li>Pre-scale at 19:50; change freeze 3 days before Black Friday (11/26/2027)</li><li>Sheet: 980 req/s · 210 orders/s · p95 ≤ 300 / 800 ms · errors ≤ 0.1% · ρ ≤ 70% · target L 4 · PSP pool 150</li><li>Re-evaluation trigger: &gt; 210 orders/s, &gt; 980 req/s or L &gt; 4 on <code>pagamentos</code></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte e leva até ele
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
  function readout() { if (active !== 'bf') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'bf' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { if (v !== sc) { CUBES.forEach(c => c.f = 0); BARS.forEach(b => b.f = 0); } sc = v; try { localStorage.setItem('sdlabs-bf3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'bf') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const stEm = st => st === 'bad' || st === 'ghost' ? [badEm, st === 'ghost' ? 0.12 : 0.4] : st === 'new' ? [accent, 0.7] : st === 'on' || st === 'acc' ? [accent, st === 'acc' ? 0.55 : 0.25] : [accent, 0.06];
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? (Bk.h < 8 ? 0.12 : 0.3) : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.h >= 8 ? 0.3 : 0); });
    // colunas do relevo: a altura persegue o alvo
    BARS.forEach((Br, i) => { const b = o.bars[i]; const want = b ? 1 : 0;
      Br.f += Math.sign(want - Br.f) * Math.min(Math.abs(want - Br.f), dt / 0.4);
      if (b) { Br.h += (b.h - Br.h) * Math.min(1, dt / 0.25); Br.x = b.x; Br.y = b.y; Br.w = b.w; Br.d = b.d; Br.st = b.st; }
      Br.g.visible = Br.f > 0.01 && Br.w > 0;
      if (Br.g.visible) { const h = Math.max(0.3, Br.h * ease(clamp(Br.f)));
        Br.g.position.copy(W(Br.x, Br.y, PL + 6)); Br.g.scale.set(Br.w / 10, h / 10, Br.d / 10);
        const [em, k] = stEm(Br.st); Br.mat.emissive.copy(em); Br.mat.emissiveIntensity = k;
        moveGlow(Br.glow, [Br.x + Br.w / 2, Br.y + Br.d / 2, PL + 6 + h + 3], Br.st === 'acc' || Br.st === 'bad' ? 0.35 : 0); }
      else Br.glow.material.uniforms.intensity.value = 0; });
    // a frota: cada cubo sobe do chão quando aparece
    CUBES.forEach((Cb, i) => { const c = o.fleet[i]; const want = c ? 1 : 0;
      Cb.f += Math.sign(want - Cb.f) * Math.min(Math.abs(want - Cb.f), dt / 0.45);
      if (c) { Cb.x = c.x; Cb.y = c.y; Cb.s = c.s; Cb.st = c.st; cubeFace(Cb, c.lab, c.st); }
      Cb.g.visible = Cb.f > 0.01 && Cb.s > 0;
      if (Cb.g.visible) { const e = ease(clamp(Cb.f)), hs = Cb.st === 'ghost' ? 0.12 : 1;
        Cb.flat += (hs - Cb.flat) * Math.min(1, dt / 0.25);
        Cb.g.position.copy(W(Cb.x, Cb.y, PL + 6 - (1 - e) * (Cb.s + 8))); Cb.g.scale.set(Cb.s / 10, Cb.s * Cb.flat / 10, Cb.s / 10);
        const [em, k] = stEm(Cb.st); Cb.mat.emissive.copy(em); Cb.mat.emissiveIntensity = k;
        moveGlow(Cb.glow, [Cb.x + Cb.s / 2, Cb.y + Cb.s / 2, PL + 6 + Cb.s * Cb.flat + 3], Cb.st === 'new' && e > 0.9 ? 0.45 : 0); }
      else Cb.glow.material.uniforms.intensity.value = 0; });
    nDot = 0; setBeams(o.beams); setPipes(o.pipes, dt); o.dots.forEach(([p, tn]) => dot(p, tn));
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
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CARDS.map(c => c.top), ...CUBES.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); CARDS.forEach(c => c.key = ''); CUBES.forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; });
    o.bars.forEach((b, i) => Object.assign(BARS[i], { f: 1, h: b.h, x: b.x, y: b.y, w: b.w, d: b.d, st: b.st }));
    o.fleet.forEach((c, i) => Object.assign(CUBES[i], { f: 1 })); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
