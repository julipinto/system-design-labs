// Figura 3D (iso-glow): o ponto saudável. Um pod do pagamentos é o balcão (S = 50 ms, μ = 20/s); os pedidos chegam pela
// esteira da esquerda e esperam em fila na frente dele (bolinhas); o relógio da frente marca W e a coluna do fundo sobe com ρ.
// Na Lei de Little, o balcão dá lugar a uma régua de casas (o trabalho em voo, L = λ × W) e, no fim, ao pool de conexões ao PSP.
// Atrás, o mostrador (três números do passo e a conta, ou a curva W(ρ), ou as barras do CV).
// Cenários (botões e ?mode=fila|little|joelho; ?step=N abre no passo N; ?k=N fixa o valor N do seletor do passo).
// Dados: docs/escrita/capacity-planning-brief.md (M/M/1 do pagamentos: W = 50 ÷ (1 − ρ), L = ρ ÷ (1 − ρ), p95 = W × ln 20;
// P–K a 80%: 150 · 175 · 250 · 550 ms; Little: 75 · 127,5 · 150 · 300; pool 50 → 150; custo do ponto 2 · 5,6 · 12,5 · 50 · 200 ms).
FIGS3D.push({ id: 'ponto', name: 'Healthy point', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const num = (v, n = 1) => Math.abs(v) >= 1000 ? thou(v) : String(Math.round(v * 10 ** n) / 10 ** n);
  const ms = w => num(w, 0);
  const fL = v => v >= 9.95 ? num(v, 0) : v >= 5 ? num(v, 1) : num(v, 2);
  const pct = r => num(r * 100, 1) + '%';
  // a fila do pagamentos: S = 50 ms por cobrança, μ = 20/s por pod
  const S = 50, MU = 20;
  const Wmm = r => S / (1 - r), P95 = w => w * Math.log(20), Wpk = (r, cv) => S + r / (1 - r) * (1 + cv * cv) / 2 * S;
  const cost = r => S / (1 - r) ** 2 * 0.01;   // quanto custa mais 1 ponto de utilização (ms)
  const zone = r => r <= 0.7 + 1e-9 ? 'healthy' : r <= 0.8 + 1e-9 ? 'caution' : r <= 0.85 + 1e-9 ? 'knee' : r < 0.95 - 1e-9 ? 'above the knee' : 'maximum';
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#4a2100' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['fila', 'little', 'joelho'];
  const SCNAME = { fila: 'Queue', little: 'Little', joelho: 'Knee' };
  const SCFULL = { fila: 'The pagamentos queue', little: 'Little\'s Law', joelho: 'The knee curve' };
  const AULA = { fila: 'aula-2-teoria-das-filas', little: 'aula-3-lei-de-little-e-o-ponto-saudavel', joelho: 'aula-4-curva-do-joelho' };
  let clk = 0, sc = 'fila', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  let kv = 0, kPin = false, kT = 0, kUrl = null;
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; const k = q.get('k'); if (k != null && k !== '') kUrl = +k; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-ponto3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, LY = 245;
  plateWith(g0, 904, 452, [[14, 14], [890, 14], [14, 438], [890, 438]]);
  hazeAndShadow(g0, 452, 226, 10.4, 5.6);
  // o mostrador fica suspenso atrás, em dois pés, à esquerda
  const SZ = PL + 50, SW = 560, SH = SW * 143 / 416;
  rbox(24, 4, SZ, SW + 8, 12, SH + 8, 5, bodyMat, g0); rbox(44, 6, PL, 10, 8, 50, 2, bodyMat, g0); rbox(SW + 2, 6, PL, 10, 8, 50, 2, bodyMat, g0);
  // o desenho do mostrador é feito em 416 × 143 e ampliado (SK) para o texto ganhar pixels
  const scr = faceCanvas('front', 28, 16, SZ + SH + 4, SW, SH, 4, g0), SK = SW / 416;
  // blocos fixos; cada cenário mostra os seus (quem sai afunda na base)
  const B = {};
  function block(nm, x, y, w, d, h, P = 5) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, P, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    B[nm] = { g, mat, top, glow, x, y, w, d, h, key: '', f: 0 };
  }
  block('src', 14, 195, 130, 100, 24);     // de onde vêm os pedidos (λ)
  block('pod', 500, 190, 170, 110, 30);    // o balcão: um pod do pagamentos
  block('rack', 330, 180, 330, 130, 22);   // a régua do trabalho em voo (Little) e o pool ao PSP
  block('psp', 720, 195, 160, 100, 24);    // o PSP-A
  block('rho', 660, 24, 220, 126, 18);     // o medidor de ρ (a coluna fica no canto de trás)
  block('clk', 690, 326, 190, 104, 18);    // o relógio de W
  const NAMES = Object.keys(B);
  // a coluna do medidor: tubo de vidro com o enchimento por dentro e marcas em 70% e 85%
  const COLH = 150, CX = 12, CY = 8, CW_ = 40;
  const glassMat = new THREE.MeshBasicMaterial({ color: accent.clone(), transparent: true, opacity: 0.07, depthWrite: false, toneMapped: false });
  rbox(CX, CY, B.rho.h, CW_, CW_, COLH, 4, glassMat, B.rho.g);
  const colMat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const col = new THREE.Mesh(BOX, colMat); B.rho.g.add(col);
  const markMat = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  [0.7, 0.85].forEach(v => { const m = new THREE.Mesh(BOX, markMat); m.scale.set(12 * TS, 1.6 * TS, (CW_ + 4) * TS);
    m.position.copy(W(CX + CW_ + 4, CY + CW_ / 2, B.rho.h + COLH * v)); B.rho.g.add(m); });
  creases(first);

  // a esteira (calha escura) e as conexões grossas
  const laneMat = new THREE.MeshBasicMaterial({ color: 0x2b2e30, toneMapped: false });
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const LANES = Array.from({ length: 4 }, () => { const m = new THREE.Mesh(BOX, laneMat); m.visible = false; g0.add(m); return m; });
  const BEAMS = Array.from({ length: 2 }, () => { const m = new THREE.Mesh(BOX, beamOn); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  function setLanes(list) { LANES.forEach((m, i) => { const l = list[i]; m.visible = !!l; if (!l) return;
    m.position.copy(W((l[0] + l[1]) / 2, LY, PL + 1)); m.scale.set((l[1] - l[0]) * TS, 2 * TS, 30 * TS); }); }
  function setBeams(list) { BEAMS.forEach((m, i) => { const b = list[i]; m.visible = !!b; if (!b) return;
    const A = W(...b.a), C_ = W(...b.b), d = C_.clone().sub(A), len = d.length(), th = 5 * TS;
    m.material = b.tone === 'bad' ? beamBad : beamOn; m.position.copy(A).add(C_).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th); }); }
  // a cancela do L(alvo): dois postes e a travessa, em cima da esteira
  const gate = new THREE.Group(); g0.add(gate); gate.visible = false;
  [[0, -24, 0, 4, 4, 40], [0, 20, 0, 4, 4, 40], [0, -24, 38, 4, 48, 4]].forEach(([x, y, z, w, d, h]) => { const m = new THREE.Mesh(BOX, beamOn);
    m.scale.set(w * TS, h * TS, d * TS); m.position.copy(W(x + w / 2, y + d / 2, z + h / 2)); gate.add(m); });

  // as bolinhas: pedidos na esteira, no balcão e saindo
  const SPH = new THREE.SphereGeometry(8 * TS, 18, 12);
  const BALLS = Array.from({ length: 22 }, () => { const mat = capMat(); twCaps.push(mat); const m = new THREE.Mesh(SPH, mat); m.visible = false; g0.add(m); return { m, mat }; });
  const svcGlow = glowPoints([W(0, 0, 0)], 0.4); g0.add(svcGlow);
  const badEm = new THREE.Color(0xe0180c);
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  let phase = 0, cyc = 0;
  const SP_ = 24, SRC_X = 150;
  const slotsFor = x0 => Math.max(0, Math.floor((x0 - 16 - 170) / SP_));
  function placeBalls(q, dt) {
    if (!q) { BALLS.forEach(b => b.m.visible = false); svcGlow.material.uniforms.intensity.value = 0; return null; }
    phase += dt / q.T; while (phase >= 1) { phase -= 1; cyc++; }
    const e = sg(phase, 0, 0.55), nv = Math.min(q.n, slotsFor(q.x0)), slot = p => [q.x0 - 16 - p * SP_, LY, 0];
    const top = [q.x0 + 148, LY, 30];   // em cima do balcão (o pedido em atendimento)
    const pos = p => {
      if (p > nv) { const a = slot(nv), f = p - nv; return [a[0] + (SRC_X - a[0]) * f, LY, 0, 1]; }
      if (p >= 0) return [...slot(p), 1];
      if (!q.serve) { const a = slot(0), f = -p; return [a[0] + 26 * f, LY, 0, 1 - f]; }   // entra na régua
      if (p >= -1) { const a = slot(0), f = -p; return [a[0] + (top[0] - a[0]) * f, LY, top[2] * Math.sin(f * Math.PI / 2), 1]; }
      const f = -1 - p; return [top[0] + (890 - top[0]) * f, LY, top[2] * (1 - f), f > 0.85 ? (1 - f) / 0.15 : 1];
    };
    let i = 0;
    for (let k = -2; k <= nv && i < BALLS.length; k++) {
      const p = k + 1 - e, [x, y, z, a] = pos(p), b = BALLS[i++], id = cyc + k, h = hash(id);
      const heavy = q.cv > 0 && h < 0.1 * q.cv, s = q.cv > 0 ? (heavy ? 1 + 0.3 * q.cv : 1 - 0.08 * q.cv) : 1;
      const bad = q.tone === 'bad' && p >= 0;
      b.m.visible = a > 0.02 && !(k === -2 && !q.serve); b.m.scale.setScalar(s * Math.max(0.05, a));
      b.m.position.copy(W(x, y, PL + 2 + z + 8 * s));
      b.mat.emissive.copy(bad ? badEm : accent); b.mat.emissiveIntensity = bad ? 0.75 : 1.1;
    }
    for (; i < BALLS.length; i++) BALLS[i].m.visible = false;
    moveGlow(svcGlow, [top[0], LY, PL + top[2] + 18], q.serve ? 0.5 : 0);
    return { nv, tail: slot(Math.max(0, nv - 1)) };
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
      const col_ = t.tone === 'acc' ? accC() : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.96)' : 'rgba(18,19,20,.92)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.45); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col_; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col_ : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = (innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1) * 1.3; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const TF = x => [x, 418, 22];   // balões na faixa livre da frente

  // ── o que cada passo põe na cena ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  const base = () => ({ show: {}, on: {}, rows: {}, tags: [], cnt: [], res: [], q: null, gauge: null, clock: null, rack: null, gate: false, chart: null, lanes: [], beams: [] });
  // um pod do pagamentos com chegada lam (por pod) e variabilidade cv; extra = bolinhas a mais na fila (a rajada)
  function pod(o, lam, { cv = 1, extra = 0, tone } = {}) {
    const r = lam / MU, w = cv === 1 ? Wmm(r) : Wpk(r, cv), L = lam * w / 1000, Lq = Math.max(0, L - r), tn = tone || (r > 0.85 + 1e-9 ? 'bad' : 'acc');
    Object.assign(o.show, { src: 1, pod: 1, rho: 1, clk: 1 });
    o.rows.src = act('ARRIVAL', 'λ', [`${num(lam)} orders/s`, 'acc'], ['on one pod', 'dim']);
    o.rows.pod = act('pagamentos-1', '', ['S 50 ms · μ 20/s', 'dim'], [`ρ = ${pct(r)}`, tn], [`L = ${fL(L)} in the pod`, 'acc']); o.rows.pod.pad = 34;
    const n = Math.round(Lq) + extra;
    o.q = { x0: 500, n, T: clamp(9 / lam, 0.42, 1.1), cv, serve: true, tone: tn === 'bad' ? 'bad' : '', tag: n > slotsFor(500) ? `queue: ${fL(Lq + extra)}` : null };
    o.gauge = { v: r, lab: 'UTILIZATION ρ', zones: true };
    o.clock = { w, lab: 'AVG W', tone: w >= 500 ? 'bad' : 'acc' };
    o.on.pod = tn === 'bad' ? 'bad' : 1; o.on.src = 2;
    o.lanes.push([144, 500], [670, 890]);
    return { r, w, L, Lq };
  }
  // a régua do trabalho em voo: chegada lam (por s), tempo w (s), cap casas
  function ruler(o, lam, w, cap, name, meta, srcName, srcMeta) {
    const L = lam * w, over = L - cap;
    Object.assign(o.show, { src: 1, rack: 1, clk: 1 });
    o.rows.src = act(srcName, srcMeta, [`${thou(lam)}/s`, 'acc'], ['λ, the arrival', 'dim']);
    o.rack = { cap, L, name, meta };
    o.on.rack = over > 0.5 ? 'bad' : 1; o.on.src = 2;
    o.q = { x0: 330, n: over > 0.5 ? Math.round(over) : 0, T: 0.42, cv: 0, serve: false, tone: over > 0.5 ? 'bad' : '', tag: over > 0.5 ? `+${thou(over)} no room` : null };
    o.lanes.push([144, 330]);
    return { L, over };
  }

  const STEPS = {
    fila: [
      { id: 'pod', dur: 6, title: 'One pagamentos pod: 10 orders/s, ρ = 50%', yk: 'M/M/1 · ONE POD',
        code: ['S = 50 ms → μ = 1 ÷ 0.05 = 20/s', 'λ = 10/s → ρ = 10 ÷ 20 = 50%', 'W = S ÷ (1 − ρ) = 50 ÷ 0.5 = 100 ms', 'L = ρ ÷ (1 − ρ) = 1', 'p95 = W × ln 20 = 300 ms'],
        story: 'Each charge takes 50 ms of CPU on a pagamentos pod. So a pod serves 1 ÷ 0.05 = 20 charges per second: that is μ. With 10 arriving per second (λ), it is busy half the time, ρ = 10 ÷ 20 = 50%, and each order takes 100 ms on average: 50 of service and 50 of queue.',
        look: 'The orders leave the block on the left and ride the conveyor to the pagamentos-1 counter. The ball on top of the counter is the one being served. The clock in front shows W; the column at the back rises with ρ.',
        key: 'Every queue has an arrival (λ), a service (μ) and an order; utilization is ρ = λ ÷ μ.',
        f(o, t) { pod(o, 10); o.cnt = [['ρ', '50%'], ['W', '100 ms', 'dim'], ['L', '1 in the pod', 'dim']];
          o.res = [['busy half the time: W = 2 × S', 'acc']];
          if (t > 1.2) T(o, TF(420), 'ρ = 50%\nW = 100 ms'); } },
      { id: 'bf', dur: 6, title: 'Black Friday 2026: 15/s per pod, 200 ms', yk: 'THE 2026 NIGHT', act: ['Black Friday', '15/s per pod'],
        code: ['30 orders/s ÷ 2 pods = 15/s per pod', 'ρ = 15 ÷ 20 = 75%', 'W = 50 ÷ 0.25 = 200 ms (4 × S)', 'L = 0.75 ÷ 0.25 = 3', 'p95 = 200 × ln 20 = 599 ms'],
        story: 'On Black Friday 2026, 30 orders/s reached pagamentos, split across 2 pods: 15 for each. Utilization hit 75% and the average time was W = 50 ÷ 0.25 = 200 ms. The arrival rose 50% (from 10 to 15 per second) and the time doubled.',
        look: 'The queue grew in front of the counter: now there are 3 orders in the pod, counting the one being served. The clock hand reaches 200.',
        key: 'Response time grows with 1 ÷ (1 − ρ), faster than the load.',
        f(o, t) { pod(o, 15); o.cnt = [['ρ', '75%'], ['W', '200 ms', 'dim'], ['L', '3 in the pod', 'dim']];
          o.res = [['+50% arrival, 2× the time', 'acc']];
          if (t > 1.2) T(o, TF(420), '15/s: ρ = 75%\nW = 200 ms'); } },
      { id: 'chegada', dur: 18, title: 'Move the arrival: from 8 to 19.8 orders/s', yk: 'ARRIVAL AND THE QUEUE', act: ['Move the arrival', '8 to 19.8/s'],
        knob: { label: 'Arrival λ (orders/s per pod)', vals: [8, 10, 12, 14, 16, 18, 19, 19.8], fmt: v => num(v) },
        code: l => { const r = l / MU, w = Wmm(r); return [`λ = ${num(l)}/s → ρ = ${num(l)} ÷ 20 = ${pct(r)}`, `W = 50 ÷ ${num(1 - r, 3)} = ${ms(w)} ms (${num(w / S, 1)} × S)`, `L = ρ ÷ (1 − ρ) = ${fL(r / (1 - r))}`, `p95 = W × ln 20 = ${ms(P95(w))} ms`]; },
        story: 'Pick the arrival on the selector, or wait for the tour to run on its own. Up to about 60% the queue barely shows. From there on, each extra order per second weighs more than the last: at 90% W is 500 ms, at 95% it is 1 s and at 99% it is 5 s, a hundred times the service time.',
        look: 'The queue in front of the counter stretches with each value; at 95% it goes past the end of the conveyor and the bubble at the tip counts the rest. On the display, the dot walks along the W(ρ) curve.',
        key: 'Near 100% utilization the queue explodes: W = S ÷ (1 − ρ).',
        f(o, t, l) { const s = pod(o, l); o.chart = { kind: 'curve', r: s.r };
          o.cnt = [['ρ', pct(s.r), s.r > 0.85 ? 'bad' : ''], ['W', ms(s.w) + ' ms', s.w >= 500 ? 'bad' : 'dim'], ['L', fL(s.L) + ' in the pod', 'dim']];
          o.res = [[`${num(l)}/s → ${ms(s.w)} ms`, s.r > 0.85 ? 'bad' : 'acc']];
          T(o, TF(420), `λ = ${num(l)}/s · ρ = ${pct(s.r)}\nW = ${ms(s.w)} ms`, s.r > 0.85 ? 'bad' : 'acc'); } },
      { id: 'cv', dur: 14, title: 'Same utilization, different wait: CV from 0 to 2', yk: 'POLLACZEK–KHINCHINE AT 80%', act: ['Variability', 'CV from 0 to 2'],
        knob: { label: 'Service variability (CV)', vals: [0, 0.5, 1, 2], fmt: v => 'CV ' + num(v) },
        code: cv => { const w = Wpk(0.8, cv); return ['W = S + ρ ÷ (1 − ρ) × (1 + CV²) ÷ 2 × S', 'ρ = 80% → ρ ÷ (1 − ρ) = 4', `CV = ${num(cv)}: W = 50 + 4 × ${num((1 + cv * cv) / 2, 3)} × 50`, `   = ${ms(w)} ms · L = 16 × ${num(w / 1000, 3)} = ${fL(16 * w / 1000)}`]; },
        story: 'Now the arrival stays fixed at 16/s (80%) and what changes is the service variability, measured by the coefficient of variation (CV). If every charge took exactly 50 ms (CV = 0), W would be 150 ms. With exponential times (CV = 1, M/M/1), 250 ms. With a mix of light and heavy charges (CV = 2), 550 ms.',
        look: 'As the CV rises, the balls get different sizes: the big ones are the heavy charges. The queue grows without the arrival changing. On the display, the four W bars.',
        key: 'The wait depends on ρ and on variability: same average, different queues.',
        f(o, t, cv) { const s = pod(o, 16, { cv }); o.chart = { kind: 'cv', cv };
          o.cnt = [['ρ', '80%'], ['W', ms(s.w) + ' ms', s.w >= 500 ? 'bad' : 'dim'], ['CV', num(cv), 'dim']];
          o.res = [[`CV ${num(cv)}: ${ms(s.w)} ms`, s.w >= 500 ? 'bad' : 'acc']];
          T(o, TF(420), `ρ = 80% · CV = ${num(cv)}\nW = ${ms(s.w)} ms`, s.w >= 500 ? 'bad' : 'acc'); } },
      { id: 'errado', dur: 8, title: 'If it goes wrong: the dashboard shows 80% and the customer waits 550 ms', yk: 'WHAT THE DASHBOARD DOES NOT SHOW', act: ['If it goes wrong', 'CPU 80%, 550 ms'],
        code: ['ρ = 80% in both cases (CPU 80%)', 'CV = 0: W = 150 ms', 'CV = 2: W = 550 ms', '550 ÷ 150 = 3.7×'],
        story: 'pagamentos serves a mix of light and heavy charges (CV = 2) at 80% utilization. The CPU dashboard shows 80%, and the utilization looks healthy. The average time is 550 ms, 3.7 times that of a regular service with the same capacity and the same utilization.',
        look: 'The gauge column stops at 80%, with no alarm. The clock passes 500 and turns red, and the line of uneven balls fills the conveyor.',
        key: 'Utilization alone does not give the response time: look at variability and percentiles along with CPU.',
        f(o, t) { pod(o, 16, { cv: 2 }); o.gauge.lab = 'CPU (THE DASHBOARD)';
          o.cnt = [['CPU', '80%'], ['W', '550 ms', 'bad'], ['WITH CV = 0', '150 ms', 'dim']];
          o.res = [['same CPU, 3.7× the time', 'bad']];
          if (t > 1.2) T(o, TF(420), 'CPU 80%, CV = 2\nW = 550 ms (3.7×)', 'bad'); } },
    ],
    little: [
      { id: 'artigo', dur: 8, title: 'L = λ × W: 1,500 msg/s × 50 ms = 75 in flight', yk: 'LITTLE\'S LAW',
        code: ['L = λ × W', '1,500 × 0.050 s = 75', '1,500 × 0.085 s = 127.5', '+52.5 (the article rounds: 127 and 52)'],
        story: 'Little\'s Law counts the work inside the system: L = λ × W. In the article\'s example, a consumer receives 1,500 messages/s and each stays 50 ms inside: there are 75 messages in flight at any moment. If the time rises to 85 ms, they become 127.5 (the article rounds to 127), with the same arrival.',
        look: 'Each lit cell on the ruler is a message in flight. When the clock goes from 50 to 85 ms, 52 more cells light up without the arrival changing.',
        key: 'L = λ × W: the work in flight is the arrival rate times the time inside.',
        f(o, t) { const w = 0.05 + 0.035 * sg(t, 2.6, 4), s = ruler(o, 1500, w, 150, 'CONSUMER', 'messages in flight', 'ARRIVAL', 'msg');
          o.clock = { w: w * 1000, lab: 'W', max: 100, tone: 'acc' };
          o.cnt = [['L', num(s.L, 1) + ' in flight'], ['λ', '1,500/s', 'dim'], ['W', ms(w * 1000) + ' ms', 'dim']];
          o.res = t > 4 ? [['85 ms: 127.5 in flight (+52.5)', 'acc']] : [['50 ms: 75 in flight', 'acc']];
          T(o, TF(330), `L = 1,500 × ${num(w, 3)} s\n= ${num(s.L, 1)} in flight`); } },
      { id: 'alvo', dur: 10, title: 'Target L = 150: with W halved, double the arrival', yk: 'THE TARGET L OF A REST API', act: ['Target L', 'REST API, 150'],
        code: ['500 × 0.3 s = 150 = target L', '1,000 × 0.3 s = 300 (150 with no room)', 'target W = 150 ÷ 1,000 = 150 ms', 'W halved → double (+100%), not +50%'],
        story: 'A REST API handles 150 requests in flight without degrading: that is the target L. At 500 req/s with 300 ms, L = 150, right at the limit. If the arrival doubles to 1,000 req/s with the same W, L goes to 300. To fit again, W has to drop to target L ÷ λ = 150 ÷ 1,000 = 150 ms. The article says halving W processes 50% more; the math gives double.',
        look: 'The ruler has 150 cells. At 1,000 req/s it fills up and a red queue is left outside; when the clock drops to 150 ms, the queue disappears.',
        key: 'Target W = target L ÷ λ: with W halved, the same concurrency serves double.',
        f(o, t) { const ph = t < 2.5 ? 0 : t < 5.5 ? 1 : 2, lam = ph ? 1000 : 500, w = ph === 2 ? 0.15 : 0.3;
          const s = ruler(o, lam, w, 150, 'REST API', 'target L 150', 'ARRIVAL', 'req');
          o.gauge = { v: s.L / 150, lab: 'L ÷ target L' }; o.show.rho = 1;
          o.clock = { w: w * 1000, lab: 'W', max: 500, tone: ph === 2 ? 'acc' : ph ? 'bad' : 'acc' };
          o.cnt = [['L', thou(s.L) + ' in flight', s.over > 0 ? 'bad' : ''], ['λ', thou(lam) + '/s', 'dim'], ['W', ms(w * 1000) + ' ms', 'dim']];
          o.res = [[['500 × 0.3 = 150: at the limit', 'acc'], ['1,000 × 0.3 = 300: double', 'bad'], ['1,000 × 0.15 = 150: fits', 'acc']][ph]];
          T(o, TF(300), `${thou(lam)} × ${num(w, 2)} s = ${thou(s.L)}`, s.over > 0 ? 'bad' : 'acc'); } },
      { id: 'pod', dur: 12, title: 'On pagamentos: target L = 4 per pod', yk: 'LITTLE ON A POD', act: ['One pod', 'target L = 4'],
        knob: { label: 'Arrival λ (orders/s per pod)', vals: [14, 15, 16], fmt: v => num(v) },
        code: l => { const r = l / MU, w = Wmm(r), L = l * w / 1000; return [`λ = ${l}/s · W = ${ms(w)} ms`, `L = ${l} × ${num(w / 1000, 3)} s = ${fL(L)}`, `ρ = ${pct(r)}: L = ρ ÷ (1 − ρ) = ${fL(L)}`, 'target L = 4 ⇔ ρ = 80%']; },
        story: 'On a pagamentos pod, L = λ × W = ρ ÷ (1 − ρ). At the healthy point (70%, 14/s) there are 2.33 orders in the pod. On Black Friday 2026 (15/s), 3. The target L of pagamentos is 4 per pod, which corresponds to ρ = 80%: with more than that inside, the response leaves the acceptable range.',
        look: 'The gate on the conveyor marks the target L: 4 orders in the pod, one at the counter and three in the queue. Change the arrival and watch the queue reach the gate at 16/s.',
        key: 'The target L is the contract of the healthy point: how many orders fit in the pod before the response degrades.',
        f(o, t, l) { const s = pod(o, l); o.gate = true;
          o.cnt = [['L', fL(s.L) + ' in the pod', s.L > 3.99 ? 'bad' : ''], ['TARGET L', '4', 'dim'], ['ρ', pct(s.r), 'dim']];
          o.res = [[s.L > 3.99 ? 'L = 4: at the gate (ρ = 80%)' : `L = ${fL(s.L)}: below 4`, s.L > 3.99 ? 'bad' : 'acc']];
          T(o, TF(320), `L = ${l} × ${num(s.w / 1000, 3)} s = ${fL(s.L)}`, s.L > 3.99 ? 'bad' : 'acc'); } },
      { id: 'pool', dur: 10, title: 'The pool to the PSP: 200 orders/s × 0.18 s = 36 in flight', yk: 'THE POOL SIZE', act: ['PSP pool', '200 orders/s'],
        code: ['30/s × 0.18 s = 5.4 (module 21)', '200/s × 0.18 s = 36 → 72% of 50', 'critical timeout = 50 ÷ 200 = 0.25 s', 'pool = 36 × headroom 4 = 144 → 150', '150 ÷ 200 = tolerates W up to 0.75 s'],
        story: 'Each charge holds a connection to the PSP while it waits for the response, 0.18 s normally. At 30 orders/s that was 5.4 connections in use and the module 21 pool of 50 had room to spare. At 200 orders/s it is 36 (72% of the pool), and the critical timeout drops to 50 ÷ 200 = 0.25 s, below PSP-A\'s p99.9 (700 ms). The plan takes the pool to 150.',
        look: 'The pool ruler has 50 slots and 36 light up. Then it grows to 150 slots and the same 36 sit with room to spare.',
        key: 'The pool size comes from Little\'s Law: λ × W × headroom.',
        f(o, t) { const big = t > 4, cap = big ? 150 : 50, s = ruler(o, 200, 0.18, cap, 'PSP POOL', `${cap} connections`, 'pagamentos', 'orders/s');
          o.show.psp = 1; o.rows.psp = act('PSP-A', 'external', ['W = 0.18 s', 'acc'], ['p99.9 = 700 ms', 'dim']); o.on.psp = 1;
          o.beams.push({ a: [660, LY, PL + 14], b: [720, LY, PL + 14] });
          o.gauge = { v: s.L / cap, lab: 'POOL USAGE' }; o.show.rho = 1;
          o.clock = { w: 180, lab: 'PSP W', tone: 'acc' };
          o.cnt = [['L', '36 in flight'], ['pool', `${cap} connections`, 'dim'], ['usage', pct(36 / cap), 'dim']];
          o.res = big ? [['pool 150: tolerates W up to 0.75 s', 'acc']] : [['36 of 50: critical at 0.25 s', 'acc']];
          T(o, TF(300), big ? '36 of 150 (24%)' : '200 × 0.18 s = 36\n72% of 50'); } },
      { id: 'errado', dur: 10, title: 'If it goes wrong: the pool saturates with the CPU at 33%', yk: 'THE FORGOTTEN POOL', act: ['If it goes wrong', 'PSP at 0.5 s'],
        knob: { label: 'PSP-A W (s)', vals: [0.18, 0.25, 0.35, 0.5], fmt: v => num(v, 2) + ' s' },
        code: w => { const L = 200 * w, thr = Math.min(200, 50 / w); return ['15 pods, pool of 50 (forgotten)', `PSP-A at ${num(w, 2)} s: L = 200 × ${num(w, 2)} = ${num(L, 1)}`,
          L > 50.5 ? `${num(L, 1)} in flight > 50 connections: ${num(L - 50, 1)} wait` : `${num(L, 1)} of 50 connections: still fits`, `throughput = ${L > 50.5 ? `50 ÷ ${num(w, 2)} = ` : ''}${num(thr, 1)} charges/s`, `CPU = ${num(thr, 1)} × 0.05 ÷ 15 = ${pct(thr * 0.05 / 15)}`]; },
        story: 'The team takes pagamentos from 2 to 15 pods and forgets the pool. Stretch PSP-A\'s time on the selector, from 0.18 s to 0.5 s. At 0.5 s, L = 200 × 0.5 = 100 in flight, against 50 connections: half wait outside. The pool only lets 50 ÷ 0.5 = 100 charges per second through, and the CPU of the 15 pods drops to 33%.',
        look: 'The 50-slot ruler fills up and turns red; the queue outside grows. The column at the back, which now measures CPU, goes down while the pool saturates.',
        key: 'CPU does not see the slow dependency; concurrency (L) does. Scale by L or by the queue and put the pool on the limits sheet.',
        f(o, t, w) { const s = ruler(o, 200, w, 50, 'PSP POOL', '50 connections', 'pagamentos', '15 pods');
          o.show.psp = 1; o.rows.psp = act('PSP-A', 'external', [`W = ${num(w, 2)} s`, w > 0.25 ? 'bad' : 'acc'], ['slow', 'bad']); o.on.psp = w > 0.25 ? 'bad' : 1;
          o.beams.push({ a: [660, LY, PL + 14], b: [720, LY, PL + 14], tone: s.over > 0 ? 'bad' : '' });
          const cpu = Math.min(200, 50 / w) * 0.05 / 15; o.gauge = { v: cpu, lab: 'CPU OF THE 15 PODS' }; o.show.rho = 1;
          o.clock = { w: w * 1000, lab: 'PSP W', tone: w > 0.25 ? 'bad' : 'acc' };
          o.cnt = [['L', `${thou(s.L)} in flight`, s.over > 0 ? 'bad' : ''], ['pool', '50 connections', 'dim'], ['CPU', pct(cpu), 'dim']];
          o.res = s.over > 0 ? [['pool full, CPU low', 'bad']] : [];
          T(o, TF(300), `${num(s.L, 1)} in flight, 50 connections\nCPU ${pct(cpu)}`, s.over > 0 ? 'bad' : 'acc'); } },
    ],
    joelho: [
      { id: 'curva', dur: 9, title: 'The W(ρ) curve is a curve from the start', yk: 'THE TIME AT EACH UTILIZATION',
        code: ['50% →   100 ms', '70% →   167 ms', '80% →   250 ms', '90% →   500 ms', '95% → 1,000 ms'],
        story: 'The article says that, under normal conditions, latency grows linearly. In a queue, W = S ÷ (1 − ρ) is already a curve from the start: from 0 to 50% W only doubles (from 50 to 100 ms) and looks like a line; from 50% to 95% it goes from 100 ms to 1 s. And there is no corner where everything suddenly changes.',
        look: 'The dot climbs the curve on the display and the gauge column rises with it. The clock moves slowly at first and shoots up at the end.',
        key: 'The response does not grow in a straight line: each point of utilization costs more than the last.',
        f(o, t) { const r = 0.3 + 0.65 * sg(t, 0.6, 7.5), s = pod(o, r * MU); o.chart = { kind: 'curve', r };
          o.cnt = [['ρ', pct(r), r > 0.85 ? 'bad' : ''], ['W', ms(s.w) + ' ms', s.w >= 500 ? 'bad' : 'dim'], ['W ÷ S', num(s.w / S, 1) + '×', 'dim']];
          o.res = [['looks straight up to ~50%, then shoots up', 'acc']];
          T(o, TF(420), `ρ = ${pct(r)}\nW = ${ms(s.w)} ms`, r > 0.85 ? 'bad' : 'acc'); } },
      { id: 'custo', dur: 14, title: 'What one more point of utilization costs', yk: 'THE COST OF THE POINT', act: ['Cost of the point', '50 to 95%'],
        knob: { label: 'Utilization ρ', vals: [0.5, 0.7, 0.8, 0.9, 0.95], fmt: v => pct(v) },
        code: r => [`ρ = ${pct(r)}: W = ${ms(Wmm(r))} ms`, '+1 point = 50 ÷ (1 − ρ)² × 0.01', `        = ${num(cost(r), 1)} ms`, `${num(cost(r) / cost(0.7), 1)}× the cost at 70%`],
        story: 'The slope of the curve says what it costs to raise utilization by 1 point. At 50%, 2 ms. At 70%, 5.6 ms. At 80%, 12.5 ms. At 90%, 50 ms, nine times the cost at 70%. At 95%, 200 ms per point.',
        look: 'The dot jumps through the selector\'s utilizations; the bubble beside it says the cost of one more point, and the number grows with each jump.',
        key: 'The knee is where the cost of one more point passes the limit the team accepts.',
        f(o, t, r) { const s = pod(o, r * MU); o.chart = { kind: 'curve', r, cost: true };
          o.cnt = [['+1 POINT', `+${num(cost(r), 1)} ms`, r > 0.85 ? 'bad' : ''], ['ρ', pct(r), 'dim'], ['W', ms(s.w) + ' ms', 'dim']];
          o.res = [[`at ${pct(r)}, each point costs ${num(cost(r), 1)} ms`, r > 0.85 ? 'bad' : 'acc']];
          T(o, TF(420), `ρ = ${pct(r)}\n+1 point: +${num(cost(r), 1)} ms`, r > 0.85 ? 'bad' : 'acc'); } },
      { id: 'zonas', dur: 14, title: 'The zones: healthy up to 70%, knee at 80–85%', yk: 'THE STORE\'S ZONES', act: ['Zones', '70 · 80 · 85 · 95'],
        knob: { label: 'Zone boundary', vals: [0.7, 0.8, 0.85, 0.95], fmt: v => pct(v) },
        code: r => [`ρ = ${pct(r)}: ${zone(r)}`, `W = ${ms(Wmm(r))} ms = ${num(Wmm(r) / S, 1)} × S`, '≤ 70% healthy · 70–80% caution', '80–85% knee · 95% maximum'],
        story: 'The store picks limits on the smooth curve. Up to 70% is the healthy point: the HPA target, with margin for bursts. From 70% to 80%, caution. From 80% to 85% sits the article\'s knee, with W = 5 × S. At 95% the pod still serves, but with W = 20 × S and errors. Module 14 (70%) and the article (80–85%) do not clash: the knee is where the response leaves the acceptable range, and 70% is the target that leaves margin for variability.',
        look: 'The color bands show on the display and on the gauge ruler. The dot visits the boundary of each zone.',
        key: '70% is the operating target; the knee, 80–85%, is where the response stops being acceptable.',
        f(o, t, r) { const s = pod(o, r * MU); o.chart = { kind: 'curve', r, bands: true };
          o.cnt = [['zone', zone(r), r > 0.85 ? 'bad' : ''], ['ρ', pct(r), 'dim'], ['W', `${ms(s.w)} ms (${num(s.w / S, 1)}×)`, 'dim']];
          o.res = [[`${pct(r)}: ${zone(r)}`, r > 0.85 ? 'bad' : 'acc']];
          T(o, TF(420), `${pct(r)}: ${zone(r)}\nW = ${num(s.w / S, 1)} × S`, r > 0.85 ? 'bad' : 'acc'); } },
      { id: 'errado', dur: 10, title: 'If it goes wrong: "no errors yet, let\'s run at 95%"', yk: 'AT 95% THERE IS NO MARGIN', act: ['If it goes wrong', 'run at 95%'],
        code: ['ρ = 95%: W = 50 ÷ 0.05 = 1,000 ms (20 × S)', '+1 point = 200 ms', 'p95 = 1,000 × ln 20 = 2,996 ms', 'lb-loja timeout: 2,000 ms → 504'],
        story: 'At 95%, W is already 1 s, 20 times the service time, and each extra point costs 200 ms. At 20:00 the newsletter arrives: any burst throws the p95 to 3 s. lb-loja\'s timeout is 2 s, and whatever goes past it comes back as a 504.',
        look: 'The column is in the red band. When the burst arrives, the queue spills off the conveyor and the clock, which now shows the p95, goes past the timeout mark.',
        key: 'Near the maximum there is no margin: the first burst becomes an error.',
        f(o, t) { const burst = Math.round(14 * sg(t, 2.2, 3.6)), s = pod(o, 19, { extra: burst, tone: 'bad' }); o.chart = { kind: 'curve', r: 0.95, bands: true };
          const p = t > 2.2 ? P95(s.w) : s.w;
          o.clock = { w: p, lab: t > 2.2 ? 'p95' : 'AVG W', max: 3000, mark: 2000, tone: 'bad' };
          o.cnt = [['p95', t > 2.2 ? '2,996 ms' : '…', 'bad'], ['W', '1,000 ms', 'dim'], ['TIMEOUT', '2,000 ms', 'dim']];
          o.res = t > 3.6 ? [['p95 > timeout: 504 on lb-loja', 'bad']] : [['95%: W = 20 × S', 'bad']];
          if (t > 2.2) T(o, TF(330), '20:00 burst\np95 ≈ 3 s > 2 s: 504', 'bad'); } },
    ],
  };
  const L_ = () => STEPS[sc], N = () => L_().length, cur = () => L_()[step];
  step = Math.min(step, N() - 1);
  const knob = () => cur().knob || null;
  const kval = () => { const k = knob(); return k ? k.vals[Math.min(kv, k.vals.length - 1)] : undefined; };
  const codeOf = s => typeof s.code === 'function' ? s.code(kval()) : s.code;
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt, kval()); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col_, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col_; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.58 : W_ - 10); x.fillText(d.name, u(5), u(10)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(10)); x.textAlign = 'left'; } }
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
    head(x, u, d, W_, on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, 13);
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke();
    let y = 34; for (const [text, tn] of d.rows || []) { x.fillStyle = toneC(tn); fitFont(x, u, text, 12.5, W_ - 10 - (d.pad || 0)); x.fillText(text, u(5), u(y)); y += 19; }
    cv.tex.needsUpdate = true;
  }
  // a régua: uma casa por unidade em voo (cap casas); o excesso fica do lado de fora, na esteira
  function drawRack(Bk, r) {
    const used = Math.min(r.cap, Math.round(r.L)), over = r.L > r.cap + 0.5;
    const key = JSON.stringify([r.cap, used, over, r.name, r.meta]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, { x, u, C } = frameBox(cv, true, over ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    head(x, u, { name: r.name, meta: r.meta }, W_, over ? BAD() : accC(), 13);
    const cols = r.cap > 60 ? 25 : 10, rows = Math.ceil(r.cap / cols), gx = 6, gy = 22, gw = W_ - 12, gh = H_ - 44, cw = gw / cols, ch = gh / rows;
    for (let i = 0; i < r.cap; i++) { const cx = gx + (i % cols) * cw, cy = gy + Math.floor(i / cols) * ch, lit = i < used;
      x.fillStyle = lit ? (over ? BAD() : accC()) : theme === 'light' ? '#e2e2e1' : '#202124'; x.fillRect(u(cx + 1), u(cy + 1), u(cw - 2), u(ch - 2)); }
    x.fillStyle = over ? BAD() : C.inkHi; x.textAlign = 'left';
    const txt = `${num(r.L, 1)} in flight · ${r.cap} cells` + (over ? ' · full' : ` · ${pct(r.L / r.cap)}`);
    fitFont(x, u, txt, 12, W_ - 10); x.fillText(txt, u(5), u(H_ - 10));
    cv.tex.needsUpdate = true;
  }
  // o medidor: valor grande, a régua das zonas (70 · 80 · 85 · 95) e a zona atual; a coluna 3D fica no canto de trás
  function drawGauge(Bk, g) {
    const key = JSON.stringify(g) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, bad = g.v > 0.85 + 1e-9 && g.zones || g.v > 1.0001, { x, u, C } = frameBox(cv, true, bad ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const X0 = 60; x.textAlign = 'left'; x.fillStyle = INK(); fitFont(x, u, g.lab, 10, W_ - X0 - 6); x.fillText(g.lab, u(X0), u(11));
    x.fillStyle = bad ? BAD() : accC(); fitFont(x, u, pct(g.v), 25, W_ - X0 - 6); x.fillText(pct(g.v), u(X0), u(34));
    const bx = 6, bw = W_ - 12, by = 58, bh = 12, light = theme === 'light', a = '#' + accent.getHexString();
    const seg = (v0, v1, col_, al) => { x.globalAlpha = al; x.fillStyle = col_; x.fillRect(u(bx + bw * v0), u(by), u(bw * (v1 - v0)), u(bh)); x.globalAlpha = 1; };
    if (g.zones) { seg(0, 0.7, a, light ? 0.35 : 0.3); seg(0.7, 0.8, a, light ? 0.6 : 0.55); seg(0.8, 0.85, a, 0.95); seg(0.85, 0.95, BAD(), 0.45); seg(0.95, 1, BAD(), 0.9); }
    else { seg(0, 1, C.line, 0.35); seg(0, clamp(g.v), g.v > 1.0001 ? BAD() : a, 0.8); }
    x.strokeStyle = C.line; x.lineWidth = u(0.5); x.strokeRect(u(bx), u(by), u(bw), u(bh));
    const px = bx + bw * clamp(g.v); x.fillStyle = bad ? BAD() : INK(); x.beginPath(); x.moveTo(u(px), u(by - 1)); x.lineTo(u(px - 4), u(by - 7)); x.lineTo(u(px + 4), u(by - 7)); x.closePath(); x.fill();
    x.fillStyle = INK(); x.textAlign = 'center';
    if (g.zones) { [0.7, 0.8, 0.85, 0.95].forEach((v, i) => { fitFont(x, u, String(v * 100), 8.6, 20); x.fillText(String(Math.round(v * 100)), u(bx + bw * v + (i === 2 ? 4 : i === 1 ? -4 : 0)), u(by + bh + 9)); });
      x.textAlign = 'left'; x.fillStyle = bad ? BAD() : accC(); fitFont(x, u, 'zone: ' + zone(g.v), 12, W_ - 12); x.fillText('zone: ' + zone(g.v), u(6), u(H_ - 12)); }
    else { [0, 0.5, 1].forEach(v => { fitFont(x, u, v * 100 + '%', 8.6, 30); x.fillText(v * 100 + '%', u(clamp(bx + bw * v, 12, W_ - 14)), u(by + bh + 9)); }); }
    x.textAlign = 'left'; cv.tex.needsUpdate = true;
  }
  // o relógio: meio mostrador com o ponteiro (0 a max) e o valor grande; mark = a marca vermelha do timeout
  function drawClock(Bk, c) {
    const max = c.max || 1000, key = JSON.stringify([c, Math.round(c.w)]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const bad = c.tone === 'bad', cv = Bk.top, { x, u, C } = frameBox(cv, true, bad ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const cx = 52, cy = 76, R = 40, col_ = bad ? BAD() : accC();
    x.lineCap = 'round'; x.strokeStyle = theme === 'light' ? '#cfd1d2' : '#2b2e30'; x.lineWidth = u(7); x.beginPath(); x.arc(u(cx), u(cy), u(R), Math.PI, 2 * Math.PI); x.stroke();
    const f = clamp(c.w / max); x.strokeStyle = col_; x.beginPath(); x.arc(u(cx), u(cy), u(R), Math.PI, Math.PI * (1 + f)); x.stroke(); x.lineCap = 'butt';
    if (c.mark) { const a = Math.PI * (1 + c.mark / max); x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(cx + Math.cos(a) * (R - 9)), u(cy + Math.sin(a) * (R - 9))); x.lineTo(u(cx + Math.cos(a) * (R + 9)), u(cy + Math.sin(a) * (R + 9))); x.stroke(); }
    const a = Math.PI * (1 + f); x.strokeStyle = C.inkHi; x.lineWidth = u(2); x.beginPath(); x.moveTo(u(cx), u(cy)); x.lineTo(u(cx + Math.cos(a) * (R - 6)), u(cy + Math.sin(a) * (R - 6))); x.stroke();
    x.fillStyle = C.inkHi; x.beginPath(); x.arc(u(cx), u(cy), u(3), 0, Math.PI * 2); x.fill();
    x.fillStyle = INK(); x.textAlign = 'center'; fitFont(x, u, '0', 8.6, 14); x.fillText('0', u(cx - R), u(cy + 10)); const mx = ms(max); fitFont(x, u, mx, 8.6, 40); x.fillText(mx, u(cx + R), u(cy + 10));
    x.textAlign = 'left'; fitFont(x, u, c.lab, 10, W_ - 104); x.fillText(c.lab, u(100), u(14));
    x.fillStyle = col_; fitFont(x, u, ms(c.w), 26, W_ - 104); x.fillText(ms(c.w), u(100), u(44));
    x.fillStyle = INK(); fitFont(x, u, 'ms', 12, 40); x.fillText('ms', u(100), u(66));
    if (c.mark) { x.fillStyle = BAD(); fitFont(x, u, 'timeout ' + ms(c.mark), 9.6, W_ - 104); x.fillText('timeout ' + ms(c.mark), u(100), u(84)); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = codeOf(s);
    const key = JSON.stringify([o.cnt, o.res, s.id, sc, o.chart, yl]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : acc; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(137)); x.stroke();
    lbl(s.yk || 'THE MATH', L0, 10, Wd - L0 - 8);
    const ch = o.chart;
    if (ch && ch.kind === 'curve') {   // W(ρ) de 0 a 100% (eixo de W até 1.000 ms); faixas das zonas; o ponto atual
      const X0 = L0 + 34, X1 = Wd - 12, Y0 = 24, Y1 = 118, px = r => X0 + r * (X1 - X0), py = w => Y1 - Math.min(w, 1000) / 1000 * (Y1 - Y0);
      if (ch.bands) { const a = '#' + accent.getHexString(), band = (r0, r1, c_, al) => { x.globalAlpha = al; x.fillStyle = c_; x.fillRect(u(px(r0)), u(Y0), u(px(r1) - px(r0)), u(Y1 - Y0)); x.globalAlpha = 1; };
        band(0, 0.7, a, 0.12); band(0.7, 0.8, a, 0.24); band(0.8, 0.85, a, 0.4); band(0.85, 0.95, BAD(), 0.16); band(0.95, 1, BAD(), 0.32); }
      x.strokeStyle = C.line; x.lineWidth = u(0.6); x.beginPath(); x.moveTo(u(X0), u(Y0 - 4)); x.lineTo(u(X0), u(Y1)); x.lineTo(u(X1), u(Y1)); x.stroke();
      x.fillStyle = INK(); x.textAlign = 'right'; fitFont(x, u, '1,000', 8.4, 30); x.fillText('1,000', u(X0 - 3), u(Y0)); x.fillText('500', u(X0 - 3), u(py(500))); x.fillText('0', u(X0 - 3), u(Y1));
      x.textAlign = 'center'; [[0, '0'], [0.5, '50'], [0.7, '70'], [0.8, '80'], [0.9, '90%']].forEach(([r, l]) => x.fillText(l, u(Math.min(px(r), X1 - 8)), u(Y1 + 9)));
      x.textAlign = 'left'; x.strokeStyle = acc; x.lineWidth = u(1.8); x.beginPath();
      for (let r = 0; r <= 0.95 + 1e-9; r += 0.005) { const X = u(px(r)), Y = u(py(Wmm(r))); r === 0 ? x.moveTo(X, Y) : x.lineTo(X, Y); } x.stroke();
      const r = ch.r, w = Wmm(r), Xp = px(r), Yp = py(w), hot = r > 0.85 + 1e-9;
      x.fillStyle = hot ? BAD() : acc; x.beginPath(); x.arc(u(Xp), u(Yp), u(3), 0, Math.PI * 2); x.fill();
      if (w > 1000) { fitFont(x, u, '↑', 10, 10); x.fillText('↑', u(Xp - 2.5), u(Y0 - 6)); }
      const lab = ch.cost ? `+1 point: +${num(cost(r), 1)} ms` : `W = ${ms(w)} ms`, right = Xp < (X0 + X1) / 2;
      fitFont(x, u, lab, 10, 120); x.textAlign = right ? 'left' : 'right'; x.fillText(lab, u(Xp + (right ? 6 : -6)), u(Math.max(Y0 + 4, Math.min(Y1 - 8, Yp - 8)))); x.textAlign = 'left';
    } else if (ch && ch.kind === 'cv') {   // as quatro barras do W a 80%, por CV
      const vals = [0, 0.5, 1, 2], X0 = L0 + 10, Y0 = 34, Y1 = 116, bw = (Wd - X0 - 12) / 4;
      vals.forEach((cv_, i) => { const w = Wpk(0.8, cv_), h = w / 600 * (Y1 - Y0), on = cv_ === ch.cv, X = X0 + i * bw + 6, bad = w >= 500;
        x.fillStyle = on ? (bad ? BAD() : acc) : theme === 'light' ? '#d4d6d7' : '#2b2e30'; x.fillRect(u(X), u(Y1 - h), u(bw - 12), u(h));
        x.textAlign = 'center'; x.fillStyle = on ? (bad ? BAD() : acc) : INK(); fitFont(x, u, ms(w) + ' ms', 9.4, bw - 2); x.fillText(ms(w) + ' ms', u(X + (bw - 12) / 2), u(Y1 - h - 7));
        x.fillStyle = INK(); fitFont(x, u, 'CV ' + num(cv_), 8.6, bw - 2); x.fillText('CV ' + num(cv_), u(X + (bw - 12) / 2), u(Y1 + 9)); });
      x.textAlign = 'left';
    } else {
      x.fillStyle = C.inkHi; yl.slice(0, 6).forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
      lbl('RESULT', L0, 110);
      (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : acc;
        fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const RHOS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 0.99];
  const DATA = {
    fila: () => { const r = sc === 'fila' && cur().id === 'chegada' ? kval() / MU : sc === 'fila' && cur().id === 'bf' ? 0.75 : sc === 'fila' && cur().id === 'pod' ? 0.5 : -1;
      return `<table class="h3-sum"><tr><th>ρ</th><th>λ/pod</th><th>W</th><th>L</th><th>p95</th></tr>${RHOS.map(v => `<tr${Math.abs(v - r) < 1e-6 ? ' class="on"' : ''}><td>${pct(v)}</td><td>${num(v * MU)}/s</td><td>${ms(Wmm(v))} ms</td><td>${fL(v / (1 - v))}</td><td>${ms(P95(Wmm(v)))} ms</td></tr>`).join('')}</table>
      <li>P–K at 80% (S = 50 ms): CV 0 <b>150 ms</b> · 0.5 <b>175</b> · 1 <b>250</b> · 2 <b>550</b> (3.7×)</li><li>M/M/1 is pessimistic for the store: lb-loja does round robin; in module 24's k6, 30 orders/s gave an average of <b>157 ms</b> across the whole chain, below the model's ~259 ms</li><li>The HPA raises capacity (more pods) in ~<b>60 s</b>; the burst of seconds arrives before it</li>`; },
    little: () => `<li>Article: 1,500 × 0.05 = <b>75</b>; × 0.085 = <b>127.5</b> (the article writes 127; the increase is 52.5)</li><li>REST API: 500 × 0.3 = <b>150</b> = target L; at 1,000 req/s, <b>300</b>; target W = 150 ÷ 1,000 = <b>150 ms</b></li><li>Correction: with W halved, the same concurrency sustains <b>double</b> (500 → 1,000, +100%), not +50%</li>
      <table class="h3-sum"><tr><th>pagamentos</th><th>λ/pod</th><th>W</th><th>L</th></tr><tr><td>healthy point</td><td>14/s</td><td>167 ms</td><td>2.33</td></tr><tr><td>BF 2026</td><td>15/s</td><td>200 ms</td><td>3</td></tr><tr class="on"><td>target L</td><td>16/s</td><td>250 ms</td><td>4</td></tr></table>
      <li>pedidos waiting on pagamentos: 10/s × 0.2 s = <b>2</b> workers; in 2027 (20/s per pod, 150 ms) = <b>3</b></li><li>PSP pool: 30/s × 0.18 = 5.4 (critical timeout 50 ÷ 30 = 1.67 s); 200/s × 0.18 = <b>36</b>; worst case with a 1 s timeout: 200 × 1 = <b>200</b></li><li>Pool <b>50 → 150</b> (36 × 4 = 144): tolerates PSP W up to <b>0.75 s</b>; above that, the circuit breaker (module 21)</li>`,
    joelho: () => `<table class="h3-sum"><tr><th>ρ</th><th>W</th><th>+1 point</th><th>zone</th></tr>${[0.5, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99].map(v => `<tr${Math.abs(v - (kval() ?? (cur().id === 'errado' ? 0.95 : -1))) < 1e-6 ? ' class="on"' : ''}><td>${pct(v)}</td><td>${ms(Wmm(v))} ms</td><td>${num(cost(v), 1)} ms</td><td>${zone(v)}</td></tr>`).join('')}</table>
      <li>Correction: the article says that, under normal conditions, latency grows linearly; in a queue it is <b>convex from the start</b> and only looks straight up to ~50%</li><li>In M/M/1 there is no corner: the knee is <b>a choice of limit</b> on the smooth curve</li><li>Knee in other metrics: CPU, memory, connection pool, Kafka lag, concurrency (L); each resource has its own, and whatever falls first rules</li>`,
  };
  const low = l => l.length > 5 && l === l.toUpperCase() && !/[ρλ()÷=]/.test(l) ? l.toLowerCase() : l;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(low(l0))}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(low(l))}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const nx = L_()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  function knobHtml() { const k = knob(); if (!k) return '';
    return `<div class="p3-knob"><span>${k.label}</span><div class="o3-mode" role="group" aria-label="${k.label}">${k.vals.map((v, i) => `<button data-kv="${i}" aria-pressed="${i === kv}" style="flex-basis:${k.vals.length > 5 ? 22 : k.vals.length === 5 ? 17 : 22}%">${k.fmt(v)}</button>`).join('')}</div></div>`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${knobHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql" id="p3code"><b>${esc(s.yk || 'The math')}</b>${esc(codeOf(s).join('\n'))}</div>
      ${actHtml()}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now" id="p3data">${DATA[sc]()}</ul></details>`;
  }
  // o seletor mudou (clique ou passeio): atualiza só os botões, a conta e a tabela, sem refazer o painel
  function onKnob() { if (active !== 'ponto') return; const s = cur(); SP = spec();
    document.querySelectorAll('#info [data-kv]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.kv === kv)));
    const c = document.getElementById('p3code'); if (c) c.innerHTML = `<b>${esc(s.yk || 'The math')}</b>${esc(codeOf(s).join('\n'))}`;
    const d = document.getElementById('p3data'); if (d) d.innerHTML = DATA[sc]();
    readout(); }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'ponto') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? low(c[0]) + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'ponto' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; kT = 0;
    const k = knob(); kPin = false; kv = 0; if (k && kUrl != null && kUrl >= 0 && kUrl < k.vals.length) { kv = kUrl; kPin = true; } kUrl = null;
    render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-ponto3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  const setK = i => { const k = knob(); if (!k) return false; kv = Math.max(0, Math.min(k.vals.length - 1, i)); kPin = true; kT = 0; onKnob(); SFX.bit(1); return true; };
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'ponto') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const k = e.target.closest('[data-kv]'); if (k) return setK(+k.dataset.kv);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.x, Bk.y, PL - (1 - e) * (Bk.h + (nm === 'rho' ? COLH : 0) + 3)));
      const on = o.on[nm] || 0;
      if (Bk.g.visible) { if (nm === 'rack' && o.rack) drawRack(Bk, o.rack); else if (nm === 'rho' && o.gauge) drawGauge(Bk, o.gauge);
        else if (nm === 'clk' && o.clock) drawClock(Bk, o.clock); else if (o.rows[nm]) drawBlock(Bk, o.rows[nm], on); }
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, PL + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0); });
    // a coluna do medidor acompanha o valor (com um pouco de inércia)
    if (o.gauge) { const v = clamp(o.gauge.v), bad = o.gauge.zones ? o.gauge.v > 0.85 + 1e-9 : o.gauge.v > 1.0001;
      colV += (v - colV) * (1 - Math.exp(-dt / 0.3)); const h = Math.max(0.5, COLH * colV);
      col.scale.set((CW_ - 8) * TS, h * TS, (CW_ - 8) * TS); col.position.copy(W(CX + CW_ / 2, CY + CW_ / 2, B.rho.h + h / 2)); colMat.color.copy(bad ? beamBad.color : accent); }
    setLanes(o.lanes); setBeams(o.beams);
    gate.visible = o.gate; if (o.gate) gate.position.copy(W(500 - 16 - 2.5 * SP_ - 2, LY, PL + 2));
    const qb = placeBalls(o.q, dt); drawScreen(o);
    const tg = o.tags.slice(); if (o.q && o.q.tag && qb) tg.push([o.q.x0 - 16 - (qb.nv - 1) * SP_ - 10, LY, 40, o.q.tag, 'bad']);
    if (o.gate) tg.push([500 - 16 - 2.5 * SP_, LY, 70, 'L(alvo) = 4', 'acc']);
    TAGS.forEach((t, i) => { const g = tg[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }
  let colV = 0;

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    const k = knob(); if (k && !kPin && kv < k.vals.length - 1) { kT += dt; if (kT > 2.3) { kT = 0; kv++; onKnob(); } }
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
      const kk = 1 - Math.exp(-dt / 0.5), P = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, kk); camera.position.lerp(P, kk);
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
    if (e.key === '+' || e.key === '=') return setK(kv + 1);
    if (e.key === '-' || e.key === '_') return setK(kv - 1);
    if (/^[1-3]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOn.color.copy(accent); beamBad.color.set(BAD()); glassMat.color.copy(accent); markMat.color.set(pal3().line);
    laneMat.color.set(t === 'light' ? 0xc3c6c8 : 0x2b2e30); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  go(step); kUrl = null;
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); if (o.gauge) colV = clamp(o.gauge.v); }
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–3 · selector: + and − · drag to rotate' };
})() });
