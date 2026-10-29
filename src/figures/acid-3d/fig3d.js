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
  const SCTIP = { a: 'Atomicidade', c: 'Consistência', i: 'Isolamento', d: 'Durabilidade', base: 'BASE' };
  const SCNAME = { a: 'A · Atomicidade', c: 'C · Consistência', i: 'I · Isolamento', d: 'D · Durabilidade', base: 'BASE · vários servidores' };
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
  const S0 = () => ({ rows: { lena: [150, 'n'], irmao: [20, 'n'] }, draft: null, wal: [], disk: { wal: [], tab: 'lena 150 · irmão 20', st: ['ocioso', 'dim'] },
    power: 'on', gate: 'idle', front: null, cl: { lena: ['R$ 150', 'saldo da Lena', 'dim'], irmao: ['R$ 20', 'saldo do irmão', 'dim'] }, fly: [], card: null, card2: null, ghost: null });
  const FL = (p, t, a, b, o = {}) => { if (t < a || t >= b) return null; const f = ease(ph(t, a, b)); return { p, f: o.back ? 1 - f : f * (o.stop || 1), bad: o.bad }; };
  const addFly = (S, ...f) => f.forEach(x => x && S.fly.push(x));
  const WE = (lsn, txt, tone, t, at) => t >= at ? [[lsn, txt, tone, ph(t, at, at + 0.5)]] : [];
  // a transferência completa (BEGIN, 2 UPDATEs, COMMIT), usada em A, C e D
  function fullTx(S, t, l0, opts = {}) {
    addFly(S, FL('l_d', t, 0.2, 1.0));
    const lines = [];
    if (t >= 0.9) lines.push(['BEGIN', 'dim']);
    if (t >= 1.4) lines.push(['lena   150 → 50', t < 2.6 ? 'acc' : 'hi']);
    if (t >= 2.0) lines.push(['irmão   20 → 120', t < 2.6 ? 'acc' : 'hi']);
    if (t >= 2.6) lines.push(['COMMIT ✓', 'acc']);
    S.draft = t >= 0.9 ? [{ t: 'T1 · transferência de R$ 100', lines }] : null;
    const disk = t >= 3.6 ? 'disk' : 'mem';
    S.wal = [...WE('#' + l0, 'T1 BEGIN', disk, t, 1.0), ...WE('#' + (l0 + 1), 'UPDATE lena 150→50', disk, t, 1.5),
      ...WE('#' + (l0 + 2), 'UPDATE irmão 20→120', disk, t, 2.1), ...WE('#' + (l0 + 3), 'T1 COMMIT', disk === 'disk' ? 'disk' : 'hot', t, 2.7)];
    addFly(S, FL('d_w', t, 1.0, 1.6), FL('d_w', t, 1.5, 2.1), FL('d_w', t, 2.1, 2.7), FL('d_w', t, 2.7, 3.2), FL('w_k', t, 3.0, 3.6));
    if (t >= 3.6) { S.disk.wal = [['#' + l0 + ' T1 BEGIN', 'hi'], ['#' + (l0 + 1) + ' UPDATE lena', 'hi'], ['#' + (l0 + 2) + ' UPDATE irmão', 'hi'], ['#' + (l0 + 3) + ' T1 COMMIT ✓', 'acc']]; S.disk.st = ['fsync ✓ #' + (l0 + 3), 'acc']; }
    addFly(S, FL('d_t', t, 3.6, 4.2));
    if (t >= 4.2) { S.rows.lena = [50, t < 6 ? 'hot' : 'n']; S.rows.irmao = [120, t < 6 ? 'hot' : 'n']; S.disk.tab = 'lena 150 · irmão 20 (velho até o checkpoint)'; }
    addFly(S, FL('l_d', t, 4.2, 4.9, { back: true }));
    S.cl.lena = t >= 4.9 ? ['R$ 50', '✓ transferência feita', 'ok'] : t >= 0.2 ? ['enviando…', 'R$ 100 → irmão', 'hi'] : S.cl.lena;
    if (t >= 4.9) S.cl.irmao = ['R$ 120', '+ R$ 100 da Lena', 'ok'];
    if (!opts.noCard && t >= 4.3) S.card = ['COMMIT: as duas mudanças juntas', 'acc', 'lena 50 · irmão 120 · total R$ 170', 'table'];
    return S;
  }
  const TX_SQL = "BEGIN;\nUPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';\nCOMMIT;";
  const RECOV = 'LOG:  database system was not properly shut down;\n      automatic recovery in progress';
  const EX = '<li class="h3-dim">Valores, LSN (#101…) e tempos são exemplos didáticos. Os textos de LOG/ERROR são os do PostgreSQL.</li>';

  // ── roteiro ──
  const STEPS = {
    a: [
      { title: 'O ponto de partida', dur: 2,
        story: 'A Lena quer mandar R$ 100 para o irmão pelo app do banco. Hoje a conta dela tem R$ 150 e a dele, R$ 20: juntas, R$ 170. Para o banco, transferir são duas mudanças, tirar de uma conta e pôr na outra. O que acontece se só a primeira der certo?',
        look: 'A tabela contas está no fundo da máquina, uma gaveta por linha. Os tablets da Lena e do irmão estão à esquerda.',
        key: 'Uma transferência são duas escritas que precisam andar juntas.',
        sql: { who: 'qualquer cliente', code: 'SELECT id, saldo FROM contas;', out: ' lena  | 150\n irmao |  20' },
        st: t => { const S = S0(); S.cl.lena = ['R$ 150', 'Transferir R$ 100?', 'hi']; if (t > 0.4) S.card = ['contas: total R$ 170', 'acc', 'lena 150 + irmão 20', 'table']; return S; },
        data: () => '<li>Duas linhas na tabela <b>contas</b>: lena = 150, irmao = 20.</li><li>Regra do negócio: a soma (R$ 170) não pode mudar com uma transferência.</li>' },
      { title: 'BEGIN: abre um rascunho', dur: 2.2,
        story: 'O app manda BEGIN. A partir daqui o banco abre uma transação, a T1. Tudo o que a T1 fizer fica num rascunho dela, invisível para os outros, até o COMMIT. Cada passo também vira uma linha no WAL, o log que o banco escreve antes de mexer nos dados.',
        look: 'Uma luz sai do tablet da Lena até o RASCUNHO. A primeira linha (#101 T1 BEGIN) entra na esteira do WAL.',
        key: 'BEGIN abre a transação: daqui até o COMMIT, ou tudo ou nada.',
        sql: { who: 'app da Lena', code: 'BEGIN;', out: 'BEGIN' },
        st: t => { const S = S0(); addFly(S, FL('l_d', t, 0.2, 1.1), FL('d_w', t, 1.2, 1.7));
          if (t >= 1.1) S.draft = [{ t: 'T1 · transferência de R$ 100', lines: [['BEGIN', 'acc']] }];
          S.wal = WE('#101', 'T1 BEGIN', 'mem', t, 1.6); S.cl.lena = ['enviando…', 'R$ 100 → irmão', 'hi'];
          if (t >= 1.2) S.card = ['T1 aberta', 'acc', 'rascunho vazio, só da T1', 'draft']; return S; },
        data: () => '<li>T1 = a transação da transferência.</li><li>WAL (write-ahead log): o banco anota a mudança no log <b>antes</b> de mexer nos dados.</li>' },
      { title: 'Tira R$ 100 da Lena… só no rascunho', dur: 3.2,
        story: 'O primeiro UPDATE tira R$ 100 da Lena: no rascunho da T1, ela fica com R$ 50. Repare no que isso seria se valesse agora: Lena 50, irmão 20, total R$ 70. Cem reais sumidos. Esse estado pela metade existe só dentro da T1; quem consulta a tabela continua vendo 150.',
        look: 'O rascunho mostra lena 150 → 50, mas a gaveta da Lena na tabela segue com R$ 150. O WAL é gravado no disco aos poucos.',
        key: 'O estado pela metade fica preso no rascunho: ninguém de fora o enxerga.',
        sql: { who: 'app da Lena', code: "UPDATE contas SET saldo = saldo - 100\n WHERE id = 'lena';", out: 'UPDATE 1   (ainda sem COMMIT)' },
        st: t => { const S = S0(); addFly(S, FL('l_d', t, 0.1, 0.8), FL('d_w', t, 1.0, 1.5), FL('w_k', t, 2.0, 2.6));
          S.draft = [{ t: 'T1 · transferência de R$ 100', lines: [['BEGIN', 'dim'], ...(t >= 0.8 ? [['lena   150 → 50', 'acc']] : [])] }];
          const dk = t >= 2.6 ? 'disk' : 'mem'; S.wal = [['#101', 'T1 BEGIN', dk, 1], ...WE('#102', 'UPDATE lena 150→50', dk, t, 1.4)];
          if (t >= 2.6) { S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi']]; S.disk.st = ['WAL gravado', 'dim']; }
          S.rows.lena = [150, 'n', 'os outros ainda veem 150']; S.cl.lena = ['enviando…', 'R$ 100 → irmão', 'hi'];
          if (t >= 1.2) S.ghost = ['pela metade: lena 50 · irmão 20', 'bad', 'total R$ 70: R$ 100 sumidos\nsó existe dentro da T1', 'ghost'];
          return S; },
        data: () => '<li>No rascunho da T1: lena = <b>50</b>, irmao = 20.</li><li>Para os outros: lena = <b>150</b>, irmao = 20 (o que foi confirmado).</li><li>No WAL: #101 BEGIN, #102 UPDATE lena 150→50. Ainda <b>não</b> há COMMIT.</li>' },
      { title: 'O servidor cai antes de creditar o irmão', dur: 2.6,
        story: 'Antes do segundo UPDATE chegar, o servidor cai. Tudo o que estava na memória some: o rascunho da T1 vai junto. O app da Lena recebe um erro de conexão. Se o banco gravasse cada UPDATE direto na tabela, agora a conta teria R$ 70 no total.',
        look: 'As telas da máquina apagam e o rascunho some. O disco, à direita, guarda as linhas #101 e #102 do WAL.',
        key: 'Falha no meio da transação é o caso que a atomicidade existe para cobrir.',
        sql: { who: 'app da Lena', code: "UPDATE contas SET saldo = saldo + 100\n WHERE id = 'irmao';   -- nunca chegou", out: 'server closed the connection unexpectedly' },
        st: t => { const S = S0(); const off = t >= 0.8;
          S.draft = off ? null : [{ t: 'T1 · transferência de R$ 100', lines: [['BEGIN', 'dim'], ['lena   150 → 50', 'acc']] }];
          S.wal = [['#101', 'T1 BEGIN', 'disk', 1], ['#102', 'UPDATE lena 150→50', 'disk', 1]];
          S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi']]; S.power = off ? 'off' : 'on';
          S.cl.lena = t >= 1.1 ? ['erro', 'conexão perdida', 'bad'] : ['enviando…', 'R$ 100 → irmão', 'hi'];
          if (off) { S.card = ['✕ o servidor caiu', 'bad', 'antes do UPDATE do irmão', 'mach']; S.card2 = ['o disco guarda o WAL', 'acc', '#101 BEGIN · #102 UPDATE', 'disk']; }
          return S; },
        data: () => '<li>Perdido (memória): o rascunho da T1.</li><li>Guardado (disco): WAL #101 e #102, e o arquivo da tabela com lena 150, irmão 20.</li><li>Falta no WAL: o COMMIT da T1.</li>' },
      { title: 'Religou: a T1 é desfeita (ROLLBACK)', dur: 4,
        story: 'O servidor volta e, antes de aceitar conexões, faz a recuperação: lê o WAL do disco. A T1 tem BEGIN e UPDATE, mas não tem COMMIT. Então ela não vale: o banco descarta o débito, como num ROLLBACK. A Lena continua com R$ 150 e o irmão com R$ 20.',
        look: 'A luz sai do disco até a tabela. No WAL entra #103 T1 ABORT, em vermelho. As gavetas seguem com 150 e 20.',
        key: 'Sem COMMIT, nada vale: atomicidade é tudo ou nada.',
        sql: { who: 'o próprio banco, ao ligar', code: '-- recuperação automática (ninguém digita nada)\n-- T1: BEGIN e UPDATE no WAL, sem COMMIT → desfeita', out: RECOV + '\nLOG:  database system is ready to accept connections' },
        st: t => { const S = S0(); S.power = t < 1.2 ? 'boot' : 'on';
          S.wal = [['#101', 'T1 BEGIN', 'disk', 1], ['#102', 'UPDATE lena 150→50', 'disk', 1], ...WE('#103', 'T1 ABORT', 'bad', t, 2.6)];
          S.disk.wal = [['#101 T1 BEGIN', 'hi'], ['#102 UPDATE lena', 'hi'], ...(t >= 2.6 ? [['#103 T1 ABORT', 'bad']] : [])];
          addFly(S, FL('k_t', t, 1.2, 2.4));
          if (t >= 1.2 && t < 2.6) S.card = ['recuperação lê o WAL', 'acc', '#101 BEGIN · #102 UPDATE · sem COMMIT', 'disk'];
          if (t >= 2.6) { S.card = ['T1 desfeita (ROLLBACK)', 'acc', 'lena 150 · irmão 20 · total R$ 170', 'table'];
            S.ghost = ['o estado pela metade nunca apareceu', 'dim', 'ninguém leu lena 50 com irmão 20', 'ghost'];
            S.cl.lena = ['R$ 150', 'não foi: tente de novo', 'hi']; } else S.cl.lena = ['erro', 'conexão perdida', 'bad'];
          return S; },
        data: () => '<li>WAL lido: #101 BEGIN, #102 UPDATE lena, <b>nenhum COMMIT</b> da T1.</li><li>Decisão: T1 abortada. lena = 150, irmao = 20.</li><li>No PostgreSQL, mudanças de transação sem COMMIT ficam invisíveis para sempre; o efeito é o de um ROLLBACK.</li>' + EX },
      { title: 'De novo, agora até o fim: tudo', dur: 6,
        story: 'A Lena tenta outra vez. BEGIN, tira R$ 100 dela, põe R$ 100 no irmão, COMMIT. Só no COMMIT as duas mudanças saem do rascunho e entram na tabela, juntas: Lena 50, irmão 120. O total continua R$ 170.',
        look: 'O rascunho enche linha por linha; no COMMIT, a luz desce para a tabela e as duas gavetas mudam ao mesmo tempo.',
        key: 'Atomicidade: as duas escritas valem juntas (COMMIT) ou nenhuma vale (ROLLBACK).',
        sql: { who: 'app da Lena', code: TX_SQL, out: 'COMMIT' },
        st: t => fullTx(S0(), t, 104),
        data: () => '<li>WAL: #104 BEGIN, #105 UPDATE lena, #106 UPDATE irmão, #107 COMMIT.</li><li>Antes: 150 + 20 = 170. Depois: 50 + 120 = 170.</li><li>Nenhum instante com só uma das duas mudanças visível.</li>' + EX },
    ],
    c: [
      { title: 'A regra mora no banco', dur: 2,
        story: 'Quem criou a tabela contas pôs nela uma regra: nenhum saldo pode ficar negativo. Ela está escrita no próprio banco (uma restrição CHECK), então vale para todo app, script ou pessoa que tentar escrever.',
        look: 'A barra entre o rascunho e a tabela é a REGRA. Toda linha nova passa por ela antes de entrar.',
        key: 'Consistência: o banco só aceita estados que cumprem as regras declaradas.',
        sql: { who: 'quem criou a tabela', code: 'CREATE TABLE contas (\n  id    text PRIMARY KEY,\n  saldo numeric NOT NULL CHECK (saldo >= 0)\n);', out: 'CREATE TABLE' },
        st: t => { const S = S0(); S.gate = 'check'; S.cl.lena = ['R$ 150', 'Transferir R$ 200?', 'hi']; if (t > 0.4) S.card = ['CHECK (saldo >= 0)', 'acc', 'nenhum saldo pode ficar negativo', 'gate']; return S; },
        data: () => '<li>Regras que o banco garante: CHECK, NOT NULL, PRIMARY KEY, UNIQUE, FOREIGN KEY e o tipo de cada coluna.</li><li>Aqui: <b>saldo >= 0</b>.</li>' },
      { title: 'A Lena pede R$ 200', dur: 2.6,
        story: 'A Lena erra o valor e pede R$ 200 em vez de 100. O app abre a transação e manda o UPDATE. No rascunho, a conta dá 150 − 200 = −50. Antes de a linha valer, o banco confere as regras.',
        look: 'O rascunho mostra lena 150 − 200 = −50, ainda sem passar pela barra da regra.',
        key: 'Toda escrita é conferida contra as regras, não só as "suspeitas".',
        sql: { who: 'app da Lena', code: "BEGIN;\nUPDATE contas SET saldo = saldo - 200\n WHERE id = 'lena';", out: '(o banco confere a linha nova: saldo = -50)' },
        st: t => { const S = S0(); S.gate = 'check'; addFly(S, FL('l_d', t, 0.2, 1.0));
          if (t >= 1.0) S.draft = [{ t: 'T1 · transferência de R$ 200', lines: [['BEGIN', 'dim'], ...(t >= 1.4 ? [['lena   150 − 200 = −50', 'acc']] : [])] }];
          S.wal = WE('#201', 'T1 BEGIN', 'mem', t, 1.1); S.cl.lena = ['enviando…', 'R$ 200 → irmão', 'hi'];
          if (t >= 1.6) S.card = ['saldo novo: −50', 'acc', 'vai passar pela regra', 'draft']; return S; },
        data: () => '<li>Linha nova proposta: lena = <b>−50</b>.</li><li>Regra: saldo >= 0.</li>' },
      { title: 'A regra barra', dur: 2.4,
        story: 'A linha nova teria saldo −50, e a regra diz saldo >= 0. O banco recusa o UPDATE com um erro. Nada passa pela barra: a gaveta da Lena continua com R$ 150.',
        look: 'A luz sai do rascunho, bate na barra da regra e para. A barra pisca em vermelho.',
        key: 'Uma escrita que quebra a regra nunca chega à tabela.',
        sql: { who: 'resposta do banco', code: "-- a linha nova teria saldo = -50", out: 'ERROR:  new row for relation "contas" violates\n        check constraint "contas_saldo_check"' },
        st: t => { const S = S0(); addFly(S, FL('d_g', t, 0.2, 1.0, { stop: 0.95, bad: true }));
          S.gate = t >= 0.9 ? 'bad' : 'check';
          S.draft = [{ t: 'T1 · transferência de R$ 200', lines: [['BEGIN', 'dim'], ['lena   150 − 200 = −50', t >= 0.9 ? 'bad' : 'acc'], ...(t >= 1.0 ? [['✕ viola saldo >= 0', 'bad']] : [])] }];
          S.wal = [['#201', 'T1 BEGIN', 'mem', 1]]; S.cl.lena = t >= 1.2 ? ['erro', 'violou a regra', 'bad'] : ['enviando…', 'R$ 200 → irmão', 'hi'];
          if (t >= 0.9) S.card = ['✕ saldo −50 viola saldo >= 0', 'bad', 'a linha nova não entra', 'gate']; return S; },
        data: () => '<li>Código do erro no PostgreSQL: <b>23514</b> (check_violation).</li><li>Depois de um erro, a transação fica abortada: qualquer comando, até o COMMIT, vira ROLLBACK.</li>' },
      { title: 'A transação inteira é recusada', dur: 2.6,
        story: 'Não é só aquele UPDATE que cai: a transação toda volta. O app encerra com ROLLBACK, o rascunho é jogado fora e o WAL registra o fim da T1 sem efeito. O irmão não recebe nada, a Lena não perde nada, e o app mostra "saldo insuficiente".',
        look: 'O rascunho esvazia. As gavetas seguem com 150 e 20; no WAL entra #202 T1 ABORT.',
        key: 'Regra quebrada = transação inteira recusada; o banco não sai de um estado válido.',
        sql: { who: 'app da Lena', code: 'ROLLBACK;', out: 'ROLLBACK' },
        st: t => { const S = S0(); S.gate = t < 0.8 ? 'bad' : 'check';
          S.draft = t < 0.9 ? [{ t: 'T1 · transferência de R$ 200', lines: [['BEGIN', 'dim'], ['lena   150 − 200 = −50', 'bad'], ['ROLLBACK', 'bad']] }] : null;
          S.wal = [['#201', 'T1 BEGIN', 'mem', 1], ...WE('#202', 'T1 ABORT', 'bad', t, 0.6)];
          S.cl.lena = ['R$ 150', '✕ saldo insuficiente', 'bad']; S.cl.irmao = ['R$ 20', 'nada chegou', 'dim'];
          if (t >= 1.0) S.card = ['nada mudou', 'acc', 'lena 150 · irmão 20 · total R$ 170', 'table']; return S; },
        data: () => '<li>Tabela: lena = 150, irmao = 20 (igual a antes).</li><li>O erro voltou para o app, que mostra a mensagem certa para a Lena.</li>' },
      { title: 'R$ 100 cabem na regra', dur: 6,
        story: 'A Lena corrige para R$ 100. Agora 150 − 100 = 50, que é >= 0, e o irmão vai a 120. As duas linhas novas passam pela barra e o COMMIT vale. O banco saiu de um estado válido (170 no total, ninguém negativo) e chegou a outro estado válido.',
        look: 'A barra da regra fica acesa sem vermelho; as duas gavetas mudam juntas no COMMIT.',
        key: 'Consistência: de um estado válido para outro estado válido, sempre.',
        sql: { who: 'app da Lena', code: TX_SQL, out: 'COMMIT' },
        st: t => { const S = fullTx(S0(), t, 203, { noCard: true }); S.gate = t >= 3.6 && t < 4.6 ? 'ok' : 'check';
          if (t >= 4.3) S.card = ['estado válido → estado válido', 'acc', 'total R$ 170 · ninguém negativo', 'table']; return S; },
        data: () => '<li>Regras do banco (CHECK) garantem o que dá para escrever como restrição.</li><li>Regras do negócio, como "o total não muda", dependem de o app usar transações certas.</li>' + EX },
    ],
    i: [
      { title: 'Duas transferências no mesmo segundo', dur: 2,
        story: 'Ao mesmo tempo em que a Lena manda R$ 100 ao irmão, roda o débito automático do aluguel: R$ 40 para a imobiliária. As duas mexem na mesma linha, a da Lena. Neste banco, o app faz três passos: lê o saldo, calcula o novo e grava o número pronto. Deve sobrar 150 − 100 − 40 = 10.',
        look: 'Agora há dois clientes mexendo na Lena: o tablet dela (T1) e o débito automático (T2), embaixo.',
        key: 'Isolamento: transações simultâneas não podem atrapalhar uma à outra.',
        sql: { who: 'o app (T1 e T2 fazem igual)', code: "SELECT saldo FROM contas WHERE id = 'lena';\n-- o app calcula: saldo - valor\nUPDATE contas SET saldo = <novo> WHERE id = 'lena';", out: '(ler, calcular, gravar)' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; S.cl.lena = ['R$ 150', 'T1: R$ 100 → irmão', 'hi']; S.cl.aux = ['agendado', 'T2: R$ 40 → imobiliária', 'hi'];
          if (t > 0.4) S.card = ['lena tem R$ 150', 'acc', 'T1 tira 100 · T2 tira 40 · deve sobrar 10', 'table']; return S; },
        data: () => '<li>T1: Lena → irmão, R$ 100.</li><li>T2: Lena → imobiliária, R$ 40 (aluguel; valor pequeno de exemplo).</li><li>Certo no fim: lena 10, irmão 120, imobiliária 40 (total 170).</li>' },
      { title: 'Sem isolamento: as duas leem 150', dur: 2.6,
        story: 'Sem nenhuma trava, T1 lê o saldo da Lena: 150. Um instante depois, T2 também lê: 150. Nenhuma sabe da outra. Cada uma vai fazer a conta a partir de um número que está prestes a ficar velho.',
        look: 'As duas luzes saem da gaveta da Lena para os clientes. O rascunho mostra T1 leu 150 e T2 leu 150, e a linha do tempo na frente da máquina anota a ordem.',
        key: 'Duas leituras do mesmo valor, ao mesmo tempo, são o começo do problema.',
        sql: { who: 'T1 e T2', code: "SELECT saldo FROM contas WHERE id = 'lena';  -- T1\nSELECT saldo FROM contas WHERE id = 'lena';  -- T2", out: 'T1: 150   T2: 150' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; addFly(S, FL('l_t', t, 0.2, 0.9, { back: true }), FL('a_t', t, 0.9, 1.7, { back: true }));
          S.draft = [{ t: 'T1 · irmão', lines: t >= 0.9 ? [['leu lena = 150', 'acc']] : [] }, { t: 'T2 · aluguel', lines: t >= 1.7 ? [['leu lena = 150', 'acc']] : [] }];
          S.front = [['T1 lê 150', t >= 0.9 ? 'acc' : 'off'], ['T2 lê 150', t >= 1.7 ? 'acc' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'leu 150' : 'lendo…', 'hi']; S.cl.aux = ['T2', t >= 1.7 ? 'leu 150' : 'lendo…', 'hi'];
          if (t >= 1.8) S.card = ['T1 leu 150 · T2 leu 150', 'acc', 'as duas viram o mesmo número', 'draft']; return S; },
        data: () => '<li>Valor lido pela T1: <b>150</b>.</li><li>Valor lido pela T2: <b>150</b>.</li>' },
      { title: 'Cada uma grava a sua conta', dur: 3.2,
        story: 'T1 calcula 150 − 100 = 50 e grava 50. Depois T2 calcula 150 − 40 = 110 e grava 110, por cima. O débito de R$ 100 da T1 simplesmente sumiu: a última escrita apagou a primeira. Isso tem nome: lost update (atualização perdida).',
        look: 'A gaveta da Lena mostra 50 e logo depois 110, em vermelho. A linha do tempo ganha as duas gravações.',
        key: 'Lost update: duas leituras do mesmo valor e a segunda gravação apaga a primeira.',
        sql: { who: 'T1 e T2', code: "UPDATE contas SET saldo = 50  WHERE id = 'lena';  -- T1: 150-100\nUPDATE contas SET saldo = 110 WHERE id = 'lena';  -- T2: 150-40", out: 'UPDATE 1 · UPDATE 1   (a segunda apagou a primeira)' },
        st: t => { const S = S0(); addFly(S, FL('l_t', t, 0.2, 0.9), FL('a_t', t, 1.3, 2.1));
          S.rows.lena = t >= 2.1 ? [110, 'bad', 'o débito da T1 sumiu'] : t >= 0.9 ? [50, 'hot'] : [150, 'n'];
          S.rows.irmao = t >= 0.9 ? [120, 'n'] : [20, 'n']; S.rows.imob = t >= 2.1 ? [40, 'n'] : [0, 'n'];
          S.draft = [{ t: 'T1 · irmão', lines: [['leu lena = 150', 'dim'], ['grava 150−100 = 50', t >= 0.9 ? 'acc' : 'dim']] }, { t: 'T2 · aluguel', lines: [['leu lena = 150', 'dim'], ['grava 150−40 = 110', t >= 2.1 ? 'bad' : 'dim']] }];
          S.front = [['T1 lê 150', 'acc'], ['T2 lê 150', 'acc'], ['T1 grava 50', t >= 0.9 ? 'acc' : 'off'], ['T2 grava 110', t >= 2.1 ? 'bad' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'gravou 50 ✓' : 'gravando…', 'hi']; S.cl.aux = ['T2', t >= 2.1 ? 'gravou 110 ✓' : 'esperando a vez…', 'hi'];
          if (t >= 2.2) S.card = ['lost update', 'bad', 'lena 110, mas devia ser 10', 'table']; return S; },
        data: () => '<li>Linha do tempo: T1 lê 150 → T2 lê 150 → T1 grava 50 → T2 grava 110.</li><li>As duas transações acharam que deu certo.</li>' },
      { title: 'A conta não fecha', dur: 2,
        story: 'Some tudo: Lena 110, irmão 120, imobiliária 40. São R$ 270, mas antes eram R$ 170. O banco "criou" R$ 100. Para um banco de verdade, isso é dinheiro de graça para a Lena e prejuízo para o banco.',
        look: 'A gaveta da Lena fica vermelha com R$ 110. A linha do tempo mostra as quatro operações intercaladas.',
        key: 'Sem isolamento, transações certas sozinhas dão resultado errado juntas.',
        sql: { who: 'auditoria', code: 'SELECT sum(saldo) FROM contas;', out: '270   -- antes eram 170' },
        st: t => { const S = S0(); S.rows.lena = [110, 'bad', 'devia ser 10']; S.rows.irmao = [120, 'n']; S.rows.imob = [40, 'n'];
          S.front = [['T1 lê 150', 'acc'], ['T2 lê 150', 'acc'], ['T1 grava 50', 'acc'], ['T2 grava 110', 'bad']];
          S.cl.lena = ['R$ 110', '?! devia ser R$ 10', 'bad']; S.cl.irmao = ['R$ 120', '+ R$ 100', 'ok']; S.cl.aux = ['T2', 'aluguel pago', 'ok'];
          if (t > 0.3) S.card = ['total R$ 270', 'bad', 'eram R$ 170: R$ 100 surgiram do nada', 'table']; return S; },
        data: () => '<li>110 + 120 + 40 = <b>270</b>.</li><li>Certo seria 10 + 120 + 40 = <b>170</b>.</li>' },
      { title: 'Com isolamento: trava a linha', dur: 3,
        story: 'Voltamos ao começo, agora com isolamento. T1 lê o saldo com FOR UPDATE: o banco põe uma trava (lock) na linha da Lena. Quando T2 tenta ler a mesma linha com FOR UPDATE, ela não consegue: fica esperando a T1 terminar.',
        look: 'A gaveta da Lena sobe com LOCK · T1. No rascunho, T2 aparece esperando.',
        key: 'Com a trava, só uma transação mexe na linha de cada vez.',
        sql: { who: 'T1 e T2', code: "BEGIN;  -- T1\nSELECT saldo FROM contas WHERE id = 'lena' FOR UPDATE;  -- 150, trava\nBEGIN;  -- T2\nSELECT saldo FROM contas WHERE id = 'lena' FOR UPDATE;  -- espera…", out: 'T1: 150   T2: (bloqueada, esperando)' },
        st: t => { const S = S0(); S.rows.imob = [0, 'n']; addFly(S, FL('l_t', t, 0.2, 0.9, { back: true }), FL('a_t', t, 1.3, 2.1, { back: true, stop: 0.82 }));
          S.rows.lena = t >= 0.9 ? [150, 'lock', 'LOCK · T1'] : [150, 'n'];
          S.draft = [{ t: 'T1 · irmão', lines: t >= 0.9 ? [['leu lena = 150 (trava)', 'acc']] : [] }, { t: 'T2 · aluguel', lines: t >= 2.0 ? [['⏳ esperando o lock…', 'old']] : [] }];
          S.front = [['T1 lê+trava', t >= 0.9 ? 'acc' : 'off'], ['T2 espera', t >= 2.0 ? 'old' : 'off']];
          S.cl.lena = ['T1', t >= 0.9 ? 'leu 150 (trava)' : 'lendo…', 'hi']; S.cl.aux = ['T2', t >= 2.0 ? '⏳ esperando' : 'lendo…', 'hi'];
          if (t >= 1.0) S.card = ['LOCK · T1 na linha da lena', 'acc', 'T2 espera na fila', 'table']; return S; },
        data: () => '<li>FOR UPDATE: lê e trava a linha até o fim da transação.</li><li>T2 fica parada: isolamento custa espera.</li>' },
      { title: 'T1 termina, T2 lê o valor novo', dur: 4.4,
        story: 'T1 grava 50, credita o irmão e faz COMMIT. O COMMIT solta a trava. Só então T2 consegue ler: agora o saldo é 50, não 150. T2 calcula 50 − 40 = 10, grava e faz COMMIT. Uma rodou depois da outra.',
        look: 'A trava passa da T1 para a T2. A gaveta da Lena vai de 150 para 50 e depois para 10.',
        key: 'Com isolamento, o resultado é o mesmo de rodar uma transação depois da outra.',
        sql: { who: 'T1 e depois T2', code: "UPDATE contas SET saldo = 50 WHERE id = 'lena';  -- T1\nCOMMIT;  -- T1 solta a trava\n-- T2 acorda e lê 50\nUPDATE contas SET saldo = 10 WHERE id = 'lena';  -- T2\nCOMMIT;", out: 'COMMIT · COMMIT' },
        st: t => { const S = S0(); addFly(S, FL('l_t', t, 0.2, 0.9), FL('a_t', t, 1.6, 2.3, { back: true }), FL('a_t', t, 2.6, 3.3));
          S.rows.lena = t >= 3.3 ? [10, 'hot'] : t >= 2.3 ? [50, 'lock', 'LOCK · T2'] : t >= 1.4 ? [50, 'n', 'trava solta'] : t >= 0.9 ? [50, 'lock', 'LOCK · T1'] : [150, 'lock', 'LOCK · T1'];
          S.rows.irmao = t >= 1.4 ? [120, t < 3 ? 'hot' : 'n'] : [20, 'n']; S.rows.imob = t >= 3.6 ? [40, 'hot'] : [0, 'n'];
          S.draft = [{ t: 'T1 · irmão', lines: [['leu 150 (trava)', 'dim'], ...(t >= 0.9 ? [['grava 50', 'acc']] : []), ...(t >= 1.4 ? [['COMMIT ✓ solta a trava', 'acc']] : [])] },
            { t: 'T2 · aluguel', lines: t < 2.3 ? [['⏳ esperando o lock…', 'old']] : [['leu lena = 50', 'acc'], ...(t >= 3.3 ? [['grava 50−40 = 10', 'acc']] : []), ...(t >= 3.6 ? [['COMMIT ✓', 'acc']] : [])] }];
          S.front = [['T1 lê+trava', 'acc'], ['T2 espera', 'old'], ['T1 grava 50 ✓', t >= 1.4 ? 'acc' : 'off'], ['T2 lê 50', t >= 2.3 ? 'acc' : 'off'], ['T2 grava 10 ✓', t >= 3.6 ? 'acc' : 'off']];
          S.cl.lena = ['T1', t >= 1.4 ? 'COMMIT ✓' : 'gravando…', t >= 1.4 ? 'ok' : 'hi']; S.cl.aux = ['T2', t >= 3.6 ? 'COMMIT ✓' : t >= 2.3 ? 'leu 50' : '⏳ esperando', t >= 3.6 ? 'ok' : 'hi'];
          if (t >= 2.3 && t < 3.6) S.card = ['T2 leu 50, não 150', 'acc', 'o valor que a T1 confirmou', 'draft'];
          if (t >= 3.6) S.card = ['lena = 10', 'acc', '150 − 100 − 40', 'table']; return S; },
        data: () => '<li>Linha do tempo: T1 lê 150 e trava → T2 espera → T1 grava 50, COMMIT → T2 lê 50 → T2 grava 10, COMMIT.</li>' },
      { title: 'Resultado certo: R$ 170 no total', dur: 2,
        story: 'Lena 10, irmão 120, imobiliária 40: R$ 170, como antes. A trava com FOR UPDATE é um jeito. Outro é pedir o nível SERIALIZABLE (ou REPEATABLE READ): o banco percebe o conflito e aborta uma das duas, que o app repete. E o mais simples aqui: UPDATE ... SET saldo = saldo − 40, que lê e grava numa operação só.',
        look: 'As três gavetas com os valores certos; a linha do tempo mostra uma transação depois da outra.',
        key: 'Isolamento troca um pouco de espera (ou de repetição) por resultados certos.',
        sql: { who: 'outra saída', code: 'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;', out: 'ERROR:  could not serialize access due to concurrent update\n-- o app repete a T2, que agora lê 50' },
        st: t => { const S = S0(); S.rows.lena = [10, 'n']; S.rows.irmao = [120, 'n']; S.rows.imob = [40, 'n'];
          S.front = [['T1 lê+trava', 'acc'], ['T2 espera', 'old'], ['T1 grava 50 ✓', 'acc'], ['T2 lê 50', 'acc'], ['T2 grava 10 ✓', 'acc']];
          S.cl.lena = ['R$ 10', '✓ certo', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100', 'ok']; S.cl.aux = ['T2', 'aluguel pago ✓', 'ok'];
          if (t > 0.3) S.card = ['total R$ 170', 'acc', 'como se uma rodasse depois da outra', 'table']; return S; },
        data: () => '<li>10 + 120 + 40 = <b>170</b> ✓</li><li>Níveis no PostgreSQL: READ COMMITTED (padrão), REPEATABLE READ, SERIALIZABLE.</li><li>MVCC: cada transação lê uma "foto" consistente; leitura não bloqueia escrita.</li><li>Anomalias que o isolamento evita: lost update, dirty read, non-repeatable read, phantom read.</li>' + EX },
    ],
    d: [
      { title: 'A transferência, ainda na memória', dur: 3.2,
        story: 'A Lena manda os R$ 100. A transação abre, tira 100 dela e põe 100 no irmão. Até aqui tudo está na memória do servidor: o rascunho e as linhas do WAL na esteira. A memória é rápida, mas some se a luz acabar.',
        look: 'O rascunho tem as duas mudanças. Na esteira, três linhas do WAL com borda tracejada: ainda só na memória.',
        key: 'Memória é rápida e volátil; o disco é mais lento e guarda sem energia.',
        sql: { who: 'app da Lena', code: "BEGIN;\nUPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';", out: 'UPDATE 1 · UPDATE 1' },
        st: t => { const S = fullTx(S0(), Math.min(t, 2.5), 301); S.cl.lena = ['enviando…', 'R$ 100 → irmão', 'hi'];
          if (t >= 2.2) S.card = ['WAL na memória', 'acc', 'cada mudança vira uma linha no log', 'belt']; return S; },
        data: () => '<li>WAL na memória (buffer): #301 BEGIN, #302 UPDATE lena, #303 UPDATE irmão.</li><li>Disco: nada novo ainda.</li>' },
      { title: 'COMMIT: o log desce para o disco', dur: 3.6,
        story: 'A Lena confirma e o app manda COMMIT. O banco põe a linha #304 COMMIT no WAL e manda o log para o disco com fsync, a chamada que só volta quando o disco diz "gravei de verdade". Repare: o arquivo da tabela no disco ainda tem 150 e 20. Ele é atualizado depois (checkpoint); o que garante a transferência é o WAL.',
        look: 'As linhas do WAL viajam pela esteira até o disco. A tela do disco mostra fsync ✓ e o WAL com o COMMIT.',
        key: 'Write-ahead: o log vai para o disco antes de o banco dizer "pronto".',
        sql: { who: 'app da Lena', code: 'COMMIT;', out: '(o banco espera o fsync do WAL…)' },
        st: t => { const S = fullTx(S0(), 2.6 + t, 301, { noCard: true }); if (t < 1.6) S.rows = { lena: [150, 'n'], irmao: [20, 'n'] };
          S.cl.lena = ['enviando…', 'COMMIT', 'hi']; S.cl.irmao = ['R$ 20', 'saldo do irmão', 'dim']; S.fly = S.fly.filter(f => f.p !== 'l_d');
          if (t >= 1.0) S.card = ['fsync ✓', 'acc', 'o disco confirmou: o WAL está gravado', 'disk']; return S; },
        data: () => '<li>WAL no disco: #301 … #304 COMMIT.</li><li>Arquivo da tabela no disco: lena 150, irmão 20 (velho, até o checkpoint).</li><li>fsync: pede ao sistema operacional que tire os dados do cache e grave no meio físico.</li>' + EX },
      { title: 'Só agora: "OK" para o app', dur: 2,
        story: 'Com o WAL seguro no disco, o banco responde COMMIT ao app. A tela da Lena mostra "transferência feita" e o irmão já vê R$ 120. Daqui para frente, o banco prometeu: essa transferência não se perde.',
        look: 'A luz volta ao tablet da Lena. As gavetas mostram 50 e 120.',
        key: 'COMMIT respondido = promessa de durabilidade.',
        sql: { who: 'resposta do banco', code: 'COMMIT;', out: 'COMMIT' },
        st: t => { const S = fullTx(S0(), 4.2 + t * 0.5, 301, { noCard: true }); S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n'];
          S.fly = S.fly.filter(f => f.p !== 'l_d'); addFly(S, FL('l_d', t, 0, 0.8, { back: true })); S.cl.lena = t >= 0.8 ? ['R$ 50', '✓ transferência feita', 'ok'] : ['enviando…', 'COMMIT', 'hi']; S.cl.irmao = ['R$ 120', '+ R$ 100 da Lena', 'ok'];
          if (t >= 0.8) S.card = ['COMMIT → OK', 'acc', 'só depois do fsync', 'lena']; return S; },
        data: () => '<li>O app recebeu COMMIT.</li><li>Tabela na memória: lena 50, irmão 120.</li><li>No disco: WAL com o COMMIT; arquivo da tabela ainda velho.</li>' },
      { title: 'A luz acaba', dur: 2.4,
        story: 'Um segundo depois do OK, a energia do prédio cai. O servidor desliga na hora. A tabela que estava na memória, com 50 e 120, sumiu. No disco sobraram duas coisas: o arquivo da tabela, velho (150 e 20), e o WAL, com a transferência inteira e o COMMIT.',
        look: 'A máquina apaga. Só o disco mantém o que tem: o WAL até #304 e o arquivo velho da tabela.',
        key: 'Na queda, a memória vai embora e o disco fica.',
        sql: { who: 'ninguém', code: '-- sem energia: o processo morre no meio', out: '—' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n']; S.fly = [];
          S.cl.lena = ['R$ 50', '✓ transferência feita', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 da Lena', 'ok'];
          if (t >= 0.6) { S.power = 'off'; S.card = ['⚡ a luz acabou', 'bad', 'tudo o que estava na memória sumiu', 'mach']; S.card2 = ['o disco guardou o WAL', 'acc', '#301 … #304 COMMIT', 'disk']; } return S; },
        data: () => '<li>Perdido: tabela e WAL que estavam na memória.</li><li>No disco: WAL #301…#304 (com COMMIT) e o arquivo da tabela (lena 150, irmão 20).</li>' },
      { title: 'Religou: replay do WAL', dur: 4.4,
        story: 'A luz volta. O banco vê que não desligou direito e faz a recuperação: abre o arquivo da tabela (ainda 150 e 20) e refaz, uma por uma, as mudanças do WAL que têm COMMIT (redo). A T1 tem: Lena volta a 50 e o irmão a 120. Só depois disso aceita conexões.',
        look: 'As gavetas acendem com os valores velhos do arquivo (150, 20). A luz sai do disco e as gavetas viram 50 e 120.',
        key: 'Replay do WAL: o log no disco reconstrói o que a memória perdeu.',
        sql: { who: 'o próprio banco, ao ligar', code: '-- recuperação automática ao ligar', out: RECOV + '\nLOG:  redo starts at #302 · redo done at #304\nLOG:  database system is ready to accept connections' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.fly = []; S.power = t < 1.0 ? 'boot' : 'on';
          S.cl.lena = ['R$ 50', '✓ transferência feita', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 da Lena', 'ok'];
          S.rows = t < 3.0 ? { lena: [150, 'old', 'do arquivo velho'], irmao: [20, 'old', 'do arquivo velho'] } : { lena: [50, 'hot', 'refeito pelo WAL'], irmao: [120, 'hot', 'refeito pelo WAL'] };
          addFly(S, FL('k_t', t, 1.6, 2.4), FL('k_t', t, 2.2, 3.0));
          if (t >= 1.2 && t < 3.0) S.card = ['redo: #302 e #303', 'acc', 'a T1 tem COMMIT (#304), então vale', 'disk'];
          if (t >= 3.0) S.card = ['lena 50 · irmão 120 de volta', 'acc', 'nada se perdeu', 'table']; return S; },
        data: () => '<li>Ponto de partida: arquivo da tabela (lena 150, irmão 20).</li><li>Redo: #302 UPDATE lena 150→50, #303 UPDATE irmão 20→120 (T1 tem COMMIT).</li><li>Transação sem COMMIT no WAL seria ignorada (veja o cenário A).</li>' + EX },
      { title: 'Por que funciona', dur: 2,
        story: 'Durabilidade é isto: se o banco disse COMMIT, o dado sobrevive a queda de luz e a travamento. O truque é a ordem: primeiro o log vai para o disco (write-ahead), depois o banco responde. Dá para trocar isso por velocidade (synchronous_commit = off): o banco responde antes do fsync e uma queda pode levar os últimos instantes de commits.',
        look: 'A máquina de volta ao normal; o WAL no disco tem a transferência com COMMIT.',
        key: 'Durável = depois do COMMIT, nem a falta de luz apaga.',
        sql: { who: 'configuração', code: 'SHOW synchronous_commit;', out: ' on   -- off: responde antes do fsync\n      -- e pode perder os últimos commits' },
        st: t => { const S = fullTx(S0(), 6.5, 301, { noCard: true }); S.fly = []; S.rows.lena = [50, 'n']; S.rows.irmao = [120, 'n'];
          if (t > 0.3) S.card = ['durável = sobrevive à queda', 'acc', 'grava o log antes, responde depois', 'disk']; return S; },
        data: () => '<li>Durabilidade depende de o disco cumprir o fsync (cache do controlador com bateria, ou cache desligado).</li><li>Réplicas e backups protegem contra perder o disco inteiro.</li>' + EX },
    ],
    base: [
      { title: 'Uma loja, três servidores', dur: 2,
        story: 'Agora o banco é outro: em vez de uma máquina, três nós com cópias do mesmo dado, em São Paulo (A), no Rio (B) e em Recife (C). Cada um responde sozinho, sem perguntar aos outros. É o estilo BASE, de bancos distribuídos que põem a disponibilidade em primeiro lugar.',
        look: 'Três nós lado a lado, cada um com o saldo da Lena e do irmão e a versão (v1).',
        key: 'BASE: Basically Available, Soft state, Eventually consistent.',
        sql: { who: 'em A, B ou C', code: "SELECT saldo FROM contas WHERE id = 'lena';", out: 'A: 150 · B: 150 · C: 150' },
        st: t => { const S = S0(); S.nodes = { A: [150, 20, 1, 'n'], B: [150, 20, 1, 'n'], C: [150, 20, 1, 'n'] };
          if (t > 0.4) S.card = ['3 cópias do mesmo dado', 'acc', 'A São Paulo · B Rio · C Recife', 'B']; return S; },
        data: () => '<li>Nó A, B e C: lena 150, irmão 20, versão v1.</li><li>Exemplos de bancos nesse estilo: Cassandra, DynamoDB.</li>' },
      { title: 'A escreve e responde na hora', dur: 2.4,
        story: 'A Lena transfere os R$ 100 e o pedido cai no nó A, o mais perto dela. O A grava na hora e já responde OK, sem esperar B e C. A Lena vê R$ 50 em poucos milissegundos. É o "basicamente disponível": responder sempre que der.',
        look: 'A luz vai do tablet da Lena ao nó A, que passa a mostrar 50, 120 e v2.',
        key: 'Disponível primeiro: o nó responde sem esperar os outros.',
        sql: { who: 'no nó A', code: "UPDATE contas SET saldo = saldo - 100 WHERE id = 'lena';\nUPDATE contas SET saldo = saldo + 100 WHERE id = 'irmao';", out: 'OK em ~5 ms (exemplo) · réplicas: depois' },
        st: t => { const S = S0(); addFly(S, FL('l_A', t, 0.2, 1.1), FL('l_A', t, 1.3, 1.9, { back: true }));
          S.nodes = { A: t >= 1.1 ? [50, 120, 2, 'hot'] : [150, 20, 1, 'n'], B: [150, 20, 1, 'n'], C: [150, 20, 1, 'n'] };
          S.cl.lena = t >= 1.9 ? ['R$ 50', '✓ feito em ~5 ms', 'ok'] : ['enviando…', 'R$ 100 → irmão', 'hi'];
          if (t >= 1.2) S.card = ['OK em ~5 ms', 'acc', 'A não esperou B nem C', 'A']; return S; },
        data: () => '<li>Nó A: lena 50, irmão 120, <b>v2</b>.</li><li>Nós B e C: ainda v1.</li>' },
      { title: 'Soft state: as cópias discordam', dur: 3,
        story: 'O A manda a mudança para B e C em segundo plano (replicação assíncrona). Enquanto ela viaja, os três nós discordam: A diz 120 para o irmão, B e C ainda dizem 20. Nada está quebrado; o estado é "mole" e vai mudar sozinho.',
        look: 'Luzes vão de A para B e C pelos arcos, devagar. B e C mostram v1 em âmbar.',
        key: 'Soft state: o valor de um nó pode mudar sem ninguém escrever nele.',
        sql: { who: 'nó A, em segundo plano', code: '-- replicação assíncrona: A → B, A → C', out: 'B: v1 · C: v1   (atraso de ms a segundos)' },
        st: t => { const S = S0(); addFly(S, { p: 'A_B', f: 0.15 + 0.35 * ph(t, 0, 3) }, { p: 'A_C', f: 0.1 + 0.25 * ph(t, 0, 3) });
          S.nodes = { A: [50, 120, 2, 'n'], B: [150, 20, 1, 'old', 'réplica a caminho…'], C: [150, 20, 1, 'old', 'réplica a caminho…'] };
          S.cl.lena = ['R$ 50', '✓ feito', 'ok'];
          if (t >= 0.5) S.card = ['B e C ainda com v1', 'acc', 'a mudança está a caminho', 'B']; return S; },
        data: () => '<li>A: v2 (lena 50, irmão 120).</li><li>B e C: v1 (lena 150, irmão 20).</li>' },
      { title: 'O irmão olha o saldo… no nó C', dur: 2.6,
        story: 'O irmão, em Recife, abre o app. A leitura vai para o nó C, o mais perto dele. O C responde na hora, mas com o que tem: R$ 20. A transferência já foi aceita, só ainda não chegou ali. É uma leitura velha (stale read).',
        look: 'A luz vai do tablet do irmão até o nó C e volta com R$ 20. A tela do irmão fica vermelha.',
        key: 'Disponível sempre, mas às vezes com valor velho.',
        sql: { who: 'app do irmão, no nó C', code: "SELECT saldo FROM contas WHERE id = 'irmao';", out: '20   -- o nó A já diz 120' },
        st: t => { const S = S0(); addFly(S, FL('i_C', t, 0.2, 1.1), FL('i_C', t, 1.1, 2.0, { back: true }), { p: 'A_B', f: 0.5 + 0.15 * ph(t, 0, 2.6) }, { p: 'A_C', f: 0.35 + 0.1 * ph(t, 0, 2.6) });
          S.nodes = { A: [50, 120, 2, 'n'], B: [150, 20, 1, 'old'], C: [150, 20, 1, t >= 1.1 ? 'stale' : 'old', 'leu daqui: 20'] };
          S.cl.lena = ['R$ 50', '✓ feito', 'ok']; S.cl.irmao = t >= 2.0 ? ['R$ 20', 'cadê os R$ 100?', 'bad'] : ['abrindo…', 'lendo do nó C', 'hi'];
          if (t >= 1.1) S.card = ['C respondeu: irmão = 20', 'bad', 'leitura velha (stale read)', 'C']; return S; },
        data: () => '<li>Leitura no C: <b>20</b> (v1).</li><li>No A, o mesmo dado já é <b>120</b> (v2).</li>' },
      { title: 'Convergência', dur: 3.6,
        story: 'A réplica chega: primeiro ao B, depois ao C. Os três passam a mostrar Lena 50 e irmão 120, versão v2. Ninguém precisou fazer nada: sem novas escritas, as cópias convergem. O irmão atualiza o app e vê R$ 120.',
        look: 'As luzes terminam a viagem; B e C acendem com v2. A tela do irmão fica verde.',
        key: 'Eventual consistency: sem novas escritas, todos os nós acabam iguais.',
        sql: { who: 'app do irmão, no nó C', code: "SELECT saldo FROM contas WHERE id = 'irmao';", out: '120' },
        st: t => { const S = S0(); addFly(S, FL('A_B', t, 0, 0.8, {}), FL('A_C', t, 0, 1.4, {}), FL('i_C', t, 2.0, 2.6), FL('i_C', t, 2.6, 3.2, { back: true }));
          for (const f of S.fly) if (f.p === 'A_B' || f.p === 'A_C') f.f = (f.p === 'A_B' ? 0.65 : 0.45) + (1 - (f.p === 'A_B' ? 0.65 : 0.45)) * f.f;
          S.nodes = { A: [50, 120, 2, 'n'], B: t >= 0.8 ? [50, 120, 2, t < 2.6 ? 'hot' : 'n'] : [150, 20, 1, 'old'], C: t >= 1.4 ? [50, 120, 2, t < 2.6 ? 'hot' : 'n'] : [150, 20, 1, 'old'] };
          S.cl.lena = ['R$ 50', '✓ feito', 'ok']; S.cl.irmao = t >= 3.2 ? ['R$ 120', '+ R$ 100 da Lena', 'ok'] : ['R$ 20', 'cadê os R$ 100?', 'bad'];
          if (t >= 1.5) S.card = ['A, B e C: v2', 'acc', 'convergiram', 'B']; return S; },
        data: () => '<li>A, B e C: lena 50, irmão 120, v2.</li><li>Quanto tempo leva depende da rede e da carga: de milissegundos a segundos.</li>' },
      { title: 'ACID x BASE', dur: 2,
        story: 'Os dois guardam a mesma transferência, com promessas diferentes. ACID: quem lê vê sempre o valor confirmado, mas às vezes precisa esperar uma trava ou recebe um erro. BASE: sempre responde rápido, em qualquer nó, mas pode mostrar um saldo velho por um tempo. Para dinheiro, quase sempre ACID; para carrinho, curtidas e catálogo, BASE costuma bastar.',
        look: 'Os três nós iguais de novo. No painel, a tabela compara os dois modelos.',
        key: 'ACID escolhe estar certo; BASE escolhe estar disponível e acerta depois.',
        sql: { who: 'comparação', code: '-- ACID: COMMIT só quando é seguro e consistente\n-- BASE: OK na hora; as cópias se acertam depois', out: '' },
        st: t => { const S = S0(); S.nodes = { A: [50, 120, 2, 'n'], B: [50, 120, 2, 'n'], C: [50, 120, 2, 'n'] };
          S.cl.lena = ['R$ 50', '✓ feito', 'ok']; S.cl.irmao = ['R$ 120', '+ R$ 100 da Lena', 'ok'];
          if (t > 0.3) S.card = ['sempre responde · às vezes velho', 'acc', 'ACID: sempre certo · às vezes espera', 'B']; return S; },
        data: () => '<table class="s3-tab"><tr><th></th><th>ACID</th><th>BASE</th></tr><tr><td>leitura</td><td>sempre o confirmado</td><td>pode vir velha</td></tr><tr><td>escrita</td><td>espera trava e fsync</td><td>OK na hora, num nó</td></tr><tr><td>falha</td><td>recusa ou espera</td><td>continua respondendo</td></tr><tr><td>bom para</td><td>saldo, estoque, pedidos</td><td>carrinho, feed, catálogo</td></tr></table>' + EX },
    ],
  };

  let sc = 'a', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-acid3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  { const m = new URLSearchParams(location.search).get('mode'); if (SC.includes(m)) sc = m; }
  const ids = () => STEPS[sc], N = () => ids().length, cur = () => ids()[step];
  const DUR = () => cur().dur || 3;

  // ── painel ──
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cmdHtml = c => `<div class="s3-cmd"><b>Comando SQL</b><i>${esc(c.who)}</i><code>${esc(c.code)}</code>${c.out ? `<span>→ ${esc(c.out)}</span>` : ''}</div>`;
  const RN = { lena: 'lena', irmao: 'irmao', imob: 'imobiliaria' };
  function nowHtml() {
    const S = cur().st(lt);
    let tab;
    if (S.nodes) tab = `<table class="s3-tab"><tr><th>nó</th><th>lena</th><th>irmão</th><th>versão</th></tr>${['A', 'B', 'C'].map(k => { const n = S.nodes[k]; return `<tr class="${n[3] === 'old' || n[3] === 'stale' ? '' : 'on'}"><td>${k} · ${NCITY[k]}</td><td>${n[0]}</td><td>${n[1]}</td><td>v${n[2]}</td></tr>`; }).join('')}</table>`;
    else { const off = S.power !== 'on';
      tab = `<table class="s3-tab"><tr><th>contas.id</th><th>saldo que os outros veem</th></tr>${Object.entries(S.rows).map(([k, r]) => `<tr class="${r[1] === 'n' ? '' : 'on'}"><td>'${RN[k]}'</td><td>${off ? '— (servidor desligado)' : r[0]}${r[2] && !off ? ' · ' + r[2] : ''}</td></tr>`).join('')}</table>`; }
    return tab + cur().data();
  }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map(v => `<button data-sc="${v}" title="${SCTIP[v]}" aria-label="${SCTIP[v]}" aria-pressed="${v === sc}">${SCBTN[v]}</button>`).join('')}</div>
      ${cmdHtml(s.sql)}
      <h2>${s.title}</h2>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now" id="acidnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'acid') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · transferência de R$ 100`; }
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
    x.fillStyle = C.ink; x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText({ lena: 'LENA · app do banco', irmao: 'IRMÃO · app do banco', aux: 'DÉBITO AUTOMÁTICO' }[k], u(5), u(8));
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
    x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText({ lena: 'lena', irmao: 'irmao', imob: 'imob.' }[k], u(6), u(11.5));
    const col = power === 'boot' ? C.ink : TC(hot ? r[1] : 'hi');
    if (r[2] && power === 'on') { x.textAlign = 'center'; x.fillStyle = r[1] === 'n' ? C.ink : col; x.font = `600 ${u(7.2)}px ${MONO3}`; x.fillText(r[2], u(118), u(11.5)); }
    x.textAlign = 'right'; x.fillStyle = col; x.font = `600 ${u(17)}px ${MONO3}`; x.fillText(power === 'boot' ? '…' : money(r[0]), u(233), u(12));
    if (r[1] === 'lock') { x.strokeStyle = col; x.lineWidth = u(1.2); x.strokeRect(u(0.8), u(0.8), u(236.4), u(20.4)); }
    cv.tex.needsUpdate = true;
  }
  function drawTabHead(power) {
    if (!once('th', power)) return;
    const cv = tabHead, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText('TABELA contas', u(4), u(8));
    x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `${u(5.4)}px ${MONO3}`; x.fillText(power === 'off' ? 'sem energia' : 'o que os outros veem (confirmado)', u(242), u(8.5));
    cv.tex.needsUpdate = true;
  }
  function drawGate(g, power) {
    if (!once('gate', [g, power])) return;
    const cv = gateFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, power === 'off' ? OFFBG() : null);
    if (power !== 'off') { x.textBaseline = 'middle'; x.textAlign = 'center'; x.fillStyle = g === 'bad' ? '#ff5a4a' : g === 'idle' ? C.ink : TC(g === 'ok' ? 'ok' : 'acc');
      x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText(g === 'bad' ? '✕ REGRA: CHECK (saldo >= 0)' : g === 'ok' ? '✓ REGRA: CHECK (saldo >= 0)' : 'REGRA: CHECK (saldo >= 0)', u(123), u(5.2)); }
    cv.tex.needsUpdate = true;
  }
  function drawDraft(d, power) {
    if (!once('draft', [d, power])) return;
    const cv = draftScr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv, power === 'off' ? OFFBG() : C.recess);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = power === 'off' ? C.ink : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('RASCUNHO (memória)', u(4), u(7.5));
    x.textAlign = 'right'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('invisível para os outros', u(246), u(7.8)); x.textAlign = 'left';
    if (power === 'off') { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(12)}px ${MONO3}`; x.fillText('✕ memória apagada', u(8), u(46)); cv.tex.needsUpdate = true; return; }
    if (!d) { x.fillStyle = C.ink; x.font = `${u(9)}px ${MONO3}`; x.fillText('(nenhuma transação aberta)', u(8), u(46)); cv.tex.needsUpdate = true; return; }
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
    x.fillStyle = power === 'off' ? C.ink : C.inkHi; x.font = `600 ${u(7.6)}px ${MONO3}`; x.fillText('WAL ↑ disco', u(51), u(7.5));
    x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('entra aqui ↑', u(51), u(215));
    if (power === 'off') { x.fillStyle = '#ff5a4a'; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('✕ buffer apagado', u(51), u(110)); cv.tex.needsUpdate = true; return; }
    const n = q.length, show = q.slice(-6);
    show.forEach((e, i) => { const k = show.length - 1 - i, f = e[3], y0 = 178 - k * 30 + (1 - f) * 22;
      const tone = e[2], col = tone === 'bad' ? '#ff5a4a' : tone === 'hot' ? TC('acc') : tone === 'disk' ? TC('acc') : C.inkHi;
      x.globalAlpha = Math.min(1, f * 1.6);
      x.beginPath(); x.roundRect(u(5), u(y0), u(92), u(26), u(2.5)); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#17181a'; x.fill();
      if (tone === 'mem' || tone === 'hot') x.setLineDash([u(1.6), u(1.1)]); x.strokeStyle = tone === 'mem' ? C.line : col; x.lineWidth = u(tone === 'mem' ? 0.5 : 0.9); x.stroke(); x.setLineDash([]);
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `600 ${u(6.2)}px ${MONO3}`; x.fillText(e[0], u(9), u(y0 + 7));
      x.textAlign = 'right'; x.fillStyle = tone === 'mem' || tone === 'hot' ? C.ink : col; x.font = `${u(5.6)}px ${MONO3}`; x.fillText(tone === 'disk' ? '✓ disco' : tone === 'bad' ? 'sem efeito' : 'memória', u(93), u(y0 + 7));
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
    x.fillStyle = TC('acc'); x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('pg_wal/ (o log)', u(4), u(18));
    const W4 = d.wal.slice(-4);
    if (!W4.length) { x.fillStyle = C.ink; x.font = `${u(5.4)}px ${MONO3}`; x.fillText('(nada novo)', u(6), u(28)); }
    W4.forEach(([txt, tone], i) => { x.fillStyle = TC(tone); x.font = `${tone === 'hi' ? '' : '600 '}${u(7.2)}px ${MONO3}`; x.fillText(txt, u(6), u(28 + i * 10)); });
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(70)); x.lineTo(u(116), u(70)); x.stroke();
    x.fillStyle = C.ink; x.font = `600 ${u(6.6)}px ${MONO3}`; x.fillText('base/ (a tabela)', u(4), u(79));
    const [a, b] = d.tab.split(' (');
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText(a, u(6), u(89));
    if (b) { x.fillStyle = TC('old'); x.font = `${u(5.8)}px ${MONO3}`; x.fillText('(' + b, u(6), u(99)); }
    cv.tex.needsUpdate = true;
  }
  function drawDiskFront(d, power) {
    if (!once('dfr', [d.st, power])) return;
    const cv = diskFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('DISCO', u(4), u(8));
    x.fillStyle = power === 'off' ? C.ink : TC(d.st[1]); x.font = `600 ${u(6.4)}px ${MONO3}`; x.fillText(power === 'off' ? 'desligado · dados guardados' : d.st[0], u(4), u(20));
    cv.tex.needsUpdate = true;
  }
  function drawMach(power, front) {
    if (!once('mach', [power, front])) return;
    const cv = machFr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('SERVIDOR DE BANCO', u(4), u(6.5));
    x.fillStyle = power === 'off' ? '#ff5a4a' : power === 'boot' ? TC('old') : TC('ok'); x.font = `600 ${u(6)}px ${MONO3}`;
    x.fillText(power === 'off' ? '✕ sem energia' : power === 'boot' ? '↻ recuperando' : '● ligado', u(4), u(14.5));
    if (front && power === 'on') { let cx = 82; front.forEach(([txt, tone], i) => { x.font = `600 ${u(6)}px ${MONO3}`; const w = x.measureText((i + 1) + ' ' + txt).width / P + 6;
        x.beginPath(); x.roundRect(u(cx), u(3), u(w), u(14), u(2)); x.strokeStyle = tone === 'off' ? C.detail : TC(tone); x.lineWidth = u(tone === 'off' ? 0.4 : 0.8); x.stroke();
        x.fillStyle = tone === 'off' ? C.detail : TC(tone); x.fillText((i + 1) + ' ' + txt, u(cx + 3), u(10.2)); cx += w + 3; }); }
    cv.tex.needsUpdate = true;
  }
  function drawNode(k, n) {
    if (!once('node' + k, n)) return;
    const cv = NODE[k].scr, { x, P } = cv, { C } = colors(), u = v => v * P, tone = n[3];
    bgFill(cv, tone === 'hot' ? C.glassOn : null); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText('NÓ ' + k + ' · ' + NCITY[k], u(5), u(9));
    const vc = tone === 'old' || tone === 'stale' ? TC('old') : TC('acc');
    x.textAlign = 'right'; x.beginPath(); x.roundRect(u(118), u(3), u(22), u(12), u(2)); x.strokeStyle = vc; x.lineWidth = u(0.8); x.stroke();
    x.fillStyle = vc; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('v' + n[2], u(136), u(9.4));
    [['lena', n[0]], ['irmão', n[1]]].forEach(([nm, v], i) => { const y = 34 + i * 34;
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(nm, u(6), u(y));
      x.textAlign = 'right'; x.fillStyle = tone === 'stale' && i === 1 ? '#ff5a4a' : tone === 'old' || tone === 'stale' ? TC('old') : tone === 'hot' ? TC('acc') : C.inkHi;
      x.font = `600 ${u(17)}px ${MONO3}`; x.fillText(money(v), u(138), u(y)); });
    if (n[4]) { x.textAlign = 'left'; x.fillStyle = tone === 'stale' ? '#ff5a4a' : TC('old'); x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(n[4], u(6), u(112)); }
    cv.tex.needsUpdate = true;
  }
  function drawNodeFront(k) {
    if (!once('nf' + k, 1)) return;
    const cv = NODE[k].fr, { x, P } = cv, { C } = colors(), u = v => v * P; bgFill(cv);
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(10)}px ${MONO3}`; x.fillText('NÓ ' + k, u(5), u(9));
    x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText(NCITY[k] + ' · responde sozinho', u(5), u(19));
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: VIEW,
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1 a 5 · arraste para girar' };
})() });
