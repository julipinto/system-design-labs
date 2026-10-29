// Figura 3D (iso-glow): capacidade, escala vertical × horizontal e o HPA. Na cadeia do checkout, cada serviço é um bloco,
// o cano que sai dele tem a largura da capacidade e a faixa acesa dentro do cano é o que passa de fato; o que não cabe
// transborda e vira pilha vermelha na frente do elo. Embaixo, as réplicas são cubos que acendem com a CPU.
// No catálogo, o lb-loja reparte o pico entre os cubos (catalogo-1 … catalogo-16), uma caixa de 8 vCPU faz a vertical
// e o HPA, na frente, faz a conta. Atrás, o mostrador (contadores, a conta do passo e o resultado).
// Cenários (toggle e ?mode=cadeia|vertical|horizontal|hpa|hpa-media; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/performance-brief.md). As contas (cadeia, R(ρ) = 10 + 10 ÷ (1 − ρ),
// Amdahl com 1/21 serial, quedas, HPA com ceil e tolerância de 10%) batem com o brief.
FIGS3D.push({ id: 'capacidade', name: 'Capacidade e escala', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  const pct = v => dec(v) + '%';
  const Rms = rho => 10 + 10 / (1 - rho);   // a curva do joelho do módulo (M/M/1 de brinquedo)
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['cadeia', 'vertical', 'horizontal', 'hpa', 'hpa-media'];
  const SCNAME = { cadeia: 'Cadeia', vertical: 'Vertical', horizontal: 'Horizontal', hpa: 'HPA', 'hpa-media': 'HPA média' };
  const SCFULL = { cadeia: 'A cadeia do checkout', vertical: 'Escalar na vertical', horizontal: 'Escalar na horizontal',
    hpa: 'A fórmula do HPA', 'hpa-media': 'O HPA e a réplica quente' };
  const A3 = 'aula-3-entendendo-a-capacidade-em-sistemas', A4 = 'aula-4-escalabilidade-vertical-e-horizontal', A5 = 'aula-5-formula-de-capacity-hpa';
  const AULA = { cadeia: A3, vertical: A4, horizontal: A4, hpa: A5, 'hpa-media': A5 };
  let clk = 0, sc = 'cadeia', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-capacidade3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, ZR = 17;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 600, 12, 211, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(594, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 22, SZ + 207.5, 592, 203.5, 4, g0), SK = 592 / 416;
  // blocos: tamanho fixo; o lugar vem do cenário (desliza quando muda) e quem sai afunda na base
  function block(nm, w, d, h, kind, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, kind, key: '', f: 0, pos: null };
  }
  const B = {};
  block('cli', 110, 90, 26, 'actor'); block('ped', 140, 90, 26, 'actor'); block('pag', 140, 90, 26, 'actor'); block('est', 140, 90, 26, 'actor');
  block('db', 200, 90, 26, 'actor'); block('lb', 120, 90, 26, 'actor'); block('hpa', 270, 90, 20, 'actor'); block('big', 380, 170, 30, 'big', 4);
  const NAMES = Object.keys(B);
  // réplicas: cubos de 62 × 60 (no catálogo) ou reduzidos a 0,6 (embaixo de cada serviço da cadeia)
  const CU_W = 62, CU_D = 60, CU_H = 18;
  const CUBES = Array.from({ length: 16 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, CU_W, CU_D, CU_H, 5, mat, g); const top = faceCanvas('top', 2.5, 2.5, CU_H, CU_W - 5, CU_D - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); return { g, mat, top, glow, key: '', id: null, f: 0, pos: null, sc: 0, d: null }; });
  // o represado: cartões empilhados na frente do elo que não dá conta
  const KW = 46, KD = 40, KH = 8, KMAX = 7;
  const CARDS = Array.from({ length: 14 }, () => { const g = new THREE.Group(); g0.add(g); g.visible = false; const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, KW, KD, KH, 2, mat, g); const top = faceCanvas('top', 1.5, 1.5, KH, KW - 3, KD - 3, 6, g);
    const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); return { g, mat, top, glow, key: '' }; });
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 24 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on) for (let k = 0; k < 2; k++) dot(alongPts(b.pts, cum, (clk * 0.45 + k / 2) % 1), b.tone);
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
  }
  // canos: a calha escura tem a largura da capacidade; a faixa acesa dentro dela é o fluxo que passa
  const pipeMat = new THREE.MeshBasicMaterial({ color: 0x2b2e30, toneMapped: false });
  const PIPE = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(BOX, pipeMat); m.visible = false; g0.add(m); return m; });
  const FLUID = Array.from({ length: 12 }, () => { const m = new THREE.Mesh(BOX, beamOn); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const wd = c => Math.min(46, 6 + 34 * Math.sqrt(c / 1000));   // 40 → 12,8 · 90 → 16,2 · 150 → 19,2 · 1.000 → 40
  function setPipes(list) {
    let n = 0;
    for (const p of list) {
      const fw = p.flow > 0 ? Math.min(p.w * 0.84, wd(p.flow) * 0.84) : 0;
      for (let i = 0; i < p.pts.length - 1 && n < PIPE.length; i++) {
        const A = W(p.pts[i][0], p.pts[i][1], 0), C_ = W(p.pts[i + 1][0], p.pts[i + 1][1], 0), d = C_.clone().sub(A), len = d.length() / TS;
        const q = new THREE.Quaternion().setFromUnitVectors(XV, d.normalize()), c = A.clone().add(C_).multiplyScalar(0.5);
        const m = PIPE[n], fl = FLUID[n]; n++;
        m.visible = true; m.position.copy(c).setY((PL + 2) * TS); m.quaternion.copy(q); m.scale.set((len + p.w) * TS, 4 * TS, p.w * TS);
        fl.visible = fw > 0; fl.material = p.tone === 'bad' ? beamBad : beamOn; fl.position.copy(c).setY((PL + 5) * TS); fl.quaternion.copy(q);
        fl.scale.set((len + fw) * TS, 2.5 * TS, fw * TS);
      }
      if (fw > 0) { const pts = p.pts.map(q => [q[0], q[1], PL + 9]), cum = cumLen(pts);
        for (let k = 0; k < 2; k++) dot(alongPts(pts, cum, (clk * 0.35 + k / 2) % 1), p.tone); }
    }
    for (let i = n; i < PIPE.length; i++) { PIPE[i].visible = false; FLUID[i].visible = false; }
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
  const TAGS = [tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // balões na frente da prancha (a faixa livre embaixo dos cubos)
  const TF = x => [x, 418, 22];

  // ── lugares de cada cenário (canto de trás-esquerda de cada bloco) ──
  const LCAT = { cli: [20, 200], lb: [160, 200], hpa: [20, 350], big: [400, 150] };
  const LAY = { cadeia: { cli: [14, 190], ped: [180, 190], pag: [400, 190], est: [620, 190], db: [670, 40] },
    vertical: LCAT, horizontal: LCAT, hpa: LCAT, 'hpa-media': LCAT };
  const SHOW = { cadeia: ['cli', 'ped', 'pag', 'est', 'db'], vertical: ['cli', 'lb'], horizontal: ['cli', 'lb'], hpa: ['cli', 'lb', 'hpa'], 'hpa-media': ['cli', 'lb', 'hpa'] };
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  const RC = { c2l: P3([[130, 245], [160, 245]]), l2b: P3([[280, 245], [305, 245]]), r0: P3([[305, 195], [330, 195]]), r1: P3([[305, 275], [330, 275]]),
    l2v: P3([[280, 245], [400, 245]]), l2one: P3([[280, 245], [559, 245]]) };
  const PILE_CAT = [220, 322, PL];

  // ── conteúdo padrão dos blocos ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  function base() {
    const o = { show: {}, pos: { ...LAY[sc] }, on: {}, rows: {}, beams: [], pipes: [], tags: [], cubes: [], piles: [], cnt: [], res: [] };
    SHOW[sc].forEach(n => o.show[n] = 1);
    if (sc !== 'cadeia') { o.rows.cli = act('CLIENTES', 'pico', ['640 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc']);
      o.rows.hpa = act('HPA', 'alvo CPU 70%', ['lê a cada 15 s', 'dim']); }
    return o;
  }
  const cubeTone = (cpu, down) => down || cpu >= 95 ? 'bad' : cpu > 0 ? 'acc' : '';
  // a cadeia do checkout: pedidos (30/s por réplica) → pagamentos (20/s) → estoque (500/s); o pedidos grava no banco (150/s)
  const SVC = { ped: 250, pag: 470, est: 690 };
  function chain(o, t, dem, nP, nG, nE, focus = []) {
    const cP = nP * 30, cG = nG * 20, cE = nE * 500, cD = 150;
    const oP = Math.min(dem, cP, cD), qP = dem - oP, oG = Math.min(oP, cG), qG = oP - oG, out = Math.min(oG, cE);
    const uP = oP / cP * 100, uG = oG / cG * 100, uE = out / cE * 100, uD = oP / cD * 100;
    const sec = clamp((t - 0.8) / 4.5) * 60;   // 60 s da história em 4,5 s de tela
    const tn = u => u >= 99.5 ? 'bad' : u >= 70 ? 'acc' : 'dim', r = Math.round;
    o.rows.cli = act('CHECKOUT', 'entrada', [`${dem} pedidos/s`, 'acc'], [`saem ${out}/s`, qP + qG ? 'bad' : 'dim']);
    o.rows.ped = act('pedidos', `${nP} réplicas`, [`capacidade ${cP}/s`, 'dim'], [`CPU ${r(uP)}%`, tn(uP)], qP && cP <= cD ? [`represa ${qP}/s`, 'bad'] : [`passa ${oP}/s`, 'dim']);
    o.rows.pag = act('pagamentos', `${nG} réplicas`, [`capacidade ${cG}/s`, 'dim'], [`CPU ${r(uG)}%`, tn(uG)], qG ? [`represa ${qG}/s`, 'bad'] : [`passa ${oG}/s`, 'dim']);
    o.rows.est = act('estoque', `${nE} réplicas`, [`capacidade ${thou(cE)}/s`, 'dim'], [`CPU ${r(uE)}%`, tn(uE)], [`passa ${out}/s`, 'dim']);
    o.rows.db = act('BANCO do pedidos', 'PostgreSQL', ['teto 150/s', 'dim'], [`uso ${r(uD)}%`, tn(uD)], qP && cD < cP ? [`represa ${qP}/s`, 'bad'] : null);
    [['ped', uP], ['pag', uG], ['est', uE], ['db', uD]].forEach(([nm, u]) => o.on[nm] = u >= 99.5 ? 'bad' : focus.includes(nm) ? 1 : 0);
    if (t > 0.3) o.on.cli = 2;
    [['ped', nP, uP], ['pag', nG, uG], ['est', nE, uE]].forEach(([nm, n, u]) => { for (let j = 0; j < n; j++)
      o.cubes.push({ id: nm + j, p: [SVC[nm] - 60 + (j % 4) * 40, 307 + (j >> 2) * 42], s: 0.6, cpu: u, tone: cubeTone(u) }); });
    o.pipes.push({ pts: [[124, 235], [180, 235]], w: wd(dem), flow: dem, tone: qP ? 'bad' : '' });
    o.pipes.push({ pts: [[320, 235], [400, 235]], w: wd(cP), flow: oP, tone: qG ? 'bad' : '' });
    o.pipes.push({ pts: [[540, 235], [620, 235]], w: wd(cG), flow: oG });
    o.pipes.push({ pts: [[760, 235], [892, 235]], w: wd(cE), flow: out });
    o.pipes.push({ pts: [[250, 190], [250, 165], [770, 165], [770, 130]], w: wd(cD), flow: oP, tone: uD >= 99.5 ? 'bad' : '' });
    if (qP && t > 0.8) o.piles.push({ p: [152, 235], v: qP * sec, f: sec / 60 });
    if (qG && t > 0.8) o.piles.push({ p: [360, 235], v: qG * sec, f: sec / 60 });
    return { out, qP, qG, uP, uG, uE, uD, sec };
  }
  // o catálogo: lb-loja → réplicas (2 fileiras); cada cubo é { name, cpu, sub, down }
  function fleet(o, list, tone = '') {
    const cols = Math.max(1, Math.ceil(list.length / 2));
    list.forEach((c, i) => o.cubes.push({ id: c.name, p: [361 + (i % cols) * 69, 195 + Math.floor(i / cols) * 80], s: 1, tone: cubeTone(c.cpu, c.down), ...c }));
    o.beams.push({ pts: RC.c2l, on: true, tone }, { pts: RC.l2b, on: true, tone }, { pts: P3([[305, 195], [305, list.length > 1 ? 275 : 245]]), on: true, tone },
      { pts: RC.r0, on: true, tone }); if (list.length > 1) o.beams.push({ pts: RC.r1, on: true, tone });
    o.on.lb = tone === 'bad' ? 'bad' : 1; o.on.cli = 2;
  }
  const reps = (n, cpu, extra = {}) => Array.from({ length: n }, (_, i) => ({ name: `catalogo-${i + 1}`, cpu, ...(extra[i] || {}) }));
  const amdahl = n => 1 / (1 / 21 + (20 / 21) / n);

  // ── o que se vê em cada passo ──
  const STEPS = {
    cadeia: [
      { id: 'trinta', dur: 6, title: '30 pedidos/s: a cadeia dá conta', yk: 'A CONTA DE CADA ELO', code: ['pedidos     3 × 30 = 90/s   → 33%', 'pagamentos  2 × 20 = 40/s   → 75%', 'estoque     2 × 500 = 1.000/s → 3%', 'banco do pedidos  150/s    → 20%', 'pagamentos a 75%: R = 50 ÷ 0,25 = 200 ms'],
        story: 'Cada pedido do checkout passa pelo pedidos, que grava no banco, depois pelo pagamentos e pelo estoque. Na Black Friday de hoje chegam 30 pedidos por segundo, e todos passam. Mas o pagamentos já está a 75% de CPU: cada cobrança leva 200 ms em vez de 50, quatro vezes o tempo sem fila.',
        look: 'A faixa acesa entra pela esquerda e atravessa todos os canos. A largura de cada cano é a capacidade do serviço de onde ele sai. Os cubos embaixo de cada serviço são as réplicas; os do pagamentos são os mais acesos.',
        key: 'Capacidade é o máximo de trabalho com resposta aceitável; o elo mais fraco aparece antes de estourar.',
        f(o, t) { chain(o, t, 30, 3, 2, 2, ['pag']);
          o.cnt = [['SAÍDA', '30/s'], ['REPRESADO', '0/s', 'dim'], ['MAIS APERTADO', 'pagamentos 75%', 'dim']];
          o.res = [['os 30 pedidos/s passam', 'acc']];
          if (t > 1.5) T(o, TF(470), 'pagamentos a 75%\nR = 200 ms'); } },
      { id: 'sessenta', dur: 7.5, title: '60 pedidos/s: o pagamentos estrangula em 40', yk: 'A CONTA COM A DEMANDA DOBRADA', code: ['entrada 60/s', 'pedidos     60 ÷ 90 = 67%', 'pagamentos  só 40/s → 100%, represa 20/s', 'estoque     40 ÷ 1.000 = 4%', '20/s × 60 s = 1.200 esperando'],
        story: 'Agora a Black Friday dobra: 60 pedidos por segundo. O pedidos dá conta, a 67%. O pagamentos só processa 40 por segundo, e os outros 20 ficam represados na frente dele: em 60 s são 1.200 pedidos esperando. O estoque, que aguenta 1.000, recebe 40 e fica a 4%.',
        look: 'O cano que chega ao pagamentos fica vermelho e a pilha na frente dele cresce. Os cubos do pagamentos ficam vermelhos, a 100%; os do estoque quase não acendem.',
        key: 'Gargalo: a demanda passou da capacidade do elo mais fraco, e a saída da cadeia vira a dele.',
        f(o, t) { const s = chain(o, t, 60, 3, 2, 2);
          o.cnt = [['SAÍDA', '40/s', 'bad'], ['REPRESADO', '20/s', 'bad'], ['NA FILA', thou(20 * s.sec), 'bad']];
          o.res = [['saída 40/s: 20/s represados (33%)', 'bad'], [`${thou(20 * s.sec)} pedidos esperando em ${Math.round(s.sec)} s`, 'bad']];
          if (t > 1.5) T(o, TF(400), 'represa 20/s\n1.200 em 60 s', 'bad'); } },
      { id: 'pagamentos', dur: 6, title: 'Pagamentos ×2: 4 réplicas, 80/s', yk: 'ESCALAR O ELO CERTO', code: ['pagamentos  4 × 20 = 80/s', '60 ÷ 80 = 75%', 'cadeia = min(90, 80, 1.000, 150)', '       = 80 pedidos/s'],
        story: 'O conserto vai no elo certo. O pagamentos passa de 2 para 4 réplicas: 4 × 20 = 80 por segundo. Os 60 pedidos/s passam inteiros e o pagamentos volta a 75%. A capacidade da cadeia agora é a do menor elo: min(90, 80, 1.000, 150) = 80.',
        look: 'Dois cubos novos sobem embaixo do pagamentos. A pilha some, e o cano que sai dele fica mais largo.',
        key: 'A capacidade de uma cadeia em série é a do elo de menor capacidade.',
        f(o, t) { chain(o, t, 60, 3, 4, 2, ['pag']);
          o.cnt = [['SAÍDA', '60/s'], ['CAPACIDADE', '80/s', 'dim'], ['REPRESADO', '0/s', 'dim']];
          o.res = [['saída 60/s: nada represado', 'acc']];
          if (t > 1.5) T(o, TF(470), '4 × 20 = 80/s'); } },
      { id: 'anda', dur: 7.5, title: '100 pedidos/s: o gargalo anda', yk: 'A CONTA A 100 PEDIDOS/S', code: ['entrada 100/s', 'pedidos     90 → 100%, represa 10/s', 'pagamentos  80 → 100%, represa 10/s', 'estoque     80 ÷ 1.000 = 8%', 'banco       90 ÷ 150 = 60%'],
        story: 'A demanda sobe para 100 pedidos por segundo. Agora o primeiro a estourar é o pedidos, que aguenta 90: ficam 10/s represados na frente dele. Os 90 que passam chegam a um pagamentos de 80, que represa outros 10. A saída fica em 80. Resolver um gargalo mostrou o próximo.',
        look: 'Agora são duas pilhas vermelhas, uma na frente do pedidos e outra na frente do pagamentos. Os cubos dos dois ficam vermelhos.',
        key: 'Resolver um gargalo move o gargalo para o próximo elo.',
        f(o, t) { const s = chain(o, t, 100, 3, 4, 2);
          o.cnt = [['SAÍDA', '80/s', 'bad'], ['REPRESADO', '20/s (10 + 10)', 'bad'], ['NA FILA', thou(20 * s.sec), 'bad']];
          o.res = [['dois elos no limite: saída 80/s', 'bad']];
          if (t > 1.5) T(o, TF(300), 'o gargalo andou\npedidos 90 · pagamentos 80', 'bad'); } },
      { id: 'banco', dur: 7.5, title: '200 pedidos/s: o gargalo chega ao banco', yk: 'A CONTA COM OS DOIS ESCALADOS', code: ['pedidos     6 × 30 = 180/s', 'pagamentos  8 × 20 = 160/s', 'banco do pedidos  150/s → 100%', 'min(180, 160, 1.000, 150) = 150', 'sobram 200 − 150 = 50/s'],
        story: 'Escale os dois: o pedidos com 6 réplicas (180/s) e o pagamentos com 8 (160/s). A 200 pedidos por segundo, quem segura a fila agora é o banco do pedidos, um primário PostgreSQL que grava 150 por segundo. Mais réplicas do pedidos não ajudam, porque todas gravam no mesmo banco.',
        look: 'Os cubos do pedidos e do pagamentos se multiplicam, mas o cano do banco, ao fundo, fica vermelho e cheio, e a pilha volta na frente do pedidos.',
        key: 'Quando o gargalo é um recurso compartilhado, réplicas de serviço não aumentam a capacidade.',
        f(o, t) { const s = chain(o, t, 200, 6, 8, 2, ['ped', 'pag']);
          o.cnt = [['SAÍDA', '150/s', 'bad'], ['GARGALO', 'banco 150/s', 'bad'], ['NA FILA', thou(50 * s.sec), 'bad']];
          o.res = [['réplicas não passam do banco', 'bad']];
          if (t > 1.5) T(o, TF(560), 'banco: teto 150/s\nréplicas não ajudam', 'bad'); } },
      { id: 'errado', dur: 7.5, title: 'E se der errado: escalar o elo errado', yk: 'O ESTOQUE ESCALADO À TOA', code: ['entrada 60/s · pagamentos 2 × 20 = 40/s', 'estoque 2 → 4 réplicas = 2.000/s', 'saída = min(90, 40, 2.000, 150) = 40', 'CPU do estoque: 2 → 4 vCPU', '40 ÷ 2.000 = 2%'],
        story: 'Volte aos 60 pedidos/s com o pagamentos em 2 réplicas. Alguém olha o painel e dobra as réplicas do estoque: de 2 para 4, capacidade de 2.000/s. A saída continua em 40 por segundo e os 20/s seguem represados. A conta de CPU do estoque dobrou, e ele passou de 4% para 2%.',
        look: 'Dois cubos novos sobem embaixo do estoque, quase apagados. A pilha vermelha na frente do pagamentos continua crescendo.',
        key: 'Escalar o que não é gargalo só aumenta o custo.',
        f(o, t) { const s = chain(o, t, 60, 3, 2, 4, ['est']);
          o.cnt = [['SAÍDA', '40/s', 'bad'], ['CPU DO ESTOQUE', '4 vCPU (eram 2)', 'bad'], ['NA FILA', thou(20 * s.sec), 'bad']];
          o.res = [['o dobro de CPU, a mesma saída', 'bad']];
          if (t > 1.5) T(o, TF(690), 'estoque ×2: 2%\nsaída continua 40/s', 'bad'); } },
    ],
    vertical: [
      { id: 'uma', dur: 5.5, title: '1 réplica de 1 vCPU: 100 req/s', yk: 'A CAPACIDADE DE UMA RÉPLICA', code: ['página = 10 ms de CPU + 10 ms de espera', '1 s ÷ 10 ms de CPU = 100 req/s', 'pico das 20:03: 640 req/s'],
        story: 'Cada página de produto custa 10 ms de CPU e mais 10 ms esperando o cache e o banco. Uma réplica de 1 vCPU faz 1 s ÷ 10 ms = 100 páginas por segundo. É pouco para o pico das 20:03, de 640 req/s.',
        look: 'Um cubo só, o catalogo com 1 vCPU, atrás do lb-loja. O contador mostra 100 req/s de capacidade contra 640 de pico.',
        key: 'Capacidade de uma réplica = 1 s ÷ o tempo de CPU de uma requisição.',
        f(o, t) { o.cubes.push({ id: 'cat-v', name: '1 vCPU', sub: '100/s', p: [590, 245], s: 1, cpu: null, tone: 'acc' });
          o.beams.push({ pts: RC.c2l }, { pts: RC.l2one }); o.rows.lb = act('lb-loja', '1 réplica', ['capacidade 100/s', 'dim']);
          o.cnt = [['CAPACIDADE', '100 req/s'], ['vCPU', '1', 'dim'], ['PICO', '640 req/s', 'dim']];
          o.res = [['100 req/s por réplica de 1 vCPU', 'acc']]; } },
      { id: 'oito', dur: 6, title: 'Scale up: a mesma réplica com 8 vCPU', yk: 'A CONTA INGÊNUA', code: ['1 vCPU → 8 vCPU (mesma réplica)', '8 × 100 = 800 req/s ?', 'trocar o tamanho: em geral reinicia o pod', 'teto: a maior máquina do provedor'],
        story: 'Escalar na vertical é trocar a máquina por uma maior: a mesma réplica passa de 1 para 8 vCPU. A conta ingênua diz 8 × 100 = 800 req/s. Para trocar, em geral o pod reinicia (o Kubernetes já permite redimensionar no lugar), e há um teto: a maior máquina do provedor.',
        look: 'O cubo pequeno afunda e sobe uma caixa grande, com 8 núcleos acesos no topo.',
        key: 'Escala vertical (scale up) muda o tamanho de uma unidade.',
        f(o, t) { if (t < 0.8) o.cubes.push({ id: 'cat-v', name: '1 vCPU', sub: '100/s', p: [590, 245], s: 1, cpu: null, tone: 'acc' });
          else { o.show.big = 1; o.on.big = 1; o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: Math.min(8, Math.floor((t - 0.8) * 5) + 1), rows: [['esperado: 800 req/s ?', 'acc'], ['1 réplica só', 'dim']] }; }
          o.beams.push({ pts: RC.c2l }, { pts: t < 0.8 ? RC.l2one : RC.l2v }); o.rows.lb = act('lb-loja', '1 réplica', [t < 0.8 ? 'capacidade 100/s' : 'capacidade 800/s ?', 'dim']);
          o.cnt = [['vCPU', t < 0.8 ? '1' : '8'], ['ESPERADO', '800 req/s', 'dim'], ['RÉPLICAS', '1', 'dim']];
          o.res = t > 2 ? [['8 vCPU: 800 req/s?', 'acc']] : []; } },
      { id: 'amdahl', dur: 7, title: 'Amdahl: 6,0×, não 8×', yk: 'LEI DE AMDAHL · 1/21 SERIAL', code: ['parte serial: 1/21 (4,76%)', 'ganho = 1 ÷ (1/21 + (20/21) ÷ 8)', '      = 1 ÷ 0,1667 = 6,0×', '100 × 6,0 = 600 req/s (não 800)', '600 ÷ 8 = 75 req/s por vCPU'],
        story: 'Nem tudo paraleliza. Se 1/21 do trabalho for serial, como no relatorios do módulo 11, a lei de Amdahl dá 1 ÷ (1/21 + (20/21) ÷ 8) = 6,0×. A caixa de 8 vCPU faz 600 req/s, 75 por vCPU, contra 100 por vCPU nas réplicas pequenas. E 600 não segura o pico de 640.',
        look: 'No mostrador, a linha tracejada é o ganho ideal (8×) e a curva acesa é a de Amdahl, que para em 6,0× com 8 núcleos.',
        key: 'A parte serial limita o ganho de somar núcleos.',
        f(o, t) { o.show.big = 1; o.on.big = 1; o.chart = sg(t, 0.4, 3.4); o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: 8, rows: [['600 req/s (6,0×)', 'acc'], ['75 por vCPU', 'dim']] };
          o.beams.push({ pts: RC.c2l }, { pts: RC.l2v }); o.rows.lb = act('lb-loja', '1 réplica', ['capacidade 600/s', 'dim'], ['pico 640/s', 'bad']);
          o.cnt = [['CAPACIDADE', '600 req/s'], ['GANHO', '6,0× (não 8×)', 'dim'], ['POR vCPU', '75 req/s', 'dim']];
          o.res = t > 3.4 ? [['600 req/s < pico de 640', 'bad']] : [];
          if (t > 3.4) T(o, TF(590), '8 vCPU → 6,0×\n600 req/s'); } },
      { id: 'cai', dur: 7.5, title: 'E se der errado: a caixa única cai', yk: 'UMA RÉPLICA SÓ', code: ['1 réplica de 8 vCPU: 600 req/s', 'caiu → capacidade 0', '640 req/s × 60 s = 38.400 por minuto', '10 réplicas de 1 vCPU: cai 1, sobram 900'],
        story: 'Toda a capacidade está numa réplica só. Quando ela cai, por falha ou para trocar de tamanho, a capacidade vai de 600 para zero: 100% some de uma vez. A 640 req/s, cada minuto fora são 38.400 requisições sem resposta.',
        look: 'A caixa grande fica vermelha e os núcleos apagam. A pilha de requisições cresce na frente do lb-loja.',
        key: 'Uma unidade só é um ponto único de falha: se cai, leva 100% da capacidade.',
        f(o, t) { const down = t > 0.8, sec = clamp((t - 1) / 4.5) * 60;
          o.show.big = 1; o.on.big = down ? 'bad' : 1;
          o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: down ? 0 : 8, rows: down ? [['fora do ar', 'bad'], ['capacidade 0', 'bad']] : [['600 req/s', 'acc']] };
          o.beams.push({ pts: RC.c2l, on: true, tone: down ? 'bad' : '' }, { pts: RC.l2v, on: !down, tone: down ? 'bad' : '' });
          o.rows.lb = act('lb-loja', '1 réplica', ['640 req/s', 'acc'], [down ? 'sem réplica' : 'capacidade 600/s', down ? 'bad' : 'dim']); o.on.lb = down ? 'bad' : 1;
          if (down && t > 1) o.piles.push({ p: PILE_CAT, v: 640 * sec, f: sec / 60 });
          o.cnt = [['CAPACIDADE', down ? '0 req/s' : '600 req/s', down ? 'bad' : ''], ['SEM RESPOSTA', thou(down ? 640 * sec : 0), 'bad'], ['FORA HÁ', `${Math.round(sec)} s`, 'dim']];
          o.res = down ? [['100% da capacidade sumiu', 'bad']] : [];
          if (t > 1.5) T(o, TF(590), 'caiu a única réplica\n640 req/s sem resposta', 'bad'); } },
    ],
    horizontal: [
      { id: 'dez', dur: 6, title: '10 réplicas de 1 vCPU: 1.000 req/s', yk: 'A FROTA DO CATÁLOGO', code: ['10 réplicas × 100 = 1.000 req/s', 'pico 640 ÷ 10 = 64 req/s cada', 'CPU 64% → R = 10 + 10 ÷ 0,36 = 37,8 ms', 'sessão no Redis · lb-loja reparte'],
        story: 'Escalar na horizontal é somar unidades: 10 réplicas de 1 vCPU, catalogo-1 a catalogo-10, fazem 10 × 100 = 1.000 req/s. O lb-loja reparte o pico de 640: 64 para cada uma, 64% de CPU, 37,8 ms por página. Isso só funciona com a sessão fora do processo (no Redis, módulo 5) e um balanceador na frente (módulo 7).',
        look: 'Dez cubos a 64% atrás do lb-loja; a luz corre do lb-loja para as duas fileiras.',
        key: 'Escala horizontal (scale out) muda o número de unidades.',
        f(o, t) { fleet(o, reps(10, 64)); o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], ['÷ 10 = 64 cada', 'dim']);
          o.cnt = [['CAPACIDADE', '1.000 req/s'], ['CPU', '64%', 'dim'], ['TEMPO', '37,8 ms', 'dim']];
          o.res = [['folga: 1.000 − 640 = 360 req/s', 'acc']];
          if (t > 1.5) T(o, TF(620), '10 × 1 vCPU\n1.000 req/s'); } },
      { id: 'caem', dur: 8, title: 'Caem 1, 2, 3 réplicas: 71%, 80%, 91%', yk: 'O PICO DIVIDIDO PELAS QUE FICAM', code: [' N   CPU      R', '10   64%     37,8 ms', ' 9   71,1%   44,6 ms', ' 8   80%     60 ms', ' 7   91,4%  126,7 ms'],
        story: 'Réplicas caem: falha de máquina, deploy, uma zona fora. O pico continua 640 req/s e se reparte entre as que ficam. Com 9, cada uma vai a 71,1% (44,6 ms). Com 8, a 80% (60 ms). Com 7, a 91,4% (126,7 ms): ainda responde, mas o tempo mais que triplicou.',
        look: 'Um cubo de cada vez fica vermelho e afunda; os que ficam acendem mais e o número de cada um sobe.',
        key: 'Folga é o que sobra depois de cair k réplicas: N+k.',
        f(o, t) { const out = [6, 1, 8].filter((_, k) => t > 1 + k * 2), n = 10 - out.length, cpu = 640 / n;
          fleet(o, reps(10, cpu).map((c, i) => out.includes(i) ? { ...c, down: true } : c));
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [`÷ ${n} = ${dec(cpu)} cada`, 'dim']);
          o.cnt = [['RÉPLICAS', `${n} de 10`, out.length ? 'bad' : ''], ['CPU', pct(cpu), cpu > 90 ? 'bad' : 'dim'], ['TEMPO', `${dec(Rms(cpu / 100))} ms`, 'dim']];
          o.res = out.length ? [[`${out.length} fora: ${pct(cpu)} em cada uma`, n < 8 ? 'bad' : 'acc']] : [];
          if (n < 10) T(o, TF(620), `${n} réplicas: ${pct(cpu)}\nR = ${dec(Rms(cpu / 100))} ms`, n < 8 ? 'bad' : 'acc'); } },
      { id: 'quatro', dur: 8, title: 'E se der errado: cai a quarta, 107%', yk: 'DEMANDA ACIMA DA CAPACIDADE', code: ['6 réplicas × 100 = 600 req/s', 'pico 640 > 600 → 106,7%', 'fila: +40 req/s = 2.400 por minuto', 'quem passa de 2 s leva 504'],
        story: 'Cai a quarta. Seis réplicas fazem 600 req/s e o pico é 640: a utilização passa de 100% (106,7%). Não existe tempo de resposta estável: a fila cresce 40 req/s, 2.400 por minuto, e quem espera mais de 2 s leva 504 do lb-loja.',
        look: 'Seis cubos vermelhos acima de 100%; a pilha na frente do lb-loja cresce sem parar.',
        key: 'Com a demanda acima da capacidade, a fila cresce sem limite.',
        f(o, t) { const down4 = t > 0.8, out = down4 ? [6, 1, 8, 4] : [6, 1, 8], n = 10 - out.length, cpu = 640 / n, sec = clamp((t - 1) / 4.5) * 60;
          fleet(o, reps(10, cpu).map((c, i) => out.includes(i) ? { ...c, down: true } : c), down4 ? 'bad' : '');
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [down4 ? 'capacidade 600/s' : `÷ ${n} = ${dec(cpu)} cada`, down4 ? 'bad' : 'dim']);
          if (down4 && t > 1) o.piles.push({ p: PILE_CAT, v: 40 * sec, f: sec / 60 });
          o.cnt = [['CPU', pct(cpu), down4 ? 'bad' : ''], ['NA FILA', thou(down4 ? 40 * sec : 0), 'bad'], ['RÉPLICAS', `${n} de 10`, 'dim']];
          o.res = down4 ? [['demanda > capacidade: a fila só cresce', 'bad']] : [];
          if (down4) T(o, TF(620), '6 réplicas: 106,7%\n+2.400 por minuto', 'bad'); } },
    ],
    hpa: [
      { id: 'pico', dur: 5.5, title: 'Pico de 950 req/s: 10 réplicas a 95%', yk: 'A BLACK FRIDAY DO ANO QUE VEM', code: ['950 req/s ÷ 10 réplicas = 95 cada', 'CPU 95% → R = 10 + 10 ÷ 0,05 = 210 ms', 'HPA: alvo 70% de CPU, lê a cada 15 s'],
        story: 'A Black Friday do ano que vem chega a 950 req/s. Com 10 réplicas, cada uma fica a 95% de CPU e a página leva 210 ms. O HPA, o autoscaler horizontal de pods do Kubernetes, lê a CPU média a cada 15 s. O alvo configurado é 70%.',
        look: 'Os dez cubos a 95%, vermelhos. O HPA, na frente, mostra a média medida e o alvo.',
        key: 'O HPA compara a métrica medida com um alvo.',
        f(o, t) { fleet(o, reps(10, 95)); o.rows.cli = act('CLIENTES', 'pico', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc'], ['÷ 10 = 95 cada', 'dim']);
          o.rows.hpa = act('HPA', 'alvo CPU 70%', ['CPU média: 95%', 'bad'], ['alvo: 70%', 'dim'], ['lê a cada 15 s', 'dim']); o.on.hpa = 1;
          o.cnt = [['CPU MÉDIA', '95%', 'bad'], ['ALVO', '70%', 'dim'], ['TEMPO', '210 ms', 'dim']];
          o.res = [['95% > 70%: o HPA vai agir', 'acc']]; } },
      { id: 'conta', dur: 6, title: 'A fórmula: ⌈10 × 95 ÷ 70⌉ = 14', yk: 'O ALGORITMO DO HPA', code: ['desejadas = ⌈atuais × atual ÷ alvo⌉', '= ⌈10 × 95 ÷ 70⌉ = ⌈13,57⌉ = 14', 'razão 95 ÷ 70 = 1,36 (fora de ±10%)', 'pela vazão: ⌈950 ÷ 70⌉ = 14'],
        story: 'A conta do HPA é desejadas = ⌈atuais × atual ÷ alvo⌉. 10 × 95 ÷ 70 = 13,57, e o ⌈ ⌉ arredonda para cima: 14. A razão 95 ÷ 70 = 1,36 está fora da tolerância de 10% (0,9 a 1,1), então ele age. Pela vazão dá o mesmo: alvo de 70 req/s por réplica, ⌈950 ÷ 70⌉ = 14.',
        look: 'O HPA monta a conta linha por linha, e o 14 acende.',
        key: 'desejadas = ⌈atuais × atual ÷ alvo⌉, sempre arredondando para cima.',
        f(o, t) { fleet(o, reps(10, 95)); o.rows.cli = act('CLIENTES', 'pico', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'alvo CPU 70%', ['10 × 95 ÷ 70 = 13,57', t > 0.6 ? 'acc' : 'dim'], t > 1.6 ? ['⌈13,57⌉ = 14 réplicas', 'acc'] : null, t > 2.6 ? ['razão 1,36 > 1,1: age', 'dim'] : null);
          o.cnt = [['DESEJADAS', t > 1.6 ? '14' : '…'], ['RAZÃO', '1,36', 'dim'], ['TOLERÂNCIA', '0,9 a 1,1', 'dim']];
          o.res = t > 1.6 ? [['desejadas: 14 réplicas', 'acc']] : [];
          if (t > 1.6) T(o, TF(620), '⌈13,57⌉ = 14'); } },
      { id: 'sobe', dur: 7.5, title: '10 → 14 num passo: 67,9%', yk: 'A SUBIDA', code: ['subida: máx(+4 pods, +100%) a cada 15 s', '10 → 14 cabe num passo', 'pod novo pronto em ~30 s (conta 0%)', '950 ÷ 1.400 = 67,9% → R = 41,1 ms'],
        story: 'A política padrão de subida deixa somar 4 pods ou 100% a cada 15 s, o que for maior: de 10 para 14 cabe num passo só. Os 4 pods novos levam uns 30 s para ficar prontos e, até lá, entram na conta como 0%. Prontos, as 14 réplicas dividem 950 req/s: 67,9% de CPU e 41,1 ms por página.',
        look: 'Quatro cubos novos sobem, primeiro apagados ("subindo"). Quando ficam prontos, todos os 14 acendem a 67,9%.',
        key: 'O HPA sobe réplicas em passos de 15 s até a média voltar ao alvo.',
        f(o, t) { const ready = t > 4, sec = Math.round(clamp((t - 1) / 3) * 30);
          const list = reps(t > 1 ? 14 : 10, ready ? 950 / 14 : 95).map((c, i) => i >= 10 && !ready ? { ...c, cpu: 0, sub: 'subindo' } : c);
          fleet(o, list); o.rows.cli = act('CLIENTES', 'pico', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc'], [ready ? '÷ 14 = 67,9 cada' : '÷ 10 = 95 cada', 'dim']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'alvo CPU 70%', ['desejadas: 14', 'acc'], ['+4 pods num passo', 'dim'], [ready ? 'CPU média: 67,9%' : `pods novos: ${sec} de ~30 s`, ready ? 'acc' : 'dim']);
          o.cnt = [['RÉPLICAS', t > 1 ? '14' : '10'], ['CPU', ready ? '67,9%' : '95%', ready ? 'dim' : 'bad'], ['TEMPO', ready ? '41,1 ms' : '210 ms', 'dim']];
          o.res = ready ? [['14 réplicas a 67,9%: abaixo do alvo', 'acc']] : t > 1 ? [['4 pods subindo (contam 0%)', 'acc']] : [];
          if (ready) T(o, TF(620), '950 ÷ 1.400 = 67,9%\nR = 41,1 ms'); } },
      { id: 'tarde', dur: 9, title: 'E se der errado: o pico chega antes do HPA', yk: 'QUEM REAGE DEPOIS', code: ['640 → 1.100 req/s em 10 s (teto 1.000)', '⌈10 × 110 ÷ 70⌉ = ⌈15,7⌉ = 16', 'métrica + 15 s + ~30 s de pod ≈ 60 s', '100 req/s × 60 s = 6.000 de 66.000', '= 9,1% recusadas ou atrasadas'],
        story: 'O tráfego sobe de 640 para 1.100 req/s em 10 s, e a capacidade é 1.000. O HPA calcula ⌈10 × 110 ÷ 70⌉ = 16, mas entre a métrica chegar, a decisão de 15 s e os ~30 s do pod ficar pronto passam uns 60 s. Nesse minuto sobram 100 req/s: 6.000 requisições recusadas ou atrasadas, 9,1% de 66.000. A newsletter das 20:00 era conhecida: dava para subir o mínimo de réplicas antes.',
        look: 'Os dez cubos passam de 100% e ficam vermelhos; o relógio corre até 60 s e a pilha cresce até 6.000. Só então os 6 cubos novos acendem.',
        key: 'O HPA reage depois do pico: para um pico conhecido, folga ou mínimo de réplicas antes.',
        f(o, t) { const dem = 640 + 460 * sg(t, 0.4, 1.4), sec = clamp((t - 1.4) / 5) * 60, ready = sec >= 60, n = t > 2.6 ? 16 : 10;
          const list = reps(n, ready ? 1100 / 16 : dem / 10).map((c, i) => i >= 10 && !ready ? { ...c, cpu: 0, sub: 'subindo' } : c);
          fleet(o, list, !ready && dem > 1000 ? 'bad' : ''); o.rows.cli = act('CLIENTES', 'pico', [`${thou(dem)} req/s`, dem > 1000 ? 'bad' : 'acc']);
          o.rows.lb = act('lb-loja', 'round robin', [`${thou(dem)} req/s`, 'acc'], [ready ? 'capacidade 1.600/s' : 'capacidade 1.000/s', !ready && dem > 1000 ? 'bad' : 'dim']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'alvo CPU 70%', ['⌈10 × 110 ÷ 70⌉ = 16', 'acc'], [`t = ${Math.round(sec)} s`, ready ? 'dim' : 'bad'], [ready ? '16 prontas: 68,8%' : 'pods prontos em ~60 s', 'dim']);
          if (dem > 1000 && t > 1.4) o.piles.push({ p: PILE_CAT, v: 100 * sec, f: sec / 60 });
          o.cnt = [['RELÓGIO', `${Math.round(sec)} s`], ['RECUSADAS', thou(100 * sec), 'bad'], ['RÉPLICAS', ready ? '16' : n > 10 ? '10 + 6 subindo' : '10', 'dim']];
          o.res = ready ? [['6.000 de 66.000 (9,1%) perdidas', 'bad']] : t > 1.4 ? [['100 req/s acima da capacidade', 'bad']] : [];
          if (t > 1.6) T(o, TF(620), ready ? '6.000 recusadas\nantes de as 16 ficarem prontas' : `1.100 > 1.000\n+100 req/s sem lugar`, 'bad'); } },
    ],
    'hpa-media': [
      { id: 'media', dur: 6, title: 'A média de 67,5% esconde a catalogo-3 a 99%', yk: 'O QUE O HPA RECEBE', code: ['9 réplicas a 64% + catalogo-3 a 99%', 'média = (9 × 64 + 99) ÷ 10 = 67,5%', 'o HPA só recebe a média'],
        story: 'De volta ao pico das 20:03: 640 req/s. As buscas pesadas caíram quase todas na catalogo-3, que está a 99%; as outras nove estão a 64%. O HPA não olha cada réplica: olha a média, (9 × 64 + 99) ÷ 10 = 67,5%.',
        look: 'Nove cubos a 64% e a catalogo-3 vermelha a 99%. O HPA mostra um número só: 67,5%.',
        key: 'A métrica do HPA é a média dos pods, e a média não mostra a réplica quente.',
        f(o, t) { fleet(o, reps(10, 64, { 2: { cpu: 99 } })); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU por média', ['(9 × 64 + 99) ÷ 10', 'dim'], ['= 67,5%', 'acc'], ['não vê a catalogo-3', 'dim']);
          o.cnt = [['MÉDIA', '67,5%'], ['catalogo-3', '99%', 'bad'], ['AS OUTRAS 9', '64%', 'dim']];
          o.res = [['a média fica abaixo dos 70%', 'acc']];
          if (t > 1.5) T(o, TF(500), 'catalogo-3: 99%\nmédia: 67,5%', 'bad'); } },
      { id: 'alvo70', dur: 6, title: 'Alvo 70%: o HPA não faz nada', yk: 'DENTRO DA TOLERÂNCIA', code: ['razão = 67,5 ÷ 70 = 0,964', 'tolerância: 0,9 a 1,1 → não age', 'catalogo-3 segue a 99%', 'e o p99 da frota segue em 2.000 ms'],
        story: 'Com alvo de 70%, a razão é 67,5 ÷ 70 = 0,964. Fica dentro da tolerância de 10% (entre 0,9 e 1,1), e o HPA não muda nada. A catalogo-3 segue a 99%, e é dela o p99 de 2.000 ms da amostra.',
        look: 'O HPA calcula 0,964, fica dentro da faixa e mostra "sem mudança". A catalogo-3 continua vermelha.',
        key: 'Dentro da tolerância o HPA não age, mesmo com uma réplica no limite.',
        f(o, t) { fleet(o, reps(10, 64, { 2: { cpu: 99 } })); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'alvo CPU 70%', ['67,5 ÷ 70 = 0,964', 'acc'], t > 1.2 ? ['dentro de 0,9 a 1,1', 'dim'] : null, t > 2.2 ? ['sem mudança: 10', 'bad'] : null);
          o.cnt = [['RAZÃO', '0,964'], ['DESEJADAS', t > 2.2 ? '10 (nada)' : '…', 'bad'], ['catalogo-3', '99%', 'bad']];
          o.res = t > 2.2 ? [['nada muda: a catalogo-3 segue a 99%', 'bad']] : [];
          if (t > 2.2) T(o, TF(500), '0,964: dentro da tolerância\no HPA não faz nada', 'bad'); } },
      { id: 'alvo80', dur: 9, title: 'E se der errado: alvo 80%, o HPA tira uma réplica', yk: 'A DESCIDA NO PIOR MOMENTO', code: ['razão = 67,5 ÷ 80 = 0,844', '⌈10 × 0,844⌉ = ⌈8,44⌉ = 9', 'a descida espera 300 s (estabilização)', '9 réplicas: 640 ÷ 9 = 71,1% cada'],
        story: 'Com alvo de 80%, a razão é 67,5 ÷ 80 = 0,844, fora da tolerância para baixo: ⌈10 × 0,844⌉ = 9. A janela de estabilização da descida, de 300 s por padrão, atrasa a remoção, mas ela vem: o HPA tira uma réplica no pior momento. As outras passam de 64% para 71%, e a catalogo-3 continua no limite. O conserto está no balanceador (módulo 7) e em olhar p95 e p99 por réplica.',
        look: 'O relógio da janela conta até 300 s; um cubo fica vermelho e afunda; os que ficam sobem para 71,1%.',
        key: 'Escalar pela média pode tirar capacidade justo quando uma réplica está saturada.',
        f(o, t) { const win = Math.round(clamp((t - 1.2) / 4) * 300), gone = win >= 300;
          fleet(o, reps(10, gone ? 640 / 9 : 64, { 2: { cpu: 99, sub: gone ? '99%+' : undefined }, 9: gone ? { down: true } : {} })); o.on.hpa = gone ? 'bad' : 1;
          o.rows.hpa = act('HPA', 'alvo CPU 80%', ['67,5 ÷ 80 = 0,844', 'acc'], ['⌈10 × 0,844⌉ = 9', 'bad'], [`janela: ${win} de 300 s`, 'dim']);
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [gone ? '÷ 9 = 71,1 cada' : '÷ 10 = 64 cada', 'dim']);
          o.cnt = [['DESEJADAS', '9', 'bad'], ['JANELA', `${win} de 300 s`, 'dim'], ['AS OUTRAS', gone ? '71,1%' : '64%', 'dim']];
          o.res = gone ? [['tirou uma réplica com a catalogo-3 a 99%', 'bad']] : [];
          if (gone) T(o, TF(560), 'alvo 80%: 10 → 9\nno pior momento', 'bad'); } },
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
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi;
    head(x, u, d, W_, col, 14); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
    if (Bk.kind === 'big') {
      // os 8 núcleos (acendem um a um) e, à direita, o ganho ideal × o de Amdahl
      for (let i = 0; i < 8; i++) { const cx = 8 + (i % 4) * 34, cy = 30 + (i >> 2) * 34, lit = i < (d.cores || 0);
        x.fillStyle = lit ? accC() : theme === 'light' ? '#e2e2e1' : '#202124'; x.fillRect(u(cx), u(cy), u(28), u(28));
        x.fillStyle = lit ? (theme === 'light' ? '#f6f6f5' : '#141516') : INK(); x.textAlign = 'center'; fitFont(x, u, String(i + 1), 12, 24); x.fillText(String(i + 1), u(cx + 14), u(cy + 15)); x.textAlign = 'left'; }
      let y = 42; for (const [text, tn] of d.rows || []) { x.fillStyle = toneC(tn); fitFont(x, u, text, 15, W_ - 170); x.fillText(text, u(160), u(y)); y += 24; }
    } else {
      let y = 34; for (const [text, tn] of d.rows || []) { x.fillStyle = on === 'bad' && tn !== 'acc' && tn !== 'dim' ? BAD() : toneC(tn); fitFont(x, u, text, 12, W_ - 10); x.fillText(text, u(5), u(y)); y += 18; }
    }
    cv.tex.needsUpdate = true;
  }
  function drawCube(Cb, c) {
    const key = JSON.stringify([c.name, c.cpu, c.sub, c.tone, c.down, c.s]) + theme + accent.getHex(); if (Cb.key === key) return; Cb.key = key;
    const cv = Cb.top, bad = c.tone === 'bad', on = c.tone === 'acc', { x, u, C } = frameBox(cv, on, bad ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const small = c.s < 0.8, main = c.down ? 'fora' : c.sub || (c.cpu != null ? (small ? Math.round(c.cpu) + '%' : pct(c.cpu)) : '');
    x.textAlign = 'center';
    if (!small && c.name) { x.fillStyle = bad ? BAD() : INK(); fitFont(x, u, c.name, 9.5, W_ - 6); x.fillText(c.name, u(W_ / 2), u(9)); }
    x.fillStyle = bad ? BAD() : on ? accC() : C.inkHi; fitFont(x, u, main, small ? 21 : 16, W_ - 6); x.fillText(main, u(W_ / 2), u(small ? H_ * 0.42 : 27));
    if (c.cpu != null && !c.down) { const bh = small ? 8 : 6, by = H_ - bh - 5, bw = W_ - 10;
      x.fillStyle = theme === 'light' ? '#e2e2e1' : '#202124'; x.fillRect(u(5), u(by), u(bw), u(bh));
      x.fillStyle = bad ? BAD() : accC(); x.fillRect(u(5), u(by), u(bw * clamp(c.cpu / 100)), u(bh)); }
    x.textAlign = 'left'; cv.tex.needsUpdate = true;
  }
  function placeCubes(list, dt) {
    const want = new Set(list.map(c => c.id));
    CUBES.forEach(Cb => { if (Cb.id && !want.has(Cb.id) && Cb.f <= 0.01) Cb.id = null; });
    list.forEach(c => { let Cb = CUBES.find(k => k.id === c.id); if (!Cb) { Cb = CUBES.find(k => !k.id); if (!Cb) return; Cb.id = c.id; Cb.f = 0; Cb.pos = null; Cb.key = ''; Cb.sc = c.s; } Cb.d = c; });
    CUBES.forEach(Cb => {
      if (!Cb.id) { Cb.g.visible = false; Cb.glow.material.uniforms.intensity.value = 0; return; }
      const c = Cb.d, here = want.has(Cb.id), to = here ? (c.down ? 0.4 : 1) : 0, k = 1 - Math.exp(-dt / 0.25);
      Cb.f += Math.sign(to - Cb.f) * Math.min(Math.abs(to - Cb.f), dt / 0.55);
      Cb.pos = Cb.pos ? mix(Cb.pos, c.p, k) : c.p.slice(); Cb.sc += (c.s - Cb.sc) * k;
      const e = ease(clamp(Cb.f)), s = Cb.sc; Cb.g.visible = Cb.f > 0.01; Cb.g.scale.setScalar(s);
      Cb.g.position.copy(W(Cb.pos[0] - CU_W * s / 2, Cb.pos[1] - CU_D * s / 2, PL - (1 - e) * (CU_H * s + 3)));
      if (Cb.g.visible) drawCube(Cb, c);
      const bad = c.tone === 'bad', live = !c.down && here, u = clamp((c.cpu || 0) / 100);
      Cb.mat.emissive.copy(bad ? badEm : accent); Cb.mat.emissiveIntensity = !live ? 0 : bad ? 0.45 : c.cpu != null ? 0.1 + u * 0.5 : 0.3;
      moveGlow(Cb.glow, [Cb.pos[0], Cb.pos[1] - CU_D * s * 0.62, PL + CU_H * s], live && bad && Cb.f > 0.9 ? 0.3 : 0);
    });
  }
  function cardFace(cv, lab) { const { x, P } = cv, u = v => v * P, light = theme === 'light', W_ = cv.c.width / P, H_ = cv.c.height / P;
    x.fillStyle = light ? '#f4e4e2' : '#24130f'; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = BAD(); x.lineWidth = u(1.2); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    if (lab) { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = BAD(); fitFont(x, u, lab, 13, W_ - 5); x.fillText(lab, u(W_ / 2), u(H_ / 2)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true; }
  function placePiles(piles) {
    let i = 0;
    for (const pl of piles) { const n = Math.max(1, Math.ceil(clamp(pl.f) * KMAX)), z0 = pl.p[2] ?? PL + 8;
      for (let k = 0; k < n && i < CARDS.length; k++, i++) { const Cd = CARDS[i], lab = k === n - 1 ? '+' + thou(pl.v) : '';
        Cd.g.visible = true; Cd.g.position.copy(W(pl.p[0] - KW / 2, pl.p[1] - KD / 2, z0 + k * (KH + 1)));
        const key = lab + theme; if (Cd.key !== key) { Cd.key = key; cardFace(Cd.top, lab); }
        Cd.mat.emissive.copy(badEm); Cd.mat.emissiveIntensity = 0.5; moveGlow(Cd.glow, [pl.p[0], pl.p[1], z0 + (k + 1) * (KH + 1) + 2], k === n - 1 ? 0.35 : 0); } }
    for (; i < CARDS.length; i++) { CARDS[i].g.visible = false; CARDS[i].glow.material.uniforms.intensity.value = 0; }
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc, o.chart]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'A CONTA', L0, 10, Wd - L0 - 8);
    if (o.chart != null) {   // ganho × vCPU: o ideal (tracejado) e o de Amdahl com 1/21 serial
      const X0 = L0 + 20, X1 = L0 + 150, Y0 = 28, Y1 = 126, px = n => X0 + (n - 1) / 7 * (X1 - X0), py = v => Y1 - (v - 1) / 7 * (Y1 - Y0);
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.beginPath(); x.moveTo(u(X0), u(Y0 - 4)); x.lineTo(u(X0), u(Y1)); x.lineTo(u(X1 + 6), u(Y1)); x.stroke();
      x.fillStyle = INK(); fitFont(x, u, '1×', 8.4, 20); x.textAlign = 'right'; x.fillText('1×', u(X0 - 3), u(Y1)); x.fillText('8×', u(X0 - 3), u(Y0));
      x.textAlign = 'center'; [1, 2, 4, 8].forEach(n => x.fillText(String(n), u(px(n)), u(Y1 + 8))); x.textAlign = 'left'; x.fillText('vCPU', u(X1 + 8), u(Y1 + 8));
      x.setLineDash([u(2.5), u(2.5)]); x.strokeStyle = INK(); x.lineWidth = u(0.9); x.beginPath(); x.moveTo(u(px(1)), u(py(1))); x.lineTo(u(px(8)), u(py(8))); x.stroke(); x.setLineDash([]);
      x.fillStyle = INK(); fitFont(x, u, '8× ideal', 8.6, 50); x.fillText('8× ideal', u(px(8) + 4), u(py(8)));
      const end = 1 + 7 * clamp(o.chart); x.strokeStyle = acc; x.lineWidth = u(1.8); x.beginPath();
      for (let n = 1; n <= end + 1e-6; n += 0.1) { const X = u(px(n)), Y = u(py(amdahl(n))); n === 1 ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.stroke();
      x.fillStyle = acc; x.beginPath(); x.arc(u(px(end)), u(py(amdahl(end))), u(2.4), 0, Math.PI * 2); x.fill();
      fitFont(x, u, dec(amdahl(end)) + '×', 11, 40); x.fillText(dec(amdahl(end)) + '×', u(px(end) + 5), u(py(amdahl(end)) + 6));
    } else {
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    cadeia: () => `<table class="h3-sum"><tr><th>serviço</th><th>réplicas</th><th>CPU/pedido</th><th>capacidade</th></tr><tr><td>pedidos</td><td>3 × 1 vCPU</td><td>33 ms</td><td>90/s</td></tr><tr class="on"><td>pagamentos</td><td>2 × 1 vCPU</td><td>50 ms</td><td>40/s</td></tr><tr><td>estoque</td><td>2 × 1 vCPU</td><td>2 ms</td><td>1.000/s</td></tr><tr><td>banco do pedidos</td><td>1 primário</td><td>—</td><td>150/s</td></tr></table><li>30 pedidos/s (hoje): pagamentos a <b>75%</b>, R = 50 ÷ 0,25 = <b>200 ms</b></li><li>60 pedidos/s: saída <b>40</b>, represados <b>20/s</b> (33%), <b>1.200</b> em 60 s</li><li>Conta do artigo: A = 100, B = 60, C = 300; entram 120, saem <b>60</b> (50%)</li><li>No passo 5, 6 e 8 réplicas são um exemplo: qualquer número acima de 150/s para no banco</li><li>Custo: frota fixa <b>240</b> réplica-horas × elástica <b>80</b> (33%)</li>`,
    vertical: () => `<table class="h3-sum"><tr><th>vCPU</th><th>ganho (Amdahl, 1/21 serial)</th><th>req/s</th></tr><tr><td>1</td><td>1,0×</td><td>100</td></tr><tr><td>2</td><td>1,9×</td><td>191</td></tr><tr><td>4</td><td>3,5×</td><td>350</td></tr><tr class="on"><td>8</td><td>6,0×</td><td>600</td></tr></table><li>Horizontal: 10 × 1 vCPU = <b>1.000 req/s</b> (100 por vCPU); vertical: 8 vCPU = <b>600</b> (75 por vCPU)</li><li>Trocar o tamanho em geral reinicia o pod; o Kubernetes tem redimensionamento no lugar e o VPA</li><li>Teto: a maior máquina do provedor</li><li>A réplica única cai: <b>100%</b> da capacidade some; 640 × 60 = <b>38.400</b> por minuto sem resposta</li>`,
    horizontal: () => `<table class="h3-sum"><tr><th>réplicas</th><th>CPU</th><th>R</th></tr><tr><td>10</td><td>64%</td><td>37,8 ms</td></tr><tr><td>9</td><td>71,1%</td><td>44,6 ms</td></tr><tr><td>8</td><td>80%</td><td>60 ms</td></tr><tr><td>7</td><td>91,4%</td><td>126,7 ms</td></tr><tr class="on"><td>6</td><td>106,7%</td><td>satura: +2.400/min</td></tr></table><li>R(ρ) = 10 ms + 10 ms ÷ (1 − ρ): modelo de fila de brinquedo (M/M/1)</li><li>Pico das 20:03: <b>640 req/s</b>; capacidade <b>1.000</b> (10 × 100); seguro até <b>700</b> (70%)</li><li>Exige estado fora do processo (sessão no Redis) e balanceador (lb-loja)</li><li>Elasticidade: ajustar a capacidade para cima <b>e para baixo</b>, sozinha, conforme a demanda</li>`,
    hpa: () => `<li><b>desejadas = ⌈atuais × atual ÷ alvo⌉</b>; tolerância <b>0,1</b>; avalia a cada <b>15 s</b></li><table class="h3-sum"><tr><th>cenário</th><th>conta</th><th>réplicas</th></tr><tr class="on"><td>950 req/s, CPU 95%</td><td>⌈10 × 95 ÷ 70⌉</td><td>14</td></tr><tr><td>pela vazão</td><td>⌈950 ÷ 70⌉</td><td>14</td></tr><tr><td>pico de 1.100 req/s</td><td>⌈10 × 110 ÷ 70⌉</td><td>16</td></tr></table><li>Subida padrão: +4 pods ou +100% a cada 15 s (o maior); descida espera <b>300 s</b></li><li>CPU é % dos <b>requests</b> do pod, média entre os pods; pod ainda não pronto conta <b>0%</b> na subida</li><li>Pico de 1.100: ~60 s até reagir → <b>6.000</b> de 66.000 (9,1%)</li><li>O retry do Davi (pedido 1052) também somou uma requisição ao pico</li>`,
    'hpa-media': () => `<table class="h3-sum"><tr><th>alvo</th><th>razão</th><th>resultado</th></tr><tr><td>60%</td><td>67,5 ÷ 60 = 1,125</td><td>⌈11,25⌉ = 12</td></tr><tr><td>70%</td><td>0,964</td><td>nada (10)</td></tr><tr class="on"><td>80%</td><td>0,844</td><td>⌈8,44⌉ = 9</td></tr></table><li>Frota: (9 × 64 + 99) ÷ 10 = <b>67,5%</b>; catalogo-3 a <b>99%</b></li><li>Conserto: least outstanding requests e peso no balanceador (módulo 7); p95 e p99 <b>por réplica</b></li><li>Descida: janela de estabilização de <b>300 s</b> por padrão</li>`,
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
  function readout() { if (active !== 'capacidade') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'capacidade' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-capacidade3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'capacidade') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] && o.pos[nm] ? 1 : 0, to = o.pos[nm];
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      if (to) { if (!Bk.pos || Bk.f < 0.02) Bk.pos = to.slice(); else { const k = 1 - Math.exp(-dt / 0.25); Bk.pos = mix(Bk.pos, to, k); } }
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01 && !!Bk.pos;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, Bk.pos ? [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3] : [0, 0, 0], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); setPipes(o.pipes);
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    placeCubes(o.cubes, dt); placePiles(o.piles); drawScreen(o);
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
      const [x0, x1, y0, y1] = [-10, 920, 8, 455];
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
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...CUBES.map(c => c.top), ...CARDS.map(c => c.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); [...CUBES, ...CARDS].forEach(c => c.key = '');
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); pipeMat.color.set(t === 'light' ? 0xc3c6c8 : 0x2b2e30); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] && o.pos[nm] ? 1 : 0; if (o.pos[nm]) B[nm].pos = o.pos[nm].slice(); }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
