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
  const SCNAME = { topologia: 'Topologia', consulta: 'Consulta', chave: 'Chave', particoes: 'Partições', hash: 'Hash' };
  const SCFULL = { topologia: 'De 1 servidor para 3 shards', consulta: 'Com chave, sem chave e a cauda', chave: 'A chave e o cliente quente',
    particoes: 'Partições dentro de 1 servidor', hash: 'murmur3 mod 3, depois mod 4' };
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
  const legend = keys => keys.filter(k => k !== 'mkt').map(k => [`${CL[k].id} · ${CL[k].ped.length} ${CL[k].ped.length === 1 ? 'pedido' : 'pedidos'}`, '', k]);

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
  const m3rt = (k, tn = 'acc') => grp('roteador', 'murmur3 32 bits', [`murmur3("${CL[k].id}")`, tn], [`= ${CL[k].h}`, tn], [`mod 3 = ${CL[k].m3} → shard-${CL[k].m3}`, tn]);
  function base() {
    const o = { show: {}, on: {}, rows: {}, beams: [], tags: [], tok: [], cnt: [], res: [] };
    (cur().show || SHOW[sc]).forEach(n => o.show[n] = 1);
    o.rows.one = { name: 'pg-pedidos', meta: 'PostgreSQL · banco loja', bar: bar(0.7, '140 GB de 200 GB · 70%', ''), cells: [...cellsOf(['lena', 'bia', 'caio', 'davi'])],
      rows: [['tabela pedidos: 50.000.000 linhas · 2 KB por linha', ''], ['100 GB de dados + 40% de índices = 140 GB', 'dim'], ['teto do banco: 150 pedidos/s', 'dim']] };
    for (let i = 0; i < 3; i++) o.rows['s' + i] = srv(i, M3[i]);
    o.rows.s3 = { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['vazio', 'dim']] };
    o.rows.host = { name: 'pg-pedidos', meta: '1 instância · PostgreSQL 14', rows: [] };
    const PY = [['2024', 0.16, '8M linhas · 16 GB'], ['2025', 0.34, '17M linhas · 34 GB'], ['2026', 0.5, '25M linhas · 50 GB']];
    PY.forEach(([y, f, l], i) => { o.rows['p' + i] = { name: `pedidos_${y}`, meta: '', bar: bar(f, l), cells: [], rows: [[`FROM '${y}-01-01'`, 'dim'], [`TO '${+y + 1}-01-01'`, 'dim']] }; });
    o.rows.p3 = { name: 'pedidos_2027', meta: '', cells: [], rows: [] };
    o.rows.rt = grp('roteador', 'murmur3 32 bits', ['shard = murmur3(cliente_id) mod 3', 'dim'], ['sem estado: só a conta', 'dim'], ['', '']);
    o.rows.side = grp('a conta', '', ['', '']);
    return o;
  }

  const STEPS = {
    topologia: [
      { id: 'um', dur: 4, title: 'Um servidor, 50 milhões de linhas', yk: 'NO PSQL',
        code: ["SELECT count(*) FROM pedidos;", '  50000000', "SELECT pg_size_pretty(", "  pg_total_relation_size('pedidos'));", '  140 GB', '# volume de 200 GB'],
        story: 'O módulo 15 deixou o eixo Z como o único que a loja nunca usou, e o módulo 14 mostrou o teto: o banco do pedidos aguenta 150 pedidos/s, e réplicas do serviço não mudam isso. A tabela pedidos, que no módulo 4 tinha 6 linhas, hoje tem 50 milhões. São 2 KB por linha, 100 GB de dados e 140 GB com os índices, num volume de 200 GB.',
        look: 'Um bloco só, pg-pedidos, com a barra em 70%. As células são os 14 pedidos da amostra, uma cor por cliente.',
        key: 'Tudo num servidor: um disco, um backup, um teto de escrita.',
        f(o, t) { o.on.one = 1;
          o.rows.side = grp('a amostra da história', '14 pedidos + o parceiro', ['lena-77 · 6   bia-31 · 3', ''], ['caio-58 · 2   davi-12 · 3', ''], ['mkt-01: 20.000.000 linhas (40%)', 'acc']);
          o.rows.rt = grp('serviço pedidos', '1 banco', ['grava tudo em pg-pedidos', 'dim'], ['teto: 150 pedidos/s', 'dim']);
          o.cnt = C3(['LINHAS', '50.000.000'], ['DISCO', '140 de 200 GB'], ['TETO', '150 pedidos/s']);
          o.res = [['60 GB livres', 'acc'], ['1 servidor guarda tudo', '']];
          if (t > 1.2) T(o, [SCX(1), SY + 8, 64], 'pedidos: 50M linhas'); } },
      { id: 'tempo', dur: 5, title: '1,21 GB por dia: o disco acaba em 50 dias', yk: 'A CONTA',
        code: ['5 pedidos/s × 86.400 s = 432.000/dia', '432.000 × 2 KB × 1,4 = 1,21 GB/dia', '60 GB livres ÷ 1,21 = ~50 dias', '', 'backup: 140.000 MB ÷ 50 MB/s', '  = 2.800 s ≈ 47 min'],
        story: 'A loja grava 5 pedidos por segundo em média: 432.000 por dia. Com 2 KB por linha e 40% de índices, são 1,21 GB a mais todo dia, e os 60 GB livres acabam em uns 50 dias. O backup completo, a 50 MB/s, já leva 47 minutos.',
        look: 'A barra do disco enche de 70% até 100%; o mostrador conta os dias que sobram.',
        key: 'Os gatilhos da loja são o disco, o backup e o teto de escrita.',
        f(o, t) { const f = clamp((t - 0.6) / 2.6), dias = Math.round(50 * (1 - f)); o.on.one = f >= 1 ? 'bad' : 1;
          o.rows.one.bar = bar(0.7 + 0.3 * f, `${Math.round(140 + 60 * f)} GB de 200 GB · ${Math.round(70 + 30 * f)}%`, f >= 1 ? 'bad' : '');
          o.rows.side = grp('o crescimento', '5 pedidos/s', ['432.000 pedidos/dia', ''], ['+1,21 GB por dia', 'acc'], ['backup completo: 47 min', 'bad']);
          o.rows.rt = grp('serviço pedidos', '1 banco', ['5 pedidos/s em média', 'dim'], ['grava tudo em pg-pedidos', 'dim']);
          o.cnt = C3(['DIAS DE DISCO', f >= 1 ? '0' : '~' + dias], ['POR DIA', '+1,21 GB'], ['BACKUP', '47 min', 'bad']);
          o.res = f >= 1 ? [['volume cheio em ~50 dias', 'bad'], ['backup de 47 min', 'bad']] : [['60 GB livres', '']];
          stream(o, t, 3, () => 1, 2.4);
          if (f >= 1) T(o, [SCX(1), SY + 8, 64], '200 GB: cheio', 'bad'); } },
      { id: 'escada', dur: 4.5, title: 'Antes de partir: a escada de remédios', yk: 'A ORDEM DOS REMÉDIOS',
        code: ['1. índice            (módulo 4)', '2. cache             (módulo 5)', '3. réplicas leitura  (módulo 17)', '4. particionar       (aula 4)', '5. sharding          (este módulo)', '# 50M linhas ainda cabem num PostgreSQL'],
        story: 'Partir a tabela é o último degrau. Antes vêm o índice (módulo 4), o cache (módulo 5), as réplicas de leitura (módulo 17) e o particionamento dentro da mesma instância (aula 4). Cinquenta milhões de linhas ainda cabem num PostgreSQL; o que empurra a loja para o sharding é o disco, o backup e o teto de 150 escritas por segundo.',
        look: 'Os degraus acendem de cima para baixo; o último, sharding, é o único que muda de servidor.',
        key: 'Sharding resolve escrita e disco; para leitura lenta, os outros degraus custam menos.',
        f(o, t) { o.on.one = 1; o.show.s3 = 1; o.on.s3 = 2; const n = clamp(Math.floor((t - 0.3) / 0.6) + 1, 0, 5);
          const R = [['índice', 'módulo 4'], ['cache', 'módulo 5'], ['réplicas de leitura', 'módulo 17'], ['particionar', 'aula 4'], ['sharding', 'este módulo']];
          o.rows.s3 = { name: 'a escada', meta: 'do barato ao caro', cells: [], rows: R.map(([a, b], i) => [`${i + 1}. ${a} · ${b}`, i < n ? (i === 4 ? 'acc' : '') : 'dim']) };
          o.rows.side = grp('o que cada degrau resolve', '', ['1–3: leitura lenta', ''], ['4: poda e retenção', ''], ['5: disco, backup e escrita', 'acc']);
          o.rows.rt = grp('serviço pedidos', '1 banco', ['teto: 150 escritas/s', 'dim']);
          o.cnt = C3(['DEGRAU', n ? String(n) + ' de 5' : '…'], ['GATILHO', 'disco e escrita'], ['TETO', '150 pedidos/s']);
          o.res = n >= 5 ? [['sharding: o último degrau', 'acc']] : [];
          if (n >= 5) T(o, SPOT.s(3), 'sharding: outro servidor'); } },
      { id: 'parte', dur: 5, title: 'A tabela vira 3 shards', yk: 'O ROTEADOR',
        code: ['shard = murmur3(cliente_id) mod 3', '', 'shard-0 → pg-pedidos-0', 'shard-1 → pg-pedidos-1', 'shard-2 → pg-pedidos-2', '# 140 GB ÷ 3 = 46,7 GB por shard'],
        story: 'A loja parte a tabela pedidos em 3 servidores, pg-pedidos-0, 1 e 2. Cada pedaço é um shard. Quem decide onde cada linha mora é o roteador: ele calcula murmur3(cliente_id) mod 3. Todas as linhas de um cliente caem no mesmo shard.',
        look: 'O bloco único afunda e sobem 3 servidores; as células se repartem por cliente: Davi no shard-0, Lena e Bia no shard-1, Caio e o mkt-01 no shard-2.',
        key: 'Shard: cada pedaço da tabela num servidor diferente.',
        f(o, t) { const sp = t > 0.8; if (sp) { o.show.one = 0; for (let i = 0; i < 3; i++) { o.show['s' + i] = 1; o.on['s' + i] = 1; } } else o.on.one = 1;
          for (let i = 0; i < 3; i++) o.rows['s' + i].bar = bar(i === 2 ? 0.6 : 0.2, '');
          o.rows.s0.bar = bar(0.2, '~10M linhas'); o.rows.s1.bar = bar(0.2, '~10M linhas'); o.rows.s2.bar = bar(0.6, '~30M linhas (o mkt-01)');
          o.on.rt = sp ? 1 : 0;
          o.rows.side = grp('cada shard', 'o pedaço num servidor', ['shard-0: davi-12', ''], ['shard-1: lena-77, bia-31', ''], ['shard-2: caio-58, mkt-01', '']);
          o.cnt = C3(['SHARDS', sp ? '3' : '1'], ['SERVIDORES', sp ? 'pg-pedidos-0…2' : 'pg-pedidos'], ['FUNÇÃO', 'murmur3 mod 3']);
          o.res = sp ? [['3 servidores, 1 tabela lógica', 'acc']] : [];
          if (sp) { for (let i = 0; i < 3; i++) quiet(o, route(i)); if (t > 1.6) T(o, SPOT.rt, 'mod 3 escolhe o shard'); } } },
      { id: 'lena', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5, title: 'O pedido 1054 da Lena vai para o shard-1', yk: 'O PEDIDO · BLACK FRIDAY 20:08',
        code: ["INSERT INTO pedidos VALUES (1054,", "  'lena-77', 'Recife', 64.00, 'criado', now());", "murmur3('lena-77') = 0x8fd9d9d8", '  = 2.413.418.968', '2.413.418.968 mod 3 = 1', '→ shard-1 (pg-pedidos-1)'],
        story: 'Black Friday, 20:08. A Lena fecha o pedido 1054: 1 camiseta preta (49,00) e o frete de Recife (15,00), total 64,00. O roteador calcula murmur3("lena-77") = 0x8fd9d9d8, que em decimal é 2.413.418.968; o resto da divisão por 3 é 1. O 1054 vai para o shard-1, junto dos outros 5 pedidos dela.',
        look: 'A ficha sai do roteador, corre pela faixa e para ao lado das outras células da Lena no shard-1.',
        key: 'Mesma chave, mesmo shard: a conta dá sempre o mesmo resultado.',
        f(o, t) { for (let i = 0; i < 3; i++) o.on['s' + i] = 2;
          const d1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1054 ? (t > 1.6 ? 'acc' : 'hide') : '' } }); o.rows.s1 = d1;
          o.on.rt = 1; o.rows.rt = m3rt('lena');
          for (let i = 0; i < 3; i++) if (i !== 1) quiet(o, route(i));
          const f = fly(o, t, 0.5, 's1', d1, 5); if (f >= 1 || t > 1.6) { o.on.s1 = 1; lit(o, route(1)); }
          o.rows.side = grp('pedido 1054', 'lena-77 · Recife', ['1 camiseta preta: 49,00', ''], ['frete Recife: 15,00', ''], ['total: 64,00', 'acc']);
          o.cnt = C3(['SHARD', t > 1.6 ? 'shard-1' : '…'], ['MURMUR3', '0x8fd9d9d8'], ['MOD 3', '1']);
          o.res = t > 1.6 ? [['1054 → shard-1 · 64,00', 'acc'], ['lena-77: 6 pedidos no shard-1', '']] : [];
          if (t > 1.8) T(o, SPOT.s(1), '1054 → shard-1'); } },
      { id: 'computacional', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5, title: 'Topologia computacional: o mkt-01 num pool próprio', yk: 'O POOL',
        code: ['# separar a computação, não o dado', 'api.loja.com.br  → pool api-parceiros', 'loja (site, app) → pool loja', '', '# o artigo chama de segregação computacional', '# é isolamento de carga (bulkhead, módulo 25)'],
        story: 'Partir o dado é uma das duas topologias. A outra separa a computação: o mkt-01, o marketplace parceiro do módulo 8, entra por api.loja.com.br e é atendido por um pool de máquinas só dele. Os pedidos dele continuam nos mesmos 3 shards; o que muda é quem processa a requisição.',
        look: 'Na quarta vaga sobe o pool api-parceiros; o fluxo do mkt-01 passa por ele e os dados seguem nos 3 shards.',
        key: 'Dados x computação: partir onde a linha mora não é o mesmo que isolar quem a atende.',
        f(o, t) { for (let i = 0; i < 3; i++) o.on['s' + i] = 2; o.show.s3 = 1; o.on.s3 = 1; o.on.s2 = 1;
          o.rows.s2 = srv(2, ['caio', 'mkt'], { tone: { mkt: 'acc' } }); for (let i = 0; i < 3; i++) o.rows['s' + i].bar = bar([0.2, 0.2, 0.6][i], '');
          o.rows.s3 = { name: 'api-parceiros', meta: 'pool próprio', cells: [], rows: [['só o mkt-01', 'acc'], ['entra por api.loja.com.br', ''], ['módulo 8', 'dim'], ['', ''], ['os dados dele seguem', 'dim'], ['no shard-2', 'dim']] };
          o.rows.rt = grp('roteador', 'murmur3 32 bits', ['mkt-01 → mod 3 = 2', 'acc'], ['→ shard-2', 'acc']);
          o.rows.side = grp('duas topologias', '', ['dados: cada linha num shard', ''], ['computação: cada cliente num pool', 'acc'], ['o artigo chama as duas de sharding', 'dim']);
          for (let i = 0; i < 2; i++) quiet(o, route(i)); lit(o, route(2)); lit(o, route(3));
          stream(o, t, 4, k => k % 2 ? 3 : 2, 2.6);
          o.cnt = C3(['POOL', 'api-parceiros'], ['CLIENTE', 'mkt-01'], ['DADOS', 'shard-2']);
          o.res = [['computação separada', 'acc'], ['dados nos mesmos 3 shards', '']];
          if (t > 1.2) T(o, SPOT.s(3), 'pool só do mkt-01'); } },
      { id: 'cedo', show: ['s0', 's1', 's2', 'rt', 'side'], dur: 5.5, title: 'E se der errado: o shard antes da hora', yk: 'O RELATÓRIO · MÓDULO 11',
        code: ["SELECT sum(total) FROM pedidos", "  WHERE criado_em >= current_date;", '# agora: 3 conexões, 3 consultas', '#   e a soma feita no serviço', '# BEGIN … COMMIT entre shards:', '#   não existe de graça'],
        story: 'O relatório "faturamento do dia" do módulo 11 era uma consulta só. Com 3 shards ele vira 3 conexões, 3 consultas e 3 resultados que o serviço precisa somar. E a transação que gravava o pedido e a baixa no estoque juntos não atravessa servidores. Se a loja partir cedo demais, paga esse preço sem ter o problema de disco.',
        look: 'O roteador manda a mesma consulta aos 3 shards; as 3 vigas acendem em vermelho.',
        key: 'Sharding custa: consultas sem a chave viram N consultas, e a transação única some.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = t > 1.2 ? 'bad' : 2; lit(o, route(i), t > 1.2 ? 'bad' : '', t < 1.2 ? t / 1.2 : null); }
          o.rows.rt = grp('relatório', 'faturamento do dia', ['sem cliente_id na consulta', 'bad'], ['→ shard-0, shard-1, shard-2', 'bad'], ['soma no serviço', 'dim']);
          for (let i = 0; i < 3; i++) o.rows['s' + i].rows = [[`parcial do shard-${i}`, 'dim']];
          o.rows.side = grp('o custo', '', ['3 conexões, 3 consultas', 'bad'], ['3 resultados para somar', 'bad'], ['sem transação entre shards', 'bad']);
          o.cnt = C3(['CONSULTAS', t > 1.2 ? '3' : '1', 'bad'], ['CONEXÕES', '3'], ['TRANSAÇÃO', 'não atravessa', 'bad']);
          o.res = t > 1.2 ? [['1 relatório = 3 consultas', 'bad'], ['sem BEGIN…COMMIT entre shards', 'bad']] : [];
          if (t > 1.5) T(o, SPOT.rt, 'a mesma consulta 3 vezes', 'bad'); } },
    ],
    consulta: [
      { id: 'capac', dur: 4.5, title: 'O que se ganha: 450/s, 46,7 GB e backup de 15 min', yk: 'A CONTA',
        code: ['capacidade: 3 × 150 = 450 pedidos/s', 'disco: 140 GB ÷ 3 = 46,7 GB por shard', 'backup: 46.700 MB ÷ 50 MB/s', '  = 933 s = 15 min 33 s (em paralelo)', '# antes: 47 min', '# nominal: supõe carga igual nos 3'],
        story: 'Cada shard tem o próprio disco e o próprio teto de 150 escritas por segundo. Somados, são 450 pedidos/s nominais. Cada servidor guarda 46,7 GB em vez de 140, e os 3 backups rodam em paralelo: 15 min 33 s em vez de 47 min.',
        look: 'Os 3 shards acendem juntos; o fluxo de pedidos se divide entre eles.',
        key: 'Sharding compra capacidade de escrita, espaço e um backup mais curto.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = 1; o.rows['s' + i].bar = bar(0.33, '46,7 GB · 150/s'); lit(o, route(i)); }
          stream(o, t, 6, k => k % 3, 2.4);
          o.rows.rt = grp('roteador', 'murmur3 mod 3', ['cada pedido vai a 1 shard', ''], ['3 tetos de 150/s', 'acc']);
          o.rows.side = grp('antes → depois', '', ['teto: 150 → 450 pedidos/s', 'acc'], ['disco: 140 → 46,7 GB', ''], ['backup: 47 min → 15 min 33 s', '']);
          o.cnt = C3(['CAPACIDADE', '450/s'], ['POR SHARD', '46,7 GB'], ['BACKUP', '15 min 33 s']);
          o.res = [['3 × 150 = 450 pedidos/s', 'acc'], ['nominal: carga igual nos 3', '']];
          if (t > 1) T(o, SPOT.rt, '3 × 150/s'); } },
      { id: 'comchave', dur: 4.5, title: 'Com a chave: 1 shard responde', yk: 'A CONSULTA',
        code: ["SELECT * FROM pedidos", "  WHERE cliente_id = 'lena-77';", "murmur3('lena-77') mod 3 = 1", '→ só o shard-1', '# índice menor, menos disco por consulta', '6 linhas'],
        story: '"Meus pedidos" da Lena traz o cliente_id na consulta. O roteador faz a mesma conta da escrita, chega no shard-1 e pergunta só a ele. O índice do shard-1 é um terço do original, e os outros dois servidores nem ficam sabendo.',
        look: 'Só a viga do shard-1 acende; as 6 células da Lena se iluminam.',
        key: 'Consulta com a chave: 1 shard, o mesmo custo de antes ou menor.',
        f(o, t) { o.on.s0 = 2; o.on.s2 = 2; o.on.rt = 1; o.rows.rt = m3rt('lena');
          quiet(o, route(0), route(2)); lit(o, route(1), '', t < 1.2 ? t / 1.2 : null);
          if (t > 1.2) { o.on.s1 = 1; o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: 'acc' } }); }
          o.rows.side = grp('quem trabalha', '', ['shard-1: 6 linhas', 'acc'], ['shard-0 e shard-2: nada', 'dim']);
          o.cnt = C3(['SHARDS LIDOS', t > 1.2 ? '1 de 3' : '…'], ['CHAVE', 'lena-77'], ['LINHAS', t > 1.2 ? '6' : '…']);
          o.res = t > 1.2 ? [['6 linhas · 1 shard', 'acc']] : [];
          if (t > 1.4) T(o, SPOT.s(1), 'só o shard-1'); } },
      { id: 'semchave', dur: 5, title: 'Sem a chave: os 3 shards respondem', yk: 'A CONSULTA',
        code: ['SELECT * FROM pedidos WHERE id = 1042;', '# o id não diz o shard', '→ shard-0: 0 linhas', '→ shard-1: 1 linha (1042)', '→ shard-2: 0 linhas', '# scatter-gather: espera os 3'],
        story: 'Agora a consulta chega só com o id 1042. O id não diz de que cliente é o pedido, então o roteador não sabe o shard: manda a pergunta aos 3 e junta as respostas (scatter-gather). Dois servidores trabalham para responder "nada", e a resposta só sai quando o último terminar.',
        look: 'As 3 vigas acendem ao mesmo tempo; só o shard-1 acha a célula 1042.',
        key: 'Consulta sem a chave: N shards, e a resposta é a do mais lento.',
        f(o, t) { o.on.rt = 1; o.rows.rt = grp('roteador', 'sem a chave', ['id = 1042', 'acc'], ['murmur3(?) — falta cliente_id', 'bad'], ['→ pergunta aos 3', 'acc']);
          for (let i = 0; i < 3; i++) { lit(o, route(i), '', t < 1.2 ? t / 1.2 : null); o.on['s' + i] = t > 1.2 ? 1 : 2; }
          if (t > 1.2) { o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1042 ? 'acc' : '' } }); o.rows.s0.rows = [['0 linhas', 'dim']]; o.rows.s2.rows = [['0 linhas', 'dim']]; }
          o.rows.side = grp('scatter-gather', '', ['3 consultas para achar 1 linha', 'acc'], ['2 respondem "nada"', 'dim'], ['espera o mais lento', '']);
          o.cnt = C3(['SHARDS LIDOS', t > 1.2 ? '3 de 3' : '…'], ['ID', '1042'], ['LINHAS', t > 1.2 ? '1' : '…']);
          o.res = t > 1.2 ? [['1 linha · 3 shards consultados', 'acc']] : [];
          if (t > 1.4) T(o, SPOT.s(1), '1042 está aqui'); } },
      { id: 'cauda', dur: 5, title: 'A cauda: o p99 de cada shard vira o p97 da consulta', yk: 'THE TAIL AT SCALE',
        code: ['P(algum acima do p99) = 1 − 0,99^N', 'N = 1:   1,00%', 'N = 3:   2,97%', 'N = 10:  9,56%', 'N = 50:  39,5%', 'N = 100: 63,4%'],
        story: 'Cada shard demora mais que o seu p99 em 1 de cada 100 consultas. Uma consulta que espera os 3 fica lenta se qualquer um deles estiver na pior fatia: 1 − 0,99³ = 2,97%. É a conta do texto "The Tail at Scale", de Dean e Barroso: o p99 de cada shard vira o p97 da consulta.',
        look: 'As 3 respostas voltam; a do shard-2 atrasa e fica vermelha, e a consulta inteira espera por ela.',
        key: 'Quanto mais shards uma consulta espera, mais vezes ela pega um lento.',
        f(o, t) { o.on.rt = 1; o.rows.rt = grp('scatter-gather', 'espera os 3', ['shard-0: no tempo', ''], ['shard-1: no tempo', ''], ['shard-2: acima do p99', t > 1.6 ? 'bad' : 'dim']);
          for (let i = 0; i < 3; i++) { const slow = i === 2, f = clamp(t / (slow ? 2.4 : 1.1)); lit(o, route(i), slow && t > 1.2 ? 'bad' : '', f < 1 ? f : null); o.on['s' + i] = slow && t > 1.2 ? 'bad' : f >= 1 ? 1 : 2; }
          o.rows.s2.rows = [['acima do p99', 'bad'], ['(1 em 100)', 'dim']];
          o.rows.side = grp('chance de esperar um lento', '', ['3 shards: 2,97%', 'acc'], ['10 shards: 9,56%', ''], ['100 shards: 63,4%', '']);
          o.cnt = C3(['CHANCE', '2,97%'], ['SHARDS', '3'], ['CADA SHARD', 'p99 = 1%']);
          o.res = t > 1.6 ? [['a consulta espera o shard-2', 'bad'], ['1 − 0,99³ = 2,97%', '']] : [];
          if (t > 1.8) T(o, SPOT.s(2), 'lento: acima do p99', 'bad'); } },
      { id: 'incidente', dur: 5, title: 'Um shard cai: Lena e Bia sem pedidos', yk: 'A DISPONIBILIDADE',
        code: ['cada shard: 99,9%', 'P(algum fora) = 1 − 0,999^N', 'N = 1: 0,10%', 'N = 3: 0,30%', 'N = 50: 4,88%', '# para cada cliente: continua 0,1%'],
        story: 'Cada shard fica fora 0,1% do tempo. Para a Lena nada muda: o "meus pedidos" dela depende só do shard-1. Para a equipe muda: com 3 shards, a chance de algum estar fora é 0,30%, o triplo. E quando o shard-1 cai, Lena e Bia ficam sem pedidos, porque o sharding não copia nada (módulo 17).',
        look: 'O shard-1 fica vermelho com as células da Lena e da Bia; o shard-0 e o shard-2 seguem acesos.',
        key: 'Sharding isola a falha por chave, mas multiplica os incidentes.',
        f(o, t) { const down = t > 1; o.on.s0 = 1; o.on.s2 = 1; o.on.s1 = down ? 'bad' : 1;
          if (down) o.rows.s1 = srv(1, ['lena', 'bia'], { tone: { lena: 'bad', bia: 'bad' }, rows: [['fora do ar', 'bad'], ['lena-77 e bia-31 sem pedidos', 'bad']] });
          lit(o, route(0)); lit(o, route(2)); lit(o, route(1), down ? 'bad' : '');
          o.rows.rt = grp('roteador', '', ['davi-12 → shard-0: ok', ''], ['caio-58 → shard-2: ok', ''], ['lena-77 → shard-1: fora', down ? 'bad' : 'dim']);
          o.rows.side = grp('chance de algum shard fora', '99,9% cada', ['1 servidor: 0,10%', ''], ['3 shards: 0,30%', 'acc'], ['50 shards: 4,88%', '']);
          o.cnt = C3(['ALGUM FORA', '0,30%'], ['POR CLIENTE', '0,10%'], ['FORA AGORA', down ? 'shard-1' : 'nenhum', down ? 'bad' : '']);
          o.res = down ? [['shard-1 fora: 9 pedidos da amostra', 'bad'], ['shard-0 e shard-2 seguem', '']] : [];
          if (down) T(o, SPOT.s(1), 'Lena e Bia sem pedidos', 'bad'); } },
      { id: 'cinquenta', dur: 5, title: 'E se der errado: o relatório com 50 shards', yk: 'A CONTA',
        code: ['relatório sem chave → 50 shards', '1 − 0,99^50 = 0,395', '# 39,5% das vezes, algum shard', '#   está acima do seu p99', '# saídas: consultar só os shards', '#   necessários, ou uma réplica de relatório'],
        story: 'A loja cresce e chega a 50 shards. O relatório sem a chave agora espera 50 respostas, e em 39,5% das vezes pelo menos uma está na pior fatia do seu shard. O que era cauda vira o normal. Consulta que precisa de todos os shards tem de ser rara, ou sair de outro lugar.',
        look: 'As vigas aos 3 shards valem por 50; duas ficam vermelhas e o contador marca 39,5%.',
        key: 'Scatter-gather em muitos shards: a cauda vira a regra.',
        f(o, t) { o.on.rt = 'bad'; o.rows.rt = grp('relatório', '50 shards', ['sem cliente_id', 'bad'], ['espera 50 respostas', 'bad'], ['39,5%: algum acima do p99', 'bad']);
          for (let i = 0; i < 3; i++) { lit(o, route(i), i ? 'bad' : '', clamp(t / 1.2) < 1 ? clamp(t / 1.2) : null); o.on['s' + i] = i ? 'bad' : 1; o.rows['s' + i].meta = `1 de 50`; }
          o.rows.side = grp('esperar N shards', '', ['3: 2,97%', ''], ['10: 9,56%', ''], ['50: 39,5%', 'bad']);
          o.cnt = C3(['CHANCE', '39,5%', 'bad'], ['SHARDS', '50'], ['COM 3', '2,97%']);
          o.res = [['39,5% das vezes espera um lento', 'bad'], ['consulta de todos: tem de ser rara', '']];
          if (t > 1.2) T(o, SPOT.rt, '× 50 shards', 'bad'); } },
    ],
    chave: [
      { id: 'cliente', dur: 4.5, title: 'Chave cliente_id: o que fica junto', yk: 'A CHAVE',
        code: ['shard = murmur3(cliente_id) mod 3', '# alta cardinalidade: 1,5 milhão de clientes', '# está em "meus pedidos"', '# sem o parceiro: ~33% por shard', 'eficiência = 1 ÷ (N × mais quente)', '  = 1 ÷ (3 × 0,33) ≈ 100%'],
        story: 'A chave decide o que fica junto. Com cliente_id, todos os pedidos da Lena moram no mesmo shard, e o "meus pedidos" lê um servidor só. São 1,5 milhão de clientes, então as linhas se espalham por igual. Sem o parceiro, cada shard fica com um terço.',
        look: 'As 3 barras ficam iguais, em 33%; cada cliente tem as células num shard só.',
        key: 'Boa chave: muitos valores, aparece nas consultas e não concentra tráfego.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.on['s' + i] = 1; o.rows['s' + i] = srv(i, M3[i].filter(k => k !== 'mkt'), { bar: bar(0.33, '~10M linhas · 33%') }); lit(o, route(i)); }
          stream(o, t, 6, k => k % 3, 2.4);
          o.rows.rt = grp('roteador', 'chave: cliente_id', ['1,5 milhão de valores', ''], ['murmur3(cliente_id) mod 3', 'acc']);
          o.rows.side = grp('sem o parceiro', '', ['cada shard: ~33%', ''], ['eficiência: ~100%', 'acc']);
          o.cnt = C3(['EFICIÊNCIA', '~100%'], ['MAIS QUENTE', '~33%'], ['CHAVE', 'cliente_id']);
          o.res = [['carga igual nos 3', 'acc']]; } },
      { id: 'mkt', dur: 5, title: 'Liga o mkt-01: o shard-2 fica com 60%', yk: 'A CONTA',
        code: ["murmur3('mkt-01') mod 3 = 2", 'shard-2 = 20M (mkt-01) + 10M = 30M', '  = 60% das linhas', 'shard-0 = shard-1 = ~10M = 20%', 'eficiência = 1 ÷ (3 × 0,60)', '  = 55,6%'],
        story: 'O mkt-01, o marketplace parceiro do módulo 8, tem 20 milhões de pedidos, 40% da tabela. Como toda chave, ele cai inteiro num shard: murmur3("mkt-01") mod 3 = 2. O shard-2 fica com 30 milhões de linhas, 60%, e os outros dois com 20% cada. O hash espalha chaves diferentes; ele não divide uma chave quente.',
        look: 'A célula larga do mkt-01 entra no shard-2 e a barra dele sobe a 60%, em vermelho.',
        key: 'Partição quente: uma chave pesada cai inteira num shard.',
        f(o, t) { const on = t > 1; o.on.rt = 1; o.rows.rt = m3rt('mkt', on ? 'bad' : 'acc');
          o.rows.s0 = srv(0, ['davi'], { bar: bar(on ? 0.2 : 0.33, on ? '~10M · 20%' : '~10M · 33%') });
          o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(on ? 0.2 : 0.33, on ? '~10M · 20%' : '~10M · 33%') });
          const d2 = srv(2, ['caio', 'mkt'], { tone: { mkt: on ? 'bad' : 'hide' }, bar: bar(on ? 0.6 : 0.33, on ? '30M linhas · 60%' : '~10M · 33%', on ? 'bad' : '') }); o.rows.s2 = d2;
          o.on.s0 = 2; o.on.s1 = 2; o.on.s2 = on ? 'bad' : 2; quiet(o, route(0), route(1));
          if (!on) fly(o, t, 0.2, 's2', d2, 2, 'acc', 0.8); else lit(o, route(2), 'bad');
          o.rows.side = grp('o hash espalha chaves', 'não carga', ['shard-2: 30M linhas · 60%', on ? 'bad' : 'dim'], ['shard-0 e shard-1: 20% cada', ''], ['eficiência: 55,6%', on ? 'bad' : 'dim']);
          o.cnt = C3(['EFICIÊNCIA', on ? '55,6%' : '~100%', on ? 'bad' : ''], ['SHARD-2', on ? '60%' : '33%', on ? 'bad' : ''], ['MKT-01', '20M linhas']);
          o.res = on ? [['shard-2 com 60% das linhas', 'bad'], ['1 ÷ (3 × 0,60) = 55,6%', '']] : [];
          if (on) T(o, SPOT.s(2), 'mkt-01 inteiro aqui', 'bad'); } },
      { id: 'teto', dur: 5.5, title: 'O shard-2 satura em 250 pedidos/s, não em 450', yk: 'A CONTA',
        code: ['# o tráfego acompanha as linhas', 'shard-2 recebe 0,60 × T', '0,60 × T = 150 → T = 250 pedidos/s', 'shard-0 e shard-1: 0,20 × 250 = 50/s', '# a loja paga 3 servidores', '#   e aproveita 1,67'],
        story: 'Se o tráfego acompanha as linhas, o shard-2 recebe 60% dos pedidos. Ele chega ao teto de 150/s quando a loja inteira faz 250 pedidos/s; nesse momento o shard-0 e o shard-1 estão em 50/s, um terço do que aguentam. A loja paga 3 servidores e usa 1,67.',
        look: 'De cada 5 fichas, 3 vão ao shard-2; ele fica vermelho em 150/s enquanto os outros marcam 50/s.',
        key: 'Eficiência do cluster = 1 ÷ (nº de shards × fração do mais quente).',
        f(o, t) { o.rows.s0 = srv(0, ['davi'], { bar: bar(0.33, '50/s de 150') }); o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(0.33, '50/s de 150') });
          o.rows.s2 = srv(2, ['caio', 'mkt'], { tone: { mkt: 'bad' }, bar: bar(1, '150/s de 150: no teto', 'bad') });
          o.on.s0 = 1; o.on.s1 = 1; o.on.s2 = 'bad'; lit(o, route(0)); lit(o, route(1)); lit(o, route(2), 'bad');
          stream(o, t, 10, k => [2, 0, 2, 1, 2][k % 5], 2.2, k => [2, 0, 2, 1, 2][k % 5] === 2 ? 'bad' : '');
          o.rows.rt = grp('roteador', 'T = 250 pedidos/s', ['60% → shard-2: 150/s', 'bad'], ['20% → shard-0: 50/s', ''], ['20% → shard-1: 50/s', '']);
          o.rows.side = grp('capacidade', '3 × 150 = 450/s nominal', ['útil: 250 pedidos/s', 'bad'], ['usa 1,67 de 3 servidores', ''], ['eficiência: 55,6%', 'bad']);
          o.cnt = C3(['CAPACIDADE ÚTIL', '250/s', 'bad'], ['NOMINAL', '450/s'], ['EFICIÊNCIA', '55,6%', 'bad']);
          o.res = [['0,60 × T = 150 → T = 250', 'bad'], ['shard-0 e shard-1 em 50/s', '']];
          if (t > 1) T(o, SPOT.s(2), '150/s: saturado', 'bad'); } },
      { id: 'cidade', dur: 5, title: 'Chave cidade: 3 valores, no máximo 3 shards', yk: 'A CHAVE',
        code: ['shard = cidade', 'SP     → 27,5M linhas (55%)', 'Rio    → 12,5M (25%)', 'Recife → 10M (20%)', 'eficiência = 1 ÷ (3 × 0,55)', '  = 60,6%'],
        story: 'E se a chave fosse a cidade? Há só 3 valores, SP, Rio e Recife, então nunca passa de 3 shards. E SP tem 55% dos pedidos: o shard de SP satura primeiro, e a eficiência fica em 60,6%. Bia e Davi moram juntos no shard de SP; a Lena, no de Recife.',
        look: 'Os shards ganham o nome da cidade; a barra de SP vai a 55%.',
        key: 'Baixa cardinalidade: poucos valores limitam o número de shards.',
        f(o, t) { const CT = [['SP', ['bia', 'davi'], 0.55, '27,5M · 55%'], ['Rio', ['caio'], 0.25, '12,5M · 25%'], ['Recife', ['lena'], 0.2, '10M · 20%']];
          CT.forEach(([c, ks, f, l], i) => { o.rows['s' + i] = srv(i, ks, { meta: `cidade = ${c}`, bar: bar(f, l, i === 0 ? 'bad' : '') }); o.on['s' + i] = i === 0 ? 'bad' : 1; lit(o, route(i), i === 0 ? 'bad' : ''); });
          stream(o, t, 9, k => [0, 1, 0, 2, 0, 1, 0, 2, 0][k], 2.6, k => [0, 1, 0, 2, 0, 1, 0, 2, 0][k] === 0 ? 'bad' : '');
          o.rows.rt = grp('roteador', 'chave: cidade', ['SP → shard-0', ''], ['Rio → shard-1', ''], ['Recife → shard-2', '']);
          o.rows.side = grp('comparação de chaves', 'eficiência', ['cliente_id + mkt-01: 55,6%', ''], ['cidade: 60,6% (teto: 3 shards)', 'bad'], ['cliente_id sem parceiro: ~100%', '']);
          o.cnt = C3(['EFICIÊNCIA', '60,6%', 'bad'], ['VALORES', '3'], ['SP', '55%', 'bad']);
          o.res = [['SP com 55% → 60,6%', 'bad'], ['no máximo 3 shards', '']];
          if (t > 1) T(o, SPOT.s(0), 'SP: 55%', 'bad'); } },
      { id: 'data', dur: 5, title: 'Chave criado_em: toda escrita na faixa mais nova', yk: 'A CHAVE',
        code: ['shard = faixa de criado_em', 'shard-0: 2024 (8M)', 'shard-1: 2025 (17M)', 'shard-2: 2026 (25M) ← o ano corrente', 'escritas: 0% / 0% / 100%', 'eficiência de escrita = 1 ÷ (3 × 1) = 33,3%'],
        story: 'Com a data como chave, cada shard guarda um ano. Ler um mês fica fácil, mas todo pedido novo é de 2026, então 100% das escritas vão para o mesmo shard. Os outros dois só guardam o passado. A eficiência de escrita cai a 33,3%, e o mesmo acontece com um id sequencial.',
        look: 'Todas as fichas vão ao shard-2 (2026); os shards de 2024 e 2025 ficam parados.',
        key: 'Faixa por data ou id sequencial: a escrita mora sempre no fim.',
        f(o, t) { const Y = [['2024', 0.16, '8M · 0% das escritas'], ['2025', 0.34, '17M · 0% das escritas'], ['2026', 0.5, '25M · 100% das escritas']];
          Y.forEach(([y, f, l], i) => { o.rows['s' + i] = { name: `shard-${i}`, meta: `criado_em ${y}`, bar: bar(f, l, i === 2 ? 'bad' : ''), cells: [], rows: [[i === 2 ? 'recebe toda escrita' : 'só leitura do passado', i === 2 ? 'bad' : 'dim']] }; o.on['s' + i] = i === 2 ? 'bad' : 2; });
          quiet(o, route(0), route(1)); lit(o, route(2), 'bad'); stream(o, t, 6, () => 2, 2.2, () => 'bad');
          o.rows.rt = grp('roteador', 'chave: criado_em', ['1054: 2026-11-27 20:08', 'acc'], ['→ shard-2 (2026)', 'bad'], ['todo pedido novo: 2026', 'bad']);
          o.rows.side = grp('a escrita', '', ['2024 e 2025: 0%', 'dim'], ['2026: 100%', 'bad'], ['eficiência de escrita: 33,3%', 'bad']);
          o.cnt = C3(['EFICIÊNCIA', '33,3%', 'bad'], ['ESCRITAS NO 2026', '100%', 'bad'], ['CHAVE', 'criado_em']);
          o.res = [['100% das escritas no shard-2', 'bad'], ['1 ÷ (3 × 1) = 33,3%', '']];
          if (t > 1) T(o, SPOT.s(2), 'toda escrita aqui', 'bad'); } },
      { id: 'mitiga', dur: 5.5, title: 'Mitigação: um shard dedicado de 2× ao mkt-01', yk: 'A CONTA',
        code: ['shard-3 dedicado: máquina 2× = 300/s', 'mkt-01: 0,40 × T = 300 → T = 750', 'resto: 0,20 × 750 = 150 em cada', '→ os 4 saturam juntos em 750/s', '# sal: mkt-01#0 … mkt-01#7 (8 sub-chaves)', '#   espalha, mas "pedidos do mkt-01" = 3 shards'],
        story: 'A primeira saída é tirar o parceiro da conta: o mkt-01 ganha o shard-3, numa máquina com o dobro da capacidade (300/s), e o resto se divide nos 3 de antes. Com T = 750 pedidos/s, o shard-3 recebe 300 e cada um dos outros 150: os 4 chegam ao teto juntos. A outra saída é o sal: dividir a chave em mkt-01#0 a mkt-01#7, que espalha o parceiro mas faz toda consulta dele ir aos 3 shards.',
        look: 'Sobe o shard-3 dedicado e a célula do mkt-01 passa para ele; as 4 barras ficam cheias por igual.',
        key: 'Isolar a chave quente: shard dedicado, sal, pré-particionar ou cache.',
        f(o, t) { o.show.s3 = 1; const mv = t > 1.2;
          o.rows.s0 = srv(0, ['davi'], { bar: bar(1, '150/s de 150') }); o.rows.s1 = srv(1, ['lena', 'bia'], { bar: bar(1, '150/s de 150') });
          o.rows.s2 = srv(2, mv ? ['caio'] : ['caio', 'mkt'], { bar: bar(mv ? 1 : 0.6, mv ? '150/s de 150' : '60% das linhas', mv ? '' : 'bad'), tone: { mkt: 'bad' } });
          const d3 = { name: 'shard-3', meta: 'dedicado · 2×', bar: bar(mv ? 1 : 0, mv ? '300/s de 300' : 'vazio'), cells: [mktCell(mv ? 'acc' : 'hide')], rows: [['só o mkt-01', 'acc'], ['máquina com o dobro', 'dim']] }; o.rows.s3 = d3;
          for (let i = 0; i < 4; i++) { o.on['s' + i] = mv ? 1 : i === 2 ? 'bad' : 2; lit(o, route(i)); }
          if (!mv) hop(o, t, 0.3, cellAt('s2', srv(2, ['caio', 'mkt']), 2), cellAt('s3', d3, 0), 'acc', 0.9);
          o.rows.rt = grp('roteador', 'mkt-01 tem regra própria', ['mkt-01 → shard-3', 'acc'], ['outros → murmur3 mod 3', ''], ['T = 750 pedidos/s', 'acc']);
          o.rows.side = grp('as 4 mitigações', '', ['1. shard dedicado 2× → 750/s', 'acc'], ['2. sal: mkt-01#0…#7 (~100%)', ''], ['3. pré-particionar · 4. cache', '']);
          o.cnt = C3(['CAPACIDADE', mv ? '750/s' : '250/s', mv ? '' : 'bad'], ['SHARD-3', '300/s'], ['ANTES', '250/s']);
          o.res = mv ? [['os 4 saturam juntos em 750/s', 'acc'], ['0,4 × 750 = 300 · 0,2 × 750 = 150', '']] : [];
          if (mv) T(o, SPOT.s(3), 'mkt-01 isolado'); } },
      { id: 'cardinal', dur: 5.5, title: 'E se der errado: cidade não passa de 3 shards', yk: 'A CHAVE',
        code: ['shard = cidade', '# 4º shard: não há 4ª cidade', 'shard-3 → 0 linhas', 'SP continua com 55%', '# trocar a chave depois:', '#   migrar os 50 milhões de linhas'],
        story: 'A loja escolheu cidade e, quando SP esquentou, comprou um quarto servidor. Ele ficou vazio: não existe uma quarta cidade para mandar a ele, e SP continua com 55% num shard só. Trocar a chave agora significa regravar os 50 milhões de linhas.',
        look: 'O shard-3 sobe e fica vazio, em vermelho; SP segue com a barra em 55%.',
        key: 'A chave se escolhe uma vez: trocar depois é migrar a tabela inteira.',
        f(o, t) { o.show.s3 = 1; const CT = [['SP', ['bia', 'davi'], 0.55, '27,5M · 55%'], ['Rio', ['caio'], 0.25, '12,5M · 25%'], ['Recife', ['lena'], 0.2, '10M · 20%']];
          CT.forEach(([c, ks, f, l], i) => { o.rows['s' + i] = srv(i, ks, { meta: `cidade = ${c}`, bar: bar(f, l, i === 0 ? 'bad' : '') }); o.on['s' + i] = i === 0 ? 'bad' : 2; lit(o, route(i), i === 0 ? 'bad' : ''); });
          o.rows.s3 = { name: 'shard-3', meta: 'sem cidade', bar: bar(0, '0 linhas', 'bad'), cells: [], rows: [['nenhuma cidade', 'bad'], ['fica vazio', 'bad']] }; o.on.s3 = t > 1 ? 'bad' : 2; quiet(o, route(3));
          o.rows.rt = grp('roteador', 'chave: cidade', ['SP, Rio, Recife: 3 valores', 'bad'], ['4 shards → 1 sem uso', 'bad']);
          o.rows.side = grp('trocar a chave', '', ['regravar 50M linhas', 'bad'], ['100 GB de dados', ''], ['chave nova: cliente_id', 'acc']);
          o.cnt = C3(['SHARD-3', '0 linhas', 'bad'], ['SP', '55%', 'bad'], ['PARA TROCAR', '50M linhas']);
          o.res = t > 1 ? [['shard-3 vazio: não há 4ª cidade', 'bad'], ['trocar a chave = migrar tudo', 'bad']] : [];
          if (t > 1) T(o, SPOT.s(3), 'vazio: só 3 cidades', 'bad'); } },
    ],
    particoes: [
      { id: 'tabela', dur: 5, title: 'PARTITION BY RANGE (criado_em): 3 partições', yk: 'O SQL',
        code: ['CREATE TABLE pedidos ( … ,', '  PRIMARY KEY (id, criado_em)', ') PARTITION BY RANGE (criado_em);', 'CREATE TABLE pedidos_2024 PARTITION OF pedidos', "  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');", '-- e pedidos_2025, pedidos_2026'],
        story: 'Antes de separar servidores, dá para partir a tabela dentro do mesmo PostgreSQL. A pedidos vira uma tabela-mãe com 3 partições por ano: 2024 com 8 milhões de linhas, 2025 com 17 e 2026 com 25. Continua sendo um servidor, um disco e o mesmo teto de 150/s; o que muda é que cada ano é uma tabela física separada.',
        look: 'Sobre a base pg-pedidos sobem 3 gavetas, pedidos_2024, 2025 e 2026, com barras proporcionais às linhas.',
        key: 'Particionar: dividir uma tabela dentro de uma instância.',
        f(o, t) { for (let i = 0; i < 3; i++) { o.show['p' + i] = t > 0.4 + i * 0.4 ? 1 : 0; o.on['p' + i] = 1; } o.on.host = 2;
          o.rows.rt = grp('pedidos', 'tabela-mãe', ['PARTITION BY RANGE (criado_em)', 'acc'], ['PK (id, criado_em)', ''], ['3 partições por ano', '']);
          o.rows.side = grp('o que se ganha', '1 servidor ainda', ['poda: ler só o ano certo', 'acc'], ['retenção: apagar um ano inteiro', ''], ['capacidade: a mesma (150/s)', 'dim']);
          o.cnt = C3(['PARTIÇÕES', '3'], ['INSTÂNCIAS', '1'], ['LINHAS', '8M · 17M · 25M']);
          o.res = [['3 tabelas físicas, 1 lógica', 'acc'], ['mesmo servidor e mesmo teto', '']];
          if (t > 1.6) T(o, SPOT.s(1), 'cada ano, uma partição'); } },
      { id: 'pk', dur: 5.5, title: 'O lab do autor: a PK sem a chave de partição', yk: 'NO PSQL · table.sql',
        code: ['CREATE TABLE analytics.sales (id BIGSERIAL PRIMARY KEY,', '  … sale_date DATE …) PARTITION BY RANGE (sale_date);', 'ERROR: unique constraint on partitioned table', '  must include all partitioning columns', 'DETAIL: PRIMARY KEY constraint on table "sales"', '  lacks column "sale_date" …'],
        story: 'O table.sql do repositório do autor cria analytics.sales com PRIMARY KEY (id) e PARTITION BY RANGE (sale_date). O PostgreSQL recusa: numa tabela particionada, a chave primária precisa incluir a coluna de partição. Com PRIMARY KEY (id, sale_date) a tabela nasce, mas sem nenhuma partição, e o primeiro INSERT falha.',
        look: 'A base fica vermelha e nenhuma gaveta sobe: a tabela-mãe não foi criada.',
        key: 'Numa tabela particionada, a PK leva a chave de partição.',
        f(o, t) { for (let i = 0; i < 3; i++) o.show['p' + i] = 0; o.on.host = t > 1 ? 'bad' : 2;
          o.rows.host = { name: 'analytics.sales', meta: t > 1 ? 'não criada' : '…', rows: [] };
          o.rows.rt = grp('analytics.sales', 'table.sql', ['PRIMARY KEY (id)', t > 1 ? 'bad' : ''], ['PARTITION BY RANGE (sale_date)', ''], ['falta sale_date na PK', t > 1 ? 'bad' : 'dim']);
          o.rows.side = grp('o conserto', 'na loja: (id, criado_em)', ['PRIMARY KEY (id, sale_date)', 'acc'], ['cria, mas sem partições', 'bad'], ['1º INSERT: no partition … found', 'bad']);
          o.cnt = C3(['ERRO', 'PK sem sale_date', 'bad'], ['PARTIÇÕES', '0'], ['CONSERTO', 'PK (id, sale_date)']);
          o.res = t > 1 ? [['unique constraint … must include', 'bad'], ['all partitioning columns', 'bad']] : [];
          if (t > 1.2) T(o, SPOT.s(1), 'PK precisa de sale_date', 'bad'); } },
      { id: 'poda', dur: 5, title: 'Com criado_em na consulta: só pedidos_2026', yk: 'EXPLAIN',
        code: ['EXPLAIN SELECT * FROM pedidos', "  WHERE criado_em >= '2026-11-01'", "    AND criado_em <  '2026-12-01';", ' Seq Scan on pedidos_2026', "   Filter: criado_em >= … AND …", '-- pedidos_2024 e pedidos_2025: podadas'],
        story: 'O relatório de novembro de 2026 traz o criado_em no WHERE. O planejador olha as faixas, vê que só pedidos_2026 pode ter essas linhas e nem abre as outras duas. Isso é a poda (partition pruning): o plano mostra uma partição só.',
        look: 'A viga vai só à gaveta de 2026; 2024 e 2025 ficam apagadas, marcadas como podadas.',
        key: 'Poda: com a chave de partição, o banco lê só a partição certa.',
        f(o, t) { o.on.host = 2; o.on.p0 = 2; o.on.p1 = 2; o.on.p2 = t > 1 ? 1 : 2; quiet(o, route(0), route(1)); lit(o, route(2), '', t < 1 ? t : null);
          o.rows.p0.rows = [['podada', 'dim']]; o.rows.p1.rows = [['podada', 'dim']]; if (t > 1) o.rows.p2.rows = [['Seq Scan', 'acc'], ['novembro de 2026', '']];
          o.rows.rt = grp('consulta', 'relatório de novembro', ["criado_em >= '2026-11-01'", 'acc'], ["criado_em < '2026-12-01'", 'acc']);
          o.rows.side = grp('o plano', 'EXPLAIN', ['Seq Scan on pedidos_2026', 'acc'], ['2 partições podadas', '']);
          o.cnt = C3(['PARTIÇÕES LIDAS', t > 1 ? '1 de 3' : '…'], ['PODADAS', '2'], ['FILTRO', 'criado_em']);
          o.res = t > 1 ? [['Seq Scan on pedidos_2026', 'acc'], ['2024 e 2025 podadas', '']] : [];
          if (t > 1.2) T(o, SPOT.s(2), 'só 2026'); } },
      { id: 'sempoda', dur: 5.5, title: 'Só com o id: Append nas 3 partições', yk: 'EXPLAIN',
        code: ['EXPLAIN SELECT * FROM pedidos WHERE id = 1042;', ' Append', '   -> Index Scan using pedidos_2024_pkey …', '   -> Index Scan using pedidos_2025_pkey …', '   -> Index Scan using pedidos_2026_pkey …', '-- com id E criado_em: 1 partição só'],
        story: 'Agora a consulta só traz o id 1042. O id não diz o ano, então o planejador não pode podar nada: monta um Append com um Index Scan em cada partição. É o scatter-gather da aula 2, só que dentro de um servidor. Com id e criado_em juntos, volta a ser uma partição só.',
        look: 'As 3 vigas acendem; cada gaveta faz o seu Index Scan.',
        key: 'Sem a chave de partição na consulta, o banco lê todas as partições.',
        f(o, t) { o.on.host = 2; for (let i = 0; i < 3; i++) { o.on['p' + i] = t > 1 ? 1 : 2; lit(o, route(i), '', t < 1 ? t : null); if (t > 1) o.rows['p' + i].rows = [['Index Scan', 'acc'], [`pedidos_${2024 + i}_pkey`, '']]; }
          o.rows.rt = grp('consulta', 'só o id', ['WHERE id = 1042', 'acc'], ['sem criado_em: sem poda', 'bad']);
          o.rows.side = grp('o plano', 'EXPLAIN', ['Append', ''], ['Index Scan × 3', 'acc'], ['com id e criado_em: 1 só', '']);
          o.cnt = C3(['PARTIÇÕES LIDAS', t > 1 ? '3 de 3' : '…'], ['PODADAS', '0'], ['FILTRO', 'id']);
          o.res = t > 1 ? [['Append: 3 Index Scans', 'acc'], ['id + criado_em: 1 partição', '']] : [];
          if (t > 1.2) T(o, SPOT.rt, 'Append nas 3'); } },
      { id: 'tiers', dur: 5, title: 'Tiers: 2026 quente, 2025 morno, 2024 frio', yk: 'OS TIERS',
        code: ['pedidos_2026: hot  · 25M · 50 GB · SSD', 'pedidos_2025: warm · 17M · 34 GB', 'pedidos_2024: cold · 8M  · 16 GB', '              armazenamento barato', '# a doc: dado pouco usado pode ir', '#   para mídia mais barata'],
        story: 'Os anos não são usados por igual. 2026 recebe todas as escritas e quase todas as leituras; 2024 só é lido para um relatório antigo. Com partições, cada ano pode morar num tablespace diferente: o quente em SSD, o frio num armazenamento barato e lento.',
        look: 'A gaveta de 2026 acende forte (hot), a de 2025 fica meia-luz (warm) e a de 2024 apagada (cold).',
        key: 'Faixa por data separa o quente do frio, e cada um vai para o disco que merece.',
        f(o, t) { o.on.host = 2; o.on.p2 = 1; o.on.p1 = 2; o.on.p0 = 0;
          const TI = [['cold', 'armazenamento barato'], ['warm', 'disco comum'], ['hot', 'SSD']];
          TI.forEach(([a, b], i) => { o.rows['p' + i].meta = a; o.rows['p' + i].rows = [[b, i === 2 ? 'acc' : 'dim'], [i === 2 ? 'todas as escritas' : 'só leitura', i === 2 ? 'acc' : 'dim']]; });
          lit(o, route(2)); quiet(o, route(0), route(1)); stream(o, t, 4, () => 2, 2.4);
          o.rows.rt = grp('pedidos novos', '2026', ['1054: 2026-11-27 20:08', 'acc'], ['→ pedidos_2026 (SSD)', 'acc']);
          o.rows.side = grp('os tiers', '', ['hot: 2026 · 50 GB · SSD', 'acc'], ['warm: 2025 · 34 GB', ''], ['cold: 2024 · 16 GB · barato', 'dim']);
          o.cnt = C3(['HOT', '2026 · 50 GB'], ['WARM', '2025 · 34 GB'], ['COLD', '2024 · 16 GB']);
          o.res = [['cada ano no disco que merece', 'acc']]; if (t > 1) T(o, SPOT.s(2), 'hot: SSD'); } },
      { id: 'retencao', dur: 5.5, title: 'Aposentar 2024: DELETE × DROP × DETACH', yk: 'NO PSQL · 105.407 LINHAS',
        code: ["DELETE FROM pedidos WHERE criado_em < '2025-01-01';", '  62,9 ms  (deixa linhas mortas p/ o VACUUM)', 'DROP TABLE pedidos_2024;', '  7,5 ms', 'ALTER TABLE pedidos DETACH PARTITION pedidos_2024;', '  1,1 ms'],
        story: 'A política da loja guarda dois anos. Apagar 2024 com DELETE varre as linhas uma a uma e deixa linhas mortas para o VACUUM; com 105.407 linhas, num PostgreSQL 14, levou 62,9 ms. DROP TABLE da partição levou 7,5 ms, e DETACH PARTITION, que só solta a gaveta, 1,1 ms. Com 8 milhões de linhas a diferença cresce, mas não dá para garantir a mesma proporção.',
        look: 'A gaveta de 2024 se solta da base e afunda; as outras duas ficam.',
        key: 'Retenção por partição: soltar ou apagar a gaveta em vez de apagar linha a linha.',
        f(o, t) { o.on.host = 2; o.on.p1 = 2; o.on.p2 = 2; const gone = t > 1.6; o.on.p0 = t > 0.6 ? 'bad' : 2; if (gone) o.show.p0 = 0;
          o.rows.p0.rows = [['DETACH PARTITION', 'bad'], ['1,1 ms', 'bad']];
          o.rows.rt = grp('retenção', 'guarda 2 anos', ['aposentar pedidos_2024', 'acc'], ['8M linhas · 16 GB', '']);
          o.rows.side = grp('105.407 linhas · PG 14', '', ['DELETE: 62,9 ms + VACUUM', 'bad'], ['DROP TABLE: 7,5 ms', ''], ['DETACH PARTITION: 1,1 ms', 'acc']);
          o.cnt = C3(['DETACH', '1,1 ms'], ['DROP', '7,5 ms'], ['DELETE', '62,9 ms', 'bad']);
          o.res = gone ? [['pedidos_2024 solta da tabela', 'acc'], ['sem linhas mortas, sem VACUUM', '']] : [];
          if (t > 0.8) T(o, SPOT.s(0), 'DETACH: 1,1 ms'); } },
      { id: 'ano', dur: 6, title: 'E se der errado: 01/01/2027 sem partição', yk: 'NO PSQL · 00:00:05',
        code: ["INSERT INTO pedidos (…, criado_em)", "  VALUES (…, '2027-01-05');", 'ERROR: no partition of relation "pedidos"', '  found for row', 'DETAIL: Partition key of the failing row contains', '  (criado_em) = (2027-01-05 00:00:00-03).'],
        story: 'Virou o ano e ninguém criou pedidos_2027. O primeiro pedido com criado_em em 2027 não tem gaveta para cair, e o PostgreSQL recusa o INSERT: "no partition of relation pedidos found for row". Cada pedido novo falha até alguém criar a partição. O conserto é um job que cria a partição do ano seguinte com folga.',
        look: 'A ficha corre até a quarta vaga, onde a gaveta de 2027 deveria estar, e fica vermelha.',
        key: 'Faixa por data exige criar a próxima partição antes de precisar dela.',
        f(o, t) { o.on.host = t > 1.6 ? 'bad' : 2; for (let i = 0; i < 3; i++) o.on['p' + i] = 2; o.rows.host.miss = 3; o.rows.host.missTone = t > 1.6 ? 'bad' : '';
          const pts = [...route(3), [SCX(3), SY + SD / 2, PL + 8]], f = ease(clamp((t - 0.4) / 1.2));
          lit(o, route(3), t > 1.6 ? 'bad' : '', null); o.tok.push({ p: alongPts(pts, cumLen(pts), f), tone: t > 1.6 ? 'bad' : '' });
          o.rows.rt = grp('pedido novo', '2027-01-05', ["criado_em = '2027-01-05'", 'acc'], ['→ pedidos_2027?', t > 1.6 ? 'bad' : '']);
          o.rows.side = grp('o conserto', 'um job', ['criar pedidos_2027 em dezembro', 'acc'], ['ou uma partição DEFAULT', ''], ['testar antes da virada', '']);
          o.cnt = C3(['PARTIÇÃO', t > 1.6 ? 'não existe' : '…', t > 1.6 ? 'bad' : ''], ['CRIADO_EM', '2027-01-05'], ['INSERT', t > 1.6 ? 'ERROR' : '…', t > 1.6 ? 'bad' : '']);
          o.res = t > 1.6 ? [['no partition of relation "pedidos"', 'bad'], ['found for row', 'bad']] : [];
          if (t > 1.6) T(o, SPOT.s(3), 'sem pedidos_2027', 'bad'); } },
    ],
    hash: [
      { id: 'func', dur: 4.5, title: 'A função: murmur3 de 32 bits, mod 3', yk: 'O ROTEADOR',
        code: ["lena-77 → 0x8fd9d9d8 → mod 3 = 1", "bia-31  → 0x12bd9b3b → mod 3 = 1", "caio-58 → 0x8c6d56ed → mod 3 = 2", "davi-12 → 0x06de0db0 → mod 3 = 0", "mkt-01  → 0x9ebaf255 → mod 3 = 2", '# spaolacci/murmur3 Sum32, seed 0'],
        story: 'O roteador usa a murmur3 de 32 bits, a mesma do lab murmur/ do autor (spaolacci/murmur3, Sum32), sobre o cliente_id como está, sem passar para minúsculas. O número de 32 bits sai embaralhado; o resto da divisão por 3 escolhe o shard. Para os 5 clientes da história dá 1, 1, 2, 0 e 2.',
        look: 'O roteador passa pelos 5 clientes; a viga do shard de cada um acende na vez dele.',
        key: 'Hash: transforma a chave num número; o mod escolhe o shard.',
        f(o, t) { const j = Math.floor(t / 0.9) % 5, k = ORDER[j]; o.on.rt = 1; o.rows.rt = m3rt(k);
          for (let i = 0; i < 3; i++) { o.on['s' + i] = i === CL[k].m3 ? 1 : 2; if (i === CL[k].m3) lit(o, route(i), '', (t % 0.9) / 0.9); else quiet(o, route(i)); }
          o.rows['s' + CL[k].m3] = srv(CL[k].m3, M3[CL[k].m3], { tone: { [k]: 'acc' } });
          o.rows.side = grp('resultados mod 3', '', ['lena 1 · bia 1 · caio 2', ''], ['davi 0 · mkt-01 2', ''], ['murmur3 32 bits, seed 0', 'dim']);
          o.cnt = C3(['CLIENTE', CL[k].id], ['MURMUR3', CL[k].h], ['MOD 3', String(CL[k].m3)]);
          o.res = [[`${CL[k].id} → shard-${CL[k].m3}`, 'acc']]; } },
      { id: 'quatorze', dur: 6.5, title: 'Os 14 pedidos em 3 shards: 3 / 9 / 2', yk: 'A CONTAGEM',
        code: ['shard-0: davi-12 (3)', 'shard-1: lena-77 (6) + bia-31 (3) = 9', 'shard-2: caio-58 (2) + mkt-01', '# 14 linhas: lei dos pequenos números', '# 100.000 chaves c-0…c-99999:', '#   todas a ≤ 2% do ideal'],
        story: 'Os 14 pedidos da amostra caem um a um. No fim, o shard-0 tem 3, o shard-1 tem 9 e o shard-2 tem 2 (mais o mkt-01). Parece torto, mas são só 4 clientes: é a lei dos pequenos números. Com 100 mil chaves sintéticas, murmur3, FNV-1a e SHA-256 ficam todas a menos de 2% do ideal.',
        look: 'As 14 fichas saem do roteador em ordem, de 1041 a 1054, e cada uma acende a sua célula.',
        key: 'Com poucas chaves a conta parece torta; com muitas, o hash espalha por igual.',
        f(o, t) { const ALL = [...CL.lena.ped, ...CL.bia.ped, ...CL.caio.ped, ...CL.davi.ped].sort((a, b) => a - b);
          const land = p => 0.4 + ALL.indexOf(p) * 0.34 + 0.8; o.on.rt = 1;
          const ds = M3.map((ks, i) => srv(i, ks, { tone: Object.fromEntries(ks.map(k => [k, k === 'mkt' ? '' : p => t > land(p) ? (t < land(p) + 0.6 ? 'acc' : '') : 'hide'])) }));
          ds.forEach((d, i) => { o.rows['s' + i] = d; const n = d.cells.filter(c => c.c !== 'mkt' && c.tn !== 'hide').length; d.rows = [[`${n} ${n === 1 ? 'pedido' : 'pedidos'}`, 'acc'], ...legend(M3[i])].slice(0, 3); o.on['s' + i] = 2; quiet(o, route(i)); });
          ALL.forEach(p => { const k = ownerOf(p), i = CL[k].m3, d = ds[i], idx = d.cells.findIndex(c => c.o === String(p)); fly(o, t, land(p) - 0.8, 's' + i, d, idx, '', 0.8); });
          const cur_ = ALL.filter(p => t > land(p) - 0.8).pop() || ALL[0], k = ownerOf(cur_);
          o.rows.rt = grp('roteador', `pedido ${cur_}`, [`murmur3("${CL[k].id}")`, 'acc'], [`mod 3 = ${CL[k].m3} → shard-${CL[k].m3}`, 'acc']);
          const cnt = [0, 1, 2].map(i => ds[i].cells.filter(c => c.c !== 'mkt' && c.tn !== 'hide').length);
          o.rows.side = grp('a contagem', '14 pedidos', [`shard-0: ${cnt[0]} · shard-1: ${cnt[1]} · shard-2: ${cnt[2]}`, 'acc'], ['poucas chaves: parece torto', 'dim'], ['100 mil chaves: ≤ 2% do ideal', '']);
          o.cnt = C3(['CONTAGEM', cnt.join(' / ')], ['PEDIDOS', String(cnt[0] + cnt[1] + cnt[2]) + ' de 14'], ['FUNÇÃO', 'murmur3 mod 3']);
          o.res = cnt[0] + cnt[1] + cnt[2] === 14 ? [['3 / 9 / 2 na amostra', 'acc'], ['lei dos pequenos números', '']] : []; } },
      { id: 'quatro', dur: 6.5, title: 'mod 3 → mod 4: 4 de 5 clientes mudam de shard', yk: 'A CONTA',
        code: ['lena-77: mod 3 = 1 → mod 4 = 0', 'bia-31:  1 → 3', 'caio-58: 2 → 1', 'mkt-01:  2 → 1', 'davi-12: 0 → 0  (o único que fica)', '# 100 mil chaves: 75,2% mudam'],
        story: 'A loja liga o shard-3 e o roteador passa a fazer mod 4. A conta muda para quase todo mundo: a Lena vai de 1 para 0, a Bia de 1 para 3, o Caio e o mkt-01 de 2 para 1. Só o Davi fica. Nas 100 mil chaves de teste, 75,2% trocam de shard, e muitas vão de um shard antigo para outro antigo.',
        look: 'O shard-3 sobe; as fichas que mudam saltam de um servidor para outro e acendem. Só as células do Davi ficam paradas.',
        key: 'Com mod N, de N para N + 1 muda a fração N ÷ (N + 1): de 3 para 4, 75%.',
        f(o, t) { o.show.s3 = 1; const mv = t > 1;
          const old = M3.map((ks, i) => srv(i, ks)), nw = M4.map((ks, i) => srv(i, ks, { tone: Object.fromEntries(ks.map(k => [k, k === 'davi' ? '' : 'acc'])) }));
          const moving = []; ORDER.forEach(k => { if (k === 'davi') return; const a = CL[k].m3, b = CL[k].m4;
            (k === 'mkt' ? ['mkt'] : CL[k].ped).forEach((p, j) => moving.push({ k, p, a, b, t0: 1.0 + moving.length * 0.12 })); });
          if (mv) { nw.forEach((d, i) => { d.cells.forEach(c => { const m = moving.find(x => (x.k === 'mkt' ? c.c === 'mkt' : c.o === String(x.p))); if (m && t < m.t0 + 1.3) c.tn = 'hide'; }); });
            moving.forEach(m => { const oi = old[m.a].cells.findIndex(c => m.k === 'mkt' ? c.c === 'mkt' : c.o === String(m.p)), ni = nw[m.b].cells.findIndex(c => m.k === 'mkt' ? c.c === 'mkt' : c.o === String(m.p));
              const from = cellAt('s' + m.a, old[m.a], oi), to = cellAt('s' + m.b, nw[m.b], ni); hop(o, t, m.t0, from, to, 'acc', 1.3); }); }
          for (let i = 0; i < 4; i++) { const d = mv ? nw[i] : i < 3 ? old[i] : { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['novo', 'acc']] };
            if (mv) { const ch = d.cells.filter(c => c.c !== 'mkt' && c.c !== 'davi').length, mk = d.cells.some(c => c.c === 'mkt');
              d.rows = [[ch || mk ? `chegaram: ${ch}${mk ? ' + mkt-01' : ''}` : 'ninguém chegou', ch || mk ? 'acc' : 'dim'], ...legend(M4[i])].slice(0, 3); if (i === 2) d.rows = [['0 pedidos da amostra', 'dim'], ['todos saíram', 'bad']]; }
            o.rows['s' + i] = d; o.on['s' + i] = mv ? 1 : 2; }
          o.rows.rt = grp('roteador', mv ? 'mod 4' : 'mod 3', [mv ? 'shard = murmur3(cliente_id) mod 4' : 'shard = murmur3(cliente_id) mod 3', 'acc'], ['4 de 5 clientes mudam', mv ? 'bad' : 'dim'], ['só davi-12 fica', '']);
          o.rows.side = grp('o que se mexe', '3 → 4 shards', ['amostra: 11 de 14 pedidos + mkt-01', 'acc'], ['100 mil chaves: 75,2%', 'bad'], ['37,5M linhas · 75 GB · 25 min', 'bad']);
          for (let i = 0; i < 4; i++) quiet(o, route(i));
          o.cnt = C3(['MUDAM', mv ? '75,2%' : '…', 'bad'], ['CLIENTES', mv ? '4 de 5' : '…'], ['A MOVER', '75 GB · 25 min']);
          o.res = mv ? [['75,2% das chaves trocam de shard', 'bad'], ['37,5M linhas a 50 MB/s = 25 min', '']] : [];
          if (t > 2.6) T(o, SPOT.s(0), 'davi-12 fica no shard-0', 'dim'); } },
      { id: 'fracao', dur: 5, title: 'N ÷ (N + 1): por que o mod mexe quase tudo', yk: 'A FÓRMULA',
        code: ['de N para N + 1 muda N ÷ (N + 1)', '3 → 4: 75,2%   (teórico 75%)', '3 → 6: 49,9%   (dobrar: 50%)', '3 → 2: 66,7%   (o 2/3 do módulo 7)', '9 → 10: 90%', '# o ideal seria 1 ÷ (N + 1) = 25%'],
        story: 'Com mod N, a chave só fica no lugar se o resto for o mesmo com N e com N + 1, e isso acontece em 1 de cada N + 1 chaves. De 3 para 4, 75% mudam; de 9 para 10, 90%. O caso menos ruim é dobrar (3 → 6, 49,9%), e é por isso que o PostgreSQL pede módulos que sejam fatores um do outro. O ideal seria mexer só o que vai para o shard novo: 25%.',
        look: 'Os 4 shards seguem com a divisão nova; o quadro compara 75,2% com o ideal de 25%.',
        key: 'O mod não sabe crescer: quase toda chave muda quando N muda.',
        f(o, t) { o.show.s3 = 1; for (let i = 0; i < 4; i++) { o.rows['s' + i] = srv(i, M4[i]); o.on['s' + i] = 2; quiet(o, route(i)); } o.rows.s2.rows = [['0 pedidos da amostra', 'dim']];
          o.rows.rt = grp('roteador', 'mod 4', ['fica: resto igual com 3 e 4', ''], ['1 em cada 4 chaves', 'acc']);
          o.rows.side = grp('quanto muda', 'mod N', ['3 → 4: 75,2% · 3 → 6: 49,9%', 'bad'], ['3 → 2: 66,7% · 9 → 10: 90%', 'bad'], ['ideal 3 → 4: 25%', 'acc']);
          o.cnt = C3(['3 → 4', '75,2%', 'bad'], ['3 → 6', '49,9%'], ['IDEAL', '25%']);
          o.res = [['N ÷ (N + 1) das chaves mudam', 'bad'], ['ideal: 1 ÷ (N + 1)', 'acc']]; } },
      { id: 'deploy', dur: 6.5, title: 'E se der errado: duas versões, o 1054 some', yk: 'O DEPLOY',
        code: ["v2 (mod 4): murmur3('lena-77') mod 4 = 0", '  → INSERT 1054 no shard-0', "v1 (mod 3): murmur3('lena-77') mod 3 = 1", '  → SELECT … meus pedidos no shard-1', '# o 1054 não aparece', '# módulo 22: deploy em duas versões'],
        story: 'Durante o deploy, metade das réplicas já roda a v2 (mod 4) e metade ainda a v1 (mod 3). A Lena fecha o 1054 numa réplica v2, que grava no shard-0. Um segundo depois ela abre "meus pedidos" e cai numa réplica v1, que procura no shard-1. O pedido existe, pago, e não aparece para ela.',
        look: 'A ficha do 1054 vai ao shard-0 pela v2; a consulta da v1 vai ao shard-1 e volta vermelha, sem o 1054.',
        key: 'Mudar N exige que todas as versões usem o mesmo mapa ao mesmo tempo.',
        f(o, t) { o.show.s3 = 1;
          const d0 = srv(0, ['davi'], { rows: [['davi-12 · 3 pedidos', '', 'davi'], ['1054 (v2, mod 4)', t > 1.6 ? 'acc' : 'dim']] }); d0.cells.push(ped(1054, t > 1.6 ? 'acc' : 'hide')); o.rows.s0 = d0;
          const d1 = srv(1, ['lena', 'bia'], { tone: { lena: p => p === 1054 ? 'ghost' : t > 2.6 ? 'bad' : '' } }); o.rows.s1 = d1;
          o.rows.s3 = { name: 'shard-3', meta: 'pg-pedidos-3', cells: [], rows: [['novo, vazio', 'dim']] };
          const f = fly(o, t, 0.5, 's0', d0, 3, 'acc', 1.1); if (t > 1.6) o.on.s0 = 1; else o.on.s0 = 2;
          if (t > 1.9) { lit(o, route(1), 'bad', t < 2.6 ? (t - 1.9) / 0.7 : null); o.on.s1 = t > 2.6 ? 'bad' : 2; } else quiet(o, route(1));
          o.on.s2 = 2; o.on.s3 = 2; quiet(o, route(2), route(3));
          o.rows.rt = grp('2 versões no ar', 'deploy pela metade', ['v2: mod 4 = 0 → grava no shard-0', 'acc'], ['v1: mod 3 = 1 → lê o shard-1', t > 1.9 ? 'bad' : 'dim'], ['"meus pedidos": sem o 1054', t > 2.6 ? 'bad' : 'dim']);
          o.rows.side = grp('pedido 1054', 'lena-77 · 64,00', ['gravado no shard-0', t > 1.6 ? 'acc' : 'dim'], ['procurado no shard-1', t > 1.9 ? 'bad' : 'dim'], ['a Lena não vê o pedido', t > 2.6 ? 'bad' : 'dim']);
          o.cnt = C3(['GRAVOU EM', t > 1.6 ? 'shard-0' : '…'], ['LEU EM', t > 1.9 ? 'shard-1' : '…', 'bad'], ['MEUS PEDIDOS', t > 2.6 ? '5 de 6' : '…', 'bad']);
          o.res = t > 2.6 ? [['1054 gravado, mas invisível', 'bad'], ['v1 e v2 com mapas diferentes', 'bad']] : [];
          if (t > 1.7) T(o, SPOT.s(0), 'v2 gravou aqui'); if (t > 2.7) T(o, SPOT.s(1), 'v1 lê aqui: sem 1054', 'bad'); } },
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
        fitFont(x, u, 'não existe', 10.5, SW - 10); x.fillText('não existe', u(X + SW / 2), u(Y + 68)); x.textAlign = 'left'; } }
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
    lbl(s.yk || 'NO CÓDIGO', L0, 10, Wd - L0 - 8);
    const lines = yl.slice(0, 6); x.fillStyle = C.inkHi; lines.forEach((l, i) => { fitFont(x, u, l, 8.8, Wd - L0 - 6); x.fillText(l, u(L0), u(25 + i * 13)); });
    lbl('RESULTADO', L0, 110);
    (o.res.length ? o.res : [['…', 'dim']]).slice(0, 2).forEach(([l, tn], i) => { x.fillStyle = tn === 'bad' ? BAD() : tn === 'dim' ? INK() : tn === 'acc' ? acc : C.inkHi; fitFont(x, u, l, 9.4, Wd - L0 - 6); x.fillText(l, u(L0), u(123 + i * 13)); });
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const TB = (head, rows, on = -1) => `<table class="h3-sum"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>${rows.map((r, i) => `<tr${i === on ? ' class="on"' : ''}>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const CLT = on => TB(['cliente', 'murmur3', 'mod 3', 'mod 4'], ORDER.map(k => [CL[k].id, CL[k].h, CL[k].m3, CL[k].m4]), on);
  const DATA = {
    topologia: () => `<li>Tabela <b>pedidos</b>: <b>50.000.000</b> de linhas × <b>2 KB</b> = <b>100 GB</b>; índices +40% = <b>140 GB</b>; volume de <b>200 GB</b> (70%)</li><li>Crescimento: 5 pedidos/s × 86.400 = <b>432.000/dia</b> = <b>1,21 GB/dia</b>; os 60 GB livres acabam em <b>~50 dias</b></li><li>Backup a 50 MB/s: <b>47 min</b> (1 servidor) → <b>15 min 33 s</b> (3 shards em paralelo)</li>${TB(['cliente', 'pedidos', 'shard (mod 3)'], [['lena-77', '1042, 1044, 1047, 1048, 1051, 1054', 'shard-1'], ['bia-31', '1043, 1046, 1049', 'shard-1'], ['caio-58', '1041, 1053', 'shard-2'], ['davi-12', '1045, 1050, 1052', 'shard-0'], ['mkt-01', '20.000.000 (40%)', 'shard-2']], 0)}<li>Pedido <b>1054</b>: 1 camiseta preta 49,00 + frete Recife 15,00 = <b>64,00</b></li>`,
    consulta: () => `<li>Capacidade nominal: 3 × 150 = <b>450 pedidos/s</b>; <b>46,7 GB</b> por shard</li>${TB(['shards (N)', 'algum acima do p99', 'algum fora (99,9%)'], [['1', '1,00%', '0,10%'], ['3', '2,97%', '0,30%'], ['10', '9,56%', '0,9955%'], ['50', '39,5%', '4,88%'], ['100', '63,4%', '—']], 1)}<li>Cauda: <b>1 − 0,99^N</b> (Dean e Barroso, "The Tail at Scale"); disponibilidade: <b>1 − 0,999^N</b></li><li>Para <b>um cliente</b> a chance de ficar sem os pedidos continua <b>0,1%</b></li>`,
    chave: () => `<li>Eficiência do cluster = <b>1 ÷ (nº de shards × fração do mais quente)</b></li>${TB(['chave', 'mais quente', 'eficiência'], [['cliente_id (com mkt-01)', '60%', '55,6%'], ['cidade', 'SP 55%', '60,6%'], ['criado_em ou id', '100% das escritas', '33,3%'], ['cliente_id (sem parceiro)', '~33%', '~100%']], 0)}<li>mkt-01: 20M linhas (40%) no <b>shard-2</b> → 30M (60%); satura em <b>T = 250</b> pedidos/s (de 450)</li><li>Shard dedicado 2× (300/s): os 4 saturam juntos em <b>T = 750</b></li><li>Exemplo do artigo: 3 clientes = 50% do uso em 10 partições → 55% numa só → <b>18,2%</b></li>`,
    particoes: () => `<li>PostgreSQL 14, uma instância: <b>PARTITION BY RANGE (criado_em)</b>, <b>PRIMARY KEY (id, criado_em)</b></li>${TB(['partição', 'linhas', 'tamanho', 'tier'], [['pedidos_2024', '8M', '16 GB', 'cold'], ['pedidos_2025', '17M', '34 GB', 'warm'], ['pedidos_2026', '25M', '50 GB', 'hot']], 2)}<li>Com criado_em: <b>Seq Scan on pedidos_2026</b>; só com id: <b>Append</b> com 3 Index Scans</li><li>105.407 linhas: DELETE <b>62,9 ms</b> · DROP <b>7,5 ms</b> · DETACH <b>1,1 ms</b></li><li>Hash do PostgreSQL (MODULUS 3) na amostra: <b>11 / 3 / 0</b> (função própria do PostgreSQL)</li>`,
    hash: () => `${CLT(0)}<li>murmur3 32 bits (spaolacci/murmur3 Sum32, seed 0), sem minúsculas</li><li>mod 3 na amostra: <b>3 / 9 / 2</b>; mod 4: <b>4 de 5</b> clientes mudam (só davi-12 fica)</li>${TB(['mudança', 'chaves que mudam'], [['3 → 4', '75,2% (37,5M linhas, 75 GB, 25 min)'], ['3 → 6', '49,9%'], ['3 → 2', '66,7%']], 0)}<li>100 mil chaves em 5 shards (máx. ÷ média): SHA-256 1,009 · MD5 1,018 · FNV-1a 1,003 · murmur3 1,007</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div class="i3-count" id="k3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <div class="i3-sql"><b>${esc(s.yk || 'No código')}</b>${esc(s.code.join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'shards') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(450, 230, -150), dist: innerWidth < 640 ? 15 : 18 } : { target: W(180, 230, 60), dist: 16.5 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–5 · arraste para girar' };
})() });
