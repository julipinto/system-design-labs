// Figura 3D (iso-glow): o balanceador de carga. A loja na Black Friday: o lb-loja (203.0.113.10) na frente das réplicas do
// catálogo (catalogo-1/2/3, 10.0.1.11–13:8080; o catalogo-4, 10.0.1.14, entra quando a história pede). A fila de 9 pedidos
// (P1 Lena gato · P2 Bia busca · … · P9 Lena gato) chega pela esquerda e cada algoritmo decide para onde vai cada pacote
// (gato pequeno, 20 ms; busca grande, 900 ms). Ao fundo, o mostrador com a fila e a regra; em cima de cada réplica, o contador
// do algoritmo (pedidos, conexões, pendentes) e a barra de trabalho; ao lado, a coluna de carga.
// Cenários (toggle e ?mode=sem|health|rr|lr|lc|lor|hash|random; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/load-balancers-brief.md).
FIGS3D.push({ id: 'lb', name: 'Load balancer', mod: (() => {
  const NARROW = () => innerWidth < 900 || document.documentElement.classList.contains('embedded');
  const POSTER = /[?&]poster\b/.test(location.search);
  const g0 = new THREE.Group(); g0.visible = false; scene.add(g0);
  const first = twMeshes.length;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = f => f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
  const lerp3 = (a, b, f) => a.map((v, i) => v + (b[i] - v) * f);
  // cores de texto: no claro, versões bem escuras (o pixel na tela precisa dar ≥ 4.5:1 depois da textura reduzida)
  const INK = () => theme === 'light' ? '#33373a' : pal3().ink;
  const BAD = () => theme === 'light' ? '#a61f14' : '#ff5a4a';
  const accC = () => theme === 'light' ? '#5e2c00' : '#' + accent.getHexString();
  const toneC = tn => tn === 'bad' ? BAD() : tn === 'acc' ? accC() : tn === 'dim' ? INK() : pal3().inkHi;
  const nf = n => Math.round(n).toLocaleString('en-US');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const REP = [['catalogo-1', '10.0.1.11'], ['catalogo-2', '10.0.1.12'], ['catalogo-3', '10.0.1.13'], ['catalogo-4', '10.0.1.14']].map(([n, ip]) => ({ n, ip }));
  // h: o número do exemplo para o IP hash (os dois últimos números do IP: 20 × 256 + 5 = 5125)
  const CLI = { L: { n: 'Lena', city: 'Recife', ip: '177.38.20.5', h: 5125 }, B: { n: 'Bia', city: 'SP', ip: '189.6.44.10', h: 11274 },
    C: { n: 'Caio', city: 'Rio', ip: '200.150.7.33', h: 1825 }, D: { n: 'Davi', city: 'SP', ip: '187.11.90.2', h: 23042 } };
  const KIND = { g: { lab: 'cat', path: 'GET /produtos/42', ms: 20 }, b: { lab: 'search', path: 'GET /busca?q=pelucia&ordem=preco', ms: 900 } };
  const Q = 'Lg Bb Cg Dg Lb Bg Cg Db Lg'.split(' ').map((s, i) => ({ p: 'P' + (i + 1), c: s[0], k: s[1] }));
  const SEQ = { zero: [0, 0, 0, 0, 0, 0, 0, 0, 0], rr: [0, 1, 2, 0, 1, 2, 0, 1, 2], peso: [0, 1, 2, 2, 0, 1, 2, 2, 0], qt: [0, 0, 1, 1, 2, 2, 0, 0, 1],
    hash: Q.map(q => CLI[q.c].h % 3), rnd: [1, 0, 1, 2, 1, 1, 2, 0, 1, 2] };
  const SC = ['sem', 'health', 'rr', 'lr', 'lc', 'lor', 'hash', 'random'];
  const SCNAME = { sem: 'No LB', health: 'Health', rr: 'RR', lr: 'LR', lc: 'LC', lor: 'LOR', hash: 'Hash', random: 'Random' };
  const SCFULL = { sem: 'No load balancer', health: 'Healthcheck', rr: 'Round robin', lr: 'Least request', lc: 'Least connection',
    lor: 'Least outstanding requests', hash: 'IP hash and Maglev', random: 'Random' };
  const AULA = { sem: 'aula-1-balanceadores-escalabilidade-e-healthchecks', health: 'aula-1-balanceadores-escalabilidade-e-healthchecks', rr: 'aula-3-round-robin',
    lr: 'aula-4-least-request', lc: 'aula-5-least-connection', lor: 'aula-6-least-outstanding-requests', hash: 'aula-7-ip-hash-maglev-e-random', random: 'aula-7-ip-hash-maglev-e-random' };
  let clk = 0, sc = 'rr', step = 0, lt = 0, playing = false, dwell = 0, followT = 2.6, last = 0, nowAt = 0, cntKey = '';
  try { const q = new URLSearchParams(location.search), m = q.get('mode'); if (SC.includes(m)) { sc = m; var fromUrl = true; }
    const n = +q.get('step'); if (n > 0) step = n - 1; } catch (e) {}
  if (!fromUrl) { try { const v = localStorage.getItem('sdlabs-lb3d-sc'); if (SC.includes(v)) sc = v; } catch (e) {} }

  // ── geometria ──
  const PL = 7, BW = 150, BD = 110, BH = 36, RY = 180, LBW = 210, LBD = 74, LBH = 30, LBX = 295, LBY = 352, COLW = 14, COLMAX = 92;
  const SLOT3 = [75, 325, 575], SLOT4 = [22, 212, 402, 592];
  plateWith(g0, 800, 470, [[14, 14], [786, 14], [14, 456], [786, 456]]);
  hazeAndShadow(g0, 400, 235, 9.4, 6);
  // mostrador ao fundo
  rbox(20, 12, PL, 760, 12, 150, 5, bodyMat, g0);
  const scr = faceCanvas('front', 24, 24, PL + 147, 752, 142, 4, g0), SK = 752 / 520, DH = 142 / SK;   // desenho em 520 × 98, ampliado
  function block(w, d, h, lab, sub, col) {
    const g = new THREE.Group(); g0.add(g); const mat = capMat(); twCaps.push(mat);
    rbox(0, 0, 0, w, d, h, 6, mat, g);
    const top = faceCanvas('top', 3, 3, h, w - 6, d - 6, 5, g);
    const fh = Math.min(16, h - 4), fr = faceCanvas('front', 3, d, h - 1, w - 6, fh, 9, g);
    let colM = null;   // a coluna de carga, de pé no chão à direita da réplica
    if (col) { colM = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false })); g.add(colM); }
    return { g, mat, top, fr, fh, w, d, h, lab, sub, colM, colH: 2, key: '', fkey: '', pos: null, from: null, to: null, t0: 0 };
  }
  const B = { r0: block(BW, BD, BH, 'catalogo-1', ':8080', true), r1: block(BW, BD, BH, 'catalogo-2', ':8080', true), r2: block(BW, BD, BH, 'catalogo-3', ':8080', true),
    r3: block(BW, BD, BH, 'catalogo-4', ':8080', true), lb: block(LBW, LBD, LBH, 'lb-loja', '203.0.113.10') };
  creases(first);

  // conexões grossas (vigas) e pacotes que correm nelas (gato pequeno, busca grande)
  const beamOn = new THREE.MeshBasicMaterial({ color: accent.clone(), toneMapped: false });
  const beamOff = new THREE.MeshBasicMaterial({ color: 0x4f5357, toneMapped: false });
  const beamBad = new THREE.MeshBasicMaterial({ color: 0xff5a4a, toneMapped: false });
  const BOX = new THREE.BoxGeometry(1, 1, 1), XV = new THREE.Vector3(1, 0, 0);
  const BEAM = Array.from({ length: 110 }, () => { const m = new THREE.Mesh(BOX, beamOff); m.visible = false; m.renderOrder = 2; g0.add(m); return m; });
  const DOTS = Array.from({ length: 12 }, () => { const mat = capMat(); twCaps.push(mat); const g = new THREE.Group(); g0.add(g);
    rbox(-5, -5, -5, 10, 10, 10, 2, mat, g, { lines: false }); mat.emissiveIntensity = 1.3; const glow = glowPoints([W(0, 0, 0)], 0.3); g0.add(glow); g.visible = false; return { g, mat, glow }; });
  function setBeams(list) {
    let n = 0, nd = 0;
    for (const b of list) {
      const upto = b.cut != null ? b.cut : 1, cum = cumLen(b.pts), lift = b.on ? 1.5 : 0;
      for (let i = 0; i < b.pts.length - 1 && n < BEAM.length; i++) {
        let a = b.pts[i], c = b.pts[i + 1];
        if (upto < 1) { const end = upto * cum[cum.length - 1]; if (cum[i] >= end) break; if (cum[i + 1] > end) c = alongPts(b.pts, cum, upto); }
        const A = W(a[0], a[1], a[2] + lift), C_ = W(c[0], c[1], c[2] + lift), d = C_.clone().sub(A), len = d.length(); if (len < 1e-4) continue;
        const m = BEAM[n++], th = (b.on ? 6 : 3.8) * TS;
        m.visible = true; m.material = b.tone === 'bad' ? beamBad : b.on ? beamOn : beamOff; m.position.copy(A).add(C_).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(XV, d.normalize()); m.scale.set(len + th, th, th);
      }
      if (b.on && b.dot != null && nd < DOTS.length) { const D = DOTS[nd++], p = alongPts(b.pts, cum, b.dot), s = (b.size || 10) / 10;
        D.g.visible = true; D.g.position.copy(W(p[0], p[1], p[2] + 2 + (b.size || 10) / 2)); D.g.scale.set(s, s, s); moveGlow(D.glow, [p[0], p[1], p[2] + 4], b.tone === 'bad' ? 0.4 : 0.9); }
    }
    for (let i = n; i < BEAM.length; i++) BEAM[i].visible = false;
    for (let i = nd; i < DOTS.length; i++) { DOTS[i].g.visible = false; DOTS[i].glow.material.uniforms.intensity.value = 0; }
  }

  // ── rótulos que olham para a câmera (balões fixos e mensagens que viajam) ──
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
      tex.needsUpdate = true; const k = innerWidth < 640 ? 1.3 : NARROW() ? 1.12 : 1; sp.scale.set(nw / P * TS * k, nh / P * TS * k, 1);
    }
    tags.push(t); return t;
  }
  const TAGS = [tag(12), tag(12), tag(12), tag(12)], MSGS = [tag(10.5), tag(10.5)], WHO = tag(11);

  // ── lugares e rotas (no chão, z = 10) ──
  const Z = 10, LANE = 322;
  const cx = (o, k) => o.pos['r' + k][0] + BW / 2;
  const dedupe = pts => pts.filter((p, i) => !i || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.5);
  const R = {
    cli: [[-110, 392, Z], [LBX, 392, Z]],
    lb2: (o, k) => { const sx = 400 + (k - (o.n - 1) / 2) * 28; return dedupe([[sx, LBY, Z], [sx, LANE, Z], [cx(o, k), LANE, Z], [cx(o, k), RY + BD, Z]]); },
    dir: (o, k) => dedupe([[-110, 392, Z], [cx(o, k), 392, Z], [cx(o, k), RY + BD, Z]]),
  };
  const rev = pts => pts.slice().reverse();
  // balões: na faixa livre à frente de cada bloco (nunca em cima do texto dele)
  const TP = (o, at) => at === 'lb' ? [400, 452, 10] : at === 'who' ? [-70, 438, 8] : [cx(o, at), RY + BD + 14, 12];

  // ── o que se vê em cada passo (spec) ──
  const CFG = {
    sem: ['No load balancer', 'loja.com.br → a single address', 'every request → catalogo-1:8080'],
    health: ['Healthcheck (Envoy)', 'health_checks:', '- timeout: 1s', '  interval: 5s', '  unhealthy_threshold: 3', '  healthy_threshold: 2', '  http_health_check: { path: /health }'],
    rr: ['Configuration (NGINX)', 'upstream catalogo {', '  server 10.0.1.11:8080;', '  server 10.0.1.12:8080;', '  server 10.0.1.13:8080;', '}   # no directive = round robin'],
    peso: ['Configuration (NGINX)', 'upstream catalogo {', '  server 10.0.1.11:8080;', '  server 10.0.1.12:8080;', '  server 10.0.1.13:8080 weight=2;', '}'],
    qt: ['Go code from the article', 'quantum: 300 * time.Millisecond', 'if time.Now().Before(ultimoAcesso.Add(quantum)) {', '  return hosts[index]  // same turn', '}', 'index = (index + 1) % len(hosts)'],
    lr: ['Go code from the article', 'for i, reqs := range lr.requests {', '  if reqs < minRequests { minIndex = i … }', '}', 'lr.requests[minIndex]++   // never reset'],
    lc: ['Configuration (NGINX)', 'upstream catalogo {', '  least_conn;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
    lor: ['AWS ALB (target group)', 'load_balancing.algorithm.type =', '  least_outstanding_requests'],
    hash: ['Configuration (NGINX)', 'upstream catalogo {', '  hash $remote_addr;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
    maglev: ['Configuration (NGINX · Envoy)', 'hash $remote_addr consistent;', '# in Envoy: lb_policy: MAGLEV'],
    random: ['Configuration (NGINX)', 'upstream catalogo {', '  random;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
  };
  function base() {
    const s = L()[step], four = !!s.four, n = four ? 4 : 3, X = four ? SLOT4 : SLOT3;
    const o = { n, pos: {}, on: {}, beams: [], tags: [], msgs: [], rep: [], strip: Q.map(q => ({ l1: q.p, l2: CLI[q.c].n, l3: KIND[q.k].lab, big: q.k === 'b', dl: null })),
      stripLab: 'QUEUE · ARRIVAL ORDER', big: null, rule: [], now: [], clock: '', cfg: CFG[s.cfg || sc], lb: [], who: null, metric: 'requests', direct: sc === 'sem' };
    for (let k = 0; k < n; k++) { o.pos['r' + k] = [X[k], RY]; o.rep.push({ n: 0, ms: 0, st: 'ok', val: null, cpu: null, extra: [] }); }
    if (!o.direct) o.pos.lb = [LBX, LBY];
    return o;
  }
  const T = (o, at, text, tone = 'acc') => o.tags.push([...TP(o, at), text, tone]);
  // uma mensagem que viaja por uma rota entre a e b (segundos do passo), com o dado real; size = tamanho do pacote
  function send(o, t, a, b, pts, text, tone = 'acc', hold = 0.5, size = 10) {
    if (t < a) return false; const f = clamp((t - a) / (b - a));
    if (t < b + hold) { o.beams.push({ pts, on: true, dot: f < 1 ? ease(f) : null, tone: tone === 'bad' ? 'bad' : '', size }); if (text) o.msgs.push([pts, ease(f), text, tone]); }
    return f >= 1;
  }
  const asg = (seq, from = 0, to = 9) => Q.slice(from, to).map((q, i) => ({ ...q, to: seq[from + i] }));
  const land = (o, it) => { const r = o.rep[it.to]; r.n++; r.ms += KIND[it.k].ms; const c = o.strip[+it.p.slice(1) - 1];
    if (c) { c.dl = it.res || `→ ${it.to + 1}`; c.tone = it.res ? 'bad' : 'acc'; } };
  const pre = (o, items) => items.forEach(it => land(o, it));
  // a fila andando: cada pedido vai da pessoa ao lb-loja e do lb-loja à réplica escolhida (sem balanceador, direto)
  function flow(o, t, items, { t0 = 0.3, gap = 0.7, tr = 0.42, label = true } = {}) {
    let cur = null;
    items.forEach((it, i) => {
      const a = t0 + i * gap; if (t < a) return; cur = it;
      const sz = it.k === 'b' ? 20 : 11, txt = label ? `${it.p} · ${CLI[it.c].n} · ${KIND[it.k].lab}` : '', route = o.direct ? R.dir(o, it.to) : R.lb2(o, it.to);
      let done;
      if (o.direct) done = send(o, t, a, a + 2 * tr, route, txt, 'hi', 0.25, sz);
      else { send(o, t, a, a + tr, R.cli, txt, 'hi', 0, sz); done = send(o, t, a + tr, a + 2 * tr, route, label ? `${it.p} → ${REP[it.to].n}` : '', 'acc', 0.25, sz); }
      if (done) { land(o, it); if (t < a + 2 * tr + 0.7) o.on['r' + it.to] = it.res ? 'bad' : 1;
        if (it.res) send(o, t, a + 2 * tr + 0.05, a + 3 * tr, rev(route), label ? `${it.res} · ${CLI[it.c].n}` : '', 'bad', 0.4, 8); }
    });
    if (cur) o.who = cur.c;
    return cur;
  }
  // healthcheck: GET /health do lb-loja até a réplica e a resposta de volta (200 OK ou o timeout de 1 s)
  function ping(o, t, a, k, back, tone = 'acc', label = true) {
    send(o, t, a, a + 0.55, R.lb2(o, k), label ? 'GET /health' : '', 'hi', 0, 7);
    return send(o, t, a + 0.6, a + 1.15, rev(R.lb2(o, k)), label ? back : '', tone, 0.45, 7);
  }
  const clockAt = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = Math.floor(s) % 60; return [h, m, x].map(v => String(v).padStart(2, '0')).join(':'); };
  const T20 = 20 * 3600;
  const HL = [['19:59:55', 'GET', '200'], ['20:00:00', 'hangs', 'hangs'], ['20:00:05', 'timeout', '1/3 ✕'], ['20:00:10', 'timeout', '2/3 ✕'],
    ['20:00:15', 'timeout', 'out'], ['20:05:05', '200 OK', '1/2 ✓'], ['20:05:10', '200 OK', 'back']];
  const healthStrip = (o, upto) => { o.stripLab = 'HEALTHCHECK OF catalogo-2 · EVERY 5 s'; o.strip = HL.map(([a, b, c], i) => ({ l1: a.slice(0, 5), l2: a.slice(5), l3: b,
    dl: i < upto ? c : null, tone: i === 0 || i >= 5 ? 'acc' : 'bad' })); };
  const lbRows = (o, a, b, c) => { o.lb = [[a, 6.8, 'dim'], [b, 10.5, 'acc']]; if (c) o.lb.push([c, 8.2]); };
  // amostra de 12 clientes (h de 0 a 11) para mostrar quem troca de réplica quando o catalogo-3 sai
  const sample = (o, t, cons) => { o.stripLab = cons ? 'CLIENTS h = 0…11 · CONSISTENT' : 'CLIENTS h = 0…11 · BEFORE % 3 → NOW % 2'; let moved = 0, shown = 0;
    o.strip = Array.from({ length: 12 }, (_, h) => { const was = h % 3, now = cons ? (was === 2 ? (h % 2 ? 1 : 0) : was) : h % 2, mv = now !== was, vis = t > 0.4 + h * 0.3;
      if (vis) { shown++; if (mv) moved++; } return { l1: `h ${h}`, l2: `was ${was + 1}`, l3: '', dl: vis ? (mv ? `→ ${now + 1}` : `stays`) : null, tone: mv ? 'bad' : 'acc' }; });
    return { moved, shown }; };

  const STEPS = {
    sem: [
      { id: 'um', dur: 3.5, title: 'One IP only: everything lands on catalogo-1',
        story: 'Black Friday. The catalog runs on 3 replicas, but Lena types loja.com.br and DNS returns a single address, the one for catalogo-1. With nobody in the middle to split the load, her first request, the plush cat page (GET /produtos/42), goes straight there.',
        look: 'P1 leaves Lena and lights up catalogo-1; 2 and 3 stay dark, with no path to them.',
        key: 'One address sends everyone to the same replica.',
        f(o, t) { o.rule = ['no load balancer', 'DNS returns one IP: the one for catalogo-1']; flow(o, t, asg(SEQ.zero, 0, 1));
          o.now = t > 1.2 ? ['P1 · Lena · cat', '→ catalogo-1 · 20 ms'] : ['Lena opens loja.com.br', ''];
          if (t > 1.6) { T(o, 1, 'no requests\nno path', 'dim'); T(o, 2, 'no requests\nno path', 'dim'); } } },
      { id: 'fila', dur: 7.5, title: '9 requests, 1 replica: CPU at 100%',
        story: 'The other 8 requests in the queue arrive. Bia, Caio and Davi also open the plush cat, and three requests are the heavy 900 ms search. All of them land on catalogo-1, which adds up to 2,820 ms of work and hits 100% CPU; catalogo-2 and catalogo-3 stay at 0%.',
        look: 'The packets, 6 small (plush cat) and 3 large (search), all enter catalogo-1, and its column rises to the top.',
        key: 'An extra replica does not help if traffic does not reach it.',
        f(o, t) { o.rule = ['no load balancer', 'DNS returns one IP: the one for catalogo-1']; pre(o, asg(SEQ.zero, 0, 1)); const c = flow(o, t, asg(SEQ.zero, 1, 9), { gap: 0.65 });
          const r = o.rep[0]; r.cpu = Math.min(100, Math.round(r.ms / 28.2)); o.rep[1].cpu = o.rep[2].cpu = 0;
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, '→ catalogo-1'] : ['P1 already arrived', ''];
          if (r.n === 9) { o.on.r0 = 'bad'; T(o, 0, '9 requests · 2,820 ms\nCPU 100%', 'bad'); T(o, 1, 'CPU 0%', 'dim'); T(o, 2, 'CPU 0%', 'dim'); } } },
      { id: 'lento', dur: 5, title: 'What if it fails: the plush cat goes from 20 ms to 1.8 s',
        story: 'With the CPU at 100%, every request waits for the ones ahead of it. The plush cat page, which takes 20 ms alone, now takes 1.8 s, and the searches behind it take even longer. Meanwhile, two paid replicas do nothing. Someone has to stand in front and split the queue: the load balancer.',
        look: 'catalogo-1 turns red, with Lena\'s P9 stuck at its door; 2 and 3, dark, show 0%.',
        key: 'Without a load balancer, scaling out just means paying for idle replicas.',
        f(o, t) { o.rule = ['no load balancer', 'DNS returns one IP: the one for catalogo-1']; pre(o, asg(SEQ.zero)); o.rep[0].cpu = 100; o.rep[1].cpu = o.rep[2].cpu = 0; o.on.r0 = 'bad';
          o.strip.forEach(c => c.tone = 'bad'); o.who = 'L'; o.now = ['P9 · Lena · cat', 'alone 20 ms · queued 1.8 s'];
          const f = clamp((t - 0.3) / 1.2) * 0.86; o.beams.push({ pts: R.dir(o, 0), on: true, tone: 'bad', dot: f, size: 11, cut: Math.max(f, 0.02) });
          if (t > 0.3) o.msgs.push([R.dir(o, 0), f, 'P9 · Lena · cat', 'bad']);
          if (t > 1.6) T(o, 0, 'cat: 20 ms → 1.8 s\nCPU 100%', 'bad'); if (t > 2.3) { T(o, 1, 'CPU 0% · idle', 'dim'); T(o, 2, 'CPU 0% · idle', 'dim'); } } },
    ],
    health: [
      { id: 'ok', dur: 5, title: 'GET /health every 5 s: all 3 answer 200',
        story: 'Now lb-loja (203.0.113.10) is in front and DNS points to it. To know who can receive requests, it sends GET /health to each replica every 5 s and waits at most 1 s. At 19:59:55 all three answer 200 OK: they are in the pool.',
        look: 'Three pings leave lb-loja, one to each replica, and come back with 200; the display clock reads 19:59:55.',
        key: 'Healthcheck: the balancer asks, and the replica proves it is alive.',
        f(o, t) { o.rule = ['GET /health every 5 s', 'timeout 1 s · 3 failures out · 2 back in']; o.clock = '19:59:55'; healthStrip(o, t > 1.6 ? 1 : 0);
          lbRows(o, 'healthcheck', 'every 5 s', 'pool: 1 · 2 · 3'); o.metric = 'requests';
          [0, 1, 2].forEach(k => { if (ping(o, t, 0.4, k, '200 OK', 'acc', k === 1)) { o.rep[k].extra = [['health: 200 OK', 8.2, 'acc']]; o.on['r' + k] = 2; } });
          o.now = t > 1.6 ? ['all 3 answered 200 OK', 'pool: catalogo-1, 2 and 3'] : ['GET /health → the 3 replicas', ''];
          if (t > 2.2) T(o, 'lb', 'no pool: 1 · 2 · 3', 'acc'); } },
      { id: 'trava', dur: 7, title: 'What if it fails: 20:00:00, catalogo-2 hangs',
        story: 'At 20:00:00 catalogo-2 hangs. lb-loja does not know yet: it keeps doing round robin and sends 1 of every 3 requests to it. It does not answer, and Bia gets a 502. At 20:00:05 its healthcheck hits the 1 s timeout: failure 1 of 3.',
        look: 'catalogo-2 turns red; the requests that land on it come back as 502 and the timeline shows failure 1/3.',
        key: 'Between hanging and leaving the pool, requests keep reaching the dead replica.',
        f(o, t) { o.rule = ['GET /health every 5 s', 'timeout 1 s · 3 failures out · 2 back in']; o.clock = clockAt(T20 + Math.min(5, Math.floor(t))); healthStrip(o, t > 5.9 ? 3 : 2);
          lbRows(o, 'healthcheck', 'pool: 1 · 2 · 3', 'does not know yet'); o.rep[1].st = 'dead'; o.on.r1 = 'bad';
          flow(o, t, asg(SEQ.rr, 0, 6).map(it => it.to === 1 ? { ...it, res: '502' } : it), { gap: 0.72 });
          ping(o, t, 4.8, 1, 'timeout 1 s', 'bad'); o.rep[1].extra = [[`consecutive failures: ${t > 5.9 ? 1 : 0}/3`, 8.2, 'bad']];
          o.now = t > 5.9 ? ['20:00:05: the check hit 1 s', 'failure 1 of 3 · still in pool'] : ['catalogo-2 hung at 20:00:00', '1 in every 3 requests → 502'];
          if (t > 2.2) T(o, 1, 'hung · 502\n1 in every 3 requests', 'bad'); } },
      { id: 'fora', dur: 7.5, title: '3 failures in a row: out of the pool at 20:00:15',
        story: 'At 20:00:10 and 20:00:15 the healthcheck fails again. That is 3 failures in a row, and lb-loja takes catalogo-2 out of the pool. In those 15 s, 1 of every 3 requests failed. From now on, 100% of requests go to catalogo-1 and catalogo-3.',
        look: 'The timeline goes to 3/3, catalogo-2 shows OUT OF POOL and the path to it disappears; packets go only to 1 and 3.',
        key: '5 s × 3 failures = up to 15 s of errors before the replica leaves.',
        f(o, t) { o.rule = ['GET /health every 5 s', 'timeout 1 s · 3 failures out · 2 back in']; const out = t > 3.9; healthStrip(o, t > 3.9 ? 5 : t > 1.6 ? 4 : 3);
          o.clock = t < 1.6 ? '20:00:10' : '20:00:15'; o.rep[1].st = out ? 'out' : 'dead'; o.on.r1 = 'bad';
          ping(o, t, 0.4, 1, 'timeout 1 s', 'bad'); ping(o, t, 2.7, 1, 'timeout 1 s', 'bad');
          o.rep[1].extra = [[`consecutive failures: ${t > 3.9 ? 3 : t > 1.6 ? 2 : 1}/3`, 8.2, 'bad']];
          lbRows(o, 'healthcheck', out ? 'pool: 1 · 3' : 'pool: 1 · 2 · 3', out ? 'catalogo-2 left' : 'counting failures');
          if (out) flow(o, t, asg([0, 2, 0, 2, 0, 2], 0, 6).map((it, i) => ({ ...it, p: Q[i].p })), { t0: 4.3, gap: 0.6 });
          o.now = out ? ['20:00:15: 3rd failure in a row', 'out of pool · requests only on 1 and 3'] : ['20:00:10: failure 2 of 3', 'still in pool: 1 in 3 fails'];
          if (out) { T(o, 1, 'out of pool at 20:00:15\n15 s of 502 for 1 in 3', 'bad'); if (t > 5) T(o, 'lb', '100% to 1 and 3', 'acc'); } } },
      { id: 'volta', dur: 7.5, title: 'Back at 20:05:00; in the pool at 20:05:10',
        story: 'At 20:05:00 catalogo-2 restarts. The 20:05:05 healthcheck passes (1 of 2) and so does the 20:05:10 one (2 of 2): at 20:05:10 it rejoins the pool and gets requests again. Requiring 2 successes avoids bringing back a replica that works once and falls over again.',
        look: 'The pings come back with 200 from catalogo-2, 1/2 and 2/2; the path reappears and it lights up again.',
        key: 'To come back, a replica must succeed more than once in a row.',
        f(o, t) { o.rule = ['GET /health every 5 s', 'timeout 1 s · 3 failures out · 2 back in']; const back = t > 3.9; healthStrip(o, t > 3.9 ? 7 : t > 1.6 ? 6 : 5);
          o.clock = t < 0.4 ? '20:05:00' : t < 2.7 ? '20:05:05' : '20:05:10'; o.rep[1].st = back ? 'ok' : 'out';
          o.rep[1].extra = [[back ? 'health: 2/2 · in pool' : `restarted · ok ${t > 1.6 ? 1 : 0}/2`, 8.2, 'acc']];
          ping(o, t, 0.4, 1, '200 OK · 1/2'); ping(o, t, 2.7, 1, '200 OK · 2/2');
          lbRows(o, 'healthcheck', back ? 'pool: 1 · 2 · 3' : 'pool: 1 · 3', back ? 'catalogo-2 is back' : 'counting successes');
          if (back) flow(o, t, asg(SEQ.rr, 0, 3), { t0: 4.3, gap: 0.7 });
          o.now = back ? ['20:05:10: 2nd success in a row', 'back in the pool'] : ['20:05:00: catalogo-2 restarted', 'needs 2 checks ok'];
          if (back && t > 4.6) T(o, 1, 'back at 20:05:10', 'acc'); } },
      { id: 'novo', four: true, dur: 7.5, title: 'Scaling out: catalogo-4 joins',
        story: 'The queue keeps growing and the store starts one more replica, catalogo-4 (10.0.1.14). Nobody has to tell lb-loja by hand: catalogo-4\'s first GET /health returns 200 and from then on it joins the pool and gets its share of requests.',
        look: 'A fourth block appears; the ping comes back 200 and the next request already goes to it.',
        key: 'The healthcheck also decides who joins: scaling out means starting the replica and waiting for the first 200.',
        f(o, t) { o.rule = ['GET /health every 5 s', 'new replica: joins on 1st 200']; const inn = t > 2.2;
          o.stripLab = 'HEALTHCHECK OF catalogo-4'; o.strip = [{ l1: 'start', l2: '10.0.1.14', l3: '', dl: 'new', tone: 'acc' }, { l1: 'GET', l2: '/health', l3: '', dl: inn ? '200' : null, tone: 'acc' },
            { l1: 'pool', l2: '1·2·3·4', l3: '', dl: inn ? 'joins' : null, tone: 'acc' }];
          o.rep[3].st = inn ? 'ok' : 'novo'; o.rep[3].extra = [[inn ? 'health: 200 OK' : 'waiting for 1st check', 8.2, inn ? 'acc' : 'dim']];
          ping(o, t, 1.0, 3, '200 OK'); lbRows(o, 'healthcheck', inn ? 'pool: 1 · 2 · 3 · 4' : 'pool: 1 · 2 · 3', inn ? 'catalogo-4 joined' : 'catalogo-4 started');
          if (inn) flow(o, t, asg([0, 1, 2, 3], 0, 4), { t0: 2.8, gap: 0.65 });
          o.now = inn ? ['1st GET /health: 200 OK', 'catalogo-4 in pool'] : ['catalogo-4 started (10.0.1.14)', 'still out: needs 1st check'];
          if (t > 5.4) T(o, 3, 'in pool: gets its share', 'acc'); } },
    ],
    rr: [
      { id: 'vez', dur: 4, title: 'Round robin: each in its turn',
        story: 'lb-loja uses the simplest rule: round robin. It keeps only a pointer and hands each request to the next replica on the list. Lena\'s P1 goes to catalogo-1, Bia\'s P2 to catalogo-2, Caio\'s P3 to catalogo-3.',
        look: 'The first 3 packets leave one for each replica, and the pointer on lb-loja moves 1, 2, 3.',
        key: 'Round robin: the next request goes to the next replica on the list, in a circle.',
        f(o, t) { o.rule = ['round robin', 'next request → next replica']; const c = flow(o, t, asg(SEQ.rr, 0, 3));
          const ptr = o.rep.reduce((a, r) => a + r.n, 0) % 3; lbRows(o, 'round robin', `pointer → ${ptr + 1}`, 'list: 1 · 2 · 3');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `turn: catalogo-${c.to + 1}`] : ['pointer at 1', '']; } },
      { id: 'fila', dur: 6.5, title: '9 requests: 3 for each',
        story: 'The pointer wraps around and the queue goes on: P4 to 1, P5 to 2, P6 to 3, and so on up to P9. Each replica received 3 requests. By count, the split is perfect.',
        look: 'The counters above the replicas rise together to 3 · 3 · 3.',
        key: 'Round robin splits the number of requests without looking at what each one costs.',
        f(o, t) { o.rule = ['round robin', 'next request → next replica']; pre(o, asg(SEQ.rr, 0, 3)); const c = flow(o, t, asg(SEQ.rr, 3, 9), { gap: 0.65 });
          lbRows(o, 'round robin', `pointer → ${o.rep.reduce((a, r) => a + r.n, 0) % 3 + 1}`, 'list: 1 · 2 · 3');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `turn: catalogo-${c.to + 1}`] : ['P1 to P3 already went', ''];
          if (o.rep[2].n === 3) T(o, 'lb', '3 · 3 · 3 requests', 'acc'); } },
      { id: 'peso', cfg: 'peso', dur: 7, title: 'With weight: catalogo-3 has twice the CPU',
        story: 'If catalogo-3 has twice the CPU, you can give it weight 2: on each lap of the pointer it appears twice (1, 2, 3, 3). Of the same 9 requests, it gets 4, catalogo-1 gets 3 and catalogo-2 gets 2.',
        look: 'The pointer passes catalogo-3 twice; the counters end at 3 · 2 · 4.',
        key: 'Weight says how many times the replica appears in each lap of the pointer.',
        f(o, t) { o.rule = ['round robin with weights', 'lap: 1 · 2 · 3 · 3']; const c = flow(o, t, asg(SEQ.peso), { gap: 0.62 });
          lbRows(o, 'round robin · weight', 'lap: 1 · 2 · 3 · 3', 'catalogo-3: weight=2');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `turn: catalogo-${c.to + 1}`] : ['weight 2 on catalogo-3', ''];
          if (o.rep[0].n === 3 && t > 6) T(o, 2, 'weight 2: 4 requests', 'acc'); } },
      { id: 'quantum', cfg: 'qt', dur: 7, title: 'With quantum: each turn lasts 300 ms',
        story: 'The Go code from the article does another variant: each replica\'s turn lasts 300 ms, the quantum. With one request arriving every 200 ms, each replica takes 2 in a row: 1, 1, 2, 2, 3, 3, 1, 1, 2. If a burst of requests falls inside one quantum, they all go to the same replica.',
        look: 'The display clock runs in steps of 200 ms and the packets leave in pairs for the same replica.',
        key: 'With a quantum, the turn changes by the clock, not by the count.',
        f(o, t) { o.rule = ['round robin with quantum', 'each turn lasts 300 ms']; const c = flow(o, t, asg(SEQ.qt), { gap: 0.62 });
          const i = c ? +c.p.slice(1) - 1 : -1; o.clock = i >= 0 ? `t = ${i * 200} ms` : 't = 0 ms';
          lbRows(o, 'round robin · quantum', 'turn: 300 ms', i >= 0 ? `turn: catalogo-${SEQ.qt[i] + 1}` : 'turn: catalogo-1');
          o.now = c ? [`${c.p} at t = ${i * 200} ms`, `turn: catalogo-${c.to + 1}`] : ['one request every 200 ms', '']; } },
      { id: 'buscas', dur: 6, title: 'What if it fails: the 3 searches on catalogo-2',
        story: 'Go back to the queue without weights or quantum and look at what each request costs. P2, P5 and P8 are the 900 ms searches, and the pointer sent all three to catalogo-2: 2,700 ms of work for it, 60 ms for each of the others. The request count adds up (3 · 3 · 3); the work does not.',
        look: 'The 3 large packets all go to catalogo-2, which turns red with its column at the top; 1 and 3 barely rise.',
        key: 'Round robin looks fair and is not when requests cost different amounts.',
        f(o, t) { o.rule = ['round robin', 'next request → next replica']; const all = asg(SEQ.rr);
          pre(o, all.filter(it => it.k === 'g')); const c = flow(o, t, all.filter(it => it.k === 'b'), { gap: 1.0 });
          o.strip.forEach((s, i) => { if (Q[i].k === 'b' && s.dl) s.tone = 'bad'; });
          lbRows(o, 'round robin', '3 · 3 · 3 requests', 'ignores the cost');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · search 900 ms`, '→ catalogo-2 again'] : ['the cats already went', 'searches still to go'];
          if (o.rep[1].n === 3) { o.on.r1 = 'bad'; T(o, 1, '3 searches · 2,700 ms', 'bad'); T(o, 0, '3 cats · 60 ms', 'dim'); T(o, 2, '3 cats · 60 ms', 'dim'); } } },
    ],
    lr: [
      { id: 'conta', dur: 4, title: 'Least request: goes to whoever served the fewest',
        story: 'Another rule: lb-loja keeps one counter per replica, with how many requests each has served, and sends the next one to the replica with the lowest counter. At the start it is 0 · 0 · 0 and, on a tie, the first on the list wins. P1 goes to catalogo-1, which becomes 1.',
        look: 'The counter appears above each replica; each packet goes to the one with the lowest number.',
        key: 'Least request: the next one goes to whoever has served the fewest requests so far.',
        f(o, t) { o.rule = ['least request', 'lowest counter; tie: the 1st']; o.metric = 'counter'; const c = flow(o, t, asg(SEQ.rr, 0, 3));
          lbRows(o, 'least request', `counters ${o.rep.map(r => r.n).join(' · ')}`);
          o.now = c ? [`${c.p}: lowest counter`, `→ catalogo-${c.to + 1}`] : ['counters 0 · 0 · 0', 'tie: the 1st goes']; } },
      { id: 'empate', dur: 6.5, title: 'Together from the start: same as round robin',
        story: 'Since all three started together, the lowest counter goes around in a circle: P2 goes to 2, P3 to 3, P4 back to 1. The whole queue ends at 3 · 3 · 3, the same split as round robin, and the 3 searches again all land on catalogo-2.',
        look: 'The counters rise like stairs, 1-1-1, 2-2-2, 3-3-3, and the large packets go to catalogo-2.',
        key: 'With replicas that started together, least request ties with round robin.',
        f(o, t) { o.rule = ['least request', 'lowest counter; tie: the 1st']; o.metric = 'counter'; pre(o, asg(SEQ.rr, 0, 3)); const c = flow(o, t, asg(SEQ.rr, 3, 9), { gap: 0.65 });
          lbRows(o, 'least request', `counters ${o.rep.map(r => r.n).join(' · ')}`);
          o.now = c ? [`${c.p}: lowest counter`, `→ catalogo-${c.to + 1}`] : ['counters 1 · 1 · 1', ''];
          if (o.rep[2].n === 3) T(o, 'lb', '3 · 3 · 3: same as round robin', 'acc'); } },
      { id: 'novo', four: true, dur: 5, title: 'catalogo-4 joins with counter 0',
        story: 'Hours into Black Friday, each replica has served 3,000 requests. To handle the peak, the store starts catalogo-4 (10.0.1.14). Its counter starts at 0, against 3,000 for each of the others.',
        look: 'A fourth block appears with counter 0; the other three show 3,000.',
        key: 'A counter that adds up since forever remembers the past, not the load right now.',
        f(o, t) { o.rule = ['least request', 'lowest counter; tie: the 1st']; o.metric = 'counter'; o.stripLab = 'COUNTERS OF lb-loja'; o.strip = null;
          o.big = [3000, 3000, 3000, 0].map((v, k) => [REP[k].n, nf(v), k === 3 ? 'acc' : 'hi']);
          [0, 1, 2].forEach(k => { o.rep[k].n = 3000; o.rep[k].cpu = 33; }); o.rep[3].cpu = 0; lbRows(o, 'least request', 'lowest: catalogo-4 (0)', '3,000 · 3,000 · 3,000 · 0');
          o.now = ['catalogo-4 started with 0', 'the others: 3,000 each']; if (t > 1.2) T(o, 3, 'counter 0\nthe others: 3,000', 'acc'); } },
      { id: 'tudo', four: true, dur: 7.5, title: 'What if it fails: the next 3,000 go to catalogo-4',
        story: 'The lowest counter is now always catalogo-4\'s, so every new request goes to it, one after another, until it ties at 3,000. The replica that just started gets 100% of the traffic and saturates while the three old ones sit idle: a denial of service caused by the load balancer itself. The fix is to reset the counters from time to time or count only a recent window.',
        look: 'All packets go to catalogo-4; its counter runs from 0 to 3,000 and it turns red, with its column at the top.',
        key: 'Least request needs a reset counter or a window, otherwise the new replica takes everything.',
        f(o, t) { o.rule = ['least request', 'counter that never resets']; o.metric = 'counter'; const v = Math.round(3000 * clamp((t - 0.4) / 5.6));
          o.stripLab = 'COUNTERS OF lb-loja'; o.strip = null; o.big = [3000, 3000, 3000, v].map((x, k) => [REP[k].n, nf(x), k === 3 ? (v > 300 ? 'bad' : 'acc') : 'hi']);
          [0, 1, 2].forEach(k => { o.rep[k].n = 3000; o.rep[k].cpu = 0; }); o.rep[3].n = v; o.rep[3].cpu = Math.min(100, Math.round(v / 3));
          for (let j = 0; j < 9; j++) { const a = 0.4 + j * 0.62; if (t > a && v < 3000) send(o, t, a, a + 0.5, R.lb2(o, 3), j === 0 ? 'every new request → catalogo-4' : '', 'acc', 0, j % 3 === 1 ? 20 : 11); }
          if (v > 300) o.on.r3 = 'bad'; lbRows(o, 'least request', v < 3000 ? 'lowest: catalogo-4' : 'tied at 3,000', `catalogo-4: ${nf(v)}`);
          o.now = v < 3000 ? [`catalogo-4: ${nf(v)} of 3,000`, 'the other 3: no new requests'] : ['tied at 3,000', 'only now do the others get any'];
          if (v > 300) T(o, 3, `${nf(v)} requests in a row\nCPU ${o.rep[3].cpu}%`, 'bad'); if (t > 2.4) T(o, 'lb', 'denial of service\ncaused by the balancer', 'bad');
          if (t > 3.2) T(o, 1, 'idle', 'dim'); } },
    ],
    lc: [
      { id: 'keep', dur: 5.5, title: 'An open connection is not a request',
        story: 'Least connection looks at something else: how many TCP connections each replica has open right now. But Lena\'s browser, after getting the plush cat page, keeps the connection open (keep-alive) to reuse later. It sits there idle, asking for nothing, and keeps counting.',
        look: 'P1 goes to catalogo-1 and comes back with the page; the connection stays lit in gray, with no traffic, and the counter stays at 1.',
        key: 'Keep-alive: the connection stays open even with no request passing.',
        f(o, t) { o.rule = ['least connection', 'fewest open connections now']; o.metric = 'connections'; const done = flow(o, t, asg(SEQ.zero, 0, 1)) && t > 1.15;
          lbRows(o, 'least connection', `connections ${done ? 1 : 0} · 0 · 0`);
          if (done) { o.rep[0].val = 1; o.rep[0].ms = 0; o.rep[0].extra = [{ dots: [t < 1.6 ? 1 : 0, t < 1.6 ? 0 : 1] }];
            if (send(o, t, 1.2, 1.7, rev(R.lb2(o, 0)), '200 · plush cat page', 'acc', 0.3, 11) && t > 2.2) { o.beams.push({ pts: R.lb2(o, 0), on: true, tone: '' }); T(o, 0, 'keep-alive: open\nidle, no request', 'dim'); } }
          o.rep[1].val = o.rep[2].val = 0;
          o.now = t > 2.2 ? ['the page came back in 20 ms', 'the connection stays open'] : ['P1 · Lena · cat', '→ catalogo-1']; } },
      { id: 'agora', dur: 5, title: 'The moment: 5 · 3 · 4 connections',
        story: 'At one moment of Black Friday, catalogo-1 has 5 idle keep-alive connections, from inactive browsers, and almost no work. catalogo-2 has 3 connections, all with a heavy search in progress. catalogo-3 has 4: 1 with a request, 3 idle.',
        look: 'Each replica shows its connections: empty squares are idle, filled ones are working.',
        key: 'Least connection counts open connections, busy or not.',
        f(o, t) { o.rule = ['least connection', 'fewest open connections now']; snap(o, 'lc'); lbRows(o, 'least connection', 'connections 5 · 3 · 4');
          o.now = ['catalogo-1: 5 idle', 'catalogo-2: 3 searches · catalogo-3: 1 + 3'];
          if (t > 0.6) T(o, 0, '5 idle connections', 'dim'); if (t > 1.4) T(o, 1, '3 searches running', 'acc'); if (t > 2.2) T(o, 2, '1 request · 3 idle', 'dim'); } },
      { id: 'erro', dur: 6, title: 'What if it fails: P9 lands on the busiest',
        story: 'P9 arrives, Lena opening the plush cat again. Least connection compares 5, 3 and 4 and picks catalogo-2, which has the fewest connections and is exactly the one processing the 3 searches of 900 ms. The 20 ms page queues behind them, while catalogo-1, which was doing nothing, is left out.',
        look: 'P9\'s packet goes to catalogo-2, which turns red; catalogo-1 stays idle with its 5 unused connections.',
        key: 'An open connection is not work: least connection gets it wrong when idle keep-alive connections exist.',
        f(o, t) { o.rule = ['least connection', 'fewest open connections now']; snap(o, 'lc'); lbRows(o, 'least connection', 'min(5, 3, 4) = 3', '→ catalogo-2');
          const it = { ...Q[8], to: 1 }; flow(o, t, [it], { t0: 0.4 });
          if (o.rep[1].n) { o.rep[1].val = 4; o.rep[1].extra = [{ dots: [4, 0] }]; o.on.r1 = 'bad'; }
          o.now = o.rep[1].n ? ['P9 · cat 20 ms → catalogo-2', 'queued behind 3 searches of 900 ms'] : ['P9 · Lena · cat', 'fewest connections: catalogo-2 (3)'];
          if (t > 1.8) { T(o, 1, 'P9 behind 3 searches\nof 900 ms', 'bad'); T(o, 0, '5 connections, 0 work\nleft out', 'dim'); } } },
    ],
    lor: [
      { id: 'pend', dur: 5, title: 'Pending request: arrived and not answered yet',
        story: 'Least outstanding requests (LOR) counts pending requests: the ones the replica received and has not answered yet. P1 reaches catalogo-1 and its counter goes to 1; 20 ms later the page comes back and the counter drops to 0. The connection can stay open: for LOR, it weighs nothing.',
        look: 'catalogo-1\'s pending counter goes up to 1 when P1 arrives and back to 0 with the response.',
        key: 'Pending = request in progress, still without a response.',
        f(o, t) { o.rule = ['least outstanding requests', 'fewest pending requests']; o.metric = 'pending'; flow(o, t, asg(SEQ.zero, 0, 1));
          const inn = t > 1.14, back = send(o, t, 1.9, 2.4, rev(R.lb2(o, 0)), inn ? '200 · 20 ms' : '', 'acc', 0.4, 11);
          o.rep[0].val = inn && !back ? 1 : 0; o.rep[1].val = o.rep[2].val = 0; o.rep[0].ms = 0; if (inn) o.rep[0].extra = [{ dots: [back ? 0 : 1, back ? 1 : 0] }];
          lbRows(o, 'LOR', `pending ${o.rep[0].val} · 0 · 0`);
          o.now = back ? ['answered: pending 0', 'an open connection does not count'] : inn ? ['P1 arrived: pending 1', 'waiting for the response'] : ['P1 · Lena · cat', ''];
          if (back && t > 2.6) T(o, 0, '0 pending\n1 open connection', 'acc'); } },
      { id: 'agora', dur: 5, title: 'The same moment: 0 · 3 · 1 pending',
        story: 'Go back to the least connection moment. catalogo-1 has 5 connections, but none with a request: 0 pending. catalogo-2 has 3 searches in progress: 3 pending. catalogo-3 has 1.',
        look: 'The numbers above the replicas switch from connections (5 · 3 · 4) to pending (0 · 3 · 1).',
        key: 'LOR measures work in progress, not connections.',
        f(o, t) { o.rule = ['least outstanding requests', 'fewest pending requests']; snap(o, t < 1.4 ? 'lc' : 'lor');
          lbRows(o, 'LOR', t < 1.4 ? 'connections 5 · 3 · 4' : 'pending 0 · 3 · 1', t < 1.4 ? '' : 'LC saw 5 · 3 · 4');
          o.now = t < 1.4 ? ['connections: 5 · 3 · 4', ''] : ['pending: 0 · 3 · 1', 'an idle connection does not count'];
          if (t > 1.6) { T(o, 0, '5 connections\n0 pending', 'acc'); T(o, 1, '3 pending', 'dim'); T(o, 2, '1 pending', 'dim'); } } },
      { id: 'certo', dur: 5.5, title: 'P9 goes to catalogo-1: 20 ms',
        story: 'P9 arrives. LOR picks catalogo-1, with 0 pending, which answers the plush cat page in 20 ms. catalogo-2 keeps working on its searches without receiving anything more. This is the rule the AWS ALB calls least outstanding requests.',
        look: 'P9 goes to catalogo-1 and quickly comes back with 200; catalogo-2 keeps its 3 searches.',
        key: 'LOR sends to whoever is least busy right now.',
        f(o, t) { o.rule = ['least outstanding requests', 'fewest pending requests']; snap(o, 'lor'); lbRows(o, 'LOR', 'min(0, 3, 1) = 0', '→ catalogo-1');
          flow(o, t, [{ ...Q[8], to: 0 }], { t0: 0.4 }); const inn = t > 1.24, back = send(o, t, 1.8, 2.3, rev(R.lb2(o, 0)), inn ? '200 · 20 ms' : '', 'acc', 0.5, 11);
          if (inn && !back) { o.rep[0].val = 1; o.rep[0].extra = [{ dots: [1, 5] }]; }
          o.now = back ? ['P9 answered in 20 ms', 'catalogo-1 back to 0'] : ['P9 · Lena · cat', 'fewest pending: catalogo-1 (0)'];
          if (back && t > 2.6) T(o, 0, 'P9 · 20 ms ✓', 'acc'); } },
      { id: 'rapido', dur: 7.5, title: 'What if it fails: the replica that fails fast',
        story: 'Now catalogo-3 loses its connection to the database and starts answering 500 in 1 ms. Because it answers right away, it never piles up pending requests: it always has 0, and LOR sends it almost every new request, which comes back as an error. Of the next 6 requests, 4 land on it. Only the healthcheck or outlier detection (consecutive 5xx) takes catalogo-3 out of the pool.',
        look: 'catalogo-3 turns red with 0 pending; the packets go to it and come back as 500.',
        key: 'Answering fast is not answering right: LOR needs a healthcheck alongside.',
        f(o, t) { o.rule = ['least outstanding requests', 'whoever fails fast stays at 0']; snap(o, 'lor'); o.rep[2].st = 'dead'; o.rep[2].val = 0; o.rep[2].extra = [['answers 500 in 1 ms', 8.2, 'bad']]; o.on.r2 = 'bad';
          const items = [['B', 'g', 0], ['C', 'g', 2], ['D', 'g', 2], ['L', 'g', 2], ['B', 'b', 0], ['C', 'g', 2]].map(([c, k, to], i) => ({ p: 'P' + (10 + i), c, k, to, res: to === 2 ? '500' : null }));
          o.stripLab = 'NEW REQUESTS · P10 TO P15'; o.strip = items.map(it => ({ l1: it.p, l2: CLI[it.c].n, l3: KIND[it.k].lab, big: it.k === 'b', dl: null }));
          const c = flow(o, t, items.map((it, i) => ({ ...it, p: 'P' + (i + 1) })), { gap: 0.85 });
          o.strip.forEach((s, i) => { if (s.dl && items[i].res) s.dl = '500'; }); o.rep[0].n = o.rep[2].n = 0; o.rep[0].ms = 0; o.rep[2].ms = 0;
          const nb = o.strip.filter((s, i) => s.dl && items[i].res).length; lbRows(o, 'LOR', 'pending 0 · 3 · 0', `500s from catalogo-3: ${nb}`);
          o.now = c ? [`${items[+c.p.slice(1) - 1].p} → catalogo-${c.to + 1}`, c.res ? '500 in 1 ms · pending back to 0' : '200'] : ['catalogo-3 lost the DB', 'answers 500 in 1 ms'];
          if (t > 5.4) T(o, 2, '4 of 6 came back 500\nalways 0 pending', 'bad'); } },
    ],
    hash: [
      { id: 'lena', dur: 5, title: 'hash(177.38.20.5) % 3 = 1 → catalogo-2',
        story: 'With IP hash, lb-loja counts nothing: it does a calculation with the IP of whoever is asking. Lena\'s IP, 177.38.20.5, becomes the number 5125 (in the example, 20 × 256 + 5), and 5125 % 3 = 1, the position of catalogo-2 in a list that starts at 0. P1, P5 and P9, her three requests, all go there.',
        look: 'Lena\'s 3 packets always follow the same path, to catalogo-2.',
        key: 'IP hash: the same IP always lands on the same replica.',
        f(o, t) { o.rule = ['IP hash', 'h = hash(IP) · replica = h % 3']; const its = asg(SEQ.hash).filter(it => it.c === 'L'); flow(o, t, its, { gap: 1.0 });
          lbRows(o, 'IP hash', '5125 % 3 = 1', '177.38.20.5 → 2'); o.now = ['177.38.20.5 → h = 5125', '5125 % 3 = 1 → catalogo-2'];
          if (o.rep[1].n === 3) T(o, 1, 'Lena: P1, P5, P9\nalways here', 'acc'); } },
      { id: 'fila', dur: 6.5, title: 'The whole queue: each client on its replica',
        story: 'Bia (189.6.44.10) lands on catalogo-1, Caio (200.150.7.33) on catalogo-2 and Davi (187.11.90.2) on catalogo-3. The split came out 2 · 5 · 2 requests, uneven, but each person always returns to the same replica. A cart kept in its memory or a local cache keeps working.',
        look: 'Each client always follows the same path; the counters end at 2 · 5 · 2.',
        key: 'Useful for sessions and local cache: the client finds the same replica again.',
        f(o, t) { o.rule = ['IP hash', 'h = hash(IP) · replica = h % 3']; const all = asg(SEQ.hash); pre(o, all.filter(it => it.c === 'L'));
          const c = flow(o, t, all.filter(it => it.c !== 'L'), { gap: 0.75 }); lbRows(o, 'IP hash', c ? `${CLI[c.c].h} % 3 = ${CLI[c.c].h % 3}` : '5125 % 3 = 1', c ? `${CLI[c.c].ip} → ${c.to + 1}` : '');
          o.now = c ? [`${CLI[c.c].n} ${CLI[c.c].ip}`, `h = ${CLI[c.c].h} → catalogo-${c.to + 1}`] : ['Lena is already on 2', ''];
          if (t > 4.6) { T(o, 0, 'Bia: 2 requests', 'dim'); T(o, 1, 'Lena and Caio: 5', 'acc'); T(o, 2, 'Davi: 2', 'dim'); } } },
      { id: 'tira', cfg: 'hash', dur: 6, title: 'What if it fails: catalogo-3 leaves and 2/3 move',
        story: 'catalogo-3 goes down and leaves the pool. The calculation becomes h % 2, and the result changes for almost everyone, not only for those on 3: only clients with h % 6 equal to 0 or 1 stay where they were. About 2/3 of clients change replica and lose their session and local cache.',
        look: 'In the display\'s strip of 12 clients, 8 move (red); even those who were on 1 and 2 shift.',
        key: 'With % N, changing N remaps almost every client.',
        f(o, t) { o.rule = ['IP hash without catalogo-3', 'replica = h % 2']; o.rep[2].st = 'out'; const s = sample(o, t, false);
          o.metric = 'clients'; o.rep.forEach(r => r.noBar = true); o.rep[0].n = 6; o.rep[1].n = 6; o.rep[2].n = 0;
          lbRows(o, 'IP hash', 'h % 3 → h % 2', `moved: ${s.moved} of ${s.shown}`); o.now = [`moved ${s.moved} of ${s.shown}`, 'only h % 6 = 0 or 1 stay'];
          if (t > 4.2) T(o, 'lb', '% 2: 8 of 12 move (2/3)', 'bad'); } },
      { id: 'maglev', cfg: 'maglev', dur: 6, title: 'Consistent hashing (Maglev): only 1/3 moves',
        story: 'With consistent hashing, or Google\'s Maglev, each replica owns pieces of a table that does not depend only on N. When catalogo-3 leaves, only its pieces are redistributed: only those who were on 3 move, about 1/3. Lena, Bia and Caio do not even notice.',
        look: 'In the same strip of 12 clients, only the 4 that were on catalogo-3 move.',
        key: 'Consistent hashing: removing a replica only moves its own clients.',
        f(o, t) { o.rule = ['consistent hashing', 'only the clients of 3 move']; o.rep[2].st = 'out'; const s = sample(o, t, true);
          o.metric = 'clients'; o.rep.forEach(r => r.noBar = true); o.rep[0].n = 6; o.rep[1].n = 6; o.rep[2].n = 0;
          lbRows(o, 'consistent', 'only those on 3 move', `moved: ${s.moved} of ${s.shown}`); o.now = [`moved ${s.moved} of ${s.shown}`, 'only those who were on catalogo-3'];
          if (t > 4.2) T(o, 'lb', 'consistent: 4 of 12 (1/3)', 'acc'); } },
      { id: 'nat', dur: 7, title: 'What if it fails: 500 people behind one IP',
        story: 'With the 3 replicas back, even the cleverest hash only sees the IP. Davi works in an office in SP with 500 people who reach the internet through the same IP, 187.11.90.2 (NAT). To the balancer it is a single client: all 500 land on catalogo-3, which saturates while the other two have room to spare.',
        look: 'A burst of packets from the same IP all goes to catalogo-3, which turns red with its column at the top.',
        key: 'IP hash gets unbalanced when many people share the same IP.',
        f(o, t) { o.rule = ['IP hash', 'NAT: 500 people, 1 IP']; o.metric = 'people'; const v = Math.round(500 * clamp((t - 0.4) / 4.6));
          o.stripLab = 'PEOPLE PER REPLICA'; o.strip = null; o.big = [['catalogo-1', '1', 'hi'], ['catalogo-2', '2', 'hi'], ['catalogo-3', nf(v), v > 60 ? 'bad' : 'acc']];
          o.rep[0].n = 1; o.rep[1].n = 2; o.rep[2].n = v; o.rep[0].cpu = 1; o.rep[1].cpu = 1; o.rep[2].cpu = Math.min(100, Math.round(v / 5)); o.who = 'D';
          for (let j = 0; j < 8; j++) { const a = 0.4 + j * 0.58; if (v < 500) { send(o, t, a, a + 0.32, R.cli, j === 0 ? '187.11.90.2 · 500 people' : '', 'hi', 0, 11); send(o, t, a + 0.32, a + 0.7, R.lb2(o, 2), '', 'acc', 0, 11); } }
          if (v > 60) o.on.r2 = 'bad'; lbRows(o, 'IP hash', '187.11.90.2 → 3', `people on 3: ${nf(v)}`);
          o.now = [`Davi's office: ${nf(v)} of 500`, 'same IP → same catalogo-3'];
          if (t > 3) T(o, 2, `${nf(v)} people · CPU ${o.rep[2].cpu}%`, 'bad'); if (t > 3.6) { T(o, 0, 'Bia · room to spare', 'dim'); T(o, 1, 'Lena and Caio · room to spare', 'dim'); } } },
    ],
    random: [
      { id: 'sorteio', dur: 4, title: 'Random: draws a replica for each request',
        story: 'The shortest rule: for each request, lb-loja draws one of the 3 replicas. It keeps no pointer, counter or any other state. The first requests in the queue land wherever the draw sends them: P1 on 2, P2 on 1, P3 on 2 again.',
        look: 'The packets leave with no pattern: 2, 1, 2.',
        key: 'Random: each request has a 1/3 chance of going to each replica.',
        f(o, t) { o.rule = ['random', 'draws 1 of 3 for every request']; const c = flow(o, t, asg(SEQ.rnd, 0, 3), { gap: 0.9 });
          lbRows(o, 'random', c ? `draw: ${c.to + 1}` : 'draw: …', 'no state'); o.now = c ? [`${c.p}: drew ${c.to + 1}`, `→ catalogo-${c.to + 1}`] : ['drawing…', '']; } },
      { id: 'muitos', dur: 6.5, title: '10,000 requests: close to 1/3 each',
        story: 'With a lot of traffic, the draw evens out on its own. In 10,000 requests, each replica ends up near 3,333: in this example, 3,341, 3,329 and 3,330.',
        look: 'The counters run up to 10,000 and the columns end almost equal.',
        key: 'With a lot of traffic, the draw tends toward an even split.',
        f(o, t) { o.rule = ['random', 'draws 1 of 3 for every request']; const f = clamp((t - 0.4) / 4.8), END = [3341, 3329, 3330];
          o.stripLab = 'REQUESTS DRAWN'; o.strip = null; o.big = END.map((v, k) => [REP[k].n, nf(v * f), 'hi']);
          o.rep.forEach((r, k) => { r.n = Math.round(END[k] * f); r.cpu = Math.round(33 * f); });
          for (let j = 0; j < 9; j++) { const a = 0.4 + j * 0.5; if (f < 1) send(o, t, a, a + 0.45, R.lb2(o, [1, 0, 2, 2, 0, 1, 0, 2, 1][j]), '', 'acc', 0, 11); }
          lbRows(o, 'random', `${nf(10000 * f)} requests`, 'close to 1/3 each'); o.now = [`${nf(10000 * f)} requests drawn`, f < 1 ? '' : '3,341 · 3,329 · 3,330'];
          if (f >= 1) T(o, 'lb', '10,000: ~1/3 each', 'acc'); } },
      { id: 'poucos', dur: 8.5, title: 'What if it fails: 10 requests give 2 · 5 · 3',
        story: 'With little traffic, chance weighs more. In the 9 requests of the queue plus one from Caio, the draw in this example gave 2 to catalogo-1, 5 to catalogo-2 and 3 to catalogo-3. It also threw 2 of the 3 searches at catalogo-1: 1,800 ms of work for it, 60 ms for catalogo-3.',
        look: 'The strip of 10 requests ends up uneven: 5 packets on catalogo-2, and 2 large packets on catalogo-1.',
        key: 'Random is only fair on average, with many requests.',
        f(o, t) { o.rule = ['random', 'draws 1 of 3 for every request']; const items = [...asg(SEQ.rnd), { p: 'P10', c: 'C', k: 'g', to: SEQ.rnd[9] }];
          o.strip.push({ l1: 'P10', l2: 'Caio', l3: 'cat', dl: null }); const c = flow(o, t, items, { gap: 0.6 });
          lbRows(o, 'random', c ? `draw: ${c.to + 1}` : 'draw: …', `${o.rep.map(r => r.n).join(' · ')} requests`);
          o.now = c ? [`${c.p}: drew ${c.to + 1}`, `${KIND[c.k].lab} → catalogo-${c.to + 1}`] : ['', ''];
          if (o.rep.reduce((a, r) => a + r.n, 0) === 10) { o.strip.forEach((s, i) => { if (items[i].k === 'b' && items[i].to === 0) s.tone = 'bad'; }); o.on.r0 = 'bad';
            T(o, 0, '2 requests · 1,800 ms', 'bad'); T(o, 1, '5 requests · 980 ms', 'acc'); T(o, 2, '3 requests · 60 ms', 'dim'); } } },
    ],
  };
  // o mesmo instante do least connection e do LOR: 5 · 3 · 4 conexões, 0 · 3 · 1 pendentes
  function snap(o, m) {
    o.metric = m === 'lc' ? 'connections' : 'pending';
    const C = [[0, 5, 0], [3, 0, 2700], [1, 3, 20]];
    C.forEach(([act, idle, ms], k) => { const r = o.rep[k]; r.val = m === 'lc' ? act + idle : act; r.ms = ms; r.extra = [{ dots: [act, idle] }]; });
    o.strip = [{ l1: 'c-1', l2: '5 conn.', l3: '0 pend.', dl: m === 'lc' ? '5' : '0', tone: 'acc' }, { l1: 'c-2', l2: '3 conn.', l3: '3 pend.', dl: '3', tone: 'acc' },
      { l1: 'c-3', l2: '4 conn.', l3: '1 pend.', dl: m === 'lc' ? '4' : '1', tone: 'acc' }];
    o.stripLab = m === 'lc' ? 'OPEN CONNECTIONS NOW' : 'PENDING REQUESTS NOW'; o.on.r1 = 2;
    [0, 1, 2].forEach(k => { if (k === 1) for (let j = 0; j < 3; j++) o.beams.push({ pts: R.lb2(o, 1), on: true, dot: 0.94 - j * 0.05, size: 20 }); });
  }
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  // depois do passo: linhas de cada réplica e vigas apagadas (só para quem está no pool)
  function repRows(o, k) {
    const r = o.rep[k], rows = [[`${REP[k].ip}:8080`, 6.8, 'dim']];
    if (r.st === 'out') rows.push(['OUT OF POOL', 10.5, 'bad']); else if (r.st === 'dead') rows.push([sc === 'lor' ? 'NO DB' : 'HUNG', 10.5, 'bad']);
    const v = r.val != null ? r.val : r.n, unit = o.metric === 'requests' ? (v === 1 ? 'request' : 'requests') : o.metric === 'counter' ? '' : o.metric;
    rows.push([o.metric === 'counter' ? `counter ${nf(v)}` : `${nf(v)} ${unit}`, 10.5, r.st === 'ok' || r.st === 'novo' ? (v ? 'hi' : 'dim') : 'dim']);
    r.extra.forEach(e => rows.push(e));
    if (!r.noBar) { const frac = r.cpu != null ? r.cpu / 100 : clamp(r.ms / 2700);
      rows.push({ bar: frac, lab: r.cpu != null ? `CPU ${r.cpu}%` : `work ${nf(r.ms)} ms`, tone: frac >= 0.99 ? 'bad' : '' }); r.frac = frac; } else r.frac = 0;
    return rows;
  }
  function spec() {
    const o = base(); cur().f(o, lt);
    const quiet = o.direct ? [{ pts: R.dir(o, 0) }] : [{ pts: R.cli }, ...o.rep.map((r, k) => r.st === 'out' || (r.st === 'novo') ? null : { pts: R.lb2(o, k) }).filter(Boolean)];
    o.beams = [...quiet, ...o.beams]; o.rows = {}; o.rep.forEach((r, k) => { o.rows['r' + k] = repRows(o, k); });
    o.metricLab = o.metric; return o;
  }

  // ── desenhos nas faces ──
  function frameBox(cv, on, tone) { const { x, P } = cv, u = v => v * P, C = pal3(), light = theme === 'light';
    x.fillStyle = tone === 'bad' ? (light ? '#f4e4e2' : '#24130f') : on ? (light ? '#f6ece2' : '#2a1d12') : C.recess; x.fillRect(0, 0, cv.c.width, cv.c.height);
    x.strokeStyle = tone === 'bad' ? BAD() : on ? accC() : C.line; x.lineWidth = u(on || tone === 'bad' ? 1.2 : 0.5); x.strokeRect(u(0.6), u(0.6), cv.c.width - u(1.2), cv.c.height - u(1.2));
    x.textBaseline = 'middle'; return { x, u, C }; }
  function fitFont(x, u, text, size, maxW) { let s = size; x.font = `700 ${u(s)}px ${MONO3}`; const w = x.measureText(text).width; if (w > u(maxW)) { s = Math.max(6.6, s * u(maxW) / w); x.font = `700 ${u(s)}px ${MONO3}`; } return s; }
  function drawBlock(Bk, rows, on, st) {
    const key = JSON.stringify([rows, on, st]) + theme + accent.getHex(); if (Bk.key !== key) { Bk.key = key;
      const cv = Bk.top, { x, u, C } = frameBox(cv, on === 1 || on === 2, on === 'bad' ? 'bad' : ''), W_ = cv.c.width / cv.P;
      let y = 5; x.textAlign = 'left';   // nenhuma linha abaixo de ~10 unidades: texto fino some no tema claro
      for (const r of rows) {
        if (r.bar != null) { y += 3; const bw = W_ - 14; x.fillStyle = C.line; x.fillRect(u(6), u(y), u(bw), u(5)); x.fillStyle = r.tone === 'bad' ? BAD() : accC(); x.fillRect(u(6), u(y), u(bw * r.bar), u(5));
          y += 14; x.fillStyle = r.tone === 'bad' ? BAD() : C.inkHi; fitFont(x, u, r.lab, 10, W_ - 12); x.fillText(r.lab, u(6), u(y)); y += 10; continue; }
        if (r.dots) { y += 2; const [a, i] = r.dots; for (let j = 0; j < a + i; j++) { const X = 6 + j * 14; if (j < a) { x.fillStyle = accC(); x.fillRect(u(X), u(y), u(10), u(10)); }
            else { x.strokeStyle = INK(); x.lineWidth = u(1.2); x.strokeRect(u(X + 0.6), u(y + 0.6), u(8.8), u(8.8)); } }
          x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(a && i ? `${a} with request · ${i} idle` : a ? `${a} with request` : i ? 'idle' : '', u(6 + (a + i) * 14 + 2), u(y + 5.4));
          y += 14; continue; }
        const [text, s0, tn] = r, s = Math.max(s0, 8.2) * 1.25, lh = s * 1.42; y += lh / 2; x.fillStyle = toneC(tn); fitFont(x, u, text, s, W_ - 12); x.fillText(text, u(6), u(y)); y += lh / 2; }
      if (st === 'dead' || st === 'out') { x.strokeStyle = BAD(); x.lineWidth = u(2); x.beginPath(); x.moveTo(u(W_ - 30), u(6)); x.lineTo(u(W_ - 8), u(28)); x.moveTo(u(W_ - 8), u(6)); x.lineTo(u(W_ - 30), u(28)); x.stroke(); }
      cv.tex.needsUpdate = true; }
    const fk = Bk.lab + Bk.sub + on + st + theme + accent.getHex(); if (Bk.fkey !== fk) { Bk.fkey = fk;
      const cv = Bk.fr, { x, P } = cv, u = v => v * P, C = pal3(); x.fillStyle = theme === 'light' ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height);
      const mid = Bk.fh / 2 + 0.3, big = Math.min(13, Bk.fh - 2.5), small = Math.max(6.6, Math.min(10, Bk.fh - 5));
      x.textBaseline = 'middle'; x.textAlign = 'left'; x.fillStyle = on === 'bad' || st === 'out' || st === 'dead' ? BAD() : on === 1 ? accC() : C.inkHi; x.font = `700 ${u(big)}px ${MONO3}`; x.fillText(Bk.lab, u(3), u(mid));
      const lw = x.measureText(Bk.lab).width / P; x.fillStyle = INK(); x.font = `700 ${u(small)}px ${MONO3}`; x.fillText(Bk.sub, u(8 + lw), u(mid));
      cv.tex.needsUpdate = true; }
    Bk.mat.emissiveIntensity = on === 1 ? 0.55 : on === 2 ? 0.2 : 0;
  }
  const ckey = {};
  const once = (k, v) => { if (ckey[k] === v) return false; ckey[k] = v; return true; };
  function drawScreen(o) {
    const key = JSON.stringify([o.strip, o.stripLab, o.big, o.rule, o.now, o.clock, sc]) + theme + accent.getHex(); if (!once('scr', key)) return;
    const cv = scr, { x } = cv, P = cv.P * SK, u = v => v * P, C = pal3(), acc = accC(), light = theme === 'light';
    x.fillStyle = light ? '#f6f6f5' : '#141516'; x.fillRect(0, 0, cv.c.width, cv.c.height); x.textBaseline = 'middle'; x.textAlign = 'left';
    const lbl = (t, X, Y) => { x.fillStyle = INK(); x.font = `700 ${u(7.6)}px ${MONO3}`; x.fillText(t, u(X), u(Y)); };
    lbl(o.stripLab, 8, 9);
    if (o.strip) {
      const n = o.strip.length, cw = Math.min(46, 322 / n), w = cw - 3;
      o.strip.forEach((c, i) => { const X = 8 + i * cw, on = c.dl != null, bad = c.tone === 'bad';
        x.strokeStyle = on ? (bad ? BAD() : acc) : C.line; x.lineWidth = u(on ? 0.9 : 0.5); x.strokeRect(u(X), u(16), u(w), u(58));
        x.textAlign = 'center'; x.fillStyle = C.inkHi; fitFont(x, u, c.l1, 9.4, w - 3); x.fillText(c.l1, u(X + w / 2), u(24));
        x.fillStyle = INK(); fitFont(x, u, c.l2, 7.6, w - 3); x.fillText(c.l2, u(X + w / 2), u(35));
        if (c.l3) { x.fillStyle = c.big ? acc : INK(); fitFont(x, u, c.l3, 7.6, w - 3); x.fillText(c.l3, u(X + w / 2), u(45)); }
        if (on) { x.fillStyle = bad ? BAD() : acc; x.fillRect(u(X + 1.5), u(55), u(w - 3), u(16)); x.fillStyle = light ? '#ffffff' : '#141516'; fitFont(x, u, c.dl, 8.8, w - 5); x.fillText(c.dl, u(X + w / 2), u(63.5)); }
        else { x.strokeStyle = C.line; x.setLineDash([u(1.5), u(1.2)]); x.strokeRect(u(X + 1.5), u(55), u(w - 3), u(16)); x.setLineDash([]); }
        x.textAlign = 'left'; });
    } else if (o.big) {
      const n = o.big.length, cw = 330 / n;
      o.big.forEach(([nm, v, tn], i) => { const X = 8 + i * cw; x.fillStyle = INK(); x.font = `700 ${u(8)}px ${MONO3}`; x.fillText(nm, u(X), u(26));
        x.fillStyle = toneC(tn); fitFont(x, u, v, 21, cw - 10); x.fillText(v, u(X), u(48)); });
    }
    x.fillStyle = INK(); x.font = `700 ${u(7.4)}px ${MONO3}`; x.fillText(sc === 'health' ? 'pool: who answered the healthcheck' : 'cat 20 ms (small) · search 900 ms (large)', u(8), u(88));
    const L0 = 348; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 9), u(6)); x.lineTo(u(L0 - 9), u(DH - 6)); x.stroke();
    lbl('RULE · ' + SCNAME[sc].toUpperCase(), L0, 9);
    o.rule.slice(0, 2).forEach((l, i) => { x.fillStyle = i ? C.inkHi : acc; fitFont(x, u, l, i ? 8.4 : 10, 164); x.fillText(l, u(L0), u(22 + i * 12)); });
    lbl('NOW', L0, 50);
    o.now.slice(0, 2).forEach((l, i) => { if (!l) return; x.fillStyle = i ? C.inkHi : acc; fitFont(x, u, l, 8.6, 164); x.fillText(l, u(L0), u(62 + i * 12)); });
    if (o.clock) { x.textAlign = 'right'; x.fillStyle = C.inkHi; fitFont(x, u, o.clock, 10, 80); x.fillText(o.clock, u(512), u(9)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">203.0.113.10 is an IP from the documentation range; the internal IPs, the 20 ms and 900 ms and the counters are the example numbers from the module.</li>';
  const qTable = (seq, cap) => `<table class="h3-sum"><tr><th>request</th><th>who · what</th><th>${cap}</th></tr>${Q.map((q, i) => `<tr><td>${q.p}</td><td>${CLI[q.c].n} · ${KIND[q.k].lab} ${KIND[q.k].ms} ms</td><td>catalogo-${seq[i] + 1}</td></tr>`).join('')}</table>`;
  const DATA = {
    sem: () => `<li><b>cat</b> = ${KIND.g.path} (20 ms) · <b>search</b> = ${KIND.b.path} (900 ms)</li>${qTable(SEQ.zero, 'goes to')}<li>catalogo-1: 6 × 20 + 3 × 900 = <b>2,820 ms</b> of work, CPU <b>100%</b> · catalogo-2 and 3: <b>0%</b></li><li>Plush cat page: <b>20 ms</b> alone, <b>1.8 s</b> queued behind a full CPU</li>${EX}`,
    health: () => `<table class="h3-sum"><tr><th>time</th><th>GET /health on catalogo-2</th><th>pool</th></tr><tr><td>19:59:55</td><td>200 OK</td><td>1 · 2 · 3</td></tr><tr><td>20:00:00</td><td>hangs</td><td>1 · 2 · 3</td></tr><tr><td>20:00:05</td><td>timeout (1/3)</td><td>1 · 2 · 3</td></tr><tr><td>20:00:10</td><td>timeout (2/3)</td><td>1 · 2 · 3</td></tr><tr class="on"><td>20:00:15</td><td>timeout (3/3)</td><td>1 · 3</td></tr><tr><td>20:05:05</td><td>200 OK (1/2)</td><td>1 · 3</td></tr><tr class="on"><td>20:05:10</td><td>200 OK (2/2)</td><td>1 · 2 · 3</td></tr></table>
      <li>Interval <b>5 s</b> × <b>3</b> failures = up to <b>15 s</b> with 1 in every 3 requests failing (502/504)</li><li>New replica: catalogo-4 <b>10.0.1.14</b>, joins the pool on the first 200</li>${EX}`,
    rr: () => `${qTable(SEQ.rr, 'round robin')}<li>Work: catalogo-1 <b>60 ms</b> · catalogo-2 <b>2,700 ms</b> (P2, P5, P8) · catalogo-3 <b>60 ms</b></li><li>With weight 2 on catalogo-3 (lap 1, 2, 3, 3): <b>3 · 2 · 4</b> requests</li><li>With a 300 ms quantum and one request every 200 ms: <b>1, 1, 2, 2, 3, 3, 1, 1, 2</b></li>${EX}`,
    lr: () => `<li>One counter per replica: the next one goes to the <b>lowest</b>; on a tie, to the first on the list</li><li>Replicas together since the start: <b>3 · 3 · 3</b>, same as round robin</li><li>catalogo-4 joins with <b>0</b> against <b>3,000</b>: the next <b>3,000</b> requests all go to it</li><li>Fix: reset the counters from time to time or count only a recent window.</li>${EX}`,
    lc: () => `<table class="h3-sum"><tr><th>replica</th><th>connections</th><th>with request</th><th>idle</th></tr><tr><td>catalogo-1</td><td>5</td><td>0</td><td>5</td></tr><tr class="on"><td>catalogo-2</td><td>3</td><td>3 searches</td><td>0</td></tr><tr><td>catalogo-3</td><td>4</td><td>1</td><td>3</td></tr></table><li>Least connection: min(5, 3, 4) = 3 → <b>catalogo-2</b>, the busiest</li><li>Keep-alive leaves the connection open after the response; it counts as a connection without giving any work.</li>${EX}`,
    lor: () => `<table class="h3-sum"><tr><th>replica</th><th>connections (LC)</th><th>pending (LOR)</th></tr><tr class="on"><td>catalogo-1</td><td>5</td><td>0</td></tr><tr><td>catalogo-2</td><td>3</td><td>3</td></tr><tr><td>catalogo-3</td><td>4</td><td>1</td></tr></table><li>LOR: min(0, 3, 1) = 0 → <b>catalogo-1</b>, which answers the plush cat in 20 ms</li><li>A replica that answers 500 in 1 ms always has 0 pending: it needs a healthcheck or outlier detection (Envoy removes the host after consecutive 5xx).</li>${EX}`,
    hash: () => `<table class="h3-sum"><tr><th>client</th><th>IP</th><th>h</th><th>h % 3</th></tr>${'LBCD'.split('').map(c => `<tr${c === 'L' ? ' class="on"' : ''}><td>${CLI[c].n}</td><td>${CLI[c].ip}</td><td>${CLI[c].h}</td><td>${CLI[c].h % 3} → catalogo-${CLI[c].h % 3 + 1}</td></tr>`).join('')}</table>
      <li>The example h uses the last two numbers of the IP: 20 × 256 + 5 = <b>5125</b>. NGINX and Envoy use real hash functions; the idea is the same.</li><li>Without catalogo-3: with % 2, about <b>2/3</b> move (only h % 6 = 0 or 1 stay); with consistent hashing or Maglev, only <b>1/3</b> (those who were on 3).</li><li>NAT: <b>500</b> people behind <b>187.11.90.2</b> → all on catalogo-3.</li>${EX}`,
    random: () => `<li>Draw for the 10 requests in this example: <b>2, 1, 2, 3, 2, 2, 3, 1, 2, 3</b> → <b>2 · 5 · 3</b></li><li>Work: catalogo-1 <b>1,800 ms</b> (P2 and P8, searches) · catalogo-2 <b>980 ms</b> · catalogo-3 <b>60 ms</b></li><li>10,000 requests: <b>3,341 · 3,329 · 3,330</b>, close to 1/3 each</li>${EX}`,
  };
  function countHtml() { const o = SP || spec();
    return `<table class="h3-sum b3-cnt"><tr><th>replica</th><th>${o.metricLab}</th><th>work</th></tr>${o.rep.map((r, k) => { const v = r.val != null ? r.val : r.n;
      return `<tr${o.on['r' + k] ? ' class="on"' : ''}><td>${REP[k].n}</td><td>${r.st === 'out' ? 'out of pool' : r.st === 'dead' ? (sc === 'lor' ? '500 in 1 ms' : 'hung') : nf(v)}</td><td>${r.noBar ? '—' : r.cpu != null ? 'CPU ' + r.cpu + '%' : nf(r.ms) + ' ms'}</td></tr>`; }).join('')}</table>`; }
  const cfgHtml = o => `<b>${o.cfg[0]}</b>${o.cfg.slice(1).join('\n').replace(/</g, '&lt;')}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Step ${step + 1} of ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Scenario">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="key ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div id="b3count">${countHtml()}</div>
      <div class="i3-sql">${cfgHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Look at the drawing</b>${s.look}</p>
      <p class="o3-key"><b>In one sentence</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Real data</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'lb') return; const o = SP || spec();
    document.getElementById('read').textContent = `step ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.rep.map(r => nf(r.val != null ? r.val : r.n)).join(' · ')} ${o.metricLab}`; }
  function render() {
    const info = document.getElementById('info'); if (active === 'lb' && info) { SP = spec(); info.innerHTML = panelHtml(); info.scrollTop = 0; cntKey = ''; }
    readout();
  }
  function go(i) { step = Math.max(0, Math.min(N() - 1, i)); lt = 0; dwell = 0; followT = 2.6; render(); SFX.bit(1); return true; }
  const next = () => go(step + 1 >= N() ? 0 : step + 1), prev = () => go(step - 1), reset = () => go(0);
  const auto = () => { playing = !playing; dwell = 0; return true; };
  const setSc = v => { sc = v; try { localStorage.setItem('sdlabs-lb3d-sc', v); } catch (e) {} backLink(); return go(0); };
  const cycleSc = () => setSc(SC[(SC.indexOf(sc) + 1) % SC.length]);
  document.getElementById('info')?.addEventListener('click', e => { if (active !== 'lb') return; const b = e.target.closest('[data-sc]'); if (b) setSc(b.dataset.sc); });
  backLink();

  // ── um quadro da cena ──
  const NAMES = ['r0', 'r1', 'r2', 'r3', 'lb'];
  function scene3() {
    const o = SP = spec();
    NAMES.forEach(nm => { const Bk = B[nm], p = o.pos[nm], vis = !!p;
      Bk.g.visible = vis; if (!vis) { Bk.pos = null; return; }
      const want = [p[0], p[1], PL];
      if (!Bk.pos) { Bk.pos = want.slice(); Bk.to = want; Bk.from = want; }
      if (want.some((v, i) => v !== Bk.to[i])) { Bk.from = Bk.pos.slice(); Bk.to = want; Bk.t0 = clk; }
      const f = ease(clamp((clk - Bk.t0) / 0.9)); Bk.pos = lerp3(Bk.from, Bk.to, f); Bk.g.position.copy(W(...Bk.pos));
      if (nm === 'lb') drawBlock(Bk, o.lb, o.lb.length ? 2 : 0, 'ok');
      else { const k = +nm[1], r = o.rep[k]; drawBlock(Bk, o.rows[nm], o.on[nm] || 0, r.st);
        const hgt = 3 + COLMAX * (r.frac || 0); Bk.colH += (hgt - Bk.colH) * 0.15;
        Bk.colM.position.copy(W(BW + 5 + COLW / 2, BD - 14, Bk.colH / 2)); Bk.colM.scale.set(COLW * TS, Bk.colH * TS, COLW * TS);
        Bk.colM.material.color.set(r.frac >= 0.99 || r.st === 'dead' ? BAD() : r.frac > 0.005 ? '#' + accent.getHexString() : pal3().line); } });
    setBeams(o.beams); drawScreen(o);
    TAGS.forEach((t, i) => { const g = o.tags[i]; if (g) t.set(g[3], g[4]).at(g[0], g[1], g[2]); else t.hide(); });
    if (o.who) { const c = CLI[o.who]; WHO.set(`${c.n} · ${c.city}\n${c.ip}`, 'dim').at(...TP(o, 'who')); } else WHO.hide();
    MSGS.forEach((t, i) => { const m = o.msgs[o.msgs.length - 1 - i]; if (!m) return t.hide(); const cum = cumLen(m[0]), p = alongPts(m[0], cum, m[1]);
      t.set(m[2], m[3]).at(p[0], p[1], 40); });
  }

  // ── câmera ──
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.25) : 0; last = now;
    lt += dt; clk += dt; if (lt > cur().dur + 3) lt = 0;
    scene3();
    if (now - nowAt > 200) { nowAt = now; const el = document.getElementById('b3count'), h = countHtml(); if (el && h !== cntKey) { cntKey = h; el.innerHTML = h; } readout(); }
    followT -= dt;
    if (followT > 0 && dt > 0) {
      // enquadra a cena na área livre (à direita do painel no desktop, acima dele no celular/embed)
      const [x0, x1, y0, y1] = [-130, 790, 8, 465];
      const nar = NARROW() && !POSTER, asp = innerWidth / innerHeight, tn = Math.tan(persp.fov * Math.PI / 360), side = POSTER ? 0 : 500 / innerWidth;
      const aW = POSTER ? 0.92 : nar ? 0.99 : 0.97 - side, aH = POSTER ? 0.8 : nar ? Math.max(0.3, 1 - (0.4 * innerHeight + 76) / innerHeight - 0.08) : 0.86;
      const span = x1 - x0 + y1 - y0, D = Math.max(span * 0.707 / 100 * 1.02 / (2 * tn * asp * aW), (span * 0.33 + 80) / 100 * 1.02 / (2 * tn * aH));
      const fx = POSTER ? 0.5 : nar ? 0.5 : side + aW / 2, fy = POSTER ? 0.45 : nar ? 0.07 + aH * 0.6 : 0.52;
      const dir = camera.position.clone().sub(controls.target).normalize(), Rv = new THREE.Vector3().crossVectors(dir.clone().negate(), camera.up).normalize(), U = new THREE.Vector3().crossVectors(Rv, dir.clone().negate()).normalize();
      const C = W((x0 + x1) / 2, (y0 + y1) / 2, 45), Tg = C.addScaledVector(Rv, -(fx - 0.5) * 2 * D * tn * asp).addScaledVector(U, -(0.5 - fy) * 2 * D * tn);
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
    if (/^[1-8]$/.test(e.key)) return setSc(SC[+e.key - 1]);
    return false;
  }
  function click() { next(); }
  // texto miúdo no claro: a textura reduzida (mipmap) mistura o traço com o fundo em luz linear e a tinta escura perde contraste.
  // No claro, a textura é lida crua e o shader converte de sRGB depois de filtrar (média em gama, como a tela reduz texto).
  const CANV = () => [...NAMES.flatMap(nm => [B[nm].top, B[nm].fr]), scr];
  CANV().forEach(cv => gamFix(cv.mesh.material));
  const crisp = light => { GAM.value = light ? 1 : 0; CANV().forEach(cv => { const cs = light ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    if (cv.tex.colorSpace !== cs) { cv.tex.colorSpace = cs; cv.tex.needsUpdate = true; } }); };
  themeHooks.push(t => { crisp(t === 'light'); tags.forEach(t => { if (t.text != null) { t.force = true; t.set(t.text, t.tone); } });
    for (const k in ckey) delete ckey[k]; NAMES.forEach(nm => { B[nm].key = ''; B[nm].fkey = ''; });
    beamOff.color.set(pal3().line); beamOn.color.copy(accent); beamBad.color.set(BAD()); });
  render();
  if (document.documentElement.classList.contains('embedded')) controls.enableZoom = false;
  return { group: g0, key, click, tick, readout, demo: () => go(1), stop: () => { playing = false; },
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Switch scenario', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 230, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 230, 60), dist: 14 },
    info: panelHtml(),
    hint: 'next: → · back: ← · scenario: C or 1–8 · drag to rotate' };
})() });
