// Figura 3D (iso-glow): ACID e BASE. A Lena transfere R$ 100 para o irmão pelo app do banco (ela tem R$ 150, ele R$ 20).
// Cena: o servidor de banco de dados como uma máquina. Em cima dela: a TABELA contas (uma gaveta por linha, com o saldo em visor
// grande), a barra da REGRA (CHECK saldo >= 0), o RASCUNHO da transação em andamento (memória) e a esteira do WAL, que leva cada
// linha do log até o DISCO, à direita. Os clientes (tablets com o app do banco) ficam à esquerda.
// Cenários (toggle e ?mode=a|c|i|d|base): cada letra do ACID é um "e se der errado" da mesma transferência; BASE troca a máquina
// por três nós (A, B, C) que convergem com atraso.
// Números (LSN, ms, valores) são exemplos didáticos coerentes, avisados no painel.
FIGS3D.push({ id: 'acid', name: 'ACID', mod: (() => {
  const ZOFF = () => innerWidth < 640 ? -300 : innerWidth < 900 ? -250 : -205;
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const ph = (t, a, b) => clamp((t - a) / (b - a));

  // ── cenários ──
  const SC = ['a', 'c', 'i', 'd', 'base'];
  const SCBTN = { a: 'A', c: 'C', i: 'I', d: 'D', base: 'BASE' };
  const SCTIP = { a: 'Atomicity', c: 'Consistency', i: 'Isolation', d: 'Durability', base: 'BASE' };
  const SCNAME = { a: 'A · Atomicity', c: 'C · Consistency', i: 'I · Isolation', d: 'D · Durability', base: 'BASE · several servers' };
  const LESSON = { a: 'aula-2-modelo-acid', c: 'aula-2-modelo-acid', i: 'aula-2-modelo-acid', d: 'aula-2-modelo-acid', base: 'aula-3-modelo-base' };

  // ── geometria (unidades iso: x para a direita, y para a frente, z para cima) ──
  plateWith(g0, 740, 290, [[18, 18], [722, 18], [18, 272], [722, 272]]);
  const mkGroup = (id, parent = g0) => { const g = new THREE.Group(); if (id) g.userData.go = id; parent.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };
  const GRP = { acid: mkGroup(null), base: mkGroup(null) };

  // clientes: tablets deitados com o app do banco
  const CLY = { lena: 30, irmao: 116, aux: 202 };
  const CL = {};
  for (const k of ['lena', 'irmao', 'aux']) {
    const y = CLY[k], g = mkGroup('cl-' + k);
    rbox(22, y, 7, 112, 70, 5, 7, bodyMat, g);
    const cap = glowCap(25, y + 3, 12, 106, 64, 2, 5, g);
    const scr = faceCanvas('top', 28, y + 6, 14, 100, 58, 6, g);
    CL[k] = { g, cap, scr };
  }
  const CLP = { lena: [134, 65, 14], irmao: [134, 151, 14], aux: [134, 237, 14] };

  // a máquina (servidor de banco)
  rbox(150, 22, 7, 410, 250, 26, 8, bodyMat, GRP.acid);
  const machFr = faceCanvas('front', 156, 272, 31, 398, 20, 5, GRP.acid);
  const machLed = dotFront(548, 272, 26, 2.6, GRP.acid);
  // tabela contas: cabeçalho + uma gaveta por linha
  inset(164, 30, 33, 258, 114, 6, GRP.acid);
  const tabHead = faceCanvas('top', 170, 34, 33, 246, 16, 6, GRP.acid);
  const ROWK = ['lena', 'irmao', 'imob'], ROWY = { lena: 54, irmao: 84, imob: 114 };
  const ROW = {};
  for (const k of ROWK) {
    const g = mkGroup('tab', GRP.acid), y = ROWY[k];
    const cap = glowCap(172, y, 33, 242, 26, 7, 4, g);
    const scr = faceCanvas('top', 174, y + 2, 40, 238, 22, 7, g);
    ROW[k] = { g, cap, scr, lift: 0 };
  }
  // a regra: uma barra baixa entre o rascunho e a tabela
  const gateG = mkGroup('gate', GRP.acid);
  const gateCap = glowCap(166, 147, 33, 254, 6, 12, 2, gateG);
  const gateFr = faceCanvas('front', 170, 153, 44, 246, 10, 7, gateG);
  // rascunho da transação (memória)
  inset(164, 160, 33, 258, 104, 6, GRP.acid);
  const draftScr = faceCanvas('top', 168, 164, 33, 250, 96, 5, GRP.acid);
  // esteira do WAL: corpo, roletes nas pontas e a fita
  const beltG = mkGroup('wal', GRP.acid);
  rbox(436, 30, 33, 110, 234, 5, 4, bodyMat, beltG);
  rbox(432, 26, 33, 118, 8, 9, 4, bodyMat, beltG); rbox(432, 258, 33, 118, 8, 9, 4, bodyMat, beltG);
  const beltScr = faceCanvas('top', 440, 36, 38, 102, 220, 5, beltG);
  // disco, fora da máquina, à direita
  const diskG = mkGroup('disk', GRP.acid);
  rbox(584, 30, 7, 136, 122, 46, 8, bodyMat, diskG);
  const diskCap = glowCap(589, 35, 53, 126, 112, 3, 6, diskG);
  const diskScr = faceCanvas('top', 592, 38, 56.2, 120, 106, 5, diskG);
  const diskFr = faceCanvas('front', 590, 152, 46, 118, 30, 6, diskG);
  const diskLed = dotFront(712, 152, 40, 2.6, diskG);

  // BASE: três nós
  const NX = { A: 170, B: 360, C: 550 }, NCITY = { A: 'São Paulo', B: 'Rio', C: 'Recife' };
  const NODE = {};
  for (const k of ['A', 'B', 'C']) {
    const x = NX[k], g = mkGroup('node', GRP.base);
    rbox(x, 70, 7, 160, 140, 34, 8, bodyMat, g);
    const cap = glowCap(x + 6, 76, 41, 148, 128, 3, 6, g);
    const scr = faceCanvas('top', x + 8, 78, 44.2, 144, 124, 5, g);
    const fr = faceCanvas('front', x + 6, 210, 37, 132, 24, 6, g);
    const led = dotFront(x + 148, 210, 26, 2.6, g);
    NODE[k] = { g, cap, scr, fr, led };
  }
  hazeAndShadow(g0, 370, 145, 9, 3.6);

  // pontos de luz que viajam
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.26); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = Array.from({ length: 8 }, () => mkDot(11));
  creases(first);

  // ── caminhos ──
  const litMat = new LineMaterial({ color: accent.clone(), linewidth: 2.6, resolution: accentLineMat.resolution.clone(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
  themeHooks.push(() => litMat.color.copy(accent));
  const PATHS = {};
  const mkPath = (k, pts, grp, dimVis = true) => { PATHS[k] = { pts, cum: cumLen(pts), dim: polyLine(pts, lineMat, grp), lit: polyLine(pts, litMat, grp) }; PATHS[k].lit.visible = false; PATHS[k].dim.visible = dimVis; };
  const arc = (a, b, lift) => bezier(a, [a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], b, 48);
  const DRAFTP = [200, 212, 34], DRAFTR = [410, 228, 34], DRAFTC = [290, 192, 34];
  const WALF = [491, 250, 39], WALB = [491, 40, 39], DISKP = [612, 80, 57];
  mkPath('l_d', bezier(CLP.lena, [160, 65, 60], [175, 212, 60], DRAFTP, 48), GRP.acid);
  mkPath('a_d', bezier(CLP.aux, [160, 237, 50], [175, 222, 50], [200, 228, 34], 40), GRP.acid, false);
  mkPath('i_t', bezier(CLP.irmao, [155, 151, 50], [180, 98, 60], [200, 97, 42], 40), GRP.acid, false);
  mkPath('l_t', bezier(CLP.lena, [155, 65, 50], [180, 67, 60], [200, 67, 42], 40), GRP.acid, false);
  mkPath('a_t', bezier(CLP.aux, [160, 237, 80], [180, 67, 90], [210, 67, 42], 48), GRP.acid, false);
  mkPath('d_w', bezier(DRAFTR, [440, 228, 55], [470, 250, 60], WALF, 40), GRP.acid);
  mkPath('w_k', bezier(WALB, [491, 18, 75], [600, 40, 95], DISKP, 48), GRP.acid);
  mkPath('k_t', arc(DISKP, [410, 80, 42], 80), GRP.acid, false);
  mkPath('d_t', bezier(DRAFTC, [290, 192, 70], [290, 128, 70], [290, 128, 42], 40), GRP.acid, false);
  mkPath('d_g', bezier(DRAFTC, [290, 192, 60], [290, 160, 62], [290, 150, 47], 40), GRP.acid, false);
  const NP = { A: [250, 140, 45], B: [440, 140, 45], C: [630, 140, 45] };
  mkPath('l_A', bezier(CLP.lena, [170, 65, 70], [230, 120, 90], NP.A, 48), GRP.base);
  mkPath('i_C', arc(CLP.irmao, NP.C, 150), GRP.base);
  mkPath('A_B', arc(NP.A, NP.B, 55), GRP.base);
  mkPath('A_C', arc(NP.A, NP.C, 95), GRP.base);

  // ── rótulos que olham para a câmera ──
  const tags = []; let ZC = 1;
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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'bad' ? '#ff5a4a' : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.94)' : 'rgba(18,19,20,.88)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? '#ff5a4a' : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; t.w0 = nw / P * TS * k; t.h0 = nh / P * TS * k; sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1);
    }
    tags.push(t); return t;
  }
  const tCard = tag(15), tCard2 = tag(13), tGhost = tag(13);

  // ── estado da cena em cada instante ──
  // rows: { id: [saldo, tom, sub] } · draft: [{ t, lines: [[texto, tom]] }] · wal: [[lsn, texto, tom, f]] · disk: { wal: [[texto, tom]], tab, st }
  // power: on | off | boot · gate: idle | check | bad | ok · front: [[texto, tom]] (linha do tempo) · cl: { id: [grande, pequeno, tom] }
  // fly: [{ p, f, bad }] · card/card2/ghost: [título, tom, sub, onde] · nodes (BASE): { A: { lena, irmao, v, tone, note } }
  const S0 = () => ({ rows: { lena: [150, 'n'], irmao: [20, 'n'] }, draft: null, wal: [], disk: { wal: [], tab: 'lena 150 · irmao 20', st: ['idle', 'dim'] },
    power: 'on', gate: 'idle', front: null, cl: { lena: ['R$ 150', 'Lena’s balance', 'dim'], irmao: ['R$ 20', 'brother’s balance', 'dim'] }, fly: [], card: null, card2: null, ghost: null });
  const FL = (p, t, a, b, o = {}) => { if (t < a || t >= b) return null; const f = ease(ph(t, a, b)); return { p, f: o.back ? 1 - f : f * (o.stop || 1), bad: o.bad }; };
  const addFly = (S, ...f) => f.forEach(x => x && S.fly.push(x));
  const WE = (lsn, txt, tone, t, at) => t >= at ? [[lsn, txt, tone, ph(t, at, at + 0.5)]] : [];
  // a transferência completa (BEGIN, 2 UPDATEs, COMMIT), usada em A, C e D
  function fullTx(S, t, l0, opts = {}) {
    addFly(S, FL('l_d', t, 0.2, 1.0));
    const lines = [];
    if (t >= 0.9) lines.push(['BEGIN', 'dim']);
    if (t >= 1.4) lines.push(['lena   150 → 50', t < 2.6 ? 'acc' : 'hi']);
    if (t >= 2.0) lines.push(['irmao   20 → 120', t < 2.6 ? 'acc' : 'hi']);
    if (t >= 2.6) lines.push(['COMMIT ✓', 'acc']);
    S.draft = t >= 0.9 ? [{ t: 'T1 · R$ 100 transfer', lines }] : null;
    const disk = t >= 3.6 ? 'disk' : 'mem';
    S.wal = [...WE('#' + l0, 'T1 BEGIN', disk, t, 1.0), ...WE('#' + (l0 + 1), 'UPDATE lena 150→50', disk, t, 1.5),
      ...WE('#' + (l0 + 2), 'UPDATE irmao 20→120', disk, t, 2.1), ...WE('#' + (l0 + 3), 'T1 COMMIT', disk === 'disk' ? 'disk' : 'hot', t, 2.7)];
    addFly(S, FL('d_w', t, 1.0, 1.6), FL('d_w', t, 1.5, 2.1), FL('d_w', t, 2.1, 2.7), FL('d_w', t, 2.7, 3.2), FL('w_k', t, 3.0, 3.6));
    if (t >= 3.6) { S.disk.wal = [['#' + l0 + ' T1 BEGIN', 'hi'], ['#' + (l0 + 1) + ' UPDATE lena', 'hi'], ['#' + (l0 + 2) + ' UPDATE irmao', 'hi'], ['#' + (l0 + 3) + ' T1 COMMIT ✓', 'acc']]; S.disk.st = ['fsync ✓ #' + (l0 + 3), 'acc']; }
    addFly(S, FL('d_t', t, 3.6, 4.2));
    if (t >= 4.2) { S.rows.lena = [50, t < 6 ? 'hot' : 'n']; S.rows.irmao = [120, t < 6 ? 'hot' : 'n']; S.disk.tab = 'lena 150 · irmao 20 (stale until checkpoint)'; }
    addFly(S, FL('l_d', t, 4.2, 4.9, { back: true }));
    S.cl.lena = t >= 4.9 ? ['R$ 50', '✓ transfer done', 'ok'] : t >= 0.2 ? ['sending…', 'R$ 100 → brother', 'hi'] : S.cl.lena;
    if (t >= 4.9) S.cl.irmao = ['R$ 120', '+ R$ 100 from Lena', 'ok'];
    if (!opts.noCard && t >= 4.3) S.card = ['COMMIT: both changes together', 'acc', 'lena 50 · irmao 120 · total R$ 170', 'table'];
    return S;
  }
  const TX_SQL = "BEGIN;\nUPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';\nCOMMIT;";
  const RECOV = 'LOG:  database system was not properly shut down;\n      automatic recovery in progress';
  const EX = '<li class="h3-dim">Values, LSNs (#101…) and times are teaching examples. The LOG/ERROR texts are the ones PostgreSQL prints.</li>';

  // ── roteiro ──
  const STEPS = {
    a: [
      { title: 'The starting point', dur: 2,
        story: 'Lena wants to send R$ 100 to her brother through the bank app. Right now her account has R$ 150 and his has R$ 20: R$ 170 together. For the bank, a transfer is two changes: take from one account, add to the other. What happens if only the first one works?',
        look: 'The contas table sits at the back of the machine, one drawer per row. The tablets of Lena and her brother are on the left.',
        key: 'A transfer is two writes that have to move together.',
        sql: { who: 'any client', code: 'SELECT id, saldo FROM contas;', out: ' lena  | 150\n irmao |  20' },
        st: t => { const S = S0(); S.cl.lena = ['R$ 150', 'Transfer R$ 100?', 'hi']; if (t > 0.4) S.card = ['contas: total R$ 170', 'acc', 'lena 150 + irmao 20', 'table']; return S; },
        data: () => '<li>Two rows in the <b>contas</b> table: lena = 150, irmao = 20.</li><li>Business rule: the sum (R$ 170) must not change because of a transfer.</li>' },
      { title: 'BEGIN: opens a draft', dur: 2.2,
        story: 'The app sends BEGIN. From here the database opens a transaction, T1. Everything T1 does stays in its own draft, invisible to others, until COMMIT. Each step also becomes a line in the WAL, the log the database writes before touching the data.',
        look: 'A light goes from the tablet to the DRAFT. The first line (#101 T1 BEGIN) enters the WAL belt.',
        key: 'BEGIN opens the transaction: from here to COMMIT, all or nothing.',
        sql: { who: 'Lena’s app', code: 'BEGIN;', out: 'BEGIN' },
        st: t => { const S = S0(); addFly(S, FL('l_d', t, 0.2, 1.1), FL('d_w', t, 1.2, 1.7));
          if (t >= 1.1) S.draft = [{ t: 'T1 · R$ 100 transfer', lines: [['BEGIN', 'acc']] }];
          S.wal = WE('#101', 'T1 BEGIN', 'mem', t, 1.6); S.cl.lena = ['sending…', 'R$ 100 → brother', 'hi'];
          if (t >= 1.2) S.card = ['T1 open', 'acc', 'empty draft, T1 only', 'draft']; return S; },
        data: () => '<li>T1 = the transaction of the transfer.</li><li>WAL (write-ahead log): the database writes the change in the log <b>before</b> touching the data.</li>' },
      { title: 'Take R$ 100 from Lena… in the draft only', dur: 3.2,
        story: 'The first UPDATE takes R$ 100 from Lena: in T1’s draft she is left with R$ 50. Notice what that would mean if it were real right now: Lena 50, brother 20, total R$ 70. A hundred reais gone. This half-done state exists only inside T1; anyone querying the table still sees 150.',
        look: 'The draft shows lena 150 → 50, but Lena’s drawer in the table still says R$ 150. The WAL is written to disk bit by bit.',
        key: 'The half-done state stays stuck in the draft: nobody outside can see it.',
        sql: { who: 'Lena’s app', code: "UPDATE contas SET saldo = saldo - 100\n WHERE id = 'lena';", out: 'UPDATE 1   (no COMMIT yet)' },
        st: t => { const S = S0(); addFly(S, FL('l_d', t, 0.1, 0.8), FL('d_w', t, 1.0, 1.5), FL('w_k', t, 2.0, 2.6));
          S.draft = [{ t: 'T1 · R$ 100 transfer', lines: [['BEGIN', 'dim'], ...(t >= 0.8 ? [['lena   150 → 50', 'acc']] : [])] }];
          const dk = t >= 2.6 ? 'disk' : 'mem'; S.wal = [['#101', 'T1 BEGIN', dk, 1], ...WE('#102', 'UPDATE lena 150→50', dk, t, 1.4)];
          if (t >= 2.6) { S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi']]; S.disk.st = ['WAL written', 'dim']; }
          S.rows.lena = [150, 'n', 'others still see 150']; S.cl.lena = ['sending…', 'R$ 100 → brother', 'hi'];
          if (t >= 1.2) S.ghost = ['half-done: lena 50 · irmao 20', 'bad', 'total R$ 70: R$ 100 gone\nexists only inside T1', 'ghost'];
          return S; },
        data: () => '<li>In T1’s draft: lena = <b>50</b>, irmao = 20.</li><li>For everyone else: lena = <b>150</b>, irmao = 20 (what was committed).</li><li>In the WAL: #101 BEGIN, #102 UPDATE lena 150→50. Still <b>no</b> COMMIT.</li>' },
      { title: 'The server crashes before crediting the brother', dur: 2.6,
        story: 'Before the second UPDATE arrives, the server crashes. Everything in memory is gone, T1’s draft included. Lena’s app gets a connection error. If the database had written each UPDATE straight into the table, the account would now hold R$ 70 in total.',
        look: 'The machine’s screens go dark and the draft disappears. The disk, on the right, keeps lines #101 and #102 of the WAL.',
        key: 'A failure in the middle of a transaction is the case atomicity exists to cover.',
        sql: { who: 'Lena’s app', code: "UPDATE contas SET saldo = saldo + 100\n WHERE id = 'irmao';   -- never arrived", out: 'server closed the connection unexpectedly' },
        st: t => { const S = S0(); const off = t >= 0.8;
          S.draft = off ? null : [{ t: 'T1 · R$ 100 transfer', lines: [['BEGIN', 'dim'], ['lena   150 → 50', 'acc']] }];
          S.wal = [['#101', 'T1 BEGIN', 'disk', 1], ['#102', 'UPDATE lena 150→50', 'disk', 1]];
          S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi']]; S.power = off ? 'off' : 'on';
          S.cl.lena = t >= 1.1 ? ['error', 'connection lost', 'bad'] : ['sending…', 'R$ 100 → brother', 'hi'];
          if (off) { S.card = ['✕ the server crashed', 'bad', 'before the brother’s UPDATE', 'mach']; S.card2 = ['the disk keeps the WAL', 'acc', '#101 BEGIN · #102 UPDATE', 'disk']; }
          return S; },
        data: () => '<li>Lost (memory): T1’s draft.</li><li>Kept (disk): WAL #101 and #102, and the table file with lena 150, irmao 20.</li><li>Missing from the WAL: T1’s COMMIT.</li>' },
      { title: 'Back up: T1 is undone (ROLLBACK)', dur: 4,
        story: 'The server comes back and, before accepting connections, runs recovery: it reads the WAL from disk. T1 has BEGIN and an UPDATE, but no COMMIT. So it does not count: the database discards the debit, as in a ROLLBACK. Lena still has R$ 150 and her brother R$ 20.',
        look: 'A light goes from the disk to the table. #103 T1 ABORT enters the WAL, in red. The drawers stay at 150 and 20.',
        key: 'No COMMIT, nothing counts: atomicity is all or nothing.',
        sql: { who: 'the database itself, on startup', code: '-- automatic recovery (nobody types anything)\n-- T1: BEGIN and UPDATE in the WAL, no COMMIT → undone', out: RECOV + '\nLOG:  database system is ready to accept connections' },
        st: t => { const S = S0(); S.power = t < 1.2 ? 'boot' : 'on';
          S.wal = [['#101', 'T1 BEGIN', 'disk', 1], ['#102', 'UPDATE lena 150→50', 'disk', 1], ...WE('#103', 'T1 ABORT', 'bad', t, 2.6)];
          S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi'], ...(t >= 2.6 ? [['#103 T1 ABORT', 'bad']] : [])];
          addFly(S, FL('k_t', t, 1.2, 2.4));
          if (t >= 1.2 && t < 2.6) S.card = ['recovery reads the WAL', 'acc', '#101 BEGIN · #102 UPDATE · no COMMIT', 'disk'];
          if (t >= 2.6) { S.card = ['T1 undone (ROLLBACK)', 'acc', 'lena 150 · irmao 20 · total R$ 170', 'table'];
            S.ghost = ['the half-done state never showed up', 'dim', 'nobody read lena 50 with irmao 20', 'ghost'];
            S.cl.lena = ['R$ 150', 'it did not go: try again', 'hi']; } else S.cl.lena = ['error', 'connection lost', 'bad'];
          return S; },
        data: () => '<li>WAL read: #101 BEGIN, #102 UPDATE lena, <b>no COMMIT</b> for T1.</li><li>Decision: T1 aborted. lena = 150, irmao = 20.</li><li>In PostgreSQL, changes from a transaction without COMMIT stay invisible forever; the effect is that of a ROLLBACK.</li>' + EX },
      { title: 'Again, now all the way: everything', dur: 6,
        story: 'Lena tries once more. BEGIN, take R$ 100 from her, add R$ 100 to her brother, COMMIT. Only at COMMIT do both changes leave the draft and enter the table, together: Lena 50, brother 120. The total is still R$ 170.',
        look: 'The draft fills line by line; at COMMIT, the light goes down to the table and both drawers change at the same time.',
        key: 'Atomicity: both writes count together (COMMIT) or neither does (ROLLBACK).',
        sql: { who: 'Lena’s app', code: TX_SQL, out: 'COMMIT' },
        st: t => fullTx(S0(), t, 104),
        data: () => '<li>WAL: #104 BEGIN, #105 UPDATE lena, #106 UPDATE irmao, #107 COMMIT.</li><li>Before: 150 + 20 = 170. After: 50 + 120 = 170.</li><li>There is no moment when only one of the two changes is visible.</li>' + EX },
    ],
    c: [
      { title: 'The rule lives in the database', dur: 2,
        story: 'Whoever created the contas table put a rule in it: no balance can go negative. It is written in the database itself (a CHECK constraint), so it applies to every app, script or person that tries to write.',
        look: 'The bar between the draft and the table is the RULE. Every new row goes through it before getting in.',
        key: 'Consistency: the database only accepts states that follow the declared rules.',
        sql: { who: 'whoever created the table', code: 'CREATE TABLE contas (\n  id    text PRIMARY KEY,\n  saldo numeric NOT NULL CHECK (saldo >= 0)\n);', out: 'CREATE TABLE' },
        st: t => { const S = S0(); S.gate = 'check'; S.cl.lena = ['R$ 150', 'Transfer R$ 200?', 'hi']; if (t > 0.4) S.card = ['CHECK (saldo >= 0)', 'acc', 'no balance can go negative', 'gate']; return S; },
        data: () => '<li>Rules the database guarantees: CHECK, NOT NULL, PRIMARY KEY, UNIQUE, FOREIGN KEY and the type of each column.</li><li>Here: <b>saldo >= 0</b>.</li>' },
      { title: 'Lena asks for R$ 200', dur: 2.6,
        story: 'Lena gets the amount wrong and asks for R$ 200 instead of 100. The app opens the transaction and sends the UPDATE. In the draft, the math gives 150 − 200 = −50. Before the row counts, the database checks the rules.',
        look: 'The draft shows lena 150 − 200 = −50, not yet through the rule bar.',
        key: 'Every write is checked against the rules, not only the “suspicious” ones.',
        sql: { who: 'Lena’s app', code: "BEGIN;\nUPDATE contas SET saldo = saldo - 200\n WHERE id = 'lena';", out: '(the database checks the new row: saldo = -50)' },
        st: t => { const S = S0(); S.gate = 'check'; addFly(S, FL('l_d', t, 0.2, 1.0));
          if (t >= 1.0) S.draft = [{ t: 'T1 · R$ 200 transfer', lines: [['BEGIN', 'dim'], ...(t >= 1.4 ? [['lena   150 − 200 = −50', 'acc']] : [])] }];
          S.wal = WE('#201', 'T1 BEGIN', 'mem', t, 1.1); S.cl.lena = ['sending…', 'R$ 200 → brother', 'hi'];
          if (t >= 1.6) S.card = ['new balance: −50', 'acc', 'about to hit the rule', 'draft']; return S; },
        data: () => '<li>Proposed new row: lena = <b>−50</b>.</li><li>Rule: saldo >= 0.</li>' },
      { title: 'The rule blocks it', dur: 2.4,
        story: 'The new row would have a balance of −50, and the rule says saldo >= 0. The database rejects the UPDATE with an error. Nothing gets past the bar: Lena’s drawer stays at R$ 150.',
        look: 'The light leaves the draft, hits the rule bar and stops. The bar flashes red.',
        key: 'A write that breaks the rule never reaches the table.',
        sql: { who: 'database response', code: "-- the new row would have saldo = -50", out: 'ERROR:  new row for relation "contas" violates\n        check constraint "contas_saldo_check"' },
        st: t => { const S = S0(); addFly(S, FL('d_g', t, 0.2, 1.0, { stop: 0.95, bad: true }));
          S.gate = t >= 0.9 ? 'bad' : 'check';
          S.draft = [{ t: 'T1 · R$ 200 transfer', lines: [['BEGIN', 'dim'], ['lena   150 − 200 = −50', t >= 0.9 ? 'bad' : 'acc'], ...(t >= 1.0 ? [['✕ violates saldo >= 0', 'bad']] : [])] }];
          S.wal = [['#201', 'T1 BEGIN', 'mem', 1]]; S.cl.lena = t >= 1.2 ? ['error', 'broke the rule', 'bad'] : ['sending…', 'R$ 200 → brother', 'hi'];
          if (t >= 0.9) S.card = ['✕ balance −50 violates saldo >= 0', 'bad', 'the new row does not get in', 'gate']; return S; },
        data: () => '<li>PostgreSQL error code: <b>23514</b> (check_violation).</li><li>After an error, the transaction is aborted: any command, even COMMIT, turns into ROLLBACK.</li>' },
      { title: 'The whole transaction is rejected', dur: 2.6,
        story: 'It is not just that UPDATE that fails: the whole transaction rolls back. The app ends with ROLLBACK, the draft is thrown away and the WAL records the end of T1 with no effect. The brother gets nothing, Lena loses nothing, and the app shows “insufficient balance”.',
        look: 'The draft empties. The drawers stay at 150 and 20; #202 T1 ABORT enters the WAL.',
        key: 'Broken rule = whole transaction rejected; the database never leaves a valid state.',
        sql: { who: 'Lena’s app', code: 'ROLLBACK;', out: 'ROLLBACK' },
        st: t => { const S = S0(); S.gate = t < 0.8 ? 'bad' : 'check';
          S.draft = t < 0.9 ? [{ t: 'T1 · R$ 200 transfer', lines: [['BEGIN', 'dim'], ['lena   150 − 200 = −50', 'bad'], ['ROLLBACK', 'bad']] }] : null;
          S.wal = [['#201', 'T1 BEGIN', 'mem', 1], ...WE('#202', 'T1 ABORT', 'bad', t, 0.6)];
          S.cl.lena = ['R$ 150', '✕ insufficient balance', 'bad']; S.cl.irmao = ['R$ 20', 'nothing arrived', 'dim'];
          if (t >= 1.0) S.card = ['nothing changed', 'acc', 'lena 150 · irmao 20 · total R$ 170', 'table']; return S; },
        data: () => '<li>Table: lena = 150, irmao = 20 (same as before).</li><li>The error went back to the app, which shows the right message to Lena.</li>' },
      { title: 'R$ 100 fits the rule', dur: 6,
        story: 'Lena fixes it to R$ 100. Now 150 − 100 = 50, which is >= 0, and her brother goes to 120. Both new rows pass the bar and the COMMIT counts. The database left a valid state (170 in total, nobody negative) and arrived at another valid state.',
        look: 'The rule bar stays lit with no red; both drawers change together at COMMIT.',
        key: 'Consistency: from a valid state to another valid state, always.',
        sql: { who: 'Lena’s app', code: TX_SQL, out: 'COMMIT' },
        st: t => { const S = fullTx(S0(), t, 203, { noCard: true }); S.gate = t >= 3.6 && t < 4.6 ? 'ok' : 'check';
          if (t >= 4.3) S.card = ['valid state → valid state', 'acc', 'total R$ 170 · nobody negative', 'table']; return S; },
        data: () => '<li>Database rules (CHECK) guarantee whatever can be written as a constraint.</li><li>Business rules, like “the total does not change”, depend on the app using transactions correctly.</li>' + EX },
    ],
    i: [
      { title: 'Two transfers in the same second', dur: 2,
        story: 'At the same time Lena sends R$ 100 to her brother, the automatic rent debit runs: R$ 40 to the rental agency. Both touch the same row, Lena’s. In this database, the app takes three steps: read the balance, compute the new one and write the finished number. What should be left is 150 − 100 − 40 = 10.',
        look: 'Now two clients are touching Lena’s row: her tablet (T1) and the automatic debit (T2), below.',
        key: 'Isolation: simultaneous transactions must not get in each other’s way.',
        sql: { who: 'the app (T1 and T2 do the same)', code: "SELECT saldo FROM contas WHERE id = 'lena';\n-- the app computes: saldo - amount\nUPDATE contas SET saldo = <new> WHERE id = 'lena';", out: '(read, compute, write)' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; S.cl.lena = ['R$ 150', 'T1: R$ 100 → brother', 'hi']; S.cl.aux = ['scheduled', 'T2: R$ 40 → rent', 'hi'];
          if (t > 0.4) S.card = ['lena has R$ 150', 'acc', 'T1 takes 100 · T2 takes 40 · 10 should be left', 'table']; return S; },
        data: () => '<li>T1: Lena → brother, R$ 100.</li><li>T2: Lena → rental agency, R$ 40 (rent; small example amount).</li><li>Correct at the end: lena 10, irmao 120, imobiliaria 40 (total 170).</li>' },
      { title: 'No isolation: both read 150', dur: 2.6,
        story: 'With no lock at all, T1 reads Lena’s balance: 150. A moment later, T2 reads it too: 150. Neither knows about the other. Each will do its math from a number that is about to go stale.',
        look: 'Both lights leave Lena’s drawer for the clients. The draft shows T1 read 150 and T2 read 150, and the timeline in front of the machine notes the order.',
        key: 'Two reads of the same value at the same time are the start of the problem.',
        sql: { who: 'T1 and T2', code: "SELECT saldo FROM contas WHERE id = 'lena';  -- T1\nSELECT saldo FROM contas WHERE id = 'lena';  -- T2", out: 'T1: 150   T2: 150' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; addFly(S, FL('l_t', t, 0.2, 0.9, { back: true }), FL('a_t', t, 0.9, 1.7, { back: true }));
          S.draft = [{ t: 'T1 · brother', lines: t >= 0.9 ? [['read lena = 150', 'acc']] : [] }, { t: 'T2 · rent', lines: t >= 1.7 ? [['read lena = 150', 'acc']] : [] }];
          S.front = [['T1 reads 150', t >= 0.9 ? 'acc' : 'off'], ['T2 reads 150', t >= 1.7 ? 'acc' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'read 150' : 'reading…', 'hi']; S.cl.aux = ['T2', t >= 1.7 ? 'read 150' : 'reading…', 'hi'];
          if (t >= 1.8) S.card = ['T1 read 150 · T2 read 150', 'acc', 'both hold the same number', 'draft']; return S; },
        data: () => '<li>Value read by T1: <b>150</b>.</li><li>Value read by T2: <b>150</b>.</li>' },
      { title: 'Each one writes its own result', dur: 3.2,
        story: 'T1 computes 150 − 100 = 50 and writes 50. Then T2 computes 150 − 40 = 110 and writes 110, on top. T1’s R$ 100 debit simply vanished: the last write erased the first. This has a name: lost update.',
        look: 'Lena’s drawer shows 50 and right after 110, in red. The timeline gets both writes.',
        key: 'Lost update: two reads of the same value and the second write erases the first.',
        sql: { who: 'T1 and T2', code: "UPDATE contas SET saldo = 50  WHERE id = 'lena';  -- T1: 150-100\nUPDATE contas SET saldo = 110 WHERE id = 'lena';  -- T2: 150-40", out: 'UPDATE 1 · UPDATE 1   (the second erased the first)' },
        st: t => { const S = S0(); addFly(S, FL('l_t', t, 0.2, 0.9), FL('a_t', t, 1.3, 2.1));
          S.rows.lena = t >= 2.1 ? [110, 'bad', 'T1’s debit vanished'] : t >= 0.9 ? [50, 'hot'] : [150, 'n'];
          S.rows.irmao = t >= 0.9 ? [120, 'n'] : [20, 'n']; S.rows.imob = t >= 2.1 ? [40, 'n'] : [0, 'n'];
          S.draft = [{ t: 'T1 · brother', lines: [['read lena = 150', 'dim'], ['writes 150−100 = 50', t >= 0.9 ? 'acc' : 'dim']] }, { t: 'T2 · rent', lines: [['read lena = 150', 'dim'], ['writes 150−40 = 110', t >= 2.1 ? 'bad' : 'dim']] }];
          S.front = [['T1 reads 150', 'acc'], ['T2 reads 150', 'acc'], ['T1 writes 50', t >= 0.9 ? 'acc' : 'off'], ['T2 writes 110', t >= 2.1 ? 'bad' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'wrote 50 ✓' : 'writing…', 'hi']; S.cl.aux = ['T2', t >= 2.1 ? 'wrote 110 ✓' : 'waiting its turn…', 'hi'];
          if (t >= 2.2) S.card = ['lost update', 'bad', 'lena 110, should be 10', 'table']; return S; },
        data: () => '<li>Timeline: T1 reads 150 → T2 reads 150 → T1 writes 50 → T2 writes 110.</li><li>Both transactions think it worked.</li>' },
      { title: 'The numbers do not add up', dur: 2,
        story: 'Add it all up: Lena 110, brother 120, rental agency 40. That is R$ 270, but before it was R$ 170. The bank “created” R$ 100. For a real bank, that is free money for Lena and a loss for the bank.',
        look: 'Lena’s drawer turns red with R$ 110. The timeline shows the four operations interleaved.',
        key: 'Without isolation, transactions that are right alone give a wrong result together.',
        sql: { who: 'audit', code: 'SELECT sum(saldo) FROM contas;', out: '270   -- it was 170' },
        st: t => { const S = S0(); S.rows.lena = [110, 'bad', 'should be 10']; S.rows.irmao = [120, 'n']; S.rows.imob = [40, 'n'];
          S.front = [['T1 reads 150', 'acc'], ['T2 reads 150', 'acc'], ['T1 writes 50', 'acc'], ['T2 writes 110', 'bad']];
          S.cl.lena = ['R$ 110', '?! should be R$ 10', 'bad']; S.cl.irmao = ['R$ 120', '+ R$ 100', 'ok']; S.cl.aux = ['T2', 'rent paid', 'ok'];
          if (t > 0.3) S.card = ['total R$ 270', 'bad', 'it was R$ 170: R$ 100 came from nowhere', 'table']; return S; },
        data: () => '<li>110 + 120 + 40 = <b>270</b>.</li><li>Correct would be 10 + 120 + 40 = <b>170</b>.</li>' },
      { title: 'With isolation: lock the row', dur: 3,
        story: 'Back to the start, now with isolation. T1 reads the balance with FOR UPDATE: the database puts a lock on Lena’s row. When T2 tries to read the same row with FOR UPDATE, it cannot: it waits for T1 to finish.',
        look: 'Lena’s drawer rises with LOCK · T1. In the draft, T2 shows up waiting.',
        key: 'With the lock, only one transaction touches the row at a time.',
        sql: { who: 'T1 and T2', code: "BEGIN;  -- T1\nSELECT saldo FROM contas WHERE id = 'lena' FOR UPDATE;  -- 150, locks\nBEGIN;  -- T2\nSELECT saldo FROM contas WHERE id = 'lena' FOR UPDATE;  -- waits…", out: 'T1: 150   T2: (blocked, waiting)' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; addFly(S, FL('l_t', t, 0.2, 0.9, { back: true }), FL('a_t', t, 1.3, 2.1, { back: true, stop: 0.82 }));
          S.rows.lena = t >= 0.9 ? [150, 'lock', 'LOCK · T1'] : [150, 'n'];
          S.draft = [{ t: 'T1 · brother', lines: t >= 0.9 ? [['read lena = 150 (lock)', 'acc']] : [] }, { t: 'T2 · rent', lines: t >= 2.0 ? [['⏳ waiting for the lock…', 'old']] : [] }];
          S.front = [['T1 reads+locks', t >= 0.9 ? 'acc' : 'off'], ['T2 waits', t >= 2.0 ? 'old' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'read 150 (lock)' : 'reading…', 'hi']; S.cl.aux = ['T2', t >= 2.0 ? '⏳ waiting' : 'reading…', 'hi'];
          if (t >= 1.0) S.card = ['LOCK · T1 on the lena row', 'acc', 'T2 waits in line', 'table']; return S; },
        data: () => '<li>FOR UPDATE: reads and locks the row until the transaction ends.</li><li>T2 is stuck: isolation costs waiting.</li>' },
      { title: 'T1 finishes, T2 reads the new value', dur: 4.4,
        story: 'T1 writes 50, credits the brother and COMMITs. The COMMIT releases the lock. Only then can T2 read: now the balance is 50, not 150. T2 computes 50 − 40 = 10, writes and COMMITs. One ran after the other.',
        look: 'The lock passes from T1 to T2. Lena’s drawer goes from 150 to 50 and then to 10.',
        key: 'With isolation, the result is the same as running one transaction after the other.',
        sql: { who: 'T1 and then T2', code: "UPDATE contas SET saldo = 50 WHERE id = 'lena';  -- T1\nCOMMIT;  -- T1 releases the lock\n-- T2 wakes up and reads 50\nUPDATE contas SET saldo = 10 WHERE id = 'lena';  -- T2\nCOMMIT;", out: 'COMMIT · COMMIT' },
        st: t => { const S = S0(); addFly(S, FL('l_t', t, 0.2, 0.9), FL('a_t', t, 1.6, 2.3, { back: true }), FL('a_t', t, 2.6, 3.3));
          S.rows.lena = t >= 3.3 ? [10, 'hot'] : t >= 2.3 ? [50, 'lock', 'LOCK · T2'] : t >= 1.4 ? [50, 'n', 'lock released'] : t >= 0.9 ? [50, 'lock', 'LOCK · T1'] : [150, 'lock', 'LOCK · T1'];
          S.rows.irmao = t >= 1.4 ? [120, t < 3 ? 'hot' : 'n'] : [20, 'n']; S.rows.imob = t >= 3.6 ? [40, 'hot'] : [0, 'n'];
          S.draft = [{ t: 'T1 · brother', lines: [['read 150 (lock)', 'dim'], ...(t >= 0.9 ? [['writes 50', 'acc']] : []), ...(t >= 1.4 ? [['COMMIT ✓ releases lock', 'acc']] : [])] },
            { t: 'T2 · rent', lines: t < 2.3 ? [['⏳ waiting for the lock…', 'old']] : [['read lena = 50', 'acc'], ...(t >= 3.3 ? [['writes 50−40 = 10', 'acc']] : []), ...(t >= 3.6 ? [['COMMIT ✓', 'acc']] : [])] }];
          S.front = [['T1 reads+locks', 'acc'], ['T2 waits', 'old'], ['T1 writes 50 ✓', t >= 1.4 ? 'acc' : 'off'], ['T2 reads 50', t >= 2.3 ? 'acc' : 'off'], ['T2 writes 10 ✓', t >= 3.6 ? 'acc' : 'off']];
          S.cl.lena = ['T1', t >= 1.4 ? 'COMMIT ✓' : 'writing…', t >= 1.4 ? 'ok' : 'hi']; S.cl.aux = ['T2', t >= 3.6 ? 'COMMIT ✓' : t >= 2.3 ? 'read 50' : '⏳ waiting', t >= 3.6 ? 'ok' : 'hi'];
          if (t >= 2.3 && t < 3.6) S.card = ['T2 read 50, not 150', 'acc', 'the value T1 committed', 'draft'];
          if (t >= 3.6) S.card = ['lena = 10', 'acc', '150 − 100 − 40', 'table']; return S; },
        data: () => '<li>Timeline: T1 reads 150 and locks → T2 waits → T1 writes 50, COMMIT → T2 reads 50 → T2 writes 10, COMMIT.</li>' },
      { title: 'Right result: R$ 170 in total', dur: 2,
        story: 'Lena 10, brother 120, rental agency 40: R$ 170, as before. The FOR UPDATE lock is one way. Another is to ask for the SERIALIZABLE level (or REPEATABLE READ): the database notices the conflict and aborts one of the two, and the app retries. And the simplest one here: UPDATE ... SET saldo = saldo − 40, which reads and writes in a single operation.',
        look: 'The three drawers with the right values; the timeline shows one transaction after the other.',
        key: 'Isolation trades a bit of waiting (or retrying) for correct results.',
        sql: { who: 'another way out', code: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;', out: 'ERROR:  could not serialize access due to concurrent update\n-- the app retries T2, which now reads 50' },
        st: t => { const S = S0(); S.rows.lena = [10, 'n']; S.rows.irmao = [120, 'n']; S.rows.imob = [40, 'n'];
          S.front = [['T1 reads+locks', 'acc'], ['T2 waits', 'old'], ['T1 writes 50 ✓', 'acc'], ['T2 reads 50', 'acc'], ['T2 writes 10 ✓', 'acc']];
          S.cl.lena = ['R$ 10', '✓ correct', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100', 'ok']; S.cl.aux = ['T2', 'rent paid ✓', 'ok'];
          if (t > 0.3) S.card = ['total R$ 170', 'acc', 'as if one ran after the other', 'table']; return S; },
        data: () => '<li>10 + 120 + 40 = <b>170</b> ✓</li><li>PostgreSQL levels: READ COMMITTED (default), REPEATABLE READ, SERIALIZABLE.</li><li>MVCC: each transaction reads a consistent “snapshot”; reads do not block writes.</li><li>Anomalies isolation prevents: lost update, dirty read, non-repeatable read, phantom read.</li>' + EX },
    ],
    d: [
      { title: 'The transfer, still in memory', dur: 3.2,
        story: 'Lena sends the R$ 100. The transaction opens, takes 100 from her and adds 100 to her brother. So far everything is in the server’s memory: the draft and the WAL lines on the belt. Memory is fast, but it vanishes if the power goes out.',
        look: 'The draft has both changes. On the belt, three WAL lines with a dashed border: still only in memory.',
        key: 'Memory is fast and volatile; disk is slower and keeps data without power.',
        sql: { who: 'Lena’s app', code: "BEGIN;\nUPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';", out: 'UPDATE 1 · UPDATE 1' },
        st: t => { const S = fullTx(S0(), Math.min(t, 2.5), 301); S.cl.lena = ['sending…', 'R$ 100 → brother', 'hi'];
          if (t >= 2.2) S.card = ['WAL in memory', 'acc', 'each change becomes a log line', 'belt']; return S; },
        data: () => '<li>WAL in memory (buffer): #301 BEGIN, #302 UPDATE lena, #303 UPDATE irmao.</li><li>Disk: nothing new yet.</li>' },
      { title: 'COMMIT: the log goes down to disk', dur: 3.6,
        story: 'Lena confirms and the app sends COMMIT. The database puts line #304 COMMIT in the WAL and sends the log to disk with fsync, the call that only returns when the disk says “really written”. Notice: the table file on disk still has 150 and 20. It is updated later (checkpoint); what guarantees the transfer is the WAL.',
        look: 'The WAL lines travel along the belt to the disk. The disk screen shows fsync ✓ and the WAL with the COMMIT.',
        key: 'Write-ahead: the log goes to disk before the database says “done”.',
        sql: { who: 'Lena’s app', code: 'COMMIT;', out: '(the database waits for the WAL fsync…)' },
        st: t => { const S = fullTx(S0(), 2.6 + t, 301, { noCard: true }); if (t < 1.6) S.rows = { lena: [150, 'n'], irmao: [20, 'n'] };
          S.cl.lena = ['sending…', 'COMMIT', 'hi']; S.cl.irmao = ['R$ 20', 'brother’s balance', 'dim']; S.fly = S.fly.filter(f => f.p !== 'l_d');
          if (t >= 1.0) S.card = ['fsync ✓', 'acc', 'the disk confirmed: the WAL is written', 'disk']; return S; },
        data: () => '<li>WAL on disk: #301 … #304 COMMIT.</li><li>Table file on disk: lena 150, irmao 20 (stale, until the checkpoint).</li><li>fsync: asks the operating system to take the data out of the cache and write it to the physical medium.</li>' + EX },
      { title: 'Only now: “OK” to the app', dur: 2,
        story: 'With the WAL safe on disk, the database answers COMMIT to the app. Lena’s screen shows “transfer done” and her brother already sees R$ 120. From here on, the database has promised: this transfer will not be lost.',
        look: 'The light returns to Lena’s tablet. The drawers show 50 and 120.',
        key: 'COMMIT answered = a promise of durability.',
        sql: { who: 'database response', code: 'COMMIT;', out: 'COMMIT' },
        st: t => { const S = fullTx(S0(), 4.2 + t * 0.5, 301, { noCard: true }); S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n'];
          S.fly = S.fly.filter(f => f.p !== 'l_d'); addFly(S, FL('l_d', t, 0, 0.8, { back: true })); S.cl.lena = t >= 0.8 ? ['R$ 50', '✓ transfer done', 'ok'] : ['sending…', 'COMMIT', 'hi']; S.cl.irmao = ['R$ 120', '+ R$ 100 from Lena', 'ok'];
          if (t >= 0.8) S.card = ['COMMIT → OK', 'acc', 'only after the fsync', 'lena']; return S; },
        data: () => '<li>The app received COMMIT.</li><li>Table in memory: lena 50, irmao 120.</li><li>On disk: WAL with the COMMIT; table file still stale.</li>' },
      { title: 'The power goes out', dur: 2.4,
        story: 'A second after the OK, the building loses power. The server shuts down at once. The table that was in memory, with 50 and 120, is gone. Two things are left on disk: the table file, stale (150 and 20), and the WAL, with the whole transfer and the COMMIT.',
        look: 'The machine goes dark. Only the disk keeps what it has: the WAL up to #304 and the stale table file.',
        key: 'In a crash, memory goes away and the disk stays.',
        sql: { who: 'nobody', code: '-- no power: the process dies mid-flight', out: '—' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n']; S.fly = [];
          S.cl.lena = ['R$ 50', '✓ transfer done', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 from Lena', 'ok'];
          if (t >= 0.6) { S.power = 'off'; S.card = ['⚡ the power went out', 'bad', 'everything in memory is gone', 'mach']; S.card2 = ['the disk kept the WAL', 'acc', '#301 … #304 COMMIT', 'disk']; } return S; },
        data: () => '<li>Lost: table and WAL that were in memory.</li><li>On disk: WAL #301…#304 (with COMMIT) and the table file (lena 150, irmao 20).</li>' },
      { title: 'Back up: WAL replay', dur: 4.4,
        story: 'The power returns. The database sees it did not shut down cleanly and runs recovery: it opens the table file (still 150 and 20) and redoes, one by one, the WAL changes that have a COMMIT (redo). T1 has one: Lena goes back to 50 and her brother to 120. Only after that does it accept connections.',
        look: 'The drawers light up with the old values from the file (150, 20). The light leaves the disk and the drawers turn to 50 and 120.',
        key: 'WAL replay: the log on disk rebuilds what memory lost.',
        sql: { who: 'the database itself, on startup', code: '-- automatic recovery on startup', out: RECOV + '\nLOG:  redo starts at #302 · redo done at #304\nLOG:  database system is ready to accept connections' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.fly = []; S.power = t < 1.0 ? 'boot' : 'on';
          S.cl.lena = ['R$ 50', '✓ transfer done', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 from Lena', 'ok'];
          S.rows = t < 3.0 ? { lena: [150, 'old', 'from the old file'], irmao: [20, 'old', 'from the old file'] } : { lena: [50, 'hot', 'redone from the WAL'], irmao: [120, 'hot', 'redone from the WAL'] };
          addFly(S, FL('k_t', t, 1.6, 2.4), FL('k_t', t, 2.2, 3.0));
          if (t >= 1.2 && t < 3.0) S.card = ['redo: #302 and #303', 'acc', 'T1 has a COMMIT (#304), so it counts', 'disk'];
          if (t >= 3.0) S.card = ['lena 50 · irmao 120 are back', 'acc', 'nothing was lost', 'table']; return S; },
        data: () => '<li>Starting point: table file (lena 150, irmao 20).</li><li>Redo: #302 UPDATE lena 150→50, #303 UPDATE irmao 20→120 (T1 has a COMMIT).</li><li>A transaction without a COMMIT in the WAL would be ignored (see scenario A).</li>' + EX },
      { title: 'Why it works', dur: 2,
        story: 'Durability is this: if the database said COMMIT, the data survives a power cut and a crash. The trick is the order: first the log goes to disk (write-ahead), then the database answers. You can trade this for speed (synchronous_commit = off): the database answers before the fsync and a crash may take the last few moments of commits.',
        look: 'The machine is back to normal; the WAL on disk has the transfer with COMMIT.',
        key: 'Durable = after COMMIT, not even a power cut erases it.',
        sql: { who: 'configuration', code: 'SHOW synchronous_commit;', out: ' on   -- off: answers before the fsync\n      -- and may lose the last commits' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.fly = []; S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n'];
          if (t > 0.3) S.card = ['durable = survives the crash', 'acc', 'writes the log first, answers after', 'disk']; return S; },
        data: () => '<li>Durability depends on the disk honoring fsync (controller cache with battery, or cache turned off).</li><li>Replicas and backups protect against losing the whole disk.</li>' + EX },
    ],
    base: [
      { title: 'One shop, three servers', dur: 2,
        story: 'Now the database is different: instead of one machine, three nodes with copies of the same data, in São Paulo (A), Rio (B) and Recife (C). Each answers on its own, without asking the others. This is the BASE style, of distributed databases that put availability first.',
        look: 'Three nodes side by side, each with Lena’s and her brother’s balance and the version (v1).',
        key: 'BASE: Basically Available, Soft state, Eventually consistent.',
        sql: { who: 'on A, B or C', code: "SELECT saldo FROM contas WHERE id = 'lena';", out: 'A: 150 · B: 150 · C: 150' },
        st: t => { const S = S0(); S.nodes = { A: [150, 20, 1, 'n'], B: [150, 20, 1, 'n'], C: [150, 20, 1, 'n'] };
          if (t > 0.4) S.card = ['3 copies of the same data', 'acc', 'A São Paulo · B Rio · C Recife', 'B']; return S; },
        data: () => '<li>Nodes A, B and C: lena 150, irmao 20, version v1.</li><li>Examples of databases in this style: Cassandra, DynamoDB.</li>' },
      { title: 'A writes and answers right away', dur: 2.4,
        story: 'Lena transfers the R$ 100 and the request lands on node A, the closest one to her. A writes right away and answers OK without waiting for B and C. Lena sees R$ 50 within a few milliseconds. This is the “basically available”: answer whenever you can.',
        look: 'The light goes from Lena’s tablet to node A, which now shows 50, 120 and v2.',
        key: 'Available first: the node answers without waiting for the others.',
        sql: { who: 'on node A', code: "UPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';", out: 'OK in ~5 ms (example) · replicas: later' },
        st: t => { const S = S0(); addFly(S, FL('l_A', t, 0.2, 1.1), FL('l_A', t, 1.3, 1.9, { back: true }));
          S.nodes = { A: t >= 1.1 ? [50, 120, 2, 'hot'] : [150, 20, 1, 'n'], B: [150, 20, 1, 'n'], C: [150, 20, 1, 'n'] };
          S.cl.lena = t >= 1.9 ? ['R$ 50', '✓ done in ~5 ms', 'ok'] : ['sending…', 'R$ 100 → brother', 'hi'];
          if (t >= 1.2) S.card = ['OK in ~5 ms', 'acc', 'A did not wait for B or C', 'A']; return S; },
        data: () => '<li>Node A: lena 50, irmao 120, <b>v2</b>.</li><li>Nodes B and C: still v1.</li>' },
      { title: 'Soft state: the copies disagree', dur: 3,
        story: 'A sends the change to B and C in the background (asynchronous replication). While it travels, the three nodes disagree: A says 120 for the brother, B and C still say 20. Nothing is broken; the state is “soft” and will change on its own.',
        look: 'Lights go from A to B and C along the arcs, slowly. B and C show v1 in amber.',
        key: 'Soft state: a node’s value can change without anyone writing to it.',
        sql: { who: 'node A, in the background', code: '-- asynchronous replication: A → B, A → C', out: 'B: v1 · C: v1   (delay of ms to seconds)' },
        st: t => { const S = S0(); addFly(S, { p: 'A_B', f: 0.15 + 0.35 * ph(t, 0, 3) }, { p: 'A_C', f: 0.1 + 0.25 * ph(t, 0, 3) });
          S.nodes = { A: [50, 120, 2, 'n'], B: [150, 20, 1, 'old', 'replica on its way…'], C: [150, 20, 1, 'old', 'replica on its way…'] };
          S.cl.lena = ['R$ 50', '✓ done', 'ok'];
          if (t >= 0.5) S.card = ['B and C still on v1', 'acc', 'the change is on its way', 'B']; return S; },
        data: () => '<li>A: v2 (lena 50, irmao 120).</li><li>B and C: v1 (lena 150, irmao 20).</li>' },
      { title: 'The brother checks the balance… on node C', dur: 2.6,
        story: 'The brother, in Recife, opens the app. The read goes to node C, the closest to him. C answers right away, but with what it has: R$ 20. The transfer was already accepted, it just has not arrived there yet. This is a stale read.',
        look: 'The light goes from the brother’s tablet to node C and back with R$ 20. The brother’s screen turns red.',
        key: 'Always available, but sometimes with a stale value.',
        sql: { who: 'brother’s app, on node C', code: "SELECT saldo FROM contas WHERE id = 'irmao';", out: '20   -- node A already says 120' },
        st: t => { const S = S0(); addFly(S, FL('i_C', t, 0.2, 1.1), FL('i_C', t, 1.1, 2.0, { back: true }), { p: 'A_B', f: 0.5 + 0.15 * ph(t, 0, 2.6) }, { p: 'A_C', f: 0.35 + 0.1 * ph(t, 0, 2.6) });
          S.nodes = { A: [50, 120, 2, 'n'], B: [150, 20, 1, 'old'], C: [150, 20, 1, t >= 1.1 ? 'stale' : 'old', 'read here: 20'] };
          S.cl.lena = ['R$ 50', '✓ done', 'ok']; S.cl.irmao = t >= 2.0 ? ['R$ 20', 'where is my R$ 100?', 'bad'] : ['opening…', 'reading from node C', 'hi'];
          if (t >= 1.1) S.card = ['C answered: irmao = 20', 'bad', 'stale read', 'C']; return S; },
        data: () => '<li>Read on C: <b>20</b> (v1).</li><li>On A, the same data is already <b>120</b> (v2).</li>' },
      { title: 'Convergence', dur: 3.6,
        story: 'The replica arrives: first at B, then at C. All three now show Lena 50 and brother 120, version v2. Nobody had to do anything: with no new writes, the copies converge. The brother refreshes the app and sees R$ 120.',
        look: 'The lights finish the trip; B and C light up with v2. The brother’s screen turns green.',
        key: 'Eventual consistency: with no new writes, all nodes end up the same.',
        sql: { who: 'brother’s app, on node C', code: "SELECT saldo FROM contas WHERE id = 'irmao';", out: '120' },
        st: t => { const S = S0(); addFly(S, FL('A_B', t, 0, 0.8, {}), FL('A_C', t, 0, 1.4, {}), FL('i_C', t, 2.0, 2.6), FL('i_C', t, 2.6, 3.2, { back: true }));
          for (const f of S.fly) if (f.p === 'A_B' || f.p === 'A_C') f.f = (f.p === 'A_B' ? 0.65 : 0.45) + (1 - (f.p === 'A_B' ? 0.65 : 0.45)) * f.f;
          S.nodes = { A: [50, 120, 2, 'n'], B: t >= 0.8 ? [50, 120, 2, t < 2.6 ? 'hot' : 'n'] : [150, 20, 1, 'old'], C: t >= 1.4 ? [50, 120, 2, t < 2.6 ? 'hot' : 'n'] : [150, 20, 1, 'old'] };
          S.cl.lena = ['R$ 50', '✓ done', 'ok']; S.cl.irmao = t >= 3.2 ? ['R$ 120', '+ R$ 100 from Lena', 'ok'] : ['R$ 20', 'where is my R$ 100?', 'bad'];
          if (t >= 1.5) S.card = ['A, B and C: v2', 'acc', 'converged', 'B']; return S; },
        data: () => '<li>A, B and C: lena 50, irmao 120, v2.</li><li>How long it takes depends on the network and the load: from milliseconds to seconds.</li>' },
      { title: 'ACID vs BASE', dur: 2,
        story: 'Both store the same transfer, with different promises. ACID: whoever reads always sees the committed value, but sometimes has to wait for a lock or gets an error. BASE: always answers fast, on any node, but may show a stale balance for a while. For money, almost always ACID; for carts, likes and catalogs, BASE usually does the job.',
        look: 'The three nodes are equal again. In the panel, the table compares the two models.',
        key: 'ACID chooses to be right; BASE chooses to be available and gets it right later.',
        sql: { who: 'comparison', code: '-- ACID: COMMIT only when it is safe and consistent\n-- BASE: OK right away; the copies sort it out later', out: '' },
        st: t => { const S = S0(); S.nodes = { A: [50, 120, 2, 'n'], B: [50, 120, 2, 'n'], C: [50, 120, 2, 'n'] };
          S.cl.lena = ['R$ 50', '✓ done', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 from Lena', 'ok'];
          if (t > 0.3) S.card = ['always answers · sometimes stale', 'acc', 'ACID: always right · sometimes waits', 'B']; return S; },
        data: () => '<table class="s3-tab"><tr><th></th><th>ACID</th><th>BASE</th></tr><tr><td>read</td><td>always the committed value</td><td>may come back stale</td></tr><tr><td>write</td><td>waits for lock and fsync</td><td>OK right away, on one node</td></tr><tr><td>failure</td><td>refuses or waits</td><td>keeps answering</td></tr><tr><td>good for</td><td>balance, stock, orders</td><td>cart, feed, catalog</td></tr></table>' + EX },
    ],
  };

  let sc = 'a', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-acid3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  { const m = new URLSearchParams(location.search).get('mode'); if (SC.includes(m)) sc = m; }
  const ids = () => STEPS[sc], N = () => ids().length, cur = () => ids()[step];
  const DUR = () => cur().dur || 3;

  // ── painel ──
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cmdHtml = c => `<div class="s3-cmd"><b>SQL command</b><i>${esc(c.who)}</i><code>${esc(c.code)}</code>${c.out ? `<span>→ ${esc(c.out)}</span>` : ''}</div>`;
  const RN = { lena: 'lena', irmao: 'irmao', imob: 'imobiliaria' };
  function nowHtml() {
    const S = cur().st(lt);
    let tab;
    if (S.nodes) tab = `<table class="s3-tab"><tr><th>node</th><th>lena</th><th>irmao</th><th>version</th></tr>${['A', 'B', 'C'].map(k => { const n = S.nodes[k]; return `<tr class="${n[3] === 'old' || n[3] === 'stale' ? '' : 'on'}"><td>${k} · ${NCITY[k]}</td><td>${n[0]}</td><td>${n[1]}</td><td>v${n[2]}</td></tr>`; }).join('')}</table>`;
    else { const off = S.power !== 'on';
      tab = `<table class="s3-tab"><tr><th>contas.id</th><th>balance others see</th></tr>${Object.entries(S.rows).map(([k, r]) => `<tr class="${r[1] === 'n' ? '' : 'on'}"><td>'${RN[k]}'</td><td>${off ? '— (server off)' : r[0]}${r[2] && !off ? ' · ' + r[2] : ''}</td></tr>`).join('')}</table>`; }
    return tab + cur().data();
  }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map(v => `<button data-sc="${v}" title="${SCTIP[v]}" aria-label="${SCTIP[v]}" aria-pressed="${v === sc}">${SCBTN[v]}</button>`).join('')}</div>
      ${cmdHtml(s.sql)}
      <h2>${s.title}</h2>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="acidnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'acid') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · R$ 100 transfer`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'acid' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    const back = document.querySelector('.o3-back'); if (back) back.setAttribute('href', '../#' + LESSON[sc]);
    readout();
  }
  function applyVis() { GRP.acid.visible = sc !== 'base'; GRP.base.visible = sc === 'base'; CL.aux.g.visible = sc === 'i'; ROW.imob.g.visible = sc === 'i'; }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; keys.clear(); render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { if (!SC.includes(v)) return false; sc = v; try { localStorage.setItem('sdlabs-acid3d-sc', v); } catch (e) {} applyVis(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'acid') setSc(b.dataset.sc); });
  const goId = () => next();

  // ── telas ──
  const keys = new Map();
  const colors = () => { const C = pal3(), A_ = '#' + accent.getHexString(); return { C, A_, acc: theme === 'light' ? C.hi : A_ }; };
  const TC = tone => { const { C, acc } = colors(); const light = theme === 'light';
    return tone === 'acc' || tone === 'hot' || tone === 'lock' ? acc : tone === 'bad' || tone === 'stale' ? '#ff5a4a' : tone === 'ok' ? (light ? '#1c7f45' : '#34d27b')
      : tone === 'old' ? (light ? '#8a5a00' : '#ffb02e') : tone === 'dim' || tone === 'off' ? C.ink : C.inkHi; };
  const bgFill = (cv, col) => { const { x } = cv; x.clearRect(0, 0, cv.c.width, cv.c.height); x.fillStyle = col || (theme === 'light' ? '#f6f6f5' : '#141516'); x.fillRect(0, 0, cv.c.width, cv.c.height); };
  const once = (k, v) => { const key = JSON.stringify(v) + theme + accent.getHex(); if (keys.get(k) === key) return false; keys.set(k, key); return true; };
  const OFFBG = () => theme === 'light' ? '#cfd0d0' : '#070808';
  const money = v => 'R$ ' + v;

  function drawClient(k, c) {
    if (!once('cl' + k, c)) return;
    const cv = CL[k].scr, { x, P } = cv, { C } = colors(), u = v => v * P;
    bgFill(cv, c[2] === 'ok' || c[2] === 'hi' ? C.glassOn : null); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.ink; x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText({ lena: 'LENA · bank app', irmao: 'BROTHER · bank app', aux: 'AUTO DEBIT' }[k], u(5), u(8));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(5), u(14)); x.lineTo(u(95), u(14)); x.stroke();
    x.fillStyle = TC(c[2] === 'hi' ? 'hi' : c[2]); x.font = `600 ${u(c[0].length > 9 ? 12 : 16)}px ${MONO3}`; x.fillText(c[0], u(5), u(29));
    x.fillStyle = c[2] === 'bad' || c[2] === 'ok' ? TC(c[2]) : C.ink; x.font = `${u(c[1].length > 22 ? 5.6 : 6.6)}px ${MONO3}`; x.fillText(c[1], u(5), u(45));
    cv.tex.needsUpdate = true;
  }
  function drawRow(k, r, power) {
    if (!once('row' + k, [r, power])) return;
    const cv = ROW[k].scr, { x, P } = cv, { C } = colors(), u = v => v * P, hot = r[1] !== 'n';
    if (power === 'off') { bgFill(cv, OFFBG()); cv.tex.needsUpdate = true; return; }
    bgFill(cv, hot ? C.glassOn : null); x.textBaseline = 'middle';
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText({ lena: 'lena', irmao: 'irmao', imob: 'agency' }[k], u(6), u(11.5));
    const col = power === 'boot' ? C.ink : TC(hot ? r[1] : 'hi');
    if (r[2] && power === 'on') { x.textAlign = 'center'; x.fillStyle = r[1] === 'n' ? C.ink : col; x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText(r[2], u(118), u(11.5)); }
    x.textAlign = 'right'; x.fillStyle = col; x.font = `600 ${u(17)}px ${MONO3}`; x.fillText(power === 'boot' ? '…' : money(r[0]), u(233), u(12));
    if (r[1] === 'lock') { x.strokeStyle = col; x.lineWidth = u(1.2); x.strokeRect(u(0.8), u(0.8), u(236.4), u(20.4)); }
    cv.tex.needsUpdate = true;
  }
  function drawTabHead(power) {
    if (!once('th', power)) return;
    const cv = tabHead, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('TABLE contas', u(4), u(8));
    x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `${u(5.4)}px ${MONO3}`; x.fillText(power === 'off' ? 'no power' : 'what others see (committed)', u(242), u(8.5));
    cv.tex.needsUpdate = true;
  }
  function drawGate(g, power) {
    if (!once('gate', [g, power])) return;
    const cv = gateFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, power === 'off' ? OFFBG() : null);
    if (power !== 'off') { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = g === 'bad' ? '#ff5a4a' : g === 'idle' ? C.ink : TC(g === 'ok' ? 'ok' : 'acc');
      x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText(g === 'bad' ? '✕ RULE: CHECK (saldo >= 0)' : g === 'ok' ? '✓ RULE: CHECK (saldo >= 0)' : 'RULE: CHECK (saldo >= 0)', u(123), u(5.2)); }
    cv.tex.needsUpdate = true;
  }
  function drawDraft(d, power) {
    if (!once('draft', [d, power])) return;
    const cv = draftScr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, power === 'off' ? OFFBG() : C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = power === 'off' ? C.ink : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('DRAFT (memory)', u(4), u(7.5));
    x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('invisible to others', u(246), u(7.8)); x.textAlign = 'left';
    if (power === 'off') { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(12)}px ${MONO3}`; x.fillText('✕ memory wiped', u(8), u(46)); cv.tex.needsUpdate = true; return; }
    if (!d) { x.fillStyle = C.ink; x.font = `${u(9)}px ${MONO3}`; x.fillText('(no open transaction)', u(8), u(46)); cv.tex.needsUpdate = true; return; }
    const two = d.length > 1, cw = two ? 123 : 246;
    d.forEach((col, i) => { const x0 = 4 + i * cw;
      x.beginPath(); x.roundRect(u(x0), u(14), u(cw - 6), u(78), u(3)); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fill(); x.strokeStyle = C.line; x.lineWidth = u(0.4); x.stroke();
      x.fillStyle = TC('acc'); x.font = `600 ${u(two ? 7.4 : 8.6)}px ${MONO3}`; x.fillText(col.t, u(x0 + 4), u(22));
      col.lines.forEach(([txt, tone], j) => { x.fillStyle = TC(tone); x.font = `${tone === 'dim' ? '' : '600 '}${u(two ? (txt.length > 18 ? 7 : 8) : 11)}px ${MONO3}`; x.fillText(txt, u(x0 + 5), u(35 + j * (two ? 12.5 : 14))); }); });
    cv.tex.needsUpdate = true;
  }
  function drawBelt(wal, power) {
    const q = wal.map(e => [e[0], e[1], e[2], Math.round(e[3] * 12) / 12]);
    if (!once('belt', [q, power])) return;
    const cv = beltScr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, power === 'off' ? OFFBG() : C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); for (let y = 16; y < 212; y += 8) { x.beginPath(); x.moveTo(u(2), u(y)); x.lineTo(u(100), u(y)); x.stroke(); }
    x.fillStyle = power === 'off' ? C.ink : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('WAL ↑ disk', u(51), u(7.5));
    x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('enters here ↑', u(51), u(215));
    if (power === 'off') { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('✕ buffer wiped', u(51), u(110)); cv.tex.needsUpdate = true; return; }
    const n = q.length, show = q.slice(-6);
    show.forEach((e, i) => { const k = show.length - 1 - i, f = e[3], y0 = 178 - k * 30 + (1 - f) * 22;
      const tone = e[2], col = tone === 'bad' ? '#ff5a4a' : tone === 'hot' ? TC('acc') : tone === 'disk' ? TC('acc') : C.inkHi;
      x.globalAlpha = Math.min(1, f * 1.6);
      x.beginPath(); x.roundRect(u(5), u(y0), u(92), u(26), u(2.5)); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#17181a'; x.fill();
      if (tone === 'mem' || tone === 'hot') x.setLineDash([u(1.6), u(1.1)]); x.strokeStyle = tone === 'mem' ? C.line : col; x.lineWidth = u(tone === 'mem' ? 0.5 : 0.9); x.stroke(); x.setLineDash([]);
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText(e[0], u(9), u(y0 + 7));
      x.textAlign = 'right'; x.fillStyle = tone === 'mem' || tone === 'hot' ? C.ink : col; x.font = `${u(5.6)}px ${MONO3}`; x.fillText(tone === 'disk' ? '✓ disk' : tone === 'bad' ? 'no effect' : 'memory', u(93), u(y0 + 7));
      x.textAlign = 'left'; x.fillStyle = col; x.font = `600 ${u(e[1].length > 17 ? 7.2 : 8.2)}px ${MONO3}`; x.fillText(e[1], u(8), u(y0 + 18.5));
      x.globalAlpha = 1; });
    if (n > 6) { x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.textAlign = 'center'; x.fillText('…', u(51), u(14)); }
    cv.tex.needsUpdate = true;
  }
  function drawDisk(d, power) {
    if (!once('disk', [d, power])) return;
    const cv = diskScr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8.4)}px ${MONO3}`; x.fillText('DISCO · SSD', u(4), u(7.5));
    x.fillStyle = TC('acc'); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('pg_wal/ (the log)', u(4), u(18));
    const W4 = d.wal.slice(-4);
    if (!W4.length) { x.fillStyle = C.ink; x.font = `${u(5.4)}px ${MONO3}`; x.fillText('(nothing new)', u(6), u(28)); }
    W4.forEach(([txt, tone], i) => { x.fillStyle = TC(tone); x.font = `${tone === 'hi' ? '' : '600 '}${u(7.2)}px ${MONO3}`; x.fillText(txt, u(6), u(28 + i * 10)); });
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(70)); x.lineTo(u(116), u(70)); x.stroke();
    x.fillStyle = C.ink; x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('base/ (the table)', u(4), u(79));
    const [a, b] = d.tab.split(' (');
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(a, u(6), u(89));
    if (b) { x.fillStyle = TC('old'); x.font = `${u(5.8)}px ${MONO3}`; x.fillText('(' + b, u(6), u(99)); }
    cv.tex.needsUpdate = true;
  }
  function drawDiskFront(d, power) {
    if (!once('dfr', [d.st, power])) return;
    const cv = diskFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('DISK', u(4), u(8));
    x.fillStyle = power === 'off' ? C.ink : TC(d.st[1]); x.font = `600 ${u(6.4)}px ${MONO3}`; x.fillText(power === 'off' ? 'off · data kept' : d.st[0], u(4), u(20));
    cv.tex.needsUpdate = true;
  }
  function drawMach(power, front) {
    if (!once('mach', [power, front])) return;
    const cv = machFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('DATABASE SERVER', u(4), u(6.5));
    x.fillStyle = power === 'off' ? '#ff5a4a' : power === 'boot' ? TC('old') : TC('ok'); x.font = `600 ${u(6)}px ${MONO3}`;
    x.fillText(power === 'off' ? '✕ no power' : power === 'boot' ? '↻ recovering' : '● on', u(4), u(14.5));
    if (front && power === 'on') { let cx = 82; front.forEach(([txt, tone], i) => { x.font = `600 ${u(6)}px ${MONO3}`; const w = x.measureText((i + 1) + ' ' + txt).width / P + 6;
        x.beginPath(); x.roundRect(u(cx), u(3), u(w), u(14), u(2)); x.strokeStyle = tone === 'off' ? C.detail : TC(tone); x.lineWidth = u(tone === 'off' ? 0.4 : 0.8); x.stroke();
        x.fillStyle = tone === 'off' ? C.detail : TC(tone); x.fillText((i + 1) + ' ' + txt, u(cx + 3), u(10.2)); cx += w + 3; }); }
    cv.tex.needsUpdate = true;
  }
  function drawNode(k, n) {
    if (!once('node' + k, n)) return;
    const cv = NODE[k].scr, { x, P } = cv, { C } = colors(), u = v => v * P, tone = n[3];
    bgFill(cv, tone === 'hot' ? C.glassOn : null); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('NODE ' + k + ' · ' + NCITY[k], u(5), u(9));
    const vc = tone === 'old' || tone === 'stale' ? TC('old') : TC('acc');
    x.textAlign = 'right'; x.beginPath(); x.roundRect(u(118), u(3), u(22), u(12), u(2)); x.strokeStyle = vc; x.lineWidth = u(0.8); x.stroke();
    x.fillStyle = vc; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('v' + n[2], u(136), u(9.4));
    [['lena', n[0]], ['irmao', n[1]]].forEach(([nm, v], i) => { const y = 34 + i * 34;
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(nm, u(6), u(y));
      x.textAlign = 'right'; x.fillStyle = tone === 'stale' && i === 1 ? '#ff5a4a' : tone === 'old' || tone === 'stale' ? TC('old') : tone === 'hot' ? TC('acc') : C.inkHi;
      x.font = `600 ${u(17)}px ${MONO3}`; x.fillText(money(v), u(138), u(y)); });
    if (n[4]) { x.textAlign = 'left'; x.fillStyle = tone === 'stale' ? '#ff5a4a' : TC('old'); x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(n[4], u(6), u(112)); }
    cv.tex.needsUpdate = true;
  }
  function drawNodeFront(k) {
    if (!once('nf' + k, 1)) return;
    const cv = NODE[k].fr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText('NODE ' + k, u(5), u(9));
    x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText(NCITY[k] + ' · answers on its own', u(5), u(19));
    cv.tex.needsUpdate = true;
  }

  // ── um quadro da cena ──
  const AT = { table: [235, 40, 52, 40], draft: [300, 230, 40, 40], gate: [300, 150, 52, 30], belt: [491, 150, 45, 50], disk: [590, 12, 62, 45], mach: [250, 272, 34, 40],
    lena: [78, 65, 16, 32], irmao: [78, 151, 16, 32], aux: [78, 237, 16, 32], A: [250, 140, 48, 50], B: [440, 70, 48, 70], C: [610, 262, 10, 30], ghost: [330, 292, 5, 30] };
  const at = k => { const a = AT[k]; return [a[0], a[1], a[2] + a[3] * ZC]; };
  const placeDot = (d, p, k) => { d.g.visible = true; d.g.position.copy(W(...p)); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); };
  const hideDot = d => { d.g.visible = false; d.glow.material.uniforms.intensity.value = 0; };
  const red = new THREE.Color(0xff4d3d);
  function scene3() {
    { const base = VIEW.dist * Math.max(1, 1.45 / persp.aspect), z = camera === persp ? camera.position.distanceTo(controls.target) / base : 1 / (ortho.zoom || 1);
      const nz = Math.max(0.35, Math.min(1.6, z)); if (Math.abs(nz - ZC) > 0.002) { ZC = nz; tags.forEach(t => t.w0 && t.sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1)); } }
    litMat.resolution.copy(accentLineMat.resolution);
    const S = cur().st(lt), t = lt, pw = S.power, blink = Math.sin(t * 7) > 0;
    // clientes
    for (const k of ['lena', 'irmao', 'aux']) { const c = S.cl[k]; if (!c) continue; drawClient(k, c);
      CL[k].cap.emissive.copy(c[2] === 'bad' ? red : accent); CL[k].cap.emissiveIntensity = c[2] === 'hi' ? 0.45 : c[2] === 'bad' ? 0.6 : c[2] === 'ok' ? 0.25 : 0; }
    if (sc !== 'base') {
      for (const k of ROWK) { const r = S.rows[k]; if (!r) continue; drawRow(k, r, pw);
        const hot = pw === 'on' && r[1] !== 'n', want = hot ? 9 : 0, R = ROW[k]; R.lift += (want - R.lift) * 0.15; R.g.position.copy(W(0, 0, R.lift));
        R.cap.emissive.copy(r[1] === 'bad' ? red : accent); R.cap.emissiveIntensity = pw !== 'on' ? 0 : hot ? (r[1] === 'bad' ? 0.55 + 0.25 * Math.sin(t * 5) : 0.5) : 0.08; }
      drawTabHead(pw); drawGate(S.gate, pw); drawDraft(S.draft, pw); drawBelt(S.wal, pw); drawDisk(S.disk, pw); drawDiskFront(S.disk, pw); drawMach(pw, S.front);
      gateCap.emissive.copy(S.gate === 'bad' ? red : accent);
      gateCap.emissiveIntensity = pw !== 'on' ? 0 : S.gate === 'bad' ? (blink ? 1 : 0.3) : S.gate === 'check' ? 0.35 : S.gate === 'ok' ? 0.8 : 0.06;
      diskCap.emissiveIntensity = S.fly.some(f => f.p === 'w_k' || f.p === 'k_t') ? 0.8 : S.disk.wal.length ? 0.25 : 0.05;
      machLed.material = pw === 'on' ? ledOnMat : pw === 'boot' ? (blink ? ledOnMat : ledOffMat) : ledOffMat;
      diskLed.material = pw === 'off' ? ledOffMat : S.fly.some(f => f.p === 'w_k') && blink ? ledOffMat : ledOnMat;
    } else {
      for (const k of ['A', 'B', 'C']) { const n = S.nodes[k]; drawNode(k, n); drawNodeFront(k);
        NODE[k].cap.emissive.copy(n[3] === 'stale' ? red : accent);
        NODE[k].cap.emissiveIntensity = n[3] === 'hot' ? 0.7 : n[3] === 'stale' ? 0.6 : n[3] === 'old' ? 0.08 : 0.25;
        NODE[k].led.material = n[3] === 'old' && blink ? ledOffMat : ledOnMat; }
    }
    // luzes viajando
    const lit = new Set(); let nd = 0;
    S.fly.forEach(f => { const P = PATHS[f.p]; if (!P) return; lit.add(f.p); const d = DOTS[nd++]; if (!d) return;
      d.mat.emissive.copy(f.bad ? red : accent); placeDot(d, alongPts(P.pts, P.cum, f.f), 1.3); });
    for (let i = nd; i < DOTS.length; i++) hideDot(DOTS[i]);
    for (const [k, P] of Object.entries(PATHS)) P.lit.visible = lit.has(k);
    // balões
    const show = (tg, c) => { if (!c) { tg.hide(); return; } tg.set(c[2] ? `${c[0]}\n${c[2]}` : c[0], c[1]).at(...at(c[3])); };
    show(tCard, S.card); show(tCard2, S.card2); show(tGhost, S.ghost);
  }

  // ── câmera ──
  const FOCUS = { mid: [425, 150, 60], work: [370, 150, 40], left: [265, 140, 40], right: [575, 110, 40] };
  const FOCUS_M = { mid: [410, 150, 110], work: [380, 150, 80], left: [280, 150, 80], right: [560, 120, 80] };
  const FOC = { a: ['mid', 'left', 'work', 'mid', 'mid', 'mid'], c: ['work', 'left', 'work', 'work', 'mid'], i: ['left', 'left', 'left', 'left', 'left', 'left', 'left'],
    d: ['work', 'right', 'mid', 'mid', 'mid', 'mid'], base: ['mid', 'mid', 'mid', 'mid', 'mid', 'mid'] };
  const ZM = { mid: 1, work: 0.84, left: 0.84, right: 0.84 };
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > DUR() + 3) lt = 0;
    scene3();
    if (now - nowAt > 300) { nowAt = now; const el = document.getElementById('acidnow'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), fk = FOC[sc][step] || 'mid', f = (mob ? FOCUS_M : FOCUS)[fk], z = ZM[fk], k = 1 - Math.exp(-dt / 0.6);
      const want = W(f[0] + (mob ? -10 : -215) * z, f[1] + (mob ? 0 : 45) * z, f[2] + (mob ? ZOFF() : -140) * z), dd = want.sub(controls.target).multiplyScalar(k);
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
      if (camera === persp) { const off = camera.position.clone().sub(controls.target), L0 = off.length(), base = VIEW.dist * Math.max(1, 1.45 / persp.aspect);
        off.setLength(L0 + (base * z - L0) * k); camera.position.copy(controls.target).add(off); }
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
    if (e.key >= '1' && e.key <= '5') return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); keys.clear(); });
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  const VIEW = NARROW() ? { target: W(370, 150, 110 + ZOFF()), dist: innerWidth < 640 ? 11.2 : 14 } : { target: W(165, 195, -80), dist: 15.5 };
  applyVis(); render();
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: VIEW,
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1 to 5 · drag to rotate' };
})() });
