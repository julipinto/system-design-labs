// Figura 3D (iso-glow): TCP x UDP.
// O celular da Lena (cliente, à esquerda) manda ao servidor do app (à direita, ao fundo) as 3 primeiras fatias da foto do gato
// (3 segmentos de 100 bytes; as fatias reais têm ~1.460 bytes, o exemplo é menor para caber na tela).
// Dois trilhos: o de cima leva segmentos ao servidor, o da frente traz os ACKs. Na frente do servidor, o buffer de
// recepção com 3 vagas (bytes 101–200, 201–300, 301–400). O #2 cai do trilho; no TCP ele volta, no UDP some de vez.
// Números (ISN 100 e 300, portas 51234 → 443) são os do widget da aula 4; são exemplos.
FIGS3D.push({ id: 'tcp', name: 'TCP · UDP', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── geometria (unidades iso) ──
  const DY = 150, AY = 210, RX0 = 150, RX1 = 548, CHX = 704;          // trilho de dados (y=150), de ACKs (y=210)
  const RZ = 24, TRAY_Z = 13, SX = [578, 620, 662], SY = 150, SRV_FRONT = 120;
  const RANGES = ['101–200', '201–300', '301–400'];

  plateWith(g0, 730, 250, [[18, 18], [712, 18], [18, 232], [712, 232]]);
  label('A REDE · Wi-Fi, roteadores, cabos', 230, 12, 8, onTop(350, 78, 7), g0);

  // celular na base (cliente)
  const phoneG = new THREE.Group(); phoneG.userData.go = 'hs'; g0.add(phoneG);
  rbox(30, 125, 7, 120, 110, 10, 8, bodyMat, phoneG);
  rbox(73, 150, 17, 40, 15, 45, 3, bodyMat, phoneG);
  rbox(60, 165, 17, 66, 10, 140, 9, bodyMat, phoneG);
  const phScr = faceCanvas('front', 64, 175, 152, 58, 126, 5, phoneG);
  const phLed = dotFront(93, 175, 23, 2.2, phoneG); const phGlow = glowPoints([W(93, 176, 23)], 0.22); g0.add(phGlow);

  // servidor (ao fundo, à direita)
  const srvG = new THREE.Group(); srvG.userData.go = 'srv'; g0.add(srvG);
  rbox(560, 20, 7, 140, 100, 110, 6, bodyMat, srvG);
  const srvCv = faceCanvas('front', 566, SRV_FRONT, 113, 128, 72, 5, srvG);
  slitsUV(frontUV(560, SRV_FRONT, 117), 14, 110, 4, 80, 104, srvG);
  const srvLed = dotFront(684, SRV_FRONT, 26, 2.6, srvG); const srvGlow = glowPoints([W(684, SRV_FRONT + 1, 26)], 0.22); g0.add(srvGlow);

  // trilhos (esteiras)
  const railMatD = capMat(), railMatA = capMat(); twCaps.push(railMatD, railMatA);
  const railD = new THREE.Group(); railD.userData.go = 'loss'; g0.add(railD);
  rbox(RX0, DY - 14, 7, RX1 - RX0, 28, 17, 4, railMatD, railD);
  const railA = new THREE.Group(); railA.userData.go = 'loss'; g0.add(railA);
  rbox(RX0, AY - 14, 7, CHX + 10 - RX0, 28, 17, 4, railMatA, railA);
  rbox(CHX - 10, SRV_FRONT, 7, 20, AY - SRV_FRONT - 4, 17, 3, railMatA, railA);          // rampa do servidor até o trilho de ACKs
  const slats = (y, x0, x1) => { const s = []; for (let x = x0; x <= x1; x += 14) s.push([[x, y - 12, RZ + 0.1], [x, y + 12, RZ + 0.1]]); return s; };
  seg([...slats(DY, 300, RX1 - 8), ...slats(AY, RX0 + 8, 250), ...slats(AY, 380, CHX - 16)], g0);
  label('PARA O SERVIDOR DO APP →', 96, 10, 6.5, onTop(222, DY, RZ), g0);
  label('← PARA O CELULAR DA LENA', 96, 10, 6.5, onTop(316, AY, RZ), g0);
  const rimD = polyLine([[RX0, DY - 14, RZ + 0.2], [RX1, DY - 14, RZ + 0.2], [RX1, DY + 14, RZ + 0.2], [RX0, DY + 14, RZ + 0.2], [RX0, DY - 14, RZ + 0.2]], accentLineMat, g0);
  const rimA = polyLine([[RX0, AY - 14, RZ + 0.2], [CHX + 10, AY - 14, RZ + 0.2], [CHX + 10, AY + 14, RZ + 0.2], [RX0, AY + 14, RZ + 0.2], [RX0, AY - 14, RZ + 0.2]], accentLineMat, g0);

  // buffer de recepção (bandeja na frente do servidor)
  const trayG = new THREE.Group(); trayG.userData.go = 'buf'; g0.add(trayG);
  rbox(552, 126, 7, 136, 60, 6, 5, bodyMat, trayG);
  SX.forEach(x => inset(x - 19, SY - 19, TRAY_Z, 38, 38, 4, trayG));
  label('BUFFER DE RECEPÇÃO', 120, 9, 6.2, onTop(620, 178, TRAY_Z), trayG);
  const rngT = SX.map((x, k) => label(RANGES[k], 34, 9, 6.4, onTop(x, SY, TRAY_Z), trayG));
  const rngU = SX.map((x, k) => label('#' + (k + 1), 34, 9, 7, onTop(x, SY, TRAY_Z), trayG));
  // a vaga vazada: contorno tracejado aceso
  const dash = []; { const x0 = SX[1] - 21, x1 = SX[1] + 21, y0 = SY - 21, y1 = SY + 21, z = TRAY_Z + 0.3, n = 6;
    for (let i = 0; i < n; i++) { const a = i / n, b = (i + 0.55) / n;
      dash.push([[x0 + (x1 - x0) * a, y0, z], [x0 + (x1 - x0) * b, y0, z]], [[x0 + (x1 - x0) * a, y1, z], [x0 + (x1 - x0) * b, y1, z]],
        [[x0, y0 + (y1 - y0) * a, z], [x0, y0 + (y1 - y0) * b, z]], [[x1, y0 + (y1 - y0) * a, z], [x1, y0 + (y1 - y0) * b, z]]); } }
  const holeG = new THREE.Group(); g0.add(holeG); seg(dash, holeG, accentLineMat);

  // blocos: 3 segmentos de dados (fixos) e 2 de controle (reaproveitados)
  const blocks = [];
  function mkBlock(w, d, h, data) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-w / 2, -d / 2, 0, w, d, h, 3, mat, g);
    const cv = faceCanvas('top', -w / 2, -d / 2, h, w, d, 8, g, true);
    const glow = glowPoints([W(0, 0, 0)], 0.24); g0.add(glow); g.visible = false;
    const b = { g, mat, cv, glow, w, d, txt: '', key: '', data }; blocks.push(b); return b;
  }
  function drawTop(b, text) {
    const key = text + theme; if (key === b.key) return; b.key = key; b.txt = text;
    const { x, P } = b.cv, C = pal3(); x.clearRect(0, 0, b.cv.c.width, b.cv.c.height);
    x.fillStyle = C.inkHi; x.textAlign = 'center'; x.textBaseline = 'middle';
    const fs = text.length > 4 ? 7 : text.length > 2 ? 9 : 12; x.font = `600 ${fs * P}px ${MONO3}`;
    x.fillText(text, b.w / 2 * P, b.d / 2 * P + P * 0.5); b.cv.tex.needsUpdate = true;
  }
  const DB = [0, 1, 2].map(() => mkBlock(34, 28, 16, true));
  const CB = [0, 1].map(() => mkBlock(32, 22, 9, false));
  hazeAndShadow(g0, 365, 130, 8, 3.2);
  creases(first);

  // ── rótulos que olham para a câmera (sempre legíveis) ──
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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = NARROW() ? 1.25 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tCli = tag(14), tSrv = tag(14), tConn = tag(13), tLost = tag(13), tWait = tag(13), tTimer = tag(12), tNoAck = tag(12);
  const tMsg = [tag(13), tag(13)];

  // ── mensagens (mesmos números do widget da aula: TCP_MSGS / TCP_SEG / UDP_SEG) ──
  const TCP = [
    { k: 'c', lab: 'SYN', dir: '>', f: ['SYN'], seq: 100, ack: null, len: 0, send: { c: 'SYN_SENT' }, arr: { s: 'SYN_RECEIVED' } },
    { k: 'c', lab: 'SYN-ACK', dir: '<', f: ['SYN', 'ACK'], seq: 300, ack: 101, len: 0, arr: { c: 'ESTABLISHED' } },
    { k: 'c', lab: 'ACK', dir: '>', f: ['ACK'], seq: 101, ack: 301, len: 0, arr: { s: 'ESTABLISHED' } },
    { k: 'd', seg: 0, lab: '#1', dir: '>', f: ['ACK', 'PSH'], seq: 101, ack: 301, len: 100 },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 201, len: 0 },
    { k: 'd', seg: 1, lab: '#2', dir: '>', f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, lost: true },
    { k: 'd', seg: 2, lab: '#3', dir: '>', f: ['ACK', 'PSH'], seq: 301, ack: 301, len: 100 },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 201, len: 0, dup: true },
    { k: 'd', seg: 1, lab: '#2', dir: '>', f: ['ACK', 'PSH'], seq: 201, ack: 301, len: 100, retx: true },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 401, len: 0 },
    { k: 'c', lab: 'FIN', dir: '>', f: ['FIN', 'ACK'], seq: 401, ack: 301, len: 0, send: { c: 'FIN_WAIT_1' }, arr: { s: 'CLOSE_WAIT' } },
    { k: 'c', lab: 'ACK', dir: '<', f: ['ACK'], seq: 301, ack: 402, len: 0, arr: { c: 'FIN_WAIT_2' } },
    { k: 'c', lab: 'FIN', dir: '<', f: ['FIN', 'ACK'], seq: 301, ack: 402, len: 0, send: { s: 'LAST_ACK' }, arr: { c: 'TIME_WAIT' } },
    { k: 'c', lab: 'ACK', dir: '>', f: ['ACK'], seq: 402, ack: 302, len: 0, arr: { s: 'CLOSED' } },
  ];
  const UDP = [
    { k: 'd', seg: 0, lab: '#1', dir: '>', len: 100, udp: true },
    { k: 'd', seg: 1, lab: '#2', dir: '>', len: 100, udp: true, lost: true },
    { k: 'd', seg: 2, lab: '#3', dir: '>', len: 100, udp: true },
  ];
  const MSGS = { tcp: TCP, udp: UDP };
  const msgTag = M => M.udp ? `datagrama ${M.lab}\nsem seq · ${M.len} B` :
    M.k === 'd' ? `${M.retx ? '↻ ' : ''}${M.lab} · ${M.len} B\nseq=${M.seq}` :
    `${M.dup ? 'ACK duplicado' : M.lab}\n${M.f.includes('SYN') && M.ack == null ? 'seq=' + M.seq : M.lab === 'FIN' ? 'seq=' + M.seq : 'ack=' + M.ack}`;
  const topTxt = M => M.k === 'd' ? M.lab : M.lab === 'SYN-ACK' ? 'S+A' : M.lab;

  // ── roteiro ──
  const SUM = `<table class="h3-sum"><tr><th></th><th>TCP</th><th>UDP</th></tr>
    <tr><td>Conexão</td><td>handshake, 1 RTT</td><td>não tem</td></tr>
    <tr><td>Ordem</td><td>seq; reordena</td><td>não garante</td></tr>
    <tr><td>Confirmação</td><td>ACK cumulativo</td><td>não tem</td></tr>
    <tr><td>Perda</td><td>reenvia</td><td>some</td></tr>
    <tr><td>Cabeçalho</td><td>20 B no mínimo</td><td>8 B</td></tr>
    <tr><td>Neste exemplo</td><td>14 msgs, 300 B</td><td>3 msgs, 200 B</td></tr></table>`;
  const STEPS = {
    tcp: [
      { title: 'A Lena vai mandar a foto do gato', dur: 0, ev: [],
        story: 'A Lena, em São Paulo, aperta enviar: o celular dela vai mandar a foto do gato ao irmão, em Tóquio, passando pelo servidor do app (o servidor de mensagens que entrega a foto a ele). Os 313 KB viram 215 fatias, e o TCP garante que todas cheguem inteiras e em ordem. Aqui acompanhamos só as 3 primeiras fatias, 300 bytes. Para caber na tela, a figura usa fatias de 100 bytes; as reais têm ~1.460 bytes. Os números de seq e ack são de exemplo.',
        look: 'À esquerda o celular da Lena, com a foto do gato na tela; à direita o servidor do app. O trilho de cima leva as fatias; o da frente traz as respostas. Na frente do servidor, o buffer de recepção tem 3 vagas vazias, uma para cada fatia.',
        key: 'TCP: a foto da Lena chega inteira por conexão, bytes numerados, confirmação e reenvio.' },
      { title: 'Handshake: SYN, SYN-ACK, ACK', dur: 7.6, ev: [[0, 0.3], [1, 2.6], [2, 5.3]],
        story: 'Antes de qualquer fatia da foto, os dois combinam a conversa. O celular da Lena manda SYN e escolhe seu número inicial (ISN): 100. O servidor do app responde SYN-ACK com o ISN dele, 300, e ack=101: "espero o seu byte 101". O celular confirma com ACK.',
        look: 'Três blocos sem dados vão, voltam e vão. As placas trocam de estado: SYN_SENT, SYN_RECEIVED e, no fim, ESTABLISHED dos dois lados.',
        key: 'Three-way handshake: 1 RTT antes do primeiro byte de dados.' },
      { title: 'O segmento #1 chega', dur: 3.4, ev: [[3, 0.3]],
        story: 'Conexão aberta. O celular da Lena manda a fatia #1 da foto: seq=101, 100 bytes (do 101 ao 200). Ele guarda uma cópia até a confirmação chegar, para poder reenviar. O #1 chega e ocupa a primeira vaga do buffer do servidor do app.',
        look: 'O bloco #1 corre pelo trilho de cima e cai na vaga 101–200.',
        key: 'Cada byte tem número; seq diz onde o segmento começa.' },
      { title: 'ACK 201', dur: 3.0, ev: [[4, 0.3]],
        story: 'O servidor do app responde ack=201: "recebi tudo até o 200, agora espero o 201". Quando o ACK chega, o celular da Lena apaga a cópia do #1: essa fatia da foto já está garantida.',
        look: 'Um ACK sai do servidor e volta pelo trilho da frente. Na tela do celular da Lena, o #1 vira "confirmado".',
        key: 'O ACK diz qual é o próximo byte que o receptor espera.' },
      { title: 'O #2 se perde', dur: 3.2, ev: [[5, 0.3]],
        story: 'A Lena não espera: o celular manda a fatia #2 da foto (seq=201) e, logo atrás, a #3. No meio do caminho a #2 se perde: Wi-Fi ruim ou um roteador com a fila cheia. Ninguém avisa. O celular ainda acha que está tudo certo.',
        look: 'O bloco #2, uma fatia da foto, cai do trilho e some.',
        key: 'A rede perde pacotes em silêncio. Quem percebe é o TCP.' },
      { title: 'O #3 chega fora de ordem', dur: 3.4, ev: [[6, 0.3]],
        story: 'A fatia #3 (seq=301) chega inteira. O servidor do app guarda no buffer, mas não entrega: falta o pedaço 201–300 no meio. Montar a foto fora de ordem estragaria o gato.',
        look: 'O #3 ocupa a última vaga, apagado. A vaga do meio fica vazada, com "esperando".',
        key: 'O TCP guarda o que chegou fora de ordem e espera o buraco fechar.' },
      { title: 'ACK duplicado', dur: 3.0, ev: [[7, 0.3]],
        story: 'O servidor responde de novo ack=201. O ACK é cumulativo: só pode dizer "recebi tudo até aqui", e o "aqui" continua sendo o byte 200. Para o celular da Lena, receber o mesmo ack outra vez é sinal de que algo faltou.',
        look: 'Volta outro ACK com o mesmo número, 201. O buffer não muda.',
        key: 'ACK repetido: alguma coisa faltou depois daquele byte.' },
      { title: 'O #2 é reenviado', dur: 4.0, ev: [[8, 0.9]],
        story: 'O celular da Lena ainda tem a cópia do #2 e reenvia a mesma fatia: seq=201, 100 bytes. Neste exemplo quem dispara é o timer de reenvio, que venceu sem ACK. Com 3 ACKs duplicados o TCP reenviaria antes do timer (fast retransmit).',
        look: 'O #2 sai de novo do celular da Lena e preenche a vaga do meio. As 3 vagas estão cheias e em ordem.',
        key: 'Sem confirmação, o TCP reenvia a partir da cópia guardada.' },
      { title: 'ACK 401 e entrega ao app', dur: 4.2, ev: [[9, 1.6]], del: 0.3,
        story: 'Com o buraco fechado, os bytes de 101 a 400 estão em ordem e o app do servidor lê as 3 fatias, 300 bytes. Um único ACK, ack=401, confirma tudo, inclusive o #3. (O #1 já podia ter sido lido antes, porque estava em ordem; o que o TCP nunca faz é entregar o #3 antes do #2.)',
        look: 'Os três blocos entram no servidor e a tela dele mostra 300 de 300 bytes. Um ACK com 401 volta ao celular da Lena.',
        key: 'ACK cumulativo: um número confirma tudo o que veio antes.' },
      { title: 'O celular da Lena fecha o lado dele', dur: 5.4, ev: [[10, 0.3], [11, 2.7]],
        story: 'Neste exemplo, a Lena não tem mais fatias para mandar. O celular envia FIN (seq=401) e passa a FIN_WAIT_1. O servidor do app confirma com ack=402 e fica em CLOSE_WAIT: ele ainda pode mandar dados, se tiver.',
        look: 'Um FIN vai, um ACK volta. As placas mostram FIN_WAIT_2 no celular e CLOSE_WAIT no servidor.',
        key: 'Cada sentido da conexão fecha separado.' },
      { title: 'O servidor do app fecha o dele', dur: 5.4, ev: [[12, 0.3], [13, 2.9]],
        story: 'Quando termina, o servidor do app manda o próprio FIN (seq=301) e vai para LAST_ACK. O celular da Lena confirma com ack=302 e o servidor fecha. O celular ainda fica um tempo em TIME_WAIT, caso esse último ACK se perca e o FIN volte.',
        look: 'Agora o FIN vem do servidor e o ACK vai. Servidor: CLOSED. Celular: TIME_WAIT.',
        key: 'Four-way close: FIN, ACK, FIN, ACK.' },
      { title: 'Resumo: 14 segmentos para 3 fatias', dur: 1.2, ev: [], tw: 0.8,
        story: 'Para entregar as 3 primeiras fatias da foto (300 bytes), o TCP trocou 14 segmentos: 3 para abrir, 7 de dados e ACKs (contando o reenvio) e 4 para fechar. Tudo chegou inteiro e em ordem, apesar da perda: com as 215 fatias seria o mesmo, e o irmão veria o gato sem buracos. Depois do TIME_WAIT (2 × MSL: de segundos a alguns minutos, depende do sistema), o celular também fecha.',
        look: 'As duas placas em CLOSED e o app do servidor com as 3 fatias, 300 bytes. Troque para UDP no painel para comparar.',
        key: 'TCP troca velocidade por garantia: ordem, confirmação e reenvio.', sum: true },
    ],
    udp: [
      { title: 'E se fosse uma ligação de vídeo?', dur: 0, ev: [],
        story: 'E se, em vez de uma foto, a Lena estivesse numa ligação de vídeo com o irmão? É o cenário de ligação da figura OSI: o vídeo nasce a cada instante e vai em pedaços, aqui os mesmos 3 pedaços de 100 bytes, e o transporte é UDP. Não existe conexão: nada de handshake, nada de estado, nada de número de sequência.',
        look: 'A tela do celular da Lena segue enviando. As placas não mostram estado: sem conexão, não há estado para mostrar. O trilho da frente vai ficar vazio.',
        key: 'UDP: manda e esquece.' },
      { title: 'Datagrama #1, direto', dur: 3.4, ev: [[0, 0.3]],
        story: 'Sem combinar nada, o celular da Lena já manda o primeiro pedaço do vídeo. Ele chega e vai direto para o app do servidor. Ninguém responde: no UDP não existe ACK.',
        look: 'O #1 sai na hora, sem SYN antes, e cai na primeira vaga. Nada volta pelo trilho da frente.',
        key: 'Sem handshake: o primeiro dado sai na hora.' },
      { title: 'O #2 se perde', dur: 3.2, ev: [[1, 0.3]],
        story: 'O #2 se perde no caminho, como a fatia #2 da foto. A diferença: o celular da Lena não guardou cópia e nunca vai saber. Não existe ACK para deixar de chegar.',
        look: 'O #2 cai do trilho e some. Ninguém reage.',
        key: 'No UDP, a perda é silenciosa e definitiva.' },
      { title: 'O #3 chega e é entregue', dur: 3.4, ev: [[2, 0.3]],
        story: 'O #3 chega e vai direto para o app, sem esperar nada. O servidor do app não sabe que existiu um #2: o datagrama não tem seq para mostrar o buraco.',
        look: 'O #3 ocupa a última vaga, aceso. A do meio fica vazia e sem "esperando": ninguém está esperando.',
        key: 'Cada datagrama é independente: chegou, entregou.' },
      { title: 'Fim: 200 de 300 bytes (o vídeo trava um instante)', dur: 0, ev: [],
        story: 'O servidor ficou com o #1 e o #3: 200 bytes. O celular da Lena acha que mandou tudo. Foram 3 mensagens, contra 14 do TCP. Na ligação, o irmão vê uma travadinha e a chamada segue: para voz, vídeo ao vivo e jogos, perder um pedaço é melhor do que esperar por ele. Para a foto do gato, isso seria um buraco na imagem. Se o app precisar de garantia, ele mesmo implementa (o QUIC faz isso em cima do UDP).',
        look: 'A vaga do meio vazia para sempre e nenhum ACK no trilho da frente.',
        key: 'UDP é rápido e leve; a garantia fica com a aplicação.', sum: true },
    ],
  };
  const DT = 2.0, DA = 2.4, HOP = 0.6, SINK = 0.9;           // segundos de tela
  function build(mode) {
    const S = STEPS[mode], off = [], ev = []; let o = 0, del = Infinity, tw = Infinity, ci = 0;
    S.forEach((s, k) => { off.push(o);
      s.ev.forEach(([m, t]) => { const M = MSGS[mode][m], D = M.dir === '>' ? DT : DA, e = { m, M, ts: o + t, D, ta: o + t + D, step: k };
        if (M.lost) e.tf = e.ts + D * 0.5; if (M.k === 'c') e.pool = ci++ % 2; ev.push(e); });
      if (s.del != null) del = o + s.del; if (s.tw != null) tw = o + s.tw; o += s.dur; });
    return { off, ev, del, tw };
  }
  const TL = { tcp: build('tcp'), udp: build('udp') };
  const MAP = { tcp: [0, 1, 1, 1, 2, 3, 3, 3, 4, 4, 4, 4], udp: [0, 2, 4, 5, 11] };      // passo equivalente no outro cenário
  const GO = { tcp: { hs: 1, loss: 4, buf: 5, srv: 8 }, udp: { hs: 1, loss: 2, buf: 3, srv: 4 } };

  let step = 0, mode = 'tcp', lt = 0, hold = 0, playing = false, dwell = 0, followT = 1.6, last = 0;
  try { const v = localStorage.getItem('sdlabs-tcp3d-mode'); if (v === 'tcp' || v === 'udp') mode = v; } catch (e) {}
  const N = () => STEPS[mode].length;

  // ── estado num instante T (tudo é função pura de T, então voltar um passo funciona) ──
  function stateAt(T) {
    const tl = TL[mode], udp = mode === 'udp';
    let c = udp ? null : 'CLOSED', s = udp ? null : 'LISTEN', ct = -1, st = -1;
    if (!udp) {
      const ch = [];
      tl.ev.forEach(e => { if (e.M.send) for (const [k, v] of Object.entries(e.M.send)) ch.push([e.ts, k, v]);
        if (e.M.arr) for (const [k, v] of Object.entries(e.M.arr)) ch.push([e.ta, k, v]); });
      ch.push([tl.tw, 'c', 'CLOSED']); ch.sort((a, b) => a[0] - b[0]);
      ch.forEach(([t, k, v]) => { if (t <= T) { if (k === 'c') { c = v; ct = t; } else { s = v; st = t; } } });
    }
    const present = [0, 1, 2].map(k => tl.ev.some(e => e.M.k === 'd' && e.M.seg === k && !e.M.lost && T >= e.ta + HOP));
    const delivered = !udp && T >= tl.del;
    const slot = present.map((p, k) => {
      if (udp) return p ? 'ok' : '';
      if (delivered) return 'done';
      if (p) return present.slice(0, k).every(Boolean) ? 'ok' : 'held';
      return present.slice(k + 1).some(Boolean) ? 'hole' : '';
    });
    const sendBuf = [0, 1, 2].map(k => {
      const sent = tl.ev.filter(e => e.M.k === 'd' && e.M.seg === k && e.ts <= T);
      if (!sent.length) return 'fila';
      if (udp) return 'enviado';
      const end = 201 + 100 * k;
      if (tl.ev.some(e => e.M.dir === '<' && e.M.ack != null && e.M.ack >= end && e.M.lab !== 'SYN-ACK' && T >= e.ta)) return 'ok';
      return sent[sent.length - 1].M.retx ? 'retx' : 'sent';
    });
    const appBytes = udp ? present.filter(Boolean).length * 100 : (T >= tl.del + SINK * 0.6 ? 300 : 0);
    return { c, s, ct, st, slot, sendBuf, appBytes, present };
  }

  // ── telas do celular e do servidor ──
  let phKey = '', srvKey = '';
  function drawPhone(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === phKey) return; phKey = key;
    const { x, P } = phScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, W_ = 58;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, phScr.c.width, phScr.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = C.line; x.beginPath(); x.roundRect(u(21), u(4), u(16), u(3), u(1.5)); x.fill();
    x.fillStyle = C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText('foto do gato', u(W_ / 2), u(11));
    x.fillStyle = C.ink; x.font = `${u(5.6)}px ${MONO3}`; x.fillText('· enviando', u(W_ / 2), u(18.5));
    x.fillStyle = A_; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(d.udp ? 'UDP' : 'TCP', u(W_ / 2), u(26));
    const TX = { fila: 'na fila', sent: 'enviado', retx: 'reenviado', ok: 'confirmado', enviado: 'enviado' };
    const SUB = { fila: '', sent: 'cópia guardada', retx: 'cópia guardada', ok: 'cópia apagada', enviado: 'sem cópia' };
    d.buf.forEach((b, k) => { const y = 33 + k * 28, on = b === 'ok';
      x.strokeStyle = on ? A_ : C.line; x.lineWidth = u(on ? 0.8 : 0.5); x.beginPath(); x.roundRect(u(4), u(y), u(50), u(24), u(2)); x.stroke();
      x.textAlign = 'left'; x.fillStyle = on ? A_ : C.inkHi; x.font = `600 ${u(7)}px ${MONO3}`; x.fillText(`#${k + 1}`, u(7), u(y + 7));
      x.fillStyle = b === 'fila' ? C.ink : (on ? A_ : C.inkHi); x.font = `${u(5.6)}px ${MONO3}`; x.fillText(TX[b] + (on ? ' ✓' : ''), u(18), u(y + 7));
      x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(SUB[b], u(7), u(y + 17)); });
    x.textAlign = 'center'; x.fillStyle = C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText('porta 51234', u(W_ / 2), u(120));
    phScr.tex.needsUpdate = true;
  }
  function drawServer(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === srvKey) return; srvKey = key;
    const { x, P } = srvCv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, srvCv.c.width, srvCv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8)}px ${MONO3}`; x.fillText('servidor do app :443', u(6), u(9));
    x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(d.udp ? 'app recebeu' : 'app leu', u(6), u(24));
    const full = d.bytes === 300;
    x.fillStyle = full ? A_ : C.inkHi; x.font = `600 ${u(13)}px ${MONO3}`; x.fillText(`${d.bytes}/300 B`, u(6), u(40));
    x.strokeStyle = C.detail; x.lineWidth = u(0.6); x.beginPath(); x.roundRect(u(6), u(52), u(116), u(6), u(2)); x.stroke();
    if (d.bytes) { x.fillStyle = A_; x.beginPath(); x.roundRect(u(6), u(52), u(116 * d.bytes / 300), u(6), u(2)); x.fill(); }
    x.fillStyle = C.ink; x.font = `${u(5.5)}px ${MONO3}`; x.fillText(d.note, u(6), u(66));
    srvCv.tex.needsUpdate = true;
  }

  // ── painel ──
  const pick = st => st;
  function fieldsHtml(M, P) {
    const ports = M.dir === '>' ? '51234 → 443' : '443 → 51234', pPorts = P ? (P.dir === '>' ? '51234 → 443' : '443 → 51234') : null;
    const cls = ch => ch ? ' class="new"' : '';
    if (M.udp) return `<div class="t3-f"><span${cls(!P)}><small>portas</small>${ports}</span><span><small>tamanho</small>${8 + M.len} B</span><span><small>checksum</small>0x3f1a</span>
      <span class="off"><small>seq</small>não existe</span><span class="off"><small>ack</small>não existe</span><span><small>dados</small>${M.len} B</span></div>`;
    const fl = ['SYN', 'ACK', 'PSH', 'FIN'].map(f => `<i class="${M.f.includes(f) ? 'on' : ''}">${f}</i>`).join('');
    const flCh = !P || P.f.join() !== M.f.join();
    return `<div class="t3-f"><span${cls(ports !== pPorts)}><small>portas</small>${ports}</span>
      <span${cls(!P || M.seq !== P.seq)}><small>seq</small>${M.seq}</span>
      <span${M.ack == null ? ' class="off"' : cls(!P || M.ack !== P.ack)}><small>ack</small>${M.ack == null ? '—' : M.ack}</span>
      <span${cls(!P || M.len !== P.len)}><small>len</small>${M.len ? M.len + ' B' : '0'}</span>
      <span class="t3-fl${flCh ? ' new' : ''}"><small>flags</small>${fl}</span></div>`;
  }
  function dataHtml() {
    const S = STEPS[mode][step], ms = MSGS[mode], tl = TL[mode];
    const end = stateAt(tl.off[step] + S.dur), prevEnd = step ? stateAt(tl.off[step] - 1e-6) : stateAt(-1);
    let h = '';
    if (!S.ev.length) h += `<p class="t3-note">${mode === 'tcp' ? (step === 0 ? 'Nenhum segmento ainda. O servidor do app escuta na porta 443; o celular da Lena vai usar uma porta temporária, 51234.' : 'Nenhum segmento neste passo.') : (step === 0 ? 'Nenhum datagrama ainda. Portas: 51234 → 443.' : 'Nenhum datagrama neste passo. E nenhum ACK, nunca.')}</p>`;
    S.ev.forEach(([m]) => { const M = ms[m], P = ms.slice(0, m).reverse().find(q => q.dir === M.dir);
      const name = M.udp ? `datagrama ${M.lab}` : M.k === 'd' ? `${M.retx ? 'reenvio ' : ''}segmento ${M.lab}` : (M.dup ? 'ACK duplicado' : M.lab);
      h += `<div class="t3-msg"><div class="t3-mh"><b>${M.dir === '>' ? '→' : '←'} ${name}</b><span${M.lost ? ' class="lost"' : ''}>${M.lost ? 'se perdeu no caminho' : M.dir === '>' ? 'celular da Lena → servidor' : 'servidor → celular da Lena'}</span></div>${fieldsHtml(M, P)}</div>`; });
    if (mode === 'tcp') h += `<p class="t3-st">estado do celular da Lena: <b${end.c !== prevEnd.c ? ' class="new"' : ''}>${end.c}</b><br>estado do servidor do app: <b${end.s !== prevEnd.s ? ' class="new"' : ''}>${end.s}</b></p>`;
    h += `<p class="t3-note">Em destaque, o que mudou em relação à mensagem anterior no mesmo sentido. ${mode === 'tcp' ? 'ISNs 100 e 300 são exemplos: na vida real são números aleatórios de 32 bits.' : 'O cabeçalho UDP tem só 8 bytes: portas, tamanho e checksum.'}</p>`;
    return h;
  }
  function panelHtml() {
    const st = STEPS[mode][step];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${mode.toUpperCase()}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${['tcp', 'udp'].map(v => `<button data-mode="${v}" aria-pressed="${v === mode}">${v.toUpperCase()}</button>`).join('')}</div>
      <h2>${st.title}</h2>
      <p class="o3-story">${pick(st.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${st.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${st.key}</p>
      ${st.sum ? SUM : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>${mode === 'tcp' ? 'Os campos do segmento' : 'Os campos do datagrama'}</summary>${dataHtml()}</details>`;
  }
  let cur = null;
  function readout() { if (active !== 'tcp') return;
    const s = cur || stateAt(TL[mode].off[step]);
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${mode}` + (mode === 'tcp' ? ` · celular da Lena ${s.c} · servidor do app ${s.s}` : ' · sem conexão'); }
  function render() {
    const info = document.getElementById('info'); if (active === 'tcp' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    rngT.forEach(m => m.visible = mode === 'tcp'); rngU.forEach(m => m.visible = mode === 'udp');
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; hold = 0; dwell = 0; followT = 1.8; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setMode = v => { if (v === mode) return true; const to = MAP[mode][step]; mode = v; phKey = srvKey = '';
    try { localStorage.setItem('sdlabs-tcp3d-mode', v); } catch (e) {} go(to); return true; };
  const cycleMode = () => setMode(mode === 'tcp' ? 'udp' : 'tcp');
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b && active === 'tcp') setMode(b.dataset.mode); });

  // ── um quadro da cena no instante T ──
  const PATH_D = [[RX0 + 18, DY, RZ], [RX1 - 14, DY, RZ]];
  const PATH_A = [[CHX, SRV_FRONT + 10, RZ], [CHX, AY, RZ], [RX0 + 18, AY, RZ]];
  const cumD = cumLen(PATH_D), cumA = cumLen(PATH_A);
  const onPath = (dir, f) => dir === '>' ? alongPts(PATH_D, cumD, Math.max(0, Math.min(1, f))) : alongPts(PATH_A, cumA, Math.max(0, Math.min(1, f)));
  const sm = f => f * f * (3 - 2 * f);
  const place = (b, p, k, s = 1) => { b.g.visible = true; b.g.position.copy(W(...p)); b.g.scale.setScalar(Math.max(0.001, s)); b.mat.emissiveIntensity = k; moveGlow(b.glow, [p[0], p[1], p[2] + 6], k > 0.5 ? 0.8 * s : 0); };
  const off = b => { b.g.visible = false; b.glow.material.uniforms.intensity.value = 0; };

  function scene3(T) {
    const tl = TL[mode], udp = mode === 'udp', S = stateAt(T); cur = S;
    const stepStart = tl.off[step];
    let flying = [];
    // blocos de dados
    DB.forEach((b, k) => {
      const evs = tl.ev.filter(e => e.M.k === 'd' && e.M.seg === k && e.ts <= T), e = evs[evs.length - 1];
      if (!e) return off(b);
      drawTop(b, e.M.lab);
      if (e.M.lost) {
        if (T < e.tf) { place(b, onPath('>', (T - e.ts) / e.D), 1); flying.push([e, b]); return; }
        const f = (T - e.tf) / 1.1; if (f >= 1) return off(b);
        const g = Math.min(1, f / 0.55), p = [RX0 + 18 + (RX1 - RX0 - 32) * 0.5 + 10 * g, DY - 44 * g, RZ + 8 * Math.sin(g * Math.PI) - (RZ - 8) * g];
        return place(b, p, 1 - f, f < 0.55 ? 1 : 1 - (f - 0.55) / 0.45);
      }
      if (T < e.ta) { place(b, onPath('>', (T - e.ts) / e.D), e.M.retx ? 1.4 : 1); flying.push([e, b]); return; }
      const sl = [SX[k], SY, TRAY_Z];
      if (T < e.ta + HOP) { const f = sm((T - e.ta) / HOP), a = PATH_D[1], p = a.map((v, i) => v + (sl[i] - v) * f); p[2] += Math.sin(f * Math.PI) * 26; return place(b, p, 1); }
      if (!udp && T >= tl.del) { const f = (T - tl.del) / SINK; if (f >= 1) return off(b);
        const p = [SX[k], SY - 34 * sm(f), TRAY_Z + 30 * Math.sin(Math.min(1, f * 1.4) * Math.PI / 2)]; return place(b, p, 1, f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4); }
      const stt = S.slot[k]; place(b, sl, stt === 'held' ? 0.06 : 0.35);
    });
    // blocos de controle (SYN, ACK, FIN)
    CB.forEach((b, p) => { const evs = tl.ev.filter(e => e.M.k === 'c' && e.pool === p && e.ts <= T), e = evs[evs.length - 1];
      if (!e || T >= e.ta) return off(b);
      drawTop(b, topTxt(e.M)); const f = (T - e.ts) / e.D, pop = Math.min(1, f * 8, (1 - f) * 8);
      place(b, onPath(e.M.dir, f), 1, pop); flying.push([e, b]); });
    // rótulo de cada bloco em viagem
    tMsg.forEach((t, i) => { const fl = flying[i]; if (!fl) return t.hide(); const [e, b] = fl, p = b.g.position;
      t.set(msgTag(e.M), e.M.retx || e.M.dup ? 'acc' : 'hi').at(p.x / TS, p.z / TS, p.y / TS + 40); });
    // trilhos acesos enquanto alguém passa
    const onD = flying.some(([e]) => e.M.dir === '>'), onA = flying.some(([e]) => e.M.dir === '<');
    railMatD.emissiveIntensity = onD ? 0.2 : 0; railMatA.emissiveIntensity = onA ? 0.2 : 0; rimD.visible = onD; rimA.visible = onA;
    // perda
    const lost = tl.ev.find(e => e.M.lost), retx = tl.ev.find(e => e.M.retx);
    if (lost && T >= lost.tf && (!retx || T < retx.ta)) tLost.set(udp ? '✕ #2 caiu e sumiu\nninguém vai saber' : '✕ fatia #2 da foto caiu', 'acc').at(RX0 + (RX1 - RX0) * 0.5 + 10, DY - 50, 26); else tLost.hide();
    // vaga vazada / vazia
    const hole = S.slot[1] === 'hole'; holeG.visible = hole;
    if (hole) tWait.set('esperando\nbytes 201–300', 'acc').at(SX[1] - 6, SY + 62, 22);
    else if (udp && S.present[2] && !S.present[1]) tWait.set('#2 não veio\no servidor não sabe', 'dim').at(SX[1] - 6, SY + 62, 22);
    else tWait.hide();
    // timer do reenvio
    if (retx && step === retx.step && T < retx.ts + 0.3) tTimer.set('timer do #2 venceu\nsem ACK: reenviar a cópia', 'acc').at(RX0 + 30, DY, 105); else tTimer.hide();
    // UDP: nada volta
    if (udp && step >= 1) tNoAck.set(step === N() - 1 ? 'nenhum ACK, nunca' : 'nenhum ACK volta', step === N() - 1 ? 'acc' : 'dim').at(430, AY, 44); else tNoAck.hide();
    // placas de estado
    const changed = t => t >= stepStart && t >= 0;
    const SRV_NAME = NARROW() ? 'SERV. DO APP' : 'SERVIDOR DO APP';
    if (udp) { tCli.set('CELULAR DA LENA\nUDP: sem estado', 'dim'); tSrv.set(`${SRV_NAME}\nUDP: sem estado`, 'dim'); }
    else { tCli.set(`CELULAR DA LENA\n${S.c}`, changed(S.ct) && step ? 'acc' : 'hi'); tSrv.set(`${SRV_NAME}\n${S.s}`, changed(S.st) && step ? 'acc' : 'hi'); }
    tCli.at(93, 170, 196); tSrv.at(NARROW() ? 585 : 630, 70, 168);
    // conexão (handshake e fechamento)
    const hs = TL.tcp.ev.slice(0, 3);
    if (udp) { if (step === 0) tConn.set('UDP: sem conexão\nsem handshake', 'dim').at(350, 180, 70); else tConn.hide(); }
    else if (step === 0) tConn.set('ainda sem conexão', 'dim').at(350, 180, 70);
    else if (step === 1) { const k = hs.filter(e => T >= e.ts).length, done = T >= hs[1].ta;
      tConn.set(done ? '1 RTT: SYN + SYN-ACK\no ACK já pode levar dados' : `handshake ${k}/3`, done ? 'acc' : 'hi').at(350, 180, 70); }
    else if (step >= 9) tConn.set(step === 9 ? 'Lena → servidor: fechado\nservidor → Lena: aberto' : step === 10 ? 'os dois sentidos fechados' : 'conexão encerrada', 'hi').at(350, 180, 70);
    else tConn.hide();
    // telas e luzes
    drawPhone({ udp, buf: S.sendBuf });
    const note = udp ? (S.present[2] && !S.present[1] ? 'chegaram #1 e #3' : S.present[0] ? 'chegou #1' : 'esperando dados') :
      S.appBytes === 300 ? 'bytes 101–400, em ordem ✓' : S.slot[1] === 'hole' ? 'buffer: falta 201–300' : S.present.every(Boolean) ? 'buffer: 101–400 completo' : S.present[0] ? 'buffer: 101–200 em ordem' : S.s === 'LISTEN' ? 'escutando' : 'buffer vazio';
    drawServer({ udp, bytes: S.appBytes, note });
    const arrivedAt = side => tl.ev.some(e => (side === 's' ? e.M.dir === '>' : e.M.dir === '<') && !e.M.lost && T >= e.ta && T < e.ta + 0.5);
    const sOn = arrivedAt('s'), cOn = arrivedAt('c');
    srvLed.material = sOn ? ledOnMat : ledOffMat; srvGlow.material.uniforms.intensity.value = sOn ? 0.8 : 0;
    phLed.material = cOn ? ledOnMat : ledOffMat; phGlow.material.uniforms.intensity.value = cOn ? 0.8 : 0;
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = [380, 140, 40];
  const FOCUS_M = { tcp: [[390, 150, 50], [390, 150, 50], [440, 150, 40], [400, 170, 30], [350, 130, 30], [560, 150, 50], [400, 170, 30], [420, 150, 40], [560, 140, 60], [390, 150, 50], [390, 150, 50], [390, 150, 50]],
    udp: [[390, 150, 50], [440, 150, 40], [350, 130, 30], [560, 150, 50], [420, 150, 50]] };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const S = STEPS[mode][step];
    let u = lt; if (u >= S.dur) { u = S.dur; hold += dt; if (hold > 3.5 && S.dur > 0) { lt = 0; hold = 0; } } else lt += dt;
    scene3(TL[mode].off[step] + u);
    readout();
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = mob ? FOCUS_M[mode][step] : FOCUS;
      const zoff = mob ? -7.7 * camera.position.distanceTo(controls.target) : 0;
      const want = W(f[0] + (mob ? -10 : -240), f[1] + (mob ? 0 : 20), f[2] + zoff), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(6.5, S.dur + 4)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleMode();
    if (e.key === 't' || e.key === 'T') return setMode('tcp');
    if (e.key === 'u' || e.key === 'U') return setMode('udp');
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) go(GO[mode][o.userData.go]); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); blocks.forEach(b => { b.key = ''; if (b.txt) drawTop(b, b.txt); }); phKey = srvKey = ''; });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar TCP/UDP', 'C', cycleMode]],
    view: NARROW() ? { target: W(360, 150, -140), dist: innerWidth < 640 ? 9 : 14 } : { target: W(140, 160, 40), dist: 17 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · TCP/UDP: C · arraste para girar' };
})() });
