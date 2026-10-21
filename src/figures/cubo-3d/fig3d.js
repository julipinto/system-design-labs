// Figura 3D (iso-glow): o Scale Cube da loja. Um cubo de arestas finas com três eixos graduados: X (réplicas, para a direita),
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
  const nf = (v, d = 1) => { const r = Math.round(v * 10 ** d) / 10 ** d; return Number.isInteger(r) ? String(r) : r.toFixed(d).replace('.', ','); };

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SV = ['catalogo', 'carrinho', 'pedidos', 'pagamentos', 'estoque', 'entregas', 'relatorios', 'bff-app', 'bff-web'];
  const STORE = [10, 3, 3, 2, 2, 1, 1, 4, 4];          // réplicas na Black Friday: 30 pods
  const VC = [1, 1, 1, 1, 1, 1, 4];                    // vCPU por réplica dos 7 serviços (os BFFs não entram na conta)
  const TEAM = ['Vitrine', 'Checkout', 'Checkout', 'Checkout', 'Logística', 'Logística'];
  const HOST = [11, 9, 10, 12, 8, 10, 9, 11, 10, 10];  // 100 respostas de /hostname por pod (ilustrativo: "cerca de 10 cada")
  const SEQ = (() => { const a = []; HOST.forEach((c, p) => { for (let k = 0; k < c; k++) a.push(p); }); let s = 7;
    for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) % 2147483648; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; })();
  const vcpuOf = ns => ns.slice(0, 7).reduce((a, n, L) => a + n * VC[L], 0);
  const SC = ['cubo', 'x', 'x-teto', 'y', 'z', 'loja', 'conversao'];
  const SCNAME = { cubo: 'Cubo', x: 'X', 'x-teto': 'Teto do X', y: 'Y', z: 'Z', loja: 'Loja', conversao: 'Conversão' };
  const SCFULL = { cubo: 'O cubo e o ponto da loja', x: 'Eixo X: clonar', 'x-teto': 'Eixo X: o teto do banco', y: 'Eixo Y: separar por função',
    z: 'Eixo Z: separar por dados', loja: 'A loja em (10, 9, 3)', conversao: 'Conversão: o ponto anda' };
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
  const AXTXT = { x: 'X → réplicas\nclonar', y: 'Y ↑ serviços\nseparar por função', z: 'Z ↖ partições\nseparar por dados' };

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
      coord: null, npods: null, vcpu: null, extra: '', cmdLab: 'A CONTA', cmd: [], who: null, frame: null };
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
    ghostAll(o, [2]); GATE(o, 2, 'Service', 'pedidos · 200/s'); o.who = ['200 pedidos/s\nano que vem', 'hi', 2];
    flow(o, R.src(2), t, 0, 0.6);
    for (let i = 0; i < nNew; i++) { const idle = i >= 5; P(o, 2, 0, i, idle ? 'soft' : 'on');
      if (!idle) { flow(o, R.g2p(2, 0, i), t, i / 5); flow(o, R.p2db(2, 0, i, j), t, i / 5 + 0.5); } else quiet(o, R.g2p(2, 0, i), R.p2db(2, 0, i, j)); }
    DB(o, 2, 0, j, full ? 'bad' : 'on');
    T(o, ABOVE(2, (nNew - 1) / 2, 0, 1.6), `${nNew} × 30 = ${nNew * 30}/s`, nNew > 5 ? 'dim' : 'acc');
    T(o, ABOVE(2, j, 0, 2.6), `banco: ${out} de 150/s${nNew * 30 > 150 ? `\n${Math.min(nNew * 30, 200) - 150}/s ficam de fora` : ''}`, full ? 'bad' : 'acc');
    o.coord = [nNew, 1, 1]; o.npods = nNew; o.vcpu = nNew;
    o.extra = `saída ${out} de 200/s (${Math.round(out / 2)}%)`;
    o.cmd = [`serviço: ${nNew} × 30 = ${nNew * 30}/s`, 'banco: 150/s (um primário)', `saída: ${out} de 200 (${Math.round(out / 2)}%)`];
    return out;
  }
  // o pedidos com Z: 3 fileiras (shard-0, -1, -2), 3 réplicas e um banco cada
  function shards(o, st = ['on', 'on', 'on'], j = 3, rows = 3) {
    for (let d = 0; d < rows; d++) { row(o, 2, 3, st[d], d); DB(o, 2, d, j, st[d]); }
  }

  const STEPS = {
    cubo: [
      { id: 'eixos', dur: 6, title: 'Três eixos, três perguntas',
        story: 'A AKF Partners criou o cubo em 2007 como uma linguagem comum para discutir escala. Cada eixo é uma pergunta. X: copio o serviço? São N cópias idênticas, e cada uma atende 1/N da carga. Y: separo o que é diferente? Por verbo (um caso de uso, como checkout) ou por substantivo (uma entidade, como clientes). Z: separo o que é igual, mas grande demais? O mesmo código, cada cópia com um pedaço dos dados, e um roteador que escolhe o pedaço.',
        look: 'Os eixos acendem um de cada vez: X para a direita (réplicas), Y para cima (serviços), Z para o fundo (partições).',
        key: 'O Scale Cube é um vocabulário de três perguntas: copio? separo o que é diferente? separo o que é igual, mas grande demais?',
        f(o, t) { o.ax = t < 1.8 ? 'x' : t < 3.6 ? 'xy' : 'xyz'; o.cmdLab = 'As três perguntas';
          o.cmd = ['X · copio o serviço?', 'Y · separo o que é diferente?', 'Z · separo o que é igual,', '    mas grande demais?'];
          o.axNote.x = 'X → réplicas · clonar\nN cópias, cada uma com 1/N da carga';
          if (t > 1.8) o.axNote.y = 'Y ↑ serviços · separar por função\num serviço por verbo ou por substantivo';
          if (t > 3.6) o.axNote.z = 'Z ↖ partições · separar por dados\no mesmo código, cada um com um pedaço'; } },
      { id: 'p111', dur: 5, title: '(1, 1, 1): o monolito do módulo 5',
        story: 'No fim do módulo 5 a loja era um programa só: o monolito loja, com 8 vCPU e um banco. Uma cópia (X = 1), uma função que faz tudo (Y = 1) e os dados inteiros num lugar (Z = 1). É o ponto (1, 1, 1), o canto do cubo.',
        look: 'Um bloco só, no canto do cubo, e o ponto da loja aceso no canto dele.',
        key: 'As coordenadas são (réplicas X, funções Y, partições Z).',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.pt = [1, 1, 1]; o.rowTxt[0] = 'loja ×1 · 8 vCPU';
          if (t > 0.8) T(o, ABOVE(0, 0, 0, 2.4), 'loja · monolito\n8 vCPU · 1 banco');
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmdLab = 'O ponto'; o.cmd = ['(réplicas X, funções Y, partições Z)', '= (1, 1, 1)']; } },
      { id: 'p191', dur: 6, title: '(1, 9, 1): o Y andou primeiro',
        story: 'O módulo 6 partiu o programa em 7 serviços, cada um com o seu banco: catalogo, carrinho, pedidos, pagamentos, estoque, entregas e relatorios. Os módulos 8 e 9 puseram o gateway e 2 BFFs na frente, e a loja chegou a 9 deployments. Ainda uma cópia de cada: o ponto sobe pelo eixo Y até (1, 9, 1).',
        look: 'O monolito se desfaz em 9 camadas, uma por deployment, e o ponto sobe de 1 a 9 no eixo Y.',
        key: 'O Y separa o que é diferente: cada serviço vira uma camada do cubo.',
        f(o, t) { const y = 1 + 8 * ease(clamp((t - 0.4) / 2.6)), k = Math.min(9, Math.floor(y + 0.001));
          for (let L = 0; L < k; L++) P(o, 0 + L, 0, 0, 'on'); o.pt = [1, y, 1];
          const ns = Array.from({ length: 9 }, (_, L) => L < k ? 1 : 0);
          o.coord = [1, k, 1]; o.npods = k; o.vcpu = vcpuOf(ns);
          if (t > 3.2) T(o, [cx(6), ry(0), mz(5)], '9 deployments\n7 serviços + 2 BFFs');
          o.cmd = ['módulo 6: 7 serviços, um banco cada', 'módulos 8 e 9: gateway e 2 BFFs', `= ${k} deployment${k > 1 ? 's' : ''}: (1, ${k}, 1)`]; } },
      { id: 'p1091', dur: 6.5, title: '(10, 9, 1): depois o X, e o Z ficou em 1',
        story: 'O módulo 7 pôs o lb-loja na frente de 10 cópias do catalogo, e a Black Friday do módulo 14 fechou a frota em 30 pods: catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4 e bff-web 4. O ponto anda até (10, 9, 1). O X parou em 10, o Y em 9, e o Z ficou em 1: é o eixo que a loja ainda não usou.',
        look: 'As camadas crescem para a direita com as réplicas de cada serviço e o ponto vai até X = 10. O eixo Z apaga: ninguém andou por ele.',
        key: 'Hoje a loja está em (10, 9, 1): andou em X e em Y, nunca em Z.',
        f(o, t) { const x = 1 + 9 * ease(clamp((t - 0.3) / 2.8)), ns = STORE.map(n => Math.min(n, Math.ceil(x - 0.001)));
          ns.forEach((n, L) => row(o, L, n, 'on')); o.pt = [x, 9, 1];
          o.coord = [Math.round(x), 9, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = vcpuOf(ns);
          if (t > 3.3) { o.ax = 'xy'; o.axNote.z = 'Z = 1\nainda não usado'; }
          o.cmd = ['X: até 10 (catalogo)', 'Y: 9 deployments', 'Z: 1 em tudo', '→ (10, 9, 1) · 30 pods']; } },
      { id: 'erro', dur: 7.5, title: 'E se der errado: o eixo certo para o sintoma errado',
        story: 'A busca leva 900 ms por requisição, e a reação óbvia é clonar: de 10 para 20 réplicas. A fila cai, porque há mais atendentes, mas cada busca continua levando 900 ms: o tempo de uma requisição vem do código dela, e o X não toca no código. E a conta sobe: no catálogo, 10 para 20 réplicas de 1 vCPU dobram a CPU, de 10 para 20 vCPU. Escala não conserta código lento; a saída é um índice (módulo 4) ou um cache (módulo 5).',
        look: 'A camada do catalogo dobra para 20 cópias e passa da borda do cubo; as 10 novas ficam vermelhas, e o balão da busca continua em 900 ms.',
        key: 'Sintoma antes do eixo: a busca de 900 ms não é problema de escala.',
        f(o, t) { o.xmax = 20; const n = 10 + Math.round(10 * clamp((t - 0.6) / 2.4));
          STORE.forEach((m, L) => { if (L) row(o, L, m, 'on'); }); row(o, 0, 10, 'on'); row(o, 0, n, 'bad', 0, 10);
          o.pt = [n, 9, 1]; o.coord = [n, 9, 1]; o.npods = 20 + n; o.vcpu = 15 + n; o.extra = 'cada busca: 900 ms, igual';
          if (t > 1.2) T(o, [cx(12), ry(0), mz(4)], 'cada busca: 900 ms\ncom 10 ou com 20 réplicas', 'bad');
          if (t > 3.4) T(o, [cx(17), ry(0), mz(1) + 10], 'CPU do catálogo\n10 → 20 vCPU', 'bad');
          if (t > 4.6) T(o, [cx(15), ry(0), mz(6)], 'a saída: índice (módulo 4)\nou cache (módulo 5)', 'dim');
          o.cmd = ['busca com 10 réplicas: 900 ms', `busca com ${n} réplicas: 900 ms`, `CPU: 10 × 1 → ${n} × 1 vCPU`]; } },
    ],
    x: [
      { id: 'apply', dur: 5.5, title: 'kubectl apply: 3 cópias para 640 req/s',
        story: 'O pico do catálogo é 640 req/s (módulo 14), e cada réplica aguenta 100. O laboratório da aula 3 começa com kubectl apply: um Deployment de 3 réplicas atrás de um Service. Com 3 cópias, cada uma recebe 640 ÷ 3 ≈ 213 req/s, mais do que o dobro do que aguenta.',
        look: 'O lb-loja recebe os 640 req/s e divide entre 3 cópias do catalogo, que acendem em vermelho: estão acima de 100 req/s.',
        key: 'X = 1/N: cada cópia recebe uma fração da carga.',
        f(o, t) { ghostAll(o, [0]); row(o, 0, 3, 'bad'); GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\npico do catálogo', 'hi', 0];
          flow(o, R.src(0), t); for (let i = 0; i < 3; i++) flow(o, R.g2p(0, 0, i), t, i / 3, 0.7, 'bad');
          if (t > 1.2) SLOT(o, 0, 0, '640 ÷ 3 ≈ 213 req/s cada\ncada uma aguenta 100', 'bad');
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = '≈ 213 req/s por cópia';
          o.cmdLab = 'Comando real'; o.cmd = ['kubectl apply -f catalogo.yaml', 'kubectl get pods -l app=catalogo', '→ 3 pods']; } },
      { id: 'scale', dur: 6, title: 'kubectl scale --replicas=10: 640 ÷ 10 = 64',
        story: 'kubectl scale deployment catalogo --replicas=10 leva o Deployment a 10 pods, o catálogo do módulo 7. O lb-loja divide os mesmos 640 req/s por 10: 64 req/s por cópia, 64% do que cada uma aguenta. É a fração 1/N de Richardson, e é o X inteiro: cópias idênticas e uma divisão.',
        look: 'Sete cópias novas aparecem na camada do catalogo e todas ficam acesas, com 64 req/s cada.',
        key: 'O X é copiar o serviço e dividir o tráfego: 640 ÷ 10 = 64.',
        f(o, t) { ghostAll(o, [0]); const n = 3 + Math.round(7 * clamp((t - 0.5) / 2)); row(o, 0, n, n < 7 ? 'bad' : 'on');
          GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\npico do catálogo', 'hi', 0];
          flow(o, R.src(0), t); for (let i = 0; i < n; i++) flow(o, R.g2p(0, 0, i), t, i / n, 0.7, n < 7 ? 'bad' : '');
          if (t > 2.8) SLOT(o, 0, 1, '640 ÷ 10 = 64 req/s cada\n64% de 100');
          o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n; o.extra = `${nf(640 / n, 0)} req/s por cópia`;
          o.cmdLab = 'Comando real'; o.cmd = ['kubectl scale deployment catalogo \\', '  --replicas=10', `→ ${n} pods`]; } },
      { id: 'hostname', dur: 7.5, title: '100 chamadas: cada pod diz o nome',
        story: 'De dentro do cluster, o laço chama o Service 100 vezes no endereço /hostname, e cada resposta traz o nome do pod que atendeu. Com 10 pods, são 10 nomes e cerca de 10 respostas para cada um. A divisão não é exata e não precisa ser: o que prova o X é que todos os nomes aparecem. É o mesmo problema de seleção do round-robin/main.go do autor, agora dentro do Service.',
        look: 'A luz sai do lb-loja para uma cópia de cada vez, e o número em cima de cada pod conta as respostas que ele deu.',
        key: 'A prova de que as cópias são idênticas é cada resposta dizer um nome de pod diferente.',
        f(o, t) { ghostAll(o, [0]); GATE(o, 0, 'lb-loja', 'Service catalogo'); o.who = ['curl /hostname\n100 vezes', 'hi', 0];
          const k = Math.floor(clamp((t - 0.4) / 5) * 100), cnt = Array(10).fill(0); for (let q = 0; q < k; q++) cnt[SEQ[q]]++;
          const cur = k > 0 && k < 100 ? SEQ[k] : -1;
          for (let i = 0; i < 10; i++) { P(o, 0, 0, i, i === cur ? 'on' : 'soft'); M(o, ABOVE(0, i, 0, 0.8), String(cnt[i]), cnt[i] ? 'acc' : 'dim'); }
          if (cur >= 0) { o.beams.push({ pts: R.src(0), on: true }); o.beams.push({ pts: R.g2p(0, 0, cur), on: true, dot: (t * 20) % 1 }); }
          for (let i = 0; i < 10; i++) if (i !== cur) quiet(o, R.g2p(0, 0, i));
          if (k >= 100) SLOT(o, 0, 1, '10 nomes, cerca de 10 cada\n(saída ilustrativa)');
          o.coord = [10, 1, 1]; o.npods = 10; o.vcpu = 10; o.extra = `${k} de 100 respostas`;
          o.cmdLab = 'Comando real'; o.cmd = ['for i in $(seq 1 100); do', '  curl -s catalogo/hostname; echo', 'done | sort | uniq -c']; } },
      { id: 'delete', dur: 6.5, title: 'kubectl delete pod: o Deployment repõe',
        story: 'kubectl delete pod apaga uma das cópias. O Deployment percebe que faltam 1 de 10 e cria outra, com outro nome. É isso que torna o X simples: cópias são descartáveis e repostas sozinhas. O cuidado está em tirar a cópia sem derrubar quem ela atendia: sem readinessProbe e sem encerramento gracioso, o Service ainda manda conexões para ela por alguns segundos (módulo 22).',
        look: 'A cópia 4 fica vermelha e some; segundos depois uma nova acende no lugar dela.',
        key: 'Pods são descartáveis: apagar um faz o Deployment criar outro.',
        f(o, t) { ghostAll(o, [0]); GATE(o, 0, 'lb-loja', '203.0.113.10'); o.who = ['640 req/s\npico do catálogo', 'hi', 0]; flow(o, R.src(0), t);
          const ph = t < 1 ? 'ok' : t < 2.4 ? 'bad' : t < 3.6 ? 'gone' : 'new';
          for (let i = 0; i < 10; i++) { if (i === 3 && ph === 'gone') continue; P(o, 0, 0, i, i === 3 && ph === 'bad' ? 'bad' : 'on');
            flow(o, R.g2p(0, 0, i), t, i / 10, 0.7, i === 3 && ph === 'bad' ? 'bad' : ''); }
          if (ph === 'bad' || ph === 'gone') SLOT(o, 0, 1, 'kubectl delete pod\na cópia 4 sai', 'bad');
          if (ph === 'new') SLOT(o, 0, 1, 'o Deployment cria outra\n10 de 10 de novo');
          const n = ph === 'gone' ? 9 : 10; o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n; o.extra = ph === 'gone' ? 'faltam 1 de 10' : '640 ÷ 10 = 64 req/s por cópia';
          o.cmdLab = 'Comando real'; o.cmd = ['kubectl delete pod <nome>', 'kubectl get pods -l app=catalogo', `→ ${n} pods${ph === 'new' ? ' (um nome novo)' : ''}`]; } },
      { id: 'erro', dur: 8, title: 'E se der errado: o carrinho na memória',
        story: 'O carrinho guarda o carrinho na memória de cada réplica. A Lena põe o gato no carrinho e a requisição cai na réplica 1. Ao abrir a página do carrinho, o lb-loja a manda para a réplica 2, que nunca ouviu falar do gato: o carrinho aparece vazio. O conserto é guardar o estado no Redis (módulo 5), que qualquer réplica lê. O sticky por IP prende a Lena à réplica 1, mas quebra com NAT: 500 pessoas de um escritório chegam com o mesmo IP e caem todas na mesma réplica.',
        look: 'Na camada do carrinho, a luz leva o gato até a réplica 1; a segunda requisição vai para a réplica 2, que acende em vermelho com o carrinho vazio.',
        key: 'O X só funciona com cópias intercambiáveis: nada de estado na memória do processo.',
        f(o, t) { ghostAll(o, [1]); row(o, 1, 3, 'off'); GATE(o, 1, 'lb-loja', '203.0.113.10'); o.who = ['Lena · Recife', 'dim', 1];
          const p1 = [...R.src(1), ...R.g2p(1, 0, 0)], p2 = [...R.src(1), ...R.g2p(1, 0, 1)];
          if (send(o, t, 0.3, 1.6, p1, 'POST /carrinho · gato', 'hi', 0.5, true)) { P(o, 1, 0, 0, 'on'); SLOT(o, 1, 0, 'carrinho-1 · memória\ngato de pelúcia ×1'); }
          if (send(o, t, 3.0, 4.3, p2, 'GET /carrinho', 'hi', 0.3, true)) { P(o, 1, 0, 1, 'bad'); SLOT(o, 1, 1, 'carrinho-2 · memória\nvazio: nunca viu o gato', 'bad'); }
          if (t > 4.6) send(o, t, 4.6, 5.8, rev(p2), '200 · carrinho vazio', 'bad', 1, true);
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = t > 4.3 ? 'carrinho vazio na réplica 2' : 'a Lena põe o gato';
          o.cmdLab = 'Requisições'; o.cmd = ['POST /carrinho → carrinho-1', ...(t > 3 ? ['GET  /carrinho → carrinho-2'] : []), ...(t > 4.6 ? ['→ 200 · carrinho vazio'] : [])]; } },
    ],
    'x-teto': [
      { id: 'hoje', dur: 5.5, title: 'pedidos em (3, 1, 1): sai 90 de 200',
        story: 'O pedidos faz 30 pedidos/s por réplica (33 ms de CPU por pedido, a conta do módulo 14), e o banco dele, um primário só, aguenta 150/s. A Black Friday do ano que vem pede 200 pedidos/s. Com as 3 réplicas de hoje, o serviço dá 3 × 30 = 90/s: sai 90 de 200, 45%.',
        look: 'Três cópias do pedidos acesas e o banco no fim da fileira; o balão do banco marca 90 de 150.',
        key: 'Hoje o elo que limita é o serviço: 90/s.',
        f(o, t) { teto(o, t, 3); } },
      { id: 'cinco', dur: 5.5, title: '5 réplicas: 150/s, o teto do banco',
        story: 'Clonar resolve enquanto o gargalo é o serviço. Com 5 réplicas, o serviço dá 5 × 30 = 150/s, e o banco chega aos 150/s dele. A saída sobe de 90 para 150 de 200: 75%.',
        look: 'Duas cópias novas acendem; o balão do banco chega a 150 de 150 e fica vermelho.',
        key: 'Até 5 réplicas, cada cópia nova acrescenta 30 pedidos/s.',
        f(o, t) { teto(o, t, t < 0.8 ? 3 : t < 1.6 ? 4 : 5); } },
      { id: 'seis', dur: 5.5, title: 'A sexta réplica não acrescenta nada',
        story: 'Com a sexta réplica, o serviço daria 6 × 30 = 180/s, mas o banco continua em 150. A saída não se mexe: 150 de 200. A cópia nova fica esperando o banco.',
        look: 'A sexta cópia acende pela metade, sem trabalho; o banco continua vermelho, em 150 de 150.',
        key: 'Depois do teto do banco, réplica nova é custo sem ganho.',
        f(o, t) { teto(o, t, 6); if (t > 1.2) T(o, ABOVE(2, 3, 0, 4.6), 'a 6ª réplica\nnão acrescenta nada', 'dim'); } },
      { id: 'erro', dur: 7.5, title: 'E se der errado: 7 réplicas, e a saída para em 150',
        story: 'A equipe insiste no X e sobe o pedidos para 7 réplicas: (7, 1, 1). O serviço passa a dar 7 × 30 = 210/s, mais do que os 200 pedidos. Mas a saída para em 150/s, 75%: o banco é um primário só, e clonar o serviço não o move. O gargalo saiu do serviço e ficou no banco. Para dividir o banco é preciso outro eixo: o Z (aula 5).',
        look: 'Sete cópias acesas, duas sem trabalho; o banco vermelho no teto de 150/s, e 50 pedidos/s ficam de fora.',
        key: 'O banco para o X: 210/s de serviço, 150/s de saída.',
        f(o, t) { teto(o, t, 7); } },
    ],
    y: [
      { id: 'mono', dur: 5, title: '(1, 1, 1): um programa de 8 vCPU',
        story: 'No fim do módulo 5, a loja era o monolito loja: um programa de 8 vCPU com um banco só e tudo dentro dele, de catálogo a relatórios. O relatório pesado e a página de 10 ms dividiam o mesmo tamanho de máquina.',
        look: 'Um bloco só, no canto do cubo, com as 7 funções dentro.',
        key: 'No monolito, todas as funções têm o mesmo tamanho de máquina.',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.pt = [1, 1, 1]; o.rowTxt[0] = 'loja ×1 · 8 vCPU';
          if (t > 0.6) T(o, [cx(5), ry(0), mz(3)], 'loja · 8 vCPU · 1 banco\ncatalogo · carrinho · pedidos\npagamentos · estoque\nentregas · relatorios');
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmd = ['1 cópia × 8 vCPU = 8 vCPU']; } },
      { id: 'mono10', dur: 6, title: 'Black Friday só com X: 10 × 8 = 80 vCPU',
        story: 'Para aguentar a vitrine da Black Friday clonando o monolito inteiro, a loja precisaria de 10 cópias de 8 vCPU: 80 vCPU. Cada cópia leva junto o relatório de 4 vCPU e todo o resto, mesmo que só o catálogo esteja cheio.',
        look: 'O monolito vira 10 cópias ao longo do eixo X; o contador de vCPU sobe até 80.',
        key: 'Clonar o monolito clona também o que não precisava crescer.',
        f(o, t) { const n = 1 + Math.round(9 * clamp((t - 0.4) / 2.4)); for (let i = 0; i < n; i++) P(o, 0, 0, i, 'on', true);
          o.rowTxt[0] = `loja ×${n} · ${n * 8} vCPU`; o.pt = [n, 1, 1];
          if (t > 3) T(o, ABOVE(0, 5, 0, 2.4), '10 × 8 = 80 vCPU\ncada cópia leva o relatório junto');
          o.coord = [n, 1, 1]; o.npods = n; o.vcpu = n * 8; o.cmd = [`${n} cópia${n > 1 ? 's' : ''} × 8 vCPU = ${n * 8} vCPU`]; } },
      { id: 'parte', dur: 7, title: 'O Y: 7 serviços, 25 vCPU',
        story: 'O módulo 6 partiu o programa em 7 serviços, cada um com o seu banco e do seu tamanho. Na Black Friday: catalogo 10 × 1, carrinho 3 × 1, pedidos 3 × 1, pagamentos 2 × 1, estoque 2 × 1, entregas 1 × 1 e relatorios 1 × 4 vCPU. Somam 25 vCPU contra 80: 55 a menos, 69%. Os times também se separam: Vitrine no catálogo, Checkout em carrinho, pedidos e pagamentos, Logística em estoque e entregas.',
        look: 'As 10 cópias do monolito se desfazem em 7 camadas, cada uma com as suas réplicas e o seu banco; o contador cai de 80 para 25 vCPU.',
        key: 'O Y separa o que é diferente para que cada parte escale do seu jeito e tenha dono.',
        f(o, t) { if (t < 0.9) { for (let i = 0; i < 10; i++) P(o, 0, 0, i, 'soft', true); o.rowTxt[0] = 'loja ×10 · 80 vCPU'; o.pt = [10, 1, 1]; o.coord = [10, 1, 1]; o.npods = 10; o.vcpu = 80; o.cmd = ['10 × 8 = 80 vCPU']; return; }
          const f = clamp((t - 0.9) / 2.2), ns = STORE.slice(0, 7).map(n => Math.max(1, Math.min(n, Math.ceil(f * 10 - 0.001))));
          ns.forEach((n, L) => { row(o, L, n, 'on'); o.rowTxt[L] = L < 6 ? `${SV[L]} ×${n} · ${TEAM[L]}` : 'relatorios ×1 · 4 vCPU'; if (t > 3.3) DB(o, L, 0, n + 0.15, 'soft'); });
          const v = Math.round(lerp(80, 25, ease(f))); o.pt = [10, 1 + 6 * ease(clamp((t - 0.9) / 1.6)), 1];
          if (t > 3.6) T(o, [OX + 6 * CW, ry(0), lz(7) + 34], '25 vCPU contra 80\n55 a menos, 69%');
          o.coord = [10, 7, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = f >= 1 ? 25 : v;
          o.cmd = ['10 + 3 + 3 + 2 + 2 + 1 + 4 = 25 vCPU', '80 − 25 = 55 vCPU a menos (69%)']; } },
      { id: 'checkout', dur: 8, title: 'O checkout do 1053 atravessa 5 serviços',
        story: 'Às 20:05 da Black Friday, o Caio, no Rio, compra 1 caneca azul (19,90) com o frete do Rio (12,00): pedido 1053, 31,90. O checkout é um corte por verbo: atravessa carrinho → pedidos → pagamentos → estoque → entregas, cinco serviços e quatro saltos de rede de 5 ms, +20 ms (módulo 6). No estoque, a caneca vai de 38 para 37. O catalogo é o corte por substantivo: uma entidade, o produto.',
        look: 'A luz do pedido 1053 entra no carrinho e sobe pelas camadas até as entregas; a cada salto o painel soma 5 ms.',
        key: 'Por verbo (checkout) ou por substantivo (catalogo): cada serviço com os seus dados.',
        f(o, t) { STORE.slice(0, 7).forEach((n, L) => row(o, L, n, L === 0 ? 'soft' : 'off')); o.who = ['Caio · Rio', 'dim', 1];
          const path = [[GX0 - 70, fr(0) + 5, mz(1)], [cx(0), fr(0) + 5, mz(1)], [cx(0), fr(0) + 5, mz(5)]];
          send(o, t, 0.4, 6.0, path, '1053 · 31,90', 'acc', 9, true);
          const f = ease(clamp((t - 0.4) / 5.6)), p = alongPts(path, cumLen(path), f), at = p[0] >= cx(0) - 1 ? Math.min(5, Math.max(1, Math.round((p[2] - mz(0)) / LH))) : 0;
          for (let L = 1; L <= at; L++) row(o, L, STORE[L], L === at ? 'on' : 'soft');
          const ms = Math.max(0, at - 1) * 5;
          if (at >= 4) T(o, [cx(10.5), ry(0), mz(4)], 'estoque · caneca azul\n38 → 37');
          if (t > 6.2) T(o, [cx(10.5), ry(0), mz(6) + 8], '5 serviços, 4 saltos\n4 × 5 ms = +20 ms');
          T(o, [cx(10.5), ry(0), mz(2)], 'catalogo: substantivo\ncheckout: verbo', 'dim');
          o.coord = [10, 7, 1]; o.npods = 22; o.vcpu = 25; o.extra = `+${ms} ms de rede`;
          o.cmdLab = 'O pedido 1053'; o.cmd = ['1 caneca azul        19,90', 'frete Rio            12,00', 'total                31,90', `saltos: ${Math.max(0, at - 1)} × 5 ms = +${ms} ms`]; } },
      { id: 'erro', dur: 8, title: 'E se der errado: serviço por tabela',
        story: 'Alguém separa itens_pedido em um serviço próprio, porque "é outra entidade". A tela "meus pedidos" mostra 20 pedidos: antes era um JOIN de uns 2 ms; agora é 1 chamada para listar os pedidos e 20 para buscar os itens de cada um, 21 × 5 ms = 105 ms só de rede. E a transação única some: o estorno do módulo 6, que era um ROLLBACK, vira a saga do módulo 19.',
        look: 'Uma camada nova, itens_pedido, aparece em vermelho no alto; as chamadas correm do pedidos até ela, uma por pedido, e o contador vai a 105 ms.',
        key: 'O Y corta pela fronteira do negócio, não por tabela.',
        f(o, t) { STORE.slice(0, 7).forEach((n, L) => row(o, L, n, L === 2 ? 'on' : 'ghost')); P(o, 7, 0, 0, 'bad'); o.rowTxt[7] = 'itens_pedido ×1 · novo';
          o.who = ['"meus pedidos"\n20 pedidos', 'dim', 2];
          const k = Math.min(21, Math.floor(clamp((t - 0.4) / 5.2) * 21 + (t > 0.4 ? 1 : 0)));
          if (k >= 1) { const ph = ((t - 0.4) * 21 / 5.2) % 1; if (k === 1) o.beams.push({ pts: [[GX0 - 70, fr(0) + 5, mz(2)], [cx(0), fr(0) + 5, mz(2)]], on: true, dot: ph });
            else quiet(o, [[GX0 - 70, fr(0) + 5, mz(2)], [cx(0), fr(0) + 5, mz(2)]]);
            if (k > 1 && k < 21) o.beams.push({ pts: R.up(0, 2, 7), on: true, dot: ph, tone: 'bad' }); else if (k >= 21) o.beams.push({ pts: R.up(0, 2, 7), on: true, tone: 'bad' }); }
          if (k >= 21) T(o, [cx(8), ry(0), mz(7)], '21 × 5 ms = 105 ms\no JOIN levava ~2 ms', 'bad');
          if (t > 6.4) T(o, [cx(8), ry(0), mz(4)], 'e a transação única some\nROLLBACK vira saga (módulo 19)', 'dim');
          o.coord = [10, 8, 1]; o.npods = 23; o.extra = `${k} chamada${k === 1 ? '' : 's'} · ${k * 5} ms de rede`;
          o.cmdLab = 'A tela "meus pedidos"'; o.cmd = ['antes:  1 JOIN ≈ 2 ms', 'depois: 1 + 20 chamadas', `        ${k} × 5 ms = ${k * 5} ms`]; } },
    ],
    z: [
      { id: 'um', dur: 5.5, title: 'pedidos: 3 réplicas e um banco só',
        story: 'Depois do Y, o pedidos tem o seu banco; depois do X, tem 3 réplicas. Mas o banco continua um só: um primário de 150 pedidos/s com 50 milhões de linhas, e clonar o serviço não o move (o teto do X). É o buraco do cubo: o eixo Z, que a loja nunca usou.',
        look: 'A camada do pedidos com 3 cópias e o banco no fim da fileira, aceso: 150/s e 50 milhões de linhas.',
        key: 'O Z separa o que é igual, mas grande demais.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 3, 'on'); DB(o, 2, 0, 3, 'on'); for (let i = 0; i < 3; i++) flow(o, R.p2db(2, 0, i, 3), t, i / 3);
          if (t > 0.8) SLOT(o, 2, 0, 'banco do pedidos\n150/s · 50 milhões de linhas');
          o.ax = t > 2.4 ? 'z' : 'xyz'; o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = 'um banco: 150 pedidos/s';
          o.cmd = ['réplicas: 3 × 30 = 90/s', 'banco: 1 primário = 150/s', 'linhas: 50 milhões']; } },
      { id: 'shards', dur: 6.5, title: 'O Z: 3 shards por cliente_id',
        story: 'O Z parte o banco por uma chave. Com o cliente_id e 3 shards, cada shard guarda só os pedidos dos clientes que caem nele, e cada um tem as suas 3 réplicas do pedidos: shard-0, shard-1 e shard-2. É o que o módulo 16 constrói; aqui é a promessa. O ponto do pedidos vai de (3, 1, 1) para (3, 1, 3): 9 pods.',
        look: 'Duas fileiras novas aparecem atrás da primeira, ao longo do eixo Z, cada uma com 3 cópias e o seu banco.',
        key: 'O Z: o mesmo código, cada instância com um pedaço dos dados.',
        f(o, t) { ghostAll(o, [2]); const rows = t < 0.8 ? 1 : t < 1.8 ? 2 : 3; shards(o, ['on', 'on', 'on'], 3, rows);
          for (let d = 0; d < rows; d++) SHARD(o, d, `shard-${d}`, 'acc'); o.rowTxt[2] = false; o.ptLab = false;
          o.pt = [3, 1, 1 + 2 * ease(clamp((t - 0.6) / 1.8))];
          if (t > 2.4) SLOT(o, 2, 1, 'o que o módulo 16 constrói');
          o.coord = [3, 1, rows]; o.npods = 3 * rows; o.vcpu = 3 * rows; o.extra = `${rows} shard${rows > 1 ? 's' : ''} × 3 réplicas`;
          o.cmd = ['chave: cliente_id', `shards: ${rows} (shard-0${rows > 1 ? ' … shard-' + (rows - 1) : ''})`, `pods: ${rows} × 3 = ${3 * rows}`]; } },
      { id: 'rota', dur: 7, title: "O roteador: murmur3('caio-58') mod 3 = 2",
        story: "O pedido 1053 do Caio chega com cliente_id = caio-58. O roteador calcula murmur3('caio-58') mod 3 e dá 2: o pedido vai para o shard-2, nas réplicas e no banco dele. Os outros dois shards nem ficam sabendo. Com a mesma conta, lena-77 e bia-31 caem no shard-1 e davi-12 no shard-0.",
        look: 'A luz do 1053 entra no roteador, segue pelo eixo Z até a terceira fileira e acende o shard-2.',
        key: 'Um roteador olha a chave e escolhe o pedaço.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'roteador', 'por cliente_id'); o.who = ['Caio · Rio', 'dim', 2];
          const path = [...R.src(2), [GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(2), mz(2)], [cx(0), bus(2), mz(2)], [cx(0), fr(2), mz(2)]];
          const got = send(o, t, 0.3, 2.8, path, 'caio-58 · 1053', 'acc', 0.2, true);
          const inDb = got && send(o, t, 3.0, 3.8, R.p2db(2, 2, 0, 3), 'INSERT · 31,90', 'acc', 1.2, true);
          shards(o, got ? ['soft', 'soft', 'on'] : ['off', 'off', 'off']); if (got) P(o, 2, 2, 0, 'on');
          for (let d = 0; d < 3; d++) SHARD(o, d, `shard-${d}`, got && d === 2 ? 'acc' : 'dim'); o.rowTxt[2] = false;
          if (t > 1.4) SLOT(o, 2, 1, "murmur3('caio-58') mod 3 = 2\n→ shard-2");
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = inDb ? '1053 gravado no shard-2' : 'caio-58 → ?';
          o.cmdLab = 'O roteador'; o.cmd = ["murmur3('caio-58') mod 3 = 2", '→ shard-2', 'lena-77, bia-31 → shard-1 · davi-12 → shard-0']; } },
      { id: 'conta', dur: 6.5, title: '3 × 150 = 450/s: os 200 pedidos/s passam',
        story: 'Com 3 shards, a capacidade dos bancos vai a 3 × 150 = 450/s, e o serviço, com 3 réplicas por shard, a 9 × 30 = 270/s. Os 200 pedidos/s do ano que vem passam inteiros: cada shard recebe 66,7/s, e cada banco fica a 44%. E como cada shard tem as suas réplicas (os pods da AKF), cada banco vê só 3 × 10 = 30 conexões, e não 9 × 10 = 90.',
        look: 'As três fileiras acesas ao mesmo tempo, cada banco com o balão em 66,7 de 150.',
        key: 'X + Z: (3, 1, 3) sai 200 de 200.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'roteador', 'por cliente_id'); o.who = ['200 pedidos/s\nano que vem', 'hi', 2]; shards(o); flow(o, R.src(2), t);
          for (let d = 0; d < 3; d++) { const g = [[GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(d), mz(2)], [cx(1), bus(d), mz(2)], [cx(1), fr(d), mz(2)]]; flow(o, g, t, d / 3);
            for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4 + 0.5); }
          for (let d = 0; d < 3; d++) SHARD(o, d, `shard-${d}`, 'acc'); o.rowTxt[2] = false;
          if (t > 1) SLOT(o, 2, 1, 'cada banco: 66,7 de 150/s\n44% · 30 conexões');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'saída 200 de 200/s (100%)';
          o.cmd = ['bancos: 3 × 150 = 450/s', 'serviço: 9 × 30 = 270/s', 'saída: 200 de 200 (100%)', 'cada banco: 66,7 ÷ 150 = 44%']; } },
      { id: 'erro', dur: 8, title: 'E se der errado: WHERE id = 1042 abre os 3 shards',
        story: 'O roteador só sabe escolher quando a consulta traz a chave. WHERE id = 1042, só com o id do pedido, não diz de qual cliente ele é, então a consulta vai para todos os shards e o resultado é juntado depois: é o scatter-gather. O plano do PostgreSQL com tabelas particionadas mostra um Append sobre as 3 partições. Com a chave (WHERE cliente_id = ... AND id = 1042), ele lê uma só.',
        look: 'Três luzes saem do roteador ao mesmo tempo, uma para cada shard; os três bancos acendem em vermelho e as respostas voltam para ser juntadas.',
        key: 'Consulta sem a chave lê todos os shards.',
        f(o, t) { ghostAll(o, [2]); GATE(o, 2, 'roteador', 'sem a chave'); shards(o, ['off', 'off', 'off']);
          let all = true;
          for (let d = 0; d < 3; d++) { const g = [[GX1, ry(0), mz(2)], [OX - 24, ry(0), mz(2)], [OX - 24, bus(d), mz(2)], [cx(3), bus(d), mz(2)], [cx(3), ry(d) + DBR, mz(2)]];
            const ok = send(o, t, 0.5, 2.3, g, d === 0 ? 'WHERE id = 1042' : '', 'bad', 0.4, t < 3); all = all && ok;
            SHARD(o, d, `pedidos_p${d}`, ok ? 'bad' : 'dim'); if (ok) o.dbs[d].st = 'bad';
            if (t > 3) send(o, t, 3.0, 4.6, rev(g), d === 0 ? 'Append: junta os 3' : '', 'bad', 1.4, true); }
          o.rowTxt[2] = false; if (t > 2.4) SLOT(o, 2, 1, 'sem a chave: 3 shards\ncom a chave: 1', 'bad');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = all ? '3 de 3 shards lidos' : 'qual shard tem o 1042?';
          o.cmdLab = 'Comando real'; o.cmd = ['SELECT * FROM pedidos', 'WHERE id = 1042;', '→ Append: pedidos_p0, _p1, _p2']; } },
    ],
    loja: [
      { id: 'ponto', dur: 6, title: '(10, 9, 3): a loja com o Z do pedidos',
        story: 'Esta é a loja depois do módulo 16: os 9 deployments da Black Friday, e o pedidos partido em 3 shards de 3 réplicas, cada um com o seu banco. O ponto da loja fica em (10, 9, 3), mas o 3 vale só para o pedidos. São 36 pods: os 30 de hoje, menos as 3 réplicas antigas do pedidos, mais as 9 novas.',
        look: 'As 9 camadas acesas; só a do pedidos tem profundidade, com 3 fileiras e 3 bancos.',
        key: 'Pods = soma, por serviço, de réplicas × partições: 30 − 3 + 9 = 36.',
        f(o, t) { storeAll(o, 'on', [2]); shards(o); o.pt = [10, 9, 1 + 2 * ease(clamp((t - 0.4) / 1.6))];
          if (t > 2.2) T(o, [OX + 6 * CW, ry(0), lz(8) + 34], '30 − 3 + 9 = 36 pods');
          o.coord = [10, 9, 3]; o.npods = 36; o.vcpu = 31; o.cmd = ['hoje: 30 pods', 'pedidos: 3 → 3 × 3 = 9', '30 − 3 + 9 = 36 pods']; } },
      { id: 'hoje', dur: 5, title: 'Hoje (3, 1, 1): sai 90 de 200',
        story: 'O pedidos com a demanda do ano que vem, 200 pedidos/s. Hoje são 3 réplicas de 30/s e um banco de 150/s: o serviço é o elo fraco, e a saída é 90/s, 45%.',
        look: 'Só a primeira fileira do pedidos, com 3 cópias e um banco; a linha "hoje" se destaca na tabela dos dados.',
        key: 'A saída é o menor entre o serviço e o banco.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 3, 'on'); DB(o, 2, 0, 3, 'on'); for (let i = 0; i < 3; i++) flow(o, R.p2db(2, 0, i, 3), t, i / 3);
          SLOT(o, 2, 0, 'serviço 90/s · banco 150/s\nsaída 90 de 200 (45%)');
          o.coord = [3, 1, 1]; o.npods = 3; o.vcpu = 3; o.extra = 'saída 90 de 200/s (45%)'; o.cmd = ['min(3 × 30, 150) = 90/s', '90 de 200 = 45%']; } },
      { id: 'sox', dur: 5, title: 'Só X (7, 1, 1): sai 150',
        story: 'Só com X, 7 réplicas dão 210/s de serviço, mas o banco de um primário para em 150/s. A saída é 150/s, 75%: o banco para o X.',
        look: 'A fileira do pedidos cresce para 7 cópias e o banco acende em vermelho, no teto.',
        key: 'Clonar o serviço não move o teto do banco.',
        f(o, t) { ghostAll(o, [2]); row(o, 2, 7, 'on'); DB(o, 2, 0, 7, 'bad'); for (let i = 0; i < 7; i++) flow(o, R.p2db(2, 0, i, 7), t, i / 7);
          SLOT(o, 2, 0, 'serviço 210/s · banco 150/s\nsaída 150 de 200 (75%)', 'bad');
          o.coord = [7, 1, 1]; o.npods = 7; o.vcpu = 7; o.extra = 'saída 150 de 200/s (75%)'; o.cmd = ['min(7 × 30, 150) = 150/s', '150 de 200 = 75%']; } },
      { id: 'xz', dur: 5.5, title: 'X + Z (3, 1, 3): sai 200',
        story: 'Com X e Z juntos, 3 shards de 3 réplicas: 270/s de serviço e 3 × 150 = 450/s de banco. A saída chega aos 200/s, 100%, e cada banco fica a 44%.',
        look: 'Três fileiras com 3 cópias e um banco cada, todas acesas.',
        key: 'O pedidos só fecha a conta com X e Z juntos.',
        f(o, t) { ghostAll(o, [2]); shards(o); for (let d = 0; d < 3; d++) for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4);
          SLOT(o, 2, 0, 'serviço 270/s · bancos 450/s\nsaída 200 de 200 (100%)');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'saída 200 de 200/s (100%)'; o.cmd = ['min(9 × 30, 3 × 150) ≥ 200', '200 de 200 = 100%', 'cada banco: 66,7 ÷ 150 = 44%']; } },
      { id: 'erro', dur: 8, title: 'E se der errado: o mkt-01 esquenta o shard-2',
        story: "O marketplace mkt-01, parceiro do módulo 8, tem 40% dos pedidos, e murmur3('mkt-01') mod 3 = 2: ele cai no shard-2. Com a parte dos outros clientes, o shard-2 recebe 60% dos pedidos: 120 dos 200 pedidos/s, 80% do banco, no joelho do módulo 14; os outros dois recebem 40/s cada. Com 250 pedidos/s no total, o shard-2 chega aos 150/s do teto, e o sistema aproveita 250 dos 450 nominais: 55,6%.",
        look: 'O banco do shard-2 acende em vermelho com 120 de 150; os outros dois ficam em 40.',
        key: 'O Z resolve os 200/s, mas uma chave quente esquenta um shard só.',
        f(o, t) { ghostAll(o, [2]); shards(o, ['soft', 'soft', 'bad']);
          for (let d = 0; d < 3; d++) for (let i = 0; i < 3; i++) flow(o, R.p2db(2, d, i, 3), t, (i + d) / 4, d === 2 ? 1.2 : 0.4, d === 2 ? 'bad' : '');
          [40, 40, 120].forEach((v, d) => SHARD(o, d, `shard-${d} · ${v}/s`, d === 2 ? 'bad' : 'acc')); o.rowTxt[2] = false;
          if (t > 1) SLOT(o, 2, 0, 'shard-2: mkt-01 e 1/3 do resto\n120 de 150/s · 80%', 'bad');
          if (t > 3.6) SLOT(o, 2, 1, 'com 250/s: shard-2 no teto\n250 de 450 = 55,6%', 'bad');
          o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; o.extra = 'shard-2 a 80%';
          o.cmd = ["murmur3('mkt-01') mod 3 = 2", 'shard-2: 40% + 60% ÷ 3 = 60%', '0,6 × 200 = 120 de 150/s (80%)', 'com 250/s: 250 ÷ 450 = 55,6%']; } },
    ],
    conversao: [
      { id: 'm5', dur: 5, title: '(1, 1, 1): 1 monolito, 8 vCPU',
        story: 'A loja anda pelo cubo na ordem em que doeu, não na ordem do desenho. No fim do módulo 5 ela está em (1, 1, 1): um monolito de 8 vCPU, uma unidade de deploy.',
        look: 'Um bloco só no canto do cubo e o ponto aceso em (1, 1, 1).',
        key: 'O ponto de partida: um programa, uma cópia, um banco.',
        f(o, t) { P(o, 0, 0, 0, 'on', true); o.rowTxt[0] = 'loja ×1 · 8 vCPU'; o.pt = [1, 1, 1];
          o.coord = [1, 1, 1]; o.npods = 1; o.vcpu = 8; o.cmd = ['1 unidade de deploy', '8 vCPU']; } },
      { id: 'm6', dur: 6, title: '(1, 9, 1): o Y primeiro, 9 deployments',
        story: 'O Y veio primeiro: 7 serviços no módulo 6, e o gateway e 2 BFFs nos módulos 8 e 9. São 9 deployments, um pod cada: 9 pods. Os 7 serviços somam 10 vCPU (6 de 1 vCPU e o relatorios com 4).',
        look: 'O ponto sobe pelo eixo Y; cada camada ganha um pod.',
        key: 'Primeiro o Y: o que doía era o programa único.',
        f(o, t) { const y = 1 + 8 * ease(clamp((t - 0.3) / 2.4)), k = Math.min(9, Math.floor(y + 0.001)); for (let L = 0; L < k; L++) P(o, L, 0, 0, 'on');
          o.pt = [1, y, 1]; o.coord = [1, k, 1]; o.npods = k; o.vcpu = vcpuOf(Array.from({ length: 9 }, (_, L) => L < k ? 1 : 0));
          o.cmd = ['9 deployments × 1 pod = 9 pods', 'vCPU dos 7 serviços: 6 × 1 + 4 = 10']; } },
      { id: 'm7', dur: 6, title: '(10, 9, 1): depois o X, 30 pods',
        story: 'Depois o X: o balanceador do módulo 7 e a Black Friday do módulo 14 levaram a frota a 30 pods (catalogo 10, carrinho 3, pedidos 3, pagamentos 2, estoque 2, entregas 1, relatorios 1, bff-app 4 e bff-web 4). Os 7 serviços somam 25 vCPU.',
        look: 'As camadas crescem para a direita e o ponto anda até X = 10.',
        key: 'Depois o X: o que doía era a carga da vitrine.',
        f(o, t) { const x = 1 + 9 * ease(clamp((t - 0.3) / 2.6)), ns = STORE.map(n => Math.min(n, Math.ceil(x - 0.001))); ns.forEach((n, L) => row(o, L, n, 'on'));
          o.pt = [x, 9, 1]; o.coord = [Math.round(x), 9, 1]; o.npods = ns.reduce((a, b) => a + b, 0); o.vcpu = vcpuOf(ns);
          o.cmd = ['10 + 3 + 3 + 2 + 2 + 1 + 1 + 4 + 4', '= 30 pods · 25 vCPU nos 7 serviços']; } },
      { id: 'm16', dur: 6, title: '(10, 9, 3): o Z só no pedidos, 36 pods',
        story: 'Por último o Z, no módulo 16, e só no pedidos: 3 shards × 3 réplicas = 9 pods no lugar de 3. A frota vai a 30 − 3 + 9 = 36 pods, e os 7 serviços a 31 vCPU. O 3 do ponto vale só para o pedidos: cada eixo cresce onde o sintoma apontou.',
        look: 'A camada do pedidos ganha duas fileiras para o fundo, com os seus bancos; o ponto anda no eixo Z até 3.',
        key: 'Pods = soma, por serviço, de réplicas × partições.',
        f(o, t) { storeAll(o, 'on', [2]); const rows = t < 0.8 ? 1 : t < 1.6 ? 2 : 3; shards(o, ['on', 'on', 'on'], 3, rows);
          o.pt = [10, 9, 1 + 2 * ease(clamp((t - 0.6) / 1.6))]; o.coord = [10, 9, rows]; o.npods = 27 + 3 * rows; o.vcpu = 22 + 3 * rows;
          o.cmd = ['30 − 3 + 3 × 3 = 36 pods', '25 − 3 + 9 = 31 vCPU']; } },
      { id: 'pods', dur: 7, title: 'De req/s para pods',
        story: 'A conversão também vai da capacidade para o número de pods. Com 200 pedidos/s e 30/s por pod, ⌈200 ÷ 30⌉ = 7 pods de pedidos, e o banco ainda para em 150. Com 3 shards, cada um recebe 66,7/s, e 3 pods por shard (90/s) dão folga.',
        look: 'Primeiro uma fileira de 7 cópias com o banco vermelho; depois 3 fileiras de 3, cada uma com o seu banco.',
        key: 'Da demanda ao número de pods, sem esquecer o teto do banco.',
        f(o, t) { ghostAll(o, [2]);
          if (t < 3.2) { row(o, 2, 7, 'on'); DB(o, 2, 0, 7, 'bad'); SLOT(o, 2, 0, '⌈200 ÷ 30⌉ = 7 pods\no banco ainda para em 150/s', 'bad'); o.coord = [7, 1, 1]; o.npods = 7; o.vcpu = 7; }
          else { shards(o); SLOT(o, 2, 0, '200 ÷ 3 = 66,7/s por shard\n3 pods por shard = 90/s'); o.coord = [3, 1, 3]; o.npods = 9; o.vcpu = 9; }
          o.extra = 'demanda: 200 pedidos/s'; o.cmd = ['⌈200 ÷ 30⌉ = 7 pods (banco: 150/s)', '200 ÷ 3 shards = 66,7/s', '66,7 ÷ 30 → 3 pods por shard']; } },
      { id: 'erro', dur: 8, title: 'E se der errado: 10 × 4 × 3 = 120 pods',
        story: 'Alguém lê o cubo como uma lista de compras. O catálogo já tem 10 réplicas (X); depois partem a busca em 4 microsserviços (Y) e põem 3 partições (Z). O produto é 10 × 4 × 3 = 120 pods para um serviço que dava 100 req/s por réplica, e o sintoma original (CPU a 99%) nunca pediu Y nem Z. O custo de CPU, de rede entre os pods e de operação cresce com o produto dos eixos.',
        look: 'A camada do catálogo se multiplica: sobe para 4 camadas e vai para o fundo em 3 fileiras, 120 blocos vermelhos.',
        key: 'Cada eixo se usa quando o sintoma apontar para ele.',
        f(o, t) { const ly = 1 + Math.round(3 * clamp((t - 0.6) / 1.6)), dz = 1 + Math.round(2 * clamp((t - 2.6) / 1.4));
          for (let L = 0; L < ly; L++) for (let d = 0; d < dz; d++) row(o, L, 10, L === 0 && d === 0 ? 'on' : 'bad', d);
          for (let L = 0; L < ly; L++) o.rowTxt[L] = ly === 1 ? `catalogo ×10${dz > 1 ? ' × ' + dz : ''}` : `busca ${L + 1} de 4 · 10 × ${dz}`;
          o.pt = [10, 1 + 3 * ease(clamp((t - 0.6) / 1.6)), 1 + 2 * ease(clamp((t - 2.6) / 1.4))];
          const n = 10 * ly * dz; if (t > 4.4) T(o, [OX + 5 * CW, ry(0), lz(4) + 30], '10 × 4 × 3 = 120 pods\npara 100 req/s por réplica', 'bad');
          o.coord = [10, ly, dz]; o.npods = n; o.extra = 'o sintoma era CPU a 99%: só X'; o.cmd = ['10 réplicas (X)', '× 4 serviços de busca (Y)', '× 3 partições (Z)', `= ${n} pods`]; } },
    ],
  };
  const L_ = () => STEPS[sc], N = () => L_().length;
  const cur = () => L_()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── texto do painel ──
  const VNOTE = '<li class="h3-dim">vCPU: só os 7 serviços (1 vCPU por réplica; relatorios com 4). Os BFFs ficam fora da conta.</li>';
  const tr = (cells, on) => `<tr${on ? ' class="on"' : ''}>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
  const DATA = {
    cubo: () => `<table class="h3-sum"><tr><th>serviço</th><th>X</th><th>Y</th><th>Z</th></tr>${SV.map((s, L) => tr([s, STORE[L] + (L === 6 ? ' (4 vCPU)' : ''), L < 7 ? 'módulo 6' : 'módulo 9', L === 2 ? '1 → 3 (16)' : '1'])).join('')}</table>
      <li>Ponto = (réplicas X, funções Y, partições Z)</li><li>(1, 1, 1) no módulo 5 · <b>(10, 9, 1)</b> hoje · (10, 9, 3) com o Z do pedidos</li>
      <li>A busca de 900 ms: <b>nenhum eixo</b>; índice (módulo 4) ou cache (módulo 5)</li>${VNOTE}`,
    x: () => `<li>Pico do catálogo: <b>640 req/s</b>; cada réplica aguenta <b>100</b> (módulo 14)</li><li>3 réplicas: 640 ÷ 3 ≈ <b>213</b> por cópia · 10 réplicas: 640 ÷ 10 = <b>64</b> (64%)</li>
      <li>HPA do laboratório: minReplicas 10, maxReplicas 20, alvo de 70% de CPU</li><li>Com 3 pods, a saída do laço fica perto de um terço cada (exemplo: 33, 35, 32); com 10, cerca de 10 cada. <span class="h3-dim">Números ilustrativos: os manifestos não foram aplicados num cluster.</span></li>
      <li>Carrinho na memória: conserto = estado no <b>Redis</b> (módulo 5); sticky por IP quebra com NAT (500 pessoas, um IP)</li>`,
    'x-teto': () => `<table class="h3-sum"><tr><th>réplicas</th><th>serviço</th><th>banco</th><th>saída de 200</th></tr>${[[3, 0], [5, 1], [6, 2], [7, 3]].map(([n, s]) => tr([n, `${n * 30}/s`, '150/s', `${Math.min(n * 30, 150)}/s (${Math.round(Math.min(n * 30, 150) / 2)}%)`], s === step)).join('')}</table>
      <li><b>30 pedidos/s</b> por réplica (33 ms de CPU por pedido) · banco de um primário: <b>150/s</b></li><li>Demanda da Black Friday do ano que vem: <b>200 pedidos/s</b></li>`,
    y: () => `<table class="h3-sum"><tr><th>serviço</th><th>réplicas × vCPU</th><th>time</th></tr>${SV.slice(0, 7).map((s, L) => tr([s, `${STORE[L]} × ${VC[L]}`, TEAM[L] || '—'])).join('')}<tr class="on"><td>total</td><td>25 vCPU</td><td></td></tr></table>
      <li>Monolito: 10 cópias × 8 vCPU = <b>80 vCPU</b> · 80 − 25 = 55 a menos (<b>69%</b>)</li><li>Pedido 1053 (Caio, Rio, 20:05): 1 caneca azul 19,90 + frete Rio 12,00 = <b>31,90</b>; estoque da caneca 38 → 37</li>
      <li>Checkout: 5 serviços, 4 saltos × 5 ms = <b>+20 ms</b> · serviço por tabela: 21 × 5 ms = <b>105 ms</b> (JOIN ≈ 2 ms)</li>`,
    z: () => `<table class="h3-sum"><tr><th>cliente_id</th><th>murmur3 mod 3</th></tr>${[['davi-12', 0], ['lena-77', 1], ['bia-31', 1], ['caio-58', 2], ['mkt-01', 2]].map(([c, s]) => tr([c, 'shard-' + s], c === 'caio-58' && step === 2)).join('')}</table>
      <li>1 banco: 150/s, 50 milhões de linhas · 3 shards: 3 × 150 = <b>450/s</b></li><li>200/s ÷ 3 = <b>66,7/s</b> por shard, 44% de cada banco</li>
      <li>Conexões (pool de 10 por shard): todas as réplicas em todos os shards → 9 × 10 = <b>90</b> por banco; pods por shard → 3 × 10 = <b>30</b> (max_connections = 100)</li>
      <li>WHERE id = 1042 → lê os 3 shards (scatter-gather, Append) · com cliente_id → 1 shard (poda de partições)</li>`,
    loja: () => `<table class="h3-sum"><tr><th>estado</th><th>pods</th><th>serviço</th><th>banco</th><th>saída</th></tr>${[['hoje (3, 1, 1)', 3, '90/s', '150/s', '90 (45%)', 1], ['só X (7, 1, 1)', 7, '210/s', '150/s', '150 (75%)', 2], ['X + Z (3, 1, 3)', 9, '270/s', '450/s', '200 (100%)', 3]].map(r => tr(r.slice(0, 5), r[5] === step)).join('')}</table>
      <li>Pods da loja: 30 hoje · 30 − 3 + 9 = <b>36</b> com o Z do pedidos</li><li>mkt-01 (40% dos pedidos) no shard-2: o shard recebe 60%, 120 de 150/s (<b>80%</b>); com 250/s, 250 ÷ 450 = <b>55,6%</b></li>${VNOTE}`,
    conversao: () => `<table class="h3-sum"><tr><th>ponto</th><th>quando</th><th>pods</th><th>vCPU</th></tr>${[['(1, 1, 1)', 'módulo 5', '1', '8'], ['(1, 9, 1)', 'módulos 6, 8, 9', '9', '10'], ['(10, 9, 1)', 'módulos 7, 10, 14', '30', '25'], ['(10, 9, 3)', 'módulo 16', '36', '31']].map((r, i) => tr(r, i === step)).join('')}</table>
      <li>Pods = Σ por serviço de (X × Z)</li><li>200 pedidos/s: ⌈200 ÷ 30⌉ = 7 pods, mas o banco para em 150; com 3 shards, 66,7/s cada → 3 pods por shard</li>
      <li>Os três eixos sem precisar: 10 × 4 × 3 = <b>120 pods</b> para um catálogo de 100 req/s por réplica</li>${VNOTE}`,
  };
  const coordTxt = o => o.coord ? `(${o.coord.join(', ')})` : '—';
  function countHtml() { const o = SP || spec(), bits = [];
    if (o.npods != null) bits.push(`${o.npods} pod${o.npods === 1 ? '' : 's'}`); if (o.vcpu != null) bits.push(`${o.vcpu} vCPU`); if (o.extra) bits.push(o.extra);
    return `<b>${coordTxt(o)}</b><span>ponto (X, Y, Z)</span><i>${bits.length ? '· ' + bits.join(' · ') : ''}</i>`; }
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const cmdHtml = o => `<b>${o.cmdLab}</b>${esc(o.cmd.join('\n'))}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="q3count">${countHtml()}</div>
      <div class="i3-sql" id="q3cmd">${cmdHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'cubo') return; const o = SP || spec(), r = document.getElementById('read');
    if (r) r.textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ponto ${coordTxt(o)}${o.npods != null ? ' · ' + o.npods + ' pods' : ''}`; }
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
    panel: [['Próximo passo', '→', next], ['Voltar', '←', prev], ['Recomeçar', 'R', reset], ['Tocar sozinho', 'space', auto], ['Trocar cenário', 'C', cycleSc]],
    view: { target: W(OX + 160, 120, 140), dist: NARROW() ? 15 : 14, dir: new THREE.Vector3(-0.32, 0.58, 1) },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–7 · arraste para girar' };
})() });
