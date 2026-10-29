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
  const BTN = { cp: 'CP', ap: 'AP', ca: 'CA', pel: 'EL · rápida', pec: 'EC · síncrona' };
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
  const norm = s => { [0, 1, 2].forEach(i => setN(s, i, 4, [101], 'v2')); s.acked = 1; s.lat = '12 ms'; s.avail = ['sim', 'ok']; };

  function capS(m, id, tt, isCA) {
    const s = mk(); s.mode = m; const cp = m === 'cp';
    if (id === 'start') return s;
    if (id === 'sale') {
      if (tt >= 0.6) setN(s, 0, 4, [101], 'v2'); if (tt >= 1.8) setN(s, 1, 4, [101], 'v2'); if (tt >= 3.0) setN(s, 2, 4, [101], 'v2');
      bead(s, 'L', ev(tt, 0, 0.6)); bead(s, 'P01', ev(tt, 0.6, 1.8)); bead(s, 'P12', ev(tt, 1.8, 3.0)); bead(s, 'L', ev(tt, 1.8, 2.4), true);
      s.L = tt <= 0 ? null : tt < 1.8 ? ['comprando…', 'dim'] : ['OK · restam 4\n#101 · 12 ms', 'acc'];
      if (tt >= 1.8) { s.lat = '12 ms'; s.avail = ['sim', 'ok']; s.acked = 1; }
      if (!eqServing(s)) s.cons = ['convergindo', 'warn'];
      return s;
    }
    if (id === 'cut') {
      norm(s); s.L = ['OK · restam 4\n#101', 'acc'];
      if (tt < 0.8) bead(s, 'P12', tt / 0.8);
      else { s.cab[1] = 'cut'; s.spark = tt < 2.4 ? 1 : 0.4; s.tc = ['✕ partição\nRio ⇄ Recife sem contato', 'bad'];
        if (tt >= 1.0) s.nst[2] = 'ilha';
        if (isCA && tt >= 1.8) s.tm = ['CA acabou aqui\na rede falhou: e agora?', 'bad']; }
      return s;
    }
    if (id === 'sale2' || id === 'client') {
      norm(s); s.cab[1] = 'cut'; s.spark = 0.4; s.nst[2] = 'ilha'; s.L = ['OK · restam 4\n#101', 'acc'];
      bead(s, 'L', ev(tt, 0, 0.6)); bead(s, 'B', ev(tt, 0, 0.6));
      if (cp) {
        if (tt >= 0.6) setN(s, 0, 3, [101, 102], 'v3'); if (tt >= 1.8) setN(s, 1, 3, [101, 102], 'v3');
        bead(s, 'P01', ev(tt, 0.6, 1.8));
        bead(s, 'HR', tt < 1.5 ? ev(tt, 0.6, 1.5) : 1 - ev(tt, 1.5, 2.1));
        if (tt >= 1.5) { s.serve[2] = 0; s.nst[2] = 'recusa'; }
        s.L = tt < 0.6 ? ['comprando…', 'dim'] : tt < 1.8 ? ['comprando…', 'dim'] : ['OK · restam 3\n#102 · 12 ms', 'acc'];
        bead(s, 'L', ev(tt, 1.8, 2.4), true);
        s.B = tt < 0.6 ? ['comprando…', 'dim'] : tt < 3.6 ? [`esperando o Rio…\n${Math.floor(tt - 0.6)} s de 3 s`, 'dim'] : ['ERRO 503\nsem quórum · 3 s', 'bad'];
        if (tt >= 1.8) s.acked = 2;
        s.avail = tt < 3.6 ? ['—', 'dim'] : ['ERRO em REC', 'bad'];
        s.lat = tt >= 1.8 ? '12 ms (REC: 3 s, erro)' : '…'; if (tt < 3.6) s.lat = tt >= 1.8 ? '12 ms (REC: esperando)' : '…';
        if (tt >= 1.5) s.tc = ['✕ sem quórum no Recife\n1 de 3 nós', 'bad'];
        if (id === 'client') s.tm = ['CP: Recife recusa\nos dados nunca divergem', 'acc'];
      } else {
        if (tt >= 0.6) { setN(s, 0, 3, [101, 102], 'v3a'); setN(s, 2, 3, [101, 103], 'v3b'); } if (tt >= 1.8) setN(s, 1, 3, [101, 102], 'v3a');
        bead(s, 'P01', ev(tt, 0.6, 1.8)); bead(s, 'HR', ev(tt, 0.6, 1.5));
        s.L = tt < 1.0 ? ['comprando…', 'dim'] : ['OK · restam 3\n#102 · 4 ms', 'acc'];
        s.B = tt < 1.0 ? ['comprando…', 'dim'] : ['OK · restam 3\n#103 · 4 ms', 'acc'];
        bead(s, 'L', ev(tt, 0.6, 1.0), true); bead(s, 'B', ev(tt, 0.6, 1.0), true);
        if (tt >= 1.0) { s.acked = 3; s.avail = ['sim', 'ok']; s.lat = '4 ms'; } else { s.lat = '…'; }
        if (tt >= 1.5) s.tc = ['✕ a réplica do Recife\nnão passa: fica na fila', 'bad'];
        if (tt >= 1.8) s.cons = ['NÃO', 'bad'];
        if (id === 'client') s.tm = ['AP: os dois atendem\nreal 2 · os nós dizem 3', 'bad'];
      }
      if (!s.cons) s.cons = eqServing(s) ? ['sim', 'ok'] : ['convergindo', 'warn'];
      return s;
    }
    if (id === 'heal' || id === 'sum') {
      const s2 = capS(m, 'sale2', STATIC, isCA); s2.beads = []; s2.tm = null; s2.tc = null; s2.cons = null; s2.spark = 0;
      const s = s2, T = id === 'sum' ? STATIC : tt;
      s.cab[1] = T < 0.8 ? 'cut' : 'ok'; if (T < 0.8) { s.spark = 0.4; s.nst[2] = s.serve[2] ? 'ilha' : 'recusa'; } else { s.spark = T < 1.6 ? 1 : 0; s.sparkCol = 'g'; s.nst[2] = 'ok'; }
      if (cp) {
        bead(s, 'P12', ev(T, 1.2, 2.4));
        if (T >= 2.4) { setN(s, 2, 3, [101, 102], 'v3'); s.serve[2] = 1; }
        if (T >= 2.4 && T < 3.0) s.tc = ['Recife recuperou\nchegou o #102', 'acc'];
        s.B = T < 3.0 ? ['ERRO 503\nsem quórum · 3 s', 'bad'] : T < 3.6 ? ['tentando de novo…', 'dim'] : T < 4.8 ? ['gravando…', 'dim'] : ['OK · restam 2\n#103 · 14 ms', 'acc'];
        bead(s, 'B', ev(T, 3.0, 3.6)); bead(s, 'B', ev(T, 4.8, 5.4), true);
        if (T >= 3.6) setN(s, 2, 2, [101, 102, 103], 'v4'); bead(s, 'P12', ev(T, 3.6, 4.8), true);
        if (T >= 4.8) { setN(s, 1, 2, [101, 102, 103], 'v4'); s.acked = 3; s.lat = '14 ms'; s.avail = ['sim', 'ok']; } else s.avail = ['ERRO em REC', 'bad'];
        bead(s, 'P01', ev(T, 4.8, 6.0), true); if (T >= 6.0) setN(s, 0, 2, [101, 102, 103], 'v4');
        if (T >= 6.0) s.tm = ['tudo igual de novo\n5 − 3 pedidos = 2', 'acc'];
      } else if (rec === 'lww') {
        if (T < 4.4) s.cons = ['NÃO', 'bad'];
        bead(s, 'P12', ev(T, 1.2, 2.4)); bead(s, 'P12', ev(T, 1.2, 2.4), true);
        if (T >= 2.4 && T < 3.2) { s.flash[1] = s.flash[2] = 'conflict'; s.tc = ['conflito!\n#102 e #103 querem\na mesma unidade', 'bad']; s.cons = ['NÃO', 'bad']; }
        bead(s, 'P12', ev(T, 3.2, 4.4), true); bead(s, 'P01', ev(T, 4.4, 5.6), true);
        if (T >= 4.4) { setN(s, 1, 3, [101, 103], 'v4'); s.lost[1] = [102]; setN(s, 2, 3, [101, 103], 'v4'); }
        if (T >= 5.6) { setN(s, 0, 3, [101, 103], 'v4'); s.lost[0] = [102]; s.tc = ['#102 perdido\no cliente já tinha recebido OK', 'bad']; s.tm = ['LWW: venceu a escrita mais nova\nnós dizem 3, o real é 2', 'bad']; }
        if (T >= 4.4) s.cons = T >= 5.6 ? ['sim · perdeu #102', 'warn'] : ['convergindo', 'warn'];
      } else {
        if (T < 4.4) s.cons = ['NÃO', 'bad'];
        bead(s, 'P12', ev(T, 1.2, 2.4)); bead(s, 'P12', ev(T, 1.2, 2.4), true);
        if (T >= 2.4 && T < 3.2) { s.flash[1] = s.flash[2] = 'conflict'; s.tc = ['conflito!\n#102 e #103 querem\na mesma unidade', 'bad']; s.cons = ['NÃO', 'bad']; }
        bead(s, 'P12', ev(T, 3.2, 4.4)); bead(s, 'P12', ev(T, 3.2, 4.4), true); bead(s, 'P01', ev(T, 4.4, 5.6), true);
        if (T >= 4.4) { setN(s, 1, 2, [101, 102, 103], 'v4'); setN(s, 2, 2, [101, 102, 103], 'v4'); s.cons = ['convergindo', 'warn']; }
        if (T >= 5.6) { setN(s, 0, 2, [101, 102, 103], 'v4'); s.tc = ['merge: une os pedidos\n5 − 3 = 2 · nada se perde', 'acc']; s.tm = ['MERGE: exige uma regra\nescrita por você', 'acc']; }
      }
      if (!s.cons) s.cons = eqServing(s) ? ['sim', 'ok'] : ['convergindo', 'warn'];
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
      s.L = x <= 0 ? null : x < tR ? [el ? `gravando…\n${ms} ms` : `esperando réplicas\n${ms} ms`, 'dim'] : [`OK · restam 4\n#101 · ${fin} ms`, 'acc'];
      if (x >= tR) { s.lat = fin + ' ms'; s.avail = ['sim', 'ok']; s.acked = 1; } else s.lat = '…';
    }
    if (x >= tR && !el) s.avail = ['sim', 'ok'];
    const stale = ttw2 => el && ttw2 < tRec;
    if (id === 'cut') {
      const lr = tt, vr = (0.8 + OFFR) >= tRec ? 4 : 5;
      bead(s, 'B', ev(lr, 0.2, 0.8)); bead(s, 'B', ev(lr, 0.8, 1.4), true);
      s.B = lr < 0.2 ? null : lr < 1.4 ? ['lendo…', 'dim'] : vr === 5 ? ['leu 5\nLEITURA VELHA', 'bad'] : ['leu 4\ncópia atual', 'acc'];
    }
    if (id === 'sale2') s.tm = el ? (x < tRec ? ['réplica ainda a caminho\nas cópias diferem', 'warn'] : ['cópias iguais\nconsistência eventual', 'acc']) : ['nada a esperar\ntodos já eram 4 ao responder', 'acc'];
    if (id === 'client' || id === 'sum') {
      s.B = el ? ['lê 5\nvelho por ~80 ms', 'bad'] : ['lê 4\nsempre atual', 'acc'];
      s.tm = el ? ['EL: rápido, mas pode ler velho', 'warn'] : ['EC: lento, mas sempre atual', 'acc'];
    }
    if (id === 'heal') s.tm = ['rede lenta\n~300 ms entre as cidades', 'warn'];
    if (id === 'cut' && s.v[1] === 4 && s.v[2] === 5) s.tc = null;
    s.cons = eqServing(s) ? ['sim', 'ok'] : x < 0.6 ? ['sim', 'ok'] : ['convergindo', 'warn'];
    if (el && !eqServing(s)) s.cons = ['ainda não', 'warn'];
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
    x.textAlign = 'right'; x.fillStyle = stCol; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(st === 'ok' ? 'ok' : st === 'ilha' ? 'ILHA' : st === 'recusa' ? 'RECUSA' : st.toUpperCase(), u(121), u(10.5));
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(5), u(18)); x.lineTo(u(121), u(18)); x.stroke();
    x.textAlign = 'center'; x.fillStyle = s.serve[i] ? acc : C.ink; x.font = `600 ${u(46)}px ${MONO3}`; x.fillText(String(s.v[i]), u(63), u(43));
    if (!s.serve[i]) { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('recusa ler e escrever', u(63), u(66)); }
    x.textAlign = 'left'; x.font = `600 ${u(9)}px ${MONO3}`; let px = 5; x.fillStyle = C.ink; x.fillText('pedidos', u(px), u(75)); px += 38;
    const seg = [...s.ord[i].map(o => ['#' + o, false]), ...s.lost[i].map(o => ['#' + o, true])];
    seg.forEach(([t, bad]) => { const w = x.measureText(t).width / P; x.fillStyle = bad ? '#ff5a4a' : C.inkHi; x.fillText(t, u(px), u(75)); if (bad) { x.strokeStyle = '#ff5a4a'; x.lineWidth = u(0.9); x.beginPath(); x.moveTo(u(px), u(75)); x.lineTo(u(px + w), u(75)); x.stroke(); } px += w + 5; });
    x.fillStyle = C.ink; x.font = `${u(9)}px ${MONO3}`; x.fillText('relógio', u(5), u(87)); x.fillStyle = acc; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText(s.ck[i], u(44), u(87));
    if (s.flash[i] === 'conflict') { x.strokeStyle = '#ff5a4a'; x.lineWidth = u(2); x.strokeRect(u(1), u(1), cv.c.width / P - 2, cv.c.height / P - 2); }
    else if (st !== 'ok') { x.strokeStyle = stCol; x.lineWidth = u(0.9); x.strokeRect(u(0.6), u(0.6), cv.c.width / P - 1.2, cv.c.height / P - 1.2); }
    cv.tex.needsUpdate = true;
  }
  function drawNodeFront(i, s) {
    const key = 'nf' + i + s.ck[i] + theme; if (keys.get('nf' + i) === key) return; keys.set('nf' + i, key);
    const cv = NODE[i].fr, { x, P } = cv, C = pal3(), u = v => v * P, acc = theme === 'light' ? C.hi : '#' + accent.getHexString();
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('BD · ' + SHORT[i], u(4), u(8));
    x.fillStyle = C.ink; x.font = `${u(6.6)}px ${MONO3}`; x.fillText('gato_pelucia · estoque', u(4), u(17));
    cv.tex.needsUpdate = true;
  }
  const CNAME = [['LENA', 'São Paulo'], ['IRMÃO', 'Recife']];
  function drawClient(k, o) {
    const key = ['cl', k, o ? o.join('|') : '', theme, accent.getHex()].join('|'); if (keys.get('cl' + k) === key) return; keys.set('cl' + k, key);
    const cv = CLI[k].top, { x, P } = cv, C = pal3(), light = theme === 'light', acc = light ? C.hi : '#' + accent.getHexString(), u = v => v * P, Wd = cv.c.width / P;
    const tone = o ? o[1] : 'dim', col = tone === 'bad' ? '#ff5a4a' : tone === 'acc' ? acc : C.ink;
    bgFill(x, cv, tone === 'bad' ? (light ? '#f1d9d6' : '#2a1514') : tone === 'acc' ? (light ? '#f6ece2' : '#22170f') : C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    const fit = (t, size, w8) => { x.font = `${w8} ${u(size)}px ${MONO3}`; const w = x.measureText(t).width / P; if (w > Wd - 6) x.font = `${w8} ${u(size * (Wd - 6) / w)}px ${MONO3}`; };
    x.fillStyle = C.ink; fit(CNAME[k][0] + ' · ' + CNAME[k][1], 7, '600'); x.fillText(CNAME[k][0] + ' · ' + CNAME[k][1], cv.c.width / 2, u(6));
    const lines = o ? o[0].split('\n') : ['sem pedido', 'celular pronto'];
    x.fillStyle = tone === 'dim' ? C.inkHi : col; fit(lines[0], 11, '600'); x.fillText(lines[0], cv.c.width / 2, u(18));
    x.fillStyle = tone === 'dim' ? C.ink : col; fit(lines[1] || '', 8, '400'); x.fillText(lines[1] || '', cv.c.width / 2, u(29.5));
    if (tone !== 'dim') { x.strokeStyle = col; x.lineWidth = u(1.1); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2)); }
    cv.tex.needsUpdate = true;
    const fv = CLI[k].fr, key2 = 'clf' + theme; if (fv.done !== key2) { fv.done = key2; bgFill(fv.x, fv); fv.x.textBaseline = 'middle'; fv.x.textAlign = 'center'; fv.x.fillStyle = C.ink; fv.x.font = `${fv.P * 7.5}px ${MONO3}`; fv.x.fillText('celular · compra', fv.c.width / 2, fv.P * 9); fv.tex.needsUpdate = true; }
  }
  function drawStat(s) {
    const m = sc, modeName = s.isCA ? (s.choice ? 'CA → ' + SCNAME[s.choice] : IDS[step] === 'start' || IDS[step] === 'sale' ? 'CA' : 'CA ✕') : SCNAME[m];
    const net = s.cab.includes('cut') ? ['PARTIÇÃO', 'bad'] : s.cab.includes('slow') ? ['REDE LENTA', 'warn'] : ['rede ok', 'ok'];
    const real = 5 - s.acked, vs = s.v.filter((_, i) => s.serve[i]);
    const mism = s.acked > 0 && vs.some(v => v !== real) && s.cons && s.cons[0] !== 'convergindo' && s.cons[0] !== 'ainda não';
    const key = ['ss', modeName, net[0], s.cons && s.cons.join(), s.avail.join(), s.lat, s.ck.join(), s.v.join(), s.acked, s.serve.join(), theme, accent.getHex()].join('|'); if (keys.get('stat') === key) return; keys.set('stat', key);
    const { x, P } = stScr, C = pal3(), u = v => v * P, light = theme === 'light', acc = light ? C.hi : '#' + accent.getHexString();
    bgFill(x, stScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(14)}px ${MONO3}`; x.fillText(modeName, u(5), u(10));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText('gato de pelúcia · 3 cópias do saldo', u(5), u(21));
    x.textAlign = 'right'; x.fillStyle = toneHex(net[1], light); x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText(net[0], u(343), u(11));
    const cons = s.cons || ['sim', 'ok'], cells = [['consistência (cópias iguais?)', cons[0], cons[1]], ['disponibilidade (respondeu?)', s.avail[0], s.avail[1]],
      ['latência da escrita', s.lat, 'hi'], ['estoque real × nós', `real ${real} · nós ${s.v.map((v, i) => s.serve[i] ? v : '–').join('/')}`, mism ? 'bad' : 'hi']];
    cells.forEach(([a, b, tone], k) => { const cx = 5 + (k % 2) * 173, cy = 28 + Math.floor(k / 2) * 23;
      x.beginPath(); x.roundRect(u(cx), u(cy), u(168), u(20), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.fillText(a, u(cx + 4), u(cy + 6));
      x.fillStyle = toneHex(tone, light) || C.inkHi; x.font = `600 ${u(b.length > 22 ? 7.8 : 9.5)}px ${MONO3}`; x.fillText(b, u(cx + 4), u(cy + 14.5)); });
    x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.textAlign = 'left'; x.fillText('relógio de versão de cada nó', u(5), u(79));
    [0, 1, 2].forEach(i => { const cx = 5 + i * 115.5; x.beginPath(); x.roundRect(u(cx), u(83), u(110), u(14), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(7)}px ${MONO3}`; x.fillText(SHORT[i], u(cx + 4), u(90)); x.fillStyle = acc; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(s.ck[i], u(cx + 22), u(90)); });
    stScr.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const pick = o => { const v = o[sc] ?? o.all; return typeof v === 'function' ? v() : v; };
  const RECN = () => rec === 'merge';
  const STEPS = {
    start: { title: { all: 'Três cópias do saldo em três cidades' },
      story: { all: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos de dados: São Paulo, Rio e Recife. Cada um tem a sua cópia do número e um relógio de versão (v1). A Lena está em São Paulo e o irmão dela, em Recife.',
        cp: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos: São Paulo, Rio e Recife, cada um com o seu relógio de versão (v1). A Lena está em SP e o irmão dela, em Recife. Hoje o sistema é CP: se a rede cair, prefere recusar a mentir.',
        ap: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos: São Paulo, Rio e Recife, cada um com o seu relógio de versão (v1). A Lena está em SP e o irmão dela, em Recife. Hoje o sistema é AP: se a rede cair, prefere responder, mesmo com risco de divergir.',
        ca: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos: São Paulo, Rio e Recife. A Lena está em SP e o irmão dela, em Recife. Hoje a pergunta é: dá para ter consistência e disponibilidade sem se preocupar com a rede?',
        pel: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos: São Paulo, Rio e Recife. A rede está boa, sem partição. Hoje a replicação é assíncrona (EL): o nó responde logo e conta aos outros depois.',
        pec: 'A loja guarda o saldo do gato de pelúcia, 5 unidades, em três bancos: São Paulo, Rio e Recife. A rede está boa, sem partição. Hoje a replicação é síncrona (EC): o nó só responde depois que os outros confirmam.' },
      look: { all: 'Três ilhas com o saldo grande no visor, ligadas por cabos. O mostrador ao fundo resume modo, consistência, disponibilidade e latência.' },
      key: { all: 'Replicar é guardar o mesmo dado em vários nós. O preço é manter as cópias iguais.', cp: 'CAP: consistência, disponibilidade e tolerância a partição. Com a rede falhando, só dá para garantir duas.', ap: 'CAP: consistência, disponibilidade e tolerância a partição. Com a rede falhando, só dá para garantir duas.', ca: 'CAP: consistência, disponibilidade e tolerância a partição. Com a rede falhando, só dá para garantir duas.' } },
    sale: { title: { all: 'Uma venda normal, com a rede boa', pel: 'A Lena compra: resposta em 5 ms', pec: 'A Lena compra: resposta em 80 ms' },
      story: { all: 'Um cliente compra o primeiro gato (pedido #101). A requisição entra em São Paulo, que grava 4 e conta ao Rio, e o Rio conta ao Recife. Em poucos milissegundos os três mostram 4 e o relógio sobe para v2. Sem falha nenhuma, tudo é fácil.',
        pel: 'A Lena compra um gato (pedido #101). São Paulo grava 4 e responde na hora: 5 ms. A notícia só segue pelos cabos depois, sem ninguém esperar. O Rio recebe primeiro; o Recife, por último.',
        pec: 'A Lena compra um gato (pedido #101). São Paulo grava 4, mas só responde depois que o Rio e o Recife confirmarem. A resposta chega em 80 ms, e nesse momento os três já têm 4.' },
      look: { all: 'A luz sai do celular, entra em SP e segue pelos cabos. Os visores trocam 5 por 4 conforme a notícia chega.',
        pel: 'A resposta volta ao celular antes de a luz da réplica chegar ao Recife.', pec: 'O celular fica esperando enquanto a luz vai e volta pelos três nós.' },
      key: { all: 'Replicar é mandar cada escrita aos outros nós para as cópias ficarem iguais.', pel: 'Assíncrona: responde rápido, as cópias se acertam depois.', pec: 'Síncrona: responde só quando todos confirmam, e por isso é mais lenta.' } },
    cut: { title: { all: 'O cabo entre Rio e Recife cai', pel: 'O irmão consulta o estoque logo depois', pec: 'O irmão consulta o estoque logo depois' },
      story: { all: 'Passa um tempo e uma escavadeira corta o cabo entre Rio e Recife: é uma partição de rede. São Paulo e Rio ainda se falam; o Recife ficou sozinho. Nenhum nó caiu, eles só não conseguem mais conversar.',
        ca: 'Até aqui parecia perfeito: consistente e disponível, porque a rede nunca falhou. Só que cabos cortam, switches queimam e regiões da nuvem perdem contato. O cabo entre Rio e Recife cai: é uma partição. Nenhum nó caiu, mas o Recife ficou sozinho.',
        pel: 'Um instante depois do pedido #101, o irmão da Lena abre a loja em Recife e consulta o estoque. Esse nó ainda não recebeu a réplica: mostra 5, enquanto São Paulo já está em 4. É uma leitura velha (stale read).',
        pec: 'Um instante depois do pedido #101, o irmão da Lena abre a loja em Recife e consulta o estoque. O Recife já confirmou a réplica antes de a Lena receber a resposta, então mostra 4, o valor atual. Não há leitura velha.' },
      look: { all: 'O cabo apaga, solta faíscas vermelhas e o Recife fica isolado: a etiqueta dele vira ILHA.', pel: 'A luz da réplica ainda está a caminho do Recife. O visor dele continua em 5, e o celular do irmão lê 5.', pec: 'Os três visores já mostram 4, e o celular do irmão lê 4.' },
      key: { all: 'Partição: os nós estão vivos, mas não conseguem se falar.', ca: 'Num sistema distribuído a partição não é opcional: ela acontece.', pel: 'Leitura velha (stale read): ler uma cópia que ainda não recebeu a escrita.', pec: 'Replicação síncrona: nenhuma leitura enxerga o valor velho.' } },
    sale2: { title: { all: 'Duas compras ao mesmo tempo, com o Recife isolado', ca: 'Sob partição, você é obrigado a escolher', pel: 'Quando as cópias se igualam', pec: 'Quando as cópias se igualam' },
      story: { cp: 'Sob partição, a Lena (SP) e o irmão (Recife) compram ao mesmo tempo. O SP grava 3 e o Rio confirma: são 2 de 3 nós, há quórum e a compra passa (#102). O Recife não alcança ninguém, não tem quórum e espera até estourar o tempo limite: recusa a compra.',
        ap: 'Sob partição, a Lena (SP) e o irmão (Recife) compram ao mesmo tempo. O SP grava 3 (#102) e o Rio confirma. O Recife também grava 3 (#103), sem falar com ninguém. Os dois lados aceitam e respondem rápido, mas nenhum sabe da venda do outro.',
        ca: 'A Lena e o irmão compram ao mesmo tempo e a rede continua cortada. O sistema tem de decidir. A escolha A é recusar a escrita do lado sem quórum (vira CP). A escolha B é aceitar dos dois lados (vira AP). Não existe a opção C: "aceitar e continuar igual".',
        pel: 'A réplica do pedido #101 continua a viagem: chega ao Rio e, mais tarde, ao Recife. Só então os três mostram 4. A janela em que as cópias diferem dura cerca de 80 ms numa rede boa. Isso é consistência eventual: no fim todos concordam, mas não ao mesmo tempo.',
        pec: 'Aqui não houve janela: quando a Lena recebeu a resposta, as três cópias já eram 4. O preço foi esperar. A sincronia nunca deixa as cópias diferentes, mas cada escrita é tão lenta quanto o nó mais lento.' },
      look: { cp: 'O Recife manda luz até o cabo cortado, ela volta, e o celular do irmão fica esperando até aparecer o erro.', ap: 'Os dois celulares recebem OK em seguida. SP/Rio e Recife mostram 3, mas com pedidos diferentes.',
        ca: 'A cena alterna entre a escolha A (CP) e a escolha B (AP). Olhe o celular do irmão.', pel: 'O visor do Rio vira 4 e depois o do Recife. A consistência passa de "ainda não" para "sim".', pec: 'Quase nada muda na cena: o trabalho foi feito antes da resposta.' },
      key: { cp: 'CP: sem quórum, recusa. Prefere o erro à mentira.', ap: 'AP: aceita dos dois lados e promete acertar depois.', ca: 'Sob partição, ou você recusa (CP) ou aceita e diverge (AP).', pel: 'Consistência eventual: sem novas escritas, todas as cópias acabam iguais.', pec: 'Síncrona: consistência forte, com latência de escrita maior.' } },
    client: { title: { all: 'O que cada cliente vê', pel: 'A conta: latência x consistência', pec: 'A conta: latência x consistência' },
      story: { cp: 'A Lena recebe OK e vê 3 unidades. O irmão vê um erro 503 e a loja pede para tentar de novo. É chato, mas ninguém recebeu uma promessa falsa: os dados nunca divergiram, só o Recife ficou de fora.',
        ap: 'Os dois recebem OK e ficam felizes. Só que três pedidos já foram confirmados (#101, #102 e #103) e o estoque real é 5 − 3 = 2, enquanto os nós dizem 3. As duas versões do saldo nasceram do mesmo valor (4) e agora divergem: v3a, da Lena, e v3b, do irmão.',
        ca: 'Compare as duas escolhas. Na A, o irmão leva um erro: consistência e partição, sem disponibilidade (CP). Na B, os dois levam OK mas o estoque diverge: disponibilidade e partição, sem consistência (AP). Em nenhum caso a rede foi "ignorada".',
        pel: 'Fechando a conta com a rede boa: a Lena esperou 5 ms, e o irmão pode ler um valor velho por uns 80 ms. Rápido, e às vezes velho. É o lado EL do PACELC: quando não há partição (o "else"), escolhe-se Latência.',
        pec: 'Fechando a conta com a rede boa: a Lena esperou 80 ms, e o irmão leu sempre o valor atual. Lento, mas exato. É o lado EC do PACELC: quando não há partição (o "else"), escolhe-se Consistência.' },
      look: { cp: 'Celular da Lena: OK. Celular do irmão: erro vermelho. O visor do Recife fica apagado: ele recusa até ler.', ap: 'Os dois celulares verdes. No mostrador, consistência "NÃO" e "real 2 · nós 3".',
        ca: 'A cena alterna entre as duas escolhas, com o resultado final de cada uma.', pel: 'Celular da Lena: 5 ms. Celular do irmão: 5 (velho).', pec: 'Celular da Lena: 80 ms. Celular do irmão: 4 (atual).' },
      key: { cp: 'CP sacrifica a disponibilidade (A) para manter a consistência (C).', ap: 'AP sacrifica a consistência (C) para manter a disponibilidade (A).', ca: 'Tolerar partição (P) é obrigatório. O que se escolhe é C ou A.',
        pel: 'PACELC: se há partição, escolha A ou C. Senão (Else), escolha Latência ou Consistência.', pec: 'PACELC: se há partição, escolha A ou C. Senão (Else), escolha Latência ou Consistência.' } },
    heal: { title: { cp: 'O cabo volta e o Recife se atualiza', ap: 'O cabo volta e as versões precisam se acertar', ca: 'A rede volta: cada escolha cobra o seu preço', pel: 'E se a rede entre as cidades ficar lenta?', pec: 'E se a rede entre as cidades ficar lenta?' },
      story: { cp: 'O cabo é emendado. O Recife pede ao Rio o que perdeu, recebe o pedido #102 e volta a ter 3 e o relógio v3. Com os dados iguais, ele destrava. O irmão tenta de novo, a compra passa (#103) e os três terminam em 2. Nada se perdeu.',
        ap: () => RECN() ? 'O cabo volta e os nós comparam os registros: SP e Rio têm #101 e #102; o Recife tem #101 e #103. Dois pedidos para a mesma unidade: conflito. Com merge, a loja une os pedidos e recalcula: 5 − 3 = 2. Nenhuma venda se perde, mas alguém precisou escrever essa regra (e se o estoque ficasse negativo?).'
          : 'O cabo volta e os nós comparam os registros: SP e Rio têm #101 e #102; o Recife tem #101 e #103. Dois pedidos para a mesma unidade: conflito. Com last-write-wins, vale a escrita mais recente, a do Recife. Todos ficam com 3 e o pedido #102 da Lena é jogado fora, mesmo ela já tendo recebido OK.',
        ca: 'O cabo volta e cada escolha cobra o seu preço. Em CP, o Recife só precisa se atualizar e tentar de novo. Em AP, os nós precisam reconciliar versões que divergiram: last-write-wins perde uma venda, e um merge exige regra de negócio.',
        pel: 'Sem partição, mas com a rede lenta (300 ms entre as cidades), a Lena ainda espera só 5 ms. O que cresce é a janela de leitura velha: o Recife leva uns 300 ms para se acertar.',
        pec: 'Com a rede lenta (300 ms entre as cidades), a Lena espera uns 300 ms pela resposta: cada escrita é tão lenta quanto a ligação mais lenta. A consistência continua; quem paga é a latência.' },
      look: { cp: 'A luz do Rio leva o #102 ao Recife. Depois o irmão tenta de novo e os visores vão a 2.', ap: 'Luz nos dois sentidos, o conflito pisca em vermelho e então os visores se acertam. Troque entre LWW e merge no painel.',
        ca: 'A cena mostra as duas escolhas, uma depois da outra: primeiro CP, depois AP.', pel: 'Cabos âmbar: a luz da réplica anda devagar, mas o celular da Lena volta rápido.', pec: 'Cabos âmbar: o celular da Lena espera muito mais.' },
      key: { cp: 'CP: depois da partição, o lado atrasado só se atualiza.', ap: 'AP: reconciliar é problema seu. LWW perde dado; merge precisa de regra.', ca: 'Escolher AP é aceitar escrever código de reconciliação.',
        pel: 'EL esconde a lentidão da rede do cliente, mas aumenta a janela de leitura velha.', pec: 'EC repassa a lentidão da rede para o cliente.' } },
    sum: { title: { all: 'Resumo: ' },
      story: { cp: 'CP: sob partição, o lado minoritário recusa e os dados nunca divergem. Um Postgres com réplica síncrona tende a se comportar assim. Use quando errar o saldo custa mais do que dizer "tente de novo" (pagamentos, estoque limitado).',
        ap: 'AP: sob partição, todos respondem e a divergência é reconciliada depois. Cassandra e DynamoDB tendem a AP, com consistência ajustável por operação. Use quando ficar fora do ar custa mais do que um dado velho por instantes (carrinho, feed, contador).',
        ca: 'CA só existe sem partição: um banco de um nó só, ou uma rede que nunca falha. Num sistema distribuído a partição acontece, então a escolha real é CP ou AP. "Tolerar partição" não é uma opção que se desliga.',
        pel: 'EL: sem partição, responde rápido e aceita ler velho por uma janela curta. É o que muitos bancos AP fazem por padrão (por exemplo Cassandra e DynamoDB, com consistência ajustável). Use quando latência baixa vale mais que leitura sempre atual.',
        pec: 'EC: sem partição, espera os outros nós e só então responde, então todo leitor vê o valor atual. Um Postgres com réplica síncrona tende a isso. Use quando ler valor velho é inaceitável e dá para pagar a latência.' },
      look: { all: 'O mostrador ao fundo traz modo, consistência, disponibilidade e latência. No painel, a tabela compara os cinco modos.' },
      key: { cp: 'CP: certo ou nada.', ap: 'AP: responde sempre, acerta depois.', ca: 'CA não sobrevive a uma rede real.', pel: 'EL: rápido agora, igual depois.', pec: 'EC: igual agora, mais lento.' } },
  };
  const titleOf = () => { const s = STEPS[cur()], t = s.title[sc] ?? s.title.all; return cur() === 'sum' ? t + SCNAME[sc] : t; };

  // dados do passo
  const nodeTable = s => `<table class="h3-sum"><tr><th>nó</th><th>estoque</th><th>relógio</th><th>pedidos</th><th>estado</th></tr>${[0, 1, 2].map(i => {
    const ord = s.ord[i].map(o => '#' + o).join(' ') || '—', lost = s.lost[i].map(o => `<s style="color:#ff5a4a">#${o}</s>`).join(' ');
    return `<tr><td>${SHORT[i]}</td><td>${s.v[i]}</td><td>${s.ck[i]}</td><td>${ord} ${lost}</td><td>${s.nst[i]}</td></tr>`; }).join('')}</table>`;
  const X_EX = '<li class="h3-dim">Pedidos (#101…), saldos e tempos são exemplos didáticos. O tempo da animação não está em escala.</li>';
  const CMP = [['CP', 'recusa (perde A)', 'Postgres com réplica síncrona tende a isso'], ['AP', 'responde e diverge (perde C)', 'Cassandra e DynamoDB tendem a isso'], ['CA', 'só sem partição', 'banco de um nó só'],
    ['PACELC · EL', 'sem partição: rápido, leitura pode ser velha', 'réplica assíncrona'], ['PACELC · EC', 'sem partição: lento, sempre atual', 'réplica síncrona']];
  const DATA = {
    start: s => nodeTable(s) + `<li>Produto: <b>gato_pelucia</b>, estoque = <b>5</b> nas 3 cópias</li><li>Cabos: SP ⇄ Rio e Rio ⇄ Recife, todos ok</li>${X_EX}`,
    sale: s => nodeTable(s) + `<li>Pedido <b>#101</b>: estoque 5 → 4</li><li>Latência da escrita: <b>${PART(sc) ? '12 ms' : sc === 'pel' ? '5 ms' : '80 ms'}</b></li><li>${PART(sc) ? 'SP grava, avisa o Rio, o Rio avisa o Recife.' : sc === 'pel' ? 'Responde ao cliente antes de a réplica sair do SP.' : 'Responde ao cliente depois dos acks do Rio e do Recife.'}</li>`,
    cut: s => nodeTable(s) + (PART(sc) ? '<li>Cabo Rio ⇄ Recife: <b>cortado</b></li><li>Lado com maioria: SP + Rio (2 de 3)</li><li>Lado minoritário: Recife (1 de 3)</li>'
      : `<li>Leitura no Recife logo após a escrita: <b>${s.B && /leu 5/.test(s.B[0]) ? '5 (velha)' : s.B && /leu 4/.test(s.B[0]) ? '4 (atual)' : '…'}</b></li><li>Valor em SP: <b>4</b></li>`),
    sale2: s => nodeTable(s) + (PART(sc) ? ({ cp: '<li>SP grava #102 e o Rio confirma: 2 de 3 nós = <b>quórum</b>.</li><li>Recife não alcança ninguém: <b>recusa</b> (erro 503 após 3 s).</li>',
      ap: '<li>SP e Rio gravam <b>#102</b> (v3a). O Recife grava <b>#103</b> (v3b).</li><li>Estoque real = 5 − 3 pedidos = <b>2</b>, nós dizem <b>3</b>.</li>',
      ca: `<li>Escolha atual: <b>${s.choice === 'ap' ? 'B · aceitar dos dois lados (AP)' : 'A · recusar sem quórum (CP)'}</b></li>` })[sc]
      : `<li>${sc === 'pel' ? 'Réplica chega ao Rio e depois ao Recife (~80 ms no total).' : 'Todos já eram 4 quando a resposta saiu (~80 ms).'}</li>`),
    client: s => nodeTable(s) + (PART(sc) ? `<li>Lena: <b>${sc === 'cp' || s.choice === 'cp' ? 'OK, restam 3 (#102)' : 'OK, restam 3 (#102)'}</b></li><li>Irmão: <b>${sc === 'cp' || s.choice === 'cp' ? 'ERRO 503, sem quórum' : 'OK, restam 3 (#103)'}</b></li><li>Pedidos confirmados: <b>${s.acked}</b> · estoque real: <b>${5 - s.acked}</b></li>`
      : `<li>Escrita da Lena: <b>${sc === 'pel' ? '5 ms' : '80 ms'}</b></li><li>Leitura do irmão logo depois: <b>${sc === 'pel' ? '5 (velha)' : '4 (atual)'}</b></li>`),
    heal: s => nodeTable(s) + (PART(sc) ? ({ cp: '<li>Recife recebe o #102 do Rio e destrava.</li><li>Irmão tenta de novo: #103 passa. Todos em <b>2</b>.</li>',
      ap: RECN() ? '<li>Merge: une #101, #102 e #103 → 5 − 3 = <b>2</b>. Nada se perde.</li>' : '<li>LWW: vence a escrita mais nova (a do Recife) → <b>3</b>; o <b>#102 é perdido</b>.</li>',
      ca: `<li>Escolha atual: <b>${s.choice === 'ap' ? 'AP · reconciliar versões' : 'CP · Recife só se atualiza'}</b></li>` })[sc]
      : `<li>Latência entre cidades: <b>~300 ms</b> (era ~80)</li><li>${sc === 'pel' ? 'Escrita ainda responde em 5 ms; a janela de leitura velha vai a ~300 ms.' : 'Escrita agora responde em ~300 ms.'}</li>`),
    sum: s => `<table class="h3-sum"><tr><th>modo</th><th>o que faz</th><th>exemplo</th></tr>${CMP.map(([a, b, c]) => `<tr${a === SCNAME[sc] ? ' style="color:var(--ink);font-weight:600"' : ''}><td>${a}</td><td>${b}</td><td>${c}</td></tr>`).join('')}</table><li>Exemplos de bancos são tendências gerais; muitos produtos permitem ajustar.</li>${X_EX}`,
  };
  const nowHtml = () => DATA[cur()](S());
  function panelHtml() {
    const s = STEPS[cur()];
    const recBox = sc === 'ap' ? `<div class="o3-mode" role="group" aria-label="Reconciliação"><button data-rec="lww" aria-pressed="${!RECN()}">Reconciliar: LWW</button><button data-rec="merge" aria-pressed="${RECN()}">Reconciliar: merge</button></div>` : '';
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Modo">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${BTN[v]}</button>`).join('')}</div>${recBox}
      <h2>${titleOf()}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${pick(s.look)}</p>
      <p class="o3-key"><b>Em uma frase</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now" id="capnow">${nowHtml()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + (AULA[sc] || 'aula-1-teorema-cap')); };
  const statusTxt = s => { const net = s.cab.includes('cut') ? 'partição' : s.cab.includes('slow') ? 'rede lenta' : 'rede ok'; return net + ' · ' + (s.cons ? 'cópias ' + (s.cons[0] === 'sim' ? 'iguais' : s.cons[0].startsWith('sim') ? 'iguais' : 'diferem') : 'iguais'); };
  function readout() { if (active !== 'cap') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${statusTxt(S())}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar modo', 'C', cycleSc]],
    view: NARROW() ? { target: W(320, 150, -230), dist: innerWidth < 640 ? 10.5 : 13 } : { target: W(60, 150, -20), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · modo: C ou 1 2 3 4 5 · arraste para girar' };
})() });
