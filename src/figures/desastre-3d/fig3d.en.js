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
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => String(Math.round(v * 10 ** n) / 10 ** n);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#6a0d06' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['sp-cai', 'estrategias', 'metricas', 'rpo'];
  const SCNAME = { 'sp-cai': 'São Paulo goes down', estrategias: 'Strategies', metricas: 'Metrics', rpo: 'RPO' };
  const SCFULL = { 'sp-cai': 'The SP outage', estrategias: 'The DR ladder', metricas: 'MTTD, MTTR, RTO', rpo: 'RPO and order 1061' };
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
    o.rg.SP = down ? ['SÃO PAULO', 'NO POWER OR NETWORK', 'bad'] : ['SÃO PAULO', '9.9 orders/s', 'dim'];
    o.rg.RJ = ['RIO', flip ? '4.5 + 9.9 = 14.4/s (3.2×)' : '4.5 orders/s', flip ? 'acc' : 'dim'];
    o.rg.RE = ['RECIFE', '3.6 + 12.0 = 15.6/s', 'dim'];
    const cel = (k, name, rate, lag, alive) => { o.rows[k] = alive ? act(name, rate, ['primary', 'dim'], w.hub ? ['NO COPY', 'bad'] : down ? ['passive dark', 'bad'] : [`copy: ${k === 'cSP' ? 'Rio' : 'SP'}, ${lag}`, 'dim']) : { ...act(name, rate, ['DOWN', 'bad'], ['the region fell', 'bad']), down: true };
      o.on[k] = alive ? (w.hub ? 'bad' : 0) : 'bad'; };
    cel('cSP', 'celula-sp', '9.9/s', '300 ms', !down); cel('cRJ', 'celula-rio', '4.5/s', '300 ms', true); cel('cRE', 'celula-recife', '3.6/s', '800 ms', true); cel('cMK', 'celula-mkt', '12/s', '800 ms', true);
    // passivas pequenas: sem meta na primeira linha (encolheria a letra); "passiva" vai na linha de baixo
    const pas = (k, name, lag) => { o.rows[k] = down ? { ...act(name, '', ['passive', 'bad'], ['DARK', 'bad']), down: true, dash: true } : { ...act(name, '', ['passive', 'dim'], [`lag ${lag}`, 'dim']), dash: true }; o.on[k] = down ? 'bad' : 0; };
    pas('pRio', 'rio', '300 ms'); pas('pRec', 'recife', '800 ms'); pas('pMkt', 'mkt', '800 ms');
    const SR = { backup: ['empty: nothing running', 'backup + WAL in objects'], pilot: ['DB + topic replicating', '0 pods'], warm: [promo ? 'DB promoted at 35 s' : 'DB: replica · lag 300 ms', `pods ${lit} of 10 (${lit * 10}%)`], ativo: ['stack at 100%, serving', 'DB writes on both sides'] }[strat];
    o.rows.pSP = { ...act('celula-sp@rio', promo ? 'PRIMARY' : strat === 'warm' ? 'passive · warm' : strat === 'pilot' ? 'pilot light' : strat === 'backup' ? 'backup' : 'active-active', [SR[0], promo || strat === 'pilot' ? 'acc' : 'dim'], [SR[1], 'dim']), pods: { n: 10, lit }, dash: !promo && strat !== 'ativo' };
    o.on.pSP = down && (flip || (t >= 30 && strat === 'warm')) ? 1 : 0;
    o.rows.mapa = act('edge-loja · map', flip ? 'flipped' : 'current v.', [flip ? 'SP → celula-sp@rio' : 'SP → celula-sp', flip ? 'acc' : 'dim'], [down && !flip && t >= 30 ? 'alert: quorum 2 of 3' : 'probes: Rio and Recife', down && !flip && t >= 30 ? 'bad' : 'dim']);
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
    { k: 'backup', nm: 'backup', rto: 2874, rtoT: '~48 min', rpo: '24 h or 5 min', cost: '~2%', rs: 2276208 },
    { k: 'pilot', nm: 'pilot light', rto: 720, rtoT: '12 min', rpo: '0.3 s', cost: '~10%', rs: 570240 },
    { k: 'warm', nm: 'warm standby', rto: 65, rtoT: '65 s', rpo: '0.3 s', cost: '~30%', rs: 51480 },
    { k: 'ativo', nm: 'active-active', rto: 35, rtoT: '35 s', rpo: '0.3 s or 0', cost: '~100%', rs: 27720 }];
  const rs = v => 'R$ ' + thou(v);
  function ladder(o, n, cur, metas) {
    o.chart = { type: 'log', title: 'RTO IN THE SAME OUTAGE (LOG SCALE) × TARGET', rows: ST.slice(0, n).map((s, i) => [s.nm, s.rto, `${s.rtoT} · ${rs(s.rs)}`, i === cur ? (s.rto > 300 ? 'bad' : 'acc') : 'dim']),
      metas: metas ? [[300, 'checkout', 'acc'], [900, 'catalog', 'hi']] : [[300, 'checkout target: 5 min', 'acc']] };
    const s = ST[cur]; if (s) o.left = { t: 'LOSS · ' + s.nm.toUpperCase(), big: rs(s.rs), rows: [['RTO', s.rtoT + (s.rto >= 600 ? ` (${thou(s.rto)} s)` : '')], ['RPO', s.rpo], ['extra cost', s.cost], ['R$ 792/s × RTO', s.rto > 300 ? 'misses the target' : 'meets 5 min', s.rto > 300 ? 'bad' : 'acc']] };
  }
  // linha do tempo da queda (0 a 70 s) com o cursor no t
  function timeline(o, t, extra) {
    const c = v => clamp(t, 0, v), rows = [
      ['probes', [], [[10, '✗', t >= 10 ? 'bad' : 'off'], [20, '✗', t >= 20 ? 'bad' : 'off'], [30, '✗ alert', t >= 30 ? 'bad' : 'off']]],
      ['DB', [[0, c(35), t >= 35 ? 'acc' : 'dim', t >= 35 ? 'promoted: 35 s' : '']], []],
      ['pods', t > 30 ? [[30, c(60), t >= 60 ? 'acc' : 'dim', t >= 60 ? '100%: 60 s' : '']] : [], []],
      ['map', t > 60 ? [[60, c(65), 'acc', t >= 65 ? '65 s' : '']] : [], []],
      ['RTO', [[0, c(65), t >= 65 ? 'acc' : 'bad', t >= 65 ? 'RTO = 65 s' : '']], []]];
    o.chart = { type: 'tl', title: 'SINCE THE OUTAGE (s) · max(30 + 30, 35) + 5 = 65', max: 70, rows: extra || rows, cur: t };
    o.left = { t: 'CLOCK', big: hora(t), rows: [['t', dec(t, 1) + ' s'], ['MTTD', t >= 30 ? '30 s' : '…', t >= 30 ? 'acc' : 'dim'], ['RTO', t >= 65 ? '65 s' : '…', t >= 65 ? 'acc' : 'dim']] };
  }

  // ── o que se vê em cada passo ──
  const STEPS = {
    'sp-cai': [
      { id: 'antes', dur: 6, title: 'Before: four cells, each with its own passive', yk: 'BLACK FRIDAY NIGHT',
        code: ['30 orders/s in the store', 'sp 9.9 · rio 4.5 · recife 3.6 · mkt 12.0', 'SP → Rio (lag 300 ms) · Rio → SP (300 ms)', 'Recife → SP (800 ms) · mkt → SP (800 ms)', '20:39:59.950: Bia creates order 1061'],
        story: 'It is Black Friday night, with 30 orders/s. The store has four cells, and each one sends its WAL to a passive cell in another region. celula-sp\'s passive sits in Rio. The other three sit in São Paulo. At 20:39:59.950 Bia creates order 1061 in celula-sp and gets 201 ten milliseconds later.',
        look: 'In front, the four cells; behind, the passives, lower and dashed. The beams in the middle are the WAL going to the passives. Three of them end in São Paulo.',
        key: 'Each cell has a copy in another region, but three of the four copies live in SP.',
        f(o, t) { world(o, { t: -1 }); o.on.cSP = 1;
          timeline(o, 0); o.left = { t: 'CLOCK', big: '20:39:59.950', rows: [['1061', '201 in 10 ms'], ['orders/s', '30'], ['copies in SP', '3 of 4', 'bad']] };
          o.cnt = [['ORDERS/S', '30'], ['COPIES IN SP', '3 of 4', 'bad'], ['1061', '201 at 20:39:59.960', 'dim']];
          if (t > 0.8) T(o, TF(174), 'Bia: order 1061\n201 at 20:39:59.960');
          if (t > 2) T(o, TU(172, 150), 'hub: 3 passives in SP', 'dim'); } },
      { id: 'queda', dur: 6, title: '20:40:00.150: the São Paulo region goes down', act: ['Bring SP down', '20:40:00.150'], yk: 't = 0',
        code: ['20:40:00.150: SP loses power and network', 'out: celula-sp (33% of orders)', 'out: 3 passives (rio, recife, mkt)', 'WAL of 1061 would reach 20:40:00.252', 'redundancy: N + 1 → N + 0'],
        story: 'At 20:40:00.150 São Paulo loses power and network. celula-sp goes offline, and with it the passives of rio, recife and mkt. The WAL of order 1061 would reach Rio at 20:40:00.252. It does not arrive. The other three cells keep selling, but with no copy.',
        look: 'The SP region turns red and dark. The WAL beam to Rio stops halfway. SP clients hit a dead cell.',
        key: 'A disaster takes down the product across a whole region, not a component.',
        f(o, t) { world(o, { t: 0, wal: { f: 0.66, lost: true } }); timeline(o, 0);
          o.cnt = [['DOWN', 'celula-sp · 9.9/s', 'bad'], ['NO COPY', 'rio · recife · mkt', 'bad'], ['t', '0 s', 'dim']];
          if (t > 0.6) T(o, TU(174, 288), 'SP fell\n20:40:00.150', 'bad');
          if (t > 1.6) T(o, TU(360, 204), 'WAL of 1061\nnever arrives', 'bad'); } },
      { id: 'detectar', dur: 7, title: 'Detection: three probes fail, MTTD = 30 s', act: ['Run the probes', '10 s × 3'], yk: 'DETECT',
        code: ['probe every 10 s, from Rio and Recife', '3 failures in a row: 10 × 3 = 30 s', 'MTTD = 30 s', 'quorum: 2 observers out of 3 (module 3)', '20:40:20: Bia\'s Pix c-7733 does not arrive'],
        story: 'Nobody knows yet that SP fell. The synthetic probes hit SP every 10 s, from Rio and Recife. Three failures in a row fire the alert, 30 s after the outage. In the middle of that, at 20:40:20, Bia pays the Pix c-7733, and the PSP webhook does not reach celula-sp.',
        look: 'The two beams on top are the probes, from Rio and Recife to SP. On the dial, the marks at 10, 20 and 30 s. The clock runs to 20:40:30.',
        key: 'Before switching, someone has to notice: that takes 30 s on its own.',
        f(o, t) { const s = 30 * sg(t, 0.4, 5.4); world(o, { t: s }); timeline(o, s);
          o.beams.push({ pts: BM.sRJ, on: true, tone: 'bad', n: 1, sp: 0.5 }, { pts: BM.sRE, on: true, tone: 'bad', n: 1, sp: 0.5 });
          const k = Math.min(3, Math.floor(s / 10 + 1e-6));
          o.cnt = [['MTTD', s >= 30 ? '30 s' : dec(s, 0) + ' s…', s >= 30 ? 'acc' : 'bad'], ['PROBES', `${k} of 3 failed`, k ? 'bad' : 'dim'], ['TIME', hora(s, false), 'dim']];
          if (s >= 20 && s < 30) T(o, TF(174), 'Pix c-7733 (20:40:20)\nwebhook does not arrive', 'bad');
          if (s >= 30) T(o, TU(783, 150), 'alert at 30 s\nquorum 2 of 3', 'bad'); } },
      { id: 'trocar', dur: 7, title: 'Promotion at 35 s, pods ready at 60 s', act: ['Promote and scale', '35 s · 60 s'], yk: 'SWITCH (IN PARALLEL)',
        code: ['DB: ttl 30 s + 5 s = 35 s since the outage', 'pods: from 30% to 100%, from the alert', '30 s (alert) + 30 s (pods) = 60 s', 'promotion runs alongside detection', 'Rio: 4.5 → 14.4 orders/s (3.2×)'],
        story: 'The database promotion does not wait for the alert. The leader key in SP expires at the 30 s ttl, and the Rio replica becomes primary at 35 s. The pod scale-up starts with the alert, at 30 s, and takes another 30 s. At 60 s celula-sp@rio is at 100%, ready for SP\'s 9.9 orders/s on top of celula-rio\'s 4.5.',
        look: 'celula-sp@rio, at the back of Rio, lights up and becomes PRIMARY. The pod squares go from 3 to 10.',
        key: 'The promotion (35 s) finishes first; what holds back the recovery is the pods, at 60 s.',
        f(o, t) { const s = 30 + 30 * sg(t, 0.4, 5.4); world(o, { t: s }); timeline(o, s);
          o.cnt = [['PODS', s >= 60 ? '10 of 10' : `${3 + Math.floor(7 * (s - 30) / 30)} of 10`, s >= 60 ? 'acc' : 'dim'], ['DB', s >= 35 ? 'promoted at 35 s' : 'replica', s >= 35 ? 'acc' : 'dim'], ['TIME', hora(s, false), 'dim']];
          if (s >= 35) T(o, TF(482), s >= 60 ? 'pods 100% at 60 s' : 'DB promoted: 35 s'); } },
      { id: 'mapa', dur: 7, title: 'The map flips at 65 s: RTO = 65 s', act: ['Flip the map', '+5 s'], yk: 'THE RTO MATH',
        code: ['RTO = max(30 + 30, 35) + 5', '    = 60 + 5 = 65 s', 'MTTD 30 s + MTTR 35 s = 65 s', 'SP: 9.9 × 65 = 643.5 failed attempts', '20:41:10: Davi creates an order: 1061'],
        story: 'With the passive ready, the router switches the map: SP clients now go to celula-sp@rio. Propagation takes 5 s. At 20:41:05.150, 65 s after the outage, SP can buy again. At 20:41:10 Davi creates an order and gets number 1061, the same as Bia\'s (lesson 5).',
        look: 'The SP clients\' beam detours around the edge of the region and enters Rio. The dial closes the RTO bar at 65 s.',
        key: 'RTO counts from the outage: max(detection + pods, promotion) + map = 65 s.',
        f(o, t) { const s = 60 + 10 * sg(t, 0.4, 5); world(o, { t: s }); timeline(o, s);
          o.cnt = [['RTO', s >= 65 ? '65 s' : dec(s, 0) + ' s…', s >= 65 ? 'acc' : 'bad'], ['MTTR', '35 s', 'dim'], ['FAILURES IN SP', '643.5 attempts', 'bad']];
          if (s >= 65) T(o, TF(340), 'map flipped: 20:41:05.150\nRTO 65 s');
          if (s >= 69.5) T(o, TF(482), 'Davi: order 1061\n20:41:10', 'dim'); } },
      { id: 'hub', dur: 7, title: 'If it goes wrong: SP was the hub of the passives', yk: 'THE DR PLAN\'S SPoF',
        code: ['passives in SP: rio, recife and mkt', 'with SP out: 3 cells with no copy', 'a 2nd failure (Rio\'s disk) loses data', 'Lena (recife) notices nothing', 'fix: spread the passives, game day'],
        story: 'The store came back, but it is fragile. São Paulo held the passives of rio, recife and mkt. Now those three cells run with no copy, and a second failure, such as Rio\'s disk, loses whatever was not replicated. Lena, in celula-recife, did not even notice the outage; her cell just went without a passive for 3 h.',
        look: 'The three live cells get a red border: NO COPY. Their passives, at the back of SP, are dark.',
        key: 'The DR plan had a single point of failure too: the hub in SP.',
        f(o, t) { world(o, { t: 75, hub: true }); timeline(o, 70);
          o.cnt = [['NO COPY', '3 cells', 'bad'], ['PASSIVES DARK', 'rio · recife · mkt', 'bad'], ['LENA', 'notices nothing', 'dim']];
          if (t > 0.8) T(o, TU(172, 150), 'hub: 3 passives\ndark with SP', 'bad');
          if (t > 2) T(o, TF(712), 'Lena: nothing changes\n(no passive for 3 h)', 'dim'); } },
    ],
    estrategias: [
      { id: 'backup', dur: 6, title: 'Backup and restore: ~48 min', yk: 'BACKUP RTO (2,874 s)',
        code: ['decision 5 min + IaC infra 20 min', 'restore 46.2 GB ÷ 50 MB/s = 924 s', 'WAL replay 5 min + pods 30 s + warm-up 2 min', 'RTO 2,874 s (~48 min) · RPO 24 h or 5 min', 'R$ 792/s × 2,874 = R$ 2,276,208'],
        story: 'The same celula-sp outage, with the reserve at each step of the ladder. On the first, nothing runs in Rio: only the backup and the WAL in object storage. Someone decides, the infrastructure comes up via IaC, the 46.2 GB database is restored at 50 MB/s and the WAL is replayed. That is ~48 min. At 9.9 orders/s and R$ 80 per order, every second down costs R$ 792.',
        look: 'In Rio, celula-sp@rio is empty: only the backup. On the dial, the backup bar goes far past the 5 min target.',
        key: 'The cheapest step (~2%) is the slowest: ~48 min and R$ 2.28M.',
        f(o, t) { world(o, { t: 80, strat: 'backup', flip: false }); ladder(o, 1, 0);
          o.cnt = [['RTO', '~48 min', 'bad'], ['LOSS', 'R$ 2,276,208', 'bad'], ['EXTRA COST', '~2%', 'dim']];
          if (t > 0.8) T(o, TF(482), 'backup: nothing running\nRTO ~48 min', 'bad'); } },
      { id: 'pilot', dur: 6, title: 'Pilot light: 12 min', act: ['Climb to pilot light', 'DB on'], yk: 'PILOT LIGHT RTO (720 s)',
        code: ['detect 30 s + human decision 5 min', 'nodes 4 min + pods 30 s + warm-up 2 min', 'RTO 720 s (12 min) · RPO 0.3 s', 'extra cost ~10%', 'R$ 792/s × 720 = R$ 570,240'],
        story: 'In pilot light, the database and the topic already replicate in Rio, but there are no pods at all. The RPO drops to 0.3 s. The RTO still adds 5 min of human decision and 4 min to bring up the nodes. That is 12 min and R$ 570,240.',
        look: 'celula-sp@rio has the database lit and the 10 pod squares dark.',
        key: 'Pilot light keeps the data, not the capacity: 12 min.',
        f(o, t) { world(o, { t: 80, strat: 'pilot', flip: false }); o.on.pSP = 1; ladder(o, 2, 1);
          o.cnt = [['RTO', '12 min', 'bad'], ['LOSS', 'R$ 570,240', 'bad'], ['EXTRA COST', '~10%', 'dim']];
          if (t > 0.8) T(o, TF(482), 'pilot light: 0 pods\nRTO 12 min', 'bad'); } },
      { id: 'warm', dur: 6, title: 'Warm standby (the article\'s active-passive): 65 s', act: ['Climb to warm standby', 'stack at 30%'], yk: 'FROM PILOT LIGHT TO WARM STANDBY',
        code: ['stack in Rio at 30%, automatic decision', 'RTO 65 s · RPO 0.3 s · cost ~30%', 'R$ 792/s × 65 = R$ 51,480', 'RTO: 720 → 65 s = −655 s (10 min 55 s)', 'loss: 570,240 → 51,480 = −R$ 518,760'],
        story: 'In warm standby the whole stack already runs in Rio at 30% and the decision is automatic. It is the design of the SP outage: 65 s. Going from pilot light to warm standby takes 655 s off the RTO, almost 11 min, and R$ 518,760 off the loss. The extra cost goes from ~10% to ~30%.',
        look: 'celula-sp@rio with 3 of 10 pods lit. The warm standby bar ends before the 5 min line.',
        key: 'Climbing a step trades fixed cost for minutes: 10 min 55 s and R$ 518,760 less.',
        f(o, t) { world(o, { t: 80, strat: 'warm' }); ladder(o, 3, 2); o.rows.pSP.rows[1] = ['pods 3 → 10 in 30 s', 'dim'];
          o.cnt = [['RTO', '65 s', 'acc'], ['LOSS', 'R$ 51,480', 'acc'], ['FROM PILOT LIGHT', '−655 s · −R$ 518,760', 'acc']];
          if (t > 0.8) T(o, TF(482), 'warm standby\nRTO 65 s'); } },
      { id: 'ativo', dur: 6, title: 'Active-active: 35 s', act: ['Climb to active-active', 'stack at 100%'], yk: 'ACTIVE-ACTIVE RTO',
        code: ['stack in Rio at 100%, serving clients', 'RTO = detect 30 s + map 5 s = 35 s', 'RPO 0.3 s (asynchronous) or 0 (synchronous)', 'synchronous: +10 ms with Rio, +80 ms with Recife', 'extra cost ~100% · R$ 27,720'],
        story: 'In active-active Rio already serves clients with the stack at 100%. There is no promotion when both regions write: what is left is detecting and flipping the map, 35 s. The RPO can go to zero with synchronous replication, paying 10 ms more on every commit with Rio. The risk is distributed, not removed: writing on both sides requires resolving conflicts.',
        look: 'celula-sp@rio with the 10 pods lit and SP clients arriving.',
        key: 'The most expensive step (~100%) takes off only 30 s more than warm standby.',
        f(o, t) { world(o, { t: 80, strat: 'ativo' }); ladder(o, 4, 3);
          o.cnt = [['RTO', '35 s', 'acc'], ['LOSS', 'R$ 27,720', 'acc'], ['EXTRA COST', '~100%', 'bad']];
          if (t > 0.8) T(o, TF(482), 'active-active\nRTO 35 s'); } },
      { id: 'metas', dur: 7, title: 'Each service\'s target decides', yk: 'STORE TARGETS (EXAMPLE)',
        code: ['checkout    RTO 5 min · RPO 1 s', 'catalogo    RTO 15 min · RPO 1 h', 'relatorios  RTO 24 h · RPO 24 h', 'checkout: only warm (65 s) and active (35 s)', 'each min of pilot light: R$ 47,520'],
        story: 'AWS says a strategy that costs more than the failure is not adopted. The question, then, is what target each service has. The checkout has to come back in 5 min: only warm standby and active-active meet it. The catalog accepts 15 min, and pilot light is enough. Reports accept 24 h, and backup is enough.',
        look: 'On the dial, the 5 and 15 min target lines over the four bars: a bar that ends before a line meets that target. Reports (24 h) are off the scale: all of them meet it.',
        key: 'The store does not pick one strategy: it picks one per service.',
        f(o, t) { world(o, { t: 80, strat: 'warm' }); ladder(o, 4, -1, true);
          o.left = { t: 'WHO MEETS THE TARGET', big: '5 min', rows: [['checkout', 'warm · active', 'acc'], ['catalog', '+ pilot light'], ['reports', '+ backup'], ['1 min more', 'R$ 47,520', 'bad']] };
          o.cnt = [['CHECKOUT', 'warm or active-active', 'acc'], ['CATALOG', 'pilot light', 'dim'], ['REPORTS', 'backup', 'dim']]; } },
      { id: 'errado', dur: 7, title: 'If it goes wrong: the plan lives in the region that fell', yk: 'WHAT LIVED IN SP',
        code: ['runbook on the wiki hosted in SP', 'pipeline and Terraform state in SP', 'DNS panel and passwords behind a login in SP', 'PSP-B credential expired (module 21)', 'fix: game day, take SP down on purpose'],
        story: 'The plan fails if it depends on something that lives in SP. The runbook is on SP\'s wiki, the pipeline and the Terraform state too, and the DNS panel asks for a login that only exists there. A plan that was never tested holds other surprises, such as PSP-B\'s expired credential. The fix is the game day: take SP down on purpose, measure the RTO and compare it with the target.',
        look: 'SP clients hit the dead region and the map does not flip: the runbook, the pipeline and the DNS went down along with SP.',
        key: 'A DR that was never tested is only a hypothesis.',
        f(o, t) { world(o, { t: 20 }); o.rows.pSP.rows[0] = ['no runbook, no pipeline', 'bad']; o.on.pSP = 'bad'; ladder(o, 4, -1);
          o.chart.rows[2][3] = 'bad'; o.chart.rows[2][2] = '65 s? never tested';
          o.left = { t: 'THE PLAN DEPENDED ON SP', big: '4 items', rows: [['runbook', 'wiki in SP', 'bad'], ['pipeline', 'Terraform in SP', 'bad'], ['DNS and passwords', 'login in SP', 'bad'], ['PSP-B', 'expired credential', 'bad']] };
          o.cnt = [['REAL RTO', 'unknown', 'bad'], ['DEPENDENCIES IN SP', 'runbook · pipeline · DNS', 'bad'], ['FIX', 'game day', 'dim']];
          if (t > 0.8) T(o, TU(174, 288), 'runbook · pipeline · DNS\nfell with SP', 'bad');
          if (t > 2) T(o, TU(783, 150), 'PSP-B: expired credential', 'bad'); } },
    ],
    metricas: [
      { id: 'mttd', dur: 6, title: 'MTTD: from the outage to detection, 30 s', yk: 'MTTD',
        code: ['start      20:40:00.150', 'detection  20:40:30 (3rd probe)', 'MTTD = 30 s', 'article: average of 5 incidents = 34 min'],
        story: 'The first measurement is the time until someone, or something, notices. In the SP outage it was the three probes: 30 s. The MTTD only exists because the probes exist.',
        look: 'On the dial, the first stretch of the timeline, from 0 to 30 s.',
        key: 'The MTTD measures detecting: 30 s.',
        f(o, t) { const s = 30 * sg(t, 0.4, 4.4); world(o, { t: s }); o.beams.push({ pts: BM.sRJ, on: true, tone: 'bad', n: 1 }, { pts: BM.sRE, on: true, tone: 'bad', n: 1 });
          timeline(o, s, [['MTTD', [[0, s, 'bad', s >= 30 ? 'MTTD 30 s' : '']], []], ['MTTR', [], []], ['RTO', [], []]]);
          o.cnt = [['MTTD', s >= 30 ? '30 s' : dec(s, 0) + ' s…', 'bad'], ['TIME', hora(s, false), 'dim']]; } },
      { id: 'mttr', dur: 7, title: 'MTTR: from detection to recovery, 35 s', act: ['Measure the recovery', 'up to the map'], yk: 'MTTR (ARTICLE DEFINITION)',
        code: ['detection       t = 30 s', 'pods ready      t = 60 s (30 s later)', 'map flips       t = 65 s (+5 s)', 'MTTR = 65 − 30 = 35 s', 'the promotion (35 s) ran in parallel'],
        story: 'The MTTR counts from detection until the store is back. After the alert, the pods take 30 s and the map another 5: 35 s. The database promotion, at 35 s since the outage, finished before the pods, so it is not part of the sum.',
        look: 'The second stretch, from 30 to 65 s. On the map, celula-sp@rio lights up and the SP beam detours to Rio.',
        key: 'The MTTR measures coming back: 35 s, with the article\'s definition.',
        f(o, t) { const s = 30 + 35 * sg(t, 0.4, 5.4); world(o, { t: s });
          timeline(o, s, [['MTTD', [[0, 30, 'dim', 'MTTD 30 s']], []], ['MTTR', [[30, s, 'acc', s >= 65 ? 'MTTR 35 s' : '']], []], ['DB', [[0, Math.min(s, 35), 'dim', s >= 35 ? '35 s (parallel)' : '']], []], ['RTO', [], []]]);
          o.cnt = [['MTTR', s >= 65 ? '35 s' : dec(s - 30, 0) + ' s…', 'acc'], ['TIME', hora(s, false), 'dim']]; } },
      { id: 'rto', dur: 6, title: 'RTO: counted from the interruption, 65 s', act: ['Add up the RTO', 'MTTD + MTTR'], yk: 'RTO = MTTD + MTTR',
        code: ['RTO = 30 + 35 = 65 s', 'article: "after detection" → would give 35 s', 'AWS: from interruption to restoration → 65 s', '20:40:00.150 → 20:41:05.150', 'RPO: 0.3 s lag = 2.97 orders'],
        story: 'The RTO is the promise of time down. The article counts it after detection, which would give 35 s. AWS counts from the interruption: for the SP client, the store was out from 20:40:00.150 to 20:41:05.150. That is 65 s.',
        look: 'The RTO bar covers both stretches, from 0 to 65 s.',
        key: 'RTO = MTTD + MTTR: the time to detect is also time down.',
        f(o, t) { world(o, { t: 66 });
          timeline(o, 65, [['MTTD', [[0, 30, 'dim', 'MTTD 30 s']], []], ['MTTR', [[30, 65, 'dim', 'MTTR 35 s']], []], ['RTO', [[0, 65 * sg(t, 0.3, 2.3), 'acc', t > 2.3 ? 'RTO 65 s (from the outage)' : '']], []]]);
          o.cnt = [['RTO', '65 s', 'acc'], ['MTTD + MTTR', '30 + 35', 'dim']];
          if (t > 2.4) T(o, TF(340), '20:40:00.150 → 20:41:05.150\nRTO 65 s'); } },
      { id: 'artigo', dur: 6, title: 'The article\'s tables, checked', yk: 'THE ARTICLE\'S AVERAGES (min)',
        code: ['MTTD 60+18+20+21+51 = 170 ÷ 5 = 34', 'MTTR 90+105+132+22+193 = 542 ÷ 5 = 108.4', 'MTBF 116+85+240+377 = 818 ÷ 4 = 204.5', 'A = 204.5 ÷ (204.5 + 108.4) = 65.4%', 'the tables are not the same incidents'],
        story: 'The article gives one table for each measurement, and the averages close: 34, 108.4 and 204.5 min. But the availability that comes out of them is 65.4%, unacceptable for any store: the numbers are didactic. And the three tables do not describe the same incidents (12:00 PM in one, 12:00 AM in another).',
        look: 'On the dial, the three averages as bars of minutes.',
        key: 'The article\'s math closes; the numbers are for learning, not for comparing.',
        f(o, t) { world(o, { t: 80 });
          o.chart = { type: 'rows', title: 'AVERAGES OF THE ARTICLE\'S TABLES (MIN)', max: 220, rows: [['MTTD', 34, '34 min (170 ÷ 5)', 'dim'], ['MTTR', 108.4, '108.4 min (542 ÷ 5)', 'acc'], ['MTBF', 204.5, '204.5 min (818 ÷ 4)', 'dim']].slice(0, 1 + Math.floor(clamp((t - 0.3) / 2.4) * 2.999)) };
          o.left = { t: 'AVAILABILITY', big: '65.4%', rows: [['MTBF', '204.5 min'], ['MTTR', '108.4 min'], ['numbers', 'didactic', 'bad']] };
          o.cnt = [['AVAILABILITY', '65.4%', 'bad'], ['MTTD · MTTR · MTBF', '34 · 108.4 · 204.5 min', 'dim']]; } },
      { id: 'mtbf', dur: 6, title: 'MTBF and availability', yk: 'A = MTBF ÷ (MTBF + MTTR)',
        code: ['30-day MTBF = 43,200 min', '65 s down = 1.083 min', '43,200 ÷ 43,201.083 = 99.9975%', 'with 108 min down: 99.7506%', 'article: 204.5 ÷ 312.9 = 65.4%'],
        story: 'The MTBF is how long the store works between one failure and the next. With one outage every 30 days and 65 s down, the availability is 99.9975%. If each recovery took the article\'s 108 min, it would drop to 99.7506%.',
        look: 'On the dial, the three availabilities, from the store to the article\'s example.',
        key: 'Failing less (MTBF) and recovering fast (MTTR) move the same number.',
        f(o, t) { world(o, { t: 80 });
          o.chart = { type: 'lines', title: 'AVAILABILITY = MTBF ÷ (MTBF + MTTR)', n: 1 + Math.floor(clamp((t - 0.3) / 3) * 2.999),
            lines: [['30 days and 65 s down      99.9975%', 'acc'], ['30 days and 108 min down   99.7506%', 'hi'], ['article: 204.5 and 108.4 min   65.4%', 'bad']] };
          o.left = { t: 'THE STORE', big: '99.9975%', rows: [['MTBF', '30 days'], ['down', '65 s'], ['with 108 min', '99.7506%', 'dim']] };
          o.cnt = [['AVAILABILITY', '99.9975%', 'acc'], ['MTBF', '30 days', 'dim'], ['DOWN', '65 s', 'dim']]; } },
      { id: 'errado', dur: 7, title: 'If it goes wrong: the dashboard measures 35 s', yk: 'THE SAME OUTAGE, TWO MEASUREMENTS',
        code: ['dashboard: "RTO" since detection = 35 s', 'SP client: 65 s unable to buy', 'the 30 s of detection vanish from the report', 'R$ 792 × 30 = R$ 23,760 left out of the math', 'the R in MTTR: repair, recovery, respond, resolve'],
        story: 'If the dashboard measures the RTO like the article, after detection, it shows 35 s. The SP client went 65 s unable to buy. The 30 s of detection, R$ 23,760, vanish from the report. The R in MTTR is misleading too: Atlassian lists four (repair, recovery, respond and resolve). The way out is to pick one definition and write it next to the number.',
        look: 'On the dial, the dashboard\'s 35 s bar starts where the client\'s bar was already at 30 s.',
        key: 'A metric with no written definition measures whatever is convenient.',
        f(o, t) { world(o, { t: 80 });
          timeline(o, 65, [['client', [[0, 65, 'acc', 'down 65 s']], []], ['dashboard', [[30, 65, 'bad', '"RTO" 35 s']], []], ['left out', [[0, 30, 'bad', '30 s · R$ 23,760']], []]]);
          o.left = { t: 'THE DASHBOARD SAYS', big: '35 s', rows: [['the client saw', '65 s', 'acc'], ['left out', '30 s', 'bad'], ['R$', '23,760', 'bad']] };
          o.cnt = [['DASHBOARD', '35 s', 'bad'], ['CLIENT', '65 s', 'acc'], ['LEFT OUT', 'R$ 23,760', 'bad']];
          if (t > 1) T(o, TF(174), 'down 65 s\ndashboard says 35', 'bad'); } },
    ],
    rpo: [
      { id: 'commit', dur: 6, title: 'Order 1061: confirmed in SP', yk: 'BIA\'S 1061',
        code: ['20:39:59.950  Bia creates 1061 (R$ 108.80)', 'local commit in SP: 2 ms', '20:39:59.960  she sees 201', 'WAL to Rio: 300 ms lag', 'would arrive at 20:40:00.252'],
        story: 'At 20:39:59.950 Bia creates order 1061: a plush cat, a blue mug and SP shipping, R$ 108.80. The commit in SP takes 2 ms and she sees 201. The order\'s WAL leaves for Rio with the 300 ms lag and would arrive at 20:40:00.252.',
        look: 'The point of light on the beam between SP and Rio is the WAL of 1061, traveling. On the dial, the 300 ms lag window.',
        key: 'With asynchronous replication, the database confirms before the copy arrives.',
        f(o, t) { world(o, { t: -1, wal: { f: (clk * 0.3) % 1 } }); o.on.cSP = 1;
          o.chart = { type: 'wal', crash: null };
          o.left = { t: 'ORDER 1061', big: 'R$ 108.80', rows: [['created', '20:39:59.950'], ['201', '20:39:59.960'], ['WAL in Rio', '20:40:00.252', 'acc']] };
          o.cnt = [['1061', 'confirmed in SP'], ['LAG', '300 ms', 'dim'], ['IN RIO', '20:40:00.252', 'dim']];
          if (t > 0.8) T(o, TF(174), 'Bia: 1061 · R$ 108.80\n201 at 20:39:59.960'); } },
      { id: 'janela', dur: 7, title: 'The outage and the lag window', act: ['Bring SP down', 'move the outage'], yk: 'OUTAGE × WINDOW',
        get code() { const L = crash < 0.252; return [`outage at 20:40:00${msOf(crash)}`, 'WAL of 1061 in Rio: 20:40:00.252', 'window: 20:39:59.952 → 20:40:00.252', L ? 'outage comes before: 1061 is lost' : 'outage comes after: 1061 is in Rio', L ? 'expected RPO: 9.9 × 0.3 = 2.97 orders' : 'Rio already has 1061']; },
        get story() { return crash < 0.252
          ? `The outage at 20:40:00${msOf(crash)} falls inside the lag window: the WAL of 1061 was still on its way and would only arrive at 20:40:00.252. The order existed only on SP\'s disk. ${crash === 0.15 ? 'That is what happened tonight.' : 'With an earlier outage, the window catches 1061 all the same.'} Move the outage to 20:40:00.350 and compare.`
          : 'With the outage at 20:40:00.350, 98 ms after the WAL reached Rio, 1061 is already on the replica. The promotion carries the order along, and Bia loses nothing. The same outage, 200 ms later, changes the result.'; },
        get look() { return crash < 0.252 ? 'The WAL point turns red in the middle of the beam. On the dial, the outage line cuts the lag window.' : 'The WAL point reaches celula-sp@rio. On the dial, the outage line falls after the window.'; },
        key: 'RPO is the lag window: what fell inside it is lost, even if confirmed.',
        f(o, t) { const L = crash < 0.252, f = L ? clamp((crash + 0.048) / 0.3) : 1;
          world(o, { t: 0, wal: { f: Math.min(f, sg(t, 0.2, 1.6) * f), lost: L && t > 1.6 } });
          if (!L) { o.on.pSP = 1; o.rows.pSP.rows[0] = ['1061 replicated', 'acc']; }
          o.chart = { type: 'wal', crash };
          o.left = { t: 'THE OUTAGE', big: '20:40:00' + msOf(crash), rows: [['WAL in Rio', '20:40:00.252'], ['1061', L ? 'lost' : 'saved in Rio', L ? 'bad' : 'acc']] };
          o.cnt = [['1061', L ? 'lost' : 'saved in Rio', L ? 'bad' : 'acc'], ['OUTAGE', '20:40:00' + msOf(crash), 'dim'], ['WINDOW', '.952 → .252', 'dim']];
          if (t > 1.6) T(o, TU(360, 204), L ? 'WAL of 1061\ndid not arrive' : 'WAL of 1061\narrived at .252', L ? 'bad' : 'acc'); } },
      { id: 'pedidos', dur: 6, title: 'RPO in orders: rate × lag', yk: 'EXPECTED LOSS',
        code: ['celula-sp      9.9 × 0.3 = 2.97 orders', 'celula-recife  3.6 × 0.8 = 2.88', 'celula-mkt     12 × 0.8 = 9.6', 'synchronous with Rio: 2 + 10 = 12 ms', 'synchronous with Recife: 2 + 80 = 82 ms'],
        story: 'RPO is a time window, but what hurts is the count. In celula-sp, 9.9 orders/s × 0.3 s = 2.97 expected orders; tonight it was 1. In celula-mkt, with 800 ms of lag, it is 9.6. Zeroing the RPO requires synchronous replication, which costs network: the 2 ms commit becomes 12 ms with Rio and 82 ms with Recife.',
        look: 'On the dial, the expected loss of each cell in orders.',
        key: 'RPO is measured in orders: rate × lag.',
        f(o, t) { world(o, { t: -1 });
          o.chart = { type: 'rows', title: 'EXPECTED LOSS = RATE × LAG (ORDERS)', max: 10, rows: [['sp', 2.97, '9.9 × 0.3 = 2.97', 'acc'], ['recife', 2.88, '3.6 × 0.8 = 2.88', 'dim'], ['mkt', 9.6, '12 × 0.8 = 9.6', 'bad']] };
          o.left = { t: 'ZERO RPO COSTS', big: '+10 ms', rows: [['asynchronous', '2 ms'], ['synchronous Rio', '12 ms', 'acc'], ['synchronous Recife', '82 ms', 'bad']] };
          o.cnt = [['SP', '2.97 orders', 'acc'], ['MKT', '9.6 orders', 'bad'], ['LAG ALERT', '500 ms', 'dim']]; } },
      { id: 'pix', dur: 8, title: 'Pix c-7733 and the other 1061', act: ['Follow the Pix', 'c-7733'], yk: 'THE NIGHT OF 1061',
        code: ['20:40:20  Bia pays Pix c-7733', '20:41:10  Davi creates 1061 in Rio (R$ 48.80)', '          Rio\'s sequence stopped at 1060', '20:41:25  webhook of c-7733 reaches Rio', '          cobranca_id does not match → quarantine'],
        story: 'Bia paid the Pix c-7733 at 20:40:20, with SP out. At 20:41:10 Davi creates an order in celula-sp@rio: two blue mugs and shipping, R$ 48.80, Pix c-7734. Rio\'s sequence stopped at 1060, so the number is 1061 again. At 20:41:25 the PSP resends the c-7733 webhook, the store finds a 1061 with a different charge and sends the message to quarantine.',
        look: 'In Rio, Davi\'s 1061; at SP\'s entrance, Bia\'s webhook in red, stuck in quarantine.',
        key: 'After a promotion, the sequence reuses the last replicated number.',
        f(o, t) { world(o, { t: 85 }); o.rows.pSP.rows[0] = ['1061: Davi · c-7734', 'acc'];
          o.chart = { type: 'lines', title: '1061 IN RIO', n: 1 + Math.floor(clamp((t - 0.3) / 4.5) * 3.999),
            lines: [['20:40:20  Bia pays Pix c-7733 (SP out)', 'hi'], ['20:41:10  Davi: 1061 in Rio · R$ 48.80 · c-7734', 'acc'], ['20:41:25  webhook c-7733 → Davi\'s 1061?', 'bad'], ['          cobranca_id does not match → quarantine', 'bad']] };
          o.left = { t: 'TWO ORDERS 1061', big: '1061 ≠ 1061', rows: [['Bia', 'c-7733 · R$ 108.80', 'bad'], ['Davi', 'c-7734 · R$ 48.80', 'acc']] };
          o.cnt = [['1061', 'reused', 'bad'], ['WEBHOOK', 'quarantine', 'bad'], ['DAVI', 'R$ 48.80', 'dim']];
          if (t > 1) T(o, TF(482), 'Davi: 1061 (20:41:10)', 'acc');
          if (t > 3) T(o, TF(340), 'webhook c-7733 (20:41:25)\nquarantine', 'bad'); } },
      { id: 'errado', dur: 8, title: 'If it goes wrong: the promised RPO × the measured one', yk: 'THE THREE WAYS OUT',
        code: ['promised: 1 s RPO on checkout', 'measured: 0.3 s, and 1 confirmed order lost', '(a) SP disk comes back at 23:40 → 1062', '(b) recreate via webhook + cart', '(c) refund: estorno-c-7733'],
        story: 'The checkout promised a 1 s RPO and delivered: the window was 0.3 s. Even so, Bia lost an order the database confirmed. There are three ways out: wait for SP\'s disk to come back (at 23:40, 3 h later) and renumber the order to 1062, recreate it from the webhook and her cart, or refund the charge. To avoid repeating it, the id becomes per cell (rec-1061) or UUIDv7, or the sequence skips ahead 1,000 on promotion.',
        look: 'On the dial, the three ways out. Stock lies too: the cat (17 → 16) and the mug (32 → 31) come back in Rio.',
        key: 'Meeting the RPO in seconds does not prevent losing a confirmed order.',
        f(o, t) { world(o, { t: 85 }); o.rows.pSP.rows[0] = ['sequence: only 1 per database', 'bad']; o.on.pSP = 'bad';
          o.chart = { type: 'lines', title: 'BIA\'S ORDER: THREE WAYS OUT', n: 1 + Math.floor(clamp((t - 0.3) / 4.5) * 3.999),
            lines: [['(a) SP comes back at 23:40: Bia\'s 1061 → 1062', 'acc'], ['(b) recreate: webhook + cart (idempotency)', 'hi'], ['(c) refund: estorno-c-7733 (saga)', 'hi'], ['fix: id per cell (rec-1061) or UUIDv7', 'acc']] };
          o.left = { t: 'RPO', big: '1 s × 1', rows: [['promised', '1 s'], ['measured', '0.3 s', 'acc'], ['lost', '1 confirmed order', 'bad']] };
          o.cnt = [['PROMISED', 'RPO 1 s', 'dim'], ['LOST', '1 confirmed order', 'bad'], ['RECOVERED', '1062 at 23:40', 'acc']];
          if (t > 1) T(o, TU(174, 288), 'Bia\'s 1061: only on SP\'s disk', 'bad'); } },
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
      txt('20:39:59.900 → 20:40:00.400 · LAG WINDOW OF 1061', L0, 10, 8.2, AW, INK());
      const X0 = L0 + 4, X1 = R - 6, a0 = -0.1, a1 = 0.4, px = v => X0 + clamp((v - a0) / (a1 - a0)) * (X1 - X0), Ym = 60;
      x.fillStyle = theme === 'light' ? '#f0e2d4' : '#2a1d12'; x.fillRect(u(px(-0.048)), u(Ym - 16), u(px(0.252) - px(-0.048)), u(32));
      x.strokeStyle = acc; x.lineWidth = u(0.8); x.strokeRect(u(px(-0.048)), u(Ym - 16), u(px(0.252) - px(-0.048)), u(32));
      txt('lag 300 ms: the WAL on its way', px(0.1), Ym - 22, 8, 150, acc, 'center');
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.beginPath(); x.moveTo(u(X0), u(Ym)); x.lineTo(u(X1), u(Ym)); x.stroke();
      [[-0.1, '.900'], [0, '.000'], [0.1, '.100'], [0.2, '.200'], [0.3, '.300'], [0.4, '.400']].forEach(([v, lab]) => { txt(lab, px(v), Ym + 26, 7.6, 30, INK(), 'center');
        x.fillStyle = C.line; x.fillRect(u(px(v) - 0.3), u(Ym + 18), u(0.6), u(4)); });
      const ev = (v, lab, col, up) => { x.fillStyle = col; x.beginPath(); x.arc(u(px(v)), u(Ym), u(2.6), 0, Math.PI * 2); x.fill(); txt(lab, px(v), up ? Ym - 8 : Ym + 9, 7.8, 70, col, 'center'); };
      ev(-0.05, '1061 .950', C.inkHi, false); ev(0.252, 'in Rio .252', acc, false);
      if (ch.crash != null) { const X = px(ch.crash), L_ = ch.crash < 0.252; x.strokeStyle = BAD(); x.lineWidth = u(1.6); x.beginPath(); x.moveTo(u(X), u(Ym - 30)); x.lineTo(u(X), u(Ym + 16)); x.stroke();
        txt('outage ' + msOf(ch.crash), X, Ym - 36, 8.4, 70, BAD(), 'center');
        txt(L_ ? 'the outage falls inside the window: 1061 is lost' : 'the outage comes after the window: 1061 is in Rio', L0, Hd - 14, 9.2, AW, L_ ? BAD() : acc); }
      else txt('SP\'s database already confirmed; Rio does not have 1061 yet', L0, Hd - 14, 9.2, AW, C.inkHi);
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = b => b ? ' class="on"' : '';
  const DATA = {
    'sp-cai': () => `<table class="h3-sum"><tr><th>when</th><th>what happens</th></tr><tr${on_(step === 0)}><td>20:39:59.950</td><td>Bia creates 1061 (201 at .960)</td></tr><tr${on_(step === 1)}><td>20:40:00.150</td><td>SP goes down (t = 0)</td></tr><tr${on_(step === 2)}><td>20:40:10 · :20 · :30</td><td>three probes fail: MTTD 30 s</td></tr><tr${on_(step === 3)}><td>20:40:35</td><td>the Rio replica is promoted</td></tr><tr${on_(step === 3)}><td>20:41:00</td><td>passive pods at 100%</td></tr><tr${on_(step === 4)}><td>20:41:05.150</td><td>the map flips: RTO 65 s</td></tr><tr${on_(step === 4)}><td>20:41:10</td><td>Davi creates 1061 in Rio</td></tr></table><li>RTO = max(30 + 30, 35) + 5 = <b>65 s</b>; MTTR = 65 − 30 = <b>35 s</b></li><li>SP: 9.9 × 65 = <b>643.5</b> failed attempts; expected RPO 9.9 × 0.3 = <b>2.97</b> orders (it was 1)</li><li>Rio: 4.5 + 9.9 = <b>14.4 orders/s</b> (3.2×); with no free nodes, +4 min</li><li>Node and pod durations: a model, not a real failover</li>`,
    estrategias: () => `<table class="h3-sum"><tr><th>strategy</th><th>RPO</th><th>RTO</th><th>cost</th><th>R$ lost</th></tr>${ST.map((s, i) => `<tr${on_(step === i)}><td>${s.nm}</td><td>${s.rpo}</td><td>${s.rtoT}</td><td>${s.cost}</td><td>${thou(s.rs)}</td></tr>`).join('')}</table><li>R$ lost = 9.9 orders/s × R$ 80 = <b>R$ 792/s</b> × RTO</li><li>Average ticket R$ 80 (average of the story\'s 13 orders: 79.82); extra costs relative to the cell\'s infrastructure (example)</li><li>Targets: checkout 5 min/1 s · catalog 15 min/1 h · reports 24 h/24 h</li><li>The article\'s "active-passive" = AWS\'s <i>warm standby</i>; the article does not list backup</li>`,
    metricas: () => `<table class="h3-sum"><tr><th>measure</th><th>the store</th><th>the article</th></tr><tr${on_(step === 0)}><td>MTTD</td><td>30 s</td><td>34 min</td></tr><tr${on_(step === 1)}><td>MTTR</td><td>35 s</td><td>108.4 min</td></tr><tr${on_(step === 2)}><td>RTO</td><td>65 s</td><td>"after detection"</td></tr><tr${on_(step === 4)}><td>MTBF</td><td>30 days</td><td>204.5 min</td></tr><tr${on_(step === 4)}><td>availability</td><td>99.9975%</td><td>65.4%</td></tr></table><li>A = MTBF ÷ (MTBF + MTTR); with 108 min down: <b>99.7506%</b></li><li>The article\'s three tables are not the same incidents (12:00 PM × 12:00 AM; 10:02 × 11:02)</li><li>The R in MTTR (Atlassian): repair, recovery, respond, resolve</li>`,
    rpo: () => `<table class="h3-sum"><tr><th>cell</th><th>orders/s</th><th>lag</th><th>expected loss</th></tr><tr${on_(step <= 2)}><td>sp</td><td>9.9</td><td>0.3 s</td><td>2.97</td></tr><tr><td>recife</td><td>3.6</td><td>0.8 s</td><td>2.88</td></tr><tr><td>mkt</td><td>12.0</td><td>0.8 s</td><td>9.6</td></tr></table><li>1061 (Bia): plush cat 79.90 + blue mug 19.90 + SP shipping 9.00 = <b>R$ 108.80</b>, Pix <code>c-7733</code>; stock 17 → 16 and 32 → 31</li><li>1061 (Davi, Rio, 20:41:10): 2 mugs 39.80 + shipping 9.00 = <b>R$ 48.80</b>, Pix <code>c-7734</code></li><li>Synchronous commit: <b>12 ms</b> with Rio, <b>82 ms</b> with Recife; lag alert at 500 ms</li><li>Bia\'s 1061 comes back at 23:40 as <b>1062</b></li>`,
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
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${crashHtml()}
      ${actHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'desastre') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(475, 240, -150), dist: innerWidth < 640 ? 15.5 : 18.5 } : { target: W(190, 240, 60), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
