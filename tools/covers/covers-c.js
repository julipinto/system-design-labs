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

// Capacity planning: a tank with a limit mark and a lit liquid level close to it.
FIGS.push({
  id: 'capacity-planning', name: 'Capacity Planning', aria: 'Tanque com marca de limite e nível aceso.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [300, 0, 0], [0, 260, 0], [300, 260, 0], [70, 70, 220]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 300, 260, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="280" height="240" rx="10"/></g>`;
    s += box(70, 70, 10, 150, 110, 210, 10);
    s += `<g transform="${SIDE(220, 180, 220)}">${api.iso.slits(12, 98, 7, 14, 190)}</g>`;
    // Front window with the liquid level and the limit mark above it.
    let f = `<rect class="face recess" x="20" y="16" width="110" height="178" rx="8"/>`;
    f += `<rect class="halo hot" filter="url(#bloom)" x="8" y="70" width="134" height="130" rx="30"/>`;
    f += `<rect class="lit" filter="url(#glow)" x="26" y="74" width="98" height="114" rx="5"/>`;
    f += `<rect class="glass hot" x="34" y="82" width="22" height="98" rx="4"/>`;
    f += `<rect class="face" x="8" y="48" width="134" height="6" rx="2"/>`;
    for (let i = 0; i < 5; i++) f += `<rect class="detail" x="${i % 2 ? 20 : 14}" y="${96 + i * 20}" width="${i % 2 ? 12 : 18}" height="2"/>`;
    s += `<g transform="${FRONT(70, 180, 220)}">${f}</g>`;
    // Top hatch and a pipe stub with a lit valve.
    s += `<g transform="${TOP(70, 70, 220)}"><circle class="face recess" cx="75" cy="55" r="22"/><circle class="led hot" cx="75" cy="55" r="6"/></g>`;
    s += box(220, 110, 40, 50, 24, 24, 4);
    s += `<g transform="${FRONT(220, 134, 64)}"><rect class="lit" filter="url(#glow)" x="14" y="6" width="22" height="12" rx="2"/></g>`;
    stage.setAttribute('viewBox', cover(K, 0.02)); stage.innerHTML = s;
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

// Disaster recovery: two regions (plates); the left one is dark, the right one lights up, a wire fails over.
FIGS.push({
  id: 'disaster-recovery', name: 'Disaster Recovery', aria: 'Duas regiões, uma apagada e outra acendendo.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [380, 0, 0], [0, 240, 0], [380, 240, 0], [200, 40, 160]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 380, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="360" height="220" rx="10"/></g>`;
    const region = (x, on) => {
      let r = `<g transform="${TOP(x - 10, 30, 10)}"><rect class="detail" x="0" y="0" width="180" height="170" rx="10"/></g>`;
      r += box(x, 40, 10, 100, 80, 40, 8);
      r += box(x + 10, 120, 10, 80, 40, 30, 6);
      if (on) r += `<g transform="${TOP(x, 40, 50)}"><rect class="halo hot" filter="url(#bloom)" x="-20" y="-20" width="140" height="120" rx="40"/></g>`;
      r += `<g transform="${TOP(x, 40, 50)}"><rect class="${on ? 'lit' : 'face recess'}" ${on ? 'filter="url(#glow)"' : ''} x="12" y="12" width="76" height="56" rx="5"/></g>`;
      r += `<g transform="${FRONT(x, 120, 50)}">${[0, 1, 2].map(i => `<circle class="${on ? 'led hot' : 'led'}" cx="${22 + i * 28}" cy="20" r="3.5"/>`).join('')}</g>`;
      r += `<g transform="${FRONT(x + 10, 160, 40)}"><rect class="face recess" x="10" y="8" width="60" height="16" rx="3"/></g>`;
      return r;
    };
    s += region(30, false) + region(230, true);
    s += `<path class="wire" d="M${P(130, 80, 20)} L${P(165, 80, 20)}"/><path class="wire hot" filter="url(#soft)" d="M${P(180, 80, 20)} L${P(230, 80, 20)}"/>`;
    s += `<g transform="${TOP(166, 74, 20)}"><circle class="lit" filter="url(#glow)" cx="6" cy="6" r="6"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
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

// Provas finais: the whole store as a miniature: shop, warehouse, gateway and a lit cart.
FIGS.push({
  id: 'provas-finais', name: 'Provas Finais', aria: 'A loja inteira em miniatura.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [380, 0, 0], [0, 300, 0], [380, 300, 0], [40, 40, 130]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 380, 300, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="360" height="280" rx="10"/></g>`;
    // Warehouse at the back.
    s += box(40, 30, 10, 170, 90, 90, 8);
    s += `<g transform="${TOP(40, 30, 100)}">${api.iso.slits(14, 156, 6, 16, 76)}</g>`;
    s += `<g transform="${FRONT(40, 120, 100)}"><rect class="face recess" x="14" y="24" width="142" height="60" rx="4"/>${[0, 1, 2].map(i => `<rect class="face" x="${22 + i * 44}" y="32" width="36" height="44" rx="3"/>`).join('')}</g>`;
    // Shop front on the right with a lit sign window.
    s += box(250, 40, 10, 100, 110, 100, 8);
    s += `<g transform="${FRONT(250, 150, 110)}"><rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="100" height="70" rx="26"/><rect class="face recess" x="8" y="8" width="84" height="54" rx="4"/><rect class="lit" filter="url(#glow)" x="14" y="14" width="72" height="30" rx="3"/><rect class="face" x="38" y="46" width="24" height="14" rx="2"/></g>`;
    s += `<g transform="${SIDE(350, 150, 110)}">${api.iso.slits(14, 96, 5, 10, 80)}</g>`;
    // Gateway arch and a lit cart in front.
    s += box(60, 180, 10, 14, 14, 60, 3) + box(150, 180, 10, 14, 14, 60, 3);
    s += box(60, 180, 70, 104, 14, 10, 3);
    s += `<g transform="${FRONT(60, 194, 80)}"><rect class="lit" filter="url(#glow)" x="20" y="2" width="64" height="5" rx="2"/></g>`;
    s += box(200, 200, 14, 80, 56, 26, 6);
    s += `<g transform="${TOP(200, 200, 40)}"><rect class="halo hot" filter="url(#bloom)" x="-10" y="-10" width="100" height="76" rx="30"/><rect class="lit" filter="url(#glow)" x="8" y="8" width="64" height="40" rx="4"/><rect class="glass hot" x="18" y="16" width="44" height="24" rx="3"/></g>`;
    s += `<g transform="${FRONT(200, 256, 40)}"><circle class="led" cx="16" cy="13" r="4"/><circle class="led" cx="64" cy="13" r="4"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});
