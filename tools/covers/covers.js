// Home-page covers: one large iso-glow object per module, rendered to public/labs/<slug>/capa.webp.
// Each cover is a static lit scene (no text: it must read at card size, 8:5).

// Widen the kernel's 4:3 viewBox to the card's 8:5, centred on the object, with a margin.
function cover(K, pad = -0.08) {
  let [x, y, w, h] = K.viewBox.split(/\s+/).map(Number);
  x -= w * pad; y -= h * pad; w *= 1 + 2 * pad; h *= 1 + 2 * pad;
  const R = 1.6;
  if (w / h < R) { const nw = h * R; x -= (nw - w) / 2; w = nw; } else { const nh = w / R; y -= (nh - h) / 2; h = nh; }
  return `${x} ${y} ${w} ${h}`;
}

// 1 · Protocolos de Rede: seven layer trays, one lit, fed by a wire from the router below.
FIGS.push({
  id: 'protocolos-de-rede', name: 'Protocolos de Rede', aria: 'Sete camadas empilhadas sobre um roteador.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [320, 0, 0], [0, 260, 0], [320, 260, 0], [150, 40, 190]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 320, 260, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="300" height="240" rx="10"/></g>`;
    const LIT = 3;
    for (let i = 0; i < 7; i++) {
      const z = 34 + i * 24;
      s += box(150, 30, z, 130, 130, 5, 8);
      s += `<g transform="${TOP(150, 30, z + 5)}"><rect class="${i === LIT ? 'lit' : 'face recess'}" ${i === LIT ? 'filter="url(#glow)" opacity=".9"' : ''} x="10" y="10" width="110" height="110" rx="6"/></g>`;
      if (i === LIT) s += `<g transform="${TOP(150, 30, z + 5)}"><rect class="halo hot" filter="url(#bloom)" x="-30" y="-30" width="190" height="190" rx="40"/></g>`;
      s += `<g transform="${FRONT(150, 160, z + 5)}">${api.iso.slits(14, 116, 8, 1.5, 3.5, true, i === LIT ? 'scr-accent' : 'detail')}</g>`;
    }
    // The packet: a lit block on the lit tray.
    s += `<g filter="url(#glow)">${box(195, 75, 34 + LIT * 24 + 5, 40, 40, 14, 4)}</g>`;
    s += `<g transform="${TOP(195, 75, 34 + LIT * 24 + 19)}"><rect class="glass hot" x="4" y="4" width="32" height="32" rx="3"/></g>`;
    // Wire from the router up into the bottom tray.
    const a = P(85, 200, 52), b = P(150, 140, 34), c = P(215, 95, 34);
    s += `<path class="wire hot" filter="url(#soft)" d="M${a} C${P(120, 200, 52)} ${P(150, 170, 34)} ${b} L${c}"/>`;
    // Router in front.
    s += box(30, 170, 10, 110, 70, 42, 8);
    s += `<g transform="${FRONT(30, 240, 52)}">${[0, 1, 2, 3].map(i => `<rect class="face recess" x="${14 + i * 22}" y="14" width="14" height="10" rx="2"/><circle class="led ${i < 3 ? 'hot' : ''}" cx="${21 + i * 22}" cy="32" r="2.6"/>`).join('')}</g>`;
    s += `<g transform="${SIDE(140, 240, 52)}">${api.iso.slits(10, 60, 6, 10, 32)}</g>`;
    stage.setAttribute('viewBox', cover(K, -0.02)); stage.innerHTML = s;
    return {};
  },
});

// 2 · Storage, RAID e I/O: a drive cage with four sleds, stripes lit across three disks.
FIGS.push({
  id: 'storage-raid-io', name: 'Storage, RAID e I/O', aria: 'Gaveta com quatro discos, três acesos.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [320, 0, 0], [0, 240, 0], [320, 240, 0], [40, 40, 150]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 320, 240, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="300" height="220" rx="10"/></g>`;
    s += box(40, 40, 10, 250, 150, 130, 8);
    s += `<g transform="${TOP(40, 40, 140)}">${api.iso.slits(20, 230, 10, 20, 130)}</g>`;
    s += `<g transform="${SIDE(290, 190, 140)}">${api.iso.slits(16, 134, 9, 20, 110)}</g>`;
    let f = '';
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 58, on = i < 3;
      f += `<rect class="face recess" x="${x}" y="12" width="48" height="104" rx="4"/>`;
      f += `<rect class="${on ? 'glass hot' : 'face'}" x="${x + 6}" y="20" width="36" height="70" rx="3"/>`;
      for (let k = 0; k < 4; k++) f += `<rect class="${on && (k + i) % 3 !== 2 ? 'lit' : 'face recess'}" ${on && (k + i) % 3 !== 2 ? 'filter="url(#glow)"' : ''} x="${x + 10}" y="${26 + k * 16}" width="28" height="9" rx="1.5"/>`;
      f += `<circle class="led ${on ? 'hot' : ''}" cx="${x + 24}" cy="104" r="3"/>`;
    }
    s += `<g transform="${FRONT(40, 190, 140)}"><rect class="halo hot" filter="url(#bloom)" x="0" y="0" width="180" height="130" rx="30"/>${f}</g>`;
    const a = P(120, 190, 30), b = P(150, 232, 10);
    s += `<path class="wire hot" filter="url(#soft)" d="M${a} C${P(120, 215, 30)} ${P(130, 232, 10)} ${b} L${P(300, 232, 10)}"/>`;
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});

// 3 · CAP, ACID e BASE: three replicas; two still talk over a lit link, the third is cut off by a partition.
FIGS.push({
  id: 'cap-acid-base', name: 'CAP, ACID e BASE', aria: 'Três réplicas; uma isolada por um cabo partido.',
  mount(stage, api) {
    const K = api.iso.frame([[0, 0, 0], [340, 0, 0], [0, 280, 0], [340, 280, 0], [120, 20, 110]]);
    const { P, TOP, FRONT, SIDE, box } = K;
    let s = box(0, 0, 0, 340, 280, 10, 16);
    s += `<g transform="${TOP(0, 0, 10)}"><rect class="detail" x="10" y="10" width="320" height="260" rx="10"/></g>`;
    const T = [{ x: 120, y: 24, on: true }, { x: 26, y: 190, on: true }, { x: 250, y: 180, on: false }];
    const c = t => [t.x + 32, t.y + 32, 10];
    const lerp = (u, v, t) => u.map((q, i) => q + (v[i] - q) * t);
    const line = (A, B, cls) => `<path class="${cls}" ${cls.includes('hot') ? 'filter="url(#soft)"' : ''} d="M${P(...A)} L${P(...B)}"/>`;
    // Lit link between the two healthy replicas.
    s += line(c(T[0]), c(T[1]), 'wire hot');
    // Both links to the isolated replica are cut: dim stubs, a gap, and a lit spark at each break.
    for (const t of [T[0], T[1]]) {
      const A = c(t), B = c(T[2]), m1 = lerp(A, B, 0.44), m2 = lerp(A, B, 0.58);
      s += line(A, m1, 'wire hot') + line(m2, B, 'wire');
      s += `<g transform="${TOP(m1[0] - 4, m1[1] - 4, 10)}"><circle class="lit" filter="url(#glow)" cx="4" cy="4" r="4"/></g>`;
    }
    for (const t of [...T].sort((p, q) => p.x + p.y - (q.x + q.y))) {
      s += box(t.x, t.y, 10, 64, 64, 96, 6);
      let f = '';
      for (let k = 0; k < 5; k++) f += `<rect class="${t.on ? 'lit' : 'face recess'}" ${t.on ? 'filter="url(#glow)"' : ''} x="9" y="${12 + k * 15}" width="46" height="8" rx="2"/>`;
      s += `<g transform="${FRONT(t.x, t.y + 64, 106)}">${t.on ? `<rect class="halo hot" filter="url(#bloom)" x="-6" y="0" width="76" height="96" rx="20"/>` : ''}${f}</g>`;
      s += `<g transform="${SIDE(t.x + 64, t.y + 64, 106)}">${api.iso.slits(8, 56, 6, 10, 86)}</g>`;
      s += `<g transform="${TOP(t.x, t.y, 106)}"><circle class="${t.on ? 'lit' : 'led'}" ${t.on ? 'filter="url(#glow)"' : ''} cx="32" cy="32" r="6"/></g>`;
    }
    stage.setAttribute('viewBox', cover(K)); stage.innerHTML = s;
    return {};
  },
});
