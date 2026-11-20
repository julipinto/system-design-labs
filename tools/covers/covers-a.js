// Covers, batch A: databases, cache, microsservicos, load-balancers, api-gateways, bff, service-mesh, concorrencia, comunicacao-sincrona.

// Ground plate shared by this batch (same look as covers.js).
function plateA(K, w, d) {
  const { TOP, box } = K;
  return box(0, 0, 0, w, d, 10, 16) + `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="${w - 20}" height="${d - 20}" rx="10"/></g>`;
}

// Frame: plate corners plus the top corners of the tallest bounding box, so nothing is cropped.
function frameA(api, W, D, [x0, y0, x1, y1], zmax) {
  return api.iso.frame([[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [x0, y0, zmax], [x1, y0, zmax], [x0, y1, zmax], [x1, y1, zmax]]);
}

// 4 · Databases: a filing cabinet with the middle drawer open and one index card lit.
FIGS.push({
  id: 'databases', name: 'Databases', aria: 'Arquivo com uma gaveta aberta e uma ficha acesa.',
  mount(stage, api) {
    const K = frameA(api, 320, 260, [60, 40, 200, 230], 160);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 320, 260);
    s += box(60, 40, 10, 140, 100, 150, 8);
    s += `<g transform="${TOP(60, 40, 160)}">${api.iso.slits(20, 120, 8, 20, 80)}</g>`;
    let f = `<rect class="face recess" x="8" y="8" width="124" height="40" rx="3"/><rect class="detail" x="46" y="24" width="48" height="8" rx="3"/>`;
    f += `<rect class="face recess" x="8" y="56" width="124" height="46" rx="3"/>`;
    f += `<rect class="face recess" x="8" y="110" width="124" height="34" rx="3"/><rect class="detail" x="46" y="123" width="48" height="8" rx="3"/>`;
    s += `<g transform="${FRONT(60, 140, 160)}">${f}</g>`;
    // Open drawer: a tray pulled out toward the viewer, with a row of cards.
    s += box(68, 140, 62, 124, 90, 36, 6);
    s += `<g transform="${FRONT(68, 230, 98)}"><rect class="detail" x="38" y="12" width="48" height="8" rx="3"/></g>`;
    for (let i = 0; i < 3; i++) s += box(76, 150 + i * 14, 98, 108, 4, 30, 2);
    s += box(76, 192, 98, 108, 4, 46, 2);
    s += `<g transform="${FRONT(76, 196, 144)}"><rect class="halo hot" filter="url(#bloom)" x="-14" y="-10" width="136" height="66" rx="20"/><rect class="lit" filter="url(#glow)" x="6" y="6" width="96" height="34" rx="3"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
    return {};
  },
});

// 5 · Cache: a small lit counter in front of a big warehouse, linked by a wire.
FIGS.push({
  id: 'cache', name: 'Cache', aria: 'Um balcão pequeno aceso ao lado de um armazém grande.',
  mount(stage, api) {
    const K = frameA(api, 340, 260, [24, 14, 320, 210], 112);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateA(K, 340, 260);
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(250, 190, 10)} L${P(130, 190, 10)} L${P(130, 166, 10)}"/>`;
    s += box(30, 20, 10, 200, 140, 90, 8);
    s += box(24, 14, 100, 212, 152, 10, 6);
    s += `<g transform="${TOP(24, 14, 110)}">${api.iso.slits(20, 190, 8, 18, 130)}</g>`;
    let d = `<rect class="face recess" x="50" y="14" width="100" height="76" rx="4"/>`;
    for (let k = 0; k < 4; k++) d += `<rect class="detail" x="56" y="${22 + k * 16}" width="88" height="8" rx="2"/>`;
    s += `<g transform="${FRONT(30, 160, 100)}">${d}</g>`;
    s += `<g transform="${SIDE(230, 160, 100)}">${api.iso.slits(14, 124, 6, 12, 70)}</g>`;
    // The counter: small, lit, with an awning slab.
    s += box(250, 150, 10, 70, 60, 50, 6);
    s += `<g transform="${FRONT(250, 210, 60)}"><rect class="halo hot" filter="url(#bloom)" x="-10" y="-10" width="90" height="70" rx="20"/><rect class="lit" filter="url(#glow)" x="8" y="8" width="54" height="34" rx="3"/></g>`;
    s += `<g transform="${TOP(250, 150, 60)}"><rect class="glass hot" x="8" y="8" width="54" height="44" rx="3"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
    return {};
  },
});

// 6 · Microsservicos: a big block split into four blocks linked by wires.
FIGS.push({
  id: 'microsservicos', name: 'Microsservicos', aria: 'Um bloco grande dividido em quatro blocos ligados por fios.',
  mount(stage, api) {
    const K = frameA(api, 270, 270, [25, 25, 245, 245], 80);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 270, 270);
    // Faint footprint of the original monolith.
    s += `<g transform="${TOP(25, 25, 10)}"><rect class="detail" x="0" y="0" width="220" height="220" rx="8"/></g>`;
    const W = (a, b, c, d) => `<path class="wire hot" filter="url(#soft)" d="M${P(a, b, 10)} L${P(c, d, 10)}"/>`;
    s += W(95, 60, 175, 60) + W(95, 210, 175, 210) + W(60, 95, 60, 175) + W(210, 95, 210, 175) + W(95, 95, 175, 175);
    const B = [{ x: 25, y: 25, h: 50 }, { x: 175, y: 25, h: 70 }, { x: 25, y: 175, h: 60 }, { x: 175, y: 175, h: 45 }];
    for (const b of B.sort((p, q) => p.x + p.y - (q.x + q.y))) {
      const z = 10 + b.h;
      s += box(b.x, b.y, 10, 70, 70, b.h, 6);
      let f = '';
      for (let k = 0; k < 2; k++) f += `<rect class="lit" filter="url(#glow)" x="10" y="${8 + k * 15}" width="50" height="9" rx="2"/>`;
      s += `<g transform="${FRONT(b.x, b.y + 70, z)}"><rect class="halo hot" filter="url(#bloom)" x="-6" y="-4" width="82" height="44" rx="16"/>${f}</g>`;
      s += `<g transform="${TOP(b.x, b.y, z)}"><rect class="glass hot" x="10" y="10" width="50" height="50" rx="4"/></g>`;
    }
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
    return {};
  },
});

// 7 · Load balancers: one wire in, a box, three wires out to three servers.
FIGS.push({
  id: 'load-balancers', name: 'Load Balancers', aria: 'Uma caixa com um fio de entrada e três de saída para três servidores.',
  mount(stage, api) {
    const K = frameA(api, 300, 270, [15, 20, 280, 250], 100);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 300, 270);
    const ys = [20, 105, 190];
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(0, 135, 10)} L${P(15, 135, 10)}"/>`;
    for (const y of ys) s += `<path class="wire hot" filter="url(#soft)" d="M${P(85, 135, 10)} C${P(150, 135, 10)} ${P(150, y + 30, 10)} ${P(215, y + 30, 10)}"/>`;
    s += box(15, 100, 10, 70, 70, 56, 8);
    s += `<g transform="${FRONT(15, 170, 66)}"><rect class="halo hot" filter="url(#bloom)" x="-8" y="-8" width="86" height="72" rx="20"/><rect class="lit" filter="url(#glow)" x="10" y="10" width="50" height="30" rx="3"/><circle class="led hot" cx="35" cy="48" r="3"/></g>`;
    s += `<g transform="${TOP(15, 100, 66)}"><rect class="glass hot" x="10" y="10" width="50" height="50" rx="4"/></g>`;
    for (const [i, y] of ys.entries()) {
      s += box(215, y, 10, 70, 60, 55, 6);
      let f = '';
      for (let k = 0; k < 3; k++) f += `<rect class="${k < 2 || i === 1 ? 'lit' : 'face recess'}" ${k < 2 || i === 1 ? 'filter="url(#glow)"' : ''} x="10" y="${8 + k * 14}" width="50" height="8" rx="2"/>`;
      s += `<g transform="${FRONT(215, y + 60, 65)}">${f}</g>`;
      s += `<g transform="${TOP(215, y, 65)}"><circle class="lit" filter="url(#glow)" cx="35" cy="30" r="8"/></g>`;
    }
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 8 · API gateways: a big gate arch (thick posts, thin lintel with a lit bar) centred on a lit lane; requests queue in front, the lane fans out to three services behind and to the sides.
FIGS.push({
  id: 'api-gateways', name: 'API Gateways', aria: 'Um grande portal sobre uma pista acesa; pedidos na fila na frente e três serviços atrás.',
  mount(stage, api) {
    const K = frameA(api, 340, 350, [20, 8, 320, 330], 150);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 340, 350);
    const LX = 170, AY = 205;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(LX, 340, 10)} L${P(LX, AY, 10)}"/>`;
    for (const x of [45, 170, 295]) s += `<path class="wire hot" filter="url(#soft)" d="M${P(LX, AY, 10)} C${P(LX, 130, 10)} ${P(x, 130, 10)} ${P(x, 70, 10)}"/>`;
    for (const x of [45, 170, 295]) {
      s += box(x - 35, 8, 10, 70, 56, 40, 6);
      s += `<g transform="${FRONT(x - 35, 64, 50)}"><rect class="lit" filter="url(#glow)" x="8" y="7" width="54" height="26" rx="3"/></g>`;
    }
    // Arch: thick tall posts, thin lintel carrying a solid lit bar.
    for (const x of [98, 194]) {
      s += box(x, AY, 10, 48, 38, 116, 8);
      s += `<g transform="${FRONT(x, AY + 38, 126)}"><rect class="detail" x="10" y="12" width="28" height="90" rx="3"/></g>`;
    }
    s += box(90, AY - 2, 126, 160, 42, 22, 6);
    s += `<g transform="${FRONT(90, AY + 40, 148)}"><rect class="halo hot" filter="url(#bloom)" x="-8" y="-8" width="176" height="38" rx="14"/><rect class="lit" filter="url(#glow)" x="8" y="4" width="144" height="14" rx="3"/></g>`;
    [262, 292, 322].forEach(y => {
      s += `<g filter="url(#glow)">${box(LX - 17, y, 10, 34, 24, 22, 3)}</g>`;
      s += `<g transform="${FRONT(LX - 17, y + 24, 32)}"><rect class="lit" filter="url(#glow)" x="4" y="4" width="26" height="14" rx="2"/></g><g transform="${TOP(LX - 17, y, 32)}"><rect class="glass hot" x="3" y="3" width="28" height="18" rx="2"/></g>`;
    });
    stage.setAttribute('viewBox', cover(K, -0.03)); stage.innerHTML = s;
    return {};
  },
});

// 9 · BFF: a phone and a laptop, each with its own small box behind it.
FIGS.push({
  id: 'bff', name: 'BFF', aria: 'Um celular e um notebook, cada um com sua caixa atrás.',
  mount(stage, api) {
    const K = frameA(api, 320, 260, [25, 40, 280, 230], 100);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 320, 260);
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(60, 150, 10)} L${P(60, 100, 10)}"/>`;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(225, 160, 10)} L${P(225, 100, 10)}"/>`;
    const back = (x, on) => {
      let o = box(x, 40, 10, 70, 60, 50, 6);
      o += `<g transform="${FRONT(x, 100, 60)}"><rect class="lit" filter="url(#glow)" x="10" y="8" width="50" height="14" rx="2"/><rect class="face recess" x="10" y="28" width="50" height="10" rx="2"/></g>`;
      o += `<g transform="${TOP(x, 40, 60)}"><circle class="led hot" cx="35" cy="30" r="5"/></g>`;
      return o;
    };
    s += back(25) + back(190);
    // Phone: a thin upright slab with a lit screen.
    s += box(36, 150, 10, 48, 12, 90, 5);
    s += `<g transform="${FRONT(36, 162, 100)}"><rect class="halo hot" filter="url(#bloom)" x="-8" y="-6" width="64" height="106" rx="16"/><rect class="lit" filter="url(#glow)" x="5" y="6" width="38" height="70" rx="3"/><circle class="led" cx="24" cy="84" r="3"/></g>`;
    // Laptop: a screen standing on a keyboard base.
    s += box(170, 160, 10, 110, 6, 90, 3);
    s += `<g transform="${FRONT(170, 166, 100)}"><rect class="halo hot" filter="url(#bloom)" x="-8" y="-6" width="126" height="94" rx="20"/><rect class="lit" filter="url(#glow)" x="8" y="6" width="94" height="64" rx="3"/></g>`;
    s += box(170, 166, 10, 110, 64, 8, 4);
    s += `<g transform="${TOP(170, 166, 18)}">${api.iso.slits(14, 96, 6, 10, 40)}<rect class="detail" x="38" y="46" width="34" height="10" rx="3"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 10 · Service mesh: a 3x2 grid of services, each with a lit sidecar at its front-right; lit wires run sidecar to sidecar on an orthogonal grid, dim wires from the control plane.
FIGS.push({
  id: 'service-mesh', name: 'Service Mesh', aria: 'Seis serviços, cada um com um sidecar aceso, ligados em grade; um plano de controle atrás.',
  mount(stage, api) {
    const K = frameA(api, 330, 320, [15, 10, 315, 280], 46);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 330, 320);
    const XS = [30, 135, 240], YS = [75, 205], BW = 62, BD = 46, SW = 26, SD = 22, H = 34;
    const line = (cls, pts) => `<path class="${cls}" ${cls.includes('hot') ? 'filter="url(#soft)" ' : ''}d="M${pts.map(p => P(...p, 10)).join(' L')}"/>`;
    const ry = YS.map(y => y + BD + SD / 2), gx = [XS[0] + BW + 20, XS[1] + BW + 20];
    // Control plane at the back, dim wires to the top row.
    s += line('wire', [[XS[0] + BW / 2, YS[0]], [XS[0] + BW / 2, 62], [XS[2] + BW / 2, 62]]) + line('wire', [[XS[2] + BW / 2, 62], [XS[2] + BW / 2, YS[0]]]) + line('wire', [[XS[1] + BW / 2, 62], [XS[1] + BW / 2, YS[0]]]);
    s += box(XS[1] - 20, 8, 10, 102, 40, 36, 6);
    s += `<g transform="${FRONT(XS[1] - 20, 48, 46)}"><rect class="face recess" x="10" y="8" width="82" height="20" rx="3"/><circle class="led" cx="20" cy="18" r="3"/></g>`;
    const svc = (x, y) => box(x, y, 10, BW, BD, H, 6)
      + `<g transform="${FRONT(x, y + BD, 10 + H)}"><rect class="face recess" x="8" y="6" width="${BW - 16}" height="16" rx="3"/></g>`
      + `<g transform="${TOP(x, y, 10 + H)}">${api.iso.slits(8, BW - 8, 6, 8, BD - 8)}</g>`;
    const car = (x, y) => { const sx = x + BW - SW; return `<g filter="url(#glow)">${box(sx, y + BD, 10, SW, SD, 26, 4)}</g>`
      + `<g transform="${FRONT(sx, y + BD + SD, 36)}"><rect class="halo hot" filter="url(#bloom)" x="-6" y="-6" width="${SW + 12}" height="30" rx="10"/><rect class="lit" filter="url(#glow)" x="3" y="3" width="${SW - 6}" height="20" rx="2"/></g>`
      + `<g transform="${TOP(sx, y + BD, 36)}"><rect class="glass hot" x="3" y="3" width="${SW - 6}" height="${SD - 6}" rx="2"/></g>`; };
    YS.forEach((y, r) => {
      for (const x of XS) s += svc(x, y);
      s += line('wire hot', [[XS[0] + BW, ry[r]], [XS[2] + BW - SW / 2, ry[r]]]);
      if (r === 0) for (const x of gx) s += line('wire hot', [[x, ry[0]], [x, ry[1]]]);
      for (const x of XS) s += car(x, y);
    });
    stage.setAttribute('viewBox', cover(K, -0.04)); stage.innerHTML = s;
    return {};
  },
});

// 11 · Concorrencia: the last plush cat on a shelf, two wires reaching for it, a lit padlock in front.
FIGS.push({
  id: 'concorrencia', name: 'Concorrencia', aria: 'O último gatinho de pelúcia numa prateleira, dois fios alcançando e um cadeado aceso.',
  mount(stage, api) {
    const K = frameA(api, 320, 250, [30, 60, 280, 190], 140);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 320, 250);
    for (const [x, y] of [[30, 60], [256, 60], [30, 126], [256, 126]].sort((a, b) => a[0] + a[1] - b[0] - b[1])) s += box(x, y, 10, 14, 14, 60, 3);
    s += box(30, 60, 70, 250, 80, 10, 6);
    // The cat: a plush block with ears and a lit face.
    s += box(115, 80, 80, 70, 40, 44, 8);
    s += box(120, 83, 124, 12, 8, 12, 2) + box(168, 83, 124, 12, 8, 12, 2);
    s += `<g transform="${FRONT(115, 120, 124)}"><circle class="led hot" cx="22" cy="16" r="4.5"/><circle class="led hot" cx="48" cy="16" r="4.5"/><rect class="detail" x="29" y="26" width="12" height="5" rx="2.5"/></g>`;
    // Two wires reaching for it from both ends of the shelf.
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(42, 100, 80)} C${P(70, 100, 80)} ${P(90, 100, 80)} ${P(113, 100, 80)}"/>`;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(268, 108, 80)} C${P(240, 108, 80)} ${P(220, 100, 80)} ${P(187, 100, 80)}"/>`;
    // Padlock in front of the shelf.
    s += box(120, 165, 10, 80, 28, 62, 8);
    s += `<g transform="${FRONT(120, 193, 72)}"><rect class="halo hot" filter="url(#bloom)" x="-14" y="-50" width="108" height="118" rx="26"/><path class="wire hot" filter="url(#soft)" d="M22 0 V-24 A18 18 0 0 1 58 -24 V0"/><rect class="lit" filter="url(#glow)" x="8" y="8" width="64" height="46" rx="3"/><rect class="face recess" x="34" y="20" width="12" height="20" rx="4"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 12 · Comunicacao sincrona: two services joined by a wire, with a lit hourglass between them.
FIGS.push({
  id: 'comunicacao-sincrona', name: 'Comunicacao sincrona', aria: 'Dois serviços ligados por um fio, com uma ampulheta no meio.',
  mount(stage, api) {
    const K = frameA(api, 380, 230, [10, 80, 370, 160], 122);
    const { P, TOP, FRONT, box } = K;
    let s = plateA(K, 380, 230);
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(70, 120, 10)} L${P(310, 120, 10)}"/>`;
    const svc = (x, on) => {
      let f = '';
      for (let k = 0; k < 3; k++) f += `<rect class="${on ? 'lit' : 'face recess'}" ${on ? 'filter="url(#glow)"' : ''} x="10" y="${8 + k * 14}" width="40" height="8" rx="2"/>`;
      return box(x, 80, 10, 60, 80, 60, 6)
        + `<g transform="${FRONT(x, 160, 70)}">${on ? '<rect class="halo hot" filter="url(#bloom)" x="-8" y="-6" width="76" height="56" rx="20"/>' : ''}${f}</g>`
        + `<g transform="${TOP(x, 80, 70)}"><rect class="glass ${on ? 'hot' : ''}" x="10" y="10" width="40" height="60" rx="4"/></g>`;
    };
    s += svc(10, true);
    s += box(155, 85, 10, 70, 70, 6, 4);
    s += box(155, 85, 16, 6, 6, 100, 2) + box(219, 85, 16, 6, 6, 100, 2);
    s += `<g transform="${FRONT(155, 120, 116)}"><rect class="halo hot" filter="url(#bloom)" x="-6" y="-4" width="82" height="108" rx="24"/><path class="glass hot" d="M8 4 H62 L41 52 L62 98 H8 L29 52 Z"/><path class="lit" filter="url(#glow)" d="M16 98 H54 L41 68 H29 Z"/><path class="lit" filter="url(#glow)" d="M18 12 H52 L43 30 H27 Z" opacity=".5"/><rect class="lit" filter="url(#glow)" x="33" y="38" width="4" height="30"/></g>`;
    s += box(155, 85, 116, 70, 70, 6, 4);
    s += svc(310, false);
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});
