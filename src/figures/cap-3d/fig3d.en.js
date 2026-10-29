// Figura 3D (iso-glow): Teorema CAP e PACELC. A loja guarda o saldo do "gato de pelúcia" (5 unidades) em 3 bancos: São Paulo, Rio e Recife.
// Três servidores em ilhas ligados por cabos (SP–Rio, Rio–Recife); a Lena fica em SP e o irmão em Recife. O saldo aparece grande no visor de cada nó.
// Escritas e réplicas viajam como luz pelos cabos; a partição corta o cabo Rio–Recife de verdade (faíscas, o cabo fica vermelho).
// Um mostrador fixo ao fundo traz modo, consistência, disponibilidade, latência da escrita, estoque real e o relógio de versão de cada nó.
// Cenários: cp, ap, ca, pacelc-el, pacelc-ec (também por ?mode=). Passos iguais em todos: início, venda, falha, 2ª venda, o que o cliente vê, volta, resumo.
// Pedidos (#101…), valores e tempos são exemplos didáticos. O tempo da animação não está em escala; os ms são os do exemplo.
FIGS3D.push({ id: 'cap', name: 'CAP', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados ──
  const SC = ['cp', 'ap', 'ca', 'pel', 'pec'];
  const SCNAME = { cp: 'CP', ap: 'AP', ca: 'CA', pel: 'PACELC · EL', pec: 'PACELC · EC' };
  const BTN = { cp: 'CP', ap: 'AP', ca: 'CA', pel: 'EL · fast', pec: 'EC · sync' };
  const URLID = { cp: 'cp', ap: 'ap', ca: 'ca', 'pacelc-el': 'pel', 'pacelc-ec': 'pec', pel: 'pel', pec: 'pec' };
  // aulas do módulo (src/content/cap-acid-base/): combinações CP/AP/CA na 5, PACELC na 7
  const AULA = { cp: 'aula-5-combinacoes-do-cap', ap: 'aula-5-combinacoes-do-cap', ca: 'aula-5-combinacoes-do-cap', pel: 'aula-7-teorema-pacelc', pec: 'aula-7-teorema-pacelc' };
  const IDS = ['start', 'sale', 'cut', 'sale2', 'client', 'heal', 'sum'];
  const NAMES = ['SÃO PAULO', 'RIO', 'RECIFE'], SHORT = ['SP', 'RJ', 'REC'];
  const PART = m => m === 'cp' || m === 'ap' || m === 'ca';

  let sc = 'cp', rec = 'lww', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const p = new URLSearchParams(location.search); const m = URLID[p.get('mode')]; if (m) { sc = m; var fromUrl = true; } if (p.get('rec') === 'merge') { rec = 'merge'; var recUrl = true; } } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cap3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }
  if (!recUrl) { try { if (localStorage.getItem('sdlabs-cap3d-rec') === 'merge') rec = 'merge'; } catch (e) {} }
  const N = () => IDS.length, cur = () => IDS[step];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const ev = (t, a, b) => clamp((t - a) / (b - a));
  const STATIC = 99;
  // duração de cada passo (s); em CA os passos 4 a 6 mostram as duas escolhas, uma depois da outra
  const CAP_P = { sale2: 5.4, client: 4.4, heal: 7.0 };
  const DUR = () => { const id = cur(), m = sc;
    if (m === 'ca' && CAP_P[id]) return 2 * CAP_P[id];
    if (PART(m)) return { start: 3.2, sale: 4.2, cut: 3.6, sale2: 4.8, client: 3.0, heal: m === 'cp' ? 7.0 : 6.8, sum: 1.5 }[id];
    const el = m === 'pel';
    return { start: 3.2, sale: el ? 5.2 : 7.0, cut: el ? 4.2 : 3.2, sale2: el ? 3.2 : 2.5, client: 3.0, heal: el ? 9.5 : 12.6, sum: 1.5 }[id]; };

  // ── geometria (unidades da placa 640 × 300) ──
  plateWith(g0, 640, 300, [[18, 18], [622, 18], [18, 282], [622, 282]]);
  const mkGroup = id => { const g = new THREE.Group(); g.userData.go = id; g0.add(g); return g; };
  const NX = [24, 254, 484], NW = 132, NY = 94, ND = 100, NH = 46, NT = 7 + NH, CY = 144, CZ = 10;
  const CCX = [NX[0] + NW / 2, NX[2] + NW / 2], CLY = 232;
  const CUTL = 418, CUTR = 452;
  NX.forEach(x => inset(x - 4, NY - 4, 7, NW + 8, ND + 8, 5, g0));
  [0, 1].forEach(k => inset(NX[k] + NW + 4, CY - 6, 7, NX[k + 1] - NX[k] - NW - 8, 12, 3, g0));

  const ledOk = new THREE.Color(0x34d27b), ledBad = new THREE.Color(0xff4d3d), ledAmb = new THREE.Color(0xffb02e);
  const NODE = [];
  for (let i = 0; i < 3; i++) {
    const g = mkGroup('n' + i), x0 = NX[i];
    const mat = bodyMat.clone();
    rbox(x0, NY, 7, NW, ND, NH, 6, mat, g);
    const top = faceCanvas('top', x0 + 3, NY + 3, NT, NW - 6, ND - 6, 8, g);
    const fr = faceCanvas('front', x0 + 2, NY + ND, NT - 2, NW - 4, 22, 10, g);
    const led = new THREE.MeshBasicMaterial({ color: 0x34d27b, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -12 });
    dotFront(x0 + NW - 10, NY + ND, 12, 2.6, g, led);
    const glow = glowPoints([W(x0 + NW - 10, NY + ND + 0.5, 12)], 0.22); g.add(glow);
    NODE.push({ g, mat, top, fr, led, glow });
  }
  const CLI = [];
  for (let k = 0; k < 2; k++) {
    const g = mkGroup('c' + k), x0 = CCX[k] - 42;
    rbox(x0, CLY, 7, 84, 42, 28, 5, bodyMat, g);
    const top = faceCanvas('top', x0 + 3, CLY + 3, 35, 78, 36, 8, g);
    const fr = faceCanvas('front', x0 + 2, CLY + 42, 33, 80, 18, 10, g);
    CLI.push({ g, top, fr });
  }
  // mostrador ao fundo (sempre visível)
  const stG = mkGroup('stat');
  rbox(24, 22, 7, 360, 12, 112, 5, bodyMat, stG);
  const stScr = faceCanvas('front', 30, 34, 115, 348, 100, 5, stG);
  hazeAndShadow(g0, 320, 150, 7.8, 4.2);
  creases(first);

  // cabos e pontos de luz
  const pathTo = pts => ({ pts, cum: cumLen(pts) });
  const PATH = {
    P01: pathTo([[NX[0] + NW, CY, CZ], [NX[1], CY, CZ]]),
    P12: pathTo([[NX[1] + NW, CY, CZ], [NX[2], CY, CZ]]),
    HR: pathTo([[NX[2], CY, CZ], [CUTR, CY, CZ]]),
    L: pathTo([[CCX[0], CLY, CZ], [CCX[0], NY + ND + 2, CZ]]),
    B: pathTo([[CCX[1], CLY, CZ], [CCX[1], NY + ND + 2, CZ]]),
  };
  const badMat = accentLineMat.clone(); badMat.color.set(0xff4d3d);
  const ambMat = accentLineMat.clone(); ambMat.color.set(0xffb02e);
  const CAB = [PATH.P01.pts, PATH.P12.pts].map(pts => ({ dim: polyLine(pts, majorMat, g0), lit: polyLine(pts, accentLineMat, g0), slow: polyLine(pts, ambMat, g0) }));
  CAB.forEach(c => { c.lit.visible = false; c.slow.visible = false; });
  const HL = polyLine([[NX[1] + NW, CY, CZ], [CUTL, CY, CZ]], badMat, g0), HRL = polyLine([[CUTR, CY, CZ], [NX[2], CY, CZ]], badMat, g0);
  HL.visible = HRL.visible = false;
  const SPK = [CUTL, CUTR].map(x => { const gp = glowPoints([W(x, CY, CZ + 3)], 0.3); g0.add(gp); gp.material.uniforms.intensity.value = 0; return gp; });
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.28); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = [0, 1, 2, 3, 4, 5, 6, 7].map(() => mkDot(12));
  function place(d, p, k) { d.g.visible = true; d.g.position.copy(W(...p)); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); }

  // ── rótulos que olham para a câmera ──
  const tags = [];
  function tag(h = 13) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false });
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `600 ${fs}px ${MONO3}`, f2 = `${fs * 0.8}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.8 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; mat.map = tex; mat.needsUpdate = true; }
      const light = theme === 'light', accT = light ? C.hi : A_, warnC = light ? '#8a5a00' : '#ffb02e';
      const col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : t.tone === 'bad' ? '#ff5a4a' : t.tone === 'warn' ? warnC : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = light ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? '#ff5a4a' : t.tone === 'warn' ? '#ffb02e' : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' || t.tone === 'warn' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tM = tag(12), tC = tag(12);

  // ── o estado do que se vê (função pura de modo, passo e tempo) ──
  const mk = () => ({ v: [5, 5, 5], ord: [[], [], []], lost: [[], [], []], ck: ['v1', 'v1', 'v1'], serve: [1, 1, 1], nst: ['ok', 'ok', 'ok'], flash: [null, null, null],
    cab: ['ok', 'ok'], beads: [], L: null, B: null, tm: null, tc: null, acked: 0, lat: '—', avail: ['—', 'dim'], cons: null, spark: 0, sparkCol: 'r', mode: '' });
  const bead = (s, key, f, rev = false) => { if (f > 0 && f < 1) s.beads.push([key, f, rev]); };
  const setN = (s, i, v, o, ck) => { s.v[i] = v; s.ord[i] = o.slice(); s.ck[i] = ck; };
  const eqServing = s => { const k = i => s.v[i] + '|' + s.ord[i].join(); const a = [0, 1, 2].filter(i => s.serve[i]); return a.every(i => k(i) === k(a[0])); };
  const norm = s => { [0, 1, 2].forEach(i => setN(s, i, 4, [101], 'v2')); s.acked = 1; s.lat = '12 ms'; s.avail = ['yes', 'ok']; };

  function capS(m, id, tt, isCA) {
    const s = mk(); s.mode = m; const cp = m === 'cp';
    if (id === 'start') return s;
    if (id === 'sale') {
      if (tt >= 0.6) setN(s, 0, 4, [101], 'v2'); if (tt >= 1.8) setN(s, 1, 4, [101], 'v2'); if (tt >= 3.0) setN(s, 2, 4, [101], 'v2');
      bead(s, 'L', ev(tt, 0, 0.6)); bead(s, 'P01', ev(tt, 0.6, 1.8)); bead(s, 'P12', ev(tt, 1.8, 3.0)); bead(s, 'L', ev(tt, 1.8, 2.4), true);
      s.L = tt <= 0 ? null : tt < 1.8 ? ['buying…', 'dim'] : ['OK · 4 left\n#101 · 12 ms', 'acc'];
      if (tt >= 1.8) { s.lat = '12 ms'; s.avail = ['yes', 'ok']; s.acked = 1; }
      if (!eqServing(s)) s.cons = ['converging', 'warn'];
      return s;
    }
    if (id === 'cut') {
      norm(s); s.L = ['OK · 4 left\n#101', 'acc'];
      if (tt < 0.8) bead(s, 'P12', tt / 0.8);
      else { s.cab[1] = 'cut'; s.spark = tt < 2.4 ? 1 : 0.4; s.tc = ['✕ partition\nRio ⇄ Recife out of contact', 'bad'];
        if (tt >= 1.0) s.nst[2] = 'ilha';
        if (isCA && tt >= 1.8) s.tm = ['CA ended here\nthe network failed: now what?', 'bad']; }
      return s;
    }
    if (id === 'sale2' || id === 'client') {
      norm(s); s.cab[1] = 'cut'; s.spark = 0.4; s.nst[2] = 'ilha'; s.L = ['OK · 4 left\n#101', 'acc'];
      bead(s, 'L', ev(tt, 0, 0.6)); bead(s, 'B', ev(tt, 0, 0.6));
      if (cp) {
        if (tt >= 0.6) setN(s, 0, 3, [101, 102], 'v3'); if (tt >= 1.8) setN(s, 1, 3, [101, 102], 'v3');
        bead(s, 'P01', ev(tt, 0.6, 1.8));
        bead(s, 'HR', tt < 1.5 ? ev(tt, 0.6, 1.5) : 1 - ev(tt, 1.5, 2.1));
        if (tt >= 1.5) { s.serve[2] = 0; s.nst[2] = 'recusa'; }
        s.L = tt < 0.6 ? ['buying…', 'dim'] : tt < 1.8 ? ['buying…', 'dim'] : ['OK · 3 left\n#102 · 12 ms', 'acc'];
        bead(s, 'L', ev(tt, 1.8, 2.4), true);
        s.B = tt < 0.6 ? ['buying…', 'dim'] : tt < 3.6 ? [`waiting for Rio…\n${Math.floor(tt - 0.6)} s of 3 s`, 'dim'] : ['ERROR 503\nno quorum · 3 s', 'bad'];
        if (tt >= 1.8) s.acked = 2;
        s.avail = tt < 3.6 ? ['—', 'dim'] : ['ERROR at REC', 'bad'];
        s.lat = tt >= 1.8 ? '12 ms (REC: 3 s, error)' : '…'; if (tt < 3.6) s.lat = tt >= 1.8 ? '12 ms (REC: waiting)' : '…';
        if (tt >= 1.5) s.tc = ['✕ no quorum in Recife\n1 of 3 nodes', 'bad'];
        if (id === 'client') s.tm = ['CP: Recife refuses\ndata never diverges', 'acc'];
      } else {
        if (tt >= 0.6) { setN(s, 0, 3, [101, 102], 'v3a'); setN(s, 2, 3, [101, 103], 'v3b'); } if (tt >= 1.8) setN(s, 1, 3, [101, 102], 'v3a');
        bead(s, 'P01', ev(tt, 0.6, 1.8)); bead(s, 'HR', ev(tt, 0.6, 1.5));
        s.L = tt < 1.0 ? ['buying…', 'dim'] : ['OK · 3 left\n#102 · 4 ms', 'acc'];
        s.B = tt < 1.0 ? ['buying…', 'dim'] : ['OK · 3 left\n#103 · 4 ms', 'acc'];
        bead(s, 'L', ev(tt, 0.6, 1.0), true); bead(s, 'B', ev(tt, 0.6, 1.0), true);
        if (tt >= 1.0) { s.acked = 3; s.avail = ['yes', 'ok']; s.lat = '4 ms'; } else { s.lat = '…'; }
        if (tt >= 1.5) s.tc = ['✕ Recife’s replica\ncannot get through: queued', 'bad'];
        if (tt >= 1.8) s.cons = ['NO', 'bad'];
        if (id === 'client') s.tm = ['AP: both sides serve\nreal 2 · nodes say 3', 'bad'];
      }
      if (!s.cons) s.cons = eqServing(s) ? ['yes', 'ok'] : ['converging', 'warn'];
      return s;
    }
    if (id === 'heal' || id === 'sum') {
      const s2 = capS(m, 'sale2', STATIC, isCA); s2.beads = []; s2.tm = null; s2.tc = null; s2.cons = null; s2.spark = 0;
      const s = s2, T = id === 'sum' ? STATIC : tt;
      s.cab[1] = T < 0.8 ? 'cut' : 'ok'; if (T < 0.8) { s.spark = 0.4; s.nst[2] = s.serve[2] ? 'ilha' : 'recusa'; } else { s.spark = T < 1.6 ? 1 : 0; s.sparkCol = 'g'; s.nst[2] = 'ok'; }
      if (cp) {
        bead(s, 'P12', ev(T, 1.2, 2.4));
        if (T >= 2.4) { setN(s, 2, 3, [101, 102], 'v3'); s.serve[2] = 1; }
        if (T >= 2.4 && T < 3.0) s.tc = ['Recife recovered\n#102 arrived', 'acc'];
        s.B = T < 3.0 ? ['ERROR 503\nno quorum · 3 s', 'bad'] : T < 3.6 ? ['retrying…', 'dim'] : T < 4.8 ? ['writing…', 'dim'] : ['OK · 2 left\n#103 · 14 ms', 'acc'];
        bead(s, 'B', ev(T, 3.0, 3.6)); bead(s, 'B', ev(T, 4.8, 5.4), true);
        if (T >= 3.6) setN(s, 2, 2, [101, 102, 103], 'v4'); bead(s, 'P12', ev(T, 3.6, 4.8), true);
        if (T >= 4.8) { setN(s, 1, 2, [101, 102, 103], 'v4'); s.acked = 3; s.lat = '14 ms'; s.avail = ['yes', 'ok']; } else s.avail = ['ERROR at REC', 'bad'];
        bead(s, 'P01', ev(T, 4.8, 6.0), true); if (T >= 6.0) setN(s, 0, 2, [101, 102, 103], 'v4');
        if (T >= 6.0) s.tm = ['all equal again\n5 − 3 orders = 2', 'acc'];
      } else if (rec === 'lww') {
        if (T < 4.4) s.cons = ['NO', 'bad'];
        bead(s, 'P12', ev(T, 1.2, 2.4)); bead(s, 'P12', ev(T, 1.2, 2.4), true);
        if (T >= 2.4 && T < 3.2) { s.flash[1] = s.flash[2] = 'conflict'; s.tc = ['conflict!\n#102 and #103 want\nthe same unit', 'bad']; s.cons = ['NO', 'bad']; }
        bead(s, 'P12', ev(T, 3.2, 4.4), true); bead(s, 'P01', ev(T, 4.4, 5.6), true);
        if (T >= 4.4) { setN(s, 1, 3, [101, 103], 'v4'); s.lost[1] = [102]; setN(s, 2, 3, [101, 103], 'v4'); }
        if (T >= 5.6) { setN(s, 0, 3, [101, 103], 'v4'); s.lost[0] = [102]; s.tc = ['#102 lost\nthe client already got OK', 'bad']; s.tm = ['LWW: the newest write won\nnodes say 3, real is 2', 'bad']; }
        if (T >= 4.4) s.cons = T >= 5.6 ? ['yes · lost #102', 'warn'] : ['converging', 'warn'];
      } else {
        if (T < 4.4) s.cons = ['NO', 'bad'];
        bead(s, 'P12', ev(T, 1.2, 2.4)); bead(s, 'P12', ev(T, 1.2, 2.4), true);
        if (T >= 2.4 && T < 3.2) { s.flash[1] = s.flash[2] = 'conflict'; s.tc = ['conflict!\n#102 and #103 want\nthe same unit', 'bad']; s.cons = ['NO', 'bad']; }
        bead(s, 'P12', ev(T, 3.2, 4.4)); bead(s, 'P12', ev(T, 3.2, 4.4), true); bead(s, 'P01', ev(T, 4.4, 5.6), true);
        if (T >= 4.4) { setN(s, 1, 2, [101, 102, 103], 'v4'); setN(s, 2, 2, [101, 102, 103], 'v4'); s.cons = ['converging', 'warn']; }
        if (T >= 5.6) { setN(s, 0, 2, [101, 102, 103], 'v4'); s.tc = ['merge: unites the orders\n5 − 3 = 2 · nothing lost', 'acc']; s.tm = ['MERGE: needs a rule\nwritten by you', 'acc']; }
      }
      if (!s.cons) s.cons = eqServing(s) ? ['yes', 'ok'] : ['converging', 'warn'];
      return s;
    }
  }

  function plcS(m, id, tt) {
    const s = mk(); s.mode = m; const el = m === 'pel', slow = id === 'heal';
    const D = el ? (slow ? 4.0 : 2.0) : (slow ? 2.4 : 1.2), tRio = 0.6 + D, tRec = 0.6 + 2 * D;
    const tR = el ? 1.2 : 0.6 + 4 * D + 0.6, fin = el ? 5 : slow ? 300 : 80;
    const OFFR = el ? 1.3 : 6.0, OFFC = el ? 2.2 : 6.5;
    const ttw = id === 'start' ? 0 : id === 'sale' || id === 'heal' ? tt : id === 'cut' ? tt + OFFR : id === 'sale2' ? tt + OFFC : STATIC;
    if (slow) s.cab = ['slow', 'slow'];
    const x = ttw;
    if (x >= 0.6) setN(s, 0, 4, [101], 'v2'); if (x >= tRio) setN(s, 1, 4, [101], 'v2'); if (x >= tRec) setN(s, 2, 4, [101], 'v2');
    if (id !== 'start') {
      bead(s, 'L', ev(x, 0, 0.6));
      if (el) { bead(s, 'P01', ev(x, 0.6, tRio)); bead(s, 'P12', ev(x, tRio, tRec)); bead(s, 'L', ev(x, 0.6, 1.2), true); }
      else { bead(s, 'P01', ev(x, 0.6, 0.6 + D)); bead(s, 'P12', ev(x, 0.6 + D, 0.6 + 2 * D)); bead(s, 'P12', ev(x, 0.6 + 2 * D, 0.6 + 3 * D), true); bead(s, 'P01', ev(x, 0.6 + 3 * D, 0.6 + 4 * D), true); bead(s, 'L', ev(x, 0.6 + 4 * D, tR), true); }
      const ms = Math.round(fin * clamp((x - (el ? 0 : 0.6)) / (tR - (el ? 0 : 0.6))));
      s.L = x <= 0 ? null : x < tR ? [el ? `writing…\n${ms} ms` : `waiting for replicas\n${ms} ms`, 'dim'] : [`OK · 4 left\n#101 · ${fin} ms`, 'acc'];
      if (x >= tR) { s.lat = fin + ' ms'; s.avail = ['yes', 'ok']; s.acked = 1; } else s.lat = '…';
    }
    if (x >= tR && !el) s.avail = ['yes', 'ok'];
    const stale = ttw2 => el && ttw2 < tRec;
    if (id === 'cut') {
      const lr = tt, vr = (0.8 + OFFR) >= tRec ? 4 : 5;
      bead(s, 'B', ev(lr, 0.2, 0.8)); bead(s, 'B', ev(lr, 0.8, 1.4), true);
      s.B = lr < 0.2 ? null : lr < 1.4 ? ['reading…', 'dim'] : vr === 5 ? ['read 5\nSTALE READ', 'bad'] : ['read 4\ncurrent copy', 'acc'];
    }
    if (id === 'sale2') s.tm = el ? (x < tRec ? ['replica still on its way\ncopies differ', 'warn'] : ['copies equal\neventual consistency', 'acc']) : ['nothing to wait for\nall were already 4 on reply', 'acc'];
    if (id === 'client' || id === 'sum') {
      s.B = el ? ['reads 5\nstale for ~80 ms', 'bad'] : ['reads 4\nalways current', 'acc'];
      s.tm = el ? ['EL: fast, but may read stale', 'warn'] : ['EC: slow, but always current', 'acc'];
    }
    if (id === 'heal') s.tm = ['slow network\n~300 ms between cities', 'warn'];
    if (id === 'cut' && s.v[1] === 4 && s.v[2] === 5) s.tc = null;
    s.cons = eqServing(s) ? ['yes', 'ok'] : x < 0.6 ? ['yes', 'ok'] : ['converging', 'warn'];
    if (el && !eqServing(s)) s.cons = ['not yet', 'warn'];
    s.stale = stale(ttw) && s.v[2] === 5 && s.v[0] === 4;
    return s;
  }

  function S() {
    const id = cur(); let m = sc, tt = lt, isCA = false;
    if (m === 'ca') {
      isCA = true;
      if (CAP_P[id]) { const P = CAP_P[id], ph = lt % (2 * P); m = ph < P ? 'cp' : 'ap'; tt = id === 'client' ? STATIC : ph % P; }
      else m = id === 'sum' ? 'cp' : 'cp';
      const s = capS(m, id, id === 'client' ? STATIC : id === 'sum' ? STATIC : tt, true);
      s.isCA = true; s.choice = CAP_P[id] ? m : null; return s;
    }
    if (PART(m)) return capS(m, id, id === 'client' ? STATIC : id === 'sum' ? STATIC : tt, false);
    return plcS(m, id, tt);
  }

  // ── desenhos nas telas ──
  const keys = new Map();
  const bgFill = (x, cv, col) => { x.fillStyle = col || (theme === 'light' ? '#f6f6f5' : '#141516'); x.fillRect(0, 0, cv.c.width, cv.c.height); };
  const toneHex = (tone, light) => tone === 'bad' ? '#ff5a4a' : tone === 'warn' ? (light ? '#8a5a00' : '#ffb02e') : tone === 'ok' ? (light ? '#1a7f46' : '#34d27b') : null;
  function drawNodeTop(i, s) {
    const ords = s.ord[i].map(o => '#' + o).join(' '), lost = s.lost[i].map(o => '#' + o).join(' ');
    const key = ['nt', i, s.v[i], s.ck[i], ords, lost, s.serve[i], s.nst[i], s.flash[i], theme, accent.getHex()].join('|');
    if (keys.get('nt' + i) === key) return; keys.set('nt' + i, key);
    const cv = NODE[i].top, { x, P } = cv, C = pal3(), u = v => v * P, light = theme === 'light', acc = light ? C.hi : '#' + accent.getHexString();
    bgFill(x, cv, C.recess); x.textBaseline = 'middle';
    const st = s.nst[i], stCol = st === 'ok' ? toneHex('ok', light) : st === 'ilha' ? toneHex('warn', light) : toneHex('bad', light);
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(11)}px ${MONO3}`; x.fillText(NAMES[i], u(5), u(10));
    x.textAlign = 'right'; x.fillStyle = stCol; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(st === 'ok' ? 'ok' : st === 'ilha' ? 'ISLAND' : st === 'recusa' ? 'REFUSES' : st.toUpperCase(), u(121), u(10.5));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(5), u(18)); x.lineTo(u(121), u(18)); x.stroke();
    x.textAlign = 'center'; x.fillStyle = s.serve[i] ? acc : C.ink; x.font = `600 ${u(46)}px ${MONO3}`; x.fillText(String(s.v[i]), u(63), u(43));
    if (!s.serve[i]) { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('refuses reads and writes', u(63), u(66)); }
    x.textAlign = 'left'; x.font = `600 ${u(9)}px ${MONO3}`; let px = 5; x.fillStyle = C.ink; x.fillText('orders', u(px), u(75)); px += 38;
    const seg = [...s.ord[i].map(o => ['#' + o, false]), ...s.lost[i].map(o => ['#' + o, true])];
    seg.forEach(([t, bad]) => { const w = x.measureText(t).width / P; x.fillStyle = bad ? '#ff5a4a' : C.inkHi; x.fillText(t, u(px), u(75)); if (bad) { x.strokeStyle = '#ff5a4a'; x.lineWidth = u(0.9); x.beginPath(); x.moveTo(u(px), u(75)); x.lineTo(u(px + w), u(75)); x.stroke(); } px += w + 5; });
    x.fillStyle = C.ink; x.font = `${u(9)}px ${MONO3}`; x.fillText('clock', u(5), u(87)); x.fillStyle = acc; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText(s.ck[i], u(44), u(87));
    if (s.flash[i] === 'conflict') { x.strokeStyle = '#ff5a4a'; x.lineWidth = u(2); x.strokeRect(u(1), u(1), cv.c.width / P - 2, cv.c.height / P - 2); }
    else if (st !== 'ok') { x.strokeStyle = stCol; x.lineWidth = u(0.9); x.strokeRect(u(0.6), u(0.6), cv.c.width / P - 1.2, cv.c.height / P - 1.2); }
    cv.tex.needsUpdate = true;
  }
  function drawNodeFront(i, s) {
    const key = 'nf' + i + s.ck[i] + theme; if (keys.get('nf' + i) === key) return; keys.set('nf' + i, key);
    const cv = NODE[i].fr, { x, P } = cv, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('DB · ' + SHORT[i], u(4), u(8));
    x.fillStyle = C.ink; x.font = `${u(6.6)}px ${MONO3}`; x.fillText('gato_pelucia · stock', u(4), u(17));
    cv.tex.needsUpdate = true;
  }
  const CNAME = [['LENA', 'São Paulo'], ['BROTHER', 'Recife']];
  function drawClient(k, o) {
    const key = ['cl', k, o ? o.join('|') : '', theme, accent.getHex()].join('|'); if (keys.get('cl' + k) === key) return; keys.set('cl' + k, key);
    const cv = CLI[k].top, { x, P } = cv, C = pal3(), light = theme === 'light', acc = light ? C.hi : '#' + accent.getHexString(), u = v => v * P, Wd = cv.c.width / P;
    const tone = o ? o[1] : 'dim', col = tone === 'bad' ? '#ff5a4a' : tone === 'acc' ? acc : C.ink;
    bgFill(x, cv, tone === 'bad' ? (light ? '#f1d9d6' : '#2a1514') : tone === 'acc' ? (light ? '#f6ece2' : '#22170f') : C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    const fit = (t, size, w8) => { x.font = `${w8} ${u(size)}px ${MONO3}`; const w = x.measureText(t).width / P; if (w > Wd - 6) x.font = `${w8} ${u(size * (Wd - 6) / w)}px ${MONO3}`; };
    x.fillStyle = C.ink; fit(CNAME[k][0] + ' · ' + CNAME[k][1], 7, '600'); x.fillText(CNAME[k][0] + ' · ' + CNAME[k][1], cv.c.width / 2, u(6));
    const lines = o ? o[0].split('\n') : ['no order', 'phone ready'];
    x.fillStyle = tone === 'dim' ? C.inkHi : col; fit(lines[0], 11, '600'); x.fillText(lines[0], cv.c.width / 2, u(18));
    x.fillStyle = tone === 'dim' ? C.ink : col; fit(lines[1] || '', 8, '400'); x.fillText(lines[1] || '', cv.c.width / 2, u(29.5));
    if (tone !== 'dim') { x.strokeStyle = col; x.lineWidth = u(1.1); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2)); }
    cv.tex.needsUpdate = true;
    const fv = CLI[k].fr, key2 = 'clf' + theme; if (fv.done !== key2) { fv.done = key2; bgFill(fv.x, fv); fv.x.textBaseline = 'middle'; fv.x.textAlign = 'center'; fv.x.fillStyle = C.ink; fv.x.font = `${fv.P * 7.5}px ${MONO3}`; fv.x.fillText('phone · purchase', fv.c.width / 2, fv.P * 9); fv.tex.needsUpdate = true; }
  }
  function drawStat(s) {
    const m = sc, modeName = s.isCA ? (s.choice ? 'CA → ' + SCNAME[s.choice] : IDS[step] === 'start' || IDS[step] === 'sale' ? 'CA' : 'CA ✕') : SCNAME[m];
    const net = s.cab.includes('cut') ? ['PARTITION', 'bad'] : s.cab.includes('slow') ? ['SLOW NETWORK', 'warn'] : ['network ok', 'ok'];
    const real = 5 - s.acked, vs = s.v.filter((_, i) => s.serve[i]);
    const mism = s.acked > 0 && vs.some(v => v !== real) && s.cons && s.cons[0] !== 'converging' && s.cons[0] !== 'not yet';
    const key = ['ss', modeName, net[0], s.cons && s.cons.join(), s.avail.join(), s.lat, s.ck.join(), s.v.join(), s.acked, s.serve.join(), theme, accent.getHex()].join('|'); if (keys.get('stat') === key) return; keys.set('stat', key);
    const { x, P } = stScr, C = pal3(), u = v => v * P, light = theme === 'light', acc = light ? C.hi : '#' + accent.getHexString();
    bgFill(x, stScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(modeName, u(5), u(10));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText('plush cat · 3 copies of the stock', u(5), u(21));
    x.textAlign = 'right'; x.fillStyle = toneHex(net[1], light); x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText(net[0], u(343), u(11));
    const cons = s.cons || ['yes', 'ok'], cells = [['consistency (copies equal?)', cons[0], cons[1]], ['availability (did it answer?)', s.avail[0], s.avail[1]],
      ['write latency', s.lat, 'hi'], ['real stock × nodes', `real ${real} · nodes ${s.v.map((v, i) => s.serve[i] ? v : '–').join('/')}`, mism ? 'bad' : 'hi']];
    cells.forEach(([a, b, tone], k) => { const cx = 5 + (k % 2) * 173, cy = 28 + Math.floor(k / 2) * 23;
      x.beginPath(); x.roundRect(u(cx), u(cy), u(168), u(20), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.fillText(a, u(cx + 4), u(cy + 6));
      x.fillStyle = toneHex(tone, light) || C.inkHi; x.font = `600 ${u(b.length > 22 ? 7.8 : 9.5)}px ${MONO3}`; x.fillText(b, u(cx + 4), u(cy + 14.5)); });
    x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.textAlign = 'left'; x.fillText('version clock of each node', u(5), u(79));
    [0, 1, 2].forEach(i => { const cx = 5 + i * 115.5; x.beginPath(); x.roundRect(u(cx), u(83), u(110), u(14), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(7)}px ${MONO3}`; x.fillText(SHORT[i], u(cx + 4), u(90)); x.fillStyle = acc; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(s.ck[i], u(cx + 22), u(90)); });
    stScr.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const pick = o => { const v = o[sc] ?? o.all; return typeof v === 'function' ? v() : v; };
  const RECN = () => rec === 'merge';
  const STEPS = {
    start: { title: { all: 'Three copies of the stock in three cities' },
      story: { all: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife. Each has its own copy of the number and a version clock (v1). Lena is in São Paulo and her brother is in Recife.',
        cp: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife, each with its own version clock (v1). Lena is in SP and her brother is in Recife. Today the system is CP: if the network fails, it prefers to refuse rather than lie.',
        ap: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife, each with its own version clock (v1). Lena is in SP and her brother is in Recife. Today the system is AP: if the network fails, it prefers to answer, even at the risk of diverging.',
        ca: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife. Lena is in SP and her brother is in Recife. Today the question is: can we have consistency and availability without worrying about the network?',
        pel: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife. The network is fine, no partition. Today replication is asynchronous (EL): the node answers right away and tells the others later.',
        pec: 'The shop keeps the plush cat’s stock, 5 units, in three databases: São Paulo, Rio and Recife. The network is fine, no partition. Today replication is synchronous (EC): the node only answers after the others confirm.' },
      look: { all: 'Three islands with the stock in big digits on the display, linked by cables. The panel at the back sums up mode, consistency, availability and latency.' },
      key: { all: 'Replicating means keeping the same data on several nodes. The price is keeping the copies equal.', cp: 'CAP: consistency, availability and partition tolerance. With the network failing, you can only guarantee two.', ap: 'CAP: consistency, availability and partition tolerance. With the network failing, you can only guarantee two.', ca: 'CAP: consistency, availability and partition tolerance. With the network failing, you can only guarantee two.' } },
    sale: { title: { all: 'A normal sale, with a healthy network', pel: 'Lena buys: reply in 5 ms', pec: 'Lena buys: reply in 80 ms' },
      story: { all: 'A customer buys the first cat (order #101). The request enters São Paulo, which writes 4 and tells Rio, and Rio tells Recife. Within a few milliseconds all three show 4 and the clock goes up to v2. With no failure at all, everything is easy.',
        pel: 'Lena buys a cat (order #101). São Paulo writes 4 and answers at once: 5 ms. The news only follows along the cables afterwards, with nobody waiting. Rio gets it first; Recife, last.',
        pec: 'Lena buys a cat (order #101). São Paulo writes 4, but only answers after Rio and Recife confirm. The reply arrives in 80 ms, and by then all three already have 4.' },
      look: { all: 'The light leaves the phone, enters SP and follows the cables. The displays swap 5 for 4 as the news arrives.',
        pel: 'The reply gets back to the phone before the replica’s light reaches Recife.', pec: 'The phone waits while the light goes back and forth through the three nodes.' },
      key: { all: 'Replicating means sending each write to the other nodes so the copies stay equal.', pel: 'Asynchronous: answers fast, the copies sort themselves out later.', pec: 'Synchronous: answers only when everyone confirms, which makes it slower.' } },
    cut: { title: { all: 'The cable between Rio and Recife goes down', pel: 'The brother checks the stock right after', pec: 'The brother checks the stock right after' },
      story: { all: 'Some time passes and a digger cuts the cable between Rio and Recife: a network partition. São Paulo and Rio can still talk; Recife is on its own. No node went down, they just cannot talk anymore.',
        ca: 'Up to here it looked perfect: consistent and available, because the network never failed. But cables get cut, switches burn out and cloud regions lose contact. The cable between Rio and Recife goes down: a partition. No node crashed, but Recife is on its own.',
        pel: 'A moment after order #101, Lena’s brother opens the shop in Recife and checks the stock. That node has not received the replica yet: it shows 5, while São Paulo is already at 4. It is a stale read.',
        pec: 'A moment after order #101, Lena’s brother opens the shop in Recife and checks the stock. Recife confirmed the replica before Lena got her reply, so it shows 4, the current value. No stale read.' },
      look: { all: 'The cable goes dark, throws red sparks and Recife is cut off: its label turns ISLAND.', pel: 'The replica’s light is still on its way to Recife. Its display stays at 5, and the brother’s phone reads 5.', pec: 'All three displays already show 4, and the brother’s phone reads 4.' },
      key: { all: 'Partition: the nodes are alive, but cannot talk to each other.', ca: 'In a distributed system the partition is not optional: it happens.', pel: 'Stale read: reading a copy that has not received the write yet.', pec: 'Synchronous replication: no read sees the old value.' } },
    sale2: { title: { all: 'Two purchases at the same time, with Recife isolated', ca: 'Under a partition, you are forced to choose', pel: 'When the copies become equal', pec: 'When the copies become equal' },
      story: { cp: 'Under a partition, Lena (SP) and her brother (Recife) buy at the same time. SP writes 3 and Rio confirms: that is 2 of 3 nodes, there is a quorum and the purchase goes through (#102). Recife cannot reach anyone, has no quorum and waits until the timeout: it refuses the purchase.',
        ap: 'Under a partition, Lena (SP) and her brother (Recife) buy at the same time. SP writes 3 (#102) and Rio confirms. Recife also writes 3 (#103), without talking to anyone. Both sides accept and answer fast, but neither knows about the other’s sale.',
        ca: 'Lena and her brother buy at the same time and the network is still cut. The system has to decide. Choice A is to refuse the write on the side without a quorum (it becomes CP). Choice B is to accept on both sides (it becomes AP). There is no option C: “accept and stay equal”.',
        pel: 'The replica of order #101 keeps travelling: it reaches Rio and, later, Recife. Only then do all three show 4. The window in which the copies differ lasts about 80 ms on a good network. This is eventual consistency: in the end everyone agrees, but not at the same time.',
        pec: 'Here there was no window: when Lena got the reply, all three copies were already 4. The price was waiting. Synchrony never lets the copies differ, but each write is only as fast as the slowest node.' },
      look: { cp: 'Recife sends light to the cut cable, it comes back, and the brother’s phone waits until the error shows up.', ap: 'Both phones get OK one after the other. SP/Rio and Recife show 3, but with different orders.',
        ca: 'The scene alternates between choice A (CP) and choice B (AP). Watch the brother’s phone.', pel: 'Rio’s display turns 4 and then Recife’s. Consistency goes from “not yet” to “yes”.', pec: 'Almost nothing changes in the scene: the work was done before the reply.' },
      key: { cp: 'CP: no quorum, refuse. Prefers an error to a lie.', ap: 'AP: accepts on both sides and promises to sort it out later.', ca: 'Under a partition, you either refuse (CP) or accept and diverge (AP).', pel: 'Eventual consistency: with no new writes, all copies end up equal.', pec: 'Synchronous: strong consistency, with higher write latency.' } },
    client: { title: { all: 'What each customer sees', pel: 'The bill: latency vs consistency', pec: 'The bill: latency vs consistency' },
      story: { cp: 'Lena gets OK and sees 3 units. Her brother sees a 503 error and the shop asks him to try again. It is annoying, but nobody got a false promise: the data never diverged, only Recife was left out.',
        ap: 'Both get OK and are happy. But three orders were already confirmed (#101, #102 and #103) and the real stock is 5 − 3 = 2, while the nodes say 3. The two versions of the stock were born from the same value (4) and now diverge: v3a, Lena’s, and v3b, her brother’s.',
        ca: 'Compare the two choices. In A, the brother gets an error: consistency and partition tolerance, without availability (CP). In B, both get OK but the stock diverges: availability and partition tolerance, without consistency (AP). In neither case was the network “ignored”.',
        pel: 'Closing the bill with a healthy network: Lena waited 5 ms, and her brother may read a stale value for about 80 ms. Fast, and sometimes stale. This is the EL side of PACELC: when there is no partition (the “else”), you choose Latency.',
        pec: 'Closing the bill with a healthy network: Lena waited 80 ms, and her brother always read the current value. Slow, but exact. This is the EC side of PACELC: when there is no partition (the “else”), you choose Consistency.' },
      look: { cp: 'Lena’s phone: OK. Her brother’s phone: red error. Recife’s display goes dark: it refuses even to read.', ap: 'Both phones green. On the panel, consistency “NO” and “real 2 · nodes 3”.',
        ca: 'The scene alternates between the two choices, with the final result of each.', pel: 'Lena’s phone: 5 ms. Her brother’s phone: 5 (stale).', pec: 'Lena’s phone: 80 ms. Her brother’s phone: 4 (current).' },
      key: { cp: 'CP gives up availability (A) to keep consistency (C).', ap: 'AP gives up consistency (C) to keep availability (A).', ca: 'Tolerating partition (P) is mandatory. What you choose is C or A.',
        pel: 'PACELC: if there is a partition, choose A or C. Else, choose Latency or Consistency.', pec: 'PACELC: if there is a partition, choose A or C. Else, choose Latency or Consistency.' } },
    heal: { title: { cp: 'The cable is back and Recife catches up', ap: 'The cable is back and the versions have to be reconciled', ca: 'The network is back: each choice sends its bill', pel: 'What if the network between the cities gets slow?', pec: 'What if the network between the cities gets slow?' },
      story: { cp: 'The cable is spliced. Recife asks Rio for what it missed, gets order #102 and is back to 3 and clock v3. With the data equal, it unlocks. The brother tries again, the purchase goes through (#103) and all three end at 2. Nothing was lost.',
        ap: () => RECN() ? 'The cable is back and the nodes compare records: SP and Rio have #101 and #102; Recife has #101 and #103. Two orders for the same unit: a conflict. With merge, the shop unites the orders and recalculates: 5 − 3 = 2. No sale is lost, but someone had to write that rule (and what if the stock went negative?).'
          : 'The cable is back and the nodes compare records: SP and Rio have #101 and #102; Recife has #101 and #103. Two orders for the same unit: a conflict. With last-write-wins, the most recent write counts, Recife’s. Everyone ends with 3 and Lena’s order #102 is thrown away, even though she already got OK.',
        ca: 'The cable is back and each choice sends its bill. In CP, Recife only needs to catch up and try again. In AP, the nodes must reconcile versions that diverged: last-write-wins loses a sale, and a merge requires a business rule.',
        pel: 'With no partition, but a slow network (300 ms between the cities), Lena still waits only 5 ms. What grows is the stale-read window: Recife takes about 300 ms to catch up.',
        pec: 'With the slow network (300 ms between the cities), Lena waits about 300 ms for the reply: each write is as slow as the slowest link. Consistency holds; latency pays the price.' },
      look: { cp: 'Rio’s light carries #102 to Recife. Then the brother tries again and the displays go to 2.', ap: 'Light in both directions, the conflict flashes red and then the displays sort themselves out. Switch between LWW and merge in the panel.',
        ca: 'The scene shows the two choices, one after the other: first CP, then AP.', pel: 'Amber cables: the replica’s light moves slowly, but Lena’s phone gets its reply fast.', pec: 'Amber cables: Lena’s phone waits much longer.' },
      key: { cp: 'CP: after the partition, the lagging side just catches up.', ap: 'AP: reconciling is your problem. LWW loses data; merge needs a rule.', ca: 'Choosing AP means accepting to write reconciliation code.',
        pel: 'EL hides the network’s slowness from the client, but widens the stale-read window.', pec: 'EC passes the network’s slowness on to the client.' } },
    sum: { title: { all: 'Summary: ' },
      story: { cp: 'CP: under a partition, the minority side refuses and the data never diverges. A Postgres with a synchronous replica tends to behave like this. Use it when getting the balance wrong costs more than saying “try again” (payments, limited stock).',
        ap: 'AP: under a partition, everyone answers and the divergence is reconciled later. Cassandra and DynamoDB tend toward AP, with per-operation tunable consistency. Use it when being offline costs more than a stale value for a few moments (cart, feed, counter).',
        ca: 'CA only exists without a partition: a single-node database, or a network that never fails. In a distributed system partitions happen, so the real choice is CP or AP. “Tolerating partition” is not an option you can switch off.',
        pel: 'EL: with no partition, it answers fast and accepts stale reads for a short window. Many AP databases do this by default (for example Cassandra and DynamoDB, with tunable consistency). Use it when low latency is worth more than always-current reads.',
        pec: 'EC: with no partition, it waits for the other nodes and only then answers, so every reader sees the current value. A Postgres with a synchronous replica tends to do this. Use it when reading a stale value is unacceptable and you can afford the latency.' },
      look: { all: 'The panel at the back shows mode, consistency, availability and latency. In the side panel, the table compares the five modes.' },
      key: { cp: 'CP: right or nothing.', ap: 'AP: always answers, fixes it later.', ca: 'CA does not survive a real network.', pel: 'EL: fast now, equal later.', pec: 'EC: equal now, slower.' } },
  };
  const titleOf = () => { const s = STEPS[cur()], t = s.title[sc] ?? s.title.all; return cur() === 'sum' ? t + SCNAME[sc] : t; };

  // dados do passo
  const nodeTable = s => `<table class="h3-sum"><tr><th>node</th><th>stock</th><th>clock</th><th>orders</th><th>state</th></tr>${[0, 1, 2].map(i => {
    const ord = s.ord[i].map(o => '#' + o).join(' ') || '—', lost = s.lost[i].map(o => `<s style="color:#ff5a4a">#${o}</s>`).join(' ');
    return `<tr><td>${SHORT[i]}</td><td>${s.v[i]}</td><td>${s.ck[i]}</td><td>${ord} ${lost}</td><td>${{ ilha: 'island', recusa: 'refuses' }[s.nst[i]] || s.nst[i]}</td></tr>`; }).join('')}</table>`;
  const X_EX = '<li class="h3-dim">Orders (#101…), balances and times are teaching examples. Animation time is not to scale.</li>';
  const CMP = [['CP', 'refuses (gives up A)', 'Postgres with a synchronous replica tends to do this'], ['AP', 'answers and diverges (gives up C)', 'Cassandra and DynamoDB tend to do this'], ['CA', 'only without a partition', 'single-node database'],
    ['PACELC · EL', 'no partition: fast, reads may be stale', 'asynchronous replica'], ['PACELC · EC', 'no partition: slow, always current', 'synchronous replica']];
  const DATA = {
    start: s => nodeTable(s) + `<li>Product: <b>gato_pelucia</b>, stock = <b>5</b> in all 3 copies</li><li>Cables: SP ⇄ Rio and Rio ⇄ Recife, all ok</li>${X_EX}`,
    sale: s => nodeTable(s) + `<li>Order <b>#101</b>: stock 5 → 4</li><li>Write latency: <b>${PART(sc) ? '12 ms' : sc === 'pel' ? '5 ms' : '80 ms'}</b></li><li>${PART(sc) ? 'SP writes, tells Rio, Rio tells Recife.' : sc === 'pel' ? 'Answers the client before the replica leaves SP.' : 'Answers the client after the acks from Rio and Recife.'}</li>`,
    cut: s => nodeTable(s) + (PART(sc) ? '<li>Rio ⇄ Recife cable: <b>cut</b></li><li>Majority side: SP + Rio (2 of 3)</li><li>Minority side: Recife (1 of 3)</li>'
      : `<li>Read in Recife right after the write: <b>${s.B && /read 5/.test(s.B[0]) ? '5 (stale)' : s.B && /read 4/.test(s.B[0]) ? '4 (current)' : '…'}</b></li><li>Value in SP: <b>4</b></li>`),
    sale2: s => nodeTable(s) + (PART(sc) ? ({ cp: '<li>SP writes #102 and Rio confirms: 2 of 3 nodes = <b>quorum</b>.</li><li>Recife cannot reach anyone: <b>refuses</b> (503 error after 3 s).</li>',
      ap: '<li>SP and Rio write <b>#102</b> (v3a). Recife writes <b>#103</b> (v3b).</li><li>Real stock = 5 − 3 orders = <b>2</b>, nodes say <b>3</b>.</li>',
      ca: `<li>Current choice: <b>${s.choice === 'ap' ? 'B · accept on both sides (AP)' : 'A · refuse without quorum (CP)'}</b></li>` })[sc]
      : `<li>${sc === 'pel' ? 'Replica reaches Rio and then Recife (~80 ms in total).' : 'All were already 4 when the reply left (~80 ms).'}</li>`),
    client: s => nodeTable(s) + (PART(sc) ? `<li>Lena: <b>${sc === 'cp' || s.choice === 'cp' ? 'OK, 3 left (#102)' : 'OK, 3 left (#102)'}</b></li><li>Brother: <b>${sc === 'cp' || s.choice === 'cp' ? 'ERROR 503, no quorum' : 'OK, 3 left (#103)'}</b></li><li>Confirmed orders: <b>${s.acked}</b> · real stock: <b>${5 - s.acked}</b></li>`
      : `<li>Lena’s write: <b>${sc === 'pel' ? '5 ms' : '80 ms'}</b></li><li>Brother’s read right after: <b>${sc === 'pel' ? '5 (stale)' : '4 (current)'}</b></li>`),
    heal: s => nodeTable(s) + (PART(sc) ? ({ cp: '<li>Recife gets #102 from Rio and unlocks.</li><li>Brother tries again: #103 goes through. All at <b>2</b>.</li>',
      ap: RECN() ? '<li>Merge: unites #101, #102 and #103 → 5 − 3 = <b>2</b>. Nothing is lost.</li>' : '<li>LWW: the newest write wins (Recife’s) → <b>3</b>; <b>#102 is lost</b>.</li>',
      ca: `<li>Current choice: <b>${s.choice === 'ap' ? 'AP · reconcile versions' : 'CP · Recife just catches up'}</b></li>` })[sc]
      : `<li>Latency between cities: <b>~300 ms</b> (was ~80)</li><li>${sc === 'pel' ? 'The write still answers in 5 ms; the stale-read window goes to ~300 ms.' : 'The write now answers in ~300 ms.'}</li>`),
    sum: s => `<table class="h3-sum"><tr><th>mode</th><th>what it does</th><th>example</th></tr>${CMP.map(([a, b, c]) => `<tr${a === SCNAME[sc] ? ' style="color:var(--ink);font-weight:600"' : ''}><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</table><li>Database examples are general tendencies; many products let you tune them.</li>${X_EX}`,
  };
  const nowHtml = () => DATA[cur()](S());
  function panelHtml() {
    const s = STEPS[cur()];
    const recBox = sc === 'ap' ? `<div class="o3-mode" role="group" aria-label="Reconciliation"><button data-rec="lww" aria-pressed="${!RECN()}">Reconcile: LWW</button><button data-rec="merge" aria-pressed="${RECN()}">Reconcile: merge</button></div>` : '';
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Mode">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${BTN[v]}</button>`).join('')}</div>${recBox}
      <h2>${titleOf()}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="capnow">${nowHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + (AULA[sc] || 'aula-1-teorema-cap')); };
  const statusTxt = s => { const net = s.cab.includes('cut') ? 'partition' : s.cab.includes('slow') ? 'slow network' : 'network ok'; return net + ' · ' + (s.cons ? 'copies ' + (s.cons[0] === 'yes' ? 'equal' : s.cons[0].startsWith('yes') ? 'equal' : 'differ') : 'equal'); };
  function readout() { if (active !== 'cap') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${statusTxt(S())}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cap' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; keys.clear(); render(); SFX.bit(1); return true; }
  const GOID = { stat: 'sum', c0: 'sale', c1: 'sale2' };
  const goId = id => { const w = GOID[id] || (/^n\d$/.test(id) ? 'cut' : null); const i = IDS.indexOf(w); return go(i >= 0 ? i : step); };
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-cap3d-sc', v); } catch (e) {} backLink(); return go(step); };
  const setRec = v => { rec = v; try { localStorage.setItem('sdlabs-cap3d-rec', v); } catch (e) {} return go(step); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'cap') return; const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc); const r = e.target.closest('[data-rec]'); if (r) setRec(r.dataset.rec); });
  backLink();

  // ── um quadro da cena ──
  const AT = { M: [250, 274, 14], C: [425, 216, 8] };
  function scene3(s) {
    const t = lt;
    NODE.forEach((D, i) => {
      const st = s.nst[i], bad = st === 'recusa' || s.flash[i] === 'conflict', amb = st === 'ilha';
      D.mat.color.copy(bodyMat.color).multiplyScalar(bad ? 0.55 : 1);
      const blink = Math.sin(t * 6) > 0, col = bad ? ledBad : amb ? ledAmb : ledOk;
      D.led.color.copy(col); D.glow.material.uniforms.color.value.copy(col);
      D.led.color.multiplyScalar(bad ? (blink ? 1 : 0.35) : 1); D.glow.material.uniforms.intensity.value = bad ? (blink ? 0.9 : 0.2) : amb ? 0.7 : 0.55;
      drawNodeTop(i, s); drawNodeFront(i, s);
    });
    drawClient(0, s.L); drawClient(1, s.B);
    // cabos
    const cut = s.cab[1] === 'cut', lit = [false, false];
    let nd = 0;
    for (const [key, f, rev] of s.beads) { const d = DOTS[nd++]; if (!d) break; const P = PATH[key]; place(d, alongPts(P.pts, P.cum, rev ? 1 - f : f), 1.3); if (key === 'P01') lit[0] = true; if (key === 'P12') lit[1] = true; }
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    CAB.forEach((c, k) => { const sl = s.cab[k] === 'slow', isCut = k === 1 && cut;
      c.dim.visible = !isCut && !sl; c.slow.visible = !isCut && sl; c.lit.visible = !isCut && lit[k]; });
    HL.visible = HRL.visible = cut;
    badMat.resolution.copy(accentLineMat.resolution); badMat.linewidth = accentLineMat.linewidth; ambMat.resolution.copy(accentLineMat.resolution); ambMat.linewidth = accentLineMat.linewidth;
    const sc2 = s.sparkCol === 'g' ? ledOk : ledBad;
    SPK.forEach((gp, k) => { gp.material.uniforms.color.value.copy(sc2); gp.material.uniforms.intensity.value = s.spark * (0.45 + 0.55 * Math.abs(Math.sin(t * 17 + k * 2.1)) * (0.6 + 0.4 * Math.sin(t * 41 + k))); });
    drawStat(s);
    // balões
    const put = (tg, o, at) => { if (o) tg.set(o[1] ? o[0] : o, o[1]).at(...at); else tg.hide(); };
    put(tM, s.tm, AT.M); put(tC, s.tc, AT.C);
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > DUR() + 3) lt = 0;
    const s = S(); scene3(s);
    if (now - nowAt > 250) { nowAt = now; const el = document.getElementById('capnow'), h = DATA[cur()](s); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = mob ? [320, 150, 110] : [320, 150, -20];
      const want = W(f[0] + (mob ? 0 : -300), f[1], f[2] + (mob ? (innerWidth < 640 ? -340 : -300) : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, DUR() + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if ((e.key === 'm' || e.key === 'M') && sc === 'ap') return setRec(RECN() ? 'lww' : 'merge');
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); keys.clear(); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch mode', 'C', cycleSc]],
    view: NARROW() ? { target: W(320, 150, -230), dist: innerWidth < 640 ? 10.5 : 13 } : { target: W(60, 150, -20), dist: 16.5 },
    info: panelHtml(),
    hint: 'next: → · back: ← · mode: C or 1 2 3 4 5 · drag to rotate' };
})() });
