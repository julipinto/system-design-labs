// Covers for modules in group c: resiliencia ... provas-finais (see covers.js for the shared cover() helper).

// Resiliencia: an electrical panel; four breakers are on, one has tripped.
FIGS.push({
  id: 'resiliencia', name: 'Resiliência', aria: 'Quadro elétrico com um disjuntor desarmado.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [320, 0, 0], [0, 240, 0], [320, 240, 0], [60, 40, 200]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 320, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="300" height="220" rx="10"/></g>`;
    s += box(40, 40, 10, 250, 60, 190, 8);
    s += `<g transform="${SIDE(290, 100, 200)}">${api.iso.slits(16, 54, 6, 14, 150)}</g>`;
    let f = `<rect class="face recess" x="12" y="12" width="226" height="166" rx="6"/>`;
    f += `<rect class="halo hot" filter="url(#bloom)" x="0" y="20" width="250" height="110" rx="30"/>`;
    for (let i = 0; i < 5; i++) {
      const x = 22 + i * 42, tripped = i === 2;
      f += `<rect class="face" x="${x}" y="30" width="32" height="84" rx="4"/>`;
      f += `<rect class="${tripped ? 'face recess' : 'lit'}" ${tripped ? '' : 'filter="url(#glow)"'} x="${x + 4}" y="${tripped ? 74 : 36}" width="24" height="34" rx="3"/>`;
      f += `<circle class="led ${tripped ? '' : 'hot'}" cx="${x + 16}" cy="130" r="3.5"/>`;
      f += `<rect class="detail" x="${x}" y="144" width="32" height="22" rx="3"/>`;
    }
    s += `<g transform="${FRONT(40, 100, 200)}">${f}</g>`;
    // Spark above the tripped breaker.
    s += `<g transform="${FRONT(40, 100, 200)}"><circle class="lit" filter="url(#glow)" cx="${22 + 84 + 16}" cy="22" r="6"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
    return {};
  },
});

// Deployment: two racks side by side, a switch between them points at the live one.
FIGS.push({
  id: 'deployment', name: 'Deployment', aria: 'Dois racks alternados por uma chave.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [340, 0, 0], [0, 240, 0], [340, 240, 0], [30, 40, 190]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 340, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="320" height="220" rx="10"/></g>`;
    const rack = (x, on) => {
      let r = box(x, 40, 10, 110, 100, 180, 8);
      let f = '';
      for (let i = 0; i < 6; i++) {
        f += `<rect class="face recess" x="10" y="${12 + i * 28}" width="90" height="22" rx="3"/>`;
        f += `<rect class="${on ? 'lit' : 'face'}" ${on ? 'filter="url(#glow)"' : ''} x="16" y="${17 + i * 28}" width="50" height="12" rx="2"/>`;
        f += `<circle class="led ${on ? 'hot' : ''}" cx="84" cy="${23 + i * 28}" r="3"/>`;
      }
      r += `<g transform="${FRONT(x, 140, 190)}">${on ? `<rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="110" height="180" rx="30"/>` : ''}${f}</g>`;
      r += `<g transform="${TOP(x, 40, 190)}">${api.iso.slits(10, 100, 5, 10, 90)}</g>`;
      return r;
    };
    s += rack(30, false) + rack(200, true);
    // Floor wires run in clean lines from the switch to the base of each rack.
    s += `<path class="wire" d="M${P(135, 180, 11)} L${P(85, 180, 11)} L${P(85, 142, 11)}"/>`;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(205, 180, 11)} L${P(255, 180, 11)} L${P(255, 142, 11)}"/>`;
    // Switch in front with a lit knob.
    s += box(135, 160, 10, 70, 40, 50, 6);
    s += `<g transform="${FRONT(135, 200, 60)}"><rect class="face recess" x="8" y="8" width="54" height="34" rx="4"/><rect class="lit" filter="url(#glow)" x="34" y="14" width="22" height="22" rx="3"/><circle class="led" cx="14" cy="25" r="3"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
    return {};
  },
});

// Capacity planning: five columns of growing load in a row; a lit limit line runs across their
// front faces, and only the parts of the columns above the limit are lit.
FIGS.push({
  id: 'capacity-planning', name: 'Capacity Planning', aria: 'Cinco colunas crescendo; a última passa da linha de limite acesa.',
  mount(stage, api) {
    const W = 380, D = 200, CW = 46, CD = 60, Y = 80, Z0 = 10, L = 92;
    const H = [44, 68, 100, 132, 176], X = (i) => 34 + i * 64;
    const K = api.iso.frame([[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [X(4), Y, Z0 + H[4]]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, W, D, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="${W - 20}" height="${D - 20}" rx="10"/></g>`;
    H.forEach((h, i) => {
      const x = X(i), over = h > L;
      s += box(x, Y, Z0, CW, CD, h, 4);
      s += `<g transform="${SIDE(x + CW, Y + CD, Z0 + h)}">${api.iso.slits(8, CD - 8, 8, 8, h - 8)}</g>`;
      if (over) {
        const up = h - L;                                              // height above the limit
        s += `<g transform="${FRONT(x, Y + CD, Z0 + h)}"><rect class="halo hot" filter="url(#bloom)" x="-10" y="-10" width="${CW + 20}" height="${up + 20}" rx="14"/><rect class="lit" filter="url(#glow)" x="5" y="5" width="${CW - 10}" height="${up - 8}" rx="3"/></g>`;
        s += `<g transform="${SIDE(x + CW, Y + CD, Z0 + h)}"><rect class="lit" opacity=".75" x="5" y="5" width="${CD - 10}" height="${up - 8}" rx="3"/></g>`;
        s += `<g transform="${TOP(x, Y, Z0 + h)}"><rect class="glass hot" x="5" y="5" width="${CW - 10}" height="${CD - 10}" rx="3"/></g>`;
      }
    });
    // Limit line across the front faces, from just before the first column to just past the last.
    s += `<path class="wire hot" style="stroke-width:5" filter="url(#glow)" d="M${P(X(0) - 6, Y + CD, Z0 + L)} L${P(X(4) + CW + 10, Y + CD, Z0 + L)}"/>`;
    stage.setAttribute('viewBox', cover(K, 0.0)); stage.innerHTML = s;
    return {};
  },
});

// Load testing: a machine on the left pushes lit packets through a pipe.
FIGS.push({
  id: 'testes-de-carga', name: 'Testes de Carga', aria: 'Máquina empurrando pacotes por um cano.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [380, 0, 0], [0, 240, 0], [380, 240, 0], [20, 60, 150]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 380, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="360" height="220" rx="10"/></g>`;
    // Machine first (furthest back), then the pipe, then the receiver.
    s += box(20, 60, 10, 100, 110, 140, 8);
    s += `<g transform="${FRONT(20, 170, 150)}"><rect class="face recess" x="10" y="10" width="80" height="110" rx="5"/><rect class="lit" filter="url(#glow)" x="20" y="20" width="60" height="30" rx="3"/><circle class="led hot" cx="30" cy="76" r="4"/><circle class="led hot" cx="50" cy="76" r="4"/><circle class="led" cx="70" cy="76" r="4"/><rect class="detail" x="20" y="94" width="60" height="14" rx="2"/></g>`;
    s += `<g transform="${SIDE(120, 170, 150)}">${api.iso.slits(10, 90, 6, 10, 120)}</g>`;
    s += box(120, 90, 30, 200, 50, 50, 10);
    s += `<g transform="${TOP(120, 90, 80)}"><rect class="face recess" x="10" y="8" width="180" height="34" rx="10"/></g>`;
    for (let i = 0; i < 3; i++) s += `<g transform="${TOP(140 + i * 58, 98, 80)}"><rect class="lit" filter="url(#glow)" x="0" y="0" width="30" height="34" rx="4"/><rect class="glass hot" x="6" y="6" width="18" height="22" rx="3"/></g>`;
    s += `<g transform="${TOP(120, 90, 80)}"><rect class="halo hot" filter="url(#bloom)" x="0" y="-8" width="200" height="66" rx="30"/></g>`;
    s += `<g transform="${FRONT(120, 140, 80)}">${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect class="detail" x="${14 + i * 26}" y="14" width="4" height="26"/>`).join('')}</g>`;
    s += box(320, 70, 10, 50, 90, 80, 6);
    s += `<g transform="${FRONT(320, 160, 90)}"><rect class="face recess" x="8" y="8" width="34" height="64" rx="4"/><circle class="led hot" cx="25" cy="40" r="5"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// Bulkhead: a hull split into compartments; one is flooded (lit), the others stay dry.
FIGS.push({
  id: 'bulkhead', name: 'Bulkhead', aria: 'Casco com compartimentos, um alagado.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [360, 0, 0], [0, 240, 0], [360, 240, 0], [30, 30, 120]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 360, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="340" height="220" rx="10"/></g>`;
    // Open-top hull: 4 compartments along x; back and left walls first, low front wall last so the inside shows.
    const x0 = 30, y0 = 40, W = 300, D = 140, H = 64, n = 4, cw = W / n, FLOOD = 2;
    s += box(x0, y0, 10, W, 10, H, 4);
    s += box(x0, y0 + 10, 10, 8, D - 20, H, 2);
    for (let i = 0; i < n; i++) {
      const cx = x0 + i * cw, f = i === FLOOD;
      s += `<g transform="${TOP(cx, y0 + 10, 20)}"><rect class="face recess" x="8" y="4" width="${cw - 16}" height="${D - 24}" rx="4"/></g>`;
      if (f) {
        s += `<g transform="${TOP(cx, y0 + 10, 46)}"><rect class="halo hot" filter="url(#bloom)" x="-10" y="-6" width="${cw + 20}" height="${D - 8}" rx="30"/><rect class="lit" filter="url(#glow)" x="8" y="4" width="${cw - 16}" height="${D - 24}" rx="4"/><rect class="glass hot" x="22" y="30" width="${cw - 44}" height="40" rx="6"/></g>`;
      }
      if (i < n - 1) s += box(cx + cw - 4, y0 + 10, 10, 8, D - 10, H, 2);
    }
    s += box(x0 + W - 8, y0 + 10, 10, 8, D - 20, H, 2);
    s += box(x0, y0 + D - 10, 10, W, 10, 40, 4);
    s += `<g transform="${FRONT(x0, y0 + D, 50)}">${[0, 1, 2, 3].map(i => `<circle class="${i === FLOOD ? 'lit' : 'led'}" ${i === FLOOD ? 'filter="url(#glow)"' : ''} cx="${cw / 2 + i * cw}" cy="20" r="8"/>`).join('')}</g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// Cell-based: four independent cells, each with its own core; no wires between them.
FIGS.push({
  id: 'cell-based', name: 'Cell-based', aria: 'Quatro células independentes.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [340, 0, 0], [0, 300, 0], [340, 300, 0], [40, 40, 120]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 340, 300, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="320" height="280" rx="10"/></g>`;
    const cells = [{ x: 30, y: 30 }, { x: 190, y: 30 }, { x: 30, y: 170 }, { x: 190, y: 170 }];
    cells.sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const c of cells) {
      s += `<g transform="${TOP(c.x - 8, c.y - 8, 10)}"><rect class="detail" x="0" y="0" width="136" height="136" rx="10"/></g>`;
      s += box(c.x, c.y, 10, 120, 120, 56, 8);
      s += `<g transform="${TOP(c.x, c.y, 66)}"><rect class="face recess" x="12" y="12" width="96" height="96" rx="6"/><rect class="halo hot" filter="url(#bloom)" x="-10" y="-10" width="140" height="140" rx="40"/><rect class="lit" filter="url(#glow)" x="30" y="30" width="60" height="60" rx="6"/><rect class="glass hot" x="40" y="40" width="40" height="40" rx="4"/></g>`;
      s += `<g transform="${FRONT(c.x, c.y + 120, 66)}">${[0, 1, 2].map(i => `<circle class="led hot" cx="${24 + i * 18}" cy="40" r="3.5"/>`).join('')}</g>`;
      s += `<g transform="${SIDE(c.x + 120, c.y + 120, 66)}">${api.iso.slits(14, 106, 4, 10, 44)}</g>`;
    }
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// Disaster recovery: two separate region plates; left servers are dark (one failed), right ones are lit; a lit chevron strip fails over across the gap.
FIGS.push({
  id: 'disaster-recovery', name: 'Disaster Recovery', aria: 'Duas regiões separadas; a da esquerda apagada com um X, a da direita acesa, e setas de failover entre elas.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [470, 0, 0], [0, 190, 0], [470, 190, 0], [20, 40, 120]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    const SW = 46, SD = 60, SH = 70;
    const region = (x0, on) => {
      let r = box(x0, 0, 0, 170, 190, 10, 12);
      r += `<g transform="${TOP(x0, 0, 10)}"><rect class="detail" x="8" y="8" width="154" height="174" rx="8"/></g>`;
      if (on) r += `<g transform="${TOP(x0, 0, 10)}"><rect class="halo hot" filter="url(#bloom)" x="-10" y="20" width="190" height="150" rx="50"/></g>`;
      [0, 1, 2].forEach(i => {
        const x = x0 + 14 + i * 52, y = 50 + (2 - i) * 0;
        r += box(x, y, 10, SW, SD, SH, 6);
        const cross = !on && i === 1;
        r += `<g transform="${FRONT(x, y + SD, 10 + SH)}"><rect class="face recess" x="5" y="6" width="${SW - 10}" height="40" rx="3"/>`;
        if (on) r += `<rect class="lit" filter="url(#glow)" x="8" y="9" width="${SW - 16}" height="34" rx="2"/>`;
        if (cross) r += `<path class="wire hot" filter="url(#glow)" d="M${SW / 2 - 8} 18 L${SW / 2 + 8} 34 M${SW / 2 + 8} 18 L${SW / 2 - 8} 34"/>`;
        r += `<circle class="led ${on ? 'hot' : ''}" cx="${SW / 2}" cy="56" r="3.5"/></g>`;
        r += `<g transform="${SIDE(x + SW, y + SD, 10 + SH)}">${api.iso.slits(8, SD - 8, 5, 10, 50)}</g>`;
      });
      return r;
    };
    let s = region(0, false);
    // Failover strip across the gap.
    s += box(176, 62, 0, 118, 56, 6, 4);
    s += `<g transform="${TOP(176, 62, 6)}"><rect class="face recess" x="0" y="0" width="118" height="56" rx="4"/>`;
    s += `<rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="118" height="56" rx="20"/>`;
    [0, 1, 2].forEach(i => { const x = 14 + i * 32; s += `<path class="lit" filter="url(#glow)" d="M${x} 6 L${x + 16} 6 L${x + 30} 28 L${x + 16} 50 L${x} 50 L${x + 14} 28 Z"/>`; });
    s += `</g>`;
    s += region(300, true);
    stage.setAttribute('viewBox', cover(K, -0.02)); stage.innerHTML = s;
    return {};
  },
});

// Observabilidade: a panel with three screens (metric bars, log lines, trace spans), shapes only.
FIGS.push({
  id: 'observabilidade', name: 'Observabilidade', aria: 'Painel com três telas: métrica, log e trace.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [360, 0, 0], [0, 200, 0], [360, 200, 0], [40, 40, 225], [320, 40, 225]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 360, 200, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="340" height="180" rx="10"/></g>`;
    s += box(40, 40, 10, 280, 40, 40, 8);
    s += box(40, 40, 50, 280, 20, 160, 8);
    let f = `<rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="280" height="160" rx="30"/>`;
    const sc = i => 10 + i * 90;
    for (let i = 0; i < 3; i++) f += `<rect class="face recess" x="${sc(i)}" y="12" width="82" height="130" rx="5"/><rect class="glass hot" x="${sc(i) + 6}" y="18" width="70" height="118" rx="3"/>`;
    // Screen 1: bars.
    [50, 80, 40, 100, 66].forEach((h, k) => { f += `<rect class="lit" filter="url(#glow)" x="${sc(0) + 12 + k * 13}" y="${130 - h}" width="9" height="${h}" rx="1.5"/>`; });
    // Screen 2: log lines.
    for (let k = 0; k < 8; k++) f += `<rect class="${k % 3 === 2 ? 'lit' : 'detail'}" ${k % 3 === 2 ? 'filter="url(#glow)"' : ''} x="${sc(1) + 12}" y="${28 + k * 14}" width="${58 - (k * 7) % 24}" height="5" rx="1.5"/>`;
    // Screen 3: trace waterfall.
    [[0, 56], [8, 40], [14, 34], [22, 28], [30, 20], [20, 30]].forEach(([o, w], k) => { f += `<rect class="lit" filter="url(#glow)" x="${sc(2) + 12 + o}" y="${30 + k * 17}" width="${w}" height="8" rx="2"/>`; });
    s += `<g transform="${FRONT(40, 60, 210)}">${f}</g>`;
    s += `<g transform="${FRONT(40, 80, 50)}">${[0, 1, 2].map(i => `<circle class="led hot" cx="${50 + i * 90}" cy="20" r="4"/>`).join('')}</g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// Provas finais: the whole store as a miniature: shop (hero), warehouse behind, server rack, delivery van, joined by lit ground wires.
FIGS.push({
  id: 'provas-finais', name: 'Provas Finais', aria: 'A loja inteira em miniatura: loja, armazém, rack de servidores e van de entrega ligados por fios acesos.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [380, 0, 0], [0, 290, 0], [380, 290, 0], [120, 100, 140]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 380, 290, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="360" height="270" rx="10"/></g>`;
    // Lit wires on the ground, drawn first so every building sits on top.
    const W = (pts) => `<path class="wire hot" style="stroke-width:3.5" filter="url(#soft)" d="M${pts.map(q => P(q[0], q[1], 10)).join(' L')}"/>`;
    s += W([[90, 70], [90, 150], [150, 150]]) + W([[290, 150], [310, 150]]) + W([[200, 175], [200, 208], [335, 208], [335, 160]]);
    // Warehouse behind.
    s += box(10, 14, 10, 160, 56, 70, 8);
    s += `<g transform="${TOP(10, 14, 80)}">${api.iso.slits(12, 136, 5, 12, 32)}</g>`;
    s += `<g transform="${FRONT(10, 70, 80)}"><rect class="face recess" x="12" y="12" width="136" height="56" rx="3"/>${[0, 1, 2].map(i => `<rect class="face" x="${20 + i * 42}" y="18" width="34" height="50" rx="2"/>`).join('')}</g>`;
    // Shop (hero) with a lit window and awning.
    const sx = 150, sy = 100, sw = 140, sd = 75, sh = 120;
    s += box(sx, sy, 10, sw, sd, sh, 8);
    s += `<g transform="${FRONT(sx, sy + sd, 10 + sh)}"><rect class="halo hot" filter="url(#bloom)" x="0" y="26" width="${sw}" height="80" rx="30"/>` +
      `<rect class="face recess" x="10" y="40" width="${sw - 20}" height="66" rx="4"/><rect class="lit" filter="url(#glow)" x="16" y="46" width="78" height="54" rx="3"/>` +
      `<rect class="face" x="100" y="46" width="30" height="64" rx="3"/><rect class="lit" filter="url(#glow)" x="0" y="8" width="${sw}" height="14" rx="3"/></g>`;
    s += `<g transform="${SIDE(sx + sw, sy + sd, 10 + sh)}">${api.iso.slits(10, sd - 10, 6, 40, 100)}</g>`;
    // Server rack beside it with lit blades.
    const rx = 310, ry = 105, rw = 54, rd = 54, rh = 110;
    s += box(rx, ry, 10, rw, rd, rh, 6);
    let f = '';
    for (let i = 0; i < 5; i++) f += `<rect class="lit" filter="url(#glow)" x="6" y="${8 + i * 18}" width="${rw - 12}" height="11" rx="2"/>`;
    s += `<g transform="${FRONT(rx, ry + rd, 10 + rh)}">${f}</g>`;
    // Delivery van in front-left, facing +x: box body, lower cab, wheels and windows on its long side.
    const vx = 30, vy = 214, vb = 120, vc = 50, vd = 56;
    s += box(vx, vy, 10, vb, vd, 62, 6);
    s += box(vx + vb, vy, 10, vc, vd, 42, 6);
    s += `<g transform="${FRONT(vx, vy + vd, 72)}"><rect class="lit" filter="url(#glow)" x="10" y="14" width="${vb - 20}" height="8" rx="2"/>` +
      `<circle class="face recess" cx="28" cy="58" r="11"/><circle class="face recess" cx="${vb + 20}" cy="58" r="11"/></g>`;
    s += `<g transform="${FRONT(vx + vb, vy + vd, 52)}"><rect class="glass hot" x="8" y="6" width="${vc - 16}" height="14" rx="2"/></g>`;
    s += `<g transform="${SIDE(vx + vb + vc, vy + vd, 52)}"><rect class="halo hot" filter="url(#bloom)" x="-8" y="10" width="${vd + 16}" height="30" rx="12"/>` +
      `<rect class="glass hot" x="8" y="4" width="${vd - 16}" height="12" rx="2"/><rect class="lit" filter="url(#glow)" x="4" y="24" width="12" height="9" rx="2"/><rect class="lit" filter="url(#glow)" x="${vd - 16}" y="24" width="12" height="9" rx="2"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.0)); stage.innerHTML = s;
    return {};
  },
});
