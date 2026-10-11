// Figura OSI em 3D (iso-glow): duas pilhas explodidas de 7 placas (celular da Lena e do irmão),
// o pacote descendo ao lado da pilha e ganhando um envelope por camada, bits no cabo com 3 roteadores,
// e a subida do outro lado tirando os envelopes. Usa OSI_STAGES e osiDataView, injetados pelo build.
FIGS3D.push({ id: 'osi', name: 'Modelo OSI', mod: (() => {
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const OX = 40, OY = 34, SW = 170, SD = 116, SH = 6, GAP = 40, Z0 = 20;
  const SXS = { sp: OX, tk: OX + 460 };
  const zL = L => Z0 + (L - 1) * GAP;
  const COL = { sp: SXS.sp + SW + 52, tk: SXS.tk - 52 };        // coluna onde a carga desce/sobe
  const PY = OY + SD / 2;
  const NAMES = { 1: 'FÍSICA', 2: 'ENLACE', 3: 'REDE', 4: 'TRANSPORTE', 5: 'SESSÃO', 6: 'APRESENTAÇÃO', 7: 'APLICAÇÃO' };
  const PROTO = { 1: 'rádio · cobre · fibra', 2: 'Wi-Fi · Ethernet · MAC', 3: 'IP · ICMP', 4: 'TCP · UDP', 5: 'sessão TLS', 6: 'TLS · JPEG', 7: 'HTTP · DNS' };
  const PDU = { 1: 'bits', 2: 'quadro', 3: 'pacote', 4: 'segmento', 5: 'dados', 6: 'dados', 7: 'dados' };
  const SHELL_T = 4, CORE = 18, SQUEEZE = 0.72;

  plateWith(g0, 740, 330, [[18, 18], [722, 18], [18, 312], [722, 312]]);

  // linhas tracejadas: guias da vista explodida nos cantos das pilhas
  const dashed = (pts, parent, on = 3, off = 4) => { const s = []; let carry = 0, draw = true;
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(...a.map((v, j) => b[j] - v)); let d = 0;
      while (d < L) { const step = Math.min((draw ? on : off) - carry, L - d), p = t => a.map((v, j) => v + (b[j] - v) * t);
        if (draw) s.push([p(d / L), p((d + step) / L)]); d += step; carry += step; if (carry >= (draw ? on : off) - 1e-6) { carry = 0; draw = !draw; } } }
    seg(s, parent); };

  // uma placa por camada: corpo que acende, borda de destaque, nome e protocolos impressos no topo
  const slabs = { sp: {}, tk: {} };
  const makeSlab = (side, L) => {
    const x = SXS[side], z = zL(L), mat = capMat(); twCaps.push(mat);
    const grp = new THREE.Group(); grp.userData = { stage: side === 'sp' ? 8 - L : 8 + L }; g0.add(grp);
    rbox(x, OY, z, SW, SD, SH, 6, mat, grp);
    const sh = new THREE.Shape(); roundRect(sh, x, -(OY + SD), SW, SD, 6);
    const rim = loopL(sh.getPoints(10).map(p => W(p.x, -p.y, z + SH + 0.06)), accentLineMat); rim.visible = false; g0.add(rim);
    const cv = faceCanvas('top', x, OY, z + SH, SW, SD, 4, grp, true);
    slitsUV(frontUV(x, OY + SD, z + SH), SW - 46, SW - 12, 3, 1.4, SH - 1.4, g0);
    const s = { mat, rim, state: null, draw(state) {
      if (s.state === state && !s.force) return; s.state = state; s.force = false;
      const { x: c, P } = cv, C = pal3(), A_ = '#' + accent.getHexString(), on = state === 'on', hot = state === 'hot';
      c.clearRect(0, 0, cv.c.width, cv.c.height); c.lineWidth = 0.25 * P;
      c.strokeStyle = on ? (theme === 'light' ? '#ffe2c2' : '#ffd9a8') : C.detail; c.beginPath(); c.roundRect(5 * P, 5 * P, (SW - 10) * P, (SD - 10) * P, 3 * P); c.stroke();
      c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      c.fillStyle = on ? C.bg : hot ? A_ : C.inkHi; c.font = `600 ${11 * P}px ${MONO3}`; c.letterSpacing = `${1.2 * P}px`;
      c.fillText(`${L}  ${NAMES[L]}`, 12 * P, (SD - 30) * P);
      c.fillStyle = on ? C.bg : C.ink; c.font = `${7.5 * P}px ${MONO3}`; c.letterSpacing = '0px';
      c.fillText(PROTO[L], 12 * P, (SD - 16) * P);
      c.textAlign = 'right'; c.fillText(PDU[L], (SW - 12) * P, (SD - 16) * P);
      cv.tex.needsUpdate = true;
      mat.emissiveIntensity = on ? 1.15 : 0; rim.visible = on || hot;
    } };
    // ligação placa → coluna da carga (acende quando a camada trabalha)
    const xEdge = side === 'sp' ? x + SW : x, xCol = side === 'sp' ? COL.sp - 36 : COL.tk + 36;
    s.link = polyLine([[xEdge, PY, z + SH / 2], [xCol, PY, z + SH / 2]], lineMat, g0);
    return s;
  };
  for (const side of ['sp', 'tk']) {
    for (let L = 1; L <= 7; L++) slabs[side][L] = makeSlab(side, L);
    const x = SXS[side];
    for (const [cx, cy] of [[x, OY + SD], [x + SW, OY + SD], [x + SW, OY]]) dashed([[cx, cy, 7], [cx, cy, zL(7) + SH]], g0);
    label(side === 'sp' ? 'LENA · SÃO PAULO' : 'IRMÃO · TÓQUIO', 150, 10, 7, onTop(x + SW / 2, OY + SD + 22, 7), g0);
  }

  // cabo no piso, à frente, com 3 roteadores; um ponto de luz leva os bits
  const WY = OY + SD + 70, WZ = 12;
  const wirePts = [[COL.sp, PY, WZ], [COL.sp, WY, WZ], [COL.tk, WY, WZ], [COL.tk, PY, WZ]];
  const wire = polyLine(wirePts, majorMat, g0), wcum = cumLen(wirePts);
  const RX = [0.25, 0.5, 0.75].map(t => COL.sp + (COL.tk - COL.sp) * t);
  const routers = RX.map((rx, n) => {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(rx - 18, WY - 16, 7, 36, 32, 16, 4, mat, g);
    slitsUV(frontUV(rx - 18, WY + 16, 23), 6, 30, 3, 3, 10, g);
    label(`R${n + 1}`, 20, 8, 6, onTop(rx, WY, 23), g);
    // fração do caminho em que o roteador fica
    const d = (wcum[1]) + (rx - COL.sp); return { g, mat, t: d / wcum[wcum.length - 1] };
  });
  const bead = glowPoints([W(...wirePts[0])], 0.22); g0.add(bead);

  // a carga: núcleo (a foto) e 6 envelopes empilhados (camadas 7..2); um grupo que anda pela coluna
  const pk = new THREE.Group(); g0.add(pk);
  const coreMat = capMat(); twCaps.push(coreMat);
  const core = new THREE.Group(); pk.add(core); rbox(-CORE / 2, -CORE / 2, 0, CORE, CORE, 12, 3, coreMat, core);
  const shells = [];
  for (let i = 1; i <= 6; i++) {
    const g = new THREE.Group(); pk.add(g); const w = CORE + 8 * i, mat = capMat(); twCaps.push(mat);
    rbox(-w / 2, -w / 2, 0, w, w, SHELL_T - 0.6, 2, mat, g); shells[i] = { g, mat, p: 0 };
  }
  hazeAndShadow(g0, 370, 165, 9, 4.6);
  creases(first);

  // ── roteiro (o mesmo da figura 2D) ──
  const ST = OSI_STAGES;
  const goal = s => {
    const g = { side: 'sp', L: 7, have: [0, 0, 0, 0, 0, 0, 0], show: true, f: 1 };
    if (s <= 7) { g.L = s === 0 ? 7 : 8 - s; for (let i = 1; i <= 6; i++) g.have[i] = s >= 1 && 8 - i >= g.L ? 1 : 0; g.f = s >= 2 ? SQUEEZE : 1; g.show = s !== 7; }
    else if (s === 8) { g.side = 'x'; g.show = false; }
    else { g.side = 'tk'; g.L = s - 8; for (let i = 1; i <= 6; i++) g.have[i] = 8 - i > g.L ? 1 : 0; g.f = g.L >= 6 ? 1 : SQUEEZE; }
    return g;
  };
  const cur = { x: COL.sp, z: zL(7), f: 1, a: 1 };
  let s = 0, playing = false, dwell = 0, bitsT = -1, last = 0;

  function readout() { if (active !== 'osi') return; const t = ST[s];
    document.getElementById('read').textContent = `passo ${s + 1}/16 · ` + (s === 0 ? 'início' : s === 8 ? 'roteadores' : (t.side === 'sp' ? 'lena' : 'irmão') + ` · ${t.L} ${t.name.toLowerCase()}`); }
  function panelHtml() {
    const t = ST[s], where = t.side === 'sp' ? 'São Paulo · celular da Lena' : t.side === 'tk' ? 'Tóquio · celular do irmão' : 'No caminho · roteadores';
    return `<div class="o3-head"><span>Passo ${s + 1} de 16 · ${where}</span><span>PDU: ${t.pdu}</span></div>
      <div class="o3-bar"><i style="width:${((s + 1) / 16 * 100).toFixed(1)}%"></i></div>
      <h2>${t.title}</h2>
      <p class="o3-look"><b>No desenho</b>${t.look.replace('Torre da esquerda', 'Pilha da esquerda').replace('Torre da direita', 'Pilha da direita').replace(/elevador/g, 'pacote')}</p>
      <p>${t.body}</p>
      <details class="o3-dv"${innerWidth < 640 ? "" : " open"}><summary>O dado agora</summary><div class="dv">${osiDataView(s, false)}</div></details>`;
  }
  function render() {
    const g = goal(s);
    for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) {
      let state = '';
      if (g.side === side && g.L === L && s !== 0) state = 'on';
      else if (side === 'sp' && s >= 1 && s <= 8 && L > (s === 8 ? 0 : 8 - s)) state = 'hot';
      else if (side === 'tk' && s >= 9 && L < g.L) state = 'hot';
      slabs[side][L].draw(state);
      slabs[side][L].link.material = state === 'on' ? accentLineMat : lineMat;
    }
    wire.material = s === 7 || s === 8 || s === 9 ? accentLineMat : majorMat;
    coreMat.emissiveIntensity = 0.9;
    const info = document.getElementById('info'); if (active === 'osi' && info) { info.innerHTML = panelHtml(); info.scrollTop = 0; }
    readout();
  }
  function go(i) { s = (i + 16) % 16; dwell = 0; bitsT = s === 8 ? 0 : -1; if (s === 0) { cur.x = COL.sp; cur.z = zL(7); } render(); SFX.bit(1); return true; }
  const next = () => go(s + 1), prev = () => go(Math.max(0, s - 1)), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };

  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    const g = goal(s), k = 1 - Math.exp(-dt / 0.35);
    const tx = g.side === 'tk' ? COL.tk : COL.sp, tz = g.side === 'x' ? zL(1) : zL(g.L) - 2;
    cur.x += (tx - cur.x) * k; cur.z += (tz - cur.z) * k; cur.f += (g.f - cur.f) * k; cur.a += ((g.show ? 1 : 0) - cur.a) * k;
    const arrived = Math.abs(tz - cur.z) < 1.5 && Math.abs(tx - cur.x) < 1.5;
    let lift = 0;
    for (let i = 6; i >= 1; i--) { const sh = shells[i]; sh.p += ((arrived ? g.have[i] : sh.p > 0.5 ? 1 : 0) - sh.p) * k;
      sh.g.visible = sh.p > 0.04 && cur.a > 0.1; sh.g.position.copy(W(0, 0, lift - (1 - sh.p) * SHELL_T)); lift += sh.p * SHELL_T;
      sh.mat.emissiveIntensity = sh.p > 0.5 && i === 8 - g.L && g.side !== 'x' ? 0.55 : 0; }
    core.position.copy(W(0, 0, lift)); core.scale.setScalar(Math.max(0.01, cur.f)); core.visible = cur.a > 0.1;
    pk.position.copy(W(cur.x, PY, cur.z)); pk.visible = cur.a > 0.1;
    if (bitsT >= 0) { bitsT += dt; const t = Math.min(1, bitsT / 4.2); moveGlow(bead, alongPts(wirePts, wcum, t), 1);
      routers.forEach(r => { if (!r.hit && t >= r.t) { r.hit = true; flash(r.g, 320); SFX.bit(1); } });
      if (t >= 1) bitsT = -1; }
    else { bead.material.uniforms.intensity.value = 0; routers.forEach(r => r.hit = false); }
    // no celular a câmera desliza até a pilha da vez (mantém o ângulo de órbita)
    if (innerWidth < 640 && dt > 0) {
      const fx = g.side === 'tk' ? SXS.tk + SW / 2 - 30 : g.side === 'x' ? (COL.sp + COL.tk) / 2 : SXS.sp + SW / 2 + 30;
      const want = W(fx, g.side === 'x' ? WY : 150, g.side === 'x' ? -110 : 30), d = want.sub(controls.target).multiplyScalar(1 - Math.exp(-dt / 0.6));
      if (d.lengthSq() > 1e-8) { controls.target.add(d); camera.position.add(d); }
    }
    if (playing) { dwell += dt; if (dwell >= (s === 8 ? 6 : 6.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r') return reset();
    if (e.key === ' ') return auto();
    return false;
  }
  function click(hit) { let o = hit?.object; while (o && o.userData.stage === undefined) o = o.parent; if (o) go(o.userData.stage); }
  themeHooks.push(() => { for (const side of ['sp', 'tk']) for (let L = 1; L <= 7; L++) slabs[side][L].force = true; render(); });
  render();
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto]],
    view: innerWidth < 640 ? { target: W(SXS.sp + SW / 2 + 30, 150, 30), dist: 7 } : { target: W(250, 160, 110), dist: 13.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · clique numa camada · arraste para girar' };
})() });
