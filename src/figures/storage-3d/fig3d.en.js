// 3D figure (iso-glow): Storage types. The online store needs to keep "gato.jpg" (a product photo, 2,457,600 bytes = 2.4 MB).
// The SAME photo is stored 5 ways: DAS, NAS, block, file and object. Each way changes what the program sees and who can reach it.
// Cena: um data center compacto. À esquerda (na frente), os servidores da loja (A, B, C); à direita (ao fundo), o storage, que muda
// de forma com o modo: SSD puxado para fora do servidor, caixa NAS, volume de blocos em grade, árvore de pastas, bucket com objetos.
// A foto é um cartão com o gato desenhado; no modo block ela se desfaz em blocos de 4 KB que caem nas casas LBA 2048, 2049…
// ?mode=das|nas|block|file|object escolhe o cenário inicial (funciona junto com embed=1).
// Números (latências, inode, ETag, IDs) são exemplos coerentes, avisados no painel.
FIGS3D.push({ id: 'storage', name: 'Storage', mod: (() => {
  const ZOFF = () => innerWidth < 640 ? -300 : innerWidth < 900 ? -250 : -205;   // no celular/embed, o painel ocupa a parte de baixo
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── cenários ──
  const SC = ['das', 'nas', 'block', 'file', 'object'];
  const SCBTN = { das: 'DAS', nas: 'NAS', block: 'Block', file: 'File', object: 'Object' };
  const SCNAME = { das: 'DAS · direct disk', nas: 'NAS · storage on the network', block: 'Block storage', file: 'File storage', object: 'Object storage' };
  // âncora da aula de cada modo (link "Voltar ao módulo")
  const LESSON = { das: 'aula-3-das', nas: 'aula-4-nas', block: 'aula-5-block-storage', file: 'aula-6-file-storage', object: 'aula-7-object-storage' };
  const SIZE = '2,457,600', MIME = 'image/jpeg', URL = 'https://loja-fotos.s3.amazonaws.com/produtos/gatos/gato.jpg';
  const ETAG1 = '"9b2cf535f27731c974343645a3985328"', ETAG2 = '"e4d909c290d0fb1ca068ffaddf22cbd0"';

  // ── geometria (unidades iso) ──
  plateWith(g0, 780, 270, [[18, 18], [762, 18], [18, 252], [762, 252]]);
  const OX = 70;                                                      // o storage fica 70 unidades à direita do desenho base
  const mkGroup = (id, parent = g0) => { const g = new THREE.Group(); if (id) g.userData.go = id; parent.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };
  const GRP = { das: mkGroup('sto'), net: mkGroup('net'), nas: mkGroup('sto'), blk: mkGroup('sto'), file: mkGroup('sto'), obj: mkGroup('sto') };
  const VIS = { das: ['A', 'B', 'das'], nas: ['A', 'B', 'C', 'net', 'nas'], block: ['A', 'B', 'blk'], file: ['A', 'B', 'C', 'net', 'file'], object: ['A', 'B', 'obj'] };

  // servidores da loja: torres com tela na frente
  const SX = { A: 30, B: 220, C: 350 };
  const SRV = {};
  for (const k of ['A', 'B', 'C']) {
    const x = SX[k], g = mkGroup('srv' + k);
    rbox(x, 180, 7, 80, 56, 120, 6, bodyMat, g);
    const cap = glowCap(x + 6, 184, 127, 68, 48, 3, 4, g);
    const scr = faceCanvas('front', x + 6, 236, 121, 68, 74, 5, g);
    slitsFrontH(38, 18, 5, 236, x + 34, x + 72, g);
    const led = dotFront(x + 14, 236, 30, 2.6, g), led2 = dotFront(x + 14, 236, 21, 2.6, g);
    SRV[k] = { g, cap, scr, led, led2, top: [x + 40, 208, 127] };
  }
  GRP.A = SRV.A.g; GRP.B = SRV.B.g; GRP.C = SRV.C.g;
  // DAS: SSD puxado para fora do servidor A, preso por cabo
  const diskCap = glowCap(124, 186, 7, 54, 44, 20, 4, GRP.das);
  const diskScr = faceCanvas('top', 127, 189, 27, 48, 38, 6, GRP.das);
  // rede: switch
  rbox(450, 176, 7, 110, 40, 18, 4, bodyMat, GRP.net);
  const swScr = faceCanvas('top', 454, 180, 25, 102, 32, 5, GRP.net);
  // NAS: caixa com 4 discos
  rbox(460, 36, 7, 150, 74, 86, 6, bodyMat, GRP.nas);
  const nasCap = glowCap(470, 40, 93, 130, 66, 3, 4, GRP.nas);
  const nasScr = faceCanvas('front', 466, 110, 87, 138, 70, 5, GRP.nas);
  // block: volume coberto de casas numeradas
  rbox(430, 24, 7, 230, 120, 16, 6, bodyMat, GRP.blk);
  const volScr = faceCanvas('top', 436, 30, 23, 218, 108, 4, GRP.blk);
  const COLS = 6, ROWS = 3, CW = 218 / COLS, CH = 108 / ROWS, LBA0 = 2045, MINE0 = 3, SHOWN = COLS * ROWS - MINE0;
  const cellC = i => [OX + 436 + ((i % COLS) + 0.5) * CW, 30 + (((i / COLS) | 0) + 0.5) * CH, 27];
  // file: árvore de pastas
  const NODES = {
    root: { n: '/', x: 380, y: 66, perm: 'drwxr-xr-x', own: 'root' },
    prod: { n: 'produtos', x: 462, y: 26, perm: 'drwxr-xr-x', own: 'loja' },
    bkp: { n: 'backups', x: 462, y: 108, perm: 'drwx------', own: 'root' },
    gatos: { n: 'gatos', x: 544, y: 10, perm: 'drwxr-xr-x', own: 'loja' },
    caes: { n: 'cachorros', x: 544, y: 70, perm: 'drwxr-xr-x', own: 'loja' },
    foto: { n: 'gato.jpg', x: 626, y: 10, perm: '-rw-r--r--', own: 'loja', file: true },
  };
  const WALK = ['root', 'prod', 'gatos', 'foto'];
  const EDGES = [['root', 'prod'], ['root', 'bkp'], ['prod', 'gatos'], ['prod', 'caes'], ['gatos', 'foto']];
  for (const [k, N] of Object.entries(NODES)) {
    N.cap = glowCap(N.x, N.y, 7, 64, 44, N.file ? 16 : 24, 4, GRP.file);
    N.scr = faceCanvas('top', N.x + 2, N.y + 2, N.file ? 23 : 31, 60, 40, 6, GRP.file);
  }
  const edgeLines = EDGES.map(([a, b]) => { const A = NODES[a], B = NODES[b], z = 8;
    const pts = [[A.x + 64, A.y + 22, z], [A.x + 73, A.y + 22, z], [A.x + 73, B.y + 22, z], [B.x, B.y + 22, z]];
    return { a, b, dim: polyLine(pts, lineMat, GRP.file), lit: null, pts }; });
  // object: bucket (uma banheira aberta) com objetos soltos no chão
  rbox(440, 20, 7, 240, 130, 6, 10, bodyMat, GRP.obj);
  rbox(440, 20, 13, 240, 6, 84, 3, bodyMat, GRP.obj);
  const bkScr = faceCanvas('front', 446, 26, 94, 228, 44, 5, GRP.obj); rbox(440, 20, 13, 6, 130, 40, 3, bodyMat, GRP.obj);
  rbox(674, 20, 13, 6, 130, 40, 3, bodyMat, GRP.obj); rbox(440, 144, 13, 240, 6, 14, 3, bodyMat, GRP.obj);
  const OBJS = [
    { k: 'backups/2026-10-13.tar.gz', x: 456, y: 34 }, { k: 'logs/2026-10-14/app.json.gz', x: 516, y: 34 },
    { k: 'produtos/cachorros/rex.jpg', x: 576, y: 34 }, { k: 'produtos/gatos/mimi.jpg', x: 630, y: 34 },
  ];
  OBJS.forEach(o => { o.cap = glowCap(o.x, o.y, 13, 30, 30, 30, 4, GRP.obj); });
  hazeAndShadow(g0, 390, 135, 9.6, 3.6);
  for (const k of ['nas', 'blk', 'file', 'obj']) { GRP[k].position.copy(W(OX, 0, 0)); GRP['p' + k] = mkGroup(null); }   // pNNN: caminhos, em coordenadas absolutas

  // a foto: um cartão com o gato desenhado na frente
  const mkPhoto = () => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-20, -4, -20, 40, 8, 40, 3, mat, g); const cv = faceCanvas('front', -18, 4, 18, 36, 36, 7, g);
    const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, cv, glow }; };
  const PHOTO = mkPhoto(), PHOTO2 = mkPhoto();
  // blocos de 4 KB (cubinhos) e pontos de luz
  const mkCube = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.22); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const CUBES = Array.from({ length: 12 }, () => mkCube(11));
  const DOTS = [0, 1, 2, 3].map(() => mkCube(12));
  creases(first);

  // ── caminhos de luz (cada um mora no grupo do seu modo) ──
  const litMat = new LineMaterial({ color: accent.clone(), linewidth: 2.6, resolution: accentLineMat.resolution.clone(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
  edgeLines.forEach(e => { e.lit = polyLine(e.pts, litMat, GRP.file); e.lit.visible = false; });
  const cable = polyLine([[110, 214, 44], [117, 214, 44], [117, 214, 12], [124, 214, 12]], lineMat, GRP.das);
  const cableLit = polyLine([[110, 214, 44], [117, 214, 44], [117, 214, 12], [124, 214, 12]], litMat, GRP.das); cableLit.visible = false;
  const TOP = k => SRV[k].top;
  const arc = (a, b, lift) => bezier(a, [a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], b, 48);
  const SWP = [505, 196, 25], DISKP = [151, 208, 27], NASP = [OX + 535, 73, 93], VOLP = [OX + 545, 84, 23], ROOTP = [OX + 412, 88, 31], BKP = [OX + 555, 104, 30];
  const via = (s, e) => [...bezier(s, [s[0], s[1], s[2] + 50], [SWP[0], SWP[1], SWP[2] + 60], SWP, 28), ...bezier(SWP, [SWP[0], SWP[1], SWP[2] + 60], [e[0], e[1], e[2] + 60], e, 28).slice(1)];
  const PATHS = {};
  const mkPath = (k, pts, grp) => { PATHS[k] = { pts, cum: cumLen(pts), dim: polyLine(pts, lineMat, grp), lit: polyLine(pts, litMat, grp) }; PATHS[k].lit.visible = false; };
  mkPath('a_d', bezier(TOP('A'), [70, 208, 175], [151, 208, 80], DISKP, 48), GRP.das);
  mkPath('b_d', bezier(TOP('B'), [240, 208, 175], [151, 208, 80], DISKP, 48), GRP.das);
  mkPath('a_b', arc(TOP('A'), TOP('B'), 70), GRP.das);
  for (const k of ['A', 'B', 'C']) { mkPath(k.toLowerCase() + '_n', via(TOP(k), NASP), GRP.pnas); mkPath(k.toLowerCase() + '_f', via(TOP(k), ROOTP), GRP.pfile); }
  mkPath('a_v', arc(TOP('A'), VOLP, 120), GRP.pblk);
  mkPath('b_v', arc(TOP('B'), VOLP, 120), GRP.pblk);
  mkPath('a_o', arc(TOP('A'), BKP, 170), GRP.pobj);
  mkPath('b_o', arc(TOP('B'), BKP, 170), GRP.pobj);
  ['b_d', 'a_b'].forEach(k => PATHS[k].dim.visible = false);   // caminhos que só aparecem quando usados

  // ── rótulos que olham para a câmera ──
  const tags = []; let ZC = 1;                                          // ZC: quanto a câmera está mais perto/longe que o normal (rótulos mantêm o tamanho na tela)
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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; t.w0 = nw / P * TS * k; t.h0 = nh / P * TS * k; sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1);
    }
    tags.push(t); return t;
  }
  const tSrv = { A: tag(14), B: tag(14), C: tag(14) }, tSto = tag(14), tPh = tag(13), tCard = tag(15);

  // ── roteiro ──
  let sc = 'das', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-storage3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  { const m = new URLSearchParams(location.search).get('mode'); if (SC.includes(m)) sc = m; }
  const IDLE = ['online store', 'ready', 'dim'];
  const TABLE = () => `<table class="s3-tab"><tr><th>Type</th><th>Who sees it</th><th>Latency*</th><th>Edit 4 KB</th><th>Good for</th></tr>${[
    ['das', 'DAS', '1 server', '~0.1 ms', 'yes', 'local disk, cache'],
    ['nas', 'NAS', 'many', '~1 ms+', 'yes', 'company folders'],
    ['block', 'Block', '1 server', '< 1 ms', 'yes', 'databases, VMs'],
    ['file', 'File', 'many', 'ms', 'yes, with lock', 'shared folders'],
    ['object', 'Object', 'anyone with the URL', 'tens of ms', 'no', 'photos, backups, logs']].map(r => `<tr class="${r[0] === sc ? 'on' : ''}">${r.slice(1).map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table><li class="h3-dim">* order of magnitude, only for comparing; varies with hardware and network.</li>`;

  // each step: legs (what happens, in order), ph0 (where the photo starts), srv (screens), sto (storage state), texts, cmd and data
  const STEPS = {
    das: [
      { title: 'The photo lives on the server\'s disk', ph0: 'A', focus: 'das', zoom: 0.62,
        story: 'The store received a product photo: gato.jpg, 2.4 MB. In the simplest setup, it goes to a disk wired straight into server A: an NVMe SSD inside the case (or a drive shelf, a JBOD, attached by cable). This arrangement is called DAS, Direct-Attached Storage.',
        look: 'The SSD is pulled out of server A and attached by a cable. Server B sits next to it, with no cable at all.',
        key: 'DAS: the disk belongs to one server and is wired straight into it, with no network in between.',
        cmd: { who: 'on server A', code: 'lsblk', out: 'nvme0n1  1T  disk  /data' },
        legs: [{ pulse: 'disk', cable: true, card: ['NVMe SSD · 1 TB', 'acc', 'wired straight to A, over PCIe'], at: 'disk' }],
        srv: { A: ['I have the photo', 'gato.jpg · 2.4 MB', 'ok'], B: IDLE }, sto: { disk: 'empty' },
        data: () => '<li>Disk: <b>1 TB NVMe SSD</b> at <b>/dev/nvme0n1</b>, formatted as ext4 and mounted at <b>/data</b></li><li>Interface: NVMe over PCIe. Other common ones: SATA and SAS.</li><li><b>JBOD</b> ("just a bunch of disks"): a shelf with several disks attached by SAS cable. More space, but still one server only.</li>' },
      { title: 'Write: straight down the cable', focus: 'das', zoom: 0.62, ph0: 'A',
        story: 'The store\'s program writes the photo to /data/produtos/gato.jpg. The operating system sends the bytes over the bus to the SSD. No network, no switch, no other computer. That is why it is fast: the whole photo goes in within a few milliseconds.',
        look: 'The photo goes down from server A into the SSD. The SSD screen now lists gato.jpg.',
        key: 'No network in between: the wait is only the disk\'s own.',
        cmd: { who: 'on server A', code: 'fd = open("/data/produtos/gato.jpg", O_WRONLY|O_CREAT)\nwrite(fd, buf, 2457600)', out: '→ 2457600 (bytes written)' },
        legs: [{ path: 'a_d', dir: 1, carry: true, ph: 'disk', cable: true, card: ['write → SSD', 'acc', `${SIZE} bytes · no network`], at: 'disk' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', 'gato.jpg on SSD', 'ok'] : ['writing…', 'write()', 'hi'], B: IDLE }), sto: ld => ({ disk: ld(0) ? 'file' : 'empty' }),
        data: () => `<li>File: <b>/data/produtos/gato.jpg</b> · ${SIZE} bytes</li><li>Path: program → kernel → NVMe driver → SSD. Zero network hops.</li><li>An NVMe SSD writes at GB/s: 2.4 MB takes about 1 to 2 ms (example).</li>` },
      { title: 'Read: the shortest path there is', focus: 'das', zoom: 0.62, ph0: 'disk',
        story: 'A customer opens the plush cat page. Server A reads the photo from its own SSD, in 4 KB pieces. Each read takes about 0.1 ms (100 µs) on an NVMe. There is no shorter path between a program and its data.',
        look: 'A light leaves the SSD and returns to server A. The screen on A shows the read time.',
        key: 'On latency, nothing beats the local disk.',
        cmd: { who: 'on server A', code: 'read(fd, buf, 4096)', out: '→ 4096 bytes · ~0.1 ms (example)' },
        legs: [{ path: 'a_d', dir: -1, cable: true, card: ['read 4 KB · ~0.1 ms', 'acc', 'SSD → server A'], at: 'disk' }],
        srv: ld => ({ A: ld(0) ? ['read ✓ · 0.1 ms', '4 KB from SSD', 'ok'] : ['reading…', 'read()', 'hi'], B: IDLE }), sto: { disk: 'file' },
        data: () => '<li>Typical latency: NVMe SSD ~0.1 ms · SATA SSD ~0.2 ms · spinning HDD ~5 to 10 ms (order of magnitude)</li><li>Reading in 4 KB blocks: it is the most common page size in file systems.</li>' },
      { title: 'Server B tries, and sees nothing', focus: 'das', zoom: 0.62, ph0: 'disk', fail: true,
        story: 'The store grew and turned on server B to split the visits. But the photo is on A\'s SSD. B looks for /data/produtos/gato.jpg and does not find it: to B, that disk does not exist. There is no cable or network between B and the SSD.',
        look: 'The light leaves B toward the SSD and stops halfway, with a ✕. B\'s screen shows the error.',
        key: 'With DAS, only the server wired to the disk can see the data.',
        cmd: { who: 'on server B', code: 'open("/data/produtos/gato.jpg", O_RDONLY)', out: '→ -1 ENOENT (No such file or directory)' },
        legs: [{ path: 'b_d', dir: 1, stop: 0.55, card: ['✕ B cannot see A\'s SSD', 'acc', 'no cable to it'], at: 'srv' }],
        srv: ld => ({ A: ['I have the photo', 'on my SSD', 'ok'], B: ld(0) ? ['✕ ENOENT', 'where is it?', 'bad'] : ['looking…', 'open()', 'hi'] }), sto: { disk: 'file' },
        data: () => '<li>The SSD only shows up in <b>lsblk</b> on server A. On B, /data is a different disk (its own internal one), empty.</li><li>ENOENT = "Error NO ENTry": the file does not exist for this server.</li>' },
      { title: 'The patch: copy it. Now there are two photos', focus: 'das', zoom: 0.62, ph0: 'disk',
        story: 'For B to show the photo, someone copies the file over the network, from A to B\'s internal disk. It works, but now there are two copies. If the photo changes on A, B keeps the old one until the next copy. And if A burns, the SSD goes with it. When several servers need the same data, network storage comes in.',
        look: 'A copy of the photo flies from A to B. B\'s screen says "copy from 10:02".',
        key: 'DAS is simple, cheap and fast, but tied to one server; growing means adding disks by hand.',
        cmd: { who: 'on server A', code: 'rsync -a /data/produtos/ servidor-b:/data/produtos/', out: '→ gato.jpg · 2,457,600 bytes sent' },
        legs: [{ path: 'a_b', dir: 1, carry: 'copy', ph2: 'B', card: ['copy over the network', 'acc', 'A → B · two photos now'], at: 'srv' }],
        srv: ld => ({ A: ['original', 'gato.jpg · 10:02', 'ok'], B: ld(0) ? ['copy from 10:02', 'may go stale', 'ok'] : ['receiving…', 'rsync', 'hi'] }), sto: { disk: 'file' },
        data: () => TABLE() },
    ],
    nas: [
      { title: 'Storage that lives on the network', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'So that A, B and C can see the same photo, the store plugs a NAS (Network-Attached Storage) into the switch: a box with several disks and its own system. It exports the folder /export/fotos, and each server mounts that folder over the network, with NFS (Linux) or SMB (Windows).',
        look: 'The NAS box at the back, with 4 disks. The three servers plug into the switch, and the switch into the NAS.',
        key: 'NAS: a device on the network that serves folders and files to many servers.',
        cmd: { who: 'on servers A, B and C', code: 'mount -t nfs nas.loja:/export/fotos /mnt/nas', out: '→ (no output = mounted at /mnt/nas)' },
        legs: [{ pulse: 'nas', card: ['NAS · nas.loja', 'acc', '4 disks · NFS and SMB'], at: 'sto' }],
        srv: { A: ['I have the photo', '/mnt/nas mounted', 'ok'], B: ['/mnt/nas', 'mounted', 'hi'], C: ['/mnt/nas', 'mounted', 'hi'] }, sto: { nas: 'on' },
        data: () => '<li>NAS: <b>nas.loja</b> (10.0.0.50), exports <b>/export/fotos</b></li><li>NFS uses port 2049 (TCP); SMB uses 445.</li><li>Inside, the 4 disks are usually in RAID (see the RAID lessons).</li>' },
      { title: 'Write: the photo crosses the network', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Server A writes to /mnt/nas/produtos/gatos/gato.jpg. To the program, it is an ordinary folder. Underneath, the operating system\'s NFS client breaks the 2.4 MB into WRITE messages of up to 1 MB and sends them over the network. The NAS writes to its disks and replies OK.',
        look: 'The photo leaves A, passes through the switch and enters the NAS. The NAS screen shows gato.jpg.',
        key: 'The program uses open and write as always; the operating system is the one talking to the network.',
        cmd: { who: 'on server A', code: 'open("/mnt/nas/produtos/gatos/gato.jpg", O_WRONLY|O_CREAT)\nwrite(fd, buf, 2457600)', out: '→ becomes 3 × NFS WRITE (1 MB, 1 MB, 0.4 MB) → OK' },
        legs: [{ path: 'a_n', dir: 1, carry: true, ph: 'nas', card: ['NFS WRITE × 3', 'acc', 'A → switch → NAS'], at: 'net' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', 'over the network', 'ok'] : ['writing…', 'NFS WRITE', 'hi'], B: ['/mnt/nas', 'mounted', 'hi'], C: ['/mnt/nas', 'mounted', 'hi'] }), sto: ld => ({ nas: ld(0) ? 'file' : 'on' }),
        data: () => `<li>File on the NAS: <b>/export/fotos/produtos/gatos/gato.jpg</b> · ${SIZE} bytes</li><li>On the servers it shows up as <b>/mnt/nas/produtos/gatos/gato.jpg</b>.</li><li>Maximum size of each WRITE (wsize): 1 MB, a common value on Linux.</li>` },
      { title: 'B and C read the same photo', focus: 'mid', zoom: 1, ph0: 'nas',
        story: 'Now B and C open the same path and get the same photo, with no copy. If A replaces the photo, the others see the new version on their next read. This is what DAS was missing.',
        look: 'Two lights leave the NAS: one to B, one to C. All three screens show gato.jpg.',
        key: 'Many servers, one folder: the data sits in one place and is shared.',
        cmd: { who: 'on servers B and C', code: 'open("/mnt/nas/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ fd = 3 · the same photo, the same file' },
        legs: [{ path: 'b_n', dir: -1, card: ['NFS READ → B and C', 'acc', 'one photo, three servers'], at: 'net' }, { path: 'c_n', dir: -1, par: true }],
        srv: ld => ({ A: ['I have the photo', 'on the NAS', 'ok'], B: ld(0) ? ['read ✓', 'gato.jpg', 'ok'] : ['reading…', 'NFS READ', 'hi'], C: ld(1) ? ['read ✓', 'gato.jpg', 'ok'] : ['reading…', 'NFS READ', 'hi'] }), sto: { nas: 'file' },
        data: () => '<li>Just one copy, on the NAS. All three servers read the same file.</li><li>Each NFS client keeps a short cache; the new version shows up within seconds (example).</li>' },
      { title: 'The price: every read travels the network', focus: 'mid', zoom: 1, ph0: 'nas',
        story: 'Sharing has a cost. Every read leaves the server, crosses the switch, reaches the NAS, which reads from disk and sends it back. On the local SSD that took ~0.1 ms; through the NAS it usually takes 1 ms or more, and gets worse when the network is busy. For photos, fine. For a database doing thousands of small reads per second, it hurts.',
        look: 'The light makes the whole trip: A → switch → NAS and back to A.',
        key: 'NAS is shared, but it carries the network\'s latency and bandwidth.',
        cmd: { who: 'on server A', code: 'read(fd, buf, 4096)', out: '→ NFS READ · ~1 ms (example) · on the local SSD: ~0.1 ms' },
        legs: [{ path: 'a_n', dir: 1, card: ['out: READ request', 'hi', 'A → switch → NAS'], at: 'net' }, { path: 'a_n', dir: -1, card: ['back: 4 KB · ~1 ms', 'acc', '10× the local SSD'], at: 'net' }],
        srv: ld => ({ A: ld(1) ? ['read ✓ · ~1 ms', 'over the network', 'ok'] : ['waiting…', 'NFS READ', 'hi'], B: ['gato.jpg', 'ok', 'hi'], C: ['gato.jpg', 'ok', 'hi'] }), sto: { nas: 'file' },
        data: () => '<li>Round trip on the local network: ~0.2 to 0.5 ms of travel alone, plus the NAS disk (example).</li><li>Bandwidth is shared too: 3 servers reading at the same time split the same NAS link.</li>' },
      { title: 'What if the NAS goes down?', focus: 'mid', zoom: 1, ph0: 'nas', fail: true,
        story: 'One night, the NAS power supply burns out. All three servers freeze at once: every read on /mnt/nas waits for an answer that never comes. A single NAS is a single point of failure. In practice, people use a NAS with two controllers, disks in RAID and a replica, or a managed service that already handles this.',
        look: 'The NAS goes dark. The lights from the three servers stop at the switch, and the screens show "not responding".',
        key: 'Centralizing makes things easier, but the center needs to be redundant.',
        cmd: { who: 'in the servers\' kernel log', code: 'read(fd, buf, 4096)', out: '→ nfs: server nas.loja not responding, still trying' },
        legs: [{ pulse: 'nas', off: true, card: ['✕ NAS has no power', 'acc', 'single point of failure'], at: 'sto' }, { path: 'a_n', dir: 1, stop: 0.5 }, { path: 'b_n', dir: 1, stop: 0.5, par: true }, { path: 'c_n', dir: 1, stop: 0.5, par: true }],
        srv: ld => ld(1) ? { A: ['✕ not responding', 'waiting for NAS', 'bad'], B: ['✕ not responding', 'waiting for NAS', 'bad'], C: ['✕ not responding', 'waiting for NAS', 'bad'] } : { A: ['reading…', '', 'hi'], B: ['reading…', '', 'hi'], C: ['reading…', '', 'hi'] }, sto: ld => ({ nas: ld(0) ? 'off' : 'file' }),
        data: () => TABLE() },
    ],
    block: [
      { title: 'A virtual disk, tied to one server', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'In the cloud, the store creates a 100 GB block volume (like AWS EBS; in a data center, a SAN LUN over iSCSI or Fibre Channel). It sits somewhere else in the data center, but it is attached to server A and shows up as a disk: /dev/nvme1n1. A formats it as ext4 and mounts it at /dados.',
        look: 'The volume is the big plate on the right, covered in numbered cells: each cell is a 4 KB block.',
        key: 'Block storage: a raw disk, split into numbered blocks, handed to one server.',
        cmd: { who: 'in the cloud console', code: 'aws ec2 attach-volume --volume-id vol-0a1b2c --instance-id i-A --device /dev/sdf', out: '→ "State": "attaching"' },
        legs: [{ path: 'a_v', dir: 1, card: ['volume attached to A', 'acc', 'shows up as /dev/nvme1n1'], at: 'sto' }],
        srv: ld => ({ A: ld(0) ? ['new disk', '/dev/nvme1n1', 'ok'] : ['attaching…', '', 'hi'], B: IDLE }), sto: { cells: 0 },
        data: () => '<li>Volume: <b>vol-0a1b2c</b> · 100 GB · 4 KB blocks → 26,214,400 blocks</li><li>On server A: <b>/dev/nvme1n1</b>, ext4, mounted at <b>/dados</b></li><li>Underneath, the volume travels over the data center network, but the server sees it as a local disk.</li>' },
      { title: 'The photo becomes 600 blocks', focus: 'vol', zoom: 0.55, ph0: 'A',
        story: 'The program writes gato.jpg as on any disk. But the volume does not understand files. The one who cuts the photo up is server A\'s file system: 2,457,600 bytes ÷ 4096 = 600 blocks of 4 KB. It picks where each block will live and sends requests like "write these 4 KB to block 2048".',
        look: 'The photo reaches the volume and breaks into little cubes that drop into cells 2048, 2049, 2050…',
        key: 'The file system, on the server, is what splits the file into blocks.',
        cmd: { who: 'on server A', code: 'write(fd, buf, 2457600)', out: '→ ext4 sends WRITE to blocks 2048 … 2647 (600 × 4 KB)' },
        legs: [{ path: 'a_v', dir: 1, carry: true, ph: 'vol', card: ['write gato.jpg', 'acc', `${SIZE} bytes`], at: 'sto' }, { blocks: 12, card: ['600 blocks of 4 KB', 'acc', 'cells 2048 to 2647'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['write ✓', '600 blocks', 'ok'] : ['writing…', 'ext4', 'hi'], B: IDLE }), sto: { cells: 'blocks' },
        data: () => `<li>${SIZE} bytes ÷ 4096 = exactly <b>600 blocks</b></li><li>Blocks picked by ext4: <b>2048 to 2647</b> (consecutive, one single run)</li><li>Cells in view on the grid: 2048 to 2062; the rest continues to 2647.</li>` },
      { title: 'The volume does not know it is a photo', focus: 'vol', zoom: 0.5, ph0: null,
        story: 'Look at what the volume stored. Block 2048 starts with the bytes FF D8 FF E0: that is the signature of every JPEG file, but the volume does not know that. Inside there is no name, folder, owner or "cat". Just 600 boxes of 4 KB with bytes, each with its own number: the LBA (logical block address).',
        look: 'Cell 2048 stands out with the first bytes. No cell says "gato.jpg".',
        key: 'The volume stores numbered blocks; the meaning lives outside it.',
        cmd: { who: 'the request that reaches the volume', code: 'WRITE  LBA 2048  4096 bytes\nFF D8 FF E0 00 10 4A 46 49 46 …', out: '→ OK (and nothing else: no name, no type)' },
        legs: [{ pulse: 'vol', hot: true, card: ['LBA 2048: FF D8 FF E0 …', 'acc', 'bytes, no name or type'], at: 'sto' }],
        srv: { A: ['gato.jpg', 'at /dados', 'ok'], B: IDLE }, sto: { cells: SHOWN, hot: MINE0 },
        data: () => '<li><b>FF D8</b> = start of a JPEG image · <b>FF E0</b> = start of the JFIF header · <b>4A 46 49 46</b> = the letters "JFIF"</li><li>The program that opens the photo understands these bytes, not the volume.</li><li>Here the volume uses 4 KB sectors, so each LBA = 1 block of 4 KB. On disks with 512-byte sectors, each block takes 8 LBAs.</li>' },
      { title: 'Who knows where the photo is: the file system', focus: 'vol', zoom: 0.55, ph0: null,
        story: 'So how does A find the photo again? ext4 keeps a map on the volume itself: inode 1311 says "gato.jpg is 2,457,600 bytes and takes blocks 2048 to 2647". When opening the file, A reads the inode and asks for exactly those blocks.',
        look: 'A light connects server A to the blocks, which light up together.',
        key: 'File = file system map (inode) + blocks on the volume.',
        cmd: { who: 'on server A', code: 'filefrag -v /dados/produtos/gato.jpg', out: '→ ext 0: physical 2048..2647  length 600' },
        legs: [{ path: 'a_v', dir: 1, card: ['inode 1311 → blocks 2048..2647', 'acc', 'the map stays on the server'], at: 'sto' }, { path: 'a_v', dir: -1, card: ['READ 2048 … 2647', 'acc', 'only the photo\'s blocks'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['read ✓', 'inode 1311', 'ok'] : ['reading the inode…', '', 'hi'], B: IDLE }), sto: { cells: SHOWN },
        data: () => '<li>Inode <b>1311</b>: name gato.jpg · owner loja · 2,457,600 bytes · blocks <b>2048–2647</b></li><li>All of this belongs to ext4, written in other blocks of the same volume. The volume just stores.</li>' },
      { title: 'Changing just one piece: 4 KB and done', focus: 'vol', zoom: 0.5, ph0: null,
        story: 'The store fixes a value at the start of the photo (the EXIF header). On a block volume, rewriting one block is enough, block 2048; the other 599 stay as they are. This is how a database works: it rewrites small pages in the middle of huge files, at random positions, in under 1 ms. That is why databases run on block storage.',
        look: 'A single new cube drops into cell 2048. The other cells do not change.',
        key: 'Block storage is best for random writes and low latency: databases and VM disks.',
        cmd: { who: 'on server A', code: 'pwrite(fd, buf, 4096, 0)', out: '→ WRITE LBA 2048 · 1 block · ~0.5 ms (example)' },
        legs: [{ path: 'a_v', dir: 1, card: ['rewrites only block 2048', 'acc', '4 KB · the other 599 stay'], at: 'sto' }, { blocks: 1, hot: true }],
        srv: ld => ({ A: ld(1) ? ['pwrite ✓', '1 block', 'ok'] : ['writing 4 KB…', '', 'hi'], B: IDLE }), sto: ld => ({ cells: SHOWN, hot: ld(1) ? MINE0 : -1 }),
        data: () => '<li>pwrite(fd, buf, 4096, 0) = "write 4 KB starting at byte 0 of the file"</li><li>ext4 translates: byte 0 of the file → block <b>2048</b> of the volume.</li><li>A database like PostgreSQL does this all the time with 8 KB pages.</li>' },
      { title: 'Server B tries to attach the same volume', focus: 'mid', zoom: 1, ph0: null, fail: true,
        story: 'Server B also wants the photo and tries to attach the same volume. The cloud refuses: it is already attached to A. And even where two attachments are possible (SAN, EBS Multi-Attach), two ext4 file systems writing to the same disk without coordinating wreck each other\'s map. To share, the way is file or object storage.',
        look: 'B\'s light stops halfway with a ✕. The blocks stay with A.',
        key: 'A block volume has one owner at a time.',
        cmd: { who: 'in the cloud console', code: 'aws ec2 attach-volume --volume-id vol-0a1b2c --instance-id i-B --device /dev/sdf', out: '→ VolumeInUse: vol-0a1b2c is already attached to an instance' },
        legs: [{ path: 'b_v', dir: 1, stop: 0.55, card: ['✕ VolumeInUse', 'acc', 'the volume is A\'s'], at: 'b' }],
        srv: ld => ({ A: ['volume owner', '/dev/nvme1n1', 'ok'], B: ld(0) ? ['✕ VolumeInUse', 'no access', 'bad'] : ['attaching…', '', 'hi'] }), sto: { cells: SHOWN },
        data: () => TABLE() },
    ],
    file: [
      { title: 'A shared folder tree', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Now the store uses a managed file storage (like AWS EFS, which speaks NFS). It keeps things the way we know them: folders inside folders. The photo will live at /produtos/gatos/gato.jpg. The three servers mount the same tree at /mnt/efs.',
        look: 'On the right, the tree: / → produtos → gatos → gato.jpg, with backups and cachorros beside it.',
        key: 'File storage: files in a folder hierarchy, found by path.',
        cmd: { who: 'on servers A, B and C', code: 'mount -t nfs4 fs-0a1b.efs.sa-east-1.amazonaws.com:/ /mnt/efs', out: '→ (no output = mounted at /mnt/efs)' },
        legs: [{ path: 'a_f', dir: 1, carry: true, ph: 'tree', card: ['saved in /produtos/gatos/', 'acc', 'gato.jpg'], at: 'sto' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', '/mnt/efs/…', 'ok'] : ['writing…', '', 'hi'], B: ['/mnt/efs', 'mounted', 'hi'], C: ['/mnt/efs', 'mounted', 'hi'] }), sto: { walk: 0 },
        data: () => '<li>Tree: <b>/</b> → <b>produtos</b> → <b>gatos</b> → <b>gato.jpg</b>; beside it, <b>backups</b> and <b>cachorros</b></li><li>At each level, a name is unique: there cannot be two "gatos" inside produtos.</li><li>Underneath, EFS stores everything in blocks; what it hands you is the tree.</li>' },
      { title: 'Opening means walking folder by folder', focus: 'tree', zoom: 0.55, ph0: 'tree',
        story: 'Server A asks for /mnt/efs/produtos/gatos/gato.jpg. The system does not jump straight to the photo: it opens the root /, looks for "produtos" inside, then "gatos", then "gato.jpg". In each folder it checks whether the server may enter (the x in rwx).',
        look: 'The folders light up one by one, from the root to the photo, each with its permission.',
        key: 'A path is a line of folders: each one is looked up and checked.',
        cmd: { who: 'on server A', code: 'open("/mnt/efs/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ LOOKUP / → produtos → gatos → gato.jpg · fd = 3' },
        legs: [{ path: 'a_f', dir: 1, card: ['LOOKUP folder by folder', 'acc', '/ → produtos → gatos → gato.jpg'], at: 'net' }, { walk: true, card: ['permission ok at every level', 'acc', 'drwxr-xr-x: may enter'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['open ✓ · fd 3', '4 folders', 'ok'] : ['searching…', 'LOOKUP', 'hi'], B: ['/mnt/efs', 'mounted', 'hi'], C: ['/mnt/efs', 'mounted', 'hi'] }), sto: { walk: 'walk' },
        data: () => '<li>/ <b>drwxr-xr-x</b> root · produtos <b>drwxr-xr-x</b> loja · gatos <b>drwxr-xr-x</b> loja · gato.jpg <b>-rw-r--r--</b> loja</li><li>The <b>x</b> on a folder is the permission to pass through it. Only root can pass through backups (<b>drwx------</b>).</li><li>Each level is a LOOKUP query to the NFS server; the client caches the answers.</li>' },
      { title: 'Every file carries file metadata', focus: 'tree', zoom: 0.5, ph0: 'tree',
        story: 'When we reach the photo, what the system knows about it comes along: owner loja, group web, permission rw-r--r--, 2,457,600 bytes, modified on Oct 14 at 10:02. They are always the same fields, for any file. You cannot hang a label of your own on it, like "product 4521".',
        look: 'The gato.jpg folder lights up and shows owner, permission, size and date.',
        key: 'File metadata is fixed: owner, permission, size, dates.',
        cmd: { who: 'on server A', code: 'stat /mnt/efs/produtos/gatos/gato.jpg', out: '→ Size: 2457600  Access: (0644/-rw-r--r--)  Uid: loja  Modify: 2026-10-14 10:02' },
        legs: [{ pulse: 'foto', meta: true, card: ['loja · rw-r--r-- · 2.4 MB', 'acc', 'modified Oct 14 10:02'], at: 'sto' }],
        srv: { A: ['stat ✓', 'owner loja', 'ok'], B: ['/mnt/efs', 'mounted', 'hi'], C: ['/mnt/efs', 'mounted', 'hi'] }, sto: { walk: 4, meta: true },
        data: () => '<table class="h3-sum"><tr><th>Field</th><th>Value</th></tr><tr><td>owner / group</td><td>loja / web</td></tr><tr><td>permission</td><td>-rw-r--r-- (0644)</td></tr><tr><td>size</td><td>2,457,600 bytes</td></tr><tr><td>modified</td><td>2026-10-14 10:02</td></tr><tr><td>inode</td><td>1311</td></tr></table><li class="h3-dim">Example values.</li>' },
      { title: 'B and C open the same path', focus: 'mid', zoom: 1, ph0: 'tree',
        story: 'B and C do the same open and get the same photo. As with the NAS, the data is in one place, and whoever has the tree mounted can see it. Each read goes over the network (a few milliseconds), but nobody needs to copy anything.',
        look: 'Two lights leave the tree: one to B, one to C.',
        key: 'File storage is built to be shared by many servers.',
        cmd: { who: 'on servers B and C', code: 'open("/mnt/efs/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ fd = 3 · the same photo' },
        legs: [{ path: 'b_f', dir: -1, card: ['B and C read gato.jpg', 'acc', 'same path, same file'], at: 'net' }, { path: 'c_f', dir: -1, par: true }],
        srv: ld => ({ A: ['gato.jpg', 'ok', 'ok'], B: ld(0) ? ['read ✓', 'gato.jpg', 'ok'] : ['reading…', '', 'hi'], C: ld(1) ? ['read ✓', 'gato.jpg', 'ok'] : ['reading…', '', 'hi'] }), sto: { walk: 4 },
        data: () => '<li>A NAS is the device; file storage is the way of organizing (folders and files). A NAS delivers file storage; so does EFS, as a service.</li><li>Typical latency: a few ms per operation (example).</li>' },
      { title: 'Two want to edit: the lock', focus: 'mid', zoom: 1, ph0: 'tree', fail: true,
        story: 'A starts rewriting the photo and takes an exclusive lock. Right after, B tries to edit the same file. The file system holds B back: it waits until A releases the lock. Without it, both would write over each other and the photo would come out mixed up.',
        look: 'The photo gets the "LOCK · A" tag. B\'s light stops before arriving and its screen says "waiting".',
        key: 'File storage has locks: many can read, one writes at a time.',
        cmd: { who: 'on server B', code: 'flock(fd, LOCK_EX)', out: '→ … blocked: server A holds the lock' },
        legs: [{ path: 'a_f', dir: 1, lock: true, card: ['A takes the lock (LOCK_EX)', 'acc', 'is editing'], at: 'sto' }, { path: 'b_f', dir: 1, stop: 0.6, card: ['✕ B waits', 'acc', 'gato.jpg locked by A'], at: 'net' }],
        srv: ld => ({ A: ld(0) ? ['LOCK ✓', 'editing', 'ok'] : ['flock()…', '', 'hi'], B: ld(1) ? ['⏳ waiting', 'A\'s lock', 'bad'] : IDLE, C: ['read ok', 'reads are free', 'hi'] }), sto: ld => ({ walk: 4, lock: ld(0) }),
        data: () => '<li><b>LOCK_EX</b> = exclusive (only one). <b>LOCK_SH</b> = shared (many readers).</li><li>In NFS v4, locks live on the server and expire if the client disappears (lease).</li>' },
      { title: 'Renaming the folder: one single operation', focus: 'tree', zoom: 0.55, ph0: 'tree',
        story: 'The store decides to change "gatos" to "felinos". In a file storage this is a single change, on the folder: everything inside comes along, instantly, whether it is 1 photo or 1 million. Keep this in mind: object storage has no real folders, and the same change becomes copying object by object.',
        look: 'The "gatos" folder is now named "felinos"; the photo is still inside it.',
        key: 'A real hierarchy makes moving and renaming folders cheap.',
        cmd: { who: 'on server A', code: 'rename("/mnt/efs/produtos/gatos", "/mnt/efs/produtos/felinos")', out: '→ 0 (ok) · 1 operation, whatever the size' },
        legs: [{ pulse: 'gatos', rename: true, card: ['gatos → felinos', 'acc', '1 operation'], at: 'sto' }],
        srv: { A: ['rename ✓', '1 operation', 'ok'], B: ['gato.jpg', 'now in felinos', 'hi'], C: ['gato.jpg', 'now in felinos', 'hi'] }, sto: ld => ({ walk: 4, rename: ld(0) }),
        data: () => TABLE() },
    ],
    object: [
      { title: 'A bucket of objects', focus: 'bucket', zoom: 0.7, ph0: 'A',
        story: 'Finally, the store keeps the photo in an object storage (like Amazon S3, Google Cloud Storage or MinIO). The place is called a bucket: loja-fotos. Inside there are no folders or blocks in sight; there are objects, each with a key (the name), the data and metadata. Everything is done over HTTP.',
        look: 'The bucket on the right already has a few objects: a backup, a log, the dog photo.',
        key: 'Object storage: whole objects, with key and metadata, in a bucket, over HTTP.',
        cmd: { who: 'on server A', code: 'aws s3 mb s3://loja-fotos', out: '→ make_bucket: loja-fotos' },
        legs: [{ pulse: 'obj', card: ['bucket loja-fotos', 'acc', 'loose objects, no folders'], at: 'bk' }],
        srv: { A: ['I have the photo', 'gato.jpg', 'ok'], B: IDLE }, sto: { obj: false },
        data: () => '<li>Bucket: <b>loja-fotos</b>, region sa-east-1 (example)</li><li>Objects already there: backups/2026-10-13.tar.gz · logs/2026-10-14/app.json.gz · produtos/cachorros/rex.jpg · produtos/gatos/mimi.jpg</li><li>Service examples: Amazon S3, Azure Blob Storage, Google Cloud Storage, MinIO, Ceph.</li>' },
      { title: 'PUT: the photo goes whole, with labels', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Server A sends an HTTP PUT request to the object\'s URL. The body carries the 2,457,600 bytes; the headers carry the metadata: the type (image/jpeg) and the store\'s own labels, like produto=4521. The bucket stores everything together and replies with an ETag, the content\'s fingerprint.',
        look: 'The photo makes a high arc (it is HTTPS) and lands in the bucket, next to the other objects.',
        key: 'Write = PUT the whole object to a URL.',
        cmd: { who: 'on server A', code: `PUT ${URL}\nContent-Type: image/jpeg\nx-amz-meta-produto: 4521`, out: `→ 200 OK · ETag: ${ETAG1}` },
        legs: [{ path: 'a_o', dir: 1, carry: true, ph: 'bucket', card: ['PUT · HTTPS', 'acc', `${SIZE} bytes + metadata`], at: 'sky' }],
        srv: ld => ({ A: ld(0) ? ['200 OK', 'ETag 9b2c…', 'ok'] : ['PUT…', 'HTTPS', 'hi'], B: IDLE }), sto: ld => ({ obj: ld(0) }),
        data: () => `<li>Method: <b>PUT</b> · URL: <b>${URL}</b></li><li>Content-Type: <b>${MIME}</b> · Content-Length: <b>2457600</b></li><li>x-amz-meta-produto: <b>4521</b> (your own metadata, free-form)</li><li>Response: <b>200 OK</b> · ETag ${ETAG1} (example)</li>` },
      { title: 'The key has slashes, but there are no folders', focus: 'bucket', zoom: 0.55, ph0: 'bucket',
        story: '"produtos/gatos/gato.jpg" looks like a path, but it is just the object\'s name, a string. The bucket is flat: all objects sit side by side. When you list "produtos/gatos/", S3 filters the keys that start with that text (the prefix). No walking folder by folder: each object is found directly by its key.',
        look: 'The photo is on the same floor as the backup and the log. The label shows the full key and the metadata.',
        key: 'The key is the full name; a "folder" is just the start of the name (prefix).',
        cmd: { who: 'on server A', code: 'GET https://loja-fotos.s3.amazonaws.com/?list-type=2&prefix=produtos/gatos/', out: '→ <Key>produtos/gatos/gato.jpg</Key> <Key>produtos/gatos/mimi.jpg</Key>' },
        legs: [{ pulse: 'photo' }],
        srv: { A: ['list ✓', '2 keys', 'ok'], B: IDLE }, sto: { obj: true, meta: true },
        data: () => `<table class="h3-sum"><tr><th>Field</th><th>Value</th></tr><tr><td>key</td><td>produtos/gatos/gato.jpg</td></tr><tr><td>size</td><td>${SIZE} bytes</td></tr><tr><td>Content-Type</td><td>${MIME}</td></tr><tr><td>x-amz-meta-produto</td><td>4521</td></tr><tr><td>tag</td><td>categoria=gatos</td></tr><tr><td>ETag</td><td>9b2cf535…</td></tr></table><li>Rich metadata: you invent whatever fields you want.</li>` },
      { title: 'GET: anyone with the URL and permission', focus: 'mid', zoom: 1, ph0: 'bucket',
        story: 'Server B mounts nothing: it does a GET on the same URL and gets the photo. The customer\'s browser can do the same, directly or through a CDN. Each request takes tens of milliseconds, more than a disk, but the bucket handles billions of objects and thousands of simultaneous requests.',
        look: 'Lights leave the bucket for A and for B, along the same high HTTPS arc.',
        key: 'Read = GET on the URL; no need to mount a disk or a folder.',
        cmd: { who: 'on server B (or in the browser)', code: `GET ${URL}`, out: `→ 200 OK · Content-Type: ${MIME} · 2457600 bytes · ~30 ms (example)` },
        legs: [{ path: 'b_o', dir: -1, card: ['GET → 200 OK', 'acc', 'the whole photo, ~30 ms'], at: 'sky' }, { path: 'a_o', dir: -1, par: true }],
        srv: ld => ({ A: ld(1) ? ['GET ✓', '200 OK', 'ok'] : ['GET…', '', 'hi'], B: ld(0) ? ['GET ✓', '200 OK', 'ok'] : ['GET…', '', 'hi'] }), sto: { obj: true },
        data: () => '<li>Who can read is decided by permissions (bucket policies) or by a signed URL that expires.</li><li>First byte in tens of ms (example); the advantage is scale and price, not latency.</li>' },
      { title: 'What if I want to change just one piece?', focus: 'mid', zoom: 1, ph0: 'bucket', fail: true,
        story: 'The store wants to fix only the EXIF header, the same 4 KB that on a block volume we could just rewrite. In object storage you cannot write into the middle of an object: there is no "write 4 KB at position 0". A sends the whole photo again, 2.4 MB, in a new PUT, and the object is replaced in one go (the old version disappears or becomes history, if versioning is on).',
        look: 'A 4 KB cube tries to enter the object and is refused (✕). Then the whole photo travels again and the ETag changes.',
        key: 'An object is not edited in pieces: to change 4 KB, replace the whole object.',
        cmd: { who: 'on server A', code: `PUT ${URL}\n(the 2,457,600 bytes again)`, out: `→ 200 OK · ETag: ${ETAG2}` },
        legs: [{ path: 'a_o', dir: 1, stop: 0.85, card: ['✕ no "write 4 KB in the middle"', 'acc', 'only the whole object'], at: 'sky' }, { path: 'a_o', dir: 1, carry: 'copy', ph2: 'bucket', card: ['whole PUT again', 'acc', '2.4 MB · new ETag'], at: 'sky' }],
        srv: ld => ({ A: ld(1) ? ['200 OK', 'ETag e4d9…', 'ok'] : ld(0) ? ['✕ no pieces', 'whole PUT', 'bad'] : ['edit 4 KB…', '', 'hi'], B: IDLE }), sto: ld => ({ obj: true, v2: ld(1) }),
        data: () => `<li>Before: ETag ${ETAG1}</li><li>After: ETag ${ETAG2} (example)</li><li>4 KB changed, but 2,457,600 bytes were uploaded again.</li><li>With versioning on, the previous version stays stored (and billed).</li>` },
      { title: 'When the object is the right choice', focus: 'bucket', zoom: 0.7, ph0: 'bucket',
        story: 'Photos, videos, backups, logs, data files: big things, written once and read many times, that need to fit by the millions. Object storage scales almost without limit, charges little per GB and replicates the data across zones by itself. It does not suit a database (random writes) or anyone who needs folders and locks.',
        look: 'The bucket with its objects and the photo inside; the servers only do PUT and GET.',
        key: 'Lots of data and little editing: object storage.',
        cmd: { who: 'on server B', code: 'aws s3 cp s3://loja-fotos/produtos/gatos/gato.jpg .', out: '→ download: s3://loja-fotos/produtos/gatos/gato.jpg to ./gato.jpg' },
        legs: [{ pulse: 'obj', card: ['billions of objects', 'acc', 'cheap per GB · automatic replicas'], at: 'bk' }],
        srv: { A: ['PUT / GET', 'over HTTP', 'ok'], B: ['PUT / GET', 'over HTTP', 'ok'] }, sto: { obj: true, v2: true },
        data: () => TABLE() },
    ],
  };
  const ids = () => STEPS[sc], N = () => ids().length, cur = () => ids()[step];
  const val = (v, ld) => typeof v === 'function' ? v(ld) : v;

  const LEG = 1.5, PAUSE = 0.45, PRE = 0.35;
  function timeline() { let t = PRE, prev = null;
    const out = cur().legs.map(l => { const d = l.pulse ? 1.0 : l.blocks ? (l.blocks > 1 ? 1.8 : 1.0) : l.walk ? 2.2 : LEG;
      const t0 = l.par && prev ? prev.t0 : t, o = { ...l, t0, t1: t0 + d }; if (!l.par) t = o.t1 + PAUSE; prev = o; return o; });
    return { legs: out, end: Math.max(t, 1.4) }; }
  let TL = timeline();
  const legDone = i => !TL.legs[i] || lt >= TL.legs[i].t1;
  const legF = l => Math.max(0, Math.min(1, (lt - l.t0) / (l.t1 - l.t0)));

  // ── painel ──
  const cmdHtml = c => `<div class="s3-cmd"><b>How the program asks for the photo</b><i>${c.who}</i><code>${esc(c.code)}</code><span>${esc(c.out)}</span></div>`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function nowHtml() { const s = cur(); return s.data(); }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Storage type">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCBTN[v]}</button>`).join('')}</div>
      ${cmdHtml(s.cmd)}
      <h2>${s.title}</h2>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="stonow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'storage') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · gato.jpg 2.4 MB`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'storage' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    const back = document.querySelector('.o3-back'); if (back) back.setAttribute('href', '../#' + LESSON[sc]);
    readout();
  }
  function applyVis() { const on = new Set(VIS[sc]); for (const [k, g] of Object.entries(GRP)) g.visible = on.has(k) || (k[0] === 'p' && on.has(k.slice(1))); }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; TL = timeline(); keys.clear(); render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { if (!SC.includes(v)) return false; sc = v; try { localStorage.setItem('sdlabs-storage3d-sc', v); } catch (e) {}
    applyVis(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'storage') setSc(b.dataset.sc); });
  const goId = id => { if (id === 'sto' || id === 'net') { const i = ids().findIndex((s, k) => k > step && !s.fail); return go(i >= 0 ? i : step); }
    if (id === 'srvB' || id === 'srvC') { const i = ids().findIndex(s => s.fail); return go(i >= 0 ? i : step); } return go(0); };

  // ── telas ──
  const keys = new Map();
  const bgFill = (x, cv) => { x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); };
  const colors = () => { const C = pal3(), A_ = '#' + accent.getHexString(); return { C, A_, acc: theme === 'light' ? C.hi : A_ }; };
  function drawSrv(k, S) {
    const key = k + JSON.stringify(S) + theme; if (keys.get('s' + k) === key) return; keys.set('s' + k, key);
    const cv = SRV[k].scr, { x, P } = cv, { C, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = C.ink; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('SERVER', u(34), u(9));
    x.fillStyle = C.inkHi; x.font = `600 ${u(17)}px ${MONO3}`; x.fillText(k, u(34), u(26));
    x.strokeStyle = C.detail; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(6), u(38)); x.lineTo(u(62), u(38)); x.stroke();
    const hot = S[2] === 'ok' || S[2] === 'bad';
    x.fillStyle = hot ? acc : S[2] === 'dim' ? C.ink : C.inkHi; x.font = `600 ${u(S[0].length > 13 ? 5.2 : 6.2)}px ${MONO3}`; x.fillText(S[0], u(34), u(48));
    x.fillStyle = C.ink; x.font = `${u(S[1].length > 15 ? 4.6 : 5.4)}px ${MONO3}`; x.fillText(S[1], u(34), u(60));
    cv.tex.needsUpdate = true;
  }
  function drawDisk(st) {
    const key = st + theme; if (keys.get('disk') === key) return; keys.set('disk', key);
    const cv = diskScr, { x, P } = cv, { C, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = C.inkHi; x.font = `600 ${u(5.4)}px ${MONO3}`; x.fillText('SSD NVMe', u(24), u(7));
    x.fillStyle = C.ink; x.font = `${u(4.2)}px ${MONO3}`; x.fillText('1 TB · /data', u(24), u(14));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(19)); x.lineTo(u(44), u(19)); x.stroke();
    x.fillStyle = st === 'file' ? acc : C.ink; x.font = `${st === 'file' ? 600 : 400} ${u(4.4)}px ${MONO3}`;
    x.fillText(st === 'file' ? 'gato.jpg' : '(empty)', u(24), u(25)); if (st === 'file') { x.font = `${u(3.8)}px ${MONO3}`; x.fillText('2.4 MB', u(24), u(32)); }
    cv.tex.needsUpdate = true;
  }
  function drawSwitch(on) {
    const key = on + theme; if (keys.get('sw') === key) return; keys.set('sw', key);
    const cv = swScr, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('SWITCH · network', u(5), u(8));
    for (let i = 0; i < 8; i++) { x.beginPath(); x.roundRect(u(5 + i * 12), u(16), u(9), u(9), u(1.5)); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.stroke();
      if (on && i < 4) { x.fillStyle = A_; x.globalAlpha = 0.7; x.fill(); x.globalAlpha = 1; } }
    cv.tex.needsUpdate = true;
  }
  function drawNas(st) {
    const key = st + theme; if (keys.get('nas') === key) return; keys.set('nas', key);
    const cv = nasScr, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P, off = st === 'off';
    bgFill(x, cv); x.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) { const x0 = 4 + i * 16; x.beginPath(); x.roundRect(u(x0), u(6), u(13), u(58), u(2)); x.strokeStyle = C.line; x.lineWidth = u(0.5); x.stroke();
      for (let j = 0; j < 5; j++) { x.beginPath(); x.moveTo(u(x0 + 3), u(14 + j * 4)); x.lineTo(u(x0 + 10), u(14 + j * 4)); x.strokeStyle = C.detail; x.stroke(); }
      x.beginPath(); x.arc(u(x0 + 6.5), u(56), u(2), 0, 7); x.fillStyle = off ? C.detail : A_; x.fill(); }
    x.textAlign = 'left'; x.fillStyle = off ? C.ink : C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('NAS', u(72), u(12));
    x.fillStyle = C.ink; x.font = `${u(4.8)}px ${MONO3}`; x.fillText('nas.loja', u(72), u(22)); x.fillText('/export/fotos', u(72), u(31));
    x.fillStyle = off ? acc : st === 'file' ? acc : C.ink; x.font = `600 ${u(5)}px ${MONO3}`;
    x.fillText(off ? '✕ no power' : st === 'file' ? 'gato.jpg' : '(empty)', u(72), u(46)); if (st === 'file') { x.font = `${u(4.4)}px ${MONO3}`; x.fillText('2.4 MB', u(72), u(55)); }
    cv.tex.needsUpdate = true;
  }
  function drawVol(lit, hot) {
    const key = lit + '|' + hot + theme; if (keys.get('vol') === key) return; keys.set('vol', key);
    const cv = volScr, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'center';
    for (let i = 0; i < COLS * ROWS; i++) { const c = i % COLS, r = (i / COLS) | 0, x0 = c * CW + 1.2, y0 = r * CH + 1.2, w = CW - 2.4, h = CH - 2.4;
      const lba = LBA0 + i, mine = i >= MINE0 && i - MINE0 < lit, other = i < MINE0;
      x.beginPath(); x.roundRect(u(x0), u(y0), u(w), u(h), u(2));
      if (other) { x.fillStyle = theme === 'light' ? '#dcdddd' : '#26292b'; x.fill(); }
      if (mine) { x.fillStyle = A_; x.globalAlpha = i === hot ? 0.55 : 0.22; x.fill(); x.globalAlpha = 1; }
      x.strokeStyle = mine ? A_ : C.line; x.lineWidth = u(i === hot ? 1.2 : 0.4); x.stroke();
      x.fillStyle = mine ? acc : C.ink; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(lba, u(x0 + w / 2), u(y0 + 10));
      x.font = `${u(6)}px ${MONO3}`; x.fillStyle = mine ? (i === hot ? C.inkHi : acc) : C.ink;
      if (i === hot) { x.font = `600 ${u(6.4)}px ${MONO3}`; x.fillText('FF D8', u(x0 + w / 2), u(y0 + 21)); x.fillText('FF E0…', u(x0 + w / 2), u(y0 + 29)); }
      else x.fillText(mine ? '4 KB' : other ? 'others' : 'free', u(x0 + w / 2), u(y0 + 23)); }
    cv.tex.needsUpdate = true;
  }
  function drawNode(k, st) {
    const key = k + JSON.stringify(st) + theme; if (keys.get('n' + k) === key) return; keys.set('n' + k, key);
    const N0 = NODES[k], cv = N0.scr, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'center';
    if (st.on) { x.strokeStyle = A_; x.lineWidth = u(1.4); x.strokeRect(u(0.7), u(0.7), u(58.6), u(38.6)); }
    const name = k === 'gatos' && st.rename ? 'felinos' : N0.n;
    x.fillStyle = st.on ? acc : C.inkHi; x.font = `600 ${u(name.length > 8 ? 8.4 : 10)}px ${MONO3}`; x.fillText((N0.file ? '' : '/') + name, u(30), u(9));
    x.fillStyle = st.on ? C.inkHi : C.ink; x.font = `${u(6.4)}px ${MONO3}`;
    if (st.meta) { x.fillText(N0.perm, u(30), u(19)); x.fillText('loja · 2.4 MB', u(30), u(27)); x.fillText('Oct 14 10:02', u(30), u(34)); }
    else { x.fillText(N0.perm, u(30), u(20)); x.fillText('owner ' + N0.own, u(30), u(29)); }
    if (st.lock) { x.fillStyle = acc; x.font = `600 ${u(6.4)}px ${MONO3}`; x.fillText('LOCK · A', u(30), u(36)); }
    cv.tex.needsUpdate = true;
  }
  function drawBucket(has, v2) {
    const key = has + '|' + v2 + theme; if (keys.get('bk') === key) return; keys.set('bk', key);
    const cv = bkScr, { x, P } = cv, { C, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('loja-fotos · keys (flat list)', u(5), u(6));
    const K = OBJS.map(o => o.k); if (has) K.push('produtos/gatos/gato.jpg');
    K.forEach((k, i) => { const mine = k.endsWith('gato.jpg'); x.fillStyle = mine ? acc : C.ink; x.font = `${mine ? 600 : 400} ${u(5.4)}px ${MONO3}`;
      x.fillText(k + (mine && v2 ? '  (v2)' : ''), u(5 + (i % 2) * 112), u(16 + ((i / 2) | 0) * 9)); });
    cv.tex.needsUpdate = true;
  }
  function drawCat(ph, v2) {
    const key = 'cat' + v2 + theme; if (keys.get(ph === PHOTO ? 'p1' : 'p2') === key) return; keys.set(ph === PHOTO ? 'p1' : 'p2', key);
    const cv = ph.cv, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P;
    x.fillStyle = C.glassOn; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = acc; x.lineWidth = u(1.3); x.lineJoin = 'round';
    const cx = 18, cy = 17;                                                   // cabeça, orelhas, olhos, focinho, bigodes
    x.beginPath(); x.moveTo(u(cx - 10), u(cy - 3)); x.lineTo(u(cx - 9), u(cy - 13)); x.lineTo(u(cx - 3), u(cy - 8));
    x.lineTo(u(cx + 3), u(cy - 8)); x.lineTo(u(cx + 9), u(cy - 13)); x.lineTo(u(cx + 10), u(cy - 3));
    x.quadraticCurveTo(u(cx + 12), u(cy + 9), u(cx), u(cy + 9)); x.quadraticCurveTo(u(cx - 12), u(cy + 9), u(cx - 10), u(cy - 3)); x.closePath();
    x.globalAlpha = 0.18; x.fillStyle = A_; x.fill(); x.globalAlpha = 1; x.stroke();
    x.fillStyle = C.inkHi; [[-4.5, -1], [4.5, -1]].forEach(([dx, dy]) => { x.beginPath(); x.ellipse(u(cx + dx), u(cy + dy), u(1.4), u(2.2), 0, 0, 7); x.fill(); });
    x.fillStyle = acc; x.beginPath(); x.moveTo(u(cx - 1.5), u(cy + 3)); x.lineTo(u(cx + 1.5), u(cy + 3)); x.lineTo(u(cx), u(cy + 4.6)); x.closePath(); x.fill();
    x.lineWidth = u(0.5); x.strokeStyle = C.inkHi; [[-1, 1], [1, 1]].forEach(([s]) => { for (const dy of [-0.8, 1]) { x.beginPath(); x.moveTo(u(cx + s * 3), u(cy + 4)); x.lineTo(u(cx + s * 13), u(cy + 3 + dy * 2)); x.stroke(); } });
    x.fillStyle = C.inkHi; x.font = `600 ${u(4.2)}px ${MONO3}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(v2 ? 'gato.jpg · v2' : 'gato.jpg', u(18), u(32.5));
    cv.tex.needsUpdate = true;
  }

  // ── um quadro da cena ──
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const PHP = { A: [70, 208, 182], B: [260, 208, 182], C: [390, 208, 182], disk: [151, 208, 58], nas: [OX + 535, 73, 124], vol: [OX + 545, 84, 64], tree: [OX + 658, 32, 58], bucket: [OX + 555, 104, 40] };
  const AT = { srv: [160, 208, 127, 135], b: [260, 208, 127, 113], disk: [90, 268, 7, 26], sto: [OX + 545, 80, 30, 150], net: [505, 196, 25, 95], sky: [330, 150, 130, 170], bk: [OX + 600, 20, 100, 110] };
  const AT_M = { srv: [200, 190, 127, 150], b: [260, 190, 127, 140], disk: [200, 190, 27, 230], sto: [OX + 520, 80, 30, 185], net: [480, 190, 25, 175], sky: [350, 150, 130, 200], bk: [OX + 580, 20, 100, 150] };
  const at = k => { const a = (innerWidth < 640 ? AT_M : AT)[k]; return [a[0], a[1], a[2] + a[3] * ZC]; };
  const placeCube = (d, p, k, s = 1) => { d.g.visible = true; d.g.position.copy(W(...p)); d.g.scale.setScalar(s); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); };
  const hideCube = d => { d.g.visible = false; d.glow.material.uniforms.intensity.value = 0; };
  const placePhoto = (ph, p, k = 1) => { ph.g.visible = true; ph.g.position.copy(W(...p)); ph.mat.emissiveIntensity = k; moveGlow(ph.glow, [p[0], p[1] + 6, p[2]], 0.55); };
  const hidePhoto = ph => { ph.g.visible = false; ph.glow.material.uniforms.intensity.value = 0; };
  function scene3() {
    { const base = VIEW.dist * Math.max(1, 1.45 / persp.aspect), z = camera === persp ? camera.position.distanceTo(controls.target) / base : 1 / (ortho.zoom || 1);
      const nz = Math.max(0.35, Math.min(1.6, z)); if (Math.abs(nz - ZC) > 0.002) { ZC = nz; tags.forEach(t => t.w0 && t.sp.scale.set(t.w0 * ZC, t.h0 * ZC, 1)); } }
    const s = cur(), t = lt, phone = innerWidth < 640, ld = i => legDone(i);
    litMat.resolution.copy(accentLineMat.resolution);
    const lit = new Set(), pulse = {}; let nd = 0, card = null, cableOn = false, ph = s.ph0, ph2 = null, phFly = null, ph2Fly = null, blockN = 0, blockF = null, walkN = 0, hotNow = false;
    TL.legs.forEach((l, i) => {
      if (t < l.t0) return;
      const f = legF(l), done = f >= 1;
      if (l.card) card = l;
      if (l.cable) cableOn = true;
      if (l.pulse) pulse[l.pulse] = !done ? 0.5 + 0.5 * Math.sin(f * Math.PI * 3) : 0.35;
      if (l.path) { if (!done || l.stop || l.carry) lit.add(l.path);
        const P = PATHS[l.path], stop = l.stop || 1;
        if (!done) { const g = l.dir > 0 ? ease(f) * stop : 1 - ease(f), p = alongPts(P.pts, P.cum, g);
          if (l.carry === true) phFly = [p[0], p[1], p[2] + 22]; else if (l.carry === 'copy') ph2Fly = [p[0], p[1], p[2] + 22];
          else { const d = DOTS[nd++]; if (d) placeCube(d, p, 1.3, l.stop && f > 0.8 ? Math.max(0.05, (1 - f) * 5) : 1); } }
        if (done && l.ph) ph = l.ph; if (done && l.ph2) ph2 = l.ph2;
        if (l.carry === true && !done && t >= l.t0) ph = null; }
      if (l.blocks) { blockF = { f, n: l.blocks, hot: l.hot }; if (l.blocks > 1) ph = null; }
      if (l.walk) walkN = done ? 4 : Math.floor(f * 4.99);
    });
    for (let i = nd; i < DOTS.length; i++) hideCube(DOTS[i]);
    Object.entries(PATHS).forEach(([k, P]) => { P.lit.visible = lit.has(k); });
    cableLit.visible = cableOn;
    // a foto
    const st = val(s.sto, ld) || {};
    const v2 = !!st.v2;
    if (phFly) placePhoto(PHOTO, phFly, 1.2); else if (ph) placePhoto(PHOTO, PHP[ph], pulse.photo ?? 0.6); else hidePhoto(PHOTO);
    if (ph2Fly) placePhoto(PHOTO2, ph2Fly, 1.2); else if (ph2) placePhoto(PHOTO2, PHP[ph2], 0.6); else hidePhoto(PHOTO2);
    drawCat(PHOTO, v2 && sc === 'object'); drawCat(PHOTO2, sc === 'object');
    if (sc === 'object' && s.legs.some(l => l.carry === 'copy') && ld(1)) hidePhoto(PHOTO);          // o objeto novo substitui o velho
    if (sc === 'object' && ph2Fly) PHOTO.mat.emissiveIntensity = 0.2;
    // blocos de 4 KB caindo nas casas
    let cells = st.cells === 'blocks' ? 0 : (st.cells || 0), hot = st.hot ?? -1;
    if (blockF) { const { f, n } = blockF;
      for (let i = 0; i < CUBES.length; i++) { const d = CUBES[i];
        if (i >= n) { hideCube(d); continue; }
        const fi = Math.max(0, Math.min(1, (f * 1.4 - i * 0.04 * (n > 1 ? 1 : 0)) / 1)), e = ease(Math.min(1, fi));
        const a = PHP.vol, b = cellC(n > 1 ? MINE0 + i : MINE0), p = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e + Math.sin(e * Math.PI) * 30];
        if (fi >= 1) hideCube(d); else placeCube(d, p, 1.2); }
      if (st.cells === 'blocks') cells = Math.round(Math.min(1, f * 1.15) * SHOWN);
    } else CUBES.forEach(hideCube);
    if (sc === 'block') drawVol(cells, hot);
    // servidores
    const S = val(s.srv, ld);
    for (const k of ['A', 'B', 'C']) { if (!S[k]) continue; drawSrv(k, S[k]);
      const busy = S[k][2] === 'hi' && !legDone(TL.legs.length - 1);
      SRV[k].cap.emissiveIntensity = S[k][2] === 'bad' ? 0.9 * (0.5 + 0.5 * Math.sin(t * 6)) : busy ? 0.5 : 0;
      SRV[k].led.material = S[k][2] === 'ok' || busy ? ledOnMat : ledOffMat; SRV[k].led2.material = Math.floor(t * 4 + k.charCodeAt(0)) % 3 ? ledOffMat : ledOnMat;
      const name = 'SERVER ' + k;
      tSrv[k].set(phone ? `${k} · ${S[k][0]}` : `${name}\n${S[k][0]}`, S[k][2] === 'ok' || S[k][2] === 'bad' ? 'acc' : 'hi').at(SX[k] + 40, 208, 127 + 23 * ZC); }
    for (const k of ['A', 'B', 'C']) if (!S[k] || !VIS[sc].includes(k)) tSrv[k].hide();
    // storage de cada modo
    if (sc === 'das') { drawDisk(st.disk); diskCap.emissiveIntensity = pulse.disk ?? (cableOn ? 0.4 : 0);
      if (card && card.at === 'disk' || phone) tSto.hide(); else tSto.set('NVMe SSD on server A\n/dev/nvme0n1 · /data', 'hi').at(151, 262, 40); }
    if (sc === 'nas' || sc === 'file') drawSwitch(lit.size > 0);
    if (sc === 'nas') { drawNas(st.nas); nasCap.emissiveIntensity = st.nas === 'off' ? 0 : pulse.nas ?? (lit.size ? 0.4 : 0.15);
      tSto.set(phone ? 'NAS' : 'NAS · nas.loja\n/export/fotos (NFS · SMB)', st.nas === 'off' ? 'dim' : 'hi').at(OX + 535, 140, 14); }
    if (sc === 'block') { tSto.set(phone ? 'VOLUME · blocks only' : 'VOLUME vol-0a1b2c · 100 GB\nnumbered blocks only (LBA)', 'hi').at(OX + 700, 40, 14); }
    if (sc === 'file') { const w = st.walk === 'walk' ? walkN : (st.walk || 0);
      for (const k of Object.keys(NODES)) { const on = WALK.indexOf(k) >= 0 && WALK.indexOf(k) < w;
        drawNode(k, { on, meta: k === 'foto' && !!st.meta, lock: k === 'foto' && !!st.lock, rename: !!st.rename });
        NODES[k].cap.emissiveIntensity = pulse[k] != null ? pulse[k] * 0.6 : on ? 0.22 : 0; }
      edgeLines.forEach(e => { e.lit.visible = WALK.indexOf(e.b) >= 0 && WALK.indexOf(e.b) < w; });
      if (phone || step > 0) tSto.hide(); else tSto.set('FILE STORAGE (EFS · NFS)\nfolder tree', 'hi').at(OX + 560, 0, 70); }
    if (sc === 'object') { OBJS.forEach(o => { o.cap.emissiveIntensity = pulse.obj ?? 0.12; }); drawBucket(!!st.obj, v2);
      tSto.set(phone ? 'BUCKET loja-fotos' : 'BUCKET loja-fotos\nloose objects · HTTP', 'hi').at(OX + 560, 172, 14); }
    // etiqueta da foto: o dado real de cada modo
    const phAt = phFly || (ph && PHP[ph]);
    let phTxt = null;
    if (phAt && !phFly) {
      if (sc === 'object' && st.obj && st.meta) phTxt = 'key: produtos/gatos/gato.jpg\nContent-Type: image/jpeg\nx-amz-meta-produto: 4521';
      else if (sc === 'object' && st.obj) phTxt = 'produtos/gatos/gato.jpg\nETag ' + (v2 ? 'e4d9…' : '9b2c…');
      else if (sc === 'file' && ph === 'tree') phTxt = (st.rename ? '/produtos/felinos/gato.jpg' : '/produtos/gatos/gato.jpg') + (st.lock ? '\nLOCK_EX · server A' : '');
      else if (ph === 'disk') phTxt = '/data/produtos/gato.jpg';
      else if (ph === 'nas') phTxt = '/export/fotos/produtos/gatos/gato.jpg';
      else phTxt = 'gato.jpg · 2,4 MB';
    }
    if (phTxt && !(card && at(card.at)[0] === phAt[0])) tPh.set(phone ? phTxt.split('\n')[0] : phTxt, 'acc').at(phAt[0], phAt[1], phAt[2] + 20 + (sc === 'object' && st.meta ? 28 : 16) * ZC); else tPh.hide();
    if (card) tCard.set(card.card[2] ? `${card.card[0]}\n${card.card[2]}` : card.card[0], card.card[1]).at(...at(card.at)); else tCard.hide();
  }

  // ── câmera ──
  const FOCUS = { mid: [400, 135, 70], das: [150, 208, 60], vol: [OX + 545, 84, 23], tree: [OX + 530, 66, 30], bucket: [OX + 560, 85, 30] };
  const FOCUS_M = { mid: [380, 140, 120], das: [160, 208, 100], vol: [OX + 545, 84, 60], tree: [OX + 530, 66, 60], bucket: [OX + 560, 85, 60] };
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > TL.end + 3) lt = 0;
    scene3();
    if (now - nowAt > 300) { nowAt = now; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[cur().focus || 'mid'], z = cur().zoom || 1, k = 1 - Math.exp(-dt / 0.6);
      const want = W(f[0] + (mob ? -10 : -215) * z, f[1] + (mob ? 0 : 45) * z, f[2] + (mob ? ZOFF() : -140) * z), dd = want.sub(controls.target).multiplyScalar(k);
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
      if (camera === persp) { const off = camera.position.clone().sub(controls.target), L0 = off.length(), base = VIEW.dist * Math.max(1, 1.45 / persp.aspect);
        off.setLength(L0 + (base * z - L0) * k); camera.position.copy(controls.target).add(off); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, TL.end + 3.5)) next(); }
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
  applyVis(); render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  const VIEW = NARROW() ? { target: W(370, 140, 120 + ZOFF()), dist: innerWidth < 640 ? 11.2 : 14 } : { target: W(185, 180, -70), dist: 18 };
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: VIEW,
    info: panelHtml(),
    hint: 'next: → · back: ← · type: C or 1 to 5 · drag to rotate' };
})() });
