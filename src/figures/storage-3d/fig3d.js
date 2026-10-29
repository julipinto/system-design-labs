// Figura 3D (iso-glow): Tipos de storage. A loja online precisa guardar "gato.jpg" (a foto de um produto, 2 457 600 bytes = 2,4 MB).
// A MESMA foto é guardada de 5 jeitos: DAS, NAS, block, file e object. Cada jeito muda o que o programa vê e quem consegue acessar.
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
  const SCBTN = { das: 'DAS', nas: 'NAS', block: 'Bloco', file: 'Arquivo', object: 'Objeto' };
  const SCNAME = { das: 'DAS · disco direto', nas: 'NAS · storage na rede', block: 'Block storage', file: 'File storage', object: 'Object storage' };
  // âncora da aula de cada modo (link "Voltar ao módulo")
  const LESSON = { das: 'aula-3-das', nas: 'aula-4-nas', block: 'aula-5-block-storage', file: 'aula-6-file-storage', object: 'aula-7-object-storage' };
  const SIZE = '2\u00a0457\u00a0600', MIME = 'image/jpeg', URL = 'https://loja-fotos.s3.amazonaws.com/produtos/gatos/gato.jpg';
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
  const IDLE = ['loja online', 'pronto', 'dim'];
  const TABLE = () => `<table class="s3-tab"><tr><th>Tipo</th><th>Quem vê</th><th>Latência*</th><th>Editar 4 KB</th><th>Bom para</th></tr>${[
    ['das', 'DAS', '1 servidor', '~0,1 ms', 'sim', 'disco local, cache'],
    ['nas', 'NAS', 'muitos', '~1 ms+', 'sim', 'pastas da empresa'],
    ['block', 'Bloco', '1 servidor', '< 1 ms', 'sim', 'bancos, VMs'],
    ['file', 'Arquivo', 'muitos', 'ms', 'sim, com lock', 'pastas compartilhadas'],
    ['object', 'Objeto', 'quem tem a URL', 'dezenas de ms', 'não', 'fotos, backup, logs']].map(r => `<tr class="${r[0] === sc ? 'on' : ''}">${r.slice(1).map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table><li class="h3-dim">* ordem de grandeza, só para comparar; varia com hardware e rede.</li>`;

  // cada passo: legs (o que acontece, em ordem), ph0 (onde a foto começa), srv (telas), sto (estado do storage), textos, cmd e dados
  const STEPS = {
    das: [
      { title: 'A foto mora no disco do servidor', ph0: 'A', focus: 'das', zoom: 0.62,
        story: 'A loja recebeu a foto de um produto: gato.jpg, 2,4 MB. No jeito mais simples, ela vai para um disco ligado direto no servidor A: um SSD NVMe dentro do gabinete (ou uma gaveta de discos, o JBOD, presa por cabo). Esse arranjo se chama DAS, Direct-Attached Storage.',
        look: 'O SSD está puxado para fora do servidor A, preso por um cabo. O servidor B fica logo ao lado, sem cabo nenhum.',
        key: 'DAS: o disco pertence a um servidor e fica ligado direto nele, sem rede no meio.',
        cmd: { who: 'no servidor A', code: 'lsblk', out: 'nvme0n1  1T  disk  /data' },
        legs: [{ pulse: 'disk', cable: true, card: ['SSD NVMe · 1 TB', 'acc', 'ligado direto no A, por PCIe'], at: 'disk' }],
        srv: { A: ['tenho a foto', 'gato.jpg · 2,4 MB', 'ok'], B: IDLE }, sto: { disk: 'empty' },
        data: () => '<li>Disco: <b>SSD NVMe de 1 TB</b> em <b>/dev/nvme0n1</b>, formatado em ext4 e montado em <b>/data</b></li><li>Interface: NVMe sobre PCIe. Outras comuns: SATA e SAS.</li><li><b>JBOD</b> ("just a bunch of disks"): uma gaveta com vários discos ligada por cabo SAS. Mais espaço, mas ainda de um servidor só.</li>' },
      { title: 'Gravar: direto pelo cabo', focus: 'das', zoom: 0.62, ph0: 'A',
        story: 'O programa da loja grava a foto em /data/produtos/gato.jpg. O sistema operacional manda os bytes pelo barramento até o SSD. Não passa por rede, switch ou outro computador. Por isso é rápido: a foto inteira entra em poucos milissegundos.',
        look: 'A foto desce do servidor A e entra no SSD. A tela do SSD passa a listar gato.jpg.',
        key: 'Sem rede no meio: a espera é só a do próprio disco.',
        cmd: { who: 'no servidor A', code: 'fd = open("/data/produtos/gato.jpg", O_WRONLY|O_CREAT)\nwrite(fd, buf, 2457600)', out: '→ 2457600 (bytes gravados)' },
        legs: [{ path: 'a_d', dir: 1, carry: true, ph: 'disk', cable: true, card: ['write → SSD', 'acc', `${SIZE} bytes · sem rede`], at: 'disk' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', 'gato.jpg no SSD', 'ok'] : ['gravando…', 'write()', 'hi'], B: IDLE }), sto: ld => ({ disk: ld(0) ? 'file' : 'empty' }),
        data: () => `<li>Arquivo: <b>/data/produtos/gato.jpg</b> · ${SIZE} bytes</li><li>Caminho: programa → kernel → driver NVMe → SSD. Nenhum salto de rede.</li><li>Um SSD NVMe grava na casa de GB/s: 2,4 MB levam por volta de 1 a 2 ms (exemplo).</li>` },
      { title: 'Ler: o caminho mais curto que existe', focus: 'das', zoom: 0.62, ph0: 'disk',
        story: 'Um cliente abre a página do gato. O servidor A lê a foto do próprio SSD, em pedaços de 4 KB. Cada leitura leva perto de 0,1 ms (100 µs) num NVMe. Não há atalho mais curto entre um programa e o dado.',
        look: 'Uma luz sai do SSD e volta ao servidor A. A tela do A mostra o tempo da leitura.',
        key: 'Em latência, nada ganha do disco local.',
        cmd: { who: 'no servidor A', code: 'read(fd, buf, 4096)', out: '→ 4096 bytes · ~0,1 ms (exemplo)' },
        legs: [{ path: 'a_d', dir: -1, cable: true, card: ['read 4 KB · ~0,1 ms', 'acc', 'SSD → servidor A'], at: 'disk' }],
        srv: ld => ({ A: ld(0) ? ['read ✓ · 0,1 ms', '4 KB do SSD', 'ok'] : ['lendo…', 'read()', 'hi'], B: IDLE }), sto: { disk: 'file' },
        data: () => '<li>Latência típica: SSD NVMe ~0,1 ms · SSD SATA ~0,2 ms · HD que gira ~5 a 10 ms (ordem de grandeza)</li><li>Leitura em blocos de 4 KB: é o tamanho de página mais comum de sistemas de arquivos.</li>' },
      { title: 'O servidor B tenta, e não vê nada', focus: 'das', zoom: 0.62, ph0: 'disk', fail: true,
        story: 'A loja cresceu e ligou o servidor B para dividir as visitas. Só que a foto está no SSD do A. O B procura /data/produtos/gato.jpg e não acha: para ele, aquele disco não existe. Não há cabo nem rede entre o B e o SSD.',
        look: 'A luz sai do B rumo ao SSD e para no meio, com um ✕. A tela do B mostra o erro.',
        key: 'No DAS, só o servidor ligado ao disco enxerga os dados.',
        cmd: { who: 'no servidor B', code: 'open("/data/produtos/gato.jpg", O_RDONLY)', out: '→ -1 ENOENT (No such file or directory)' },
        legs: [{ path: 'b_d', dir: 1, stop: 0.55, card: ['✕ o B não enxerga o SSD do A', 'acc', 'não há cabo até ele'], at: 'srv' }],
        srv: ld => ({ A: ['tenho a foto', 'no meu SSD', 'ok'], B: ld(0) ? ['✕ ENOENT', 'cadê a foto?', 'bad'] : ['procurando…', 'open()', 'hi'] }), sto: { disk: 'file' },
        data: () => '<li>O SSD só aparece no <b>lsblk</b> do servidor A. No B, /data é outro disco (o interno dele), vazio.</li><li>ENOENT = "Error NO ENTry": o arquivo não existe para este servidor.</li>' },
      { title: 'O remendo: copiar. Agora são duas fotos', focus: 'das', zoom: 0.62, ph0: 'disk',
        story: 'Para o B mostrar a foto, alguém copia o arquivo pela rede, do A para o disco interno do B. Funciona, mas agora existem duas cópias. Se a foto mudar no A, o B fica com a velha até a próxima cópia. E se o A queimar, o SSD vai junto. Quando vários servidores precisam do mesmo dado, entra um storage em rede.',
        look: 'Uma cópia da foto voa do A para o B. A tela do B diz "cópia de 10:02".',
        key: 'DAS é simples, barato e rápido, mas preso a um servidor; crescer é pôr mais disco na mão.',
        cmd: { who: 'no servidor A', code: 'rsync -a /data/produtos/ servidor-b:/data/produtos/', out: '→ gato.jpg · 2.457.600 bytes enviados' },
        legs: [{ path: 'a_b', dir: 1, carry: 'copy', ph2: 'B', card: ['cópia pela rede', 'acc', 'A → B · duas fotos agora'], at: 'srv' }],
        srv: ld => ({ A: ['original', 'gato.jpg · 10:02', 'ok'], B: ld(0) ? ['cópia de 10:02', 'pode ficar velha', 'ok'] : ['recebendo…', 'rsync', 'hi'] }), sto: { disk: 'file' },
        data: () => TABLE() },
    ],
    nas: [
      { title: 'Um storage que mora na rede', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Para o A, o B e o C verem a mesma foto, a loja liga um NAS (Network-Attached Storage) no switch: uma caixa com vários discos e um sistema próprio. Ele exporta a pasta /export/fotos, e cada servidor monta essa pasta pela rede, com NFS (Linux) ou SMB (Windows).',
        look: 'A caixa do NAS ao fundo, com 4 discos. Os três servidores ligam no switch, e o switch no NAS.',
        key: 'NAS: um aparelho na rede que entrega pastas e arquivos a muitos servidores.',
        cmd: { who: 'nos servidores A, B e C', code: 'mount -t nfs nas.loja:/export/fotos /mnt/nas', out: '→ (sem saída = montado em /mnt/nas)' },
        legs: [{ pulse: 'nas', card: ['NAS · nas.loja', 'acc', '4 discos · NFS e SMB'], at: 'sto' }],
        srv: { A: ['tenho a foto', '/mnt/nas montado', 'ok'], B: ['/mnt/nas', 'montado', 'hi'], C: ['/mnt/nas', 'montado', 'hi'] }, sto: { nas: 'on' },
        data: () => '<li>NAS: <b>nas.loja</b> (10.0.0.50), exporta <b>/export/fotos</b></li><li>NFS usa a porta 2049 (TCP); SMB usa a 445.</li><li>Por dentro, os 4 discos costumam estar em RAID (veja as aulas de RAID).</li>' },
      { title: 'Gravar: a foto atravessa a rede', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'O servidor A grava em /mnt/nas/produtos/gatos/gato.jpg. Para o programa, é uma pasta comum. Por baixo, o cliente NFS do sistema operacional quebra os 2,4 MB em mensagens WRITE de até 1 MB e manda pela rede. O NAS grava nos discos dele e responde OK.',
        look: 'A foto sai do A, passa pelo switch e entra no NAS. A tela do NAS mostra gato.jpg.',
        key: 'O programa usa open e write como sempre; quem fala com a rede é o sistema operacional.',
        cmd: { who: 'no servidor A', code: 'open("/mnt/nas/produtos/gatos/gato.jpg", O_WRONLY|O_CREAT)\nwrite(fd, buf, 2457600)', out: '→ vira 3 × NFS WRITE (1 MB, 1 MB, 0,4 MB) → OK' },
        legs: [{ path: 'a_n', dir: 1, carry: true, ph: 'nas', card: ['NFS WRITE × 3', 'acc', 'A → switch → NAS'], at: 'net' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', 'via rede', 'ok'] : ['gravando…', 'NFS WRITE', 'hi'], B: ['/mnt/nas', 'montado', 'hi'], C: ['/mnt/nas', 'montado', 'hi'] }), sto: ld => ({ nas: ld(0) ? 'file' : 'on' }),
        data: () => `<li>Arquivo no NAS: <b>/export/fotos/produtos/gatos/gato.jpg</b> · ${SIZE} bytes</li><li>Nos servidores ele aparece como <b>/mnt/nas/produtos/gatos/gato.jpg</b>.</li><li>Tamanho máximo de cada WRITE (wsize): 1 MB, valor comum no Linux.</li>` },
      { title: 'B e C leem a mesma foto', focus: 'mid', zoom: 1, ph0: 'nas',
        story: 'Agora o B e o C abrem o mesmo caminho e recebem a mesma foto, sem cópia. Se o A trocar a foto, os outros veem a versão nova na próxima leitura. Era isso que faltava no DAS.',
        look: 'Duas luzes saem do NAS: uma para o B, outra para o C. As três telas mostram gato.jpg.',
        key: 'Muitos servidores, uma pasta só: o dado fica num lugar e é compartilhado.',
        cmd: { who: 'nos servidores B e C', code: 'open("/mnt/nas/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ fd = 3 · a mesma foto, o mesmo arquivo' },
        legs: [{ path: 'b_n', dir: -1, card: ['NFS READ → B e C', 'acc', 'uma foto, três servidores'], at: 'net' }, { path: 'c_n', dir: -1, par: true }],
        srv: ld => ({ A: ['tenho a foto', 'no NAS', 'ok'], B: ld(0) ? ['read ✓', 'gato.jpg', 'ok'] : ['lendo…', 'NFS READ', 'hi'], C: ld(1) ? ['read ✓', 'gato.jpg', 'ok'] : ['lendo…', 'NFS READ', 'hi'] }), sto: { nas: 'file' },
        data: () => '<li>Uma cópia só, no NAS. Os três servidores leem o mesmo arquivo.</li><li>Cada cliente NFS guarda um cache curto; a versão nova aparece em segundos (exemplo).</li>' },
      { title: 'O preço: cada leitura viaja pela rede', focus: 'mid', zoom: 1, ph0: 'nas',
        story: 'Compartilhar tem custo. Cada read sai do servidor, passa pelo switch, chega ao NAS, que lê do disco e manda de volta. No SSD local isso levava ~0,1 ms; pelo NAS costuma levar 1 ms ou mais, e piora com a rede cheia. Para fotos, tudo bem. Para um banco com milhares de leituras pequenas por segundo, pesa.',
        look: 'A luz faz a viagem inteira: A → switch → NAS e de volta ao A.',
        key: 'NAS é compartilhado, mas carrega a latência e a banda da rede.',
        cmd: { who: 'no servidor A', code: 'read(fd, buf, 4096)', out: '→ NFS READ · ~1 ms (exemplo) · no SSD local: ~0,1 ms' },
        legs: [{ path: 'a_n', dir: 1, card: ['ida: pedido READ', 'hi', 'A → switch → NAS'], at: 'net' }, { path: 'a_n', dir: -1, card: ['volta: 4 KB · ~1 ms', 'acc', '10× mais que o SSD local'], at: 'net' }],
        srv: ld => ({ A: ld(1) ? ['read ✓ · ~1 ms', 'via rede', 'ok'] : ['esperando…', 'NFS READ', 'hi'], B: ['gato.jpg', 'ok', 'hi'], C: ['gato.jpg', 'ok', 'hi'] }), sto: { nas: 'file' },
        data: () => '<li>Ida e volta pela rede local: ~0,2 a 0,5 ms só de viagem, mais o disco do NAS (exemplo).</li><li>A banda também é dividida: 3 servidores lendo ao mesmo tempo dividem o mesmo link do NAS.</li>' },
      { title: 'E se o NAS cair?', focus: 'mid', zoom: 1, ph0: 'nas', fail: true,
        story: 'Numa madrugada, a fonte do NAS queima. Os três servidores travam ao mesmo tempo: toda leitura em /mnt/nas espera uma resposta que não vem. Um NAS sozinho é um ponto único de falha. Na prática se usa NAS com duas controladoras, discos em RAID e réplica, ou um serviço gerenciado que já cuida disso.',
        look: 'O NAS apaga. As luzes dos três servidores param no switch, e as telas mostram "not responding".',
        key: 'Centralizar facilita, mas o centro precisa ser redundante.',
        cmd: { who: 'no log do kernel dos servidores', code: 'read(fd, buf, 4096)', out: '→ nfs: server nas.loja not responding, still trying' },
        legs: [{ pulse: 'nas', off: true, card: ['✕ NAS sem energia', 'acc', 'ponto único de falha'], at: 'sto' }, { path: 'a_n', dir: 1, stop: 0.5 }, { path: 'b_n', dir: 1, stop: 0.5, par: true }, { path: 'c_n', dir: 1, stop: 0.5, par: true }],
        srv: ld => ld(1) ? { A: ['✕ not responding', 'esperando o NAS', 'bad'], B: ['✕ not responding', 'esperando o NAS', 'bad'], C: ['✕ not responding', 'esperando o NAS', 'bad'] } : { A: ['lendo…', '', 'hi'], B: ['lendo…', '', 'hi'], C: ['lendo…', '', 'hi'] }, sto: ld => ({ nas: ld(0) ? 'off' : 'file' }),
        data: () => TABLE() },
    ],
    block: [
      { title: 'Um disco virtual, preso a um servidor', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Na nuvem, a loja cria um volume de blocos de 100 GB (como o EBS da AWS; num data center, uma LUN de SAN via iSCSI ou Fibre Channel). Ele fica em outro lugar do data center, mas é anexado ao servidor A e aparece como um disco: /dev/nvme1n1. O A formata com ext4 e monta em /dados.',
        look: 'O volume é a placa grande à direita, coberta de casas numeradas: cada casa é um bloco de 4 KB.',
        key: 'Block storage: um disco cru, dividido em blocos numerados, entregue a um servidor.',
        cmd: { who: 'no painel da nuvem', code: 'aws ec2 attach-volume --volume-id vol-0a1b2c --instance-id i-A --device /dev/sdf', out: '→ "State": "attaching"' },
        legs: [{ path: 'a_v', dir: 1, card: ['volume anexado ao A', 'acc', 'aparece como /dev/nvme1n1'], at: 'sto' }],
        srv: ld => ({ A: ld(0) ? ['novo disco', '/dev/nvme1n1', 'ok'] : ['anexando…', '', 'hi'], B: IDLE }), sto: { cells: 0 },
        data: () => '<li>Volume: <b>vol-0a1b2c</b> · 100 GB · blocos de 4 KB → 26&nbsp;214&nbsp;400 blocos</li><li>No servidor A: <b>/dev/nvme1n1</b>, ext4, montado em <b>/dados</b></li><li>Por baixo, o volume viaja pela rede do data center, mas o servidor o vê como disco local.</li>' },
      { title: 'A foto vira 600 blocos', focus: 'vol', zoom: 0.55, ph0: 'A',
        story: 'O programa grava gato.jpg como em qualquer disco. Só que o volume não entende arquivos. Quem corta a foto é o sistema de arquivos do servidor A: 2&nbsp;457&nbsp;600 bytes ÷ 4096 = 600 blocos de 4 KB. Ele escolhe onde cada bloco vai morar e manda pedidos do tipo "grave estes 4 KB no bloco 2048".',
        look: 'A foto chega ao volume e se desfaz em cubinhos, que caem nas casas 2048, 2049, 2050…',
        key: 'Quem divide o arquivo em blocos é o sistema de arquivos, no servidor.',
        cmd: { who: 'no servidor A', code: 'write(fd, buf, 2457600)', out: '→ ext4 manda WRITE nos blocos 2048 … 2647 (600 × 4 KB)' },
        legs: [{ path: 'a_v', dir: 1, carry: true, ph: 'vol', card: ['write gato.jpg', 'acc', `${SIZE} bytes`], at: 'sto' }, { blocks: 12, card: ['600 blocos de 4 KB', 'acc', 'casas 2048 a 2647'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['write ✓', '600 blocos', 'ok'] : ['gravando…', 'ext4', 'hi'], B: IDLE }), sto: { cells: 'blocks' },
        data: () => `<li>${SIZE} bytes ÷ 4096 = <b>600 blocos</b> exatos</li><li>Blocos escolhidos pelo ext4: <b>2048 a 2647</b> (seguidos, um só pedaço)</li><li>Casas à vista na grade: 2048 a 2062; o resto segue até 2647.</li>` },
      { title: 'O volume não sabe que é uma foto', focus: 'vol', zoom: 0.5, ph0: null,
        story: 'Olhe o que o volume guardou. O bloco 2048 começa com os bytes FF D8 FF E0: é a assinatura de todo arquivo JPEG, mas o volume não sabe disso. Lá dentro não há nome, pasta, dono nem "gato". São só 600 caixas de 4 KB com bytes, cada uma com seu número: o LBA (endereço lógico do bloco).',
        look: 'A casa 2048 se destaca com os primeiros bytes. Nenhuma casa diz "gato.jpg".',
        key: 'O volume guarda blocos numerados; o significado mora fora dele.',
        cmd: { who: 'o pedido que chega ao volume', code: 'WRITE  LBA 2048  4096 bytes\nFF D8 FF E0 00 10 4A 46 49 46 …', out: '→ OK (e nada mais: nem nome, nem tipo)' },
        legs: [{ pulse: 'vol', hot: true, card: ['LBA 2048: FF D8 FF E0 …', 'acc', 'bytes, sem nome nem tipo'], at: 'sto' }],
        srv: { A: ['gato.jpg', 'em /dados', 'ok'], B: IDLE }, sto: { cells: SHOWN, hot: MINE0 },
        data: () => '<li><b>FF D8</b> = início de imagem JPEG · <b>FF E0</b> = começo do cabeçalho JFIF · <b>4A 46 49 46</b> = as letras "JFIF"</li><li>Quem entende esses bytes é o programa que abre a foto, não o volume.</li><li>Aqui o volume usa setores de 4 KB, então cada LBA = 1 bloco de 4 KB. Em discos de setor de 512 bytes, cada bloco ocupa 8 LBAs.</li>' },
      { title: 'Quem sabe onde a foto está: o sistema de arquivos', focus: 'vol', zoom: 0.55, ph0: null,
        story: 'Então como o A acha a foto de volta? O ext4 guarda um mapa no próprio volume: o inode 1311 diz "gato.jpg tem 2&nbsp;457&nbsp;600 bytes e ocupa os blocos 2048 a 2647". Ao abrir o arquivo, o A lê o inode e pede exatamente esses blocos.',
        look: 'Uma luz liga o servidor A aos blocos, que acendem juntos.',
        key: 'Arquivo = mapa do sistema de arquivos (inode) + blocos no volume.',
        cmd: { who: 'no servidor A', code: 'filefrag -v /dados/produtos/gato.jpg', out: '→ ext 0: physical 2048..2647  length 600' },
        legs: [{ path: 'a_v', dir: 1, card: ['inode 1311 → blocos 2048..2647', 'acc', 'o mapa fica no servidor'], at: 'sto' }, { path: 'a_v', dir: -1, card: ['READ 2048 … 2647', 'acc', 'só os blocos da foto'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['read ✓', 'inode 1311', 'ok'] : ['lendo o inode…', '', 'hi'], B: IDLE }), sto: { cells: SHOWN },
        data: () => '<li>Inode <b>1311</b>: nome gato.jpg · dono loja · 2&nbsp;457&nbsp;600 bytes · blocos <b>2048–2647</b></li><li>Tudo isso é do ext4, gravado em outros blocos do mesmo volume. O volume só guarda.</li>' },
      { title: 'Mudar só um pedaço: 4 KB e pronto', focus: 'vol', zoom: 0.5, ph0: null,
        story: 'A loja corrige um dado no começo da foto (o cabeçalho EXIF). No volume de blocos basta regravar um bloco, o 2048; os outros 599 ficam como estão. É assim que um banco de dados trabalha: regrava páginas pequenas no meio de arquivos enormes, em posições aleatórias, abaixo de 1 ms. Por isso bancos rodam em block storage.',
        look: 'Um único cubinho novo cai na casa 2048. As outras casas não mudam.',
        key: 'Block storage é o melhor para escrita aleatória e baixa latência: bancos de dados e discos de VM.',
        cmd: { who: 'no servidor A', code: 'pwrite(fd, buf, 4096, 0)', out: '→ WRITE LBA 2048 · 1 bloco · ~0,5 ms (exemplo)' },
        legs: [{ path: 'a_v', dir: 1, card: ['regrava só o bloco 2048', 'acc', '4 KB · os outros 599 ficam'], at: 'sto' }, { blocks: 1, hot: true }],
        srv: ld => ({ A: ld(1) ? ['pwrite ✓', '1 bloco', 'ok'] : ['gravando 4 KB…', '', 'hi'], B: IDLE }), sto: ld => ({ cells: SHOWN, hot: ld(1) ? MINE0 : -1 }),
        data: () => '<li>pwrite(fd, buf, 4096, 0) = "grave 4 KB a partir do byte 0 do arquivo"</li><li>O ext4 traduz: byte 0 do arquivo → bloco <b>2048</b> do volume.</li><li>Um banco como o PostgreSQL faz isso o tempo todo com páginas de 8 KB.</li>' },
      { title: 'O servidor B tenta anexar o mesmo volume', focus: 'mid', zoom: 1, ph0: null, fail: true,
        story: 'O servidor B também quer a foto e tenta anexar o mesmo volume. A nuvem recusa: ele já está preso ao A. E mesmo onde dá para anexar a dois (SAN, EBS Multi-Attach), dois ext4 gravando no mesmo disco sem combinar entre si estragam o mapa um do outro. Para compartilhar, o caminho é file ou object storage.',
        look: 'A luz do B para no meio do caminho com um ✕. Os blocos continuam do A.',
        key: 'Um volume de blocos tem um dono por vez.',
        cmd: { who: 'no painel da nuvem', code: 'aws ec2 attach-volume --volume-id vol-0a1b2c --instance-id i-B --device /dev/sdf', out: '→ VolumeInUse: vol-0a1b2c is already attached to an instance' },
        legs: [{ path: 'b_v', dir: 1, stop: 0.55, card: ['✕ VolumeInUse', 'acc', 'o volume já é do A'], at: 'b' }],
        srv: ld => ({ A: ['dono do volume', '/dev/nvme1n1', 'ok'], B: ld(0) ? ['✕ VolumeInUse', 'sem acesso', 'bad'] : ['anexando…', '', 'hi'] }), sto: { cells: SHOWN },
        data: () => TABLE() },
    ],
    file: [
      { title: 'Uma árvore de pastas compartilhada', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'Agora a loja usa um file storage gerenciado (como o EFS da AWS, que fala NFS). Ele guarda as coisas do jeito que a gente conhece: pastas dentro de pastas. A foto vai morar em /produtos/gatos/gato.jpg. Os três servidores montam a mesma árvore em /mnt/efs.',
        look: 'À direita, a árvore: / → produtos → gatos → gato.jpg, com backups e cachorros ao lado.',
        key: 'File storage: arquivos numa hierarquia de pastas, achados pelo caminho.',
        cmd: { who: 'nos servidores A, B e C', code: 'mount -t nfs4 fs-0a1b.efs.sa-east-1.amazonaws.com:/ /mnt/efs', out: '→ (sem saída = montado em /mnt/efs)' },
        legs: [{ path: 'a_f', dir: 1, carry: true, ph: 'tree', card: ['gravada em /produtos/gatos/', 'acc', 'gato.jpg'], at: 'sto' }],
        srv: ld => ({ A: ld(0) ? ['write ✓', '/mnt/efs/…', 'ok'] : ['gravando…', '', 'hi'], B: ['/mnt/efs', 'montado', 'hi'], C: ['/mnt/efs', 'montado', 'hi'] }), sto: { walk: 0 },
        data: () => '<li>Árvore: <b>/</b> → <b>produtos</b> → <b>gatos</b> → <b>gato.jpg</b>; ao lado, <b>backups</b> e <b>cachorros</b></li><li>Em cada nível, um nome só: não pode haver duas "gatos" dentro de produtos.</li><li>Por baixo, o EFS guarda tudo em blocos; o que ele entrega é a árvore.</li>' },
      { title: 'Abrir é andar pasta por pasta', focus: 'tree', zoom: 0.55, ph0: 'tree',
        story: 'O servidor A pede /mnt/efs/produtos/gatos/gato.jpg. O sistema não pula direto para a foto: abre a raiz /, procura "produtos" lá dentro, depois "gatos", depois "gato.jpg". Em cada pasta confere se o servidor pode entrar (o x de rwx).',
        look: 'As pastas acendem uma por uma, da raiz até a foto, cada uma com sua permissão.',
        key: 'Um caminho é uma fila de pastas: cada uma é consultada e checada.',
        cmd: { who: 'no servidor A', code: 'open("/mnt/efs/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ LOOKUP / → produtos → gatos → gato.jpg · fd = 3' },
        legs: [{ path: 'a_f', dir: 1, card: ['LOOKUP pasta por pasta', 'acc', '/ → produtos → gatos → gato.jpg'], at: 'net' }, { walk: true, card: ['permissão ok em cada nível', 'acc', 'drwxr-xr-x: pode entrar'], at: 'sto' }],
        srv: ld => ({ A: ld(1) ? ['open ✓ · fd 3', '4 pastas', 'ok'] : ['procurando…', 'LOOKUP', 'hi'], B: ['/mnt/efs', 'montado', 'hi'], C: ['/mnt/efs', 'montado', 'hi'] }), sto: { walk: 'walk' },
        data: () => '<li>/ <b>drwxr-xr-x</b> root · produtos <b>drwxr-xr-x</b> loja · gatos <b>drwxr-xr-x</b> loja · gato.jpg <b>-rw-r--r--</b> loja</li><li>O <b>x</b> numa pasta é a permissão de atravessar. backups (<b>drwx------</b>) só o root atravessa.</li><li>Cada nível é uma consulta LOOKUP ao servidor NFS; o cliente guarda as respostas em cache.</li>' },
      { title: 'Cada arquivo traz metadados de arquivo', focus: 'tree', zoom: 0.5, ph0: 'tree',
        story: 'Ao chegar na foto, vem junto o que o sistema sabe dela: dono loja, grupo web, permissão rw-r--r--, 2&nbsp;457&nbsp;600 bytes, modificada em 14/10 às 10:02. São sempre os mesmos campos, para qualquer arquivo. Não dá para pendurar uma etiqueta sua, como "produto 4521".',
        look: 'A pasta gato.jpg fica acesa e mostra dono, permissão, tamanho e data.',
        key: 'Metadados de arquivo são fixos: dono, permissão, tamanho, datas.',
        cmd: { who: 'no servidor A', code: 'stat /mnt/efs/produtos/gatos/gato.jpg', out: '→ Size: 2457600  Access: (0644/-rw-r--r--)  Uid: loja  Modify: 2026-10-14 10:02' },
        legs: [{ pulse: 'foto', meta: true, card: ['loja · rw-r--r-- · 2,4 MB', 'acc', 'modificado 14/10 10:02'], at: 'sto' }],
        srv: { A: ['stat ✓', 'dono loja', 'ok'], B: ['/mnt/efs', 'montado', 'hi'], C: ['/mnt/efs', 'montado', 'hi'] }, sto: { walk: 4, meta: true },
        data: () => '<table class="h3-sum"><tr><th>Campo</th><th>Valor</th></tr><tr><td>dono / grupo</td><td>loja / web</td></tr><tr><td>permissão</td><td>-rw-r--r-- (0644)</td></tr><tr><td>tamanho</td><td>2&nbsp;457&nbsp;600 bytes</td></tr><tr><td>modificado</td><td>2026-10-14 10:02</td></tr><tr><td>inode</td><td>1311</td></tr></table><li class="h3-dim">Valores de exemplo.</li>' },
      { title: 'B e C abrem o mesmo caminho', focus: 'mid', zoom: 1, ph0: 'tree',
        story: 'O B e o C fazem o mesmo open e recebem a mesma foto. Como no NAS, o dado está num lugar só, e quem tem a árvore montada enxerga. Cada leitura passa pela rede (alguns milissegundos), mas ninguém precisa copiar nada.',
        look: 'Duas luzes saem da árvore: uma para o B, outra para o C.',
        key: 'File storage é feito para ser compartilhado por muitos servidores.',
        cmd: { who: 'nos servidores B e C', code: 'open("/mnt/efs/produtos/gatos/gato.jpg", O_RDONLY)', out: '→ fd = 3 · a mesma foto' },
        legs: [{ path: 'b_f', dir: -1, card: ['B e C leem gato.jpg', 'acc', 'mesmo caminho, mesmo arquivo'], at: 'net' }, { path: 'c_f', dir: -1, par: true }],
        srv: ld => ({ A: ['gato.jpg', 'ok', 'ok'], B: ld(0) ? ['read ✓', 'gato.jpg', 'ok'] : ['lendo…', '', 'hi'], C: ld(1) ? ['read ✓', 'gato.jpg', 'ok'] : ['lendo…', '', 'hi'] }), sto: { walk: 4 },
        data: () => '<li>NAS é o aparelho; file storage é o jeito de organizar (pastas e arquivos). Um NAS entrega file storage; o EFS também, como serviço.</li><li>Latência típica: alguns ms por operação (exemplo).</li>' },
      { title: 'Dois querem editar: o lock', focus: 'mid', zoom: 1, ph0: 'tree', fail: true,
        story: 'O A começa a regravar a foto e pega um lock exclusivo, uma trava. Logo depois o B tenta editar o mesmo arquivo. O sistema de arquivos segura o B: ele espera até o A soltar a trava. Sem isso, os dois gravariam um por cima do outro e a foto sairia misturada.',
        look: 'A foto ganha a trava "LOCK · A". A luz do B para antes de chegar e a tela dele diz "esperando".',
        key: 'File storage tem locks: vários leem, um escreve por vez.',
        cmd: { who: 'no servidor B', code: 'flock(fd, LOCK_EX)', out: '→ … bloqueado: o servidor A tem a trava' },
        legs: [{ path: 'a_f', dir: 1, lock: true, card: ['A pega a trava (LOCK_EX)', 'acc', 'está editando'], at: 'sto' }, { path: 'b_f', dir: 1, stop: 0.6, card: ['✕ B espera', 'acc', 'gato.jpg travado pelo A'], at: 'net' }],
        srv: ld => ({ A: ld(0) ? ['LOCK ✓', 'editando', 'ok'] : ['flock()…', '', 'hi'], B: ld(1) ? ['⏳ esperando', 'trava do A', 'bad'] : IDLE, C: ['read ok', 'leitura livre', 'hi'] }), sto: ld => ({ walk: 4, lock: ld(0) }),
        data: () => '<li><b>LOCK_EX</b> = exclusivo (só um). <b>LOCK_SH</b> = compartilhado (vários leitores).</li><li>No NFS v4, as travas ficam no servidor e expiram se o cliente sumir (lease).</li>' },
      { title: 'Renomear a pasta: uma operação só', focus: 'tree', zoom: 0.55, ph0: 'tree',
        story: 'A loja decide trocar "gatos" por "felinos". Num file storage isso é uma mudança só, na pasta: tudo que está dentro vem junto, na hora, seja 1 foto ou 1 milhão. Guarde isso: no object storage não existem pastas de verdade, e a mesma troca vira copiar objeto por objeto.',
        look: 'A pasta "gatos" passa a se chamar "felinos"; a foto continua dentro dela.',
        key: 'Hierarquia de verdade deixa mover e renomear pastas barato.',
        cmd: { who: 'no servidor A', code: 'rename("/mnt/efs/produtos/gatos", "/mnt/efs/produtos/felinos")', out: '→ 0 (ok) · 1 operação, qualquer que seja o tamanho' },
        legs: [{ pulse: 'gatos', rename: true, card: ['gatos → felinos', 'acc', '1 operação'], at: 'sto' }],
        srv: { A: ['rename ✓', '1 operação', 'ok'], B: ['gato.jpg', 'agora em felinos', 'hi'], C: ['gato.jpg', 'agora em felinos', 'hi'] }, sto: ld => ({ walk: 4, rename: ld(0) }),
        data: () => TABLE() },
    ],
    object: [
      { title: 'Um balde de objetos', focus: 'bucket', zoom: 0.7, ph0: 'A',
        story: 'Por fim, a loja guarda a foto num object storage (como o Amazon S3, o Google Cloud Storage ou o MinIO). O lugar se chama bucket: loja-fotos. Lá dentro não há pastas nem blocos à vista; há objetos, cada um com uma chave (o nome), os dados e metadados. Tudo se faz por HTTP.',
        look: 'O bucket à direita já tem alguns objetos: um backup, um log, a foto do cachorro.',
        key: 'Object storage: objetos inteiros, com chave e metadados, num bucket, por HTTP.',
        cmd: { who: 'no servidor A', code: 'aws s3 mb s3://loja-fotos', out: '→ make_bucket: loja-fotos' },
        legs: [{ pulse: 'obj', card: ['bucket loja-fotos', 'acc', 'objetos soltos, sem pastas'], at: 'bk' }],
        srv: { A: ['tenho a foto', 'gato.jpg', 'ok'], B: IDLE }, sto: { obj: false },
        data: () => '<li>Bucket: <b>loja-fotos</b>, região sa-east-1 (exemplo)</li><li>Objetos já lá: backups/2026-10-13.tar.gz · logs/2026-10-14/app.json.gz · produtos/cachorros/rex.jpg · produtos/gatos/mimi.jpg</li><li>Exemplos de serviço: Amazon S3, Azure Blob Storage, Google Cloud Storage, MinIO, Ceph.</li>' },
      { title: 'PUT: a foto vai inteira, com etiquetas', focus: 'mid', zoom: 1, ph0: 'A',
        story: 'O servidor A manda uma requisição HTTP PUT para a URL do objeto. No corpo vão os 2&nbsp;457&nbsp;600 bytes; nos cabeçalhos, os metadados: o tipo (image/jpeg) e etiquetas da própria loja, como produto=4521. O bucket guarda tudo junto e responde com um ETag, a impressão digital do conteúdo.',
        look: 'A foto faz um arco alto (é HTTPS) e pousa no bucket, ao lado dos outros objetos.',
        key: 'Gravar = PUT do objeto inteiro numa URL.',
        cmd: { who: 'no servidor A', code: `PUT ${URL}\nContent-Type: image/jpeg\nx-amz-meta-produto: 4521`, out: `→ 200 OK · ETag: ${ETAG1}` },
        legs: [{ path: 'a_o', dir: 1, carry: true, ph: 'bucket', card: ['PUT · HTTPS', 'acc', `${SIZE} bytes + metadados`], at: 'sky' }],
        srv: ld => ({ A: ld(0) ? ['200 OK', 'ETag 9b2c…', 'ok'] : ['PUT…', 'HTTPS', 'hi'], B: IDLE }), sto: ld => ({ obj: ld(0) }),
        data: () => `<li>Método: <b>PUT</b> · URL: <b>${URL}</b></li><li>Content-Type: <b>${MIME}</b> · Content-Length: <b>2457600</b></li><li>x-amz-meta-produto: <b>4521</b> (metadado seu, livre)</li><li>Resposta: <b>200 OK</b> · ETag ${ETAG1} (exemplo)</li>` },
      { title: 'A chave tem barras, mas não há pastas', focus: 'bucket', zoom: 0.55, ph0: 'bucket',
        story: '"produtos/gatos/gato.jpg" parece um caminho, mas é só o nome do objeto, uma string. O bucket é plano: todos os objetos ficam lado a lado. Quando você lista "produtos/gatos/", o S3 filtra as chaves que começam com esse texto (o prefixo). Nada de andar pasta por pasta: cada objeto é achado direto pela chave.',
        look: 'A foto está no mesmo chão que o backup e o log. A etiqueta mostra a chave inteira e os metadados.',
        key: 'A chave é o nome completo; "pasta" é só o começo do nome (prefixo).',
        cmd: { who: 'no servidor A', code: 'GET https://loja-fotos.s3.amazonaws.com/?list-type=2&prefix=produtos/gatos/', out: '→ <Key>produtos/gatos/gato.jpg</Key> <Key>produtos/gatos/mimi.jpg</Key>' },
        legs: [{ pulse: 'photo' }],
        srv: { A: ['list ✓', '2 chaves', 'ok'], B: IDLE }, sto: { obj: true, meta: true },
        data: () => `<table class="h3-sum"><tr><th>Campo</th><th>Valor</th></tr><tr><td>chave</td><td>produtos/gatos/gato.jpg</td></tr><tr><td>tamanho</td><td>${SIZE} bytes</td></tr><tr><td>Content-Type</td><td>${MIME}</td></tr><tr><td>x-amz-meta-produto</td><td>4521</td></tr><tr><td>tag</td><td>categoria=gatos</td></tr><tr><td>ETag</td><td>9b2cf535…</td></tr></table><li>Metadados ricos: você inventa os campos que quiser.</li>` },
      { title: 'GET: qualquer um com a URL e permissão', focus: 'mid', zoom: 1, ph0: 'bucket',
        story: 'O servidor B não monta nada: faz um GET na mesma URL e recebe a foto. O navegador do cliente pode fazer o mesmo, direto ou por uma CDN. Cada pedido leva dezenas de milissegundos, mais que um disco, mas o bucket aguenta bilhões de objetos e milhares de pedidos ao mesmo tempo.',
        look: 'Luzes saem do bucket para o A e para o B, pelo mesmo arco alto do HTTPS.',
        key: 'Ler = GET na URL; não precisa montar disco nem pasta.',
        cmd: { who: 'no servidor B (ou no navegador)', code: `GET ${URL}`, out: `→ 200 OK · Content-Type: ${MIME} · 2457600 bytes · ~30 ms (exemplo)` },
        legs: [{ path: 'b_o', dir: -1, card: ['GET → 200 OK', 'acc', 'a foto inteira, ~30 ms'], at: 'sky' }, { path: 'a_o', dir: -1, par: true }],
        srv: ld => ({ A: ld(1) ? ['GET ✓', '200 OK', 'ok'] : ['GET…', '', 'hi'], B: ld(0) ? ['GET ✓', '200 OK', 'ok'] : ['GET…', '', 'hi'] }), sto: { obj: true },
        data: () => '<li>Quem pode ler é decidido por permissões (políticas do bucket) ou por uma URL assinada que expira.</li><li>Primeiro byte em dezenas de ms (exemplo); a vantagem é escala e preço, não latência.</li>' },
      { title: 'E se eu quiser trocar só um pedaço?', focus: 'mid', zoom: 1, ph0: 'bucket', fail: true,
        story: 'A loja quer corrigir só o cabeçalho EXIF, os mesmos 4 KB que no volume de blocos bastava regravar. No object storage não dá para escrever no meio de um objeto: não existe "grave 4 KB na posição 0". O A manda a foto inteira de novo, 2,4 MB, num novo PUT, e o objeto é trocado de uma vez (a versão velha some ou vira histórico, se o versionamento estiver ligado).',
        look: 'Um cubinho de 4 KB tenta entrar no objeto e é recusado (✕). Depois a foto inteira viaja de novo e o ETag muda.',
        key: 'Objeto não se edita aos pedaços: para mudar 4 KB, troque o objeto inteiro.',
        cmd: { who: 'no servidor A', code: `PUT ${URL}\n(os 2\u00a0457\u00a0600 bytes de novo)`, out: `→ 200 OK · ETag: ${ETAG2}` },
        legs: [{ path: 'a_o', dir: 1, stop: 0.85, card: ['✕ não existe "gravar 4 KB no meio"', 'acc', 'só o objeto inteiro'], at: 'sky' }, { path: 'a_o', dir: 1, carry: 'copy', ph2: 'bucket', card: ['PUT inteiro de novo', 'acc', '2,4 MB · ETag novo'], at: 'sky' }],
        srv: ld => ({ A: ld(1) ? ['200 OK', 'ETag e4d9…', 'ok'] : ld(0) ? ['✕ sem pedaço', 'PUT inteiro', 'bad'] : ['editar 4 KB…', '', 'hi'], B: IDLE }), sto: ld => ({ obj: true, v2: ld(1) }),
        data: () => `<li>Antes: ETag ${ETAG1}</li><li>Depois: ETag ${ETAG2} (exemplo)</li><li>Mudou 4 KB, mas subiram de novo 2&nbsp;457&nbsp;600 bytes.</li><li>Com versionamento ligado, a versão anterior continua guardada (e cobrada).</li>` },
      { title: 'Quando o objeto é a escolha certa', focus: 'bucket', zoom: 0.7, ph0: 'bucket',
        story: 'Fotos, vídeos, backups, logs, arquivos de dados: coisas grandes, gravadas uma vez e lidas muitas, que precisam caber aos milhões. O object storage escala quase sem limite, cobra pouco por GB e replica os dados entre zonas sozinho. Não serve para um banco de dados (escrita aleatória) nem para quem precisa de pastas e locks.',
        look: 'O bucket com seus objetos e a foto dentro; os servidores só fazem PUT e GET.',
        key: 'Muito dado e pouca edição: object storage.',
        cmd: { who: 'no servidor B', code: 'aws s3 cp s3://loja-fotos/produtos/gatos/gato.jpg .', out: '→ download: s3://loja-fotos/produtos/gatos/gato.jpg to ./gato.jpg' },
        legs: [{ pulse: 'obj', card: ['bilhões de objetos', 'acc', 'barato por GB · réplicas automáticas'], at: 'bk' }],
        srv: { A: ['PUT / GET', 'por HTTP', 'ok'], B: ['PUT / GET', 'por HTTP', 'ok'] }, sto: { obj: true, v2: true },
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
  const cmdHtml = c => `<div class="s3-cmd"><b>Como o programa pede a foto</b><i>${c.who}</i><code>${esc(c.code)}</code><span>${esc(c.out)}</span></div>`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function nowHtml() { const s = cur(); return s.data(); }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Tipo de storage">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCBTN[v]}</button>`).join('')}</div>
      ${cmdHtml(s.cmd)}
      <h2>${s.title}</h2>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now" id="stonow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'storage') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · gato.jpg 2,4 MB`; }
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
    x.fillStyle = C.ink; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('SERVIDOR', u(34), u(9));
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
    x.fillText(st === 'file' ? 'gato.jpg' : '(vazio)', u(24), u(25)); if (st === 'file') { x.font = `${u(3.8)}px ${MONO3}`; x.fillText('2,4 MB', u(24), u(32)); }
    cv.tex.needsUpdate = true;
  }
  function drawSwitch(on) {
    const key = on + theme; if (keys.get('sw') === key) return; keys.set('sw', key);
    const cv = swScr, { x, P } = cv, { C, A_, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('SWITCH · rede', u(5), u(8));
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
    x.fillText(off ? '✕ sem energia' : st === 'file' ? 'gato.jpg' : '(vazia)', u(72), u(46)); if (st === 'file') { x.font = `${u(4.4)}px ${MONO3}`; x.fillText('2,4 MB', u(72), u(55)); }
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
      else x.fillText(mine ? '4 KB' : other ? 'outros' : 'livre', u(x0 + w / 2), u(y0 + 23)); }
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
    if (st.meta) { x.fillText(N0.perm, u(30), u(19)); x.fillText('loja · 2,4 MB', u(30), u(27)); x.fillText('14/10 10:02', u(30), u(34)); }
    else { x.fillText(N0.perm, u(30), u(20)); x.fillText('dono ' + N0.own, u(30), u(29)); }
    if (st.lock) { x.fillStyle = acc; x.font = `600 ${u(6.4)}px ${MONO3}`; x.fillText('LOCK · A', u(30), u(36)); }
    cv.tex.needsUpdate = true;
  }
  function drawBucket(has, v2) {
    const key = has + '|' + v2 + theme; if (keys.get('bk') === key) return; keys.set('bk', key);
    const cv = bkScr, { x, P } = cv, { C, acc } = colors(), u = v => v * P;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText('loja-fotos · chaves (lista plana)', u(5), u(6));
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
      const name = 'SERVIDOR ' + k;
      tSrv[k].set(phone ? `${k} · ${S[k][0]}` : `${name}\n${S[k][0]}`, S[k][2] === 'ok' || S[k][2] === 'bad' ? 'acc' : 'hi').at(SX[k] + 40, 208, 127 + 23 * ZC); }
    for (const k of ['A', 'B', 'C']) if (!S[k] || !VIS[sc].includes(k)) tSrv[k].hide();
    // storage de cada modo
    if (sc === 'das') { drawDisk(st.disk); diskCap.emissiveIntensity = pulse.disk ?? (cableOn ? 0.4 : 0);
      if (card && card.at === 'disk' || phone) tSto.hide(); else tSto.set('SSD NVMe do servidor A\n/dev/nvme0n1 · /data', 'hi').at(151, 262, 40); }
    if (sc === 'nas' || sc === 'file') drawSwitch(lit.size > 0);
    if (sc === 'nas') { drawNas(st.nas); nasCap.emissiveIntensity = st.nas === 'off' ? 0 : pulse.nas ?? (lit.size ? 0.4 : 0.15);
      tSto.set(phone ? 'NAS' : 'NAS · nas.loja\n/export/fotos (NFS · SMB)', st.nas === 'off' ? 'dim' : 'hi').at(OX + 535, 140, 14); }
    if (sc === 'block') { tSto.set(phone ? 'VOLUME · só blocos' : 'VOLUME vol-0a1b2c · 100 GB\nsó blocos numerados (LBA)', 'hi').at(OX + 700, 40, 14); }
    if (sc === 'file') { const w = st.walk === 'walk' ? walkN : (st.walk || 0);
      for (const k of Object.keys(NODES)) { const on = WALK.indexOf(k) >= 0 && WALK.indexOf(k) < w;
        drawNode(k, { on, meta: k === 'foto' && !!st.meta, lock: k === 'foto' && !!st.lock, rename: !!st.rename });
        NODES[k].cap.emissiveIntensity = pulse[k] != null ? pulse[k] * 0.6 : on ? 0.22 : 0; }
      edgeLines.forEach(e => { e.lit.visible = WALK.indexOf(e.b) >= 0 && WALK.indexOf(e.b) < w; });
      if (phone || step > 0) tSto.hide(); else tSto.set('FILE STORAGE (EFS · NFS)\nárvore de pastas', 'hi').at(OX + 560, 0, 70); }
    if (sc === 'object') { OBJS.forEach(o => { o.cap.emissiveIntensity = pulse.obj ?? 0.12; }); drawBucket(!!st.obj, v2);
      tSto.set(phone ? 'BUCKET loja-fotos' : 'BUCKET loja-fotos\nobjetos soltos · HTTP', 'hi').at(OX + 560, 172, 14); }
    // etiqueta da foto: o dado real de cada modo
    const phAt = phFly || (ph && PHP[ph]);
    let phTxt = null;
    if (phAt && !phFly) {
      if (sc === 'object' && st.obj && st.meta) phTxt = 'chave: produtos/gatos/gato.jpg\nContent-Type: image/jpeg\nx-amz-meta-produto: 4521';
      else if (sc === 'object' && st.obj) phTxt = 'produtos/gatos/gato.jpg\nETag ' + (v2 ? 'e4d9…' : '9b2c…');
      else if (sc === 'file' && ph === 'tree') phTxt = (st.rename ? '/produtos/felinos/gato.jpg' : '/produtos/gatos/gato.jpg') + (st.lock ? '\nLOCK_EX · servidor A' : '');
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: VIEW,
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · tipo: C ou 1 a 5 · arraste para girar' };
})() });
