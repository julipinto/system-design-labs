// Figura 3D (iso-glow): o anel de hashing consistente, os slots e as réplicas embaralhadas (módulo 16, aulas 7 a 10).
// Cena: à esquerda, o anel deitado (o espaço de 32 bits do murmur3, 0 no alto, crescendo no sentido horário); cada
// shard pinta os arcos que terminam nos seus pontos virtuais, e os clientes são pinos no anel. No meio do anel, o
// roteador. À direita, os 4 shards (pg-pedidos-0..3) com a parte de cada um e quem mora lá; ao fundo, o mostrador com
// a conta do passo. No cenário Shuffle o anel vira a roda das 10 réplicas do catalogo; no Lab, o anel do programa do autor.
// Cenários (botões e ?mode=anel|reshard|vnodes|slots|shuffle|lab; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/sharding-brief.md). O murmur3 é calculado aqui (vetores conferidos);
// as porcentagens das 100 mil chaves (c-0 … c-99999) e o anel SHA-256 do lab foram rodados à parte e batem com o brief.
FIGS3D.push({ id: 'anel', name: 'Anel', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  const TAU = Math.PI * 2;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#16191b' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  // cor de cada shard: [arco no escuro, texto no escuro, arco no claro, texto no claro]; o 4 é o Shard-04 do lab
  const SH = [['#4f8fe0', '#7fb2f4', '#8db6ec', '#173f78'], ['#45a85a', '#72d085', '#8fd09b', '#185524'], ['#9a72db', '#bd9cf2', '#c3aaee', '#482a84'],
    ['#d9ad2c', '#f2cd5a', '#e6c65e', '#5a4100'], ['#d65a8a', '#f08cb2', '#ec9dbb', '#76173e']];
  const shFill = s => SH[s][theme === 'light' ? 2 : 0], shInk = s => SH[s][theme === 'light' ? 3 : 1];
  const nf = n => Math.round(n).toLocaleString('pt-BR');
  const f1 = v => v.toFixed(1).replace('.', ',');
  const mmss = s => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;

  // ── murmur3 de 32 bits (spaolacci/murmur3 Sum32, seed 0), sobre os bytes UTF-8, sem minúsculas ──
  function mm3(str) {
    const b = new TextEncoder().encode(str), n = b.length, nb = n >> 2, c1 = 0xcc9e2d51, c2 = 0x1b873593; let h = 0, k;
    for (let i = 0; i < nb; i++) { k = b[4 * i] | b[4 * i + 1] << 8 | b[4 * i + 2] << 16 | b[4 * i + 3] << 24;
      k = Math.imul(k, c1); k = k << 15 | k >>> 17; k = Math.imul(k, c2); h ^= k; h = h << 13 | h >>> 19; h = (Math.imul(h, 5) + 0xe6546b64) | 0; }
    k = 0; const t = nb * 4;
    switch (n & 3) { case 3: k ^= b[t + 2] << 16; case 2: k ^= b[t + 1] << 8; case 1: k ^= b[t]; k = Math.imul(k, c1); k = k << 15 | k >>> 17; k = Math.imul(k, c2); h ^= k; }
    h ^= n; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0;
  }
  const hex = h => '0x' + h.toString(16).padStart(8, '0'), deg = a => f1(a * 360) + '°';

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const CL = ['lena-77', 'bia-31', 'caio-58', 'davi-12', 'mkt-01'];
  const HC = Object.fromEntries(CL.map(c => [c, mm3(c)]));
  const RINGS = {};
  const ring = (N, V) => RINGS[N + '/' + V] || (RINGS[N + '/' + V] = (() => { const p = [];
    for (let s = 0; s < N; s++) for (let i = 0; i < V; i++) { const h = mm3(`shard-${s}#${i}`); p.push({ h, a: h / 2 ** 32, s, i }); }
    return p.sort((x, y) => x.h - y.h); })());
  const ownerOf = (pts, h) => { let lo = 0, hi = pts.length; while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].h < h) lo = m + 1; else hi = m; } return pts[lo % pts.length]; };
  // as 100.000 chaves c-0 … c-99999: % por shard, máx. ÷ média e o que muda de 3 para 4 shards (todas para o shard novo)
  const DIST = { 1: { k3: [70.2, 8.8, 21.0], r: '2,11', k4: [47.0, 8.8, 21.0, 23.2], mv: '23,2' }, 3: { k3: [59.0, 17.7, 23.3], r: '1,77', k4: [36.0, 8.5, 23.3, 32.1], mv: '32,1' },
    10: { k3: [37.1, 30.8, 32.1], r: '1,11', k4: [34.6, 20.7, 29.5, 15.2], mv: '15,2' }, 100: { k3: [28.3, 39.2, 32.5], r: '1,18', k4: [21.8, 30.3, 23.7, 24.2], mv: '24,2' },
    200: { k3: [35.5, 32.2, 32.3], r: '1,07', k4: [26.1, 23.6, 24.7, 25.7], mv: '25,7' } };
  const VS = [1, 3, 10, 100, 200];
  const SPACE3 = [35.16, 32.43, 32.42], SPACE4 = [25.84, 23.80, 24.68, 25.69];
  // shuffle sharding: as 2 (ou 4) réplicas de menor murmur3(cliente + ':catalogo-' + r)
  const pick = (c, k) => Array.from({ length: 10 }, (_, i) => i + 1).sort((a, b) => mm3(c + ':catalogo-' + a) - mm3(c + ':catalogo-' + b)).slice(0, k).sort((a, b) => a - b);
  const PAIR = Object.fromEntries(CL.map(c => [c, pick(c, 2)])), QUAD = Object.fromEntries(CL.map(c => [c, pick(c, 4)]));
  const GRP = c => { const g = HC[c] % 5; return [2 * g + 1, 2 * g + 2]; };
  // o anel do lab do autor (consistent-hashing-remove/main.go): SHA-256 dos 8 primeiros bytes, 3 pontos por shard; posições em graus
  const LABPTS = [[24.15, 1], [66.78, 3], [171.22, 3], [181.64, 1], [184.61, 0], [214.23, 2], [253.88, 2], [269.21, 0], [282.93, 3], [296.3, 1], [313.72, 2], [322.04, 0]];
  const LAB04 = [[306.64, 4], [324.29, 4], [358.22, 4]];
  const TEN = [['Petshops-Souza', 154.62], ['Pizzarias-Carvalho', 15.38], ['Mecanica-Dois-Irmaos', 312.97], ['Padaria-Estrela-Filial-1', 171.77], ['Padaria-Estrela-Filial-2', 66.38],
    ['Padaria-Estrela-Filial-3', 247.49], ['Hortifruti-Oba', 354.21], ['Acougue-Zona-Leste', 229.63], ['Acougue-Zona-Oeste', 150.89], ['Acougue-Zona-Norte', 3.28]];
  const labOwner = (pts, d) => { const s = pts.slice().sort((a, b) => a[0] - b[0]); const p = s.find(q => q[0] >= d) || s[0]; return p[1]; };

  const SC = ['anel', 'reshard', 'vnodes', 'slots', 'shuffle', 'lab'];
  const SCNAME = { anel: 'Anel', reshard: 'Reshard', vnodes: 'Pontos virtuais', slots: 'Slots', shuffle: 'Shuffle', lab: 'Lab' };
  const SCFULL = { anel: 'O anel de hashing consistente', reshard: 'Entra o shard-3', vnodes: '1, 3, 10, 100 e 200 pontos', slots: '1.024 slots e o diretório',
    shuffle: 'Shuffle sharding de 2 em 10', lab: 'Os 4 programas do autor' };
  const AULA = { anel: 'aula-7-hashing-consistente', reshard: 'aula-7-hashing-consistente', vnodes: 'aula-7-hashing-consistente', slots: 'aula-8-gestao-de-chaves',
    shuffle: 'aula-9-shuffle-sharding', lab: 'aula-10-exemplo' };
  let clk = 0, sc = 'reshard', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', retry = true;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-anel3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, RC = [205, 252], R1 = 146, R2 = 184, RM = (R1 + R2) / 2, RH = 6, RZ = PL + RH;
  const at = (a, r) => [RC[0] + r * Math.sin(a * TAU), RC[1] - r * Math.cos(a * TAU)];
  plateWith(g0, 612, 472, [[14, 14], [598, 14], [14, 458], [598, 458]]);
  hazeAndShadow(g0, 306, 236, 7.4, 5.8);
  // o anel: uma coroa deitada; o desenho dos arcos fica numa textura por cima
  { const sh = new THREE.Shape(); sh.absarc(RC[0], -RC[1], R2, 0, TAU, false); const ho = new THREE.Path(); ho.absarc(RC[0], -RC[1], R1, 0, TAU, true); sh.holes.push(ho);
    const g = new THREE.ExtrudeGeometry(sh, { depth: RH, bevelEnabled: false, curveSegments: 120 }); g.rotateX(-Math.PI / 2); g.translate(0, PL, 0); g.scale(TS, TS, TS);
    const m = new THREE.Mesh(g, bodyMat); addOutline(m); twMeshes.push(m); g0.add(m); }
  const RW = 2 * (R2 + 8), ringCv = faceCanvas('top', RC[0] - R2 - 8, RC[1] - R2 - 8, RZ, RW, RW, 4, g0, true);
  // mostrador ao fundo, atrás do anel
  rbox(16, 10, PL, 404, 12, 152, 5, bodyMat, g0);
  const scr = faceCanvas('front', 20, 22, PL + 148, 396, 142, 5, g0);
  // blocos com tampa escrita (shards, roteador, réplicas)
  function block(w, d, h, lab, sub, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, P, g);
    const fh = Math.min(14, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    return { g, mat, top, fr, fh, w, d, h, lab, sub, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const SBW = 166, SBD = 98, SBP = [[426, 40], [426, 148], [426, 256], [426, 364]];
  const SB = [0, 1, 2, 3].map(i => block(SBW, SBD, 24, `SHARD-${i}`, `pg-pedidos-${i}`));
  const ROUT = block(124, 72, 22, 'ROTEADOR', 'murmur3 → anel');
  const RPW = 58, RPD = 40, REP = Array.from({ length: 10 }, (_, i) => block(RPW, RPD, 18, String(i + 1), '', 6));
  // no Shuffle, os 5 clientes viram cartões na coluna da direita
  const CBW = 166, CBD = 80, CBP = CL.map((c, k) => [426, 26 + k * 88]), CARD = CL.map(c => block(CBW, CBD, 16, c, ''));
  // pinos: os 5 clientes e os 10 tenants do lab
  function pin(sz, ht) { const g = new THREE.Group(); g0.add(g); const mat = new THREE.MeshBasicMaterial({ color: 0x888888, toneMapped: false });   // sem emissive: no claro o accentFill pintaria tudo da cor de destaque
    rbox(-sz / 2, -sz / 2, 0, sz, sz, ht, sz / 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow); g.visible = false;
    return { g, mat, glow, ht, pos: null, from: null, to: null, t0: 0 }; }
  const PIN = Object.fromEntries(CL.map(c => [c, pin(12, 16)])), TPIN = TEN.map(() => pin(8, 11));
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 48 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 8 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(...a), C_ = W(...c), m = BEAM[n++], th = (b.on ? 5 : 3) * TS, d = C_.clone().sub(A), len = d.length();
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
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
      const sh = /^s[0-4]$/.test(t.tone) ? +t.tone[1] : -1;
      const fs = t.h * P, f1_ = `700 ${fs}px ${MONO3}`, f2 = `600 ${fs * 0.82}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.82 * 1.3;
      x.font = f1_; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh || tex.colorSpace !== texCS()) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS(); mat.map = tex; mat.needsUpdate = true; }
      const col = sh >= 0 ? shInk(sh) : t.tone === 'acc' ? accC() : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.96)' : 'rgba(18,19,20,.92)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = sh >= 0 ? shFill(sh) : t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * (sh >= 0 ? 0.8 : 0.45)); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1_; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const CTAG = Object.fromEntries(CL.map(c => [c, tag(11)])), TAGS = Array.from({ length: 8 }, () => tag(10)), MSGS = [tag(10), tag(10)];

  // ── lugares e rotas ──
  const Z = 42;
  const SBC = i => [SBP[i][0] + SBW / 2, SBP[i][1] + SBD / 2];
  const r2s = i => { const [cx, cy] = SBC(i); return [[RC[0] + 62, RC[1], Z], [408, RC[1], Z], [408, cy, Z], [SBP[i][0] + 10, cy, Z]]; };
  // de um shard para outro, por fora, rente à borda direita da prancha
  const s2s = (a, b) => { const xa = SBP[a][0] + SBW, xo = xa + 6 + 4 * a, ya = SBC(a)[1], yb = SBC(b)[1] + (a - 1) * 8; return [[xa - 8, ya, Z], [xo, ya, Z], [xo, yb, Z], [xa - 8, yb, Z]]; };
  const rev = pts => pts.slice().reverse();
  const repAt = r => at((r - 1) / 10, RM);
  const c2r = (c, r) => { const k = CL.indexOf(c), q = repAt(r), y = CBP[k][1] + CBD / 2 + (r - 5) * 1.2; return [[CBP[k][0] + 4, y, 26], [q[0], q[1], 26]]; };
  // rótulo de cada cliente: fora do anel, um pouco acima; lena e caio são vizinhos (4,8°): o caio vai mais para fora
  const TOFF = { 'lena-77': [26, 8], 'caio-58': [64, 0], 'bia-31': [26, 16], 'davi-12': [-74, 6], 'mkt-01': [30, 34] };   // o davi (9,7°) fica perto do mostrador: rótulo dentro do anel
  const TOFFS = { 'lena-77': [84, 0], 'caio-58': [74, 4], 'bia-31': [24, 14], 'davi-12': [26, 14], 'mkt-01': [28, 16] };   // nos slots (lena 166°, davi 152°)
  const laneR = own => own >= 0 && own < 3 ? R1 + (R2 - R1) * (own + 0.5) / 3 : RM;

  // ── o que se vê em cada passo (spec) ──
  function base() {
    return { ring: { kind: 'plain' }, keys: {}, ten: null, blocks: [null, null, null, null], router: null, reps: null, center: false,
      beams: [], tags: [], msgs: [], disp: { head: '', lines: [], big: [] }, count: '' };
  }
  const T = (o, p, text, tone = 'acc') => o.tags.push([...p, text, tone]);
  const ptTag = (o, a, text, tone, r = R2 + 22, z = 14) => { const p = at(a, r); T(o, [p[0], p[1], z], text, tone); };
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: false });
    return f >= 1;
  }
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  // chaves num anel N × V: dono de cada cliente, e os blocos com a parte de cada shard
  function onRing(o, N, V, opt = {}) {
    const pts = ring(N, V).filter(p => p.s !== opt.rm);
    o.ring = { kind: 'vn', N, V, rm: opt.rm, rmf: opt.rmf, focus: opt.focus, mark: [], walks: [] };
    (opt.only || CL).forEach(c => { const p = ownerOf(pts, HC[c]); o.keys[c] = { a: HC[c] / 2 ** 32, own: p.s, pt: p, tone: '' }; });
    return pts;
  }
  function shardBlocks(o, N, pcts, sub, opt = {}) {
    for (let i = 0; i < 4; i++) {
      if (i >= N && !opt.ghost) { o.blocks[i] = null; continue; }
      if (i >= N) { o.blocks[i] = { name: `shard-${i}`, big: '', sub: 'ainda não existe', lines: [], col: i, tone: 'dim' }; continue; }
      const live = CL.filter(c => o.keys[c] && o.keys[c].own === i);
      o.blocks[i] = { name: `shard-${i}`, big: pcts ? f1(pcts[i]) + '%' : '', bar: pcts ? pcts[i] / 100 : null, sub, col: i, tone: '',
        lines: live.length ? live.map(c => [c, o.keys[c].tone || '']) : [['nenhum dos 5', 'dim']] };
    }
  }
  const showLines = (o, head, lines, big = []) => { o.disp = { head, lines: lines.map(l => Array.isArray(l) ? l : [l, '']), big }; };
  const tagKeys = (o, fmt) => CL.forEach(c => { const k = o.keys[c]; if (k) k.tag = fmt(c, k); });
  const CNT = (big, small = '', rest = '') => `<b>${big}</b><span>${small}</span>${rest ? `<i>· ${rest}</i>` : ''}`;
  const pair = a => `{${a.join(', ')}}`;

  const STEPS = {
    anel: [
      { id: 'circulo', dur: 4.5, title: 'O hash vira um círculo',
        story: 'O murmur3 de 32 bits dá um número de 0 a 4.294.967.295. Curve esse intervalo num círculo, com o fim colado no começo: o 0 fica no alto e os números crescem no sentido horário. A chave lena-77 dá 0x8fd9d9d8, que é 2.413.418.968, e cai a 56,2% da volta, em 202,3°.',
        look: 'O anel está apagado: ainda não há shard nenhum. O pino da lena-77 desce no ponto 202,3°, um pouco depois da metade da volta.',
        key: 'No anel, a chave vira uma posição num círculo, não um resto de divisão.',
        f(o, t) { o.ring = { kind: 'plain', quarters: true, walks: [], mark: [] };
          o.keys['lena-77'] = { a: HC['lena-77'] / 2 ** 32, own: -1, tone: 'acc', drop: clamp((t - 0.5) / 0.9), tag: 'lena-77\n202,3°' };
          o.router = ['ROTEADOR', ["murmur3('lena-77')", 10.5, 'acc'], ['= 2.413.418.968', 9.5]];
          [[0, '0 · 4.294.967.295'], [0.25, '1.073.741.824'], [0.5, '2.147.483.648'], [0.75, '3.221.225.472']].forEach(([a, s]) => ptTag(o, a, s, 'dim', R2 + 16, 4));
          shardBlocks(o, 3, null, 'sem pontos no anel'); o.blocks.forEach(b => { if (b) { b.lines = [['nenhum ponto ainda', 'dim']]; b.tone = 'dim'; } });
          showLines(o, 'CONTA · POSIÇÃO NO ANEL', ["murmur3('lena-77')", '= 0x8fd9d9d8', '= 2.413.418.968', '÷ 4.294.967.296 = 0,5619', '× 360° = 202,3°'],
            [['POSIÇÃO', '202,3°', 'acc'], ['ANEL', '0 … 2³² − 1', '']]);
          o.count = CNT('202,3°', 'a posição da lena-77', '0x8fd9d9d8'); } },
      { id: 'um', dur: 5, title: 'Um ponto por shard: anda no sentido horário',
        story: 'Cada shard entra no anel pelo hash do próprio nome. Com 1 ponto por shard, o shard-0 fica em 176,3°, o shard-2 em 251,6° e o shard-1 em 283,0°. Para achar o dono da lena-77, o roteador anda no sentido horário a partir de 202,3° até o primeiro ponto: 251,6°, o shard-2. Só que as fatias saem tortas: o shard-0 fica com 70,2% das chaves.',
        look: 'A luz anda pelo anel, da lena-77 até o ponto do shard-2. Cada cor é a fatia de um shard: o arco que termina no ponto dele.',
        key: 'O dono de uma chave é o primeiro ponto no sentido horário.',
        f(o, t) { onRing(o, 3, 1, { only: ['lena-77'] }); const k = o.keys['lena-77'], f = clamp((t - 0.6) / 1.6);
          o.ring.walks.push({ a0: k.a, a1: k.pt.a + (k.pt.a < k.a ? 1 : 0), f: ease(f) }); o.ring.mark = ring(3, 1);
          k.tone = 'acc'; k.tag = f >= 1 ? 'lena-77\n→ shard-2' : 'lena-77\n202,3°'; if (f < 1) k.own = -1;
          ring(3, 1).forEach(p => ptTag(o, p.a, `shard-${p.s}\n${deg(p.a)}`, 's' + p.s, R2 + 18, p.s === 2 ? 30 : 6));
          shardBlocks(o, 3, DIST[1].k3, 'das 100 mil chaves');
          o.router = ['ROTEADOR', ['202,3° → horário', 10, 'acc'], ['1º ponto: 251,6°', 9.5]];
          showLines(o, 'CONTA · 1 PONTO POR SHARD', ["murmur3('shard-0#0') → 176,3°", "murmur3('shard-2#0') → 251,6°", "murmur3('shard-1#0') → 283,0°", 'lena-77 em 202,3°: anda até 251,6°', ['→ shard-2', 'acc']],
            [['SHARD', 'shard-2', 's2'], ['MÁX ÷ MÉDIA', '2,11', 'bad']]);
          o.count = CNT('70,2%', 'das chaves no shard-0', '8,8 / 21,0 nos outros'); } },
      { id: 'duzentos', dur: 5, title: '200 pontos por shard: a lena-77 cai no shard-0',
        story: 'A saída são os pontos virtuais: cada shard aparece 200 vezes, no hash de shard-0#0, shard-0#1 e assim por diante. São 600 pontos, e as fatias se misturam pela volta toda. A lena-77 continua em 202,3°; o primeiro ponto depois dela agora é o shard-0#119, meio grau adiante. As 100 mil chaves ficam com 35,5% / 32,2% / 32,3%.',
        look: 'O anel virou listras finas das três cores. A luz anda só um pedacinho, da lena-77 até o ponto shard-0#119.',
        key: 'Com 200 pontos por shard, cada um fica perto de um terço do anel.',
        f(o, t) { onRing(o, 3, 200, { only: ['lena-77'] }); const k = o.keys['lena-77'], f = clamp((t - 0.6) / 1.2);
          o.ring.walks.push({ a0: k.a, a1: k.pt.a, f: ease(f) }); o.ring.mark = [k.pt]; k.tone = 'acc'; k.tag = f >= 1 ? 'lena-77\n→ shard-0' : 'lena-77\n202,3°';
          if (t > 1.8) ptTag(o, k.pt.a, 'shard-0#119\n202,8°', 's0', R1 - 34, 8);
          shardBlocks(o, 3, DIST[200].k3, 'das 100 mil chaves');
          o.router = ['ROTEADOR', ['600 pontos ordenados', 9.5], ['1º ≥ 2.413.418.968', 9.5, 'acc']];
          showLines(o, 'CONTA · 3 SHARDS × 200 PONTOS', ['lena-77 = 2.413.418.968 (202,3°)', "1º ponto depois: 'shard-0#119'", '= 2.419.488.419 (202,8°)', ['→ shard-0', 'acc'], 'fatia do anel: 35,16 / 32,43 / 32,42%'],
            [['SHARD', 'shard-0', 's0'], ['MÁX ÷ MÉDIA', '1,07', 'acc']]);
          o.count = CNT('1,07', 'máx. ÷ média', '35,5 / 32,2 / 32,3% das chaves'); } },
      { id: 'todos', dur: 4.5, title: 'Onde cai cada cliente',
        story: 'Os outros quatro fazem a mesma conta. A bia-31 cai em 26,4° e o primeiro ponto é do shard-2; o caio-58, em 197,5°, vai para o shard-0; o davi-12, em 9,7°, e o mkt-01, em 223,2°, vão para o shard-2. Na amostra o shard-1 ficou sem ninguém: são só 5 chaves. Esses números de shard não são os do mod 3 da aula 6; o anel é outra função de espalhar.',
        look: 'Os cinco pinos estão no anel, cada um com a cor do shard que o recebe. À direita, cada shard lista quem mora nele.',
        key: 'Mesmo anel, mesma resposta: qualquer roteador acha o mesmo dono.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => `${c}\n→ shard-${k.own}`); o.ring.mark = CL.map(c => o.keys[c].pt);
          shardBlocks(o, 3, DIST[200].k3, 'das 100 mil chaves');
          o.router = ['ROTEADOR', ['5 clientes', 10], ['3 shards × 200 pontos', 9]];
          showLines(o, 'CONTA · OS 5 CLIENTES NO ANEL', CL.map(c => { const k = o.keys[c]; return `${c.padEnd(7)} ${deg(k.a).padStart(6)} → shard-${k.pt.s}#${k.pt.i}`; }),
            [['SHARD-0', 'lena, caio', 's0'], ['SHARD-2', 'bia, davi, mkt', 's2']]);
          o.count = CNT('2 / 0 / 3', 'clientes da amostra por shard', 'mod 3 dava 1 / 2 / 2'); } },
      { id: 'erro', dur: 7, title: 'E se der errado: dois roteadores, dois anéis',
        story: 'O anel não guarda estado, mas todo roteador precisa montar o mesmo anel. Num deploy, a versão nova sobe com 3 pontos por shard, como no lab do autor; a antiga segue com 200. Na Black Friday a Lena faz o pedido 1054: a versão nova calcula shard-1 e grava lá. Depois, a página "meus pedidos" passa pela versão antiga, que procura no shard-0 e não acha o 1054.',
        look: 'O INSERT do 1054 sai do roteador para o shard-1; o SELECT da Lena vai ao shard-0 e volta vermelho, sem o pedido.',
        key: 'Anel sem estado só funciona se todos os roteadores usarem os mesmos pontos.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => c); const L = o.keys['lena-77']; L.tone = 'acc'; L.tag = 'lena-77\nv1: shard-0 · v2: shard-1';
          shardBlocks(o, 3, DIST[200].k3, 'das 100 mil chaves'); o.ring.mark = [L.pt];
          o.router = ['ROTEADOR v1 e v2', ['v1: 200 pontos → shard-0', 9], ['v2: 3 pontos → shard-1', 9, 'bad']];
          if (send(o, t, 0.4, 1.6, r2s(1), 'INSERT 1054 (v2)', 'acc', 0.4)) { o.blocks[1].lines = [['1054 · lena-77', 'bad'], ['64,00 · Recife', 'dim']]; o.blocks[1].tone = 'bad'; }
          send(o, t, 2.6, 3.6, r2s(0), 'SELECT lena-77 (v1)', 'hi', 0.1);
          if (send(o, t, 3.8, 4.8, rev(r2s(0)), '0 linhas: sem o 1054', 'bad', 1.2)) { o.blocks[0].tone = 'bad'; o.blocks[0].lines = [['lena-77: 5 pedidos', 'bad'], ['o 1054 não está aqui', 'bad']]; }
          showLines(o, 'CONTA · O MESMO CLIENTE EM DOIS ANÉIS', ['v1: 3 × 200 pontos → shard-0#119', ['v2: 3 × 3 pontos  → shard-1', 'bad'], 'INSERT 1054 pela v2 → shard-1', 'SELECT lena-77 pela v1 → shard-0', ['→ 0 linhas com o 1054', 'bad']],
            [['V1', 'shard-0', 's0'], ['V2', 'shard-1', 's1'], ['MEUS PEDIDOS', 'sem o 1054', 'bad']]);
          o.count = CNT('2 anéis', 'para a mesma lena-77', 'v1 → shard-0 · v2 → shard-1'); } },
    ],
    reshard: [
      { id: 'antes', dur: 4, title: 'Antes: 3 shards, 200 pontos cada',
        story: 'A loja tem 3 shards no anel, com 200 pontos cada. A lena-77 e o caio-58 estão no shard-0; a bia-31, o davi-12 e o mkt-01 no shard-2. A tabela pedidos tem 50 milhões de linhas e vai ganhar um quarto servidor, o shard-3. Com o mod da aula 6, essa troca mexeria em 75,2% das linhas.',
        look: 'O anel em três cores e os cinco pinos com a cor do shard de cada um. O lugar do shard-3, à direita, ainda está vazio.',
        key: 'O ponto de partida: 3 shards, 600 pontos, 5 clientes.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); shardBlocks(o, 3, DIST[200].k3, 'das 100 mil chaves', { ghost: true });
          o.router = ['ROTEADOR', ['3 shards × 200 pontos', 9.5], ['600 pontos no anel', 9.5]];
          showLines(o, 'ANTES · 3 SHARDS', ['3 shards × 200 pontos = 600', 'fatia do anel: 35,16 / 32,43 / 32,42%', 'chaves: 35,5 / 32,2 / 32,3%', 'shard-0: lena-77, caio-58', 'shard-2: bia-31, davi-12, mkt-01'],
            [['SHARDS', '3', ''], ['PONTOS', '600', '']]);
          o.count = CNT('3 shards', '600 pontos', '50 milhões de linhas'); } },
      { id: 'entra', dur: 5, title: 'Entra o shard-3 com 200 pontos',
        story: 'O shard-3 entra com seus 200 pontos, o hash de shard-3#0 até shard-3#199. Eles caem espalhados pela volta toda, entre os pontos dos outros. Cada ponto novo rouba o pedacinho do arco que fica logo antes dele, e o resto do anel não muda. As fatias passam a 25,84 / 23,80 / 24,68 / 25,69%.',
        look: 'Listras amarelas aparecem pelo anel inteiro: os arcos que agora terminam num ponto do shard-3. As outras cores continuam onde estavam.',
        key: 'O shard novo pega um pouco de cada vizinho, e só ele recebe.',
        f(o, t) { const show = t > 0.6; onRing(o, show ? 4 : 3, 200, { focus: show ? 3 : null });
          CL.forEach(c => { const p = ownerOf(ring(3, 200), HC[c]); o.keys[c].own = p.s; o.keys[c].pt = p; }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`);
          shardBlocks(o, 3, SPACE3, 'fatia do anel', { ghost: true });
          if (show) { shardBlocks(o, 4, SPACE4, 'fatia do anel'); o.blocks[3].tone = 'on'; o.blocks[3].lines = [['200 pontos novos', 'acc'], ['pg-pedidos-3', 'dim']]; }
          o.router = ['ROTEADOR', ['4 shards × 200 pontos', 9.5], ['800 pontos no anel', 9.5, show ? 'acc' : '']];
          showLines(o, 'O SHARD-3 ENTRA', ["murmur3('shard-3#0' … 'shard-3#199')", '200 pontos novos no anel', 'fatia antes: 35,16 / 32,43 / 32,42%', ['fatia depois: 25,84 / 23,80 / 24,68 / 25,69%', 'acc'], 'nenhum ponto antigo se mexe'],
            [['PONTOS', show ? '800' : '600', show ? 'acc' : ''], ['SHARD-3', show ? '25,69%' : '—', 's3']]);
          o.count = CNT(show ? '25,69%' : '0%', 'do anel para o shard-3', 'os pontos antigos ficam onde estão'); } },
      { id: 'quem', dur: 5.5, title: 'Quem muda: só caio-58 e davi-12, para o shard novo',
        story: 'Agora cada cliente refaz a conta. O caio-58, em 197,5°, ia até o shard-0#125, em 198,4°; no caminho apareceu o shard-3#8, em 197,8°, e ele muda para o shard-3. O davi-12, em 9,7°, encontra o shard-3#188 antes do shard-2#192 e também vai para o shard-3. A lena-77, a bia-31 e o mkt-01 acham o mesmo ponto de antes e ficam.',
        look: 'Os pinos do caio-58 e do davi-12 ficam amarelos e saem do shard-0 e do shard-2 para o shard-3. Os outros três não mudam de cor.',
        key: 'No anel, quem muda vai para o shard novo; nada anda entre shards antigos.',
        f(o, t) { onRing(o, 4, 200); const old = Object.fromEntries(CL.map(c => [c, ownerOf(ring(3, 200), HC[c])]));
          const mv = t > 1.4; CL.forEach(c => { const k = o.keys[c], moved = k.own !== old[c].s; if (moved) { k.tone = mv ? 'acc' : ''; if (!mv) { k.own = old[c].s; k.pt = old[c]; } } });
          tagKeys(o, (c, k) => old[c].s !== ownerOf(ring(4, 200), HC[c]).s ? `${c}\nshard-${old[c].s} → shard-3` : `${c}\nfica no shard-${k.own}`);
          ['caio-58', 'davi-12'].forEach(c => { const k = o.keys[c], f = clamp((t - 0.4) / 1.0); o.ring.walks.push({ a0: k.a, a1: ownerOf(ring(4, 200), HC[c]).a, f: ease(f) }); o.ring.mark.push(ownerOf(ring(4, 200), HC[c])); });
          shardBlocks(o, 4, DIST[200].k4, 'das 100 mil chaves');
          send(o, t, 1.6, 2.6, s2s(0, 3), 'caio-58', 'acc', 1.5); send(o, t, 2.0, 3.0, s2s(2, 3), 'davi-12', 'acc', 1.5);
          o.router = ['ROTEADOR', ['caio-58 → shard-3#8', 9.5, 'acc'], ['davi-12 → shard-3#188', 9.5, 'acc']];
          showLines(o, 'QUEM MUDA · 3 → 4 SHARDS', ['caio-58 197,5°: era shard-0#125 (198,4°)', ['  agora shard-3#8 (197,8°)', 'acc'], 'davi-12   9,7°: era shard-2#192 (12,1°)', ['  agora shard-3#188 (10,3°)', 'acc'], 'lena-77, bia-31, mkt-01: ficam'],
            [['MUDAM', '2 de 5', 'acc'], ['PARA', 'shard-3', 's3'], ['MOD 4', '4 de 5', 'bad']]);
          o.count = CNT('2 de 5', 'clientes mudam, os dois para o shard-3', 'com mod 4, 4 de 5'); } },
      { id: 'conta', dur: 6.5, title: '25,7% contra 75,2%: o que se copia',
        story: 'Nas 100 mil chaves de teste, 25,7% mudam de shard ao entrar o shard-3, perto do ideal de 25%, e todas vão para ele. Na tabela de 50 milhões de linhas, 1 em 4 são 12,5 milhões de linhas: 25 GB de cópia, 8 min 20 s a 50 MB/s. O mod 4 da aula 6 mexia em 75,2%: 37,5 milhões de linhas, 75 GB, 25 minutos, e a maior parte indo de um shard antigo para outro.',
        look: 'Os três shards antigos mandam linhas para o shard-3 e o mostrador conta os GB e os minutos até 25 GB e 8 min 20 s.',
        key: 'Hashing consistente move cerca de 1 ÷ N; o mod move N ÷ (N + 1).',
        f(o, t) { onRing(o, 4, 200, { focus: 3 }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); ['caio-58', 'davi-12'].forEach(c => { o.keys[c].tone = 'acc'; });
          shardBlocks(o, 4, DIST[200].k4, 'das 100 mil chaves');
          const f = clamp((t - 0.5) / 4), gb = 25 * f, sec = gb * 1000 / 50;
          [0, 1, 2].forEach(i => o.beams.push({ pts: s2s(i, 3), on: f < 1, dot: f < 1 ? ((t * 0.7 + i * 0.33) % 1) : null }));
          o.blocks[3].tone = 'on'; o.blocks[3].lines = [['caio-58, davi-12', 'acc'], [`recebendo ${f1(gb)} GB`, f < 1 ? 'acc' : 'dim']];
          showLines(o, 'QUANTO SE COPIA · 50 MB/s', [['anel: 25,7% das chaves mudam', 'acc'], '  todas para o shard-3', '50 M linhas ÷ 4 = 12,5 M · 25 GB', ['mod 4: 75,2% mudam · 37,5 M linhas', 'bad'], ['  75 GB · 25 min, entre shards antigos', 'bad']],
            [['COPIADO', f1(gb) + ' GB', 'acc'], ['TEMPO', mmss(sec), 'acc'], ['MOD 4', '75 GB · 25 min', 'bad']]);
          o.count = CNT(f1(gb) + ' GB', `copiados · ${mmss(sec)}`, 'anel 25,7% × mod 4 75,2%'); } },
      { id: 'erro', dur: 6, title: 'E se der errado: o shard-3 com 1 ponto só',
        story: 'Com 1 ponto por shard, o shard-3 entra num lugar só, em 7,1°. Ele pega o arco que vai de 283,0° a 7,1°, que era todo do shard-0, e nada dos outros. O shard-0 cai de 70,2% para 47,0% das chaves, o shard-3 fica com 23,2%, e o shard-1 e o shard-2 seguem com 8,8% e 21,0%. O servidor novo alivia um vizinho só, e o shard-0 continua com quase metade da carga.',
        look: 'Um único arco amarelo, logo depois do alto do anel, sai do azul do shard-0. As outras fatias não mudam.',
        key: 'Poucos pontos: o shard novo rouba de um vizinho só.',
        f(o, t) { const show = t > 0.8; onRing(o, show ? 4 : 3, 1, { focus: show ? 3 : null }); tagKeys(o, () => null); o.ring.mark = ring(show ? 4 : 3, 1);
          ring(4, 1).forEach(p => { if (p.s < 3 || show) ptTag(o, p.a, `shard-${p.s}\n${deg(p.a)}`, 's' + p.s, R2 + 18, p.s === 3 ? 30 : 6); });
          shardBlocks(o, show ? 4 : 3, show ? DIST[1].k4 : DIST[1].k3, 'das 100 mil chaves', { ghost: true });
          if (show) { o.blocks[0].tone = 'bad'; o.blocks[0].big = '47,0%'; }
          o.router = ['ROTEADOR', ['1 ponto por shard', 9.5, 'bad'], ['shard-3 em 7,1°', 9.5]];
          showLines(o, 'E SE DER ERRADO · 1 PONTO POR SHARD', ["murmur3('shard-3#0') → 7,1°", 'pega o arco 283,0° → 7,1°', ['que era todo do shard-0', 'bad'], 'shard-0: 70,2% → 47,0%', 'shard-1 8,8% e shard-2 21,0%: iguais'],
            [['SHARD-0', show ? '47,0%' : '70,2%', 'bad'], ['SHARD-3', show ? '23,2%' : '—', 's3'], ['MÁX ÷ MÉDIA', show ? '1,88' : '2,11', 'bad']]);
          o.count = CNT(show ? '47,0%' : '70,2%', 'no shard-0', 'dos 5 clientes, nenhum muda'); } },
    ],
    vnodes: VS.map(V => ({ id: 'v' + V, V, dur: 4 })).concat([{ id: 'domino', dur: 6.5 }]),
    slots: [
      { id: 'slots', dur: 4.5, title: '1.024 slots e um mapa de 1 KB',
        story: 'No segundo modo de guardar a chave, o hash cai num de 1.024 slots fixos: murmur3 mod 1.024. Uma tabela diz de que shard é cada slot. O mapa inicial é slot mod 3, e cada shard fica com 342, 341 e 341 slots. O mapa inteiro cabe em 1 KB, e mudar de shard passa a ser mudar linhas dessa tabela.',
        look: 'O anel agora é a fila dos 1.024 slots, do 0 no alto ao 1.023, em listras das três cores: slot 0 do shard-0, slot 1 do shard-1, slot 2 do shard-2 e assim por diante.',
        key: 'Slots separam o hash do shard: o hash escolhe o slot, o mapa escolhe o shard.',
        f(o, t) { o.ring = { kind: 'slots', moved: 0, walks: [], mark: [] };
          [[0, 'slot 0'], [0.25, 'slot 256'], [0.5, 'slot 512'], [0.75, 'slot 768']].forEach(([a, s]) => ptTag(o, a, s, 'dim', R2 + 16, 4));
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard-${i}`, big: ['342', '341', '341'][i], bar: [342, 341, 341][i] / 1024, sub: 'slots de 1.024', col: i, tone: '', lines: [[`slots ${i}, ${i + 3}, ${i + 6} …`, 'dim']] }; });
          o.router = ['ROTEADOR', ['hash mod 1.024', 10, 'acc'], ['→ mapa slot → shard', 9.5]];
          showLines(o, 'SLOTS FIXOS', ['slot = murmur3(cliente_id) mod 1.024', 'mapa inicial: shard = slot mod 3', '342 / 341 / 341 slots', 'o mapa cabe em 1 KB', 'Redis Cluster: 16.384 slots, CRC16'],
            [['SLOTS', '1.024', ''], ['MAPA', '1 KB', 'acc']]);
          o.count = CNT('1.024', 'slots', '342 / 341 / 341'); } },
      { id: 'chaves', dur: 4.5, title: 'Cada cliente cai num slot',
        story: 'O roteador calcula murmur3 mod 1.024 e lê o mapa. A lena-77 cai no slot 472 (shard-1), a bia-31 no 827 (shard-2), o caio-58 no 749 (shard-2), o davi-12 no 432 (shard-0) e o mkt-01 no 597 (shard-0). Repare que, aqui, o shard sai de slot mod 3, e não do anel: é outro mapa.',
        look: 'Os cinco pinos estão nos seus slots, com a cor do dono que o mapa diz.',
        key: 'O hash do cliente nunca muda; quem decide o shard é a tabela.',
        f(o, t) { o.ring = { kind: 'slots', moved: 0, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024; o.keys[c] = { a: (s + 0.5) / 1024, own: s % 3, tone: '', slot: s, tag: `${c} · slot ${s}\n→ shard-${s % 3}` }; });
          [0, 1, 2].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: ['342', '341', '341'][i], bar: [342, 341, 341][i] / 1024, sub: 'slots de 1.024', col: i, tone: '', lines: live.map(c => [c, '']) }; });
          o.router = ['ROTEADOR', ['lena-77 → slot 472', 9.5, 'acc'], ['mapa[472] = shard-1', 9.5]];
          showLines(o, 'CADA CLIENTE NUM SLOT', CL.map(c => `${c.padEnd(7)} slot ${String(HC[c] % 1024).padStart(3)} → shard-${HC[c] % 1024 % 3}`), [['LENA-77', 'slot 472', 's1'], ['MAPA', 'slot mod 3', '']]);
          o.count = CNT('slot 472', 'lena-77 → shard-1', '0x8fd9d9d8 mod 1.024'); } },
      { id: 'move', dur: 6.5, title: 'Entra o shard-3: 256 slots trocam de dono',
        story: 'Para ir a 4 shards, a loja move slots. O shard-3 recebe os últimos 86 slots do shard-0, os últimos 85 do shard-1 e os últimos 85 do shard-2, em ordem de número: os slots 768 em diante. São 86 + 85 + 85 = 256 slots, exatamente 25% do total. Na tabela de 50 milhões de linhas são 12,5 milhões, 25 GB, 8 min 20 s de cópia a 50 MB/s.',
        look: 'O último quarto do anel, do slot 768 ao 1.023, vai ficando amarelo slot a slot. O mostrador conta os slots e os GB.',
        key: 'Com slots, reshard é mover linhas do mapa: 256 de 1.024, 25% exatos.',
        f(o, t) { const f = clamp((t - 0.6) / 4), n = Math.round(256 * f); o.ring = { kind: 'slots', moved: n, walks: [], mark: [] };
          [[0, 'slot 0'], [0.25, 'slot 256'], [0.5, 'slot 512'], [0.75, 'slot 768']].forEach(([a, s]) => ptTag(o, a, s, a === 0.75 ? 's3' : 'dim', R2 + 16, 4));
          const cnt = [0, 1, 2].map(i => [342, 341, 341][i] - Array.from({ length: n }, (_, k) => 768 + k).filter(s => s % 3 === i).length);
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard-${i}`, big: String(cnt[i]), bar: cnt[i] / 1024, sub: 'slots de 1.024', col: i, tone: '', lines: [[`cede ${[342, 341, 341][i] - cnt[i]} slots`, n ? 'acc' : 'dim']] }; });
          o.blocks[3] = { name: 'shard-3', big: String(n), bar: n / 1024, sub: 'slots de 1.024', col: 3, tone: 'on', lines: [['slots 768 … 1.023', 'acc']] };
          [0, 1, 2].forEach(i => o.beams.push({ pts: s2s(i, 3), on: f > 0 && f < 1, dot: f > 0 && f < 1 ? ((t * 0.7 + i * 0.33) % 1) : null }));
          const gb = 25 * f; o.router = ['ROTEADOR', ['mapa: 256 linhas mudam', 9.5, 'acc'], ['o hash não muda', 9.5]];
          showLines(o, 'RESHARD COM SLOTS · 50 MB/s', ['shard-3 ← 86 + 85 + 85 = 256 slots', 'shard-0 ≥ 768 · shard-1 ≥ 769 · shard-2 ≥ 770', '256 ÷ 1.024 = 25% exatos', '12,5 M linhas · 25 GB · 8 min 20 s', 'mapa novo: 4 colunas, ainda 1 KB'],
            [['MOVIDOS', `${n} slots`, 's3'], ['COPIADO', f1(gb) + ' GB', 'acc'], ['TEMPO', mmss(gb * 20), 'acc']]);
          o.count = CNT(`${n} de 256`, 'slots movidos', `${f1(gb)} GB · ${mmss(gb * 20)}`); } },
      { id: 'bia', dur: 5, title: 'Só a bia-31 muda',
        story: 'Dos cinco clientes, só a bia-31 está no último quarto: o slot 827 era do shard-2 e agora é do shard-3. O caio-58 ficou por pouco, no 749. A lena-77 (472), o davi-12 (432) e o mkt-01 (597) nem passam perto. O hash de ninguém mudou: mudou a linha 827 do mapa.',
        look: 'O pino da bia-31 fica amarelo e a luz leva a bia-31 do shard-2 para o shard-3. Os outros pinos seguem com a cor de antes.',
        key: 'Mover slots mexe só em quem mora neles.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own: own === 3 && t < 1.2 ? s % 3 : own, tone: own === 3 ? 'acc' : '', slot: s,
            tag: own === 3 ? `${c} · slot ${s}\nshard-2 → shard-3` : `${c} · slot ${s}\nfica no shard-${own}` }; });
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: '256', bar: 0.25, sub: 'slots de 1.024', col: i, tone: i === 3 ? 'on' : '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['nenhum dos 5', 'dim']] }; });
          send(o, t, 1.2, 2.3, s2s(2, 3), 'bia-31', 'acc', 2);
          o.router = ['ROTEADOR', ['bia-31 → slot 827', 9.5, 'acc'], ['mapa[827] = shard-3', 9.5, 'acc']];
          showLines(o, 'QUEM MUDA · 3 → 4 SHARDS', [['bia-31  slot 827 ≥ 770: shard-2 → shard-3', 'acc'], 'caio-58 slot 749 < 768: fica no shard-2', 'lena-77 472 · davi-12 432 · mkt-01 597', 'o hash é o mesmo; mudou o mapa'],
            [['MUDAM', '1 de 5', 'acc'], ['QUEM', 'bia-31', 's3'], ['ANEL', '2 de 5', '']]);
          o.count = CNT('1 de 5', 'clientes muda: a bia-31', 'slot 827, do shard-2 para o shard-3'); } },
      { id: 'diretorio', dur: 7, title: 'O diretório: mover um cliente só',
        story: 'O terceiro modo é o diretório: uma tabela cliente_id → shard, gravada quando o cliente nasce. São 1,5 milhão de clientes, uns 150 MB, que cabem num Redis e custam 1 ms por consulta. É ele que deixa mover só o mkt-01 para um shard dedicado: 20 milhões de linhas, 40 GB, 13 min 20 s a 50 MB/s, em quatro passos: copiar, aplicar o que chegou durante a cópia (CDC), trocar a entrada do diretório e apagar a origem.',
        look: 'A luz leva as linhas do mkt-01 do shard-0 para o shard-3, o mostrador conta até 40 GB e acende os quatro passos, um de cada vez.',
        key: 'O diretório move um cliente só; sem o passo do CDC, a cópia nasce velha.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          const f = clamp((t - 0.5) / 4), gb = 40 * f, ph = f < 1 ? (f < 0.8 ? 1 : 2) : t < 5.3 ? 3 : 4;
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own, tone: '', slot: s, tag: c }; });
          const M = o.keys['mkt-01']; M.tone = 'acc'; M.tag = ph >= 3 ? 'mkt-01 · diretório\n→ shard-3' : 'mkt-01 · slot 597\nshard-0 (copiando)'; if (ph >= 3) M.own = 3;
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: i === 3 ? 'dedicado' : '', bar: null, sub: i === 3 ? 'só o mkt-01' : 'slots de 1.024', col: i, tone: i === 3 ? 'on' : '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['nenhum dos 5', 'dim']] }; });
          o.blocks[3].lines = [[ph >= 3 ? 'mkt-01' : `recebendo ${f1(gb)} GB`, 'acc'], ['20 M linhas', 'dim']];
          if (ph < 3) o.beams.push({ pts: s2s(0, 3), on: true, dot: (t * 0.6) % 1 }); else quiet(o, s2s(0, 3));
          o.router = ['DIRETÓRIO', ['cliente_id → shard', 9.5], [ph >= 3 ? 'mkt-01 → shard-3' : 'mkt-01 → shard-0', 9.5, 'acc']];
          const P = (k, s) => [`${k} ${s}`, ph === k ? 'acc' : ph > k ? '' : 'dim'];
          showLines(o, 'MOVER O MKT-01 · 40 GB A 50 MB/s', [P(1, 'copia as 20 M linhas (40 GB)'), P(2, 'aplica o que chegou: CDC'), P(3, 'troca a entrada do diretório'), P(4, 'apaga a origem no shard-0'), ['diretório: 1,5 M clientes · 150 MB', 'dim']],
            [['COPIADO', f1(gb) + ' GB', 'acc'], ['TEMPO', mmss(gb * 20), 'acc'], ['PASSO', `${ph} de 4`, '']]);
          o.count = CNT(f1(gb) + ' GB', `de 40 · ${mmss(gb * 20)} de 13 min 20 s`, `passo ${ph} de 4`); } },
      { id: 'erro', dur: 8, title: 'E se der errado: a rota velha em cache',
        story: 'A loja cortou o mkt-01 para o shard-3, mas um roteador guardou a rota antiga, da época 1 do mapa. Ele manda o pedido do parceiro para o shard-0. Se o shard-0 aceitasse, o dado ficaria no lugar errado. Por isso o shard recusa chaves que não são mais dele, como o -MOVED do Redis Cluster, e diz para onde ir. O roteador vê que a época dele é velha, busca o mapa da época 2 e tenta de novo, agora no shard-3.',
        look: 'O pedido vai ao shard-0, volta vermelho com a recusa, e a segunda tentativa segue para o shard-3.',
        key: 'O mapa precisa de época, e o shard precisa recusar o que não é dele.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own, tone: '', slot: s, tag: c }; });
          const M = o.keys['mkt-01']; M.own = 3; M.tone = 'acc'; M.tag = 'mkt-01\ndiretório: shard-3 (época 2)';
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: i === 3 ? 'dedicado' : '', bar: null, sub: i === 3 ? 'só o mkt-01' : 'slots de 1.024', col: i, tone: '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['nenhum dos 5', 'dim']] }; });
          let ep = 1; o.router = ['ROTEADOR', ['mapa em cache: época 1', 9.5, 'bad'], ['mkt-01 → shard-0', 9.5, 'bad']];
          send(o, t, 0.4, 1.5, r2s(0), 'INSERT mkt-01 (época 1)', 'hi', 0.2);
          if (send(o, t, 1.9, 3.0, rev(r2s(0)), 'recusa: mkt-01 está no shard-3', 'bad', 0.6)) { o.blocks[0].tone = 'bad'; o.blocks[0].lines = [['recusou mkt-01', 'bad'], ['→ shard-3, época 2', 'bad']]; }
          if (t > 3.8) { ep = 2; o.router = ['ROTEADOR', ['busca o mapa: época 2', 9.5, 'acc'], ['mkt-01 → shard-3', 9.5, 'acc']]; }
          if (send(o, t, 4.2, 5.4, r2s(3), 'INSERT mkt-01 (época 2)', 'acc', 1.5)) { o.blocks[3].tone = 'on'; o.blocks[3].lines = [['mkt-01: gravado', 'acc'], ['época 2', 'dim']]; }
          showLines(o, 'E SE DER ERRADO · MAPA DESATUALIZADO', [['roteador com o mapa da época 1', 'bad'], 'INSERT mkt-01 → shard-0', ['shard-0 recusa: "está no shard-3"', 'bad'], 'roteador busca o mapa da época 2', ['INSERT mkt-01 → shard-3', 'acc']],
            [['ÉPOCA', String(ep), ep === 1 ? 'bad' : 'acc'], ['TENTATIVAS', t > 5.4 ? '2' : '1', '']]);
          o.count = CNT(`época ${ep}`, ep === 1 ? 'rota velha em cache' : 'mapa novo', 'o shard recusa o que não é dele'); } },
    ],
    shuffle: [
      { id: 'todas', dur: 7, title: 'Sem isolamento: a requisição ruim passa por todas',
        story: 'O serviço catalogo tem 10 réplicas, de catalogo-1 a catalogo-10, e cada uma aguenta 100 req/s. O mkt-01 manda uma requisição que trava a réplica que a recebe, e o robô de 500 por segundo do módulo 8 a repete. Se todo cliente pode usar as 10, a requisição ruim vai passando de réplica em réplica, e o serviço inteiro cai.',
        look: 'A luz vermelha sai do mkt-01 e trava uma réplica depois da outra, até as 10.',
        key: 'Sem limite de onde cada cliente cai, um cliente ruim alcança todas as réplicas.',
        f(o, t) { o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] }; CL.forEach(c => { o.keys[c] = { own: -1, tone: c === 'mkt-01' ? 'bad' : '', tag: c }; });
          const n = clamp(Math.floor((t - 0.6) / 0.42) + 1, 0, 10); o.reps = Array.from({ length: 10 }, (_, i) => ({ st: i < n ? 'bad' : '' }));
          if (n > 0 && n <= 10 && t < 0.6 + 10 * 0.42) o.beams.push({ pts: c2r('mkt-01', n), on: true, tone: 'bad', dot: ((t - 0.6) % 0.42) / 0.42 });
          CL.filter(c => c !== 'mkt-01').forEach(c => { o.keys[c].tag = n >= 10 ? `${c}\nsem serviço` : c; if (n >= 10) o.keys[c].tone = 'bad'; });
          showLines(o, 'O CATALOGO · 10 RÉPLICAS', ['catalogo-1 … catalogo-10', '100 req/s cada', 'mkt-01: a requisição que trava', 'o robô de 500/s a repete', ['todas podem receber: todas travam', 'bad']],
            [['TRAVADAS', `${n} de 10`, 'bad'], ['SEM SERVIÇO', n >= 10 ? '100%' : '—', 'bad']]);
          o.count = CNT(`${n} de 10`, 'réplicas travadas', 'sem isolamento'); } },
      { id: 'grupos', dur: 6, title: 'Grupos fixos de 2: cai um grupo inteiro',
        story: 'A primeira defesa são 5 grupos fixos de 2 réplicas: (1, 2), (3, 4), (5, 6), (7, 8) e (9, 10). O grupo de cada cliente é murmur3(cliente_id) mod 5. O mkt-01 cai no grupo (3, 4), e a bia-31 também. As duas réplicas travam, e 20% dos clientes, um grupo de 5, ficam sem serviço, a Bia incluída. Numa simulação com 10.000 clientes, são 2.007.',
        look: 'Os pares aparecem marcados no anel. A luz vermelha do mkt-01 trava a 3 e a 4, e o pino da bia-31 fica vermelho junto.',
        key: 'Grupo fixo isola os outros grupos, mas derruba o grupo inteiro: 20%.',
        f(o, t) { o.center = true; o.ring = { kind: 'groups', bad: t > 1.6 ? 1 : -1, walks: [], mark: [] };
          CL.forEach(c => { const g = GRP(c); o.keys[c] = { own: -1, tone: '', tag: `${c}\ngrupo ${pair(g)}`, reps: g }; });
          o.reps = Array.from({ length: 10 }, (_, i) => ({ st: t > 1.6 && (i === 2 || i === 3) ? 'bad' : '' }));
          CL.forEach(c => o.keys[c].reps.forEach(r => o.beams.push({ pts: c2r(c, r), on: c === 'mkt-01' && t > 0.4, tone: c === 'mkt-01' || (c === 'bia-31' && t > 1.6) ? 'bad' : '', dot: c === 'mkt-01' && t > 0.4 && t < 1.6 ? (t - 0.4) / 1.2 : null })));
          if (t > 1.6) { o.keys['mkt-01'].tone = 'bad'; o.keys['bia-31'].tone = 'bad'; o.keys['bia-31'].tag = 'bia-31 · grupo {3, 4}\nsem serviço'; }
          showLines(o, 'GRUPOS FIXOS DE 2', ['grupo = murmur3(cliente_id) mod 5', 'mkt-01 → grupo {3, 4}', ['bia-31 → grupo {3, 4}: cai junto', 'bad'], 'lena-77 {7, 8} · caio-58 e davi-12 {5, 6}', '10.000 clientes: 2.007 sem serviço'],
            [['SEM SERVIÇO', t > 1.6 ? '20%' : '—', 'bad'], ['GRUPOS', '5', '']]);
          o.count = CNT(t > 1.6 ? '20%' : '0%', 'dos clientes sem serviço', '1 grupo de 5, a Bia incluída'); } },
      { id: 'pares', dur: 5, title: 'Shuffle sharding: um par embaralhado para cada cliente',
        story: 'No shuffle sharding de 2 em 10, cada cliente recebe 2 réplicas escolhidas por rendezvous: as 2 de menor murmur3(cliente_id + ":catalogo-" + r). Há C(10, 2) = 45 pares possíveis, e os pares se sobrepõem. O mkt-01 fica com {8, 9}; a lena-77 com {6, 8}; a bia-31 com {4, 6}; o caio-58 com {1, 4}; o davi-12 com {1, 9}.',
        look: 'Cada cliente, no centro, liga-se às suas duas réplicas. Nenhum outro tem o par {8, 9} do mkt-01.',
        key: 'Cada cliente tem um subconjunto pequeno, e quase ninguém tem o mesmo.',
        f(o, t) { o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] };
          CL.forEach(c => { o.keys[c] = { own: -1, tone: c === 'mkt-01' ? 'acc' : '', tag: `${c}\n${pair(PAIR[c])}`, reps: PAIR[c] }; });
          o.reps = Array.from({ length: 10 }, (_, i) => ({ st: PAIR['mkt-01'].includes(i + 1) ? 'on' : '' }));
          CL.forEach((c, k) => PAIR[c].forEach(r => o.beams.push({ pts: c2r(c, r), on: t > 0.3 + k * 0.4, dot: t > 0.3 + k * 0.4 && t < 1.3 + k * 0.4 ? t - 0.3 - k * 0.4 : null })));
          showLines(o, 'SHUFFLE SHARDING · 2 EM 10', ["as 2 de menor murmur3(c + ':catalogo-' + r)", 'C(10, 2) = 45 pares', 'mkt-01 {8, 9} · lena-77 {6, 8}', 'bia-31 {4, 6} · caio-58 {1, 4}', 'davi-12 {1, 9}'],
            [['PARES', '45', 'acc'], ['MESMO PAR', '1 ÷ 45', '']]);
          o.count = CNT('45', 'pares possíveis', 'C(10, 2)'); } },
      { id: 'trava', dur: 6.5, title: 'O mkt-01 trava a 8 e a 9: quem nota?',
        story: 'A requisição ruim do mkt-01 trava o catalogo-8 e o catalogo-9. A bia-31 {4, 6} e o caio-58 {1, 4} nem notam. A lena-77 tem a 8 e o davi-12 tem a 9: cada um perde uma das duas réplicas e só continua atendido se o cliente tentar a outra, que é o retry que a AWS exige. Com 10.000 clientes simulados, 240 (2,4%) têm o mesmo par do mkt-01 e 3.868 (38,7%) dividem pelo menos uma réplica.',
        look: 'A 8 e a 9 ficam vermelhas. A Lena e o Davi batem na réplica travada e a luz desvia para a outra; a Bia e o Caio seguem sem mudança.',
        key: 'O raio de explosão cai de 20% para quem tem o mesmo par: cerca de 2,2%.',
        f(o, t) { shuffleDown(o, t, PAIR, [8, 9]);
          showLines(o, 'CATALOGO-8 E CATALOGO-9 TRAVAM', ['bia-31 {4, 6} · caio-58 {1, 4}: nem notam', ['lena-77 {6, 8}: perde a 8', retry ? '' : 'bad'], ['davi-12 {1, 9}: perde a 9', retry ? '' : 'bad'], retry ? ['com retry: tentam a 6 e a 1', 'acc'] : ['sem retry: metade das chamadas falha', 'bad'], '10.000: 240 mesmo par · 3.868 dividem uma'],
            [['MESMO PAR', '2,4%', 'acc'], ['DIVIDEM UMA', '38,7%', ''], ['GRUPOS FIXOS', '20%', 'bad']]);
          o.count = CNT('2,4%', 'com o mesmo par do mkt-01', `38,7% dividem uma réplica · ${retry ? 'com' : 'sem'} retry`); } },
      { id: 'quatro', dur: 6, title: '4 réplicas por cliente: menos coincidência, mais vizinhos',
        story: 'Com 4 réplicas por cliente, há C(10, 4) = 210 conjuntos. O mkt-01 fica com {2, 4, 8, 9}. Só 50 de 10.000 clientes (0,5%) têm o mesmo conjunto, mas 93,2% dividem pelo menos uma réplica com ele. O caio-58 {1, 4, 8, 9} perde três das quatro e fica só com a 1: sem retry, ele perde três de cada quatro chamadas.',
        look: 'Quatro réplicas vermelhas. Quase todo cliente tem uma ligação vermelha, e o caio-58 tem três.',
        key: 'Mais réplicas por cliente: o mesmo conjunto fica raro, e o retry fica obrigatório.',
        f(o, t) { shuffleDown(o, t, QUAD, [2, 4, 8, 9]);
          showLines(o, 'SHUFFLE SHARDING · 4 EM 10', ['C(10, 4) = 210 conjuntos', 'mkt-01 → {2, 4, 8, 9}', 'mesmo conjunto: 50 de 10.000 (0,5%)', ['dividem ao menos uma: 93,2%', 'bad'], 'caio-58 {1, 4, 8, 9}: sobra a 1'],
            [['MESMO CONJUNTO', '0,5%', 'acc'], ['DIVIDEM UMA', '93,2%', 'bad']]);
          o.count = CNT('0,5%', 'com o mesmo conjunto', `93,2% dividem uma réplica · ${retry ? 'com' : 'sem'} retry`); } },
      { id: 'semretry', dur: 7, title: 'E se der errado: o cliente não tenta a outra',
        story: 'A lena-77 tem as réplicas 6 e 8, e o catalogo-8 está travado. O app dela escolhe uma réplica por chamada e não repete quando a primeira falha. Metade das chamadas cai na 8 e falha; o mesmo vale para o Davi com a 9. O isolamento existe só no desenho: sem retry no cliente, o par vira metade das requisições perdidas.',
        look: 'As chamadas da Lena e do Davi alternam entre as duas réplicas; as que batem na 8 e na 9 voltam vermelhas e ninguém tenta de novo.',
        key: 'Shuffle sharding exige que o cliente tente todas as réplicas do seu subconjunto.',
        f(o, t) { const was = retry; retry = false; shuffleDown(o, t, PAIR, [8, 9]); retry = was;
          const n = Math.min(6, Math.floor(t / 0.9) + 1), bad = Math.floor(n / 2);
          o.keys['lena-77'].tag = `lena-77 {6, 8}\n${bad} de ${n} chamadas falham`; o.keys['davi-12'].tag = `davi-12 {1, 9}\n${bad} de ${n} chamadas falham`;
          showLines(o, 'E SE DER ERRADO · SEM RETRY', ['lena-77 {6, 8}: uma réplica por chamada', ['a 8 travou: falha e não tenta a 6', 'bad'], ['davi-12 {1, 9}: o mesmo com a 9', 'bad'], `chamadas: ${n} · falharam: ${bad}`, ['metade das requisições perdidas', 'bad']],
            [['LENA-77', '50% falha', 'bad'], ['DAVI-12', '50% falha', 'bad'], ['COM RETRY', '0%', 'acc']]);
          o.count = CNT(`${bad} de ${n}`, 'chamadas da Lena falham', 'sem retry no cliente'); } },
    ],
    lab: [
      { id: 'hashing', dur: 4.5, title: 'hashing/: SHA-256 mod 3 em 10 tenants',
        story: 'O primeiro programa passa 10 tenants para minúsculas, calcula o SHA-256 e faz mod 3. A saída do go run main.go bate com a do artigo: Padaria-Estrela-Filial-1 e Acougue-Zona-Oeste no shard 0, quatro no shard 1 e quatro no shard 2. Contagem 2 / 4 / 4. Com 4 shards, a mesma função muda 7 dos 10 tenants de lugar.',
        look: 'O anel está apagado: este programa não usa anel. Os três shards mostram quem caiu em cada um.',
        key: 'O mod funciona para espalhar e quebra quando N muda: 7 de 10.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] };
          const L = [['Padaria-Estrela-Filial-1', 'Acougue-Zona-Oeste'], ['Petshops-Souza', 'Mecanica-Dois-Irmaos', 'Padaria-Estrela-Filial-3', 'Acougue-Zona-Norte'], ['Pizzarias-Carvalho', 'Padaria-Estrela-Filial-2', 'Hortifruti-Oba', 'Acougue-Zona-Leste']];
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard ${i}`, big: `${L[i].length} tenants`, bar: L[i].length / 10, sub: 'SHA-256 mod 3', col: i, tone: '', lines: L[i].map(s => [s, '']), small: true }; });
          o.router = ['hashing/main.go', ['sha256(minúsculas)', 9.5], ['mod 3', 10, 'acc']];
          showLines(o, '$ go run main.go · hashing/', ['10 tenants · SHA-256 · mod 3', 'Petshops-Souza 1 · Pizzarias-Carvalho 2', 'Mecanica-Dois-Irmaos 1 · Filial-1 0 · …', ['shard 0: 2 · shard 1: 4 · shard 2: 4', 'acc'], ['com 4 shards: 7 de 10 mudam', 'bad']],
            [['CONTAGEM', '2 / 4 / 4', 'acc'], ['3 → 4', '7 de 10', 'bad']]);
          o.count = CNT('2 / 4 / 4', 'tenants por shard', 'saída igual à do artigo'); } },
      { id: 'distrib', dur: 4.5, title: 'hashing-distrib/: 5 funções, 41 entradas',
        story: 'O segundo programa compara 5 funções de hash em 41 entradas e 5 shards. As contagens variam de 4 a 14, e o artigo sugere que isso diferencia as funções. Mas são só 41 entradas (38 tenants únicos, porque as filiais da Padaria Estrela se repetem): o desvio esperado por shard é 2,56, e numa tabela de 25 contagens um 14 aparece por sorte. Com 100 mil chaves, as 5 ficam a menos de 2% do ideal.',
        look: 'O mostrador mostra a tabela que o programa imprime: uma linha por função, uma coluna por shard.',
        key: 'Com 41 itens, a diferença é ruído; balanceamento não decide a função.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] }; o.router = ['hashing-distrib/', ['5 funções × 5 shards', 9.5], ['41 entradas', 9.5, 'acc']];
          showLines(o, '$ go run main.go · hashing-distrib/', ['SHA-256   9   7   6   8  11', 'SHA-512   8   9  12   7   5', 'MD5      13   9   4   5  10', ['FNV-1a    6   6   6  14   9', 'bad'], 'simples   5   7   9  10  10', ['41 entradas, 38 únicas · ideal 8,2', 'dim']],
            [['IDEAL', '8,2', ''], ['DESVIO', '2,56', 'acc'], ['100 MIL', '≤ 2%', 'acc']]);
          o.count = CNT('2,56', 'desvio esperado com 41 entradas', 'as diferenças são ruído'); } },
      { id: 'murmur', dur: 4.5, title: 'murmur/: 7, 8, 9, 8, 7',
        story: 'O terceiro programa usa o murmur3 da biblioteca spaolacci/murmur3 v1.1.0, que o go.mod baixa, em 39 entradas (38 únicas) e 5 shards. Ele não passa para minúsculas, ao contrário dos outros. A saída é 7, 8, 9, 8, 7. O trecho impresso no artigo lista 12 nomes e não conta nada: o mapa nunca é incrementado. O laço que conta está no repositório.',
        look: 'O mostrador mostra a contagem por shard, que soma 39.',
        key: 'A saída do artigo é a do repositório, não a do trecho impresso.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] }; o.router = ['murmur/main.go', ['murmur3.Sum32', 9.5], ['mod 5, sem minúsculas', 9.5, 'acc']];
          showLines(o, '$ go run main.go · murmur/', ['spaolacci/murmur3 v1.1.0 (go.mod)', '39 entradas, 38 únicas · 5 shards', ['shard 0 … 4:  7  8  9  8  7', 'acc'], ['trecho do artigo: 12 nomes,', 'bad'], ['  shardDistribution nunca incrementa', 'bad']],
            [['CONTAGEM', '7 8 9 8 7', 'acc'], ['SOMA', '39', '']]);
          o.count = CNT('7 / 8 / 9 / 8 / 7', 'entradas por shard', 'soma 39'); } },
      { id: 'anel3', dur: 5, title: 'consistent-hashing-remove/: o anel de 3 pontos',
        story: 'O quarto programa monta um anel com 4 shards e NumReplicas = 3: cada um entra com 3 pontos, o SHA-256 de "Shard-000", "Shard-001" e "Shard-002", por exemplo. Os 10 tenants caem assim: Shard-00 com 0, Shard-01 com 4, Shard-02 com 3 e Shard-03 com 3. O Shard-00 nasce vazio: 3 pontos são poucos, e os dele ficaram logo depois dos pontos de outros.',
        look: 'O anel do lab, com 12 pontos e fatias bem desiguais; os 10 tenants são pinos pequenos. O bloco do Shard-00 está vazio.',
        key: 'Com 3 pontos por shard, um shard pode nascer sem nada.',
        f(o, t) { labRing(o, LABPTS); o.blocks[0].tone = 'bad';
          showLines(o, '$ go run main.go · consistent-hashing-remove/', ['NumReplicas = 3 · SHA-256 (8 bytes)', '4 shards × 3 pontos = 12 pontos', ['Shard-00: 0 · 01: 4 · 02: 3 · 03: 3', 'acc'], ['o Shard-00 nasce vazio', 'bad']],
            [['SHARD-00', '0 tenants', 'bad'], ['PONTOS', '12', '']]);
          o.count = CNT('0 / 4 / 3 / 3', 'tenants por shard', 'o Shard-00 vazio'); } },
      { id: 'remove', dur: 6, title: 'Remove o Shard-02: 3 de 10 mudam',
        story: 'O programa chama RemoveNode("Shard-02"), e os 3 pontos dele saem do anel. Os tenants que eram do Shard-02, Mecanica-Dois-Irmaos, Padaria-Estrela-Filial-3 e Acougue-Zona-Leste, andam no sentido horário até o próximo ponto, e os três caem no Shard-00. Ninguém mais muda: 3 de 10. Mas o programa só muda o anel; não copia nenhuma linha.',
        look: 'Os arcos do Shard-02 somem e a luz leva os três tenants dele até o Shard-00. Os outros sete não mudam.',
        key: 'Quem sai do anel entrega as chaves ao próximo ponto no sentido horário.',
        f(o, t) { const gone = t > 0.8; labRing(o, gone ? LABPTS.filter(p => p[1] !== 2) : LABPTS, { from: gone ? LABPTS : null, f: clamp((t - 0.8) / 1.4) });
          if (gone) { o.blocks[2] = { name: 'Shard-02', big: 'removido', bar: null, sub: 'RemoveNode', col: 2, tone: 'bad', lines: [['3 pontos a menos', 'bad']], small: true }; o.blocks[0].tone = 'on'; }
          showLines(o, 'RemoveNode("Shard-02")', ['sai: Shard-02 (3 pontos)', ['Mecanica-Dois-Irmaos → Shard-00', 'acc'], ['Padaria-Estrela-Filial-3 → Shard-00', 'acc'], ['Acougue-Zona-Leste → Shard-00', 'acc'], ['o lab só muda o anel: não migra dado', 'dim']],
            [['MUDAM', '3 de 10', 'acc'], ['PARA', 'Shard-00', 's0']]);
          o.count = CNT('3 de 10', 'tenants mudam', 'todos para o Shard-00'); } },
      { id: 'add', dur: 5.5, title: 'Adiciona o Shard-04: 1 de 10 muda',
        story: 'Depois o programa chama AddNode("Shard-04"), com 3 pontos novos em 306,6°, 324,3° e 358,2°. Só um tenant tem um ponto novo logo à frente: o Hortifruti-Oba, em 354,2°, que ia dar a volta até o Shard-01, em 24,2°, e agora para no Shard-04, em 358,2°. 1 de 10 muda. A anotação "// Nova movimentação" da saída do artigo foi escrita à mão.',
        look: 'Três pontos rosa entram no anel, e a luz leva o Hortifruti-Oba do Shard-01 para o Shard-04.',
        key: 'Quem entra no anel pega só as chaves logo antes dos seus pontos.',
        f(o, t) { const on = t > 0.6, P0 = LABPTS.filter(p => p[1] !== 2); labRing(o, on ? P0.concat(LAB04) : P0, { from: on ? P0 : null, f: clamp((t - 0.6) / 1.2), slot2: 4 });
          o.blocks[2] = on ? Object.assign(o.blocks[2], { tone: 'on' }) : { name: 'Shard-04', big: '', bar: null, sub: 'ainda não existe', col: 4, tone: 'dim', lines: [], small: true };
          showLines(o, 'AddNode("Shard-04")', ['entra: Shard-04 · 306,6° 324,3° 358,2°', ['Hortifruti-Oba 354,2°: Shard-01 → Shard-04', 'acc'], 'os outros 9 ficam', ['"// Nova movimentação": anotação manual', 'dim']],
            [['MUDAM', '1 de 10', 'acc'], ['QUEM', 'Hortifruti-Oba', 's4']]);
          o.count = CNT('1 de 10', 'tenant muda', 'Hortifruti-Oba → Shard-04'); } },
      { id: 'vazio', dur: 5, title: 'E se der errado: o anel vazio',
        story: 'O GetTenantNode procura o primeiro ponto com hash maior ou igual ao da chave e, se passar do fim, volta ao índice 0. Num anel vazio, com todos os shards removidos ou nenhum adicionado, len(ring.Nodes) é 0, o índice vira 0 e ring.Nodes[0] acessa um slice sem elementos: panic. O roteador da loja precisa checar antes e responder com um erro claro e um alarme.',
        look: 'O anel sem nenhum ponto e todos os tenants vermelhos: não há para onde andar.',
        key: 'Anel vazio é um caso que o código precisa tratar, não um pânico no roteador.',
        f(o, t) { o.ring = { kind: 'plain', bad: true, walks: [], mark: [] }; o.ten = TEN.map(([n, d]) => ({ a: d / 360, own: -1, tone: 'bad' }));
          [0, 1, 2, 3].forEach(i => { o.blocks[i] = { name: ['Shard-00', 'Shard-01', 'Shard-04', 'Shard-03'][i], big: 'removido', bar: null, sub: 'RemoveNode', col: [0, 1, 4, 3][i], tone: 'bad', lines: [], small: true }; });
          o.router = ['GetTenantNode', ['len(ring.Nodes) = 0', 9.5, 'bad'], ['idx = 0 → Nodes[0]', 9.5, 'bad']];
          showLines(o, 'E SE DER ERRADO · ANEL VAZIO', ['ring.Nodes = []', 'idx := sort.Search(0, …)  // 0', 'if idx == len(ring.Nodes) { idx = 0 }', 'return ring.Nodes[idx].ID', ['panic: runtime error: index out of range', 'bad'], ['  [0] with length 0', 'bad']],
            [['ANEL', '0 pontos', 'bad'], ['RESULTADO', 'panic', 'bad']]);
          o.count = CNT('panic', 'index out of range [0] with length 0', 'anel sem pontos'); } },
    ],
  };
  // pontos virtuais: um passo por quantidade de pontos (1, 3, 10, 100, 200)
  const VTXT = {
    1: ['1 ponto por shard: 70,2 / 8,8 / 21,0', 'Com 1 ponto por shard, o anel tem 3 pontos, e as fatias dependem só de onde o hash de cada nome caiu. O shard-0 fica com 70,2% das 100 mil chaves, o shard-1 com 8,8% e o shard-2 com 21,0%. O maior tem 2,11 vezes a média. Ao entrar um quarto shard, 23,2% das chaves mudam, todas para ele.',
      'Três arcos de tamanhos bem diferentes: o azul do shard-0 cobre quase três quartos da volta.', 'Um ponto por shard deixa as fatias na sorte do hash.'],
    3: ['3 pontos, como no lab: 59,0 / 17,7 / 23,3', 'Com 3 pontos por shard, o número do lab do autor, a distribuição melhora pouco: 59,0 / 17,7 / 23,3%, máximo 1,77 vezes a média. No lab, com 4 shards, o Shard-00 nasceu sem nenhum tenant. De 3 para 4 shards, 32,1% das chaves mudam, longe do ideal de 25%.',
      'Nove arcos; o azul ainda domina a metade de baixo do anel.', 'Três pontos ainda são poucos.'],
    10: ['10 pontos: 37,1 / 30,8 / 32,1', 'Com 10 pontos por shard, o anel tem 30 pontos e as fatias se misturam: 37,1 / 30,8 / 32,1%, máximo 1,11 vezes a média. A fração que muda ao entrar um shard, 15,2%, ainda sai do ideal, para baixo.',
      'As três cores se alternam pela volta toda, em arcos de tamanhos variados.', 'Com dezenas de pontos, a sorte de cada um pesa menos.'],
    100: ['100 pontos: 28,3 / 39,2 / 32,5', 'Com 100 pontos por shard a razão máximo ÷ média sobe um pouco, para 1,18, por acaso: o shard-1 ficou com 39,2%. A sorte dos pontos pesa menos quanto mais pontos há, mas não some. De 3 para 4 shards mudam 24,2% das chaves.',
      'Listras finas das três cores; o verde do shard-1 aparece um pouco mais.', 'Mais pontos não garantem o equilíbrio; tornam o desvio pequeno.'],
    200: ['200 pontos, o canônico: 35,5 / 32,2 / 32,3', 'Com 200 pontos por shard, o valor deste módulo, as 100 mil chaves ficam com 35,5 / 32,2 / 32,3%, máximo 1,07 vezes a média. Ao entrar o shard-3, 25,7% mudam, perto do ideal de 25%. Em todas as linhas desta tabela, as chaves que mudam vão só para o shard novo.',
      'Listras finas e parecidas: cada cor cobre perto de um terço do anel.', 'Centenas de pontos por shard deixam cada um perto de 1 ÷ N.'],
  };
  STEPS.vnodes.forEach(s => { if (!s.V) return; const [title, story, look, key] = VTXT[s.V], D = DIST[s.V];
    Object.assign(s, { title, story, look, key, f(o, t) { onRing(o, 3, s.V); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); if (s.V <= 3) o.ring.mark = ring(3, s.V);
      shardBlocks(o, 3, D.k3, 'das 100 mil chaves');
      o.router = ['ROTEADOR', [`${s.V} ${s.V === 1 ? 'ponto' : 'pontos'} por shard`, 10, 'acc'], [`${3 * s.V} pontos no anel`, 9.5]];
      showLines(o, `PONTOS VIRTUAIS · ${s.V} POR SHARD`, [`3 shards × ${s.V} = ${3 * s.V} pontos`, `chaves: ${D.k3.map(f1).join(' / ')}%`, [`máx. ÷ média: ${D.r}`, s.V <= 3 ? 'bad' : 'acc'], `3 → 4 shards: ${D.mv}% mudam`, '  todas para o shard novo'],
        [['MÁX ÷ MÉDIA', D.r, s.V <= 3 ? 'bad' : 'acc'], ['3 → 4', D.mv + '%', '']]);
      o.count = CNT(D.r, 'máx. ÷ média', `${D.k3.map(f1).join(' / ')}% · 3 → 4: ${D.mv}%`); } }); });
  Object.assign(STEPS.vnodes[5], { title: 'E se der errado: sai o shard maior e vem o dominó',
    story: 'Agora o shard maior cai e sai do anel. Com 1 ponto por shard, ele tinha 70,2% das chaves, e todas vão para o próximo ponto no sentido horário: o shard-2, que passa a ter 91,2% e satura. Com 3 pontos, 56,7 mil das 59,0 mil chaves vão para o shard-1, que fica com 74,4%. Com 200 pontos, as chaves se dividem: o shard-1 fica com 53,1% e o shard-2 com 46,9%.',
    look: 'O arco azul do shard-0 some e vira todo roxo: o shard-2 engole a fatia inteira.',
    key: 'Pontos virtuais não só equilibram: espalham o impacto de uma saída.',
    f(o, t) { const gone = t > 0.8; onRing(o, 3, 1, { rm: gone ? 0 : undefined, rmf: clamp((t - 0.8) / 1.2) }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); o.ring.mark = ring(3, 1).filter(p => !gone || p.s);
      if (gone) CL.forEach(c => { if (ownerOf(ring(3, 1), HC[c]).s === 0) { o.keys[c].tone = 'bad'; o.keys[c].tag = `${c}\nshard-0 → shard-2`; } });
      shardBlocks(o, 3, gone ? [0, 8.8, 91.2] : DIST[1].k3, 'das 100 mil chaves');
      if (gone) { o.blocks[0] = { name: 'shard-0', big: 'fora', bar: 0, sub: 'saiu do anel', col: 0, tone: 'bad', lines: [['70,2% foram embora', 'bad']] }; o.blocks[2].tone = 'bad'; }
      o.router = ['ROTEADOR', ['1 ponto por shard', 9.5], [gone ? 'shard-0 saiu' : '3 pontos no anel', 9.5, gone ? 'bad' : '']];
      showLines(o, 'E SE DER ERRADO · O SHARD MAIOR SAI', [['1 ponto: shard-0 (70,2%) sai', 'bad'], ['  tudo vai ao shard-2 → 91,2%', 'bad'], '3 pontos: 56,7 de 59,0 mil → shard-1', '  shard-1 fica com 74,4%', ['200 pontos: 53,1% e 46,9%', 'acc']],
        [['SHARD-2', gone ? '91,2%' : '21,0%', 'bad'], ['COM 200', '53,1 / 46,9', 'acc']]);
      o.count = CNT(gone ? '91,2%' : '21,0%', 'no shard-2', 'o dominó com 1 ponto'); } });
  // shuffle: réplicas travadas e quem as usa
  function shuffleDown(o, t, SET, down) {
    o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] }; const lock = t > 0.9;
    o.reps = Array.from({ length: 10 }, (_, i) => ({ st: lock && down.includes(i + 1) ? 'bad' : '' }));
    CL.forEach(c => { const s = SET[c], hit = s.filter(r => down.includes(r)), ok = s.filter(r => !down.includes(r)), m = c === 'mkt-01';
      o.keys[c] = { own: -1, tone: m ? 'bad' : '', tag: `${c}\n${pair(s)}`, reps: s };
      if (m) { s.forEach(r => o.beams.push({ pts: c2r(c, r), on: true, tone: 'bad', dot: !lock ? t / 0.9 : null })); return; }
      if (!lock || !hit.length) { s.forEach(r => o.beams.push({ pts: c2r(c, r), on: lock, dot: lock ? ((t * 0.6 + CL.indexOf(c) * 0.2) % 1) : null })); if (lock) o.keys[c].tag = `${c} ${pair(s)}\nnem nota`; return; }
      // tem réplica travada: bate nela e, com retry, tenta a outra
      const ph = (t - 0.9) % 1.8;
      hit.forEach(r => o.beams.push({ pts: c2r(c, r), on: true, tone: 'bad', cut: ph < 0.7 ? ph / 0.7 : 1 }));
      ok.forEach(r => o.beams.push({ pts: c2r(c, r), on: retry ? ph > 0.7 : (ph > 0.9), dot: retry && ph > 0.7 ? Math.min(1, (ph - 0.7) / 0.8) : null }));
      o.keys[c].tone = retry ? 'acc' : 'bad';
      o.keys[c].tag = retry ? `${c} ${pair(s)}\nperde ${pair(hit)}, tenta ${ok.join(', ')}` : `${c} ${pair(s)}\nsem retry: falha`; });
  }
  // o anel do lab: pontos (graus, shard) e os 10 tenants com o dono em cada anel
  function labRing(o, pts, opt = {}) {
    const P = pts.map(([d, s]) => ({ a: d / 360, s })), F = opt.from ? opt.from.map(([d, s]) => ({ a: d / 360, s })) : null;
    o.ring = { kind: 'lab', pts: P, from: F, f: opt.f, walks: [], mark: P };
    const names = ['Shard-00', 'Shard-01', opt.slot2 === 4 ? 'Shard-04' : 'Shard-02', 'Shard-03'], cols = [0, 1, opt.slot2 === 4 ? 4 : 2, 3];
    o.ten = TEN.map(([n, d]) => { const own = labOwner(pts, d), was = opt.from ? labOwner(opt.from, d) : own, moved = own !== was;
      const t = { a: d / 360, own: moved && opt.f < 1 ? was : own, tone: moved ? 'acc' : '', name: n, tag: moved ? `${n}\n${['Shard-00', 'Shard-01', 'Shard-02', 'Shard-03', 'Shard-04'][was]} → ${['Shard-00', 'Shard-01', 'Shard-02', 'Shard-03', 'Shard-04'][own]}` : null };
      if (moved) { const to = (opt.to || pts).filter(p => p[1] === own).map(p => p[0] / 360).sort((a, b) => a - b), a1 = to.find(a => a >= d / 360) ?? to[0] + 1; o.ring.walks.push({ a0: d / 360, a1: a1 < d / 360 ? a1 + 1 : a1, f: ease(opt.f) }); }
      return t; });
    for (let i = 0; i < 4; i++) { const s = cols[i], live = o.ten.filter(q => q.own === s);
      o.blocks[i] = { name: names[i], big: `${live.length} tenants`, bar: live.length / 10, sub: '3 pontos no anel', col: s, tone: '', small: true,
        lines: live.length ? live.slice(0, 4).map(q => [q.name, q.tone]) : [['nenhum tenant', 'bad']] }; }
    o.router = ['GetTenantNode', ['sha256(minúsculas)', 9.5], ['1º ponto ≥ hash', 9.5, 'acc']];
  }
  const L = () => STEPS[sc], N = () => L().length;
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); L()[step].f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawShard(Bk, b) {
    const key = JSON.stringify(b) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, tone = b.tone, { x, u, C } = frameBox(cv, tone === 'on', tone === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, dim = tone === 'dim';
      x.fillStyle = shFill(b.col); x.globalAlpha = dim ? 0.35 : 1; x.fillRect(u(0), u(0), u(5), cv.c.height); x.globalAlpha = 1;
      x.textAlign = 'left'; x.fillStyle = dim ? INK() : shInk(b.col); x.font = `700 ${u(13)}px ${MONO3}`; x.fillText(b.name, u(10), u(11));
      if (b.big) { x.textAlign = 'right'; x.fillStyle = tone === 'bad' ? BAD() : C.inkHi; fitFont(x, u, b.big, b.small ? 10.5 : 13, W_ - 90); x.fillText(b.big, u(W_ - 5), u(11)); x.textAlign = 'left'; }
      if (b.bar != null) { x.fillStyle = theme === 'light' ? '#d2d4d5' : '#26292b'; x.fillRect(u(10), u(21), u(W_ - 16), u(5)); x.fillStyle = tone === 'bad' ? BAD() : shFill(b.col); x.fillRect(u(10), u(21), u((W_ - 16) * clamp(b.bar)), u(5)); }
      x.fillStyle = INK(); x.font = `700 ${u(8.2)}px ${MONO3}`; x.fillText(b.sub || '', u(10), u(34));
      const ls = b.small ? 8.4 : 10.5, lh = b.small ? 12 : 14.5; (b.lines || []).slice(0, 4).forEach((l, i) => { x.fillStyle = toneC(l[1] || ''); fitFont(x, u, l[0], ls, W_ - 16); x.fillText(l[0], u(10), u(49 + i * lh)); });
      cv.tex.needsUpdate = true; }
    const fk = b.name + (b.tone || '') + b.col + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3; x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = b.tone === 'bad' ? BAD() : shInk(b.col); x.font = `700 ${u(10)}px ${MONO3}`;
      const lab = b.name.toUpperCase(); x.fillText(lab, u(3), u(mid)); const lw = x.measureText(lab).width / P;
      x.fillStyle = INK(); x.font = `700 ${u(7.6)}px ${MONO3}`; x.fillText(/^shard-\d$/.test(b.name) ? `pg-pedidos-${b.name.slice(-1)}` : 'lab do autor', u(8 + lw), u(mid));
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = b.tone === 'on' ? 0.45 : 0;
  }
  function drawRows(Bk, rows, on) {
    const key = JSON.stringify(rows) + on + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on, ''), W_ = cv.c.width / cv.P; x.textAlign = 'left';
    x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(rows[0], u(6), u(10));
    rows.slice(1).forEach((r, i) => { x.fillStyle = toneC(r[2] || ''); fitFont(x, u, r[0], r[1] * 1.1, W_ - 12); x.fillText(r[0], u(6), u(28 + i * 17)); });
    cv.tex.needsUpdate = true;
    if (Bk.fkey !== theme) { Bk.fkey = theme; const fv = Bk.fr, P = fv.P, fx = fv.x; fx.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; fx.fillRect(0, 0, fv.c.width, fv.c.height);
      fx.textBaseline = 'middle'; fx.textAlign = 'left'; fx.fillStyle = C.inkHi; fx.font = `700 ${9 * P}px ${MONO3}`; fx.fillText('ROTEADOR', 3 * P, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
  }
  function drawRep(Bk, r, st) {
    const key = r + st + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, st === 'on', st === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
    x.textAlign = 'center'; x.fillStyle = st === 'bad' ? BAD() : INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText(st === 'bad' ? 'travada' : 'catalogo', u(W_ / 2), u(8.5));
    x.fillStyle = st === 'bad' ? BAD() : st === 'on' ? accC() : C.inkHi; x.font = `700 ${u(17)}px ${MONO3}`; x.fillText(String(r), u(W_ / 2), u(23));
    cv.tex.needsUpdate = true; Bk.mat.emissiveIntensity = st === 'on' ? 0.4 : 0;
    if (Bk.fkey !== theme + st) { Bk.fkey = theme + st; const fv = Bk.fr, P = fv.P, fx = fv.x; fx.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; fx.fillRect(0, 0, fv.c.width, fv.c.height);
      fx.textBaseline = 'middle'; fx.textAlign = 'center'; fx.fillStyle = st === 'bad' ? BAD() : INK(); fitFont(fx, v => v * P, `catalogo-${r}`, 8.6, RPW - 8); fx.fillText(`catalogo-${r}`, fv.c.width / 2, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
  }
  function drawCard(Bk, c, K) {
    const big = K.reps ? pair(K.reps) : 'as 10', l2 = String(K.tag || '').split('\n')[1] || '';
    const st = c === 'mkt-01' ? (K.tone === 'bad' ? 'a requisição que trava' : 'o cliente barulhento') : l2 === big || l2.startsWith('grupo ') ? (K.reps && K.reps.length === 2 ? 'atendido' : '') : l2;
    const key = c + big + st + K.tone + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, K.tone === 'acc', K.tone === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
    x.textAlign = 'left'; x.fillStyle = K.tone === 'bad' ? BAD() : K.tone === 'acc' ? accC() : C.inkHi; x.font = `700 ${u(13)}px ${MONO3}`; x.fillText(c, u(7), u(12));
    x.textAlign = 'right'; x.fillStyle = C.inkHi; fitFont(x, u, big, 13, 80); x.fillText(big, u(W_ - 6), u(12));
    x.textAlign = 'left'; x.fillStyle = INK(); x.font = `700 ${u(8.2)}px ${MONO3}`; x.fillText(K.reps ? (K.reps.length === 2 && sc === 'shuffle' && step === 1 ? 'grupo fixo' : `${K.reps.length} réplicas do catalogo`) : 'usa qualquer réplica', u(7), u(29));
    x.fillStyle = K.tone === 'bad' ? BAD() : K.tone === 'acc' ? accC() : INK(); fitFont(x, u, st, 10.5, W_ - 14); x.fillText(st, u(7), u(49));
    cv.tex.needsUpdate = true; Bk.mat.emissiveIntensity = K.tone === 'acc' ? 0.35 : 0;
    if (Bk.fkey !== theme + K.tone) { Bk.fkey = theme + K.tone; const fv = Bk.fr, P = fv.P, fx = fv.x; fx.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; fx.fillRect(0, 0, fv.c.width, fv.c.height);
      fx.textBaseline = 'middle'; fx.textAlign = 'left'; fx.fillStyle = K.tone === 'bad' ? BAD() : C.inkHi; fx.font = `700 ${8.6 * P}px ${MONO3}`; fx.fillText('CLIENTE ' + c.toUpperCase(), 3 * P, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
  }
  // o anel: arcos de cada shard, pontos marcados, o caminho no sentido horário
  function drawRing(R) {
    const key = JSON.stringify(R, (k, v) => typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v) + theme; if (!once('ring', key)) return;
    const cv = ringCv, { x, P } = cv, u = v => v * P, light = theme === 'light', C = pal3(), c0 = u(R2 + 8), r1 = u(R1 + 1.5), r2 = u(R2 - 1.5);
    x.clearRect(0, 0, cv.c.width, cv.c.height);
    const ang = a => a * TAU - Math.PI / 2;
    const arc = (a0, a1, col, ra = r1, rb = r2) => { x.beginPath(); x.arc(c0, c0, rb, ang(a0), ang(a1)); x.arc(c0, c0, ra, ang(a1), ang(a0), true); x.closePath(); x.fillStyle = col; x.fill(); };
    const tick = (a, ra, rb, col, w) => { const s = Math.sin(a * TAU), c = -Math.cos(a * TAU); x.beginPath(); x.moveTo(c0 + ra * s, c0 + ra * c); x.lineTo(c0 + rb * s, c0 + rb * c); x.strokeStyle = col; x.lineWidth = w; x.stroke(); };
    arc(0, 1, R.bad ? (light ? '#f0d6d2' : '#2a1210') : C.recess);
    x.globalAlpha = R.dim ? 0.35 : 1;
    const paint = (pts, alpha = 1) => { for (let i = 0; i < pts.length; i++) { const p = pts[i], q = i ? pts[i - 1].a : pts[pts.length - 1].a - 1;
      x.globalAlpha = (R.dim ? 0.35 : 1) * alpha * (R.focus != null && p.s !== R.focus ? 0.5 : 1); arc(q, p.a, shFill(p.s)); } };
    if (R.kind === 'vn') { const all = ring(R.N, R.V), pts = all.filter(p => p.s !== R.rm); paint(pts);
      if (R.rm != null && R.rmf < 1) paint(all, 1 - R.rmf); }
    else if (R.kind === 'lab') { if (R.from && R.f < 1) { paint(R.from); paint(R.pts.slice().sort((a, b) => a.a - b.a), R.f); } else paint(R.pts.slice().sort((a, b) => a.a - b.a)); }
    else if (R.kind === 'slots') {   // uma faixa por shard (slot mod 3: cada um tem slots pela volta toda); os movidos tomam a largura toda
      const lane = k => [r1 + (r2 - r1) * k / 3, r1 + (r2 - r1) * (k + 1) / 3];
      for (let k = 0; k < 3; k++) { const [ra, rb] = lane(k); arc(0, 1, shFill(k), ra + u(0.6), rb - u(0.6)); }
      for (let s = 0; s < 1024; s += 64) tick(s / 1024, r1, r2, C.recess, u(0.5));
      if (R.moved) arc(768 / 1024, (768 + R.moved) / 1024, shFill(3)); }
    else if (R.kind === 'groups') { for (let g = 0; g < 5; g++) { x.globalAlpha = 1; arc(g / 5 - 0.05 + 0.004, g / 5 + 0.15 - 0.004, g === R.bad ? (light ? '#ecc3bd' : '#4a1a14') : (light ? '#d5d7d8' : '#24272a')); } }
    x.globalAlpha = 1;
    // pontos marcados (poucos): traço radial que passa da borda
    (R.mark || []).forEach(p => { if (R.mark.length > 40) return; tick(p.a, r1 - u(4), r2 + u(5), light ? '#202427' : '#e6e8e9', u(1.6)); tick(p.a, r1 - u(4), r2 + u(5), shFill(p.s), u(0.8)); });
    // quartos do espaço de hash
    [0, 0.25, 0.5, 0.75].forEach(a => tick(a, r2 + u(1), r2 + u(6), C.line, u(0.8)));
    // caminho no sentido horário, do pino da chave até o dono
    (R.walks || []).forEach(w => { if (!(w.f > 0)) return; x.beginPath(); x.arc(c0, c0, u(RM), ang(w.a0), ang(w.a0 + (w.a1 - w.a0) * w.f)); x.strokeStyle = accC(); x.lineWidth = u(5); x.lineCap = 'round'; x.stroke();
      x.strokeStyle = light ? '#f6f6f5' : '#141516'; x.lineWidth = u(1.4); x.stroke(); });
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const D = o.disp, key = JSON.stringify(D) + sc + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P, u = v => v * P, C = pal3();
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const tcol = tn => /^s[0-4]$/.test(tn) ? shInk(+tn[1]) : toneC(tn === '' ? 'hi' : tn);
    x.fillStyle = INK(); fitFont(x, u, D.head, 8.6, 280); x.fillText(D.head, u(8), u(11));
    const n = D.lines.length, fs = n > 5 ? 10 : 11.2, lh = n > 5 ? 17.5 : 21;
    D.lines.forEach((l, i) => { x.fillStyle = tcol(l[1] || ''); fitFont(x, u, l[0], fs, 282); x.fillText(l[0], u(8), u(32 + i * lh)); });
    const L0 = 302; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(136)); x.stroke();
    D.big.slice(0, 3).forEach((b, i) => { const Y = 12 + i * (D.big.length > 2 ? 45 : 60); x.fillStyle = INK(); x.font = `700 ${u(8)}px ${MONO3}`; x.fillText(b[0], u(L0), u(Y));
      x.fillStyle = tcol(b[2] || ''); fitFont(x, u, b[1], 18, 88); x.fillText(b[1], u(L0), u(Y + 19)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">As porcentagens são das 100.000 chaves de teste c-0 … c-99999 (murmur3, posições shard-S#i). Linha de 2 KB e cópia a 50 MB/s são os números de exemplo do módulo.</li>';
  const ringTable = () => `<table class="h3-sum"><tr><th>pontos</th><th>3 shards (%)</th><th>máx ÷ média</th><th>3 → 4</th></tr>${VS.map(V => `<tr${sc === 'vnodes' && L()[step].V === V ? ' class="on"' : ''}><td>${V}</td><td>${DIST[V].k3.map(f1).join(' / ')}</td><td>${DIST[V].r}</td><td>${DIST[V].mv}%</td></tr>`).join('')}</table>`;
  const DATA = {
    anel: () => `<table class="h3-sum"><tr><th>cliente</th><th>murmur3</th><th>posição</th><th>anel 200</th></tr>${CL.map(c => `<tr><td>${c}</td><td>${hex(HC[c])}</td><td>${deg(HC[c] / 2 ** 32)}</td><td>shard-${ownerOf(ring(3, 200), HC[c]).s}</td></tr>`).join('')}</table>
      <li>Posição = hash ÷ 2³² × 360°; o dono é o <b>primeiro ponto no sentido horário</b> (o primeiro hash ≥ o da chave; se passar do fim, volta ao começo).</li><li>Fatia do anel com 200 pontos: <b>35,16 / 32,43 / 32,42%</b>; chaves: <b>35,5 / 32,2 / 32,3%</b>.</li><li>Com 3 pontos por shard (o do lab), a lena-77 cairia no <b>shard-1</b>.</li>${EX}`,
    reshard: () => `<table class="h3-sum"><tr><th>3 → 4 shards</th><th>mudam</th><th>para copiar</th></tr><tr><td>mod 4</td><td>75,2%</td><td>37,5 M · 75 GB · 25 min</td></tr><tr class="on"><td>anel, 200 pontos</td><td>25,7%</td><td>12,5 M · 25 GB · 8 min 20 s</td></tr><tr><td>slots (1.024)</td><td>25%</td><td>12,5 M · 25 GB · 8 min 20 s</td></tr></table>
      <li>Com mod 4, 4 de 5 clientes mudam (só o davi-12 fica); no anel, só <b>caio-58</b> e <b>davi-12</b>, os dois para o shard-3.</li><li>De N para N + 1, o mod muda <b>N ÷ (N + 1)</b>; o ideal é <b>1 ÷ (N + 1)</b>.</li><li>12,5 M é o ideal de 1 em 4 linhas; 25 GB ÷ 50 MB/s = 500 s.</li>${EX}`,
    vnodes: () => `${ringTable()}<li>Tirando o shard maior (3 shards): <b>1 ponto</b> → o vizinho fica com <b>91,2%</b>; <b>3</b> → 74,4%; <b>200</b> → 53,1% e 46,9%.</li><li>Com 4 shards e 200 pontos: 26,1 / 23,6 / 24,7 / 25,7% (máx ÷ média 1,05).</li>${EX}`,
    slots: () => `<table class="h3-sum"><tr><th>cliente</th><th>slot</th><th>3 shards</th><th>4 shards</th></tr>${CL.map(c => { const s = HC[c] % 1024; return `<tr${s >= 768 ? ' class="on"' : ''}><td>${c}</td><td>${s}</td><td>shard-${s % 3}</td><td>shard-${s >= 768 ? 3 : s % 3}</td></tr>`; }).join('')}</table>
      <li>slot = murmur3 mod 1.024; mapa inicial slot mod 3: <b>342 / 341 / 341</b>. Para 4 shards, o shard-3 recebe <b>86 + 85 + 85 = 256</b> slots (≥ 768, 769, 770).</li><li>Diretório: 1,5 M clientes × ~100 B = <b>150 MB</b>, 1 ms por consulta. Mover o mkt-01: 20 M linhas, <b>40 GB</b>, <b>13 min 20 s</b>.</li><li>Redis Cluster: 16.384 slots, CRC16(chave) mod 16384, respostas -MOVED e -ASK.</li>${EX}`,
    shuffle: () => `<table class="h3-sum"><tr><th>cliente</th><th>grupo fixo</th><th>2 em 10</th><th>4 em 10</th></tr>${CL.map(c => `<tr${c === 'mkt-01' ? ' class="on"' : ''}><td>${c}</td><td>${pair(GRP(c))}</td><td>${pair(PAIR[c])}</td><td>${pair(QUAD[c])}</td></tr>`).join('')}</table>
      <li>10.000 clientes: grupos fixos derrubam <b>2.007 (20%)</b>; 2 em 10: <b>240 (2,4%)</b> com o mesmo par, <b>3.868 (38,7%)</b> com uma em comum; 4 em 10: <b>50 (0,5%)</b> e <b>93,2%</b>.</li><li>Route 53: 2.048 servidores, 4 por domínio: C(2048, 4) = <b>730.862.190.080</b>.</li><li>O post da AWS conta 56 e 1/1.680 (com ordem); sem ordem, 28 e 70.</li>`,
    lab: () => `<table class="h3-sum"><tr><th>programa</th><th>saída conferida</th></tr><tr><td>hashing/</td><td>2 / 4 / 4 · com 4 shards, 7 de 10 mudam</td></tr><tr><td>hashing-distrib/</td><td>41 entradas (38 únicas), 5 funções</td></tr><tr><td>murmur/</td><td>7 / 8 / 9 / 8 / 7 (39)</td></tr><tr><td>consistent-hashing-remove/</td><td>0 / 4 / 3 / 3 · −Shard-02: 3 de 10 · +Shard-04: 1 de 10</td></tr></table>
      <li>Os três primeiros rodam com go run main.go, sem go.mod; o murmur/ tem go.mod (go 1.22.4) e baixa spaolacci/murmur3 v1.1.0.</li><li>As saídas foram reproduzidas em Python (SHA-256, MD5, FNV-1a, murmur3, anel) e batem linha por linha com o artigo; posições do anel em graus = hash ÷ 2⁶⁴ × 360°.</li>`,
  };
  const subHtml = () => {
    if (sc === 'vnodes') return `<div class="o3-mode c3-pol" role="group" aria-label="Pontos por shard">${VS.map((V, i) => `<button data-vn="${i}" aria-pressed="${step === i}">${V}</button>`).join('')}</div>`;
    if (sc === 'shuffle' && (L()[step].id === 'trava' || L()[step].id === 'quatro')) return `<div class="o3-mode c3-pol" role="group" aria-label="Retry do cliente">${[[1, 'Com retry'], [0, 'Sem retry']].map(([v, s]) => `<button data-rt="${v}" aria-pressed="${!!v === retry}" title="tecla N troca">${s}</button>`).join('')}</div>`;
    return ''; };
  const countHtml = () => (SP || spec()).count;
  const sqlHtml = () => '<b>Conta</b>' + (SP || spec()).disp.lines.map(l => l[0]).join('\n').replace(/</g, '&lt;');
  function panelHtml() {
    const s = L()[step];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${subHtml()}
      <h2>${s.title}</h2>
      <div class="i3-count" id="a3count">${countHtml()}</div>
      <div class="i3-sql">${sqlHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'anel') return; const s = L()[step];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${s.id}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'anel' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-anel3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const setRetry = v => { retry = v; lt = 0; render(); SFX.bit(v ? 1 : 0); return true; };
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'anel') return; const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const v = e.target.closest('[data-vn]'); if (v) return go(+v.dataset.vn);
    const r = e.target.closest('[data-rt]'); if (r) setRetry(r.dataset.rt === '1'); });
  backLink();

  // ── um quadro da cena ──
  const ease3 = (obj, want, dur = 0.9) => { if (!obj.pos) { obj.pos = want.slice(); obj.to = want; obj.from = want; }
    if (want.some((v, i) => v !== obj.to[i])) { obj.from = obj.pos.slice(); obj.to = want; obj.t0 = clk; }
    const f = ease(clamp((clk - obj.t0) / dur)); obj.pos = lerp3(obj.from, obj.to, f); return f; };
  const col3 = s => new THREE.Color(shFill(s));
  function scene3() {
    const o = SP = spec();
    drawRing(o.ring);
    // shards
    SB.forEach((Bk, i) => { const b = o.blocks[i]; Bk.g.visible = !!b; if (!b) { Bk.pos = null; return; }
      ease3(Bk, [SBP[i][0], SBP[i][1], PL]); Bk.g.position.copy(W(...Bk.pos)); drawShard(Bk, b); });
    // roteador no meio do anel
    ROUT.g.visible = !!o.router && !o.center; if (ROUT.g.visible) { ROUT.g.position.copy(W(RC[0] - 62, RC[1] - 36, PL)); drawRows(ROUT, o.router, false); }
    // réplicas do catalogo na roda
    REP.forEach((Bk, i) => { const r = o.reps && o.reps[i]; Bk.g.visible = !!r; if (!r) return; const [cx, cy] = repAt(i + 1);
      Bk.g.position.copy(W(cx - RPW / 2, cy - RPD / 2, RZ)); drawRep(Bk, i + 1, r.st); });
    // clientes
    CL.forEach((c, k) => { const K = o.keys[c], Pn = PIN[c], T_ = CTAG[c], Cd = CARD[k]; Cd.g.visible = !!K && o.center;
      if (Cd.g.visible) { Cd.g.position.copy(W(CBP[k][0], CBP[k][1], PL)); drawCard(Cd, c, K); }
      if (!K || o.center) { Pn.g.visible = false; Pn.pos = null; T_.hide(); moveGlow(Pn.glow, [0, 0, 0], 0); return; }
      const p = at(K.a, o.ring.kind === 'slots' ? laneR(K.own) : RM), z = RZ, lift = K.drop != null ? (1 - ease(K.drop)) * 70 : 0;
      ease3(Pn, [p[0], p[1], z]); Pn.g.visible = true; Pn.g.position.copy(W(Pn.pos[0], Pn.pos[1], Pn.pos[2] + lift));
      const col = K.tone === 'bad' ? new THREE.Color(BAD()) : K.own >= 0 ? col3(K.own) : K.tone === 'acc' ? accent.clone() : new THREE.Color(pal3().line);
      Pn.mat.color.copy(col);
      moveGlow(Pn.glow, [Pn.pos[0], Pn.pos[1], Pn.pos[2] + lift + Pn.ht + 3], K.tone === 'acc' || K.tone === 'bad' ? 0.8 : 0);
      if (!K.tag) return T_.hide();
      const tone = K.tone === 'bad' ? 'bad' : K.tone === 'acc' ? 'acc' : K.own >= 0 ? 's' + K.own : 'hi';
      const [d, zz] = (o.ring.kind === 'slots' ? TOFFS : TOFF)[c], q = at(K.a, R2 + d); T_.set(K.tag, tone).at(q[0], q[1], zz + lift); });
    // tenants do lab
    TPIN.forEach((Pn, i) => { const q = o.ten && o.ten[i]; if (!q) { Pn.g.visible = false; Pn.pos = null; moveGlow(Pn.glow, [0, 0, 0], 0); return; }
      const p = at(q.a, RM); Pn.g.visible = true; Pn.g.position.copy(W(p[0], p[1], RZ));
      Pn.mat.color.copy(q.tone === 'bad' ? new THREE.Color(BAD()) : q.own >= 0 ? col3(q.own) : new THREE.Color(pal3().line));
      moveGlow(Pn.glow, [p[0], p[1], RZ + Pn.ht + 3], q.tone === 'acc' ? 0.7 : 0);
      if (q.tag) { o.tags.push([...at(q.a, R2 + 30), 10 + (i % 2) * 26, q.tag, q.tone === 'acc' ? 'acc' : 'hi']); } });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, Math.min(m[1], 0.8));   // para antes do fim: duas mensagens para o mesmo shard não se cobrem
      t.set(m[2], m[3]).at(p[0], p[1], 64); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > L()[step].dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('a3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.querySelector('#info .i3-sql'), sh = sqlHtml(); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 612, -10, 480];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.92 : nar ? 0.98 : 0.97 - side, aH = POSTER ? 0.72 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.04 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.04 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.49 : side + aW / 2, fy = POSTER ? 0.44 : nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), P = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(P, k);
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, L()[step].dur + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if ((e.key === 'n' || e.key === 'N') && sc === 'shuffle') return setRetry(!retry);
    if (/^[1-6]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...SB.flatMap(b => [b.top, b.fr]), ROUT.top, ROUT.fr, ...REP.flatMap(b => [b.top, b.fr]), ...CARD.flatMap(b => [b.top, b.fr]), scr, ringCv];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; [...SB, ROUT, ...REP, ...CARD].forEach(b => { b.key = ''; b.fkey = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(306, 236, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 236, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–6 · retry: N · arraste para girar' };
})() });
