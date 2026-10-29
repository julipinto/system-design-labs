// Figura 3D (iso-glow): a tabela pedidos partida em shards. No meio, os servidores (ou, no modo Partições, as partições
// dentro de uma instância) com as linhas da amostra como células coloridas por cliente; na frente, o roteador que calcula
// murmur3(cliente_id) mod N e um quadro com a conta do passo; atrás, o mostrador (contadores, o código e o resultado).
// A linha (ficha) acende ao andar; o que dá errado fica vermelho.
// Cenários (botões e ?mode=topologia|consulta|chave|particoes|hash; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/sharding-brief.md).
FIGS3D.push({ id: 'shards', name: 'Shards', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp = (a, b, f) => a + (b - a) * f;
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const SC = ['topologia', 'consulta', 'chave', 'particoes', 'hash'];
  const SCNAME = { topologia: 'Topology', consulta: 'Query', chave: 'Key', particoes: 'Partitions', hash: 'Hash' };
  const SCFULL = { topologia: 'From 1 server to 3 shards', consulta: 'With the key, without the key and the tail', chave: 'The key and the hot customer',
    particoes: 'Partitions inside 1 server', hash: 'murmur3 mod 3, then mod 4' };
  const AULA = { topologia: 'aula-1-introducao-e-topologia-de-sharding', consulta: 'aula-2-escalabilidade-e-performance',
    chave: 'aula-3-sharding-keys-e-hot-partitions', particoes: 'aula-4-sharding-de-tabelas', hash: 'aula-6-hashing' };
  let clk = 0, sc = 'topologia', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-shards3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // a amostra da história: 4 clientes (14 pedidos) e o parceiro mkt-01 (20 milhões de linhas)
  const CL = {
    lena: { id: 'lena-77', ped: [1042, 1044, 1047, 1048, 1051, 1054], cid: 'Recife', h: '0x8fd9d9d8', m3: 1, m4: 0 },
    bia: { id: 'bia-31', ped: [1043, 1046, 1049], cid: 'SP', h: '0x12bd9b3b', m3: 1, m4: 3 },
    caio: { id: 'caio-58', ped: [1041, 1053], cid: 'Rio', h: '0x8c6d56ed', m3: 2, m4: 1 },
    davi: { id: 'davi-12', ped: [1045, 1050, 1052], cid: 'SP', h: '0x06de0db0', m3: 0, m4: 0 },
    mkt: { id: 'mkt-01', ped: [], cid: 'n/a', h: '0x9ebaf255', m3: 2, m4: 1 },
  };
  const ORDER = ['lena', 'bia', 'caio', 'davi', 'mkt'];
  // cor de cada cliente (só na faixa da célula e na amostra da legenda; o texto fica sempre na tinta neutra)
  const CCOL = { lena: ['#2f7fc4', '#5fb0ee'], bia: ['#7a55c7', '#a88ae6'], caio: ['#2d8a57', '#5cc48a'], davi: ['#a06a12', '#d9a443'], mkt: ['#b8326a', '#ec6f9f'] };
  const ccol = k => CCOL[k][theme === 'light' ? 0 : 1];
  const ownerOf = p => ORDER.find(k => CL[k].ped.includes(p));

  // ── geometria ──
  // atrás: o mostrador suspenso; no meio: 4 vagas de servidor (shard-0…3), ou a instância com as partições;
  // na frente: o roteador (esquerda) e o quadro da conta (direita)
  const PL = 7, SW = 170, SY = 140, SD = 150, SH = 26, LANE = 324, RCX = 220, RY0 = 350;
  const SX = i => 40 + i * 192, SCX = i => SX(i) + SW / 2;
  plateWith(g0, 800, 452, [[14, 14], [786, 14], [14, 438], [786, 438]]);
  hazeAndShadow(g0, 400, 226, 9.4, 5.6);
  const SZ = PL + 46;
  rbox(24, 10, SZ, 424, 12, 150, 5, bodyMat, g0); rbox(44, 12, PL, 10, 8, 46, 2, bodyMat, g0); rbox(418, 12, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 22, SZ + 147, 416, 143, 4, g0);
  function block(x, y, w, d, h, kind, extra = {}) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'host' ? 6 : 5, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, extra.P || 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    return { g, mat, top, glow, x, y, w, d, h, kind, z0: PL, key: '', f: 1, ...extra };
  }
  const B = {};
  B.one = block(SX(0), SY, SX(2) + SW - SX(0), SD, SH, 'srv', { cols: 14, P: 4 });
  for (let i = 0; i < 4; i++) B['s' + i] = block(SX(i), SY, SW, SD, SH, 'srv', { i, cols: 3 });
  B.host = block(28, 126, 770, 190, 6, 'host', { P: 4 });
  for (let i = 0; i < 4; i++) B['p' + i] = block(SX(i), SY - 2, SW, SD - 6, 16, 'srv', { i, cols: 3, z0: PL + 6 });
  B.rt = block(40, RY0, 360, 84, 20, 'svc');
  B.side = block(426, RY0, 360, 84, 14, 'grp');
  const NAMES = Object.keys(B);
  creases(first);
  const TOP = nm => B[nm].z0 + B[nm].h;

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 80 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 8 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-4, -4, -4, 8, 8, 8, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.25); g0.add(glow); g.visible = false; return { g, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot);
        D.g.visible = true; D.g.position.copy(W(...p)); moveGlow(D.glow, p, 0.8); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }
  // fichas: cada linha em viagem é uma ficha; acesa = andando, vermelha = problema
  const badEm = new THREE.Color(0xe0180c);
  const TOK = Array.from({ length: 14 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-8, -8, 0, 16, 16, 10, 3, mat, g, { lines: false }); const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  function setTokens(list) {
    TOK.forEach((T_, i) => { const k = list[i]; if (!k) { T_.g.visible = false; T_.glow.material.uniforms.intensity.value = 0; return; }
      T_.g.visible = true; const s = k.s || 1, z = k.p[2]; T_.g.scale.set(s, s, s); T_.g.position.copy(W(k.p[0], k.p[1], z));
      if (k.tone === 'bad') { T_.mat.emissive.copy(badEm); T_.mat.emissiveIntensity = 1.1; } else { T_.mat.emissive.copy(accent); T_.mat.emissiveIntensity = 1.1; }
      moveGlow(T_.glow, [k.p[0], k.p[1], z + 12], k.tone === 'bad' ? 0.5 : 0.75); });
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
  const tags = [];
  function tag(h = 12) {
    const c = document.createElement('canvas'); let tex = new THREE.CanvasTexture(c); tex.colorSpace = texCS();
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }); gamFix(mat);
    const sp = new THREE.Sprite(mat); sp.renderOrder = 30; sp.visible = false; g0.add(sp);
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
      x.strokeStyle = t.tone === 'acc' ? A_ : t.tone === 'bad' ? BAD() : C.line; x.lineWidth = Math.max(1, P * 0.45); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = col; x.font = f1; x.fillText(lines[0], nw / 2, pad * 0.7 + lh / 2);
      x.font = f2; x.fillStyle = t.tone === 'acc' || t.tone === 'bad' ? col : INK(); lines.slice(1).forEach((l, i) => x.fillText(l, nw / 2, pad * 0.7 + lh + lh2 * (i + 0.5)));
      tex.needsUpdate = true; const k = (innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1) * 1.3; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12)];
  const T = (o, at, text, tone = 'acc') => o.tags.push([...at, text, tone]);
  // lugares livres para balões: acima de cada vaga (na faixa de trás), acima do roteador e do quadro
  const SPOT = { s: i => [SCX(i), SY + 8, 64], rt: [RCX, RY0 + 6, 46], side: [606, RY0 + 6, 40] };

  // ── as células (linhas da amostra) dentro de um servidor ──
  // célula: { o: texto, c: cliente, tn: ''|'acc'|'bad'|'ghost'|'hide', span }
  const RW_ = nm => B[nm].w - 5;
  const C0 = 43, CH = 22, CG = 25;   // y da 1ª fileira de células, altura e passo
  function cellRects(nm, d) {
    const cols = B[nm].cols, cw = (RW_(nm) - 10) / cols, out = []; let col = 0, row = 0;
    const y0 = d.bar ? C0 : 24;
    for (const c of d.cells || []) { const sp = Math.min(c.span || 1, cols); if (col + sp > cols) { col = 0; row++; }
      out.push([5 + col * cw, y0 + row * CG, sp * cw, CH]); col += sp; }
    return out;
  }
  // centro da célula idx, em coordenadas da base
  function cellAt(nm, d, idx) { const r = cellRects(nm, d)[idx], Bk = B[nm]; return [Bk.x + 2.5 + r[0] + r[2] / 2, Bk.y + 2.5 + r[1] + r[3] / 2, TOP(nm) + 1]; }
  const ped = (p, tn = '') => ({ o: String(p), c: ownerOf(p), tn });
  const mktCell = (tn = '', span = 3) => ({ o: 'mkt-01 · 20M', c: 'mkt', tn, span });
  // as células de uma lista de clientes (agrupadas por cliente, na ordem dos pedidos)
  function cellsOf(keys, tone = {}, span = 3) {
    const out = []; for (const k of keys) { if (k === 'mkt') out.push(mktCell(tone.mkt || '', span)); else CL[k].ped.forEach(p => out.push(ped(p, typeof tone[k] === 'function' ? tone[k](p) : tone[k] || ''))); }
    return out;
  }
  const nPed = keys => keys.reduce((a, k) => a + CL[k].ped.length, 0);
  // quem fica em cada shard com murmur3 mod 3 e mod 4
  const M3 = [['davi'], ['lena', 'bia'], ['caio', 'mkt']];
  const M4 = [['lena', 'davi'], ['caio', 'mkt'], [], ['bia']];
  const legend = keys => keys.filter(k => k !== 'mkt').map(k => [`${CL[k].id} · ${CL[k].ped.length} ${CL[k].ped.length === 1 ? 'order' : 'orders'}`, '', k]);

  // ── conteúdo padrão dos blocos ──
  const grp = (name, meta, ...rows) => ({ name, meta, rows });
  const srv = (i, keys, extra = {}) => ({ name: `shard-${i}`, meta: `pg-pedidos-${i}`, cells: cellsOf(keys, extra.tone || {}), rows: extra.rows || legend(keys), bar: extra.bar, ...extra });
  const bar = (f, label, tn = '') => [f, label, tn];
  // vigas: do roteador à vaga i (pela faixa entre a fileira do meio e a da frente)
  // no modo Partições as vigas passam por cima da base da instância e param na frente da gaveta
  const zr = () => sc === 'particoes' ? PL + 10 : PL + 4, yEnd = () => sc === 'particoes' ? SY + SD - 8 : SY + SD;
  const route = i => [[RCX, RY0, zr()], [RCX, LANE, zr()], [SCX(i), LANE, zr()], [SCX(i), yEnd(), zr()]];
  const lit = (o, pts, tone, dot) => o.beams.push({ pts, on: true, tone, dot });
  const quiet = (o, ...rs) => rs.forEach(pts => o.beams.push({ pts }));
  // uma linha (ficha) que sai do roteador e para na célula idx da vaga nm entre t0 e t0 + d
  function fly(o, t, t0, nm, d_, idx, tone = '', dur = 1.1) {
    if (t < t0) return 0; const f = ease(clamp((t - t0) / dur)); if (f >= 1) return 1;
    const i = B[nm].i, c = cellAt(nm, d_, idx), pts = [...route(i).slice(0, 3), [SCX(i), yEnd() + 4, zr()], [SCX(i), yEnd() - 6, TOP(nm) + 4], c];
    lit(o, route(i), tone === 'bad' ? 'bad' : '', null); o.tok.push({ p: alongPts(pts, cumLen(pts), f), tone }); return f;
  }
  // uma ficha que muda de vaga: sai da célula antiga, desce para a faixa, anda e sobe na célula nova
  function hop(o, t, t0, from, to, tone = 'acc', dur = 1.3) {
    if (t < t0) { o.tok.push({ p: from, tone }); return 0; } const f = ease(clamp((t - t0) / dur)); if (f >= 1) return 1;
    const pts = [from, [from[0], SY + SD - 6, from[2] + 6], [from[0], LANE + 8, zr() + 8], [to[0], LANE + 8, zr() + 8], [to[0], SY + SD - 6, to[2] + 6], to];
    lit(o, pts.slice(1, 5), tone === 'bad' ? 'bad' : '', null); o.tok.push({ p: alongPts(pts, cumLen(pts), f), tone }); return f;
  }
  // fluxo contínuo de pedidos: n fichas por ciclo, cada uma para a vaga dest(k)
  function stream(o, t, n, dest, period = 2.4, tone = () => '') {
    for (let k = 0; k < n; k++) { const f = ((t / period) + k / n) % 1, i = dest(k), pts = route(i);
      o.tok.push({ p: alongPts(pts, cumLen(pts), f), tone: tone(k), s: 0.8 }); }
  }
  const C3 = (...c) => c;   // contadores: [rótulo, valor, tom]

  // ── o que se vê em cada cenário ──
  const SHOW = {
    topologia: ['one', 'rt', 'side'],
    consulta: ['s0', 's1', 's2', 'rt', 'side'],
    chave: ['s0', 's1', 's2', 'rt', 'side'],
    particoes: ['host', 'p0', 'p1', 'p2', 'rt', 'side'],
    hash: ['s0', 's1', 's2', 'rt', 'side'],
  };
  const m3rt = (k, tn = 'acc') => grp('router', 'murmur3 32 bits', [`murmur3("${CL[k].id}")`, tn], [`= ${CL[k].h}`, tn], [`mod 3 = ${CL[k].m3} → shard-${CL[k].m3}`, tn]);
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], tok: [], cnt: [], res: [] };
    (cur().show || SHOW[sc]).forEach(n => o.show[n] = 1);
    o.rows.one = { name: 'pg-pedidos', meta: 'PostgreSQL · store DB', bar: bar(0.7, '140 GB of 200 GB · 70%', ''), cells: [...cellsOf(['lena', 'bia', 'caio', 'davi'])],
      rows: [['pedidos table: 50,000,000 rows · 2 KB per row', ''], ['100 GB of data + 40% indexes = 140 GB', 'dim'], ['DB ceiling: 150 orders/s', 'dim']] };
    for (let i = 0; i < 3; i++) o.rows['s' + i] = srv(i, M3[i]);
    o.rows.s3 = { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['empty', 'dim']] };
    o.rows.host = { name: 'pg-pedidos', meta: '1 instance · PostgreSQL 14', rows: [] };
    const PY = [['2024', 0.16, '8M rows · 16 GB'], ['2025', 0.34, '17M rows · 34 GB'], ['2026', 0.5, '25M rows · 50 GB']];
    PY.forEach(([y, f, l], i) => { o.rows['p' + i] = { name: `pedidos_${y}`, meta: '', bar: bar(f, l), cells: [], rows: [[`FROM '${y}-01-01'`, 'dim'], [`TO '${+y + 1}-01-01'`, 'dim']] }; });
    o.rows.p3 = { name: 'pedidos_2027', meta: '', cells: [], rows: [] };
    o.rows.rt = grp('router', 'murmur3 32 bits', ['shard = murmur3(cliente_id) mod 3', 'dim'], ['stateless: just the math', 'dim'], ['', '']);
    o.rows.side = grp('the math', '', ['', '']);
    return o;
  }

  const STEPS = {
    topologia: [
      { id: 'um', dur: 4, title: 'One server, 50 million rows', yk: 'IN PSQL',
        code: ["SELECT count(*) FROM pedidos;", '  50000000', "SELECT pg_size_pretty(", "  pg_total_relation_size('pedidos'));", '  140 GB', '# 200 GB volume'],
        story: 'Module 15 left axis Z as the only one the store never used, and module 14 showed the ceiling: the pedidos database handles 150 orders/s, and service replicas do not change that. The pedidos table, which had 6 rows in module 4, now has 50 million. That is 2 KB per row, 100 GB of data and 140 GB with the indexes, on a 200 GB volume.',
        look: 'A single block, pg-pedidos, with the bar at 70%. The cells are the 14 sample orders, one color per customer.',
        key: 'Everything on one server: one disk, one backup, one write ceiling.',
        f(o, t) { o.on.one = 1;
          o.rows.side = grp('the story\'s sample', '14 orders + the partner', ['lena-77 · 6   bia-31 · 3', ''], ['caio-58 · 2   davi-12 · 3', ''], ['mkt-01: 20,000,000 rows (40%)', 'acc']);
          o.rows.rt = grp('pedidos service', '1 DB', ['writes everything to pg-pedidos', 'dim'], ['ceiling: 150 orders/s', 'dim']);
          o.cnt = C3(['ROWS', '50,000,000'], ['DISK', '140 of 200 GB'], ['CEILING', '150 orders/s']);
          o.res = [['60 GB free', 'acc'], ['1 server holds everything', '']];
          if (t > 1.2) T(o, [SCX(1), SY + 8, 64], 'pedidos: 50M rows'); } },
      { id: 'tempo', dur: 5, title: '1.21 GB per day: the disk runs out in 50 days', yk: 'THE MATH',
        code: ['5 orders/s × 86,400 s = 432,000/day', '432,000 × 2 KB × 1.4 = 1.21 GB/day', '60 GB free ÷ 1.21 = ~50 days', '', 'backup: 140,000 MB ÷ 50 MB/s', '  = 2,800 s ≈ 47 min'],
        story: 'The store writes 5 orders per second on average: 432,000 per day. With 2 KB per row and 40% indexes, that is 1.21 GB more every day, and the 60 GB of free space runs out in about 50 days. The full backup, at 50 MB/s, already takes 47 minutes.',
        look: 'The disk bar fills from 70% to 100%; the readout counts the days left.',
        key: 'The store\'s triggers are the disk, the backup and the write ceiling.',
        f(o, t) { const f = clamp((t - 0.6) / 2.6), dias = Math.round(50 * (1 - f)); o.on.one = f >= 1 ? 'bad' : 1;
          o.rows.one.bar = bar(0.7 + 0.3 * f, `${Math.round(140 + 60 * f)} GB of 200 GB · ${Math.round(70 + 30 * f)}%`, f >= 1 ? 'bad' : '');
          o.rows.side = grp('the growth', '5 orders/s', ['432,000 orders/day', ''], ['+1.21 GB per day', 'acc'], ['full backup: 47 min', 'bad']);
          o.rows.rt = grp('pedidos service', '1 DB', ['5 orders/s on average', 'dim'], ['writes everything to pg-pedidos', 'dim']);
          o.cnt = C3(['DAYS OF DISK', f >= 1 ? '0' : '~' + dias], ['PER DAY', '+1.21 GB'], ['BACKUP', '47 min', 'bad']);
          o.res = f >= 1 ? [['volume full in ~50 days', 'bad'], ['47 min backup', 'bad']] : [['60 GB free', '']];
          stream(o, t, 3, () => 1, 2.4);
          if (f >= 1) T(o, [SCX(1), SY + 8, 64], '200 GB: full', 'bad'); } },
      { id: 'escada', dur: 4.5, title: 'Before splitting: the ladder of remedies', yk: 'THE ORDER OF REMEDIES',
        code: ['1. index              (module 4)', '2. cache              (module 5)', '3. read replicas      (module 17)', '4. partitioning      (lesson 4)', '5. sharding           (this module)', '# 50M rows still fit in one PostgreSQL'],
        story: 'Splitting the table is the last step. Before it come the index (module 4), the cache (module 5), read replicas (module 17) and partitioning inside the same instance (lesson 4). Fifty million rows still fit in one PostgreSQL; what pushes the store to sharding is the disk, the backup and the ceiling of 150 writes per second.',
        look: 'The steps light up from top to bottom; the last one, sharding, is the only one that changes server.',
        key: 'Sharding fixes writes and disk; for slow reads, the other steps cost less.',
        f(o, t) { o.on.one = 1; o.show.s3 = 1; o.on.s3 = 2; const n = clamp(Math.floor((t - 0.3) / 0.6) + 1, 0, 5);
          const R = [['index', 'module 4'], ['cache', 'module 5'], ['read replicas', 'module 17'], ['partitioning', 'lesson 4'], ['sharding', 'this module']];
          o.rows.s3 = { name: 'the ladder', meta: 'from cheap to expensive', cells: [], rows: R.map(([a, b], i) => [`${i + 1}. ${a} · ${b}`, i < n ? (i === 4 ? 'acc' : '') : 'dim']) };
          o.rows.side = grp('what each step fixes', '', ['1–3: slow reads', ''], ['4: pruning and retention', ''], ['5: disk, backup and writes', 'acc']);
          o.rows.rt = grp('pedidos service', '1 DB', ['ceiling: 150 writes/s', 'dim']);
          o.cnt = C3(['STEP', n ? String(n) + ' of 5' : '…'], ['TRIGGER', 'disk and writes'], ['CEILING', '150 orders/s']);
          o.res = n >= 5 ? [['sharding: the last step', 'acc']] : [];
          if (n >= 5) T(o, SPOT.s(3), 'sharding: another server'); } },
      { id: 'parte', dur: 5, title: 'The table becomes 3 shards', yk: 'THE ROUTER',
        code: ['shard = murmur3(cliente_id) mod 3', '', 'shard-0 → pg-pedidos-0', 'shard-1 → pg-pedidos-1', 'shard-2 → pg-pedidos-2', '# 140 GB ÷ 3 = 46.7 GB per shard'],
        story: 'The store splits the pedidos table into 3 servers, pg-pedidos-0, 1 and 2. Each piece is a shard. What decides where each row lives is the router: it computes murmur3(cliente_id) mod 3. All of a customer\'s rows land on the same shard.',
        look: 'The single block sinks and 3 servers rise; the cells split by customer: Davi on shard-0, Lena and Bia on shard-1, Caio and mkt-01 on shard-2.',
        key: 'Shard: each piece of the table on a different server.',
        f(o, t) { const sp = t > 0.8; if (sp) { o.show.one = 0; for (let i = 0; i < 3; i++) { o.show['s' + i] = 1; o.on['s' + i] = 1; } } else o.on.one = 1;
          for (let i = 0; i < 3; i++) o.rows['s' + i].bar = bar(i === 2 ? 0.6 : 0.2, '');
          o.rows.s0.bar = bar(0.2, '~10M rows'); o.rows.s1.bar = bar(0.2, '~10M rows'); o.rows.s2.bar = bar(0.6, '~30M rows (mkt-01)');
          o.on.rt = sp ? 1 : 0;
          o.rows.side = grp('each shard', 'the piece on a server', ['shard-0: davi-12', ''], ['shard-1: lena-77, bia-31', ''], ['shard-2: caio-58, mkt-01', '']);
          o.cnt = C3(['SHARDS', sp ? '3' : '1'], ['SERVERS', sp ? 'pg-pedidos-0…2' : 'pg-pedidos'], ['FUNCTION', 'murmur3 mod 3']);
          o.res = sp ? [['3 servers, 1 logical table', 'acc']] : [];
          if (sp) { for (let i = 0; i < 3; i++) quiet(o, route(i)); if (t > 1.6) T(o, SPOT.rt, 'mod 3 picks the shard'); } } },
      { id: 'lena', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5, title: 'Lena\'s order 1054 goes to shard-1', yk: 'THE ORDER · BLACK FRIDAY 20:08',
        code: ["INSERT INTO pedidos VALUES (1054,", "  'lena-77', 'Recife', 64.00, 'criado', now());", "murmur3('lena-77') = 0x8fd9d9d8", '  = 2,413,418,968', '2,413,418,968 mod 3 = 1', '→ shard-1 (pg-pedidos-1)'],
        story: 'Black Friday, 20:08. Lena closes order 1054: 1 black T-shirt (49.00) and shipping to Recife (15.00), total 64.00. The router computes murmur3("lena-77") = 0x8fd9d9d8, which in decimal is 2,413,418,968; the remainder of dividing by 3 is 1. Order 1054 goes to shard-1, together with her other 5 orders.',
        look: 'The token leaves the router, runs along the lane and stops next to Lena\'s other cells on shard-1.',
        key: 'Same key, same shard: the math always gives the same result.',
        f(o, t) { for (let i = 0; i < 3; i++) o.on['s' + i] = 2;
          const d1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1054 ? (t > 1.6 ? 'acc' : 'hide') : '' } }); o.rows.s1 = d1;
          o.on.rt = 1; o.rows.rt = m3rt('lena');
          for (let i = 0; i < 3; i++) if (i !== 1) quiet(o, route(i));
          const f = fly(o, t, 0.5, 's1', d1, 5); if (f >= 1 || t > 1.6) { o.on.s1 = 1; lit(o, route(1)); }
          o.rows.side = grp('order 1054', 'lena-77 · Recife', ['1 black T-shirt: 49.00', ''], ['Recife shipping: 15.00', ''], ['total: 64.00', 'acc']);
          o.cnt = C3(['SHARD', t > 1.6 ? 'shard-1' : '…'], ['MURMUR3', '0x8fd9d9d8'], ['MOD 3', '1']);
          o.res = t > 1.6 ? [['1054 → shard-1 · 64.00', 'acc'], ['lena-77: 6 orders on shard-1', '']] : [];
          if (t > 1.8) T(o, SPOT.s(1), '1054 → shard-1'); } },
      { id: 'computacional', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5, title: 'Compute topology: mkt-01 in a pool of its own', yk: 'THE POOL',
        code: ['# separate the compute, not the data', 'api.loja.com.br  → pool api-parceiros', 'store (site, app) → pool loja', '', '# the article calls this computational segregation', '# it is load isolation (bulkhead, module 25)'],
        story: 'Splitting the data is one of the two topologies. The other separates the compute: mkt-01, the partner marketplace from module 8, comes in through api.loja.com.br and is served by a pool of machines just for it. Its orders stay on the same 3 shards; what changes is who processes the request.',
        look: 'On the fourth slot the api-parceiros pool rises; mkt-01\'s flow goes through it and the data stays on the 3 shards.',
        key: 'Data vs compute: splitting where the row lives is not the same as isolating who serves it.',
        f(o, t) { for (let i = 0; i < 3; i++) o.on['s' + i] = 2; o.show.s3 = 1; o.on.s3 = 1; o.on.s2 = 1;
          o.rows.s2 = srv(2, ['caio', 'mkt'], { tone: { mkt: 'acc' } }); for (let i = 0; i < 3; i++) o.rows['s' + i].bar = bar([0.2, 0.2, 0.6][i], '');
          o.rows.s3 = { name: 'api-parceiros', meta: 'pool of its own', cells: [], rows: [['only mkt-01', 'acc'], ['comes in through api.loja.com.br', ''], ['module 8', 'dim'], ['', ''], ['its data stays', 'dim'], ['on shard-2', 'dim']] };
          o.rows.rt = grp('router', 'murmur3 32 bits', ['mkt-01 → mod 3 = 2', 'acc'], ['→ shard-2', 'acc']);
          o.rows.side = grp('two topologies', '', ['data: each row on a shard', ''], ['compute: each customer on a pool', 'acc'], ['the article calls both sharding', 'dim']);
          for (let i = 0; i < 2; i++) quiet(o, route(i)); lit(o, route(2)); lit(o, route(3));
          stream(o, t, 4, k => k % 2 ? 3 : 2, 2.6);
          o.cnt = C3(['POOL', 'api-parceiros'], ['CUSTOMER', 'mkt-01'], ['DATA', 'shard-2']);
          o.res = [['compute separated', 'acc'], ['data on the same 3 shards', '']];
          if (t > 1.2) T(o, SPOT.s(3), 'mkt-01-only pool'); } },
      { id: 'cedo', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5.5, title: 'What if it goes wrong: sharding too early', yk: 'THE REPORT · MODULE 11',
        code: ["SELECT sum(total) FROM pedidos", "  WHERE criado_em >= current_date;", '# now: 3 connections, 3 queries', '#   and the sum done in the service', '# BEGIN … COMMIT entre shards:', '#   does not exist for free'],
        story: 'The "revenue of the day" report from module 11 was a single query. With 3 shards it becomes 3 connections, 3 queries and 3 results that the service has to add up. And the transaction that wrote the order and the stock deduction together does not cross servers. If the store splits too early, it pays this price without having the disk problem.',
        look: 'The router sends the same query to the 3 shards; the 3 beams light up in red.',
        key: 'Sharding costs: queries without the key become N queries, and the single transaction is gone.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = t > 1.2 ? 'bad' : 2; lit(o, route(i), t > 1.2 ? 'bad' : '', t < 1.2 ? t / 1.2 : null); }
          o.rows.rt = grp('report', 'revenue of the day', ['no cliente_id in the query', 'bad'], ['→ shard-0, shard-1, shard-2', 'bad'], ['sum in the service', 'dim']);
          for (let i = 0; i < 3; i++) o.rows['s' + i].rows = [[`partial from shard-${i}`, 'dim']];
          o.rows.side = grp('the cost', '', ['3 connections, 3 queries', 'bad'], ['3 results to add up', 'bad'], ['no transaction across shards', 'bad']);
          o.cnt = C3(['QUERIES', t > 1.2 ? '3' : '1', 'bad'], ['CONNECTIONS', '3'], ['TRANSACTION', 'does not cross', 'bad']);
          o.res = t > 1.2 ? [['1 report = 3 queries', 'bad'], ['no BEGIN…COMMIT across shards', 'bad']] : [];
          if (t > 1.5) T(o, SPOT.rt, 'the same query 3 times', 'bad'); } },
    ],
    consulta: [
      { id: 'capac', dur: 4.5, title: 'What you gain: 450/s, 46.7 GB and a 15 min backup', yk: 'THE MATH',
        code: ['capacity: 3 × 150 = 450 orders/s', 'disk: 140 GB ÷ 3 = 46.7 GB per shard', 'backup: 46,700 MB ÷ 50 MB/s', '  = 933 s = 15 min 33 s (in parallel)', '# before: 47 min', '# nominal: assumes equal load on all 3'],
        story: 'Each shard has its own disk and its own ceiling of 150 writes per second. Added up, that is 450 orders/s nominal. Each server holds 46.7 GB instead of 140, and the 3 backups run in parallel: 15 min 33 s instead of 47 min.',
        look: 'The 3 shards light up together; the flow of orders splits among them.',
        key: 'Sharding buys write capacity, space and a shorter backup.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = 1; o.rows['s' + i].bar = bar(0.33, '46.7 GB · 150/s'); lit(o, route(i)); }
          stream(o, t, 6, k => k % 3, 2.4);
          o.rows.rt = grp('router', 'murmur3 mod 3', ['each order goes to 1 shard', ''], ['3 ceilings of 150/s', 'acc']);
          o.rows.side = grp('before → after', '', ['ceiling: 150 → 450 orders/s', 'acc'], ['disk: 140 → 46.7 GB', ''], ['backup: 47 min → 15 min 33 s', '']);
          o.cnt = C3(['CAPACITY', '450/s'], ['PER SHARD', '46.7 GB'], ['BACKUP', '15 min 33 s']);
          o.res = [['3 × 150 = 450 orders/s', 'acc'], ['nominal: equal load on all 3', '']];
          if (t > 1) T(o, SPOT.rt, '3 × 150/s'); } },
      { id: 'comchave', dur: 4.5, title: 'With the key: 1 shard answers', yk: 'THE QUERY',
        code: ["SELECT * FROM pedidos", "  WHERE cliente_id = 'lena-77';", "murmur3('lena-77') mod 3 = 1", '→ only shard-1', '# smaller index, less disk per query', '6 rows'],
        story: 'Lena\'s "my orders" brings the cliente_id in the query. The router does the same math as for the write, reaches shard-1 and asks only it. Shard-1\'s index is a third of the original, and the other two servers do not even find out.',
        look: 'Only shard-1\'s beam lights up; Lena\'s 6 cells glow.',
        key: 'Query with the key: 1 shard, the same cost as before or lower.',
        f(o, t) { o.on.s0 = 2; o.on.s2 = 2; o.on.rt = 1; o.rows.rt = m3rt('lena');
          quiet(o, route(0), route(2)); lit(o, route(1), '', t < 1.2 ? t / 1.2 : null);
          if (t > 1.2) { o.on.s1 = 1; o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: 'acc' } }); }
          o.rows.side = grp('who works', '', ['shard-1: 6 rows', 'acc'], ['shard-0 and shard-2: nothing', 'dim']);
          o.cnt = C3(['SHARDS READ', t > 1.2 ? '1 of 3' : '…'], ['KEY', 'lena-77'], ['ROWS', t > 1.2 ? '6' : '…']);
          o.res = t > 1.2 ? [['6 rows · 1 shard', 'acc']] : [];
          if (t > 1.4) T(o, SPOT.s(1), 'only shard-1'); } },
      { id: 'semchave', dur: 5, title: 'Without the key: all 3 shards answer', yk: 'THE QUERY',
        code: ['SELECT * FROM pedidos WHERE id = 1042;', '# the id does not say the shard', '→ shard-0: 0 rows', '→ shard-1: 1 row (1042)', '→ shard-2: 0 rows', '# scatter-gather: waits for all 3'],
        story: 'Now the query arrives with only the id 1042. The id does not say which customer the order belongs to, so the router does not know the shard: it sends the question to all 3 and merges the answers (scatter-gather). Two servers work to answer "nothing", and the answer only comes out when the last one finishes.',
        look: 'The 3 beams light up at the same time; only shard-1 finds cell 1042.',
        key: 'Query without the key: N shards, and the answer is the slowest one\'s.',
        f(o, t) { o.on.rt = 1; o.rows.rt = grp('router', 'without the key', ['id = 1042', 'acc'], ['murmur3(?): cliente_id missing', 'bad'], ['→ asks all 3', 'acc']);
          for (let i = 0; i < 3; i++) { lit(o, route(i), '', t < 1.2 ? t / 1.2 : null); o.on['s' + i] = t > 1.2 ? 1 : 2; }
          if (t > 1.2) { o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1042 ? 'acc' : '' } }); o.rows.s0.rows = [['0 rows', 'dim']]; o.rows.s2.rows = [['0 rows', 'dim']]; }
          o.rows.side = grp('scatter-gather', '', ['3 queries to find 1 row', 'acc'], ['2 answer "nothing"', 'dim'], ['waits for the slowest', '']);
          o.cnt = C3(['SHARDS READ', t > 1.2 ? '3 of 3' : '…'], ['ID', '1042'], ['ROWS', t > 1.2 ? '1' : '…']);
          o.res = t > 1.2 ? [['1 row · 3 shards queried', 'acc']] : [];
          if (t > 1.4) T(o, SPOT.s(1), '1042 is here'); } },
      { id: 'cauda', dur: 5, title: 'The tail: each shard\'s p99 becomes the query\'s p97', yk: 'THE TAIL AT SCALE',
        code: ['P(any above p99) = 1 − 0.99^N', 'N = 1:   1.00%', 'N = 3:   2.97%', 'N = 10:  9.56%', 'N = 50:  39.5%', 'N = 100: 63.4%'],
        story: 'Each shard takes longer than its p99 on 1 in every 100 queries. A query that waits on all 3 is slow if any one of them is in the worst slice: 1 − 0.99³ = 2.97%. That is the math of the paper "The Tail at Scale", by Dean and Barroso: each shard\'s p99 becomes the query\'s p97.',
        look: 'The 3 answers come back; shard-2\'s is late and turns red, and the whole query waits for it.',
        key: 'The more shards a query waits on, the more often it catches a slow one.',
        f(o, t) { o.on.rt = 1; o.rows.rt = grp('scatter-gather', 'waits for all 3', ['shard-0: on time', ''], ['shard-1: on time', ''], ['shard-2: above p99', t > 1.6 ? 'bad' : 'dim']);
          for (let i = 0; i < 3; i++) { const slow = i === 2, f = clamp(t / (slow ? 2.4 : 1.1)); lit(o, route(i), slow && t > 1.2 ? 'bad' : '', f < 1 ? f : null); o.on['s' + i] = slow && t > 1.2 ? 'bad' : f >= 1 ? 1 : 2; }
          o.rows.s2.rows = [['above p99', 'bad'], ['(1 in 100)', 'dim']];
          o.rows.side = grp('chance of waiting on a slow one', '', ['3 shards: 2.97%', 'acc'], ['10 shards: 9.56%', ''], ['100 shards: 63.4%', '']);
          o.cnt = C3(['CHANCE', '2.97%'], ['SHARDS', '3'], ['EACH SHARD', 'p99 = 1%']);
          o.res = t > 1.6 ? [['the query waits for shard-2', 'bad'], ['1 − 0.99³ = 2.97%', '']] : [];
          if (t > 1.8) T(o, SPOT.s(2), 'slow: above p99', 'bad'); } },
      { id: 'incidente', dur: 5, title: 'A shard goes down: Lena and Bia without orders', yk: 'AVAILABILITY',
        code: ['each shard: 99.9%', 'P(any down) = 1 − 0.999^N', 'N = 1: 0.10%', 'N = 3: 0.30%', 'N = 50: 4.88%', '# for each customer: still 0.1%'],
        story: 'Each shard is down 0.1% of the time. For Lena nothing changes: her "my orders" depends only on shard-1. For the team it changes: with 3 shards, the chance that some shard is down is 0.30%, triple. And when shard-1 goes down, Lena and Bia are left without orders, because sharding copies nothing (module 17).',
        look: 'Shard-1 turns red with Lena\'s and Bia\'s cells; shard-0 and shard-2 stay lit.',
        key: 'Sharding isolates the failure by key, but multiplies the incidents.',
        f(o, t) { const down = t > 1; o.on.s0 = 1; o.on.s2 = 1; o.on.s1 = down ? 'bad' : 1;
          if (down) o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: 'bad', bia: 'bad' }, rows: [['down', 'bad'], ['lena-77 and bia-31 without orders', 'bad']] });
          lit(o, route(0)); lit(o, route(2)); lit(o, route(1), down ? 'bad' : '');
          o.rows.rt = grp('router', '', ['davi-12 → shard-0: ok', ''], ['caio-58 → shard-2: ok', ''], ['lena-77 → shard-1: down', down ? 'bad' : 'dim']);
          o.rows.side = grp('chance that some shard is down', '99.9% each', ['1 server: 0.10%', ''], ['3 shards: 0.30%', 'acc'], ['50 shards: 4.88%', '']);
          o.cnt = C3(['SOME DOWN', '0.30%'], ['PER CUSTOMER', '0.10%'], ['DOWN NOW', down ? 'shard-1' : 'nenhum', down ? 'bad' : '']);
          o.res = down ? [['shard-1 down: 9 sample orders', 'bad'], ['shard-0 and shard-2 carry on', '']] : [];
          if (down) T(o, SPOT.s(1), 'Lena and Bia without orders', 'bad'); } },
      { id: 'cinquenta', dur: 5, title: 'What if it goes wrong: the report on 50 shards', yk: 'THE MATH',
        code: ['report without key → 50 shards', '1 − 0.99^50 = 0.395', '# 39.5% of the time, some shard', '#   is above its p99', '# ways out: query only the shards', '#   needed, or a reporting replica'],
        story: 'The store grows and reaches 50 shards. The report without the key now waits on 50 answers, and 39.5% of the time at least one is in the worst slice of its shard. What used to be the tail becomes the norm. A query that needs all the shards has to be rare, or come from somewhere else.',
        look: 'The beams to the 3 shards stand for 50; two turn red and the counter shows 39.5%.',
        key: 'Scatter-gather on many shards: the tail becomes the rule.',
        f(o, t) { o.on.rt = 'bad'; o.rows.rt = grp('report', '50 shards', ['no cliente_id', 'bad'], ['waits for 50 answers', 'bad'], ['39.5%: some above p99', 'bad']);
          for (let i = 0; i < 3; i++) { lit(o, route(i), i ? 'bad' : '', clamp(t / 1.2) < 1 ? clamp(t / 1.2) : null); o.on['s' + i] = i ? 'bad' : 1; o.rows['s' + i].meta = `1 of 50`; }
          o.rows.side = grp('waiting on N shards', '', ['3: 2.97%', ''], ['10: 9.56%', ''], ['50: 39.5%', 'bad']);
          o.cnt = C3(['CHANCE', '39.5%', 'bad'], ['SHARDS', '50'], ['WITH 3', '2.97%']);
          o.res = [['39.5% of the time it waits on a slow one', 'bad'], ['query to all: has to be rare', '']];
          if (t > 1.2) T(o, SPOT.rt, '× 50 shards', 'bad'); } },
    ],
    chave: [
      { id: 'cliente', dur: 4.5, title: 'Key cliente_id: what stays together', yk: 'THE KEY',
        code: ['shard = murmur3(cliente_id) mod 3', '# high cardinality: 1.5 million customers', '# it is in "my orders"', '# without the partner: ~33% per shard', 'efficiency = 1 ÷ (N × hottest)', '  = 1 ÷ (3 × 0.33) ≈ 100%'],
        story: 'The key decides what stays together. With cliente_id, all of Lena\'s orders live on the same shard, and "my orders" reads a single server. There are 1.5 million customers, so the rows spread evenly. Without the partner, each shard gets a third.',
        look: 'The 3 bars end up equal, at 33%; each customer has the cells on a single shard.',
        key: 'Good key: many values, shows up in queries and does not concentrate traffic.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = 1; o.rows['s' + i] = srv(i, M3[i].filter(k => k !== 'mkt'), { bar: bar(0.33, '~10M rows · 33%') }); lit(o, route(i)); }
          stream(o, t, 6, k => k % 3, 2.4);
          o.rows.rt = grp('router', 'key: cliente_id', ['1.5 million values', ''], ['murmur3(cliente_id) mod 3', 'acc']);
          o.rows.side = grp('without the partner', '', ['each shard: ~33%', ''], ['efficiency: ~100%', 'acc']);
          o.cnt = C3(['EFFICIENCY', '~100%'], ['HOTTEST', '~33%'], ['KEY', 'cliente_id']);
          o.res = [['equal load on all 3', 'acc']]; } },
      { id: 'mkt', dur: 5, title: 'Turn on mkt-01: shard-2 gets 60%', yk: 'THE MATH',
        code: ["murmur3('mkt-01') mod 3 = 2", 'shard-2 = 20M (mkt-01) + 10M = 30M', '  = 60% of the rows', 'shard-0 = shard-1 = ~10M = 20%', 'efficiency = 1 ÷ (3 × 0.60)', '  = 55.6%'],
        story: 'mkt-01, the partner marketplace from module 8, has 20 million orders, 40% of the table. Like any key, it lands whole on one shard: murmur3("mkt-01") mod 3 = 2. Shard-2 ends up with 30 million rows, 60%, and the other two with 20% each. The hash spreads different keys; it does not split a hot key.',
        look: 'mkt-01\'s wide cell enters shard-2 and its bar rises to 60%, in red.',
        key: 'Hot partition: a heavy key lands whole on one shard.',
        f(o, t) { const on = t > 1; o.on.rt = 1; o.rows.rt = m3rt('mkt', on ? 'bad' : 'acc');
          o.rows.s0 = srv(0, ['davi'], { bar: bar(on ? 0.2 : 0.33, on ? '~10M · 20%' : '~10M · 33%') });
          o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(on ? 0.2 : 0.33, on ? '~10M · 20%' : '~10M · 33%') });
          const d2 = srv(2, ['caio', 'mkt'], { tone: { mkt: on ? 'bad' : 'hide' }, bar: bar(on ? 0.6 : 0.33, on ? '30M rows · 60%' : '~10M · 33%', on ? 'bad' : '') }); o.rows.s2 = d2;
          o.on.s0 = 2; o.on.s1 = 2; o.on.s2 = on ? 'bad' : 2; quiet(o, route(0), route(1));
          if (!on) fly(o, t, 0.2, 's2', d2, 2, 'acc', 0.8); else lit(o, route(2), 'bad');
          o.rows.side = grp('the hash spreads keys', 'not load', ['shard-2: 30M rows · 60%', on ? 'bad' : 'dim'], ['shard-0 and shard-1: 20% each', ''], ['efficiency: 55.6%', on ? 'bad' : 'dim']);
          o.cnt = C3(['EFFICIENCY', on ? '55.6%' : '~100%', on ? 'bad' : ''], ['SHARD-2', on ? '60%' : '33%', on ? 'bad' : ''], ['MKT-01', '20M rows']);
          o.res = on ? [['shard-2 with 60% of the rows', 'bad'], ['1 ÷ (3 × 0.60) = 55.6%', '']] : [];
          if (on) T(o, SPOT.s(2), 'all of mkt-01 here', 'bad'); } },
      { id: 'ceiling', dur: 5.5, title: 'Shard-2 saturates at 250 orders/s, not at 450', yk: 'THE MATH',
        code: ['# traffic follows the rows', 'shard-2 receives 0.60 × T', '0.60 × T = 150 → T = 250 orders/s', 'shard-0 and shard-1: 0.20 × 250 = 50/s', '# the store pays for 3 servers', '#   and uses 1.67'],
        story: 'If traffic follows the rows, shard-2 receives 60% of the orders. It hits the ceiling of 150/s when the whole store does 250 orders/s; at that moment shard-0 and shard-1 are at 50/s, a third of what they can handle. The store pays for 3 servers and uses 1.67.',
        look: 'Of every 5 tokens, 3 go to shard-2; it turns red at 150/s while the others show 50/s.',
        key: 'Cluster efficiency = 1 ÷ (number of shards × fraction of the hottest).',
        f(o, t) { o.rows.s0 = srv(0, ['davi'], { bar: bar(0.33, '50/s of 150') }); o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(0.33, '50/s of 150') });
          o.rows.s2 = srv(2, ['caio', 'mkt'], { tone: { mkt: 'bad' }, bar: bar(1, '150/s of 150: at the ceiling', 'bad') });
          o.on.s0 = 1; o.on.s1 = 1; o.on.s2 = 'bad'; lit(o, route(0)); lit(o, route(1)); lit(o, route(2), 'bad');
          stream(o, t, 10, k => [2, 0, 2, 1, 2][k % 5], 2.2, k => [2, 0, 2, 1, 2][k % 5] === 2 ? 'bad' : '');
          o.rows.rt = grp('router', 'T = 250 orders/s', ['60% → shard-2: 150/s', 'bad'], ['20% → shard-0: 50/s', ''], ['20% → shard-1: 50/s', '']);
          o.rows.side = grp('capacidade', '3 × 150 = 450/s nominal', ['useful: 250 orders/s', 'bad'], ['uses 1.67 of 3 servers', ''], ['efficiency: 55.6%', 'bad']);
          o.cnt = C3(['USEFUL CAPACITY', '250/s', 'bad'], ['NOMINAL', '450/s'], ['EFFICIENCY', '55.6%', 'bad']);
          o.res = [['0.60 × T = 150 → T = 250', 'bad'], ['shard-0 and shard-1 at 50/s', '']];
          if (t > 1) T(o, SPOT.s(2), '150/s: saturated', 'bad'); } },
      { id: 'cidade', dur: 5, title: 'Key cidade: 3 values, at most 3 shards', yk: 'THE KEY',
        code: ['shard = cidade', 'SP     → 27.5M rows (55%)', 'Rio    → 12.5M (25%)', 'Recife → 10M (20%)', 'efficiency = 1 ÷ (3 × 0.55)', '  = 60.6%'],
        story: 'What if the key were the city? There are only 3 values, SP, Rio and Recife, so it never goes past 3 shards. And SP has 55% of the orders: the SP shard saturates first, and the efficiency stays at 60.6%. Bia and Davi live together on the SP shard; Lena on the Recife one.',
        look: 'The shards take the city\'s name; the SP bar goes to 55%.',
        key: 'Low cardinality: few values limit the number of shards.',
        f(o, t) { const CT = [['SP', ['bia', 'davi'], 0.55, '27.5M · 55%'], ['Rio', ['caio'], 0.25, '12.5M · 25%'], ['Recife', ['lena'], 0.2, '10M · 20%']];
          CT.forEach(([c, ks, f, l], i) => { o.rows['s' + i] = srv(i, ks, { meta: `cidade = ${c}`, bar: bar(f, l, i === 0 ? 'bad' : '') }); o.on['s' + i] = i === 0 ? 'bad' : 1; lit(o, route(i), i === 0 ? 'bad' : ''); });
          stream(o, t, 9, k => [0, 1, 0, 2, 0, 1, 0, 2, 0][k], 2.6, k => [0, 1, 0, 2, 0, 1, 0, 2, 0][k] === 0 ? 'bad' : '');
          o.rows.rt = grp('router', 'key: cidade', ['SP → shard-0', ''], ['Rio → shard-1', ''], ['Recife → shard-2', '']);
          o.rows.side = grp('key comparison', 'efficiency', ['cliente_id + mkt-01: 55.6%', ''], ['cidade: 60.6% (ceiling: 3 shards)', 'bad'], ['cliente_id without partner: ~100%', '']);
          o.cnt = C3(['EFFICIENCY', '60.6%', 'bad'], ['VALUES', '3'], ['SP', '55%', 'bad']);
          o.res = [['SP with 55% → 60.6%', 'bad'], ['at most 3 shards', '']];
          if (t > 1) T(o, SPOT.s(0), 'SP: 55%', 'bad'); } },
      { id: 'data', dur: 5, title: 'Key criado_em: every write on the newest range', yk: 'THE KEY',
        code: ['shard = criado_em range', 'shard-0: 2024 (8M)', 'shard-1: 2025 (17M)', 'shard-2: 2026 (25M) ← the current year', 'writes: 0% / 0% / 100%', 'write efficiency = 1 ÷ (3 × 1) = 33.3%'],
        story: 'With the date as the key, each shard holds one year. Reading a month is easy, but every new order is from 2026, so 100% of the writes go to the same shard. The other two only hold the past. Write efficiency drops to 33.3%, and the same happens with a sequential id.',
        look: 'All the tokens go to shard-2 (2026); the 2024 and 2025 shards sit idle.',
        key: 'Range by date or sequential id: the write always lives at the end.',
        f(o, t) { const Y = [['2024', 0.16, '8M · 0% of the writes'], ['2025', 0.34, '17M · 0% of the writes'], ['2026', 0.5, '25M · 100% of the writes']];
          Y.forEach(([y, f, l], i) => { o.rows['s' + i] = { name: `shard-${i}`, meta: `criado_em ${y}`, bar: bar(f, l, i === 2 ? 'bad' : ''), cells: [], rows: [[i === 2 ? 'receives every write' : 'read-only past', i === 2 ? 'bad' : 'dim']] }; o.on['s' + i] = i === 2 ? 'bad' : 2; });
          quiet(o, route(0), route(1)); lit(o, route(2), 'bad'); stream(o, t, 6, () => 2, 2.2, () => 'bad');
          o.rows.rt = grp('router', 'key: criado_em', ['1054: 2026-11-27 20:08', 'acc'], ['→ shard-2 (2026)', 'bad'], ['every new order: 2026', 'bad']);
          o.rows.side = grp('the write', '', ['2024 e 2025: 0%', 'dim'], ['2026: 100%', 'bad'], ['write efficiency: 33.3%', 'bad']);
          o.cnt = C3(['EFFICIENCY', '33.3%', 'bad'], ['WRITES IN 2026', '100%', 'bad'], ['KEY', 'criado_em']);
          o.res = [['100% of the writes on shard-2', 'bad'], ['1 ÷ (3 × 1) = 33.3%', '']];
          if (t > 1) T(o, SPOT.s(2), 'every write here', 'bad'); } },
      { id: 'mitiga', dur: 5.5, title: 'Mitigation: a dedicated 2× shard for mkt-01', yk: 'THE MATH',
        code: ['dedicated shard-3: 2× machine = 300/s', 'mkt-01: 0.40 × T = 300 → T = 750', 'rest: 0.20 × 750 = 150 each', '→ all 4 saturate together at 750/s', '# salt: mkt-01#0 … mkt-01#7 (8 sub-keys)', '#   spreads it, but "mkt-01 orders" = 3 shards'],
        story: 'The first way out is to take the partner out of the math: mkt-01 gets shard-3, on a machine with double the capacity (300/s), and the rest splits across the 3 as before. With T = 750 orders/s, shard-3 receives 300 and each of the others 150: all 4 hit the ceiling together. The other way out is salt: splitting the key into mkt-01#0 to mkt-01#7, which spreads the partner but makes every query for it go to the 3 shards.',
        look: 'The dedicated shard-3 rises and mkt-01\'s cell moves to it; the 4 bars fill up equally.',
        key: 'Isolating the hot key: dedicated shard, salt, pre-partitioning or cache.',
        f(o, t) { o.show.s3 = 1; const mv = t > 1.2;
          o.rows.s0 = srv(0, ['davi'], { bar: bar(1, '150/s of 150') }); o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(1, '150/s of 150') });
          o.rows.s2 = srv(2, mv ? ['caio'] : ['caio', 'mkt'], { bar: bar(mv ? 1 : 0.6, mv ? '150/s of 150' : '60% of the rows', mv ? '' : 'bad'), tone: { mkt: 'bad' } });
          const d3 = { name: 'shard-3', meta: 'dedicated · 2×', bar: bar(mv ? 1 : 0, mv ? '300/s of 300' : 'empty'), cells: [mktCell(mv ? 'acc' : 'hide')], rows: [['only mkt-01', 'acc'], ['machine with double the capacity', 'dim']] }; o.rows.s3 = d3;
          for (let i = 0; i < 4; i++) { o.on['s' + i] = mv ? 1 : i === 2 ? 'bad' : 2; lit(o, route(i)); }
          if (!mv) hop(o, t, 0.3, cellAt('s2', srv(2, ['caio', 'mkt']), 2), cellAt('s3', d3, 0), 'acc', 0.9);
          o.rows.rt = grp('router', 'mkt-01 has its own rule', ['mkt-01 → shard-3', 'acc'], ['outros → murmur3 mod 3', ''], ['T = 750 orders/s', 'acc']);
          o.rows.side = grp('the 4 mitigations', '', ['1. dedicated 2× shard → 750/s', 'acc'], ['2. salt: mkt-01#0…#7 (~100%)', ''], ['3. pre-partition · 4. cache', '']);
          o.cnt = C3(['CAPACITY', mv ? '750/s' : '250/s', mv ? '' : 'bad'], ['SHARD-3', '300/s'], ['BEFORE', '250/s']);
          o.res = mv ? [['all 4 saturate together at 750/s', 'acc'], ['0.4 × 750 = 300 · 0.2 × 750 = 150', '']] : [];
          if (mv) T(o, SPOT.s(3), 'mkt-01 isolated'); } },
      { id: 'cardinal', dur: 5.5, title: 'What if it goes wrong: cidade does not go past 3 shards', yk: 'THE KEY',
        code: ['shard = cidade', '# 4th shard: there is no 4th city', 'shard-3 → 0 rows', 'SP stays at 55%', '# changing the key later:', '#   migrate the 50 million rows'],
        story: 'The store chose cidade and, when SP heated up, bought a fourth server. It stayed empty: there is no fourth city to send to it, and SP stays at 55% on a single shard. Changing the key now means rewriting the 50 million rows.',
        look: 'Shard-3 rises and stays empty, in red; SP keeps its bar at 55%.',
        key: 'You choose the key once: changing it later means migrating the whole table.',
        f(o, t) { o.show.s3 = 1; const CT = [['SP', ['bia', 'davi'], 0.55, '27.5M · 55%'], ['Rio', ['caio'], 0.25, '12.5M · 25%'], ['Recife', ['lena'], 0.2, '10M · 20%']];
          CT.forEach(([c, ks, f, l], i) => { o.rows['s' + i] = srv(i, ks, { meta: `cidade = ${c}`, bar: bar(f, l, i === 0 ? 'bad' : '') }); o.on['s' + i] = i === 0 ? 'bad' : 2; lit(o, route(i), i === 0 ? 'bad' : ''); });
          o.rows.s3 = { name: 'shard-3', meta: 'no city', bar: bar(0, '0 rows', 'bad'), cells: [], rows: [['no city', 'bad'], ['stays empty', 'bad']] }; o.on.s3 = t > 1 ? 'bad' : 2; quiet(o, route(3));
          o.rows.rt = grp('router', 'key: cidade', ['SP, Rio, Recife: 3 values', 'bad'], ['4 shards → 1 unused', 'bad']);
          o.rows.side = grp('change the key', '', ['rewrite 50M rows', 'bad'], ['100 GB of data', ''], ['new key: cliente_id', 'acc']);
          o.cnt = C3(['SHARD-3', '0 rows', 'bad'], ['SP', '55%', 'bad'], ['TO SWITCH', '50M rows']);
          o.res = t > 1 ? [['shard-3 empty: there is no 4th city', 'bad'], ['changing the key = migrating everything', 'bad']] : [];
          if (t > 1) T(o, SPOT.s(3), 'empty: only 3 cities', 'bad'); } },
    ],
    particoes: [
      { id: 'tabela', dur: 5, title: 'PARTITION BY RANGE (criado_em): 3 partitions', yk: 'THE SQL',
        code: ['CREATE TABLE pedidos ( … ,', '  PRIMARY KEY (id, criado_em)', ') PARTITION BY RANGE (criado_em);', 'CREATE TABLE pedidos_2024 PARTITION OF pedidos', "  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');", '-- and pedidos_2025, pedidos_2026'],
        story: 'Before separating servers, you can split the table inside the same PostgreSQL. pedidos becomes a parent table with 3 yearly partitions: 2024 with 8 million rows, 2025 with 17 and 2026 with 25. It is still one server, one disk and the same ceiling of 150/s; what changes is that each year is a separate physical table.',
        look: 'On top of the pg-pedidos base, 3 drawers rise, pedidos_2024, 2025 and 2026, with bars proportional to the rows.',
        key: 'Partitioning: dividing a table inside one instance.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.show['p' + i] = t > 0.4 + i * 0.4 ? 1 : 0; o.on['p' + i] = 1; } o.on.host = 2;
          o.rows.rt = grp('pedidos', 'parent table', ['PARTITION BY RANGE (criado_em)', 'acc'], ['PK (id, criado_em)', ''], ['3 partitions by year', '']);
          o.rows.side = grp('what you gain', 'still 1 server', ['pruning: read only the right year', 'acc'], ['retention: drop a whole year', ''], ['capacity: the same (150/s)', 'dim']);
          o.cnt = C3(['PARTITIONS', '3'], ['INSTANCES', '1'], ['ROWS', '8M · 17M · 25M']);
          o.res = [['3 physical tables, 1 logical', 'acc'], ['same server and same ceiling', '']];
          if (t > 1.6) T(o, SPOT.s(1), 'each year, one partition'); } },
      { id: 'pk', dur: 5.5, title: 'The author\'s lab: the PK without the partition key', yk: 'IN PSQL · table.sql',
        code: ['CREATE TABLE analytics.sales (id BIGSERIAL PRIMARY KEY,', '  … sale_date DATE …) PARTITION BY RANGE (sale_date);', 'ERROR: unique constraint on partitioned table', '  must include all partitioning columns', 'DETAIL: PRIMARY KEY constraint on table "sales"', '  lacks column "sale_date" …'],
        story: 'The author\'s repository table.sql creates analytics.sales with PRIMARY KEY (id) and PARTITION BY RANGE (sale_date). PostgreSQL refuses: on a partitioned table, the primary key has to include the partition column. With PRIMARY KEY (id, sale_date) the table is born, but with no partition at all, and the first INSERT fails.',
        look: 'The base turns red and no drawer rises: the parent table was not created.',
        key: 'On a partitioned table, the PK carries the partition key.',
        f(o, t) { for (let i = 0; i < 3; i++) o.show['p' + i] = 0; o.on.host = t > 1 ? 'bad' : 2;
          o.rows.host = { name: 'analytics.sales', meta: t > 1 ? 'not created' : '…', rows: [] };
          o.rows.rt = grp('analytics.sales', 'table.sql', ['PRIMARY KEY (id)', t > 1 ? 'bad' : ''], ['PARTITION BY RANGE (sale_date)', ''], ['sale_date missing from the PK', t > 1 ? 'bad' : 'dim']);
          o.rows.side = grp('the fix', 'in the store: (id, criado_em)', ['PRIMARY KEY (id, sale_date)', 'acc'], ['created, but with no partitions', 'bad'], ['1st INSERT: no partition … found', 'bad']);
          o.cnt = C3(['ERROR', 'PK without sale_date', 'bad'], ['PARTITIONS', '0'], ['FIX', 'PK (id, sale_date)']);
          o.res = t > 1 ? [['unique constraint … must include', 'bad'], ['all partitioning columns', 'bad']] : [];
          if (t > 1.2) T(o, SPOT.s(1), 'PK needs sale_date', 'bad'); } },
      { id: 'poda', dur: 5, title: 'With criado_em in the query: only pedidos_2026', yk: 'EXPLAIN',
        code: ['EXPLAIN SELECT * FROM pedidos', "  WHERE criado_em >= '2026-11-01'", "    AND criado_em <  '2026-12-01';", ' Seq Scan on pedidos_2026', "   Filter: criado_em >= … AND …", '-- pedidos_2024 and pedidos_2025: pruned'],
        story: 'The November 2026 report brings criado_em in the WHERE. The planner looks at the ranges, sees that only pedidos_2026 can have those rows and does not even open the other two. That is pruning (partition pruning): the plan shows a single partition.',
        look: 'The beam goes only to the 2026 drawer; 2024 and 2025 stay dark, marked as pruned.',
        key: 'Pruning: with the partition key, the database reads only the right partition.',
        f(o, t) { o.on.host = 2; o.on.p0 = 2; o.on.p1 = 2; o.on.p2 = t > 1 ? 1 : 2; quiet(o, route(0), route(1)); lit(o, route(2), '', t < 1 ? t : null);
          o.rows.p0.rows = [['pruned', 'dim']]; o.rows.p1.rows = [['pruned', 'dim']]; if (t > 1) o.rows.p2.rows = [['Seq Scan', 'acc'], ['November 2026', '']];
          o.rows.rt = grp('consulta', 'November report', ["criado_em >= '2026-11-01'", 'acc'], ["criado_em < '2026-12-01'", 'acc']);
          o.rows.side = grp('the plan', 'EXPLAIN', ['Seq Scan on pedidos_2026', 'acc'], ['2 partitions pruned', '']);
          o.cnt = C3(['PARTITIONS READ', t > 1 ? '1 of 3' : '…'], ['PRUNED', '2'], ['FILTER', 'criado_em']);
          o.res = t > 1 ? [['Seq Scan on pedidos_2026', 'acc'], ['2024 and 2025 pruned', '']] : [];
          if (t > 1.2) T(o, SPOT.s(2), 'only 2026'); } },
      { id: 'sempoda', dur: 5.5, title: 'With id only: Append on the 3 partitions', yk: 'EXPLAIN',
        code: ['EXPLAIN SELECT * FROM pedidos WHERE id = 1042;', ' Append', '   -> Index Scan using pedidos_2024_pkey …', '   -> Index Scan using pedidos_2025_pkey …', '   -> Index Scan using pedidos_2026_pkey …', '-- with id AND criado_em: 1 partition only'],
        story: 'Now the query brings only the id 1042. The id does not say the year, so the planner cannot prune anything: it builds an Append with an Index Scan on each partition. It is the scatter-gather from lesson 2, only inside one server. With id and criado_em together, it is back to a single partition.',
        look: 'The 3 beams light up; each drawer does its Index Scan.',
        key: 'Without the partition key in the query, the database reads every partition.',
        f(o, t) { o.on.host = 2; for (let i = 0; i < 3; i++) { o.on['p' + i] = t > 1 ? 1 : 2; lit(o, route(i), '', t < 1 ? t : null); if (t > 1) o.rows['p' + i].rows = [['Index Scan', 'acc'], [`pedidos_${2024 + i}_pkey`, '']]; }
          o.rows.rt = grp('consulta', 'id only', ['WHERE id = 1042', 'acc'], ['without criado_em: no pruning', 'bad']);
          o.rows.side = grp('the plan', 'EXPLAIN', ['Append', ''], ['Index Scan × 3', 'acc'], ['with id and criado_em: just 1', '']);
          o.cnt = C3(['PARTITIONS READ', t > 1 ? '3 of 3' : '…'], ['PRUNED', '0'], ['FILTER', 'id']);
          o.res = t > 1 ? [['Append: 3 Index Scans', 'acc'], ['id + criado_em: 1 partition', '']] : [];
          if (t > 1.2) T(o, SPOT.rt, 'Append on the 3'); } },
      { id: 'tiers', dur: 5, title: 'Tiers: 2026 hot, 2025 warm, 2024 cold', yk: 'THE TIERS',
        code: ['pedidos_2026: hot  · 25M · 50 GB · SSD', 'pedidos_2025: warm · 17M · 34 GB', 'pedidos_2024: cold · 8M  · 16 GB', '              cheap storage', '# the docs: rarely used data can go', '#   to cheaper media'],
        story: 'The years are not used equally. 2026 receives all the writes and almost all the reads; 2024 is only read for an old report. With partitions, each year can live on a different tablespace: the hot one on SSD, the cold one on cheap, slow storage.',
        look: 'The 2026 drawer glows strong (hot), 2025 is half-lit (warm) and 2024 is dark (cold).',
        key: 'A date range separates hot from cold, and each goes to the disk it deserves.',
        f(o, t) { o.on.host = 2; o.on.p2 = 1; o.on.p1 = 2; o.on.p0 = 0;
          const TI = [['cold', 'cheap storage'], ['warm', 'regular disk'], ['hot', 'SSD']];
          TI.forEach(([a, b], i) => { o.rows['p' + i].meta = a; o.rows['p' + i].rows = [[b, i === 2 ? 'acc' : 'dim'], [i === 2 ? 'all the writes' : 'read-only', i === 2 ? 'acc' : 'dim']]; });
          lit(o, route(2)); quiet(o, route(0), route(1)); stream(o, t, 4, () => 2, 2.4);
          o.rows.rt = grp('new orders', '2026', ['1054: 2026-11-27 20:08', 'acc'], ['→ pedidos_2026 (SSD)', 'acc']);
          o.rows.side = grp('the tiers', '', ['hot: 2026 · 50 GB · SSD', 'acc'], ['warm: 2025 · 34 GB', ''], ['cold: 2024 · 16 GB · cheap', 'dim']);
          o.cnt = C3(['HOT', '2026 · 50 GB'], ['WARM', '2025 · 34 GB'], ['COLD', '2024 · 16 GB']);
          o.res = [['each year on the disk it deserves', 'acc']]; if (t > 1) T(o, SPOT.s(2), 'hot: SSD'); } },
      { id: 'retencao', dur: 5.5, title: 'Retiring 2024: DELETE × DROP × DETACH', yk: 'IN PSQL · 105,407 ROWS',
        code: ["DELETE FROM pedidos WHERE criado_em < '2025-01-01';", '  62.9 ms  (leaves dead rows for VACUUM)', 'DROP TABLE pedidos_2024;', '  7.5 ms', 'ALTER TABLE pedidos DETACH PARTITION pedidos_2024;', '  1.1 ms'],
        story: 'The store\'s policy keeps two years. Deleting 2024 with DELETE scans the rows one by one and leaves dead rows for VACUUM; with 105,407 rows, on PostgreSQL 14, it took 62.9 ms. DROP TABLE on the partition took 7.5 ms, and DETACH PARTITION, which just unplugs the drawer, 1.1 ms. With 8 million rows the difference grows, but the same proportion is not guaranteed.',
        look: 'The 2024 drawer detaches from the base and sinks; the other two stay.',
        key: 'Retention by partition: detach or drop the drawer instead of deleting row by row.',
        f(o, t) { o.on.host = 2; o.on.p1 = 2; o.on.p2 = 2; const gone = t > 1.6; o.on.p0 = t > 0.6 ? 'bad' : 2; if (gone) o.show.p0 = 0;
          o.rows.p0.rows = [['DETACH PARTITION', 'bad'], ['1.1 ms', 'bad']];
          o.rows.rt = grp('retention', 'keeps 2 years', ['retire pedidos_2024', 'acc'], ['8M rows · 16 GB', '']);
          o.rows.side = grp('105,407 rows · PG 14', '', ['DELETE: 62.9 ms + VACUUM', 'bad'], ['DROP TABLE: 7.5 ms', ''], ['DETACH PARTITION: 1.1 ms', 'acc']);
          o.cnt = C3(['DETACH', '1.1 ms'], ['DROP', '7.5 ms'], ['DELETE', '62.9 ms', 'bad']);
          o.res = gone ? [['pedidos_2024 detached from the table', 'acc'], ['no dead rows, no VACUUM', '']] : [];
          if (t > 0.8) T(o, SPOT.s(0), 'DETACH: 1.1 ms'); } },
      { id: 'ano', dur: 6, title: 'What if it goes wrong: 1/1/2027 with no partition', yk: 'IN PSQL · 00:00:05',
        code: ["INSERT INTO pedidos (…, criado_em)", "  VALUES (…, '2027-01-05');", 'ERROR: no partition of relation "pedidos"', '  found for row', 'DETAIL: Partition key of the failing row contains', '  (criado_em) = (2027-01-05 00:00:00-03).'],
        story: 'The year rolled over and nobody created pedidos_2027. The first order with criado_em in 2027 has no drawer to land in, and PostgreSQL refuses the INSERT: "no partition of relation pedidos found for row". Every new order fails until someone creates the partition. The fix is a job that creates next year\'s partition with room to spare.',
        look: 'The token runs to the fourth slot, where the 2027 drawer should be, and turns red.',
        key: 'A date range requires creating the next partition before you need it.',
        f(o, t) { o.on.host = t > 1.6 ? 'bad' : 2; for (let i = 0; i < 3; i++) o.on['p' + i] = 2; o.rows.host.miss = 3; o.rows.host.missTone = t > 1.6 ? 'bad' : '';
          const pts = [...route(3), [SCX(3), SY + SD / 2, PL + 8]], f = ease(clamp((t - 0.4) / 1.2));
          lit(o, route(3), t > 1.6 ? 'bad' : '', null); o.tok.push({ p: alongPts(pts, cumLen(pts), f), tone: t > 1.6 ? 'bad' : '' });
          o.rows.rt = grp('new order', '2027-01-05', ["criado_em = '2027-01-05'", 'acc'], ['→ pedidos_2027?', t > 1.6 ? 'bad' : '']);
          o.rows.side = grp('the fix', 'a job', ['create pedidos_2027 in December', 'acc'], ['or a DEFAULT partition', ''], ['test before the rollover', '']);
          o.cnt = C3(['PARTITION', t > 1.6 ? 'does not exist' : '…', t > 1.6 ? 'bad' : ''], ['CRIADO_EM', '2027-01-05'], ['INSERT', t > 1.6 ? 'ERROR' : '…', t > 1.6 ? 'bad' : '']);
          o.res = t > 1.6 ? [['no partition of relation "pedidos"', 'bad'], ['found for row', 'bad']] : [];
          if (t > 1.6) T(o, SPOT.s(3), 'without pedidos_2027', 'bad'); } },
    ],
    hash: [
      { id: 'func', dur: 4.5, title: 'The function: 32-bit murmur3, mod 3', yk: 'THE ROUTER',
        code: ["lena-77 → 0x8fd9d9d8 → mod 3 = 1", "bia-31  → 0x12bd9b3b → mod 3 = 1", "caio-58 → 0x8c6d56ed → mod 3 = 2", "davi-12 → 0x06de0db0 → mod 3 = 0", "mkt-01  → 0x9ebaf255 → mod 3 = 2", '# spaolacci/murmur3 Sum32, seed 0'],
        story: 'The router uses the 32-bit murmur3, the same as the author\'s murmur/ lab (spaolacci/murmur3, Sum32), over the cliente_id as is, without lowercasing. The 32-bit number comes out scrambled; the remainder of dividing by 3 picks the shard. For the story\'s 5 customers it gives 1, 1, 2, 0 and 2.',
        look: 'The router goes through the 5 customers; each one\'s shard beam lights up in its turn.',
        key: 'Hash: turns the key into a number; the mod picks the shard.',
        f(o, t) { const j = Math.floor(t / 0.9) % 5, k = ORDER[j]; o.on.rt = 1; o.rows.rt = m3rt(k);
          for (let i = 0; i < 3; i++) { o.on['s' + i] = i === CL[k].m3 ? 1 : 2; if (i === CL[k].m3) lit(o, route(i), '', (t % 0.9) / 0.9); else quiet(o, route(i)); }
          o.rows['s' + CL[k].m3] = srv(CL[k].m3, M3[CL[k].m3], { tone: { [k]: 'acc' } });
          o.rows.side = grp('mod 3 results', '', ['lena 1 · bia 1 · caio 2', ''], ['davi 0 · mkt-01 2', ''], ['murmur3 32 bits, seed 0', 'dim']);
          o.cnt = C3(['CUSTOMER', CL[k].id], ['MURMUR3', CL[k].h], ['MOD 3', String(CL[k].m3)]);
          o.res = [[`${CL[k].id} → shard-${CL[k].m3}`, 'acc']]; } },
      { id: 'quatorze', dur: 6.5, title: 'The 14 orders on 3 shards: 3 / 9 / 2', yk: 'THE COUNT',
        code: ['shard-0: davi-12 (3)', 'shard-1: lena-77 (6) + bia-31 (3) = 9', 'shard-2: caio-58 (2) + mkt-01', '# 14 rows: law of small numbers', '# 100,000 keys c-0…c-99999:', '#   all within ≤ 2% of the ideal'],
        story: 'The 14 sample orders fall one by one. At the end, shard-0 has 3, shard-1 has 9 and shard-2 has 2 (plus mkt-01). It looks lopsided, but it is only 4 customers: the law of small numbers. With 100,000 synthetic keys, murmur3, FNV-1a and SHA-256 all land within 2% of the ideal.',
        look: 'The 14 tokens leave the router in order, from 1041 to 1054, and each one lights up its cell.',
        key: 'With few keys the math looks lopsided; with many, the hash spreads evenly.',
        f(o, t) { const ALL = [...CL.lena.ped, ...CL.bia.ped, ...CL.caio.ped, ...CL.davi.ped].sort((a, b) => a - b);
          const land = p => 0.4 + ALL.indexOf(p) * 0.34 + 0.8; o.on.rt = 1;
          const ds = M3.map((ks, i) => srv(i, ks, { tone: Object.fromEntries(ks.map(k => [k, k === 'mkt' ? '' : p => t > land(p) ? (t < land(p) + 0.6 ? 'acc' : '') : 'hide'])) }));
          ds.forEach((d, i) => { o.rows['s' + i] = d; const n = d.cells.filter(c => c.c !== 'mkt' && c.tn !== 'hide').length; d.rows = [[`${n} ${n === 1 ? 'order' : 'orders'}`, 'acc'], ...legend(M3[i])].slice(0, 3); o.on['s' + i] = 2; quiet(o, route(i)); });
          ALL.forEach(p => { const k = ownerOf(p), i = CL[k].m3, d = ds[i], idx = d.cells.findIndex(c => c.o === String(p)); fly(o, t, land(p) - 0.8, 's' + i, d, idx, '', 0.8); });
          const cur_ = ALL.filter(p => t > land(p) - 0.8).pop() || ALL[0], k = ownerOf(cur_);
          o.rows.rt = grp('router', `order ${cur_}`, [`murmur3("${CL[k].id}")`, 'acc'], [`mod 3 = ${CL[k].m3} → shard-${CL[k].m3}`, 'acc']);
          const cnt = [0, 1, 2].map(i => ds[i].cells.filter(c => c.c !== 'mkt' && c.tn !== 'hide').length);
          o.rows.side = grp('the count', '14 orders', [`shard-0: ${cnt[0]} · shard-1: ${cnt[1]} · shard-2: ${cnt[2]}`, 'acc'], ['few keys: looks lopsided', 'dim'], ['100,000 keys: ≤ 2% of the ideal', '']);
          o.cnt = C3(['COUNT', cnt.join(' / ')], ['ORDERS', String(cnt[0] + cnt[1] + cnt[2]) + ' of 14'], ['FUNCTION', 'murmur3 mod 3']);
          o.res = cnt[0] + cnt[1] + cnt[2] === 14 ? [['3 / 9 / 2 in the sample', 'acc'], ['law of small numbers', '']] : []; } },
      { id: 'quatro', dur: 6.5, title: 'mod 3 → mod 4: 4 of 5 customers change shard', yk: 'THE MATH',
        code: ['lena-77: mod 3 = 1 → mod 4 = 0', 'bia-31:  1 → 3', 'caio-58: 2 → 1', 'mkt-01:  2 → 1', 'davi-12: 0 → 0  (the only one that stays)', '# 100,000 keys: 75.2% move'],
        story: 'The store turns on shard-3 and the router starts doing mod 4. The math changes for almost everyone: Lena goes from 1 to 0, Bia from 1 to 3, Caio and mkt-01 from 2 to 1. Only Davi stays. On the 100,000 test keys, 75.2% change shard, and many go from one old shard to another old one.',
        look: 'Shard-3 rises; the tokens that change jump from one server to another and light up. Only Davi\'s cells stay still.',
        key: 'With mod N, going from N to N + 1 changes the fraction N ÷ (N + 1): from 3 to 4, 75%.',
        f(o, t) { o.show.s3 = 1; const mv = t > 1;
          const old = M3.map((ks, i) => srv(i, ks)), nw = M4.map((ks, i) => srv(i, ks, { tone: Object.fromEntries(ks.map(k => [k, k === 'davi' ? '' : 'acc'])) }));
          const moving = []; ORDER.forEach(k => { if (k === 'davi') return; const a = CL[k].m3, b = CL[k].m4;
            (k === 'mkt' ? ['mkt'] : CL[k].ped).forEach((p, j) => moving.push({ k, p, a, b, t0: 1.0 + moving.length * 0.12 })); });
          if (mv) { nw.forEach((d, i) => { d.cells.forEach(c => { const m = moving.find(x => (x.k === 'mkt' ? c.c === 'mkt' : c.o === String(x.p))); if (m && t < m.t0 + 1.3) c.tn = 'hide'; }); });
            moving.forEach(m => { const oi = old[m.a].cells.findIndex(c => m.k === 'mkt' ? c.c === 'mkt' : c.o === String(m.p)), ni = nw[m.b].cells.findIndex(c => m.k === 'mkt' ? c.c === 'mkt' : c.o === String(m.p));
              const from = cellAt('s' + m.a, old[m.a], oi), to = cellAt('s' + m.b, nw[m.b], ni); hop(o, t, m.t0, from, to, 'acc', 1.3); }); }
          for (let i = 0; i < 4; i++) { const d = mv ? nw[i] : i < 3 ? old[i] : { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['new', 'acc']] };
            if (mv) { const ch = d.cells.filter(c => c.c !== 'mkt' && c.c !== 'davi').length, mk = d.cells.some(c => c.c === 'mkt');
              d.rows = [[ch || mk ? `arrived: ${ch}${mk ? ' + mkt-01' : ''}` : 'nobody arrived', ch || mk ? 'acc' : 'dim'], ...legend(M4[i])].slice(0, 3); if (i === 2) d.rows = [['0 sample orders', 'dim'], ['all left', 'bad']]; }
            o.rows['s' + i] = d; o.on['s' + i] = mv ? 1 : 2; }
          o.rows.rt = grp('router', mv ? 'mod 4' : 'mod 3', [mv ? 'shard = murmur3(cliente_id) mod 4' : 'shard = murmur3(cliente_id) mod 3', 'acc'], ['4 of 5 customers change', mv ? 'bad' : 'dim'], ['only davi-12 stays', '']);
          o.rows.side = grp('what moves', '3 → 4 shards', ['sample: 11 of 14 orders + mkt-01', 'acc'], ['100,000 keys: 75.2%', 'bad'], ['37.5M rows · 75 GB · 25 min', 'bad']);
          for (let i = 0; i < 4; i++) quiet(o, route(i));
          o.cnt = C3(['MOVE', mv ? '75.2%' : '…', 'bad'], ['CUSTOMERS', mv ? '4 of 5' : '…'], ['TO MOVE', '75 GB · 25 min']);
          o.res = mv ? [['75.2% of the keys change shard', 'bad'], ['37.5M rows at 50 MB/s = 25 min', '']] : [];
          if (t > 2.6) T(o, SPOT.s(0), 'davi-12 stays on shard-0', 'dim'); } },
      { id: 'fracao', dur: 5, title: 'N ÷ (N + 1): why mod moves almost everything', yk: 'THE FORMULA',
        code: ['going from N to N + 1 changes N ÷ (N + 1)', '3 → 4: 75.2%   (theory 75%)', '3 → 6: 49.9%   (double: 50%)', '3 → 2: 66.7%   (the 2/3 from module 7)', '9 → 10: 90%', '# the ideal would be 1 ÷ (N + 1) = 25%'],
        story: 'With mod N, a key only stays in place if the remainder is the same with N and with N + 1, and that happens for 1 in every N + 1 keys. From 3 to 4, 75% change; from 9 to 10, 90%. The least bad case is doubling (3 → 6, 49.9%), and that is why PostgreSQL asks for moduli that are factors of each other. The ideal would be to move only what goes to the new shard: 25%.',
        look: 'The 4 shards keep the new split; the board compares 75.2% with the ideal of 25%.',
        key: 'Mod cannot grow: almost every key changes when N changes.',
        f(o, t) { o.show.s3 = 1; for (let i = 0; i < 4; i++) { o.rows['s' + i] = srv(i, M4[i]); o.on['s' + i] = 2; quiet(o, route(i)); } o.rows.s2.rows = [['0 sample orders', 'dim']];
          o.rows.rt = grp('router', 'mod 4', ['stays: same remainder with 3 and 4', ''], ['1 in every 4 keys', 'acc']);
          o.rows.side = grp('how much changes', 'mod N', ['3 → 4: 75.2% · 3 → 6: 49.9%', 'bad'], ['3 → 2: 66.7% · 9 → 10: 90%', 'bad'], ['ideal 3 → 4: 25%', 'acc']);
          o.cnt = C3(['3 → 4', '75.2%', 'bad'], ['3 → 6', '49.9%'], ['IDEAL', '25%']);
          o.res = [['N ÷ (N + 1) of the keys change', 'bad'], ['ideal: 1 ÷ (N + 1)', 'acc']]; } },
      { id: 'deploy', dur: 6.5, title: 'What if it goes wrong: two versions, 1054 vanishes', yk: 'THE DEPLOY',
        code: ["v2 (mod 4): murmur3('lena-77') mod 4 = 0", '  → INSERT 1054 on shard-0', "v1 (mod 3): murmur3('lena-77') mod 3 = 1", '  → SELECT … my orders on shard-1', '# 1054 does not show up', '# module 22: two-version deploy'],
        story: 'During the deploy, half the replicas already run v2 (mod 4) and half still run v1 (mod 3). Lena closes 1054 on a v2 replica, which writes to shard-0. A second later she opens "my orders" and lands on a v1 replica, which looks on shard-1. The order exists, paid, and does not show up for her.',
        look: 'The 1054 token goes to shard-0 through v2; v1\'s query goes to shard-1 and comes back red, without 1054.',
        key: 'Changing N requires all versions to use the same map at the same time.',
        f(o, t) { o.show.s3 = 1;
          const d0 = srv(0, ['davi'], { rows: [['davi-12 · 3 orders', '', 'davi'], ['1054 (v2, mod 4)', t > 1.6 ? 'acc' : 'dim']] }); d0.cells.push(ped(1054, t > 1.6 ? 'acc' : 'hide')); o.rows.s0 = d0;
          const d1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1054 ? 'ghost' : t > 2.6 ? 'bad' : '' } }); o.rows.s1 = d1;
          o.rows.s3 = { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['new, empty', 'dim']] };
          const f = fly(o, t, 0.5, 's0', d0, 3, 'acc', 1.1); if (t > 1.6) o.on.s0 = 1; else o.on.s0 = 2;
          if (t > 1.9) { lit(o, route(1), 'bad', t < 2.6 ? (t - 1.9) / 0.7 : null); o.on.s1 = t > 2.6 ? 'bad' : 2; } else quiet(o, route(1));
          o.on.s2 = 2; o.on.s3 = 2; quiet(o, route(2), route(3));
          o.rows.rt = grp('2 versions live', 'half-way deploy', ['v2: mod 4 = 0 → writes to shard-0', 'acc'], ['v1: mod 3 = 1 → reads shard-1', t > 1.9 ? 'bad' : 'dim'], ['"my orders": without 1054', t > 2.6 ? 'bad' : 'dim']);
          o.rows.side = grp('order 1054', 'lena-77 · 64.00', ['written on shard-0', t > 1.6 ? 'acc' : 'dim'], ['looked up on shard-1', t > 1.9 ? 'bad' : 'dim'], ['Lena does not see the order', t > 2.6 ? 'bad' : 'dim']);
          o.cnt = C3(['WROTE TO', t > 1.6 ? 'shard-0' : '…'], ['READ FROM', t > 1.9 ? 'shard-1' : '…', 'bad'], ['MY ORDERS', t > 2.6 ? '5 of 6' : '…', 'bad']);
          o.res = t > 2.6 ? [['1054 written, but invisible', 'bad'], ['v1 and v2 with different maps', 'bad']] : [];
          if (t > 1.7) T(o, SPOT.s(0), 'v2 wrote here'); if (t > 2.7) T(o, SPOT.s(1), 'v1 reads here: no 1054', 'bad'); } },
    ],
  };
  const L = () => STEPS[sc], N = () => L().length, cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  function spec() { const o = base(); cur().f(o, lt); return o; }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function head(x, u, d, W_, col, s1 = 11) {   // nome à esquerda, meta à direita, na primeira linha
    const hy = Math.max(8.5, s1 * 0.62); x.textAlign = 'left'; x.fillStyle = col; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.55 : W_ - 10); x.fillText(d.name, u(5), u(hy)); const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.4, W_ - nw - 16); x.fillText(d.meta, u(W_ - 5), u(hy)); x.textAlign = 'left'; } }
  const cellFill = (tn, light) => tn === 'bad' ? (light ? '#f0d6d2' : '#3a1712') : tn === 'acc' ? (light ? '#f1dcc4' : '#3a2512') : light ? '#ebebea' : '#17181a';
  function drawRows(x, u, rows, y, lh, size, W_, on) {
    for (const [text, tn, sw] of rows || []) { if (!text) { y += lh; continue; } let X = 5;
      if (sw) { x.fillStyle = ccol(sw); x.fillRect(u(5), u(y - 4), u(8), u(8)); X = 17; }
      x.fillStyle = on === 'bad' && tn !== 'acc' && tn !== 'dim' ? BAD() : toneC(tn); fitFont(x, u, text, size, W_ - X - 5); x.fillText(text, u(X), u(y)); y += lh; }
  }
  function drawBlock(nm, Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, on === 1, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P, light = theme === 'light';
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : C.inkHi, k = Bk.kind;
    if (k === 'srv') { head(x, u, d, W_, col, Bk.cols > 4 ? 16 : 15);
      let y = 22;
      if (d.bar) { const [f, label, tn] = d.bar, bw = W_ - 10;
        x.fillStyle = light ? '#dcdddd' : '#0c0d0e'; x.fillRect(u(5), u(19), u(bw), u(7));
        x.fillStyle = tn === 'bad' ? BAD() : on === 1 || tn === 'acc' ? accC() : (light ? '#6a6f73' : '#868b8f'); x.fillRect(u(5), u(19), u(bw * clamp(f)), u(7));
        x.strokeStyle = C.line; x.lineWidth = u(0.4); x.strokeRect(u(5), u(19), u(bw), u(7));
        if (label) { x.fillStyle = tn === 'bad' ? BAD() : INK(); fitFont(x, u, label, 11, bw); x.fillText(label, u(5), u(34)); }
        y = C0; }
      const R = cellRects(nm, d);
      (d.cells || []).forEach((c, i) => { if (c.tn === 'hide') return; const [X, Y, w, h] = R[i];
        if (c.tn === 'ghost') { x.setLineDash([u(2), u(2)]); x.strokeStyle = INK(); x.lineWidth = u(0.6); x.strokeRect(u(X + 1), u(Y), u(w - 2), u(h)); x.setLineDash([]); }
        else { x.fillStyle = cellFill(c.tn, light); x.fillRect(u(X + 1), u(Y), u(w - 2), u(h)); x.fillStyle = ccol(c.c); x.fillRect(u(X + 1), u(Y), u(3.2), u(h));
          x.strokeStyle = c.tn === 'bad' ? BAD() : c.tn === 'acc' ? accC() : C.line; x.lineWidth = u(c.tn === 'acc' || c.tn === 'bad' ? 1 : 0.5); x.strokeRect(u(X + 1), u(Y), u(w - 2), u(h)); }
        x.textAlign = 'center'; x.fillStyle = c.tn === 'bad' ? BAD() : c.tn === 'acc' ? accC() : c.tn === 'ghost' ? INK() : C.inkHi; fitFont(x, u, c.o, Bk.cols > 4 ? 12 : 13, w - 8); x.fillText(c.o, u(X + 2 + w / 2), u(Y + h / 2 + 0.4)); x.textAlign = 'left'; });
      if (R.length) y = Math.max(...R.map(r => r[1] + r[3])) + 10; else if (!d.bar) y = 27;
      drawRows(x, u, d.rows, y, Bk.cols > 4 ? 16 : 15, Bk.cols > 4 ? 12 : 11.5, W_, on);
    }
    else if (k === 'host') {
      x.fillStyle = col; fitFont(x, u, d.name, 13, 300); x.textAlign = 'left'; x.fillText(d.name, u(8), u(H_ - 9));
      if (d.meta) { x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, 300); x.textAlign = 'right'; x.fillText(d.meta, u(W_ - 8), u(H_ - 9)); x.textAlign = 'left'; }
      if (d.miss != null) { const X = SX(d.miss) - Bk.x - 2.5, Y = SY - 2 - Bk.y - 2.5, tn = d.missTone;
        x.setLineDash([u(3), u(2.5)]); x.strokeStyle = tn === 'bad' ? BAD() : INK(); x.lineWidth = u(tn === 'bad' ? 1.2 : 0.7); x.strokeRect(u(X), u(Y), u(SW), u(SD - 6)); x.setLineDash([]);
        x.textAlign = 'center'; x.fillStyle = tn === 'bad' ? BAD() : INK(); fitFont(x, u, 'pedidos_2027', 13, SW - 10); x.fillText('pedidos_2027', u(X + SW / 2), u(Y + 50));
        fitFont(x, u, 'does not exist', 10.5, SW - 10); x.fillText('does not exist', u(X + SW / 2), u(Y + 68)); x.textAlign = 'left'; } }
    else {   // svc (roteador) e grp (quadro): nome, meta e linhas
      const s1 = k === 'svc' ? 17 : 14.5; head(x, u, d, W_, col, s1);
      if (k === 'svc') { x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(20)); x.lineTo(u(W_ - 4), u(20)); x.stroke(); }
      drawRows(x, u, d.rows, k === 'svc' ? 34 : 30, k === 'svc' ? 19 : 18, k === 'svc' ? 15 : 13.5, W_, on); }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), yl = s.code;
    const key = JSON.stringify([o.cnt, o.res, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x, P } = cv, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y, mw = 140) => { x.fillStyle = INK(); fitFont(x, u, t, 8.4, mw); x.fillText(t, u(X), u(Y)); };
    o.cnt.slice(0, 3).forEach(([lab, val, tn], i) => { const Y = 14 + i * 47; lbl(lab.toUpperCase(), 10, Y);
      x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? C.inkHi : i === 0 || tn === 'acc' ? acc : C.inkHi; fitFont(x, u, val, 18, 142); x.fillText(val, u(10), u(Y + 19)); });
    const L0 = 166; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 8), u(6)); x.lineTo(u(L0 - 8), u(147)); x.stroke();
    lbl(s.yk || 'IN THE CODE', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULT', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : tn === 'acc' ? acc : C.inkHi; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const TB = (head, rows, on = -1) => `<table class="h3-sum"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map((r, i) => `<tr${i === on ? ' class="on"' : ''}>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const CLT = on => TB(['customer', 'murmur3', 'mod 3', 'mod 4'], ORDER.map(k => [CL[k].id, CL[k].h, CL[k].m3, CL[k].m4]), on);
  const DATA = {
    topologia: () => `<li>Table <b>pedidos</b>: <b>50,000,000</b> rows × <b>2 KB</b> = <b>100 GB</b>; indexes +40% = <b>140 GB</b>; <b>200 GB</b> volume (70%)</li><li>Growth: 5 orders/s × 86,400 = <b>432,000/day</b> = <b>1.21 GB/day</b>; the 60 GB free run out in <b>~50 days</b></li><li>Backup at 50 MB/s: <b>47 min</b> (1 server) → <b>15 min 33 s</b> (3 shards in parallel)</li>${TB(['customer', 'orders', 'shard (mod 3)'], [['lena-77', '1042, 1044, 1047, 1048, 1051, 1054', 'shard-1'], ['bia-31', '1043, 1046, 1049', 'shard-1'], ['caio-58', '1041, 1053', 'shard-2'], ['davi-12', '1045, 1050, 1052', 'shard-0'], ['mkt-01', '20,000,000 (40%)', 'shard-2']], 0)}<li>Order <b>1054</b>: 1 black T-shirt 49.00 + Recife shipping 15.00 = <b>64.00</b></li>`,
    consulta: () => `<li>Nominal capacity: 3 × 150 = <b>450 orders/s</b>; <b>46.7 GB</b> per shard</li>${TB(['shards (N)', 'any above p99', 'any down (99.9%)'], [['1', '1.00%', '0.10%'], ['3', '2.97%', '0.30%'], ['10', '9.56%', '0.9955%'], ['50', '39.5%', '4.88%'], ['100', '63.4%', '—']], 1)}<li>Tail: <b>1 − 0.99^N</b> (Dean and Barroso, "The Tail at Scale"); availability: <b>1 − 0.999^N</b></li><li>For <b>one customer</b> the chance of being left without orders stays at <b>0.1%</b></li>`,
    chave: () => `<li>Cluster efficiency = <b>1 ÷ (number of shards × fraction of the hottest)</b></li>${TB(['key', 'hottest', 'efficiency'], [['cliente_id (with mkt-01)', '60%', '55.6%'], ['cidade', 'SP 55%', '60.6%'], ['criado_em or id', '100% of the writes', '33.3%'], ['cliente_id (without partner)', '~33%', '~100%']], 0)}<li>mkt-01: 20M rows (40%) on <b>shard-2</b> → 30M (60%); saturates at <b>T = 250</b> orders/s (out of 450)</li><li>Dedicated 2× shard (300/s): all 4 saturate together at <b>T = 750</b></li><li>The article's example: 3 customers = 50% of usage in 10 partitions → 55% on one → <b>18.2%</b></li>`,
    particoes: () => `<li>PostgreSQL 14, one instance: <b>PARTITION BY RANGE (criado_em)</b>, <b>PRIMARY KEY (id, criado_em)</b></li>${TB(['partition', 'rows', 'size', 'tier'], [['pedidos_2024', '8M', '16 GB', 'cold'], ['pedidos_2025', '17M', '34 GB', 'warm'], ['pedidos_2026', '25M', '50 GB', 'hot']], 2)}<li>With criado_em: <b>Seq Scan on pedidos_2026</b>; with id only: <b>Append</b> with 3 Index Scans</li><li>105,407 rows: DELETE <b>62.9 ms</b> · DROP <b>7.5 ms</b> · DETACH <b>1.1 ms</b></li><li>PostgreSQL's hash (MODULUS 3) on the sample: <b>11 / 3 / 0</b> (PostgreSQL's own function)</li>`,
    hash: () => `${CLT(0)}<li>32-bit murmur3 (spaolacci/murmur3 Sum32, seed 0), no lowercasing</li><li>mod 3 on the sample: <b>3 / 9 / 2</b>; mod 4: <b>4 of 5</b> customers change (only davi-12 stays)</li>${TB(['change', 'keys that move'], [['3 → 4', '75.2% (37.5M rows, 75 GB, 25 min)'], ['3 → 6', '49.9%'], ['3 → 2', '66.7%']], 0)}<li>100,000 keys on 5 shards (max ÷ mean): SHA-256 1.009 · MD5 1.018 · FNV-1a 1.003 · murmur3 1.007</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'Code')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'shards') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'shards' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-shards3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'shards') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01; Bk.g.position.copy(W(Bk.x, Bk.y, Bk.z0 - (1 - e) * (Bk.h + Bk.z0 - PL + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(nm, Bk, o.rows[nm], on);
      Bk.mat.emissiveIntensity = on === 1 ? (Bk.kind === 'srv' ? 0.3 : 0.4) : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.x + Bk.w / 2, Bk.y + Bk.d / 2, Bk.z0 + Bk.h + 3], on === 1 && Bk.f > 0.9 && Bk.kind === 'srv' ? 0.6 : 0); });
    setBeams(o.beams); setTokens(o.tok); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('k3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-10, 812, 8, 455];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.84 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.74 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
      const k = 1 - Math.exp(-dt / 0.5), P = Tg.clone().addScaledVector(dir, D);
      controls.target.lerp(Tg, k); camera.position.lerp(P, k);
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
    if (/^[1-5]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'keys: → next · ← back · C or 1–5 scenario · drag to rotate' };
})() });
