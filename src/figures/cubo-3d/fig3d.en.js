// 3D figure (iso-glow): the store's Scale Cube. Um cubo de arestas finas com três eixos graduados: X (réplicas, para a direita),
// Y (serviços, para cima) e Z (partições, para o fundo). Cada serviço é uma camada; cada pod é um bloco que acende na sua célula
// (réplica i, camada do serviço, partição d). O ponto da loja (X, Y, Z) brilha no canto do que está ocupado; o pedido 1053 do Caio
// é a luz que atravessa o conjunto. Fora do cubo: o lb-loja / o roteador à esquerda e os bancos no fim de cada fileira.
// Cenários (botões e ?mode=cubo|x|x-teto|y|z|loja|conversao; ?step=N abre no passo N).
// Dados: docs/escrita/scale-cube-brief.md (os mesmos das aulas, do quiz e dos widgets).
FIGS3D.push({ id: 'cubo', name: 'Scale Cube', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  persp.fov = 18; persp.updateProjectionMatrix();
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp = (a, b, f) => a + (b - a) * f;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const nf = (v, d = 1) => { const r = Math.round(v * 10 ** d) / 10 ** d; return Number.isInteger(r) ? String(r) : r.toFixed(d); };

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SV = ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas', 'relatorios', 'bff-app', 'bff-web'];
  const STORE = [10, 3, 3, 2, 2, 1, 1, 4, 4];          // réplicas na Black Friday: 30 pods
  const VC = [1, 1, 1, 1, 1, 1, 4];                    // vCPU por réplica dos 7 serviços (os BFFs não entram na conta)
  const TEAM = ['Storefront', 'Checkout', 'Checkout', 'Checkout', 'Logistics', 'Logistics'];
  const HOST = [11, 9, 10, 12, 8, 10, 9, 11, 10, 10];  // 100 respostas de /hostname por pod (ilustrativo: "cerca de 10 cada")
  const SEQ = (() => { const a = []; HOST.forEach((c, p) => { for (let k = 0; k < c; k++) a.push(p); }); let s = 7;
    for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) % 2147483648; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
  const vcpuOf = ns => ns.slice(0, 7).reduce((a, n, L) => a + n * VC[L], 0);
  const SC = ['cubo', 'x', 'x-teto', 'y', 'z', 'loja', 'conversao'];
  const SCNAME = { cubo: 'Cube', x: 'X', 'x-teto': 'X ceiling', y: 'Y', z: 'Z', loja: 'Store', conversao: 'Conversion' };
  const SCFULL = { cubo: 'The cube and the store\'s point', x: 'X axis: cloning', 'x-teto': 'X axis: the database ceiling', y: 'Y axis: split by function',
    z: 'Z axis: split by data', loja: 'The store at (10, 9, 3)', conversao: 'Conversion: the point moves' };
  const AULA = { cubo: 'aula-1-introducao-ao-modelo-conceitual', x: 'aula-2-eixo-x-escalabilidade-horizontal', 'x-teto': 'aula-2-eixo-x-escalabilidade-horizontal',
    y: 'aula-4-eixo-y-quebra-de-funcionalidade', z: 'aula-5-eixo-z-sharding-e-particionamento-de-dados', loja: 'aula-6-conversao-dos-eixos', conversao: 'aula-6-conversao-dos-eixos' };
  let clk = 0, sc = 'cubo', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-cubo3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria: célula (réplica i, camada L, partição d) ──
  const PL = 7, CW = 38, CD = 50, LH = 34, OX = 250, OY = 56, FY = OY + 3 * CD, Z0 = PL + 8, TOP = Z0 + 9 * LH;
  const PW = 28, PD = 34, PH = 20;
  const cx = i => OX + i * CW + CW / 2, ry = d => FY - d * CD - CD / 2, lz = L => Z0 + L * LH, mz = L => lz(L) + PH / 2;
  const fr = d => ry(d) + PD / 2, bus = d => ry(d) + CD / 2 - 5;
  const PLW = OX + 10 * CW + 200, PLD = FY + 76;
  plateWith(g0, PLW, PLD, [[14, 14], [PLW - 14, 14], [14, PLD - 14], [PLW - 14, PLD - 14]]);
  hazeAndShadow(g0, PLW / 2, PLD / 2, PLW / 100 * 1.15, PLD / 100 * 1.3);
  // as arestas do cubo (10 réplicas × 9 serviços × 3 partições)
  { const x0 = OX, x1 = OX + 10 * CW, y0 = OY, y1 = FY, z0 = Z0 - 2, z1 = TOP;
    seg([[[x0, y1, z0], [x1, y1, z0]], [[x1, y1, z0], [x1, y0, z0]], [[x1, y0, z0], [x0, y0, z0]], [[x0, y0, z0], [x0, y1, z0]],
      [[x0, y1, z1], [x1, y1, z1]], [[x1, y1, z1], [x1, y0, z1]], [[x1, y0, z1], [x0, y0, z1]], [[x0, y0, z1], [x0, y1, z1]],
      [[x0, y1, z0], [x0, y1, z1]], [[x1, y1, z0], [x1, y1, z1]], [[x1, y0, z0], [x1, y0, z1]], [[x0, y0, z0], [x0, y0, z1]]], g0, majorMat);
    // marcas de cada camada na aresta da frente e de cada partição no chão
    const s = []; for (let L = 1; L < 9; L++) s.push([[x0, y1, lz(L) - 4], [x0 + 10, y1, lz(L) - 4]]);
    for (let d = 1; d < 3; d++) s.push([[x0, FY - d * CD, z0], [x0 + 10, FY - d * CD, z0]]);
    for (let i = 1; i < 10; i++) s.push([[OX + i * CW, y1, z0], [OX + i * CW, y1 - 10, z0]]);
    seg(s, g0, majorMat);
    // grades nos planos do fundo (como num gráfico 3D): parede de trás e parede da direita por camada, chão por réplica e por partição
    const gr = [];
    for (let L = 1; L < 9; L++) { const z = lz(L) - 6; gr.push([[x0, y0, z], [x1, y0, z]], [[x1, y0, z], [x1, y1, z]]); }
    for (let i = 1; i < 10; i++) gr.push([[OX + i * CW, y0, z0], [OX + i * CW, y1, z0]], [[OX + i * CW, y0, z0], [OX + i * CW, y0, z1]]);
    for (let d = 1; d < 3; d++) { const y = FY - d * CD; gr.push([[x0, y, z0], [x1, y, z0]], [[x1, y, z0], [x1, y, z1]]); }
    seg(gr, g0, lineMat); }
  // portão (lb-loja ou roteador) à esquerda da fileira
  const GX0 = OX - 136, GW = 96, GD = 38, GH = 30, GX1 = GX0 + GW;
  const gate = (() => { const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, GW, GD, GH, 6, mat, g); const top = faceCanvas('front', 3, GD, GH - 2, GW - 6, GH - 4, 8, g);
    return { g, mat, top, key: '', pos: null, from: null, to: null, t0: 0 }; })();
  creases(first);

  // pods e bancos: uma geometria só para todos, criados quando o passo pede
  const solid = (sh, h) => { const g = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 8 }); g.rotateX(-Math.PI / 2); g.scale(TS, TS, TS); return g; };
  const PODGEO = (() => { const sh = new THREE.Shape(); roundRect(sh, -PW / 2, -PD / 2, PW, PD, 3); return solid(sh, PH); })();
  const DBR = 16, DBH = PH + 4;
  const DBGEO = (() => { const sh = new THREE.Shape(); sh.absarc(0, 0, DBR, 0, Math.PI * 2, false); return solid(sh, DBH); })();
  const lineGeo = (geo, a) => new LineSegmentsGeometry().setPositions(creaseLines(geo, a));
  const PODL = [lineGeo(PODGEO, 30), lineGeo(PODGEO, 60)], DBL = [lineGeo(DBGEO, 30), lineGeo(DBGEO, 60)];
  const ring = (() => { const pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; pts.push(DBR * Math.cos(a), DBR * Math.sin(a)); }
    const out = []; for (let h of [DBH * 0.36, DBH * 0.68]) for (let k = 0; k < 40; k++) out.push(pts[2 * k] * TS, h * TS, -pts[2 * k + 1] * TS, pts[2 * k + 2] * TS, h * TS, -pts[2 * k + 3] * TS);
    return new LineSegmentsGeometry().setPositions(out); })();
  const BOX0 = new THREE.BoxGeometry(0.001, 0.001, 0.001);
  const MAT = { off: capMat(), on: capMat(), soft: capMat(), bad: capMat(),
    ghost: new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.9, transparent: true, opacity: 0.16, depthWrite: false }) };
  ['off', 'on', 'soft', 'bad'].forEach(k => twCaps.push(MAT[k]));
  // cada material preso a uma malha escondida desde o início: o tema claro só preenche com a cor de destaque o que acha na cena
  Object.values(MAT).forEach(m => { const h = new THREE.Mesh(BOX0, m); h.visible = false; g0.add(h); });
  MAT.on.emissiveIntensity = 0.6; MAT.soft.emissiveIntensity = 0.2; MAT.bad.emissive.set(0xff3b2f); MAT.bad.emissiveIntensity = 0.7;
  function solidObj(geo, L2, extra) {
    const g = new THREE.Group(); g0.add(g); const m = new THREE.Mesh(geo, MAT.off); g.add(m); addOutline(m);
    const l1 = new LineSegments2(L2[0], lineMat), l2 = new LineSegments2(L2[1], majorMat); l2.renderOrder = 1; m.add(l1, l2);
    if (extra) m.add(new LineSegments2(extra, lineMat));
    return { g, m, st: '', vis: false, t0: 0, mono: false };
  }
  const PODS = new Map(), DBS = [];
  const podAt = (L, d, i) => { const k = L + ',' + d + ',' + i; let p = PODS.get(k);
    if (!p) { p = solidObj(PODGEO, PODL); p.g.position.copy(W(cx(i), ry(d), lz(L))); PODS.set(k, p); } return p; };
  const dbAt = n => { while (DBS.length <= n) DBS.push(solidObj(DBGEO, DBL, ring)); return DBS[n]; };
  function look(p, st) { if (p.st === st) return; p.st = st; p.m.material = MAT[st];
    p.m.children.forEach(c => { c.visible = st !== 'ghost'; }); }

  // eixos: barras grossas com ponta, cada uma com o seu material (acende ou apaga)
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0), UPV = new THREE.Vector3(0, 1, 0);
  const AO = [OX - 6, FY + 6, Z0 - 4];
  const axMat = { x: new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }), y: new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }),
    z: new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false }) };
  function stick(m, a, b, th) { const A = W(...a), C_ = W(...b), dv = C_.clone().sub(A), len = dv.length();
    m.position.copy(A).add(C_).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(XV, dv.normalize()); m.scale.set(len + th * TS, th * TS, th * TS); }
  function tip(m, a, b) { const A = W(...a), C_ = W(...b); m.position.copy(C_); m.quaternion.setFromUnitVectors(UPV, C_.clone().sub(A).normalize()); }
  const AX = {};
  for (const k of ['x', 'y', 'z']) { const s = new THREE.Mesh(BOX, axMat[k]), c = new THREE.Mesh(new THREE.ConeGeometry(7 * TS, 18 * TS, 20), axMat[k]); g0.add(s, c); AX[k] = { s, c }; }
  const axEnd = { x: xm => [OX + xm * CW + 26, AO[1], AO[2]], y: () => [AO[0], AO[1], TOP + 26], z: () => [AO[0], OY - 30, AO[2]] };
  let xmaxNow = 10;
  const placeAxes = xm => { for (const k of ['x', 'y', 'z']) { const e = axEnd[k](xm); stick(AX[k].s, AO, e, 4.5); tip(AX[k].c, AO, e); } };
  placeAxes(10);
  // ponto da loja: esfera de luz com três guias até os planos dos eixos
  const ptMat = capMat(); twCaps.push(ptMat); ptMat.emissiveIntensity = 1.4;
  const PT = new THREE.Mesh(new THREE.SphereGeometry(8 * TS, 24, 16), ptMat); g0.add(PT); const ptGlow = glowPoints([W(0, 0, 0)], 0.5); g0.add(ptGlow);
  const guideMat = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false, transparent: true, opacity: 0.85 });
  const GUIDES = [0, 1, 2].map(() => { const m = new THREE.Mesh(BOX, guideMat); g0.add(m); return m; });

  // vigas (conexões) e luzes que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BEAM = Array.from({ length: 160 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 12 }, () => { const mat = capMat(); twCaps.push(mat); mat.emissiveIntensity = 1.3;
    const m = new THREE.Mesh(new THREE.SphereGeometry(6 * TS, 16, 12), mat); g0.add(m); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); m.visible = false; return { g: m, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const a = b.pts[i], c = b.pts[i + 1]; if (a[0] === c[0] && a[1] === c[1] && a[2] === c[2]) continue;
        const m = BEAM[n++], th = b.on ? 4.5 : 2.6; m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; stick(m, a, c, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera ──
  const GAM = { value: 0 };
  const gamFix = mat => { mat.onBeforeCompile = sh => { sh.uniforms.uGam = GAM;
    sh.fragmentShader = 'uniform float uGam;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D( map, vMapUv );
      if ( uGam > 0.5 ) sampledDiffuseColor.rgb = mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) );
      diffuseColor *= sampledDiffuseColor;
    #endif`); }; mat.needsUpdate = true; };
  const texCS = () => theme === 'light' ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  const TK = () => innerWidth < 640 ? 1.6 : NARROW() ? 1.15 : 1;   // escala do texto (maior no celular)
  const tags = [];
  function tag(h = 12, left = false, frame = true) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS();
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); gamFix(mat);
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; if (left) sp.center.set(0, 0.5); g0.add(sp);
    const t = { sp, text: null, tone: 'hi', h,
      set(text, tone = 'hi') { if (text !== t.text || tone !== t.tone || t.force) { t.text = text; t.tone = tone; t.force = false; draw(); } return t; },
      at(x, y, z) { sp.position.copy(W(x, y, z)); sp.visible = true; return t; }, hide() { sp.visible = false; return t; } };
    function draw() {
      const P = 5, lines = String(t.text).split('\n'), C = pal3(), A_ = '#' + accent.getHexString(), x = c.getContext('2d');
      const fs = t.h * P, f1 = `700 ${fs}px ${MONO3}`, f2 = `600 ${fs * 0.82}px ${MONO3}`, pad = fs * 0.4, lh = fs * 1.2, lh2 = fs * 0.82 * 1.3;
      x.font = f1; let w = x.measureText(lines[0]).width; x.font = f2; for (const l of lines.slice(1)) w = Math.max(w, x.measureText(l).width);
      const nw = Math.ceil(w + pad * 2), nh = Math.ceil(lh + (lines.length - 1) * lh2 + pad * 1.4);
      if (c.width !== nw || c.height !== nh || tex.colorSpace !== texCS()) { c.width = nw; c.height = nh; tex.dispose(); tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS(); mat.map = tex; mat.needsUpdate = true; }
      const col = t.tone === 'acc' ? accC() : t.tone === 'dim' ? INK() : t.tone === 'bad' ? BAD() : C.inkHi;
      x.clearRect(0, 0, nw, nh); x.fillStyle = theme === 'light' ? 'rgba(246,246,245,.96)' : 'rgba(18,19,20,.92)';
      x.beginPath(); x.roundRect(1, 1, nw - 2, nh - 2, fs * 0.3); x.fill();
      if (frame) { x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.45); x.stroke(); }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = TK(); sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = Array.from({ length: 4 }, () => tag(13)), MSGS = [tag(12), tag(12), tag(12)], WHO = tag(12);
  const ROWS = Array.from({ length: 9 }, () => tag(12, true, false)), MINI = Array.from({ length: 10 }, () => tag(11));
  const AXT = { x: tag(12), y: tag(12), z: tag(12) }, PTT = tag(13);
  const AXTXT = { x: 'X → replicas\nclone', y: 'Y ↑ services\nsplit by function', z: 'Z ↖ partitions\nsplit by data' };

  // números dos eixos: X no chão à frente, Y na aresta da esquerda, Z no chão à esquerda
  const XT = faceCanvas('top', OX, FY + 12, PL, 20 * CW, 20, 4, g0, true);
  const YT = faceCanvas('front', OX - 40, FY + 8, TOP, 26, 9 * LH, 6, g0, true);
  const ZT = faceCanvas('top', OX - 44, OY, PL, 26, 3 * CD, 6, g0, true);
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawTicks(xm) {
    const th = theme + accent.getHex();
    if (once('xt', xm + th)) { const cv = XT, { x, P } = cv; x.clearRect(0, 0, cv.c.width, cv.c.height); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `700 ${11 * P}px ${MONO3}`; for (let i = 0; i < xm; i++) { x.fillStyle = i >= 10 ? BAD() : INK(); x.fillText(String(i + 1), (i * CW + CW / 2) * P, 10 * P); } cv.tex.needsUpdate = true; }
    if (once('yt', th)) { const cv = YT, { x, P } = cv; x.clearRect(0, 0, cv.c.width, cv.c.height); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `700 ${11 * P}px ${MONO3}`; x.fillStyle = INK(); for (let L = 0; L < 9; L++) x.fillText(String(L + 1), 13 * P, (TOP - mz(L)) * P); cv.tex.needsUpdate = true; }
    if (once('zt', th)) { const cv = ZT, { x, P } = cv; x.clearRect(0, 0, cv.c.width, cv.c.height); x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = `700 ${11 * P}px ${MONO3}`; x.fillStyle = INK(); for (let d = 0; d < 3; d++) x.fillText(String(d + 1), 13 * P, (ry(d) - OY) * P); cv.tex.needsUpdate = true; }
  }
  function drawGate(gs) {
    const key = JSON.stringify(gs) + theme + accent.getHex(); if (gate.key === key) return; gate.key = key;
    const cv = gate.top, { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light', on = gs.st === 'on', bad = gs.st === 'bad';
    x.fillStyle = bad ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = bad ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || bad ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = bad ? BAD() : on ? accC() : C.inkHi; x.font = `700 ${u(12)}px ${MONO3}`; x.fillText(gs.lab, u(5), u(8.5));
    x.fillStyle = INK(); let fs = 8.4; x.font = `700 ${u(fs)}px ${MONO3}`; const sw = x.measureText(gs.sub || '').width / P; if (sw > GW - 16) { fs = Math.max(6.6, fs * (GW - 16) / sw); x.font = `700 ${u(fs)}px ${MONO3}`; } x.fillText(gs.sub || '', u(5), u(19.5)); cv.tex.needsUpdate = true;
    gate.mat.emissiveIntensity = on ? 0.45 : bad ? 0.2 : 0;
  }

  // ── rotas (no meio da altura dos pods) ──
  const R = {
    src: L => [[GX0 - 70, ry(0), mz(L)], [GX0, ry(0), mz(L)]],
    g2p: (L, d, i) => [[GX1, ry(0), mz(L)], [OX - 24, ry(0), mz(L)], [OX - 24, bus(d), mz(L)], [cx(i), bus(d), mz(L)], [cx(i), fr(d), mz(L)]],
    p2db: (L, d, i, j) => [[cx(i), fr(d), mz(L)], [cx(i), bus(d), mz(L)], [cx(j), bus(d), mz(L)], [cx(j), ry(d) + DBR, mz(L)]],
    up: (i, L0, L1) => [[cx(i), fr(0) + 5, mz(L0)], [cx(i), fr(0) + 5, mz(L1)]],
  };
  const rev = pts => pts.slice().reverse();
  const ABOVE = (L, i, d = 0, k = 1) => [cx(i), ry(d), lz(L) + PH + 22 * k * TK()];

  // ── o que se vê em cada passo (spec) ──
  function base() {
    return { pods: new Map(), dbs: [], gate: null, pt: null, beams: [], tags: [], msgs: [], minis: [], rowTxt: {}, ax: 'xyz', axNote: {}, ptLab: true, xmax: 10,
      coord: null, npods: null, vcpu: null, extra: '', cmdLab: 'THE MATH', cmd: [], who: null, frame: null };
  }
  const P = (o, L, d, i, st = 'off', mono = false) => o.pods.set(L + ',' + d + ',' + i, { L, d, i, st, mono });
  const row = (o, L, n, st = 'off', d = 0, from = 0) => { for (let i = from; i < n; i++) P(o, L, d, i, st); };
  const storeAll = (o, st = 'off', skip = []) => STORE.forEach((n, L) => { if (!skip.includes(L)) row(o, L, n, st); });
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  const M = (o, at, text, tone = 'hi') => o.minis.push([...at, text, tone]);
  // vagas de balão à direita, empilhadas acima da camada em foco (onde não há rótulo de fileira)
  const SLOT = (o, L, k, text, tone = 'acc') => T(o, [cx(8.6), ry(0), lz(L) + PH + (38 + k * 46) * TK()], text, tone);
  const SHARD = (o, d, text, tone) => M(o, [cx(3) + 52, ry(d), mz(2) + 4], text, tone);
  const DB = (o, L, d, j, st = 'off') => o.dbs.push({ L, d, j, st });
  const GATE = (o, L, lab, sub, st = 'on') => { o.gate = { L, lab, sub, st }; };
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o dado real
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.7, keep = false) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '' }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    else o.beams.push({ pts, on: keep, tone: keep && tone === 'bad' ? 'bad' : '' });
    return f >= 1;
  }
  const flow = (o, pts, t, k = 0, sp = 0.7, tone = '') => o.beams.push({ pts, on: true, dot: ((t * sp + k) % 1 + 1) % 1, tone });
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  const ghostAll = (o, keep = []) => STORE.forEach((n, L) => { if (!keep.includes(L)) row(o, L, n, 'ghost'); });
  const count = o => [...o.pods.values()].filter(p => p.st !== 'ghost').length;

  // o pedidos no limite: n réplicas de 30/s e um banco de 150/s, com a demanda do ano que vem (200/s)
  function teto(o, t, nNew, j = 8) {
    const out = Math.min(nNew * 30, 150), full = nNew * 30 >= 150;
    ghostAll(o, [2]); GATE(o, 2, 'Service', 'pedidos · 200/s'); o.who = ['200 orders/s\nnext year', 'hi', 2];
    flow(o, R.src(2), t, 0, 0.6);
    for (let i = 0; i < nNew; i++) { const idle = i >= 5; P(o, 2, 0, i, idle ? 'soft' : 'on');
      if (!idle) { flow(o, R.g2p(2, 0, i), t, i / 5); flow(o, R.p2db(2, 0, i, j), t, i / 5 + 0.5); } else quiet(o, R.g2p(2, 0, i), R.p2db(2, 0, i, j)); }
    DB(o, 2, 0, j, full ? 'bad' : 'on');
    T(o, ABOVE(2, (nNew - 1) / 2, 0, 1.6), `${nNew} × 30 = ${nNew * 30}/s`, nNew > 5 ? 'dim' : 'acc');
    T(o, ABOVE(2, j, 0, 2.6), `DB: ${out} of 150/s${nNew * 30 > 150 ? `\n${Math.min(nNew * 30, 200) - 150}/s left out` : ''}`, full ? 'bad' : 'acc');
    o.coord = [nNew, 1, 1]; o.npods = nNew; o.vcpu = nNew;
    o.extra = `output ${out} of 200/s (${Math.round(out / 2)}%)`;
    o.cmd = [`service: ${nNew} × 30 = ${nNew * 30}/s`, 'DB: 150/s (one primary)', `output: ${out} of 200 (${Math.round(out / 2)}%)`];
    return out;
  }
  // o pedidos com Z: 3 fileiras (shard-0, -1, -2), 3 réplicas e um banco cada
  function shards(o, st = ['on', 'on', 'on'], j = 3, rows = 3) {
    for (let d = 0; d < rows; d++) { row(o, 2, 3, st[d], d); DB(o, 2, d, j, st[d]); }
  }

  const STEPS = {
    cubo: [
      { id: 'eixos', dur: 6, title: 'Three axes, three questions',
        story: 'AKF Partners created the cube in 2007 as a common language for talking about scale. Each axis is a question. X: do I copy the service? N identical copies, and each one takes 1/N of the load. Y: do I split what is different? By verb (a use case, like checkout) or by noun (an entity, like clientes). Z: do I split what is the same but too big? The same code, each copy with a piece of the data, and a router that picks the piece.',
        look: 'The axes light up one at a time: X to the right (replicas), Y up (services), Z to the back (partitions).',
        key: 'The Scale Cube is a vocabulary of three questions: do I copy? do I split what is different? do I split what is the same but too big?',
        f(o, t) { o.ax = t < 1.8 ? 'x' : t < 3.6 ? 'xy' : 'xyz'; o.cmdLab = 'The three questions';
          o.cmd = ['X · do I copy the service?', 'Y · do I split what is different?', 'Z · do I split what is the same,', '    but too big?'];
          o.axNote.x = 'X → replicas · clone\nN copies, each with 1/N of the load';
          if (t > 1.8) o.axNote.y = 'Y ↑ services · split by function\none service per verb or per noun';
          if (t > 3.6) o.axNote.z = 'Z ↖ partitions · split by data\nthe same code, each with a piece'; } },
      { id: 'p111', dur: 5, title: '(1, 1, 1): the monolith from module 5',
        story: 'At the end of module 5 the store was a single program: the loja monolith, with 8 vCPU and one database. One copy (X = 1), one function that does everything (Y = 1) and the whole dataset in one place (Z = 1). That is the point (1, 1, 1), the corner of the cube.',
        look: 'A single block, in the corner of the cube, and the store\'s point lit at its corner.',
        key: 'The coordinates are (X replicas, Y functions, Z partitions).',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.pt = [1, 1, 1]; o.rowTxt[0] = 'loja ×1 · 8 vCPU';
          if (t > 0.8) T(o, ABOVE(0, 0, 0, 2.4), 'loja · monolith\n8 vCPU · 1 DB');
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmdLab = 'The point'; o.cmd = ['(X replicas, Y functions, Z partitions)', '= (1, 1, 1)']; } },
      { id: 'p191', dur: 6, title: '(1, 9, 1): Y moved first',
        story: 'Module 6 split the program into 7 services, each with its own database: catalogo, carrinho, pedidos, pagamentos, estoque, entregas and relatorios. Modules 8 and 9 put the gateway and 2 BFFs in front, and the store reached 9 deployments. Still one copy of each: the point climbs the Y axis to (1, 9, 1).',
        look: 'The monolith breaks into 9 layers, one per deployment, and the point climbs from 1 to 9 on the Y axis.',
        key: 'Y splits what is different: each service becomes a layer of the cube.',
        f(o, t) { const y = 1 + 8 * ease(clamp((t - 0.4) / 2.6)), k = Math.min(9, Math.floor(y + 0.001));
          for (let L = 0; L < k; L++) P(o, 0 + L, 0, 0, 'on'); o.pt = [1, y, 1];
          const ns = Array.from({ length: 9 }, (_, L) => L < k ? 1 : 0);
          o.coord = [1, k, 1]; o.npods = k; o.vcpu = vcpuOf(ns);
          if (t > 3.2) T(o, [cx(6), ry(0), mz(5)], '9 deployments\n7 services + 2 BFFs');
          o.cmd = ['module 6: 7 services, one DB each', 'modules 8 and 9: gateway and 2 BFFs', `= ${k} deployment${k > 1 ? 's' : ''}: (1, ${k}, 1)`]; } },
      { id: 'p1091', dur: 6.5, title: '(10, 9, 1): then X, and Z stayed at 1',
        story: 'Module 7 put lb-loja in front of 10 copies of catalogo, and the Black Friday from module 14 closed the fleet at 30 pods: catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4 and bff-web 4. The point moves to (10, 9, 1). X stopped at 10, Y at 9, and Z stayed at 1: it is the axis the store has not used yet.',
        look: 'The layers grow to the right with each service\'s replicas and the point goes up to X = 10. The Z axis dims: nobody walked along it.',
        key: 'Today the store is at (10, 9, 1): it moved on X and Y, never on Z.',
        f(o, t) { const x = 1 + 9 * ease(clamp((t - 0.3) / 2.8)), ns = STORE.map(n => Math.min(n, Math.ceil(x - 0.001)));
          ns.forEach((n, L) => row(o, L, n, 'on')); o.pt = [x, 9, 1];
          o.coord = [Math.round(x), 9, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = vcpuOf(ns);
          if (t > 3.3) { o.ax = 'xy'; o.axNote.z = 'Z = 1\nnot used yet'; }
          o.cmd = ['X: up to 10 (catalogo)', 'Y: 9 deployments', 'Z: 1 everywhere', '→ (10, 9, 1) · 30 pods']; } },
      { id: 'erro', dur: 7.5, title: 'What if it goes wrong: the right axis for the wrong symptom',
        story: 'The search takes 900 ms per request, and the obvious reaction is to clone: from 10 to 20 replicas. The queue shrinks, because there are more servers, but each search still takes 900 ms: the time of one request comes from its code, and X does not touch the code. And the bill goes up: on the catalog, 10 to 20 replicas of 1 vCPU doubles the CPU, from 10 to 20 vCPU. Scale does not fix slow code; the way out is an index (module 4) or a cache (module 5).',
        look: 'The catalogo layer doubles to 20 copies and goes past the edge of the cube; the 10 new ones turn red, and the search balloon stays at 900 ms.',
        key: 'Symptom before axis: the 900 ms search is not a scale problem.',
        f(o, t) { o.xmax = 20; const n = 10 + Math.round(10 * clamp((t - 0.6) / 2.4));
          STORE.forEach((m, L) => { if (L) row(o, L, m, 'on'); }); row(o, 0, 10, 'on'); row(o, 0, n, 'bad', 0, 10);
          o.pt = [n, 9, 1]; o.coord = [n, 9, 1]; o.npods = 20 + n; o.vcpu = 15 + n; o.extra = 'each search: 900 ms, same';
          if (t > 1.2) T(o, [cx(12), ry(0), mz(4)], 'each search: 900 ms\nwith 10 or with 20 replicas', 'bad');
          if (t > 3.4) T(o, [cx(17), ry(0), mz(1) + 10], 'catalog CPU\n10 → 20 vCPU', 'bad');
          if (t > 4.6) T(o, [cx(15), ry(0), mz(6)], 'the way out: index (module 4)\nor cache (module 5)', 'dim');
          o.cmd = ['search with 10 replicas: 900 ms', `search with ${n} replicas: 900 ms`, `CPU: 10 × 1 → ${n} × 1 vCPU`]; } },
    ],
    x: [
      { id: 'apply', dur: 5.5, title: 'kubectl apply: 3 copies for 640 req/s',
        story: 'The catalog peak is 640 req/s (module 14), and each replica handles 100. The lab in lesson 3 starts with kubectl apply: a Deployment of 3 replicas behind a Service. With 3 copies, each one receives 640 ÷ 3 ≈ 213 req/s, more than double what it can handle.',
        look: 'lb-loja receives the 640 req/s and splits them among 3 copies of catalogo, which light up red: they are above 100 req/s.',
        key: 'X = 1/N: each copy receives a fraction of the load.',
        f(o, t) { ghostAll(o, [0]); row(o, 0, 3, 'bad'); GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\ncatalog peak', 'hi', 0];
          flow(o, R.src(0), t); for (let i = 0; i < 3; i++) flow(o, R.g2p(0, 0, i), t, i / 3, 0.7, 'bad');
          if (t > 1.2) SLOT(o, 0, 0, '640 ÷ 3 ≈ 213 req/s each\neach one handles 100', 'bad');
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = '≈ 213 req/s per copy';
          o.cmdLab = 'Real command'; o.cmd = ['kubectl apply -f catalogo.yaml', 'kubectl get pods -l app=catalogo', '→ 3 pods']; } },
      { id: 'scale', dur: 6, title: 'kubectl scale --replicas=10: 640 ÷ 10 = 64',
        story: 'kubectl scale deployment catalogo --replicas=10 takes the Deployment to 10 pods, the catalog from module 7. lb-loja splits the same 640 req/s by 10: 64 req/s per copy, 64% of what each one handles. It is Richardson\'s 1/N fraction, and it is X in full: identical copies and a division.',
        look: 'Seven new copies appear in the catalogo layer and all light up, with 64 req/s each.',
        key: 'X is copying the service and splitting the traffic: 640 ÷ 10 = 64.',
        f(o, t) { ghostAll(o, [0]); const n = 3 + Math.round(7 * clamp((t - 0.5) / 2)); row(o, 0, n, n < 7 ? 'bad' : 'on');
          GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\ncatalog peak', 'hi', 0];
          flow(o, R.src(0), t); for (let i = 0; i < n; i++) flow(o, R.g2p(0, 0, i), t, i / n, 0.7, n < 7 ? 'bad' : '');
          if (t > 2.8) SLOT(o, 0, 1, '640 ÷ 10 = 64 req/s each\n64% of 100');
          o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n; o.extra = `${nf(640 / n, 0)} req/s per copy`;
          o.cmdLab = 'Real command'; o.cmd = ['kubectl scale deployment catalogo \\', '  --replicas=10', `→ ${n} pods`]; } },
      { id: 'hostname', dur: 7.5, title: '100 calls: each pod says its name',
        story: 'From inside the cluster, the loop calls the Service 100 times on the /hostname path, and each answer carries the name of the pod that served it. With 10 pods, that is 10 names and about 10 answers for each. The split is not exact and does not need to be: what proves X is that all the names show up. It is the same selection problem as the author\'s round-robin/main.go, now inside the Service.',
        look: 'The light leaves lb-loja for one copy at a time, and the number above each pod counts the answers it gave.',
        key: 'The proof that the copies are identical is that each answer gives a different pod name.',
        f(o, t) { ghostAll(o, [0]); GATE(o, 0, 'lb-loja', 'Service catalogo'); o.who = ['curl /hostname\n100 times', 'hi', 0];
          const k = Math.floor(clamp((t - 0.4) / 5) * 100), cnt = Array(10).fill(0); for (let q = 0; q < k; q++) cnt[SEQ[q]]++;
          const cur = k > 0 && k < 100 ? SEQ[k] : -1;
          for (let i = 0; i < 10; i++) { P(o, 0, 0, i, i === cur ? 'on' : 'soft'); M(o, ABOVE(0, i, 0, 0.8), String(cnt[i]), cnt[i] ? 'acc' : 'dim'); }
          if (cur >= 0) { o.beams.push({ pts: R.src(0), on: true }); o.beams.push({ pts: R.g2p(0, 0, cur), on: true, dot: (t * 20) % 1 }); }
          for (let i = 0; i < 10; i++) if (i !== cur) quiet(o, R.g2p(0, 0, i));
          if (k >= 100) SLOT(o, 0, 1, '10 names, about 10 each\n(illustrative output)');
          o.coord = [10, 1, 1]; o.npods = 10; o.vcpu = 10; o.extra = `${k} of 100 answers`;
          o.cmdLab = 'Real command'; o.cmd = ['for i in $(seq 1 100); do', '  curl -s catalogo/hostname; echo', 'done | sort | uniq -c']; } },
      { id: 'delete', dur: 6.5, title: 'kubectl delete pod: the Deployment replaces it',
        story: 'kubectl delete pod deletes one of the copies. The Deployment notices 1 of 10 is missing and creates another, with a different name. That is what makes X simple: copies are disposable and replaced on their own. The care is in removing the copy without dropping whoever it was serving: without a readinessProbe and without graceful shutdown, the Service still sends connections to it for a few seconds (module 22).',
        look: 'Copy 4 turns red and disappears; seconds later a new one lights up in its place.',
        key: 'Pods are disposable: deleting one makes the Deployment create another.',
        f(o, t) { ghostAll(o, [0]); GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\ncatalog peak', 'hi', 0]; flow(o, R.src(0), t);
          const ph = t < 1 ? 'ok' : t < 2.4 ? 'bad' : t < 3.6 ? 'gone' : 'new';
          for (let i = 0; i < 10; i++) { if (i === 3 && ph === 'gone') continue; P(o, 0, 0, i, i === 3 && ph === 'bad' ? 'bad' : 'on');
            flow(o, R.g2p(0, 0, i), t, i / 10, 0.7, i === 3 && ph === 'bad' ? 'bad' : ''); }
          if (ph === 'bad' || ph === 'gone') SLOT(o, 0, 1, 'kubectl delete pod\ncopy 4 leaves', 'bad');
          if (ph === 'new') SLOT(o, 0, 1, 'the Deployment creates another\n10 of 10 again');
          const n = ph === 'gone' ? 9 : 10; o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n; o.extra = ph === 'gone' ? '1 of 10 missing' : '640 ÷ 10 = 64 req/s per copy';
          o.cmdLab = 'Real command'; o.cmd = ['kubectl delete pod <nome>', 'kubectl get pods -l app=catalogo', `→ ${n} pods${ph === 'new' ? ' (a new name)' : ''}`]; } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: the cart in memory',
        story: 'carrinho keeps the cart in the memory of each replica. Lena puts the cat in the cart and the request lands on replica 1. When she opens the cart page, lb-loja sends her to replica 2, which has never heard of the cat: the cart shows up empty. The fix is to keep the state in Redis (module 5), which any replica reads. IP sticky pins Lena to replica 1, but breaks with NAT: 500 people in an office arrive with the same IP and all land on the same replica.',
        look: 'On the carrinho layer, the light carries the cat to replica 1; the second request goes to replica 2, which lights up red with an empty cart.',
        key: 'X only works with interchangeable copies: no state in the process memory.',
        f(o, t) { ghostAll(o, [1]); row(o, 1, 3, 'off'); GATE(o, 1, 'lb-loja', '203.0.113.10'); o.who = ['Lena · Recife', 'dim', 1];
          const p1 = [...R.src(1), ...R.g2p(1, 0, 0)], p2 = [...R.src(1), ...R.g2p(1, 0, 1)];
          if (send(o, t, 0.3, 1.6, p1, 'POST /carrinho · cat', 'hi', 0.5, true)) { P(o, 1, 0, 0, 'on'); SLOT(o, 1, 0, 'carrinho-1 · memory\nplush cat ×1'); }
          if (send(o, t, 3.0, 4.3, p2, 'GET /carrinho', 'hi', 0.3, true)) { P(o, 1, 0, 1, 'bad'); SLOT(o, 1, 1, 'carrinho-2 · memory\nempty: never saw the cat', 'bad'); }
          if (t > 4.6) send(o, t, 4.6, 5.8, rev(p2), '200 · empty cart', 'bad', 1, true);
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = t > 4.3 ? 'empty cart on replica 2' : 'Lena puts the cat in';
          o.cmdLab = 'Requests'; o.cmd = ['POST /carrinho → carrinho-1', ...(t > 3 ? ['GET  /carrinho → carrinho-2'] : []), ...(t > 4.6 ? ['→ 200 · empty cart'] : [])]; } },
    ],
    'x-teto': [
      { id: 'hoje', dur: 5.5, title: 'pedidos at (3, 1, 1): 90 out of 200',
        story: 'pedidos does 30 orders/s per replica (33 ms of CPU per order, the math from module 14), and its database, a single primary, handles 150/s. Next year\'s Black Friday asks for 200 orders/s. With today\'s 3 replicas, the service gives 3 × 30 = 90/s: 90 out of 200, 45%.',
        look: 'Three copies of pedidos lit and the database at the end of the row; the database balloon reads 90 of 150.',
        key: 'Today the limiting link is the service: 90/s.',
        f(o, t) { teto(o, t, 3); } },
      { id: 'cinco', dur: 5.5, title: '5 replicas: 150/s, the database ceiling',
        story: 'Cloning works while the bottleneck is the service. With 5 replicas, the service gives 5 × 30 = 150/s, and the database reaches its 150/s. The output goes from 90 to 150 out of 200: 75%.',
        look: 'Two new copies light up; the database balloon reaches 150 of 150 and turns red.',
        key: 'Up to 5 replicas, each new copy adds 30 orders/s.',
        f(o, t) { teto(o, t, t < 0.8 ? 3 : t < 1.6 ? 4 : 5); } },
      { id: 'seis', dur: 5.5, title: 'The sixth replica adds nothing',
        story: 'With the sixth replica, the service would give 6 × 30 = 180/s, but the database stays at 150. The output does not move: 150 out of 200. The new copy sits waiting for the database.',
        look: 'The sixth copy lights up halfway, with no work; the database stays red, at 150 of 150.',
        key: 'Past the database ceiling, a new replica is cost without gain.',
        f(o, t) { teto(o, t, 6); if (t > 1.2) T(o, ABOVE(2, 3, 0, 4.6), 'the 6th replica\nadds nothing', 'dim'); } },
      { id: 'erro', dur: 7.5, title: 'What if it goes wrong: 7 replicas, and the output stops at 150',
        story: 'The team insists on X and takes pedidos to 7 replicas: (7, 1, 1). The service now gives 7 × 30 = 210/s, more than the 200 orders. But the output stops at 150/s, 75%: the database is a single primary, and cloning the service does not move it. The bottleneck left the service and stayed in the database. To split the database you need another axis: Z (lesson 5).',
        look: 'Seven copies lit, two with no work; the database red at the 150/s ceiling, and 50 orders/s left out.',
        key: 'The database stops X: 210/s of service, 150/s of output.',
        f(o, t) { teto(o, t, 7); } },
    ],
    y: [
      { id: 'mono', dur: 5, title: '(1, 1, 1): one 8 vCPU program',
        story: 'At the end of module 5, the store was the loja monolith: an 8 vCPU program with a single database and everything inside it, from catalog to reports. The heavy report and the 10 ms page shared the same machine size.',
        look: 'A single block, in the corner of the cube, with the 7 functions inside.',
        key: 'In the monolith, all functions have the same machine size.',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.pt = [1, 1, 1]; o.rowTxt[0] = 'loja ×1 · 8 vCPU';
          if (t > 0.6) T(o, [cx(5), ry(0), mz(3)], 'loja · 8 vCPU · 1 DB\ncatalogo · carrinho · pedidos\npagamentos · estoque\nentregas · relatorios');
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmd = ['1 copy × 8 vCPU = 8 vCPU']; } },
      { id: 'mono10', dur: 6, title: 'Black Friday with X only: 10 × 8 = 80 vCPU',
        story: 'To handle the Black Friday storefront by cloning the whole monolith, the store would need 10 copies of 8 vCPU: 80 vCPU. Each copy carries the 4 vCPU report and everything else along, even if only the catalog is full.',
        look: 'The monolith becomes 10 copies along the X axis; the vCPU counter climbs to 80.',
        key: 'Cloning the monolith also clones what did not need to grow.',
        f(o, t) { const n = 1 + Math.round(9 * clamp((t - 0.4) / 2.4)); for (let i = 0; i < n; i++) P(o, 0, 0, i, 'on', true);
          o.rowTxt[0] = `loja ×${n} · ${n * 8} vCPU`; o.pt = [n, 1, 1];
          if (t > 3) T(o, ABOVE(0, 5, 0, 2.4), '10 × 8 = 80 vCPU\neach copy carries the report along');
          o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n * 8; o.cmd = [`${n} cop${n > 1 ? 'ies' : 'y'} × 8 vCPU = ${n * 8} vCPU`]; } },
      { id: 'parte', dur: 7, title: 'Y: 7 services, 25 vCPU',
        story: 'Module 6 split the program into 7 services, each with its own database and its own size. On Black Friday: catalogo 10 × 1, carrinho 3 × 1, pedidos 3 × 1, pagamentos 2 × 1, estoque 2 × 1, entregas 1 × 1 and relatorios 1 × 4 vCPU. They add up to 25 vCPU against 80: 55 less, 69%. The teams split too: Storefront on the catalog, Checkout on cart, orders and payments, Logistics on stock and deliveries.',
        look: 'The 10 copies of the monolith break into 7 layers, each with its replicas and its database; the counter drops from 80 to 25 vCPU.',
        key: 'Y splits what is different so that each part scales its own way and has an owner.',
        f(o, t) { if (t < 0.9) { for (let i = 0; i < 10; i++) P(o, 0, 0, i, 'soft', true); o.rowTxt[0] = 'loja ×10 · 80 vCPU'; o.pt = [10, 1, 1]; o.coord = [10, 1, 1]; o.npods = 10; o.vcpu = 80; o.cmd = ['10 × 8 = 80 vCPU']; return; }
          const f = clamp((t - 0.9) / 2.2), ns = STORE.slice(0, 7).map(n => Math.max(1, Math.min(n, Math.ceil(f * 10 - 0.001))));
          ns.forEach((n, L) => { row(o, L, n, 'on'); o.rowTxt[L] = L < 6 ? `${SV[L]} ×${n} · ${TEAM[L]}` : 'relatorios ×1 · 4 vCPU'; if (t > 3.3) DB(o, L, 0, n + 0.15, 'soft'); });
          const v = Math.round(lerp(80, 25, ease(f))); o.pt = [10, 1 + 6 * ease(clamp((t - 0.9) / 1.6)), 1];
          if (t > 3.6) T(o, [OX + 6 * CW, ry(0), lz(7) + 34], '25 vCPU against 80\n55 less, 69%');
          o.coord = [10, 7, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = f >= 1 ? 25 : v;
          o.cmd = ['10 + 3 + 3 + 2 + 2 + 1 + 4 = 25 vCPU', '80 − 25 = 55 vCPU less (69%)']; } },
      { id: 'checkout', dur: 8, title: 'Order 1053\'s checkout crosses 5 services',
        story: 'At 8:05 PM on Black Friday, Caio, in Rio, buys 1 blue mug (19.90) with Rio shipping (12.00): order 1053, 31.90. Checkout is a cut by verb: it crosses carrinho → pedidos → pagamentos → estoque → entregas, five services and four network hops of 5 ms, +20 ms (module 6). In stock, the mug goes from 38 to 37. catalogo is the cut by noun: an entity, the product.',
        look: 'Order 1053\'s light enters carrinho and climbs the layers up to entregas; at each hop the panel adds 5 ms.',
        key: 'By verb (checkout) or by noun (catalogo): each service with its own data.',
        f(o, t) { STORE.slice(0, 7).forEach((n, L) => row(o, L, n, L === 0 ? 'soft' : 'off')); o.who = ['Caio · Rio', 'dim', 1];
          const path = [[GX0 - 70, fr(0) + 5, mz(1)], [cx(0), fr(0) + 5, mz(1)], [cx(0), fr(0) + 5, mz(5)]];
          send(o, t, 0.4, 6.0, path, '1053 · 31.90', 'acc', 9, true);
          const f = ease(clamp((t - 0.4) / 5.6)), p = alongPts(path, cumLen(path), f), at = p[0] >= cx(0) - 1 ? Math.min(5, Math.max(1, Math.round((p[2] - mz(0)) / LH))) : 0;
          for (let L = 1; L <= at; L++) row(o, L, STORE[L], L === at ? 'on' : 'soft');
          const ms = Math.max(0, at - 1) * 5;
          if (at >= 4) T(o, [cx(10.5), ry(0), mz(4)], 'estoque · blue mug\n38 → 37');
          if (t > 6.2) T(o, [cx(10.5), ry(0), mz(6) + 8], '5 services, 4 hops\n4 × 5 ms = +20 ms');
          T(o, [cx(10.5), ry(0), mz(2)], 'catalogo: noun\ncheckout: verb', 'dim');
          o.coord = [10, 7, 1]; o.npods = 22; o.vcpu = 25; o.extra = `+${ms} ms of network`;
          o.cmdLab = 'Order 1053'; o.cmd = ['1 blue mug           19.90', 'Rio shipping         12.00', 'total                31.90', `hops: ${Math.max(0, at - 1)} × 5 ms = +${ms} ms`]; } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: a service per table',
        story: 'Someone splits itens_pedido into its own service, because "it is another entity". The "my orders" screen shows 20 orders: before, it was a JOIN of about 2 ms; now it is 1 call to list the orders and 20 to fetch the items of each one, 21 × 5 ms = 105 ms of network alone. And the single transaction is gone: the refund from module 6, which was a ROLLBACK, becomes the saga from module 19.',
        look: 'A new layer, itens_pedido, appears in red at the top; the calls run from pedidos to it, one per order, and the counter goes to 105 ms.',
        key: 'Y cuts along the business boundary, not by table.',
        f(o, t) { STORE.slice(0, 7).forEach((n, L) => row(o, L, n, L === 2 ? 'on' : 'ghost')); P(o, 7, 0, 0, 'bad'); o.rowTxt[7] = 'itens_pedido ×1 · new';
          o.who = ['"my orders"\n20 orders', 'dim', 2];
          const k = Math.min(21, Math.floor(clamp((t - 0.4) / 5.2) * 21 + (t > 0.4 ? 1 : 0)));
          if (k >= 1) { const ph = ((t - 0.4) * 21 / 5.2) % 1; if (k === 1) o.beams.push({ pts: [[GX0 - 70, fr(0) + 5, mz(2)], [cx(0), fr(0) + 5, mz(2)]], on: true, dot: ph });
            else quiet(o, [[GX0 - 70, fr(0) + 5, mz(2)], [cx(0), fr(0) + 5, mz(2)]]);
            if (k > 1 && k < 21) o.beams.push({ pts: R.up(0, 2, 7), on: true, dot: ph, tone: 'bad' }); else if (k >= 21) o.beams.push({ pts: R.up(0, 2, 7), on: true, tone: 'bad' }); }
          if (k >= 21) T(o, [cx(8), ry(0), mz(7)], '21 × 5 ms = 105 ms\nthe JOIN took ~2 ms', 'bad');
          if (t > 6.4) T(o, [cx(8), ry(0), mz(4)], 'and the single transaction is gone\nROLLBACK becomes a saga (module 19)', 'dim');
          o.coord = [10, 8, 1]; o.npods = 23; o.extra = `${k} call${k === 1 ? '' : 's'} · ${k * 5} ms of network`;
          o.cmdLab = 'The "my orders" screen'; o.cmd = ['before: 1 JOIN ≈ 2 ms', 'after:  1 + 20 calls', `        ${k} × 5 ms = ${k * 5} ms`]; } },
    ],
    z: [
      { id: 'um', dur: 5.5, title: 'pedidos: 3 replicas and a single database',
        story: 'After Y, pedidos has its own database; after X, it has 3 replicas. But the database is still a single one: a primary of 150 orders/s with 50 million rows, and cloning the service does not move it (the X ceiling). It is the hole in the cube: the Z axis, which the store has never used.',
        look: 'The pedidos layer with 3 copies and the database at the end of the row, lit: 150/s and 50 million rows.',
        key: 'Z splits what is the same but too big.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 3, 'on'); DB(o, 2, 0, 3, 'on'); for (let i = 0; i < 3; i++) flow(o, R.p2db(2, 0, i, 3), t, i / 3);
          if (t > 0.8) SLOT(o, 2, 0, 'pedidos DB\n150/s · 50 million rows');
          o.ax = t > 2.4 ? 'z' : 'xyz'; o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = 'one DB: 150 orders/s';
          o.cmd = ['replicas: 3 × 30 = 90/s', 'DB: 1 primary = 150/s', 'rows: 50 million']; } },
      { id: 'shards', dur: 6.5, title: 'Z: 3 shards by cliente_id',
        story: 'Z splits the database by a key. With cliente_id and 3 shards, each shard keeps only the orders of the customers that land on it, and each one has its own 3 replicas of pedidos: shard-0, shard-1 and shard-2. It is what module 16 builds; here it is the promise. The pedidos point goes from (3, 1, 1) to (3, 1, 3): 9 pods.',
        look: 'Two new rows appear behind the first, along the Z axis, each with 3 copies and its database.',
        key: 'Z: the same code, each instance with a piece of the data.',
        f(o, t) { ghostAll(o, [2]); const rows = t < 0.8 ? 1 : t < 1.8 ? 2 : 3; shards(o, ['on', 'on', 'on'], 3, rows);
          for (let d = 0; d < rows; d++) SHARD(o, d, `shard-${d}`, 'acc'); o.rowTxt[2] = false; o.ptLab = false;
          o.pt = [3, 1, 1 + 2 * ease(clamp((t - 0.6) / 1.8))];
          if (t > 2.4) SLOT(o, 2, 1, 'what module 16 builds');
          o.coord = [3, 1, rows]; o.npods = 3 * rows; o.vcpu = 3 * rows; o.extra = `${rows} shard${rows > 1 ? 's' : ''} × 3 replicas`;
          o.cmd = ['key: cliente_id', `shards: ${rows} (shard-0${rows > 1 ? ' … shard-' + (rows - 1) : ''})`, `pods: ${rows} × 3 = ${3 * rows}`]; } },
      { id: 'rota', dur: 7, title: 'The router: murmur3(\'caio-58\') mod 3 = 2',
        story: 'Caio\'s order 1053 arrives with cliente_id = caio-58. The router computes murmur3(\'caio-58\') mod 3 and gets 2: the order goes to shard-2, to its replicas and its database. The other two shards never find out. With the same math, lena-77 and bia-31 land on shard-1 and davi-12 on shard-0.',
        look: 'Order 1053\'s light enters the router, follows the Z axis to the third row and lights up shard-2.',
        key: 'A router looks at the key and picks the piece.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'router', 'by cliente_id'); o.who = ['Caio · Rio', 'dim', 2];
          const path = [...R.src(2), [GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(2), mz(2)], [cx(0), bus(2), mz(2)], [cx(0), fr(2), mz(2)]];
          const got = send(o, t, 0.3, 2.8, path, 'caio-58 · 1053', 'acc', 0.2, true);
          const inDb = got && send(o, t, 3.0, 3.8, R.p2db(2, 2, 0, 3), 'INSERT · 31.90', 'acc', 1.2, true);
          shards(o, got ? ['soft', 'soft', 'on'] : ['off', 'off', 'off']); if (got) P(o, 2, 2, 0, 'on');
          for (let d = 0; d < 3; d++) SHARD(o, d, `shard-${d}`, got && d === 2 ? 'acc' : 'dim'); o.rowTxt[2] = false;
          if (t > 1.4) SLOT(o, 2, 1, "murmur3('caio-58') mod 3 = 2\n→ shard-2");
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = inDb ? '1053 written to shard-2' : 'caio-58 → ?';
          o.cmdLab = 'The router'; o.cmd = ["murmur3('caio-58') mod 3 = 2", '→ shard-2', 'lena-77, bia-31 → shard-1 · davi-12 → shard-0']; } },
      { id: 'conta', dur: 6.5, title: '3 × 150 = 450/s: the 200 orders/s get through',
        story: 'With 3 shards, the databases\' capacity goes to 3 × 150 = 450/s, and the service, with 3 replicas per shard, to 9 × 30 = 270/s. Next year\'s 200 orders/s get through whole: each shard receives 66.7/s, and each database sits at 44%. And since each shard has its own replicas (AKF\'s pods), each database sees only 3 × 10 = 30 connections, not 9 × 10 = 90.',
        look: 'The three rows lit at the same time, each database with its balloon at 66.7 of 150.',
        key: 'X + Z: (3, 1, 3) outputs 200 of 200.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'router', 'by cliente_id'); o.who = ['200 orders/s\nnext year', 'hi', 2]; shards(o); flow(o, R.src(2), t);
          for (let d = 0; d < 3; d++) { const g = [[GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(d), mz(2)], [cx(1), bus(d), mz(2)], [cx(1), fr(d), mz(2)]]; flow(o, g, t, d / 3);
            for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4 + 0.5); }
          for (let d = 0; d < 3; d++) SHARD(o, d, `shard-${d}`, 'acc'); o.rowTxt[2] = false;
          if (t > 1) SLOT(o, 2, 1, 'each DB: 66.7 of 150/s\n44% · 30 connections');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'output 200 of 200/s (100%)';
          o.cmd = ['DBs: 3 × 150 = 450/s', 'service: 9 × 30 = 270/s', 'output: 200 of 200 (100%)', 'each DB: 66.7 ÷ 150 = 44%']; } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: WHERE id = 1042 opens all 3 shards',
        story: 'The router only knows how to pick when the query carries the key. WHERE id = 1042, with only the order id, does not say which customer owns it, so the query goes to all the shards and the result is merged afterwards: it is scatter-gather. The PostgreSQL plan with partitioned tables shows an Append over the 3 partitions. With the key (WHERE cliente_id = ... AND id = 1042), it reads only one.',
        look: 'Three lights leave the router at the same time, one for each shard; the three databases light up red and the answers come back to be merged.',
        key: 'A query without the key reads all the shards.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'router', 'no key'); shards(o, ['off', 'off', 'off']);
          let all = true;
          for (let d = 0; d < 3; d++) { const g = [[GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(d), mz(2)], [cx(3), bus(d), mz(2)], [cx(3), ry(d) + DBR, mz(2)]];
            const ok = send(o, t, 0.5, 2.3, g, d === 0 ? 'WHERE id = 1042' : '', 'bad', 0.4, t < 3); all = all && ok;
            SHARD(o, d, `pedidos_p${d}`, ok ? 'bad' : 'dim'); if (ok) o.dbs[d].st = 'bad';
            if (t > 3) send(o, t, 3.0, 4.6, rev(g), d === 0 ? 'Append: merges the 3' : '', 'bad', 1.4, true); }
          o.rowTxt[2] = false; if (t > 2.4) SLOT(o, 2, 1, 'without the key: 3 shards\nwith the key: 1', 'bad');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = all ? '3 of 3 shards read' : 'which shard has 1042?';
          o.cmdLab = 'Real command'; o.cmd = ['SELECT * FROM pedidos', 'WHERE id = 1042;', '→ Append: pedidos_p0, _p1, _p2']; } },
    ],
    loja: [
      { id: 'ponto', dur: 6, title: '(10, 9, 3): the store with Z on pedidos',
        story: 'This is the store after module 16: the 9 Black Friday deployments, and pedidos split into 3 shards of 3 replicas, each with its own database. The store\'s point sits at (10, 9, 3), but the 3 only applies to pedidos. That is 36 pods: today\'s 30, minus the 3 old pedidos replicas, plus the 9 new ones.',
        look: 'The 9 layers lit; only pedidos has depth, with 3 rows and 3 databases.',
        key: 'Pods = per-service sum of replicas × partitions: 30 − 3 + 9 = 36.',
        f(o, t) { storeAll(o, 'on', [2]); shards(o); o.pt = [10, 9, 1 + 2 * ease(clamp((t - 0.4) / 1.6))];
          if (t > 2.2) T(o, [OX + 6 * CW, ry(0), lz(8) + 34], '30 − 3 + 9 = 36 pods');
          o.coord = [10, 9, 3]; o.npods = 36; o.vcpu = 31; o.cmd = ['today: 30 pods', 'pedidos: 3 → 3 × 3 = 9', '30 − 3 + 9 = 36 pods']; } },
      { id: 'hoje', dur: 5, title: 'Today (3, 1, 1): 90 out of 200',
        story: 'pedidos with next year\'s demand, 200 orders/s. Today it is 3 replicas of 30/s and a database of 150/s: the service is the weak link, and the output is 90/s, 45%.',
        look: 'Only the first row of pedidos, with 3 copies and a database; the "today" row stands out in the data table.',
        key: 'The output is the smaller of the service and the database.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 3, 'on'); DB(o, 2, 0, 3, 'on'); for (let i = 0; i < 3; i++) flow(o, R.p2db(2, 0, i, 3), t, i / 3);
          SLOT(o, 2, 0, 'service 90/s · DB 150/s\noutput 90 of 200 (45%)');
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = 'output 90 of 200/s (45%)'; o.cmd = ['min(3 × 30, 150) = 90/s', '90 of 200 = 45%']; } },
      { id: 'sox', dur: 5, title: 'X only (7, 1, 1): 150 out',
        story: 'With X only, 7 replicas give 210/s of service, but the single-primary database stops at 150/s. The output is 150/s, 75%: the database stops X.',
        look: 'The pedidos row grows to 7 copies and the database lights up red, at the ceiling.',
        key: 'Cloning the service does not move the database ceiling.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 7, 'on'); DB(o, 2, 0, 7, 'bad'); for (let i = 0; i < 7; i++) flow(o, R.p2db(2, 0, i, 7), t, i / 7);
          SLOT(o, 2, 0, 'service 210/s · DB 150/s\noutput 150 of 200 (75%)', 'bad');
          o.coord = [7, 1, 1]; o.npods = 7; o.vcpu = 7; o.extra = 'output 150 of 200/s (75%)'; o.cmd = ['min(7 × 30, 150) = 150/s', '150 of 200 = 75%']; } },
      { id: 'xz', dur: 5.5, title: 'X + Z (3, 1, 3): 200 out',
        story: 'With X and Z together, 3 shards of 3 replicas: 270/s of service and 3 × 150 = 450/s of database. The output reaches 200/s, 100%, and each database sits at 44%.',
        look: 'Three rows with 3 copies and one database each, all lit.',
        key: 'pedidos only closes the math with X and Z together.',
        f(o, t) { ghostAll(o, [2]); shards(o); for (let d = 0; d < 3; d++) for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4);
          SLOT(o, 2, 0, 'service 270/s · DBs 450/s\noutput 200 of 200 (100%)');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'output 200 of 200/s (100%)'; o.cmd = ['min(9 × 30, 3 × 150) ≥ 200', '200 of 200 = 100%', 'each DB: 66.7 ÷ 150 = 44%']; } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: mkt-01 heats up shard-2',
        story: 'The marketplace mkt-01, a partner from module 8, has 40% of the orders, and murmur3(\'mkt-01\') mod 3 = 2: it lands on shard-2. With the other customers\' share, shard-2 receives 60% of the orders: 120 of the 200 orders/s, 80% of the database, at the knee from module 14; the other two receive 40/s each. With 250 orders/s in total, shard-2 hits the 150/s ceiling, and the system uses 250 of the 450 nominal: 55.6%.',
        look: 'The shard-2 database lights up red with 120 of 150; the other two stay at 40.',
        key: 'Z solves the 200/s, but a hot key heats up a single shard.',
        f(o, t) { ghostAll(o, [2]); shards(o, ['soft', 'soft', 'bad']);
          for (let d = 0; d < 3; d++) for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4, d === 2 ? 1.2 : 0.4, d === 2 ? 'bad' : '');
          [40, 40, 120].forEach((v, d) => SHARD(o, d, `shard-${d} · ${v}/s`, d === 2 ? 'bad' : 'acc')); o.rowTxt[2] = false;
          if (t > 1) SLOT(o, 2, 0, 'shard-2: mkt-01 and 1/3 of the rest\n120 of 150/s · 80%', 'bad');
          if (t > 3.6) SLOT(o, 2, 1, 'with 250/s: shard-2 at the ceiling\n250 of 450 = 55.6%', 'bad');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'shard-2 at 80%';
          o.cmd = ["murmur3('mkt-01') mod 3 = 2", 'shard-2: 40% + 60% ÷ 3 = 60%', '0.6 × 200 = 120 of 150/s (80%)', 'with 250/s: 250 ÷ 450 = 55.6%']; } },
    ],
    conversao: [
      { id: 'm5', dur: 5, title: '(1, 1, 1): 1 monolith, 8 vCPU',
        story: 'The store moves through the cube in the order things hurt, not in the order of the drawing. At the end of module 5 it is at (1, 1, 1): an 8 vCPU monolith, one deploy unit.',
        look: 'A single block in the corner of the cube and the point lit at (1, 1, 1).',
        key: 'The starting point: one program, one copy, one database.',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.rowTxt[0] = 'loja ×1 · 8 vCPU'; o.pt = [1, 1, 1];
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmd = ['1 deploy unit', '8 vCPU']; } },
      { id: 'm6', dur: 6, title: '(1, 9, 1): Y first, 9 deployments',
        story: 'Y came first: 7 services in module 6, and the gateway and 2 BFFs in modules 8 and 9. That is 9 deployments, one pod each: 9 pods. The 7 services add up to 10 vCPU (6 of 1 vCPU and relatorios with 4).',
        look: 'The point climbs the Y axis; each layer gains a pod.',
        key: 'Y first: what hurt was the single program.',
        f(o, t) { const y = 1 + 8 * ease(clamp((t - 0.3) / 2.4)), k = Math.min(9, Math.floor(y + 0.001)); for (let L = 0; L < k; L++) P(o, L, 0, 0, 'on');
          o.pt = [1, y, 1]; o.coord = [1, k, 1]; o.npods = k; o.vcpu = vcpuOf(Array.from({ length: 9 }, (_, L) => L < k ? 1 : 0));
          o.cmd = ['9 deployments × 1 pod = 9 pods', 'vCPU of the 7 services: 6 × 1 + 4 = 10']; } },
      { id: 'm7', dur: 6, title: '(10, 9, 1): then X, 30 pods',
        story: 'Then X: the load balancer from module 7 and the Black Friday from module 14 took the fleet to 30 pods (catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4 and bff-web 4). The 7 services add up to 25 vCPU.',
        look: 'The layers grow to the right and the point moves up to X = 10.',
        key: 'Then X: what hurt was the storefront load.',
        f(o, t) { const x = 1 + 9 * ease(clamp((t - 0.3) / 2.6)), ns = STORE.map(n => Math.min(n, Math.ceil(x - 0.001))); ns.forEach((n, L) => row(o, L, n, 'on'));
          o.pt = [x, 9, 1]; o.coord = [Math.round(x), 9, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = vcpuOf(ns);
          o.cmd = ['10 + 3 + 3 + 2 + 2 + 1 + 1 + 4 + 4', '= 30 pods · 25 vCPU in the 7 services']; } },
      { id: 'm16', dur: 6, title: '(10, 9, 3): Z only on pedidos, 36 pods',
        story: 'Last, Z, in module 16, and only on pedidos: 3 shards × 3 replicas = 9 pods instead of 3. The fleet goes to 30 − 3 + 9 = 36 pods, and the 7 services to 31 vCPU. The 3 in the point only applies to pedidos: each axis grows where the symptom pointed.',
        look: 'The pedidos layer gains two rows toward the back, with their databases; the point moves along the Z axis up to 3.',
        key: 'Pods = per-service sum of replicas × partitions.',
        f(o, t) { storeAll(o, 'on', [2]); const rows = t < 0.8 ? 1 : t < 1.6 ? 2 : 3; shards(o, ['on', 'on', 'on'], 3, rows);
          o.pt = [10, 9, 1 + 2 * ease(clamp((t - 0.6) / 1.6))]; o.coord = [10, 9, rows]; o.npods = 27 + 3 * rows; o.vcpu = 22 + 3 * rows;
          o.cmd = ['30 − 3 + 3 × 3 = 36 pods', '25 − 3 + 9 = 31 vCPU']; } },
      { id: 'pods', dur: 7, title: 'From req/s to pods',
        story: 'The conversion also goes from capacity to number of pods. With 200 orders/s and 30/s per pod, ⌈200 ÷ 30⌉ = 7 pedidos pods, and the database still stops at 150. With 3 shards, each one receives 66.7/s, and 3 pods per shard (90/s) leave headroom.',
        look: 'First a row of 7 copies with the database red; then 3 rows of 3, each with its own database.',
        key: 'From demand to number of pods, without forgetting the database ceiling.',
        f(o, t) { ghostAll(o, [2]);
          if (t < 3.2) { row(o, 2, 7, 'on'); DB(o, 2, 0, 7, 'bad'); SLOT(o, 2, 0, '⌈200 ÷ 30⌉ = 7 pods\nthe DB still stops at 150/s', 'bad'); o.coord = [7, 1, 1]; o.npods = 7; o.vcpu = 7; }
          else { shards(o); SLOT(o, 2, 0, '200 ÷ 3 = 66.7/s per shard\n3 pods per shard = 90/s'); o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; }
          o.extra = 'demand: 200 orders/s'; o.cmd = ['⌈200 ÷ 30⌉ = 7 pods (DB: 150/s)', '200 ÷ 3 shards = 66.7/s', '66.7 ÷ 30 → 3 pods per shard']; } },
      { id: 'erro', dur: 8, title: 'What if it goes wrong: 10 × 4 × 3 = 120 pods',
        story: 'Someone reads the cube as a shopping list. The catalog already has 10 replicas (X); then they split the search into 4 microservices (Y) and add 3 partitions (Z). The product is 10 × 4 × 3 = 120 pods for a service that delivered 100 req/s per replica, and the original symptom (CPU at 99%) never asked for Y or Z. The cost of CPU, of network between the pods and of operations grows with the product of the axes.',
        look: 'The catalog layer multiplies: it goes up to 4 layers and to the back in 3 rows, 120 red blocks.',
        key: 'Each axis is used when the symptom points to it.',
        f(o, t) { const ly = 1 + Math.round(3 * clamp((t - 0.6) / 1.6)), dz = 1 + Math.round(2 * clamp((t - 2.6) / 1.4));
          for (let L = 0; L < ly; L++) for (let d = 0; d < dz; d++) row(o, L, 10, L === 0 && d === 0 ? 'on' : 'bad', d);
          for (let L = 0; L < ly; L++) o.rowTxt[L] = ly === 1 ? `catalogo ×10${dz > 1 ? ' × ' + dz : ''}` : `search ${L + 1} of 4 · 10 × ${dz}`;
          o.pt = [10, 1 + 3 * ease(clamp((t - 0.6) / 1.6)), 1 + 2 * ease(clamp((t - 2.6) / 1.4))];
          const n = 10 * ly * dz; if (t > 4.4) T(o, [OX + 5 * CW, ry(0), lz(4) + 30], '10 × 4 × 3 = 120 pods\nfor 100 req/s per replica', 'bad');
          o.coord = [10, ly, dz]; o.npods = n; o.extra = 'the symptom was CPU at 99%: X only'; o.cmd = ['10 replicas (X)', '× 4 search services (Y)', '× 3 partitions (Z)', `= ${n} pods`]; } },
    ],
  };
  const L_ = () => STEPS[sc], N = () => L_().length;
  const cur = () => L_()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── panel text ──
  const VNOTE = '<li class="h3-dim">vCPU: only the 7 services (1 vCPU per replica; relatorios with 4). The BFFs are left out of the count.</li>';
  const tr = (cells, on) => `<tr${on ? ' class="on"' : ''}>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  const DATA = {
    cubo: () => `<table class="h3-sum"><tr><th>service</th><th>X</th><th>Y</th><th>Z</th></tr>${SV.map((s, L) => tr([s, STORE[L] + (L === 6 ? ' (4 vCPU)' : ''), L < 7 ? 'module 6' : 'module 9', L === 2 ? '1 → 3 (16)' : '1'])).join('')}</table>
      <li>Point = (X replicas, Y functions, Z partitions)</li><li>(1, 1, 1) in module 5 · <b>(10, 9, 1)</b> today · (10, 9, 3) with Z on pedidos</li>
      <li>The 900 ms search: <b>no axis</b>; index (module 4) or cache (module 5)</li>${VNOTE}`,
    x: () => `<li>Catalog peak: <b>640 req/s</b>; each replica handles <b>100</b> (module 14)</li><li>3 replicas: 640 ÷ 3 ≈ <b>213</b> per copy · 10 replicas: 640 ÷ 10 = <b>64</b> (64%)</li>
      <li>Lab HPA: minReplicas 10, maxReplicas 20, 70% CPU target</li><li>With 3 pods, the loop output is close to a third each (example: 33, 35, 32); with 10, about 10 each. <span class="h3-dim">Illustrative numbers: the manifests were not applied to a cluster.</span></li>
      <li>Cart in memory: fix = state in <b>Redis</b> (module 5); IP sticky breaks with NAT (500 people, one IP)</li>`,
    'x-teto': () => `<table class="h3-sum"><tr><th>replicas</th><th>service</th><th>DB</th><th>output of 200</th></tr>${[[3, 0], [5, 1], [6, 2], [7, 3]].map(([n, s]) => tr([n, `${n * 30}/s`, '150/s', `${Math.min(n * 30, 150)}/s (${Math.round(Math.min(n * 30, 150) / 2)}%)`], s === step)).join('')}</table>
      <li><b>30 orders/s</b> per replica (33 ms of CPU per order) · single-primary database: <b>150/s</b></li><li>Next year's Black Friday demand: <b>200 orders/s</b></li>`,
    y: () => `<table class="h3-sum"><tr><th>service</th><th>replicas × vCPU</th><th>team</th></tr>${SV.slice(0, 7).map((s, L) => tr([s, `${STORE[L]} × ${VC[L]}`, TEAM[L] || '—'])).join('')}<tr class="on"><td>total</td><td>25 vCPU</td><td></td></tr></table>
      <li>Monolith: 10 copies × 8 vCPU = <b>80 vCPU</b> · 80 − 25 = 55 less (<b>69%</b>)</li><li>Order 1053 (Caio, Rio, 8:05 PM): 1 blue mug 19.90 + Rio shipping 12.00 = <b>31.90</b>; mug stock 38 → 37</li>
      <li>Checkout: 5 services, 4 hops × 5 ms = <b>+20 ms</b> · service per table: 21 × 5 ms = <b>105 ms</b> (JOIN ≈ 2 ms)</li>`,
    z: () => `<table class="h3-sum"><tr><th>cliente_id</th><th>murmur3 mod 3</th></tr>${[['davi-12', 0], ['lena-77', 1], ['bia-31', 1], ['caio-58', 2], ['mkt-01', 2]].map(([c, s]) => tr([c, 'shard-' + s], c === 'caio-58' && step === 2)).join('')}</table>
      <li>1 DB: 150/s, 50 million rows · 3 shards: 3 × 150 = <b>450/s</b></li><li>200/s ÷ 3 = <b>66.7/s</b> per shard, 44% of each DB</li>
      <li>Connections (pool of 10 per shard): all replicas on all shards → 9 × 10 = <b>90</b> per DB; pods per shard → 3 × 10 = <b>30</b> (max_connections = 100)</li>
      <li>WHERE id = 1042 → reads the 3 shards (scatter-gather, Append) · with cliente_id → 1 shard (partition pruning)</li>`,
    loja: () => `<table class="h3-sum"><tr><th>state</th><th>pods</th><th>service</th><th>DB</th><th>output</th></tr>${[['today (3, 1, 1)', 3, '90/s', '150/s', '90 (45%)', 1], ['X only (7, 1, 1)', 7, '210/s', '150/s', '150 (75%)', 2], ['X + Z (3, 1, 3)', 9, '270/s', '450/s', '200 (100%)', 3]].map(r => tr(r.slice(0, 5), r[5] === step)).join('')}</table>
      <li>Store pods: 30 today · 30 − 3 + 9 = <b>36</b> with Z on pedidos</li><li>mkt-01 (40% of the orders) on shard-2: the shard receives 60%, 120 of 150/s (<b>80%</b>); with 250/s, 250 ÷ 450 = <b>55.6%</b></li>${VNOTE}`,
    conversao: () => `<table class="h3-sum"><tr><th>point</th><th>when</th><th>pods</th><th>vCPU</th></tr>${[['(1, 1, 1)', 'module 5', '1', '8'], ['(1, 9, 1)', 'modules 6, 8, 9', '9', '10'], ['(10, 9, 1)', 'modules 7, 10, 14', '30', '25'], ['(10, 9, 3)', 'module 16', '36', '31']].map((r, i) => tr(r, i === step)).join('')}</table>
      <li>Pods = Σ per service of (X × Z)</li><li>200 orders/s: ⌈200 ÷ 30⌉ = 7 pods, but the DB stops at 150; with 3 shards, 66.7/s each → 3 pods per shard</li>
      <li>All three axes without need: 10 × 4 × 3 = <b>120 pods</b> for a catalog of 100 req/s per replica</li>${VNOTE}`,
  };
  const coordTxt = o => o.coord ? `(${o.coord.join(', ')})` : '—';
  function countHtml() { const o = SP || spec(), bits = [];
    if (o.npods != null) bits.push(`${o.npods} pod${o.npods === 1 ? '' : 's'}`); if (o.vcpu != null) bits.push(`${o.vcpu} vCPU`); if (o.extra) bits.push(o.extra);
    return `<b>${coordTxt(o)}</b><span>point (X, Y, Z)</span><i>${bits.length ? '· ' + bits.join(' · ') : ''}</i>`; }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cmdHtml = o => `<b>${o.cmdLab}</b>${esc(o.cmd.join('\n'))}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scene">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="q3count">${countHtml()}</div>
      <div class="i3-sql" id="q3cmd">${cmdHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cubo') return; const o = SP || spec(), r = document.getElementById('read');
    if (r) r.textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · point ${coordTxt(o)}${o.npods != null ? ' · ' + o.npods + ' pods' : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'cubo' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-cubo3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'cubo') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3() {
    const o = SP = spec();
    // pods
    const seen = new Set();
    for (const [k, s] of o.pods) { const p = podAt(s.L, s.d, s.i); seen.add(k); look(p, s.st);
      if (!p.vis) { p.vis = true; p.g.visible = true; p.t0 = clk; }
      const f = ease(clamp((clk - p.t0) / 0.45)), mk = s.mono ? [1.3, 1.45, 1.3] : [1, 1, 1];
      p.g.scale.set(mk[0], mk[1] * Math.max(0.02, f), mk[2]); }
    for (const [k, p] of PODS) if (!seen.has(k) && p.vis) { p.vis = false; p.g.visible = false; }
    // bancos
    o.dbs.forEach((s, n) => { const b = dbAt(n); look(b, s.st); b.g.position.copy(W(OX + s.j * CW + CW / 2, ry(s.d), lz(s.L) - 2));
      if (!b.vis) { b.vis = true; b.g.visible = true; b.t0 = clk; } b.g.scale.set(1, Math.max(0.02, ease(clamp((clk - b.t0) / 0.45))), 1); });
    for (let n = o.dbs.length; n < DBS.length; n++) { DBS[n].vis = false; DBS[n].g.visible = false; }
    // portão
    if (o.gate) { const want = [GX0, ry(0) - GD / 2, lz(o.gate.L) - 2];
      if (!gate.pos) { gate.pos = want.slice(); gate.to = want; gate.from = want; }
      if (want.some((v, i) => v !== gate.to[i])) { gate.from = gate.pos.slice(); gate.to = want; gate.t0 = clk; }
      const f = ease(clamp((clk - gate.t0) / 0.8)); gate.pos = gate.from.map((v, i) => lerp(v, gate.to[i], f));
      gate.g.visible = true; gate.g.position.copy(W(...gate.pos)); drawGate(o.gate);
    } else { gate.g.visible = false; gate.pos = null; }
    // eixos
    if (xmaxNow !== o.xmax) { xmaxNow += Math.sign(o.xmax - xmaxNow) * Math.min(Math.abs(o.xmax - xmaxNow), 0.25); placeAxes(xmaxNow); }
    drawTicks(Math.round(o.xmax));
    for (const k of ['x', 'y', 'z']) { const on = o.ax.includes(k); axMat[k].color.copy(on ? accent : new THREE.Color(pal3().line)); }
    const AXP = { x: [OX + 5 * CW, FY + 56, PL + 4], y: [AO[0], AO[1], TOP + 72], z: [AO[0] - 4, OY - 70, Z0 + 44 * TK()] };
    for (const k of ['x', 'y', 'z']) AXT[k].set(o.axNote[k] || AXTXT[k], o.axNote[k] ? 'acc' : o.ax.includes(k) ? 'acc' : 'dim').at(...AXP[k]);
    // ponto da loja
    if (o.pt) { const [X, Y, Zp] = o.pt, p = [OX + X * CW, FY - Zp * CD, Z0 + Y * LH - 6];
      PT.visible = true; PT.position.copy(W(...p)); moveGlow(ptGlow, p, 1);
      const gs = [[p, [p[0], p[1], Z0 - 2]], [p, [OX, p[1], p[2]]], [p, [p[0], FY, p[2]]]];
      GUIDES.forEach((m, i) => { m.visible = true; stick(m, ...gs[i], 1.6); });
      if (o.ptLab) PTT.set(coordTxt({ coord: o.pt.map(v => Math.round(v)) }), 'acc').at(p[0] + 44, p[1] - 10, p[2] + 18); else PTT.hide();
    } else { PT.visible = false; ptGlow.material.uniforms.intensity.value = 0; GUIDES.forEach(m => { m.visible = false; }); PTT.hide(); }
    setBeams(o.beams);
    // rótulos de fim de fileira
    for (let L = 0; L < 9; L++) { const ps = [...o.pods.values()].filter(p => p.L === L && p.st !== 'ghost'), ds = o.dbs.filter(b => b.L === L);
      if (!ps.length || o.rowTxt[L] === false) { ROWS[L].hide(); continue; }
      const end = Math.max(...ps.map(p => p.i + 1), ...ds.map(b => b.j + 1)) + (ps.some(p => p.mono) ? 0.15 : 0), dz = new Set(ps.map(p => p.d)).size, n0 = ps.filter(p => p.d === 0).length;
      const txt = o.rowTxt[L] ?? (dz > 1 ? `${SV[L]} · ${n0} × ${dz}` : `${SV[L]} ×${n0}`);
      const tone = ps.some(p => p.st === 'bad') ? 'bad' : ps.some(p => p.st === 'on') ? 'acc' : 'dim';
      ROWS[L].set(txt, tone).at(OX + end * CW + 6, ry(0), mz(L)); }
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    MINI.forEach((t, i) => { const g = o.minis[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    if (o.who) WHO.set(o.who[0], o.who[1]).at(GX0 - 40, ry(0), mz(o.who[2]) + 46); else WHO.hide();
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      const seg_ = m[0].findIndex((q, i) => i && cum[i] >= m[1] * cum[cum.length - 1]), a = m[0][Math.max(0, seg_ - 1)], b = m[0][Math.max(1, seg_)];
      const vert = Math.abs(b[2] - a[2]) > Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
      t.set(m[2], m[3]).at(p[0] - (vert ? 74 : 0), p[1], p[2] + (vert ? 0 : 26)); });
  }

  // ── câmera: enquadra a caixa da cena na área livre (à direita do painel no desktop, acima dele no celular) ──
  function frame(o) { if (o.frame) return o.frame;
    const Ls = [...o.pods.values()].filter(p => p.st !== 'ghost').map(p => p.L).concat(o.dbs.map(b => b.L));
    const lo = Ls.length ? Math.min(...Ls) : 0, hi = Ls.length ? Math.max(...Ls) : 8;
    // até onde vai o conteúdo à direita: o último pod ou banco + o rótulo da fileira, os balões, o ponto
    const live = [...o.pods.values()].filter(p => p.st !== 'ghost'), ends = live.map(p => p.i + 1).concat(o.dbs.map(b => b.j + 1));
    let x1 = Ls.length ? OX + Math.max(...ends) * CW + 150 : OX + Math.max(10, o.xmax) * CW + 100;
    const half = g => Math.max(...String(g[3]).split('\n').map(l => l.length)) * 0.62 * 13 * TK() / 2 + 10;
    o.tags.forEach(g => { x1 = Math.max(x1, g[0] + half(g)); }); o.minis.forEach(g => { x1 = Math.max(x1, g[0] + half(g) * 0.85); });
    if (o.pt) x1 = Math.max(x1, OX + o.pt[0] * CW + 70);
    // cenários da loja inteira: o cubo todo sempre no quadro (o ponto anda por ele)
    const whole = ['cubo', 'y', 'conversao'].includes(sc) || (sc === 'loja' && step === 0);
    if (whole) return [o.gate || o.who ? GX0 - 100 : OX - 70, Math.max(OX + 10 * CW + 110, x1), OY - 60, FY + 40, 0, TOP + 50];
    return [o.gate || o.who ? GX0 - 100 : OX - 70, Math.max(OX + 4 * CW, x1), OY - 60, FY + 40, Math.max(0, lz(lo) - 40), Math.min(TOP + 50, lz(hi) + 130)]; }
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('q3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; }
      const sq = document.getElementById('q3cmd'), sh = cmdHtml(SP); if (sq && sq.innerHTML !== sh) sq.innerHTML = sh; readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      const [x0, x1, y0, y1, z0, z1] = frame(SP);
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      let aW = POSTER ? 0.94 : nar ? 0.98 : 0.98 - side - 150 / innerWidth, aH = POSTER ? 0.9 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.1) : 0.84, fyD = 0.56;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const O = W(x0, y0, z0); let r0 = Infinity, r1 = -Infinity, u0 = Infinity, u1 = -Infinity;
      for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) { const q = W(x, y, z).sub(O), r = q.dot(Rv), u = q.dot(U); r0 = Math.min(r0, r); r1 = Math.max(r1, r); u0 = Math.min(u0, u); u1 = Math.max(u1, u); }
      let D = Math.max((r1 - r0) / 2 / (tn * asp * aW), (u1 - u0) / 2 / (tn * aH)) * 1.12;
      if (!POSTER && !nar) { const aW2 = 0.98 - side, aH2 = 0.5, D2 = Math.max((r1 - r0) / 2 / (tn * asp * aW2), (u1 - u0) / 2 / (tn * aH2)) * 1.12;
        if (D2 < D) { D = D2; aW = aW2; aH = aH2; fyD = 0.4 + aH2 / 2; } }
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.5 : nar ? 0.12 + aH / 2 : fyD;
      const C = O.clone().addScaledVector(Rv, (r0 + r1) / 2).addScaledVector(U, (u0 + u1) / 2);
      const Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), Pp = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(Pp, k);
    }
    if (playing) { dwell += dt; if (dwell >= Math.max(7, cur().dur + 3.5)) next(); }
    tickFlashes(now);
  }
  function key(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') return next();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') return prev();
    if (e.key === 'Home' || e.key === 'r' || e.key === 'R') return reset();
    if (e.key === ' ') return auto();
    if (e.key === 'c' || e.key === 'C') return cycleSc();
    if (/^[1-7]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [gate.top, XT, YT, ZT];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { const light = t === 'light'; crisp(light); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; gate.key = '';
    // vermelho no claro: corpo rosado sem brilho (o preenchimento do tema claro pintaria o brilho com a cor de destaque)
    MAT.bad.color.set(light ? 0xf3c7c1 : THEMES[t].body); MAT.bad.emissiveIntensity = light ? 0 : 0.7;
    MAT.ghost.color.set(light ? 0xc9cccd : 0x2a2d30); MAT.ghost.opacity = light ? 0.22 : 0.16;
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); guideMat.color.copy(accent); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scene', 'C', cycleSc]],
    view: { target: W(OX + 160, 120, 140), dist: NARROW() ? 15 : 14, dir: new THREE.Vector3(-0.32, 0.58, 1) },
    info: panelHtml(),
    hint: 'next: → · back: ← · scene: C or 1–7 · drag to rotate' };
})() });
