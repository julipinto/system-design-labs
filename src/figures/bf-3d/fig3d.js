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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, d = 1) => v.toFixed(d).replace('.', ',');
  const num = v => Number.isInteger(v) ? thou(v) : dec(v, 1);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['carga', 'perfis', 'projecao', 'cadeia', 'plano'];
  const SCNAME = { carga: 'Carga', perfis: 'Perfis', projecao: 'Projeção', cadeia: 'Cadeia', plano: 'Plano' };
  const SCFULL = { carga: 'Modelagem de carga', perfis: 'Perfis de tráfego', projecao: 'Projeção de crescimento',
    cadeia: 'Capacidade end to end', plano: 'O plano da BF 2027' };
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
    o.rows.dem = act('catálogo', 'CARGA', ['pico de 2026: 640 req/s', 'dim'], ['meta de 2027: 950 req/s', 'hi'], ['alvo de CPU: 70%', 'dim']);
    o.rows.mix = act('o mix', 'CPU POR REQUISIÇÃO', ['página: 10 ms', 'dim'], ['busca: 80 ms', 'dim'], [`busca: ${dec(busca, busca % 1 ? 1 : 0)}% do tráfego`, busca ? 'acc' : 'dim'],
      [`CPU médio: ${dec(cpu, 1)} ms`, busca ? 'acc' : 'dim'], [`${dec(rps, 1)} req/s por réplica`, busca ? 'acc' : 'dim']);
    o.rows.frota = act('frota do catálogo', '1 CUBO = 1 vCPU');
    o.after = o => { const n = o.fleet.filter(c => c && c.st !== 'ghost').length; o.rows.frota.foot = [[`${n} réplicas × ${dec(rps, 1)} req/s = ${thou(n * rps)} req/s`, 'hi']]; };
    o.beams = [{ pts: [[290, 125, Z], [330, 125, Z]], on: 1, flow: 1 }];
    return { cpu, rps };
  }
  const repsFor = (dem, rps) => Math.ceil(dem / (0.7 * rps) - 1e-9);
  // Cadeia: caps = capacidade de cada elo (pedidos, pagamentos, estoque, banco)
  const LINKS = ['ped', 'pag', 'est', 'db'];
  function chain(o, caps, { pods = [3, 2, 2], db = 'hoje', demand = 200, hot } = {}) {
    show(o, 'dem2', 'ped', 'pag', 'est', 'db', 'top', 'ent');
    const mn = Math.min(...caps), gi = caps.map((c, i) => c === mn ? i : -1).filter(i => i >= 0);
    o.rows.dem2 = act('demanda', 'META', [`${demand} pedidos/s`, 'hi'], ['checkout 2027', 'dim']);
    const per = [30, 20, 500], nm = ['pedidos', 'pagamentos', 'estoque'];
    [0, 1, 2].forEach(i => { const g = gi.includes(i);
      o.rows[LINKS[i]] = act(nm[i], g ? 'GARGALO' : 'ELO', [`${num(pods[i])} pods × ${per[i]}/s`, 'dim'], [`= ${thou(caps[i])}/s`, g ? 'bad' : 'hi']);
      if (g) bad(o, LINKS[i]); else lit(o, LINKS[i]); });
    const g3 = gi.includes(3);
    o.rows.db = act('banco', g3 ? 'GARGALO' : 'PEDIDOS', [db === 'ded' ? '3 shards + 1 dedicado' : '3 shards × 150/s', 'dim'], [`= ${thou(caps[3])}/s efetivos`, g3 ? 'bad' : 'hi']);
    o.rows.db.shards = hot || (db === 'ded' ? { n: 4, loads: [26.7, 26.7, 26.7, 26.7], ded: 3 } : { n: 3, loads: [26.7, 26.7, 80] });
    if (g3) bad(o, 'db'); else lit(o, 'db');
    lit(o, 'dem2');
    const segs = [demand, ...caps].map((cap, i) => ({ x0: LX[i] - (i ? 11 : 0), x1: LX[i] + LW + (i < 4 ? 11 : 0), cap, on: 1, tone: i && gi.includes(i - 1) ? 'bad' : '' }));
    segs.flow = 1; o.pipes = segs;
    o.rows.top = act('tópico pedidos', 'KAFKA', ['3 partições', 'dim']); o.rows.top.parts = { n: 3, on: 3 };
    o.rows.ent = act('entregas', 'CONSUMIDOR', ['40 eventos/s por partição', 'dim'], ['3 × 40 = 120/s', 'dim']);
    o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]] }, { pts: [[420, 365, Z], [450, 365, Z]] }];
    return { mn, gi };
  }
  // Plano: serviços com as suas frotas; n = [catálogo, pedidos, pagamentos, estoque], prev = o de 2026 (os novos acendem mais)
  const GN = ['gCat', 'gPed', 'gPag', 'gEst'], GNAME = ['catálogo', 'pedidos', 'pagamentos', 'estoque'], GOFF = [0, 14, 24, 39];
  function planBase(o, n, prev, st) {
    GN.forEach((g, k) => { show(o, g); const [x, w, cols] = GP[g];
      o.rows[g] = act(GNAME[k], `${n[k]} vCPU`); o.rows[g].foot = [[`${n[k]} réplica${n[k] > 1 ? 's' : ''}`, 'hi']];
      fleet(o, n[k], { x0: x + 14, y0: 70, cols, px: 42, py: 38, s: 30 }, i => st ? st(k, i) : prev && i >= prev[k] ? 'new' : 'on', undefined, GOFF[k]); });
    show(o, 'shards', 'parts', 'ficha');
  }
  const SHARDS = (n4) => ({ n: n4 ? 4 : 3, loads: n4 ? [26.7, 26.7, 26.7, 26.7] : [26.7, 26.7, 80], ded: n4 ? 3 : -1 });

  // ── o que se vê em cada passo ──
  const DAY = [8.2, 6.1, 4.1, 4.1, 4.1, 8.2, 16.3, 28.5, 40.8, 48.9, 53.0, 57.1, 61.1, 53.0, 48.9, 48.9, 53.0, 57.1, 61.1, 69.3, 77.5, 81.5, 48.9, 20.4];
  const WEEK = [['seg', 1.05], ['ter', 1.00], ['qua', 1.00], ['qui', 1.05], ['sex', 1.15], ['sáb', 0.90], ['dom', 0.85]];
  const YEAR = [['jan', .85], ['fev', .80], ['mar', .90], ['abr', .90], ['mai', 1.00], ['jun', .95], ['jul', .90], ['ago', .95], ['set', 1.00], ['out', 1.10], ['nov', 1.45], ['dez', 1.20]];
  const HIST = [['2023', 300], ['2024', 410], ['2025', 520], ['2026', 640]];
  const STEPS = {
    carga: [
      { id: 'tps', dur: 5, title: 'TPS: 640 req/s no minuto das 20:03', yk: 'TPS = TRABALHO ÷ SEGUNDOS',
        code: ['38.400 requisições em 60 s', '38.400 ÷ 60 = 640 req/s', 'frota de 2026: 10 réplicas', '1 réplica = 1 vCPU = 100 req/s', '  (só a página, 10 ms de CPU)'],
        story: 'O pico de 2026 no catálogo foi de <b>640 req/s</b>: 38.400 requisições no minuto das 20:03. A frota tinha <b>10 réplicas</b> de 1 vCPU, cada uma atendendo 100 req/s de página. Só que "640 req/s" é um número só, e dentro dele cabem cargas muito diferentes.',
        look: 'A carga sai do bloco da esquerda e entra na frota: 10 cubos, um por réplica.',
        key: 'TPS é trabalho dividido por tempo, e é só a primeira das três dimensões.',
        f(o) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC);
          o.rows.dem = act('catálogo', 'CARGA', ['38.400 req em 60 s', 'dim'], ['= 640 req/s', 'acc'], ['10 réplicas (2026)', 'dim']);
          o.cnt = [['TPS', '640 req/s'], ['TRABALHO', '38.400 req', 'dim'], ['JANELA', '60 s', 'dim']];
          o.res = [['640 req/s: um número só', 'acc']]; } },
      { id: 'concorrencia', dur: 5, title: 'Concorrência: 24,2 em voo', yk: 'LEI DE LITTLE: L = λ × W',
        code: ['λ = 640 req/s', 'W = 37,8 ms (64% por réplica)', 'L = 640 × 0,0378 = 24,2', '≈ 2,4 em voo em cada uma das 10', 'módulo 14: 86,4 com a réplica quente'],
        story: 'A segunda dimensão é a <b>concorrência</b>: quantas requisições estão dentro do sistema ao mesmo tempo. Pela Lei de Little, L = 640 × 0,0378 s = <b>24,2</b> em voo nas réplicas saudáveis, umas 2,4 em cada. No módulo 14, com a réplica quente a 99%, eram 86,4 na frota.',
        look: 'Os pontos de luz dentro da frota são as requisições em voo, umas duas por réplica.',
        key: 'Concorrência é TPS vezes tempo de resposta.',
        f(o) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC);
          for (let i = 0; i < 10; i++) { const [x, y] = fcPos(i); o.dots.push([[x, y, PL + 6 + 46 + 12 + 6 * Math.sin(clk * 3 + i)], '']); }
          o.rows.dem = act('catálogo', 'CARGA', ['λ = 640 req/s', 'dim'], ['W = 37,8 ms', 'dim'], ['L = 24,2 em voo', 'acc']);
          o.cnt = [['EM VOO', '24,2'], ['λ', '640 req/s', 'dim'], ['W', '37,8 ms', 'dim']];
          o.res = [['24,2 requisições ao mesmo tempo', 'acc']]; T(o, [610, 60, 80], '24,2 em voo', 'acc'); } },
      { id: 'banda', dur: 6, title: 'Payload e banda: 105 Mbit/s', yk: 'BANDA = TPS × BYTES',
        code: ['GET /produtos/42: 1 KB + 19 KB', '= 20 KB por transação (exemplo)', '640 × 20 KB = 13,1 MB/s = 105 Mbit/s', '950 req/s: 156 Mbit/s', '+10% de retries: 171 Mbit/s'],
        story: 'A terceira dimensão é o <b>payload</b>. O <code>GET /produtos/42</code> leva 1 KB de requisição e 19 KB de resposta (exemplo): <b>20 KB</b> por transação. A banda é TPS × payload: 640 × 20 KB = <b>105 Mbit/s</b>. Com 950 req/s sobe a 156 Mbit/s, e com 10% de retries a 171.',
        look: 'O cabo da carga engrossa a cada linha da conta: 105, 156 e 171 Mbit/s.',
        key: 'O payload decide a banda, e a cauda do payload decide quando ela acaba.',
        f(o, t) { cargaBase(o); lit(o, 'dem'); fleet(o, 10, FC); const k = t < 2 ? 0 : t < 4 ? 1 : 2, v = ['105', '156', '171'][k];
          o.rows.dem = act('catálogo', 'BANDA', [['640', '950', '950'][k] + ' req/s × 20 KB', 'dim'], [k === 2 ? '+10% de retries' : 'sem retries', 'dim'], [`= ${v} Mbit/s`, 'acc']);
          o.cnt = [['BANDA', v + ' Mbit/s'], ['PAYLOAD', '20 KB', 'dim'], ['TPS', k ? '950 req/s' : '640 req/s', 'dim']];
          o.res = [[`${v} Mbit/s no fio`, 'acc']]; T(o, [310, 125, 44], v + ' Mbit/s', 'acc'); } },
      { id: 'pagina', dur: 5, title: '950 req/s, só página: 14 réplicas', yk: 'RÉPLICAS = ⌈ DEMANDA ÷ (0,7 × μ) ⌉',
        code: ['demanda de 2027: 950 req/s', 'só página: 10 ms → 100 req/s', 'alvo de CPU: 70%', '950 ÷ (0,7 × 100) = 13,6', '⌈ 13,6 ⌉ = 14 réplicas'],
        story: 'Para 2027 o catálogo espera <b>950 req/s</b> (a aula 7 explica de onde vem). Se toda requisição fosse a página (10 ms de CPU, 100 req/s por réplica), a conta com o alvo de 70% seria ⌈ 950 ÷ 70 ⌉ = <b>14 réplicas</b>. É a conta do HPA do módulo 14.',
        look: 'A frota cresce de 10 para 14 cubos. O mix ainda está em 0% de busca.',
        key: 'A conta das réplicas usa o custo de CPU por requisição.',
        f(o) { cargaBase(o); lit(o, 'dem', 'frota'); fleet(o, 14, FC, i => i >= 10 ? 'new' : 'on');
          o.cnt = [['RÉPLICAS', '14'], ['POR RÉPLICA', '100 req/s', 'dim'], ['BUSCA', '0%', 'dim']];
          o.res = [['14 réplicas, se fosse só página', 'acc']]; } },
      { id: 'busca', dur: 6, title: '5% de busca: 19 réplicas, não 14', yk: 'O MIX MUDA O CPU POR REQUISIÇÃO', act: ['Ligar 5% de busca', '14 → 19 réplicas'],
        code: ['CPU = 0,95 × 10 + 0,05 × 80', '    = 13,5 ms → 74,1 req/s por réplica', '950 ÷ (0,7 × 74,1) = 18,3', '⌈ 18,3 ⌉ = 19 réplicas', 'capacidade se mede por tipo'],
        story: 'Agora 5% do tráfego é a busca pesada do módulo 7, com <b>80 ms</b> de CPU. O CPU médio vai de 10 para 0,95 × 10 + 0,05 × 80 = <b>13,5 ms</b>, e cada réplica atende <b>74,1 req/s</b>, não 100. A conta passa a ⌈ 950 ÷ (0,7 × 74,1) ⌉ = <b>19 réplicas</b>. O TPS é o mesmo e a frota é outra.',
        look: 'O mix sobe de 0% para 5% de busca e cinco cubos novos aparecem na frota.',
        key: 'O mesmo TPS com 5% de busca pede 19 réplicas, não 14.',
        f(o, t) { const b = lin(t, 0.4, 2.6, 0, 5), { rps } = cargaBase(o, { busca: b }), n = repsFor(950, rps);
          lit(o, 'mix', 'frota'); fleet(o, n, FC, i => i >= 14 ? 'new' : 'on');
          o.cnt = [['RÉPLICAS', String(n)], ['CPU MÉDIO', dec(10 + 0.7 * b, 1) + ' ms', 'dim'], ['POR RÉPLICA', dec(rps, 1) + ' req/s', 'dim']];
          o.res = n >= 19 ? [['19 réplicas, e não 14', 'acc']] : [['o mix subindo…', 'dim']]; } },
      { id: 'busca10', dur: 6, title: '10% de busca: 24 réplicas', yk: 'A CADA 5% DE BUSCA, +5 RÉPLICAS', act: ['Subir a 10% de busca', '19 → 24'],
        code: ['CPU = 0,90 × 10 + 0,10 × 80', '    = 17 ms → 58,8 req/s por réplica', '950 ÷ (0,7 × 58,8) = 23,1', '⌈ 23,1 ⌉ = 24 réplicas', 'busca 0% · 5% · 10% = 14 · 19 · 24'],
        story: 'Com <b>10%</b> de busca o CPU médio vai a <b>17 ms</b>, a réplica a <b>58,8 req/s</b> e a frota a <b>24 réplicas</b>. Cada requisição pesada no mix pesa mais que oito páginas. É por isso que capacidade se mede <b>por tipo de requisição</b> (módulo 24).',
        look: 'Mais cinco cubos: a frota enche os 24 lugares da laje.',
        key: '0% · 5% · 10% de busca = 14 · 19 · 24 réplicas.',
        f(o, t) { const b = lin(t, 0.4, 2.6, 5, 10), { rps } = cargaBase(o, { busca: b }), n = repsFor(950, rps);
          lit(o, 'mix', 'frota'); fleet(o, n, FC, i => i >= 19 ? 'new' : 'on');
          o.cnt = [['RÉPLICAS', String(n)], ['CPU MÉDIO', dec(10 + 0.7 * b, 1) + ' ms', 'dim'], ['POR RÉPLICA', dec(rps, 1) + ' req/s', 'dim']];
          o.res = n >= 24 ? [['24 réplicas com 10% de busca', 'acc']] : [['o mix subindo…', 'dim']]; } },
      { id: 'rajada', dur: 7, title: 'A rajada: os mesmos 640 em 10 ms', yk: 'A MÉDIA DO SEGUNDO ESCONDE A FILA', act: ['Soltar a newsletter', 'rajada de 10 ms'],
        code: ['espalhados no segundo: 64% por réplica', '  R = 37,8 ms', 'em 10 ms (newsletter das 20:00):', '  64 por réplica de uma vez', 'a última espera 64 × 10 ms = 640 ms', 'a média: ~320 ms'],
        story: 'Os 640 req/s espalhados pelo segundo deixam cada réplica a 64% (R = 37,8 ms). Os <b>mesmos</b> 640 chegando numa rajada de <b>10 ms</b>, como a newsletter das 20:00, são <b>64 por réplica de uma vez</b>. A réplica atende 1 a cada 10 ms, e a última da fila espera 64 × 10 ms = <b>640 ms</b> (a média, cerca de 320). O TPS médio é o mesmo.',
        look: 'A pilha na frente da primeira réplica junta as 64 requisições da rajada; a réplica fica vermelha.',
        key: 'A rajada vive dentro do segundo, e a média por segundo não mostra a fila.',
        f(o, t) { cargaBase(o); lit(o, 'dem'); const n = Math.round(lin(t, 0.5, 2.5, 0, 64)), w = n * 10;
          fleet(o, 10, FC, i => n >= 64 ? 'bad' : 'on');
          o.rows.dem = act('catálogo', 'RAJADA', ['640 req em 10 ms', 'bad'], ['= 64 por réplica', 'bad'], ['1 a cada 10 ms', 'dim']);
          o.piles.push({ p: [375, 350, PL + 7], v: n, f: n / 64 });
          o.cnt = [['ESPERA DA ÚLTIMA', w + ' ms', 'bad'], ['NA FILA', `${n} de 64`, 'dim'], ['ESPALHADOS', '37,8 ms', 'dim']];
          o.res = n >= 64 ? [['640 ms para a última da fila', 'bad']] : [['a rajada chegando…', 'dim']];
          if (n >= 64) T(o, [375, 330, 100], '640 ms', 'bad'); } },
      { id: 'errado', dur: 6, title: 'E se der errado: "100 req/s por réplica" com busca', yk: 'PLANEJADO 14, NECESSÁRIO 19',
        code: ['plano: 950 ÷ 70 → 14 réplicas', 'tráfego real: 5% de busca', '  74,1 req/s por réplica', '950 ÷ (14 × 74,1) = 91,6% de CPU', 'busca em promoção: passa de 95%', 'faltam 5 réplicas'],
        story: 'O time planeja com os 100 req/s da página e esquece que 5% do tráfego é busca. Para 950 req/s monta <b>14 réplicas</b> onde eram necessárias <b>19</b>. Com 5% de busca a frota nasce a 950 ÷ (14 × 74,1) = <b>91,6%</b> de CPU no pico, e passa de 95% no dia em que a busca entrar em promoção: muito além do alvo de 70%, já no joelho da curva.',
        look: 'Os 14 cubos ficam vermelhos e os 5 lugares que faltam aparecem vazios.',
        key: 'TPS sozinho não dimensiona: o mix muda o número de réplicas.',
        f(o) { cargaBase(o, { busca: 5 }); bad(o, 'frota'); fleet(o, 19, FC, i => i >= 14 ? 'ghost' : 'bad', i => i >= 14 ? 'falta' : String(i + 1));
          o.cnt = [['CPU NO PICO', '91,6%', 'bad'], ['PLANEJADO', '14', 'dim'], ['NECESSÁRIO', '19', 'dim']];
          o.res = [['5 réplicas a menos: no joelho', 'bad']]; T(o, [702, 300, 70], 'faltam 5', 'bad'); } },
    ],
    perfis: [
      { id: 'dia', dur: 5, title: 'Um dia comum: pico de 81,5 às 21h', yk: 'O PERFIL DIÁRIO (EXEMPLO)',
        code: ['catálogo num dia comum, hora a hora', 'média: 40 req/s', 'mínimo: 4,1 às 2h', 'almoço: 61,1 às 12h', 'pico: 81,5 às 21h = 2,04 × a média'],
        story: 'Cada coluna é uma hora de um dia comum do catálogo (exemplo). A média é <b>40 req/s</b>, o mínimo é <b>4,1</b> às 2h, o almoço sobe a 61,1 e o <b>pico</b> é às <b>21h</b>, com <b>81,5 req/s</b>: 2,04 vezes a média. O plano olha o pico, não a média.',
        look: 'O relevo do dia: a coluna das 21h acesa é o pico, e o vale das 2h quase some.',
        key: 'O perfil diário mostra quando o sistema aperta e quando fica ocioso.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', DAY.map((v, i) => [i + 'h', v, i === 21 ? 'acc' : i === 2 ? 'dim' : 'dim']), 81.5);
          o.rows.rel.name = 'um dia comum do catálogo'; o.rows.rel.meta = 'REQ/S POR HORA';
          o.cnt = [['PICO', '81,5 req/s'], ['MÉDIA', '40 req/s', 'dim'], ['MÍNIMO', '4,1', 'dim']];
          o.res = [['o pico do dia: 21h', 'acc']]; T(o, top(21), '81,5 · 21h', 'acc'); T(o, top(2), '4,1 · 2h', 'dim'); } },
      { id: 'semana', dur: 5, title: 'A semana: a sexta tem 1,15', yk: 'O PERFIL SEMANAL',
        code: ['fator sobre a média da semana', 'seg 1,05 · ter 1,00 · qua 1,00', 'qui 1,05 · sex 1,15', 'sáb 0,90 · dom 0,85', 'soma 7,00: a média segue 40'],
        story: 'Na semana, cada dia tem um <b>fator</b> sobre a média: a <b>sexta</b> é o dia mais cheio, com <b>1,15</b> (46 req/s de média); o domingo, o mais vazio, com 0,85. Os fatores somam 7,00, então a média da semana continua 40. A Black Friday cai numa sexta.',
        look: 'Sete colunas; a sexta é a mais alta.',
        key: 'O perfil semanal diz qual dia carrega mais.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', WEEK.map(([d, f]) => [d, 40 * f, d === 'sex' ? 'acc' : 'dim', dec(f, 2)]), 46);
          o.rows.rel.name = 'a semana do catálogo'; o.rows.rel.meta = 'FATOR × 40 REQ/S';
          o.cnt = [['SEXTA', '× 1,15'], ['DOMINGO', '× 0,85', 'dim'], ['SOMA', '7,00', 'dim']];
          o.res = [['sexta: 46 req/s de média', 'acc']]; T(o, top(4), 'sex · 46 req/s', 'acc'); } },
      { id: 'ano', dur: 5, title: 'O ano: novembro tem 1,45', yk: 'O PERFIL SAZONAL',
        code: ['índice do mês sobre a média do ano', 'jan 0,85 · fev 0,80 · mar 0,90 …', 'out 1,10 · nov 1,45 · dez 1,20', 'novembro: 1,45 × 40 = 58 req/s', 'soma 12,00: a média segue 40'],
        story: 'No ano, cada mês tem um <b>índice</b>. <b>Novembro</b> é o maior, <b>1,45</b>: 1,45 × 40 = <b>58 req/s</b> de média no mês. Dezembro vem depois, com 1,20. Os índices somam 12,00, e a média do ano continua 40.',
        look: 'Doze colunas; novembro é o pico do ano.',
        key: 'O perfil sazonal diz qual mês carrega mais.',
        f(o) { show(o, 'rel'); const top = relief(o, 'rel', YEAR.map(([m, f]) => [m, 40 * f, m === 'nov' ? 'acc' : 'dim', dec(f, 2)]), 58);
          o.rows.rel.name = 'o ano do catálogo'; o.rows.rel.meta = 'ÍNDICE × 40 REQ/S';
          o.cnt = [['NOVEMBRO', '58 req/s'], ['ÍNDICE', '1,45', 'dim'], ['MÉDIA DO ANO', '40', 'dim']];
          o.res = [['novembro: 58 req/s de média', 'acc']]; T(o, top(10), 'nov · 58 req/s', 'acc'); } },
      { id: 'bf', dur: 6, title: 'A Black Friday: 640 às 20:03', yk: 'O DIA QUE QUEBRA O PADRÃO', act: ['Abrir a Black Friday', 'o dia que quebra o padrão'],
        code: ['dia comum: pico de 81,5 às 21h', 'Black Friday de 2026:', '  média do dia: 400 req/s (10 × 40)', '  pico às 20:03: 640 req/s', '640 ÷ 81,5 = 7,9 × o pico comum', 'a newsletter das 20:00 tem hora'],
        story: 'A Black Friday não segue o perfil. A <b>média do dia</b> foi de <b>400 req/s</b>, 10 vezes a média anual, e o <b>pico das 20:03</b> foi de <b>640</b>: 7,9 vezes o pico de um dia comum. É o minuto da newsletter, que a loja <b>conhece</b> (20:00). Diante dela, o relevo do dia comum vira uma planície.',
        look: 'A montanha: a coluna de 640 ao lado da média de 400 e do pico comum de 81,5.',
        key: 'A Black Friday é 7,9 vezes o pico de um dia comum.',
        f(o, t) { show(o, 'rel'); const g = lin(t, 0.3, 2.3, 0, 1);
          const top = relief(o, 'rel', [['pico comum', 81.5, 'dim'], ['BF: média do dia', 400 * g, 'on', '400'], ['BF: 20:03', 640 * g, 'acc', '640']], 640, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'dia comum × Black Friday'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['PICO 20:03', '640 req/s'], ['MÉDIA DA BF', '400', 'dim'], ['× PICO COMUM', '7,9', 'dim']];
          o.res = [['640 ÷ 81,5 = 7,9 vezes', 'acc']]; if (g >= 1) { T(o, top(2), '640 · 20:03', 'acc'); T(o, top(0), '81,5', 'dim'); } } },
      { id: 'janela', dur: 8, title: 'A janela: 640 → 400 → 58', yk: 'QUANTO MAIOR A JANELA, MENOR O PICO', act: ['Trocar a escala', 'minuto → dia → mês'],
        code: ['a mesma noite em três janelas:', '  1 minuto (20:03): 640 req/s', '  1 dia (média da BF): 400', '  1 mês (novembro): 58', 'a média do mês esconde o dia', '  e o dia esconde o minuto'],
        story: 'A mesma noite, medida em janelas diferentes. No <b>minuto</b> das 20:03 são <b>640 req/s</b>; na média do <b>dia</b>, <b>400</b>; na média do <b>mês</b> de novembro, <b>58</b>. A Black Friday some do gráfico mensal. Por isso a janela de agregação faz parte do plano: 1 a 10 minutos para o dia, horas para a semana, dias para o ano.',
        look: 'A coluna da Black Friday encolhe a cada troca de janela, até ficar menor que o pico de um dia comum.',
        key: 'A média do mês esconde o dia, e o dia esconde o minuto.',
        f(o, t) { show(o, 'rel'); const k = t < 2.5 ? 0 : t < 5 ? 1 : 2, v = [640, 400, 58][k], J = ['1 minuto', '1 dia', '1 mês'][k];
          const top = relief(o, 'rel', [['pico comum (1 h)', 81.5, 'dim'], [`BF · janela de ${J}`, v, k === 2 ? 'bad' : 'acc']], 640, { maxW: 110, hgt: 220, d: 90 });
          o.rows.rel.name = 'a Black Friday em três janelas'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['PICO VISTO', v + ' req/s', k === 2 ? 'bad' : 'acc'], ['JANELA', J, 'dim'], ['NO MINUTO', '640', 'dim']];
          o.res = k === 2 ? [['no mês, a BF vira 58', 'bad']] : [[`janela de ${J}: ${v}`, 'acc']];
          T(o, top(1), `${v} · ${J}`, k === 2 ? 'bad' : 'acc'); } },
      { id: 'rajada', dur: 6, title: '1.300 req/s às 20:20: a rajada de segundos', yk: 'O MESMO EFEITO, DENTRO DO MINUTO',
        code: ['módulo 21: 1.300 req/s às 20:20', 'é uma rajada de segundos', 'na janela de 1 minuto: ~650', 'não é outro pico: é outra janela', 'o plano escolhe a janela que importa'],
        story: 'No módulo 21 a mesma noite aparece com <b>1.300 req/s às 20:20</b>. Não é outro pico: é uma <b>rajada de segundos</b>. Na janela de 1 minuto, aquela noite aparece como cerca de <b>650</b>. A agregação esconde a rajada do mesmo jeito que o mês esconde a Black Friday.',
        look: 'Duas colunas para o mesmo instante: a de 1 segundo vai a 1.300; a de 1 minuto fica perto de 650.',
        key: 'A rajada mora dentro da janela; mudar a janela muda o número.',
        f(o) { show(o, 'rel');
          const top = relief(o, 'rel', [['20:20 · janela de 1 s', 1300, 'bad', '1.300'], ['20:20 · janela de 1 min', 650, 'acc', '~650'], ['20:03 · 1 min', 640, 'dim']], 1300, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'a mesma noite, outra janela'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['RAJADA', '1.300 req/s', 'bad'], ['NO MINUTO', '~650', 'dim'], ['PICO 20:03', '640', 'dim']];
          o.res = [['a janela de 1 min esconde a rajada', 'acc']]; T(o, top(0), '1.300 · 20:20', 'bad'); } },
      { id: 'errado', dur: 6, title: 'E se der errado: planejar pelo mês', yk: 'O PICO DA JANELA QUE IMPORTA',
        code: ['réplicas a 70% (100 req/s cada):', '  mês de novembro, 58 → 1 réplica', '  pico comum, 81,5 → 2 réplicas', '  BF às 20:03, 640 → 10 réplicas', 'BF = 11 × o mês, 7,9 × o pico comum'],
        story: 'O plano usa o índice mensal (novembro, <b>58 req/s</b>) ou o pico de um dia comum (<b>81,5</b>). Com 100 req/s por réplica e alvo de 70%, isso dá 1 ou 2 réplicas, quando o minuto das 20:03 pede <b>10</b>. A Black Friday é <b>11 vezes</b> a média do mês e 7,9 vezes o pico comum. O que se planeja é o pico da janela que importa.',
        look: 'Sobre cada coluna, quantas réplicas ela pede: 1, 2 e 10.',
        key: 'Planejar pela média do mês é planejar 1 réplica para uma noite que pede 10.',
        f(o) { show(o, 'rel');
          const top = relief(o, 'rel', [['nov · média do mês', 58, 'bad'], ['dia comum · pico', 81.5, 'bad'], ['BF · 20:03', 640, 'acc']], 640, { maxW: 100, hgt: 220, d: 90 });
          o.rows.rel.name = 'qual número vira o plano?'; o.rows.rel.meta = 'REQ/S';
          o.cnt = [['BF ÷ MÊS', '11 ×', 'bad'], ['BF ÷ PICO COMUM', '7,9 ×', 'dim'], ['RÉPLICAS', '1 · 2 · 10', 'dim']];
          o.res = [['pelo mês: 1 réplica; a noite pede 10', 'bad']];
          T(o, top(0), '→ 1 réplica', 'bad'); T(o, top(1), '→ 2 réplicas', 'bad'); T(o, top(2), '→ 10 réplicas', 'acc'); } },
    ],
    projecao: [
      { id: 'serie', dur: 5, title: 'A série: 300 · 410 · 520 · 640', yk: 'O PICO DO CATÁLOGO (EXEMPLO)',
        code: ['2023: 300 req/s', '2024: 410', '2025: 520', '2026: 640', 'saltos: × 1,37 · × 1,27 · × 1,23'],
        story: 'O pico do catálogo nos últimos quatro anos (exemplo): <b>300 · 410 · 520 · 640</b>. A Black Friday de 2027 é a mesma noite um ano depois, na sexta 26/11/2027. A pergunta tem duas fontes: o que a série mostra e o que o negócio vai mudar. À direita, a frota de 2026: <b>10 réplicas</b>, 1.000 req/s.',
        look: 'Quatro colunas, uma por ano; a frota de 10 cubos espera a projeção.',
        key: 'A história é o ponto de partida da projeção.',
        f(o) { show(o, 'relL', 'frotaP'); relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, a === '2026' ? 'acc' : 'on']), ['2027', 0, 'dim', '?']], 1140, { maxW: 64 });
          o.rows.relL.name = 'pico do catálogo'; o.rows.relL.meta = 'REQ/S';
          o.rows.frotaP = act('catálogo', '10 RÉPLICAS'); o.rows.frotaP.foot = [['10 × 100 = 1.000 req/s', 'hi'], ['2027: ?', 'dim']];
          fleet(o, 10, FP, () => 'dim');
          o.cnt = [['2026', '640 req/s'], ['SALTOS', '1,37 · 1,27 · 1,23', 'dim'], ['2027', '?', 'dim']];
          o.res = [['a série sobe, cada vez mais devagar', 'acc']]; } },
      { id: 'reta', dur: 5, title: 'Linear: 750 em 2027', yk: 'RETA DE MÍNIMOS QUADRADOS', act: ['Projetar pela reta', 'mínimos quadrados'],
        code: ['inclinação: +113 por ano', '2027: 298 + 113 × 4 = 750', 'com 10 réplicas (1.000 req/s):', '  750 ÷ 1.000 = 75%', '  R = 10 + 10 ÷ 0,25 = 50 ms'],
        story: 'A reta de mínimos quadrados cresce <b>113 por ano</b> e dá <b>750 req/s</b> em 2027. Com a frota de 10 réplicas, o catálogo ficaria a <b>75%</b> (R = 50 ms): acima do alvo de 70%, mas longe do joelho. É a tendência, se nada mudar.',
        look: 'A coluna de 2027 sobe até 750; a frota acende a 75%.',
        key: 'A reta é o piso da projeção, não o plano.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1); const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['2027 · reta', 750 * g, 'acc', '750']], 1140, { maxW: 64 });
          o.rows.relL.name = 'pico do catálogo'; o.rows.relL.meta = 'REQ/S'; lit(o, 'frotaP');
          o.rows.frotaP = act('catálogo', '10 RÉPLICAS'); o.rows.frotaP.foot = [['750 ÷ 1.000 = 75%', 'acc'], ['R = 50 ms', 'dim']];
          fleet(o, 10, FP);
          o.cnt = [['2027 (RETA)', '750'], ['POR ANO', '+113', 'dim'], ['10 RÉPLICAS', '75%', 'dim']];
          o.res = [['750: 10 réplicas a 75%', 'acc']]; if (g >= 1) T(o, top(4), '750', 'acc'); } },
      { id: 'composta', dur: 5, title: 'Composta: 28,7% ao ano → 824', yk: 'CRESCIMENTO COMPOSTO',
        code: ['taxa = (640 ÷ 300)^(1/3) − 1 = 28,7%', '2027: 640 × 1,287 = 824', 'com 10 réplicas: 82%', 'os saltos caem (1,37 → 1,23):', '  a composta é otimista'],
        story: 'A composta usa a taxa média: (640 ÷ 300)^(1/3) = <b>28,7% ao ano</b>, e dá <b>824</b>. As 10 réplicas ficariam a <b>82%</b>, já no joelho. Os saltos reais estão caindo (1,37 · 1,27 · 1,23), então a composta é otimista para a história sozinha. Por isso as duas aparecem.',
        look: 'Ao lado da reta, a coluna da composta, mais alta; a frota passa a 82%.',
        key: 'Reta e composta dizem o que acontece se nada mudar.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1);
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['reta', 750, 'dim'], ['composta', 824 * g, 'acc', '824']], 1140, { maxW: 64 });
          o.rows.relL.name = 'pico do catálogo'; o.rows.relL.meta = 'REQ/S'; lit(o, 'frotaP');
          o.rows.frotaP = act('catálogo', '10 RÉPLICAS'); o.rows.frotaP.foot = [['824 ÷ 1.000 = 82%', 'acc'], ['no joelho', 'dim']];
          fleet(o, 10, FP);
          o.cnt = [['2027 (COMPOSTA)', '824'], ['TAXA', '28,7%/ano', 'dim'], ['10 RÉPLICAS', '82%', 'dim']];
          o.res = [['824: 10 réplicas a 82%', 'acc']]; if (g >= 1) T(o, top(5), '824', 'acc'); } },
      { id: 'evento', dur: 6, title: 'O evento: a nova tela, +15% → 950', yk: 'PROJEÇÃO POR EVENTO DE NEGÓCIO', act: ['Ligar o evento', 'a nova tela, +15%'],
        code: ['nova tela inicial (módulo 9):', '  +15% de requisições por visita', '824 × 1,15 = 947,6 ≈ 950', 'com 10 réplicas: 95%', '  R = 10 + 10 ÷ 0,05 = 210 ms'],
        story: 'O negócio vai mudar a carga: a nova tela inicial do módulo 9 faz <b>15% mais requisições</b> ao catálogo por visita (exemplo). 824 × 1,15 = <b>950</b>, o número do módulo 14. Com as 10 réplicas de 2026, o catálogo iria a <b>95%</b> (R = 210 ms): o plano feito pela tendência não aguenta o evento.',
        look: 'A coluna do evento passa as outras e a frota de 10 fica vermelha.',
        key: 'O evento tem data e dono, e muda a projeção mais que a história.',
        f(o, t) { show(o, 'relL', 'frotaP'); const g = lin(t, 0.3, 1.8, 0, 1), on = g >= 1;
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['reta', 750, 'dim'], ['comp.', 824, 'dim'], ['evento', 824 + 126 * g, on ? 'bad' : 'acc', '950']], 1140, { maxW: 64 });
          o.rows.relL.name = 'pico do catálogo'; o.rows.relL.meta = 'REQ/S'; on ? bad(o, 'frotaP') : lit(o, 'frotaP');
          o.rows.frotaP = act('catálogo', '10 RÉPLICAS'); o.rows.frotaP.foot = [['950 ÷ 1.000 = 95%', on ? 'bad' : 'acc'], ['R = 210 ms', on ? 'bad' : 'dim']];
          fleet(o, 10, FP, () => on ? 'bad' : 'on');
          o.cnt = [['10 RÉPLICAS', on ? '95%' : '82%', on ? 'bad' : 'acc'], ['2027 (EVENTO)', '950', 'dim'], ['R', on ? '210 ms' : '…', 'dim']];
          o.res = on ? [['10 réplicas a 95%: não cabe', 'bad']] : [['ligando o evento…', 'dim']]; if (on) T(o, top(6), '950', 'bad'); } },
      { id: 'faixa', dur: 6, title: 'A faixa 750 – 950 – 1.140 com 14 réplicas', yk: 'A FAIXA DE PLANEJAMENTO', act: ['Subir para 14 réplicas', '1.400 req/s'],
        code: ['margem: 950 × 1,2 = 1.140', '14 réplicas = 1.400 req/s', '  750 → 53,6%', '  950 → 67,9%  (alvo: 70%)', '  1.140 → 81,4%  (o joelho)'],
        story: 'A faixa que o plano cobre vai de <b>750</b> (a reta) a <b>1.140</b> (950 × 1,2, a margem de erro), com <b>950</b> no meio. Com <b>14 réplicas</b> (1.400 req/s), o 950 fica a <b>67,9%</b>, dentro do alvo; o 750 a 53,6%; e o 1.140 a 81,4%, no joelho. A faixa mostra quanto cada escolha cobre.',
        look: 'A coluna da margem aparece; a frota ganha 4 cubos novos.',
        key: '14 réplicas cobrem o 950 a 67,9% e aguentam o 1.140 no joelho.',
        f(o) { show(o, 'relL', 'frotaP'); lit(o, 'frotaP');
          const top = relief(o, 'relL', [...HIST.map(([a, v]) => [a, v, 'on']), ['reta', 750, 'on'], ['comp.', 824, 'dim'], ['evento', 950, 'acc'], ['margem', 1140, 'bad', '1.140']], 1140, { maxW: 56 });
          o.rows.relL.name = 'faixa de 2027'; o.rows.relL.meta = 'REQ/S';
          o.rows.frotaP = act('catálogo', '14 RÉPLICAS'); o.rows.frotaP.foot = [['950 ÷ 1.400 = 67,9%', 'acc'], ['1.140 → 81,4% · 750 → 53,6%', 'dim']];
          fleet(o, 14, FP, i => i >= 10 ? 'new' : 'on');
          o.cnt = [['950 → 14 RÉPLICAS', '67,9%'], ['750', '53,6%', 'dim'], ['1.140', '81,4%', 'dim']];
          o.res = [['950 dentro do alvo de 70%', 'acc']]; T(o, top(7), '1.140 → 81,4%', 'bad'); } },
      { id: 'checkout', dur: 6, title: 'O checkout: 45 · 200 · 300 pedidos/s', yk: 'TRÊS CENÁRIOS',
        code: ['hoje: 30 pedidos/s', 'tendência: 30 × (950 ÷ 640) = 44,5 ≈ 45', 'meta do comercial: 200', 'estresse: 1,5 × a meta = 300', 'os 155 a mais: parceiros pela API'],
        story: 'No checkout a conta é outra. Hoje são <b>30 pedidos/s</b>. A tendência dá 30 × 1,484 = <b>45/s</b>. A <b>meta do comercial é 200/s</b>, e a diferença de <b>155/s</b> só existe se parceiros pela API venderem sem navegar no catálogo. O planejador pergunta ao negócio de onde vêm os 155, e calcula o que custa carregar cada cenário.',
        look: 'O relevo troca de escala: hoje, tendência, meta e estresse. O bloco ao lado mostra a conversão que a meta exige.',
        key: 'Capacity planning não prevê: calcula o que custa cada cenário.',
        f(o) { show(o, 'relL', 'chk'); lit(o, 'chk');
          const top = relief(o, 'relL', [['hoje', 30, 'on'], ['tendência', 45, 'on'], ['meta', 200, 'acc'], ['estresse', 300, 'dim']], 300, { maxW: 80 });
          o.rows.relL.name = 'checkout de 2027'; o.rows.relL.meta = 'PEDIDOS/S';
          o.rows.chk = act('de onde vêm os 155/s?', 'O NEGÓCIO', ['meta − tendência = 155/s', 'acc'], ['parceiros pela API', 'hi'], ['(sem navegar no catálogo)', 'dim'],
            ['conversão hoje:', 'dim'], ['  30 ÷ 640 = 4,7%', 'dim'], ['conversão da meta:', 'dim'], ['  200 ÷ 950 = 21%', 'acc']);
          o.cnt = [['META', '200/s'], ['TENDÊNCIA', '45/s', 'dim'], ['ESTRESSE', '300/s', 'dim']];
          o.res = [['155/s vêm dos parceiros', 'acc']]; T(o, top(2), '200 · meta', 'acc'); } },
      { id: 'errado', dur: 6, title: 'E se der errado: a meta que não é tendência', yk: 'O CRESCIMENTO NÃO LINEAR NÃO PLANEJADO',
        code: ['o plano segue a tendência: 45/s', 'o comercial fecha a meta: 200/s', 'a cadeia de hoje aguenta 40/s', '  (o pagamentos, 2 pods × 20/s)', '200 ÷ 40 = 5 × a capacidade', 'p95 de volta aos 800 ms, e pior'],
        story: 'O pior erro não é o catálogo a 95%: é um crescimento <b>não linear</b> que ninguém planejou. Se o plano segue a tendência (45/s) e o comercial fecha os parceiros, chegam <b>200 pedidos/s</b> numa cadeia que hoje aguenta <b>40/s</b>, o <code>pagamentos</code>. São <b>5 vezes</b> a capacidade, num sistema que já opera perto do máximo.',
        look: 'A coluna da meta passa muito da capacidade de hoje, a coluna baixa marcada como cadeia.',
        key: 'A meta do negócio entra no plano antes de virar tráfego.',
        f(o) { show(o, 'relL', 'chk'); bad(o, 'chk');
          const top = relief(o, 'relL', [['cadeia hoje', 40, 'acc'], ['tendência', 45, 'on'], ['meta', 200, 'bad'], ['estresse', 300, 'dim']], 300, { maxW: 80 });
          o.rows.relL.name = 'demanda × capacidade'; o.rows.relL.meta = 'PEDIDOS/S';
          o.rows.chk = act('a cadeia de hoje', 'CHECKOUT', ['pedidos: 90/s', 'dim'], ['pagamentos: 40/s', 'bad'], ['estoque: 1.000/s', 'dim'], ['banco: 250/s', 'dim'],
            ['mínimo: 40/s', 'bad'], ['200 ÷ 40 = 5 ×', 'bad']);
          o.cnt = [['META ÷ CADEIA', '5 ×', 'bad'], ['META', '200/s', 'dim'], ['CADEIA HOJE', '40/s', 'dim']];
          o.res = [['200 numa cadeia de 40', 'bad']]; T(o, top(2), '200', 'bad'); T(o, top(0), '40 · hoje', 'acc'); } },
    ],
    cadeia: [
      { id: 'elos', dur: 6, title: 'Cada elo tem o seu limite', yk: 'TPS SISTÊMICO = MÍN. (…)',
        code: ['pedidos     3 × 30  =    90/s', 'pagamentos  2 × 20  =    40/s', 'estoque     2 × 500 = 1.000/s', 'banco (mkt-01 a 60%) = 250/s', 'mínimo: 40/s → o pagamentos'],
        story: 'O checkout atravessa quatro elos. Cada um tem o seu limite: <code>pedidos</code> <b>90/s</b>, <code>pagamentos</code> <b>40/s</b>, <code>estoque</code> <b>1.000/s</b> e o banco <b>250/s</b> efetivos. A cadeia vale o mínimo: <b>40/s</b>, o <code>pagamentos</code>. A meta é 200.',
        look: 'A tubulação tem a largura da capacidade de cada elo. O trecho mais fino, vermelho, é o pagamentos.',
        key: 'A capacidade que o cliente vê é a do elo mais fraco.',
        f(o) { chain(o, [90, 40, 1000, 250]);
          o.cnt = [['SISTÊMICO', '40/s', 'bad'], ['GARGALO', 'pagamentos', 'dim'], ['DEMANDA', '200/s', 'dim']];
          o.res = [['a cadeia inteira vale 40/s', 'bad']]; T(o, [LX[2] + 75, PIPE_Y, 60], '40/s', 'bad'); } },
      { id: 'pag', dur: 7, title: 'pagamentos 2 → 15 pods: o gargalo anda', yk: 'RESOLVER UM ELO', act: ['Escalar o pagamentos', '2 → 15 pods'],
        code: ['pagamentos: 15 × 20 = 300/s', 'mínimo: 40 → 90/s', 'o gargalo passa ao pedidos', '  3 pods × 30/s = 90/s'],
        story: 'O <code>pagamentos</code> sobe de 2 para <b>15 pods</b>: 15 × 20 = <b>300/s</b>. O trecho dele engrossa, e a cadeia passa a valer <b>90/s</b>. O gargalo não sumiu: andou para o <code>pedidos</code>, que agora é o mais fraco.',
        look: 'O trecho do pagamentos engrossa e o vermelho pula para o trecho do pedidos.',
        key: 'Resolver um elo revela o próximo.',
        f(o, t) { const p = Math.round(lin(t, 0.4, 3, 2, 15)), { mn, gi } = chain(o, [90, p * 20, 1000, 250], { pods: [3, p, 2] });
          o.cnt = [['SISTÊMICO', mn + '/s', 'bad'], ['GARGALO', gi.map(i => ['pedidos', 'pagamentos', 'estoque', 'banco'][i]).join(' e '), 'dim'], ['PAGAMENTOS', `${p} pods`, 'dim']];
          o.res = p >= 15 ? [['o gargalo andou: pedidos, 90/s', 'bad']] : [['escalando…', 'dim']];
          if (p >= 15) T(o, [LX[1] + 75, PIPE_Y, 60], '90/s', 'bad'); } },
      { id: 'ped', dur: 7, title: 'pedidos 3 → 10 pods: agora é o banco', yk: 'O GARGALO ANDA DE NOVO', act: ['Escalar o pedidos', '3 → 10 pods'],
        code: ['pedidos: 10 × 30 = 300/s', 'mínimo: 90 → 250/s', 'o gargalo passa ao banco', '  3 shards × 150, o shard-2 quente'],
        story: 'O <code>pedidos</code> sobe de 3 para <b>10 pods</b>: <b>300/s</b>. O mínimo vai a <b>250/s</b>, e o gargalo agora é o <b>banco</b>. Os 3 shards somam 450/s nominais, mas o <code>shard-2</code>, com o <code>mkt-01</code>, recebe 60% do tráfego e limita o conjunto a 250.',
        look: 'O trecho do pedidos engrossa e o vermelho pula para o banco.',
        key: 'Cada passo do plano descobre o próximo elo.',
        f(o, t) { const p = Math.round(lin(t, 0.4, 3, 3, 10)), { mn, gi } = chain(o, [p * 30, 300, 1000, 250], { pods: [p, 15, 2] });
          o.cnt = [['SISTÊMICO', mn + '/s', 'bad'], ['GARGALO', gi.map(i => ['pedidos', 'pagamentos', 'estoque', 'banco'][i]).join(' e '), 'dim'], ['PEDIDOS', `${p} pods`, 'dim']];
          o.res = p >= 10 ? [['o gargalo andou: o banco, 250/s', 'bad']] : [['escalando…', 'dim']];
          if (p >= 10) T(o, [LX[4] + 75, PIPE_Y, 60], '250/s', 'bad'); } },
      { id: 'quente', dur: 6, title: 'O banco: o shard quente do mkt-01', yk: '200 × 0,6 = 120/s NUM SHARD DE 150',
        code: ['mkt-01: 60% do tráfego no shard-2', '200 × 0,6 = 120/s → 80% (o joelho)', 'shard-0 e shard-1: 40/s → 26,7%', 'eficiência: 250 de 450 nominais', 'mais shards iguais não resolvem'],
        story: 'Dentro do banco: o <code>mkt-01</code> manda <b>60%</b> do tráfego para o <code>shard-2</code>. Com a meta de 200/s, são 200 × 0,6 = <b>120/s num shard de 150</b>: <b>80%</b>, no joelho. Os outros dois ficam com 40/s cada, a 26,7%. Somar shards iguais não resolve, porque o <code>mkt-01</code> continua inteiro num deles.',
        look: 'No bloco do banco, a barra do shard-2 vai a 80%, vermelha; as outras duas ficam baixas.',
        key: 'Carga desigual: o shard quente limita o banco inteiro.',
        f(o) { chain(o, [300, 300, 1000, 250], { pods: [10, 15, 2] });
          o.rows.db = act('banco', 'SHARD QUENTE', ['shard-2: 120 de 150/s', 'bad']); o.rows.db.shards = { n: 3, loads: [26.7, 26.7, 80] };
          o.cnt = [['SHARD-2', '80%', 'bad'], ['OUTROS', '26,7%', 'dim'], ['EFETIVO', '250/s', 'dim']];
          o.res = [['o mkt-01 esquenta o shard-2', 'bad']]; T(o, [LX[4] + 75, LY + 20, 120], 'shard-2 · 80%', 'bad'); } },
      { id: 'dedicado', dur: 6, title: 'Shard dedicado 2× para o mkt-01: 300/s', yk: 'A CONTA DE T = 750 (MÓDULO 16)', act: ['Dar um shard dedicado', '2× para o mkt-01'],
        code: ['dedicado 2× (300/s): mkt-01, 80/s', '  → 26,7%', '3 normais: (200 − 80) ÷ 3 = 40/s', '  → 26,7% cada', 'banco: 750/s; mínimo: 300/s', 'sustentável: 70% × 300 = 210/s'],
        story: 'O <code>mkt-01</code> ganha um <b>shard dedicado 2×</b> (300/s). Com 40% dos pedidos (80/s), ele fica a <b>26,7%</b>, e os três normais, com 40/s cada, também. O banco vai a <b>750/s</b> e a cadeia a <b>300/s</b>, com <code>pedidos</code> e <code>pagamentos</code> empatados. Isso é capacidade <b>nominal</b>: a <b>sustentável</b> é 70% dela, <b>210/s</b>, contra a meta de 200. Cabe, com cerca de 5% de folga.',
        look: 'O banco ganha o quarto shard, maior; a tubulação fica larga de ponta a ponta e o vermelho vai para os dois serviços empatados.',
        key: 'Sustentável não é nominal: 210 contra 200, com 5% de folga.',
        f(o) { const { mn } = chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' });
          o.cnt = [['SISTÊMICO', mn + '/s'], ['SUSTENTÁVEL', '210/s', 'dim'], ['FOLGA', '~5%', 'dim']];
          o.res = [['210 sustentáveis contra 200', 'acc']]; T(o, [LX[4] + 75, PIPE_Y, 60], '750/s', 'acc'); } },
      { id: 'lag', dur: 9, title: 'O elo assíncrono: o lag do entregas', yk: '3 PARTIÇÕES × 40/s = 120/s',
        code: ['chegam 200 eventos/s', 'consome 3 × 40 = 120/s', 'o lag cresce 80/s', '4 h de evento: 1.152.000 eventos', 'depois (5/s): 115/s líquidos', '  10.017 s ≈ 2,8 h para drenar'],
        story: 'O <code>pedidos</code> publica no tópico <code>pedidos</code> do Kafka, e o <code>entregas</code> consome com <b>3 partições</b> de 40 eventos/s: <b>120/s</b> contra 200/s de chegada. O lag cresce <b>80 por segundo</b>, e nas 4 horas do evento chega a <b>1.152.000</b> eventos. Depois do pico leva <b>2,8 h</b> para drenar. Não derruba o checkout, mas atrasa o rastreio.',
        look: 'A pilha à direita do entregas cresce hora a hora até 1.152.000.',
        key: 'O elo assíncrono não derruba a cadeia: atrasa.',
        f(o, t) { chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' }); const h = lin(t, 0.5, 7, 0, 4), lag = 80 * 3600 * h;
          bad(o, 'ent'); lit(o, 'top');
          o.rows.ent = act('entregas', 'ATRASADO', ['3 × 40 = 120/s', 'bad'], ['chegam 200/s', 'dim'], [`lag: +80/s · ${dec(h, 1)} h`, 'bad']);
          o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]], on: 1, flow: 1 }, { pts: [[420, 365, Z], [450, 365, Z]], tone: 'bad', flow: 1 }];
          o.piles.push({ p: [760, 365, PL + 2], v: lag, f: lag / 1152000 });
          o.cnt = [['LAG', thou(lag), 'bad'], ['TEMPO', dec(h, 1) + ' h', 'dim'], ['PARA DRENAR', '2,8 h', 'dim']];
          o.res = h >= 4 ? [['1.152.000 eventos atrasados', 'bad']] : [['o lag crescendo…', 'dim']]; } },
      { id: 'particoes', dur: 6, title: '3 → 8 partições: ρ = 62,5%', yk: 'O PLANO DO ENTREGAS', act: ['Ir a 8 partições', '320/s'],
        code: ['8 partições × 40/s = 320/s', 'ρ = 200 ÷ 320 = 62,5%', 'lag: não cresce', 'cuidado (módulo 16): N muda murmur2 mod N', '  3 → 6 mexe ~50% das chaves'],
        story: 'O plano leva o tópico de 3 para <b>8 partições</b>: 8 × 40 = <b>320/s</b>, e o <code>entregas</code> fica a <b>62,5%</b>. O lag para de crescer. Cuidado do módulo 16: mudar o número de partições muda o <code>murmur2 mod N</code>, e ir de 3 para 6 mexe em cerca de metade das chaves. Muda-se antes do evento, não durante.',
        look: 'O tópico ganha 8 faixas acesas e a pilha some.',
        key: 'Partição é a unidade de paralelismo do consumidor.',
        f(o) { chain(o, [300, 300, 1000, 750], { pods: [10, 15, 2], db: 'ded' }); lit(o, 'top', 'ent');
          o.rows.top = act('tópico pedidos', 'KAFKA', ['8 partições', 'acc']); o.rows.top.parts = { n: 8, on: 8 };
          o.rows.ent = act('entregas', 'CONSUMIDOR', ['8 × 40 = 320/s', 'acc'], ['chegam 200/s', 'dim'], ['ρ = 62,5%', 'acc']);
          o.beams = [{ pts: [[LX[1] + 75, PIPE_Y + 22, Z], [LX[1] + 75, 300, Z]], on: 1, flow: 1 }, { pts: [[420, 365, Z], [450, 365, Z]], on: 1, flow: 1 }];
          o.cnt = [['ENTREGAS', '62,5%'], ['CONSUMO', '320/s', 'dim'], ['LAG', 'estável', 'dim']];
          o.res = [['320/s contra 200: sem lag', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'E se der errado: escalar o elo mais caro', yk: 'O GARGALO É O MÍNIMO', act: ['Escalar o estoque', '2 → 4 pods'],
        code: ['de volta à cadeia de hoje', 'estoque: 2 → 4 pods (2.000/s)', '"estoque é crítico"', 'saída da cadeia: 40/s', '  a mesma de antes'],
        story: 'De volta à cadeia de hoje. O time escala o <code>estoque</code> de 2 para 4 pods, porque "estoque é crítico". O trecho dele vira o mais largo da tubulação, <b>2.000/s</b>, e a saída da cadeia continua em <b>40/s</b>. O gargalo é o <b>mínimo</b>, não o mais caro nem o mais importante.',
        look: 'O trecho do estoque engorda; o trecho fino e vermelho do pagamentos continua igual.',
        key: 'Escalar outro elo gasta dinheiro sem mover a saída.',
        f(o, t) { const p = t > 1 ? 4 : 2; chain(o, [90, 40, p * 500, 250], { pods: [3, 2, p] });
          o.cnt = [['SAÍDA', '40/s', 'bad'], ['ESTOQUE', thou(p * 500) + '/s', 'dim'], ['GASTO', p > 2 ? '+2 pods' : '…', 'dim']];
          o.res = p > 2 ? [['+2 pods e a saída não mudou', 'bad']] : [];
          if (p > 2) { T(o, [LX[3] + 75, PIPE_Y, 70], '2.000/s', 'dim'); T(o, [LX[2] + 75, PIPE_Y, 60], '40/s', 'bad'); } } },
    ],
    plano: [
      { id: 'hoje', dur: 5, title: 'A Black Friday de 2026: 17 vCPU', yk: '1 RÉPLICA = 1 vCPU',
        code: ['catálogo    10', 'pedidos      3', 'pagamentos   2', 'estoque      2', 'total       17 vCPU (dia comum: 9)'],
        story: 'O ponto de partida: a Black Friday de 2026 rodou com catálogo <b>10</b> + <code>pedidos</code> <b>3</b> + <code>pagamentos</code> <b>2</b> + <code>estoque</code> <b>2</b> = <b>17 vCPU</b>, com o banco em 3 shards e o tópico em 3 partições. Num dia comum são 9. Foi essa frota que deixou o checkout em 40 pedidos/s.',
        look: 'Uma laje por serviço, um cubo por réplica; na frente, os shards, as partições e a ficha em branco.',
        key: 'O plano começa pelo que existe.',
        f(o) { planBase(o, [10, 3, 2, 2]);
          o.rows.shards = act('banco pedidos', '3 SHARDS'); o.rows.shards.shards = SHARDS(false);
          o.rows.parts = act('tópico pedidos', '3 PARTIÇÕES'); o.rows.parts.parts = { n: 3, on: 3 };
          o.rows.ficha = act('ficha de limites', '2027', ['a preencher', 'dim']);
          o.cnt = [['vCPU', '17'], ['DIA COMUM', '9', 'dim'], ['CHECKOUT', '40/s', 'dim']];
          o.res = [['17 vCPU em 2026', 'acc']]; } },
      { id: 'pecas', dur: 6, title: 'O plano de 2027: 41 vCPU', yk: '14 · 10 · 15 · 2 + 4 SHARDS + 8 PARTIÇÕES', act: ['Montar o plano de 2027', '14 · 10 · 15 · 2'],
        code: ['catálogo    14  (19 com 5% de busca)', 'pedidos     10', 'pagamentos  15', 'estoque      2', 'total       41 vCPU (+24)', 'banco 4 shards · tópico 8 partições'],
        story: 'O plano de 2027 junta as aulas anteriores: catálogo <b>14</b> (19 se o mix tiver 5% de busca), <code>pedidos</code> <b>10</b>, <code>pagamentos</code> <b>15</b>, <code>estoque</code> <b>2</b>: <b>41 vCPU</b>, 24 a mais que em 2026. O banco vai a <b>4 shards</b> (o dedicado 2× do <code>mkt-01</code>) e o tópico a <b>8 partições</b>.',
        look: 'Os cubos novos acendem em cada laje; o quarto shard e as cinco partições novas aparecem.',
        key: '41 vCPU no pico, 24 a mais que em 2026.',
        f(o) { planBase(o, [14, 10, 15, 2], [10, 3, 2, 2]); GN.forEach(g => lit(o, g));
          o.rows.gCat.foot = [['14 réplicas', 'hi'], ['19 com 5% de busca', 'dim']];
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true); lit(o, 'shards');
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 }; lit(o, 'parts');
          o.rows.ficha = act('ficha de limites', '2027', ['a preencher', 'dim']);
          o.cnt = [['vCPU', '41'], ['EM 2026', '17', 'dim'], ['A MAIS', '+24', 'dim']];
          o.res = [['41 vCPU no pico de 2027', 'acc']]; } },
      { id: 'horas', dur: 10, title: 'Réplica-horas: 984 fixa × 344 elástica', yk: 'O CUSTO DO DIA',
        code: ['frota fixa: 24 h × 41 = 984', 'elástica: 41 nas 4 h do pico', '  e 9 nas outras 20', '  4 × 41 + 20 × 9 = 344', '344 ÷ 984 = 35% do fixo', 'módulo 14: 33%, a mesma ordem'],
        story: 'Uma frota <b>fixa</b> de 41 o dia inteiro custa 24 × 41 = <b>984 réplica-horas</b>. Uma frota <b>elástica</b> tem 41 só nas 4 horas do pico e 9 no resto: 4 × 41 + 20 × 9 = <b>344</b>, 35% do fixo. O plano conta o custo do dia, não só o tamanho do pico.',
        look: 'O relógio corre 24 horas: a frota fica em 9 cubos até a noite, cresce para 41 no pico e o contador soma as réplica-horas.',
        key: 'A frota elástica custa 35% da fixa.',
        f(o, t) { const h = lin(t, 0.3, 8.3, 0, 24), peak = h >= 20, rh = 9 * Math.min(h, 20) + 41 * Math.max(0, h - 20);
          const COMUM = [2, 3, 2, 2]; planBase(o, peak ? [14, 10, 15, 2] : COMUM, null, () => peak ? 'on' : 'on'); GN.forEach(g => lit(o, g));
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('réplica-horas', 'POR DIA', [`${String(Math.floor(h)).padStart(2, '0')}h · frota: ${peak ? 41 : 9}`, peak ? 'acc' : 'dim'], [`elástica: ${thou(rh)}`, 'acc'], [`fixa: ${thou(41 * h)}`, 'dim']); lit(o, 'ficha');
          o.cnt = [['ELÁSTICA', thou(rh)], ['FIXA', thou(41 * h), 'dim'], ['HORA', String(Math.floor(h)).padStart(2, '0') + 'h', 'dim']];
          o.res = h >= 24 ? [['344 × 984: 35% do fixo', 'acc']] : [[peak ? 'pico: 41 réplicas' : 'dia comum: 9 réplicas', 'dim']]; } },
      { id: 'preescala', dur: 6, title: 'Pré-escalar às 19:50', yk: 'O EVENTO TEM HORA MARCADA',
        code: ['HPA: reage em ~60 s (módulo 14)', 'newsletter: 20:00 (conhecida)', 'escala agendada: 19:50 → 41', 'às 20:00 a frota já está lá', 'congelamento: 3 dias antes'],
        story: 'O HPA reage em cerca de <b>60 s</b>, e a rajada da newsletter chega em segundos. Como a hora é <b>conhecida</b> (20:00), o plano manda <b>pré-escalar às 19:50</b> com uma escala agendada, em vez de esperar a métrica subir. E há um <b>congelamento</b>: mudanças de código param 3 dias antes da Black Friday, exceto as flags de operação.',
        look: 'A frota inteira já está de pé antes da rajada; a ficha marca 19:50.',
        key: 'Evento conhecido se escala antes, não depois.',
        f(o) { planBase(o, [14, 10, 15, 2]); GN.forEach(g => lit(o, g));
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('agenda da noite', 'BF 2027', ['19:50 escala agendada → 41', 'acc'], ['20:00 newsletter', 'hi'], ['HPA: ~60 s, chega tarde', 'dim'], ['congelamento: 3 dias antes', 'dim']); lit(o, 'ficha');
          o.cnt = [['PRÉ-ESCALA', '19:50'], ['NEWSLETTER', '20:00', 'dim'], ['HPA', '~60 s', 'dim']];
          o.res = [['às 20:00 a frota já está lá', 'acc']]; } },
      { id: 'emergencia', dur: 6, title: 'A folga de emergência: 1.867 e 2.333 req/s', yk: 'DEGRADAR É O ÚLTIMO RECURSO',
        code: ['níveis do módulo 21 (catálogo):', '  7,5 ms → 133 req/s por réplica', '  6 ms → 167 req/s por réplica', '14 × 133 = 1.867 req/s', '14 × 167 = 2.333 req/s', 'o plano conta, mas não depende'],
        story: 'A capacidade de emergência do módulo 21 também entra na conta. Degradando o catálogo, a réplica gasta 7,5 ms (133 req/s) ou 6 ms (167 req/s), e as mesmas 14 réplicas atendem <b>1.867</b> ou <b>2.333 req/s</b> sem nenhuma a mais. O plano <b>conta</b> essa folga, mas <b>não depende</b> dela: degradar é o último recurso.',
        look: 'A laje do catálogo mostra as três capacidades das mesmas 14 réplicas.',
        key: 'A folga de degradação existe, e o plano não se apoia nela.',
        f(o) { planBase(o, [14, 10, 15, 2]); lit(o, 'gCat');
          o.rows.gCat.foot = [['1.400 · 1.867 · 2.333', 'acc'], ['req/s (normal · nível 1 · 2)', 'dim']];
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('emergência', 'MÓDULO 21', ['14 × 133 = 1.867 req/s', 'acc'], ['14 × 167 = 2.333 req/s', 'acc'], ['conta, mas não depende', 'dim']);
          o.cnt = [['DEGRADADO', '2.333 req/s'], ['NÍVEL 1', '1.867', 'dim'], ['NORMAL', '1.400', 'dim']];
          o.res = [['folga conhecida, não planejada', 'acc']]; } },
      { id: 'ficha', dur: 6, title: 'A ficha de limites', yk: 'O ENTREGÁVEL É A FICHA, NÃO UM NÚMERO',
        code: ['sustentável: 980 req/s · 210 pedidos/s', 'p95 ≤ 300 ms (catálogo) · ≤ 800 (checkout)', 'erros ≤ 0,1% · ρ ≤ 70%', 'L(alvo) do pagamentos: 4 por pod', 'pool do PSP: 150 conexões', 'gatilho: > 210/s, > 980 ou L > 4'],
        story: 'O resultado do plano é uma <b>ficha de limites</b>: sustentável <b>980 req/s</b> no catálogo (14 × 100 × 0,7) e <b>210 pedidos/s</b> no checkout; p95 ≤ 300 e ≤ 800 ms; erros ≤ 0,1%; ρ ≤ 70%; L(alvo) do <code>pagamentos</code> = 4 por pod; pool do PSP com 150 conexões. E o <b>gatilho de reavaliação</b>: passou de 210/s, de 980 req/s ou de L = 4, refaz-se a conta.',
        look: 'A ficha acende com os limites; é o papel que o comercial e o plantão leem.',
        key: 'O plano é uma ficha com limites e gatilhos.',
        f(o) { planBase(o, [14, 10, 15, 2]); lit(o, 'ficha');
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('ficha de limites', '2027', ['980 req/s · 210 pedidos/s', 'acc'], ['p95 ≤ 300 · ≤ 800 ms', 'hi'], ['erros ≤ 0,1% · ρ ≤ 70%', 'hi'], ['L(alvo) 4 · pool PSP 150', 'hi'], ['gatilho: > 210/s ou L > 4', 'acc']);
          o.cnt = [['SUSTENTÁVEL', '210/s'], ['CATÁLOGO', '980 req/s', 'dim'], ['GATILHO', 'L > 4', 'dim']];
          o.res = [['limites, metas e gatilhos', 'acc']]; } },
      { id: 'errado', dur: 6, title: 'E se der errado: o 300 nominal sem teste', yk: 'UM PLANO SEM TESTE É HIPÓTESE',
        code: ['o plano diz 300/s (nominal)', 'ninguém mediu:', '  max_connections do banco', '  a fila do Kafka · o limite do PSP', '  o mix da BF × o do dia comum', 'o breakpoint pode vir antes de 300'],
        story: 'O plano diz <b>300/s</b>, e a conta é de capacidade <b>nominal</b>: a CPU de cada pod e o banco por primário. Ninguém mediu o pool de conexões (<code>max_connections</code>), a fila do Kafka, o limite do PSP nem a diferença entre o mix do dia comum e o da Black Friday. Um plano sem teste é uma <b>hipótese</b>, e o teste de <i>breakpoint</i> pode achar o limite antes de 300.',
        look: 'Cada peça ganha a sua pergunta em vermelho: o que ainda não foi medido.',
        key: 'Cada número foi calculado; o módulo 24 diz quais resistem.',
        f(o) { planBase(o, [14, 10, 15, 2]); bad(o, 'ficha');
          o.rows.shards = act('banco pedidos', '4 SHARDS'); o.rows.shards.shards = SHARDS(true);
          o.rows.parts = act('tópico pedidos', '8 PARTIÇÕES'); o.rows.parts.parts = { n: 8, on: 8 };
          o.rows.ficha = act('ficha de limites', 'HIPÓTESE', ['300/s nominais', 'bad'], ['medido: ?', 'bad'], ['próximo: teste de carga', 'acc'], ['(módulo 24)', 'dim']);
          o.cnt = [['NOMINAL', '300/s', 'bad'], ['MEDIDO', '?', 'dim'], ['PRÓXIMO', 'módulo 24', 'dim']];
          o.res = [['300 é conta, não medida', 'bad']];
          T(o, [156, 140, 70], 'o mix?', 'bad'); T(o, [618, 140, 70], 'limite do PSP?', 'bad'); T(o, [165, 300, 50], 'max_connections?', 'bad'); T(o, [420, 300, 50], 'fila do Kafka?', 'bad'); } },
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
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = (c) => c ? ' class="on"' : '';
  const DATA = {
    carga: () => `<table class="h3-sum"><tr><th>busca</th><th>CPU médio</th><th>por réplica</th><th>950 a 70%</th></tr><tr${on_(step === 3)}><td>0%</td><td>10 ms</td><td>100 req/s</td><td>14</td></tr><tr${on_(step === 4 || step === 7)}><td>5%</td><td>13,5 ms</td><td>74,1 req/s</td><td>19</td></tr><tr${on_(step === 5)}><td>10%</td><td>17 ms</td><td>58,8 req/s</td><td>24</td></tr></table><li>TPS: 38.400 ÷ 60 = <b>640 req/s</b> (pico de 2026, 20:03)</li><li>Concorrência: L = 640 × 0,0378 = <b>24,2</b> em voo</li><li>Banda: 640 × 20 KB = <b>105 Mbit/s</b>; 950 req/s: 156; +10% de retries: 171</li><li>Rajada de 10 ms: 64 por réplica, a última espera <b>640 ms</b> (média ~320); espalhados, 37,8 ms</li><li>Com 14 réplicas e 5% de busca: 950 ÷ (14 × 74,1) = <b>91,6%</b> de CPU</li>`,
    perfis: () => `<table class="h3-sum"><tr><th>janela</th><th>o que mostra</th></tr><tr${on_(step === 4)}><td>1 minuto (20:03)</td><td>640 req/s</td></tr><tr${on_(step === 3 || step === 4)}><td>1 dia (Black Friday)</td><td>400 req/s de média</td></tr><tr${on_(step === 2 || step === 4)}><td>1 mês (novembro)</td><td>58 req/s de média</td></tr><tr${on_(step === 0)}><td>dia comum, pico</td><td>81,5 req/s às 21h</td></tr><tr${on_(step === 5)}><td>1 segundo (20:20)</td><td>1.300 req/s (módulo 21)</td></tr></table><li>Dia comum (exemplo, média 40): 8,2 · 6,1 · <b>4,1</b> · 4,1 · 4,1 · 8,2 · 16,3 · 28,5 · 40,8 · 48,9 · 53,0 · 57,1 · 61,1 · 53,0 · 48,9 · 48,9 · 53,0 · 57,1 · 61,1 · 69,3 · 77,5 · <b>81,5</b> · 48,9 · 20,4</li><li>Semana: seg 1,05 · ter 1,00 · qua 1,00 · qui 1,05 · <b>sex 1,15</b> · sáb 0,90 · dom 0,85 (soma 7,00)</li><li>Ano: jan 0,85 · fev 0,80 · mar 0,90 · abr 0,90 · mai 1,00 · jun 0,95 · jul 0,90 · ago 0,95 · set 1,00 · out 1,10 · <b>nov 1,45</b> · dez 1,20 (soma 12,00)</li><li>640 ÷ 81,5 = <b>7,9</b>; 640 ÷ 58 = <b>11</b></li>`,
    projecao: () => `<table class="h3-sum"><tr><th>demanda</th><th>10 réplicas</th><th>14 réplicas</th></tr><tr${on_(step === 1)}><td>750 · reta</td><td>75% (R = 50 ms)</td><td>53,6%</td></tr><tr${on_(step === 2)}><td>824 · composta</td><td>82%</td><td>—</td></tr><tr${on_(step === 3 || step === 4)}><td>950 · evento</td><td>95% (R = 210 ms)</td><td>67,9%</td></tr><tr${on_(step === 4)}><td>1.140 · margem</td><td>—</td><td>81,4% (o joelho)</td></tr></table><li>Série (exemplo): 2023: 300 · 2024: 410 · 2025: 520 · 2026: 640</li><li>Reta: +113 por ano → <b>750</b>; composta: 28,7% ao ano → <b>824</b>; evento: 824 × 1,15 → <b>950</b></li><li>R(ρ) = 10 ms + 10 ms ÷ (1 − ρ) no catálogo (módulo 14)</li><li>Checkout: hoje 30 · tendência 45 · meta 200 · estresse 300 pedidos/s; conversão 4,7% → 21%</li>`,
    cadeia: () => `<table class="h3-sum"><tr><th>passo</th><th>ped.</th><th>pag.</th><th>banco</th><th>mín.</th></tr><tr${on_(step === 0 || step === 7)}><td>hoje</td><td>90</td><td>40</td><td>250</td><td>40</td></tr><tr${on_(step === 1)}><td>pagamentos 2 → 15</td><td>90</td><td>300</td><td>250</td><td>90</td></tr><tr${on_(step === 2 || step === 3)}><td>pedidos 3 → 10</td><td>300</td><td>300</td><td>250</td><td>250</td></tr><tr${on_(step >= 4 && step <= 6)}><td>shard dedicado 2×</td><td>300</td><td>300</td><td>750</td><td>300</td></tr></table><li>Estoque: 2 pods × 500/s = 1.000/s (com 4 pods, 2.000/s, e a saída não muda)</li><li>Sustentável: 70% × 300 = <b>210/s</b> contra a meta de 200 (~5% de folga); a 300/s a cadeia vai a 100%</li><li>Shard quente: 200 × 0,6 = 120/s num shard de 150 (80%); dedicado 2×: 80/s em 300 (26,7%)</li><li>Entregas: 3 × 40 = 120/s contra 200/s → lag de <b>1.152.000</b> em 4 h, 2,8 h para drenar; 8 partições: 320/s, ρ = 62,5%</li>`,
    plano: () => `<table class="h3-sum"><tr><th>serviço</th><th>dia comum</th><th>BF 2026</th><th>BF 2027</th></tr><tr><td>catálogo</td><td>2</td><td>10</td><td>14 (19 com busca)</td></tr><tr><td>pedidos</td><td>3</td><td>3</td><td>10</td></tr><tr><td>pagamentos</td><td>2</td><td>2</td><td>15</td></tr><tr><td>estoque</td><td>2</td><td>2</td><td>2</td></tr><tr class="on"><td>vCPU</td><td>9</td><td>17</td><td>41</td></tr></table><li>Banco: 4 shards (o dedicado 2× do <code>mkt-01</code>); tópico <code>pedidos</code>: 8 partições</li><li>Réplica-horas por dia: fixa 24 × 41 = <b>984</b>; elástica 4 × 41 + 20 × 9 = <b>344</b> (35%)</li><li>Pré-escala às 19:50; congelamento de mudanças 3 dias antes da Black Friday (26/11/2027)</li><li>Ficha: 980 req/s · 210 pedidos/s · p95 ≤ 300 / 800 ms · erros ≤ 0,1% · ρ ≤ 70% · L(alvo) 4 · pool do PSP 150</li><li>Gatilho de reavaliação: &gt; 210 pedidos/s, &gt; 980 req/s ou L &gt; 4 no <code>pagamentos</code></li>`,
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
  function readout() { if (active !== 'bf') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
