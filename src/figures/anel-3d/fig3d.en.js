// Figura 3D (iso-glow): o anel de hashing consistente, os slots e as réplicas embaralhadas (módulo 16, aulas 7 a 10).
// Cena: à esquerda, o anel deitado (o espaço de 32 bits do murmur3, 0 no alto, crescendo no sentido horário); cada
// shard pinta os arcos que terminam nos seus pontos virtuais, e os clientes são pinos no anel. No meio do anel, o
// roteador. À direita, os 4 shards (pg-pedidos-0..3) com a parte de cada um e quem mora lá; ao fundo, o mostrador com
// a conta do passo. No cenário Shuffle o anel vira a roda das 10 réplicas do catalogo; no Lab, o anel do programa do autor.
// Cenários (botões e ?mode=anel|reshard|vnodes|slots|shuffle|lab; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/sharding-brief.md). O murmur3 é calculado aqui (vetores conferidos);
// as porcentagens das 100 mil chaves (c-0 … c-99999) e o anel SHA-256 do lab foram rodados à parte e batem com o brief.
FIGS3D.push({ id: 'anel', name: 'Ring', mod: (() => {
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
  const nf = n => Math.round(n).toLocaleString('en-US');
  const f1 = v => v.toFixed(1);
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
  const DIST = { 1: { k3: [70.2, 8.8, 21.0], r: '2.11', k4: [47.0, 8.8, 21.0, 23.2], mv: '23.2' }, 3: { k3: [59.0, 17.7, 23.3], r: '1.77', k4: [36.0, 8.5, 23.3, 32.1], mv: '32.1' },
    10: { k3: [37.1, 30.8, 32.1], r: '1.11', k4: [34.6, 20.7, 29.5, 15.2], mv: '15.2' }, 100: { k3: [28.3, 39.2, 32.5], r: '1.18', k4: [21.8, 30.3, 23.7, 24.2], mv: '24.2' },
    200: { k3: [35.5, 32.2, 32.3], r: '1.07', k4: [26.1, 23.6, 24.7, 25.7], mv: '25.7' } };
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
  const IDEN = { circulo: 'circle', um: 'one point', duzentos: '200 points', todos: 'all customers', erro: 'what if it goes wrong', antes: 'before', entra: 'joins', quem: 'who moves', conta: 'math', domino: 'domino', chaves: 'customers', move: 'move', bia: 'bia-31', diretorio: 'directory', todas: 'no isolation', grupos: 'fixed groups', pares: 'pairs', trava: 'hang', quatro: '4 replicas', semretry: 'no retry', hashing: 'hashing', distrib: 'distrib', murmur: 'murmur', anel3: 'ring of 3', remove: 'remove', add: 'add', vazio: 'empty ring' };
  const SCNAME = { anel: 'Ring', reshard: 'Reshard', vnodes: 'Virtual nodes', slots: 'Slots', shuffle: 'Shuffle', lab: 'Lab' };
  const SCFULL = { anel: 'The consistent hashing ring', reshard: 'Shard-3 joins', vnodes: '1, 3, 10, 100 and 200 points', slots: '1,024 slots and the directory',
    shuffle: 'Shuffle sharding of 2 in 10', lab: 'The author\'s 4 programs' };
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
  const ROUT = block(124, 72, 22, 'ROUTER', 'murmur3 → ring');
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
      if (i >= N) { o.blocks[i] = { name: `shard-${i}`, big: '', sub: 'does not exist yet', lines: [], col: i, tone: 'dim' }; continue; }
      const live = CL.filter(c => o.keys[c] && o.keys[c].own === i);
      o.blocks[i] = { name: `shard-${i}`, big: pcts ? f1(pcts[i]) + '%' : '', bar: pcts ? pcts[i] / 100 : null, sub, col: i, tone: '',
        lines: live.length ? live.map(c => [c, o.keys[c].tone || '']) : [['none of the 5', 'dim']] };
    }
  }
  const showLines = (o, head, lines, big = []) => { o.disp = { head, lines: lines.map(l => Array.isArray(l) ? l : [l, '']), big }; };
  const tagKeys = (o, fmt) => CL.forEach(c => { const k = o.keys[c]; if (k) k.tag = fmt(c, k); });
  const CNT = (big, small = '', rest = '') => `<b>${big}</b><span>${small}</span>${rest ? `<i>· ${rest}</i>` : ''}`;
  const pair = a => `{${a.join(', ')}}`;

  const STEPS = {
    anel: [
      { id: 'circulo', dur: 4.5, title: 'The hash becomes a circle',
        story: 'The 32-bit murmur3 gives a number from 0 to 4,294,967,295. Bend that interval into a circle, with the end glued to the start: 0 sits at the top and the numbers grow clockwise. The key lena-77 gives 0x8fd9d9d8, which is 2,413,418,968, and lands 56.2% of the way around, at 202.3°.',
        look: 'The ring is dark: there is no shard yet. The lena-77 pin drops at the 202.3° point, a little past halfway around.',
        key: 'On the ring, the key becomes a position on a circle, not a division remainder.',
        f(o, t) { o.ring = { kind: 'plain', quarters: true, walks: [], mark: [] };
          o.keys['lena-77'] = { a: HC['lena-77'] / 2 ** 32, own: -1, tone: 'acc', drop: clamp((t - 0.5) / 0.9), tag: 'lena-77\n202.3°' };
          o.router = ['ROUTER', ["murmur3('lena-77')", 10.5, 'acc'], ['= 2,413,418,968', 9.5]];
          [[0, '0 · 4,294,967,295'], [0.25, '1,073,741,824'], [0.5, '2,147,483,648'], [0.75, '3,221,225,472']].forEach(([a, s]) => ptTag(o, a, s, 'dim', R2 + 16, 4));
          shardBlocks(o, 3, null, 'no points on the ring'); o.blocks.forEach(b => { if (b) { b.lines = [['no point yet', 'dim']]; b.tone = 'dim'; } });
          showLines(o, 'MATH · POSITION ON THE RING', ["murmur3('lena-77')", '= 0x8fd9d9d8', '= 2,413,418,968', '÷ 4,294,967,296 = 0.5619', '× 360° = 202.3°'],
            [['POSITION', '202.3°', 'acc'], ['RING', '0 … 2³² − 1', '']]);
          o.count = CNT('202.3°', 'lena-77\'s position', '0x8fd9d9d8'); } },
      { id: 'um', dur: 5, title: 'One point per shard: walk clockwise',
        story: 'Each shard enters the ring by the hash of its own name. With 1 point per shard, shard-0 sits at 176.3°, shard-2 at 251.6° and shard-1 at 283.0°. To find lena-77\'s owner, the router walks clockwise from 202.3° to the first point: 251.6°, shard-2. But the slices come out lopsided: shard-0 gets 70.2% of the keys.',
        look: 'The light walks along the ring, from lena-77 to shard-2\'s point. Each color is a shard\'s slice: the arc that ends at its point.',
        key: 'A key\'s owner is the first point going clockwise.',
        f(o, t) { onRing(o, 3, 1, { only: ['lena-77'] }); const k = o.keys['lena-77'], f = clamp((t - 0.6) / 1.6);
          o.ring.walks.push({ a0: k.a, a1: k.pt.a + (k.pt.a < k.a ? 1 : 0), f: ease(f) }); o.ring.mark = ring(3, 1);
          k.tone = 'acc'; k.tag = f >= 1 ? 'lena-77\n→ shard-2' : 'lena-77\n202.3°'; if (f < 1) k.own = -1;
          ring(3, 1).forEach(p => ptTag(o, p.a, `shard-${p.s}\n${deg(p.a)}`, 's' + p.s, R2 + 18, p.s === 2 ? 30 : 6));
          shardBlocks(o, 3, DIST[1].k3, 'of the 100,000 keys');
          o.router = ['ROUTER', ['202.3° → clockwise', 10, 'acc'], ['1st point: 251.6°', 9.5]];
          showLines(o, 'MATH · 1 POINT PER SHARD', ["murmur3('shard-0#0') → 176.3°", "murmur3('shard-2#0') → 251.6°", "murmur3('shard-1#0') → 283.0°", 'lena-77 at 202.3°: walks to 251.6°', ['→ shard-2', 'acc']],
            [['SHARD', 'shard-2', 's2'], ['MAX ÷ MEAN', '2.11', 'bad']]);
          o.count = CNT('70.2%', 'of the keys on shard-0', '8.8 / 21.0 on the others'); } },
      { id: 'duzentos', dur: 5, title: '200 points per shard: lena-77 lands on shard-0',
        story: 'The way out is virtual nodes: each shard appears 200 times, at the hash of shard-0#0, shard-0#1 and so on. That makes 600 points, and the slices mix all around the circle. lena-77 stays at 202.3°; the first point after her is now shard-0#119, half a degree ahead. The 100,000 keys end up with 35.5% / 32.2% / 32.3%.',
        look: 'The ring turned into thin stripes of the three colors. The light only walks a little bit, from lena-77 to the shard-0#119 point.',
        key: 'With 200 points per shard, each one gets close to a third of the ring.',
        f(o, t) { onRing(o, 3, 200, { only: ['lena-77'] }); const k = o.keys['lena-77'], f = clamp((t - 0.6) / 1.2);
          o.ring.walks.push({ a0: k.a, a1: k.pt.a, f: ease(f) }); o.ring.mark = [k.pt]; k.tone = 'acc'; k.tag = f >= 1 ? 'lena-77\n→ shard-0' : 'lena-77\n202.3°';
          if (t > 1.8) ptTag(o, k.pt.a, 'shard-0#119\n202.8°', 's0', R1 - 34, 8);
          shardBlocks(o, 3, DIST[200].k3, 'of the 100,000 keys');
          o.router = ['ROUTER', ['600 sorted points', 9.5], ['1st ≥ 2,413,418,968', 9.5, 'acc']];
          showLines(o, 'MATH · 3 SHARDS × 200 POINTS', ['lena-77 = 2,413,418,968 (202.3°)', "1st point after: 'shard-0#119'", '= 2,419,488,419 (202.8°)', ['→ shard-0', 'acc'], 'ring slice: 35.16 / 32.43 / 32.42%'],
            [['SHARD', 'shard-0', 's0'], ['MAX ÷ MEAN', '1.07', 'acc']]);
          o.count = CNT('1.07', 'max ÷ mean', '35.5 / 32.2 / 32.3% of the keys'); } },
      { id: 'todos', dur: 4.5, title: 'Where each customer lands',
        story: 'The other four do the same math. bia-31 lands at 26.4° and the first point is shard-2\'s; caio-58, at 197.5°, goes to shard-0; davi-12, at 9.7°, and mkt-01, at 223.2°, go to shard-2. In the sample, shard-1 ended up with nobody: there are only 5 keys. These shard numbers are not the mod 3 ones from lesson 6; the ring is another spreading function.',
        look: 'The five pins are on the ring, each with the color of the shard that receives it. On the right, each shard lists who lives on it.',
        key: 'Same ring, same answer: any router finds the same owner.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => `${c}\n→ shard-${k.own}`); o.ring.mark = CL.map(c => o.keys[c].pt);
          shardBlocks(o, 3, DIST[200].k3, 'of the 100,000 keys');
          o.router = ['ROUTER', ['5 customers', 10], ['3 shards × 200 points', 9]];
          showLines(o, 'MATH · THE 5 CUSTOMERS ON THE RING', CL.map(c => { const k = o.keys[c]; return `${c.padEnd(7)} ${deg(k.a).padStart(6)} → shard-${k.pt.s}#${k.pt.i}`; }),
            [['SHARD-0', 'lena, caio', 's0'], ['SHARD-2', 'bia, davi, mkt', 's2']]);
          o.count = CNT('2 / 0 / 3', 'sample customers per shard', 'mod 3 gave 1 / 2 / 2'); } },
      { id: 'erro', dur: 7, title: 'What if it goes wrong: two routers, two rings',
        story: 'The ring keeps no state, but every router has to build the same ring. In a deploy, the new version comes up with 3 points per shard, as in the author\'s lab; the old one keeps 200. On Black Friday, Lena places order 1054: the new version computes shard-1 and writes there. Later, the "my orders" page goes through the old version, which looks on shard-0 and does not find 1054.',
        look: 'The INSERT of 1054 leaves the router for shard-1; Lena\'s SELECT goes to shard-0 and comes back red, without the order.',
        key: 'A stateless ring only works if all routers use the same points.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => c); const L = o.keys['lena-77']; L.tone = 'acc'; L.tag = 'lena-77\nv1: shard-0 · v2: shard-1';
          shardBlocks(o, 3, DIST[200].k3, 'of the 100,000 keys'); o.ring.mark = [L.pt];
          o.router = ['ROUTER v1 and v2', ['v1: 200 points → shard-0', 9], ['v2: 3 points → shard-1', 9, 'bad']];
          if (send(o, t, 0.4, 1.6, r2s(1), 'INSERT 1054 (v2)', 'acc', 0.4)) { o.blocks[1].lines = [['1054 · lena-77', 'bad'], ['64.00 · Recife', 'dim']]; o.blocks[1].tone = 'bad'; }
          send(o, t, 2.6, 3.6, r2s(0), 'SELECT lena-77 (v1)', 'hi', 0.1);
          if (send(o, t, 3.8, 4.8, rev(r2s(0)), '0 rows: no 1054', 'bad', 1.2)) { o.blocks[0].tone = 'bad'; o.blocks[0].lines = [['lena-77: 5 orders', 'bad'], ['1054 is not here', 'bad']]; }
          showLines(o, 'MATH · THE SAME CUSTOMER ON TWO RINGS', ['v1: 3 × 200 points → shard-0#119', ['v2: 3 × 3 points  → shard-1', 'bad'], 'INSERT 1054 via v2 → shard-1', 'SELECT lena-77 via v1 → shard-0', ['→ 0 rows with 1054', 'bad']],
            [['V1', 'shard-0', 's0'], ['V2', 'shard-1', 's1'], ['MY ORDERS', 'without 1054', 'bad']]);
          o.count = CNT('2 rings', 'for the same lena-77', 'v1 → shard-0 · v2 → shard-1'); } },
    ],
    reshard: [
      { id: 'antes', dur: 4, title: 'Before: 3 shards, 200 points each',
        story: 'The store has 3 shards on the ring, with 200 points each. lena-77 and caio-58 are on shard-0; bia-31, davi-12 and mkt-01 on shard-2. The pedidos table has 50 million rows and is about to get a fourth server, shard-3. With the mod from lesson 6, that change would move 75.2% of the rows.',
        look: 'The ring in three colors and the five pins with each one\'s shard color. The shard-3 slot, on the right, is still empty.',
        key: 'The starting point: 3 shards, 600 points, 5 customers.',
        f(o, t) { onRing(o, 3, 200); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); shardBlocks(o, 3, DIST[200].k3, 'of the 100,000 keys', { ghost: true });
          o.router = ['ROUTER', ['3 shards × 200 points', 9.5], ['600 points on the ring', 9.5]];
          showLines(o, 'BEFORE · 3 SHARDS', ['3 shards × 200 points = 600', 'ring slice: 35.16 / 32.43 / 32.42%', 'keys: 35.5 / 32.2 / 32.3%', 'shard-0: lena-77, caio-58', 'shard-2: bia-31, davi-12, mkt-01'],
            [['SHARDS', '3', ''], ['POINTS', '600', '']]);
          o.count = CNT('3 shards', '600 points', '50 million rows'); } },
      { id: 'entra', dur: 5, title: 'Shard-3 joins with 200 points',
        story: 'Shard-3 joins with its 200 points, the hash of shard-3#0 through shard-3#199. They land spread all around the circle, between the other shards\' points. Each new point steals the little piece of arc right before it, and the rest of the ring does not change. The slices become 25.84 / 23.80 / 24.68 / 25.69%.',
        look: 'Yellow stripes appear all around the ring: the arcs that now end at a shard-3 point. The other colors stay where they were.',
        key: 'The new shard takes a little from each neighbor, and only it receives.',
        f(o, t) { const show = t > 0.6; onRing(o, show ? 4 : 3, 200, { focus: show ? 3 : null });
          CL.forEach(c => { const p = ownerOf(ring(3, 200), HC[c]); o.keys[c].own = p.s; o.keys[c].pt = p; }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`);
          shardBlocks(o, 3, SPACE3, 'ring slice', { ghost: true });
          if (show) { shardBlocks(o, 4, SPACE4, 'ring slice'); o.blocks[3].tone = 'on'; o.blocks[3].lines = [['200 new points', 'acc'], ['pg-pedidos-3', 'dim']]; }
          o.router = ['ROUTER', ['4 shards × 200 points', 9.5], ['800 points on the ring', 9.5, show ? 'acc' : '']];
          showLines(o, 'SHARD-3 JOINS', ["murmur3('shard-3#0' … 'shard-3#199')", '200 new points on the ring', 'slice before: 35.16 / 32.43 / 32.42%', ['slice after: 25.84 / 23.80 / 24.68 / 25.69%', 'acc'], 'no old point moves'],
            [['POINTS', show ? '800' : '600', show ? 'acc' : ''], ['SHARD-3', show ? '25.69%' : '—', 's3']]);
          o.count = CNT(show ? '25.69%' : '0%', 'of the ring to shard-3', 'the old points stay where they are'); } },
      { id: 'quem', dur: 5.5, title: 'Who moves: only caio-58 and davi-12, to the new shard',
        story: 'Now each customer redoes the math. caio-58, at 197.5°, used to reach shard-0#125, at 198.4°; on the way shard-3#8 showed up, at 197.8°, and he moves to shard-3. davi-12, at 9.7°, finds shard-3#188 before shard-2#192 and also goes to shard-3. lena-77, bia-31 and mkt-01 find the same point as before and stay.',
        look: 'The caio-58 and davi-12 pins turn yellow and leave shard-0 and shard-2 for shard-3. The other three do not change color.',
        key: 'On the ring, whoever moves goes to the new shard; nothing moves between old shards.',
        f(o, t) { onRing(o, 4, 200); const old = Object.fromEntries(CL.map(c => [c, ownerOf(ring(3, 200), HC[c])]));
          const mv = t > 1.4; CL.forEach(c => { const k = o.keys[c], moved = k.own !== old[c].s; if (moved) { k.tone = mv ? 'acc' : ''; if (!mv) { k.own = old[c].s; k.pt = old[c]; } } });
          tagKeys(o, (c, k) => old[c].s !== ownerOf(ring(4, 200), HC[c]).s ? `${c}\nshard-${old[c].s} → shard-3` : `${c}\nstays on shard-${k.own}`);
          ['caio-58', 'davi-12'].forEach(c => { const k = o.keys[c], f = clamp((t - 0.4) / 1.0); o.ring.walks.push({ a0: k.a, a1: ownerOf(ring(4, 200), HC[c]).a, f: ease(f) }); o.ring.mark.push(ownerOf(ring(4, 200), HC[c])); });
          shardBlocks(o, 4, DIST[200].k4, 'of the 100,000 keys');
          send(o, t, 1.6, 2.6, s2s(0, 3), 'caio-58', 'acc', 1.5); send(o, t, 2.0, 3.0, s2s(2, 3), 'davi-12', 'acc', 1.5);
          o.router = ['ROUTER', ['caio-58 → shard-3#8', 9.5, 'acc'], ['davi-12 → shard-3#188', 9.5, 'acc']];
          showLines(o, 'WHO MOVES · 3 → 4 SHARDS', ['caio-58 197.5°: was shard-0#125 (198.4°)', ['  now shard-3#8 (197.8°)', 'acc'], 'davi-12   9.7°: was shard-2#192 (12.1°)', ['  now shard-3#188 (10.3°)', 'acc'], 'lena-77, bia-31, mkt-01: stay'],
            [['MOVE', '2 of 5', 'acc'], ['TO', 'shard-3', 's3'], ['MOD 4', '4 of 5', 'bad']]);
          o.count = CNT('2 of 5', 'customers move, both to shard-3', 'with mod 4, 4 of 5'); } },
      { id: 'conta', dur: 6.5, title: '25.7% against 75.2%: what gets copied',
        story: 'On the 100,000 test keys, 25.7% change shard when shard-3 joins, close to the ideal of 25%, and all of them go to it. On the 50-million-row table, 1 in 4 is 12.5 million rows: 25 GB of copying, 8 min 20 s at 50 MB/s. The mod 4 from lesson 6 moved 75.2%: 37.5 million rows, 75 GB, 25 minutes, and most of it going from one old shard to another.',
        look: 'The three old shards send rows to shard-3 and the readout counts the GB and minutes up to 25 GB and 8 min 20 s.',
        key: 'Consistent hashing moves about 1 ÷ N; mod moves N ÷ (N + 1).',
        f(o, t) { onRing(o, 4, 200, { focus: 3 }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); ['caio-58', 'davi-12'].forEach(c => { o.keys[c].tone = 'acc'; });
          shardBlocks(o, 4, DIST[200].k4, 'of the 100,000 keys');
          const f = clamp((t - 0.5) / 4), gb = 25 * f, sec = gb * 1000 / 50;
          [0, 1, 2].forEach(i => o.beams.push({ pts: s2s(i, 3), on: f < 1, dot: f < 1 ? ((t * 0.7 + i * 0.33) % 1) : null }));
          o.blocks[3].tone = 'on'; o.blocks[3].lines = [['caio-58, davi-12', 'acc'], [`receiving ${f1(gb)} GB`, f < 1 ? 'acc' : 'dim']];
          showLines(o, 'HOW MUCH IS COPIED · 50 MB/s', [['ring: 25.7% of the keys move', 'acc'], '  all to shard-3', '50 M rows ÷ 4 = 12.5 M · 25 GB', ['mod 4: 75.2% move · 37.5 M rows', 'bad'], ['  75 GB · 25 min, between old shards', 'bad']],
            [['COPIED', f1(gb) + ' GB', 'acc'], ['TIME', mmss(sec), 'acc'], ['MOD 4', '75 GB · 25 min', 'bad']]);
          o.count = CNT(f1(gb) + ' GB', `copied · ${mmss(sec)}`, 'ring 25.7% × mod 4 75.2%'); } },
      { id: 'erro', dur: 6, title: 'What if it goes wrong: shard-3 with only 1 point',
        story: 'With 1 point per shard, shard-3 enters in one place only, at 7.1°. It takes the arc from 283.0° to 7.1°, which belonged entirely to shard-0, and nothing from the others. Shard-0 drops from 70.2% to 47.0% of the keys, shard-3 gets 23.2%, and shard-1 and shard-2 stay at 8.8% and 21.0%. The new server relieves a single neighbor, and shard-0 still carries almost half the load.',
        look: 'A single yellow arc, right after the top of the ring, comes out of shard-0\'s blue. The other slices do not change.',
        key: 'Few points: the new shard steals from a single neighbor.',
        f(o, t) { const show = t > 0.8; onRing(o, show ? 4 : 3, 1, { focus: show ? 3 : null }); tagKeys(o, () => null); o.ring.mark = ring(show ? 4 : 3, 1);
          ring(4, 1).forEach(p => { if (p.s < 3 || show) ptTag(o, p.a, `shard-${p.s}\n${deg(p.a)}`, 's' + p.s, R2 + 18, p.s === 3 ? 30 : 6); });
          shardBlocks(o, show ? 4 : 3, show ? DIST[1].k4 : DIST[1].k3, 'of the 100,000 keys', { ghost: true });
          if (show) { o.blocks[0].tone = 'bad'; o.blocks[0].big = '47.0%'; }
          o.router = ['ROUTER', ['1 point per shard', 9.5, 'bad'], ['shard-3 at 7.1°', 9.5]];
          showLines(o, 'WHAT IF IT GOES WRONG · 1 POINT PER SHARD', ["murmur3('shard-3#0') → 7.1°", 'takes the arc 283.0° → 7.1°', ['that was all shard-0\'s', 'bad'], 'shard-0: 70.2% → 47.0%', 'shard-1 8.8% and shard-2 21.0%: the same'],
            [['SHARD-0', show ? '47.0%' : '70.2%', 'bad'], ['SHARD-3', show ? '23.2%' : '—', 's3'], ['MAX ÷ MEAN', show ? '1.88' : '2.11', 'bad']]);
          o.count = CNT(show ? '47.0%' : '70.2%', 'on shard-0', 'of the 5 customers, none moves'); } },
    ],
    vnodes: VS.map(V => ({ id: 'v' + V, V, dur: 4 })).concat([{ id: 'domino', dur: 6.5 }]),
    slots: [
      { id: 'slots', dur: 4.5, title: '1,024 slots and a 1 KB map',
        story: 'In the second way of keeping the key, the hash lands on one of 1,024 fixed slots: murmur3 mod 1,024. A table says which shard each slot belongs to. The initial map is slot mod 3, and each shard gets 342, 341 and 341 slots. The whole map fits in 1 KB, and changing shard becomes changing rows of that table.',
        look: 'The ring is now the line of 1,024 slots, from 0 at the top to 1,023, in stripes of the three colors: slot 0 on shard-0, slot 1 on shard-1, slot 2 on shard-2 and so on.',
        key: 'Slots separate the hash from the shard: the hash picks the slot, the map picks the shard.',
        f(o, t) { o.ring = { kind: 'slots', moved: 0, walks: [], mark: [] };
          [[0, 'slot 0'], [0.25, 'slot 256'], [0.5, 'slot 512'], [0.75, 'slot 768']].forEach(([a, s]) => ptTag(o, a, s, 'dim', R2 + 16, 4));
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard-${i}`, big: ['342', '341', '341'][i], bar: [342, 341, 341][i] / 1024, sub: '1,024 slots', col: i, tone: '', lines: [[`slots ${i}, ${i + 3}, ${i + 6} …`, 'dim']] }; });
          o.router = ['ROUTER', ['hash mod 1,024', 10, 'acc'], ['→ slot → shard map', 9.5]];
          showLines(o, 'FIXED SLOTS', ['slot = murmur3(cliente_id) mod 1,024', 'initial map: shard = slot mod 3', '342 / 341 / 341 slots', 'the map fits in 1 KB', 'Redis Cluster: 16,384 slots, CRC16'],
            [['SLOTS', '1,024', ''], ['MAP', '1 KB', 'acc']]);
          o.count = CNT('1,024', 'slots', '342 / 341 / 341'); } },
      { id: 'chaves', dur: 4.5, title: 'Each customer lands on a slot',
        story: 'The router computes murmur3 mod 1,024 and reads the map. lena-77 lands on slot 472 (shard-1), bia-31 on 827 (shard-2), caio-58 on 749 (shard-2), davi-12 on 432 (shard-0) and mkt-01 on 597 (shard-0). Note that here the shard comes from slot mod 3, not from the ring: it is another map.',
        look: 'The five pins are on their slots, with the color of the owner the map says.',
        key: 'The customer\'s hash never changes; the table decides the shard.',
        f(o, t) { o.ring = { kind: 'slots', moved: 0, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024; o.keys[c] = { a: (s + 0.5) / 1024, own: s % 3, tone: '', slot: s, tag: `${c} · slot ${s}\n→ shard-${s % 3}` }; });
          [0, 1, 2].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: ['342', '341', '341'][i], bar: [342, 341, 341][i] / 1024, sub: '1,024 slots', col: i, tone: '', lines: live.map(c => [c, '']) }; });
          o.router = ['ROUTER', ['lena-77 → slot 472', 9.5, 'acc'], ['mapa[472] = shard-1', 9.5]];
          showLines(o, 'EACH CUSTOMER ON A SLOT', CL.map(c => `${c.padEnd(7)} slot ${String(HC[c] % 1024).padStart(3)} → shard-${HC[c] % 1024 % 3}`), [['LENA-77', 'slot 472', 's1'], ['MAP', 'slot mod 3', '']]);
          o.count = CNT('slot 472', 'lena-77 → shard-1', '0x8fd9d9d8 mod 1,024'); } },
      { id: 'move', dur: 6.5, title: 'Shard-3 joins: 256 slots change owner',
        story: 'To go to 4 shards, the store moves slots. Shard-3 receives the last 86 slots of shard-0, the last 85 of shard-1 and the last 85 of shard-2, in number order: slots 768 onward. That is 86 + 85 + 85 = 256 slots, exactly 25% of the total. On the 50-million-row table, that is 12.5 million, 25 GB, 8 min 20 s of copying at 50 MB/s.',
        look: 'The last quarter of the ring, from slot 768 to 1,023, turns yellow slot by slot. The readout counts the slots and the GB.',
        key: 'With slots, resharding is moving rows of the map: 256 of 1,024, exactly 25%.',
        f(o, t) { const f = clamp((t - 0.6) / 4), n = Math.round(256 * f); o.ring = { kind: 'slots', moved: n, walks: [], mark: [] };
          [[0, 'slot 0'], [0.25, 'slot 256'], [0.5, 'slot 512'], [0.75, 'slot 768']].forEach(([a, s]) => ptTag(o, a, s, a === 0.75 ? 's3' : 'dim', R2 + 16, 4));
          const cnt = [0, 1, 2].map(i => [342, 341, 341][i] - Array.from({ length: n }, (_, k) => 768 + k).filter(s => s % 3 === i).length);
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard-${i}`, big: String(cnt[i]), bar: cnt[i] / 1024, sub: '1,024 slots', col: i, tone: '', lines: [[`gives up ${[342, 341, 341][i] - cnt[i]} slots`, n ? 'acc' : 'dim']] }; });
          o.blocks[3] = { name: 'shard-3', big: String(n), bar: n / 1024, sub: '1,024 slots', col: 3, tone: 'on', lines: [['slots 768 … 1,023', 'acc']] };
          [0, 1, 2].forEach(i => o.beams.push({ pts: s2s(i, 3), on: f > 0 && f < 1, dot: f > 0 && f < 1 ? ((t * 0.7 + i * 0.33) % 1) : null }));
          const gb = 25 * f; o.router = ['ROUTER', ['map: 256 rows change', 9.5, 'acc'], ['the hash does not change', 9.5]];
          showLines(o, 'RESHARD WITH SLOTS · 50 MB/s', ['shard-3 ← 86 + 85 + 85 = 256 slots', 'shard-0 ≥ 768 · shard-1 ≥ 769 · shard-2 ≥ 770', '256 ÷ 1,024 = exactly 25%', '12.5 M rows · 25 GB · 8 min 20 s', 'new map: 4 columns, still 1 KB'],
            [['MOVED', `${n} slots`, 's3'], ['COPIED', f1(gb) + ' GB', 'acc'], ['TIME', mmss(gb * 20), 'acc']]);
          o.count = CNT(`${n} of 256`, 'slots moved', `${f1(gb)} GB · ${mmss(gb * 20)}`); } },
      { id: 'bia', dur: 5, title: 'Only bia-31 moves',
        story: 'Of the five customers, only bia-31 is in the last quarter: slot 827 used to be shard-2\'s and is now shard-3\'s. caio-58 barely stayed, at 749. lena-77 (472), davi-12 (432) and mkt-01 (597) are nowhere near. Nobody\'s hash changed: row 827 of the map did.',
        look: 'The bia-31 pin turns yellow and the light takes bia-31 from shard-2 to shard-3. The other pins keep their earlier color.',
        key: 'Moving slots only touches whoever lives on them.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own: own === 3 && t < 1.2 ? s % 3 : own, tone: own === 3 ? 'acc' : '', slot: s,
            tag: own === 3 ? `${c} · slot ${s}\nshard-2 → shard-3` : `${c} · slot ${s}\nstays on shard-${own}` }; });
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: '256', bar: 0.25, sub: '1,024 slots', col: i, tone: i === 3 ? 'on' : '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['none of the 5', 'dim']] }; });
          send(o, t, 1.2, 2.3, s2s(2, 3), 'bia-31', 'acc', 2);
          o.router = ['ROUTER', ['bia-31 → slot 827', 9.5, 'acc'], ['mapa[827] = shard-3', 9.5, 'acc']];
          showLines(o, 'WHO MOVES · 3 → 4 SHARDS', [['bia-31  slot 827 ≥ 770: shard-2 → shard-3', 'acc'], 'caio-58 slot 749 < 768: stays on shard-2', 'lena-77 472 · davi-12 432 · mkt-01 597', 'the hash is the same; the map changed'],
            [['MOVE', '1 of 5', 'acc'], ['WHO', 'bia-31', 's3'], ['RING', '2 of 5', '']]);
          o.count = CNT('1 of 5', 'customers moves: bia-31', 'slot 827, from shard-2 to shard-3'); } },
      { id: 'diretorio', dur: 7, title: 'The directory: moving a single customer',
        story: 'The third mode is the directory: a cliente_id → shard table, written when the customer is born. That is 1.5 million customers, about 150 MB, which fits in a Redis and costs 1 ms per lookup. It is what lets you move only mkt-01 to a dedicated shard: 20 million rows, 40 GB, 13 min 20 s at 50 MB/s, in four steps: copy, apply what arrived during the copy (CDC), switch the directory entry and delete the source.',
        look: 'The light carries mkt-01\'s rows from shard-0 to shard-3, the readout counts up to 40 GB and lights the four steps, one at a time.',
        key: 'The directory moves a single customer; without the CDC step, the copy is born stale.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          const f = clamp((t - 0.5) / 4), gb = 40 * f, ph = f < 1 ? (f < 0.8 ? 1 : 2) : t < 5.3 ? 3 : 4;
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own, tone: '', slot: s, tag: c }; });
          const M = o.keys['mkt-01']; M.tone = 'acc'; M.tag = ph >= 3 ? 'mkt-01 · directory\n→ shard-3' : 'mkt-01 · slot 597\nshard-0 (copying)'; if (ph >= 3) M.own = 3;
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: i === 3 ? 'dedicated' : '', bar: null, sub: i === 3 ? 'only mkt-01' : '1,024 slots', col: i, tone: i === 3 ? 'on' : '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['none of the 5', 'dim']] }; });
          o.blocks[3].lines = [[ph >= 3 ? 'mkt-01' : `receiving ${f1(gb)} GB`, 'acc'], ['20 M rows', 'dim']];
          if (ph < 3) o.beams.push({ pts: s2s(0, 3), on: true, dot: (t * 0.6) % 1 }); else quiet(o, s2s(0, 3));
          o.router = ['DIRECTORY', ['cliente_id → shard', 9.5], [ph >= 3 ? 'mkt-01 → shard-3' : 'mkt-01 → shard-0', 9.5, 'acc']];
          const P = (k, s) => [`${k} ${s}`, ph === k ? 'acc' : ph > k ? '' : 'dim'];
          showLines(o, 'MOVING MKT-01 · 40 GB AT 50 MB/s', [P(1, 'copy the 20 M rows (40 GB)'), P(2, 'apply what arrived: CDC'), P(3, 'switch the directory entry'), P(4, 'delete the source on shard-0'), ['directory: 1.5 M customers · 150 MB', 'dim']],
            [['COPIED', f1(gb) + ' GB', 'acc'], ['TIME', mmss(gb * 20), 'acc'], ['STEP', `${ph} of 4`, '']]);
          o.count = CNT(f1(gb) + ' GB', `of 40 · ${mmss(gb * 20)} of 13 min 20 s`, `step ${ph} of 4`); } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: the stale cached route',
        story: 'The store cut mkt-01 over to shard-3, but a router kept the old route, from epoch 1 of the map. It sends the partner\'s order to shard-0. If shard-0 accepted it, the data would end up in the wrong place. That is why the shard refuses keys that are no longer its own, like Redis Cluster\'s -MOVED, and says where to go. The router sees its epoch is old, fetches the epoch 2 map and tries again, now on shard-3.',
        look: 'The order goes to shard-0, comes back red with the refusal, and the second attempt goes on to shard-3.',
        key: 'The map needs an epoch, and the shard needs to refuse what is not its own.',
        f(o, t) { o.ring = { kind: 'slots', moved: 256, walks: [], mark: [] };
          CL.forEach(c => { const s = HC[c] % 1024, own = s >= 768 ? 3 : s % 3; o.keys[c] = { a: (s + 0.5) / 1024, own, tone: '', slot: s, tag: c }; });
          const M = o.keys['mkt-01']; M.own = 3; M.tone = 'acc'; M.tag = 'mkt-01\ndirectory: shard-3 (epoch 2)';
          [0, 1, 2, 3].forEach(i => { const live = CL.filter(c => o.keys[c].own === i); o.blocks[i] = { name: `shard-${i}`, big: i === 3 ? 'dedicated' : '', bar: null, sub: i === 3 ? 'only mkt-01' : '1,024 slots', col: i, tone: '',
            lines: live.length ? live.map(c => [c, o.keys[c].tone]) : [['none of the 5', 'dim']] }; });
          let ep = 1; o.router = ['ROUTER', ['cached map: epoch 1', 9.5, 'bad'], ['mkt-01 → shard-0', 9.5, 'bad']];
          send(o, t, 0.4, 1.5, r2s(0), 'INSERT mkt-01 (epoch 1)', 'hi', 0.2);
          if (send(o, t, 1.9, 3.0, rev(r2s(0)), 'refusal: mkt-01 is on shard-3', 'bad', 0.6)) { o.blocks[0].tone = 'bad'; o.blocks[0].lines = [['refused mkt-01', 'bad'], ['→ shard-3, epoch 2', 'bad']]; }
          if (t > 3.8) { ep = 2; o.router = ['ROUTER', ['fetches the map: epoch 2', 9.5, 'acc'], ['mkt-01 → shard-3', 9.5, 'acc']]; }
          if (send(o, t, 4.2, 5.4, r2s(3), 'INSERT mkt-01 (epoch 2)', 'acc', 1.5)) { o.blocks[3].tone = 'on'; o.blocks[3].lines = [['mkt-01: written', 'acc'], ['epoch 2', 'dim']]; }
          showLines(o, 'WHAT IF IT GOES WRONG · STALE MAP', [['router with the epoch 1 map', 'bad'], 'INSERT mkt-01 → shard-0', ['shard-0 refuses: "it is on shard-3"', 'bad'], 'router fetches the epoch 2 map', ['INSERT mkt-01 → shard-3', 'acc']],
            [['EPOCH', String(ep), ep === 1 ? 'bad' : 'acc'], ['ATTEMPTS', t > 5.4 ? '2' : '1', '']]);
          o.count = CNT(`epoch ${ep}`, ep === 1 ? 'stale cached route' : 'new map', 'the shard refuses what is not its own'); } },
    ],
    shuffle: [
      { id: 'todas', dur: 7, title: 'No isolation: the bad request goes through all of them',
        story: 'The catalogo service has 10 replicas, from catalogo-1 to catalogo-10, and each one handles 100 req/s. mkt-01 sends a request that hangs the replica that receives it, and the 500-per-second robot from module 8 repeats it. If every customer can use all 10, the bad request goes from replica to replica, and the whole service goes down.',
        look: 'The red light leaves mkt-01 and hangs one replica after another, until all 10.',
        key: 'With no limit on where each customer lands, one bad customer reaches every replica.',
        f(o, t) { o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] }; CL.forEach(c => { o.keys[c] = { own: -1, tone: c === 'mkt-01' ? 'bad' : '', tag: c }; });
          const n = clamp(Math.floor((t - 0.6) / 0.42) + 1, 0, 10); o.reps = Array.from({ length: 10 }, (_, i) => ({ st: i < n ? 'bad' : '' }));
          if (n > 0 && n <= 10 && t < 0.6 + 10 * 0.42) o.beams.push({ pts: c2r('mkt-01', n), on: true, tone: 'bad', dot: ((t - 0.6) % 0.42) / 0.42 });
          CL.filter(c => c !== 'mkt-01').forEach(c => { o.keys[c].tag = n >= 10 ? `${c}\nno service` : c; if (n >= 10) o.keys[c].tone = 'bad'; });
          showLines(o, 'THE CATALOGO · 10 REPLICAS', ['catalogo-1 … catalogo-10', '100 req/s each', 'mkt-01: the request that hangs', 'the 500/s robot repeats it', ['all can receive: all hang', 'bad']],
            [['HUNG', `${n} of 10`, 'bad'], ['NO SERVICE', n >= 10 ? '100%' : '—', 'bad']]);
          o.count = CNT(`${n} of 10`, 'hung replicas', 'no isolation'); } },
      { id: 'grupos', dur: 6, title: 'Fixed groups of 2: a whole group goes down',
        story: 'The first defense is 5 fixed groups of 2 replicas: (1, 2), (3, 4), (5, 6), (7, 8) and (9, 10). Each customer\'s group is murmur3(cliente_id) mod 5. mkt-01 lands in group (3, 4), and so does bia-31. Both replicas hang, and 20% of the customers, 1 group of 5, are left without service, Bia included. In a simulation with 10,000 customers, that is 2,007.',
        look: 'The pairs appear marked on the ring. mkt-01\'s red light hangs 3 and 4, and the bia-31 pin turns red with it.',
        key: 'A fixed group isolates the other groups, but takes down the whole group: 20%.',
        f(o, t) { o.center = true; o.ring = { kind: 'groups', bad: t > 1.6 ? 1 : -1, walks: [], mark: [] };
          CL.forEach(c => { const g = GRP(c); o.keys[c] = { own: -1, tone: '', tag: `${c}\ngroup ${pair(g)}`, reps: g }; });
          o.reps = Array.from({ length: 10 }, (_, i) => ({ st: t > 1.6 && (i === 2 || i === 3) ? 'bad' : '' }));
          CL.forEach(c => o.keys[c].reps.forEach(r => o.beams.push({ pts: c2r(c, r), on: c === 'mkt-01' && t > 0.4, tone: c === 'mkt-01' || (c === 'bia-31' && t > 1.6) ? 'bad' : '', dot: c === 'mkt-01' && t > 0.4 && t < 1.6 ? (t - 0.4) / 1.2 : null })));
          if (t > 1.6) { o.keys['mkt-01'].tone = 'bad'; o.keys['bia-31'].tone = 'bad'; o.keys['bia-31'].tag = 'bia-31 · group {3, 4}\nno service'; }
          showLines(o, 'FIXED GROUPS OF 2', ['group = murmur3(cliente_id) mod 5', 'mkt-01 → group {3, 4}', ['bia-31 → group {3, 4}: goes down too', 'bad'], 'lena-77 {7, 8} · caio-58 and davi-12 {5, 6}', '10,000 customers: 2,007 without service'],
            [['NO SERVICE', t > 1.6 ? '20%' : '—', 'bad'], ['GROUPS', '5', '']]);
          o.count = CNT(t > 1.6 ? '20%' : '0%', 'of the customers without service', '1 group of 5, Bia included'); } },
      { id: 'pares', dur: 5, title: 'Shuffle sharding: a shuffled pair for each customer',
        story: 'In shuffle sharding of 2 in 10, each customer gets 2 replicas chosen by rendezvous: the 2 with the lowest murmur3(cliente_id + ":catalogo-" + r). There are C(10, 2) = 45 possible pairs, and the pairs overlap. mkt-01 gets {8, 9}; lena-77 gets {6, 8}; bia-31 gets {4, 6}; caio-58 gets {1, 4}; davi-12 gets {1, 9}.',
        look: 'Each customer, in the center, connects to its two replicas. Nobody else has mkt-01\'s pair {8, 9}.',
        key: 'Each customer has a small subset, and almost nobody has the same one.',
        f(o, t) { o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] };
          CL.forEach(c => { o.keys[c] = { own: -1, tone: c === 'mkt-01' ? 'acc' : '', tag: `${c}\n${pair(PAIR[c])}`, reps: PAIR[c] }; });
          o.reps = Array.from({ length: 10 }, (_, i) => ({ st: PAIR['mkt-01'].includes(i + 1) ? 'on' : '' }));
          CL.forEach((c, k) => PAIR[c].forEach(r => o.beams.push({ pts: c2r(c, r), on: t > 0.3 + k * 0.4, dot: t > 0.3 + k * 0.4 && t < 1.3 + k * 0.4 ? t - 0.3 - k * 0.4 : null })));
          showLines(o, 'SHUFFLE SHARDING · 2 IN 10', ["the 2 with the lowest murmur3(c + ':catalogo-' + r)", 'C(10, 2) = 45 pairs', 'mkt-01 {8, 9} · lena-77 {6, 8}', 'bia-31 {4, 6} · caio-58 {1, 4}', 'davi-12 {1, 9}'],
            [['PAIRS', '45', 'acc'], ['SAME PAIR', '1 ÷ 45', '']]);
          o.count = CNT('45', 'possible pairs', 'C(10, 2)'); } },
      { id: 'trava', dur: 6.5, title: 'mkt-01 hangs 8 and 9: who notices?',
        story: 'mkt-01\'s bad request hangs catalogo-8 and catalogo-9. bia-31 {4, 6} and caio-58 {1, 4} do not even notice. lena-77 has 8 and davi-12 has 9: each loses one of its two replicas and only keeps being served if the client tries the other, which is the retry AWS requires. With 10,000 simulated customers, 240 (2.4%) have the same pair as mkt-01 and 3,868 (38.7%) share at least one replica.',
        look: 'Replicas 8 and 9 turn red. Lena and Davi hit the hung replica and the light detours to the other one; Bia and Caio carry on unchanged.',
        key: 'The blast radius drops from 20% to whoever has the same pair: about 2.2%.',
        f(o, t) { shuffleDown(o, t, PAIR, [8, 9]);
          showLines(o, 'CATALOGO-8 AND CATALOGO-9 HANG', ['bia-31 {4, 6} · caio-58 {1, 4}: do not notice', ['lena-77 {6, 8}: loses 8', retry ? '' : 'bad'], ['davi-12 {1, 9}: loses 9', retry ? '' : 'bad'], retry ? ['with retry: they try 6 and 1', 'acc'] : ['without retry: half the calls fail', 'bad'], '10,000: 240 same pair · 3,868 share one'],
            [['SAME PAIR', '2.4%', 'acc'], ['SHARE ONE', '38.7%', ''], ['FIXED GROUPS', '20%', 'bad']]);
          o.count = CNT('2.4%', 'with the same pair as mkt-01', `38.7% share a replica · ${retry ? 'with' : 'without'} retry`); } },
      { id: 'quatro', dur: 6, title: '4 replicas per customer: less coincidence, more neighbors',
        story: 'With 4 replicas per customer, there are C(10, 4) = 210 sets. mkt-01 gets {2, 4, 8, 9}. Only 50 of 10,000 customers (0.5%) have the same set, but 93.2% share at least one replica with it. caio-58 {1, 4, 8, 9} loses three of the four and keeps only 1: without retry, he loses three out of every four calls.',
        look: 'Four red replicas. Almost every customer has a red link, and caio-58 has three.',
        key: 'More replicas per customer: the same set gets rare, and the retry becomes mandatory.',
        f(o, t) { shuffleDown(o, t, QUAD, [2, 4, 8, 9]);
          showLines(o, 'SHUFFLE SHARDING · 4 IN 10', ['C(10, 4) = 210 sets', 'mkt-01 → {2, 4, 8, 9}', 'same set: 50 of 10,000 (0.5%)', ['share at least one: 93.2%', 'bad'], 'caio-58 {1, 4, 8, 9}: only 1 left'],
            [['SAME SET', '0.5%', 'acc'], ['SHARE ONE', '93.2%', 'bad']]);
          o.count = CNT('0.5%', 'with the same set', `93.2% share a replica · ${retry ? 'with' : 'without'} retry`); } },
      { id: 'semretry', dur: 7, title: 'What if it goes wrong: the client does not try the other one',
        story: 'lena-77 has replicas 6 and 8, and catalogo-8 is hung. Her app picks one replica per call and does not repeat when the first one fails. Half the calls land on 8 and fail; the same goes for Davi with 9. The isolation exists only on paper: without a retry on the client, the pair turns into half the requests lost.',
        look: 'Lena\'s and Davi\'s calls alternate between the two replicas; the ones that hit 8 and 9 come back red and nobody tries again.',
        key: 'Shuffle sharding requires the client to try all the replicas in its subset.',
        f(o, t) { const was = retry; retry = false; shuffleDown(o, t, PAIR, [8, 9]); retry = was;
          const n = Math.min(6, Math.floor(t / 0.9) + 1), bad = Math.floor(n / 2);
          o.keys['lena-77'].tag = `lena-77 {6, 8}\n${bad} of ${n} calls fail`; o.keys['davi-12'].tag = `davi-12 {1, 9}\n${bad} of ${n} calls fail`;
          showLines(o, 'WHAT IF IT GOES WRONG · NO RETRY', ['lena-77 {6, 8}: one replica per call', ['8 hung: it fails and does not try 6', 'bad'], ['davi-12 {1, 9}: the same with 9', 'bad'], `calls: ${n} · failed: ${bad}`, ['half the requests lost', 'bad']],
            [['LENA-77', '50% fail', 'bad'], ['DAVI-12', '50% fail', 'bad'], ['WITH RETRY', '0%', 'acc']]);
          o.count = CNT(`${bad} of ${n}`, 'Lena\'s calls fail', 'no retry on the client'); } },
    ],
    lab: [
      { id: 'hashing', dur: 4.5, title: 'hashing/: SHA-256 mod 3 on 10 tenants',
        story: 'The first program lowercases 10 tenants, computes the SHA-256 and does mod 3. The output of go run main.go matches the article\'s: Padaria-Estrela-Filial-1 and Acougue-Zona-Oeste on shard 0, four on shard 1 and four on shard 2. Count 2 / 4 / 4. With 4 shards, the same function moves 7 of the 10 tenants.',
        look: 'The ring is dark: this program does not use a ring. The three shards show who landed on each.',
        key: 'Mod works for spreading and breaks when N changes: 7 of 10.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] };
          const L = [['Padaria-Estrela-Filial-1', 'Acougue-Zona-Oeste'], ['Petshops-Souza', 'Mecanica-Dois-Irmaos', 'Padaria-Estrela-Filial-3', 'Acougue-Zona-Norte'], ['Pizzarias-Carvalho', 'Padaria-Estrela-Filial-2', 'Hortifruti-Oba', 'Acougue-Zona-Leste']];
          [0, 1, 2].forEach(i => { o.blocks[i] = { name: `shard ${i}`, big: `${L[i].length} tenants`, bar: L[i].length / 10, sub: 'SHA-256 mod 3', col: i, tone: '', lines: L[i].map(s => [s, '']), small: true }; });
          o.router = ['hashing/main.go', ['sha256(lowercase)', 9.5], ['mod 3', 10, 'acc']];
          showLines(o, '$ go run main.go · hashing/', ['10 tenants · SHA-256 · mod 3', 'Petshops-Souza 1 · Pizzarias-Carvalho 2', 'Mecanica-Dois-Irmaos 1 · Filial-1 0 · …', ['shard 0: 2 · shard 1: 4 · shard 2: 4', 'acc'], ['with 4 shards: 7 of 10 move', 'bad']],
            [['CONTAGEM', '2 / 4 / 4', 'acc'], ['3 → 4', '7 of 10', 'bad']]);
          o.count = CNT('2 / 4 / 4', 'tenants per shard', 'same output as the article\'s'); } },
      { id: 'distrib', dur: 4.5, title: 'hashing-distrib/: 5 functions, 41 inputs',
        story: 'The second program compares 5 hash functions on 41 inputs and 5 shards. The counts range from 4 to 14, and the article suggests this tells the functions apart. But it is only 41 inputs (38 unique tenants, because the Padaria Estrela branches repeat): the expected deviation per shard is 2.56, and in a table of 25 counts a 14 shows up by luck. With 100,000 keys, all 5 stay within 2% of the ideal.',
        look: 'The readout shows the table the program prints: one row per function, one column per shard.',
        key: 'With 41 items, the difference is noise; balance does not decide the function.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] }; o.router = ['hashing-distrib/', ['5 functions × 5 shards', 9.5], ['41 inputs', 9.5, 'acc']];
          showLines(o, '$ go run main.go · hashing-distrib/', ['SHA-256   9   7   6   8  11', 'SHA-512   8   9  12   7   5', 'MD5      13   9   4   5  10', ['FNV-1a    6   6   6  14   9', 'bad'], 'simple    5   7   9  10  10', ['41 inputs, 38 unique · ideal 8.2', 'dim']],
            [['IDEAL', '8.2', ''], ['DEVIATION', '2.56', 'acc'], ['100,000', '≤ 2%', 'acc']]);
          o.count = CNT('2.56', 'expected deviation with 41 inputs', 'the differences are noise'); } },
      { id: 'murmur', dur: 4.5, title: 'murmur/: 7, 8, 9, 8, 7',
        story: 'The third program uses murmur3 from the spaolacci/murmur3 v1.1.0 library, which go.mod downloads, on 39 inputs (38 unique) and 5 shards. It does not lowercase, unlike the others. The output is 7, 8, 9, 8, 7. The excerpt printed in the article lists 12 names and counts nothing: the map is never incremented. The loop that counts is in the repository.',
        look: 'The readout shows the count per shard, which adds up to 39.',
        key: 'The article\'s output is the repository\'s, not the printed excerpt\'s.',
        f(o, t) { o.ring = { kind: 'plain', dim: true, walks: [], mark: [] }; o.router = ['murmur/main.go', ['murmur3.Sum32', 9.5], ['mod 5, no lowercasing', 9.5, 'acc']];
          showLines(o, '$ go run main.go · murmur/', ['spaolacci/murmur3 v1.1.0 (go.mod)', '39 inputs, 38 unique · 5 shards', ['shard 0 … 4:  7  8  9  8  7', 'acc'], ['article excerpt: 12 names,', 'bad'], ['  shardDistribution is never incremented', 'bad']],
            [['CONTAGEM', '7 8 9 8 7', 'acc'], ['SUM', '39', '']]);
          o.count = CNT('7 / 8 / 9 / 8 / 7', 'inputs per shard', 'sum 39'); } },
      { id: 'anel3', dur: 5, title: 'consistent-hashing-remove/: the 3-point ring',
        story: 'The fourth program builds a ring with 4 shards and NumReplicas = 3: each one enters with 3 points, the SHA-256 of "Shard-000", "Shard-001" and "Shard-002", for example. The 10 tenants land like this: Shard-00 with 0, Shard-01 with 4, Shard-02 with 3 and Shard-03 with 3. Shard-00 is born empty: 3 points are too few, and its points ended up right after other shards\' points.',
        look: 'The lab\'s ring, with 12 points and very uneven slices; the 10 tenants are small pins. Shard-00\'s block is empty.',
        key: 'With 3 points per shard, a shard can be born with nothing.',
        f(o, t) { labRing(o, LABPTS); o.blocks[0].tone = 'bad';
          showLines(o, '$ go run main.go · consistent-hashing-remove/', ['NumReplicas = 3 · SHA-256 (8 bytes)', '4 shards × 3 points = 12 points', ['Shard-00: 0 · 01: 4 · 02: 3 · 03: 3', 'acc'], ['Shard-00 is born empty', 'bad']],
            [['SHARD-00', '0 tenants', 'bad'], ['POINTS', '12', '']]);
          o.count = CNT('0 / 4 / 3 / 3', 'tenants per shard', 'Shard-00 empty'); } },
      { id: 'remove', dur: 6, title: 'Remove Shard-02: 3 of 10 move',
        story: 'The program calls RemoveNode("Shard-02"), and its 3 points leave the ring. The tenants that were Shard-02\'s, Mecanica-Dois-Irmaos, Padaria-Estrela-Filial-3 and Acougue-Zona-Leste, walk clockwise to the next point, and all three land on Shard-00. Nobody else moves: 3 of 10. But the program only changes the ring; it does not copy a single row.',
        look: 'Shard-02\'s arcs disappear and the light takes its three tenants to Shard-00. The other seven do not change.',
        key: 'Whoever leaves the ring hands the keys to the next point clockwise.',
        f(o, t) { const gone = t > 0.8; labRing(o, gone ? LABPTS.filter(p => p[1] !== 2) : LABPTS, { from: gone ? LABPTS : null, f: clamp((t - 0.8) / 1.4) });
          if (gone) { o.blocks[2] = { name: 'Shard-02', big: 'removed', bar: null, sub: 'RemoveNode', col: 2, tone: 'bad', lines: [['3 fewer points', 'bad']], small: true }; o.blocks[0].tone = 'on'; }
          showLines(o, 'RemoveNode("Shard-02")', ['leaves: Shard-02 (3 points)', ['Mecanica-Dois-Irmaos → Shard-00', 'acc'], ['Padaria-Estrela-Filial-3 → Shard-00', 'acc'], ['Acougue-Zona-Leste → Shard-00', 'acc'], ['the lab only changes the ring: it does not migrate data', 'dim']],
            [['MOVE', '3 of 10', 'acc'], ['TO', 'Shard-00', 's0']]);
          o.count = CNT('3 of 10', 'tenants move', 'all to Shard-00'); } },
      { id: 'add', dur: 5.5, title: 'Add Shard-04: 1 of 10 moves',
        story: 'Then the program calls AddNode("Shard-04"), with 3 new points at 306.6°, 324.3° and 358.2°. Only one tenant has a new point right ahead: Hortifruti-Oba, at 354.2°, which used to go all the way around to Shard-01, at 24.2°, and now stops at Shard-04, at 358.2°. 1 of 10 moves. The "// Nova movimentação" note in the article\'s output was written by hand.',
        look: 'Three pink points enter the ring, and the light takes Hortifruti-Oba from Shard-01 to Shard-04.',
        key: 'Whoever joins the ring takes only the keys right before its points.',
        f(o, t) { const on = t > 0.6, P0 = LABPTS.filter(p => p[1] !== 2); labRing(o, on ? P0.concat(LAB04) : P0, { from: on ? P0 : null, f: clamp((t - 0.6) / 1.2), slot2: 4 });
          o.blocks[2] = on ? Object.assign(o.blocks[2], { tone: 'on' }) : { name: 'Shard-04', big: '', bar: null, sub: 'does not exist yet', col: 4, tone: 'dim', lines: [], small: true };
          showLines(o, 'AddNode("Shard-04")', ['joins: Shard-04 · 306.6° 324.3° 358.2°', ['Hortifruti-Oba 354.2°: Shard-01 → Shard-04', 'acc'], 'the other 9 stay', ['"// Nova movimentação": manual note', 'dim']],
            [['MOVE', '1 of 10', 'acc'], ['WHO', 'Hortifruti-Oba', 's4']]);
          o.count = CNT('1 of 10', 'tenant moves', 'Hortifruti-Oba → Shard-04'); } },
      { id: 'vazio', dur: 5, title: 'What if it goes wrong: the empty ring',
        story: 'GetTenantNode looks for the first point with a hash greater than or equal to the key\'s and, if it runs past the end, goes back to index 0. On an empty ring, with all shards removed or none added, len(ring.Nodes) is 0, the index becomes 0 and ring.Nodes[0] reads a slice with no elements: panic. The store\'s router has to check first and answer with a clear error and an alarm.',
        look: 'The ring with no points and every tenant red: there is nowhere to walk.',
        key: 'An empty ring is a case the code has to handle, not a panic in the router.',
        f(o, t) { o.ring = { kind: 'plain', bad: true, walks: [], mark: [] }; o.ten = TEN.map(([n, d]) => ({ a: d / 360, own: -1, tone: 'bad' }));
          [0, 1, 2, 3].forEach(i => { o.blocks[i] = { name: ['Shard-00', 'Shard-01', 'Shard-04', 'Shard-03'][i], big: 'removed', bar: null, sub: 'RemoveNode', col: [0, 1, 4, 3][i], tone: 'bad', lines: [], small: true }; });
          o.router = ['GetTenantNode', ['len(ring.Nodes) = 0', 9.5, 'bad'], ['idx = 0 → Nodes[0]', 9.5, 'bad']];
          showLines(o, 'WHAT IF IT GOES WRONG · EMPTY RING', ['ring.Nodes = []', 'idx := sort.Search(0, …)  // 0', 'if idx == len(ring.Nodes) { idx = 0 }', 'return ring.Nodes[idx].ID', ['panic: runtime error: index out of range', 'bad'], ['  [0] with length 0', 'bad']],
            [['RING', '0 points', 'bad'], ['RESULT', 'panic', 'bad']]);
          o.count = CNT('panic', 'index out of range [0] with length 0', 'ring without points'); } },
    ],
  };
  // pontos virtuais: um passo por quantidade de pontos (1, 3, 10, 100, 200)
  const VTXT = {
    1: ['1 point per shard: 70.2 / 8.8 / 21.0', 'With 1 point per shard, the ring has 3 points, and the slices depend only on where each name\'s hash landed. Shard-0 gets 70.2% of the 100,000 keys, shard-1 gets 8.8% and shard-2 gets 21.0%. The biggest has 2.11 times the mean. When a fourth shard joins, 23.2% of the keys move, all to it.',
      'Three arcs of very different sizes: shard-0\'s blue covers almost three quarters of the circle.', 'One point per shard leaves the slices to the luck of the hash.'],
    3: ['3 points, as in the lab: 59.0 / 17.7 / 23.3', 'With 3 points per shard, the number in the author\'s lab, the distribution improves a little: 59.0 / 17.7 / 23.3%, max 1.77 times the mean. In the lab, with 4 shards, Shard-00 was born with no tenant at all. From 3 to 4 shards, 32.1% of the keys move, far from the ideal of 25%.',
      'Nine arcs; the blue still dominates the bottom half of the ring.', 'Three points are still too few.'],
    10: ['10 points: 37.1 / 30.8 / 32.1', 'With 10 points per shard, the ring has 30 points and the slices mix: 37.1 / 30.8 / 32.1%, max 1.11 times the mean. The fraction that moves when a shard joins, 15.2%, still strays from the ideal, downward.',
      'The three colors alternate all around the circle, in arcs of varied sizes.', 'With tens of points, the luck of each one weighs less.'],
    100: ['100 points: 28.3 / 39.2 / 32.5', 'With 100 points per shard the max ÷ mean ratio goes up a little, to 1.18, by chance: shard-1 ended up with 39.2%. The luck of the points weighs less the more points there are, but it does not disappear. From 3 to 4 shards, 24.2% of the keys move.',
      'Thin stripes of the three colors; shard-1\'s green shows up a little more.', 'More points do not guarantee balance; they make the deviation small.'],
    200: ['200 points, the canonical one: 35.5 / 32.2 / 32.3', 'With 200 points per shard, this module\'s value, the 100,000 keys end up with 35.5 / 32.2 / 32.3%, max 1.07 times the mean. When shard-3 joins, 25.7% move, close to the ideal of 25%. On every row of this table, the keys that move go only to the new shard.',
      'Thin, similar stripes: each color covers close to a third of the ring.', 'Hundreds of points per shard leave each one close to 1 ÷ N.'],
  };
  STEPS.vnodes.forEach(s => { if (!s.V) return; const [title, story, look, key] = VTXT[s.V], D = DIST[s.V];
    Object.assign(s, { title, story, look, key, f(o, t) { onRing(o, 3, s.V); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); if (s.V <= 3) o.ring.mark = ring(3, s.V);
      shardBlocks(o, 3, D.k3, 'of the 100,000 keys');
      o.router = ['ROUTER', [`${s.V} ${s.V === 1 ? 'point' : 'points'} per shard`, 10, 'acc'], [`${3 * s.V} points on the ring`, 9.5]];
      showLines(o, `VIRTUAL NODES · ${s.V} PER SHARD`, [`3 shards × ${s.V} = ${3 * s.V} points`, `keys: ${D.k3.map(f1).join(' / ')}%`, [`max ÷ mean: ${D.r}`, s.V <= 3 ? 'bad' : 'acc'], `3 → 4 shards: ${D.mv}% move`, '  all to the new shard'],
        [['MAX ÷ MEAN', D.r, s.V <= 3 ? 'bad' : 'acc'], ['3 → 4', D.mv + '%', '']]);
      o.count = CNT(D.r, 'max ÷ mean', `${D.k3.map(f1).join(' / ')}% · 3 → 4: ${D.mv}%`); } }); });
  Object.assign(STEPS.vnodes[5], { title: 'What if it goes wrong: the biggest shard leaves and the domino starts',
    story: 'Now the biggest shard goes down and leaves the ring. With 1 point per shard, it had 70.2% of the keys, and all of them go to the next point clockwise: shard-2, which now has 91.2% and saturates. With 3 points, 56.7 thousand of the 59.0 thousand keys go to shard-1, which ends up with 74.4%. With 200 points, the keys split: shard-1 gets 53.1% and shard-2 gets 46.9%.',
    look: 'Shard-0\'s blue arc disappears and turns all purple: shard-2 swallows the whole slice.',
    key: 'Virtual nodes do not only balance: they spread the impact of a departure.',
    f(o, t) { const gone = t > 0.8; onRing(o, 3, 1, { rm: gone ? 0 : undefined, rmf: clamp((t - 0.8) / 1.2) }); tagKeys(o, (c, k) => `${c}\nshard-${k.own}`); o.ring.mark = ring(3, 1).filter(p => !gone || p.s);
      if (gone) CL.forEach(c => { if (ownerOf(ring(3, 1), HC[c]).s === 0) { o.keys[c].tone = 'bad'; o.keys[c].tag = `${c}\nshard-0 → shard-2`; } });
      shardBlocks(o, 3, gone ? [0, 8.8, 91.2] : DIST[1].k3, 'of the 100,000 keys');
      if (gone) { o.blocks[0] = { name: 'shard-0', big: 'out', bar: 0, sub: 'left the ring', col: 0, tone: 'bad', lines: [['70.2% gone', 'bad']] }; o.blocks[2].tone = 'bad'; }
      o.router = ['ROUTER', ['1 point per shard', 9.5], [gone ? 'shard-0 left' : '3 points on the ring', 9.5, gone ? 'bad' : '']];
      showLines(o, 'WHAT IF IT GOES WRONG · THE BIGGEST SHARD LEAVES', [['1 point: shard-0 (70.2%) leaves', 'bad'], ['  everything goes to shard-2 → 91.2%', 'bad'], '3 points: 56.7 of 59.0 thousand → shard-1', '  shard-1 ends up with 74.4%', ['200 points: 53.1% and 46.9%', 'acc']],
        [['SHARD-2', gone ? '91.2%' : '21.0%', 'bad'], ['WITH 200', '53.1 / 46.9', 'acc']]);
      o.count = CNT(gone ? '91.2%' : '21.0%', 'on shard-2', 'the domino with 1 point'); } });
  // shuffle: réplicas travadas e quem as usa
  function shuffleDown(o, t, SET, down) {
    o.center = true; o.ring = { kind: 'plain', walks: [], mark: [] }; const lock = t > 0.9;
    o.reps = Array.from({ length: 10 }, (_, i) => ({ st: lock && down.includes(i + 1) ? 'bad' : '' }));
    CL.forEach(c => { const s = SET[c], hit = s.filter(r => down.includes(r)), ok = s.filter(r => !down.includes(r)), m = c === 'mkt-01';
      o.keys[c] = { own: -1, tone: m ? 'bad' : '', tag: `${c}\n${pair(s)}`, reps: s };
      if (m) { s.forEach(r => o.beams.push({ pts: c2r(c, r), on: true, tone: 'bad', dot: !lock ? t / 0.9 : null })); return; }
      if (!lock || !hit.length) { s.forEach(r => o.beams.push({ pts: c2r(c, r), on: lock, dot: lock ? ((t * 0.6 + CL.indexOf(c) * 0.2) % 1) : null })); if (lock) o.keys[c].tag = `${c} ${pair(s)}\nunaffected`; return; }
      // tem réplica travada: bate nela e, com retry, tenta a outra
      const ph = (t - 0.9) % 1.8;
      hit.forEach(r => o.beams.push({ pts: c2r(c, r), on: true, tone: 'bad', cut: ph < 0.7 ? ph / 0.7 : 1 }));
      ok.forEach(r => o.beams.push({ pts: c2r(c, r), on: retry ? ph > 0.7 : (ph > 0.9), dot: retry && ph > 0.7 ? Math.min(1, (ph - 0.7) / 0.8) : null }));
      o.keys[c].tone = retry ? 'acc' : 'bad';
      o.keys[c].tag = retry ? `${c} ${pair(s)}\nloses ${pair(hit)}, tries ${ok.join(', ')}` : `${c} ${pair(s)}\nno retry: fails`; });
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
      o.blocks[i] = { name: names[i], big: `${live.length} tenants`, bar: live.length / 10, sub: '3 points on the ring', col: s, tone: '', small: true,
        lines: live.length ? live.slice(0, 4).map(q => [q.name, q.tone]) : [['no tenant', 'bad']] }; }
    o.router = ['GetTenantNode', ['sha256(lowercase)', 9.5], ['1st point ≥ hash', 9.5, 'acc']];
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
      x.fillStyle = INK(); x.font = `700 ${u(7.6)}px ${MONO3}`; x.fillText(/^shard-\d$/.test(b.name) ? `pg-pedidos-${b.name.slice(-1)}` : 'author\'s lab', u(8 + lw), u(mid));
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
      fx.textBaseline = 'middle'; fx.textAlign = 'left'; fx.fillStyle = C.inkHi; fx.font = `700 ${9 * P}px ${MONO3}`; fx.fillText('ROUTER', 3 * P, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
  }
  function drawRep(Bk, r, st) {
    const key = r + st + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, st === 'on', st === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
    x.textAlign = 'center'; x.fillStyle = st === 'bad' ? BAD() : INK(); x.font = `700 ${u(8.4)}px ${MONO3}`; x.fillText(st === 'bad' ? 'hung' : 'catalogo', u(W_ / 2), u(8.5));
    x.fillStyle = st === 'bad' ? BAD() : st === 'on' ? accC() : C.inkHi; x.font = `700 ${u(17)}px ${MONO3}`; x.fillText(String(r), u(W_ / 2), u(23));
    cv.tex.needsUpdate = true; Bk.mat.emissiveIntensity = st === 'on' ? 0.4 : 0;
    if (Bk.fkey !== theme + st) { Bk.fkey = theme + st; const fv = Bk.fr, P = fv.P, fx = fv.x; fx.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; fx.fillRect(0, 0, fv.c.width, fv.c.height);
      fx.textBaseline = 'middle'; fx.textAlign = 'center'; fx.fillStyle = st === 'bad' ? BAD() : INK(); fitFont(fx, v => v * P, `catalogo-${r}`, 8.6, RPW - 8); fx.fillText(`catalogo-${r}`, fv.c.width / 2, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
  }
  function drawCard(Bk, c, K) {
    const big = K.reps ? pair(K.reps) : 'all 10', l2 = String(K.tag || '').split('\n')[1] || '';
    const st = c === 'mkt-01' ? (K.tone === 'bad' ? 'the request that hangs' : 'the noisy customer') : l2 === big || l2.startsWith('group ') ? (K.reps && K.reps.length === 2 ? 'served' : '') : l2;
    const key = c + big + st + K.tone + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, K.tone === 'acc', K.tone === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
    x.textAlign = 'left'; x.fillStyle = K.tone === 'bad' ? BAD() : K.tone === 'acc' ? accC() : C.inkHi; x.font = `700 ${u(13)}px ${MONO3}`; x.fillText(c, u(7), u(12));
    x.textAlign = 'right'; x.fillStyle = C.inkHi; fitFont(x, u, big, 13, 80); x.fillText(big, u(W_ - 6), u(12));
    x.textAlign = 'left'; x.fillStyle = INK(); x.font = `700 ${u(8.2)}px ${MONO3}`; x.fillText(K.reps ? (K.reps.length === 2 && sc === 'shuffle' && step === 1 ? 'fixed group' : `${K.reps.length} catalogo replicas`) : 'uses any replica', u(7), u(29));
    x.fillStyle = K.tone === 'bad' ? BAD() : K.tone === 'acc' ? accC() : INK(); fitFont(x, u, st, 10.5, W_ - 14); x.fillText(st, u(7), u(49));
    cv.tex.needsUpdate = true; Bk.mat.emissiveIntensity = K.tone === 'acc' ? 0.35 : 0;
    if (Bk.fkey !== theme + K.tone) { Bk.fkey = theme + K.tone; const fv = Bk.fr, P = fv.P, fx = fv.x; fx.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; fx.fillRect(0, 0, fv.c.width, fv.c.height);
      fx.textBaseline = 'middle'; fx.textAlign = 'left'; fx.fillStyle = K.tone === 'bad' ? BAD() : C.inkHi; fx.font = `700 ${8.6 * P}px ${MONO3}`; fx.fillText('CUSTOMER ' + c.toUpperCase(), 3 * P, (Bk.fh / 2 + 0.3) * P); fv.tex.needsUpdate = true; }
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
  const EX = '<li class="h3-dim">The percentages are from the 100,000 test keys c-0 … c-99999 (murmur3, shard-S#i positions). A 2 KB row and a copy at 50 MB/s are the module\'s example numbers.</li>';
  const ringTable = () => `<table class="h3-sum"><tr><th>points</th><th>3 shards (%)</th><th>max ÷ mean</th><th>3 → 4</th></tr>${VS.map(V => `<tr${sc === 'vnodes' && L()[step].V === V ? ' class="on"' : ''}><td>${V}</td><td>${DIST[V].k3.map(f1).join(' / ')}</td><td>${DIST[V].r}</td><td>${DIST[V].mv}%</td></tr>`).join('')}</table>`;
  const DATA = {
    anel: () => `<table class="h3-sum"><tr><th>customer</th><th>murmur3</th><th>position</th><th>ring 200</th></tr>${CL.map(c => `<tr><td>${c}</td><td>${hex(HC[c])}</td><td>${deg(HC[c] / 2 ** 32)}</td><td>shard-${ownerOf(ring(3, 200), HC[c]).s}</td></tr>`).join('')}</table>
      <li>Position = hash ÷ 2³² × 360°; the owner is the <b>first point going clockwise</b> (the first hash ≥ the key's; if it runs past the end, back to the start).</li><li>Ring slice with 200 points: <b>35.16 / 32.43 / 32.42%</b>; keys: <b>35.5 / 32.2 / 32.3%</b>.</li><li>With 3 points per shard (the lab's), lena-77 would land on <b>shard-1</b>.</li>${EX}`,
    reshard: () => `<table class="h3-sum"><tr><th>3 → 4 shards</th><th>move</th><th>to copy</th></tr><tr><td>mod 4</td><td>75.2%</td><td>37.5 M · 75 GB · 25 min</td></tr><tr class="on"><td>ring, 200 points</td><td>25.7%</td><td>12.5 M · 25 GB · 8 min 20 s</td></tr><tr><td>slots (1,024)</td><td>25%</td><td>12.5 M · 25 GB · 8 min 20 s</td></tr></table>
      <li>With mod 4, 4 of 5 customers move (only davi-12 stays); on the ring, only <b>caio-58</b> and <b>davi-12</b>, both to shard-3.</li><li>From N to N + 1, mod moves <b>N ÷ (N + 1)</b>; the ideal is <b>1 ÷ (N + 1)</b>.</li><li>12.5 M is the ideal of 1 row in 4; 25 GB ÷ 50 MB/s = 500 s.</li>${EX}`,
    vnodes: () => `${ringTable()}<li>Removing the biggest shard (3 shards): <b>1 point</b> → the neighbor ends up with <b>91.2%</b>; <b>3</b> → 74.4%; <b>200</b> → 53.1% and 46.9%.</li><li>With 4 shards and 200 points: 26.1 / 23.6 / 24.7 / 25.7% (max ÷ mean 1.05).</li>${EX}`,
    slots: () => `<table class="h3-sum"><tr><th>customer</th><th>slot</th><th>3 shards</th><th>4 shards</th></tr>${CL.map(c => { const s = HC[c] % 1024; return `<tr${s >= 768 ? ' class="on"' : ''}><td>${c}</td><td>${s}</td><td>shard-${s % 3}</td><td>shard-${s >= 768 ? 3 : s % 3}</td></tr>`; }).join('')}</table>
      <li>slot = murmur3 mod 1,024; initial map slot mod 3: <b>342 / 341 / 341</b>. For 4 shards, shard-3 receives <b>86 + 85 + 85 = 256</b> slots (≥ 768, 769, 770).</li><li>Directory: 1.5 M customers × ~100 B = <b>150 MB</b>, 1 ms per lookup. Moving mkt-01: 20 M rows, <b>40 GB</b>, <b>13 min 20 s</b>.</li><li>Redis Cluster: 16,384 slots, CRC16(key) mod 16384, -MOVED and -ASK replies.</li>${EX}`,
    shuffle: () => `<table class="h3-sum"><tr><th>customer</th><th>fixed group</th><th>2 in 10</th><th>4 in 10</th></tr>${CL.map(c => `<tr${c === 'mkt-01' ? ' class="on"' : ''}><td>${c}</td><td>${pair(GRP(c))}</td><td>${pair(PAIR[c])}</td><td>${pair(QUAD[c])}</td></tr>`).join('')}</table>
      <li>10,000 customers: fixed groups take down <b>2,007 (20%)</b>; 2 in 10: <b>240 (2.4%)</b> with the same pair, <b>3,868 (38.7%)</b> with one in common; 4 in 10: <b>50 (0.5%)</b> and <b>93.2%</b>.</li><li>Route 53: 2,048 servers, 4 per domain: C(2048, 4) = <b>730,862,190,080</b>.</li><li>The AWS post counts 56 and 1/1,680 (with order); without order, 28 and 70.</li>`,
    lab: () => `<table class="h3-sum"><tr><th>program</th><th>checked output</th></tr><tr><td>hashing/</td><td>2 / 4 / 4 · with 4 shards, 7 of 10 move</td></tr><tr><td>hashing-distrib/</td><td>41 inputs (38 unique), 5 functions</td></tr><tr><td>murmur/</td><td>7 / 8 / 9 / 8 / 7 (39)</td></tr><tr><td>consistent-hashing-remove/</td><td>0 / 4 / 3 / 3 · −Shard-02: 3 of 10 · +Shard-04: 1 of 10</td></tr></table>
      <li>The first three run with go run main.go, without go.mod; murmur/ has a go.mod (go 1.22.4) and downloads spaolacci/murmur3 v1.1.0.</li><li>The outputs were reproduced in Python (SHA-256, MD5, FNV-1a, murmur3, ring) and match the article line by line; ring positions in degrees = hash ÷ 2⁶⁴ × 360°.</li>`,
  };
  const subHtml = () => {
    if (sc === 'vnodes') return `<div class="o3-mode c3-pol" role="group" aria-label="Points per shard">${VS.map((V, i) => `<button data-vn="${i}" aria-pressed="${step === i}">${V}</button>`).join('')}</div>`;
    if (sc === 'shuffle' && (L()[step].id === 'trava' || L()[step].id === 'quatro')) return `<div class="o3-mode c3-pol" role="group" aria-label="Client retry">${[[1, 'With retry'], [0, 'Without retry']].map(([v, s]) => `<button data-rt="${v}" aria-pressed="${!!v === retry}" title="key N switches">${s}</button>`).join('')}</div>`;
    return ''; };
  const countHtml = () => (SP || spec()).count;
  const sqlHtml = () => '<b>Math</b>' + (SP || spec()).disp.lines.map(l => l[0]).join('\n').replace(/</g, '&lt;');
  function panelHtml() {
    const s = L()[step];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      ${subHtml()}
      <h2>${s.title}</h2>
      <div class="i3-count" id="a3count">${countHtml()}</div>
      <div class="i3-sql">${sqlHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'anel') return; const s = L()[step];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${IDEN[s.id] || s.id}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(306, 236, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(100, 236, 60), dist: 13.5 },
    info: panelHtml(),
    hint: 'keys: → next · ← back · C or 1–6 scenario · N retry · drag to rotate' };
})() });
