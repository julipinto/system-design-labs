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
  const OWN = { 100: 'printer', 101: 'Caio', 102: 'Bia', 103: 'cashier', 104: 'Davi', 108: 'TV', 113: 'Ana' };
  const SC = ['first', 'renew', 'none'], SCNAME = { first: 'First time', renew: 'Renewal', none: 'No DHCP server' };
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
    { id: 'caio', name: 'LAPTOP · CAIO', ip: '192.168.0.101', ...notebook(170, 146, 'caio') },
  ];
  { const g = mkGroup('bia'); rbox(320, 178, 7, 44, 30, 6, 4, bodyMat, g); rbox(324, 190, 13, 36, 9, 76, 6, bodyMat, g);
    const cap = glowCap(328, 190.5, 89, 28, 8, 2, 2, g); const scr = faceCanvas('front', 327, 199, 86, 30, 66, 5, g);
    DEV.push({ id: 'bia', name: 'PHONE · BIA', ip: '192.168.0.102', g, cap, scr, top: [342, 194, 92] }); }
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
    noip: () => [{ pulse: 'ph', card: ['IP: 0.0.0.0 · gateway: ? · DNS: ?', 'hi', 'I know nothing about this network yet'], at: 'ph' }],
    disc: () => [{ bc: true, card: ['D · DHCPDISCOVER (broadcast)', 'acc', `0.0.0.0:68 → 255.255.255.255:67\nMAC ${MAC} · xid ${XID}`], at: 'mid' },
      sc === 'none' ? { react: true, card: ['nobody answers', 'hi', 'there is no DHCP server on this network'], at: 'rta' }
        : { react: true, card: ['router: I am the DHCP server!', 'acc', 'the other devices ignore it'], at: 'rta' }],
    offer: () => [{ pulse: 'rt', badge: ['slot', 'hold'], card: ['server: I hold .105 from the pool', 'acc', 'first free badge'], at: 'rta' },
      { path: 'pr', dir: -1, card: ['O · DHCPOFFER', 'acc', `${SRV}:67 → ${IP}:68\nIP ${IP} · /24 · gw and DNS ${SRV} · 2 h`], at: 'rtq' }],
    req: () => [{ bc: true, card: ['R · DHCPREQUEST (broadcast)', 'acc', `0.0.0.0:68 → 255.255.255.255:67\nI want ${IP} from server ${SRV}`], at: 'mid' },
      { react: true, card: ['everyone learns the choice', 'hi', 'another DHCP server would release its offer'], at: 'rta' }],
    ack: () => [{ pulse: 'rt', card: ['server: I log the lease', 'acc', `${IP} → ${MAC}\nuntil 16:00`], at: 'rta' },
      { path: 'pr', dir: -1, badge: ['hold', 'phone'], card: ['A · DHCPACK', 'acc', `${SRV}:67 → ${IP}:68 · xid ${XID}\nlease 7200 s · renew in 1 h (T1)`], at: 'rtq' }],
    conf: () => [{ pulse: 'ph', card: ['✓ configured', 'acc', `IP ${IP} · gw ${SRV} · DNS ${SRV}`], at: 'ph' },
      { path: 'pr', dir: 1, card: [`${IP} → gateway ${SRV}`, 'acc', 'the 1st packet out goes to the router'], at: 'rtq' },
      { path: 'net', dir: 1, card: ['router → internet', 'acc', 'now DNS (lesson 6) and the rest work'], at: 'net' }],
    t1: () => [{ pulse: 'ph', card: ['15:00 · half the lease (T1)', 'acc', 'time to ask for more time'], at: 'ph' }],
    rreq: () => [{ path: 'pr', dir: 1, card: ['R · DHCPREQUEST (unicast)', 'acc', `${IP}:68 → ${SRV}:67\nxid ${XID2} · no broadcast`], at: 'rtq' }],
    rack: () => [{ pulse: 'rt', card: ['server: renewed', 'acc', `${IP} → ${MAC}\nuntil 17:00`], at: 'rta' },
      { path: 'pr', dir: -1, card: ['A · DHCPACK', 'acc', `${SRV}:67 → ${IP}:68\nlease 7200 s again · until 17:00`], at: 'rtq' }],
    leave: () => [{ path: 'pr', dir: 1, card: ['DHCPRELEASE (optional)', 'hi', `${IP}:68 → ${SRV}:67\n"you can take .105 back"`], at: 'rtq' },
      { pulse: 'rt', badge: ['phone', 'slot'], card: ['.105 goes back to the pool', 'acc', 'free for the next client'], at: 'rta' }],
    retry: () => [1, 2, 3].map(i => ({ bc: true, quick: true, card: [`DHCPDISCOVER · attempt ${i + 1}`, 'hi', `0.0.0.0:68 → 255.255.255.255:67\nsecs = ${[4, 12, 28][i - 1]} · nobody answers`], at: 'mid' })),
    apipa: () => [{ pulse: 'ph', card: ['I give up: I assign myself a 169.254 IP', 'acc', `${LL} /16 · no gateway, no DNS`], at: 'ph' },
      { bc: true, card: ['ARP: is anyone using ' + LL + '?', 'hi', `MAC ${MAC} → ff:ff:ff:ff:ff:ff`], at: 'mid' },
      { react: true, card: ['silence: the address is free', 'hi', 'the phone keeps it'], at: 'rta' }],
    stuck: () => [{ path: 'pr', dir: 1, stop: 0.42, card: ['✕ where do I send it?', 'acc', `${LL} → ? · there is no gateway`], at: 'rtq' },
      { pulse: 'ph', card: ['⚠ connected, no internet', 'acc', 'only talks to others on 169.254 too'], at: 'ph' }],
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
    const S = { clock: '14:00', status: 'no IP', ip: ['0.0.0.0', 'dim'], mask: ['—', 'dim'], gw: ['—', 'dim'], dns: ['—', 'dim'], lease: ['—', 'dim'], wifi: true };
    const offer = () => { S.ip = [IP, 'off']; S.mask = [MASK, 'off']; S.gw = [SRV, 'off']; S.dns = [SRV, 'off']; S.lease = ['2 h', 'off']; };
    const ok = (until = '16:00') => { S.ip = [IP, 'ok']; S.mask = [MASK, 'ok']; S.gw = [SRV, 'ok']; S.dns = [SRV, 'ok']; S.lease = ['until ' + until, 'ok']; };
    if (sc === 'first') {
      if (id === 'disc') S.status = 'looking for DHCP…';
      if (id === 'offer') { S.status = legDone(1) ? 'offer received' : 'waiting…'; if (legDone(1)) offer(); }
      if (id === 'req') { S.status = 'asking for .105…'; offer(); }
      if (id === 'ack') { if (legDone(1)) { ok(); S.status = '✓ configured'; } else { offer(); S.status = 'waiting for the ACK…'; } }
      if (id === 'conf') { ok(); S.status = '✓ online'; }
    } else if (sc === 'renew') {
      ok(); S.clock = '15:00';
      if (id === 't1') { S.status = 'T1: renew'; S.lease = ['until 16:00 · 1 h', 'ok']; }
      if (id === 'rreq') S.status = 'renewing…';
      if (id === 'rack') { if (legDone(1)) { ok('17:00'); S.status = '✓ renewed'; } else S.status = 'renewing…'; }
      if (id === 'leave') { S.clock = '15:40'; S.wifi = false; S.status = 'Wi-Fi turned off'; S.ip = ['—', 'dim']; S.mask = S.gw = S.dns = S.lease = ['—', 'dim']; }
    } else {
      if (id === 'disc') S.status = legDone(1) ? 'no answer…' : 'looking for DHCP…';
      if (id === 'retry') { S.clock = '14:00:28'; S.status = 'trying again…'; }
      if (id === 'apipa' || id === 'stuck') { S.clock = '14:01'; S.ip = [LL, 'bad']; S.mask = ['255.255.0.0', 'bad']; S.gw = ['none', 'bad']; S.dns = ['none', 'bad'];
        S.status = id === 'stuck' ? '⚠ no internet' : 'self-assigned IP'; }
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
    noip: { title: { all: 'A phone with no address' },
      story: { all: 'Lena sits down at the café and the phone joins the Wi-Fi. The radio connected, but the phone still has no IP (0.0.0.0), does not know who the router (gateway) is and does not know which DNS to use. Without that, no app can talk to the internet.' },
      look: { all: 'The phone screen shows empty fields. On the shelf at the back, badges .100 to .120: the lit ones are already lent out.' },
      key: { all: 'Anyone joining a network needs 4 things: IP, mask, gateway and DNS.' } },
    disc: { title: { all: 'D · Discover: a shout to everyone', none: 'D · Discover: a shout to everyone' },
      story: { all: 'The phone does not know who the DHCP server is, and has no IP to use as sender. So it shouts in broadcast: from 0.0.0.0, port 68, to 255.255.255.255, port 67 (UDP). The message reaches every device in the square. Only the router, which is the DHCP server, answers; the others ignore it.',
        none: 'The phone shouts in broadcast, as always: from 0.0.0.0:68 to 255.255.255.255:67. The message reaches every device. But in this café the router\'s DHCP server is turned off. Nobody answers.' },
      look: { all: 'The ring of light runs across the floor and the light reaches the four devices at the same time. The laptop, the tablet and Bia\'s phone show "ignore".', none: 'The ring reaches everyone, and everyone stays quiet. The router shows "DHCP off".' },
      key: { all: 'Broadcast: a message that everyone on the local network receives. It is how you find someone without knowing their address.' } },
    offer: { title: { all: 'O · Offer: the server holds a badge' },
      story: { all: `The server looks at the shelf: .100 to .104 are lent out, .105 is free. It holds that badge and sends an offer to the phone\'s MAC: IP ${IP}, mask ${MASK}, gateway and DNS ${SRV}, for 2 hours (the lease). The xid ${XID} is the same as in the Discover, so the phone knows the answer is for it.` },
      look: { all: 'Badge .105 rises from the shelf and sits on top of the router. The light carries the offer to the phone, and its screen gets the values, still with "?".' },
      key: { all: 'The offer is a proposal: the address is reserved, but not yet the phone\'s.' } },
    req: { title: { all: 'R · Request: "I want this one", still in broadcast' },
      story: { all: `The phone accepts the offer. It cannot use ${IP} yet, so it asks again in broadcast, naming the server it chose (${SRV}). Why shout again? If there were two DHCP servers, both would have made offers; the broadcast tells the other one its offer was declined, and it puts the badge back on the shelf.` },
      look: { all: 'The ring runs across the square again. The badge stays held on top of the router.' },
      key: { all: 'The Request goes in broadcast so every server knows which offer won.' } },
    ack: { title: { all: 'A · Ack: the badge is lent' },
      story: { all: `The server confirms. It writes in its table: ${IP} lent to MAC ${MAC} until 16:00. The ACK carries the 7200 s lease and the renewal times. On receiving it, the phone configures its network interface with the new IP.` },
      look: { all: 'Badge .105 flies from the router to the phone. On the shelf, slot .105 now says "Lena · 16:00". The phone screen lights up fully.' },
      key: { all: 'The IP is not the phone\'s: it is lent for the length of the lease.' } },
    conf: { title: { all: 'Configured: now it can go out' },
      story: { all: `In four messages (Discover, Offer, Request, Ack, the DORA), the phone got everything: IP ${IP}, mask ${MASK}, gateway ${SRV} and DNS ${SRV}. The first packet out of the network goes to the gateway, and the router carries it to the internet. From here on, the DNS from lesson 6 and TCP connections come in.` },
      look: { all: 'The light leaves the phone, passes through the router and goes on to the internet, at the back.' },
      key: { all: 'DORA: Discover, Offer, Request, Ack. Four messages and the device is on the network.' } },
    t1: { title: { all: 'T1: halfway through the lease, renew' },
      story: { all: 'Lena stayed at the café. It is 15:00: half of the lease\'s 2 hours have passed. This moment is called T1. The phone does not wait for the badge to expire: it asks to extend the loan while everything is still working.' },
      look: { all: 'Badge .105 is with the phone. The screen shows "until 16:00 · 1 h": 1 hour left.' },
      key: { all: 'Renewal starts halfway through the lease (T1), well before it expires.' } },
    rreq: { title: { all: 'Renewal Request: now direct' },
      story: { all: `Now the phone has an IP and knows who the server is. So it does not need to shout: it sends the Request in unicast, from ${IP}:68 to ${SRV}:67, with a new xid. The other devices do not even find out.` },
      look: { all: 'A single light, from the phone to the router. No ring across the square.' },
      key: { all: 'On renewal the request goes straight to the server (unicast), with no broadcast.' } },
    rack: { title: { all: 'Ack: 2 more hours' },
      story: { all: 'The server confirms and the lease clock restarts: now .105 is Lena\'s until 17:00. If the server did not answer, the phone would try again and, at T2 (87.5% of the lease), would shout in broadcast to any server.' },
      look: { all: 'Slot .105 on the shelf now says "Lena · 17:00", and so does the phone screen.' },
      key: { all: 'Renewing keeps the same IP: open connections do not drop.' } },
    leave: { title: { all: 'Lena leaves: the badge goes back to the pool' },
      story: { all: 'At 15:40 Lena leaves the café. The phone can send a DHCPRELEASE saying it no longer needs the address. Many phones do not even send it: then the server just waits for the lease to expire (17:00). In both cases, .105 goes back on the shelf and can be lent to someone else.' },
      look: { all: 'The badge flies back to the shelf and slot .105 says "free" again.' },
      key: { all: 'The pool is finite: addresses come back when the device leaves or the lease expires.' } },
    retry: { title: { all: 'Try again, and again' },
      story: { all: 'With no answer, the phone repeats the Discover, waiting longer each time between attempts (for example 4 s, then 8 s, then 16 s). The secs field counts how many seconds have passed since the first shout. Nobody answers.' },
      look: { all: 'Three rings in a row run across the square. The router stays dark.' },
      key: { all: 'With no DHCP server, nobody hands out an IP to whoever arrives.' } },
    apipa: { title: { all: 'Plan B: a 169.254.x.x IP' },
      story: { all: `After a few attempts, the phone gives up and gives itself an address, from the 169.254.0.0/16 range (link-local, or APIPA). It picks ${LL} at random and asks via ARP whether anyone already uses that address. Silence: it keeps the address. But there is no gateway and no DNS.` },
      look: { all: `The phone screen shows ${LL} and "none" for the gateway and the DNS. The ring is now an ARP question.` },
      key: { all: 'IP 169.254.x.x = the device found no DHCP and assigned itself an address (see lesson 3).' } },
    stuck: { title: { all: 'Connected to Wi-Fi, no internet' },
      story: { all: 'Lena opens the browser. The phone needs to send the packet to the gateway, but it has no gateway. It also has no DNS to find the site name. Wi-Fi shows as connected, but nothing leaves the local network. It is the classic symptom of a DHCP server being down or the pool being exhausted.' },
      look: { all: 'The light leaves the phone, stops halfway and vanishes: there is nowhere to send it.' },
      key: { all: 'See 169.254.x.x? Look for the problem in the DHCP server, not in the site.' } },
  };

  // dados de cada mensagem (para o painel)
  const M = {
    disc: { n: 'D · DHCPDISCOVER', k: 'broadcast · UDP', f: [['source', '0.0.0.0:68'], ['destination', '255.255.255.255:67'], ['source MAC', MAC], ['destination MAC', 'ff:ff:ff:ff:ff:ff'], ['xid', XID], ['asks for (option 55)', 'mask, gateway, DNS']] },
    offer: { n: 'O · DHCPOFFER', k: 'unicast to Lena\'s MAC', f: [['source', SRV + ':67'], ['destination', IP + ':68'], ['destination MAC', MAC], ['xid', XID], ['your IP (yiaddr)', IP], ['mask', MASK], ['gateway', SRV], ['DNS', SRV], ['lease', '7200 s (2 h)'], ['server (option 54)', SRV]] },
    req: { n: 'R · DHCPREQUEST', k: 'broadcast · UDP', f: [['source', '0.0.0.0:68'], ['destination', '255.255.255.255:67'], ['source MAC', MAC], ['xid', XID], ['requested IP (option 50)', IP], ['chosen server (54)', SRV]] },
    ack: { n: 'A · DHCPACK', k: 'unicast', f: [['source', SRV + ':67'], ['destination', IP + ':68'], ['xid', XID], ['your IP', IP], ['lease', '7200 s'], ['T1 (renew)', '3600 s'], ['T2 (rebind)', '6300 s']] },
    rreq: { n: 'R · DHCPREQUEST (renewal)', k: 'unicast', f: [['source', IP + ':68'], ['destination', SRV + ':67'], ['current IP (ciaddr)', IP], ['xid', XID2]] },
    rack: { n: 'A · DHCPACK', k: 'unicast', f: [['source', SRV + ':67'], ['destination', IP + ':68'], ['xid', XID2], ['lease', '7200 s (until 17:00)']] },
    rel: { n: 'DHCPRELEASE (optional)', k: 'unicast', f: [['source', IP + ':68'], ['destination', SRV + ':67'], ['returned IP', IP], ['MAC', MAC]] },
    arp: { n: 'ARP (probe)', k: 'broadcast', f: [['source MAC', MAC], ['destination MAC', 'ff:ff:ff:ff:ff:ff'], ['sender IP', '0.0.0.0'], ['looking for', LL]] },
  };
  const msgHtml = (m, extra = '') => `<div class="d3-msg"><div class="d3-mh"><b>${m.n}</b><span>${m.k}</span></div><div class="d3-f">${m.f.map(([a, b]) => `<span><small>${a}</small>${b}</span>`).join('')}${extra}</div></div>`;
  const X_EX = '<li class="h3-dim">MAC, xid, times and the pool are examples. At home the lease is usually 24 h (as in the lesson widget); public networks use short leases to reuse addresses.</li>';
  const X_B = '<li>Offer and Ack go in unicast to the phone\'s MAC. If the client asks (broadcast flag), the server answers in broadcast.</li>';
  const DATA = {
    noip: () => `<li>Phone MAC: <b>${MAC}</b> (it is what identifies the phone until it has an IP)</li><li>Server pool: <b>192.168.0.100 to .120</b> (21 addresses); lent out: .100 .101 .102 .103 .104 .108 .113</li>${X_EX}`,
    disc: () => msgHtml(M.disc) + (sc === 'none' ? '<li>No server listens on port 67: the shout is lost.</li>' : '<li>The laptop, the tablet and Bia\'s phone receive it, see it is DHCP for port 67 and discard it: they are not servers.</li>'),
    offer: () => msgHtml(M.offer) + X_B,
    req: () => msgHtml(M.req) + '<li>Still from <b>0.0.0.0</b>: the IP only counts after the ACK.</li>',
    ack: () => msgHtml(M.ack) + '<li>Server table: <b>' + IP + ' → ' + MAC + ' until 16:00</b></li>',
    conf: () => `<table class="h3-sum"><tr><th>Field</th><th>Value</th></tr><tr><td>IP</td><td>${IP}</td></tr><tr><td>Mask</td><td>${MASK} (/24)</td></tr><tr><td>Gateway</td><td>${SRV}</td></tr><tr><td>DNS</td><td>${SRV}</td></tr><tr><td>Lease</td><td>2 h, until 16:00</td></tr></table>`,
    t1: () => '<li><b>T1</b> = 50% of the lease (here 1 h): renews in unicast with the same server.</li><li><b>T2</b> = 87.5% (1 h 45): if the server vanished, asks anyone in broadcast.</li><li>Lease expired without renewal: the phone stops using the IP.</li>',
    rreq: () => msgHtml(M.rreq),
    rack: () => msgHtml(M.rack) + '<li>Server table: <b>' + IP + ' → ' + MAC + ' until 17:00</b></li>',
    leave: () => msgHtml(M.rel) + '<li>Without the RELEASE, .105 goes back to the pool at 17:00, when the lease expires.</li>',
    retry: () => msgHtml({ ...M.disc, f: M.disc.f.slice(0, 3).concat([['secs', '4 · 12 · 28']]) }) + '<li>The intervals double with each attempt, with a bit of randomness (example).</li>',
    apipa: () => `<li>Address: <b>${LL}</b>, mask 255.255.0.0 (range 169.254.0.0/16, link-local)</li><li>Gateway: none · DNS: none</li>${msgHtml(M.arp)}<li>iPhone, Mac and Windows do this. Some Android phones just show "failed to obtain IP address".</li>`,
    stuck: () => `<li>Destination outside the local network: needs a gateway. There is none.</li><li>Site name: needs DNS. There is none.</li><li>Only talks to devices that are also on 169.254.x.x.</li><li>Common causes: DHCP server down or pool exhausted.</li>`,
  };
  const DORA = { disc: 0, offer: 1, req: 2, ack: 3, conf: 4 };
  const doraHtml = () => { if (sc !== 'first' || cur() === 'noip') return '';
    const k = DORA[cur()]; return `<div class="d3-dora">${['Discover', 'Offer', 'Request', 'Ack'].map((w, i) => `<span class="${i < k ? 'done' : i === k ? 'on' : ''}"><b>${w[0]}</b>${w.slice(1)}</span>`).join('')}</div>`; };
  function nowHtml() { const S = phoneState(); return `<li>Phone now: IP <b>${S.ip[0]}</b> · gateway <b>${S.gw[0]}</b> · DNS <b>${S.dns[0]}</b></li>${DATA[cur()]()}`; }
  function panelHtml() {
    const s = STEPS[cur()];
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCNAME[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map(v => `<button data-sc="${v}" aria-pressed="${v === sc}">${SCNAME[v]}</button>`).join('')}</div>
      ${doraHtml()}
      <h2>${pick(s.title)}</h2>
      <p class="o3-story">${pick(s.story)}</p>
      <p class="o3-look"><b>Look at the drawing</b>${pick(s.look)}</p>
      <p class="o3-key"><b>In one sentence</b>${pick(s.key)}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Step data</summary><ul class="h3-now" id="dhcpnow">${nowHtml()}</ul></details>`;
  }
  function readout() { if (active !== 'dhcp') return;
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ip ${phoneState().ip[0]}`; }
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
    [['IP', S.ip], ['Mask', S.mask], ['Gateway', S.gw], ['DNS', S.dns], ['Lease', S.lease]].forEach(([k, [v, tone]], i) => { const y = 26 + i * 15.5;
      x.textAlign = 'left'; x.fillStyle = C.ink; x.font = `${u(3.4)}px ${MONO3}`; x.fillText(k, u(5), u(y));
      if (tone === 'off') { x.textAlign = 'right'; x.fillText('offer?', u(47), u(y)); }
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
    (msg || (small ? 'ok' : 'browsing')).split('\n').forEach((l, i) => x.fillText(l, u(w / 2), u((small ? 26 : 26) + i * (small ? 7 : 8))));
    cv.tex.needsUpdate = true;
  }
  function drawRouter(on, line) {
    const key = on + line + theme; if (keys.get('rt') === key) return; keys.set('rt', key);
    const { x, P } = rtScr, C = pal3(), A_ = '#' + accent.getHexString(), u = v => v * P, acc = theme === 'light' ? C.hi : A_;
    bgFill(x, rtScr); x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = C.inkHi; x.font = `600 ${u(6)}px ${MONO3}`; x.fillText(on ? 'DHCP · ' + SRV : 'DHCP off', u(5), u(9));
    x.fillStyle = line && on ? acc : C.ink; x.font = `${u(5)}px ${MONO3}`; x.fillText(line || (on ? 'waiting for clients' : 'nobody listens on port 67'), u(5), u(21));
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
      const sub = off ? '—' : state === 'lent' ? own : state === 'held' ? 'offer' : state === 'lena' ? 'Lena 16:00' : state === 'lena17' ? 'Lena 17:00' : 'free';
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
      tPh.set(['LENA\'S PHONE', S.status.padEnd(22), row('IP', S.ip), row('mask', S.mask), row('gateway', S.gw), row('DNS', S.dns), row('lease', S.lease)].join('\n'), done ? 'acc' : 'hi').at(80, 175, phone ? 300 : 282); }
    const rtBusy = cardAt(aShown) === 'rta';
    if (rtBusy) tRt.hide(); else tRt.set(none ? 'ROUTER\nDHCP off' : phone ? 'ROUTER · DHCP' : `ROUTER\nDHCP server · ${SRV}`, none ? 'dim' : 'hi').at(308, 66, 126);
    tPl.set(phone ? 'POOL .100 – .120' : 'ADDRESS POOL\n192.168.0.100 – .120', none ? 'dim' : 'hi').at(511, 52, 128);
    if (id === 'conf' && legDone(1)) tNet.set('INTERNET', 'acc').at(308, -60, 232); else tNet.hide();
    // os outros aparelhos: recebem o broadcast e ignoram
    const arrived = bcArrived > 0 && t >= bcArrived;
    const flashK = arrived ? Math.max(0, 1 - (t - bcArrived) / 1.2) : 0;
    DEV.forEach((d, i) => {
      const ign = arrived && (react || (TL.legs.find(l => l.bc && l.quick))), arp = id === 'apipa';
      const msg = ign ? (arp ? 'not me' : 'DHCP? ignore') : '';
      tDev[i].set(ign ? `${d.name.split(' · ')[1]}: ✕ ignores` : phone ? d.name.split(' · ')[1] : d.name, ign ? 'hi' : 'dim').at(d.top[0], d.top[1] + 6, d.top[2] + (d.id === 'davi' ? 34 : 24));
      d.cap.emissiveIntensity = flashK * 0.9;
      drawDev(d, msg.replace(' ', '\n'));
    });
    // roteador
    const rtResp = !none && arrived && react;
    rtCap.emissiveIntensity = none ? 0 : pulse.rt ?? (rtResp ? 0.6 : flashK * 0.9);
    const line = none ? '' : id === 'disc' && arrived ? 'Discover from ' + MAC.slice(9) : id === 'offer' ? 'offering .105' : id === 'req' ? 'Lena picked mine' :
      id === 'ack' || id === 'conf' ? '.105 → Lena until 16:00' : id === 'rack' && legDone(1) ? '.105 → Lena until 17:00' : id === 'leave' && legDone(1) ? '.105 back in the pool' : sc === 'renew' ? '.105 → Lena until 16:00' : '';
    drawRouter(!none, line);
    rtLed.material = none ? ledOffMat : ledOnMat; rtGlow.material.uniforms.intensity.value = none ? 0 : 0.6;
    phCap.emissiveIntensity = pulse.ph ?? (ringR > 0 ? 0.6 : 0);
    // crachá
    const B = badgeNow();
    let bp = null;
    if (B.fly) { const a = BPOS[B.fly.a], b = BPOS[B.fly.b], f = ease(B.fly.f), lift = Math.sin(f * Math.PI) * 60; bp = lerp3(a, b, f); bp[2] += lift; }
    else if (B.pos) bp = BPOS[B.pos];
    if (bp) { bdG.visible = true; bdG.position.copy(W(...bp)); bdMat.emissiveIntensity = 1.1; moveGlow(bdGlow, [bp[0], bp[1] + 3, bp[2]], 0.7);
      const ss = slotState(), txt = B.fly ? IP : ss === 'held' ? `badge ${IP}\nheld (offer)` : ss === 'lena17' ? `badge ${IP}\nuntil 17:00` : `badge ${IP}\nuntil 16:00`;
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 130, -150), dist: innerWidth < 640 ? 10.6 : 13.5 } : { target: W(180, 130, 70), dist: 16 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1 2 3 · drag to rotate' };
})() });
