// Figura 3D (iso-glow): o balanceador de carga. A loja na Black Friday: o lb-loja (203.0.113.10) na frente das réplicas do
// catálogo (catalogo-1/2/3, 10.0.1.11–13:8080; o catalogo-4, 10.0.1.14, entra quando a história pede). A fila de 9 pedidos
// (P1 Lena gato · P2 Bia busca · … · P9 Lena gato) chega pela esquerda e cada algoritmo decide para onde vai cada pacote
// (gato pequeno, 20 ms; busca grande, 900 ms). Ao fundo, o mostrador com a fila e a regra; em cima de cada réplica, o contador
// do algoritmo (pedidos, conexões, pendentes) e a barra de trabalho; ao lado, a coluna de carga.
// Cenários (toggle e ?mode=sem|health|rr|lr|lc|lor|hash|random; ?step=N abre no passo N).
// Dados: a história canônica do módulo (docs/escrita/load-balancers-brief.md).
FIGS3D.push({ id: 'lb', name: 'Balanceador', mod: (() => {
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
  const nf = n => Math.round(n).toLocaleString('pt-BR');

  // ── dados (os mesmos do texto, do quiz e do glossário) ──
  const REP = [['catalogo-1', '10.0.1.11'], ['catalogo-2', '10.0.1.12'], ['catalogo-3', '10.0.1.13'], ['catalogo-4', '10.0.1.14']].map(([n, ip]) => ({ n, ip }));
  // h: o número do exemplo para o IP hash (os dois últimos números do IP: 20 × 256 + 5 = 5125)
  const CLI = { L: { n: 'Lena', city: 'Recife', ip: '177.38.20.5', h: 5125 }, B: { n: 'Bia', city: 'SP', ip: '189.6.44.10', h: 11274 },
    C: { n: 'Caio', city: 'Rio', ip: '200.150.7.33', h: 1825 }, D: { n: 'Davi', city: 'SP', ip: '187.11.90.2', h: 23042 } };
  const KIND = { g: { lab: 'gato', path: 'GET /produtos/42', ms: 20 }, b: { lab: 'busca', path: 'GET /busca?q=pelucia&ordem=preco', ms: 900 } };
  const Q = 'Lg Bb Cg Dg Lb Bg Cg Db Lg'.split(' ').map((s, i) => ({ p: 'P' + (i + 1), c: s[0], k: s[1] }));
  const SEQ = { zero: [0, 0, 0, 0, 0, 0, 0, 0, 0], rr: [0, 1, 2, 0, 1, 2, 0, 1, 2], peso: [0, 1, 2, 2, 0, 1, 2, 2, 0], qt: [0, 0, 1, 1, 2, 2, 0, 0, 1],
    hash: Q.map(q => CLI[q.c].h % 3), rnd: [1, 0, 1, 2, 1, 1, 2, 0, 1, 2] };
  const SC = ['sem', 'health', 'rr', 'lr', 'lc', 'lor', 'hash', 'random'];
  const SCNAME = { sem: 'Sem LB', health: 'Health', rr: 'RR', lr: 'LR', lc: 'LC', lor: 'LOR', hash: 'Hash', random: 'Random' };
  const SCFULL = { sem: 'Sem balanceador', health: 'Healthcheck', rr: 'Round robin', lr: 'Least request', lc: 'Least connection',
    lor: 'Least outstanding requests', hash: 'IP hash e Maglev', random: 'Random' };
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
    sem: ['Sem balanceador', 'loja.com.br → um endereço só', 'todo pedido → catalogo-1:8080'],
    health: ['Healthcheck (Envoy)', 'health_checks:', '- timeout: 1s', '  interval: 5s', '  unhealthy_threshold: 3', '  healthy_threshold: 2', '  http_health_check: { path: /health }'],
    rr: ['Configuração (NGINX)', 'upstream catalogo {', '  server 10.0.1.11:8080;', '  server 10.0.1.12:8080;', '  server 10.0.1.13:8080;', '}   # sem diretiva = round robin'],
    peso: ['Configuração (NGINX)', 'upstream catalogo {', '  server 10.0.1.11:8080;', '  server 10.0.1.12:8080;', '  server 10.0.1.13:8080 weight=2;', '}'],
    qt: ['Código Go do artigo', 'quantum: 300 * time.Millisecond', 'if time.Now().Before(ultimoAcesso.Add(quantum)) {', '  return hosts[index]  // mesma vez', '}', 'index = (index + 1) % len(hosts)'],
    lr: ['Código Go do artigo', 'for i, reqs := range lr.requests {', '  if reqs < minRequests { minIndex = i … }', '}', 'lr.requests[minIndex]++   // nunca zera'],
    lc: ['Configuração (NGINX)', 'upstream catalogo {', '  least_conn;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
    lor: ['AWS ALB (target group)', 'load_balancing.algorithm.type =', '  least_outstanding_requests'],
    hash: ['Configuração (NGINX)', 'upstream catalogo {', '  hash $remote_addr;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
    maglev: ['Configuração (NGINX · Envoy)', 'hash $remote_addr consistent;', '# no Envoy: lb_policy: MAGLEV'],
    random: ['Configuração (NGINX)', 'upstream catalogo {', '  random;', '  server 10.0.1.11:8080;  # … 12, 13', '}'],
  };
  function base() {
    const s = L()[step], four = !!s.four, n = four ? 4 : 3, X = four ? SLOT4 : SLOT3;
    const o = { n, pos: {}, on: {}, beams: [], tags: [], msgs: [], rep: [], strip: Q.map(q => ({ l1: q.p, l2: CLI[q.c].n, l3: KIND[q.k].lab, big: q.k === 'b', dl: null })),
      stripLab: 'FILA · ORDEM DE CHEGADA', big: null, rule: [], now: [], clock: '', cfg: CFG[s.cfg || sc], lb: [], who: null, metric: 'pedidos', direct: sc === 'sem' };
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
  const HL = [['19:59:55', 'GET', '200'], ['20:00:00', 'trava', 'trava'], ['20:00:05', 'timeout', '1/3 ✕'], ['20:00:10', 'timeout', '2/3 ✕'],
    ['20:00:15', 'timeout', 'fora'], ['20:05:05', '200 OK', '1/2 ✓'], ['20:05:10', '200 OK', 'volta']];
  const healthStrip = (o, upto) => { o.stripLab = 'HEALTHCHECK DO catalogo-2 · A CADA 5 s'; o.strip = HL.map(([a, b, c], i) => ({ l1: a.slice(0, 5), l2: a.slice(5), l3: b,
    dl: i < upto ? c : null, tone: i === 0 || i >= 5 ? 'acc' : 'bad' })); };
  const lbRows = (o, a, b, c) => { o.lb = [[a, 6.8, 'dim'], [b, 10.5, 'acc']]; if (c) o.lb.push([c, 8.2]); };
  // amostra de 12 clientes (h de 0 a 11) para mostrar quem troca de réplica quando o catalogo-3 sai
  const sample = (o, t, cons) => { o.stripLab = cons ? 'CLIENTES h = 0…11 · CONSISTENTE' : 'CLIENTES h = 0…11 · ANTES % 3 → AGORA % 2'; let moved = 0, shown = 0;
    o.strip = Array.from({ length: 12 }, (_, h) => { const was = h % 3, now = cons ? (was === 2 ? (h % 2 ? 1 : 0) : was) : h % 2, mv = now !== was, vis = t > 0.4 + h * 0.3;
      if (vis) { shown++; if (mv) moved++; } return { l1: `h ${h}`, l2: `era ${was + 1}`, l3: '', dl: vis ? (mv ? `→ ${now + 1}` : `fica`) : null, tone: mv ? 'bad' : 'acc' }; });
    return { moved, shown }; };

  const STEPS = {
    sem: [
      { id: 'um', dur: 3.5, title: 'Um IP só: tudo cai no catalogo-1',
        story: 'Black Friday. O catálogo roda em 3 réplicas, mas a Lena digita loja.com.br e o DNS devolve um endereço só, o do catalogo-1. Sem ninguém no meio para dividir, o primeiro pedido dela, a página do gato (GET /produtos/42), vai direto para lá.',
        look: 'O P1 sai da Lena e acende o catalogo-1; o 2 e o 3 ficam apagados, sem nenhum caminho até eles.',
        key: 'Um endereço só leva todo mundo para a mesma réplica.',
        f(o, t) { o.rule = ['sem balanceador', 'o DNS dá um IP: o do catalogo-1']; flow(o, t, asg(SEQ.zero, 0, 1));
          o.now = t > 1.2 ? ['P1 · Lena · gato', '→ catalogo-1 · 20 ms'] : ['a Lena abre loja.com.br', ''];
          if (t > 1.6) { T(o, 1, 'nenhum pedido\nnão há caminho', 'dim'); T(o, 2, 'nenhum pedido\nnão há caminho', 'dim'); } } },
      { id: 'fila', dur: 7.5, title: '9 pedidos, 1 réplica: CPU em 100%',
        story: 'Chegam os outros 8 pedidos da fila. Bia, Caio e Davi também abrem o gato, e três pedidos são a busca pesada de 900 ms. Todos caem no catalogo-1, que soma 2.820 ms de trabalho e bate 100% de CPU; o catalogo-2 e o catalogo-3 seguem em 0%.',
        look: 'Os pacotes, 6 pequenos (gato) e 3 grandes (busca), entram todos no catalogo-1, e a coluna dele sobe até o topo.',
        key: 'Réplica a mais não ajuda se o tráfego não chega até ela.',
        f(o, t) { o.rule = ['sem balanceador', 'o DNS dá um IP: o do catalogo-1']; pre(o, asg(SEQ.zero, 0, 1)); const c = flow(o, t, asg(SEQ.zero, 1, 9), { gap: 0.65 });
          const r = o.rep[0]; r.cpu = Math.min(100, Math.round(r.ms / 28.2)); o.rep[1].cpu = o.rep[2].cpu = 0;
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, '→ catalogo-1'] : ['P1 já chegou', ''];
          if (r.n === 9) { o.on.r0 = 'bad'; T(o, 0, '9 pedidos · 2.820 ms\nCPU 100%', 'bad'); T(o, 1, 'CPU 0%', 'dim'); T(o, 2, 'CPU 0%', 'dim'); } } },
      { id: 'lento', dur: 5, title: 'E se der errado: o gato vai de 20 ms para 1,8 s',
        story: 'Com a CPU em 100%, cada pedido espera os da frente. A página do gato, que sozinha leva 20 ms, passa a levar 1,8 s, e as buscas atrás dela demoram ainda mais. Enquanto isso, duas réplicas pagas não fazem nada. Falta alguém na frente que divida a fila: o balanceador.',
        look: 'O catalogo-1 fica vermelho, com o P9 da Lena parado na porta; o 2 e o 3, apagados, marcam 0%.',
        key: 'Sem balanceador, escalar é só pagar por réplicas paradas.',
        f(o, t) { o.rule = ['sem balanceador', 'o DNS dá um IP: o do catalogo-1']; pre(o, asg(SEQ.zero)); o.rep[0].cpu = 100; o.rep[1].cpu = o.rep[2].cpu = 0; o.on.r0 = 'bad';
          o.strip.forEach(c => c.tone = 'bad'); o.who = 'L'; o.now = ['P9 · Lena · gato', 'sozinho 20 ms · na fila 1,8 s'];
          const f = clamp((t - 0.3) / 1.2) * 0.86; o.beams.push({ pts: R.dir(o, 0), on: true, tone: 'bad', dot: f, size: 11, cut: Math.max(f, 0.02) });
          if (t > 0.3) o.msgs.push([R.dir(o, 0), f, 'P9 · Lena · gato', 'bad']);
          if (t > 1.6) T(o, 0, 'gato: 20 ms → 1,8 s\nCPU 100%', 'bad'); if (t > 2.3) { T(o, 1, 'CPU 0% · parado', 'dim'); T(o, 2, 'CPU 0% · parado', 'dim'); } } },
    ],
    health: [
      { id: 'ok', dur: 5, title: 'GET /health a cada 5 s: os 3 respondem 200',
        story: 'Agora o lb-loja (203.0.113.10) está na frente e o DNS aponta para ele. Para saber quem pode receber pedido, ele manda GET /health para cada réplica a cada 5 s e espera no máximo 1 s. Às 19:59:55 as três respondem 200 OK: estão no pool.',
        look: 'Três pings saem do lb-loja, um para cada réplica, e voltam com 200; o relógio do mostrador marca 19:59:55.',
        key: 'Healthcheck: o balanceador pergunta, e a réplica prova que está viva.',
        f(o, t) { o.rule = ['GET /health a cada 5 s', 'timeout 1 s · 3 falhas saem · 2 voltam']; o.clock = '19:59:55'; healthStrip(o, t > 1.6 ? 1 : 0);
          lbRows(o, 'healthcheck', 'a cada 5 s', 'pool: 1 · 2 · 3'); o.metric = 'pedidos';
          [0, 1, 2].forEach(k => { if (ping(o, t, 0.4, k, '200 OK', 'acc', k === 1)) { o.rep[k].extra = [['health: 200 OK', 8.2, 'acc']]; o.on['r' + k] = 2; } });
          o.now = t > 1.6 ? ['os 3 responderam 200 OK', 'pool: catalogo-1, 2 e 3'] : ['GET /health → as 3 réplicas', ''];
          if (t > 2.2) T(o, 'lb', 'no pool: 1 · 2 · 3', 'acc'); } },
      { id: 'trava', dur: 7, title: 'E se der errado: 20:00:00, o catalogo-2 trava',
        story: 'Às 20:00:00 o catalogo-2 trava. O lb-loja ainda não sabe: continua no round robin e manda 1 de cada 3 pedidos para ele, que não responde, e a Bia recebe 502. Às 20:00:05 o healthcheck dele estoura o timeout de 1 s: falha 1 de 3.',
        look: 'O catalogo-2 fica vermelho; os pedidos que caem nele voltam como 502 e a linha do tempo marca a falha 1/3.',
        key: 'Entre travar e sair do pool, os pedidos continuam chegando na réplica morta.',
        f(o, t) { o.rule = ['GET /health a cada 5 s', 'timeout 1 s · 3 falhas saem · 2 voltam']; o.clock = clockAt(T20 + Math.min(5, Math.floor(t))); healthStrip(o, t > 5.9 ? 3 : 2);
          lbRows(o, 'healthcheck', 'pool: 1 · 2 · 3', 'ainda não sabe'); o.rep[1].st = 'dead'; o.on.r1 = 'bad';
          flow(o, t, asg(SEQ.rr, 0, 6).map(it => it.to === 1 ? { ...it, res: '502' } : it), { gap: 0.72 });
          ping(o, t, 4.8, 1, 'timeout 1 s', 'bad'); o.rep[1].extra = [[`falhas seguidas: ${t > 5.9 ? 1 : 0}/3`, 8.2, 'bad']];
          o.now = t > 5.9 ? ['20:00:05: o check estourou 1 s', 'falha 1 de 3 · ainda no pool'] : ['o catalogo-2 travou às 20:00:00', '1 de cada 3 pedidos → 502'];
          if (t > 2.2) T(o, 1, 'travado · 502\n1 de cada 3 pedidos', 'bad'); } },
      { id: 'fora', dur: 7.5, title: '3 falhas seguidas: fora do pool às 20:00:15',
        story: 'Às 20:00:10 e às 20:00:15 o healthcheck falha de novo. São 3 falhas seguidas, e o lb-loja tira o catalogo-2 do pool. Nesses 15 s, 1 de cada 3 pedidos falhou. A partir de agora, 100% dos pedidos vão para o catalogo-1 e o catalogo-3.',
        look: 'A linha do tempo vai a 3/3, o catalogo-2 mostra FORA DO POOL e o caminho até ele some; os pacotes só vão para o 1 e o 3.',
        key: '5 s × 3 falhas = até 15 s de erros antes de a réplica sair.',
        f(o, t) { o.rule = ['GET /health a cada 5 s', 'timeout 1 s · 3 falhas saem · 2 voltam']; const out = t > 3.9; healthStrip(o, t > 3.9 ? 5 : t > 1.6 ? 4 : 3);
          o.clock = t < 1.6 ? '20:00:10' : '20:00:15'; o.rep[1].st = out ? 'out' : 'dead'; o.on.r1 = 'bad';
          ping(o, t, 0.4, 1, 'timeout 1 s', 'bad'); ping(o, t, 2.7, 1, 'timeout 1 s', 'bad');
          o.rep[1].extra = [[`falhas seguidas: ${t > 3.9 ? 3 : t > 1.6 ? 2 : 1}/3`, 8.2, 'bad']];
          lbRows(o, 'healthcheck', out ? 'pool: 1 · 3' : 'pool: 1 · 2 · 3', out ? 'catalogo-2 saiu' : 'contando falhas');
          if (out) flow(o, t, asg([0, 2, 0, 2, 0, 2], 0, 6).map((it, i) => ({ ...it, p: Q[i].p })), { t0: 4.3, gap: 0.6 });
          o.now = out ? ['20:00:15: 3ª falha seguida', 'fora do pool · pedidos só no 1 e no 3'] : ['20:00:10: falha 2 de 3', 'ainda no pool: 1 em 3 falha'];
          if (out) { T(o, 1, 'fora do pool às 20:00:15\n15 s de 502 para 1 em 3', 'bad'); if (t > 5) T(o, 'lb', '100% para o 1 e o 3', 'acc'); } } },
      { id: 'volta', dur: 7.5, title: 'Volta às 20:05:00; no pool às 20:05:10',
        story: 'Às 20:05:00 o catalogo-2 reinicia. O healthcheck das 20:05:05 passa (1 de 2) e o das 20:05:10 também (2 de 2): às 20:05:10 ele volta ao pool e recebe pedidos de novo. Pedir 2 sucessos evita devolver uma réplica que acerta uma vez e cai de novo.',
        look: 'Os pings voltam com 200 do catalogo-2, 1/2 e 2/2; o caminho reaparece e ele acende de novo.',
        key: 'Para voltar, a réplica precisa acertar mais de uma vez seguida.',
        f(o, t) { o.rule = ['GET /health a cada 5 s', 'timeout 1 s · 3 falhas saem · 2 voltam']; const back = t > 3.9; healthStrip(o, t > 3.9 ? 7 : t > 1.6 ? 6 : 5);
          o.clock = t < 0.4 ? '20:05:00' : t < 2.7 ? '20:05:05' : '20:05:10'; o.rep[1].st = back ? 'ok' : 'out';
          o.rep[1].extra = [[back ? 'health: 2/2 · no pool' : `reiniciou · ok ${t > 1.6 ? 1 : 0}/2`, 8.2, 'acc']];
          ping(o, t, 0.4, 1, '200 OK · 1/2'); ping(o, t, 2.7, 1, '200 OK · 2/2');
          lbRows(o, 'healthcheck', back ? 'pool: 1 · 2 · 3' : 'pool: 1 · 3', back ? 'catalogo-2 voltou' : 'contando sucessos');
          if (back) flow(o, t, asg(SEQ.rr, 0, 3), { t0: 4.3, gap: 0.7 });
          o.now = back ? ['20:05:10: 2º sucesso seguido', 'de volta ao pool'] : ['20:05:00: o catalogo-2 reiniciou', 'precisa de 2 checks ok'];
          if (back && t > 4.6) T(o, 1, 'de volta às 20:05:10', 'acc'); } },
      { id: 'novo', four: true, dur: 7.5, title: 'Escalar: entra o catalogo-4',
        story: 'A fila não para de crescer e a loja liga mais uma réplica, o catalogo-4 (10.0.1.14). Ninguém precisa avisar o lb-loja à mão: o primeiro GET /health do catalogo-4 volta 200 e, a partir daí, ele entra no pool e recebe a sua parte dos pedidos.',
        look: 'Um quarto bloco aparece; o ping volta 200 e o pedido seguinte já vai para ele.',
        key: 'O healthcheck também decide quem entra: escalar é ligar a réplica e esperar o primeiro 200.',
        f(o, t) { o.rule = ['GET /health a cada 5 s', 'réplica nova: entra no 1º 200']; const inn = t > 2.2;
          o.stripLab = 'HEALTHCHECK DO catalogo-4'; o.strip = [{ l1: 'liga', l2: '10.0.1.14', l3: '', dl: 'novo', tone: 'acc' }, { l1: 'GET', l2: '/health', l3: '', dl: inn ? '200' : null, tone: 'acc' },
            { l1: 'pool', l2: '1·2·3·4', l3: '', dl: inn ? 'entra' : null, tone: 'acc' }];
          o.rep[3].st = inn ? 'ok' : 'novo'; o.rep[3].extra = [[inn ? 'health: 200 OK' : 'esperando o 1º check', 8.2, inn ? 'acc' : 'dim']];
          ping(o, t, 1.0, 3, '200 OK'); lbRows(o, 'healthcheck', inn ? 'pool: 1 · 2 · 3 · 4' : 'pool: 1 · 2 · 3', inn ? 'catalogo-4 entrou' : 'catalogo-4 ligou');
          if (inn) flow(o, t, asg([0, 1, 2, 3], 0, 4), { t0: 2.8, gap: 0.65 });
          o.now = inn ? ['1º GET /health: 200 OK', 'catalogo-4 no pool'] : ['catalogo-4 ligou (10.0.1.14)', 'ainda fora: falta o 1º check'];
          if (t > 5.4) T(o, 3, 'no pool: recebe a sua parte', 'acc'); } },
    ],
    rr: [
      { id: 'vez', dur: 4, title: 'Round robin: cada uma na sua vez',
        story: 'O lb-loja usa a regra mais simples: round robin. Ele guarda só um ponteiro e entrega cada pedido para a próxima réplica da lista. O P1 da Lena vai para o catalogo-1, o P2 da Bia para o catalogo-2, o P3 do Caio para o catalogo-3.',
        look: 'Os 3 primeiros pacotes saem um para cada réplica, e o ponteiro no lb-loja anda 1, 2, 3.',
        key: 'Round robin: o próximo pedido vai para a próxima réplica da lista, em círculo.',
        f(o, t) { o.rule = ['round robin', 'próximo pedido → próxima réplica']; const c = flow(o, t, asg(SEQ.rr, 0, 3));
          const ptr = o.rep.reduce((a, r) => a + r.n, 0) % 3; lbRows(o, 'round robin', `ponteiro → ${ptr + 1}`, 'lista: 1 · 2 · 3');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `vez do catalogo-${c.to + 1}`] : ['ponteiro no 1', '']; } },
      { id: 'fila', dur: 6.5, title: '9 pedidos: 3 para cada',
        story: 'O ponteiro volta ao começo e a fila segue: P4 no 1, P5 no 2, P6 no 3, e assim até o P9. Cada réplica recebeu 3 pedidos. Pela contagem, a divisão é perfeita.',
        look: 'Os contadores em cima das réplicas sobem juntos até 3 · 3 · 3.',
        key: 'Round robin divide o número de pedidos sem olhar o que cada um custa.',
        f(o, t) { o.rule = ['round robin', 'próximo pedido → próxima réplica']; pre(o, asg(SEQ.rr, 0, 3)); const c = flow(o, t, asg(SEQ.rr, 3, 9), { gap: 0.65 });
          lbRows(o, 'round robin', `ponteiro → ${o.rep.reduce((a, r) => a + r.n, 0) % 3 + 1}`, 'lista: 1 · 2 · 3');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `vez do catalogo-${c.to + 1}`] : ['P1 a P3 já foram', ''];
          if (o.rep[2].n === 3) T(o, 'lb', '3 · 3 · 3 pedidos', 'acc'); } },
      { id: 'peso', cfg: 'peso', dur: 7, title: 'Com peso: o catalogo-3 tem o dobro de CPU',
        story: 'Se o catalogo-3 tiver o dobro de CPU, dá para dar peso 2 a ele: em cada volta do ponteiro ele aparece duas vezes (1, 2, 3, 3). Dos mesmos 9 pedidos, ele recebe 4, o catalogo-1 recebe 3 e o catalogo-2 recebe 2.',
        look: 'O ponteiro passa duas vezes no catalogo-3; os contadores terminam em 3 · 2 · 4.',
        key: 'Peso diz quantas vezes a réplica entra em cada volta do ponteiro.',
        f(o, t) { o.rule = ['round robin com peso', 'volta: 1 · 2 · 3 · 3']; const c = flow(o, t, asg(SEQ.peso), { gap: 0.62 });
          lbRows(o, 'round robin · peso', 'volta: 1 · 2 · 3 · 3', 'catalogo-3: weight=2');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · ${KIND[c.k].lab}`, `vez do catalogo-${c.to + 1}`] : ['peso 2 no catalogo-3', ''];
          if (o.rep[0].n === 3 && t > 6) T(o, 2, 'peso 2: 4 pedidos', 'acc'); } },
      { id: 'quantum', cfg: 'qt', dur: 7, title: 'Com quantum: a vez dura 300 ms',
        story: 'O código Go do artigo faz outra variante: a vez de cada réplica dura 300 ms, o quantum. Chegando um pedido a cada 200 ms, cada réplica pega 2 seguidos: 1, 1, 2, 2, 3, 3, 1, 1, 2. Se um pico de pedidos cair dentro de um quantum, vai tudo para a mesma réplica.',
        look: 'O relógio do mostrador corre de 200 em 200 ms e os pacotes saem em pares para a mesma réplica.',
        key: 'Com quantum, a vez troca pelo relógio, não pela contagem.',
        f(o, t) { o.rule = ['round robin com quantum', 'a vez dura 300 ms']; const c = flow(o, t, asg(SEQ.qt), { gap: 0.62 });
          const i = c ? +c.p.slice(1) - 1 : -1; o.clock = i >= 0 ? `t = ${i * 200} ms` : 't = 0 ms';
          lbRows(o, 'round robin · quantum', 'vez: 300 ms', i >= 0 ? `vez do catalogo-${SEQ.qt[i] + 1}` : 'vez do catalogo-1');
          o.now = c ? [`${c.p} em t = ${i * 200} ms`, `a vez é do catalogo-${c.to + 1}`] : ['um pedido a cada 200 ms', '']; } },
      { id: 'buscas', dur: 6, title: 'E se der errado: as 3 buscas no catalogo-2',
        story: 'Volte à fila sem peso nem quantum e olhe o que cada pedido custa. P2, P5 e P8 são as buscas de 900 ms, e o ponteiro mandou as três para o catalogo-2: 2.700 ms de trabalho para ele, 60 ms para cada um dos outros. A conta de pedidos fecha (3 · 3 · 3); a de trabalho, não.',
        look: 'Os 3 pacotes grandes vão todos para o catalogo-2, que fica vermelho com a coluna no topo; o 1 e o 3 quase não sobem.',
        key: 'Round robin parece justo e não é quando os pedidos custam diferente.',
        f(o, t) { o.rule = ['round robin', 'próximo pedido → próxima réplica']; const all = asg(SEQ.rr);
          pre(o, all.filter(it => it.k === 'g')); const c = flow(o, t, all.filter(it => it.k === 'b'), { gap: 1.0 });
          o.strip.forEach((s, i) => { if (Q[i].k === 'b' && s.dl) s.tone = 'bad'; });
          lbRows(o, 'round robin', '3 · 3 · 3 pedidos', 'não olha o custo');
          o.now = c ? [`${c.p} · ${CLI[c.c].n} · busca 900 ms`, '→ catalogo-2 de novo'] : ['os gatos já foram', 'faltam as buscas'];
          if (o.rep[1].n === 3) { o.on.r1 = 'bad'; T(o, 1, '3 buscas · 2.700 ms', 'bad'); T(o, 0, '3 gatos · 60 ms', 'dim'); T(o, 2, '3 gatos · 60 ms', 'dim'); } } },
    ],
    lr: [
      { id: 'conta', dur: 4, title: 'Least request: vai para quem atendeu menos',
        story: 'Outra regra: o lb-loja guarda um contador por réplica, com quantos pedidos cada uma já atendeu, e manda o próximo para a de contador mais baixo. No começo está 0 · 0 · 0 e, no empate, ganha a primeira da lista. O P1 vai para o catalogo-1, que passa a 1.',
        look: 'O contador aparece em cima de cada réplica; cada pacote vai para a de número mais baixo.',
        key: 'Least request: o próximo vai para quem atendeu menos pedidos até agora.',
        f(o, t) { o.rule = ['least request', 'menor contador; empate: o 1º']; o.metric = 'contador'; const c = flow(o, t, asg(SEQ.rr, 0, 3));
          lbRows(o, 'least request', `contadores ${o.rep.map(r => r.n).join(' · ')}`);
          o.now = c ? [`${c.p}: menor contador`, `→ catalogo-${c.to + 1}`] : ['contadores 0 · 0 · 0', 'empate: vai o 1º']; } },
      { id: 'empate', dur: 6.5, title: 'Juntas desde o começo: igual ao round robin',
        story: 'Como as três começaram juntas, o menor contador gira em círculo: P2 vai para o 2, P3 para o 3, P4 de volta ao 1. A fila inteira termina em 3 · 3 · 3, a mesma divisão do round robin, e as 3 buscas de novo caem todas no catalogo-2.',
        look: 'Os contadores sobem em escada, 1-1-1, 2-2-2, 3-3-3, e os pacotes grandes vão para o catalogo-2.',
        key: 'Com réplicas que nasceram juntas, least request empata com round robin.',
        f(o, t) { o.rule = ['least request', 'menor contador; empate: o 1º']; o.metric = 'contador'; pre(o, asg(SEQ.rr, 0, 3)); const c = flow(o, t, asg(SEQ.rr, 3, 9), { gap: 0.65 });
          lbRows(o, 'least request', `contadores ${o.rep.map(r => r.n).join(' · ')}`);
          o.now = c ? [`${c.p}: menor contador`, `→ catalogo-${c.to + 1}`] : ['contadores 1 · 1 · 1', ''];
          if (o.rep[2].n === 3) T(o, 'lb', '3 · 3 · 3: igual ao round robin', 'acc'); } },
      { id: 'novo', four: true, dur: 5, title: 'Entra o catalogo-4 com contador 0',
        story: 'Horas de Black Friday depois, cada réplica já atendeu 3.000 pedidos. Para aguentar o pico, a loja liga o catalogo-4 (10.0.1.14). O contador dele começa em 0, contra 3.000 de cada uma das outras.',
        look: 'Um quarto bloco aparece com contador 0; os outros três mostram 3.000.',
        key: 'Contador que soma desde sempre lembra o passado, não a carga de agora.',
        f(o, t) { o.rule = ['least request', 'menor contador; empate: o 1º']; o.metric = 'contador'; o.stripLab = 'CONTADORES DO lb-loja'; o.strip = null;
          o.big = [3000, 3000, 3000, 0].map((v, k) => [REP[k].n, nf(v), k === 3 ? 'acc' : 'hi']);
          [0, 1, 2].forEach(k => { o.rep[k].n = 3000; o.rep[k].cpu = 33; }); o.rep[3].cpu = 0; lbRows(o, 'least request', 'menor: catalogo-4 (0)', '3.000 · 3.000 · 3.000 · 0');
          o.now = ['catalogo-4 ligou com 0', 'os outros: 3.000 cada']; if (t > 1.2) T(o, 3, 'contador 0\nos outros: 3.000', 'acc'); } },
      { id: 'tudo', four: true, dur: 7.5, title: 'E se der errado: os próximos 3.000 vão para o catalogo-4',
        story: 'O menor contador agora é sempre o do catalogo-4, então todo pedido novo vai para ele, um atrás do outro, até empatar em 3.000. A réplica que acabou de ligar recebe 100% do tráfego e satura, enquanto as três antigas ficam paradas: uma negação de serviço causada pelo próprio balanceador. A saída é zerar os contadores de tempos em tempos ou contar só uma janela recente.',
        look: 'Todos os pacotes vão para o catalogo-4; o contador dele corre de 0 a 3.000 e ele fica vermelho, com a coluna no topo.',
        key: 'Least request precisa de contador zerado ou com janela, senão a réplica nova leva tudo.',
        f(o, t) { o.rule = ['least request', 'contador que nunca zera']; o.metric = 'contador'; const v = Math.round(3000 * clamp((t - 0.4) / 5.6));
          o.stripLab = 'CONTADORES DO lb-loja'; o.strip = null; o.big = [3000, 3000, 3000, v].map((x, k) => [REP[k].n, nf(x), k === 3 ? (v > 300 ? 'bad' : 'acc') : 'hi']);
          [0, 1, 2].forEach(k => { o.rep[k].n = 3000; o.rep[k].cpu = 0; }); o.rep[3].n = v; o.rep[3].cpu = Math.min(100, Math.round(v / 3));
          for (let j = 0; j < 9; j++) { const a = 0.4 + j * 0.62; if (t > a && v < 3000) send(o, t, a, a + 0.5, R.lb2(o, 3), j === 0 ? 'todo pedido novo → catalogo-4' : '', 'acc', 0, j % 3 === 1 ? 20 : 11); }
          if (v > 300) o.on.r3 = 'bad'; lbRows(o, 'least request', v < 3000 ? 'menor: catalogo-4' : 'empatou em 3.000', `catalogo-4: ${nf(v)}`);
          o.now = v < 3000 ? [`catalogo-4: ${nf(v)} de 3.000`, 'os outros 3: nenhum pedido novo'] : ['empatou em 3.000', 'só agora os outros recebem'];
          if (v > 300) T(o, 3, `${nf(v)} pedidos seguidos\nCPU ${o.rep[3].cpu}%`, 'bad'); if (t > 2.4) T(o, 'lb', 'negação de serviço\ncausada pelo balanceador', 'bad');
          if (t > 3.2) T(o, 1, 'parado', 'dim'); } },
    ],
    lc: [
      { id: 'keep', dur: 5.5, title: 'Conexão aberta não é pedido',
        story: 'O least connection olha outra coisa: quantas conexões TCP cada réplica tem abertas agora. Só que o navegador da Lena, depois de receber a página do gato, deixa a conexão aberta (keep-alive) para reaproveitar depois. Ela fica lá, parada, sem pedir nada, e continua contando.',
        look: 'O P1 vai ao catalogo-1 e volta com a página; a conexão segue acesa em cinza, sem tráfego, e o contador fica em 1.',
        key: 'Keep-alive: a conexão fica aberta mesmo sem pedido passando.',
        f(o, t) { o.rule = ['least connection', 'menos conexões abertas agora']; o.metric = 'conexões'; const done = flow(o, t, asg(SEQ.zero, 0, 1)) && t > 1.15;
          lbRows(o, 'least connection', `conexões ${done ? 1 : 0} · 0 · 0`);
          if (done) { o.rep[0].val = 1; o.rep[0].ms = 0; o.rep[0].extra = [{ dots: [t < 1.6 ? 1 : 0, t < 1.6 ? 0 : 1] }];
            if (send(o, t, 1.2, 1.7, rev(R.lb2(o, 0)), '200 · página do gato', 'acc', 0.3, 11) && t > 2.2) { o.beams.push({ pts: R.lb2(o, 0), on: true, tone: '' }); T(o, 0, 'keep-alive: aberta\nparada, sem pedido', 'dim'); } }
          o.rep[1].val = o.rep[2].val = 0;
          o.now = t > 2.2 ? ['a página voltou em 20 ms', 'a conexão continua aberta'] : ['P1 · Lena · gato', '→ catalogo-1']; } },
      { id: 'agora', dur: 5, title: 'O instante: 5 · 3 · 4 conexões',
        story: 'Num instante da Black Friday, o catalogo-1 tem 5 conexões keep-alive paradas, de navegadores ociosos, e quase nenhum trabalho. O catalogo-2 tem 3 conexões, todas com uma busca pesada em andamento. O catalogo-3 tem 4: 1 com pedido, 3 paradas.',
        look: 'Cada réplica mostra suas conexões: quadradinhos vazios estão parados, cheios estão trabalhando.',
        key: 'Least connection conta conexões abertas, ocupadas ou não.',
        f(o, t) { o.rule = ['least connection', 'menos conexões abertas agora']; snap(o, 'lc'); lbRows(o, 'least connection', 'conexões 5 · 3 · 4');
          o.now = ['catalogo-1: 5 paradas', 'catalogo-2: 3 buscas · catalogo-3: 1 + 3'];
          if (t > 0.6) T(o, 0, '5 conexões paradas', 'dim'); if (t > 1.4) T(o, 1, '3 buscas em andamento', 'acc'); if (t > 2.2) T(o, 2, '1 pedido · 3 paradas', 'dim'); } },
      { id: 'erro', dur: 6, title: 'E se der errado: o P9 cai no mais ocupado',
        story: 'Chega o P9, a Lena abrindo o gato de novo. O least connection compara 5, 3 e 4 e escolhe o catalogo-2, que tem menos conexões e é justamente o que está processando as 3 buscas de 900 ms. A página de 20 ms entra na fila atrás delas, enquanto o catalogo-1, que não fazia nada, fica de fora.',
        look: 'O pacote do P9 vai para o catalogo-2, que fica vermelho; o catalogo-1 segue parado com as 5 conexões ociosas.',
        key: 'Conexão aberta não é trabalho: o least connection erra quando há keep-alive parado.',
        f(o, t) { o.rule = ['least connection', 'menos conexões abertas agora']; snap(o, 'lc'); lbRows(o, 'least connection', 'min(5, 3, 4) = 3', '→ catalogo-2');
          const it = { ...Q[8], to: 1 }; flow(o, t, [it], { t0: 0.4 });
          if (o.rep[1].n) { o.rep[1].val = 4; o.rep[1].extra = [{ dots: [4, 0] }]; o.on.r1 = 'bad'; }
          o.now = o.rep[1].n ? ['P9 · gato 20 ms → catalogo-2', 'fila atrás de 3 buscas de 900 ms'] : ['P9 · Lena · gato', 'menos conexões: catalogo-2 (3)'];
          if (t > 1.8) { T(o, 1, 'P9 atrás de 3 buscas\nde 900 ms', 'bad'); T(o, 0, '5 conexões, 0 trabalho\nficou de fora', 'dim'); } } },
    ],
    lor: [
      { id: 'pend', dur: 5, title: 'Pedido pendente: chegou e ainda não teve resposta',
        story: 'O least outstanding requests (LOR) conta pedidos pendentes: os que a réplica recebeu e ainda não respondeu. O P1 chega ao catalogo-1 e o contador dele vai a 1; 20 ms depois a página volta e o contador desce a 0. A conexão pode continuar aberta: para o LOR, ela não pesa.',
        look: 'O contador de pendentes do catalogo-1 sobe para 1 quando o P1 chega e volta a 0 com a resposta.',
        key: 'Pendente = pedido em andamento, ainda sem resposta.',
        f(o, t) { o.rule = ['least outstanding requests', 'menos pedidos pendentes']; o.metric = 'pendentes'; flow(o, t, asg(SEQ.zero, 0, 1));
          const inn = t > 1.14, back = send(o, t, 1.9, 2.4, rev(R.lb2(o, 0)), inn ? '200 · 20 ms' : '', 'acc', 0.4, 11);
          o.rep[0].val = inn && !back ? 1 : 0; o.rep[1].val = o.rep[2].val = 0; o.rep[0].ms = 0; if (inn) o.rep[0].extra = [{ dots: [back ? 0 : 1, back ? 1 : 0] }];
          lbRows(o, 'LOR', `pendentes ${o.rep[0].val} · 0 · 0`);
          o.now = back ? ['respondeu: pendente 0', 'conexão aberta não conta'] : inn ? ['P1 chegou: pendente 1', 'esperando a resposta'] : ['P1 · Lena · gato', ''];
          if (back && t > 2.6) T(o, 0, '0 pendentes\n1 conexão aberta', 'acc'); } },
      { id: 'agora', dur: 5, title: 'O mesmo instante: 0 · 3 · 1 pendentes',
        story: 'Volte ao instante do least connection. O catalogo-1 tem 5 conexões, mas nenhuma com pedido: 0 pendentes. O catalogo-2 tem 3 buscas em andamento: 3 pendentes. O catalogo-3 tem 1.',
        look: 'Os números em cima das réplicas trocam de conexões (5 · 3 · 4) para pendentes (0 · 3 · 1).',
        key: 'O LOR mede o trabalho em andamento, não as conexões.',
        f(o, t) { o.rule = ['least outstanding requests', 'menos pedidos pendentes']; snap(o, t < 1.4 ? 'lc' : 'lor');
          lbRows(o, 'LOR', t < 1.4 ? 'conexões 5 · 3 · 4' : 'pendentes 0 · 3 · 1', t < 1.4 ? '' : 'o LC via 5 · 3 · 4');
          o.now = t < 1.4 ? ['conexões: 5 · 3 · 4', ''] : ['pendentes: 0 · 3 · 1', 'conexão parada não conta'];
          if (t > 1.6) { T(o, 0, '5 conexões\n0 pendentes', 'acc'); T(o, 1, '3 pendentes', 'dim'); T(o, 2, '1 pendente', 'dim'); } } },
      { id: 'certo', dur: 5.5, title: 'O P9 vai para o catalogo-1: 20 ms',
        story: 'Chega o P9. O LOR escolhe o catalogo-1, com 0 pendentes, que responde a página do gato em 20 ms. O catalogo-2 segue com as suas buscas sem receber mais nada. É a regra que o ALB da AWS chama de least outstanding requests.',
        look: 'O P9 vai para o catalogo-1 e volta logo com 200; o catalogo-2 continua com as 3 buscas.',
        key: 'O LOR manda para quem está menos ocupado agora.',
        f(o, t) { o.rule = ['least outstanding requests', 'menos pedidos pendentes']; snap(o, 'lor'); lbRows(o, 'LOR', 'min(0, 3, 1) = 0', '→ catalogo-1');
          flow(o, t, [{ ...Q[8], to: 0 }], { t0: 0.4 }); const inn = t > 1.24, back = send(o, t, 1.8, 2.3, rev(R.lb2(o, 0)), inn ? '200 · 20 ms' : '', 'acc', 0.5, 11);
          if (inn && !back) { o.rep[0].val = 1; o.rep[0].extra = [{ dots: [1, 5] }]; }
          o.now = back ? ['P9 respondido em 20 ms', 'catalogo-1 de novo com 0'] : ['P9 · Lena · gato', 'menos pendentes: catalogo-1 (0)'];
          if (back && t > 2.6) T(o, 0, 'P9 · 20 ms ✓', 'acc'); } },
      { id: 'rapido', dur: 7.5, title: 'E se der errado: a réplica que erra rápido',
        story: 'Agora o catalogo-3 perde a conexão com o banco e passa a responder 500 em 1 ms. Como responde na hora, nunca acumula pendentes: fica sempre com 0, e o LOR manda para ele quase todo pedido novo, que volta com erro. Dos 6 pedidos seguintes, 4 caem nele. Só o healthcheck ou a detecção de outliers (5xx seguidos) tira o catalogo-3 do pool.',
        look: 'O catalogo-3 fica vermelho com 0 pendentes; os pacotes vão para ele e voltam como 500.',
        key: 'Responder rápido não é responder certo: o LOR precisa de healthcheck junto.',
        f(o, t) { o.rule = ['least outstanding requests', 'quem erra rápido fica com 0']; snap(o, 'lor'); o.rep[2].st = 'dead'; o.rep[2].val = 0; o.rep[2].extra = [['responde 500 em 1 ms', 8.2, 'bad']]; o.on.r2 = 'bad';
          const items = [['B', 'g', 0], ['C', 'g', 2], ['D', 'g', 2], ['L', 'g', 2], ['B', 'b', 0], ['C', 'g', 2]].map(([c, k, to], i) => ({ p: 'P' + (10 + i), c, k, to, res: to === 2 ? '500' : null }));
          o.stripLab = 'PEDIDOS NOVOS · P10 A P15'; o.strip = items.map(it => ({ l1: it.p, l2: CLI[it.c].n, l3: KIND[it.k].lab, big: it.k === 'b', dl: null }));
          const c = flow(o, t, items.map((it, i) => ({ ...it, p: 'P' + (i + 1) })), { gap: 0.85 });
          o.strip.forEach((s, i) => { if (s.dl && items[i].res) s.dl = '500'; }); o.rep[0].n = o.rep[2].n = 0; o.rep[0].ms = 0; o.rep[2].ms = 0;
          const nb = o.strip.filter((s, i) => s.dl && items[i].res).length; lbRows(o, 'LOR', 'pendentes 0 · 3 · 0', `500 do catalogo-3: ${nb}`);
          o.now = c ? [`${items[+c.p.slice(1) - 1].p} → catalogo-${c.to + 1}`, c.res ? '500 em 1 ms · pendente volta a 0' : '200'] : ['catalogo-3 perdeu o banco', 'responde 500 em 1 ms'];
          if (t > 5.4) T(o, 2, '4 de 6 voltaram 500\nsempre 0 pendentes', 'bad'); } },
    ],
    hash: [
      { id: 'lena', dur: 5, title: 'hash(177.38.20.5) % 3 = 1 → catalogo-2',
        story: 'No IP hash, o lb-loja não conta nada: faz uma conta com o IP de quem pede. O IP da Lena, 177.38.20.5, vira o número 5125 (no exemplo, 20 × 256 + 5), e 5125 % 3 = 1, a posição do catalogo-2 numa lista que começa em 0. P1, P5 e P9, os três pedidos dela, vão para lá.',
        look: 'Os 3 pacotes da Lena seguem sempre o mesmo caminho, até o catalogo-2.',
        key: 'IP hash: o mesmo IP cai sempre na mesma réplica.',
        f(o, t) { o.rule = ['IP hash', 'h = hash(IP) · réplica = h % 3']; const its = asg(SEQ.hash).filter(it => it.c === 'L'); flow(o, t, its, { gap: 1.0 });
          lbRows(o, 'IP hash', '5125 % 3 = 1', '177.38.20.5 → 2'); o.now = ['177.38.20.5 → h = 5125', '5125 % 3 = 1 → catalogo-2'];
          if (o.rep[1].n === 3) T(o, 1, 'Lena: P1, P5, P9\nsempre aqui', 'acc'); } },
      { id: 'fila', dur: 6.5, title: 'A fila inteira: cada cliente na sua réplica',
        story: 'Bia (189.6.44.10) cai no catalogo-1, Caio (200.150.7.33) no catalogo-2 e Davi (187.11.90.2) no catalogo-3. A divisão saiu 2 · 5 · 2 pedidos, desigual, mas cada pessoa sempre volta para a mesma réplica. Um carrinho guardado na memória dela ou um cache local continua servindo.',
        look: 'Cada cliente segue sempre o mesmo caminho; os contadores terminam em 2 · 5 · 2.',
        key: 'Útil para sessão e cache local: o cliente reencontra a mesma réplica.',
        f(o, t) { o.rule = ['IP hash', 'h = hash(IP) · réplica = h % 3']; const all = asg(SEQ.hash); pre(o, all.filter(it => it.c === 'L'));
          const c = flow(o, t, all.filter(it => it.c !== 'L'), { gap: 0.75 }); lbRows(o, 'IP hash', c ? `${CLI[c.c].h} % 3 = ${CLI[c.c].h % 3}` : '5125 % 3 = 1', c ? `${CLI[c.c].ip} → ${c.to + 1}` : '');
          o.now = c ? [`${CLI[c.c].n} ${CLI[c.c].ip}`, `h = ${CLI[c.c].h} → catalogo-${c.to + 1}`] : ['Lena já está no 2', ''];
          if (t > 4.6) { T(o, 0, 'Bia: 2 pedidos', 'dim'); T(o, 1, 'Lena e Caio: 5', 'acc'); T(o, 2, 'Davi: 2', 'dim'); } } },
      { id: 'tira', cfg: 'hash', dur: 6, title: 'E se der errado: sai o catalogo-3 e 2/3 trocam',
        story: 'O catalogo-3 cai e sai do pool. A conta vira h % 2, e o resultado muda para quase todo mundo, não só para quem estava no 3: só fica onde estava quem tem h % 6 igual a 0 ou 1. Cerca de 2/3 dos clientes trocam de réplica e perdem a sessão e o cache local.',
        look: 'Na faixa de 12 clientes do mostrador, 8 trocam (vermelho); até quem estava no 1 e no 2 se mexe.',
        key: 'Com % N, mudar o N remapeia quase todos os clientes.',
        f(o, t) { o.rule = ['IP hash sem o catalogo-3', 'réplica = h % 2']; o.rep[2].st = 'out'; const s = sample(o, t, false);
          o.metric = 'clientes'; o.rep.forEach(r => r.noBar = true); o.rep[0].n = 6; o.rep[1].n = 6; o.rep[2].n = 0;
          lbRows(o, 'IP hash', 'h % 3 → h % 2', `trocaram: ${s.moved} de ${s.shown}`); o.now = [`trocaram ${s.moved} de ${s.shown}`, 'ficam só h % 6 = 0 ou 1'];
          if (t > 4.2) T(o, 'lb', '% 2: 8 de 12 trocam (2/3)', 'bad'); } },
      { id: 'maglev', cfg: 'maglev', dur: 6, title: 'Hashing consistente (Maglev): só 1/3 troca',
        story: 'Com hashing consistente, ou com o Maglev do Google, cada réplica é dona de pedaços de uma tabela que não depende só de N. Quando o catalogo-3 sai, só os pedaços dele são redistribuídos: troca apenas quem estava no 3, cerca de 1/3. A Lena, a Bia e o Caio nem percebem.',
        look: 'Na mesma faixa de 12 clientes, só os 4 que estavam no catalogo-3 trocam.',
        key: 'Hashing consistente: tirar uma réplica só move os clientes dela.',
        f(o, t) { o.rule = ['hashing consistente', 'só os clientes do 3 mudam']; o.rep[2].st = 'out'; const s = sample(o, t, true);
          o.metric = 'clientes'; o.rep.forEach(r => r.noBar = true); o.rep[0].n = 6; o.rep[1].n = 6; o.rep[2].n = 0;
          lbRows(o, 'consistente', 'só os do 3 mudam', `trocaram: ${s.moved} de ${s.shown}`); o.now = [`trocaram ${s.moved} de ${s.shown}`, 'só quem estava no catalogo-3'];
          if (t > 4.2) T(o, 'lb', 'consistente: 4 de 12 (1/3)', 'acc'); } },
      { id: 'nat', dur: 7, title: 'E se der errado: 500 pessoas atrás de um IP',
        story: 'Com as 3 réplicas de volta, mesmo o hash mais esperto só enxerga o IP. O Davi trabalha num escritório em SP com 500 pessoas que saem para a internet pelo mesmo IP, 187.11.90.2 (NAT). Para o balanceador é um cliente só: as 500 caem no catalogo-3, que satura enquanto os outros dois folgam.',
        look: 'Uma rajada de pacotes do mesmo IP vai toda para o catalogo-3, que fica vermelho com a coluna no topo.',
        key: 'IP hash desequilibra quando muita gente divide o mesmo IP.',
        f(o, t) { o.rule = ['IP hash', 'NAT: 500 pessoas, 1 IP']; o.metric = 'pessoas'; const v = Math.round(500 * clamp((t - 0.4) / 4.6));
          o.stripLab = 'PESSOAS POR RÉPLICA'; o.strip = null; o.big = [['catalogo-1', '1', 'hi'], ['catalogo-2', '2', 'hi'], ['catalogo-3', nf(v), v > 60 ? 'bad' : 'acc']];
          o.rep[0].n = 1; o.rep[1].n = 2; o.rep[2].n = v; o.rep[0].cpu = 1; o.rep[1].cpu = 1; o.rep[2].cpu = Math.min(100, Math.round(v / 5)); o.who = 'D';
          for (let j = 0; j < 8; j++) { const a = 0.4 + j * 0.58; if (v < 500) { send(o, t, a, a + 0.32, R.cli, j === 0 ? '187.11.90.2 · 500 pessoas' : '', 'hi', 0, 11); send(o, t, a + 0.32, a + 0.7, R.lb2(o, 2), '', 'acc', 0, 11); } }
          if (v > 60) o.on.r2 = 'bad'; lbRows(o, 'IP hash', '187.11.90.2 → 3', `pessoas no 3: ${nf(v)}`);
          o.now = [`escritório do Davi: ${nf(v)} de 500`, 'mesmo IP → mesmo catalogo-3'];
          if (t > 3) T(o, 2, `${nf(v)} pessoas · CPU ${o.rep[2].cpu}%`, 'bad'); if (t > 3.6) { T(o, 0, 'Bia · folgado', 'dim'); T(o, 1, 'Lena e Caio · folgado', 'dim'); } } },
    ],
    random: [
      { id: 'sorteio', dur: 4, title: 'Random: sorteia a réplica a cada pedido',
        story: 'A regra mais curta: para cada pedido, o lb-loja sorteia uma das 3 réplicas. Não guarda ponteiro, contador nem estado nenhum. Os primeiros pedidos da fila caem onde o sorteio mandar: P1 no 2, P2 no 1, P3 no 2 de novo.',
        look: 'Os pacotes saem sem padrão: 2, 1, 2.',
        key: 'Random: cada pedido tem 1/3 de chance de ir para cada réplica.',
        f(o, t) { o.rule = ['random', 'sorteia 1 de 3 a cada pedido']; const c = flow(o, t, asg(SEQ.rnd, 0, 3), { gap: 0.9 });
          lbRows(o, 'random', c ? `sorteio: ${c.to + 1}` : 'sorteio: …', 'sem estado'); o.now = c ? [`${c.p}: sorteou ${c.to + 1}`, `→ catalogo-${c.to + 1}`] : ['sorteando…', '']; } },
      { id: 'muitos', dur: 6.5, title: '10.000 pedidos: perto de 1/3 cada',
        story: 'Com muito tráfego, o sorteio se ajeita sozinho. Em 10.000 pedidos, cada réplica fica perto de 3.333: neste exemplo, 3.341, 3.329 e 3.330.',
        look: 'Os contadores correm até 10.000 e as colunas ficam quase iguais.',
        key: 'Com muito tráfego, o sorteio tende à divisão igual.',
        f(o, t) { o.rule = ['random', 'sorteia 1 de 3 a cada pedido']; const f = clamp((t - 0.4) / 4.8), END = [3341, 3329, 3330];
          o.stripLab = 'PEDIDOS SORTEADOS'; o.strip = null; o.big = END.map((v, k) => [REP[k].n, nf(v * f), 'hi']);
          o.rep.forEach((r, k) => { r.n = Math.round(END[k] * f); r.cpu = Math.round(33 * f); });
          for (let j = 0; j < 9; j++) { const a = 0.4 + j * 0.5; if (f < 1) send(o, t, a, a + 0.45, R.lb2(o, [1, 0, 2, 2, 0, 1, 0, 2, 1][j]), '', 'acc', 0, 11); }
          lbRows(o, 'random', `${nf(10000 * f)} pedidos`, 'perto de 1/3 cada'); o.now = [`${nf(10000 * f)} pedidos sorteados`, f < 1 ? '' : '3.341 · 3.329 · 3.330'];
          if (f >= 1) T(o, 'lb', '10.000: ~1/3 cada', 'acc'); } },
      { id: 'poucos', dur: 8.5, title: 'E se der errado: 10 pedidos dão 2 · 5 · 3',
        story: 'Com pouco tráfego, o acaso pesa. Nos 9 pedidos da fila e mais um do Caio, o sorteio deste exemplo deu 2 para o catalogo-1, 5 para o catalogo-2 e 3 para o catalogo-3. E ainda jogou 2 das 3 buscas no catalogo-1: 1.800 ms de trabalho para ele, 60 ms para o catalogo-3.',
        look: 'A faixa de 10 pedidos fica desigual: 5 pacotes no catalogo-2, e 2 pacotes grandes no catalogo-1.',
        key: 'Random só fica justo na média, com muito pedido.',
        f(o, t) { o.rule = ['random', 'sorteia 1 de 3 a cada pedido']; const items = [...asg(SEQ.rnd), { p: 'P10', c: 'C', k: 'g', to: SEQ.rnd[9] }];
          o.strip.push({ l1: 'P10', l2: 'Caio', l3: 'gato', dl: null }); const c = flow(o, t, items, { gap: 0.6 });
          lbRows(o, 'random', c ? `sorteio: ${c.to + 1}` : 'sorteio: …', `${o.rep.map(r => r.n).join(' · ')} pedidos`);
          o.now = c ? [`${c.p}: sorteou ${c.to + 1}`, `${KIND[c.k].lab} → catalogo-${c.to + 1}`] : ['', ''];
          if (o.rep.reduce((a, r) => a + r.n, 0) === 10) { o.strip.forEach((s, i) => { if (items[i].k === 'b' && items[i].to === 0) s.tone = 'bad'; }); o.on.r0 = 'bad';
            T(o, 0, '2 pedidos · 1.800 ms', 'bad'); T(o, 1, '5 pedidos · 980 ms', 'acc'); T(o, 2, '3 pedidos · 60 ms', 'dim'); } } },
    ],
  };
  // o mesmo instante do least connection e do LOR: 5 · 3 · 4 conexões, 0 · 3 · 1 pendentes
  function snap(o, m) {
    o.metric = m === 'lc' ? 'conexões' : 'pendentes';
    const C = [[0, 5, 0], [3, 0, 2700], [1, 3, 20]];
    C.forEach(([act, idle, ms], k) => { const r = o.rep[k]; r.val = m === 'lc' ? act + idle : act; r.ms = ms; r.extra = [{ dots: [act, idle] }]; });
    o.strip = [{ l1: 'c-1', l2: '5 conex.', l3: '0 pend.', dl: m === 'lc' ? '5' : '0', tone: 'acc' }, { l1: 'c-2', l2: '3 conex.', l3: '3 pend.', dl: '3', tone: 'acc' },
      { l1: 'c-3', l2: '4 conex.', l3: '1 pend.', dl: m === 'lc' ? '4' : '1', tone: 'acc' }];
    o.stripLab = m === 'lc' ? 'CONEXÕES ABERTAS AGORA' : 'PEDIDOS PENDENTES AGORA'; o.on.r1 = 2;
    [0, 1, 2].forEach(k => { if (k === 1) for (let j = 0; j < 3; j++) o.beams.push({ pts: R.lb2(o, 1), on: true, dot: 0.94 - j * 0.05, size: 20 }); });
  }
  const L = () => STEPS[sc], N = () => L().length;
  const cur = () => L()[step];
  step = Math.min(step, N() - 1);
  let SP = null;
  // depois do passo: linhas de cada réplica e vigas apagadas (só para quem está no pool)
  function repRows(o, k) {
    const r = o.rep[k], rows = [[`${REP[k].ip}:8080`, 6.8, 'dim']];
    if (r.st === 'out') rows.push(['FORA DO POOL', 10.5, 'bad']); else if (r.st === 'dead') rows.push([sc === 'lor' ? 'SEM O BANCO' : 'TRAVADO', 10.5, 'bad']);
    const v = r.val != null ? r.val : r.n, unit = o.metric === 'pedidos' ? (v === 1 ? 'pedido' : 'pedidos') : o.metric === 'contador' ? '' : o.metric;
    rows.push([o.metric === 'contador' ? `contador ${nf(v)}` : `${nf(v)} ${unit}`, 10.5, r.st === 'ok' || r.st === 'novo' ? (v ? 'hi' : 'dim') : 'dim']);
    r.extra.forEach(e => rows.push(e));
    if (!r.noBar) { const frac = r.cpu != null ? r.cpu / 100 : clamp(r.ms / 2700);
      rows.push({ bar: frac, lab: r.cpu != null ? `CPU ${r.cpu}%` : `trabalho ${nf(r.ms)} ms`, tone: frac >= 0.99 ? 'bad' : '' }); r.frac = frac; } else r.frac = 0;
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
          x.fillStyle = INK(); x.font = `700 ${u(8.6)}px ${MONO3}`; x.fillText(a && i ? `${a} com pedido · ${i} parada${i > 1 ? 's' : ''}` : a ? `${a} com pedido` : i ? `parada${i > 1 ? 's' : ''}` : '', u(6 + (a + i) * 14 + 2), u(y + 5.4));
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
    x.fillStyle = INK(); x.font = `700 ${u(7.4)}px ${MONO3}`; x.fillText(sc === 'health' ? 'pool: quem respondeu o healthcheck' : 'gato 20 ms (pequeno) · busca 900 ms (grande)', u(8), u(88));
    const L0 = 348; x.strokeStyle = C.line; x.lineWidth = u(0.4); x.beginPath(); x.moveTo(u(L0 - 9), u(6)); x.lineTo(u(L0 - 9), u(DH - 6)); x.stroke();
    lbl('REGRA · ' + SCNAME[sc].toUpperCase(), L0, 9);
    o.rule.slice(0, 2).forEach((l, i) => { x.fillStyle = i ? C.inkHi : acc; fitFont(x, u, l, i ? 8.4 : 10, 164); x.fillText(l, u(L0), u(22 + i * 12)); });
    lbl('AGORA', L0, 50);
    o.now.slice(0, 2).forEach((l, i) => { if (!l) return; x.fillStyle = i ? C.inkHi : acc; fitFont(x, u, l, 8.6, 164); x.fillText(l, u(L0), u(62 + i * 12)); });
    if (o.clock) { x.textAlign = 'right'; x.fillStyle = C.inkHi; fitFont(x, u, o.clock, 10, 80); x.fillText(o.clock, u(512), u(9)); x.textAlign = 'left'; }
    cv.tex.needsUpdate = true;
  }

  // ── texto do painel ──
  const EX = '<li class="h3-dim">203.0.113.10 é um IP da faixa de documentação; os IPs internos, os 20 ms e 900 ms e os contadores são os números de exemplo do módulo.</li>';
  const qTable = (seq, cap) => `<table class="h3-sum"><tr><th>pedido</th><th>quem · o quê</th><th>${cap}</th></tr>${Q.map((q, i) => `<tr><td>${q.p}</td><td>${CLI[q.c].n} · ${KIND[q.k].lab} ${KIND[q.k].ms} ms</td><td>catalogo-${seq[i] + 1}</td></tr>`).join('')}</table>`;
  const DATA = {
    sem: () => `<li><b>gato</b> = ${KIND.g.path} (20 ms) · <b>busca</b> = ${KIND.b.path} (900 ms)</li>${qTable(SEQ.zero, 'vai para')}<li>catalogo-1: 6 × 20 + 3 × 900 = <b>2.820 ms</b> de trabalho, CPU <b>100%</b> · catalogo-2 e 3: <b>0%</b></li><li>Página do gato: <b>20 ms</b> sozinha, <b>1,8 s</b> na fila da CPU cheia</li>${EX}`,
    health: () => `<table class="h3-sum"><tr><th>hora</th><th>GET /health no catalogo-2</th><th>pool</th></tr><tr><td>19:59:55</td><td>200 OK</td><td>1 · 2 · 3</td></tr><tr><td>20:00:00</td><td>trava</td><td>1 · 2 · 3</td></tr><tr><td>20:00:05</td><td>timeout (1/3)</td><td>1 · 2 · 3</td></tr><tr><td>20:00:10</td><td>timeout (2/3)</td><td>1 · 2 · 3</td></tr><tr class="on"><td>20:00:15</td><td>timeout (3/3)</td><td>1 · 3</td></tr><tr><td>20:05:05</td><td>200 OK (1/2)</td><td>1 · 3</td></tr><tr class="on"><td>20:05:10</td><td>200 OK (2/2)</td><td>1 · 2 · 3</td></tr></table>
      <li>Intervalo <b>5 s</b> × <b>3</b> falhas = até <b>15 s</b> com 1 de cada 3 pedidos falhando (502/504)</li><li>Réplica nova: catalogo-4 <b>10.0.1.14</b>, entra no pool no primeiro 200</li>${EX}`,
    rr: () => `${qTable(SEQ.rr, 'round robin')}<li>Trabalho: catalogo-1 <b>60 ms</b> · catalogo-2 <b>2.700 ms</b> (P2, P5, P8) · catalogo-3 <b>60 ms</b></li><li>Com peso 2 no catalogo-3 (volta 1, 2, 3, 3): <b>3 · 2 · 4</b> pedidos</li><li>Com quantum de 300 ms e um pedido a cada 200 ms: <b>1, 1, 2, 2, 3, 3, 1, 1, 2</b></li>${EX}`,
    lr: () => `<li>Contador por réplica: o próximo vai para o <b>menor</b>; no empate, para o primeiro da lista</li><li>Réplicas juntas desde o início: <b>3 · 3 · 3</b>, igual ao round robin</li><li>catalogo-4 entra com <b>0</b> contra <b>3.000</b>: os próximos <b>3.000</b> pedidos vão todos para ele</li><li>Saída: zerar os contadores de tempos em tempos ou contar só uma janela recente.</li>${EX}`,
    lc: () => `<table class="h3-sum"><tr><th>réplica</th><th>conexões</th><th>com pedido</th><th>paradas</th></tr><tr><td>catalogo-1</td><td>5</td><td>0</td><td>5</td></tr><tr class="on"><td>catalogo-2</td><td>3</td><td>3 buscas</td><td>0</td></tr><tr><td>catalogo-3</td><td>4</td><td>1</td><td>3</td></tr></table><li>Least connection: min(5, 3, 4) = 3 → <b>catalogo-2</b>, o mais ocupado</li><li>Keep-alive deixa a conexão aberta depois da resposta; ela conta como conexão sem dar trabalho.</li>${EX}`,
    lor: () => `<table class="h3-sum"><tr><th>réplica</th><th>conexões (LC)</th><th>pendentes (LOR)</th></tr><tr class="on"><td>catalogo-1</td><td>5</td><td>0</td></tr><tr><td>catalogo-2</td><td>3</td><td>3</td></tr><tr><td>catalogo-3</td><td>4</td><td>1</td></tr></table><li>LOR: min(0, 3, 1) = 0 → <b>catalogo-1</b>, que responde o gato em 20 ms</li><li>Réplica que responde 500 em 1 ms fica sempre com 0 pendentes: precisa de healthcheck ou detecção de outliers (o Envoy tira o host depois de 5xx seguidos).</li>${EX}`,
    hash: () => `<table class="h3-sum"><tr><th>cliente</th><th>IP</th><th>h</th><th>h % 3</th></tr>${'LBCD'.split('').map(c => `<tr${c === 'L' ? ' class="on"' : ''}><td>${CLI[c].n}</td><td>${CLI[c].ip}</td><td>${CLI[c].h}</td><td>${CLI[c].h % 3} → catalogo-${CLI[c].h % 3 + 1}</td></tr>`).join('')}</table>
      <li>O h do exemplo usa os dois últimos números do IP: 20 × 256 + 5 = <b>5125</b>. NGINX e Envoy usam funções de hash de verdade; a ideia é a mesma.</li><li>Sem o catalogo-3: com % 2, cerca de <b>2/3</b> trocam (fica só quem tem h % 6 = 0 ou 1); com hashing consistente ou Maglev, só <b>1/3</b> (quem estava no 3).</li><li>NAT: <b>500</b> pessoas atrás de <b>187.11.90.2</b> → todas no catalogo-3.</li>${EX}`,
    random: () => `<li>Sorteio dos 10 pedidos deste exemplo: <b>2, 1, 2, 3, 2, 2, 3, 1, 2, 3</b> → <b>2 · 5 · 3</b></li><li>Trabalho: catalogo-1 <b>1.800 ms</b> (P2 e P8, buscas) · catalogo-2 <b>980 ms</b> · catalogo-3 <b>60 ms</b></li><li>10.000 pedidos: <b>3.341 · 3.329 · 3.330</b>, perto de 1/3 cada</li>${EX}`,
  };
  function countHtml() { const o = SP || spec();
    return `<table class="h3-sum b3-cnt"><tr><th>réplica</th><th>${o.metricLab}</th><th>trabalho</th></tr>${o.rep.map((r, k) => { const v = r.val != null ? r.val : r.n;
      return `<tr${o.on['r' + k] ? ' class="on"' : ''}><td>${REP[k].n}</td><td>${r.st === 'out' ? 'fora do pool' : r.st === 'dead' ? (sc === 'lor' ? '500 em 1 ms' : 'travado') : nf(v)}</td><td>${r.noBar ? '—' : r.cpu != null ? 'CPU ' + r.cpu + '%' : nf(r.ms) + ' ms'}</td></tr>`; }).join('')}</table>`; }
  const cfgHtml = o => `<b>${o.cfg[0]}</b>${o.cfg.slice(1).join('\n').replace(/</g, '&lt;')}`;
  function panelHtml() {
    const s = cur(), o = SP || spec();
    return `<div class="o3-head"><span>Passo ${step + 1} de ${N()}</span><span>${SCFULL[sc]}</span></div>
      <div class="o3-bar"><i style="width:${((step + 1) / N() * 100).toFixed(1)}%"></i></div>
      <div class="o3-mode" role="group" aria-label="Cenário">${SC.map((v, i) => `<button data-sc="${v}" aria-pressed="${v === sc}" title="tecla ${i + 1}">${SCNAME[v]}</button>`).join('')}</div>
      <h2>${s.title}</h2>
      <div id="b3count">${countHtml()}</div>
      <div class="i3-sql">${cfgHtml(o)}</div>
      <p class="o3-story">${s.story}</p>
      <p class="o3-look"><b>Olhe no desenho</b>${s.look}</p>
      <p class="o3-key"><b>Em uma frase</b>${s.key}</p>
      <details class="o3-dv"${NARROW() ? '' : ' open'}><summary>Dados reais</summary><ul class="h3-now">${DATA[sc]()}</ul></details>`;
  }
  const backLink = () => { const a = document.querySelector('.o3-back'); if (a) a.setAttribute('href', '../#' + AULA[sc]); };
  function readout() { if (active !== 'lb') return; const o = SP || spec();
    document.getElementById('read').textContent = `passo ${step + 1}/${N()} · ${SCNAME[sc].toLowerCase()} · ${o.rep.map(r => nf(r.val != null ? r.val : r.n)).join(' · ')} ${o.metricLab}`; }
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
    panel: [[UI.next, '→', next], [UI.prev, '←', prev], [UI.restart, 'R', reset], [UI.auto, UI.space, auto], ['Trocar cenário', 'C', cycleSc]],
    view: NARROW() ? { target: W(330, 230, -150), dist: innerWidth < 640 ? 12 : 15 } : { target: W(85, 230, 60), dist: 14 },
    info: panelHtml(),
    hint: 'próximo: → · voltar: ← · cenário: C ou 1–8 · arraste para girar' };
})() });
