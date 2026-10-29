// Figura 3D (iso-glow): a queda da região de São Paulo na noite da Black Friday. Três regiões (SP, Rio, Recife) com as quatro
// células na frente e as células passivas atrás (as de rio, recife e mkt moram em SP: o hub). As vigas do meio são o WAL indo
// para as passivas; as da frente, os clientes; as de cima, as sondas. Atrás, o mostrador: à esquerda o relógio (ou a perda,
// ou a hora da queda) e à direita a linha do tempo do RTO, a escada das estratégias, as médias do artigo ou a janela de lag.
// Cenários (toggle e ?mode=sp-cai|estrategias|metricas|rpo; ?step=N abre no passo N; ?crash=050|150|350 move a queda no RPO).
// Dados: a história canônica (docs/escrita/disaster-recovery-brief.md) e as contas do c27.py. Nenhum failover foi rodado:
// as durações de nós e pods são modelo. RTO = máx(detecção 30 s + pods 30 s, promoção do banco 35 s) + mapa 5 s = 65 s.
FIGS3D.push({ id: 'desastre', name: 'Disaster Recovery', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n).replace('.', ',');
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#6a0d06' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['sp-cai', 'estrategias', 'metricas', 'rpo'];
  const SCNAME = { 'sp-cai': 'São Paulo cai', estrategias: 'Estratégias', metricas: 'Métricas', rpo: 'RPO' };
  const SCFULL = { 'sp-cai': 'A queda de SP', estrategias: 'A escada do DR', metricas: 'MTTD, MTTR, RTO', rpo: 'RPO e o pedido 1061' };
  const AULA = { 'sp-cai': 'aula-4-disaster-recovery', estrategias: 'aula-4-disaster-recovery', metricas: 'aula-5-metricas-e-kpis-de-recuperacao', rpo: 'aula-5-metricas-e-kpis-de-recuperacao' };
  const CRASH = [0.05, 0.15, 0.35];
  let clk = 0, sc = 'sp-cai', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '', crash = 0.15;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1;
    const c = +('0.' + (q.get('crash') || '').replace(/\D/g, '')); if (CRASH.some(v => Math.abs(v - c) < 1e-9)) crash = c; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-desastre3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── a hora: t em segundos desde a queda (20:40:00.150) ──
  const T0 = 20 * 3600 + 40 * 60 + 0.15;
  const hora = (t, ms = true) => { const s = Math.round((T0 + t) * 1000) / 1000, h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s - h * 3600 - m * 60;
    const p2 = v => String(Math.floor(v)).padStart(2, '0'); return `${p2(h)}:${p2(m)}:${p2(ss)}` + (ms ? '.' + String(Math.round((ss % 1) * 1000) % 1000).padStart(3, '0') : ''); };
  const msOf = c => '.' + String(Math.round(c * 1000)).padStart(3, '0');

  // ── geometria ──
  const PL = 7, BZ = PL + 4, ZR = BZ + 8;
  plateWith(g0, 950, 480, [[14, 14], [936, 14], [14, 466], [936, 466]]);
  hazeAndShadow(g0, 475, 240, 10.8, 5.8);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 10, SZ, 700, 12, 240, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(694, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + 236, 692, 232, 4, g0), SK = 692 / 416;
  // as três regiões: lajes baixas com o nome na faixa da frente
  const RG = {};
  function region(nm, x, w) { const mat = capMat(); twCaps.push(mat); rbox(x, 100, PL, w, 272, 4, 6, mat, g0);
    RG[nm] = { mat, top: faceCanvas('top', x + 2, 102, BZ, w - 4, 268, 5, g0), w: w - 4, key: '' }; }
  region('SP', 16, 316); region('RJ', 348, 268); region('RE', 632, 302);
  const B = {};
  function block(nm, x, y, w, d, h) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 5, mat, g); g.position.copy(W(x, y, BZ));
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', pos: [x, y] };
  }
  // atrás: as passivas (a de SP mora no Rio; as outras três em SP) e o roteador; na frente: as quatro células
  block('pRio', 28, 112, 92, 76, 14); block('pRec', 126, 112, 92, 76, 14); block('pMkt', 224, 112, 96, 76, 14);
  block('pSP', 362, 112, 240, 76, 18); block('mapa', 646, 112, 274, 76, 18);
  block('cSP', 28, 236, 292, 104, 30); block('cRJ', 362, 236, 240, 104, 30); block('cRE', 646, 236, 132, 104, 30); block('cMK', 788, 236, 132, 104, 30);
  const NAMES = Object.keys(B);
  creases(first);

  // conexões grossas (vigas) e pontos de luz (pedidos, WAL, sondas) que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 34 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 30 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
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
      if (b.at != null) dot(alongPts(b.pts, cum, clamp(b.at)), b.tone);
      const k = b.on ? (b.n ?? 2) : 0, sp = b.sp ?? 0.45;
      for (let j = 0; j < k; j++) dot(alongPts(b.pts, cum, (clk * sp + j / k) % 1), b.tone);
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
  const TAGS = [tag(12), tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // balões: na faixa livre da frente da prancha, ou no alto, acima de um bloco
  const TF = x => [x, 446, 24], TU = (x, y) => [x, y, 78];
  const CX = { cSP: 174, cRJ: 482, cRE: 712, cMK: 854, pSP: 482, pRio: 74, pRec: 172, pMkt: 272, mapa: 783 };

  // ── as vigas ──
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], p[2] ?? z]);
  const BM = {
    wSP: P3([[250, 236], [250, 204], [482, 204], [482, 188]]), wRJ: P3([[400, 236], [400, 212], [74, 212], [74, 188]]),
    wRE: P3([[690, 236], [690, 220], [172, 220], [172, 188]]), wMK: P3([[830, 236], [830, 228], [272, 228], [272, 188]]),
    kSP: P3([[174, 470], [174, 340]]), kRJ: P3([[482, 470], [482, 340]]), kRE: P3([[712, 470], [712, 340]]), kMK: P3([[854, 470], [854, 340]]),
    kSP2: P3([[174, 470], [174, 456], [340, 456], [340, 150], [362, 150]]),
    sRJ: [[482, 288, 70], [174, 288, 70]], sRE: [[783, 150, 70], [174, 288, 70]],
  };
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  function base() { return { on: {}, rows: {}, rg: {}, beams: [], tags: [], cnt: [], left: null, chart: null }; }
  // o estado do mapa. w.t: segundos desde a queda (negativo = antes); w.strat: a estratégia da reserva no Rio;
  // w.flip: o mapa já virou; w.hub: as três células sem cópia em vermelho; w.wal: posição do WAL do 1061 (0 a 1) e se se perdeu
  function world(o, w) {
    const t = w.t, down = t >= 0, strat = w.strat || 'warm', flip = w.flip ?? (down && t >= 65);
    const promo = strat === 'ativo' || (down && t >= 35), lit = strat === 'ativo' ? 10 : strat === 'warm' ? (!down || t < 30 ? 3 : t < 60 ? 3 + Math.floor(7 * (t - 30) / 30) : 10) : 0;
    o.rg.SP = down ? ['SÃO PAULO', 'SEM ENERGIA E REDE', 'bad'] : ['SÃO PAULO', '9,9 pedidos/s', 'dim'];
    o.rg.RJ = ['RIO', flip ? '4,5 + 9,9 = 14,4/s (3,2×)' : '4,5 pedidos/s', flip ? 'acc' : 'dim'];
    o.rg.RE = ['RECIFE', '3,6 + 12,0 = 15,6/s', 'dim'];
    const cel = (k, name, rate, lag, alive) => { o.rows[k] = alive ? act(name, rate, ['primário', 'dim'], w.hub ? ['SEM CÓPIA', 'bad'] : down ? ['passiva apagada', 'bad'] : [`cópia: ${k === 'cSP' ? 'Rio' : 'SP'}, ${lag}`, 'dim']) : { ...act(name, rate, ['FORA DO AR', 'bad'], ['a região caiu', 'bad']), down: true };
      o.on[k] = alive ? (w.hub ? 'bad' : 0) : 'bad'; };
    cel('cSP', 'celula-sp', '9,9/s', '300 ms', !down); cel('cRJ', 'celula-rio', '4,5/s', '300 ms', true); cel('cRE', 'celula-recife', '3,6/s', '800 ms', true); cel('cMK', 'celula-mkt', '12/s', '800 ms', true);
    // passivas pequenas: sem meta na primeira linha (encolheria a letra); "passiva" vai na linha de baixo
    const pas = (k, name, lag) => { o.rows[k] = down ? { ...act(name, '', ['passiva', 'bad'], ['APAGADA', 'bad']), down: true, dash: true } : { ...act(name, '', ['passiva', 'dim'], [`lag ${lag}`, 'dim']), dash: true }; o.on[k] = down ? 'bad' : 0; };
    pas('pRio', 'rio', '300 ms'); pas('pRec', 'recife', '800 ms'); pas('pMkt', 'mkt', '800 ms');
    const SR = { backup: ['vazio: nada ligado', 'backup + WAL em objetos'], pilot: ['banco + tópico replicando', '0 pods'], warm: [promo ? 'banco promovido aos 35 s' : 'banco: réplica · lag 300 ms', `pods ${lit} de 10 (${lit * 10}%)`], ativo: ['pilha a 100%, servindo', 'banco escreve nos dois lados'] }[strat];
    o.rows.pSP = { ...act('celula-sp@rio', promo ? 'PRIMÁRIO' : strat === 'warm' ? 'passiva · warm' : strat === 'pilot' ? 'pilot light' : strat === 'backup' ? 'backup' : 'ativo', [SR[0], promo || strat === 'pilot' ? 'acc' : 'dim'], [SR[1], 'dim']), pods: { n: 10, lit }, dash: !promo && strat !== 'ativo' };
    o.on.pSP = down && (flip || (t >= 30 && strat === 'warm')) ? 1 : 0;
    o.rows.mapa = act('edge-loja · mapa', flip ? 'virou' : 'v. atual', [flip ? 'SP → celula-sp@rio' : 'SP → celula-sp', flip ? 'acc' : 'dim'], [down && !flip && t >= 30 ? 'alerta: quórum 2 em 3' : 'sondas: Rio e Recife', down && !flip && t >= 30 ? 'bad' : 'dim']);
    o.on.mapa = flip && t < 75 ? 1 : 0;
    // clientes
    o.beams.push({ pts: BM.kRJ, on: true, n: 1 }, { pts: BM.kRE, on: true, n: 1 }, { pts: BM.kMK, on: true, n: 2 });
    if (!down) o.beams.push({ pts: BM.kSP, on: true, n: 2 });
    else if (flip) o.beams.push({ pts: BM.kSP2, on: true, n: 3, sp: 0.3 });
    else o.beams.push({ pts: BM.kSP, on: true, tone: 'bad', n: 2 });
    // WAL para as passivas
    if (!down) o.beams.push({ pts: BM.wSP, on: true, n: 1, sp: 0.6 }, { pts: BM.wRJ, on: true, n: 1, sp: 0.4 }, { pts: BM.wRE, on: true, n: 1, sp: 0.3 }, { pts: BM.wMK, on: true, n: 1, sp: 0.3 });
    else o.beams.push({ pts: BM.wSP, on: false }, { pts: BM.wRJ, on: false }, { pts: BM.wRE, on: false }, { pts: BM.wMK, on: false });
    if (w.wal) o.beams.push({ pts: BM.wSP, on: false, at: w.wal.f, tone: w.wal.lost ? 'bad' : '' });
  }

  // ── a escada das estratégias ──
  const ST = [
    { k: 'backup', nm: 'backup', rto: 2874, rtoT: '~48 min', rpo: '24 h ou 5 min', cost: '~2%', rs: 2276208 },
    { k: 'pilot', nm: 'pilot light', rto: 720, rtoT: '12 min', rpo: '0,3 s', cost: '~10%', rs: 570240 },
    { k: 'warm', nm: 'warm standby', rto: 65, rtoT: '65 s', rpo: '0,3 s', cost: '~30%', rs: 51480 },
    { k: 'ativo', nm: 'ativo-ativo', rto: 35, rtoT: '35 s', rpo: '0,3 s ou 0', cost: '~100%', rs: 27720 }];
  const rs = v => 'R$ ' + thou(v);
  function ladder(o, n, cur, metas) {
    o.chart = { type: 'log', title: 'RTO NA MESMA QUEDA (ESCALA LOG) × META', rows: ST.slice(0, n).map((s, i) => [s.nm, s.rto, `${s.rtoT} · ${rs(s.rs)}`, i === cur ? (s.rto > 300 ? 'bad' : 'acc') : 'dim']),
      metas: metas ? [[300, 'checkout', 'acc'], [900, 'catálogo', 'hi']] : [[300, 'meta do checkout: 5 min', 'acc']] };
    const s = ST[cur]; if (s) o.left = { t: 'PERDA · ' + s.nm.toUpperCase(), big: rs(s.rs), rows: [['RTO', s.rtoT + (s.rto >= 600 ? ` (${thou(s.rto)} s)` : '')], ['RPO', s.rpo], ['custo extra', s.cost], ['R$ 792/s × RTO', s.rto > 300 ? 'passa da meta' : 'cumpre 5 min', s.rto > 300 ? 'bad' : 'acc']] };
  }
  // linha do tempo da queda (0 a 70 s) com o cursor no t
  function timeline(o, t, extra) {
    const c = v => clamp(t, 0, v), rows = [
      ['sondas', [], [[10, '✗', t >= 10 ? 'bad' : 'off'], [20, '✗', t >= 20 ? 'bad' : 'off'], [30, '✗ alerta', t >= 30 ? 'bad' : 'off']]],
      ['banco', [[0, c(35), t >= 35 ? 'acc' : 'dim', t >= 35 ? 'promovido: 35 s' : '']], []],
      ['pods', t > 30 ? [[30, c(60), t >= 60 ? 'acc' : 'dim', t >= 60 ? '100%: 60 s' : '']] : [], []],
      ['mapa', t > 60 ? [[60, c(65), 'acc', t >= 65 ? '65 s' : '']] : [], []],
      ['RTO', [[0, c(65), t >= 65 ? 'acc' : 'bad', t >= 65 ? 'RTO = 65 s' : '']], []]];
    o.chart = { type: 'tl', title: 'DESDE A QUEDA (s) · máx(30 + 30, 35) + 5 = 65', max: 70, rows: extra || rows, cur: t };
    o.left = { t: 'RELÓGIO', big: hora(t), rows: [['t', dec(t, 1) + ' s'], ['MTTD', t >= 30 ? '30 s' : '…', t >= 30 ? 'acc' : 'dim'], ['RTO', t >= 65 ? '65 s' : '…', t >= 65 ? 'acc' : 'dim']] };
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    'sp-cai': [
      { id: 'antes', dur: 6, title: 'Antes: quatro células, cada uma com a sua passiva', yk: 'A NOITE DA BLACK FRIDAY',
        code: ['30 pedidos/s na loja', 'sp 9,9 · rio 4,5 · recife 3,6 · mkt 12,0', 'SP → Rio (lag 300 ms) · Rio → SP (300 ms)', 'Recife → SP (800 ms) · mkt → SP (800 ms)', '20:39:59.950: a Bia cria o pedido 1061'],
        story: 'É a noite da Black Friday, com 30 pedidos/s. A loja tem quatro células, e cada uma manda o WAL para uma célula passiva em outra região. A passiva da celula-sp fica no Rio. As outras três ficam em São Paulo. Às 20:39:59.950 a Bia cria o pedido 1061 na celula-sp e recebe 201 dez milissegundos depois.',
        look: 'Na frente, as quatro células; atrás, as passivas, mais baixas e tracejadas. As vigas do meio são o WAL indo para as passivas. Três delas terminam em São Paulo.',
        key: 'Cada célula tem uma cópia em outra região, mas três das quatro cópias moram em SP.',
        f(o, t) { world(o, { t: -1 }); o.on.cSP = 1;
          timeline(o, 0); o.left = { t: 'RELÓGIO', big: '20:39:59.950', rows: [['1061', '201 em 10 ms'], ['pedidos/s', '30'], ['cópias em SP', '3 de 4', 'bad']] };
          o.cnt = [['PEDIDOS/S', '30'], ['CÓPIAS EM SP', '3 de 4', 'bad'], ['1061', '201 às 20:39:59.960', 'dim']];
          if (t > 0.8) T(o, TF(174), 'Bia: pedido 1061\n201 às 20:39:59.960');
          if (t > 2) T(o, TU(172, 150), 'hub: 3 passivas em SP', 'dim'); } },
      { id: 'queda', dur: 6, title: '20:40:00.150: a região de São Paulo cai', act: ['Derrubar SP', '20:40:00.150'], yk: 't = 0',
        code: ['20:40:00.150: SP sem energia e rede', 'fora: celula-sp (33% dos pedidos)', 'fora: 3 passivas (rio, recife, mkt)', 'WAL do 1061 chegaria às 20:40:00.252', 'redundância: N + 1 → N + 0'],
        story: 'Às 20:40:00.150 São Paulo perde energia e rede. A celula-sp sai do ar, e com ela as passivas da rio, da recife e da mkt. O WAL do pedido 1061 chegaria ao Rio às 20:40:00.252. Não chega. As outras três células seguem vendendo, mas sem cópia.',
        look: 'A região de SP fica vermelha e apagada. A viga do WAL para o Rio para no meio. Os clientes de SP batem numa célula morta.',
        key: 'Um desastre derruba o produto numa região inteira, não um componente.',
        f(o, t) { world(o, { t: 0, wal: { f: 0.66, lost: true } }); timeline(o, 0);
          o.cnt = [['FORA DO AR', 'celula-sp · 9,9/s', 'bad'], ['SEM CÓPIA', 'rio · recife · mkt', 'bad'], ['t', '0 s', 'dim']];
          if (t > 0.6) T(o, TU(174, 288), 'SP caiu\n20:40:00.150', 'bad');
          if (t > 1.6) T(o, TU(360, 204), 'WAL do 1061\nnunca chega', 'bad'); } },
      { id: 'detectar', dur: 7, title: 'Detecção: três sondas falham, MTTD = 30 s', act: ['Rodar as sondas', '10 s × 3'], yk: 'DETECTAR',
        code: ['sonda a cada 10 s, do Rio e de Recife', '3 falhas seguidas: 10 × 3 = 30 s', 'MTTD = 30 s', 'quórum: 2 observadores em 3 (módulo 3)', '20:40:20: o Pix c-7733 da Bia não chega'],
        story: 'Ninguém sabe ainda que SP caiu. As sondas sintéticas batem em SP a cada 10 s, a partir do Rio e de Recife. Três falhas seguidas disparam o alerta, 30 s depois da queda. No meio disso, às 20:40:20, a Bia paga o Pix c-7733, e o webhook do PSP não alcança a celula-sp.',
        look: 'As duas vigas de cima são as sondas, do Rio e de Recife até SP. No mostrador, as marcas de 10, 20 e 30 s. O relógio corre até 20:40:30.',
        key: 'Antes de trocar, alguém precisa perceber: são 30 s só para isso.',
        f(o, t) { const s = 30 * sg(t, 0.4, 5.4); world(o, { t: s }); timeline(o, s);
          o.beams.push({ pts: BM.sRJ, on: true, tone: 'bad', n: 1, sp: 0.5 }, { pts: BM.sRE, on: true, tone: 'bad', n: 1, sp: 0.5 });
          const k = Math.min(3, Math.floor(s / 10 + 1e-6));
          o.cnt = [['MTTD', s >= 30 ? '30 s' : dec(s, 0) + ' s…', s >= 30 ? 'acc' : 'bad'], ['SONDAS', `${k} de 3 falharam`, k ? 'bad' : 'dim'], ['HORA', hora(s, false), 'dim']];
          if (s >= 20 && s < 30) T(o, TF(174), 'Pix c-7733 (20:40:20)\nwebhook não chega', 'bad');
          if (s >= 30) T(o, TU(783, 150), 'alerta aos 30 s\nquórum 2 em 3', 'bad'); } },
      { id: 'trocar', dur: 7, title: 'Promoção aos 35 s, pods prontos aos 60 s', act: ['Promover e escalar', '35 s · 60 s'], yk: 'TROCAR (EM PARALELO)',
        code: ['banco: ttl 30 s + 5 s = 35 s desde a queda', 'pods: de 30% a 100%, a partir do alerta', '30 s (alerta) + 30 s (pods) = 60 s', 'a promoção corre ao lado da detecção', 'Rio: 4,5 → 14,4 pedidos/s (3,2×)'],
        story: 'A promoção do banco não espera o alerta. A chave do líder em SP vence com o ttl de 30 s, e a réplica do Rio vira primária aos 35 s. O scale-up dos pods começa com o alerta, aos 30 s, e leva mais 30 s. Aos 60 s a celula-sp@rio está a 100%, pronta para os 9,9 pedidos/s de SP além dos 4,5 da celula-rio.',
        look: 'A celula-sp@rio, no fundo do Rio, acende e vira PRIMÁRIO. Os quadradinhos dos pods vão de 3 para 10.',
        key: 'A promoção (35 s) termina antes; quem segura a volta são os pods, aos 60 s.',
        f(o, t) { const s = 30 + 30 * sg(t, 0.4, 5.4); world(o, { t: s }); timeline(o, s);
          o.cnt = [['PODS', s >= 60 ? '10 de 10' : `${3 + Math.floor(7 * (s - 30) / 30)} de 10`, s >= 60 ? 'acc' : 'dim'], ['BANCO', s >= 35 ? 'promovido aos 35 s' : 'réplica', s >= 35 ? 'acc' : 'dim'], ['HORA', hora(s, false), 'dim']];
          if (s >= 35) T(o, TF(482), s >= 60 ? 'pods 100% aos 60 s' : 'banco promovido: 35 s'); } },
      { id: 'mapa', dur: 7, title: 'O mapa vira aos 65 s: RTO = 65 s', act: ['Virar o mapa', '+5 s'], yk: 'A CONTA DO RTO',
        code: ['RTO = máx(30 + 30, 35) + 5', '    = 60 + 5 = 65 s', 'MTTD 30 s + MTTR 35 s = 65 s', 'SP: 9,9 × 65 = 643,5 tentativas falhas', '20:41:10: o Davi cria um pedido: 1061'],
        story: 'Com a passiva pronta, o roteador troca o mapa: os clientes de SP passam a ir para a celula-sp@rio. A propagação leva 5 s. Às 20:41:05.150, 65 s depois da queda, SP volta a comprar. Às 20:41:10 o Davi cria um pedido e recebe o número 1061, o mesmo da Bia (aula 5).',
        look: 'A viga dos clientes de SP desvia pela borda da região e entra no Rio. O mostrador fecha a barra do RTO em 65 s.',
        key: 'O RTO conta da queda: máx(detecção + pods, promoção) + mapa = 65 s.',
        f(o, t) { const s = 60 + 10 * sg(t, 0.4, 5); world(o, { t: s }); timeline(o, s);
          o.cnt = [['RTO', s >= 65 ? '65 s' : dec(s, 0) + ' s…', s >= 65 ? 'acc' : 'bad'], ['MTTR', '35 s', 'dim'], ['FALHAS EM SP', '643,5 tentativas', 'bad']];
          if (s >= 65) T(o, TF(340), 'mapa virou: 20:41:05.150\nRTO 65 s');
          if (s >= 69.5) T(o, TF(482), 'Davi: pedido 1061\n20:41:10', 'dim'); } },
      { id: 'hub', dur: 7, title: 'E se der errado: SP era o hub das passivas', yk: 'O SPoF DO PLANO DE DR',
        code: ['passivas em SP: rio, recife e mkt', 'com SP fora: 3 células sem cópia', 'uma 2ª falha (o disco do Rio) perde dado', 'a Lena (recife) não percebe nada', 'conserto: espalhar as passivas, game day'],
        story: 'A loja voltou, mas ficou frágil. São Paulo guardava as passivas da rio, da recife e da mkt. Agora essas três células rodam sem cópia, e uma segunda falha, como o disco do Rio, perde o que não foi replicado. A Lena, na celula-recife, nem percebeu a queda; a célula dela só ficou sem passiva por 3 h.',
        look: 'As três células vivas ficam com a borda vermelha: SEM CÓPIA. As passivas delas, no fundo de SP, estão apagadas.',
        key: 'O plano de DR também tinha um ponto único de falha: o hub em SP.',
        f(o, t) { world(o, { t: 75, hub: true }); timeline(o, 70);
          o.cnt = [['SEM CÓPIA', '3 células', 'bad'], ['PASSIVAS APAGADAS', 'rio · recife · mkt', 'bad'], ['LENA', 'não percebe', 'dim']];
          if (t > 0.8) T(o, TU(172, 150), 'hub: 3 passivas\napagadas com SP', 'bad');
          if (t > 2) T(o, TF(712), 'Lena: nada muda\n(sem passiva por 3 h)', 'dim'); } },
    ],
    estrategias: [
      { id: 'backup', dur: 6, title: 'Backup e restauração: ~48 min', yk: 'RTO DO BACKUP (2.874 s)',
        code: ['decisão 5 min + infra por IaC 20 min', 'restore 46,2 GB ÷ 50 MB/s = 924 s', 'replay do WAL 5 min + pods 30 s + aquecer 2 min', 'RTO 2.874 s (~48 min) · RPO 24 h ou 5 min', 'R$ 792/s × 2.874 = R$ 2.276.208'],
        story: 'A mesma queda da celula-sp, com a reserva em cada degrau da escada. No primeiro, nada roda no Rio: só o backup e o WAL num armazenamento de objetos. Alguém decide, a infraestrutura sobe por IaC, o banco de 46,2 GB é restaurado a 50 MB/s e o WAL é reaplicado. São ~48 min. A 9,9 pedidos/s e R$ 80 por pedido, cada segundo parado custa R$ 792.',
        look: 'No Rio, a celula-sp@rio está vazia: só o backup. No mostrador, a barra do backup passa longe da meta de 5 min.',
        key: 'O degrau mais barato (~2%) é o mais lento: ~48 min e R$ 2,28 mi.',
        f(o, t) { world(o, { t: 80, strat: 'backup', flip: false }); ladder(o, 1, 0);
          o.cnt = [['RTO', '~48 min', 'bad'], ['PERDA', 'R$ 2.276.208', 'bad'], ['CUSTO EXTRA', '~2%', 'dim']];
          if (t > 0.8) T(o, TF(482), 'backup: nada ligado\nRTO ~48 min', 'bad'); } },
      { id: 'pilot', dur: 6, title: 'Pilot light: 12 min', act: ['Subir para pilot light', 'banco ligado'], yk: 'RTO DO PILOT LIGHT (720 s)',
        code: ['detectar 30 s + decisão humana 5 min', 'nós 4 min + pods 30 s + aquecer 2 min', 'RTO 720 s (12 min) · RPO 0,3 s', 'custo extra ~10%', 'R$ 792/s × 720 = R$ 570.240'],
        story: 'No pilot light, o banco e o tópico já replicam no Rio, mas não há nenhum pod. O RPO cai para 0,3 s. O RTO ainda soma 5 min de decisão humana e 4 min para subir os nós. São 12 min e R$ 570.240.',
        look: 'A celula-sp@rio tem o banco aceso e os 10 quadradinhos dos pods apagados.',
        key: 'O pilot light guarda o dado, não a capacidade: 12 min.',
        f(o, t) { world(o, { t: 80, strat: 'pilot', flip: false }); o.on.pSP = 1; ladder(o, 2, 1);
          o.cnt = [['RTO', '12 min', 'bad'], ['PERDA', 'R$ 570.240', 'bad'], ['CUSTO EXTRA', '~10%', 'dim']];
          if (t > 0.8) T(o, TF(482), 'pilot light: 0 pods\nRTO 12 min', 'bad'); } },
      { id: 'warm', dur: 6, title: 'Warm standby (o ativo-passivo do artigo): 65 s', act: ['Subir para warm standby', 'pilha a 30%'], yk: 'DO PILOT LIGHT AO WARM STANDBY',
        code: ['pilha no Rio a 30%, decisão automática', 'RTO 65 s · RPO 0,3 s · custo ~30%', 'R$ 792/s × 65 = R$ 51.480', 'RTO: 720 → 65 s = −655 s (10 min 55 s)', 'perda: 570.240 → 51.480 = −R$ 518.760'],
        story: 'No warm standby a pilha inteira já roda no Rio a 30% e a decisão é automática. É o desenho da queda de SP: 65 s. Passar do pilot light para o warm standby tira 655 s do RTO, quase 11 min, e R$ 518.760 da perda. O custo extra sobe de ~10% para ~30%.',
        look: 'A celula-sp@rio com 3 de 10 pods acesos. A barra do warm standby fica antes da linha de 5 min.',
        key: 'Subir um degrau troca custo fixo por minutos: 10 min 55 s e R$ 518.760 a menos.',
        f(o, t) { world(o, { t: 80, strat: 'warm' }); ladder(o, 3, 2); o.rows.pSP.rows[1] = ['pods 3 → 10 em 30 s', 'dim'];
          o.cnt = [['RTO', '65 s', 'acc'], ['PERDA', 'R$ 51.480', 'acc'], ['DO PILOT LIGHT', '−655 s · −R$ 518.760', 'acc']];
          if (t > 0.8) T(o, TF(482), 'warm standby\nRTO 65 s'); } },
      { id: 'ativo', dur: 6, title: 'Ativo-ativo: 35 s', act: ['Subir para ativo-ativo', 'pilha a 100%'], yk: 'RTO DO ATIVO-ATIVO',
        code: ['pilha no Rio a 100%, servindo clientes', 'RTO = detectar 30 s + mapa 5 s = 35 s', 'RPO 0,3 s (assíncrono) ou 0 (síncrono)', 'síncrono: +10 ms com o Rio, +80 ms com Recife', 'custo extra ~100% · R$ 27.720'],
        story: 'No ativo-ativo o Rio já serve clientes com a pilha a 100%. Não há promoção quando as duas regiões escrevem: sobra detectar e virar o mapa, 35 s. O RPO pode ir a zero com replicação síncrona, pagando 10 ms a mais em cada commit com o Rio. O risco fica distribuído, não eliminado: escrita nos dois lados pede resolver conflitos.',
        look: 'A celula-sp@rio com os 10 pods acesos e clientes de SP chegando.',
        key: 'O degrau mais caro (~100%) tira só mais 30 s do warm standby.',
        f(o, t) { world(o, { t: 80, strat: 'ativo' }); ladder(o, 4, 3);
          o.cnt = [['RTO', '35 s', 'acc'], ['PERDA', 'R$ 27.720', 'acc'], ['CUSTO EXTRA', '~100%', 'bad']];
          if (t > 0.8) T(o, TF(482), 'ativo-ativo\nRTO 35 s'); } },
      { id: 'metas', dur: 7, title: 'A meta de cada serviço decide', yk: 'METAS DA LOJA (EXEMPLO)',
        code: ['checkout    RTO 5 min · RPO 1 s', 'catalogo    RTO 15 min · RPO 1 h', 'relatorios  RTO 24 h · RPO 24 h', 'checkout: só warm (65 s) e ativo (35 s)', 'cada min de pilot light: R$ 47.520'],
        story: 'A AWS diz que uma estratégia que custa mais que a falha não se adota. A pergunta, então, é qual meta cada serviço tem. O checkout precisa voltar em 5 min: só o warm standby e o ativo-ativo cumprem. O catálogo aceita 15 min, e o pilot light basta. Os relatórios aceitam 24 h, e o backup basta.',
        look: 'No mostrador, as linhas das metas de 5 e 15 min sobre as quatro barras: a barra que termina antes de uma linha cumpre aquela meta. Os relatórios (24 h) ficam fora da escala: todas cumprem.',
        key: 'A loja não escolhe uma estratégia: escolhe uma por serviço.',
        f(o, t) { world(o, { t: 80, strat: 'warm' }); ladder(o, 4, -1, true);
          o.left = { t: 'QUEM CUMPRE A META', big: '5 min', rows: [['checkout', 'warm · ativo', 'acc'], ['catálogo', '+ pilot light'], ['relatórios', '+ backup'], ['1 min a mais', 'R$ 47.520', 'bad']] };
          o.cnt = [['CHECKOUT', 'warm ou ativo-ativo', 'acc'], ['CATÁLOGO', 'pilot light', 'dim'], ['RELATÓRIOS', 'backup', 'dim']]; } },
      { id: 'errado', dur: 7, title: 'E se der errado: o plano mora na região que caiu', yk: 'O QUE MORAVA EM SP',
        code: ['runbook no wiki hospedado em SP', 'pipeline e estado do Terraform em SP', 'painel do DNS e senhas atrás de login em SP', 'credencial do PSP-B vencida (módulo 21)', 'conserto: game day, derrubar SP de propósito'],
        story: 'O plano falha se depender de algo que mora em SP. O runbook está no wiki de SP, o pipeline e o estado do Terraform também, e o painel do DNS pede um login que só existe lá. Um plano nunca testado guarda outras surpresas, como a credencial vencida do PSP-B. O conserto é o game day: derrubar SP de propósito, medir o RTO e comparar com a meta.',
        look: 'Os clientes de SP batem na região morta e o mapa não vira: o runbook, o pipeline e o DNS caíram junto com SP.',
        key: 'Um DR que nunca foi testado é só uma hipótese.',
        f(o, t) { world(o, { t: 20 }); o.rows.pSP.rows[0] = ['sem runbook, sem pipeline', 'bad']; o.on.pSP = 'bad'; ladder(o, 4, -1);
          o.chart.rows[2][3] = 'bad'; o.chart.rows[2][2] = '65 s? nunca testado';
          o.left = { t: 'O PLANO DEPENDIA DE SP', big: '4 itens', rows: [['runbook', 'wiki em SP', 'bad'], ['pipeline', 'Terraform em SP', 'bad'], ['DNS e senhas', 'login em SP', 'bad'], ['PSP-B', 'credencial vencida', 'bad']] };
          o.cnt = [['RTO REAL', 'desconhecido', 'bad'], ['DEPENDÊNCIAS EM SP', 'runbook · pipeline · DNS', 'bad'], ['CONSERTO', 'game day', 'dim']];
          if (t > 0.8) T(o, TU(174, 288), 'runbook · pipeline · DNS\ncaíram com SP', 'bad');
          if (t > 2) T(o, TU(783, 150), 'PSP-B: credencial vencida', 'bad'); } },
    ],
    metricas: [
      { id: 'mttd', dur: 6, title: 'MTTD: da queda à detecção, 30 s', yk: 'MTTD',
        code: ['início     20:40:00.150', 'detecção   20:40:30 (3ª sonda)', 'MTTD = 30 s', 'artigo: média de 5 incidentes = 34 min'],
        story: 'A primeira medida é o tempo até alguém, ou algo, perceber. Na queda de SP foram as três sondas: 30 s. O MTTD só existe porque as sondas existem.',
        look: 'No mostrador, o primeiro trecho da linha do tempo, de 0 a 30 s.',
        key: 'O MTTD mede o detectar: 30 s.',
        f(o, t) { const s = 30 * sg(t, 0.4, 4.4); world(o, { t: s }); o.beams.push({ pts: BM.sRJ, on: true, tone: 'bad', n: 1 }, { pts: BM.sRE, on: true, tone: 'bad', n: 1 });
          timeline(o, s, [['MTTD', [[0, s, 'bad', s >= 30 ? 'MTTD 30 s' : '']], []], ['MTTR', [], []], ['RTO', [], []]]);
          o.cnt = [['MTTD', s >= 30 ? '30 s' : dec(s, 0) + ' s…', 'bad'], ['HORA', hora(s, false), 'dim']]; } },
      { id: 'mttr', dur: 7, title: 'MTTR: da detecção à volta, 35 s', act: ['Medir a volta', 'até o mapa'], yk: 'MTTR (DEFINIÇÃO DO ARTIGO)',
        code: ['detecção       t = 30 s', 'pods prontos   t = 60 s (30 s depois)', 'mapa vira      t = 65 s (+5 s)', 'MTTR = 65 − 30 = 35 s', 'a promoção (35 s) correu em paralelo'],
        story: 'O MTTR conta da detecção até a loja voltar. Depois do alerta, os pods levam 30 s e o mapa mais 5: 35 s. A promoção do banco, aos 35 s desde a queda, terminou antes dos pods, por isso não entra na soma.',
        look: 'O segundo trecho, de 30 a 65 s. No mapa, a celula-sp@rio acende e a viga de SP desvia para o Rio.',
        key: 'O MTTR mede o voltar: 35 s, com a definição do artigo.',
        f(o, t) { const s = 30 + 35 * sg(t, 0.4, 5.4); world(o, { t: s });
          timeline(o, s, [['MTTD', [[0, 30, 'dim', 'MTTD 30 s']], []], ['MTTR', [[30, s, 'acc', s >= 65 ? 'MTTR 35 s' : '']], []], ['banco', [[0, Math.min(s, 35), 'dim', s >= 35 ? '35 s (paralelo)' : '']], []], ['RTO', [], []]]);
          o.cnt = [['MTTR', s >= 65 ? '35 s' : dec(s - 30, 0) + ' s…', 'acc'], ['HORA', hora(s, false), 'dim']]; } },
      { id: 'rto', dur: 6, title: 'RTO: conta da interrupção, 65 s', act: ['Somar o RTO', 'MTTD + MTTR'], yk: 'RTO = MTTD + MTTR',
        code: ['RTO = 30 + 35 = 65 s', 'artigo: "após a detecção" → daria 35 s', 'AWS: da interrupção à restauração → 65 s', '20:40:00.150 → 20:41:05.150', 'RPO: lag de 0,3 s = 2,97 pedidos'],
        story: 'O RTO é a promessa de tempo parado. O artigo o conta depois da detecção, o que daria 35 s. A AWS conta da interrupção: para o cliente de SP, a loja ficou fora de 20:40:00.150 a 20:41:05.150. São 65 s.',
        look: 'A barra do RTO cobre os dois trechos, de 0 a 65 s.',
        key: 'RTO = MTTD + MTTR: o tempo de detectar também é tempo parado.',
        f(o, t) { world(o, { t: 66 });
          timeline(o, 65, [['MTTD', [[0, 30, 'dim', 'MTTD 30 s']], []], ['MTTR', [[30, 65, 'dim', 'MTTR 35 s']], []], ['RTO', [[0, 65 * sg(t, 0.3, 2.3), 'acc', t > 2.3 ? 'RTO 65 s (da queda)' : '']], []]]);
          o.cnt = [['RTO', '65 s', 'acc'], ['MTTD + MTTR', '30 + 35', 'dim']];
          if (t > 2.4) T(o, TF(340), '20:40:00.150 → 20:41:05.150\nRTO 65 s'); } },
      { id: 'artigo', dur: 6, title: 'As tabelas do artigo, conferidas', yk: 'AS MÉDIAS DO ARTIGO (min)',
        code: ['MTTD 60+18+20+21+51 = 170 ÷ 5 = 34', 'MTTR 90+105+132+22+193 = 542 ÷ 5 = 108,4', 'MTBF 116+85+240+377 = 818 ÷ 4 = 204,5', 'A = 204,5 ÷ (204,5 + 108,4) = 65,4%', 'as tabelas não são os mesmos incidentes'],
        story: 'O artigo dá uma tabela para cada medida, e as médias fecham: 34, 108,4 e 204,5 min. Mas a disponibilidade que sai delas é 65,4%, inaceitável para qualquer loja: os números são didáticos. E as três tabelas não descrevem os mesmos incidentes (12:00 PM numa, 12:00 AM na outra).',
        look: 'No mostrador, as três médias em barras de minutos.',
        key: 'As contas do artigo fecham; os números servem para aprender, não para comparar.',
        f(o, t) { world(o, { t: 80 });
          o.chart = { type: 'rows', title: 'MÉDIAS DAS TABELAS DO ARTIGO (MIN)', max: 220, rows: [['MTTD', 34, '34 min (170 ÷ 5)', 'dim'], ['MTTR', 108.4, '108,4 min (542 ÷ 5)', 'acc'], ['MTBF', 204.5, '204,5 min (818 ÷ 4)', 'dim']].slice(0, 1 + Math.floor(clamp((t - 0.3) / 2.4) * 2.999)) };
          o.left = { t: 'DISPONIBILIDADE', big: '65,4%', rows: [['MTBF', '204,5 min'], ['MTTR', '108,4 min'], ['números', 'didáticos', 'bad']] };
          o.cnt = [['DISPONIBILIDADE', '65,4%', 'bad'], ['MTTD · MTTR · MTBF', '34 · 108,4 · 204,5 min', 'dim']]; } },
      { id: 'mtbf', dur: 6, title: 'MTBF e disponibilidade', yk: 'A = MTBF ÷ (MTBF + MTTR)',
        code: ['MTBF de 30 dias = 43.200 min', '65 s parados = 1,083 min', '43.200 ÷ 43.201,083 = 99,9975%', 'com 108 min parados: 99,7506%', 'artigo: 204,5 ÷ 312,9 = 65,4%'],
        story: 'O MTBF é quanto a loja funciona entre uma falha e a próxima. Com uma queda a cada 30 dias e 65 s parados, a disponibilidade é 99,9975%. Se cada volta levasse os 108 min do artigo, cairia para 99,7506%.',
        look: 'No mostrador, as três disponibilidades, da loja ao exemplo do artigo.',
        key: 'Falhar menos (MTBF) e voltar rápido (MTTR) mexem no mesmo número.',
        f(o, t) { world(o, { t: 80 });
          o.chart = { type: 'lines', title: 'DISPONIBILIDADE = MTBF ÷ (MTBF + MTTR)', n: 1 + Math.floor(clamp((t - 0.3) / 3) * 2.999),
            lines: [['30 dias e 65 s parados      99,9975%', 'acc'], ['30 dias e 108 min parados   99,7506%', 'hi'], ['artigo: 204,5 e 108,4 min   65,4%', 'bad']] };
          o.left = { t: 'A LOJA', big: '99,9975%', rows: [['MTBF', '30 dias'], ['parada', '65 s'], ['com 108 min', '99,7506%', 'dim']] };
          o.cnt = [['DISPONIBILIDADE', '99,9975%', 'acc'], ['MTBF', '30 dias', 'dim'], ['PARADA', '65 s', 'dim']]; } },
      { id: 'errado', dur: 7, title: 'E se der errado: o painel mede 35 s', yk: 'A MESMA QUEDA, DUAS MEDIDAS',
        code: ['painel: "RTO" desde a detecção = 35 s', 'cliente de SP: 65 s sem comprar', 'os 30 s da detecção somem do relatório', 'R$ 792 × 30 = R$ 23.760 fora da conta', 'o R de MTTR: repair, recovery, respond, resolve'],
        story: 'Se o painel medir o RTO como o artigo, depois da detecção, ele mostra 35 s. O cliente de SP ficou 65 s sem comprar. Os 30 s da detecção, R$ 23.760, somem do relatório. O R de MTTR também engana: a Atlassian lista quatro (repair, recovery, respond e resolve). A saída é escolher uma definição e escrevê-la ao lado do número.',
        look: 'No mostrador, a barra de 35 s do painel começa onde a do cliente já tinha 30 s.',
        key: 'Uma métrica sem definição escrita mede o que for conveniente.',
        f(o, t) { world(o, { t: 80 });
          timeline(o, 65, [['cliente', [[0, 65, 'acc', 'parado 65 s']], []], ['painel', [[30, 65, 'bad', '"RTO" 35 s']], []], ['sumiu', [[0, 30, 'bad', '30 s · R$ 23.760']], []]]);
          o.left = { t: 'O PAINEL DIZ', big: '35 s', rows: [['o cliente viu', '65 s', 'acc'], ['fora da conta', '30 s', 'bad'], ['R$', '23.760', 'bad']] };
          o.cnt = [['PAINEL', '35 s', 'bad'], ['CLIENTE', '65 s', 'acc'], ['FORA DA CONTA', 'R$ 23.760', 'bad']];
          if (t > 1) T(o, TF(174), 'parado 65 s\no painel diz 35', 'bad'); } },
    ],
    rpo: [
      { id: 'commit', dur: 6, title: 'O pedido 1061: confirmado em SP', yk: 'O 1061 DA BIA',
        code: ['20:39:59.950  a Bia cria o 1061 (R$ 108,80)', 'commit local em SP: 2 ms', '20:39:59.960  ela vê 201', 'WAL para o Rio: lag de 300 ms', 'chegaria às 20:40:00.252'],
        story: 'Às 20:39:59.950 a Bia cria o pedido 1061: um gato de pelúcia, uma caneca azul e o frete de SP, R$ 108,80. O commit em SP leva 2 ms e ela vê 201. O WAL do pedido sai para o Rio com o lag de 300 ms e chegaria às 20:40:00.252.',
        look: 'O ponto de luz na viga entre SP e o Rio é o WAL do 1061, viajando. No mostrador, a janela de lag de 300 ms.',
        key: 'Na replicação assíncrona, o banco confirma antes de a cópia chegar.',
        f(o, t) { world(o, { t: -1, wal: { f: (clk * 0.3) % 1 } }); o.on.cSP = 1;
          o.chart = { type: 'wal', crash: null };
          o.left = { t: 'O PEDIDO 1061', big: 'R$ 108,80', rows: [['criado', '20:39:59.950'], ['201', '20:39:59.960'], ['WAL no Rio', '20:40:00.252', 'acc']] };
          o.cnt = [['1061', 'confirmado em SP'], ['LAG', '300 ms', 'dim'], ['NO RIO', '20:40:00.252', 'dim']];
          if (t > 0.8) T(o, TF(174), 'Bia: 1061 · R$ 108,80\n201 às 20:39:59.960'); } },
      { id: 'janela', dur: 7, title: 'A queda e a janela de lag', act: ['Derrubar SP', 'mova a queda'], yk: 'QUEDA × JANELA',
        get code() { const L = crash < 0.252; return [`queda às 20:40:00${msOf(crash)}`, 'WAL do 1061 no Rio: 20:40:00.252', 'janela: 20:39:59.952 → 20:40:00.252', L ? 'a queda vem antes: o 1061 se perde' : 'a queda vem depois: o 1061 está no Rio', L ? 'RPO esperado: 9,9 × 0,3 = 2,97 pedidos' : 'o Rio já tem o 1061']; },
        get story() { return crash < 0.252
          ? `A queda às 20:40:00${msOf(crash)} cai dentro da janela de lag: o WAL do 1061 ainda estava a caminho e só chegaria às 20:40:00.252. O pedido existia só no disco de SP. ${crash === 0.15 ? 'Foi o que aconteceu nesta noite.' : 'Com a queda mais cedo, a janela pega o 1061 do mesmo jeito.'} Mova a queda para 20:40:00.350 e compare.`
          : 'Com a queda às 20:40:00.350, 98 ms depois de o WAL chegar ao Rio, o 1061 já está na réplica. A promoção leva o pedido junto, e a Bia não perde nada. A mesma queda, 200 ms mais tarde, muda o resultado.'; },
        get look() { return crash < 0.252 ? 'O ponto do WAL fica vermelho no meio da viga. No mostrador, a linha da queda corta a janela de lag.' : 'O ponto do WAL chega à celula-sp@rio. No mostrador, a linha da queda fica depois da janela.'; },
        key: 'O RPO é a janela de lag: o que caiu dentro dela se perde, mesmo confirmado.',
        f(o, t) { const L = crash < 0.252, f = L ? clamp((crash + 0.048) / 0.3) : 1;
          world(o, { t: 0, wal: { f: Math.min(f, sg(t, 0.2, 1.6) * f), lost: L && t > 1.6 } });
          if (!L) { o.on.pSP = 1; o.rows.pSP.rows[0] = ['1061 replicado', 'acc']; }
          o.chart = { type: 'wal', crash };
          o.left = { t: 'A QUEDA', big: '20:40:00' + msOf(crash), rows: [['WAL no Rio', '20:40:00.252'], ['1061', L ? 'perdido' : 'salvo no Rio', L ? 'bad' : 'acc']] };
          o.cnt = [['1061', L ? 'perdido' : 'salvo no Rio', L ? 'bad' : 'acc'], ['QUEDA', '20:40:00' + msOf(crash), 'dim'], ['JANELA', '.952 → .252', 'dim']];
          if (t > 1.6) T(o, TU(360, 204), L ? 'WAL do 1061\nnão chegou' : 'WAL do 1061\nchegou às .252', L ? 'bad' : 'acc'); } },
      { id: 'pedidos', dur: 6, title: 'RPO em pedidos: taxa × lag', yk: 'PERDA ESPERADA',
        code: ['celula-sp      9,9 × 0,3 = 2,97 pedidos', 'celula-recife  3,6 × 0,8 = 2,88', 'celula-mkt     12 × 0,8 = 9,6', 'síncrono com o Rio: 2 + 10 = 12 ms', 'síncrono com Recife: 2 + 80 = 82 ms'],
        story: 'O RPO é uma janela de tempo, mas o que dói é a contagem. Na celula-sp, 9,9 pedidos/s × 0,3 s = 2,97 pedidos esperados; nesta noite foi 1. Na celula-mkt, com 800 ms de lag, são 9,6. Zerar o RPO pede replicação síncrona, que custa a rede: o commit de 2 ms vira 12 ms com o Rio e 82 ms com Recife.',
        look: 'No mostrador, a perda esperada de cada célula em pedidos.',
        key: 'O RPO se mede em pedidos: taxa × lag.',
        f(o, t) { world(o, { t: -1 });
          o.chart = { type: 'rows', title: 'PERDA ESPERADA = TAXA × LAG (PEDIDOS)', max: 10, rows: [['sp', 2.97, '9,9 × 0,3 = 2,97', 'acc'], ['recife', 2.88, '3,6 × 0,8 = 2,88', 'dim'], ['mkt', 9.6, '12 × 0,8 = 9,6', 'bad']] };
          o.left = { t: 'RPO ZERO CUSTA', big: '+10 ms', rows: [['assíncrono', '2 ms'], ['síncrono Rio', '12 ms', 'acc'], ['síncrono Recife', '82 ms', 'bad']] };
          o.cnt = [['SP', '2,97 pedidos', 'acc'], ['MKT', '9,6 pedidos', 'bad'], ['ALERTA DE LAG', '500 ms', 'dim']]; } },
      { id: 'pix', dur: 8, title: 'O Pix c-7733 e o outro 1061', act: ['Seguir o Pix', 'c-7733'], yk: 'A NOITE DO 1061',
        code: ['20:40:20  a Bia paga o Pix c-7733', '20:41:10  o Davi cria o 1061 no Rio (R$ 48,80)', '          a sequência do Rio parou em 1060', '20:41:25  o webhook de c-7733 chega ao Rio', '          cobranca_id não bate → quarentena'],
        story: 'A Bia pagou o Pix c-7733 às 20:40:20, com SP fora. Às 20:41:10 o Davi cria um pedido na celula-sp@rio: duas canecas azuis e o frete, R$ 48,80, Pix c-7734. A sequência do Rio parou em 1060, então o número é 1061 de novo. Às 20:41:25 o PSP reenvia o webhook de c-7733, a loja acha um 1061 com outra cobrança e manda a mensagem para a quarentena.',
        look: 'No Rio, o 1061 do Davi; na entrada de SP, o webhook da Bia em vermelho, parado na quarentena.',
        key: 'Depois de uma promoção, a sequência reutiliza o último número replicado.',
        f(o, t) { world(o, { t: 85 }); o.rows.pSP.rows[0] = ['1061: Davi · c-7734', 'acc'];
          o.chart = { type: 'lines', title: 'O 1061 NO RIO', n: 1 + Math.floor(clamp((t - 0.3) / 4.5) * 3.999),
            lines: [['20:40:20  Bia paga o Pix c-7733 (SP fora)', 'hi'], ['20:41:10  Davi: 1061 no Rio · R$ 48,80 · c-7734', 'acc'], ['20:41:25  webhook c-7733 → 1061 do Davi?', 'bad'], ['          cobranca_id não bate → quarentena', 'bad']] };
          o.left = { t: 'DOIS PEDIDOS 1061', big: '1061 ≠ 1061', rows: [['Bia', 'c-7733 · R$ 108,80', 'bad'], ['Davi', 'c-7734 · R$ 48,80', 'acc']] };
          o.cnt = [['1061', 'reutilizado', 'bad'], ['WEBHOOK', 'quarentena', 'bad'], ['DAVI', 'R$ 48,80', 'dim']];
          if (t > 1) T(o, TF(482), 'Davi: 1061 (20:41:10)', 'acc');
          if (t > 3) T(o, TF(340), 'webhook c-7733 (20:41:25)\nquarentena', 'bad'); } },
      { id: 'errado', dur: 8, title: 'E se der errado: o RPO prometido × o medido', yk: 'AS TRÊS SAÍDAS',
        code: ['prometido: RPO de 1 s no checkout', 'medido: 0,3 s, e 1 pedido confirmado perdido', '(a) disco de SP volta às 23:40 → 1062', '(b) recriar pelo webhook + carrinho', '(c) estornar: estorno-c-7733'],
        story: 'O checkout prometia RPO de 1 s e cumpriu: a janela foi de 0,3 s. Mesmo assim a Bia perdeu um pedido que o banco confirmou. Há três saídas: esperar o disco de SP voltar (às 23:40, 3 h depois) e renumerar o pedido para 1062, recriá-lo pelo webhook e pelo carrinho, ou estornar a cobrança. Para não repetir, o id passa a ser por célula (rec-1061) ou UUIDv7, ou a sequência pula 1.000 na promoção.',
        look: 'No mostrador, as três saídas. O estoque também mente: o gato (17 → 16) e a caneca (32 → 31) voltam no Rio.',
        key: 'Cumprir o RPO em segundos não impede perder um pedido confirmado.',
        f(o, t) { world(o, { t: 85 }); o.rows.pSP.rows[0] = ['sequência: só 1 por banco', 'bad']; o.on.pSP = 'bad';
          o.chart = { type: 'lines', title: 'O PEDIDO DA BIA: TRÊS SAÍDAS', n: 1 + Math.floor(clamp((t - 0.3) / 4.5) * 3.999),
            lines: [['(a) SP volta às 23:40: 1061 da Bia → 1062', 'acc'], ['(b) recriar: webhook + carrinho (idempotência)', 'hi'], ['(c) estornar: estorno-c-7733 (saga)', 'hi'], ['conserto: id por célula (rec-1061) ou UUIDv7', 'acc']] };
          o.left = { t: 'RPO', big: '1 s × 1', rows: [['prometido', '1 s'], ['medido', '0,3 s', 'acc'], ['perdido', '1 pedido confirmado', 'bad']] };
          o.cnt = [['PROMETIDO', 'RPO 1 s', 'dim'], ['PERDIDO', '1 pedido confirmado', 'bad'], ['RECUPERADO', '1062 às 23:40', 'acc']];
          if (t > 1) T(o, TU(174, 288), 'o 1061 da Bia: só no disco de SP', 'bad'); } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone, dash) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.6);
    if (dash) x.setLineDash([u(3), u(2)]); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2)); x.setLineDash([]);
    x.textBaseline = 'middle'; return { x, u, C }; }
  // pinta o texto e engrossa o traço com um contorno da mesma cor: na textura reduzida o traço fino perde contraste
  const ink = (x, u, text, X, Y) => { x.fillText(text, X, Y); x.lineWidth = u(0.42); x.strokeStyle = x.fillStyle; x.lineJoin = 'round'; x.strokeText(text, X, Y); };
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); ink(x, u, d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = d.down ? BAD() : INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); ink(x, u, d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  const sqOff = () => theme === 'light' ? '#d4d6d6' : '#2a2c2e';
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, bad = on === 'bad' || d.down, { x, u, C } = frameBox(cv, on === 1, bad ? 'bad' : '', d.dash), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    // letra grande: no claro, o traço fino de texto miúdo some na textura reduzida (medido nos pixels, ≥ 4.5:1)
    const col = bad ? BAD() : on === 1 ? accC() : C.inkHi, tiny = Bk.w < 100, sm = Bk.h < 20;
    head(x, u, d, W_, col, tiny ? 15 : sm ? 13.5 : 15); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
    let y = 32; for (const [text, tnn] of d.rows || []) { x.fillStyle = toneC(tnn); fitFont(x, u, text, tiny ? 14 : sm ? 12.5 : 13.5, W_ - 10); ink(x, u, text, u(5), u(y)); y += sm ? 15 : 18; }
    if (d.pods) { const n = d.pods.n, sz = Math.min(12, (W_ - 10) / n);
      for (let i = 0; i < n; i++) { x.fillStyle = i < d.pods.lit ? accC() : sqOff(); x.fillRect(u(5 + i * sz + 0.8), u(H_ - 5 - sz * 0.8 + 0.8), u(sz - 1.6), u(sz * 0.8 - 1.6)); } }
    cv.tex.needsUpdate = true;
  }
  function drawRegion(Rg, d) {
    const key = JSON.stringify(d) + theme + accent.getHex(); if (Rg.key === key) return; Rg.key = key;
    const cv = Rg.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', bad = d[2] === 'bad', Hh = cv.c.height / P;
    x.fillStyle = bad ? (light ? '#f1dedb' : '#1e100d') : (light ? '#e9eaea' : '#151617'); x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = bad ? BAD() : C.line; x.lineWidth = u(bad ? 1.2 : 0.6); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = bad ? BAD() : C.inkHi; fitFont(x, u, d[0], 15, Rg.w * 0.42); ink(x, u, d[0], u(6), u(Hh - 13));
    const nw = x.measureText(d[0]).width / u(1);
    x.textAlign = 'right'; x.fillStyle = toneC(d[2]); fitFont(x, u, d[1], 11, Rg.w - nw - 18); ink(x, u, d[1], u(Rg.w - 6), u(Hh - 13)); x.textAlign = 'left';
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), ch = o.chart, lf = o.left;
    const key = JSON.stringify([lf, ch, s.id, sc, s.yk]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P, Hd = cv.c.height / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const txt = (t, X, Y, size, mw, col, al = 'left') => { x.textAlign = al; x.fillStyle = col; fitFont(x, u, t, size, mw); ink(x, u, t, u(X), u(Y)); x.textAlign = 'left'; };
    const tone = t => t === 'bad' ? BAD() : t === 'acc' ? acc : t === 'dim' ? INK() : t === 'off' ? C.line : C.inkHi;
    // coluna da esquerda: relógio, perda ou hora da queda
    let L0 = 8;
    if (lf) { L0 = 158;
      txt(lf.t, 8, 10, 8, 142, INK()); txt(lf.big, 8, 30, 16, 142, acc);
      lf.rows.slice(0, 4).forEach(([l, v, tn_], i) => { const Y = 49 + i * 23; txt(l, 8, Y, 7.8, 142, INK()); txt(v, 8, Y + 9.5, 9.4, 142, tone(tn_ || 'hi')); });
      x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(Hd - 6)); x.stroke(); }
    const R = Wd - 8, AW = R - L0;
    if (!ch) return void (cv.tex.needsUpdate = true);
    if (ch.type === 'tl') {
      txt(ch.title, L0, 10, 8.2, AW, INK());
      const lw = 44, X0 = L0 + lw, X1 = R - 4, px = v => X0 + clamp(v / ch.max) * (X1 - X0), n = ch.rows.length, rh = Math.min(19, (Hd - 44) / n);
      ch.rows.forEach(([l, segs, marks], i) => { const Y = 28 + i * rh;
        txt(l, L0, Y, 8.6, lw - 4, INK()); x.fillStyle = sqOff(); x.fillRect(u(X0), u(Y - 0.5), u(X1 - X0), u(1));
        segs.forEach(([a, b, tn_, lab]) => { if (b <= a) return; const col = tone(tn_); x.fillStyle = col; x.fillRect(u(px(a)), u(Y - 5), u(px(b) - px(a)), u(10));
          if (lab) { const w = px(b) - px(a), inside = w > 70; txt(lab, inside ? px(a) + 3 : px(b) + 3, Y, 8.2, inside ? w - 6 : X1 - px(b) - 4, inside ? (theme === 'light' ? '#f6f6f5' : '#141516') : col); } });
        marks.forEach(([v, lab, tn_]) => { const col = tone(tn_); x.fillStyle = col; x.fillRect(u(px(v) - 1.2), u(Y - 6), u(2.4), u(12)); txt(lab, px(v) + 3, Y, 8.2, 60, col); }); });
      const Yb = 28 + n * rh; x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(X0), u(Yb - 4)); x.lineTo(u(X1), u(Yb - 4)); x.stroke();
      for (let v = 0; v <= ch.max; v += 10) txt(String(v), px(v), Yb + 3, 7.6, 20, INK(), 'center');
      if (ch.cur != null) { const X = px(ch.cur); x.strokeStyle = acc; x.lineWidth = u(0.9); x.setLineDash([u(2), u(1.6)]); x.beginPath(); x.moveTo(u(X), u(18)); x.lineTo(u(X), u(Yb - 4)); x.stroke(); x.setLineDash([]); }
    } else if (ch.type === 'log') {
      // o nome e o valor vão logo acima de cada barra: na perspectiva do mostrador, uma coluna de rótulos à esquerda fica longe da barra
      txt(ch.title, L0, 10, 8.2, AW, INK());
      const X0 = L0, X1 = R - 4, lo = 1, hi = Math.log10(4000), px = v => X0 + clamp((Math.log10(v) - lo) / (hi - lo)) * (X1 - X0), rh = 23, Yax = 24 + 4 * rh;
      [[10, '10 s'], [60, '1 min'], [300, '5 min'], [900, '15 min'], [3600, '1 h']].forEach(([v, lab]) => { txt(lab, Math.max(px(v), X0 + 8), Yax + 3, 7.6, 30, INK(), 'center');
        x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(px(v)), u(20)); x.lineTo(u(px(v)), u(Yax - 4)); x.stroke(); });
      ch.rows.forEach(([l, v, tx, tn_], i) => { const Y = 22 + i * rh, col = tone(tn_);
        txt(`${l} · ${tx}`, X0, Y, 8.4, AW, tn_ === 'dim' ? INK() : col);
        x.fillStyle = tn_ === 'dim' ? INK() : col; x.fillRect(u(X0), u(Y + 5), u(px(v) - X0), u(8)); });
      (ch.metas || []).forEach(([v, lab, tn_], i) => { const X = px(v), col = tone(tn_); x.strokeStyle = col; x.lineWidth = u(1.1); x.setLineDash([u(2.5), u(2)]);
        x.beginPath(); x.moveTo(u(X), u(19)); x.lineTo(u(X), u(Yax - 4)); x.stroke(); x.setLineDash([]);
        txt(lab, i ? X + 2 : X - 2, Yax + 13, 7.8, i ? X1 - X - 4 : X - X0 - 4, col, i ? 'left' : 'right'); });
    } else if (ch.type === 'rows') {
      txt(ch.title, L0, 10, 8.2, AW, INK());
      const lw = 52, bx = L0 + lw, bw = AW - lw, rh = Math.min(26, (Hd - 30) / Math.max(3, ch.rows.length));
      ch.rows.forEach(([l, v, tx, tn_], i) => { const Y = 30 + i * rh, col = tone(tn_);
        txt(l, L0, Y, 8.6, lw - 4, INK());
        x.fillStyle = sqOff(); x.fillRect(u(bx), u(Y - 5.5), u(bw), u(11));
        x.fillStyle = col; x.fillRect(u(bx), u(Y - 5.5), u(bw * clamp(v / ch.max)), u(11));
        const inside = v / ch.max > 0.55; txt(tx, inside ? bx + 4 : bx + bw * clamp(v / ch.max) + 4, Y, 8.6, inside ? bw - 8 : bw * (1 - clamp(v / ch.max)) - 6, inside ? (theme === 'light' ? '#f6f6f5' : '#141516') : col); });
    } else if (ch.type === 'lines') {
      txt(ch.title, L0, 10, 8.2, AW, INK());
      ch.lines.slice(0, ch.n).forEach(([l, tn_], i) => txt(l, L0, 28 + i * 17, 9, AW, tone(tn_)));
    } else if (ch.type === 'wal') {
      // a janela de lag, de 20:39:59.900 a 20:40:00.400 (em s desde 20:40:00.000)
      txt('20:39:59.900 → 20:40:00.400 · JANELA DE LAG DO 1061', L0, 10, 8.2, AW, INK());
      const X0 = L0 + 4, X1 = R - 6, a0 = -0.1, a1 = 0.4, px = v => X0 + clamp((v - a0) / (a1 - a0)) * (X1 - X0), Ym = 60;
      x.fillStyle = theme === 'light' ? '#f0e2d4' : '#2a1d12'; x.fillRect(u(px(-0.048)), u(Ym - 16), u(px(0.252) - px(-0.048)), u(32));
      x.strokeStyle = acc; x.lineWidth = u(0.8); x.strokeRect(u(px(-0.048)), u(Ym - 16), u(px(0.252) - px(-0.048)), u(32));
      txt('lag 300 ms: o WAL a caminho', px(0.1), Ym - 22, 8, 150, acc, 'center');
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.beginPath(); x.moveTo(u(X0), u(Ym)); x.lineTo(u(X1), u(Ym)); x.stroke();
      [[-0.1, '.900'], [0, '.000'], [0.1, '.100'], [0.2, '.200'], [0.3, '.300'], [0.4, '.400']].forEach(([v, lab]) => { txt(lab, px(v), Ym + 26, 7.6, 30, INK(), 'center');
        x.fillStyle = C.line; x.fillRect(u(px(v) - 0.3), u(Ym + 18), u(0.6), u(4)); });
      const ev = (v, lab, col, up) => { x.fillStyle = col; x.beginPath(); x.arc(u(px(v)), u(Ym), u(2.6), 0, Math.PI * 2); x.fill(); txt(lab, px(v), up ? Ym - 8 : Ym + 9, 7.8, 70, col, 'center'); };
      ev(-0.05, '1061 .950', C.inkHi, false); ev(0.252, 'no Rio .252', acc, false);
      if (ch.crash != null) { const X = px(ch.crash), L_ = ch.crash < 0.252; x.strokeStyle = BAD(); x.lineWidth = u(1.6); x.beginPath(); x.moveTo(u(X), u(Ym - 30)); x.lineTo(u(X), u(Ym + 16)); x.stroke();
        txt('queda ' + msOf(ch.crash), X, Ym - 36, 8.4, 70, BAD(), 'center');
        txt(L_ ? 'a queda cai dentro da janela: o 1061 se perde' : 'a queda vem depois da janela: o 1061 está no Rio', L0, Hd - 14, 9.2, AW, L_ ? BAD() : acc); }
      else txt('o banco de SP já confirmou; o Rio ainda não tem o 1061', L0, Hd - 14, 9.2, AW, C.inkHi);
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = b => b ? ' class="on"' : '';
  const DATA = {
    'sp-cai': () => `<table class="h3-sum"><tr><th>quando</th><th>o que acontece</th></tr><tr${on_(step === 0)}><td>20:39:59.950</td><td>a Bia cria o 1061 (201 às .960)</td></tr><tr${on_(step === 1)}><td>20:40:00.150</td><td>SP cai (t = 0)</td></tr><tr${on_(step === 2)}><td>20:40:10 · :20 · :30</td><td>três sondas falham: MTTD 30 s</td></tr><tr${on_(step === 3)}><td>20:40:35</td><td>a réplica do Rio é promovida</td></tr><tr${on_(step === 3)}><td>20:41:00</td><td>pods da passiva a 100%</td></tr><tr${on_(step === 4)}><td>20:41:05.150</td><td>o mapa vira: RTO 65 s</td></tr><tr${on_(step === 4)}><td>20:41:10</td><td>o Davi cria o 1061 no Rio</td></tr></table><li>RTO = máx(30 + 30, 35) + 5 = <b>65 s</b>; MTTR = 65 − 30 = <b>35 s</b></li><li>SP: 9,9 × 65 = <b>643,5</b> tentativas falhas; RPO esperado 9,9 × 0,3 = <b>2,97</b> pedidos (foi 1)</li><li>Rio: 4,5 + 9,9 = <b>14,4 pedidos/s</b> (3,2×); sem nós livres, +4 min</li><li>Durações de nós e pods: modelo, não um failover rodado</li>`,
    estrategias: () => `<table class="h3-sum"><tr><th>estratégia</th><th>RPO</th><th>RTO</th><th>custo</th><th>R$ perdidos</th></tr>${ST.map((s, i) => `<tr${on_(step === i)}><td>${s.nm}</td><td>${s.rpo}</td><td>${s.rtoT}</td><td>${s.cost}</td><td>${thou(s.rs)}</td></tr>`).join('')}</table><li>R$ perdidos = 9,9 pedidos/s × R$ 80 = <b>R$ 792/s</b> × RTO</li><li>Ticket médio R$ 80 (média dos 13 pedidos da história: 79,82); custos extras relativos à infraestrutura da célula (exemplo)</li><li>Metas: checkout 5 min/1 s · catálogo 15 min/1 h · relatórios 24 h/24 h</li><li>"Ativo-passivo" do artigo = <i>warm standby</i> da AWS; o artigo não lista o backup</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>medida</th><th>a loja</th><th>o artigo</th></tr><tr${on_(step === 0)}><td>MTTD</td><td>30 s</td><td>34 min</td></tr><tr${on_(step === 1)}><td>MTTR</td><td>35 s</td><td>108,4 min</td></tr><tr${on_(step === 2)}><td>RTO</td><td>65 s</td><td>"após a detecção"</td></tr><tr${on_(step === 4)}><td>MTBF</td><td>30 dias</td><td>204,5 min</td></tr><tr${on_(step === 4)}><td>disponibilidade</td><td>99,9975%</td><td>65,4%</td></tr></table><li>A = MTBF ÷ (MTBF + MTTR); com 108 min parados: <b>99,7506%</b></li><li>As três tabelas do artigo não são os mesmos incidentes (12:00 PM × 12:00 AM; 10:02 × 11:02)</li><li>O R de MTTR (Atlassian): repair, recovery, respond, resolve</li>`,
    rpo: () => `<table class="h3-sum"><tr><th>célula</th><th>pedidos/s</th><th>lag</th><th>perda esperada</th></tr><tr${on_(step <= 2)}><td>sp</td><td>9,9</td><td>0,3 s</td><td>2,97</td></tr><tr><td>recife</td><td>3,6</td><td>0,8 s</td><td>2,88</td></tr><tr><td>mkt</td><td>12,0</td><td>0,8 s</td><td>9,6</td></tr></table><li>1061 (Bia): gato 79,90 + caneca azul 19,90 + frete SP 9,00 = <b>R$ 108,80</b>, Pix <code>c-7733</code>; estoque 17 → 16 e 32 → 31</li><li>1061 (Davi, Rio, 20:41:10): 2 canecas 39,80 + frete 9,00 = <b>R$ 48,80</b>, Pix <code>c-7734</code></li><li>Commit síncrono: <b>12 ms</b> com o Rio, <b>82 ms</b> com Recife; alerta de lag em 500 ms</li><li>O 1061 da Bia volta às 23:40 como <b>1062</b></li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  // botão de ação: mostra a ação do passo seguinte (derrubar SP, subir um degrau…) e leva até ele
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  // no RPO, a hora da queda (a aula 5 pede para mover a queda para .050 e .350)
  function crashHtml() { if (sc !== 'rpo' || cur().id !== 'janela') return '';
    return `<div class="o3-mode d3-crash" role="group" aria-label="Hora da queda">${CRASH.map(c => `<button data-crash="${c}" aria-pressed="${c === crash}">queda ${msOf(c)}</button>`).join('')}</div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${crashHtml()}
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'A conta')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'desastre') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'desastre' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-desastre3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const setCrash = c => { crash = c; lt = 0; dwell = 0; render(); SFX.bit(1); const b = document.querySelector(`[data-crash="${c}"]`); if (b) b.focus(); return true; };
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'desastre') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const c = e.target.closest('[data-crash]'); if (c) return setCrash(+c.dataset.crash);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    for (const k in RG) drawRegion(RG[k], o.rg[k]);
    RG.SP.mat.emissive.copy(badEm); RG.SP.mat.emissiveIntensity = o.rg.SP[2] === 'bad' ? 0.18 : 0;
    NAMES.forEach(nm => { const Bk = B[nm], on = o.on[nm] || 0, d = o.rows[nm];
      if (d) drawBlock(Bk, d, on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = d && d.down ? 0.12 : on === 'bad' ? 0.25 : on === 1 ? 0.3 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, BZ + Bk.h + 3], on === 1 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams);
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 950, 8, 470];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn_ = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.86 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const low = nar && innerHeight < 700 ? 1.1 : 1, span = x1 - x0 + y1 - y0, D = low * Math.max(span * 0.707 / 100 * 1.05 / (2 * tn_ * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn_ * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.47 : nar ? (low > 1 ? 0.1 : 0.07) + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn_ * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn_);
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
    if (sc === 'rpo' && cur().id === 'janela' && (e.key === 'q' || e.key === 'Q')) return setCrash(CRASH[(CRASH.indexOf(crash) + 1) % CRASH.length]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), ...Object.values(RG).map(r => r.top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; }); for (const k in RG) RG[k].key = '';
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(475, 240, -150), dist: innerWidth < 640 ? 15.5 : 18.5 } : { target: W(190, 240, 60), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–4 · arraste para girar' };
})() });
