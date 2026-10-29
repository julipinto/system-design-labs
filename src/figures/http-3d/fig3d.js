// Figura 3D (iso-glow): HTTP/1.1 x HTTP/2 x HTTP/3.
// Navegador da Lena (notebook, à esquerda) e servidor (à direita). Os 6 arquivos ficam na prateleira do servidor,
// saem em pacotes (pontos de luz), atravessam o tubo da conexão e enchem as 6 vagas na frente do notebook.
// Um pacote do CSS se perde: no HTTP/1.1 a fila inteira espera, no HTTP/2 o TCP segura todos os streams,
// no HTTP/3 só o stream do CSS espera. Tudo vem de uma simulação simples em ms (exemplo, RTT de 80 ms).
FIGS3D.push({ id: 'http', name: 'HTTP 1.1 · 2 · 3', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── simulação (ms de exemplo) ──
  const RTT = 80, OW = RTT / 2, GAP = 5, HOP = 14;
  const RES = [['HTML', 'index.html', 3], ['CSS', 'style.css', 4], ['JS', 'app.js', 3], ['IMG1', 'foto1.jpg', 4], ['IMG2', 'foto2.jpg', 4], ['IMG3', 'foto3.jpg', 4]];
  const LOST = { res: 1, idx: 2 };                       // o 3º pacote do CSS se perde
  const VERS = ['h1', 'h2', 'h3'], VNAME = { h1: 'HTTP/1.1', h2: 'HTTP/2', h3: 'HTTP/3' };
  function simulate(v) {
    const HS = v === 'h3' ? RTT : 2 * RTT, pk = [], req = [];
    const mk = (r, i, send) => { const p = { res: r, idx: i, send, arr: send + OW };
      if (r === LOST.res && i === LOST.idx) { p.lost = true; p.retx = send + RTT; p.arr = p.retx + OW; }
      pk.push(p); return p; };
    if (v === 'h1') {                                    // uma resposta por vez: o próximo pedido só sai quando a anterior termina
      let t = HS;
      RES.forEach(([, , n], r) => {
        req.push({ res: r, send: t, arr: t + OW });
        const mine = []; for (let i = 0; i < n; i++) mine.push(mk(r, i, t + OW + i * GAP));
        let d = 0; mine.forEach(p => { d = Math.max(d, p.arr); p.del = d; }); t = d;
      });
    } else {                                             // os 6 pedidos de uma vez; respostas em quadros intercalados
      RES.forEach((_, r) => req.push({ res: r, send: HS, arr: HS + OW }));
      let k = 0; for (let i = 0; i < 4; i++) RES.forEach(([, , n], r) => { if (i < n) mk(r, i, HS + OW + (k++) * GAP); });
      if (v === 'h2') { let d = 0; pk.forEach(p => { d = Math.max(d, p.arr); p.del = d; }); }       // TCP: uma fila só de bytes
      else RES.forEach((_, r) => { let d = 0; pk.filter(p => p.res === r).forEach(p => { d = Math.max(d, p.arr); p.del = d; }); });   // QUIC: ordem por stream
    }
    const lost = pk.find(p => p.lost), total = Math.max(...pk.map(p => p.del)), e5 = lost.arr + HOP + 10;
    const win = [[0, 0], [0, HS], [HS, HS + OW], [HS + OW, lost.send], [lost.send, lost.retx - 1], [lost.retx, e5], [e5, Math.max(e5, total + HOP + 10)], [0, 0], [total + HOP + 10, total + HOP + 10]];
    return { v, HS, pk, req, lost, total, win };
  }
  const SIM = { h1: simulate('h1'), h2: simulate('h2'), h3: simulate('h3') };
  const TOT = { h1: SIM.h1.total, h2: SIM.h2.total, h3: SIM.h3.total };

  // ── geometria (unidades iso) ──
  const TX0 = 262, TX1 = 490, LANE = 110, LANES3 = RES.map((_, r) => 75 + r * 14);
  const laneY = (v, r) => v === 'h3' ? LANES3[r] : LANE + 7;
  const SLOT = r => ({ x: 92 + (r % 3) * 64, y: 96 + Math.floor(r / 3) * 60 });         // centro da vaga (44 x 44), na bandeja do navegador
  const SHELF = r => ({ x: 523 + (r % 3) * 46, y: 67 + Math.floor(r / 3) * 52 });        // centro do arquivo na prateleira (34 x 34)
  const SRV_TOP = 147, MIDX = (TX0 + TX1) / 2, TRAY_Z = 13, SLOT_H = 44;
  const bufPos = k => [276 + (k % 6) * 16, 176 + Math.floor(k / 6) * 18, 8];

  plateWith(g0, 680, 240, [[18, 18], [662, 18], [18, 222], [662, 222]]);

  // navegador: monitor ao fundo e, na frente, a bandeja com as 6 vagas (o que já chegou)
  const lapG = new THREE.Group(); lapG.userData.go = 6; g0.add(lapG);
  rbox(130, 22, 7, 40, 24, 8, 4, bodyMat, lapG); rbox(144, 26, 15, 12, 8, 18, 2, bodyMat, lapG);
  rbox(40, 24, 33, 220, 10, 140, 5, bodyMat, lapG);
  const scr = faceCanvas('front', 47, 34, 167, 206, 128, 5, lapG);
  rbox(50, 56, 7, 200, 132, 6, 6, bodyMat, lapG);

  // servidor
  const srvG = new THREE.Group(); srvG.userData.go = 2; g0.add(srvG);
  rbox(500, 40, 7, 140, 140, 140, 6, bodyMat, srvG);
  const srvCv = faceCanvas('front', 510, 180, 140, 120, 46, 5, srvG);
  slitsUV(frontUV(500, 180, 147), 14, 126, 4, 62, 128, srvG);
  const srvLed = dotFront(624, 180, 84, 2.6, srvG); const srvGlow = glowPoints([W(624, 181, 84)], 0.22); g0.add(srvGlow);

  // tubo HTTP/1.1 e HTTP/2: uma conexão TCP
  const tubeMat = capMat(); twCaps.push(tubeMat);
  const tube12 = new THREE.Group(); tube12.userData.go = 4; g0.add(tube12);
  rbox(TX0, LANE - 17, 7, TX1 - TX0, 34, 6, 4, tubeMat, tube12);
  const rim12 = polyLine([[TX0, LANE - 17, 13.1], [TX1, LANE - 17, 13.1], [TX1, LANE + 17, 13.1], [TX0, LANE + 17, 13.1], [TX0, LANE - 17, 13.1]], accentLineMat, tube12);
  // tubo HTTP/3: QUIC sobre UDP, 6 pistas (streams)
  const tubeMat3 = capMat(); twCaps.push(tubeMat3);
  const tube3 = new THREE.Group(); tube3.userData.go = 4; g0.add(tube3);
  rbox(TX0, 66, 7, TX1 - TX0, 88, 6, 6, tubeMat3, tube3);
  seg(LANES3.slice(1).map(y => [[TX0 + 6, y - 7, 13.1], [TX1 - 6, y - 7, 13.1]]), tube3, lineMat);
  const rim3 = polyLine([[TX0, 66, 13.1], [TX1, 66, 13.1], [TX1, 154, 13.1], [TX0, 154, 13.1], [TX0, 66, 13.1]], accentLineMat, tube3);
  RES.forEach(([n], r) => label(n, 28, 9, 6.5, onTop(TX1 - 24, LANES3[r], 13), tube3));

  // vagas na frente do notebook (o que já chegou ao navegador) e o buffer
  const slots = RES.map((_, r) => { const s = SLOT(r), g = new THREE.Group(); g.userData.go = 3; g0.add(g);
    inset(s.x - 25, s.y - 25, TRAY_Z, 50, 50, 4, g);
    const fg = new THREE.Group(); g.add(fg); fg.position.copy(W(s.x, s.y, TRAY_Z)); const mat = capMat(); twCaps.push(mat);
    rbox(-22, -22, 0, 44, 44, SLOT_H, 4, mat, fg); return { g, fg, mat }; });
  const trayG = new THREE.Group(); trayG.userData.go = 4; g0.add(trayG);
  inset(266, 166, 7, 104, 46, 4, trayG); label('BUFFER', 44, 9, 7, onTop(318, 219, 7), trayG);
  const gapBox = polyLine([[269, 169, 8.2], [283, 169, 8.2], [283, 183, 8.2], [269, 183, 8.2], [269, 169, 8.2]], accentLineMat, g0);

  // arquivos na prateleira (em cima do servidor)
  const shelf = RES.map(([n], r) => { const s = SHELF(r), fg = new THREE.Group(); fg.userData.go = 2; g0.add(fg); fg.position.copy(W(s.x, s.y, SRV_TOP));
    const mat = capMat(); twCaps.push(mat); rbox(-17, -17, 0, 34, 34, 34, 3, mat, fg);
    const cv = faceCanvas('top', -17, -17, 34, 34, 34, 8, fg, true); return { fg, mat, cv, name: n }; });
  const drawShelf = () => shelf.forEach(({ cv, name }) => { const { x, P } = cv, C = pal3();
    x.clearRect(0, 0, cv.c.width, cv.c.height); x.fillStyle = C.inkHi; x.font = `600 ${(name.length > 3 ? 8.5 : 10) * P}px ${MONO3}`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, 17 * P, 17.5 * P); cv.tex.needsUpdate = true; });

  // pacotes (respostas), pedidos e o ponto do handshake
  const mkDot = (s, h) => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, 0, s, s, h, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.24); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const PK = Array.from({ length: 22 }, () => mkDot(13, 10));
  const RQ = Array.from({ length: 6 }, () => mkDot(9, 7));
  const HSD = mkDot(13, 10), TR = [mkDot(10, 8), mkDot(10, 8)];
  hazeAndShadow(g0, 340, 120, 8.2, 3.2);
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
      tex.needsUpdate = true; sp.scale.set(nw / P * TS, nh / P * TS, 1);
    }
    tags.push(t); return t;
  }
  const tLap = tag(14).set('NAVEGADOR DA LENA').at(150, 28, 206);
  const tSrv = tag(14).set('SERVIDOR').at(570, 110, 250);
  const tConn = tag(13), tReq = tag(12), tLost = tag(13), tRetx = tag(12), tBuf = tag(12), tQueue = tag(12), tNet = tag(13);
  const tSlot = RES.map(() => tag(14));

  // ── tela do notebook e painel do servidor ──
  let scrKey = '';
  function drawScreen(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === scrKey) return; scrKey = key;
    const { x, P } = scr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, scr.c.width, scr.c.height);
    x.textBaseline = 'middle';
    x.fillStyle = C.line; [7, 13, 19].forEach(cx => { x.beginPath(); x.arc(u(cx), u(8), u(2), 0, Math.PI * 2); x.fill(); });
    x.font = `600 ${u(7)}px ${MONO3}`; x.textAlign = 'left'; x.fillStyle = C.inkHi; x.fillText('loja.exemplo', u(26), u(8.5));
    x.textAlign = 'right'; x.fillStyle = A_; x.fillText(`${VNAME[d.v]} · ${d.net}`, u(200), u(8.5));
    x.strokeStyle = C.detail; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(0, u(16)); x.lineTo(scr.c.width, u(16)); x.stroke();
    if (d.cmp) {
      x.textAlign = 'left'; x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('Página pronta (exemplo)', u(7), u(29));
      const mx = Math.max(...VERS.map(v => TOT[v]));
      VERS.forEach((v, i) => { const y = 44 + i * 24, w = 118 * TOT[v] / mx, on = v === d.v;
        x.fillStyle = on ? A_ : C.ink; x.font = `${on ? 600 : 400} ${u(7.5)}px ${MONO3}`; x.textAlign = 'left'; x.fillText(VNAME[v], u(7), u(y));
        x.strokeStyle = on ? A_ : C.line; x.lineWidth = u(0.7); x.beginPath(); x.roundRect(u(7), u(y + 6), u(w), u(8), u(2)); if (on) x.fill(); else x.stroke();
        x.fillStyle = on ? A_ : C.ink; x.fillText(`${TOT[v]} ms`, u(7 + w + 4), u(y + 10)); });
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6)}px ${MONO3}`; x.fillText('mesmos 6 arquivos, mesma perda, RTT 80 ms', u(7), u(120));
    } else {
      RES.forEach(([n], r) => { const bx = 6 + (r % 3) * 66, by = 22 + Math.floor(r / 3) * 44, bw = 62, bh = 40, f = d.fill[r], st = d.st[r], done = f >= 0.999;
        x.strokeStyle = done ? A_ : C.line; x.lineWidth = u(done ? 0.9 : 0.5); x.beginPath(); x.roundRect(u(bx), u(by), u(bw), u(bh), u(2)); x.stroke();
        x.textAlign = 'left'; x.fillStyle = done ? A_ : C.inkHi; x.font = `600 ${u(9)}px ${MONO3}`; x.fillText(n, u(bx + 4), u(by + 9));
        x.fillStyle = done ? A_ : C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(done ? 'pronto ✓' : st || '—', u(bx + 4), u(by + 21));
        x.strokeStyle = C.detail; x.beginPath(); x.roundRect(u(bx + 4), u(by + 29), u(bw - 8), u(5), u(1.5)); x.stroke();
        if (f > 0) { x.fillStyle = A_; x.beginPath(); x.roundRect(u(bx + 4), u(by + 29), u((bw - 8) * f), u(5), u(1.5)); x.fill(); } });
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(6.5)}px ${MONO3}`; x.fillText(`t = ${d.t} ms (exemplo)`, u(7), u(120));
      x.textAlign = 'right'; x.fillStyle = d.ready === 6 ? A_ : C.ink; x.fillText(`prontos: ${d.ready}/6`, u(200), u(120));
    }
    scr.tex.needsUpdate = true;
  }
  let srvKey = '';
  function drawServer(d) {
    const key = JSON.stringify(d) + theme + accent.getHexString(); if (key === srvKey) return; srvKey = key;
    const { x, P } = srvCv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, srvCv.c.width, srvCv.c.height);
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(8.5)}px ${MONO3}`; x.fillText('loja.exemplo', u(6), u(9));
    x.fillStyle = A_; x.font = `600 ${u(7.5)}px ${MONO3}`; x.fillText(`${VNAME[d.v]} · ${d.v === 'h3' ? 'QUIC/UDP' : 'TCP'}`, u(6), u(23));
    x.fillStyle = C.ink; x.font = `${u(7.5)}px ${MONO3}`; x.fillText(d.st, u(6), u(37));
    srvCv.tex.needsUpdate = true;
  }

  // ── roteiro ──
  const N = 9;
  const pick = o => o[ver] ?? (ver !== 'h3' ? o.h12 : undefined) ?? o.all;
  const STEPS = [
    { title: 'A página precisa de 6 arquivos',
      story: { all: 'Lena abre a página de uma loja no notebook. Para desenhar a tela, o navegador precisa de 6 arquivos do servidor: o HTML, o CSS, o JS e 3 imagens. (Na vida real o HTML chega antes e avisa quais são os outros; aqui pulamos essa parte para olhar só o transporte.) Os tempos são exemplos, com RTT de 80 ms.' },
      look: { all: 'À direita, os 6 arquivos esperam em cima do servidor. À esquerda, 6 vagas vazias na frente do notebook.' },
      key: { h1: 'HTTP/1.1: um pedido, uma resposta, depois o próximo.', h2: 'HTTP/2: vários pedidos ao mesmo tempo numa conexão TCP.', h3: 'HTTP/3: vários pedidos ao mesmo tempo, cada um no seu stream, sobre QUIC.' } },
    { title: 'Abrir a conexão',
      story: { h12: 'Antes de qualquer arquivo, o navegador abre a conexão. Primeiro o TCP (SYN e SYN-ACK): 1 ida e volta. Depois o TLS 1.3 combina as chaves: mais 1 ida e volta. São 2 RTTs, 160 ms, sem nenhum byte da página.',
        h3: 'O HTTP/3 usa o QUIC, que já nasce com o TLS 1.3 dentro. A primeira mensagem do QUIC já leva o ClientHello: transporte e criptografia se acertam na mesma ida e volta. 1 RTT, 80 ms.' },
      look: { all: 'Um ponto de luz vai e volta pelo tubo; o rótulo em cima conta os RTTs.' },
      key: { h12: 'TCP + TLS 1.3 = 2 RTTs antes do primeiro pedido.', h3: 'QUIC junta transporte e TLS: 1 RTT.' } },
    { title: 'Os pedidos saem',
      story: { h1: 'Conexão aberta. O navegador manda o primeiro pedido: GET /index.html. Os outros 5 esperam a vez, porque nesta conexão só cabe uma resposta por vez. (Por isso os navegadores abrem até 6 conexões por servidor; aqui mostramos uma para a fila ficar visível.)',
        h2: 'Conexão aberta. O navegador manda os 6 pedidos de uma vez, na mesma conexão. Cada pedido vira um stream com número próprio, e os headers vão comprimidos com HPACK.',
        h3: 'Conexão aberta. Os 6 pedidos saem juntos, cada um no seu stream do QUIC. Os headers vão comprimidos com QPACK, a versão do HPACK feita para streams independentes.' },
      look: { h1: 'Só um pedido atravessa o tubo, do notebook para o servidor.', h2: 'Seis pedidos atravessam o mesmo tubo juntos.', h3: 'Seis pedidos atravessam o tubo juntos, cada um na sua pista.' },
      key: { h1: 'HTTP/1.1: um pedido de cada vez por conexão.', h2: 'Multiplexação: muitos pedidos numa conexão só.', h3: 'Cada pedido tem o seu stream, independente dos outros.' } },
    { title: 'As respostas chegam',
      story: { h1: 'O servidor manda o HTML em 3 pacotes. Cada pacote que chega vai para a sua vaga. Só quando o HTML termina o navegador pede o CSS.',
        h2: 'O servidor responde tudo junto, em quadros misturados: um pedaço do HTML, um do CSS, um do JS, um de cada imagem, e de novo. Tudo pelo mesmo tubo TCP, e as vagas enchem juntas.',
        h3: 'O servidor responde tudo junto, cada arquivo na sua pista. As vagas enchem juntas, como no HTTP/2.' },
      look: { h1: 'O HTML enche a primeira vaga; o CSS é pedido; o resto continua no servidor.', h2: 'Pontos de luz misturados no mesmo tubo; todas as vagas começam a encher.', h3: 'Cada pista leva um arquivo; todas as vagas começam a encher.' },
      key: { all: 'O arquivo viaja em pacotes; a vaga enche conforme eles chegam.' } },
    { title: 'Um pacote se perde',
      story: { h1: 'No meio do CSS, um pacote se perde no caminho (Wi-Fi ruim, fila cheia num roteador). O pacote seguinte do CSS chega, mas o TCP entrega tudo em ordem: ele fica no buffer, esperando o que falta. E o JS e as 3 imagens nem foram pedidos: estão na fila atrás do CSS.',
        h2: 'Um pacote do CSS se perde. Os quadros dos outros arquivos continuam chegando, mas o TCP não sabe o que é stream: para ele é tudo uma fila só de bytes. Ele segura no buffer tudo o que chegou depois do buraco. HTML, JS e imagens esperam por causa de um pedaço do CSS.',
        h3: 'Um pacote do CSS se perde. Cada stream do QUIC tem a sua própria ordem, então só o CSS espera. HTML, JS e imagens continuam chegando e enchendo as vagas.' },
      look: { h1: 'O pacote cai do tubo. O seguinte fica parado no buffer, e a fila em cima do servidor não anda.', h2: 'O pacote cai do tubo. Tudo o que chega depois para no buffer, apagado: nenhuma vaga enche.', h3: 'O pacote cai da pista do CSS. Só o CSS para no buffer; as outras vagas continuam enchendo.' },
      key: { h1: 'Head-of-line blocking: o primeiro da fila trava todos atrás dele.', h2: 'O HTTP/2 tirou a fila da aplicação, mas o TCP ainda trava todos os streams juntos.', h3: 'No QUIC, perder um pacote num stream não trava os outros.' } },
    { title: 'O reenvio',
      story: { h1: 'O TCP percebe a falta e o servidor reenvia o pacote. Neste exemplo isso custa cerca de 1 RTT a mais (80 ms). Quando ele chega, o buraco fecha e o buffer libera o resto do CSS. Só agora o navegador pode pedir o JS.',
        h2: 'O TCP percebe a falta e o servidor reenvia o pacote. Neste exemplo isso custa cerca de 1 RTT a mais (80 ms). Quando ele chega, o buraco fecha e o buffer libera tudo de uma vez: todas as vagas enchem juntas.',
        h3: 'O QUIC também reenvia o pacote, no mesmo tempo. A diferença: só o CSS estava esperando. Os outros arquivos já tinham chegado.' },
      look: { all: 'Um ponto com o rótulo "reenvio" atravessa o tubo, e o buffer se esvazia nas vagas.' },
      key: { h12: 'Reenviar custa RTT; no TCP, todo mundo atrás do buraco paga essa espera.', h3: 'O reenvio atrasa só o stream que perdeu o pacote.' } },
    { title: 'Página pronta',
      story: { h1: `Depois do CSS, o resto segue um de cada vez: pedido, resposta, próximo. A página fica pronta em ${TOT.h1} ms (exemplo). Com 6 conexões em paralelo seria mais rápido, mas cada uma paga o seu próprio handshake.`,
        h2: `A página fica pronta em ${TOT.h2} ms (exemplo): uma conexão, tudo junto, mas todos os arquivos esperaram o reenvio de um pacote do CSS.`,
        h3: `A página fica pronta em ${TOT.h3} ms (exemplo): 80 ms a menos no handshake, e a perda só atrasou o CSS.` },
      look: { all: 'A tela do notebook compara os três tempos; a barra acesa é a versão escolhida.' },
      key: { all: 'Mesmos 6 arquivos, mesma perda: o que muda é quantas idas e voltas existem e quem espera.' } },
    { title: 'Lena troca de rede',
      story: { h12: 'Lena sai de casa e o notebook passa do Wi-Fi para o 4G do celular. O IP muda. Uma conexão TCP é identificada pelo IP e pela porta dos dois lados: com IP novo, ela morre. O navegador abre outra e paga de novo 2 RTTs (160 ms) de TCP + TLS.',
        h3: 'Lena sai de casa e o notebook passa do Wi-Fi para o 4G do celular. O IP muda, mas a conexão QUIC é identificada por um connection ID, não por IP e porta. O servidor reconhece o ID e a conversa continua, sem novo handshake.' },
      look: { h12: 'O tubo apaga ("conexão caiu") e um handshake novo começa do zero.', h3: 'O tubo continua aceso e os pontos seguem passando; o rótulo mostra o connection ID.' },
      key: { h12: 'TCP: trocou de IP, trocou de conexão.', h3: 'QUIC: o connection ID sobrevive à troca de rede.' } },
    { title: 'Resumo das três versões',
      story: { h1: 'HTTP/1.1 (1997): conexões persistentes, mas uma resposta por vez em cada uma. A fila trava na aplicação.', h2: 'HTTP/2 (2015): multiplexação e headers comprimidos (HPACK) numa conexão TCP. O server push existiu, mas caiu em desuso. A perda ainda trava tudo no TCP.', h3: 'HTTP/3 (2022): QUIC sobre UDP, TLS 1.3 embutido, streams independentes, QPACK e connection ID.' },
      look: { all: 'A cena mostra a página completa; troque a versão no painel para comparar.' },
      key: { all: 'Cada versão ataca o mesmo problema: uma espera segurando as outras.' } },
  ];
  const SUM = `<table class="h3-sum"><tr><th></th><th>1.1</th><th>2</th><th>3</th></tr>
    <tr><td>Transporte</td><td>TCP</td><td>TCP</td><td>QUIC (UDP)</td></tr>
    <tr><td>Handshake</td><td>2 RTT</td><td>2 RTT</td><td>1 RTT</td></tr>
    <tr><td>Pedidos</td><td>1 por vez</td><td>juntos</td><td>juntos</td></tr>
    <tr><td>Perda trava</td><td>a fila</td><td>todos</td><td>só 1 stream</td></tr>
    <tr><td>Headers</td><td>texto</td><td>HPACK</td><td>QPACK</td></tr>
    <tr><td>Exemplo</td><td>${TOT.h1} ms</td><td>${TOT.h2} ms</td><td>${TOT.h3} ms</td></tr></table>`;

  let step = 0, ver = 'h1', lt = 0, hold = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', simNow = 0, nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-http3d-ver'); if (VERS.includes(v)) ver = v; } catch (e) {}
  const HS_LEGS = { h12: [[1, 'RTT 1 · TCP\nSYN →'], [-1, 'RTT 1 · TCP\n← SYN-ACK'], [1, 'RTT 2 · TLS 1.3\nClientHello →'], [-1, 'RTT 2 · TLS 1.3\n← ServerHello + certificado']],
    h3: [[1, 'RTT 1 · QUIC + TLS 1.3\nInitial (ClientHello) →'], [-1, 'RTT 1 · QUIC + TLS 1.3\n← resposta + chaves']] };
  const legs = () => ver === 'h3' ? HS_LEGS.h3 : HS_LEGS.h12;
  const connText = () => ({ h1: '1 conexão TCP + TLS\numa resposta por vez', h2: '1 conexão TCP + TLS\n6 streams misturados', h3: '1 conexão QUIC (UDP)\n6 streams independentes' })[ver];
  const speed = () => step === 6 && ver === 'h1' ? 70 : 25;      // ms de exemplo por segundo de tela
  const segEnd = () => step === 7 ? (ver === 'h3' ? 160 : 300) : SIM[ver].win[step][1];
  const segStart = () => step === 7 ? 0 : SIM[ver].win[step][0];

  function nowHtml() {
    const S = SIM[ver], t = simNow;
    if (step === 7) {
      const u = t, moved = u >= 30;
      return `<li>Rede: <b>${moved ? '4G' : 'Wi-Fi'}</b> · IP ${moved ? '100.64.7.21' : '192.168.0.12'}</li>
        <li>Conexão: ${ver === 'h3' ? `<b>a mesma</b> (connection ID 7f3a…)` : moved ? (u >= 220 ? '<b>nova</b> conexão TCP + TLS' : '<b>caiu</b> (IP e porta mudaram)') : 'aberta'}</li>
        <li>Custo da troca: ${ver === 'h3' ? '0 RTT' : '2 RTTs (160 ms) de handshake de novo'}</li>`;
    }
    const sent = S.req.filter(q => q.send <= t).length, arrived = S.pk.filter(p => p.arr <= t && (!p.lost || t >= p.arr)).length;
    const held = S.pk.filter(p => p.arr <= t && t < p.del).length, ready = RES.filter((_, r) => S.pk.filter(p => p.res === r).every(p => t >= p.del + HOP)).length;
    const lostNow = t >= S.lost.send + OW / 2 && t < S.lost.arr;
    return `<li>Relógio: <b>${Math.round(t)} ms</b> <span class="h3-dim">(exemplo, RTT 80 ms)</span></li>
      <li>Conexão: ${ver === 'h3' ? '1 QUIC sobre UDP, TLS 1.3 embutido' : '1 TCP + TLS 1.3'} · handshake ${ver === 'h3' ? '1 RTT' : '2 RTTs'}${t < S.HS ? ' <b>(abrindo)</b>' : ''}</li>
      <li>Pedidos enviados: <b>${sent}/6</b>${ver === 'h1' ? ' (um por vez)' : ''}</li>
      <li>Pacotes: <b>${arrived}/22</b> chegaram${lostNow ? ' · <b>1 perdido</b>' : ''}${held ? ` · <b>${held} no buffer</b>` : ''}</li>
      <li>Arquivos prontos: <b>${ready}/6</b></li>`;
  }
  function panelHtml() {
    const st = STEPS[step];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N}</span><span>${VNAME[ver]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Versão do HTTP">${VERS.map(v => `<button data-ver="${v}" aria-pressed="${v === ver}">${VNAME[v]}</button>`).join('')}</div>
      <h2>${st.title}</h2>
      <p class="o3-story">${pick(st.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${pick(st.look)}</p>
      <p class="o3-key"><b>Em uma frase</b>${pick(st.key)}</p>
      ${step === 8 ? SUM : ''}
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>O que está acontecendo</summary><ul class="h3-now" id="h3now">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'http') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N} · ${VNAME[ver].toLowerCase()} · ${step === 7 ? 'troca de rede' : Math.round(simNow) + ' ms'}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'http' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    tube12.visible = ver !== 'h3'; tube3.visible = ver === 'h3';
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N - 1, i)); lt = 0; hold = 0; dwell = 0; followT = 1.8; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setVer = v => { ver = v; lt = 0; hold = 0; scrKey = srvKey = ''; try { localStorage.setItem('sdlabs-http3d-ver', v); } catch (e) {} render(); return true; };
  const cycleVer = () => setVer(VERS[(VERS.indexOf(ver) + 1) % 3]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-ver]'); if (b && active === 'http') { setVer(b.dataset.ver); } });

  // ── um quadro da cena no instante t ──
  const place = (o, p, k) => { o.g.visible = true; o.g.position.copy(W(...p)); o.mat.emissiveIntensity = k; moveGlow(o.glow, [p[0], p[1], p[2] + 5], k > 0.5 ? 0.85 : 0); };
  const off = o => { o.g.visible = false; o.glow.material.uniforms.intensity.value = 0; };
  const along = (y, f, dir = -1) => [dir < 0 ? TX1 - (TX1 - TX0) * f : TX0 + (TX1 - TX0) * f, y, 13];
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  function scene3(t, u) {
    const S = SIM[ver], v = ver, net = step === 7;
    // pacotes de resposta
    const heldList = S.pk.filter(p => p.arr <= t && t < p.del).sort((a, b) => a.arr - b.arr);
    S.pk.forEach((p, j) => { const o = PK[j], y = laneY(v, p.res), s = SLOT(p.res);
      if (net || t < p.send) return off(o);
      if (p.lost && t < p.retx) {
        const tm = p.send + OW * 0.5;
        if (t < tm) return place(o, along(y, (t - p.send) / OW), 1);
        if (t < tm + 30) { const f = (t - tm) / 30; o.g.visible = true; o.g.position.copy(W(MIDX - 4, y + 22 * f, 13 - 70 * f * f)); o.mat.emissiveIntensity = 1 - f; o.glow.material.uniforms.intensity.value = 0; return; }
        return off(o);
      }
      const s0 = p.lost ? p.retx : p.send;
      if (t < p.arr) return place(o, along(y, (t - s0) / OW), p.lost ? 1.4 : 1);
      if (t < p.del) return place(o, bufPos(heldList.indexOf(p) + 1), 0.08);
      if (t < p.del + HOP) { const f = (t - p.del) / HOP, a = p.del > p.arr ? bufPos(0) : [TX0, y, 13], b = [s.x, s.y, TRAY_Z + SLOT_H + 4];
        const q = lerp3(a, b, f); q[2] += Math.sin(f * Math.PI) * 30; return place(o, q, 1); }
      off(o);
    });
    // pedidos (do notebook para o servidor)
    S.req.forEach((q, r) => { const o = RQ[r];
      if (!net && t >= q.send && t < q.arr) place(o, along(v === 'h3' ? LANES3[r] : LANE - 8, (t - q.send) / OW, 1), 0.55); else off(o); });
    const inFlight = S.req.filter(q => t >= q.send && t < q.arr);
    if (!net && inFlight.length) { const q = inFlight[Math.min(2, inFlight.length - 1)], p = along(v === 'h3' ? LANES3[q.res] : LANE - 8, (t - q.send) / OW, 1);
      tReq.set(inFlight.length > 1 ? `${inFlight.length} × GET →` : `GET /${RES[q.res][1]} →`, 'hi').at(p[0], p[1] - 10, 48); } else tReq.hide();
    // handshake (passo 2) ou reconexão (passo 8)
    const L = legs(); let hsT = -1;
    if (!net && t < S.HS && step >= 1) hsT = t;
    if (net && v !== 'h3' && u >= 60 && u < 220) hsT = u - 60;
    if (hsT >= 0) { const i = Math.min(L.length - 1, Math.floor(hsT / OW)), f = (hsT - i * OW) / OW, dir = L[i][0];
      place(HSD, along(v === 'h3' ? LANES3[2] : LANE, f, dir), 1.2); tConn.set(L[i][1], 'acc').at(MIDX, LANE, 92); }
    else { off(HSD);
      if (net && v !== 'h3' && u >= 30) tConn.set(u < 60 ? 'conexão TCP caiu\no IP mudou' : 'nova conexão TCP + TLS\n+2 RTTs', u < 60 ? 'dim' : 'hi').at(MIDX, LANE, 92);
      else if (net && v === 'h3' && u >= 30) tConn.set('mesma conexão QUIC\nconnection ID 7f3a…', 'acc').at(MIDX, LANE, 92);
      else if (step === 0) tConn.set('ainda sem conexão', 'dim').at(MIDX, LANE, 92);
      else tConn.set(connText(), 'hi').at(MIDX, LANE, 92); }
    // tubo aceso quando a conexão está aberta
    const open = net ? (v === 'h3' || u < 30 || u >= 220) : step >= 1 && t >= S.HS;
    const tm = v === 'h3' ? tubeMat3 : tubeMat; tm.emissiveIntensity = open ? 0.22 : (hsT >= 0 ? 0.08 : 0);
    rim12.visible = rim3.visible = open;
    // conversa contínua no passo da troca de rede
    TR.forEach((o, n) => { if (!net || !open) return off(o); const ph = ((u + n * 40) % 80) / 80;
      place(o, along(v === 'h3' ? LANES3[1 + n * 3] : LANE + (n ? 6 : -8), ph, n ? -1 : 1), 0.9); });
    // perda e reenvio
    const L0 = S.lost, ly = laneY(v, L0.res);
    if (!net && t >= L0.send + OW / 2 && t < L0.arr + HOP) tLost.set('✕ pacote do CSS perdido', 'acc').at(MIDX + 20, ly + 70, 4); else tLost.hide();
    if (!net && t >= L0.retx && t < L0.arr) { const p = along(ly, (t - L0.retx) / OW); tRetx.set('↻ reenvio', 'acc').at(p[0], p[1], 40); } else tRetx.hide();
    const gapOpen = !net && t >= L0.send + OW / 2 && t < L0.arr; gapBox.visible = gapOpen;
    if (!net && (heldList.length || gapOpen) && t >= L0.send + OW / 2) tBuf.set(v === 'h3' ? `buffer do stream CSS\n${heldList.length} esperando · os outros seguem` : `buffer do TCP: falta 1 pacote\n${heldList.length} esperando atrás dele`, 'acc').at(318, 190, 50);
    else tBuf.hide();
    // prateleira do servidor
    shelf.forEach((sh, r) => { const ps = S.pk.filter(p => p.res === r), sent = net ? ps.length : ps.filter(p => t >= p.send).length, f = 1 - sent / ps.length;
      sh.fg.visible = f > 0.01; sh.fg.scale.set(1, Math.max(0.001, f), 1); sh.mat.emissiveIntensity = sent > 0 && f > 0 ? 0.9 : 0; });
    if (v === 'h1' && !net && step >= 2) { const q = S.req.filter(q => q.send > t).map(q => RES[q.res][0]);
      if (q.length) tQueue.set(`na fila: ${q.join(', ')}`, step === 4 ? 'acc' : 'dim').at(570, 110, 214); else tQueue.hide(); } else tQueue.hide();
    // vagas no navegador
    const fills = [], sts = []; let ready = 0;
    slots.forEach((sl, r) => { const ps = S.pk.filter(p => p.res === r), f = net ? 1 : ps.reduce((a, p) => a + Math.max(0, Math.min(1, (t - p.del) / HOP)), 0) / ps.length;
      const waiting = !net && f < 1 && (ps.some(p => p.arr <= t && t < p.del) || (L0.res === r && t >= L0.send + OW / 2 && t < L0.arr));
      const queued = v === 'h1' && !net && S.req[r].send > t;
      const moving = !net && ps.some(p => t >= p.send && t < p.del + HOP);
      sl.fg.visible = f > 0.01; sl.fg.scale.set(1, Math.max(0.001, f), 1); sl.mat.emissiveIntensity = f >= 1 ? 0.3 : waiting ? 0.06 : 0.9;
      const st = f >= 0.999 ? 'pronto ✓' : waiting ? 'esperando' : queued && step >= 2 ? 'na fila' : moving ? 'chegando' : '';
      if (f >= 0.999) ready++; fills.push(+f.toFixed(2)); sts.push(st);
      const s = SLOT(r); tSlot[r].set(f >= 0.999 ? `✓ ${RES[r][0]}` : RES[r][0], f >= 0.999 ? 'acc' : waiting || queued ? 'dim' : 'hi').at(s.x, s.y, TRAY_Z + SLOT_H + 20); });
    // notebook, servidor e rede
    drawScreen({ v, t: Math.round(t), fill: fills, st: sts, ready, net: net && u >= 30 ? '4G' : 'Wi-Fi', cmp: step === 6 && t >= SIM[v].win[6][1] - 1 || step === 8 });
    const srvSt = net ? (v === 'h3' || u < 30 || u >= 220 ? 'conectado' : 'conexão perdida') : t < S.HS ? (step ? 'handshake…' : 'aguardando') :
      t >= L0.retx && t < L0.arr ? 'reenviando 1 pacote' : S.pk.some(p => t >= p.send && t < p.arr) ? 'enviando' : ready === 6 ? 'tudo enviado' : 'aguardando pedido';
    drawServer({ v, st: srvSt });
    const ledOn = srvSt === 'enviando' || srvSt === 'reenviando 1 pacote' || srvSt === 'handshake…';
    srvLed.material = ledOn ? ledOnMat : ledOffMat; srvGlow.material.uniforms.intensity.value = ledOn ? 0.8 : 0;
    if (net && u >= 30) tNet.set('Wi-Fi → 4G\nIP 192.168.0.12 → 100.64.7.21', 'acc').at(150, 28, 258); else tNet.hide();
  }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = [[340, 120, 50], [340, 120, 50], [340, 120, 50], [330, 120, 40], [320, 130, 30], [310, 130, 30], [300, 110, 60], [300, 110, 60], [340, 120, 50]];
  const FOCUS_M = [[340, 120, 60], [380, 110, 40], [380, 110, 40], [260, 120, 40], [330, 130, 20], [260, 140, 20], [300, 110, 60], [320, 110, 60], [320, 120, 60]];

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const a = segStart(), b = segEnd();
    let t = a + lt * speed();
    if (t >= b) { t = b; hold += dt; if (hold > 3 && b > a) { lt = 0; hold = 0; } } else lt += dt;
    if (step === 7) { simNow = t; scene3(SIM[ver].total + HOP + 10, t); }
    else { simNow = t; scene3(t, 0); }
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('h3now'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[step];
      const want = W(f[0] + (mob ? -10 : -190), f[1], f[2] + (mob ? -230 : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; const segLen = (b - a) / speed(); if (dwell >= Math.max(6.5, segLen + 4)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'v' || e.key === 'V') return cycleVer();
    if (e.key === '1' || e.key === '2' || e.key === '3') return setVer(VERS[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) go(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); drawShelf(); scrKey = srvKey = ''; });
  drawShelf(); render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar versão', 'V', cycleVer]],
    view: NARROW() ? { target: W(330, 120, -190), dist: innerWidth < 640 ? 9.2 : 13 } : { target: W(150, 120, 50), dist: 16 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · versão: V ou 1 2 3 · arraste para girar' };
})() });
