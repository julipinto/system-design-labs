// Figura 3D (iso-glow): DHCP. O celular da Lena acaba de entrar no Wi-Fi de um café, sem IP, sem gateway e sem DNS.
// A rede do café vista de cima como uma praça: o celular da Lena (à esquerda), mais três aparelhos (notebook do Caio,
// celular da Bia, notebook do Davi), o roteador com o servidor DHCP ao fundo e, ao lado dele, o pool de endereços
// como uma prateleira de crachás (192.168.0.100 a .120, alguns já emprestados).
// Broadcast = um anel de luz que corre pela praça e chega a todos; o crachá .105 sai da prateleira e vai até o celular.
// Cenários: primeira vez (DORA), renovação (T1 e saída) e sem servidor DHCP (APIPA 169.254.x.x).
// Números (MAC, xid, horários, pool, lease de 2 h) são exemplos coerentes com a aula 7.
FIGS3D.push({ id: 'dhcp', name: 'DHCP', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;

  // ── dados de exemplo ──
  const MAC = '3c:22:fb:7a:10:5e', XID = '0x3903f326', XID2 = '0x7c1a92e4';
  const SRV = '192.168.0.1', IP = '192.168.0.105', MASK = '255.255.255.0', LL = '169.254.37.112';
  const OWN = { 100: 'impressora', 101: 'Caio', 102: 'Bia', 103: 'caixa', 104: 'Davi', 108: 'TV', 113: 'Ana' };
  const SC = ['first', 'renew', 'none'], SCNAME = { first: 'Primeira vez', renew: 'Renovação', none: 'Sem servidor DHCP' };
  const ORDER = ['noip', 'disc', 'offer', 'req', 'ack', 'conf', 't1', 'rreq', 'rack', 'leave', 'retry', 'apipa', 'stuck'];
  const LIST = { first: ['noip', 'disc', 'offer', 'req', 'ack', 'conf'], renew: ['t1', 'rreq', 'rack', 'leave'], none: ['noip', 'disc', 'retry', 'apipa', 'stuck'] };

  // ── geometria (unidades iso) ──
  plateWith(g0, 640, 250, [[18, 18], [622, 18], [18, 232], [622, 232]]);
  const mkGroup = id => { const g = new THREE.Group(); g.userData.go = id; g0.add(g); return g; };
  const glowCap = (x, y, z, w, d, h, r, parent) => { const m = capMat(); twCaps.push(m); rbox(x, y, z, w, d, h, r, m, parent); return m; };

  // celular da Lena (em pé, tela para a frente)
  const phG = mkGroup('ph');
  rbox(30, 150, 7, 100, 50, 8, 6, bodyMat, phG);
  rbox(40, 168, 15, 80, 14, 166, 11, bodyMat, phG);
  const phCap = glowCap(46, 166, 181, 68, 10, 3, 3, phG);
  const phScr = faceCanvas('front', 45, 182, 176, 70, 152, 5, phG);
  // notebooks e celular dos outros
  const notebook = (x, y, id) => { const g = mkGroup(id);
    rbox(x, y, 7, 84, 54, 6, 4, bodyMat, g);
    inset(x + 8, y + 18, 13, 68, 26, 3, g);
    rbox(x + 2, y, 13, 80, 5, 54, 4, bodyMat, g);
    const cap = glowCap(x + 6, y + 0.5, 67, 72, 4, 2, 1, g);
    const scr = faceCanvas('front', x + 6, y + 5, 63, 72, 44, 5, g);
    return { g, cap, scr, top: [x + 42, y + 3, 70] }; };
  const DEV = [
    { id: 'caio', name: 'NOTEBOOK · CAIO', ip: '192.168.0.101', ...notebook(170, 146, 'caio') },
  ];
  { const g = mkGroup('bia'); rbox(320, 178, 7, 44, 30, 6, 4, bodyMat, g); rbox(324, 190, 13, 36, 9, 76, 6, bodyMat, g);
    const cap = glowCap(328, 190.5, 89, 28, 8, 2, 2, g); const scr = faceCanvas('front', 327, 199, 86, 30, 66, 5, g);
    DEV.push({ id: 'bia', name: 'CELULAR · BIA', ip: '192.168.0.102', g, cap, scr, top: [342, 194, 92] }); }
  { const g = mkGroup('davi'); rbox(466, 162, 7, 92, 58, 6, 7, bodyMat, g);       // tablet deitado na mesa
    const cap = glowCap(470, 163, 13, 84, 3, 1.5, 1, g); const scr = faceCanvas('top', 472, 168, 13, 80, 46, 5, g);
    DEV.push({ id: 'davi', name: 'TABLET · DAVI', ip: '192.168.0.104', g, cap, scr, top: [512, 190, 16] }); }
  // roteador (servidor DHCP)
  const rtG = mkGroup('rt');
  rbox(250, 34, 7, 116, 64, 44, 8, bodyMat, rtG);
  rbox(264, 42, 51, 6, 6, 56, 3, bodyMat, rtG); rbox(346, 42, 51, 6, 6, 56, 3, bodyMat, rtG);
  const rtCap = glowCap(278, 44, 51, 60, 44, 3, 4, rtG);
  const rtScr = faceCanvas('front', 258, 98, 45, 100, 30, 5, rtG);
  const rtLed = dotFront(354, 98, 12, 2.4, rtG); const rtGlow = glowPoints([W(354, 99, 12)], 0.22); g0.add(rtGlow);
  // pool de endereços: prateleira de crachás (21 vagas, .100 a .120)
  const plG = mkGroup('pool');
  rbox(396, 22, 7, 230, 60, 70, 6, bodyMat, plG);
  const plScr = faceCanvas('front', 401, 82, 73, 220, 60, 5, plG);
  const CW = 220 / 7, CH = 60 / 3;
  const slotTop = n => { const i = n - 100, c = i % 7; return [401 + (c + 0.5) * CW, 52, 77]; };
  hazeAndShadow(g0, 320, 125, 7.8, 3.4);
  creases(first);

  // crachá .105 (um cartão em pé, que acende)
  const bdG = new THREE.Group(); g0.add(bdG); const bdMat = capMat(); twCaps.push(bdMat);
  rbox(-16, -2, -11, 32, 4, 22, 3, bdMat, bdG); bdG.visible = false;
  const bdGlow = glowPoints([W(0, 0, 0)], 0.3); g0.add(bdGlow);
  const BPOS = { slot: slotTop(105), hold: [308, 70, 172], phone: [148, 192, 150] };

  // caminhos (curvas de luz)
  const PORT = { ph: [80, 175, 190], rt: [308, 66, 56], net: [308, -60, 210] };
  DEV.forEach(d => PORT[d.id] = d.top);
  const arc = (a, b, lift) => bezier(a, [a[0], a[1], a[2] + lift], [b[0], b[1], b[2] + lift], b, 48);
  const PATHS = {};
  [['pr', 'ph', 'rt', 50], ['caio', 'ph', 'caio', 40], ['bia', 'ph', 'bia', 50], ['davi', 'ph', 'davi', 60], ['net', 'rt', 'net', 120]].forEach(([k, a, b, l]) => {
    const pts = arc(PORT[a], PORT[b], l); PATHS[k] = { pts, cum: cumLen(pts), dim: polyLine(pts, lineMat, g0), lit: polyLine(pts, accentLineMat, g0) }; });
  PATHS.net.dim.visible = false;
  const BC = ['pr', 'caio', 'bia', 'davi'];          // um broadcast vai para todos ao mesmo tempo
  const mkDot = s => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(-s / 2, -s / 2, -s / 2, s, s, s, 2, mat, g); const glow = glowPoints([W(0, 0, 0)], 0.28); g0.add(glow); g.visible = false; return { g, mat, glow }; };
  const DOTS = [0, 1, 2, 3].map(() => mkDot(12));
  // anel do broadcast: um círculo no chão da praça, recortado nas bordas da placa
  const ringMat = new LineMaterial({ color: accent.clone(), linewidth: 2.4, resolution: accentLineMat.resolution.clone(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
  const ring = fat([0, 0, 0, 0, 0, 0], ringMat); g0.add(ring); ring.visible = false;
  function setRing(r0) {
    if (r0 <= 0) { ring.visible = false; return; }
    ringMat.resolution.copy(accentLineMat.resolution); ringMat.color.copy(accent);
    const c = PORT.ph, arr = [], n = 120, z = 8.5, inside = (x, y) => x > 6 && x < 634 && y > 6 && y < 244;
    for (const r of [r0, r0 - 70, r0 - 140]) if (r > 8) for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2;
      const p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0) * 0.98], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1) * 0.98];
      if (inside(...p0) && inside(...p1)) arr.push(...W(p0[0], p0[1], z).toArray(), ...W(p1[0], p1[1], z).toArray()); }
    if (!arr.length) { ring.visible = false; return; }
    ring.geometry.dispose(); ring.geometry = new LineSegmentsGeometry().setPositions(arr); ring.visible = true; }

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
      const accT = theme === 'light' ? C.hi : A_, col = t.tone === 'acc' ? accT : t.tone === 'dim' ? C.ink : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.92)' : 'rgba(18,19,20,.86)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      x.strokeStyle = t.tone === 'acc' ? A_ : C.line; x.lineWidth = Math.max(1, P * 0.35); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' ? col : C.ink; lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.35 : NARROW() ? 1.15 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const tPh = tag(14), tRt = tag(14), tPl = tag(13), tNet = tag(12), tBd = tag(12);
  const tDev = DEV.map(() => tag(12));
  const tQ = tag(12), tA = tag(12);

  // ── roteiro ──
  let sc = 'first', step = 0, lt = 0, playing = false, dwell = 0, followT = 1.6, last = 0, nowKey = '', nowAt = 0;
  try { const v = localStorage.getItem('sdlabs-dhcp3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {}
  const ids = () => LIST[sc], N = () => ids().length, cur = () => ids()[step];
  const ord = id => ORDER.indexOf(id);
  const pick = o => o[sc] ?? o.all;

  // balões: onde ficam (desktop / celular)
  const AT = { mid: [260, 120, 200], rtq: [220, 100, 215], rta: [308, 66, 180], ph: [250, 140, 250], net: [440, -60, 250] };
  const AT_M = { mid: [300, 120, 230], rtq: [300, 120, 230], rta: [308, 66, 205], ph: [300, 120, 230], net: [430, -60, 280] };
  const at = k => (innerWidth < 640 ? AT_M : AT)[k];
  const LEGS = {
    noip: () => [{ pulse: 'ph', card: ['IP: 0.0.0.0 · gateway: ? · DNS: ?', 'hi', 'ainda não sei nada desta rede'], at: 'ph' }],
    disc: () => [{ bc: true, card: ['D · DHCPDISCOVER (broadcast)', 'acc', `0.0.0.0:68 → 255.255.255.255:67\nMAC ${MAC} · xid ${XID}`], at: 'mid' },
      sc === 'none' ? { react: true, card: ['ninguém responde', 'hi', 'não há servidor DHCP nesta rede'], at: 'rta' }
        : { react: true, card: ['roteador: sou o servidor DHCP!', 'acc', 'os outros aparelhos ignoram'], at: 'rta' }],
    offer: () => [{ pulse: 'rt', badge: ['slot', 'hold'], card: ['servidor: separo o .105 do pool', 'acc', 'primeiro crachá livre'], at: 'rta' },
      { path: 'pr', dir: -1, card: ['O · DHCPOFFER', 'acc', `${SRV}:67 → ${IP}:68\nIP ${IP} · /24 · gw e DNS ${SRV} · 2 h`], at: 'rtq' }],
    req: () => [{ bc: true, card: ['R · DHCPREQUEST (broadcast)', 'acc', `0.0.0.0:68 → 255.255.255.255:67\nquero o ${IP} do servidor ${SRV}`], at: 'mid' },
      { react: true, card: ['todos ficam sabendo da escolha', 'hi', 'outro servidor DHCP liberaria a oferta dele'], at: 'rta' }],
    ack: () => [{ pulse: 'rt', card: ['servidor: anoto o empréstimo', 'acc', `${IP} → ${MAC}\naté 16:00`], at: 'rta' },
      { path: 'pr', dir: -1, badge: ['hold', 'phone'], card: ['A · DHCPACK', 'acc', `${SRV}:67 → ${IP}:68 · xid ${XID}\nlease 7200 s · renovar em 1 h (T1)`], at: 'rtq' }],
    conf: () => [{ pulse: 'ph', card: ['✓ configurado', 'acc', `IP ${IP} · gw ${SRV} · DNS ${SRV}`], at: 'ph' },
      { path: 'pr', dir: 1, card: [`${IP} → gateway ${SRV}`, 'acc', 'o 1º pacote para fora vai ao roteador'], at: 'rtq' },
      { path: 'net', dir: 1, card: ['roteador → internet', 'acc', 'agora o DNS (aula 6) e o resto funcionam'], at: 'net' }],
    t1: () => [{ pulse: 'ph', card: ['15:00 · metade do lease (T1)', 'acc', 'hora de pedir mais tempo'], at: 'ph' }],
    rreq: () => [{ path: 'pr', dir: 1, card: ['R · DHCPREQUEST (unicast)', 'acc', `${IP}:68 → ${SRV}:67\nxid ${XID2} · sem broadcast`], at: 'rtq' }],
    rack: () => [{ pulse: 'rt', card: ['servidor: renovado', 'acc', `${IP} → ${MAC}\naté 17:00`], at: 'rta' },
      { path: 'pr', dir: -1, card: ['A · DHCPACK', 'acc', `${SRV}:67 → ${IP}:68\nlease 7200 s de novo · até 17:00`], at: 'rtq' }],
    leave: () => [{ path: 'pr', dir: 1, card: ['DHCPRELEASE (opcional)', 'hi', `${IP}:68 → ${SRV}:67\n"pode pegar o .105 de volta"`], at: 'rtq' },
      { pulse: 'rt', badge: ['phone', 'slot'], card: ['o .105 volta ao pool', 'acc', 'livre para o próximo cliente'], at: 'rta' }],
    retry: () => [1, 2, 3].map(i => ({ bc: true, quick: true, card: [`DHCPDISCOVER · tentativa ${i + 1}`, 'hi', `0.0.0.0:68 → 255.255.255.255:67\nsecs = ${[4, 12, 28][i - 1]} · ninguém responde`], at: 'mid' })),
    apipa: () => [{ pulse: 'ph', card: ['desisto: me dou um IP 169.254', 'acc', `${LL} /16 · sem gateway, sem DNS`], at: 'ph' },
      { bc: true, card: ['ARP: alguém usa o ' + LL + '?', 'hi', `MAC ${MAC} → ff:ff:ff:ff:ff:ff`], at: 'mid' },
      { react: true, card: ['silêncio: o endereço está livre', 'hi', 'o celular fica com ele'], at: 'rta' }],
    stuck: () => [{ path: 'pr', dir: 1, stop: 0.42, card: ['✕ para onde mando?', 'acc', `${LL} → ? · não há gateway`], at: 'rtq' },
      { pulse: 'ph', card: ['⚠ conectado, sem internet', 'acc', 'só fala com quem também está em 169.254'], at: 'ph' }],
  };
  const LEG = 1.4, BCL = 2.2, PAUSE = 0.45, PRE = 0.35;
  function timeline() { let t = PRE; const out = LEGS[cur()]().map(l => { const d = l.pulse ? 1.0 : l.react ? 1.2 : l.bc ? (l.quick ? 1.1 : BCL) : LEG, o = { ...l, t0: t, t1: t + d }; t += d + (l.quick ? 0.25 : PAUSE); return o; });
    return { legs: out, end: Math.max(t, 1.4) }; }
  let TL = timeline();
  const legDone = i => TL.legs[i] && lt >= TL.legs[i].t1;
  const stepDone = () => lt >= TL.end - PAUSE;

  // estado do celular, do crachá e do pool em cada momento
  function phoneState() {
    const id = cur();
    const S = { clock: '14:00', status: 'sem IP', ip: ['0.0.0.0', 'dim'], mask: ['—', 'dim'], gw: ['—', 'dim'], dns: ['—', 'dim'], lease: ['—', 'dim'], wifi: true };
    const offer = () => { S.ip = [IP, 'off']; S.mask = [MASK, 'off']; S.gw = [SRV, 'off']; S.dns = [SRV, 'off']; S.lease = ['2 h', 'off']; };
    const ok = (until = '16:00') => { S.ip = [IP, 'ok']; S.mask = [MASK, 'ok']; S.gw = [SRV, 'ok']; S.dns = [SRV, 'ok']; S.lease = ['até ' + until, 'ok']; };
    if (sc === 'first') {
      if (id === 'disc') S.status = 'procurando DHCP…';
      if (id === 'offer') { S.status = legDone(1) ? 'oferta recebida' : 'esperando…'; if (legDone(1)) offer(); }
      if (id === 'req') { S.status = 'pedindo o .105…'; offer(); }
      if (id === 'ack') { if (legDone(1)) { ok(); S.status = '✓ configurado'; } else { offer(); S.status = 'esperando o ACK…'; } }
      if (id === 'conf') { ok(); S.status = '✓ na internet'; }
    } else if (sc === 'renew') {
      ok(); S.clock = '15:00';
      if (id === 't1') { S.status = 'T1: renovar'; S.lease = ['até 16:00 · 1 h', 'ok']; }
      if (id === 'rreq') S.status = 'renovando…';
      if (id === 'rack') { if (legDone(1)) { ok('17:00'); S.status = '✓ renovado'; } else S.status = 'renovando…'; }
      if (id === 'leave') { S.clock = '15:40'; S.wifi = false; S.status = 'Wi-Fi desligado'; S.ip = ['—', 'dim']; S.mask = S.gw = S.dns = S.lease = ['—', 'dim']; }
    } else {
      if (id === 'disc') S.status = legDone(1) ? 'sem resposta…' : 'procurando DHCP…';
      if (id === 'retry') { S.clock = '14:00:28'; S.status = 'tentando de novo…'; }
      if (id === 'apipa' || id === 'stuck') { S.clock = '14:01'; S.ip = [LL, 'bad']; S.mask = ['255.255.0.0', 'bad']; S.gw = ['nenhum', 'bad']; S.dns = ['nenhum', 'bad'];
        S.status = id === 'stuck' ? '⚠ sem internet' : 'IP autoatribuído'; }
    }
    return S;
  }
  // onde o crachá está agora (null = guardado na prateleira)
  const REST = { req: 'hold', ack: 'hold', conf: 'phone', t1: 'phone', rreq: 'phone', rack: 'phone', leave: 'phone' };
  function badgeNow() {
    let pos = sc === 'none' ? null : REST[cur()] || null, fly = null;
    TL.legs.forEach(l => { if (!l.badge || lt < l.t0) return; const f = Math.min(1, (lt - l.t0) / (l.t1 - l.t0));
      if (f < 1) fly = { a: l.badge[0], b: l.badge[1], f }; pos = f < 1 ? null : (l.badge[1] === 'slot' ? null : l.badge[1]); });
    return { pos, fly };
  }
  function slotState() {        // estado da vaga .105
    if (sc === 'none') return 'off';
    const id = cur();
    if (sc === 'renew') return id === 'leave' && legDone(1) ? 'free' : id === 'rack' && legDone(1) ? 'lena17' : 'lena';
    if (id === 'offer') return TL.legs[0] && lt >= TL.legs[0].t0 + 0.3 ? 'held' : 'free';
    if (id === 'req') return 'held';
    if (id === 'ack') return legDone(1) ? 'lena' : 'held';
    if (id === 'conf') return 'lena';
    return 'free';
  }

  const STEPS = {
    noip: { title: { all: 'Um celular sem endereço' },
      story: { all: 'Lena senta no café e o celular entra no Wi-Fi. O rádio conectou, mas o celular ainda não tem IP (0.0.0.0), não sabe quem é o roteador (gateway) nem qual DNS usar. Sem isso, nenhum app consegue falar com a internet.' },
      look: { all: 'A tela do celular mostra os campos vazios. Na prateleira do fundo, os crachás .100 a .120: os acesos já estão emprestados.' },
      key: { all: 'Quem entra numa rede precisa de 4 coisas: IP, máscara, gateway e DNS.' } },
    disc: { title: { all: 'D · Discover: um grito para todo mundo', none: 'D · Discover: um grito para todo mundo' },
      story: { all: 'O celular não sabe quem é o servidor DHCP, e nem tem IP para usar como remetente. Então ele grita em broadcast: manda de 0.0.0.0, porta 68, para 255.255.255.255, porta 67 (UDP). A mensagem chega a todos os aparelhos da praça. Só o roteador, que é o servidor DHCP, responde; os outros ignoram.',
        none: 'O celular grita em broadcast, como sempre: de 0.0.0.0:68 para 255.255.255.255:67. A mensagem chega a todos os aparelhos. Mas neste café o servidor DHCP do roteador está desligado. Ninguém responde.' },
      look: { all: 'O anel de luz corre pelo chão e a luz chega aos quatro aparelhos ao mesmo tempo. Os notebooks e o celular da Bia mostram "ignora".', none: 'O anel chega a todos, e todos ficam quietos. O roteador mostra "DHCP desligado".' },
      key: { all: 'Broadcast: uma mensagem que todos na rede local recebem. É o jeito de achar alguém sem saber o endereço dele.' } },
    offer: { title: { all: 'O · Offer: o servidor separa um crachá' },
      story: { all: `O servidor olha a prateleira: .100 a .104 estão emprestados, o .105 está livre. Ele separa esse crachá e manda uma oferta ao MAC do celular: IP ${IP}, máscara ${MASK}, gateway e DNS ${SRV}, por 2 horas (o lease). O xid ${XID} é o mesmo do Discover, para o celular saber que a resposta é dele.` },
      look: { all: 'O crachá .105 sobe da prateleira e fica em cima do roteador. A luz leva a oferta ao celular, e a tela dele ganha os valores ainda com "?".' },
      key: { all: 'A oferta é uma proposta: o endereço fica reservado, mas ainda não é do celular.' } },
    req: { title: { all: 'R · Request: "quero esse", ainda em broadcast' },
      story: { all: `O celular aceita a oferta. Ele ainda não pode usar o ${IP}, então pede de novo em broadcast, citando o servidor que escolheu (${SRV}). Por que gritar outra vez? Se houvesse dois servidores DHCP, os dois teriam feito ofertas; o broadcast avisa o outro de que a dele foi recusada, e ele devolve o crachá à prateleira.` },
      look: { all: 'O anel corre de novo pela praça. O crachá continua separado em cima do roteador.' },
      key: { all: 'O Request vai em broadcast para todo servidor saber qual oferta venceu.' } },
    ack: { title: { all: 'A · Ack: o crachá fica emprestado' },
      story: { all: `O servidor confirma. Ele anota na tabela: ${IP} emprestado ao MAC ${MAC} até as 16:00. O ACK leva o lease de 7200 s e os tempos de renovação. Ao receber, o celular configura a interface de rede com o novo IP.` },
      look: { all: 'O crachá .105 voa do roteador até o celular. Na prateleira, a vaga .105 passa a dizer "Lena · 16:00". A tela do celular fica toda acesa.' },
      key: { all: 'O IP não é do celular: é emprestado pelo tempo do lease.' } },
    conf: { title: { all: 'Configurado: agora dá para sair' },
      story: { all: `Em quatro mensagens (Discover, Offer, Request, Ack, o DORA), o celular ganhou tudo: IP ${IP}, máscara ${MASK}, gateway ${SRV} e DNS ${SRV}. O primeiro pacote para fora da rede vai ao gateway, e o roteador o leva à internet. Daqui em diante entram o DNS da aula 6 e as conexões TCP.` },
      look: { all: 'A luz sai do celular, passa pelo roteador e segue para a internet, ao fundo.' },
      key: { all: 'DORA: Discover, Offer, Request, Ack. Quatro mensagens e o aparelho está na rede.' } },
    t1: { title: { all: 'T1: na metade do lease, renovar' },
      story: { all: 'Lena ficou no café. São 15:00: passou metade das 2 horas do lease. Esse momento se chama T1. O celular não espera o crachá vencer: ele pede para estender o empréstimo enquanto ainda está tudo funcionando.' },
      look: { all: 'O crachá .105 está com o celular. A tela mostra "até 16:00 · 1 h": falta 1 hora.' },
      key: { all: 'A renovação começa na metade do lease (T1), bem antes de vencer.' } },
    rreq: { title: { all: 'Request de renovação: agora direto' },
      story: { all: `Agora o celular tem IP e sabe quem é o servidor. Por isso não precisa gritar: manda o Request em unicast, de ${IP}:68 para ${SRV}:67, com um xid novo. Os outros aparelhos nem ficam sabendo.` },
      look: { all: 'Uma luz só, do celular ao roteador. Nada de anel pela praça.' },
      key: { all: 'Na renovação o pedido vai direto ao servidor (unicast), sem broadcast.' } },
    rack: { title: { all: 'Ack: mais 2 horas' },
      story: { all: 'O servidor confirma e o relógio do lease recomeça: agora o .105 é da Lena até as 17:00. Se o servidor não respondesse, o celular tentaria de novo e, no T2 (87,5% do lease), gritaria em broadcast para qualquer servidor.' },
      look: { all: 'A vaga .105 na prateleira passa a dizer "Lena · 17:00", e a tela do celular também.' },
      key: { all: 'Renovar mantém o mesmo IP: as conexões abertas não caem.' } },
    leave: { title: { all: 'Lena vai embora: o crachá volta ao pool' },
      story: { all: 'Às 15:40 Lena sai do café. O celular pode mandar um DHCPRELEASE avisando que não precisa mais do endereço. Muitos celulares nem mandam: aí o servidor só espera o lease vencer (17:00). Nos dois casos, o .105 volta para a prateleira e pode ser emprestado a outra pessoa.' },
      look: { all: 'O crachá voa de volta à prateleira e a vaga .105 volta a dizer "livre".' },
      key: { all: 'O pool é finito: endereços voltam quando o aparelho sai ou o lease vence.' } },
    retry: { title: { all: 'Tenta de novo, e de novo' },
      story: { all: 'Sem resposta, o celular repete o Discover, esperando cada vez mais entre as tentativas (por exemplo 4 s, depois 8 s, depois 16 s). O campo secs conta quantos segundos se passaram desde o primeiro grito. Ninguém responde.' },
      look: { all: 'Três anéis seguidos correm pela praça. O roteador continua apagado.' },
      key: { all: 'Sem servidor DHCP, ninguém entrega IP para quem chega.' } },
    apipa: { title: { all: 'Plano B: um IP 169.254.x.x' },
      story: { all: `Depois de algumas tentativas, o celular desiste e se dá um endereço sozinho, da faixa 169.254.0.0/16 (link-local, ou APIPA). Ele sorteia ${LL} e pergunta por ARP se alguém já usa esse endereço. Silêncio: ele fica com o endereço. Mas não há gateway nem DNS.` },
      look: { all: `A tela do celular mostra ${LL} e "nenhum" no gateway e no DNS. O anel agora é uma pergunta ARP.` },
      key: { all: 'IP 169.254.x.x = o aparelho não achou DHCP e se autoatribuiu um endereço (veja a aula 3).' } },
    stuck: { title: { all: 'Conectado ao Wi-Fi, sem internet' },
      story: { all: 'Lena abre o navegador. O celular precisa mandar o pacote ao gateway, mas não tem gateway. Também não tem DNS para achar o nome do site. O Wi-Fi aparece conectado, mas nada sai da rede local. É o sintoma clássico de DHCP fora do ar ou pool esgotado.' },
      look: { all: 'A luz sai do celular, para no meio do caminho e some: não há para onde mandar.' },
      key: { all: 'Viu 169.254.x.x? Procure o problema no servidor DHCP, não no site.' } },
  };

  // dados de cada mensagem (para o painel)
  const M = {
    disc: { n: 'D · DHCPDISCOVER', k: 'broadcast · UDP', f: [['origem', '0.0.0.0:68'], ['destino', '255.255.255.255:67'], ['MAC origem', MAC], ['MAC destino', 'ff:ff:ff:ff:ff:ff'], ['xid', XID], ['pede (opção 55)', 'máscara, gateway, DNS']] },
    offer: { n: 'O · DHCPOFFER', k: 'unicast ao MAC da Lena', f: [['origem', SRV + ':67'], ['destino', IP + ':68'], ['MAC destino', MAC], ['xid', XID], ['seu IP (yiaddr)', IP], ['máscara', MASK], ['gateway', SRV], ['DNS', SRV], ['lease', '7200 s (2 h)'], ['servidor (opção 54)', SRV]] },
    req: { n: 'R · DHCPREQUEST', k: 'broadcast · UDP', f: [['origem', '0.0.0.0:68'], ['destino', '255.255.255.255:67'], ['MAC origem', MAC], ['xid', XID], ['IP pedido (opção 50)', IP], ['servidor escolhido (54)', SRV]] },
    ack: { n: 'A · DHCPACK', k: 'unicast', f: [['origem', SRV + ':67'], ['destino', IP + ':68'], ['xid', XID], ['seu IP', IP], ['lease', '7200 s'], ['T1 (renovar)', '3600 s'], ['T2 (rebind)', '6300 s']] },
    rreq: { n: 'R · DHCPREQUEST (renovação)', k: 'unicast', f: [['origem', IP + ':68'], ['destino', SRV + ':67'], ['IP atual (ciaddr)', IP], ['xid', XID2]] },
    rack: { n: 'A · DHCPACK', k: 'unicast', f: [['origem', SRV + ':67'], ['destino', IP + ':68'], ['xid', XID2], ['lease', '7200 s (até 17:00)']] },
    rel: { n: 'DHCPRELEASE (opcional)', k: 'unicast', f: [['origem', IP + ':68'], ['destino', SRV + ':67'], ['IP devolvido', IP], ['MAC', MAC]] },
    arp: { n: 'ARP (sondagem)', k: 'broadcast', f: [['MAC origem', MAC], ['MAC destino', 'ff:ff:ff:ff:ff:ff'], ['IP remetente', '0.0.0.0'], ['procura', LL]] },
  };
  const msgHtml = (m, extra = '') => `<div class="d3-msg"><div class="d3-mh"><b>${m.n}</b><span>${m.k}</span></div><div class="d3-f">${m.f.map(([a, b]) => `<span><small>${a}</small>${b}</span>`).join('')}${extra}</div></div>`;
  const X_EX = '<li class="h3-dim">MAC, xid, horários e o pool são exemplos. Em casa o lease costuma ser de 24 h (como no widget da aula); redes públicas usam leases curtos para reaproveitar endereços.</li>';
  const X_B = '<li>Offer e Ack vão em unicast ao MAC do celular. Se o cliente pedir (flag de broadcast), o servidor responde em broadcast.</li>';
  const DATA = {
    noip: () => `<li>MAC do celular: <b>${MAC}</b> (é ele que identifica o celular até ter IP)</li><li>Pool do servidor: <b>192.168.0.100 a .120</b> (21 endereços); emprestados: .100 .101 .102 .103 .104 .108 .113</li>${X_EX}`,
    disc: () => msgHtml(M.disc) + (sc === 'none' ? '<li>Nenhum servidor escuta a porta 67: o grito se perde.</li>' : '<li>Os notebooks e o celular da Bia recebem, veem que é DHCP para a porta 67 e descartam: não são servidores.</li>'),
    offer: () => msgHtml(M.offer) + X_B,
    req: () => msgHtml(M.req) + '<li>Ainda de <b>0.0.0.0</b>: o IP só vale depois do ACK.</li>',
    ack: () => msgHtml(M.ack) + '<li>Tabela do servidor: <b>' + IP + ' → ' + MAC + ' até 16:00</b></li>',
    conf: () => `<table class="h3-sum"><tr><th>Campo</th><th>Valor</th></tr><tr><td>IP</td><td>${IP}</td></tr><tr><td>Máscara</td><td>${MASK} (/24)</td></tr><tr><td>Gateway</td><td>${SRV}</td></tr><tr><td>DNS</td><td>${SRV}</td></tr><tr><td>Lease</td><td>2 h, até 16:00</td></tr></table>`,
    t1: () => '<li><b>T1</b> = 50% do lease (aqui 1 h): renova em unicast com o mesmo servidor.</li><li><b>T2</b> = 87,5% (1 h 45): se o servidor sumiu, pede em broadcast a qualquer um.</li><li>Lease vencido sem renovação: o celular para de usar o IP.</li>',
    rreq: () => msgHtml(M.rreq),
    rack: () => msgHtml(M.rack) + '<li>Tabela do servidor: <b>' + IP + ' → ' + MAC + ' até 17:00</b></li>',
    leave: () => msgHtml(M.rel) + '<li>Sem o RELEASE, o .105 volta ao pool às 17:00, quando o lease vence.</li>',
    retry: () => msgHtml({ ...M.disc, f: M.disc.f.slice(0, 3).concat([['secs', '4 · 12 · 28']]) }) + '<li>Os intervalos dobram a cada tentativa, com um pouco de sorteio (exemplo).</li>',
    apipa: () => `<li>Endereço: <b>${LL}</b>, máscara 255.255.0.0 (faixa 169.254.0.0/16, link-local)</li><li>Gateway: nenhum · DNS: nenhum</li>${msgHtml(M.arp)}<li>iPhone, Mac e Windows fazem isso. Alguns Android só mostram "falha ao obter endereço IP".</li>`,
    stuck: () => `<li>Destino fora da rede local: precisa de gateway. Não há.</li><li>Nome de site: precisa de DNS. Não há.</li><li>Só fala com aparelhos que também estão em 169.254.x.x.</li><li>Causas comuns: servidor DHCP fora do ar ou pool esgotado.</li>`,
  };
  const DORA = { disc: 0, offer: 1, req: 2, ack: 3, conf: 4 };
  const doraHtml = () => { if (sc !== 'first' || cur() === 'noip') return '';
    const k = DORA[cur()]; return `<div class="d3-dora">${['Discover', 'Offer', 'Request', 'Ack'].map((w, i) => `<span class="${i < k ? 'done' : i === k ? 'on' : ''}"><b>${w[0]}</b>${w.slice(1)}</span>`).join('')}</div>`; };
  function nowHtml() { const S = phoneState(); return `<li>Celular agora: IP <b>${S.ip[0]}</b> · gateway <b>${S.gw[0]}</b> · DNS <b>${S.dns[0]}</b></li>${DATA[cur()]()}`; }
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      ${doraHtml()}
      <h2>${pick(s.title)}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${pick(s.look)}</p>
      <p class="o3-key"><b>Em uma frase</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados do passo</summary><ul class="h3-now" id="dhcpnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'dhcp') return;
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ip ${phoneState().ip[0]}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'dhcp' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; nowKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 1.8; TL = timeline(); keys.clear(); render(); SFX.bit(1); return true; }
  const goId = id => { const map = { ph: { first: 'noip', renew: 't1', none: 'apipa' }, rt: { first: 'ack', renew: 'rack', none: 'disc' }, pool: { first: 'offer', renew: 'leave', none: 'disc' } };
    const want = map[id]?.[sc] || (DEV.some(d => d.id === id) ? 'disc' : null); const i = ids().indexOf(want); return go(i >= 0 ? i : step); };
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { const id = cur(); sc = v; try { localStorage.setItem('sdlabs-dhcp3d-sc', v); } catch (e) {}
    const i = ids().indexOf(id); return go(Math.max(0, i)); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % 3]);
  document.getElementById('info')?.addEventListener('click', e => { const b = e.target.closest('[data-sc]'); if (b && active === 'dhcp') setSc(b.dataset.sc); });

  // ── telas ──
  const keys = new Map();
  const bgFill = (x, cv) => { x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); };
  function drawPhone(S) {
    const key = JSON.stringify(S) + theme; if (keys.get('ph') === key) return; keys.set('ph', key);
    const { x, P: P0 } = phScr, P = P0 * 1.35, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    bgFill(x, phScr); x.textBaseline = 'middle';
    x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(3.4)}px ${MONO3}`; x.fillText(S.clock, u(4), u(5));
    x.textAlign = 'right'; x.fillText(S.wifi ? 'Wi-Fi Café' : 'Wi-Fi off', u(48), u(5));
    x.textAlign = 'center'; const bad = S.status.startsWith('⚠'), good = S.status.startsWith('✓');
    x.fillStyle = bad || good ? acc : C.inkHi; x.font = `600 ${u(4.4)}px ${MONO3}`; x.fillText(S.status, u(26), u(14));
    x.strokeStyle = C.detail; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(48), u(20)); x.stroke();
    [['IP', S.ip], ['Máscara', S.mask], ['Gateway', S.gw], ['DNS', S.dns], ['Lease', S.lease]].forEach(([k, [v, tone]], i) => { const y = 26 + i * 15.5;
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(3.4)}px ${MONO3}`; x.fillText(k, u(5), u(y));
      if (tone === 'off') { x.textAlign = 'right'; x.fillText('oferta?', u(47), u(y)); }
      x.textAlign = 'left'; x.fillStyle = tone === 'ok' || tone === 'bad' ? acc : tone === 'off' ? C.inkHi : C.ink;
      x.font = `${tone === 'dim' ? 400 : 600} ${u(v.length > 13 ? 4.3 : 4.8)}px ${MONO3}`; x.fillText(v, u(5), u(y + 6.5));
      if (tone === 'off') { x.setLineDash([u(1), u(1)]); x.strokeStyle = C.ink; x.beginPath(); x.moveTo(u(5), u(y + 10)); x.lineTo(u(47), u(y + 10)); x.stroke(); x.setLineDash([]); } });
    x.textAlign = 'center'; x.fillStyle = C.ink; x.font = `${u(3)}px ${MONO3}`; x.fillText('MAC ' + MAC, u(26), u(107));
    phScr.tex.needsUpdate = true;
  }
  function drawDev(d, msg) {
    const key = d.id + msg + theme; if (keys.get(d.id) === key) return; keys.set(d.id, key);
    const cv = d.scr, { x, P } = cv, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    const w = cv.c.width / P, h = cv.c.height / P, small = w < 40;
    bgFill(x, cv); x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillStyle = C.inkHi; x.font = `600 ${u(small ? 5 : 7)}px ${MONO3}`; x.fillText(d.ip.slice(small ? 8 : 0), u(w / 2), u(small ? 12 : 12));
    x.fillStyle = msg ? acc : C.ink; x.font = `${u(small ? 4 : 5.6)}px ${MONO3}`;
    (msg || (small ? 'ok' : 'navegando')).split('\n').forEach((l, i) => x.fillText(l, u(w / 2), u((small ? 26 : 26) + i * (small ? 7 : 8))));
    cv.tex.needsUpdate = true;
  }
  function drawRouter(on, line) {
    const key = on + line + theme; if (keys.get('rt') === key) return; keys.set('rt', key);
    const { x, P } = rtScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    bgFill(x, rtScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(on ? 'DHCP · ' + SRV : 'DHCP desligado', u(5), u(9));
    x.fillStyle = line && on ? acc : C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(line || (on ? 'esperando clientes' : 'ninguém escuta a porta 67'), u(5), u(21));
    rtScr.tex.needsUpdate = true;
  }
  function drawPool(st) {
    const key = st + theme; if (keys.get('pool') === key) return; keys.set('pool', key);
    const { x, P } = plScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    bgFill(x, plScr); x.textBaseline = 'middle'; x.textAlign = 'center';
    for (let n = 100; n <= 120; n++) { const i = n - 100, c = i % 7, r = (i / 7) | 0, x0 = c * CW + 1.5, y0 = r * CH + 1.5, w = CW - 3, h = CH - 3;
      const mine = n === 105, own = OWN[n], state = mine ? st : own ? 'lent' : 'free';
      const off = st === 'off';
      x.beginPath(); x.roundRect(u(x0), u(y0), u(w), u(h), u(2));
      if (state === 'lent' && !off) { x.fillStyle = theme === 'light' ? '#dcdddd' : '#26292b'; x.fill(); }
      if ((state === 'lena' || state === 'lena17') && !off) { x.fillStyle = A_; x.globalAlpha = 0.28; x.fill(); x.globalAlpha = 1; }
      x.strokeStyle = !off && (state === 'held' || state === 'lena' || state === 'lena17') ? A_ : C.line; x.lineWidth = u(state === 'held' ? 0.9 : 0.4);
      if (state === 'held') x.setLineDash([u(1.6), u(1)]); x.stroke(); x.setLineDash([]);
      const hot = !off && mine && state !== 'free';
      x.fillStyle = off ? C.ink : hot ? acc : state === 'lent' ? C.inkHi : C.ink; x.font = `600 ${u(5.4)}px ${MONO3}`; x.fillText('.' + n, u(x0 + w / 2), u(y0 + 6.5));
      const sub = off ? '—' : state === 'lent' ? own : state === 'held' ? 'oferta' : state === 'lena' ? 'Lena 16:00' : state === 'lena17' ? 'Lena 17:00' : 'livre';
      x.fillStyle = hot ? acc : C.ink; x.font = `${u(3.6)}px ${MONO3}`; x.fillText(sub, u(x0 + w / 2), u(y0 + 13.5)); }
    plScr.tex.needsUpdate = true;
  }

  // ── um quadro da cena ──
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  function scene3() {
    const id = cur(), t = lt, phone = innerWidth < 640, none = sc === 'none';
    const lit = new Set(), pulse = {}; let nd = 0, ringR = 0, qShown = null, aShown = null, bcArrived = -1, react = false;
    TL.legs.forEach(l => {
      if (t < l.t0) return;
      const f = Math.min(1, (t - l.t0) / (l.t1 - l.t0));
      if (l.pulse) pulse[l.pulse] = f < 1 ? 0.5 + 0.5 * Math.sin(f * Math.PI * 3) : 0.35;
      if (l.react) react = true;
      if (l.bc) { BC.forEach(k => lit.add(k));
        if (f < 1) { ringR = 15 + f * 640; BC.forEach(k => { const P = PATHS[k], d = DOTS[nd++]; if (!d) return; place(d, alongPts(P.pts, P.cum, ease(f)), 1.3); }); }
        else bcArrived = Math.max(bcArrived, l.t1); }
      if (l.path) { lit.add(l.path);
        if (f < 1) { const P = PATHS[l.path], s = l.stop || 1, g = l.dir > 0 ? ease(f) * s : 1 - ease(f);
          const d = DOTS[nd++]; place(d, alongPts(P.pts, P.cum, g), l.stop && f > 0.8 ? 1.3 * (1 - f) * 5 : 1.3); } }
      if (l.card) { if (l.pulse || l.react || l.dir < 0) aShown = l; else qShown = l; }
    });
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    setRing(ringR);
    Object.entries(PATHS).forEach(([k, P]) => { P.lit.visible = lit.has(k) && !(k === 'net' && id !== 'conf'); });
    // balões
    const cardText = l => l.card[2] ? `${l.card[0]}\n${l.card[2]}` : l.card[0];
    if (qShown && aShown && aShown.t0 > qShown.t0) qShown = null;           // a resposta substitui a pergunta
    if (aShown && qShown && qShown.t0 > aShown.t0) aShown = null;
    if (qShown) tQ.set(cardText(qShown), qShown.card[1]).at(...at(qShown.at)); else tQ.hide();
    if (aShown) tA.set(cardText(aShown), aShown.card[1]).at(...at(aShown.at)); else tA.hide();
    const cardAt = l => l && l.at;
    // nomes fixos (escondidos quando um balão ocupa o mesmo lugar)
    { const S = phoneState(), row = (k, v) => (k.padEnd(8) + v[0] + (v[1] === 'off' ? ' ?' : '')).padEnd(22), done = S.ip[1] === 'ok' || S.ip[1] === 'bad';
      tPh.set(['CELULAR DA LENA', S.status.padEnd(22), row('IP', S.ip), row('máscara', S.mask), row('gateway', S.gw), row('DNS', S.dns), row('lease', S.lease)].join('\n'), done ? 'acc' : 'hi').at(80, 175, phone ? 300 : 282); }
    const rtBusy = cardAt(aShown) === 'rta';
    if (rtBusy) tRt.hide(); else tRt.set(none ? 'ROTEADOR\nDHCP desligado' : phone ? 'ROTEADOR · DHCP' : `ROTEADOR\nservidor DHCP · ${SRV}`, none ? 'dim' : 'hi').at(308, 66, 126);
    tPl.set(phone ? 'POOL .100 – .120' : 'POOL DE ENDEREÇOS\n192.168.0.100 – .120', none ? 'dim' : 'hi').at(511, 52, 128);
    if (id === 'conf' && legDone(1)) tNet.set('INTERNET', 'acc').at(308, -60, 232); else tNet.hide();
    // os outros aparelhos: recebem o broadcast e ignoram
    const arrived = bcArrived > 0 && t >= bcArrived;
    const flashK = arrived ? Math.max(0, 1 - (t - bcArrived) / 1.2) : 0;
    DEV.forEach((d, i) => {
      const ign = arrived && (react || (TL.legs.find(l => l.bc && l.quick))), arp = id === 'apipa';
      const msg = ign ? (arp ? 'não sou eu' : 'DHCP? ignora') : '';
      tDev[i].set(ign ? `${d.name.split(' · ')[1]}: ✕ ignora` : phone ? d.name.split(' · ')[1] : d.name, ign ? 'hi' : 'dim').at(d.top[0], d.top[1] + 6, d.top[2] + (d.id === 'davi' ? 34 : 24));
      d.cap.emissiveIntensity = flashK * 0.9;
      drawDev(d, msg.replace(' ', '\n'));
    });
    // roteador
    const rtResp = !none && arrived && react;
    rtCap.emissiveIntensity = none ? 0 : pulse.rt ?? (rtResp ? 0.6 : flashK * 0.9);
    const line = none ? '' : id === 'disc' && arrived ? 'Discover de ' + MAC.slice(9) : id === 'offer' ? 'ofereço o .105' : id === 'req' ? 'Lena escolheu a minha' :
      id === 'ack' || id === 'conf' ? '.105 → Lena até 16:00' : id === 'rack' && legDone(1) ? '.105 → Lena até 17:00' : id === 'leave' && legDone(1) ? '.105 de volta ao pool' : sc === 'renew' ? '.105 → Lena até 16:00' : '';
    drawRouter(!none, line);
    rtLed.material = none ? ledOffMat : ledOnMat; rtGlow.material.uniforms.intensity.value = none ? 0 : 0.6;
    phCap.emissiveIntensity = pulse.ph ?? (ringR > 0 ? 0.6 : 0);
    // crachá
    const B = badgeNow();
    let bp = null;
    if (B.fly) { const a = BPOS[B.fly.a], b = BPOS[B.fly.b], f = ease(B.fly.f), lift = Math.sin(f * Math.PI) * 60; bp = lerp3(a, b, f); bp[2] += lift; }
    else if (B.pos) bp = BPOS[B.pos];
    if (bp) { bdG.visible = true; bdG.position.copy(W(...bp)); bdMat.emissiveIntensity = 1.1; moveGlow(bdGlow, [bp[0], bp[1] + 3, bp[2]], 0.7);
      const ss = slotState(), txt = B.fly ? IP : ss === 'held' ? `crachá ${IP}\nseparado (oferta)` : ss === 'lena17' ? `crachá ${IP}\naté 17:00` : `crachá ${IP}\naté 16:00`;
      if (B.pos === 'phone' || cardAt(aShown) === 'rta' || (NARROW() && qShown)) tBd.hide(); else tBd.set(phone ? '.105' : txt, 'acc').at(bp[0], bp[1], bp[2] + 30); }
    else { bdG.visible = false; bdGlow.material.uniforms.intensity.value = 0; tBd.hide(); }
    drawPool(slotState());
    drawPhone(phoneState());
  }
  function place(d, p, k) { d.g.visible = true; d.g.position.copy(W(...p)); d.mat.emissiveIntensity = k; moveGlow(d.glow, [p[0], p[1], p[2] + 4], k > 0.5 ? 0.9 : 0); }

  // ── câmera: acompanha o que importa em cada passo ──
  const FOCUS = { noip: [270, 130, 70], disc: [285, 130, 60], offer: [285, 115, 70], req: [285, 130, 60], ack: [280, 120, 70], conf: [270, 100, 85],
    t1: [270, 130, 70], rreq: [275, 120, 70], rack: [280, 120, 70], leave: [278, 115, 70], retry: [285, 130, 60], apipa: [280, 130, 60], stuck: [270, 130, 70] };
  const FOCUS_M = { noip: [260, 140, 120], disc: [275, 140, 110], offer: [275, 120, 120], req: [275, 140, 110], ack: [265, 130, 120], conf: [265, 110, 130],
    t1: [260, 140, 120], rreq: [265, 130, 120], rack: [265, 130, 120], leave: [280, 120, 120], retry: [275, 140, 110], apipa: [270, 140, 115], stuck: [260, 140, 120] };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; if (lt > TL.end + 3) lt = 0;              // repete a fala do passo
    scene3();
    if (now - nowAt > 150) { nowAt = now; const el = document.getElementById('dhcpnow'), h = nowHtml(); if (el && h !== nowKey) { nowKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const mob = NARROW(), f = (mob ? FOCUS_M : FOCUS)[cur()];
      const want = W(f[0] + (mob ? -10 : -195), f[1], f[2] + (mob ? (innerWidth < 640 ? -300 : -250) : 0)), dd = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (dd.lengthSq() > 1e-8) { controls.target.add(dd); camera.position.add(dd); }
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(6.5, TL.end + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (e.key === '1' || e.key === '2' || e.key === '3') return setSc(SC[+e.key - 1]);
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.go === undefined) o = o.parent; if (o) goId(o.userData.go); }
  themeHooks.push(() => { tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } }); keys.clear(); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'espaço', auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 130, -150), dist: innerWidth < 640 ? 10.6 : 13.5 } : { target: W(180, 130, 70), dist: 16 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1 2 3 · arraste para girar' };
})() });
