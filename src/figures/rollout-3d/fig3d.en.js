// 3D figure (iso-glow), English copy: pedidos 2.4.0 → 2.5.0 going to production by five paths (rollback, recreate, rolling,
// blue/green, canary). In front, the customers and lb-loja releasing the traffic (5 orders/s) and pg-pedidos; in the middle,
// six pod slots (2.4.0 graphite, 2.5.0 sodium); behind, on the left, the scenario piece (revisions, smoke test,
// analysis, the 10 catalogo pods) and, on the right, the display (counters, the math or the YAML, the result).
// Scenarios (buttons and ?mode=rollback|recreate|rolling|bluegreen|canary; ?step=N opens at step N).
// Data: docs/escrita/deployment-brief.md (frete 0.00 in Recife, Lena's 1059 64.00 → 49.00, 5 orders/s with 1 from Recife,
// 30 s pods, 40 s recreate, 90 s rolling, R$ 54,000 · R$ 450 · R$ 2,250, 0.99^150 = 22%, 298 requests).
FIGS3D.push({ id: 'rollout', name: 'Rollout', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lin = (t, a, b, v0, v1) => v0 + (v1 - v0) * clamp((t - a) / (b - a));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const brl = n => 'R$ ' + thou(n);
  const pct = f => Math.round(f * 100) + '%';
  // the Tuesday clock: seconds after 14:00:00
  const pad = n => String(n).padStart(2, '0');
  const hms = s => { const tot = Math.floor(50400 + s); return `${pad(Math.floor(tot / 3600))}:${pad(Math.floor(tot / 60) % 60)}:${pad(tot % 60)}`; };
  const secs = s => Math.floor(s) + ' s';
  // text colors: in light, very dark versions (the pixel on screen has to give ≥ 4.5:1 after the texture is downscaled)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['rollback', 'recreate', 'rolling', 'bluegreen', 'canary'];
  const SCNAME = { rollback: 'Rollback', recreate: 'Recreate', rolling: 'Rolling', bluegreen: 'Blue/<wbr>Green', canary: 'Canary' };
  const SCFULL = { rollback: 'Deploy and rollback', recreate: 'Recreate (Big Bang)', rolling: 'Rolling update', bluegreen: 'Blue/Green', canary: 'Canary' };
  const AULA = { rollback: 'aula-1-deploy-e-rollback', recreate: 'aula-2-big-bang-recreate', rolling: 'aula-3-rolling-updates', bluegreen: 'aula-4-blue-green', canary: 'aula-6-canary-releases' };
  let clk = 0, sc = 'canary', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-rollout3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  // buttons of a step: the smoke test order, the blue window, the canary analysis
  const ACTS = {
    teste: { label: 'Test order', opts: [['without Recife', 'SP ZIP code'], ['with Recife', 'ZIP 50000–52999']] },
    janela: { label: 'scaleDownDelaySeconds', opts: [['30 s', 'Argo default'], ['60 s', 'the lab'], ['10 min', 'example']] },
    analise: { label: 'What the analysis measures', opts: [['5xx only', 'the lab'], ['+ zero shipping', 'the store']] },
  };
  const actv = { teste: 0, janela: 1, analise: 0 };

  // ── geometria ──
  const PL = 7;
  plateWith(g0, 800, 460, [[14, 14], [786, 14], [14, 446], [786, 446]]);
  hazeAndShadow(g0, 400, 230, 9.2, 5.6);
  // o mostrador fica suspenso atrás, à direita, em dois pés
  const SX0 = 370, SZ = PL + 46, SW = 416, SH = SW * 143 / 416;
  rbox(SX0, 10, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(SX0 + 20, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(SX0 + SW - 30, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', SX0 + 4, 22, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // as peças: cada cenário levanta só as suas (as outras descem para dentro da prancha)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, h < 16 ? 4 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, w, d, h, key: '', f: 0, pos: [x, y] };
  }
  // seis vagas de pod no meio
  const PX = i => 30 + i * 126, PW = 110, PY = 175, PD = 95, PH = 30, PC = i => PX(i) + PW / 2;
  for (let i = 0; i < 6; i++) block('p' + i, PX(i), PY, PW, PD, PH);
  // treze vagas pequenas atrás: os 10 pods do catalogo e a folga do maxSurge (3)
  const CXc = j => 30 + j * 26, CW_ = 23, CY = 50, CD = 60, CCc = j => CXc(j) + CW_ / 2;
  for (let j = 0; j < 13; j++) block('c' + j, CXc(j), CY, CW_, CD, 16, 4);
  // atrás, à esquerda: a peça do cenário
  block('rev', 30, 40, 320, 90, 14); block('tst', 30, 40, 320, 90, 18); block('ana', 30, 40, 320, 90, 18);
  // na frente: clientes, lb-loja, pg-pedidos
  block('cli', 30, 335, 180, 85, 22); block('lb', 250, 335, 290, 85, 26); block('db', 580, 335, 190, 85, 18);
  const NAMES = Object.keys(B);
  creases(first);

  // cabos grossos (vigas) e pontos (o tráfego e a ficha 1059)
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 72 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 30 }, () => { const mat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }); const g = new THREE.Group(); g0.add(g);
    const m = new THREE.Mesh(BOX, mat); m.scale.setScalar(11 * TS); g.add(m); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, m, mat, glow }; });
  const OLD = () => theme === 'light' ? 0x4b5054 : 0xa3a8ac;
  let nDot = 0;
  function dot(p, tone, big) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p)); D.m.scale.setScalar((big ? 16 : 11) * TS);
    if (tone === 'bad') D.mat.color.set(BAD()); else if (tone === 'old') D.mat.color.set(OLD()); else D.mat.color.copy(accent);
    moveGlow(D.glow, p, tone === 'old' ? 0 : tone === 'bad' ? 0.5 : big ? 1.1 : 0.7); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on || b.tone ? 5.5 : 3.6) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
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
  const TAGS = Array.from({ length: 8 }, () => tag(11));
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);

  // ── cabos ──
  const LBX = 395, LANEY = 305, LANEZ = 48;
  const laneX = k => LBX + (k - 2.5) * 22;
  const podLane = i => [[laneX(i), 335, 26], [laneX(i), LANEY, LANEZ], [PC(i), LANEY, LANEZ], [PC(i), PY + PD, 22]];
  const catLane = j => [[LBX, 335, 26], [LBX, 150, LANEZ], [CCc(j), 150, LANEZ], [CCc(j), CY + CD, 12]];
  const refLane = k => [[laneX(k), 335, 26], [laneX(k), LANEY - 4, LANEZ + 2], [laneX(k), 335, 26]];
  const CLI = [[210, 377, 16], [250, 377, 16]];
  // the 1059 token: from the customers to the pod and from the pod to pg-pedidos
  const lenaIn = i => [[120, 377, 34], [LBX, 377, 40], [LBX, LANEY + 2, LANEZ + 10], [PC(i), LANEY + 2, LANEZ + 10], [PC(i), PY + PD, 26]];
  const lenaOut = i => [[PC(i) + 20, PY + PD, 12], [PC(i) + 20, 292, 12], [675, 292, 12], [675, 335, 12]];
  // from the back piece (test, analysis) to the back of the pods
  const backLane = i => [[190, 130, 14], [190, 152, 30], [PC(i), 152, 30], [PC(i), PY, 18]];
  const rev = pts => pts.slice().reverse();
  function pk(o, pts, f, label, tone = '', big) {
    if (f <= 0 || f >= 1) return; const p = alongPts(pts, cumLen(pts), f); o.dots.push([p, tone, big]);
    if (label) o.tags.push([p[0], p[1], p[2] + 20, label, tone === 'old' ? 'hi' : tone || 'acc']);
  }
  const go_ = (t, a, b) => lin(t, a, b, 0, 1);
  function send(o, pts, t, a, b, label, tone = '') { const f = go_(t, a, b); if (f > 0 && f < 1) o.beams.push({ pts, on: true, tone }); pk(o, pts, f, label, tone); return f >= 1; }

  // ── default content of the pieces ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  // a pod: v = 'old' (2.4.0) or 'new' (2.5.0); st = ok, start (with bar 0..1), stop, bad
  const P = (o, i, v, st = 'ok', x = {}) => { o.pods[i] = { v, st, ...x }; };
  const C = (o, j, v, st = 'ok', x = {}) => { o.cat[j] = { v, st, ...x }; };
  const db = (o, ...rows) => { o.rows.db = act('pg-pedidos', 'DB', ...rows); };
  const lb = (o, ...rows) => { o.rows.lb = act('lb-loja', '', ...rows); };
  function base() {
    const o = { show: { cli: 1, lb: 1, db: 1 }, on: {}, rows: {}, beams: [], tags: [], dots: [], cnt: [], res: [], pods: [], cat: [], lanes: null, lena: null };
    o.rows.cli = act('customers', '', ['5 orders/s', 'acc'], ['SP 55 · Rio 25 · Recife 20', 'dim']);
    lb(o, ['round robin', 'dim'], ['5 orders/s', 'dim']);
    db(o, ['pedidos table', 'dim'], ['frete 0.00: 0 rows', 'dim']);
    if (sc === 'rollback') { o.show.rev = 1; o.rows.rev = act('revisions', 'LIMIT: 10', ['2.4.0 · current', 'acc'], ['—', 'dim']); }
    if (sc === 'bluegreen') { o.show.tst = 1; o.rows.tst = act('smoke test', 'NO CUSTOMER', ['through the preview (green)', 'dim'], ['—', 'dim']); }
    if (sc === 'canary') { o.show.ana = 1; o.rows.ana = act('analysis', 'EVERY STEP', ['waits for the step', 'dim'], ['—', 'dim']); }
    o.beams.push({ pts: CLI });
    return o;
  }
  // slice of the traffic: list [target, weight]; target 'pN' (pod), 'cN' (catalogo) or 'x' (503, back from lb-loja)
  const lanes = (o, ...w) => { o.lanes = w.filter(([, f]) => f > 0); };
  const even = (o, ...ids) => lanes(o, ...ids.map(i => ['p' + i, 1 / ids.length]));
  const lena = (o, i, t0, ok, t) => { o.lena = { i, t0, ok }; };
  const LENA = '1059 · Lena · Recife';

  // ── what shows at each step ──
  const STEPS = {
    rollback: [
      { id: 'cenario', dur: 6, title: 'Tuesday, 14:00: 2.4.0 serves 5 orders/s', yk: 'THE SCENARIO',
        code: ['pedidos 2.4.0 · 3 pods · 30 orders/s each', '5 orders/s: SP 55% · Rio 25% · Recife 20%', 'Recife: 1 order/s', '1059 · Lena: black T-shirt 49.00', '         + Recife shipping 15.00 = 64.00'],
        story: 'Tuesday, <b>14:00</b>, an ordinary day: <b>5 orders/s</b> reach <code>lb-loja</code>, which splits them among the <b>3 pods</b> of <code>pedidos</code> <b>2.4.0</b>. One order in five is from Recife: <b>1 per second</b>. Lena (<code>lena-77</code>) creates order <b>1059</b>: 1 black T-shirt, 49.00, plus 15.00 of shipping to Recife, <b>64.00</b>.',
        look: 'The dots leave lb-loja and split among the three gray pods (2.4.0). Lena\'s 1059 token lands on one of them and writes 64.00 to pg-pedidos.',
        key: 'Up to here, there is only one version live, and it calculates the Recife shipping.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2); lena(o, 1, 0.6, true);
          const done = t > 4.4; db(o, ['1059 · ' + (done ? '64.00' : '…'), done ? 'acc' : 'dim'], ['frete 0.00: 0 rows', 'dim']);
          o.cnt = [['ORDERS/S', '5'], ['ON 2.5.0', '0%', 'dim'], ['1059', done ? '64.00' : '…', 'dim']];
          o.res = done ? [['1059 saved: 64.00', 'acc']] : []; } },
      { id: 'publica', dur: 7, title: 'Deploy: the pedidos:2.5.0 image goes to production', yk: 'CI/CD AND THE REVISIONS',
        code: ['commit → image pedidos:2.5.0', '       → tests → production', 'kubectl rollout history deployment/pedidos', '  previous  2.4.0', '  current   2.5.0', 'revisionHistoryLimit: 10 (default)'],
        story: 'A commit becomes the <code>pedidos:2.5.0</code> image, passes the tests and goes to production. 2.5.0 writes the shipping in its own column and calculates it by <b>ZIP code range</b>. Deploying is putting the version live; releasing is the customer starting to use it. Kubernetes keeps the previous revision: <code>revisionHistoryLimit</code> is <b>10</b> by default, and <b>0</b> erases the chance to go back.',
        look: 'On the revisions shelf, at the back, 2.5.0 enters as current and 2.4.0 is kept. The pods change from gray to sodium, one at a time.',
        key: 'Only whoever kept the previous revision can go back.',
        f(o, t) { let n = 0; [0, 1, 2].forEach(i => { const nw = t > 1.4 + i * 1.3; if (nw) n++; P(o, i, nw ? 'new' : 'old'); }); even(o, 0, 1, 2);
          o.rows.rev = act('revisions', 'LIMIT: 10', ['2.5.0 · current', 'acc'], ['2.4.0 · previous (kept)', 'dim']); o.on.rev = 1;
          o.cnt = [['ON 2.5.0', pct(n / 3)], ['REVISIONS', '2 of 10', 'dim'], ['ROLLOUT', n === 3 ? 'complete' : 'in progress', 'dim']];
          o.res = n === 3 ? [['2.5.0 live; 2.4.0 kept', 'acc']] : []; } },
      { id: 'defeito', dur: 7, title: 'Lena\'s 1059 goes out with frete = 0.00, and everything looks healthy', yk: 'WHAT 2.5.0 ANSWERS',
        code: ['POST /pedidos → 201 Created', '1059: 49.00 + frete 0.00 = 49.00', 'ZIP 50000–52999 outside the new table', '/healthcheck → 200', 'errors: 0% · latency: the same'],
        story: 'The new shipping table <b>does not have the Recife ZIP range</b> (50000–52999) and returns <code>frete = 0.00</code>. Lena\'s 1059 goes out for <b>49.00</b> instead of 64.00. 2.5.0 answers <code>201</code>, <code>/healthcheck</code> gives <code>200</code>, latency is the same and the error rate is <b>0%</b>. For every Recife order the store loses <b>15.00</b>, one per second.',
        look: 'The 1059 token enters a sodium pod and reaches pg-pedidos in red: 49.00. The zero-shipping counter goes up one per second.',
        key: 'The defect does not take anything down; only a business metric sees it.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'new')); even(o, 0, 1, 2); lena(o, 1, 0.4, false); o.rows.rev = act('revisions', 'LIMIT: 10', ['2.5.0 · current', 'acc'], ['2.4.0 · previous', 'dim']);
          const s = Math.floor(lin(t, 4.2, 9, 1, 6)), done = t > 4.2;
          db(o, ['1059 · ' + (done ? '49.00' : '…'), done ? 'bad' : 'dim'], ['frete 0.00: ' + (done ? s : 0) + ' rows', done ? 'bad' : 'dim']); if (done) o.on.db = 'bad';
          o.cnt = [['FRETE 0.00', done ? String(s) : '0', done ? 'bad' : ''], ['LOSS', brl(done ? 15 * s : 0), done ? 'bad' : 'dim'], ['HTTP ERRORS', '0%', 'dim']];
          o.res = done ? [['201, healthy and wrong', 'bad']] : []; } },
      { id: 'percebe', dur: 7, title: '60 min later, finance notices: 3,600 orders', yk: 'THE MATH',
        code: ['Recife: 5 × 20% = 1 order/s', '1/s × 3,600 s = 3,600 orders', '3,600 × 15.00 = R$ 54,000', 'found at 23:00 (9 h later):', '32,400 orders · R$ 486,000'],
        story: 'Nobody notices through pod health, because it is good. At <b>15:00</b>, one hour later, finance finds the Recife shipping odd. In 60 min there were <b>3,600</b> orders with zero shipping: <b>R$ 54,000</b>. If the defect only showed up at 23:00, in the module 6 report, it would be 9 h, 32,400 orders and R$ 486,000.',
        look: 'The clock runs from 14:00 to 15:00 and pg-pedidos piles up red rows up to 3,600.',
        key: 'Blast radius = fraction exposed × time until noticed × cost per wrong order.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'new')); even(o, 0, 1, 2); o.rows.rev = act('revisions', 'LIMIT: 10', ['2.5.0 · current', 'acc'], ['2.4.0 · previous', 'dim']);
          const s = lin(t, 0.4, 4.6, 0, 3600), n = Math.floor(s);
          db(o, ['frete 0.00: ' + thou(n) + ' rows', 'bad'], ['loss: ' + brl(15 * n), 'bad']); o.on.db = 'bad';
          if (n >= 3600) T(o, [675, 360, 52], '3,600 orders · R$ 54,000', 'bad');
          o.cnt = [['CLOCK', hms(s)], ['FRETE 0.00', thou(n), 'bad'], ['LOSS', brl(15 * n), 'bad']];
          o.res = n >= 3600 ? [['1 h of defect: R$ 54,000', 'bad']] : []; } },
      { id: 'undo', dur: 8, title: 'kubectl rollout undo: back to 2.4.0 in 90 s', yk: 'THE COMMAND',
        code: ['kubectl rollout undo deployment/pedidos', '→ back to the 2.4.0 ReplicaSet', 'rolling: 3 waves × 30 s = 90 s', '% on 2.5.0: 100 → 67 → 33 → 0', 'the code is 2.4.0 again'],
        story: 'The team runs <code>kubectl rollout undo deployment/pedidos</code>. Kubernetes goes back to the previous ReplicaSet, 2.4.0, with the same rolling: one pod at a time, <b>30 s</b> each, <b>90 s</b> in total. The 2.4.0 pods charge 15.00 of shipping to Recife again.',
        look: 'The pods go back from sodium to gray, one every 30 s. On the shelf, 2.4.0 becomes the current one again.',
        key: 'Rollback swaps the code in 90 s.',
        f(o, t) { const s = lin(t, 0.5, 6, 0, 90); let n = 0;
          [0, 1, 2].forEach(i => { const back = s >= 30 * (i + 1), st = !back && s >= 30 * i ? 'start' : 'ok'; if (!back) n++;
            P(o, i, back ? 'old' : 'new', 'ok', st === 'start' ? { sub: '2.4.0 in ' + Math.ceil(30 * (i + 1) - s) + ' s' } : {}); });
          even(o, 0, 1, 2); const ok = s >= 90;
          o.rows.rev = act('revisions', 'LIMIT: 10', [ok ? '2.4.0 · current again' : 'going back to 2.4.0', 'acc'], ['2.5.0 · previous', 'dim']); o.on.rev = 1;
          db(o, ['frete 0.00: 3,600 rows', 'bad'], ['loss: R$ 54,000', 'bad']); o.on.db = 'bad';
          o.cnt = [['TIME', secs(s)], ['ON 2.5.0', pct(n / 3)], ['FRETE 0.00', '3,600', 'bad']];
          o.res = ok ? [['90 s: the code is 2.4.0', 'acc']] : []; } },
      { id: 'dado', dur: 7, title: 'What if it goes wrong: the code came back, the 3,600 rows did not', yk: 'THE FIX (SKETCH)',
        code: ['3,600 rows still have frete 0.00', 'trail: app_versao = 2.5.0 (or trace_id)', 'UPDATE pedidos', '   SET frete = 15.00, total = total + 15.00', " WHERE app_versao = '2.5.0'", '   AND ZIP in 50000–52999'],
        story: 'The pods are 2.4.0 now, and pg-pedidos still holds <b>3,600</b> Recife orders saved with frete 0.00. The rollback swaps the code, <b>not the data</b>. Whoever wrote them left a trail: the <code>app_versao</code> column (or the <code>trace_id</code> in the log, module 6). The fix is a reconciliation <code>UPDATE</code> over only those rows; lesson 8 shows why it goes in batches.',
        look: 'The three pods are gray again, but pg-pedidos is still red: 3,600 rows. No cable goes back to undo them.',
        key: 'Rollback swaps the code, not the data.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2);
          o.rows.rev = act('revisions', 'LIMIT: 10', ['2.4.0 · current', 'acc'], ['2.5.0 · previous', 'dim']);
          db(o, ['frete 0.00: 3,600 rows', 'bad'], ['app_versao = 2.5.0', 'bad']); o.on.db = 'bad';
          if (t > 1) T(o, [675, 360, 52], 'the data does not come back', 'bad');
          o.cnt = [['CODE', '2.4.0'], ['WRONG ROWS', '3,600', 'bad'], ['UNDONE', '0', 'bad']];
          o.res = [['the code came back; the data stayed', 'bad']]; } },
    ],
    recreate: [
      { id: 'antes', dur: 6, title: 'strategy: Recreate: everything stops before starting', yk: 'THE YAML',
        code: ['spec:', '  replicas: 3', '  strategy:', '    type: Recreate', '# shuts down all the old pods', '# before creating the new ones'],
        story: 'With <code>strategy.type: Recreate</code>, Kubernetes shuts down <b>all</b> the old pods before creating the new ones. It is the only model where 2.4.0 and 2.5.0 <b>never</b> serve at the same time. It is 14:00, and the 3 pods of 2.4.0 serve the 5 orders/s.',
        look: 'The three gray pods (2.4.0) receive the traffic from lb-loja. The three slots on the right are empty: that is where 2.5.0 will start.',
        key: 'Recreate: never two versions at once, and the price is going offline.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2);
          o.cnt = [['READY PODS', '3'], ['VERSIONS LIVE', '1', 'dim'], ['REFUSED', '0', 'dim']]; o.res = [['3 pods of 2.4.0', 'dim']]; } },
      { id: 'encerra', dur: 6, title: '0–10 s: the 3 old pods are shut down', yk: 'THE CLOCK',
        code: ['14:00:00  shuts down the 3 pods of 2.4.0', '          10 s to leave', 'ready pods: 0', 'lb-loja → 503 Service Unavailable', '5 orders/s refused'],
        story: 'At 14:00:00 the three pods of 2.4.0 get the signal to leave and take <b>10 s</b> to shut down. With no ready pod, <code>lb-loja</code> has nowhere to send and returns <code>503</code>. At 5 orders/s, that is 50 refused in those 10 s.',
        look: 'The gray pods lose their traffic and sink into the plate. The dots go up from lb-loja and come back red: 503.',
        key: 'Between the last old pod leaving and the first new one becoming ready, nobody serves.',
        f(o, t) { const s = lin(t, 0.4, 4.5, 0, 10); if (s < 10) [0, 1, 2].forEach(i => P(o, i, 'old', 'stop'));
          lanes(o, ['x', 1]); lb(o, ['no ready pod', 'bad'], ['503', 'bad']); o.on.lb = 'bad';
          o.cnt = [['CLOCK', secs(s)], ['READY PODS', '0', 'bad'], ['REFUSED', thou(5 * s), 'bad']];
          o.res = s >= 10 ? [['10 s: the 3 old ones left', 'bad']] : []; } },
      { id: 'sobe', dur: 8, title: '10–40 s: the 3 pods of 2.5.0 start, 30 s until ready', yk: 'THE MATH',
        code: ['14:00:10  creates 3 pods of 2.5.0', '          30 s until readiness passes', '14:00:40  3 ready', 'offline: 10 + 30 = 40 s', '40 s × 5/s  = 200 refused', '40 s × 30/s = 1,200 (Black Friday)'],
        story: 'Only at 14:00:10 does Kubernetes create the three pods of 2.5.0. Each takes <b>30 s</b> to become ready (the math from module 14). The store is <b>40 s</b> offline: <b>200</b> orders refused at 5/s, or <b>1,200</b> on Black Friday, at 30/s.',
        look: 'The sodium pods start in the slots on the right with the 30 s bar filling. Meanwhile, traffic keeps coming back red from lb-loja.',
        key: 'The recreate clock is the time to shut down plus the time to start.',
        f(o, t) { const s = lin(t, 0.4, 6, 10, 40), ok = s >= 40;
          [3, 4, 5].forEach(i => P(o, i, 'new', ok ? 'ok' : 'start', { bar: (s - 10) / 30 }));
          if (ok) even(o, 3, 4, 5); else { lanes(o, ['x', 1]); lb(o, ['no ready pod', 'bad'], ['503', 'bad']); o.on.lb = 'bad'; }
          o.cnt = [['OFFLINE', secs(s), 'bad'], ['REFUSED', thou(5 * s), 'bad'], ['AT 30/S', thou(30 * s), 'dim']];
          o.res = ok ? [['40 s offline: 200 refused', 'bad']] : []; } },
      { id: 'pronto', dur: 7, title: '40 s: only one version, 100% on 2.5.0', yk: 'WHEN IT IS WORTH IT',
        code: ['14:00:40  3 pods of 2.5.0 ready', 'versions live at the same time: 1', 'worth it when the two versions', '  cannot coexist,', 'or when the transition costs', '  more than the stop'],
        story: 'At 14:00:40 the three pods of 2.5.0 serve, and there were never two versions live. That is what recreate buys: it is worth it when 2.5.0 changes the representation of a field that 2.4.0 does not understand, or when the gradual transition costs more than the stop. The article says it is only viable with asynchronous communication and eventual consistency; the criterion is <b>the versions being unable to coexist</b>. And the zero shipping passes just the same: Lena\'s 1059 goes out for 49.00.',
        look: 'The three sodium pods on the right receive all the traffic. The 1059 token lands on one of them and reaches pg-pedidos in red.',
        key: 'Recreate buys a single version live and pays with downtime.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new')); even(o, 3, 4, 5); lena(o, 4, 0.8, false);
          o.cnt = [['ON 2.5.0', '100%'], ['VERSIONS LIVE', '1', 'dim'], ['REFUSED', '200', 'bad']];
          o.res = [['only one version; 40 s offline', 'acc']]; } },
      { id: 'kafka', dur: 8, title: 'The article\'s case: entregas and the rebalance', yk: 'THE REBALANCE MATH',
        code: ['entregas: 3 pods · 3 partitions', 'rebalance: 6 s each (example)', 'rolling:  3 swaps × 2 × 6 s = 36 s', 'recreate: 1 rebalance = 6 s', 'today: KIP-429 and group.instance.id'],
        story: 'The article gives the Kafka case: <code>entregas</code> (3 partitions, module 13) consumes in a group, and every pod that joins or leaves triggers a <i>rebalance</i> (in the example, <b>6 s</b> stopped). A 3-pod rolling does 3 swaps × 2 rebalances × 6 s = <b>36 s</b> of consumption interrupted in parts; recreate does <b>1</b> rebalance of 6 s, after the 3 new ones join. Correction to the article: cooperative rebalance (KIP-429) and static membership (<code>group.instance.id</code>) reduce that cost. For Kafka consumers, recreate is an option, not a requirement.',
        look: 'The pods become consumers of entregas and lb-loja becomes the topic with 3 partitions. The old ones leave together, the group stops once (6 s) and the 3 partitions move to the new ones.',
        key: 'For Kafka, recreate is an option, not a requirement.',
        f(o, t) { const ph = t < 2.4 ? 0 : t < 4.4 ? 1 : 2;
          o.rows.lb = act('Kafka · entregas', '3 PARTITIONS', [ph === 1 ? 'rebalance: 6 s stopped' : 'normal consumption', ph === 1 ? 'bad' : 'dim']); if (ph === 1) o.on.lb = 'bad';
          o.rows.cli = act('producers', '', ['delivery events', 'dim']);
          if (ph === 0) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { name: 'consumer', sub: 'partition ' + i })); even(o, 0, 1, 2); }
          if (ph === 1) { lanes(o, ['x', 1]); T(o, [LBX, 320, 70], 'rebalance · 6 s', 'bad'); }
          if (ph === 2) { [3, 4, 5].forEach((i, k) => P(o, i, 'new', 'ok', { name: 'consumer', sub: 'partition ' + k })); even(o, 3, 4, 5); }
          o.cnt = [['RECREATE', '6 s'], ['ROLLING', '36 s', 'dim'], ['REBALANCES', '1 vs 6', 'dim']];
          o.res = ph === 2 ? [['1 rebalance; KIP-429 also reduces it', 'acc']] : []; } },
      { id: 'naosobe', dur: 9, title: 'What if it goes wrong: 2.5.0 does not start, 80 s offline', yk: 'THE ERROR',
        code: ['ERROR: column "frete" does not exist', 'the migration was not applied', 'pods of 2.5.0: CrashLoopBackOff', 'ready pods: 0 · 100% 503', '40 s + 40 s to go back = 80 s', '400 refused (5/s) · 2,400 (30/s)'],
        story: 'Now the migration was not applied: 2.5.0 looks for the <code>frete</code> column, gets <code>column "frete" does not exist</code> and goes into <i>CrashLoopBackOff</i>. The three pods of 2.4.0 had already left: <b>0 pods</b>, 100% <code>503</code>. Undoing it is another 40 s recreate: <b>80 s</b> offline, <b>400</b> orders refused at 5/s (<b>2,400</b> on Black Friday).',
        look: 'The pods on the right start and turn red, never passing readiness. Then they sink, and 2.4.0 starts again on the left; until then, the traffic comes back entirely in red.',
        key: 'With recreate, the version that does not start leaves the store with no pod at all.',
        f(o, t) { const s = lin(t, 0.4, 7.4, 0, 80);
          if (s < 10) [0, 1, 2].forEach(i => P(o, i, 'old', 'stop'));
          else if (s < 40) [3, 4, 5].forEach(i => P(o, i, 'new', s < 22 ? 'start' : 'bad', { bar: (s - 10) / 30, note: 'CrashLoopBackOff' }));
          else if (s < 50) [3, 4, 5].forEach(i => P(o, i, 'new', 'stop', { note: 'shutting down' }));
          else [0, 1, 2].forEach(i => P(o, i, 'old', s >= 80 ? 'ok' : 'start', { bar: (s - 50) / 30 }));
          if (s >= 22 && s < 40) T(o, [PC(4), PY + 40, 64], 'column "frete" does not exist', 'bad');
          if (s >= 80) even(o, 0, 1, 2); else { lanes(o, ['x', 1]); lb(o, ['no ready pod', 'bad'], ['503', 'bad']); o.on.lb = 'bad'; }
          o.cnt = [['OFFLINE', secs(s), 'bad'], ['REFUSED', thou(5 * s), 'bad'], ['AT 30/S', thou(30 * s), 'dim']];
          o.res = s >= 80 ? [['80 s with no pod', 'bad'], ['400 refused · 2,400 on Black Friday', 'bad']] : []; } },
    ],
    rolling: [
      { id: 'conta', dur: 6, title: '25% of 3 pods: maxSurge 1, maxUnavailable 0', yk: 'THE YAML AND THE ROUNDING',
        code: ['strategy:', '  type: RollingUpdate     # the default', '  rollingUpdate:', '    maxSurge: 25%         # 0.75 → 1', '    maxUnavailable: 25%   # 0.75 → 0', 'at most 4 pods; at least 3 ready'],
        story: 'Rolling is the Kubernetes default: it swaps pod by pod. Two numbers are in charge: <code>maxSurge</code> (how many extra pods it can create) and <code>maxUnavailable</code> (how many can be missing), <b>25%</b> each by default. With 3 replicas, 25% gives 0.75: surge rounds <b>up</b> (1) and unavailable rounds <b>down</b> (0). The safest rolling comes for free, but it starts one pod at a time.',
        look: 'The three gray pods (2.4.0) serve. The fourth slot, to their right, is the maxSurge headroom: that is where 2.5.0 will be born.',
        key: 'maxSurge rounds up; maxUnavailable rounds down.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old')); even(o, 0, 1, 2); T(o, [PC(3), PY + PD / 2, 30], 'maxSurge: +1 pod', 'acc');
          o.cnt = [['MAXSURGE', '1'], ['MAXUNAVAILABLE', '0', 'dim'], ['% ON 2.5.0', '0%', 'dim']]; o.res = [['starts 1 pod at a time', 'acc']]; } },
      { id: 'onda1', dur: 7, title: 'Wave 1 (0–30 s): the first pod of 2.5.0 starts', yk: 'WAVE 1',
        code: ['0 s   creates 1 pod of 2.5.0 (4 pods)', '      readiness: 30 s', '30 s  ready → shuts down 1 pod of 2.4.0', '% on 2.5.0 from 0 to 30 s: 0%'],
        story: 'At second 0 Kubernetes creates a pod of 2.5.0, the fleet\'s fourth. It receives nothing until <i>readiness</i> passes, <b>30 s</b> later. Only then is a pod of 2.4.0 shut down. From 0 to 30 s, <b>0%</b> of the traffic sees 2.5.0.',
        look: 'The sodium pod is born in the fourth slot with the 30 s bar filling; the traffic keeps going only to the gray ones. When the bar closes, the first gray one sinks.',
        key: 'No new pod serves before passing readiness.',
        f(o, t) { const s = lin(t, 0.4, 5, 0, 30), ok = s >= 30;
          if (!ok) P(o, 0, 'old'); else if (t < 5.8) P(o, 0, 'old', 'stop'); P(o, 1, 'old'); P(o, 2, 'old'); P(o, 3, 'new', ok ? 'ok' : 'start', { bar: s / 30 });
          if (ok) even(o, 1, 2, 3); else even(o, 0, 1, 2);
          o.cnt = [['TIME', secs(s)], ['% ON 2.5.0', ok ? '33%' : '0%'], ['PODS', ok ? '3' : '4', 'dim']];
          o.res = ok ? [['30 s: swaps 1 of 3', 'acc']] : []; } },
      { id: 'onda2', dur: 8, title: 'Wave 2 (30–60 s): 33% on 2.5.0', yk: 'WAVE 2',
        code: ['30 s  1 of 3 ready on 2.5.0 → 33%', '      creates the 2nd pod of 2.5.0', '60 s  ready → shuts down another 2.4.0', 'two versions on lb-loja (round robin)'],
        story: 'From 30 to 60 s, one of the three ready pods is 2.5.0: by the round robin of <code>lb-loja</code> (module 7), <b>33%</b> of the orders already land on it, and Lena\'s 1059 lands there. 2.4.0 and 2.5.0 serve <b>at the same time</b>, and everything both touch (database, events, cache) has to serve both: that is the subject of lesson 8.',
        look: 'A third of the dots are now sodium and go to the new pod; the 1059 token goes with them. The second pod of 2.5.0 is born with its 30 s bar.',
        key: 'During the rolling, both versions serve together.',
        f(o, t) { const s = lin(t, 0.4, 6, 30, 60), ok = s >= 60;
          if (!ok) P(o, 1, 'old'); else if (t < 6.8) P(o, 1, 'old', 'stop'); P(o, 2, 'old'); P(o, 3, 'new'); P(o, 4, 'new', ok ? 'ok' : 'start', { bar: (s - 30) / 30 });
          if (ok) even(o, 2, 3, 4); else even(o, 1, 2, 3); lena(o, 3, 0.6, false);
          o.cnt = [['TIME', secs(s)], ['% ON 2.5.0', ok ? '67%' : '33%'], ['VERSIONS LIVE', '2', 'dim']];
          o.res = [['2.4.0 and 2.5.0 serving together', 'acc']]; } },
      { id: 'onda3', dur: 8, title: 'Wave 3 (60–90 s): 67%, and 100% at 90 s', yk: 'WAVE 3',
        code: ['60 s  2 of 3 on 2.5.0 → 67%', '      creates the 3rd pod of 2.5.0', '90 s  ready → shuts down the last 2.4.0', '      100% on 2.5.0', '3 waves × 30 s = 90 s, no downtime'],
        story: 'From 60 to 90 s, two of the three ready pods are 2.5.0: <b>67%</b>. The third passes readiness at <b>90 s</b> and the last pod of 2.4.0 leaves. At no moment did the store have fewer than 3 ready pods.',
        look: 'Two thirds of the dots go to the sodium pods. The last gray one sinks when the third bar closes.',
        key: 'maxUnavailable 0: capacity never drops during the swap.',
        f(o, t) { const s = lin(t, 0.4, 6, 60, 90), ok = s >= 90;
          if (!ok) P(o, 2, 'old'); else if (t < 6.8) P(o, 2, 'old', 'stop'); P(o, 3, 'new'); P(o, 4, 'new'); P(o, 5, 'new', ok ? 'ok' : 'start', { bar: (s - 60) / 30 });
          if (ok) even(o, 3, 4, 5); else even(o, 2, 3, 4);
          o.cnt = [['TIME', secs(s)], ['% ON 2.5.0', ok ? '100%' : '67%'], ['READY', '3', 'dim']];
          o.res = ok ? [['90 s, never fewer than 3 ready', 'acc']] : []; } },
      { id: 'catalogo', dur: 7, title: 'On catalogo, 10 pods: at least 8 ready', yk: 'THE CATALOGO',
        code: ['catalogo: 10 pods, 100 req/s each', 'maxSurge 25% × 10 = 2.5 → 3', 'maxUnavailable 2.5 → 2: minimum 8', '640 ÷ (8 × 100) = 80% · R = 60 ms', 'maxUnavailable 3 → 7 pods:', '91.4% · R = 126.7 ms'],
        story: 'With <code>catalogo</code> (10 pods, 100 req/s each) the same 25% gives <code>maxSurge</code> <b>3</b> and <code>maxUnavailable</code> <b>2</b>. During the swap there are at least <b>8</b> ready: at 640 req/s, CPU goes to <b>80%</b> and the response to <b>60 ms</b> (the table from module 14). With <code>maxUnavailable</code> 3 there would be 7 pods: <b>91.4%</b> and <b>126.7 ms</b>.',
        look: 'At the back, the 10 pods of catalogo: two gray ones sink together and three sodium ones are born in the headroom. The display does the math with the 8 that remain.',
        key: 'maxUnavailable decides how much capacity the swap takes from the fleet.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new')); even(o, 3, 4, 5); const s = lin(t, 0.5, 4.5, 0, 30), ok = s >= 30;
          for (let j = 0; j < 10; j++) C(o, j, 'old', j < 2 ? (ok ? 'gone' : 'stop') : 'ok');
          for (let j = 10; j < 13; j++) C(o, j, 'new', ok ? 'ok' : 'start', { bar: s / 30 });
          T(o, [CCc(1), CY + 10, 52], 'maxUnavailable: 2', 'bad'); T(o, [CCc(11), CY + 10, 52], 'maxSurge: 3', 'acc');
          o.cnt = [['MINIMUM READY', '8'], ['CPU AT MINIMUM', '80%', 'dim'], ['RESPONSE', '60 ms', 'dim']];
          o.res = [['with 3 out: 91.4% and 126.7 ms', 'bad']]; } },
      { id: 'passa', dur: 8, title: 'What if it goes wrong: zero shipping gets through every gate', yk: 'THE GATES',
        code: ['readinessProbe: 200 ✓', '5xx errors: 0% ✓ · latency: same ✓', 'progressDeadlineSeconds: advanced ✓', 'no gate measures the shipping', '1/s × 15.00 = R$ 15 per second', '60 min: 3,600 orders · R$ 54,000'],
        story: 'Rolling checks <b>health</b>: <code>readinessProbe</code>, <code>minReadySeconds</code>, <code>progressDeadlineSeconds</code>. The article says there are no intermediate validations; there are these gates, but none looks at the business result. 2.5.0 passes all of them with the zero shipping: at 90 s it is on 100%, and the store loses <b>R$ 15 per second</b> until someone notices (R$ 54,000 in 60 min).',
        look: 'The three sodium pods passed readiness and receive everything. The 1059 token reaches pg-pedidos in red, and the loss climbs to R$ 54,000.',
        key: 'Rolling only checks health, and zero shipping is healthy.',
        f(o, t) { [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { sub: 'readiness ✓' })); even(o, 3, 4, 5); lena(o, 4, 0.4, false);
          const s = lin(t, 4.4, 7.6, 0, 3600), n = Math.floor(s);
          if (t > 4.2) { db(o, ['frete 0.00: ' + thou(n) + ' rows', 'bad'], ['loss: ' + brl(15 * n), 'bad']); o.on.db = 'bad'; }
          o.cnt = [['CLOCK', hms(s)], ['FRETE 0.00', thou(n), 'bad'], ['LOSS', brl(15 * n), 'bad']];
          o.res = n >= 3600 ? [['R$ 15/s until someone notices', 'bad']] : []; } },
    ],
    bluegreen: [
      { id: 'dois', dur: 6, title: 'Blue and green: 3 + 3 pods and a pointer', yk: 'THE TWO ENVIRONMENTS',
        code: ['blue  = 2.4.0 · 3 pods · serving', 'green = 2.5.0 · 3 pods · no customers', 'Service pedidos → blue', 'database: just one (pg-pedidos)', 'catalogo on Black Friday: 10 + 10', '= 10 extra replica-hours per hour'],
        story: 'Blue/green starts the whole 2.5.0 <b>next to</b> 2.4.0: <i>blue</i> is the 3 pods of 2.4.0, which serve; <i>green</i> is 3 pods of 2.5.0, the same size, with no customers. The <code>pedidos</code> Service points to one of the two. There is one database: both environments write to the same <code>pg-pedidos</code>, and going back to blue does not undo what green wrote.',
        look: 'On the left, blue (gray) receives the traffic through lb-loja\'s pointer; on the right, green (sodium) is ready and idle.',
        key: 'Two identical environments and a pointer that chooses which one serves.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'no customers' })); even(o, 0, 1, 2);
          lb(o, ['Service pedidos', 'dim'], ['→ blue', 'acc']);
          o.cnt = [['PODS', '3 + 3'], ['SERVING', 'blue', 'dim'], ['ON GREEN', '0%', 'dim']]; o.res = [['twice the pods during the swap', 'dim']]; } },
      { id: 'fumaca', dur: 7, act: 'teste', title: 'The smoke test on green, with no customers', yk: 'THE TEST',
        code: () => actv.teste ? ['previewService → green', 'POST /pedidos · Recife ZIP', '→ 201 · frete 0.00 · total 49.00', 'expected: 64.00 ✗', 'the store does not switch: R$ 0'] : ['previewService → green', 'POST /pedidos · SP ZIP', '→ 201 · frete 9.00 ✓', 'no Recife order in the test', 'the store switches with the defect inside'],
        story: 'Before switching, green gets smoke tests (module 24), <i>warm-up</i> and checks <b>with no customers</b>, through the preview service. The test only catches the zero shipping <b>if</b> it creates an order for Recife. Choose above: without Recife green passes and the switch carries the defect along (R$ 54,000 in 60 min); with Recife the test sees 49.00 where it expected 64.00, and the store does not switch (R$ 0).',
        look: 'The test, at the back, sends an order to green through the preview, while blue keeps serving customers. The result shows above green.',
        key: 'Green is only tested on what the test asks for.',
        f(o, t) { const rec = actv.teste === 1; [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'no customers' })); even(o, 0, 1, 2);
          lb(o, ['Service pedidos', 'dim'], ['→ blue', 'acc']); o.on.tst = 1;
          const a = send(o, backLane(4), t, 0.6, 2.4, rec ? 'test · Recife' : 'test · SP'), r = t > 2.6;
          o.rows.tst = act('smoke test', 'NO CUSTOMER', ['test order: ' + (rec ? 'Recife' : 'SP'), 'dim'], [r ? (rec ? '201 · frete 0.00 ✗' : '201 · frete 9.00 ✓') : '…', r ? (rec ? 'bad' : 'acc') : 'dim']);
          if (r) { if (rec) o.pods[4] = { v: 'new', st: 'bad', meta: 'GREEN', note: 'frete 0.00' }; T(o, [PC(4), PY + 30, 62], rec ? 'blocked: 49.00 ≠ 64.00' : 'passed: switches with the defect', rec ? 'acc' : 'bad'); }
          o.cnt = [['TEST', rec ? 'Recife' : 'SP'], ['RESULT', r ? (rec ? 'blocks' : 'passes') : '…', r ? (rec ? '' : 'bad') : 'dim'], ['RISK', rec ? 'R$ 0' : 'R$ 54,000', rec ? 'dim' : 'bad']];
          o.res = r ? (rec ? [['blocked before any customer saw it', 'acc']] : [['the switch carries the defect along', 'bad']]) : []; } },
      { id: 'virada', dur: 8, title: 'The switch: the pointer flips in ~1 s, the flow does not', yk: 'THE SWITCH',
        code: ['kubectl argo rollouts promote pedidos', 'Service pedidos → green   (~1 s)', 'keep-alive, long HTTP/2, gRPC:', '  stay on blue until they close', 'switch by DNS: the TTL matters', 'blue up: going back = ~1 s'],
        story: 'Switching is flipping the pointer: the Service points to green in <b>~1 s</b>. But connections that are already open (HTTP keep-alive, HTTP/2, long-lived gRPC, module 12) stay on blue\'s pods until they close, and a switch by DNS waits for the TTL (module 1). What is instant is the pointer, not the flow. As long as blue is up, going back is flipping the pointer again: ~1 s.',
        look: 'lb-loja\'s pointer moves from blue to green. A few dots still go to blue for a while: those are the connections that were already open.',
        key: 'Instant is the pointer, not the flow.',
        f(o, t) { const sw = t > 1.6, rest = sw ? lin(t, 1.6, 5.5, 0.34, 0) : 1;
          [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE', note: sw ? (rest > 0 ? 'old connections' : 'up, no traffic') : 'ready' }));
          [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: sw ? 'serving' : 'no customers' }));
          lanes(o, ...[0, 1, 2].map(i => ['p' + i, rest / 3]), ...[3, 4, 5].map(i => ['p' + i, (1 - rest) / 3]));
          lb(o, ['Service pedidos', 'dim'], [sw ? '→ green' : '→ blue', 'acc']); o.on.lb = sw ? 1 : 0;
          o.cnt = [['POINTER', sw ? 'green' : 'blue'], ['SWITCH', '~1 s', 'dim'], ['STILL ON BLUE', pct(rest), 'dim']];
          o.res = sw && rest <= 0 ? [['the whole flow on green', 'acc']] : sw ? [['the pointer flipped; the flow, gradually', 'dim']] : []; } },
      { id: 'frio', dur: 8, title: 'What if it goes wrong: the cold green forms a queue', yk: 'LITTLE\'S LAW',
        code: ['catalogo: 640 req/s · 10 + 10 pods', 'warm: 640 × 0.02 s = 12.8 in flight', 'cold: 640 × 0.2 s  = 128 in flight', '10 pods × 10 workers = 100', '128 > 100 → queue (CPU at 64%)', 'fix: warm-up before switching'],
        story: 'On the Black Friday <code>catalogo</code> (10 + 10 pods) green is born with an <b>empty</b> local cache: the first request takes <b>200 ms</b> instead of 20 ms (example). By Little\'s Law (module 14), 640 req/s × 0.2 s = <b>128</b> requests in flight, against <b>12.8</b> when warm. With 10 workers per pod (module 11), the 10 pods hold <b>100</b> in flight: green <b>forms a queue</b> with CPU at 64%. The fix is to warm green up before the switch, with synthetic or mirrored traffic.',
        look: 'At the back, the 10 pods of catalogo green receive the whole switch. In front of them a red queue grows: 128 in flight for 100 workers.',
        key: 'Switching to a cold green is switching to a queue.',
        f(o, t) { delete o.show.tst; for (let j = 0; j < 10; j++) C(o, j, 'new', 'ok'); const k = clamp((t - 1) / 4);
          lanes(o, ...Array.from({ length: 10 }, (_, j) => ['c' + j, 0.1])); lb(o, ['Service catalogo', 'dim'], ['→ green (cold)', 'acc']); o.on.lb = 1;
          const q = Math.round(k * 12); for (let i = 0; i < q; i++) o.dots.push([[CCc(i % 10), CY + CD + 14 + Math.floor(i / 10) * 16, 14], 'bad']);
          if (q) o.beams.push({ pts: [[CCc(0) - 8, CY + CD + 14, 8], [CCc(9) + 8, CY + CD + 14, 8]], tone: 'bad' });
          T(o, [CCc(5), CY - 10, 92], 'green · catalogo · 10 pods', 'acc'); if (k >= 1) T(o, [CCc(5), CY + CD + 60, 18], 'queue: 128 in flight × 100 workers', 'bad');
          o.cnt = [['IN FLIGHT', String(Math.round(lin(t, 1, 5, 12.8, 128))), k > 0.5 ? 'bad' : ''], ['WORKERS', '100', 'dim'], ['CPU', '64%', 'dim']];
          o.res = k >= 1 ? [['queue with CPU at 64%', 'bad'], ['warm up before switching', 'acc']] : []; } },
      { id: 'lab', dur: 8, title: 'The lab: Argo Rollouts\' blueGreen', yk: 'blue-green/automated',
        code: ['blueGreen:   # 5 replicas', '  activeService: chip', '  previewService: chip-green', '  autoPromotionEnabled: false', '  scaleDownDelaySeconds: 60', '  prePromotionAnalysis: cassowary + ≥ 0.95'],
        story: 'In the author\'s public repository, Argo Rollouts\' <code>blueGreen</code> has <b>5</b> replicas, <code>activeService: chip</code> (the one that serves), <code>previewService: chip-green</code> (green, for testing), <code>autoPromotionEnabled: false</code> (someone approves the switch) and <code>scaleDownDelaySeconds: 60</code> (blue stays up 60 s after the switch). The <code>automated</code> version runs a <i>Job</i> <code>cassowary -c 3 -n 1000</code> against green before the promotion and requires <code>result[0] >= 0.95</code> success in Prometheus. That catches <code>500</code>s with no customers; it does <b>not</b> catch the zero shipping, because <code>201</code> is success. And 0.95 accepts <b>5%</b> errors, far from the store\'s target (0.1%).',
        look: 'The back block becomes the lab\'s analysis: 1,000 requests against green, all 201. The success rate gives 100% and the promotion is released with the zero shipping inside.',
        key: 'The lab\'s analysis measures HTTP errors, and the zero shipping answers 201.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE' })); [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'under test' })); even(o, 0, 1, 2);
          lb(o, ['activeService: chip', 'dim'], ['→ blue', 'acc']); o.on.tst = 1; const n = Math.round(lin(t, 0.5, 5.5, 0, 1000));
          o.rows.tst = act('prePromotionAnalysis', 'THE LAB', ['cassowary -c 3 -n 1000', 'dim'], ['success ≥ 0.95: ' + (n ? '100%' : '…'), 'acc']);
          if (t < 5.6) [3, 4, 5].forEach((i, k) => pk(o, backLane(i), ((clk * 0.7 + k / 3) % 1), '', '')); [3, 4, 5].forEach(i => o.beams.push({ pts: backLane(i), on: t < 5.6 }));
          if (t > 5.6) T(o, [PC(4), PY + 30, 62], 'promotion released', 'bad');
          o.cnt = [['REQUESTS', thou(n)], ['SUCCESS', n ? '100%' : '…', 'dim'], ['SEEN SHIPPING 0', 'no', 'bad']];
          o.res = t > 5.6 ? [['201 is success: the defect passes', 'bad']] : []; } },
      { id: 'janela', dur: 10, act: 'janela', title: 'What if it goes wrong: the defect shows up at 8 min', yk: 'THE WAY-BACK WINDOW',
        code: () => { const D = [30, 60, 600][actv.janela], alive = D > 480; return ['14:00:00  switch to green', 'scaleDownDelaySeconds: ' + ['30', '60', '600'][actv.janela], 'blue shut down at ' + hms(D), '14:08:00  someone notices zero shipping', alive ? 'blue up: pointer back, ~1 s' : 'blue already gone: start 3 pods + 30 s']; },
        story: 'After the switch blue stays up for <code>scaleDownDelaySeconds</code>: <b>30 s</b> by the Argo default, <b>60 s</b> in the lab. If the zero shipping only shows up <b>8 min</b> later, blue was already shut down, and going back is <b>starting 3 pods and waiting 30 s</b>: the ~1 s window closed. Try the three values above. The fix is to give the window the size of the <b>detection</b> time, not the switch time.',
        look: 'The clock runs from the switch to 14:08. Blue sinks when the window expires; if it is still up at 8 min, the pointer goes back to it right away.',
        key: 'The way-back window has to be longer than the time to notice.',
        f(o, t) { const D = [30, 60, 600][actv.janela], s = lin(t, 0.4, 6, 0, 480), seen = s >= 480, alive = D > 480;
          if (s < D) [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'BLUE', note: seen ? 'serving again' : 'up, no traffic' }));
          else if (seen) [0, 1, 2].forEach(i => P(o, i, 'old', 'start', { meta: 'BLUE', bar: lin(t, 6.2, 9.4, 0, 1) }));
          [3, 4, 5].forEach(i => P(o, i, 'new', 'ok', { meta: 'GREEN', note: 'serving' }));
          if (seen && alive) even(o, 0, 1, 2); else even(o, 3, 4, 5);
          lb(o, ['Service pedidos', 'dim'], [seen && alive ? '→ blue (back)' : '→ green', 'acc']);
          if (seen) T(o, [PC(4), PY + 30, 62], '14:08: zero shipping!', 'bad');
          o.cnt = [['CLOCK', hms(s)], ['BLUE', s < D ? 'up' : 'shut down', s < D ? 'dim' : 'bad'], ['GOING BACK', seen ? (alive ? '~1 s' : '30 s') : '…', seen ? (alive ? '' : 'bad') : 'dim']];
          o.res = seen ? (alive ? [['window > 8 min: back in ~1 s', 'acc']] : [['the window closed: start and wait 30 s', 'bad']]) : []; } },
    ],
    canary: [
      { id: 'cabecalho', dur: 6, title: '0%: only whoever sends x-versao: v2', yk: 'THE STORE\'S PLAN',
        code: ['0%    header x-versao: v2', '      (the team and synthetic customers)', '10%   for 5 min + analysis', '50%   for 5 min + analysis', '100%', 'canary × stable in the same interval'],
        story: 'The canary sends a <b>slice</b> of real traffic to 2.5.0 and measures before growing. The store\'s plan (the canary from module 8 and the mesh from module 10): <b>0%</b> of the public, only whoever sends the <code>x-versao: v2</code> header (the team and synthetic customers); then <b>10%</b> for 5 min, <b>50%</b> for 5 min and <b>100%</b>. Each step compares the canary with the stable one <b>in the same interval</b> (SRE Workbook), not with the day before.',
        look: 'A sodium pod, the canary, sits next to the three gray ones. Only the order with the header reaches it; customers keep going to the stable one.',
        key: 'A canary is a slice of real traffic that measures before growing.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'STABLE' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'only x-versao: v2' }); even(o, 0, 1, 2);
          lb(o, ['mesh: weight 0%', 'dim'], ['x-versao: v2 → canary', 'acc']); const f = ((clk * 0.35) % 1); pk(o, podLane(3), f, 'x-versao: v2', '');
          o.beams.push({ pts: podLane(3), on: true });
          o.cnt = [['WEIGHT', '0%'], ['STABLE', '3 pods', 'dim'], ['CANARY', '1 pod', 'dim']]; o.res = [['no customer exposed', 'acc']]; } },
      { id: 'dez', dur: 8, title: '10% for 5 min: Lena lands on the canary', yk: 'THE 10% STEP',
        code: ['setWeight: 10   (mesh: exact weight)', 'no mesh: weight by pod, 1 of 3 = 33%', '5 × 300 s × 10% = 150 orders', '150 × 20% = 30 from Recife', '1059 · Lena → canary → 49.00'],
        story: 'The weight goes up to <b>10%</b>. With the mesh (module 10) the weight is exact; without <code>trafficRouting</code>, Argo Rollouts approximates by the <b>number of pods</b>, and with 3 pods the minimum would be 1 of 3 = <b>33%</b>. In 5 min at 5 orders/s, the canary receives <b>150</b> orders, <b>30</b> from Recife. One of them is Lena\'s 1059, which goes out for 49.00.',
        look: 'One in every ten dots goes to the sodium canary. The 1059 token lands on it and reaches pg-pedidos in red.',
        key: 'The mesh gives the exact weight; without it, the weight is the fraction of pods.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'STABLE' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'weight 10%' });
          lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); lb(o, ['mesh: weight 10%', 'acc'], ['stable 90%', 'dim']); lena(o, 3, 0.5, false);
          const n = Math.round(lin(t, 0.5, 7, 0, 150));
          if (t > 4.4) { db(o, ['1059 · 49.00', 'bad'], ['frete 0.00: ' + Math.round(n / 5) + ' rows', 'bad']); o.on.db = 'bad'; }
          o.cnt = [['ON THE CANARY', thou(n)], ['FROM RECIFE', String(Math.round(n / 5)), 'bad'], ['WEIGHT', '10%', 'dim']];
          o.res = n >= 150 ? [['5 min: 150 orders, 30 from Recife', 'bad']] : []; } },
      { id: 'analise', dur: 8, act: 'analise', title: 'At 5 min, the analysis decides: what does it measure?', yk: 'THE QUERY',
        code: () => actv.analise ? ['sum(increase(pedidos_criados_total{', '  versao="2.5.0",frete="0"}[5m])) by (cidade)', 'successCondition: result[0] == 0', 'Recife: 30 → fails → aborts', 'weight 0 in seconds', '30 × 15.00 = R$ 450'] : ['sum(irate(istio_requests_total{', '  response_code!~"5.*"}[5m])) / sum(irate(…))', 'successCondition: result[0] >= 0.95', '5xx on the canary: 0% → passes', '→ setWeight 50: 750 orders, 150 from Recife', 'loss at the 50% step: R$ 2,250'],
        story: 'At 5 min, the analysis decides. The lab\'s looks only at <code>5xx</code> and accepts 95% success: the canary has 0% errors, <b>passes</b> and goes up to 50% (at that step it would be 750 orders, 150 from Recife, R$ 2,250). The store\'s adds up the <b>business metric</b>: orders of 2.5.0 with zero shipping, by city. Recife gives <b>30</b>, the condition <code>== 0</code> fails and the canary <b>aborts</b>: weight 0 in seconds and <b>R$ 450</b> of loss. The store\'s query is an adaptation, not run.',
        look: 'The analysis lights up at the back and pulls a cable to the canary. With the lab\'s, a second sodium pod is born and half the dots go to 2.5.0; with the store\'s, the canary turns red and the traffic goes entirely back to the gray ones.',
        key: 'What decides the canary is what the analysis measures.',
        f(o, t) { const loja = actv.analise === 1, dec = t > 2.4; [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' }));
          o.on.ana = dec ? (loja ? 'bad' : 1) : 1; if (!(dec && loja && t >= 4.6)) o.beams.push({ pts: backLane(3), on: !dec || !loja, tone: dec && loja ? 'bad' : '' });
          o.rows.ana = act('analysis', loja ? 'THE STORE\'S' : 'THE LAB\'S', [loja ? '5xx and frete_zero{cidade}' : '5xx: result[0] >= 0.95', 'dim'],
            [dec ? (loja ? 'Recife: 30 → aborts' : 'success 100% → passes') : 'measuring…', dec ? (loja ? 'bad' : 'acc') : 'dim']);
          if (!dec) { P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'weight 10%' }); lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); }
          else if (loja) { if (t < 4.6) P(o, 3, 'new', 'bad', { meta: 'CANARY', note: 'aborted · weight 0' }); even(o, 0, 1, 2); lb(o, ['mesh: weight 0', 'acc'], ['stable 100%', 'dim']);
            T(o, [PC(3), PY + 30, 62], 'aborts: zero shipping in Recife', 'acc'); }
          else { P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'weight 50%' }); P(o, 4, 'new', t > 4.6 ? 'ok' : 'start', { meta: 'CANARY', bar: lin(t, 2.4, 4.6, 0, 1) });
            lanes(o, ['p0', 1 / 6], ['p1', 1 / 6], ['p2', 1 / 6], ['p3', 0.25], ['p4', 0.25]); lb(o, ['mesh: weight 50%', 'bad'], ['the defect inside', 'bad']);
            T(o, [PC(4), PY + 30, 62], 'passed: goes up to 50%', 'bad'); }
          if (loja) db(o, ['frete 0.00: 30 rows', 'bad'], ['loss: R$ 450', 'bad']); else db(o, ['frete 0.00: 30 rows', 'bad'], [dec ? 'at 50%: +150 from Recife' : 'loss: R$ 450', 'bad']); o.on.db = 'bad';
          o.cnt = loja ? [['SHIPPING 0 RECIFE', '30', 'bad'], ['DECISION', dec ? 'aborts' : '…'], ['LOSS', 'R$ 450', 'dim']] : [['5xx', '0%'], ['DECISION', dec ? 'goes up to 50%' : '…', 'bad'], ['RISK AT 50%', 'R$ 2,250', 'bad']];
          o.res = dec ? (loja ? [['aborted in 5 min: R$ 450', 'acc']] : [['passed with the defect inside', 'bad']]) : []; } },
      { id: 'lacunas', dur: 7, title: 'The lab\'s canary: what it leaves out', yk: 'canary/analysis/canary.yml',
        code: ['setWeight 20 → pause 30s → analysis', 'setWeight 50 → pause 1m  → analysis', 'setWeight 100', 'interval: 2m · count: 1 · failureLimit: 1', 'successCondition: result[0] >= 0.95', 'irate(…[5m]) · destination_service=chip'],
        story: 'The author\'s repository <code>analysis/canary.yml</code> (10 replicas) does 20% → 30 s pause → analysis → 50% → 1 min pause → analysis → 100%. It is a minimal example and leaves five things out: (1) <code>>= 0.95</code> tolerates 5% of <code>5xx</code>, and the store\'s target is 99.9%; (2) <code>201</code> with shipping 0 counts as success; (3) <code>destination_service</code> measures the whole service, stable + canary, and dilutes the canary\'s error by its weight; (4) <code>irate</code> is for graphs, and rules and alerts use <code>rate</code>; (5) <code>count: 1</code> is a single measurement.',
        look: 'The analysis, at the back, pulls cables to the four pods: stable and canary measured together. That is the dilution: the canary is 20% of what the query adds up.',
        key: 'Measuring the whole service dilutes the canary by its weight.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'STABLE' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'weight 20%' });
          lanes(o, ['p0', 0.8 / 3], ['p1', 0.8 / 3], ['p2', 0.8 / 3], ['p3', 0.2]); lb(o, ['mesh: weight 20%', 'acc'], ['the lab', 'dim']);
          o.on.ana = 1; o.rows.ana = act('lab analysis', 'COUNT: 1', ['5xx · whole service', 'bad'], ['result[0] >= 0.95', 'dim']);
          [0, 1, 2, 3].forEach(i => o.beams.push({ pts: backLane(i), on: true, tone: i < 3 ? 'bad' : '' }));
          T(o, [PC(1), PY - 10, 58], 'stable counts too', 'bad');
          o.cnt = [['WEIGHT', '20%'], ['THE QUERY MEASURES', '4 pods', 'bad'], ['MEASUREMENTS', '1', 'dim']];
          o.res = [['5% tolerated · 5xx only · diluted', 'bad'], ['irate · count: 1', 'bad']]; } },
      { id: 'amostra', dur: 8, title: 'What if it goes wrong: 150 orders is a small sample', yk: 'THE POWER OF THE SAMPLE',
        code: ['rare 2.5.0 error: 1% (10× the target)', 'P(no error in 150) = 0.99^150 = 22%', 'seeing ≥ 1 error with 95% confidence:', '  ln(0.05) ÷ ln(0.99) = 298 requests', '298 at 0.5/s = 10 min · at 64/s = 4.7 s', 'decide by sample, not by clock'],
        story: 'Change the defect: instead of the shipping, a <b>rare</b> error, of 1% (ten times the target). In 5 min the canary sees 150 orders, and the chance of <b>seeing no error</b> is 0.99<sup>150</sup> = <b>22%</b>: one time in five, the window passes and the canary goes up to 50% with the defect. To see at least one error with 95% confidence you need <b>298</b> requests: <b>10 min</b> at 0.5/s. <code>catalogo</code>, at 64/s, gathers that in 4.7 s. The Recife shipping is different: it is 100% deterministic, and the 30 orders give it away at the first step.',
        look: 'The dots enter the canary, none red. As the count climbs to 150, the display shows the chance of the window passing without seeing anything falling to 22%.',
        key: 'Decide by number of requests, not by minutes.',
        f(o, t) { [0, 1, 2].forEach(i => P(o, i, 'old', 'ok', { meta: 'STABLE' })); P(o, 3, 'new', 'ok', { meta: 'CANARY', note: 'rare error: 1%' });
          lanes(o, ['p0', 0.3], ['p1', 0.3], ['p2', 0.3], ['p3', 0.1]); lb(o, ['mesh: weight 10%', 'acc'], ['5 min', 'dim']);
          const n = Math.round(lin(t, 0.5, 6, 0, 150)), p = 0.99 ** n;
          o.on.ana = 1; o.rows.ana = act('analysis', 'WINDOW: 5 MIN', ['sample: ' + n + ' orders', 'dim'], ['errors seen: 0', 'bad']);
          o.cnt = [['ON THE CANARY', String(n)], ['ERRORS SEEN', '0', 'dim'], ['CHANCE OF SEEING NONE', pct(p), n >= 150 ? 'bad' : 'dim']];
          o.res = n >= 150 ? [['22%: the window passes without seeing', 'bad'], ['298 requests = 10 min', 'acc']] : []; } },
      { id: 'relogio', dur: 8, title: 'What if it goes wrong: a canary by clock reaches 100% in 50 s', yk: 'canary/time/canary.yml',
        code: ['setWeight 0  → pause 10s', 'setWeight 10 → pause 10s', 'setWeight 20 → pause 10s → 40 → 10s', 'setWeight 80 → pause 10s → 100', '0 → 100% in 50 s, looking at no metric', 'rolling of 3 pods: 90 s'],
        story: 'The lab\'s <code>time</code> swaps the manual pauses (<code>pause: {}</code>, where someone promotes with <code>kubectl argo rollouts promote</code>) for <code>duration: 10s</code>. The canary goes through 0 → 10 → 20 → 40 → 80 → 100% in <b>50 s</b>, looking at no metric: faster than the 3-pod rolling (90 s). A canary by clock, without analysis, is a rolling with more steps.',
        look: 'The canary weight goes up by itself every 10 s and the sodium pods take over the fleet. The analysis, at the back, never lights up.',
        key: 'A canary by time, without analysis, is rolling with more steps.',
        f(o, t) { const s = lin(t, 0.4, 6.2, 0, 50), W_ = [0, 10, 20, 40, 80, 100][Math.min(5, Math.floor(s / 10))] / 100;
          const nc = W_ >= 0.8 ? 3 : W_ >= 0.4 ? 2 : 1; for (let i = 0; i < 3; i++) if (W_ < 1) P(o, i, 'old', 'ok', { meta: 'ESTÁVEL' });
          for (let k = 0; k < nc; k++) P(o, 3 + k, 'new', 'ok', { meta: 'CANARY', note: 'weight ' + Math.round(W_ * 100) + '%' });
          lanes(o, ...(W_ < 1 ? [0, 1, 2].map(i => ['p' + i, (1 - W_) / 3]) : []), ...Array.from({ length: nc }, (_, k) => ['p' + (3 + k), W_ / nc]));
          lb(o, ['weight ' + Math.round(W_ * 100) + '%', 'acc'], ['duration: 10s', 'dim']);
          o.rows.ana = act('analysis', 'NONE', ['the clock only', 'dim'], ['—', 'dim']);
          o.cnt = [['TIME', secs(s)], ['WEIGHT', pct(W_)], ['ANALYSES', '0', 'bad']];
          o.res = s >= 50 ? [['100% in 50 s, measuring nothing', 'bad']] : []; } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  const codeOf = s => typeof s.code === 'function' ? s.code() : s.code;
  let SP = null;

  // turns pods, catalogo, traffic and the 1059 token into pieces, cables and dots
  function finish(o, t) {
    o.pods.forEach((p, i) => { if (!p || p.st === 'gone') return; const nm = 'p' + i; o.show[nm] = 1;
      const ver = p.v === 'new' ? '2.5.0' : '2.4.0';
      const state = p.st === 'start' ? ['ready in ' + Math.max(1, Math.ceil(30 * (1 - clamp(p.bar || 0)))) + ' s', 'acc'] : p.st === 'stop' ? [p.note || 'shutting down', 'dim'] : p.st === 'bad' ? [p.note || 'CrashLoopBackOff', 'bad'] : [p.note || 'ready', p.v === 'new' ? 'acc' : 'dim'];
      o.rows[nm] = { name: ver, meta: '', rows: [[p.sub || [p.name, p.meta && p.meta.toLowerCase()].filter(Boolean).join(' · ') || 'pod ' + (i + 1), 'dim'], state], bar: p.st === 'start' ? clamp(p.bar || 0) : null, pod: 1 };
      o.on[nm] = p.st === 'bad' ? 'bad' : p.st === 'stop' ? 0 : p.st === 'start' ? 2 : p.v === 'new' ? 1 : 0; });
    o.cat.forEach((p, j) => { if (!p || p.st === 'gone') return; const nm = 'c' + j; o.show[nm] = 1;
      o.rows[nm] = { name: p.v === 'new' ? '2.5' : '2.4', meta: '', rows: [], bar: p.st === 'start' ? clamp(p.bar || 0) : null, mini: 1 };
      o.on[nm] = p.st === 'stop' ? 0 : p.st === 'start' ? 2 : p.v === 'new' ? 1 : 0; });
    // traffic: 12 dots per cycle, split by the weights (largest remainder)
    if (o.lanes && o.lanes.length) {
      const K = 12, tot = o.lanes.reduce((a, [, f]) => a + f, 0), want = o.lanes.map(([k, f]) => [k, f / tot * K]);
      const cnt = want.map(([k, v]) => [k, Math.floor(v), v - Math.floor(v)]); let left = K - cnt.reduce((a, c) => a + c[1], 0);
      cnt.slice().sort((a, b) => b[2] - a[2]).forEach(c => { if (left > 0 && c[2] > 0.001) { c[1]++; left--; } });
      const slots = []; cnt.forEach(([k, n]) => { for (let i = 0; i < n; i++) slots.push(k); });
      // spreads the targets so the dots do not walk in a block
      const order = slots.map((k, i) => [k, (i * 7) % K]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
      const seen = new Set();
      order.forEach((k, i) => { const f = (clk * 0.55 + i / K) % 1; let pts, tone;
        if (k === 'x') { pts = refLane(i % 6); tone = 'bad'; }
        else if (k[0] === 'p') { const j = +k.slice(1), p = o.pods[j]; pts = podLane(j); tone = p && p.v === 'new' ? '' : 'old'; }
        else { const j = +k.slice(1), p = o.cat[j]; pts = catLane(j); tone = p && p.v === 'new' ? '' : 'old'; }
        if (!seen.has(k)) { seen.add(k); o.beams.push({ pts: k === 'x' ? [[LBX, 335, 26], [LBX, LANEY - 4, LANEZ + 2]] : pts, on: tone === '', tone: tone === 'bad' ? 'bad' : '' }); }
        pk(o, pts, Math.max(0.002, f), '', tone); });
      [0.15, 0.5, 0.85].forEach(d => pk(o, CLI, (clk * 0.55 + d) % 1 || 0.01, '', 'old'));
      if (o.lanes.some(([k]) => k === 'x')) T(o, [LBX, LANEY - 6, LANEZ + 26], '503', 'bad');
    }
    // Lena's 1059 token
    if (o.lena) { const { i, t0, ok } = o.lena, a = go_(t, t0, t0 + 2.4), b = go_(t, t0 + 2.6, t0 + 3.8);
      if (a < 1) { pk(o, lenaIn(i), Math.max(a, 0.001), LENA, 'acc', true); o.beams.push({ pts: lenaIn(i), on: true }); }
      else if (b < 1) { pk(o, lenaOut(i), Math.max(b, 0.001), ok ? '1059 · 64.00' : '1059 · 49.00 (frete 0.00)', ok ? 'acc' : 'bad', true); o.beams.push({ pts: lenaOut(i), on: ok, tone: ok ? '' : 'bad' }); }
      else { T(o, [675, 330, 74], ok ? '1059 · 64.00' : '1059 · 49.00 · frete 0.00', ok ? 'acc' : 'bad'); if (!ok) o.on.db = 'bad'; } }
    // the two blue/green environments
    if (sc === 'bluegreen' && o.pods.length && cur().id !== 'frio') {
      if (o.pods[1]) T(o, [PC(1), PY + 12, 54], 'blue · 2.4.0', 'hi'); T(o, [PC(4), PY + 12, 54], 'green · 2.5.0', 'acc'); }
  }
  function spec() { const o = base(); cur().f(o, lt); finish(o, lt); return o; }

  // ── drawings on the faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // name on the left, role on the right, on the first line
    x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(14)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = col; fitFont(x, u, d.meta, 12, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(14)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : lit_ ? accC() : C.inkHi;
    if (d.mini) { x.textAlign = 'center'; x.fillStyle = col; fitFont(x, u, d.name, 9, W_ - 3); x.fillText(d.name, u(W_ / 2), u(H_ / 2 - (d.bar != null ? 6 : 0)));
      if (d.bar != null) { x.fillStyle = C.line; x.fillRect(u(2), u(H_ - 10), u(W_ - 4), u(5)); x.fillStyle = accC(); x.fillRect(u(2), u(H_ - 10), u((W_ - 4) * d.bar), u(5)); }
      cv.tex.needsUpdate = true; return; }
    const small = H_ < 80, big = d.pod ? 27 : small ? 17 : 23;
    head(x, u, d, W_, col, big); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(4), u(25)); x.lineTo(u(W_ - 4), u(27)); x.stroke();
    let y = small ? 39 : 44; for (const [text, tn] of d.rows || []) { if (text) { x.fillStyle = toneC(tn); fitFont(x, u, text, small ? 14 : 18, W_ - 10); x.fillText(text, u(5), u(y)); } y += small ? 17 : 22; }
    if (d.bar != null) { x.fillStyle = C.line; x.fillRect(u(5), u(H_ - 13), u(W_ - 10), u(6)); x.fillStyle = accC(); x.fillRect(u(5), u(H_ - 13), u((W_ - 10) * d.bar), u(6)); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = codeOf(s);
    const key = JSON.stringify([o.cnt, o.res, yl, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl((s.yk || 'THE MATH').toUpperCase(), L0, 10, Wd - L0 - 8);
    x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
      fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── panel text ──
  const RAIO = [['recreate', 'Recreate', '0 → 100% at once', 'nobody', 'R$ 54,000 + 40 s offline'], ['rolling', 'Rolling', '0 → 33 → 67 → 100%', 'nobody', 'R$ 54,000'],
    ['bluegreen', 'Blue/Green', 'switch from 0 to 100%', 'the test, if it has Recife', 'R$ 0 or R$ 54,000'], ['canary', 'Canary', '10% for 5 min', 'the business metric', 'R$ 450']];
  const raio = hi => `<table class="h3-sum"><tr><th>model</th><th>on 2.5.0</th><th>who notices</th><th>loss</th></tr>${RAIO.map(r => `<tr${r[0] === hi ? ' class="on"' : ''}><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</table>`;
  const WAVES = [['0–30 s', '0%', '3 + 1 starting'], ['30–60 s', '33%', '2 + 1 (+1 starting)'], ['60–90 s', '67%', '1 + 2 (+1 starting)'], ['90 s', '100%', '0 + 3']];
  const DATA = {
    rollback: () => `<li>Scenario (example): Tuesday, 14:00, <b>5 orders/s</b> (SP 55% · Rio 25% · Recife 20%); <code>pedidos</code> with 3 pods; pod ready in <b>30 s</b></li><li>The 2.5.0 defect: ZIP range 50000–52999 outside the new table → <code>frete = 0.00</code>, <code>201</code>, 0% errors; Lena's 1059: <b>64.00 → 49.00</b></li><li>Recife: 1 order/s × 3,600 s = <b>3,600</b> orders × 15.00 = <b>R$ 54,000</b>; at 23:00: R$ 486,000</li><table class="h3-sum"><tr><th>model</th><th>time to go back</th></tr><tr><td>Recreate</td><td>40 s, offline</td></tr><tr class="on"><td>Rolling (undo)</td><td>90 s</td></tr><tr><td>Blue/Green</td><td>~1 s with blue up; ~30 s if it already left</td></tr><tr><td>Canary</td><td>seconds (weight 0)</td></tr><tr><td>Flag</td><td>≤ 30 s (cache TTL)</td></tr><tr><td>The data</td><td>does not come back</td></tr></table><li>Kubernetes: <code>kubectl rollout undo</code>, <code>revisionHistoryLimit</code> 10 by default (0 = no way back), <code>progressDeadlineSeconds</code></li>`,
    recreate: () => `<li>Kubernetes, <code>strategy.type: Recreate</code>: all the old pods are shut down before the new ones are created</li><li>Offline: 10 s (shut down) + 30 s (ready) = <b>40 s</b>; 200 refused at 5/s, <b>1,200</b> at 30/s</li><li>If 2.5.0 does not start (<code>column "frete" does not exist</code>): 40 + 40 = <b>80 s</b>, 400 at 5/s, <b>2,400</b> at 30/s</li><li>Kafka (<code>entregas</code>, 3 partitions, 6 s per rebalance, example): rolling 3 × 2 × 6 = <b>36 s</b>; recreate 1 × 6 s</li><li>Corrections to the article: the criterion is the versions being unable to coexist (asynchrony is not a prerequisite); KIP-429 and <code>group.instance.id</code> make recreate optional for Kafka consumers</li>${raio('recreate')}`,
    rolling: () => { const on = { onda1: 0, onda2: 1, onda3: 2 }[cur().id]; const hi = cur().id === 'passa' ? 3 : on;
      return `<li>Kubernetes: <code>maxSurge</code> and <code>maxUnavailable</code> 25% by default; surge rounds <b>up</b>, unavailable rounds <b>down</b></li><table class="h3-sum"><tr><th>window</th><th>% on 2.5.0</th><th>pods 2.4.0 + 2.5.0</th></tr>${WAVES.map((r, i) => `<tr${i === hi ? ' class="on"' : ''}><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</table><li><code>catalogo</code>, 10 pods: surge 3, unavailable 2 → minimum 8 → 640 req/s at <b>80%</b>, 60 ms; unavailable 3 → 7 pods, <b>91.4%</b>, 126.7 ms</li><li>Health gates: <code>readinessProbe</code>, <code>minReadySeconds</code>, <code>progressDeadlineSeconds</code>, <code>kubectl rollout pause</code>; none measures the shipping</li>${raio('rolling')}`; },
    bluegreen: () => `<li>Blue = 2.4.0 (3 pods), green = 2.5.0 (3 pods); a single database; <code>catalogo</code> on Black Friday: 10 + 10 = 10 extra replica-hours per hour</li><li>Cold green (example): 200 ms × 640 req/s = <b>128</b> in flight (warm: 12.8); 10 pods × 10 workers = <b>100</b>; CPU 64%</li><li>Lab (<code>blue-green/simple</code> and <code>automated</code>): 5 replicas, <code>activeService: chip</code>, <code>previewService: chip-green</code>, <code>autoPromotionEnabled: false</code>, <code>scaleDownDelaySeconds: 60</code>; <code>cassowary -c 3 -n 1000</code> and <code>result[0] >= 0.95</code> before the promotion (not run here: it only runs on the author's cluster)</li><li>Argo Rollouts: <code>scaleDownDelaySeconds</code> is <b>30 s</b> by default</li>${raio('bluegreen')}`,
    canary: () => `<li>The store's plan: 0% (header <code>x-versao: v2</code>) → 10% → 50% → 100%, 5 min per step; technical analysis (5xx ≤ 0.1%, p95 ≤ 800 ms) <b>and</b> business analysis (<code>pedidos_frete_zero{cidade}</code> = 0)</li><li>10% × 5/s × 300 s = <b>150</b> orders, <b>30</b> from Recife, <b>R$ 450</b>; at the 50% step: 750, 150, R$ 2,250</li><li>Sample: 0.99<sup>150</sup> = <b>22%</b>; ln(0.05) ÷ ln(0.99) = <b>298</b> requests (10 min at 0.5/s; 4.7 s at 64/s); 2% error: 148; 5%: 58</li><li>Lab: <code>initial</code>/<code>simple</code> 0 → 10 → 20 → 40 → 80 → 100 with <code>pause: {}</code>; <code>time</code> with <code>duration: 10s</code> (50 s); <code>analysis</code> 20 → 50 → 100 (not run here); the store's business query is an adaptation, not run</li>${raio('canary')}`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const k = cur().act; if (!k) return ''; const A = ACTS[k];
    return `<div class="o3-mode r3-act" role="group" aria-label="${A.label}">${A.opts.map(([lab, sm], i) => `<button data-act3="${k}" data-v="${i}" aria-pressed="${i === actv[k]}">${lab}<small>${sm}</small></button>`).join('')}</div>`; }
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
      <div class="i3-sql"><b>${esc(s.yk || 'The math')}</b>${esc(codeOf(s).join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'rollout') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCFULL[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'rollout' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-rollout3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'rollout') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const p = e.target.closest('[data-act3]'); if (p) { actv[p.dataset.act3] = +p.dataset.v; lt = 0; render(); SFX.bit(1); } });
  backLink();

  // ── one frame of the scene ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], PL - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.w > 60 ? 0.3 : 0); });
    nDot = 0; setBeams(o.beams); o.dots.forEach(([p, tn, big]) => dot(p, tn, big));
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }
  const badEm = new THREE.Color(0xe0180c);

  // ── camera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // frames the scene in the free area (to the right of the panel on desktop, above it on mobile/embed)
      const [x0, x1, y0, y1] = [24, 790, 20, 440];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.9 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, kf = nar ? 1.16 : 1.05, D = Math.max(span * 0.707 / 100 * kf / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * kf / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C0 = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C0.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), Pp = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(Pp, k);
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
  // small text in light: the downscaled texture (mipmap) blends the stroke with the background in linear light and the dark ink loses contrast.
  // In light, the texture is read raw and the shader converts from sRGB after filtering (gamma average, as the screen downsizes text).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // starts with each piece already in the scenario's place (no rising at the opening)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(400, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(200, 230, 60), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–5 · drag to rotate' };
})() });
