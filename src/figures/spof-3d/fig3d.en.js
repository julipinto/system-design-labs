// Figura 3D (iso-glow): os pontos únicos de falha da loja. A esteira dos 12 elos do caminho do pedido 1060 da Lena (do DNS ao
// banco da celula-recife): cada elo é uma peça; as que têm par mostram as cópias atrás; as de uma cópia só ficam em vermelho-sódio.
// A ponte da cidade (a analogia do artigo, uma vez), o checkout com o PSP-A e o PSP-B, o edge-loja de três instâncias com o mesmo mapa,
// os pods com e sem estado, a passiva do banco e o relógio do failover (5 s × 3, 10 s × 3, 30 + 5 s, 5 s de mapa) com o split brain.
// Atrás, o mostrador: à esquerda os números do passo; à direita o gráfico (minutos por mês de cada elo, o relógio, as barras).
// Cenários (?mode=ponte|mapa|redundancia|failover; ?step=N abre no passo N).
// Dados: a história canônica (docs/escrita/disaster-recovery-brief.md): auditoria de 12 elos a 99,9% (98,8066% · 99,5003% · 99,9988%;
// 515,6 · 215,9 · 0,52 min/mês), a queda de SP às 20:40:00.150, MTTD 30 s, promoção aos 35 s, mapa aos 65 s, split brain 297 e 2.970.
FIGS3D.push({ id: 'spof', name: 'SPoF', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const sg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const thou = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dec = (v, n = 1) => { const s = (Math.round(v * 10 ** n) / 10 ** n).toFixed(n); const [a, b] = s.split('.'); return thou(+a) + (b ? '.' + b : ''); };
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#202427' : pal3().ink;
  const BAD = () => theme === 'light' ? '#8c170e' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;

  // ── cenários ──
  const SC = ['ponte', 'mapa', 'redundancia', 'failover'];
  const SCNAME = { ponte: 'Bridge', mapa: 'Map', redundancia: 'Redundancy', failover: 'Failover' };
  const SCFULL = { ponte: 'The bridge and the checkout', mapa: 'The 12 links of order 1060', redundancia: 'Active × passive', failover: 'Detect, decide, switch' };
  const AULA = { ponte: 'aula-1-single-point-of-failure', mapa: 'aula-2-identificando-spofs', redundancia: 'aula-3-redundancia-e-failover', failover: 'aula-3-redundancia-e-failover' };
  let clk = 0, sc = 'ponte', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-spof3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── dados: os 12 elos do POST /pedidos da Lena (celula-recife), cada um a 99,9% ──
  // [nome, detalhe, cópias hoje, quem assume, nº de cópias no desenho, tipo, conserto]
  const ELOS = [
    ['DNS', 'loja.com.br', '1 provider', 'nobody', 1, 'spof', '2nd DNS provider, short TTL'],
    ['certificate', 'TLS', '1, renewed by hand', 'nobody', 1, 'spof', 'automatic renewal + 30-day alert'],
    ['edge-loja', 'router', '3: SP, Rio, Recife', 'the other two', 3, 'logico', 'publish in rings + "last good" map'],
    ['identity', 'JWT keys', '1 region', 'nobody', 1, 'spof', '2nd region + keys cached for 24 h'],
    ['lb + gw-loja', 'of the cell', '2 + 2', 'the pair', 2],
    ['bff-app', '', '≥ 2', 'the pair', 2],
    ['pedidos', '', '≥ 2', 'the pair', 2],
    ['pagamentos', 'PSP-A + B', '2 pods, PSP-B', 'PSP-B', 2],
    ['estoque', '', '2', 'the pair', 2],
    ['PostgreSQL', 'cell', 'primary + passive', 'the passive, 35 s', 2, 'parcial'],
    ['Kafka', 'cell', '3 brokers', 'the others', 3],
    ['map', 'control plane', '1 region', 'nobody', 1, 'spof', 'static stability: the edges keep the last map'],
  ];
  const SPOFS = [0, 1, 2, 3, 11];
  const MES = 43200, A1 = 0.999, A2 = 1 - 0.001 ** 2;
  const minMes = arr => (1 - arr.reduce((p, a) => p * a, 1)) * MES;
  const minTxt = v => v < 1 ? dec(v, 2) : dec(v, 1);
  const pctTxt = a => dec(a * 100, 4) + '%';
  let dup = new Set();   // SPoFs que a leitora já duplicou (passo "duplicar")

  // ── geometria ──
  const PL = 7, ZR = 17, EH = 24;
  plateWith(g0, 950, 480, [[14, 14], [936, 14], [14, 466], [936, 466]]);
  hazeAndShadow(g0, 475, 240, 10.8, 5.8);
  // o mostrador fica suspenso atrás, em dois pés, para o que está na frente não cobrir a parte de baixo
  const SZ = PL + 46;
  rbox(24, 8, SZ, 700, 12, 240, 5, bodyMat, g0); rbox(44, 10, PL, 10, 8, 46, 2, bodyMat, g0); rbox(694, 10, PL, 10, 8, 46, 2, bodyMat, g0);
  const scr = faceCanvas('front', 28, 20, SZ + 236, 692, 232, 4, g0), SK = 692 / 416;

  const B = {};
  function block(nm, x, y, w, d, h, kind, opt = {}) {
    const g = new THREE.Group(); g.userData.nm = nm; g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, kind === 'slab' ? 10 : 6, mat, g);
    const top = faceCanvas('top', 2.5, 2.5, h, w - 5, d - 5, opt.P || 5, g);
    const glow = glowPoints([W(0, 0, 0)], 0.35); g0.add(glow);
    // cópias: peças iguais atrás (y menor), que saem de trás quando o elo ganha par
    const gh = (opt.ghost ? [1, 2] : []).map(k => { const gg = new THREE.Group(); gg.userData.nm = nm; g0.add(gg); const gm = capMat(); twCaps.push(gm);
      rbox(0, 0, 0, w, d, h, 6, gm, gg); gg.visible = false; return { g: gg, mat: gm, k, f: 0 }; });
    B[nm] = { g, mat, top, glow, gh, w, d, h, kind, key: '', f: 0, pos: [x, y], z0: opt.z0 ?? PL };
  }
  // a esteira: seis elos atrás (esquerda → direita) e seis na frente (direita → esquerda)
  const EW = 128, ED = 64;
  const EPOS = ELOS.map((_, i) => i < 6 ? [30 + 150 * i, 116] : [780 - 150 * (i - 6), 276]);
  ELOS.forEach((_, i) => block('e' + i, ...EPOS[i], EW, ED, EH, 'elo', { ghost: true }));
  const EC = i => [EPOS[i][0] + EW / 2, EPOS[i][1] + ED / 2];
  // a ponte: as duas margens (a pista e os pilares vêm depois)
  block('bankL', 40, 70, 260, 330, 16, 'land', { P: 3 }); block('bankR', 520, 70, 260, 330, 16, 'land', { P: 3 });
  // o checkout de uma ponte só, e o edge-loja de três instâncias
  block('cped', 40, 180, 180, 90, 26, 'svc'); block('cpag', 290, 180, 190, 90, 26, 'svc');
  block('psA', 600, 90, 230, 90, 26, 'svc'); block('psB', 600, 290, 230, 90, 26, 'svc');
  block('ed0', 60, 220, 180, 72, 24, 'svc'); block('ed1', 300, 220, 180, 72, 24, 'svc'); block('ed2', 540, 220, 180, 72, 24, 'svc');
  block('emap', 760, 70, 160, 70, 24, 'svc');
  // redundância: o balanceador, dois pods do pedidos, o Redis do carrinho, o primário e a passiva
  block('rlb', 30, 190, 130, 70, 24, 'svc'); block('rp1', 220, 100, 160, 66, 24, 'svc'); block('rp2', 220, 280, 160, 66, 24, 'svc');
  block('rrd', 460, 100, 170, 66, 24, 'svc'); block('rpg', 460, 280, 180, 70, 24, 'svc'); block('rrep', 720, 280, 190, 70, 24, 'svc');
  // failover: as três regiões (lajes baixas) e o que mora em cada uma
  const RZ = PL + 5;
  block('fsp', 24, 62, 446, 340, 5, 'slab', { P: 2 }); block('frio', 494, 62, 296, 340, 5, 'slab', { P: 2 }); block('frec', 812, 62, 114, 340, 5, 'slab', { P: 2 });
  block('fp1', 50, 112, 180, 62, 22, 'svc', { z0: RZ }); block('fp2', 262, 112, 180, 62, 22, 'svc', { z0: RZ });
  block('fpg', 50, 214, 260, 76, 24, 'svc', { z0: RZ }); block('foSP', 262, 318, 180, 56, 18, 'svc', { z0: RZ });
  block('fedg', 518, 112, 248, 62, 22, 'svc', { z0: RZ }); block('frep', 518, 214, 248, 76, 24, 'svc', { z0: RZ });
  block('foRio', 518, 318, 248, 56, 18, 'svc', { z0: RZ }); block('foRec', 822, 214, 94, 76, 18, 'svc', { z0: RZ });
  const NAMES = Object.keys(B);

  // a pista da ponte (cai), os pilares, o rio e a balsa
  const gP = new THREE.Group(); gP.visible = false; g0.add(gP);
  inset(300, 64, PL, 220, 342, 8, gP);
  seg([[[318, 120, PL + 0.3], [352, 120, PL + 0.3]], [[430, 160, PL + 0.3], [478, 160, PL + 0.3]], [[340, 290, PL + 0.3], [392, 290, PL + 0.3]], [[446, 360, PL + 0.3], [496, 360, PL + 0.3]]], gP);
  rbox(356, 210, PL, 14, 22, 15, 2, bodyMat, gP); rbox(450, 210, PL, 14, 22, 15, 2, bodyMat, gP);
  const deckMat = capMat(); twCaps.push(deckMat);
  const deck = new THREE.Group(); gP.add(deck);
  rbox(0, 0, 0, 236, 34, 6, 2, deckMat, deck); rbox(0, -2, 6, 236, 3, 5, 1, deckMat, deck); rbox(0, 33, 6, 236, 3, 5, 1, deckMat, deck);
  const ferryMat = capMat(); twCaps.push(ferryMat);
  const ferry = new THREE.Group(); gP.add(ferry); rbox(0, 0, 0, 44, 24, 6, 4, ferryMat, ferry); rbox(26, 4, 6, 12, 16, 6, 2, ferryMat, ferry);
  // a fenda da rede entre SP e Rio (split brain)
  const cutMat = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const cut = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cutMat); cut.visible = false; g0.add(cut);
  cut.position.copy(W(482, 232, PL + 6)); cut.scale.set(5 * TS, 12 * TS, 340 * TS);
  creases(first);

  // conexões grossas (vigas) e pontos de luz que correm nelas
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 40 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 30 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  const badEm = new THREE.Color(0xe0180c);
  let nDot = 0;
  function dot(p, tone) { if (nDot >= DOTS.length) return; const D = DOTS[nDot++]; D.g.visible = true; D.g.position.copy(W(...p));
    D.mat.emissive.copy(tone === 'bad' ? badEm : accent); moveGlow(D.glow, p, tone === 'bad' ? 0.5 : 0.9); }
  function setBeams(list) {
    let n = 0;
    for (const b of list) {
      const cum = cumLen(b.pts);
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        const A = W(...b.pts[i]), C_ = W(...b.pts[i + 1]), m = BEAM[n++], th = (b.on ? 5 : 3.2) * TS, d = C_.clone().sub(A), len = d.length();
        if (len < 1e-6) { m.visible = false; continue; }
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      const k = b.on ? (b.n ?? 2) : 0, sp = b.sp ?? 0.45;
      for (let j = 0; j < k; j++) dot(alongPts(b.pts, cum, (clk * sp + j / k) % 1), b.tone);
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
  }
  // a ficha da Lena (o pedido 1060): um cubo aceso que anda pelo caminho e para onde o caminho quebra
  const tokMat = capMat(); twCaps.push(tokMat); tokMat.emissiveIntensity = 1.4;
  const TOK = new THREE.Group(); g0.add(TOK); rbox(-8, -8, -8, 16, 16, 16, 3, tokMat, TOK, { lines: false }); TOK.visible = false;
  const tokGlow = glowPoints([W(0, 0, 0)], 0.5); g0.add(tokGlow);

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
  const TF = x => [x, 432, 24];

  // ── o que cada passo põe na cena ──
  const act = (name, meta, ...rows) => ({ name, meta, rows: rows.filter(Boolean) });
  function base() { return { show: {}, on: {}, rows: {}, gh: {}, beams: [], tags: [], cnt: [], ch: null, tok: null, bridge: null, cut: false }; }
  const put = (o, nm, d, on = 0) => { o.show[nm] = 1; o.rows[nm] = d; o.on[nm] = on; };
  const P3 = (pts, z = ZR) => pts.map(p => [p[0], p[1], z]);
  // a esteira: est = estado de cada elo ('', 'spof', 'ok', 'dim'); cps = cópias no desenho
  const PATH = (() => { const p = [[2, EC(0)[1]]]; for (let i = 0; i < 6; i++) p.push(EC(i)); p.push([EC(5)[0], EC(6)[1]]); for (let i = 6; i < 12; i++) p.push(EC(i)); return p; })();
  const ACC_ = 'acc';
  function esteira(o, est, cps, opt = {}) {
    ELOS.forEach((e, i) => { const s = est[i] || '', nm = 'e' + i, n = cps[i];
      const tone = s === 'spof' ? 'bad' : s === 'ok' ? 'acc' : 'dim';
      put(o, nm, { ...act(`${i + 1} · ${e[0]}`, e[1], [n === 1 ? '1 copy' : `${n} copies`, tone], [opt.who ? 'takes over: ' + (s === 'ok' && SPOFS.includes(i) ? 'the new pair' : e[3]) : 'at 99.9%', s === 'spof' ? 'bad' : 'dim']), sq: { n, tone } },
        s === 'spof' ? 'bad' : s === 'hot' ? 1 : s === 'off' ? 'off' : 0);
      o.gh[nm] = Math.min(2, n - 1); });
    o.beams.push({ pts: P3(PATH), on: true, n: 0, tone: opt.beamTone || '' });
  }
  function tokAlong(o, f, upto = 12, tone = '', lab = 'Lena · 1060') {
    const pts = PATH.slice(0, upto + 1).map(p => [p[0], p[1], PL + EH + 12]); o.tok = { pts, f, tone, lab };
  }
  const minsOf = arr => arr.map(a => (1 - a) * MES);

  const STEPS = {
    ponte: [
      { id: 'cidade', dur: 7, title: 'One city, one bridge', yk: 'THE QUESTION FOR EVERY PART', code: ['if this part vanished now,', 'who takes over?', 'how fast?', 'the bridge: nobody, ever'],
        story: 'The article starts with a city that has a single bridge as its entrance. Everything goes over it: people, food, ambulances. While the bridge stands, nobody thinks about it. If it falls, there is no other path of the same size. The bridge is a single point of failure.',
        look: 'The cars (points of light) cross the single lane in both directions. The left bank is the city; the right one, the rest of the world.',
        key: 'A SPoF is the part whose failure takes down all or part of the system, with no alternative path.',
        f(o, t) { ponte(o, 0, t); o.cnt = [['PATHS', '1'], ['LANES', '1', 'dim'], ['IF IT FALLS', 'city cut off', 'bad']]; } },
      { id: 'cai', dur: 8, act: ['Bring the bridge down', 'the only way'], title: 'The bridge falls: degraded mode', yk: 'WHAT STILL GETS THROUGH', code: ['bridge: out', 'ferry: one car per trip', 'boat and helicopter: a few', 'the rest wait on the bank'],
        story: 'The bridge falls. The city does not vanish from the map: you can still arrive by boat, ferry or helicopter. But not everyone gets through, and those who do take a long time. The city did not stop for good; it went into degraded mode. The store is the same: a failure takes down everything or only a part, and the more responsibility the part has, the bigger the damage.',
        look: 'The lane turns red and sinks. The cars stop on the bank; the ferry takes one at a time.',
        key: 'Total outage and degraded mode are two sizes of the same damage.',
        f(o, t) { ponte(o, sg(t, 0.4, 1.6), t); o.cnt = [['BRIDGE', 'out', 'bad'], ['FERRY', '1 car per trip', 'dim'], ['MODE', 'degraded', 'bad']];
          if (t > 1.6) T(o, TF(410), 'degraded mode\nferry: 1 at a time', 'bad'); } },
      { id: 'checkout', dur: 8, act: ['Bring PSP-A down', 'without PSP-B'], title: 'The one-bridge checkout', yk: 'A LINK WITH NO PAIR', code: ['PSP-A alone: 99.9%', '0.1% × 43,200 min = 43.2 min/month', 'PSP-A out → pagamentos has no way out', '→ no order closes'],
        story: 'In the store, the bridge is any part with no pair. Imagine pagamentos with a single provider, PSP-A. Lena\'s order 1060 goes through pedidos, reaches pagamentos and stops: PSP-A is down and there is no other. The cart is ready and the stock exists. Even so, no order closes.',
        look: 'Lena\'s token stops at pagamentos. PSP-A turns red; where PSP-B would be, nothing.',
        key: 'A single link at 99.9% is out 43.2 min per month, and the whole checkout goes down with it.',
        f(o, t) { const down = t > 1.2; checkout(o, t, down, false);
          o.cnt = [['AVAILABLE', '99.9%'], ['OUT', '43.2 min/month', 'bad'], ['ALTERNATIVE', 'none', 'bad']];
          o.ch = { type: 'rows', title: 'MINUTES OUT PER MONTH (PAYMENT)', max: 45, rows: [['PSP-A only', 43.2, '43.2 min', 'bad']] }; } },
      { id: 'pspb', dur: 8, act: ['Turn PSP-B on', 'the pair from module 21'], title: 'With PSP-B, the bridge gets a twin', yk: 'TWO PROVIDERS IN PARALLEL', code: ['parallel: 1 − 0.001 × 0.001', '= 99.9999%', '0.0001% × 43,200 min = 2.6 s/month', 'PSP-A out → PSP-B takes over'],
        story: 'Module 21 had already solved this case: pagamentos talks to two providers. When PSP-A falls, the charge goes to PSP-B, and 1060 closes. In parallel, the two at 99.9% give 1 − 0.001² = 99.9999%. The math only holds if the two do not fall for the same reason.',
        look: 'PSP-A stays red, but the light detours to PSP-B and Lena\'s token reaches the end.',
        key: 'Duplicating a link trades 43.2 min per month for 2.6 s, if the failures are independent.',
        f(o, t) { checkout(o, t, true, true);
          o.cnt = [['AVAILABLE', '99.9999%'], ['OUT', '2.6 s/month', 'dim'], ['WHO TAKES OVER', 'PSP-B', 'dim']];
          o.ch = { type: 'rows', title: 'MINUTES OUT PER MONTH (PAYMENT)', max: 45, rows: [['PSP-A only', 43.2, '43.2 min', 'dim'], ['A + B', 0.0432, '2.6 s', 'acc']] }; } },
      { id: 'comum', dur: 9, act: ['Publish a bad map', 'to all three at once'], title: 'If it goes wrong: three copies, one defect', yk: 'COMMON-MODE FAILURE', code: ['independent: 1 − 0.001³ = 99.9999999%', 'common mode: the bad map reaches all 3', 'in practice: 99.9%, like a single one', 'fix: publish in rings', '+ keep the "last good" map'],
        story: 'edge-loja, the router from module 26, runs on three instances: SP, Rio and Recife. It looks redundant. But all three run the same code and read the same map. A bad map published all at once takes down all three together. It is a common-mode failure: three copies, one single failure.',
        look: 'The map, on the right, goes to the three instances at the same time. When it arrives, all three turn red together.',
        key: 'Redundancy only multiplies if the failures are independent; the same code and the same map add up the risk.',
        f(o, t) { const bad = t > 2.4; edges(o, t, bad);
          o.cnt = [['COPIES', '3'], ['FAILURES', bad ? '1, in all 3' : '0', bad ? 'bad' : 'dim'], ['IN PRACTICE', '99.9%', 'bad']];
          o.ch = { type: 'rows', title: 'AVAILABILITY OF THE 3 INSTANCES', max: 1, rows: [['independ.', 1, '99.9999999%', 'dim'], ['common mode', 1, '99.9% (a single one)', 'bad']] };
          if (bad) T(o, TF(390), 'same code, same map\nall 3 fall together', 'bad'); } },
    ],
    mapa: [
      { id: 'fluxo', dur: 8, title: 'The 12 links of order 1060', yk: '12 LINKS IN SERIES', code: ['each link at 99.9%, a single copy', '0.999¹² = 98.8066%', '1.1934% × 43,200 min', '= 515.6 min/month out'],
        story: 'Finding a SPoF starts with drawing the happy path. Lena\'s POST /pedidos, order 1060, goes through 12 links, from the DNS to the celula-recife database. Suppose each link is at 99.9% with a single copy. In series the availabilities multiply: 0.999¹² = 98.8066%, or 515.6 min out per month.',
        look: 'Lena\'s token walks the conveyor: six links at the back, left to right, and six in front, coming back. Each part is a single copy.',
        key: 'In series, each extra link is one more way to fall: 12 links at 99.9% give 98.8%.',
        f(o, t) { esteira(o, [], ELOS.map(() => 1)); tokAlong(o, (t / 6) % 1);
          o.cnt = [['OUT', '515.6 min/month', 'bad'], ['SERIES', '98.8066%', 'dim'], ['LINKS', '12, all at 99.9%', 'dim']];
          o.ch = { type: 'elos', vals: minsOf(ELOS.map(() => A1)), tones: ELOS.map(() => 'dim'), total: 515.6 }; } },
      { id: 'quem', dur: 9, act: ['Ask every link', 'who takes over?'], title: 'Who takes over if you vanish?', yk: 'THE 7 WITH A PAIR, THE 5 WITHOUT', code: ['with a pair: 1 − 0.001² = 99.9999%', '0.999⁵ × 0.999999⁷ = 99.5003%', '0.4997% × 43,200 = 215.9 min/month', 'the 5 SPoFs: 215.6 of those minutes'],
        story: 'Now the audit\'s question, link by link: who takes over if you vanish, and how fast? Seven links have a pair: the load balancer, the services, PSP-B, the database passive and the Kafka brokers. Five do not: the DNS, the certificate, edge-loja, identity and the map. With the seven duplicated, the math drops to 215.9 min/month.',
        look: 'Copies appear behind the parts that have a pair. The five without a pair turn red. edge-loja has three copies and still turns red: all three have the same code.',
        key: 'The five SPoFs are worth 215.6 of the 215.9 minutes out per month.',
        f(o, t) { const k = Math.floor(clamp((t - 0.3) / 4.2) * 12.99), est = ELOS.map((e, i) => i < k ? (SPOFS.includes(i) ? 'spof' : '') : '');
          esteira(o, est, ELOS.map((e, i) => i < k ? e[4] : 1), { who: true }); tokAlong(o, (t / 6) % 1);
          const arr = ELOS.map((e, i) => i < k && !SPOFS.includes(i) ? A2 : A1), m = minMes(arr);
          o.cnt = [['OUT', minTxt(m) + ' min/month', 'bad'], ['SERIES', pctTxt(1 - m / MES), 'dim'], ['SPoFs', `${est.filter(s => s === 'spof').length} of 12`, 'bad']];
          o.ch = { type: 'elos', vals: minsOf(arr), tones: est.map(s => s === 'spof' ? 'bad' : 'dim'), total: m }; } },
      { id: 'duplicar', dur: 10, act: ['Duplicate the SPoFs', 'one at a time'], title: 'Duplicate one SPoF at a time', yk: 'THE FIX FOR EACH SPoF', code: [],
        story: 'Click a red part, or the buttons below, to give it a pair. Each SPoF fixed gives back ~43.2 min per month, because all of them are at 99.9%. With the five fixed, 0.52 min/month are left: 99.9988%. In practice, the order of fixes comes from the radius of each failure, the chance of it happening and the cost to fix.',
        look: 'The part gets copies behind it and leaves the red. On the dial, its bar disappears and the total minutes drop.',
        key: 'Each pair gives back ~43.2 min per month; what decides the order is radius × probability × cost.',
        f(o, t) { const est = ELOS.map((e, i) => SPOFS.includes(i) ? (dup.has(i) ? 'ok' : 'spof') : '');
          esteira(o, est, ELOS.map((e, i) => SPOFS.includes(i) && dup.has(i) ? (i === 2 ? 3 : 2) : e[4]), { who: true }); tokAlong(o, (t / 6) % 1);
          const arr = ELOS.map((e, i) => SPOFS.includes(i) && !dup.has(i) ? A1 : A2), m = minMes(arr);
          o.cnt = [['OUT', minTxt(m) + ' min/month', dup.size === 5 ? 'acc' : 'bad'], ['SERIES', pctTxt(1 - m / MES), 'dim'], ['SPoFs', `${5 - dup.size} of 12`, dup.size === 5 ? 'dim' : 'bad']];
          o.ch = { type: 'elos', vals: minsOf(arr), tones: est.map(s => s === 'spof' ? 'bad' : s === 'ok' ? 'acc' : 'dim'), total: m };
          if (!dup.size) T(o, TF(475), 'click a red part', 'bad'); } },
      { id: 'pessoas', dur: 9, title: 'The SPoFs that are not machines', yk: 'VENDOR, PERSON AND CONTROL PLANE', code: ['2 · certificate: renewed by hand 1×/year', '  → automatic + 30-day alert', '10 · "only Davi knows how to promote the database"', '  → automatic, tested failover', '12 · map: 1 region, off the path', '  → the edges keep the last map'],
        story: 'Not every SPoF is a server. The TLS certificate is renewed by hand once a year: the single point is whoever has to remember. "Only Davi knows how to promote the database" is another: the passive exists, but the switch depends on a person who is awake. And the map, link 12, is a SPoF off the path: the edges keep the last map and keep serving without the control plane. That is static stability.',
        look: 'The balloons mark the certificate and the database. The map stays dark: Lena\'s token goes through it without needing it.',
        key: 'Vendors, certificates and people are links too; the question "who takes over?" applies to them.',
        f(o, t) { const est = ELOS.map((e, i) => SPOFS.includes(i) ? 'spof' : ''); est[11] = 'off';
          esteira(o, est, ELOS.map(e => e[4]), { who: true }); tokAlong(o, (t / 6) % 1);
          const arr = ELOS.map((e, i) => SPOFS.includes(i) ? A1 : A2);
          o.cnt = [['NON-TECHNICAL', '2: certificate, Davi', 'bad'], ['OFF THE PATH', 'the map', 'dim'], ['OUT', '215.9 min/month', 'bad']];
          o.ch = { type: 'elos', vals: minsOf(arr), tones: est.map(s => s === 'spof' ? 'bad' : 'dim'), total: 215.9 };
          const [x1, y1] = EC(1), [x9, y9] = EC(9);
          if (t > 0.6) T(o, [x1, y1, 70], 'renewed by hand\n1× per year', 'bad');
          if (t > 1.8) T(o, [x9, y9, 70], '"only Davi knows how\nto promote the database"', 'bad');
          if (t > 3) T(o, [EC(11)[0], EC(11)[1], 70], 'off the path\nthe edges keep the map', 'acc'); } },
      { id: 'envelhece', dur: 9, act: ['Compare with the old list', 'before module 26'], title: 'If it goes wrong: the audit ages', yk: 'YESTERDAY\'S LIST × TODAY\'S FLOW', code: ['yesterday: 10 links, 3 SPoFs', '0.999³ × 0.999999⁷ → 129.8 min/month', 'today: 12 links, 5 SPoFs', '0.999⁵ × 0.999999⁷ → 215.9 min/month', 'new: edge-loja and the map (module 26)'],
        story: 'An audit done before module 26 listed 10 links and 3 SPoFs: the DNS, the certificate and identity. It promised 129.8 min/month. Then came the cells, and with them edge-loja and the map. Yesterday\'s list does not have the two, and today\'s math gives 215.9 min/month. A SPoF audit is a continuous review: every change in the flow asks the question again.',
        look: 'edge-loja and the map blink: they are the links the old list did not know.',
        key: 'A SPoF list is valid for the flow of the day it was made.',
        f(o, t) { const blink = t > 1.4 && Math.floor(clk * 2.4) % 2 === 0, est = ELOS.map((e, i) => SPOFS.includes(i) ? 'spof' : '');
          if (blink) { est[2] = 'hot'; est[11] = 'hot'; }
          esteira(o, est, ELOS.map(e => e[4]), { who: true }); tokAlong(o, (t / 6) % 1);
          o.cnt = [['TODAY', '215.9 min/month', 'bad'], ['YESTERDAY', '129.8 min/month', 'dim'], ['NEW', 'edge-loja and map', 'bad']];
          o.ch = { type: 'rows', title: 'MINUTES OUT PER MONTH', max: 230, rows: [['old list', 129.8, '129.8 (10 links, 3 SPoFs)', 'dim'], ['today\'s flow', 215.9, '215.9 (12 links, 5 SPoFs)', 'bad']] };
          if (t > 1.4) { T(o, [EC(2)[0], EC(2)[1], 70], 'new: module 26', 'bad'); T(o, [EC(11)[0], EC(11)[1], 70], 'new: module 26', 'bad'); } } },
    ],
    redundancia: [
      { id: 'memoria', dur: 8, title: 'The cart in the pod\'s memory', yk: 'STATE INSIDE THE POD', code: ['Lena\'s session: memory of pedidos-2', 'pedidos-2 falls → the cart falls with it', 'pedidos-1 up, knowing nothing about the cart'],
        story: 'Start with the state. If Lena\'s cart lived in the memory of pedidos-2, that pod would be a SPoF for her: when it falls, the cart goes with it, even with pedidos-1 up. Two pods do not help if only one knows the session.',
        look: 'The cart (the lit cube) sits on top of pedidos-2. The pod turns red and the cart goes dark.',
        key: 'A pod that keeps its own state is irreplaceable; two such pods are two SPoFs.',
        f(o, t) { const down = t > 2; red(o, { p2: down ? 'bad' : 1, cart: down ? null : 'rp2', rd: false, pg: false });
          o.cnt = [['CART', down ? 'lost' : 'on pedidos-2', down ? 'bad' : 'acc'], ['PODS UP', down ? '1 of 2' : '2 of 2', 'dim'], ['WHO TAKES OVER', 'nobody', 'bad']]; } },
      { id: 'stateless', dur: 9, act: ['Move the cart', 'to Redis'], title: 'The state leaves the pod', yk: 'STATELESS', code: ['cart: Redis (module 5)', 'pedidos-1 and pedidos-2: interchangeable', 'pedidos-2 falls → pedidos-1 serves', 'the risk goes along: Redis and PostgreSQL'],
        story: 'The fix is to take the state out of the pod. The cart lives in Redis (module 5) and the pedidos pods become stateless: any of them serves any customer. pedidos-2 falls and pedidos-1 carries on with the same cart. The article warns that the risk goes along with the state: Redis and PostgreSQL now concentrate what used to be spread out.',
        look: 'The cart now sits in Redis. pedidos-2 falls, the light goes only through pedidos-1, and Redis and the database are highlighted: the risk moved.',
        key: 'Stateless makes the pods interchangeable and moves the SPoF to the data layer.',
        f(o, t) { const down = t > 2.2; red(o, { p2: down ? 'bad' : 0, cart: 'rrd', rd: true, pg: true, hotData: t > 3.6 });
          o.cnt = [['CART', 'in Redis', 'acc'], ['PODS UP', down ? '1 of 2' : '2 of 2', 'dim'], ['WHO TAKES OVER', down ? 'pedidos-1' : 'any pod', 'dim']];
          if (t > 3.6) T(o, TF(550), 'the risk goes along:\nRedis and PostgreSQL', 'acc'); } },
      { id: 'ativa', dur: 9, act: ['Bring a pod down', 'in active redundancy'], title: 'Active redundancy: both serve', yk: 'HEALTH CHECK', code: ['every 5 s', '3 failures in a row to remove the pod', '5 s × 3 = 15 s', 'then: the other pod takes it all'],
        story: 'With interchangeable pods, redundancy can be active: the load balancer sends traffic to both all the time. When one falls, the health check, every 5 s, needs 3 failures in a row to remove it: 15 s. In that interval, some calls still go to the dead pod. Then the other one takes it all.',
        look: 'The load balancer splits the light between the two pods. pedidos-2 falls; the calls to it stay red until the third ✗, and then only pedidos-1 receives.',
        key: 'In active redundancy the pair was already serving: the failure splits the damage instead of stopping everything.',
        f(o, t) { const s = clamp((t - 1) * 3, 0, 20), down = s > 0, out = s >= 15;
          red(o, { p2: down ? 'bad' : 0, cart: 'rrd', rd: true, pg: true, p2Beam: down ? (out ? 'off' : 'bad') : '' });
          o.cnt = [['CLOCK', down ? dec(Math.min(s, 15), 0) + ' s' : '0 s', down && !out ? 'bad' : 'acc'], ['CHECKS', `${Math.min(3, Math.floor(s / 5))} ✗ of 3`, down ? 'bad' : 'dim'], ['ON THE LOAD BALANCER', out ? 'only pedidos-1' : '2 pods', 'dim']];
          o.ch = { type: 'clock', max: 20, now: down ? Math.min(s, 20) : null, segs: [[0, 15, 'until it leaves the load balancer: 15 s', 'bad', 0], [15, 20, 'pedidos-1 alone', 'acc', 1]], marks: [[5, '✗ 1'], [10, '✗ 2'], [15, '✗ 3']] }; } },
      { id: 'passiva', dur: 9, act: ['Bring the primary down', 'in passive redundancy'], title: 'Passive redundancy: one serves, the other waits', yk: 'PRIMARY AND PASSIVE', code: ['passive in Rio: WAL with 300 ms lag', 'expected RPO: 9.9/s × 0.3 s = 2.97 orders', 'promotion (Patroni): ttl 30 s + 5 s = 35 s', 'until then: writes stopped'],
        story: 'The database does not work that way. Only the primary, in SP, accepts writes; the passive, in Rio, receives the WAL with 300 ms of lag and waits. When the primary falls, someone has to notice and promote the passive: Patroni takes the 30 s ttl plus 5 s, 35 s. The passive is simpler than writing on both sides, but now everything depends on detection and promotion.',
        look: 'The WAL runs from the primary to the passive. The primary falls; the clock counts up to 35 s and the passive lights up as primary.',
        key: 'The passive trades data synchronization for the dependency on detecting and promoting.',
        f(o, t) { const s = clamp((t - 1) * 5, 0, 40), down = s > 0, prom = s >= 35;
          red(o, { cart: 'rrd', rd: true, pg: down ? 'bad' : 1, rep: prom ? 1 : 0, wal: !down, prom });
          o.cnt = [['CLOCK', dec(Math.min(s, 35), 0) + ' s', down && !prom ? 'bad' : 'acc'], ['WRITES', prom ? 'in Rio' : down ? 'stopped' : 'in SP', down && !prom ? 'bad' : 'dim'], ['LAG', '300 ms → RPO 2.97 orders', 'dim']];
          o.ch = { type: 'clock', max: 40, now: down ? s : null, segs: [[0, 30, 'leader key ttl: 30 s', 'bad', 0], [30, 35, '+5 s: promote', 'acc', 1]], marks: [[30, '30 s'], [35, '35 s']] }; } },
      { id: 'manual', dur: 9, title: 'If it goes wrong: promotion is manual', yk: 'WHO PRESSES THE BUTTON', code: ['automatic (Patroni): 35 s', 'human: someone wakes up, understands, decides', 'lesson 4 model: the decision alone, 5 min', 'the passive exists; nobody turns it on'],
        story: 'The article sums up the risk of the passive: if the failure is not detected fast, or if promotion is manual and slow, the unavailability is long. With promotion in a person\'s hands, someone has to wake up, understand and decide. In the lesson 4 model, the human decision alone takes 5 min, against Patroni\'s 35 s.',
        look: 'The primary fell and the passive waits, dark. The clock goes past 35 s and keeps counting.',
        key: 'A passive with no automatic, tested promotion is a copy nobody knows how to turn on.',
        f(o, t) { const s = clamp((t - 0.6) * 40, 0, 300);
          red(o, { cart: 'rrd', rd: true, pg: 'bad', rep: 0, wal: false });
          o.cnt = [['CLOCK', s < 60 ? dec(s, 0) + ' s' : `${Math.floor(s / 60)} min ${String(Math.floor(s % 60)).padStart(2, '0')} s`, 'bad'], ['WRITES', 'stopped', 'bad'], ['PASSIVE', 'waiting for someone', 'dim']];
          o.ch = { type: 'rows', title: 'UNTIL THE PASSIVE ACCEPTS WRITES', max: 300, mark: { v: 35, lab: '35 s' }, rows: [['Patroni', 35, '35 s', 'acc'], ['human', clamp(s, 0, 300), s >= 300 ? '5 min (decision only)' : dec(s, 0) + ' s…', 'bad']] };
          if (t > 2) T(o, [815, 315, 60], 'waiting for someone\nto promote', 'bad'); } },
    ],
    failover: [
      { id: 'pod', dur: 8, title: 'Detect a pod: 5 s × 3 = 15 s', yk: 'DETECT, DECIDE, SWITCH', code: ['health check: every 5 s', '3 failures in a row: 15 s', 'a single failure is not enough:', 'a blip does not remove the pod'],
        story: 'Automatic failover has three steps: detect, decide and switch. Each one has a clock. For a pod, the health check runs every 5 s, and the load balancer only removes the pod after 3 failures in a row: 15 s. A single failure is not enough, so that a blip does not take down a good pod.',
        look: 'In SP, pedidos-2 falls. The dial marks the three checks; on the third, the pod leaves.',
        key: 'Detecting is counting failures in a row: too fast takes down what is fine, too slow leaves the error in the air.',
        f(o, t) { const s = clamp((t - 0.8) * 3, 0, 20), out = s >= 15; fo(o, { p2: s > 0 ? 'bad' : 0 });
          o.cnt = [['CLOCK', dec(Math.min(s, 15), 0) + ' s', s > 0 && !out ? 'bad' : 'acc'], ['CHECKS', `${Math.min(3, Math.floor(s / 5))} ✗ of 3`, s > 0 ? 'bad' : 'dim'], ['POD', out ? 'out of the load balancer' : s > 0 ? 'fell, still receives' : 'ok', out ? 'dim' : s > 0 ? 'bad' : 'dim']];
          o.ch = { type: 'clock', max: 20, now: s > 0 ? s : null, segs: [[0, 15, 'detect the pod: 5 s × 3', 'bad', 0]], marks: [[5, '✗'], [10, '✗'], [15, '15 s']] }; } },
      { id: 'regiao', dur: 9, act: ['Bring SP down', '20:40:00.150'], title: 'Detect the region: 10 s × 3 = 30 s', yk: 'SYNTHETIC PROBES', code: ['one probe every 10 s, from Rio and Recife', '3 failures in a row: 30 s', 'quorum: 2 observers out of 3', '20:40:00.150 falls → 20:40:30 alert', 'MTTD = 30 s'],
        story: 'For a whole region, the watchers are synthetic probes, from outside: one every 10 s, seen from Rio and Recife. Three failures in a row give 30 s. On the night of the outage, SP falls at 20:40:00.150 and the alert fires at 20:40:30: the MTTD is 30 s. The decision is automatic, by quorum: 2 observers out of 3 have to agree (module 3).',
        look: 'SP\'s slab turns red. The Rio and Recife probes light up; SP\'s fell with the region. Two out of three agree.',
        key: 'A region is detected from outside, and the decision needs a majority so it does not depend on whoever fell.',
        f(o, t) { const s = clamp((t - 0.8) * 5, 0, 30); fo(o, { sp: s > 0 ? 'bad' : 0, obs: s > 0 ? Math.min(3, Math.floor(s / 10)) : 0 });
          o.cnt = [['CLOCK', '20:40:' + String(Math.floor(s)).padStart(2, '0'), s > 0 && s < 30 ? 'bad' : 'acc'], ['PROBES', `${Math.min(3, Math.floor(s / 10))} ✗ of 3`, s > 0 ? 'bad' : 'dim'], ['QUORUM', s >= 30 ? '2 of 3: SP out' : '…', s >= 30 ? 'bad' : 'dim']];
          o.ch = { type: 'clock', max: 70, now: s > 0 ? s : null, segs: [[0, 30, 'detect: 10 s × 3 (MTTD)', 'bad', 0]], marks: [[10, '✗'], [20, '✗'], [30, '30 s']] }; } },
      { id: 'promover', dur: 9, act: ['Promote Rio', 'ttl 30 s + 5 s'], title: 'Switch the database: 30 + 5 = 35 s', yk: 'THE LEADER KEY (PATRONI)', code: ['the primary renews the leader key', 'without renewing: expires at the ttl, 30 s', '+5 s: the Rio replica is promoted', '20:40:35: Rio accepts writes', 'the last 300 ms of WAL did not arrive'],
        story: 'Decided, what is left is to switch. The database leader is Patroni\'s (module 17): the SP primary has to renew the leader key; without renewing, the key expires at the 30 s ttl, and the Rio replica is promoted 5 s later. At 20:40:35 Rio accepts writes. What was in the WAL on its way, in the last 300 ms, did not arrive.',
        look: 'The SP primary is dark red. The clock goes past 30 s and the Rio replica lights up as primary.',
        key: 'Switching the database takes 35 s: the leader key ttl plus the promotion.',
        f(o, t) { const s = clamp((t - 0.5) * 6, 0, 40), prom = s >= 35; fo(o, { sp: 'bad', obs: 3, rep: prom ? 1 : 0 });
          o.cnt = [['CLOCK', '20:40:' + String(Math.floor(Math.min(s, 35))).padStart(2, '0'), prom ? 'acc' : 'bad'], ['PRIMARY', prom ? 'Rio' : 'none', prom ? 'acc' : 'bad'], ['LOST', 'the last 300 ms', 'dim']];
          o.ch = { type: 'clock', max: 70, now: s, segs: [[0, 30, 'detect (MTTD)', 'dim', 0], [0, 30, 'key ttl: 30 s', 'bad', 1], [30, 35, '+5 s', 'acc', 2]], marks: [[30, '30'], [35, '35 s']] }; } },
      { id: 'mapa', dur: 10, act: ['Flip the map', '5 s, not the DNS'], title: 'Flip the map: 5 s, not the DNS', yk: 'THE WHOLE CLOCK', code: ['0 s: SP falls · 30 s: alert (MTTD)', '35 s: Rio promoted (running since the outage)', '60 s: passive pods ready (30 + 30)', 'RTO = max(30 + 30, 35) + 5 = 65 s', 'MTTR 35 s (from alert to recovery)', 'DNS with 60 s TTL: up to 60 s more'],
        story: 'Last, the traffic has to find Rio. The edge-loja map flips in 5 s of propagation. A DNS with a 60 s TTL would leave clients up to 60 s on the old address; that is why the router decides, not only the DNS. The steps overlap: the database ttl runs from the outage and the promotion closes at 35 s, before detection (30 s) plus the pods (30 s). The map flips at 65 s: RTO = max(30 + 30, 35) + 5 = 65 s, and MTTR of 35 s.',
        look: 'The router, in Rio, switches the path: the light that went to SP now goes to the promoted replica.',
        key: 'RTO counts from the outage, not from the alert: the longest path (detect + pods) plus the map gives 65 s.',
        f(o, t) { const s = clamp(35 + (t - 0.5) * 7, 35, 70), flip = s >= 65; fo(o, { sp: 'bad', obs: 3, rep: 1, edge: flip ? 'rio' : 'sp' });
          o.cnt = [['CLOCK', s >= 60 ? '20:41:' + String(Math.floor(Math.min(s, 65) - 60)).padStart(2, '0') : '20:40:' + String(Math.floor(s)).padStart(2, '0'), flip ? 'acc' : 'bad'], ['RTO', flip ? '65 s' : '…', flip ? 'acc' : 'dim'], ['MTTR', flip ? '35 s (from alert to recovery)' : '…', 'dim']];
          o.ch = { type: 'clock', max: 70, now: s, segs: [[0, 30, 'detect (MTTD 30 s)', 'dim', 0], [30, 35, 'DB', 'acc', 1], [30, 60, 'passive pods', 'acc', 2], [60, 65, 'map', 'acc', 3]], marks: [[30, '30'], [65, 'RTO 65 s']] }; } },
      { id: 'split', dur: 10, act: ['Split the network', 'between SP and Rio'], title: 'If it goes wrong: SP isolated and alive', yk: 'SPLIT BRAIN', code: ['network SP × Rio: split; SP still up', 'Rio and Recife: "SP is gone" (2 of 3)', 'Rio promotes; SP keeps accepting', '30 s window × 9.9/s = 297 orders', 'pg_rewind on reconnect: discards the 297'],
        story: 'Now the bad case. The network between SP and Rio splits, but SP did not fall. From Rio and Recife, SP is gone: 2 observers out of 3 agree and Rio promotes the replica. In SP, the old primary keeps accepting orders from whoever can still reach it. There are two primaries. If the SP one only demotes itself when the key expires, the window is 30 s: 9.9 orders/s × 30 s = 297 confirmed orders that Rio never saw.',
        look: 'The red crack separates SP from Rio. Both databases stay lit as primary, and SP\'s counter climbs: orders confirmed on one side only.',
        key: 'The risk of automatic failover is promoting while the old one is still alive: two primaries.',
        f(o, t) { const s = clamp((t - 0.8) * 5, 0, 30), n = Math.round(9.9 * s); fo(o, { split: true, obs: 3, rep: 1, sp2: true });
          o.cnt = [['CONFIRMED ONLY IN SP', thou(n), n ? 'bad' : 'dim'], ['WINDOW', dec(s, 0) + ' of 30 s', 'dim'], ['PRIMARIES', '2', 'bad']];
          o.ch = { type: 'rows', title: 'ORDERS THAT pg_rewind DISCARDS', max: 2970, rows: [['30 s window', n, thou(n), 'bad'], ['5 min window', 0, '—', 'dim']] };
          if (t > 1) T(o, [250, 300, 60], `SP: ${thou(n)} orders\nthat Rio never saw`, 'bad'); } },
      { id: 'fencing', dur: 9, title: 'If fencing fails: 2,970 orders', yk: 'FENCING AND QUORUM', code: ['fencing: whoever does not renew the key demotes itself', 'only whoever has quorum promotes', 'with fencing at the ttl: 30 s window → 297', 'fencing fails, 5 min window → 2,970', 'automatic can take down what was fine'],
        story: 'The 297 orders have an owner: they were confirmed to SP customers. When the old primary comes back as a replica, pg_rewind (module 17) discards what Rio never saw. The fix is fencing: the leader that does not renew the key demotes itself, and only whoever has quorum promotes. If fencing fails and the window is 5 min, that is 2,970 orders.',
        look: 'The crack stays. SP\'s counter goes past 297 and reaches 2,970: the 5 min window.',
        key: 'Fencing and quorum limit the window; without them, automatic failover takes down what was fine.',
        f(o, t) { const s = clamp(30 + (t - 0.6) * 60, 30, 300), n = Math.round(9.9 * s); fo(o, { split: true, obs: 3, rep: 1, sp2: true });
          o.cnt = [['CONFIRMED ONLY IN SP', thou(n), 'bad'], ['WINDOW', s < 300 ? dec(s, 0) + ' s' : '5 min', 'bad'], ['NO FENCING', 'two primaries', 'bad']];
          o.ch = { type: 'rows', title: 'ORDERS THAT pg_rewind DISCARDS', max: 2970, rows: [['30 s window', 297, '297', 'dim'], ['5 min window', n, thou(n), 'bad']] };
          if (t > 1) T(o, [250, 300, 60], `SP: ${thou(n)} pedidos\nsem fencing`, 'bad'); } },
    ],
  };

  // ── peças de cada cenário ──
  function ponte(o, fall, t) {
    o.bridge = { fall };
    put(o, 'bankL', act('THE CITY', '', ['entrance: 1 bridge', 'dim'], fall > 0.5 ? ['cut off', 'bad'] : ['everything goes over the bridge', 'dim']), fall > 0.5 ? 'bad' : 0);
    put(o, 'bankR', act('THE REST OF THE WORLD', '', ['roads, hospital, food', 'dim']), 0);
    if (fall < 0.5) { o.cars = true; T(o, [410, 186, 60], 'the only bridge', 'acc'); }
    else { o.ferry = true; o.queue = true; }
  }
  // o checkout: Lena → pedidos → pagamentos → PSP-A (e o PSP-B)
  function checkout(o, t, aDown, withB) {
    put(o, 'cped', act('pedidos', '≥ 2 pods', ['POST /pedidos', 'dim'], ['1060 · Lena', 'acc']), 0);
    put(o, 'cpag', act('pagamentos', '2 pods', ['charges at the PSP', 'dim'], [withB ? 'PSP-A → PSP-B' : 'PSP-A only', withB ? 'acc' : 'bad']), aDown && !withB ? 'bad' : withB ? 1 : 0);
    put(o, 'psA', act('PSP-A', '99.9%', [aDown ? 'down' : 'up', aDown ? 'bad' : 'dim']), aDown ? 'bad' : 1);
    if (withB) put(o, 'psB', act('PSP-B', '99.9%', ['takes over the charge', 'acc']), 1);
    const y = 225, toA = P3([[480, y], [540, y], [540, 135], [600, 135]]), toB = P3([[540, y], [540, 335], [600, 335]]);
    o.beams.push({ pts: P3([[4, y], [40, y]]), on: true, n: 1 }, { pts: P3([[220, y], [290, y]]), on: true, n: 1 });
    o.beams.push({ pts: toA, on: !aDown, tone: aDown ? 'bad' : '', n: 1 });
    if (withB) o.beams.push({ pts: toB, on: true, n: 2 });
    const z = PL + 26 + 12, path = [[4, y, z], [130, y, z], [385, y, z], ...(withB ? [[540, y, z], [540, 335, z], [715, 335, z]] : aDown ? [] : [[540, y, z], [540, 135, z], [715, 135, z]])];
    const stop = aDown && !withB, f = stop ? clamp(t / 2.4) : (t / 5) % 1;
    o.tok = { pts: path, f, tone: stop && f >= 1 ? 'bad' : '', lab: stop && f >= 1 ? 'Lena · 1060\nno payment' : 'Lena · 1060' };
  }
  function edges(o, t, bad) {
    ['SP', 'Rio', 'Recife'].forEach((r, i) => put(o, 'ed' + i, act('edge-loja', r, ['code v1', 'dim'], [bad ? 'bad map: down' : 'map ok', bad ? 'bad' : 'dim']), bad ? 'bad' : 1));
    put(o, 'emap', act('map', '1 publication', [bad ? 'bad version' : 'good version', bad ? 'bad' : 'acc'], ['goes to all 3', 'dim']), bad ? 'bad' : 1);
    const tone = t > 1 ? 'bad' : '', bus = P3([[840, 140], [840, 196], [150, 196]]);
    o.beams.push({ pts: bus, on: true, tone, n: 0 });
    [150, 390, 630].forEach(x => o.beams.push({ pts: P3([[x, 196], [x, 220]]), on: true, tone, n: 0 }));
    if (t > 1 && t < 2.6) for (let j = 0; j < 3; j++) { const pts = P3([[840, 140], [840, 196], [[150, 390, 630][j], 196], [[150, 390, 630][j], 220]], ZR + 4); dot(alongPts(pts, cumLen(pts), clamp((t - 1) / 1.4)), 'bad'); }
  }
  // redundância: balanceador → pods → Redis; o primário em SP e a passiva no Rio
  function red(o, s) {
    put(o, 'rlb', act('load balancer', '', ['checks every 5 s', 'dim']), 1);
    put(o, 'rp1', act('pedidos-1', 'pod', [s.rd ? 'stateless' : 'without the session', 'dim']), 0);
    put(o, 'rp2', act('pedidos-2', 'pod', [s.p2 === 'bad' ? 'fell' : s.rd ? 'stateless' : 'Lena\'s session', s.p2 === 'bad' ? 'bad' : s.rd ? 'dim' : 'acc']), s.p2 || 0);
    if (s.rd) put(o, 'rrd', act('Redis', 'cart', ['the session lives here', 'acc']), s.hotData ? 1 : 0);
    if (s.pg) put(o, 'rpg', act('PostgreSQL', 'SP', [s.pg === 'bad' ? 'primary: down' : 'primary', s.pg === 'bad' ? 'bad' : 'dim']), s.pg === 'bad' ? 'bad' : s.hotData || s.pg === 1 ? 1 : 0);
    if (s.rep !== undefined) put(o, 'rrep', act('PostgreSQL', 'Rio', [s.rep ? 'promoted: primary' : 'passive: waiting', s.rep ? 'acc' : 'dim'], ['lag 300 ms', 'dim']), s.rep ? 1 : 0);
    const y = 225;
    o.beams.push({ pts: P3([[160, y], [190, y], [190, 133], [220, 133]]), on: true, n: 1 });
    o.beams.push({ pts: P3([[190, y], [190, 313], [220, 313]]), on: s.p2Beam !== 'off' && s.p2 !== 'bad' || s.p2Beam === 'bad', tone: s.p2Beam === 'bad' || (s.p2 === 'bad' && !s.rd) ? 'bad' : '', n: 1 });
    if (s.rd) { o.beams.push({ pts: P3([[380, 133], [460, 133]]), on: true, n: 1 }); if (s.p2 !== 'bad') o.beams.push({ pts: P3([[380, 313], [420, 313], [420, 133]]), on: true, n: 1 }); }
    if (s.pg) o.beams.push({ pts: P3([[300, 166], [300, 200], [550, 200], [550, 280]]), on: s.pg !== 'bad', tone: s.pg === 'bad' ? 'bad' : '', n: 1 });
    if (s.rep !== undefined) o.beams.push({ pts: P3([[640, 315], [720, 315]]), on: !!s.wal, n: s.wal ? 2 : 0, sp: 0.8 });
    if (s.prom) o.beams.push({ pts: P3([[550, 200], [815, 200], [815, 280]]), on: true, n: 1 });
    o.cart = s.cart;
  }
  // failover: SP, Rio e Recife; pods, bancos, roteador e sondas
  function fo(o, s) {
    const spDown = s.sp === 'bad';
    put(o, 'fsp', act('SÃO PAULO', 'region', [spDown ? 'down' : s.split ? 'up, isolated' : 'up', spDown || s.split ? 'bad' : 'dim']), spDown ? 'bad' : 0);
    put(o, 'frio', act('RIO', 'region', ['up', 'dim']), 0);
    put(o, 'frec', act('RECIFE', '', ['up', 'dim']), 0);
    put(o, 'fp1', act('pedidos-1', 'pod', [spDown ? 'out' : 'ok', spDown ? 'bad' : 'dim']), spDown ? 'bad' : 0);
    put(o, 'fp2', act('pedidos-2', 'pod', [s.p2 === 'bad' || spDown ? 'fell' : 'ok', s.p2 === 'bad' || spDown ? 'bad' : 'dim']), s.p2 === 'bad' || spDown ? 'bad' : 0);
    put(o, 'fpg', act('PostgreSQL', 'SP', [spDown ? 'primary: out' : s.sp2 ? 'primary (still accepts)' : 'primary', spDown || s.sp2 ? 'bad' : 'acc']), spDown ? 'bad' : s.sp2 ? 'bad' : 1);
    put(o, 'frep', act('PostgreSQL', 'Rio', [s.rep ? 'promoted: primary' : 'replica (lag 300 ms)', s.rep ? 'acc' : 'dim']), s.rep ? 1 : 0);
    put(o, 'fedg', act('edge-loja', 'map', [s.edge === 'rio' ? 'cell sp → Rio' : 'cell sp → SP', s.edge === 'rio' ? 'acc' : 'dim']), s.edge === 'rio' ? 1 : 0);
    const ob = s.obs || 0;
    put(o, 'foSP', act('probe', 'SP', [spDown ? 'fell with it' : s.split ? '"SP ok"' : 'ok', spDown ? 'bad' : 'dim']), spDown ? 'bad' : 0);
    put(o, 'foRio', act('probe', 'Rio', [ob ? `SP: ${ob} ✗ of 3` : 'SP ok', ob ? 'bad' : 'dim']), ob >= 3 ? 1 : 0);
    put(o, 'foRec', act('probe', 'Recife', [ob ? `${ob} ✗` : 'ok', ob ? 'bad' : 'dim']), ob >= 3 ? 1 : 0);
    // replicação SP → Rio (WAL), e o tráfego da célula sp
    o.beams.push({ pts: P3([[310, 252], [518, 252]], RZ + 12), on: !spDown && !s.split, tone: s.split ? 'bad' : '', n: !spDown && !s.split ? 2 : 0, sp: 0.8 });
    const toSP = P3([[642, 112], [642, 92], [140, 92], [140, 112]], RZ + 12), toRio = P3([[700, 174], [700, 214]], RZ + 12);
    if (s.edge === 'rio') o.beams.push({ pts: toRio, on: true, n: 2 }); else o.beams.push({ pts: toSP, on: !spDown, tone: spDown ? 'bad' : '', n: spDown ? 0 : 2 });
    o.beams.push({ pts: P3([[140, 174], [140, 214]], RZ + 12), on: !spDown && s.p2 !== 'bad', n: spDown ? 0 : 1 }, { pts: P3([[352, 174], [352, 194], [180, 194], [180, 214]], RZ + 12), on: !spDown && s.p2 !== 'bad', tone: s.p2 === 'bad' ? 'bad' : '', n: s.p2 === 'bad' || spDown ? 0 : 1 });
    if (s.split) { o.cut = true; o.beams.push({ pts: P3([[700, 174], [700, 214]], RZ + 12), on: true, n: 1 }); }
  }

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
  const sqOff = () => theme === 'light' ? '#d4d6d6' : '#2a2c2e';
  function drawBlock(Bk, d, on) {
    const key = JSON.stringify([d, on]) + theme + accent.getHex(); if (Bk.key === key) return; Bk.key = key;
    const cv = Bk.top, lit_ = on === 1 || on === 2, { x, u, C } = frameBox(cv, lit_, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P, H_ = cv.c.height / cv.P;
    const col = on === 'bad' ? BAD() : on === 1 ? accC() : on === 'off' ? INK() : C.inkHi, big = Bk.kind === 'slab' || Bk.kind === 'land';
    // nome à esquerda, detalhe à direita, na primeira linha
    x.textAlign = 'left'; x.fillStyle = col; const s1 = big ? 15 : 12.5; fitFont(x, u, d.name, s1, d.meta ? W_ * 0.62 : W_ - 10); x.fillText(d.name, u(5), u(big ? 13 : 10.5));
    const nw = x.measureText(d.name).width / u(1);
    if (d.meta) { x.textAlign = 'right'; x.fillStyle = INK(); fitFont(x, u, d.meta, 9.6, W_ - nw - 14); x.fillText(d.meta, u(W_ - 5), u(big ? 13 : 10.5)); x.textAlign = 'left'; }
    const yl = big ? 24 : 20; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(4), u(yl)); x.lineTo(u(W_ - 4), u(yl)); x.stroke();
    let y = yl + 11; for (const [text, tnn] of d.rows || []) { x.fillStyle = toneC(tnn); fitFont(x, u, text, big ? 12 : 10.8, W_ - (d.sq ? 44 : 10)); x.fillText(text, u(5), u(y)); y += big ? 16 : 14; }
    // as cópias: um quadradinho por cópia, embaixo à direita
    if (d.sq) { const n = d.sq.n, sz = 9; for (let i = 0; i < 3; i++) { x.fillStyle = i < n ? toneC(d.sq.tone === 'dim' ? 'hi' : d.sq.tone) : sqOff();
      x.fillRect(u(W_ - 5 - (3 - i) * (sz + 2)), u(H_ - 5 - sz), u(sz), u(sz)); } }
    cv.tex.needsUpdate = true;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const s = cur(), ch = o.ch;
    const key = JSON.stringify([o.cnt, ch, s.id, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), Wd = cv.c.width / P, Hd = cv.c.height / P;
    x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const txt = (t, X, Y, size, mw, col, al = 'left') => { x.textAlign = al; x.fillStyle = col; fitFont(x, u, t, size, mw); x.fillText(t, u(X), u(Y)); x.textAlign = 'left'; };
    const tone = t => t === 'bad' ? BAD() : t === 'acc' ? acc : t === 'dim' ? INK() : C.inkHi;
    // coluna da esquerda: os números do passo
    const L0 = 150;
    txt(SCFULL[sc].toUpperCase(), 8, 9, 8, 136, INK());
    o.cnt.slice(0, 4).forEach(([l, v, tn_], i) => { const Y = 26 + i * 27; txt(l, 8, Y, 7.6, 136, INK()); txt(v, 8, Y + 11, i ? 10.4 : 12.5, 136, i ? tone(tn_ || 'hi') : tone(tn_ || 'acc')); });
    x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 6), u(6)); x.lineTo(u(L0 - 6), u(Hd - 6)); x.stroke();
    const R = Wd - 8, AW = R - L0;
    if (!ch) {   // sem gráfico: a conta do passo
      txt(s.yk || 'THE MATH', L0, 10, 8.4, AW, INK());
      s.code.slice(0, 6).forEach((l, i) => txt(l, L0, 26 + i * 15, 9.2, AW, C.inkHi));
    } else if (ch.type === 'rows') {
      txt(ch.title, L0, 10, 8.4, AW, INK());
      const lw = 70, bx = L0 + lw, bw = AW - lw, rh = Math.min(26, (Hd - 34) / ch.rows.length);
      if (ch.mark) { const mx = bx + bw * ch.mark.v / ch.max; x.setLineDash([u(2.5), u(2)]); x.strokeStyle = INK(); x.lineWidth = u(0.8);
        x.beginPath(); x.moveTo(u(mx), u(20)); x.lineTo(u(mx), u(26 + rh * ch.rows.length)); x.stroke(); x.setLineDash([]);
        txt(ch.mark.lab, mx + 3, 20, 7.6, 40, INK()); }
      ch.rows.forEach(([l, v, tx, tn_], i) => { const Y = 32 + i * rh + rh * 0.3, col = tone(tn_), fr = clamp(v / ch.max);
        txt(l, L0, Y, 8.6, lw - 4, INK());
        x.fillStyle = sqOff(); x.fillRect(u(bx), u(Y - 6), u(bw), u(12));
        x.fillStyle = col; x.fillRect(u(bx), u(Y - 6), u(Math.max(fr ? 1 : 0, bw * fr)), u(12));
        const inside = fr > 0.55; txt(tx, inside ? bx + 4 : bx + bw * fr + 4, Y, 8.8, inside ? bw * fr - 8 : bw * (1 - fr) - 6, inside ? (theme === 'light' ? '#f6f6f5' : '#141516') : col); });
    } else if (ch.type === 'elos') {
      // minutos fora por mês de cada elo: os SPoFs são as barras altas
      txt('MINUTES OUT PER MONTH, PER LINK', L0, 10, 8.4, AW - 70, INK()); txt('total ' + minTxt(ch.total), R, 10, 9, 70, ch.total > 1 ? BAD() : acc, 'right');
      const X0 = L0 + 4, cw = (AW - 6) / 12, B0 = 26, B1 = 108;
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(X0 - 2), u(B1)); x.lineTo(u(R), u(B1)); x.stroke();
      ch.vals.forEach((v, i) => { const h = clamp(v / 45) * (B1 - B0), col = ch.tones[i] === 'bad' ? BAD() : ch.tones[i] === 'acc' ? acc : INK(), X = X0 + i * cw;
        x.fillStyle = col; x.fillRect(u(X + cw * 0.18), u(B1 - Math.max(h, 0.8)), u(cw * 0.64), u(Math.max(h, 0.8)));
        txt(String(i + 1), X + cw / 2, B1 + 7, 8, cw, ch.tones[i] === 'bad' ? BAD() : INK(), 'center');
        if (v >= 1) txt(dec(v, 1), X + cw / 2, B1 - Math.max(h, 0.8) - 6, 7.4, cw, v >= 1 ? col : INK(), 'center'); });
      txt('each SPoF: 43.2 · each link with a pair: 0.04', L0, Hd - 6, 7.6, AW, INK());
    } else if (ch.type === 'clock') {
      txt('THE CLOCK (SECONDS)', L0, 10, 8.4, AW, INK());
      const X0 = L0 + 4, X1 = R - 4, px = v => X0 + clamp(v / ch.max) * (X1 - X0), rows = Math.max(...ch.segs.map(sg_ => sg_[4])) + 1, rh = Math.min(20, 78 / rows), Y0 = 26, YA = Y0 + rows * rh + 6;
      x.strokeStyle = C.line; x.lineWidth = u(0.5); x.beginPath(); x.moveTo(u(X0), u(YA)); x.lineTo(u(X1), u(YA)); x.stroke();
      const stp = ch.max > 40 ? 10 : 5; for (let v = 0; v <= ch.max; v += stp) { x.beginPath(); x.moveTo(u(px(v)), u(YA)); x.lineTo(u(px(v)), u(YA + 2.5)); x.stroke(); txt(String(v), px(v), YA + 8, 7.6, 20, INK(), 'center'); }
      ch.segs.forEach(([a, b, lab, tn_, r]) => { const Y = Y0 + r * rh + rh / 2, col = tone(tn_), lit = ch.now == null || ch.now >= a, w = lit ? (ch.now == null ? b : Math.min(b, ch.now)) : a;
        x.fillStyle = sqOff(); x.fillRect(u(px(a)), u(Y - 5), u(px(b) - px(a)), u(10));
        if (lit) { x.fillStyle = col; x.fillRect(u(px(a)), u(Y - 5), u(px(w) - px(a)), u(10)); }
        const right = px(b) + 3, roomR = X1 - right; if (roomR > 70) txt(lab, right, Y, 8.4, roomR, lit ? col : INK()); else txt(lab, px(a) - 3, Y, 8.4, px(a) - X0 - 4, lit ? col : INK(), 'right'); });
      (ch.marks || []).forEach(([v, lab]) => { const X = px(v); x.setLineDash([u(1.5), u(1.5)]); x.strokeStyle = INK(); x.lineWidth = u(0.7);
        x.beginPath(); x.moveTo(u(X), u(Y0 - 4)); x.lineTo(u(X), u(YA)); x.stroke(); x.setLineDash([]); txt(lab, X, YA + 17, 7.8, 50, C.inkHi, X > X1 - 20 ? 'right' : 'center'); });
      if (ch.now != null) { const X = px(ch.now); x.strokeStyle = acc; x.lineWidth = u(1.4); x.beginPath(); x.moveTo(u(X), u(Y0 - 6)); x.lineTo(u(X), u(YA + 2)); x.stroke(); }
    }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const on_ = b => b ? ' class="on"' : '';
  const DATA = {
    ponte: () => `<table class="h3-sum"><tr><th>case</th><th>available</th><th>out/month</th></tr><tr${on_(step === 2)}><td>PSP-A only</td><td>99.9%</td><td>43.2 min</td></tr><tr${on_(step === 3)}><td>PSP-A + PSP-B</td><td>99.9999%</td><td>2.6 s</td></tr><tr${on_(step === 4)}><td>3 edge-loja, common mode</td><td>99.9%</td><td>43.2 min</td></tr><tr><td>3 independent</td><td>99.9999999%</td><td>~0</td></tr></table><li>30-day month = 43,200 min; 99.9% leaves 43.2 min out</li><li>The city bridge is the article\'s analogy; boat, ferry and helicopter are the degraded mode</li><li>SPoFs the store already removed: PSP-B (module 21), pods in pairs, the passive (module 26), the router on 3 instances</li><li>Fix for common mode: publish the map in rings and keep the "last good" one</li>`,
    mapa: () => `<table class="h3-sum"><tr><th>#</th><th>link</th><th>copies</th><th>SPoF?</th></tr>${ELOS.map((e, i) => `<tr${on_(SPOFS.includes(i) && step >= 1)}><td>${i + 1}</td><td>${e[0]}</td><td>${e[2]}</td><td>${e[5] === 'spof' ? 'yes' : e[5] === 'logico' ? 'yes, logical' : e[5] === 'parcial' ? 'partial' : 'no'}</td></tr>`).join('')}</table><li>In series, 12 links at 99.9%: 0.999¹² = <b>98.8066%</b> (515.6 min/month)</li><li>5 SPoFs and 7 with a pair: 0.999⁵ × 0.999999⁷ = <b>99.5003%</b> (215.9 min/month)</li><li>Everything with a pair: 0.999999¹² = <b>99.9988%</b> (0.52 min/month)</li><li>The math assumes independent failures; edge-loja (same code, same map) is not</li><li>The SPoF this audit does not find: the SP hub, which holds the passives of 3 cells (lesson 4)</li>`,
    redundancia: () => `<table class="h3-sum"><tr><th>type</th><th>who serves</th><th>the price</th></tr><tr${on_(step === 2)}><td>active</td><td>all copies</td><td>syncing the data</td></tr><tr${on_(step >= 3)}><td>passive</td><td>one; the other waits</td><td>detecting and promoting</td></tr></table><li>Health check every 5 s, 3 failures: <b>15 s</b> to remove a pod</li><li>Database promotion (Patroni, module 17): ttl 30 s + 5 s = <b>35 s</b></li><li>celula-sp passive in Rio, lag 300 ms: 9.9 × 0.3 = <b>2.97 orders</b> of expected RPO</li><li>The 5 min human decision is the lesson 4 model, not a measurement</li>`,
    failover: () => `<table class="h3-sum"><tr><th>step</th><th>clock</th><th>when (SP outage)</th></tr><tr${on_(step === 0)}><td>detect pod</td><td>5 s × 3 = 15 s</td><td>—</td></tr><tr${on_(step === 1)}><td>detect region</td><td>10 s × 3 = 30 s</td><td>20:40:30</td></tr><tr${on_(step === 2)}><td>switch the database</td><td>30 + 5 = 35 s</td><td>20:40:35</td></tr><tr${on_(step === 3)}><td>passive pods</td><td>30 s per pod</td><td>20:41:00</td></tr><tr${on_(step === 3)}><td>flip the map</td><td>5 s</td><td>20:41:05</td></tr></table><li>RTO = max(detection 30 s + pods 30 s, database 35 s) + map 5 s = <b>65 s</b>, counted from the outage (20:40:00.150); MTTD 30 s + MTTR 35 s</li><li>Split brain at 9.9 orders/s: 30 s → <b>297</b>; 5 min → <b>2,970</b> orders that <code>pg_rewind</code> discards</li><li>Fencing: the leader that does not renew the key within the <code>ttl</code> demotes itself; quorum of 2 of 3 (module 3)</li><li>A real regional failover was not run: the node and pod times are a model</li>`,
  };
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  function countHtml() { const o = SP || spec(), c = o.cnt;
    if (!c.length) return ''; const [l0, v0] = c[0];
    return `<b>${esc(v0)}</b><span>${esc(l0.toLowerCase())}</span>${c.slice(1).map(([l, v]) => `<i>· ${esc(l.toLowerCase())}: ${esc(v)}</i>`).join('')}`; }
  function actHtml() { const nx = L()[step + 1], a = nx && nx.act; if (!a) return '';
    return `<div class="o3-mode r3-act"><button data-q3="next">${a[0]} →<small>${a[1]}</small></button></div>`; }
  // passo "duplicar": um botão por SPoF
  const DUPN = { 0: 'DNS', 1: 'certificate', 2: 'edge-loja', 3: 'identity', 11: 'map' };
  function dupHtml() { if (cur().id !== 'duplicar') return '';
    return `<div class="o3-mode s3-dup" role="group" aria-label="Duplicate a SPoF">${SPOFS.map(i => `<button data-dup="${i}" aria-pressed="${dup.has(i)}">${DUPN[i]}</button>`).join('')}</div>`; }
  function codeOf(s) { if (s.id !== 'duplicar') return s.code;
    const m = minMes(ELOS.map((e, i) => SPOFS.includes(i) && !dup.has(i) ? A1 : A2));
    return [...SPOFS.map(i => `${i + 1} · ${DUPN[i]}: ${dup.has(i) ? ELOS[i][6] : 'no pair'}`), `→ ${minTxt(m)} min/month (${pctTxt(1 - m / MES)})`]; }
  function panelHtml() {
    const s = cur();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      ${actHtml()}${dupHtml()}
      <div class="i3-count" id="f3count">${countHtml()}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <div class="i3-sql" id="f3code"><b>${esc(s.yk || 'The math')}</b>${esc(codeOf(s).join('\n'))}</div>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'spof') return; const o = SP || spec(), c = o.cnt[0];
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${c ? c[0].toLowerCase() + ': ' + c[1] : ''}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'spof' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => { dup = new Set(); return go(0); };
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-spof3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  // duplica (ou desfaz) um SPoF e atualiza só o que muda no painel, sem perder o foco do botão
  function toggleDup(i) { dup.has(i) ? dup.delete(i) : dup.add(i); SFX.bit(1);
    SP = spec(); const info = document.getElementById('info'); if (!info) return true;
    info.querySelectorAll('[data-dup]').forEach(b => b.setAttribute('aria-pressed', dup.has(+b.dataset.dup)));
    const c = document.getElementById('f3code'); if (c) c.innerHTML = `<b>${esc(cur().yk)}</b>${esc(codeOf(cur()).join('\n'))}`;
    cntKey = ''; return true; }
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'spof') return;
    const b = e.target.closest('[data-sc]'); if (b) return setSc(b.dataset.sc);
    const d = e.target.closest('[data-dup]'); if (d) return toggleDup(+d.dataset.dup);
    if (e.target.closest('[data-q3]')) next(); });
  backLink();

  // ── um quadro da cena ──
  const cartMat = capMat(); twCaps.push(cartMat); cartMat.emissiveIntensity = 1.2;
  const CART = new THREE.Group(); g0.add(CART); rbox(-9, -7, 0, 18, 14, 12, 3, cartMat, CART, { lines: false }); CART.visible = false;
  const cartGlow = glowPoints([W(0, 0, 0)], 0.35); g0.add(cartGlow);
  let cartP = null;
  function scene3(dt) {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], want = o.show[nm] ? 1 : 0;
      Bk.f += Math.sign(want - Bk.f) * Math.min(Math.abs(want - Bk.f), dt / 0.55);
      const e = ease(clamp(Bk.f)); Bk.g.visible = Bk.f > 0.01;
      if (Bk.g.visible) Bk.g.position.copy(W(Bk.pos[0], Bk.pos[1], Bk.z0 - (1 - e) * (Bk.h + 3)));
      const on = o.on[nm] || 0; if (Bk.g.visible && o.rows[nm]) drawBlock(Bk, o.rows[nm], on);
      Bk.mat.emissive.copy(on === 'bad' ? badEm : accent);
      Bk.mat.emissiveIntensity = on === 'bad' ? 0.3 : on === 1 ? 0.3 : on === 2 ? 0.1 : 0;
      moveGlow(Bk.glow, [Bk.pos[0] + Bk.w / 2, Bk.pos[1] + Bk.d / 2, Bk.z0 + Bk.h + 3], on === 1 && Bk.f > 0.9 ? 0.3 : 0);
      // as cópias saem de trás da peça
      Bk.gh.forEach(G => { const wantG = want && (o.gh[nm] || 0) >= G.k ? 1 : 0; G.f += Math.sign(wantG - G.f) * Math.min(Math.abs(wantG - G.f), dt / 0.5);
        const eg = ease(clamp(G.f)) * e; G.g.visible = G.f > 0.01 && Bk.g.visible;
        if (G.g.visible) G.g.position.copy(W(Bk.pos[0], Bk.pos[1] - 14 * G.k * eg, Bk.z0 - (1 - e) * (Bk.h + 3) - 0.4 * G.k));
        G.mat.emissive.copy(on === 'bad' ? badEm : accent); G.mat.emissiveIntensity = on === 'bad' ? 0.2 : 0.07; }); });
    nDot = 0; setBeams(o.beams);
    // a ponte: a pista afunda, os carros param, a balsa vai e volta
    gP.visible = !!o.bridge;
    if (o.bridge) { const f = o.bridge.fall; deck.position.copy(W(292, 202, 23 - 22 * f)); deck.rotation.z = -0.16 * f; deck.rotation.x = 0.05 * f;
      deckMat.emissive.copy(f > 0.2 ? badEm : accent); deckMat.emissiveIntensity = f > 0.2 ? 0.45 : 0.08;
      if (o.cars) for (let j = 0; j < 3; j++) { dot([292 + 236 * ((clk * 0.22 + j / 3) % 1), 210, 37], ''); dot([528 - 236 * ((clk * 0.22 + j / 3 + 0.17) % 1), 226, 37], ''); }
      ferry.visible = !!o.ferry; if (o.ferry) { const p = (clk * 0.12) % 2, fx = p < 1 ? ease(p) : ease(2 - p), X = 300 + fx * 176; ferry.position.copy(W(X - 300, 0, 0)); ferry.position.add(W(300, 330, PL - 3)); dot([X + 12, 342, PL + 14], ''); }
      if (o.queue) for (let j = 0; j < 4; j++) dot([262 - j * 16, 218, PL + 24], 'bad'); }
    for (let i = nDot; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
    // a ficha da Lena
    if (o.tok) { const p = alongPts(o.tok.pts, cumLen(o.tok.pts), clamp(o.tok.f)); TOK.visible = true; TOK.position.copy(W(...p));
      tokMat.emissive.copy(o.tok.tone === 'bad' ? badEm : accent); moveGlow(tokGlow, p, o.tok.tone === 'bad' ? 0.6 : 1);
      if (o.tags.length < 3) o.tags.push([p[0], p[1], p[2] + 22, o.tok.lab, o.tok.tone === 'bad' ? 'bad' : 'acc']); }
    else { TOK.visible = false; tokGlow.material.uniforms.intensity.value = 0; }
    // o carrinho: em cima do pod ou do Redis
    if (o.cart) { const Bk = B[o.cart], tgt = [Bk.pos[0] + Bk.w - 22, Bk.pos[1] + Bk.d / 2, Bk.z0 + Bk.h + 1];
      if (!cartP || !CART.visible) cartP = tgt.slice(); else cartP = cartP.map((v, i) => v + (tgt[i] - v) * Math.min(1, dt * 3));
      CART.visible = true; CART.position.copy(W(...cartP)); moveGlow(cartGlow, [cartP[0], cartP[1], cartP[2] + 8], 0.7); }
    else { CART.visible = false; cartGlow.material.uniforms.intensity.value = 0; }
    cut.visible = !!o.cut; if (o.cut) cut.scale.y = (10 + 4 * Math.sin(clk * 6)) * TS;
    drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3(dt);
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('f3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [0, 950, 8, 470];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn_ = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth, ctl = POSTER ? 0 : 205 / innerWidth;
      const aW = POSTER ? 0.86 : nar ? 0.99 : 0.98 - side - ctl, aH = POSTER ? 0.76 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.05 / (2 * tn_ * asp * aW), (span * 0.33 + 170) / 100 * 1.05 / (2 * tn_ * aH)) * (nar || POSTER ? 1 : 0.88);
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.47 : nar ? 0.07 + aH * 0.6 : 0.55;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 70), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn_ * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn_);
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
    if (/^[1-4]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  // no passo "duplicar", clicar numa peça da esteira que é SPoF dá um par a ela; fora disso, o clique avança
  function click(hit) {
    let ob = hit && hit.object; while (ob && !ob.userData.nm) ob = ob.parent;
    const nm = ob && ob.userData.nm, i = nm && /^e\d+$/.test(nm) ? +nm.slice(1) : -1;
    if (sc === 'mapa' && cur().id === 'duplicar') { if (SPOFS.includes(i)) toggleDup(i); else if (!hit) next(); return; }
    next();
  }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.map(nm => B[nm].top), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); cutMat.color.set(BAD()); });
  // começa com cada peça já no lugar do cenário (sem subir na abertura)
  { const o = spec(); NAMES.forEach(nm => { B[nm].f = o.show[nm] ? 1 : 0; B[nm].gh.forEach(G => { G.f = o.show[nm] && (o.gh[nm] || 0) >= G.k ? 1 : 0; }); }); }
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(475, 240, -150), dist: innerWidth < 640 ? 15.5 : 18.5 } : { target: W(190, 240, 60), dist: 17 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–4 · drag to rotate' };
})() });
