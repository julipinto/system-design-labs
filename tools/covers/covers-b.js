// Covers, batch b: comunicacao-assincrona, performance, scale-cube, sharding, replicacao, cqrs, saga, event-sourcing.
// Relies on the global cover() helper from covers.js.

// A lit block: glowing body plus a hot glass top.
function litBoxB(K, x, y, z, w, d, h, r = 4) {
  const { TOP, box } = K;
  return `<g filter="url(#glow)">${box(x, y, z, w, d, h, r)}</g><g transform="${TOP(x, y, z + h)}"><rect class="glass hot" x="3" y="3" width="${w - 6}" height="${d - 6}" rx="2"/></g>`;
}
function plateB(K, w, d) {
  const { TOP, box } = K;
  return box(0, 0, 0, w, d, 10, 16) + `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="${w - 20}" height="${d - 20}" rx="10"/></g>`;
}

// 4 · Comunicação Assíncrona: a conveyor belt carrying message boxes, two lit.
FIGS.push({
  id: 'comunicacao-assincrona', name: 'Comunicação Assíncrona', aria: 'Esteira levando caixas de mensagem; duas estão acesas.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [390, 0, 0], [0, 240, 0], [390, 240, 0], [200, 70, 120]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 390, 240);
    s += box(10, 60, 10, 370, 130, 26, 8);
    s += `<g transform="${TOP(10, 60, 36)}"><rect class="face recess" x="8" y="8" width="354" height="114" rx="6"/></g>`;
    // Rollers: end drums plus rolling cross bars on the belt top.
    s += `<g transform="${TOP(10, 60, 36)}">${Array.from({ length: 16 }, (_, i) => `<rect class="detail" x="${34 + i * 21}" y="8" width="3" height="114"/>`).join('')}</g>`;
    s += box(14, 64, 36, 16, 122, 10, 5) + box(350, 64, 36, 16, 122, 10, 5);
    s += `<g transform="${FRONT(10, 190, 36)}">${Array.from({ length: 10 }, (_, i) => `<circle class="face recess" cx="${22 + i * 36}" cy="13" r="8"/><circle class="led ${i % 3 === 0 ? 'hot' : ''}" cx="${22 + i * 36}" cy="13" r="2.6"/>`).join('')}</g>`;
    s += `<g transform="${SIDE(380, 190, 36)}"><rect class="face recess" x="10" y="6" width="114" height="14" rx="3"/></g>`;
    s += `<g transform="${TOP(10, 60, 36)}"><rect class="halo hot" filter="url(#bloom)" x="60" y="-10" width="260" height="150" rx="50"/></g>`;
    // Message boxes riding the belt; 2nd and 4th are live.
    const env = (x, y, z, w, d) => `<g transform="${TOP(x, y, z)}"><path class="detail" d="M5 5 L${w / 2} ${d / 2} L${w - 5} 5"/></g>`;
    [{ x: 40, on: false }, { x: 120, on: true }, { x: 200, on: false }, { x: 280, on: true }].forEach(m => {
      const y = 86, w = 58, d = 54, h = m.on ? 34 : 28;
      s += m.on ? litBoxB(K, m.x, y, 36, w, d, h, 4) : box(m.x, y, 36, w, d, h, 4);
      s += env(m.x, y, 36 + h, w, d);
    });
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 5 · Performance: a dial gauge with a lit needle swung into the upper range.
FIGS.push({
  id: 'performance', name: 'Performance', aria: 'Um manômetro com o ponteiro aceso.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [300, 0, 0], [0, 200, 0], [300, 200, 0], [60, 60, 210]]);
    const { TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 300, 200);
    s += box(60, 60, 10, 190, 80, 200, 12);
    s += `<g transform="${SIDE(250, 140, 210)}">${api.iso.slits(10, 70, 8, 20, 170)}</g>`;
    s += `<g transform="${TOP(60, 60, 210)}"><rect class="face recess" x="10" y="10" width="170" height="60" rx="6"/></g>`;
    const cx = 95, cy = 105, R = 74;
    const pt = (deg, r) => { const a = deg * Math.PI / 180; return [cx + Math.cos(a) * r, cy - Math.sin(a) * r]; };
    let f = `<rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="190" height="200" rx="40"/>`;
    f += `<circle class="face recess" cx="${cx}" cy="${cy}" r="${R + 8}"/><circle class="glass" cx="${cx}" cy="${cy}" r="${R}"/>`;
    for (let i = 0; i <= 10; i++) { const d = 225 - i * 27, a = pt(d, R - 4), b = pt(d, R - (i % 5 === 0 ? 20 : 12)); f += `<path class="${i >= 7 ? 'wire hot' : 'detail'}" d="M${a} L${b}"/>`; }
    // Lit arc over the high range.
    const a0 = pt(225 - 7 * 27, R - 6), a1 = pt(-45, R - 6);
    f += `<path class="wire hot" filter="url(#glow)" d="M${a0} A${R - 6} ${R - 6} 0 0 1 ${a1}"/>`;
    // Needle pointing into the lit range.
    const tip = pt(225 - 8.4 * 27, R - 14), l = pt(225 - 8.4 * 27 + 90, 17), r = pt(225 - 8.4 * 27 - 90, 17);
    f += `<polygon class="lit" filter="url(#glow)" points="${tip} ${l} ${pt(225 - 8.4 * 27 + 180, 22)} ${r}"/>`;
    f += `<circle class="face" cx="${cx}" cy="${cy}" r="11"/><circle class="led hot" cx="${cx}" cy="${cy}" r="4"/>`;
    s += `<g transform="${FRONT(60, 140, 210)}">${f}</g>`;
    stage.setAttribute('viewBox', cover(K, -0.04)); stage.innerHTML = s;
    return {};
  },
});

// 6 · Scale Cube: a 3x3x3 cube of blocks; the three rows meeting at the front corner are lit
// (x: clone, y: split by function, z: split by data), each continuing as a lit axis with a lit tip.
FIGS.push({
  id: 'scale-cube', name: 'Scale Cube', aria: 'Um cubo de 27 blocos; as três fileiras do canto da frente acesas, uma por eixo.',
  mount(stage, api) {
    const N = 3, U = 50, G = 8, O = 70, Z0 = 10, E = N * (U + G) - G;    // cell, gap, origin, cube edge
    const W = O * 2 + E + 40;
    const K = api.iso.frame([[0, 0, 0], [W, 0, 0], [0, W, 0], [W, W, 0], [O, O, Z0 + E + 50]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, W, W);
    const cells = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) for (let k = 0; k < N; k++) cells.push([i, j, k]);
    cells.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]) || a[2] - b[2]);   // iso depth for equal cubes
    const F = N - 1;
    for (const [i, j, k] of cells) {
      const lit = (j === F && k === 0) || (i === F && k === 0) || (i === F && j === F);
      const x = O + i * (U + G), y = O + j * (U + G), z = Z0 + k * (U + G);
      s += box(x, y, z, U, U, U, 3);
      if (lit) {
        s += `<g transform="${FRONT(x, y + U, z + U)}"><rect class="lit" filter="url(#glow)" x="6" y="6" width="${U - 12}" height="${U - 12}" rx="3"/></g>`;
        s += `<g transform="${SIDE(x + U, y + U, z + U)}"><rect class="lit" opacity=".75" x="6" y="6" width="${U - 12}" height="${U - 12}" rx="3"/></g>`;
        s += `<g transform="${TOP(x, y, z + U)}"><rect class="glass hot" x="6" y="6" width="${U - 12}" height="${U - 12}" rx="3"/></g>`;
      } else {
        s += `<g transform="${TOP(x, y, z + U)}"><rect class="face recess" x="8" y="8" width="${U - 16}" height="${U - 16}" rx="2"/></g>`;
      }
    }
    // Axes continue past the cube from the lit rows, each ending in a lit tip.
    const X1 = O + E, Y1 = O + E, ZT = Z0 + E;
    const axis = (a, b) => `<path class="wire hot" filter="url(#soft)" d="M${P(...a)} L${P(...b)}"/><g transform="${TOP(b[0] - 6, b[1] - 6, b[2])}"><circle class="lit" filter="url(#glow)" cx="6" cy="6" r="6"/></g>`;
    s += axis([X1 + 6, Y1 - U / 2, Z0 + U / 2], [X1 + 50, Y1 - U / 2, Z0 + U / 2]);   // x: clones
    s += axis([X1 - U / 2, Y1 + 6, Z0 + U / 2], [X1 - U / 2, Y1 + 50, Z0 + U / 2]);   // y: functions
    s += axis([X1 - U / 2, Y1 - U / 2, ZT + 6], [X1 - U / 2, Y1 - U / 2, ZT + 46]);   // z: data
    stage.setAttribute('viewBox', cover(K, -0.02)); stage.innerHTML = s;
    return {};
  },
});

// 7 · Sharding: a table sliced into four blocks, each with its own rows; two shards are live.
FIGS.push({
  id: 'sharding', name: 'Sharding', aria: 'Uma tabela fatiada em quatro blocos.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [340, 0, 0], [0, 240, 0], [340, 240, 0], [20, 60, 100]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 340, 240);
    const B = [{ x: 22, y: 50, on: true }, { x: 100, y: 78, on: false }, { x: 178, y: 50, on: false }, { x: 256, y: 78, on: true }];
    for (const b of B) {
      s += box(b.x, b.y, 10, 66, 120, 56, 6);
      s += `<g transform="${TOP(b.x, b.y, 66)}">${[0, 1, 2, 3, 4].map(i => `<rect class="${b.on ? 'glass hot' : 'face recess'}" x="8" y="${8 + i * 22}" width="50" height="14" rx="2"/>`).join('')}</g>`;
      if (b.on) s += `<g transform="${TOP(b.x, b.y, 66)}"><rect class="halo hot" filter="url(#bloom)" x="-14" y="-10" width="94" height="140" rx="30"/></g>`;
      s += `<g transform="${FRONT(b.x, b.y + 120, 66)}">${[0, 1, 2].map(i => `<rect class="${b.on ? 'lit' : 'face recess'}" ${b.on ? 'filter="url(#glow)"' : ''} x="8" y="${8 + i * 15}" width="50" height="9" rx="2"/>`).join('')}</g>`;
      s += `<g transform="${SIDE(b.x + 66, b.y + 120, 66)}">${api.iso.slits(8, 112, 6, 10, 46)}</g>`;
    }
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 8 · Replicação: a primary disk and two copies, fed by a lit log tape.
FIGS.push({
  id: 'replicacao', name: 'Replicação', aria: 'Um disco primário e duas cópias ligados por uma fita de log.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [370, 0, 0], [0, 310, 0], [370, 310, 0], [30, 30, 100]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 370, 310);
    const disk = (x, y, w, on) => {
      let o = box(x, y, 10, w, w, 46, 10);
      o += `<g transform="${TOP(x, y, 56)}"><circle class="face recess" cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 8}"/><circle class="${on ? 'glass hot' : 'detail'}" cx="${w / 2}" cy="${w / 2}" r="${w / 2 - 20}"/><circle class="${on ? 'lit' : 'face'}" ${on ? 'filter="url(#glow)"' : ''} cx="${w / 2}" cy="${w / 2}" r="${w / 7}"/></g>`;
      if (on) o += `<g transform="${TOP(x, y, 56)}"><circle class="halo hot" filter="url(#bloom)" cx="${w / 2}" cy="${w / 2}" r="${w / 2 + 14}"/></g>`;
      o += `<g transform="${FRONT(x, y + w, 56)}"><rect class="face recess" x="10" y="14" width="${w - 20}" height="12" rx="3"/><circle class="led ${on ? 'hot' : ''}" cx="${w - 18}" cy="20" r="2.6"/></g>`;
      return o;
    };
    // Log tape: a lit strip with entries, from the primary to each copy.
    const tape = (x, y, len, horiz) => {
      let o = box(x, y, 10, horiz ? len : 30, horiz ? 30 : len, 6, 2);
      for (let i = 0; i < Math.floor((len - 8) / 22); i++) {
        const on = i % 2 === 0;
        o += `<g transform="${TOP(horiz ? x + 6 + i * 22 : x, horiz ? y : y + 6 + i * 22, 16)}"><rect class="${on ? 'lit' : 'glass hot'}" ${on ? 'filter="url(#glow)"' : ''} x="${horiz ? 2 : 3}" y="${horiz ? 3 : 2}" width="${horiz ? 16 : 24}" height="${horiz ? 24 : 16}" rx="1.5"/></g>`;
      }
      return o;
    };
    s += disk(20, 20, 100, true);
    s += tape(120, 55, 140, true);
    s += tape(55, 120, 120, false);
    s += disk(260, 40, 70, false);
    s += disk(25, 240, 70, false);
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 9 · CQRS: a write counter and a read counter, joined through a lit store by wires.
FIGS.push({
  id: 'cqrs', name: 'CQRS', aria: 'Dois balcões, um para escrever e outro para ler.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [350, 0, 0], [0, 250, 0], [350, 250, 0], [200, 30, 130]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 350, 250);
    const wire = pts => `<path class="wire hot" filter="url(#soft)" d="M${pts.map(p => P(...p)).join(' L')}"/>`;
    // Wires first (on the ground), then the objects in front of them.
    s += wire([[75, 100, 10], [75, 185, 10], [140, 185, 10]]) + wire([[210, 185, 10], [275, 185, 10], [275, 100, 10]]);
    // Write counter: slab top with a lit ledger block.
    s += box(20, 30, 10, 110, 70, 50, 6) + box(14, 24, 60, 122, 82, 8, 5);
    s += `<g transform="${FRONT(20, 100, 60)}"><rect class="face recess" x="14" y="12" width="82" height="26" rx="4"/><circle class="led hot" cx="98" cy="45" r="3"/></g>`;
    s += `<g transform="${TOP(14, 24, 68)}"><rect class="halo hot" filter="url(#bloom)" x="-6" y="-6" width="134" height="94" rx="30"/></g>`;
    s += litBoxB(K, 40, 44, 68, 70, 44, 14, 4);
    // Read counter: slab top with three standing display panels.
    s += box(220, 30, 10, 110, 70, 50, 6) + box(214, 24, 60, 122, 82, 8, 5);
    s += `<g transform="${FRONT(220, 100, 60)}"><rect class="face recess" x="14" y="12" width="82" height="26" rx="4"/><circle class="led" cx="98" cy="45" r="3"/></g>`;
    for (let i = 0; i < 3; i++) {
      const x = 226 + i * 34;
      s += box(x, 50, 68, 26, 8, 58, 3);
      s += `<g transform="${FRONT(x, 58, 126)}"><rect class="glass hot" x="3" y="3" width="20" height="46" rx="2"/><rect class="lit" filter="url(#glow)" x="6" y="8" width="14" height="6" rx="1"/><rect class="lit" filter="url(#glow)" x="6" y="20" width="14" height="6" rx="1"/></g>`;
    }
    // Store between them, lit.
    s += litBoxB(K, 140, 160, 10, 70, 50, 40, 6);
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 10 · Saga: four steps on a forward track; step 4 fails (dark, a lit cross on its screen), and the
// compensation runs back along a lit return lane from step 3 to step 1.
FIGS.push({
  id: 'saga', name: 'Saga Pattern', aria: 'Quatro passos em fila; o quarto falha e a compensação volta acesa até o primeiro.',
  mount(stage, api) {
    const W = 400, D = 230, S = 62, Y = 40, XS = [30, 125, 220, 315], LANE = 160;
    const K = api.iso.frame([[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [30, Y, 80]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, W, D);
    const cy = Y + S / 2;
    // Forward track behind the stations: lit up to step 3, cut before step 4.
    const brk = XS[3] - 16;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(XS[0] + S / 2, cy, 10)} L${P(brk - 8, cy, 10)}"/>`;
    s += `<path class="wire" d="M${P(brk + 8, cy, 10)} L${P(XS[3] + S / 2, cy, 10)}"/>`;
    s += `<g transform="${TOP(brk - 7, cy - 7, 10)}"><circle class="lit" filter="url(#glow)" cx="7" cy="7" r="7"/></g>`;
    // Return lane in front, with chevrons pointing back toward step 1.
    s += `<g transform="${TOP(XS[0] + 10, LANE - 14, 10)}"><rect class="face recess" x="0" y="0" width="${XS[2] + S / 2 - XS[0]}" height="28" rx="6"/>`;
    for (let x = 22; x < XS[2] + S / 2 - XS[0] - 14; x += 30)
      s += `<path class="wire hot" filter="url(#soft)" d="M${x + 10} 6 L${x} 14 L${x + 10} 22"/>`;
    s += `</g>`;
    // U-turn from step 3 down to the lane, and from the lane up into step 1.
    const u3 = XS[2] + S / 2, u1 = XS[0] + S / 2;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(u3, Y + S, 10)} L${P(u3, LANE, 10)}"/>`;
    s += `<path class="wire hot" filter="url(#soft)" d="M${P(u1, LANE, 10)} L${P(u1, Y + S, 10)}"/>`;
    // Stations, back to front along x.
    XS.forEach((x, i) => {
      const ok = i < 3;
      s += box(x, Y, 10, S, S, 60, 6);
      s += `<g transform="${FRONT(x, Y + S, 70)}">${ok ? `<rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="${S}" height="60" rx="16"/>` : ''}<rect class="${ok ? 'lit' : 'face recess'}" ${ok ? 'filter="url(#glow)"' : ''} x="10" y="12" width="${S - 20}" height="18" rx="3"/>${ok ? '' : `<path class="wire hot" filter="url(#glow)" d="M${S / 2 - 7} 14 L${S / 2 + 7} 28 M${S / 2 + 7} 14 L${S / 2 - 7} 28"/>`}<circle class="led ${ok ? 'hot' : ''}" cx="${S / 2}" cy="44" r="3.5"/></g>`;
      s += `<g transform="${SIDE(x + S, Y + S, 70)}">${api.iso.slits(8, S - 8, 7, 10, 50)}</g>`;
      s += `<g transform="${TOP(x, Y, 70)}"><rect class="${ok ? 'glass hot' : 'face recess'}" x="8" y="8" width="${S - 16}" height="${S - 16}" rx="4"/></g>`;
    });
    stage.setAttribute('viewBox', cover(K, -0.04)); stage.innerHTML = s;
    return {};
  },
});

// 11 · Event Sourcing: a reel of event tape feeds a block of state.
FIGS.push({
  id: 'event-sourcing', name: 'Event Sourcing', aria: 'Um rolo de fita de eventos que vira um bloco de estado.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [370, 0, 0], [0, 210, 0], [370, 210, 0], [20, 40, 130]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = plateB(K, 370, 210);
    // State block at the back (drawn first so the tape and reel in front are never hidden).
    s += `<g transform="${TOP(20, 40, 14)}"><rect class="halo hot" filter="url(#bloom)" x="-20" y="-20" width="140" height="140" rx="40"/></g>`;
    s += box(20, 40, 10, 100, 100, 110, 8);
    s += `<g transform="${TOP(20, 40, 120)}"><rect class="glass hot" x="8" y="8" width="84" height="84" rx="4"/></g>`;
    s += `<g transform="${FRONT(20, 140, 120)}">${[0, 1, 2, 3, 4].map(i => `<rect class="lit" filter="url(#glow)" x="12" y="${12 + i * 20}" width="76" height="12" rx="2"/>`).join('')}</g>`;
    s += `<g transform="${SIDE(120, 140, 120)}">${api.iso.slits(10, 90, 8, 10, 100)}</g>`;
    // Tape strip of events, dimmer toward the reel.
    s += box(120, 76, 10, 130, 28, 6, 3);
    for (let i = 0; i < 5; i++) {
      const on = i < 4;
      s += `<g transform="${TOP(126 + i * 24, 76, 16)}"><rect class="${on ? 'lit' : 'face recess'}" ${on ? 'filter="url(#glow)"' : ''} x="1" y="3" width="19" height="22" rx="2"/></g>`;
    }
    // Reel with flange rings and spokes.
    s += box(250, 40, 10, 100, 100, 44, 12);
    s += `<g transform="${TOP(250, 40, 54)}"><circle class="face recess" cx="50" cy="50" r="42"/><circle class="detail" cx="50" cy="50" r="30"/><circle class="face" cx="50" cy="50" r="10"/>${[0, 1, 2].map(i => { const a = i * 2.094 + 0.5; return `<path class="detail" d="M${50 + Math.cos(a) * 10} ${50 + Math.sin(a) * 10} L${50 + Math.cos(a) * 42} ${50 + Math.sin(a) * 42}"/>`; }).join('')}<circle class="led hot" cx="50" cy="50" r="4"/></g>`;
    s += `<g transform="${FRONT(250, 140, 54)}"><rect class="face recess" x="12" y="12" width="76" height="12" rx="3"/></g>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});
