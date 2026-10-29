// Figura 3D (iso-glow): capacidade, escala vertical × horizontal e o HPA. Na cadeia do checkout, cada serviço é um bloco,
// o cano que sai dele tem a largura da capacidade e a faixa acesa dentro do cano é o que passa de fato; o que não cabe
// transborda e vira pilha vermelha na frente do elo. Embaixo, as réplicas são cubos que acendem com a CPU.
// No catálogo, o lb-loja reparte o pico entre os cubos (catalogo-1 … catalogo-16), uma caixa de 8 vCPU faz a vertical
// e o HPA, na frente, faz a conta. Atrás, o mostrador (contadores, a conta do passo e o resultado).
// Cenários (toggle e ?mode=cadeia|vertical|horizontal|hpa|hpa-media; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/performance-brief.md). As contas (cadeia, R(ρ) = 10 + 10 ÷ (1 − ρ),
// Amdahl com 1/21 serial, quedas, HPA com ceil e tolerância de 10%) batem com o brief.
FIGS3D.push({ id: 'capacidade', name: 'Capacity and scaling', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const mix = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  const pct = v => dec(v) + '%';
  const Rms = rho => 10 + 10 / (1 - rho);   // a curva do joelho do módulo (M/M/1 de brinquedo)
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['cadeia', 'vertical', 'horizontal', 'hpa', 'hpa-media'];
  const SCNAME = { cadeia: 'Chain', vertical: 'Vertical', horizontal: 'Horizontal', hpa: 'HPA', 'hpa-media': 'HPA average' };
  const SCFULL = { cadeia: 'The checkout chain', vertical: 'Scaling vertically', horizontal: 'Scaling horizontally',
    hpa: 'The HPA formula', 'hpa-media': 'The HPA and the hot replica' };
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
    if (sc !== 'cadeia') { o.rows.cli = act('CLIENTS', 'peak', ['640 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc']);
      o.rows.hpa = act('HPA', 'CPU target 70%', ['reads every 15 s', 'dim']); }
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
    o.rows.cli = act('CHECKOUT', 'input', [`${dem} orders/s`, 'acc'], [`out ${out}/s`, qP + qG ? 'bad' : 'dim']);
    o.rows.ped = act('pedidos', `${nP} replicas`, [`capacity ${cP}/s`, 'dim'], [`CPU ${r(uP)}%`, tn(uP)], qP && cP <= cD ? [`backs up ${qP}/s`, 'bad'] : [`passes ${oP}/s`, 'dim']);
    o.rows.pag = act('pagamentos', `${nG} replicas`, [`capacity ${cG}/s`, 'dim'], [`CPU ${r(uG)}%`, tn(uG)], qG ? [`backs up ${qG}/s`, 'bad'] : [`passes ${oG}/s`, 'dim']);
    o.rows.est = act('estoque', `${nE} replicas`, [`capacity ${thou(cE)}/s`, 'dim'], [`CPU ${r(uE)}%`, tn(uE)], [`passes ${out}/s`, 'dim']);
    o.rows.db = act('pedidos DB', 'PostgreSQL', ['cap 150/s', 'dim'], [`use ${r(uD)}%`, tn(uD)], qP && cD < cP ? [`backs up ${qP}/s`, 'bad'] : null);
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
      { id: 'trinta', dur: 6, title: '30 orders/s: the chain keeps up', yk: 'THE MATH FOR EACH LINK', code: ['pedidos     3 × 30 = 90/s   → 33%', 'pagamentos  2 × 20 = 40/s   → 75%', 'estoque     2 × 500 = 1,000/s → 3%', 'pedidos DB  150/s          → 20%', 'pagamentos at 75%: R = 50 ÷ 0.25 = 200 ms'],
        story: 'Every checkout order goes through pedidos, which writes to the DB, then through pagamentos and estoque. On today\'s Black Friday 30 orders per second arrive, and all of them get through. But pagamentos is already at 75% CPU: each charge takes 200 ms instead of 50, four times the time without a queue.',
        look: 'The lit stripe comes in from the left and runs through every pipe. The width of each pipe is the capacity of the service it leaves from. The cubes under each service are the replicas; the pagamentos ones are the brightest.',
        key: 'Capacity is the most work you can do with an acceptable response; the weakest link shows up before it blows.',
        f(o, t) { chain(o, t, 30, 3, 2, 2, ['pag']);
          o.cnt = [['OUTPUT', '30/s'], ['BACKED UP', '0/s', 'dim'], ['TIGHTEST', 'pagamentos 75%', 'dim']];
          o.res = [['all 30 orders/s get through', 'acc']];
          if (t > 1.5) T(o, TF(470), 'pagamentos at 75%\nR = 200 ms'); } },
      { id: 'sessenta', dur: 7.5, title: '60 orders/s: pagamentos chokes at 40', yk: 'THE MATH WITH DOUBLE THE DEMAND', code: ['input 60/s', 'pedidos     60 ÷ 90 = 67%', 'pagamentos  only 40/s → 100%, backs up 20/s', 'estoque     40 ÷ 1,000 = 4%', '20/s × 60 s = 1,200 waiting'],
        story: 'Now Black Friday doubles: 60 orders per second. pedidos keeps up, at 67%. pagamentos only processes 40 per second, and the other 20 back up in front of it: in 60 s that is 1,200 orders waiting. estoque, which handles 1,000, receives 40 and sits at 4%.',
        look: 'The pipe that reaches pagamentos turns red and the pile in front of it grows. The pagamentos cubes turn red, at 100%; the estoque ones barely light up.',
        key: 'Bottleneck: demand went past the capacity of the weakest link, and the chain\'s output becomes that link\'s.',
        f(o, t) { const s = chain(o, t, 60, 3, 2, 2);
          o.cnt = [['OUTPUT', '40/s', 'bad'], ['BACKED UP', '20/s', 'bad'], ['IN QUEUE', thou(20 * s.sec), 'bad']];
          o.res = [['output 40/s: 20/s backed up (33%)', 'bad'], [`${thou(20 * s.sec)} orders waiting after ${Math.round(s.sec)} s`, 'bad']];
          if (t > 1.5) T(o, TF(400), 'backs up 20/s\n1,200 in 60 s', 'bad'); } },
      { id: 'pagamentos', dur: 6, title: 'Pagamentos ×2: 4 replicas, 80/s', yk: 'SCALE THE RIGHT LINK', code: ['pagamentos  4 × 20 = 80/s', '60 ÷ 80 = 75%', 'chain = min(90, 80, 1,000, 150)', '      = 80 orders/s'],
        story: 'The fix goes on the right link. pagamentos goes from 2 to 4 replicas: 4 × 20 = 80 per second. The 60 orders/s get through whole and pagamentos is back at 75%. The chain\'s capacity is now that of the smallest link: min(90, 80, 1,000, 150) = 80.',
        look: 'Two new cubes rise under pagamentos. The pile disappears, and the pipe leaving it gets wider.',
        key: 'The capacity of a chain in series is the capacity of its lowest-capacity link.',
        f(o, t) { chain(o, t, 60, 3, 4, 2, ['pag']);
          o.cnt = [['OUTPUT', '60/s'], ['CAPACITY', '80/s', 'dim'], ['BACKED UP', '0/s', 'dim']];
          o.res = [['output 60/s: nothing backed up', 'acc']];
          if (t > 1.5) T(o, TF(470), '4 × 20 = 80/s'); } },
      { id: 'anda', dur: 7.5, title: '100 orders/s: the bottleneck moves', yk: 'THE MATH AT 100 ORDERS/S', code: ['input 100/s', 'pedidos     90 → 100%, backs up 10/s', 'pagamentos  80 → 100%, backs up 10/s', 'estoque     80 ÷ 1,000 = 8%', 'DB          90 ÷ 150 = 60%'],
        story: 'Demand rises to 100 orders per second. Now the first to blow is pedidos, which handles 90: 10/s back up in front of it. The 90 that get through reach a pagamentos of 80, which backs up another 10. Output ends at 80. Fixing one bottleneck revealed the next.',
        look: 'Now there are two red piles, one in front of pedidos and one in front of pagamentos. The cubes of both turn red.',
        key: 'Fixing one bottleneck moves the bottleneck to the next link.',
        f(o, t) { const s = chain(o, t, 100, 3, 4, 2);
          o.cnt = [['OUTPUT', '80/s', 'bad'], ['BACKED UP', '20/s (10 + 10)', 'bad'], ['IN QUEUE', thou(20 * s.sec), 'bad']];
          o.res = [['two links at the limit: output 80/s', 'bad']];
          if (t > 1.5) T(o, TF(300), 'the bottleneck moved\npedidos 90 · pagamentos 80', 'bad'); } },
      { id: 'banco', dur: 7.5, title: '200 orders/s: the bottleneck reaches the DB', yk: 'THE MATH WITH BOTH SCALED', code: ['pedidos     6 × 30 = 180/s', 'pagamentos  8 × 20 = 160/s', 'pedidos DB  150/s → 100%', 'min(180, 160, 1,000, 150) = 150', '200 − 150 = 50/s left over'],
        story: 'Scale both: pedidos with 6 replicas (180/s) and pagamentos with 8 (160/s). At 200 orders per second, what holds the queue now is the pedidos DB, a PostgreSQL primary that writes 150 per second. More pedidos replicas do not help, because they all write to the same DB.',
        look: 'The pedidos and pagamentos cubes multiply, but the DB pipe at the back turns red and full, and the pile returns in front of pedidos.',
        key: 'When the bottleneck is a shared resource, service replicas do not add capacity.',
        f(o, t) { const s = chain(o, t, 200, 6, 8, 2, ['ped', 'pag']);
          o.cnt = [['OUTPUT', '150/s', 'bad'], ['BOTTLENECK', 'DB 150/s', 'bad'], ['IN QUEUE', thou(50 * s.sec), 'bad']];
          o.res = [['replicas cannot get past the DB', 'bad']];
          if (t > 1.5) T(o, TF(560), 'DB: cap 150/s\nreplicas do not help', 'bad'); } },
      { id: 'errado', dur: 7.5, title: 'If it goes wrong: scaling the wrong link', yk: 'ESTOQUE SCALED FOR NOTHING', code: ['input 60/s · pagamentos 2 × 20 = 40/s', 'estoque 2 → 4 replicas = 2,000/s', 'output = min(90, 40, 2,000, 150) = 40', 'estoque CPU: 2 → 4 vCPU', '40 ÷ 2,000 = 2%'],
        story: 'Back to 60 orders/s with pagamentos at 2 replicas. Someone looks at the dashboard and doubles the estoque replicas: from 2 to 4, capacity 2,000/s. Output stays at 40 per second and the 20/s keep backing up. The CPU bill for estoque doubled, and it went from 4% to 2%.',
        look: 'Two new cubes rise under estoque, almost dark. The red pile in front of pagamentos keeps growing.',
        key: 'Scaling what is not the bottleneck only raises the cost.',
        f(o, t) { const s = chain(o, t, 60, 3, 2, 4, ['est']);
          o.cnt = [['OUTPUT', '40/s', 'bad'], ['ESTOQUE CPU', '4 vCPU (was 2)', 'bad'], ['IN QUEUE', thou(20 * s.sec), 'bad']];
          o.res = [['double the CPU, same output', 'bad']];
          if (t > 1.5) T(o, TF(690), 'estoque ×2: 2%\noutput still 40/s', 'bad'); } },
    ],
    vertical: [
      { id: 'uma', dur: 5.5, title: '1 replica of 1 vCPU: 100 req/s', yk: 'THE CAPACITY OF ONE REPLICA', code: ['page = 10 ms CPU + 10 ms waiting', '1 s ÷ 10 ms of CPU = 100 req/s', 'peak at 20:03: 640 req/s'],
        story: 'Each product page costs 10 ms of CPU plus 10 ms waiting for the cache and the DB. A replica of 1 vCPU serves 1 s ÷ 10 ms = 100 pages per second. That is little for the 20:03 peak of 640 req/s.',
        look: 'A single cube, catalogo with 1 vCPU, behind lb-loja. The counter shows 100 req/s of capacity against a peak of 640.',
        key: 'The capacity of one replica = 1 s ÷ the CPU time of one request.',
        f(o, t) { o.cubes.push({ id: 'cat-v', name: '1 vCPU', sub: '100/s', p: [590, 245], s: 1, cpu: null, tone: 'acc' });
          o.beams.push({ pts: RC.c2l }, { pts: RC.l2one }); o.rows.lb = act('lb-loja', '1 replica', ['capacity 100/s', 'dim']);
          o.cnt = [['CAPACITY', '100 req/s'], ['vCPU', '1', 'dim'], ['PEAK', '640 req/s', 'dim']];
          o.res = [['100 req/s per replica of 1 vCPU', 'acc']]; } },
      { id: 'oito', dur: 6, title: 'Scale up: the same replica with 8 vCPU', yk: 'THE NAIVE MATH', code: ['1 vCPU → 8 vCPU (same replica)', '8 × 100 = 800 req/s ?', 'changing the size: usually restarts the pod', 'ceiling: the provider\'s biggest machine'],
        story: 'Scaling vertically means swapping the machine for a bigger one: the same replica goes from 1 to 8 vCPU. The naive math says 8 × 100 = 800 req/s. To swap, the pod usually restarts (Kubernetes now allows in-place resizing), and there is a ceiling: the provider\'s biggest machine.',
        look: 'The small cube sinks and a big box rises, with 8 cores lit on top.',
        key: 'Vertical scaling (scale up) changes the size of one unit.',
        f(o, t) { if (t < 0.8) o.cubes.push({ id: 'cat-v', name: '1 vCPU', sub: '100/s', p: [590, 245], s: 1, cpu: null, tone: 'acc' });
          else { o.show.big = 1; o.on.big = 1; o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: Math.min(8, Math.floor((t - 0.8) * 5) + 1), rows: [['expected: 800 req/s ?', 'acc'], ['just 1 replica', 'dim']] }; }
          o.beams.push({ pts: RC.c2l }, { pts: t < 0.8 ? RC.l2one : RC.l2v }); o.rows.lb = act('lb-loja', '1 replica', [t < 0.8 ? 'capacity 100/s' : 'capacity 800/s ?', 'dim']);
          o.cnt = [['vCPU', t < 0.8 ? '1' : '8'], ['EXPECTED', '800 req/s', 'dim'], ['REPLICAS', '1', 'dim']];
          o.res = t > 2 ? [['8 vCPU: 800 req/s?', 'acc']] : []; } },
      { id: 'amdahl', dur: 7, title: 'Amdahl: 6.0×, not 8×', yk: 'AMDAHL\'S LAW · 1/21 SERIAL', code: ['serial part: 1/21 (4.76%)', 'gain = 1 ÷ (1/21 + (20/21) ÷ 8)', '     = 1 ÷ 0.1667 = 6.0×', '100 × 6.0 = 600 req/s (not 800)', '600 ÷ 8 = 75 req/s per vCPU'],
        story: 'Not everything parallelizes. If 1/21 of the work is serial, as in relatorios from module 11, Amdahl\'s law gives 1 ÷ (1/21 + (20/21) ÷ 8) = 6.0×. The 8 vCPU box serves 600 req/s, 75 per vCPU, against 100 per vCPU on the small replicas. And 600 does not hold the 640 peak.',
        look: 'On the display, the dashed line is the ideal gain (8×) and the lit curve is Amdahl\'s, which stops at 6.0× with 8 cores.',
        key: 'The serial part limits the gain from adding cores.',
        f(o, t) { o.show.big = 1; o.on.big = 1; o.chart = sg(t, 0.4, 3.4); o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: 8, rows: [['600 req/s (6.0×)', 'acc'], ['75 per vCPU', 'dim']] };
          o.beams.push({ pts: RC.c2l }, { pts: RC.l2v }); o.rows.lb = act('lb-loja', '1 replica', ['capacity 600/s', 'dim'], ['peak 640/s', 'bad']);
          o.cnt = [['CAPACITY', '600 req/s'], ['GAIN', '6.0× (not 8×)', 'dim'], ['PER vCPU', '75 req/s', 'dim']];
          o.res = t > 3.4 ? [['600 req/s < peak of 640', 'bad']] : [];
          if (t > 3.4) T(o, TF(590), '8 vCPU → 6.0×\n600 req/s'); } },
      { id: 'cai', dur: 7.5, title: 'If it goes wrong: the single box goes down', yk: 'ONLY ONE REPLICA', code: ['1 replica of 8 vCPU: 600 req/s', 'went down → capacity 0', '640 req/s × 60 s = 38,400 per minute', '10 replicas of 1 vCPU: lose 1, 900 left'],
        story: 'All the capacity sits in one replica. When it goes down, from a failure or to change size, capacity goes from 600 to zero: 100% disappears at once. At 640 req/s, every minute out is 38,400 requests with no answer.',
        look: 'The big box turns red and the cores go dark. The pile of requests grows in front of lb-loja.',
        key: 'A single unit is a single point of failure: if it goes down, it takes 100% of the capacity with it.',
        f(o, t) { const down = t > 0.8, sec = clamp((t - 1) / 4.5) * 60;
          o.show.big = 1; o.on.big = down ? 'bad' : 1;
          o.rows.big = { name: 'catalogo', meta: '8 vCPU', cores: down ? 0 : 8, rows: down ? [['down', 'bad'], ['capacity 0', 'bad']] : [['600 req/s', 'acc']] };
          o.beams.push({ pts: RC.c2l, on: true, tone: down ? 'bad' : '' }, { pts: RC.l2v, on: !down, tone: down ? 'bad' : '' });
          o.rows.lb = act('lb-loja', '1 replica', ['640 req/s', 'acc'], [down ? 'no replica' : 'capacity 600/s', down ? 'bad' : 'dim']); o.on.lb = down ? 'bad' : 1;
          if (down && t > 1) o.piles.push({ p: PILE_CAT, v: 640 * sec, f: sec / 60 });
          o.cnt = [['CAPACITY', down ? '0 req/s' : '600 req/s', down ? 'bad' : ''], ['NO ANSWER', thou(down ? 640 * sec : 0), 'bad'], ['DOWN FOR', `${Math.round(sec)} s`, 'dim']];
          o.res = down ? [['100% of the capacity is gone', 'bad']] : [];
          if (t > 1.5) T(o, TF(590), 'the only replica went down\n640 req/s unanswered', 'bad'); } },
    ],
    horizontal: [
      { id: 'dez', dur: 6, title: '10 replicas of 1 vCPU: 1,000 req/s', yk: 'THE CATALOG FLEET', code: ['10 replicas × 100 = 1,000 req/s', 'peak 640 ÷ 10 = 64 req/s each', 'CPU 64% → R = 10 + 10 ÷ 0.36 = 37.8 ms', 'session in Redis · lb-loja splits'],
        story: 'Scaling horizontally means adding units: 10 replicas of 1 vCPU, catalogo-1 to catalogo-10, serve 10 × 100 = 1,000 req/s. lb-loja splits the 640 peak: 64 to each one, 64% CPU, 37.8 ms per page. This only works with the session outside the process (in Redis, module 5) and a load balancer in front (module 7).',
        look: 'Ten cubes at 64% behind lb-loja; the light runs from lb-loja to the two rows.',
        key: 'Horizontal scaling (scale out) changes the number of units.',
        f(o, t) { fleet(o, reps(10, 64)); o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], ['÷ 10 = 64 each', 'dim']);
          o.cnt = [['CAPACITY', '1,000 req/s'], ['CPU', '64%', 'dim'], ['TIME', '37.8 ms', 'dim']];
          o.res = [['headroom: 1,000 − 640 = 360 req/s', 'acc']];
          if (t > 1.5) T(o, TF(620), '10 × 1 vCPU\n1,000 req/s'); } },
      { id: 'caem', dur: 8, title: '1, 2, 3 replicas go down: 71%, 80%, 91%', yk: 'THE PEAK SPLIT AMONG THE SURVIVORS', code: [' N   CPU      R', '10   64%     37.8 ms', ' 9   71.1%   44.6 ms', ' 8   80%     60 ms', ' 7   91.4%  126.7 ms'],
        story: 'Replicas go down: a machine fails, a deploy, a zone is out. The peak stays at 640 req/s and gets split among the ones left. With 9, each goes to 71.1% (44.6 ms). With 8, to 80% (60 ms). With 7, to 91.4% (126.7 ms): it still answers, but the time more than tripled.',
        look: 'One cube at a time turns red and sinks; the ones left glow brighter and each one\'s number goes up.',
        key: 'Headroom is what is left after k replicas go down: N+k.',
        f(o, t) { const out = [6, 1, 8].filter((_, k) => t > 1 + k * 2), n = 10 - out.length, cpu = 640 / n;
          fleet(o, reps(10, cpu).map((c, i) => out.includes(i) ? { ...c, down: true } : c));
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [`÷ ${n} = ${dec(cpu)} each`, 'dim']);
          o.cnt = [['REPLICAS', `${n} of 10`, out.length ? 'bad' : ''], ['CPU', pct(cpu), cpu > 90 ? 'bad' : 'dim'], ['TIME', `${dec(Rms(cpu / 100))} ms`, 'dim']];
          o.res = out.length ? [[`${out.length} down: ${pct(cpu)} on each`, n < 8 ? 'bad' : 'acc']] : [];
          if (n < 10) T(o, TF(620), `${n} replicas: ${pct(cpu)}\nR = ${dec(Rms(cpu / 100))} ms`, n < 8 ? 'bad' : 'acc'); } },
      { id: 'quatro', dur: 8, title: 'If it goes wrong: the fourth goes down, 107%', yk: 'DEMAND ABOVE CAPACITY', code: ['6 replicas × 100 = 600 req/s', 'peak 640 > 600 → 106.7%', 'queue: +40 req/s = 2,400 per minute', 'anything past 2 s gets a 504'],
        story: 'The fourth goes down. Six replicas serve 600 req/s and the peak is 640: utilization goes past 100% (106.7%). There is no stable response time: the queue grows 40 req/s, 2,400 per minute, and anyone waiting more than 2 s gets a 504 from lb-loja.',
        look: 'Six red cubes above 100%; the pile in front of lb-loja keeps growing.',
        key: 'With demand above capacity, the queue grows without limit.',
        f(o, t) { const down4 = t > 0.8, out = down4 ? [6, 1, 8, 4] : [6, 1, 8], n = 10 - out.length, cpu = 640 / n, sec = clamp((t - 1) / 4.5) * 60;
          fleet(o, reps(10, cpu).map((c, i) => out.includes(i) ? { ...c, down: true } : c), down4 ? 'bad' : '');
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [down4 ? 'capacity 600/s' : `÷ ${n} = ${dec(cpu)} each`, down4 ? 'bad' : 'dim']);
          if (down4 && t > 1) o.piles.push({ p: PILE_CAT, v: 40 * sec, f: sec / 60 });
          o.cnt = [['CPU', pct(cpu), down4 ? 'bad' : ''], ['IN QUEUE', thou(down4 ? 40 * sec : 0), 'bad'], ['REPLICAS', `${n} of 10`, 'dim']];
          o.res = down4 ? [['demand > capacity: the queue only grows', 'bad']] : [];
          if (down4) T(o, TF(620), '6 replicas: 106.7%\n+2,400 per minute', 'bad'); } },
    ],
    hpa: [
      { id: 'pico', dur: 5.5, title: 'Peak of 950 req/s: 10 replicas at 95%', yk: 'NEXT YEAR\'S BLACK FRIDAY', code: ['950 req/s ÷ 10 replicas = 95 each', 'CPU 95% → R = 10 + 10 ÷ 0.05 = 210 ms', 'HPA: target 70% CPU, reads every 15 s'],
        story: 'Next year\'s Black Friday reaches 950 req/s. With 10 replicas, each one sits at 95% CPU and the page takes 210 ms. The HPA, the Kubernetes horizontal pod autoscaler, reads the average CPU every 15 s. The configured target is 70%.',
        look: 'The ten cubes at 95%, red. The HPA, in front, shows the measured average and the target.',
        key: 'The HPA compares the measured metric with a target.',
        f(o, t) { fleet(o, reps(10, 95)); o.rows.cli = act('CLIENTS', 'peak', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc'], ['÷ 10 = 95 each', 'dim']);
          o.rows.hpa = act('HPA', 'CPU target 70%', ['avg CPU: 95%', 'bad'], ['target: 70%', 'dim'], ['reads every 15 s', 'dim']); o.on.hpa = 1;
          o.cnt = [['AVG CPU', '95%', 'bad'], ['TARGET', '70%', 'dim'], ['TIME', '210 ms', 'dim']];
          o.res = [['95% > 70%: the HPA will act', 'acc']]; } },
      { id: 'conta', dur: 6, title: 'The formula: ⌈10 × 95 ÷ 70⌉ = 14', yk: 'THE HPA ALGORITHM', code: ['desired = ⌈current × metric ÷ target⌉', '= ⌈10 × 95 ÷ 70⌉ = ⌈13.57⌉ = 14', 'ratio 95 ÷ 70 = 1.36 (outside ±10%)', 'by throughput: ⌈950 ÷ 70⌉ = 14'],
        story: 'The HPA math is desired = ⌈current × metric ÷ target⌉. 10 × 95 ÷ 70 = 13.57, and the ⌈ ⌉ rounds up: 14. The ratio 95 ÷ 70 = 1.36 is outside the 10% tolerance (0.9 to 1.1), so it acts. By throughput it comes out the same: a target of 70 req/s per replica, ⌈950 ÷ 70⌉ = 14.',
        look: 'The HPA builds the math line by line, and the 14 lights up.',
        key: 'desired = ⌈current × metric ÷ target⌉, always rounding up.',
        f(o, t) { fleet(o, reps(10, 95)); o.rows.cli = act('CLIENTS', 'peak', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU target 70%', ['10 × 95 ÷ 70 = 13.57', t > 0.6 ? 'acc' : 'dim'], t > 1.6 ? ['⌈13.57⌉ = 14 replicas', 'acc'] : null, t > 2.6 ? ['ratio 1.36 > 1.1: acts', 'dim'] : null);
          o.cnt = [['DESIRED', t > 1.6 ? '14' : '…'], ['RATIO', '1.36', 'dim'], ['TOLERANCE', '0.9 to 1.1', 'dim']];
          o.res = t > 1.6 ? [['desired: 14 replicas', 'acc']] : [];
          if (t > 1.6) T(o, TF(620), '⌈13.57⌉ = 14'); } },
      { id: 'sobe', dur: 7.5, title: '10 → 14 in one step: 67.9%', yk: 'THE SCALE-UP', code: ['scale up: max(+4 pods, +100%) every 15 s', '10 → 14 fits in one step', 'new pod ready in ~30 s (counts 0%)', '950 ÷ 1,400 = 67.9% → R = 41.1 ms'],
        story: 'The default scale-up policy lets it add 4 pods or 100% every 15 s, whichever is larger: from 10 to 14 fits in a single step. The 4 new pods take about 30 s to become ready and, until then, count as 0%. Once ready, the 14 replicas share 950 req/s: 67.9% CPU and 41.1 ms per page.',
        look: 'Four new cubes rise, dark at first ("starting"). When they are ready, all 14 light up at 67.9%.',
        key: 'The HPA adds replicas in 15 s steps until the average is back at the target.',
        f(o, t) { const ready = t > 4, sec = Math.round(clamp((t - 1) / 3) * 30);
          const list = reps(t > 1 ? 14 : 10, ready ? 950 / 14 : 95).map((c, i) => i >= 10 && !ready ? { ...c, cpu: 0, sub: 'starting' } : c);
          fleet(o, list); o.rows.cli = act('CLIENTS', 'peak', ['950 req/s', 'acc']); o.rows.lb = act('lb-loja', 'round robin', ['950 req/s', 'acc'], [ready ? '÷ 14 = 67.9 each' : '÷ 10 = 95 each', 'dim']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU target 70%', ['desired: 14', 'acc'], ['+4 pods in one step', 'dim'], [ready ? 'avg CPU: 67.9%' : `new pods: ${sec} of ~30 s`, ready ? 'acc' : 'dim']);
          o.cnt = [['REPLICAS', t > 1 ? '14' : '10'], ['CPU', ready ? '67.9%' : '95%', ready ? 'dim' : 'bad'], ['TIME', ready ? '41.1 ms' : '210 ms', 'dim']];
          o.res = ready ? [['14 replicas at 67.9%: below the target', 'acc']] : t > 1 ? [['4 pods starting (count 0%)', 'acc']] : [];
          if (ready) T(o, TF(620), '950 ÷ 1,400 = 67.9%\nR = 41.1 ms'); } },
      { id: 'tarde', dur: 9, title: 'If it goes wrong: the peak arrives before the HPA', yk: 'WHO REACTS LATER', code: ['640 → 1,100 req/s in 10 s (cap 1,000)', '⌈10 × 110 ÷ 70⌉ = ⌈15.7⌉ = 16', 'metric + 15 s + ~30 s of pod ≈ 60 s', '100 req/s × 60 s = 6,000 of 66,000', '= 9.1% rejected or delayed'],
        story: 'Traffic rises from 640 to 1,100 req/s in 10 s, and capacity is 1,000. The HPA computes ⌈10 × 110 ÷ 70⌉ = 16, but between the metric arriving, the 15 s decision and the ~30 s for the pod to become ready, about 60 s go by. In that minute 100 req/s are left over: 6,000 requests rejected or delayed, 9.1% of 66,000. The 20:00 newsletter was known: the minimum number of replicas could have been raised beforehand.',
        look: 'The ten cubes go past 100% and turn red; the clock runs up to 60 s and the pile grows to 6,000. Only then do the 6 new cubes light up.',
        key: 'The HPA reacts after the peak: for a known peak, use headroom or a minimum replica count beforehand.',
        f(o, t) { const dem = 640 + 460 * sg(t, 0.4, 1.4), sec = clamp((t - 1.4) / 5) * 60, ready = sec >= 60, n = t > 2.6 ? 16 : 10;
          const list = reps(n, ready ? 1100 / 16 : dem / 10).map((c, i) => i >= 10 && !ready ? { ...c, cpu: 0, sub: 'starting' } : c);
          fleet(o, list, !ready && dem > 1000 ? 'bad' : ''); o.rows.cli = act('CLIENTS', 'peak', [`${thou(dem)} req/s`, dem > 1000 ? 'bad' : 'acc']);
          o.rows.lb = act('lb-loja', 'round robin', [`${thou(dem)} req/s`, 'acc'], [ready ? 'capacity 1,600/s' : 'capacity 1,000/s', !ready && dem > 1000 ? 'bad' : 'dim']); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU target 70%', ['⌈10 × 110 ÷ 70⌉ = 16', 'acc'], [`t = ${Math.round(sec)} s`, ready ? 'dim' : 'bad'], [ready ? '16 ready: 68.8%' : 'pods ready in ~60 s', 'dim']);
          if (dem > 1000 && t > 1.4) o.piles.push({ p: PILE_CAT, v: 100 * sec, f: sec / 60 });
          o.cnt = [['CLOCK', `${Math.round(sec)} s`], ['REJECTED', thou(100 * sec), 'bad'], ['REPLICAS', ready ? '16' : n > 10 ? '10 + 6 starting' : '10', 'dim']];
          o.res = ready ? [['6,000 of 66,000 (9.1%) lost', 'bad']] : t > 1.4 ? [['100 req/s above capacity', 'bad']] : [];
          if (t > 1.6) T(o, TF(620), ready ? '6,000 rejected\nbefore the 16 were ready' : `1,100 > 1,000\n+100 req/s with no room`, 'bad'); } },
    ],
    'hpa-media': [
      { id: 'media', dur: 6, title: 'The 67.5% average hides catalogo-3 at 99%', yk: 'WHAT THE HPA RECEIVES', code: ['9 replicas at 64% + catalogo-3 at 99%', 'average = (9 × 64 + 99) ÷ 10 = 67.5%', 'the HPA only receives the average'],
        story: 'Back to the 20:03 peak: 640 req/s. The heavy searches mostly landed on catalogo-3, which is at 99%; the other nine are at 64%. The HPA does not look at each replica: it looks at the average, (9 × 64 + 99) ÷ 10 = 67.5%.',
        look: 'Nine cubes at 64% and catalogo-3 red at 99%. The HPA shows a single number: 67.5%.',
        key: 'The HPA metric is the average across pods, and the average does not show the hot replica.',
        f(o, t) { fleet(o, reps(10, 64, { 2: { cpu: 99 } })); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU by average', ['(9 × 64 + 99) ÷ 10', 'dim'], ['= 67.5%', 'acc'], ['does not see catalogo-3', 'dim']);
          o.cnt = [['AVERAGE', '67.5%'], ['catalogo-3', '99%', 'bad'], ['THE OTHER 9', '64%', 'dim']];
          o.res = [['the average stays below 70%', 'acc']];
          if (t > 1.5) T(o, TF(500), 'catalogo-3: 99%\naverage: 67.5%', 'bad'); } },
      { id: 'alvo70', dur: 6, title: 'Target 70%: the HPA does nothing', yk: 'WITHIN THE TOLERANCE', code: ['ratio = 67.5 ÷ 70 = 0.964', 'tolerance: 0.9 to 1.1 → does not act', 'catalogo-3 stays at 99%', 'and the fleet p99 stays at 2,000 ms'],
        story: 'With a target of 70%, the ratio is 67.5 ÷ 70 = 0.964. It sits within the 10% tolerance (between 0.9 and 1.1), and the HPA changes nothing. catalogo-3 stays at 99%, and it is the source of the sample\'s 2,000 ms p99.',
        look: 'The HPA computes 0.964, lands inside the band and shows "no change". catalogo-3 stays red.',
        key: 'Within the tolerance the HPA does not act, even with one replica at the limit.',
        f(o, t) { fleet(o, reps(10, 64, { 2: { cpu: 99 } })); o.on.hpa = 1;
          o.rows.hpa = act('HPA', 'CPU target 70%', ['67.5 ÷ 70 = 0.964', 'acc'], t > 1.2 ? ['inside 0.9 to 1.1', 'dim'] : null, t > 2.2 ? ['no change: 10', 'bad'] : null);
          o.cnt = [['RATIO', '0.964'], ['DESIRED', t > 2.2 ? '10 (nothing)' : '…', 'bad'], ['catalogo-3', '99%', 'bad']];
          o.res = t > 2.2 ? [['nothing changes: catalogo-3 stays at 99%', 'bad']] : [];
          if (t > 2.2) T(o, TF(500), '0.964: within tolerance\nthe HPA does nothing', 'bad'); } },
      { id: 'alvo80', dur: 9, title: 'If it goes wrong: target 80%, the HPA removes a replica', yk: 'SCALING DOWN AT THE WORST MOMENT', code: ['ratio = 67.5 ÷ 80 = 0.844', '⌈10 × 0.844⌉ = ⌈8.44⌉ = 9', 'scale-down waits 300 s (stabilization)', '9 replicas: 640 ÷ 9 = 71.1% each'],
        story: 'With a target of 80%, the ratio is 67.5 ÷ 80 = 0.844, outside the tolerance on the low side: ⌈10 × 0.844⌉ = 9. The scale-down stabilization window, 300 s by default, delays the removal, but it comes: the HPA removes a replica at the worst moment. The others go from 64% to 71%, and catalogo-3 stays at the limit. The fix is in the load balancer (module 7) and in looking at p95 and p99 per replica.',
        look: 'The window clock counts to 300 s; one cube turns red and sinks; the ones left rise to 71.1%.',
        key: 'Scaling by the average can remove capacity right when one replica is saturated.',
        f(o, t) { const win = Math.round(clamp((t - 1.2) / 4) * 300), gone = win >= 300;
          fleet(o, reps(10, gone ? 640 / 9 : 64, { 2: { cpu: 99, sub: gone ? '99%+' : undefined }, 9: gone ? { down: true } : {} })); o.on.hpa = gone ? 'bad' : 1;
          o.rows.hpa = act('HPA', 'CPU target 80%', ['67.5 ÷ 80 = 0.844', 'acc'], ['⌈10 × 0.844⌉ = 9', 'bad'], [`window: ${win} of 300 s`, 'dim']);
          o.rows.lb = act('lb-loja', 'round robin', ['640 req/s', 'acc'], [gone ? '÷ 9 = 71.1 each' : '÷ 10 = 64 each', 'dim']);
          o.cnt = [['DESIRED', '9', 'bad'], ['WINDOW', `${win} of 300 s`, 'dim'], ['THE OTHERS', gone ? '71.1%' : '64%', 'dim']];
          o.res = gone ? [['removed a replica with catalogo-3 at 99%', 'bad']] : [];
          if (gone) T(o, TF(560), 'target 80%: 10 → 9\nat the worst moment', 'bad'); } },
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
    const small = c.s < 0.8, main = c.down ? 'down' : c.sub || (c.cpu != null ? (small ? Math.round(c.cpu) + '%' : pct(c.cpu)) : '');
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
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
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
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const DATA = {
    cadeia: () => `<table class="h3-sum"><tr><th>service</th><th>replicas</th><th>CPU/order</th><th>capacity</th></tr><tr><td>pedidos</td><td>3 × 1 vCPU</td><td>33 ms</td><td>90/s</td></tr><tr class="on"><td>pagamentos</td><td>2 × 1 vCPU</td><td>50 ms</td><td>40/s</td></tr><tr><td>estoque</td><td>2 × 1 vCPU</td><td>2 ms</td><td>1,000/s</td></tr><tr><td>pedidos DB</td><td>1 primary</td><td>—</td><td>150/s</td></tr></table><li>30 orders/s (today): pagamentos at <b>75%</b>, R = 50 ÷ 0.25 = <b>200 ms</b></li><li>60 orders/s: output <b>40</b>, backed up <b>20/s</b> (33%), <b>1,200</b> in 60 s</li><li>The article's math: A = 100, B = 60, C = 300; 120 come in, <b>60</b> go out (50%)</li><li>In step 5, 6 and 8 replicas are an example: any number above 150/s stops at the DB</li><li>Cost: fixed fleet <b>240</b> replica-hours × elastic <b>80</b> (33%)</li>`,
    vertical: () => `<table class="h3-sum"><tr><th>vCPU</th><th>gain (Amdahl, 1/21 serial)</th><th>req/s</th></tr><tr><td>1</td><td>1.0×</td><td>100</td></tr><tr><td>2</td><td>1.9×</td><td>191</td></tr><tr><td>4</td><td>3.5×</td><td>350</td></tr><tr class="on"><td>8</td><td>6.0×</td><td>600</td></tr></table><li>Horizontal: 10 × 1 vCPU = <b>1,000 req/s</b> (100 per vCPU); vertical: 8 vCPU = <b>600</b> (75 per vCPU)</li><li>Changing the size usually restarts the pod; Kubernetes has in-place resizing and the VPA</li><li>Ceiling: the provider's biggest machine</li><li>The single replica goes down: <b>100%</b> of the capacity disappears; 640 × 60 = <b>38,400</b> per minute with no answer</li>`,
    horizontal: () => `<table class="h3-sum"><tr><th>replicas</th><th>CPU</th><th>R</th></tr><tr><td>10</td><td>64%</td><td>37.8 ms</td></tr><tr><td>9</td><td>71.1%</td><td>44.6 ms</td></tr><tr><td>8</td><td>80%</td><td>60 ms</td></tr><tr><td>7</td><td>91.4%</td><td>126.7 ms</td></tr><tr class="on"><td>6</td><td>106.7%</td><td>saturates: +2,400/min</td></tr></table><li>R(ρ) = 10 ms + 10 ms ÷ (1 − ρ): toy queue model (M/M/1)</li><li>Peak at 20:03: <b>640 req/s</b>; capacity <b>1,000</b> (10 × 100); safe up to <b>700</b> (70%)</li><li>Requires state outside the process (session in Redis) and a load balancer (lb-loja)</li><li>Elasticity: adjusting capacity up <b>and down</b>, on its own, following demand</li>`,
    hpa: () => `<li><b>desired = ⌈current × metric ÷ target⌉</b>; tolerance <b>0.1</b>; evaluates every <b>15 s</b></li><table class="h3-sum"><tr><th>scenario</th><th>math</th><th>replicas</th></tr><tr class="on"><td>950 req/s, CPU 95%</td><td>⌈10 × 95 ÷ 70⌉</td><td>14</td></tr><tr><td>by throughput</td><td>⌈950 ÷ 70⌉</td><td>14</td></tr><tr><td>peak of 1,100 req/s</td><td>⌈10 × 110 ÷ 70⌉</td><td>16</td></tr></table><li>Default scale-up: +4 pods or +100% every 15 s (the larger); scale-down waits <b>300 s</b></li><li>CPU is a % of the pod's <b>requests</b>, averaged across pods; a pod not yet ready counts <b>0%</b> on scale-up</li><li>Peak of 1,100: ~60 s until it reacts → <b>6,000</b> of 66,000 (9.1%)</li><li>Davi's retry (order 1052) also added a request to the peak</li>`,
    'hpa-media': () => `<table class="h3-sum"><tr><th>target</th><th>ratio</th><th>result</th></tr><tr><td>60%</td><td>67.5 ÷ 60 = 1.125</td><td>⌈11.25⌉ = 12</td></tr><tr><td>70%</td><td>0.964</td><td>nothing (10)</td></tr><tr class="on"><td>80%</td><td>0.844</td><td>⌈8.44⌉ = 9</td></tr></table><li>Fleet: (9 × 64 + 99) ÷ 10 = <b>67.5%</b>; catalogo-3 at <b>99%</b></li><li>Fix: least outstanding requests and weights on the load balancer (module 7); p95 and p99 <b>per replica</b></li><li>Scale-down: stabilization window of <b>300 s</b> by default</li>`,
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
  function readout() { if (active !== 'capacidade') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
